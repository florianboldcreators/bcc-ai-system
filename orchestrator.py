#!/usr/bin/env python3
"""
BCC AI System — Pipeline Orchestrator

The central nervous system that ties all agents together.
Event-driven state machine that processes briefs through the full pipeline:

    Asana Brief → Creative Lead → Quality Loop → Judge → Telegram Delivery
         ↑              ↓ (on approval)
    Asana Update ← Producer → Editor (on footage ready)

States:
    NEW          → Brief detected in Asana
    GENERATING   → Creative Lead generating concepts
    JUDGING      → Quality Loop running (generate → judge → retry)
    READY        → Concepts passed, awaiting CEO delivery
    DELIVERED    → Sent to CEO Telegram, awaiting feedback
    APPROVED     → CEO approved, Producer triggered
    PRODUCING    → Producer generating package
    PRODUCED     → Package ready, awaiting footage
    EDITING      → Editor generating blueprint
    COMPLETE     → Full pipeline done
    FAILED       → Unrecoverable error, human intervention needed

Usage:
    python orchestrator.py --process brief.md           # Process single brief
    python orchestrator.py --status                     # Show pipeline status
    python orchestrator.py --metrics                    # Show system metrics
    python orchestrator.py --process-approval B concept.md  # Process CEO approval
"""

import os
import sys
import json
import argparse
import subprocess
import re
from pathlib import Path
from datetime import datetime

# Add scripts to path
SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR / "creative-lead" / "scripts"))
sys.path.insert(0, str(SCRIPT_DIR / "creative-lead" / "tools"))

from telemetry import get_logger, track_event, get_metrics_summary, alert_system_fault, resilient_call

logger = get_logger("orchestrator")

# --- State Management ---

STATE_FILE = SCRIPT_DIR / "logs" / "pipeline_state.json"


def load_state() -> dict:
    """Load pipeline state."""
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {"pipelines": {}, "last_updated": None}


def save_state(state: dict):
    """Save pipeline state."""
    state["last_updated"] = datetime.now().isoformat()
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False))


def update_pipeline(pipeline_id: str, status: str, data: dict = None):
    """Update a pipeline's status."""
    state = load_state()
    if pipeline_id not in state["pipelines"]:
        state["pipelines"][pipeline_id] = {
            "created": datetime.now().isoformat(),
            "history": [],
        }
    
    pipeline = state["pipelines"][pipeline_id]
    pipeline["status"] = status
    pipeline["updated"] = datetime.now().isoformat()
    if data:
        pipeline.update(data)
    pipeline["history"].append({
        "status": status,
        "timestamp": datetime.now().isoformat(),
    })
    
    save_state(state)
    logger.info(f"Pipeline {pipeline_id}: {status}")


# --- Pipeline Steps ---

def detect_client(brief_text: str) -> str:
    """Detect client name from brief text."""
    known = ["Decathlon", "SIXT", "Porsche", "MINI", "Hisense", "Gorenje",
             "Bitpanda", "N26", "MAC", "ACE", "Epic Games", "LIDL"]
    for client in known:
        if client.lower() in brief_text.lower():
            return client
    return "Unknown"


def query_knowledge_base(client: str) -> str:
    """Query RAG knowledge base for client context."""
    try:
        from query_brain import query_brain, format_for_agent
        results = query_brain(f"brand voice and guidelines for {client}", top_k=5, client_filter=client)
        return format_for_agent(results)
    except Exception as e:
        logger.warning(f"KB query failed: {e}")
        return ""


def call_claude_atomic(prompt: str, timeout: int = 90, retries: int = 1) -> str:
    """Call Claude CLI with a single atomic prompt. Kills and retries on timeout."""
    import tempfile
    for attempt in range(1, retries + 2):
        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as tf:
            tf.write(prompt)
            tf_path = tf.name
        try:
            r = subprocess.run(
                f'cat "{tf_path}" | claude -p -',
                shell=True, capture_output=True, text=True, timeout=timeout
            )
            os.unlink(tf_path)
            output = (r.stdout or "").strip()
            if output:
                return output
            logger.warning(f"Empty Claude response (attempt {attempt})")
        except subprocess.TimeoutExpired:
            logger.warning(f"Claude timeout {timeout}s (attempt {attempt})")
            track_event("api_error")
            try: os.unlink(tf_path)
            except: pass
        except Exception as e:
            logger.error(f"Claude error: {e}")
            try: os.unlink(tf_path)
            except: pass
    return ""


