#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — VUE-EQUIPE-1 (§251) : L'ÉQUIPE DU MOIS, VUE PAR UN SALARIÉ (lecture seule)
     node scripts/mv-harnais-vueeq1.mjs            → doit être vert
     node scripts/mv-harnais-vueeq1.mjs --contre   → chaque défaut réinjecté doit faire rougir SON contrôle

   Demande de Nico (05/10/2026), maquette validée : chaque salarié voit qui est là dans l'équipe, jour par jour, sur
   le mois EN COURS — présent ou absent, JAMAIS le motif (même un congé s'affiche « Abs »), ni heures, ni écart, ni
   congés des autres. Absence d'une partie de la journée = présent. Sa ligne en tête ; « Présents » compte ceux qui
   sont là parmi ceux attendus (équipes collectives exclues). Le classement d'un jour = celui de la grille de l'admin.

   Le VRAI src/planning.js est chargé dans Node (même montage que mv-harnais-robustesse-planning : DOM simulé, utils.js
   réel), horloge fixée au lundi 5 octobre 2026, données comme sur un téléphone de salarié (ses jours complets, les
   collègues sans motif) puis comme chez l'admin (tout, motifs compris : la vue ne doit RIEN en montrer non plus).
   ⚠️ La contre-épreuve rejoue chaque défaut dans un processus à part (planning.js a un état de module).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const CONTRE = process.argv.includes('--contre');
const JSON_OUT = process.argv.includes('--json');
const iC = process.argv.indexOf('--cible');
const CIBLE = iC > 0 ? process.argv[iC + 1] : path.join(RACINE, 'src', 'planning.js');
const lire = (p) => fs.readFileSync(path.join(RACINE, p), 'utf8');
const c = { g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, dim: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m` };

/* ── Montage : le vrai planning.js dans Node ───────────────────────────── */
async function monter(cible) {
  const _D = Date; const AUJ = [2026, 9, 5];
  class FauxDate extends _D {
    constructor(...a) { if (a.length) super(...a); else super(AUJ[0], AUJ[1], AUJ[2], 10, 0, 0); }
    static now() { return new FauxDate().getTime(); }
  }
  globalThis.Date = FauxDate;
  function El() {
    return { innerHTML: '', textContent: '', value: '', style: {}, dataset: {}, children: [],
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      setAttribute() {}, getAttribute() { return null; }, appendChild(x) { return x; }, insertBefore(x) { return x; },
      removeChild() {}, addEventListener() {}, remove() {}, querySelector() { return null; }, querySelectorAll() { return []; },
      getBoundingClientRect() { return { width: 390, height: 300, top: 0, left: 0 }; }, focus() {}, click() {}, closest() { return null; } };
  }
  const els = {};
  const doc = { body: El(), head: El(), documentElement: El(), getElementById(id) { return els[id] || (els[id] = El()); },
    querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return El(); }, addEventListener() {}, cookie: '' };
  const mem = {};
  const win = { document: doc, location: { hostname: 'test', href: 'https://test/', origin: 'https://test', search: '', pathname: '/' },
    localStorage: { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; }, clear() {}, key() { return null; }, length: 0 },
    navigator: { userAgent: 'node', onLine: true, language: 'fr-FR' }, addEventListener() {},
    matchMedia() { return { matches: false, addEventListener() {}, addListener() {} }; }, requestAnimationFrame() { return 0; },
    getComputedStyle() { return { getPropertyValue() { return ''; } }; }, innerWidth: 390, innerHeight: 844,
    print() {}, alert() {}, confirm() { return true; }, URL: { createObjectURL() { return 'blob:x'; }, revokeObjectURL() {} }, Blob: function (p) { this.parts = p; } };
  globalThis.MutationObserver = class { observe() {} disconnect() {} }; win.MutationObserver = globalThis.MutationObserver;
  win.window = win; win.self = win;
  globalThis.window = win; globalThis.document = doc; globalThis.location = win.location;
  globalThis.localStorage = win.localStorage; globalThis.sessionStorage = win.localStorage;
  globalThis.requestAnimationFrame = win.requestAnimationFrame; globalThis.getComputedStyle = win.getComputedStyle;
  globalThis.matchMedia = win.matchMedia; globalThis.Blob = win.Blob; globalThis.alert = win.alert;
  try { Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true }); } catch (e) { /* lecture seule */ }
  win.fbSaveToast = () => {}; win.showToast = () => {}; win._dataReady = true; win._mvSk = () => '';
  window.PLANNING_TEMPLATES = {}; window.PLANNING_ENTRIES = {}; window.PLANNING_HSUP = {}; window.PLANNING_ACOMPTES = {};
  window.CONFIG = {}; window.MEMBRES = [];
  const U = await import(pathToFileURL(path.join(RACINE, 'src', 'utils.js')).href);
  for (const [k, v] of Object.entries(U)) if (typeof v === 'function') { if (!(k in win)) win[k] = v; if (!(k in globalThis)) globalThis[k] = v; }
  win._mvIcon = (n) => '<svg data-ic="' + n + '"></svg>'; globalThis._mvIcon = win._mvIcon;
  const JOURNAL = []; win.logError = (o) => { if (o && o.level !== 'info') JOURNAL.push(o); };
  const EXPORTS = ['renderPlanning', 'planSwitchTab', '_planEqSalHtml', '_planEqSalKpis', '_planEqData', 'planEqVue', 'planEqNav'];
  const utils = pathToFileURL(path.join(RACINE, 'src', 'utils.js')).href;
  const code = fs.readFileSync(cible, 'utf8').replace("from './utils.js'", "from '" + utils + "'")
    + '\n;globalThis.__VEQ={' + EXPORTS.map((n) => n + ':(typeof ' + n + "==='function'?" + n + ':undefined)').join(',')
    + ',_etat:function(){return {planTab:planTab,planMonth:planMonth,planYear:planYear};},_tab:function(t){planTab=t;}};\n';
  const f = path.join(os.tmpdir(), 'mv-veq-' + process.pid + '-' + Math.random().toString(36).slice(2) + '.mjs');
  fs.writeFileSync(f, code);
  try { await import(pathToFileURL(f).href); } finally { fs.unlinkSync(f); }
  return { R: globalThis.__VEQ, win, els, JOURNAL, U, FauxDate };
}

/* ── Données : octobre 2026, lundi 5 = aujourd'hui ─────────────────────── */
function modeleFixe(an) {
  const t = { _timings: {} };
  for (let m = 0; m < 12; m++) {
    t[m] = {}; t._timings[m] = { d: '08:00' }; const nd = new Date(an, m + 1, 0).getDate();
    for (let d = 1; d <= nd; d++) { const w = new Date(an, m, d).getDay(); t[m][d] = (w >= 1 && w <= 5) ? 7 : 0; }
  }
  return t;
}
const MEMBRES = [
  { nom: 'Theo', statut: 'Actif', type_contrat: 'CDI', planning_id: 'standard', couleur: '#7B6DB8' },
  { nom: 'Marie', statut: 'Actif', type_contrat: 'CDI', planning_id: 'standard', couleur: '#1A4A7A' },
  { nom: 'Lucas', statut: 'Actif', type_contrat: 'CDI', planning_id: 'standard', couleur: '#3D6B27' },
  { nom: 'Jean', statut: 'Actif', type_contrat: 'CDI', planning_id: 'standard', couleur: '#8A5A38' },
  { nom: 'Sarah', statut: 'Actif', type_contrat: 'CDI', planning_id: 'standard', couleur: '#B85A1A' },
  { nom: 'Équipe V', statut: 'Actif', type_contrat: 'Saisonnier', planning_id: 'standard', collectif: true, effectif: 5, debut_contrat: '2026-09-01', fin_contrat: '2026-12-31' },
  { nom: 'Inès', statut: 'Actif', type_contrat: 'CDD', planning_id: 'standard', debut_contrat: '2026-10-12', fin_contrat: '2026-12-31' },
];
const SANS = { absent: true, motif: 'autre' };
const jours = (liste, e) => { const o = {}; liste.forEach((d) => { o[d] = JSON.parse(JSON.stringify(e)); }); return o; };
// Ce que détient un téléphone de salarié depuis MOTIFS-1 : SES jours complets, les collègues sans motif.
const SALARIE = {
  Lucas: { 2026: { 9: { 23: { type: 'cp', heures: 7 }, 26: { type: 'cp', heures: 7 } } } },
  Theo: { 2026: { 9: jours([1, 2, 5], SANS) } },
  Marie: { 2026: { 9: jours([12, 13, 14, 15, 16], SANS) } },
  Jean: { 2026: { 9: jours([7], SANS) } },
  Sarah: { 2026: { 9: jours([9], SANS) } },
};
// Ce que détient l'admin : tout, motifs et commentaires compris.
const COMPLET = {
  Lucas: SALARIE.Lucas,
  Theo: { 2026: { 9: { 1: { absent: true, motif: 'arret', comment: 'grippe' }, 2: { absent: true, motif: 'arret' },
    5: { absent: true, motif: 'arret' }, 6: { absent: true, motif: 'retard', motif_h: 1, motif_t: '09:00' } } } },
  Marie: { 2026: { 9: { 12: { type: 'cp', heures: 7 }, 13: { type: 'cp', heures: 7 }, 14: { type: 'cp', heures: 7 }, 15: { type: 'cp', heures: 7 }, 16: { type: 'cp', heures: 7 } } } },
  Jean: { 2026: { 9: { 7: { absent: true, motif: 'formation' }, 8: { absent: true, motif: 'perso', abs_de: '14:00', abs_a: '16:30', comment: 'médecin' } } } },
  Sarah: { 2026: { 9: { 9: { type: 'recup' }, 20: { absent: true, motif: 'injustifie', comment: 'pas prévenu' } } } },
};
const vider = (o) => { for (const k of Object.keys(o)) delete o[k]; return o; };
function poser(entries, cu) {
  window.MEMBRES.length = 0; MEMBRES.forEach((m) => window.MEMBRES.push(JSON.parse(JSON.stringify(m))));
  Object.assign(vider(window.PLANNING_TEMPLATES), { 2026: { standard: modeleFixe(2026) } });
  Object.assign(vider(window.PLANNING_ENTRIES), JSON.parse(JSON.stringify(entries)));
  window.currentUser = cu; globalThis.currentUser = cu;
}
const compte = (h, motif) => (h.match(new RegExp(motif, 'g')) || []).length;
// ⚠️ « pl2-tot » SEUL (suivi d'une espace ou du guillemet) : « pl2-totl » est la cellule « Présents » du début de ligne —
//    le premier passage la comptait comme un jour (32 jours en octobre) : c'était le TEST qui avait tort, pas le code.
const totaux = (h) => [...h.matchAll(/class="pl2-tot(?:\s[^"]*)?">([^<]*)</g)].map((m) => m[1]);

/* ── La suite ───────────────────────────────────────────────────────────── */
async function suite(cible) {
  const res = [];
  const T = async (id, lib, fn) => { let ok = false; try { ok = !!(await fn()); } catch (e) { ok = false; } res.push([id, lib, ok]); };
  const { R, els, JOURNAL } = await monter(cible);
  const OUV = { nom: 'Lucas', roles: ['ouvrier'] }, ADM = { nom: 'Nico', roles: ['admin', 'ouvrier'] };
  poser(SALARIE, OUV);
  let hMoi = '', hEq = '', kpi = '';
  try { R._tab('planning'); R.renderPlanning(); hMoi = els['plan-body'].innerHTML; } catch (e) { hMoi = ''; }
  await T('V1', 'un salarié arrive sur Mon mois, comme avant', () => R._etat().planTab === 'moi' && /plan-days-list/.test(hMoi));
  try { R.planSwitchTab('eqmois'); hEq = els['plan-body'].innerHTML; kpi = els['plan-stats-band'].innerHTML; } catch (e) { hEq = ''; }
  await T('V2', 'l’onglet L’équipe s’ouvre pour un salarié, et le reste au rendu suivant', () => {
    const ok1 = /class="pleq"/.test(hEq) && R._etat().planTab === 'eqmois';
    R.renderPlanning(); return ok1 && R._etat().planTab === 'eqmois' && /class="pleq"/.test(els['plan-body'].innerHTML);
  });
  await T('V3', 'lecture seule : aucune case, aucun nom, aucun jour ne réagit au toucher — seules la navigation et la bascule semaine / mois', () =>
    !/planCellTap|planColTap|planRowTap|planSelAll|openPlanDayModal|openPlanFiche/.test(hEq) && compte(hEq, 'onclick=') === 4
    && /onclick="planEqNav\(-1\)"/.test(hEq) && /onclick="planEqVue\('mo'\)"/.test(hEq) && /Lecture seule/.test(hEq));
  await T('V4', 'sa ligne en tête, marquée « vous », les autres dans l’ordre de la grille', () => {
    const i = (n) => hEq.indexOf('pl2-name-n">' + n + '<');
    return compte(hEq, 'pleq-vous') === 1 && i('Lucas') > 0 && i('Lucas') < i('Theo') && i('Theo') < i('Marie') && i('Marie') < i('Jean');
  });
  if (process.env.VEQ_DEBUG) console.error('V5 abs', compte(hEq, 'pleq-chip pleq-abs'), 'pres', compte(hEq, 'pleq-chip pleq-pres'), 'tot', totaux(hEq).join(), 'x5', compte(hEq, '\u00d75'), 'noms', [...hEq.matchAll(/pl2-name-n">([^<]*)</g)].map((m) => m[1]).join());
  await T('V5', 'semaine du 5 : 3 absences (« Abs »), 27 présences, « Présents » = présents parmi les attendus, équipes collectives à part', () =>
    compte(hEq, 'pleq-chip pleq-abs') === 3 && compte(hEq, 'pleq-chip pleq-pres') === 27
    && totaux(hEq).join() === '4/5,5/5,4/5,5/5,4/5,\u00b7,\u00b7' && compte(hEq, '\u00d75') === 5);
  await T('V6', 'en tête : 4 sur 5 présents aujourd’hui, 1 absent, 5 sur 5 demain', () =>
    /4 sur 5<\/div><div class="mvu-kpi-l">Présents aujourd’hui/.test(kpi) && /1<\/div><div class="mvu-kpi-l">Absent aujourd’hui/.test(kpi)
    && /5 sur 5<\/div><div class="mvu-kpi-l">Présents demain/.test(kpi));
  await T('V7', 'hors contrat (arrivée le 12) : « – » toute la semaine, jamais compté', () => compte(hEq, 'pl2c-hc') === 7);
  let hMo = '';
  try { R.planEqVue('mo'); hMo = els['plan-body'].innerHTML; } catch (e) { hMo = ''; }
  if (process.env.VEQ_DEBUG) console.error('V8 dh', compte(hMo, 'pl2-dh-num">'), 'abs', compte(hMo, 'pleq-chip pleq-abs'), 'dis', compte(hMo, ' disabled'), 'tot', totaux(hMo).length);
  await T('V8', 'le mois entier : 31 jours, 12 absences, les flèches éteintes (on ne quitte pas le mois en cours)', () =>
    compte(hMo, 'pl2-dh-num">') === 31 && compte(hMo, 'pleq-chip pleq-abs') === 12 && compte(hMo, ' disabled') === 2 && totaux(hMo).length === 31);
  await T('V9', 'semaine par semaine : du 1er au 31 octobre, jamais au-delà', () => {
    R.planEqVue('wk'); R.planEqNav(1); const s42 = /Semaine 42/.test(els['plan-body'].innerHTML);
    R.planEqNav(1); R.planEqNav(1); R.planEqNav(1); R.planEqNav(1);
    const h = els['plan-body'].innerHTML;
    return s42 && /Semaine 44/.test(h) && /onclick="planEqNav\(1\)" disabled/.test(h) && !/undefined|NaN/.test(h);
  });
  // Chez l'admin (données complètes) : la même vue ne doit RIEN montrer d'un motif.
  poser(COMPLET, OUV);
  let hC = '', D = null;
  try { R._tab('eqmois'); R.renderPlanning(); hC = els['plan-body'].innerHTML; D = R._planEqData(); } catch (e) { hC = ''; }
  const MOTS = ['Arr\u00eat', 'Formation', 'injustifi', 'Personnel', 'Cong\u00e9', 'R\u00e9cup', 'Retard', 'grippe', 'm\u00e9decin', 'pr\u00e9venu', 'domaine', 'familial'];
  await T('V10', 'même avec tous les motifs sur l’appareil : aucun motif, aucun commentaire, aucun type de jour à l’écran', () =>
    hC.length > 1000 && MOTS.every((m) => hC.indexOf(m) < 0));
  await T('V11', 'une absence d’une partie de la journée et un retard comptent « présent » ; congé et récup « absent »', () => {
    const L = (n) => D.lignes.find((l) => l.nom === n).jours;
    return L('Jean')[8] === 'pres' && L('Theo')[6] === 'pres' && L('Marie')[12] === 'abs' && L('Sarah')[9] === 'abs' && L('Lucas')[23] === 'abs';
  });
  // Chez l'admin : rien ne change.
  poser(COMPLET, ADM);
  let hA = '';
  try { R._tab('eqmois'); R.renderPlanning(); hA = els['plan-body'].innerHTML; } catch (e) { hA = ''; }
  await T('V12', 'chez l’admin, rien ne change : sa grille du mois (qui se coche), pas la vue salarié', () =>
    R._etat().planTab === 'mois' && /planCellTap/.test(hA) && !/class="pleq"/.test(hA));
  await T('V13', 'aucune erreur journalisée, rien d’« undefined » ni de « NaN » à l’écran', () =>
    JOURNAL.length === 0 && ![hEq, hMo, hC].some((h) => /undefined|NaN|\[object Object\]/.test(h)));
  // Le câblage et l'accompagnement (lus dans le dépôt, sans commentaires)
  const P = fs.readFileSync(cible, 'utf8').split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');
  await T('V14', 'un jour se classe par la grille de l’admin (_pl2Cell) ; les gestes sont exposés ; aucune taille de texte en dur', () =>
    /function _planEqEtat\(mbr,plId,d,L\)\{\s*var c=_pl2Cell\(mbr,plId,d,L\);/.test(P) && /window\.planEqVue\s*=\s*planEqVue;/.test(P)
    && /window\.planEqNav\s*=\s*planEqNav;/.test(P) && !/font-size:\d/.test(P.slice(P.indexOf('function _planEqInjectCss'), P.indexOf('function _planEqCols'))));
  const IDX = lire('index.html');
  await T('V15', 'index.html : les deux onglets du salarié (Mon mois, L’équipe)', () =>
    /class="mvu-tab plan-tab-sal" data-tab="moi" onclick="planSwitchTab\(&#39;moi&#39;\)"/.test(IDX) && /class="mvu-tab plan-tab-sal" data-tab="eqmois" onclick="planSwitchTab\(&#39;eqmois&#39;\)"/.test(IDX));
  await T('V16', 'aide et guide disent la vérité : deux onglets pour le salarié, L’équipe sans motif', () =>
    lire('src/utils.js').includes('L’équipe, côté salarié') && lire('guide/10-planning.html').includes("L'équipe, côté salarié")
    && !lire('guide/10-planning.html').includes('ne voit <b>aucun onglet</b>') && !lire('src/utils.js').includes('n’a pas d’onglets : il arrive sur son mois'));
  return res;
}

/* ── Contre-épreuves : [nom, ancre, remplacement, contrôles qui DOIVENT rougir] ── */
const MUT = [
  ['une absence affiche son motif', "chip='<span class=\"pleq-chip pleq-abs\" title=\"Absent\">Abs</span>';",
   "chip='<span class=\"pleq-chip pleq-abs\" title=\"Absent\">'+_planDayStatus(_planPlId(l.mbr),planMonth,d,_pEntDay(l.nom,planMonth,d)).l+'</span>';", ['V10']],
  ['les cases redeviennent des boutons qui cochent', "h+='<div class=\"pl2-cell pleq-ro'", "h+='<div onclick=\"planCellTap(\\''+_escAttr(l.nom)+'\\','+d+')\" class=\"pl2-cell pleq-ro'", ['V3']],
  ['sa ligne n’est plus en tête', 'mbrs.sort(function(a,b){ return (a.nom===moi?0:1)-(b.nom===moi?0:1); });', '', ['V4']],
  ['l’équipe collective est comptée parmi les présents', 'if(l.coll)return; var e=l.jours[d];', 'var e=l.jours[d];', ['V5']],
  ['une absence partielle devient une absence', "'pl2c-heat':1,'pl2c-late':1};\nvar _PLEQ_ABS={'pl2c-cp':1,'pl2c-rec':1,'pl2c-abs':1};", "'pl2c-heat':1};\nvar _PLEQ_ABS={'pl2c-cp':1,'pl2c-rec':1,'pl2c-abs':1,'pl2c-late':1};", ['V11']],
  ['l’onglet L’équipe est refermé à chaque rendu', "if(!adm){ if(planTab!=='eqmois')planTab='moi'; }", "if(!adm){ planTab='moi'; }", ['V2']],
  ['la navigation sort du mois en cours', 'if(ni<0||ni>=ws.length)return;', 'if(ni<0)return;', ['V9']],
  ['les chiffres de tête regardent demain', 'a=_planEqCompte(data,t.getDate());', 'a=_planEqCompte(data,t.getDate()+1);', ['V6']],
];

/* ── Principal ─────────────────────────────────────────────────────────── */
let code = 0;
try {
  if (JSON_OUT) {
    process.stdout.write(JSON.stringify(await suite(CIBLE)));
  } else if (!CONTRE) {
    console.log(c.b('MA VIGNE — Harnais VUE-EQUIPE-1 · l’équipe du mois vue par un salarié'));
    const res = await suite(CIBLE);
    res.forEach(([id, lib, ok]) => console.log('  ' + (ok ? c.g('✓') : c.r('✗')) + ' ' + c.dim(id) + ' ' + lib));
    const ko = res.filter((r) => !r[2]).length;
    console.log('\n' + (ko ? c.r(`✗ ${ko} rouge(s) sur ${res.length}`) : c.g(`✓ ${res.length} vertes, 0 rouge`)));
    code = ko ? 1 : 0;
  } else {
    console.log(c.b('MA VIGNE — Harnais VUE-EQUIPE-1 · contre-épreuves'));
    const SRC = fs.readFileSync(CIBLE, 'utf8');
    const jouer = (fichier) => {
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--json', '--cible', fichier], { encoding: 'utf8', timeout: 120000 });
      try { return JSON.parse(r.stdout); } catch (e) { return null; }
    };
    const t = jouer(CIBLE), kot = t ? t.filter((x) => !x[2]).map((x) => x[0]) : ['(plantage)'];
    console.log('  ' + (kot.length ? c.r('✗ témoin ROUGE : ' + kot.join(', ')) : c.g('✓ témoin vert (planning.js intact)')));
    let bad = kot.length ? 1 : 0;
    for (const [nom, ancre, rempl, doivent] of MUT) {
      const n = SRC.split(ancre).length - 1;
      if (n !== 1) { bad++; console.log('  ' + c.r('✗') + ` ${nom} — ancre trouvée ${n} fois (attendu 1) : la contre-épreuve ne prouve rien`); continue; }
      const f = path.join(os.tmpdir(), 'mv-veq-mut-' + process.pid + '.js');
      fs.writeFileSync(f, SRC.replace(ancre, rempl));
      const r = jouer(f); fs.unlinkSync(f);
      const restent = r ? doivent.filter((id) => (r.find((x) => x[0] === id) || [0, 0, true])[2]) : [];
      if (restent.length) { bad++; console.log('  ' + c.r('✗') + ` ${nom} — reste VERT sur ${restent.join(', ')}`); }
      else console.log('  ' + c.g('✓') + ` ${nom} ${c.dim('→ rouge sur ' + doivent.join(', ') + (r ? '' : ' (plantage)'))}`);
    }
    console.log('\n  ' + (MUT.length - (bad - (kot.length ? 1 : 0))) + '/' + MUT.length + ' contre-épreuves rougissent' + (kot.length ? c.r(' — mais le témoin est rouge') : ''));
    code = bad ? 1 : 0;
  }
} catch (e) {
  console.error(c.r('\n✗ Le harnais a planté (ce n’est PAS un résultat) : ') + (e && e.stack || e));
  code = 2;
}
process.exit(code);
