"""
Order Book Forecaster — Capacity-Slot Queue Engine (Project 4)

Turns an engineered-to-order (ETO) backlog into a forward 12-18 month
realized-vs-at-risk revenue timeline, and prices the next delivery crew in
risk-adjusted ROI / NPV / payback terms — the same financial vocabulary as
the AI Value Model.

Runs live in your browser via Pyodide. Pure standard library (json + heapq):
deterministic, no external packages, runs the instant the runtime is ready.

This is a SENSITIVITY model — every output is driven by the levers you set, not
a forecast. The honest non-linearity it captures: projects queue for a finite
number of delivery crews (slots). A slipped project pushes everything behind it
in its slot to the right — you cannot start the next until the previous frees
the crew. A linear coefficient model cannot express that.

Research grounding: Kangasluoma (2016) measured order backlog's correlation
to future revenue at r=0.942 and to operating profit at r=0.902 across 18 ETO
manufacturers over a 10-year period (p<.000). The fixed-cost rigidity layer and
stress scenario in this engine express the mechanism behind those correlations
live on your own backlog.
"""

import json
import heapq

# ═══════════════════════════════════════════════════════════════
# STAGE 1: BUILD BACKLOG   (parse levers, normalise dates, clamp)
# ═══════════════════════════════════════════════════════════════

# eto_inputs_json is injected from JS via Pyodide globals (see usePyodide.js).
data = json.loads(eto_inputs_json)

delivery_teams = int(data["delivery_teams"])              # PEOPLE lever = parallel crews (slots)
baseline_teams = int(data["baseline_teams"])              # status-quo crews ROI is measured vs
order_intake_growth = float(data["order_intake_growth"])  # annual; the CFO's "period of growth"
cost_per_team = float(data["cost_per_team"])              # $/yr fully loaded per crew
ramp_cost_per_team = float(data.get("ramp_cost_per_team", 0.0))  # one-time t=0 hire/ramp per crew
delay_shock_months = int(data["delay_shock_months"])      # months added to the flagship project
discount_rate = float(data["discount_rate"])              # annual hurdle / WACC for NPV
revenue_realization = float(data["revenue_realization"])  # 0..1 haircut on UNCERTAIN margin
horizon_months = int(data["horizon_months"])              # 12..18
anchor_month = data.get("anchor_month", "2026-01")        # 'YYYY-MM' label of month index 0

# Fixed overhead that burns every month regardless of project activity.
# When crews are underutilised (projects slip or the book thins), gross margin
# falls but fixed costs hold — operating profit declines faster than revenue.
# This is the mechanism behind Kangasluoma (2016): −20.86% backlog → −13.33%
# revenue → −35.4% operating profit across 18 Finnish ETO manufacturers.
fixed_cost_base_monthly = float(data.get("fixed_cost_base_monthly", 0.0))

# When True, compute a second engine run at Kangasluoma stress parameters and
# return the comparison alongside the base results.
run_stress = bool(data.get("run_stress", False))

# Empirical stress-shock magnitudes — the measured 2008→09 figures (Kangasluoma 2016,
# 18 Finnish ETO firms), applied directly to this book so the "your book" column is a
# like-for-like response to the same shock the benchmark column reports.
STRESS_BACKLOG_DELTA_PCT = -20.86   # aggregate order-backlog contraction
STRESS_FLAGSHIP_DELAY_ADD = 3       # extra months piled onto the flagship project

# monthly discount rate from the annual hurdle (geometric, NOT annual/12)
r_m = (1.0 + discount_rate) ** (1.0 / 12.0) - 1.0 if discount_rate > 0 else 0.0


def _anchor_idx():
    ay, am = anchor_month.split("-")
    return int(ay) * 12 + (int(am) - 1)


def to_idx(ym):
    """'YYYY-MM' -> integer month offset from the anchor month."""
    y, m = ym.split("-")
    return (int(y) * 12 + (int(m) - 1)) - _anchor_idx()


