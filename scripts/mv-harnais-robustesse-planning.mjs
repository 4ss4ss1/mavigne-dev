#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais : AUCUNE DONNEE NE FAIT PLANTER LE PLANNING (RELEVE-3)
// ═══════════════════════════════════════════════════════════════════════════
//  POURQUOI IL EXISTE.
//  Le 27/09, le bouton « Releve » de la fiche plantait (« Cannot read properties
//  of undefined (reading 'length') ») sur un mois FIGE, en mode payé, avec un
//  dimanche travaillé hors heures sup : l'instantané de « Figer » garde la
//  majoration sans la liste de ses jours, et _pfNatLib lisait `l.jours.length`.
//  Remonté du terrain. Les 96 contrôles du releve et ceux de la recup étaient
//  VERTS : ils ne jouaient que des données écrites par le code du jour, jamais
//  une donnée enregistrée par une version d'avant.
//
//  CE QU'IL FAIT.
//   A. Le cas du terrain, écrit à la main : il doit produire le releve, et le
//      releve doit dire « Dimanche 13 » (jours retrouvés dans le calcul du mois).
//   B. Des mois tirés AU HASARD (générateur à graine fixe : un rouge se rejoue),
//      avec des saisies réalistes ET abîmées (anciennes formes, champs vides,
//      mois figés sous cinq formes), sur les 12 mois et quatre dates du jour.
//      Chaque surface du Planning est appelée : grille, synthèse, annuel, onglet
//      Équipe, hors contrat, les 4 onglets de la fiche (salarié et équipe
//      collective), la feuille d'un jour, le releve papier.
//      ROUGE si : une exception, OU un « undefined », « NaN », « [object Object] »,
//      « Infinity » dans ce qui s'affiche.
//   C. MEP-1 (§192) : les quatre causes de mise en page trouvées sur un PDF imprimé (tableau qui débordait,
//      style .cl global, colonnes figées, signature orpheline) et le doublon du dimanche ne reviennent pas.
//
//  Usage :
//    node scripts/mv-harnais-robustesse-planning.mjs            # 24 tirages
//    node scripts/mv-harnais-robustesse-planning.mjs --long     # 200 tirages
//    node scripts/mv-harnais-robustesse-planning.mjs --contre   # contre-épreuves
//  Exit 0 si tout passe, 1 sinon. Un CRASH est ROUGE.
//  Jamais déployé (scripts/) -> aucun bump.  ⚠️ CHEMINS : pathToFileURL (§53).
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const ARGS = process.argv.slice(2);
const CONTRE = ARGS.includes('--contre');
const N = ARGS.includes('--long') ? 200 : 24;
const CIBLE = process.env.MV_ROB_CIBLE || path.join(RACINE, 'src', 'planning.js');

