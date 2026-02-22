#!/usr/bin/env python3
"""
BCC Community Manager — Engagement Engine

Processes comment batches and generates reply sheets + sentiment reports.

Usage:
    python main.py --comments comments.json --brand SIXT
    python main.py --comments comments.json --brand Porsche --post-context "Taycan launch video"
    python main.py --test  # Run with sample data
"""

import os
import sys
import json
import argparse
import subprocess
import tempfile
import re
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
SKILL_FILE = SCRIPT_DIR / "SKILL.md"


def load_skill_body() -> str:
    if SKILL_FILE.exists():
        text = SKILL_FILE.read_text(encoding="utf-8")
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                return parts[2][:3000]
    return ""


def call_claude(prompt: str, timeout: int = 90) -> str:
    with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as tf:
        tf.write(prompt)
        tf_path = tf.name
    try:
        r = subprocess.run(
            f'cat "{tf_path}" | claude -p -',
            shell=True, capture_output=True, text=True, timeout=timeout
        )
        os.unlink(tf_path)
        return (r.stdout or "").strip()
    except subprocess.TimeoutExpired:
        try: os.unlink(tf_path)
        except: pass
        return ""


def process_comments(comments: list, brand: str, post_context: str = "") -> dict:
    """Process a batch of comments and generate reply sheet + sentiment report."""
    skill = load_skill_body()

    # Format comments for prompt
    comments_text = "\n".join(
        f"- @{c.get('username', 'anon')}: \"{c.get('text', '')}\" ({c.get('likes', 0)} likes)"
        for c in comments[:30]  # Max 30 per batch
    )

    prompt = f"""{skill[:2000]}

## TASK
Process these {len(comments)} comments for **{brand}**.
{"Post context: " + post_context if post_context else ""}

## COMMENTS
{comments_text}

Generate:
1. **Reply Sheet** — For each comment: Sentiment emoji, suggested reply (<150 chars), and any [ESCORT_TO_HUMAN] flags
2. **Sentiment Summary** — % positive/neutral/negative, top themes, escalations

Output format:
## Reply Sheet
| # | User | Sentiment | Suggested Reply | Flag |
|---|------|-----------|-----------------|------|

## Sentiment Summary
- Positive: X%
- Neutral: X%
- Negative: X%
- Escalations: X
- Top themes: ...
"""

    result = call_claude(prompt)

    # Parse escalations
    escalations = []
    if "[ESCORT_TO_HUMAN]" in result:
        for line in result.split("\n"):
            if "ESCORT_TO_HUMAN" in line:
                escalations.append(line.strip())

    return {
        "reply_sheet": result,
        "brand": brand,
        "comment_count": len(comments),
        "escalations": escalations,
        "generated_at": datetime.now().isoformat(),
    }


def generate_sample_data() -> list:
    """Generate sample comment data for testing."""
    return [
        {"username": "sarah_muc", "text": "Mega Video! 🔥 Will den sofort haben", "likes": 45},
        {"username": "autofan_de", "text": "Was kostet der in der Basisversion?", "likes": 12},
        {"username": "berlin_beats", "text": "Wer fährt um 5:47 freiwillig Auto? 😂", "likes": 89},
        {"username": "green_driver", "text": "Reichweite? Bei dem Preis erwarte ich 500km+", "likes": 23},
        {"username": "hater_2026", "text": "Überteuert. Für das Geld krieg ich nen Tesla", "likes": 5},
        {"username": "design_lover", "text": "Die Cinematography ist INSANE. Wer hat das produziert?", "likes": 67},
        {"username": "muenchen_local", "text": "Leopoldstraße spotted! 📍 Grüße aus Schwabing", "likes": 34},
        {"username": "investor_frank", "text": "Porsche weiß wie man Marketing macht. Aktie kaufen!", "likes": 8},
        {"username": "karli_complaints", "text": "Service bei Porsche ist eine Katastrophe. 3x in der Werkstatt!", "likes": 15},
        {"username": "ev_skeptiker", "text": "E-Autos sind Schrott. In 5 Jahren lacht jeder drüber", "likes": 3},
        {"username": "fashion_lisa", "text": "OK aber wo ist die Jacke her?? 🧥", "likes": 156},
        {"username": "porsche_club_de", "text": "Teilt das gerne in unserer Community! Geniale Arbeit.", "likes": 201},
    ]


def format_telegram_alert(escalation: dict) -> str:
    """Format an escalation alert for Telegram."""
    return (
        f"🚨 **COMMUNITY ALERT — {escalation.get('brand', '?')}**\n\n"
        f"User: @{escalation.get('username', '?')}\n"
        f"Kommentar: \"{escalation.get('text', '?')}\"\n"
        f"Grund: {escalation.get('reason', 'Flagged by AI')}\n\n"
        f"⚡ Bitte manuell prüfen."
    )


def format_community_pulse(results: list) -> str:
    """Format community health for Telegram /community command."""
    report = "📱 **Community Health**\n\n"
    for r in results:
        brand = r.get("brand", "?")
        count = r.get("comment_count", 0)
        escalations = len(r.get("escalations", []))
        alert = f" | 🚨 {escalations} Eskalation(en)" if escalations else ""
        report += f"• **{brand}**: {count} Kommentare verarbeitet{alert}\n"
    return report


def main():
    parser = argparse.ArgumentParser(description="BCC Community Manager — Engagement Engine")
    parser.add_argument("--comments", type=str, help="JSON file with comments")
    parser.add_argument("--brand", type=str, default="Unknown", help="Brand name")
    parser.add_argument("--post-context", type=str, default="", help="Post description")
    parser.add_argument("--output", type=str, help="Output file for reply sheet")
    parser.add_argument("--test", action="store_true", help="Run with sample data")
    args = parser.parse_args()

    if args.test:
        print("🧪 Running Community Manager test with sample Porsche comments...\n")
        comments = generate_sample_data()
        result = process_comments(comments, "Porsche", "Taycan 'Morgens, 5:47' TikTok launch video")

        if args.output:
            Path(args.output).write_text(result["reply_sheet"], encoding="utf-8")
            print(f"📁 Reply sheet saved to: {args.output}")
        else:
            print(result["reply_sheet"])

        if result["escalations"]:
            print(f"\n🚨 {len(result['escalations'])} ESCALATION(S) DETECTED:")
            for e in result["escalations"]:
                print(f"  {e}")
        return

    if args.comments:
        comments = json.loads(Path(args.comments).read_text())
        result = process_comments(comments, args.brand, args.post_context)

        if args.output:
            Path(args.output).write_text(result["reply_sheet"], encoding="utf-8")
            print(f"📁 Reply sheet saved to: {args.output}")
        else:
            print(result["reply_sheet"])
    else:
        parser.print_help()
        print("\n💡 Try: python main.py --test")


if __name__ == "__main__":
    main()
