import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  BarChart2,
  Shield,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/",         label: "Dashboard",  icon: LayoutDashboard },
  { to: "/projects", label: "Projects",   icon: FolderKanban },
  { to: "/my-tasks", label: "My Tasks",   icon: CheckSquare },
];

function avatarColor(name = "") {
  const colors = ["#2563EB","#7C3AED","#059669","#D97706","#E11D48","#0891B2"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % colors.length;
  return colors[h];
}

function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const isSM = user?.role === "scrum_master";

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const roleBadge = {
    admin:        { label: "Admin",        cls: "badge-red" },
    scrum_master: { label: "Scrum Master", cls: "badge-amber" },
    team_member:  { label: "Team Member",  cls: "badge-green" },
  }[user?.role] || { label: user?.role, cls: "badge-gray" };

  return (
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={18} strokeWidth={2.5} />
        </div>
        <span className="sidebar-logo-text">
          Agile<span style={{ color: "var(--accent)" }}>PM</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`nav-item${isActive(to) ? " active" : ""}`}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="nav-icon" strokeWidth={1.8} />
            <span className="nav-label">{label}</span>
          </Link>
        ))}

        {/* Reports — visible to admin + scrum_master */}
        {(isAdmin || isSM) && (
          <Link
            to="/projects"
            className={`nav-item${location.pathname.startsWith("/report") ? " active" : ""}`}
            title={collapsed ? "Reports" : undefined}
          >
            <BarChart2 size={18} className="nav-icon" strokeWidth={1.8} />
            <span className="nav-label">Reports</span>
          </Link>
        )}

        {/* Admin */}
        {isAdmin && (
          <Link
            to="/admin"
            className={`nav-item${location.pathname === "/admin" ? " active" : ""}`}
            title={collapsed ? "Admin" : undefined}
          >
            <Shield size={18} className="nav-icon" strokeWidth={1.8} />
            <span className="nav-label">Admin</span>
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-end",
            width: "100%", padding: "8px", border: "none", background: "none",
            cursor: "pointer", color: "var(--text-muted)", borderRadius: "8px",
            transition: "background 0.15s ease, color 0.15s ease", marginBottom: "8px",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* User card */}
        {user && (
          <div className="user-card">
            <div
              className="avatar"
              style={{ background: avatarColor(user.full_name) }}
              title={user.full_name}
            >
              {initials}
            </div>
            <div className="user-info" style={{ minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.full_name}
              </p>
              <span className={`badge ${roleBadge.cls}`} style={{ marginTop: "3px" }}>
                {roleBadge.label}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