def to_month(idx):
    """integer month offset from the anchor -> 'YYYY-MM'."""
    total = _anchor_idx() + int(idx)
    return "%04d-%02d" % (total // 12, total % 12 + 1)


# Normalise the committed order book into clamped, index-based projects.
# Clamps guard against impossible values reaching the schedule (a 0-duration
# project, a negative contract, a promised date before intake, a >100% margin).
backlog = []
for row in data["backlog"]:
    value = max(0.0, float(row["contract_value"]))
    margin = min(1.0, max(0.0, float(row["gross_margin_pct"])))
    dur = max(1, int(row["duration_months"]))
    intake = max(0, to_idx(row["order_intake_date"]))
    promised = max(intake, to_idx(row["promised_delivery_date"]))  # never before intake
    backlog.append({
        "id": row["id"],
        "name": row.get("name", row["id"]),
        "value": value,
        "margin": margin,
        "dur": dur,
        "intake": intake,
        "promised": promised,
        "priority": int(row.get("priority", 3)),
    })

# A delay shock lands on the single highest-value project (the flagship).
flagship_id = max(backlog, key=lambda p: p["value"])["id"] if backlog else None


def annuity_factor(rate, periods):
    """PV of $1 received at the end of periods 1..N. At rate<=0 this is exactly N
    (no time value of money), so a 0% discount rate gives the plain nominal sum."""
    if rate <= 0:
        return float(periods)
    return sum(1.0 / (1.0 + rate) ** t for t in range(1, periods + 1))


def blended_margin_per_slot_month(book):
    """Average $ of margin one crew earns per month across the book =
    sum(value*margin) / sum(durations). The rate a freed slot-month converts to profit."""
    total_margin = sum(p["value"] * p["margin"] for p in book)
    total_slot_months = sum(p["dur"] for p in book)
    return (total_margin / total_slot_months) if total_slot_months > 0 else 0.0


# ═══════════════════════════════════════════════════════════════
# STAGE 2: SCHEDULE SLOTS   (the non-linearity — a slip cascades right)
# ═══════════════════════════════════════════════════════════════

def schedule(book, teams, delay):
    """Greedy priority insertion into `teams` earliest-free crews (a min-heap of
    slot free-months). A project starts when its crew frees AND its order is in
    hand, so a slipped project pushes everything queued behind it in that slot."""
    teams = max(1, int(teams))
    ordered = sorted(book, key=lambda p: (p["priority"], p["promised"], -p["value"]))
    slots = [(0, s) for s in range(teams)]   # (free_month, slot_id) — all free at month 0
    heapq.heapify(slots)
    placed = []
    for p in ordered:
        free_month, slot_id = heapq.heappop(slots)
        start = max(free_month, p["intake"])                 # crew free AND order in hand
        eff_dur = p["dur"] + (delay if p["id"] == flagship_id else 0)
        finish = start + eff_dur                             # active months: start .. finish-1
        heapq.heappush(slots, (finish, slot_id))             # cascade: next in slot waits
        placed.append({**p, "start": start, "finish": finish, "eff_dur": eff_dur})
    return placed


# ═══════════════════════════════════════════════════════════════
# STAGE 3: FORWARD REVENUE & CREW ROI   (recognise, then price the crew)
# ═══════════════════════════════════════════════════════════════

def recognize(placed, teams, horizon):
    """Straight-line (percent-of-completion) margin per active month, split into
    on-time (realized) vs past-promised (at-risk), plus a monotonic backlog burn-down.
    Also tracks recognized_revenue (full contract value, not margin) for coverage math."""
    realized = [0.0] * horizon
    at_risk = [0.0] * horizon
    backlog_value = [0.0] * horizon
    active_slots = [0] * horizon
    recognized_revenue = [0.0] * horizon   # contract-value recognition rate (not margin)
    for s in placed:
        monthly_margin = (s["value"] * s["margin"]) / s["eff_dur"]
        monthly_revenue = s["value"] / s["eff_dur"]
        for m in range(s["start"], s["finish"]):
            if 0 <= m < horizon:
                active_slots[m] += 1
                recognized_revenue[m] += monthly_revenue
                if m >= s["promised"]:
                    at_risk[m] += monthly_margin     # recognised AFTER the promised month
                else:
                    realized[m] += monthly_margin    # on-time
        for m in range(horizon):
            if m < s["start"]:
                backlog_value[m] += s["value"]                    # awaiting start
            elif m < s["finish"]:
                done = (m - s["start"]) / s["eff_dur"]
                backlog_value[m] += s["value"] * (1.0 - done)     # remaining (burns down)
    return {
        "timeline": [{
            "month": to_month(m),
            "realized": round(realized[m], 2),
            "at_risk": round(at_risk[m], 2),
            "backlog_value": round(backlog_value[m], 2),
            "active_slots": active_slots[m],
            "capacity_slots": int(teams),
        } for m in range(horizon)],
        "realized": realized,
        "at_risk": at_risk,
        "backlog_value": backlog_value,
        "recognized_revenue": recognized_revenue,
    }


def deadline_demand(book, horizon):
    """Crews the BOOK demands each month to hit every promised date on time —
    independent of how many crews you have. A project must be in production during
    [promised-dur, promised) to deliver on time (but not before its order arrives).
    Where this exceeds your crews you are capacity-short."""
    demand = [0] * horizon
    for p in book:
        win_start = max(p["intake"], p["promised"] - p["dur"])
        for m in range(win_start, p["promised"]):
            if 0 <= m < horizon:
                demand[m] += 1
    return demand


def pv_recognized(rec, p, rate):
    """Present value of recognised margin. Late (at-risk) margin is haircut by the
    realization probability (a customer may cancel/penalise a late job); on-time
    margin is certain. Month 0 is t=0 (undiscounted)."""
    total = 0.0
    for i in range(len(rec["realized"])):
        recognized = rec["realized"][i] + rec["at_risk"][i] * p
        df = 1.0 / (1.0 + rate) ** i if rate > 0 else 1.0
        total += recognized * df
    return total


BLENDED = blended_margin_per_slot_month(backlog)


def headcount_roi_for(teams, growth, cost, realization, delay):
    """Risk-adjusted ROI / NPV / payback of moving from baseline_teams -> teams.
    Two honest value sources:
      QUALITY    — late (at-risk) margin in the EXISTING book converted to on-time
                   by the extra crew (the at-risk pool shrinks).
      THROUGHPUT — the freed slot-months let a GROWING shop accept NEW orders at the
                   book's blended margin (the 'capture the market' value), risk-adjusted
                   by realization because new orders are not yet in hand.
    Returns a fully-formed dict; ROI/payback are None when no crew is added or cost<=0
    (undefined, NOT a bogus -100% / 1-month payback)."""
    af = annuity_factor(r_m, horizon_months)
    added = max(0, int(teams) - baseline_teams)

    cur = recognize(schedule(backlog, teams, delay), teams, horizon_months)
    base = recognize(schedule(backlog, baseline_teams, delay), baseline_teams, horizon_months)

    if added == 0:
        # GUARD: no crew added -> the investment is undefined. Without this, cumulative
        # cash starts at 0 and the first zero-delta month falsely reports a 1-month payback.
        return {
            "added_teams": 0,
            "baseline_teams": baseline_teams,
            "incremental_pv_margin": 0.0,
            "quality_pv_gain": 0.0,
            "throughput_pv_gain": 0.0,
            "initial_cost": 0.0,
            "annual_cost": 0.0,
            "total_cost": 0.0,
            "cost_valid": False,
            "raw_multiple": None,
            "roi_pct": None,
            "npv": 0.0,
            "payback_months": None,
            "discount_rate": round(discount_rate, 4),
            "revenue_realization": round(realization, 4),
        }

    quality_pv_gain = pv_recognized(cur, realization, r_m) - pv_recognized(base, realization, r_m)
    # Share of the new crew's slot-months the growth pipeline can fill (0..1). Floor 0.55
    # (a new crew still backfills normal order flow); slope 2.5 so the lever stays live
    # across the 0–30% growth slider and saturates near 18% rather than at the 12% default.
    util = min(1.0, 0.55 + growth * 2.5)
    # throughput is a forward annuity (af over months 1..H) vs the existing schedule, so it
    # sits one period later than the quality gain (which discounts the current timeline at t=0).
    throughput_pv_gain = added * BLENDED * util * af * realization
    incremental_pv_margin = quality_pv_gain + throughput_pv_gain

    monthly_team_cost = cost / 12.0
    initial_cost = ramp_cost_per_team * added              # t=0 outlay, never discounted
    recurring_pv_cost = monthly_team_cost * added * af
    total_cost = initial_cost + recurring_pv_cost
    cost_valid = total_cost > 0
    raw_multiple = (incremental_pv_margin / total_cost) if cost_valid else None
    roi_pct = ((raw_multiple - 1.0) * 100.0) if cost_valid else None
    npv = incremental_pv_margin - total_cost

    # payback in MONTHS on risk-adjusted incremental net cash (undiscounted). Gated on a
    # positive horizon NPV: a crew that nets negative over the horizon has no real payback,
    # even if delivering the current book opens a brief cash-positive window before the crew
    # goes underutilized. (Also covers the cost<=0 / added==0 cases, where npv is 0.)
    throughput_per_month = added * BLENDED * util * realization
    payback_months = None
    if cost_valid and npv > 0:
        cum = -initial_cost
        for i in range(horizon_months):
            inc_quality = (cur["realized"][i] + cur["at_risk"][i] * realization) \
                - (base["realized"][i] + base["at_risk"][i] * realization)
            inc = inc_quality + throughput_per_month - monthly_team_cost * added
            cum += inc
            if cum >= 0:
                payback_months = i + 1
                break

    return {
        "added_teams": added,
        "baseline_teams": baseline_teams,
        "incremental_pv_margin": round(incremental_pv_margin, 2),
        "quality_pv_gain": round(quality_pv_gain, 2),
        "throughput_pv_gain": round(throughput_pv_gain, 2),
        "initial_cost": round(initial_cost, 2),
        "annual_cost": round(cost * added, 2),
        "total_cost": round(total_cost, 2),
        "cost_valid": cost_valid,
        "raw_multiple": round(raw_multiple, 3) if raw_multiple is not None else None,
        "roi_pct": round(roi_pct, 1) if roi_pct is not None else None,
        "npv": round(npv, 2),
        "payback_months": payback_months,
        "discount_rate": round(discount_rate, 4),
        "revenue_realization": round(realization, 4),
    }


def enrich_timeline(timeline, raw_rec, avg_monthly_revenue):
    """Add operating_profit and coverage_months to each timeline entry.

    operating_profit: the monthly net after fixed overhead. This is the mechanism
    Kangasluoma (2016) identifies: when the book thins or projects slip, fixed costs
    hold while gross margin falls — operating profit declines faster than revenue.

    coverage_months: remaining book value / average monthly revenue recognition rate.
    Analogous to 'days of inventory' — how long the committed pipeline covers forward
    revenue at the current recognition pace. The research shows companies with large
    backlogs entering downturns saw revenue decline only 13% vs 35% operating profit
    decline; book coverage quantifies that protective buffer.
    """
    for m, entry in enumerate(timeline):
        op = (raw_rec["realized"][m]
              + raw_rec["at_risk"][m] * revenue_realization
              - fixed_cost_base_monthly)
        entry["operating_profit"] = round(op, 2)
        entry["fixed_cost_monthly"] = round(fixed_cost_base_monthly, 2)
        entry["coverage_months"] = (
            round(entry["backlog_value"] / avg_monthly_revenue, 1)
            if avg_monthly_revenue > 0 else None
        )
    return timeline


def stress_scenario(base_recognized, base_op_profit_total):
    """Empirical stress run: Kangasluoma (2016) 2008→2009 benchmarks applied to
    this book. Contract values cut by the measured backlog contraction
    (STRESS_BACKLOG_DELTA_PCT = −20.86%) and the flagship slipped a further
    STRESS_FLAGSHIP_DELAY_ADD (+3) months, on top of the current delay shock.

    Returns stress_timeline (same structure as base timeline) and stress_comparison
    with base vs stress metrics and the published Finnish ETO benchmarks as anchors.

    The amplification metric shows how many times faster operating profit declines
    relative to revenue — the research measured 2.66× across 18 companies in 2009.
    """
    factor = 1.0 + STRESS_BACKLOG_DELTA_PCT / 100.0   # −20.86% -> 0.7914
    stressed = [{**p, "value": round(p["value"] * factor, 2)} for p in backlog]
    s_rec = recognize(
        schedule(stressed, delivery_teams, delay_shock_months + STRESS_FLAGSHIP_DELAY_ADD),
        delivery_teams,
        horizon_months,
    )

    s_realized_total = sum(s_rec["realized"])
    s_at_risk_adjusted = sum(s_rec["at_risk"]) * revenue_realization
    s_recognized = s_realized_total + s_at_risk_adjusted
    s_op_profit_total = s_recognized - fixed_cost_base_monthly * horizon_months

    s_active_months = sum(1 for r in s_rec["recognized_revenue"] if r > 0)
    avg_s_rev = sum(s_rec["recognized_revenue"]) / s_active_months if s_active_months > 0 else 0.0
    stress_tl = []
    for m, entry in enumerate(s_rec["timeline"]):
        s_op = (s_rec["realized"][m]
                + s_rec["at_risk"][m] * revenue_realization
                - fixed_cost_base_monthly)
        stress_tl.append({
            **entry,
            "operating_profit": round(s_op, 2),
            "fixed_cost_monthly": round(fixed_cost_base_monthly, 2),
            "coverage_months": (
                round(entry["backlog_value"] / avg_s_rev, 1) if avg_s_rev > 0 else None
            ),
        })

    def delta_pct(base_val, stress_val):
        if base_val == 0:
            return None
        return round((stress_val - base_val) / abs(base_val) * 100.0, 1)

    rev_delta = delta_pct(base_recognized, s_recognized)
    op_delta = delta_pct(base_op_profit_total, s_op_profit_total)

    # How many times faster does operating profit decline than revenue?
    # Benchmark from Kangasluoma (2016): 35.4% / 13.33% = 2.66×
    amplification = None
    if (rev_delta is not None and rev_delta < 0
            and op_delta is not None and op_delta < 0):
        amplification = round(abs(op_delta) / abs(rev_delta), 2)

    return {
        "stress_timeline": stress_tl,
        "stress_comparison": {
            "base_recognized": round(base_recognized, 2),
            "base_op_profit": round(base_op_profit_total, 2),
            "stress_recognized": round(s_recognized, 2),
            "stress_op_profit": round(s_op_profit_total, 2),
            "revenue_delta_pct": rev_delta,
            "op_profit_delta_pct": op_delta,
            "amplification": amplification,
            "stress_backlog_applied_pct": STRESS_BACKLOG_DELTA_PCT,
            # Kangasluoma (2016) — 18 Finnish ETO manufacturers, 2008→2009
            "benchmark_backlog_delta_pct": -20.86,
            "benchmark_revenue_delta_pct": -13.33,
            "benchmark_op_profit_delta_pct": -35.4,
            "benchmark_amplification": 2.66,
        },
    }


def compute():
    if not backlog:
        return {
            "timeline": [], "capacity_gap": [],
            "headcount_roi": headcount_roi_for(delivery_teams, order_intake_growth,
                                               cost_per_team, revenue_realization, delay_shock_months),
            "sensitivity": [],
            "summary": {
                "company": "Meridian Technologies", "backlog_projects": 0, "backlog_value": 0.0,
                "horizon_months": horizon_months, "realized_total": 0.0, "at_risk_total": 0.0,
                "at_risk_share_pct": 0.0, "months_capacity_short": 0, "backlog_cleared_pct": 0.0,
                "operating_profit_total": 0.0, "op_margin_pct": 0.0,
                "coverage_months_now": None, "coverage_warning_month": None,
                "fixed_cost_base_monthly": round(fixed_cost_base_monthly, 2),
            },
            "stress_timeline": None,
            "stress_comparison": None,
        }

    rec = recognize(schedule(backlog, delivery_teams, delay_shock_months),
                    delivery_teams, horizon_months)
    timeline = rec["timeline"]

    demand = deadline_demand(backlog, horizon_months)
    capacity_gap = [{
        "month": to_month(m),
        "demand_slots": demand[m],
        "available_slots": int(delivery_teams),
        "gap": max(0, demand[m] - int(delivery_teams)),
    } for m in range(horizon_months)]

    headcount_roi = headcount_roi_for(delivery_teams, order_intake_growth,
                                      cost_per_team, revenue_realization, delay_shock_months)

    # ---- SENSITIVITY (tornado) on roi_pct, per-driver native ranges ----
    base_roi = headcount_roi["roi_pct"]

    def roi_of(teams=delivery_teams, growth=order_intake_growth, cost=cost_per_team,
               realization=revenue_realization, delay=delay_shock_months):
        return headcount_roi_for(teams, growth, cost, realization, delay)["roi_pct"]

    sensitivity = []

    def add(name, lo, hi):
        if lo is None or hi is None:
            return
        a, b = sorted([lo, hi])
        sensitivity.append({"factor": name, "low": round(a, 1), "high": round(b, 1),
                            "swing": round(b - a, 1)})

    add("Cost per team",
        roi_of(cost=cost_per_team * 1.20), roi_of(cost=cost_per_team * 0.80))
    add("Order-intake growth",
        roi_of(growth=max(0.0, order_intake_growth - 0.04)),
        roi_of(growth=order_intake_growth + 0.04))
    add("Delivery teams",
        roi_of(teams=max(baseline_teams + 1, delivery_teams - 1)),
        roi_of(teams=delivery_teams + 1))
    add("Revenue realization",
        roi_of(realization=max(0.0, revenue_realization - 0.10)),
        roi_of(realization=min(1.0, revenue_realization + 0.10)))
    add("Delay shock",
        roi_of(delay=0), roi_of(delay=3))
    sensitivity.sort(key=lambda f: abs(f["swing"]), reverse=True)

    realized_total = sum(r["realized"] for r in timeline)
    at_risk_total = sum(r["at_risk"] for r in timeline)
    recognized_total = realized_total + at_risk_total
    base_recognized = realized_total + at_risk_total * revenue_realization
    base_op_profit_total = base_recognized - fixed_cost_base_monthly * horizon_months

    bv0 = timeline[0]["backlog_value"] if timeline else 0.0
    bv_end = timeline[-1]["backlog_value"] if timeline else 0.0
    cleared_pct = round(100.0 * (1.0 - bv_end / bv0), 1) if bv0 > 0 else 0.0

    # Coverage: remaining book / average monthly recognized revenue (contract-value basis).
    # Average over ACTIVE delivery months only. Dividing by the full horizon would fold in
    # the idle months after the book clears, deflating the rate and pegging coverage at the
    # horizon length — a book that physically clears in 7 months would read as 18 months of
    # runway. The active-month pace answers the real question: at the rate work is actually
    # delivered, how many months of revenue does the committed book represent? (When the book
    # fully clears in-horizon this equals the active-month count; when it spills past the
    # horizon it exceeds it. It can no longer be silently pinned to the horizon.)
    total_recognized_revenue = sum(rec["recognized_revenue"])
    active_months = sum(1 for r in rec["recognized_revenue"] if r > 0)
    avg_monthly_revenue = total_recognized_revenue / active_months if active_months > 0 else 0.0
    coverage_months_now = (
        round(bv0 / avg_monthly_revenue, 1) if avg_monthly_revenue > 0 else None
    )

    # Enrich timeline with operating_profit and coverage_months per entry
    enrich_timeline(timeline, rec, avg_monthly_revenue)

    coverage_warning_month = next(
        (entry["month"] for entry in timeline
         if entry["coverage_months"] is not None and entry["coverage_months"] < 6.0),
        None,
    )

    op_margin_pct = (
        round(base_op_profit_total / base_recognized * 100.0, 1)
        if base_recognized > 0 else 0.0
    )

    # Stress scenario — only computed on demand to avoid doubling every live slider tick
    stress_out = stress_scenario(base_recognized, base_op_profit_total) if run_stress else None

    return {
        "timeline": timeline,
        "capacity_gap": capacity_gap,
        "headcount_roi": headcount_roi,
        "sensitivity": sensitivity,
        "summary": {
            "company": "Meridian Technologies",
            "backlog_projects": len(backlog),
            "backlog_value": round(sum(p["value"] for p in backlog), 2),
            "horizon_months": horizon_months,
            "realized_total": round(realized_total, 2),
            "at_risk_total": round(at_risk_total, 2),
            "at_risk_share_pct": round(100.0 * at_risk_total / recognized_total, 1) if recognized_total > 0 else 0.0,
            "months_capacity_short": sum(1 for g in capacity_gap if g["gap"] > 0),
            "backlog_cleared_pct": cleared_pct,
            "operating_profit_total": round(base_op_profit_total, 2),
            "op_margin_pct": op_margin_pct,
            "coverage_months_now": coverage_months_now,
            "coverage_warning_month": coverage_warning_month,
            "fixed_cost_base_monthly": round(fixed_cost_base_monthly, 2),
        },
        "stress_timeline": stress_out["stress_timeline"] if stress_out else None,
        "stress_comparison": stress_out["stress_comparison"] if stress_out else None,
    }


result = compute()
