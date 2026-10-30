# Performance review rubric

## PERF-01 — Hot paths
Avoid obvious O(n²) or unbounded work on UI list/render paths without need.

## PERF-02 — Allocations
Do not introduce heavy allocations in tight loops without justification.
