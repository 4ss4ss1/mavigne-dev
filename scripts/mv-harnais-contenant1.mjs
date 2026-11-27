// ═════════════════════════════════════════════════════════════════════════════
//  HARNAIS CONTENANT-1 (§621) — « NOUVELLE CUVÉE » : DES FÛTS OU UNE CUVE
// ═════════════════════════════════════════════════════════════════════════════
//  Remonté du terrain le 18/11 : un blanc élevé en cuve inox, collé la veille, ne pouvait pas
//  entrer au Chai avant la mise — « Nouvelle cuvée » exigeait au moins un tonneau. Seul le
//  décuvage du Cuvier proposait une cuve.
//
//  Sur les VRAIES fonctions extraites de src/cave.js (le contrôle d'avant l'écriture,
//  _cuvCuvePret, joué dans Node) et sur les vrais fichiers pour le reste.
//
//  CE QUE CE HARNAIS PROUVE
//   A. la fenêtre porte ses trois places : le choix, les fûts (inchangés, dans leur enveloppe),
//      la cuve ;
//   B. le contrôle d'avant l'écriture, JOUÉ : rien de choisi, une cuve libre, trop de volume,
//      une cuve prise entre-temps, une cuve déclarée sur place (administrateur seul, nom,
//      contenance, doublon) ;
//   C. l'écriture : la cuve est vérifiée AVANT toute écriture, déclarée au parc AVANT la cuvée,
//      et la cuvée la porte dans cuves[] — jamais dans tonneaux[] ;
//   D. « Modifier la cuvée » ne change pas : la fenêtre repart à zéro à chaque ouverture et
//      une cuvée existante n'a pas le choix (ses cuves se changent dans sa fiche) ;
//   E. les gestes de la fenêtre sont exposés (onclick) ;
//   F. l'aide, le guide et « Quoi de neuf » le disent.
//
//  Usage :  node scripts/mv-harnais-contenant1.mjs
//           node scripts/mv-harnais-contenant1.mjs --contre
// ═════════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { lireCave } from './mv-cave-src.mjs';
import { texteTutosDepot } from './mv-tutos-sources.mjs';   // ★ COULEUR-1 (§625) : le moteur des tutos et ses listes par module
const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SAIN = {
  cave: lireCave(), idx: lire('index.html'), utils: lire('src/utils.js'), wn: lire('src/whats-new.js'),
  g08: lire('guide/08-cave.html'), tu: texteTutosDepot()
};

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
const avant = (t, a, b) => t.indexOf(a) >= 0 && t.indexOf(b) >= 0 && t.indexOf(a) < t.indexOf(b);

// Le bloc de la fenêtre dans index.html : de son ouverture à l'overlay suivant.
function fenetre(idx) {
  const i = idx.indexOf('id="ovCuveeMgmt"');
  if (i < 0) return '';
  const j = idx.indexOf('<div class="overlay"', i + 10);
  return idx.slice(i, j < 0 ? idx.length : j);
}

const PRELUDE = `
var PARC = [], OCC = {}, ADMIN = true, TOASTS = [];
var _cuvCuveRef = null, _cuvCuveL = 0, _cuvNeuve = { nom:'', litres:0, matiere:'inox' }, _cuvContRendu = 0;
var MV_CUVE_MAT = { inox:{lbl:'Inox',ouille:false}, beton:{lbl:'B\\u00e9ton',ouille:false}, bois:{lbl:'Bois',ouille:true} };
function _caveMatKey(m){ return MV_CUVE_MAT[m] ? m : 'inox'; }
function _caveParc(){ return PARC; }
function _caveCuve(id){ return PARC.filter(function(p){ return p.id===id; })[0] || null; }
function _caveCuveOcc(id){ return OCC[id] || null; }
function isAdmin(){ return ADMIN; }
function showToast(m){ TOASTS.push(m); }
function _cuvContRender(){ _cuvContRendu++; }
function __pose(o){
  PARC = o.parc || []; OCC = o.occ || {}; ADMIN = o.admin !== false; TOASTS = [];
  _cuvCuveRef = (o.ref === undefined) ? null : o.ref; _cuvCuveL = o.l || 0;
  _cuvNeuve = Object.assign({ nom:'', litres:0, matiere:'inox' }, o.neuve || {});
}
function __etat(){ return { toasts: TOASTS.slice(), ref: _cuvCuveRef, rendu: _cuvContRendu }; }
`;
function charger(S) {
  const code = PRELUDE + ['_cuvCuveCible', '_cuvCuvePret'].map(n => fn(S.cave, n)).join('\n')
    + '\n;({ _cuvCuvePret, _cuvCuveCible, __pose, __etat })';
  return vm.runInNewContext(code, {});
}
const C3 = { id: 'c3', nom: 'Cuve 3', litres: 2400, matiere: 'inox' };
const F1 = { id: 'f1', nom: 'Foudre', litres: 3000, matiere: 'bois' };

