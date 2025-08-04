import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { format } from "date-fns";
import "./App.css";

interface Memo {
  slug: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  url?: string;
}

type ExportFormat = "json" | "markdown" | "table";
type ViewMode = "list" | "search" | "settings";

function App() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [filteredMemos, setFilteredMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("markdown");

  // Load saved token on mount
  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const savedToken = await invoke<string | null>("load_config");
      if (savedToken) {
        setToken(savedToken);
      }
    } catch (err) {
      console.error("Failed to load token:", err);
    }
  };

  const saveToken = async () => {
    try {
      await invoke("save_config", { token });
      setError(null);
      alert("Token saved successfully!");
    } catch (err) {
      setError(`Failed to save token: ${err}`);
    }
  };

  const fetchMemos = async () => {
    if (!token) {
      setError("Please configure your token first");
      setViewMode("settings");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await invoke<Memo[]>("get_memos", { token });
      setMemos(result);
      setFilteredMemos(result);
    } catch (err) {
      setError(`Failed to fetch memos: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const searchMemos = useCallback(async () => {
    if (!searchQuery.trim()) {
      setFilteredMemos(memos);
      return;
    }

    if (!token) {
      setError("Please configure your token first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await invoke<Memo[]>("search_memos", { 
        token, 
        query: searchQuery 
      });
      setFilteredMemos(result);
    } catch (err) {
      setError(`Search failed: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, token, memos]);

  useEffect(() => {
    if (viewMode === "search") {
      searchMemos();
    }
  }, [searchQuery, viewMode, searchMemos]);

  const exportMemos = async () => {
    if (filteredMemos.length === 0) {
      alert("No memos to export");
      return;
    }

    try {
      let content: string;
      let defaultName: string;
      let filters: { name: string; extensions: string[] }[];

      switch (selectedFormat) {
        case "json":
          content = await invoke<string>("format_memos_json", { 
            memos: filteredMemos 
          });
          defaultName = `flomo_export_${format(new Date(), "yyyyMMdd_HHmmss")}.json`;
          filters = [{ name: "JSON", extensions: ["json"] }];
          break;
        case "markdown":
          content = await invoke<string>("format_memos_markdown", { 
            memos: filteredMemos 
          });
          defaultName = `flomo_export_${format(new Date(), "yyyyMMdd_HHmmss")}.md`;
          filters = [{ name: "Markdown", extensions: ["md"] }];
          break;
        case "table":
          content = await invoke<string>("format_memos_table", { 
            memos: filteredMemos 
          });
          defaultName = `flomo_export_${format(new Date(), "yyyyMMdd_HHmmss")}.txt`;
          filters = [{ name: "Text", extensions: ["txt"] }];
          break;
        default:
          return;
      }

      const path = await save({
        defaultPath: defaultName,
        filters,
      });

      if (path) {
        await writeTextFile(path, content);
        alert(`Exported ${filteredMemos.length} memos to ${path}`);
      }
    } catch (err) {
      setError(`Export failed: ${err}`);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "yyyy-MM-dd HH:mm");
    } catch {
      return dateStr;
    }
  };

  const renderMemo = (memo: Memo, index: number) => (
    <div key={memo.slug} className="memo-item">
      <div className="memo-header">
        <span className="memo-index">#{index + 1}</span>
        <span className="memo-date">{formatDate(memo.created_at)}</span>
      </div>
      <div className="memo-content">{memo.content}</div>
      {memo.tags.length > 0 && (
        <div className="memo-tags">
          {memo.tags.map((tag, i) => (
            <span key={i} className="tag">#{tag}</span>
          ))}
        </div>
      )}
      {memo.url && (
        <div className="memo-footer">
          <a 
            href={memo.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="memo-link"
          >
            View on Flomo →
          </a>
        </div>
      )}
    </div>
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>Flomo Garden</h1>
        <nav className="nav-buttons">
          <button 
            className={viewMode === "list" ? "active" : ""}
            onClick={() => setViewMode("list")}
          >
            Memos
          </button>
          <button 
            className={viewMode === "search" ? "active" : ""}
            onClick={() => setViewMode("search")}
          >
            Search
          </button>
          <button 
            className={viewMode === "settings" ? "active" : ""}
            onClick={() => setViewMode("settings")}
          >
            Settings
          </button>
        </nav>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {viewMode === "settings" && (
          <div className="settings-view">
            <h2>Configuration</h2>
            <div className="form-group">
              <label htmlFor="token">Bearer Token:</label>
              <input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your Flomo Bearer token"
                className="token-input"
              />
              <button onClick={saveToken} className="save-button">
                Save Token
              </button>
            </div>
            <div className="help-text">
              <p>To get your token:</p>
              <ol>
                <li>Open Flomo web app</li>
                <li>Open Developer Tools (F12)</li>
                <li>Go to Network tab</li>
                <li>Refresh the page</li>
                <li>Look for API requests and find the Authorization header</li>
                <li>Copy the Bearer token value</li>
              </ol>
            </div>
          </div>
        )}

        {viewMode === "list" && (
          <div className="list-view">
            <div className="toolbar">
              <button 
                onClick={fetchMemos} 
                disabled={loading}
                className="fetch-button"
              >
                {loading ? "Loading..." : "Fetch Memos"}
              </button>
              <div className="export-controls">
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                  className="format-select"
                >
                  <option value="markdown">Markdown</option>
                  <option value="json">JSON</option>
                  <option value="table">Table</option>
                </select>
                <button 
                  onClick={exportMemos}
                  disabled={filteredMemos.length === 0}
                  className="export-button"
                >
                  Export
                </button>
              </div>
            </div>
            
            {filteredMemos.length > 0 && (
              <div className="memo-stats">
                Total: {filteredMemos.length} memos
              </div>
            )}

            <div className="memos-container">
              {loading && <div className="loading">Loading memos...</div>}
              {!loading && filteredMemos.length === 0 && (
                <div className="empty-state">
                  No memos found. Click "Fetch Memos" to load your notes.
                </div>
              )}
              {!loading && filteredMemos.map((memo, index) => renderMemo(memo, index))}
            </div>
          </div>
        )}

        {viewMode === "search" && (
          <div className="search-view">
            <div className="search-bar">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memos..."
                className="search-input"
              />
            </div>
            
            {filteredMemos.length > 0 && (
              <div className="memo-stats">
                Found: {filteredMemos.length} memos
              </div>
            )}

            <div className="memos-container">
              {loading && <div className="loading">Searching...</div>}
              {!loading && searchQuery && filteredMemos.length === 0 && (
                <div className="empty-state">
                  No memos found matching "{searchQuery}"
                </div>
              )}
              {!loading && filteredMemos.map((memo, index) => renderMemo(memo, index))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;