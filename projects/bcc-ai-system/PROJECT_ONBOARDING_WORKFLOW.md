# BCC AI Project Onboarding Workflow
**Critical:** This is how BCC AI MUST work when creating new projects  
**Date:** 2026-03-15  
**Source:** Florian's instructions

---

## Overview

**The Principle:** Research-First, Context-Aware Response

BCC AI is NOT a generic chatbot. It's a strategic partner that does homework BEFORE giving advice.

---

## The 6-Step Onboarding Process

### Step 1: Project Creation Trigger
**When:** User creates new project in excite-people.com

**Requirements:**
- ✅ Project must have a client name
- ✅ Client must be in Clockify
- ❌ If client NOT in Clockify → ask user to add first

---

### Step 2: Clockify Integration
**Action:** Extract client metadata from Clockify

**What to get:**
```
GET /workspaces/{workspaceId}/projects
→ Find project matching client name

GET /workspaces/{workspaceId}/projects/{projectId}
→ Extract:
  - Client email addresses (all team members)
  - Project tags
  - Hourly rates
  - Team members assigned
  - Notes/Description
```

**Workspace ID:** `69086c08cebb4f463b709644` (Bold Creators Club GmbH)  
**API Key:** In TOOLS.md

---

### Step 3: Wait for First Message (Instructions)
**What NOT to do:**
- ❌ Don't send generic "How can I help?"
- ❌ Don't answer immediately

**What to do:**
- ✅ Wait for user's first message with instructions
- ✅ Parse the message for: Client name, Campaign type, Deadline, Budget

---

### Step 4: Communication Channels Scan (BEFORE Response)
**Critical:** Scan ALL channels for context BEFORE answering

#### 4.1 Gmail Scan
**Target:** `florian@boldcreators.club`  
**Search for:**
```python
# Search query
query = f'from:{client_email} OR to:{client_email} OR subject:{client_name} after:{7_days_ago}'

# What to extract:
- Briefing emails
- Pitch guidelines sent by client
- Previous communication tone
- Stakeholder names mentioned
- Deadlines mentioned
- Budget discussions
```

**Tools:**
- Gmail API (token_florian.pickle)
- Script: `projects/email_analysis/search_client_emails.py`

---

#### 4.2 Slack Scan
**Channels to check:**
- All DMs with client (if exists)
- #clients channel
- Project-specific channels (if exists)

**Search for:**
```
Search: {client_name} OR {campaign_name}
Timeframe: Last 30 days

Extract:
- Internal discussions about client
- Team member opinions
- Known challenges
- Previous pitch wins/losses with this client
```

**Note:** Slack Export needed (weekly, see HEARTBEAT.md)

---

#### 4.3 WhatsApp Scan
**Target:** Browser automation on WhatsApp Web (openclaw profile)

**Process:**
```javascript
1. Open WhatsApp Web
2. Search for {client_name}
3. If chat exists:
   - Scroll to last 30 days
   - Extract:
     * Contact person names
     * Tone (formal/casual)
     * Response times
     * Topics discussed
     * Emoji usage (indicator of relationship warmth)
4. Check "likeabolt" group for mentions
```

---

#### 4.4 HubSpot Scan (if client exists)
**Target:** HubSpot CRM

**Search:**
```
1. Find Deal by company name
2. Extract:
   - Deal stage
   - Contact persons
   - Notes from calls
   - Email history (already in HubSpot)
   - Previous projects
   - Won/Lost deals
```

**Why important:** Shows relationship history, not just current project

---

### Step 5: Pitch Guidelines Check
**What to check:** Decathlon Learnings (Knowledge Base)

**Files:**
1. `decathlon-pitch-postmortem.md` (Anti-Patterns)
2. `decathlon-learnings-actionable.md` (Patterns)
3. `decathlon-pitch-learnings.md` (Deep Dive)

**Extract relevant patterns based on project type:**
- Budget-Reality-Check Protocol
- Brand-Fit-Assessment
- Strategic Pivot Options
- Red-Team Review Checklist
- Anti-Overconfidence Rules

