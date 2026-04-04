# Project 1 Data: Corporate Financial Data

## What Makes Corporate P&L Data Look Real

Synthetic financial data must exhibit patterns found in real corporate reporting:

- **Seasonal revenue patterns** — Q4 spike, Q1 dip (common in B2B/enterprise sales)
- **Correlated line items** — COGS moves with revenue, not independently
- **Realistic margin bands** — Gross margin 45-65%, EBITDA 15-25%
- **Working capital timing** — Cash flow lags P&L appropriately
- **Business cycle effects** — DSO/DPO/DIO reflect collection and payment patterns

## Data Quality Issues (Deliberately Injected)

- 5-8% missing values in non-critical fields
- 3 different date formats across source files
- Division name inconsistencies ("Div A" vs "Division A" vs "div_a")
- 2-3 duplicate rows

## Scripts

- `generate_pnl.py` — P&L with seasonal patterns, inter-line correlations
- `generate_cashflow.py` — Cash flow with realistic timing
- `generate_working_capital.py` — AR/AP/Inventory with business cycle patterns
- `inject_quality_issues.py` — Deliberately corrupt data
- `validate_realism.py` — Sanity checks: margins, ratios, magnitudes

## Output

- `corporate_pnl_raw.csv` — 24 months, 3 divisions
- `corporate_cashflow_raw.csv` — Cash flow components
- `corporate_working_capital_raw.csv` — Working capital metrics
