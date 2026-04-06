"""Validate org model coefficients: acyclicity, range checks, stress test."""

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
    """Return topological order or raise if cycle detected."""
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

    if len(order) != len(nodes):
        remaining = nodes - set(order)
        raise ValueError(f"Cycle detected! Nodes in cycle: {remaining}")

    return order


def stress_test(model, baselines, shock_pct=0.10):
    """Apply 10% shock to each input KPI, propagate, check bounds."""
    edges = model["interdependencies"]
    graph = defaultdict(list)
    for edge in edges:
        graph[edge["from_kpi"]].append(edge)

    # Find input KPIs (no incoming edges)
    targets = {e["to_kpi"] for e in edges}
    sources = {e["from_kpi"] for e in edges}
    inputs = sources - targets

    results = []
    for input_kpi in sorted(inputs):
        # Propagate shock through DAG
        changes = {input_kpi: shock_pct}
        order = topological_sort(edges)

        for node in order:
            if node not in changes:
                continue
            for edge in graph.get(node, []):
                target = edge["to_kpi"]
                delta = changes[node] * edge["coefficient"]
                changes[target] = changes.get(target, 0) + delta

        # Check bounds
        all_ok = True
        for kpi, change in changes.items():
            baseline = baselines.get(kpi, 0)
            new_val = baseline * (1 + change)
            if new_val < 0 or abs(change) > 0.50:
                all_ok = False
                results.append((input_kpi, kpi, change, "FAIL"))
            else:
                results.append((input_kpi, kpi, change, "OK"))

    return results


def calibrate():
    model = load_model()
    baselines = get_baselines(model)
    edges = model["interdependencies"]
    all_pass = True

    print("=" * 70)
    print("PROJECT 2: COEFFICIENT CALIBRATION")
    print("=" * 70)

    # 1. Range check
    print("\n--- Coefficient Range Check ---")
    for edge in edges:
        coeff = abs(edge["coefficient"])
        ok = 0.05 <= coeff <= 2.0
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {edge['from_kpi']} -> {edge['to_kpi']}: {edge['coefficient']}")
        all_pass &= ok

    # 2. Acyclicity
    print("\n--- Acyclicity Check ---")
    try:
        order = topological_sort(edges)
        print(f"  [PASS] DAG is acyclic. Topological order: {len(order)} nodes")
    except ValueError as e:
        print(f"  [FAIL] {e}")
        all_pass = False

    # 3. Stress test
    print("\n--- Stress Test (10% shock) ---")
    results = stress_test(model, baselines)
    failures = [r for r in results if r[3] == "FAIL"]
    if failures:
        for input_kpi, kpi, change, status in failures:
            print(f"  [FAIL] {input_kpi} +10% -> {kpi}: {change:+.1%}")
        all_pass = False
    else:
        max_change = max(abs(r[2]) for r in results)
        print(f"  [PASS] All cascades within bounds. Max change: {max_change:.1%}")

    # 4. Print coefficient table
    print("\n--- Coefficient Reference Table ---")
    print(f"{'From':<20} {'To':<20} {'Coeff':>7} {'σ':>6} {'Lag':>5} {'Source'}")
    print("-" * 100)
    for edge in edges:
        print(f"{edge['from_kpi']:<20} {edge['to_kpi']:<20} "
              f"{edge['coefficient']:>+7.2f} {edge.get('sigma', 0):>6.2f} "
              f"{edge['lag_months']:>4}m  {edge['source'][:45]}")

    print("\n" + "=" * 70)
    print("RESULT:", "ALL CHECKS PASSED" if all_pass else "SOME CHECKS FAILED")
    print("=" * 70)
    return all_pass


if __name__ == "__main__":
    success = calibrate()
    sys.exit(0 if success else 1)
