# Posten «Was kommt auf deinen Teller?» — bau-fertiges Konzept

*Überarbeitete Fassung als inhaltliche und technische Grundlage für die Umsetzung der Webseiten. Dieses Dokument ist so ausformuliert, dass zusammen mit dem Skill `SKILL_webseite.md` die Seiten gebaut werden können. Datengrundlage: `Menuvorschläge_v4_normiert.xlsx` (Stand geladen) und die eaternity-Werte.*

---

## 0. Lesehinweise für dieses Dokument

- **Bildschirmtexte** — alles, was die nutzende Person liest — stehen in **Kästen (Zitatblöcken)** und können Wort für Wort übernommen werden.
- **Ablauf und Verzweigung** beschreibt inhaltlich, was auf dem Screen passiert.
- **Technische Umsetzung** je Schritt beschreibt konkret, wie es gebaut wird (ergänzend zum Skill).
- Platzhalter in eckigen Klammern wie `[gewähltes Gericht]` oder `[XY %]` werden zur Laufzeit bzw. beim Befüllen von `daten.json` ersetzt.
- **Bildnamen:** Menü-Bilder **beginnen mit der Menu-Nr.**, gefolgt von einem Unterstrich und einem Namensteil (Umlaute erlaubt), z. B. `12_Gemüsewähe.png`. Verlässlich ist nur der **Nr.-Präfix**; der exakte Dateiname steht pro Menü im Feld `bild` in `daten.json`.
- Sprache: einfaches Schweizer Standarddeutsch (**«ss» statt «ß»**), keine Mundart. Etablierte Menübezeichnungen bleiben erhalten.
- Alle inhaltlichen Werte (CO₂, Reduktionen, Alternativen, Wenn-dann-Handlungen) sind in Abschnitt 8 (Anhang) als Datentabellen abgelegt und stammen aus der Excel v4. Sie sind bereits aufgelöst, damit beim Bauen nicht neu gerechnet werden muss.

---

## 1. Technischer Rahmen (verbindlich für den Bau)

- **Eigenständige, statische App:** Vanilla HTML/CSS/JS, kein Framework, kein Build-Tool, kein Server, kein Docker.
- **Dateien:** `index.html` (Struktur), `style.css` (Look, Tokens gemäss Skill), `script.js` (Verhalten), `daten.json` (**alle** Inhalte/Daten). Nichts Inhaltliches wird in HTML/JS hartcodiert (siehe Skill, «Hard rules»).
- **Zustand:** session-only als JS-Variable (gewähltes Menü, Vermutungen, Wenn-dann-Auswahl). Kein Speichern, keine Konten, kein Tracking. Bei Reload ist alles weg.
- **Mehrschrittig ohne Reload:** `.step`-Sektionen per JS ein-/ausblenden (`showStep(n)`).
- **Drag-Reihenfolge (Schritt 2):** SortableJS via CDN (Touch-tauglich).
- **Balkendiagramm (Schritt 2):** einfache `div`-Balken mit JS-gesetzter Breite, keine Chart-Bibliothek; eine Akzentfarbe, Länge trägt die Bedeutung (siehe Skill, keine Warnfarben).
- **Erinnerung (Schritt 4): Kalender-Datei (.ics)**, vollständig clientseitig erzeugt (Blob/Data-URI-Download), keine Datenübertragung. **Kein `mailto`.** Fester textlicher Fallback, falls der Import nicht klappt.
  > Hinweis: Der Skill `SKILL_webseite.md` ist bereits auf die .ics-Lösung umgestellt (`buildIcs()` / `downloadIcs()`, kein `mailto`, kein `reminderLink()` mehr). **Noch offen:** `buildIcs()` braucht einen `VALARM`-Block (`TRIGGER:PT0S`), damit die Erinnerung zum Ereigniszeitpunkt auslöst, sowie getrennt einen kurzen Titel und eine längere Beschreibung (siehe Schritt 4 und Offene Punkte Nr. 6).
- **Hosting:** flache Dateien auf Cyon, verlinkt von der Hauptseite per normalem Link/QR (kein iframe). Vorgesehener Pfad: `https://n-trail.org/Basel/Posten_XY` (endgültiger Pfad wird nachgeliefert).
- **Design:** N-Trail-Look gemäss Skill (Tokens, ruhige Flächen, eine grüne Aktion pro Screen, Tap-Targets ≥ 48 px, sichtbarer `:focus-visible`, `alt`-Texte, `prefers-reduced-motion`).
- **Bewusst ausgeklammert:** anonyme Wirkungsmessung. Liesse sich später ohne Frontend-Umbau ergänzen.

---

## 2. Datenmodell und Auflösungsregeln

### 2.1 `daten.json` — Struktur (Überblick)

```json
{
  "meta": { "titel": "...", "eaternity_url": "https://eaternity.org" },
  "schritt1": { "intro": "...", "anonymitaets_hinweis": "...", "hinweis": "...",
                "ebene1": [ /* Kacheln */ ], "ebene2": [ /* Kacheln */ ] },
  "schritt2": { "intro": "...", "achse_oben": "...", "achse_unten": "...",
                "einheit": "g CO₂-Äq.", "eaternity_hinweis": "...",
                "zutaten_start": [ /* gemischte Startreihenfolge */ ],
                "zutaten_aufloesung": [ /* von wenig zu viel, mit Wert + Skala */ ],
                "texte": { /* Überraschung, Wieso-Erklärung, Käse, Gesundheit */ } },
  "schritt3": { "rahmen_3a": "...", "rahmen_3b": "...", "berechnungshinweis": "...",
                "menus": { "<menu_nr>": { /* siehe 2.3 */ } },
                "emissionsarm_pool": [ /* menu_nr-Liste */ ] },
  "schritt4": { "frage": "...",
                "ausloeser": [ /* je Baustein: label + handlung (Template) + braucht_menu */ ],
                "klima_menu_platzhalter": "[Klima-Menu]",   /* ersetzt durch schritt3.menus[nr].alternative.name */
                "erinnerung": { /* .ics: titel_kurz, beschreibung, defaults, fallback */ } },
  "schritt5": { "kernsatz": "..." }
}
```

### 2.2 Kachel-Objekt (Schritt 1)

Eine Kachel ist entweder ein Einzelgericht oder eine Auswahl (Fleisch/vegetarisch):

```json
// Einzelgericht
{ "id": "schnitzel", "typ": "single", "label": "Schnitzel mit Pommes",
  "menu_nr": 3, "bild": "3_Schnitzel_mit_Pommes.png" }

// Auswahl (Fleisch zuerst, keine Vorauswahl/Markierung)
{ "id": "pizza", "typ": "auswahl", "label": "Pizza",
  "frage": "Isst du meistens die Pizza mit Fleisch (Prosciutto) oder ohne Fleisch (Margherita)?",
  "fleisch": { "menu_nr": 2, "name": "Pizza Prosciutto", "bild": "2_Pizza_Prosciutto.png" },
  "veg":     { "menu_nr": 1, "name": "Pizza Margherita",  "bild": "1_Pizza_Margherita.png" } }
```

- Für die weitere Nutzung wird **die gewählte `menu_nr`** gemerkt. Bei einer Auswahl-Kachel gilt: **es ist nichts vorausgewählt/markiert**; die Fleisch-Variante wird lediglich **zuerst** angezeigt (links bzw. oben, je nach Layout).

### 2.3 Menü-Objekt (Schritt 3, je gewähltes Menü)

