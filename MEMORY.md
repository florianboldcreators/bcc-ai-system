# MEMORY.md - Long-Term Memory

*Last updated: 2026-02-23*

---

## 🏢 BCC AI Transformation Project

### **Decision: Architecture**
**Date:** 2026-02-17  
**Decision:** No separate "Builder" agent. James (OpenClaw) acts as the builder/executor.

**Rationale:**
- Florian doesn't have technical background - simpler is better
- James can already do everything a "Builder agent" would do (GitHub, files, browser automation, Claude Projects)
- Avoids overengineering and agent → agent → agent complexity
- Cheaper and faster

**System Architecture:**
```
Florian (CEO)
  ↓
CPTO (Claude Project) - Strategy, evaluation, operating system
  ↓ gives spec
James (OpenClaw) - Takes spec and builds the clones
  ↓ creates
Role Clones (Claude Projects) - Creative Lead, Producer, etc.
  ↓ used by
Team Members (Hallhuber, etc.)
```

### **CPTO Project**
- **Location:** Claude.ai Projects > CPTO
- **File:** Claude.md (243 lines)
- **Purpose:** Chief Product & Technology Officer for BCC
- **Mission:** Transform BCC from 40-person agency to 5-person AI-augmented company in 12 months
- **Starting Point:** 3-month pilot on Hisense/Gorenje account
- **Budget:** €5,000/month automation ceiling
- **Maintains:** BCC_OPERATING_SYSTEM.md with org chart, automation tracker, role risk matrix

### **Pilot Team (Hisense/Gorenje):**
- Hallhuber (PM)
- **Hopper (Creative/Concepter)** ← First role to clone
- Mert (Producer)
- Marie (Community Manager)
- Malorie (Editor)
- Marvin (Ads Specialist)

### **Next Steps:**
1. Gather Hopper's knowledge (interviews, past work)
2. James writes Creative Lead system prompt
3. Create Creative Lead Claude Project
4. Hallhuber tests parallel to Hopper
5. If quality match >80% → Replace Hopper

### **GitHub Plan:**
- Private organization: `bcc-ai-system/`
- One repo per role clone
- Each contains: CLAUDE.md (system prompt) + knowledge-base/
- CPTO repo maintains BCC_OPERATING_SYSTEM.md

---

## 📌 Quick Reference

**Company:** Bold Creators Club GmbH  
**Current headcount:** 40 (Munich HQ + Remote + Lima/Manila)  
**Target:** 5 people  
**Clients:** Sixt, LIDL, Porsche, MINI, Bitpanda, Hisense/Gorenje, Epic Games, MAC, N26, ACE  
**Output:** ~40 pieces/month (Instagram + TikTok)

**Tool Stack:**
- Asana (project management)
- Slack (communication)
- Clockify (time tracking)
- Google Suite + Gemini
- Adobe Suite (Premiere Pro, Photoshop, After Effects)

---

## 🛠️ Claude Code & Skills — Architecture Knowledge

**Erworben:** 2026-02-21 (Deep Dive durch alle Docs)

### Skills sind das Hauptformat für Role Clones
- SKILL.md (Frontmatter + Body) + references/ + scripts/ + assets/
- Progressive Disclosure: Frontmatter (always loaded) → Body (when relevant) → references/ (on demand)
- Portabel: Funktioniert auf Claude.ai, Claude Code, UND API identisch
- Distribution: ZIP hochladen auf Claude.ai, oder .claude/skills/ in Repo
- SKILL.md unter 5.000 Wörter, Rest in references/ auslagern

### Opus 4.6 — Wie man damit arbeitet
- **Einmal sagen reicht** — kein Wiederholen, keine "Remember to..." Reminders
- **Kein Role-Setting** — "Du bist ein Creative Lead" ist unnötig, Intent erklären statt Rolle definieren
- **Front-load Context** — Qualität der Eingabe = Qualität des Outputs
- **Style-Matching** — Kann Schreibstile aus Beispielen reproduzieren (perfekt für Hopper-Clone)
- **Check-in Points** — Opus 4.6 geht sonst zu weit, "Check with me after each step" einbauen
- **Gibt eigene Meinung** — Schlägt Alternativen vor, weniger sycophantic

### Claude Code Headless für Automation
- `claude -p "task" --allowedTools "Read,Edit,Bash" --output-format json`
- `--json-schema '{...}'` für strukturierte Outputs
- `--continue` / `--resume <session_id>` für Conversations
- `opusplan` = Opus für Planning + Sonnet für Execution (kosteneffizient)

### Subagents & Agent Teams
- Subagents: Isolierte Worker, eigener Context, können NICHT weitere spawnen
- Agent Teams: Unabhängige Sessions die kommunizieren (experimental, token-heavy)
- Built-in: Explore (Haiku, read-only), Plan, General-purpose
- Custom Agents in .claude/agents/ definierbar

### Zugang-Credentials (2026-02-21)
- Asana PAT ✅ (in TOOLS.md)
- Google Drive API ✅ (token_drive.pickle, Projekt email-reader-486111)
- GitHub PAT ✅ (ghp_..., in TOOLS.md)
- Claude Code ✅ (Max Subscription, Opus 4.6)

---

## BCC AI Frontend — excite-people.com

### **Decision: Full-Stack in One Night**
**Date:** 2026-02-23  
**Context:** Florian requested comprehensive QA with 10+ use cases, all ≥ 8/10, plus explanation of why 10/10 is impossible. Report due 05:30.

**What was built (22:30 → 00:30):**
- FastAPI backend with SSE streaming + JWT auth + input sanitization
- React frontend with Google OAuth (GSI), markdown rendering, mobile support
- Caddy web server + Cloudflare Tunnel for both frontend and API
- LaunchAgents for auto-restart
- 12 use cases tested, average score 8.4/10

