#!/usr/bin/env python3
"""
BCC AI System — Agency Pulse

Generates a formatted status report for CEO Telegram delivery.
Called when Florian types /status or "system status".

Usage:
    python agency_pulse.py  # Returns formatted Telegram message
"""

import json
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent.parent
STATE_FILE = ROOT / "logs" / "pipeline_state.json"
METRICS_FILE = ROOT / "logs" / "metrics.json"


def load_json(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text())
    return {}


def generate_pulse() -> str:
    """Generate the Agency Pulse report."""
    state = load_json(STATE_FILE)
    metrics = load_json(METRICS_FILE)
    pipelines = state.get("pipelines", {})

    # Categorize pipelines
    active = []
    awaiting_review = []
    completed = []
    failed = []

    for pid, p in pipelines.items():
        status = p.get("status", "?")
        client = p.get("client", "?")
        if status in ("NEW", "GENERATING", "JUDGING"):
            active.append((pid, client, status))
        elif status in ("READY", "DELIVERED"):
            awaiting_review.append((pid, client, status))
        elif status in ("COMPLETE", "APPROVED", "PRODUCED"):
            completed.append((pid, client))
        elif status == "FAILED":
            failed.append((pid, client))

    # Build report
    now = datetime.now().strftime("%H:%M")
    report = f"📊 **Agency Pulse** | {now}\n\n"

    # Active
    if active:
        report += "🔄 **In Arbeit:**\n"
        for pid, client, status in active:
            emoji = {"NEW": "📥", "GENERATING": "📝", "JUDGING": "⚖️"}.get(status, "🔄")
            report += f"  {emoji} {client} — {status}\n"
        report += "\n"
    
    # Awaiting review
    if awaiting_review:
        report += "👀 **Warten auf dein Review:**\n"
        for pid, client, status in awaiting_review:
            report += f"  📨 {client} — Konzepte bereit\n"
        report += "\n"
    else:
        report += "✅ **Keine offenen Reviews**\n\n"

    # Today's stats
    total = metrics.get("total_scored", 0)
    passed = metrics.get("concepts_passed", 0)
    pass_rate = (passed / total * 100) if total else 0
    avg_score = metrics.get("avg_score", 0)
    briefs = metrics.get("briefs_processed", 0)
    approvals = metrics.get("approvals", 0)
    golden = metrics.get("golden_examples", 0)
    retries = metrics.get("quality_loop_retries", 0)
    errors = metrics.get("api_errors", 0)

    # Estimate human hours saved (avg 4h per concept set)
    hours_saved = briefs * 4

    report += "📈 **System Stats:**\n"
    report += f"  📝 Briefs verarbeitet: {briefs}\n"
    report += f"  🎨 Konzepte bewertet: {total}\n"
    report += f"  ✅ Pass Rate: {pass_rate:.0f}%\n"
    report += f"  📊 Ø Score: {avg_score}/5\n"
    report += f"  🔄 Auto-Retries: {retries}\n"
    report += f"  👍 Approvals: {approvals}\n"
    report += f"  🧠 Golden Examples: {golden}\n"
    
    if errors > 0:
        report += f"  ⚠️ API Errors: {errors}\n"
    
    report += f"\n⏱️ **Geschätzte Zeitersparnis:** ~{hours_saved}h Menschenarbeit"
    
    if completed:
        report += f"\n🏁 **Abgeschlossen:** {len(completed)} Pipelines"
    if failed:
        report += f"\n❌ **Fehlgeschlagen:** {len(failed)}"

    return report


if __name__ == "__main__":
    print(generate_pulse())
