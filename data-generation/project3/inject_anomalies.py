"""Inject 5 types of anomalies into actuals at 3-5% contamination."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from constants import RNG, APPROVAL_THRESHOLDS

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
PUBLIC_DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "public", "data")
ACTUALS_PATH = os.path.join(OUTPUT_DIR, "actuals_fy2025_clean.csv")


def inject_anomalies():
    df = pd.read_csv(ACTUALS_PATH)
    labels = []  # (transaction_id, anomaly_type)
    n = len(df)

    # Target: 3-5% contamination = ~154-257 anomalies for ~5129 rows
    # We'll inject across 5 types

    # --- Type 1: Seasonal spikes (20-30 transactions) ---
    # Pick 3-4 line items, add extra-large transactions in Q4/Q1
    spike_items = RNG.choice(df["line_item"].unique(), size=4, replace=False)
    spike_months = ["2025-10", "2025-11", "2025-12", "2025-01", "2025-02"]
    spike_mask = df["line_item"].isin(spike_items) & df["month"].isin(spike_months)
    spike_indices = df[spike_mask].index.tolist()
    spike_selected = RNG.choice(spike_indices, size=min(25, len(spike_indices)), replace=False)
    for idx in spike_selected:
        df.at[idx, "amount"] = df.at[idx, "amount"] * RNG.uniform(1.6, 2.5)
        labels.append((df.at[idx, "transaction_id"], "seasonal_spike"))

    # --- Type 2: One-time events (10-15 transactions) ---
    # Unusual but plausible vendors per category (one-time events like
    # emergency repairs, legal settlements, expedited orders)
    ONETIME_VENDORS = {
        "Personnel": ["Robert Half International", "Kforce Staffing"],
        "Infrastructure": ["Rackspace Emergency Support", "AWS Professional Services"],
        "Software": ["Emergency License Renewal LLC", "Rapid Deploy Software Inc"],
        "Travel": ["NetJets Inc", "Wheels Up Partners"],
        "Services": ["Morrison Legal Partners", "Quinn Emanuel Trial Lawyers"],
        "Maintenance": ["Emergency Repair Services Inc", "24/7 Industrial Maintenance"],
        "Logistics": ["UPS Expedited Freight", "FedEx Priority Overnight"],
        "Facilities": ["ServiceMaster Restore", "BELFOR Property Restoration"],
        "Events": ["Last-Minute Events LLC", "Pinnacle Conference Services"],
        "Training": ["Executive Leadership Institute", "Wharton Executive Education"],
    }
    onetime_indices = RNG.choice(n, size=12, replace=False)
    for idx in onetime_indices:
        if idx in spike_selected:
            continue
        category = df.at[idx, "category"]
        vendor_pool = ONETIME_VENDORS.get(category, ["Apex Emergency Services LLC"])
        df.at[idx, "amount"] = df.at[idx, "amount"] * RNG.uniform(2.0, 5.0)
        df.at[idx, "vendor"] = RNG.choice(vendor_pool)
        labels.append((df.at[idx, "transaction_id"], "one_time_event"))

    # --- Type 3: Trending overspends (15-25 transactions) ---
    # Pick 2-3 line items, gradually increase amounts over 6+ months
    trend_items = RNG.choice(
        [li for li in df["line_item"].unique() if li not in spike_items],
        size=3, replace=False
    )
    for item in trend_items:
        item_mask = df["line_item"] == item
        item_df = df[item_mask].sort_values("month")
        months_sorted = item_df["month"].unique()
        # Start trending from month 4 onward
        for i, month in enumerate(months_sorted[3:], start=1):
            month_mask = item_mask & (df["month"] == month)
            for idx in df[month_mask].index:
                drift = 1 + (0.04 * i)  # 4% cumulative per month — by month 9, 36% over
                df.at[idx, "amount"] = df.at[idx, "amount"] * drift
                labels.append((df.at[idx, "transaction_id"], "trending_overspend"))

    # --- Type 4: Threshold clustering (20-30 transactions) ---
    for dept, threshold in APPROVAL_THRESHOLDS.items():
        dept_mask = df["department"] == dept
        dept_indices = df[dept_mask].index.tolist()
        cluster_count = RNG.integers(4, 7)
        cluster_indices = RNG.choice(dept_indices, size=min(cluster_count, len(dept_indices)), replace=False)
        for idx in cluster_indices:
            df.at[idx, "amount"] = round(threshold * RNG.uniform(0.92, 0.99), 2)
            labels.append((df.at[idx, "transaction_id"], "threshold_cluster"))

    # --- Type 5: Duplicate payments (10-15 transactions) ---
    # Real duplicates: same vendor, very similar (not exact) amount, different invoice
    # Some have minor cent differences (rounding, currency conversion, tax adjustments)
    dup_source_indices = RNG.choice(n, size=12, replace=False)
    txn_counter = n + 1
    new_rows = []
    for idx in dup_source_indices:
        source = df.iloc[idx].copy()
        txn_counter += 1
        new_txn_id = f"TXN-{txn_counter:06d}"
        source["transaction_id"] = new_txn_id
        source["invoice_id"] = f"INV-DUP-{txn_counter:05d}"
        # ~60% exact match, ~40% have small cent-level variance
        if RNG.random() > 0.6:
            cent_diff = round(RNG.uniform(-0.50, 0.50), 2)
            source["amount"] = round(source["amount"] + cent_diff, 2)
        # Slightly different payment date (1-7 days later)
        pay_dt = pd.Timestamp(source["payment_date"]) + pd.Timedelta(days=int(RNG.integers(1, 8)))
        source["payment_date"] = pay_dt.strftime("%Y-%m-%d")
        new_rows.append(source)
        labels.append((new_txn_id, "duplicate_payment"))

    if new_rows:
        df = pd.concat([df, pd.DataFrame(new_rows)], ignore_index=True)

    # Round amounts
    df["amount"] = df["amount"].round(2)

    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    # Save
    os.makedirs(PUBLIC_DATA, exist_ok=True)
    df.to_csv(os.path.join(PUBLIC_DATA, "actuals_fy2025.csv"), index=False)

    # Save labels (not shipped to public)
    labels_df = pd.DataFrame(labels, columns=["transaction_id", "anomaly_type"])
    labels_df.to_csv(os.path.join(OUTPUT_DIR, "anomaly_labels.csv"), index=False)

    # Copy budget to public
    budget = pd.read_csv(os.path.join(OUTPUT_DIR, "budget_fy2025_clean.csv"))
    budget.to_csv(os.path.join(PUBLIC_DATA, "budget_fy2025.csv"), index=False)

    contamination = len(labels) / len(df) * 100
    print(f"Anomalies injected: {len(labels)} anomalous transactions ({contamination:.1f}%)")
    print(f"  Seasonal spikes:      {sum(1 for _, t in labels if t == 'seasonal_spike')}")
    print(f"  One-time events:      {sum(1 for _, t in labels if t == 'one_time_event')}")
    print(f"  Trending overspends:  {sum(1 for _, t in labels if t == 'trending_overspend')}")
    print(f"  Threshold clusters:   {sum(1 for _, t in labels if t == 'threshold_cluster')}")
    print(f"  Duplicate payments:   {sum(1 for _, t in labels if t == 'duplicate_payment')}")
    print(f"Actuals: {len(df)} rows -> {os.path.join(PUBLIC_DATA, 'actuals_fy2025.csv')}")
    print(f"Budget:  {len(budget)} rows -> {os.path.join(PUBLIC_DATA, 'budget_fy2025.csv')}")


if __name__ == "__main__":
    inject_anomalies()
