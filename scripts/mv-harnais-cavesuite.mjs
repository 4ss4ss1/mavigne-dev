// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════
//  HARNAIS CAVE-SUITE (§627) — LA CAVE JUSQU'À LA BOUTEILLE, ET LES GESTES CONFIÉS
// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════
//  Nico, 27/11 : « go » sur la maquette v2 « la suite » (onze choix, recommandations validées) — un seul lot pour
//  GESTES-2, MASSE-1, MISE-1, MISE-2 et PROG-CAVE.
//
//  Sur les VRAIES fonctions extraites de src/cave-mise.js (jouées dans Node) et sur les vrais fichiers pour le branchement.
//
//  CE QUE CE HARNAIS PROUVE
//   A. la mise en masse : tout le vin dans une cuve (libre ou la sienne), le volume mesuré, les lies et pertes ; les fûts
//      rendus au parc (motif « masse ») ; chaque refus AVANT d'écrire (pas de cuve, rien de mesuré, trop pour la cuve, plus
//      de 5 % au-dessus, cuve prise) ;
//   B. la mise : les besoins en matières sèches d'après les formats ; le n° de lot proposé ; une mise en partie (le reste
//      en cuve) puis la dernière (en stock, la cuve libre) ; le stock par format et son équivalent 75 cl ; les refus AVANT
//      d'écrire ; La Réserve compte les sorties des mises ; « Annuler la dernière mise » défait tout ;
//   C. le compte à rebours : ce que l'appli sait déjà se coche tout seul (labo, collage, soutirage après collage, SO₂,
//      filtration, une cuvée déjà en cuve) ; les matières sèches qui manquent le disent ;
//   D. les rappels du Chai dans « À faire » : soutirer après un collage, bâtonner, la suite de la dernière dégustation
//      jusqu'au geste qui la solde, la préparation d'une mise ; une date passée arrive aujourd'hui, « due » ;
//   E. coller et stabiliser : la couleur et l'allergène d'un produit ; le rappel du soutirage ; un refus sans méthode ;
//   F. confier un geste : soldé par l'opération (même geste, même cuvée, depuis le jour où il a été confié) ; accroché à
//      la ligne du même geste ou à part ; en retard, il arrive aujourd'hui ; le message du matin ; les refus AVANT d'écrire ;
//      l'équipe du jour d'après le planning, tout le monde sans planning ;
//   G. le branchement (cave.js, index.html, reserve.js, jalons.js, reglages.js, utils.js, pilotage.js, le registre) ;
//   H. les trois tutos, la couverture, l'aide, le guide, « Quoi de neuf ».
//
//  Usage :  node scripts/mv-harnais-cavesuite.mjs
//           node scripts/mv-harnais-cavesuite.mjs --contre
// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { texteTutosDepot } from './mv-tutos-sources.mjs';
const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SAIN = {
  cm: lire('src/cave-mise.js'), cave: lire('src/cave.js'), idx: lire('index.html'), rsv: lire('src/reserve.js'), jal: lire('src/jalons.js'),
  reg: lire('src/reglages.js'), utils: lire('src/utils.js'), pil: lire('src/pilotage.js'), wn: lire('src/whats-new.js'), g08: lire('guide/08-cave.html'),
  tu: texteTutosDepot(), cov: lire('scripts/tutos-couverture.json'), src: lire('scripts/mv-cave-src.mjs')
};

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
const fn = (src, nom) => { const [a, b] = bornes(src, nom); return src.slice(a, b); };
const avant = (t, a, b) => t.indexOf(a) >= 0 && t.indexOf(b) >= 0 && t.indexOf(a) < t.indexOf(b);
function vars(src, noms) {
  return noms.map((v) => {
    const i = src.search(new RegExp('^var ' + v + '\\s*=', 'm')); if (i < 0) throw new Error(v + ' introuvable');
    const j = src.indexOf(';\n', i); return src.slice(i, j + 1);
  }).join('\n');
}

