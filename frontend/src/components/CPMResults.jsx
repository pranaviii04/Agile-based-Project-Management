import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const PIE_COLORS = {
  "To Do": "#64748b",
  "In Progress": "#f59e0b",
  Done: "#10b981",
};

/**
 * @param {Object}   props
 * @param {Object}   props.cpmResult    - { project_duration, critical_tasks, slack_values }
 * @param {Array}    props.tasks        - All tasks in the sprint
 */
function CPMResults({ cpmResult, tasks }) {
  // ── Pie chart data: task status distribution ─────────────────
  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  const pieData = [
    { name: "To Do", value: todoCount },
    { name: "In Progress", value: inProgressCount },
    { name: "Done", value: doneCount },
  ].filter((d) => d.value > 0);

  // ── Bar chart data: slack values per task ────────────────────
  const barData = Object.entries(cpmResult.slack_values).map(
    ([taskId, slack]) => {
      const task = tasks.find((t) => t.id === taskId);
      return {
        name: task ? task.name : taskId.slice(0, 8),
        slack,
        isCritical: cpmResult.critical_tasks.includes(taskId),
      };
    }
  );

  // ── Critical task names ──────────────────────────────────────
  const criticalNames = cpmResult.critical_tasks.map((id) => {
    const task = tasks.find((t) => t.id === id);
    return task ? task.name : id.slice(0, 8);
  });

  return (
    <section className="mt-8 space-y-6">
      <h2 className="text-xl font-semibold text-white">CPM Analysis Results</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Project Duration
          </p>
          <p className="text-3xl font-bold text-white">
            {cpmResult.project_duration}{" "}
            <span className="text-base font-normal text-slate-400">days</span>
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Critical Path
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {criticalNames.length > 0 ? (
              criticalNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-red-500/15 text-red-400 text-xs font-medium rounded">
                    {name}
                  </span>
                  {i < criticalNames.length - 1 && (
                    <span className="text-slate-500 text-xs">→</span>
                  )}
                </div>
              ))
            ) : (
              <span className="text-slate-500 text-xs text-italic">No critical path found</span>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Task Status Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            Task Status Distribution
          </h3>
          {pieData.length === 0 ? (
            <p className="text-slate-500 text-sm">No tasks to display.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[entry.name] || "#6366f1"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                  }}
                />
                <Legend
                  wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart: Slack Values */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            Slack Values by Task
          </h3>
          {barData.length === 0 ? (
            <p className="text-slate-500 text-sm">No slack data to display.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  label={{
                    value: "Slack (days)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#64748b",
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                  }}
                  formatter={(value, name, props) => [
                    `${value} days`,
                    props.payload.isCritical ? "Slack (Critical)" : "Slack",
                  ]}
                />
                <Bar dataKey="slack" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.isCritical ? "#ef4444" : "#6366f1"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Slack Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Task
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Slack (days)
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Critical
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {Object.entries(cpmResult.slack_values).map(([taskId, slack]) => {
              const task = tasks.find((t) => t.id === taskId);
              const isCritical = cpmResult.critical_tasks.includes(taskId);
              return (
                <tr key={taskId} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-3 text-sm text-white">
                    {task ? task.name : taskId.slice(0, 8)}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-300">{slack}</td>
                  <td className="px-5 py-3">
                    {isCritical ? (
                      <span className="px-2 py-0.5 bg-red-500/15 text-red-400 text-xs font-medium rounded">
                        Critical
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default CPMResults;
