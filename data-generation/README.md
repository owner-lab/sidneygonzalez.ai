# Data Generation Workstream

Dedicated workstream for generating synthetic corporate datasets used by all three portfolio projects. Data quality determines the credibility of every project — no UI work begins until datasets pass validation.

## Structure

- `project1/` — Corporate P&L, cash flow, and working capital data (24 months, 3 divisions)
- `project2/` — Organizational model with interdependency coefficients (5 divisions)
- `project3/` — Budget vs. actual data with injected anomalies (12 months, 5 departments)

## Workflow

1. Generate data with Python scripts
2. Run `validate_realism.py` for each project
3. Manual inspection — does this look like data from a real company?
4. Export final CSVs and JSON to `public/data/`

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
