"""Generate transaction-level actuals (~5,200 rows) from budget data."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from constants import RNG

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
BUDGET_PATH = os.path.join(OUTPUT_DIR, "budget_fy2025_clean.csv")

# Vendor pools by category
VENDOR_POOLS = {
    "Personnel": ["ADP Payroll Services", "Gusto HR Solutions", "Paycom", "Internal Payroll"],
    "Compensation": ["ADP Payroll Services", "Gusto HR Solutions", "Internal Payroll"],
    "Infrastructure": [
        "Amazon Web Services", "Google Cloud Platform", "Microsoft Azure",
        "Cloudflare Inc", "Datadog Inc", "Snowflake Computing",
        "DigitalOcean LLC", "Rackspace Technology", "Equinix Inc",
    ],
    "Software": [
        "Atlassian Corp", "JetBrains s.r.o.", "GitHub Inc", "GitLab Inc",
        "Slack Technologies", "Zoom Video Communications", "Salesforce Inc",
        "HubSpot Inc", "Okta Inc", "Snyk Ltd", "Datadog Inc",
        "PagerDuty Inc", "Splunk Inc", "New Relic Inc", "Auth0 Inc",
        "Cloudflare Inc", "Fastly Inc", "Figma Inc", "Miro Inc",
    ],
    "Travel": [
        "Delta Air Lines", "United Airlines", "American Airlines",
        "Marriott International", "Hilton Hotels", "Hyatt Hotels",
        "Enterprise Rent-A-Car", "Hertz Corporation", "Uber Technologies",
        "Lyft Inc", "Expedia Group", "Booking Holdings",
    ],
    "Entertainment": [
        "OpenTable Inc", "DoorDash Inc", "Grubhub Inc",
        "The Capital Grille", "Morton's Steakhouse", "Ruth's Chris",
        "Nobu Restaurant", "STK Steakhouse",
    ],
    "Events": [
        "Eventbrite Inc", "Cvent Inc", "Freeman Company",
        "Reed Exhibitions", "Informa Markets", "Emerald Expositions",
        "Salesforce Events", "AWS Events", "Google Events",
    ],
    "Training": [
        "Coursera Inc", "Udemy Business", "LinkedIn Learning",
        "O'Reilly Media", "Pluralsight Inc", "A Cloud Guru",
        "SANS Institute", "Gartner Inc",
    ],
    "Services": [
        "Deloitte LLP", "PricewaterhouseCoopers LLP", "Ernst & Young LLP",
        "KPMG LLP", "Accenture PLC", "McKinsey & Company",
        "Bain & Company", "Boston Consulting Group",
        "Wilson Sonsini Goodrich", "Morrison Legal Partners",
        "Baker McKenzie", "Latham & Watkins",
        "Robert Half International", "Kforce Inc",
    ],
    "Advertising": [
        "Google Ads", "Meta Platforms", "LinkedIn Marketing",
        "Twitter Ads", "TikTok Ads", "Taboola Inc",
        "Outbrain Inc", "The Trade Desk",
    ],
    "Content": [
        "Contently Inc", "Skyword Inc", "Scripted Inc",
        "ClearVoice Inc", "Shutterstock Inc", "Getty Images",
    ],
    "Creative": [
        "Figma Inc", "Adobe Inc", "Canva Pty Ltd",
        "Shutterstock Inc", "Getty Images", "99designs",
    ],
    "Supplies": [
        "Staples Inc", "Office Depot", "Amazon Business",
        "W.B. Mason Company", "Uline Inc",
    ],
    "Facilities": [
        "CBRE Group", "JLL (Jones Lang LaSalle)", "Cushman & Wakefield",
        "Pacific Gas & Electric", "Con Edison", "Duke Energy",
    ],
    "Insurance": [
        "Hartford Financial Services", "Zurich Insurance Group",
        "Chubb Limited", "AIG Inc", "Travelers Companies",
    ],
    "Maintenance": [
        "Siemens AG", "Johnson Controls", "Honeywell International",
        "ABB Ltd", "Schneider Electric",
    ],
    "Logistics": [
        "FedEx Corporation", "UPS Inc", "DHL Express",
        "XPO Logistics", "C.H. Robinson", "Echo Global Logistics",
    ],
    "Vehicles": [
        "Enterprise Fleet Management", "Penske Truck Leasing",
        "Ryder System Inc", "LeasePlan Corporation",
    ],
    "Quality": [
        "SGS SA", "Bureau Veritas", "Intertek Group", "TÜV SÜD",
    ],
    "Compliance": [
        "OSHA Compliance Solutions", "SafeStart International",
        "EHS Insight", "ComplianceQuest",
    ],
    "Communication": [
        "Twilio Inc", "RingCentral Inc", "Vonage Holdings",
        "8x8 Inc", "Bandwidth Inc",
    ],
    "Fees": [
        "JPMorgan Chase & Co", "Bank of America Corp",
        "Wells Fargo & Company", "Silicon Valley Bank",
    ],
}

# Transactions per month by category
TRANSACTIONS_PER_MONTH = {
    "Personnel": 4,       # payroll runs + adjustments + benefits
    "Compensation": 5,    # commissions per rep + bonuses
    "Infrastructure": 6,  # multiple cloud services + tools
    "Software": 5,        # multiple licenses + subscriptions
    "Travel": 12,         # many individual trips/bookings
    "Entertainment": 10,  # many individual meals/events
    "Events": 4,          # registrations + sponsorships
    "Training": 5,        # courses + conferences + materials
    "Services": 7,        # multiple consulting invoices + retainers
    "Advertising": 8,     # multiple campaigns + platforms
    "Content": 5,         # multiple pieces + freelancers
    "Creative": 4,        # design projects + assets
    "Supplies": 6,        # multiple orders
    "Facilities": 3,      # rent + utilities + maintenance
    "Insurance": 2,       # premiums + adjustments
    "Maintenance": 4,     # service calls + parts
    "Logistics": 8,       # many shipments
    "Vehicles": 3,        # lease + fuel + maintenance
    "Quality": 3,         # inspections + certifications
    "Compliance": 3,      # filings + audits
    "Communication": 4,   # phone + tools + services
    "Fees": 4,            # bank charges + wire fees
}


def generate_actuals():
    budget = pd.read_csv(BUDGET_PATH)
    rows = []
    txn_counter = 0

    for _, brow in budget.iterrows():
        dept = brow["department"]
        category = brow["category"]
        line_item = brow["line_item"]
        month = brow["month"]
        budget_amount = brow["budget_amount"]
        cost_center = brow["cost_center"]

        # Number of transactions for this line item this month
        base_txns = TRANSACTIONS_PER_MONTH.get(category, 2)
        n_txns = max(1, int(RNG.poisson(base_txns)))

        # Split budget into n transactions with variance
        splits = RNG.dirichlet(np.ones(n_txns) * 3)  # roughly equal splits
        vendors = VENDOR_POOLS.get(category, ["Generic Vendor Inc"])

        for j, split in enumerate(splits):
            txn_counter += 1
            # Organic variance per transaction
            sigma = {"Personnel": 0.02, "Travel": 0.08, "Entertainment": 0.10,
                     "Software": 0.03, "Services": 0.05}.get(category, 0.04)
            amount = round(budget_amount * split * RNG.normal(1.0, sigma), 2)
            amount = max(0.01, amount)

            vendor = RNG.choice(vendors)
            # Transaction date: random day within the month
            month_dt = pd.Timestamp(month + "-01")
            day = RNG.integers(1, min(28, month_dt.days_in_month) + 1)
            txn_date = month_dt.replace(day=int(day))
            pay_date = txn_date + pd.Timedelta(days=int(RNG.integers(1, 16)))

            rows.append({
                "transaction_id": f"TXN-{txn_counter:06d}",
                "department": dept,
                "category": category,
                "line_item": line_item,
                "month": month,
                "transaction_date": txn_date.strftime("%Y-%m-%d"),
                "amount": amount,
                "vendor": vendor,
                "invoice_id": f"INV-{month.replace('-', '')}-{txn_counter:05d}",
                "cost_center": cost_center,
                "payment_date": pay_date.strftime("%Y-%m-%d"),
                "description": f"{line_item} - {vendor}",
            })

    df = pd.DataFrame(rows)
    output_path = os.path.join(OUTPUT_DIR, "actuals_fy2025_clean.csv")
    df.to_csv(output_path, index=False)

    unique_vendors = df["vendor"].nunique()
    print(f"Actuals generated: {len(df)} transactions, {unique_vendors} unique vendors -> {output_path}")
    return df


if __name__ == "__main__":
    generate_actuals()
