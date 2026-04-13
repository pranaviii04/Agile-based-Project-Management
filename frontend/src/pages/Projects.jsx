import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProjects, createProject } from "../services/projectService";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import { SkeletonGrid } from "../components/Skeleton";
import { LayoutGrid, List, Plus, Search, FolderKanban } from "lucide-react";

function avatarColor(name = "") {
  const colors = ["#2563EB","#7C3AED","#059669","#D97706","#E11D48","#0891B2"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % colors.length;
  return colors[h];
}

function ProjectGridCard({ project }) {
  const navigate = useNavigate();
  const initial = project.name?.[0]?.toUpperCase() || "P";
  const color = avatarColor(project.name);
  const date = new Date(project.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div
      className="card card-clickable fade-up"
      onClick={() => navigate(`/projects/${project.id}`)}
      style={{ display: "flex", flexDirection: "column", gap: "14px" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "18px", fontWeight: "800", flexShrink: 0 }}>
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {project.name}
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>{date}</p>
        </div>
      </div>

      {project.description && (
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5 }}>
          {project.description}
        </p>
      )}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Progress</span>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--accent)" }}>—%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: "0%" }} />
        </div>
      </div>
    </div>
  );
}

function ProjectListRow({ project }) {
  const navigate = useNavigate();
  const color = avatarColor(project.name);
  const initial = project.name?.[0]?.toUpperCase() || "P";
  const date = new Date(project.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div
      className="card card-clickable"
      style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", cursor: "pointer" }}
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: "700", flexShrink: 0 }}>
        {initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {project.name}
        </h3>
        {project.description && (
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {project.description}
          </p>
        )}
      </div>
      <span style={{ fontSize: "12px", color: "var(--text-muted)", flexShrink: 0 }}>{date}</span>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("projects-view") || "grid");

  // Create modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch {
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createProject({ name: form.name, description: form.description || null });
      toast.success(`Project "${form.name}" created!`);
      setForm({ name: "", description: "" });
      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create project.");
    } finally {
      setCreating(false);
    }
  };

  const setView = (v) => { setViewMode(v); localStorage.setItem("projects-view", v); };

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="page-wrap">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? "s" : ""} in your workspace</p>
        </div>
        {isAdmin && (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} />
            New Project
          </button>
        )}
      </div>

      {/* Search + View toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search projects…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input"
            style={{ paddingLeft: "36px" }}
          />
        </div>
        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
          {[["grid", LayoutGrid], ["list", List]].map(([v, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "8px 12px", border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                background: viewMode === v ? "var(--accent-light)" : "var(--bg-surface)",
                color: viewMode === v ? "var(--accent-text)" : "var(--text-muted)",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && <div className="alert-error" style={{ marginBottom: "16px" }}>{error}</div>}

      {/* Loading */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon"><FolderKanban size={40} style={{ opacity: 0.3 }} /></div>
          <p className="empty-title">{query ? "No projects match your search" : "No projects yet"}</p>
          <p className="empty-desc">{isAdmin ? 'Click "New Project" to create your first project.' : "Contact an admin to create projects."}</p>
          {isAdmin && !query && (
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              <Plus size={16} /> Create Project
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {filtered.map((p) => <ProjectGridCard key={p.id} project={p} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((p) => <ProjectListRow key={p.id} project={p} />)}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setForm({ name: "", description: "" }); }}
        title="Create New Project"
        footer={
          <>
            <button type="submit" form="create-project-form" disabled={creating} className="btn-primary">
              {creating ? <><span className="spinner" style={{ marginRight: "6px" }} />Creating…</> : "Create Project"}
            </button>
            <button onClick={() => setModalOpen(false)} className="btn-ghost">Cancel</button>
          </>
        }
      >
        <form id="create-project-form" onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label className="form-label" htmlFor="proj-name">Project Name</label>
            <input id="proj-name" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sprint Board Alpha" className="input" disabled={creating} />
          </div>
          <div>
            <label className="form-label" htmlFor="proj-desc">Description <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></label>
            <textarea id="proj-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the project" className="input" style={{ resize: "none" }} disabled={creating} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
