#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais CREUX-1 : CE QUI MANQUE DANS LES FÛTS DIT LA VÉRITÉ
// ═══════════════════════════════════════════════════════════════════════════
//  ★ POURQUOI (CLAUDE.md §165). Une cuvée annonçait « Fûts pas pleins — ils
//  attendent » presque tout son vin, sa cuve décuvée ne pouvait plus servir de
//  source, et aucun geste ne sortait de là. Trois défauts s'étaient enchaînés :
//    1. « Décuver » : les fûts ajoutés avec « + » venaient EN PLUS des fûts
//       proposés (rangés en bas de la liste) — deux fois trop de bois, et son
//       vide écrit sur la cuvée ; taper le volume après coup effaçait le choix ;
//    2. « Modifier la cuvée » : enlever ces fûts laissait leur vide sur les vrais
//       fûts, et les fûts disparaissaient de La Réserve ;
//    3. rien ne permettait de dire « mes fûts sont pleins ».
//
//  Sur les VRAIES fonctions de la Cave (cave.js + cuvier.js, par la porte
//  unique) et d'utils.js, exécutées dans un bac, avec des bouchons minimes :
//    A. _vendDecSansTrop (pure) : retire les fûts PROPOSÉS en trop, jamais un choix ;
//    B. la feuille Décuver, geste par geste : le cas vécu, le volume retapé, le « − » ;
//    C. saveCuvee : un fût enlevé emporte son vide et rentre à La Réserve ;
//    D. _asmCorriger : « Mes fûts sont pleins — corriger ce qui manque » ;
//    E. l'accompagnement le dit (guide, aide, « Quoi de neuf »).
//
//  Usage :  node scripts/mv-harnais-creux.mjs [--contre]
//  LECTURE SEULE (la contre-épreuve travaille en mémoire). Jamais déployé → aucun bump.
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { lireCave } from './mv-cave-src.mjs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SAIN = { cave: lireCave(), utils: lire('src/utils.js'), g08: lire('guide/08-cave.html') };

