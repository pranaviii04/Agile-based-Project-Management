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
      className="card fade-up"
      style={{ width: "100%", textAlign: "left", cursor: "pointer", border: "none", padding: "24px 28px" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "var(--text-primary)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {project.name}
          </h3>
          {project.description && (
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                marginTop: "6px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {project.description}
            </p>
          )}
        </div>
        <span
          style={{
            flexShrink: 0,
            fontSize: "12px",
            color: "var(--text-muted)",
            marginTop: "2px",
            whiteSpace: "nowrap",
          }}
        >
          {formattedDate}
        </span>
      </div>
    </button>
  );
}

export default ProjectCard;
