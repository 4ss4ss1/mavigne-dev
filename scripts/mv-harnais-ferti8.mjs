#!/usr/bin/env node
// =============================================================================
// FERTI-8 (§466) — « VOS PRODUITS » DANS LA RECHERCHE DE L'AMENDEMENT ; LA CHAUX SANS TYPE
// -----------------------------------------------------------------------------
//   node scripts/mv-harnais-ferti8.mjs            les contrôles
//   node scripts/mv-harnais-ferti8.mjs --contre   trois défauts posés exprès : chacun doit faire rougir
// Joue _ferVosCalc (extraite de src/phyto.js) sur des apports, et vérifie le branchement de la fiche.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC0 = fs.readFileSync(path.join(R, 'src', 'phyto.js'), 'utf8');
function ligne(s, debut) { const i = s.indexOf(debut); if (i < 0) throw new Error('absent : ' + debut); return s.slice(i, s.indexOf('\n', i)); }
function fonction(s, nom) { const i = s.indexOf('\nfunction ' + nom + '('); if (i < 0) throw new Error('absent : ' + nom); return s.slice(i + 1, s.indexOf('\nfunction ', i + 1)); }
let vertes = 0; const rouges = [];
const t = (c, m) => { if (c) vertes++; else rouges.push(m); };
const op = (cree, nom, ref, N, P, K) => ({ cree, prod: { nom, ref, N, P, K, MO: null, CN: null } });
const LISTE = [ op('2024-11-14', 'Terrafumur', 'NF U 44-051', 2, 1.7, 3.5), op('2026-03-10', 'Engrais organique 4-10-1', 'NF U 42-001', 4, 10, 1),
  op('2025-11-20', 'TERRAFUMUR ', 'NF U 44-051', 2.2, 1.6, 3.8), op('2025-03-02', 'Terrafumur', 'NF U 44-051', 2.2, 1.6, 3.8),
  op('2025-02-01', 'Engrais organique 4-10-1', 'NF U 42-001', 4, 9, 1), { cree: '2025-01-01' }, null ];
function controles(S) {
  const K = new Function('var window = {};\n' + fonction(S, '_phyNorm') + '\n' + ligne(S, 'function _ferVosCalc(') + '\nreturn {calc:_ferVosCalc, nz:_phyNorm};')(); const calc = (l, q) => K.calc(l, q ? K.nz(q) : '');
  const tous = calc(LISTE, '');
  t(tous.length === 2 && tous[0].nom === 'Engrais organique 4-10-1', 'deux produits, le plus récemment utilisé d’abord (et les apports sans produit ignorés)');
  const terra = calc(LISTE, 'terra');
  t(terra.length === 1 && terra[0].ops.length === 3, 'Terrafumur, écrit de deux façons, est un seul produit à trois apports');
  t(terra.length === 1 && terra[0].last.cree === '2025-11-20', 'le dernier apport est le plus récent');
  t(terra.length === 1 && terra[0].versions.length === 2 && terra[0].versions[0].c.N === 2.2 && terra[0].versions[1].c.N === 2, 'deux teneurs connues, la plus récente d’abord');
  const eng = calc(LISTE, '4-10');
  t(eng.length === 1 && eng[0].versions.length === 2, 'des teneurs qui ne diffèrent que par le phosphore font deux versions');
  t(calc(LISTE, 'nf u 44').length === 1, 'la norme trouve aussi le produit');
  t(calc(LISTE, 'xyz').length === 0, 'rien trouvé : rien rendu');
  const ov = fonction(S, 'openOvFerti');
  t(ov.includes('Chercher un produit') && ov.includes('data-tuto="fer.q"') && ov.includes('data-tuto="fer.src"'), 'la recherche s’appelle « Chercher un produit »');
  const se = fonction(S, '_ferSearch');
  t(se.includes('_ferVosCalc(_ferList()') && se.includes('Vos produits') && se.includes('data-own') && se.includes("_ferPickVos(+this.getAttribute"), 'vos produits passent avant E-Phy, sans valeur interpolée dans le geste');
  const et = fonction(S, '_ferEtat');
  t(et.includes('Repris de votre apport') && et.includes('data-ver') && et.includes('!(_fer._vos||[]).length'), 'le produit repris, ses teneurs connues ; « pas dans E-Phy » seulement si rien des deux côtés');
  t(/P\.srcVos=_ferDfr\(v\.date\)/.test(fonction(S, '_ferVosApplique')) && fonction(S, '_ferSrcUp').includes('Teneurs de votre apport du'), 'les teneurs reprises sont datées');
  t(S.includes("typ:(P.nat==='chaux'?'':(P.typ||'II'))"), '« Chaux, dolomie » s’enregistre sans type');
  t(S.includes('window._ferPickVos=_ferPickVos;') && S.includes('window._ferVer=_ferVer;'), 'les gestes neufs sont posés sur window');
}
function _norm(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
if (!process.argv.includes('--contre')) {
  controles(SRC0);
  console.log('mv-harnais-ferti8 : ' + vertes + ' vertes, ' + rouges.length + ' rouge' + (rouges.length > 1 ? 's' : ''));
  rouges.forEach(r => console.log('  ✗ ' + r));
  process.exit(rouges.length ? 1 : 0);
} else {
  const defauts = [
    ['le plus ancien apport pris pour le dernier', "?1:-1; }); g.last=g.ops[0];", "?-1:1; }); g.last=g.ops[0];"],
    ['le phosphore oublié dans les teneurs', 'var p=op.prod, s=[p.N,p.P,p.K,p.MO,p.CN]', 'var p=op.prod, s=[p.N,p.K,p.MO,p.CN]'],
    ['la chaux de nouveau enregistrée en type II', "typ:(P.nat==='chaux'?'':(P.typ||'II'))", "typ:P.typ||'II'"],
  ];
  let attrapes = 0;
  for (const [nom, a, b] of defauts) {
    if (!SRC0.includes(a)) { console.log('  ✗ défaut impossible à poser (ancre absente) : ' + nom); continue; }
    vertes = 0; rouges.length = 0;
    try { controles(SRC0.split(a).join(b)); } catch (e) { rouges.push('exception : ' + e.message); }
    const vu = rouges.length > 0; if (vu) attrapes++;
    console.log((vu ? '  ✓ attrapé : ' : '  ✗ PAS attrapé : ') + nom);
  }
  console.log('mv-harnais-ferti8 --contre : ' + attrapes + '/' + defauts.length + ' défauts attrapés');
  process.exit(attrapes === defauts.length ? 0 : 1);
}
