import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const STATUS_STYLES = {
  done: "bg-emerald-500/15 text-emerald-400",
  in_progress: "bg-amber-500/15 text-amber-400",
  todo: "bg-slate-700/50 text-slate-400",
};

const PRIORITY_LABELS = {
  1: { text: "Low", color: "text-slate-500" },
  2: { text: "Medium", color: "text-blue-400" },
  3: { text: "High", color: "text-amber-400" },
  4: { text: "Urgent", color: "text-orange-400" },
  5: { text: "Critical", color: "text-red-400" },
};

/**
 * @param {Object}   props
 * @param {Object}   props.task            - The task object
 * @param {Function} props.onStatusChange  - (taskId, newStatus) => void
 * @param {Array}    props.allTasks        - All tasks in the sprint (for dependency picker)
 * @param {Object}   props.dependencyMap   - { [taskId]: { deps: [...], depNames: [...] } }
 * @param {Function} props.onAddDependency - (taskId, dependsOnTaskId) => Promise
 * @param {Function} props.onRemoveDependency - (dependencyId) => Promise
 * @param {boolean}  props.isCritical      - Whether this task is on the critical path
 * @param {Array}    props.systemUsers     - List of all users in the system to map IDs to names
 */
function TaskCard({
  task,
  onStatusChange,
  allTasks = [],
  dependencyMap = {},
  onAddDependency,
  onRemoveDependency,
  isCritical = false,
  systemUsers = [],
}) {
  const priority = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS[1];
  const [showDepForm, setShowDepForm] = useState(false);
  const [selectedDep, setSelectedDep] = useState("");
  const [depError, setDepError] = useState("");
  const [adding, setAdding] = useState(false);
  const [statusError, setStatusError] = useState("");

  const taskDeps = dependencyMap[task.id] || { deps: [], depNames: [] };

  // Check if all dependencies are DONE
  const depsAllDone = taskDeps.deps.every((dep) => {
    const depTask = allTasks.find((t) => t.id === dep.depends_on_task_id);
    return depTask && depTask.status === "done";
  });
  const hasDeps = taskDeps.deps.length > 0;
  const canMarkDone = !hasDeps || depsAllDone;

  // Tasks available for dependency (exclude self and already-added deps)
  const existingDepTaskIds = new Set(taskDeps.deps.map((d) => d.depends_on_task_id));
  const availableTasks = allTasks.filter(
    (t) => t.id !== task.id && !existingDepTaskIds.has(t.id)
  );

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatusError("");
    try {
      await onStatusChange(task.id, newStatus);
    } catch (err) {
      const detail = err?.response?.data?.error?.message
        || err?.response?.data?.detail
        || "Status update failed.";
      setStatusError(detail);
      // Reset select back to current status since backend rejected
      e.target.value = task.status;
    }
  };

  const handleAddDep = async () => {
    if (!selectedDep) return;
    setAdding(true);
    setDepError("");
    try {
      await onAddDependency(task.id, selectedDep);
      setSelectedDep("");
      setShowDepForm(false);
    } catch (err) {
      setDepError(
        err.response?.data?.detail || "Failed to add dependency."
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveDep = async (depId) => {
    try {
      await onRemoveDependency(depId);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to remove dependency.");
    }
  };

  return (
    <div className={`bg-slate-800 border rounded-xl p-5 ${isCritical ? 'border-red-500/60 border-l-4' : 'border-slate-700'}`}>
      {/* Main row: task info + status */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white truncate">
            {task.name}
            {isCritical && (
              <span className="ml-2 px-1.5 py-0.5 bg-red-500/15 text-red-400 text-[10px] font-bold uppercase rounded align-middle">
                Critical
              </span>
            )}
          </h3>
          {task.description && (
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-slate-500">
              Duration: <span className="text-slate-300">{task.duration}d</span>
            </span>
            <span className={`text-xs ${priority.color}`}>
              Priority: {priority.text}
            </span>
            {task.assigned_to && (
              <span className="text-xs text-slate-500">
                Assigned:{" "}
                <span className="text-slate-300">
                  {systemUsers.find((u) => u.id === task.assigned_to)
                    ?.full_name || `#${task.assigned_to}`}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="relative shrink-0 group">
          <select
            value={task.status}
            onChange={handleStatusChange}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer ${
              STATUS_STYLES[task.status] || STATUS_STYLES.todo
            }`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option
                key={s.value}
                value={s.value}
                disabled={s.value === "done" && !canMarkDone}
              >
                {s.label}{s.value === "done" && !canMarkDone ? " (deps incomplete)" : ""}
              </option>
            ))}
          </select>
          {!canMarkDone && (
            <span className="absolute -bottom-5 right-0 text-[10px] text-amber-400/70 whitespace-nowrap pointer-events-none">
              Complete dependencies first
            </span>
          )}
        </div>
      </div>

      {/* Status error banner */}
      {statusError && (
        <div className="mt-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{statusError}</p>
        </div>
      )}

      {/* Dependencies section */}
      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">Depends on:</span>
          {taskDeps.deps.length === 0 ? (
            <span className="text-xs text-slate-600 italic">None</span>
          ) : (
            taskDeps.deps.map((dep) => {
              const depTask = allTasks.find(
                (t) => t.id === dep.depends_on_task_id
              );
              const isDepDone = depTask && depTask.status === "done";
              return (
                <span
                  key={dep.id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                    isDepDone
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {isDepDone && <span className="text-emerald-400">✓</span>}
                  {depTask ? depTask.name : dep.depends_on_task_id.slice(0, 8)}
                  {onRemoveDependency && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDep(dep.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer ml-0.5"
                      title="Remove dependency"
                    >
                      ×
                    </button>
                  )}
                </span>
              );
            })
          )}

          {onAddDependency && availableTasks.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setShowDepForm(!showDepForm);
                setDepError("");
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              {showDepForm ? "Cancel" : "+ Add"}
            </button>
          )}
        </div>

        {/* Add dependency inline form */}
        {showDepForm && (
          <div className="mt-2 flex items-center gap-2">
            <select
              value={selectedDep}
              onChange={(e) => setSelectedDep(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              disabled={adding}
            >
              <option value="">Select a task…</option>
              {availableTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddDep}
              disabled={!selectedDep || adding}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? "Adding…" : "Add"}
            </button>
          </div>
        )}

        {depError && (
          <p className="mt-1 text-xs text-red-400">{depError}</p>
        )}
      </div>
    </div>
  );
}

export default TaskCard;
