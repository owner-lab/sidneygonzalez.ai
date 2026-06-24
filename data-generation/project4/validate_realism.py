"""Validate the ETO order book AND the capacity engine output.

Two gates:
  1. DATA realism — the committed order book must read like a real engineered-to-order
     shop (thin margins, right-skewed values, sane durations/dates), not synthetic filler.
  2. ENGINE integrity — running capacity_engine.py on that book must satisfy the
     no-impossible-values invariants (monotonic burn-down, non-negative gap, the
     added_teams==0 ROI guard) so the 100.06%-uptime class of defect cannot ship.

Exit 0 on all-pass, 1 otherwise (so run_all.py can halt the pipeline).
"""

import json
import os
import sys

import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PUBLIC_DATA = os.path.join(ROOT, "public", "data")
ENGINE = os.path.join(ROOT, "src", "projects", "order-book", "capacity_engine.py")

DEFAULT_INPUTS = {
    "delivery_teams": 4, "baseline_teams": 3, "order_intake_growth": 0.12,
    "cost_per_team": 1_000_000, "ramp_cost_per_team": 200_000, "delay_shock_months": 0,
    "discount_rate": 0.10, "revenue_realization": 0.85, "horizon_months": 18,
    "anchor_month": "2026-01",
}


def check(name, passed, detail=""):
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))
    return passed


def _backlog_from_df(df):
    return [{
        "id": r["project_id"], "name": r["project_name"],
        "contract_value": float(r["contract_value"]),
        "gross_margin_pct": float(r["gross_margin_pct"]),
        "duration_months": int(r["duration_months"]),
        "order_intake_date": str(r["order_intake_date"]),
        "promised_delivery_date": str(r["promised_delivery_date"]),
        "priority": int(r["priority"]),
    } for _, r in df.iterrows()]


def _run_engine(inputs, backlog):
    payload = dict(inputs)
    payload["backlog"] = backlog
    with open(ENGINE) as f:
        src = f.read()
    ns = {"eto_inputs_json": json.dumps(payload)}
    exec(src, ns)
    return ns["result"]


def validate():
    print("=" * 60)
    print("PROJECT 4 VALIDATION — Order Book Forecaster")
    print("=" * 60)
    ok = True

    df = pd.read_csv(os.path.join(PUBLIC_DATA, "eto_order_book.csv"))

    print("\n--- Order book realism ---")
    ok &= check("Project count 8-20", 8 <= len(df) <= 20, f"{len(df)} projects")

    margins = df["gross_margin_pct"]
    ok &= check("ETO margins thin (0.12-0.35)",
                margins.between(0.12, 0.35).all(),
                f"range {margins.min():.2f}-{margins.max():.2f}")

    values = df["contract_value"]
    skew = values.max() / values.median()
    ok &= check("Value distribution right-skewed (max/median > 2.0)",
                skew > 2.0, f"{skew:.1f}x (not a flat/uniform spread)")

    ok &= check("No non-positive contract values",
                (values > 0).all(), f"min ${values.min():,.0f}")

    durations = df["duration_months"]
    ok &= check("Durations sane (3-18 whole months)",
                durations.between(3, 18).all() and (durations == durations.astype(int)).all(),
                f"range {durations.min()}-{durations.max()}")

    ok &= check("Priority in [1,5]", df["priority"].between(1, 5).all(),
                f"range {df['priority'].min()}-{df['priority'].max()}")

    intake = pd.to_datetime(df["order_intake_date"] + "-01")
    promised = pd.to_datetime(df["promised_delivery_date"] + "-01")
    ok &= check("Promised delivery >= order intake",
                (promised >= intake).all(),
                f"{(promised < intake).sum()} violations")

    total_slot_months = int(durations.sum())
    ok &= check("Book is capacity-meaningful (3-4 crews x18mo can mostly work it)",
                40 <= total_slot_months <= 90,
                f"{total_slot_months} slot-months (3x18=54, 4x18=72 cap)")

    print("\n--- Engine integrity (no-impossible-values invariants) ---")
    backlog = _backlog_from_df(df)
    res = _run_engine(DEFAULT_INPUTS, backlog)
    tl = res["timeline"]
    gap = res["capacity_gap"]
    h = res["headcount_roi"]
    s = res["summary"]

    bvs = [row["backlog_value"] for row in tl]
    ok &= check("Backlog value monotonically non-increasing (burns down, never rises)",
                all(bvs[i] >= bvs[i + 1] - 0.01 for i in range(len(bvs) - 1)))
    ok &= check("Capacity gap never negative", all(g["gap"] >= 0 for g in gap))
    ok &= check("Realized & at-risk never negative",
                all(r["realized"] >= 0 and r["at_risk"] >= 0 for r in tl))
    ok &= check("Active crews never exceed capacity",
                all(r["active_slots"] <= r["capacity_slots"] for r in tl))
    ok &= check("Timeline length == horizon", len(tl) == DEFAULT_INPUTS["horizon_months"],
                f"{len(tl)} rows")
    ok &= check("Months use YYYY-MM labels",
                all(len(r["month"]) == 7 and r["month"][4] == "-" for r in tl),
                f"e.g. {tl[0]['month']}")

    # per-project recognised margin must equal value*margin (within horizon) and never exceed it
    recognized_total = s["realized_total"] + s["at_risk_total"]
    book_margin = sum(p["contract_value"] * p["gross_margin_pct"] for p in backlog)
    ok &= check("Recognised margin <= total book margin (no margin invented)",
                recognized_total <= book_margin + 1.0,
                f"recognised ${recognized_total:,.0f} of ${book_margin:,.0f} book margin")

    # the added_teams==0 ROI guard (the confirmed payback=1 bug class)
    res0 = _run_engine({**DEFAULT_INPUTS, "delivery_teams": 3, "baseline_teams": 3}, backlog)
    h0 = res0["headcount_roi"]
    ok &= check("added_teams==0 -> ROI None AND payback None (no bogus 1-month payback)",
                h0["roi_pct"] is None and h0["payback_months"] is None,
                f"roi={h0['roi_pct']} payback={h0['payback_months']}")

    ok &= check("Default 4-vs-3 crew ROI is defined and positive",
                h["roi_pct"] is not None and h["roi_pct"] > 0,
                f"ROI={h['roi_pct']}% NPV=${h['npv']:,.0f} payback={h['payback_months']}mo")
    ok &= check("Default backlog clears > 90% in horizon (honest burn-down)",
                s["backlog_cleared_pct"] > 90, f"{s['backlog_cleared_pct']}% cleared")
    ok &= check("Capacity-gap panel is non-trivial (book is short some months)",
                s["months_capacity_short"] > 0, f"{s['months_capacity_short']} short months")

    print("\n" + "=" * 60)
    print("RESULT:", "ALL CHECKS PASSED" if ok else "SOME CHECKS FAILED")
    print("=" * 60)
    return ok


if __name__ == "__main__":
    sys.exit(0 if validate() else 1)
