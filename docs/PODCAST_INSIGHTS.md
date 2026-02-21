# Podcast Insights: Jonas Diezun (Beam.ai)

**Quelle:** AI FIRST Podcast mit Felix Schlenther
**Episode:** "Wie Du ein CEO Office aus KI-Agenten aufbaust"
**Datum:** 20.02.2026
**Dauer:** 47 Minuten
**Transcript:** `../transcripts/jonas-diezun-beam-ai.txt`

---

## 🎯 Kernaussagen

### 1. "Die letzte Firma, die man noch bauen muss"

Jonas glaubt, dass Beam die letzte Firma ist, die er bauen muss - weil man mit AI-Agents dann alles andere bauen kann.

> "Mittlerweile bin ich felsenfest davon überzeugt. Zum Beispiel habe ich mein eigenes CEO Office gebaut, wo ich alle meine Prozesse automatisiere. Und das ist nicht nur, dass ich mich selbst in AI gieße, sondern ich versuche eine **verbesserte Version** von mir selbst zu bauen."

---

### 2. CEO Office mit 60+ AI Personas

**Aufbau:**
1. Alle Aktivitäten aufgelistet (Calls, Prep, Follow-ups, E-Mails)
2. Tools verbunden (Gmail, Notion, Präsentationen)
3. Einzelne Skills/Bausteine gebaut
4. Orchestrator der entscheidet wo was hingeht

**Personas als Beirat:**
- Frank Slootman (ex-Snowflake CEO)
- Diverse Top-CEOs und Investoren
- TEDx Coaches
- Sogar ein Highrocks-Coach (weil er angefangen hat zu klettern)

> "Ich habe Frank Slootman und ganz viele Leute als AI-Personas, die mir auf alles Feedback geben. Wenn ich jetzt nach diesem Podcast alleine gehe, dann heißt es wieder 'Jonas, das war eine gute Antwort, das war nicht so eine geile Antwort, nächstes Mal bitte das besser machen.'"

**Feedback-Loop:**
- Iteriert bis Score 8/10 erreicht
- Nicht nur nachbauen was er macht, sondern **verbessern**

---

### 3. Context Engineering > Prompt Engineering

> "Vom Prompt-Engineering zu Context-Engineering: Ich muss die richtigen Informationen zum richtigen Zeitpunkt haben - und auch nicht zu viele."

**Problem ohne Optimierung:**
- 30 PDFs + Jira Tickets + weitere Docs = sehr viele Tokens
- Kosten: 23€ pro Execution (!)

**Nach Optimierung:**
- Selektiver Context
- System weiß was wann relevant ist
- Kosten: 1-2€ pro Execution

**Konkret:**
- Nicht immer das teuerste Modell (Opus 4.5)
- Gemini Flash + 3x Korrektur = besser & billiger
- System muss "intelligent" Context managen

---

### 4. Warum Agent-Projekte scheitern

**Nicht an der Tech!** Sondern an:

1. **Fehlendes Prozesswissen**
   > "Die haben genaue Regeln wie über verschiedene Länder die Invoice gestellt werden muss. Aber es gibt diese eine Ausnahme für Spanien. Warum? Weiß eigentlich auch keiner mehr."

2. **Keine Systemzugänge**
   - SharePoint, ERP, etc. nicht angebunden
   - Security-Audits dauern

3. **Mangelnder Drive**
   > "Ob ich jetzt 3 Stunden einspare oder 10.000€... hochkehrs. Dann macht man das am Ende nicht."

4. **Vertrauen-Problem**
   > "Der Anspruch an AI Agents ist extrem hoch. Wir hatten Cases wo uns gesagt wurde der Agent macht die Aufgabe nicht gut. Dann stellten wir fest, dass die Menschen noch viel schlechter waren."

---

### 5. Time-to-Value Evolution

| Jahr | Time-to-Value |
|------|---------------|
| 2022 | ~6 Monate |
| 2025 | ~2 Wochen |
| 2026 | **4 Stunden** (wenn vorbereitet) |

> "Wir hatten jetzt eine KSB Einführung und haben den AI-Agent in 4 Stunden fertig gebaut, weil es vorbereitet war."

**Was "vorbereitet" bedeutet:**
- Prozesswissen dokumentiert
- Systemzugänge geklärt
- Klarer Value Case definiert

---

### 6. Skalierung: 25-50 Leute → 100M ARR

> "Du kannst mit 25-50 Leuten auf 100 Millionen kommen."

**Wer wird eingestellt:**
- Früher: Prompt Engineers, Coder
- Jetzt: "Fast klassische Berater die Prozess-Denken haben und Fragen stellen"
- Systemarchitekten und Orchestratoren

> "Selbst unser HR Team oder Marketing Team - wird erwartet, dass sie Systeme bauen und Agents bauen, die ihren Job schneller und besser machen."

---

### 7. Selbstlernende Systeme

**Feedback-Loop Mechanik:**

1. AI executes Output
2. Andere AI (oder Mensch) bewertet
3. Fehler werden erkannt
4. System verbessert sich

> "Es gab ein Paper von OpenAI, dass man 80% der Fehler so relativ einfach wieder ausbessern kann."

**Beispiel:**
```
Order → ERP-System
    ↓
Später: Was ist wirklich passiert?
    ↓
1,2,3 Werte waren falsch (von Menschen korrigiert)
    ↓
Differenz zurück ins System: "Mach das nächstes Mal besser"
```

---

### 8. 2026 Prognose

1. **Weniger "AI Agents"** → Mehr "AI Systems"
2. **Keine Demos mehr** → Nur messbarer Business Impact
3. **Time-to-Value** sinkt weiter
4. **Günstigere, schnellere Modelle**

> "Am Ende, ganz ehrlich, ist es auch egal ob es ein AI Agent ist oder ein Prompt oder ein Workflow. Am Ende muss halt was bei rumkommen, was mir in der Firma hilft."

---

## 🎯 Action Items für BCC

| # | Learning | BCC Anwendung |
|---|----------|---------------|
| 1 | CEO Office mit Personas | Florian's "Advisor Board" |
| 2 | Brutales Feedback | Kritiker-Clone vor Client-Delivery |
| 3 | Context Engineering | Selektive Facts im Clone |
| 4 | Prozesswissen dokumentieren | "Ausnahmen für X" erfassen |
| 5 | Time-to-Value fokussieren | 4h wenn vorbereitet |
| 6 | Systemzugänge klären | Asana, Frame.io APIs |
| 7 | Feedback-Loop bauen | Konzept-Bewertung → Clone lernt |
| 8 | KPIs definieren | Nicht Demos, sondern Impact |

---

## 💡 Zitate zum Merken

> "Ich baue nicht nur das nach was ich mache, sondern ich nutze AI um mich zu **enthänzen** und eine bessere Version von mir selbst zu bauen."

> "Der Anspruch an AI ist deutlich höher als bei Menschen."

> "Eigentlich baust du am Ende Organisation nach, wie Organisationen aufgebaut sind - mit Team Leitern, Gruppen Leitern. Aber jetzt baust du das so, dass es für AI gebaut ist."

> "Technisch gibt's keine Grenzen mehr. Es ist nur eine Frage des Aufwandes."

---

*Transkribiert mit OpenAI Whisper (tiny model) am 20.02.2026*
