import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getProjects, createProject } from "../services/projectService";
import ProjectCard from "../components/ProjectCard";

function Projects() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // ── State ────────────────────────────────────────────────────
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Create form state ────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // ── Fetch projects on mount ──────────────────────────────────
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  // ── Create project ───────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    try {
      await createProject({
        name: form.name,
        description: form.description || null,
      });
      setForm({ name: "", description: "" });
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      setCreateError(err.response?.data?.detail || "Failed to create project.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Projects</h1>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            {showForm ? "Cancel" : "+ New Project"}
          </button>
        )}
      </div>

      {/* Create Project Form (admin only) */}
      {showForm && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Create New Project</h2>

          {createError && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {createError}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-slate-300 mb-1">
                Project Name
              </label>
              <input
                id="project-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sprint Board Alpha"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
                disabled={creating}
              />
            </div>

            <div>
              <label htmlFor="project-desc" className="block text-sm font-medium text-slate-300 mb-1">
                Description <span className="text-slate-500">(optional)</span>
              </label>
              <textarea
                id="project-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the project"
                rows={3}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                disabled={creating}
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? "Creating…" : "Create Project"}
            </button>
          </form>
        </section>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <p className="text-slate-400">Loading projects…</p>
      )}

      {/* Empty State */}
      {!loading && !error && projects.length === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-500 text-lg">No projects found.</p>
          {isAdmin && (
            <p className="text-slate-600 text-sm mt-2">
              Click "+ New Project" to create your first project.
            </p>
          )}
        </div>
      )}

      {/* Project List */}
      {!loading && projects.length > 0 && (
        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Projects;