// ── Contre-épreuves : chaque défaut est reposé sur une COPIE, jouée dans un
//    processus à part (le module pose ses fonctions sur window : deux copies
//    dans le même processus se marcheraient dessus). Le défaut doit rougir.
if (CONTRE) {
  const src = fs.readFileSync(CIBLE, 'utf8');
  const DEFAUTS = [
    ['l\u2019ancien libellé qui lit l.jours.length (le plantage du 27/09)',
      [["var j=(l&&Array.isArray(l.jours))?l.jours:[];", 'var j=l.jours;']], 'A'],
    ['la majoration figée n\u2019est plus relue dans le calcul du mois',
      [['P.majSeule=_pfMajJours(P.fige.maj,hm.majHs);', 'P.majSeule=(P.fige.maj||[]).slice();']], 'A'],
    ['un plantage inédit dans l\u2019onglet Congés (hors du cas connu)',
      [['var cpJ=P.jours.filter(function(x){return x.payeType===\'cp\';});\n', 'var cpJ=P.joursX.filter(function(x){return x.payeType===\'cp\';});\n']], 'B'],
    ['la page 2 redit le dimanche que la page 1 porte déjà (doublon MEP-1)',
      [["var majTxt=P.payable?'':(P.majSeule||[]).map(", "var majTxt=(P.majSeule||[]).map("]], 'A'],
    ['le style .cl redevient global (blocs Contrats et Congés défaits)',
      [["'.cpt{padding:2px 10px 5px}.cpt .cl{display:grid", "'.cpt{padding:2px 10px 5px}.cl{display:grid"]], 'A'],
    ['la page 2 revient en deux colonnes figées',
      [["'.p2{column-count:2;column-gap:16px}", "'.p2{display:grid;grid-template-columns:1fr 1fr;gap:16px}"]], 'A'],
    ['un mois figé recalcule ce qui est parti au lieu de le montrer (DIM-2)',
      [["var BK=FGc?(Array.isArray(FGc.bank)?FGc.bank:[]):(r.payesBank||[]);", "var BK=(r.payesBank||[]);FGc=null;"]], 'A'],
    ['un « NaN » dans le releve papier',
      [['<title>Relev\\u00e9 d\\u2019heures \\u2014 \'+_escHtml(nom)', '<title>Relev\\u00e9 d\\u2019heures \'+(0/0)+\' \\u2014 \'+_escHtml(nom)']], 'B'],
  ];
  let ok = 0, ko = 0;
  console.log('\nContre-épreuves — chaque défaut reposé doit rougir');
  for (const [nom, reps, sec] of DEFAUTS) {
    let s = src, pose = true;
    for (const [a, b] of reps) { if (s.split(a).length !== 2) { pose = false; break; } s = s.replace(a, b); }
    if (!pose) { ko++; console.log('   ROUGE  défaut non posé (ancre introuvable ou multiple) : ' + nom); continue; }
    const f = path.join(os.tmpdir(), 'mv-rob-contre-' + process.pid + '-' + ok + ko + '.js');
    fs.writeFileSync(f, s);
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, MV_ROB_CIBLE: f, MV_ROB_SECTION: sec }, encoding: 'utf8' });
    fs.unlinkSync(f);
    if (r.status !== 0 && /ROUGE/.test(r.stdout || '')) { ok++; console.log('   vert   rougit : ' + nom); }
    else { ko++; console.log('   ROUGE  RESTE VERT : ' + nom + '\n' + String(r.stdout || '').slice(-600) + String(r.stderr || '').slice(-600)); }
  }
  console.log('\n──────────────────────────────\n  ' + ok + ' vert · ' + ko + ' rouge');
  process.exit(ko ? 1 : 0);
}
const SECTION = process.env.MV_ROB_SECTION || 'AB';

// ── Horloge réglable ────────────────────────────────────────────────────────
const _D = Date; let AUJ = [2026, 8, 27];
class DateFixe extends _D {
  constructor(...a) { if (a.length) super(...a); else super(AUJ[0], AUJ[1], AUJ[2], 12, 0, 0); }
  static now() { return new _D(AUJ[0], AUJ[1], AUJ[2], 12, 0, 0).getTime(); }
}
globalThis.Date = DateFixe;

// ── DOM minimal : getElementById rend TOUJOURS un élément (les rendus écrivent
//    dans leurs conteneurs ; un null les ferait sortir avant le code à tester).
function El() { return { id: '', innerHTML: '', textContent: '', value: '', style: {}, dataset: {}, children: [],
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  setAttribute() {}, getAttribute() { return null; }, appendChild(c) { return c; }, insertBefore(c) { return c; },
  removeChild() {}, addEventListener() {}, remove() {}, querySelector() { return null; }, querySelectorAll() { return []; },
  getBoundingClientRect() { return { width: 700, height: 300, top: 0, left: 0 }; }, focus() {}, click() {}, closest() { return null; } }; }
const els = {};
const doc = { body: El(), head: El(), documentElement: El(), getElementById(id) { return els[id] || (els[id] = El()); },
  querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return El(); }, addEventListener() {}, cookie: '' };
