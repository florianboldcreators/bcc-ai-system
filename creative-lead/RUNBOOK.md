# 🎨 Creative Lead AI — Runbook für Florian

*Dein AI Creative Lead in 5 Minuten erklärt.*

---

## 1. Der tägliche Ablauf

### Neuen Brief einstellen

1. Öffne **Asana** → Projekt **"AI Concepting"**
2. Erstelle eine neue Task in der **"New Brief"** Spalte
3. **Task-Name:** z.B. "Porsche Taycan — Frühlings-Push"
4. **Beschreibung:** Schreib den Brief rein — so wie du ihn normalerweise an Hopper schicken würdest. Stichpunkte reichen:
   - Client + Kampagne
   - Zielgruppe
   - Key Message
   - Plattform (TikTok / IG Reels / beides)
   - Budget
   - Timeline
   - Was der CMO will / nicht will
   - Referenzen

### James starten

Sag James einfach im **Telegram-Chat**:

> "James, zieh den neuen Brief aus Asana und generiere Konzepte"

James macht dann automatisch:
1. ✅ Brief aus Asana holen
2. ✅ Brand-Datenbank durchsuchen (Markenrichtlinien, vergangene Kampagnen)
3. ✅ 3 Konzept-Varianten generieren (Safe / Sweet Spot / Bold)
4. ✅ Automatische Qualitätsprüfung (LLM Judge)
5. ✅ Dir die Konzepte mit Scores auf Telegram schicken

**Dauer:** ca. 3 Minuten

---

## 2. Die Telegram-Steuerung

Wenn du die Konzepte auf Telegram bekommst, antworte einfach mit:

| Emoji | Bedeutung | Was passiert |
|-------|-----------|-------------|
| ✅ B | **Approve** Variant B | Task in Asana → "Concept Approved" |
| ✏️ B, mach den Hook punchiger | **Revision** mit Feedback | James überarbeitet nur Variant B |
| 🔄 | **Neu generieren** | 3 komplett neue Varianten |
| ❌ | **Reject** | Task in Asana → "Concept Rejected" |

**Beispiele:**
- `✅ B` → Variant B wird approved
- `✏️ C, zu artsy, zeig das Auto mehr` → Variant C wird überarbeitet
- `🔄 Brief ist unklar, hier mehr Details: ...` → Komplett neu

---

## 3. Neue Marke hinzufügen (Das "Gehirn" füttern)

Wenn ein neuer Client dazukommt oder du neue Brand-Dokumente hast:

### Schritt 1: Dateien ablegen
Kopiere die Dateien (PDF, Markdown, Text) hierhin:
```
bcc-ai-system/creative-lead/knowledge-base/raw_data/brand-assets/
```

### Schritt 2: Brand Voice erstellen
Erstelle eine kurze Datei in:
```
bcc-ai-system/creative-lead/references/brand-voices/clientname.md
```
Mit: Ton, Zielgruppe, Do's & Don'ts, Content Pillars.

### Schritt 3: James Bescheid sagen
> "James, ingestiere die neuen Brand-Dokumente"

James extrahiert den Text, erstellt Embeddings und aktualisiert die Datenbank.

---

## 4. Troubleshooting

**"James antwortet nicht"**
→ Schick ihm "ping" auf Telegram. Wenn keine Antwort: OpenClaw neustarten.

**"Konzepte sind zu generisch"**
→ Brief ist zu dünn. Je mehr Details im Brief, desto besser die Konzepte. Vor allem: Was will der CMO NICHT sehen?

**"Falsche Markensprache"**
→ Brand Voice Datei prüfen/aktualisieren. Dann: "James, ingestiere die Brand-Dokumente neu."

**"Judge ist zu streng/zu lasch"**
→ Sag James: "Passe den Judge an — [strenger/lockerer] bei [Kriterium]"

---

## 5. Was die AI NICHT kann

- ❌ Echte Trend-Recherche (nutzt Wissen bis Trainings-Cutoff)
- ❌ Footage drehen oder bearbeiten
- ❌ Client-Calls führen
- ❌ Budget verhandeln
- ❌ Garantieren dass ein Konzept viral geht

Die AI ersetzt die **Konzept-Erstellung**, nicht das **kreative Urteil**. Du bist immer noch der finale Filter.

---

## 6. Kosten

| Posten | Kosten/Monat |
|--------|-------------|
| Claude API (via Setup Token) | ~€50-100 (je nach Nutzung) |
| Asana | Bereits vorhanden |
| Mac Mini (Strom) | ~€10 |
| **Total** | **~€60-110/Monat** |

Zum Vergleich: Ein Creative Lead kostet €4.000-6.000/Monat.

---

*Version 1.0.0-beta — 22. Februar 2026*
*Bei Fragen: Einfach James fragen.*
