"""Generate scenario presets by propagating shocks through the org model DAG."""

import sys
import os
import json
from collections import defaultdict, deque
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

PUBLIC_DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "public", "data")


def load_model():
    with open(os.path.join(PUBLIC_DATA, "org_model.json")) as f:
        return json.load(f)


def get_baselines(model):
    baselines = {}
    for div in model["divisions"].values():
        for kpi in div["kpis"]:
            baselines[kpi["id"]] = kpi["baseline"]
    return baselines


def topological_sort(edges):
    graph = defaultdict(list)
    in_degree = defaultdict(int)
    nodes = set()
    for edge in edges:
        src, dst = edge["from_kpi"], edge["to_kpi"]
        graph[src].append(dst)
        in_degree[dst] += 1
        nodes.add(src)
        nodes.add(dst)
    queue = deque([n for n in nodes if in_degree[n] == 0])
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    return order


def propagate(model, baselines, input_changes):
    """Forward-propagate input changes through the DAG.
    Returns dict of {kpi_id: {change_pct, baseline, projected, lag_months, sigma}}.
    """
    edges = model["interdependencies"]
    graph = defaultdict(list)
    for edge in edges:
        graph[edge["from_kpi"]].append(edge)

    changes = {}
    for ic in input_changes:
        kpi = ic["kpi"]
        if "change_pct" in ic:
            changes[kpi] = ic["change_pct"] / 100.0
        elif "change_absolute" in ic:
            changes[kpi] = ic["change_absolute"] / baselines.get(kpi, 1)

    order = topological_sort(edges)
    results = {}

    for node in order:
        if node in changes:
            baseline = baselines.get(node, 0)
            results[node] = {
                "kpi": node,
                "baseline": baseline,
                "change_pct": round(changes[node] * 100, 2),
                "projected": round(baseline * (1 + changes[node]), 2),
                "lag_months": 0,
                "sigma": 0,
            }
            for edge in graph.get(node, []):
                target = edge["to_kpi"]
                delta = changes[node] * edge["coefficient"]
                changes[target] = changes.get(target, 0) + delta

    # Collect results for non-input KPIs that were affected
    for node in order:
        if node in changes and node not in results:
            baseline = baselines.get(node, 0)
            # Find max lag in the path to this node
            max_lag = max(
                (e["lag_months"] for e in edges if e["to_kpi"] == node), default=0
            )
            max_sigma = max(
                (e.get("sigma", 0) for e in edges if e["to_kpi"] == node), default=0
            )
            results[node] = {
                "kpi": node,
                "baseline": baseline,
                "change_pct": round(changes[node] * 100, 2),
                "projected": round(baseline * (1 + changes[node]), 2),
                "lag_months": max_lag,
                "sigma": max_sigma,
            }

    return results


def build_quarterly_cascade(results):
    """Break cascade into quarterly views based on lag."""
    quarters = {"q1": [], "q2": [], "q4": []}
    for kpi_id, data in results.items():
        lag = data["lag_months"]
        entry = {
            "kpi": kpi_id,
            "change_pct": data["change_pct"],
            "projected": data["projected"],
        }
        if lag <= 3:
            quarters["q1"].append(entry)
        if lag <= 6:
            quarters["q2"].append(entry)
        quarters["q4"].append(entry)  # all effects visible by Q4
    return quarters


def generate_scenarios():
    model = load_model()
    baselines = get_baselines(model)

    scenarios_def = [
        {
            "id": "reduce_marketing_15",
            "label": "Reduce Marketing Spend by 15%",
            "description": "What happens when we cut the marketing budget by 15%?",
            "input_changes": [{"kpi": "marketing_spend", "change_pct": -15}],
        },
        {
            "id": "delay_engineering_hiring",
            "label": "Delay Engineering Hiring by One Quarter",
            "description": "What happens when we freeze engineering hiring for a quarter?",
            "input_changes": [{"kpi": "eng_headcount", "change_pct": -12}],
        },
        {
            "id": "accelerate_collections",
            "label": "Accelerate Collections (DSO -10 days)",
            "description": "What happens when we reduce days sales outstanding by 10 days?",
            "input_changes": [{"kpi": "dso", "change_absolute": -10}],
        },
        {
            "id": "cut_operations_10",
            "label": "Cut Operations Budget by 10%",
            "description": "What happens when we reduce the operations budget by 10%?",
            "input_changes": [{"kpi": "ops_budget", "change_pct": -10}],
        },
    ]

    output_scenarios = []
    for scenario in scenarios_def:
        results = propagate(model, baselines, scenario["input_changes"])
        quarterly = build_quarterly_cascade(results)

        # Build narrative
        affected = [(k, v) for k, v in results.items()
                     if k != scenario["input_changes"][0]["kpi"]]
        positive = [f"{k} ({v['change_pct']:+.1f}%)" for k, v in affected if v["change_pct"] > 0]
        negative = [f"{k} ({v['change_pct']:+.1f}%)" for k, v in affected if v["change_pct"] < 0]

        narrative_parts = []
        if negative:
            narrative_parts.append(f"Negative impacts: {', '.join(negative[:3])}")
        if positive:
            narrative_parts.append(f"Positive impacts: {', '.join(positive[:3])}")
        narrative = ". ".join(narrative_parts) + "."

        output_scenarios.append({
            "id": scenario["id"],
            "label": scenario["label"],
            "description": scenario["description"],
            "input_changes": scenario["input_changes"],
            "cascade": list(results.values()),
            "quarterly": quarterly,
            "narrative": narrative,
        })

    # Add custom template
    output_scenarios.append({
        "id": "custom",
        "label": "Custom Scenario",
        "description": "User-defined scenario — adjust any division's input and watch the cascade.",
        "input_changes": [],
        "cascade": [],
        "quarterly": {"q1": [], "q2": [], "q4": []},
        "narrative": "",
    })

    output = {"scenarios": output_scenarios}
    output_path = os.path.join(PUBLIC_DATA, "scenario_presets.json")
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Scenarios generated: {len(output_scenarios)} scenarios -> {output_path}")
    for s in output_scenarios[:-1]:
        affected = len([c for c in s["cascade"] if c["change_pct"] != 0])
        print(f"  {s['label']}: {affected} KPIs affected")

    return output


if __name__ == "__main__":
    generate_scenarios()
