import API from "../api/axios";

/**
 * Fetch all projects (paginated).
 * GET /projects?skip=0&limit=100
 */
export async function getProjects(skip = 0, limit = 100) {
  const response = await API.get("/projects/", { params: { skip, limit } });
  return response.data;
}

/**
 * Create a new project.
 * POST /projects
 */
export async function createProject(data) {
  const response = await API.post("/projects/", data);
  return response.data;
}

/**
 * Fetch a single project by ID.
 * GET /projects/:id
 */
export async function getProjectById(id) {
  const response = await API.get(`/projects/${id}`);
  return response.data;
}

/**
 * Update a project by ID.
 * PUT /projects/:id
 */
export async function updateProject(id, data) {
  const response = await API.put(`/projects/${id}`, data);
  return response.data;
}

/**
 * Delete a project by ID (admin only).
 * DELETE /projects/:id
 */
export async function deleteProject(id) {
  const response = await API.delete(`/projects/${id}`);
  return response.data;
}

/**
 * Fetch project report analytics.
 * GET /projects/:id/report
 */
export async function getProjectReport(id) {
  const response = await API.get(`/projects/${id}/report`);
  return response.data;
}
