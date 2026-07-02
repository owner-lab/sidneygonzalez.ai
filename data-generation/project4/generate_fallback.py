"""Generate src/projects/order-book/fallbackData.js from the live capacity engine.

Emits the never-blank seed plus starting TEMPLATES spanning business sizes — a small
fabricator (~$290K book), a services firm (~$1.4M), and the engineered-to-order
manufacturer (~$29M). Every preset carries its own editable order book and a
precomputed result, so preset cards (and the first paint) show numbers BYTE-IDENTICAL
to what the live Pyodide engine computes. Output is committed to git.
"""

import json
import os

import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PUBLIC_DATA = os.path.join(ROOT, "public", "data")
ENGINE = os.path.join(ROOT, "src", "projects", "order-book", "capacity_engine.py")
OUT = os.path.join(ROOT, "src", "projects", "order-book", "fallbackData.js")

with open(ENGINE) as f:
    ENGINE_SRC = f.read()

# Scenario-fixed constants shared by every preset (scale-invariant).
COMMON = {"delay_shock_months": 0, "discount_rate": 0.10, "revenue_realization": 0.85,
          "horizon_months": 18, "anchor_month": "2026-01"}


def proj(pid, name, value, margin, dur, intake, promised, prio):
    return {"id": pid, "name": name, "contract_value": value, "gross_margin_pct": margin,
            "duration_months": dur, "order_intake_date": intake,
            "promised_delivery_date": promised, "priority": prio}


def manufacturer_book():
    """The committed engineered-to-order book (~$29M), loaded from public/data."""
    df = pd.read_csv(os.path.join(PUBLIC_DATA, "eto_order_book.csv"))
    return [{
        "id": r["project_id"], "name": r["project_name"], "customer": r["customer"],
        "market_segment": r["market_segment"], "contract_value": int(r["contract_value"]),
        "gross_margin_pct": float(r["gross_margin_pct"]), "duration_months": int(r["duration_months"]),
        "order_intake_date": str(r["order_intake_date"]),
        "promised_delivery_date": str(r["promised_delivery_date"]),
        "priority": int(r["priority"]), "status": str(r["status"]),
    } for _, r in df.iterrows()]


# A small fabrication / contracting / studio shop — ~$290K book, 1-3 month jobs.
SMALL_SHOP_BOOK = [
    proj("JOB-101", "Custom stair & railing",   88_000, 0.28, 3, "2026-01", "2026-05", 1),
    proj("JOB-102", "Retail fit-out millwork",  72_000, 0.30, 3, "2026-01", "2026-05", 1),
    proj("JOB-103", "Mezzanine platform",       52_000, 0.26, 2, "2026-02", "2026-06", 2),
    proj("JOB-104", "Equipment guarding",       34_000, 0.34, 2, "2026-02", "2026-05", 2),
    proj("JOB-105", "Trailer chassis repair",   26_000, 0.32, 2, "2026-03", "2026-06", 3),
    proj("JOB-106", "Conveyor brackets batch",  18_000, 0.38, 1, "2026-03", "2026-05", 3),
]

# A professional-services / agency firm — ~$1.4M book, higher margins, 2-6 month engagements.
SERVICES_BOOK = [
    proj("ENG-201", "Brand & web rebuild",      320_000, 0.45, 4, "2026-01", "2026-06", 1),
    proj("ENG-202", "ERP rollout advisory",     280_000, 0.40, 5, "2026-01", "2026-07", 1),
    proj("ENG-203", "Data platform build",      240_000, 0.42, 4, "2026-02", "2026-08", 2),
    proj("ENG-204", "Mobile app MVP",           180_000, 0.38, 4, "2026-03", "2026-09", 1),
    proj("ENG-205", "Marketing retainer H1",    160_000, 0.50, 6, "2026-01", "2026-08", 2),
    proj("ENG-206", "Security audit",            95_000, 0.48, 2, "2026-02", "2026-05", 2),
    proj("ENG-207", "Analytics dashboards",      85_000, 0.46, 2, "2026-03", "2026-06", 3),
    proj("ENG-208", "Change-mgmt workshops",     60_000, 0.52, 2, "2026-04", "2026-07", 3),
]

# A clean 3-project canvas for building from scratch.
STARTER_BOOK = [
    proj("NEW-1", "Project A", 120_000, 0.35, 4, "2026-01", "2026-07", 1),
    proj("NEW-2", "Project B",  80_000, 0.35, 3, "2026-02", "2026-06", 2),
    proj("NEW-3", "Project C",  50_000, 0.35, 2, "2026-02", "2026-05", 2),
]


