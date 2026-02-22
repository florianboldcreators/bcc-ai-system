#!/usr/bin/env python3
"""
BCC Creative Lead — Feedback Handler

Processes CEO feedback from Telegram and triggers the appropriate action:
- ✅ A/B/C → Approve: Move Asana task to "Concept Approved"
- ❌ → Reject: Move Asana task to "Concept Rejected"  
- ✏️ B + feedback → Revise: Trigger revision engine, re-deliver
- 🔄 → Regenerate: Re-run full pipeline with same brief

This script is called by the OpenClaw agent (James) when Florian
replies to a concept delivery message. Not a standalone daemon.

Usage (called programmatically):
    python handle_feedback.py --action approve --variant B --task-gid 123456
    python handle_feedback.py --action reject --task-gid 123456
    python handle_feedback.py --action revise --variant B --feedback "Make hook punchier" --concept-file path/to/concept.md
"""

import os
import sys
import json
import argparse
import urllib.request
from pathlib import Path
from datetime import datetime

ASANA_PAT = os.environ.get("ASANA_PAT", "")
ASANA_BASE = "https://app.asana.com/api/1.0"
PROJECT_GID = "1213389128879990"  # AI Concepting project


def asana_request(method: str, endpoint: str, data: dict = None) -> dict:
    """Make an Asana API request."""
    if not ASANA_PAT:
        print("❌ ASANA_PAT not set", file=sys.stderr)
        return {}
    
    url = f"{ASANA_BASE}/{endpoint}"
    headers = {
        "Authorization": f"Bearer {ASANA_PAT}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    
    body = json.dumps({"data": data}).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"❌ Asana error: {e}", file=sys.stderr)
        return {}


def ensure_section(section_name: str) -> str:
    """Get or create a section in the AI Concepting project."""
    sections = asana_request("GET", f"projects/{PROJECT_GID}/sections")
    for s in sections.get("data", []):
        if s["name"].lower() == section_name.lower():
            return s["gid"]
    
    # Create it
    result = asana_request("POST", f"projects/{PROJECT_GID}/sections", {"name": section_name})
    return result.get("data", {}).get("gid", "")


def move_task(task_gid: str, section_name: str) -> bool:
    """Move an Asana task to a specific section."""
    section_gid = ensure_section(section_name)
    if not section_gid:
        print(f"❌ Could not find/create section '{section_name}'", file=sys.stderr)
        return False
    
    result = asana_request("POST", f"sections/{section_gid}/addTask", {"task": task_gid})
    if result:
        print(f"✅ Task moved to '{section_name}'")
        return True
    return False


def add_comment(task_gid: str, text: str) -> bool:
    """Add a comment to an Asana task."""
    result = asana_request("POST", f"tasks/{task_gid}/stories", {"text": text})
    return bool(result)


def auto_learn_from_approval(concept_file: str, variant: str):
    """Ingest approved concept back into KB as a golden example."""
    import re
    
    concept_text = Path(concept_file).read_text(encoding="utf-8")
    
    # Extract the approved variant
    pattern = rf'(##\s*Variant\s+{variant}\b.*?)(?=##\s*Variant\s+[A-C]|\Z)'
    match = re.search(pattern, concept_text, re.DOTALL)
    variant_text = match.group(1).strip() if match else concept_text
    
    # Extract metadata
    meta = {}
    fm = re.match(r'^---\s*\n(.*?)\n---', concept_text, re.DOTALL)
    if fm:
        for line in fm.group(1).split("\n"):
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip().strip('"\'')
    
    client = meta.get("client", "unknown")
    
    # Save as golden example
    golden_dir = Path(__file__).parent.parent / "knowledge-base" / "raw_data" / "concepts"
    golden_dir.mkdir(parents=True, exist_ok=True)
    
    date_str = datetime.now().strftime("%Y-%m-%d")
    safe_name = re.sub(r'[^a-z0-9-]', '', client.lower())
    golden_file = golden_dir / f"golden-{safe_name}-{date_str}-var{variant}.md"
    
    golden_content = f"""---
status: golden_example
source: approved_concept
client: "{client}"
variant: "{variant}"
approved_at: "{datetime.now().isoformat()}"
original_file: "{Path(concept_file).name}"
---

# ✅ APPROVED CONCEPT — {client} Variant {variant}

*This concept was approved by the CEO. Use it as a quality reference for future {client} briefs.*

{variant_text}
"""
    
    golden_file.write_text(golden_content, encoding="utf-8")
    print(f"🧠 Auto-learned: Saved golden example → {golden_file.name}")
    
    # Re-run ingestion to add to vector DB
    ingest_script = Path(__file__).parent / "ingest_rag.py"
    if ingest_script.exists():
        import subprocess
        try:
            r = subprocess.run(
                ["python3", str(ingest_script)],
                capture_output=True, text=True, timeout=60,
                cwd=str(Path(__file__).parent.parent.parent)
            )
            new_chunks = re.search(r'New chunks: (\d+)', r.stdout)
            if new_chunks:
                print(f"🧠 KB updated: +{new_chunks.group(1)} chunks")
            else:
                print(f"🧠 KB ingestion ran (no new chunks)")
        except Exception as e:
            print(f"⚠️ KB ingestion failed: {e}")
    
    return str(golden_file)