```json
"3": {
  "name": "Schnitzel mit Pommes",
  "modus": "vorschlag",                       // "vorschlag" (3a) oder "bestaetigung" (3b)
  "alternative": {
    "name": "Schnitzel mit Pommes (vegetarisch)",   // dient in Schritt 4 als [Klima-Menu]
    "bild": "26_Schnitzel_Vegetarisch.png",
    "variantentext": "Ein knuspriges, paniertes Schnitzel mit Pommes ...",
    "reduktion_prozent": 65,
    "reduktion_satz": "Wenn du Schnitzel mit Pommes (vegetarisch) wählst, reduziert sich die Klimawirkung um 65 % im Vergleich zum Schnitzel mit Pommes."
  }
}
```

### 2.4 Auflösungsregel Schritt 3 (deterministisch)

Für das in Schritt 1 gewählte Menü **X** wird die Alternative so bestimmt:

1. **Gibt es eine Excel-Zeile Y mit `Alternative zu Menu` = X?** → Zeile Y **ist** die Alternative (Name, Bild, `Variantenvorschlag Text`, sowie `co2_pro_standardportion` für die %-Berechnung). → Kandidat für Modus **3a**.
2. **Sonst: hat Zeile X selbst einen `Variantenvorschlag Text` (≠ NA)?** → Der Text steht auf Zeile X; die angezeigte Alternative ist das Menü, auf das Zeile X per `Alternative zu Menu` zeigt (dessen Name/Bild/Wert). → Kandidat für Modus **3a**.
3. **Sonst** (kein Vorschlag vorhanden) → Modus **3b** (Bestätigung).

> **Schutzregel (verbindlich):** Ein in Schritt 1 direkt gewähltes Menü ist bereits die vegetarische/emissionsärmere Variante seiner Auswahl-Kachel. Für diese Menüs darf **nie** die schwerere Fleischvariante als „Alternative“ vorgeschlagen werden. Deshalb gilt: Ein in Regel 1 oder 2 gefundener Kandidat wird **nur dann** als 3a gezeigt, wenn seine `co2_pro_standardportion` **kleiner** ist als die des gewählten Menüs X. Ist sie gleich oder grösser (oder gibt es keinen Kandidaten), → Modus **3b**.
>
> Konkret fallen dadurch die **sechs direkt wählbaren veg-Varianten** in 3b: **Pizza Margherita (1), Falafel (5), Spaghetti Napoli (8), Gemüse-Wähe (12), Vegetarische Lasagne (15), Pastetli ohne Fleisch (21)** — zusätzlich zu **Gemischter Salat (11)** und **Rösti mit Spiegelei (17)**. Die 13 in Anhang 8.1 gelisteten 3a-Fälle (Lasagne mit Fleisch → Vegetarische Lasagne, Pastetli mit Fleisch → Pastetli ohne Fleisch usw.) bleiben unverändert.

> Die vollständige, bereits aufgelöste Zuordnung inkl. Reduktion und der 3b-Menüs steht in **Anhang 8.1**.

### 2.5 Reduktions-Prozent und Reduktions-Satz (Screen 3a)

- Formel: `Reduktion = (co2_pro_standardportion[X] − co2_pro_standardportion[Alternative]) / co2_pro_standardportion[X] × 100`.
- **Auf das nächste 5-%-Niveau abrunden** (Beispiel: 9,9 % → 5 %, 74,96 % → 70 %).
- Werte sind in Anhang 8.1 bereits berechnet.
- **Reduktions-Satz (`reduktion_satz`):** Für jedes 3a-Menü ist die Reduktion zusätzlich als vollständig ausformulierter Satz hinterlegt, der die Reduktion **direkt** benennt und sie **im Vergleich zum gewählten (klimaintensiveren) Menu** ausdrückt. Es gibt zwei Formulierungen:
  - **Nur eine konkrete Variante im Vorschlag:** «Wenn du [Klima-Menu] wählst, reduziert sich die Klimawirkung um [XY %] im Vergleich zu/zum [gewähltes Menu].»
  - **Mehrere Varianten / Teil-Tausch im Vorschlag** (z. B. halb Hackfleisch/halb Linsen, Poulet statt Kalb): derselbe Satz plus ein zweiter Satz «Kleinere Änderungen ([Beispiel aus dem Vorschlag]) reduzieren die Klimawirkung entsprechend weniger.»
  Der Satz wird in Screen 3a direkt unter dem Variantentext angezeigt (Platzhalter `[Reduktions-Satz aus Anhang 8.1]`). Die aufgelösten Sätze stehen in Anhang 8.1 und werden 1:1 nach `daten.json → schritt3.menus["<nr>"].alternative.reduktion_satz` übernommen; für 3b-Menüs entfällt der Satz.

### 2.6 Emissionsarm-Pool (Schritt 3, Button „Emissionsarme Menus")

- Pool = alle Menüs mit `Emissionsarm = 1`.
- Beim Klick werden **5** Menüs aus dem Pool gezeigt; im Modus **3a** wird das **bereits als Variantenvorschlag gezeigte** Menü ausgeschlossen. Im Modus **3b** (kein Vorschlag) wird stattdessen das **selbst gewählte Menü** ausgeschlossen, falls es im Pool ist (z. B. Falafel, Napoli, Salat, Rösti) — sonst kein Ausschluss.
- Auswahl möglichst **verschiedener Ernährungsstile/Herkünfte** (Herkunfts-Vorschlag pro Menü in Anhang 8.3; falls die Excel später eine Spalte «Herkunft/Typ» erhält, direkt daraus).

---

## 3. Schritt 1 – Persönlicher Anker (ca. 30 s)

### Bildschirmtexte

**Screen 1a – Auswahlraster (Startbildschirm)**

> Nun geht es um die Kartoffel, das Rüebli und das Hackfleisch. Genau, es geht um deine Ernährung.
> **Denk an ein Essen, das du gerne isst.**
> Was kommt dem am nächsten?
>
> *(kleiner Hinweis unter dem Raster)*
> Tippe auf ein Gericht. Danach geht es genau um diese Auswahl.
>
> *(Anonymitäts-Hinweis, dezent)*
> Deine Auswahl ist anonym und wird nicht ausgewertet.

Kacheln (acht Einträge; drei davon mit Auswahl Fleisch/vegetarisch). Bei Auswahl-Kacheln lautet der Text:

> Isst du meistens das Menu mit Fleisch [Menuname mit Fleisch] oder ohne Fleisch [Menuname ohne Fleisch]?

Darunter werden die beiden Auswahlmenüs gezeigt (Fleisch zuerst, ohne Vorauswahl/Markierung).

> - **Pizza** — Auswahl: Pizza Prosciutto / Pizza Margherita
> - **Schnitzel mit Pommes**
> - **Döner / Kebab** — Auswahl: Döner mit Fleisch / Falafel
> - **Älplermagronen**
> - **Spaghetti mit Sauce** — Auswahl: Spaghetti Bolognese / Spaghetti Napoli
> - **Rahmschnitzel mit Reis oder Nudeln**
> - **Butter Chicken mit Reis**
> - **Gemischter Salat oder Bowl**
> - **Etwas anderes**

**Screen 1b – Zweite Auswahlebene (nur nach «Etwas anderes»)** — die erste Ebene bleibt sichtbar.

> **Kein Problem — vielleicht ist eines davon nah dran?**
>
> - **Wähe** — Auswahl: Käse-Zwiebel-Wähe / Gemüse-Wähe
> - **Lasagne** — Auswahl: Lasagne mit Hackfleisch / Vegetarische Lasagne
> - **Sushi**
> - **Rösti mit Spiegelei**
> - **Pad Thai**
> - **Palak Paneer**
> - **Pastetli mit Reis oder Nudeln** — Auswahl: Pastetli mit Brätkügeli / Pastetli mit Pilzsauce
>
> *(Hinweis unten)*
> Passt nichts genau? Wähle ein Menu, das ungefähr zu deiner Ernährung passt. Oben siehst du alle Menus, die zur Auswahl stehen.

