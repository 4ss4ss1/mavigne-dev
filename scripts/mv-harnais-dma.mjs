#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   MA VIGNE — HARNAIS DMA-1 : LES HORAIRES DES JOURS D/M/A SONT CEUX DU MODÈLE
   (méthode C20 : _planDefTiming et _planCsvDma extraites de src/planning.js)

   Un jour codé D, M ou A dans un modèle importé prend son horaire de la séquence :
     D : début du mois → fin commune · M : prise décalée → fin commune · A : prise décalée → fin du mois
   Jusqu'au 28/09 la prise décalée (09:00) et la fin commune (16:30) étaient écrites en
   dur, venues d'un salarié d'un domaine. Elles sont désormais dans le modèle
   (`_horaires_dma`), et ABSENTES elles valent 09:00 / 16:30 : rien ne bouge pour les
   modèles déjà importés.

     A. sans _horaires_dma : exactement les valeurs d'avant
     B. avec _horaires_dma : les horaires du modèle
     C. une valeur illisible retombe sur 09:00 / 16:30, jamais sur une heure fausse
     D. la ligne CSV : ce qui est lisible passe, le reste est refusé
     E. l'import range la ligne dans le modèle, l'export la réécrit

     node scripts/mv-harnais-dma.mjs            # contrôle
     node scripts/mv-harnais-dma.mjs --contre   # contre-épreuves
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ICI, '..', 'src', 'planning.js');
const CONTRE = process.argv.includes('--contre');

function extraire(source, nom) {
  const i = source.indexOf('function ' + nom + '(');
  if (i < 0) return null;
  let j = source.indexOf('{', i), prof = 0, k = j;
  for (; k < source.length; k++) {
    const c = source[k];
    if (c === '{') prof++;
    else if (c === '}') { prof--; if (prof === 0) { k++; break; } }
  }
  return source.slice(i, k);
}
function table(source, decl, fin) {
  const i = source.indexOf(decl);
  if (i < 0) return null;
  const j = source.indexOf(fin, i);
  return j < 0 ? null : source.slice(i, j + fin.length);
}

