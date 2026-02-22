# Step 0 — Brief Structurer (Detailed)

## Purpose
Transform a raw, unstructured brief into a clean structured format that Step 1 can work with.

## Input Sources
- **Asana task:** Read task name, description, custom fields, attachments
- **Slack message:** Parse free-text brief from PM
- **Direct input:** CEO or PM pastes brief directly

## Required Fields
| Field | Required | Source | Notes |
|-------|----------|--------|-------|
| Client | ✅ | Brief | Must match known client list |
| Campaign / Content Pillar | ✅ | Brief | Cross-check against client's pillar list |
| Platform | ✅ | Brief | IG Reels, TikTok, IG Carousel, IG Static |
| Key Message | ✅ | Brief | The ONE takeaway for the audience |
| Product / Focus | ✅ | Brief | Specific product or brand moment |
| Target Audience | ⚠️ | Brief or brand profile | Use default from brand voice if missing |
| Tone | Auto | Brand voice file | Load from references/brand-voices/{client}.md |
| Mandatory Elements | ⚠️ | Brief | Logos, legal, hashtags, CTAs |
| Deadline | ⚠️ | Asana or brief | Flag if missing |

## Handling Missing Information
- If a required field is missing → list it under **MISSING** section
- If you can reasonably infer it → fill it and mark `[ASSUMED]` with reasoning
- Never guess the client name or key message without `[ASSUMED]`

## Output Format
```markdown
## Structured Brief

**Client:** [name]
**Campaign / Content Pillar:** [pillar]
**Platform:** [platform]
**Key Message:** [message]
**Product / Focus:** [product]
**Target Audience:** [audience]
**Tone:** [loaded from brand voice]
**Mandatory Elements:** [list]
**Deadline:** [date]

### Missing Information
- [field]: [why it matters]

### Assumptions
- [field]: [assumed value] — [reasoning]
```
