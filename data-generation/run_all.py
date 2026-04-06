"""Orchestrate all data generation: P1 -> P2 -> P3. Halts on first failure."""

import subprocess
import sys
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
PYTHON = os.path.join(ROOT, "venv", "bin", "python")


def run(script, label):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")
    result = subprocess.run(
        [PYTHON, script],
        cwd=ROOT,
        capture_output=False,
    )
    if result.returncode != 0:
        print(f"\nFAILED: {label}")
        sys.exit(1)


def main():
    print("=" * 60)
    print("  PHASE 0: DATA GENERATION")
    print("  Meridian Technologies — Synthetic Corporate Data")
    print("=" * 60)

    # Project 1: Corporate Financials
    run("project1/generate_pnl.py", "P1: Generate P&L")
    run("project1/generate_cashflow.py", "P1: Generate Cash Flow")
    run("project1/generate_working_capital.py", "P1: Generate Working Capital")
    run("project1/inject_quality_issues.py", "P1: Inject Quality Issues")
    run("project1/validate_realism.py", "P1: Validate Realism")

    # Project 2: Organizational Model
    run("project2/build_org_model.py", "P2: Build Org Model")
    run("project2/calibrate_coefficients.py", "P2: Calibrate Coefficients")
    run("project2/generate_scenarios.py", "P2: Generate Scenarios")

    # Project 3: Budget vs. Actuals
    run("project3/generate_budget.py", "P3: Generate Budget")
    run("project3/generate_actuals.py", "P3: Generate Actuals")
    run("project3/inject_anomalies.py", "P3: Inject Anomalies")
    run("project3/validate_realism.py", "P3: Validate Realism")

    # Verify outputs
    public_data = os.path.join(ROOT, "..", "public", "data")
    expected_files = [
        "corporate_pnl_raw.csv",
        "corporate_cashflow_raw.csv",
        "corporate_working_capital_raw.csv",
        "org_model.json",
        "scenario_presets.json",
        "budget_fy2025.csv",
        "actuals_fy2025.csv",
    ]

    print(f"\n{'='*60}")
    print("  OUTPUT VERIFICATION")
    print(f"{'='*60}")
    all_exist = True
    for f in expected_files:
        path = os.path.join(public_data, f)
        exists = os.path.exists(path)
        size = os.path.getsize(path) if exists else 0
        status = "OK" if exists else "MISSING"
        print(f"  [{status}] {f} ({size:,} bytes)")
        all_exist &= exists

    if not all_exist:
        print("\nFAILED: Missing output files")
        sys.exit(1)

    print(f"\n{'='*60}")
    print("  PHASE 0 COMPLETE — All datasets generated and validated")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
