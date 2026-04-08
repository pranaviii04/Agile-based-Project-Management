import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getProjectReport } from "../services/projectService";
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

function Report() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getProjectReport(id)
      .then((data) => {
        setReport(data);
        setError("");
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Failed to load project report.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-slate-400">Loading report...</p>
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

  if (!report) return null;

  // Pie chart data: Task Distribution
  const pieData = [
    { name: "To Do", value: report.todo_tasks },
    { name: "In Progress", value: report.ongoing_tasks },
    { name: "Done", value: report.completed_tasks },
  ].filter((d) => d.value > 0);

  // Bar chart data: Sprint Completion
  const barData = [
    {
      name: "Avg Completion",
      value: report.average_sprint_completion_percentage,
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="text-sm text-slate-400 mb-6">
        <Link to="/projects" className="hover:text-white transition-colors">
          Projects
        </Link>
        <span className="mx-2">/</span>
        <Link
          to={`/projects/${id}`}
          className="hover:text-white transition-colors"
        >
          Project Details
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">Report</span>
      </nav>

      <h1 className="text-3xl font-bold text-white mb-8">Project Analytics Report</h1>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-300">
            {report.total_sprints}
          </p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
            Sprints
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{report.total_tasks}</p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
            Total Tasks
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">
            {report.completed_tasks}
          </p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
            Completed
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">
            {report.ongoing_tasks}
          </p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
            Ongoing
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-400">
            {report.todo_tasks}
          </p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
            To Do
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-indigo-400">
            {report.average_sprint_completion_percentage}%
          </p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
            Avg Completion
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Task Distribution Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">
            Task Distribution
          </h3>
          {pieData.length === 0 ? (
            <p className="text-slate-500 text-sm">No tasks assigned.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
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
                <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sprint Completion Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">
            Average Sprint Completion (%)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                domain={[0, 100]}
              />
              <Tooltip
                cursor={{ fill: "#334155" }}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
                formatter={(value) => [`${value}%`]}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={100} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CPM Summary Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">
          Latest Sprint CPM Summary
        </h3>
        {!report.latest_sprint ? (
          <p className="text-slate-500 text-sm">
            No active sprints available for CPM summary.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Project Duration
              </p>
              <p className="text-3xl font-bold text-white">
                {report.latest_sprint.project_duration}{" "}
                <span className="text-base font-normal text-slate-400">
                  days
                </span>
              </p>
            </div>
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                Critical Path
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {report.latest_sprint.critical_tasks?.length > 0 ? (
                  report.latest_sprint.critical_tasks.map((name, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-red-500/15 text-red-400 text-sm font-medium rounded">
                        {name}
                      </span>
                      {i < report.latest_sprint.critical_tasks.length - 1 && (
                        <span className="text-slate-500">→</span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm italic">
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
