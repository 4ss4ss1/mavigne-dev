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
const EXPORTS = ['_planFmt', '_pfPlanNom', '_pfPrevT', '_planSemainesDuMois', '_pfAnnee', '_planPayeMaxTotal', '_planPayeMaxCouvert', '_planPayeEcrire', '_planDepartKey', '_pfRestants', '_planPaieMois', '_planPayeMaxCouvert', '_planSemEffectif', '_pfCadre', '_pfDemande', '_pfOuVont', '_pfJours', '_pfCompteur', '_pfConges', '_pfResume', '_planValeurPourBrut', '_planComptaLignes', '_planComptaTable', '_planSeauxTxt', '_planSeauNom', '_planJourEcart', '_planHsupMois', '_planHsupTiers', '_planCompteur', '_planBank',
  '_planYearBalance', '_planSupMonth', '_planSupCalc', '_planSummary', '_planDuesMonth', '_planMajBank', '_planHsupPaye',
  '_planHsupPayeBank', '_planRecupH', '_planDepartSolde', '_planAbsPartH', '_planAbsPartiel', '_planDayH', '_planWorkH',
  '_planDayStatus', '_pl2Cell', '_planRecupActive', '_planApplyAbsPart', '_planApplyHeures', '_planSuspH',
  '_planAbsEffet', '_planAbsDef', '_planDefTiming', '_planRetardBornes', '_planTimingH',
  '_planRecupCartes', '_planHsupCard', '_planRuban', '_planVerdict', '_planAbsMotifsHtml', '_planSheetAbsSection', '_planAbsConstruit'];

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
  eq('L19 · septembre imprime le relevé de la fiche', pdf.indexOf('<h2>Pour la paie</h2>') !== -1, true);
  eq('L20 · la journée écourtée, son créneau et son motif, en observation du 16',
    pdf.indexOf('Absent 13:00 \u2192 15:00 \u00b7 personnel') !== -1, true);
  eq('L21 · temps de récup 3h', /Solde fin septembre<\/td><td class="n">3h<\/td>/.test(pdf), true);
  eq('L22 · absences non payées 0h', /Absences non pay\u00e9es<\/span><span><b>0h<\/b>/.test(pdf), true);
  eq('L22b · 4h faites à +25 %, 5h en récup, jamais 5h à déclarer',
    pdf.indexOf('<td>Heures sup \u00e0 +25\u202f%</td><td class="n">4h</td><td class="n">\u2014</td><td class="n">4h</td><td class="n cv">5h</td>') !== -1, true);
  eq('L22c · plus de bloc « Dimanches et jours fériés » séparé en septembre', pdf.indexOf('Dimanches et jours f\u00e9ri\u00e9s travaill\u00e9s'), -1);
  // FICHE-5 : le détail mois par mois se lit en heures sup — 4h faites, 2h de récup sur des heures à 25 % = 1h36 récupérées, 2h24 restantes
  eq('L24 · l’année : septembre, 4h sup, 1h36 récupérées, 2h24 restantes', /<tr class="cur"><td>Sept<\/td><td class="n">4h<\/td><td class="n"><\/td><td class="n">1h36<\/td><td class="n">2h24<\/td>/.test(pdf), true);
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
    JSON.stringify(X.lignes.find(l => /Majoration/.test(l[0]))), JSON.stringify(['Majoration \u00b7 dimanche 13 (heures pr\u00e9vues)', '\u2014', '7h', '+50\u202f% (majoration seule)']));
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
  eq('N10 · sans toucher la récup prise : 12h payables', R._planPayeMaxCouvert(J, 8), 12);
  eq('N11 · la saisie est remise en place après les essais', JSON.stringify(window.PLANNING_HSUP), '{}');
  domaine({ ent: { 8: moisFiche }, hsup: { '2026-09': { paye: 8, demande: true } } });
  F = R._planPaieMois(J, 8);
  eq('N12 · 8h payées, prises sur les 25 %', JSON.stringify(F.lignes.map(l => l.paye)), JSON.stringify([8, 0, 0]));
  eq('N13 · 10h gardées = 15h de repos', F.valeurRecup, 15); eq('N14 · la demande est lue', F.demande, true);
  eq('N15 · solde 15h − 2h − 7h = 6h', F.c.solde, 6);
  domaine({ ent: { 8: moisFiche }, hsup: { '2026-09': { paye: 18, demande: true } } });
  F = R._planPaieMois(J, 8);
  eq('N16 · tout payé : l’absence du 16 n’est plus couverte (2h non payées)', F.nonPayees, 2);
  eq('N17 · … ni la récup du 21 (7h non couvertes)', F.recupNC, 7);
  eq('N18 · les absences payées ne gardent que les congés', F.payees, 14);
  eq('N19 · écart = 18h sup − 2h − 7h', F.jours.filter(x => !x.hors).reduce((a, x) => a + x.ecart, 0), 9);
  let html = R._pfCadre(J, F);
  sain('N20 cadre', html);
  eq('N21 · le cadre dit « à retirer » en rouge', html.indexOf('pf-fort') !== -1, true);
  domaine({ ent: { 8: moisFiche } });
  F = R._planPaieMois(J, 8);
  html = R._pfCadre(J, F);
  // ★ SEM-3 : le cadre de l'écran lit la même source que le relevé v3 — « Absences » par cause, et « à ce jour » tant que le mois court.
  horloge(2026, 9, 1); html = R._pfCadre(J, R._planPaieMois(J, 8));
  eq('N22 · le cadre porte 154h et 149h, le mois fini', ['>154h<', '>149h<'].every(t => html.indexOf(t) !== -1) && html.indexOf('pf-prov') === -1, true);
  horloge(); html = R._pfCadre(J, F);
  eq('N23 · « À payer en plus » sans paiement : elles vont en récup', html.indexOf('Aucune heure sup pay\u00e9e') !== -1, true);
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
  eq('O3 · le cadre « Pour la paie » avant le jour par jour', rel.indexOf('<h2>Pour la paie</h2>') > 0 && rel.indexOf('<h2>Pour la paie</h2>') < rel.indexOf('Jour par jour'), true);
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
  eq('O7 · le 24 : « Congé payé », payée, 7h, sans heure sup', JSON.stringify(rj.find(r => r[1] === 'Je 24').slice(4, 7)), JSON.stringify(['Cong\u00e9 pay\u00e9 <i>pay\u00e9e</i>', '7h', '']));
  eq('O8 · la semaine du 7 dit ses 53h au-delà des 48h', rel.indexOf('53h sur la semaine, au-del\u00e0 des 48h autoris\u00e9es') !== -1, true);
  eq('O9 · page 2 : heures sup, compteur, année, congés, acomptes, signatures',
    ['Les heures sup de septembre', 'Le compteur de r\u00e9cup, en temps de repos', 'D\u00e9tail mois par mois \u2014 ann\u00e9e 2026', 'Cong\u00e9s pay\u00e9s', 'Compteur d\u2019heures', 'Acomptes sur salaire', 'Signature salari\u00e9', 'Signature employeur', 'Transmis \u00e0 la compta le'].every(t => rel.indexOf(t) !== -1), true);
  eq('O10 · le cadre : 154h prévues, 149h faites, et « aucune heure sup payée »', ['>154h<', '>149h<'].every(t => rel.indexOf(t) !== -1) && rel.indexOf('Aucune heure sup pay\u00e9e') !== -1, true);
  domaine({ ent: { 8: moisFiche }, hsup: { '2026-09': { paye: 8, demande: true } } });
  pages.length = 0; window._planReleveIndiv('Jean', 8); rel = pages[0] ? pages[0].html : '';
  eq('O11 · 8h payées : « Heures sup à +25 % 8h » à payer en plus', /Heures sup \u00e0 \+25\u202f%<\/span><span><b>8h<\/b>/.test(rel), true);
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
  eq('Q1 · 8h payées : les quatre taux, même à zéro', [ligne(cad, 'Heures sup \u00e0 +25\u202f%', '8h'), ligne(cad, 'Heures sup \u00e0 +50\u202f%', '0h'),
    ligne(cad, 'Heures du dimanche \u00e0 +50\u202f%', '0h'), ligne(cad, 'Heures de jour f\u00e9ri\u00e9 \u00e0 +100\u202f%', '0h')].join(), 'true,true,true,true');
  let RS = R._pfRestants(J, F);
  eq('Q2 · 4h restantes, toutes du dimanche, soit 6h de récup', [RS.total, RS.dim.h, RS.dim.v, RS.c25.h, RS.c50.h, RS.valeur].join('/'), '4/4/6/0/0/6');
  eq('Q3 · décompte : 0 + 18 − 8 − 6 = 4', [RS.report, RS.faites, RS.payees, RS.consommees].join('/'), '0/18/8/6');
  eq('Q4 · les restantes en récup = le temps de récup du compteur', RS.valeur, F.c.solde);
  eq('Q5 · le compteur montre les restantes quand le salarié demande', R._pfCompteur(J, F).indexOf('Heures sup restantes \u00e0 payer') !== -1, true);
  eq('Q6 · … et le cadre les note pour information', ligne(cad, 'Heures sup restantes \u00e0 payer', '4h'), true);
  pages.length = 0; window._planReleveIndiv('Jean', 8); rel = pages[0] ? pages[0].html : '';
  eq('Q7 · le relevé reprend les restantes', /Restantes fin septembre<\/td><td class="n">4h<\/td>/.test(rel), true);
  domaine({ ent: { 8: moisFiche }, hsup: { '2026-09': { paye: 0, demande: true } } });
  F = R._planPaieMois(J, 8); RS = R._pfRestants(J, F);
  eq('Q8 · rien de payé : 10h48 restantes (0h48 à 25 %, 2h à 50 %, 8h le dimanche)', [RS.total, RS.c25.h, RS.c50.h, RS.dim.h].map(x => Math.round(x * 100) / 100).join('/'), '10.8/0.8/2/8');
  domaine({ ent: { 8: moisFiche } });
  F = R._planPaieMois(J, 8);
  eq('Q9 · sans demande : ni restantes au compteur, ni quatre lignes', R._pfCompteur(J, F).indexOf('Heures sup restantes') === -1 && R._pfCadre(J, F).indexOf('Heures du dimanche \u00e0') === -1, true);
  domaine({ ent: { 8: moisFiche, 9: { 5: T('08:00', '19:00') } }, hsup: { '2026-09': { paye: 8, demande: true }, '2026-10': { paye: 3, paye_bank: 3, demande: true } } });
  // ⚠️ Comme la case l'écrit (_planFichePayer) : 3h du mois en `paye`, et 2h brutes du dimanche puisées au compteur
  //    en `paye_bank`, À LEUR VALEUR (2h × 1,5 = 3h). Première version : `paye: 5` — le moteur borne au mois, le
  //    harnais mesurait une saisie que l'écran n'écrit jamais.
  const Fo = R._planPaieMois(J, 9), RSo = R._pfRestants(J, Fo);
  eq('Q10 · octobre : 3h du mois + 2h puisées au compteur, chacune à son taux', [ligne(R._pfCadre(J, Fo), 'Heures sup \u00e0 +25\u202f%', '3h'), ligne(R._pfCadre(J, Fo), 'Heures du dimanche \u00e0 +50\u202f%', '2h')].join(), 'true,true');
  eq('Q11 · octobre : 4h reportées + 3h faites − 5h payées = 2h restantes', [RSo.report, RSo.faites, RSo.payees, RSo.consommees, RSo.total].map(x => Math.round(x * 100) / 100).join('/'), '4/3/5/0/2');
  window.PLANNING_ACOMPTES.Jean = {};

  // R. FICHE-4 — payer au-delà du mois : tout ce que le compteur contient encore
  domaine({ ent: { 8: moisFiche } });
  eq('R1 · sans report : au plus les 18h du mois', R._planPayeMaxTotal(J, 8), 18);
  eq('R2 · sans report : sans toucher la récup prise, 12h (inchangé)', R._planPayeMaxCouvert(J, 8), 12);
  const dep = {}; dep[R._an() + '-dep'] = { solde: 50, date: '2026-01-01' };
  domaine({ ent: { 8: moisFiche }, hsup: Object.assign({}, dep) });
  eq('R3 · 50h reportées : 18h du mois + 41h du compteur (9h servent la récup du mois)', R._planPayeMaxTotal(J, 8), 59);
  eq('R4 · … et toutes payables sans découvrir la récup prise', R._planPayeMaxCouvert(J, 8), 59);
  const rec30 = { demande: true };
  window.PLANNING_HSUP.Jean['2026-09'] = rec30;
  R._planPayeEcrire(J, 8, rec30, 30);
  eq('R5 · 30h demandées : 18h du mois, 12h puisées au compteur', [rec30.paye, rec30.paye_bank].join('/'), '18/12');
  F = R._planPaieMois(J, 8);
  eq('R6 · la fiche paie bien 30h', F.payeTotal, 30);
  cad = R._pfCadre(J, F);
  eq('R7 · le cadre : 8h à 25 %, 2h à 50 %, 8h le dimanche, 12h reportées au taux à vérifier',
    [ligne(cad, 'Heures sup \u00e0 +25\u202f%', '8h'), ligne(cad, 'Heures sup \u00e0 +50\u202f%', '2h'), ligne(cad, 'Heures du dimanche \u00e0 +50\u202f%', '8h'), ligne(cad, 'Report d\u2019avant Ma Vigne, taux \u00e0 v\u00e9rifier', '12h')].join(), 'true,true,true,true');
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
  eq('S5 · l’onglet Compteur porte les quatre colonnes', R._pfCompteur(J, R._planPaieMois(J, 8)).indexOf('<th class="n">Faites</th><th class="n">Pay\u00e9es</th><th class="n">R\u00e9cup\u00e9r\u00e9es</th><th class="n">Solde</th><th class="n pf-cv">en repos</th>') !== -1, true);
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
  // U. SEM-2 — le relevé v3 : provisoire, absences par cause, compteurs qui tombent juste, mentions
  const releve = () => { pages.length = 0; window._planReleveIndiv('Jean', 8); return (pages[0] ? pages[0].html : '').replace(/<script[\s\S]*?<\/script>/g, ''); };
  domaine({ ent: { 8: moisFiche } });
  let rv = releve(); PM = R._planPaieMois(J, 8);
  sain('U1 relevé provisoire', rv);
  eq('U1b · édité le 16/09 : provisoire, il ne se signe pas', [rv.indexOf('<b>Relev\u00e9 provisoire</b>') !== -1, rv.indexOf('class="sig non"') !== -1, rv.indexOf('il se signe sur l\u2019\u00e9dition du mois fini') !== -1].join('/'), 'true/true/true');
  eq('U1c · les jours à venir ne sont pas comptés faits sur le papier — P.faites ne bouge pas', [PM.provisoire, PM.futurFait > 0, rv.indexOf('>' + R._planFmt(PM.faites - PM.futurFait) + '<') !== -1].join('/'), 'true/true/true');
  // (moisFiche porte des saisies jusqu'au 24 : aucune de ses semaines n'est ENTIÈREMENT à venir — le scénario d'avant mesurait le test, pas le code)
  domaine({ ent: { 8: { 7: T('08:00', '18:00') } } });
  rv = releve();
  eq('U1d · une semaine entièrement à venir tient sur sa ligne, sans ses jours', [rv.indexOf('<b>Semaine du 21 au 27 septembre</b>\u00a0: 35h pr\u00e9vues au planning, \u00e0 venir.') !== -1, lireJours(rv).some(r => r[1] === 'Lu 21')].join('/'), 'true/false');
  eq('U1e · la semaine du 28 : à venir, et elle finit en octobre', rv.indexOf('\u00e0 venir. Elle finit en octobre, elle se compte sur le relev\u00e9 d\u2019octobre.') !== -1, true);
  domaine({ ent: { 8: moisFiche } });
  horloge(2026, 9, 1);
  rv = releve();
  sain('U2 relevé définitif', rv);
  eq('U2b · le mois fini : plus de provisoire, et la signature dit ce qu’elle vaut', [rv.indexOf('Relev\u00e9 provisoire'), rv.indexOf('ne vaut pas renonciation \u00e0 ses droits (Code rural, art. R.\u00a0713-36)') !== -1].join('/'), '-1/true');
  eq('U2c · le compteur part du solde d’avant', rv.indexOf('<td>Solde fin ao\u00fbt</td>') !== -1, true);
  eq('U2d · octobre à décembre restent vides, et le cumul depuis janvier est écrit', [rv.indexOf('<tr class="vide"><td>Oct</td><td></td>') !== -1, rv.indexOf('<td>Depuis le 1er janvier</td>') !== -1].join('/'), 'true/true');
  eq('U2e · l’en-tête dit le modèle par son nom', [rv.indexOf(', planning Standard</div>') !== -1, R._pfPlanNom('planning-35h-(administration)')].join('/'), 'true/35h (administration)');
  eq('U2f · congés : pas de reste négatif sans solde de départ', [rv.indexOf('\u00e0 saisir dans la fiche') !== -1, rv.indexOf('connu une fois le solde saisi') !== -1].join('/'), 'true/true');
  domaine({ ent: { 8: { 7: T('08:00', '18:00'), 8: T('08:00', '18:00'), 16: { absent: true, motif: 'injustifie' } } } });
  rv = releve();
  const l16 = lireJours(rv).find(r => r[1] === 'Me 16') || [];
  eq('U3 · absence injustifiée : elle garde son nom, et dit ce qu’elle devient', [/^R\u00e9cup/.test(l16[4] || ''), (l16[4] || '').indexOf('<i>5h sur la r\u00e9cup, 2h non pay\u00e9es</i>') !== -1, l16[5]].join('/'), 'false/true/7h');
  eq('U3b · la reprise sur la récup demande l’accord du salarié', rv.indexOf('<span class="bx"></span>J\u2019accepte que mon absence du 16 septembre (5h non rattrap\u00e9es) soit reprise sur ma r\u00e9cup.') !== -1, true);
  domaine({ ent: { 8: { 16: { absent: true, motif: 'autre' } } } });
  rv = releve();
  eq('U4 · une absence sans motif bloque l’envoi', [rv.indexOf('Sans motif <i>\u00e0 pr\u00e9ciser</i>') !== -1, rv.indexOf('7h d\u2019absence sans motif\u00a0: \u00e0 pr\u00e9ciser avant l\u2019envoi \u00e0 la compta.') !== -1, rv.indexOf('Absences \u00e0 pr\u00e9ciser') !== -1].join('/'), 'true/true/true');
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
  eq('V2 · le cadre : « Absences » par cause, plus « Absences payées » ni « Maintenu »', [ecr.indexOf('<span class="pf-l">Absences</span>') !== -1, ecr.indexOf('<span class="pf-ab pf-ab-rec">du salari\u00e9 7h</span>') !== -1, ecr.indexOf('Absences pay\u00e9es'), ecr.indexOf('Maintenu')].join('/'), 'true/true/-1/-1');
  eq('V3 · l’écran et le papier disent le même bas de cadre', ecr.indexOf('Heures sup\u00a0: <b>4h</b>, sur la semaine du 7.') !== -1 && rv.length > 0 && releve().indexOf('Heures sup\u00a0: <b>4h</b>, sur la semaine du 7.') !== -1, true);
  eq('V4 · Jours : la colonne « Heures sup », et l’absence dit ce qu’elle devient', [ejr.indexOf('<span>Heures sup</span>') !== -1, ejr.indexOf('>\u00c9cart<'), ejr.indexOf('5h reprises sur la r\u00e9cup, 2h non pay\u00e9es') !== -1].join('/'), 'true/-1/true');
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
  eq('V11 · le 16/09, l’écran dit « mois en cours » et grise les jours à venir', [ecr.indexOf('class="pf-prov"') !== -1, ecr.indexOf('Pr\u00e9vues \u00e0 ce jour') !== -1, ejr.indexOf('pf-jr pf-fut') !== -1, ejr.indexOf('\u00c0 venir\u00a0: 35h au planning') !== -1].join('/'), 'true/true/true/true');
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
  eq('W1 · 30h demandées : 17h du mois, 13h puisées au compteur (juin, puis juillet)', [recW.paye, recW.paye_bank].join('/'), '17/13');
  let PW = R._planPaieMois(J, 8), cadW = R._pfCadre(J, PW);
  sain('W1 cadre', cadW);
  eq('W2 · le cadre : 13h d’avant septembre, estimées 6h à +25 %, 7h à +50 %', estL(cadW, '13h', '6h \u00e0 +25\u202f%, 7h \u00e0 +50\u202f%'), true);
  eq('W3 · plus aucune ligne « taux à vérifier » : tout vient de mois lisibles', cadW.indexOf('taux \u00e0 v\u00e9rifier'), -1);
  let RW = R._pfRestants(J, PW);
  eq('W4 · restantes : 18h d’avant septembre, 16h à 25 %, 2h à 50 %', [RW.total, RW.src.avant, RW.src.est.c25, RW.src.est.c50, RW.src.est.deja].join('/'), '18/18/16/2/0');
  eq('W5 · mois par mois : juillet 14h sur 16h (12h + 2h), août 4h', JSON.stringify(RW.src.mois.map(x => [x.mois, x.h, x.sup, x.c25, x.c50])), '[[6,14,16,12,2],[7,4,4,4,0]]');
  const temoin = () => JSON.stringify(R._planCompteur(J, 8)) + JSON.stringify(window.PLANNING_HSUP) + JSON.stringify(window.PLANNING_ENTRIES);
  const t0 = temoin(); R._pfRestants(J, PW); R._pfCadre(J, PW); R._pfCompteur(J, PW); releve();
  eq('W6 · lire l’estimation ne change ni le compteur, ni les saisies', temoin() === t0, true);
  eq('W7 · la bascule de septembre est remise en place après chaque lecture', [R._planRecupActive(7), R._planRecupActive(8)].join('/'), 'false/true');
  const cpW = R._pfCompteur(J, PW);
  sain('W8 compteur', cpW);
  eq('W8 · Compteur : la ligne, son estimation, le calcul mois par mois', [cpW.indexOf('<tr class="pf-src"><td>Heures sup d\u2019avant septembre</td><td class="n"><b>18h</b></td><td class="n pf-rec">18h</td></tr>') !== -1,
    cpW.indexOf('Estimation d\u2019apr\u00e8s les jours saisis\u00a0: 16h \u00e0 +25\u202f%, 2h \u00e0 +50\u202f%. En r\u00e9cup, 1h pour 1h') !== -1,
    cpW.indexOf('<li><b>Juillet</b>\u00a0: 14h restantes sur 16h compt\u00e9es au mois\u00a0\u2192 12h \u00e0 +25\u202f%, 2h \u00e0 +50\u202f%</li>') !== -1].join('/'), 'true/true/true');
  const rvW = releve();
  eq('W9 · relevé : le cadre, la page 2 et « À savoir » disent la même chose', [rvW.indexOf('Heures sup d\u2019avant septembre<small class="pf-estl">Estimation d\u2019apr\u00e8s les jours saisis\u00a0: 6h') !== -1,
    rvW.indexOf('Heures sup d\u2019avant septembre<small class="est">Estimation d\u2019apr\u00e8s les jours saisis\u00a0: 16h') !== -1,
    rvW.indexOf('<li>Heures sup d\u2019avant septembre 2026\u00a0:') !== -1].join('/'), 'true/true/true');
  // Un report d'avant Ma Vigne, un jour de récup en mars, un dimanche travaillé le 12 juillet
  const anM = anW(); anM[2] = { 20: { type: 'recup' } }; anM[6][12] = T('08:00', '17:00');
  domaine({ ent: anM, hsup: { '2026-dep': { solde: 30, date: '2026-01-01' }, '2026-09': { demande: true } } });
  recW = window.PLANNING_HSUP.Jean['2026-09']; R._planPayeEcrire(J, 8, recW, 30);
  PW = R._planPaieMois(J, 8); cadW = R._pfCadre(J, PW); RW = R._pfRestants(J, PW);
  eq('W10 · le report reste à part, à vérifier (9h) ; 4h d’avant septembre, à 25 %', [ligne(cadW, 'Report d\u2019avant Ma Vigne, taux \u00e0 v\u00e9rifier', '9h'), estL(cadW, '4h', '4h \u00e0 +25\u202f%')].join('/'), 'true/true');
  eq('W11 · un dimanche a sa majoration à part : 8h déjà majorées, et 4h de majoration sur leur ligne', [RW.src.avant, RW.src.est.c25, RW.src.est.c50, RW.src.est.deja, RW.src.maj, RW.src.dep].join('/'), '49/32/9/8/4/0');
  eq('W11b · … et la carte le dit', R._pfCompteur(J, PW).indexOf('<td>Majoration des dimanches et f\u00e9ri\u00e9s, d\u00e9j\u00e0 calcul\u00e9e</td><td class="n"><b>4h</b></td>') !== -1, true);
  // Une valeur saisie à la main au-delà de ce que les jours montrent
  domaine({ ent: { 5: hj('08:00', '19:00', [8, 9, 10, 11, 12]) }, hsup: { '2026-06': { sup_override: 20 }, '2026-09': { demande: true } } });
  RW = R._pfRestants(J, R._planPaieMois(J, 8));
  eq('W12 · une valeur saisie à la main : ce que les jours ne montrent pas compte à 25 %', [RW.src.avant, RW.src.est.c25, RW.src.est.c50].join('/'), '20/13/7');
  horloge();
  domaine({ ent: { 8: moisFiche } });

  return { ok, ko, echecs };
}

