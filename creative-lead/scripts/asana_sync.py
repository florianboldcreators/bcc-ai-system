#!/usr/bin/env python3
"""
BCC Creative Lead — Asana Brief Sync

Polls an Asana project for new briefs in the "New Brief" section,
extracts task details, and saves them as structured brief files.

Usage:
    python asana_sync.py --project PROJECT_GID
    python asana_sync.py --project PROJECT_GID --poll 300  # poll every 5 min
    python asana_sync.py --list-projects  # find project GIDs

Requirements:
    ASANA_PAT environment variable (Personal Access Token)
"""

import os
import sys
import json
import time
import argparse
import urllib.request
from pathlib import Path
from datetime import datetime

# --- Configuration ---
ASANA_PAT = os.environ.get("ASANA_PAT", "")
ASANA_BASE = "https://app.asana.com/api/1.0"
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
BRIEFS_DIR = PROJECT_ROOT / "knowledge-base" / "raw_data" / "briefs"
SYNC_STATE_FILE = SCRIPT_DIR / ".asana_sync_state.json"

# Sections that contain new briefs (case-insensitive matching)
NEW_BRIEF_SECTIONS = ["new brief", "new briefs", "neue briefs", "incoming", "to concept", "general", "🗂️ general", "📂 general"]

# Section that triggers the Editor clone
RAW_FOOTAGE_SECTIONS = ["raw footage ready", "footage ready", "rohmaterial fertig", "post-production"]

# Shadow mode: Real production projects to monitor
SHADOW_MODE_PROJECTS = {
    "1211046661939568": "🖥️ Hisense",
    "1211046662010247": "🧡🚘 SIXT",
    "1212808160983275": "🍳Gorenje Dashboard",
}

# Delivery is ALWAYS private to CEO Telegram only
SHADOW_MODE = True  # When True, never post to team channels


def asana_get(endpoint: str, params: dict = None) -> dict:
    """Make a GET request to the Asana API."""
    if not ASANA_PAT:
        print("❌ ASANA_PAT not set.", file=sys.stderr)
        sys.exit(1)

    url = f"{ASANA_BASE}/{endpoint}"
    if params:
        query = "&".join(f"{k}={v}" for k, v in params.items())
        url += f"?{query}"

    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {ASANA_PAT}",
        "Accept": "application/json",
    })

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        print(f"❌ Asana API error {e.code}: {body[:500]}", file=sys.stderr)
        return {"data": []}


def list_projects() -> list:
    """List all projects in the workspace."""
    # Get workspaces first
    workspaces = asana_get("workspaces")["data"]
    projects = []
    for ws in workspaces:
        ws_projects = asana_get(f"workspaces/{ws['gid']}/projects",
                                {"opt_fields": "name,archived"})["data"]
        for p in ws_projects:
            if not p.get("archived"):
                projects.append({"gid": p["gid"], "name": p["name"], "workspace": ws["name"]})
    return projects


def get_sections(project_gid: str) -> list:
    """Get all sections in a project."""
    return asana_get(f"projects/{project_gid}/sections")["data"]


def get_tasks_in_section(section_gid: str) -> list:
    """Get all tasks in a section with full details."""
    tasks = asana_get(f"sections/{section_gid}/tasks",
                      {"opt_fields": "name,notes,completed,custom_fields,created_at,assignee.name,tags.name"})
    return tasks.get("data", [])


def format_brief(task: dict) -> str:
    """Convert an Asana task into a structured brief markdown."""
    name = task.get("name", "Untitled")
    notes = task.get("notes", "")
    created = task.get("created_at", "")[:10]
    assignee = task.get("assignee", {})
    assignee_name = assignee.get("name", "Unknown") if assignee else "Unassigned"
    tags = [t["name"] for t in task.get("tags", [])]

    # Try to extract client from task name or tags
    client = "Unknown"
    known_clients = ["Decathlon", "SIXT", "Porsche", "MINI", "Hisense", "Gorenje",
                     "Bitpanda", "N26", "MAC", "ACE", "Epic Games", "LIDL"]
    for c in known_clients:
        if c.lower() in name.lower() or c.lower() in notes.lower():
            client = c
            break
    for tag in tags:
        for c in known_clients:
            if c.lower() in tag.lower():
                client = c
                break

    brief = f"""---
source: asana
task_gid: "{task['gid']}"
client: "{client}"
status: pending_generation
created: "{created}"
assignee: "{assignee_name}"
tags: {json.dumps(tags)}
synced_at: "{datetime.now().isoformat()}"
---

# {name}

{notes}
"""
    return brief.strip()


