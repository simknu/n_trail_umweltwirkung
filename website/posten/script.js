/* ============================================================
   Posten «Was kommt auf deinen Teller?» — Verhalten
   Alle Inhalte kommen aus daten.json. Zustand ist session-only.
   ============================================================ */

const state = {
  menu_nr: null,        // in Schritt 1 gewähltes Menü (1..21)
  menu_name: "",        // Anzeigename des gewählten Menüs
  modus: null,          // "vorschlag" (3a) oder "bestaetigung" (3b)
  ausloeser: null       // gewählter Auslöser-Baustein (Schritt 4)
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
function fill(tpl, map){ return tpl.replace(/\{(\w+)\}/g, (_, k) => (k in map ? map[k] : '{'+k+'}')); }
function strip(s){ return String(s).replace(/^…\s*/, ''); }   // führendes "… " entfernen

/* ============================================================
   Rahmen: Header, Footer, Hero, Links
   ============================================================ */
function fillChrome(){
  const m = DATA.meta;
  el('heroTitle').textContent = m.hero_titel;
  el('heroImg').src = m.hero_bild;
  el('hdrLogo').src = m.logo;
  el('ftrLogo').src = m.logo;
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
  setText('s1Ebene2Intro', s.ebene2_intro);
  setText('s1Ebene2Hinweis', s.ebene2_hinweis);

  el('s1Ebene1').innerHTML = s.ebene1.map(tileMarkup).join('');
  el('s1Ebene2').innerHTML = s.ebene2.map(tileMarkup).join('');

  wireTileClicks(el('s1Ebene1'));
  wireTileClicks(el('s1Ebene2'));

  el('s1MehrBtn').addEventListener('click', () => {
    el('s1Ebene2Wrap').hidden = false;
    el('s1MehrBtn').hidden = true;
    el('s1Ebene2Wrap').scrollIntoView({ behavior: prefersMotion() ? 'auto' : 'smooth', block: 'start' });
  });
}

function tileMarkup(t){
  if(t.typ === 'single'){
    return `<button class="tile tile--single" data-nr="${t.menu_nr}">
      <img src="${t.bild}" alt="${t.label}">
      <span class="tile-name">${t.label}</span>
    </button>`;
  }
  // Auswahl-Kachel: Frage + zwei Optionen (erste zuerst, keine Vorauswahl)
  const opts = t.optionen.map(o =>
    `<button class="tile" data-nr="${o.menu_nr}">
       <img src="${o.bild}" alt="${o.name}">
       <span class="tile-name">${o.name}</span>
     </button>`).join('');
  return `<div class="tile-group">
    <p class="tile-frage"><strong>${t.label}</strong><br>${t.frage}</p>
    <div class="tile-options">${opts}</div>
  </div>`;
}

function wireTileClicks(container){
  container.querySelectorAll('.tile[data-nr]').forEach(btn => {
    btn.addEventListener('click', () => chooseMenu(+btn.dataset.nr));
  });
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
  setText('s2AxisTop', s.achse_oben);
  setText('s2AxisBottom', s.achse_unten);
  setText('s2AufloesenBtn', s.aufloesen_button);
  setText('s2AufloesenHinweis', s.aufloesen_hinweis);
  setText('s2DeineTitel', s.deine_reihenfolge_titel);
  setText('s2TatTitel', s.tatsaechlich_titel);
  setText('s2EaternityHinweis', s.eaternity_hinweis);

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
  setText('s2GuteNachricht', t.gute_nachricht);
  setText('s2WeiterBtn', t.weiter_button);

  // Sortierliste (gemischte Startreihenfolge)
  el('sortlist').innerHTML = s.zutaten_start
    .map(z => `<li data-name="${z}">${z}</li>`).join('');
  if(window.Sortable){
    new Sortable(el('sortlist'), { animation: prefersMotion() ? 0 : 150 });
  }

  el('s2AufloesenBtn').addEventListener('click', showAufloesung);
  el('s2WiesoBtn').addEventListener('click', () => toggleReveal('s2WiesoWrap', 's2WiesoBtn'));
  el('s2WeiterBtn').addEventListener('click', () => showStep(3));
}

function showAufloesung(){
  const s = DATA.schritt2;
  // eigene gezogene Reihenfolge (oben = hoch) aus dem DOM lesen
  const order = [...el('sortlist').querySelectorAll('li')].map(li => li.dataset.name);
  el('s2DeineReihenfolge').innerHTML = order.map(n => `<li>${n}</li>`).join('');

  // tatsächliche Reihenfolge als Balken (von wenig zu viel)
  el('s2Bars').innerHTML = s.zutaten_aufloesung.map(z => `
    <div class="bar">
      <span class="bar-label">${z.name}</span>
      <div class="bar-track">
        <div class="bar-fill${z.gekappt ? ' capped' : ''}" style="width:${z.balken}%"></div>
        <div class="bar-value">${z.anzeige}${z.gekappt ? ' <span class="capnote">(Balken gekappt — in Wirklichkeit viel länger)</span>' : ''}</div>
      </div>
    </div>`).join('');

  el('s2a').hidden = true;
  el('s2b').hidden = false;
  window.scrollTo({ top: 0 });
}

/* ============================================================
   Schritt 3 — Mahlzeit leichter gemacht (3a / 3b)
   ============================================================ */
function prepSchritt3(){
  const s = DATA.schritt3;
  const menu = DATA.schritt3.menus[String(state.menu_nr)];
  const is3a = state.modus === 'vorschlag';

  el('s3a').hidden = !is3a;
  el('s3b').hidden = is3a;

  if(is3a){
    const a = menu.alternative;
    setText('s3aTitel', fill(s.rahmen_3a_titel, { gericht: state.menu_name }));
    setText('s3aIntro', s.rahmen_3a_intro);
    el('s3aBild').src = a.bild;
    el('s3aBild').alt = a.name;
    setText('s3aAltName', a.name);
    el('s3aVariantentext').innerHTML = a.variantentext;   // nur <br> aus vertrauenswürdiger Datenquelle
    setText('s3aVorschlagHinweis', s.vorschlag_hinweis);
    setText('s3aReduktionHinweis', fill(s.reduktion_hinweis, { prozent: a.reduktion_prozent }));
    setText('s3aBerechnungBtn', s.berechnung_button);
    setText('s3aBerechnungText', s.berechnung_text);
    el('s3aBerechnungBtn').onclick = () => toggleReveal('s3aBerechnungWrap', 's3aBerechnungBtn');
  } else {
    setText('s3bTitel', s.rahmen_3b_titel);
    setText('s3bText', fill(s.rahmen_3b_text, { gericht: state.menu_name }));
  }

  // Emissionsarme Menus (gemeinsam)
  setText('s3EmissionsarmBtn', s.emissionsarm_button);
  setText('s3EmissionsarmTitel', s.emissionsarm_titel);
  el('s3EmissionsarmWrap').hidden = true;
  el('s3EmissionsarmBtn').onclick = () => {
    renderEmissionsarm();
    el('s3EmissionsarmWrap').hidden = false;
    el('s3EmissionsarmBtn').hidden = true;
  };
  el('s3EmissionsarmBtn').hidden = false;

  // Weiter: 3b überspringt Schritt 4 → direkt Schritt 5
  setText('s3WeiterBtn', s.weiter_button);
  el('s3WeiterBtn').onclick = () => {
    if(is3a){ prepSchritt4(); showStep(4); }
    else { renderSchritt5(); showStep(5); }
  };
}

function renderEmissionsarm(){
  const s = DATA.schritt3;
  const excl = state.modus === 'vorschlag'
    ? DATA.schritt3.menus[String(state.menu_nr)].alternative.menu_nr
    : state.menu_nr;
  const pool = s.emissionsarm_pool.filter(m => m.menu_nr !== excl);
  const chosen = pickDiverse(pool, 5);
  el('s3EmissionsarmListe').innerHTML = chosen.map(m => `
    <button class="tile tile--single" type="button" disabled style="cursor:default">
      <img src="${m.bild}" alt="${m.name}">
      <span class="tile-name">${m.name}</span>
    </button>`).join('');
}

// 5 Menüs mit möglichst verschiedenen Herkünften (deterministisch, greedy)
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
  setText('s4Frage', s.frage);
  setText('s4JaBtn', s.ja_button);
  setText('s4SkipBtn', s.ueberspringen_button);
  setText('s4PlanIntro', s.plan_intro);
  setText('s4AusloeserTitel', s.ausloeser_titel);
  setText('s4ErinnerungFrage', s.erinnerung_frage);
  setText('s4ErinnerungHinweis', s.erinnerung_hinweis);
  setText('s4DatumLabel', s.erinnerung_datum_label);
  setText('s4ErinnerungJaBtn', s.erinnerung_ja_button);
  setText('s4ErinnerungFallback', s.erinnerung_fallback);
  setText('s4FertigBtn', s.fertig_button);

  // Zustand für diesen Durchgang zurücksetzen
  state.ausloeser = null;
  el('s4a').hidden = false;
  el('s4b').hidden = true;
  el('s4PlanSatz').hidden = true;

  // Auslöser-Bausteine (Einzelauswahl)
  el('s4Ausloeser').innerHTML = s.ausloeser
    .map((a, i) => `<button class="btn-answer" type="button" data-i="${i}" aria-pressed="false">${a}</button>`).join('');
  el('s4Ausloeser').querySelectorAll('.btn-answer').forEach(b => {
    b.addEventListener('click', () => selectAusloeser(b, s.ausloeser[+b.dataset.i]));
  });

  // Alternative (Bild + Name) zum gewählten Menü
  const menu = DATA.schritt3.menus[String(state.menu_nr)];
  const a = menu.alternative;
  el('s4AltBild').src = a.bild;
  el('s4AltBild').alt = a.name;
  setText('s4ZuDeinem', fill(s.zu_deinem_gericht, { gericht: state.menu_name }));
  setText('s4AltName', a.name);
  el('s4AltCard').hidden = true;

  // Erinnerungsdatum: Default in 1 Woche (lokal), überschreibbar
  el('s4Datum').value = defaultReminderValue();

  el('s4JaBtn').onclick = () => { el('s4a').hidden = true; el('s4b').hidden = false; window.scrollTo({top:0}); };
  el('s4SkipBtn').onclick = () => { renderSchritt5(); showStep(5); };
  el('s4ErinnerungJaBtn').onclick = downloadReminder;
  el('s4FertigBtn').onclick = () => { renderSchritt5(); showStep(5); };
}