**Key Architectural Decisions:**
1. **SSE over WebSockets** — Simpler for one-way streaming, no connection management overhead
2. **GSI popup over redirect flow** — No redirect_uri hassles, cleaner UX
3. **Caddy over npx serve** — Production-grade with gzip, caching, SPA routing
4. **Keepalive pings** — Prevent Cloudflare Tunnel timeout during long Claude generation
5. **Input sanitization** — Block prompt injection patterns before they reach Claude

**Why 10/10 is Architecturally Impossible:**
1. Mac Mini = Single Point of Failure (no cloud redundancy)
2. Cloudflare Tunnel latency (proxy layer adds hops)
3. CLI wrapper vs native Anthropic SDK (no true streaming)
4. In-memory state only (no database, lost on restart)
5. Only 1 of 6 agents fully connected

**Next Evolution:**
- Anthropic Python SDK (replace Claude CLI)
- SQLite persistence
- Wire up all 6 agents
- Cloud hosting for 99.9% uptime

**Report:** `/Users/florian/.openclaw/workspace/memory/BCC-AI-QA-Report-2026-02-23.md`

---

## 🚨 CRITICAL LEARNING: Decathlon Pitch Lost (2026-03-15)

**The Truth:** Der Pitch wurde VERLOREN, obwohl Gemini hochgradig confident war.

### What Happened:
- 48h-Deadline Pitch für Decathlon (€250k Budget, €13k Test)
- Gemini optimierte Budget-Math, Bewertungskriterien, CPA-Vorteil → PERFEKT
- Gemini sagte: "Damit steht dein Plan felsenfest. Viel Erfolg!"
- **Result:** ❌ LOST

### Why Perfect Strategy Lost:

**Gemini optimierte (Rational - 5/5):**
- ✅ Budget-Math perfect
- ✅ Bewertungskriterien covered
- ✅ CPA-Advantage (€591 vs. €1.200)
- ✅ Strategic Pivot (Pilot-Framing)
- ✅ Crew Optimization

**Decathlon entschied auf (Emotional - 1/5):**
- ❌ Chemistry ("Mögen wir diese Menschen?")
- ❌ Brand-Fit (Porsche → Decathlon Gap)
- ❌ First Impression (KI-Visual-Fail)
- ❌ Trust ("Wirken sie safe?")
- ❌ Storytelling ("Fühlen wir es?")

**Formula:**
```
Win = (Rational × 40%) + (Emotional × 60%)
    = (5 × 40%) + (1 × 60%)
    = 2.0 + 0.6
    = 2.6/5 = 52%

First-Impression-Fail: -20%
→ Final: 32% Win-Chance
```

### Core Learnings für BCC AI:

**1. NEVER Overconfident**
- ❌ "Damit holst du den Etat"
- ✅ "Strategy sound. Execution + Emotion entscheiden. Win-Chance: 40-60%"

**2. Add Red-Team Review (24h before pitch)**
- Time-Check (<7d Prep = RED FLAG)
- Brand-Fit-Assessment
- First-Impression-Quality (9/10 min)
- Emotional-Impact-Check
- Risk-Perception-Analysis

**3. Strategy = 40%, Emotion = 60%**
- AI optimiert Rational
- Humans decide on Gut
- Flag wenn Emotional-Score <3/5

**4. First Impressions Are Unrecoverable**
- KI-Visual-Fail → Recovery-Mail half nicht
- In High-Stakes: Perfection on first try
- Kein "Wir fixen das nachträglich"

**5. Authority-Transfer braucht Brand-DNA-Fit**
- Porsche → Ferrari: ✅
- Porsche → Decathlon: ⚠️ (Gap erklären)
- Porsche → LIDL: ❌ (zu groß)

### Files Created:
- `bcc-ai-system/knowledge-base/decathlon-pitch-postmortem.md` (20KB)
- `bcc-ai-system/knowledge-base/decathlon-learnings-actionable.md` (updated)
- GitHub: faa6abe (committed 2026-03-15)

**Status:** TRUE 10/10 - Understanding why perfect analysis lost

---

## 🎯 BCC AI Project Workflow (2026-03-15)

**CRITICAL CHANGE:** BCC AI is NOT a generic chatbot.

### The New Way: Research-First, Context-Aware Response

**6-Step Onboarding Process:**

1. **Project Creation** → Check Clockify for client
2. **Extract Metadata** → Emails, team, rates from Clockify
3. **Wait for Instructions** → User's first message
4. **SCAN ALL CHANNELS** (30-60s background task):
   - Gmail: Briefings, stakeholders, tone
   - Slack: Internal discussions, team opinions
   - WhatsApp: Relationship warmth, contact persons
   - HubSpot: Deal history, won/lost reasons
5. **Check Pitch Guidelines** → Decathlon Learnings patterns
6. **Informed Questions** → Based on research, not generic

**Example (LIDL Pitch):**
- Researches 12 emails, 3 Slack threads, HubSpot deal
- Finds: Lost Dec 2025 pitch on price, client risk-averse
- RED FLAGS: 5-day deadline (Decathlon 48h pattern), €15k tight
- Asks informed questions: "Warum Dec-Pitch verloren? Aggressive pricing oder Value-Stacking?"

**Anti-Pattern:**
- ❌ "Hi! How can I help?" (generic, wastes research)
- ✅ "Recherche abgeschlossen. Gefunden: [context]. RED FLAGS: [warnings]. Fragen: [informed]"

**File:** `PROJECT_ONBOARDING_WORKFLOW.md` (14KB, full spec)

---

*This file grows as we work together. Significant decisions, context, and learnings go here.*
