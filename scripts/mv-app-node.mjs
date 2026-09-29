// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — L'APPLICATION ENTIÈRE DANS NODE (chargeur partagé des harnais ROB-2)
// ═══════════════════════════════════════════════════════════════════════════
//  Monté pour le Pilotage (28/09), sorti ici pour la Cave : chaque module du tirage au
//  hasard en a besoin, et deux copies d'un chargeur divergent au premier correctif.
//
//  CE QU'IL FAIT : copie src/ dans un dossier temporaire, retire de app.js l'import
//  du CSS et de Firebase, et importe app.js — donc TOUS les modules, dans l'ordre réel.
//   ★ `window` EST globalThis : dans le navigateur, `window.X = …` rend X lisible nu
//     ailleurs ; sans ça, un nom posé par un module et lu par un autre n'existe pas.
//   ★ Les minuteries ne tournent pas, l'horloge est réglable (setAuj).
//   ★ Une erreur AVALÉE (_mvAvale) compte comme un plantage, et _mvAvale est remplacée
//     parce qu'elle ne journalise qu'une fois par endroit et par session.
//   ★ poser(cles) fait entrer les données par applyFbData, le VRAI chemin de Firestore
//     (écrire window.X laisserait app.js sur ses copies internes).
//
//  Usage :  import { chargerApp } from './mv-app-node.mjs';
//           const A = await chargerApp({ remplace: { 'pilotage.js': '/tmp/copie.js' } });
//  Jamais déployé (scripts/) -> aucun bump.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
let REMPLACE = {};
// ── Horloge réglable ────────────────────────────────────────────────────────
const _D = Date; let AUJ = [2026, 8, 27];
class DateFixe extends _D {
  constructor(...a) { if (a.length) super(...a); else super(AUJ[0], AUJ[1], AUJ[2], 12, 0, 0); }
  static now() { return new _D(AUJ[0], AUJ[1], AUJ[2], 12, 0, 0).getTime(); }
}
globalThis.Date = DateFixe;

// ── DOM minimal. `window` EST globalThis : dans le navigateur, `window.X = …`
//    rend X lisible nu dans les autres modules (cf. mv-harnais-globaux).
function El() { return { id: '', innerHTML: '', textContent: '', value: '', style: { setProperty() {} }, dataset: {}, children: [], childNodes: [],
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, setAttribute() {}, getAttribute() { return null; }, removeAttribute() {}, hasAttribute() { return false; },
  appendChild(c) { return c; }, insertAdjacentHTML(p, h) { this.innerHTML += h; }, insertAdjacentText(p, t) { this.innerHTML += t; }, options: [], selectedIndex: 0, checked: false, files: [], insertBefore(c) { return c; }, removeChild() {}, addEventListener() {}, removeEventListener() {}, remove() {}, querySelector() { return null; }, querySelectorAll() { return []; },
  getBoundingClientRect() { return { width: 700, height: 300, top: 0, left: 0, right: 700, bottom: 300 }; }, focus() {}, blur() {}, click() {}, closest() { return null; }, scrollIntoView() {}, scrollTo() {},
  offsetWidth: 700, offsetHeight: 300, clientWidth: 700, scrollHeight: 0, parentNode: null, firstChild: null }; }
const els = {};
const doc = { body: El(), head: El(), documentElement: El(), getElementById(id) { return els[id] || (els[id] = El()); }, querySelector() { return null; }, querySelectorAll() { return []; },
  createElement() { return El(); }, createElementNS() { return El(); }, createTextNode() { return El(); }, addEventListener() {}, removeEventListener() {}, cookie: '', readyState: 'complete', visibilityState: 'visible', fonts: { ready: Promise.resolve() } };
const mem = {};
const G = globalThis;
Object.assign(G, {
  document: doc, location: { hostname: 'test', href: 'https://test/', origin: 'https://test', search: '', pathname: '/', hash: '', reload() {}, replace() {} },
  localStorage: { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; }, clear() { for (const k of Object.keys(mem)) delete mem[k]; }, key() { return null; }, length: 0 },
  addEventListener() {}, removeEventListener() {}, matchMedia() { return { matches: false, addEventListener() {}, addListener() {} }; },
  requestAnimationFrame() { return 0; }, cancelAnimationFrame() {}, getComputedStyle() { return { getPropertyValue() { return ''; } }; },
  innerWidth: 900, innerHeight: 800, scrollTo() {}, print() {}, alert() {}, confirm() { return true; },
  history: { pushState() {}, replaceState() {}, back() {}, state: null },
  MutationObserver: class { observe() {} disconnect() {} }, ResizeObserver: class { observe() {} disconnect() {} }, IntersectionObserver: class { observe() {} disconnect() {} },
});
G.sessionStorage = G.localStorage; G.window = G; G.self = G;
G.Blob = function (p) { this.parts = p; }; G.URL.createObjectURL = () => 'blob:x'; G.URL.revokeObjectURL = () => {};
try { Object.defineProperty(G, 'navigator', { value: { userAgent: 'node', onLine: true, language: 'fr-FR', standalone: false,
  serviceWorker: { register() { return Promise.resolve(); }, addEventListener() {}, getRegistrations() { return Promise.resolve([]); } } }, configurable: true }); } catch { /* lecture seule */ }
