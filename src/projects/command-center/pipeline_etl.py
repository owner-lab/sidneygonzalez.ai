"""
Executive Command Center — ETL Pipeline
Meridian Technologies Corporate Financial Data

This pipeline runs live in your browser via Pyodide.
The same code you see here is executing right now.
"""

import pandas as pd
import numpy as np

# ═══════════════════════════════════════════════════════════════
# STAGE 1: INGEST
# ═══════════════════════════════════════════════════════════════

# Load 3 raw CSVs — each has a different date format
pnl = pd.read_csv('/data/corporate_pnl_raw.csv')
cf = pd.read_csv('/data/corporate_cashflow_raw.csv')
wc = pd.read_csv('/data/corporate_working_capital_raw.csv')

# Parse dates (each file uses a different format — this is the mess)
pnl['date'] = pd.to_datetime(pnl['date'], format='mixed', dayfirst=False)
cf['date'] = pd.to_datetime(cf['date'], format='mixed', dayfirst=False)
wc['date'] = pd.to_datetime(wc['date'], format='mixed', dayfirst=True)

raw_counts = {'pnl': len(pnl), 'cf': len(cf), 'wc': len(wc)}

# ═══════════════════════════════════════════════════════════════
# STAGE 2: VALIDATE
# ═══════════════════════════════════════════════════════════════

# Capture raw sample before cleaning (for "See Raw Data" toggle)
raw_sample = pnl.head(5).copy()
raw_sample['date'] = raw_sample['date'].dt.strftime('%Y-%m-%d')
raw_sample = raw_sample.to_dict('records')

# Count nulls across all files
nulls_found = int(
    pnl.isnull().sum().sum()
    + cf.isnull().sum().sum()
    + wc.isnull().sum().sum()
)

# Count unique division name variants before normalization
division_variants = int(pnl['division'].nunique())

# Flag duplicates
pnl_dupes = int(pnl.duplicated().sum())
cf_dupes = int(cf.duplicated().sum())
wc_dupes = int(wc.duplicated().sum())

# ═══════════════════════════════════════════════════════════════
# STAGE 3: CLEAN
# ═══════════════════════════════════════════════════════════════

# Division name normalization: 11 variants → 3 canonical names
division_map = {
    'Division A': 'Enterprise Software',
    'Div A': 'Enterprise Software',
    'div_a': 'Enterprise Software',
    'Division B': 'Professional Services',
    'Div B': 'Professional Services',
    'div_b': 'Professional Services',
    'Division C': 'Cloud Infrastructure',
    'Div C': 'Cloud Infrastructure',
    'div_c': 'Cloud Infrastructure',
}

for df in [pnl, cf, wc]:
    df['division'] = df['division'].map(lambda x: division_map.get(x, x))

# Remove exact duplicates
dupes_before = len(pnl) + len(cf) + len(wc)
pnl = pnl.drop_duplicates()
cf = cf.drop_duplicates()
wc = wc.drop_duplicates()
duplicates_removed = int(dupes_before - (len(pnl) + len(cf) + len(wc)))

# Fill missing values: forward-fill within each division, then back-fill
# Using df.ffill() — NOT deprecated fillna(method='ffill')
for df in [pnl, cf, wc]:
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    for col in numeric_cols:
        df[col] = df.groupby('division')[col].transform(
            lambda x: x.ffill().bfill()
        )

# Sort by date
pnl = pnl.sort_values(['date', 'division']).reset_index(drop=True)
cf = cf.sort_values(['date', 'division']).reset_index(drop=True)
wc = wc.sort_values(['date', 'division']).reset_index(drop=True)

# Capture clean sample
clean_sample = pnl.head(5).copy()
clean_sample['date'] = clean_sample['date'].dt.strftime('%Y-%m-%d')
clean_sample = clean_sample.to_dict('records')

# ═══════════════════════════════════════════════════════════════
# STAGE 4: TRANSFORM
# ═══════════════════════════════════════════════════════════════

# Add month key for grouping
pnl['month'] = pnl['date'].dt.strftime('%Y-%m')
cf['month'] = cf['date'].dt.strftime('%Y-%m')
wc['month'] = wc['date'].dt.strftime('%Y-%m')

