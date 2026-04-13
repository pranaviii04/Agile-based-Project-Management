import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const PIE_COLORS = { "To Do": "#94A3B8", "In Progress": "#F59E0B", Done: "#10B981" };
const TOOLTIP_STYLE = { backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", boxShadow: "var(--shadow-md)", fontSize: "13px" };

export default function CPMResults({ cpmResult, tasks }) {
  if (!cpmResult) return null;

  const todoCount       = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const doneCount       = tasks.filter((t) => t.status === "done").length;

  const pieData = [
    { name: "To Do",       value: todoCount        },
    { name: "In Progress", value: inProgressCount  },
    { name: "Done",        value: doneCount        },
  ].filter((d) => d.value > 0);

  const barData = Object.entries(cpmResult.slack_values).map(([taskId, slack]) => {
    const task = tasks.find((t) => t.id === taskId);
    return { name: task ? task.name : taskId.slice(0, 8), slack, isCritical: cpmResult.critical_tasks.includes(taskId) };
  });

  const criticalNames = cpmResult.critical_tasks.map((id) => {
    const t = tasks.find((t) => t.id === id);
    return t ? t.name : id.slice(0, 8);
  });

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
        CPM Analysis Results
      </h3>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div className="card-sm">
          <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Project Duration</p>
          <p style={{ fontSize: "36px", fontWeight: "800", color: "var(--accent)", lineHeight: 1, margin: 0 }}>
            {cpmResult.project_duration} <span style={{ fontSize: "15px", fontWeight: "400", color: "var(--text-secondary)" }}>days</span>
          </p>
        </div>
        <div className="card-sm">
          <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Critical Path</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
            {criticalNames.length > 0 ? criticalNames.map((name, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span className="badge badge-red">{name}</span>
                {i < criticalNames.length - 1 && <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>→</span>}
              </div>
            )) : <span style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>No critical path</span>}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div className="card">
          <h4 style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>Task Status Distribution</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((e) => <Cell key={e.name} fill={PIE_COLORS[e.name] || "#6366f1"} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "var(--text-secondary)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h4 style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>Slack Values by Task</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} angle={-25} textAnchor="end" height={50} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--bg-hover)" }} formatter={(v, _, p) => [`${v}d`, p.payload.isCritical ? "Slack (Critical)" : "Slack"]} />
              <Bar dataKey="slack" radius={[4,4,0,0]}>
                {barData.map((e, i) => <Cell key={i} fill={e.isCritical ? "#EF4444" : "var(--accent)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Slack Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr><th>Task</th><th>Slack (days)</th><th>Status</th></tr>
          </thead>
          <tbody>
            {Object.entries(cpmResult.slack_values).map(([taskId, slack]) => {
              const task = tasks.find((t) => t.id === taskId);
              const isCrit = cpmResult.critical_tasks.includes(taskId);
              return (
                <tr key={taskId}>
                  <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{task ? task.name : taskId.slice(0,8)}</td>
                  <td>{slack}</td>
                  <td>{isCrit ? <span className="badge badge-red">Critical</span> : <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
