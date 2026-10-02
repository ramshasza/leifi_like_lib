# Lernbibliothek – Anleitung für KI-Agenten

Statische Lernbibliothek (Vanilla HTML/CSS/JS, läuft offline über `file://`). Dokumente liegen in `library/`, die Ordner sind die Kategorien. Die Oberfläche liest ausschließlich `data/catalog.js`, das `tools/build-catalog.mjs` aus `library/` erzeugt.

Deine Hauptaufgabe ist das **Katalogisieren**: Du liest Dokumente und schreibst die Metadaten, aus denen Kategorien, Suche und Kapitelsprünge entstehen.

## Katalogisieren

1. `node tools/build-catalog.mjs --check` ausführen. Es listet alle Dokumente ohne `.meta.json` sowie das vorhandene Vokabular (Typen, Stufen, Tags).
2. Jedes gelistete Dokument **vollständig** lesen (PDFs seitenweise mit dem Read-Tool) und daneben `<dateiname>.meta.json` anlegen, z. B. `reibung.pdf` → `reibung.pdf.meta.json`. Schema siehe unten.
3. Für jeden neuen Ordner ohne `_category.json` eine anlegen (Titel mit echten Umlauten, Beschreibung mit einem Satz; Bereiche der obersten Ebene zusätzlich mit `icon` und `color`).
4. `node tools/build-catalog.mjs` ausführen.

**Fertig**, wenn der Build ohne `WARNUNG` und ohne „ohne Metadaten“ durchläuft und jedes neue Dokument Kapitel mit korrekten Sprungzielen hat.

## Schema `<datei>.meta.json`

```json
{
  "title": "Reibung",
  "type": "Grundwissen",
  "level": "Mittelstufe",
  "tags": ["Kraft", "Reibungskraft", "Haftreibung"],
  "summary": "Ein bis zwei Sätze: worum es geht und was man danach kann.",
  "chapters": [
    { "title": "Arten der Reibung", "page": 2, "keywords": ["Haftreibung", "Gleitreibung"] }
  ]
}
```

- **type**: `Grundwissen`, `Versuch`, `Arbeitsblatt` oder `Aufgaben` (in dieser Reihenfolge sortiert die Oberfläche). Ein neuer Typ ist erlaubt, wenn keiner passt.
- **level**: `Unterstufe`, `Mittelstufe` oder `Oberstufe`.
- **tags**: 3–6 Stück. Verwende zuerst Begriffe aus dem Vokabular von `--check`, und zwar exakt in dieser Schreibweise. Neue Tags nur für echte neue Konzepte. Tags sind Themen-Begriffe, Kapitel-Details gehören in `keywords`.
- **chapters**: die tatsächlichen Abschnitte des Dokuments.
  - PDF: `page` ist die physische Seitennummer im PDF (1-basiert, wie sie der PDF-Viewer zählt), nicht die aufgedruckte Seitenzahl.
  - HTML: `anchor` ist die `id` des Abschnitts (ohne `#`).
  - `keywords`: Begriffe, Formeln und Namen, nach denen jemand suchen würde, um genau dieses Kapitel zu finden.

## Bestehende Metadaten ändern

Der Lernfortschritt der Nutzer hängt am Dokumentpfad und am **Kapitel-Index**. Deshalb:

- Neue Kapitel hinten anhängen und bestehende in ihrer Reihenfolge lassen.
- Dateien in `library/` nur verschieben oder umbenennen, wenn der Nutzer das ausdrücklich will, denn dabei geht der Fortschritt für diese Datei verloren.

## Sonstiges

- `tools/make-mock-library.mjs` erzeugt nur die Demo-Inhalte und überschreibt dabei die Mock-Dateien. Auf echten Bibliotheken nicht ausführen.
- Keine externen Abhängigkeiten (CDNs, Fonts, npm-Pakete) in `index.html`/`assets/` einbauen, sonst funktioniert die Seite nicht mehr offline.
