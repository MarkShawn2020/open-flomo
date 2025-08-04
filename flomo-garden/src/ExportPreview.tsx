import { useState, useEffect, useCallback } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { format } from "date-fns";
import "./ExportPreview.css";

interface Memo {
  slug: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  url?: string;
}

interface ExportPreviewProps {
  memos: Memo[];
  onClose: () => void;
}

type ExportFormat = "json" | "markdown" | "table";
type UrlMode = "full" | "id" | "none";
type OrderBy = "created_at" | "updated_at";
type OrderDir = "asc" | "desc";

export function ExportPreview({ memos, onClose }: ExportPreviewProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("markdown");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [minimalMode, setMinimalMode] = useState(false);
  const [compactJson, setCompactJson] = useState(false);
  const [urlMode, setUrlMode] = useState<UrlMode>("full");
  const [orderBy, setOrderBy] = useState<OrderBy>("created_at");
  const [orderDir, setOrderDir] = useState<OrderDir>("desc");
  const [limit, setLimit] = useState<number | "">(memos.length);
  const [preview, setPreview] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sort and limit memos based on current settings
  const getProcessedMemos = useCallback(() => {
    // Sort memos
    const sorted = [...memos].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      
      if (orderDir === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply limit
    const limitNum = typeof limit === "number" ? limit : sorted.length;
    return sorted.slice(0, Math.min(limitNum, sorted.length));
  }, [memos, orderBy, orderDir, limit]);

  // Generate preview whenever settings change
  useEffect(() => {
    const generatePreview = async () => {
      try {
        const processedMemos = getProcessedMemos();
        let content: string;

        switch (selectedFormat) {
          case "json":
            content = await invoke<string>("format_memos_json_with_options", { 
              memos: processedMemos,
              compact: compactJson,
              includeMetadata
            });
            break;
          case "markdown":
            content = await invoke<string>("format_memos_markdown_with_options", { 
              memos: processedMemos,
              urlMode,
              includeMetadata,
              minimal: minimalMode
            });
            break;
          case "table":
            content = await invoke<string>("format_memos_table", { 
              memos: processedMemos 
            });
            break;
          default:
            content = "";
        }

        setPreview(content);
      } catch (err) {
        console.error("Failed to generate preview:", err);
        setPreview("Failed to generate preview");
      }
    };

    generatePreview();
  }, [selectedFormat, includeMetadata, minimalMode, compactJson, urlMode, getProcessedMemos]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);

      let defaultName: string;
      let filters: { name: string; extensions: string[] }[];

      switch (selectedFormat) {
        case "json":
          defaultName = `flomo_export_${format(new Date(), "yyyyMMdd_HHmmss")}.json`;
          filters = [{ name: "JSON", extensions: ["json"] }];
          break;
        case "markdown":
          defaultName = `flomo_export_${format(new Date(), "yyyyMMdd_HHmmss")}.md`;
          filters = [{ name: "Markdown", extensions: ["md"] }];
          break;
        case "table":
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
        await writeTextFile(path, preview);
        alert(`Exported ${getProcessedMemos().length} memos to ${path}`);
        onClose();
      }
    } catch (err) {
      setError(`Export failed: ${err}`);
    } finally {
      setIsExporting(false);
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
    </div>
  );

  const processedMemos = getProcessedMemos();

  return (
    <div className="export-preview-container">
      <div className="export-header">
        <h2>Export Preview</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="export-body">
        {/* Left column: Original memos */}
        <div className="export-left-column">
          <div className="column-header">
            <h3>Original Memos ({processedMemos.length} / {memos.length})</h3>
          </div>
          <div className="memos-list">
            {processedMemos.map((memo, index) => renderMemo(memo, index))}
          </div>
        </div>

        {/* Right column: Preview and options */}
        <div className="export-right-column">
          <div className="export-options">
            <h3>Export Options</h3>
            
            {/* Format selection */}
            <div className="option-group">
              <label>Format:</label>
              <select 
                value={selectedFormat} 
                onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
              >
                <option value="markdown">Markdown</option>
                <option value="json">JSON</option>
                <option value="table">Table</option>
              </select>
            </div>

            {/* Sort options */}
            <div className="option-group">
              <label>Sort by:</label>
              <select 
                value={orderBy} 
                onChange={(e) => setOrderBy(e.target.value as OrderBy)}
              >
                <option value="created_at">Created Date</option>
                <option value="updated_at">Updated Date</option>
              </select>
              <select 
                value={orderDir} 
                onChange={(e) => setOrderDir(e.target.value as OrderDir)}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>

            {/* Limit */}
            <div className="option-group">
              <label>Limit:</label>
              <input 
                type="number" 
                min="1" 
                max={memos.length}
                value={limit}
                onChange={(e) => setLimit(e.target.value ? parseInt(e.target.value) : "")}
                placeholder={`All (${memos.length})`}
              />
            </div>

            {/* Format-specific options */}
            {selectedFormat === "markdown" && (
              <>
                <div className="option-group">
                  <label>URL Mode:</label>
                  <select 
                    value={urlMode} 
                    onChange={(e) => setUrlMode(e.target.value as UrlMode)}
                  >
                    <option value="full">Full URL</option>
                    <option value="id">ID Only</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div className="option-group checkbox-group">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={minimalMode}
                      onChange={(e) => setMinimalMode(e.target.checked)}
                    />
                    Minimal mode (for AI)
                  </label>
                </div>
              </>
            )}

            {selectedFormat === "json" && (
              <div className="option-group checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={compactJson}
                    onChange={(e) => setCompactJson(e.target.checked)}
                  />
                  Compact JSON
                </label>
              </div>
            )}

            {(selectedFormat === "markdown" || selectedFormat === "json") && (
              <div className="option-group checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                  />
                  Include metadata
                </label>
              </div>
            )}

            {/* Export action */}
            <div className="export-actions">
              <button 
                className="export-button primary"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? "Exporting..." : "Export to File"}
              </button>
            </div>

            {error && (
              <div className="error-message">{error}</div>
            )}
          </div>

          {/* Preview area */}
          <div className="preview-area">
            <div className="preview-header">
              <h3>Preview</h3>
            </div>
            <pre className="preview-content">{preview}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}