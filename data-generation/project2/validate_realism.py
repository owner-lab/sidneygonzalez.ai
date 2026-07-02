"""Validate the Decision Impact org model AND the scenario engine output.

Project 2 previously had NO data-integrity gate (project1/3/4 each do). This asserts the
invariants behind the numbers a CFO actually reads:
  1. BOUNDS — no projected KPI leaves its unit domain (CSAT in [1,5], percents in [0,100],
     counts >= 0) even at the slider extremes (+/-50%).
  2. NARRATIVE FIDELITY — each preset's prose is regenerated from its own cascade and must
     match the committed text, so a story can never drift from the table beside it.
  3. DISCRIMINATION — the four presets produce distinct cascades (no degenerate output).
  4. DIRECTION — each scenario's primary KPI moves the way the story claims.

Exit 0 on all-pass, 1 otherwise (so run_all.py can halt the pipeline).
"""

import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from generate_scenarios import (  # noqa: E402
    load_model,
    get_baselines,
    propagate,
    build_narrative,
    UNIT_BOUNDS,
)

PUBLIC_DATA = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "public", "data"
)

# (scenario id, input changes) — must mirror generate_scenarios.scenarios_def.
SCENARIOS = [
    ("reduce_marketing_15", [{"kpi": "marketing_spend", "change_pct": -15}]),
    ("delay_engineering_hiring", [{"kpi": "eng_headcount", "change_pct": -12}]),
    ("accelerate_collections", [{"kpi": "dso", "change_absolute": -10}]),
    ("cut_operations_10", [{"kpi": "ops_budget", "change_pct": -10}]),
]


def check(name, passed, detail=""):
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))
    return passed


def validate():
    print("=" * 60)
    print("PROJECT 2 VALIDATION — Decision Impact Analyzer")
    print("=" * 60)
    ok = True

    model = load_model()
    baselines = get_baselines(model)
    units = {}
    for div in model["divisions"].values():
        for kpi in div["kpis"]:
            units[kpi["id"]] = kpi.get("unit")

    # ---- 1. Output bounds at the slider extremes (+/-50% on every adjustable input) ----
    print("\n--- Output bounds (unit domains hold at +/-50% on any input) ---")
    violations = []
    for kpi in baselines:  # any KPI can be a custom-scenario input
        for pct in (-50, 50):
            res = propagate(model, baselines, [{"kpi": kpi, "change_pct": pct}])
            for node, r in res.items():
                b = UNIT_BOUNDS.get(units.get(node))
                if not b:
                    continue
                lo, hi = b
                v = r["projected"]
                if (lo is not None and v < lo - 1e-9) or (hi is not None and v > hi + 1e-9):
                    violations.append(f"{kpi}{pct:+d}% -> {node}={v} ({units.get(node)})")
    ok &= check("No projected KPI leaves its unit domain at +/-50% on any input",
                len(violations) == 0,
                f"{len(violations)} violations" + (f": {violations[0]}" if violations else ""))

    big = propagate(model, baselines, [{"kpi": "ops_budget", "change_pct": 50}])
    csat = big.get("csat", {}).get("projected")
    churn = big.get("churn_rate", {}).get("projected")
    ok &= check("CSAT stays <= 5.0 and churn stays >= 0 under a +50% ops shock",
                (csat is None or csat <= 5.0) and (churn is None or churn >= 0),
                f"csat={csat}, churn={churn}")

    # ---- 2. Narrative fidelity: committed prose == freshly regenerated prose ----
    print("\n--- Narrative fidelity (prose regenerated from cascade matches committed) ---")
    with open(os.path.join(PUBLIC_DATA, "scenario_presets.json")) as f:
        committed = {s["id"]: s for s in json.load(f)["scenarios"]}
    for sid, ics in SCENARIOS:
        res = propagate(model, baselines, ics)
        fresh = build_narrative(sid, res, baselines, ics)
        match = committed.get(sid, {}).get("narrative") == fresh
        ok &= check(f"narrative in sync with cascade: {sid}", match,
                    "" if match else "committed prose != regenerated (coefficient/template drift — rerun generate_scenarios.py)")

    # ---- 3 & 4. Discrimination + direction ----
    print("\n--- Discrimination & direction ---")
    cascades = {sid: propagate(model, baselines, ics) for sid, ics in SCENARIOS}
    pipes = {sid: c.get("pipeline_value", {}).get("projected") for sid, c in cascades.items()}
    distinct = len({v for v in pipes.values() if v is not None})
    ok &= check("Presets produce distinct cascades (no degenerate pinned output)",
                distinct >= 3, f"{distinct} distinct pipeline projections across presets")

    dirs = [
        ("reduce_marketing_15", "mqls_per_month", -1),       # less marketing -> fewer leads
        ("delay_engineering_hiring", "feature_velocity", -1),  # fewer engineers -> slower delivery
        ("accelerate_collections", "free_cash_flow", +1),    # lower DSO -> more free cash flow
        ("cut_operations_10", "churn_rate", +1),             # ops cut -> higher churn
    ]
    for sid, kpi, sign in dirs:
        chg = cascades[sid].get(kpi, {}).get("change_pct", 0)
        ok &= check(f"direction: {sid} moves {kpi} {'down' if sign < 0 else 'up'}",
                    (chg < 0) if sign < 0 else (chg > 0), f"{kpi} {chg:+.2f}%")

    print("\n" + "=" * 60)
    print("RESULT:", "ALL CHECKS PASSED" if ok else "SOME CHECKS FAILED")
    print("=" * 60)
    return ok


if __name__ == "__main__":
    sys.exit(0 if validate() else 1)
