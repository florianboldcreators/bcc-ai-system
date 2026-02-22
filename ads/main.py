#!/usr/bin/env python3
"""
BCC Ads Specialist — Performance Marketing Engine

Generates ad copy, targeting strategies, A/B test plans, and media plans
from approved creative concepts.

Usage:
    python main.py --concept concept.md --brand Porsche --platform tiktok --budget 10000
    python main.py --test
"""

import os
import sys
import json
import argparse
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
SKILL_FILE = SCRIPT_DIR / "SKILL.md"


def load_skill_excerpt() -> str:
    if SKILL_FILE.exists():
        text = SKILL_FILE.read_text(encoding="utf-8")
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                return parts[2][:2500]
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


def generate_media_plan(concept: str, brand: str, platform: str, budget: int, audience: str = "") -> dict:
    """Generate a full media plan from an approved concept."""
    skill = load_skill_excerpt()

    prompt = f"""{skill}

## TASK
Generate a complete Media Plan for **{brand}**.

**Platform:** {platform}
**Monthly Budget:** €{budget:,}
**Target Audience:** {audience or "Auto-defined based on brand"}

**Approved Creative Concept:**
{concept[:2000]}

Generate ALL of the following:
1. **5 Ad Copy Varianten** (Hook-Body-CTA Framework: Pain Point, Social Proof, Curiosity Gap, Bold Statement, UGC Style)
2. **Targeting-Strategie** für {platform} (Interessen, Verhalten, Demographics, Exclusions)
3. **3 A/B Tests** mit klaren Hypothesen und KPIs
4. **Budget-Allokation** über 4 Wochen
5. **Projected KPIs** (CPM, CTR, CPA, ROAS)

Output als strukturierter Markdown Media Plan. Alles auf Deutsch.
"""

    result = call_claude(prompt)

    return {
        "media_plan": result,
        "brand": brand,
        "platform": platform,
        "budget": budget,
        "generated_at": datetime.now().isoformat(),
    }


def format_ads_pulse(plans: list) -> str:
    """Format for Telegram /ads command."""
    report = "🎯 **BCC Media Strategy**\n\n"
    for p in plans:
        brand = p.get("brand", "?")
        platform = p.get("platform", "?")
        budget = p.get("budget", 0)
        report += f"• **{brand}** ({platform}): €{budget:,}/mo | 5 Ad Sets\n"
    return report


def main():
    parser = argparse.ArgumentParser(description="BCC Ads Specialist")
    parser.add_argument("--concept", type=str, help="Path to approved concept file")
    parser.add_argument("--brand", type=str, default="Unknown")
    parser.add_argument("--platform", type=str, default="tiktok", choices=["tiktok", "meta", "google", "youtube", "all"])
    parser.add_argument("--budget", type=int, default=5000, help="Monthly budget in EUR")
    parser.add_argument("--audience", type=str, default="", help="Target audience description")
    parser.add_argument("--output", type=str, help="Output file")
    parser.add_argument("--test", action="store_true")
    args = parser.parse_args()

    if args.test:
        print("🧪 Running Ads Specialist test with MINI Cooper concept...\n")
        # Use the golden MINI concept
        concept_path = SCRIPT_DIR.parent / "creative-lead/test-output/pipeline/mini-20260222-184627-concepts.md"
        if concept_path.exists():
            concept = concept_path.read_text()[:2000]
        else:
            concept = """Variant A — "Mein letztes Accessoire"
Format: GRWM (Get Ready With Me) — Subverted
Platform: TikTok + IG Reels | Länge: 18-22s
Konzept: GRWM Format, letztes "Accessoire" ist der Cooper.
Hook: "pov: du ziehst dich an und dein bestes piece steht draußen"
"""
        result = generate_media_plan(concept, "MINI", "tiktok", 10000, "Gen Z, urban, fashion-affin, 22-35")
        out = args.output or str(SCRIPT_DIR / "test-output" / "mini-media-plan.md")
        Path(out).parent.mkdir(parents=True, exist_ok=True)
        Path(out).write_text(result["media_plan"], encoding="utf-8")
        print(f"📁 Media plan saved to: {out}")
        return

    if args.concept:
        concept = Path(args.concept).read_text()
        result = generate_media_plan(concept, args.brand, args.platform, args.budget, args.audience)
        if args.output:
            Path(args.output).write_text(result["media_plan"], encoding="utf-8")
            print(f"📁 Media plan saved to: {args.output}")
        else:
            print(result["media_plan"])
    else:
        parser.print_help()
        print("\n💡 Try: python main.py --test")


if __name__ == "__main__":
    main()
