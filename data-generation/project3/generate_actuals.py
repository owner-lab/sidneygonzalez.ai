"""Generate transaction-level actuals (~5,200 rows) from budget data."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from constants import RNG

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
BUDGET_PATH = os.path.join(OUTPUT_DIR, "budget_fy2025_clean.csv")

# Vendor pools mapped to SPECIFIC LINE ITEMS (not categories)
# Each line item gets vendors that would actually provide that service
LINE_ITEM_VENDORS = {
    # --- Engineering ---
    "Base Salaries - Senior Engineers": ["ADP Payroll Services", "Gusto HR Solutions", "Internal Payroll"],
    "Base Salaries - Junior Engineers": ["ADP Payroll Services", "Gusto HR Solutions", "Internal Payroll"],
    "Contractor Fees": ["Toptal LLC", "Andela Inc", "Turing Inc", "Robert Half Technology", "Hays Recruitment"],
    "Cloud Hosting (AWS/GCP)": ["Amazon Web Services", "Google Cloud Platform", "Microsoft Azure"],
    "Software Licenses": ["Atlassian Corp", "JetBrains s.r.o.", "GitHub Inc", "GitLab Inc"],
    "Dev Tools & CI/CD": ["CircleCI Inc", "GitHub Actions", "JetBrains s.r.o.", "Docker Inc"],
    "Hardware & Equipment": ["Dell Technologies", "Apple Inc", "Lenovo Group", "CDW Corporation"],
    "Conference & Training": ["O'Reilly Media", "SANS Institute", "QCon Events", "KubeCon"],
    "Recruiting Fees": ["Hired Inc", "LinkedIn Talent", "Greenhouse Software", "Lever Inc"],
    "Office Supplies": ["Staples Inc", "Amazon Business", "W.B. Mason Company"],
    "Team Events": ["Eventbrite Inc", "OpenTable Inc", "TopGolf Entertainment"],
    "Security Audit Services": ["CrowdStrike Holdings", "Rapid7 Inc", "NCC Group", "Bishop Fox"],
    "QA Automation Tools": ["Sauce Labs Inc", "BrowserStack", "SmartBear Software", "Tricentis"],
    "Technical Documentation": ["Readme.io", "Confluence (Atlassian)", "GitBook Inc"],
    "On-Call Compensation": ["ADP Payroll Services", "Internal Payroll", "Gusto HR Solutions"],
    "Data Storage & Backup": ["Amazon Web Services", "Snowflake Computing", "Backblaze Inc", "Wasabi Technologies"],
    # --- Sales ---
    "Base Salaries - Account Executives": ["ADP Payroll Services", "Gusto HR Solutions", "Internal Payroll"],
    "Base Salaries - SDRs": ["ADP Payroll Services", "Gusto HR Solutions", "Internal Payroll"],
    "Commission Payments": ["ADP Payroll Services", "CaptivateIQ", "Xactly Corporation", "Internal Payroll"],
    "CRM Software": ["Salesforce Inc", "HubSpot Inc", "Microsoft Dynamics"],
    "Travel - Client Visits": ["Delta Air Lines", "United Airlines", "American Airlines", "Marriott International", "Hilton Hotels"],
    "Entertainment & Meals": ["The Capital Grille", "Morton's Steakhouse", "Ruth's Chris", "Nobu Restaurant", "DoorDash Inc"],
    "Trade Show Fees": ["Reed Exhibitions", "Informa Markets", "Emerald Expositions", "Cvent Inc"],
    "Sales Enablement Tools": ["Gong Inc", "Chorus.ai", "Highspot Inc", "Seismic Software"],
    "Lead Database Subscriptions": ["ZoomInfo Technologies", "Apollo.io", "LinkedIn Sales Navigator", "Clearbit Inc"],
    "Proposal Design Services": ["Proposify Inc", "PandaDoc Inc", "Qwilr Pty Ltd"],
    "Demo Environment Hosting": ["Amazon Web Services", "Google Cloud Platform", "Heroku (Salesforce)"],
    "Phone & Communication": ["RingCentral Inc", "Twilio Inc", "Dialpad Inc", "Zoom Video Communications"],
    "Territory Development": ["Delta Air Lines", "United Airlines", "Marriott International", "Enterprise Rent-A-Car", "Uber Technologies"],
    "Sales Training Programs": ["Sandler Training", "Challenger Inc", "RAIN Group", "Corporate Visions"],
    "Incentive Programs": ["Xactly Corporation", "CaptivateIQ", "Internal Payroll"],
    "Contract Management Tools": ["DocuSign Inc", "Ironclad Inc", "Agiloft Inc"],
    # --- Marketing ---
    "Base Salaries": ["ADP Payroll Services", "Gusto HR Solutions", "Internal Payroll"],
    "Contractor & Agency Fees": ["WPP PLC", "Omnicom Group", "Dentsu Inc", "Weber Shandwick", "Edelman Inc"],
    "Digital Advertising": ["Google Ads", "Meta Platforms", "LinkedIn Marketing", "The Trade Desk"],
    "Content Production": ["Contently Inc", "Skyword Inc", "Scripted Inc", "ClearVoice Inc"],
    "Event Sponsorships": ["Cvent Inc", "Reed Exhibitions", "Informa Markets", "SaaStr Inc"],
    "PR & Communications": ["Edelman Inc", "Weber Shandwick", "FleishmanHillard", "Burson Cohn & Wolfe"],
    "Marketing Automation Software": ["HubSpot Inc", "Marketo (Adobe)", "Pardot (Salesforce)", "Mailchimp (Intuit)"],
    "Analytics Tools": ["Google Analytics", "Mixpanel Inc", "Amplitude Inc", "Heap Analytics"],
    "Brand Assets & Design": ["Adobe Inc", "Figma Inc", "Canva Pty Ltd", "99designs"],
    "Social Media Management": ["Sprout Social", "Hootsuite Inc", "Buffer Inc", "Later Inc"],
    "SEO/SEM Tools": ["Semrush Inc", "Ahrefs Pte Ltd", "Moz Inc", "SpyFu Inc"],
    "Webinar Platform": ["Zoom Video Communications", "GoTo (LogMeIn)", "ON24 Inc", "Livestorm SAS"],
    "Print Materials": ["VistaPrint (Cimpress)", "FedEx Office", "Staples Print", "Minuteman Press"],
    "Market Research": ["Gartner Inc", "Forrester Research", "IDC (IDG)", "Nielsen Holdings"],
    "Swag & Promotional Items": ["Custom Ink", "Printful Inc", "SwagUp Inc", "Pinnacle Promotions"],
    "Photography & Video": ["Shutterstock Inc", "Getty Images", "Wistia Inc", "Vimeo Inc"],
    # --- Operations ---
    "Facilities & Rent": ["CBRE Group", "JLL (Jones Lang LaSalle)", "Cushman & Wakefield", "Regus (IWG)"],
    "Utilities": ["Pacific Gas & Electric", "Con Edison", "Duke Energy", "National Grid"],
    "Insurance": ["Hartford Financial Services", "Zurich Insurance Group", "Chubb Limited", "AIG Inc"],
    "Equipment Maintenance": ["Siemens AG", "Johnson Controls", "Honeywell International", "Schneider Electric"],
    "Shipping & Logistics": ["FedEx Corporation", "UPS Inc", "DHL Express", "XPO Logistics"],
    "Warehouse Supplies": ["Uline Inc", "Grainger Inc", "Fastenal Company", "Amazon Business"],
    "Fleet Management": ["Enterprise Fleet Management", "Penske Truck Leasing", "Ryder System Inc"],
    "Health & Safety": ["SafeStart International", "OSHA Solutions Group", "EHS Insight", "Compliance Solutions Inc"],
    "Quality Control": ["SGS SA", "Bureau Veritas", "Intertek Group", "TÜV SÜD"],
    "Vendor Management": ["SAP Ariba", "Coupa Software", "Jaggaer Inc", "GEP Worldwide"],
    "Process Automation Tools": ["UiPath Inc", "Automation Anywhere", "Blue Prism", "Zapier Inc"],
    "Customer Support Platform": ["Zendesk Inc", "Freshworks Inc", "Intercom Inc", "ServiceNow Inc"],
    "Returns Processing": ["Happy Returns", "Optoro Inc", "Returnly (Affirm)", "Loop Returns"],
    "Inventory Management System": ["Oracle NetSuite", "SAP SE", "Fishbowl Inventory", "TradeGecko (Intuit)"],
    "Temporary Staffing": ["Robert Half International", "Kelly Services", "Adecco Group", "ManpowerGroup"],
    # --- Finance ---
    "Audit & Compliance": ["Deloitte LLP", "PricewaterhouseCoopers LLP", "Ernst & Young LLP", "KPMG LLP"],
    "Legal Services": ["Wilson Sonsini Goodrich", "Baker McKenzie", "Latham & Watkins", "Cooley LLP"],
    "Tax Advisory": ["Deloitte Tax LLP", "PricewaterhouseCoopers Tax", "Ernst & Young Tax", "KPMG Tax"],
    "ERP Software": ["SAP SE", "Oracle Corporation", "Microsoft Dynamics", "Workday Inc"],
    "Financial Reporting Tools": ["Adaptive Insights (Workday)", "Anaplan Inc", "Vena Solutions", "Planful Inc"],
    "Banking Fees": ["JPMorgan Chase & Co", "Bank of America Corp", "Wells Fargo & Company", "Silicon Valley Bank"],
    "Insurance Premiums": ["Hartford Financial Services", "Zurich Insurance Group", "Travelers Companies", "AIG Inc"],
    "Payroll Processing": ["ADP Payroll Services", "Gusto HR Solutions", "Paychex Inc", "Paycom Software"],
    "Accounts Receivable Services": ["Billtrust Inc", "HighRadius Corporation", "YayPay Inc", "Versapay Inc"],
    "Treasury Management": ["Kyriba Corp", "GTreasury Inc", "FIS Global", "Reval (ION Group)"],
    "Investor Relations": ["Q4 Inc", "Nasdaq IR Solutions", "Business Wire (Berkshire)", "GlobeNewsWire"],
    "Board Meeting Costs": ["Diligent Corporation", "BoardEffect", "Nasdaq Boardvantage", "Marriott International"],
    "Regulatory Filing Fees": ["EDGAR Online", "Donnelley Financial", "Workiva Inc", "Toppan Merrill"],
    "Risk Management Tools": ["LogicManager Inc", "Resolver Inc", "ServiceNow GRC", "RSA Security"],
    "Internal Audit": ["Deloitte LLP", "PricewaterhouseCoopers LLP", "Protiviti Inc", "Grant Thornton LLP"],
}

# Fallback for any line items not explicitly mapped
DEFAULT_VENDORS = ["Acme Services LLC", "General Vendor Inc", "Corporate Solutions Inc"]

# Transactions per month by category
TRANSACTIONS_PER_MONTH = {
    "Personnel": 4, "Compensation": 5, "Infrastructure": 6, "Software": 5,
    "Travel": 12, "Entertainment": 10, "Events": 4, "Training": 5,
    "Services": 7, "Advertising": 8, "Content": 5, "Creative": 4,
    "Supplies": 6, "Facilities": 3, "Insurance": 2, "Maintenance": 4,
    "Logistics": 8, "Vehicles": 3, "Quality": 3, "Compliance": 3,
    "Communication": 4, "Fees": 4,
}


# Items that consolidate to a PRIMARY vendor (80%+ of transactions)
# Payroll goes through one provider, not three
PRIMARY_VENDOR_ITEMS = {
    "Base Salaries - Senior Engineers": ("ADP Payroll Services", 0.92),
    "Base Salaries - Junior Engineers": ("ADP Payroll Services", 0.92),
    "Base Salaries - Account Executives": ("ADP Payroll Services", 0.90),
    "Base Salaries - SDRs": ("ADP Payroll Services", 0.90),
    "Base Salaries": ("ADP Payroll Services", 0.88),  # Marketing/Ops/Finance
    "On-Call Compensation": ("ADP Payroll Services", 0.85),
    "Commission Payments": ("ADP Payroll Services", 0.80),
    "CRM Software": ("Salesforce Inc", 0.90),
    "Cloud Hosting (AWS/GCP)": ("Amazon Web Services", 0.70),
    "ERP Software": ("SAP SE", 0.85),
}

# Items with large quarterly/annual payments (long tail transactions)
LARGE_PAYMENT_ITEMS = {
    "Insurance": {"frequency": "quarterly", "multiplier": 3.0},
    "Insurance Premiums": {"frequency": "quarterly", "multiplier": 3.0},
    "Audit & Compliance": {"frequency": "annual", "month": 3, "multiplier": 6.0},
    "Facilities & Rent": {"frequency": "monthly_large", "multiplier": 2.5},
    "Software Licenses": {"frequency": "annual", "month": 1, "multiplier": 8.0},
    "ERP Software": {"frequency": "annual", "month": 7, "multiplier": 8.0},
}

# Correlated items: if hiring spikes, recruiting and equipment follow
CORRELATED_GROUPS = [
    {
        "trigger": "Base Salaries - Senior Engineers",
        "followers": ["Recruiting Fees", "Hardware & Equipment", "Office Supplies"],
        "lag_months": 0,
        "correlation": 0.6,
    },
    {
        "trigger": "Digital Advertising",
        "followers": ["Content Production", "Analytics Tools"],
        "lag_months": 0,
        "correlation": 0.4,
    },
]


def generate_actuals():
    budget = pd.read_csv(BUDGET_PATH)
    rows = []
    txn_counter = 0

    # Pre-compute trigger variance for correlation groups
    trigger_variance = {}
    for group in CORRELATED_GROUPS:
        trigger_data = budget[budget["line_item"] == group["trigger"]]
        if len(trigger_data) > 0:
            mean_amt = trigger_data["budget_amount"].mean()
            for _, row in trigger_data.iterrows():
                key = (row["department"], row["month"])
                trigger_variance[key] = (row["budget_amount"] - mean_amt) / mean_amt

    for _, brow in budget.iterrows():
        dept = brow["department"]
        category = brow["category"]
        line_item = brow["line_item"]
        month = brow["month"]
        budget_amount = brow["budget_amount"]
        cost_center = brow["cost_center"]

        # Apply inter-line-item correlation
        corr_boost = 1.0
        for group in CORRELATED_GROUPS:
            if line_item in group["followers"]:
                key = (dept, month)
                if key in trigger_variance:
                    corr_boost += trigger_variance[key] * group["correlation"]

        base_txns = TRANSACTIONS_PER_MONTH.get(category, 2)
        n_txns = max(1, int(RNG.poisson(base_txns)))

        vendors = LINE_ITEM_VENDORS.get(line_item, DEFAULT_VENDORS)
        primary = PRIMARY_VENDOR_ITEMS.get(line_item, None)

        # Check for large payment pattern
        large_cfg = LARGE_PAYMENT_ITEMS.get(line_item, None)
        has_large_this_month = False
        if large_cfg:
            month_num = int(month.split("-")[1])
            if large_cfg["frequency"] == "quarterly" and month_num in [3, 6, 9, 12]:
                has_large_this_month = True
            elif large_cfg["frequency"] == "annual" and month_num == large_cfg.get("month", 1):
                has_large_this_month = True
            elif large_cfg["frequency"] == "monthly_large":
                has_large_this_month = True

        # Generate transactions
        if has_large_this_month and large_cfg:
            # One large transaction + small remainder transactions
            large_amount = round(budget_amount * large_cfg["multiplier"] * corr_boost * RNG.normal(1.0, 0.03), 2)
            remainder = max(0, budget_amount * corr_boost - large_amount * 0.3)

            txn_counter += 1
            vendor = primary[0] if primary else RNG.choice(vendors)
            month_dt = pd.Timestamp(month + "-01")
            day = RNG.integers(1, min(15, month_dt.days_in_month) + 1)
            txn_date = month_dt.replace(day=int(day))
            pay_date = txn_date + pd.Timedelta(days=int(RNG.integers(1, 10)))

            rows.append({
                "transaction_id": f"TXN-{txn_counter:06d}",
                "department": dept, "category": category, "line_item": line_item,
                "month": month, "transaction_date": txn_date.strftime("%Y-%m-%d"),
                "amount": large_amount, "vendor": vendor,
                "invoice_id": f"INV-{month.replace('-', '')}-{txn_counter:05d}",
                "cost_center": cost_center,
                "payment_date": pay_date.strftime("%Y-%m-%d"),
                "description": f"{line_item} - {vendor} (annual/quarterly)",
            })

            # Small remainder transactions
            if remainder > 100:
                n_small = max(1, n_txns - 1)
                splits = RNG.dirichlet(np.ones(n_small) * 2)
                for split in splits:
                    txn_counter += 1
                    amt = round(remainder * split * RNG.normal(1.0, 0.05), 2)
                    amt = max(0.01, amt)
                    v = RNG.choice(vendors)
                    day = RNG.integers(1, min(28, month_dt.days_in_month) + 1)
                    td = month_dt.replace(day=int(day))
                    pd_date = td + pd.Timedelta(days=int(RNG.integers(1, 16)))
                    rows.append({
                        "transaction_id": f"TXN-{txn_counter:06d}",
                        "department": dept, "category": category, "line_item": line_item,
                        "month": month, "transaction_date": td.strftime("%Y-%m-%d"),
                        "amount": amt, "vendor": v,
                        "invoice_id": f"INV-{month.replace('-', '')}-{txn_counter:05d}",
                        "cost_center": cost_center,
                        "payment_date": pd_date.strftime("%Y-%m-%d"),
                        "description": f"{line_item} - {v}",
                    })
        else:
            # Standard transaction generation
            splits = RNG.dirichlet(np.ones(n_txns) * 3)

            for j, split in enumerate(splits):
                txn_counter += 1
                sigma = {"Personnel": 0.02, "Travel": 0.08, "Entertainment": 0.10,
                         "Software": 0.03, "Services": 0.05}.get(category, 0.04)
                amount = round(budget_amount * split * corr_boost * RNG.normal(1.0, sigma), 2)
                amount = max(0.01, amount)

                # Primary vendor gets most transactions
                if primary and RNG.random() < primary[1]:
                    vendor = primary[0]
                else:
                    vendor = RNG.choice(vendors)

                month_dt = pd.Timestamp(month + "-01")
                day = RNG.integers(1, min(28, month_dt.days_in_month) + 1)
                txn_date = month_dt.replace(day=int(day))
                pay_date = txn_date + pd.Timedelta(days=int(RNG.integers(1, 16)))

                rows.append({
                    "transaction_id": f"TXN-{txn_counter:06d}",
                    "department": dept, "category": category, "line_item": line_item,
                    "month": month, "transaction_date": txn_date.strftime("%Y-%m-%d"),
                    "amount": amount, "vendor": vendor,
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
