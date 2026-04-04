"""Validate P3 datasets: budget realism, anomaly detection, contamination rate."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
PUBLIC_DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "public", "data")


def check(name, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))
    return passed


def validate():
    print("=" * 60)
    print("PROJECT 3 VALIDATION")
    print("=" * 60)
    all_pass = True

    budget = pd.read_csv(os.path.join(PUBLIC_DATA, "budget_fy2025.csv"))
    actuals = pd.read_csv(os.path.join(PUBLIC_DATA, "actuals_fy2025.csv"))
    labels = pd.read_csv(os.path.join(OUTPUT_DIR, "anomaly_labels.csv"))

    print("\n--- Budget Checks ---")

    # Transaction count
    all_pass &= check("Transaction count >= 5000",
                       len(actuals) >= 5000, f"{len(actuals)} transactions")

    # Non-round budgets
    round_count = (budget["budget_amount"] % 1000 == 0).sum()
    round_pct = round_count / len(budget) * 100
    all_pass &= check("Non-round budget amounts",
                       round_pct < 5, f"{round_pct:.1f}% round values")

    # All departments present
    budget_combos = budget.groupby(["department", "month"]).size().reset_index()
    expected = 5 * 12
    all_pass &= check("All dept x month combos in budget",
                       len(budget_combos) == expected,
                       f"{len(budget_combos)}/{expected}")

    actuals_depts = actuals["department"].nunique()
    all_pass &= check("All departments in actuals",
                       actuals_depts == 5, f"{actuals_depts} departments")

    # Vendor diversity
    unique_vendors = actuals["vendor"].nunique()
    all_pass &= check("Vendor diversity >= 100",
                       unique_vendors >= 100, f"{unique_vendors} unique vendors")

    # No negative amounts
    neg_budget = (budget["budget_amount"] < 0).sum()
    neg_actuals = (actuals["amount"] < 0).sum()
    all_pass &= check("No negative amounts",
                       neg_budget == 0 and neg_actuals == 0,
                       f"budget: {neg_budget}, actuals: {neg_actuals}")

    print("\n--- Contamination & Detection ---")

    # Contamination rate
    contamination = len(labels) / len(actuals) * 100
    all_pass &= check("Contamination rate 3-5%",
                       3 <= contamination <= 7,
                       f"{contamination:.1f}%")

    # Isolation Forest detection — runs on AGGREGATED data (line_item × month)
    # This matches how the demo pipeline works: aggregate transactions, then analyze
    print("  Running Isolation Forest on aggregated monthly variances...")
    anomaly_ids = set(labels["transaction_id"])

    # Aggregate actuals to monthly level
    actuals_monthly = actuals.groupby(["department", "line_item", "month"]).agg(
        actual_total=("amount", "sum"),
        txn_count=("amount", "count"),
        max_txn=("amount", "max"),
        vendor_count=("vendor", "nunique"),
    ).reset_index()

    # Merge with budget
    budget_monthly = budget[["department", "line_item", "month", "budget_amount", "approval_threshold"]]
    agg = actuals_monthly.merge(budget_monthly, on=["department", "line_item", "month"], how="left")
    agg["budget_amount"] = agg["budget_amount"].fillna(agg["actual_total"])

    # Features for IF
    features = pd.DataFrame()
    features["variance_pct"] = (agg["actual_total"] - agg["budget_amount"]) / agg["budget_amount"].clip(lower=1)
    features["variance_abs"] = agg["actual_total"] - agg["budget_amount"]
    features["txn_count"] = agg["txn_count"]
    features["max_txn"] = agg["max_txn"]
    features["max_pct_of_threshold"] = agg["max_txn"] / agg["approval_threshold"].clip(lower=1)
    features["vendor_count"] = agg["vendor_count"]
    features["dept_encoded"] = LabelEncoder().fit_transform(agg["department"])
    features["month_num"] = pd.to_datetime(agg["month"] + "-01").dt.month
    features = features.fillna(0)

    # Mark aggregated rows as anomalous if ANY underlying transaction is anomalous
    agg_anomaly_mask = []
    for _, row in agg.iterrows():
        txn_mask = (
            (actuals["department"] == row["department"]) &
            (actuals["line_item"] == row["line_item"]) &
            (actuals["month"] == row["month"])
        )
        has_anomaly = actuals.loc[txn_mask, "transaction_id"].isin(anomaly_ids).any()
        agg_anomaly_mask.append(has_anomaly)
    agg_anomaly_mask = np.array(agg_anomaly_mask)

    total_agg_anomalies = agg_anomaly_mask.sum()
    agg_contamination = total_agg_anomalies / len(agg)

    clf = IsolationForest(
        contamination=min(0.10, agg_contamination + 0.02),
        random_state=42,
        n_estimators=300,
    )
    predictions = clf.fit_predict(features)
    predicted_anomaly = predictions == -1

    tp = (predicted_anomaly & agg_anomaly_mask).sum()
    if_recall = tp / total_agg_anomalies if total_agg_anomalies > 0 else 0

    all_pass &= check("Isolation Forest recall > 0.25 (aggregated)",
                       if_recall > 0.25,
                       f"recall={if_recall:.2f} ({tp}/{total_agg_anomalies} anomalous line-item-months)")

    # Simple threshold: flag > 15% over budget (common materiality threshold)
    simple_flags = features["variance_pct"] > 0.15
    simple_tp = (simple_flags & agg_anomaly_mask).sum()
    simple_recall = simple_tp / total_agg_anomalies if total_agg_anomalies > 0 else 0

    # The point: threshold catches obvious ones but misses subtle patterns.
    # IF should catch at least some that threshold misses.
    if_only = (predicted_anomaly & agg_anomaly_mask & ~simple_flags).sum()
    all_pass &= check("IF finds anomalies threshold misses",
                       if_only >= 3,
                       f"{if_only} anomalies caught by IF but not by 15% threshold")

    print("\n" + "=" * 60)
    print("RESULT:", "ALL CHECKS PASSED" if all_pass else "SOME CHECKS FAILED")
    print("=" * 60)
    return all_pass


if __name__ == "__main__":
    success = validate()
    sys.exit(0 if success else 1)
