// HARNAIS — HLHA-1 (§413) : Le millésime — le hL/ha de chaque cuvée (fiche, sous Entonné et Bouteilles) et le
// rendement par appellation et par couleur (en tête de Parcelles : ce qui se déclare).
//   node scripts/mv-harnais-hlha1.mjs           → doit être vert
//   node scripts/mv-harnais-hlha1.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue les VRAIES fonctions (cave.js + cuvier.js réunis par mv-cave-src, et les deux formateurs de surface de
// utils.js) : la fiche, ses cases, la surface d'une cuve (_mlCuvSurf), le rendement par parcelle (_mlRendements) et
// toute la chaîne du Cuvier qu'il lit (_vendRdtParc, _vendSurfParc, _vendVolParc…), l'appellation (_vendAocDe,
// _vendAocMax), la couleur (_parcCoul). Décor seulement : échappement, droits, icônes, et `_caveVolL` (jamais atteint :
// toutes les cuves décuvées portent leur volume). « Encore sur pied » est passé à la main à _mlAocRdt : sa liste vient
// de _vendResteARentrer, qui a ses propres harnais (sansrec1, reste-a-rentrer).
// Le domaine (2026, caisses de 25 kg, règle 130–140 kg/hL) :
//   cvA  Les Brûlées (pinot, 0,60 ha) + En Champs (chardonnay, 0,40 ha), 29,4 hL → 29,4 hL/ha ; Bourgogne rouge ET blanc
//   cvB  Le Clos partagé avec cvC (180 caisses sur 240 → 0,75 ha) ; Aux Échezeaux vendue en partie, surface achetée
//        saisie (0,20 ha) → le domaine 0,30 ha ; 43,5 hL → 41,4 hL/ha sur 1,05 ha
//   cvC  le reste du Clos, pas encore décuvée → aucun hL/ha
//   cvD  La Justice vendue en partie SANS surface achetée → part du domaine au prorata des kilos, la fiche le dit
//   cvE  une parcelle connue + deux sans surface (dont un nom piégé, sous une appellation piégée)
//   cvF  cuvée en bouteille : 30 hL entonnés, 3 900 cols sur 0,70 ha → 42,9 puis 41,8 hL/ha ; parcelle sans appellation
//   cvG  cuvée complétée par 1,5 hL d'une autre cuve → 42,2 hL/ha, l'apport hors du calcul
//   cvH1/cvH2  deux cuves dans une cuvée (la chaîne suit _caveCuveSource = cvH1, la ligne porte cvH2)
//   cvI  une récolte d'un autre millésime glissée dans la cuve → ne compte pas dans la surface
//   Appellations : Bourgogne (55), Gevrey-Chambertin (40), Côte de Nuits-Villages (sans maximum : celui de ses parcelles).
import vm from 'node:vm';
import fs from 'node:fs';
import { lireCave } from './mv-cave-src.mjs';

