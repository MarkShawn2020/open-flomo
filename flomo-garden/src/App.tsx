import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { useInfiniteQuery } from "@tanstack/react-query";
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

interface PagedResponse {
  memos: Memo[];
  has_more: boolean;
  next_slug?: string;
  next_updated_at?: number;
}

type ExportFormat = "json" | "markdown" | "table";
type ViewMode = "list" | "search" | "settings";

function App() {
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("markdown");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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

  // Infinite query for memos list
  const {
    data: memosData,
    fetchNextPage: fetchNextMemos,
    hasNextPage: hasNextMemos,
    isFetchingNextPage: isFetchingNextMemos,
    isLoading: isLoadingMemos,
    isError: isErrorMemos,
    error: memosError,
    refetch: refetchMemos,
  } = useInfiniteQuery({
    queryKey: ["memos", token],
    queryFn: async ({ pageParam }) => {
      if (!token) throw new Error("No token configured");
      
      const response = await invoke<PagedResponse>("get_memos_page", {
        token,
        latestSlug: pageParam?.slug || null,
        latestUpdatedAt: pageParam?.updatedAt || null,
      });
      
      return response;
    },
    initialPageParam: null as { slug: string; updatedAt: number } | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more || !lastPage.next_slug) return undefined;
      return {
        slug: lastPage.next_slug,
        updatedAt: lastPage.next_updated_at || 0,
      };
    },
    enabled: viewMode === "list" && !!token,
  });

  // Infinite query for search
  const {
    data: searchData,
    fetchNextPage: fetchNextSearch,
    hasNextPage: hasNextSearch,
    isFetchingNextPage: isFetchingNextSearch,
    isLoading: isLoadingSearch,
    isError: isErrorSearch,
    error: searchError,
  } = useInfiniteQuery({
    queryKey: ["search", token, searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      if (!token) throw new Error("No token configured");
      
      const response = await invoke<PagedResponse>("search_memos_page", {
        token,
        query: searchQuery,
        offset: pageParam,
        limit: 50,
      });
      
      return { ...response, offset: pageParam };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more) return undefined;
      return (lastPage as any).offset + 50;
    },
    enabled: viewMode === "search" && !!token && searchQuery.trim().length > 0,
  });

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (viewMode === "list" && hasNextMemos && !isFetchingNextMemos) {
            fetchNextMemos();
          } else if (viewMode === "search" && hasNextSearch && !isFetchingNextSearch) {
            fetchNextSearch();
          }
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [
    viewMode,
    hasNextMemos,
    hasNextSearch,
    isFetchingNextMemos,
    isFetchingNextSearch,
    fetchNextMemos,
    fetchNextSearch,
  ]);

  const getAllMemos = useCallback(() => {
    if (viewMode === "list") {
      return memosData?.pages.flatMap((page) => page.memos) || [];
    } else {
      return searchData?.pages.flatMap((page) => page.memos) || [];
    }
  }, [memosData, searchData, viewMode]);

  const exportMemos = async () => {
    // For export, we need to fetch ALL memos, not just the currently loaded ones
    try {
      const allMemos = await invoke<Memo[]>("get_memos", { token });
      
      if (allMemos.length === 0) {
        alert("No memos to export");
        return;
      }

      let content: string;
      let defaultName: string;
      let filters: { name: string; extensions: string[] }[];

      switch (selectedFormat) {
        case "json":
          content = await invoke<string>("format_memos_json", { 
            memos: allMemos 
          });
          defaultName = `flomo_export_${format(new Date(), "yyyyMMdd_HHmmss")}.json`;
          filters = [{ name: "JSON", extensions: ["json"] }];
          break;
        case "markdown":
          content = await invoke<string>("format_memos_markdown", { 
            memos: allMemos 
          });
          defaultName = `flomo_export_${format(new Date(), "yyyyMMdd_HHmmss")}.md`;
          filters = [{ name: "Markdown", extensions: ["md"] }];
          break;
        case "table":
          content = await invoke<string>("format_memos_table", { 
            memos: allMemos 
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
        alert(`Exported ${allMemos.length} memos to ${path}`);
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

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Flomo Garden</h1>
        <nav className="nav-buttons">
          <button 
            className={viewMode === "list" ? "active" : ""}
            onClick={() => handleViewModeChange("list")}
          >
            Memos
          </button>
          <button 
            className={viewMode === "search" ? "active" : ""}
            onClick={() => handleViewModeChange("search")}
          >
            Search
          </button>
          <button 
            className={viewMode === "settings" ? "active" : ""}
            onClick={() => handleViewModeChange("settings")}
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
            {!token ? (
              <div className="empty-state">
                Please configure your token in Settings first.
              </div>
            ) : (
              <>
                <div className="toolbar">
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
                      disabled={getAllMemos().length === 0}
                      className="export-button"
                    >
                      Export ({getAllMemos().length} memos)
                    </button>
                  </div>
                  {isErrorMemos && (
                    <button onClick={() => refetchMemos()} className="fetch-button">
                      Retry
                    </button>
                  )}
                </div>
                
                {getAllMemos().length > 0 && (
                  <div className="memo-stats">
                    Loaded: {getAllMemos().length} memos
                  </div>
                )}

                <div className="memos-container">
                  {isLoadingMemos && (
                    <div className="loading">Loading memos...</div>
                  )}
                  
                  {isErrorMemos && (
                    <div className="error-message">
                      Failed to load memos: {memosError?.message || "Unknown error"}
                    </div>
                  )}
                  
                  {!isLoadingMemos && !isErrorMemos && getAllMemos().length === 0 && (
                    <div className="empty-state">
                      No memos found.
                    </div>
                  )}
                  
                  {getAllMemos().map((memo, index) => renderMemo(memo, index))}
                  
                  {(hasNextMemos || isFetchingNextMemos) && (
                    <div ref={loadMoreRef} className="load-more">
                      {isFetchingNextMemos ? (
                        <div className="loading">Loading more...</div>
                      ) : (
                        <div className="loading-trigger">Scroll for more</div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
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
            
            {searchQuery.trim() && getAllMemos().length > 0 && (
              <div className="memo-stats">
                Found: {getAllMemos().length} memos
              </div>
            )}

            <div className="memos-container">
              {isLoadingSearch && (
                <div className="loading">Searching...</div>
              )}
              
              {isErrorSearch && (
                <div className="error-message">
                  Search failed: {searchError?.message || "Unknown error"}
                </div>
              )}
              
              {!isLoadingSearch && searchQuery.trim() && getAllMemos().length === 0 && (
                <div className="empty-state">
                  No memos found matching "{searchQuery}"
                </div>
              )}
              
              {getAllMemos().map((memo, index) => renderMemo(memo, index))}
              
              {(hasNextSearch || isFetchingNextSearch) && (
                <div ref={loadMoreRef} className="load-more">
                  {isFetchingNextSearch ? (
                    <div className="loading">Loading more...</div>
                  ) : (
                    <div className="loading-trigger">Scroll for more</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;