"""Validate P1 datasets pass realism checks."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np

PUBLIC_DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "public", "data")
CLEAN_DIR = os.path.join(os.path.dirname(__file__), "output")


def check(name, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))
    return passed


def validate():
    print("=" * 60)
    print("PROJECT 1 VALIDATION")
    print("=" * 60)
    all_pass = True

    # Load clean data for margin/correlation checks
    pnl_clean = pd.read_csv(os.path.join(CLEAN_DIR, "corporate_pnl_clean.csv"))
    cf_clean = pd.read_csv(os.path.join(CLEAN_DIR, "corporate_cashflow_clean.csv"))
    wc_clean = pd.read_csv(os.path.join(CLEAN_DIR, "corporate_working_capital_clean.csv"))

    # Load raw data for injection checks
    pnl_raw = pd.read_csv(os.path.join(PUBLIC_DATA, "corporate_pnl_raw.csv"))
    cf_raw = pd.read_csv(os.path.join(PUBLIC_DATA, "corporate_cashflow_raw.csv"))
    wc_raw = pd.read_csv(os.path.join(PUBLIC_DATA, "corporate_working_capital_raw.csv"))

    print("\n--- Financial Realism (clean data) ---")

    # Gross margin range
    gm = pnl_clean["gross_margin_pct"]
    all_pass &= check("Gross margin 40-70%",
                       gm.min() >= 40 and gm.max() <= 70,
                       f"range: {gm.min():.1f}% - {gm.max():.1f}%")

    # EBITDA margin range
    em = pnl_clean["ebitda_margin_pct"]
    all_pass &= check("EBITDA margin 10-30%",
                       em.min() >= 10 and em.max() <= 30,
                       f"range: {em.min():.1f}% - {em.max():.1f}%")

    # Revenue seasonality
    pnl_clean["_date"] = pd.to_datetime(pnl_clean["date"])
    for div in pnl_clean["division"].unique():
        d = pnl_clean[pnl_clean["division"] == div]
        q4 = d[d["_date"].dt.quarter == 4]["revenue"].mean()
        q2 = d[d["_date"].dt.quarter == 2]["revenue"].mean()
        all_pass &= check(f"Q4 > Q2 ({div})", q4 > q2,
                           f"Q4={q4:,.0f} Q2={q2:,.0f}")

    # COGS-revenue correlation
    corr = pnl_clean[["revenue", "cogs"]].corr().iloc[0, 1]
    all_pass &= check("Revenue-COGS correlation > 0.85",
                       corr > 0.85, f"r={corr:.4f}")

    # YoY revenue growth
    pnl_clean["_date"] = pd.to_datetime(pnl_clean["date"])
    for div in pnl_clean["division"].unique():
        d = pnl_clean[pnl_clean["division"] == div].sort_values("_date")
        first_12 = d.head(12)["revenue"].sum()
        last_12 = d.tail(12)["revenue"].sum()
        yoy = (last_12 / first_12 - 1) * 100
        all_pass &= check(f"YoY growth 5-20% ({div})",
                           5 <= yoy <= 20, f"{yoy:.1f}%")

    # OCF sign
    ocf_negative = (cf_clean["operating_cash_flow"] < 0).sum()
    all_pass &= check("OCF positive most months",
                       ocf_negative <= 3, f"{ocf_negative} negative months")

    # CCC range — services/cloud can have low or negative CCC (DIO near 0)
    ccc = wc_clean["cash_conversion_cycle"]
    extreme = ((ccc < -20) | (ccc > 100)).sum()
    all_pass &= check("CCC range -20 to 100 days",
                       extreme == 0, f"range: {ccc.min():.0f} to {ccc.max():.0f}, {extreme} extreme outliers")

    print("\n--- Quality Injection (raw data) ---")

    # Missing value rate (across all 3 files)
    total_cells = pnl_raw.size + cf_raw.size + wc_raw.size
    total_nulls = pnl_raw.isna().sum().sum() + cf_raw.isna().sum().sum() + wc_raw.isna().sum().sum()
    missing_rate = total_nulls / total_cells * 100
    all_pass &= check("Missing value rate 2-12%",
                       2 <= missing_rate <= 12, f"{missing_rate:.1f}%")

    # Duplicate count (raw rows - clean rows)
    total_dupes = len(pnl_raw) + len(cf_raw) + len(wc_raw) - 72 * 3
    all_pass &= check("Duplicate count 2-5",
                       2 <= total_dupes <= 5, f"{total_dupes} duplicates")

    # Date format diversity
    pnl_date_sample = str(pnl_raw["date"].iloc[0])
    cf_date_sample = str(cf_raw["date"].iloc[0])
    wc_date_sample = str(wc_raw["date"].iloc[0])
    # Check that all 3 look different
    all_different = (pnl_date_sample != cf_date_sample and
                     cf_date_sample != wc_date_sample and
                     pnl_date_sample != wc_date_sample)
    all_pass &= check("Date formats differ across files",
                       all_different,
                       f"P&L: {pnl_date_sample}, CF: {cf_date_sample}, WC: {wc_date_sample}")

    # Division name inconsistency
    unique_names = pnl_raw["division"].nunique()
    all_pass &= check("Division name variants > 3",
                       unique_names > 3, f"{unique_names} unique names")

    print("\n" + "=" * 60)
    if all_pass:
        print("RESULT: ALL CHECKS PASSED")
    else:
        print("RESULT: SOME CHECKS FAILED")
    print("=" * 60)

    return all_pass


if __name__ == "__main__":
    success = validate()
    sys.exit(0 if success else 1)