# --- P&L by division (for grouped bar chart) ---
pnl_pivot = pnl.pivot_table(
    index='month', columns='division', values='revenue', aggfunc='sum'
).reset_index()
pnl_by_division = pnl_pivot.to_dict('records')

# --- Monthly company-wide aggregates (for sparklines) ---
monthly_rev = pnl.groupby('month')['revenue'].sum()
monthly_ebitda = pnl.groupby('month')['ebitda'].sum()

# --- Free Cash Flow = Operating CF + CapEx (capex is negative) ---
cf_monthly = cf.groupby('month').agg({
    'operating_cash_flow': 'sum',
    'capex': 'sum',
    'investing_cash_flow': 'sum',
    'financing_cash_flow': 'sum',
    'net_cash_flow': 'sum',
}).reset_index()
cf_monthly['fcf'] = cf_monthly['operating_cash_flow'] + cf_monthly['capex']

# --- Working capital metrics ---
wc_monthly = wc.groupby('month').agg({
    'dso': 'mean',
    'dpo': 'mean',
    'dio': 'mean',
    'cash_conversion_cycle': 'mean',
}).reset_index()
wc_monthly.columns = ['month', 'dso', 'dpo', 'dio', 'ccc']

# --- Summary KPIs ---
total_revenue = pnl['revenue'].sum()
total_ebitda = pnl['ebitda'].sum()
ebitda_margin = (total_ebitda / total_revenue * 100) if total_revenue else 0
total_fcf = cf_monthly['fcf'].sum()
avg_ccc = wc_monthly['ccc'].mean()

# --- Cash flow waterfall (totals) ---
total_operating = cf['operating_cash_flow'].sum()
total_investing = cf['investing_cash_flow'].sum()
total_financing = cf['financing_cash_flow'].sum()
total_net = cf['net_cash_flow'].sum()

# --- Per-division P&L detail (for client-side filtering) ---
div_detail = []
for month in pnl['month'].unique():
    month_data = pnl[pnl['month'] == month]
    row = {'month': month}
    for div in ['Enterprise Software', 'Professional Services', 'Cloud Infrastructure']:
        div_data = month_data[month_data['division'] == div]
        if len(div_data) > 0:
            d = div_data.iloc[0]
            row[f'{div}_revenue'] = d['revenue']
            row[f'{div}_ebitda'] = d['ebitda']
            row[f'{div}_gross_margin'] = d['gross_margin_pct']
    div_detail.append(row)

# ═══════════════════════════════════════════════════════════════
# STAGE 5: OUTPUT
# ═══════════════════════════════════════════════════════════════

def to_json_safe(obj):
    """Recursively convert numpy types to Python natives for Pyodide toJs()."""
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
    elif pd.isna(obj):
        return None
    return obj

result = to_json_safe({
    'summary': {
        'total_revenue': total_revenue,
        'ebitda': total_ebitda,
        'ebitda_margin': round(ebitda_margin, 1),
        'free_cash_flow': total_fcf,
        'ccc': round(avg_ccc, 1),
        'revenue_sparkline': monthly_rev.values.tolist(),
        'ebitda_sparkline': monthly_ebitda.values.tolist(),
        'fcf_sparkline': cf_monthly['fcf'].values.tolist(),
        'ccc_sparkline': wc_monthly['ccc'].values.tolist(),
    },
    'pnl_by_division': pnl_by_division,
    'div_detail': div_detail,
    'cashflow_waterfall': {
        'operating': total_operating,
        'investing': total_investing,
        'financing': total_financing,
        'net': total_net,
    },
    'working_capital': wc_monthly.to_dict('records'),
    'validation_report': {
        'rows_loaded': raw_counts['pnl'] + raw_counts['cf'] + raw_counts['wc'],
        'nulls_found': nulls_found,
        'duplicates_removed': duplicates_removed,
        'division_variants_normalized': division_variants,
    },
    'raw_sample': raw_sample,
    'clean_sample': clean_sample,
})
