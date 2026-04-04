# Project 2 Data: Organizational Model & Coefficients

## Coefficient Sources and Research Citations

Every interdependency coefficient must be grounded in published research. This README documents the basis for each relationship modeled.

### Required Documentation Per Coefficient

| Relationship | Coefficient | Source/Basis | Notes |
|---|---|---|---|
| Marketing spend → Sales pipeline | TBD | B2B marketing attribution studies | Elasticity of pipeline to spend changes |
| Hiring velocity → Engineering output | TBD | Software engineering productivity research | Non-linear — diminishing returns |
| Collections speed → Working capital | TBD | Corporate treasury management literature | DSO reduction impact on cash position |
| Operations budget → Fulfillment capacity | TBD | Operations management research | Threshold effects at capacity limits |

### Model Transparency

All coefficients are illustrative. In production, these would be calibrated from an organization's historical data. The model demonstrates the analytical pattern, not a production-ready prediction engine.

## Scripts

- `build_org_model.py` — Division definitions, KPIs, interdependencies
- `calibrate_coefficients.py` — Document coefficient sources and reasoning
- `generate_scenarios.py` — Pre-built scenario parameter sets

## Output

- `org_model.json` — 5 divisions, 3-4 KPIs each, interdependency matrix
- `scenario_presets.json` — 4 pre-built decision scenarios with expected cascade outputs
