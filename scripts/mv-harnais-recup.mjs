#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais RECUP-1 : heures manquees, heures sup par taux, recup majoree
// ═══════════════════════════════════════════════════════════════════════════
//  Regle validee par Nico sur maquette (v3, 16/09/2026) :
//    · une journee ecourtee, quel qu'en soit le motif, se retire D'ABORD du compteur,
//      au TAUX NORMAL (1 h manquee = 1 h de recup en moins) ;
//    · les heures sup gardent leur taux : 25 % jusqu'a la 43e heure de la semaine,
//      50 % au-dela — une heure a 25 % donne 1 h 15 de recup, a 50 % 1 h 30 ;
//    · ce que le compteur ne couvre pas : retenu sur la paie (motif du salarie) ou
//      a compenser (le domaine a arrete la journee) ;
//    · arret, conge sans solde, formation, evenement familial : sans effet ;
//    · avant septembre 2026 : la regle historique, a l'identique.
//
//  ★ HARNAIS INTEGRE (§6b, forme 3). Le VRAI planning.js est charge dans Node, sans
//    une ligne d'export de plus en production : on en fait une copie a laquelle on
//    ajoute, a la fin du module, un objet qui rend ses fonctions internes joignables.
//    Les contre-epreuves reinjectent chaque defaut dans une AUTRE copie.
//  ★ L'HORLOGE EST FIGEE AU 16/09/2026 : la fenetre de la regle est une date, un
//    harnais qui lirait l'annee courante changerait de verdict le 1er janvier.
//
//  ★ RECUP-2 (16/09/2026) — POUR LA COMPTA. « 1h sup en recup = 1h15, en paie = 1h15, mais pour
//    la paie il faut laisser 1h sup, car la compta integre en 1h + 25 % » (Nico). Le compteur
//    compte en temps de recup DANS TOUS LES MODES ; chaque tranche garde son taux ; ce qui se
//    paie se declare en heure BRUTE. Une heure sup un dimanche va au taux le plus fort, une fois.
//
//  ★★★ SEM-1 (17/09/2026) — LES HEURES SUP SE COMPTENT A LA SEMAINE (Nico). Les heures en plus rattrapent
//    d'abord les heures manquees de la MEME semaine ; huit heures sup a 25 %, les suivantes a 50 % (le rang,
//    plus la 44e heure travaillee) ; une semaine appartient au mois ou elle finit ; le 31 aout 2026, deja
//    compte par aout, ne l'est pas deux fois. Section T. ⚠️ Les sections B a S n'ont PAS bouge : leurs
//    scenarios posent les heures en plus et les heures manquees dans des semaines differentes, sur un planning
//    de 35 h — la ou l'ancienne et la nouvelle regle disent la meme chose. Seule la section I (semaine a
//    cheval) disait l'ancienne regle : elle dit la nouvelle.
//
//  ★★★ NET-1 (19/09/2026) — UNE RETENUE OU DES HEURES SUP A PAYER, JAMAIS LES DEUX (Nico). Les absences passent
//    avant un paiement : le salarie (injustifiee, personnelle, retard — et l'absence sans motif, injustifiee depuis
//    septembre) se reprend sur la recup et les heures sup du mois, puis se retient ; le domaine se reprend de meme,
//    puis va aux heures a rattraper, jamais retenu ; le salarie passe d'abord. Le releve compte tout le mois : plus
//    de provisoire. Sections N, R, U et V relues ; section X ajoutee.
//  ★★ FIGE-1 (19/09/2026) — FIGER A L'ENVOI (Nico). Un mois fige garde son paiement et sa retenue ; ce qui change
//    ensuite passe au mois suivant : a retenir (repris d'abord sur la recup et les heures sup), a rendre, ou la
//    majoration a payer. Section Y.
//
//  Usage :  node scripts/mv-harnais-recup.mjs [--contre]
//  Exit 0 si tout passe, 1 sinon. Un CRASH est ROUGE.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const CONTRE = process.argv.includes('--contre');

// ── Horloge figee ───────────────────────────────────────────────────────────
const _D = Date;
// ★ SEM-2 : l'horloge reste figee au 16/09/2026, mais une section peut la deplacer (`horloge(2026, 9, 1)`) puis la
//   remettre : le releve v3 est PROVISOIRE tant que le mois n'est pas fini, et definitif apres.
let FIGE = [2026, 8, 16];
const horloge = (...a) => { FIGE = a.length ? a : [2026, 8, 16]; };
class DateFigee extends _D {
  constructor(...a) { if (a.length) super(...a); else super(FIGE[0], FIGE[1], FIGE[2], 12, 0, 0); }
  static now() { return new _D(FIGE[0], FIGE[1], FIGE[2], 12, 0, 0).getTime(); }
}
globalThis.Date = DateFigee;

// ── DOM minimal ─────────────────────────────────────────────────────────────
function El() { return { id: '', innerHTML: '', textContent: '', value: '', style: {}, dataset: {}, children: [],
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  setAttribute() {}, getAttribute() { return null; }, appendChild(c) { this.children.push(c); return c; },
  insertBefore(c) { return c; }, removeChild() {}, addEventListener() {}, remove() {},
  querySelector() { return null; }, querySelectorAll() { return []; },
  getBoundingClientRect() { return { width: 700, height: 300, top: 0, left: 0 }; },
  focus() {}, click() {}, closest() { return null; } }; }
const doc = { body: El(), head: El(), documentElement: El(), getElementById() { return null; },
  querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return El(); },
  addEventListener() {}, cookie: '' };
const mem = {};
const win = { document: doc, location: { hostname: 'test', href: 'https://test/', origin: 'https://test', search: '', pathname: '/' },
  localStorage: { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); },
    removeItem: k => { delete mem[k]; }, clear() {}, key() { return null; }, length: 0 },
  navigator: { userAgent: 'node', onLine: true, language: 'fr-FR' },
  addEventListener() {}, matchMedia() { return { matches: false, addEventListener() {}, addListener() {} }; },
  requestAnimationFrame(f) { return setTimeout(f, 0); },
  getComputedStyle() { return { getPropertyValue() { return ''; } }; },
  innerWidth: 900, innerHeight: 800, print() {}, alert() {}, confirm() { return true; }, open() { return null; },
  URL: { createObjectURL() { return 'blob:x'; }, revokeObjectURL() {} }, Blob: function (p) { this.parts = p; } };