/* Le décor : une Cave, un parc, La Réserve, un planning, le DOM d'une feuille ; les fonctions de cave.js lues par window. */
const PRELUDE = `
var DOM = {}, TOASTS = [], AUJ = '2026-11-27', SAUVE = 0, PARC = [], OCC = {}, STOCK = {}, PRODS = [], LIBERES = [], PP = null, MEMBRES = [], CAVEJ = {};
var CE = { cuvees: [], operations: [], analyses: [] };
var window = { CAVE_ELEVAGE: CE, currentUser: { nom: 'Nico' }, INTRANTS: { produits: [] }, CONFIG: { cave: {} },
  _mlAuj: function () { return AUJ; },
  _caveVolL: function (c) { var f = (c.tonneaux || []).reduce(function (s, t) { return s + (t.nb || 0) * (t.l || 228); }, 0), v = (c.cuves || []).reduce(function (s, x) { return s + (parseFloat(x.litres) || 0); }, 0); return f + v - (c.manque_l || 0); },
  _caveNbTonneaux: function (c) { return (c.tonneaux || []).reduce(function (s, t) { return s + (t.nb || 0); }, 0); },
  _caveParc: function () { return PARC; }, _caveCuve: function (id) { return PARC.filter(function (p) { return p.id === id; })[0] || null; },
  _caveCuveOcc: function (id) { return OCC[id] || null; }, _caveGroupesL: function () { return []; }, _caveMat: function () { return { lbl: 'Inox' }; },
  _mvFutLiberer: function (c, I, note, motif) { var n = window._caveNbTonneaux(c); LIBERES.push({ n: n, motif: motif || 'embouteille' }); return n; },
  _mvFutDispo: function () { return { manque: 0 }; }, _mvFutReprendre: function () { return 1; },
  _rsvStockPour: function (id) { return (id in STOCK) ? { q: STOCK[id] } : null; },
  _caveBilanChaine: function () { return { recolteKg: 1000, estHl: 7, entonneHl: 6.9, entonneSrc: 'mesure' }; },
  _caveFmlEtat: function () { return null; }, _caveCuveSource: function () { return null; },
  _planPrisesDePoste: function (n, iso) { var o = {}; o[iso] = PP || {}; return o; },
  _mvCaveJour: function (nom, iso) { return (CAVEJ[iso] || {})[nom] || ''; },
  _vendLastMes: function (v) { return (v.mesures || [])[0] || null; },
  fbSaveToast: function () { SAUVE++; }, saveIntrants: function () {}, saveData: function () {}, confirm: function () { return true; }
};
var document = { getElementById: function (id) { return (id in DOM) ? { value: DOM[id], dataset: {} } : null; }, querySelector: function (s) { var m = /data-q="([a-z0-9]+)"/.exec(s); return (m && ('q:' + m[1]) in DOM) ? { value: DOM['q:' + m[1]] } : null; }, querySelectorAll: function () { return []; } };
function isAdmin(){ return window.currentUser.roles ? window.currentUser.roles.indexOf('admin') >= 0 : true; } function isSaisonnier(){ return false; } function canWrite(){ return true; }
function showToast(t){ TOASTS.push(t); } function _escHtml(s){ return String(s == null ? '' : s); } function _escAttr(s){ return String(s == null ? '' : s); } function _mvIcon(){ return ''; }
function __pose(o){ o = o || {}; CE.cuvees = o.cuvees || []; CE.operations = o.ops || []; CE.analyses = o.anas || []; CE.consignes = o.cons || [];
  DOM = o.dom || {}; TOASTS = []; SAUVE = 0; PARC = o.parc || []; OCC = o.occ || {}; STOCK = o.stock || {}; LIBERES = []; PP = o.pp === undefined ? null : o.pp; CAVEJ = o.cavej || {};
  window.MEMBRES = o.membres || []; window.INTRANTS.produits = o.prods || []; window.CAVE_VENDANGE = { cuves_vinif: o.cuves || [] }; if (o.auj) AUJ = o.auj; else AUJ = '2026-11-27';
  window.currentUser = o.user || { nom: 'Nico' }; }
function __etat(){ return { toasts: TOASTS.slice(), sauve: SAUVE, liberes: LIBERES.slice() }; }
`;
const NOMS = ['_cmCE', '_cmCuvee', '_cmIso', '_cmD', '_cmAuj', '_cmAddJ', '_cmEcart', '_cmFr', '_cmNb', '_cmV1', '_cmHl', '_cmNum', '_cmVal', '_cmNom', '_cmQui', '_cmGarde',
  '_cmVolL', '_cmNbFuts', '_cmCoul', '_cmOps', '_cmEnreg', '_cmRepeindre', '_cmFermer',
  '_msCuves', '_msErreur', 'saveMasse', '_cmOpTitre',
  '_cmFmtL', '_cmFmtN', '_cmFmtTxt', '_cmProduitsCave', '_cmStock', '_cmBesoins', '_cmDevine', '_cmMsDefaut', '_cmAllergenes', '_cmAllergeneDe', '_cmChecks',
  '_cmMsDomaine', '_miLotDefaut', '_miFin', 'saveMise', '_cmStockNb', '_cmMiseAnnuler', '_cmConsoMise',
  '_cmColle', '_cmCoulsSel', '_cmOpData', '_cmOpReset', '_cmOpProd',
  '_cmDer', '_cmTitre', '_cmSuiteSoldee', '_cmPrete', '_cmAgenda',
  '_pcListe', '_pcCuve', '_pcSolde', '_pcOuvertes', '_pcNomCible', '_pcTexte', '_pcEquipe', '_pcGarder', 'savePc', '_pcAgenda', '_pcNotifLignes', '_pcMiens'];
const VARS = ['_CM_MOIS', '_CM_FMT', '_CM_ROLES', '_CM_DEVINE', '_CM_ALL', '_CM_COLLES', '_CM_STAB', '_CM_SIG', '_CM_SUITE', '_PC_VERBE', '_PC_OP', '_PC_CUVE', '_PC_MOM', '_PC_MOTIFS'];
function charger(S) {
  const code = PRELUDE + vars(S.cm, VARS) + '\nvar _msEt = null, _mpEt = null, _miEt = null, _pcEt = null, _cmOp = { vue: "", all: null, essai: false, rappel: 10, quoi: "tart", meth: "", test: "", proch: 7 };\n'
    + NOMS.map((n) => fn(S.cm, n)).join('\n')
    + '\n;({ ' + NOMS.join(', ') + ', __pose, __etat, CE: CE, '
    + '__ms: function (o) { _msEt = o; }, __mi: function (o) { _miEt = o; }, __pc: function (o) { _pcEt = o; }, __op: function (o) { _cmOp = Object.assign(_cmOp, o); }, __cop: function (l) { window._copNouvCuvs = function () { return l; }; } })';
  return vm.runInNewContext(code, {});
}
const fut = (o) => Object.assign({ id: 'gv', nom: 'Gevrey VV', millesime: 2025, couleur: 'r', statut: 'elevage', tonneaux: [{ annee: 2025, nb: 10, l: 228 }], cuves: [] }, o || {});
const bb = (o) => Object.assign({ id: 'bb', nom: 'Bourgogne Blanc', millesime: 2025, couleur: 'b', statut: 'elevage', tonneaux: [], cuves: [{ ref: 'ci4', litres: 2150 }] }, o || {});
const PARC0 = [{ id: 'ci2', nom: 'Cuve inox 2', litres: 3000 }, { id: 'cb1', nom: 'Cuve béton 1', litres: 2000 }];

