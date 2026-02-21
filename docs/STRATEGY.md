# BCC AI Strategy

*Stand: 20.02.2026*

---

## 🎯 Vision

**Von 40-Mann-Agentur zu 5 AI-Dirigenten**

Bold Creators Club transformiert von einer klassischen Content-Agentur zu einem AI-First Unternehmen, bei dem 5 "AI Conductors" ein Netzwerk von AI Clones orchestrieren.

---

## 🏗️ Architektur

```
Florian (CEO)
    ↓
CPTO (Claude Project) - Strategy, Evaluation, Operating System
    ↓ gibt Spec
James (OpenClaw) - Baut die Clones
    ↓ erstellt
Role Clones (Claude Projects) - Creative Lead, Producer, etc.
    ↓ genutzt von
Team Members (Hallhuber, Mert, etc.)
```

**Entscheidung (17.02.2026):** Kein separater "Builder Agent". James (OpenClaw) übernimmt Builder-Rolle.

---

## 📋 Pilot: Hisense/Gorenje Account

**Team:**
- Hallhuber (PM) → Testet Creative Lead Clone
- Hopper (Creative/Concepter) → Erste zu klonende Rolle
- Mert (Producer)
- Marie (Community Manager)
- Malorie (Editor)
- Marvin (Ads Specialist)

**Budget:** €5,000/Monat Automation Ceiling

---

## 🔬 Research Insights

### Jonas Diezun (Beam.ai) - 20.02.2026

**CEO Office System:**
- 60+ AI Personas als "Beirat"
- Frank Slootman, TEDx-Coaches, etc.
- **Brutales Feedback** statt netter Antworten
- Orchestrator entscheidet Routing

**Context Engineering:**
- Wichtiger als Prompt Engineering
- Richtige Info zum richtigen Zeitpunkt
- Nicht zu viel Context (kostet 23€ → optimiert auf 2€)

**Warum Projekte scheitern:**
1. Fehlendes Prozesswissen ("Ausnahme für Spanien")
2. Keine Systemzugänge
3. Mangelnder Drive
4. Kein Value-Fokus

**Time-to-Value:**
- 2022: 6 Monate
- 2025: 2 Wochen
- Best Case: 4 Stunden (wenn vorbereitet)

**Skalierung:**
- 25-50 Leute → 100M ARR möglich
- Keine Coder einstellen → Systemarchitekten, Prozessdenker

### Kagan (NUTZ) - 20.02.2026

**Creator Clone Struktur:**
- 1329 Facts in 7 Kategorien
- Knowledge Graph mit 836 Entities
- Kategorien: Biography, Ventures, Frameworks, Mental Models, Expertise, Style, Content

**Für BCC adaptiert:**
| NUTZ | BCC |
|------|-----|
| Biography | Role Background |
| Ventures | Client Projects |
| Frameworks | Working Methods |
| Mental Models | Decision Principles |
| Expertise | Domain Skills |
| Style | Communication Patterns |
| Content | Example Outputs |

---

## 🛠️ Technischer Stack

**Clone Hosting:**
- Claude Projects (claude.ai)
- System Prompts als CLAUDE.md
- Knowledge Files für Context

**Knowledge Extraction:**
- Slack Exports → Fact Extraction (Python + Claude)
- Kategorisierung nach NUTZ-Schema
- JSON Format für Portabilität

**Orchestration:**
- OpenClaw (James) für Execution
- Cron Jobs für Routine-Tasks
- Model Tiering (Opus für Complex, Sonnet für Routine)

---

## 📊 KPIs

| Metrik | Baseline | Target |
|--------|----------|--------|
| Konzepte pro Woche | ? | +50% |
| First-Time-Right Rate | ? | >80% |
| Time Briefing → Konzept | ? | -40% |
| Hopper-Äquivalenz | 0% | >80% |

---

## ⚠️ Risiken & Mitigations

| Risiko | Mitigation |
|--------|------------|
| Clone nicht gut genug | Iteratives Feedback, mehr Facts |
| Team-Widerstand | Hallhuber als Champion |
| Client merkt Unterschied | QA Layer vor Delivery |
| Datenschutz | Nur interne Slack-Daten |

---

## 📅 Next Steps

1. [ ] Hallhuber testet Creative Lead Clone
2. [ ] First-Time-Right Rate messen (1 Woche)
3. [ ] Feedback-Loop System bauen
4. [ ] "Kritiker-Persona" für QA
5. [ ] Asana/Frame.io API-Zugang klären

---

*Dieses Dokument wird kontinuierlich aktualisiert.*