def handle_approve(task_gid: str, variant: str, concept_file: str = ""):
    """Handle approval: move task + add comment + trigger Producer + auto-learn."""
    move_task(task_gid, "Concept Approved")
    add_comment(task_gid, f"✅ Variant {variant} approved by CEO via Telegram ({datetime.now().strftime('%Y-%m-%d %H:%M')})")
    print(f"✅ Variant {variant} approved, task moved to 'Concept Approved'")
    
    # AUTO-LEARN: Ingest approved concept as golden example
    if concept_file:
        try:
            auto_learn_from_approval(concept_file, variant)
        except Exception as e:
            print(f"⚠️ Auto-learn failed: {e}")
    
    # AUTO-TRIGGER PRODUCER CLONE
    if concept_file:
        producer_script = Path(__file__).parent.parent.parent / "producer" / "main.py"
        output_dir = Path(__file__).parent.parent / "test-output" / "packages"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        safe_name = Path(concept_file).stem
        output_file = output_dir / f"{safe_name}-var{variant}-package.md"
        
        print(f"🏗️ AUTO-TRIGGERING PRODUCER for Variant {variant}...")
        print(f"PRODUCER_TRIGGER:{concept_file}|{variant}|{output_file}")
        # The calling agent (James) reads PRODUCER_TRIGGER and runs producer/main.py


def handle_reject(task_gid: str, reason: str = ""):
    """Handle rejection: move task + add comment."""
    move_task(task_gid, "Concept Rejected")
    comment = f"❌ Concepts rejected by CEO via Telegram ({datetime.now().strftime('%Y-%m-%d %H:%M')})"
    if reason:
        comment += f"\nReason: {reason}"
    add_comment(task_gid, comment)
    print(f"❌ Task moved to 'Concept Rejected'")


def handle_revise(task_gid: str, variant: str, feedback: str, concept_file: str):
    """Handle revision request: add comment + return revision prompt."""
    add_comment(task_gid, f"✏️ Revision requested for Variant {variant}: {feedback}")
    
    # Load original concept
    concept_text = Path(concept_file).read_text(encoding="utf-8") if concept_file else ""
    
    # Load revision template
    template_path = Path(__file__).parent.parent / "references" / "workflow" / "step-4-revision.md"
    
    # Build revision prompt
    revision_prompt = f"""You are the Creative Lead for Bold Creators Club.

The CEO has reviewed Variant {variant} and requested revisions.

## Original Concept
{concept_text}

## CEO Feedback
{feedback}

## Your Task
Rewrite ONLY the sections that need to change based on the feedback. 
Mark all changes with [REVISED]. Keep everything else identical.
Maintain all original constraints (budget, platform, brand voice, seasonality).
"""
    
    # Output the prompt for the calling agent to use
    print("REVISION_PROMPT_START")
    print(revision_prompt)
    print("REVISION_PROMPT_END")
    return revision_prompt


def handle_regenerate(task_gid: str, brief_file: str):
    """Handle regeneration request."""
    add_comment(task_gid, f"🔄 Full regeneration requested by CEO ({datetime.now().strftime('%Y-%m-%d %H:%M')})")
    print(f"🔄 Regeneration requested. Brief file: {brief_file}")
    print("REGENERATE_BRIEF:", brief_file)


def main():
    parser = argparse.ArgumentParser(description="Handle CEO feedback on concepts")
    parser.add_argument("--action", choices=["approve", "reject", "revise", "regenerate"], required=True)
    parser.add_argument("--variant", type=str, default="", help="Variant letter (A/B/C)")
    parser.add_argument("--task-gid", type=str, default="", help="Asana task GID")
    parser.add_argument("--feedback", type=str, default="", help="CEO feedback text")
    parser.add_argument("--concept-file", type=str, default="", help="Path to concept file")
    parser.add_argument("--brief-file", type=str, default="", help="Path to brief file")
    parser.add_argument("--reason", type=str, default="", help="Rejection reason")
    args = parser.parse_args()
    
    if args.action == "approve":
        handle_approve(args.task_gid, args.variant)
    elif args.action == "reject":
        handle_reject(args.task_gid, args.reason)
    elif args.action == "revise":
        handle_revise(args.task_gid, args.variant, args.feedback, args.concept_file)
    elif args.action == "regenerate":
        handle_regenerate(args.task_gid, args.brief_file)


if __name__ == "__main__":
    main()
