"""
Decision Impact Analyzer — Scenario Propagation Engine
Meridian Technologies Organizational KPI Network

This engine runs live in your browser via Pyodide.
It propagates executive decisions through the interdependency DAG.
"""

import json
from collections import defaultdict, deque

# ═══════════════════════════════════════════════════════════════
# STAGE 1: PARSE MODEL
# ═══════════════════════════════════════════════════════════════

# org_model_json is passed from JS via Pyodide globals
model = json.loads(org_model_json)

# Build baseline + unit lookup from all divisions
baselines = {}
units = {}
for div in model["divisions"].values():
    for kpi in div["kpis"]:
        baselines[kpi["id"]] = kpi["baseline"]
        units[kpi["id"]] = kpi.get("unit")


# Hard domains per KPI unit — a projected value can't leave these (a satisfaction score
# can't exceed 5, a churn/utilisation percent can't go below 0 or above 100, a headcount
# can't go negative). Without this, slider-reachable inputs print impossible values like
# CSAT 5.4/5 or negative churn. Dollar amounts stay unbounded (free cash flow can go negative).
UNIT_BOUNDS = {
    "score_1_5": (1.0, 5.0),
    "percent": (0.0, 100.0),
    "index_0_100": (0.0, 100.0),
    "score": (-100.0, 100.0),   # NPS scale
    "count": (0.0, None),
    "days": (0.0, None),
}


def clamp_to_unit(value, unit):
    bounds = UNIT_BOUNDS.get(unit)
    if not bounds:
        return value
    lo, hi = bounds
    if lo is not None and value < lo:
        return lo
    if hi is not None and value > hi:
        return hi
    return value

edges = model["interdependencies"]

# Build adjacency list
graph = defaultdict(list)
for edge in edges:
    graph[edge["from_kpi"]].append(edge)

# Topological sort (Kahn's algorithm)
def topological_sort(edges):
    adj = defaultdict(list)
    in_degree = defaultdict(int)
    nodes = set()
    for edge in edges:
        src, dst = edge["from_kpi"], edge["to_kpi"]
        adj[src].append(dst)
        in_degree[dst] += 1
        nodes.add(src)
        nodes.add(dst)
    queue = deque([n for n in nodes if in_degree[n] == 0])
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in adj[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    return order

order = topological_sort(edges)

# ═══════════════════════════════════════════════════════════════
# STAGE 2: PROPAGATE
# ═══════════════════════════════════════════════════════════════

# input_changes_json is passed from JS via Pyodide globals
input_changes = json.loads(input_changes_json)

# Initialize change deltas (as fractions, not percentages)
# Track cumulative lags through the cascade path
changes = {}
cumulative_lags = {}
max_sigmas = {}
input_kpis = set()

for ic in input_changes:
    kpi = ic["kpi"]
    input_kpis.add(kpi)
    cumulative_lags[kpi] = 0
    max_sigmas[kpi] = 0
    if "change_pct" in ic:
        changes[kpi] = ic["change_pct"] / 100.0
    elif "change_absolute" in ic:
        changes[kpi] = ic["change_absolute"] / baselines.get(kpi, 1)

# Forward-propagate changes AND cumulative lags through the DAG
affected_links = []

for node in order:
    if node not in changes:
        continue
    for edge in graph.get(node, []):
        target = edge["to_kpi"]
        delta = changes[node] * edge["coefficient"]
        changes[target] = changes.get(target, 0) + delta

        # Cumulative lag = parent lag + edge lag
        new_lag = cumulative_lags.get(node, 0) + edge["lag_months"]
        cumulative_lags[target] = max(cumulative_lags.get(target, 0), new_lag)
        max_sigmas[target] = max(max_sigmas.get(target, 0), edge.get("sigma", 0))

        # Track affected links for Sankey highlighting
        impact = "positive" if delta > 0 else "negative" if delta < 0 else "neutral"
        affected_links.append({
            "source": node,
            "target": target,
            "impact": impact,
            "delta_pct": round(delta * 100, 4),
        })

# Build cascade results
cascade_results = {}
for node in order:
    if node not in changes:
        continue
    baseline = baselines.get(node, 0)
    # Clamp to the KPI's unit domain (score 1-5, percent 0-100, count >= 0, …) so a large
    # slider input can't print an impossible value like CSAT 5.4 or negative churn.
    projected = clamp_to_unit(round(baseline * (1 + changes[node]), 2), units.get(node))

    cascade_results[node] = {
        "kpi": node,
        "baseline": baseline,
        "change_pct": round(changes[node] * 100, 2),
        "projected": projected,
        "lag_months": cumulative_lags.get(node, 0),
        "sigma": max_sigmas.get(node, 0),
    }

# ═══════════════════════════════════════════════════════════════
# STAGE 3: OUTPUT
# ═══════════════════════════════════════════════════════════════

# Build quarterly breakdown based on cumulative lag months
quarterly = {"q1": [], "q2": [], "q4": []}
for kpi_id, data in cascade_results.items():
    lag = data["lag_months"]
    entry = {
        "kpi": kpi_id,
        "change_pct": data["change_pct"],
        "projected": data["projected"],
    }
    if lag <= 3:
        quarterly["q1"].append(entry)
    if lag <= 6:
        quarterly["q2"].append(entry)
    quarterly["q4"].append(entry)

result = {
    "cascade": list(cascade_results.values()),
    "quarterly": quarterly,
    "affected_links": affected_links,
}
