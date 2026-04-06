"""Generate monthly P&L data for 3 divisions over 24 months.

Key realism features:
- AR(1) revenue momentum (lag-1 autocorrelation ~0.7-0.9)
- GM drift (slow multi-month trend from deal mix / pricing changes)
- OpEx spike months (big hires, restructuring, one-time costs)
- Revenue surprises (big deal close, lost contract)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from constants import DIVISIONS, START_DATE, NUM_MONTHS, RNG

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# AR(1) momentum coefficient: how much last month's deviation carries forward
# 0.75 means 75% of last month's over/under-performance persists
MOMENTUM = 0.75


def generate_pnl():
    rows = []
    dates = pd.date_range(START_DATE, periods=NUM_MONTHS, freq="ME")

    for div_key, div in DIVISIONS.items():
        monthly_base = div["annual_revenue"] / 12
        seasonality = div["seasonality"]

        # Surprise revenue months: 1-2 per division (big deal close, lost contract)
        # Tunguz SaaS seasonality: subscription models smooth MoM; >12% MoM rare
        surprise_months = RNG.choice(range(2, NUM_MONTHS - 1), size=2, replace=False)
        surprise_factors = RNG.uniform(0.91, 1.10, size=2)  # ±9-10% max

        # OpEx spike months: 2-3 per division
        opex_spike_months = RNG.choice(
            [m for m in range(NUM_MONTHS) if m not in surprise_months],
            size=3, replace=False
        )
        opex_spike_factors = RNG.uniform(1.15, 1.40, size=3)

        # GM drift: slow multi-month trend
        gm_drift = np.cumsum(RNG.normal(0, 0.003, size=NUM_MONTHS))

        # Revenue momentum state: tracks deviation from expected
        prev_deviation = 0.0

        for i, date in enumerate(dates):
            month_idx = date.month - 1
            year_offset = i / 12

            # Expected revenue (deterministic baseline)
            growth_factor = (1 + div["growth_rate"]) ** year_offset
            seasonal_factor = seasonality[month_idx]
            expected_revenue = monthly_base * growth_factor * seasonal_factor

            # AR(1) momentum: carry forward portion of last month's deviation
            # plus fresh innovation noise
            innovation = RNG.normal(0, 0.025)
            deviation = MOMENTUM * prev_deviation + innovation

            # Apply surprise on top
            if i in surprise_months:
                idx = list(surprise_months).index(i)
                deviation += (surprise_factors[idx] - 1.0)

            revenue = round(expected_revenue * (1 + deviation), 2)
            prev_deviation = deviation

            # COGS: wider noise + drift
            margin_noise = RNG.normal(0, 0.025)
            gross_margin = div["gross_margin_target"] + margin_noise + gm_drift[i]
            gross_margin = np.clip(gross_margin, 0.38, 0.72)
            cogs = round(revenue * (1 - gross_margin), 2)
            gross_profit = round(revenue - cogs, 2)
            gross_margin_pct = round(gross_profit / revenue * 100, 2)

            # OpEx with spike events
            rd_noise = RNG.normal(1.0, 0.04)
            sga_noise = RNG.normal(1.0, 0.06)

            if i in opex_spike_months:
                spike_idx = list(opex_spike_months).index(i)
                spike = opex_spike_factors[spike_idx]
                if RNG.random() > 0.5:
                    rd_noise *= spike
                else:
                    sga_noise *= spike

            rd_expense = round(revenue * div["rd_pct"] * rd_noise, 2)
            sga_expense = round(revenue * div["sga_pct"] * sga_noise, 2)
            total_opex = round(rd_expense + sga_expense, 2)

            ebitda = round(gross_profit - total_opex, 2)
            ebitda_margin_pct = round(ebitda / revenue * 100, 2)

            depreciation = round(revenue * div["depreciation_pct"] * RNG.normal(1.0, 0.02), 2)
            ebit = round(ebitda - depreciation, 2)
            interest_expense = round(revenue * div["interest_pct"] * RNG.normal(1.0, 0.05), 2)
            pretax_income = round(ebit - interest_expense, 2)

            rows.append({
                "date": date.strftime("%Y-%m-%d"),
                "division": div["label"],
                "revenue": revenue,
                "cogs": cogs,
                "gross_profit": gross_profit,
                "gross_margin_pct": gross_margin_pct,
                "rd_expense": rd_expense,
                "sga_expense": sga_expense,
                "total_opex": total_opex,
                "ebitda": ebitda,
                "ebitda_margin_pct": ebitda_margin_pct,
                "depreciation": depreciation,
                "ebit": ebit,
                "interest_expense": interest_expense,
                "pretax_income": pretax_income,
            })

    df = pd.DataFrame(rows)
    output_path = os.path.join(OUTPUT_DIR, "corporate_pnl_clean.csv")
    df.to_csv(output_path, index=False)
    print(f"P&L generated: {len(df)} rows -> {output_path}")
    return df


if __name__ == "__main__":
    generate_pnl()
