#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// mv-harnais-recalage — un modèle de planning est un CALENDRIER, pas une
// semaine type. Relu sur une autre année il glisse d'un jour, et AUCUN TOTAL NE
// BOUGE : c'est pourquoi le défaut a vécu sans être vu (11/09/2026).
//   Ce harnais EXTRAIT les vraies fonctions de src/planning.js et les exécute.
//   `--contre` réinjecte chaque défaut dans une copie EN MÉMOIRE et exige que
//   la règle correspondante rougisse. Un harnais qu'on n'a pas vu rougir ne
//   mesure rien.
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'fs';
import vm from 'vm';
import { fileURLToPath } from 'url';
import path from 'path';

const ICI  = path.dirname(fileURLToPath(import.meta.url));
const SRC  = path.join(ICI, '..', 'src', 'planning.js');
const CONTRE = process.argv.includes('--contre');
const J = ['Di','Lu','Ma','Me','Je','Ve','Sa'];

let ok = 0, ko = 0;
const echecs = [];
function A(cond, quoi) {
  if (cond) { ok++; } else { ko++; echecs.push(quoi); console.log('  \x1b[31mROUGE\x1b[0m ' + quoi); }
}

// ── Extraction ───────────────────────────────────────────────────────────────
// Les commentaires sont retirés AVANT toute assertion : trois fois en août une
// règle est passée au vert parce que le commentaire citait le texte cherché.
const sansCommentaires = s => s.replace(/^\s*\/\/.*$/gm, '');

function corps(src, nom) {
  const formes = [
    'function ' + nom + '(',
    'window.' + nom + ' = function(',
    'window.' + nom + '=function(',
  ];
  let i = -1, amorce = '';
  for (const f of formes) { const k = src.indexOf(f); if (k >= 0 && (i < 0 || k < i)) { i = k; amorce = f; } }
  if (i < 0) return null;
  let j = src.indexOf('{', i + amorce.length), prof = 0, q = null;
  for (let k = j; k < src.length; k++) {
    const c = src[k], p = src[k - 1];
    if (q) { if (c === q && p !== '\\') q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '{') prof++;
    else if (c === '}') { prof--; if (!prof) return src.slice(i, k + 1); }
  }
  return null;
}

function bloc(src, debut, fin) {
  const i = src.indexOf(debut); if (i < 0) return null;
  const j = src.indexOf(fin, i); if (j < 0) return null;
  return src.slice(i, j + fin.length);
}

function charger(brut) {
  const src = sansCommentaires(brut);
  const morceaux = [];
  const planDef = bloc(src, 'var PLAN_DEF = {', '\n};');
  const nico    = bloc(src, 'PLAN_DEF.nico = {', '\n  };');
  if (!planDef) throw new Error('PLAN_DEF introuvable');
  morceaux.push(planDef);
  if (nico) morceaux.push(nico);          // toujours défini ici : on teste les deux modèles
  const an = src.match(/var PLAN_DEF_AN\s*=\s*(\d+)\s*;/);
  morceaux.push('var PLAN_DEF_AN=' + (an ? an[1] : 'null') + ';');
  morceaux.push('var _PLAN_RECALE_CACHE={};');
  for (const f of ['_planRecaleMap', '_planRecale', '_planTplDef', '_planTplDefInfo']) {
    const c = corps(src, f);
    if (!c) throw new Error('fonction introuvable : ' + f);
    morceaux.push(c);
  }
  const ctx = vm.createContext({ Date, Object, parseInt, parseFloat, isNaN, JSON, console });
  vm.runInContext(morceaux.join('\n') + '\nglobalThis.API={PLAN_DEF:PLAN_DEF,PLAN_DEF_AN:PLAN_DEF_AN,_planRecale:_planRecale,_planRecaleMap:_planRecaleMap,_planTplDef:_planTplDef,_planTplDefInfo:_planTplDefInfo};', ctx);
  return ctx.API;
}

