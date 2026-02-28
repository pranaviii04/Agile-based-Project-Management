"""
CPM Service Layer
-----------------
Bridges the pure CPM engine with the rest of the application.
Currently accepts pre-formatted task lists to run CPM analysis.
"""

from typing import List, Dict

from .engine import run_cpm


def run_cpm_for_sprint(sprint_id: str, tasks: List[Dict]) -> Dict:
    """
    Executes the CPM engine for a specific sprint and formats the output.
    
    Args:
        sprint_id: The identifier for the sprint.
        tasks: A list of task dictionaries containing 'id', 'duration', and 'dependencies'.
        
    Returns:
        A dictionary containing the sprint_id, project_duration,
        critical_tasks list, and slack_values for each task.
        
    Raises:
        ValueError: If the sprint_id is empty, tasks list is invalid/empty,
                    or if the CPM engine encounters invalid data/cycles.
    """
    if not sprint_id or not str(sprint_id).strip():
        raise ValueError("sprint_id cannot be empty.")
        
    if not isinstance(tasks, list):
        raise ValueError("tasks must be a list.")
        
    if len(tasks) == 0:
        raise ValueError("tasks list cannot be empty.")

    # TODO: Replace tasks parameter with DB fetch:
    # tasks = get_tasks_for_cpm(db, sprint_id)
    
    result = run_cpm(tasks)
    
    slack_values = {
        task_id: task_data["slack"]
        for task_id, task_data in result["tasks"].items()
    }
    
    return {
        "sprint_id": str(sprint_id),
        "project_duration": result["project_duration"],
        "critical_tasks": result["critical_path"],
        "slack_values": slack_values
    }
