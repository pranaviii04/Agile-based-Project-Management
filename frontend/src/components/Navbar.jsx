import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = user?.role === "admin";

  const linkClass = (paths) => {
    const active = Array.isArray(paths)
      ? paths.some((p) => location.pathname.startsWith(p))
      : location.pathname === paths;
    return `nav-link${active ? " active" : ""}`;
  };

  return (
    <nav className="navbar">
      {/* Brand */}
      <Link
        to="/"
        style={{
          fontSize: "18px",
          fontWeight: "800",
          color: "var(--text-primary)",
          textDecoration: "none",
          letterSpacing: "-0.02em",
        }}
      >
        Agile<span style={{ color: "var(--accent-blue)" }}>PM</span>
      </Link>

      {/* Navigation Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
        <Link to="/" className={linkClass("/")}>
          Dashboard
        </Link>
        <Link
          to="/projects"
          className={linkClass(["/projects", "/sprints", "/report"])}
        >
          Projects
        </Link>
        <Link to="/my-tasks" className={linkClass("/my-tasks")}>
          My Tasks
        </Link>

        {isAdmin && (
          <Link
            to="/admin"
            className={`nav-link${location.pathname === "/admin" ? " active-amber" : ""}`}
            style={location.pathname !== "/admin" ? { color: "#D97706" } : {}}
          >
            Admin
          </Link>
        )}

        {/* User info + Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "8px" }}>
          {user && (
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "500" }}>
              {user.full_name}
            </span>
          )}
          <button onClick={handleLogout} className="btn-primary">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
