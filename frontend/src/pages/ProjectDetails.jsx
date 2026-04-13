import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProjectById, updateProject, deleteProject } from "../services/projectService";
import { getSprintsByProject, createSprint } from "../services/sprintService";
import { getAllUsers } from "../services/userService";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import { SkeletonCard } from "../components/Skeleton";
import { ChevronRight, Plus, Calendar, Users, BarChart2, Settings, Trash2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

function avatarColor(name = "") {
  const colors = ["#2563EB","#7C3AED","#059669","#D97706","#E11D48","#0891B2"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % colors.length;
  return colors[h];
}

const STATUS_BADGE = {
  completed: "badge badge-completed",
  active:    "badge badge-active",
  planned:   "badge badge-planned",
};

export default function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const canCreateSprint = user?.role === "scrum_master" || isAdmin;

  const [tab, setTab] = useState("overview");
  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sprint modal
  const [sprintModal, setSprintModal] = useState(false);
  const [sprintForm, setSprintForm] = useState({ name: "", start_date: "", end_date: "" });
  const [creating, setCreating] = useState(false);

  // Settings
  const [settingsForm, setSettingsForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchAll(); }, [id]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [proj, sps] = await Promise.all([
        getProjectById(id),
        getSprintsByProject(id),
      ]);
      setProject(proj);
      setSprints(sps);
      setSettingsForm({ name: proj.name, description: proj.description || "" });
      if (isAdmin) {
        getAllUsers().then(setUsers).catch(() => {});
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load project.");
    } finally {
      setLoading(false);
    }
  }

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createSprint({ ...sprintForm, project_id: id, status: "planned" });
      toast.success(`Sprint "${sprintForm.name}" created.`);
      setSprintForm({ name: "", start_date: "", end_date: "" });
      setSprintModal(false);
      const sps = await getSprintsByProject(id);
      setSprints(sps);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create sprint.");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProject(id, { name: settingsForm.name, description: settingsForm.description || null });
      toast.success("Project updated successfully.");
      setProject((p) => ({ ...p, ...settingsForm }));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update project.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete project "${project.name}"? This is irreversible.`)) return;
    setDeleting(true);
    try {
      await deleteProject(id);
      toast.success("Project deleted.");
      navigate("/projects");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete project.");
      setDeleting(false);
    }
  };

  if (loading) return <div className="page-wrap"><div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>{[1,2,3].map(i => <SkeletonCard key={i} />)}</div></div>;
  if (error) return <div className="page-wrap"><div className="alert-error">{error}</div></div>;

  const completedSprints = sprints.filter((s) => s.status === "completed").length;

  const TABS = [
    { key: "overview", label: "Overview",   icon: BarChart2 },
    { key: "sprints",  label: "Sprints",    icon: Calendar,  count: sprints.length },
    ...(isAdmin ? [{ key: "members", label: "Members", icon: Users, count: users.length }] : []),
    ...(isAdmin ? [{ key: "settings", label: "Settings", icon: Settings }] : []),
  ];

  return (
    <div className="page-wrap">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link to="/projects">Projects</Link>
        <ChevronRight size={14} />
        <span className="bc-current">{project.name}</span>
      </nav>

      {/* Project header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="page-subtitle" style={{ maxWidth: "600px" }}>{project.description}</p>}
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
            Created {new Date(project.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        {(isAdmin || user?.role === "scrum_master") && (
          <Link to={`/report/${id}`} className="btn-ghost" style={{ gap: "6px", fontSize: "13px" }}>
            <ExternalLink size={14} /> View Report
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {TABS.map(({ key, label, icon: Icon, count }) => (
          <button key={key} className={`tab-btn${tab === key ? " active" : ""}`} onClick={() => setTab(key)}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Icon size={14} />
              {label}
              {count !== undefined && (
                <span style={{ padding: "1px 6px", borderRadius: "999px", background: tab === key ? "var(--accent-light)" : "var(--bg-hover)", fontSize: "11px", fontWeight: "600", color: tab === key ? "var(--accent-text)" : "var(--text-muted)" }}>
                  {count}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ────────────────────────────── */}
      {tab === "overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px", marginBottom: "24px" }}>
            {[
              { label: "Total Sprints",    value: sprints.length,      color: "var(--accent)" },
              { label: "Completed",        value: completedSprints,    color: "#059669" },
              { label: "Active",           value: sprints.filter(s=>s.status==="active").length, color: "#D97706" },
              { label: "Planned",          value: sprints.filter(s=>s.status==="planned").length, color: "var(--text-muted)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="card-sm" style={{ textAlign: "center" }}>
                <p style={{ fontSize: "28px", fontWeight: "800", color, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "12px" }}>Recent Sprints</h3>
          {sprints.length === 0 ? (
            <div className="card empty-state"><p className="empty-title">No sprints yet</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {sprints.slice(0, 3).map((s) => (
                <Link key={s.id} to={`/sprints/${s.id}`} className="card card-clickable" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px" }}>
                  <span className={STATUS_BADGE[s.status] || "badge badge-gray"}>{s.status}</span>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", flex: 1 }}>{s.name}</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {new Date(s.start_date).toLocaleDateString()} – {new Date(s.end_date).toLocaleDateString()}
                  </span>
                  <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SPRINTS TAB ─────────────────────────────── */}
      {tab === "sprints" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
            {canCreateSprint && (
              <button onClick={() => setSprintModal(true)} className="btn-primary">
                <Plus size={15} /> New Sprint
              </button>
            )}
          </div>

          {sprints.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">🏃</div>
              <p className="empty-title">No sprints yet</p>
              <p className="empty-desc">Create the first sprint to start tracking tasks.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {sprints.map((s) => (
                <Link key={s.id} to={`/sprints/${s.id}`} className="card card-clickable" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", padding: "16px 18px" }}>
                  <span className={STATUS_BADGE[s.status] || "badge badge-gray"}>{s.status}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", margin: 0 }}>{s.name}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                      {new Date(s.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(s.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MEMBERS TAB (admin only) ─────────────────── */}
      {tab === "members" && isAdmin && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
          {users.map((u) => {
            const initials = u.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
            const color = avatarColor(u.full_name);
            const roleBadge = { admin: "badge-red", scrum_master: "badge-amber", team_member: "badge-green" }[u.role] || "badge-gray";
            return (
              <div key={u.id} className="card" style={{ textAlign: "center", padding: "24px 16px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "18px", fontWeight: "700", margin: "0 auto 12px" }}>
                  {initials}
                </div>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 4px" }}>{u.full_name}</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>{u.email}</p>
                <span className={`badge ${roleBadge}`}>{u.role.replace("_", " ")}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SETTINGS TAB (admin only) ────────────────── */}
      {tab === "settings" && isAdmin && (
        <div style={{ maxWidth: "520px" }}>
          <div className="card" style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "18px" }}>Project Settings</h3>
            <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label className="form-label">Project Name</label>
                <input className="input" value={settingsForm.name} onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })} required disabled={saving} />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="input" rows={3} style={{ resize: "none" }} value={settingsForm.description} onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })} disabled={saving} />
              </div>
              <button type="submit" disabled={saving} className="btn-primary" style={{ alignSelf: "flex-start" }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </form>
          </div>

          <div className="card" style={{ border: "1px solid rgba(239,68,68,0.25)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#DC2626", marginBottom: "8px" }}>Danger Zone</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Permanently delete this project and all its sprints and tasks. This cannot be undone.
            </p>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger">
              <Trash2 size={14} />
              {deleting ? "Deleting…" : "Delete Project"}
            </button>
          </div>
        </div>
      )}

      {/* Sprint Create Modal */}
      <Modal
        open={sprintModal}
        onClose={() => { setSprintModal(false); setSprintForm({ name: "", start_date: "", end_date: "" }); }}
        title="Create New Sprint"
        footer={
          <>
            <button type="submit" form="create-sprint-form" disabled={creating} className="btn-primary">
              {creating ? <><span className="spinner" style={{ marginRight: "6px" }} />Creating…</> : "Create Sprint"}
            </button>
            <button onClick={() => setSprintModal(false)} className="btn-ghost">Cancel</button>
          </>
        }
      >
        <form id="create-sprint-form" onSubmit={handleCreateSprint} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label className="form-label">Sprint Name</label>
            <input type="text" required value={sprintForm.name} onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })} placeholder="e.g. Sprint 1" className="input" disabled={creating} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" required value={sprintForm.start_date} onChange={(e) => setSprintForm({ ...sprintForm, start_date: e.target.value })} className="input" disabled={creating} />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input type="date" required value={sprintForm.end_date} onChange={(e) => setSprintForm({ ...sprintForm, end_date: e.target.value })} className="input" disabled={creating} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
