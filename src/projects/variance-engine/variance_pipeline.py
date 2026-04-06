"""
Variance & Anomaly Engine — Budget vs Actual Analysis Pipeline
Meridian Technologies FY2025 Financial Data

This pipeline runs live in your browser via Pyodide.
It aggregates 5,000+ transactions, computes variance, and
detects anomalies using an Isolation Forest model.
"""

import pandas as pd
import numpy as np

# ═══════════════════════════════════════════════════════════════
# STAGE 1: INGEST
# ═══════════════════════════════════════════════════════════════

import micropip
await micropip.install("scikit-learn")
from sklearn.ensemble import IsolationForest

budget = pd.read_csv('/data/budget_fy2025.csv')
actuals = pd.read_csv('/data/actuals_fy2025.csv')

raw_counts = {
    'budget_rows': len(budget),
    'actual_transactions': len(actuals),
    'departments': budget['department'].nunique(),
    'vendors': actuals['vendor'].nunique(),
}

# ═══════════════════════════════════════════════════════════════
# STAGE 2: AGGREGATE
# ═══════════════════════════════════════════════════════════════

# Pre-aggregation: scan for duplicate payments (same vendor + near-identical amount)
dup_flags = set()
for (dept, item, month), grp in actuals.groupby(['department', 'line_item', 'month']):
    vendors = grp.groupby('vendor')['amount'].agg(['count', 'sum', 'std'])
    for vendor, row in vendors.iterrows():
        if row['count'] >= 2 and (pd.isna(row['std']) or row['std'] < 1.0):
            dup_flags.add((dept, item, month))

# Aggregate actuals to monthly line-item level
agg = actuals.groupby(['department', 'category', 'line_item', 'month']).agg(
    actual=('amount', 'sum'),
    txn_count=('amount', 'count'),
    max_txn=('amount', 'max'),
    vendor_count=('vendor', 'nunique'),
).reset_index()

agg['has_duplicate_flag'] = agg.apply(
    lambda r: (r['department'], r['line_item'], r['month']) in dup_flags, axis=1
)

transactions_analyzed = len(actuals)

# ═══════════════════════════════════════════════════════════════
# STAGE 3: VARIANCE
# ═══════════════════════════════════════════════════════════════

# Left join budget to aggregated actuals
merged = pd.merge(
    budget, agg,
    on=['department', 'category', 'line_item', 'month'],
    how='left',
)
merged['actual'] = merged['actual'].fillna(0)
merged['txn_count'] = merged['txn_count'].fillna(0).astype(int)
merged['max_txn'] = merged['max_txn'].fillna(0)
merged['vendor_count'] = merged['vendor_count'].fillna(0).astype(int)
merged['has_duplicate_flag'] = merged['has_duplicate_flag'].fillna(False)

# Variance calculations
merged['variance_abs'] = merged['actual'] - merged['budget_amount']
merged['variance_pct'] = np.where(
    merged['budget_amount'] != 0,
    (merged['variance_abs'] / merged['budget_amount']) * 100,
    0
)
merged['budget_utilization'] = np.where(
    merged['budget_amount'] != 0,
    merged['actual'] / merged['budget_amount'],
    0
)

# Cumulative variance per line item (track drift over time)
merged = merged.sort_values(['department', 'line_item', 'month'])
merged['cumulative_variance'] = merged.groupby(
    ['department', 'line_item']
)['variance_abs'].cumsum()

# Month number for seasonality features
merged['month_num'] = merged['month'].str.split('-').str[1].astype(int)

# ═══════════════════════════════════════════════════════════════
# STAGE 4: ANOMALY DETECTION
# ═══════════════════════════════════════════════════════════════

# Feature matrix for Isolation Forest
features = merged[[
    'variance_pct', 'budget_utilization', 'cumulative_variance', 'month_num'
]].copy()
features['abs_variance'] = merged['variance_abs'].abs()
features = features.fillna(0)

# Fit Isolation Forest
iso = IsolationForest(contamination=0.05, random_state=42, n_estimators=100)
merged['anomaly_flag'] = iso.fit_predict(features) == -1

# Approval thresholds for threshold-clustering detection
thresholds = dict(zip(budget['department'], budget['approval_threshold']))

