#!/usr/bin/env python3
"""
BCC Creative Lead — Automated Concept Validator (Hopper Scorecard)
Scores concept variants against 8 criteria from the Quality Checklist.

Usage:
    python validate.py concept.md
    python validate.py --json concept.json

Scoring Criteria (from references/quality-checklist.md):
    1. On-Brief (15%)       — Does it answer the key message?
    2. Platform Fit (15%)   — Would this work on the target platform?
    3. Scroll-Stop Hook (15%) — Would you stop scrolling?
    4. Brand Voice (15%)    — Does it sound like the client?
    5. Trend Relevance (10%) — Is the trend current and well-applied?
    6. Visual Clarity (10%) — Can you picture the final video/post?
    7. German Quality (10%) — Natural, not translated?
    8. Differentiation (10%) — Are A/B/C genuinely different?

Pass threshold: weighted average >= 7.0/10, no red flags.
"""

import json
import sys
import re
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    HAS_EMBEDDINGS = True
except ImportError:
    HAS_EMBEDDINGS = False

# Lazy-loaded embedding model
_model = None

def get_embedding_model():
    global _model
    if _model is None and HAS_EMBEDDINGS:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model


def compute_differentiation_score(variant_texts: list[str]) -> tuple[float, str]:
    """
    Compute differentiation score using cosine similarity between variant pairs.
    Rule: If any pair has cosine similarity > 0.80, variants are too similar → REVISE.
    """
    if not HAS_EMBEDDINGS:
        return 7.0, "Embedding model not available — using placeholder score"
    
    if len(variant_texts) < 2:
        return 5.0, "Only 1 variant — cannot compute differentiation"
    
    model = get_embedding_model()
    embeddings = model.encode(variant_texts)
    
    # Compute pairwise cosine similarity
    pairs = []
    max_sim = 0.0
    for i in range(len(embeddings)):
        for j in range(i + 1, len(embeddings)):
            sim = float(np.dot(embeddings[i], embeddings[j]) / 
                       (np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[j])))
            label = f"{chr(65+i)} vs {chr(65+j)}"
            pairs.append((label, sim))
            max_sim = max(max_sim, sim)
    
    pair_info = ", ".join(f"{label}: {sim:.2f}" for label, sim in pairs)
    
    if max_sim > 0.80:
        return 3.0, f"FAIL — Variants too similar! {pair_info}"
    elif max_sim > 0.65:
        score = 7.0 - (max_sim - 0.65) * 20  # Linear decay from 7 to 4
        return max(4.0, score), f"Moderate similarity. {pair_info}"
    else:
        score = min(10.0, 7.0 + (0.65 - max_sim) * 10)
        return score, f"Good differentiation. {pair_info}"


@dataclass
class ScoreResult:
    criterion: str
    weight: float
    score: float
    notes: str = ""


@dataclass
class ConceptValidation:
    variant: str
    title: str
    scores: list = field(default_factory=list)
    red_flags: list = field(default_factory=list)
    weighted_avg: float = 0.0
    verdict: str = "PENDING"


CRITERIA = [
    ("On-Brief", 0.15),
    ("Platform Fit", 0.15),
    ("Scroll-Stop Hook", 0.15),
    ("Brand Voice", 0.15),
    ("Trend Relevance", 0.10),
    ("Visual Clarity", 0.10),
    ("German Quality", 0.10),
    ("Differentiation", 0.10),
]

RED_FLAG_CHECKS = [
    ("wrong_brand_voice", "Wrong client brand voice applied"),
    ("english_captions", "Captions in English instead of German"),
    ("fewer_than_3", "Fewer than 3 variants"),
    ("vague_visuals", "Visual direction is vague"),
    ("no_scroll_stop", "No scroll-stop mechanic identified"),
]


def check_german_quality(text: str) -> tuple[float, str]:
    """Heuristic check for German caption quality."""
    issues = []
    score = 8.0

    # Check for common English leakage patterns
    english_markers = ["game-changer", "check out", "we're excited", "amazing", "awesome"]
    for marker in english_markers:
        if marker.lower() in text.lower():
            issues.append(f"English leakage: '{marker}'")
            score -= 1.5

    # Check for German verb position (V2 rule) - very basic heuristic
    sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 10]
    if not sentences:
        issues.append("No German sentences found")
        score -= 3.0

    # Check sentence rhythm (short sentences = good for social)
    long_sentences = [s for s in sentences if len(s.split()) > 20]
    if len(long_sentences) > len(sentences) * 0.5:
        issues.append("Too many long sentences — lacks social media rhythm")
        score -= 1.0

    return max(1.0, min(10.0, score)), "; ".join(issues) if issues else "Passes basic German quality checks"


