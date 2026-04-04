"""Generate monthly working capital metrics derived from clean P&L."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from constants import DIVISIONS, RNG

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
PNL_PATH = os.path.join(OUTPUT_DIR, "corporate_pnl_clean.csv")


def generate_working_capital():
    pnl = pd.read_csv(PNL_PATH)
    pnl["date"] = pd.to_datetime(pnl["date"])
    rows = []

    for div_key, div in DIVISIONS.items():
        div_data = pnl[pnl["division"] == div["label"]].sort_values("date").reset_index(drop=True)

        for i, row in div_data.iterrows():
            date = row["date"]
            revenue = row["revenue"]
            cogs = row["cogs"]

            # DSO drifts: rises in Q4 (customers delay), drops in Q1
            q4_bump = 5 if date.month in [10, 11, 12] else 0
            q1_dip = -3 if date.month in [1, 2] else 0
            dso = round(div["dso_target"] + q4_bump + q1_dip + RNG.normal(0, 2.5), 1)
            dso = max(10, dso)

            dpo = round(div["dpo_target"] + RNG.normal(0, 2), 1)
            dpo = max(15, dpo)

            dio = round(div["dio_target"] + RNG.normal(0, max(1, div["dio_target"] * 0.15)), 1)
            dio = max(0, dio)

            # Balances derived from metrics
            accounts_receivable = round(revenue * (dso / 30), 2)
            accounts_payable = round(cogs * (dpo / 30), 2)
            inventory = round(cogs * (dio / 30), 2) if dio > 0 else 0.0

            cash_conversion_cycle = round(dso + dio - dpo, 1)

            # Current assets/liabilities (simplified)
            cash_balance = round(revenue * RNG.uniform(0.08, 0.15), 2)
            current_assets = round(accounts_receivable + inventory + cash_balance, 2)

            short_term_debt = round(revenue * RNG.uniform(0.02, 0.06), 2)
            current_liabilities = round(accounts_payable + short_term_debt, 2)

            current_ratio = round(current_assets / current_liabilities, 2) if current_liabilities > 0 else 0.0
            net_working_capital = round(current_assets - current_liabilities, 2)

            rows.append({
                "date": date.strftime("%Y-%m-%d"),
                "division": div["label"],
                "accounts_receivable": accounts_receivable,
                "accounts_payable": accounts_payable,
                "inventory": inventory,
                "dso": dso,
                "dpo": dpo,
                "dio": dio,
                "cash_conversion_cycle": cash_conversion_cycle,
                "current_assets": current_assets,
                "current_liabilities": current_liabilities,
                "current_ratio": current_ratio,
                "net_working_capital": net_working_capital,
            })

    df = pd.DataFrame(rows)
    output_path = os.path.join(OUTPUT_DIR, "corporate_working_capital_clean.csv")
    df.to_csv(output_path, index=False)
    print(f"Working capital generated: {len(df)} rows -> {output_path}")
    return df


if __name__ == "__main__":
    generate_working_capital()