# Human-readable month formatter
_MONTH_NAMES = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']
def _fmt_month(m):
    y, mo = m.split('-')
    return f"{_MONTH_NAMES[int(mo)-1]} {y}"

# Categorize anomalies with human-readable explanations
anomaly_rows = []
for idx, row in merged[merged['anomaly_flag']].iterrows():
    dept = row['department']
    item = row['line_item']
    month = row['month']
    month_label = _fmt_month(month)
    var_pct = row['variance_pct']
    actual = row['actual']
    budget_amt = row['budget_amount']
    var_abs = row['variance_abs']

    # Get line item history for trend detection
    item_hist = merged[
        (merged['department'] == dept) & (merged['line_item'] == item)
    ].sort_values('month')
    ratios = item_hist['budget_utilization'].values

    # Rule 1: Threshold clustering (92-99% of approval threshold)
    threshold = thresholds.get(dept, 0)
    if threshold and row.get('max_txn') and 0.92 * threshold <= row['max_txn'] <= 0.99 * threshold:
        anomaly_rows.append({
            'department': dept, 'line_item': item, 'month': month,
            'budget': round(budget_amt, 2), 'actual': round(actual, 2),
            'variance_abs': round(var_abs, 2), 'variance_pct': round(var_pct, 1),
            'type': 'threshold_cluster',
            'severity': 'medium',
            'explanation': (
                f"Threshold clustering: {item} has a transaction at "
                f"${row['max_txn']:,.0f} — {row['max_txn']/threshold*100:.0f}% of "
                f"{dept}'s ${threshold:,.0f} approval limit. "
                f"May indicate spend splitting to avoid review."
            ),
        })
        continue

    # Rule 2: Duplicate payment flag
    if row.get('has_duplicate_flag'):
        anomaly_rows.append({
            'department': dept, 'line_item': item, 'month': month,
            'budget': round(budget_amt, 2), 'actual': round(actual, 2),
            'variance_abs': round(var_abs, 2), 'variance_pct': round(var_pct, 1),
            'type': 'duplicate_payment',
            'severity': 'high',
            'explanation': (
                f"Potential duplicate: {item} in {month_label} shows transactions with "
                f"matching vendor and near-identical amounts. "
                f"Total excess: ${abs(var_abs):,.0f}."
            ),
        })
        continue

    # Rule 3: Trending overspend (3+ consecutive months increasing)
    if len(ratios) >= 4:
        diffs = [ratios[i+1] - ratios[i] for i in range(len(ratios)-1)]
        consecutive = 0
        max_consecutive = 0
        for d in diffs:
            if d > 0.02:
                consecutive += 1
                max_consecutive = max(max_consecutive, consecutive)
            else:
                consecutive = 0
        if max_consecutive >= 3:
            monthly_drift = np.mean([d for d in diffs if d > 0]) * 100
            anomaly_rows.append({
                'department': dept, 'line_item': item, 'month': month,
                'budget': round(budget_amt, 2), 'actual': round(actual, 2),
                'variance_abs': round(var_abs, 2), 'variance_pct': round(var_pct, 1),
                'type': 'trending_overspend',
                'severity': 'high',
                'explanation': (
                    f"Trending overspend: {item} costs drifting "
                    f"+{monthly_drift:.0f}%/month. "
                    f"Cumulative excess: ${abs(row['cumulative_variance']):,.0f}."
                ),
            })
            continue

    # Rule 4: Seasonal spike (Q4/Q1, moderate variance — not extreme one-offs)
    month_num = row['month_num']
    if month_num in [10, 11, 12, 1, 2] and 40 < abs(var_pct) <= 200:
        anomaly_rows.append({
            'department': dept, 'line_item': item, 'month': month,
            'budget': round(budget_amt, 2), 'actual': round(actual, 2),
            'variance_abs': round(var_abs, 2), 'variance_pct': round(var_pct, 1),
            'type': 'seasonal_spike',
            'severity': 'medium',
            'explanation': (
                f"Seasonal spike: {item} in {dept} exceeded budget "
                f"by {abs(var_pct):.0f}% in {month_label}. "
                f"Q4/Q1 patterns suggest year-end procurement surge."
            ),
        })
        continue

    # Rule 5: One-time event (default — isolated spike or extreme variance)
    anomaly_rows.append({
        'department': dept, 'line_item': item, 'month': month,
        'budget': round(budget_amt, 2), 'actual': round(actual, 2),
        'variance_abs': round(var_abs, 2), 'variance_pct': round(var_pct, 1),
        'type': 'one_time_event',
        'severity': 'low' if abs(var_pct) < 100 else 'high',
        'explanation': (
            f"Unusual activity: {item} in {dept} was "
            f"${abs(var_abs):,.0f} {'over' if var_pct > 0 else 'under'} "
            f"budget ({abs(var_pct):.0f}%) in {month_label}."
        ),
    })

