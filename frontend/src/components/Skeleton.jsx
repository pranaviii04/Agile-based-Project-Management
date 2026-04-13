/**
 * Skeleton loading components
 */

export function SkeletonText({ width = "100%", height = "14px", className = "" }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: "6px" }}
    />
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <SkeletonText width="60%" height="16px" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonText key={i} width={i === lines - 2 ? "40%" : "100%"} />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
      <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <SkeletonText width="50%" height="13px" />
        <SkeletonText width="30%" height="12px" />
      </div>
      <SkeletonText width="80px" height="13px" />
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={4} />
      ))}
    </div>
  );
}

export function SkeletonMetrics({ count = 4 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="metric-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <SkeletonText width="50%" height="12px" />
          <SkeletonText width="30%" height="32px" />
        </div>
      ))}
    </div>
  );
}
