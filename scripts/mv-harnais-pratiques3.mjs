// ═══════════════════════════════════════════════════════════════════════════
//  HARNAIS PRATIQUES-3 (§626) — LA SAIGNÉE QUI CRÉE LA CUVE DE ROSÉ ; L'ENZYMAGE PRIS DANS LA RÉSERVE ;
//  LE SOUTIRAGE D'UN DÉBOURBAGE DANS « À FAIRE » ; LA BASE D'UN EFFERVESCENT ; UNE CUVÉE QUI CHANGE DE COULEUR
// ═══════════════════════════════════════════════════════════════════════════
//  Nico, 27/11 : « On fait ce qui reste en un seul lot, la totale » — les restes du §625e.
//
//  Sur les VRAIES fonctions extraites de src/cuvier-pratiques.js (jouées dans Node) et sur les vrais fichiers
//  pour le branchement.
//
//  CE QUE CE HARNAIS PROUVE
//   A. la saignée d'un rouge crée la cuve de rosé (son jus, ses parcelles, d'où elle vient) ; la correction la suit tant
//      qu'elle n'est pas débourbée ; la saignée ne se supprime pas tant que la cuve existe ; supprimer la cuve délie la
//      saignée ; le jus saigné reste au rendement des parcelles, et devient le contenu de la cuve de rosé ;
//   B. l'enzymage : un produit de La Réserve et sa dose font une opération « Enzymes » (la sortie de stock), refusée sans
//      dose ; sans intrant œnologique, le texte d'avant ;
//   C. « À faire » : le soutirage tombe à l'heure du repère (« dû » une fois passée), le jour même sans repère ;
//   D. la base d'un effervescent rend « à vérifier » ce qui était impossible (article 8) ; une cuvée qui change de
//      couleur relit ses apports ; le texte dit qui interdit quoi ;
//   E. le branchement : chaque refus AVANT toute écriture ; les tables d'« À faire » ; le Pilotage ; l'objet rebâti
//      de la cuve garde `saignee_de` ; F. le tuto « tirer un rosé de saignée » ; G. l'aide, le guide, « Quoi de neuf ».
//
//  Usage :  node scripts/mv-harnais-pratiques3.mjs
//           node scripts/mv-harnais-pratiques3.mjs --contre
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { texteTutosDepot } from './mv-tutos-sources.mjs';
const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SAIN = {
  pr: lire('src/cuvier-pratiques.js'), cu: lire('src/cuvier.js'), cave: lire('src/cave.js'), pil: lire('src/pilotage.js'),
  utils: lire('src/utils.js'), wn: lire('src/whats-new.js'), g08: lire('guide/08-cave.html'), tu: texteTutosDepot(),
  cov: lire('scripts/tutos-couverture.json'), css: lire('src/styles.css')
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

const PRELUDE = `
var COUL = { Charmes: 'r', Perr: 'b' }, DOM = {}, PRODS = [];
var CAVE_VENDANGE = { config: {}, cuves_vinif: [] };
var window = { CAVE_VENDANGE: CAVE_VENDANGE, CAVE_ELEVAGE: { cuvees: [] }, currentUser: { nom: 'Nico' },
  _vendHistPose: function (c, st, d) { (c.statut_hist = c.statut_hist || []).push({ statut: st, date: d }); },
  _vendIntrProds: function () { return PRODS; }, _vendIntrUnite: function (p) { return (p && p.unite === 'L') ? 'mL/hL' : 'g/hL'; },
  _vendIntrUniteQ: function (p) { return (p && p.unite === 'L') ? 'L' : 'kg'; }, _vendIntrQte: function (d, v) { return d * v / 1000; },
  _vendIntrVol: function (c) { return { hl: (c && c.__hl) || 0, src: 'estime' }; }, _caveCuveSource: function () { return null; } };
var document = { getElementById: function (id) { return (id in DOM) ? { value: DOM[id] } : null; } };
function _parcCoul(n){ return COUL[n] || '?'; }
function _escHtml(s){ return String(s == null ? '' : s); } function _escAttr(s){ return String(s == null ? '' : s); }
function _mvIcon(){ return ''; } function showToast(){}
function __pose(o){ CAVE_VENDANGE.config = o.config || {}; CAVE_VENDANGE.cuves_vinif = o.cuves || []; window.CAVE_VENDANGE = CAVE_VENDANGE; DOM = o.dom || {}; PRODS = o.prods || []; }
`;
const NOMS = ['_pratCfg', '_pratHas', '_pratDe', '_vendParcCouls', '_vendCoulAuto', '_vendCuveCoul', '_pratEtq', '_debJusL', '_debEtat', '_debNum', '_nbL',
  '_coulOk', '_coulMot', '_cuveeCoul', '_coulMelange', '_cuvApportCoul', '_cuvCoulApports',
  '_p3Cuves', '_p3Cuve', '_saigRoseDefaut', '_saigRosePret', '_saigRoseCree', '_saigRoseSuit', '_saigRoseBloque', '_saigRoseOubli', '_saigRoseHl', '_saigRoseVol',
  '_debEnzProds', '_debEnzProd', '_debEnzVol', '_debEnzPris', '_p3Jour', '_p3Heure', '_debAFaire'];
function charger(S) {
  const vars = ['_PRAT_NOM', '_PRAT_ETQ'].map((v) => {
    const i = S.pr.search(new RegExp('^var ' + v + ' = ', 'm')); if (i < 0) throw new Error(v + ' introuvable');
    let d = 0, q = null, j = S.pr.indexOf('{', i);
    for (; j < S.pr.length; j++) { const ch = S.pr[j]; if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; } if (ch === "'" || ch === '"') { q = ch; continue; } if (ch === '{') d++; else if (ch === '}' && --d === 0) break; }
    return S.pr.slice(i, j + 1) + ';';
  }).join('\n');
  const code = PRELUDE + vars + '\nvar _saigRose = null, _saigRoseC = null, _PRAT_Q = { r: 1, b: 1, o: 1 };\n' + NOMS.map((n) => fn(S.pr, n)).join('\n')
    + '\n;({ ' + NOMS.join(', ') + ', __pose, __choix: function (r) { _saigRose = r; } })';
  return vm.runInNewContext(code, {});
}
const P = (o) => Object.assign({ actif: { r: true, b: true, o: true }, r: { sai: ['oui'] }, b: {}, o: { met: ['sai'], rep: { deb_h: 12 } } }, o || {});
const rouge = (o) => Object.assign({ id: 'c3', nom: 'Cuve 3', statut: 'fa', parcelles: ['Charmes'], operations: [] }, o || {});

