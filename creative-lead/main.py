#!/usr/bin/env python3
"""
BCC Creative Lead — Pipeline Entry Point

Accepts a raw brief, runs the Creative Lead pipeline (Steps 0-2),
and outputs concept variants in markdown format.

Usage:
    python main.py --input briefs/new_brief.md --output concepts/output.md
    python main.py --input briefs/new_brief.md  # prints to stdout
    python main.py --brief-text "Raw brief text here..."

Requirements:
    - ANTHROPIC_API_KEY environment variable
    - Knowledge base ingested (run scripts/ingest_rag.py first)

Architecture:
    1. Reads raw brief from file or stdin
    2. Queries knowledge base for brand context (Step 0 enhancement)
    3. Sends brief + context + SKILL.md persona to Claude
    4. Claude runs Steps 0-2 (Brief Structurer → Trend Research → Concept Generation)
    5. Outputs 3 concept variants in concept-template.md format
"""

import os
import sys
import json
import argparse
import urllib.request
from pathlib import Path
from datetime import datetime

# --- Configuration ---
SCRIPT_DIR = Path(__file__).parent
SKILL_FILE = SCRIPT_DIR / "SKILL.md"
CONCEPT_TEMPLATE = SCRIPT_DIR / "references" / "concept-template.md"
QUALITY_CHECKLIST = SCRIPT_DIR / "references" / "quality-checklist.md"

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MODEL = "claude-sonnet-4-5-20250514"

# Add tools directory to path
sys.path.insert(0, str(SCRIPT_DIR))


def load_skill_persona() -> str:
    """Load the Creative Lead persona from SKILL.md."""
    if SKILL_FILE.exists():
        text = SKILL_FILE.read_text(encoding="utf-8")
        # Extract body (after frontmatter)
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                return parts[2].strip()
        return text
    return ""


def load_template() -> str:
    """Load the concept output template."""
    if CONCEPT_TEMPLATE.exists():
        return CONCEPT_TEMPLATE.read_text(encoding="utf-8")
    return ""


def load_checklist() -> str:
    """Load the quality checklist for self-check."""
    if QUALITY_CHECKLIST.exists():
        return QUALITY_CHECKLIST.read_text(encoding="utf-8")
    return ""


def query_knowledge_base(client_name: str) -> str:
    """Query the RAG knowledge base for brand context."""
    try:
        from tools.query_brain import query_brain, format_for_agent
        results = query_brain(
            f"brand voice and content guidelines for {client_name}",
            top_k=5,
            client_filter=client_name
        )
        return format_for_agent(results)
    except Exception as e:
        return f"⚠️ Knowledge base unavailable: {e}"


def extract_client_from_brief(brief_text: str) -> str:
    """Try to extract client name from brief text."""
    # Check for known clients
    known_clients = [
        "Decathlon", "SIXT", "Porsche", "MINI", "Hisense", "Gorenje",
        "Bitpanda", "N26", "MAC", "ACE", "Epic Games", "LIDL"
    ]
    brief_lower = brief_text.lower()
    for client in known_clients:
        if client.lower() in brief_lower:
            return client
    return ""


def build_pipeline_prompt(brief_text: str, kb_context: str) -> str:
    """Build the full pipeline prompt for Claude."""
    persona = load_skill_persona()
    template = load_template()
    checklist = load_checklist()
    
    prompt = f"""You are the Creative Lead for Bold Creators Club (BCC).

{persona}

---

## Knowledge Base Context (Retrieved for this client)

{kb_context}

---

## Output Template

Use this exact format for your 3 concept variants:

{template}

---

## Quality Checklist

Run this self-check before delivering:

{checklist}

---

## YOUR TASK

Process this raw brief through the Creative Lead Pipeline:

**Step 0:** Parse the brief into a structured format. Flag any MISSING fields.
**Step 1:** Research 3-5 relevant trends with specific remix angles for this client.
**Step 2:** Generate exactly 3 concept variants (A=Safe, B=Sweet Spot, C=Bold).

Run the Step 2 self-check before delivering.

## RAW BRIEF:

{brief_text}

---

Deliver the full pipeline output: Structured Brief → Trends → 3 Concept Variants.
All captions and text overlays MUST be in German.
"""
    return prompt


def call_claude(prompt: str) -> str:
    """Call the Anthropic API."""
    if not ANTHROPIC_API_KEY:
        print("❌ Error: ANTHROPIC_API_KEY not set.", file=sys.stderr)
        print("   Set it: export ANTHROPIC_API_KEY=sk-ant-...", file=sys.stderr)
        sys.exit(1)
    
    headers = {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
    }
    
    body = json.dumps({
        "model": MODEL,
        "max_tokens": 8000,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,  # Creative temperature for concept generation
    }).encode()
    
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        headers=headers,
        method="POST",
    )
    
    print("🧠 Generating concepts... (this may take 30-60 seconds)", file=sys.stderr)
    
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
            return result["content"][0]["text"]
    except Exception as e:
        print(f"❌ API Error: {e}", file=sys.stderr)
        sys.exit(1)


def run_pipeline(brief_text: str) -> str:
    """Run the full Creative Lead pipeline on a brief."""
    # Step 0a: Extract client and query knowledge base
    client = extract_client_from_brief(brief_text)
    if client:
        print(f"📋 Client detected: {client}", file=sys.stderr)
        kb_context = query_knowledge_base(client)
    else:
        print("⚠️  Could not detect client name — skipping KB query", file=sys.stderr)
        kb_context = "⚠️ No client detected. Brand voice based on general knowledge."
    
    # Build prompt and call Claude
    prompt = build_pipeline_prompt(brief_text, kb_context)
    output = call_claude(prompt)
    
    return output


def main():
    parser = argparse.ArgumentParser(
        description="BCC Creative Lead — Generate concepts from a brief",
        epilog="Example: python main.py --input briefs/new_brief.md --output concepts/draft.md"
    )
    parser.add_argument("--input", "-i", type=str, help="Path to brief file (.md or .txt)")
    parser.add_argument("--output", "-o", type=str, help="Output file path (default: stdout)")
    parser.add_argument("--brief-text", type=str, help="Raw brief text (alternative to --input)")
    parser.add_argument("--no-kb", action="store_true", help="Skip knowledge base query")
    args = parser.parse_args()
    
    # Get brief text
    if args.input:
        brief_path = Path(args.input)
        if not brief_path.exists():
            print(f"❌ Brief file not found: {args.input}", file=sys.stderr)
            sys.exit(1)
        brief_text = brief_path.read_text(encoding="utf-8")
        print(f"📄 Loaded brief: {args.input}", file=sys.stderr)
    elif args.brief_text:
        brief_text = args.brief_text
    else:
        parser.print_help()
        print("\n💡 Provide a brief via --input or --brief-text", file=sys.stderr)
        sys.exit(1)
    
    # Run pipeline
    output = run_pipeline(brief_text)
    
    # Write output
    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Add metadata header
        header = f"<!-- Generated by BCC Creative Lead Pipeline -->\n"
        header += f"<!-- Date: {datetime.now().isoformat()} -->\n"
        header += f"<!-- Model: {MODEL} -->\n\n"
        
        output_path.write_text(header + output, encoding="utf-8")
        print(f"✅ Concepts saved to: {args.output}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