function jouer(source) {
  const ECHECS = [];
  let verts = 0;
  const ok = (c, m) => { if (c) verts++; else ECHECS.push(m); };
  const fT = extraire(source, '_planDefTiming'), fC = extraire(source, '_planCsvDma'), tD = table(source, 'var PLAN_DEF_T = {', '};');
  if (!fT || !fC || !tD) { ECHECS.push('EXTRACTION : ' + [!fT && '_planDefTiming', !fC && '_planCsvDma', !tD && 'PLAN_DEF_T'].filter(Boolean).join(', ')); return { verts, ECHECS }; }
  let M;
  try {
    M = new Function(`
      var PLAN_PAUSE_MIN=60, planYear=2026, _planCtxYear=null, PLANNING_TEMPLATES={}, window={};
      function _pY(){ return planYear; }
      ${tD}
      ${fT}
      ${fC}
      return { T:function(tpl,m,d){ PLANNING_TEMPLATES={2026:{X:tpl}}; return _planDefTiming(7,'X',m,d,2026); }, C:_planCsvDma };`)();
  } catch (e) { ECHECS.push('CHARGEMENT : ' + e.message); return { verts, ECHECS }; }
  const eq = (a, b) => a && a.d === b.d && a.f === b.f && a.continu === b.continu;
  const s = (x) => x ? x.d + '→' + x.f : String(x);
  // Un modèle de juin : début 07:00, fin 17:00 (≠ 16:30, pour distinguer « fin du mois » de « fin commune »)
  const base = () => ({ _timings: { 5: { d: '07:00', f: '17:00', continu: false } }, _timings_jour: { 5: { 1: 'D', 2: 'M', 3: 'A' } }, 5: { 1: 8.5, 2: 6.5, 3: 6.5 } });

  // ── A. sans _horaires_dma : les valeurs d'avant ──
  let r;
  r = M.T(base(), 5, 1); ok(eq(r, { d: '07:00', f: '16:30', continu: false }), 'A. D sans réglage : 07:00→16:30 attendu, vu ' + s(r));
  r = M.T(base(), 5, 2); ok(eq(r, { d: '09:00', f: '16:30', continu: false }), 'A. M sans réglage : 09:00→16:30 attendu, vu ' + s(r));
  r = M.T(base(), 5, 3); ok(eq(r, { d: '09:00', f: '17:00', continu: false }), 'A. A sans réglage : 09:00→17:00 (fin du mois) attendu, vu ' + s(r));
  const sansMois = base(); delete sansMois._timings;
  r = M.T(sansMois, 5, 1); ok(eq(r, { d: '07:00', f: '16:30', continu: false }), 'A. D sans horaire du mois : 07:00→16:30, vu ' + s(r));

  // ── B. avec _horaires_dma ──
  const perso = base(); perso._horaires_dma = { decale: '08:30', fin: '17:15' };
  r = M.T(perso, 5, 1); ok(eq(r, { d: '07:00', f: '17:15', continu: false }), 'B. D réglé : 07:00→17:15 attendu, vu ' + s(r));
  r = M.T(perso, 5, 2); ok(eq(r, { d: '08:30', f: '17:15', continu: false }), 'B. M réglé : 08:30→17:15 attendu, vu ' + s(r));
  r = M.T(perso, 5, 3); ok(eq(r, { d: '08:30', f: '17:00', continu: false }), 'B. A réglé : 08:30→17:00 (fin du mois) attendu, vu ' + s(r));
  // un jour SANS code ne lit pas _horaires_dma
  const sansCode = base(); sansCode._horaires_dma = { decale: '10:00', fin: '18:00' }; delete sansCode._timings_jour;
  r = M.T(sansCode, 5, 2); ok(r && r.d === '07:00', 'B. un jour sans code garde le début du mois, vu ' + s(r));

  // ── C. valeurs illisibles ──
  [{ decale: '9h', fin: '16:30' }, { decale: '25:00', fin: 'x' }, { decale: 9, fin: 1630 }, 'texte', null].forEach((v, i) => {
    const t = base(); t._horaires_dma = v;
    const rm = M.T(t, 5, 2);
    ok(rm && rm.d === '09:00' && rm.f === '16:30', 'C. réglage illisible n°' + (i + 1) + ' : 09:00→16:30 attendu, vu ' + s(rm));
  });

  // ── D. la ligne CSV ──
  const C = (a) => { try { return M.C(a); } catch (e) { return 'PLANTAGE'; } };
  let c = C(['horaires_dma', '09:00', '16:30']); ok(c && c.decale === '09:00' && c.fin === '16:30', 'D. ligne standard lue');
  c = C(['horaires_dma', ' 8:30 ', '17:15']); ok(c && c.decale === '8:30' && c.fin === '17:15', 'D. heure sur un chiffre et espaces acceptés');
  [['horaires_dma', '16:30', '09:00'], ['horaires_dma', '09:00', '09:00'], ['horaires_dma', '9h', '16:30'],
   ['horaires_dma', '09:00'], ['horaires_dma'], null, ['horaires_dma', '24:00', '25:00']].forEach((l, i) => {
    ok(C(l) === null, 'D. ligne invalide n°' + (i + 1) + ' refusée (vu ' + JSON.stringify(C(l)) + ')');
  });

  // ── E. import / export (le chemin passe par FileReader et Blob : lu, pas exécuté) ──
  const imp = extraire(source, 'planImportCSV') || '';
  ok(/prefix==='horaires_dma'/.test(imp) && /_planCsvDma\(/.test(imp), 'E. l’import reconnaît la ligne horaires_dma');
  ok(/tplData\._horaires_dma\s*=\s*dma/.test(imp), 'E. l’import range la ligne dans le modèle');
  ok(/illisible/.test(imp), 'E. une ligne illisible est dite à l’import');
  const exp = extraire(source, 'planExportCSV') || '';
  ok(/'horaires_dma'\+S\+/.test(exp), 'E. l’export réécrit la ligne horaires_dma');
  // Le seul '09:00' du module est le repli de _planDefTiming et de l'export.
  const n0900 = (source.replace(/\/\/[^\n]*/g, '').match(/'09:00'/g) || []).length;
  ok(n0900 === 2, 'E. `\'09:00\'` ne doit plus apparaître qu’en repli (2 fois), vu ' + n0900);

  return { verts, ECHECS };
}

const source = fs.readFileSync(SRC, 'utf8');
if (!CONTRE) {
  const { verts, ECHECS } = jouer(source);
  console.log('\n  HARNAIS DMA-1 — les horaires D/M/A sont ceux du modèle\n');
  ECHECS.forEach(e => console.log('  ✗ ' + e));
  console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge');
  process.exit(ECHECS.length ? 1 : 0);
}
const DEFAUTS = [
  ['M revient à 09:00 en dur', s => s.replace("if(tCode==='M')return{d:dDec,f:fCom,continu:false};", "if(tCode==='M')return{d:'09:00',f:'16:30',continu:false};")],
  ['le défaut change (09:15)', s => s.replace("var dDec=_hm(_dma.decale,'09:00')", "var dDec=_hm(_dma.decale,'09:15')")],
  ['la ligne CSV accepte une fin avant la prise', s => s.replace('if(mn(b)<=mn(a))return null;', '')],
  ['l’import oublie de ranger la ligne', s => s.replace('if(dma)tplData._horaires_dma=dma;', '')]
];
let rates = 0;
console.log('\n  HARNAIS DMA-1 — contre-épreuves\n');
DEFAUTS.forEach(([n, f]) => {
  const muté = f(source);
  if (muté === source) { rates++; console.log('  ✗ défaut « ' + n + ' » : injection impossible'); return; }
  const { ECHECS } = jouer(muté);
  if (ECHECS.length) console.log('  ✓ « ' + n + ' » → ' + ECHECS.length + ' rouge(s)');
  else { rates++; console.log('  ✗ « ' + n + ' » n’est PAS vu'); }
});
console.log('\n  ' + (DEFAUTS.length - rates) + '/' + DEFAUTS.length + ' défauts attrapés');
process.exit(rates ? 1 : 0);
