import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSprintById, getSprintProgress } from "../services/sprintService";
import {
  getTasksBySprint, createTask, updateTaskStatus,
  getDependencies, createDependency, deleteDependency,
} from "../services/taskService";
import { runCPM } from "../services/cpmService";
import { getAllUsers } from "../services/userService";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import KanbanBoard from "../components/KanbanBoard";
import CPMResults from "../components/CPMResults";
import CPMGraph from "../components/CPMGraph";
import { SkeletonCard } from "../components/Skeleton";
import { ChevronRight, Plus, LayoutList, LayoutGrid, Play, SlidersHorizontal } from "lucide-react";

const STATUS_BADGE_CLS = {
  completed: "badge badge-completed",
  active:    "badge badge-active",
  planned:   "badge badge-planned",
};

const PRIORITY_MAP = {
  1: { label: "Low",      cls: "badge-low",      stripe: "#CBD5E1" },
  2: { label: "Medium",   cls: "badge-medium",   stripe: "#F59E0B" },
  3: { label: "High",     cls: "badge-high",      stripe: "#EF4444" },
  4: { label: "Urgent",   cls: "badge-urgent",   stripe: "#F97316" },
  5: { label: "Critical", cls: "badge-critical", stripe: "#DC2626" },
};

const STATUS_OPTS = [
  { value: "todo",        label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done",        label: "Done" },
];

const STATUS_STYLE = {
  todo:        { bg: "rgba(100,116,139,0.10)", color: "#475569", border: "rgba(100,116,139,0.22)" },
  in_progress: { bg: "rgba(245,158,11,0.10)",  color: "#B45309", border: "rgba(245,158,11,0.25)" },
  done:        { bg: "rgba(16,185,129,0.10)",   color: "#059669", border: "rgba(16,185,129,0.25)" },
};

function avatarColor(name = "") {
  const colors = ["#2563EB","#7C3AED","#059669","#D97706","#E11D48","#0891B2"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % colors.length;
  return colors[h];
}

export default function SprintDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isSM    = user?.role === "scrum_master";
  const canCreateTask = isAdmin || isSM;
  const canRunCPM     = isAdmin || isSM;

  const [sprint, setSprint] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState(null);
  const [systemUsers, setSystemUsers] = useState([]);
  const [depMap, setDepMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // View mode
  const [viewMode, setViewMode] = useState("list"); // "list" | "board"

  // Filter + Sort
  const [filterStatus, setFilterStatus] = useState(""); // "" = All
  const [sortPriority, setSortPriority] = useState(false);

  // Task form modal
  const [taskModal, setTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ name: "", description: "", duration: "", priority: "1", assigned_to: "" });
  const [creating, setCreating] = useState(false);

  // CPM state
  const [cpmResult, setCpmResult] = useState(null);
  const [cpmLoading, setCpmLoading] = useState(false);
  const [cpmError, setCpmError] = useState("");

  useEffect(() => { fetchData(); }, [id]);

  async function fetchData() {
    setLoading(true);
    try {
      const [sprintData, tasksData, progressData] = await Promise.all([
        getSprintById(id),
        getTasksBySprint(id),
        getSprintProgress(id),
      ]);
      setSprint(sprintData);
      setTasks(tasksData);
      setProgress(progressData);
      getAllUsers().then(setSystemUsers).catch(() => {});
      await fetchDeps(tasksData);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load sprint.");
    } finally {
      setLoading(false);
    }
  }

  const fetchDeps = useCallback(async (taskList) => {
    const results = await Promise.all(
      taskList.map((t) => getDependencies(t.id).then((deps) => ({ id: t.id, deps })).catch(() => ({ id: t.id, deps: [] })))
    );
    const map = {};
    results.forEach(({ id, deps }) => { map[id] = { deps }; });
    setDepMap(map);
  }, []);

  async function refreshTasks() {
    const [data, prog] = await Promise.all([getTasksBySprint(id), getSprintProgress(id)]);
    setTasks(data); setProgress(prog);
    await fetchDeps(data);
  }

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createTask({
        name: taskForm.name, description: taskForm.description || null,
        duration: parseInt(taskForm.duration, 10),
        priority: parseInt(taskForm.priority, 10),
        assigned_to: taskForm.assigned_to ? parseInt(taskForm.assigned_to, 10) : null,
        status: "todo", sprint_id: id,
      });
      toast.success(`Task "${taskForm.name}" created.`);
      setTaskForm({ name: "", description: "", duration: "", priority: "1", assigned_to: "" });
      setTaskModal(false);
      refreshTasks();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create task.");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      toast.success("Status updated.");
      refreshTasks();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Cannot update status.");
      throw err;
    }
  };

  const handleAddDep = async (taskId, dependsOnId) => {
    await createDependency(taskId, dependsOnId);
    const deps = await getDependencies(taskId);
    setDepMap((prev) => ({ ...prev, [taskId]: { deps } }));
  };

  const handleRemoveDep = async (depId) => {
    await deleteDependency(depId);
    refreshTasks();
  };

  const handleRunCPM = async () => {
    setCpmLoading(true); setCpmError(""); setCpmResult(null);
    try {
      const result = await runCPM(id);
      setCpmResult(result);
      toast.success("CPM analysis complete!");
    } catch (err) {
      const msg = err.response?.data?.detail || "CPM analysis failed.";
      setCpmError(msg); toast.error(msg);
    } finally {
      setCpmLoading(false);
    }
  };

  if (loading) return <div className="page-wrap"><div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>{[1,2,3].map(i => <SkeletonCard key={i} />)}</div></div>;
  if (error) return <div className="page-wrap"><div className="alert-error">{error}</div></div>;

  const criticalIds = cpmResult?.critical_tasks || [];
  const todoCount       = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const doneCount       = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="page-wrap">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link to="/projects">Projects</Link>
        <ChevronRight size={14} />
        <Link to={`/projects/${sprint.project_id}`}>Project</Link>
        <ChevronRight size={14} />
        <span className="bc-current">{sprint.name}</span>
      </nav>

      {/* Sprint Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "6px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h1 className="page-title" style={{ margin: 0 }}>{sprint.name}</h1>
            <span className={STATUS_BADGE_CLS[sprint.status] || "badge badge-gray"}>{sprint.status}</span>
          </div>
          <p className="page-subtitle">
            {new Date(sprint.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric" })} –{" "}
            {new Date(sprint.end_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {progress && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>
              {progress.completed_tasks} / {progress.total_tasks} Tasks Complete
            </span>
            <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--accent)" }}>{progress.completion_percentage}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress.completion_percentage}%` }} />
          </div>
        </div>
      )}

      {/* Mini stat pills */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          { label: "To Do",       count: todoCount,        color: "#64748B", bg: "rgba(100,116,139,0.10)" },
          { label: "In Progress", count: inProgressCount,  color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
          { label: "Done",        count: doneCount,        color: "#10B981", bg: "rgba(16,185,129,0.10)" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} style={{ padding: "8px 16px", borderRadius: "8px", background: bg, display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px", fontWeight: "800", color, lineHeight: 1 }}>{count}</span>
            <span style={{ fontSize: "12px", color, fontWeight: "600" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Tasks header + actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
          Tasks ({tasks.length})
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* View toggle */}
          <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
            {[["list", LayoutList, "List"], ["board", LayoutGrid, "Board"]].map(([v, Icon, lbl]) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                title={lbl}
                style={{
                  padding: "7px 12px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px",
                  background: viewMode === v ? "var(--accent-light)" : "var(--bg-surface)",
                  color: viewMode === v ? "var(--accent-text)" : "var(--text-muted)",
                  fontSize: "12px", fontWeight: "600", transition: "all 0.15s ease",
                }}
              >
                <Icon size={14} />{lbl}
              </button>
            ))}
          </div>

          {/* CPM button */}
          {canRunCPM && tasks.length > 0 && (
            <button onClick={handleRunCPM} disabled={cpmLoading} className="btn-ghost" style={{ fontSize: "13px", gap: "6px" }}>
              {cpmLoading ? <><span className="spinner spinner-dark" />Running…</> : <><Play size={13} />Run CPM</>}
            </button>
          )}

          {/* Create task */}
          {canCreateTask && (
            <button onClick={() => setTaskModal(true)} className="btn-primary" style={{ fontSize: "13px" }}>
              <Plus size={14} />New Task
            </button>
          )}
        </div>
      </div>

      {cpmError && <div className="alert-error" style={{ marginBottom: "14px" }}>{cpmError}</div>}

      {/* ── Task Filter + Sort ───────────────────────── */}
      {tasks.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
          {/* Filter tabs */}
          <div style={{ display: "flex", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
            {[
              { value: "",           label: "All",         color: "var(--text-muted)" },
              { value: "todo",        label: "To Do",       color: "#64748B" },
              { value: "in_progress", label: "In Progress", color: "#F59E0B" },
              { value: "done",        label: "Done",        color: "#10B981" },
            ].map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => setFilterStatus(value)}
                style={{
                  padding: "6px 14px", border: "none", cursor: "pointer",
                  fontSize: "12px", fontWeight: "600", fontFamily: "inherit",
                  background: filterStatus === value ? "var(--accent)" : "transparent",
                  color: filterStatus === value ? "#fff" : color,
                  transition: "all 0.15s ease",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort by priority */}
          <button
            onClick={() => setSortPriority(s => !s)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border)",
              background: sortPriority ? "var(--accent-light)" : "var(--bg-surface)",
              color: sortPriority ? "var(--accent-text)" : "var(--text-muted)",
              fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s ease",
            }}
          >
            <SlidersHorizontal size={13} />
            {sortPriority ? "Priority: High → Low" : "Sort by Priority"}
          </button>
        </div>
      )}

      {/* ── Task View ─────────────────────────────── */}
      {(() => {
        const filteredTasks = tasks
          .filter(t => filterStatus === "" || t.status === filterStatus)
          .sort((a, b) => sortPriority ? (b.priority - a.priority) : 0);

        if (tasks.length === 0) return (
          <div className="card empty-state">
            <div className="empty-icon">📋</div>
            <p className="empty-title">No tasks yet</p>
            <p className="empty-desc">Add the first task to start the sprint.</p>
          </div>
        );

        if (filteredTasks.length === 0) return (
          <div className="card empty-state">
            <div className="empty-icon">🔍</div>
            <p className="empty-title">No tasks match this filter</p>
            <p className="empty-desc">Try a different status filter.</p>
          </div>
        );

        if (viewMode === "board") return (
          <KanbanBoard
            tasks={filteredTasks}
            onStatusChange={handleStatusChange}
            criticalIds={criticalIds}
            systemUsers={systemUsers}
          />
        );

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredTasks.map((task) => (
              <TaskListCard
                key={task.id}
                task={task}
                allTasks={tasks}
                depMap={depMap}
                onStatusChange={handleStatusChange}
                onAddDep={handleAddDep}
                onRemoveDep={handleRemoveDep}
                isCritical={criticalIds.includes(task.id)}
                systemUsers={systemUsers}
              />
            ))}
          </div>
        );
      })()}

      {/* ── CPM Results ───────────────────────────── */}
      {cpmResult && (
        <div style={{ marginTop: "32px" }}>
          <CPMGraph cpmResult={cpmResult} tasks={tasks} depMap={depMap} />
          <div style={{ marginTop: "20px" }}>
            <CPMResults cpmResult={cpmResult} tasks={tasks} />
          </div>
        </div>
      )}

      {/* ── Create Task Modal ─────────────────────── */}
      <Modal
        open={taskModal}
        onClose={() => { setTaskModal(false); setTaskForm({ name: "", description: "", duration: "", priority: "1", assigned_to: "" }); }}
        title="Create New Task"
        maxWidth="520px"
        footer={
          <>
            <button type="submit" form="create-task-form" disabled={creating} className="btn-primary">
              {creating ? <><span className="spinner" style={{ marginRight: "6px" }} />Creating…</> : "Create Task"}
            </button>
            <button onClick={() => setTaskModal(false)} className="btn-ghost">Cancel</button>
          </>
        }
      >
        <form id="create-task-form" onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label className="form-label">Task Name</label>
            <input type="text" required className="input" value={taskForm.name} onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })} placeholder="e.g. Design login page" disabled={creating} />
          </div>
          <div>
            <label className="form-label">Description <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></label>
            <textarea rows={2} className="input" style={{ resize: "none" }} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} disabled={creating} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="form-label">Duration (days)</label>
              <input type="number" min="1" required className="input" value={taskForm.duration} onChange={(e) => setTaskForm({ ...taskForm, duration: e.target.value })} placeholder="3" disabled={creating} />
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select className="input" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} disabled={creating}>
                <option value="1">1 — Low</option>
                <option value="2">2 — Medium</option>
                <option value="3">3 — High</option>
                <option value="4">4 — Urgent</option>
                <option value="5">5 — Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Assignee <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></label>
            <select className="input" value={taskForm.assigned_to} onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })} disabled={creating}>
              <option value="">Unassigned</option>
              {systemUsers.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ── Inline task card (list view) ─────────────────────────── */
function TaskListCard({ task, allTasks, depMap, onStatusChange, onAddDep, onRemoveDep, isCritical, systemUsers }) {
  const [showDepForm, setShowDepForm] = useState(false);
  const [selDep, setSelDep] = useState("");
  const [addingDep, setAddingDep] = useState(false);
  const [statusErr, setStatusErr] = useState("");

  const priority = PRIORITY_MAP[task.priority] || PRIORITY_MAP[1];
  const statusStyle = STATUS_STYLE[task.status] || STATUS_STYLE.todo;
  const taskDeps = depMap[task.id] || { deps: [] };
  const existingDepIds = new Set(taskDeps.deps.map((d) => d.depends_on_task_id));
  const availDeps = allTasks.filter((t) => t.id !== task.id && !existingDepIds.has(t.id));
  const depsAllDone = taskDeps.deps.every((d) => {
    const depT = allTasks.find((t) => t.id === d.depends_on_task_id);
    return depT?.status === "done";
  });
  const canMarkDone = taskDeps.deps.length === 0 || depsAllDone;
  const assignee = systemUsers.find((u) => u.id === task.assigned_to);

  const handleStatus = async (e) => {
    setStatusErr("");
    try { await onStatusChange(task.id, e.target.value); }
    catch (err) {
      setStatusErr(err.response?.data?.error?.message || err.response?.data?.detail || "Cannot update status.");
      e.target.value = task.status;
    }
  };

  const handleAddDep = async () => {
    if (!selDep) return;
    setAddingDep(true);
    try { await onAddDep(task.id, selDep); setSelDep(""); setShowDepForm(false); }
    catch (err) { alert(err.response?.data?.detail || "Failed to add dep."); }
    finally { setAddingDep(false); }
  };

  return (
    <div
      className="card"
      style={{
        padding: "16px 18px",
        borderLeft: `4px solid ${priority.stripe}`,
        display: "flex", flexDirection: "column", gap: "10px",
        outline: isCritical ? "1px solid rgba(239,68,68,0.30)" : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>{task.name}</h3>
            <span className={`badge ${priority.cls}`}>{priority.label}</span>
            {isCritical && <span className="badge badge-red">Critical</span>}
          </div>
          {task.description && (
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {task.description}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "4px", background: "var(--bg-app)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              {task.duration}d
            </span>
            {assignee && (
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: avatarColor(assignee.full_name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: "700", color: "#fff" }}>
                  {assignee.full_name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{assignee.full_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status select */}
        <select value={task.status} onChange={handleStatus} style={{ padding: "5px 10px", fontSize: "12px", fontWeight: "600", borderRadius: "8px", border: `1px solid ${statusStyle.border}`, background: statusStyle.bg, color: statusStyle.color, outline: "none", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
          {STATUS_OPTS.map((s) => (
            <option key={s.value} value={s.value} disabled={s.value === "done" && !canMarkDone}>
              {s.label}{s.value === "done" && !canMarkDone ? " (deps incomplete)" : ""}
            </option>
          ))}
        </select>
      </div>

      {statusErr && <div className="alert-warning" style={{ fontSize: "13px", padding: "8px 12px" }}>{statusErr}</div>}

      {!canMarkDone && task.status !== "done" && (
        <div className="alert-warning" style={{ fontSize: "12px", padding: "8px 12px" }}>
          ⚠ Complete all dependencies before marking this task Done.
        </div>
      )}

      {/* Dependencies */}
      <div style={{ paddingTop: "8px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", paddingTop: "2px" }}>Deps:</span>
        {taskDeps.deps.length === 0 ? (
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>None</span>
        ) : taskDeps.deps.map((dep) => {
          const dt = allTasks.find((t) => t.id === dep.depends_on_task_id);
          const done = dt?.status === "done";
          return (
            <span key={dep.id} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", background: done ? "rgba(16,185,129,0.08)" : "var(--bg-app)", border: done ? "1px solid rgba(16,185,129,0.22)" : "1px solid var(--border)", color: done ? "#059669" : "var(--text-secondary)" }}>
              {done && "✓ "}{dt ? dt.name : dep.depends_on_task_id.slice(0,8)}
              {onRemoveDep && (
                <button onClick={() => onRemoveDep(dep.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "14px", padding: "0 0 0 2px", lineHeight: 1 }}
                  onMouseEnter={e => e.target.style.color = "#DC2626"}
                  onMouseLeave={e => e.target.style.color = "var(--text-muted)"}
                >×</button>
              )}
            </span>
          );
        })}
        {availDeps.length > 0 && (
          <button onClick={() => setShowDepForm(!showDepForm)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--accent)", fontWeight: "600", padding: 0 }}>
            {showDepForm ? "Cancel" : "+ Add dep"}
          </button>
        )}
      </div>
      {showDepForm && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <select value={selDep} onChange={(e) => setSelDep(e.target.value)} className="input" style={{ flex: 1, padding: "7px 10px", fontSize: "13px" }} disabled={addingDep}>
            <option value="">Select task…</option>
            {availDeps.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button onClick={handleAddDep} disabled={!selDep || addingDep} className="btn-primary" style={{ fontSize: "12px", padding: "7px 14px", flexShrink: 0 }}>
            {addingDep ? "…" : "Add"}
          </button>
        </div>
      )}
    </div>
  );
}
