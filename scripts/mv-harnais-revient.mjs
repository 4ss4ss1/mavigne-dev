// ═══════════════════════════════════════════════════════════════════════════
//  HARNAIS REV-1 (§194) — LE REVIENT D'UN MILLÉSIME
// ═══════════════════════════════════════════════════════════════════════════
//  Nico, 28/09 : « mettre les rendements et bouteilles probables dans Économie,
//  avec un coût de revient probable ». Maquette v1 validée (« go avec les
//  recommandations »).
//
//  Sur les VRAIES fonctions extraites de src/pilotage.js (jamais un stub du moteur).
//
//  CE QUE CE HARNAIS PROUVE
//   A. l'escalier du rendement : récolté → moyenne de ses millésimes → moyenne de
//      l'appellation cette année → rien ; JAMAIS le plafond ; une parcelle sans
//      estimation sort des bouteilles ET de leur coût ;
//   B. la conversion est celle de la Cave : hL × (1 − pertes) × 133,3 ;
//   C. le raisin vendu sort des bouteilles et de sa part du coût ;
//   D. le coût par bouteille d'une appellation, l'état probable / constaté / vide ;
//   E. la part du domaine d'une récolte (_pecRevRec) ;
//   F. le cycle du millésime : lendemain de la récolte M-1, un an sinon, fin prévue ;
//   G. le câblage : la sous-vue, l'ancienne conversion partie, les réglages admis,
//      les fiches « i », l'aide, le guide, « Quoi de neuf ».
//
//  ⚠ Contre-épreuve (--contre) : chaque ancre doit être UNIQUE dans la fonction
//    visée, l'essai doit passer sur le code sain, et rougir sur le code abîmé.
//
//  Usage :  node scripts/mv-harnais-revient.mjs
//           node scripts/mv-harnais-revient.mjs --contre
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SAIN = { pil: lire('src/pilotage.js'), utils: lire('src/utils.js'), reg: lire('src/reglages.js'),
               g11: lire('guide/11-pilotage.html') };

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
const nu = s => s.split('\n').filter(l => !l.trimStart().startsWith('//')).join('\n');

const FONCS = ['_pexIsoToMs2', '_pexIsoPlus', '_pexJourApres', '_pecRevRecDates', '_pecRevCycle', '_pecRevRec', '_pecRevCalc'];
function charger(S, globaux) {
  const ctx = vm.createContext({ window: globaux, Math, Number, String, Date, isFinite, parseInt, parseFloat, Object, Array });
  vm.runInContext(FONCS.map(n => fn(S.pil, n)).join('\n') + '\n;var _pilAnnuelData=function(){ return window.__ann||null; };', ctx);
  return ctx;
}
const P = (nom, surf, aoc, o) => Object.assign({ nom, surf, aoc, max: null, cout: { mo: 0, trac: 0, gnr: 0, phy: 0 }, rec: null, hist: [] }, o || {});
const proche = (a, b, e) => a != null && Math.abs(a - b) < (e || 1e-6);