**Map to current project:**
```python
if project.type == "pitch":
    check_patterns = [
        "Budget-Reality-Check",
        "Brand-Fit-Assessment",
        "Bewertungskriterien-Mapping",
        "First-Impression-Quality"
    ]
    
if project.budget < 20000:
    warn("Low budget - check Crew Optimization patterns")
    
if project.deadline < 7_days:
    warn("Short deadline - RED FLAG (see Decathlon 48h fail)")
```

---

### Step 6: Informed Question Phase
**NOW you can respond to the user**

**Response Structure:**
```
[Context Summary]
"Ich habe folgendes recherchiert:
- Gmail: [X] relevante Emails gefunden
- Slack: [Y] Diskussionen über {client}
- WhatsApp: [Z] Chat-Verlauf
- Clockify: Team {names} arbeitet an diesem Client"

[Briefing Understanding]
"Basierend auf dem Briefing verstehe ich:
- Ziel: {extracted_goal}
- Deadline: {date}
- Budget: {amount}
- Stakeholder: {names}"

[Informed Questions]
"Bevor ich Vorschläge mache, brauche ich noch:
1. [Question based on Gmail findings]
2. [Question based on Slack context]
3. [Question about gap in research]"

[Red Flags (if any)]
"⚠️ Ich sehe folgende Risiken:
- [From Decathlon Patterns]"
```

---

## Technical Implementation

### Frontend (excite-people.com)

**New Project Modal:**
```html
<form id="new-project-form">
  <label>Client Name</label>
  <input id="client-name" required>
  <button type="button" id="check-clockify">Check Clockify</button>
  <div id="clockify-status" class="hidden">
    ✅ Found in Clockify
    Emails: {emails}
    Team: {team}
  </div>
  
  <label>Campaign Type</label>
  <select id="campaign-type">
    <option>Pitch</option>
    <option>Production</option>
    <option>Consulting</option>
  </select>
  
  <label>First Instructions</label>
  <textarea id="first-message" placeholder="Paste briefing or describe task..."></textarea>
  
  <button type="submit">Create & Research</button>
</form>
```

---

### Backend (API Flow)

**POST /projects/create-with-research**

```python
@app.post("/projects/create-with-research")
async def create_project_with_research(
    client_name: str,
    campaign_type: str,
    first_message: str,
    user: User = Depends(get_current_user)
):
    # Step 1: Check Clockify
    clockify_data = await check_clockify(client_name)
    if not clockify_data:
        raise HTTPException(400, "Client not in Clockify")
    
    # Step 2: Extract emails
    emails = clockify_data.get('emails', [])
    
    # Step 3: Research Phase (background task)
    research_task = background_research.delay(
        client_name=client_name,
        emails=emails,
        first_message=first_message
    )
    
    # Step 4: Create project (status: researching)
    project = Project(
        name=f"{client_name} - {campaign_type}",
        status="researching",
        research_task_id=research_task.id
    )
    
    return {
        "project_id": project.id,
        "status": "researching",
        "eta": "30-60 seconds"
    }
```

---

### Background Research Task (Celery)

```python
@celery.task
def background_research(client_name, emails, first_message):
    results = {
        "gmail": [],
        "slack": [],
        "whatsapp": [],
        "hubspot": None,
        "pitch_patterns": []
    }
    
    # Gmail
    for email in emails:
        results["gmail"].extend(
            search_gmail(
                query=f"from:{email} OR to:{email}",
                days_back=7
            )
        )
    
    # Slack
    results["slack"] = search_slack(
        query=client_name,
        days_back=30
    )
    
    # WhatsApp
    results["whatsapp"] = search_whatsapp(
        client_name=client_name
    )
    
    # HubSpot
    results["hubspot"] = search_hubspot_deals(
        company_name=client_name
    )
    
    # Pitch Patterns (from Decathlon Learnings)
    campaign_type = extract_campaign_type(first_message)
    budget = extract_budget(first_message)
    deadline = extract_deadline(first_message)
    
    results["pitch_patterns"] = get_relevant_patterns(
        campaign_type=campaign_type,
        budget=budget,
        deadline=deadline
    )
    
    # Red Flags
    results["red_flags"] = []
    if deadline and deadline < 7_days:
        results["red_flags"].append({
            "type": "SHORT_DEADLINE",
            "message": "⚠️ Deadline <7 Tage = RED FLAG (siehe Decathlon 48h Fail)",
            "severity": "high"
        })
    
    if budget and budget < 10000:
        results["red_flags"].append({
            "type": "LOW_BUDGET",
            "message": "Budget <10k → Crew Optimization kritisch",
            "severity": "medium"
        })
    
    # Save to project
    update_project_research(project_id, results)
    
    # Generate informed questions
    questions = generate_questions_from_research(results)
    
    # Send to project chat
    send_ai_message(
        project_id=project_id,
        message=format_research_summary(results, questions)
    )
```

