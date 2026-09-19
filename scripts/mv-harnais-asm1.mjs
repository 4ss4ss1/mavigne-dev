// ═══════════════════════════════════════════════════════════════════════════
//  HARNAIS ASM-1 + VOL-2 — LE FÛT ENTAMÉ, COMPLÉTER DEPUIS LE CHAI, ET LE kg/hL
// ═══════════════════════════════════════════════════════════════════════════
//  Nico, 19/09 : « pouvoir faire un assemblage (prendre du jus d'une autre cuve
//  pour compléter un fût non rempli) ; l'idéal est de pouvoir le remplir par le
//  chai en cliquant sur le fût concerné » — « le jus peut venir d'une cuve pas
//  encore décuvée » — « il serait intéressant d'indiquer le kg/hL du rendement
//  sur chaque étape sur le graph ». Maquette validée (« go »).
//
//  Sur les VRAIES fonctions de src/cave.js (et le socle de graphe d'utils.js).
//  Bouchons : données (kilos d'une récolte, parcelles), affichage (_mvIcon,
//  échappeurs, texte des contenants) et les portes d'écriture (sauvegarde,
//  toast, confirmation) — espionnées, pas réécrites.
//
//  A le fût entamé (_caveManqueL, _caveVolL) · B d'où peut venir le vin ·
//  C compléter depuis le Cuvier · D les refus · E depuis le Chai · F défaire ·
//  G la chaîne (kg/hL, apport, dégradé unique) · H la carte · I le Cuvier ·
//  J décuvage et correction · K les journaux · L l'accompagnement.
//
//  Usage :  node scripts/mv-harnais-asm1.mjs            (assertions)
//           node scripts/mv-harnais-asm1.mjs --contre   (défauts réintroduits)
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SAIN = { cave: lire('src/cave.js'), utils: lire('src/utils.js'), g08: lire('guide/08-cave.html') };

