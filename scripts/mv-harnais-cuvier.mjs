#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais CUV-DEC : LA FRONTIÈRE ENTRE LE CHAI ET LE CUVIER
// ═══════════════════════════════════════════════════════════════════════════
//  ★ POURQUOI CE FICHIER EXISTE (CLAUDE.md §164).
//  `src/cave.js` touchait le plafond de 1 024 ko. Le Cuvier en est sorti, dans
//  `src/cuvier.js`, chargé juste après lui. Deux modules ES, donc deux portées :
//  après le build, un nom déclaré dans l'un et lu dans l'autre N'EXISTE PAS s'il
//  ne passe pas par `window` (Rollup renomme la déclaration, §24 n°6).
//
//  `mv-harnais-globaux` vérifie qu'un nom libre est posé sur window QUELQUE
//  PART. Il ne vérifie ni QUI le pose, ni QUAND on le lit, ni si on l'ÉCRIT :
//  trois façons de casser cette frontière en passant au vert partout.
//
//  CE QU'IL EXIGE :
//    A. app.js importe cuvier.js une fois, JUSTE APRÈS cave.js ;
//    B. tout nom qu'un fichier lit chez l'autre est exposé PAR SON FICHIER
//       (window.X = …) — jamais lu au chargement, jamais écrit de l'autre côté ;
//    C. CAVE_ELEVAGE / CAVE_VENDANGE : le même objet, posé sur window par cave.js
//       au chargement, jamais réaffecté (Le Cuvier lirait l'ancien) ;
//    D. chaque famille reste chez elle : pas de `_vend*` dans cave.js, pas de
//       `_cave*` dans cuvier.js — Le Cuvier ne regagne pas le fichier qu'il a quitté ;
//    E. chacun déclare son `const DEBUG`, cuvier.js n'importe que utils.js ;
//    F. rien ne s'exécute au chargement hors déclarations et expositions.
//
//  Usage :  node scripts/mv-harnais-cuvier.mjs [--contre]
//  LECTURE SEULE (la contre-épreuve travaille en mémoire). Jamais déployé → aucun bump.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as espree from 'espree';
import * as eslintScope from 'eslint-scope';

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const CONTRE = process.argv.includes('--contre');

/* Les familles. Le Cuvier : réceptions, cuves, relevés, tournée, maturité, ventes
   en vrac. Le Chai garde tout le reste : cuvées, opérations, Le millésime,
   Aujourd'hui, registre, bilan, courbes, comparatif, assemblage. */
const FAM_CUVIER = /^(_vend|_VEND_|_vt[A-Z]|_VT_|_vcuv|_vnd|_vm[A-Z]|_vmesure|_vst|_vpc|_vp[A-Z]|_vl[A-Z]|_liv[A-Z]|_rec[A-Z]|_mat[A-Z]|openVend|saveVend|renderVend|deleteVend|switchVendOng|_renderVend|openOvVend|exportVend)/;
const FAM_CHAI = /^(_cave|_ml[A-Z]|_ML_|_rm[A-Z]|_bc[A-Z]|_pcav|_pcrb|_crb|_CRB_|_cmp|_asm|_cop|_mvc|_cuv[A-Z]|renderCave|openOvCave|saveCave|deleteCave|switchCaveOng|selectCave)/;
const PARTAGES = ['CAVE_ELEVAGE', 'CAVE_VENDANGE'];

function analyser(txt) {
  const ast = espree.parse(txt, { ecmaVersion: 'latest', sourceType: 'module', range: true, loc: true });
  const sm = eslintScope.analyze(ast, { ecmaVersion: 2022, sourceType: 'module' });
  const mod = sm.scopes.find(s => s.type === 'module');
  const decl = new Map();
  for (const v of mod.variables) if (v.defs.length && v.defs[0].type !== 'ImportBinding') decl.set(v.name, v);
  const libres = new Map();
  for (const r of mod.through) {
    const n = r.identifier.name, e = libres.get(n) || { lu: 0, charge: 0, ecrit: 0 };
    e.lu++; if (r.from === mod) e.charge++; if (r.isWrite()) e.ecrit++;
    libres.set(n, e);
  }
  const imports = ast.body.filter(n => n.type === 'ImportDeclaration').map(n => n.source.value);
  return { ast, mod, decl, libres, imports };
}
/* Les noms qu'un fichier pose sur window, à son premier niveau (« window.X = … »). */
function exposes(A, txt) {
  const s = new Set();
  for (const n of A.ast.body) {
    if (n.type !== 'ExpressionStatement' || n.expression.type !== 'AssignmentExpression') continue;
    const g = n.expression.left;
    if (g.type === 'MemberExpression' && !g.computed && g.object.type === 'Identifier'
        && g.object.name === 'window' && g.property.type === 'Identifier') s.add(g.property.name);
  }
  return s;
}