// Les minuteries ne tournent pas : un rendu différé qui planterait plus tard ne
// doit pas faire tomber le processus au milieu d'un autre tirage.
G.setTimeout = () => 0; G.setInterval = () => 0; G.clearTimeout = () => {}; G.clearInterval = () => {};

// ── L'application entière : une copie de src/, app.js sans CSS ni Firebase ──
async function charger() {
  const T = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-robpil-'));
  for (const f of fs.readdirSync(path.join(RACINE, 'src'))) if (f.endsWith('.js')) fs.copyFileSync(path.join(RACINE, 'src', f), path.join(T, f));
  for (const [nom, f] of Object.entries(REMPLACE)) fs.copyFileSync(f, path.join(T, nom));
  const app = fs.readFileSync(path.join(T, 'app.js'), 'utf8');
  if (app.indexOf("import './styles.css';") < 0 || app.indexOf("import './firebase.js';") < 0) { console.log('   ROUGE  app.js : imports CSS / firebase introuvables'); process.exit(1); }
  fs.writeFileSync(path.join(T, 'app.js'), app.replace("import './styles.css';", '').replace("import './firebase.js';", ''));
  const logAvant = console.log; const errAvant = console.error; const warnAvant = console.warn;
  console.log = () => {}; console.error = () => {}; console.warn = () => {};
  try { await import(pathToFileURL(path.join(T, 'app.js')).href); }
  catch (e) { console.log = logAvant; console.log('   ROUGE  l\u2019application ne se charge pas : ' + e.message); process.exit(1); }
  finally { console.log = logAvant; console.error = errAvant; console.warn = warnAvant; fs.rmSync(T, { recursive: true, force: true }); }
  // ⚠️ APRÈS le chargement : utils.js/app.js posent leurs propres logError, _mvAvale… au chargement.
  //    Posées avant, ces doublures seraient écrasées sans bruit (vécu à l'extraction de ce chargeur).
  // ★ Une erreur AVALÉE (_mvAvale : try/catch du module, niveau « info », cat 'avale') est un plantage
  //   que l'écran cache : il compte. Et _mvAvale ne journalise qu'UNE fois par endroit et par session —
  //   on remplace donc la primitive pour tout voir.
  G.logError = o => { if (o && (o.level !== 'info' || o.cat === 'avale')) JOURNAL_ERR.push(o); };
  G._mvAvale = (e, ou) => { JOURNAL_ERR.push({ level: 'info', cat: 'avale', msg: 'erreur avalée dans ' + (ou || '?') + ' : ' + String((e && e.message) || e).slice(0, 140) }); };
  G._mvIcon = () => '<svg></svg>';
  G.isAdmin = () => true; G.currentUser = { nom: 'Nico', roles: ['admin'] }; G._dataReady = true;
  G.saveData = () => {}; G.fbSave = () => {}; G.fbSaveToast = () => {}; G.showToast = () => {}; G.saveIntrants = () => {};
}
const JOURNAL_ERR = [];

const SALE = ['undefined', 'NaN', '[object Object]', 'Infinity'];
function sale(h) { return typeof h === 'string' ? SALE.filter(m => h.indexOf(m) !== -1).map(m => m + ' : …' + h.slice(Math.max(0, h.indexOf(m) - 60), h.indexOf(m) + 15).replace(/\s+/g, ' ') + '…') : []; }
function poser(cles) {
  for (const [k, v] of Object.entries(cles)) {
    const j0 = JOURNAL_ERR.length;
    try { G.applyFbData(k, JSON.parse(JSON.stringify(v))); }
    catch (e) { throw new Error('applyFbData(' + k + ') : ' + e.message); }
    JOURNAL_ERR.length = j0;       // ce qu'applyFbData journalise en chargeant n'est pas l'écran testé
  }
}
// Tout le HTML écrit depuis le dernier vidage, tous conteneurs confondus.
function ecran() { return Object.values(els).map(e => (e.innerHTML || '') + (e.textContent || '')).join('\n'); }
function viderEcran() { for (const k of Object.keys(els)) delete els[k]; }

export async function chargerApp(opts) {
  REMPLACE = (opts && opts.remplace) || {};
  await charger();
  return { G, els, mem, JOURNAL_ERR, sale, poser, ecran, viderEcran, _D, setAuj: a => { AUJ = a; } };
}
