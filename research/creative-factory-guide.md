# Creative Factory - AI Ad Creative Automation

**Quelle:** Ac Hampton (@HamptonAc_) - X Article
**Datum:** 20.02.2026
**Relevanz:** Creative Lead Clone / Content Production

---

## Das Problem

Content Teams verbringen 5+ Stunden täglich mit:
- Ad Libraries durchscrollen nach Winnern
- Hooks raten die funktionieren könnten
- Manuell Ad-Variationen schreiben
- Creatives einzeln testen

**Lösung:** AI Agent der das automatisiert - scrapen, analysieren, generieren, testen, reporten.

---

## Setup (Step by Step)

### STEP 1: Ad Scraper einrichten

**n8n Workflow:**
- Trigger: Täglich 7:00
- Node 1: Apify Facebook Ads Library Scraper
- Input: Nische Keywords, Competitor Brand Names
- Output: JSON mit Creative, Copy, Engagement Metrics

Dasselbe für TikTok Ads Library.

**Zeit:** 20 Minuten

---

### STEP 2: Analyzer bauen

**Prompt:**
```
Analysiere diese Ads aus [Nische]. Daten: [JSON].

Für jede Ad extrahiere:
- Hook (erste 3 Sekunden oder erste Zeile)
- Angle (welchen Pain/Desire sie targetd)
- Format (UGC, Static, Animation, etc.)
- Engagement Signals (Likes, Comments, Shares)

Dann:
- Ranke Top 10 nach Engagement
- Identifiziere Patterns in Winnern
- Flagge Hooks die mehrfach auftauchen (proven)
- Note was fehlt das wir testen könnten

Output als Tabelle.
```

**Zeit:** 10 Minuten

---

### STEP 3: Variationen generieren

**Prompt:**
```
Hier sind die Top Hooks in [Nische]: [Liste].
Für mein Produkt: [Produkt-Beschreibung].

Generiere:
- 50 Variationen vom #1 Hook adaptiert für mein Produkt
- 30 Variationen vom #2 Hook
- 20 komplett neue Angles basierend auf Patterns

Für jede:
- Hook (erste Zeile oder erste 3 Sek Script)
- Body Copy (2-3 Sätze)
- CTA

Mach sie menschlich. Kein Corporate Speak. Kein Cringe.
Wie jemand der mit einem Freund redet.
```

**Zeit:** 10 Minuten für 100 Variationen

---

### STEP 4: Voiceovers hinzufügen (Optional)

**ElevenLabs API:**
```
Konvertiere diese Scripts zu Voiceover: [Scripts].
Voice: [Casual, Energetic, etc.]
Pacing: Natural, nicht rushed.
Output: MP3 Files.
```

**Zeit:** 15 Minuten für Batch

---

### STEP 5: Testing Workflow

**Facebook Ads Manager API via n8n:**
1. Top 20 Variationen nehmen
2. Ad Set erstellen mit jeder als separater Ad
3. Budget: $5-10 pro Variation
4. 48-72 Stunden laufen lassen
5. Performance Daten ziehen

**Analyse Prompt:**
```
Performance Daten für 20 Ad Variationen: [Daten].

Identifiziere:
- Top 3 Performer (nach CTR und Conversion)
- Bottom 5 (sofort killen)
- Middle Performer die Iteration wert sind

Für Top 3, erkläre:
- Warum es funktioniert
- 10 neue Variationen zum Testen basierend auf Winnern
```

---

### STEP 6: Daily Reports

**Cron Job 9:00:**
```
Kompiliere Ad Performance Report:
- Spend gestern
- Top Ads (CTR, CPC, ROAS)
- Worst Performer (pausieren)
- Neue Variationen zum Testen
- Competitor Ads worth noting

Sende an Telegram.
```

---

## Ergebnisse (Case Studies)

| Wer | Vorher | Nachher |
|-----|--------|---------|
| Dropshipper | 5h/Tag manuell | 20 Min Reports reviewen, $100K/mo |
| Agency | Manuell für jeden Client | Einmal bauen, $2K/mo pro Client, $50K MRR |
| H&M | Manuell | 70% AI-generiert, +25% Purchases |
| Media Buyer | 10 Variationen/Woche | 100/Woche, ROAS 1.8 → 3.2 |

---

## Fehler vermeiden

1. **Illegal scrapen:** Offizielle APIs nutzen wo möglich. Apify hat compliant Scraper.

2. **Kein Human Review:** AI generiert manchmal Müll. Erste 50 Variationen manuell reviewen.

3. **Zu viele gleichzeitig testen:** Nicht 100 Ads parallel. Budget spread zu dünn. 10-20 testen, Winner finden, Loser killen, iterieren.

4. **Daten ignorieren:** Der ganze Punkt ist datengetriebene Entscheidungen. Wenn du trotzdem nach Bauchgefühl gehst, hast du Zeit verschwendet.

---

## Für BCC Creative Lead Clone

**Direkt anwendbar:**

| Konzept | BCC Implementierung |
|---------|---------------------|
| Hook-Analyse | Clone analysiert Top TikToks für Hisense/Gorenje |
| Variation Generator | Clone generiert 50 Konzept-Varianten |
| Pattern Recognition | Clone erkennt was bei Competitor funktioniert |
| Daily Reports | Automatische Trend-Reports für Team |

**Integration:**
- Exolyt Daten → Claude analysiert
- Clone generiert Konzepte basierend auf Patterns
- Hallhuber reviewed und gibt Feedback
- Feedback-Loop macht Clone besser

---

## Tools & Kosten

| Tool | Kosten | Funktion |
|------|--------|----------|
| OpenClaw | Free | Agent Framework |
| Claude API | $20/mo | LLM |
| Apify | $49/mo | Scraping |
| n8n | Free | Workflows |
| ElevenLabs | $5/mo | Voiceovers |
| Facebook Ads API | Free | Testing |

**Total:** ~$80/mo

---

*Gefiltert für Creative Lead Relevanz am 20.02.2026*
