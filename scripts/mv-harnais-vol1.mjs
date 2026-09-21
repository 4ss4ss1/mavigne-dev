// ═══════════════════════════════════════════════════════════════════════════
//  HARNAIS VOL-1 — UNE CUVE CONTIENT CE QU'ON Y A MIS, PAS SA CONTENANCE
// ═══════════════════════════════════════════════════════════════════════════
//  Nico, 19/09, sur la carte « De la récolte à la bouteille » (Ruchottes :
//  Récolte 480 kg · En cuve 5 hL · Après élevage 2,8 hL) : « ce n'est pas la
//  contenance de la cuve qui est à mettre mais le nombre d'hectolitres estimé
//  en fonction de la règle de calcul de rendement indiquée, puis ce qui est
//  réellement entonné (et non la taille du fût) » — et « vérifie aussi que
//  cette règle s'applique bien partout ».
//
//  Sur les VRAIES fonctions extraites de src/cave.js (et du socle de graphe
//  de src/utils.js). Deux bouchons de DONNÉES seulement : les kilos domaine
//  d'une récolte (`_recKgDom`) et l'échappeur.
//
//  CE QUE CE HARNAIS PROUVE
//   A. la seule porte `_vendVolContenu` : décuvée = le volume logé ; avant =
//      les kilos à la règle du Cuvier, saignées déduites ; sans caisse = rien.
//      Jamais `volume_hl` (la contenance). Le repère des doses la suit ;
//   B. la chaîne : Récolte (kg) → En cuve (estimé) → Entonné (MESURÉ, sinon en
//      pointillé) → Bouteilles ; ni la contenance de la cuve, ni la taille des
//      fûts ; le vivant avant le figé ;
//   C. le registre : le SO2 d'avant ce lot se recalcule sur ce que la cuve
//      contenait, jamais sur la contenance ; pas de grammes inventés ;
//   D. les écrans et les écritures qui lisaient la contenance (feuille
//      d'opération, carboglace, saignée, tournée, décuvées, rattachement, plan
//      de cuverie, cahier, millésime, mise en bouteille) ;
//   E. l'aide, le guide, « Quoi de neuf » et la démo le disent.
//
//  ⚠ Contre-épreuve (--contre) : chaque défaut réintroduit doit faire rougir
//    l'assertion qu'il vise ; l'ancre doit être UNIQUE dans la fonction visée,
//    et l'assertion verte sur le code sain — sinon ROUGE.
//
//  Usage :  node scripts/mv-harnais-vol1.mjs
//           node scripts/mv-harnais-vol1.mjs --contre
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { lireCave } from './mv-cave-src.mjs';   // ★ CUV-DEC (§164) : la Cave = cave.js + cuvier.js
const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SAIN = {
  cave: lireCave(), utils: lire('src/utils.js'), app: lire('src/app.js'),
  g08: lire('guide/08-cave.html')
};

/* ══ EXTRACTION — accolades comptées hors chaînes et hors commentaires ══ */
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
/* Le code d'une fonction SANS ses commentaires : une assertion de texte ne doit
   jamais se satisfaire d'un commentaire qui cite l'ancien code (§148e, F8). */