function controle(src) {
  const res = [];
  const t = (id, nom, ok, detail) => res.push({ id, nom, ok: !!ok, detail: ok ? '' : (detail || '') });
  let K, C;
  try { K = analyser(src.cave); C = analyser(src.cuvier); }
  catch (e) { t('P', 'les deux fichiers se lisent', false, String(e.message).slice(0, 200)); return res; }
  const expK = exposes(K, src.cave), expC = exposes(C, src.cuvier);

  /* A — l'ordre d'import */
  const imp = [...src.app.matchAll(/^import\s+(?:[^'"]*from\s+)?['"]([^'"]+)['"];?/gm)].map(m => m[1]);
  const iK = imp.indexOf('./cave.js'), iC = imp.indexOf('./cuvier.js');
  t('A1', 'app.js importe cuvier.js une seule fois', imp.filter(x => x === './cuvier.js').length === 1,
    'import de cuvier.js lu ' + imp.filter(x => x === './cuvier.js').length + ' fois');
  t('A2', 'cuvier.js est importé JUSTE APRÈS cave.js', iK >= 0 && iC === iK + 1,
    'ordre lu : ' + imp.join(' → '));

  /* B — ce qui traverse */
  const cote = [['cave.js', K, C, expC], ['cuvier.js', C, K, expK]];
  for (const [nom, moi, autre, expAutre] of cote) {
    const traverse = [...moi.libres].filter(([n]) => autre.decl.has(n) && !PARTAGES.includes(n));
    const nonExp = traverse.filter(([n]) => !expAutre.has(n)).map(([n]) => n);
    const charge = traverse.filter(([, e]) => e.charge).map(([n]) => n);
    const ecrit  = traverse.filter(([, e]) => e.ecrit).map(([n]) => n);
    const autreNom = nom === 'cave.js' ? 'cuvier.js' : 'cave.js';
    t('B1-' + nom, nom + ' ne lit chez ' + autreNom + ' que ce que ' + autreNom + ' expose (' + traverse.length + ' noms)',
      !nonExp.length, 'non exposés : ' + nonExp.join(', '));
    t('B2-' + nom, nom + ' ne lit rien de ' + autreNom + ' au chargement', !charge.length, 'lus au chargement : ' + charge.join(', '));
    t('B3-' + nom, nom + ' n\u2019écrit aucune variable de ' + autreNom, !ecrit.length, 'écrits : ' + ecrit.join(', '));
  }

  /* C — les deux objets partagés */
  for (const n of PARTAGES) {
    const v = K.decl.get(n);
    const reaff = v ? v.references.filter(r => r.isWrite() && !r.init).length : -1;
    const eC = C.libres.get(n);
    t('C-' + n, n + ' : déclaré et exposé par cave.js, jamais réaffecté, jamais écrit par cuvier.js',
      v && expK.has(n) && reaff === 0 && !(eC && eC.ecrit),
      !v ? 'absent de cave.js' : !expK.has(n) ? 'pas exposé au premier niveau de cave.js'
        : reaff ? reaff + ' réaffectation(s) dans cave.js' : 'écrit par cuvier.js');
  }

  /* D — chaque famille chez elle */
  const intrusK = [...K.decl.keys()].filter(n => FAM_CUVIER.test(n));
  const intrusC = [...C.decl.keys()].filter(n => FAM_CHAI.test(n));
  t('D1', 'cave.js ne déclare aucun nom de la famille du Cuvier', !intrusK.length, intrusK.join(', '));
  t('D2', 'cuvier.js ne déclare aucun nom de la famille du Chai', !intrusC.length, intrusC.join(', '));

  /* E — en-tête */
  const dbg = (A) => A.decl.has('DEBUG') && A.decl.get('DEBUG').defs[0].parent && A.decl.get('DEBUG').defs[0].parent.kind === 'const';
  t('E1', 'cave.js et cuvier.js déclarent chacun const DEBUG', dbg(K) && dbg(C));
  t('E2', 'cuvier.js n\u2019importe que ./utils.js', C.imports.length === 1 && C.imports[0] === './utils.js', C.imports.join(', '));

  /* F — rien ne tourne au chargement */
  const actifs = (A) => A.ast.body.filter(n => {
    if (n.type === 'ImportDeclaration' || n.type === 'FunctionDeclaration' || n.type === 'VariableDeclaration') return false;
    if (n.type === 'ExpressionStatement' && n.expression.type === 'AssignmentExpression') {
      const g = n.expression.left;
      return !(g.type === 'MemberExpression' && g.object.type === 'Identifier' && g.object.name === 'window');
    }
    return true;
  }).map(n => 'L' + n.loc.start.line);
  const aK = actifs(K), aC = actifs(C);
  t('F', 'aucun des deux n\u2019exécute de code au chargement (hors déclarations et window.X = …)',
    !aK.length && !aC.length, 'cave.js ' + aK.join(' ') + ' · cuvier.js ' + aC.join(' '));
  return res;
}

const SAIN = { cave: lire('src/cave.js'), cuvier: lire('src/cuvier.js'), app: lire('src/app.js') };
const vert = (s) => '\x1b[32m' + s + '\x1b[0m', rouge = (s) => '\x1b[31m' + s + '\x1b[0m';

if (!CONTRE) {
  console.log('\n\x1b[1m── CUV-DEC — la frontière entre le Chai (cave.js) et Le Cuvier (cuvier.js)\x1b[0m\n');
  const r = controle(SAIN);
  for (const x of r) console.log('  ' + (x.ok ? vert('✓') : rouge('✗')) + ' ' + x.id + ' ' + x.nom + (x.ok ? '' : '\n      → ' + x.detail));
  const ko = r.filter(x => !x.ok).length;
  console.log('\n  ' + (r.length - ko) + ' vertes, ' + ko + ' rouges\n');
  process.exit(ko ? 1 : 0);
}

/* ── Contre-épreuves : un défaut à la fois, en mémoire ─────────────────────── */
const rempl = (txt, de, vers) => {
  const n = txt.split(de).length - 1;
  if (n !== 1) throw new Error('ancre x' + n + ' : ' + de.slice(0, 60));
  return txt.replace(de, vers);
};
const DEFAUTS = [
  ['une exposition du Cuvier retirée', 'B1-cave.js',
    s => ({ ...s, cuvier: rempl(s.cuvier, '\nwindow._vendHlKg = _vendHlKg;\n', '\n') })],
  ['une exposition du Chai retirée', 'B1-cuvier.js',
    s => ({ ...s, cave: rempl(s.cave, '\nwindow._mvF1 = _mvF1;\n', '\n') })],
  ['Le Cuvier lit le Chai au chargement', 'B2-cuvier.js',
    s => ({ ...s, cuvier: s.cuvier + '\nvar _vendDecTest = _caveCuve;\n' })],
  ['Le Cuvier écrit une variable du Chai', 'B3-cuvier.js',
    s => ({ ...s, cuvier: s.cuvier + '\nfunction _vendDecTest(){ caveTab = \'journal\'; }\n' })],
  ['le Chai réaffecte CAVE_VENDANGE', 'C-CAVE_VENDANGE',
    s => ({ ...s, cave: s.cave + '\nfunction _caveDecTest(){ CAVE_VENDANGE = {}; }\n' })],
  ['cuvier.js importé avant cave.js', 'A2',
    s => ({ ...s, app: rempl(rempl(s.app, "import './cuvier.js';\n", ''), "import './cave.js';\n", "import './cuvier.js';\nimport './cave.js';\n") })],
  ['une fonction du Cuvier revient dans cave.js', 'D1',
    s => ({ ...s, cave: s.cave + '\nfunction _vendDecTest2(){ return 1; }\n' })],
  ['une fonction du Chai glisse dans cuvier.js', 'D2',
    s => ({ ...s, cuvier: s.cuvier + '\nfunction _caveDecTest2(){ return 1; }\n' })],
  ['cuvier.js perd son const DEBUG', 'E1',
    s => ({ ...s, cuvier: rempl(s.cuvier, "const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';", "var DEBUG_NON = 0;") })],
  ['du code tourne au chargement', 'F',
    s => ({ ...s, cuvier: s.cuvier + '\n_vendInjectCss();\n' })],
];
console.log('\n\x1b[1m── CUV-DEC — contre-épreuves (' + DEFAUTS.length + ' défauts, un à la fois)\x1b[0m\n');
const base = controle(SAIN);
if (base.some(x => !x.ok)) { console.log(rouge('  ✗ la base n\u2019est pas verte — contre-épreuve sans valeur')); process.exit(1); }
let vus = 0;
for (const [nom, attendu, f] of DEFAUTS) {
  let r;
  try { r = controle(f(SAIN)); }
  catch (e) { console.log('  ' + rouge('!! ') + nom + ' — injection morte : ' + e.message); continue; }
  const rouges = r.filter(x => !x.ok).map(x => x.id);
  const ok = rouges.includes(attendu);
  if (ok) vus++;
  console.log('  ' + (ok ? vert('✓') : rouge('✗')) + ' ' + nom + ' → ' + (rouges.join(', ') || 'rien'));
}
console.log('\n  ' + (vus === DEFAUTS.length ? vert(vus + '/' + DEFAUTS.length + ' défauts attrapés, chacun par sa règle')
  : rouge((DEFAUTS.length - vus) + ' défaut(s) passent inaperçus')) + '\n');
process.exit(vus === DEFAUTS.length ? 0 : 1);
