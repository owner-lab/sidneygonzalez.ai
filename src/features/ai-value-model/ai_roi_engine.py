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
discount_rate = float(data.get("discount_rate", 0.0))  # 0..1 — hurdle rate / WACC for NPV (0 = nominal)


def annuity_factor(rate, yrs):
    """Present-value factor for $1/yr received at the end of years 1..yrs.
    At rate 0 this is exactly `yrs` (no time value of money), so a 0% discount
    rate reduces every formula below to the plain nominal sum it used to be."""
    if rate <= 0:
        return float(yrs)
    return sum(1.0 / (1.0 + rate) ** t for t in range(1, yrs + 1))


# Annual AI Business Value Income = sum of all 9 benefit lines (Direct + Indirect).
annual_value_income = sum(float(b["annual_value"]) for b in benefits)

# Multi-year value across the nine parameters, present-valued at the discount rate
# (IDC: "n-years sum of direct and indirect indicators across the nine parameters").
# The recurring value and cost streams are discounted; the initial cost is a t=0
# outlay, so it is never discounted. At discount_rate 0 this is the nominal n-year sum.
af = annuity_factor(discount_rate, years)
value_income = annual_value_income * af

# Total cost of ownership over the horizon (recurring cost present-valued).
total_cost = initial_cost + annual_cost * af


# ═══════════════════════════════════════════════════════════════
# STAGE 2: APPLY IDC FORMULA
# ═══════════════════════════════════════════════════════════════
# IDC* ROI = ( AI Business Value Income / (Initial Cost + Annual Costs) ) × Success Probability
#   -> a risk-adjusted value-to-cost multiple. ROI% is expressed as (multiple - 1).
# When a discount rate is set, value and recurring cost are present-valued first,
# so the multiple is NPV-based rather than nominal.

def roi_pct_for(annual_value=annual_value_income, ci=initial_cost,
                ca=annual_cost, p=success_probability, yrs=years, r=discount_rate):
    """Risk-adjusted ROI % for a given set of assumptions (used for sensitivity).
    Returns None when total cost is non-positive — ROI is undefined there, not -100%."""
    factor = annuity_factor(r, yrs)
    income = annual_value * factor
    cost = ci + ca * factor
    if cost <= 0:
        return None
    return ((income / cost) * p - 1.0) * 100.0


# ROI is only defined when there is a positive cost. With zero cost the multiple
# is infinite, so we return null and let the UI show "n/a" rather than a bogus
# -100%. Net value is still meaningful — it's the risk-adjusted net (a true NPV
# once a discount rate is set, since value_income and total_cost are present-valued).
cost_valid = total_cost > 0
raw_multiple = (value_income / total_cost) if cost_valid else None
risk_adjusted_multiple = (raw_multiple * success_probability) if cost_valid else None
roi_pct = ((risk_adjusted_multiple - 1.0) * 100.0) if cost_valid else None
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
break_even_feasible = (
    cost_valid
    and break_even_probability is not None
    and break_even_probability <= 1.0
)

# One-at-a-time sensitivity (tornado): ROI % swing when each driver moves across a
# plausible range, holding everything else at its base. This is what tells a CFO
# where the business case is actually fragile — not the point estimate.
#
# Each driver gets a range appropriate to ITS units, NOT a blanket ±20%. That
# matters for correctness: AI value income and success probability are both linear
# multipliers on the same (value × probability) term, so a uniform relative ±20%
# would make their bars mathematically identical and overstate the number of
# independent risks. Distinct ranges keep each lever honest:
#   • unbounded dollar drivers (value, costs) → ±20% relative
#   • the bounded [0,1] ship-odds              → ±10 percentage points absolute
#   • the integer-year horizon                 → ±1 year (clamped to the slider's 1–7)
VALUE_COST_SWING = 0.20   # relative, for the unbounded dollar drivers
PROB_SWING = 0.10         # absolute percentage points, for the bounded ship-odds
YEAR_STEP = 1             # integer years
YEAR_MIN, YEAR_MAX = 1, 7  # matches the Time horizon slider range
sensitivity = []


def add_factor(name, low_roi, high_roi):
    if low_roi is None or high_roi is None:
        return
    lo, hi = sorted([low_roi, high_roi])
    sensitivity.append({
        "factor": name,
        "low": round(lo, 1),
        "high": round(hi, 1),
        "swing": round(hi - lo, 1),
    })


add_factor(
    "AI value income",
    roi_pct_for(annual_value=annual_value_income * (1 - VALUE_COST_SWING)),
    roi_pct_for(annual_value=annual_value_income * (1 + VALUE_COST_SWING)),
)
add_factor(
    "Success probability",
    roi_pct_for(p=max(0.0, success_probability - PROB_SWING)),
    roi_pct_for(p=min(1.0, success_probability + PROB_SWING)),
)
add_factor(
    "Time horizon",
    roi_pct_for(yrs=max(YEAR_MIN, years - YEAR_STEP)),
    roi_pct_for(yrs=min(YEAR_MAX, years + YEAR_STEP)),
)
add_factor(
    "Annual cost",
    roi_pct_for(ca=annual_cost * (1 - VALUE_COST_SWING)),
    roi_pct_for(ca=annual_cost * (1 + VALUE_COST_SWING)),
)
add_factor(
    "Initial cost",
    roi_pct_for(ci=initial_cost * (1 - VALUE_COST_SWING)),
    roi_pct_for(ci=initial_cost * (1 + VALUE_COST_SWING)),
)

sensitivity.sort(key=lambda f: abs(f["swing"]), reverse=True)

result = {
    "annual_value_income": round(annual_value_income, 2),
    "value_income": round(value_income, 2),
    "total_cost": round(total_cost, 2),
    "initial_cost": round(initial_cost, 2),
    "annual_cost": round(annual_cost, 2),
    "years": years,
    "discount_rate": round(discount_rate, 4),
    "success_probability": round(success_probability, 4),
    "cost_valid": cost_valid,
    "raw_multiple": round(raw_multiple, 3) if raw_multiple is not None else None,
    "risk_adjusted_multiple": round(risk_adjusted_multiple, 3) if risk_adjusted_multiple is not None else None,
    "roi_pct": round(roi_pct, 1) if roi_pct is not None else None,
    "net_value": round(net_value, 2),
    "break_even_probability": round(break_even_probability, 4) if break_even_probability is not None else None,
    "break_even_feasible": break_even_feasible,
    "payback_years": payback_years,
    "per_benefit": per_benefit,
    "sensitivity": sensitivity,
}
