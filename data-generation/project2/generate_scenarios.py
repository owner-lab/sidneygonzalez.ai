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
    Cumulative lags track how long the full cascade takes to reach each KPI.
    """
    edges = model["interdependencies"]
    graph = defaultdict(list)
    for edge in edges:
        graph[edge["from_kpi"]].append(edge)

    input_kpis = set()
    changes = {}
    cumulative_lags = {}
    max_sigmas = {}

    for ic in input_changes:
        kpi = ic["kpi"]
        input_kpis.add(kpi)
        cumulative_lags[kpi] = 0
        max_sigmas[kpi] = 0
        if "change_pct" in ic:
            changes[kpi] = ic["change_pct"] / 100.0
        elif "change_absolute" in ic:
            changes[kpi] = ic["change_absolute"] / baselines.get(kpi, 1)

    order = topological_sort(edges)

    # Forward-propagate changes AND cumulative lags through the DAG
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

    # Build results
    results = {}
    for node in order:
        if node not in changes:
            continue
        baseline = baselines.get(node, 0)
        results[node] = {
            "kpi": node,
            "baseline": baseline,
            "change_pct": round(changes[node] * 100, 2),
            "projected": round(baseline * (1 + changes[node]), 2),
            "lag_months": cumulative_lags.get(node, 0),
            "sigma": max_sigmas.get(node, 0),
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

    # Pre-written executive narratives per scenario (natural language, not debug output)
    NARRATIVES = {
        "reduce_marketing_15": (
            "Cutting marketing spend by 15% reduces qualified lead flow by approximately 10% "
            "within one quarter, contracting the sales pipeline by an estimated $4.4M. "
            "While this saves $1.3M in direct marketing costs, the downstream revenue impact "
            "is projected to exceed the savings within two quarters. Brand awareness erodes "
            "gradually over 3+ months, compounding the pipeline effect."
        ),
        "delay_engineering_hiring": (
            "Freezing engineering hiring for one quarter slows feature delivery by roughly 30% "
            "during the freeze period. Product NPS begins to decline within two quarters as "
            "the roadmap falls behind competitors. The win rate impact is modest (~3-4%) but "
            "compounds over time. The cost savings from delayed salaries are partially offset "
            "by reduced product competitiveness."
        ),
        "accelerate_collections": (
            "Reducing DSO by 10 days frees approximately $5.5M in working capital, improving "
            "free cash flow and reducing credit line reliance. The freed capital enables "
            "incremental reinvestment in engineering and marketing. This is one of the few "
            "decisions with predominantly positive cascading effects — the tradeoff is "
            "customer relationship friction from more aggressive collection terms."
        ),
        "cut_operations_10": (
            "A 10% operations budget cut degrades fulfillment capacity, pushing the fulfillment "
            "rate below 90% within one quarter. Customer satisfaction drops measurably, driving "
            "churn up by an estimated 0.7 percentage points. The LTV impact from increased "
            "churn exceeds the budget savings within 12 months. Operations cuts have the longest "
            "and most damaging cascade of any scenario modeled."
        ),
    }

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

        narrative = NARRATIVES.get(scenario["id"], "")

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