### Ablauf und Verzweigung

- Die getroffene Wahl (`menu_nr`) wird gemerkt und steuert **Schritt 3** (Variante) und **Schritt 4** (Handlung + Wenn-dann-Plan). **Schritt 2** ist bewusst gerichteunabhängig (feste vier Zutaten).
- Bei Auswahl-Kacheln gilt als gewähltes Menü die **Fleisch-Variante**, sofern die Person nicht aktiv die vegetarische wählt. Nichts ist vorausgewählt.
- «Etwas anderes» öffnet Screen 1b; beide Ebenen bleiben scrollbar sichtbar, sodass alle Menüs wählbar sind.
- Keine Bewertung der Wahl, kein «richtig»/«falsch».

### Technische Umsetzung

- Kacheln aus `daten.json → schritt1.ebene1 / ebene2` rendern (keine Kachel im HTML hartcodiert).
- Auswahl-Kacheln zeigen die zwei Varianten aus dem Kachel-Objekt; die gewählte `menu_nr` in den Zustand schreiben.
- Wähe hat keine Fleischvariante → **Käse-Zwiebel-Wähe** erscheint als erste Variante (analoge Logik, keine Vorauswahl).
- Bilder: `images/[Menu-Nr]_[Name].png` (beginnt mit der Menu-Nr.; exakter Name pro Menü in `daten.json → bild`; Liste in Anhang 8.5).

---

## 4. Schritt 2 – Schätzen, dann auflösen (ca. 60 s)

### Bildschirmtexte

**Screen 2a – Vermutung (vier Zutaten in eine Reihenfolge ziehen)**

> **Bevor es weitergeht — ein kleines Spiel.**
> Ordne diese vier Zutaten nach ihrer Klimawirkung. Welches Produkt belastet das Klima deiner Meinung nach am stärksten — und welches am wenigsten?
>
> *(Achsen-Beschriftung, sehr klar im UI)*
> Oben: **Hohe** Belastung fürs Klima
> Unten: **Geringe** Belastung fürs Klima

Vier ziehbare Elemente (gemischte Startreihenfolge):

> - Linsen
> - Rindfleisch
> - Hartkäse
> - Poulet

> *(Button)* **Auflösen**
>
> *(kleiner Hinweis)* Einfach mal schätzen.

**Screen 2b – Auflösung (ruhiges, waagrechtes Balkendiagramm)**

Neben der eigenen gezogenen Reihenfolge erscheint die tatsächliche Reihenfolge als waagrechtes Balkendiagramm, ordinal, ohne Warnfarbe. Balkenlänge relativ zur Klimawirkung. **Zahlen werden angezeigt, klar als ungefähr markiert und mit Einheit** (siehe Skalierung unten). Reihenfolge von wenig zu viel:

> - Linsen — **≈ 170 g CO₂-Äq.**
> - Hartkäse — **≈ 1 760 g CO₂-Äq.**
> - Poulet — **≈ 1 790 g CO₂-Äq.**
> - Rindfleisch — **≈ 11 300 g CO₂-Äq.**

