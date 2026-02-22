#!/usr/bin/env python3
"""
BCC Editor Clone — Post-Production Blueprint Generator

Takes an approved concept + production package and outputs a detailed
post-production blueprint for video editors.

Usage:
    python main.py --concept path/to/concept.md --package path/to/package.md --variant B
    python main.py --concept concept.md --package package.md --variant B --output blueprints/edit.md
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


def load_skill_body() -> str:
    """Load the Editor persona from SKILL.md."""
    if SKILL_FILE.exists():
        text = SKILL_FILE.read_text(encoding="utf-8")
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                return parts[2].strip()
    return ""


def extract_variant(text: str, variant: str) -> str:
    """Extract a specific variant section."""
    pattern = rf'(##\s*Variant\s+{variant}\b.*?)(?=##\s*Variant\s+[A-C]|\Z)'
    match = re.search(pattern, text, re.DOTALL)
    return match.group(1).strip() if match else text


def extract_metadata(text: str) -> dict:
    """Extract YAML frontmatter metadata."""
    meta = {}
    fm = re.match(r'^---\s*\n(.*?)\n---', text, re.DOTALL)
    if fm:
        for line in fm.group(1).split("\n"):
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip().strip('"\'')
    return meta


def build_editor_prompt(concept_variant: str, package_text: str, metadata: dict) -> str:
    """Build the prompt for the Editor agent."""
    skill = load_skill_body()
    client = metadata.get("client", "Unknown")
    campaign = metadata.get("campaign", "Unknown")

    return f"""{skill}

---

## CONTEXT

Client: {client}
Campaign: {campaign}

## APPROVED CONCEPT (from Creative Lead)

{concept_variant}

## PRODUCTION PACKAGE (from Producer)

{package_text}

---

## YOUR TASK

Create the complete Post-Production Blueprint for this project.
The blueprint must be detailed enough for a Junior Editor to execute in Premiere Pro or DaVinci Resolve without asking questions.

Include ALL sections:
1. Pacing & Rhythm Guide (second-by-second cut plan with timecodes)
2. Sound Design & Music (specific SFX, ambient layers, music rules)
3. Motion Graphics & Typography (exact fonts, sizes, positions, animations)
4. Color Grading (LUT basis, contrast, temperature, skin tones)
5. Retention Triggers (where and how to keep viewers watching)
6. Export Settings (formats, codecs, bitrates per platform)
7. Quality Self-Check

All text overlays and client-facing content in German.
Technical notes in English are OK.
"""


def generate_blueprint(concept_file: str, package_file: str, variant: str,
                       output_file: str = None) -> str:
    """Generate post-production blueprint using Claude CLI."""
    concept_text = Path(concept_file).read_text(encoding="utf-8")
    package_text = Path(package_file).read_text(encoding="utf-8")
    metadata = extract_metadata(concept_text)
    metadata.update(extract_metadata(package_text))
    concept_variant = extract_variant(concept_text, variant)

    prompt = build_editor_prompt(concept_variant, package_text, metadata)

    print(f"🎬 Generating Post-Production Blueprint...", file=sys.stderr)
    print(f"   Client: {metadata.get('client', '?')}", file=sys.stderr)
    print(f"   Variant: {variant}", file=sys.stderr)

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
            print("❌ Empty response", file=sys.stderr)
            return ""

        header = f"""---
type: post-production-blueprint
source_concept: "{Path(concept_file).name}"
source_package: "{Path(package_file).name}"
variant: "{variant}"
client: "{metadata.get('client', 'Unknown')}"
campaign: "{metadata.get('campaign', 'Unknown')}"
generated_at: "{datetime.now().isoformat()}"
---

"""
        full = header + output

        if output_file:
            out = Path(output_file)
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(full, encoding="utf-8")
            print(f"✅ Blueprint saved to: {output_file}", file=sys.stderr)

        return full

    except subprocess.TimeoutExpired:
        print("❌ Timeout", file=sys.stderr)
        try: os.unlink(tf_path)
        except: pass
        return ""
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        return ""


def main():
    parser = argparse.ArgumentParser(description="BCC Editor — Post-Production Blueprint")
    parser.add_argument("--concept", "-c", required=True, help="Approved concept file")
    parser.add_argument("--package", "-p", required=True, help="Production package file")
    parser.add_argument("--variant", "-v", required=True, help="Variant letter (A/B/C)")
    parser.add_argument("--output", "-o", help="Output file path")
    args = parser.parse_args()

    output = generate_blueprint(args.concept, args.package, args.variant, args.output)
    if output and not args.output:
        print(output)


if __name__ == "__main__":
    main()
