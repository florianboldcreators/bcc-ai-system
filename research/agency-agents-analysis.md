# Agency-Agents Repo Analysis
**Date:** 2026-03-12
**Source:** https://x.com/gregisenberg/status/2030680849486668229
**Repo:** https://github.com/msitarzewski/agency-agents

## Overview
Greg Isenberg tweeted about a GitHub repo that lets you "spin up an AI agency with AI employees." 10K+ stars in 7 days. 1.3M views, 8.6K likes, 23K bookmarks.

The repo contains ~60 specialized AI agent prompts organized into 9 departments:
1. Engineering (7+ agents) — frontend, backend, mobile, AI, devops, prototyping, senior dev
2. Design (7) — UI/UX, research, architecture, branding, visual storytelling, image generation
3. Marketing (8+) — growth hacking, content, twitter, tiktok, instagram, reddit, app store
4. Product (3) — sprint prioritization, trend research, feedback synthesis
5. Project Management (5) — production, coordination, operations, experimentation
6. Testing (7) — QA, performance analysis, API testing, quality verification
7. Support (6) — customer service, analytics, finance, legal, executive reporting
8. Spatial Computing (6) — XR, VisionOS, WebXR, Metal, Vision Pro
9. Specialized (6) — multi-agent orchestration, data analytics, sales, distribution

## Community Sentiment (from 381 replies + quotes)

### Hype Camp (80%)
- **@morganlinton** (1.4K likes, 488K views): "One of the most useful GitHub repos on the planet"
- **@kloss_xyz**: "I'm not crazy cause I've been doing this for the last week" 😭
- Massive bookmarking (23K) — people want this concept to exist
- International traction (Korean, Arabic quote tweets spreading it)

### Critical Camp (20% — but the smarter voices)

**@aakashgupta (310 likes, 68K views) — THE reality check:**
> "10K Stars and almost none of them know what they actually starred. Each 'agent' is a markdown file you copy into ~/.claude/agents/ or .cursor/rules/. There's NO coordination layer, no task handoff, no shared memory between agents. You manually invoke one persona at a time inside your existing coding tool. YOU are the orchestration layer. You decide which persona to activate, what context to pass between them, and how their outputs connect. The gap between 'I want an AI frontend developer, backend architect, and DevOps engineer collaborating on my project' and 'I can load different system prompts one at a time' is where the actual hard problem lives. Multi-agent coordination, shared project state, autonomous task decomposition, conflict resolution when the Backend Architect's schema breaks the Frontend Developer's component structure. That's the engineering problem nobody has solved cleanly yet."

**@BlakeHer_on (46 likes, 10K views):**
> "The hard problem nobody talks about with multi-agent setups is shared memory. The frontend dev agent needs to know what the backend architect decided three sessions ago. Right now most of these frameworks just lose that context between runs."

**@yury_yakubchyk:**
> "We've been testing something similar for internal tools. The coordination between agents is wild when it works but breaks down fast on complex handoffs."

## Key Insight: What This Actually Is
- **NOT** an AI agency that coordinates autonomously
- **IS** a well-organized collection of system prompts / persona definitions
- Each "agent" is a markdown file with: Identity, Core Mission, Workflows, Deliverables, Success Metrics
- You manually activate one persona at a time in Claude Code, Cursor, or similar tools
- No shared state, no handoffs, no coordination layer

## What We Adopted for BCC AI
1. **Prompt structure** — Identity → Mission → Rules → Workflow → Metrics → Anti-Patterns
2. **Technical depth** — Their Short-Video Editing Coach is extremely detailed (color grading, audio engineering, export specs). Used as inspiration for our Video Editor agent
3. **Specialized agents > generalist** — Validates our CPTO + Role Clones architecture

## Why BCC AI Is Already Ahead
| Feature | agency-agents | BCC AI |
|---------|--------------|--------|
| Prompts | ✅ Generic | ✅ BCC-specific (real clients, real team) |
| Knowledge Base | ❌ None | ✅ Hopper interview, brand guidelines |
| Shared Memory | ❌ None | ✅ MEMORY.md, daily files, CPTO state |
| Orchestration | ❌ Manual | ✅ James (OpenClaw) as orchestrator |
| Task Handoff | ❌ None | ✅ Asana pipeline, defined handoff points |
| Tool Integration | ❌ None | ✅ Clockify, HubSpot, Gmail, WhatsApp |
| Domain Specificity | ❌ Generic marketing | ✅ German TikTok/IG for enterprise brands |

## Conclusion
The 23K bookmarks and 1.3M views prove massive demand for "AI agency" concepts. But the repo is packaging (well-organized prompts), not product (autonomous coordination). The real value is in the structure and the vision it sells. BCC AI is building the actual thing — domain-specific agents with shared context, real tools, and a human orchestrator (James) who manages handoffs.
