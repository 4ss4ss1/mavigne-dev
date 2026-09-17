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
class DateFigee extends _D {
  constructor(...a) { if (a.length) super(...a); else super(2026, 8, 16, 12, 0, 0); }
  static now() { return new _D(2026, 8, 16, 12, 0, 0).getTime(); }
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
const EXPORTS = ['_planPaieMois', '_planPayeMaxCouvert', '_planSemEffectif', '_pfCadre', '_pfDemande', '_pfOuVont', '_pfJours', '_pfCompteur', '_pfConges', '_pfResume', '_planValeurPourBrut', '_planComptaLignes', '_planComptaTable', '_planSeauxTxt', '_planSeauNom', '_planJourEcart', '_planHsupMois', '_planHsupTiers', '_planCompteur', '_planBank',
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

  // I. Une semaine à cheval sur deux mois (lundi 28 septembre → dimanche 4 octobre)
  domaine({ ent: { 8: { 28: T('08:00', '19:00'), 29: T('08:00', '19:00'), 30: T('08:00', '19:00') }, 9: { 1: T('08:00', '19:00') } } });
  const zs = R._planHsupMois(J, 8), zo = R._planHsupMois(J, 9);
  eq('I1 · septembre : 9h sup', zs.plus, 9); eq('I2 · septembre : 1h à 50 %', zs.h50, 1); eq('I3 · octobre : 3h à 50 %', zo.h50, 3);
  eq('I4 · la semaine entière décide : 4h à 50 % (47h)', zs.h50 + zo.h50, 4);

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
    pdf.indexOf('<td>Heures sup \u00e0 +25\u202f%</td><td class="n">4h</td><td class="n">\u2014</td><td class="n">5h</td>') !== -1, true);
  eq('L22c · plus de bloc « Dimanches et jours fériés » séparé en septembre', pdf.indexOf('Dimanches et jours f\u00e9ri\u00e9s travaill\u00e9s'), -1);
  eq('L24 · l’année : septembre en cours, 2h utilisées', /<tr class="cur"><td>Sept<\/td><td class="n">4h<\/td><td class="n">\+5h<\/td><td class="n">\u22122h<\/td>/.test(pdf), true);
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
  eq('N22 · le cadre porte 154h, 149h, 23h', ['>154h<', '>149h<', '>23h<'].every(t => html.indexOf(t) !== -1), true);
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
  const rj = [...rel.matchAll(/<tr(?: class="(?:off|dim)")?><td class="jr">([^<]*)<\/td><td class="cpv">[^<]*<\/td><td class="cpv n">([^<]*)<\/td><td class="cfa">[^<]*<\/td><td class="cfa n">([^<]*)<\/td><td class="cpa">([^<]*)<\/td><td class="cpa n">([^<]*)<\/td><td class="n[^"]*">([^<]*)<\/td>/g)];
  eq('O4 · trente jours', rj.length, 30);
  const hh = t => { const m = /^(\u2212|-)?(\d+)h(\d*)$/.exec(t || ''); return m ? (m[1] ? -1 : 1) * (+m[2] + (m[3] ? +m[3] / 60 : 0)) : 0; };
  eq('O5 · colonnes : 154h prévues, 149h faites, 23h payées', [rj.reduce((a, r) => a + hh(r[2]), 0), rj.reduce((a, r) => a + hh(r[3]), 0), rj.reduce((a, r) => a + hh(r[5]), 0)].join('/'), '154/149/23');
  eq('O6 · l’écart des jours = les 18h sup', rj.reduce((a, r) => a + hh(r[6].replace('+', '')), 0), 18);
  eq('O7 · le 24 : « Congé payé » 7h, sans écart', JSON.stringify(rj.find(r => r[1] === 'Je 24').slice(4, 7)), JSON.stringify(['Cong\u00e9 pay\u00e9', '7h', '']));
  eq('O8 · la semaine du 7 dit ses 53h au-delà des 48h', rel.indexOf('53h sur la semaine, au-del\u00e0 des 48h autoris\u00e9es') !== -1, true);
  eq('O9 · page 2 : heures sup, récup, année, congés, acomptes, signatures',
    ['O\u00f9 vont les heures sup', 'Temps de r\u00e9cup', 'D\u00e9tail mois par mois \u2014 ann\u00e9e 2026', 'Cong\u00e9s pay\u00e9s', 'Compteur d\u2019heures', 'Acomptes sur salaire', 'Signature salari\u00e9', 'Signature employeur', 'Transmis \u00e0 la compta le'].every(t => rel.indexOf(t) !== -1), true);
  eq('O10 · le relevé lit le même cadre que l’écran', ['>154h<', '>149h<', '>23h<'].every(t => rel.indexOf(t) !== -1) && rel.indexOf('Aucune heure sup pay\u00e9e') !== -1, true);
  domaine({ ent: { 8: moisFiche }, hsup: { '2026-09': { paye: 8, demande: true } } });
  pages.length = 0; window._planReleveIndiv('Jean', 8); rel = pages[0] ? pages[0].html : '';
  eq('O11 · 8h payées : « Heures sup à +25 % 8h » à payer en plus', /Heures sup \u00e0 \+25\u202f%<\/span><span><b>8h<\/b>/.test(rel), true);
  eq('O12 · la signature porte la demande du salarié', rel.indexOf('qui demande le paiement de 8h sup') !== -1, true);
  domaine({ ent: { 7: { 3: T('08:00', '18:00') } } });
  pages.length = 0; window._planReleveIndiv('Jean', 7); rel = pages[0] ? pages[0].html : '';
  eq('O13 · août garde le relevé d’avant', rel.indexOf('Feuille d\u2019heures') !== -1 && rel.indexOf('<h2>Pour la paie</h2>') === -1, true);
  window.PLANNING_ACOMPTES.Jean = {};

  return { ok, ko, echecs };
}

// ── Contre-epreuves ─────────────────────────────────────────────────────────
const DEFAUTS = [
  ['les heures manquées retirées au taux heures sup', "r.retire=hm2.retire;r.retenue=tire(hm2.retire);", "r.retire=hm2.retire;r.retenue=tire(hm2.retire*1.25);"],
  ['le seuil des 50 % oublié', "var r50=Math.min(plus,Math.max(0,compte-PLAN_HS_SEUIL50));", "var r50=0;"],
  ['la majoration des heures sup oubliée', "ent.push({taux:b.taux,nat:b.nat,h:(b.h-p)*(1+b.taux/100)});", "ent.push({taux:b.taux,nat:b.nat,h:(b.h-p)});"],
  ['dimanche et heures sup cumulés', "if(jm)seau(MH,tx,nj,Math.max(0,jm.h-ec.plus),y.d);", "if(jm)seau(MH,tx,nj,jm.h,y.d);"],
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
  // FICHE-2
  ['le relevé de septembre retombe sur l’ancien', "if(_planRecupActive(planMonth)&&!(window._mvEstCollectif&&window._mvEstCollectif(mbr)))return _planReleveFiche_(nom,mbr,_ctr);", "if(false)return _planReleveFiche_(nom,mbr,_ctr);"],
  ['le relevé oublie les absences payées', "var payH=x.paye>0.0001?F(x.paye):(x.neutre>0.0001?F(x.neutre):'');", "var payH='';"],
  ['« sans toucher la récup prise » ignore la récup prise', "return rr.retenue<=z.retenue+1e-6&&rr.recupNC<=z.recupNC+1e-6;", "return true;"]
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
