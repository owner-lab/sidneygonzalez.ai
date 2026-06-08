"""
AI Business Value Model — Risk-Adjusted ROI Engine
Implements IDC FutureScape 2026's redefined AI ROI framework.

Runs live in your browser via Pyodide. This is a SENSITIVITY model:
every output is driven by the assumptions you enter — it is not a forecast.
"""

import json

# ═══════════════════════════════════════════════════════════════
# STAGE 1: PARSE INPUTS
# ═══════════════════════════════════════════════════════════════

# inputs_json is injected from JS via Pyodide globals (see usePyodide).
data = json.loads(inputs_json)

benefits = data["benefits"]                       # [{id, name, annual_value}] x9
direct_ratio = float(data["direct_ratio"])        # 0..1 — share counted as "Direct"
initial_cost = float(data["initial_cost"])        # one-time $ (build + integration + change mgmt)
annual_cost = float(data["annual_cost"])          # recurring $/yr (licenses, inference, MLOps)
success_probability = float(data["success_probability"])  # 0..1 — odds value is realized
years = int(data["years"])                        # time horizon

# Annual AI Business Value Income = sum of all 9 benefit lines (Direct + Indirect).
annual_value_income = sum(float(b["annual_value"]) for b in benefits)

# Multi-year sum across the nine parameters
# (IDC: "n-years sum of direct and indirect indicators across the nine parameters").
value_income = annual_value_income * years

# Total cost of ownership over the horizon.
total_cost = initial_cost + annual_cost * years


# ═══════════════════════════════════════════════════════════════
# STAGE 2: APPLY IDC FORMULA
# ═══════════════════════════════════════════════════════════════
# IDC* ROI = ( AI Business Value Income / (Initial Cost + Annual Costs) ) × Success Probability
#   -> a risk-adjusted value-to-cost multiple. ROI% is expressed as (multiple - 1).

def roi_pct_for(annual_value=annual_value_income, ci=initial_cost,
                ca=annual_cost, p=success_probability, yrs=years):
    """Risk-adjusted ROI % for a given set of assumptions (used for sensitivity)."""
    income = annual_value * yrs
    cost = ci + ca * yrs
    if cost <= 0:
        return 0.0
    return ((income / cost) * p - 1.0) * 100.0


raw_multiple = (value_income / total_cost) if total_cost > 0 else 0.0
risk_adjusted_multiple = raw_multiple * success_probability
roi_pct = (risk_adjusted_multiple - 1.0) * 100.0
net_value = value_income * success_probability - total_cost

# Per-benefit contribution: Direct / Indirect split + share of value income.
per_benefit = []
for b in benefits:
    v = float(b["annual_value"])
    share = (v / annual_value_income * 100.0) if annual_value_income > 0 else 0.0
    per_benefit.append({
        "id": b["id"],
        "name": b["name"],
        "annual_value": round(v, 2),
        "direct": round(v * direct_ratio, 2),
        "indirect": round(v * (1.0 - direct_ratio), 2),
        "share_pct": round(share, 1),
    })
per_benefit.sort(key=lambda x: x["annual_value"], reverse=True)

# Simple payback period (years) on risk-adjusted annual net cash flow.
annual_net = annual_value_income * success_probability - annual_cost
payback_years = round(initial_cost / annual_net, 2) if annual_net > 0 else None


# ═══════════════════════════════════════════════════════════════
# STAGE 3: BREAK-EVEN & SENSITIVITY
# ═══════════════════════════════════════════════════════════════
# Break-even ship probability: the success probability at which
# risk-adjusted value exactly covers cost.
#   value_income × P* = total_cost   ->   P* = total_cost / value_income
break_even_probability = (total_cost / value_income) if value_income > 0 else None
break_even_feasible = break_even_probability is not None and break_even_probability <= 1.0

# One-at-a-time sensitivity (tornado): swing in ROI % when each driver moves ±20%,
# holding everything else at its base value. This is what tells a CFO where the
# business case is actually fragile — not the point estimate.
SWING = 0.20
sensitivity = []


def add_factor(name, low_roi, high_roi):
    lo, hi = sorted([low_roi, high_roi])
    sensitivity.append({
        "factor": name,
        "low": round(lo, 1),
        "high": round(hi, 1),
        "swing": round(hi - lo, 1),
    })


add_factor(
    "AI value income",
    roi_pct_for(annual_value=annual_value_income * (1 - SWING)),
    roi_pct_for(annual_value=annual_value_income * (1 + SWING)),
)
add_factor(
    "Success probability",
    roi_pct_for(p=max(0.0, success_probability * (1 - SWING))),
    roi_pct_for(p=min(1.0, success_probability * (1 + SWING))),
)
add_factor(
    "Time horizon",
    roi_pct_for(yrs=max(1, round(years * (1 - SWING)))),
    roi_pct_for(yrs=max(1, round(years * (1 + SWING)))),
)
add_factor(
    "Annual cost",
    roi_pct_for(ca=annual_cost * (1 - SWING)),
    roi_pct_for(ca=annual_cost * (1 + SWING)),
)
add_factor(
    "Initial cost",
    roi_pct_for(ci=initial_cost * (1 - SWING)),
    roi_pct_for(ci=initial_cost * (1 + SWING)),
)

sensitivity.sort(key=lambda f: abs(f["swing"]), reverse=True)

result = {
    "annual_value_income": round(annual_value_income, 2),
    "value_income": round(value_income, 2),
    "total_cost": round(total_cost, 2),
    "initial_cost": round(initial_cost, 2),
    "annual_cost": round(annual_cost, 2),
    "years": years,
    "success_probability": round(success_probability, 4),
    "raw_multiple": round(raw_multiple, 3),
    "risk_adjusted_multiple": round(risk_adjusted_multiple, 3),
    "roi_pct": round(roi_pct, 1),
    "net_value": round(net_value, 2),
    "break_even_probability": round(break_even_probability, 4) if break_even_probability is not None else None,
    "break_even_feasible": break_even_feasible,
    "payback_years": payback_years,
    "per_benefit": per_benefit,
    "sensitivity": sensitivity,
}
