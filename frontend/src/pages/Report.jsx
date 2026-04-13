import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getProjectReport } from "../services/projectService";
import { SkeletonMetrics } from "../components/Skeleton";
import { ChevronRight, BarChart2 } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const PIE_COLORS = {
  "To Do":       "#94A3B8",
  "In Progress": "#F59E0B",
  Done:          "#10B981",
};

const TOOLTIP_STYLE = {
  backgroundColor: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--text-primary)",
  boxShadow: "var(--shadow-md)",
  fontSize: "13px",
};

function Report() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getProjectReport(id)
      .then((data) => { setReport(data); setError(""); })
      .catch((err) => { setError(err.response?.data?.detail || "Failed to load report."); })
      .finally(() => setLoading(false));
  }, [id]);

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-wrap">
        <div style={{ height: "20px", marginBottom: "24px" }} />
        <SkeletonMetrics count={6} />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="page-wrap">
        <div className="alert-error">{error}</div>
      </div>
    );
  }

  if (!report) return null;

  // ── Chart data ───────────────────────────────────────────
  const pieData = [
    { name: "To Do",       value: report.todo_tasks       },
    { name: "In Progress", value: report.ongoing_tasks    },
    { name: "Done",        value: report.completed_tasks  },
  ].filter((d) => d.value > 0);

  const barData = [
    { name: "Avg Completion", value: report.average_sprint_completion_percentage },
  ];

  const SUMMARY_CARDS = [
    { label: "Sprints",      value: report.total_sprints,                              color: "var(--text-secondary)", bg: "rgba(100,116,139,0.08)" },
    { label: "Total Tasks",  value: report.total_tasks,                                color: "var(--text-primary)",   bg: "rgba(15,23,42,0.04)" },
    { label: "Completed",    value: report.completed_tasks,                            color: "#059669",               bg: "rgba(16,185,129,0.08)" },
    { label: "Ongoing",      value: report.ongoing_tasks,                              color: "#D97706",               bg: "rgba(245,158,11,0.08)" },
    { label: "To Do",        value: report.todo_tasks,                                 color: "#64748B",               bg: "rgba(100,116,139,0.08)" },
    { label: "Avg Complete", value: `${report.average_sprint_completion_percentage}%`, color: "var(--accent)",         bg: "rgba(37,99,235,0.08)" },
  ];

  return (
    <div className="page-wrap">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link to="/projects">Projects</Link>
        <ChevronRight size={14} />
        <Link to={`/projects/${id}`}>Project Details</Link>
        <ChevronRight size={14} />
        <span className="bc-current">Report</span>
      </nav>

      {/* Page header — same pattern as MyTasks */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
            <BarChart2 size={22} style={{ color: "var(--accent)" }} />
            <h1 className="page-title" style={{ margin: 0 }}>Project Analytics Report</h1>
          </div>
          <p className="page-subtitle">
            {report.total_sprints} sprint{report.total_sprints !== 1 ? "s" : ""} · {report.total_tasks} total task{report.total_tasks !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Summary metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "14px", marginBottom: "28px" }}>
        {SUMMARY_CARDS.map(({ label, value, color, bg }) => (
          <div key={label} className="metric-card fade-up" style={{ textAlign: "center", background: bg }}>
            <p style={{ fontSize: "30px", fontWeight: "800", color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

        {/* Task Distribution Donut */}
        <div className="card">
          <h3 style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px" }}>
            Task Distribution
          </h3>
          {pieData.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 0" }}>
              <p className="empty-title">No tasks yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  innerRadius={60} outerRadius={96}
                  paddingAngle={3} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name] || "#6366f1"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "var(--text-secondary)" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sprint Completion Bar */}
        <div className="card">
          <h3 style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px" }}>
            Average Sprint Completion
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barSize={72}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: "var(--bg-hover)" }}
                formatter={(v) => [`${v}%`, "Completion"]}
              />
              <Bar dataKey="value" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CPM Summary */}
      <div className="card">
        <h3 style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px" }}>
          Latest Sprint — CPM Summary
        </h3>

        {!report.latest_sprint ? (
          <div className="empty-state" style={{ padding: "32px 0" }}>
            <p className="empty-title">No active sprints</p>
            <p className="empty-desc">Run CPM from a sprint to see the critical path here.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {/* Duration card */}
            <div className="card-sm">
              <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                Project Duration
              </p>
              <p style={{ fontSize: "32px", fontWeight: "800", color: "var(--accent)", lineHeight: 1 }}>
                {report.latest_sprint.project_duration}{" "}
                <span style={{ fontSize: "15px", fontWeight: "400", color: "var(--text-secondary)" }}>days</span>
              </p>
            </div>

            {/* Critical path card */}
            <div className="card-sm">
              <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                Critical Path
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
                {report.latest_sprint.critical_tasks?.length > 0 ? (
                  report.latest_sprint.critical_tasks.map((name, i) => (
                    <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <span className="badge badge-red">{name}</span>
                      {i < report.latest_sprint.critical_tasks.length - 1 && (
                        <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>→</span>
                      )}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>
                    None calculated
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default Report;