function selectAusloeser(btn, text){
  state.ausloeser = text;
  el('s4Ausloeser').querySelectorAll('.btn-answer').forEach(b => b.setAttribute('aria-pressed', 'false'));
  btn.setAttribute('aria-pressed', 'true');
  updatePlanSatz();
  el('s4AltCard').hidden = false;
}

function updatePlanSatz(){
  const s = DATA.schritt4;
  const handlung = s.handlung[String(state.menu_nr)];
  if(!state.ausloeser || !handlung) return;
  const satz = fill(s.plan_vorlage, { ausloeser: strip(state.ausloeser), handlung: strip(handlung) });
  const n = el('s4PlanSatz');
  n.textContent = satz;
  n.hidden = false;
}

/* ---- Erinnerung als .ics (rein clientseitig, nichts gespeichert) ---- */
function two(x){ return String(x).padStart(2, '0'); }
function defaultReminderValue(){
  const d = new Date(Date.now() + 7*24*60*60*1000);
  d.setHours(18, 0, 0, 0);
  return `${d.getFullYear()}-${two(d.getMonth()+1)}-${two(d.getDate())}T${two(d.getHours())}:${two(d.getMinutes())}`;
}
function icsEsc(s){ return String(s).replace(/[\\;,]/g, m => '\\'+m).replace(/\n/g, '\\n'); }
function icsDate(d){ return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; }
function buildIcs(title, plan, start, minutes){
  const end = new Date(start.getTime() + (minutes||15)*60000);
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//N-Trail//Posten//DE','BEGIN:VEVENT',
    'UID:'+Date.now()+'@n-trail','DTSTAMP:'+icsDate(new Date()),
    'DTSTART:'+icsDate(start),'DTEND:'+icsDate(end),
    'SUMMARY:'+icsEsc(title),'DESCRIPTION:'+icsEsc(plan),'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
}
function downloadReminder(){
  const s = DATA.schritt4;
  const handlung = s.handlung[String(state.menu_nr)];
  const plan = state.ausloeser
    ? fill(s.plan_vorlage, { ausloeser: strip(state.ausloeser), handlung: strip(handlung) })
    : strip(handlung);
  const title = fill(s.ics_titel_vorlage, { handlung: strip(handlung) });
  const val = el('s4Datum').value;
  const start = val ? new Date(val) : new Date(defaultReminderValue());
  const url = URL.createObjectURL(new Blob([buildIcs(title, plan, start)], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'erinnerung.ics'; a.click();
  URL.revokeObjectURL(url);
}

/* ============================================================
   Schritt 5 — Satz zum Mitnehmen
   ============================================================ */
function renderSchritt5(){
  el('s5Kernsatz').innerHTML = DATA.schritt5.kernsatz.map(p => `<p>${p}</p>`).join('');
}

/* ---- gemeinsame Helfer ---- */
function toggleReveal(wrapId, btnId){
  const w = el(wrapId);
  w.hidden = !w.hidden;
}
function prefersMotion(){
  return !window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
