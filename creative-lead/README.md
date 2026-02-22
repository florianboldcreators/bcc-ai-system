# 🎨 BCC Creative Lead

AI-powered concept generation pipeline for Bold Creators Club. Takes a raw client brief and produces 3 polished concept variants (Safe / Sweet Spot / Bold) ready for creative review.

## How It Works

```
Raw Brief → [Step 0: Parse] → [Step 1: Trend Research] → [Step 2: 3 Concepts] → Review
                  ↑
            Knowledge Base
         (brand voices, past work)
```

1. **You give it a brief** — messy Slack message, Asana task, whatever
2. **It structures the brief** — identifies client, key message, platform, missing info
3. **It researches trends** — finds 3-5 current formats that fit the client
4. **It generates 3 concepts** — Safe (proven), Sweet Spot (trending), Bold (experimental)
5. **You review** — score them, pick the best, send to production

## Quick Start

### Generate Concepts from a Brief
```bash
# Set your API key
export ANTHROPIC_API_KEY=sk-ant-...

# Run the pipeline
python main.py --input knowledge-base/raw_data/briefs/your-brief.md --output test-output/concepts.md
```

### Add Knowledge to the Brain
Drop files into the right folder and re-ingest:

```bash
# Add a new brief
cp your-brief.md knowledge-base/raw_data/briefs/

# Add brand guidelines
cp brand-manual.md knowledge-base/raw_data/brand-assets/

# Re-ingest the knowledge base
python scripts/ingest_rag.py
```

**Supported formats:** `.md`, `.txt` (PDF support coming in Phase 3)

### Search the Knowledge Base
```bash
python tools/query_brain.py "brand voice for SIXT"
python tools/query_brain.py "Gorenje retro collection" --client Gorenje
```

## Folder Structure

```
creative-lead/
├── main.py                 ← Entry point: brief in → concepts out
├── SKILL.md                ← AI persona definition (Creative Lead)
├── README.md               ← You are here
│
├── references/             ← Templates & guidelines
│   ├── brand-voices/       ← Client tone profiles (Hisense, Gorenje, SIXT)
│   ├── concept-template.md ← Output format for concepts
│   ├── caption-template.md ← Output format for captions
│   ├── quality-checklist.md← Self-check + Hopper review scorecard
│   └── workflow/           ← Detailed step-by-step instructions
│
├── knowledge-base/         ← The "Company Brain"
│   ├── raw_data/           ← Drop files here
│   │   ├── briefs/         ← Client briefs
│   │   ├── concepts/       ← Past approved concepts
│   │   ├── captions/       ← Published captions + performance data
│   │   ├── feedback/       ← Client/reviewer feedback
│   │   └── brand-assets/   ← Brand manuals, style guides
│   ├── metadata_schema.md  ← How files should be tagged
│   └── vector_db/          ← Auto-generated embeddings (don't edit)
│
├── scripts/                ← Backend tools
│   ├── ingest_rag.py       ← Turns files into searchable knowledge
│   ├── validate.py         ← Automated quality scorer
│   └── llm_judge.py        ← AI-powered evaluator (Phase 3)
│
├── tools/                  ← Agent tools
│   └── query_brain.py      ← Search the knowledge base
│
└── test-output/            ← Generated concepts & test data
    ├── blind-test/         ← 30 concepts for review
    └── BLIND_TEST_SCORECARD.md
```

## Adding New Clients

1. Create a brand voice file: `references/brand-voices/clientname.md`
2. Add past briefs to: `knowledge-base/raw_data/briefs/`
3. Run: `python scripts/ingest_rag.py`
4. The Creative Lead will now automatically pull this client's context

## Quality Control

Every concept is scored on 8 criteria:
- On-Brief (15%) — Does it answer the brief?
- Platform Fit (15%) — Right for TikTok/Instagram?
- Scroll-Stop Hook (15%) — Would you stop scrolling?
- Brand Voice (15%) — Sounds like the client?
- Trend Relevance (10%) — Current and well-applied?
- Visual Clarity (10%) — Can production team execute this?
- German Quality (10%) — Natural German, not translated?
- Differentiation (10%) — Are the 3 variants actually different?

**Pass threshold:** Average ≥ 7/10, no red flags.

## Phase Roadmap

- [x] **Phase 1:** Pipeline + Templates + Quality Checklist ✅
- [x] **Phase 2:** RAG Knowledge Base + Batch Testing ✅
- [ ] **Phase 3:** LLM-as-a-Judge calibration + Asana integration
- [ ] **Phase 4:** Production deployment (Make.com → Slack → Asana)
