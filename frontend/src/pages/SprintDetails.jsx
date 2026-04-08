import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSprintById } from "../services/sprintService";
import { getTasksBySprint, createTask, updateTaskStatus } from "../services/taskService";
import TaskCard from "../components/TaskCard";

function SprintDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const canCreateTask =
    user?.role === "scrum_master" || user?.role === "admin";

  // ── Data state ───────────────────────────────────────────────
  const [sprint, setSprint] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Create task form state ───────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    duration: "",
    priority: "1",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // ── Fetch sprint + tasks on mount ────────────────────────────
  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const [sprintData, tasksData] = await Promise.all([
        getSprintById(id),
        getTasksBySprint(id),
      ]);
      setSprint(sprintData);
      setTasks(tasksData);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load sprint.");
    } finally {
      setLoading(false);
    }
  }

  // ── Refresh tasks only ───────────────────────────────────────
  async function refreshTasks() {
    try {
      const data = await getTasksBySprint(id);
      setTasks(data);
    } catch {
      // Silently fail — main data is already loaded
    }
  }

  // ── Create task handler ──────────────────────────────────────
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    try {
      await createTask({
        name: form.name,
        description: form.description || null,
        duration: parseInt(form.duration, 10),
        priority: parseInt(form.priority, 10),
        status: "todo",
        sprint_id: id,
      });
      setForm({ name: "", description: "", duration: "", priority: "1" });
      setShowForm(false);
      refreshTasks();
    } catch (err) {
      setCreateError(err.response?.data?.detail || "Failed to create task.");
    } finally {
      setCreating(false);
    }
  };

  // ── Status change handler ────────────────────────────────────
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      refreshTasks();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status.");
    }
  };

  // ── Derived counts ──────────────────────────────────────────
  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  // ── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6">
        <p className="text-slate-400">Loading sprint…</p>
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
        <Link
          to={`/projects/${sprint.project_id}`}
          className="hover:text-white transition-colors"
        >
          Project
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">{sprint.name}</span>
      </nav>

      {/* Sprint Info */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white">{sprint.name}</h1>
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
            sprint.status === "completed"
              ? "bg-emerald-500/15 text-emerald-400"
              : sprint.status === "active"
              ? "bg-indigo-500/15 text-indigo-400"
              : "bg-slate-700/50 text-slate-400"
          }`}
        >
          {sprint.status}
        </span>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        {new Date(sprint.start_date).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        })}{" "}
        —{" "}
        {new Date(sprint.end_date).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      {/* Task Summary Bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-slate-300">{todoCount}</p>
          <p className="text-xs text-slate-500 mt-1">To Do</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{inProgressCount}</p>
          <p className="text-xs text-slate-500 mt-1">In Progress</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{doneCount}</p>
          <p className="text-xs text-slate-500 mt-1">Done</p>
        </div>
      </div>

      {/* Tasks Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">
          Tasks ({tasks.length})
        </h2>
        {canCreateTask && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            {showForm ? "Cancel" : "+ New Task"}
          </button>
        )}
      </div>

      {/* Create Task Form */}
      {showForm && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Create New Task
          </h3>

          {createError && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {createError}
            </div>
          )}

          <form
            onSubmit={handleCreateTask}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="sm:col-span-2">
              <label
                htmlFor="task-name"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Task Name
              </label>
              <input
                id="task-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Design login page"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
                disabled={creating}
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="task-desc"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Description{" "}
                <span className="text-slate-500">(optional)</span>
              </label>
              <textarea
                id="task-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Brief description of the task"
                rows={2}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                disabled={creating}
              />
            </div>

            <div>
              <label
                htmlFor="task-duration"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Duration (days)
              </label>
              <input
                id="task-duration"
                type="number"
                min="1"
                value={form.duration}
                onChange={(e) =>
                  setForm({ ...form, duration: e.target.value })
                }
                placeholder="e.g. 3"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
                disabled={creating}
              />
            </div>

            <div>
              <label
                htmlFor="task-priority"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                disabled={creating}
              >
                <option value="1">1 — Low</option>
                <option value="2">2 — Medium</option>
                <option value="3">3 — High</option>
                <option value="4">4 — Urgent</option>
                <option value="5">5 — Critical</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Creating…" : "Create Task"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-500">No tasks yet in this sprint.</p>
          {canCreateTask && (
            <p className="text-slate-600 text-sm mt-2">
              Click "+ New Task" to create the first task.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SprintDetails;
