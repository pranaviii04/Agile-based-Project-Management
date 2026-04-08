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
