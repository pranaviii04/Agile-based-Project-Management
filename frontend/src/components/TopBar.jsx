import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Sun, Moon, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { getProjects } from "../services/projectService";

function TopBar({ collapsed }) {
  const { theme, toggleTheme } = useTheme();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Preload projects for command palette
  useEffect(() => {
    getProjects().then(setProjects).catch(() => {});
  }, []);

  // Global Cmd+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when palette opens
  useEffect(() => {
    if (cmdOpen) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [cmdOpen]);

  // Filtered results
  const filtered = query.trim()
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(query.toLowerCase())
      )
    : projects.slice(0, 6);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIdx]) {
        navigate(`/projects/${filtered[selectedIdx].id}`);
        setCmdOpen(false);
      }
    },
    [filtered, selectedIdx, navigate]
  );

  return (
    <>
      <header className={`topbar${collapsed ? " collapsed" : ""}`}>
        {/* Search trigger */}
        <div
          className="search-bar"
          onClick={() => setCmdOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setCmdOpen(true)}
        >
          <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            Search projects…
          </span>
          <kbd
            style={{
              marginLeft: "auto", padding: "2px 7px", borderRadius: "5px",
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              fontSize: "11px", color: "var(--text-muted)", fontFamily: "inherit", whiteSpace: "nowrap",
            }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Right actions */}
        <div className="topbar-actions">
          {/* Notifications (static badge) */}
          <button className="icon-btn" title="Notifications">
            <Bell size={17} />
            <span className="notif-badge">3</span>
          </button>

          {/* Dark mode toggle */}
          <button className="icon-btn" onClick={toggleTheme} title="Toggle dark mode">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* Command Palette */}
      {cmdOpen && (
        <div className="cmd-backdrop" onClick={() => setCmdOpen(false)}>
          <div className="cmd-box" onClick={(e) => e.stopPropagation()}>
            <div className="cmd-input">
              <Search size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search projects…"
                autoComplete="off"
              />
              <button
                onClick={() => setCmdOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="cmd-results">
              {filtered.length === 0 ? (
                <div className="cmd-empty">No results for "{query}"</div>
              ) : (
                <>
                  <div className="cmd-group-label">Projects</div>
                  {filtered.map((p, i) => (
                    <div
                      key={p.id}
                      className={`cmd-item${i === selectedIdx ? " selected" : ""}`}
                      onClick={() => { navigate(`/projects/${p.id}`); setCmdOpen(false); }}
                      onMouseEnter={() => setSelectedIdx(i)}
                    >
                      <span style={{ fontSize: "20px" }}>📁</span>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
                          {p.name}
                        </div>
                        {p.description && (
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "400px" }}>
                            {p.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: "16px" }}>
              {[["↑↓","Navigate"],["↵","Open"],["Esc","Close"]].map(([key, label]) => (
                <span key={key} style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", gap: "5px" }}>
                  <kbd style={{ padding: "1px 5px", borderRadius: "4px", background: "var(--bg-hover)", border: "1px solid var(--border)", fontSize: "11px", fontFamily: "inherit" }}>{key}</kbd>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TopBar;