---

## Example Flow (Real World)

### User Input:
```
Client: LIDL
Campaign Type: Pitch
First Message: "LIDL will TikTok-Kampagne für neues Produkt. 
Deadline 20. März. Budget ca. 15k."
```

---

### BCC AI Research (Background, 30-60 sec):

**Gmail:**
- Found 12 emails with LIDL
- Last contact: 2026-02-28 (Alexandra)
- Tone: Formal, Du-Form avoided
- Briefing sent: 2026-02-15 (attached PDF)

**Slack:**
- #clients: "LIDL ist risk-averse, mag keine Experimente"
- DM Alexandra ↔ Florian: "LIDL Budget immer tight, hard negotiation"

**WhatsApp:**
- No chat found (all via email)

**HubSpot:**
- Deal: "LIDL Q1 2026 Pitch"
- Stage: Proposal
- Contact: Sarah Schmidt (sarah.schmidt@lidl.de)
- Previous: Lost deal Dec 2025 (competitor had lower price)

**Clockify:**
- Team: Alexandra, Jose, Mert
- Hourly rate: €120
- Total hours last month: 0 (new project)

**Pitch Patterns (Decathlon Learnings):**
- Budget-Reality-Check: €15k for TikTok → tight but doable
- Deadline: 20. März = 5 days → RED FLAG
- Brand-Fit: LIDL = Mass-Market (wie Decathlon) ✅
- Risk: Previous lost deal on price → pricing strategy critical

---

### BCC AI Response:

```
🔍 RECHERCHE ABGESCHLOSSEN

Ich habe folgendes über LIDL gefunden:

📧 GMAIL (12 Emails):
• Letzter Kontakt: Alexandra, 28. Feb
• Ton: Formal, per "Sie"
• Briefing vom 15. Feb liegt vor (PDF)

💬 SLACK (3 Diskussionen):
• LIDL ist risk-averse, experimentiert ungern
• Budget-Verhandlungen immer hart
• Alexandra kennt den Client am besten

📊 HUBSPOT:
• Kontakt: Sarah Schmidt (sarah.schmidt@lidl.de)
• Warnung: Wir haben Dec 2025 Pitch verloren (Preis-Grund)
• Current Stage: Proposal

⏰ CLOCKIFY:
• Team: Alexandra, Jose, Mert verfügbar
• Rate: €120/h

---

📋 BRIEFING-VERSTÄNDNIS:

✅ Client: LIDL
✅ Ziel: TikTok-Kampagne (neues Produkt)
✅ Deadline: 20. März (5 TAGE!) ⚠️
✅ Budget: ~€15.000

---

🚨 RED FLAGS (aus Decathlon-Learnings):

1. DEADLINE <7 TAGE
   • Decathlon-Fail: 48h-Pitch trotz perfekter Strategie verloren
   • Grund: Insufficient polish, competitor hatte mehr Zeit
   • Risiko: 5 Tage = knapp, aber machbar wenn FOKUS
   • Empfehlung: Scope reduzieren auf Kernbotschaft

2. PREIS-SENSITIVITÄT
   • Dec 2025 Pitch an günstigeren Wettbewerb verloren
   • €15k Budget = tight für TikTok (€120/h rate)
   • Napkin Math: 125h verfügbar (inkl. Team)
   • Empfehlung: Crew Optimization (Hybrid-Rollen)

3. RISK-AVERSE CLIENT
   • LIDL experimentiert ungern (aus Slack)
   • TikTok = für LIDL evtl. neues Terrain
   • Empfehlung: Proof-Points von anderen Retail-Clients zeigen

---

❓ INFORMIERTE FRAGEN (basierend auf Research):

1. PRODUKT-DETAILS:
   • Was ist das neue Produkt? (Lebensmittel/Non-Food?)
   • Zielgruppe? (Gen Z für TikTok?)
   • Gibt es bereits Briefing-PDF (vom 15. Feb)?

2. PRICING-STRATEGIE:
   • Wissen wir warum Dec-Pitch verloren? (nur Preis oder auch Qualität?)
   • Sollen wir diesmal aggressive Pricing oder Value-Stacking?
   • Decathlon-Learning: Transparenz kann als Schwäche gelesen werden

3. TEAM & TIMING:
   • Kann Alexandra lead? (Sie kennt LIDL am besten)
   • 5 Tage Pitch-Prep: Realistisch oder sollen wir ablehnen?
   • Decathlon-Learning: Lieber nicht pitchen als rushed wirken

4. SCOPE:
   • Was erwartet LIDL für €15k?
   • Content-Anzahl? (X Videos)
   • Nur Konzept oder auch Produktion?

---

💡 NÄCHSTE SCHRITTE:

Basierend auf deinen Antworten erstelle ich:
1. Budget-Reality-Check (Napkin Math)
2. Crew-Plan (Hybrid-Rollen für €15k)
3. Red-Team-Review (Decathlon-Patterns anwenden)
4. Pitch-Strategie (Value-Stacking vs. Price-War)

Lass uns die 4 Fragen klären, dann geht's los! 🎩
```

