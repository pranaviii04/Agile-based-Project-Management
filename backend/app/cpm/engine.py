"""
CPM Engine
----------
Core Critical Path Method algorithm.

The CPM engine takes a directed acyclic graph (DAG) of tasks with
durations and dependencies, then computes:
  - Earliest Start / Earliest Finish (ES / EF)
  - Latest Start  / Latest Finish  (LS / LF)
  - Total Float (slack) for each task
  - The Critical Path (tasks with zero float)

NOTE: Algorithm is NOT implemented yet — only the class / function
signatures are scaffolded.
"""

from __future__ import annotations

from app.cpm.schemas import CPMInput, CPMResult


class CPMEngine:
    """
    Stateless CPM calculator.

    Usage (once implemented):
        engine = CPMEngine()
        result = engine.compute(cpm_input)
    """

    def compute(self, data: CPMInput) -> CPMResult:
        """
        Run the CPM algorithm on the given input.

        Parameters
        ----------
        data : CPMInput
            A list of tasks with durations and dependency edges.

        Returns
        -------
        CPMResult
            Computed schedule including ES/EF/LS/LF, float, and
            the critical-path task IDs.
        """
        raise NotImplementedError