def generate_single_variant(brief_text: str, kb_context: str, variant_type: str,
                            variant_letter: str, revision_note: str = "") -> str:
    """Generate a SINGLE variant atomically (shorter prompt, faster response)."""
    variant_desc = {
        "Safe": "SAFE — Proven format, low production risk. BUT still brand-distinctive, NOT generic. If you swap the brand name and it still works, rewrite.",
        "Sweet Spot": "SWEET SPOT — Trending format with smart brand twist. Highest expected ROI. This is the one you'd recommend.",
        "Bold": "BOLD — Experimental, might polarize. High risk, high reward. Something no competitor would dare.",
    }

    revision = f"\n⚠️ PREVIOUS VERSION FAILED: {revision_note}\nFix these issues.\n" if revision_note else ""

    prompt = f"""You are BCC Creative Lead. Generate ONE concept variant for this brief.

{revision}
## Brand Context (from Knowledge Base)
{kb_context[:800] if kb_context else "No brand data."}

## Brief
{brief_text[:1500]}

## YOUR TASK
Generate ONLY **Variant {variant_letter} ({variant_type})**: {variant_desc.get(variant_type, variant_type)}

Include: Hook (1-3s), Visual Direction, Script/Storyboard table, Text Overlays (German), Caption (German), Hashtags, Production Notes.
Start with: ## Variant {variant_letter} — "Title"
All client-facing text in GERMAN."""

    return call_claude_atomic(prompt, timeout=90, retries=1)


def generate_and_judge(brief_text: str, kb_context: str, pipeline_id: str) -> dict:
    """Generate concepts with atomic per-variant calls + quality loop."""
    update_pipeline(pipeline_id, "GENERATING")
    track_event("brief_processed")

    max_retries = 2
    variants_config = [("A", "Safe"), ("B", "Sweet Spot"), ("C", "Bold")]
    best_concepts = ""
    best_scores = []
    revision_notes = {"A": "", "B": "", "C": ""}

    for attempt in range(1, max_retries + 2):
        logger.info(f"Generation attempt {attempt}/{max_retries + 1}")
        
        all_variants = []
        for letter, vtype in variants_config:
            update_pipeline(pipeline_id, "GENERATING", {
                "attempt": attempt,
                "current_variant": letter,
                "progress": f"Variant {letter} ({vtype})"
            })
            logger.info(f"  Generating Variant {letter} ({vtype})...")
            
            variant_text = generate_single_variant(
                brief_text, kb_context, vtype, letter,
                revision_notes.get(letter, "")
            )
            
            if variant_text:
                all_variants.append(variant_text)
                track_event("concept_generated", {"count": 1})
                logger.info(f"  ✅ Variant {letter} generated ({len(variant_text)} chars)")
            else:
                logger.warning(f"  ❌ Variant {letter} failed")

        if not all_variants:
            logger.error("All variant generations failed")
            continue

        concepts = "\n\n---\n\n".join(all_variants)

        # Judge each variant atomically too
        update_pipeline(pipeline_id, "JUDGING", {"attempt": attempt})
        scores = []
        
        for variant_text in all_variants:
            judge_prompt = f"""STRICT Creative Director. Score 1-5 (3=avg). Return ONLY JSON object.
Criteria: on_brief, platform_fit, scroll_stop_hook, brand_voice, trend_relevance, visual_clarity, german_quality, differentiation.

{variant_text[:2000]}

Return ONLY one JSON object: {{"variant":"A","title":"...","weighted_average":2.8,"verdict":"REVISE","one_line_summary":"...","red_flags":[]}}"""

            judge_raw = call_claude_atomic(judge_prompt, timeout=60, retries=1)
            if judge_raw:
                judge_raw = re.sub(r'```json\s*', '', judge_raw)
                judge_raw = re.sub(r'```\s*', '', judge_raw)
                try:
                    match = re.search(r'\{.*"verdict".*?\}', judge_raw, re.DOTALL)
                    if match:
                        score = json.loads(match.group())
                        scores.append(score)
                        v = score.get("variant", "?")
                        avg = score.get("weighted_average", 0)
                        verdict = score.get("verdict", "?")
                        logger.info(f"  ⚖️ Variant {v}: {avg}/5 {verdict}")
                        track_event("concept_scored", {"score": float(avg), "verdict": verdict})
                except:
                    logger.warning("Judge parse failed for a variant")

        best_concepts = concepts
        best_scores = scores

        # Check if all pass
        if scores and all(float(s.get("weighted_average", 0)) >= 3.0 for s in scores):
            logger.info(f"✅ All variants passed on attempt {attempt}")
            break

        # Extract feedback for failing variants
        for s in scores:
            avg = float(s.get("weighted_average", 0))
            if avg < 3.0:
                v = s.get("variant", "?")
                revision_notes[v] = s.get("one_line_summary", "Score too low")
                track_event("quality_loop_retry")
        
        logger.info(f"🔄 Retrying failing variants...")

    return {
        "concepts": best_concepts,
        "scores": best_scores,
        "all_passed": all(float(s.get("weighted_average", 0)) >= 3.0 for s in best_scores) if best_scores else False,
    }


