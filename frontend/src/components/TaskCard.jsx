import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const STATUS_CONFIG = {
  done:        { bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.22)",  color: "#059669" },
  in_progress: { bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.22)",  color: "#B45309" },
  todo:        { bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.20)", color: "var(--text-muted)" },
};

const PRIORITY_LABELS = {
  1: { text: "Low",      color: "#94A3B8" },
  2: { text: "Medium",   color: "#3B82F6" },
  3: { text: "High",     color: "#F59E0B" },
  4: { text: "Urgent",   color: "#F97316" },
  5: { text: "Critical", color: "#EF4444" },
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

  const statusStyle = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;

  return (
    <div
      className="card"
      style={{
        padding: "20px 24px",
        borderLeft: isCritical ? "4px solid rgba(239,68,68,0.55)" : undefined,
      }}
    >
      {/* Main row: task info + status */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "var(--text-primary)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {task.name}
            {isCritical && (
              <span
                style={{
                  padding: "2px 8px",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.22)",
                  color: "#DC2626",
                  fontSize: "10px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  borderRadius: "4px",
                }}
              >
                Critical
              </span>
            )}
          </h3>
          {task.description && (
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginTop: "5px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {task.description}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Duration:{" "}
              <span style={{ color: "var(--text-secondary)", fontWeight: "500" }}>
                {task.duration}d
              </span>
            </span>
            <span style={{ fontSize: "12px", color: priority.color, fontWeight: "500" }}>
              {priority.text} Priority
            </span>
            {task.assigned_to && (
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Assigned:{" "}
                <span style={{ color: "var(--text-secondary)", fontWeight: "500" }}>
                  {systemUsers.find((u) => u.id === task.assigned_to)
                    ?.full_name || `#${task.assigned_to}`}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Status select */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <select
            value={task.status}
            onChange={handleStatusChange}
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: "600",
              borderRadius: "8px",
              border: `1px solid ${statusStyle.border}`,
              background: statusStyle.bg,
              color: statusStyle.color,
              outline: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
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
            <span
              style={{
                position: "absolute",
                bottom: "-18px",
                right: 0,
                fontSize: "10px",
                color: "#F59E0B",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              Complete dependencies first
            </span>
          )}
        </div>
      </div>

      {/* Status error banner */}
      {statusError && (
        <div className="alert-error" style={{ marginTop: "10px", fontSize: "13px" }}>
          {statusError}
        </div>
      )}

      {/* Dependencies section */}
      <div
        style={{
          marginTop: "14px",
          paddingTop: "14px",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Depends on:</span>
          {taskDeps.deps.length === 0 ? (
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>None</span>
          ) : (
            taskDeps.deps.map((dep) => {
              const depTask = allTasks.find(
                (t) => t.id === dep.depends_on_task_id
              );
              const isDepDone = depTask && depTask.status === "done";
              return (
                <span
                  key={dep.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    background: isDepDone
                      ? "rgba(16,185,129,0.08)"
                      : "var(--bg-hover)",
                    color: isDepDone ? "#059669" : "var(--text-secondary)",
                    border: isDepDone
                      ? "1px solid rgba(16,185,129,0.20)"
                      : "1px solid var(--border-subtle)",
                  }}
                >
                  {isDepDone && <span style={{ color: "#059669" }}>✓</span>}
                  {depTask ? depTask.name : dep.depends_on_task_id.slice(0, 8)}
                  {onRemoveDependency && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDep(dep.id)}
                      title="Remove dependency"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        fontSize: "14px",
                        lineHeight: 1,
                        padding: "0 0 0 2px",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.target.style.color = "#DC2626")}
                      onMouseLeave={(e) => (e.target.style.color = "var(--text-muted)")}
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
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                color: "var(--accent-blue-light)",
                fontWeight: "600",
                padding: 0,
                transition: "color 0.2s",
              }}
            >
              {showDepForm ? "Cancel" : "+ Add"}
            </button>
          )}
        </div>

        {/* Add dependency inline form */}
        {showDepForm && (
          <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
            <select
              value={selectedDep}
              onChange={(e) => setSelectedDep(e.target.value)}
              className="input"
              style={{ flex: 1, padding: "8px 12px" }}
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
              className="btn-primary"
              style={{ padding: "8px 16px", fontSize: "13px", flexShrink: 0 }}
            >
              {adding ? "Adding…" : "Add"}
            </button>
          </div>
        )}

        {depError && (
          <p style={{ marginTop: "6px", fontSize: "12px", color: "#DC2626" }}>{depError}</p>
        )}
      </div>
    </div>
  );
}

export default TaskCard;
