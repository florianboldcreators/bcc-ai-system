#!/usr/bin/env python3
"""
BCC Producer Clone — Production Package Generator

Takes an approved concept from the Creative Lead and outputs a complete
production package: shot list, equipment, schedule, budget, talent brief.

Usage:
    python main.py --concept path/to/concept.md --variant B
    python main.py --concept path/to/concept.md --variant B --output packages/porsche.md
"""

import os
import sys
import re
import json
import argparse
import subprocess
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
SKILL_FILE = SCRIPT_DIR / "SKILL.md"

# Munich 2026 Pricing (from SKILL.md)
PRICING = {
    "dop_day": {"min": 800, "max": 1200, "label": "DoP (Freelance)"},
    "camera_day": {"min": 500, "max": 800, "label": "Kameramann"},
    "producer_day": {"min": 300, "max": 500, "label": "Producer/PA"},
    "talent_influencer": {"min": 500, "max": 2000, "label": "Talent (Micro-Influencer)"},
    "talent_ugc": {"min": 200, "max": 500, "label": "Talent (UGC Creator)"},
    "studio_half": {"min": 500, "max": 1000, "label": "Studio (halber Tag)"},
    "drone_day": {"min": 500, "max": 800, "label": "Drohne (mit Pilot)"},
    "edit_per_min": {"min": 150, "max": 300, "label": "Schnitt (pro Minute Final)"},
    "color_grade": {"min": 100, "max": 200, "label": "Color Grading"},
}


def extract_variant(concept_text: str, variant_letter: str) -> str:
    """Extract a specific variant from a concept file."""
    pattern = rf'(##\s*Variant\s+{variant_letter}\b.*?)(?=##\s*Variant\s+[A-C]|\Z)'
    match = re.search(pattern, concept_text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return concept_text  # Return full text if variant not found


def extract_metadata(concept_text: str) -> dict:
    """Extract metadata from concept frontmatter."""
    meta = {}
    fm_match = re.match(r'^---\s*\n(.*?)\n---', concept_text, re.DOTALL)
    if fm_match:
        for line in fm_match.group(1).split("\n"):
            if ":" in line:
                key, val = line.split(":", 1)
                meta[key.strip()] = val.strip().strip('"\'')
    return meta


def extract_budget(concept_text: str) -> int:
    """Extract budget from concept text."""
    patterns = [
        r'Budget[:\s]*(?:ca\.?\s*)?€?\s*([\d.,]+)\s*k?',
        r'€([\d.,]+)',
        r'(\d+[\d.,]*)\s*(?:EUR|€)',
    ]
    for p in patterns:
        match = re.search(p, concept_text, re.IGNORECASE)
        if match:
            val = match.group(1).replace('.', '').replace(',', '')
            num = int(val)
            if num < 100:  # Probably in thousands
                num *= 1000
            return num
    return 8000  # Default


def build_producer_prompt(variant_text: str, metadata: dict, budget: int) -> str:
    """Build the prompt for the Producer agent."""
    skill_body = ""
    if SKILL_FILE.exists():
        text = SKILL_FILE.read_text(encoding="utf-8")
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                skill_body = parts[2].strip()

    client = metadata.get("client", "Unknown")
    campaign = metadata.get("campaign", "Campaign")

    return f"""{skill_body}

---

## APPROVED CONCEPT (from Creative Lead)

Client: {client}
Campaign: {campaign}
Budget Limit: €{budget:,}
Platform: TikTok + IG Reels

{variant_text}

---

## YOUR TASK

Create the complete Production Package for this approved concept.
Use the Munich 2026 pricing table. The total budget MUST stay within €{budget:,} (±5% tolerance = max €{int(budget * 1.05):,}).

Output the full Production Package in markdown:
1. Shot List (table format)
2. Equipment List (specific models)
3. Tagesplan / Schedule (table format)
4. Budget Breakdown (table with line items, must add up correctly)
5. Talent Brief
6. Risk Assessment

All text in German where it's client-facing, English for technical notes is OK.
"""


def generate_package(concept_file: str, variant: str, output_file: str = None) -> str:
    """Generate production package using Claude CLI."""
    concept_text = Path(concept_file).read_text(encoding="utf-8")
    metadata = extract_metadata(concept_text)
    variant_text = extract_variant(concept_text, variant)
    budget = extract_budget(concept_text)

    if not variant_text or "Variant" not in variant_text[:50]:
        print(f"⚠️ Could not find Variant {variant} in {concept_file}", file=sys.stderr)
        print("Available variants:", file=sys.stderr)
        for m in re.finditer(r'##\s*Variant\s+([A-C])', concept_text):
            print(f"  - Variant {m.group(1)}", file=sys.stderr)
        return ""

    prompt = build_producer_prompt(variant_text, metadata, budget)

    print(f"🏗️ Generating Production Package...", file=sys.stderr)
    print(f"   Client: {metadata.get('client', '?')}", file=sys.stderr)
    print(f"   Variant: {variant}", file=sys.stderr)
    print(f"   Budget: €{budget:,}", file=sys.stderr)

    # Write prompt to temp file for claude CLI
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as tf:
        tf.write(prompt)
        tf_path = tf.name

    try:
        result = subprocess.run(
            f'cat "{tf_path}" | claude -p -',
            shell=True, capture_output=True, text=True, timeout=180
        )
        output = result.stdout.strip()
        os.unlink(tf_path)

        if not output:
            print("❌ Empty response from Claude", file=sys.stderr)
            return ""

        # Add metadata header
        header = f"""---
type: production-package
source_concept: "{Path(concept_file).name}"
variant: "{variant}"
client: "{metadata.get('client', 'Unknown')}"
campaign: "{metadata.get('campaign', 'Unknown')}"
budget_limit: {budget}
generated_at: "{datetime.now().isoformat()}"
---

"""
        full_output = header + output

        if output_file:
            out_path = Path(output_file)
            out_path.parent.mkdir(parents=True, exist_ok=True)
            out_path.write_text(full_output, encoding="utf-8")
            print(f"✅ Package saved to: {output_file}", file=sys.stderr)

        return full_output

    except subprocess.TimeoutExpired:
        print("❌ Claude CLI timeout (180s)", file=sys.stderr)
        try:
            os.unlink(tf_path)
        except:
            pass
        return ""
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        return ""


def main():
    parser = argparse.ArgumentParser(description="BCC Producer — Generate Production Package")
    parser.add_argument("--concept", "-c", required=True, help="Path to approved concept file")
    parser.add_argument("--variant", "-v", required=True, help="Variant letter (A/B/C)")
    parser.add_argument("--output", "-o", help="Output file path")
    args = parser.parse_args()

    output = generate_package(args.concept, args.variant, args.output)

    if output and not args.output:
        print(output)


if __name__ == "__main__":
    main()
