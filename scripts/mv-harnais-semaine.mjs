#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais SEM-1 : les trois relevés de septembre 2026, passés dans le VRAI moteur
// ═══════════════════════════════════════════════════════════════════════════
//  Les relevés de Chloé, Nico et Victor édités le 17/09/2026 sont le point de départ du lot : « beaucoup
//  d'erreurs ». Leurs jours sont reposés ici tels que saisis (anonymisation inutile : ce sont des prénoms
//  de test du domaine pilote, déjà dans les harnais du relevé), et le vrai planning.js doit rendre ce que
//  la maquette v3 validée par Nico (« go ») annonçait :
//    · Chloé  21h   — 11h30 à 25 %, 4h à 50 %, 5h30 le dimanche ; 1h30 écourtées, rattrapées dans la semaine ;
//    · Nico   10h30 — 5h à 25 %, RIEN à 50 % (planning 40h : avant, « 1h à 25 %, 4h à 50 % ») ; le 18 vaut 8h ;
//    · Victor 3h    — les 7h du week-end rattrapent 7h d'absence injustifiée, le dimanche garde sa majoration seule.
//  ★ NET-1 (19/09/2026) : une absence sans motif est injustifiée depuis septembre. Le 9 de Nico et les 2 et 12 de Victor
//    le deviennent : Nico 5h sup (sa semaine du 7 rattrape le 9), Victor 0h ; le paiement ne prend que ce qui reste.
//  ★ PAIE-1 (19/09/2026) : dans la semaine, le salarié passe d'abord (Victor : 3h45 retenues au lieu de 5h45, 5h30 à rattraper
//    au lieu de 3h30 ; Nico : son absence du 9 est rattrapée en entier) ; la demande de Nico (10h30 + 19h30) est un total : 30h.
//  ★ Même chargement que mv-harnais-recup (le vrai module, horloge figée au 16/09/2026). Un CRASH est ROUGE.
//  Usage :  node scripts/mv-harnais-semaine.mjs
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
const EXPORTS = ['_planMajMonth', '_pfPrevT', '_planSemainesDuMois', '_pfAnnee', '_planPayeMaxTotal', '_planPayeMaxCouvert', '_planPayeEcrire', '_planDepartKey', '_pfRestants', '_planPaieMois', '_planPayeMaxCouvert', '_planSemEffectif', '_pfCadre', '_pfDemande', '_pfOuVont', '_pfJours', '_pfCompteur', '_pfConges', '_pfResume', '_planValeurPourBrut', '_planComptaLignes', '_planComptaTable', '_planSeauxTxt', '_planSeauNom', '_planJourEcart', '_planHsupMois', '_planHsupTiers', '_planCompteur', '_planBank',
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


const SRC = fs.readFileSync(path.join(RACINE, 'src', 'planning.js'), 'utf8');
const R = await charger(SRC);
const vider = o => { for (const k of Object.keys(o)) delete o[k]; return o; };
const T = (d, f, c) => ({ timing: { debut: d, fin: f, continu: !!c } });
const court = (d, f, c) => Object.assign(T(d, f, c), { reduit_motif: 'domaine' });
function grille(fn) { const t = {}; for (let m = 0; m < 12; m++) { t[m] = {}; const nd = new _D(2026, m + 1, 0).getDate(); for (let d = 1; d <= nd; d++) t[m][d] = fn(m, d, new _D(2026, m, d).getDay()) || 0; } for (const [m, d] of [[0, 1], [3, 6], [4, 1], [4, 8], [4, 14], [4, 25], [6, 14], [7, 15], [10, 1], [10, 11], [11, 25]]) t[m][d] = 0; /* fériés chômés : sinon 49h de majoration fantôme (§135e) */ t._timings = {}; for (let m = 0; m < 12; m++) t._timings[m] = { d: '07:00' }; return t; }
const NICO = { '7-31': 8.5, '8-1': 8.5, '8-2': 6.5, '8-3': 8.5, '8-4': 8, '8-7': 7, '8-8': 7, '8-9': 7, '8-10': 7, '8-11': 7, '8-12': 7, '8-14': 8.5, '8-15': 6.5, '8-16': 6.5, '8-17': 8.5, '8-18': 8, '8-21': 6.5, '8-22': 8.5, '8-24': 6.5, '8-25': 7, '8-28': 8.5, '8-29': 6.5, '8-30': 6.5 };
const tpls = {
  h35: grille((m, d, w) => (w >= 1 && w <= 5) ? 7 : 0),
  nico: grille((m, d) => NICO[m + '-' + d] || 0),
  std: grille((m, d, w) => (m === 8 && d >= 7 && d <= 12) ? 7 : (w >= 1 && w <= 4 ? 8.5 : (w === 5 ? 5 : 0)))
};
const commun = { 7: { 31: T('06:00', '17:30') }, 8: { 1: T('06:00', '17:30'), 2: T('06:00', '16:30'), 4: T('07:00', '16:30', true), 8: T('07:00', '16:30'), 12: T('09:00', '16:00', true), 13: T('09:00', '15:30') } };
const ENT = {
  Chloe: { 7: commun[7], 8: Object.assign({}, commun[8], { 3: T('08:00', '15:00', true), 7: court('09:00', '16:30'), 9: T('08:30', '16:30'), 10: court('09:00', '16:30'), 11: court('09:00', '16:30') }) },
  Nico: { 7: commun[7], 8: Object.assign({}, commun[8], { 3: court('08:00', '15:00', true), 7: court('09:00', '16:30'), 9: { absent: true, motif: 'autre' }, 10: court('09:00', '16:30'), 11: court('09:00', '16:30') }) },
  Victor: { 8: { 1: { absent: true, motif: 'injustifie' }, 2: { absent: true, motif: 'autre' }, 3: { absent: true, motif: 'injustifie' }, 4: { absent: true, motif: 'injustifie' },
    5: T('09:00', '12:30'), 6: T('09:00', '12:30'), 7: T('07:00', '16:15'), 8: T('07:00', '16:15'), 9: T('07:00', '16:15'), 10: T('07:00', '16:15'), 11: court('07:00', '12:00'), 12: { absent: true, motif: 'autre' }, 15: court('07:00', '12:00') } }
};
const M = [{ nom: 'Chloe', statut: 'Actif', type_contrat: 'CDI', planning_id: 'h35' }, { nom: 'Nico', statut: 'Actif', type_contrat: 'CDI', planning_id: 'nico' }, { nom: 'Victor', statut: 'Actif', type_contrat: 'CDI', planning_id: 'std' }];
Object.assign(vider(window.PLANNING_TEMPLATES), { 2026: tpls });
Object.assign(vider(window.PLANNING_ENTRIES), { Chloe: { 2026: ENT.Chloe }, Nico: { 2026: ENT.Nico }, Victor: { 2026: ENT.Victor } });
// Les compteurs de fin août des PDF, posés en solde de départ : 31h, 43h30, 20h. Nico demande 30h, Victor 3h.
const dep = v => ({ [R._an() + '-dep']: { solde: v, date: '2026-01-01' } });
Object.assign(vider(window.PLANNING_HSUP), { Chloe: dep(31), Nico: Object.assign(dep(43.5), { '2026-09': { demande: true, paye: 10.5, paye_bank: 19.5 } }), Victor: Object.assign(dep(20), { '2026-09': { demande: true, paye: 3 } }) });
Object.assign(vider(window.CONFIG), { hsup_mode: 'recup', coupure_heure: '12:00' });
window.MEMBRES.length = 0; M.forEach(x => window.MEMBRES.push(x));
let rouge = 0; const eq = (n, a, b) => { const ok = (typeof b === 'number') ? Math.abs(a - b) < 0.006 : a === b; if (!ok) { rouge++; console.log('  ✗ ' + n + ' — obtenu ' + JSON.stringify(a) + ', attendu ' + JSON.stringify(b)); } };
const bk = z => z.buckets.map(b => b.taux + b.nat + ':' + b.h).join(' ');
// ⚠️ Août est sous la règle historique : son écart mensuel entre au compteur. Pour isoler septembre, on lit les lignes de septembre.
let z = R._planHsupMois(M[0], 8);
eq('Chloé 21h', z.plus, 21); eq('Chloé taux', bk(z), '25hs:11.5 50hs:4 50dim:5.5'); eq('Chloé domaine rattrapé', [z.domaine, z.rattrape.domaine].join('/'), '0/1.5');
eq('Chloé S1 déjà en août', z.semaines[0].deja, 3.5);
z = R._planHsupMois(M[1], 8);
eq('Nico 5h — le 9, sans motif, est injustifié : les heures en plus de sa semaine le rattrapent', z.plus, 5); eq('Nico taux : 5h à 25 %', bk(z), '25hs:5'); eq('Nico domaine : 1h30 rattrapées, 1h30 restent — son absence du 9 passe d’abord dans la semaine (PAIE-1)', [z.domaine, z.rattrape.domaine].join('/'), '1.5/1.5');
eq('Nico faites 165h, le 18 vaut 8h', [R._planPaieMois(M[1], 8).faites, R._planDayH('nico', 8, 18, null)].join('/'), '165/8');
z = R._planHsupMois(M[2], 8);
eq('Victor 0h — les 2 et 12, sans motif, sont injustifiés', z.plus, 0); eq('Victor taux', bk(z), ''); eq('Victor absence : 12h rattrapées, 25h30 restent — le salarié d’abord dans la semaine (PAIE-1)', [z.rattrape.retire, z.retire].join('/'), '12/25.5');
eq('Victor domaine : rien dans la semaine, 5h30 restent — le 11 passe après son absence du 12 (PAIE-1)', [z.rattrape.domaine, z.domaine].join('/'), '0/5.5'); eq('Victor dimanche : majoration seule 3h30', JSON.stringify(z.majHs.map(x => [x.taux, x.nat, x.h])), '[[50,"dim",3.5]]');
const rows = n => R._planCompteur(M[n], 8).rows[8];
// Le solde de départ + l'écart historique d'août (3h30 / 2h / 0h) donnent le solde d'entrée de septembre
eq('Chloé compteur : 31 + 3h30 d’août + 28h37 = 63h07', R._planBank(M[0], 8).solde, 31 + 3.5 + 28.625);
eq('Nico compteur : 43h30 + 2h d’août + 2h45 de majoration du dimanche 13 − 1h30 reprises − 25h payées au compteur = 21h45 (PAIE-1 : sa demande de 30h est un total)', R._planBank(M[1], 8).solde, 43.5 + 2 + 2.75 - 1.5 - 25);
eq('Nico : 10h30 demandées sur le mois, 5h payées — ses heures sup du mois', rows(1).paye, 5);
eq('Victor compteur : 20 + 1h45 − 25h30 = 3h45 retenues ; les 5h30 du domaine à rattraper ; rien de payé (PAIE-1)', [R._planBank(M[2], 8).solde, rows(2).retenue, R._planBank(M[2], 8).dette, rows(2).paye].join('/'), '0/3.75/5.5/0');
console.log(rouge ? '  ' + rouge + ' rouge(s)' : '  ✓ les trois relevés de septembre : le vrai moteur dit comme la maquette v3');
process.exit(rouge ? 1 : 0);
