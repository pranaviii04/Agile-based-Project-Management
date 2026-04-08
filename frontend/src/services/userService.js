import API from "../api/axios";

/**
 * Fetch all system users.
 * GET /users
 */
export async function getAllUsers() {
  const response = await API.get("/users");
  return response.data;
}
