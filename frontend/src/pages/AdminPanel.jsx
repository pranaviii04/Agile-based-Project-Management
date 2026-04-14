import { useState, useEffect } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import { SkeletonRow } from "../components/Skeleton";
import { Plus, MoreHorizontal, Shield } from "lucide-react";

const ROLES = [
  { value: "admin",        label: "Admin" },
  { value: "scrum_master", label: "Scrum Master" },
  { value: "team_member",  label: "Team Member" },
];

const ROLE_BADGE = {
  admin:        "badge-red",
  scrum_master: "badge-amber",
  team_member:  "badge-green",
};

function avatarColor(name = "") {
  const colors = ["#2563EB","#7C3AED","#059669","#D97706","#E11D48","#0891B2"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % colors.length;
  return colors[h];
}

function ActionsMenu({ user, onResetPW, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        className="icon-btn"
        style={{ width: "30px", height: "30px", borderRadius: "6px" }}
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", right: 0, top: "34px", zIndex: 20,
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "10px", boxShadow: "var(--shadow-md)", minWidth: "140px", overflow: "hidden",
          }}>
            {[
              { label: "Reset Password", action: () => { onResetPW(); setOpen(false); }, color: "var(--text-secondary)" },
              { label: "Delete User",    action: () => { onDelete();  setOpen(false); }, color: "#DC2626" },
            ].map(({ label, action, color }) => (
              <button
                key={label}
                onClick={action}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", color, fontFamily: "inherit", transition: "background 0.1s ease" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create user modal
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", password: "", role: "team_member" });
  const [creating, setCreating] = useState(false);

  // Reset PW modal
  const [resetModal, setResetModal] = useState(null);
  const [newPW, setNewPW] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await API.get("/users/");
      setUsers(res.data);
    } catch {
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await API.post("/auth/register", form);
      toast.success(`User "${form.email}" created.`);
      setForm({ email: "", full_name: "", password: "", role: "team_member" });
      setCreateModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create user.");
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await API.patch(`/users/${userId}/role`, { role });
      toast.success("Role updated.");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update role.");
    }
  };

  const handleDelete = async (userId, email) => {
    if (!window.confirm(`Delete user "${email}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/users/${userId}`);
      toast.success(`User "${email}" deleted.`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete user.");
    }
  };

  const handleResetPW = async (e) => {
    e.preventDefault();
    setResetting(true);
    try {
      await API.patch(`/users/${resetModal.id}/password`, { new_password: newPW });
      toast.success(`Password reset for ${resetModal.email}.`);
      setResetModal(null); setNewPW("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to reset password.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="page-wrap">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
            <Shield size={22} style={{ color: "var(--accent)" }} />
            <h1 className="page-title" style={{ margin: 0 }}>Admin Panel</h1>
          </div>
          <p className="page-subtitle">Manage users, roles, and workspace access.</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary">
          <Plus size={15} /> Create User
        </button>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, display: "flex", flexDirection: "column" , maxHeight: "500px"}}>
        <div style={{ overflowY: "auto", overflowX: "auto" }}>
        <table className="data-table" style={{ minWidth: "600px"}}>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={5} style={{ padding: 0 }}><SkeletonRow /></td></tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
                  No users found.
                </td>
              </tr>
            ) : users.map((u) => {
              const initials = u.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              const color = avatarColor(u.full_name);
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "#fff", flexShrink: 0 }}>
                        {initials}
                      </div>
                      <span style={{ fontWeight: "600", color: "var(--text-primary)", fontSize: "14px" }}>{u.full_name}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="input"
                      style={{ width: "auto", padding: "4px 8px", fontSize: "12px" }}
                    >
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? "badge-green" : "badge-red"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <ActionsMenu
                      user={u}
                      onResetPW={() => setResetModal({ id: u.id, email: u.email, full_name: u.full_name })}
                      onDelete={() => handleDelete(u.id, u.email)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        open={createModal}
        onClose={() => { setCreateModal(false); setForm({ email: "", full_name: "", password: "", role: "team_member" }); }}
        title="Create New User"
        footer={
          <>
            <button type="submit" form="create-user-form" disabled={creating} className="btn-primary">
              {creating ? <><span className="spinner" style={{ marginRight: "6px" }} />Creating…</> : "Create User"}
            </button>
            <button onClick={() => setCreateModal(false)} className="btn-ghost">Cancel</button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label className="form-label">Full Name</label>
            <input type="text" required className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" disabled={creating} />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" disabled={creating} />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input type="password" required minLength={6} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" disabled={creating} />
          </div>
          <div>
            <label className="form-label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={creating}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={!!resetModal}
        onClose={() => { setResetModal(null); setNewPW(""); }}
        title="Reset Password"
        footer={
          <>
            <button type="submit" form="reset-pw-form" disabled={resetting} className="btn-primary">
              {resetting ? "Resetting…" : "Reset Password"}
            </button>
            <button onClick={() => setResetModal(null)} className="btn-ghost">Cancel</button>
          </>
        }
      >
        {resetModal && (
          <>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Set a new password for <strong style={{ color: "var(--text-primary)" }}>{resetModal.full_name}</strong> ({resetModal.email})
            </p>
            <form id="reset-pw-form" onSubmit={handleResetPW}>
              <label className="form-label">New Password</label>
              <input type="password" required minLength={6} autoFocus className="input" value={newPW} onChange={(e) => setNewPW(e.target.value)} placeholder="Min. 6 characters" disabled={resetting} />
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}
