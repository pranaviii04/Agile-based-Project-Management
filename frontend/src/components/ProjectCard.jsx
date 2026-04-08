import { useNavigate } from "react-router-dom";

function ProjectCard({ project }) {
  const navigate = useNavigate();

  const formattedDate = new Date(project.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <button
      type="button"
      onClick={() => navigate(`/projects/${project.id}`)}
      className="w-full text-left bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-indigo-500 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs text-slate-500 mt-1">
          {formattedDate}
        </span>
      </div>
    </button>
  );
}

export default ProjectCard;
