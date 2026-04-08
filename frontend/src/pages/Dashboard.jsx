import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProjects } from "../services/projectService";
import { getAllSprints } from "../services/sprintService";
import { getMyTasks } from "../services/taskService";

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projects: "—",
    sprints: "—",
    tasks: "—",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [projectsRes, sprintsRes, tasksRes] = await Promise.all([
          getProjects().catch(() => []),
          getAllSprints().catch(() => []),
          getMyTasks().catch(() => []),
        ]);

        // Calculate metrics
        const activeProjects = projectsRes.length; // You could filter by status if models support it
        const openSprints = sprintsRes.filter(s => s.status !== "completed").length;
        const activeTasks = tasksRes.filter(t => t.status !== "done").length;

        setStats({
          projects: activeProjects,
          sprints: openSprints,
          tasks: activeTasks,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">
        Welcome{user ? `, ${user.full_name}` : ""}!
      </h1>
      <p className="text-slate-400 mb-8">
        Here's an overview of your agile workspace.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 relative overflow-hidden group hover:border-indigo-500 transition-colors">
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Active Projects
            </h3>
            <p className="text-4xl font-bold text-white mt-3">
              {loading ? (
                <span className="text-slate-600 animate-pulse">...</span>
              ) : (
                stats.projects
              )}
            </p>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500 transition-colors">
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Open Sprints
            </h3>
            <p className="text-4xl font-bold text-white mt-3">
              {loading ? (
                <span className="text-slate-600 animate-pulse">...</span>
              ) : (
                stats.sprints
              )}
            </p>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 relative overflow-hidden group hover:border-amber-500 transition-colors">
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              My Pending Tasks
            </h3>
            <p className="text-4xl font-bold text-white mt-3">
              {loading ? (
                <span className="text-slate-600 animate-pulse">...</span>
              ) : (
                stats.tasks
              )}
            </p>
          </div>
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          </div>
        </div>
      </div>

      {/* Quick navigation */}
      <h2 className="text-xl font-semibold text-white mt-10 mb-4">Quick Links</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/projects"
          className="block bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-indigo-500 transition-colors cursor-pointer"
        >
          <h3 className="text-lg font-semibold text-white">Projects</h3>
          <p className="text-sm text-slate-400 mt-1">View and manage all projects</p>
        </Link>
        <Link
          to="/my-tasks"
          className="block bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-amber-500 transition-colors cursor-pointer"
        >
          <h3 className="text-lg font-semibold text-white">My Tasks</h3>
          <p className="text-sm text-slate-400 mt-1">See tasks assigned to you</p>
        </Link>
        <Link
          to="/projects"
          className="block bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-emerald-500 transition-colors cursor-pointer"
        >
          <h3 className="text-lg font-semibold text-white">Sprints</h3>
          <p className="text-sm text-slate-400 mt-1">Navigate via a project to its sprints</p>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