const T = {
  A1: ['une parcelle récoltée prend SON volume', A => {
    const r = A._pecRevCalc([P('a', 1, 'X', { rec: { hlTot: 40, domHl: 40, domShare: 1, kg: 5400 } })], 0).rows[0];
    return r.src === 'r' && proche(r.hlha, 40); }],
  A2: ['sinon la moyenne de ses millésimes connus', A => {
    const r = A._pecRevCalc([P('a', 2, 'X', { hist: [30, 40] })], 0).rows[0];
    return r.src === 'h' && proche(r.hlha, 35) && proche(r.domHl, 70); }],
  A3: ['sinon la moyenne constatée cette année dans son appellation', A => {
    const R = A._pecRevCalc([P('a', 2, 'X', { rec: { hlTot: 80, domHl: 80, domShare: 1, kg: 1 } }), P('b', 1, 'X'), P('c', 1, 'Y')], 0);
    return R.rows[1].src === 'm' && proche(R.rows[1].hlha, 40) && R.rows[2].src === 'n'; }],
  A4: ['jamais le plafond : sans rien, pas d’estimation', A => {
    const r = A._pecRevCalc([P('a', 1, 'X', { max: 55 })], 0).rows[0];
    return r.src === 'n' && r.hlha === null && r.cols === 0; }],
  A5: ['une parcelle sans estimation sort du coût des bouteilles', A => {
    const R = A._pecRevCalc([P('a', 1, 'X', { hist: [40], cout: { mo: 1000 } }), P('b', 1, 'Z', { cout: { mo: 500 } })], 0);
    return proche(R.tot.coutDom, 1000) && proche(R.tot.coutSans, 500) && R.tot.nSans === 1 && proche(R.tot.haSans, 1); }],
  B1: ['la conversion de la Cave : hL × (1 − pertes) × 133,3', A => {
    const R = A._pecRevCalc([P('a', 1, 'X', { rec: { hlTot: 100, domHl: 100, domShare: 1, kg: 1 } })], 5);
    return proche(R.tot.cols, 100 * 0.95 * 100 / 0.75, 1e-6); }],
  B2: ['sans perte, 133,3 cols par hL', A => proche(A._pecRevCalc([P('a', 1, 'X', { hist: [30] })], 0).tot.cols, 30 * 100 / 0.75, 1e-6)],
  C1: ['le raisin vendu emporte sa part du coût', A => {
    const R = A._pecRevCalc([P('a', 1, 'X', { cout: { mo: 1000 }, rec: { hlTot: 40, domHl: 20, domShare: 0.5, kg: 5000, kgVendu: 2500 } })], 0);
    return proche(R.tot.coutDom, 500) && proche(R.tot.coutVendu, 500) && proche(R.tot.cols, 20 * 100 / 0.75) && R.tot.kgVendu === 2500; }],
  C2: ['tout vendu : ni bouteille, ni coût', A => {
    const R = A._pecRevCalc([P('a', 1, 'X', { cout: { mo: 900 }, rec: { hlTot: 40, domHl: 0, domShare: 0, kg: 5000, kgVendu: 5000 } })], 0);
    return R.tot.cols === 0 && R.tot.coutDom === 0 && R.tot.eurCol === null; }],
  D1: ['le coût par bouteille d’une appellation = Σ coût ÷ Σ bouteilles', A => {
    const R = A._pecRevCalc([P('a', 1, 'X', { hist: [30], cout: { mo: 3000 } }), P('b', 1, 'X', { hist: [45], cout: { mo: 3000 } })], 0);
    const g = R.aoc[0]; return proche(g.eurCol, 6000 / (75 * 100 / 0.75)) && proche(g.hlha, 37.5); }],
  D2: ['probable, constaté, vide', A => {
    const r = { hlTot: 10, domHl: 10, domShare: 1, kg: 1 };
    return A._pecRevCalc([P('a', 1, 'X', { rec: r })], 0).etat === 'cons'
      && A._pecRevCalc([P('a', 1, 'X', { rec: r }), P('b', 1, 'X', { hist: [30] })], 0).etat === 'prob'
      && A._pecRevCalc([P('a', 1, 'X')], 0).etat === 'vide'; }],
  D3: ['les postes par bouteille se somment au coût par bouteille (raisin vendu compris)', A => {
    const R = A._pecRevCalc([P('a', 1, 'X', { hist: [30], cout: { mo: 600, trac: 200, gnr: 100, phy: 100 } }),
      P('b', 1, 'X', { cout: { mo: 800, trac: 100, gnr: 50, phy: 50 }, rec: { hlTot: 40, domHl: 20, domShare: 0.5, kg: 5000, kgVendu: 2500 } })], 0);
    const s = (R.tot.po.mo + R.tot.po.trac + R.tot.po.gnr + R.tot.po.phy) / R.tot.cols;
    return proche(s, R.tot.eurCol); }],
  E1: ['une récolte sans vente : tout pour le domaine', A => {
    const r = A._pecRevRec({ kg: 1350, hlHa: 10, vendu: false, rdt: { parts: [{ dom: true, kg: 1350 }] } }, { surface: 1 }, 135);
    return proche(r.hlTot, 10) && proche(r.domHl, 10) && r.domShare === 1; }],
  E2: ['une récolte partagée : la part du domaine au prorata des kilos', A => {
    const r = A._pecRevRec({ kg: 1000, hlHa: 7, vendu: true, rdt: { parts: [{ dom: true, kg: 600, hl: 3, connu: 400 }, { dom: false, kg: 400 }] } }, { surface: 1 }, 135);
    return proche(r.domHl, 3 + 200 / 135) && proche(r.domShare, 0.6) && r.kgVendu === 400; }],
  F1: ['le cycle part du lendemain de la dernière récolte M-1', A => {
    const W = A.window; W.CAVE_VENDANGE = { recoltes: [{ date: '2025-09-18' }, { date: '2025-09-24' }, { date: '2026-09-15' }, { date: '2026-09-22' }] };
    W._vendResteARentrer = () => ({ lignes: [] }); W.__ann = null;
    const c = A._pecRevCycle(2026, '2026-09-28');
    return c.d0 === '2025-09-25' && c.src0 === 'rec' && c.d1 === '2026-09-22' && c.src1 === 'rec' && c.complet; }],
  F2: ['sans récolte M-1 : un an avant la fin, et l’écran le sait', A => {
    const W = A.window; W.CAVE_VENDANGE = { recoltes: [{ date: '2026-09-22' }] }; W._vendResteARentrer = () => ({ lignes: [] }); W.__ann = null;
    const c = A._pecRevCycle(2026, '2026-09-28'); return c.d0 === '2025-09-23' && c.src0 === 'an'; }],
  F3: ['vendange à venir : la fin prévue par les fenêtres des tâches', A => {
    const W = A.window; W.CAVE_VENDANGE = { recoltes: [] }; W._vendResteARentrer = () => ({ lignes: [{}] });
    W.__ann = { vend: { debut: '2026-09-10', fin: '2026-09-30' } };
    const c = A._pecRevCycle(2026, '2026-06-15'); return c.d1 === '2026-09-30' && c.src1 === 'plan'; }],
  F4: ['vendange commencée, non finie, sans plan : le coût s’arrête à aujourd’hui', A => {
    const W = A.window; W.CAVE_VENDANGE = { recoltes: [{ date: '2026-09-20' }] }; W._vendResteARentrer = () => ({ lignes: [{}] }); W.__ann = null;
    const c = A._pecRevCycle(2026, '2026-09-28'); return c.d1 === '2026-09-28' && c.src1 === 'auj'; }],
  G1: ['la sous-vue Revient est déclarée, gardée et aiguillée', (A, S) => {
    const p = nu(S.pil);
    return p.includes("['rev','bouteille','Revient']") && p.includes("o.sub==='rev'") && p.includes("if(_PEC_SUB==='rev') body=_pecViewRevient();"); }],
  G2: ['l’ancienne conversion (1,3 kg/col) est partie', (A, S) => {
    const p = nu(S.pil); return !/function _pecKgB\b/.test(p) && !/function _pecRecolte\b/.test(p) && !p.includes('kg_bouteille:{') && !p.includes('eurBt'); }],
  G3: ['la Synthèse ne divise plus la période par la récolte', (A, S) => {
    const v = fn(S.pil, '_pecViewSynthese'); return v.includes('_pecRevData()') && !v.includes('E.rec') && !v.includes('E.eurKg'); }],
  G4: ['le temps vigne se rejoue sur une fenêtre donnée', (A, S) => {
    const v = fn(S.pil, '_ecoTempsVigne'); return /^function _ecoTempsVigne\(win\)/.test(v) && v.includes('String(win.d0)') && v.includes('guard<800'); }],
  G5: ['les deux réglages passent la liste blanche de Réglages', (A, S) => /'pertes_elevage','autres_charges'\]\.indexOf\(key\)<0\) return;/.test(S.reg)],
  G6: ['chaque carte a sa fiche, chaque fiche sa pastille', (A, S) => ['pil.eco.revient', 'pil.eco.revrdt', 'pil.eco.revconv', 'pil.eco.revcout']
    .every(k => S.utils.includes("'" + k + "': {") && fn(S.pil, '_pecViewRevient').includes("_mvInfoBtn('" + k + "')"))],
  G7: ['l’aide, le guide et « Quoi de neuf » le disent', (A, S) => S.utils.includes("['Économie › Revient',")
    && /\n  \{ v: '7\.76', items: \[/.test(S.utils) && S.utils.includes('Le revient du millésime, dans Économie')
    && S.g11.includes('{ic:bouteille} Revient')],
  G8: ['la Cave s’ouvre sur la section demandée, Aujourd’hui par défaut', (A, S) =>
    S.pil.includes("var _s=(typeof sec==='string'&&sec)?sec:'aujourdhui';") && S.pil.includes("window._pilOuvrirCave(_pe.getAttribute('data-v')||'')")]
};

function jouer(S) {
  const r = {};
  for (const k in T) {
    try { const A = charger(S, {}); r[k] = !!T[k][1](A, S); } catch (e) { r[k] = false; }
  }
  return r;
}

const V = '\x1b[32m', R = '\x1b[31m', Z = '\x1b[0m';
if (!CONTRE) {
  const r = jouer(SAIN); let ok = 0, ko = 0;
  for (const k in T) { if (r[k]) { ok++; console.log('  ' + V + '✓' + Z + ' ' + k + ' ' + T[k][0]); }
                       else { ko++; console.log('  ' + R + '✗ ' + k + ' ' + T[k][0] + Z); } }
  console.log('\nREV-1 : ' + ok + ' vertes, ' + ko + ' rouges');
  process.exit(ko ? 1 : 0);
}

/* ══ CONTRE-ÉPREUVES — le défaut réintroduit, l'assertion doit rougir ══ */
const MUT = [
  ['pil', '_pecRevCalc', "} else if(moy[p.aoc]&&moy[p.aoc].ha>0){", "} else if(p.max!=null){ src='m'; hlha=p.max; } else if(moy[p.aoc]&&moy[p.aoc].ha>0){", 'A4', 'le plafond pris comme prévision'],
  ['pil', '_pecRevCalc', "var avec=(src!=='n');", "var avec=true;", 'A5', 'la parcelle sans estimation garde son coût'],
  ['pil', '_pecRevCalc', "if(src==='h'||src==='m'){ hlTot=hlha*p.surf; domHl=hlTot; }", "if(src==='h'||src==='m'){ hlTot=hlha; domHl=hlTot; }", 'A2', 'le hL/ha pris pour des hL'],
  ['pil', '_pecRevCalc', "var k=Math.max(0,1-(Number(pertes)||0)/100)*100/0.75;", "var k=100/0.75;", 'B1', 'les pertes d’élevage ignorées'],
  ['pil', '_pecRevCalc', "coutDom:avec?cout*share:0", "coutDom:avec?cout:0", 'C1', 'le raisin vendu garde sa part du coût dans les bouteilles'],
  ['pil', '_pecRevCalc', "POST.forEach(function(x){ T.po[x]+=po[x]*share; });", "POST.forEach(function(x){ T.po[x]+=po[x]; });", 'D3', 'les postes ne se somment plus au coût'],
  ['pil', '_pecRevRec', "if(!o.vendu || !parts.length)", "if(true)", 'E2', 'la part vendue comptée pour le domaine'],
  ['pil', '_pecRevCycle', "d0=_pexJourApres(prev[prev.length-1]);", "d0=prev[prev.length-1];", 'F1', 'le dernier jour de vendange M-1 compté deux fois'],
  ['pil', '_pecRevCycle', "else if(plan && String(plan.fin).slice(0,10)>=auj)", "else if(false)", 'F3', 'la fin prévue ignorée'],
  ['pil', '_ecoTempsVigne', "guard<800", "guard<400", 'G4', 'un cycle de plus de 400 jours tronqué en silence']
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
console.log('\nContre-épreuves REV-1 : ' + det + ' détectées sur ' + MUT.length);
process.exit(rouge ? 1 : 0);