// ── Outils de mesure ─────────────────────────────────────────────────────────
function profil(g, an) {
  const c = {}; let n = 0, h = 0;
  for (let m = 0; m < 12; m++) for (const d of Object.keys(g[m] || {})) {
    if (!/^\d+$/.test(d)) continue;
    const w = new Date(an, m, +d).getDay();
    c[w] = (c[w] || 0) + 1; n++; h += parseFloat(g[m][d]) || 0;
  }
  return { c, n, h };
}
function rang(an, m, d) { // n-ième occurrence de ce jour de semaine dans le mois
  const w = new Date(an, m, d).getDay(); let r = 0;
  for (let k = 1; k <= d; k++) if (new Date(an, m, k).getDay() === w) r++;
  return r;
}

// ── Le jeu de règles ─────────────────────────────────────────────────────────
function jouer(brut, etiquette) {
  const src = sansCommentaires(brut);
  const API = charger(brut);
  const { PLAN_DEF, PLAN_DEF_AN } = API;
  const AS = PLAN_DEF_AN, AD = 2027;

  // ── Statique : la signature du défaut ne doit plus exister ─────────────────
  const gt = corps(src, '_planGetTpl') || '';
  const ud = corps(src, 'planUpdateDay') || '';
  const re = corps(src, '_pl2RenderEquipe') || '';
  A(PLAN_DEF_AN === 2026, 'S1 · PLAN_DEF_AN déclaré à 2026 (année de calage des modèles intégrés)');
  A(gt && !/PLAN_DEF\[plId\]\s*\|\|\s*PLAN_DEF\.standard/.test(gt), 'S2 · _planGetTpl ne sert plus PLAN_DEF brut');
  A(/_planTplDef\s*\(/.test(gt), 'S3 · _planGetTpl passe par _planTplDef');
  A(ud && !/PLAN_DEF\[id\]\[m\]/.test(ud), 'S4 · planUpdateDay ne recopie plus le mois de PLAN_DEF brut');
  A(/_planTplDef\s*\(/.test(ud), 'S5 · planUpdateDay part de la grille recalée');
  A(/PLAN_DEF\[id\]\s*\?/.test(ud), 'S6 · planUpdateDay garde la garde PLAN_DEF[id] (un modèle maison n\u2019hérite pas de standard)');
  A(/_planRecaleBar\s*\(\s*\)/.test(re), 'S7 · le bandeau est branché dans l\u2019onglet « Le mois »');
  // ★ Le bandeau de la grille et le planning imprimé posent la MÊME question : une
  //   seule source, sinon l'écran et le papier finissent par se contredire.
  const pa = corps(src, '_paDoc') || '';
  const bar = corps(src, '_planRecaleBar') || '';
  A(/_planRecaleEtat\s*\(/.test(pa), 'S8 · le planning imprimé lit _planRecaleEtat');
  A(/_planRecaleEtat\s*\(/.test(bar), 'S9 · le bandeau lit _planRecaleEtat (pas sa propre copie)');
  A(pa && !/ne tombent pas aux m/.test(pa), 'S10 · le document ne dit plus que les jours de semaine tombent faux');

  // ── Identité : recaler sur sa propre année ne change rien ──────────────────
  const idn = API._planRecale(PLAN_DEF.standard, AS, AS);
  A(idn.g === PLAN_DEF.standard, 'M1 · recalage 2026→2026 = la grille elle-même (identité)');
  A(idn.perdus.length === 0 && idn.vides.length === 0, 'M2 · identité : aucun perdu, aucun vide');
  A(API._planTplDef('standard', AS) === PLAN_DEF.standard, 'M3 · _planTplDef rend PLAN_DEF tel quel sur son année');

  for (const id of ['standard', 'nico']) {
    if (!PLAN_DEF[id]) { A(false, 'M· modèle ' + id + ' introuvable'); continue; }
    const base = PLAN_DEF[id];
    const r = API._planRecale(base, AS, AD);
    const pS = profil(base, AS), pD = profil(r.g, AD);

    // Le jour de semaine est conservé, et l'écart s'explique EXACTEMENT par les perdus.
    const perdusParJour = {};
    r.perdus.forEach(p => { const w = new Date(AS, p.m, p.d).getDay(); perdusParJour[w] = (perdusParJour[w] || 0) + 1; });
    let conserve = true;
    for (let w = 0; w < 7; w++) if ((pD.c[w] || 0) + (perdusParJour[w] || 0) !== (pS.c[w] || 0)) conserve = false;
    A(conserve, 'M4 · ' + id + ' : chaque jour de semaine se retrouve à l\u2019identique (perdus compris)');
    A((pD.c[0] || 0) === (pS.c[0] || 0), 'M5 · ' + id + ' : aucun dimanche n\u2019apparaît');
    A(pD.n + r.perdus.length === pS.n, 'M6 · ' + id + ' : aucun jour ne se crée ni ne disparaît en silence');

    // Le RANG dans le mois est conservé : le 3ᵉ mardi de mars reste le 3ᵉ mardi de mars.
    let rangOk = true, testes = 0;
    for (let m = 0; m < 12; m++) {
      const map = API._planRecaleMap(m, AS, AD);
      for (const s of Object.keys(map)) {
        const d = map[s]; testes++;
        if (new Date(AS, m, +s).getDay() !== new Date(AD, m, d).getDay()) rangOk = false;
        if (rang(AS, m, +s) !== rang(AD, m, d)) rangOk = false;
      }
    }
    A(rangOk && testes > 300, 'M7 · ' + id + ' : même jour de semaine ET même rang dans le mois (' + testes + ' jours vérifiés)');

    // Rien d'inventé : aucune heure ne sort de nulle part.
    const hPerdues = r.perdus.reduce((a, p) => a + p.h, 0);
    A(Math.abs(pS.h - pD.h - hPerdues) < 1e-9, 'M8 · ' + id + ' : les heures sortantes sont exactement les heures perdues');

    // Les vides sont réels et le sont pour la bonne raison.
    let videsOk = r.vides.length > 0;
    r.vides.forEach(v => { if (r.g[v.m] && r.g[v.m][v.d] != null) videsOk = false; });
    A(videsOk, 'M9 · ' + id + ' : les places à pourvoir sont déclarées, et sont bien vides');

    // Aucun NaN, aucun undefined dans la grille rendue.
    let propre = true;
    for (let m = 0; m < 12; m++) for (const d of Object.keys(r.g[m] || {})) {
      const v = parseFloat(r.g[m][d]); if (!(v > 0)) propre = false;
    }
    A(propre, 'M10 · ' + id + ' : aucune valeur nulle, NaN ou undefined en sortie');
  }

  // Cliquet de mesure — les chiffres du 11/09/2026. S'ils bougent, c'est le calendrier
  // ou la règle qui a changé : dans les deux cas ça se décide, ça ne se subit pas.
  const rs = API._planRecale(PLAN_DEF.standard, AS, AD);
  A(rs.perdus.length === 7, 'M11 · standard 2026→2027 : 7 jours sans place (mesuré, cliquet)');
  A(Math.abs(rs.perdus.reduce((a, p) => a + p.h, 0) - 52.5) < 1e-9, 'M12 · standard 2026→2027 : 52,5 h sans place (mesuré, cliquet)');

  // `_timings` est clé par MOIS : il ne glisse pas. `_timings_jour` est clé par JOUR : il glisse.
  const faux = { 2: { 3: 7, 17: 7 }, _timings: { 2: { d: '07:00', f: '16:00' } }, _timings_jour: { 2: { 3: 'D', 17: 'M' } } };
  const rt = API._planRecale(faux, AS, AD);
  A(rt.g._timings === faux._timings, 'M13 · _timings (clé par mois) recopié tel quel');
  A(rt.g._timings_jour && rt.g._timings_jour[2] && !rt.g._timings_jour[2][3], 'M14 · _timings_jour (clé par jour) recalé, pas recopié');
  const cle = Object.keys(rt.g[2] || {})[0];
  A(cle && rt.g._timings_jour[2][cle] === 'D', 'M15 · _timings_jour suit exactement le jour qu\u2019il décrit');

  // Mémoire : _planGetTpl est appelé une trentaine de fois par rendu.
  A(API._planTplDef('standard', AD) === API._planTplDef('standard', AD), 'M16 · le recalage est mémorisé (même objet à deux appels)');

  return { ok, ko, etiquette };
}

// ── Exécution ────────────────────────────────────────────────────────────────
const brut = fs.readFileSync(SRC, 'utf8');

if (!CONTRE) {
  console.log('mv-harnais-recalage — modèle de planning recalé sur l\u2019année affichée');
  jouer(brut, 'reference');
  console.log((ko ? '\x1b[31m' : '\x1b[32m') + ok + ' vertes, ' + ko + ' rouges\x1b[0m');
  process.exit(ko ? 1 : 0);
}

// ── Contre-épreuves : le défaut réinjecté DOIT rougir ────────────────────────
console.log('mv-harnais-recalage --contre — chaque défaut réinjecté doit rougir');
const defauts = [
  ['le repli sert de nouveau PLAN_DEF brut',
   s => s.replace('return (_st&&_st[plId])||_planTplDef(plId,_Y);', 'return (_st&&_st[plId])||PLAN_DEF[plId]||PLAN_DEF.standard;')],
  ['planUpdateDay repart du mois de PLAN_DEF',
   s => s.replace('var _bse=PLAN_DEF[id]?_planTplDef(id,_pY()):null;\n  var defData=_bse&&_bse[m]?Object.assign({},_bse[m]):{};',
                  'var defData=PLAN_DEF[id]&&PLAN_DEF[id][m]?Object.assign({},PLAN_DEF[id][m]):{};')],
  ['le bandeau est débranché de l\u2019onglet « Le mois »',
   s => s.replace('_pl2YearTabs()+_planRecaleBar()+_pl2Toolbar()', '_pl2YearTabs()+_pl2Toolbar()')],
  ['les places à pourvoir ne sont plus déclarées',
   s => s.replace('if(!pris[d]&&dows[new Date(anDst,m,d).getDay()])vides.push({m:m,d:d});', 'if(false)vides.push({m:m,d:d});')],
  ['le rang dans le mois est ignoré (premier jour de semaine venu)',
   s => s.replace('cs[ws]=(cs[ws]||0)+1; dd=place[ws+\'|\'+cs[ws]];', 'cs[ws]=(cs[ws]||0)+1; dd=place[ws+\'|1\'];')],
  ['les heures perdues sont tues',
   s => s.replace('else perdus.push({m:_m,d:s,h:parseFloat(mo[k])||0});', 'else{}')],
  ['le document imprime refait sa propre copie du constat',
   s => s.replace('var _et=(typeof _planRecaleEtat===\'function\')?_planRecaleEtat(yr,grps.map(function(g){return g.id;})):null;',
                  'var _et=(typeof _planYearHasData===\'function\'&&!_planYearHasData(yr))?{trous:0}:null;')],
];
let cok = 0, cko = 0;
for (const [nom, casser] of defauts) {
  const abime = casser(brut);
  if (abime === brut) { console.log('  \x1b[31mROUGE\x1b[0m contre-épreuve inopérante (motif absent) : ' + nom); cko++; continue; }
  ok = 0; ko = 0; echecs.length = 0;
  const journal = console.log; console.log = () => {};
  let rouge = false;
  try { jouer(abime, nom); rouge = ko > 0; } catch (e) { rouge = true; }
  console.log = journal;
  if (rouge) { cok++; console.log('  \x1b[32mvert\x1b[0m  le harnais attrape : ' + nom + (echecs.length ? '  → ' + echecs[0].split('·')[0].trim() : '')); }
  else { cko++; console.log('  \x1b[31mROUGE\x1b[0m défaut NON attrapé : ' + nom); }
}
console.log((cko ? '\x1b[31m' : '\x1b[32m') + cok + '/' + defauts.length + ' défauts attrapés\x1b[0m');
process.exit(cko ? 1 : 0);
