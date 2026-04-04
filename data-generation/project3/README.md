# Project 3 Data: Budget vs. Actual with Anomalies

## Anomaly Type Documentation

Five distinct anomaly types are injected at ~3-5% contamination rate:

1. **Seasonal spikes** — Predictable recurring patterns (e.g., Q4 marketing push)
2. **One-time events** — Single large deviations (e.g., equipment purchase, legal settlement)
3. **Trending overspends** — Gradual drift upward over consecutive months
4. **Threshold-clustering** — Amounts clustered just below approval thresholds
5. **Duplicate vendor payments** — Same amount, same vendor, same period

## Injection Methodology

- Anomalies are injected into otherwise organic variance data (normal distribution around budget)
- Each anomaly type has distinct statistical signatures detectable by Isolation Forest
- Anomalies are not trivially obvious — they require statistical methods to distinguish from normal variance
- Contamination rate kept at 3-5% to match real-world anomaly frequency

## Validation Checks

- Distribution shapes match expected patterns
- Seasonal patterns are present but not exaggerated
- Anomalies are detectable but not trivially flagged by simple thresholds
- Budget figures use realistic (non-round) numbers

## Scripts

- `generate_budget.py` — Realistic departmental budgets
- `generate_actuals.py` — Actuals with organic variance
- `inject_anomalies.py` — Deliberate anomaly patterns (5 types)
- `validate_realism.py` — Check distribution shapes, seasonal patterns

## Output

- `budget_fy2025.csv` — 12 months, 5 departments, 15-20 line items each
- `actuals_fy2025.csv` — Actual figures with injected anomalies