function bornes(src, nom) {
  const m = [...src.matchAll(new RegExp('^(?:export )?function ' + nom + '\\s*\\(', 'gm'))];
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
const fn = (src, nom) => { const [a, b] = bornes(src, nom); return src.slice(a, b); };
const code = (src, nom) => fn(src, nom).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
function tableau(src, nom) {
  const m = new RegExp('^var ' + nom + '\\s*=\\s*[\\[{]', 'm').exec(src);
  if (!m) throw new Error('table absente : ' + nom);
  let i = m.index; while (src[i] !== '[' && src[i] !== '{') i++;
  let d = 0, q = null;
  for (let j = i; j < src.length; j++) {
    const ch = src[j];
    if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
    if (ch === "'" || ch === '"') { q = ch; continue; }
    if (ch === '[' || ch === '{') d++;
    else if ((ch === ']' || ch === '}') && --d === 0) return src.slice(m.index, j + 1) + ';';
  }
  throw new Error('table non fermée : ' + nom);
}
function socleGraphe(u) {
  const a = u.indexOf('var MV_GRAPH_MIN'), b0 = u.indexOf('window._mvGraphSvg = function');
  return u.slice(a, u.indexOf('\n};', b0) + 3);
}

const NC = ['_vendCfg', '_mvF1', '_vendCuvF1', '_mvBtl', '_mlKgHl', '_vendHlKg', '_vendCuvKgDom',
  '_caveFutL', '_caveTonL', '_caveFutsL', '_caveVolCuvesL', '_caveManqueL', '_caveVolL', '_caveVolHl',
  '_caveGroupesL', '_caveHorsFormat', '_caveLTxt', '_caveCuveSource', '_caveTypeLabel', '_caveJDet',
  '_vendVolLoge', '_vendSortiesHl', '_vendPrelevHl', '_vendVolContenu', '_vendVolCuve',
  '_vendDecuvee', '_vendEstFusionnee', '_vendStatLbl', '_vendParcByName', '_vendOpLbl', '_vendOpDet',
  '_vendEstIntrant', '_vendIntrQteTxt', '_vendMoyTbl', '_vendMoyLbl',
  '_rmNum', '_rmF', '_rmDetail', '_rmVolRepli', '_rmMilCuve', '_rmMilCuvees', '_rmLignes',
  '_caveBilanChaine', '_caveBtlGraphSvg',
  '_asmCuvee', '_asmAocsCuve', '_asmAocsCuvee', '_asmIdxCuve', '_asmSources', '_asmFutSvg', '_asmCarteHtml',
  '_asmFutTxt', '_asmRefus', '_asmApercu', '_asmValider', '_asmDefaire', 'deleteCaveOp'];
const TABLES = ['_VEND_STAT', '_VEND_OPS', '_VEND_INTR', '_VEND_FROID', '_VEND_CHAUD', 'RM_TYPES', 'RM_HORS'];
const PRELUDE = `
var window = { CONFIG: { cave: { fut_l: 228 } }, PARCELLES: [], currentUser: { nom: 'Nico' } };
var CAVE_VENDANGE = { config: { ratio_min: 130, ratio_max: 140 }, recoltes: [], cuves_vinif: [] };
var CAVE_ELEVAGE = { cuvees: [], operations: [] };
window.CAVE_VENDANGE = CAVE_VENDANGE; window.CAVE_ELEVAGE = CAVE_ELEVAGE;
var _CAVE_BTL_GID = 0, _asmCuv = null, _asmSrc = null, _asmL = 0, _ASM_GID = 0;
var document = { getElementById: function(){ return null; }, querySelectorAll: function(){ return []; } };
var __journal = { saves: [], toasts: [], confirm: null, rendu: 0 };
function _recKgDom(r){ return (r && r.kg_dom) || 0; }
function _escHtml(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function _escAttr(s){ return String(s==null?'':s).replace(/\\\\/g,'\\\\\\\\').replace(/'/g,"\\\\'"); }
function _mvIcon(n){ return '<i data-ic="'+n+'"></i>'; }
function _caveContenantsHtml(x){ return 'contenants'; }
function _mvToday(){ return '2026-09-19'; }
function canWrite(){ return true; } function isAdmin(){ return true; }
function showToast(m){ __journal.toasts.push(m); }
function _vendSheetClose(){} function renderCave(){ __journal.rendu++; } function _caveV2InjectCss(){}
function _vendFbSave(msg, coul, cles){ __journal.saves.push({ msg: msg, cles: (cles || ['cave_vendange']).slice().sort() }); }
window.fbSaveToast = function(p, msg){ __journal.saves.push({ msg: msg, cles: Object.keys(p).sort() }); };
window.openConfirmDel = function(t, a, cb, ic, lbl){ __journal.confirm = { t: t, a: a, lbl: lbl }; cb(); };
function __poser(v, e){
  CAVE_VENDANGE.recoltes = v.recoltes || []; CAVE_VENDANGE.cuves_vinif = v.cuves_vinif || [];
  CAVE_ELEVAGE.cuvees = e.cuvees || []; CAVE_ELEVAGE.operations = e.operations || [];
  window.PARCELLES = v.parcelles || [];
  __journal.saves = []; __journal.toasts = []; __journal.confirm = null;
}
function __etat(c, s, l){ _asmCuv = c; _asmSrc = s; _asmL = l; }
`;
function charger(S) {
  const corps = PRELUDE + socleGraphe(S.utils) + '\n' + TABLES.map(t => tableau(S.cave, t)).join('\n') + '\n'
    + NC.map(n => fn(S.cave, n)).join('\n')
    + '\n;({' + NC.join(',') + ', CAVE_VENDANGE, CAVE_ELEVAGE, __poser, __etat, __journal, window})';
  return vm.runInNewContext(corps, {});
}

/* ══ LE JEU : Ruchottes 2026 (1 fût de 280 L, 2,50 hL entonnés), la Cuve 7 qui fermente,
      une cuvée du Chai en cuve, une autre en fûts, et les exclus ══ */
function jeu(o) {
  o = o || {};
  const cvR = { id: 'cvR', nom: 'Cuve 1', volume_hl: 5, statut: 'termine', operations: [],
    decuvage: { date: '2026-09-15', cuvee_id: 'cuR' }, vol_decuve_hl: 2.5, vol_decuve_src: 'mesure' };
  const c7 = { id: 'c7', nom: 'Cuve 7', cuvee_src: 'Gevrey VV 2026', volume_hl: 60, statut: 'fa', operations: [] };
  const exclus = [
    // décuvée mais son statut dit encore « MPF » (un parcours corrigé à la main) : c'est le décuvage qui l'exclut
    { id: 'cDec', nom: 'Décuvée', statut: 'mpf', decuvage: { date: '2026-09-12', cuvee_id: 'x' }, vol_decuve_hl: 10, operations: [] },
    { id: 'cTer', nom: 'Terminée', statut: 'termine', operations: [] },
    { id: 'cFus', nom: 'Fusionnée', statut: 'fa', fusion: { vers: 'c7' }, operations: [] },
    { id: 'cSet', nom: 'Préparée', statut: 'setup', operations: [] },
    { id: 'cVide', nom: 'Vide', statut: 'fa', operations: [] }
  ];
  const recoltes = [
    { id: 'rR', cuve_id: 'cvR', kg_dom: 480, parcelle: 'Ruchottes', date: '2026-09-10' },
    { id: 'r7', cuve_id: 'c7', kg_dom: 5670, parcelle: 'Clos VV', date: '2026-09-11' },
    { id: 'rD', cuve_id: 'cDec', kg_dom: 1500, parcelle: 'Clos VV', date: '2026-09-09' },
    { id: 'rS', cuve_id: 'cSet', kg_dom: 800, parcelle: 'Clos VV', date: '2026-09-09' },
    { id: 'rT', cuve_id: 'cTer', kg_dom: 900, parcelle: 'Clos VV', date: '2026-09-09' }
  ];
  const cuR = { id: 'cuR', nom: 'Ruchottes', millesime: 2026, statut: 'elevage', tonneaux: [{ annee: 2023, nb: 1, l: 280 }] };
  if (o.manque != null) cuR.manque_l = o.manque;
  const cuvees = [cuR,
    { id: 'b25', nom: 'Bourgogne', millesime: 2025, statut: 'elevage', tonneaux: [], cuves: [{ ref: 'i2', litres: 2000 }] },
    { id: 'r25', nom: 'Ruchottes', millesime: 2025, statut: 'elevage', tonneaux: [{ annee: 2022, nb: 2 }] },
    { id: 'emb', nom: 'Embouteillée', millesime: 2024, statut: 'embouteille', tonneaux: [{ annee: 2021, nb: 3 }] }];
  const parcelles = [{ nom: 'Ruchottes', appellation: 'Ruchottes-Chambertin' }, { nom: 'Clos VV', appellation: 'Gevrey-Chambertin' }];
  return { v: { recoltes, cuves_vinif: [cvR, c7].concat(exclus), parcelles }, e: { cuvees, operations: [] } };
}
const poser = (A, o) => { const d = jeu(o); A.__poser(d.v, d.e); return d; };
const cuv = (A, id) => A.CAVE_ELEVAGE.cuvees.find(x => x.id === id);
const cve = (A, id) => A.CAVE_VENDANGE.cuves_vinif.find(x => x.id === id);
const completer = (A, src, L) => { A.__etat('cuR', src, L); A._asmValider(); return A.CAVE_ELEVAGE.operations[A.CAVE_ELEVAGE.operations.length - 1]; };
const avant = (t, a, b) => t.indexOf(a) >= 0 && t.indexOf(b) >= 0 && t.indexOf(a) < t.indexOf(b);

const T = {
  // A — le fût entamé
  A1: ['1 fût de 280 L, il en manque 30 : la cuvée compte 250 L (2,50 hL), pas 280', A => {
    poser(A, { manque: 30 }); const c = cuv(A, 'cuR'); return A._caveManqueL(c) === 30 && A._caveVolL(c) === 250 && A._caveVolHl(c) === 2.5; }],
  A2: ['déduit de la mesure du décuvage pour une cuvée d’avant ce lot (2,50 hL mesurés → 30 L)', A => {
    poser(A); const c = cuv(A, 'cuR'); return !('manque_l' in c) && A._caveManqueL(c) === 30 && A._caveVolL(c) === 250; }],
  A3: ['sans mesure (contenants), rien n’est deviné : les fûts comptent pleins', A => {
    poser(A); const cv = cve(A, 'cvR'); cv.vol_decuve_src = 'contenants'; return A._caveManqueL(cuv(A, 'cuR')) === 0; }],
  A4: ['une cuvée qui a une cuve ne se déduit pas (le volume de sa cuve a pu bouger)', A => {
    poser(A); const c = cuv(A, 'cuR'); c.cuves = [{ ref: 'z', litres: 100 }]; return A._caveManqueL(c) === 0; }],
  A5: ['un manque ne dépasse jamais le bois : 400 L sur un fût de 280 → 280', A => {
    poser(A, { manque: 400 }); return A._caveManqueL(cuv(A, 'cuR')) === 280 && A._caveVolL(cuv(A, 'cuR')) === 0; }],
  A6: ['le bois reste le bois : la part des anges se mesure toujours sur 280 L', A => {
    poser(A, { manque: 30 }); return A._caveFutsL(cuv(A, 'cuR')) === 280; }],
  // B — d'où peut venir le vin
  B1: ['la Cuve 7 qui fermente : environ 42,0 hL, 2026, Gevrey-Chambertin', A => {
    poser(A); const s = A._asmSources(cuv(A, 'cuR')).find(x => x.k === 'cuve:c7');
    return s && s.hl === 42 && s.lbl === 'Cuve 7 (Gevrey VV 2026)' && String(s.mil) === '2026' && s.aocs.join() === 'Gevrey-Chambertin'
      && /environ 42 hL dedans|environ 42,0/.test(s.meta.replace(/\u00a0/g, ' ')); }],
  B2: ['ni décuvée, ni terminée, ni fusionnée, ni préparée, ni vide, ni la cuve de la cuvée elle-même', A => {
    poser(A); const k = A._asmSources(cuv(A, 'cuR')).filter(x => x.type === 'cuve').map(x => x.id);
    return k.join() === 'c7'; }],
  B3: ['au Chai : les autres cuvées en élevage — ni elle-même, ni l’embouteillée', A => {
    poser(A); const k = A._asmSources(cuv(A, 'cuR')).filter(x => x.type === 'cuvee').map(x => x.id);
    return k.join() === 'b25,r25'; }],
  B4: ['une cuvée en cuve se puise dans sa cuve (20 hL), une cuvée en fûts dans ses fûts', A => {
    poser(A); const S = A._asmSources(cuv(A, 'cuR'));
    const b = S.find(x => x.id === 'b25'), r = S.find(x => x.id === 'r25');
    return b.futs === false && b.hl === 20 && b.cuveL === 2000 && r.futs === true && Math.abs(r.hl - 4.56) < 1e-9; }],
  // C — compléter depuis une cuve du Cuvier (pas encore décuvée)
  C1: ['30 L de la Cuve 7 : le fût est plein (280 L), la composition est gardée', A => {
    poser(A); completer(A, 'cuve:c7', 30); const c = cuv(A, 'cuR');
    const a = (c.apports || [])[0] || {};
    return A._caveManqueL(c) === 0 && A._caveVolL(c) === 280 && c.apports.length === 1 && a.l === 30
      && a.de === 'Cuve 7 (Gevrey VV 2026)' && String(a.mil) === '2026' && a.aoc === 'Gevrey-Chambertin'; }],
  C2: ['la Cuve 7 porte un prélèvement de 0,3 hL : son contenu passe de 42,0 à 41,7 hL', A => {
    poser(A); const op = completer(A, 'cuve:c7', 30); const p = cve(A, 'c7').operations[0];
    return p.type === 'prelevement' && p.volume_hl === 0.3 && p.asm_id === op.id && p.vers.cuvee_id === 'cuR'
      && A._vendVolContenu(cve(A, 'c7')).hl === 41.7; }],
  C3: ['une opération « assemblage » au Chai, rattachée à la cuvée complétée', A => {
    poser(A); const op = completer(A, 'cuve:c7', 30); const d = op.data || {};
    return op.type === 'assemblage' && op.cuvees_ids.join() === 'cuR' && d.sources.join() === 'Cuve 7 (Gevrey VV 2026)'
      && d.volume_hl === 0.3 && d.litres === 30 && d.de_type === 'cuve' && d.de_id === 'c7' && op.operateur === 'Nico'; }],
  C4: ['les deux magasins sont enregistrés, et l’écran repeint', A => {
    poser(A); completer(A, 'cuve:c7', 30); const s = A.__journal.saves[0] || {};
    return s.cles && s.cles.join() === 'cave_elevage,cave_vendange' && /30.L de Cuve 7/.test(s.msg) && A.__journal.rendu > 0; }],
  C5: ['décuvée ensuite à 40 hL : le rendement de ses parcelles compte 40,3 hL (le prélevé y reste)', A => {
    poser(A); completer(A, 'cuve:c7', 30); const c = cve(A, 'c7');
    c.decuvage = { date: '2026-09-25', cuvee_id: 'z' }; c.vol_decuve_hl = 40; c.vol_decuve_src = 'mesure'; c.statut = 'termine';
    const v = A._vendVolCuve(A.CAVE_VENDANGE.recoltes.find(r => r.id === 'r7')); return v && Math.abs(v.hl - 40.3) < 1e-9; }],
  C6: ['le registre des manipulations : « Assemblage · depuis Cuve 7 (Gevrey VV 2026) · 0,3 hL réunis », sur Ruchottes ’26', A => {
    poser(A); completer(A, 'cuve:c7', 30);
    const l = A._rmLignes(A.CAVE_VENDANGE, A.CAVE_ELEVAGE, null, '2026').lignes.filter(x => x.type === 'assemblage')[0];
    return l && l.lbl === 'Assemblage' && l.contenant === 'Ruchottes \u201926' && String(l.mil) === '2026'
      && /depuis Cuve 7 \(Gevrey VV 2026\)/.test(l.detail) && /0,3 hL r\u00e9unis/.test(l.detail); }],
  C7: ['la cuve source ne va pas au registre une seconde fois (le prélèvement n’y a pas de ligne)', A => {
    poser(A); completer(A, 'cuve:c7', 30);
    return A._rmLignes(A.CAVE_VENDANGE, A.CAVE_ELEVAGE, null, null).lignes.filter(x => x.type === 'prelevement').length === 0; }],
  // D — les refus
  D1: ['plus que ce qui manque : rien ne s’écrit', A => {
    poser(A); A.__etat('cuR', 'cuve:c7', 31); A._asmValider();
    return A.CAVE_ELEVAGE.operations.length === 0 && A._caveManqueL(cuv(A, 'cuR')) === 30 && cve(A, 'c7').operations.length === 0
      && /n\u2019en attend que 30/.test(A.__journal.toasts.join()); }],
  D2: ['plus que la source n’en a : refusé, et rien ne s’écrit', A => {
    poser(A, { manque: 280 }); cuv(A, 'b25').cuves[0].litres = 50;   // Bourgogne 2025 : 50 L dans sa cuve
    A.__etat('cuR', 'cuvee:b25', 100); A._asmValider();
    return /n\u2019a qu\u2019environ 0,5/.test(A.__journal.toasts.join()) && A.CAVE_ELEVAGE.operations.length === 0
      && cuv(A, 'b25').cuves[0].litres === 50; }],
  D3: ['sans source choisie ou sans litres : refusé, avec des mots', A => {
    poser(A); const c = cuv(A, 'cuR');
    return /Choisissez/.test(A._asmRefus(c, null, 10)) && /Indiquez les litres/.test(A._asmRefus(c, A._asmSources(c)[0], 0)); }],
  // E — depuis une cuvée du Chai
  E1: ['Bourgogne 2025 en cuve : sa cuve passe de 2000 à 1970 L — et revient à 2000 au défaire', A => {
    poser(A); const op = completer(A, 'cuvee:b25', 30); const b = cuv(A, 'b25');
    const apres = b.cuves[0].litres; A.deleteCaveOp(op.id);
    return apres === 1970 && b.cuves[0].litres === 2000 && op.data.de_cuve === 'i2'; }],
  E2: ['Ruchottes 2025 en fûts : l’un de ses fûts devient entamé (30 L) — puis plus au défaire', A => {
    poser(A); const op = completer(A, 'cuvee:r25', 30); const r = cuv(A, 'r25');
    const apres = A._caveManqueL(r); A.deleteCaveOp(op.id);
    return apres === 30 && op.data.de_futs === true && A._caveManqueL(r) === 0; }],
  E3: ['depuis le Chai, seul le Chai s’enregistre', A => {
    poser(A); completer(A, 'cuvee:b25', 30); return (A.__journal.saves[0] || {}).cles.join() === 'cave_elevage'; }],
  // F — défaire
  F1: ['supprimer l’assemblage le défait : le fût redevient entamé, le vin retourne à la Cuve 7', A => {
    poser(A); const op = completer(A, 'cuve:c7', 30); A.deleteCaveOp(op.id); const c = cuv(A, 'cuR');
    return A._caveManqueL(c) === 30 && !c.apports && cve(A, 'c7').operations.length === 0
      && A._vendVolContenu(cve(A, 'c7')).hl === 42 && A.CAVE_ELEVAGE.operations.length === 0; }],
  F2: ['la confirmation le dit — bouton « Défaire » —, et les deux magasins partent', A => {
    poser(A); const op = completer(A, 'cuve:c7', 30); A.__journal.saves = []; A.deleteCaveOp(op.id);
    return A.__journal.confirm.t === 'D\u00e9faire cet assemblage ?' && /retourne \u00e0 sa source/.test(A.__journal.confirm.a)
      && A.__journal.confirm.lbl === 'D\u00e9faire'
      && A.__journal.saves[0].cles.join() === 'cave_elevage,cave_vendange'; }],
  F3: ['supprimer une autre opération ne touche à rien d’autre', A => {
    poser(A, { manque: 30 }); A.CAVE_ELEVAGE.operations.push({ id: 'o1', type: 'ouillage', cuvees_ids: ['cuR'] });
    A.deleteCaveOp('o1'); return A._caveManqueL(cuv(A, 'cuR')) === 30 && A.__journal.saves[0].cles.join() === 'cave_elevage'; }],
  // G — la chaîne
  G1: ['le kg/hL de chaque étape : 135 en cuve, 192 entonné (2,50 hL), 200 en bouteilles (320)', A => {
    const s = A._caveBtlGraphSvg({ recolteKg: 480, estHl: 480 / 135, entonneHl: 2.5, entonneSrc: 'mesure' }, 320, 600);
    return s.includes('>135 kg/hL<') && s.includes('>192 kg/hL<') && s.includes('>200 kg/hL<'); }],
  G2: ['un apport de 0,3 hL s’empile (« +40 »), et le kg/hL reste sur le vin de la cuvée (192 ; 199 en bouteilles)', A => {
    const s = A._caveBtlGraphSvg({ recolteKg: 480, estHl: 480 / 135, entonneHl: 2.5, entonneSrc: 'mesure', apportHl: 0.3 }, 360, 600);
    return s.includes('2,5 + 0,3 hL') && /> \+40<\/tspan>/.test(s) && s.includes('>192 kg/hL<') && s.includes('>199 kg/hL<')
      && s.includes('\u221230%') && /dont 0,3 hL apport/.test(s); }],
  G3: ['deux graphes, deux dégradés : un id par dessin (les barres ne disparaissent plus)', A => {
    const ch = { recolteKg: 480, estHl: 480 / 135, entonneHl: 2.5, entonneSrc: 'mesure' };
    const a = A._caveBtlGraphSvg(ch, null, 600), b = A._caveBtlGraphSvg(ch, null, 600);
    const ia = (a.match(/linearGradient id="([^"]+)"/) || [])[1], ib = (b.match(/linearGradient id="([^"]+)"/) || [])[1];
    return ia && ib && ia !== ib && a.includes('url(#' + ia + ')') && b.includes('url(#' + ib + ')'); }],
  G4: ['la chaîne lit les apports de la cuvée', A => {
    poser(A); completer(A, 'cuve:c7', 30); return Math.abs(A._caveBilanChaine(cuv(A, 'cuR')).apportHl - 0.3) < 1e-9; }],
  G5: ['pas de kg/hL sous « Récolte » (des kilos sans hectolitres)', A => {
    const s = A._caveBtlGraphSvg({ recolteKg: 480, estHl: 480 / 135, entonneHl: null, entonneSrc: null }, null, 600);
    return (s.match(/kg\/hL</g) || []).length === 1; }],
  // H — la carte
  H1: ['la carte : « 1 fût entamé · 250 L sur 280 · il attend 30 L », touchable sans ouvrir la fiche', A => {
    poser(A, { manque: 30 }); const h = A._asmCarteHtml(cuv(A, 'cuR'), true);
    return h.includes('1 f\u00fbt entam\u00e9') && h.includes('250\u00a0L sur 280') && h.includes('il attend 30\u00a0L')
      && h.includes('onclick="event.stopPropagation();_asmOuvrir(\'cuR\')"'); }],
  H2: ['en lecture seule : on le voit, on ne le touche pas', A => {
    poser(A, { manque: 30 }); const h = A._asmCarteHtml(cuv(A, 'cuR'), false);
    return h.startsWith('<div class="mvc-creux">') && !h.includes('onclick'); }],
  H3: ['complétée : « dont 30 L de Cuve 7 (Gevrey VV 2026) · 11 % »', A => {
    poser(A); completer(A, 'cuve:c7', 30); const h = A._asmCarteHtml(cuv(A, 'cuR'), true);
    return !h.includes('entam') && h.includes('dont <b>30\u00a0L de Cuve 7 (Gevrey VV 2026)</b> \u00b7 11\u00a0%'); }],
  H4: ['fûts pleins, sans apport, ou embouteillée : la carte ne change pas d’un pixel', A => {
    poser(A, { manque: 0 }); const a = A._asmCarteHtml(cuv(A, 'cuR'), true);
    return a === '' && A._asmCarteHtml(cuv(A, 'emb'), true) === ''; }],
  H5: ['deux fûts dessinés, deux découpes : un id par dessin', A => {
    const a = A._asmFutSvg(50), b = A._asmFutSvg(50);
    return (a.match(/clipPath id="([^"]+)"/) || [])[1] !== (b.match(/clipPath id="([^"]+)"/) || [])[1]; }],
  H6: ['la fiche : le dernier lot porte le fût entamé, et s’ouvre en « Compléter »', (A, S) => {
    const f = code(S.cave, '_caveContenantsSectionHtml');
    return f.includes('mvc-pk mvc-pk-creux') && f.includes("_asmOuvrir(\\''+_escAttr(cuv.id)+'\\')") && f.includes('attend ')
      && f.includes('_caveManqueL(cuv)'); }],
  H7: ['la carte du Chai appelle la carte du fût entamé', (A, S) => code(S.cave, '_caveCuvCardHtml').includes('+_asmCarteHtml(c,w)')],
  // I — côté Cuvier
  I1: ['le prélèvement a un nom et un détail, mais pas de bouton dans la feuille', A => {
    return A._vendOpLbl('prelevement') === 'Pr\u00e9l\u00e8vement'
      && A._vendOpDet({ type: 'prelevement', volume_hl: 0.3, vers: { nom: 'Ruchottes 2026' } }) === '0,3 hL \u2192 Ruchottes 2026'; }],
  I2: ['le prélèvement ne se corrige pas depuis le Cuvier (il se défait au Chai)', (A, S) => {
    const f = code(S.cave, 'openVendOp'); return f.includes("if(op&&op.type==='prelevement')") && !/k:'prelevement'/.test(tableau(S.cave, '_VEND_OPS')); }],
  // J — décuvage et correction
  J1: ['le décuvage écrit le fût entamé quand le volume est mesuré', (A, S) => {
    const f = code(S.cave, 'saveVendDecuvage');
    return avant(f, 'cuvee.manque_l=0;', 'var _vdec=_caveVolL(cuvee)/100;')
      && f.includes('cuvee.manque_l=(_Fl>0)?Math.max(0,Math.min(_Fl,Math.round(_Fl-Math.max(0,_vendDecVolSaisi*100-_Cl)))):0;'); }],
  J2: ['corriger le volume décuvé reporte l’écart sur ce qui manque, et enregistre le Chai', (A, S) => {
    const f = code(S.cave, '_vendDvolCorriger');
    return f.includes("_cu.manque_l=Math.max(0,Math.min(_caveFutsL(_cu),Math.round(parseFloat(_cu.manque_l)-(c.vol_decuve_hl-(v>0?v:0))*100)));")
      && f.includes("_cles.push('cave_elevage');") && f.includes(",'#3D6B27',_cles);"); }],
  // K — les journaux
  K1: ['« Assemblage » au journal, avec son détail', A =>
    A._caveTypeLabel('assemblage') === 'Assemblage'
    && A._caveJDet({ type: 'assemblage', data: { litres: 30, de_nom: 'Cuve 7', vers_nom: 'Ruchottes 2026' } }).includes('30\u00a0L de Cuve 7 \u2192 Ruchottes 2026')],
  K2: ['un assemblage ne se « modifie » pas : il se défait', (A, S) => {
    const j = code(S.cave, 'renderCaveJournal'), fi = code(S.cave, 'openCuveeDetail');
    return j.includes("(op.type!=='assemblage'?'<button onclick=\"window.openOvCaveOp(") && fi.includes("if(op.type!=='assemblage') html+='<button onclick=\"window.openOvCaveOp"); }],
  K3: ['la cuvée où l’on a puisé voit l’assemblage dans sa fiche', (A, S) =>
    code(S.cave, 'openCuveeDetail').includes("(op.type==='assemblage'&&op.data&&op.data.de_type==='cuvee'&&op.data.de_id===cuvId)")],
  // L — l'accompagnement
  L1: ['les gestes de la feuille sont joignables', (A, S) =>
    ['_asmOuvrir', '_asmChoisir', '_asmPas', '_asmSaisie', '_asmValider'].every(n => S.cave.includes('window.' + n + '=' + n + ';'))],
  L2: ['« Quoi de neuf » 7.43 : le fût entamé, le vin réel, le kg/hL', (A, S) =>
    avant(S.utils, "{ v: '7.43', items: [", "{ v: '7.42', items: [") && /f\u00fbt pas plein se compl\u00e8te/i.test(S.utils)
    && S.utils.includes('Le kg/hL de chaque \u00e9tape')],
  L3: ['l’aide, l’info des courbes et le guide le disent', (A, S) =>
    S.utils.includes("['Un f\u00fbt entam\u00e9 se compl\u00e8te'") && S.utils.includes('son <b>kg/hL</b> : les kilos r\u00e9colt\u00e9s')
    && S.utils.includes('<b>kg/hL</b>\\u00a0: les kilos r\\u00e9colt') && S.g08.includes('Compléter un fût entamé')
    && S.g08.includes('son <b>kg/hL</b>')]
};

function jouer(S) {
  const r = {}; let A = null;
  try { A = charger(S); } catch (e) { for (const k in T) r[k] = false; r.__err = e.message; return r; }
  for (const k in T) { try { r[k] = !!T[k][1](A, S); } catch (e) { r[k] = false; r['__' + k] = e.message; } }
  return r;
}
const V = '\x1b[32m', R = '\x1b[31m', Z = '\x1b[0m';
if (!CONTRE) {
  const r = jouer(SAIN); let ok = 0, ko = 0;
  if (r.__err) console.log('  ' + R + 'chargement : ' + r.__err + Z);
  for (const k in T) {
    if (r[k]) { ok++; console.log('  ' + V + '✓' + Z + ' ' + k + ' ' + T[k][0]); }
    else { ko++; console.log('  ' + R + '✗ ' + k + ' ' + T[k][0] + (r['__' + k] ? '  [' + r['__' + k] + ']' : '') + Z); }
  }
  console.log('\nASM-1 + VOL-2 : ' + ok + ' vertes, ' + ko + ' rouges');
  process.exit(ko ? 1 : 0);
}

const MUT = [
  ['_caveVolL', '-_caveManqueL(cuv)', '', 'A1', 'le fût entamé compte plein'],
  ['_caveManqueL', "if(!cv||cv.vol_decuve_src!=='mesure') return 0;", 'if(!cv) return 0;', 'A3', 'un manque deviné sur les contenants'],
  ['_caveManqueL', 'return Math.max(0,Math.min(F,Math.round(m)));', 'return Math.max(0,Math.round(m));', 'A5', 'un manque plus grand que le bois'],
  ['_asmSources', '_vendDecuvee(c)||', '', 'B2', 'une cuve décuvée proposée comme source'],
  ['_asmSources', "x.id===cu.id||", '', 'B3', 'la cuvée se complète avec elle-même'],
  ['_vendSortiesHl', "(o.type==='saignee'||o.type==='prelevement')", "(o.type==='saignee')", 'C2', 'le jus prélevé reste dans la cuve'],
  ['_vendVolCuve', 'vol+=_vendPrelevHl(cv);', '', 'C5', 'le prélevé sort du rendement des parcelles'],
  ['_asmRefus', "if(L>m) return", 'if(false) return', 'D1', 'plus de vin que le fût n’en attend'],
  ['_asmValider', 'sc.cuves[k].litres=Math.max(0,(parseFloat(sc.cuves[k].litres)||0)-L);', '', 'E1', 'la cuve du Chai ne baisse pas'],
  ['_asmDefaire', 'if(cv&&cv.operations) cv.operations=cv.operations.filter(function(o){ return !o||o.asm_id!==op.id; });', '', 'F1', 'le prélèvement survit au défaire'],
  ['_asmDefaire', 'cu.manque_l=_caveManqueL(cu)+L;', '', 'F1', 'le fût reste plein après le défaire'],
  ['deleteCaveOp', 'if(_asm) _asmDefaire(_op);', '', 'F1', 'supprimer n’est plus défaire'],
  ['_caveBtlGraphSvg', "var gid='mvbgd'+(++_CAVE_BTL_GID);", "var gid='mvbgd';", 'G3', 'un seul id de dégradé pour tous les graphes'],
  ['_caveBtlGraphSvg', 'r:kgHl(ch.entonneHl)});', 'r:kgHl(ch.entonneHl+ap)});', 'G2', 'le kg/hL compte l’apport'],
  ['_caveBtlGraphSvg', "v:_mvBtl(kg/_mlKgHl()),va:0,r:null});", "v:_mvBtl(kg/_mlKgHl()),va:0,r:kgHl(kg/_mlKgHl())});", 'G5', 'un kg/hL sous les kilos'],
  ['_asmCarteHtml', 'event.stopPropagation();', '', 'H1', 'toucher le fût ouvre aussi la fiche'],
  ['_asmFutSvg', "id='mvfc'+(++_ASM_GID);", "id='mvfc';", 'H5', 'une seule découpe pour tous les fûts']
];
let det = 0, rouge = 0;
const base = jouer(SAIN);
for (const [nom, ancre, rempl, cle, lib] of MUT) {
  let src; try { const [a, b] = bornes(SAIN.cave, nom); src = SAIN.cave.slice(a, b); }
  catch (e) { rouge++; console.log('  ' + R + '✗ ' + cle + ' fonction introuvable : ' + nom + Z); continue; }
  const n = src.split(ancre).length - 1;
  if (n !== 1) { rouge++; console.log('  ' + R + '✗ ' + cle + ' ancre ' + (n ? 'multiple' : 'absente') + ' dans ' + nom + Z); continue; }
  if (!base[cle]) { rouge++; console.log('  ' + R + '✗ ' + cle + ' déjà rouge sur le code sain' + Z); continue; }
  const S = Object.assign({}, SAIN); S.cave = SAIN.cave.replace(src, src.replace(ancre, rempl));
  let r; try { r = jouer(S); } catch (e) { r = { [cle]: false }; }
  if (!r[cle]) { det++; console.log('  ' + V + '✓' + Z + ' détecté (' + cle + ') : ' + lib); }
  else { rouge++; console.log('  ' + R + '✗ NON détecté (' + cle + ') : ' + lib + Z); }
}
console.log('\nContre-épreuves ASM-1 + VOL-2 : ' + det + ' détectées sur ' + MUT.length);
process.exit(rouge ? 1 : 0);
