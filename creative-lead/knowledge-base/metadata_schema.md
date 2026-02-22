# Knowledge Base — Metadata Schema

## Purpose
Define how all ingested files are tagged before chunking for the vector database (RAG pipeline). Consistent tagging ensures the Creative Lead agent retrieves the most relevant context for each brief.

## Required Tags (per document)

| Tag | Type | Values | Example |
|-----|------|--------|---------|
| `client` | string | Hisense, Gorenje, SIXT, Decathlon, MINI, Porsche, etc. | `client: Decathlon` |
| `content_pillar` | string | Brand, Product, Community, Campaign, Seasonal | `content_pillar: Campaign` |
| `campaign_type` | enum | Organic, Paid, Pitch, Event, Always-On | `campaign_type: Pitch` |
| `platform` | list | Instagram, TikTok, YouTube, Cross-Platform | `platform: [TikTok, Instagram]` |
| `format` | enum | Reel, Carousel, Static, Story, Short, Long-Form | `format: Reel` |
| `language` | enum | DE, EN, Multi | `language: DE` |
| `date_created` | date | ISO 8601 | `date_created: 2026-01-15` |
| `author` | string | Team member who created it | `author: Juli Hopper` |
| `status` | enum | Draft, Approved, Published, Archived | `status: Published` |
| `performance_tier` | enum | Top (>100K views), Good (10K-100K), Average (<10K), Unknown | `performance_tier: Top` |

## Optional Tags

| Tag | Type | Description |
|-----|------|-------------|
| `trend_used` | string | Which trend/format was applied |
| `hook_type` | string | Scroll-stop mechanic used |
| `brief_id` | string | Asana task ID of the original brief |
| `concept_variant` | enum | A (Safe), B (Sweet Spot), C (Bold) |
| `hopper_score` | float | Score from Hopper Review Scorecard (1-10) |
| `client_feedback` | string | Summary of client reaction |

## File Naming Convention
```
{client}_{campaign}_{date}_{format}.{ext}
```
Example: `decathlon_deutschland-tour_20260501_reel.md`

## Directory Structure
```
knowledge-base/
├── raw_data/             ← Unprocessed ingested files
│   ├── briefs/           ← Raw client briefs
│   ├── concepts/         ← Approved concept decks
│   ├── captions/         ← Published captions with performance data
│   ├── feedback/         ← Client/Hopper review feedback
│   └── brand-assets/     ← Brand manuals, style guides
├── processed/            ← Chunked + tagged for vector DB
│   └── embeddings/       ← Vector embeddings (when RAG is live)
├── metadata_schema.md    ← This file
└── ingestion_log.md      ← Track what's been ingested
```

## Tagging Process
1. File lands in `raw_data/{category}/`
2. Creator (human or agent) adds YAML frontmatter with required tags
3. Validation script checks all required tags are present
4. File moves to `processed/` after successful tagging
5. Chunking + embedding happens on `processed/` files only

## Chunking Strategy (for RAG)
- **Briefs:** Chunk by section (Brief, Objectives, Target Audience)
- **Concepts:** Chunk by variant (A, B, C separately)
- **Captions:** Keep as single chunks (short enough)
- **Feedback:** Chunk by feedback point
- **Brand assets:** Chunk by section/chapter

## Embedding Model
TBD — Recommended: `text-embedding-3-large` (OpenAI) or `voyage-3` (Voyage AI)
Chunk size: 500-1000 tokens with 100-token overlap
