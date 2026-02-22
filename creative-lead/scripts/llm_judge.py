#!/usr/bin/env python3
"""
BCC Creative Lead — LLM-as-a-Judge Evaluator

Uses Claude to automatically score concept variants against the Hopper Scorecard rubric.
Designed to replace/supplement the heuristic validate.py once calibrated with Florian's scores.

Usage:
    python llm_judge.py concept.md
    python llm_judge.py concept.md --brief brief.md  # Include brief for On-Brief scoring
    python llm_judge.py --batch test-output/blind-test/

Requirements:
    ANTHROPIC_API_KEY environment variable must be set.

Phase 3 Architecture:
    1. Florian scores 3-5 concepts (golden dataset)
    2. We calibrate the rubric prompt to match his scoring pattern
    3. LLM-as-a-Judge runs on all 30 concepts
    4. We compare LLM scores vs Florian scores → measure alignment
    5. Iterate rubric until alignment > 0.85 correlation
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field

# --- Configuration ---
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MODEL = "claude-sonnet-4-5-20250514"  # Cost-efficient for evaluation

# --- Scoring Rubric (will be calibrated with Florian's golden dataset) ---
HOPPER_SCORECARD_RUBRIC = """
You are an expert Creative Director evaluating social media concept proposals for premium brands.

Score each concept on these 8 criteria (1-10 scale):

1. **On-Brief** (15%) — Does it answer the key message from the brief? Is the core message clear?
2. **Platform Fit** (15%) — Would this format work well on the target platform (TikTok/IG Reels)?
3. **Scroll-Stop Hook** (15%) — Would a user actually stop scrolling in the first 1-3 seconds?
4. **Brand Voice** (15%) — Does it sound like the brand? Would the CMO approve the tone?
5. **Trend Relevance** (10%) — Is the trend current, well-applied, and not forced?
6. **Visual Clarity** (10%) — Can you picture the final video? Is the visual direction specific enough to brief a production team?
7. **German Quality** (10%) — Are the German captions natural? No translated-English feel?
8. **Differentiation** (10%) — Are the 3 variants genuinely different (format, mechanic, emotional register)?

Red Flags (auto-fail if present):
- Wrong brand voice applied (e.g., Porsche tone on a Hisense concept)
- Captions in English instead of German
- Vague visual direction ("nice setting" instead of specific scene description)
- No scroll-stop mechanic identified

