// ═══════════════════════════════════════════════════════════════════════════
//  HARNAIS FUT-CAP + CUV-14 — LA CONTENANCE D'UN FUT, ET LE VOLUME DECUVE
// ═══════════════════════════════════════════════════════════════════════════
//  Nico, 18/09 : « Je dois pouvoir modifier manuellement la contenance d'un fût
//  si nécessaire. Lors du décuvage il faut que je puisse indiquer la quantité
//  exacte décuvée. » Contenance rangée dans le LOT (sa réponse : « ta reco »),
//  maquette v1 validée (« go »).
//
//  Sur les VRAIES fonctions extraites de src/cave.js et src/utils.js.
//
//  CE QUE CE HARNAIS PROUVE
//   A. le volume d'une cuvée compte chaque fût à SA contenance ; un fût sans
//      contenance vaut, au litre près, ce qu'il valait (le réglage du domaine) ;
//   B. la proposition au volume rend, litre par litre de 5 à 4000 L, l'arrondi
//      d'avant quand tous les lots sont au format ; elle suit la contenance d'un
//      lot, prend du plus vieux au plus neuf, et garde les choix hors format ;
//   C. le bilan : estimé = les mots et la tolérance d'avant ; mesuré = au litre,
//      et « le dernier fût attend 10 L » n'est pas une faute ;
//   D. la contenance voyage (lot → cuvée → lot) et un demi-muid ne se fond
//      jamais dans un lot de pièces du même tonnelier ;
//   E. « Modifier la cuvée » garde l'identité des fûts et n'invente aucun fût ;
//   F. les écritures : volume saisi et sa source, les refus AVANT toute écriture ;
//   G. La Réserve : champ, contrôle, étiquette, PDF, police du choix Acheté/Loué ;
//   H. l'aide, les guides et « Quoi de neuf » le disent.
//
//  ⚠ Contre-épreuve (--contre) : chaque ancre doit être UNIQUE dans la fonction
//    visée (§129d), et l'essai doit passer sur le code sain — sinon ROUGE.
//
//  Usage :  node scripts/mv-harnais-futcap.mjs
//           node scripts/mv-harnais-futcap.mjs --contre
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { lireCave } from './mv-cave-src.mjs';   // ★ CUV-DEC (§164) : la Cave = cave.js + cuvier.js
const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SAIN = {
  cave: lireCave(), utils: lire('src/utils.js'), rsv: lire('src/reserve.js'),
  idx: lire('index.html'), g08: lire('guide/08-cave.html'), g09: lire('guide/09-reserve.html')
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
function table(src, nom) {
  const i = src.indexOf('var ' + nom + ' = {');
  if (i < 0) throw new Error('table absente : ' + nom);
  const j = src.indexOf('\n};', i);
  return src.slice(i, j + 3);
}

const NC = ['_mvF1', '_caveFutL', '_caveFutHl', '_caveTonL', '_caveFutsL', '_caveHorsFormat', '_caveLTxt',
  '_caveGroupesL', '_caveNbTonneaux', '_caveVolCuvesL', '_caveVolL', '_caveManqueL', '_caveCuveSource', '_caveTonneauxStr', '_cuvTonneauxDe',
  '_vendDecVieux', '_vendDecLotL', '_vendDecPropVol', '_vendDecF2', '_vendDecBilan', '_mlVolParFut'];
const NU = ['_mvFutAn', '_mvFutVins', '_mvFutNorm', '_mvFutMemeLot', '_mvFutRef', '_mvFutL', '_mvFutRid',
  '_mvFutTracer', '_mvFutStock', '_mvFutEntrer', '_mvFutEntonner', '_mvFutLiberer', '_mvFutRetirer',
  '_mvFutLotsDe', '_mvFutDispo', '_mvFutReprendre'];
const PRELUDE = `
var window = { CONFIG: { cave: { fut_l: 228 } } };
function _mvToday(){ return '2026-09-19'; }
var CAVE_ELEVAGE = { operations: [] };
function __ops(o){ CAVE_ELEVAGE.operations = o; }
function _escHtml(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
`;
function charger(S) {
  const code = PRELUDE + NC.map(n => fn(S.cave, n)).join('\n') + '\n' + table(S.utils, 'MV_FUT_MOTIFS') + '\n'
    + NU.map(n => fn(S.utils, n)).join('\n') + '\n;({' + [...NC, ...NU].join(',') + ', window, __ops})';
  return vm.runInNewContext(code, {});
}

/* ══ LES ASSERTIONS ══ */
const mk = (id, annee, qte, l) => ({ id, annee, qte, l: l || null });
const tot = o => Object.values(o).reduce((s, n) => s + n, 0);
const avant = (t, a, b) => t.indexOf(a) >= 0 && t.indexOf(b) >= 0 && t.indexOf(a) < t.indexOf(b);
const CUV1 = () => ({ tonneaux: [{ annee: 2022, nb: 4 }, { annee: 2024, nb: 1, l: 500 }], cuves: [{ ref: 'c', litres: 800 }] });
const T = {
  // A — volumes
  A1: ['4 pièces + 1 demi-muid + 8 hL de cuve = 2212 L', A => A._caveVolL(CUV1()) === 2212],
  A2: ['un fût sans contenance vaut le domaine : 5 × 228 = 1140 L, comme avant', A => A._caveVolL({ tonneaux: [{ annee: 2020, nb: 5 }] }) === 1140],
  A3: ['l’ancien champ nb_tonneaux se lit encore (3 × 228)', A => A._caveVolL({ nb_tonneaux: 3 }) === 684],
  A4: ['_caveFutsL ne compte pas les cuves (bois seulement)', A => A._caveFutsL(CUV1()) === 1412],
  A5: ['domaine à 225 : un fût sans contenance le suit, un fût à 228 garde la sienne', A => {
    A.window.CONFIG.cave.fut_l = 225;
    const ok = A._caveVolL({ tonneaux: [{ nb: 2 }] }) === 450 && A._caveVolL({ tonneaux: [{ nb: 2, l: 228 }] }) === 456;
    A.window.CONFIG.cave.fut_l = 228; return ok; }],
  A6: ['la répartition dit « (500 L) » pour le seul fût qui n’est pas au format', A => {
    const t = A._caveTonneauxStr({ tonneaux: [{ annee: 2022, nb: 2 }, { annee: 2024, nb: 1, l: 500 }] });
    return t.includes('(500\u00a0L)') && !t.includes('228'); }],
  A7: ['hors format = plus de 10 % d’écart (500, 114, 251 oui ; 225, 250 non)', A =>
    A._caveHorsFormat(500) && A._caveHorsFormat(114) && A._caveHorsFormat(251) && !A._caveHorsFormat(225) && !A._caveHorsFormat(250)],
  A8: ['les contenants se regroupent par contenance, du plus petit au plus grand', A => {
    const g = A._caveGroupesL(CUV1());
    return g.length === 2 && g[0].l === 228 && g[0].nb === 4 && g[1].l === 500 && g[1].nb === 1; }],
  // B — proposition
  B1: ['lots au format : l’arrondi d’avant, litre par litre de 5 à 4000 L', A => {
    const lots = [mk('a', 2020, 100), mk('b', 2021, 100)];
    for (let L = 5; L <= 4000; L++) if (tot(A._vendDecPropVol(lots, L, {})) !== Math.round(L / 228)) return false;
    return true; }],
  B2: ['du plus vieux au plus neuf : 11,30 hL → les 5 fûts de 2022', A => {
    const o = A._vendDecPropVol([mk('n', 2026, 3), mk('v', 2025, 4), mk('o', 2022, 5)], 1130, {});
    return o.o === 5 && !o.n && !o.v; }],
  B3: ['un lot à 225 L : 5 fûts pour 11,30 hL, et jamais plus que le disponible', A =>
    A._vendDecPropVol([mk('o', 2022, 5, 225)], 1130, {}).o === 5 && A._vendDecPropVol([mk('o', 2022, 5, 225)], 1240, {}).o === 5],
  B4: ['13,68 hL : 5 × 225 puis 1 × 228, et 15 L qui ne réclament pas de fût', A => {
    const o = A._vendDecPropVol([mk('o', 2022, 5, 225), mk('v', 2025, 4)], 1368, {});
    return o.o === 5 && o.v === 1; }],
  B5: ['un fût hors format choisi reste, les barriques couvrent le reste', A => {
    const o = A._vendDecPropVol([mk('o', 2022, 5)], 630, { dm: 1 });
    return o.dm === 1 && o.o === 3; }],
  B6: ['la feuille ne propose que des lots au format, et garde les choix hors format', (A, S) => {
    const f = fn(S.cave, '_vendDecPropose');
    /* ★ CREUX-1 (§165) : la proposition exclut AUSSI les lots choisis à la main — l'exclusion du hors-format reste exigée. */
    return /std=lots\.filter\(function\(l\)\{ return !_caveHorsFormat\(_vendDecLotL\(l\)\)( && !_vendDecMain\[l\.id\])?; \}\)/.test(f) && /garde\[l\.id\]=n/.test(f); }],
  // C — bilan
  C1: ['mesuré 11,30 pour 11,40 : « le dernier fût attend 10 L », pas orange', A => {
    const b = A._vendDecBilan(11.30, true, 11.40, 228, 'fut', ''); return !b.ko && b.l.includes('le dernier f\u00fbt attend 10\u00a0L'); }],
  C2: ['mesuré 11,30 pour 9,12 : orange, « il reste 2,18 hL »', A => {
    const b = A._vendDecBilan(11.30, true, 9.12, 228, 'fut', ''); return b.ko && b.l.includes('il reste 2,18 hL sans contenant'); }],
  C3: ['mesuré 11,30 pour 11,25 : « il reste 5 L », pas orange', A => {
    const b = A._vendDecBilan(11.30, true, 11.25, 225, 'fut', ''); return !b.ko && b.l.includes('il reste 5\u00a0L sans contenant'); }],
  C4: ['un fût de trop : orange, « 5,10 hL de contenants en trop »', A => {
    const b = A._vendDecBilan(11.30, true, 16.40, 228, 'fut', ''); return b.ko && b.l.includes('5,10 hL de contenants en trop'); }],
  C5: ['au litre près : « le compte est bon »', A => A._vendDecBilan(11.40, true, 11.40, 228, 'fut', '').l.includes('le compte est bon')],
  C6: ['estimé : il dit sa source, ne se dit pas « décuvé », et garde la tolérance d’avant', A => {
    const b = A._vendDecBilan(11.62, false, 11.40, 228, 'fut', 'estim\u00e9s d\u2019apr\u00e8s les caisses');
    return !b.ko && b.l.includes('caisses') && !b.l.includes('d\u00e9cuv\u00e9s') && b.l.includes('le compte est bon'); }],
  C7: ['estimé à plus de 0,6 hL d’écart : orange, comme avant', A => A._vendDecBilan(11.62, false, 9.12, 228, 'fut', '').ko],
  C8: ['en cuve seule, trop logé n’est pas « un dernier fût »', A => A._vendDecBilan(11.30, true, 11.40, 0, 'cuve', '').ko],
  // D — la contenance voyage
  D1: ['le stock porte la contenance d’un lot, null sinon', A => {
    const st = A._mvFutStock({ futs: [{ id: 'a', four: 'R', ref: 'DM', annee: '2024', qte: 2, l: 500 },
      { id: 'b', four: 'R', ref: 'CM', annee: '2022', qte: 5 }] }, 2026);
    return st.lots.find(l => l.id === 'a').l === 500 && st.lots.find(l => l.id === 'b').l === null; }],
  D2: ['l’entonnage emporte la contenance dans la cuvée', A => {
    const I = { futs: [{ id: 'a', four: 'R', ref: 'DM', annee: '2024', qte: 2, l: 500 }], fut_mouv: [] };
    const o = A._mvFutEntonner({ a: 1 }, I, 'x'); return o.length === 1 && o[0].l === 500 && I.futs[0].qte === 1; }],
  D3: ['la mise en bouteille rend le demi-muid à SON lot', A => {
    const I = { futs: [{ id: 'a', four: 'R', ref: 'DM', annee: '2024', qte: 2, l: 500 }], fut_mouv: [] };
    const o = A._mvFutEntonner({ a: 1 }, I, 'x'); A._mvFutLiberer({ nom: 'x', tonneaux: o }, I);
    return I.futs.length === 1 && I.futs[0].qte === 2 && I.futs[0].l === 500; }],
  D4: ['un demi-muid ne se fond pas dans un lot de pièces du même tonnelier', A => {
    const I = { futs: [{ id: 'p', four: 'R', ref: 'X', annee: '2024', qte: 2 }], fut_mouv: [] };
    A._mvFutLiberer({ nom: 'c', tonneaux: [{ annee: 2024, nb: 1, four: 'R', ref: 'X', l: 500 }] }, I);
    const p = I.futs.find(f => f.id === 'p'), n = I.futs.find(f => f.id !== 'p');
    return I.futs.length === 2 && p.qte === 2 && n && n.l === 500 && n.qte === 1; }],
  D5: ['un fût retiré revient au parc avec sa contenance', A => {
    const I = { futs: [], fut_mouv: [] };
    A._mvFutRetirer({ nom: 'c', tonneaux: [{ annee: 2024, nb: 1, four: 'R', ref: 'DM', l: 500 }] }, 2024, 1, I, true);
    return I.futs.length === 1 && I.futs[0].l === 500; }],
  D6: ['un lot sans contenance garde la forme d’avant (pas de clé l)', A => {
    const I = { futs: [{ id: 'b', four: 'R', ref: 'CM', annee: '2022', qte: 5 }], fut_mouv: [] };
    const o = A._mvFutEntonner({ b: 2 }, I, 'x'); return !('l' in o[0]); }],
  // E — la fiche cuvée
  E1: ['la fiche garde tonnelier, référence, lot et contenance', A => {
    const r = A._cuvTonneauxDe({ tonneaux: [{ annee: 2022, nb: 2, four: 'R', ref: 'CM', lot_id: 'x', l: 225 }] });
    return r[0].four === 'R' && r[0].ref === 'CM' && r[0].lot_id === 'x' && r[0].l === 225; }],
  E2: ['une cuvée en cuve seule s’ouvre sans fût', A => A._cuvTonneauxDe({ cuves: [{ ref: 'c', litres: 800 }], tonneaux: [] }).length === 0],
  E3: ['une cuvée NOUVELLE garde la proposition d’avant (2 + 4)', A => A._cuvTonneauxDe(null).length === 2],
  E4: ['la fiche travaille sur une copie', A => {
    const src = { tonneaux: [{ annee: 2022, nb: 2 }] }; const r = A._cuvTonneauxDe(src); r[0].nb = 9; return src.tonneaux[0].nb === 2; }],
  E5: ['« Embouteillée » posé depuis la fiche rend les fûts AVANT de poser le statut', (A, S) => {
    const f = fn(S.cave, 'saveCuvee');
    return /statut==='embouteille' && _prevC\.statut!=='embouteille'/.test(f) && avant(f, '_mvFutLiberer(', 'Object.assign(_prevC'); }],
  E6: ['une cuvée logée en cuve s’enregistre sans fût', (A, S) => /\(_exC\.cuves\|\|\[\]\)\.length/.test(fn(S.cave, 'saveCuvee'))],
  E7: ['la colonne Contenance : vide ou égale au domaine = suit le domaine', (A, S) => {
    const f = fn(S.cave, 'updateCuvTonneau'); return f.includes("field==='l'") && f.includes('delete _cuvTonneaux[i].l'); }],
  // F — les écritures
  F1: ['le décuvage écrit le volume saisi ET sa source', (A, S) => {
    const f = fn(S.cave, 'saveVendDecuvage');
    return f.includes("c.vol_decuve_src='mesure'") && f.includes("c.vol_decuve_src='contenants'") && f.includes('c.vol_decuve_hl=_vendDecVolSaisi'); }],
  F2: ['les refus (volume impossible, cuve prise) passent AVANT toute écriture', (A, S) => {
    const f = fn(S.cave, 'saveVendDecuvage');
    return avant(f, '_vendDecVolSaisi>_cap', '_mvFutEntonner(') && avant(f, '_caveCuveOcc(', '_mvFutEntonner(')
      && avant(f, '_mvFutEntonner(', 'CAVE_ELEVAGE.cuvees.push'); }],
  F3: ['« Modifier » la cuve garde la source et la date du volume décuvé', (A, S) => {
    const f = fn(S.cave, 'saveVendCuve'); return f.includes('vol_decuve_src:existing') && f.includes('vol_decuve_le:existing'); }],
  F4: ['le bilan de campagne ne porte plus 2,28 en dur', (A, S) => { const f = fn(S.cave, '_bcData'); return !f.includes('2.28') && f.includes('_caveVolL(x)'); }],
  F5: ['la part des anges compte les litres de chaque fût', (A, S) => S.cave.includes('loge=p.futL/100') && !S.cave.includes('p.futs*c.futL')],
  F6: ['un fût retiré compte à sa contenance et la rend au parc', (A, S) => {
    const f = fn(S.cave, 'saveRetraitFut'); return f.includes('_retraitFutL(cuv)') && f.includes('l:(entree&&entree.l)'); }],
  F7: ['la sortie d’un champ met à jour SUR PLACE (le « + » n’est plus avalé)', (A, S) => {
    const b = fn(S.cave, '_vendDecVolBind'), c = fn(S.cave, '_vendDecCuveVolFin');
    const ch = b.slice(b.indexOf("'change'"));
    return ch.includes('_vendDecRender()') && !ch.includes('_vendDecZone()') && !c.includes('_vendDecZone()'); }],
  F8: ['plus de fût fantôme : le repli « _vendDecNb||1 » a disparu du CODE', (A, S) =>
    !fn(S.cave, 'saveVendDecuvage').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').includes('_vendDecNb||1')],
  F9: ['le détail d’une cuve décuvée montre et corrige son volume', (A, S) => {
    const d = fn(S.cave, '_vendDetailHtml'), c = fn(S.cave, '_vendDvolCorriger');
    return d.includes('_vendDvolHtml(c, canEdit)') && avant(c, 'n>cap', 'c.vol_decuve_hl='); }],
  // G — La Réserve
  G1: ['le formulaire du lot a son champ Contenance', (A, S) => S.rsv.includes('id="mvr-fut-l"')],
  G2: ['la contenance se contrôle AVANT toute écriture', (A, S) => avant(fn(S.rsv, '_rsvSaveFut'), '_lN<50||_lN>5000', '_uniqPush(')],
  G3: ['égale au domaine = pas de contenance propre', (A, S) => {
    const f = fn(S.rsv, '_rsvSaveFut'); return f.includes('if(_lV===_rsvDomL()) _lV=null;') && f.includes('delete f.l'); }],
  G4: ['« Acheté / Loué » retrouve la police de l’app (raccourci invalide retiré)', (A, S) => !S.rsv.includes('font:600 12px/1 inherit')],
  G5: ['l’inventaire PDF imprime la contenance', (A, S) => fn(S.rsv, '_rsvExportFutsPdf').includes('f.l')],
  G6: ['la carte du lot porte son étiquette de contenance', (A, S) => fn(S.rsv, '_rsvFutsHtml').includes('_rsvCapTag(f)')],
  // H — ce que l'app raconte d'elle-même
  H1: ['l’aide nomme la contenance d’un lot et le volume décuvé', (A, S) =>
    S.utils.includes("['Un fût qui n’a pas la contenance du domaine'") && S.utils.includes("['Corriger un volume décuvé'")
    && S.utils.includes("['La contenance d’un lot'") && S.utils.includes('<b>volume décuvé</b>')],
  H2: ['les guides le disent, et 09 ne promet plus la fusion retirée', (A, S) =>
    S.g08.includes('Le volume décuvé') && S.g08.includes('Corriger le volume') && S.g09.includes("Contenance d'un fût")
    && !S.g09.includes("ajoute à l'existant")],
  H3: ['« Quoi de neuf » s’ouvre sur la version ; 7.38 a ses trois entrées, 7.39 ses deux', (A, S) => {
    const v = (S.utils.match(/export const APP_VERSION = '([^']+)'/) || [])[1];
    const tete = (S.utils.match(/export const WHATS_NEW = \[\n  \{ v: '([^']+)'/) || [])[1];
    const n = ver => { const m = S.utils.match(new RegExp("\\{ v: '" + ver.replace('.', '\\.') + "', items: \\[([\\s\\S]*?)\\n  \\] \\},"));
      return m ? (m[1].match(/\{ emoji:/g) || []).length : -1; };
    return tete === v && n('7.38') === 3 && n('7.39') === 2; }],
  H4: ['la fiche cuvée annonce la colonne Contenance', (A, S) => S.idx.includes('Contenance (vide = réglage du domaine)')],
  H5: ['la fiche « i » du rendement et celle de l’agenda disent la nouvelle méthode', (A, S) =>
    S.utils.includes('Le volume <b>décuvé</b> est celui que vous saisissez') && S.utils.includes('un demi-muid de 500\\u00a0L pour 2,2 pièces')
    && !S.utils.includes('jamais d\\u2019une moyenne par fût')],
  // I — FUT-CAP-2 : une cuvée remise en élevage reprend ses fûts
  I1: ['ce qui est encore libre au parc, triplet ET contenance', A => {
    const I = { futs: [{ id: 'a', four: 'R', ref: 'DM', annee: '2024', qte: 1, l: 500 }, { id: 'b', four: 'R', ref: 'CM', annee: '2022', qte: 1 }] };
    const d = A._mvFutDispo({ tonneaux: [{ annee: 2024, nb: 1, four: 'R', ref: 'DM', l: 500 }, { annee: 2022, nb: 2, four: 'R', ref: 'CM' }] }, I);
    return d.besoin === 3 && d.dispo === 2 && d.manque === 1; }],
  I2: ['deux lignes sur un même lot ne comptent pas deux fois ses fûts', A => {
    const I = { futs: [{ id: 'b', four: 'R', ref: 'CM', annee: '2022', qte: 3 }] };
    const d = A._mvFutDispo({ tonneaux: [{ annee: 2022, nb: 2, four: 'R', ref: 'CM' }, { annee: 2022, nb: 2, four: 'R', ref: 'CM' }] }, I);
    return d.dispo === 3 && d.manque === 1; }],
  I3: ['embouteillée puis remise en élevage : le parc revient à l’identique', A => {
    const I = { futs: [{ id: 'b', four: 'R', ref: 'CM', annee: '2022', qte: 1 }], fut_mouv: [] };
    const cu = { nom: 'x', tonneaux: [{ annee: 2022, nb: 4, four: 'R', ref: 'CM' }, { annee: 2024, nb: 1, four: 'R', ref: 'DM', l: 500 }] };
    A._mvFutLiberer(cu, I);
    const avant = JSON.stringify(A._mvFutDispo(cu, I));
    const pris = A._mvFutReprendre(cu, I, 'retour');
    return avant === JSON.stringify({ besoin: 5, dispo: 5, manque: 0 }) && pris === 5 && I.futs.length === 1
      && I.futs[0].qte === 1 && I.fut_mouv.filter(m => m.motif === 'entonnage').length === 2; }],
  I4: ['un demi-muid ne se reprend pas dans un lot de pièces', A => {
    const I = { futs: [{ id: 'p', four: 'R', ref: 'X', annee: '2024', qte: 2 }] };
    return A._mvFutDispo({ tonneaux: [{ annee: 2024, nb: 1, four: 'R', ref: 'X', l: 500 }] }, I).dispo === 0; }],
  I5: ['la fiche refuse AVANT toute écriture s’il en manque, et efface la mise en bouteille annulée', (A, S) => {
    const f = fn(S.cave, 'saveCuvee');
    return f.includes('if(_dsp.manque>0){') && avant(f, '_dsp.manque>0', '_mvFutReprendre(') && avant(f, '_dsp.manque>0', 'Object.assign(_prevC')
      && f.includes('delete _prevC.date_embouteillage'); }],
  // J — FUT-CAP-2 : l'ouillage à prévoir, à la contenance
  J1: ['l’agenda relit l’ouillage rapporté à une pièce quand il existe', A => {
    A.__ops([{ type: 'ouillage', cuvees_ids: ['c'], data: { vol_par_fut_L: 9.3, vol_par_eq_L: 7 } }]);
    return A._mlVolParFut('c') === 7; }],
  J2: ['un ouillage d’avant ce lot se relit encore', A => {
    A.__ops([{ type: 'ouillage', cuvees_ids: ['c'], data: { vol_par_fut_L: 6.5 } }]); return A._mlVolParFut('c') === 6.5; }],
  J3: ['les litres à prévoir comptent chaque fût à sa contenance (pièces : inchangé)', (A, S) =>
    fn(S.cave, '_mlOuillages').includes('litres:Math.round(_caveFutsL(c)/_caveFutL()*_mlVolParFut(c.id))')
    && A._caveFutsL({ tonneaux: [{ nb: 5 }] }) / A._caveFutL() === 5
    && Math.abs(A._caveFutsL({ tonneaux: [{ nb: 1, l: 500 }] }) / A._caveFutL() - 500 / 228) < 1e-9],
  J4: ['un ouillage enregistre sa part par pièce', (A, S) => S.cave.includes('vol_par_eq_L:_eq>0?Math.round(volTotal/_eq*10)/10:null')
    && fn(S.cave, '_copGetEqFuts').includes('_caveFutsL(c)/_caveFutL()')]
};

function jouer(S) {
  const A = charger(S), r = {};
  for (const k in T) { try { r[k] = !!T[k][1](A, S); } catch (e) { r[k] = false; } }
  return r;
}

const V = '\x1b[32m', R = '\x1b[31m', Z = '\x1b[0m';
if (!CONTRE) {
  const r = jouer(SAIN); let ok = 0, ko = 0;
  for (const k in T) { if (r[k]) { ok++; console.log('  ' + V + '✓' + Z + ' ' + k + ' ' + T[k][0]); }
                       else { ko++; console.log('  ' + R + '✗ ' + k + ' ' + T[k][0] + Z); } }
  console.log('\nFUT-CAP + CUV-14 : ' + ok + ' vertes, ' + ko + ' rouges');
  process.exit(ko ? 1 : 0);
}

/* ══ CONTRE-ÉPREUVES — le défaut réintroduit, l'assertion doit rougir ══ */
const MUT = [
  ['cave', '_caveTonL', '(isFinite(v)&&v>0)?v:_caveFutL()', '_caveFutL()', 'A1', 'la contenance d’un fût ignorée'],
  ['cave', '_caveVolL', '_caveFutsL(cuv)+_caveVolCuvesL(cuv)', '_caveNbTonneaux(cuv)*_caveFutL()+_caveVolCuvesL(cuv)', 'A1', 'le volume d’avant ce lot'],
  ['cave', '_vendDecPropVol', 'resteL>=_vendDecLotL(nx)/2', 'resteL>0', 'B1', 'un fût entamé pour un fond de cuve'],
  ['cave', '_vendDecPropVol', '.slice().sort(_vendDecVieux)', '.slice()', 'B2', 'le neuf avant le vieux'],
  ['cave', '_vendDecBilan', '-ecL<minL', '-ecL<0', 'C1', 'le dernier fût entamé passe pour une faute'],
  ['utils', '_mvFutEntonner', 'if(_l) o.l = _l;', '', 'D2', 'la contenance reste au parc'],
  ['utils', '_mvFutEntrer', ' && _mvFutL(f) === cible.l', '', 'D4', 'le demi-muid fondu dans les pièces'],
  ['utils', '_mvFutStock', 'l:_mvFutL(f), ', '', 'D1', 'le stock sans contenance'],
  ['cave', '_cuvTonneauxDe', 'Object.assign({},t)', '{annee:t.annee,nb:t.nb}', 'E1', 'la fiche d’avant (identité perdue)'],
  ['cave', '_cuvTonneauxDe', 'if(cuv) return [];', '', 'E2', 'les six fûts fantômes'],
  ['cave', '_bcData', 'hl:Math.round(_caveVolL(x)/10)/10', 'hl:Math.round(f*2.28*10)/10', 'F4', '2,28 remis en dur'],
  ['cave', 'saveVendDecuvage', 'if(_vendDecVolSaisi!=null && _cap>0 && _vendDecVolSaisi>_cap){', 'if(false){', 'F2', 'le volume impossible accepté'],
  ['rsv', '_rsvSaveFut', 'if(_lV===_rsvDomL()) _lV=null;', '', 'G3', '228 écrit en dur sur un lot au format'],
  ['utils', '_mvFutDispo', 'libre[f.id] -= n;', '', 'I2', 'un lot compté deux fois'],
  ['utils', '_mvFutLotsDe', ' && _mvFutL(f) === _mvFutL(t)', '', 'I4', 'un demi-muid repris dans les pièces'],
  ['cave', 'saveCuvee', 'if(_dsp.manque>0){', 'if(false){', 'I5', 'la reprise sans contrôle'],
  ['cave', '_mlVolParFut', 'var x=o.data.vol_par_eq_L||o.data.vol_par_fut_L;', 'var x=o.data.vol_par_fut_L;', 'J1', 'l’agenda à la moyenne par fût']
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
console.log('\nContre-épreuves FUT-CAP : ' + det + ' détectées sur ' + MUT.length);
process.exit(rouge ? 1 : 0);
