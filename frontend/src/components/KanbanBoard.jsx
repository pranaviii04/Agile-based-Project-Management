import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const COLUMNS = [
  { id: "todo",        label: "To Do",       color: "#94A3B8", bg: "rgba(100,116,139,0.08)" },
  { id: "in_progress", label: "In Progress", color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
  { id: "done",        label: "Done",        color: "#10B981", bg: "rgba(16,185,129,0.08)" },
];

const PRIORITY_MAP = {
  1: { label: "Low",      color: "#94A3B8" },
  2: { label: "Medium",   color: "#F59E0B" },
  3: { label: "High",     color: "#EF4444" },
  4: { label: "Urgent",   color: "#F97316" },
  5: { label: "Critical", color: "#DC2626" },
};

function avatarInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function avatarColor(name = "") {
  const colors = ["#2563EB","#7C3AED","#059669","#D97706","#E11D48","#0891B2"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % colors.length;
  return colors[h];
}

function CompactTaskCard({ task, assigneeName, isCritical, isDragging }) {
  const priority = PRIORITY_MAP[task.priority] || PRIORITY_MAP[1];
  return (
    <div
      className="kanban-card"
      style={{
        borderLeft: isCritical ? "3px solid #EF4444" : undefined,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 6px", lineHeight: 1.4 }}>
        {task.name}
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Priority dot */}
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: priority.color, display: "inline-block", flexShrink: 0 }} title={priority.label} />
          {/* Duration */}
          <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--bg-app)", padding: "1px 6px", borderRadius: "4px", border: "1px solid var(--border)" }}>
            {task.duration}d
          </span>
        </div>
        {/* Assignee avatar */}
        {assigneeName && (
          <div
            style={{ width: "22px", height: "22px", borderRadius: "50%", background: avatarColor(assigneeName), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "700", color: "#fff", flexShrink: 0 }}
            title={assigneeName}
          >
            {avatarInitials(assigneeName)}
          </div>
        )}
      </div>
    </div>
  );
}

function SortableCard({ task, assigneeName, isCritical }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <CompactTaskCard task={task} assigneeName={assigneeName} isCritical={isCritical} isDragging={isDragging} />
    </div>
  );
}

/**
 * @param {Array}    props.tasks          - All sprint tasks
 * @param {Function} props.onStatusChange - (taskId, newStatus) => Promise
 * @param {Array}    props.criticalIds    - Set of critical task IDs
 * @param {Array}    props.systemUsers    - For resolving assignee names
 */
export default function KanbanBoard({ tasks, onStatusChange, criticalIds = [], systemUsers = [] }) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const tasksByColumn = {
    todo:        tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    done:        tasks.filter((t) => t.status === "done"),
  };

  function getAssigneeName(task) {
    if (!task.assigned_to) return null;
    return systemUsers.find((u) => u.id === task.assigned_to)?.full_name || null;
  }

  function findTaskById(id) {
    return tasks.find((t) => t.id === id);
  }

  function findColumnOfTask(taskId) {
    return Object.entries(tasksByColumn).find(([, tasks]) =>
      tasks.some((t) => t.id === taskId)
    )?.[0] || null;
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !active) return;

    const sourceCol = findColumnOfTask(active.id);
    // over.id could be a column id or a task id
    const targetCol = COLUMNS.find((c) => c.id === over.id)
      ? over.id
      : findColumnOfTask(over.id);

    if (sourceCol && targetCol && sourceCol !== targetCol) {
      try {
        await onStatusChange(active.id, targetCol);
      } catch {
        // error handled by caller
      }
    }
  }

  const activeTask = activeId ? findTaskById(activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="kanban-board">
        {COLUMNS.map((col) => {
          const colTasks = tasksByColumn[col.id] || [];
          return (
            <SortableContext key={col.id} id={col.id} items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div
                className="kanban-col"
                style={{ "--col-accent": col.color } }
              >
                <div className="kanban-col-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: col.color }} />
                    <span style={{ color: "var(--text-primary)" }}>{col.label}</span>
                  </div>
                  <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", background: col.bg, color: col.color }}>
                    {colTasks.length}
                  </span>
                </div>

                {colTasks.length === 0 ? (
                  <div style={{ padding: "24px 8px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px", border: "2px dashed var(--border)", borderRadius: "8px", margin: "4px" }}>
                    Drop tasks here
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <SortableCard
                      key={task.id}
                      task={task}
                      assigneeName={getAssigneeName(task)}
                      isCritical={criticalIds.includes(task.id)}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask && (
          <CompactTaskCard
            task={activeTask}
            assigneeName={getAssigneeName(activeTask)}
            isCritical={criticalIds.includes(activeTask.id)}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