def format_delivery_message(scores: list, client: str, brief_name: str) -> str:
    """Format concepts + scores for Telegram delivery."""
    header = f"🎨 **{client} — {brief_name}**\n"
    
    if all(float(s.get("weighted_average", 0)) >= 3.0 for s in scores):
        header += "✅ Alle Varianten bestanden\n\n"
    else:
        header += "⚠️ Einige Varianten brauchen Review\n\n"

    body = ""
    for s in scores:
        v = s.get("variant", "?")
        title = s.get("title", "")
        score = s.get("weighted_average", 0)
        verdict = s.get("verdict", "?")
        summary = s.get("one_line_summary", "")
        emoji = {"PASS": "✅", "REVISE": "⚠️", "REJECT": "❌"}.get(verdict, "?")
        body += f"{emoji} **Var {v} — {title}** | {score}/5\n→ {summary[:100]}\n\n"

    footer = "Reply: ✅ A/B/C | ✏️ B + Feedback | 🔄 Neu | ❌ Reject"
    return header + body + footer


def process_brief(brief_path: str) -> dict:
    """Process a brief through the full pipeline."""
    brief_file = Path(brief_path)
    if not brief_file.exists():
        logger.error(f"Brief not found: {brief_path}")
        return {"error": "Brief not found"}

    brief_text = brief_file.read_text(encoding="utf-8")
    client = detect_client(brief_text)
    pipeline_id = f"{client.lower()}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

    logger.info(f"Starting pipeline: {pipeline_id} (client: {client})")
    update_pipeline(pipeline_id, "NEW", {
        "client": client,
        "brief_file": str(brief_file),
        "brief_name": brief_file.stem,
    })

    # Query KB
    kb_context = query_knowledge_base(client)
    logger.info(f"KB context: {len(kb_context)} chars")

    # Generate + Judge with quality loop
    result = generate_and_judge(brief_text, kb_context, pipeline_id)

    if not result["concepts"]:
        update_pipeline(pipeline_id, "FAILED", {"reason": "Generation failed"})
        alert_system_fault("Concept generation failed after all retries", "creative-lead")
        return {"error": "Generation failed", "pipeline_id": pipeline_id}

    # Save concepts
    output_dir = SCRIPT_DIR / "creative-lead" / "test-output" / "pipeline"
    output_dir.mkdir(parents=True, exist_ok=True)
    concept_file = output_dir / f"{pipeline_id}-concepts.md"
    concept_file.write_text(result["concepts"], encoding="utf-8")

    # Save scores
    scores_file = output_dir / f"{pipeline_id}-scores.json"
    scores_file.write_text(json.dumps(result["scores"], indent=2, ensure_ascii=False))

    update_pipeline(pipeline_id, "READY", {
        "concept_file": str(concept_file),
        "scores_file": str(scores_file),
        "all_passed": result["all_passed"],
    })

    # Format delivery message
    state = load_state()
    brief_name = state["pipelines"][pipeline_id].get("brief_name", "Brief")
    telegram_msg = format_delivery_message(result["scores"], client, brief_name)

    return {
        "pipeline_id": pipeline_id,
        "client": client,
        "concept_file": str(concept_file),
        "scores": result["scores"],
        "all_passed": result["all_passed"],
        "telegram_message": telegram_msg,
    }