def check_visual_specificity(text: str) -> tuple[float, str]:
    """Check if visual direction is specific enough."""
    vague_terms = ["lifestyle setting", "nice atmosphere", "cool vibe", "beautiful scene", "aesthetic"]
    specific_terms = ["close-up", "drone", "handheld", "slow-mo", "split-screen", "wide-angle",
                      "tracking shot", "zoom", "pan", "tilt", "GoPro", "lighting", "neon", "natural light"]

    vague_count = sum(1 for t in vague_terms if t.lower() in text.lower())
    specific_count = sum(1 for t in specific_terms if t.lower() in text.lower())

    if vague_count > 0 and specific_count == 0:
        return 3.0, f"Visual direction too vague ({vague_count} vague terms, 0 specific)"

    score = min(10.0, 5.0 + specific_count * 1.0 - vague_count * 2.0)
    return max(1.0, score), f"{specific_count} specific terms, {vague_count} vague terms"


def check_hashtag_count(text: str) -> tuple[bool, int]:
    """Count hashtags in text."""
    hashtags = re.findall(r'#\w+', text)
    return 8 <= len(hashtags) <= 12, len(hashtags)


def check_scroll_stop_mechanic(text: str) -> bool:
    """Check if a scroll-stop mechanic is named."""
    mechanics = ["pattern interrupt", "curiosity gap", "shock", "relatability",
                 "social proof", "authority", "contrast", "tension", "surprise",
                 "scroll-stop", "hook"]
    return any(m.lower() in text.lower() for m in mechanics)


def validate_concept_text(text: str, variant_label: str = "Unknown") -> ConceptValidation:
    """Validate a single concept variant from its text content."""
    validation = ConceptValidation(variant=variant_label, title="")

    # Extract title
    title_match = re.search(r'##\s*Variant\s+\w+\s*[—–-]\s*(.+)', text)
    if title_match:
        validation.title = title_match.group(1).strip().strip('"')

    # --- Red Flag Checks ---
    if not re.search(r'[äöüßÄÖÜ]', text) and 'German' not in text:
        validation.red_flags.append("english_captions")

    has_visual = bool(re.search(r'(?i)(visual direction|kamera|camera|shot|drone|handheld|close-up|wide)', text))
    if not has_visual:
        validation.red_flags.append("vague_visuals")

    if not check_scroll_stop_mechanic(text):
        validation.red_flags.append("no_scroll_stop")

    # --- Scoring ---
    # 1. On-Brief: Check for key message presence
    has_key_message = bool(re.search(r'(?i)(key message|brief|client|campaign)', text))
    validation.scores.append(ScoreResult("On-Brief", 0.15,
                                          8.0 if has_key_message else 5.0,
                                          "Key message referenced" if has_key_message else "No explicit brief reference"))

    # 2. Platform Fit: Check for platform-specific terms
    platform_terms = ["reels", "tiktok", "shorts", "instagram", "vertical", "9:16", "15s", "30s", "60s"]
    platform_score = min(10.0, 5.0 + sum(1.5 for t in platform_terms if t.lower() in text.lower()))
    validation.scores.append(ScoreResult("Platform Fit", 0.15, platform_score,
                                          f"Platform markers found: {sum(1 for t in platform_terms if t.lower() in text.lower())}"))

    # 3. Scroll-Stop Hook
    hook_score = 8.0 if check_scroll_stop_mechanic(text) else 3.0
    has_hook_section = bool(re.search(r'(?i)hook|first.*second', text))
    if has_hook_section:
        hook_score = min(10.0, hook_score + 1.0)
    validation.scores.append(ScoreResult("Scroll-Stop Hook", 0.15, hook_score,
                                          "Mechanic identified" if hook_score >= 7 else "No clear hook mechanic"))

    # 4. Brand Voice
    brand_markers = ["decathlon", "inklusiv", "authentisch", "sweat", "dreams", "sport für alle"]
    brand_score = min(10.0, 5.0 + sum(1.0 for m in brand_markers if m.lower() in text.lower()))
    validation.scores.append(ScoreResult("Brand Voice", 0.15, brand_score,
                                          f"Brand alignment markers: {sum(1 for m in brand_markers if m.lower() in text.lower())}"))

    # 5. Trend Relevance
    has_trend_ref = bool(re.search(r'(?i)(trend|viral|format|mechanic|remix)', text))
    validation.scores.append(ScoreResult("Trend Relevance", 0.10,
                                          8.0 if has_trend_ref else 4.0,
                                          "Trend referenced" if has_trend_ref else "No trend connection"))

    # 6. Visual Clarity
    vis_score, vis_notes = check_visual_specificity(text)
    validation.scores.append(ScoreResult("Visual Clarity", 0.10, vis_score, vis_notes))

    # 7. German Quality
    german_sections = re.findall(r'(?:caption|text overlay|überschrift).*?(?:\n\n|\Z)', text, re.IGNORECASE | re.DOTALL)
    german_text = " ".join(german_sections) if german_sections else text
    ger_score, ger_notes = check_german_quality(german_text)
    validation.scores.append(ScoreResult("German Quality", 0.10, ger_score, ger_notes))

    # 8. Differentiation (can only be properly scored with all 3 variants)
    validation.scores.append(ScoreResult("Differentiation", 0.10, 7.0,
                                          "Requires multi-variant comparison — placeholder score"))

    # Calculate weighted average
    validation.weighted_avg = sum(s.score * s.weight for s in validation.scores)

    # Determine verdict
    if validation.red_flags:
        validation.verdict = "REVISE" if validation.weighted_avg >= 5.0 else "REJECT"
    elif validation.weighted_avg >= 7.0:
        validation.verdict = "PASS"
    elif validation.weighted_avg >= 5.0:
        validation.verdict = "REVISE"
    else:
        validation.verdict = "REJECT"

    return validation


