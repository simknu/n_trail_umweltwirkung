/* ============================================================
   Posten «Was kommt auf deinen Teller?» — Verhalten
   Alle Inhalte kommen aus daten.json. Zustand ist session-only.
   ============================================================ */

const state = {
  menu_nr: null,        // in Schritt 1 gewähltes Menü
  menu_name: "",        // Anzeigename des gewählten Menüs
  modus: null,          // "vorschlag" (3a) oder "bestaetigung" (3b)
  ausloeser: null       // gewählter Auslöser-Baustein (Schritt 4), Objekt aus daten.json
};

let DATA;

async function boot(){
  try {
    DATA = await (await fetch('daten.json')).json();
  } catch (e) {
    document.querySelector('main').innerHTML =
      '<p style="padding:2rem 0">Die Inhalte konnten nicht geladen werden. ' +
      'Bitte die Seite über einen Webserver öffnen (nicht per Doppelklick auf die Datei).</p>';
    return;
  }
  fillChrome();
  renderSchritt1();
  buildSchritt2();
  bindHeader();
  showStep(1);
}
boot();

/* ---- Schritte ein-/ausblenden (kein Reload) ---- */
const steps = [...document.querySelectorAll('.step')];
function showStep(n){
  steps.forEach(s => s.hidden = (+s.dataset.step !== n));
  window.scrollTo({ top: 0 });
}

/* ---- kleine Helfer ---- */
function el(id){ return document.getElementById(id); }
function setText(id, txt){ const n = el(id); if(n) n.textContent = txt; }
function setHtml(id, html){ const n = el(id); if(n) n.innerHTML = html; }
function fill(tpl, map){ return String(tpl).replace(/\{(\w+)\}/g, (_, k) => (k in map ? map[k] : '{'+k+'}')); }
function strip(s){ return String(s).replace(/^…\s*/, ''); }   // führendes "… " entfernen

/* {eaternity} im Text durch den verlinkten Namen ersetzen (URL steht nur in meta) */
function linkEaternity(text){
  const m = DATA.meta;
  const a = `<a href="${m.eaternity_url}" target="_blank" rel="noopener">${m.eaternity_label}</a>`;
  return String(text).replace(/\{eaternity\}/g, a);
}
function paragraphs(list){
  return (Array.isArray(list) ? list : [list]).map(p => `<p>${linkEaternity(p)}</p>`).join('');
}

/* ============================================================
   Rahmen: Header, Footer, Hero, Links
   ============================================================ */
function fillChrome(){
  const m = DATA.meta;
  el('heroTitle').textContent = m.hero_titel;
  el('heroImg').src = m.hero_bild;
  el('hdrLogo').src = m.logo_header;
  el('ftrLogo').src = m.logo_footer;
  setText('ftrCopy', m.footer_copy);
  el('year').textContent = new Date().getFullYear();
  const L = m.links;
  el('lnkAnleitung').href = L.anleitung;
  el('lnkFaq').href = L.faq;
  el('lnkKarte').href = L.karte;
  el('lnkImpressum').href = L.impressum;
  el('lnkDatenschutz').href = L.datenschutz;
}

