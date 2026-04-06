# Project 1: Executive Financial Command Center

**"The Dashboard a CFO Would Actually Use"**

## Business Question

How do I give a CFO a single view that connects P&L performance, cash flow health, working capital efficiency, and divisional revenue — from data that currently lives in disconnected spreadsheets?

## What This Proves

- **Data pipeline engineering:** ingesting messy, inconsistent source data
- **ETL design:** cleaning, normalizing, joining across functional areas
- **Executive communication:** right visualization for the right audience
- **Dashboard architecture:** information hierarchy, progressive disclosure

## Data Source

Synthetic multi-division corporate dataset for "Meridian Technologies":

- Monthly P&L by division (3 divisions, 24 months)
- Cash flow statement components (Operating, Investing, Financing)
- Working capital metrics (DSO, DPO, DIO, Cash Conversion Cycle)

Data quality issues are deliberately injected: mixed date formats, inconsistent division names, missing values, duplicate rows.

## Pipeline Architecture

| Stage | What It Does |
|-------|-------------|
| Ingest | Load 3 raw CSVs, parse 3 different date formats |
| Validate | Schema checks, null detection, duplicate flagging |
| Clean | Normalize 11 division name variants, deduplicate, fill gaps |
| Transform | Join datasets, calculate KPIs, pivot by division |
| Output | Structured JSON for chart consumption |

## Known Limitations

- Synthetic data lacks the irregularity of real GL exports
- No real-time data connection — demonstrates the pipeline pattern, not a production ETL
- Simplified chart of accounts — real corporate structures have hundreds of GL codes
- No user authentication or role-based views
