"""Generate monthly budget data: 5 departments x 16 line items x 12 months."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from constants import DEPARTMENTS, APPROVAL_THRESHOLDS, COST_CENTERS, FY_START, FY_MONTHS, RNG

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Line items per department: (category, name, annual_base)
LINE_ITEMS = {
    "Engineering": [
        ("Personnel", "Base Salaries - Senior Engineers", 2_847_200),
        ("Personnel", "Base Salaries - Junior Engineers", 1_523_400),
        ("Personnel", "Contractor Fees", 967_800),
        ("Infrastructure", "Cloud Hosting (AWS/GCP)", 1_284_600),
        ("Software", "Software Licenses", 412_300),
        ("Software", "Dev Tools & CI/CD", 187_500),
        ("Equipment", "Hardware & Equipment", 356_200),
        ("Training", "Conference & Training", 234_100),
        ("Personnel", "Recruiting Fees", 445_600),
        ("Supplies", "Office Supplies", 67_800),
        ("Events", "Team Events", 89_400),
        ("Software", "Security Audit Services", 178_900),
        ("Software", "QA Automation Tools", 134_200),
        ("Services", "Technical Documentation", 112_500),
        ("Personnel", "On-Call Compensation", 267_300),
        ("Infrastructure", "Data Storage & Backup", 523_700),
    ],
    "Sales": [
        ("Personnel", "Base Salaries - Account Executives", 2_134_500),
        ("Personnel", "Base Salaries - SDRs", 892_300),
        ("Compensation", "Commission Payments", 1_678_400),
        ("Software", "CRM Software", 234_700),
        ("Travel", "Travel - Client Visits", 567_200),
        ("Entertainment", "Entertainment & Meals", 189_300),
        ("Events", "Trade Show Fees", 423_600),
        ("Software", "Sales Enablement Tools", 156_800),
        ("Services", "Lead Database Subscriptions", 312_400),
        ("Services", "Proposal Design Services", 87_600),
        ("Infrastructure", "Demo Environment Hosting", 145_200),
        ("Communication", "Phone & Communication", 98_700),
        ("Travel", "Territory Development", 234_500),
        ("Training", "Sales Training Programs", 167_800),
        ("Compensation", "Incentive Programs", 345_600),
        ("Software", "Contract Management Tools", 112_300),
    ],
    "Marketing": [
        ("Personnel", "Base Salaries", 1_567_200),
        ("Services", "Contractor & Agency Fees", 734_500),
        ("Advertising", "Digital Advertising", 1_245_600),
        ("Content", "Content Production", 423_800),
        ("Events", "Event Sponsorships", 567_300),
        ("Services", "PR & Communications", 312_400),
        ("Software", "Marketing Automation Software", 198_700),
        ("Software", "Analytics Tools", 134_500),
        ("Creative", "Brand Assets & Design", 267_800),
        ("Software", "Social Media Management", 89_400),
        ("Software", "SEO/SEM Tools", 112_300),
        ("Software", "Webinar Platform", 67_800),
        ("Supplies", "Print Materials", 45_600),
        ("Services", "Market Research", 234_500),
        ("Supplies", "Swag & Promotional Items", 123_400),
        ("Creative", "Photography & Video", 178_900),
    ],
    "Operations": [
        ("Personnel", "Base Salaries", 1_234_500),
        ("Facilities", "Facilities & Rent", 867_200),
        ("Facilities", "Utilities", 156_700),
        ("Insurance", "Insurance", 234_500),
        ("Maintenance", "Equipment Maintenance", 312_400),
        ("Logistics", "Shipping & Logistics", 567_800),
        ("Supplies", "Warehouse Supplies", 123_400),
        ("Vehicles", "Fleet Management", 234_100),
        ("Compliance", "Health & Safety", 89_700),
        ("Quality", "Quality Control", 178_900),
        ("Services", "Vendor Management", 145_600),
        ("Software", "Process Automation Tools", 198_700),
        ("Software", "Customer Support Platform", 167_300),
        ("Logistics", "Returns Processing", 89_400),
        ("Software", "Inventory Management System", 134_200),
        ("Personnel", "Temporary Staffing", 345_600),
    ],
    "Finance": [
        ("Personnel", "Base Salaries", 1_123_400),
        ("Services", "Audit & Compliance", 345_600),
        ("Services", "Legal Services", 456_700),
        ("Services", "Tax Advisory", 234_500),
        ("Software", "ERP Software", 312_800),
        ("Software", "Financial Reporting Tools", 134_200),
        ("Fees", "Banking Fees", 89_400),
        ("Insurance", "Insurance Premiums", 267_300),
        ("Services", "Payroll Processing", 145_600),
        ("Services", "Accounts Receivable Services", 112_300),
        ("Services", "Treasury Management", 178_900),
        ("Communication", "Investor Relations", 89_700),
        ("Events", "Board Meeting Costs", 67_800),
        ("Compliance", "Regulatory Filing Fees", 56_200),
        ("Software", "Risk Management Tools", 123_400),
        ("Services", "Internal Audit", 198_700),
    ],
}

# Seasonal multipliers per category
SEASONAL = {
    "Personnel": [1.0] * 12,  # flat
    "Compensation": [0.85, 0.9, 1.15, 0.85, 0.9, 1.15, 0.85, 0.9, 1.15, 0.85, 0.9, 1.15],  # quarter-end
    "Travel": [0.7, 0.9, 1.1, 1.2, 1.0, 0.8, 0.6, 0.7, 1.1, 1.2, 1.1, 0.8],
    "Events": [0.5, 0.7, 1.0, 1.2, 1.0, 0.8, 0.5, 0.7, 1.3, 1.5, 1.2, 0.6],
    "Training": [1.3, 1.0, 0.8, 0.9, 1.2, 1.0, 0.7, 0.8, 1.1, 1.0, 0.9, 0.8],
    "Advertising": [0.8, 0.9, 1.0, 1.1, 1.0, 0.9, 0.8, 0.9, 1.1, 1.2, 1.3, 1.1],
}


def generate_budget():
    rows = []
    months = pd.date_range(FY_START, periods=FY_MONTHS, freq="MS")

    for dept in DEPARTMENTS:
        items = LINE_ITEMS[dept]
        for category, name, annual_base in items:
            monthly_base = annual_base / 12
            seasonal = SEASONAL.get(category, [1.0] * 12)

            for i, month in enumerate(months):
                # Non-round amount with seasonal adjustment
                factor = seasonal[i] * RNG.normal(1.0, 0.02)
                amount = round(monthly_base * factor, 2)
                # Ensure non-round: add cents if divisible by 1000
                if amount % 1000 == 0:
                    amount += RNG.uniform(1, 999)
                    amount = round(amount, 2)

                rows.append({
                    "department": dept,
                    "category": category,
                    "line_item": name,
                    "month": month.strftime("%Y-%m"),
                    "budget_amount": amount,
                    "cost_center": COST_CENTERS[dept],
                    "approval_threshold": APPROVAL_THRESHOLDS[dept],
                })

    df = pd.DataFrame(rows)
    output_path = os.path.join(OUTPUT_DIR, "budget_fy2025_clean.csv")
    df.to_csv(output_path, index=False)
    print(f"Budget generated: {len(df)} rows, {df['line_item'].nunique()} unique items -> {output_path}")
    return df


if __name__ == "__main__":
    generate_budget()
