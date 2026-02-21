# NUTZ Analysis: Kagan's Creator Clone System

**Quelle:** https://nutz-rooms.vercel.app/creators/kagan/dashboard
**Analysiert:** 20.02.2026
**Gebaut von:** Kagan (Gorillas Gründer)

---

## 🎯 Was NUTZ ist

NUTZ ist eine **Creator AI Clone Platform** die es ermöglicht, AI-Versionen von Personen zu erstellen basierend auf deren Interviews, Posts und Videos.

---

## 📊 Struktur von Kagan's Clone

### Knowledge Base: 1329 Facts

| Kategorie | Anzahl | Beschreibung |
|-----------|--------|--------------|
| Biography | 274 | Persönlicher Background |
| Ventures | 499 | Business-Erfahrungen |
| Frameworks | 250 | Arbeitsweisen |
| Mental Models | 79 | Entscheidungsprinzipien |
| Expertise | 127 | Fachwissen |
| Style | 61 | Kommunikationsstil |
| Content | 39 | Published Work |

### Knowledge Graph: 836 Facts / 751 Entities

**Relation Types:**
- IS_EXPERT_IN (51)
- LOCATED_AT (10)
- IS_A (7)
- VALUES (4)
- LOVES (4)
- BELIEVES_IS_CORE_VALUE (3)
- MOVED_TO (4)
- etc.

---

## 🔧 Wie Kagan es gebaut hat

**Input:**
1. Interviews
2. Posts
3. Videos

**Extraction:**
- Automatische Fact-Extraktion aus Content
- Kategorisierung in 7 Bereiche
- Knowledge Graph Aufbau

**Integration:**
- Sync mit Zep (836 edges) für Memory Management

---

## 📝 Fact Format

Kurze, diskrete Statements:
- "From Istanbul, Turkey"
- "Captain of Turkish national water polo team"
- "Biked from Istanbul to China"
- "Started Gorillas when wife told him to go grocery shopping"
- "Applied to Rocket Internet 6 times before they replied"

---

## 🎯 Anwendung für BCC

### Kategorien-Mapping

| NUTZ Kategorie | BCC Role Clone Äquivalent |
|----------------|---------------------------|
| Biography | Role Background (Erfahrung, Werdegang) |
| Ventures | Client Projects (Hisense, Gorenje, etc.) |
| Frameworks | Working Methods (Content-Reihen, etc.) |
| Mental Models | Decision Principles (Quality Bars) |
| Expertise | Domain Skills (TikTok, Social-First) |
| Style | Communication Patterns (Emojis, Ton) |
| Content | Example Outputs (Past Concepts) |

### Für Hopper Clone bereits umgesetzt:

```json
{
  "background": 8 Facts,
  "clients": {
    "porsche": 9 Facts,
    "hisense_gorenje": 7 Facts,
    "lidl": 4 Facts,
    "decathlon": 3 Facts
  },
  "frameworks": 17 Facts,
  "quality_bars": 10 Facts,
  "style": {
    "communication": 9 Facts,
    "emotions": 5 Facts,
    "humor": 3 Facts
  },
  "tools": 10 Facts,
  "relationships": {...},
  "opinions": 8 Facts
}
```

**Total: 127 Facts** (aus 95K Zeilen Slack)

---

## 💡 Key Learnings

### 1. Diskrete Facts > Lange Beschreibungen
Kurze, prägnante Statements funktionieren besser als Fließtext.

### 2. Kategorien geben Struktur
Die 7 Kategorien helfen bei:
- Vollständigkeit (nichts vergessen)
- Retrieval (richtige Facts zum richtigen Zeitpunkt)
- Updates (einzelne Facts ergänzen/entfernen)

### 3. Knowledge Graph für Kontext
Die Relation-Types zeigen wie Facts zusammenhängen:
- Person → IS_EXPERT_IN → Domain
- Person → VALUES → Principle
- Person → LOVES → Activity

### 4. Iterative Extraction
Nicht alles auf einmal extrahieren:
1. Sample nehmen (50 Messages)
2. Facts extrahieren
3. Qualität prüfen
4. Skalieren auf gesamten Datensatz

---

## 🔄 Unterschiede zu unserem Ansatz

| NUTZ | BCC AI |
|------|--------|
| Custom Platform | Claude Projects |
| Zep für Memory | Knowledge Files |
| Chat Interface | Direkte Integration |
| Consumer-facing | Internal Tool |

**Unser Vorteil:** Simpler, schneller zu deployen, keine Custom Infra.

**Kagans Vorteil:** Mehr Features (Graph Visualisierung, Chat UI).

---

## 📈 Nächste Schritte

1. [ ] Mehr Facts für Hopper extrahieren (Ziel: 300+)
2. [ ] Knowledge Graph Struktur für BCC definieren
3. [ ] Relation Types für Agentur-Kontext entwickeln
4. [ ] Weitere Rollen klonen mit gleichem Schema

---

*Analysiert am 20.02.2026*
