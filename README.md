# n_trail_umweltwirkung

- Das Text-Konzept der Webseiten befindet sich im File: Ablauf_Schritte_ausformuliert_SKN_v7.md
- Der Skill zur Webseitenerstellung befindet sich im File: SKILL_webseite.md
- Sämtliche Bilder, die für die Webseite verwendet werden befinden sich im Ordner: images/
- Die gebaute Webseite (Posten-App) befindet sich im Ordner: website/posten/ —
  `index.html`, `style.css`, `script.js`, `daten.json` (alle Inhalte), `css/` (Schriften), `images/`.
- `website/posten.zip` ist ein Abbild dieses Ordners zum Hochladen auf den Webserver.

## Webseite lokal ansehen

Die App lädt `daten.json` per `fetch`, darum muss sie über einen Webserver geöffnet
werden (nicht per Doppelklick auf `index.html`):

    cd website/posten
    python3 -m http.server 8000
    # danach http://localhost:8000 im Browser öffnen

## Noch offen (siehe Konzept, Abschnitt 9)

- Endgültiger URL-Pfad auf Cyon.
- Weiterleitung nach dem letzten «Weiter» (aktuell ein Platzhalter in
  `daten.json → meta.weiter_link`).
- Schriftdatei `Lato-Bold` (Gewicht 700) — siehe `website/posten/css/LIESMICH.txt`.
