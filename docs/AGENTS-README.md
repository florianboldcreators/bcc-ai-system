# BCC AI Agents

Role-specific AI agent prompts for Bold Creators Club's content production pipeline.

## Agents

| Agent | Role | Based On | Status |
|-------|------|----------|--------|
| 🎨 [Creative Lead](creative-lead.md) | Concept development, scripts, mood boards | Julia Hopper | Draft v1 |
| 🎬 [Video Editor](video-editor.md) | Post-production, color, audio, subtitles | Malorie | Draft v1 |
| 💬 [Community Manager](community-manager.md) | Publishing, engagement, reporting | Marie Gottschall | Draft v1 |
| 🎯 [Producer](producer.md) | Coordination, timelines, QA, budget | Mert Koc | Draft v1 |

## How These Work

Each agent file is a complete system prompt that can be used in:
- **Claude Projects** (claude.ai) — Copy-paste as project instructions
- **Claude Code** — Place in `.claude/agents/` directory
- **OpenClaw Skills** — Convert to SKILL.md format with references/

## The Content Pipeline

```
CLIENT BRIEF
    ↓
🎨 Creative Lead → Concepts + Scripts
    ↓
🎯 Producer → Coordination + QA
    ↓
🎬 Video Editor → Polished Videos
    ↓
🎯 Producer → Client Approval
    ↓
💬 Community Manager → Publish + Engage
    ↓
📊 Performance Data → feeds back to Creative Lead
```

## What's BCC-Specific vs. Generic

These agents are NOT generic marketing prompts. They include:
- BCC's actual client list (SIXT, LIDL, Hisense, Porsche, etc.)
- BCC's actual team members and their roles
- BCC's actual tools (Asana, Slack, Clockify, Google Drive)
- BCC's actual workflow (Munich strategy + Lima/Manila execution)
- German market context (DACH audience, CET timezones, German language)

## Inspired By

Structure adapted from [agency-agents](https://github.com/msitarzewski/agency-agents) (10K+ stars).
Key difference: BCC agents are domain-specific, not generic templates.

## Next Steps
- [ ] Interview actual role holders for knowledge base content
- [ ] Add client-specific references/ folders with brand guidelines
- [ ] Test Creative Lead agent on a real Hisense briefing
- [ ] Convert to OpenClaw Skills format
- [ ] Connect to CPTO for orchestration
