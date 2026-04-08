import API from "../api/axios";

/**
 * Run CPM analysis for a sprint.
 * POST /sprints/:sprintId/cpm
 *
 * @returns {{ sprint_id, project_duration, critical_tasks, slack_values }}
 */
export async function runCPM(sprintId) {
  const response = await API.post(`/sprints/${sprintId}/cpm`);
  return response.data;
}
