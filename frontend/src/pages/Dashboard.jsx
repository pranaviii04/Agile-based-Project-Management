import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProjects } from "../services/projectService";
import { getAllSprints } from "../services/sprintService";
import { getMyTasks } from "../services/taskService";
import toast from "react-hot-toast";
import { SkeletonMetrics } from "../components/Skeleton";
import {
  FolderKanban, Clock, CheckSquare, AlertCircle, Plus, TrendingUp,
} from "lucide-react";


function avatarColor(name = "") {
  const colors = ["#2563EB","#7C3AED","#059669","#D97706","#E11D48","#0891B2"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % colors.length;
  return colors[h];
}

const ACTIVITY_FEED = [
  { id: 1, text: "Sprint 2 was marked Active",    time: "2m ago",   icon: "🚀" },
  { id: 2, text: "Task 'Design login page' done",  time: "18m ago",  icon: "✅" },
  { id: 3, text: "New project 'Inventory' created",time: "1h ago",   icon: "📁" },
  { id: 4, text: "CPM analysis run for Sprint 1",  time: "3h ago",   icon: "📊" },
  { id: 5, text: "Admin added user himanshu@gmail.com",   time: "5h ago",   icon: "👤" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ projects: 0, sprints: 0, tasks: 0, overdue: 0 });
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [projects, sprints, myTasks] = await Promise.all([
          getProjects().catch(() => []),
          getAllSprints().catch(() => []),
          getMyTasks().catch(() => []),
        ]);
        const openSprints = sprints.filter((s) => s.status !== "completed").length;
        const pendingTasks = myTasks.filter((t) => t.status !== "done");
        setStats({
          projects: projects.length,
          sprints: openSprints,
          tasks: pendingTasks.length,
          overdue: 0,
        });
        setTasks(myTasks.slice(0, 5));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const METRICS = [
    { label: "Active Projects",  val: stats.projects, icon: FolderKanban, color: "#2563EB", bg: "rgba(37,99,235,0.10)",  trend: "+1 this week" },
    { label: "Open Sprints",     val: stats.sprints,  icon: Clock,        color: "#059669", bg: "rgba(16,185,129,0.10)", trend: "On track"     },
    { label: "My Pending Tasks", val: stats.tasks,    icon: CheckSquare,  color: "#D97706", bg: "rgba(245,158,11,0.10)", trend: "All on time"  },
    { label: "Overdue Tasks",    val: stats.overdue,  icon: AlertCircle,  color: "#DC2626", bg: "rgba(239,68,68,0.10)",  trend: "All on time"  },
  ];

  return (
    <div className="page-wrap">
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 className="page-title">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}
          {user ? `, ${user.full_name.split(" ")[0]}` : ""} 
        </h1>
        <p className="page-subtitle">Here's what's happening across your workspace today.</p>
      </div>

      {/* Metrics Row */}
      {loading ? (
        <SkeletonMetrics count={4} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          {METRICS.map(({ label, val, icon: Icon, color, bg, trend }) => (
            <div key={label} className="metric-card fade-up">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                    {label}
                  </p>
                  <p style={{ fontSize: "36px", fontWeight: "800", color, lineHeight: 1, margin: 0 }}>{val}</p>
                </div>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
                  <Icon size={20} strokeWidth={1.8} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "12px" }}>
                <TrendingUp size={12} style={{ color: "var(--color-done)" }} />
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{trend}</span>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Activity Feed + Quick Links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Activity Feed */}
        <div className="card fade-up">
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>
            Recent Activity
          </h3>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {ACTIVITY_FEED.map((item, i) => (
              <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 0", borderBottom: i < ACTIVITY_FEED.length - 1 ? "1px solid var(--border)" : "none" }}>
                <span style={{ fontSize: "18px", flexShrink: 0, marginTop: "1px" }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>{item.text}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="card fade-up">
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>
            Quick Links
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { to: "/projects", label: "Browse all projects",  icon: "📁" },
              { to: "/my-tasks", label: "View my tasks",        icon: "✅" },
              { to: "/projects", label: "Start a new sprint",   icon: "🚀" },
            ].map(({ to, label, icon }) => (
              <Link
                key={label}
                to={to}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px", borderRadius: "8px", textDecoration: "none",
                  border: "1px solid var(--border)", background: "var(--bg-app)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--bg-active)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-app)"; }}
              >
                <span style={{ fontSize: "18px" }}>{icon}</span>
                <span style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-primary)" }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <Link
        to="/projects"
        title="Quick add (browse to a project)"
        style={{
          position: "fixed", bottom: "28px", right: "28px",
          width: "52px", height: "52px", borderRadius: "50%",
          background: "var(--gradient-cta)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(37,99,235,0.40)",
          textDecoration: "none",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          zIndex: 50,
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.50)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,99,235,0.40)"; }}
      >
        <Plus size={22} strokeWidth={2.5} />
      </Link>
    </div>
  );
}
