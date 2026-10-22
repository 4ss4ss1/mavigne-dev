#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — JCAVE-1 (§428) : LES JOURNÉES DE CAVE
   Lancer : node scripts/mv-harnais-jcave1.mjs
            node scripts/mv-harnais-jcave1.mjs --contre

   ══ POURQUOI ══
   Nico (22/10) : la Réparation à +900 % au Pilotage — 150 h réelles pour 15 h de barème. Les journées de
   cave (pressurage, entonnage, ouillage sans nom coché) restaient « en attente » et tombaient sur la prochaine
   parcelle validée. Maquette validée : la cave se marque au Planning (la journée, le matin, l'après-midi) et,
   pour la journée, depuis les équipes du jour. Une seule donnée : CONFIG.cave_jours.

   ══ CE QU'IL TIENT — on EXÉCUTE les vraies fonctions, extraites des fichiers (méthode C20) ══
     A. utils.js : _mvCaveJour, _mvCaveEcrire — lire, poser, retirer, ne rien écrire pour rien, deux ans gardés.
     B. pilotage.js : _ecoCaveJours, _ecoTempsVigne — la marque du Planning sort de la vigne, une moitié
        n'enlève que sa moitié, le Chai l'emporte ; le récit de Nico retombe sur ses 75 h.
     C. planning.js : _planBornesJour, _planCaveH — le matin et l'après-midi d'après l'horaire du jour, plafonnés.
     D. planning.js : _capDayReal — la capacité de l'équipe perd la cave, la paie non.
     E. planning.js : _planCaveHtml, la barre, la case — la fenêtre « Travail de cave » dit ce qu'elle fera.
     F. app.js : les équipes du jour — « Cave » pose et retire la journée, les équipes ne gardent pas ceux en cave.
   ⚠️ §25.2 : les contre-épreuves mutent EN MÉMOIRE, avec garde d'injection — une mutation qui ne trouve pas
      son ancre est une ERREUR, jamais un vert.
   ⚠️ CHEMINS : fileURLToPath, jamais new URL(...).pathname (Windows, 20/08).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const BASE = { pil: lire('src/pilotage.js'), utl: lire('src/utils.js'), pla: lire('src/planning.js'), app: lire('src/app.js') };
const c = { g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m` };

// Extraction : « function X( », « window.X = function( » ou « window.X=function( », jusqu'à l'accolade qui ferme.
function extraire(src, nom) {
  const motifs = ['function ' + nom + '(', 'window.' + nom + ' = function(', 'window.' + nom + '=function('];
  let i = -1;
  for (const m of motifs) { i = src.indexOf(m); if (i >= 0) break; }
  if (i < 0) return null;
  let d = 0; const s = src.indexOf('{', i);
  for (let k = s; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) { const fin = src[k + 1] === ';' ? k + 2 : k + 1; return src.slice(i, fin); } }
  }
  return null;
}
function prendre(src, noms) {
  const out = [], manque = [];
  for (const n of noms) { const f = extraire(src, n); if (f) out.push(f); else manque.push(n); }
  if (manque.length) throw new Error('fonctions introuvables : ' + manque.join(', '));
  return out.join('\n');
}

/* ── A. utils.js ─────────────────────────────────────────────────────────── */
function chargerA(S) {
  const code = 'var window={CONFIG:{}}; var nSave=0; window.saveData=function(k){ if(k==="config") nSave++; };\n'
    + prendre(S.utl, ['_mvCaveJour', '_mvCaveEcrire'])
    + '\n;return { w:window, n:function(){ return nSave; } };';
  return new Function(code)();
}
/* ── B. pilotage.js (le temps réel) ──────────────────────────────────────── */
const VOULUES_B = ['_ecoCaveJours', '_pexIso', '_pexD', '_pexIsoToMs2', '_pexIsoPlus', '_pexJourApres', '_opPassHha', '_opMinTrou',
  '_ecoTvNivs', '_ecoTvDef', '_ecoTvAvecBareme', '_ecoTvBar', '_ecoTvEvents', '_ecoTempsVigne'];
function chargerB(S) {
  const pre = `
var window = { PARCELLES:[], JOURNAL:[], MEMBRES:[], TACHES:[], CAVE_ELEVAGE:{operations:[]}, CONFIG:{} };
var HEURES = {}, PER = null, MOITIE = null;
window._mvEqJour = function(){ return null; };
function _ecoRate(){ return 18; }
window._mvPaieTauxEffAt = function(){ return 18; };
var _ECO_TV = null;
window._pilSaison = function(){ return PER; };
window._mvEnContratSurPeriode = function(m){ return !m.bureau; };
window._planChampPersRange = function(m, a){
  var iso = a.getFullYear()+'-'+String(a.getMonth()+1).padStart(2,'0')+'-'+String(a.getDate()).padStart(2,'0');
  return ((HEURES[m.nom]||{})[iso])||0;
};
function _ecoTracHByParc(){ return { condH:{} }; }`;
  const code = pre + '\n' + prendre(S.pil, VOULUES_B) + `
;return { tv:function(){ _ECO_TV=null; return _ecoTempsVigne(); }, cj:function(a,b){ return _ecoCaveJours(a,b); },
  set:function(o){ Object.assign(window,o.w||{}); HEURES=o.h||{}; PER=o.per;
    if(o.moitie===undefined) window._planCaveH=function(m,iso,p,h){ return p==='m'?Math.min(h,4):(p==='a'?Math.min(h,3):h); };
    else if(o.moitie===null) delete window._planCaveH; } };`;
  return new Function(code)();
}
/* ── C. planning.js (les heures d'une moitié de journée) ─────────────────── */
function chargerC(S) {
  const code = `var window={ PLAN_PAUSE_MIN:60 }, PLAN_PAUSE_MIN=60, BORNES={t0:'08:00',t1:'16:00',continu:false}, COUP='12:00';
window._planSurAnnee=function(y,fn){ return fn(); };
function _planRetardBornes(){ return Object.assign({pl:7}, BORNES); }
function _planCoupureH(){ return COUP; }
function _planPlId(m){ return 'std'; }
` + prendre(S.pla, ['_planMinOf', '_planTimingH', '_planBornesJour', '_planCaveH']) + `
;return { h:function(p,h){ return window._planCaveH({nom:'A'},'2026-10-06',p,h); }, set:function(b,c){ BORNES=b; COUP=c; } };`;
  return new Function(code)();
}
/* ── D. planning.js (la capacité, _capDayReal est une fonction interne) ──── */
function chargerD(S) {
  const code = `var window={}, MBRS=[], CAVE={};
var mbrs=[];
function _ford(o){ return '2026-10-'+String(o).padStart(2,'0'); }
function _inContractDay(){ return true; }
function _planPlId(){ return 'std'; }
function _entDayY(){ return null; }
function _planWorkH(){ return 7; }
function _planDayH(){ return 7; }
window._mvCaveJour=function(nom,iso){ return CAVE[nom+'|'+iso]||''; };
window._planCaveH=function(m,iso,p,h){ return p==='m'?Math.min(h,4):(p==='a'?Math.min(h,3):(p==='j'?h:0)); };
window._mvEstCollectif=function(m){ return !!m.coll; };
window._mvEffDef=function(m){ return m.eff||1; };
` + prendre(S.pla, ['_capDayReal']) + `
;return { jour:function(o,ms,cv){ mbrs=ms; CAVE=cv||{}; return _capDayReal(o); } };`;
  return new Function(code)();
}
/* ── E. planning.js (la fenêtre « Travail de cave ») ─────────────────────── */
function chargerE(S) {
  const code = `var window={ PLAN_PAUSE_MIN:60, MEMBRES:[{nom:'Julien'},{nom:'Marion'},{nom:'Inès'},{nom:'Sophie'}] }, PLAN_PAUSE_MIN=60;
var planYear=2026, planMonth=9, _pl2Sel={}, CAVE={}, HJ={};
var PLAN_MOIS_C=['Janv','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];
window._mvCaveJour=function(nom,iso){ return CAVE[nom+'|'+iso]||''; };
window._planSurAnnee=function(y,fn){ return fn(); };
function _planInContract(){ return true; }
function _planChampPersRange(m,dt){ var k=m.nom+'|'+dt.getDate(); return (k in HJ)?HJ[k]:7; }
function _planRetardBornes(){ return {pl:7,t0:'08:00',t1:'16:00',continu:false}; }
function _planCoupureH(){ return '12:00'; }
function _planPlId(){ return 'std'; }
function _escAttr(s){ return String(s).replace(/"/g,'&quot;'); }
function _escHtml(s){ return String(s).replace(/</g,'&lt;'); }
function _mvIcon(n){ return '<svg data-ic="'+n+'"></svg>'; }
` + prendre(S.pla, ['_planMinOf', '_planMinTxt', '_planTimingH', '_planFmt', '_planSelKeys', '_planSelParse', '_planSelResume',
  '_planBornesJour', '_pl2Iso', '_planCaveH', '_planCaveCases', '_planCaveRuban', '_planCaveHtml']) + `
;return { html:function(sel,cave,mode,hj){ _pl2Sel=sel; CAVE=cave||{}; HJ=hj||{}; _planCaveMode=mode||'j'; return _planCaveHtml(); } };`;
  // _planCaveMode et _PL2_CAVE_LIB sont des variables du module : on les déclare comme le fichier.
  return new Function('var _planCaveMode="j"; var _PL2_CAVE_LIB={j:"la journée",m:"le matin",a:"l’après-midi"};\n' + code)();
}
/* ── F. app.js (les équipes du jour) ─────────────────────────────────────── */
function chargerF(S) {
  const code = `var window={}, CAVE={}, ECRIT=[], MSG=[], CLEAR=0, AUJ='2026-10-22';
var _EQJ_SEL={}, _EQJ_TRN={};
var document={ getElementById:function(id){ return id==='eqj-rows'?ROWS:null; } }, ROWS={innerHTML:''};
function _mvMoiAdmin(){ return true; }
function _mvToday(){ return AUJ; }
function _mvEqMembres(){ return [{nom:'Julien'},{nom:'Marion'},{nom:'Sophie'},{nom:'Paul'}]; }
function _escAttr(s){ return String(s).replace(/"/g,'&quot;'); }
function _escHtml(s){ return String(s).replace(/</g,'&lt;'); }
function _mvEqEcrire(iso,teams,trn){ ECRIT.push({iso:iso,teams:teams}); }
function _mvEqApres(m){ MSG.push(m); }
function clearEqJour(){ CLEAR++; }
window._mvCaveJour=function(nom,iso){ return CAVE[nom+'|'+iso]||''; };
window._mvCaveEcrire=function(L,p){ L.forEach(function(x){ if(p) CAVE[x.nom+'|'+x.iso]=p; else delete CAVE[x.nom+'|'+x.iso]; }); return L.length; };
` + prendre(S.app, ['_mvEqRows', '_mvEqPick', '_mvEqCaveEcrire', 'saveEqJour']) + `
;return { set:function(sel,cave){ _EQJ_SEL=sel; CAVE=cave||{}; ECRIT=[]; MSG=[]; CLEAR=0; },
  save:function(){ saveEqJour(); return { cave:CAVE, ecrit:ECRIT, msg:MSG, clear:CLEAR }; },
  pick:function(n,k){ _mvEqPick({ getAttribute:function(a){ return a==='data-eqj-n'?n:k; } }); return _EQJ_SEL[n]; },
  rows:function(){ _mvEqRows(); return ROWS.innerHTML; } };`;
  return new Function(code)();
}

/* ── Les scénarios ───────────────────────────────────────────────────────── */
function scenarios(S) {
  const R = [];
  const ok = (g, n, cond) => R.push({ g, n, ok: !!cond });
  const eq = (g, n, a, b) => R.push({ g, n: n + (Math.abs(a - b) < 1e-6 ? '' : ' — obtenu ' + a + ', attendu ' + b), ok: Math.abs(a - b) < 1e-6 });
  let A, B, C, D, E, F;
  try { A = chargerA(S); } catch (e) { ok('A', 'chargement A : ' + e.message, false); }
  try { B = chargerB(S); } catch (e) { ok('B', 'chargement B : ' + e.message, false); }
  try { C = chargerC(S); } catch (e) { ok('C', 'chargement C : ' + e.message, false); }
  try { D = chargerD(S); } catch (e) { ok('D', 'chargement D : ' + e.message, false); }
  try { E = chargerE(S); } catch (e) { ok('E', 'chargement E : ' + e.message, false); }
  try { F = chargerF(S); } catch (e) { ok('F', 'chargement F : ' + e.message, false); }

  if (A) try {
    const w = A.w;
    eq('A', 'A1 · poser le matin sur deux cases : 2 changées', w._mvCaveEcrire([{ iso: '2026-10-06', nom: 'Julien' }, { iso: '2026-10-06', nom: 'Marion' }], 'm'), 2);
    eq('A', 'A2 · une seule écriture de la configuration', A.n(), 1);
    ok('A', 'A3 · relue : « m » pour Julien, rien pour Sophie', w._mvCaveJour('Julien', '2026-10-06') === 'm' && w._mvCaveJour('Sophie', '2026-10-06') === '');
    eq('A', 'A4 · reposer la même chose : rien de changé…', w._mvCaveEcrire([{ iso: '2026-10-06', nom: 'Julien' }], 'm'), 0);
    eq('A', 'A5 · … et rien d’écrit', A.n(), 1);
    eq('A', 'A6 · retirer Julien : 1 changée', w._mvCaveEcrire([{ iso: '2026-10-06', nom: 'Julien' }], null), 1);
    w._mvCaveEcrire([{ iso: '2026-10-06', nom: 'Marion' }], null);
    ok('A', 'A7 · un jour vidé disparaît de la donnée', !('2026-10-06' in (w.CONFIG.cave_jours || {})));
    eq('A', 'A8 · une date ou un nom invalide ne pose rien', w._mvCaveEcrire([{ iso: '06/10/2026', nom: 'Julien' }, { iso: '2026-10-07', nom: '' }], 'j'), 0);
    w.CONFIG.cave_jours = { '2020-01-06': { Julien: 'j' }, '2026-10-08': { Paul: 'x' } };
    w._mvCaveEcrire([{ iso: '2026-10-09', nom: 'Paul' }], 'a');
    ok('A', 'A9 · deux ans gardés : une marque de 2020 part à l’écriture suivante', !('2020-01-06' in w.CONFIG.cave_jours));
    ok('A', 'A10 · une valeur inconnue se lit comme rien', w._mvCaveJour('Paul', '2026-10-08') === '');
  } catch (e) { ok('A', 'A · plantage : ' + e.message, false); }

  if (B) try {
    // B1-B3 : ce que _ecoCaveJours lit.
    B.set({ w: { CAVE_ELEVAGE: { operations: [{ type: 'ouillage', date: '2026-10-05', intervenants: ['Sophie'] }] },
      CONFIG: { cave_jours: { '2026-10-05': { Sophie: 'm', Paul: 'j' }, '2026-10-06': { Paul: 'a' }, '2026-11-02': { Paul: 'j' } } } }, per: { debut: '2026-10-01', fin: '2026-10-16' } });
    const cj = B.cj('2026-10-01', '2026-10-16');
    ok('B', 'B1 · la journée marquée au Planning vaut la journée (1)', cj.Paul && cj.Paul['2026-10-05'] === 1);
    ok('B', 'B2 · l’après-midi reste une moitié (« a »)', cj.Paul['2026-10-06'] === 'a');
    ok('B', 'B3 · le Chai le même jour l’emporte sur une moitié', cj.Sophie['2026-10-05'] === 1);
    ok('B', 'B4 · hors de la période : ignoré', !('2026-11-02' in cj.Paul));
    // B5-B8 : une personne, 7 h, une validation par jour.
    const P = (nom, surf) => ({ nom, surface: surf });
    const T = [{ nom: 'Reparation', hha: 45 }];
    const val = (date, parc, qui, eq) => ({ id: Math.random().toString(16).slice(2, 10), date, parcelle: parc, tache: 'Reparation', qui, statut: 'Validé', membresEquipe: eq || [] });
    const h7 = (noms, jours) => Object.fromEntries(noms.map(n => [n, Object.fromEntries(jours.map(d => [d, 7]))]));
    B.set({ w: { PARCELLES: [P('R1', 0.1)], TACHES: T, MEMBRES: [{ nom: 'A' }], JOURNAL: [val('2026-10-06', 'R1', 'A')], CAVE_ELEVAGE: { operations: [] },
      CONFIG: { cave_jours: { '2026-10-06': { A: 'a' } } } }, h: h7(['A'], ['2026-10-06']), per: { debut: '2026-10-06', fin: '2026-10-06' } });
    let V = B.tv();
    eq('B', 'B5 · l’après-midi en cave : 4 h vont à la parcelle (7 − 3)', (V.pairs['R1\u0000Reparation'] || {}).h || 0, 4);
    eq('B', 'B6 · et 3 h de cave sont dites retirées', V.hCave, 3);
    B.set({ w: { CONFIG: { cave_jours: { '2026-10-06': { A: 'a' } } } }, h: h7(['A'], ['2026-10-06']), per: { debut: '2026-10-06', fin: '2026-10-06' }, moitie: null });
    V = B.tv();
    eq('B', 'B7 · sans horaire lisible (_planCaveH absente) : la moitié, 3,5 h', (V.pairs['R1\u0000Reparation'] || {}).h || 0, 3.5);
    B.set({ w: { CONFIG: { cave_jours: { '2026-10-06': { A: 'j' } } } }, h: h7(['A'], ['2026-10-06']), per: { debut: '2026-10-06', fin: '2026-10-06' } });
    V = B.tv();
    ok('B', 'B8 · la journée en cave : rien versé, 7 h retirées, rien en attente', !((V.pairs['R1\u0000Reparation'] || {}).h > 0) && Math.abs(V.hCave - 7) < 1e-6 && V.hAtt === 0);
    // B9 : le récit de Nico (prénoms fictifs), toutes les journées de cave marquées.
    const J = ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'];
    const N = ['A', 'B', 'C', 'D', 'E'], cv = {};
    const marque = (d, noms, p) => { cv[d] = Object.assign(cv[d] || {}, Object.fromEntries(noms.map(n => [n, p]))); };
    ['2026-10-01', '2026-10-02'].forEach(d => marque(d, N, 'j'));
    ['2026-10-05', '2026-10-06'].forEach(d => marque(d, ['D', 'E'], 'j'));
    marque('2026-10-06', ['A', 'B', 'C'], 'a');
    ['2026-10-07', '2026-10-08', '2026-10-09'].forEach(d => marque(d, ['C', 'D', 'E'], 'j'));
    J.slice(7).forEach(d => marque(d, N, 'j'));
    B.set({ w: { PARCELLES: [P('R1', 0.12), P('R2', 0.10), P('R3', 0.113)], TACHES: T, MEMBRES: N.map(nom => ({ nom })), CAVE_ELEVAGE: { operations: [] },
      JOURNAL: [val('2026-10-05', 'R1', 'A', ['B', 'C']), val('2026-10-06', 'R2', 'A', ['B', 'C']), val('2026-10-09', 'R3', 'A', ['B'])], CONFIG: { cave_jours: cv } },
      h: h7(N, J), per: { debut: '2026-10-01', fin: '2026-10-16' } });
    V = B.tv();
    const tR = V.taches.find(t => t.nom === 'Reparation') || { h: 0 };
    eq('B', 'B9 · le récit de Nico, cave marquée : la Réparation retombe sur ses 75 h (21 + 12 + 42)', tR.h, 75);
    ok('B', 'B10 · personne n’a d’heures en attente', V.hAtt === 0);
  } catch (e) { ok('B', 'B · plantage : ' + e.message, false); }

  if (C) try {
    eq('C', 'C1 · la journée : toutes les heures dispo', C.h('j', 7), 7);
    eq('C', 'C2 · le matin : de 8 h à la coupure de 12 h = 4 h', C.h('m', 7), 4);
    eq('C', 'C3 · l’après-midi : de la reprise à 13 h jusqu’à 16 h = 3 h', C.h('a', 7), 3);
    eq('C', 'C4 · jamais plus que les heures dispo (tracteur déduit : 2 h)', C.h('m', 2), 2);
    ok('C', 'C5 · une moitié inconnue, ou aucune heure : 0', C.h('x', 7) === 0 && C.h('m', 0) === 0);
    C.set({ t0: '', t1: '', continu: false }, '');
    eq('C', 'C6 · sans horaire lisible : la moitié', C.h('a', 7), 3.5);
    C.set({ t0: '07:00', t1: '12:00', continu: false }, '');
    eq('C', 'C7 · une demi-journée de 5 h sans coupure : le matin coupe au milieu', C.h('m', 5), 2.5);
    ok('C', 'C8 · « Absence › Le matin » lit les mêmes bornes (une seule définition)',
      /function _planAbsBornesJour\(\)\{\s*var ed=_planEditDay;if\(!ed\)return null;\s*return _planBornesJour\(ed\.mbr,planMonth,ed\.day\);\s*\}/.test(S.pla));
  } catch (e) { ok('C', 'C · plantage : ' + e.message, false); }

  if (D) try {
    const m = [{ nom: 'A' }];
    let r = D.jour(5, m, {});
    ok('D', 'D1 · sans cave : 7 h de capacité, 7 h payées', r.work === 7 && r.pay === 7);
    r = D.jour(5, m, { 'A|2026-10-05': 'j' });
    ok('D', 'D2 · la journée en cave : 0 h de capacité, 7 h payées quand même', r.work === 0 && r.pay === 7);
    r = D.jour(5, m, { 'A|2026-10-05': 'm' });
    ok('D', 'D3 · le matin en cave : 3 h de capacité', r.work === 3 && r.pay === 7);
    r = D.jour(5, [{ nom: 'Saison', coll: true, eff: 3 }], { 'Saison|2026-10-05': 'a' });
    ok('D', 'D4 · une équipe collective de 3, l’après-midi en cave : 21 − 9 = 12 h, 21 h payées', r.work === 12 && r.pay === 21);
  } catch (e) { ok('D', 'D · plantage : ' + e.message, false); }

  if (E) try {
    let h = E.html({ 'Julien|15': 1, 'Marion|15': 1, 'Inès|15': 1 }, {}, 'a');
    ok('E', 'E1 · trois choix : la journée, le matin, l’après-midi', /plan-cave-j[\s\S]*plan-cave-m[\s\S]*plan-cave-a/.test(h) && (h.match(/onclick="planCaveMode\(/g) || []).length === 3);
    ok('E', 'E2 · l’après-midi est le choix allumé', /id="plan-cave-a" class="on" aria-pressed="true"/.test(h));
    ok('E', 'E3 · « Sortent du travail de la vigne » : 3 cases × 3 h = 9h', /Sortent du travail de la vigne[\s\S]*?<b>9h<\/b>/.test(h));
    ok('E', 'E4 · « Paie, relevé d’heures, annualisation : inchangés »', /annualisation<\/span><b>inchang/.test(h));
    ok('E', 'E5 · le ruban : en vigne le matin, coupure, en cave l’après-midi', /class="pl2r-w" style="left:0\.00%;width:50\.00%"/.test(h) && /class="pl2r-c"/.test(h) && /class="pl2r-cave" style="left:62\.50%;width:37\.50%"/.test(h));
    ok('E', 'E6 · le tuto trouve « Le matin » et « Marquer en cave »', /data-tuto="plan\.cave\.m"/.test(h) && /data-tuto="plan\.cave\.ok" onclick="planCaveApply\(\)">Marquer en cave/.test(h));
    ok('E', 'E7 · aucune case déjà en cave : pas de « Retirer »', !/planCaveRetirer/.test(h));
    h = E.html({ 'Julien|15': 1, 'Sophie|15': 1 }, { 'Sophie|2026-10-15': 'j' }, 'j');
    ok('E', 'E8 · une case déjà en cave : « Retirer la cave de cette case »', /onclick="planCaveRetirer\(\)"><svg data-ic="retour"><\/svg><span>Retirer la cave de cette case<\/span><\/button>/.test(h));
    h = E.html({ 'Julien|18': 1 }, {}, 'j', { 'Julien|18': 0 });
    ok('E', 'E9 · un jour sans heures : rien à sortir, bouton éteint', /rien \u00e0 sortir de la vigne/.test(h) && /onclick="planCaveApply\(\)" disabled/.test(h));
    const corpsBarre = extraire(S.pla, '_pl2MbarSync') || '';
    ok('E', 'E10 · la barre : « Cave » (id, étiquette du tuto, geste) entre Absence et Récup, sur des jours travaillés',
      /if\(st\.trav>0\)h\+='<button id="plan-mbar-cave" data-tuto="plan\.cave" onclick="planCaveSheet\(\)">[\s\S]*?Cave<\/span><\/button>'[\s\S]*?planSelAction\(\\'rec\\'\)/.test(corpsBarre));
    const corpsGrille = extraire(S.pla, '_pl2Board') || '';
    ok('E', 'E11 · la case porte sa bande et la dit aux lecteurs d’écran', /\+_cvLab\+'"><span class="pl2-chip /.test(corpsGrille) && /\+c\.txt\+'<\/span>'\+_cvBand\+'<\/button>'/.test(corpsGrille));
    ok('E', 'E12 · les quatre gestes sont exposés sur window', ['planCaveSheet', 'planCaveMode', 'planCaveApply', 'planCaveRetirer'].every(n => new RegExp('window\\.' + n + '\\s*=\\s*' + n + ';').test(S.pla)));
  } catch (e) { ok('E', 'E · plantage : ' + e.message, false); }

  if (F) try {
    F.set({ Julien: 1, Marion: 1, Sophie: 'cave', Paul: 'cave' }, {});
    let r = F.save();
    ok('F', 'F1 · « Cave » pose la journée pour Sophie et Paul', r.cave['Sophie|2026-10-22'] === 'j' && r.cave['Paul|2026-10-22'] === 'j');
    ok('F', 'F2 · l’équipe écrite ne garde pas ceux en cave', r.ecrit.length === 1 && JSON.stringify(r.ecrit[0].teams) === JSON.stringify([['Julien', 'Marion']]));
    ok('F', 'F3 · le message le dit', /en cave\u00a0: Sophie, Paul/.test(r.msg[0] || ''));
    F.set({ Sophie: 1 }, { 'Sophie|2026-10-22': 'j', 'Paul|2026-10-22': 'm' });
    r = F.save();
    ok('F', 'F4 · Sophie remise en équipe : sa journée de cave est retirée', !r.cave['Sophie|2026-10-22']);
    ok('F', 'F5 · le matin de Paul, posé au Planning, n’est pas touché', r.cave['Paul|2026-10-22'] === 'm');
    F.set({ Paul: 'cave' }, {});
    r = F.save();
    ok('F', 'F6 · seulement de la cave, pas d’équipe : « tout le monde ensemble », la cave posée', r.clear === 0 && r.ecrit.length === 1 && r.ecrit[0].teams.length === 0 && r.cave['Paul|2026-10-22'] === 'j');
    F.set({}, {});
    r = F.save();
    ok('F', 'F7 · rien de coché : comme avant (Tout le monde ensemble)', r.clear === 1);
    F.set({}, {});
    ok('F', 'F8 · le choix « Cave » reste « cave », un numéro reste un numéro', F.pick('Julien', 'cave') === 'cave' && F.pick('Marion', '2') === 2 && F.pick('Julien', '0') === undefined);
    F.set({ Paul: 'cave' }, { 'Marion|2026-10-22': 'a' });
    const rows = F.rows();
    ok('F', 'F9 · la pastille « Cave » allumée pour Paul, éteinte pour les autres', /class="pchk sel cave" data-eqj-n="Paul" data-eqj-k="cave"/.test(rows) && (rows.match(/data-eqj-k="cave"/g) || []).length === 4);
    ok('F', 'F10 · le matin ou l’après-midi posé au Planning se dit sous le nom', /Marion <span class="eqj-demi">\u00b7 cave l\u2019apr\u00e8s-midi, pos\u00e9e au Planning<\/span>/.test(rows));
  } catch (e) { ok('F', 'F · plantage : ' + e.message, false); }
  return R;
}

function jouer(S, bavard) {
  const R = scenarios(S), ko = R.filter(x => !x.ok);
  if (bavard) R.forEach(x => console.log((x.ok ? c.g('  ✓ ') : c.r('  ✗ ')) + x.n));
  return { R, ko };
}

if (!CONTRE) {
  console.log(c.b('JCAVE-1 (§428) — les journées de cave'));
  const { R, ko } = jouer(BASE, true);
  console.log('\n' + (ko.length ? c.r('ROUGE — ' + ko.length + ' échec(s) sur ' + R.length) : c.g('VERT — ' + R.length + ' assertions')));
  process.exit(ko.length ? 1 : 0);
}

/* ── Contre-épreuves : chaque défaut réinjecté doit faire rougir SON groupe ── */
const MUT = [
  ['le temps réel ignore la cave du Planning', 'pil', "  var C=(window.CONFIG&&window.CONFIG.cave_jours&&typeof window.CONFIG.cave_jours==='object')?window.CONFIG.cave_jours:{};", '  var C={};', 'B'],
  ['une moitié de journée vide toute la journée', 'pil', "var hc=(cj[d]===1)?hv:", 'var hc=(true)?hv:', 'B'],
  ['le Chai ne l’emporte plus sur une moitié', 'pil', "if(o[iso]!==1) o[iso]=(v==='j')?1:v;", "o[iso]=(v==='j')?1:v;", 'B'],
  ['_mvCaveEcrire écrit même quand rien ne change', 'utl', '  if(!n) return 0;\n  var lim=new Date();', '  var lim=new Date();', 'A'],
  ['_mvCaveEcrire ne purge plus les vieilles marques', 'utl', "  Object.keys(C).forEach(function(k){ if(k<limIso) delete C[k]; });\n  cfg.cave_jours=C;", '  cfg.cave_jours=C;', 'A'],
  ['_planCaveH ne plafonne plus aux heures dispo', 'pla', '  return Math.min(h,v);\n};', '  return v;\n};', 'C'],
  ['le matin et l’après-midi inversés', 'pla', "if(D0>=0&&D1>D0)v=(part==='m'?(b.c0-D0):(D1-b.c1))/60;", "if(D0>=0&&D1>D0)v=(part==='a'?(b.c0-D0):(D1-b.c1))/60;", 'C'],
  ['la capacité garde la cave', 'pla', "      if(_cvj&&hw>0)hw=Math.max(0,hw-window._planCaveH(mb,ds,_cvj,hw/w)*w);", '', 'D'],
  ['la fenêtre perd « Retirer la cave »', 'pla', "  var retirer=deja?(", "  var retirer=false?(", 'E'],
  ['la fenêtre compte les cases sans heures', 'pla', "  var L=_planCaveCases(),T=L.filter(function(x){return x.h>0;})", "  var L=_planCaveCases(),T=L.filter(function(x){return true;})", 'E'],
  ['les équipes du jour n’écrivent plus la cave', 'app', "  var _cv=_mvEqCaveEcrire(_mvToday())", "  var _cv=[]", 'F'],
  ['« Cave » redevient un numéro (0)', 'app', "k=(ka==='cave')?'cave':(parseInt(ka,10)||0);", "k=(parseInt(ka,10)||0);", 'F']
];
console.log(c.b('JCAVE-1 (§428) — contre-épreuves'));
let mord = 0, erreurs = 0;
for (const [nom, f, avant, apres, groupe] of MUT) {
  const S = Object.assign({}, BASE);
  if (S[f].indexOf(avant) < 0) { console.log(c.r('  ✗ ERREUR : ancre introuvable — ' + nom)); erreurs++; continue; }
  S[f] = S[f].replace(avant, apres);
  const { ko } = jouer(S, false);
  const vise = ko.filter(x => x.g === groupe);
  if (vise.length) { mord++; console.log(c.g('  ✓ ') + nom + ' → ' + vise.length + ' rouge(s) en ' + groupe); }
  else console.log(c.r('  ✗ ') + nom + ' : aucune assertion du groupe ' + groupe + ' ne rougit');
}
const total = MUT.length;
console.log('\n' + (mord === total && !erreurs ? c.g(mord + '/' + total + ' contre-épreuves mordent') : c.r(mord + '/' + total + ' contre-épreuves mordent, ' + erreurs + ' ancre(s) introuvable(s)')));
process.exit(mord === total && !erreurs ? 0 : 1);