win.window = win; win.self = win;
globalThis.window = win; globalThis.document = doc; globalThis.location = win.location;
globalThis.localStorage = win.localStorage; globalThis.sessionStorage = win.localStorage;
globalThis.requestAnimationFrame = win.requestAnimationFrame;
globalThis.getComputedStyle = win.getComputedStyle; globalThis.matchMedia = win.matchMedia;
globalThis.Blob = win.Blob; globalThis.alert = win.alert;
try { Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true }); } catch { /* lecture seule */ }
win.fbSaveToast = () => {}; win.showToast = () => {};
const pages = [];
win.open = () => { const p = { html: '' }; pages.push(p); return { document: { write(h) { p.html += h; }, close() {} }, focus() {}, print() {} }; };
// ⚠️ SUR L'OBJET GLOBAL, PAS SEULEMENT SUR window. planning.js lit _mvISO comme un nom libre
//    (_pl2YearTabs, au chargement) : dans Node, un nom libre se cherche sur globalThis, et `win`
//    n'est pas globalThis. Premiere version : l'erreur etait avalee et journalisee a CHAQUE
//    chargement — quatorze lignes rouges « ReferenceError » dans le terminal de Nico, sur un
//    harnais entierement vert. Un bruit qui ressemble a une panne finit par cacher une panne.
win._mvISO = d => { const x = new _D(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
globalThis._mvISO = win._mvISO;

// ── Le domaine de test : 7 h du lundi au vendredi, 08:00 -> 16:00, coupure d'une heure ──
function modele(an) {
  const t = {};
  for (let m = 0; m < 12; m++) { t[m] = {}; const nd = new _D(an, m + 1, 0).getDate();
    for (let d = 1; d <= nd; d++) { const w = new _D(an, m, d).getDay(); t[m][d] = (w >= 1 && w <= 5) ? 7 : 0; } }
  // ⚠️ Les feries 2026 sont CHOMES au modele. Sinon chaque ferie de semaine porte 7 h « faites »
  //    et la majoration de 100 % (§73) les verse au compteur : 49 h de janvier a aout, que ce
  //    harnais aurait mesurees en croyant mesurer septembre.
  for (const [m, d] of [[0, 1], [3, 6], [4, 1], [4, 8], [4, 14], [4, 25], [6, 14], [10, 11], [11, 25]]) t[m][d] = 0;
  return t;
}
const EXPORTS = ['_pfRestLignes', '_planFmt', '_pfPlanNom', '_pfPrevT', '_planSemainesDuMois', '_pfAnnee', '_planPayeMaxTotal', '_planPayeMaxCouvert', '_planPayeEcrire', '_planDepartKey', '_pfRestants', '_planPaieMois', '_planPayeMaxCouvert', '_planSemEffectif', '_pfCadre', '_pfDemande', '_pfOuVont', '_pfJours', '_pfCompteur', '_pfConges', '_pfResume', '_planValeurPourBrut', '_planComptaLignes', '_planComptaTable', '_planSeauxTxt', '_planSeauNom', '_planJourEcart', '_planHsupMois', '_planHsupTiers', '_planCompteur', '_planBank',
  '_planYearBalance', '_planSupMonth', '_planSupCalc', '_planSummary', '_planDuesMonth', '_planMajBank', '_planHsupPaye',
  '_planHsupPayeBank', '_planRecupH', '_planDepartSolde', '_planAbsPartH', '_planAbsPartiel', '_planDayH', '_planWorkH',
  '_planDayStatus', '_pl2Cell', '_planRecupActive', '_planApplyAbsPart', '_planApplyHeures', '_planSuspH',
  '_planAbsEffet', '_planAbsDef', '_planAbsMotifAt', '_planFigeInstantane', '_planHsupFige', '_planDefTiming', '_planRetardBornes', '_planTimingH',
  '_planRecupCartes', '_planHsupCard', '_planHsupTable', '_planMajAuCompteur', '_planRuban', '_planVerdict', '_planAbsMotifsHtml', '_planSheetAbsSection', '_planAbsConstruit'];

window.PLANNING_TEMPLATES = {}; window.PLANNING_ENTRIES = {}; window.PLANNING_HSUP = {};
window.PLANNING_ACOMPTES = {}; window.CONFIG = {}; window.MEMBRES = [];
// Les primitives d'affichage que l'application pose sur window au demarrage (utils.js) :
// planning.js les lit comme des noms libres, donc sur l'objet global.
const _U = await import(pathToFileURL(path.join(RACINE, 'src', 'utils.js')).href);
for (const n of ['_mvIcon', '_escHtml', '_escAttr']) if (typeof _U[n] === 'function') { globalThis[n] = _U[n]; win[n] = _U[n]; }
let _n = 0;
async function charger(src) {
  const utils = pathToFileURL(path.join(RACINE, 'src', 'utils.js')).href;
  const code = src.replace("from './utils.js'", "from '" + utils + "'")
    + '\n;globalThis.__RECUP={' + EXPORTS.map(n => n + ':(typeof ' + n + "==='function'?" + n + ':undefined)').join(',')
    + ',_mois:function(m){planMonth=m;},_an:function(){return planYear;}};\n';
  const f = path.join(os.tmpdir(), 'mv-recup-' + process.pid + '-' + (_n++) + '.mjs');
  fs.writeFileSync(f, code);
  try { await import(pathToFileURL(f).href); } finally { fs.unlinkSync(f); }
  return globalThis.__RECUP;
}

// ── Scenarios ───────────────────────────────────────────────────────────────
function lance(R) {
  let ok = 0, ko = 0; const echecs = [];
  const eq = (nom, obt, att, tol = 1e-6) => {
    const bon = (typeof att === 'number') ? (typeof obt === 'number' && Math.abs(obt - att) <= tol) : obt === att;
    if (bon) ok++; else { ko++; echecs.push(nom + ' — obtenu ' + JSON.stringify(obt) + ', attendu ' + JSON.stringify(att)); }
  };
  const T = (d, f) => ({ timing: { debut: d, fin: f, continu: false } });
  const J = { nom: 'Jean', statut: 'Actif', type_contrat: 'CDI', planning_id: 'standard' };
  // ⚠️ LES OBJETS SE MODIFIENT EN PLACE, ILS NE SE REMPLACENT PAS. Le module recopie
  //    window.PLANNING_ENTRIES dans sa propre variable (_planMigrateYears) : un nouvel
  //    objet pose apres coup ne serait jamais lu, et le scenario suivant mesurerait le
  //    precedent. Premiere version : 36 rouges, tous du harnais, aucun du code.
  const vider = o => { for (const k of Object.keys(o)) delete o[k]; return o; };
  function domaine(o) {
    const tpl = modele(2026); tpl._timings = {};
    if (o.tpl) o.tpl(tpl);
    for (let m = 0; m < 12; m++) tpl._timings[m] = { d: '08:00' };        // 7 h = 08:00 -> 16:00, coupure 1 h
    Object.assign(vider(window.PLANNING_TEMPLATES), { 2026: { standard: tpl } });
    Object.assign(vider(window.PLANNING_ENTRIES), { Jean: { 2026: o.ent || {} } });
    Object.assign(vider(window.PLANNING_HSUP), o.hsup ? { Jean: o.hsup } : {});
    Object.assign(vider(window.CONFIG), { hsup_mode: 'recup', coupure_heure: '12:00' }, o.config || {});
    window.MEMBRES.length = 0; window.MEMBRES.push(J);
  }
  const inv = (nom, upto) => {
    const b = R._planBank(J, upto), y = R._planYearBalance(J, upto);
    eq(nom + ' · invariant solde − à compenser = net', b.solde - b.dette, y.net);
  };
  const abs2h = { absent: true, motif: 'perso', abs_de: '13:00', abs_a: '15:00', motif_h: 2 };
  // ★ PAIE-1 (§154) — le cadre « Pour la compta » : une ligne par chose à saisir. Écran : pf-cl ; papier : cl. Rend {l, v, p}.
  const clE = (html, k) => { const m = new RegExp('<div class="pf-cl pf-cl-' + k + '[^"]*"><span class="pf-cl-l">([\\s\\S]*?)</span><span class="pf-cl-v">(?:<svg[\\s\\S]*?</svg>)?<span>([\\s\\S]*?)</span></span>(?:<p class="pf-cl-p">([\\s\\S]*?)</p>)?</div>').exec(html || ''); return m ? { l: m[1], v: m[2], p: m[3] || '' } : { l: '', v: '', p: '' }; };
  const clP = (html, k) => { const m = new RegExp('<div class="cl ' + k + '[^"]*"><span class="cl-l">([\\s\\S]*?)</span><span class="cl-v">([\\s\\S]*?)</span>(?:<p class="cl-p">([\\s\\S]*?)</p>)?</div>').exec(html || ''); return m ? { l: m[1], v: m[2], p: m[3] || '' } : { l: '', v: '', p: '' }; };
  // ★ CLAIR-1 : une case du cadre — « à +25 % », « à +50 % », « dimanches et fériés » : son total, et d'où viennent ses heures.
  const bx = (html, lib, h, det) => (html || '').indexOf('<span class="tb' + (h === '0h' ? ' z' : '') + '"><small>' + lib + '</small><b>' + h + '</b>' + (det ? '<i>' + det + '</i>' : '') + '</span>') !== -1;
  const B25 = '\u00e0 +25\u202f%', B50 = '\u00e0 +50\u202f%', BDF = 'dimanches et f\u00e9ri\u00e9s';
  const tx = (html, h, lib) => (html || '').indexOf('<span class="x"><b>' + h + '</b> <small>' + lib + '</small></span>') !== -1;

  // A. Les heures manquees d'un creneau
  eq('A1 · 13:00→15:00, coupure à 12:00 : 2h', R._planAbsPartH('08:00', '16:00', '13:00', '15:00', false, '12:00'), 2);
  eq('A2 · 11:00→14:00 enjambe la coupure : 2h', R._planAbsPartH('08:00', '16:00', '11:00', '14:00', false, '12:00'), 2);
  eq('A3 · sans heure de coupure, arrivée 14:00 : 5h (comme le retard)', R._planAbsPartH('08:00', '16:00', '08:00', '14:00', false, ''), 5);
  eq('A4 · sans heure de coupure, arrivée 09:30 : 1h30', R._planAbsPartH('08:00', '16:00', '08:00', '09:30', false, ''), 1.5);
  eq('A5 · journée continue : aucune coupure retirée', R._planAbsPartH('06:00', '12:00', '10:00', '12:00', true, '12:00'), 2);
  eq('A6 · créneau hors de la journée : 0h', R._planAbsPartH('08:00', '16:00', '16:00', '18:00', false, '12:00'), 0);
  eq('A7 · créneau à l’envers : 0h', R._planAbsPartH('08:00', '16:00', '15:00', '13:00', false, '12:00'), 0);
  eq('A8 · jamais plus que la journée', R._planAbsPartH('08:00', '16:00', '06:00', '20:00', false, '12:00'), 7);

  // B. Ton exemple : 39h la semaine du 7 (4h sup), 2h d'absence le 16
  domaine({ ent: { 8: { 7: T('08:00', '18:00'), 8: T('08:00', '18:00'), 16: abs2h } } });
  let z = R._planHsupMois(J, 8);
  eq('B1 · heures sup faites 4h', z.plus, 4); eq('B2 · toutes à 25 %', z.h25, 4); eq('B3 · rien à 50 %', z.h50, 0);
  eq('B4 · majoration 1h (4h × 25 %)', z.maj, 1); eq('B5 · 2h retirées (motif du salarié)', z.retire, 2);
  let b = R._planBank(J, 8);
  eq('B6 · 5h acquises − 2h = 3h de récup', b.solde, 3); eq('B7 · rien retenu sur la paie', b.retenue, 0); eq('B8 · rien à compenser', b.dette, 0);
  inv('B9', 8);
  eq('B10 · la journée du 16 compte 5h', R._planDayH('standard', 8, 16, abs2h), 5);
  eq('B11 · travail effectif du 16 : 5h', R._planWorkH('standard', 8, 16, abs2h), 5);

  // C. 10h sup dans la semaine : 8h à 25 %, 2h à 50 %
  domaine({ ent: { 8: { 7: T('08:00', '19:00'), 8: T('08:00', '19:00'), 9: T('08:00', '18:00'), 10: T('08:00', '18:00'), 16: abs2h } } });
  z = R._planHsupMois(J, 8);
  eq('C1 · 10h sup', z.plus, 10); eq('C2 · 8h à 25 %', z.h25, 8); eq('C3 · 2h à 50 % (au-delà de 43h)', z.h50, 2);
  eq('C4 · majoration 3h', z.maj, 3);
  b = R._planBank(J, 8);
  eq('C5 · 13h acquises − 2h au taux normal = 11h', b.solde, 11); inv('C6', 8);
  const _j10 = z.semaines.flatMap(s => s.jours).find(j => j.d === 10) || {};
  eq('C7 · le 50 % tombe sur le dernier jour d’heures sup (jeudi 10)', _j10.h50, 2);

  // D. Pas assez de récup
  domaine({ ent: { 8: { 7: T('08:00', '17:00'), 16: abs2h } } });
  b = R._planBank(J, 8);
  eq('D1 · 1h15 couvre, 0h45 retenue sur la paie', b.retenue, 0.75); eq('D2 · compteur à 0', b.solde, 0); inv('D3', 8);
  domaine({ ent: { 8: { 7: T('08:00', '17:00'), 16: Object.assign({}, abs2h, { motif: 'domaine' }) }, 9: { 5: T('08:00', '19:00') } } });
  b = R._planBank(J, 8);
  eq('D4 · journée arrêtée par le domaine : rien retenu', b.retenue, 0); eq('D5 · 0h45 à compenser', b.dette, 0.75); inv('D6', 8);
  b = R._planBank(J, 9);
  eq('D7 · octobre : 3h à 25 % = 3h45, dont 0h45 comblent le reste', b.solde, 3); eq('D8 · plus rien à compenser', b.dette, 0); inv('D9', 9);

  // E. Les motifs sans effet
  for (const [mo, lib] of [['arret', 'arrêt'], ['formation', 'formation'], ['famille', 'événement familial']]) {
    domaine({ ent: { 8: { 7: T('08:00', '18:00'), 8: T('08:00', '18:00'), 16: Object.assign({}, abs2h, { motif: mo }) } } });
    eq('E · ' + lib + ' l’après-midi : rien retiré', R._planHsupMois(J, 8).retire + R._planHsupMois(J, 8).domaine, 0);
    eq('E · ' + lib + ' : les 5h de récup restent', R._planBank(J, 8).solde, 5);
  }
  domaine({ ent: { 8: { 16: { absent: true, motif: 'arret', abs_de: '13:00', abs_a: '15:00', motif_h: 2 } } } });
  eq('E4 · un arrêt d’un après-midi ne suspend que 2h du plafond', R._planSuspH(J), 2);
  eq('E5 · une formation d’un après-midi compte la journée', R._planDayH('standard', 8, 16, { absent: true, motif: 'formation', abs_de: '13:00', abs_a: '15:00', motif_h: 2 }), 7);
  domaine({ ent: { 8: { 7: T('08:00', '18:00'), 8: T('08:00', '18:00'), 16: { absent: true, motif: 'sansolde' } } } });
  eq('E6 · congé sans solde : récup intacte', R._planBank(J, 8).solde, 5);

  // F. Journées entières et anciennes saisies
  domaine({ ent: { 8: { 7: T('08:00', '18:00'), 8: T('08:00', '18:00'), 16: { absent: true, motif: 'injustifie' } } } });
  b = R._planBank(J, 8);
  eq('F1 · absence injustifiée : 7h manquées, 5h couvertes', b.solde, 0); eq('F2 · 2h retenues sur la paie', b.retenue, 2); inv('F3', 8);
  domaine({ ent: { 8: { 7: T('08:00', '18:00'), 8: T('08:00', '18:00'), 16: { absent: true, motif: 'retard', motif_t: '09:30', motif_h: 1.5 } } } });
  eq('F4 · un ancien retard se retire comme une absence du salarié', R._planHsupMois(J, 8).retire, 1.5);
  eq('F5 · 5h − 1h30 = 3h30', R._planBank(J, 8).solde, 3.5);
  domaine({ ent: { 8: { 7: T('08:00', '18:00'), 16: T('08:00', '15:00') } } });
  z = R._planHsupMois(J, 8);
  eq('F6 · horaire raccourci sans motif : à préciser', z.indet, 1); eq('F7 · … jamais retenu sur la paie', R._planBank(J, 8).retenue, 0);
  domaine({ ent: { 8: { 16: Object.assign(T('08:00', '15:00'), { reduit_motif: 'arret' }) } } });
  eq('F8 · horaire raccourci par un arrêt : rien retiré', R._planHsupMois(J, 8).indet + R._planHsupMois(J, 8).domaine + R._planHsupMois(J, 8).retire, 0);
  domaine({ ent: { 8: { 16: Object.assign(T('08:00', '15:00'), { reduit_motif: 'injustifie' }) } } });
  eq('F9 · parti à 15h sans prévenir : 1h retirée', R._planHsupMois(J, 8).retire, 1);
  domaine({ ent: { 8: { 16: { timing: { debut: '06:00', fin: '12:00', continu: true }, canicule: true } } } });
  eq('F10 · horaires chaleur plus courts : décidés par le domaine', R._planHsupMois(J, 8).domaine, 1);
  eq('F11 · une journée entière injustifiée d’un jour de repos ne doit rien',
    R._planJourEcart('standard', 8, 13, { absent: true, motif: 'injustifie' }).moins, 0);

  // G. Récup prise, paiements, valeur saisie à la main
  domaine({ ent: { 8: { 7: T('08:00', '18:00'), 8: T('08:00', '18:00'), 21: { type: 'recup' } } } });
  b = R._planBank(J, 8);
  eq('G1 · 5h de récup − 7h prises : compteur à 0', b.solde, 0); eq('G2 · 2h de récup non couvertes', b.overdraw, 2);
  eq('G3 · le net annuel le dit aussi', R._planYearBalance(J, 8).net, -2);
  domaine({ ent: { 8: { 7: T('08:00', '19:00'), 8: T('08:00', '19:00'), 9: T('08:00', '18:00'), 10: T('08:00', '18:00') } },
            hsup: { '2026-09': { sup_override: 6 } } });
  z = R._planHsupTiers(J, 8);
  eq('G4 · valeur saisie 6h : la part à 50 % reste 2h', z.h50, 2); eq('G5 · … et 4h à 25 %', z.h25, 4); eq('G6 · majoration 2h', z.maj, 2);
  domaine({ ent: { 8: { 7: T('08:00', '18:00'), 8: T('08:00', '18:00') } }, config: { hsup_mode: 'paye' } });
  // RECUP-2 : le compteur compte en temps de récup PARTOUT — ce qui se paie se déclare en heure brute.
  eq('G7 · mode payé : la majoration des heures sup va aussi au compteur', R._planCompteur(J, 8).rows[8].majSup, 1);
  eq('G7b · mode payé : 4h à 25 % = 5h au compteur', R._planBank(J, 8).solde, 5);
  eq('G8 · … mais les taux existent', R._planHsupMois(J, 8).h25, 4);

  // H. Dimanche : la plus forte seule
  domaine({ ent: { 8: { 13: T('08:00', '17:00') } } });
  z = R._planHsupMois(J, 8);
  eq('H1 · 8h un dimanche = 8h sup', z.plus, 8);
  eq('H2 · une seule majoration : 8h au taux du dimanche (4h)', z.maj, 4);
  eq('H2b · … et rien en « majoration seule » : ces heures sont des heures sup', z.majHsVal, 0);
  eq('H2c · une seule ligne, au taux le plus fort', JSON.stringify(z.buckets.map(b => [b.taux, b.nat, b.h])), JSON.stringify([[50, 'dim', 8]]));
  eq('H3 · le compteur prend 8h + 4h de dimanche', R._planBank(J, 8).solde, 12);
  domaine({ ent: { 8: { 13: T('08:00', '17:00') } }, config: { majorations: { dim: 0, ferie: 100 } } });
  eq('H4 · dimanche non majoré : les 25 % des heures sup reprennent', R._planHsupMois(J, 8).maj, 2);

  // I. Une semaine à cheval sur deux mois (lundi 28 septembre → dimanche 4 octobre) — SEM-1 : elle appartient à OCTOBRE
  domaine({ ent: { 8: { 28: T('08:00', '19:00'), 29: T('08:00', '19:00'), 30: T('08:00', '19:00') }, 9: { 1: T('08:00', '19:00') } } });
  const zs = R._planHsupMois(J, 8), zo = R._planHsupMois(J, 9);
  eq('I1 · septembre : la semaine du 28 finit en octobre, rien ici', zs.plus, 0);
  eq('I2 · octobre : les 12h de la semaine, d’un bloc', zo.plus, 12);
  eq('I3 · octobre : 8h à 25 %, 4h à 50 %', [zo.h25, zo.h50].join('/'), '8/4');
  eq('I4 · octobre emporte les trois jours de septembre avec leur semaine', zo.semaines[0].avantMois.length, 3);
  eq('I5 · le compteur de fin septembre ne les a pas encore, celui d’octobre oui', [R._planBank(J, 8).solde, R._planBank(J, 9).solde].join('/'), '0/16');

  // J. La fenêtre : août 2026 garde la règle historique
  domaine({ ent: { 7: { 3: T('08:00', '18:00'), 20: { absent: true, motif: 'injustifie' } } } });
  eq('J1 · août : fenêtre fermée', R._planRecupActive(7), false); eq('J2 · septembre : ouverte', R._planRecupActive(8), true);
  const s7 = R._planSummary(J, 7);
  eq('J3 · août : heures sup = l’écart historique', R._planSupMonth(J, 7), Math.max(0, s7.ecart));
  const y7 = R._planYearBalance(J, 7);
  eq('J4 · août : dues = heures dues historiques', y7.dues, R._planDuesMonth(J, 7));
  eq('J5 · août : aucune majoration d’heures sup', R._planCompteur(J, 7).rows[7].majSup, 0);

  // K. Ce que la grille et le relevé lisent
  domaine({ ent: { 8: { 16: abs2h } } });
  const st = R._planDayStatus('standard', 8, 16, abs2h);
  eq('K1 · le jour se lit « Absent 13:00 → 15:00 · personnel »', st.l, 'Absent 13:00 \u2192 15:00 \u00b7 personnel');
  eq('K2 · il compte comme jour au domaine', st.retard, true);
  const c = R._pl2Cell(J, 'standard', 16, { maxJour: 10 });
  eq('K3 · la case porte les heures faites', c.txt, '5h'); eq('K4 · en orange', c.cls, 'pl2c-late');
  eq('K5 · effet affiché du motif « Personnel »', R._planAbsEffet(R._planAbsDef('perso')).t, 'Retir\u00e9 des heures sup \u00b7 le reste est retenu sur la paie');

  // L. Ce que l'utilisateur LIT : les cartes, le ruban, le verdict, le releve
  const sain = (nom, h) => {
    eq(nom + ' · ni undefined ni NaN', /undefined|NaN/.test(h), false);
    eq(nom + ' · aucun <div> dans un <button>', /<button[^>]*>(?:(?!<\/button>)[\s\S])*<div/.test(h), false);
    const o = (h.match(/<div\b/g) || []).length, f = (h.match(/<\/div>/g) || []).length;
    eq(nom + ' · <div> équilibrés', o, f);
    const ob = (h.match(/<button\b/g) || []).length, fb = (h.match(/<\/button>/g) || []).length;
    eq(nom + ' · <button> équilibrés', ob, fb);
  };
  domaine({ ent: { 8: { 7: T('08:00', '18:00'), 8: T('08:00', '18:00'), 16: abs2h } } });
  const cart = R._planRecupCartes(J, 8);
  sain('L1 cartes', cart);
  eq('L2 · « +4h » d’heures sup faites', cart.indexOf('<b>+4h</b>') !== -1, true);
  eq('L3 · 5h acquises', /<div class="v">5h<\/div><div class="l">de r\u00e9cup<br>acquises/.test(cart), true);
  eq('L4 · 3h de récup', /<div class="s"><div class="v">3h<\/div>/.test(cart), true);
  eq('L5 · retenu sur la paie 0h', cart.indexOf('Retenu sur la paie</span><b>0h</b>') !== -1, true);
  eq('L6 · le 16 est au détail, au taux normal', cart.indexOf('2h manqu\u00e9es \u2192 retir\u00e9es au taux normal') !== -1, true);
  const onglet = R._planHsupCard(J);
  eq('L7 · l’onglet commence par les cartes de la maquette', onglet.indexOf('pl2r-card') !== -1 && onglet.indexOf('pl2r-card') < onglet.indexOf('plh-wrap'), true);
  const rub = R._planRuban('08:00', '16:00', false, '12:00', '', '', '13:00', '15:00');
  eq('L8 · ruban : travaillé, coupure, manqué', ['pl2r-w', 'pl2r-c', 'pl2r-x'].every(c => rub.indexOf('class="' + c + '"') !== -1), true);
  const rub2 = R._planRuban('08:00', '16:00', false, '12:00', '08:00', '18:00', '', '');
  eq('L9 · ruban : les heures en plus', rub2.indexOf('class="pl2r-p"') !== -1, true);
  const av = { b: R._planBank(J, 8), hm: R._planHsupTiers(J, 8) };
  const sansJour = window.PLANNING_ENTRIES.Jean[2026][8][16]; delete window.PLANNING_ENTRIES.Jean[2026][8][16];
  const av0 = { b: R._planBank(J, 8), hm: R._planHsupTiers(J, 8) };
  window.PLANNING_ENTRIES.Jean[2026][8][16] = sansJour;
  const vd = R._planVerdict('t', R._planAbsDef('perso'), 2, av0, av);
  sain('L10 verdict', vd);
  eq('L11 · verdict : 5h sans ce jour', vd.indexOf('Temps de r\u00e9cup sans ce jour<em>4h \u00e0 25\u202f% \u00d7 1,25</em></span><b>5h</b>') !== -1, true);
  eq('L12 · verdict : −2h au taux normal', vd.indexOf('Retir\u00e9 au taux normal<em>1h manqu\u00e9e = 1h de r\u00e9cup en moins</em></span><b>\u22122h</b>') !== -1, true);
  eq('L13 · verdict : il reste 3h', vd.indexOf('Il reste en r\u00e9cup</span><b>3h</b>') !== -1, true);
  const mot = R._planAbsMotifsHtml('perso', true);
  sain('L14 motifs', mot);
  eq('L15 · sept motifs en journée, six en partie de journée', [(R._planAbsMotifsHtml('', false).match(/data-mo=/g) || []).length, (mot.match(/data-mo=/g) || []).length].join('/'), '7/6');
  eq('L16 · « Retard » ne se choisit plus', mot.indexOf('data-mo="retard"'), -1);
  sain('L17 section absence', R._planSheetAbsSection('', false));
  pages.length = 0;
  window._planReleveIndiv('Jean', 8);
  const pdf = pages[0] ? pages[0].html : '';
  eq('L18 · le relevé est produit', pdf.length > 2000, true);
  // FICHE-2 : septembre imprime désormais le relevé de la fiche. Les mêmes questions, posées au nouveau document.
  eq('L19 · septembre imprime le relevé de la fiche', pdf.indexOf('<h2>Pour la compta</h2>') !== -1, true);
  eq('L20 · la journée écourtée, son créneau et son motif, en observation du 16',
    pdf.indexOf('Absent 13:00 \u2192 15:00 \u00b7 personnel') !== -1, true);
  eq('L21 · temps de récup 3h', /Solde fin septembre<\/td><td class="n">3h<\/td>/.test(pdf), true);
  eq('L22 · aucune retenue sur salaire : la ligne le dit en toutes lettres (CLAIR-1 ; avant « Maintenu »)', [clP(pdf, 'base').v, clP(pdf, 'base').p.indexOf('Le salaire de base se paie en entier.') === 0].join('/'), 'Aucune retenue/true');
  eq('L22b · 4h faites à +25 %, 5h en récup, jamais 5h à déclarer',
    pdf.indexOf('<td>Heures sup \u00e0 +25\u202f%</td><td class="n">4h</td><td class="n">\u2014</td><td class="n">4h</td><td class="n cv">5h</td>') !== -1, true);
  eq('L22c · plus de bloc « Dimanches et jours fériés » séparé en septembre', pdf.indexOf('Dimanches et jours f\u00e9ri\u00e9s travaill\u00e9s'), -1);
  // FICHE-5 : le détail mois par mois se lit en heures sup — 4h faites, 2h de récup sur des heures à 25 % = 1h36 récupérées, 2h24 restantes
  // ★ TAUX-1 (20/09/2026) : le détail de l'année se lit en temps de récup — 4h sup = 5h gagnées, 2h d'absence reprises = 2h (plus « 1h36 »), 3h restantes = le solde (L21).
  eq('L24 · l’année : septembre, 4h sup, 5h de récup gagnées, 2h d’absences reprises, 3h restantes, 0h à rattraper', /<tr class="cur"><td>Sept<\/td><td class="n">4h<\/td><td class="n"><\/td><td class="n cv">5h<\/td><td class="n rc"><\/td><td class="n rc">2h<\/td><td class="n rc b">3h<\/td><td class="n">0h<\/td>/.test(pdf), true);
  eq('L23 · relevé : ni undefined ni NaN', /undefined|NaN/.test(pdf.replace(/<script[\s\S]*?<\/script>/g, '')), false);

  // M. RECUP-2 — pour la compta : l'heure brute et son taux, jamais 1h15
  const cols = (html) => [...html.matchAll(/<tr><td>([\s\S]*?)<\/td><td class="(?:rec|r2)">([\s\S]*?)<\/td><td class="(?:dec|r2)">([\s\S]*?)<\/td><td class="(?:tx|r2)">([\s\S]*?)<\/td><\/tr>/g)]
    .map(m => m.slice(1).map(x => x.replace(/<[^>]+>/g, '')));
  const heures = (t) => { const m = /^(\u2212)?(\d+)h(\d*)$/.exec(t); return m ? (m[1] ? -1 : 1) * (+m[2] + (m[3] ? +m[3] / 60 : 0)) : 0; };
  const somme = (html) => cols(html).reduce((a, r) => a + heures(r[1]), 0);
  // M1–M2 : un dimanche PRÉVU (7h au modèle) travaillé 9h
  const dim7 = t => { t[8][13] = 7; };
  domaine({ tpl: dim7, ent: { 8: { 13: T('08:00', '18:00') } } });
  z = R._planHsupMois(J, 8);
  eq('M1 · 2h sup ce dimanche, au taux du dimanche', JSON.stringify(z.buckets.map(b => [b.taux, b.nat, b.h])), JSON.stringify([[50, 'dim', 2]]));
  eq('M2 · les 7h prévues ne portent que leur majoration (3h30)', z.majHsVal, 3.5);
  eq('M2b · récup : 2h × 1,5 + 3h30 = 6h30', R._planBank(J, 8).solde, 6.5); inv('M2c', 8);
  domaine({ tpl: dim7, ent: { 8: { 13: T('08:00', '18:00') } }, config: { hsup_mode: 'paye' } });
  eq('M3 · payé : la majoration des heures prévues part en paie, pas au compteur', R._planBank(J, 8).solde, 3);
  let X = R._planComptaLignes(J, 8, R._planCompteur(J, 8));
  eq('M3b · payé : « majoration seule » à déclarer, rien en récup',
    JSON.stringify(X.lignes.find(l => /Majoration/.test(l[0]))), JSON.stringify(['Majoration \u00b7 dimanche 13 (hors heures sup)', '\u2014', '7h', '+50\u202f% (majoration seule)']));
  // M4 : payé, 2h payées ce mois sur 4h à 25 %
  domaine({ ent: { 8: { 7: T('08:00', '18:00'), 8: T('08:00', '18:00'), 16: abs2h } }, config: { hsup_mode: 'paye' }, hsup: { '2026-09': { paye: 2 } } });
  let c4 = R._planCompteur(J, 8);
  eq('M4 · 2h payées = 2h brutes à +25 %', JSON.stringify(c4.rows[8].payes), JSON.stringify([{ taux: 25, nat: 'hs', brut: 2 }]));
  eq('M4b · 2h restent au compteur = 2h30, − 2h manquées = 0h30', c4.solde, 0.5); inv('M4c', 8);
  let tb = R._planComptaTable(J, 8, c4, false);
  eq('M4d · ligne « Payées ce mois » : 2h à déclarer', cols(tb).some(r => /^Pay\u00e9es ce mois/.test(r[0]) && r[1] === '\u2014' && r[2] === '2h' && r[3] === '+25\u202f%'), true);
  eq('M4e · ligne « Au compteur » : 2h30 en récup', cols(tb).some(r => /^Au compteur/.test(r[0]) && r[1] === '2h30' && r[2] === '\u2014'), true);
  eq('M4f · la colonne « En récup » tombe sur le solde', somme(tb), c4.solde);
  // M5 : en octobre, 2h30 payées depuis le compteur
  domaine({ ent: { 8: { 7: T('08:00', '18:00'), 8: T('08:00', '18:00'), 16: abs2h } }, hsup: { '2026-10': { paye_bank: 2.5 } } });
  let c5 = R._planCompteur(J, 9);
  eq('M5 · 2h30 de récup payées = 2h brutes à +25 %', JSON.stringify(c5.rows[9].payesBank.map(p => [p.taux, p.v, p.brut])), JSON.stringify([[25, 2.5, 2]]));
  eq('M5b · il reste 0h30', c5.solde, 0.5);
  tb = R._planComptaTable(J, 9, c5, false);
  eq('M5c · ligne « Payées depuis le compteur » : −2h30 en récup, 2h à déclarer', cols(tb).some(r => /^Pay\u00e9es depuis le compteur/.test(r[0]) && r[1] === '\u22122h30' && r[2] === '2h' && r[3] === '+25\u202f%'), true);
  eq('M5d · octobre : report 3h − 2h30 = le solde', somme(tb), c5.solde);
  // M6 : sans paiement, les deux colonnes disent la même valeur, et jamais 1h15 à déclarer
  domaine({ ent: { 8: { 7: T('08:00', '19:00'), 8: T('08:00', '19:00'), 9: T('08:00', '18:00'), 10: T('08:00', '18:00'), 13: T('08:00', '17:00'), 16: abs2h } } });
  let c6 = R._planCompteur(J, 8); tb = R._planComptaTable(J, 8, c6, false);
  const hsR = cols(tb).filter(r => /^(Heures sup|Dimanche)/.test(r[0]));
  eq('M6 · même valeur : Σ récup = Σ heures × (1 + taux)', hsR.reduce((a, r) => a + heures(r[1]), 0),
    hsR.reduce((a, r) => a + heures(r[2]) * (1 + (+/\+(\d+)/.exec(r[3])[1]) / 100), 0));
  eq('M6b · toutes les heures sup déclarées une fois', hsR.reduce((a, r) => a + heures(r[2]), 0), R._planHsupMois(J, 8).plus);
  eq('M6c · la colonne « En récup » tombe sur le solde', somme(tb), c6.solde); inv('M6d', 8);
  sain('M7 table compta', tb);
  // M8 : payer 2h BRUTES au-delà du mois coûte 2h30 au compteur (tranche à 25 %)
  domaine({ ent: { 8: { 7: T('08:00', '18:00'), 8: T('08:00', '18:00'), 16: abs2h } } });
  let vb = R._planValeurPourBrut(J, 9, 2);
  eq('M8 · 2h brutes = 2h30 de récup retirées', vb.v, 2.5); eq('M8b · rien de non retenu', vb.reste, 0);
  vb = R._planValeurPourBrut(J, 9, 3);
  eq('M8c · 3h demandées : le compteur (3h) n’en rend que 2h24', vb.v, 3); eq('M8d · 0h36 non retenues', vb.reste, 0.6);

  // N. FICHE-1 — le mois d'un salarié, tel que la paie le lit
  const moisFiche = { 7: T('08:00', '19:00'), 8: T('08:00', '19:00'), 9: T('08:00', '18:00'), 10: T('08:00', '18:00'), 13: T('08:00', '17:00'),
    16: abs2h, 21: { type: 'recup' }, 24: { type: 'cp' }, 25: { type: 'cp' } };
  window.PLANNING_ACOMPTES.Jean = { '2026-09': [{ date: '2026-09-15', montant: 300, note: 'Avance demandée' }] };
  domaine({ ent: { 8: moisFiche } });
  let F = R._planPaieMois(J, 8);
  eq('N1 · 154h prévues', F.prevues, 154); eq('N2 · 149h faites', F.faites, 149);
  eq('N3 · 23h d’absences payées (14h de congés, 9h de récup)', [F.payees, F.cp, F.rec].join('/'), '23/14/9');
  eq('N4 · rien de non payé', F.nonPayees + F.recupNC, 0);
  eq('N5 · écart des jours = faites + payées − prévues = les 18h sup', F.jours.filter(x => !x.hors).reduce((a, x) => a + x.ecart, 0), 18);
  eq('N6 · aucun jour en écart négatif', F.jours.filter(x => !x.hors && x.ecart < -1e-9).length, 0);
  eq('N7 · un congé payé n’a pas d’écart', F.jours[23].ecart, 0);
  eq('N8 · lignes d’heures sup : 25 %, 50 %, dimanche', JSON.stringify(F.lignes.map(l => [l.taux, l.nat, l.h])), JSON.stringify([[25, 'hs', 8], [50, 'hs', 2], [50, 'dim', 8]]));
  eq('N9 · récup : 25h', F.valeurRecup, 25);
  // ★ TAUX-1 : un paiement prend le taux le plus fort d'abord — 2h à 50 % (3h), 8h le dimanche (12h), puis 0h48 à 25 % (1h) : 10h48, 10h30 à la demi-heure. Avant : 12h, toutes prises sur le 25 % puis le 50 %.
  eq('N10 · au plus 10h30 payables : l’absence du 16 et la récup du 21 passent d’abord, et le 50 % se paie en premier', R._planPayeMaxTotal(J, 8), 10.5);
  eq('N11 · la saisie est remise en place après les essais', JSON.stringify(window.PLANNING_HSUP), '{}');
  domaine({ ent: { 8: moisFiche }, hsup: { '2026-09': { paye: 8, demande: true } } });
  F = R._planPaieMois(J, 8);
  eq('N12 · 8h payées, prises sur le 50 % d’abord : 2h d’heures sup, 6h du dimanche (TAUX-1)', JSON.stringify(F.lignes.map(l => l.paye)), JSON.stringify([0, 2, 6]));
  eq('N13 · 10h gardées (8h à 25 %, 2h du dimanche) = 13h de repos', F.valeurRecup, 13); eq('N14 · la demande est lue', F.demande, true);
  eq('N15 · solde 13h − 2h − 7h = 4h', F.c.solde, 4);
  domaine({ ent: { 8: moisFiche }, hsup: { '2026-09': { paye: 18, demande: true } } });
  F = R._planPaieMois(J, 8);
  eq('N16 · 18h demandées : 10h48 payées — l’absence du 16 et la récup du 21 passent d’abord', Math.round(F.payeTotal * 100) / 100, 10.8);
  eq('N17 · … elles restent couvertes : rien de retenu, aucune récup à découvert', F.nonPayees + F.recupNC, 0);
  eq('N18 · les absences payées gardent l’absence couverte et la récup', F.payees, 23);
  eq('N19 · écart = les 18h sup', F.jours.filter(x => !x.hors).reduce((a, x) => a + x.ecart, 0), 18);
  let html = R._pfCadre(J, F);
  sain('N20 cadre', html);
  eq('N21 · le cadre : « Aucune retenue », le salaire de base se paie en entier', html.indexOf('pf-cl-ko') === -1 && clE(html, 'base').v === 'Aucune retenue' && clE(html, 'base').p.indexOf('Le salaire de base se paie en entier.') === 0, true);
  domaine({ ent: { 8: moisFiche } });
  F = R._planPaieMois(J, 8);
  html = R._pfCadre(J, F);
  // ★ SEM-3 : le cadre de l'écran lit la même source que le relevé v3 — « Absences » par cause (NET-1 : tout le mois, plus de « à ce jour »).
  horloge(2026, 9, 1); html = R._pfCadre(J, R._planPaieMois(J, 8));
  eq('N22 · le cadre porte 154h et 149h, le mois fini', html.indexOf('154h pr\u00e9vues, 149h faites') !== -1 && html.indexOf('pf-prov') === -1, true);
  horloge(); html = R._pfCadre(J, F);
  eq('N23 · « Heures sup à payer » sans paiement : aucune, elles vont en récup', [clE(html, 'sup').v, /vont en r\u00e9cup/.test(clE(html, 'sup').p)].join('/'), 'aucune/true');
  eq('N24 · l’acompte de 300 € est à retirer', html.indexOf('300\u202f\u20ac') !== -1, true);
  sain('N25 onglet Jours', R._pfJours(J, F)); sain('N26 onglet Compteur', R._pfCompteur(J, F)); sain('N27 onglet Congés et acomptes', R._pfConges(J, F));
  sain('N28 où vont les heures sup', R._pfOuVont(F));
  const jrs = R._pfJours(J, F);
  eq('N29 · la semaine du 7 dit ses 53h au-delà des 48h', jrs.indexOf('53h sur la semaine') !== -1, true);
  eq('N30 · le congé du 24 se lit « payée », pas en écart', /24<\/b><span>Je<\/span>[\s\S]*?7h pay\u00e9es[\s\S]*?<span class="pf-ec"><\/span>/.test(jrs), true);
  eq('N31 · travail effectif de la semaine du 7 : 53h', R._planSemEffectif(J, new _D(2026, 8, 7)), 53);
  // O. FICHE-2 — le relevé suit la fiche
  window.PLANNING_ACOMPTES.Jean = { '2026-09': [{ date: '2026-09-15', montant: 300, note: 'Avance demandée' }] };
  domaine({ ent: { 8: moisFiche } });
  pages.length = 0; window._planReleveIndiv('Jean', 8);
  let rel = pages[0] ? pages[0].html : '';
  sain('O1 relevé', rel.replace(/<script[\s\S]*?<\/script>/g, ''));
  eq('O2 · deux pages A4', (rel.match(/<section class="pg[ "]/g) || []).length, 2);
  eq('O3 · le cadre « Pour la compta » avant le jour par jour', rel.indexOf('<h2>Pour la compta</h2>') > 0 && rel.indexOf('<h2>Pour la compta</h2>') < rel.indexOf('Jour par jour'), true);
  // ★ SEM-2 : le relevé v3. La colonne « Absence » porte la cause et ce qu'elle devient, la colonne « Heures sup »
  //   remplace l'écart du jour, un week-end de repos tient sur une ligne. Lu le 1er octobre : le mois est fini.
  const lireJours = html => [...html.matchAll(/<tr class="(?:off|dim|fut|)"><td class="jr">([^<]*)<\/td><td class="cpv">[^<]*<\/td><td class="cpv n">([^<]*)<\/td><td class="cfa">[^<]*<\/td><td class="cfa n">([^<]*)<\/td><td class="cab[^"]*">([\s\S]*?)<\/td><td class="cab n[^"]*">([^<]*)<\/td><td class="n up">([^<]*)<\/td>/g)];
  horloge(2026, 9, 1);
  pages.length = 0; window._planReleveIndiv('Jean', 8); rel = pages[0] ? pages[0].html : '';
  const rj = lireJours(rel);
  eq('O4 · les trente jours, chacun une fois (un week-end de repos tient sur une ligne)', rj.flatMap(r => r[1].split(', ').map(t => +t.split(' ')[1])).sort((a, b) => a - b).join(','), Array.from({ length: 30 }, (_, i) => i + 1).join(','));
  const hh = t => { const m = /^(\u2212|-)?(\d+)h(\d*)$/.exec(t || ''); return m ? (m[1] ? -1 : 1) * (+m[2] + (m[3] ? +m[3] / 60 : 0)) : 0; };
  eq('O5 · colonnes : 154h prévues, 149h faites', [rj.reduce((a, r) => a + hh(r[2]), 0), rj.reduce((a, r) => a + hh(r[3]), 0)].join('/'), '154/149');
  eq('O6 · la colonne « Heures sup » = les 18h sup', rj.reduce((a, r) => a + hh(r[6].replace('+', '')), 0), 18);
  eq('O7 · le 24 : « Congé payé », payé (TAUX-1 : plus « Congé payé payée »), 7h, sans heure sup', JSON.stringify(rj.find(r => r[1] === 'Je 24').slice(4, 7)), JSON.stringify(['Cong\u00e9 pay\u00e9 <i>pay\u00e9</i>', '7h', '']));
  eq('O8 · la semaine du 7 dit ses 53h au-delà des 48h', rel.indexOf('53h sur la semaine, au-del\u00e0 des 48h autoris\u00e9es') !== -1, true);
  eq('O9 · page 2 : heures sup, compteur, année, congés, acomptes, signatures',
    ['Les heures sup de septembre', 'Le compteur de r\u00e9cup, en temps de repos', 'D\u00e9tail mois par mois \u2014 ann\u00e9e 2026', 'Cong\u00e9s pay\u00e9s', 'Compteur d\u2019heures', 'Acomptes sur salaire', 'Signature salari\u00e9', 'Signature employeur', 'Transmis \u00e0 la compta le'].every(t => rel.indexOf(t) !== -1), true);
  eq('O10 · le cadre : 154h prévues, 149h faites, et aucune heure sup à payer', rel.indexOf('154h pr\u00e9vues, 149h faites') !== -1 && clP(rel, 'sup').v === 'aucune', true);
  domaine({ ent: { 8: moisFiche }, hsup: { '2026-09': { paye: 8, demande: true } } });
  pages.length = 0; window._planReleveIndiv('Jean', 8); rel = pages[0] ? pages[0].html : '';
  eq('O11 · 8h payées : les trois totaux — rien à 25 %, 2h à 50 %, 6h le dimanche (CLAIR-1)', [bx(rel, B25, '0h'), bx(rel, B50, '2h'), bx(rel, BDF, '6h', '6h le dimanche, \u00e0 +50\u202f%')].join(), 'true,true,true');
  eq('O12 · la demande du salarié se coche à la signature', rel.indexOf('<span class="bx on"></span>Je demande le paiement de 8h d\u2019heures sup.') !== -1, true);
  horloge();
  domaine({ ent: { 7: { 3: T('08:00', '18:00') } } });
  pages.length = 0; window._planReleveIndiv('Jean', 7); rel = pages[0] ? pages[0].html : '';
  eq('O13 · août garde le relevé d’avant', rel.indexOf('Feuille d\u2019heures') !== -1 && rel.indexOf('<h2>Pour la paie</h2>') === -1, true);

  // Q. FICHE-3 — quatre taux à payer, et les heures sup restantes à payer
  const ligne = (html, lib, v) => new RegExp('<dt>' + lib.replace(/[+]/g, '\\+') + '</dt><dd><b>' + v + '</b>').test(html);
  domaine({ ent: { 8: moisFiche }, hsup: { '2026-09': { paye: 8, demande: true } } });
  F = R._planPaieMois(J, 8);
  let cad = R._pfCadre(J, F);
  // ★ PAIE-1 : « aucune ressource cognitive » — les taux à 0h ne s'impriment plus (FICHE-3 les montrait) ; décision de Nico, 19/09.
  eq('Q1 · 8h payées : toujours les trois mêmes cases, le zéro en gris (CLAIR-1 ; avant : seulement les taux qui avaient des heures)', [bx(cad, B25, '0h'), bx(cad, B50, '2h'), bx(cad, BDF, '6h', '6h le dimanche, \u00e0 +50\u202f%')].join(), 'true,true,true');
  let RS = R._pfRestants(J, F);
  // ★ TAUX-1 : restent 8h à 25 % et 2h du dimanche (13h de valeur) ; les 9h à servir prennent le dimanche puis le 25 % : 3h12 à 25 %.
  eq('Q2 · 3h12 restantes, toutes à 25 %, soit 4h de récup', [RS.total, RS.dim.h, RS.dim.v, RS.c25.h, RS.c50.h, RS.valeur].map(x => Math.round(x * 100) / 100).join('/'), '3.2/0/0/3.2/0/4');
  eq('Q3 · décompte : 0 + 18 − 8 − 6h48 = 3h12', [RS.report, RS.faites, RS.payees, RS.consommees].map(x => Math.round(x * 100) / 100).join('/'), '0/18/8/6.8');
  eq('Q4 · les restantes en récup = le temps de récup du compteur', RS.valeur, F.c.solde);
  eq('Q5 · le compteur montre les restantes quand le salarié demande', R._pfCompteur(J, F).indexOf('Heures sup restantes \u00e0 payer') !== -1, true);
  eq('Q6 · … et le cadre les note pour information', ligne(cad, 'Heures sup restantes \u00e0 payer', '3h12'), true);
  pages.length = 0; window._planReleveIndiv('Jean', 8); rel = pages[0] ? pages[0].html : '';
  eq('Q7 · le relevé reprend les restantes', /Restantes fin septembre<\/td><td class="n">3h12<\/td>/.test(rel), true);
  domaine({ ent: { 8: moisFiche }, hsup: { '2026-09': { paye: 0, demande: true } } });
  F = R._planPaieMois(J, 8); RS = R._pfRestants(J, F);
  // ★ TAUX-1 (20/09/2026) : ce qui se prend en TEMPS part du taux le plus fort du mois. Avant : 10h48 (0h48 à 25 %, 2h à 50 %, 8h le dimanche).
  eq('Q8 · rien de payé : 12h restantes (8h à 25 %, rien à 50 %, 4h le dimanche) — les 9h reprises partent du 50 % d’abord', [RS.total, RS.c25.h, RS.c50.h, RS.dim.h].map(x => Math.round(x * 100) / 100).join('/'), '12/8/0/4');
  domaine({ ent: { 8: moisFiche } });
  F = R._planPaieMois(J, 8);
  eq('Q9 · sans demande : ni restantes au compteur, ni quatre lignes', R._pfCompteur(J, F).indexOf('Heures sup restantes') === -1 && R._pfCadre(J, F).indexOf('Heures du dimanche \u00e0') === -1, true);
  domaine({ ent: { 8: moisFiche, 9: { 5: T('08:00', '19:00') } }, hsup: { '2026-09': { paye: 8, demande: true }, '2026-10': { paye: 3, paye_bank: 3, demande: true } } });
  // ⚠️ Comme la case l'écrit (_planFichePayer) : 3h du mois en `paye`, et 2h brutes du dimanche puisées au compteur
  //    en `paye_bank`, À LEUR VALEUR (2h × 1,5 = 3h). Première version : `paye: 5` — le moteur borne au mois, le
  //    harnais mesurait une saisie que l'écran n'écrit jamais.
  const Fo = R._planPaieMois(J, 9), RSo = R._pfRestants(J, Fo);
  eq('Q10 · octobre : 5h24 à 25 %, la case dit « 3h du mois + 2h24 d’avant » — et plus de phrase à part', [bx(R._pfCadre(J, Fo), B25, '5h24', '3h du mois + 2h24 d\u2019avant'), R._pfCadre(J, Fo).indexOf('le dimanche'), R._pfCadre(J, Fo).indexOf('estim')].join(), 'true,-1,-1');
  eq('Q11 · octobre : 3h12 reportées + 3h faites − 5h24 payées = 0h48 restantes', [RSo.report, RSo.faites, RSo.payees, RSo.consommees, RSo.total].map(x => Math.round(x * 100) / 100).join('/'), '3.2/3/5.4/0/0.8');
  window.PLANNING_ACOMPTES.Jean = {};

  // R. FICHE-4 — payer au-delà du mois : tout ce que le compteur contient encore
  domaine({ ent: { 8: moisFiche } });
  eq('R1 · sans report : au plus 10h30, l’absence et la récup du mois passent d’abord', R._planPayeMaxTotal(J, 8), 10.5);
  eq('R2 · « sans toucher la récup prise » a disparu : un paiement ne découvre plus rien', typeof R._planPayeMaxCouvert, 'undefined');
  const dep = {}; dep[R._an() + '-dep'] = { solde: 50, date: '2026-01-01' };
  domaine({ ent: { 8: moisFiche }, hsup: Object.assign({}, dep) });
  eq('R3 · 50h reportées : 18h du mois + 41h du compteur (9h servent la récup du mois)', R._planPayeMaxTotal(J, 8), 59);
  window.PLANNING_HSUP.Jean['2026-09'] = { demande: true, paye: 18 };
  eq('R4 · … et le mois se paie en entier, 18h : l’absence et la récup se servent sur le report', R._planCompteur(J, 8).rows[8].paye, 18);
  const rec30 = { demande: true };
  window.PLANNING_HSUP.Jean['2026-09'] = rec30;
  R._planPayeEcrire(J, 8, rec30, 30);
  eq('R5 · 30h demandées : la demande est un total (PAIE-1) — 18h du mois, 12h prises au compteur', [rec30.paye, rec30.paye_bank, R._planCompteur(J, 8).rows[8].paye, R._planCompteur(J, 8).rows[8].payesBank.reduce((a, q) => a + q.brut, 0)].join('/'), '30/0/18/12');
  F = R._planPaieMois(J, 8);
  eq('R6 · la fiche paie bien 30h', F.payeTotal, 30);
  cad = R._pfCadre(J, F);
  eq('R7 · le cadre : 8h à 25 %, 2h à 50 %, 8h le dimanche ; les 12h du report, sans taux, sur leur ligne « Autres heures à payer »',
    [bx(cad, B25, '8h'), bx(cad, B50, '2h'), bx(cad, BDF, '8h', '8h le dimanche, \u00e0 +50\u202f%'), clE(cad, 'autres').l, tx(cad, '12h', 'report d\u2019avant Ma Vigne, taux \u00e0 v\u00e9rifier')].join(), 'true,true,true,Autres heures \u00e0 payer,true');
  RS = R._pfRestants(J, F);
  eq('R8 · restantes : 50 + 18 − 30 − 9 = 29h, toutes du report', [RS.report, RS.faites, RS.payees, RS.consommees, RS.total, RS.normal.h].join('/'), '50/18/30/9/29/29');
  const rec80 = { demande: true }; window.PLANNING_HSUP.Jean['2026-09'] = rec80;
  const e80 = R._planPayeEcrire(J, 8, rec80, 80);
  eq('R9 · 80h demandées : 59h possibles, 21h introuvables', [Math.round(e80.h * 100) / 100, Math.round(e80.reste * 100) / 100].join('/'), '59/21');
  domaine({ ent: { 8: moisFiche } });

  // S. FICHE-5 — le détail mois par mois : heures sup du mois, payées, récupérées, solde restant
  const depS = {}; depS[R._an() + '-dep'] = { solde: 50, date: '2026-01-01' };
  domaine({ ent: { 8: moisFiche, 9: { 5: T('08:00', '19:00') } }, hsup: Object.assign({ '2026-09': { demande: true, paye: 18, paye_bank: 12 } }, depS) });
  const AN = R._pfAnnee(J, 9);
  let ok12 = true, prevS = 50;
  AN.forEach(x => { if (Math.abs(prevS + x.sup + x.maj - x.payees - x.recup - x.solde) > 1e-6) ok12 = false; prevS = x.solde; });
  eq('S1 · chaque mois : solde d’avant + heures sup − payées − récupérées = solde restant', ok12, true);
  eq('S2 · septembre : 18h sup, 30h payées, 9h récupérées, 29h restantes', [AN[8].sup, AN[8].payees, AN[8].recup, AN[8].solde].map(x => Math.round(x * 100) / 100).join('/'), '18/30/9/29');
  eq('S3 · le solde restant de septembre est celui des « heures sup restantes à payer »', Math.abs(AN[8].solde - R._pfRestants(J, R._planPaieMois(J, 8)).total) < 1e-6, true);
  eq('S4 · octobre : 3h sup, rien de payé ni récupéré, 32h restantes', [AN[9].sup, AN[9].payees, AN[9].recup, AN[9].solde].map(x => Math.round(x * 100) / 100).join('/'), '3/0/0/32');
  eq('S5 · l’onglet Compteur porte le même tableau que le papier (TAUX-1) : récup gagnée, prise, absences reprises, récup restante, heures à rattraper', R._pfCompteur(J, R._planPaieMois(J, 8)).indexOf('<th class="n pf-cv">R\u00e9cup<br>gagn\u00e9e</th><th class="n pf-rc">R\u00e9cup<br>prise</th><th class="n pf-rc">Absences<br>reprises</th><th class="n pf-rc">R\u00e9cup<br>restante</th><th class="n">Heures \u00e0<br>rattraper</th>') !== -1, true);
  domaine({ ent: { 8: moisFiche } });

  // T. SEM-1 — les heures sup à la semaine, les taux au rang, la semaine dans le mois où elle finit
  const court = (f, mo) => Object.assign(T('08:00', f), { reduit_motif: mo });
  domaine({ ent: { 8: { 7: T('08:00', '18:00'), 9: court('15:00', 'domaine') } } });
  z = R._planHsupMois(J, 8);
  eq('T1 · +2h lundi, 1h écourtée mercredi par le domaine : 1h sup, pas 2', z.plus, 1);
  eq('T1b · l’heure écourtée est rattrapée dans la semaine, rien ne part au compteur', [z.domaine, z.rattrape.domaine].join('/'), '0/1');
  eq('T1c · 1h à 25 % = 1h15 de récup', R._planBank(J, 8).solde, 1.25); inv('T1d', 8);
  let PM = R._planPaieMois(J, 8);
  eq('T1e · la fiche : 1h rattrapée dans la semaine, ni retenue ni reprise sur la récup', [PM.sem, PM.nonPayees, PM.jours[8].payeType].join('/'), '1/0/sem');
  domaine({ ent: { 8: { 7: T('08:00', '17:00'), 9: court('12:00', 'domaine') } } });   // 08:00→12:00 = 4h : 3h écourtées (13:00 n’en ferait que 2, sans coupure)
  z = R._planHsupMois(J, 8); b = R._planBank(J, 8);
  eq('T2 · +1h lundi, 3h écourtées par le domaine : aucune heure sup, 2h restent à rattraper', [z.plus, z.domaine, b.dette, b.retenue].join('/'), '0/2/2/0'); inv('T2b', 8);
  domaine({ ent: { 8: { 8: { absent: true, motif: 'injustifie' }, 12: { timing: { debut: '08:00', fin: '12:00', continu: true } } } } });
  z = R._planHsupMois(J, 8); b = R._planBank(J, 8);
  eq('T3 · absence injustifiée mardi, 4h le samedi : pas d’heure sup, 3h d’absence restent', [z.plus, z.retire, z.rattrape.retire].join('/'), '0/3/4');
  eq('T3b · sans compteur, 3h retenues — pas 7', b.retenue, 3); inv('T3c', 8);
  domaine({ ent: { 8: { 8: { absent: true, motif: 'injustifie' }, 13: { timing: { debut: '08:00', fin: '12:00', continu: true } } } } });
  z = R._planHsupMois(J, 8);
  eq('T4 · un dimanche qui rattrape n’est pas une heure sup : il garde sa majoration seule', [z.plus, JSON.stringify(z.majHs.map(x => [x.taux, x.nat, x.h])), z.majHsVal].join(' '), '0 [[50,"dim",4]] 2');
  eq('T4b · 2h de majoration au compteur, 3h d’absence : 1h retenue', R._planBank(J, 8).retenue, 1);
  domaine({ tpl: t => { for (const d of [7, 8, 9, 10, 11]) t[8][d] = 8; },
            ent: { 8: { 7: T('08:00', '19:00'), 8: T('08:00', '19:00'), 9: T('08:00', '19:00'), 10: T('08:00', '19:00'), 11: T('08:00', '18:00') } } });
  z = R._planHsupMois(J, 8);
  eq('T5 · planning 40h, 49h faites : 9h sup', z.plus, 9);
  eq('T5b · le rang : 8h à 25 %, 1h à 50 % — jamais moins de 25 % que de 50 %', [z.h25, z.h50].join('/'), '8/1');
  domaine({ ent: { 7: { 31: T('08:00', '18:00') }, 8: { 1: T('08:00', '19:00'), 3: court('15:00', 'domaine') } } });
  z = R._planHsupMois(J, 8);
  eq('T6 · semaine du 31 août : 4h sup sur la semaine, dont 2h déjà comptées par août', [z.semaines[0].deja, z.plus].join('/'), '2/2');
  eq('T6b · août + septembre = la semaine, rien compté deux fois', R._planSupMonth(J, 7) + z.plus, 4);
  eq('T6c · l’heure écourtée du 3 est rattrapée', [z.domaine, z.rattrape.domaine].join('/'), '0/1');
  domaine({ tpl: t => { t._timings_jour = { 7: { 18: 'D' }, 8: { 18: 'D' } }; } });
  eq('T7 · un jour sans saisie vaut les heures du modèle (7h), pas celles de l’horaire par défaut (7h30)', R._planDayH('standard', 8, 18, null), 7);
  eq('T7b · … à partir de septembre 2026 seulement : août ne bouge pas', R._planDayH('standard', 7, 18, null), 7.5);
  eq('T7c · l’horaire prévu colle à ses heures', R._pfPrevT('standard', 8, 18, 7), '08:00\u201316:00');
  domaine({ ent: { 8: { 29: court('15:00', 'domaine') } } });
  PM = R._planPaieMois(J, 8);
  eq('T8 · le 29 septembre appartient à une semaine d’octobre : il attend, payé, rien au compteur', [PM.att, PM.jours[28].payeType, R._planBank(J, 8).dette].join('/'), '1/att/0');
  eq('T8b · … et octobre le règle', R._planBank(J, 9).dette, 1);
  domaine({ ent: { 8: { 7: T('08:00', '18:00'), 8: T('08:00', '18:00'), 9: abs2h } } });
  const apT = { b: R._planBank(J, 8), hm: R._planHsupTiers(J, 8) };
  const j9 = window.PLANNING_ENTRIES.Jean[2026][8][9]; delete window.PLANNING_ENTRIES.Jean[2026][8][9];
  const avT = { b: R._planBank(J, 8), hm: R._planHsupTiers(J, 8) };
  window.PLANNING_ENTRIES.Jean[2026][8][9] = j9;
  const vdT = R._planVerdict('t', R._planAbsDef('perso'), 2, avT, apT);
  eq('T9 · verdict : 2h d’absence la même semaine que 4h en plus — rattrapées, plus « retirées au taux normal »',
    [vdT.indexOf('Rattrap\u00e9 par les heures en plus de la semaine') !== -1, vdT.indexOf('Retir\u00e9 au taux normal') === -1, vdT.indexOf('<b>\u22122h30</b>') !== -1, vdT.indexOf('Il reste en r\u00e9cup</span><b>2h30</b>') !== -1].join('/'), 'true/true/true/true');
  // U. SEM-2 — le relevé v3 : absences par cause, compteurs qui tombent juste, mentions. NET-1 : plus de provisoire.
  const releve = () => { pages.length = 0; window._planReleveIndiv('Jean', 8); return (pages[0] ? pages[0].html : '').replace(/<script[\s\S]*?<\/script>/g, ''); };
  domaine({ ent: { 8: moisFiche } });
  let rv = releve(); PM = R._planPaieMois(J, 8);
  sain('U1 relevé édité le 16/09', rv);
  eq('U1b · édité le 16/09 : tout le mois compte, plus de provisoire, et il se signe', [rv.indexOf('Relev\u00e9 provisoire'), rv.indexOf('class="sig non"'), rv.indexOf('<div class="sig">') !== -1].join('/'), '-1/-1/true');
  eq('U1c · les jours à venir comptent faits, aux heures du planning, et la feuille le dit', [PM.planDe, rv.indexOf('>' + R._planFmt(PM.faites) + '<') !== -1, rv.indexOf('les jours \u00e0 partir du ' + PM.planDe + ' septembre sont compt\u00e9s aux heures du planning') !== -1].join('/'), '17/true/true');
  // (moisFiche porte des saisies jusqu'au 24 : aucune de ses semaines n'est ENTIÈREMENT à venir — le scénario d'avant mesurait le test, pas le code)
  domaine({ ent: { 8: { 7: T('08:00', '18:00') } } });
  rv = releve();
  eq('U1d · une semaine à venir s’imprime jour par jour, aux heures du planning', [rv.indexOf('<b>Semaine du 21 au 27 septembre</b>\u00a0: 35h pr\u00e9vues, 35h faites.') !== -1, lireJours(rv).some(r => r[1] === 'Lu 21')].join('/'), 'true/true');
  eq('U1e · la semaine du 28 : ses jours s’impriment, elle finit en octobre', [rv.indexOf('elle finit en octobre, elle se compte sur le relev\u00e9 d\u2019octobre.') !== -1, lireJours(rv).some(r => r[1] === 'Ma 29')].join('/'), 'true/true');
  domaine({ ent: { 8: moisFiche } });
  horloge(2026, 9, 1);
  rv = releve();
  sain('U2 relevé définitif', rv);
  eq('U2b · le mois fini : plus de provisoire, et la signature dit ce qu’elle vaut', [rv.indexOf('Relev\u00e9 provisoire'), rv.indexOf('ne vaut pas renonciation \u00e0 ses droits (Code rural, art. R.\u00a0713-36)') !== -1].join('/'), '-1/true');
  eq('U2c · le compteur part du solde d’avant', rv.indexOf('<td>Solde fin ao\u00fbt</td>') !== -1, true);
  eq('U2d · octobre à décembre restent vides, et le cumul depuis janvier est écrit', [rv.indexOf('<tr class="vide"><td>Oct</td><td></td>') !== -1, rv.indexOf('<td>Depuis janvier</td>') !== -1].join('/'), 'true/true');
  eq('U2e · l’en-tête dit le modèle par son nom', [rv.indexOf(', planning Standard</div>') !== -1, R._pfPlanNom('planning-35h-(administration)')].join('/'), 'true/35h (administration)');
  eq('U2f · congés : pas de reste négatif sans solde de départ', [rv.indexOf('\u00e0 saisir dans la fiche') !== -1, rv.indexOf('connu une fois le solde saisi') !== -1].join('/'), 'true/true');
  domaine({ ent: { 8: { 7: T('08:00', '18:00'), 8: T('08:00', '18:00'), 16: { absent: true, motif: 'injustifie' } } } });
  rv = releve();
  const l16 = lireJours(rv).find(r => r[1] === 'Me 16') || [];
  eq('U3 · absence injustifiée : elle garde son nom, et dit ce qu’elle devient', [/^R\u00e9cup/.test(l16[4] || ''), (l16[4] || '').indexOf('<i>5h sur la r\u00e9cup, 2h retenues</i>') !== -1, l16[5]].join('/'), 'false/true/7h');
  eq('U3b · la reprise sur la récup est dite (TAUX-1 : un seul nom, « récup »), sans case à cocher', [rv.indexOf('<label class="inf">Mon absence du 16 septembre est reprise sur ma r\u00e9cup (5h, non rattrap\u00e9es dans leur semaine).</label>') !== -1, rv.indexOf('J\u2019accepte')].join('/'), 'true/-1');
  domaine({ ent: { 8: { 16: { absent: true, motif: 'autre' } } } });
  rv = releve();
  eq('U4 · une absence sans motif est une absence injustifiée : plus rien « à préciser »', [(lireJours(rv).find(r => r[1] === 'Me 16') || [])[4], rv.indexOf('Sans motif'), rv.indexOf('\u00e0 pr\u00e9ciser'), clP(rv, 'base').v === 'Retenue de 7h'].join('/'), 'Absence injustifi\u00e9e <i>retenue</i>/-1/-1/true');
  domaine({ ent: { 8: { 7: T('08:00', '17:00'), 9: court('12:00', 'domaine') } } });
  rv = releve();
  eq('U5 · le compte des heures à rattraper : 3h écourtées, 1h dans la semaine, 2h restent', [rv.indexOf('Les heures \u00e0 rattraper') !== -1, /Rattrap\u00e9es dans la semaine, par les heures en plus<\/td><td class="n up">\u22121h<\/td>/.test(rv), /Reste \u00e0 rattraper fin septembre<\/td><td class="n">2h<\/td>/.test(rv)].join('/'), 'true/true/true');
  eq('U5b · le jour le dit aussi', (lireJours(rv).find(r => r[1] === 'Me 9') || [])[4], '\u00c9court\u00e9e par le domaine <i>1h dans la semaine, 2h \u00e0 rattraper</i>');
  domaine({ ent: { 7: { 31: T('08:00', '18:00') }, 8: { 1: T('08:00', '19:00'), 3: court('15:00', 'domaine') } } });
  rv = releve();
  eq('U6 · le lundi 31 août est sur le papier, en gris, avec ce qu’août a compté', [rv.indexOf('<tr class="hors"><td class="jr">Lu 31 ao\u00fbt</td>') !== -1, rv.indexOf('2h sup d\u00e9j\u00e0 compt\u00e9es en ao\u00fbt') !== -1].join('/'), 'true/true');
  domaine({ ent: { 8: { 7: T('08:00', '19:30') } } });
  rv = releve();
  eq('U7 · 10h30 dans la journée : l’observation et le bloc « Durées et repos »', [rv.indexOf('Plus de 10h') !== -1, rv.indexOf('Lundi 7\u00a0: 10h30 de travail, au-del\u00e0 de 10h dans la journ\u00e9e.') !== -1].join('/'), 'true/true');
  // V. SEM-3 — l'ÉCRAN de la fiche dit la même chose que le relevé v3 (une seule source : _pfV3, _pfComptesV3)
  domaine({ ent: { 8: { 7: T('08:00', '18:00'), 8: T('08:00', '18:00'), 16: { absent: true, motif: 'injustifie' } } } });
  PM = R._planPaieMois(J, 8);
  let ecr = R._pfCadre(J, PM), ejr = R._pfJours(J, PM), ecp = R._pfCompteur(J, PM);
  sain('V1 cadre', ecr); sain('V1 jours', ejr); sain('V1 compteur', ecp);
  eq('V2 · le cadre : plus de trio ni d’étiquettes ; l’absence du salarié se dit dans la ligne du salaire (PAIE-1)', [ecr.indexOf('pf-trio'), /Absences du salari\u00e9\u00a0: 7h, le 16\./.test(clE(ecr, 'base').p), ecr.indexOf('Absences pay\u00e9es'), clE(ecr, 'base').v].join('/'), '-1/true/-1/Retenue de 2h');
  eq('V3 · l’écran et le papier disent le même bas de cadre', ecr.indexOf('Heures sup\u00a0: <b>4h</b>, sur la semaine du 7.') !== -1 && rv.length > 0 && releve().indexOf('Heures sup\u00a0: <b>4h</b>, sur la semaine du 7.') !== -1, true);
  eq('V4 · Jours : la colonne « Heures sup », et l’absence dit ce qu’elle devient', [ejr.indexOf('<span>Heures sup</span>') !== -1, ejr.indexOf('>\u00c9cart<'), ejr.indexOf('5h reprises sur la r\u00e9cup, 2h retenues') !== -1].join('/'), 'true/-1/true');
  eq('V5 · Jours : la note ne parle plus de la 43e heure', [ejr.indexOf('43'), ejr.indexOf('les huit premi\u00e8res \u00e0 25\u202f%') !== -1].join('/'), '-1/true');
  eq('V6 · Compteur : du solde d’avant au solde d’après', [ecp.indexOf('<span class="pf-mv-t">Solde fin ao\u00fbt</span>') !== -1, ecp.indexOf('<li class="pf-tot"><span class="pf-mv-t">Solde fin septembre</span>') !== -1, ecp.indexOf('report\u00e9es + ')].join('/'), 'true/true/-1');
  eq('V7 · Compteur : la carte « Heures à rattraper » est TOUJOURS là, même à zéro', [ecp.indexOf('<h3>Heures \u00e0 rattraper</h3>') !== -1, ecp.indexOf('<span class="pf-mv-t">Reste \u00e0 rattraper fin septembre</span><b>0h</b>') !== -1].join('/'), 'true/true');
  eq('V7b · … et sur le papier aussi', releve().indexOf('Reste \u00e0 rattraper fin septembre</td><td class="n">0h</td>') !== -1, true);
  eq('V8 · Compteur : total depuis janvier, mois à venir vides', [ecp.indexOf('<tr class="pf-totr"><td>Depuis janvier</td>') !== -1, ecp.indexOf('<tr class="pf-vide"><td>Oct</td>') !== -1].join('/'), 'true/true');
  domaine({ ent: { 7: { 31: T('08:00', '18:00') }, 8: { 1: T('08:00', '19:00'), 3: court('15:00', 'domaine') } } });
  PM = R._planPaieMois(J, 8); ejr = R._pfJours(J, PM);
  eq('V9 · Jours : la semaine entière, le lundi 31 août grisé, ce que la semaine a rattrapé', [ejr.indexOf('<h3>Semaine du 31 ao\u00fbt au 6 septembre</h3>') !== -1, ejr.indexOf('<div class="pf-jr pf-hors">') !== -1, ejr.indexOf('1h \u00e9court\u00e9es par le domaine, rattrap\u00e9es') !== -1, ejr.indexOf('2h sup d\u00e9j\u00e0 compt\u00e9es en ao\u00fbt') !== -1].join('/'), 'true/true/true/true');
  domaine({ ent: { 8: { 7: T('08:00', '17:00'), 9: court('12:00', 'domaine') } } });
  PM = R._planPaieMois(J, 8); ecp = R._pfCompteur(J, PM);
  eq('V10 · Compteur : 3h écourtées, 1h dans la semaine, 2h restent — comme le relevé (U5)', [ecp.indexOf('<span class="pf-mv-t">Rattrap\u00e9es dans la semaine, par les heures en plus</span><b class="up">\u22121h</b>') !== -1, ecp.indexOf('Reste \u00e0 rattraper fin septembre</span><b>2h</b>') !== -1].join('/'), 'true/true');
  horloge();
  domaine({ ent: { 8: { 7: T('08:00', '18:00') } } });
  PM = R._planPaieMois(J, 8); ecr = R._pfCadre(J, PM); ejr = R._pfJours(J, PM);
  eq('V11 · le 16/09, l’écran compte tout le mois : ni « mois en cours » ni jours grisés', [ecr.indexOf('pf-prov'), ecr.indexOf('Pr\u00e9vues \u00e0 ce jour'), ejr.indexOf('pf-fut'), ecr.indexOf('Les jours \u00e0 partir du 16 septembre sont compt\u00e9s aux heures du planning.') !== -1].join('/'), '-1/-1/-1/true');
  domaine({ ent: { 7: { 3: T('08:00', '18:00') } } });
  PM = R._planPaieMois(J, 7); ecr = R._pfCadre(J, PM); ejr = R._pfJours(J, PM);
  eq('V12 · août garde l’écran d’avant : « Absences payées », « Écart »', [ecr.indexOf('Absences pay\u00e9es') !== -1, ejr.indexOf('>\u00c9cart<') !== -1, ejr.indexOf('Semaine du')].join('/'), 'true/true/-1');
  horloge();
  eq('T10 · les semaines de septembre 2026 : du 31 août au 27 septembre, quatre', R._planSemainesDuMois(8).map(w => w.mon.getDate() + '-' + w.sun.getDate()).join(' '), '31-6 7-13 14-20 21-27');
  domaine({ ent: { 8: moisFiche } });

  // W. AVANT-1 — les heures sup d'avant septembre 2026 : un taux ESTIMÉ d'après les jours, rien ne bouge au compteur (§147)
  horloge(2026, 9, 1);
  const hj = (d, f, js) => Object.fromEntries(js.map(j => [j, T(d, f)]));
  const anW = () => ({
    4: hj('08:00', '18:00', [18, 19, 20]),
    5: Object.assign(hj('08:00', '19:00', [8, 9, 10, 11, 12]), hj('08:00', '18:00', [22, 23])),
    6: Object.assign(hj('08:00', '18:00', [6, 7, 8, 9, 10]), hj('08:00', '18:00', [20, 21, 22])),
    7: Object.assign({ 10: { type: 'recup' }, 11: { type: 'recup' } }, hj('08:00', '18:00', [17, 18])),
    8: Object.assign(hj('07:30', '18:30', [7, 8, 9, 10]), { 11: T('08:00', '17:00') }, hj('08:00', '18:00', [14, 15]))
  });
  const estL = (html, h, txt) => html.indexOf('<dt>Heures sup d\u2019avant septembre<small class="pf-estl">Estimation d\u2019apr\u00e8s les jours saisis\u00a0: ' + txt + '</small></dt><dd><b>' + h + '</b></dd>') !== -1;
  domaine({ ent: anW(), hsup: { '2026-09': { demande: true } } });
  let recW = window.PLANNING_HSUP.Jean['2026-09'];
  R._planPayeEcrire(J, 8, recW, 30);
  eq('W1 · 30h demandées : la demande est un total — 17h du mois, 13h prises au compteur (juin, puis juillet)', [recW.paye, recW.paye_bank, R._planCompteur(J, 8).rows[8].paye, Math.round(R._planCompteur(J, 8).rows[8].payesBank.reduce((a, q) => a + q.brut, 0) * 100) / 100].join('/'), '30/0/17/13');
  let PW = R._planPaieMois(J, 8), cadW = R._pfCadre(J, PW);
  sain('W1 cadre', cadW);
  // ★ TAUX-1 : la récup d'août a pris le 50 % de juin d'abord (7h, puis 1h à 25 %) ; le paiement prend ce qui reste de juin (11h à 25 %) et le haut de juillet (2h à 50 %). Avant : 6h à 25 %, 7h à 50 %.
  // ★ CLAIR-1 : plus de ligne « heures sup d'avant septembre (estimées : …) » — ce qu'elle estimait rejoint la case de son taux.
  eq('W2 · le cadre : 23h à 25 % (12h du mois + 11h d’avant), 7h à 50 % (5h du mois + 2h d’avant), et plus le mot « estimées »', [bx(cadW, B25, '23h', '12h du mois + 11h d\u2019avant'), bx(cadW, B50, '7h', '5h du mois + 2h d\u2019avant'), bx(cadW, BDF, '0h'), cadW.indexOf('estim')].join('/'), 'true/true/true/-1');
  eq('W3 · plus aucune ligne « taux à vérifier » : tout vient de mois lisibles', cadW.indexOf('taux \u00e0 v\u00e9rifier'), -1);
  window.PLANNING_HSUP.Jean['2026-09'] = { demande: true, paye: 17, paye_bank: 13 };        // une saisie d'avant PAIE-1
  // ★ AVANT-2 : une saisie d'avant PAIE-1 retire 13h de VALEUR au compteur ; ces heures de juin valent désormais 1h15 — 13h de récup = 10h24 à 25 %.
  eq('W3b · une saisie d’avant PAIE-1 (17h du mois, 13h de récup au compteur) : 13h de récup = 10h24 à 25 %, dites « d’avant »', bx(R._pfCadre(J, R._planPaieMois(J, 8)), B25, '22h24', '12h du mois + 10h24 d\u2019avant'), true);
  window.PLANNING_HSUP.Jean['2026-09'] = recW;
  let RW = R._pfRestants(J, PW);
  // ★ AVANT-2 : au 1er septembre le stock d'avant a pris sa majoration — 29h à 25 % et 2h à 50 % (juin 11h, juillet 14h + 2h, août 4h), +8h15. Plus rien « sans taux ».
  eq('W4 · restantes : 18h d’avant septembre, à 25 %, MAJORÉES — 22h30 de récup (avant : 18h, 1h pour 1h)', [RW.total, RW.valeur, RW.c25.h, RW.c25.av, RW.c50.av, RW.src.avant, PW.r.revalo].join('/'), '18/22.5/18/18/0/0/8.25');
  eq('W5 · au compteur : juillet 14h et août 4h, de vraies tranches à 25 % — leur mois d’origine gardé', PW.c.tr.map(t => t.taux + t.nat + ' m' + t.mois + ':' + Math.round(t.h / (1 + t.taux / 100) * 100) / 100).join(' '), '25hs m6:14 25hs m7:4');
  const temoin = () => JSON.stringify(R._planCompteur(J, 8)) + JSON.stringify(window.PLANNING_HSUP) + JSON.stringify(window.PLANNING_ENTRIES);
  const t0 = temoin(); R._pfRestants(J, PW); R._pfCadre(J, PW); R._pfCompteur(J, PW); releve();
  eq('W6 · lire l’estimation ne change ni le compteur, ni les saisies', temoin() === t0, true);
  eq('W7 · la bascule de septembre est remise en place après chaque lecture', [R._planRecupActive(7), R._planRecupActive(8)].join('/'), 'false/true');
  const cpW = R._pfCompteur(J, PW);
  sain('W8 compteur', cpW);
  eq('W8 · Compteur : 18h à 25 % « dont 18h d’avant septembre », 22h30 de récup ; plus d’estimation ; la majoration du stock est une ligne du mois', [cpW.indexOf('<tr><td>Heures sup \u00e0 +25\u202f%<small class="pf-estl">dont 18h d\u2019avant septembre</small></td><td class="n"><b>18h</b></td><td class="n pf-rec">22h30</td></tr>') !== -1,
    cpW.indexOf('Estimation d\u2019apr\u00e8s les jours saisis') === -1,
    cpW.indexOf('Majoration des heures sup d\u2019avant septembre') !== -1].join('/'), 'true/true/true');
  const rvW = releve();
  eq('W9 · relevé : le cadre, la page 2 et « À savoir » disent la même chose', [bx(rvW, B25, '23h', '12h du mois + 11h d\u2019avant'),
    rvW.indexOf('<tr><td>Heures sup \u00e0 +25\u202f%<small class="est">dont 18h d\u2019avant septembre</small></td><td class="n">18h</td><td class="n cv">22h30 de repos</td>') !== -1,
    rvW.indexOf('<li><b>Heures sup d\u2019avant septembre 2026</b>\u00a0:') !== -1 && rvW.indexOf('ont pris leur majoration le 1er septembre') !== -1].join('/'), 'true/true/true');
  // Un report d'avant Ma Vigne, un jour de récup en mars, un dimanche travaillé le 12 juillet
  const anM = anW(); anM[2] = { 20: { type: 'recup' } }; anM[6][12] = T('08:00', '17:00');
  domaine({ ent: anM, hsup: { '2026-dep': { solde: 30, date: '2026-01-01' }, '2026-09': { demande: true } } });
  recW = window.PLANNING_HSUP.Jean['2026-09']; R._planPayeEcrire(J, 8, recW, 30);
  PW = R._planPaieMois(J, 8); cadW = R._pfCadre(J, PW); RW = R._pfRestants(J, PW);
  eq('W10 · le report reste à part, à vérifier (9h) ; les 4h d’avant septembre rejoignent le 25 % (12h du mois + 4h d’avant)', [tx(cadW, '9h', 'report d\u2019avant Ma Vigne, taux \u00e0 v\u00e9rifier'), bx(cadW, B25, '16h', '12h du mois + 4h d\u2019avant'), bx(cadW, B50, '5h', 'du mois')].join('/'), 'true/true/true');
  // ★ CLAIR-1 — des heures d'un dimanche d'avant septembre (le 12 juillet) : leur case, et ce que la feuille en dit.
  {
    const lr = R._pfRestLignes(RW), som = k => Math.round(lr.reduce((a, x) => a + x[k], 0) * 100) / 100;
    eq('W10b · les lignes des restantes SONT le total (53h, 65h30 de récup depuis AVANT-2) : rien d’oublié, rien en double — dont 32h d’avant septembre à 25 % et les 8h du dimanche 12 juillet, sans majoration de plus', [som('h'), RW.total, som('v'), RW.valeur, lr.find(x => x.k === 'c25').avant, lr.find(x => x.k === 'deja').h].join('/'), '53/53/65.5/65.5/32/8');
    const cpM = R._pfCompteur(J, PW);
    eq('W10c · Compteur : « Dimanches et fériés d’avant septembre, sans majoration », et pourquoi', cpM.indexOf('<tr><td>Dimanches et f\u00e9ri\u00e9s d\u2019avant septembre, sans majoration<small class="pf-estl">leur majoration est d\u00e9j\u00e0 dans la r\u00e9cup</small></td><td class="n"><b>8h</b></td>') !== -1, true);
    eq('W10d · « déjà majorées » ne s’écrit plus nulle part', [cpM.indexOf('d\u00e9j\u00e0 major\u00e9es'), releve().indexOf('d\u00e9j\u00e0 major\u00e9es')].join('/'), '-1/-1');
    R._planPayeEcrire(J, 8, recW, 70);
    const Pz = R._planPaieMois(J, 8), cz = R._pfCadre(J, Pz);
    eq('W10e · 70h demandées : 44h à 25 %, 14h à 50 %, 3h de dimanche d’avant septembre « sans majoration », 9h de report à part — 70h en tout', [bx(cz, B25, '44h', '12h du mois + 32h d\u2019avant'), bx(cz, B50, '14h', '5h du mois + 9h d\u2019avant'), bx(cz, BDF, '3h', '3h d\u2019avant septembre, sans majoration'), tx(cz, '9h', 'report d\u2019avant Ma Vigne, taux \u00e0 v\u00e9rifier'), Pz.payeTotal].join('/'), 'true/true/true/true/70');
    eq('W10f · … et la phrase dit pourquoi ces 3h n’ont pas de majoration', clE(cz, 'sup').p.indexOf('leur majoration a d\u00e9j\u00e0 \u00e9t\u00e9 compt\u00e9e en r\u00e9cup \u00e0 l\u2019\u00e9poque, ces 3h se paient sans majoration') !== -1, true);
    R._planPayeEcrire(J, 8, recW, 30);
    // Une saisie d'avant PAIE-1 (paye_bank, en VALEUR) qui descend jusqu'au dimanche de juillet : 9 + 7h30 + 10h30 + 15 + 3 + 17h30 = 62h30, puis 3h.
    window.PLANNING_HSUP.Jean['2026-09'] = { demande: true, paye: 17, paye_bank: 65.5 };
    eq('W10g · l’ancien chemin de paiement garde le MOIS de chaque heure : les 3h du dimanche de juillet sont reconnues, « sans majoration »', bx(R._pfCadre(J, R._planPaieMois(J, 8)), BDF, '3h', '3h d\u2019avant septembre, sans majoration'), true);
    window.PLANNING_HSUP.Jean['2026-09'] = recW;
  }
  eq('W11 · un dimanche a sa majoration à part : ses 8h restent à 1 pour 1 (elles l’ont déjà), les 4h de majoration sur leur ligne ; le reste est majoré — 32h à 25 %, 9h à 50 %', [RW.src.avant, RW.src.est.deja, RW.src.maj, RW.src.dep, RW.c25.av, RW.c50.av].join('/'), '8/8/4/0/32/9');
  eq('W11b · … et la carte le dit', R._pfCompteur(J, PW).indexOf('<td>Majoration des dimanches et f\u00e9ri\u00e9s, d\u00e9j\u00e0 calcul\u00e9e</td><td class="n"><b>4h</b></td>') !== -1, true);
  // Une valeur saisie à la main au-delà de ce que les jours montrent
  domaine({ ent: { 5: hj('08:00', '19:00', [8, 9, 10, 11, 12]) }, hsup: { '2026-06': { sup_override: 20 }, '2026-09': { demande: true } } });
  RW = R._pfRestants(J, R._planPaieMois(J, 8));
  eq('W12 · une valeur saisie à la main : ce que les jours ne montrent pas compte à 25 % — 13h à 25 %, 7h à 50 %, 26h45 de récup', [RW.total, RW.valeur, RW.c25.av, RW.c50.av, RW.src.avant].join('/'), '20/26.75/13/7/0');
  horloge();
  domaine({ ent: { 8: moisFiche } });

  // X. NET-1 (§150) — une retenue OU des heures sup à payer ; le domaine sur la récup, puis à rattraper ; le salarié d'abord
  horloge(2026, 9, 1);
  const inj = { absent: true, motif: 'injustifie' };
  const plus3 = { 14: T('08:00', '19:00'), 15: T('08:00', '19:00'), 16: T('08:00', '19:00'), 17: T('08:00', '19:00') };   // 12h sup : 8 à 25 %, 4 à 50 %
  domaine({ ent: { 8: Object.assign({ 8: inj }, plus3) }, hsup: { '2026-09': { demande: true, paye: 12 } } });
  let FX = R._planPaieMois(J, 8);
  eq('X1 · 7h d’absence, 12h sup demandées : 6h24 payées (4h à 50 %, 2h24 à 25 % — TAUX-1 ; avant 7h12, toutes à 25 %), rien de retenu', [Math.round(FX.payeTotal * 100) / 100, FX.nonPayees].join('/'), '6.4/0');
  let cx = R._pfCadre(J, FX);
  eq('X2 · le cadre : 2h24 à 25 %, 4h à 50 %, aucune retenue', [bx(cx, B25, '2h24'), bx(cx, B50, '4h'), bx(cx, BDF, '0h'), clE(cx, 'base').v].join('/'), 'true/true/true/Aucune retenue');
  const recX = window.PLANNING_HSUP.Jean['2026-09'];
  const eX = R._planPayeEcrire(J, 8, recX, 12);
  eq('X3 · écrire 12h : 6h24 payables, 5h36 de reste, la demande est gardée', [Math.round(eX.h * 100) / 100, Math.round(eX.reste * 100) / 100, recX.paye].join('/'), '6.4/5.6/12');
  eq('X4 · le plus payable est ce qui se paie vraiment (6h, à la demi-heure)', R._planPayeMaxTotal(J, 8), 6);
  domaine({ ent: { 8: Object.assign({ 8: inj, 9: inj, 10: inj }, plus3) }, hsup: { '2026-09': { demande: true, paye: 12 } } });
  FX = R._planPaieMois(J, 8); cx = R._pfCadre(J, FX);
  eq('X5 · 21h d’absence : 16h couvertes par les heures sup, 5h retenues, rien à payer', [FX.nonPayees, FX.payeTotal].join('/'), '5/0');
  eq('X6 · le cadre : la retenue, et « aucune » heure sup à payer — pas de cases quand rien ne se paie', [clE(cx, 'base').v, clE(cx, 'sup').v, /absences/.test(clE(cx, 'sup').p), cx.indexOf('class="tx3"')].join('/'), 'Retenue de 5h/aucune/true/-1');
  const depX = {}; depX[R._an() + '-dep'] = { solde: 20, date: '2026-01-01' };
  domaine({ ent: { 8: { 9: court('12:00', 'domaine') } }, hsup: Object.assign({}, depX) });
  let bX = R._planBank(J, 8);
  eq('X7 · 3h écourtées par le domaine, 20h de récup : reprises sur la récup, rien à rattraper', [bX.solde, bX.dette, bX.retenue].join('/'), '17/0/0');
  const depX5 = {}; depX5[R._an() + '-dep'] = { solde: 5, date: '2026-01-01' };
  domaine({ ent: { 8: { 8: inj, 9: court('12:00', 'domaine') } }, hsup: Object.assign({}, depX5) });
  bX = R._planBank(J, 8);
  eq('X8 · 5h de récup, 7h du salarié, 3h du domaine : le salarié d’abord (2h retenues), le domaine à rattraper (3h)', [bX.retenue, bX.dette, bX.solde].join('/'), '2/3/0');
  FX = R._planPaieMois(J, 8); cx = R._pfCadre(J, FX);
  eq('X9 · le cadre porte le compteur des heures à rattraper', /<div class="pf-fort"><dt>Heures \u00e0 rattraper<small>[^<]*<\/small><\/dt><dd><b>3h<\/b><\/dd><\/div>/.test(cx), true);
  domaine({ ent: { 8: { 7: T('08:00', '17:00') } } });
  eq('X10 · … toujours, même à zéro', R._pfCadre(J, R._planPaieMois(J, 8)).indexOf('<dt>Heures \u00e0 rattraper</dt><dd><b>0h</b></dd>') !== -1, true);
  domaine({ ent: { 7: { 12: { absent: true } }, 8: { 16: { absent: true } } } });
  eq('X11 · sans motif en septembre : absence injustifiée, 7h retirées', [R._planHsupMois(J, 8).retire, R._planDayStatus('standard', 8, 16, { absent: true }).l].join('/'), '7/Absence injustifi\u00e9e');
  eq('X12 · sans motif en août : neutre, comme avant', [R._planDayStatus('standard', 7, 12, { absent: true }).l, R._planAbsMotifAt({ absent: true }, 7).id].join('/'), 'Absent/autre');
  domaine({ ent: { 7: { 31: T('08:00', '17:00') }, 8: { 1: inj } } });
  const zX = R._planHsupMois(J, 8);
  eq('X13 · 1h en plus le lundi 31 août, absent le 1er : août l’a déjà comptée, les 7h restent entières', [zX.retire, zX.rattrape.retire].join('/'), '7/0');
  domaine({ ent: { 8: { 21: { type: 'recup' } } } });
  FX = R._planPaieMois(J, 8);
  eq('X14 · une récup prise sans rien au compteur n’est pas payée : 7h à découvert', [FX.recupNC, FX.jours[20].paye].join('/'), '7/0');
  horloge();
  domaine({ ent: { 8: moisFiche } });

  // Y. FIGE-1 (§151) — figer à l'envoi : le paiement et la retenue ne bougent plus ; ce qui change passe au mois suivant
  horloge(2026, 8, 24);
  domaine({ ent: { 8: Object.assign({}, plus3) }, hsup: { '2026-09': { demande: true, paye: 3 } } });
  window.PLANNING_HSUP.Jean['2026-09'].fige = R._planFigeInstantane(J, 8);
  const fg1 = window.PLANNING_HSUP.Jean['2026-09'].fige;
  eq('Y1 · l’instantané : 3h payées à 50 % (TAUX-1 : le taux le plus fort d’abord), rien de retenu, daté du jour', JSON.stringify([fg1.payes, fg1.retenue, fg1.le]), JSON.stringify([[{ taux: 50, nat: 'hs', brut: 3 }], 0, '2026-09-24']));
  window.PLANNING_ENTRIES.Jean[2026][8][25] = inj;
  let FY = R._planPaieMois(J, 8);
  eq('Y2 · absent le 25, après l’envoi : septembre garde 3h payées, la récup couvre l’absence, rien ne passe', [FY.payeTotal, FY.nonPayees, FY.reportSuivant].join('/'), '3/0/0');
  domaine({ ent: { 8: Object.assign({}, plus3) }, hsup: { '2026-09': { demande: true, paye: 12 } } });
  window.PLANNING_HSUP.Jean['2026-09'].fige = R._planFigeInstantane(J, 8);
  window.PLANNING_ENTRIES.Jean[2026][8][25] = inj;
  horloge(2026, 9, 1);
  FY = R._planPaieMois(J, 8);
  eq('Y3 · tout payé, puis absent le 25 : septembre garde 12h payées et 0h retenue, 7h passent sur octobre', [FY.payeTotal, FY.nonPayees, FY.reportSuivant].join('/'), '12/0/7');
  let FO = R._planPaieMois(J, 9);
  eq('Y4 · octobre, sans heure sup ni récup : les 7h reportées sont retenues', [FO.report.ret, FO.report.retNC, FO.nonPayees].join('/'), '7/7/7');
  window.PLANNING_ENTRIES.Jean[2026][9] = { 5: T('08:00', '19:00'), 6: T('08:00', '19:00'), 7: T('08:00', '19:00') };
  window.PLANNING_HSUP.Jean['2026-10'] = { demande: true, paye: 9 };
  FO = R._planPaieMois(J, 9);
  eq('Y5 · octobre a 9h sup : elles reprennent d’abord les 7h reportées — rien de retenu, 3h24 payées (1h à 50 %, 2h24 à 25 %)', [FO.report.retNC, FO.nonPayees, Math.round(FO.payeTotal * 100) / 100].join('/'), '0/0/3.4');
  domaine({ ent: { 8: { 8: inj } } });
  horloge(2026, 8, 24);
  window.PLANNING_HSUP.Jean = { '2026-09': { fige: R._planFigeInstantane(J, 8) } };
  eq('Y6 · septembre figé avec 7h retenues', R._planHsupFige('Jean', 8).retenue, 7);
  window.PLANNING_ENTRIES.Jean[2026][8][8] = { absent: true, motif: 'arret' };
  horloge(2026, 9, 1);
  FY = R._planPaieMois(J, 8); FO = R._planPaieMois(J, 9);
  eq('Y7 · l’absence devient un arrêt après l’envoi : septembre garde 7h retenues, octobre les rend', [FY.nonPayees, FY.reportSuivant, FO.report.rendre, FO.report.aRendre].join('/'), '7/-7/7/7');
  eq('Y8 · le cadre d’octobre : « Retenue de septembre à rendre : 7h »', [clE(R._pfCadre(J, FO), 'rendre').l, clE(R._pfCadre(J, FO), 'rendre').v].join('/'), 'Retenue de septembre \u00e0 rendre/7h');
  eq('Y9 · le cadre de septembre dit l’envoi dans son en-tête', R._pfCadre(J, FY).indexOf('Septembre 2026 \u00b7 fig\u00e9 le 24/09/2026') !== -1, true);
  delete window.PLANNING_HSUP.Jean['2026-09'].fige;
  eq('Y10 · défigé : septembre redevient vivant, octobre n’a plus de report', [R._planPaieMois(J, 8).nonPayees, R._planPaieMois(J, 9).report.rendre].join('/'), '0/0');
  domaine({ ent: { 8: Object.assign({ 8: inj }, plus3) }, hsup: { '2026-09': { demande: true, paye: 12 } } });
  horloge(2026, 8, 24);
  window.PLANNING_HSUP.Jean['2026-09'].fige = R._planFigeInstantane(J, 8);
  horloge(2026, 9, 1);
  eq('Y11 · figé sans rien changer : mêmes chiffres, rien ne passe', [Math.round(R._planPaieMois(J, 8).payeTotal * 100) / 100, R._planPaieMois(J, 8).reportSuivant, R._planPaieMois(J, 9).report.ret].join('/'), '6.4/0/0');
  inv('Y12', 9);
  pages.length = 0; window._planReleveIndiv('Jean', 8);
  eq('Y13 · le relevé porte la date d’envoi', (pages[0] ? pages[0].html : '').indexOf('<span>Transmis \u00e0 la compta le 24/09/2026</span>') !== -1, true);
  // Z. PAIE-1 (§154) — la demande est un total ; le salarié d'abord, aussi dans la semaine ; « Pour la compta »
  horloge(2026, 9, 19);
  //    Lundi 14 écourté par le domaine (1h), mardi 15 écourté par le salarié (1h), samedi 19 : 1h en plus. Compteur vide.
  domaine({ ent: { 8: { 14: Object.assign(T('08:00', '14:00'), { reduit_motif: 'domaine' }), 15: Object.assign(T('08:00', '14:00'), { reduit_motif: 'perso' }), 19: T('08:00', '09:00') } } });
  const ZH = R._planHsupMois(J, 8), ZC = R._planCompteur(J, 8);
  eq('Z1 · dans la semaine, l’heure en plus rattrape d’abord l’absence du salarié', [ZH.rattrape.retire, ZH.rattrape.domaine, ZH.retire, ZH.domaine].join('/'), '1/0/0/1');
  eq('Z2 · aucune retenue ; l’heure du domaine va aux heures à rattraper', [ZC.rows[8].retenue, ZC.dette].join('/'), '0/1');
  //    30h demandées quand le mois a 10h sup ; puis le vendredi 11 devient une absence injustifiée, que la semaine rattrape.
  const neuf = { 7: T('08:00', '18:00'), 8: T('08:00', '18:00'), 9: T('08:00', '18:00'), 10: T('08:00', '18:00'), 11: T('08:00', '18:00') };
  const dep40 = () => { const o = {}; o[R._an() + '-dep'] = { solde: 40, date: '2026-01-01' }; return o; };
  domaine({ ent: { 8: Object.assign({}, neuf) }, hsup: Object.assign(dep40(), { '2026-09': { demande: true } }) });
  const recZ = window.PLANNING_HSUP.Jean['2026-09'], eZ = R._planPayeEcrire(J, 8, recZ, 30);
  eq('Z3 · la saisie garde le total : 30h, rien de converti', [recZ.paye, recZ.paye_bank, eZ.h, eZ.reste].join('/'), '30/0/30/0');
  window.PLANNING_ENTRIES.Jean[2026][8][11] = { absent: true, motif: 'injustifie' };
  let FZ = R._planPaieMois(J, 8);
  eq('Z4 · après l’absence : toujours 30h payées — 1h du mois, 29h du compteur ; 11h restent', [FZ.sup, FZ.payeTotal, FZ.payeMois, FZ.payeBank, Math.round(R._pfRestants(J, FZ).total * 100) / 100].join('/'), '1/30/1/29/11');
  eq('Z5 · la feuille dit le total, à la demande du salarié', clE(R._pfCadre(J, FZ), 'sup').p.indexOf('30h en tout, \u00e0 la demande du salari\u00e9') !== -1, true);
  inv('Z5b', 8);
  //    Une saisie d'avant ce lot (10h du mois + 20h de récup) se relit comme un total.
  domaine({ ent: { 8: Object.assign({}, neuf, { 11: { absent: true, motif: 'injustifie' } }) }, hsup: Object.assign(dep40(), { '2026-09': { demande: true, paye: 10, paye_bank: 20 } }) });
  FZ = R._planPaieMois(J, 8);
  eq('Z6 · saisie d’avant (10h + 20h de récup), heures sup tombées à 1h : 30h payées, pas 21h', [FZ.payeTotal, FZ.payeDem].join('/'), '30/30');
  //    Un mois figé garde ce que le compteur a payé à l'envoi, même si ses heures sup baissent ensuite.
  horloge(2026, 9, 24);
  domaine({ ent: { 8: Object.assign({}, neuf) }, hsup: Object.assign(dep40(), { '2026-09': { demande: true, paye: 30 } }) });
  window.PLANNING_HSUP.Jean['2026-09'].fige = R._planFigeInstantane(J, 8);
  eq('Z7 · l’instantané garde la part du compteur : 20h', window.PLANNING_HSUP.Jean['2026-09'].fige.spill, 20);
  window.PLANNING_ENTRIES.Jean[2026][8][11] = { absent: true, motif: 'injustifie' };
  horloge(2026, 10, 1);
  FZ = R._planPaieMois(J, 8);
  eq('Z8 · figé puis absent : septembre garde ses 30h payées (10h du mois, 20h du compteur)', [FZ.payeTotal, FZ.payeMois, FZ.payeBank].join('/'), '30/10/20');
  inv('Z9', 9);
  //    Le détail de l'année sépare la récup prise des absences reprises.
  horloge(2026, 9, 19);
  domaine({ ent: { 8: moisFiche } });
  const AZ = R._pfAnnee(J, 8);
  eq('Z10 · septembre : récup prise et absences comptées à part, leur somme ferme la ligne', [AZ[8].recPrise > 0.01, AZ[8].abs > 0.01, Math.abs(AZ[8].recup - AZ[8].recPrise - AZ[8].abs) < 1e-6].join('/'), 'true/true/true');
  //    Le cadre : toujours les mêmes lignes, dans le même ordre ; « aucun » quand il n'y a rien ; le papier dit la même chose.
  window.PLANNING_ACOMPTES.Jean = { '2026-09': [{ date: '2026-09-15', montant: 300, note: 'Avance demandée' }] };
  const cZ = R._pfCadre(J, R._planPaieMois(J, 8));
  sain('Z11 cadre', cZ);
  eq('Z11 · cinq lignes dans l’ordre : salaire, heures sup, congés, arrêt, acompte', (cZ.match(/<div class="pf-cl pf-cl-(\w+)/g) || []).map(x => x.replace('<div class="pf-cl pf-cl-', '')).join(','), 'base,sup,cp,arret,acompte');
  eq('Z12 · congés payés les 24 et 25, acompte de 300 € versé le 15', [clE(cZ, 'cp').v, clE(cZ, 'cp').p.indexOf('Les 24 et 25') !== -1, clE(cZ, 'acompte').v, clE(cZ, 'acompte').p].join('/'), '2 jours/true/300\u202f\u20ac/Vers\u00e9 le 15/9.');
  eq('Z13 · « aucun » pour l’arrêt ; la ligne du mois s’additionne', [clE(cZ, 'arret').v, cZ.indexOf('154h pr\u00e9vues, 149h faites') !== -1].join('/'), 'aucun/true');
  pages.length = 0; window._planReleveIndiv('Jean', 8);
  const rZ = pages[0] ? pages[0].html : '';
  eq('Z14 · le relevé dit la même chose que l’écran, sur deux pages', [clP(rZ, 'base').v, clP(rZ, 'cp').v, clP(rZ, 'acompte').v, (rZ.match(/<section class="pg/g) || []).length].join('/'), [clE(cZ, 'base').v, clE(cZ, 'cp').v, clE(cZ, 'acompte').v, 2].join('/'));
  window.PLANNING_ACOMPTES.Jean = {};
  horloge();

  // ═══ AA. TAUX-1 (20/09/2026) — ce qui se prend en TEMPS part du taux le plus fort ; ce qui se PAIE, du plus bas ═══
  // Octobre 2026 : la semaine du 5 porte +12h (lundi → jeudi 08:00 → 19:00 = 10h), soit 8h à 25 % et 4h à 50 %.
  const plus12 = { 5: T('08:00', '19:00'), 6: T('08:00', '19:00'), 7: T('08:00', '19:00'), 8: T('08:00', '19:00') };
  const tranches = c => c.tr.map(t => t.taux + t.nat + ':' + Math.round(t.h / (1 + t.taux / 100) * 100) / 100).join(' ');
  domaine({ ent: { 9: Object.assign({}, plus12, { 13: { absent: true, motif: 'injustifie' } }) } });
  let CA = R._planCompteur(J, 9);
  eq('AA1 · +12h une semaine, 7h injustifiées une autre : les 4h à 50 % partent d’abord, il reste 7h12 à 25 % (avant : 2h24 à 25 %, 4h à 50 %)', tranches(CA), '25hs:7.2');
  eq('AA2 · … la valeur reprise ne change pas : 7h, solde 9h, aucune retenue', [CA.rows[9].valAbs, CA.solde, CA.rows[9].retenue].join('/'), '7/9/0');
  domaine({ ent: { 9: Object.assign({}, plus12, { 13: { type: 'recup' } }) } });
  CA = R._planCompteur(J, 9);
  eq('AA3 · une récup prise part aussi du 50 % d’abord', [tranches(CA), CA.rows[9].valRec].join('/'), '25hs:7.2/7');
  domaine({ ent: { 9: Object.assign({}, plus12) }, hsup: { '2026-10': { demande: true, paye: 5 } }, config: { hsup_mode: 'paye' } });
  CA = R._planCompteur(J, 9);
  eq('AA4 · un paiement prend aussi le 50 % d’abord (« toujours le taux le plus haut sort en 1er ») : 5h payées = 4h à 50 % + 1h à 25 %, restent 7h à 25 %', [CA.rows[9].payes.map(q => q.taux + ':' + q.brut).join(), tranches(CA)].join('/'), '25:1,50:4/25hs:7');
  domaine({ ent: { 8: { 15: Object.assign(T('08:00', '12:00'), { reduit_motif: 'domaine' }) }, 9: Object.assign({}, plus12) } });
  CA = R._planCompteur(J, 9);
  // (08:00 → 12:00 fait 4h : 3h écourtées, pas 4 — le piège de T2, §142d.)
  eq('AA5 · les 3h à rattraper de septembre sont comblées par le 50 % d’octobre (3h = 2h à 50 %) : restent 8h à 25 % et 2h à 50 %', [CA.rows[8].dette, CA.rows[9].dette, tranches(CA)].join('/'), '3/0/25hs:8 50hs:2');
  domaine({ ent: { 7: { 3: T('08:00', '19:00') }, 9: Object.assign({}, plus12, { 13: { absent: true, motif: 'injustifie' } }) } });
  CA = R._planCompteur(J, 9);
  eq('AA6 · entre deux mois, le plus ancien d’abord : les 3h d’août (3h45 depuis AVANT-2) passent avant le 50 % d’octobre', tranches(CA), '25hs:8 50hs:1.83');
  // Le détail de l'année : la ligne tombe juste, dans l'unité du compteur
  domaine({ ent: { 8: moisFiche, 9: Object.assign({}, plus12, { 13: { absent: true, motif: 'injustifie' }, 20: { type: 'recup' } }) }, hsup: { '2026-10': { demande: true, paye: 2 } }, config: { hsup_mode: 'paye' } });
  const AA = R._pfAnnee(J, 9);
  let justes = true;
  AA.forEach((x, i) => { const av = i ? AA[i - 1].soldeRecup : 0; if (Math.abs(av + x.gagnee - x.priseV - x.absV - x.payeCV - x.soldeRecup) > 1e-6) justes = false; });
  eq('AA7 · chaque mois : récup restante = celle d’avant + gagnée − prise − absences − payé sur le compteur', justes, true);
  eq('AA8 · octobre : 7h de récup prise et 7h d’absence s’impriment 7h et 7h (plus « 4h40 » et « 5h36 »)', [AA[9].priseV, AA[9].absV].join('/'), '7/7');
  pages.length = 0; window._planReleveIndiv('Jean', 9);
  const rA = pages[0] ? pages[0].html : '';
  eq('AA9 · le relevé : les en-têtes du détail de l’année, et plus de colonne « en repos »', [rA.indexOf('<th class="n rc">R\u00e9cup<br>restante</th><th class="n">Heures \u00e0<br>rattraper</th>') !== -1, rA.indexOf('>en repos<')].join('/'), 'true/-1');
  eq('AA10 · « Les heures sup d’octobre », pas « de octobre »', [rA.indexOf('Les heures sup d\u2019octobre') !== -1, rA.indexOf('de octobre')].join('/'), 'true/-1');
  eq('AA11 · une récup n’est pas « payée » : « prise sur la récup »', [rA.indexOf('R\u00e9cup <i>prise sur la r\u00e9cup</i>') !== -1, rA.indexOf('R\u00e9cup <i>pay\u00e9e</i>')].join('/'), 'true/-1');
  eq('AA12 · la semaine finit « au 1er novembre »', rA.indexOf('au 1er novembre') !== -1, true);
  domaine({ ent: { 9: { 7: { absent: true, motif: 'injustifie' }, 10: T('08:00', '16:00') } } });
  pages.length = 0; window._planReleveIndiv('Jean', 9);
  const rB = pages[0] ? pages[0].html : '';
  eq('AA13 · un samedi qui rattrape : la semaine dit « heure pour heure : ce ne sont pas des heures sup »', rB.indexOf('rattrapent 7h d\u2019absence, heure pour heure\u00a0: ce ne sont pas des heures sup') !== -1, true);
  domaine({ ent: { 9: { 7: { absent: true, motif: 'injustifie' }, 11: T('08:00', '13:00') } } });
  pages.length = 0; window._planReleveIndiv('Jean', 9);
  const rC = pages[0] ? pages[0].html : '';
  eq('AA14 · un dimanche qui rattrape garde sa majoration seule, dite sur sa ligne', /majoration seule[^<]*5h de rattrapage</.test(rC), true);

  // ═══ AB. DIM-1 (20/09/2026) — en mode payé, la majoration seule d'un dimanche couvre d'abord les absences ═══
  // Nico : « trouve la solution, mais ça ne doit pas l'être » — une retenue et une majoration à payer sur la même feuille.
  const payeC = { hsup_mode: 'paye' }, injB = { absent: true, motif: 'injustifie' };
  const mj = L => (L || []).map(x => x.taux + x.nat + ':' + Math.round(x.h * 100) / 100).join(' ');
  // Octobre 2026 : 7h injustifiées le mercredi 7, 5h le dimanche 11 (08:00 → 13:00) — il rattrape 5h, garde 2h30 de majoration.
  domaine({ ent: { 9: { 7: injB, 11: T('08:00', '13:00') } }, config: payeC });
  let PB = R._planPaieMois(J, 9);
  eq('AB1 · 2h d’absence restent : la majoration (2h30) les couvre, aucune retenue, 1h à +50 % reste à payer (avant : 2h retenues ET 5h de majoration payées)', [PB.nonPayees, mj(PB.majPayee), PB.majAbsV, PB.c.solde].join('/'), '0/50dim:1/2/0');
  inv('AB2 · mode payé, majoration absorbée', 9);
  let cB = R._pfCadre(J, PB);
  eq('AB3 · le cadre : aucune retenue, « 1h le dimanche », et il dit ce que la majoration a couvert', [clE(cB, 'base').v, tx(cB, '1h', 'le dimanche, \u00e0 +50\u202f%'), cB.indexOf('2h de majoration ont d\u2019abord couvert les absences') !== -1].join('/'), 'Aucune retenue/true/true');
  domaine({ ent: { 9: { 6: injB, 7: injB, 11: T('08:00', '13:00') } }, config: payeC });
  PB = R._planPaieMois(J, 9); cB = R._pfCadre(J, PB);
  eq('AB4 · 9h d’absence restent : la majoration y passe en entier, 6h30 retenues, RIEN à payer', [PB.nonPayees, mj(PB.majPayee), PB.majAbsV, clE(cB, 'base').v, clE(cB, 'maj').v].join('/'), '6.5//2.5/Retenue de 6h30/aucune');
  eq('AB4b · la feuille dit ce que la majoration a couvert : le cadre, et le jour par jour', [(clE(cB, 'base').p || '').indexOf('2h30 couvertes par la majoration du dimanche') !== -1, (clE(cB, 'maj').p || '').indexOf('La majoration du dimanche (2h30) couvre d\u2019abord les absences') !== -1, PB.jours.filter(x => !x.hors).reduce((a, x) => a + (x.surMaj || 0), 0)].join('/'), 'true/true/2.5');
  domaine({ ent: { 9: { 11: T('08:00', '13:00') } }, tpl: t => { t[9][11] = 5; }, config: payeC });
  PB = R._planPaieMois(J, 9);
  eq('AB5 · un dimanche PRÉVU, sans absence : les 5h de majoration se paient comme avant', [mj(PB.majPayee), PB.majAbsV, PB.nonPayees].join('/'), '50dim:5/0/0');
  domaine({ ent: { 9: { 7: injB, 11: T('08:00', '13:00') } } });
  PB = R._planPaieMois(J, 9);
  eq('AB6 · mode récup : rien ne change — la majoration entre au compteur et couvre l’absence, reste 0h30', [PB.nonPayees, mj(PB.majPayee), PB.c.solde].join('/'), '0//0.5');
  // Figé : la majoration partie à la compta est un fait ; ce qui naît ensuite passe au mois suivant, où les absences passent d'abord.
  horloge(2026, 10, 24);
  domaine({ ent: { 9: { 7: injB, 11: T('08:00', '13:00') } }, config: payeC });
  window.PLANNING_HSUP.Jean = { '2026-10': { fige: R._planFigeInstantane(J, 9) } };
  eq('AB7 · l’instantané fige la majoration PAYÉE (1h), pas la majoration travaillée (5h)', mj(window.PLANNING_HSUP.Jean['2026-10'].fige.maj), '50dim:1');
  eq('AB8 · figé sans rien changer : mêmes chiffres, rien ne passe', [mj(R._planPaieMois(J, 9).majPayee), R._planPaieMois(J, 9).reportSuivant, mj(R._planPaieMois(J, 10).report.maj)].join('/'), '50dim:1/0/');
  window.PLANNING_TEMPLATES[2026].standard[9][18] = 4; window.PLANNING_ENTRIES.Jean[2026][9][18] = T('08:00', '12:00');   // et un dimanche prévu, tenu : 4h de majoration seule nées après l'envoi
  horloge(2026, 11, 2);
  let PN = R._planPaieMois(J, 10);
  eq('AB9 · la majoration née après l’envoi (4h à +50 %) passe sur novembre, qui la paie', [mj(R._planPaieMois(J, 9).majPayee), mj(PN.report.maj), PN.nonPayees].join('/'), '50dim:1/50dim:4/0');
  window.PLANNING_ENTRIES.Jean[2026][10] = { 4: Object.assign(T('08:00', '15:00'), { reduit_motif: 'perso' }) };          // 1h manquée par le salarié en novembre
  PN = R._planPaieMois(J, 10);
  eq('AB10 · … sauf si novembre a une absence : elle passe d’abord (1h), il reste 2h à +50 % à payer, rien de retenu', [mj(PN.report.maj), PN.nonPayees].join('/'), '50dim:2/0');
  horloge();
  // Tirages : jamais une retenue à côté d'un paiement — heures sup, majoration du mois, majoration reportée.
  let graine = 20260920; const alea = () => (graine = (graine * 1103515245 + 12345) % 2147483648) / 2147483648;
  let fautes = 0, vus = 0;
  for (let k = 0; k < 140; k++) {
    const e = {};
    for (let d = 5; d <= 25; d++) {
      const w = new Date(2026, 9, d).getDay(), a = alea();
      if (w === 0) { if (a < 0.45) e[d] = T('08:00', a < 0.2 ? '12:00' : '15:00'); continue; }
      if (w === 6) { if (a < 0.2) e[d] = T('08:00', '12:00'); continue; }
      if (a < 0.14) e[d] = injB; else if (a < 0.24) e[d] = Object.assign(T('08:00', '13:00'), { reduit_motif: a < 0.19 ? 'domaine' : 'perso' });
      else if (a < 0.42) e[d] = T('08:00', a < 0.3 ? '19:00' : '18:00'); else if (a < 0.46) e[d] = { type: 'recup' };
    }
    domaine({ ent: { 9: e }, hsup: alea() < 0.6 ? { '2026-10': { demande: true, paye: 60 } } : {}, tpl: alea() < 0.3 ? t => { t[9][11] = 4; t[9][18] = 4; } : null, config: payeC });
    const Pk = R._planPaieMois(J, 9), b = R._planBank(J, 9), y = R._planYearBalance(J, 9);
    if (Pk.nonPayees > 0.0001) { vus++; if (Pk.payeTotal > 0.0001 || (Pk.majPayee || []).length || (Pk.report.maj || []).length) { fautes++; if (process.env.MV_DBG) console.log('DBG retenue+paiement', k, Pk.nonPayees, Pk.payeTotal, mj(Pk.majPayee)); } }
    // L'invariant vaut « tant qu'aucune récup ne dépasse » (§135c) : une récup prise sur un compteur vide est signalée à part (recupNC).
    if (Pk.recupNC < 0.0001 && Math.abs(b.solde - b.dette - y.net) > 1e-6) { fautes++; if (process.env.MV_DBG) console.log('DBG invariant', k, b.solde, b.dette, y.net, JSON.stringify(y)); }
  }
  eq('AB11 · 140 mois tirés au hasard en mode payé : jamais une retenue à côté d’un paiement, et le compteur tombe juste (dont ' + (vus > 20 ? 'plus de 20' : vus) + ' avec retenue)', [fautes, vus > 20].join('/'), '0/true');

  // ═══ AC. AVANT-2 (20/09/2026) — à la bascule, les heures sup d'avant septembre encore au compteur prennent leur majoration ═══
  // La capture de Nico : 27h en août (semaine du 3 : +15h ; semaine du 10 : +12h → 16h à 25 %, 11h à 50 %), 13h30 d'absences en septembre.
  const aout27 = Object.assign(hj('08:00', '19:00', [3, 4, 5, 6, 7]), hj('08:00', '19:00', [10, 11, 12, 13]));
  const sept135 = { 8: { absent: true, motif: 'injustifie' }, 9: Object.assign(T('08:00', '08:30'), { reduit_motif: 'perso' }) };
  domaine({ ent: { 7: aout27, 8: sept135 } });
  let CV = R._planCompteur(J, 7), CS = R._planCompteur(J, 8);
  eq('AC1 · août, vu d’août : rien ne bouge — 27h faites, 27h au compteur, aucune revalorisation', [CV.rows[7].sup, CV.solde, CV.rows[7].revalo || 0, tranches(CV)].join('/'), '27/27/0/0hs:27');
  eq('AC2 · septembre : le stock prend sa majoration (+9h30 : 16h à 25 %, 11h à 50 %), les 13h30 d’absences partent du 50 %, restent 23h (avant : 13h30)', [CS.rows[8].revalo, CS.rows[8].valAbs, CS.rows[8].retenue, CS.solde, tranches(CS)].join('/'), '9.5/13.5/0/23/25hs:16 50hs:2');
  eq('AC3 · … et août, relu depuis septembre, garde ses chiffres (une paie éditée ne change pas)', [CS.rows[7].sup, CS.rows[7].entre, CS.rows[7].solde].join('/'), '27/27/27');
  inv('AC4 · après la revalorisation', 8);
  const AN2 = R._pfAnnee(J, 8); let justes2 = true;
  AN2.forEach((x, i) => { if (i > 8) return; const av = i ? AN2[i - 1].soldeRecup : 0; if (Math.abs(av + x.gagnee - x.priseV - x.absV - x.payeCV - x.soldeRecup) > 1e-6) justes2 = false; });
  eq('AC5 · le détail de l’année tombe juste : septembre « gagne » les 9h30, août porte son astérisque', [justes2, AN2[8].gagnee, AN2[8].revalo, AN2[7].act].join('/'), 'true/9.5/9.5/false');
  pages.length = 0; window._planReleveIndiv('Jean', 8);
  const rAC = pages[0] ? pages[0].html : '';
  eq('AC6 · le relevé : « 27h* » en août, la légende dit la règle d’avant et où la majoration est entrée, le compteur a sa ligne', [rAC.indexOf('<td class="n cv">27h*</td>') !== -1,
    rAC.indexOf('* Avant septembre 2026, le compteur comptait 1h sup = 1h de r\u00e9cup\u00a0; les heures encore au compteur ont pris leur majoration en septembre (+9h30, dans sa r\u00e9cup gagn\u00e9e).') !== -1,
    rAC.indexOf('Majoration des heures sup d\u2019avant septembre, rest\u00e9es au compteur</td><td class="n pos">+9h30') !== -1 || rAC.indexOf('Majoration des heures sup d\u2019avant septembre, rest\u00e9es au compteur') !== -1].join('/'), 'true/true/true');
  // Ce qui reste à 1 pour 1 : le report d'avant Ma Vigne, et les heures d'un dimanche déjà majorées à part
  domaine({ ent: { 6: { 12: T('08:00', '17:00') } }, hsup: { '2026-dep': { solde: 10, date: '2026-01-01' } } });
  CS = R._planCompteur(J, 8);
  eq('AC7 · le report d’avant Ma Vigne (10h) et un dimanche de juillet (8h + ses 4h de majoration) : rien à majorer une seconde fois', [CS.rows[8].revalo, CS.solde, tranches(CS)].join('/'), '0/22/0dep:10 0hs:8 0maj:4');
  // Une récup prise en août a déjà entamé le stock : seul ce qui RESTE est majoré
  domaine({ ent: { 7: Object.assign({}, aout27, { 20: { type: 'recup' } }) } });
  CS = R._planCompteur(J, 8);
  eq('AC8 · 7h de récup prises en août, 1h pour 1h à l’époque : restent 20h (16h à 25 %, 4h à 50 %), majorées de 6h', [R._planCompteur(J, 7).solde, CS.rows[8].revalo, CS.solde, tranches(CS)].join('/'), '20/6/26/25hs:16 50hs:4');
  // Mode payé : même règle
  domaine({ ent: { 7: aout27, 8: sept135 }, config: { hsup_mode: 'paye' } });
  CS = R._planCompteur(J, 8);
  eq('AC9 · mode payé : le stock gardé d’avant septembre prend la même majoration', [CS.rows[8].revalo, CS.solde].join('/'), '9.5/23');
  // ═══ AD. DIMAV-1 (22/09/2026) — avant septembre, la majoration du dimanche et du férié va au compteur, quel que soit le mode ═══
  // Nico : « lis ce qu'il y a d'écrit sur le planning de chacun […] une ligne visible du nombre d'heures effectuées ces jours-là,
  //   mois par mois, et ce que ça ajoute en temps de repos réel ». En mode payé, un dimanche de juillet (8h, rien de prévu) donnait
  //   8h au compteur et sa majoration n'allait nulle part : Ma Vigne n'éditait pas ces paies.
  domaine({ ent: { 6: { 12: T('08:00', '17:00') } }, config: { hsup_mode: 'paye' } });
  CS = R._planCompteur(J, 8);
  eq('AD1 · mode payé, un dimanche de juillet (8h) : 8h + 4h de majoration au compteur, en juillet (avant : 8h)', [CS.rows[6].majDim, CS.rows[6].solde, CS.rows[8].revalo || 0, CS.solde, tranches(CS)].join('/'), '4/12/0/12/0hs:8 0maj:4');
  eq('AD2 · … et depuis septembre, en mode payé, la majoration part toujours à la paie', [R._planMajAuCompteur(6), R._planMajAuCompteur(8)].join('/'), 'true/false');
  inv('AD3 · invariant', 8);
  const AN3 = R._pfAnnee(J, 8);
  eq('AD4 · le détail de l’année lit le dimanche au planning : 8h, +4h de repos', [AN3[6].hDim, AN3[6].hFer, AN3[6].majDF, AN3[6].majCpt, AN3[6].gagnee].join('/'), '8/0/4/true/12');
  pages.length = 0; window._planReleveIndiv('Jean', 8);
  const rAD = pages[0] ? pages[0].html : '';
  eq('AD5 · le relevé a son tableau : « Dimanches et jours fériés travaillés avant septembre 2026 », juillet 8h, +4h',
    [rAD.indexOf('<h4 class="st">Dimanches et jours f\u00e9ri\u00e9s travaill\u00e9s avant septembre 2026</h4>') !== -1,
     rAD.indexOf('<tr><td>Juil</td><td class="n">8h</td><td class="n"></td><td class="n cv b">+4h</td></tr>') !== -1,
     rAD.indexOf('<tr class="tot"><td>Total</td><td class="n">8h</td><td class="n">0h</td><td class="n cv">+4h</td></tr>') !== -1].join('/'), 'true/true/true');
  const tH = R._planHsupTable(J) || '';
  eq('AD6 · l’écart au planning mois par mois a sa colonne « Dim. et fériés » et la majoration de juillet', [tH.indexOf('<th>Dim. et<br>f\u00e9ri\u00e9s</th>') !== -1, tH.indexOf('title="8h le dimanche \u2014 majoration 4h en repos"') !== -1, tH.indexOf('>+4h</span>') !== -1].join('/'), 'true/true/true');
  // Mode récup : rien ne change
  domaine({ ent: { 6: { 12: T('08:00', '17:00') } } });
  eq('AD7 · mode récup : pareil qu’avant (8h + 4h)', R._planCompteur(J, 8).solde, 12);
  domaine({ ent: { 8: moisFiche } });

  return { ok, ko, echecs };
}

// ── Contre-epreuves ─────────────────────────────────────────────────────────
const DEFAUTS = [
  // DIMAV-1 (§167)
  ["DIMAV-1 · avant septembre, en mode payé, la majoration du dimanche ne va nulle part", "function _planMajAuCompteur(m){return !_planHsupPayable()||!_planRecupActive(m);}", "function _planMajAuCompteur(m){return !_planHsupPayable();}"],
  ["DIMAV-1 · le relevé perd le tableau des dimanches et fériés", "+(AT.df?'<h4 class=\"st\">'", "+(false?'<h4 class=\"st\">'"],
  ["DIMAV-1 · le planning perd la colonne des dimanches et fériés", "dfA[_dm]=_mjm.hDim+_mjm.hFer;", "dfA[_dm]=0;"],
  // AVANT-2 (§161)
  ["AVANT-2 · le stock d’avant septembre reste à 1 pour 1", "      if(!revaloFaite){revaloFaite=true;r.revalo=revalorise();}", "      if(!revaloFaite){revaloFaite=true;r.revalo=0;}"],
  ["AVANT-2 · la majoration du stock n’entre pas dans ce que le mois apporte", "var entre=ent.reduce(function(s,e){return s+e.h;},0)+(r.revalo||0);", "var entre=ent.reduce(function(s,e){return s+e.h;},0);"],
  ["AVANT-2 · un dimanche déjà majoré à part l’est une seconde fois", "gain+=e.c25*0.25+e.c50*0.5;t.h=Math.max(0,t.h-e.c25-e.c50);", "gain+=e.c25*0.25+e.c50*0.5+e.deja*0.5;neuves.push({mois:t.mois,taux:50,nat:'hs',h:e.deja*1.5});t.h=Math.max(0,t.h-e.c25-e.c50-e.deja);"],
  ["AVANT-2 · le report d’avant Ma Vigne est majoré sans qu’on sache rien de ses semaines", "if(t.mois<0||t.nat!=='hs'||", "if(t.nat!=='hs'&&t.nat!=='dep'||"],
  ["AVANT-2 · août perd son astérisque", "+((!x.act&&x.gagnee>0.0001)?'*':'')+", "+"],
  ["AVANT-2 · la légende redit « majoration comprise » sans la règle d’avant", "    +(avantB?'* Avant '", "    +(false?'* Avant '"],
  // CLAIR-1 (§160)
  ["CLAIR-1 · le salaire de base redit « Maintenu »", "'Retenue de '+F(ret):'Aucune retenue'", "'Retenue de '+F(ret):'Maintenu'"],
  // ⚰️ AVANT-2 : « les heures d'avant ne rejoignent plus la case de leur taux » visait `av.c25+=SP.est.c25` — du code MORT depuis que
  //   le stock est majoré à la bascule (dans un mois `act`, l'estimation ne rend plus que du « déjà majoré »). Ligne retirée, avec elle.
  ["CLAIR-1 · la case ne dit plus d’où viennent ses heures", "return (a>0.0001&&b>0.0001)?F(a)+' du mois + '+F(b)+' d\\u2019avant':", "return (a>0.0001&&b>0.0001)?'':"],
  ["CLAIR-1 · une case à zéro disparaît", "boite('\\u00e0 +25\\u202f%',t25,origine(mo.c25,av.c25))+", "(t25>0.0001?boite('\\u00e0 +25\\u202f%',t25,origine(mo.c25,av.c25)):'')+"],
  ["CLAIR-1 · les dimanches d’avant septembre sortent des restantes", "h:e.deja||0,v:e.deja||0,avant:0,note:", "h:0,v:0,avant:0,note:"],
  ["CLAIR-1 · « déjà majorées » revient", "' d\\u2019un dimanche ou d\\u2019un f\\u00e9ri\\u00e9, \\u00e0 payer sans majoration (elle est d\\u00e9j\\u00e0 dans la r\\u00e9cup)'", "' un dimanche ou un f\\u00e9ri\\u00e9, d\\u00e9j\\u00e0 major\\u00e9es'"],
  // DIM-1 (§159)
  ["DIM-1 · la majoration seule se paie de nouveau sans regarder les absences", "var T0=tr[ord[q]],pris=Math.min(T0.h,h);", "var T0=tr[ord[q]];if(T0.aPayer)continue;var pris=Math.min(T0.h,h);"],
  ["DIM-1 · la majoration seule n’entre plus au compteur le temps du calcul", "      majTr.forEach(function(t){ent.push(t);});", ""],
  ["DIM-1 · l’instantané fige la majoration travaillée, pas la majoration payée", "maj:_planHsupPayable()?(P.majPayee||[]).map(", "maj:_planHsupPayable()?(P.majSeule||[]).map("],
  ["DIM-1 · la majoration née après l’envoi ne passe plus au mois suivant", "      repMaj=suiteMaj||[];", "      repMaj=[];"],
  ["DIM-1 · la part couverte par la majoration redevient « prise sur la récup »", "var pR=Math.min(p,rcRec);rcRec-=pR;", "var pR=p;"],
  ["DIM-1 · le cadre réimprime la majoration travaillée", "    var MJ=(P.majPayee||[]).filter(", "    var MJ=(P.majSeule||[]).filter("],
  ["TAUX-1 · le paiement du mois reprend le 25 % d’abord", "return (hm.buckets[b].taux-hm.buckets[a].taux)||(a-b);", "return (hm.buckets[a].taux-hm.buckets[b].taux)||(a-b);"],
  ["TAUX-1 · l’estimation d’avant septembre range sa pile dans l’ancien sens", "couches:[['deja',L.deja],['c25',L.c25+ex],['c50',L.c50]]", "couches:[['c50',L.c50],['c25',L.c25+ex],['deja',L.deja]]"],
  // TAUX-1 (§159)
  ["TAUX-1 · une absence reprend le taux le plus bas d’abord", "return (tr[a].mois-tr[b].mois)||((tr[b].taux||0)-(tr[a].taux||0))||(a-b);", "return (tr[a].mois-tr[b].mois)||(a-b);"],
  ["TAUX-1 · le taux le plus fort passe avant le mois le plus ancien", "return (tr[a].mois-tr[b].mois)||((tr[b].taux||0)-(tr[a].taux||0))||(a-b);", "return ((tr[b].taux||0)-(tr[a].taux||0))||(tr[a].mois-tr[b].mois)||(a-b);"],
  ["TAUX-1 · le détail de l’année reconvertit les absences en heures sup brutes", "r.valAbs=sA.reduce(function(a,q){return a+(q.v!=null?q.v:q.brut);},0);", "r.valAbs=sA.reduce(function(a,q){return a+q.brut;},0);"],
  ["TAUX-1 · « de octobre » revient", "function _pfDeMois(m){var n=PLAN_MOIS[m].toLowerCase();return (/^[aeiouyh]/.test(n)?'d\\u2019':'de ')+n;}", "function _pfDeMois(m){var n=PLAN_MOIS[m].toLowerCase();return 'de '+n;}"],
  ["TAUX-1 · une récup redevient « payée »", "st.push(x.payeType==='rec'?'prise sur la r\\u00e9cup':", "st.push(x.payeType==='rec'?'pay\\u00e9e':"],
  ["TAUX-1 · le rattrapage ne dit plus qu’il n’est pas majoré", "d\\u2019absence, heure pour heure\\u00a0: ce ne sont pas des heures sup';", "d\\u2019absence';"],
  // PAIE-1 (§154)
  ["PAIE-1 · dans la semaine, le domaine repasse avant le salarié", "[true,false].forEach(function(sal){js.forEach(function(y){if(((y.ec&&y.ec.cpt)==='retire')!==sal)return;", "[true].forEach(function(sal){js.forEach(function(y){"],
  ["PAIE-1 · un mois figé repaie le compteur selon ses heures sup d’aujourd’hui", "        spill=(typeof FG.spill==='number')?Math.max(0,FG.spill):0;", ""],
  ["PAIE-1 · « récupérées » mêle de nouveau la récup prise et les absences", "r.recupNC=tire(r.recup,sR);", "r.recupNC=tire(r.recup,sA);"],
  ["PAIE-1 · l’écran reprend l’ancien cadre, la retenue en petit sous le trio", "  if(P.act)return _pfCadreCompta(mbr,P,D);\n", ""],
  ["les heures manquées retirées au taux heures sup", "r.retire=hm2.retire;r.retenue=tire(hm2.retire,sA);", "r.retire=hm2.retire;r.retenue=tire(hm2.retire*1.25,sA);"],
  ['le seuil des 50 % oublié', "var r50=Math.max(0,totHs-PLAN_HS_RANG50);", "var r50=0;"],
  ['la majoration des heures sup oubliée', "\n          if(b.h-p>0.0001)ent.push({taux:b.taux,nat:b.nat,h:(b.h-p)*f});", "\n          if(b.h-p>0.0001)ent.push({taux:b.taux,nat:b.nat,h:(b.h-p)});"],
  ['dimanche et heures sup cumulés', "if(jm)seau(MH,tx,nj,Math.max(0,jm.h-y.hs),y.d);", "if(jm)seau(MH,tx,nj,jm.h,y.d);"],
  // ⚠️ Premiere version : on sautait le « return » des motifs neutres. Defaut INOPERANT — le
  //    motif n'avait toujours pas de destination et le calcul l'ignorait : le harnais restait
  //    vert sur un defaut qui n'en etait pas un. Le vrai defaut, c'est de lui en DONNER une.
  ['un arrêt retire des heures', "id:'arret',     ico:'pansement', nom:'Arr\\u00eat de travail',          sub:'Maladie, accident du travail',                     suspend:true,  assim:false, paye:true,  heures:false, cpt:''}",
    "id:'arret',     ico:'pansement', nom:'Arr\\u00eat de travail',          sub:'Maladie, accident du travail',                     suspend:true,  assim:false, paye:true,  heures:false, cpt:'retire'}"],
  ["la journée du domaine retenue sur la paie", "r.domaine=hm2.domaine+hm2.indet;r.compense=tire(r.domaine,sA);dette+=r.compense;", "r.domaine=hm2.domaine+hm2.indet;r.retenue+=tire(r.domaine,sA);"],
  ['la fenêtre de septembre 2026 supprimée', "var PLAN_RECUP_DEBUT='2026-09';", "var PLAN_RECUP_DEBUT='2026-01';"],
  ['la coupure comptée dans l’absence', "return Math.max(0,Math.min(jour,((y-x)-dans)/60));", "return Math.max(0,Math.min(jour,(y-x)/60));"],
  ["ce qui reste à rattraper n’est jamais comblé", "r.comble=dette-tire(dette,sA);dette-=r.comble;", "r.comble=0;"],
  // ⚰️ « le tableau d’année du relevé redit « Heures dues » après septembre » : retiré avec FICHE-2 — septembre
  //    n'imprime plus ce tableau. Le défaut visait un document que plus aucun mois actif ne produit.
  // RECUP-2
  ['on déclare 1h15 à la compta au lieu de l’heure brute', "hm.buckets.forEach(function(b){L.push([_planSeauNom(b),_planFmt(b.h*(1+b.taux/100)),_planFmt(b.h),tx(b.taux)]);});",
    "hm.buckets.forEach(function(b){L.push([_planSeauNom(b),_planFmt(b.h*(1+b.taux/100)),_planFmt(b.h*(1+b.taux/100)),tx(b.taux)]);});"],
  ['un paiement pris au compteur se déclare en temps de récup', "brut:pris/(1+(T0.taux||0)/100)", "brut:pris"],
  ['payé : la majoration d’un dimanche prévu part aussi au compteur', "if(!payMaj&&hm.majHsVal>0.0001)", "if(hm.majHsVal>0.0001)"],
  ['payer des heures brutes retire autant de récup, sans leur taux', "var f=1+t.taux/100,b=Math.min(t.h/f,reste);", "var f=1,b=Math.min(t.h/f,reste);"],
  // FICHE-1
  ['un congé payé se lit en heures manquées', "else if(e.type==='cp'){x.paye=_planDayH(plId,m,d,e);x.payeType='cp';}", "else if(e.type==='cp'){x.paye=0;x.payeType='cp';}"],
  ['la récup est payée même quand le compteur ne la couvre pas', "var q=act?Math.min(x.recupH,kc):x.recupH;", "var q=x.recupH;"],
  // FICHE-5
  ['le solde restant garde la majoration de la récup', "r.soldeBrut=tr.reduce(function(a,t){return a+t.h/(1+(t.taux||0)/100);},0);", "r.soldeBrut=tr.reduce(function(a,t){return a+t.h;},0);"],
  // FICHE-4
  // ⚰️ « sans toucher la récup prise » : retiré avec NET-1 (§150) — un paiement passe après les absences.
  ["le paiement ignore le compteur au-delà du mois (PAIE-1 : la demande fond avec les heures sup du mois)", "spill=act?Math.max(0,dem-sup):0;", "spill=0;"],
  // FICHE-3
  ['les heures restantes oublient leur taux', "b=t.h/(1+(t.taux||0)/100)", "b=t.h"],
  ["les heures payées sur le compteur ne rejoignent pas leur taux", "(r.payesBank||[]).forEach(function(q){var k=_pfCat(q.nat,q.taux||0);if(k in av)av[k]+=q.brut;});", ""],
  // ⚰️ CLAIR-1 : « le cadre réimprime les taux à zéro (PAIE-1) » — Nico demande désormais les trois totaux, toujours : le zéro
  //   s'imprime, en gris. Son inverse est gardé plus haut (« une case à zéro disparaît »).
  // FICHE-2
  ['le relevé de septembre retombe sur l’ancien', "if(_planRecupActive(planMonth)&&!(window._mvEstCollectif&&window._mvEstCollectif(mbr)))return _planReleveFiche_(nom,mbr,_ctr);", "if(false)return _planReleveFiche_(nom,mbr,_ctr);"],
  ['le relevé oublie les absences payées', "else if(x.paye>0.0001){abT=LIB[x.payeType]||'Pay\\u00e9e';abH=F(x.paye);st.push(x.payeType==='rec'?", "else if(false){abT=LIB[x.payeType]||'Pay\\u00e9e';abH=F(x.paye);st.push(x.payeType==='rec'?"],
  // ⚰️ idem, sa recherche par dichotomie a disparu avec elle.
  // SEM-1
  ['les heures sup se recomptent au jour', "var off=Math.min(totP,totM),r=off;", "var off=0,r=off;"],
  ['le 50 % repart de la 44e heure travaillée', "var r50=Math.max(0,totHs-PLAN_HS_RANG50);", "var r50=Math.min(totHs,Math.max(0,compte-43));"],
  ['une semaine à cheval se recoupe en deux', "      if(y.avant||!y.ec)return;", "      if(y.avant||!y.ec||y.m!==m)return;"],
  // ⚰️ « le 31 août compté deux fois » (la reprise E de SEM-1) : retirée avec NET-1 (§150), le 31 août ne rattrape plus rien.
  ['un jour sans saisie reprend son horaire par défaut', "  if(_planRecupActiveAt(yr!=null?yr:_pY(),m))return pl;\n", ""],
  ['ce que la semaine a rattrapé repart au compteur de la fiche', "if(sj){x.ratt=sj.rattrape||0;x.moins=sj.moins;}", "if(sj){x.ratt=0;}"],
  ['le verdict redit « retiré au taux normal » pour des heures rattrapées', "if(dSup<=0.0001||auTaux>0.0001)h+=", "h+="],
  // SEM-2
  ['la feuille tait que les jours à venir comptent au planning', "    if(x.plan&&!P.planDe)P.planDe=x.d;\n", ""],
  ['le compteur repart sans son solde d’avant (papier et écran)', "MV=[['Solde fin '+avantL,M.avant,1]];", "MV=[];"],
  ['une absence sans motif redevient neutre', "return (mo.id==='autre'&&_planNetAt(y!=null?y:_pY(),m))?_planAbsDef('injustifie'):mo;", "return mo;"],
  ['octobre porte déjà un solde', "if(x.i>m)return '<tr class=\"'+c.vide+'\">", "if(false)return '<tr class=\"'+c.vide+'\">"],
  ['les heures à rattraper disparaissent du papier', "  var ratt='';\n  if(P.act){", "  var ratt='';\n  if(false){"],
  // SEM-3
  // ⚰️ « l’écran reprend son cadre d’avant » (SEM-3) : remplacé par « PAIE-1 · l’écran reprend l’ancien cadre » — depuis PAIE-1,
  //    septembre et après passent par _pfCadreCompta, la ligne qu'il mutait ne sert plus qu'aux mois d'avant.
  ['l’onglet Jours revient à l’écart du jour', "  var SEM=_pfSemaines(mbr,P),maj=SEM.maj,F=_planFmt,L0=_planLegal(),hm=P.hm||{},act=P.act,", "  var SEM=_pfSemaines(mbr,P),maj=SEM.maj,F=_planFmt,L0=_planLegal(),hm=P.hm||{},act=false,"],
  ['la carte « Heures à rattraper » ne perd pas ce que la semaine a rattrapé', "  if(rtD>0.0001)RA.push(['Rattrap\\u00e9es dans la semaine, par les heures en plus',-rtD]);", ""],
  // AVANT-1 (§147)
  ['la lecture laisse la bascule de septembre au 1er janvier', "  } finally {PLAN_RECUP_DEBUT=sv;}\n  return o;", "  } finally {}\n  return o;"],
  // ⚰️ TAUX-1 : « les heures qui restent prennent les taux les plus bas » était un DÉFAUT (AVANT-1) ; c'est devenu la règle
  //   (Nico : « toujours le taux le plus haut sort en 1er »). Son inverse est gardé plus haut : « l'estimation range sa pile dans l'ancien sens ».
  ['ce que les jours ne montrent pas passe à 50 %', "['c25',L.c25+ex],['c50',L.c50]]", "['c25',L.c25],['c50',L.c50+ex]]"],
  ['un dimanche se majore deux fois', "o[ex<=0.0001?'deja':(ex>=50?'c50':'c25')]+=p[0]", "o[p[1]>=50?'c50':'c25']+=p[0]"],
  ['un paiement pris au compteur perd son mois (saisie d’avant PAIE-1)', "mois:T0.mois,bas:T0.h,haut:T0.h+pris", "bas:T0.h,haut:T0.h+pris"],
  ['un paiement pris au compteur perd son mois (demande en total, PAIE-1)', "mois:tr[k].mois,bas:tr[k].h,haut:tr[k].h+v", "bas:tr[k].h,haut:tr[k].h+v"],
  ['le report d’avant Ma Vigne se mêle aux heures estimées', "if(t.nat==='dep'){z.dep+=h;return;}", ""],
  ['le relevé ne dit plus ce qui vient d’avant septembre dans les restantes', "var sm=x.avant>0.0001?'dont '+F(x.avant)+' d\\u2019avant septembre':(x.note||'');", "var sm=(x.note||'');"],
  ['« À savoir » ne dit plus d’où vient le taux des heures d’avant septembre', "          ?'<li><b>Heures sup d\\u2019avant septembre 2026</b>", "          ?'<li><b>Heures sup d\\u2019avant 2026</b>"],
  // NET-1 (§150)
  ['un paiement passe avant les absences', "var bud=Math.max(0,tr.reduce(function(a,t){return a+t.h;},0)+majIn+hm.buckets.reduce(function(a,b){return a+b.h*(1+b.taux/100);},0)-bes);", "var bud=1e9;"],
  ["la récup ne reprend plus les heures du domaine", "r.domaine=hm2.domaine+hm2.indet;r.compense=tire(r.domaine,sA);dette+=r.compense;", "r.domaine=hm2.domaine+hm2.indet;r.compense=r.domaine;dette+=r.compense;"],
  ["le domaine passe avant le salarié", "      r.retire=hm2.retire;r.retenue=tire(hm2.retire,sA);\n      r.reportRetNC=tire(r.reportRet,sA);           // \u2605 FIGE-1 : le report du mois fig\u00e9, apr\u00e8s les absences du mois\n      // \u2605 NET-1 \u2014 le salarie d'abord : une heure du domaine ne fait jamais retenir une absence. Puis ce qui restait a\n      //   rattraper, puis les heures du domaine du mois \u2014 sur la recup acquise d'abord (Nico : \u00ab s'il y a des recup a\n      //   prendre, les heures en moins a cause du domaine se recuperent dessus dans un premier temps \u00bb), puis sur les\n      //   heures sup du mois ; le reste va au compteur des heures a rattraper.\n      r.comble=dette-tire(dette,sA);dette-=r.comble;\n      r.domaine=hm2.domaine+hm2.indet;r.compense=tire(r.domaine,sA);dette+=r.compense;", "      r.domaine=hm2.domaine+hm2.indet;r.compense=tire(r.domaine,sA);dette+=r.compense;\n      r.comble=dette-tire(dette,sA);dette-=r.comble;\n      r.retire=hm2.retire;r.retenue=tire(hm2.retire,sA);\n      r.reportRetNC=tire(r.reportRet,sA);"],
  ['le lundi 31 août rattrape encore le 1er septembre (la transition de SEM-1 revient)', "var totP=0,totM=0;js.forEach(function(y){if(!y.avant)totP+=y.bp;totM+=y.bm;});\n    var off=Math.min(totP,totM),r=off;\n    js.forEach(function(y){var c=y.avant?0:Math.min(y.bp,r);y.conso=c;y.hs=y.bp-c;r-=c;});", "var totP=0,totM=0;js.forEach(function(y){totP+=y.bp;totM+=y.bm;});\n    var off=Math.min(totP,totM),r=off;\n    js.forEach(function(y){var c=Math.min(y.bp,r);y.conso=c;y.hs=y.bp-c;r-=c;});"],
  ['la bascule des absences sans motif suit AVANT-1', "var PLAN_NET_DEBUT='2026-09';", "var PLAN_NET_DEBUT='2026-01';"],
  ['le relevé reparle de « non payées »', "st.push(q(x.nonPaye,'retenue','retenues'));", "st.push(q(x.nonPaye,'non pay\\u00e9e','non pay\\u00e9es'));"],
  ['la reprise redevient une case à cocher', "if(salRec>0.0001)cases+='<label class=\"inf\">'", "if(salRec>0.0001)cases+='<label><span class=\"bx\"></span>'"],
  // FIGE-1 (§151)
  ['un mois figé se repaie selon le compteur', "paye=(FG.payes||[]).reduce(function(a,q){return a+(q.brut||0);},0);r.paye=paye;", "paye=0;r.paye=0;"],
  ['ce qui change après l’envoi ne passe pas au mois suivant', "r.reportSuivant=rep;repDe=i;", "r.reportSuivant=rep;repDe=i;rep=0;"],
  ["le report se retient sans passer par les heures sup du mois", "r.reportRetNC=tire(r.reportRet,sA);", "r.reportRetNC=r.reportRet;"],
  ['la retenue de trop n’est pas rendue', "r.rendu=Math.min(r.reportRendre,r.retenue+r.reportRetNC);r.aRendre=r.reportRendre-r.rendu;", "r.rendu=0;r.aRendre=0;"],
  ['figé, la retenue se recalcule', "if(P.fige){P.nonPayeesVive=P.nonPayees;P.nonPayees=P.fige.retenue||0;", "if(P.fige){P.nonPayeesVive=P.nonPayees;"],
];

const SRC = fs.readFileSync(path.join(RACINE, 'src', 'planning.js'), 'utf8');
let sortie = 0;
let res;
try { res = lance(await charger(SRC)); } catch (e) { res = { ok: 0, ko: 1, echecs: ['PLANTAGE — ' + (e && e.stack || e)] }; }
console.log('\n  MA VIGNE — Harnais RECUP-1 (heures manquées, récup majorée)');
console.log('  ──────────────────────────────────────────────────────────');
if (res.ko) { console.log('  ✗ ' + res.ko + ' ROUGE(S) sur ' + (res.ok + res.ko) + ' :'); res.echecs.forEach(e => console.log('    · ' + e)); sortie = 1; }
else console.log('  ✓ ' + res.ok + ' assertions vertes.');

if (CONTRE) {
  console.log('\n  CONTRE-ÉPREUVE — chaque défaut réintroduit doit faire rougir');
  let manques = 0;
  for (const [nom, de, vers] of DEFAUTS) {
    if (SRC.split(de).length !== 2) { console.log('    ?        ' + nom + ' — motif introuvable ou non unique'); manques++; continue; }
    let r;
    try { r = lance(await charger(SRC.replace(de, vers))); } catch (e) { r = { ok: 0, ko: 1 }; }
    if (r.ko > 0) console.log('    DÉTECTÉ  ' + nom + ' (' + r.ko + ' rouge' + (r.ko > 1 ? 's' : '') + ')');
    else { console.log('    MANQUÉ   ' + nom + ' — le harnais reste vert, il ne prouve rien'); manques++; }
  }
  if (manques) sortie = 1;
  console.log(manques ? '\n  ' + manques + ' défaut(s) non détecté(s).' : '\n  Les ' + DEFAUTS.length + ' défauts sont détectés.');
}
process.exit(sortie);
