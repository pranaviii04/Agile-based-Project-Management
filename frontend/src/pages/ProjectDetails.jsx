import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProjectById } from "../services/projectService";
import { getSprintsByProject, createSprint } from "../services/sprintService";
import SprintCard from "../components/SprintCard";

function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const canCreateSprint =
    user?.role === "scrum_master" || user?.role === "admin";

  // ── Data state ───────────────────────────────────────────────
  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Create sprint form state ─────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // ── Fetch project + sprints on mount ─────────────────────────
  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const [projectData, sprintsData] = await Promise.all([
        getProjectById(id),
        getSprintsByProject(id),
      ]);
      setProject(projectData);
      setSprints(sprintsData);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load project.");
    } finally {
      setLoading(false);
    }
  }

  // ── Create sprint handler ────────────────────────────────────
  const handleCreateSprint = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    try {
      await createSprint({
        name: form.name,
        project_id: id,
        start_date: form.start_date,
        end_date: form.end_date,
        status: "planned",
      });
      setForm({ name: "", start_date: "", end_date: "" });
      setShowForm(false);
      // Refresh sprints only (no need to re-fetch project)
      const updated = await getSprintsByProject(id);
      setSprints(updated);
    } catch (err) {
      setCreateError(err.response?.data?.detail || "Failed to create sprint.");
    } finally {
      setCreating(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6">
        <p className="text-slate-400">Loading project…</p>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6">
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-400 mb-4">
        <Link to="/projects" className="hover:text-white transition-colors">
          Projects
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">{project.name}</span>
      </nav>

      {/* Project Info */}
      <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
      {project.description && (
        <p className="text-slate-400 mb-2">{project.description}</p>
      )}
      <p className="text-xs text-slate-500 mb-8">
        Created{" "}
        {new Date(project.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {/* Sprints Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Sprints</h2>
        <div className="flex items-center gap-3">
          <Link
            to={`/report/${id}`}
            className="px-4 py-2 text-sm font-medium bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            View Report
          </Link>
          {canCreateSprint && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {showForm ? "Cancel" : "+ New Sprint"}
            </button>
          )}
        </div>
      </div>

      {/* Create Sprint Form */}
      {showForm && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Create New Sprint
          </h3>

          {createError && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {createError}
            </div>
          )}

          <form
            onSubmit={handleCreateSprint}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div>
              <label
                htmlFor="sprint-name"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Sprint Name
              </label>
              <input
                id="sprint-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sprint 1"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
                disabled={creating}
              />
            </div>

            <div>
              <label
                htmlFor="sprint-start"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Start Date
              </label>
              <input
                id="sprint-start"
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
                disabled={creating}
              />
            </div>

            <div>
              <label
                htmlFor="sprint-end"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                End Date
              </label>
              <input
                id="sprint-end"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
                disabled={creating}
              />
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Creating…" : "Create Sprint"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Sprint List */}
      {sprints.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-500">No sprints yet for this project.</p>
          {canCreateSprint && (
            <p className="text-slate-600 text-sm mt-2">
              Click "+ New Sprint" to create the first sprint.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sprints.map((sprint) => (
            <SprintCard key={sprint.id} sprint={sprint} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectDetails;
