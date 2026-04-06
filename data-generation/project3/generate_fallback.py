"""Generate fallbackData.js from the variance pipeline output.

Run once after data generation to create static fallback data
for the Variance & Anomaly Engine. Output is committed to git.

Requires: pandas, numpy, scikit-learn
"""

import os
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUBLIC_DATA = os.path.join(ROOT, "public", "data")

# Load data
budget = pd.read_csv(os.path.join(PUBLIC_DATA, "budget_fy2025.csv"))
actuals = pd.read_csv(os.path.join(PUBLIC_DATA, "actuals_fy2025.csv"))

# --- Stage 2: Aggregate ---
dup_flags = set()
for (dept, item, month), grp in actuals.groupby(["department", "line_item", "month"]):
    vendors = grp.groupby("vendor")["amount"].agg(["count", "sum", "std"])
    for vendor, row in vendors.iterrows():
        if row["count"] >= 2 and (pd.isna(row["std"]) or row["std"] < 1.0):
            dup_flags.add((dept, item, month))

agg = actuals.groupby(["department", "category", "line_item", "month"]).agg(
    actual=("amount", "sum"),
    txn_count=("amount", "count"),
    max_txn=("amount", "max"),
    vendor_count=("vendor", "nunique"),
).reset_index()

agg["has_duplicate_flag"] = agg.apply(
    lambda r: (r["department"], r["line_item"], r["month"]) in dup_flags, axis=1
)

transactions_analyzed = len(actuals)

# --- Stage 3: Variance ---
merged = pd.merge(budget, agg, on=["department", "category", "line_item", "month"], how="left")
merged["actual"] = merged["actual"].fillna(0)
merged["txn_count"] = merged["txn_count"].fillna(0).astype(int)
merged["max_txn"] = merged["max_txn"].fillna(0)
merged["vendor_count"] = merged["vendor_count"].fillna(0).astype(int)
merged["has_duplicate_flag"] = merged["has_duplicate_flag"].fillna(False)
merged["variance_abs"] = merged["actual"] - merged["budget_amount"]
merged["variance_pct"] = np.where(
    merged["budget_amount"] != 0,
    (merged["variance_abs"] / merged["budget_amount"]) * 100,
    0,
)
merged["budget_utilization"] = np.where(
    merged["budget_amount"] != 0, merged["actual"] / merged["budget_amount"], 0
)
merged = merged.sort_values(["department", "line_item", "month"])
merged["cumulative_variance"] = merged.groupby(["department", "line_item"])["variance_abs"].cumsum()
merged["month_num"] = merged["month"].str.split("-").str[1].astype(int)

# --- Stage 4: Anomaly Detection ---
features = merged[["variance_pct", "budget_utilization", "cumulative_variance", "month_num"]].copy()
features["abs_variance"] = merged["variance_abs"].abs()
features = features.fillna(0)

iso = IsolationForest(contamination=0.05, random_state=42, n_estimators=100)
merged["anomaly_flag"] = iso.fit_predict(features) == -1

thresholds = dict(zip(budget["department"], budget["approval_threshold"]))

_MONTH_NAMES = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"]
def _fmt_month(m):
    y, mo = m.split("-")
    return f"{_MONTH_NAMES[int(mo)-1]} {y}"

anomaly_rows = []
for idx, row in merged[merged["anomaly_flag"]].iterrows():
    dept, item, month = row["department"], row["line_item"], row["month"]
    month_label = _fmt_month(month)
    var_pct, actual, budget_amt = row["variance_pct"], row["actual"], row["budget_amount"]
    var_abs = row["variance_abs"]

    item_hist = merged[(merged["department"] == dept) & (merged["line_item"] == item)].sort_values("month")
    ratios = item_hist["budget_utilization"].values

    threshold = thresholds.get(dept, 0)
    max_txn = row.get("max_txn", 0)
    if pd.isna(max_txn):
        max_txn = 0

    if threshold and max_txn and 0.92 * threshold <= max_txn <= 0.99 * threshold:
        anomaly_rows.append({
            "department": dept, "line_item": item, "month": month,
            "budget": round(float(budget_amt), 2), "actual": round(float(actual), 2),
            "variance_abs": round(float(var_abs), 2), "variance_pct": round(float(var_pct), 1),
            "type": "threshold_cluster", "severity": "medium",
            "explanation": f"Threshold clustering: {item} has a transaction at ${max_txn:,.0f} — {max_txn/threshold*100:.0f}% of {dept}'s ${threshold:,.0f} approval limit.",
        })
        continue

    if row.get("has_duplicate_flag"):
        anomaly_rows.append({
            "department": dept, "line_item": item, "month": month,
            "budget": round(float(budget_amt), 2), "actual": round(float(actual), 2),
            "variance_abs": round(float(var_abs), 2), "variance_pct": round(float(var_pct), 1),
            "type": "duplicate_payment", "severity": "high",
            "explanation": f"Potential duplicate: {item} in {month_label} shows transactions with matching vendor and near-identical amounts. Total excess: ${abs(var_abs):,.0f}.",
        })
        continue

    if len(ratios) >= 4:
        diffs = [ratios[i + 1] - ratios[i] for i in range(len(ratios) - 1)]
        consecutive = 0
        max_consecutive = 0
        for d in diffs:
            if d > 0.02:
                consecutive += 1
                max_consecutive = max(max_consecutive, consecutive)
            else:
                consecutive = 0
        if max_consecutive >= 3:
            monthly_drift = float(np.mean([d for d in diffs if d > 0]) * 100)
            anomaly_rows.append({
                "department": dept, "line_item": item, "month": month,
                "budget": round(float(budget_amt), 2), "actual": round(float(actual), 2),
                "variance_abs": round(float(var_abs), 2), "variance_pct": round(float(var_pct), 1),
                "type": "trending_overspend", "severity": "high",
                "explanation": f"Trending overspend: {item} costs drifting +{monthly_drift:.0f}%/month. Cumulative excess: ${abs(float(row['cumulative_variance'])):,.0f}.",
            })
            continue

    month_num = int(row["month_num"])
    if month_num in [10, 11, 12, 1, 2] and 40 < abs(var_pct) <= 200:
        anomaly_rows.append({
            "department": dept, "line_item": item, "month": month,
            "budget": round(float(budget_amt), 2), "actual": round(float(actual), 2),
            "variance_abs": round(float(var_abs), 2), "variance_pct": round(float(var_pct), 1),
            "type": "seasonal_spike", "severity": "medium",
            "explanation": f"Seasonal spike: {item} in {dept} exceeded budget by {abs(var_pct):.0f}% in {month_label}.",
        })
        continue

    anomaly_rows.append({
        "department": dept, "line_item": item, "month": month,
        "budget": round(float(budget_amt), 2), "actual": round(float(actual), 2),
        "variance_abs": round(float(var_abs), 2), "variance_pct": round(float(var_pct), 1),
        "type": "one_time_event", "severity": "low" if abs(var_pct) < 100 else "high",
        "explanation": f"Unusual activity: {item} in {dept} was ${abs(var_abs):,.0f} {'over' if var_pct > 0 else 'under'} budget ({abs(var_pct):.0f}%) in {month_label}.",
    })

