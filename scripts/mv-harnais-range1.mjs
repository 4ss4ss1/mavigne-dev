// HARNAIS — RANGE-1 (§335) : Le millésime rangé — une tête, quatre vues, la chaîne de chaque cuvée (ex-CHAINE-1).
//   node scripts/mv-harnais-range1.mjs           → doit être vert
//   node scripts/mv-harnais-range1.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue les VRAIES fonctions de la Cave (cave.js + cuvier.js réunis) sur un domaine fabriqué : cinq cuves en 2026
// (trois décuvées, dont une sans volume mesuré et une complétée par un apport ; deux encore en cuve, dont une qui a
// versé du vin), une récolte sans cuve, du raisin vendu (fiche d'avant les parts et part client) ; un 2025 avec une
// cuvée en bouteille et une sans chaîne ; un 2024 sans récolte au Cuvier ; un 2023 au nom piégé ; un 2022 vide.
// Bouchons (dits ici, pas cachés) : les tuiles, le rendement par parcelle et ce qui reste sur pied sont fournis
// tels quels — leurs propres harnais (cave-mil, rdtmil) les jouent ; les quatre cartes des courbes sont des marques.
import vm from 'node:vm';
import fs from 'node:fs';
import { lireCave } from './mv-cave-src.mjs';

