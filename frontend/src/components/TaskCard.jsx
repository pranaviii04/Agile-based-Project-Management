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

function TaskCard({ task, onStatusChange }) {
  const priority = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS[1];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        {/* Left: task info */}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white truncate">
            {task.name}
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
                Assigned: <span className="text-slate-300">#{task.assigned_to}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: status dropdown */}
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer ${
            STATUS_STYLES[task.status] || STATUS_STYLES.todo
          }`}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default TaskCard;
