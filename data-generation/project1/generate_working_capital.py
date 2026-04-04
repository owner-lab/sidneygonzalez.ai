"""Generate monthly working capital metrics derived from clean P&L.

Key realism features:
- DSO spikes when revenue dips (customers slow-pay in tough months)
- DPO rises when cash is tight (company stretches payables)
- Cumulative cash balance tracked month-over-month
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from constants import DIVISIONS, RNG

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
PNL_PATH = os.path.join(OUTPUT_DIR, "corporate_pnl_clean.csv")
CF_PATH = os.path.join(OUTPUT_DIR, "corporate_cashflow_clean.csv")


def generate_working_capital():
    pnl = pd.read_csv(PNL_PATH)
    pnl["date"] = pd.to_datetime(pnl["date"])

    # Load cash flow for cumulative balance tracking
    cf = pd.read_csv(CF_PATH)
    cf["date"] = pd.to_datetime(cf["date"])

    rows = []

    for div_key, div in DIVISIONS.items():
        div_pnl = pnl[pnl["division"] == div["label"]].sort_values("date").reset_index(drop=True)
        div_cf = cf[cf["division"] == div["label"]].sort_values("date").reset_index(drop=True)

        # Compute revenue MoM change for stress linkage
        rev_series = div_pnl["revenue"].values
        rev_mom_pct = np.zeros(len(rev_series))
        for j in range(1, len(rev_series)):
            rev_mom_pct[j] = (rev_series[j] - rev_series[j-1]) / rev_series[j-1]

        # Starting cash balance
        cumulative_cash = div["annual_revenue"] * 0.08  # ~1 month of revenue as starting cash

        for i, row in div_pnl.iterrows():
            date = row["date"]
            revenue = row["revenue"]
            cogs = row["cogs"]

            # --- DSO: stress-linked to revenue performance ---
            q4_bump = 5 if date.month in [10, 11, 12] else 0
            q1_dip = -3 if date.month in [1, 2] else 0

            # Bad revenue month -> DSO spikes (JPMorgan Working Capital Index 2024:
            # DSO reached 5-year high of 54.1d as customers delayed payments;
            # PwC Working Capital Study shows 5-15 day spikes during downturns)
            #
            # Services divisions have lower thresholds — even small revenue
            # dips indicate utilization drops, which slow collections as
            # clients renegotiate payment timelines on reduced scopes
            stress_threshold = -0.01 if div_key == "professional_services" else -0.02
            stress_multiplier = 120 if div_key == "professional_services" else 80
            stress_bump = 0
            if i > 0 and rev_mom_pct[i] < stress_threshold:
                stress_bump = abs(rev_mom_pct[i]) * stress_multiplier

            dso = round(div["dso_target"] + q4_bump + q1_dip + stress_bump + RNG.normal(0, 2.5), 1)
            dso = max(10, dso)

            # --- DPO: rises when cash is tight ---
            cash_tight = 0
            if i < len(div_cf) and div_cf.iloc[i]["operating_cash_flow"] < 0:
                cash_tight = RNG.uniform(3, 8)  # stretch payables when OCF negative

            dpo = round(div["dpo_target"] + cash_tight + RNG.normal(0, 2), 1)
            dpo = max(15, dpo)

            # DIO
            dio = round(div["dio_target"] + RNG.normal(0, max(1, div["dio_target"] * 0.15)), 1)
            dio = max(0, dio)

            # Balances derived from metrics
            accounts_receivable = round(revenue * (dso / 30), 2)
            accounts_payable = round(cogs * (dpo / 30), 2)
            inventory = round(cogs * (dio / 30), 2) if dio > 0 else 0.0

            cash_conversion_cycle = round(dso + dio - dpo, 1)

            # Cumulative cash balance from cash flow
            if i < len(div_cf):
                cumulative_cash += div_cf.iloc[i]["net_cash_flow"]
            cumulative_cash = max(0, cumulative_cash)

            current_assets = round(accounts_receivable + inventory + cumulative_cash, 2)

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
                "cash_balance": round(cumulative_cash, 2),
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
