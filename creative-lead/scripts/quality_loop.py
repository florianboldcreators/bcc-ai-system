#!/usr/bin/env python3
"""
BCC Creative Lead — Autonomous Quality Loop

Generates concepts, runs the LLM Judge, and auto-retries rejected variants
by feeding the Judge's critique back into the revision engine.

Only PASS concepts reach the CEO. REJECT/REVISE concepts are automatically
rewritten up to MAX_RETRIES times.

Usage:
    python quality_loop.py --brief briefs/brief.md
    python quality_loop.py --brief briefs/brief.md --threshold 3.0 --max-retries 2
"""

import os
import sys
import re
import json
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent

MAX_RETRIES = 2
PASS_THRESHOLD = 3.0  # Minimum weighted average to pass
REJECT_THRESHOLD = 2.5  # Below this = REJECT, above = REVISE


def run_claude(prompt: str, timeout: int = 180) -> str:
    """Run a prompt through Claude CLI."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as tf:
        tf.write(prompt)
        tf_path = tf.name

    try:
        result = subprocess.run(
            f'cat "{tf_path}" | claude -p - --allowedTools Read',
            shell=True, capture_output=True, text=True, timeout=timeout
        )
        os.unlink(tf_path)
        return (result.stdout or "").strip()
    except subprocess.TimeoutExpired:
        try: os.unlink(tf_path)
        except: pass
        return ""
    except Exception as e:
        return ""


def generate_concepts(brief_text: str, kb_context: str = "", revision_feedback: str = "") -> str:
    """Generate 3 concept variants from a brief."""
    skill_path = PROJECT_ROOT / "SKILL.md"
    skill_body = ""
    if skill_path.exists():
        text = skill_path.read_text()
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                skill_body = parts[2][:3000]  # Truncate to manage token usage

    revision_section = ""
    if revision_feedback:
        revision_section = f"""
## PREVIOUS ATTEMPT FAILED QUALITY CHECK

The LLM Judge rejected your previous concepts with this feedback:
{revision_feedback}

You MUST address these specific issues in your new attempt. Do NOT repeat the same mistakes.
"""

    prompt = f"""You are the Creative Lead for Bold Creators Club.

{skill_body[:2000]}

{revision_section}

## Knowledge Base Context
{kb_context[:2000] if kb_context else "No specific brand context available."}

## Brief
{brief_text}

Generate 3 concept variants (A=Safe but distinctive, B=Sweet Spot, C=Bold).
Each variant needs: Hook, Visual Direction, Script/Storyboard, Text Overlays, Caption, Hashtags, Production Notes.
All captions in German. Start each with "## Variant A/B/C — Title".
"""
    return run_claude(prompt)


def judge_concepts(concepts_text: str) -> list:
    """Run LLM Judge on concepts, return list of variant scores."""
    prompt = f"""STRICT Creative Director scoring. 1-5 (3=avg, 5=exceptional). Most AI=2-3.
Score each variant separately. Return ONLY JSON array.

8 criteria: on_brief, platform_fit, scroll_stop_hook, brand_voice, trend_relevance, visual_clarity, german_quality, differentiation.
PASS>=3.0 with 0 red flags, REVISE below 3.0.

CONCEPT:
{concepts_text[:4000]}