---

## Success Metrics

**How to measure if this workflow works:**

1. **Context-Accuracy:**
   - ✅ 90%+ of emails found are relevant
   - ✅ Slack mentions provide useful internal context
   - ✅ HubSpot data shows relationship history

2. **Question-Quality:**
   - ✅ User says "Good question, didn't think of that"
   - ✅ Questions based on research, not generic
   - ✅ Red Flags are accurate (user confirms)

3. **Time-Efficiency:**
   - ✅ Research phase <60 seconds
   - ✅ User doesn't have to repeat context
   - ✅ Faster to first useful output

4. **Pattern-Application:**
   - ✅ Decathlon Learnings referenced when relevant
   - ✅ Budget-Reality-Check done proactively
   - ✅ Red Flags prevent repeated mistakes

---

## Anti-Patterns (What NOT to Do)

❌ **Generic Response:**
```
"Hi! How can I help with your LIDL project?"
```
→ This wastes research opportunity

❌ **Immediate Answer:**
```
User: "LIDL TikTok pitch, 15k budget"
AI: "Great! Here's a concept..."
```
→ No context, probably wrong

❌ **Asking for Info You Have:**
```
AI: "What's the client's email?"
```
→ It's in Clockify! Don't ask, just look.

❌ **Ignoring Red Flags:**
```
User: "Deadline morgen"
AI: "Okay, let's start!"
```
→ Should warn: "Decathlon lost 48h-Pitch trotz perfekter Strategie"

---

## Files to Create

1. ✅ This file (`PROJECT_ONBOARDING_WORKFLOW.md`)
2. ⏳ `research_scripts/gmail_search.py`
3. ⏳ `research_scripts/slack_search.py`
4. ⏳ `research_scripts/whatsapp_search.py`
5. ⏳ `research_scripts/hubspot_search.py`
6. ⏳ `research_scripts/clockify_extract.py`
7. ⏳ `research_scripts/pattern_matcher.py` (Decathlon Learnings)
8. ⏳ `api/endpoints/projects_research.py`

---

## Integration into excite-people.com

**UI Changes Needed:**

1. **Project Creation Modal:**
   - Add "Check Clockify" button
   - Show client metadata preview
   - "Create & Research" button (not instant create)

2. **Research Status Indicator:**
   - Show "Researching... (30s remaining)"
   - Progress bar: Gmail → Slack → WhatsApp → HubSpot → Patterns

3. **Research Summary Display:**
   - Collapsible sections for each channel
   - Red Flags prominently displayed
   - Pattern-Matches highlighted

---

## Next Steps

1. **Implement Research Scripts** (Python)
2. **Build Background Task System** (Celery or similar)
3. **Update Frontend** (Research UI)
4. **Test with Real LIDL/Decathlon Case**
5. **Measure Metrics** (Context-Accuracy, Question-Quality)

---

**Status:** Documented 2026-03-15  
**Owner:** James (OpenClaw)  
**Priority:** CRITICAL for BCC AI effectiveness
