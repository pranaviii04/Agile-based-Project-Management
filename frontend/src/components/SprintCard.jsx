import { useNavigate } from "react-router-dom";

const STATUS_CONFIG = {
  completed: {
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.22)",
    color: "#059669",
  },
  active: {
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.22)",
    color: "var(--accent-blue)",
  },
  planned: {
    bg: "rgba(148,163,184,0.10)",
    border: "rgba(148,163,184,0.22)",
    color: "var(--text-muted)",
  },
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

  const statusStyle = STATUS_CONFIG[sprint.status] || STATUS_CONFIG.planned;

  return (
    <button
      type="button"
      onClick={() => navigate(`/sprints/${sprint.id}`)}
      className="card fade-up"
      style={{ width: "100%", textAlign: "left", cursor: "pointer", border: "none", padding: "20px 28px" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "var(--text-primary)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {sprint.name}
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            {startDate} — {endDate}
          </p>
        </div>
        <span
          style={{
            flexShrink: 0,
            padding: "4px 12px",
            fontSize: "12px",
            fontWeight: "600",
            borderRadius: "999px",
            textTransform: "capitalize",
            background: statusStyle.bg,
            border: `1px solid ${statusStyle.border}`,
            color: statusStyle.color,
          }}
        >
          {sprint.status}
        </span>
      </div>
    </button>
  );
}

export default SprintCard;
