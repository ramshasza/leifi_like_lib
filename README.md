# Lernbibliothek (Proof of Concept)

Eine LEIFI-ähnliche Bibliothek für beliebige Dokumente, gebaut mit **reinem HTML, CSS und JavaScript**, ohne Build-Framework und ohne Internet.

- **Kategorien aus Ordnern**: `library/Bereich/Thema/Unterthema/…` wird automatisch zur Navigation.
- **Suche** über Titel, Zusammenfassungen, Schlagwörter, Kapitel und Kapitel-Stichworte. Treffer verlinken direkt auf die Kapitelseite im PDF. Umlaute können auch als ae/oe/ue getippt werden.
- **Schlagwörter (Tags)** mit Tag-Wolke; ein Klick auf einen Tag filtert die Bibliothek.
- **Lernfortschritt**: Kapitel einzeln oder ganze Dokumente abhaken. Der Fortschritt wird pro Thema und Bereich angezeigt, gespeichert im Browser und lässt sich als JSON exportieren und importieren.
- **Filter** nach Dokumenttyp (Grundwissen, Versuch, Arbeitsblatt, Aufgaben) und „nur offene“.
- **Viewer** für PDF, HTML, Bilder und Video direkt auf der Seite, mit Sprung zur Kapitelseite.

## Benutzen

`index.html` per Doppelklick im Browser öffnen. Fertig: Es wird kein Server und kein Internet gebraucht.

> Für die Entwicklung geht alternativ `python -m http.server` im Projektordner.

## Wie kommen Dokumente hinein?

```
library/
  01_Mechanik/                      ← Bereich (Zahlenpräfix = Reihenfolge)
    _category.json                  ← optional: Titel, Beschreibung, Icon, Farbe
    01_Kinematik/                   ← Thema (beliebig tief verschachtelbar)
      reibung.pdf                   ← das Dokument
      reibung.pdf.meta.json         ← Metadaten: Zusammenfassung, Tags, Kapitel → Seiten
data/catalog.js                     ← generierter Katalog, den index.html lädt
```

1. Dokumente in einen (Unter-)Ordner von `library/` legen.
2. Den KI-Agenten bitten: **„Katalogisiere die neuen Dokumente.“** Er liest die Dateien und schreibt die `*.meta.json`. Die genaue Anleitung für den Agenten steht in [AGENTS.md](AGENTS.md).
3. Der Agent (oder du) führt `node tools/build-catalog.mjs` aus. Danach `index.html` neu laden.

Ohne Metadaten erscheinen Dokumente trotzdem, nur mit dem Dateinamen als Titel und dem Hinweis „ohne Metadaten“. Ein Beispiel dafür ist `library/03_Optik/02_Wellenoptik/polarisation.pdf`. Es fehlt absichtlich, damit man den Agenten-Workflow ausprobieren kann.

`node tools/build-catalog.mjs --check` zeigt, welche Dokumente noch Metadaten brauchen und welche Tags es bereits gibt.

## Mock-Inhalte

Die 27 Demo-Dokumente (4 Bereiche, 10 Themen plus 1 Unterthema, 26 PDFs + 1 HTML-Arbeitsblatt) erzeugt `node tools/make-mock-library.mjs` ohne externe Pakete. Für echte Inhalte wird das Skript nicht gebraucht.

## Aufbau

| Datei | Zweck |
|---|---|
| `index.html` | Seitengerüst |
| `assets/app.js` | Routing (`#/c/…`, `#/d/…`, `#/suche`, `#/fortschritt`), Suche, Fortschritt, Viewer |
| `assets/style.css` | Layout, Hell-/Dunkelmodus, responsiv |
| `tools/build-catalog.mjs` | scannt `library/` und schreibt `data/catalog.js` |
| `tools/make-mock-library.mjs` | erzeugt die Demo-Bibliothek |

Warum `catalog.js` statt `catalog.json`? Browser blockieren `fetch()` auf `file://`-Seiten. Ein `<script>`-Tag lädt die Datei dagegen auch lokal.

## Grenzen des Proof of Concept

- Der Fortschritt liegt im `localStorage` des jeweiligen Browsers (geräteübergreifend nur per Export/Import).
- Die Volltextsuche im Dokumentinhalt läuft über die vom Agenten gepflegten Zusammenfassungen und Stichworte, nicht über den rohen PDF-Text.
- Der Sprung zu einer PDF-Seite (`#page=N`) funktioniert im eingebauten PDF-Viewer von Chrome, Edge und Firefox. Andere Viewer ignorieren ihn eventuell.