const T = {
  // A — la fenêtre
  A1: ['la fenêtre porte la place du choix, avant les fûts', (A, S) => avant(fenetre(S.idx), 'id="cuv-cont-body"', 'id="cuv-futs-wrap"')],
  A2: ['les fûts gardent leurs champs, dans leur enveloppe', (A, S) => {
    const f = fenetre(S.idx), w = f.indexOf('id="cuv-futs-wrap"');
    return w >= 0 && avant(f.slice(w), 'id="cuv-tonneaux-body"', 'id="cuv-cuve-body"') && f.slice(w).includes('addCuvTonneau()'); }],
  A3: ['la place de la cuve suit les fûts, avant le statut', (A, S) => avant(fenetre(S.idx), 'id="cuv-cuve-body"', 'id="cuv-statut"')],
  // B — le contrôle d'avant l'écriture, JOUÉ
  B1: ['rien de choisi : refusé, on le dit', A => { A.__pose({ parc: [C3] }); return A._cuvCuvePret() === null && /Choisissez la cuve/.test(A.__etat().toasts[0] || ''); }],
  B2: ['une cuve libre et 22 hL sur 24 : accepté, sans cuve neuve', A => {
    A.__pose({ parc: [C3], ref: 'c3', l: 2200 }); const r = A._cuvCuvePret();
    return !!r && r.ref === 'c3' && r.litres === 2200 && r.neuve === null && r.nom === 'Cuve 3'; }],
  B3: ['plus que la contenance : refusé', A => { A.__pose({ parc: [C3], ref: 'c3', l: 2500 }); return A._cuvCuvePret() === null && /contenance/.test(A.__etat().toasts[0] || ''); }],
  B4: ['volume vide : refusé', A => { A.__pose({ parc: [C3], ref: 'c3', l: 0 }); return A._cuvCuvePret() === null && /volume/.test(A.__etat().toasts[0] || ''); }],
  B5: ['une cuve prise entre-temps : refusée, le choix se vide et l’écran se redessine', A => {
    A.__pose({ parc: [C3], ref: 'c3', l: 2000, occ: { c3: { type: 'vinif', nom: 'X' } } });
    const n0 = A.__etat().rendu, r = A._cuvCuvePret(), e = A.__etat();
    return r === null && e.ref === null && e.rendu === n0 + 1 && /prise/.test(e.toasts[0] || ''); }],
  B6: ['déclarer une cuve : réservé à l’administrateur', A => {
    A.__pose({ admin: false, ref: '', l: 2000, neuve: { nom: 'Cuve inox 4', litres: 2400 } });
    return A._cuvCuvePret() === null && /administrateur/.test(A.__etat().toasts[0] || ''); }],
  B7: ['déclarer une cuve : un nom est demandé', A => {
    A.__pose({ ref: '', l: 2000, neuve: { nom: '  ', litres: 2400 } }); return A._cuvCuvePret() === null && /nom/.test(A.__etat().toasts[0] || ''); }],
  B8: ['déclarer une cuve : contenance entre 100 et 100 000 L', A => {
    A.__pose({ ref: '', l: 40, neuve: { nom: 'Petite', litres: 50 } }); const a = A._cuvCuvePret() === null;
    A.__pose({ ref: '', l: 40, neuve: { nom: 'Géante', litres: 200000 } }); return a && A._cuvCuvePret() === null; }],
  B9: ['déclarer une cuve : un nom déjà au parc est refusé, casse comprise', A => {
    A.__pose({ parc: [C3], ref: '', l: 2000, neuve: { nom: 'cuve 3', litres: 2400 } }); return A._cuvCuvePret() === null && /existe/.test(A.__etat().toasts[0] || ''); }],
  B10: ['déclarer une cuve : accepté, avec sa matière, son id de parc et la cuvée qui la désigne', A => {
    A.__pose({ parc: [C3], ref: '', l: 2200, neuve: { nom: 'Cuve inox 4', litres: 2400, matiere: 'beton' } }); const r = A._cuvCuvePret();
    return !!r && !!r.neuve && /^cvi_/.test(r.neuve.id) && r.ref === r.neuve.id && r.neuve.litres === 2400 && r.neuve.matiere === 'beton' && r.litres === 2200; }],
  B11: ['une matière inconnue retombe sur l’inox', A => {
    A.__pose({ ref: '', l: 1000, neuve: { nom: 'Z', litres: 1200, matiere: 'plastique' } }); const r = A._cuvCuvePret(); return !!r && r.neuve.matiere === 'inox'; }],
  B12: ['la cible lit la cuve du parc, ou celle qu’on déclare', A => {
    A.__pose({ parc: [F1], ref: 'f1' }); const a = A._cuvCuveCible();
    A.__pose({ ref: '', neuve: { nom: 'N', litres: 900, matiere: 'bois' } }); const b = A._cuvCuveCible();
    A.__pose({ ref: null }); const c = A._cuvCuveCible();
    return a && a.litres === 3000 && a.matiere === 'bois' && b && b.litres === 900 && b.matiere === 'bois' && c === null; }],
  // C — l'écriture
  C1: ['la cuve est vérifiée AVANT toute écriture', (A, S) => { const f = fn(S.cave, 'saveCuvee'); return avant(f, '_cvPret=_cuvCuvePret()', 'CAVE_ELEVAGE.cuvees.push(') && avant(f, '_cvPret=_cuvCuvePret()', 'fbSaveToast('); }],
  C2: ['en cuve, aucun fût n’est écrit', (A, S) => /_cvPret=_cuvCuvePret\(\); if\(!_cvPret\) return;\s*tonneaux=\[\]; nbTotal=0;/.test(fn(S.cave, 'saveCuvee'))],
  C3: ['la cuve déclarée rejoint le parc AVANT la cuvée', (A, S) => avant(fn(S.cave, 'saveCuvee'), '_caveParcSave(_caveParc().concat([_cvPret.neuve]))', 'CAVE_ELEVAGE.cuvees.push(')],
  C4: ['la cuvée porte la cuve dans cuves[], au volume vérifié', (A, S) => fn(S.cave, 'saveCuvee').includes('.cuves=[{ref:_cvPret.ref, litres:_cvPret.litres}]')],
  C5: ['seulement pour une cuvée NOUVELLE', (A, S) => fn(S.cave, 'saveCuvee').includes("if(!existId && _cuvCont==='cuve'){")],
  C6: ['« au moins un tonneau » reste la règle des fûts (et d’une cuvée modifiée sans cuve)', (A, S) =>
    fn(S.cave, 'saveCuvee').includes("if(!nbTotal && !_cvPret && !(_exC && (_exC.cuves||[]).length)){showToast('Indiquez au moins un tonneau'")],
  C7: ['« Prêt à mettre en bouteille » dit la cuve d’une cuvée en cuve, pas « 0 fûts »', (A, S) => {
    const f = fn(S.cave, 'renderCaveBouteille'); return f.includes("(_caveContenantsHtml(c)||'aucun contenant')+' · '+_mvF1(hl)+' hL élevés") && !f.includes("_caveNbTonneaux(c)+' fûts · '"); }],
  // D — la fenêtre repart à zéro ; une cuvée existante n'a pas le choix
  D1: ['chaque ouverture repart à zéro (fûts, rien de choisi)', (A, S) => {
    const o = fn(S.cave, 'openOvCavee'), r = fn(S.cave, '_cuvContReset');
    return o.includes('_cuvContReset(cuv?cuvId:null)') && r.includes("_cuvCont='futs'") && r.includes('_cuvCuveRef=null') && r.includes('_cuvCuveVolMan=false'); }],
  D2: ['une cuvée existante : pas de choix, ses cuves se lisent, les fûts restent', (A, S) => {
    const f = fn(S.cave, '_cuvContRender'), i = f.indexOf('if(_cuvContEdit){'), j = f.indexOf('return;', i);
    const b = f.slice(i, j);
    return i >= 0 && b.includes("fw.style.display=''") && b.includes('Contenants') && !b.includes('_cuvContSet'); }],
  D3: ['aucune cuve libre : la déclaration s’ouvre d’elle-même', (A, S) => fn(S.cave, '_cuvContRender').includes("if(_cuvCuveRef===null && !_cuvCuvesLibres().length) _cuvCuveRef='';")],
  D4: ['la frappe ne redessine pas (le curseur reste)', (A, S) => !/_cuvContRender\(|innerHTML/.test(fn(S.cave, '_cuvNvSaisie')) && !/_cuvContRender\(|innerHTML/.test(fn(S.cave, '_cuvCuveVol'))],
  // E — les gestes exposés
  E1: ['les cinq gestes de la fenêtre sont sur window', (A, S) =>
    ['_cuvContSet', '_cuvCuvePick', '_cuvNvSaisie', '_cuvNvMat', '_cuvCuveVol'].every(n => new RegExp('^window\\.' + n + '\\s*=\\s*' + n + ';', 'm').test(S.cave))],
  // F — l'accompagnement
  F1: ['le guide dit « Où est le vin ? » et la cuve déclarée sur place', (A, S) => S.g08.includes('Où est le vin') && /déclar\S* sur place|déclarez-la sur place/.test(S.g08)],
  F2: ['l’aide de la Cave le dit', (A, S) => S.utils.includes('Une cuvée en cuve, dès sa création')],
  F3: ['« Quoi de neuf » l’annonce (bloc 11.42, pour l’administrateur)', (A, S) => {
    const i = S.wn.indexOf("{ v: '11.42'"); const b = i < 0 ? '' : S.wn.slice(i, S.wn.indexOf('] },', i));
    return b.includes('CONTENANT-1') && /cuve/.test(b) && b.includes("pour: ['admin']"); }],
  F4: ['le tuto « créer une cuvée en cuve » enseigne le choix, la cuve déclarée et l’enregistrement', (A, S) => {
    const i = S.tu.indexOf("{ id: 'cuvee-cuve'"), b = i < 0 ? '' : S.tu.slice(i, S.tu.indexOf("\n  { id: '", i + 10));
    return ['openOvCavee', '_cuvContSet', '_cuvNvSaisie', '_cuvNvMat', '_cuvCuveVol', 'saveCuvee'].every(n => b.includes("'" + n + "'"))
      && b.includes('[data-tuto="cuv.encuve"]') && b.includes('reel: function') && b.includes('facultatif: true'); }]
};

/* ══ EXÉCUTION ══ */
function jouer(S) {
  let A = null, err = null;
  try { A = charger(S); } catch (e) { err = e; }
  const res = {};
  for (const [k, [, f]] of Object.entries(T)) {
    try { res[k] = !!f(A, S); } catch (e) { res[k] = false; }
  }
  return { res, err };
}

/* ══ CONTRE-ÉPREUVES — chaque ancre UNIQUE dans le fichier visé, injection en mémoire ══ */
const CASSES = [
  ['cave', "if(_caveCuveOcc(p.id)){ showToast((p.nom||'La cuve')+' vient d’être prise'", "if(false){ showToast((p.nom||'La cuve')+' vient d’être prise'", 'B5', 'le dernier filet sur la cuve prise'],
  ['cave', "if(cap>0&&_cuvCuveL>cap){ showToast(", "if(false){ showToast(", 'B3', 'le volume au-delà de la contenance'],
  ['cave', "if(!(typeof isAdmin==='function'&&isAdmin())){ showToast('Déclarer une cuve", "if(false){ showToast('Déclarer une cuve", 'B6', 'la déclaration ouverte à tous'],
  ['cave', "if(dbl){ showToast(", "if(false){ showToast(", 'B9', 'le doublon de nom'],
  ['cave', "    tonneaux=[]; nbTotal=0;\n", "    nbTotal=0;\n", 'C2', 'des fûts écrits sur une cuvée en cuve'],
  ['cave', ".cuves=[{ref:_cvPret.ref, litres:_cvPret.litres}]", ".tonneaux=[{ref:_cvPret.ref, litres:_cvPret.litres}]", 'C4', 'la cuve glissée dans tonneaux[]'],
  ['cave', "  _cuvContReset(cuv?cuvId:null);", "  void 0;", 'D1', 'la fenêtre qui garde le choix d’avant'],
  ['cave', "if(_cuvCuveRef===null && !_cuvCuvesLibres().length) _cuvCuveRef='';", "void 0;", 'D3', 'un choix à une seule option'],
  ['idx', '<div id="cuv-cuve-body"></div>', '', 'A3', 'la place de la cuve oubliée'],
  ['cave', "window._cuvNvMat            = _cuvNvMat;\n", "", 'E1', 'un geste non exposé'],
  ['cave', "(_caveContenantsHtml(c)||'aucun contenant')+' · '+_mvF1(hl)+' hL élevés", "_caveNbTonneaux(c)+' fûts · '+_mvF1(hl)+' hL élevés", 'C7', '« 0 fûts » revenu aux Bouteilles'],
  ['tu', "      { type: 'taper', facultatif: true, cible: '[data-tuto=\"cuv.vol\"]'", "      { type: 'taper', cible: '[data-tuto=\"cuv.vol\"]'", 'F4', 'le volume proposé redevient une étape obligatoire (le miroir sauterait)']
];

const sain = jouer(SAIN);
let rouge = 0;
if (sain.err) { console.log('  \x1b[31m✗\x1b[0m chargement : ' + sain.err.message); rouge++; }
for (const [k, [lbl]] of Object.entries(T)) {
  const ok = sain.res[k];
  if (!ok) rouge++;
  if (!CONTRE) console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + k + ' — ' + lbl);
}
if (!CONTRE) {
  console.log('\n' + (rouge ? '\x1b[31m✗ ' + rouge + ' rouge(s)\x1b[0m' : '\x1b[32m✓ ' + Object.keys(T).length + ' vertes, 0 rouge\x1b[0m'));
  process.exit(rouge ? 1 : 0);
}
if (rouge) { console.log('\x1b[31m✗ le code sain n’est pas vert : contre-épreuve impossible\x1b[0m'); process.exit(1); }
let det = 0;
for (const [f, de, vers, cle, nom] of CASSES) {
  const n = SAIN[f].split(de).length - 1;
  if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ancre ' + (n ? 'non unique (' + n + ')' : 'introuvable') + ' : ' + nom); rouge++; continue; }
  const S = Object.assign({}, SAIN, { [f]: SAIN[f].replace(de, vers) });
  const r = jouer(S);
  const vu = r.err || !r.res[cle];
  console.log('  ' + (vu ? '\x1b[32m✓\x1b[0m DÉTECTÉ ' : '\x1b[31m✗\x1b[0m MANQUÉ  ') + ' ' + nom + ' (' + cle + ')');
  if (vu) det++; else rouge++;
}
console.log('\n' + (rouge ? '\x1b[31m✗ ' + rouge + ' contre-épreuve(s) manquée(s)\x1b[0m' : '\x1b[32m✓ ' + det + '/' + CASSES.length + ' défauts détectés\x1b[0m'));
process.exit(rouge ? 1 : 0);