# --- Stage 5: Output ---
months = sorted(merged["month"].unique())
month_labels = []
month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
for m in months:
    y, mo = m.split("-")
    month_labels.append(f"{month_names[int(mo)-1]} {y[2:]}")

heatmap_data = []
for dept in sorted(merged["department"].unique()):
    dept_data = merged[merged["department"] == dept]
    cells = []
    for m, label in zip(months, month_labels):
        month_data = dept_data[dept_data["month"] == m]
        var_pct = float(month_data["variance_pct"].mean()) if len(month_data) > 0 else 0
        has_anomaly = bool(month_data["anomaly_flag"].any()) if len(month_data) > 0 else False
        cells.append({"x": label, "y": round(var_pct, 1), "hasAnomaly": has_anomaly})
    heatmap_data.append({"id": dept, "data": cells})

by_department = []
for dept in sorted(merged["department"].unique()):
    dept_data = merged[merged["department"] == dept]
    by_department.append({
        "department": dept,
        "budget": round(float(dept_data["budget_amount"].sum()), 2),
        "actual": round(float(dept_data["actual"].sum()), 2),
    })

time_series = []
for m, label in zip(months, month_labels):
    month_data = merged[merged["month"] == m]
    time_series.append({
        "month": label,
        "budget": round(float(month_data["budget_amount"].sum()), 2),
        "actual": round(float(month_data["actual"].sum()), 2),
        "anomaly_count": int(month_data["anomaly_flag"].sum()),
    })

total_budget = float(merged["budget_amount"].sum())
total_actual = float(merged["actual"].sum())
total_variance = total_actual - total_budget
total_variance_pct = round((total_variance / total_budget * 100) if total_budget else 0, 1)

dept_variances = merged.groupby("department")["variance_abs"].sum()
highest_risk = dept_variances.abs().idxmax()
highest_risk_pct = round(float(dept_variances[highest_risk] / merged[merged["department"] == highest_risk]["budget_amount"].sum() * 100), 1)

variance_sparkline = []
for m in months:
    month_data = merged[merged["month"] == m]
    variance_sparkline.append(round(float(month_data["variance_abs"].sum()), 2))

anomaly_rows.sort(key=lambda a: abs(a["variance_abs"]), reverse=True)

fallback = {
    "summary": {
        "total_budget": total_budget,
        "total_actual": total_actual,
        "total_variance": total_variance,
        "total_variance_pct": total_variance_pct,
        "anomaly_count": len(anomaly_rows),
        "transactions_analyzed": transactions_analyzed,
        "highest_risk_department": highest_risk,
        "highest_risk_pct": highest_risk_pct,
        "variance_sparkline": variance_sparkline,
    },
    "heatmap": heatmap_data,
    "by_department": by_department,
    "time_series": time_series,
    "anomalies": anomaly_rows,
    "raw_counts": {
        "budget_rows": len(budget),
        "actual_transactions": len(actuals),
        "departments": int(budget["department"].nunique()),
        "vendors": int(actuals["vendor"].nunique()),
    },
}

output_path = os.path.join(ROOT, "src", "projects", "variance-engine", "fallbackData.js")
os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, "w") as f:
    f.write("// Auto-generated by data-generation/project3/generate_fallback.py\n")
    f.write("// Do not edit manually — regenerate with: python generate_fallback.py\n\n")
    f.write("export const FALLBACK_DATA = ")
    json.dump(fallback, f, indent=2)
    f.write("\n")

print(f"Fallback data generated: {os.path.getsize(output_path):,} bytes -> {output_path}")
print(f"  Budget rows: {len(budget)}, Actual transactions: {len(actuals)}")
print(f"  Anomalies detected: {len(anomaly_rows)}")
print(f"  Total variance: ${total_variance:,.0f} ({total_variance_pct}%)")
