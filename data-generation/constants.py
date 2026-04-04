"""Shared constants for data generation across all three projects."""

import numpy as np

RANDOM_SEED = 42
RNG = np.random.default_rng(RANDOM_SEED)

COMPANY_NAME = "Meridian Technologies"

# Project 1: Business divisions (revenue segments)
START_DATE = "2023-01-01"
NUM_MONTHS = 24

DIVISIONS = {
    "enterprise_software": {
        "label": "Enterprise Software",
        "aliases": ["Div A", "Division A", "div_a", "Enterprise Software"],
        "annual_revenue": 90_000_000,
        "gross_margin_target": 0.62,
        "seasonality": [0.87, 0.90, 0.95, 0.99, 1.00, 1.02, 1.01, 0.98, 1.03, 1.05, 1.08, 1.18],
        "growth_rate": 0.10,
        "rd_pct": 0.18,
        "sga_pct": 0.22,
        "depreciation_pct": 0.03,
        "interest_pct": 0.01,
        "dso_target": 62,
        "dpo_target": 42,
        "dio_target": 3,
        "capex_pct": 0.05,
    },
    "professional_services": {
        "label": "Professional Services",
        "aliases": ["Div B", "Division B", "div_b", "Professional Services"],
        "annual_revenue": 60_000_000,
        "gross_margin_target": 0.48,
        "seasonality": [0.92, 0.95, 0.98, 1.00, 1.02, 1.01, 0.99, 0.97, 1.01, 1.03, 1.05, 1.10],
        "growth_rate": 0.08,
        "rd_pct": 0.05,
        "sga_pct": 0.20,
        "depreciation_pct": 0.02,
        "interest_pct": 0.008,
        "dso_target": 40,
        "dpo_target": 35,
        "dio_target": 0,
        "capex_pct": 0.03,
    },
    "cloud_infrastructure": {
        "label": "Cloud Infrastructure",
        "aliases": ["Div C", "Division C", "div_c", "Cloud Infrastructure"],
        "annual_revenue": 50_000_000,
        "gross_margin_target": 0.58,
        "seasonality": [0.90, 0.93, 0.97, 1.00, 1.02, 1.03, 1.02, 1.00, 1.01, 1.04, 1.06, 1.12],
        "growth_rate": 0.12,
        "rd_pct": 0.15,
        "sga_pct": 0.18,
        "depreciation_pct": 0.06,
        "interest_pct": 0.012,
        "dso_target": 30,
        "dpo_target": 45,
        "dio_target": 15,
        "capex_pct": 0.17,
    },
}

# Project 2 & 3: Functional departments (cost centers)
DEPARTMENTS = ["Engineering", "Sales", "Marketing", "Operations", "Finance"]

# Project 3: Fiscal year
FY_START = "2025-01-01"
FY_MONTHS = 12

APPROVAL_THRESHOLDS = {
    "Engineering": 25_000,
    "Sales": 15_000,
    "Marketing": 20_000,
    "Operations": 10_000,
    "Finance": 30_000,
}

COST_CENTERS = {
    "Engineering": "ENG-401",
    "Sales": "SAL-201",
    "Marketing": "MKT-301",
    "Operations": "OPS-501",
    "Finance": "FIN-601",
}