def print_validation(v: ConceptValidation):
    """Pretty-print a validation result."""
    print(f"\n{'='*60}")
    print(f"VARIANT {v.variant}: {v.title}")
    print(f"{'='*60}")

    for s in v.scores:
        bar = "█" * int(s.score) + "░" * (10 - int(s.score))
        print(f"  {s.criterion:<20} [{bar}] {s.score:.1f}/10 ({s.weight*100:.0f}%)")
        if s.notes:
            print(f"  {'':20} └─ {s.notes}")

    print(f"\n  {'WEIGHTED AVERAGE:':<20} {v.weighted_avg:.1f}/10")

    if v.red_flags:
        print(f"\n  🚩 RED FLAGS:")
        for rf in v.red_flags:
            desc = dict(RED_FLAG_CHECKS).get(rf, rf)
            print(f"     ❌ {desc}")

    verdict_emoji = {"PASS": "✅", "REVISE": "⚠️", "REJECT": "❌"}.get(v.verdict, "❓")
    print(f"\n  VERDICT: {verdict_emoji} {v.verdict}")


def validate_file(filepath: str):
    """Validate concepts from a markdown file."""
    path = Path(filepath)
    text = path.read_text(encoding="utf-8")

    # Split into variants
    variant_sections = re.split(r'(?=##\s*Variant\s+[A-C])', text)
    variant_sections = [s for s in variant_sections if s.strip()]

    if not variant_sections:
        # Try treating the whole file as one concept
        variant_sections = [text]

    results = []
    for i, section in enumerate(variant_sections):
        label_match = re.search(r'Variant\s+([A-C])', section)
        label = label_match.group(1) if label_match else chr(65 + i)
        result = validate_concept_text(section, label)
        results.append(result)

    # Check cross-variant differentiation with cosine similarity
    if len(results) < 3:
        for r in results:
            r.red_flags.append("fewer_than_3")

    if len(variant_sections) >= 2:
        diff_score, diff_notes = compute_differentiation_score(variant_sections)
        for r in results:
            # Replace the placeholder differentiation score
            for s in r.scores:
                if s.criterion == "Differentiation":
                    s.score = diff_score
                    s.notes = diff_notes
            # Recalculate weighted average
            r.weighted_avg = sum(s.score * s.weight for s in r.scores)
            # Re-evaluate verdict
            if r.red_flags:
                r.verdict = "REVISE" if r.weighted_avg >= 5.0 else "REJECT"
            elif r.weighted_avg >= 7.0:
                r.verdict = "PASS"
            elif r.weighted_avg >= 5.0:
                r.verdict = "REVISE"
            else:
                r.verdict = "REJECT"

    print(f"\n🎯 BCC CREATIVE LEAD — CONCEPT VALIDATION REPORT")
    print(f"   File: {filepath}")
    print(f"   Variants found: {len(results)}")

    for r in results:
        print_validation(r)

    # Overall summary
    avg_all = sum(r.weighted_avg for r in results) / len(results) if results else 0
    all_pass = all(r.verdict == "PASS" for r in results)
    any_reject = any(r.verdict == "REJECT" for r in results)

    print(f"\n{'='*60}")
    print(f"OVERALL: Average {avg_all:.1f}/10 | {'ALL PASS ✅' if all_pass else 'NEEDS REVISION ⚠️' if not any_reject else 'HAS REJECTIONS ❌'}")
    print(f"{'='*60}")

    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate.py <concept_file.md>")
        print("       python validate.py --json <concept_file.json>")
        sys.exit(1)

    filepath = sys.argv[-1]
    validate_file(filepath)
