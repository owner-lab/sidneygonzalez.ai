"""Build organizational model with divisions, KPIs, interdependencies, and Sankey view."""

import sys
import os
import json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

PUBLIC_DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "public", "data")


def build_model():
    model = {
        "company": "Meridian Technologies",
        "model_version": "1.0",
        "model_disclaimer": (
            "Model coefficients are illustrative. In production, these would be "
            "calibrated from your organization's historical data. Methodology "
            "references cited in documentation."
        ),
        "divisions": {
            "sales": {
                "label": "Sales",
                "kpis": [
                    {"id": "pipeline_value", "label": "Pipeline Value ($M)", "baseline": 45.0, "unit": "millions_usd"},
                    {"id": "win_rate", "label": "Win Rate (%)", "baseline": 28.0, "unit": "percent"},
                    {"id": "avg_deal_size", "label": "Avg Deal Size ($K)", "baseline": 185.0, "unit": "thousands_usd"},
                    {"id": "sales_cycle_days", "label": "Sales Cycle (days)", "baseline": 92, "unit": "days"},
                ],
            },
            "marketing": {
                "label": "Marketing",
                "kpis": [
                    {"id": "marketing_spend", "label": "Marketing Spend ($M)", "baseline": 8.5, "unit": "millions_usd"},
                    {"id": "mqls_per_month", "label": "MQLs/Month", "baseline": 1200, "unit": "count"},
                    {"id": "cac", "label": "Customer Acquisition Cost ($)", "baseline": 8500, "unit": "usd"},
                    {"id": "brand_awareness", "label": "Brand Awareness Index", "baseline": 62.0, "unit": "index_0_100"},
                ],
            },
            "engineering": {
                "label": "Engineering & Product",
                "kpis": [
                    {"id": "eng_headcount", "label": "Engineering Headcount", "baseline": 85, "unit": "count"},
                    {"id": "feature_velocity", "label": "Features Shipped/Quarter", "baseline": 12, "unit": "count"},
                    {"id": "platform_uptime", "label": "Platform Uptime (%)", "baseline": 99.7, "unit": "percent"},
                    {"id": "product_nps", "label": "Product NPS", "baseline": 42, "unit": "score"},
                ],
            },
            "operations": {
                "label": "Operations",
                "kpis": [
                    {"id": "ops_budget", "label": "Operations Budget ($M)", "baseline": 12.0, "unit": "millions_usd"},
                    {"id": "fulfillment_rate", "label": "Fulfillment Rate (%)", "baseline": 96.5, "unit": "percent"},
                    {"id": "csat", "label": "Customer Satisfaction", "baseline": 4.2, "unit": "score_1_5"},
                    {"id": "churn_rate", "label": "Monthly Churn Rate (%)", "baseline": 1.8, "unit": "percent"},
                ],
            },
            "finance": {
                "label": "Finance",
                "kpis": [
                    {"id": "dso", "label": "DSO (days)", "baseline": 48, "unit": "days"},
                    {"id": "operating_margin", "label": "Operating Margin (%)", "baseline": 18.5, "unit": "percent"},
                    {"id": "free_cash_flow", "label": "Free Cash Flow ($M)", "baseline": 12.0, "unit": "millions_usd"},
                ],
            },
        },
        "interdependencies": [
            # Marketing chain
            {
                "from_kpi": "marketing_spend",
                "to_kpi": "mqls_per_month",
                "coefficient": 0.65,
                "sigma": 0.12,
                "lag_months": 1,
                "relationship": "proportional",
                "source": "HubSpot State of Inbound Marketing Report",
                "notes": "Diminishing returns at high spend levels; 15% spend change -> ~10% MQL change",
            },
            {
                "from_kpi": "mqls_per_month",
                "to_kpi": "pipeline_value",
                "coefficient": 0.55,
                "sigma": 0.10,
                "lag_months": 2,
                "relationship": "proportional",
                "source": "Forrester B2B Marketing Benchmark Study",
                "notes": "MQL-to-SQL conversion ~13%, SQL-to-pipeline ~40-50%",
            },
            {
                "from_kpi": "pipeline_value",
                "to_kpi": "win_rate",
                "coefficient": -0.15,
                "sigma": 0.05,
                "lag_months": 1,
                "relationship": "inverse",
                "source": "CSO Insights Sales Performance Study",
                "notes": "Larger pipeline slightly dilutes win rate (more early-stage deals)",
            },
            {
                "from_kpi": "marketing_spend",
                "to_kpi": "brand_awareness",
                "coefficient": 0.40,
                "sigma": 0.08,
                "lag_months": 3,
                "relationship": "proportional",
                "source": "Nielsen Brand Resonance Framework",
                "notes": "Brand awareness moves slowly; takes 1+ quarters to shift",
            },
            {
                "from_kpi": "marketing_spend",
                "to_kpi": "cac",
                "coefficient": -0.30,
                "sigma": 0.07,
                "lag_months": 2,
                "relationship": "inverse",
                "source": "ProfitWell SaaS Benchmarks",
                "notes": "More spend improves efficiency (volume discounts, brand lift)",
            },
            # Engineering chain
            {
                "from_kpi": "eng_headcount",
                "to_kpi": "feature_velocity",
                "coefficient": 0.30,
                "sigma": 0.10,
                "lag_months": 3,
                "relationship": "proportional",
                "source": "Brooks's Law (The Mythical Man-Month); Accelerate (Forsgren et al.)",
                "notes": "Sub-linear: hiring 10% more engineers yields ~3% more features after ramp-up",
            },
            {
                "from_kpi": "feature_velocity",
                "to_kpi": "product_nps",
                "coefficient": 0.40,
                "sigma": 0.08,
                "lag_months": 2,
                "relationship": "proportional",
                "source": "Pragmatic Institute Product Management Benchmarks",
                "notes": "More features (when relevant) improve product satisfaction",
            },
            {
                "from_kpi": "product_nps",
                "to_kpi": "win_rate",
                "coefficient": 0.25,
                "sigma": 0.06,
                "lag_months": 1,
                "relationship": "proportional",
                "source": "Bain & Company NPS-to-Growth Correlation Studies",
                "notes": "Higher NPS drives referrals and competitive positioning",
            },
            {
                "from_kpi": "feature_velocity",
                "to_kpi": "platform_uptime",
                "coefficient": -0.10,
                "sigma": 0.03,
                "lag_months": 1,
                "relationship": "inverse",
                "source": "Accelerate (Forsgren, Humble, Kim)",
                "notes": "Faster shipping can temporarily reduce stability unless balanced with quality",
            },
            # Operations chain
            {
                "from_kpi": "ops_budget",
                "to_kpi": "fulfillment_rate",
                "coefficient": 0.70,
                "sigma": 0.12,
                "lag_months": 1,
                "relationship": "proportional_with_floor",
                "floor": 85.0,
                "source": "Operations management queuing theory; capacity utilization curves",
                "notes": "Budget cuts below threshold cause exponential fulfillment degradation",
            },
            {
                "from_kpi": "fulfillment_rate",
                "to_kpi": "csat",
                "coefficient": 0.80,
                "sigma": 0.10,
                "lag_months": 1,
                "relationship": "proportional",
                "source": "ACSI Methodology (American Customer Satisfaction Index)",
                "notes": "Fulfillment is the #1 driver of B2B customer satisfaction",
            },
            {
                "from_kpi": "csat",
                "to_kpi": "churn_rate",
                "coefficient": -0.50,
                "sigma": 0.08,
                "lag_months": 2,
                "relationship": "inverse",
                "source": "Reichheld loyalty/churn research (Harvard Business Review)",
                "notes": "Satisfaction decrease drives churn increase with 2-month lag",
            },
            {
                "from_kpi": "churn_rate",
                "to_kpi": "pipeline_value",
                "coefficient": -0.35,
                "sigma": 0.06,
                "lag_months": 3,
                "relationship": "inverse",
                "source": "SaaS metrics: churn reduces expansion revenue and referrals",
                "notes": "Higher churn reduces upsell pipeline and word-of-mouth leads",
            },
            # Finance chain
            {
                "from_kpi": "dso",
                "to_kpi": "free_cash_flow",
                "coefficient": -0.28,
                "sigma": 0.05,
                "lag_months": 1,
                "relationship": "inverse",
                "source": "Derived: $200M revenue / 365 = ~$548K per DSO day",
                "notes": "Each day of DSO reduction frees ~$548K in working capital",
            },
            {
                "from_kpi": "free_cash_flow",
                "to_kpi": "eng_headcount",
                "coefficient": 0.25,
                "sigma": 0.08,
                "lag_months": 2,
                "relationship": "proportional",
                "source": "Corporate treasury reinvestment allocation norms",
                "notes": "~60% of FCF improvement allocated to reinvestment; engineering gets ~40% of that",
            },
            {
                "from_kpi": "free_cash_flow",
                "to_kpi": "marketing_spend",
                "coefficient": 0.20,
                "sigma": 0.06,
                "lag_months": 2,
                "relationship": "proportional",
                "source": "Corporate treasury reinvestment allocation norms",
                "notes": "~60% of FCF improvement to reinvestment; marketing gets ~30% of that",
            },
        ],
    }

    # Build Sankey-ready view for Nivo
    nodes = set()
    links = []
    for edge in model["interdependencies"]:
        nodes.add(edge["from_kpi"])
        nodes.add(edge["to_kpi"])
        links.append({
            "source": edge["from_kpi"],
            "target": edge["to_kpi"],
            "value": abs(edge["coefficient"]),
        })

    model["sankey"] = {
        "nodes": [{"id": node} for node in sorted(nodes)],
        "links": links,
    }

    os.makedirs(PUBLIC_DATA, exist_ok=True)
    output_path = os.path.join(PUBLIC_DATA, "org_model.json")
    with open(output_path, "w") as f:
        json.dump(model, f, indent=2)

    print(f"Org model generated: {len(model['divisions'])} divisions, "
          f"{sum(len(d['kpis']) for d in model['divisions'].values())} KPIs, "
          f"{len(model['interdependencies'])} edges -> {output_path}")
    return model


if __name__ == "__main__":
    build_model()
