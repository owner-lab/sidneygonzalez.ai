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
    all_pass &= check("Gross margin 38-72%",
                       gm.min() >= 38 and gm.max() <= 72,
                       f"range: {gm.min():.1f}% - {gm.max():.1f}%")

    # EBITDA margin range (wider — OpEx spikes can compress to ~12%, good months hit 30%)
    em = pnl_clean["ebitda_margin_pct"]
    all_pass &= check("EBITDA margin 8-40%",
                       em.min() >= 8 and em.max() <= 40,
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
    all_pass &= check("Revenue-COGS correlation > 0.70",
                       corr > 0.70, f"r={corr:.4f}")

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
                       ocf_negative <= 8, f"{ocf_negative}/72 negative months")

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

    print("\n--- Engine output integrity (reconciliation, identities, finiteness) ---")
    import json
    import re
    import math

    fb_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                           "src", "projects", "command-center", "fallbackData.js")
    with open(fb_path) as f:
        fb = json.loads(re.search(r"export const FALLBACK_DATA = (\{.*\})\s*$", f.read(), re.S).group(1))
    s, w, wc, pivot = fb["summary"], fb["cashflow_waterfall"], fb["working_capital"], fb["pnl_by_division"]

    all_pass &= check("Cash-flow waterfall reconciles (operating + investing + financing == net)",
                      abs((w["operating"] + w["investing"] + w["financing"]) - w["net"]) < 1.0,
                      f"O+I+F ${w['operating'] + w['investing'] + w['financing']:,.0f} vs net ${w['net']:,.0f}")

    all_pass &= check("Free cash flow == sum of its monthly sparkline",
                      abs(s["free_cash_flow"] - sum(s["fcf_sparkline"])) < 1.0)

    rev_recon = all(
        abs(sum(v for k, v in row.items() if k != "month" and isinstance(v, (int, float)))
            - s["revenue_sparkline"][i]) < 1.0
        for i, row in enumerate(pivot)
    )
    all_pass &= check("Per-month division revenues sum to the company revenue sparkline", rev_recon)

    ccc_max_diff = max(abs(r["ccc"] - (r["dso"] + r["dio"] - r["dpo"])) for r in wc)
    all_pass &= check("CCC equals its displayed identity DSO + DIO - DPO (every month)",
                      ccc_max_diff < 0.05, f"max |ccc-(dso+dio-dpo)| = {ccc_max_diff:.4f} days")

    # Headline CCC must be AR/COGS-weighted across divisions, not a naive cross-division mean
    # (which understates the company figure ~19%). Recompute both from clean data: the shipped
    # figure must track the weighted company CCC and be clearly distinct from the simple mean.
    _wc = wc_clean.copy()
    _wc["month"] = pd.to_datetime(_wc["date"]).dt.strftime("%Y-%m")
    _pn = pnl_clean.copy()
    _pn["month"] = pd.to_datetime(_pn["date"]).dt.strftime("%Y-%m")
    mw = _wc.merge(_pn[["division", "month", "revenue", "cogs"]], on=["division", "month"], how="left")
    w_dso = (mw["dso"] * mw["revenue"]).sum() / mw["revenue"].sum()
    w_dio = (mw["dio"] * mw["cogs"]).sum() / mw["cogs"].sum()
    w_dpo = (mw["dpo"] * mw["cogs"]).sum() / mw["cogs"].sum()
    weighted_ccc = w_dso + w_dio - w_dpo
    simple_ccc = (mw.groupby("month")[["dso", "dio", "dpo"]].mean()
                  .pipe(lambda t: (t["dso"] + t["dio"] - t["dpo"]).mean()))
    all_pass &= check("Headline CCC is AR/COGS-weighted across divisions (not the naive mean)",
                      abs(s["ccc"] - weighted_ccc) < 0.6 and abs(s["ccc"] - simple_ccc) > 1.0,
                      f"shipped {s['ccc']} vs weighted {weighted_ccc:.1f} vs simple-mean {simple_ccc:.1f}")

    all_pass &= check("EBITDA margin == ebitda / revenue",
                      abs(s["ebitda_margin"] - round(s["ebitda"] / s["total_revenue"] * 100, 1)) < 0.11,
                      f"reported {s['ebitda_margin']}% vs {s['ebitda'] / s['total_revenue'] * 100:.1f}%")

    nums = [s["total_revenue"], s["ebitda"], s["ebitda_margin"], s["free_cash_flow"], s["ccc"]]
    all_pass &= check("No NaN/Infinity in headline summary metrics",
                      all(isinstance(x, (int, float)) and math.isfinite(x) for x in nums))

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
