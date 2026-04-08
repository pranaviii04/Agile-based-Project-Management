import API from "../api/axios";

/**
 * Fetch all sprints for a specific project.
 * GET /projects/:projectId/sprints
 */
export async function getSprintsByProject(projectId) {
  const response = await API.get(`/projects/${projectId}/sprints`);
  return response.data;
}

/**
 * Create a new sprint.
 * POST /sprints
 *
 * @param {Object} data - { name, project_id, start_date, end_date, status }
 */
export async function createSprint(data) {
  const response = await API.post("/sprints", data);
  return response.data;
}

/**
 * Fetch a single sprint by ID.
 * GET /sprints/:id
 */
export async function getSprintById(id) {
  const response = await API.get(`/sprints/${id}`);
  return response.data;
}
