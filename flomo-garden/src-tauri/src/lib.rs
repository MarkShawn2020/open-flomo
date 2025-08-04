use chrono::DateTime;
use reqwest::header::{HeaderMap, HeaderValue};
use serde::{Deserialize, Serialize};
use md5;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Memo {
    pub slug: String,
    pub content: String,
    pub created_at: String,
    pub updated_at: String,
    pub tags: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ApiResponse {
    code: i32,
    data: Option<Vec<ApiMemo>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ApiMemo {
    slug: String,
    content: String,
    created_at: String,
    updated_at: String,
    tags: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AppConfig {
    authorization: Option<String>,
}

pub struct FlomoClient {
    token: String,
    client: reqwest::Client,
}

impl FlomoClient {
    const LIMIT: usize = 200;
    const URL_UPDATED: &'static str = "https://flomoapp.com/api/v1/memo/updated/";
    const SALT: &'static str = "dbbc3dd73364b4084c3a69346e0ce2b2";

    pub fn new(token: String) -> Self {
        let client = reqwest::Client::new();
        let token = if token.starts_with("Bearer ") {
            token
        } else {
            format!("Bearer {}", token)
        };
        
        Self { token, client }
    }

    fn get_params(&self, latest_slug: Option<&str>, latest_updated_at: Option<i64>) -> HashMap<String, String> {
        let mut params = HashMap::new();
        params.insert("limit".to_string(), Self::LIMIT.to_string());
        params.insert("tz".to_string(), "8:0".to_string());
        params.insert("timestamp".to_string(), chrono::Utc::now().timestamp().to_string());
        params.insert("api_key".to_string(), "flomo_web".to_string());
        params.insert("app_version".to_string(), "5.25.64".to_string());
        params.insert("platform".to_string(), "mac".to_string());
        params.insert("webp".to_string(), "1".to_string());
        
        println!("[DEBUG] Base params before pagination: {:?}", params);

        if let (Some(slug), Some(updated_at)) = (latest_slug, latest_updated_at) {
            params.insert("latest_slug".to_string(), slug.to_string());
            params.insert("latest_updated_at".to_string(), updated_at.to_string());
        }

        // Generate sign (using MD5 to match Python implementation)
        let mut sorted_params: Vec<(&String, &String)> = params.iter().collect();
        sorted_params.sort_by_key(|&(k, _)| k);
        
        let param_str = sorted_params
            .iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect::<Vec<_>>()
            .join("&");
        
        let sign_str = format!("{}{}", param_str, Self::SALT);
        
        // Debug logging
        println!("[DEBUG] Sorted params: {:?}", sorted_params);
        println!("[DEBUG] Param string: {}", param_str);
        println!("[DEBUG] Sign string: {}", sign_str);
        
        let sign = format!("{:x}", md5::compute(sign_str.as_bytes()));
        
        println!("[DEBUG] Generated MD5 sign: {}", sign);
        
        params.insert("sign".to_string(), sign);
        params
    }

    pub async fn get_all_memos(&self) -> Result<Vec<Memo>, String> {
        let mut all_memos = Vec::new();
        let mut latest_slug: Option<String> = None;
        let mut latest_updated_at: Option<i64> = None;

        loop {
            let params = self.get_params(latest_slug.as_deref(), latest_updated_at);
            
            // Debug logging for request details
            println!("[DEBUG] Request URL: {}", Self::URL_UPDATED);
            println!("[DEBUG] Authorization token: {}", self.token);
            println!("[DEBUG] Request params: {:?}", params);
            
            let mut headers = HeaderMap::new();
            headers.insert(
                "authorization",
                HeaderValue::from_str(&self.token).map_err(|e| {
                    println!("[ERROR] Failed to create auth header: {}", e);
                    e.to_string()
                })?,
            );

            println!("[DEBUG] Request headers: {:?}", headers);

            let response = self.client
                .get(Self::URL_UPDATED)
                .headers(headers)
                .query(&params)
                .send()
                .await
                .map_err(|e| {
                    println!("[ERROR] HTTP request failed: {}", e);
                    e.to_string()
                })?;

            println!("[DEBUG] Response status: {}", response.status());
            println!("[DEBUG] Response headers: {:?}", response.headers());
            
            // Get response text first for debugging
            let response_text = response.text().await.map_err(|e| {
                println!("[ERROR] Failed to get response text: {}", e);
                e.to_string()
            })?;
            
            println!("[DEBUG] Response body: {}", response_text);
            
            // Parse the response
            let api_response: ApiResponse = serde_json::from_str(&response_text).map_err(|e| {
                println!("[ERROR] Failed to parse JSON response: {}", e);
                format!("JSON parse error: {} - Response was: {}", e, response_text)
            })?;

            println!("[DEBUG] Parsed API response code: {}", api_response.code);

            if api_response.code != 0 {
                println!("[ERROR] API returned error code: {}", api_response.code);
                return Err(format!("API error: code {} - Response: {}", api_response.code, response_text));
            }

            let memos = api_response.data.unwrap_or_default();
            
            if memos.is_empty() {
                break;
            }

            let should_continue = memos.len() >= Self::LIMIT;
            
            if should_continue {
                let last_memo = &memos[memos.len() - 1];
                latest_slug = Some(last_memo.slug.clone());
                
                if let Ok(dt) = DateTime::parse_from_rfc3339(&last_memo.updated_at) {
                    latest_updated_at = Some(dt.timestamp());
                }
            }

            // Convert API memos to our Memo struct
            for api_memo in memos {
                let memo = Memo {
                    slug: api_memo.slug.clone(),
                    content: parse_html_to_text(&api_memo.content),
                    created_at: api_memo.created_at,
                    updated_at: api_memo.updated_at,
                    tags: api_memo.tags,
                    url: Some(format!("https://v.flomoapp.com/mine/?memo_id={}", api_memo.slug)),
                };
                all_memos.push(memo);
            }

            if !should_continue {
                break;
            }
        }

        Ok(all_memos)
    }
}

fn parse_html_to_text(html: &str) -> String {
    // Simple HTML to text conversion
    html2text::from_read(html.as_bytes(), 80)
}

// Tauri commands
#[tauri::command]
async fn get_memos(token: String) -> Result<Vec<Memo>, String> {
    let client = FlomoClient::new(token);
    client.get_all_memos().await
}

#[tauri::command]
async fn search_memos(token: String, query: String) -> Result<Vec<Memo>, String> {
    let client = FlomoClient::new(token);
    let all_memos = client.get_all_memos().await?;
    
    let filtered: Vec<Memo> = all_memos
        .into_iter()
        .filter(|memo| {
            memo.content.to_lowercase().contains(&query.to_lowercase())
                || memo.tags.iter().any(|tag| tag.to_lowercase().contains(&query.to_lowercase()))
        })
        .collect();
    
    Ok(filtered)
}

#[tauri::command]
async fn save_config(app: tauri::AppHandle, token: String) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;
    
    let store = app.store("config.json").map_err(|e| e.to_string())?;
    store.set("authorization", serde_json::Value::String(token));
    store.save().map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn load_config(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_store::StoreExt;
    
    let store = app.store("config.json").map_err(|e| e.to_string())?;
    
    if let Some(value) = store.get("authorization") {
        if let Some(token) = value.as_str() {
            return Ok(Some(token.to_string()));
        }
    }
    
    Ok(None)
}

#[tauri::command]
fn format_memos_json(memos: Vec<Memo>) -> String {
    serde_json::to_string_pretty(&memos).unwrap_or_default()
}

#[tauri::command]
fn format_memos_markdown(memos: Vec<Memo>) -> String {
    let mut output = String::from("# Flomo 备忘录\n\n");
    
    for (index, memo) in memos.iter().enumerate() {
        output.push_str(&format!("## {}. {}\n\n", index + 1, memo.created_at));
        output.push_str(&format!("{}\n\n", memo.content));
        
        if let Some(url) = &memo.url {
            output.push_str(&format!("**链接**: {}\n", url));
        }
        
        if !memo.tags.is_empty() {
            output.push_str(&format!("**标签**: {}\n", memo.tags.join(", ")));
        }
        
        output.push_str("\n---\n\n");
    }
    
    output
}

#[tauri::command]
fn format_memos_table(memos: Vec<Memo>) -> String {
    let mut output = String::from("序号 | 创建时间          | 内容预览\n");
    output.push_str(&"-".repeat(50));
    output.push('\n');
    
    for (index, memo) in memos.iter().enumerate() {
        let content_preview = memo.content
            .replace('\n', " ")
            .chars()
            .take(30)
            .collect::<String>();
        
        let created_at = memo.created_at.split(' ').next().unwrap_or(&memo.created_at);
        output.push_str(&format!("{:2}   | {:17} | {}\n", 
            index + 1, 
            created_at,
            if content_preview.len() >= 30 {
                format!("{}...", content_preview)
            } else {
                content_preview
            }
        ));
    }
    
    output
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_memos,
            search_memos,
            save_config,
            load_config,
            format_memos_json,
            format_memos_markdown,
            format_memos_table
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}