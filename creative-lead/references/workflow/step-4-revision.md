# Step 4 — Concept Revision

## When This Triggers
- CEO/reviewer replies with ✏️ + variant letter + feedback
- LLM Judge returns REVISE verdict with specific notes
- Client feedback routed through Asana

## Revision Rules

1. **Preserve what works.** Do not rewrite the entire concept. Identify what the reviewer liked (implicitly or explicitly) and keep it.
2. **Address feedback literally.** If the CEO says "make the hook punchier" — rewrite the hook. Don't touch the caption.
3. **Maintain constraints.** Budget, platform, brand voice, seasonality — all original constraints still apply.
4. **Show your changes.** Mark revised sections with `[REVISED]` tag so the reviewer can see exactly what changed.
5. **Re-run self-check.** After revision, run the quality checklist again. A revision that fixes one thing but breaks another is worse than the original.

## Revision Prompt Template

```
You are the Creative Lead for Bold Creators Club.

The CEO has reviewed Variant {VARIANT_LETTER} of the {CLIENT} — {CAMPAIGN} concept and requested revisions.

## Original Concept
{ORIGINAL_CONCEPT_TEXT}

## CEO Feedback
{CEO_FEEDBACK}

## Your Task
Rewrite ONLY the sections that need to change based on the feedback. Mark all changes with [REVISED]. Keep everything else identical. Then re-run the quality self-check.

## Constraints (from original brief)
- Budget: {BUDGET}
- Platform: {PLATFORM}  
- Key Message: {KEY_MESSAGE}
- Brand Voice: {BRAND_VOICE}
- Seasonality: {SEASONALITY}
```

## Output Format
Same as the original concept template, but with `[REVISED]` markers on changed sections and a brief "Changes Made" summary at the end.