const code = (src, nom) => fn(src, nom).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
function tableau(src, nom) {   // var NOM = [ … ]; ou { … }; — crochets équilibrés hors chaînes
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
function socleGraphe(u) {       // MV_GRAPH_* + _mvGraphCadre + _mvEsc + _mvGraphSvg, tels quels
  const a = u.indexOf('var MV_GRAPH_MIN'), b0 = u.indexOf('window._mvGraphSvg = function');
  if (a < 0 || b0 < 0) throw new Error('socle de graphe introuvable dans utils.js');
  return u.slice(a, u.indexOf('\n};', b0) + 3);
}

const NC = ['_vendCfg', '_caveFutL', '_caveTonL', '_caveFutsL', '_caveVolCuvesL', '_caveVolL', '_caveManqueL', '_vendVolLoge',
  '_vendSortiesHl', '_vendVolContenu', '_vendCuvKgDom', '_vendCuvF1', '_vendHlKg', '_vendEstIntrant',
  '_vendIntrVol', '_vendIntrVolLbl', '_vendIntrQteTxt', '_vendMoyTbl', '_vendMoyLbl', '_vendOpDet',
  '_caveCuveSource', '_mvBtl', '_mvF1', '_mlKgHl', '_caveBilanChaine', '_caveBtlGraphSvg',
  '_rmNum', '_rmF', '_rmDetail', '_rmVolRepli', '_rmMilCuve', '_rmMilCuvees', '_rmLignes', '_rmTotaux'];
const TABLES = ['_VEND_INTR', '_VEND_FROID', '_VEND_CHAUD', 'RM_TYPES', 'RM_HORS'];
const PRELUDE = `
var window = { CONFIG: { cave: { fut_l: 228 } } };
var CAVE_VENDANGE = { config: { ratio_min: 130, ratio_max: 140 }, recoltes: [], cuves_vinif: [] };
var CAVE_ELEVAGE = { cuvees: [], operations: [] };
window.CAVE_VENDANGE = CAVE_VENDANGE; window.CAVE_ELEVAGE = CAVE_ELEVAGE;
var _CAVE_BTL_GID = 0;   // la variable de module qui numerote les degrades (VOL-2)
function _recKgDom(r){ return (r && r.kg_dom) || 0; }
function _escHtml(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function __poser(v, e){
  CAVE_VENDANGE.recoltes = v.recoltes || []; CAVE_VENDANGE.cuves_vinif = v.cuves_vinif || [];
  CAVE_ELEVAGE.cuvees = (e && e.cuvees) || []; CAVE_ELEVAGE.operations = (e && e.operations) || [];
}
`;
function charger(S) {
  const corps = PRELUDE + socleGraphe(S.utils) + '\n' + TABLES.map(t => tableau(S.cave, t)).join('\n') + '\n'
    + NC.map(n => fn(S.cave, n)).join('\n')
    + '\n;({' + NC.join(',') + ', window, CAVE_VENDANGE, CAVE_ELEVAGE, __poser})';
  return vm.runInNewContext(corps, {});
}

/* ══ LE CAS DE NICO — Ruchottes, 480 kg, une cuve de 5 hL, un fût de 280 L ══ */
const RUCH = (o) => {
  const cv = Object.assign({ id: 'cvR', nom: 'Ruchottes', volume_hl: 5, statut: 'termine', operations: [],
    decuvage: { date: '2026-09-15', cuvee_id: 'cuR' }, vol_decuve_hl: 2.8 }, o || {});
  return { v: { recoltes: [{ id: 'rR', cuve_id: 'cvR', kg_dom: 480 }], cuves_vinif: [cv] },
           e: { cuvees: [{ id: 'cuR', nom: 'Ruchottes', millesime: 2026, statut: 'elevage', tonneaux: [{ annee: 2023, nb: 1, l: 280 }] }] } };
};
const chaine = (A, o, cuvee) => { const d = RUCH(o); A.__poser(d.v, d.e); return A._caveBilanChaine(cuvee || d.e.cuvees[0]); };
const svg = (A, ch, nb) => A._caveBtlGraphSvg(ch, nb == null ? ch.nbBtl : nb, 600);
const avant = (t, a, b) => t.indexOf(a) >= 0 && t.indexOf(b) >= 0 && t.indexOf(a) < t.indexOf(b);
const CUVE40 = (o) => Object.assign({ id: 'c40', nom: 'Cuve 4', volume_hl: 60, statut: 'fa', operations: [] }, o || {});
const V40 = (ops, o) => ({ recoltes: [{ id: 'r40', cuve_id: 'c40', kg_dom: 5400, date: '2026-09-10' }],
                           cuves_vinif: [CUVE40(Object.assign({ operations: ops || [] }, o || {}))] });
const registre = (A, v) => { A.__poser(v, { cuvees: [], operations: [] }); return A._rmLignes(A.CAVE_VENDANGE, A.CAVE_ELEVAGE, null, null).lignes; };

const T = {
  // A — la seule porte
  A1: ['480 kg à 135 kg/hL = 3,56 hL estimés — pas les 5 hL de contenance', A => {
    A.__poser({ recoltes: [{ id: 'r', cuve_id: 'x', kg_dom: 480 }], cuves_vinif: [] });
    const v = A._vendVolContenu({ id: 'x', volume_hl: 5, operations: [] }); return v.hl === 3.56 && v.src === 'estime' && v.kg === 480; }],
  A2: ['une saignée de 0,5 hL sort de la cuve : 3,06 hL', A => {
    A.__poser({ recoltes: [{ id: 'r', cuve_id: 'x', kg_dom: 480 }], cuves_vinif: [] });
    return A._vendVolContenu({ id: 'x', volume_hl: 5, operations: [{ type: 'saignee', volume_hl: 0.5 }] }).hl === 3.06; }],
  A3: ['sans caisse rattachée, rien n’est inventé — même sur une cuve de 60 hL', A => {
    A.__poser({ recoltes: [], cuves_vinif: [] });
    const v = A._vendVolContenu({ id: 'x', volume_hl: 60, operations: [] }); return v.hl === 0 && v.src === 'aucun'; }],
  A4: ['décuvée : le volume logé, mesuré (2,5 hL), jamais la contenance', A => {
    A.__poser({ recoltes: [{ id: 'r', cuve_id: 'x', kg_dom: 480 }], cuves_vinif: [] });
    const v = A._vendVolContenu({ id: 'x', volume_hl: 5, decuvage: { date: 'd' }, vol_decuve_hl: 2.5, vol_decuve_src: 'mesure' });
    return v.hl === 2.5 && v.src === 'mesure'; }],
  A5: ['la récolte qu’on corrige ne compte pas deux fois (exclId)', A => {
    A.__poser({ recoltes: [{ id: 'r1', cuve_id: 'x', kg_dom: 480 }, { id: 'r2', cuve_id: 'x', kg_dom: 270 }], cuves_vinif: [] });
    return A._vendVolContenu({ id: 'x' }, 'r2').hl === 3.56 && A._vendVolContenu({ id: 'x' }).hl === 5.56; }],
  A6: ['arrondi au centième : la case et le repère se comparent sans faux « saisi »', A => {
    A.__poser({ recoltes: [{ id: 'r', cuve_id: 'x', kg_dom: 1000 }], cuves_vinif: [] });
    const h = A._vendVolContenu({ id: 'x' }).hl; return h === 7.41 && String(h).split('.')[1].length <= 2; }],
  A7: ['le repère des doses suit la porte, et sa légende parle des caisses, pas de la contenance', A => {
    A.__poser({ recoltes: [{ id: 'r', cuve_id: 'x', kg_dom: 480 }], cuves_vinif: [] });
    const r = A._vendIntrVol({ id: 'x', volume_hl: 5 }), l = A._vendIntrVolLbl('estime');
    return r.hl === 3.56 && r.src === 'estime' && /caisses/.test(l) && /135/.test(l) && !/contenance/.test(l)
      && /Aucune caisse/.test(A._vendIntrVolLbl('aucun')); }],
  // B — la chaîne
  B1: ['Ruchottes : 480 kg → 3,6 hL estimés, et PAS « 5 hL » ni « 2,8 hL » (contenance, taille du fût)', A => {
    const ch = chaine(A), s = svg(A, ch);
    return Math.abs(ch.estHl - 480 / 135) < 1e-9 && ch.entonneSrc === 'contenants' && s.includes('480 kg') && s.includes('3,6 hL estim\u00e9s')
      && !s.includes('>666<') && !s.includes('>373<') && !s.includes('5 hL') && !s.includes('2,8 hL'); }],
  B2: ['non mesuré, l’entonné reste en pointillé « à mesurer » ; « Après élevage » n’existe plus', A => {
    const s = svg(A, chaine(A));
    return s.includes('>Entonn\u00e9<') && s.includes('\u00e0 mesurer') && s.includes('stroke-dasharray="4 3"')
      && !s.includes('\u00e9levage') && s.includes('pas encore mesur\u00e9'); }],
  B3: ['des kilos à leur estimation : une conversion, pas une perte — aucun « −0 % »', A => {
    const s = svg(A, chaine(A)); return !/\u22120%/.test(s) && !/\+0%/.test(s); }],
  B3b: ['sans saignée, « Récolte » et « En cuve » disent le même nombre de cols (474, pas 474 puis 475)', A => {
    const s = svg(A, chaine(A)); return (s.match(/>474</g) || []).length === 2 && !s.includes('>475<'); }],
  B4: ['mesuré 2,5 hL : la barre Entonné (333) et −30 % sur l’estimation', A => {
    const s = svg(A, chaine(A, { vol_decuve_hl: 2.5, vol_decuve_src: 'mesure' }));
    return s.includes('>333<') && s.includes('\u221230%') && s.includes('2,5 hL') && !s.includes('\u00e0 mesurer'); }],
  B5: ['puis 320 bouteilles : −4 % sur l’entonné', A => {
    const d = RUCH({ vol_decuve_hl: 2.5, vol_decuve_src: 'mesure' });
    d.e.cuvees[0].nb_bouteilles = 320; A.__poser(d.v, d.e);
    const s = svg(A, A._caveBilanChaine(d.e.cuvees[0])); return s.includes('320 btl') && s.includes('\u22124%'); }],
  B6: ['la saignée se retire de l’estimation en cuve', A =>
    Math.abs(chaine(A, { operations: [{ type: 'saignee', volume_hl: 0.5 }] }).estHl - (480 / 135 - 0.5)) < 1e-9],
  B7: ['figé d’avant (contenance 5, fûts 2,8) sans cuve : ni l’un ni l’autre ne revient', A => {
    A.__poser({ recoltes: [], cuves_vinif: [] }, { cuvees: [] });
    const c = { id: 'old', nom: 'Vieille', nb_bouteilles: 360, bilan_perte: { recolteKg: 480, cuveHl: 5, eleveHl: 2.8 } };
    const ch = A._caveBilanChaine(c), s = svg(A, ch);
    return Math.abs(ch.estHl - 480 / 135) < 1e-9 && ch.entonneHl == null && !s.includes('>666<') && !s.includes('>373<') && s.includes('360 btl'); }],
  B8: ['figé récent (entonné mesuré) sans cuve : il se dessine', A => {
    A.__poser({ recoltes: [], cuves_vinif: [] }, { cuvees: [] });
    const ch = A._caveBilanChaine({ id: 'x', bilan_perte: { recolteKg: 480, estHl: 3.56, entonneHl: 2.5, entonneSrc: 'mesure', eleveHl: 2.8 } });
    return ch.entonneHl === 2.5 && ch.entonneSrc === 'mesure' && svg(A, ch).includes('>333<'); }],
  B9: ['le vivant passe devant le figé (mesure saisie après la mise)', A => {
    const d = RUCH({ vol_decuve_hl: 2.6, vol_decuve_src: 'mesure' });
    d.e.cuvees[0].bilan_perte = { recolteKg: 480, entonneHl: 2.4, entonneSrc: 'mesure' }; A.__poser(d.v, d.e);
    return A._caveBilanChaine(d.e.cuvees[0]).entonneHl === 2.6; }],
  B10: ['une seule étape dessinée : pas de graphe (et pas de barre inventée)', A => {
    A.__poser({ recoltes: [], cuves_vinif: [] }, { cuvees: [] });
    return A._caveBtlGraphSvg({ recolteKg: null, estHl: null, entonneHl: null, entonneSrc: null }, 1480, 600) === ''; }],
  // C — le registre
  C1: ['SO2 d’avant ce lot, cuve de 60 hL qui en contient 40 : 120 g (estimé), pas 180', A => {
    const l = registre(A, V40([{ id: 'o', type: 'so2', date: '2026-09-12', dose: 3 }]))[0];
    return /soit 120 g sur 40 hL \(estim\u00e9\)/.test(l.detail) && !/180/.test(l.detail); }],
  C2: ['le total de SO2 du registre suit : 120 g', A =>
    A._rmTotaux(registre(A, V40([{ id: 'o', type: 'so2', date: '2026-09-12', dose: 3 }]))).so2g === 120],
  C3: ['un SO2 qui porte son volume le garde, sans « (estimé) » s’il est saisi', A => {
    const l = registre(A, V40([{ id: 'o', type: 'so2', date: '2026-09-12', dose: 3, volume_hl: 30, vol_src: 'saisi' }]))[0];
    return /soit 90 g sur 30 hL/.test(l.detail) && !/estim/.test(l.detail); }],
  C4: ['sans caisse mais décuvée : le volume décuvé', A => {
    A.__poser({ recoltes: [], cuves_vinif: [] });
    const v = A._rmVolRepli({ recoltes: [] }, { id: 'z', volume_hl: 60, decuvage: { date: 'd' }, vol_decuve_hl: 26 });
    return v && v.hl === 26 && v.src === 'mesure'; }],
  C5: ['sans caisse et pas décuvée : aucun gramme inventé', A => {
    const l = registre(A, { recoltes: [], cuves_vinif: [CUVE40({ operations: [{ id: 'o', type: 'so2', date: '2026-09-12', dose: 3 }] })] })[0];
    return !/soit/.test(l.detail) && l.volume === null; }],
  C6: ['la colonne volume du registre est le contenu (40), pas la contenance (60)', A =>
    registre(A, V40([{ id: 'o', type: 'levurage', date: '2026-09-12', dose: 20 }]))[0].volume === 40],
  C7: ['une chaptalisation sur volume estimé l’imprime', A =>
    /24 hL trait\u00e9s \(estim\u00e9\)/.test(A._rmDetail({ type: 'chaptalisation', volume_hl: 24, vol_src: 'estime', degre: 1, kg_sucre: 40.4 }))],
  C8: ['une saignée de la cuve s’y retire aussi (repli : 40 − 5 = 35 hL)', A => {
    const l = registre(A, V40([{ id: 's', type: 'saignee', date: '2026-09-11', volume_hl: 5 },
                               { id: 'o', type: 'so2', date: '2026-09-12', dose: 2 }]));
    return l.some(x => /soit 70 g sur 35 hL/.test(x.detail)); }],
  // D — les écrans et les écritures
  D1: ['la feuille d’opération ne lit plus la contenance', (A, S) => !/c\.volume_hl/.test(code(S.cave, '_vendOpFields'))
    && /var ref=_vendIntrVol\(c\), vol=ref\.hl;/.test(code(S.cave, '_vendOpFields'))],
  D2: ['la carboglace se calcule sur le contenu', (A, S) => !/volume_hl/.test(code(S.cave, '_vendOpQteCalc'))],
  D3: ['une saignée neuve ne touche plus la contenance', (A, S) => {
    const f = code(S.cave, 'saveVendOp'); return f.includes('op.cap_intacte=true;') && !/c\.volume_hl=Math\.max/.test(f); }],
  D4: ['seules les saignées d’avant ce lot rendent de la contenance (correction ET suppression)', (A, S) =>
    code(S.cave, 'saveVendOp').includes("prev.type==='saignee'&&prev.volume_hl&&!prev.cap_intacte")
    && code(S.cave, '_vendOpDel').includes("op.type==='saignee'&&op.volume_hl&&!op.cap_intacte")],
  D5: ['la tournée : pas de kilos de sucre sans volume, et le SO2 porte le sien', (A, S) => {
    const f = code(S.cave, '_vtValider');
    return f.includes('op.kg_sucre=ref.hl>0?spd*v*ref.hl/10:null;') && f.includes('op.dose=v; op.volume_hl=ref.hl>0?ref.hl:null;')
      && !f.includes('op.kg_sucre=spd*v*ref.hl/10;'); }],
  D6: ['le SO2 du Cuvier a sa case de volume et son calcul, exporté', (A, S) => {
    const f = code(S.cave, '_vendOpFields');
    return f.includes('oninput="_vendSo2Calc()"') && f.includes('id="vop-so2g"') && S.cave.includes('window._vendSo2Calc=_vendSo2Calc;')
      && code(S.cave, 'saveVendOp').includes("op.vol_src=(op.volume_hl!=null)?"); }],
  D7: ['la liste des décuvées dit le volume parti au Chai', (A, S) => !/volume_hl/.test(code(S.cave, '_vendDecuveesSection'))
    && code(S.cave, '_vendDecuveesSection').includes('_vendVolLoge(c)')],
  D8: ['rattacher une récolte dit ce qui est DÉJÀ dedans', (A, S) => !/cv\.volume_hl\|\|0\)\+' hL en place/.test(S.cave)
    && code(S.cave, '_vendCuvAtt').includes('_vendDedansTxt(cv,_ridA)')],
  D9: ['la jauge du plan de cuverie lit la porte', (A, S) => code(S.cave, '_vendCellHtml').includes('var dedans=_vendVolContenu(c).hl;')],
  D10: ['le cahier de cuverie : « Contenance » et le contenu, chacun sous son nom', (A, S) => {
    const f = code(S.cave, '_cuvDoc');
    return f.includes("'<em>Contenance <b>'") && f.includes('totVol += _vendVolContenu(c).hl;') && !f.includes("'<em>Volume <b>' + _mvF1(c.volume_hl)"); }],
  D11: ['le tri du cahier s’appelle « Contenance »', (A, S) => /\{ v:'volume',\s+lbl:'Contenance'/.test(S.cave)],
  D12: ['Le millésime (vieux millésimes figés) ne relit plus la contenance', (A, S) => !/cuveHl/.test(code(S.cave, '_mlChaine'))],
  D13: ['la mise en bouteille fige les étapes, sans la contenance', (A, S) => {
    const f = code(S.cave, '_caveBtlConfirmYes'); return f.includes('entonneHl:ch.entonneHl') && !f.includes('cuveHl'); }],
  D14: ['la carte des courbes compte l’entonné MESURÉ et propose de le saisir', (A, S) => {
    const f = code(S.cave, '_pcrbChaine');
    return f.includes("ch.entonneSrc==='mesure'") && f.includes('_vendDvolCorriger') && !f.includes('cuveHl'); }],
  D15: ['la saisie ouverte depuis Le millésime repeint l’écran d’où l’on vient', (A, S) =>
    code(S.cave, '_vendDvolCorriger').includes("if(_caveSectionAct()==='vendange'||typeof renderCave!=='function') renderVendCuves(); else renderCave();")],   // ★ CUV-DEC (§164) : la section se lit par le Chai
  D16: ['l’onglet Bouteilles lit le vivant d’abord', (A, S) => code(S.cave, 'renderCaveBouteille').includes('var ch=_caveBilanChaine(c);')
    && !code(S.cave, 'renderCaveBouteille').includes('c.bilan_perte||_caveBilanChaine(c)')],
  D17: ['une chaptalisation sans volume ne dit pas « 0,0 kg de sucre »', A =>
    /volume inconnu/.test(A._vendOpDet({ type: 'chaptalisation', degre: 1, kg_sucre: null }))
    && A._vendOpDet({ type: 'chaptalisation', degre: 1, kg_sucre: 12.34 }) === '12,3 kg de sucre'],
  // E — l'accompagnement
  E1: ['l’aide ne dit plus que la contenance sert de repère', (A, S) =>
    !S.utils.includes('c’est sa <b>contenance</b> qui sert de repère') && S.utils.includes('estimé d’après ses caisses</b>')],
  E2: ['l’aide et l’info des courbes expliquent la chaîne', (A, S) =>
    S.utils.includes("['La chaîne De la récolte à la bouteille'") && S.utils.includes('r\\u00e9ellement entonn\\u00e9</b>')],
  E3: ['le guide : la carte de la chaîne, et plus de « repère proposé = contenance »', (A, S) =>
    S.g08.includes('{ic:bouteille} De la récolte à la bouteille') && !S.g08.includes('le repère proposé est la contenance')],
  E4: ['« Quoi de neuf » 7.42 le dit du point de vue du domaine', (A, S) =>
    avant(S.utils, "{ v: '7.42', items: [", 'suit le vin') && S.utils.includes('relisez celles de cette vendange')],
  E5: ['la démo montre une chaîne entière (volume décuvé mesuré)', (A, S) =>
    S.app.includes("vol_decuve_hl:50,vol_decuve_src:'mesure'")]
};

function jouer(S) {
  const r = {};
  let A = null;
  try { A = charger(S); } catch (e) { for (const k in T) r[k] = false; r.__err = e.message; return r; }
  for (const k in T) { try { r[k] = !!T[k][1](A, S); } catch (e) { r[k] = false; } }
  return r;
}

const V = '\x1b[32m', R = '\x1b[31m', Z = '\x1b[0m';
if (!CONTRE) {
  const r = jouer(SAIN); let ok = 0, ko = 0;
  if (r.__err) console.log('  ' + R + 'chargement : ' + r.__err + Z);
  for (const k in T) { if (r[k]) { ok++; console.log('  ' + V + '✓' + Z + ' ' + k + ' ' + T[k][0]); }
                       else { ko++; console.log('  ' + R + '✗ ' + k + ' ' + T[k][0] + Z); } }
  console.log('\nVOL-1 : ' + ok + ' vertes, ' + ko + ' rouges');
  process.exit(ko ? 1 : 0);
}

/* ══ CONTRE-ÉPREUVES — le défaut réintroduit, l'assertion doit rougir ══ */
const MUT = [
  ['cave', '_vendVolContenu', "if(!(kg>0)) return {hl:0, src:'aucun', kg:0};", "if(!(kg>0)) return {hl:parseFloat(c.volume_hl)||0, src:'estime', kg:0};", 'A3', 'la contenance redevient le repli d’une cuve sans caisse'],
  ['cave', '_vendVolContenu', '_vendHlKg(kg)-_vendSortiesHl(c)', '_vendHlKg(kg)', 'A2', 'la saignée reste dans la cuve'],
  ['cave', '_vendVolContenu', 'var kg=_vendCuvKgDom(c.id, exclId);', 'var kg=_vendCuvKgDom(c.id);', 'A5', 'la récolte corrigée compte deux fois'],
  ['cave', '_vendIntrVol', 'var v=_vendVolContenu(c);', 'var v={hl:(c&&c.volume_hl)||0, src:\'estime\'};', 'A7', 'le repère des doses redevient la contenance'],
  ['cave', '_caveBilanChaine', 'Math.max(0,_vendHlKg(recolteKg)-sorties)', 'Math.max(0,parseFloat(cv.volume_hl)||0)', 'B1', '« En cuve » redevient la contenance'],
  ['cave', '_caveBtlGraphSvg', "ent=(ch.entonneHl!=null&&ch.entonneSrc==='mesure')", 'ent=(ch.entonneHl!=null)', 'B1', 'la taille des fûts redevient l’entonné'],
  ['cave', '_caveBtlGraphSvg', '+(ec?(', '+(i>0?(', 'B3', 'la conversion kilos → hL affichée comme une perte (« +0 % »)'],
  ['cave', '_caveBilanChaine', "if(entSrc!=='mesure'&&bp&&", 'if(bp&&', 'B9', 'le figé passe devant une mesure'],
  ['cave', '_caveBilanChaine', 'Math.max(0,_vendHlKg(recolteKg)-sorties):null', 'Math.round(Math.max(0,_vendHlKg(recolteKg)-sorties)*100)/100:null', 'B3b', 'l’estimation arrondie avant la conversion (474 puis 475)'],
  ['cave', '_rmVolRepli', "return (c.decuvage && m > 0) ? {hl:m, src:'mesure'} : null;", "return {hl:_rmNum(c.volume_hl), src:'estime'};", 'C5', 'des grammes inventés sur la contenance'],
  ['cave', '_rmLignes', 'var _rv = _rmVolRepli(CAVE_VENDANGE, c);', "var _rv = {hl:_rmNum(c.volume_hl), src:'estime'};", 'C1', 'le repli du registre redevient la contenance'],
  ['cave', '_rmVolRepli', 'Math.max(0, _vendHlKg(kg) - _vendSortiesHl(c))', 'Math.max(0, _vendHlKg(kg))', 'C8', 'la saignée oubliée du registre'],
  ['cave', '_vtValider', 'op.kg_sucre=ref.hl>0?spd*v*ref.hl/10:null;', 'op.kg_sucre=spd*v*ref.hl/10;', 'D5', 'des kilos de sucre sans volume'],
  ['cave', 'saveVendOp', 'op.cap_intacte=true;', 'if(op.volume_hl>0) c.volume_hl=Math.max(0,(c.volume_hl||0)-op.volume_hl);', 'D3', 'la saignée mange la contenance'],
  ['cave', '_vendOpDel', "op.type==='saignee'&&op.volume_hl&&!op.cap_intacte", "op.type==='saignee'&&op.volume_hl", 'D4', 'une saignée neuve rend une contenance jamais prise'],
  ['cave', '_mlChaine', 'bp.cuve+=((isFinite(_en)&&_en>0)?_en:(b.eleveHl||0));', 'bp.cuve+=(b.cuveHl||0);', 'D12', 'le vieux millésime relit la contenance'],
  ['cave', '_vendOpFields', 'var ref=_vendIntrVol(c), vol=ref.hl;', 'var ref=_vendIntrVol(c), vol=c.volume_hl||0;', 'D1', 'la feuille repropose la contenance'],
  ['cave', '_cuvDoc', "'<em>Contenance <b>'", "'<em>Volume <b>'", 'D10', 'le cahier réécrit « Volume » sur la contenance'],
  ['cave', '_vendOpDet', "if(o.type==='chaptalisation') return (o.kg_sucre!=null)", "if(o.type==='chaptalisation') return true", 'D17', '« 0,0 kg de sucre » pour une tournée sans caisse']
];
let det = 0, rouge = 0;
const base = jouer(SAIN);
for (const [fic, nom, ancre, rempl, cle, lib] of MUT) {
  let src; try { const [a, b] = bornes(SAIN[fic], nom); src = SAIN[fic].slice(a, b); }
  catch (e) { rouge++; console.log('  ' + R + '✗ ' + cle + ' fonction introuvable : ' + nom + Z); continue; }
  const n = src.split(ancre).length - 1;
  if (n !== 1) { rouge++; console.log('  ' + R + '✗ ' + cle + ' ancre ' + (n ? 'double' : 'absente') + ' dans ' + nom + Z); continue; }
  if (!base[cle]) { rouge++; console.log('  ' + R + '✗ ' + cle + ' déjà rouge sur le code sain' + Z); continue; }
  const S = Object.assign({}, SAIN); S[fic] = SAIN[fic].replace(src, src.replace(ancre, rempl));
  let r; try { r = jouer(S); } catch (e) { r = { [cle]: false }; }
  if (!r[cle]) { det++; console.log('  ' + V + '✓' + Z + ' détecté (' + cle + ') : ' + lib); }
  else { rouge++; console.log('  ' + R + '✗ NON détecté (' + cle + ') : ' + lib + Z); }
}
console.log('\nContre-épreuves VOL-1 : ' + det + ' détectées sur ' + MUT.length);
process.exit(rouge ? 1 : 0);
