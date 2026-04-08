import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-2">
        Welcome{user ? `, ${user.full_name}` : ""}!
      </h1>
      <p className="text-slate-400 mb-8">
        Here's an overview of your agile workspace.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active Projects</h3>
          <p className="text-3xl font-bold text-white mt-2">—</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Open Sprints</h3>
          <p className="text-3xl font-bold text-white mt-2">—</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">My Tasks</h3>
          <p className="text-3xl font-bold text-white mt-2">—</p>
        </div>
      </div>

      {/* Quick navigation */}
      <h2 className="text-xl font-semibold text-white mt-10 mb-4">Quick Links</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/projects"
          className="block bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-indigo-500 transition-colors"
        >
          <h3 className="text-lg font-semibold text-white">Projects</h3>
          <p className="text-sm text-slate-400 mt-1">View and manage all projects</p>
        </Link>
        <Link
          to="/my-tasks"
          className="block bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-indigo-500 transition-colors"
        >
          <h3 className="text-lg font-semibold text-white">My Tasks</h3>
          <p className="text-sm text-slate-400 mt-1">See tasks assigned to you</p>
        </Link>
        <Link
          to="/projects"
          className="block bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-indigo-500 transition-colors"
        >
          <h3 className="text-lg font-semibold text-white">Sprints</h3>
          <p className="text-sm text-slate-400 mt-1">Navigate via a project to its sprints</p>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
