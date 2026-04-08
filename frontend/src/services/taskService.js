import API from "../api/axios";

/**
 * Fetch all tasks for a specific sprint (paginated).
 * GET /sprints/:sprintId/tasks
 */
export async function getTasksBySprint(sprintId, skip = 0, limit = 100) {
  const response = await API.get(`/sprints/${sprintId}/tasks`, {
    params: { skip, limit },
  });
  return response.data;
}

/**
 * Create a new task.
 * POST /tasks
 *
 * @param {Object} data - { name, description?, duration, priority, status, sprint_id, assigned_to? }
 */
export async function createTask(data) {
  const response = await API.post("/tasks", data);
  return response.data;
}

/**
 * Update a task's status.
 * PATCH /tasks/:taskId/status
 *
 * @param {string} taskId
 * @param {string} status - "todo" | "in_progress" | "done"
 */
export async function updateTaskStatus(taskId, status) {
  const response = await API.patch(`/tasks/${taskId}/status`, { status });
  return response.data;
}

/**
 * Fetch the current user's assigned tasks.
 * GET /tasks/my
 */
export async function getMyTasks(status = null) {
  const params = {};
  if (status) params.status = status;
  const response = await API.get("/tasks/my", { params });
  return response.data;
}