const CONTRE = process.argv.includes('--contre');
const SAIN = { cave: lireCave(), utils: fs.readFileSync('src/utils.js', 'utf8'), guide: fs.readFileSync('guide/08-cave.html', 'utf8') };

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
function bloc(src, nom, ouv, ferm) {
  const m = new RegExp('^var ' + nom + '\\s*=\\s*\\' + ouv, 'm').exec(src);
  if (!m) throw new Error('table absente : ' + nom);
  let d = 0, q = null;
  for (let j = src.indexOf(ouv, m.index); j < src.length; j++) {
    const ch = src[j];
    if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
    if (ch === "'" || ch === '"') { q = ch; continue; }
    if (ch === ouv) d++; else if (ch === ferm && --d === 0) return src.slice(m.index, j + 1) + ';';
  }
  throw new Error('table non fermée : ' + nom);
}
function scalaire(src, nom) {
  const m = new RegExp('^var ' + nom + '\\s*=\\s*[0-9.]+;', 'm').exec(src);
  if (!m) throw new Error('variable absente : ' + nom);
  return m[0];
}
function formateurs(u) {   // les VRAIS _mvHaP / _mvHaT (KIT-4, §229)
  const m = u.match(/function _mvHaNum\(x\)\{[^\n]*\n(window\._mvHaP=[^\n]*\n)(window\._mvHaT=[^\n]*\n)/);
  if (!m) throw new Error('formateurs de surface introuvables dans utils.js');
  return m[0];
}
const NC = ['_vendCfg', '_vendPckLegacy', '_vendParts', '_vpPck', '_vpCs', '_vpKg', '_vpNom', '_vpSurf', '_recKg', '_recKgDom',
  '_recCaisses', '_recSold', '_vendSortiesHl', '_vendPrelevHl', '_vendHlKg', '_mvBtl', '_mvF1', '_mlKgHl', '_caveCuveSource',
  '_caveBilanChaine', '_caveNbTonneaux', '_mlRecoltesDe', '_mlMilActif', '_pcavHasW', '_pcavLog',
  '_pcrbCvEnt', '_pcrbCvNomCuve', '_pcrbCvNomVend', '_pcrbCvParcs', '_pcrbCvParcTxt', '_pcrbCvSous', '_pcrbCvVente',
  '_pcrbCvChaineCuve', '_pcrbCvPleines', '_pcrbCvLignes', '_pcrbCvCellules', '_pcrbCvCelHtml',
  '_mlJourCourt', '_mlJours', '_mlCuvInfo', '_mlCuvSurf', '_mlCuvFicheHtml', '_mlRendements', '_mlAocRdt', '_mlAocHtml',
  '_vendParcByName', '_vendParcSurf', '_vendMillOfDate', '_vendSurfParc', '_vendVolParc', '_vendVolPart', '_vendVolCuve',
  '_vendVolLoge', '_vendLitresRetour', '_vendRdtBase', '_vendRdtParc', '_vendRdtMax',
  '_vendAocNorm', '_vendAocList', '_vendAocDe', '_vendAocMax', '_parcCoul', '_matNorm'];
const PRELUDE = `
var __logs = [], __ecrit = true;
var window = { logError: function(e){ __logs.push(e); }, PARCELLES: [], CONFIG: { appellations: [] } };
var CAVE_VENDANGE = { config: {}, recoltes: [], cuves_vinif: [], cuvees: [] };
var CAVE_ELEVAGE = { cuvees: [] };
window.CAVE_VENDANGE = CAVE_VENDANGE; window.CAVE_ELEVAGE = CAVE_ELEVAGE;
var _mlMil = null, _mlCuvSel = null, _mlCuvFiche = false;
function _mlCampagne(){ return 2026; }
function _vendClient(){ return null; }
function _caveVolL(){ return 0; }
function canWrite(){ return __ecrit; }
function _escHtml(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function _escAttr(s){ return _escHtml(s); }
function _mvIcon(n){ return '<i data-ic="'+n+'"></i>'; }
function __poser(v, e, parc, aoc){
  CAVE_VENDANGE.config = v.config || {}; CAVE_VENDANGE.recoltes = v.recoltes || [];
  CAVE_VENDANGE.cuves_vinif = v.cuves_vinif || []; CAVE_VENDANGE.cuvees = v.cuvees || [];
  CAVE_ELEVAGE.cuvees = (e && e.cuvees) || []; window.PARCELLES = parc || []; window.CONFIG = { appellations: aoc || [] };
  __logs.length = 0;
}
`;
function charger(S, sansRdt) {
  const noms = sansRdt ? NC.filter(n => n !== '_vendRdtParc') : NC;
  const corps = PRELUDE + formateurs(S.utils) + scalaire(S.cave, 'MV_CV_ZONE') + '\n' + scalaire(S.cave, 'MV_CV_FICHE') + '\n'
    + bloc(S.cave, '_PCRB_CV_GR', '[', ']') + '\n' + bloc(S.cave, '_ML_MOIS', '[', ']') + '\n' + bloc(S.cave, '_MV_CEP_COUL', '{', '}') + '\n'
    + noms.map(n => fn(S.cave, n)).join('\n')
    + '\nwindow._caveBilanChaine = _caveBilanChaine; window._vendDvolCorriger = function(){};'
    + '\nwindow.openCuveeDetail = function(){}; window.selectCaveSection = function(){};'
    + '\nwindow._mvInfoBtn = function(k){ return \'<i data-info="\'+k+\'"></i>\'; };'
    + '\n;({_pcrbCvLignes, _pcrbCvCellules, _mlCuvSurf, _mlCuvFicheHtml, _mlRendements, _mlAocRdt, _mlAocHtml, window, __poser, __logs})';
  return vm.runInNewContext(corps, {});
}

/* ══ LE DOMAINE ══ */
const P = (c, cl, surf) => cl ? Object.assign({ dom: false, client: cl, caisses: c, pck: 25 }, surf ? { surface: surf } : {}) : { dom: true, caisses: c, pck: 25 };
const REC = (id, parcelle, date, cuve_id, parts) => ({ id, parcelle, date, cuve_id, parts });
const PIEGE = '<img src=x onerror=alert(1)>', PIEGE_AOC = '<img src=y onerror=alert(2)>';
const DEC = (id, nom, vol, cuvee, date) => ({ id, nom, decuvage: { date: date || '2026-10-04', cuvee_id: cuvee }, vol_decuve_hl: vol, vol_decuve_src: 'mesure', operations: [] });
const PN = ['Pinot noir'], CH = ['Chardonnay'];
function domaine() {
  const parc = [
    { nom: 'Les Br\u00fbl\u00e9es', surface: 0.6, appellation: 'Bourgogne', cepages: PN },
    { nom: 'En Champs', surface: 0.4, appellation: 'bourgogne ', cepages: CH },          // nom d'appellation pas normalisé
    { nom: 'Le Clos', surface: 1, appellation: 'Gevrey-Chambertin', cepages: PN },
    { nom: 'Aux \u00c9chezeaux', surface: 0.5, appellation: 'Gevrey-Chambertin', cepages: PN },
    { nom: 'La Justice', surface: 0.8, appellation: 'Gevrey-Chambertin', cepages: PN },
    { nom: 'Les Perri\u00e8res', surface: 0.35, appellation: 'C\u00f4te de Nuits-Villages', cepages: PN, rdt_max_hist: [{ mil: '2026', max: 50 }] },
    { nom: 'Sans Surface', surface: 0, appellation: 'C\u00f4te de Nuits-Villages', cepages: PN },
    { nom: PIEGE, surface: 0, appellation: PIEGE_AOC, cepages: PN },
    { nom: 'Vieilles Vignes', surface: 0.7, rdt_max_hist: [{ mil: '2026', max: 45 }] },   // ni appellation ni cépage ; un maximum à elle
    { nom: 'Les Saints-Georges', surface: 0.45, appellation: 'Bourgogne', cepages: PN },
    { nom: 'H un', surface: 0.5, appellation: 'Gevrey-Chambertin', cepages: PN },
    { nom: 'H deux', surface: 0.4, appellation: 'Gevrey-Chambertin', cepages: PN },
    { nom: 'Les Clos Prieur', surface: 0.3, appellation: 'Gevrey-Chambertin', cepages: PN },
    { nom: 'Les \u00c9vocelles', surface: 0.55, appellation: 'Gevrey-Chambertin', cepages: PN }   // encore sur pied
  ];
  const aoc = [
    { nom: 'Bourgogne', rdt_max_hist: [{ mil: '2026', max: 55 }] },
    { nom: 'Gevrey-Chambertin', rdt_max_hist: [{ mil: '2026', max: 40 }] },
    { nom: 'C\u00f4te de Nuits-Villages' }
  ];
  const v = {
    config: { poids_caisse_kg: 25, ratio_min: 130, ratio_max: 140 },
    cuves_vinif: [
      DEC('cvA', 'Cuve A \u2014 inox 40 hL', 29.4, 'cuA'), DEC('cvB', 'Cuve B \u2014 inox 60 hL', 43.5, 'cuB'),
      { id: 'cvC', nom: 'Cuve C \u2014 bois 20 hL', cuvee_src: 'Le Clos 2026', decuvage: null, operations: [] },
      DEC('cvD', 'Cuve D', 17.5, 'cuD'), DEC('cvE', 'Cuve E', 21, 'cuE'), DEC('cvF', 'Cuve F', 30, 'cuF', '2026-10-01'),
      DEC('cvG', 'Cuve G', 19, 'cuG'), DEC('cvH1', 'Cuve H1', 28, 'cuH'), DEC('cvH2', 'Cuve H2', 9.8, 'cuH'),
      DEC('cvI', 'Cuve I', 12.6, 'cuI')
    ],
    recoltes: [
      REC('a1', 'Les Br\u00fbl\u00e9es', '2026-09-20', 'cvA', [P(100)]),
      REC('a2', 'En Champs', '2026-09-20', 'cvA', [P(72)]),
      REC('b1', 'Le Clos', '2026-09-21', 'cvB', [P(180)]),
      REC('b2', 'Aux \u00c9chezeaux', '2026-09-21', 'cvB', [P(72), P(48, 'Maison Bichot', 0.2)]),
      REC('c1', 'Le Clos', '2026-09-24', 'cvC', [P(60)]),
      REC('d1', 'La Justice', '2026-09-22', 'cvD', [P(100), P(60, 'N\u00e9goce Durand')]),
      REC('e1', 'Les Perri\u00e8res', '2026-09-23', 'cvE', [P(60)]),
      REC('e2', 'Sans Surface', '2026-09-23', 'cvE', [P(40)]),
      REC('e3', PIEGE, '2026-09-23', 'cvE', [P(20)]),
      REC('f1', 'Vieilles Vignes', '2026-09-18', 'cvF', [P(168)]),
      REC('g1', 'Les Saints-Georges', '2026-09-19', 'cvG', [P(108)]),
      REC('h2', 'H deux', '2026-09-25', 'cvH2', [P(56)]),     // la cuve H2 vue la premiere par la liste
      REC('h1', 'H un', '2026-09-25', 'cvH1', [P(120)]),
      REC('h3', 'H deux', '2026-09-26', 'cvH1', [P(40)]),
      REC('i1', 'Les Clos Prieur', '2026-09-27', 'cvI', [P(72)]),
      REC('i2', 'En Bertrange', '2025-09-30', 'cvI', [P(10)])  // date d'une autre annee, dans la meme cuve
    ]
  };
  const e = { cuvees: [
    { id: 'cuA', nom: 'Bourgogne', millesime: 2026, statut: 'elevage', tonneaux: [{ annee: 2026, nb: 13 }] },
    { id: 'cuB', nom: 'Le Clos', millesime: 2026, statut: 'elevage', tonneaux: [{ annee: 2026, nb: 19 }] },
    { id: 'cuD', nom: 'La Justice', millesime: 2026, statut: 'elevage' },
    { id: 'cuE', nom: 'Les Perri\u00e8res', millesime: 2026, statut: 'elevage' },
    { id: 'cuF', nom: 'Vieilles Vignes', millesime: 2026, statut: 'embouteille', nb_bouteilles: 3900 },
    { id: 'cuG', nom: 'Les Saints-Georges', millesime: 2026, statut: 'elevage', apports: [{ l: 150 }] },
    { id: 'cuH', nom: 'Village H', millesime: 2026, statut: 'elevage' },
    { id: 'cuI', nom: 'Les Clos Prieur', millesime: 2026, statut: 'elevage' }
  ] };
  return [v, e, parc, aoc];
}
const sp = s => String(s == null ? '' : s).replace(/[\u00a0\u202f]/g, ' ');
function ligne(d, cle) {
  for (const g of d.groupes) for (const l of g.lignes) if (l.cle === cle) return [g, l];
  throw new Error('ligne absente : ' + cle);
}
function fiche(A, cle) {
  const d = A._pcrbCvLignes(2026), [g, l] = ligne(d, cle);
  const h = A._mlCuvFicheHtml(g, l), ch = l.ch || {};
  const cells = A._pcrbCvCellules(ch, l.sorties, l.prelev, false, 96, (A._mlCuvSurf(ch.cuveId || l.cuveId, 2026) || {}).ha);
  return { h, hs: sp(h), cells, l };
}
const avec = A => { const [v, e, parc, aoc] = domaine(); A.__poser(v, e, parc, aoc); return parc; };
const cases = h => sp(h.slice(h.indexOf('mlc-steps'), h.indexOf('mlc-cols')));
// Le rendement par appellation, sur les vraies lignes des parcelles ; « encore sur pied » donné à la main.
function aoc(A) {
  const parc = avec(A), rd = A._mlRendements(2026), reste = [parc.find(p => p.nom === 'Les \u00c9vocelles')];
  const L = A._mlAocRdt(rd, reste, 2026);
  const de = (nom, c) => L.find(x => x.nom === nom && x.coul === c);
  const somme = (noms) => {   // la somme des LIGNES des parcelles (hlHa × surface), comme l'écran Parcelles les affiche
    let hl = 0, ha = 0; rd.forEach(r => { if (noms.includes(r.parcelle.nom) && r.parcelle.surface > 0) { hl += r.rdt.vol.hl + r.rdt.vol.kgKo / 135; ha += r.parcelle.surface; } });
    return { hl, ha, hlHa: hl / ha };
  };
  return { L, de, somme, rd, html: A._mlAocHtml(L) };
}

const T = {
  H1: ['deux parcelles entières : le hL/ha sous Entonné, à côté du kg/hL, dans la fiche', A => {
    avec(A); const f = fiche(A, 'cv:cvA');
    return sp(f.cells[2].ha) === '29,4 hL/ha' && sp(f.cells[2].sous) === '146 kg/hL'
      && cases(f.h).includes('<span class="pcrb-cv-s k">146 kg/hL</span><span class="pcrb-cv-s k">29,4 hL/ha</span>'); }],
  H2: ['d’où vient la cuvée : la surface comptée de chaque parcelle (au centiare), puis le total (au centième)', A => {
    avec(A); const f = fiche(A, 'cv:cvA');
    return f.hs.includes('<b>Les Br\u00fbl\u00e9es</b><span>0,6000 ha</span><span class="k">2 500 kg</span>')
      && f.hs.includes('<b>En Champs</b><span>0,4000 ha</span><span class="k">1 800 kg</span>')
      && f.hs.includes('<div class="mlc-o mlc-ot"><b>Total</b><span>1,00 ha</span><span class="k">4 300 kg</span></div>')
      && !f.hs.includes('mvencadre'); }],
  H3: ['une parcelle partagée entre deux cuves compte au prorata de ses kilos ; la surface achetée par un client sort', A => {
    avec(A); const f = fiche(A, 'cv:cvB'), s = A._mlCuvSurf('cvB', 2026);
    return sp(f.cells[2].ha) === '41,4 hL/ha' && Math.abs(s.ha - 1.05) < 1e-9
      && f.hs.includes('<b>Le Clos</b><span>0,7500 sur 1,0000 ha</span>') && f.hs.includes('<b>Aux \u00c9chezeaux</b><span>0,3000 sur 0,5000 ha</span>')
      && f.hs.includes('<b>Total</b><span>1,05 ha</span><span class="k">6 300 kg</span>'); }],
  H4: ['une cuve pas encore décuvée : sa part de surface, mais aucun hL/ha (rien de mesuré)', A => {
    avec(A); const f = fiche(A, 'cv:cvC');
    return f.cells.every(c => !c.ha) && !cases(f.h).includes('hL/ha') && f.hs.includes('<b>Le Clos</b><span>0,2500 sur 1,0000 ha</span>')
      && !f.hs.includes('mlc-ot'); }],
  H5: ['vendue sans surface achetée : part du domaine au prorata des kilos, et la fiche le dit (encadré « informer »)', A => {
    avec(A); const f = fiche(A, 'cv:cvD');
    return sp(f.cells[2].ha) === '35 hL/ha' && f.hs.includes('<b>La Justice</b><span>0,5000 sur 0,8000 ha</span>')
      && f.hs.includes('<div class="mvencadre mvencadre-info mlc-enc"><i data-ic="info"></i><span>La Justice : la surface achet\u00e9e par le client n\u2019est pas saisie, la part du domaine est estim\u00e9e au prorata des kilos.</span></div>'); }],
  H6: ['une parcelle sans surface connue : pas de hL/ha ni de total ; l’encadré dit lesquelles, noms échappés', A => {
    avec(A); const f = fiche(A, 'cv:cvE');
    return f.cells.every(c => !c.ha) && !cases(f.h).includes('hL/ha') && !f.hs.includes('mlc-ot')
      && f.hs.includes('<div class="mvencadre mvencadre-attention mlc-enc"><i data-ic="alerte"></i><span>Pas de hL/ha : la surface du domaine n\u2019est pas connue pour Sans Surface, &lt;img src=x onerror=alert(1)&gt;.</span></div>')
      && !f.h.includes('<img src=x') && f.hs.includes('<b>Les Perri\u00e8res</b><span>0,3500 ha</span>'); }],
  H7: ['une cuvée en bouteille : le hL/ha sous Entonné ET sous Bouteilles', A => {
    avec(A); const f = fiche(A, 'cv:cvF');
    return sp(f.cells[2].ha) === '42,9 hL/ha' && sp(f.cells[3].ha) === '41,8 hL/ha' && sp(f.cells[3].sous) === '144 kg/hL'
      && cases(f.h).includes('41,8 hL/ha'); }],
  H8: ['le vin d’une autre cuve n’entre pas dans le hL/ha, comme pour le kg/hL', A => {
    avec(A); const f = fiche(A, 'cv:cvG');
    return sp(f.cells[2].ha) === '42,2 hL/ha' && sp(f.cells[2].sous) === '142 kg/hL' && sp(f.cells[2].sous2) === '+1,5 hL apport'; }],
  H9: ['les lignes de la liste ne portent pas de hL/ha (seule la fiche passe la surface)', A => {
    avec(A); const d = A._pcrbCvLignes(2026); let n = 0, k = 0;
    d.groupes.forEach(g => g.lignes.forEach(l => { if (l.cells) { n++; if (l.cells.some(c => c.ha)) k++; } }));
    return n >= 8 && k === 0; }],
  H10: ['deux cuves dans une cuvée : le hL/ha suit la cuve de la chaîne ; « D’où vient » garde sa cuve à elle', A => {
    avec(A); const f2 = fiche(A, 'cv:cvH2'), f1 = fiche(A, 'cv:cvH1');
    return sp(f2.cells[2].ha) === '42 hL/ha' && f2.hs.includes('<b>H deux</b><span>0,4 ha</span><span class="k">1 400 kg</span>')
      && !f2.hs.includes('mlc-ot') && sp(f1.cells[2].ha) === '42 hL/ha'
      && f1.hs.includes('<b>H un</b><span>0,5000 ha</span>') && f1.hs.includes('<b>H deux</b><span>0,1667 sur 0,4000 ha</span>')
      && f1.hs.includes('<b>Total</b><span>0,67 ha</span><span class="k">4 000 kg</span>'); }],
  H11: ['une récolte d’un autre millésime dans la cuve ne compte pas dans la surface', A => {
    avec(A); const f = fiche(A, 'cv:cvI'), s = A._mlCuvSurf('cvI', 2026);
    return s.ha === 0.3 && s.sans.length === 0 && sp(f.cells[2].ha) === '42 hL/ha'
      && f.hs.includes('<b>Total</b><span>0,30 ha</span><span class="k">1 800 kg</span>'); }],
  H12: ['_mlCuvSurf : sans cuve, rien ; un millésime sans kilos, pas de surface', A => {
    avec(A); const v = A._mlCuvSurf('cvA', 2025);
    return A._mlCuvSurf(null, 2026) === null && v && v.ha === null && Object.keys(v.par).length === 0; }],
  H13: ['sans le Cuvier (_vendRdtParc absent) : la fiche reste celle d’avant, sans erreur', (A, S) => {
    const B = charger(S, true); avec(B); const f = fiche(B, 'cv:cvA');
    return f.cells.every(c => !c.ha) && !cases(f.h).includes('hL/ha') && f.hs.includes('<b>Les Br\u00fbl\u00e9es</b><span>0,6 ha</span>')
      && !f.hs.includes('mlc-ot') && B.__logs.length === 0; }],
  A1: ['par appellation ET par couleur : Bourgogne en deux lignes (rouge, blanc), un nom mal tapé rejoint son appellation', A => {
    const r = aoc(A), br = r.de('Bourgogne', 'r'), bb = r.de('Bourgogne', 'b'), gv = r.de('Gevrey-Chambertin', 'r');
    return br && bb && br.multi && bb.multi && gv && !gv.multi && br.n === 2 && bb.n === 1 && r.L.filter(x => x.cle === 'bourgogne').length === 2
      && r.L.indexOf(br) < r.L.indexOf(bb); }],
  A2: ['Bourgogne rouge : la somme des lignes de ses parcelles, mesurée, face au maximum de l’appellation (55)', A => {
    const r = aoc(A), br = r.de('Bourgogne', 'r'), s = r.somme(['Les Br\u00fbl\u00e9es', 'Les Saints-Georges']);
    return Math.abs(br.hlHa - s.hlHa) < 1e-9 && Math.abs(br.ha - 1.05) < 1e-9 && br.statut === 'mesure' && br.max === 55
      && br.maxSrc === 'aoc' && br.pct === 62 && !br.depasse
      && sp(r.html).includes('<span class="mlp-v">34,4<small>hL/ha</small></span>') && sp(r.html).includes('<span class="mlp-s">1,05 ha</span>'); }],
  A3: ['le raisin vendu compte, sur toute la surface : Gevrey estimé en fourchette, au-dessus de 40', A => {
    const r = aoc(A), g = r.de('Gevrey-Chambertin', 'r');
    const noms = ['Le Clos', 'Aux \u00c9chezeaux', 'La Justice', 'H un', 'H deux', 'Les Clos Prieur'], s = r.somme(noms);
    return g.n === 6 && Math.abs(g.ha - 3.5) < 1e-9 && Math.abs(g.hl - s.hl) < 1e-9 && g.statut === 'partiel'
      && g.depasse === (g.hlHa > 40) && g.depasse && g.kg === r.rd.filter(x => noms.includes(x.parcelle.nom)).reduce((a, x) => a + x.kg, 0)
      && /<span class="mlp-v">\d+(,\d)?\u2013\d+(,\d)?<small>hL\/ha<\/small><\/span>/.test(sp(r.html)) && r.html.includes('class="mla-l over"'); }],
  A4: ['une parcelle encore sur pied reste hors du calcul, et sa ligne le dit', A => {
    const r = aoc(A), g = r.de('Gevrey-Chambertin', 'r');
    return g.pied === 1 && Math.abs(g.haPied - 0.55) < 1e-9 && Math.abs(g.ha - 3.5) < 1e-9
      && sp(r.html).includes('6 parcelles r\u00e9colt\u00e9es \u00b7 1 encore sur pied (0,55 ha), hors du calcul'); }],
  A5: ['une parcelle sans surface est écartée des deux côtés, et comptée', A => {
    const r = aoc(A), c = r.de('C\u00f4te de Nuits-Villages', 'r');
    return c.n === 1 && c.sansSurf === 1 && Math.abs(c.ha - 0.35) < 1e-9 && sp(r.html).includes('1 parcelle r\u00e9colt\u00e9e \u00b7 1 sans surface, hors du calcul'); }],
  A6: ['« Sans appellation » en dernier, avec ce qu’il faut faire', A => {
    const r = aoc(A), last = r.L[r.L.length - 1];
    return last.cle === '' && last.n === 1 && last.max === null && r.html.includes('<b>Sans appellation</b>')
      && sp(r.html.slice(r.html.indexOf('<b>Sans appellation</b>'))).includes('<span class="mlp-b"><span class="mlp-bt">\u2014</span></span>')
      && sp(r.html).includes('\u00e0 rattacher \u00e0 leur appellation (roue crant\u00e9e de la Cave, Appellations)')
      && r.L.findIndex(x => x.cle === '') > r.L.findIndex(x => x.nom === 'C\u00f4te de Nuits-Villages'); }],
  A7: ['un nom d’appellation est échappé', A => {
    const r = aoc(A);
    return r.html.includes('&lt;img src=y onerror=alert(2)&gt;') && !r.html.includes('<img src=y'); }],
  A8: ['une appellation sans maximum prend celui de ses parcelles, et la ligne le dit', A => {
    const r = aoc(A), c = r.de('C\u00f4te de Nuits-Villages', 'r');
    return c.max === 50 && c.maxSrc === 'parcelles' && sp(r.html).includes('max 50 \u00b7 d\u2019apr\u00e8s ses parcelles'); }],
  A9: ['le bloc : sa tête, sa fiche « i », ses colonnes ; aucune ligne de la liste des parcelles', A => {
    const r = aoc(A);
    return r.html.startsWith('<section class="pcav-card mlp mla">') && r.html.includes('data-info="cave.aoc"')
      && r.html.includes('class="mlp-h mla-h"') && !/class="mlp-l/.test(r.html) && !/class="mlx-chip/.test(r.html)
      && (r.html.match(/class="mla-l/g) || []).length === r.L.length && A._mlAocHtml([]) === ''; }],
  A10: ['le câblage : la vue Parcelles s’ouvre sur le bloc, et l’aide le dit', (A, S) => {
    const p = fn(S.cave, '_mlRenderParc');
    return /var aoc=''; try\{ aoc=_mlAocHtml\(_mlAocRdt\(rd,reste,mil\)\); \}catch\(e\)\{ _pcavLog\('aoc',e\); \}/.test(p)
      && /var h=aoc\+'<section class="pcav-card mlp">/.test(p)
      && /'cave\.aoc': \{ t: 'Le rendement par appellation'/.test(S.utils)
      && /'cave\.cuvees':[\s\S]{0,4000}hL\/ha<\/b>\\u00a0: ses hectolitres divis\\u00e9s par la surface/.test(S.utils)
      && S.utils.includes('Parcelles : en tête, ce qui se déclare')
      && S.utils.includes('Juste dessous, son <b>hL/ha</b> : ses hectolitres sur la surface des parcelles qui ont rempli la cuve')
      && S.guide.includes('en tête, <b>ce qui se déclare</b>') && S.guide.includes('hors du kg/hL et du hL/ha'); }]
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
  console.log('\nHLHA-1 : ' + ok + ' vertes, ' + ko + ' rouges');
  process.exit(ko ? 1 : 0);
}
const MUT = [
  ['_mlCuvSurf', 'var h=dom.ha*Math.min(1,kg[n]/dom.kg);', 'var h=dom.ha;', 'H3', 'une parcelle partagée compte toute sa surface dans chaque cuve'],
  ['_mlCuvSurf', 'var h=dom.ha*Math.min(1,kg[n]/dom.kg);', 'var h=tot*Math.min(1,kg[n]/dom.kg);', 'H3', 'la surface achetée par le client reste au dénominateur'],
  ['_mlCuvSurf', 'ha:(ord.length&&!sans.length&&ha>0)?ha:null,', 'ha:(ord.length&&ha>0)?ha:null,', 'H6', 'un dénominateur partiel donne un hL/ha trop haut'],
  ['_mlCuvSurf', "if(!r||r.cuve_id!==cuveId||String(r.date||'').slice(0,4)!==M) return;", 'if(!r||r.cuve_id!==cuveId) return;', 'H11', 'les kilos d’un autre millésime entrent'],
  ['_mlCuvSurf', "if(!cuveId||typeof _vendRdtParc!=='function') return null;", 'if(!cuveId) return null;', 'H13', 'sans le Cuvier, la fiche lève (avalé, mais tracé)'],
  ['_pcrbCvCellules', 'ha:hlHa(ch.entonneHl),', 'ha:hlHa(ch.entonneHl+ap),', 'H8', 'l’apport entre dans le hL/ha'],
  ['_pcrbCvCellules', ', ha:hlHa(vBtl*0.75/100*part)', '', 'H7', 'les bouteilles perdent leur hL/ha'],
  ['_pcrbCvCelHtml', "+(x.ha?('<span class=\"pcrb-cv-s k\">'+x.ha+'</span>'):'')", '', 'H1', 'la case ne montre pas le hL/ha'],
  ['_mlCuvFicheHtml', ',MV_CV_FICHE,S?S.ha:null);', ',MV_CV_FICHE);', 'H1', 'la fiche ne passe pas la surface aux cases'],
  ['_mlCuvFicheHtml', 'var SP=(S&&cv&&S.cuve===cv.id)?S:null;', 'var SP=S;', 'H10', '« D’où vient » prend la surface d’une autre cuve'],
  ['_mlCuvFicheHtml', 'if(SP&&SP.ha>0&&ord.length>1) b+=', 'if(SP&&ord.length>1) b+=', 'H6', 'un total sans surface connue'],
  ['_mlCuvFicheHtml', "+_escHtml(SP.sans.join(', '))+", "+SP.sans.join(', ')+", 'H6', 'un nom de parcelle n’est plus échappé'],
  ['_mlCuvFicheHtml', 'if(q&&q.ha!=null) kgT+=par[n];', 'kgT+=par[n];', 'H11', 'le total compte des kilos dont la surface n’est pas comptée'],
  ['_mlAocRdt', 'c=_parcCoul(p.nom);', "c='?';", 'A1', 'les couleurs d’une appellation sont confondues'],
  ['_mlAocRdt', 'var hl=v?((v.hl||0)+(v.kgKo||0)/kgHl):', 'var hl=v?(v.hl||0):', 'A3', 'le raisin sans volume connu (vendu, pas décuvé) sort du volume'],
  ['_mlAocRdt', "(reste||[]).forEach(function(p){ if(!p) return; var L=ligne(p); L.pied++; L.haPied+=parseFloat(p.surface)||0; });", '', 'A4', 'ce qui reste sur pied n’est plus dit'],
  ['_mlAocRdt', 'if(!(s>0)){ L.sansSurf++; return; }', 'if(false){ L.sansSurf++; return; }', 'A5', 'une parcelle sans surface entre dans le calcul'],
  ['_mlAocRdt', 'if(!a.cle!==!b.cle) return a.cle?-1:1;', '', 'A6', '« Sans appellation » rangée avec les autres'],
  ['_mlAocRdt', 'var max=!k?null:((am!=null)?am:((vals.length===1)?vals[0]:null));', 'var max=!k?null:((am!=null)?am:null);', 'A8', 'une appellation sans maximum perd celui de ses parcelles'],
  ['_mlAocRdt', 'var max=!k?null:((am!=null)?am:((vals.length===1)?vals[0]:null));', 'var max=(am!=null)?am:((vals.length===1)?vals[0]:null);', 'A6', '« Sans appellation » comparée à un maximum'],
  ['_mlAocHtml', "(x.cle?_escHtml(x.nom):'Sans appellation')", "(x.cle?x.nom:'Sans appellation')", 'A7', 'un nom d’appellation n’est plus échappé'],
  ['_mlRenderParc', "var h=aoc+'<section class=\"pcav-card mlp\">", "var h='<section class=\"pcav-card mlp\">", 'A10', 'la vue Parcelles ne montre plus le bloc']
];
const base = jouer(SAIN);
let det = 0, rouge = 0;
for (const [nom, ancre, rempl, cle, lib] of MUT) {
  let src; try { const [a, b] = bornes(SAIN.cave, nom); src = SAIN.cave.slice(a, b); }
  catch (e) { rouge++; console.log('  ' + R + '✗ ' + cle + ' fonction introuvable : ' + nom + Z); continue; }
  const n = src.split(ancre).length - 1;
  if (n !== 1) { rouge++; console.log('  ' + R + '✗ ' + cle + ' ancre ' + (n ? 'double' : 'absente') + ' dans ' + nom + Z); continue; }
  if (!base[cle]) { rouge++; console.log('  ' + R + '✗ ' + cle + ' déjà rouge sur le code sain' + Z); continue; }
  const S = Object.assign({}, SAIN, { cave: SAIN.cave.replace(src, src.replace(ancre, rempl)) });
  let r; try { r = jouer(S); } catch (e) { r = { [cle]: false }; }
  if (!r[cle]) { det++; console.log('  ' + V + '✓' + Z + ' détecté (' + cle + ') : ' + lib); }
  else { rouge++; console.log('  ' + R + '✗ NON détecté (' + cle + ') : ' + lib + Z); }
}
console.log('\nContre-épreuves HLHA-1 : ' + det + ' détectées sur ' + MUT.length);
process.exit(rouge ? 1 : 0);
