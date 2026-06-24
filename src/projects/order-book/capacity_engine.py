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
    on-time (realized) vs past-promised (at-risk), plus a monotonic backlog burn-down."""
    realized = [0.0] * horizon
    at_risk = [0.0] * horizon
    backlog_value = [0.0] * horizon
    active_slots = [0] * horizon
    for s in placed:
        monthly_margin = (s["value"] * s["margin"]) / s["eff_dur"]
        for m in range(s["start"], s["finish"]):
            if 0 <= m < horizon:
                active_slots[m] += 1
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
            },
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
    bv0 = timeline[0]["backlog_value"]
    bv_end = timeline[-1]["backlog_value"]
    cleared_pct = round(100.0 * (1.0 - bv_end / bv0), 1) if bv0 > 0 else 0.0

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
        },
    }


result = compute()
