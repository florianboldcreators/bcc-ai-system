# BCC AI System — Architecture Map

*Last updated: 2026-02-22 | v1.0.0-beta | 24 commits*

---

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FLORIAN (CEO)                         │
│                   Telegram Chat                          │
│  ✅ Approve  ✏️ Revise  🔄 Regenerate  ❌ Reject        │
└──────────┬──────────────────────────────┬───────────────┘
           │                              │
           ▼                              ▼
┌──────────────────┐          ┌──────────────────────┐
│   ASANA BOARD    │          │   JAMES (OpenClaw)   │
│  "AI Concepting" │◄────────►│   Orchestrator       │
│                  │          │   CDP → Gemini CPTO  │
│  Sections:       │          └──────────┬───────────┘
│  • New Brief     │                     │
│  • In Progress   │          ┌──────────┴───────────┐
│  • Concept       │          │                      │
│    Approved      │     ┌────▼─────┐          ┌─────▼────┐
│  • Raw Footage   │     │ CREATIVE │          │ LLM      │
│    Ready         │     │ LEAD     │          │ JUDGE    │
│  • Concept       │     │ Agent    │          │ (strict) │
│    Rejected      │     └────┬─────┘          └──────────┘
└──────────────────┘          │
                              │ 3 Concepts
                              ▼
                    ┌─────────────────┐
                    │    PRODUCER     │
                    │    Agent        │
                    └────────┬────────┘
                             │ Production Package
                             ▼
                    ┌─────────────────┐
                    │     EDITOR      │
                    │     Agent       │
                    └─────────────────┘
                             │ Post-Production Blueprint
                             ▼
                       📦 DELIVERABLE
```

---

## Data Flow (End-to-End)

### Phase 1: Brief → Concepts
```
Asana "New Brief"
  → asana_sync.py polls every 5 min
  → Brief saved to knowledge-base/raw_data/briefs/
  → main.py:
      1. Detect client name
      2. Query RAG knowledge base (query_brain.py)
      3. Load SKILL.md persona + brand context
      4. Generate 3 variants (A=Safe, B=Sweet Spot, C=Bold)
  → LLM Judge scores all 3 (strict 1-5 scale)
  → Deliver to CEO via Telegram
  → Asana task → "In Progress"
```

### Phase 2: Approval → Production Package
```
CEO replies "✅ B" on Telegram
  → handle_feedback.py:
      1. Move Asana task → "Concept Approved"
      2. Add comment with timestamp
      3. PRODUCER_TRIGGER: Extract Variant B
  → producer/main.py:
      1. Load SKILL.md (Producer persona)
      2. Read approved concept
      3. Apply Munich 2026 pricing table
      4. Generate: Shot List, Equipment, Schedule, Budget, Talent Brief, Risk Assessment
  → Deliver Production Package to CEO via Telegram
```

### Phase 3: Footage → Post-Production Blueprint
```
Task moved to "Raw Footage Ready" in Asana
  → asana_sync.py detects section change
  → editor/main.py:
      1. Load SKILL.md (Editor persona)
      2. Read approved concept + production package
      3. Generate: Pacing Guide, Sound Design, Typography, Color Grading,
         Retention Triggers, Export Settings
  → Deliver Blueprint to CEO via Telegram
```

### Phase 4: Revision Loop
```
CEO replies "✏️ B, make hook punchier"
  → handle_feedback.py:
      1. Parse variant + feedback text
      2. Load step-4-revision.md rules
      3. Re-generate concept with targeted changes
      4. Mark changes with [REVISED] tags
  → Deliver revised concept to CEO via Telegram
```

---

## Agent Registry

| Agent | Folder | Status | Input | Output |
|-------|--------|--------|-------|--------|
| **Creative Lead** | `creative-lead/` | ✅ v1.0.0-beta | Raw brief (text) | 3 concept variants (Markdown) |
| **LLM Judge** | `creative-lead/scripts/` | ✅ Active | Concept variant | Score 1-5, verdict, feedback |
| **Producer** | `producer/` | ✅ v0.1.0 | Approved concept | Production package (Markdown) |
| **Editor** | `editor/` | ✅ v0.1.0 | Concept + Package | Post-production blueprint (Markdown) |
| **CPTO** | `cpto/` | ✅ Active | Strategic questions | Architecture decisions |
| **Builder** | `builder/` | ✅ Active | CPTO specs | Code + infrastructure |

### Planned (not built)
| Agent | Purpose | Priority | Trigger |
|-------|---------|----------|---------|
| Community Manager | Comment responses, engagement | Medium | Published content |
| Ads Specialist | Paid media strategy, A/B tests | Medium | Approved concept |
| Account Manager | Client communication, briefs | Low | Inbound email/Slack |

---

## Infrastructure

### Knowledge Base (RAG)
- **Vector Store:** JSON + numpy (local, no external DB)
- **Embedding Model:** all-MiniLM-L6-v2 (SentenceTransformers)
- **Chunks:** 113 (from 33 files)
- **Sources:** 3 brand manuals (Gorenje, Hisense), 10 Gorenje briefs, 9 synthetic briefs, 3 brand voices, workflow docs

### Integration Points
| System | Method | Status |
|--------|--------|--------|
| **Asana** | REST API (PAT) | ✅ Read + Write |
| **Telegram** | OpenClaw message tool | ✅ Active |
| **Slack** | Webhook (deliver_webhook.py) | ⏳ Needs scopes fix |
| **Make.com** | Webhook (deliver_webhook.py) | ⏳ Ready, unconfigured |
| **GitHub** | PAT, `florianboldcreators/bcc-ai-system` | ✅ Active |
| **Gemini CPTO** | CDP WebSocket | ✅ Active |

### Cost Model
| Component | Monthly Cost |
|-----------|-------------|
| Claude API (via setup token) | ~€50-100 |
| Asana | Existing |
| Mac Mini (power) | ~€10 |
| **Total AI System** | **~€60-110** |
| **Human Creative Lead** | **€4.000-6.000** |
| **Savings** | **€3.900-5.900/month (98%)** |

---

## Repository Structure
```
bcc-ai-system/
├── ARCHITECTURE.md          ← This file
├── cpto/SKILL.md            ← CPTO persona
├── builder/SKILL.md         ← Builder persona
├── creative-lead/           ← Agent 1: Concepts
│   ├── SKILL.md
│   ├── RUNBOOK.md
│   ├── README.md
│   ├── main.py              ← CLI entry point
│   ├── references/          ← Templates, brand voices, workflows
│   ├── knowledge-base/      ← RAG data + vector store
│   ├── scripts/             ← asana_sync, validate, llm_judge, handle_feedback, ingest_rag, deliver_webhook
│   ├── tools/               ← query_brain.py
│   └── test-output/         ← Generated concepts, judge results
├── producer/                ← Agent 2: Production
│   ├── SKILL.md
│   ├── main.py
│   └── test-output/
├── editor/                  ← Agent 3: Post-Production
│   ├── SKILL.md
│   ├── main.py
│   └── test-output/
└── metrics/
    └── shadow_mode.md       ← Man vs Machine tracker
```

---

*Built in 1 day. 24 commits. 3 AI agents. 1 pipeline.*
