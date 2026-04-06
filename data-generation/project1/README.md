# Project 1 Data: Corporate Financial Data

## What Makes Corporate P&L Data Look Real

Synthetic financial data must exhibit patterns found in real corporate reporting:

- **Seasonal revenue patterns** — Q4 ~28% above Q1 (Tunguz SaaS Seasonality Analysis, public SaaS companies)
- **Revenue momentum** — AR(1) lag-1 autocorrelation 0.7-0.9 (subscription/contract carryover)
- **Correlated line items** — COGS moves with revenue (r > 0.78), not independently
- **Realistic margin bands** — Gross margin 38-72%, EBITDA 8-35% (McKinsey Rule of 40 analysis, 100+ public SaaS)
- **Growth rates** — 8-15% YoY for mid-market B2B tech (Bain B2B Software Growth research, $200-500M segment)
- **Working capital stress** — DSO spikes 5-15 days during revenue declines (JPMorgan Working Capital Index 2024; PwC Working Capital Study 2024)
- **Cash flow timing** — AR/AP changes lag P&L by 1 month; OCF positive most months

## Research Sources

| Parameter | Value | Source |
|---|---|---|
| Q4 vs Q1 seasonality | ~28% higher | Tunguz, "The Importance of Seasonality in SaaS Startups" |
| YoY growth range | 8-15% mid-market | Bain, "Ingredients of Strong Revenue Growth in B2B Software" |
| Rule of 40 median | Growth + Margin ≥ 40% | McKinsey, "SaaS and the Rule of 40" (100+ public SaaS, $100M+ rev) |
| DSO benchmark | 59 days avg (2023) | CFO Dive / Allianz survey, 45,000 listed companies |
| DSO stress spike | 5-15 days in downturns | JPMorgan Working Capital Index 2024; PwC Working Capital Study 24/25 |
| Revenue autocorrelation | 0.7-0.9 lag-1 | Subscription revenue model mechanics (contract carryover) |
| MoM revenue variance | <12% typical | Tunguz SaaS seasonality; subscription smoothing effect |

## Data Quality Issues (Deliberately Injected)

- 5-8% missing values in non-critical fields
- 3 different date formats across source files
- Division name inconsistencies ("Div A" vs "Division A" vs "div_a")
- 2-3 duplicate rows

## Scripts

- `generate_pnl.py` — P&L with AR(1) momentum, seasonal patterns, GM drift, OpEx spikes
- `generate_cashflow.py` — Cash flow derived from P&L with timing lags
- `generate_working_capital.py` — DSO/DPO/DIO with stress linkage to P&L performance
- `inject_quality_issues.py` — Deliberately corrupt data (formats, names, nulls, dupes)
- `validate_realism.py` — Automated realism checks with pass/fail gating

## Output

- `corporate_pnl_raw.csv` — 24 months, 3 divisions (~74 rows with duplicates)
- `corporate_cashflow_raw.csv` — Cash flow components (~73 rows)
- `corporate_working_capital_raw.csv` — Working capital metrics with cumulative cash balance (~72 rows)
