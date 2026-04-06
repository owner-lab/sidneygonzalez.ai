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
        "annual_revenue": 85_000_000,  # ~$85M base, grows to ~$95M in Y2
        "gross_margin_target": 0.65,  # enterprise SaaS at scale (McKinsey Rule of 40 top-quartile)
        #                Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
        "seasonality": [0.91, 0.93, 0.96, 0.99, 1.00, 1.01, 1.00, 0.98, 1.02, 1.05, 1.07, 1.14],
        "growth_rate": 0.08,  # 8% -> ~12-14% YoY with momentum (Bain mid-market median)
        "rd_pct": 0.17,   # mature platform: R&D efficiency improves at scale
        "sga_pct": 0.19,  # optimized GTM motion (Bain: top-quartile SGA/Rev ~18-20%)
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
        "annual_revenue": 58_000_000,  # ~$58M base, grows to ~$63M in Y2
        "gross_margin_target": 0.50,  # improved services mix (higher-value engagements)
        "seasonality": [0.92, 0.95, 0.98, 1.00, 1.02, 1.01, 0.99, 0.97, 1.01, 1.03, 1.05, 1.10],
        "growth_rate": 0.08,
        "rd_pct": 0.04,   # services: minimal R&D (methodology, not product)
        "sga_pct": 0.17,  # efficient partner-led sales model
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
        "annual_revenue": 48_000_000,  # ~$48M base, grows to ~$54M in Y2
        "gross_margin_target": 0.60,  # cloud infra: improving unit economics at scale
        "seasonality": [0.90, 0.93, 0.97, 1.00, 1.02, 1.03, 1.02, 1.00, 1.01, 1.04, 1.06, 1.12],
        "growth_rate": 0.12,
        "rd_pct": 0.14,   # platform investment phase winding down
        "sga_pct": 0.16,  # self-serve + PLG reducing sales costs
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
