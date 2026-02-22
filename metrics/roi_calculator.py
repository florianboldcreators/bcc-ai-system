#!/usr/bin/env python3
"""
BCC AI System — ROI Calculator & Financial Engine

Calculates cost savings, efficiency gains, and transformation progress.
Generates FINANCIAL_REPORT.md and provides /finance Telegram output.

BCC Benchmarks based on:
- 40 employees, avg salary €3,500/month (Lima/Manila) to €5,500/month (Munich)
- Content production: ~40 pieces/month
- Target: 5 employees in 12 months

Usage:
    python roi_calculator.py                    # Generate financial report
    python roi_calculator.py --telegram         # Telegram-formatted summary
    python roi_calculator.py --update-actuals   # Pull from Clockify
"""

import json
import sys
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent
METRICS_FILE = ROOT / "logs" / "metrics.json"
REPORT_FILE = SCRIPT_DIR / "FINANCIAL_REPORT.md"

# --- BCC Human Benchmarks (hours per task) ---
HUMAN_BENCHMARKS = {
    "concept_generation": {
        "task": "Concept Generation (3 variants + brief analysis)",
        "human_hours": 16,  # 2 working days
        "human_role": "Creative Lead (Hopper)",
        "human_hourly_rate": 45,  # €45/h (loaded cost, Munich)
    },
    "production_planning": {
        "task": "Production Package (shot list, budget, schedule)",
        "human_hours": 8,  # 1 working day
        "human_role": "Producer (Mert)",
        "human_hourly_rate": 40,
    },
    "post_production_brief": {
        "task": "Post-Production Blueprint (edit plan, sound, color)",
        "human_hours": 4,  # Half day
        "human_role": "Editor (Malorie)",
        "human_hourly_rate": 35,
    },
    "quality_review": {
        "task": "Quality Review & Scoring",
        "human_hours": 2,
        "human_role": "Creative Director",
        "human_hourly_rate": 60,
    },
}

# AI costs (estimated per task)
AI_COSTS = {
    "concept_generation": {
        "api_cost": 0.50,  # ~3 Claude calls × $0.15 each + overhead
        "time_minutes": 4,
    },
    "production_planning": {
        "api_cost": 0.15,
        "time_minutes": 2,
    },
    "post_production_brief": {
        "api_cost": 0.15,
        "time_minutes": 2,
    },
    "quality_review": {
        "api_cost": 0.10,
        "time_minutes": 1,
    },
}

# BCC Team Structure (current vs target)
TEAM = {
    "current": {
        "headcount": 40,
        "monthly_cost": 120000,  # Estimated total payroll
        "roles": {
            "Creative Lead": {"count": 2, "monthly": 5500},
            "Producer": {"count": 3, "monthly": 4500},
            "Editor": {"count": 5, "monthly": 3500},
            "Community Manager": {"count": 3, "monthly": 3000},
            "Ads Specialist": {"count": 2, "monthly": 4000},
            "Account Manager": {"count": 3, "monthly": 4500},
            "Strategy": {"count": 2, "monthly": 6000},
            "Other": {"count": 20, "monthly": 3000},
        }
    },
    "target": {
        "headcount": 5,
        "roles": ["CEO", "CTO/AI Ops", "Account Director", "Senior Producer", "Finance"],
    }
}

# Clones built and their automation %
CLONES_BUILT = {
    "Creative Lead": {"status": "v1.1.0-stable", "automation_pct": 85, "monthly_savings": 5500},
    "Producer": {"status": "v0.1.0-draft", "automation_pct": 40, "monthly_savings": 1800},
    "Editor": {"status": "v0.1.0-draft", "automation_pct": 30, "monthly_savings": 1050},
    "LLM Judge": {"status": "v1.0", "automation_pct": 90, "monthly_savings": 2000},
}


def load_metrics() -> dict:
    if METRICS_FILE.exists():
        return json.loads(METRICS_FILE.read_text())
    return {}