/* ══ EXTRACTION — accolades comptées hors chaînes et hors commentaires ══ */
function bornes(src, nom) {
  const re = new RegExp('^(?:export )?(?:async )?function ' + nom + '\\s*\\(', 'gm');
  const m = [...src.matchAll(re)];
  if (m.length !== 1) throw new Error(nom + ' : ' + m.length + ' définition(s)');
  let d = 0, q = null;
  for (let j = src.indexOf('{', m[0].index); j < src.length; j++) {
    const ch = src[j];
    if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
    if (ch === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (ch === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j) + 1; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { q = ch; continue; }
    if (ch === '{') d++;
    else if (ch === '}' && --d === 0) return [m[0].index, j + 1];
  }
  throw new Error('accolade non fermée : ' + nom);
}
const fn = (src, nom) => { const [a, b] = bornes(src, nom); return src.slice(a, b).replace(/^export /, ''); };
function table(src, nom) {
  const i = src.indexOf('var ' + nom + ' = {');
  if (i < 0) throw new Error('table absente : ' + nom);
  return src.slice(i, src.indexOf('\n};', i) + 3);
}
/* La déclaration d'état est extraite telle quelle : si elle disparaît, le harnais tombe. */
function declaration(src, re, nom) {
  const m = src.match(re);
  if (!m) throw new Error('déclaration absente : ' + nom);
  return m[0];
}

const NC = ['_caveFutL', '_caveTonL', '_caveFutsL', '_caveHorsFormat', '_caveLTxt', '_caveVolCuvesL', '_caveManqueL',
  '_caveCuveSource', '_asmCuvee', '_asmCorriger', '_cuvRendreFuts', 'saveCuvee',
  '_vendDecVieux', '_vendDecLotL', '_vendDecPropVol', '_vendDecSansTrop', '_vendDecPropose', '_vendDecAdjLot',
  '_vendDecTotal', '_vendDecParcVide', '_vendDecLogeHl', '_vendDecVolHl', '_vendDecHorsHl', '_vendDecF2'];
const NU = ['_mvFutAn', '_mvFutVins', '_mvFutNorm', '_mvFutMemeLot', '_mvFutRef', '_mvFutL', '_mvFutRid',
  '_mvFutTracer', '_mvFutStock', '_mvFutEntrer', '_mvFutLiberer', '_mvFutLotsDe', '_mvFutDispo', '_mvFutReprendre', '_mvFutTotal'];

/* Les bouchons : l'écran, le réseau, la date. Tout le reste est le vrai code. */
const PRELUDE = `
var J = { toasts:[], fb:[], saves:0, rendus:0, closes:0, prompt:null, intrSaves:0, sheet:0 };
var DOM = {};
var document = { getElementById: function(id){ return (id in DOM) ? { value: DOM[id] } : null; } };
var window = { CONFIG: { cave: { fut_l: 228 } }, INTRANTS: { futs: [], fut_mouv: [] },
  saveIntrants: function(){ J.intrSaves++; },
  fbSaveToast: function(o, m){ J.saves++; J.fb.push(m); },
  closeOv: function(){ J.closes++; },
  openPrompt: function(o){ J.prompt = o; } };
var CAVE_ELEVAGE = { cuvees: [], operations: [] };
var CAVE_VENDANGE = { cuves_vinif: [] };
var _cuvTonneaux = [];
var _PEUT = true;
function canWrite(){ return _PEUT; }
function showToast(m){ J.toasts.push(m); }
function renderCave(){ J.rendus++; }
function _mvToday(){ return '2026-09-21'; }
function _vendSheetClose(){ J.sheet++; }
function _vendFbSave(m){ J.fb.push(m); J.saves++; }
function _vendDecRender(){}
function _vendDecVolEst(){ return 0; }
function _escHtml(s){ return String(s==null?'':s); }
function _escAttr(s){ return String(s==null?'':s); }
function _caveFmlEtat(){ return 'non'; }
`;
function charger(S) {
  const etat = [
    declaration(S.cave, /^var _vendDecChoix=\{\};$/m, '_vendDecChoix'),
    declaration(S.cave, /^var _vendDecMain=\{\};$/m, '_vendDecMain'),
    declaration(S.cave, /^var _vendDecMode='fut', _vendDecCuveRef=null, _vendDecCuveL=0;$/m, '_vendDecMode'),
    declaration(S.cave, /^var _vendDecNb=2, _vendDecCuveId=null;$/m, '_vendDecNb'),
    declaration(S.cave, /^var _vendDecVolSaisi=null;$/m, '_vendDecVolSaisi'),
    declaration(S.cave, /^var _vendDecNote='';$/m, '_vendDecNote'),
  ].join('\n');
  const code = PRELUDE + etat + '\n' + NC.map(n => fn(S.cave, n)).join('\n') + '\n'
    + table(S.utils, 'MV_FUT_MOTIFS') + '\n' + NU.map(n => fn(S.utils, n)).join('\n') + '\n'
    + NU.map(n => 'window.' + n + '=' + n + ';').join('') + '\n'
    + ';({ J:J, DOM:DOM, window:window, CAVE_ELEVAGE:CAVE_ELEVAGE,'
    + ' get choix(){ return _vendDecChoix; }, set choix(v){ _vendDecChoix=v; },'
    + ' get main(){ return _vendDecMain; }, set main(v){ _vendDecMain=v; },'
    + ' set vol(v){ _vendDecVolSaisi=v; }, set mode(v){ _vendDecMode=v; }, set tonneaux(v){ _cuvTonneaux=v; }, set peut(v){ _PEUT=v; },'
    + NC.map(n => n + ':' + n).join(',') + ' })';
  return vm.runInNewContext(code, {});
}

/* ══ LES JEUX ══ */
const lot = (id, annee, qte, l) => ({ id, annee, qte, l: l || null });
const LOTS_STOCK = () => [
  { id: 'fC', four: 'Tonnellerie C', ref: 'C24', annee: '2024', qte: 10 },
  { id: 'fA', four: 'Tonnellerie A', ref: 'A16', annee: '2016', qte: 8 },
  { id: 'fB', four: 'Tonnellerie B', ref: 'B19', annee: '2019', qte: 6 },
  { id: 'fH', four: 'Tonnellerie H', ref: 'DM', annee: '2020', qte: 2, l: 500 },
];
/* La feuille Décuver telle qu'on l'ouvre : parc posé, volume mesuré, choix vide. */
function feuille(A, volHl) {
  A.window.INTRANTS = { futs: LOTS_STOCK(), fut_mouv: [] };
  A.choix = {}; A.main = {}; A.mode = 'fut'; A.vol = volHl;
  A._vendDecPropose();
  return A;
}
const n = (A, id) => parseInt(A.choix[id], 10) || 0;
const total = A => Object.values(A.choix).reduce((s, x) => s + (parseInt(x, 10) || 0), 0);
/* Une cuvée au Chai et sa fiche : l'état d'avant, et ce que la fiche renvoie. */
function fiche(A, cuv, lignes, statut) {
  A.CAVE_ELEVAGE.cuvees = [cuv];
  A.tonneaux = lignes;
  A.DOM['cuv-nom'] = cuv.nom; A.DOM['cuv-millesime'] = String(cuv.millesime);
  A.DOM['cuv-statut'] = statut || cuv.statut; A.DOM['cuv-fml-val'] = 'non'; A.DOM['cuv-id'] = cuv.id;
  A.saveCuvee();
  return A.CAVE_ELEVAGE.cuvees[0];
}
const CUVEE = (extra) => Object.assign({ id: 'cuvGV', nom: 'Village', millesime: 2026, statut: 'elevage',
  tonneaux: [{ annee: '2016', nb: 5, four: 'Tonnellerie A', ref: 'A16', lot_id: 'fA' },
             { annee: '2024', nb: 5, four: 'Tonnellerie C', ref: 'C24', lot_id: 'fC' }],
  manque_l: 1140 }, extra || {});
const stockDe = (A, ref) => { const f = A.window.INTRANTS.futs.find(x => x.ref === ref); return f ? f.qte : 0; };

const T = {
  // A — la fonction pure
  A1: ['le cas vécu : 5 fûts proposés + 5 choisis, 1 140 L de trop → les 5 proposés partent', A => {
    const o = A._vendDecSansTrop([lot('fC', 2024, 10), lot('fA', 2016, 8)], { fC: 5, fA: 5 }, { fC: true }, 1140);
    return o.fA === 0 && o.fC === 5; }],
  A2: ['du plus neuf au plus vieux : 456 L de trop sur A(2016)=3 et B(2019)=2 → B part', A => {
    const o = A._vendDecSansTrop([lot('fA', 2016, 8), lot('fB', 2019, 6)], { fA: 3, fB: 2 }, {}, 456);
    return o.fB === 0 && o.fA === 3; }],
  A3: ['moins d’un fût de trop (100 L) : rien ne part', A => {
    const o = A._vendDecSansTrop([lot('fA', 2016, 8)], { fA: 5 }, {}, 100);
    return o.fA === 5; }],
  A4: ['un fût hors format n’est jamais retiré d’office', A => {
    const o = A._vendDecSansTrop([lot('fH', 2020, 2, 500), lot('fA', 2016, 8)], { fH: 1, fA: 3 }, {}, 600);
    return o.fH === 1 && o.fA === 1; }],
  A5: ['un choix fait à la main n’est jamais retiré, même avec 2 000 L de trop', A => {
    const o = A._vendDecSansTrop([lot('fC', 2024, 10)], { fC: 9 }, { fC: true }, 2000);
    return o.fC === 9; }],
  A6: ['pure : le choix reçu n’est pas modifié', A => {
    const c = { fA: 5 }; A._vendDecSansTrop([lot('fA', 2016, 8)], c, {}, 1140);
    return c.fA === 5; }],
  // B — la feuille, geste par geste
  B1: ['à l’ouverture, 11,40 hL mesurés : 5 fûts proposés, les plus vieux (A 2016)', A => {
    feuille(A, 11.40); return n(A, 'fA') === 5 && n(A, 'fC') === 0 && total(A) === 5; }],
  B2: ['★ le cas vécu : « + » cinq fois sur C → C = 5, A = 0, 5 fûts en tout (pas 10)', A => {
    feuille(A, 11.40); for (let i = 0; i < 5; i++) A._vendDecAdjLot('fC', 1);
    return n(A, 'fC') === 5 && n(A, 'fA') === 0 && total(A) === 5; }],
  B3: ['le volume retapé (13,68 hL) garde les 5 C choisis et propose le 6ᵉ ailleurs', A => {
    feuille(A, 11.40); for (let i = 0; i < 5; i++) A._vendDecAdjLot('fC', 1);
    A.vol = 13.68; A._vendDecPropose();
    return n(A, 'fC') === 5 && n(A, 'fA') === 1 && total(A) === 6; }],
  B4: ['…et retapé à 11,40, le fût proposé repart, les choisis restent', A => {
    feuille(A, 11.40); for (let i = 0; i < 5; i++) A._vendDecAdjLot('fC', 1);
    A.vol = 13.68; A._vendDecPropose(); A.vol = 11.40; A._vendDecPropose();
    return n(A, 'fC') === 5 && n(A, 'fA') === 0; }],
  B5: ['un « − » sur un fût proposé ne recoche rien ailleurs', A => {
    feuille(A, 11.40); A._vendDecAdjLot('fA', -1);
    return n(A, 'fA') === 4 && n(A, 'fB') === 0 && n(A, 'fC') === 0 && total(A) === 4; }],
  B6: ['hors format : les barriques se recalculent sur le reste, comme avant (H = 1, A = 3)', A => {
    feuille(A, 11.40); A._vendDecAdjLot('fH', 1);
    return n(A, 'fH') === 1 && n(A, 'fA') === 3; }],
  B7: ['un choix sur le lot le PLUS VIEUX ne grossit pas au volume retapé (A reste à 2)', A => {
    feuille(A, 11.40); A._vendDecAdjLot('fA', -1); A._vendDecAdjLot('fA', -1); A._vendDecAdjLot('fA', -1);
    A.vol = 11.40; A._vendDecPropose();
    return n(A, 'fA') === 2 && n(A, 'fB') === 3; }],
  B8: ['la feuille remet les choix à zéro à l’ouverture et en passant « en cuve »', (A, S) => {
    const o = fn(S.cave, 'openVendDecuvage'), m = fn(S.cave, '_vendDecMode2');
    return /_vendDecChoix=\{\}; _vendDecMain=\{\};/.test(o) && /if\(m==='cuve'\)\{ _vendDecChoix=\{\}; _vendDecMain=\{\}; \}/.test(m); }],
  // C — « Modifier la cuvée »
  C1: ['★ le cas vécu : la ligne A enlevée → plus rien ne manque, les 5 A rentrent à La Réserve', A => {
    A.window.INTRANTS = { futs: [{ id: 'fA', four: 'Tonnellerie A', ref: 'A16', annee: '2016', qte: 3 }], fut_mouv: [] };
    const c = fiche(A, CUVEE(), [{ annee: '2024', nb: 5, four: 'Tonnellerie C', ref: 'C24', lot_id: 'fC' }]);
    const mv = A.window.INTRANTS.fut_mouv;
    return c.manque_l === 0 && c.tonneaux.length === 1 && stockDe(A, 'A16') === 8
      && mv.length === 1 && mv[0].motif === 'retrait' && mv[0].nb === 5 && /rendus/.test(A.J.fb.slice(-1)[0] || ''); }],
  C2: ['5 → 3 sur une ligne : 2 fûts rentrent, le vide baisse de 456 L', A => {
    A.window.INTRANTS = { futs: [], fut_mouv: [] };
    const c = fiche(A, CUVEE({ manque_l: 500 }), [{ annee: '2016', nb: 3, four: 'Tonnellerie A', ref: 'A16', lot_id: 'fA' },
      { annee: '2024', nb: 5, four: 'Tonnellerie C', ref: 'C24', lot_id: 'fC' }]);
    return c.manque_l === 44 && stockDe(A, 'A16') === 2; }],
  C3: ['une ligne sans lot (saisie à la main) enlevée : rien ne rentre au parc, le vide baisse quand même', A => {
    A.window.INTRANTS = { futs: [], fut_mouv: [] };
    const c = fiche(A, CUVEE({ tonneaux: [{ annee: '2016', nb: 2 }, { annee: '2024', nb: 5, lot_id: 'fC' }], manque_l: 456 }),
      [{ annee: '2024', nb: 5, lot_id: 'fC' }]);
    return c.manque_l === 0 && A.window.INTRANTS.futs.length === 0 && A.window.INTRANTS.fut_mouv.length === 0; }],
  C4: ['une cuvée embouteillée : ses fûts sont déjà au parc, rien ne bouge', A => {
    A.window.INTRANTS = { futs: [], fut_mouv: [] };
    const c = fiche(A, CUVEE({ statut: 'embouteille' }), [{ annee: '2024', nb: 5, four: 'Tonnellerie C', ref: 'C24', lot_id: 'fC' }], 'embouteille');
    return c.manque_l === 1140 && A.window.INTRANTS.futs.length === 0; }],
  C5: ['un vide DÉDUIT (champ absent) n’est pas écrit', A => {
    A.window.INTRANTS = { futs: [], fut_mouv: [] };
    const cu = CUVEE(); delete cu.manque_l;
    const c = fiche(A, cu, [{ annee: '2024', nb: 5, four: 'Tonnellerie C', ref: 'C24', lot_id: 'fC' }]);
    return !('manque_l' in c); }],
  C6: ['une ligne AJOUTÉE : rien ne sort du parc, le vide ne bouge pas', A => {
    A.window.INTRANTS = { futs: [{ id: 'fA', four: 'Tonnellerie A', ref: 'A16', annee: '2016', qte: 3 }], fut_mouv: [] };
    const cu = CUVEE({ manque_l: 30 });
    const c = fiche(A, cu, cu.tonneaux.concat([{ annee: '2026', nb: 1 }]));
    return c.manque_l === 30 && stockDe(A, 'A16') === 3; }],
  // D — « Mes fûts sont pleins »
  D1: ['la sortie ferme la feuille et demande ce qui manque, pré-rempli', A => {
    A.CAVE_ELEVAGE.cuvees = [CUVEE({ tonneaux: [{ annee: '2024', nb: 5, lot_id: 'fC' }] })];
    A.J.prompt = null; A.J.sheet = 0; A._asmCorriger('cuvGV');
    return A.J.sheet === 1 && A.J.prompt && A.J.prompt.valeur === '1140' && /1\s?140/.test(A.J.prompt.sub.replace(/\u00a0|\u202f/g, ' ')); }],
  D2: ['0 → « Les fûts sont pleins », écrit et repeint', A => {
    const cu = CUVEE({ tonneaux: [{ annee: '2024', nb: 5, lot_id: 'fC' }] }); A.CAVE_ELEVAGE.cuvees = [cu];
    const r0 = A.J.rendus; A._asmCorriger('cuvGV'); A.J.prompt.cb('0');
    return cu.manque_l === 0 && A.J.fb.slice(-1)[0] === 'Les f\u00fbts sont pleins' && A.J.rendus === r0 + 1; }],
  D3: ['30 → il manque 30 L (virgule acceptée : « 30,4 » → 30)', A => {
    const cu = CUVEE({ tonneaux: [{ annee: '2024', nb: 5, lot_id: 'fC' }] }); A.CAVE_ELEVAGE.cuvees = [cu];
    A._asmCorriger('cuvGV'); A.J.prompt.cb('30,4');
    return cu.manque_l === 30; }],
  D4: ['plus que les fûts (1 500 L sur 1 140) : refusé, rien d’écrit', A => {
    const cu = CUVEE({ tonneaux: [{ annee: '2024', nb: 5, lot_id: 'fC' }] }); A.CAVE_ELEVAGE.cuvees = [cu];
    A._asmCorriger('cuvGV'); A.J.prompt.cb('1500');
    return cu.manque_l === 1140 && /Plus que les f/.test(A.J.toasts.slice(-1)[0]); }],
  D5: ['un nombre négatif ou du texte : refusé', A => {
    const cu = CUVEE({ tonneaux: [{ annee: '2024', nb: 5, lot_id: 'fC' }] }); A.CAVE_ELEVAGE.cuvees = [cu];
    A._asmCorriger('cuvGV'); A.J.prompt.cb('-3'); A.J.prompt.cb('abc');
    return cu.manque_l === 1140; }],
  D6: ['en lecture seule, la sortie ne s’ouvre pas', A => {
    A.CAVE_ELEVAGE.cuvees = [CUVEE()]; A.J.prompt = null; A.peut = false;
    A._asmCorriger('cuvGV'); A.peut = true;
    return A.J.prompt === null; }],
  D7: ['la feuille « Compléter le fût » porte la sortie, et le bouton est joignable', (A, S) =>
    /onclick="_asmCorriger\(/.test(fn(S.cave, '_asmOuvrir')) && /Mes f\\u00fbts sont pleins/.test(fn(S.cave, '_asmOuvrir'))
    && /^window\._asmCorriger = _asmCorriger;$/m.test(S.cave)],
  // E — l'accompagnement
  E1: ['le guide dit « Mes fûts sont pleins », le fût enlevé qui rentre, et les choix qui restent', (A, S) =>
    /Mes fûts sont pleins/.test(S.g08) && /retournent dans La Réserve/.test(S.g08) && /Vos fûts restent les vôtres/.test(S.g08)],
  E2: ['l’aide de la Cave le dit aux trois endroits', (A, S) =>
    /Mes fûts sont pleins/.test(S.utils) && /enlève aussi le vide/.test(S.utils) && /remplacent ceux que l’application avait proposés/.test(S.utils)],
  E3: ['« Quoi de neuf » 7.52 annonce les trois, du point de vue de celui qui les vit', (A, S) => {
    const i = S.utils.indexOf("{ v: '7.52'"), j = S.utils.indexOf("{ v: '7.51'");
    const b = i >= 0 && j > i ? S.utils.slice(i, j) : '';
    return /Mes fûts sont pleins/.test(b) && /La Réserve/.test(b) && /Décuver/.test(b); }],
};

function jouer(S) {
  let A; const res = [];
  try { A = charger(S); }
  catch (e) { return [{ id: 'P', nom: 'le bac se charge', ok: false, det: String(e.message).slice(0, 200) }]; }
  for (const [id, [nom, f]] of Object.entries(T)) {
    let ok = false, det = '';
    try { ok = !!f(A, S); } catch (e) { det = 'PLANTE : ' + String(e && e.message).slice(0, 160); }
    res.push({ id, nom, ok, det });
  }
  return res;
}
const vert = s => '\x1b[32m' + s + '\x1b[0m', rouge = s => '\x1b[31m' + s + '\x1b[0m';

if (!CONTRE) {
  console.log('\n\x1b[1m── CREUX-1 — ce qui manque dans les fûts dit la vérité\x1b[0m\n');
  const r = jouer(SAIN);
  for (const x of r) console.log('  ' + (x.ok ? vert('✓') : rouge('✗')) + ' ' + x.id + ' ' + x.nom + (x.det ? '\n      → ' + x.det : ''));
  const ko = r.filter(x => !x.ok).length;
  console.log('\nCREUX-1 : ' + (r.length - ko) + ' vertes, ' + ko + ' rouges\n');
  process.exit(ko ? 1 : 0);
}

/* ── Contre-épreuves : un défaut à la fois, dans la fonction visée ────────── */
const DEFAUTS = [
  ['le « + » ne marque plus le lot comme choisi', '_vendDecAdjLot', "  _vendDecMain[id]=true;", '', ['B2', 'B3']],
  ['le « + » ne retire plus les fûts proposés (le défaut vécu)', '_vendDecAdjLot',
    "      _vendDecChoix=_vendDecSansTrop(", "      _vendDecChoix=(function(a,b,c,d){ return b; })(", ['B2']],
  ['la proposition oublie les choix à la main', '_vendDecPropose', 'if(main || (n>0 && _caveHorsFormat(_vendDecLotL(l))))',
    'if(n>0 && _caveHorsFormat(_vendDecLotL(l)))', ['B3']],
  ['la proposition remplit aussi les lots choisis', '_vendDecPropose', ' && !_vendDecMain[l.id]; });', '; });', ['B7']],
  ['la fonction pure retire aussi les choix', '_vendDecSansTrop', 'return !(main&&main[l.id]) && ', 'return ', ['A5']],
  ['le retrait part du plus vieux', '_vendDecSansTrop', '.sort(function(a,b){ return _vendDecVieux(b,a); })',
    '.sort(function(a,b){ return _vendDecVieux(a,b); })', ['A2']],
  ['la fiche garde le vide du fût enlevé', 'saveCuvee', "          _prevC.manque_l=Math.max(0,Math.round(parseFloat(_prevC.manque_l)-_dF));",
    "          void 0;", ['C1']],
  ['la fiche ne rend plus les fûts au parc', 'saveCuvee', "        _rendus=_cuvRendreFuts(_prevC.tonneaux, tonneaux, nom+' '+millesime);",
    "        _rendus=0;", ['C1']],
  ['une ligne sans lot fabrique des fûts au parc', '_cuvRendreFuts', 'if(t&&t.lot_id) s[t.lot_id]', 'if(t) s[t.lot_id||t.annee]', ['C3']],
  ['une cuvée embouteillée rend ses fûts une seconde fois', 'saveCuvee', "      if(_prevC.statut!=='embouteille'){\n        var _dF",
    "      if(true){\n        var _dF", ['C4']],
  ['la correction accepte plus que le bois', '_asmCorriger', "      if(n>F){", "      if(false){", ['D4']],
  ['la feuille perd sa sortie', '_asmOuvrir', "onclick=\"_asmCorriger(\\''+_escAttr(cu.id)+'\\')\"", "onclick=\"void(0)\"", ['D7']],
];
console.log('\n\x1b[1m── CREUX-1 — contre-épreuves (' + DEFAUTS.length + ' défauts, un à la fois)\x1b[0m\n');
const base = jouer(SAIN);
if (base.some(x => !x.ok)) { console.log(rouge('  ✗ la base n\u2019est pas verte — contre-épreuve sans valeur')); process.exit(1); }
let vus = 0;
for (const [nom, cible, de, vers, attendus] of DEFAUTS) {
  let S2;
  try {
    const [a, b] = bornes(SAIN.cave, cible), corps = SAIN.cave.slice(a, b);
    if (corps.split(de).length - 1 !== 1) throw new Error('ancre x' + (corps.split(de).length - 1) + ' dans ' + cible);
    S2 = { ...SAIN, cave: SAIN.cave.slice(0, a) + corps.replace(de, vers) + SAIN.cave.slice(b) };
  } catch (e) { console.log('  ' + rouge('!! ') + nom + ' — injection morte : ' + e.message); continue; }
  const r = jouer(S2), rouges = r.filter(x => !x.ok).map(x => x.id);
  const ok = attendus.every(id => rouges.includes(id));
  if (ok) vus++;
  console.log('  ' + (ok ? vert('✓') : rouge('✗')) + ' ' + nom + ' → ' + (rouges.join(', ') || 'rien'));
}
console.log('\n  ' + (vus === DEFAUTS.length ? vert('Contre-épreuves CREUX-1 : ' + vus + ' détectées sur ' + vus)
  : rouge((DEFAUTS.length - vus) + ' contre-épreuve(s) sans effet')) + '\n');
process.exit(vus === DEFAUTS.length ? 0 : 1);