function bindHeader(){
  const burger = document.querySelector('.hdr-burger');
  const menu = el('menu');
  burger.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', e => {
    if(!e.target.closest('.hdr-menu')){
      menu.hidden = true;
      burger.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ============================================================
   Menu-Liste: Bild links (App-Symbol-Grösse), Name rechts
   ============================================================ */
function rowMarkup(m, attrs){
  return `<button class="menu-row" type="button" ${attrs || ''}>
      <img class="menu-thumb" src="${m.bild}" alt="">
      <span class="menu-row-name">${m.name || m.label}</span>
    </button>`;
}

/* Bild zu einer Menu-Nummer — die Bilder stehen bei den Einträgen von Schritt 1
   (Einzelmenu oder Variante einer Auswahl-Kachel), darum von dort nachschlagen. */
function menuBild(nr){
  const s1 = DATA.schritt1;
  for(const t of [...s1.ebene1, ...s1.ebene2]){
    if(t.typ === 'single'){ if(t.menu_nr === nr) return t.bild; continue; }
    const o = t.optionen.find(o => o.menu_nr === nr);
    if(o) return o.bild;
  }
  return '';
}

/* reine Anzeige-Zeile (kein Klick): Vorschlagslisten.
   gross = Variantenvorschlag in Schritt 3a (Bild ca. dreifach) */
function staticRowMarkup(m, gross){
  return `<div class="menu-row${gross ? ' menu-row--gross' : ''}">
      <img class="menu-thumb" src="${m.bild}" alt="">
      <span class="menu-row-name">${m.name}</span>
    </div>`;
}

/* ============================================================
   Schritt 1 — Persönlicher Anker
   ============================================================ */
function renderSchritt1(){
  const s = DATA.schritt1;
  setText('s1Intro', s.intro);
  setText('s1FrageGross', s.frage_gross);
  setText('s1FrageKlein', s.frage_klein);
  setText('s1Hinweis', s.hinweis);
  setText('s1Anon', s.anonymitaets_hinweis);
  setText('s1MehrBtn', s.mehr_button);
  state.menu_nr = null;
  setText('s1Ebene2Intro', s.ebene2_intro);
  setText('s1Ebene2Hinweis', s.ebene2_hinweis);

  el('s1Ebene1').innerHTML = s.ebene1.map(listentryMarkup).join('');
  el('s1Ebene2').innerHTML = s.ebene2.map(listentryMarkup).join('');

  wireMenuList(el('s1Ebene1'));
  wireMenuList(el('s1Ebene2'));

  el('s1MehrBtn').addEventListener('click', () => {
    el('s1Ebene2Wrap').hidden = false;
    el('s1MehrBtn').hidden = true;
    el('s1Ebene2Wrap').scrollIntoView({ behavior: prefersMotion() ? 'smooth' : 'auto', block: 'start' });
  });
}

function listentryMarkup(t){
  if(t.typ === 'single'){
    return rowMarkup(t, `data-nr="${t.menu_nr}" aria-pressed="false"`);
  }
  // Auswahl-Kachel: zuerst nur ein Bild + Titel; die zwei Varianten erscheinen erst auf Klick
  const opts = t.optionen.map(o => rowMarkup(o, `data-nr="${o.menu_nr}" aria-pressed="false"`)).join('');
  return `<div class="menu-group" data-group="${t.id}">
    <button class="menu-row menu-row--toggle" type="button" aria-expanded="false" aria-controls="grp-${t.id}">
      <img class="menu-thumb" src="${t.bild}" alt="">
      <span class="menu-row-name">${t.label}</span>
    </button>
    <div class="menu-group-body" id="grp-${t.id}" hidden>
      <p class="menu-frage">${t.frage}</p>
      <div class="menulist">${opts}</div>
    </div>
  </div>`;
}

function wireMenuList(container){
  container.querySelectorAll('.menu-row--toggle').forEach(btn => {
    btn.addEventListener('click', () => toggleGroup(btn));
  });
  container.querySelectorAll('.menu-row[data-nr]').forEach(btn => {
    btn.addEventListener('click', () => markMenuRow(btn));
  });
}

function toggleGroup(btn){
  const body = el(btn.getAttribute('aria-controls'));
  const open = body.hidden;
  body.hidden = !open;
  btn.setAttribute('aria-expanded', String(open));
}

/* Anwählen markiert die Zeile und zeigt darunter den Bestätigungs-Button.
   Erst dieser Button führt weiter — die Auswahl endet also nicht mit einem Tipp. */
function markMenuRow(btn){
  document.querySelectorAll('.menu-row[data-nr]').forEach(b => b.setAttribute('aria-pressed', 'false'));
  btn.setAttribute('aria-pressed', 'true');

  const alt = el('s1AuswahlBtn');
  if(alt) alt.remove();

  const name = btn.querySelector('.menu-row-name').textContent;
  const weiter = document.createElement('button');
  weiter.id = 's1AuswahlBtn';
  weiter.type = 'button';
  weiter.className = 'btn btn-primary btn-auswahl';
  weiter.textContent = fill(DATA.schritt1.auswahl_button, { menu: name });
  weiter.addEventListener('click', () => chooseMenu(+btn.dataset.nr));
  btn.insertAdjacentElement('afterend', weiter);
}

function chooseMenu(nr){
  const menu = DATA.schritt3.menus[String(nr)];
  state.menu_nr = nr;
  state.menu_name = menu ? menu.name : '';
  state.modus = menu ? menu.modus : 'bestaetigung';
  prepSchritt3();
  showStep(2);
}

/* ============================================================
   Schritt 2 — Schätzen, dann auflösen
   ============================================================ */
function buildSchritt2(){
  const s = DATA.schritt2;
  setText('s2Titel', s.intro_titel);
  setText('s2Text', s.intro_text);
  setText('s2DragHinweis', s.intro_hinweis);
  setText('s2AxisTop', s.achse_oben);
  setText('s2AxisBottom', s.achse_unten);
  setText('s2AufloesenBtn', s.aufloesen_button);
  setText('s2DeineTitel', s.deine_reihenfolge_titel);
  setText('s2TatTitel', s.tatsaechlich_titel);
  setHtml('s2EaternityHinweis', linkEaternity(s.eaternity_hinweis));

  const t = s.texte;
  setText('s2UeTitel', t.ueberrascht_titel);
  setText('s2UeIntro', t.ueberrascht_intro);
  setText('s2P1Titel', t.punkt1_titel);
  setText('s2P1Text', t.punkt1_text);
  setText('s2WiesoBtn', t.wieso_button);
  setText('s2WiesoIntro', t.wieso_intro);
  el('s2WiesoPunkte').innerHTML = t.wieso_punkte.map(p => `<li>${p}</li>`).join('');
  setText('s2P2Titel', t.punkt2_titel);
  setText('s2P2Text', t.punkt2_text);
  // Zeilenumbruch nach dem Doppelpunkt; ganzer Absatz fett (siehe .goodnews)
  setHtml('s2GuteNachricht', `${t.gute_nachricht_titel}<br>${t.gute_nachricht_text}`);
  setText('s2WeiterBtn', t.weiter_button);

  // Sortierliste (gemischte Startreihenfolge)
  el('sortlist').innerHTML = s.zutaten_start
    .map(z => `<li data-name="${z}">${z}</li>`).join('');
  if(window.Sortable){
    new Sortable(el('sortlist'), { animation: prefersMotion() ? 150 : 0 });
  }

  el('s2AufloesenBtn').addEventListener('click', showAufloesung);
  el('s2WiesoBtn').addEventListener('click', () => toggleReveal('s2WiesoWrap'));
  el('s2WeiterBtn').addEventListener('click', () => showStep(3));
}

function showAufloesung(){
  const s = DATA.schritt2;
  // eigene gezogene Reihenfolge (oben = hoch) aus dem DOM lesen
  const order = [...el('sortlist').querySelectorAll('li')].map(li => li.dataset.name);
  el('s2DeineReihenfolge').innerHTML = order.map(n => `<li>${n}</li>`).join('');

  // tatsächliche Reihenfolge als Balken: lineare Skala, Referenz = grösster Wert
  // (dadurch ist Rindfleisch massstabsgetreu ein Mehrfaches von Poulet, keine Kappung nötig)
  const max = Math.max(...s.zutaten_aufloesung.map(z => z.wert));
  el('s2Bars').innerHTML = s.zutaten_aufloesung.map(z => {
    const breite = (z.wert / max * 100).toFixed(1);
    return `
    <div class="bar">
      <span class="bar-label">${z.name}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width:${breite}%"></div>
      </div>
      <p class="bar-value">${z.anzeige}</p>
    </div>`;
  }).join('');

  el('s2a').hidden = true;
  el('s2b').hidden = false;
  window.scrollTo({ top: 0 });
}

/* ============================================================
   Schritt 3 — Mahlzeit leichter gemacht (3a / 3b)
   ============================================================ */
function prepSchritt3(){
  const s = DATA.schritt3;
  const menu = s.menus[String(state.menu_nr)];
  const is3a = state.modus === 'vorschlag';

  el('s3a').hidden = !is3a;
  el('s3b').hidden = is3a;
  el('s3aBerechnung').hidden = !is3a;

  if(is3a){
    const a = menu.alternative;
    setText('s3aTitel', fill(s.rahmen_3a_titel, { gericht: state.menu_name }));
    // gewähltes Menu nochmals zeigen — gleiche Grösse wie in der Auswahl, ohne Rahmen
    el('s3aGewaehltZeile').innerHTML =
      staticRowMarkup({ name: state.menu_name, bild: menuBild(state.menu_nr) });
    setText('s3aIntro', s.rahmen_3a_intro);
    // "Wähle das nächste Mal [Artikel]" — Artikel je Alternative, leer wo keiner passt
    setText('s3aWaehleSatz', [s.waehle_satz, a.artikel].filter(Boolean).join(' '));
    el('s3aMenuZeile').innerHTML = staticRowMarkup(a, true);
    el('s3aVariantentext').innerHTML = a.variantentext;   // nur <br>/<strong> aus vertrauenswürdiger Datenquelle
    setHtml('s3aReduktionSatz', a.reduktion_satz);
    setHtml('s3aVorschlagHinweis', paragraphs(s.vorschlag_hinweis));

    // "klicke hier" im Hinweis klappt den Berechnungstext auf (kein separater Button)
    setHtml('s3aBerechnungHinweis', linkEaternity(s.berechnung_hinweis).replace('{klick}',
      `<button type="button" class="link-inline" id="s3aBerechnungBtn">${s.berechnung_link_text}</button>`));
    setHtml('s3aBerechnungWrap', paragraphs(s.berechnung_text));
    el('s3aBerechnungWrap').hidden = true;
    el('s3aBerechnungBtn').onclick = () => toggleReveal('s3aBerechnungWrap');
  } else {
    setText('s3bTitel', s.rahmen_3b_titel);
    setHtml('s3bText', fill(s.rahmen_3b_text, { gericht: state.menu_name }));
  }

  // Emissionsarme Menus (gemeinsam)
  setText('s3EmissionsarmBtn', s.emissionsarm_button);
  el('s3EmissionsarmWrap').hidden = true;
  el('s3EmissionsarmBtn').hidden = false;
  el('s3EmissionsarmBtn').onclick = () => {
    renderEmissionsarm();
    el('s3EmissionsarmWrap').hidden = false;
    el('s3EmissionsarmBtn').hidden = true;
  };

  // Weiter: 3b hat keinen Vorsatz → Schritt 4 entfällt, es geht direkt weiter
  setText('s3WeiterBtn', s.weiter_button);
  el('s3WeiterBtn').onclick = () => {
    if(is3a){ prepSchritt4(); showStep(4); }
    else { weiter(); }
  };
}

function renderEmissionsarm(){
  const s = DATA.schritt3;
  const excl = state.modus === 'vorschlag'
    ? s.menus[String(state.menu_nr)].alternative.menu_nr
    : state.menu_nr;
  const pool = s.emissionsarm_pool.filter(m => m.menu_nr !== excl);
  const chosen = pickDiverse(pool, s.emissionsarm_anzahl || 5);
  el('s3EmissionsarmListe').innerHTML = chosen.map(m => staticRowMarkup(m)).join('');
}

// Menüs mit möglichst verschiedenen Herkünften (deterministisch, greedy)
function pickDiverse(pool, count){
  const seen = new Set();
  const out = [];
  for(const m of pool){ if(!seen.has(m.herkunft)){ out.push(m); seen.add(m.herkunft); } if(out.length===count) return out; }
  for(const m of pool){ if(!out.includes(m)){ out.push(m); } if(out.length===count) break; }
  return out.slice(0, count);
}

/* ============================================================
   Schritt 4 — Freiwilliger Vorsatz
   ============================================================ */
function prepSchritt4(){
  const s = DATA.schritt4;
  const r = s.erinnerung;
  setText('s4Frage', s.frage);
  setText('s4JaBtn', s.ja_button);
  setText('s4SkipBtn', s.ueberspringen_button);
  setText('s4PlanIntro', s.plan_intro);
  setText('s4AusloeserTitel', s.ausloeser_titel);
  setText('s4ErinnerungFrage', r.frage);
  setText('s4ErinnerungHinweis', r.hinweis);
  setText('s4DatumLabel', r.datum_label);
  setText('s4VorschauTitel', r.vorschau_titel);
  setText('s4VorschauHinweis', r.vorschau_hinweis);
  el('s4KopierenBtn').setAttribute('aria-label', r.kopieren_label);
  el('s4KopierenBtn').title = r.kopieren_label;
  setText('s4ErinnerungJaBtn', r.ja_button);
  setText('s4ErinnerungFallback', r.fallback);
  setText('s4WeiterBtn', s.weiter_button);

  // Zustand für diesen Durchgang zurücksetzen
  state.ausloeser = null;
  el('s4a').hidden = false;
  el('s4b').hidden = true;
  el('s4PlanSatz').hidden = true;
  el('s4KopierStatus').hidden = true;
  document.querySelector('.reminder').hidden = true;

  // Auslöser-Bausteine (Einzelauswahl)
  el('s4Ausloeser').innerHTML = s.ausloeser
    .map((a, i) => `<button class="btn-answer" type="button" data-i="${i}" aria-pressed="false">${a.label}</button>`).join('');
  el('s4Ausloeser').querySelectorAll('.btn-answer').forEach(b => {
    b.addEventListener('click', () => selectAusloeser(b, s.ausloeser[+b.dataset.i]));
  });

  // Erinnerungsdatum: Default in einer Woche (lokal), überschreibbar
  el('s4Datum').value = defaultReminderValue();
  el('s4Datum').oninput = updateVorschau;

  el('s4JaBtn').onclick = () => { el('s4a').hidden = true; el('s4b').hidden = false; window.scrollTo({top:0}); };
  el('s4SkipBtn').onclick = () => weiter();
  el('s4KopierenBtn').onclick = copyErinnerung;
  el('s4ErinnerungJaBtn').onclick = downloadReminder;
  el('s4WeiterBtn').onclick = () => weiter();
}

function selectAusloeser(btn, ausloeser){
  state.ausloeser = ausloeser;
  el('s4Ausloeser').querySelectorAll('.btn-answer').forEach(b => b.setAttribute('aria-pressed', 'false'));
  btn.setAttribute('aria-pressed', 'true');
  el('s4PlanSatz').textContent = planSatz();
  el('s4PlanSatz').hidden = false;
  document.querySelector('.reminder').hidden = false;
  el('s4KopierStatus').hidden = true;
  updateVorschau();
}

/* Handlung des gewählten Auslösers; [Klima-Menu] = Alternative aus Schritt 3 */
function handlungText(){
  const s = DATA.schritt4;
  if(!state.ausloeser) return '';
  const alt = DATA.schritt3.menus[String(state.menu_nr)].alternative;
  return state.ausloeser.braucht_menu
    ? state.ausloeser.handlung.split(s.klima_menu_platzhalter).join(alt.name)
    : state.ausloeser.handlung;
}

function planSatz(){
  const s = DATA.schritt4;
  if(!state.ausloeser) return '';
  return fill(s.plan_vorlage, { ausloeser: strip(state.ausloeser.label), handlung: strip(handlungText()) });
}

/* ---- Erinnerung: Vorschau (kopierbar) + .ics (rein clientseitig, nichts gespeichert) ---- */
function two(x){ return String(x).padStart(2, '0'); }
function defaultReminderValue(){
  const r = DATA.schritt4.erinnerung;
  const d = new Date(Date.now() + (r.default_tage || 7)*24*60*60*1000);
  d.setHours(r.default_stunde || 18, 0, 0, 0);
  return `${d.getFullYear()}-${two(d.getMonth()+1)}-${two(d.getDate())}T${two(d.getHours())}:${two(d.getMinutes())}`;
}
function reminderStart(){
  const val = el('s4Datum').value;
  const d = new Date(val || defaultReminderValue());
  return isNaN(d.getTime()) ? new Date(defaultReminderValue()) : d;
}
function formatTermin(d){
  return d.toLocaleString('de-CH', { weekday:'short', day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit' });
}

/* Zeilen der Erinnerung — identisch in Vorschau, ICS-Beschreibung und Kopier-Text */
function erinnerungZeilen(){
  const r = DATA.schritt4.erinnerung;
  const alt = DATA.schritt3.menus[String(state.menu_nr)].alternative;
  const zeilen = [planSatz(), r.ics_zusatz];
  // Enthält der Satz bereits das [Klima-Menu], wird es nicht doppelt genannt;
  // beim Mensa-Auslöser (braucht_menu: false) fehlt es im Satz und wird ergänzt.
  if(state.ausloeser && state.ausloeser.braucht_menu === false){
    zeilen.push(fill(r.ics_menu_zeile, { menu: alt.name }));
  }
  return zeilen.filter(Boolean);
}
function vorschauText(){
  const r = DATA.schritt4.erinnerung;
  return [r.ics_titel, `${r.termin_label}: ${formatTermin(reminderStart())}`, '', ...erinnerungZeilen()].join('\n');
}
function updateVorschau(){
  if(!state.ausloeser) return;
  el('s4Vorschau').textContent = vorschauText();
}

function copyErinnerung(){
  const r = DATA.schritt4.erinnerung;
  const text = vorschauText();
  const melde = ok => {
    const n = el('s4KopierStatus');
    n.textContent = ok ? r.kopiert_hinweis : r.kopieren_fehler;
    n.hidden = false;
  };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(() => melde(true), () => melde(copyFallback(text)));
  } else {
    melde(copyFallback(text));
  }
}
function copyFallback(text){
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch(e) { ok = false; }
  document.body.removeChild(ta);
  return ok;
}

function icsEsc(s){ return String(s).replace(/[\;,]/g, m => '\\'+m).replace(/\n/g, '\\n'); }
function icsDate(d){ return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; }
/* SUMMARY kurz, DESCRIPTION ausführlich, Alarm genau zum Ereigniszeitpunkt (TRIGGER:PT0S) */
function buildIcs(titel, beschreibung, start, minutes){
  const end = new Date(start.getTime() + (minutes || 15)*60000);
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//N-Trail//Posten//DE','CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:'+Date.now()+'@n-trail','DTSTAMP:'+icsDate(new Date()),
    'DTSTART:'+icsDate(start),'DTEND:'+icsDate(end),
    'SUMMARY:'+icsEsc(titel),'DESCRIPTION:'+icsEsc(beschreibung),
    'BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:PT0S','DESCRIPTION:'+icsEsc(titel),'END:VALARM',
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
}
function downloadReminder(){
  const r = DATA.schritt4.erinnerung;
  const ics = buildIcs(r.ics_titel, erinnerungZeilen().join('\n'), reminderStart(), r.dauer_minuten);
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'erinnerung.ics'; a.click();
  URL.revokeObjectURL(url);
}

/* ============================================================
   Abschluss — Weiterleitung zum nächsten Posten
   (daten.json → meta.weiter_link; Platzhalter, bis das Ziel bekannt ist)
   ============================================================ */
function weiter(){
  window.location.href = DATA.meta.weiter_link;
}

/* ---- gemeinsame Helfer ---- */
function toggleReveal(wrapId){
  const w = el(wrapId);
  w.hidden = !w.hidden;
}
function prefersMotion(){
  return !window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
