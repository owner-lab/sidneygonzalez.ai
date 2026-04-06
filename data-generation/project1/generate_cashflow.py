"""Generate monthly cash flow data derived from clean P&L."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from constants import DIVISIONS, RNG

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
PNL_PATH = os.path.join(OUTPUT_DIR, "corporate_pnl_clean.csv")


def generate_cashflow():
    pnl = pd.read_csv(PNL_PATH)
    pnl["date"] = pd.to_datetime(pnl["date"])
    rows = []

    for div_key, div in DIVISIONS.items():
        div_data = pnl[pnl["division"] == div["label"]].sort_values("date").reset_index(drop=True)
        prev_revenue = None
        prev_cogs = None

        for i, row in div_data.iterrows():
            date = row["date"]
            revenue = row["revenue"]
            cogs = row["cogs"]

            # Net income (25% effective tax rate)
            net_income = round(row["pretax_income"] * 0.75, 2)
            depreciation_add_back = row["depreciation"]

            # Working capital changes (lag revenue/cogs by 1 month)
            if prev_revenue is not None:
                dso_days = div["dso_target"] + RNG.normal(0, 3)
                change_in_ar = round((revenue - prev_revenue) * (dso_days / 30) * RNG.normal(1, 0.1), 2)
                change_in_ap = round((cogs - prev_cogs) * (div["dpo_target"] / 30) * RNG.normal(1, 0.1), 2)
                change_in_inventory = round((cogs - prev_cogs) * (div["dio_target"] / 30) * RNG.normal(1, 0.15), 2)
            else:
                change_in_ar = 0.0
                change_in_ap = 0.0
                change_in_inventory = 0.0

            other_operating = round(RNG.normal(0, revenue * 0.002), 2)

            operating_cash_flow = round(
                net_income + depreciation_add_back
                - change_in_ar + change_in_ap - change_in_inventory
                + other_operating, 2
            )

            # Investing
            capex = round(-abs(revenue * div["capex_pct"] * RNG.normal(1, 0.05)), 2)

            # 1-2 acquisitions over 24 months (only for enterprise software)
            acquisitions = 0.0
            if div_key == "enterprise_software" and i in [8, 18]:
                acquisitions = round(-RNG.uniform(2_000_000, 5_000_000), 2)

            investing_cash_flow = round(capex + acquisitions, 2)

            # Financing
            quarterly_payment = 500_000 if div_key == "enterprise_software" else 250_000
            debt_repayment = round(-quarterly_payment / 3, 2)  # spread monthly

            # Occasional debt issuance
            debt_issuance = 0.0
            if i == 12 and div_key == "cloud_infrastructure":
                debt_issuance = 10_000_000.0  # growth funding

            # Quarterly dividends (month 3, 6, 9, 12)
            dividends = 0.0
            if date.month in [3, 6, 9, 12]:
                dividends = round(-abs(net_income * 0.25), 2)

            financing_cash_flow = round(debt_issuance + debt_repayment + dividends, 2)
            net_cash_flow = round(operating_cash_flow + investing_cash_flow + financing_cash_flow, 2)

            rows.append({
                "date": date.strftime("%Y-%m-%d"),
                "division": div["label"],
                "net_income": net_income,
                "depreciation_add_back": depreciation_add_back,
                "change_in_ar": change_in_ar,
                "change_in_ap": change_in_ap,
                "change_in_inventory": change_in_inventory,
                "other_operating": other_operating,
                "operating_cash_flow": operating_cash_flow,
                "capex": capex,
                "acquisitions": acquisitions,
                "investing_cash_flow": investing_cash_flow,
                "debt_issuance": debt_issuance,
                "debt_repayment": debt_repayment,
                "dividends": dividends,
                "financing_cash_flow": financing_cash_flow,
                "net_cash_flow": net_cash_flow,
            })

            prev_revenue = revenue
            prev_cogs = cogs

    df = pd.DataFrame(rows)
    output_path = os.path.join(OUTPUT_DIR, "corporate_cashflow_clean.csv")
    df.to_csv(output_path, index=False)
    print(f"Cash flow generated: {len(df)} rows -> {output_path}")
    return df


if __name__ == "__main__":
    generate_cashflow()
