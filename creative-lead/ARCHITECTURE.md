# Creative Lead — Technical Architecture
## CPTO Integration Spec → Builder Brief

### Pipeline
```
Step 0: Brief Structurer    → Parses raw brief into structured fields
Step 1: Trend Research      → 3-5 trends with remix angles
Step 2: Concept Generation  → 3 variants (A=Safe, B=Sweet Spot, C=Bold)
  ⏸️  HOPPER REVIEW CHECKPOINT (Slack notification)
Step 3: Caption Refinement  → IG + TikTok captions, German, hashtags
```

### Folder Structure (Builder must create)
```
creative-lead/
├── SKILL.md                          # Main skill file — pipeline orchestrator
├── ARCHITECTURE.md                   # This file (CPTO spec)
├── references/
│   ├── quality-checklist.md          # Self-check + Hopper review scorecard
│   ├── concept-template.md           # Output template for Step 2
│   ├── caption-template.md           # Output template for Step 3
│   ├── brand-voices/
│   │   ├── hisense.md                # Brand voice profile (exists)
│   │   ├── gorenje.md                # Brand voice profile (exists)
│   │   └── sixt.md                   # Brand voice profile (exists)
│   └── workflow/
│       ├── step-0-brief-structurer.md
│       ├── step-1-trend-research.md
│       ├── step-2-concept-generation.md
│       └── step-3-caption-refinement.md
└── knowledge-base/                   # Existing — Slack exports, examples
```

### SKILL.md Blueprint
- **name:** creative-lead
- **model:** anthropic/claude-sonnet-4-6
- **allowed-tools:** Read, Write, Edit, exec, web_search, web_fetch
- **Body:** Pipeline orchestration — runs Steps 0→3 in sequence, loads references on demand, runs self-check before delivering each step

### Integration Points
| Tool    | Where Used                    | How                                           |
|---------|-------------------------------|-----------------------------------------------|
| Claude  | Steps 0-3                     | LLM logic for all creative work               |
| Asana   | Task tracking                 | Read brief from Asana task, update status      |
| Slack   | Hopper Review checkpoint      | Post concepts after Step 2, wait for feedback  |

### Quality Gate
- Self-check runs automatically before delivery (every step)
- Hopper scores each variant on the Review Scorecard
- Pass threshold: average score ≥ 7/10 across all criteria
- Any "red flag" = auto-block delivery until fixed

### Constraints from CEO Spec
- All text overlays and captions MUST be in native German
- Exactly 3 variants per concept round (no more, no less)
- Hashtags: 8-12 for IG, 3-5 for TikTok
- Brand voice must match correct client (cross-contamination = critical failure)
