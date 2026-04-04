"""Inject data quality issues into clean P1 CSVs to produce raw versions."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from constants import DIVISIONS, RNG

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
PUBLIC_DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "public", "data")


def inject_division_names(df):
    """Replace canonical division names with random aliases."""
    new_names = []
    for _, row in df.iterrows():
        for div_key, div in DIVISIONS.items():
            if row["division"] == div["label"]:
                weights = [0.20, 0.30, 0.10, 0.40]  # alias1, alias2, alias3, canonical
                choice = RNG.choice(div["aliases"], p=weights)
                new_names.append(choice)
                break
    df["division"] = new_names
    return df


def inject_missing_values(df, nullable_cols, rate=0.125):
    """Set rate% of values in nullable columns to NaN."""
    df = df.copy()
    n_total = len(df) * len(nullable_cols)
    n_nulls = int(n_total * rate)
    for _ in range(n_nulls):
        row_idx = RNG.integers(0, len(df))
        col = RNG.choice(nullable_cols)
        df.at[row_idx, col] = np.nan
    return df


def inject_duplicates(df, count=2):
    """Insert exact duplicate rows at random positions."""
    dup_indices = RNG.choice(len(df), size=count, replace=False)
    dups = df.iloc[dup_indices].copy()
    df = pd.concat([df, dups], ignore_index=True)
    # Shuffle so duplicates aren't at the end
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    return df


def inject():
    os.makedirs(PUBLIC_DATA, exist_ok=True)

    # P&L: YYYY-MM-DD format (already correct), inject names/nulls/dupes
    pnl = pd.read_csv(os.path.join(OUTPUT_DIR, "corporate_pnl_clean.csv"))
    pnl = inject_division_names(pnl)
    pnl = inject_missing_values(pnl,
        ["gross_margin_pct", "ebitda_margin_pct", "rd_expense", "sga_expense",
         "depreciation", "interest_expense"], rate=0.12)
    pnl = inject_duplicates(pnl, 2)
    pnl.to_csv(os.path.join(PUBLIC_DATA, "corporate_pnl_raw.csv"), index=False)
    print(f"P&L raw: {len(pnl)} rows (format: YYYY-MM-DD)")

    # Cash flow: MM/DD/YYYY format
    cf = pd.read_csv(os.path.join(OUTPUT_DIR, "corporate_cashflow_clean.csv"))
    cf["date"] = pd.to_datetime(cf["date"]).dt.strftime("%m/%d/%Y")
    cf = inject_division_names(cf)
    cf = inject_missing_values(cf,
        ["other_operating", "acquisitions", "debt_issuance", "dividends"], rate=0.12)
    cf = inject_duplicates(cf, 1)
    cf.to_csv(os.path.join(PUBLIC_DATA, "corporate_cashflow_raw.csv"), index=False)
    print(f"Cash flow raw: {len(cf)} rows (format: MM/DD/YYYY)")

    # Working capital: DD-Mon-YYYY format
    wc = pd.read_csv(os.path.join(OUTPUT_DIR, "corporate_working_capital_clean.csv"))
    wc["date"] = pd.to_datetime(wc["date"]).dt.strftime("%d-%b-%Y")
    wc = inject_division_names(wc)
    wc = inject_missing_values(wc,
        ["current_ratio", "dio", "net_working_capital", "inventory"], rate=0.12)
    wc = inject_duplicates(wc, 0)  # No dupes in WC (total 2+1+0 = 3 across files)
    wc.to_csv(os.path.join(PUBLIC_DATA, "corporate_working_capital_raw.csv"), index=False)
    print(f"Working capital raw: {len(wc)} rows (format: DD-Mon-YYYY)")


if __name__ == "__main__":
    inject()
