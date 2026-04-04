"""Generate monthly P&L data for 3 divisions over 24 months."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from constants import DIVISIONS, START_DATE, NUM_MONTHS, RNG

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def generate_pnl():
    rows = []
    dates = pd.date_range(START_DATE, periods=NUM_MONTHS, freq="ME")

    for div_key, div in DIVISIONS.items():
        monthly_base = div["annual_revenue"] / 12
        seasonality = div["seasonality"]

        # Surprise months: 1-2 per division where revenue deviates from pattern
        surprise_months = RNG.choice(range(NUM_MONTHS), size=2, replace=False)
        surprise_factors = RNG.uniform(0.92, 1.15, size=2)

        for i, date in enumerate(dates):
            month_idx = date.month - 1  # 0-indexed month for seasonality
            year_offset = i / 12  # fractional years elapsed

            # Base revenue with growth
            growth_factor = (1 + div["growth_rate"]) ** year_offset
            seasonal_factor = seasonality[month_idx]
            noise = RNG.normal(1.0, 0.03)

            revenue = monthly_base * growth_factor * seasonal_factor * noise

            # Apply surprise if this is a surprise month
            if i in surprise_months:
                idx = list(surprise_months).index(i)
                revenue *= surprise_factors[idx]

            revenue = round(revenue, 2)

            # COGS correlated with revenue
            margin_noise = RNG.normal(0, 0.012)
            gross_margin = div["gross_margin_target"] + margin_noise
            gross_margin = np.clip(gross_margin, 0.40, 0.70)
            cogs = round(revenue * (1 - gross_margin), 2)
            gross_profit = round(revenue - cogs, 2)
            gross_margin_pct = round(gross_profit / revenue * 100, 2)

            # Operating expenses
            rd_noise = RNG.normal(1.0, 0.02)
            sga_noise = RNG.normal(1.0, 0.03)
            rd_expense = round(revenue * div["rd_pct"] * rd_noise, 2)
            sga_expense = round(revenue * div["sga_pct"] * sga_noise, 2)
            total_opex = round(rd_expense + sga_expense, 2)

            ebitda = round(gross_profit - total_opex, 2)
            ebitda_margin_pct = round(ebitda / revenue * 100, 2)

            depreciation = round(revenue * div["depreciation_pct"] * RNG.normal(1.0, 0.01), 2)
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
