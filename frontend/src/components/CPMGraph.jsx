/**
 * CPMGraph — SVG-based critical path node graph
 * Renders a horizontal left-to-right task dependency graph.
 *
 * @param {Object}  cpmResult   - { critical_tasks: string[], slack_values: {[id]: number}, project_duration: number }
 * @param {Array}   tasks       - All sprint tasks (for names/durations)
 * @param {Object}  depMap      - { [taskId]: { deps: [{depends_on_task_id}] } }
 */
export default function CPMGraph({ cpmResult, tasks, depMap = {} }) {
  if (!cpmResult || tasks.length === 0) return null;

  const criticalSet = new Set(cpmResult.critical_tasks || []);
  const taskById = Object.fromEntries(tasks.map((t) => [t.id, t]));

  // ── Topological layout (assign column levels) ─────────────────
  const levels = {};
  const visited = new Set();

  function assignLevel(taskId, level = 0) {
    if (visited.has(taskId)) {
      levels[taskId] = Math.max(levels[taskId] || 0, level);
      return;
    }
    visited.add(taskId);
    levels[taskId] = Math.max(levels[taskId] || 0, level);
    const deps = depMap[taskId]?.deps || [];
    for (const dep of deps) {
      assignLevel(dep.depends_on_task_id, level - 1);
    }
  }

  // Assign levels: tasks with no dependents start at the end
  const taskIds = tasks.map((t) => t.id);
  taskIds.forEach((id) => assignLevel(id, 0));

  // Normalize levels to start from 0
  const minLevel = Math.min(...Object.values(levels));
  taskIds.forEach((id) => { levels[id] = (levels[id] || 0) - minLevel; });
  const maxLevel = Math.max(...Object.values(levels));

  // Group tasks by level
  const byLevel = {};
  taskIds.forEach((id) => {
    const lvl = levels[id];
    byLevel[lvl] = byLevel[lvl] || [];
    byLevel[lvl].push(id);
  });

  // ── Layout constants ────────────────────────────────────────
  const NODE_W = 110;
  const NODE_H = 52;
  const COL_GAP = 60;
  const ROW_GAP = 20;

  // Calculate positions
  const positions = {};
  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    const col = byLevel[lvl] || [];
    const totalH = col.length * NODE_H + (col.length - 1) * ROW_GAP;
    const startY = 20;
    col.forEach((id, i) => {
      positions[id] = {
        x: lvl * (NODE_W + COL_GAP) + 20,
        y: startY + i * (NODE_H + ROW_GAP),
      };
    });
  }

  const svgWidth = (maxLevel + 1) * (NODE_W + COL_GAP) + 40;
  const svgHeight = Math.max(...Object.values(positions).map((p) => p.y + NODE_H)) + 40;

  // ── Draw edges (dependencies) ────────────────────────────────
  const edges = [];
  taskIds.forEach((taskId) => {
    const deps = depMap[taskId]?.deps || [];
    deps.forEach((dep) => {
      const fromId = dep.depends_on_task_id;
      const toId = taskId;
      const from = positions[fromId];
      const to = positions[toId];
      if (!from || !to) return;
      const x1 = from.x + NODE_W;
      const y1 = from.y + NODE_H / 2;
      const x2 = to.x;
      const y2 = to.y + NODE_H / 2;
      const isCrit = criticalSet.has(fromId) && criticalSet.has(toId);
      const mid = (x1 + x2) / 2;
      edges.push(
        <g key={`${fromId}-${toId}`}>
          <path
            d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`}
            fill="none"
            stroke={isCrit ? "#EF4444" : "var(--border)"}
            strokeWidth={isCrit ? 2 : 1.5}
            strokeDasharray={isCrit ? undefined : "4 3"}
            markerEnd={`url(#arrow-${isCrit ? "crit" : "norm"})`}
          />
        </g>
      );
    });
  });

  // ── Draw nodes ───────────────────────────────────────────────
  const nodes = taskIds.map((id) => {
    const pos = positions[id];
    if (!pos) return null;
    const task = taskById[id];
    if (!task) return null;
    const isCrit = criticalSet.has(id);
    const slack = cpmResult.slack_values?.[id] ?? "—";
    const label = task.name.length > 12 ? task.name.slice(0, 11) + "…" : task.name;

    return (
      <g key={id} transform={`translate(${pos.x},${pos.y})`}>
        {/* Node rect */}
        <rect
          width={NODE_W}
          height={NODE_H}
          rx={8}
          fill={isCrit ? "rgba(239,68,68,0.10)" : "var(--bg-surface)"}
          stroke={isCrit ? "#EF4444" : "var(--border)"}
          strokeWidth={isCrit ? 2 : 1}
        />
        {/* Task name */}
        <text
          x={NODE_W / 2}
          y={18}
          textAnchor="middle"
          style={{ fontSize: "11px", fontWeight: "700", fill: isCrit ? "#DC2626" : "var(--text-primary)", fontFamily: "Inter, sans-serif" }}
        >
          {label}
        </text>
        {/* Duration */}
        <text
          x={NODE_W / 2}
          y={32}
          textAnchor="middle"
          style={{ fontSize: "10px", fill: "var(--text-muted)", fontFamily: "Inter, sans-serif" }}
        >
          {task.duration}d · slack: {slack}
        </text>
        {/* Critical badge */}
        {isCrit && (
          <text
            x={NODE_W / 2}
            y={46}
            textAnchor="middle"
            style={{ fontSize: "9px", fontWeight: "700", fill: "#EF4444", fontFamily: "Inter, sans-serif", letterSpacing: "0.04em" }}
          >
            CRITICAL
          </text>
        )}
      </g>
    );
  });

  return (
    <div className="cpm-graph-wrap">
      <p style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
        Critical Path Graph
      </p>
      <svg width={svgWidth} height={svgHeight} style={{ overflow: "visible", display: "block" }}>
        <defs>
          <marker id="arrow-crit" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#EF4444" />
          </marker>
          <marker id="arrow-norm" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="var(--text-muted)" />
          </marker>
        </defs>
        {edges}
        {nodes}
      </svg>
      <div style={{ marginTop: "12px", display: "flex", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "20px", height: "2px", background: "#EF4444" }} />
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Critical path</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "20px", height: "1px", background: "var(--border)", borderTop: "1px dashed var(--border)" }} />
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Normal dependency</span>
        </div>
      </div>
    </div>
  );
}