# ═══════════════════════════════════════════════════════════════
# STAGE 5: OUTPUT
# ═══════════════════════════════════════════════════════════════

def to_json_safe(obj):
    """Recursively convert numpy/pandas types to Python natives."""
    if isinstance(obj, dict):
        return {str(k): to_json_safe(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [to_json_safe(v) for v in obj]
    elif isinstance(obj, (np.integer,)):
        return int(obj)
    elif isinstance(obj, (np.floating,)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (pd.Timestamp,)):
        return str(obj)[:10]
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif pd.isna(obj):
        return None
    return obj

# Heatmap: department × month variance_pct
months = sorted(merged['month'].unique())
month_labels = []
for m in months:
    y, mo = m.split('-')
    month_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    month_labels.append(f"{month_names[int(mo)-1]} {y[2:]}")

heatmap_data = []
for dept in sorted(merged['department'].unique()):
    dept_data = merged[merged['department'] == dept]
    cells = []
    for m, label in zip(months, month_labels):
        month_data = dept_data[dept_data['month'] == m]
        var_pct = month_data['variance_pct'].mean() if len(month_data) > 0 else 0
        has_anomaly = month_data['anomaly_flag'].any() if len(month_data) > 0 else False
        cells.append({'x': label, 'y': round(var_pct, 1), 'hasAnomaly': bool(has_anomaly)})
    heatmap_data.append({'id': dept, 'data': cells})

# By-department summary for bar chart
by_department = []
for dept in sorted(merged['department'].unique()):
    dept_data = merged[merged['department'] == dept]
    by_department.append({
        'department': dept,
        'budget': round(dept_data['budget_amount'].sum(), 2),
        'actual': round(dept_data['actual'].sum(), 2),
    })

# Time series: monthly totals
time_series = []
for m, label in zip(months, month_labels):
    month_data = merged[merged['month'] == m]
    anomaly_count = int(month_data['anomaly_flag'].sum())
    time_series.append({
        'month': label,
        'budget': round(month_data['budget_amount'].sum(), 2),
        'actual': round(month_data['actual'].sum(), 2),
        'anomaly_count': anomaly_count,
    })

# Summary metrics
total_budget = merged['budget_amount'].sum()
total_actual = merged['actual'].sum()
total_variance = total_actual - total_budget
total_variance_pct = (total_variance / total_budget * 100) if total_budget else 0

# Highest-risk department by absolute variance
dept_variances = merged.groupby('department')['variance_abs'].sum()
highest_risk = dept_variances.abs().idxmax()
highest_risk_pct = (dept_variances[highest_risk] / merged[merged['department'] == highest_risk]['budget_amount'].sum()) * 100

# Variance sparkline (monthly total variance)
variance_sparkline = []
for m in months:
    month_data = merged[merged['month'] == m]
    variance_sparkline.append(round(month_data['variance_abs'].sum(), 2))

# Sort anomalies by absolute variance (largest first)
anomaly_rows.sort(key=lambda a: abs(a['variance_abs']), reverse=True)

result = to_json_safe({
    'summary': {
        'total_budget': total_budget,
        'total_actual': total_actual,
        'total_variance': total_variance,
        'total_variance_pct': round(total_variance_pct, 1),
        'anomaly_count': len(anomaly_rows),
        'transactions_analyzed': transactions_analyzed,
        'highest_risk_department': highest_risk,
        'highest_risk_pct': round(highest_risk_pct, 1),
        'variance_sparkline': variance_sparkline,
    },
    'heatmap': heatmap_data,
    'by_department': by_department,
    'time_series': time_series,
    'anomalies': anomaly_rows,
    'raw_counts': raw_counts,
})