const T = {
  A1: ['la mise en masse : tout le vin dans la cuve, le volume mesuré, les lies ; les fûts rendus (motif « masse ») ; un soutirage noté', (A) => {
    const c = fut(); A.__pose({ cuvees: [c], parc: PARC0, dom: { 'ms-l': '2150', 'ms-d': '2026-11-27' } }); A.__ms({ id: 'gv', vers: 'ci2' });
    A.saveMasse(); const e = A.__etat(), o = A.CE.operations[0];
    return c.tonneaux.length === 0 && c.cuves.length === 1 && c.cuves[0].ref === 'ci2' && c.cuves[0].litres === 2150 && e.liberes[0].n === 10 && e.liberes[0].motif === 'masse'
      && o.type === 'soutirage' && o.data.masse.de_l === 2280 && o.data.masse.l === 2150 && o.data.masse.perte_l === 130 && o.data.masse.futs === 10 && e.sauve === 1; }],
  A2: ['la mise en masse refuse AVANT d’écrire : pas de cuve, rien de mesuré, trop pour la cuve, +5 %, une cuve prise', (A) => {
    const cas = [[{ vers: null }, { 'ms-l': '2150' }], [{ vers: 'ci2' }, { 'ms-l': '0' }], [{ vers: 'cb1' }, { 'ms-l': '2150' }], [{ vers: 'ci2' }, { 'ms-l': '2500' }], [{ vers: 'ci2' }, { 'ms-l': '2150' }, { ci2: { nom: 'Fixin' } }]];
    return cas.every(([et, dom, occ]) => {
      const c = fut(); A.__pose({ cuvees: [c], parc: PARC0, dom: dom, occ: occ || {} }); A.__ms(Object.assign({ id: 'gv' }, et)); A.saveMasse();
      return c.tonneaux.length === 1 && c.cuves.length === 0 && A.CE.operations.length === 0 && A.__etat().toasts.length === 1 && A.__etat().liberes.length === 0;
    }); }],
  A3: ['une cuve à elle se propose ; une cuve prise ailleurs se dit', (A) => {
    const c = fut({ cuves: [{ ref: 'cb1', litres: 300 }] }); A.__pose({ cuvees: [c], parc: PARC0, occ: { ci2: { nom: 'Fixin' }, cb1: { nom: 'Gevrey VV' } } });
    const L = A._msCuves(c); return L.filter((x) => x.p.id === 'cb1')[0].mine && !L.filter((x) => x.p.id === 'cb1')[0].occ && L.filter((x) => x.p.id === 'ci2')[0].occ.nom === 'Fixin'; }],
  B1: ['les matières sèches d’après les formats : une bouteille, un bouchon, une capsule, une étiquette ; un carton pour 6 ou 12', (A) => {
    const b = A._cmBesoins({ '75': 2600, '150': 30, '37.5': 0 }, 6), b12 = A._cmBesoins({ '75': 2600 }, 12);
    return b.bt75 === 2600 && b.bt150 === 30 && b.bt375 === 0 && b.bouchon === 2630 && b.capsule === 2630 && b.etiq === 2630 && b.cetiq === 2630 && b.carton === 434 && b12.carton === 217
      && A._cmFmtL({ '75': 2600, '150': 30 }) === 1995 && A._cmFmtN({ '75': 2600, '150': 30, '37.5': 4 }) === 2634; }],
  B2: ['le n° de lot se propose : « L », le millésime, les initiales, le rang de la mise', (A) =>
    A._miLotDefaut(bb()) === 'L25BB1' && A._miLotDefaut(bb({ mises: [{}] })) === 'L25BB2' && A._miLotDefaut({ nom: 'Clos de la Roche', millesime: 2024 }) === 'L24CR1'],
  B3: ['une mise en partie : le reste en cuve, le stock par format, l’équivalent 75 cl, les sorties notées ; la préparation consommée', (A) => {
    const c = bb({ mise_prev: { date: '2026-12-09' } }); A.__pose({ cuvees: [c], dom: { 'mi-d': '2026-11-27', 'mi-lot': 'L25BB1', 'mi-o2': '0,8', 'q:bouchon': '1200' } });
    A.__mi({ id: 'bb', par: 'dom', fmt: { '75': 1200, '150': 0, '37.5': 0 }, ms: { bt75: 'b75', bouchon: 'bou' }, carton: 6, fin: 'reste', garde: {} }); A.saveMise();
    const m = c.mises[0];
    return c.statut === 'elevage' && c.cuves[0].litres === 1250 && m.reste_l === 1250 && !m.final && m.l === 900 && c.stock_fmt['75'] === 1200 && c.nb_bouteilles === 1200
      && m.ms.filter((x) => x.prod === 'b75')[0].q === 1200 && m.ms.filter((x) => x.prod === 'bou')[0].q === 1200 && c.mise_o2 === 0.8 && !c.mise_prev
      && A.CE.operations[0].type === 'miseenbouteille' && A.CE.operations[0].data.lot === 'L25BB1'; }],
  B4: ['la dernière mise : en stock, la date et le bilan, les fûts rendus ; un magnum compte deux 75 cl', (A) => {
    const c = fut(); A.__pose({ cuvees: [c], dom: { 'mi-d': '2026-11-28', 'mi-lot': 'L25GV1' } });
    A.__mi({ id: 'gv', par: 'cam', fmt: { '75': 2900, '150': 20, '37.5': 0 }, ms: {}, carton: 6, fin: null, garde: {} }); A.saveMise();
    return c.statut === 'embouteille' && c.date_embouteillage === '2026-11-28' && c.mises[0].final && c.stock_fmt['150'] === 20 && c.nb_bouteilles === 2940
      && A.__etat().liberes[0].n === 10 && c.bilan_perte && c.bilan_perte.eleveHl === 22.8; }],
  B5: ['la mise refuse AVANT d’écrire : aucune bouteille, plus de vin que la cuvée, pas de n° de lot', (A) => {
    const cas = [[{ '75': 0 }, 'L1'], [{ '75': 3200 }, 'L1'], [{ '75': 1000 }, '']];
    return cas.every(([f, lot]) => { const c = bb(); A.__pose({ cuvees: [c], dom: { 'mi-d': '2026-11-27', 'mi-lot': lot } }); A.__mi({ id: 'bb', par: 'dom', fmt: f, ms: {}, carton: 6, fin: null, garde: {} }); A.saveMise();
      return !c.mises && c.cuves[0].litres === 2150 && A.CE.operations.length === 0 && A.__etat().toasts.length === 1; }); }],
  B6: ['La Réserve compte les sorties des mises ; « Annuler la dernière mise » rend le vin à sa cuve et le stock', (A) => {
    const c = bb(); A.__pose({ cuvees: [c], dom: { 'mi-d': '2026-11-27', 'mi-lot': 'L25BB1' } });
    A.__mi({ id: 'bb', par: 'dom', fmt: { '75': 1200 }, ms: { bt75: 'b75' }, carton: 6, fin: 'reste', garde: {} }); A.saveMise();
    const conso = A._cmConsoMise('b75'); A._cmMiseAnnuler('bb');
    return conso === 1200 && A._cmConsoMise('b75') === 0 && c.cuves[0].litres === 2150 && (c.mises || []).length === 0 && c.stock_fmt['75'] === 0 && A.CE.operations.length === 0; }],
  C1: ['le compte à rebours se coche tout seul : labo, collage, soutirage après collage, SO₂, filtration, une cuvée en cuve', (A) => {
    const c = bb({ mise_prev: { date: '2026-12-09', fmt: { '75': 100 }, ms: {} } });
    A.__pose({ cuvees: [c], anas: [{ date_analyse: '2026-11-08', cuvee_ids: ['bb'] }], ops: [
      { id: 'o1', type: 'traitement', date: '2026-11-17', cuvees_ids: ['bb'], data: { nature: 'col', produit: 'Caséine', rappel_sout: '2026-11-27' } },
      { id: 'o2', type: 'soutirage', date: '2026-11-27', cuvees_ids: ['bb'], data: {} }, { id: 'o3', type: 'soufre', date: '2026-11-20', cuvees_ids: ['bb'], data: {} },
      { id: 'o4', type: 'filtration', date: '2026-12-05', cuvees_ids: ['bb'], data: {} }] });
    const L = A._cmChecks(c, '2026-12-09'), k = (x) => L.filter((y) => y.k === x)[0];
    return k('ana').fait && k('ana').auto && k('coll').auto && k('scoll').auto && k('so2').auto && k('filt').auto && k('masse').auto && !k('gaz').fait && !k('tart').fait
      && k('so2').due === '2026-11-18' && k('ana').due === '2026-11-11' && k('prot').due === '2026-11-25'; }],
  C2: ['un contrôle à cocher, en retard une fois son repère passé ; les matières sèches qui manquent le disent', (A) => {
    const c = fut({ mise_prev: { date: '2026-12-09', fmt: { '75': 2600 }, ms: { bouchon: 'bou', bt75: 'b75' }, chk: { tart: { par: 'Nico' } } } });
    A.__pose({ cuvees: [c], stock: { bou: 1500, b75: 4200 }, prods: [{ id: 'bou', nom: 'Bouchon', cat: 'cave' }, { id: 'b75', nom: 'Bouteille 75 cl', cat: 'cave' }] });
    const L = A._cmChecks(c, '2026-12-09'), k = (x) => L.filter((y) => y.k === x)[0];
    return k('ana').retard && !k('ana').fait && k('tart').coche && k('tart').fait && !k('masse').fait && k('ms').manque && /bouchons/.test(k('ms').aide); }],
  D1: ['« À faire » : soutirer après le collage à sa date, puis plus rien une fois soutiré', (A) => {
    const col = { id: 'o1', type: 'traitement', date: '2026-11-17', cuvees_ids: ['bb'], data: { nature: 'col', produit: 'Caséine', rappel_sout: '2026-11-25' } };
    A.__pose({ cuvees: [bb()], ops: [col] }); const l1 = A._cmAgenda('2026-11-27', 4).filter((x) => x.it.kind === 'soutirage');
    A.__pose({ cuvees: [bb()], ops: [col, { id: 'o2', type: 'soutirage', date: '2026-11-27', cuvees_ids: ['bb'] }] });
    return l1.length === 1 && l1[0].date === '2026-11-27' && l1[0].it.urgence === 'due' && /collage du 17 nov\./.test(l1[0].it.detail) && A._cmAgenda('2026-11-27', 4).filter((x) => x.it.kind === 'soutirage').length === 0; }],
  D2: ['bâtonner revient à la date dite ; la suite de la DERNIÈRE dégustation jusqu’au geste qui la solde', (A) => {
    A.__pose({ cuvees: [bb()], ops: [{ id: 'b1', type: 'batonnage', date: '2026-11-27', cuvees_ids: ['bb'], data: { proch: '2026-12-04' } },
      { id: 'd1', type: 'degustation', date: '2026-11-05', cuvees_ids: ['bb'], data: { suite: 'ana', signaux: ['red'] } }] });
    const L = A._cmAgenda('2026-11-27', 4), bat = L.filter((x) => x.it.kind === 'batonnage')[0], ana = L.filter((x) => x.it.kind === 'analyse')[0];
    A.__pose({ cuvees: [bb()], ops: [{ id: 'd1', type: 'degustation', date: '2026-11-05', cuvees_ids: ['bb'], data: { suite: 'ana' } }], anas: [{ date_analyse: '2026-11-10', cuvee_ids: ['bb'] }] });
    const solde = A._cmAgenda('2026-11-27', 4).filter((x) => x.it.kind === 'analyse').length;
    A.__pose({ cuvees: [bb()], ops: [{ id: 'd1', type: 'degustation', date: '2026-11-05', cuvees_ids: ['bb'], data: { suite: 'sout' } }, { id: 'd2', type: 'degustation', date: '2026-11-20', cuvees_ids: ['bb'], data: { suite: 'rien' } }] });
    return bat.date === '2026-12-04' && !bat.it.urgence && ana.date === '2026-11-27' && /réduit/.test(ana.it.detail) && solde === 0 && A._cmAgenda('2026-11-27', 4).length === 0; }],
  D3: ['« prête pour la mise » demande une date ; une préparation pose ses contrôles et le jour de la mise', (A) => {
    A.__pose({ cuvees: [bb()], ops: [{ id: 'd1', type: 'degustation', date: '2026-11-20', cuvees_ids: ['bb'], data: { suite: 'mise' } }] });
    const p = A._cmAgenda('2026-11-27', 4).filter((x) => x.it.kind === 'mise');
    A.__pose({ cuvees: [bb({ mise_prev: { date: '2026-12-09', fmt: {}, ms: {} } })] });
    const L = A._cmAgenda('2026-11-27', 4).filter((x) => x.it.kind === 'mise');
    return p.length === 1 && /fixez la date/.test(p[0].it.detail) && L.some((x) => x.date === '2026-12-09' && x.it.detail === 'mise en bouteille')
      && L.some((x) => x.date === '2026-11-27' && x.it.urgence === 'due' && /analyse complète/.test(x.it.detail)); }],
  E1: ['coller : la couleur et l’allergène d’un produit, d’après son nom', (A) =>
    A._cmColle('Caséine de potassium').a === 'lait' && A._cmColle('Caséine de potassium').c === 'bo' && A._cmColle('Gélatine').c === 'r' && A._cmColle('Albumine d’œuf').a === 'oeuf'
    && A._cmColle('Lysozyme').a === 'oeuf' && A._cmColle('Bentonite sodique').a === null && A._cmColle('Métabisulfite') === null && A._cmAllergeneDe('Caséine') === 'lait'],
  E2: ['coller écrit l’allergène, l’essai et la date du soutirage ; stabiliser sans méthode ni produit est refusé', (A) => {
    A.__pose({ dom: { 'cop-tr-prod': 'cas' } }); A.__op({ vue: 'collage', all: null, essai: true, rappel: 10 });
    const d = A._cmOpData('traitement', { prod_id: 'cas' }, '2026-11-17');
    A.__op({ vue: 'stab', quoi: 'tart', meth: '', test: '' }); const r = A._cmOpData('traitement', { prod_id: '' }, '2026-11-17');
    A.__op({ vue: 'stab', quoi: 'tart', meth: 'froid', test: 'stable' }); const s = A._cmOpData('traitement', { prod_id: '' }, '2026-11-17');
    A.__op({ vue: 'batonnage', proch: 7 }); const b = A._cmOpData('batonnage', {}, '2026-11-27');
    return d.nature === 'col' && d.essai === true && d.rappel_sout === '2026-11-27' && r === null && s.nature === 'sta' && s.stab.meth === 'froid' && s.stab.test === 'stable' && b.proch === '2026-12-04'; }],
  F1: ['un geste confié se solde par l’opération : même geste, même cuvée, depuis le jour confié ; « Autre » se coche', (A) => {
    const cs = { id: 'c1', g: 'ouillage', ref: 'gv', refT: 'cuvee', date: '2026-11-27', cree: '2026-11-26T18:00:00Z', qui: ['Jean'] };
    A.__pose({ cuvees: [fut()], cons: [cs], ops: [{ id: 'o0', type: 'ouillage', date: '2026-11-25', cuvees_ids: ['gv'] }, { id: 'o9', type: 'soutirage', date: '2026-11-27', cuvees_ids: ['gv'] }] });
    const avant0 = A._pcSolde(cs);
    A.CE.operations.push({ id: 'o1', type: 'ouillage', date: '2026-11-27', cuvees_ids: ['gv'], operateur: 'Jean' });
    const col = { id: 'c2', g: 'collage', ref: 'gv', refT: 'cuvee', date: '2026-11-27', cree: '2026-11-27T08:00:00Z' };
    A.CE.operations.push({ id: 'o2', type: 'traitement', date: '2026-11-27', cuvees_ids: ['gv'], data: { nature: 'aci' } });
    return avant0 === null && A._pcSolde(cs).op === 'o1' && A._pcSolde(cs).par === 'Jean' && A._pcSolde(col) === null && A._pcSolde({ g: 'autre', fait: { par: 'Jean', le: '2026-11-27' } }).par === 'Jean'; }],
  F2: ['« À faire » : un geste confié s’accroche à la ligne du même geste, ou fait la sienne ; en retard, il arrive aujourd’hui', (A) => {
    A.__pose({ cuvees: [fut()], cons: [{ id: 'c1', g: 'ouillage', ref: 'gv', refT: 'cuvee', date: '2026-11-27', cree: '2026-11-27T08:00:00Z', qui: ['Jean'], mom: 'm' },
      { id: 'c2', g: 'autre', ref: '', refT: 'cuvee', nom: '', date: '2026-11-25', cree: '2026-11-24T08:00:00Z', qui: ['Paul'], note: 'laver la cuve 2', mom: 'j' }] });
    const ou = { kind: 'ouillage', ref: 'gv', date: '2026-11-27', titre: 'Gevrey' }, sem = [{ lundi: '2026-11-23', dim: '2026-11-29', items: [ou] }], pousses = [];
    A._pcAgenda(sem, '2026-11-27', (d, it) => { it.date = d; pousses.push(it); return true; });
    return ou.cs === 'c1' && ou.qui.join() === 'Jean' && ou.pcEtat === 'conf' && pousses.length === 1 && pousses[0].kind === 'consigne' && pousses[0].date === '2026-11-27'
      && pousses[0].pcEtat === 'ret' && pousses[0].urgence === 'due' && pousses[0].ref === 'c2'; }],
  F3: ['le message du matin : les gestes du jour de la personne, par moment', (A) => {
    A.__pose({ cuvees: [fut(), bb()], cons: [{ id: 'c1', g: 'ouillage', ref: 'gv', refT: 'cuvee', nom: 'Gevrey VV 2025', date: '2026-11-28', qui: ['Jean'], mom: 'm' },
      { id: 'c2', g: 'soutirage', ref: 'bb', refT: 'cuvee', nom: 'Bourgogne Blanc 2025', date: '2026-11-28', qui: ['Jean', 'Paul'], mom: 'a' },
      { id: 'c3', g: 'so2', ref: 'bb', refT: 'cuvee', nom: 'Bourgogne Blanc 2025', date: '2026-11-29', qui: ['Jean'], mom: 'j' }] });
    const l = A._pcNotifLignes('Jean', '2026-11-28');
    return l.length === 2 && l[0] === 'En cave ce matin : ouiller · Gevrey VV 2025' && l[1] === 'En cave cet après-midi : soutirer · Bourgogne Blanc 2025' && A._pcNotifLignes('Paul', '2026-11-29').length === 0; }],
  F4: ['confier : seul l’administrateur ; refusé AVANT d’écrire sans personne, sans cuvée, « Autre » sans consigne', (A) => {
    const cas = [[{ g: 'ouillage', ref: 'gv', qui: {} }, { 'pc-note': '' }], [{ g: 'ouillage', ref: '', qui: { Jean: true } }, { 'pc-note': '', 'pc-ref': '' }], [{ g: 'autre', ref: '', qui: { Jean: true } }, { 'pc-note': '', 'pc-ref': '' }]];
    const ok = cas.every(([e, dom]) => { A.__pose({ cuvees: [fut()], membres: [{ nom: 'Jean' }], dom: Object.assign({ 'pc-d': '2026-11-28' }, dom) }); A.__pc(Object.assign({ refT: 'cuvee', date: '2026-11-28', mom: 'm', note: '' }, e)); A.savePc();
      return (A.CE.consignes || []).length === 0 && A.__etat().toasts.length === 1; });
    A.__pose({ cuvees: [fut()], membres: [{ nom: 'Jean' }], user: { nom: 'Jean', roles: ['ouvrier'] }, dom: { 'pc-d': '2026-11-28', 'pc-ref': 'gv' } });
    A.__pc({ g: 'ouillage', ref: 'gv', refT: 'cuvee', date: '2026-11-28', mom: 'm', note: '', qui: { Jean: true } }); A.savePc();
    const ouvrier = (A.CE.consignes || []).length === 0;
    A.__pose({ cuvees: [fut()], membres: [{ nom: 'Jean' }], dom: { 'pc-d': '2026-11-28', 'pc-ref': 'gv', 'pc-note': 'le vin est en cuve 3' } });
    A.__pc({ g: 'ouillage', ref: 'gv', refT: 'cuvee', date: '2026-11-28', mom: 'm', note: '', qui: { Jean: true } }); A.savePc();
    const cs = A.CE.consignes[0];
    return ok && ouvrier && cs.qui.join() === 'Jean' && cs.nom === 'Gevrey VV 2025' && cs.note === 'le vin est en cuve 3' && cs.par === 'Nico' && cs.date === '2026-11-28'; }],
  F5: ['l’équipe du jour : qui travaille d’après le planning ; sans personne au planning, tout le monde', (A) => {
    A.__pose({ membres: [{ nom: 'Jean' }, { nom: 'Paul' }, { nom: 'Lucie', statut: 'Inactif' }], pp: { Jean: '08:00' }, cavej: { '2026-11-28': { Jean: 'm' } } });
    const L = A._pcEquipe('2026-11-28');
    A.__pose({ membres: [{ nom: 'Jean' }, { nom: 'Paul' }], pp: {} }); const V = A._pcEquipe('2026-11-28');
    return L.length === 2 && L[0].nom === 'Jean' && L[0].ok && L[0].info === 'en cave le matin' && !L[1].ok && /ne travaille pas/.test(L[1].info) && V.every((x) => x.ok); }],
  G1: ['le module : importé par cave.js, compté dans la Cave des harnais ; rien au chargement que des window.X=', (A, S) =>
    S.cave.includes("import './cave-mise.js';") && S.src.includes("'src/cave-mise.js'") && !/^(?!window\.|var |function |export |import |\/\/| |\}|\s*$)/m.test(S.cm.replace(/\/\*[\s\S]*?\*\//g, ''))],
  G2: ['« À faire » lit les rappels et les gestes confiés ; _mlGo passe d’abord par le module ; la ligne dit qui ; « Pour toi » en tête', (A, S) =>
    fn(S.cave, '_mlAgendaComplet').includes("window._cmAgenda(from,nSem).forEach(function(x){ pousse(x.date,x.it); });") && fn(S.cave, '_mlAgendaComplet').includes('window._pcAgenda(sem,from,pousse);')
    && /^function _mlGo\(kind,ref\)\{\n  if\(typeof window\._cmGo==='function'&&window\._cmGo\(kind,ref\)\) return;/m.test(S.cave)
    && fn(S.cave, '_aujLigne').includes('window._pcPill(it)') && fn(S.cave, '_aujLigne').includes('window._pcBoutons(x)') && fn(S.cave, '_aujRender').includes('window._pcPourToiHtml()')],
  G3: ['la feuille des gestes : rangée par étape, ce qui est propre au geste vérifié AVANT d’écrire ; la mise et la mise en masse ne se rouvrent pas dans la feuille', (A, S) => {
    const sv = fn(S.cave, 'saveCaveOp');
    return S.idx.includes('<div class="cop-gh">Élevage</div>') && S.idx.includes('id="cot-batonnage"') && S.idx.includes('id="cot-collage"') && S.idx.includes('id="cot-stab"') && S.idx.includes('id="cop-cm-extra"')
      && avant(sv, 'opData=window._cmOpData(_caveOpType,opData,date); if(!opData) return;', 'CAVE_ELEVAGE.operations.push(') && fn(S.cave, 'selCaveOpType').includes('type=window._cmOpSel(vue);')
      && S.cave.includes("if(op.type!=='assemblage'&&op.type!=='miseenbouteille'&&!(op.data&&op.data.masse))"); }],
  G4: ['La Réserve, l’Accueil, le message du matin, le motif « masse », le Pilotage, le registre, la fiche', (A, S) =>
    fn(S.rsv, '_conso').includes("window._cmConsoMise(p&&p.id)") && (fn(S.rsv, '_conso').match(/\+_mi/g) || []).length === 4 && S.jal.includes("window._pcAccueilHtml(u.nom)") && fn(S.reg, '_mvNotifLignes').includes('window._pcNotifLignes(mbr.nom,iso).concat(l)')
    && S.utils.includes("masse:       {sens:'entree', lbl:'Mise en masse'") && fn(S.utils, '_mvFutLiberer').includes("(motif === 'masse') ? 'masse' : 'embouteille'")
    && S.pil.includes("consigne:['geste confi\\u00e9','gestes confi\\u00e9s']") && /batonnage:\s+\{fam:'pratique'/.test(S.cave) && /miseenbouteille: \{fam:'pratique'/.test(S.cave)
    && fn(S.cave, '_cdvHtml').includes('window._cmParcoursHtml(cuv)') && fn(S.cave, 'renderCaveBouteille').includes('window._cmBouteilles()')],
  G5: ['une cuvée mise par la feuille se remet en élevage par « Annuler la dernière mise », pas par sa fiche', (A, S) => {
    const s = fn(S.cave, 'saveCuvee'); return avant(s, "&& (_prevC.mises||[]).length){", "window._mvFutReprendre({nom:nom"); }],
  G6: ['le journal du Chai ne modifie ni ne supprime une mise ; l’export du registre garde bâtonnage et mise ; bâtonner et stabiliser ont leur fiche « pourquoi »', (A, S) => {
    const d = fn(S.cave, 'deleteCaveOp'), j = fn(S.cave, 'renderCaveJournal');
    return avant(d, "if(_op&&_op.type==='miseenbouteille'){ showToast(", 'window.openConfirmDel(')
      && j.includes("(op.type!=='miseenbouteille'?'<button onclick=\"window.deleteCaveOp(")
      && S.idx.includes('id="cexp-type-batonnage"') && S.idx.includes('id="cexp-type-miseenbouteille"') && S.cave.includes('var _CAVE_EXP_N = 10;')
      && /\n  batonnage: +\{ d: 'cave'/.test(S.utils) && /\n  stab: +\{ d: 'cave'/.test(S.utils) && fn(S.cave, 'selCaveOpType').includes("window._mvPqBtn(vue,'cave')"); }],
  G7: ['le journal, la fiche et l’export disent le geste rangé : Collage, Stabilisation, Mise en masse — pas « Traitement » ni « Soutirage »', (A, S) =>
    A._cmOpTitre({ type: 'traitement', data: { nature: 'col' } }) === 'Collage' && A._cmOpTitre({ type: 'traitement', data: { nature: 'sta' } }) === 'Stabilisation'
    && A._cmOpTitre({ type: 'soutirage', data: { masse: { futs: 2 } } }) === 'Mise en masse' && A._cmOpTitre({ type: 'traitement', data: { nature: 'aci' } }) === null
    && A._cmOpTitre({ type: 'soutirage', data: {} }) === null
    && fn(S.cave, 'renderCaveJournal').includes('((window._cmOpTitre&&window._cmOpTitre(op))||_caveTypeLabel(op.type))')
    && S.cave.includes('lbl=(window._cmOpTitre&&window._cmOpTitre(op))||tL[op.type]') && fn(S.cave, 'generateCaveExport').includes('var tl=(window._cmOpTitre&&window._cmOpTitre(op))||typeLabels[op.type]')],
  H1: ['les trois tutos : mise en masse, mise en bouteille, confier un geste ; leur Chai chargé pour eux seuls', (A, S) => {
    const t = (id) => S.tu.slice(S.tu.indexOf("{ id: '" + id + "'"), S.tu.indexOf("{ id: '" + id + "'") + 7000);
    return /couvre: \['openMasse', '_msVers', 'saveMasse'\]/.test(t('masse')) && /couvre: \['openMisePrev', 'saveMisePrev', 'openMise', '_miFmtLive', 'saveMise'\]/.test(t('mise'))
      && /couvre: \['_pcDepuis', '_pcSet', 'savePc'\]/.test(t('confier')) && S.tu.includes("window.applyFbData('cave_elevage', _tuCaveElev(_tk));")
      // une valeur PROPOSÉE (le volume des fûts, le nombre de bouteilles) ne se compte « tapée » que si elle diffère : sinon, saut d'étape au miroir ; jamais facultative
      && t('masse').includes("{ type: 'taper', cible: '#mvv-ov.open [data-tuto=\"masse.l\"]'") && t('mise').includes("{ type: 'taper', cible: '#mvv-ov.open [data-tuto=\"mise.n75\"]'")
      && !/facultatif: true, cible: '#mvv-ov\.open \[data-tuto="(masse\.l|mise\.n75)"\]'/.test(t('masse') + t('mise'))   // « Passer » viderait le champ
      && t('masse').includes("reel: function () { var c = _q('#mvv-ov.open [data-tuto=\"masse.l\"]')") && t('mise').includes("reel: function () { var c = _q('#mvv-ov.open [data-tuto=\"mise.n75\"]')")
      && (t('masse') + t('mise')).split("c.getAttribute('data-prop')").length === 3
      // la cuve choisie d'office n'est pas celle que le tuto fait choisir (deux cuves au parc d'entraînement)
      && t('masse').includes('fait: function () { return !!_q(\'#mvv-ov.open [data-tuto="masse.cuve"][data-v="tu_ci1"].on\'); }')
      && S.tu.includes("cuves: [{ id: 'tu_cb1', nom: 'Cuve béton 1', litres: 2000, matiere: 'beton' }, { id: 'tu_ci1', nom: 'Cuve inox 1', litres: 1500, matiere: 'inox' }]") && S.cm.includes('data-tuto="masse.l" data-prop="') && S.cm.includes('data-tuto="mise.n75" data-prop="')
      && ['masse.cuve', 'masse.l', 'masse.ok', 'btl.masse', 'btl.prev', 'btl.mettre', 'mise.prev.ok', 'mise.n75', 'mise.ok', 'auj.confier', 'pc.qui', 'pc.note', 'pc.ok'].every((k) => S.cm.includes('data-tuto="' + k + '"')); }],
  H2: ['les gestes rares exemptés avec leur raison ; le plafond descendu à 781', (A, S) => {
    const c = JSON.parse(S.cov); return ['_cmMsChoix', '_cmCocher', '_mpPar', '_miFmt', '_cmMiseAnnuler', '_cmOpSet', '_pcFaire', '_pcPas', '_cmQMan'].every((n) => /CAVE-SUITE/.test(c.exempts[n] || '')) && c.plafond === 781; }],
  H3: ['l’aide, le guide et « Quoi de neuf » disent la mise, la mise en masse, les gestes confiés', (A, S) =>
    S.utils.includes("['La mise en bouteille', ") && S.utils.includes("['Confier un geste', ") && S.g08.includes('<b>Confier un geste</b>') && S.g08.includes('<b>La mise en masse</b>')
    && /v: '11\.47'[^\n]*CAVE-SUITE/.test(S.wn) && /Confier un geste de cave/.test(S.wn.slice(S.wn.indexOf("v: '11.47'"), S.wn.indexOf("v: '11.46'")))],
};

function jouer(S) {
  const L = [];
  let A = null;
  try { A = charger(S); } catch (e) { L.push(['chargement des fonctions', false, e.message]); return L; }
  for (const [k, [lib, f]] of Object.entries(T)) {
    let ok = false, err = '';
    try { ok = !!f(A, S); } catch (e) { err = e.message; }
    L.push([k + ' · ' + lib, ok, err]);
  }
  return L;
}
const c = { v: (s) => '\x1b[32m' + s + '\x1b[0m', r: (s) => '\x1b[31m' + s + '\x1b[0m', d: (s) => '\x1b[2m' + s + '\x1b[0m' };
const remp = (t, a, b) => { if (!t.includes(a)) throw new Error('ancre introuvable : ' + a.slice(0, 60)); return t.replace(a, b); };
const DEFAUTS = [
  ['la mise en masse écrit avant de vérifier', (S) => ({ ...S, cm: remp(S.cm, "  var e=_msErreur(c, p, l); if(e){ showToast(e,'#B85A1A'); return; }   // ⚠ AVANT toute écriture", '') })],
  ['la mise en masse garde les fûts', (S) => ({ ...S, cm: remp(S.cm, '  c.tonneaux=[]; c.nb_tonneaux=0; delete c.manque_l;', '') })],
  ['les fûts reviennent au parc comme une mise en bouteille', (S) => ({ ...S, cm: remp(S.cm, "'Mise en masse — '+_cmNom(c), 'masse');", "'Mise en masse — '+_cmNom(c));") })],
  ['une cuve trop petite passe', (S) => ({ ...S, cm: remp(S.cm, "  if(cap>0&&l>cap) return", "  if(false) return") })],
  ['un carton par bouteille', (S) => ({ ...S, cm: remp(S.cm, 'Math.ceil(n75/(parCarton===12?12:6))', 'n75') })],
  ['une mise en partie vide quand même la cuve', (S) => ({ ...S, cm: remp(S.cm, "    cu.forEach(function(x){ x.litres=Math.round((parseFloat(x.litres)||0)*r/(tot||1)); });", '') })],
  ['un magnum compte pour une bouteille', (S) => ({ ...S, cm: remp(S.cm, "var _CM_FMT=[['75',0.75,'Bouteille 75 cl','bouteilles'],['150',1.5,", "var _CM_FMT=[['75',0.75,'Bouteille 75 cl','bouteilles'],['150',0.75,") })],
  ['la mise passe sans n° de lot', (S) => ({ ...S, cm: remp(S.cm, "  if(!lot){ showToast('Indiquez le n° de lot','#B85A1A'); return; }", '') })],
  ['annuler ne rend pas le vin à sa cuve', (S) => ({ ...S, cm: remp(S.cm, "if(!m.final&&m.reste_l>0){ var f=(m.reste_l+(m.l||0))/m.reste_l;", "if(false){ var f=1;") })],
  ['le labo ne coche plus l’analyse', (S) => ({ ...S, cm: remp(S.cm, "var an=der(A.filter(function(a){ return dans(a,de,date); })", "var an=der([].filter(function(a){ return dans(a,de,date); })") })],
  ['le rappel du soutirage reste après le soutirage', (S) => ({ ...S, cm: remp(S.cm, "if(col&&col.data.rappel_sout&&!ops.some(function(o){ return o.type==='soutirage'&&o.id!==col.id&&String(o.date)>=String(col.date); }))", "if(col&&col.data.rappel_sout)") })],
  ['une vieille dégustation garde sa suite', (S) => ({ ...S, cm: remp(S.cm, "var dg=_cmDer(ops.filter(function(o){ return o.type==='degustation'; })), su=", "var dg=ops.filter(function(o){ return o.type==='degustation'; })[0], su=") })],
  ['la caséine perd son allergène', (S) => ({ ...S, cm: remp(S.cm, "[/cas[ée]in|lait/i,'bo','lait',", "[/cas[ée]in|lait/i,'bo',null,") })],
  ['un geste confié se solde par une opération d’avant', (S) => ({ ...S, cm: remp(S.cm, "if(!o||o.type!==t||String(o.date||'').slice(0,10)<d0) return false;", "if(!o||o.type!==t) return false;") })],
  ['un geste confié en retard reste à sa date', (S) => ({ ...S, cm: remp(S.cm, "var dd=d<from?from:d, kind=", "var dd=d, kind=") })],
  ['un ouvrier peut confier', (S) => ({ ...S, cm: remp(S.cm, "  if(!isAdmin()){ showToast('Seul l’administrateur confie un geste','#B85A1A'); return; }\n  _pcGarder();", "  _pcGarder();") })],
  ['sans planning, personne à qui confier', (S) => ({ ...S, cm: remp(S.cm, "  if(pr&&!Object.keys(pr).length) pr=null;", '') })],
  ['« À faire » ne lit plus les gestes confiés', (S) => ({ ...S, cave: remp(S.cave, "  if(typeof window._pcAgenda==='function') window._pcAgenda(sem,from,pousse);\n", '') })],
  ['la feuille des gestes écrit avant de vérifier', (S) => ({ ...S, cave: remp(S.cave, "  if(typeof window._cmOpData==='function'){ opData=window._cmOpData(_caveOpType,opData,date); if(!opData) return; }", '') })],
  ['La Réserve oublie les mises', (S) => ({ ...S, rsv: remp(S.rsv, "  if(src==='manual'){ return {q:(p.conso_manuel||0)+_mi, known:true}; }", "  if(src==='manual'){ return {q:(p.conso_manuel||0), known:true}; }") })],
  ['le message du matin oublie les gestes confiés', (S) => ({ ...S, reg: remp(S.reg, "  if(typeof window._pcNotifLignes==='function') l=window._pcNotifLignes(mbr.nom,iso).concat(l);", '') })],
  ['le tuto « confier » ne confie plus', (S) => ({ ...S, tu: remp(S.tu, "couvre: ['_pcDepuis', '_pcSet', 'savePc']", "couvre: ['_pcDepuis', '_pcSet']") })],
  ['le journal laisse supprimer la trace d’une mise', (S) => ({ ...S, cave: remp(S.cave, "  if(_op&&_op.type==='miseenbouteille'){ showToast(", "  if(false){ showToast(") })],
  ['l’export du registre perd le bâtonnage', (S) => ({ ...S, idx: remp(S.idx, 'id="cexp-type-batonnage"', 'id="cexp-type-x"') })],
  ['la pastille « pourquoi » de « Coller » dit « Autre traitement »', (S) => ({ ...S, cave: remp(S.cave, "window._mvPqBtn(vue,'cave')", "window._mvPqBtn(type,'cave')") })],
  ['un collage redevient « Traitement » au journal', (S) => ({ ...S, cm: remp(S.cm, "if(op&&op.type==='traitement'&&d.nature==='col') return 'Collage';", '') })],
  ['le volume proposé de la mise en masse compte comme tapé (saut d’étape au miroir)', (S) => ({ ...S, tu: remp(S.tu, "reel: function () { var c = _q('#mvv-ov.open [data-tuto=\"masse.l\"]')", "reelX: function () { var c = _q('#mvv-ov.open [data-tuto=\"masse.l\"]')") })],
  ['« Passer » le volume de la mise en masse (le champ vidé, la mise refusée)', (S) => ({ ...S, tu: remp(S.tu, "{ type: 'taper', cible: '#mvv-ov.open [data-tuto=\"masse.l\"]'", "{ type: 'taper', facultatif: true, cible: '#mvv-ov.open [data-tuto=\"masse.l\"]'") })],
  ['une seule cuve au parc d’entraînement : choisie d’office, l’étape se fait avant son tour', (S) => ({ ...S, tu: remp(S.tu, "cuves: [{ id: 'tu_cb1', nom: 'Cuve béton 1', litres: 2000, matiere: 'beton' }, { id: 'tu_ci1'", "cuves: [{ id: 'tu_ci1'") })],
  ['« Quoi de neuf » oublié', (S) => ({ ...S, wn: remp(S.wn, "v: '11.47'", "v: '11.4x'") })],
];

if (!CONTRE) {
  const L = jouer(SAIN);
  console.log('\nCAVE-SUITE — la mise en masse, la mise en bouteille, les rappels du Chai, les gestes confiés');
  for (const [lib, ok, err] of L) console.log('  ' + (ok ? c.v('✓') : c.r('✗')) + ' ' + lib + (err ? c.d('  → ' + err) : ''));
  const ko = L.filter((x) => !x[1]).length;
  console.log('\n  ' + (ko ? c.r(ko + ' rouge(s)') : c.v('✓ ' + L.length + ' vertes, 0 rouge')) + '\n');
  process.exit(ko ? 1 : 0);
} else {
  console.log('\nCAVE-SUITE — contre-épreuves (chaque défaut doit rougir)');
  let rate = 0;
  for (const [lib, f] of DEFAUTS) {
    let S2 = null; try { S2 = f(SAIN); } catch (e) { console.log('  ' + c.r('✗') + ' ' + lib + c.d('  → ' + e.message)); rate++; continue; }
    const rouges = jouer(S2).filter((x) => !x[1]);
    if (rouges.length) console.log('  ' + c.v('DÉTECTÉ') + '  ' + lib + c.d(' (' + rouges.length + ' rouge)'));
    else { console.log('  ' + c.r('MANQUÉ ') + '  ' + lib); rate++; }
  }
  console.log('\n  ' + (rate ? c.r(rate + ' défaut(s) passé(s) inaperçu(s)') : c.v('✓ ' + DEFAUTS.length + '/' + DEFAUTS.length + ' défauts détectés')) + '\n');
  process.exit(rate ? 1 : 0);
}