Output format (JSON):
{
    "variant": "A/B/C",
    "title": "concept title",
    "scores": {
        "on_brief": {"score": 7, "reason": "..."},
        "platform_fit": {"score": 8, "reason": "..."},
        "scroll_stop_hook": {"score": 9, "reason": "..."},
        "brand_voice": {"score": 7, "reason": "..."},
        "trend_relevance": {"score": 6, "reason": "..."},
        "visual_clarity": {"score": 8, "reason": "..."},
        "german_quality": {"score": 7, "reason": "..."},
        "differentiation": {"score": 7, "reason": "..."}
    },
    "weighted_average": 7.4,
    "red_flags": [],
    "verdict": "PASS",
    "one_line_summary": "Strong concept with clear hook, but trend application feels slightly forced."
}
""".strip()


@dataclass
class JudgeResult:
    variant: str
    title: str
    scores: dict = field(default_factory=dict)
    weighted_average: float = 0.0
    red_flags: list = field(default_factory=list)
    verdict: str = "PENDING"
    one_line_summary: str = ""
    raw_response: str = ""


def build_evaluation_prompt(concept_text: str, brief_text: Optional[str] = None) -> str:
    """Build the full evaluation prompt for Claude."""
    prompt_parts = [HOPPER_SCORECARD_RUBRIC, "\n\n---\n\n"]
    
    if brief_text:
        prompt_parts.append(f"## Original Brief\n\n{brief_text}\n\n---\n\n")
    
    prompt_parts.append(f"## Concept to Evaluate\n\n{concept_text}\n\n---\n\n")
    prompt_parts.append(
        "Evaluate this concept. Score each criterion 1-10 with a brief reason. "
        "Output ONLY valid JSON matching the format above. No markdown, no extra text."
    )
    
    return "".join(prompt_parts)


def call_claude(prompt: str) -> str:
    """Call the Anthropic API. Returns raw response text."""
    if not ANTHROPIC_API_KEY:
        return json.dumps({
            "error": "ANTHROPIC_API_KEY not set. Set it via environment variable.",
            "variant": "?",
            "title": "API Key Missing",
            "scores": {},
            "weighted_average": 0,
            "red_flags": ["no_api_key"],
            "verdict": "ERROR",
            "one_line_summary": "Cannot evaluate — API key not configured."
        })
    
    import urllib.request
    
    headers = {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
    }
    
    body = json.dumps({
        "model": MODEL,
        "max_tokens": 2000,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,  # Low temp for consistent scoring
    }).encode()
    
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        headers=headers,
        method="POST",
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
            return result["content"][0]["text"]
    except Exception as e:
        return json.dumps({
            "error": str(e),
            "variant": "?",
            "title": "API Error",
            "scores": {},
            "weighted_average": 0,
            "red_flags": ["api_error"],
            "verdict": "ERROR",
            "one_line_summary": f"API call failed: {e}"
        })


def evaluate_concept(concept_text: str, brief_text: Optional[str] = None) -> JudgeResult:
    """Evaluate a single concept using Claude as judge."""
    prompt = build_evaluation_prompt(concept_text, brief_text)
    raw = call_claude(prompt)
    
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Try extracting JSON from markdown code block
        import re
        match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw, re.DOTALL)
        if match:
            data = json.loads(match.group(1))
        else:
            data = {"error": "Failed to parse response", "raw": raw[:500]}
    
    result = JudgeResult(
        variant=data.get("variant", "?"),
        title=data.get("title", "Unknown"),
        scores=data.get("scores", {}),
        weighted_average=data.get("weighted_average", 0),
        red_flags=data.get("red_flags", []),
        verdict=data.get("verdict", "ERROR"),
        one_line_summary=data.get("one_line_summary", ""),
        raw_response=raw,
    )
    
    return result


def evaluate_file(filepath: str, brief_path: Optional[str] = None) -> list[JudgeResult]:
    """Evaluate all variants in a concept file."""
    import re
    
    text = Path(filepath).read_text(encoding="utf-8")
    brief_text = Path(brief_path).read_text(encoding="utf-8") if brief_path else None
    
    # Split into variants
    variant_sections = re.split(r'(?=##\s*Variant\s+[A-C])', text)
    variant_sections = [s for s in variant_sections if s.strip()]
    
    results = []
    for section in variant_sections:
        result = evaluate_concept(section, brief_text)
        results.append(result)
    
    return results


def print_result(result: JudgeResult):
    """Pretty-print a judge result."""
    weights = {
        "on_brief": 0.15, "platform_fit": 0.15, "scroll_stop_hook": 0.15,
        "brand_voice": 0.15, "trend_relevance": 0.10, "visual_clarity": 0.10,
        "german_quality": 0.10, "differentiation": 0.10,
    }
    
    print(f"\n{'='*60}")
    print(f"VARIANT {result.variant}: {result.title}")
    print(f"{'='*60}")
    
    for criterion, data in result.scores.items():
        if isinstance(data, dict):
            score = data.get("score", 0)
            reason = data.get("reason", "")
            weight = weights.get(criterion, 0)
            bar = "█" * int(score) + "░" * (10 - int(score))
            print(f"  {criterion:<20} [{bar}] {score}/10 ({weight*100:.0f}%)")
            if reason:
                print(f"  {'':20} └─ {reason}")
    
    print(f"\n  WEIGHTED AVERAGE: {result.weighted_average}/10")
    
    if result.red_flags:
        print(f"  🚩 RED FLAGS: {', '.join(result.red_flags)}")
    
    verdict_emoji = {"PASS": "✅", "REVISE": "⚠️", "REJECT": "❌", "ERROR": "💀"}
    print(f"  VERDICT: {verdict_emoji.get(result.verdict, '❓')} {result.verdict}")
    print(f"  SUMMARY: {result.one_line_summary}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LLM-as-a-Judge Concept Evaluator")
    parser.add_argument("concept", nargs="?", type=str, help="Concept file to evaluate")
    parser.add_argument("--brief", type=str, help="Original brief file for On-Brief scoring")
    parser.add_argument("--batch", type=str, help="Directory of concept files to batch evaluate")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()
    
    if args.batch:
        batch_dir = Path(args.batch)
        files = sorted(batch_dir.glob("*.md"))
        print(f"Batch evaluating {len(files)} concept files...")
        
        all_results = []
        for f in files:
            print(f"\n📝 Evaluating: {f.name}")
            results = evaluate_file(str(f))
            all_results.extend(results)
            for r in results:
                print_result(r)
        
        # Summary
        passed = sum(1 for r in all_results if r.verdict == "PASS")
        revised = sum(1 for r in all_results if r.verdict == "REVISE")
        rejected = sum(1 for r in all_results if r.verdict == "REJECT")
        errors = sum(1 for r in all_results if r.verdict == "ERROR")
        
        print(f"\n{'='*60}")
        print(f"BATCH SUMMARY: {len(all_results)} variants evaluated")
        print(f"  ✅ PASS: {passed}  ⚠️ REVISE: {revised}  ❌ REJECT: {rejected}  💀 ERROR: {errors}")
        if all_results:
            avg = sum(r.weighted_average for r in all_results) / len(all_results)
            print(f"  Average score: {avg:.1f}/10")
        print(f"{'='*60}")
    
    elif args.concept:
        results = evaluate_file(args.concept, args.brief)
        
        if args.json:
            output = []
            for r in results:
                output.append({
                    "variant": r.variant,
                    "title": r.title,
                    "scores": r.scores,
                    "weighted_average": r.weighted_average,
                    "red_flags": r.red_flags,
                    "verdict": r.verdict,
                    "one_line_summary": r.one_line_summary,
                })
            print(json.dumps(output, indent=2, ensure_ascii=False))
        else:
            for r in results:
                print_result(r)
    
    else:
        parser.print_help()
        print("\n⚠️  Note: ANTHROPIC_API_KEY must be set to use LLM evaluation.")
        print("   For now, this is scaffolding — will be activated after Florian's golden dataset.")
