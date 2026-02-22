#!/usr/bin/env python3
"""
BCC Creative Lead — Delivery Webhook

Sends generated concepts to Slack or Make.com for human review.
Formats concepts with reaction-based approval workflow.

Usage:
    python deliver_webhook.py concept.md --slack WEBHOOK_URL
    python deliver_webhook.py concept.md --make CATCH_HOOK_URL
    python deliver_webhook.py --test  # dry-run with sample output

Requirements:
    SLACK_WEBHOOK_URL or MAKE_WEBHOOK_URL environment variable (or pass via CLI)
"""

import os
import sys
import json
import argparse
import urllib.request
from pathlib import Path
from datetime import datetime

# --- Configuration ---
SLACK_WEBHOOK_URL = os.environ.get("SLACK_WEBHOOK_URL", "")
MAKE_WEBHOOK_URL = os.environ.get("MAKE_WEBHOOK_URL", "")


def format_slack_message(concept_text: str, metadata: dict = None) -> dict:
    """Format a concept into a rich Slack message with reaction instructions."""
    meta = metadata or {}
    client = meta.get("client", "Unknown")
    brief = meta.get("brief", "Unknown Brief")
    generated = meta.get("generated_at", datetime.now().isoformat())
    judge_score = meta.get("judge_score", "N/A")
    judge_verdict = meta.get("judge_verdict", "PENDING")

    verdict_emoji = {"PASS": "✅", "REVISE": "⚠️", "REJECT": "❌", "PENDING": "⏳"}
    emoji = verdict_emoji.get(judge_verdict, "❓")

    # Truncate concept for Slack (max ~3000 chars per block)
    if len(concept_text) > 2800:
        concept_preview = concept_text[:2800] + "\n\n... _(truncated, full version in Asana)_"
    else:
        concept_preview = concept_text

    return {
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🎨 New Concept: {client} — {brief}",
                    "emoji": True
                }
            },
            {
                "type": "context",
                "elements": [
                    {"type": "mrkdwn", "text": f"*Generated:* {generated[:16]}"},
                    {"type": "mrkdwn", "text": f"*AI Score:* {judge_score}/5 {emoji} {judge_verdict}"},
                ]
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": concept_preview
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": (
                        "*React to review:*\n"
                        "✅ = Approve (send to production)\n"
                        "✏️ = Needs minor edits\n"
                        "🔄 = Regenerate (new variants)\n"
                        "❌ = Reject (off-brand or off-brief)"
                    )
                }
            }
        ]
    }


def format_make_payload(concept_text: str, metadata: dict = None) -> dict:
    """Format a concept as a Make.com webhook payload."""
    meta = metadata or {}
    return {
        "event": "concept_generated",
        "timestamp": datetime.now().isoformat(),
        "client": meta.get("client", "Unknown"),
        "brief": meta.get("brief", "Unknown"),
        "brief_gid": meta.get("brief_gid", ""),
        "judge_score": meta.get("judge_score"),
        "judge_verdict": meta.get("judge_verdict", "PENDING"),
        "concept_markdown": concept_text,
        "variants": meta.get("variants", 3),
        "model": meta.get("model", "claude-sonnet-4-5"),
    }


def send_webhook(url: str, payload: dict) -> bool:
    """POST a JSON payload to a webhook URL."""
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = resp.status
            print(f"✅ Webhook delivered (HTTP {status})")
            return True
    except urllib.error.HTTPError as e:
        print(f"❌ Webhook failed: HTTP {e.code}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"❌ Webhook error: {e}", file=sys.stderr)
        return False


def extract_metadata_from_concept(text: str) -> dict:
    """Try to extract metadata from a concept file's YAML frontmatter or content."""
    import re
    meta = {}

    # Check for YAML frontmatter
    fm_match = re.match(r'^---\s*\n(.*?)\n---', text, re.DOTALL)
    if fm_match:
        for line in fm_match.group(1).split("\n"):
            if ":" in line:
                key, val = line.split(":", 1)
                meta[key.strip()] = val.strip().strip('"\'')

    # Try to extract client from content
    client_match = re.search(r'(?:Client|Kunde|Brand):\s*(\w+)', text, re.IGNORECASE)
    if client_match:
        meta.setdefault("client", client_match.group(1))

    return meta


def deliver_concept(filepath: str, slack_url: str = None, make_url: str = None,
                    dry_run: bool = False) -> bool:
    """Read a concept file and deliver it via webhook."""
    text = Path(filepath).read_text(encoding="utf-8")
    metadata = extract_metadata_from_concept(text)

    success = True

    if slack_url or SLACK_WEBHOOK_URL:
        url = slack_url or SLACK_WEBHOOK_URL
        payload = format_slack_message(text, metadata)
        if dry_run:
            print("📋 Slack payload (dry run):")
            print(json.dumps(payload, indent=2, ensure_ascii=False)[:2000])
        else:
            success = send_webhook(url, payload) and success

    if make_url or MAKE_WEBHOOK_URL:
        url = make_url or MAKE_WEBHOOK_URL
        payload = format_make_payload(text, metadata)
        if dry_run:
            print("📋 Make.com payload (dry run):")
            print(json.dumps(payload, indent=2, ensure_ascii=False)[:2000])
        else:
            success = send_webhook(url, payload) and success

    if not (slack_url or SLACK_WEBHOOK_URL or make_url or MAKE_WEBHOOK_URL):
        print("⚠️  No webhook URL configured. Set SLACK_WEBHOOK_URL or MAKE_WEBHOOK_URL.", file=sys.stderr)
        print("   Or pass --slack URL / --make URL", file=sys.stderr)
        return False

    return success


def main():
    parser = argparse.ArgumentParser(description="Deliver concepts via webhook")
    parser.add_argument("concept", nargs="?", type=str, help="Concept file to deliver")
    parser.add_argument("--slack", type=str, help="Slack webhook URL")
    parser.add_argument("--make", type=str, help="Make.com catch hook URL")
    parser.add_argument("--test", action="store_true", help="Dry run with sample output")
    args = parser.parse_args()

    if args.test:
        sample = "# Sample Concept\n\n## Variant A: Test\nThis is a test concept for SIXT."
        payload = format_slack_message(sample, {"client": "SIXT", "brief": "Summer Campaign",
                                                 "judge_score": 3.2, "judge_verdict": "REVISE"})
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return

    if not args.concept:
        parser.print_help()
        sys.exit(1)

    deliver_concept(args.concept, slack_url=args.slack, make_url=args.make)


if __name__ == "__main__":
    main()
