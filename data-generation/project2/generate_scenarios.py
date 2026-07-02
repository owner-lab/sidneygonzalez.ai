"""Generate scenario presets by propagating shocks through the org model DAG."""

import sys
import os
import json
from collections import defaultdict, deque
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

PUBLIC_DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "public", "data")

# Hard domains per KPI unit — kept identical to the live engine (scenario_engine.py) so the
# committed presets match what Pyodide computes. A score can't exceed 5, a percent stays in
# [0,100], a count/days can't go negative; dollar amounts are intentionally unbounded.
UNIT_BOUNDS = {
    "score_1_5": (1.0, 5.0),
    "percent": (0.0, 100.0),
    "index_0_100": (0.0, 100.0),
    "score": (-100.0, 100.0),
    "count": (0.0, None),
    "days": (0.0, None),
}
REVENUE_BASIS_M = 200.0  # $M annual revenue — the documented basis for DSO -> working capital


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

    units = {}
    for div in model["divisions"].values():
        for kpi in div["kpis"]:
            units[kpi["id"]] = kpi.get("unit")

    # Build results
    results = {}
    for node in order:
        if node not in changes:
            continue
        baseline = baselines.get(node, 0)
        projected = clamp_to_unit(round(baseline * (1 + changes[node]), 2), units.get(node))
        results[node] = {
            "kpi": node,
            "baseline": baseline,
            "change_pct": round(changes[node] * 100, 2),
            "projected": projected,
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


def build_narrative(scenario_id, results, baselines, input_changes):
    """Compose the executive narrative from the ACTUAL propagated cascade, so the prose can
    never contradict the table beside it — every figure below is read from `results`, not
    written by hand. (validate_realism.py re-derives these and asserts they still match.)"""
    def chg(kpi):
        r = results.get(kpi)
        return r["change_pct"] if r else 0.0

    if scenario_id == "reduce_marketing_15":
        mql = chg("mqls_per_month")
        pipe = results["pipeline_value"]
        pipe_delta = pipe["projected"] - baselines["pipeline_value"]
        save = 0.15 * baselines["marketing_spend"]
        return (
            f"Cutting marketing spend 15% reduces qualified lead flow about {abs(mql):.0f}% within a "
            f"quarter, contracting the sales pipeline by roughly ${abs(pipe_delta):.1f}M "
            f"({pipe['change_pct']:+.1f}%). That saves ${save:.1f}M in direct marketing cost, but on this "
            f"model the pipeline contraction outweighs the saving within two quarters. Brand awareness "
            f"erodes about {abs(chg('brand_awareness')):.0f}% over 3+ months; the leaner pipeline even "
            f"nudges win rate {chg('win_rate'):+.1f}% as fewer early-stage deals dilute it — a small "
            f"second-order effect."
        )

    if scenario_id == "delay_engineering_hiring":
        return (
            f"Freezing engineering hiring for a quarter (~12% fewer engineers) slows feature delivery "
            f"about {abs(chg('feature_velocity')):.1f}% — sub-linear, per Brooks's Law. Product NPS slips "
            f"about {abs(chg('product_nps')):.1f}% over two quarters and win rate eases "
            f"{chg('win_rate'):+.1f}% as the roadmap falls behind. The salary savings are real but partly "
            f"offset by reduced product competitiveness."
        )

    if scenario_id == "accelerate_collections":
        fcf = results["free_cash_flow"]
        fcf_delta = fcf["projected"] - baselines["free_cash_flow"]
        dso_days = abs(input_changes[0]["change_absolute"])
        wc = dso_days * REVENUE_BASIS_M / 365.0
        return (
            f"Reducing DSO by {dso_days:.0f} days releases roughly ${wc:.1f}M of working capital "
            f"(~${REVENUE_BASIS_M / 365.0:.2f}M per DSO day on ~${REVENUE_BASIS_M:.0f}M revenue). Modeled "
            f"conservatively, about ${abs(fcf_delta):.1f}M of that lands in free cash flow within the "
            f"period ({fcf['change_pct']:+.1f}%), funding incremental engineering and marketing "
            f"reinvestment. One of the few moves with mostly positive cascades; the trade-off is tighter "
            f"collection terms with customers."
        )

    if scenario_id == "cut_operations_10":
        ful = results["fulfillment_rate"]
        churn = results["churn_rate"]
        churn_delta = churn["projected"] - baselines["churn_rate"]
        return (
            f"A 10% operations budget cut pushes the fulfillment rate to about {ful['projected']:.1f}% "
            f"({ful['change_pct']:+.1f}%), under the 90% service line. Customer satisfaction slips about "
            f"{abs(chg('csat')):.1f}%, and with a two-month lag monthly churn rises roughly "
            f"{churn_delta:+.2f} percentage points ({churn['change_pct']:+.1f}%). The LTV drag compounds "
            f"over ~12 months — operations cuts carry the longest, most damaging cascade modeled here."
        )

    return ""


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

        narrative = build_narrative(scenario["id"], results, baselines, scenario["input_changes"])

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