const CONTRE = process.argv.includes('--contre');
const SAIN = { cave: lireCave() };
// ★ HLHA-1 (§413) : la fiche et la vue Parcelles écrivent des surfaces par les deux formateurs de utils.js (KIT-4).
const FORMATEURS = (() => {
  const m = fs.readFileSync('src/utils.js', 'utf8').match(/function _mvHaNum\(x\)\{[^\n]*\n(window\._mvHaP=[^\n]*\n)(window\._mvHaT=[^\n]*\n)/);
  if (!m) throw new Error('formateurs de surface introuvables dans utils.js');
  return m[0];
})();

function bornes(src, nom) {
  const re = new RegExp('^(?:export )?function ' + nom + '\\s*\\(', 'gm');
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
const fn = (src, nom) => { const [a, b] = bornes(src, nom); return src.slice(a, b); };
function tableau(src, nom) {
  const m = new RegExp('^var ' + nom + '\\s*=\\s*\\[', 'm').exec(src);
  if (!m) throw new Error('table absente : ' + nom);
  let d = 0, q = null;
  for (let j = src.indexOf('[', m.index); j < src.length; j++) {
    const ch = src[j];
    if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
    if (ch === "'" || ch === '"') { q = ch; continue; }
    if (ch === '[') d++; else if (ch === ']' && --d === 0) return src.slice(m.index, j + 1) + ';';
  }
  throw new Error('table non fermée : ' + nom);
}
function objet(src, nom) {
  const m = new RegExp('^var ' + nom + '\\s*=\\s*\\{', 'm').exec(src);
  if (!m) throw new Error('table absente : ' + nom);
  let d = 0, q = null;
  for (let j = src.indexOf('{', m.index); j < src.length; j++) {
    const ch = src[j];
    if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
    if (ch === "'" || ch === '"') { q = ch; continue; }
    if (ch === '{') d++; else if (ch === '}' && --d === 0) return src.slice(m.index, j + 1) + ';';
  }
  throw new Error('table non fermée : ' + nom);
}
function scalaire(src, nom) {
  const m = new RegExp('^var ' + nom + '\\s*=\\s*[0-9.]+;', 'm').exec(src);
  if (!m) throw new Error('variable absente : ' + nom);
  return m[0];
}
const NC = ['_vendCfg', '_vendPckLegacy', '_vendParts', '_vpPck', '_vpCs', '_vpKg', '_recKg', '_recKgDom',
  '_vendSortiesHl', '_vendPrelevHl', '_vendHlKg', '_mvBtl', '_mvF1', '_mlKgHl', '_caveCuveSource', '_caveBilanChaine',
  '_caveNbTonneaux', '_mlRecoltesDe', '_mlMilActif', '_mlMillesimes', '_pcavHasW', '_pcavLog',
  '_pcrbCvEnt', '_pcrbCvNomCuve', '_pcrbCvNomVend', '_pcrbCvParcs', '_pcrbCvParcTxt', '_pcrbCvSous', '_pcrbCvVente',
  '_pcrbCvChaineCuve', '_pcrbCvPleines', '_pcrbCvLignes', '_pcrbCvCellules', '_pcrbCvCelHtml',
  '_mlJourCourt', '_mlJours', '_mlDatesRec', '_mlEtat', '_mlHead', '_mlCuvInfo', '_mlBlocCuvees', '_mlBlocVeille',
  '_mlBlocReperes', '_mlRenderParc', '_mlCuvFicheHtml', '_mlRenderCuv', '_pcavVueCourbes',
  // ★ HLHA-1 (§413) : le hL/ha des cuvées et le rendement par appellation (vraies fonctions, comme le reste)
  '_mlCuvSurf', '_mlAocRdt', '_mlAocHtml', '_parcCoul', '_matNorm', '_vendAocNorm', '_vendAocList', '_vendAocDe', '_vendAocMax'];
const PRELUDE = `
var __logs = [], __adm = true, __ecrit = true, __RD = {}, __RESTE = {};
var __SURF = {'Vieilles Vignes':0.62,'Champ de la Croix':0.62,'Les Perri\\u00e8res':1.1,'Clos du Moulin':0.45,'Les Charmes':1.4,'La Combotte':1.5,'Aux Murgers':0.5,'En Bertrange':0.85,'En Jouise':0.3};
var window = { logError: function(e){ __logs.push(e); } };
var CAVE_VENDANGE = { config: {}, recoltes: [], cuves_vinif: [], cuvees: [] };
var CAVE_ELEVAGE = { cuvees: [] };
window.CAVE_VENDANGE = CAVE_VENDANGE; window.CAVE_ELEVAGE = CAVE_ELEVAGE;
var _mlMil = null, _mlParcF = 'tout', _mlCuvSel = null, _mlCuvFiche = false, _pcrbVue = 'dens', _PCRB_ELEV = null;
function _mlCampagne(){ return 2026; }
function _vendClient(){ return null; }
function canWrite(){ return __ecrit; }
function isAdmin(){ return __adm; }
function _escHtml(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function _escAttr(s){ return _escHtml(s); }
function _mvIcon(n){ return '<i data-ic="'+n+'"></i>'; }
function _mlTuiles(ch){ return '<i class="TUILES"></i>'; }
function _mlRendements(mil){ return (__RD[String(mil)]||[]).slice(); }
function _mlResteARentrer(mil){ return (__RESTE[String(mil)]||[]).slice(); }
function _mlRdtDetail(){ return ''; }
function _mlRdtCss(){}
function _vendParcByName(n){ return (__SURF[n]!=null)?{nom:n,surface:String(__SURF[n])}:null; }
function _pcrbSeries(){}
function _pcrbMat(){ return '<i class="C-MAT"></i>'; }
function _pcrbDens(){ return '<i class="C-DENS"></i>'; }
function _pcrbTemp(){ return '<i class="C-TEMP"></i>'; }
function _pcrbElev(c){ return '<i class="C-ELEV"></i>'; }
function __poser(v, e){
  CAVE_VENDANGE.config = v.config || {}; CAVE_VENDANGE.recoltes = v.recoltes || [];
  CAVE_VENDANGE.cuves_vinif = v.cuves_vinif || []; CAVE_VENDANGE.cuvees = v.cuvees || [];
  CAVE_ELEVAGE.cuvees = (e && e.cuvees) || []; __logs.length = 0;
}
function __mil(m){ _mlMil = m; }
function __droit(b){ __ecrit = !!b; }
function __parc(f){ _mlParcF = f; }
function __cuv(k, f){ _mlCuvSel = k; _mlCuvFiche = !!f; }
function __vue(k){ _pcrbVue = k; }
function __rd(o){ __RD = o || {}; }
function __reste(o){ __RESTE = o || {}; }
`;
function charger(S) {
  const corps = PRELUDE + FORMATEURS + objet(S.cave, '_MV_CEP_COUL') + '\n' + scalaire(S.cave, 'MV_CV_ZONE') + '\n' + scalaire(S.cave, 'MV_CV_FICHE') + '\n'
    + tableau(S.cave, '_PCRB_CV_GR') + '\n' + tableau(S.cave, '_ML_MOIS') + '\n'
    + NC.map(n => fn(S.cave, n)).join('\n')
    + '\nwindow._caveBilanChaine = _caveBilanChaine; window._vendDvolCorriger = function(){};'
    + '\nwindow.openCuveeDetail = function(){}; window.selectCaveSection = function(){};'
    + '\nwindow._mvInfoBtn = function(k){ return \'<i data-info="\'+k+\'"></i>\'; };'
    + '\n;({' + NC.join(',') + ', MV_CV_ZONE, MV_CV_FICHE, window, __poser, __mil, __droit, __parc, __cuv, __vue, __rd, __reste, __logs})';
  return vm.runInNewContext(corps, {});
}

/* ══ LE DOMAINE ══ */
const P = (c, cl) => cl ? { dom: false, client: cl, caisses: c, pck: 25 } : { dom: true, caisses: c, pck: 25 };
const REC = (id, parcelle, date, cuve_id, parts) => ({ id, parcelle, date, cuve_id, parts });
function domaine(extra) {
  const v = {
    config: { poids_caisse_kg: 25, ratio_min: 130, ratio_max: 140 },
    cuves_vinif: [
      { id: 'cv2', nom: 'Cuve 2 \u2014 inox 50 hL', decuvage: { date: '2026-10-02', cuvee_id: 'cu2' }, vol_decuve_hl: 36.5, vol_decuve_src: 'mesure', operations: [] },
      { id: 'cv3', nom: 'Cuve 3 \u2014 inox 120 hL', cuvee_src: 'Charmes-Combotte 2026', decuvage: null, operations: [] },
      { id: 'cv4', nom: 'Cuve 4 \u2014 bois 30 hL', decuvage: { date: '2026-10-05', cuvee_id: 'cu4' }, vol_decuve_hl: 16, vol_decuve_src: 'contenants', operations: [] },
      { id: 'cv5', nom: 'Cuve 5 \u2014 bois 30 hL', cuvee_src: 'Aux Murgers 2026', decuvage: null, operations: [{ type: 'prelevement', volume_hl: 1.2 }] },
      { id: 'cv7', nom: 'Cuve 7 \u2014 inox 60 hL', decuvage: { date: '2026-10-01', cuvee_id: 'cu7' }, vol_decuve_hl: 50, vol_decuve_src: 'mesure', operations: [] },
      { id: 'cv7b', nom: 'Cuve 7 \u2014 inox 60 hL', decuvage: { date: '2025-10-03', cuvee_id: 'cuG25' }, vol_decuve_hl: 55.2, vol_decuve_src: 'mesure', operations: [] },
      { id: 'cv3b', nom: 'Cuve 3 \u2014 inox 120 hL', decuvage: { date: '2025-10-01', cuvee_id: 'cuB25' }, vol_decuve_hl: 89, vol_decuve_src: 'mesure', operations: [] }
    ],
    recoltes: [
      REC('r1', 'Vieilles Vignes', '2026-09-20', 'cv7', [P(150)]),
      REC('r2', 'Champ de la Croix', '2026-09-21', 'cv7', [P(124)]),
      REC('r3', 'Les Perri\u00e8res', '2026-09-22', 'cv2', [P(210)]),
      REC('r4', 'Clos du Moulin', '2026-09-23', 'cv4', [P(92)]),
      REC('r5', 'Les Charmes', '2026-09-24', 'cv3', [P(272), P(40, 'N\u00e9goce Lambert')]),
      REC('r6', 'La Combotte', '2026-09-25', 'cv3', [P(310)]),
      REC('r7', 'Aux Murgers', '2026-09-26', 'cv5', [P(100)]),
      { id: 'r8', parcelle: 'En Bertrange', date: '2026-09-27', cuve_id: null, vendu: true, client: 'Maison Ducret', nb_caisses: 180 },
      REC('r9', 'En Jouise', '2026-09-28', null, [P(20)]),
      REC('rG1', 'Vieilles Vignes', '2025-09-18', 'cv7b', [P(160)]),
      REC('rG2', 'Champ de la Croix', '2025-09-18', 'cv7b', [P(156)]),
      REC('rB1', 'Les Charmes', '2025-09-15', 'cv3b', [P(512)])
    ]
  };
  const e = { cuvees: [
    { id: 'cu7', nom: 'Vieilles Vignes', millesime: 2026, statut: 'elevage', tonneaux: [{ annee: 2026, nb: 22 }] },
    { id: 'cu2', nom: 'Les Perri\u00e8res', millesime: 2026, statut: 'elevage', apports: [{ l: 120 }], tonneaux: [{ annee: 2026, nb: 16 }] },
    { id: 'cu4', nom: 'Clos du Moulin', millesime: 2026, statut: 'elevage', tonneaux: [{ annee: 2026, nb: 7 }] },
    { id: 'cuG25', nom: 'Gevrey-Chambertin VV', millesime: 2025, statut: 'elevage', tonneaux: [{ annee: 2025, nb: 24 }] },
    { id: 'cuB25', nom: 'Bourgogne Pinot Noir', millesime: 2025, statut: 'embouteille', nb_bouteilles: 11420, date_embouteillage: '2026-09-18' },
    { id: 'cuF25', nom: 'Fixin 1er Cru', millesime: 2025, statut: 'elevage', tonneaux: [{ annee: 2025, nb: 8 }] },
    { id: 'cuB24', nom: 'Bourgogne Pinot Noir', millesime: 2024, statut: 'embouteille', nb_bouteilles: 10650 },
    { id: 'cuX', nom: '<img src=x onerror=alert(1)>', millesime: 2023, statut: 'elevage', tonneaux: [{ annee: 2023, nb: 1 }] }
  ] };
  if (extra) extra(v, e);
  return { v, e };
}
const RD26 = [
  { parcelle: { nom: 'Les Perri\u00e8res', surface: '1.1' }, kg: 5250, caisses: 210, hlHa: 33.2, statut: 'mesure', max: 40, pct: 83, depasse: false, vendu: false, maxSrc: 'aoc', maxAoc: 'Gevrey-Chambertin' },
  { parcelle: { nom: 'Vieilles Vignes', surface: '0.62' }, kg: 3750, caisses: 150, hlHa: 44.2, statut: 'mesure', max: 40, pct: 111, depasse: true, vendu: false, maxSrc: 'aoc', maxAoc: 'Gevrey-Chambertin' },
  { parcelle: { nom: 'En Bertrange', surface: '0.85' }, kg: 4500, caisses: 180, hlHa: 39.2, hlMin: 37.8, hlMax: 40.7, statut: 'estime', max: 40, pct: 98, depasse: false, vendu: true, maxSrc: 'aoc', maxAoc: 'Gevrey-Chambertin' }
];
const sp = s => String(s == null ? '' : s).replace(/[\u202f\u00a0]/g, ' ');
const G = (d, cle) => d.groupes.find(g => g.cle === cle).lignes;
const L = (d, nom) => { for (const g of d.groupes) for (const l of g.lignes) if (l.nom === nom) return l; return null; };
const GL = (d, nom) => { for (const g of d.groupes) for (const l of g.lignes) if (l.nom === nom) return [g, l]; return null; };
const noms = (d, cle) => G(d, cle).map(l => l.nom).join('|');
const tous = d => d.groupes.flatMap(g => g.lignes.map(l => l.nom));
const nb = (s, re) => (sp(s).match(re) || []).length;
function avec(A, extra) { const D = domaine(extra); A.__poser(D.v, D.e); A.__rd({ '2026': RD26 }); A.__reste({}); A.__droit(true); A.__mil(2026); A.__parc('tout'); A.__cuv(null, false); A.__vue('dens'); return A; }

const T = {
  A1: ['2026 : une ligne par cuve, rangée par étape — les cuves pas encore décuvées comprises', A => {
    const d = avec(A)._pcrbCvLignes(2026);
    return noms(d, 'elev') === 'Clos du Moulin|Les Perri\u00e8res|Vieilles Vignes' && noms(d, 'cuve') === 'Aux Murgers|Charmes-Combotte'
      && noms(d, 'btl') === '' && d.nCuves === 5 && A.__logs.length === 0; }],
  A2: ['chaque parcelle récoltée est là, une fois : le raisin vendu (fiche d’avant les parts et part client), la récolte sans cuve', A => {
    const d = avec(A)._pcrbCvLignes(2026), v = G(d, 'vente'), s = G(d, 'sans');
    return d.nParc === 9 && d.nVend === 2 && v.length === 2 && v[0].nom === 'En Bertrange' && v[0].sous === 'Maison Ducret'
      && sp(v[0].droite) === '4 500 kg' && v[1].nom === 'Les Charmes' && sp(v[1].droite) === '1 000 kg'
      && s.length === 1 && s[0].nom === 'En Jouise' && sp(s[0].droite) === '500 kg'
      && sp(L(d, 'Charmes-Combotte').cells[0].val) === '14 550 kg'; }],
  A3: ['le millésime choisi, lui seul : 2025 ne déborde pas sur 2026, ni l’inverse', A => {
    avec(A); const n6 = tous(A._pcrbCvLignes(2026)), d5 = A._pcrbCvLignes(2025), n5 = tous(d5);
    return !n6.includes('Gevrey-Chambertin VV') && !n6.includes('Bourgogne Pinot Noir') && n5.includes('Gevrey-Chambertin VV')
      && n5.includes('Bourgogne Pinot Noir') && !n5.includes('Vieilles Vignes') && d5.nParc === 3 && d5.nCuves === 2; }],
  A4: ['décuvée sans volume mesuré : « à mesurer », et la fiche propose la saisie à qui peut écrire, seulement', A => {
    avec(A); const d = A._pcrbCvLignes(2026), [g, l] = GL(d, 'Clos du Moulin');
    const oui = A._mlCuvFicheHtml(g, l); A.__droit(false); const non = A._mlCuvFicheHtml(g, l);
    return l.cells[2].att === true && l.cells[2].val === '\u00e0 mesurer' && l.saisir === true
      && oui.includes("_vendDvolCorriger('cv4')") && !non.includes('_vendDvolCorriger('); }],
  A5: ['l’apport d’une autre cuve s’empile à part : ni dans le kg/hL, ni dans la perte', A => {
    const c = L(avec(A)._pcrbCvLignes(2026), 'Les Perri\u00e8res').cells[2];
    return sp(c.val) === '36,5 hL' && sp(c.sous) === '144 kg/hL' && sp(c.sous2) === '+1,2 hL apport' && c.apH > 0 && sp(c.perte) === '\u22126 %'; }],
  A6: ['le vin versé à une autre cuve sort de « En cuve », et la ligne le dit', A => {
    const l = L(avec(A)._pcrbCvLignes(2026), 'Aux Murgers');
    return sp(l.cells[1].val) === '17,3 hL' && sp(l.cells[1].sous) === '1,2 hL vers\u00e9s' && sp(l.cells[1].perte) === '\u22126 %' && l.cells[2].att === false; }],
  A7: ['une cuvée en bouteille : les quatre étapes, la perte des bouteilles et leur kg/hL', A => {
    const l = L(avec(A)._pcrbCvLignes(2025), 'Bourgogne Pinot Noir');
    return l.cells.every(c => !c.vide) && sp(l.cells[3].val) === '11 420' && sp(l.cells[3].perte) === '\u22124 %' && sp(l.cells[3].sous) === '149 kg/hL'; }],
  A8: ['une cuvée sans récolte ni cuve au Cuvier : une ligne simple, pas des cases vides', A => {
    const l = L(avec(A)._pcrbCvLignes(2025), 'Fixin 1er Cru');
    return l.simple === true && !l.cells && /^Pas de cha\u00eene\u00a0: ni r\u00e9colte ni cuve au Cuvier \u00b7 8 f\u00fbts$/.test(l.sous); }],
  A9: ['mêmes étapes que le Chai, et des barres en px : 44 sur la ligne, 96 dans la fiche', A => {
    avec(A); const ch = A._caveBilanChaine({ id: 'cu7', nom: 'Vieilles Vignes', millesime: 2026, statut: 'elevage' });
    const l = L(A._pcrbCvLignes(2026), 'Vieilles Vignes'), f = A._pcrbCvCellules(ch, 0, 0, false, A.MV_CV_FICHE);
    return sp(l.cells[1].val) === A._mvF1(ch.estHl) + ' hL' && l.cells[0].h === A.MV_CV_ZONE && f[0].h === A.MV_CV_FICHE
      && sp(l.cells[2].perte) === '\u22121 %' && sp(l.cells[2].sous) === '137 kg/hL'; }],
  A10: ['deux cuves décuvées dans une même cuvée : la cuvée une fois, la seconde cuve avec ses propres étapes', A => {
    avec(A, v => { v.cuves_vinif.push({ id: 'cv8', nom: 'Cuve 8 \u2014 inox 10 hL', decuvage: { date: '2026-10-03', cuvee_id: 'cu7' }, vol_decuve_hl: 5, vol_decuve_src: 'mesure', operations: [] });
      v.recoltes.push(REC('r10', 'Vieilles Vignes', '2026-09-29', 'cv8', [P(28)])); });
    const d = A._pcrbCvLignes(2026), n = tous(d);
    return n.filter(x => x === 'Vieilles Vignes').length === 1 && n.includes('Cuve 8') && d.nCuves === 6; }],
  B1: ['la tête : l’année, son état, les vendanges, les cuves décuvées, le choix du millésime et les tuiles', A => {
    avec(A); const h = A._mlHead(2026, {}, A._pcrbCvLignes(2026));
    return h.includes('<div class="mlh-an">2026</div>') && h.includes('<span class="mlh-pill">En cours</span>')
      && sp(h).includes('Vendanges du 20 au 28 sept. \u00b7 3 cuves d\u00e9cuv\u00e9es sur 5')
      && h.includes('class="mlh-b on" aria-pressed="true" onclick="_mlSetMil(2026)"') && h.includes('onclick="_mlSetMil(2025)"')
      && h.includes('class="TUILES"'); }],
  B2: ['« À surveiller » : le volume à mesurer, la parcelle au-dessus du maximum, les cuves en fermentation', A => {
    avec(A); const d = A._pcrbCvLignes(2026), h = A._mlBlocVeille(2026, d); A.__droit(false); const h2 = A._mlBlocVeille(2026, d);
    return h.includes('<span class="mlv-n">3</span>') && h.includes("_vendDvolCorriger('cv4')") && sp(h).includes('D\u00e9cuv\u00e9e le 5 oct.')
      && sp(h).includes('44,2 hL/ha mesur\u00e9s, au-dessus du maximum de l\u2019appellation (40).') && h.includes("_mlSetParcF('dessus')")
      && h.includes('2 cuves en fermentation') && h.includes('Aux Murgers, Charmes-Combotte.') && h.includes('Tout est rentr\u00e9')
      && !h2.includes('_vendDvolCorriger(') && h2.includes("_mlSetCuv('cv:cv4')"); }],
  B3: ['les repères : premières et dernière récoltes, les décuvages dans l’ordre, aujourd’hui', A => {
    avec(A); const h = sp(A._mlBlocReperes(2026, A._pcrbCvLignes(2026)));
    const i = s => h.indexOf(s);
    return i('20 sept.') >= 0 && i('Premi\u00e8res r\u00e9coltes') >= 0 && i('Derni\u00e8re r\u00e9colte \u2014 9 parcelles') >= 0
      && i('D\u00e9cuvage \u2014 Cuve 7') < i('D\u00e9cuvage \u2014 Cuve 2') && i('D\u00e9cuvage \u2014 Cuve 2') < i('D\u00e9cuvage \u2014 Cuve 4')
      && i('D\u00e9cuvage \u2014 Cuve 7') > i('Derni\u00e8re r\u00e9colte') && h.includes('class="now"') && h.includes('2 cuves en fermentation'); }],
  B4: ['Parcelles : triées du plus haut au plus bas, filtres au-dessus / vendues / sur pied, fourchette tant que rien n’est mesuré', A => {
    avec(A); const t = A._mlRenderParc();
    A.__parc('dessus'); const d = A._mlRenderParc(); A.__parc('vendu'); const v = A._mlRenderParc();
    A.__reste({ '2026': [{ nom: 'En Jouise', surface: '0.3' }] }); A.__parc('pied'); const p = A._mlRenderParc();
    const o = s => t.indexOf(s);
    return o('<b>Vieilles Vignes</b>') < o('<b>En Bertrange</b>') && o('<b>En Bertrange</b>') < o('<b>Les Perri\u00e8res</b>')
      && t.includes("onclick=\"_mlSetRdtMax('Vieilles Vignes',2026)\"") && t.includes('class="mlp-l over"') && sp(t).includes('37,8\u201340,7')
      && sp(t).includes('\u2248 98 %') && nb(t, /class="mlx-chip[ "]/g) === 4 && t.includes('class="mlp-h"')
      && nb(d, /class="mlp-l/g) === 1 && d.includes('Vieilles Vignes') && nb(v, /class="mlp-l/g) === 1 && v.includes('En Bertrange')
      && p.includes('En Jouise') && p.includes('encore sur pied') && !p.includes('_mlSetRdtMax'); }],
  B5: ['Cuvées : la liste, la première chaîne ouverte par défaut, la cuvée choisie marquée, les lignes simples sans bouton', A => {
    avec(A); const d = A._pcrbCvLignes(2026), h1 = A._mlRenderCuv(d); A.__cuv('cv:cv2', true); const h2 = A._mlRenderCuv(d);
    return h1.startsWith('<div class="mlc">') && h1.includes('<h3>Clos du Moulin</h3>') && h2.startsWith('<div class="mlc fiche">')
      && h2.includes('<h3>Les Perri\u00e8res</h3>') && h2.includes('class="mlc-l on" aria-pressed="true" onclick="_mlSetCuv(\'cv:cv2\')"')
      && h2.includes('<div class="mlc-l s"><span class="mlg-cn"><b>En Bertrange</b>') && nb(h2, /onclick="_mlSetCuv\(/g) === 5; }],
  B6: ['la fiche : d’où vient la cuvée (kilos du domaine), ses dates, ses contenants, le bon bouton', A => {
    avec(A); const d = A._pcrbCvLignes(2026), [g, l] = GL(d, 'Charmes-Combotte'), [g4, l4] = GL(d, 'Clos du Moulin');
    const h = sp(A._mlCuvFicheHtml(g, l)), h4 = sp(A._mlCuvFicheHtml(g4, l4));
    return h.includes('<b>Les Charmes</b><span>1,4 ha</span><span class="k">6 800 kg</span>') && h.includes('<b>La Combotte</b><span>1,5 ha</span><span class="k">7 750 kg</span>')
      && /Encuv\u00e9e le 24 sept\., \d+e jour en cuve/.test(h) && h.includes("selectCaveSection('vendange')") && !h.includes('openCuveeDetail(')
      && h4.includes('Encuv\u00e9e le 23 sept., d\u00e9cuv\u00e9e le 5 oct.') && h4.includes('7 f\u00fbts au Chai') && h4.includes("openCuveeDetail('cu4')")
      && h4.includes('data-info="cave.cuvees"') && nb(h4, /class="pcrb-cv-c"/g) === 4; }],
  B7: ['Ensemble : les cuvées en un coup d’œil, chacune vers sa fiche', A => {
    avec(A); const h = sp(A._mlBlocCuvees(A._pcrbCvLignes(2026)));
    return nb(h, /class="mlg-cl"/g) === 5 && h.includes("onclick=\"_mlSetTab('cuv')\"") && h.includes("_mlSetCuv('cv:cv4')")
      && h.includes('<span class="mlg-cf att">\u00e0 mesurer</span>') && h.includes('50 hL entonn\u00e9s') && h.includes('107,8 hL en cuve')
      && nb(h, /class="mlc-d fait"/g) >= 9; }],
  B8: ['Courbes : quatre cartes en grille, une à la fois au téléphone, plus de chaîne ; le millésime passé le dit', A => {
    avec(A); const h = A._pcavVueCourbes({}); A.__mil(2025); A.__vue('matu'); const h2 = A._pcavVueCourbes({});
    return h.includes('<div class="pcrb-grille" data-vue="dens">') && ['matu', 'dens', 'temp', 'elev'].every(k => h.includes('data-k="' + k + '"'))
      && h.includes("onclick=\"_pcrbSetVue('matu')\"") && !h.includes('pcrb-mil') && !/cha\\u00eene|pcrb-cv/.test(h)
      && h2.includes('data-vue="matu"') && h2.includes('celles de 2026'); }],
  B9: ['les noms sont échappés, la liste comme la tête', A => {
    avec(A); A.__mil(2023); const d = A._pcrbCvLignes(2023), h = A._mlRenderCuv(d);
    return h.includes('&lt;img src=x onerror=alert(1)&gt;') && !h.includes('<img src=x') && h.includes('Aucune cha\u00eene \u00e0 d\u00e9tailler'); }],
  B10: ['un millésime vide : chaque vue le dit, sans planter', A => {
    avec(A); A.__mil(2022); const c = A._mlRenderCuv(A._pcrbCvLignes(2022)), p = A._mlRenderParc();
    return c.includes('Aucune cuv\u00e9e pour 2022') && p.includes('Aucune parcelle r\u00e9colt\u00e9e pour 2022') && A.__logs.length === 0; }],
  B11: ['le câblage : la tête sur les quatre vues, quatre onglets, les fonctions exposées, les grilles à partir de 1 024 px', (A, S) => {
    const r = fn(S.cave, 'renderCaveMillesime'), st = fn(S.cave, '_mlSetTab');
    return /\['vie','parc','cuv','crb'\]\.forEach/.test(r) && /hd\.innerHTML=ch\?_mlHead\(mil,ch,d\)/.test(r) && /_mlTab==='crb'\)\{[\s\S]{0,400}_pcrbPose\(\)/.test(r)
      && /_mlRenderParc\(\)/.test(r) && /_mlRenderCuv\(d\)/.test(r) && /t==='parc'\|\|t==='cuv'/.test(st)
      && ['_mlSetCuv', '_mlCuvRetour', '_mlSetParcF', '_pcrbSetVue'].every(n => new RegExp('window\\.' + n + '\\s*=\\s*' + n + ';').test(S.cave))
      && /@media \(min-width:1024px\)\{'[\s\S]{0,200}\.mlg\{display:grid/.test(S.cave) && /\.pcrb-grille\{display:grid/.test(S.cave) && /\.mlc\{display:grid/.test(S.cave)
      && !/function _pcrbChaine\(|_PCRB_CH|pcrb-g-chain/.test(S.cave); }]
};

function jouer(S) {
  const r = {};
  let A = null;
  try { A = charger(S); } catch (e) { for (const k in T) r[k] = false; r.__err = e.message; return r; }
  for (const k in T) { try { r[k] = !!T[k][1](A, S); } catch (e) { r[k] = false; r['__' + k] = e.message; } }
  return r;
}
const V = '\x1b[32m', R = '\x1b[31m', Z = '\x1b[0m';
if (!CONTRE) {
  const r = jouer(SAIN); let ok = 0, ko = 0;
  if (r.__err) console.log('  ' + R + 'chargement : ' + r.__err + Z);
  for (const k in T) { if (r[k]) { ok++; console.log('  ' + V + '✓' + Z + ' ' + k + ' ' + T[k][0]); }
    else { ko++; console.log('  ' + R + '✗ ' + k + ' ' + T[k][0] + (r['__' + k] ? ' — ' + r['__' + k] : '') + Z); } }
  console.log('\nRANGE-1 : ' + ok + ' vertes, ' + ko + ' rouges');
  process.exit(ko ? 1 : 0);
}
const MUT = [
  ['_pcrbCvLignes', 'if(!cu||String(cu.millesime)!==M||vuCuvee[cu.id]) return;', 'if(!cu||vuCuvee[cu.id]) return;', 'A3', 'les cuvées d’un autre millésime entrent'],
  ['_pcrbCvLignes', 'var M=String(mil), recs=_mlRecoltesDe(M);', 'var M=String(mil), recs=(CAVE_VENDANGE.recoltes||[]);', 'A3', 'les récoltes de tous les millésimes'],
  ['_pcrbCvLignes', 'try{ ch=cu?_caveBilanChaine(cu):_pcrbCvChaineCuve(cv); }', 'if(!cu) return; try{ ch=_caveBilanChaine(cu); }', 'A1', 'les cuves pas encore décuvées disparaissent (l’ancienne carte)'],
  ['_pcrbCvLignes', 'if(vt.kg>0){', 'if(false){', 'A2', 'le raisin vendu disparaît'],
  ['_pcrbCvLignes', 'if(cu&&vuCuvee[cu.id]) cu=null;', '', 'A10', 'deux cuves dans une cuvée : la cuvée compte deux fois'],
  ['_pcrbCvCellules', "var ent=(ch.entonneHl!=null&&ch.entonneSrc==='mesure');", 'var ent=(ch.entonneHl!=null);', 'A4', 'la taille des fûts redevient l’entonné'],
  ['_pcrbCvCellules', 'sous:kgHl(ch.entonneHl), k:true', 'sous:kgHl(ch.entonneHl+ap), k:true', 'A5', 'l’apport entre dans le kg/hL'],
  ['_pcrbCvChaineCuve', 'Math.max(0,_vendHlKg(kg)-_vendSortiesHl(cv))', 'Math.max(0,_vendHlKg(kg))', 'A6', 'le vin versé reste dans la cuve'],
  ['_pcrbCvCellules', 'var haut=function(v){ return Math.max(3,Math.round(v/max*Z)); };', 'var haut=function(v){ return Math.max(3,Math.round(v/max*100)); };', 'A9', 'les barres repassent en pourcentage'],
  ['_mlCuvFicheHtml', 'if(l.saisir&&ecrit) h+=', 'if(l.saisir) h+=', 'A4', 'la saisie proposée sans droit d’écriture'],
  ['_mlHead', "try{ h+=_mlTuiles(ch); }catch(e){ _pcavLog('tuiles',e); }", '', 'B1', 'la tête perd ses tuiles'],
  ['_mlBlocVeille', 'if(!l.saisir) return;', 'return;', 'B2', '« À surveiller » oublie le volume à mesurer'],
  ['_mlBlocReperes', 'ev.sort(function(a,b){ return a[0]<b[0]?-1:(a[0]>b[0]?1:0); });', '', 'B3', 'les repères dans le désordre'],
  ['_mlRenderParc', 'L.sort(function(a,b){ return (b.hlHa||0)-(a.hlHa||0); });', 'L.sort(function(a,b){ return (a.hlHa||0)-(b.hlHa||0); });', 'B4', 'les parcelles du plus bas au plus haut'],
  ['_mlRenderParc', "return F==='dessus'?r.depasse:(F==='vendu'?r.vendu:true);", 'return true;', 'B4', 'les filtres ne filtrent plus'],
  ['_mlRenderCuv', 'if(l.cle===_mlCuvSel) sel={g:g,l:l};', '', 'B5', 'la cuvée choisie n’est pas ouverte'],
  ['_mlCuvFicheHtml', 'par[n]+=_recKgDom(r);', 'par[n]+=_recKg(r);', 'B6', 'l’origine compte le raisin vendu'],
  ['_pcavVueCourbes', "'</div><div class=\"pcrb-grille\" data-vue=\"'+v+'\">'", "'</div><div class=\"pcrb-grille\">'", 'B8', 'la grille ne sait plus quelle courbe montrer au téléphone'],
  ['_mlRenderCuv', "h+='<div class=\"mlc-l s\"><span class=\"mlg-cn\"><b>'+_escHtml(l.nom)+'</b>", "h+='<div class=\"mlc-l s\"><span class=\"mlg-cn\"><b>'+l.nom+'</b>", 'B9', 'un nom de cuvée n’est plus échappé']
];
const base = jouer(SAIN);
let det = 0, rouge = 0;
for (const [nom, ancre, rempl, cle, lib] of MUT) {
  let src; try { const [a, b] = bornes(SAIN.cave, nom); src = SAIN.cave.slice(a, b); }
  catch (e) { rouge++; console.log('  ' + R + '✗ ' + cle + ' fonction introuvable : ' + nom + Z); continue; }
  const n = src.split(ancre).length - 1;
  if (n !== 1) { rouge++; console.log('  ' + R + '✗ ' + cle + ' ancre ' + (n ? 'double' : 'absente') + ' dans ' + nom + Z); continue; }
  if (!base[cle]) { rouge++; console.log('  ' + R + '✗ ' + cle + ' déjà rouge sur le code sain' + Z); continue; }
  const S = { cave: SAIN.cave.replace(src, src.replace(ancre, rempl)) };
  let r; try { r = jouer(S); } catch (e) { r = { [cle]: false }; }
  if (!r[cle]) { det++; console.log('  ' + V + '✓' + Z + ' détecté (' + cle + ') : ' + lib); }
  else { rouge++; console.log('  ' + R + '✗ NON détecté (' + cle + ') : ' + lib + Z); }
}
console.log('\nContre-épreuves RANGE-1 : ' + det + ' détectées sur ' + MUT.length);
process.exit(rouge ? 1 : 0);
