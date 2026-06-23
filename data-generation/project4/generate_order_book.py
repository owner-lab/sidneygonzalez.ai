"""Generate the Meridian Technologies engineered-to-order (ETO) order book.

A project-based / capital-goods shop: a handful of large, multi-month
fabrication contracts competing for a finite number of delivery crews.
The book is CLEAN (no quality-issue injection) — this is a scenario /
sensitivity tool, not an ETL demo.

Calibration intent (verified by the capacity engine, not asserted here):
total slot-months are tuned so ~3-4 crews can work the book within an
18-month horizon, with deadline pressure that pushes some work past its
promised date (-> at-risk revenue) so a 4th crew has something to fix.

Deterministic: a PRIVATE rng (seed 50), independent of the shared
constants.RNG so this script reproduces identically when run standalone.
"""

import os
import numpy as np
import pandas as pd

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUBLIC_DATA = os.path.join(ROOT, "public", "data")

COMPANY_NAME = "Meridian Technologies"
ANCHOR_MONTH = "2026-01"  # month index 0 of the forecast horizon
RNG = np.random.default_rng(50)  # private, NOT the shared constants.RNG

CUSTOMERS = [
    "Noordzee Energie", "Rhine Petrochemical", "Adriatic Offshore",
    "Baltic Power Systems", "Iberian Refining", "Hanseatic Marine",
    "Alpine Process Tech", "Veridian Chemicals", "Maasvlakte Terminals",
    "Caspian Energy Group", "Donau Industrial",
]
SEGMENTS = ["Oil & Gas", "Petrochemical", "Power Generation", "Marine", "Water Treatment"]

# id, name, contract_value, gross_margin_pct, duration_months,
# order_intake (YYYY-MM), promised_delivery (YYYY-MM), priority, segment, status
# Thin ETO margins (0.17-0.30); the largest / most complex jobs carry the
# thinnest margins. Deadlines are tight enough that a contended schedule slips.
PROJECTS = [
    ("ORD-2401", "Offshore module skid",      6_400_000, 0.18, 8, "2026-01", "2026-11", 1, "Oil & Gas",        "in_progress"),
    ("ORD-2402", "Refinery heat exchanger",   3_100_000, 0.22, 7, "2026-01", "2026-09", 1, "Petrochemical",    "in_progress"),
    ("ORD-2403", "Cryogenic storage tank",    3_500_000, 0.19, 7, "2026-02", "2026-12", 1, "Oil & Gas",        "backlog"),
    ("ORD-2404", "Pressure vessel array",     2_300_000, 0.21, 6, "2026-01", "2026-11", 2, "Petrochemical",    "in_progress"),
    ("ORD-2405", "Modular substation",        2_650_000, 0.20, 6, "2026-03", "2027-01", 2, "Power Generation", "backlog"),
    ("ORD-2406", "Turbine enclosure",         1_500_000, 0.24, 5, "2026-02", "2026-12", 2, "Power Generation", "backlog"),
    ("ORD-2407", "Marine propulsion frame",   1_050_000, 0.27, 4, "2026-01", "2026-10", 2, "Marine",           "in_progress"),
    ("ORD-2408", "Flare stack package",       1_200_000, 0.26, 4, "2026-03", "2027-01", 3, "Oil & Gas",        "backlog"),
    ("ORD-2409", "Reactor internals",         4_700_000, 0.17, 8, "2026-04", "2027-05", 1, "Petrochemical",    "backlog"),
    ("ORD-2410", "Pipe rack & valve skid",      780_000, 0.30, 3, "2026-02", "2026-11", 3, "Oil & Gas",        "backlog"),
    ("ORD-2411", "Heat recovery unit",        2_050_000, 0.21, 6, "2026-05", "2027-03", 2, "Power Generation", "backlog"),
]


def build_backlog():
    """Engine-payload shape: list of dicts mirrored by FALLBACK_BACKLOG."""
    book = []
    for (pid, name, value, margin, dur, intake, promised, prio, seg, status) in PROJECTS:
        book.append({
            "id": pid,
            "name": name,
            "contract_value": value,
            "gross_margin_pct": margin,
            "duration_months": dur,
            "order_intake_date": intake,
            "promised_delivery_date": promised,
            "priority": prio,
        })
    return book


def generate_order_book():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    rows = []
    for (pid, name, value, margin, dur, intake, promised, prio, seg, status) in PROJECTS:
        customer = CUSTOMERS[RNG.integers(0, len(CUSTOMERS))]
        rows.append({
            "project_id": pid,
            "project_name": name,
            "customer": customer,
            "market_segment": seg,
            "contract_value": value,
            "gross_margin_pct": margin,
            "duration_months": dur,
            "order_intake_date": intake,
            "promised_delivery_date": promised,
            "priority": prio,
            "status": status,
        })
    df = pd.DataFrame(rows)
    out_path = os.path.join(OUTPUT_DIR, "eto_order_book_clean.csv")
    df.to_csv(out_path, index=False)

    # Publish the canonical artifact to public/data (fetched by the app / engine source)
    os.makedirs(PUBLIC_DATA, exist_ok=True)
    df.to_csv(os.path.join(PUBLIC_DATA, "eto_order_book.csv"), index=False)

    total_value = df["contract_value"].sum()
    total_slot_months = df["duration_months"].sum()
    print(f"{COMPANY_NAME} order book: {len(df)} projects -> {out_path}")
    print(f"  total contract value : ${total_value:,.0f}")
    print(f"  total slot-months    : {total_slot_months} "
          f"(3 crews x18 = 54 cap, 4 crews x18 = 72 cap)")
    print(f"  value max/median     : {df['contract_value'].max()/df['contract_value'].median():.1f}x")
    print(f"  margin range         : {df['gross_margin_pct'].min():.2f}-{df['gross_margin_pct'].max():.2f}")
    return df


if __name__ == "__main__":
    generate_order_book()