def load_sync_state() -> dict:
    """Load previously synced task GIDs."""
    if SYNC_STATE_FILE.exists():
        return json.loads(SYNC_STATE_FILE.read_text())
    return {"synced_gids": [], "last_sync": None}


def save_sync_state(state: dict):
    """Save sync state."""
    state["last_sync"] = datetime.now().isoformat()
    SYNC_STATE_FILE.write_text(json.dumps(state, indent=2))


def sync_project(project_gid: str) -> list:
    """Sync new briefs from an Asana project."""
    state = load_sync_state()
    synced_gids = set(state.get("synced_gids", []))

    sections = get_sections(project_gid)
    new_brief_sections = [
        s for s in sections
        if any(nb in s["name"].lower() for nb in NEW_BRIEF_SECTIONS)
    ]

    if not new_brief_sections:
        print(f"⚠️  No 'New Brief' section found. Available sections:", file=sys.stderr)
        for s in sections:
            print(f"   - {s['name']} ({s['gid']})", file=sys.stderr)
        # Fall back to first section
        if sections:
            new_brief_sections = [sections[0]]
            print(f"   Using first section: {sections[0]['name']}", file=sys.stderr)

    BRIEFS_DIR.mkdir(parents=True, exist_ok=True)
    new_briefs = []

    for section in new_brief_sections:
        tasks = get_tasks_in_section(section["gid"])
        for task in tasks:
            if task.get("completed"):
                continue
            if task["gid"] in synced_gids:
                continue

            brief_md = format_brief(task)
            # Sanitize filename
            safe_name = "".join(c if c.isalnum() or c in "-_ " else "" for c in task["name"])
            safe_name = safe_name.strip().replace(" ", "-").lower()[:60]
            filename = f"asana-{safe_name}.md"
            filepath = BRIEFS_DIR / filename

            filepath.write_text(brief_md, encoding="utf-8")
            synced_gids.add(task["gid"])
            new_briefs.append({"file": filename, "task": task["name"], "gid": task["gid"]})
            print(f"✅ Synced: {task['name']} → {filename}")

    state["synced_gids"] = list(synced_gids)
    save_sync_state(state)
    return new_briefs


def main():
    parser = argparse.ArgumentParser(description="Sync Asana briefs to knowledge base")
    parser.add_argument("--project", type=str, help="Asana project GID")
    parser.add_argument("--poll", type=int, help="Poll interval in seconds (default: one-shot)")
    parser.add_argument("--list-projects", action="store_true", help="List available projects")
    args = parser.parse_args()

    if args.list_projects:
        projects = list_projects()
        print(f"\n📋 Found {len(projects)} projects:\n")
        for p in projects:
            print(f"  {p['gid']}  {p['name']}  ({p['workspace']})")
        return

    if not args.project:
        parser.print_help()
        print("\n💡 Use --list-projects to find your project GID", file=sys.stderr)
        sys.exit(1)

    if args.poll:
        print(f"🔄 Polling every {args.poll}s (Ctrl+C to stop)")
        while True:
            new = sync_project(args.project)
            if new:
                print(f"📥 {len(new)} new brief(s) synced")
            else:
                print(f"   No new briefs ({datetime.now().strftime('%H:%M')})")
            time.sleep(args.poll)
    else:
        new = sync_project(args.project)
        print(f"\n📥 Synced {len(new)} new brief(s)")


if __name__ == "__main__":
    main()