const mem = {};
const win = { document: doc, location: { hostname: 'test', href: 'https://test/', origin: 'https://test', search: '', pathname: '/' },
  localStorage: { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; }, clear() {}, key() { return null; }, length: 0 },
  navigator: { userAgent: 'node', onLine: true, language: 'fr-FR' }, addEventListener() {},
  matchMedia() { return { matches: false, addEventListener() {}, addListener() {} }; }, requestAnimationFrame() { return 0; },
  getComputedStyle() { return { getPropertyValue() { return ''; } }; }, innerWidth: 900, innerHeight: 800,
  print() {}, alert() {}, confirm() { return true; }, URL: { createObjectURL() { return 'blob:x'; }, revokeObjectURL() {} }, Blob: function (p) { this.parts = p; } };
globalThis.MutationObserver = class { observe() {} disconnect() {} }; win.MutationObserver = globalThis.MutationObserver;
win.window = win; win.self = win;
globalThis.window = win; globalThis.document = doc; globalThis.location = win.location;
globalThis.localStorage = win.localStorage; globalThis.sessionStorage = win.localStorage;
globalThis.requestAnimationFrame = win.requestAnimationFrame; globalThis.getComputedStyle = win.getComputedStyle;
globalThis.matchMedia = win.matchMedia; globalThis.Blob = win.Blob; globalThis.alert = win.alert;
try { Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true }); } catch { /* lecture seule */ }
win.fbSaveToast = () => {}; win.showToast = () => {};
win._dataReady = true; win._mvSk = () => '';                      // app.js les pose au démarrage
win.isAdmin = () => true; win.currentUser = { nom: 'Nico', roles: ['admin'] };
// Les erreurs AVALÉES par un try/catch du module et journalisées comptent aussi.
const JOURNAL = [];
const pages = [];
win.open = () => { const p = { html: '' }; pages.push(p); return { document: { write(h) { p.html += h; }, close() {} }, focus() {}, print() {} }; };
win._mvISO = d => { const x = new _D(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
globalThis._mvISO = win._mvISO;
window.PLANNING_TEMPLATES = {}; window.PLANNING_ENTRIES = {}; window.PLANNING_HSUP = {};
window.PLANNING_ACOMPTES = {}; window.CONFIG = {}; window.MEMBRES = [];

const U = await import(pathToFileURL(path.join(RACINE, 'src', 'utils.js')).href);
for (const [k, v] of Object.entries(U)) if (typeof v === 'function') { if (!(k in win)) win[k] = v; if (!(k in globalThis)) globalThis[k] = v; }
// Le sprite d'icônes n'existe pas dans Node : une icône rendue vide, sans bruit.
win._mvIcon = () => '<svg></svg>'; globalThis._mvIcon = win._mvIcon;
win.logError = o => { if (o && o.level !== 'info') JOURNAL.push(o); };

const EXPORTS = ['renderPlanning', '_pl2Board', '_pl2Synth', '_pl2Annual', '_pl2RenderEquipe', '_pl2HorsContrat',
  'openPlanDayModal', 'openPlanFiche', 'planFicheTab', 'planExportPDF', '_planPaieMois', '_planFigeInstantane', '_pfNatLib'];
{
  const utils = pathToFileURL(path.join(RACINE, 'src', 'utils.js')).href;
  const code = fs.readFileSync(CIBLE, 'utf8').replace("from './utils.js'", "from '" + utils + "'")
    + '\n;globalThis.__ROB={' + EXPORTS.map(n => n + ':(typeof ' + n + "==='function'?" + n + ':undefined)').join(',')
    + ',_mois:function(m){planMonth=m;},_tab:function(t){planTab=t;}};\n';
  const f = path.join(os.tmpdir(), 'mv-rob-' + process.pid + '.mjs');
  fs.writeFileSync(f, code);
  try { await import(pathToFileURL(f).href); } finally { fs.unlinkSync(f); }
}
const R = globalThis.__ROB;

let ok = 0, ko = 0;
const T = (nom, c, d) => { if (c) ok++; else { ko++; console.log('   ROUGE  ' + nom + (d ? '  → ' + d : '')); } };
for (const n of EXPORTS) T('planning.js expose ' + n, typeof R[n] === 'function');
const vider = o => { for (const k of Object.keys(o)) delete o[k]; return o; };
const SALE = ['undefined', 'NaN', '[object Object]', 'Infinity'];
const sale = h => typeof h === 'string' ? SALE.filter(m => h.indexOf(m) !== -1).map(m => m + ' : …' + h.slice(Math.max(0, h.indexOf(m) - 50), h.indexOf(m) + 15).replace(/\s+/g, ' ') + '…') : [];
const releve = nom => { pages.length = 0; R.planExportPDF(nom); return pages.length ? pages[pages.length - 1].html : ''; };

function modeleFixe(an) {
  const t = { _timings: {} };
  for (let m = 0; m < 12; m++) { t[m] = {}; t._timings[m] = { d: '08:00' }; const nd = new _D(an, m + 1, 0).getDate();
    for (let d = 1; d <= nd; d++) { const w = new _D(an, m, d).getDay(); t[m][d] = (w >= 1 && w <= 5) ? 7 : 0; } }
  for (const [m, d] of [[0, 1], [3, 6], [4, 1], [4, 8], [4, 14], [4, 25], [6, 14], [10, 11], [11, 25]]) t[m][d] = 0;
  return t;
}

// ═══ A. LE CAS DU TERRAIN ═══════════════════════════════════════════════════
if (SECTION.includes('A')) {
  console.log('\nA. Mois figé, mode payé, dimanche travaillé hors heures sup');
  const mbr = { nom: 'Nico', statut: 'Actif', type_contrat: 'CDI', planning_id: 'standard' };
  const monter = () => {
    // ★ DIM-2 (§193) : un dimanche NON prévu compte désormais en entier (heures sup). La majoration SEULE — le cas qui plantait —
    //   ne naît plus que d'un dimanche PRÉVU au planning : le 13 est donc prévu (7h) et travaillé.
    const tplA = modeleFixe(2026); tplA[8][13] = 7;
    Object.assign(vider(window.PLANNING_TEMPLATES), { 2026: { standard: tplA } });
    // Le 9 : 2h d'absence personnelle (la majoration, 3h30, les couvre et il en reste à payer) ; le 13 (dimanche prévu) : 7 h.
    Object.assign(vider(window.PLANNING_ENTRIES), { Nico: { 2026: { 8: { 9: { absent: true, motif: 'perso', abs_de: '13:00', abs_a: '15:00', motif_h: 2 }, 13: { timing: { debut: '07:00', fin: '14:00', continu: true } } } } } });
    Object.assign(vider(window.PLANNING_HSUP), { Nico: {} }); vider(window.PLANNING_ACOMPTES);
    Object.assign(vider(window.CONFIG), { hsup_mode: 'paye', coupure_heure: '12:00' });
    window.MEMBRES.length = 0; window.MEMBRES.push(mbr);
    AUJ = [2026, 8, 27]; R._mois(8);
  };
  monter();
  const P0 = R._planPaieMois(mbr, 8);
  T('A1 · le scénario porte bien une majoration du dimanche hors heures sup', (P0.majSeule || []).some(x => x.nat === 'dim' && x.h > 0.0001), JSON.stringify(P0.majSeule));
  const FORMES = [
    ['instantané du jour (_planFigeInstantane)', () => R._planFigeInstantane(mbr, 8)],
    ['instantané sans jours ni report (forme du 25/09)', () => ({ le: '2026-09-25', payes: [], retenue: 0, maj: [{ taux: 50, nat: 'dim', h: 7 }] })],
    ['instantané réduit à sa date', () => ({ le: '2026-09-25' })],
  ];
  FORMES.forEach(([lib, fz], i) => {
    monter();
    window.PLANNING_HSUP.Nico['2026-09'] = { fige: fz() };
    let h = '', err = null;
    try { h = releve('Nico'); } catch (e) { err = e; }
    T('A' + (2 + 3 * i) + ' · ' + lib + ' : le relevé se produit', !err && h.length > 1000, err ? err.message : 'relevé vide');
    T('A' + (3 + 3 * i) + ' · ' + lib + ' : rien de sale dans le relevé', !err && sale(h).length === 0, sale(h).join(' | '));
    // ★ MEP-1 (§192) : en mode payé, le dimanche se lit en page 1 (« Majorations à payer ») et sur sa ligne du jour ; la page 2
    //   ne le redit plus. Les jours retrouvés par _pfMajJours se vérifient donc sur le calcul lui-même, pas sur une phrase.
    if (i < 2) {
      const js = ((R._planPaieMois(mbr, 8).majSeule || []).filter(x => x.nat === 'dim')[0] || {}).jours;
      // ★ DIM-2 : « Pour la compta » la range dans la case 50 %, « majoration seule (dimanche 13) » — les jours retrouvés servent là.
      T('A' + (4 + 3 * i) + ' · ' + lib + ' : les jours de la majoration figée sont retrouvés (13), « Pour la compta » la nomme dans sa case, la page 2 ne la répète pas',
        Array.isArray(js) && js.indexOf(13) !== -1 && h.indexOf('majoration seule (dimanche 13)') !== -1 && h.indexOf('travaill\u00e9es hors heures sup') === -1,
        'jours=' + JSON.stringify(js) + ' · compta=' + (h.indexOf('majoration seule (dimanche 13)') !== -1) + ' · répété=' + (h.indexOf('travaill\u00e9es hors heures sup') !== -1));
    }
    else T('A' + (4 + 3 * i) + ' · ' + lib + ' : la fiche s\u2019ouvre sur ses 4 onglets', ['resume', 'jours', 'hsup', 'cp'].every(t => { try { R.openPlanFiche('Nico'); R.planFicheTab(t); return sale(els['pf-body'].innerHTML).length === 0; } catch { return false; } }));
  });
  // Défense en profondeur : le libellé lui-même ne doit jamais lever, même si une majoration lui arrive sans ses jours
  //   par un chemin que la relecture de _planPaieMois ne couvre pas (demain : un nouveau lecteur de l'instantané).
  let lb = null; try { lb = [R._pfNatLib({ taux: 50, nat: 'dim', h: 7 }), R._pfNatLib({ taux: 100, nat: 'fer', h: 7 }), R._pfNatLib({ nat: 'dim', jours: null })]; } catch (e) { lb = e.message; }
  // ★ DIM-2 — un mois figé montre ce qui est PARTI : un instantané d'avant ce lot n'a que le nombre d'heures prises au compteur
  //   (`spill`), sans taux — le cadre le dit, daté, au lieu de recalculer ; et le contrôle compte ces heures dans le total.
  monter(); window.PLANNING_HSUP.Nico['2026-09'] = { demande: true, paye: 5, fige: { le: '2026-09-25', payes: [{ taux: 25, nat: 'hs', brut: 2 }], retenue: 0, spill: 3, maj: [], majRep: [] } };
  const hf = releve('Nico');
  T('A12 · mois figé d’avant ce lot : « 3h prises sur le compteur à l’envoi du 25/09/2026 », et le total envoyé (5h)',
    hf.indexOf('<b>3h</b> <small>prises sur le compteur \u00e0 l\u2019envoi du 25/09/2026') !== -1 && hf.indexOf('= <b>5h</b>') !== -1);

  // ═══ C. LA MISE EN PAGE DU PAPIER (MEP-1, §192) — ce qu'un contrôle sans navigateur PEUT tenir ═══
  //   Le rendu lui-même se regarde (impression réelle : 3 pages → 2 le 27/09). Ici, les quatre causes trouvées ce jour-là
  //   ne doivent pas revenir : chacune a été vue sur un PDF, aucune n'aurait rougi ailleurs.
  monter(); window.PLANNING_HSUP.Nico['2026-09'] = { fige: R._planFigeInstantane(mbr, 8) };
  const hc = releve('Nico'), css = (hc.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
  T('C1 · le style des lignes « Pour la compta » (.cl) est borné au cadre : il défaisait les blocs Contrats et Congés', !/(^|\})\.cl\{/.test(css) && css.indexOf('.cpt .cl{') !== -1);
  T('C2 · la page 2 est UN flux en deux colonnes qui s\u2019équilibre, pas deux colonnes figées', css.indexOf('.p2{column-count:2') !== -1 && hc.indexOf('<div class="p2"><div class="bk">') !== -1);
  T('C3 · « Fait le », les signatures et la mention restent d\u2019un seul tenant', css.indexOf('.fin{break-inside:avoid') !== -1 && hc.indexOf('<div class="fin"><p class="lieu">') !== -1);
  T('C4 · le libellé d\u2019une absence peut passer à la ligne (sinon « Observations » s\u2019écrase et le Total sort de la page 1)', css.indexOf('.j td.cab:not(.n){white-space:normal') !== -1);
  T('C5 · le détail de l\u2019année ne redit plus « dont … dim./férié » (doublon du tableau des dimanches)', hc.indexOf('dim./f\u00e9ri\u00e9</span>') === -1);
  T('A11 · une majoration sans ses jours se nomme « Dimanche » / « Jour férié », sans planter', Array.isArray(lb) && lb[0] === 'Dimanche' && lb[1] === 'Jour f\u00e9ri\u00e9' && lb[2] === 'Dimanche', JSON.stringify(lb));
}

// ═══ B. DES MOIS TIRÉS AU HASARD ════════════════════════════════════════════
if (SECTION.includes('B')) {
  console.log('\nB. ' + N + ' domaines tirés au hasard × 12 mois × toutes les surfaces du Planning');
  let graine = 1; const rnd = () => { graine = (graine * 1103515245 + 12345) & 0x7fffffff; return graine / 0x7fffffff; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const hh = (h, demi) => String(h).padStart(2, '0') + ':' + (demi ? '30' : '00');
  const MOTIFS = ['perso', 'injustifie', 'domaine', 'arret', 'formation', 'famille', 'sansolde', 'retard', 'autre', undefined, 'inconnu'];
  function jour() {
    const r = rnd();
    if (r < 0.45) return null;
    if (r < 0.65) return { timing: { debut: hh(6 + Math.floor(rnd() * 3), rnd() < .5), fin: hh(12 + Math.floor(rnd() * 8), rnd() < .5), continu: rnd() < .2 }, comment: rnd() < .1 ? 'note <b>x</b> & « y »' : undefined };
    if (r < 0.72) { const e = { absent: true, motif: pick(MOTIFS) }; if (rnd() < 0.4) { e.abs_de = '13:00'; e.abs_a = pick(['15:00', '16:00', '14:30']); e.motif_h = pick([1, 2, 3, '2', -1, 'x']); } return e; }
    if (r < 0.77) return { type: 'cp', heures: rnd() < .3 ? pick([3.5, 7, undefined]) : undefined };
    if (r < 0.81) return { type: 'recup' };
    if (r < 0.85) return { modifier: pick([1, -1, 2, 0.5]) };
    if (r < 0.88) return { canicule: true, timing: { debut: '06:00', fin: '13:00', continu: true }, comment: 'Chaleur' };
    if (r < 0.90) return {};
    if (r < 0.92) return { timing: { debut: '', fin: '', continu: false } };
    if (r < 0.94) return { timing: null };
    return { timing: { debut: hh(7), fin: hh(18) } };
  }
  // Les formes d'instantané qu'une base peut contenir : celle du jour, puis des formes d'avant.
  const FIGES = [
    v => v, v => v, v => v,
    () => ({ le: '2026-09-25', payes: [{ taux: 25, nat: 'hs', brut: 5.5 }], retenue: 0 }),
    () => ({ le: '2026-09-25' }),
    () => ({ le: '2026-09-25', payes: null, retenue: null, maj: null, majRep: null }),
    () => ({ le: '2026-09-25', payes: [{ taux: 25, brut: 2 }], maj: [{ taux: 50, nat: 'dim', h: 5.5 }, { taux: 100, nat: 'fer', h: 7 }] }),
    () => ({}),
  ];
  const ECHECS = new Map();
  const note = (quoi, s, m, msg) => { const k = quoi + ' — ' + msg; if (!ECHECS.has(k)) ECHECS.set(k, { s, m, n: 0 }); ECHECS.get(k).n++; };
  const essai = (quoi, s, m, fn) => {
    const j0 = JOURNAL.length;
    try { const h = fn(); for (const x of sale(h)) note(quoi, s, m, x); }
    catch (e) { note(quoi, s, m, e.message + ' @ ' + String((e.stack || '').split('\n')[1] || '').trim().replace(/.*\//, '')); }
    for (const o of JOURNAL.slice(j0)) note(quoi, s, m, 'erreur journalisée : ' + String(o.msg || o.message || o.cat || '').slice(0, 120));
  };
  let appels = 0;
  for (let s = 1; s <= N; s++) {
    graine = s;
    const tpl = { _timings: {} };
    for (let m = 0; m < 12; m++) { tpl[m] = {}; tpl._timings[m] = { d: pick(['08:00', '07:30', '07:00']) }; const nd = new _D(2026, m + 1, 0).getDate();
      for (let d = 1; d <= nd; d++) { const w = new _D(2026, m, d).getDay(); tpl[m][d] = (w >= 1 && w <= 5) ? pick([7, 7, 8, 7.5]) : (w === 6 && rnd() < 0.1 ? 4 : 0); } }
    for (const [m, d] of [[0, 1], [3, 6], [4, 1], [4, 8], [4, 14], [4, 25], [6, 14], [10, 11], [11, 25]]) tpl[m][d] = 0;
    Object.assign(vider(window.PLANNING_TEMPLATES), { 2026: { standard: tpl } });
    const typ = pick(['CDI', 'CDI', 'CDD', 'Saisonnier', 'Apprenti']);
    const mbr = { nom: 'Nico', statut: rnd() < .1 ? 'Inactif' : 'Actif', type_contrat: typ, planning_id: rnd() < .05 ? 'inexistant' : 'standard' };
    if (typ !== 'CDI' && rnd() < .7) { mbr.debut_contrat = '2026-0' + (1 + Math.floor(rnd() * 8)) + '-1' + Math.floor(rnd() * 9); if (rnd() < .6) mbr.fin_contrat = '2026-1' + Math.floor(rnd() * 3) + '-15'; }
    if (rnd() < .2) mbr.contrats = [{ debut: '2026-01-05', fin: '2026-04-30', type: 'CDD' }];
    if (rnd() < .3) mbr.cp_initial_j = pick([0, 12, 25, 7.5]);
    const ent = {};
    for (let m = 0; m < 12; m++) { ent[m] = {}; const nd = new _D(2026, m + 1, 0).getDate(); for (let d = 1; d <= nd; d++) { const e = jour(); if (e) ent[m][d] = e; } }
    Object.assign(vider(window.PLANNING_ENTRIES), { Nico: { 2026: ent },
      'Équipe V': { 2026: { 8: { 10: { absent: true, motif: 'domaine' }, 11: { timing: { debut: '07:00', fin: '18:00' } } } } } });
    const hs = {};
    if (rnd() < .4) hs['2026-dep'] = { solde: pick([10, 30, -5, 0]), date: '2026-01-01' };
    for (let m = 0; m < 12; m++) if (rnd() < .35) { const k = '2026-' + String(m + 1).padStart(2, '0'); hs[k] = {};
      if (rnd() < .6) hs[k].demande = true; if (rnd() < .6) hs[k].paye = pick([0, 3, 8, 30]);
      if (rnd() < .4) hs[k].paye_bank = pick([0, 2, 12]); if (rnd() < .1) hs[k].sup_override = pick([0, 5, 20]); }
    Object.assign(vider(window.PLANNING_HSUP), { Nico: hs });
    const ac = {};
    if (rnd() < .3) ac['2026-09'] = [{ date: '2026-09-10', montant: 200, note: 'avance' }];
    Object.assign(vider(window.PLANNING_ACOMPTES), { Nico: ac });
    Object.assign(vider(window.CONFIG), { dimfer_hs: pick(['toujours', undefined]), hsup_mode: pick(['paye', 'recup', 'cloture', undefined]), coupure_heure: pick(['12:00', '', undefined]), cp_mode: pick(['ouvrables', 'ouvres']) });
    window.MEMBRES.length = 0;
    window.MEMBRES.push(mbr,
      { nom: 'Équipe V', statut: 'Actif', type_contrat: 'Saisonnier', planning_id: 'standard', collectif: true, effectif: pick([5, 30]), debut_contrat: '2026-09-08', fin_contrat: '2026-09-25' },
      { nom: "Jean d'Arc", statut: 'Actif', type_contrat: 'CDD', planning_id: 'standard', debut_contrat: '2026-03-01', fin_contrat: '2026-10-31' });
    AUJ = pick([[2026, 8, 27], [2026, 9, 5], [2026, 11, 31], [2026, 8, 1]]);
    for (let m = 8; m < 12; m++) if (rnd() < .35) {
      const k = '2026-' + String(m + 1).padStart(2, '0'); hs[k] = hs[k] || {}; R._mois(m);
      const fz = pick(FIGES); essai('_planFigeInstantane', s, m, () => { hs[k].fige = fz(R._planFigeInstantane(mbr, m)); });
    }
    for (let m = 0; m < 12; m++) {
      R._mois(m);
      const surf = [
        ['grille', () => { R.renderPlanning(); return els['plan-body'] && els['plan-body'].innerHTML; }],
        ['tableau', () => R._pl2Board()], ['synthèse', () => R._pl2Synth()], ['annuel', () => R._pl2Annual()],
        ['onglet Équipe', () => R._pl2RenderEquipe()], ['hors contrat', () => R._pl2HorsContrat()],
        ['relevé', () => releve('Nico')], ['relevé équipe collective', () => releve('Équipe V')], ['relevé CDD', () => releve("Jean d'Arc")],
      ];
      for (const nom of ['Nico', 'Équipe V']) for (const t of ['resume', 'jours', 'hsup', 'cp'])
        surf.push(['fiche ' + (nom === 'Nico' ? '' : 'collective ') + t, () => { R.openPlanFiche(nom); R.planFicheTab(t); return els['pf-body'].innerHTML; }]);
      for (const d of [1, 9, 13, 20, 28]) surf.push(['feuille du ' + d, () => { R.openPlanDayModal('Nico', d); }]);
      // VUE-EQUIPE-1 (§251) : l'équipe du mois vue par un salarié, sur les mêmes données abîmées (rendue EN DERNIER : elle se cale sur le mois en cours).
      surf.push(['vue équipe (salarié)', () => { const u = win.currentUser; win.currentUser = { nom: 'Nico', roles: ['ouvrier'] }; R._tab('eqmois');
        try { R.renderPlanning(); return els['plan-body'] && els['plan-body'].innerHTML; } finally { win.currentUser = u; R._tab('mois'); R._mois(m); } }]);
      for (const [quoi, fn] of surf) { appels++; essai(quoi, s, m, fn); }
    }
  }
  T('B1 · ' + appels + ' appels : aucun plantage, aucune erreur journalisée, rien de sale à l\u2019écran ni sur papier', ECHECS.size === 0,
    [...ECHECS].slice(0, 12).map(([k, v]) => '\n        [' + v.n + '×] graine ' + v.s + ', ' + ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'][v.m] + ' — ' + k).join(''));
}

console.log('\n──────────────────────────────\n  ' + ok + ' vert · ' + ko + ' rouge');
process.exit(ko ? 1 : 0);
