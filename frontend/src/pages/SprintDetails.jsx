import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSprintById, getSprintProgress } from "../services/sprintService";
import {
  getTasksBySprint,
  createTask,
  updateTaskStatus,
  getDependencies,
  createDependency,
  deleteDependency,
} from "../services/taskService";
import { runCPM } from "../services/cpmService";
import { getAllUsers } from "../services/userService";
import TaskCard from "../components/TaskCard";
import CPMResults from "../components/CPMResults";

function SprintDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const canCreateTask =
    user?.role === "scrum_master" || user?.role === "admin";
  const canRunCPM =
    user?.role === "scrum_master" || user?.role === "admin";

  // ── Data state ───────────────────────────────────────────────
  const [sprint, setSprint] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(null);
  const [systemUsers, setSystemUsers] = useState([]);

  // ── Dependency state ─────────────────────────────────────────
  const [dependencyMap, setDependencyMap] = useState({});

  // ── CPM state ────────────────────────────────────────────────
  const [cpmResult, setCpmResult] = useState(null);
  const [cpmLoading, setCpmLoading] = useState(false);
  const [cpmError, setCpmError] = useState("");

  // ── Create task form state ───────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    duration: "",
    priority: "1",
    assigned_to: "",
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
      const [sprintData, tasksData, progressData, usersData] = await Promise.all([
        getSprintById(id),
        getTasksBySprint(id),
        getSprintProgress(id),
        getAllUsers().catch(() => []), // Fail silently if no permission
      ]);
      setSprint(sprintData);
      setTasks(tasksData);
      setProgress(progressData);
      setSystemUsers(usersData);
      await fetchAllDependencies(tasksData);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load sprint.");
    } finally {
      setLoading(false);
    }
  }

  // ── Fetch dependencies for all tasks ─────────────────────────
  const fetchAllDependencies = useCallback(async (taskList) => {
    const map = {};
    const results = await Promise.all(
      taskList.map((t) =>
        getDependencies(t.id).then((deps) => ({ taskId: t.id, deps }))
      )
    );
    for (const { taskId, deps } of results) {
      map[taskId] = { deps };
    }
    setDependencyMap(map);
  }, []);

  // ── Refresh tasks + dependencies ─────────────────────────────
  async function refreshTasks() {
    try {
      const [data, progressData] = await Promise.all([
        getTasksBySprint(id),
        getSprintProgress(id),
      ]);
      setTasks(data);
      setProgress(progressData);
      await fetchAllDependencies(data);
    } catch {
      // Silently fail
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
        assigned_to: form.assigned_to ? parseInt(form.assigned_to, 10) : null,
        status: "todo",
        sprint_id: id,
      });
      setForm({ name: "", description: "", duration: "", priority: "1", assigned_to: "" });
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

  // ── Dependency handlers ──────────────────────────────────────
  const handleAddDependency = async (taskId, dependsOnTaskId) => {
    await createDependency(taskId, dependsOnTaskId);
    const deps = await getDependencies(taskId);
    setDependencyMap((prev) => ({ ...prev, [taskId]: { deps } }));
  };

  const handleRemoveDependency = async (depId) => {
    await deleteDependency(depId);
    refreshTasks();
  };

  // ── Run CPM ──────────────────────────────────────────────────
  const handleRunCPM = async () => {
    setCpmLoading(true);
    setCpmError("");
    setCpmResult(null);

    try {
      const result = await runCPM(id);
      setCpmResult(result);
    } catch (err) {
      setCpmError(err.response?.data?.detail || "CPM analysis failed.");
    } finally {
      setCpmLoading(false);
    }
  };

  // ── Derived data ─────────────────────────────────────────────
  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  // Set of critical task IDs for highlighting
  const criticalTaskIds = new Set(cpmResult?.critical_tasks || []);

  // ── Loading / Error ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6">
        <p className="text-slate-400">Loading sprint…</p>
      </div>
    );
  }

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

      {/* Sprint Progress Summary */}
      {progress && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 mb-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Completion
              </p>
              <p className="text-xl font-bold text-white">
                {progress.completion_percentage}%
              </p>
            </div>
            <p className="text-sm text-slate-400">
              {progress.completed_tasks} / {progress.total_tasks} Tasks Completed
            </p>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5">
            <div
              className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress.completion_percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Tasks Header + Actions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">
          Tasks ({tasks.length})
        </h2>
        <div className="flex items-center gap-3">
          {canRunCPM && tasks.length > 0 && (
            <button
              onClick={handleRunCPM}
              disabled={cpmLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cpmLoading ? "Running…" : "Run CPM"}
            </button>
          )}
          {canCreateTask && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {showForm ? "Cancel" : "+ New Task"}
            </button>
          )}
        </div>
      </div>

      {/* CPM Error */}
      {cpmError && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {cpmError}
        </div>
      )}

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

            <div>
              <label
                htmlFor="task-assignee"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Assignee <span className="text-slate-500">(optional)</span>
              </label>
              <select
                id="task-assignee"
                value={form.assigned_to}
                onChange={(e) =>
                  setForm({ ...form, assigned_to: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                disabled={creating}
              >
                <option value="">Unassigned</option>
                {systemUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role.replace("_", " ")})
                  </option>
                ))}
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
              Click &quot;+ New Task&quot; to create the first task.
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
              allTasks={tasks}
              dependencyMap={dependencyMap}
              onAddDependency={handleAddDependency}
              onRemoveDependency={handleRemoveDependency}
              isCritical={criticalTaskIds.has(task.id)}
              systemUsers={systemUsers}
            />
          ))}
        </div>
      )}

      {/* CPM Results Section */}
      {cpmResult && <CPMResults cpmResult={cpmResult} tasks={tasks} />}
    </div>
  );
}

export default SprintDetails;