> *(Hinweis/Tooltip unter dem Diagramm)*
> Werte: [eaternity](https://eaternity.org), normiert auf eine vergleichbare Portion (ca. ein Drittel des Tagesbedarfs). Gerundete Grössenordnungen, keine exakten Messwerte.

> **Überrascht dich das Ergebnis?**
> Wenn dich das Ergebnis überrascht, bist du damit nicht alleine. Das Ergebnis zeigt vor allem zwei überraschende Dinge:
>
> **1. Fleisch ist nicht gleich Fleisch.**
> Je nach Art des Fleisches fallen deutlich höhere oder niedrigere Klima-Emissionen an. Hier ist ersichtlich, dass die Produktion von Rindfleisch deutlich klimaintensiver ist als die Produktion von Poulet.
> *(Button)* **Wieso ist das so?**

*(Erklärung, nur nach Klick auf «Wieso ist das so?»)*

> Rindfleisch verursacht im globalen Durchschnitt schätzungsweise vier- bis neunmal mehr Treibhausgasemissionen als Poulet pro Kilogramm Protein. Der genaue Faktor hängt stark von Produktionsweise, Herdentyp und Region ab. Drei Hauptgründe:
> - Rinder sind Wiederkäuer: Im Pansen entsteht durch Mikroorganismen Methan, ein Treibhausgas mit rund 28-facher Wirkung von CO₂. Poulets haben kein Vormagensystem und emittieren praktisch kein Verdauungsmethan.
> - Poulets verwerten Futter deutlich effizienter und schneller. Hühner leben vor der Schlachtung im Schnitt nur wenige Wochen, Rinder 18–24 Monate. Je nach Rasse, Mast- oder Weidehaltung variiert das spürbar.
> - Rinder benötigen über Weideflächen und Kraftfutteranbau deutlich mehr Land als Hühner. Auch das hängt stark von der Produktionsweise ab.

> **2. Die Käseproduktion ist klimaintensiv.**
> Hartkäse ist klimaintensiv, weil für ein Kilogramm rund 10–13 Liter Milch nötig sind. Die Emissionen der Milchproduktion — vor allem Methan aus der Verdauung der Kühe — summieren sich dadurch stark.

> **Die gute Nachricht zum Schluss:** Was dem Klima hilft, ist oft auch das, was deiner Gesundheit langfristig guttut. Du tauschst in der Regel nicht das eine gegen das andere.

> *(Button)* **Weiter**

### Ablauf und Verzweigung

- Die eigene gezogene Reihenfolge bleibt neben der Auflösung stehen (Vergleich sichtbar). **Keine Punktzahl, keine Farbwertung** — die Person sieht selbst, wo sie richtig lag («neugieriges Selbstexperiment, kein Test»).
- Die Auflösung ist für alle gleich, unabhängig von der gezogenen Reihenfolge.
- Der Erklärungstext (Rind vs. Poulet) erscheint nur auf Klick.

### Technische Umsetzung — Balken-Skalierung (wichtig)

- **Lineare Skala** mit Referenzbreite ≈ **2 000 g** (knapp über Poulet): Linsen (≈ 9 %), Hartkäse (≈ 88 %), Poulet (≈ 90 %) zeigen ihre **echte Relation**. Hartkäse und Poulet liegen real fast gleichauf — die Balken sind darum bewusst fast gleich lang (wahrheitsgetreu); die Zahlen machen den kleinen Unterschied lesbar.
- **Rindfleisch** überschreitet die Referenz um ein Vielfaches → der Balken läuft auf **volle Breite** und endet mit einer **deutlichen Bruch-/Zacken-Markierung** (nicht massstabsgetreu), daneben die ≈-Zahl. So bleibt klar: dieser Balken ist gekappt und in Wirklichkeit viel länger.
- Alle vier Werte bleiben **sichtbar und unterscheidbar**; eine Akzentfarbe, keine Warnfarbe; `transition` respektiert `prefers-reduced-motion`.
- Zutaten und Werte kommen aus `daten.json → schritt2.zutaten_aufloesung`; SortableJS für 2a.

---

## 5. Schritt 3 – Deine Mahlzeit, leichter gemacht (ca. 45 s)

Verzweigt nach dem in Schritt 1 gewählten Gericht. Gezeigt wird **eine** möglichst ähnliche, attraktive Variante — begründet mit Ähnlichkeit, Geschmack und Preis, nicht mit Tugend.

### Bildschirmtexte

**Screen 3a – Variantenvorschlag (Standardfall)**

> **Zurück zu deinem [gewähltes Gericht].**
> Mit einer kleinen Änderung kannst du die Klimawirkung in Zukunft reduzieren.
>
> **[Alternative — Name aus Anhang 8.1]**
> [Variantenvorschlag-Text aus Anhang 8.1]
>
> **[Reduktions-Satz aus Anhang 8.1]**
>
> Das ist ein Vorschlag fürs nächste Mal.
> Wenn du das gewählte Menu nicht selber kochst und nicht einzelne Zutaten austauschen kannst, findest du unten weitere emissionsarme Menus zum Ausprobieren.
> *(Button)* **Emissionsarme Menus**
>
> *(dezenter Hinweis)* Wenn du mehr zur Berechnung wissen willst, tippe hier.
>
> *(Button)* **Weiter**

*(Aufklappbar nach «tippe hier»):*

> Die CO₂- und Gesundheitswerte stammen von [eaternity](https://eaternity.org), einem Schweizer Fachdienst für Klimabilanzen von Lebensmitteln. Für jedes Menu haben wir eine typische Zutatenliste hinterlegt. Daraus berechnet eaternity, wie viel Treibhausgas vom Anbau bis zum Teller entsteht. Damit grosse und kleine bzw. nahrhafte und weniger nahrhafte Gerichte fair vergleichbar sind, rechnen wir alle Menus auf die gleiche Portionsgrösse um (eine Hauptmahlzeit, etwa ein Drittel des Tagesbedarfs). Die Gesundheitsangaben beruhen auf einem Gesundheitswert (Vita Score), der ebenfalls von eaternity berechnet wird und auf grossen Ernährungs-Gesundheitsstudien beruht. Die Zahlen sind gute Grössenordnungen, keine Messungen auf das Gramm genau, und können je nach Rezept, Herkunft und Saison variieren. **Was stabil bleibt: Eine Reduktion von Fleisch und anderen tierischen Produkten (z. B. Käse, Milch, Rahm, Eier) senkt die Klimawirkung der Ernährung stark.**

**Screen 3b – Bestätigung (bereits emissionsarm bzw. vegetarisch gewählt)**

*Gilt für: Gemischter Salat (11), Rösti mit Spiegelei (17) sowie die direkt gewählten veg-Varianten Pizza Margherita (1), Falafel (5), Spaghetti Napoli (8), Gemüse-Wähe (12), Vegetarische Lasagne (15), Pastetli ohne Fleisch (21) — siehe Schutzregel 2.4.*

> **Gute Wahl.**
> Dein [gewähltes Gericht] gehört ohnehin schon zu den emissionsarmen. Hier gibt es nichts zu tauschen.
>
> Wenn du magst, findest du unten weitere emissionsarme Menus zum Ausprobieren.
> *(Button)* **Emissionsarme Menus**
>
> *(Button)* **Weiter**

### Ablauf und Verzweigung

- Modus (3a/3b) und Inhalte werden über die Auflösungsregel (2.4) und Anhang 8.1 bestimmt.
- **Emissionsarme Menus** (Button): 5 Menüs aus dem Pool (2.6), das bereits gezeigte Variantenmenü ausgeschlossen, möglichst verschiedene Herkünfte (Anhang 8.3).
- Der **Reduktions-Satz** benennt die erreichbare Reduktion direkt und drückt sie **im Vergleich zum gewählten (klimaintensiveren) Menu** aus. Nennt der Vorschlag mehrere Varianten bzw. einen Teil-Tausch, folgt ein zweiter Satz, dass kleinere Änderungen entsprechend weniger reduzieren (Wortlaut je Menu in Anhang 8.1). Der dezente Hinweis darunter verweist nur noch auf die Berechnung. Hauptbotschaft bleibt das alternative Menu.

### Technische Umsetzung

- Menü-Objekte aus `daten.json → schritt3.menus[menu_nr]`; `modus` steuert 3a vs. 3b.
- Reduktions-% ist vorberechnet in den Daten (Anhang 8.1), nicht zur Laufzeit rechnen.
- Emissionsarm-Liste aus `schritt3.emissionsarm_pool`, gerendert wie die übrigen Kacheln.

---

## 6. Schritt 4 – Freiwilliger Vorsatz (ca. 45 s)

### Bildschirmtexte

**Screen 4a – Frage**

> **Willst du es beim nächsten passenden Moment einmal ausprobieren?**
>
> *(zwei Schaltflächen)*
> - Ja, einmal ausprobieren
> - Überspringen

**Screen 4b – Wenn-dann-Plan (nur nach «Ja»)**

> **Ein kleiner Plan, der erfahrungsgemäss hilft:** Nimm dir einen konkreten Moment vor.
>
> **Wenn ich das nächste Mal [Auslöser], dann [Handlung].**

Bausteine für den Auslöser (einer wählbar):

> - … Essen nach Hause bestelle
> - … ein Abendessen koche
> - … in der Mensa zu Mittag esse
> - … einkaufen gehe

Die Handlung ergibt sich neu aus dem **gewählten Auslöser** (nicht mehr aus dem Gericht). `[Klima-Menu]` = das in Schritt 3 vorgeschlagene klimafreundliche Menu (die klimafreundlichste Variante zum gewählten Gericht, Name aus Anhang 8.1). Zuordnung (vollständig in Anhang 8.2):

> - **… Essen nach Hause bestelle** → … wähle ich ein vegetarisches oder veganes Menu. Zum Beispiel [Klima-Menu].
> - **… ein Abendessen koche** → … koche ich ein vegetarisches oder veganes Menu. Zum Beispiel [Klima-Menu].
> - **… in der Mensa zu Mittag esse** → … wähle ich die vegetarische oder vegane Option.
> - **… einkaufen gehe** → … kaufe ich Zutaten für ein vegetarisches oder veganes Menu. Zum Beispiel [Klima-Menu].

> **Zu deinem [Gericht]:** [Menutitel und Bild der Alternative]

Erinnerungsfunktion (rein additiv, nirgends vorausgewählt):

> **Möchtest du dir dafür eine Erinnerung einrichten?**
> *(Hinweis darunter)* Wir speichern nichts. Die Erinnerung geht nur an dich, in deinen persönlichen Kalender.
>
> *(zwei Schaltflächen)*
> - Ja
> - Überspringen
>
> *(Fallback-Hinweis, fester Bestandteil)* Funktioniert das nicht? Füge dir die Erinnerung selbst im Kalender hinzu.

> *(Button)* **Fertig / Weiter**

### Ablauf und Verzweigung

- Der ganze Schritt ist mit **«Überspringen»** ohne Nachfrage übergehbar → direkt zu Schritt 5.
- Der Wenn-dann-Satz wird aus dem gewählten Auslöser-Baustein und der **zugehörigen auslöserabhängigen Handlung** zusammengesetzt und im Klartext angezeigt. Enthält die Handlung den Platzhalter `[Klima-Menu]` (bei «bestelle», «koche», «einkaufen»), wird dieser durch die klimafreundlichste Variante zum gewählten Gericht ersetzt (Alternative-Name aus Anhang 8.1). Der Mensa-Auslöser braucht kein Menu.
- **Sonderfall bereits emissionsarm/vegetarisch gewählt (alle 3b-Menüs: 1, 5, 8, 11, 12, 15, 17, 21):** Es gibt kein in Schritt 3 vorgeschlagenes Klima-Menu, also keinen `[Klima-Menu]`-Einschub. Wie bisher entfällt der Wenn-dann-Plan für diese Wahl; Schritt 4 wird direkt im Überspringen-Pfad zu Schritt 5 geführt. *(Falls 3b-Menüs später doch einen Vorsatz erhalten sollen, käme dafür nur der Mensa-Auslöser ohne `[Klima-Menu]` oder ein Menu aus dem Emissionsarm-Pool infrage — bewusst offen gelassen.)*
- Der Fallback-Hinweis ist immer Teil des Screens.

### Technische Umsetzung — Erinnerung als .ics

- Beim «Ja» wird **clientseitig eine `.ics`-Datei** (VEVENT) erzeugt und als Download/Öffnen angeboten; sie kann in den geräteeigenen Kalender importiert werden. **Keine Serverübertragung, kein `mailto`.**
- **Kurzer Titel (`SUMMARY`):** knapp und wiedererkennbar, z. B. «Mein Klima-Vorsatz» — **nicht** der ganze Satz.
- **Beschreibung (`DESCRIPTION`) mit mehr Informationen:** der vollständige, ausformulierte Wenn-dann-Satz (z. B. «Wenn ich das nächste Mal ein Abendessen koche, dann koche ich ein vegetarisches oder veganes Menu. Zum Beispiel [Klima-Menu].»), ergänzt um einen kurzen, motivierenden Zusatz (z. B. «Ein kleiner Schritt — gut fürs Klima und oft auch für deine Gesundheit.») und, sofern vorhanden, den Namen des vorgeschlagenen Klima-Menus.
- **Erinnerung zum Ereigniszeitpunkt:** Der Termin enthält einen Alarm, der **genau zum Ereigniszeitpunkt** auslöst (`VALARM` mit `TRIGGER:PT0S`, `ACTION:DISPLAY`). So erinnert der Kalender im gewählten Moment selbst (z. B. wenn die Person das nächste Mal kocht), nicht vorher.
- **Zeitpunkt selbst wählbar** (Datum/Uhrzeit-Eingabe); Default vorbelegt und überschreibbar. Der Alarm sitzt immer auf dem Ereignisbeginn (`DTSTART`).
- Erzeugung als Blob/Data-URI (`text/calendar`, CRLF). Auf iOS/Android real testen; greift der Import nicht, gilt der textliche Fallback.
- Auslöser-Bausteine und zugehörige Handlung aus `daten.json → schritt4.ausloeser[]`; `[Klima-Menu]` aus `schritt3.menus[menu_nr].alternative.name`.
- **Hinweis für den Bau:** `buildIcs()` im Skill muss dafür um einen `VALARM`-Block erweitert werden (`BEGIN:VALARM / ACTION:DISPLAY / TRIGGER:PT0S / DESCRIPTION:… / END:VALARM`) und einen separaten, kurzen `SUMMARY` sowie die längere `DESCRIPTION` entgegennehmen; bislang erzeugt es nur `SUMMARY`/`DESCRIPTION` ohne Alarm.

---

## 7. Schritt 5 – Ein Satz zum Mitnehmen (ca. 15 s)

### Bildschirmtexte

> **Wenn du eine Sache ändern möchtest: Verzichte hin und wieder auf Fleisch.**
> **Wenn du dich bereits vegetarisch ernährst, probier auch einmal die vegane Option.**
> Das ist der Tausch mit dem grössten Effekt — fürs Klima und oft auch für deine Gesundheit.

### Ablauf und Verzweigung

- Abschluss des Postens. Kein «Du solltest», keine Vorschrift: Der Schlusssatz benennt die Richtung und lässt die Entscheidung offen.

---

## 8. Anhang — Datentabellen (aus Excel v4 aufgelöst)

### 8.1 Gewähltes Menü → Alternative → Reduktion (Schritt 3)

| Nr. | Gewähltes Menü | Modus | Alternative | Reduktion |
|----|----|----|----|----|
| 2 | Pizza Prosciutto | 3a | Pizza Margherita | 30 % |
| 3 | Schnitzel mit Pommes | 3a | Schnitzel mit Pommes (vegetarisch) | 65 % |
| 4 | Döner mit Fleisch | 3a | Falafel (Döner ohne Fleisch) | 90 % |
| 6 | Älplermagronen | 3a | Älplermagronen (Haferrahm, wenig Käse) | 30 % |
| 7 | Spaghetti Bolognese | 3a | Spaghetti mit Linsenbolognese | 65 % |
| 9 | Rahmschnitzel mit Reis oder Nudeln | 3a | Rahmschnitzel (vegetarisch) | 90 % |
| 10 | Butter Chicken mit Reis | 3a | Butter Tofu | 50 % |
| 13 | Käse-Zwiebel-Wähe | 3a | Gemüse-Wähe | 20 % |
| 14 | Lasagne mit Fleisch | 3a | Vegetarische Lasagne | 50 % |
| 16 | Sushi | 3a | Sushi (vegetarisch) | 30 % |
| 18 | Pad Thai | 3a | Pad Thai (vegetarisch) | 70 % |
| 19 | Palak Paneer | 3a | Palak Tofu | 65 % |
| 20 | Pastetli mit Fleisch | 3a | Pastetli ohne Fleisch | 50 % |
| 11 | Gemischter Salat | 3b | — | — |
| 17 | Rösti mit Spiegelei | 3b | — | — |
| 1 | Pizza Margherita | 3b | — | — |
| 5 | Falafel (Döner ohne Fleisch) | 3b | — | — |
| 8 | Spaghetti Napoli | 3b | — | — |
| 12 | Gemüse-Wähe | 3b | — | — |
| 15 | Vegetarische Lasagne | 3b | — | — |
| 21 | Pastetli ohne Fleisch | 3b | — | — |

*Die sechs zusätzlichen 3b-Menüs (1, 5, 8, 12, 15, 21) sind die in Schritt 1 direkt wählbaren veg-Varianten der Auswahl-Kacheln. Sie greifen auf denselben 3b-Screen zu (kein Variantenvorschlag, kein Reduktions-Hinweis, kein Wenn-dann-Plan) — siehe Schutzregel 2.4.*

**Variantenvorschlag-Texte (Screen 3a).** Wortlaut aus der Excel-Spalte `Variantenvorschlag Text`, 1:1 nach `daten.json → schritt3.menus["<nr>"].alternative.variantentext`. `<br>` = Zeilenumbruch im UI.

**2 · Pizza Prosciutto → Pizza Margherita (−30 %)**
> Bestelle oder backe ab und zu eine vegetarische Pizza. Du hast viele Möglichkeiten: zum Beispiel Pizza verdura, Pizza rucola oder auch Pizza margherita. Damit tust du dem Klima und deiner Gesundheit etwas Gutes.

**3 · Schnitzel mit Pommes → Schnitzel mit Pommes (vegetarisch) (−65 %)**
> Ein knuspriges, paniertes Schnitzel mit Pommes. Statt Schweinefleisch ein vegetarisches Schnitzel. Dies ist gut für deine Gesundheit und reduziert die Klimawirkung des Menus.

**4 · Döner mit Fleisch → Falafel (Döner ohne Fleisch) (−90 %)**
> Du kannst ab und zu statt eines Döners mit Fleisch einen Falafel nehmen.`<br>` Wenn du nicht auf Fleisch verzichten möchtest, gibt es vielleicht einen Poulet-Döner im Angebot. Dieser ist deutlich klimafreundlicher als der Döner mit Rindfleisch.

**6 · Älplermagronen → Älplermagronen (Haferrahm, wenig Käse) (−30 %)**
> Hier kannst du experimentieren. Versuche es mal mit weniger Käse und Haferrahm statt Vollrahm. Oder probiere mal, ob dir ein veganes Rezept auch schmeckt. Je weniger Käse und Rahm, desto kleiner die Klimawirkung.

**7 · Spaghetti Bolognese → Spaghetti mit Linsenbolognese (−65 %)**
> Probier mal eine Linsenbolognese. Schmeckt fast identisch und hat mehr Ballaststoffe, was gut für deine Gesundheit ist.`<br>`Wenn du nicht ganz auf Fleisch verzichten möchtest, kannst du auch eine Sauce mit halb Hackfleisch, halb Linsen ausprobieren.

**9 · Rahmschnitzel → Rahmschnitzel (vegetarisch) (−90 %)**
> Fast dasselbe Gericht, einfach ein vegetarisches Schnitzel anstelle des Kalbsschnitzels. Dies ist auch gut für deine Gesundheit.`<br>`Wenn du nicht auf Fleisch verzichten möchtest, kannst du das Kalbs- mit einem Pouletschnitzel ersetzen.

**10 · Butter Chicken mit Reis → Butter Tofu (−50 %)**
> Probier einmal Butter Tofu - dieselbe Sauce, die selben Gewürze, einfach Tofu statt Huhn. Dies reduziert die Klimawirkung des Menus merklich.

**13 · Käse-Zwiebel-Wähe → Gemüse-Wähe (−20 %)**
> Alternativ könntest du eine Gemüse-Wähe ausprobieren. Diese hat weniger Käse und Rahm, wird dadurch leichter und auch klimafreundlicher.

**14 · Lasagne mit Fleisch → Vegetarische Lasagne (−50 %)**
> Probier mal eine Lasagne mit Linsen statt Hackfleisch. Schmeckt fast identisch und hat mehr Ballaststoffe, was gut für deine Gesundheit ist.`<br>`Wenn du nicht ganz auf Fleisch verzichten möchtest, kannst du auch eine Sauce mit halb Hackfleisch, halb Linsen ausprobieren.

**16 · Sushi → Sushi (vegetarisch) (−30 %)**
> Probier mal ein Sushi ohne Fisch. Ein rein vegetarisches Sushi hat eine kleinere Klimawirkung. Gesund sind beide Varianten.

**18 · Pad Thai → Pad Thai (vegetarisch) (−70 %)**
> Probiere mal ein Pad Thai mit Tofu und Ei, anstatt Crevetten und Poulet. Dies reduziert die Klimawirkung des Menus stark.

**19 · Palak Paneer → Palak Tofu (−65 %)**
> Spinat, Joghurt und Gemüse bleiben gleich, nur der Paneer wird durch Tofu ersetzt. Durch diese kleine Änderung kannst du die Klimawirkung des Menus spürbar verkleinern.

**20 · Pastetli mit Fleisch → Pastetli ohne Fleisch (−50 %)**
> Probier mal eine Pastetli-Sauce ohne Fleisch. Es gibt auch Rezepte ohne Pilze, wenn du diese nicht magst.`<br>`Wenn du nicht ganz auf Fleisch verzichten magst, nimm ein Poulet-Ragout statt Brätkügeli. Dies hilft deiner Gesundheit und dem Klima.

**11 · Gemischter Salat / 17 · Rösti mit Spiegelei** → Screen 3b, kein Variantentext.

**Reduktions-Sätze (Screen 3a).** Diese Sätze benennen die Reduktion direkt und drücken sie **im Vergleich zum gewählten (klimaintensiveren) Menu** aus. Nennt der Vorschlag mehrere Varianten bzw. einen Teil-Tausch (Spalte «Typ» = B), folgt ein zweiter Satz zu den kleineren Änderungen; nennt er nur eine konkrete Variante (Typ A), entfällt dieser. Wortlaut 1:1 nach `daten.json → schritt3.menus["<nr>"].alternative.reduktion_satz`. Der Prozentwert stammt aus der Spalte «Reduktion» oben.

| Nr. | Gewähltes Menü | Typ | Reduktions-Satz |
|----|----|----|----|
| 2 | Pizza Prosciutto | A | Wenn du **Pizza Margherita** wählst, reduziert sich die Klimawirkung um **30 %** im Vergleich zur Pizza Prosciutto. |
| 3 | Schnitzel mit Pommes | A | Wenn du **Schnitzel mit Pommes (vegetarisch)** wählst, reduziert sich die Klimawirkung um **65 %** im Vergleich zum Schnitzel mit Pommes. |
| 4 | Döner mit Fleisch | B | Wenn du **Falafel (Döner ohne Fleisch)** wählst, reduziert sich die Klimawirkung um **90 %** im Vergleich zum Döner mit Fleisch. Kleinere Änderungen (z. B. ein Poulet- statt Rindfleisch-Döner) reduzieren die Klimawirkung entsprechend weniger. |
| 6 | Älplermagronen | B | Wenn du **Älplermagronen (Haferrahm, wenig Käse)** wählst, reduziert sich die Klimawirkung um **30 %** im Vergleich zu den Älplermagronen. Kleinere Änderungen (z. B. Haferrahm statt Vollrahm, aber gleich viel Käse) reduzieren die Klimawirkung entsprechend weniger. |
| 7 | Spaghetti Bolognese | B | Wenn du **Spaghetti mit Linsenbolognese** wählst, reduziert sich die Klimawirkung um **65 %** im Vergleich zu den Spaghetti Bolognese. Kleinere Änderungen (z. B. eine Sauce mit halb Hackfleisch, halb Linsen) reduzieren die Klimawirkung entsprechend weniger. |
| 9 | Rahmschnitzel mit Reis oder Nudeln | B | Wenn du **Rahmschnitzel (vegetarisch)** wählst, reduziert sich die Klimawirkung um **90 %** im Vergleich zum Rahmschnitzel mit Reis oder Nudeln. Kleinere Änderungen (z. B. ein Poulet- statt Kalbsschnitzel) reduzieren die Klimawirkung entsprechend weniger. |
| 10 | Butter Chicken mit Reis | A | Wenn du **Butter Tofu** wählst, reduziert sich die Klimawirkung um **50 %** im Vergleich zum Butter Chicken mit Reis. |
| 13 | Käse-Zwiebel-Wähe | A | Wenn du **Gemüse-Wähe** wählst, reduziert sich die Klimawirkung um **20 %** im Vergleich zur Käse-Zwiebel-Wähe. |
| 14 | Lasagne mit Fleisch | B | Wenn du **Vegetarische Lasagne** wählst, reduziert sich die Klimawirkung um **50 %** im Vergleich zur Lasagne mit Fleisch. Kleinere Änderungen (z. B. eine Sauce mit halb Hackfleisch, halb Linsen) reduzieren die Klimawirkung entsprechend weniger. |
| 16 | Sushi | A | Wenn du **Sushi (vegetarisch)** wählst, reduziert sich die Klimawirkung um **30 %** im Vergleich zum Sushi. |
| 18 | Pad Thai | A | Wenn du **Pad Thai (vegetarisch)** wählst, reduziert sich die Klimawirkung um **70 %** im Vergleich zum Pad Thai. |
| 19 | Palak Paneer | A | Wenn du **Palak Tofu** wählst, reduziert sich die Klimawirkung um **65 %** im Vergleich zum Palak Paneer. |
| 20 | Pastetli mit Fleisch | B | Wenn du **Pastetli ohne Fleisch** wählst, reduziert sich die Klimawirkung um **50 %** im Vergleich zum Pastetli mit Fleisch. Kleinere Änderungen (z. B. ein Poulet-Ragout statt Brätkügeli) reduzieren die Klimawirkung entsprechend weniger. |

*Für die 3b-Menüs (1, 5, 8, 11, 12, 15, 17, 21) gibt es keinen Reduktions-Satz (kein Variantenvorschlag — siehe Schutzregel 2.4).*

### 8.2 Wenn-dann-Handlungen (Schritt 4)

Die Handlung ergibt sich neu aus dem **gewählten Auslöser** (nicht mehr aus dem Gericht). `[Klima-Menu]` wird durch die klimafreundlichste Variante zum gewählten Gericht ersetzt (Alternative-Name aus Anhang 8.1). Wortlaut 1:1 nach `daten.json → schritt4.ausloeser[]`.

| Auslöser («Wenn ich das nächste Mal …») | Handlung («… dann …») | braucht [Klima-Menu] |
|----|----|----|
| … Essen nach Hause bestelle | … wähle ich ein vegetarisches oder veganes Menu. Zum Beispiel [Klima-Menu]. | ja |
| … ein Abendessen koche | … koche ich ein vegetarisches oder veganes Menu. Zum Beispiel [Klima-Menu]. | ja |
| … in der Mensa zu Mittag esse | … wähle ich die vegetarische oder vegane Option. | nein |
| … einkaufen gehe | … kaufe ich Zutaten für ein vegetarisches oder veganes Menu. Zum Beispiel [Klima-Menu]. | ja |

**Zuordnung `[Klima-Menu]` je gewähltem Gericht** (= die klimafreundlichste Variante aus Anhang 8.1):

| Gewähltes Menü | [Klima-Menu] |
|----|----|
| Pizza Prosciutto | Pizza Margherita |
| Schnitzel mit Pommes | Schnitzel mit Pommes (vegetarisch) |
| Döner mit Fleisch | Falafel (Döner ohne Fleisch) |
| Älplermagronen | Älplermagronen (Haferrahm, wenig Käse) |
| Spaghetti Bolognese | Spaghetti mit Linsenbolognese |
| Rahmschnitzel mit Reis oder Nudeln | Rahmschnitzel (vegetarisch) |
| Butter Chicken mit Reis | Butter Tofu |
| Käse-Zwiebel-Wähe | Gemüse-Wähe |
| Lasagne mit Fleisch | Vegetarische Lasagne |
| Sushi | Sushi (vegetarisch) |
| Pad Thai | Pad Thai (vegetarisch) |
| Palak Paneer | Palak Tofu |
| Pastetli mit Fleisch | Pastetli ohne Fleisch |
| Alle 3b-Menüs (1, 5, 8, 11, 12, 15, 17, 21) | *(kein Klima-Menu — kein Wenn-dann-Plan, Schritt 4 direkt im Überspringen-Pfad)* |

*Wählt die Person einen menu-abhängigen Auslöser (bestelle / koche / einkaufen), erscheint das `[Klima-Menu]` im Satz. Beim Mensa-Auslöser entfällt der Einschub. Für 3b-Menüs gibt es kein Klima-Menu; diese Wahl führt Schritt 4 weiterhin direkt in den Überspringen-Pfad (siehe Schritt 4, Ablauf und Verzweigung).*

### 8.3 Emissionsarm-Pool (Schritt 3, Button) mit Herkunfts-Vorschlag

| Menü | Herkunft (Vorschlag für die Vielfalt) |
|----|----|
| Falafel (Döner ohne Fleisch) | orientalisch |
| Spaghetti Napoli | italienisch |
| Spaghetti mit Linsenbolognese | italienisch |
| Pad Thai (vegetarisch) | thailändisch |
| Palak Tofu | indisch |
| Sushi (vegetarisch) | japanisch |
| Schnitzel mit Pommes (vegetarisch) | Schweiz / europäisch |
| Gemischter Salat | neutral |
| Rösti mit Spiegelei | Schweiz |

*Herkunft ist ein Vorschlag; sie ist (noch) nicht als Excel-Spalte vorhanden. Ohne diese Spalte wählt die App 5 Menüs so, dass möglichst unterschiedliche Herkünfte vertreten sind, und schliesst das bereits gezeigte Variantenmenü aus.*

### 8.4 Schritt-2-Zutatenwerte (eaternity)

| Zutat | Anzeige | Exakter Wert (g CO₂-Äq.) |
|----|----|----|
| Linsen | ≈ 170 g CO₂-Äq. | 173 |
| Hartkäse | ≈ 1 760 g CO₂-Äq. | 1 764 |
| Poulet | ≈ 1 790 g CO₂-Äq. | 1 794 |
| Rindfleisch | ≈ 11 300 g CO₂-Äq. | 11 333 |

*Normiert auf eine vergleichbare Portion (ca. ⅓ des Tagesbedarfs), wie bei den Menüs. Balken: linear bis Referenz ≈ 2 000 g; Rindfleisch gekappt mit Bruch-Markierung (siehe 4, Technische Umsetzung).*

### 8.5 Bild-Platzhalter (werden nachgeliefert)

Namenskonvention: **Dateiname beginnt mit der Menu-Nr.**, gefolgt von `_` und einem Namensteil. Verlässlich ist nur der Nr.-Präfix; der genaue Dateiname pro Menü wird im Feld `bild` in `daten.json` hinterlegt.

> **Bilder sind geliefert.** Alle 30 Menübilder sowie `hero.png` und `Logo.png` liegen vor. **Achtung:** Bei mehreren gelieferten Dateien ist die **Umlaut-Kodierung im Dateinamen defekt** (Unicode-Zerlegung, z. B. `4_Do_ner_mit_Fleisch.png` statt Döner, `12_Gemu_sewa_he.png` statt Gemüsewähe). Solche Namen sind auf Webservern unzuverlässig.
>
> **Regel für den Bau:** Alle Bilder werden auf **saubere ASCII-Namen** mit Unterstrichen umbenannt (ä→ae, ö→oe, ü→ue), und ausschliesslich diese Namen stehen in `daten.json → …bild`. Die Spalte „Verwendeter Name" in der Tabelle unten ist verbindlich. Betroffen von der Umbenennung sind nur die Menüs 4, 6, 12, 13, 17, 19, 20, 28; die übrigen Dateinamen sind bereits sauber.

| Menu-Nr. | Menü (Option) | Gelieferte Datei (Disk) | Verwendeter Name (daten.json) |
|----|----|----|----|
| 1 | Pizza Margherita | `1_Pizza_Margherita.png` | `1_Pizza_Margherita.png` |
| 2 | Pizza Prosciutto | `2_Pizza_Prosciutto.png` | `2_Pizza_Prosciutto.png` |
| 3 | Schnitzel mit Pommes | `3_Schnitzel_Pommes.png` | `3_Schnitzel_Pommes.png` |
| 4 | Döner / Kebab mit Fleisch | `4_Do_ner_mit_Fleisch.png` | `4_Doener_mit_Fleisch.png` |
| 5 | Döner / Kebab ohne Fleisch (Falafel) | `5_Falafel.png` | `5_Falafel.png` |
| 6 | Älplermagronen | `6_A_lplermagronen.png` | `6_Aelplermagronen.png` |
| 7 | Spaghetti Bolognese | `7_Spaghetti_Bolognese.png` | `7_Spaghetti_Bolognese.png` |
| 8 | Spaghetti Napoli | `8_Spaghetti_Napoli.png` | `8_Spaghetti_Napoli.png` |
| 9 | Rahmschnitzel mit Reis oder Nudeln | `9_Rahmschnitzel_mit_Reis.png` | `9_Rahmschnitzel_mit_Reis.png` |
| 10 | Butter Chicken mit Reis | `10_Butter_Chicken_mit_Reis.png` | `10_Butter_Chicken_mit_Reis.png` |
| 11 | Gemischter Salat | `11_Gemischter_Salat.png` | `11_Gemischter_Salat.png` |
| 12 | Gemüse-Wähe | `12_Gemu_sewa_he.png` | `12_Gemuesewaehe.png` |
| 13 | Käse-Zwiebel-Wähe | `13_Ka_se-Zwiebel-Wa_he.png` | `13_Kaese-Zwiebel-Waehe.png` |
| 14 | Lasagne mit Fleisch | `14_Lasagne_mit_Fleisch.png` | `14_Lasagne_mit_Fleisch.png` |
| 15 | Vegetarische Lasagne | `15_Vegetarische_Lasagne.png` | `15_Vegetarische_Lasagne.png` |
| 16 | Sushi | `16_Sushi.png` | `16_Sushi.png` |
| 17 | Rösti mit Spiegelei | `17_Ro_sti_mit_Spiegelei.png` | `17_Roesti_mit_Spiegelei.png` |
| 18 | Pad Thai | `18_Pad_Thai.png` | `18_Pad_Thai.png` |
| 19 | Palak Paneer | `19_Palak_paneer.png` | `19_Palak_Paneer.png` |
| 20 | Pastetli mit Fleisch (Brätkügeli) | `20_Pastetli_mit_Bra_tku_geli.png` | `20_Pastetli_mit_Braetkuegeli.png` |
| 21 | Pastetli ohne Fleisch (Pilzsauce) | `21_Pastetli_mit_Pilzsauce.png` | `21_Pastetli_mit_Pilzsauce.png` |
| 22 | Rahmschnitzel (vegetarisch) | `22_Rahmschnitzel_mit_Reis_oder_Nudeln_Vegetarisch.png` | `22_Rahmschnitzel_Vegetarisch.png` |
| 23 | Pad Thai (vegetarisch) | `23_Pad_Thai_Vegetarisch.png` | `23_Pad_Thai_Vegetarisch.png` |
| 24 | Palak Tofu | `24_Palak_Tofu.png` | `24_Palak_Tofu.png` |
| 25 | Butter Tofu | `25_Butter_Tofu.png` | `25_Butter_Tofu.png` |
| 26 | Schnitzel mit Pommes (vegetarisch) | `26_Schnitzel_mit_Pommes_Vegetarisch.png` | `26_Schnitzel_Vegetarisch.png` |
| 28 | Älplermagronen (Haferrahm, wenig Käse) | `28_A_lplermagronen_wenig_Ka_se.png` | `28_Aelplermagronen_wenig_Kaese.png` |
| 29 | Sushi (vegetarisch) | `29_Sushi_Vegetarisch.png` | `29_Sushi_Vegetarisch.png` |
| 30 | Spaghetti mit Linsenbolognese | `30_Spaghetti_mit_Linsenbolognese.png` | `30_Spaghetti_mit_Linsenbolognese.png` |

*Menu-Nr. 27 (Lasagne mit Hafer-Béchamel) kommt im aktuellen Ablauf nicht vor und braucht kein Bild.*

Zusätzlich Rahmen-Assets: `hero.png` (Hero-Bild, **kein Credit**), `Logo.png` (Header- **und Footer-**Logo, vorhanden), Header-Assets `hamburger-gray-46.png` und `button_sprechblase_lang-136.jpg` (vorhanden), Sponsorenlogos (**kein Credit**). **Menü-Illustrationen tragen keinen Credit.** — **Footer-Logo:** `Logo.png` als `<img>` (das Inline-SVG `logo-n-trail.svg` wird nicht geliefert und entfällt).

---

## 9. Offene Punkte / noch zu liefern

1. **Bilder — vollständig geliefert.** Alle 30 Menübilder, `hero.png` und `Logo.png` liegen vor; Header-Assets `hamburger-gray-46.png` und `button_sprechblase_lang-136.jpg` ebenfalls. Beim Bau werden defekt kodierte Dateinamen auf saubere ASCII-Namen umbenannt (Mapping in Anhang 8.5). Das Footer-Logo ist `Logo.png` als `<img>` (kein Inline-SVG). Menü-Illustrationen, Hero und Sponsorenlogos tragen **keinen Credit**.
2. **Schriften (Self-Hosting):** Die `.woff2/.woff`-Dateien werden nachgeliefert und in den Ordner **`css/`** gelegt (siehe Skill-Skeleton). Erwartete Dateien: `Lato-Regular.woff2/.woff` (400) und `Lato-Black.woff2/.woff` (900), optional `Lato-Light`/`Lato-Bold`/`Lato-Italic`. **Fira Sans wird nicht benötigt** (nur für den Info-Button gedacht, der hier entfällt). Bis zur Lieferung greift der System-Fallback aus dem `--font`-Stack.
3. **Endgültiger Cyon-/URL-Pfad** (voraussichtlich `https://n-trail.org/Basel/Posten_XY`).
4. **Rahmenseiten — nicht gebaut, aber verlinkt.** Es wird nur die eigenständige Posten-App gebaut. Header-Hamburger und Footer verlinken auf die bestehenden **absoluten** Basel-Seiten:
   - Anleitung → `https://n-trail.org/Basel/bs_anleitung.html`
   - FAQ → `https://n-trail.org/Basel/bs_faq.html`
   - Karte → `https://n-trail.org/Basel/uebersichtskarte_basel.html`
   - Impressum → `https://n-trail.org/Basel/bs_impressum.html`
   - Datenschutz → `https://n-trail.org/Basel/bs_datenschutzerklarung.html`

   Alle Links öffnen die Live-Site (kein iframe). **Der grüne Info-Button „Was ist der Klimaweg?" und das Info-Popup entfallen für diesen Posten komplett** (kein Button, kein Overlay). Header damit: Logo (= Home, `index.html`) + Hamburger-Menü.
5. **Excel (optional):** Spalte «Herkunft/Typ» ergänzen (für die Vielfalt der emissionsarmen Menus). Solange nicht vorhanden, nutzt die App die Herkunfts-Vorschläge aus Anhang 8.3.
6. **Skill-Anpassung — teilweise erledigt, ein Punkt offen:** `SKILL_webseite.md` ist bereits vollständig auf **.ics** umgestellt (kein `mailto`, kein `reminderLink()`); die Beispiel-Asset-Namen sind angeglichen (`hamburger-gray-46.png`, `button_sprechblase_lang-136.jpg`, `hero.png`) und der Erinnerungs-Default (überschreibbar) ist dokumentiert. **Noch anzupassen:** `buildIcs()` muss (a) einen kurzen `SUMMARY` und eine längere `DESCRIPTION` getrennt entgegennehmen und (b) einen `VALARM`-Block mit `ACTION:DISPLAY` und `TRIGGER:PT0S` erzeugen, damit die Erinnerung **zum Ereigniszeitpunkt** auslöst (siehe Schritt 4, «Technische Umsetzung — Erinnerung als .ics»). Bislang erzeugt `buildIcs()` nur `SUMMARY`/`DESCRIPTION` ohne Alarm.
7. **Schritt-4-Logik geändert:** Die Wenn-dann-Handlung ist neu **auslöserabhängig** (vier Auslöser) statt gerichtsabhängig; der gerichtsabhängige Teil ist nur noch das eingesetzte `[Klima-Menu]` (= klimafreundlichste Variante aus Anhang 8.1). `daten.json → schritt4` und Anhang 8.2 sind entsprechend umgestellt.
