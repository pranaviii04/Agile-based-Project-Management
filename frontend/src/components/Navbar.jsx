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

  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="text-xl font-bold tracking-tight hover:text-indigo-400 transition-colors">
            Agile PM
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                location.pathname === "/"
                  ? "text-indigo-400"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              className={`text-sm font-medium transition-colors ${
                location.pathname.startsWith("/projects") || location.pathname.startsWith("/sprints") || location.pathname.startsWith("/report")
                  ? "text-indigo-400"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Projects
            </Link>
            <Link
              to="/my-tasks"
              className={`text-sm font-medium transition-colors ${
                location.pathname === "/my-tasks"
                  ? "text-indigo-400"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              My Tasks
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === "/admin"
                    ? "text-amber-400"
                    : "text-amber-400/70 hover:text-amber-300"
                }`}
              >
                Admin
              </Link>
            )}

            {/* User info + Logout */}
            <div className="flex items-center gap-3 ml-4">
              {user && (
                <span className="text-sm text-slate-400 hidden sm:inline">
                  {user.full_name}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
