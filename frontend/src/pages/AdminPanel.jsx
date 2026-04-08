import { useState, useEffect } from "react";
import API from "../api/axios";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "scrum_master", label: "Scrum Master" },
  { value: "team_member", label: "Team Member" },
];

function AdminPanel() {
  // ── User list state ──────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState("");

  // ── Create user form state ───────────────────────────────────
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "team_member",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // ── Role update state ────────────────────────────────────────
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  // ── Password reset state ─────────────────────────────────────
  const [resetModal, setResetModal] = useState(null); // { id, full_name, email }
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // ── Load users on mount ──────────────────────────────────────
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setUsersError("");
    try {
      const res = await API.get("/users/");
      setUsers(res.data);
    } catch (err) {
      setUsersError(
        err.response?.data?.detail || "Failed to load users."
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  // ── Create user ──────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      await API.post("/auth/register", form);
      setCreateSuccess(`User "${form.email}" created successfully.`);
      setForm({ email: "", full_name: "", password: "", role: "team_member" });
      fetchUsers();
    } catch (err) {
      setCreateError(
        err.response?.data?.detail || "Failed to create user."
      );
    } finally {
      setCreating(false);
    }
  };

  // ── Update role ──────────────────────────────────────────────
  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRoleId(userId);
    try {
      await API.patch(`/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update role.");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  // ── Delete user ────────────────────────────────────────────────
  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to delete "${email}"? This cannot be undone.`)) {
      return;
    }
    try {
      await API.delete(`/users/${userId}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete user.");
    }
  };

  // ── Reset password ───────────────────────────────────────────
  const openResetModal = (user) => {
    setResetModal({ id: user.id, full_name: user.full_name, email: user.email });
    setNewPassword("");
    setResetError("");
    setResetSuccess("");
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetting(true);
    setResetError("");
    setResetSuccess("");

    try {
      await API.patch(`/users/${resetModal.id}/password`, {
        new_password: newPassword,
      });
      setResetSuccess(`Password reset successfully for ${resetModal.email}.`);
      setNewPassword("");
      // Close modal after a brief delay so user sees the success message
      setTimeout(() => setResetModal(null), 1500);
    } catch (err) {
      setResetError(
        err.response?.data?.detail || "Failed to reset password."
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
      <p className="text-slate-400 mb-8">
        Manage users, assign roles, and create new accounts.
      </p>

      {/* ── Create User Form ─────────────────────────────────── */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-10">
        <h2 className="text-xl font-semibold text-white mb-5">Create New User</h2>

        {createError && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
            {createError}
          </div>
        )}
        {createSuccess && (
          <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-400">
            {createSuccess}
          </div>
        )}

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="create-name" className="block text-sm font-medium text-slate-300 mb-1">
              Full Name
            </label>
            <input
              id="create-name"
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Jane Doe"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              required
              disabled={creating}
            />
          </div>

          <div>
            <label htmlFor="create-email" className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <input
              id="create-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jane@company.com"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              required
              disabled={creating}
            />
          </div>

          <div>
            <label htmlFor="create-password" className="block text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              id="create-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min 6 characters"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              required
              minLength={6}
              disabled={creating}
            />
          </div>

          <div>
            <label htmlFor="create-role" className="block text-sm font-medium text-slate-300 mb-1">
              Role
            </label>
            <select
              id="create-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              disabled={creating}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? "Creating…" : "Create User"}
            </button>
          </div>
        </form>
      </section>

      {/* ── Users Table ──────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-5">All Users</h2>

        {usersError && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
            {usersError}
          </div>
        )}

        {loadingUsers ? (
          <p className="text-slate-400">Loading users…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="bg-slate-950 hover:bg-slate-900 transition-colors">
                    <td className="px-5 py-4 text-sm text-slate-300">{u.id}</td>
                    <td className="px-5 py-4 text-sm font-medium text-white">{u.full_name}</td>
                    <td className="px-5 py-4 text-sm text-slate-300">{u.email}</td>
                    <td className="px-5 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={updatingRoleId === u.id}
                        className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-50"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${
                          u.is_active
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openResetModal(u)}
                          className="px-3 py-1.5 text-xs font-medium bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 rounded-lg transition-colors cursor-pointer"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="px-3 py-1.5 text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Reset Password Modal ─────────────────────────────── */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-1">
              Reset Password
            </h3>
            <p className="text-sm text-slate-400 mb-5">
              Set a new password for <span className="text-white font-medium">{resetModal.full_name}</span>{" "}
              ({resetModal.email})
            </p>

            {resetError && (
              <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                {resetError}
              </div>
            )}
            {resetSuccess && (
              <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-400">
                {resetSuccess}
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              <label htmlFor="reset-password" className="block text-sm font-medium text-slate-300 mb-1">
                New Password
              </label>
              <input
                id="reset-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition mb-5"
                required
                minLength={6}
                disabled={resetting}
                autoFocus
              />

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetting ? "Resetting…" : "Reset Password"}
                </button>
                <button
                  type="button"
                  onClick={() => setResetModal(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