def calculate_savings(metrics: dict) -> dict:
    """Calculate total savings based on processed tasks."""
    briefs = metrics.get("briefs_processed", 0)
    approvals = metrics.get("approvals", 0)

    # Each brief processed saves concept generation time
    concept_human_cost = HUMAN_BENCHMARKS["concept_generation"]["human_hours"] * \
                         HUMAN_BENCHMARKS["concept_generation"]["human_hourly_rate"]
    concept_ai_cost = AI_COSTS["concept_generation"]["api_cost"]
    concept_savings_per_brief = concept_human_cost - concept_ai_cost

    # Each approval triggers producer savings
    producer_human_cost = HUMAN_BENCHMARKS["production_planning"]["human_hours"] * \
                          HUMAN_BENCHMARKS["production_planning"]["human_hourly_rate"]
    producer_ai_cost = AI_COSTS["production_planning"]["api_cost"]
    producer_savings_per_approval = producer_human_cost - producer_ai_cost

    total_savings = (briefs * concept_savings_per_brief) + \
                    (approvals * producer_savings_per_approval)

    total_ai_cost = (briefs * concept_ai_cost) + (approvals * producer_ai_cost)

    human_hours_saved = (briefs * HUMAN_BENCHMARKS["concept_generation"]["human_hours"]) + \
                        (approvals * HUMAN_BENCHMARKS["production_planning"]["human_hours"])

    ai_minutes = (briefs * AI_COSTS["concept_generation"]["time_minutes"]) + \
                 (approvals * AI_COSTS["production_planning"]["time_minutes"])

    efficiency_multiplier = (human_hours_saved * 60) / max(ai_minutes, 1)

    # Monthly projection
    monthly_clone_savings = sum(c["monthly_savings"] for c in CLONES_BUILT.values())
    ai_monthly_cost = 100  # Estimated

    # Transformation progress
    roles_automated = len(CLONES_BUILT)
    total_roles = 8  # All roles to automate
    transformation_pct = (roles_automated / total_roles) * 100

    return {
        "total_savings_eur": round(total_savings, 2),
        "total_ai_cost_eur": round(total_ai_cost, 2),
        "net_savings_eur": round(total_savings - total_ai_cost, 2),
        "human_hours_saved": round(human_hours_saved, 1),
        "ai_minutes_spent": ai_minutes,
        "efficiency_multiplier": round(efficiency_multiplier, 0),
        "monthly_projected_savings": monthly_clone_savings - ai_monthly_cost,
        "annual_projected_savings": (monthly_clone_savings - ai_monthly_cost) * 12,
        "transformation_pct": round(transformation_pct, 0),
        "roles_automated": roles_automated,
        "total_roles": total_roles,
        "briefs_processed": briefs,
        "roi_pct": round((total_savings / max(total_ai_cost, 0.01)) * 100, 0),
    }


def generate_report(savings: dict, metrics: dict) -> str:
    """Generate the full financial report."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    report = f"""# 💰 BCC AI System — Financial Report

*Generated: {now}*

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Savings** | **€{savings['net_savings_eur']:,.2f}** |
| **Human Hours Saved** | **{savings['human_hours_saved']}h** |
| **AI Cost** | €{savings['total_ai_cost_eur']:,.2f} |
| **ROI** | {savings['roi_pct']:,.0f}% |
| **Efficiency Multiplier** | {savings['efficiency_multiplier']:,.0f}x faster |
| **Transformation Progress** | {savings['transformation_pct']:.0f}% ({savings['roles_automated']}/{savings['total_roles']} roles) |

---

## Monthly Projection

| Item | Monthly | Annual |
|------|---------|--------|
| Clone Savings (4 agents) | €{sum(c['monthly_savings'] for c in CLONES_BUILT.values()):,} | €{sum(c['monthly_savings'] for c in CLONES_BUILT.values()) * 12:,} |
| AI Infrastructure Cost | -€100 | -€1,200 |
| **Net Monthly Savings** | **€{savings['monthly_projected_savings']:,}** | **€{savings['annual_projected_savings']:,}** |

---

## Role Automation Status