Return ONLY valid JSON array of objects with: variant, title, weighted_average, verdict, one_line_summary, red_flags."""

    raw = run_claude(prompt, timeout=120)
    if not raw:
        return []

    # Strip markdown code blocks
    raw = re.sub(r'```json\s*', '', raw)
    raw = re.sub(r'```\s*', '', raw)

    try:
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
    except json.JSONDecodeError:
        pass

    return []


def extract_failing_feedback(judge_results: list, threshold: float) -> str:
    """Extract feedback for variants that failed the quality check."""
    feedback_parts = []
    for r in judge_results:
        avg = float(r.get("weighted_average", 0))
        if avg < threshold:
            variant = r.get("variant", "?")
            summary = r.get("one_line_summary", "No summary")
            flags = r.get("red_flags", [])
            feedback_parts.append(
                f"- Variant {variant} ({avg}/5 — FAILED): {summary}"
                + (f" Red flags: {', '.join(flags)}" if flags else "")
            )
    return "\n".join(feedback_parts)


def quality_loop(brief_text: str, kb_context: str = "",
                 max_retries: int = MAX_RETRIES,
                 threshold: float = PASS_THRESHOLD) -> dict:
    """
    Generate concepts with auto-retry quality loop.
    
    Returns dict with:
        - concepts: final markdown text
        - judge_results: list of variant scores
        - attempts: number of generation attempts
        - all_passed: whether all variants passed
        - human_intervention: whether human review is needed
    """
    result = {
        "concepts": "",
        "judge_results": [],
        "attempts": 0,
        "all_passed": False,
        "human_intervention": False,
        "history": [],
    }

    revision_feedback = ""

    for attempt in range(1, max_retries + 2):  # +1 for initial attempt
        result["attempts"] = attempt
        print(f"\n🔄 Attempt {attempt}/{max_retries + 1}", file=sys.stderr)

        # Generate concepts
        print("  📝 Generating concepts...", file=sys.stderr)
        concepts = generate_concepts(brief_text, kb_context, revision_feedback)
        if not concepts:
            print("  ❌ Generation failed (empty response)", file=sys.stderr)
            continue

        # Judge concepts
        print("  ⚖️ Running LLM Judge...", file=sys.stderr)
        judge_results = judge_concepts(concepts)
        if not judge_results:
            print("  ❌ Judge failed (empty response)", file=sys.stderr)
            continue

        # Log attempt
        attempt_log = {
            "attempt": attempt,
            "scores": [
                {"variant": r.get("variant", "?"),
                 "score": r.get("weighted_average", 0),
                 "verdict": r.get("verdict", "?")}
                for r in judge_results
            ]
        }
        result["history"].append(attempt_log)

        # Print scores
        for r in judge_results:
            v = r.get("variant", "?")
            score = r.get("weighted_average", 0)
            verdict = r.get("verdict", "?")
            emoji = {"PASS": "✅", "REVISE": "⚠️", "REJECT": "❌"}.get(verdict, "?")
            print(f"  {emoji} Variant {v}: {score}/5 {verdict}", file=sys.stderr)

        # Check if all pass
        all_pass = all(
            float(r.get("weighted_average", 0)) >= threshold
            for r in judge_results
        )

        if all_pass:
            print(f"\n✅ All variants passed! (attempt {attempt})", file=sys.stderr)
            result["concepts"] = concepts
            result["judge_results"] = judge_results
            result["all_passed"] = True
            return result

        # Extract feedback for failing variants
        revision_feedback = extract_failing_feedback(judge_results, threshold)
        print(f"  📋 Feeding critique back for retry...", file=sys.stderr)

        # Store best attempt so far
        result["concepts"] = concepts
        result["judge_results"] = judge_results

    # Exhausted retries
    print(f"\n⚠️ [HUMAN INTERVENTION REQUIRED] — {max_retries + 1} attempts exhausted",
          file=sys.stderr)
    result["human_intervention"] = True
    return result


def format_telegram_message(result: dict, brief_name: str = "Brief") -> str:
    """Format quality loop results for Telegram delivery."""
    attempts = result["attempts"]
    all_passed = result["all_passed"]
    human = result["human_intervention"]

    header = f"🎨 **Concepts: {brief_name}**\n"
    if all_passed:
        header += f"✅ Alle Varianten bestanden (Versuch {attempts})\n"
    elif human:
        header += f"⚠️ **HUMAN REVIEW NÖTIG** — {attempts} Versuche, nicht alle bestanden\n"
    else:
        header += f"🔄 Nach {attempts} Versuchen:\n"

    scores = ""
    for r in result.get("judge_results", []):
        v = r.get("variant", "?")
        s = r.get("weighted_average", 0)
        verdict = r.get("verdict", "?")
        summary = r.get("one_line_summary", "")
        emoji = {"PASS": "✅", "REVISE": "⚠️", "REJECT": "❌"}.get(verdict, "?")
        scores += f"\n{emoji} **Var {v}:** {s}/5 — {summary[:80]}"

    history = "\n\n📊 **Quality Loop History:**"
    for h in result.get("history", []):
        attempt_scores = " | ".join(
            f"{s['variant']}:{s['score']}" for s in h["scores"]
        )
        history += f"\n  Versuch {h['attempt']}: {attempt_scores}"

    return header + scores + history


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Quality Loop — Auto-retry concept generation")
    parser.add_argument("--brief", required=True, help="Path to brief file")
    parser.add_argument("--threshold", type=float, default=PASS_THRESHOLD, help="Pass threshold (default: 3.0)")
    parser.add_argument("--max-retries", type=int, default=MAX_RETRIES, help="Max retries (default: 2)")
    parser.add_argument("--output", help="Output file for final concepts")
    args = parser.parse_args()

    brief_text = Path(args.brief).read_text(encoding="utf-8")

    # Try to query KB
    kb_context = ""
    try:
        sys.path.insert(0, str(PROJECT_ROOT / "tools"))
        from query_brain import query_brain, format_for_agent
        # Extract client
        known = ["Decathlon", "SIXT", "Porsche", "MINI", "Hisense", "Gorenje", "Bitpanda", "N26"]
        client = next((c for c in known if c.lower() in brief_text.lower()), "")
        if client:
            results = query_brain(f"brand voice {client}", top_k=3, client_filter=client)
            kb_context = format_for_agent(results)
    except Exception:
        pass

    result = quality_loop(brief_text, kb_context, args.max_retries, args.threshold)

    if args.output and result["concepts"]:
        Path(args.output).parent.mkdir(parents=True, exist_ok=True)
        Path(args.output).write_text(result["concepts"], encoding="utf-8")
        print(f"\n📁 Saved to: {args.output}", file=sys.stderr)

    # Print Telegram-ready summary
    print("\n" + format_telegram_message(result, Path(args.brief).stem))
