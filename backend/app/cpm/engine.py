"""
Pure Python Critical Path Method (CPM) Engine
---------------------------------------------
Takes a directed acyclic graph (DAG) of tasks with durations and dependencies,
and computes:
  - Earliest Start (ES) and Earliest Finish (EF)
  - Latest Start (LS) and Latest Finish (LF)
  - Slack (Total Float)
  - The Critical Path (tasks with zero slack)
  - Total project duration

NOTE: This module does NOT depend on FastAPI, SQLAlchemy, or the database.
It is a pure utility that operates strictly on dictionaries.
"""

from collections import deque
from typing import Dict, List, Tuple


def validate_tasks(tasks: List[Dict]) -> None:
    """
    Validate the input task list structure and constraints.
    Raises ValueError on duplicates, missing keys, invalid durations,
    and missing dependency references.
    """
    if not tasks:
        raise ValueError("Task list cannot be empty.")
    
    task_ids = set()
    
    # First pass: Validate required keys and duplicate IDs
    for task in tasks:
        if "id" not in task or "duration" not in task or "dependencies" not in task:
            raise ValueError("Every task must contain 'id', 'duration', and 'dependencies'.")
        
        task_id = task["id"]
        if task_id in task_ids:
            raise ValueError(f"Duplicate task ID detected: {task_id}")
        task_ids.add(task_id)

        if not isinstance(task["duration"], (int, float)) or task["duration"] <= 0:
            raise ValueError(f"Invalid duration for task '{task_id}': must be > 0.")
            
    # Second pass: Ensure all dependencies reference existing tasks
    for task in tasks:
        for dep in task["dependencies"]:
            if dep not in task_ids:
                raise ValueError(f"Dependency '{dep}' for task '{task['id']}' does not exist.")


def build_graph(tasks: List[Dict]) -> Tuple[Dict[str, List[str]], Dict[str, int], Dict[str, List[str]]]:
    """
    Convert the flat task list into adjacency lists for forward and backward traversal.
    
    Returns:
        graph: Dict mapping task_id to its successors.
        in_degree: Dict counting how many predecessors a task has.
        reverse_graph: Dict mapping task_id to its predecessors.
    """
    graph = {task["id"]: [] for task in tasks}
    in_degree = {task["id"]: 0 for task in tasks}
    reverse_graph = {task["id"]: [] for task in tasks}

    for task in tasks:
        task_id = task["id"]
        for dep in task["dependencies"]:
            # Edge direction: dependency (predecessor) -> task (successor)
            graph[dep].append(task_id)
            in_degree[task_id] += 1
            reverse_graph[task_id].append(dep)
            
    return graph, in_degree, reverse_graph


def topological_sort(graph: Dict[str, List[str]], in_degree: Dict[str, int]) -> List[str]:
    """
    Perform Kahn's algorithm to get a topological ordering of tasks.
    Raises ValueError if a cycle is detected.
    """
    # Start with tasks that have no dependencies
    queue = deque([node for node, deg in in_degree.items() if deg == 0])
    topo_order = []

    while queue:
        current = queue.popleft()
        topo_order.append(current)

        for successor in graph[current]:
            in_degree[successor] -= 1
            if in_degree[successor] == 0:
                queue.append(successor)
                
    # If we didn't visit all nodes, the graph has a cycle
    if len(topo_order) != len(graph):
        raise ValueError("Circular dependency detected.")

    return topo_order


def forward_pass(topo_order: List[str], reverse_graph: Dict[str, List[str]], tasks_dict: Dict) -> int:
    """
    Compute Earliest Start (ES) and Earliest Finish (EF) for all tasks.
    Returns the total project duration.
    """
    for task_id in topo_order:
        duration = tasks_dict[task_id]["duration"]
        predecessors = reverse_graph[task_id]

        if not predecessors:
            es = 0
        else:
            es = max(tasks_dict[pred]["EF"] for pred in predecessors)
        
        ef = es + duration
        tasks_dict[task_id].update({"ES": es, "EF": ef})

    # The project duration is the maximum Earliest Finish across all tasks
    project_duration = max((tasks_dict[task_id]["EF"] for task_id in topo_order), default=0)
    return project_duration


def backward_pass(topo_order: List[str], graph: Dict[str, List[str]], tasks_dict: Dict, project_duration: int) -> None:
    """
    Compute Latest Start (LS) and Latest Finish (LF) for all tasks.
    Traverses in reverse topological order.
    """
    for task_id in reversed(topo_order):
        duration = tasks_dict[task_id]["duration"]
        successors = graph[task_id]

        if not successors:
            lf = project_duration
        else:
            lf = min(tasks_dict[succ]["LS"] for succ in successors)
            
        ls = lf - duration
        tasks_dict[task_id].update({"LS": ls, "LF": lf})


def calculate_slack(tasks_dict: Dict) -> None:
    """
    Calculate total float/slack for each task (LS - ES).
    """
    for data in tasks_dict.values():
        data["slack"] = data["LS"] - data["ES"]


def extract_critical_path(topo_order: List[str], tasks_dict: Dict) -> List[str]:
    """
    Return the IDs of all tasks on the critical path (where slack == 0),
    ordered topologically.
    """
    return [task_id for task_id in topo_order if tasks_dict[task_id]["slack"] == 0]


def run_cpm(tasks: List[Dict]) -> Dict:
    """
    Orchestrates the entire Critical Path Method algorithm.
    
    Args:
        tasks: A list of dicts, each containing 'id', 'duration', and 'dependencies'.
        
    Returns:
        A dict containing:
        - project_duration: Total expected duration of the project.
        - critical_path: Topologically sorted list of critical task IDs.
        - tasks: Detailed schedule for each task mapping task_id to ES, EF, LS, LF, slack.
    """
    validate_tasks(tasks)

    # Convert the flat task list into a dictionary for easy in-place updates.
    tasks_dict = {task["id"]: {"duration": task["duration"]} for task in tasks}

    # Algorithm stages
    graph, in_degree, reverse_graph = build_graph(tasks)
    topo_order = topological_sort(graph, in_degree)

    project_duration = forward_pass(topo_order, reverse_graph, tasks_dict)
    backward_pass(topo_order, graph, tasks_dict, project_duration)
    
    calculate_slack(tasks_dict)
    critical_path = extract_critical_path(topo_order, tasks_dict)

    return {
        "project_duration": project_duration,
        "critical_path": critical_path,
        "tasks": tasks_dict
    }