| Role | AI Clone | Status | Automation % | Monthly Savings |
|------|----------|--------|-------------|-----------------|
"""
    
    for role, data in CLONES_BUILT.items():
        bar = "█" * (data["automation_pct"] // 10) + "░" * (10 - data["automation_pct"] // 10)
        report += f"| {role} | ✅ Built | {data['status']} | [{bar}] {data['automation_pct']}% | €{data['monthly_savings']:,} |\n"
    
    # Unbuilt roles
    unbuilt = ["Community Manager", "Ads Specialist", "Account Manager", "Strategy"]
    for role in unbuilt:
        report += f"| {role} | ⏳ Planned | — | [░░░░░░░░░░] 0% | — |\n"
    
    report += f"""
---

## Cost Comparison: Human vs AI

| Task | Human Time | Human Cost | AI Time | AI Cost | Savings |
|------|-----------|------------|---------|---------|---------|
"""
    
    for task_key, human in HUMAN_BENCHMARKS.items():
        ai = AI_COSTS[task_key]
        human_cost = human["human_hours"] * human["human_hourly_rate"]
        savings_pct = ((human_cost - ai["api_cost"]) / human_cost) * 100
        report += (
            f"| {human['task']} | {human['human_hours']}h | €{human_cost} | "
            f"{ai['time_minutes']}min | €{ai['api_cost']:.2f} | {savings_pct:.0f}% |\n"
        )
    
    report += f"""
---

## Transformation Roadmap: 40 → 5

**Current:** {TEAM['current']['headcount']} employees | **Target:** {TEAM['target']['headcount']} employees
**Progress:** {savings['transformation_pct']:.0f}%

```
[{'█' * (int(savings['transformation_pct']) // 5)}{'░' * (20 - int(savings['transformation_pct']) // 5)}] {savings['transformation_pct']:.0f}%
 Phase 1 (Now)     Phase 2 (Q2)    Phase 3 (Q3-Q4)
 Creative Lead     Community Mgr   Full Automation
 + Producer        + Ads Spec      + Account Mgmt
 + Editor          + Strategy      + Finance
```

**Target Team (5 people):**
{chr(10).join(f"- {r}" for r in TEAM['target']['roles'])}

---

*This report updates automatically when the Orchestrator processes briefs.*
"""
    return report


def telegram_summary(savings: dict) -> str:
    """Generate Telegram-formatted finance summary."""
    return f"""💰 **BCC Financial Health**

💵 Gesamtersparnis: **€{savings['net_savings_eur']:,.2f}**
📈 Effizienzsteigerung: **{savings['efficiency_multiplier']:,.0f}x** schneller
⏱️ Arbeitsstunden gespart: **{savings['human_hours_saved']}h**
🎯 Transformation (40→5): **{savings['transformation_pct']:.0f}%** ({savings['roles_automated']}/{savings['total_roles']} Rollen)

📊 **Monatliche Projektion:**
• Einsparung: €{savings['monthly_projected_savings']:,}/Monat
• Jährlich: €{savings['annual_projected_savings']:,}/Jahr
• AI-Kosten: ~€100/Monat
• ROI: {savings['roi_pct']:,.0f}%

🏗️ **Automatisierte Rollen:**
{''.join(f'{chr(10)}  ✅ {r} ({d["automation_pct"]}%)' for r, d in CLONES_BUILT.items())}
  ⏳ Community Manager (geplant)
  ⏳ Ads Specialist (geplant)
  ⏳ Account Manager (geplant)
  ⏳ Strategy (geplant)"""


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="BCC ROI Calculator")
    parser.add_argument("--telegram", action="store_true", help="Telegram-formatted output")
    parser.add_argument("--update-actuals", action="store_true", help="Pull from Clockify")
    args = parser.parse_args()

    metrics = load_metrics()
    savings = calculate_savings(metrics)

    if args.telegram:
        print(telegram_summary(savings))
    else:
        report = generate_report(savings, metrics)
        REPORT_FILE.write_text(report, encoding="utf-8")
        print(f"📊 Financial report saved to: {REPORT_FILE}")
        print(f"\n{telegram_summary(savings)}")