// ── Contre-epreuves ─────────────────────────────────────────────────────────
const DEFAUTS = [
  ['les heures manquées retirées au taux heures sup', "r.retire=hm2.retire;r.retenue=tire(hm2.retire);", "r.retire=hm2.retire;r.retenue=tire(hm2.retire*1.25);"],
  ['le seuil des 50 % oublié', "var r50=Math.max(0,totHs-PLAN_HS_RANG50);", "var r50=0;"],
  ['la majoration des heures sup oubliée', "ent.push({taux:b.taux,nat:b.nat,h:(b.h-p)*(1+b.taux/100)});", "ent.push({taux:b.taux,nat:b.nat,h:(b.h-p)});"],
  ['dimanche et heures sup cumulés', "if(jm)seau(MH,tx,nj,Math.max(0,jm.h-y.hs),y.d);", "if(jm)seau(MH,tx,nj,jm.h,y.d);"],
  // ⚠️ Premiere version : on sautait le « return » des motifs neutres. Defaut INOPERANT — le
  //    motif n'avait toujours pas de destination et le calcul l'ignorait : le harnais restait
  //    vert sur un defaut qui n'en etait pas un. Le vrai defaut, c'est de lui en DONNER une.
  ['un arrêt retire des heures', "id:'arret',     ico:'pansement', nom:'Arr\\u00eat de travail',          sub:'Maladie, accident du travail',                     suspend:true,  assim:false, paye:true,  heures:false, cpt:''}",
    "id:'arret',     ico:'pansement', nom:'Arr\\u00eat de travail',          sub:'Maladie, accident du travail',                     suspend:true,  assim:false, paye:true,  heures:false, cpt:'retire'}"],
  ['la journée du domaine retenue sur la paie', "r.domaine=hm2.domaine+hm2.indet;r.compense=tire(r.domaine);dette+=r.compense;", "r.domaine=hm2.domaine+hm2.indet;r.retenue+=tire(r.domaine);"],
  ['la fenêtre de septembre 2026 supprimée', "var PLAN_RECUP_DEBUT='2026-09';", "var PLAN_RECUP_DEBUT='2026-01';"],
  ['la coupure comptée dans l’absence', "return Math.max(0,Math.min(jour,((y-x)-dans)/60));", "return Math.max(0,Math.min(jour,(y-x)/60));"],
  ['ce qui reste à compenser n’est jamais comblé', "r.comble=Math.min(dette,entre);dette-=r.comble;", "r.comble=0;"],
  // ⚰️ « le tableau d’année du relevé redit « Heures dues » après septembre » : retiré avec FICHE-2 — septembre
  //    n'imprime plus ce tableau. Le défaut visait un document que plus aucun mois actif ne produit.
  // RECUP-2
  ['on déclare 1h15 à la compta au lieu de l’heure brute', "hm.buckets.forEach(function(b){L.push([_planSeauNom(b),_planFmt(b.h*(1+b.taux/100)),_planFmt(b.h),tx(b.taux)]);});",
    "hm.buckets.forEach(function(b){L.push([_planSeauNom(b),_planFmt(b.h*(1+b.taux/100)),_planFmt(b.h*(1+b.taux/100)),tx(b.taux)]);});"],
  ['un paiement pris au compteur se déclare en temps de récup', "brut:t/(1+tr[k].taux/100)", "brut:t"],
  ['payé : la majoration d’un dimanche prévu part aussi au compteur', "if(!_planHsupPayable()&&hm.majHsVal>0.0001)", "if(hm.majHsVal>0.0001)"],
  ['payer des heures brutes retire autant de récup, sans leur taux', "var f=1+t.taux/100,b=Math.min(t.h/f,reste);", "var f=1,b=Math.min(t.h/f,reste);"],
  // FICHE-1
  ['un congé payé se lit en heures manquées', "else if(e.type==='cp'){x.paye=_planDayH(plId,m,d,e);x.payeType='cp';}", "else if(e.type==='cp'){x.paye=0;x.payeType='cp';}"],
  ['la récup est payée même quand le compteur ne la couvre pas', "var q=act?Math.min(x.recupH,kc):x.recupH;", "var q=x.recupH;"],
  // FICHE-5
  ['le solde restant garde la majoration de la récup', "r.soldeBrut=tr.reduce(function(a,t){return a+t.h/(1+(t.taux||0)/100);},0);", "r.soldeBrut=tr.reduce(function(a,t){return a+t.h;},0);"],
  // FICHE-4
  ['« sans toucher la récup prise » s’arrête aux heures du mois', "var z=essai(0),n=Math.floor(_planPayeMaxTotal(mbr,m)*2+1e-9);", "var z=essai(0),n=Math.floor(_planSupMonth(mbr,m)*2+1e-9);"],
  ['le paiement ignore le compteur au-delà du mois', "  if(sur>0.0001){var cv=_planValeurPourBrut(mbr,m,sur);rec.paye_bank=Math.round(cv.v*100)/100;return {h:pm+(sur-cv.reste),reste:cv.reste};}", ""],
  // FICHE-3
  ['les heures restantes oublient leur taux', "b=t.h/(1+(t.taux||0)/100)", "b=t.h"],
  ['les heures payées sur le compteur ne rejoignent pas leur taux', "(P.r.payesBank||[]).forEach(function(q){cat[_pfCat(q.nat,q.taux)]+=q.brut;});", ""],
  ['le cadre tait les taux à zéro', ".forEach(function(x){D.plus.push([cat[x[0]]>0.0001?'':'pf-rien',x[1],'<b>'+_planFmt(cat[x[0]])+'</b>']);});", ".forEach(function(x){if(cat[x[0]]>0.0001)D.plus.push(['',x[1],'<b>'+_planFmt(cat[x[0]])+'</b>']);});"],
  // FICHE-2
  ['le relevé de septembre retombe sur l’ancien', "if(_planRecupActive(planMonth)&&!(window._mvEstCollectif&&window._mvEstCollectif(mbr)))return _planReleveFiche_(nom,mbr,_ctr);", "if(false)return _planReleveFiche_(nom,mbr,_ctr);"],
  ['le relevé oublie les absences payées', "else if(!x.futur&&x.paye>0.0001){abT=LIB[x.payeType]||'Pay\\u00e9e';abH=F(x.paye);st.push('pay\\u00e9e');}", ""],
  ['« sans toucher la récup prise » ignore la récup prise', "return rr.retenue<=z.retenue+1e-6&&rr.recupNC<=z.recupNC+1e-6;", "return true;"],
  // SEM-1
  ['les heures sup se recomptent au jour', "var off=Math.min(totP,totM),r=off;", "var off=0,r=off;"],
  ['le 50 % repart de la 44e heure travaillée', "var r50=Math.max(0,totHs-PLAN_HS_RANG50);", "var r50=Math.min(totHs,Math.max(0,compte-43));"],
  ['une semaine à cheval se recoupe en deux', "      if(y.avant||!y.ec)return;", "      if(y.avant||!y.ec||y.m!==m)return;"],
  ['le 31 août compté deux fois', "var E=Math.max(0,deja-avNew);", "var E=0;"],
  ['un jour sans saisie reprend son horaire par défaut', "  if(_planRecupActiveAt(yr!=null?yr:_pY(),m))return pl;\n", ""],
  ['ce que la semaine a rattrapé repart au compteur de la fiche', "if(sj){x.ratt=sj.rattrape||0;x.moins=sj.moins;}", "if(sj){x.ratt=0;}"],
  ['le verdict redit « retiré au taux normal » pour des heures rattrapées', "if(dSup<=0.0001||auTaux>0.0001)h+=", "h+="],
  // SEM-2
  ['un jour à venir redevient un jour fait', "    if(!e&&_pfIsoJour(m,d)>=_pfAujIso()){x.futur=true;}\n", ""],
  ['le compteur repart sans son solde d’avant (papier et écran)', "MV=[['Solde fin '+avantL,M.avant,1]];", "MV=[];"],
  ['une absence sans motif ne bloque plus l’envoi', "var verdict=AB.preciser>0.0001?", "var verdict=false?"],
  ['octobre porte déjà un solde', "return x.i>m?'<tr class=\"vide\">", "return false?'<tr class=\"vide\">"],
  ['les heures à rattraper disparaissent du papier', "  var ratt='';\n  if(P.act){", "  var ratt='';\n  if(false){"],
  // SEM-3
  ['l’écran reprend son cadre d’avant', "  var V=P.act?_pfV3(mbr,P,D,null):null;", "  var V=null;"],
  ['l’onglet Jours revient à l’écart du jour', "  var SEM=_pfSemaines(mbr,P),maj=SEM.maj,F=_planFmt,L0=_planLegal(),hm=P.hm||{},act=P.act,", "  var SEM=_pfSemaines(mbr,P),maj=SEM.maj,F=_planFmt,L0=_planLegal(),hm=P.hm||{},act=false,"],
  ['la carte « Heures à rattraper » ne perd pas ce que la semaine a rattrapé', "  if(rtD>0.0001)RA.push(['Rattrap\\u00e9es dans la semaine, par les heures en plus',-rtD]);", ""],
  // AVANT-1 (§147)
  ['la lecture laisse la bascule de septembre au 1er janvier', "  } finally {PLAN_RECUP_DEBUT=sv;}\n  return o;", "  } finally {}\n  return o;"],
  ['les heures qui restent prennent les taux les plus bas', "[['c50',L.c50],['c25',L.c25+ex],['deja',L.deja]]", "[['deja',L.deja],['c25',L.c25+ex],['c50',L.c50]]"],
  ['ce que les jours ne montrent pas passe à 50 %', "[['c50',L.c50],['c25',L.c25+ex]", "[['c50',L.c50+ex],['c25',L.c25]"],
  ['un dimanche se majore deux fois', "o[ex<=0.0001?'deja':(ex>=50?'c50':'c25')]+=p[0]", "o[p[1]>=50?'c50':'c25']+=p[0]"],
  ['un paiement pris au compteur perd son mois', "mois:tr[k].mois,bas:tr[k].h,haut:tr[k].h+t", "bas:tr[k].h,haut:tr[k].h+t"],
  ['le report d’avant Ma Vigne se mêle aux heures estimées', "if(t.nat==='dep'){z.dep+=h;return;}", ""],
  ['le relevé perd l’estimation', "<small class=\"est\">Estimation", "<small class=\"est\">"],
  ['« À savoir » ne dit plus que le taux est estimé', "?'<li>Heures sup d\\u2019avant septembre 2026", "?'<li>Heures sup d\\u2019avant 2026"],
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
