import { useState, useEffect } from "react";
import { getMyTasks, updateTaskStatus } from "../services/taskService";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { CheckSquare, FolderKanban } from "lucide-react";
import { SkeletonCard } from "../components/Skeleton";

const PRIORITY_MAP = {
  1: { label: "Low",      cls: "badge-low" },
  2: { label: "Medium",   cls: "badge-medium" },
  3: { label: "High",     cls: "badge-high" },
  4: { label: "Urgent",   cls: "badge-urgent" },
  5: { label: "Critical", cls: "badge-critical" },
};

const STATUS_OPTIONS = [
  { value: "todo",        label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done",        label: "Done" },
];

const STATUS_COLORS = {
  todo:        { bg: "rgba(100,116,139,0.10)", color: "#475569", border: "rgba(100,116,139,0.20)" },
  in_progress: { bg: "rgba(245,158,11,0.10)",  color: "#B45309", border: "rgba(245,158,11,0.25)" },
  done:        { bg: "rgba(16,185,129,0.10)",   color: "#059669", border: "rgba(16,185,129,0.25)" },
};

const TABS = [
  { value: "",            label: "All" },
  { value: "todo",        label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done",        label: "Done" },
];

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => { fetchTasks(); }, [activeTab]);

  async function fetchTasks() {
    setLoading(true);
    try {
      const data = await getMyTasks(activeTab || null);
      setTasks(data);
    } catch {
      toast.error("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      toast.success("Task status updated.");
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update status.");
    }
  };

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: "24px" }}>
        <h1 className="page-title">My Tasks</h1>
        <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? "s" : ""} assigned to you</p>
      </div>

      {/* Filter Tabs */}
      <div className="tab-bar" style={{ marginBottom: "20px" }}>
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            className={`tab-btn${activeTab === value ? " active" : ""}`}
            onClick={() => setActiveTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1,2,3].map(i => <SkeletonCard key={i} lines={3} />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon"><CheckSquare size={40} style={{ opacity: 0.3 }} /></div>
          <p className="empty-title">
            {activeTab ? `No ${activeTab.replace("_", " ")} tasks` : "No tasks assigned to you"}
          </p>
          <p className="empty-desc">
            {activeTab ? "Switch to a different filter to see more tasks." : "Browse projects to find work assigned to you."}
          </p>
          <Link to="/projects" className="btn-primary">
            <FolderKanban size={15} /> Browse Projects
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {tasks.map((task) => {
            const priority = PRIORITY_MAP[task.priority] || PRIORITY_MAP[1];
            const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.todo;

            return (
              <div key={task.id} className="card" style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px 18px", borderLeft: task.priority >= 3 ? `4px solid ${task.priority === 5 ? "#EF4444" : task.priority === 4 ? "#F97316" : "#F59E0B"}` : undefined }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Breadcrumb */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <FolderKanban size={12} style={{ color: "var(--text-muted)" }} />
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Sprint task
                    </span>
                  </div>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 4px" }}>{task.name}</h3>
                  {task.description && (
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 8px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {task.description}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span className={`badge ${priority.cls}`}>{priority.label}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {task.duration}d duration
                    </span>
                  </div>
                </div>

                {/* Status select */}
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  style={{
                    padding: "5px 10px", fontSize: "12px", fontWeight: "600",
                    borderRadius: "8px", border: `1px solid ${statusStyle.border}`,
                    background: statusStyle.bg, color: statusStyle.color,
                    outline: "none", cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