def main():
    MFG = manufacturer_book()

    # Each preset: a starting book + the lever set ROI is computed under. baseline_teams
    # and ramp_cost_per_team scale with the business, so they live in each preset.
    # fixed_cost_base_monthly: monthly fixed overhead (rent, G&A, management salaries).
    # Scaled to each business size so the operating_profit metric is non-trivial from
    # the first load. Starter is 0 — blank canvas, let the user calibrate their own costs.
    # run_stress is always False for fallback generation; stress data is computed live.
    PRESETS = [
        {
            "id": "manufacturer", "label": "Manufacturer",
            "description": "Engineered-to-order shop, ~$29M book. Fund the 4th delivery crew?",
            "backlog": MFG,
            "inputs": {**COMMON, "delivery_teams": 4, "baseline_teams": 3,
                       "order_intake_growth": 0.12, "cost_per_team": 1_000_000,
                       "ramp_cost_per_team": 200_000, "fixed_cost_base_monthly": 150_000,
                       "run_stress": False},
        },
        {
            "id": "services", "label": "Services Firm",
            "description": "Consultancy / agency, ~$1.4M of engagements growing 16%. Add a 3rd delivery pod?",
            "backlog": SERVICES_BOOK,
            "inputs": {**COMMON, "delivery_teams": 3, "baseline_teams": 2,
                       "order_intake_growth": 0.16, "cost_per_team": 155_000,
                       "ramp_cost_per_team": 25_000, "fixed_cost_base_monthly": 25_000,
                       "run_stress": False},
        },
        {
            "id": "small_shop", "label": "Small Shop",
            "description": "A small fabricator, ~$290K book. Does a 2nd person pay yet at this scale?",
            "backlog": SMALL_SHOP_BOOK,
            "inputs": {**COMMON, "delivery_teams": 2, "baseline_teams": 1,
                       "order_intake_growth": 0.12, "cost_per_team": 80_000,
                       "ramp_cost_per_team": 8_000, "fixed_cost_base_monthly": 6_500,
                       "run_stress": False},
        },
        {
            "id": "squeeze", "label": "Cost Squeeze",
            "description": "The manufacturer, but $1.6M crews and a 2-month flagship slip. Still worth it?",
            "backlog": MFG,
            "inputs": {**COMMON, "delivery_teams": 4, "baseline_teams": 3, "delay_shock_months": 2,
                       "order_intake_growth": 0.12, "cost_per_team": 1_600_000,
                       "ramp_cost_per_team": 200_000, "fixed_cost_base_monthly": 150_000,
                       "run_stress": False},
        },
        {
            "id": "starter", "label": "Build Your Own",
            "description": "A blank 3-project canvas — set your own book, crews, and costs, then add a crew to test it.",
            "backlog": STARTER_BOOK,
            # delivery == baseline -> opens neutral (ROI n/a); the user adds a crew to evaluate.
            # fixed_cost_base_monthly = 0 so op_profit panel is hidden until the user sets overhead.
            "inputs": {**COMMON, "delivery_teams": 1, "baseline_teams": 1,
                       "order_intake_growth": 0.12, "cost_per_team": 120_000,
                       "ramp_cost_per_team": 10_000, "fixed_cost_base_monthly": 0,
                       "run_stress": False},
        },
    ]

    def run(inputs, backlog):
        payload = dict(inputs); payload["backlog"] = backlog
        ns = {"eto_inputs_json": json.dumps(payload)}
        exec(ENGINE_SRC, ns)
        return ns["result"]

    presets_out = []
    for p in PRESETS:
        presets_out.append({**p, "result": run(p["inputs"], p["backlog"])})

    default = PRESETS[0]
    default_inputs = default["inputs"]
    fallback_backlog = default["backlog"]
    fallback_result = presets_out[0]["result"]

    with open(OUT, "w") as f:
        f.write("// Auto-generated by data-generation/project4/generate_fallback.py\n")
        f.write("// Do not edit manually — regenerate with: python generate_fallback.py\n")
        f.write("//\n// Seeds the never-blank first paint + offline preset switching. Each preset carries\n")
        f.write("// its own editable order book and a precomputed result identical to capacity_engine.py.\n\n")
        f.write("export const FALLBACK_BACKLOG = ")
        json.dump(fallback_backlog, f, indent=2)
        f.write("\n\n")
        f.write("export const DEFAULT_INPUTS = ")
        json.dump(default_inputs, f, indent=2)
        f.write("\n\n")
        f.write("export const PRESETS = ")
        json.dump(presets_out, f, indent=2)
        f.write("\n\n")
        f.write("export const FALLBACK_RESULT = ")
        json.dump(fallback_result, f, indent=2)
        f.write("\n")

    print(f"fallbackData.js: {os.path.getsize(OUT):,} bytes -> {OUT}")
    for p in presets_out:
        h = p["result"]["headcount_roi"]; s = p["result"]["summary"]
        print(f"  {p['label']:<14} book ${s['backlog_value']:>12,.0f} / {s['backlog_projects']:>2} proj"
              f"  ROI {str(h['roi_pct']):>6}  NPV ${h['npv']:>12,.0f}  payback {h['payback_months']}")


if __name__ == "__main__":
    main()