def process_approval(variant: str, concept_file: str, task_gid: str = "") -> dict:
    """Process a CEO approval — trigger Producer + auto-learn."""
    logger.info(f"Processing approval: Variant {variant} from {concept_file}")
    track_event("approval")

    result = {"variant": variant, "steps": []}

    # Auto-learn (flywheel)
    try:
        from handle_feedback import auto_learn_from_approval
        golden = auto_learn_from_approval(concept_file, variant)
        track_event("golden_example")
        result["steps"].append(f"🧠 Golden example saved: {golden}")
        logger.info(f"Auto-learned from approval: {golden}")
    except Exception as e:
        logger.warning(f"Auto-learn failed: {e}")

    # Move Asana task
    if task_gid:
        try:
            from handle_feedback import move_task, add_comment
            move_task(task_gid, "Concept Approved")
            add_comment(task_gid, f"✅ Variant {variant} approved ({datetime.now().strftime('%H:%M')})")
            result["steps"].append("📋 Asana task → Concept Approved")
        except Exception as e:
            logger.warning(f"Asana update failed: {e}")

    # Trigger Producer
    producer_script = SCRIPT_DIR / "producer" / "main.py"
    if producer_script.exists():
        output_dir = SCRIPT_DIR / "producer" / "test-output"
        output_dir.mkdir(parents=True, exist_ok=True)
        safe_name = Path(concept_file).stem
        output_file = output_dir / f"{safe_name}-var{variant}-package.md"
        
        result["steps"].append(f"🏗️ Producer triggered for Variant {variant}")
        result["producer_output"] = str(output_file)
        result["producer_trigger"] = {
            "concept_file": concept_file,
            "variant": variant,
            "output_file": str(output_file),
        }

    # Add PRODUCER_COMPLETE comment to Asana when package is ready
    if task_gid and result.get("producer_output"):
        result["asana_producer_comment"] = (
            f"[PRODUCER_COMPLETE] — Variant {variant} approved. "
            f"Production package: {result['producer_output']}. "
            f"Ready for Shoot. Move to 'Raw Footage Ready' when filmed."
        )

    return result


def show_status():
    """Show current pipeline status."""
    state = load_state()
    if not state["pipelines"]:
        print("📭 No active pipelines")
        return

    print(f"\n📊 BCC AI Pipeline Status ({len(state['pipelines'])} pipelines)\n")
    for pid, p in state["pipelines"].items():
        status = p.get("status", "?")
        client = p.get("client", "?")
        updated = p.get("updated", "?")[:16]
        emoji = {
            "NEW": "📥", "GENERATING": "📝", "JUDGING": "⚖️",
            "READY": "✅", "DELIVERED": "📨", "APPROVED": "👍",
            "PRODUCING": "🏗️", "PRODUCED": "📦", "EDITING": "🎬",
            "COMPLETE": "🏁", "FAILED": "❌",
        }.get(status, "❓")
        print(f"  {emoji} {pid} | {status} | {client} | {updated}")
        
        if p.get("scores"):
            for s in p["scores"]:
                v = s.get("variant", "?")
                score = s.get("weighted_average", 0)
                print(f"      Var {v}: {score}/5")


def main():
    parser = argparse.ArgumentParser(description="BCC AI Pipeline Orchestrator")
    parser.add_argument("--process", type=str, help="Process a brief file")
    parser.add_argument("--process-approval", nargs=2, metavar=("VARIANT", "CONCEPT_FILE"),
                        help="Process CEO approval")
    parser.add_argument("--task-gid", type=str, default="", help="Asana task GID for approval")
    parser.add_argument("--status", action="store_true", help="Show pipeline status")
    parser.add_argument("--metrics", action="store_true", help="Show system metrics")
    args = parser.parse_args()

    if args.status:
        show_status()
    elif args.metrics:
        print(get_metrics_summary())
    elif args.process:
        result = process_brief(args.process)
        if "error" in result:
            print(f"❌ {result['error']}")
        else:
            print(f"\n✅ Pipeline {result['pipeline_id']} ready")
            print(f"📁 Concepts: {result['concept_file']}")
            print(f"\n--- Telegram Message ---\n{result['telegram_message']}")
    elif args.process_approval:
        variant, concept_file = args.process_approval
        result = process_approval(variant, concept_file, args.task_gid)
        for step in result.get("steps", []):
            print(step)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
