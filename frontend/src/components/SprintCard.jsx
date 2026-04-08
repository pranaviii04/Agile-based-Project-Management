import { useNavigate } from "react-router-dom";

const STATUS_STYLES = {
  completed: "bg-emerald-500/15 text-emerald-400",
  active: "bg-indigo-500/15 text-indigo-400",
  planned: "bg-slate-700/50 text-slate-400",
};

function SprintCard({ sprint }) {
  const navigate = useNavigate();

  const startDate = new Date(sprint.start_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endDate = new Date(sprint.end_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <button
      type="button"
      onClick={() => navigate(`/sprints/${sprint.id}`)}
      className="w-full text-left bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-indigo-500 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">
            {sprint.name}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {startDate} — {endDate}
          </p>
        </div>
        <span
          className={`shrink-0 px-3 py-1 text-xs font-medium rounded-full capitalize ${
            STATUS_STYLES[sprint.status] || STATUS_STYLES.planned
          }`}
        >
          {sprint.status}
        </span>
      </div>
    </button>
  );
}

export default SprintCard;