const T = {
  A1: ['la saignée d’un rouge crée la cuve de rosé : son jus, les parcelles, la couleur, d’où elle vient ; la saignée la nomme', (A) => {
    const c = rouge(); A.__pose({ config: { pratiques: P() }, cuves: [c], dom: { 'vop-rose-nom': '' } }); A.__choix('oui');
    const pret = A._saigRosePret(c, 8, null), op = { id: 'o1', type: 'saignee', volume_hl: 8, date: '2026-09-14' };
    const r = A._saigRoseCree(c, op, pret.nom);
    return pret.nom === 'Rosé de saignée — Cuve 3' && r.couleur === 'o' && r.statut === 'setup' && r.pressurage.goutte_l === 800 && r.parcelles.join() === 'Charmes'
      && r.saignee_de.id === 'c3' && r.saignee_de.l === 800 && op.vers_rose.id === r.id && A._p3Cuves().length === 2; }],
  A2: ['rien à créer : un blanc, « ne pas le suivre », une saignée qui a déjà sa cuve ; un volume nul est refusé', (A) => {
    A.__pose({ config: { pratiques: P() }, cuves: [] }); A.__choix('oui');
    const b = A._saigRosePret(rouge({ parcelles: ['Perr'] }), 8, null), deja = A._saigRosePret(rouge(), 8, { vers_rose: { id: 'x' } }), nul = A._saigRosePret(rouge(), 0, null);
    A.__choix('non'); const non = A._saigRosePret(rouge(), 8, null);
    return b === null && deja === null && non === null && /volume saigné/.test((nul || {}).err || ''); }],
  A3: ['« Créer la cuve de rosé » se propose d’après les pratiques (des rosés de saignée)', (A) => {
    A.__pose({ config: { pratiques: P() } }); const oui = A._saigRoseDefaut();
    A.__pose({ config: { pratiques: P({ o: { met: ['direct'] } }) } }); const non = A._saigRoseDefaut();
    A.__pose({ config: {} }); return oui === 'oui' && non === 'non' && A._saigRoseDefaut() === 'non'; }],
  A4: ['une saignée corrigée : la cuve de rosé suit son jus, sauf une fois débourbée', (A) => {
    const r = { id: 'ro', pressurage: { goutte_l: 800 }, saignee_de: { id: 'c3', l: 800 } };
    A.__pose({ cuves: [rouge(), r] }); const op = { volume_hl: 10 }; A._saigRoseSuit(op, { vers_rose: { id: 'ro' } });
    const suit = r.pressurage.goutte_l === 1000 && r.saignee_de.l === 1000 && op.vers_rose.id === 'ro';
    r.debourbage = { debut: '2026-09-14T09:00' }; A._saigRoseSuit({ volume_hl: 12 }, { vers_rose: { id: 'ro' } });
    return suit && r.pressurage.goutte_l === 1000; }],
  A5: ['la saignée ne se supprime pas tant que sa cuve de rosé existe ; supprimer la cuve délie la saignée', (A) => {
    const op = { type: 'saignee', vers_rose: { id: 'ro' } }, c = rouge({ operations: [op] }), r = { id: 'ro', nom: 'Rosé', saignee_de: { id: 'c3' } };
    A.__pose({ cuves: [c, r] }); const bl = A._saigRoseBloque(op); A._saigRoseOubli(r);
    return /supprimez d’abord/.test(bl) && !op.vers_rose && A._saigRoseBloque(op) === ''; }],
  A6: ['le jus saigné en cuve de rosé reste au rendement ; il est le contenu de la cuve de rosé', (A) =>
    A._saigRoseHl({ operations: [{ type: 'saignee', volume_hl: 8, vers_rose: { id: 'r' } }, { type: 'saignee', volume_hl: 3 }] }) === 8
    && A._saigRoseVol({ saignee_de: { l: 800 } }) === 8 && A._saigRoseVol({}) === 0],
  B1: ['l’enzymage : le produit de La Réserve et sa dose font l’opération « Enzymes », dosée sur le jus', (A) => {
    A.__pose({ prods: [{ id: 'enz1', nom: 'Lallzyme', unite: 'kg' }], dom: { 'deb-ep': 'enz1', 'deb-ed': '2' } });
    const e = A._debEnzPris({ pressurage: { goutte_l: 2000, presse_l: 380 } });
    return e.op.type === 'enzymes' && e.op.prod_id === 'enz1' && e.op.volume_hl === 23.8 && Math.abs(e.op.qte - 0.0476) < 1e-9 && e.op.qte_unite === 'kg' && /Lallzyme · 2 g\/hL/.test(e.txt); }],
  B2: ['pas de produit : pas d’enzymage ; un produit sans dose : refusé ; sans intrant œno : le texte d’avant', (A) => {
    A.__pose({ prods: [{ id: 'enz1', nom: 'Lallzyme', unite: 'kg' }], dom: { 'deb-ep': '', 'deb-ed': '' } }); const rien = A._debEnzPris({});
    A.__pose({ prods: [{ id: 'enz1', nom: 'Lallzyme', unite: 'kg' }], dom: { 'deb-ep': 'enz1', 'deb-ed': '' } }); const sans = A._debEnzPris({});
    A.__pose({ dom: { 'deb-e': 'pectinase 2 g/hL' } }); const txt = A._debEnzPris({});
    return rien === null && /dose/.test(sans.err) && txt.txt === 'pectinase 2 g/hL' && !txt.op; }],
  C1: ['« À faire » : le soutirage tombe à l’heure du repère, « dû » une fois passée', (A) => {
    const c = { id: 'ro', nom: 'Rosé', couleur: 'o', parcelles: [], debourbage: { debut: '2026-09-14T09:00' } };
    A.__pose({ config: { pratiques: P() }, cuves: [c] });
    const tot = A._debAFaire('2026-09-14', new Date(2026, 8, 14, 15, 0))[0], tard = A._debAFaire('2026-09-15', new Date(2026, 8, 15, 8, 0))[0];
    return tot.it.kind === 'debourbage' && tot.date === '2026-09-14' && tot.it.urgence === '' && /à 21 h 00/.test(tot.it.detail)
      && tard.date === '2026-09-15' && tard.it.urgence === 'due' && /atteint/.test(tard.it.detail); }],
  C2: ['sans repère : le jour même, sans urgence ; fini ou pas commencé : rien', (A) => {
    A.__pose({ config: {}, cuves: [{ id: 'a', nom: 'A', parcelles: ['Perr'], debourbage: { debut: '2026-09-14T09:00' } },
      { id: 'b', nom: 'B', parcelles: ['Perr'], debourbage: { debut: '2026-09-14T09:00', fin: '2026-09-15T09:00' } }, { id: 'c', nom: 'C', parcelles: ['Perr'] }] });
    const l = A._debAFaire('2026-09-14', new Date(2026, 8, 14, 12, 0));
    return l.length === 1 && l[0].it.ref === 'a' && l[0].date === '2026-09-14' && !l[0].it.urgence && /depuis 3 h/.test(l[0].it.detail); }],
  D1: ['la base d’un effervescent : l’impossible devient « à vérifier » (article 8) ; sans elle, impossible', (A) => {
    const e1 = A._coulMelange('o', 'b', true), e2 = A._coulMelange('b', 'r', true), n = A._coulMelange('o', 'b', false);
    return e1.niv === 'w' && e2.niv === 'w' && /mousseux ou un pétillant/.test(e1.d) && /cahier des charges/.test(e1.d) && n.niv === 'b' && A._coulMelange('r', 'b', true).id === 'mel-r-b'; }],
  D2: ['le texte dit qui interdit quoi : l’Europe sans indication géographique, la France avec, pour les vins tranquilles', (A) =>
    /sans indication géographique \(règlement 2019\/934, article 8\), la France pour les vins tranquilles/.test(A._coulMelange('b', 'r').d)],
  D3: ['une cuvée qui change de couleur relit ses apports (notés, sinon leur source)', (A) => {
    A.__pose({ cuves: [{ id: 'cv', parcelles: ['Perr'] }] });
    const cu = { apports: [{ coul: 'b', l: 30 }, { de_type: 'cuve', de_id: 'cv', l: 10 }] };
    return A._cuvCoulApports(cu, 'o', false).niv === 'b' && A._cuvCoulApports(cu, 'o', true).niv === 'w' && A._cuvCoulApports(cu, 'b', false) === null
      && A._cuvApportCoul({ de_type: 'cuve', de_id: 'cv' }) === 'b'; }],
  E1: ['la saignée : vérifiée avant la première écriture, la cuve de rosé créée après le volume ; la suppression gardée', (A, S) => {
    const s = fn(S.cu, 'saveVendOp'), d = fn(S.cu, '_vendOpDel'), x = fn(S.cu, 'deleteVendCuve');
    return avant(s, 'var _rose=(_vendOpType===\'saignee\')?_saigRosePret(', 'c.volume_hl=(c.volume_hl||0)+prev.volume_hl') && avant(s, 'if(_rose&&_rose.err)', 'var op={id:')
      && avant(s, "op.volume_hl=parseFloat((document.getElementById('vop-vol')||{}).value)||0;", '_saigRoseCree(c, op, _rose.nom)')
      && avant(d, 'var _bl=_saigRoseBloque(op); if(_bl)', 'window.openConfirmDel(') && avant(x, '_saigRoseOubli(', 'CAVE_VENDANGE.cuves_vinif=(CAVE_VENDANGE.cuves_vinif||[]).filter('); }],
  E2: ['le contenu d’une cuve de rosé, le rendement, la fiche rebâtie, la feuille et le détail de la saignée', (A, S) =>
    /if\(!\(kg>0\)\)\{ var _sl=_saigRoseVol\(c\);/.test(fn(S.cu, '_vendVolContenu')) && fn(S.cu, '_vendVolCuve').includes('vol+=_vendPrelevHl(cv)+_saigRoseHl(cv);')
    && fn(S.cu, 'saveVendCuve').includes('saignee_de:existing?(existing.saignee_de||undefined):undefined') && fn(S.cu, '_vendOpFields').includes('+_saigRoseHtml(c, op);')
    && fn(S.cu, 'openVendOp').includes('_saigRoseReset();') && fn(S.cu, '_vendOpDet').includes("o.vers_rose?' \\u2192 '") && fn(S.cu, '_vendIntrVolLbl').includes("s==='saignee'")],
  E3: ['l’enzymage : vérifié avant d’écrire le débourbage, écrit en opération « Enzymes » liée (enz_op)', (A, S) => {
    const s = fn(S.pr, 'saveDebourber');
    return avant(s, 'ez=_debEnzPris(c);', 'c.debourbage={ methode') && avant(s, 'if(ez&&ez.err)', 'c.debourbage={ methode') && s.includes('c.operations.push(_eo); c.debourbage.enz_op=_eo.id;')
      && fn(S.pr, '_debRendre').includes('+_debEnzHtml(c)') && S.cu.includes('window._vendTriOps = _vendTriOps;'); }],
  E4: ['« À faire » : _mlAgenda lit _debAFaire ; le geste, son verbe, son ordre ; « Soutirer » ouvre la feuille du soutirage ; le Pilotage le compte', (A, S) =>
    fn(S.cave, '_mlAgenda').includes("window._debAFaire(from).forEach(function(x){ pousse(x.date,x.it); });") && /var _AUJ_CUVE=\{[^}]*debourbage:1/.test(S.cave)
    && /var _AUJ_ORD=\{[^}]*debourbage:1/.test(S.cave) && /debourbage:'Soutirer'[,}]/.test(S.cave) && /var _ML_LBL=\{[^}]*debourbage:'Soutirer le jus clair'/.test(S.cave)
    && /if\(kind==='debourbage'\)\{[\s\S]{0,300}window\.openDebourber\(ref,'fin'\)/.test(fn(S.cave, '_mlGo')) && S.pil.includes("debourbage:['soutirage de jus clair','soutirages de jus clair']")
    && S.css.includes('#page-cave .k-soutirage, #page-cave .k-debourbage{')],
  E5: ['une cuvée : sa couleur relue AVANT d’écrire, la base d’effervescent écrite ; l’assemblage lit la base et note la couleur reçue', (A, S) => {
    const s = fn(S.cave, 'saveCuvee');
    return avant(s, 'if(_ccB){ showToast(_ccB', 'CAVE_ELEVAGE.cuvees.push(') && avant(s, 'if(_ccB){ showToast(_ccB', 'Object.assign(_prevC,') && s.includes('if(_effN) _prevC.base_eff=true; else delete _prevC.base_eff;')
      && fn(S.cave, '_asmMel').includes('!!(cu&&cu.base_eff)') && fn(S.cave, '_asmValider').includes("coul:s.coul||'?'"); }],
  F1: ['le tuto « tirer un rosé de saignée » : sa cuve chargée pour lui seul, ses gestes, sa fin', (A, S) => {
    const t = S.tu.slice(S.tu.indexOf("{ id: 'saignee'"), S.tu.indexOf("{ id: 'saignee'") + 6000);
    return /couvre: \['openVendOp', '_vendOpSet', '_saigRoseSet', 'saveVendOp'\]/.test(t) && t.includes('[data-tuto="saig.rose"]') && t.includes("x.saignee_de.id === 'tu_cvr'")
      && S.tu.includes("=== 'saignee' && typeof window.applyFbData === 'function') { try { window.applyFbData('cave_vendange', _tuCaveSaig());")
      && /'saig\.rose':'data-tuto="saig\.rose"'/.test(S.pr) && S.cu.includes('data-tuto="cuv.op"') && S.cu.includes(' data-tuto="vop.saignee"') && S.cu.includes('data-tuto="vop.ok"'); }],
  F2: ['les trois gestes rares exemptés avec leur raison ; le plafond au plus à 785', (A, S) => {   // CAVE-SUITE (§627) : il ne fait que descendre
    const c = JSON.parse(S.cov); return ['_debEnzCalc', '_cuvEffSet', '_cuvCoulOkSet'].every((n) => /PRATIQUES-3/.test(c.exempts[n] || '')) && c.plafond <= 785; }],
  G1: ['l’aide, le guide et « Quoi de neuf » disent la saignée, l’enzymage, « À faire », l’effervescent', (A, S) =>
    S.utils.includes("['Un rosé de saignée', ") && S.g08.includes('<b>Un rosé de saignée</b>') && /v: '11\.46'[^\n]*PRATIQUES-3/.test(S.wn)
    && /enzymage/i.test(S.wn.slice(S.wn.indexOf("v: '11.46'"), S.wn.indexOf("v: '11.45'"))) && /effervescent/.test(S.g08)],
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
  ['la cuve de rosé perd ses parcelles', (S) => ({ ...S, pr: remp(S.pr, 'parcelles:(c.parcelles||[]).slice(),\n    date_entree:d', 'parcelles:[],\n    date_entree:d') })],
  ['la cuve de rosé naît sans son jus', (S) => ({ ...S, pr: remp(S.pr, 'pressurage:{goutte_l:l, presse_l:null},', '') })],
  ['un volume nul crée quand même la cuve', (S) => ({ ...S, pr: remp(S.pr, "  if(!(vol>0)) return {err:'Indiquez le volume saigné", "  if(false) return {err:'Indiquez le volume saigné") })],
  ['la correction touche une cuve déjà débourbée', (S) => ({ ...S, pr: remp(S.pr, "if(!r||(r.debourbage&&r.debourbage.debut)||!(l>0)) return;", "if(!r||!(l>0)) return;") })],
  ['la saignée se supprime avec sa cuve de rosé', (S) => ({ ...S, cu: remp(S.cu, "  var _bl=_saigRoseBloque(op); if(_bl){ showToast(_bl,'#B85A1A'); return; }", '') })],
  ['le jus saigné sort du rendement', (S) => ({ ...S, cu: remp(S.cu, 'vol+=_vendPrelevHl(cv)+_saigRoseHl(cv);', 'vol+=_vendPrelevHl(cv);') })],
  ['la cuve de rosé est vérifiée après la première écriture', (S) => {
    const a = "  var _rose=(_vendOpType==='saignee')?_saigRosePret(c, parseFloat((document.getElementById('vop-vol')||{}).value)||0, prev):null;\n  if(_rose&&_rose.err){ showToast(_rose.err,'#B85A1A'); return; }\n";
    const t = remp(S.cu, a, ''); return { ...S, cu: remp(t, "  var op={id:editId||('vop_'+Date.now()),type:_vendOpType,date:date,note:note};", a + "  var op={id:editId||('vop_'+Date.now()),type:_vendOpType,date:date,note:note};") }; }],
  ['la fiche rebâtie perd la saignée d’origine', (S) => ({ ...S, cu: remp(S.cu, 'saignee_de:existing?(existing.saignee_de||undefined):undefined', 'saignee_de:undefined') })],
  ['l’enzymage passe sans dose', (S) => ({ ...S, pr: remp(S.pr, "if(!(dose>0)) return {err:'Indiquez la dose de '+p.nom+'.'};", '') })],
  ['l’enzymage n’écrit plus l’opération (pas de sortie de stock)', (S) => ({ ...S, pr: remp(S.pr, 'c.operations.push(_eo); c.debourbage.enz_op=_eo.id;', 'c.debourbage.enz_op=_eo.id;') })],
  ['« À faire » oublie l’urgence du repère passé', (S) => ({ ...S, pr: remp(S.pr, "urgence:passe?'due':''", "urgence:''") })],
  ['« À faire » ne lit plus les débourbages', (S) => ({ ...S, cave: remp(S.cave, "window._debAFaire(from).forEach(function(x){ pousse(x.date,x.it); });", '') })],
  ['« Soutirer » n’ouvre plus le soutirage', (S) => ({ ...S, cave: remp(S.cave, "window.openDebourber(ref,'fin');", "window.openDebourber(ref,'debut');") })],
  ['la base d’un effervescent ne change rien', (S) => ({ ...S, pr: remp(S.pr, 'if(bloque&&eff) return', 'if(false) return') })],
  ['un changement de couleur ne relit plus les apports', (S) => ({ ...S, cave: remp(S.cave, "  if(_ccB){ showToast(_ccB,'#B85A1A'); return; }\n", '') })],
  ['l’assemblage ignore la base d’un effervescent', (S) => ({ ...S, cave: remp(S.cave, ", !!(cu&&cu.base_eff)):null;", "):null;") })],
  ['le tuto ne crée plus la cuve de rosé', (S) => ({ ...S, tu: remp(S.tu, "'_saigRoseSet', ", '') })],
  ['« Quoi de neuf » oublié', (S) => ({ ...S, wn: remp(S.wn, "v: '11.46'", "v: '11.4x'") })],
];

if (!CONTRE) {
  const L = jouer(SAIN);
  console.log('\nPRATIQUES-3 — la saignée, l’enzymage, « À faire », l’effervescent, le changement de couleur');
  for (const [lib, ok, err] of L) console.log('  ' + (ok ? c.v('✓') : c.r('✗')) + ' ' + lib + (err ? c.d('  → ' + err) : ''));
  const ko = L.filter((x) => !x[1]).length;
  console.log('\n  ' + (ko ? c.r(ko + ' rouge(s)') : c.v('✓ ' + L.length + ' vertes, 0 rouge')) + '\n');
  process.exit(ko ? 1 : 0);
} else {
  console.log('\nPRATIQUES-3 — contre-épreuves (chaque défaut doit rougir)');
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
