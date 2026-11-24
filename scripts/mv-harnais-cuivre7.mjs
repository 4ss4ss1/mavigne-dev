#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — VITRINE-3 (§606) : LE CUMUL DE CUIVRE SUR SEPT ANS, JOUÉ
   Lancer :          node scripts/mv-harnais-cuivre7.mjs
   Contre-épreuves : node scripts/mv-harnais-cuivre7.mjs --contre

   POURQUOI IL EXISTE
   La page logiciel-vigne écrit (Nico, 24/11) : « Chaque calcul sensible — heures d’équipe, coûts par parcelle, cumul de
   cuivre sur sept ans — est vérifié automatiquement par une batterie de tests avant chaque mise à jour. » Relu avant de
   l’écrire : les heures (mv-harnais-releve, -majoration) et les coûts par parcelle (-temps-vigne, -revient) l’étaient ;
   le cuivre DE L’ANNÉE aussi (-phyux1). Le cumul glissant de sept ans, NON : _cuParcRollSum n’était joué par aucun
   harnais, et _cfmCuivre n’apparaissait que remplacé par un bouchon (mv-harnais-coher1). La phrase aurait menti.

   CE QU’IL JOUE — les VRAIES fonctions, extraites de src/reglages.js et src/pilotage.js, sur un domaine posé ici
   ① la fenêtre : la campagne et les six années d’avant (2020 → 2026), pas une de plus ;
   ② ce qui compte : un traitement « Cuivre » avec du cuivre métal ; pas le soufre, pas une dose à zéro ;
   ③ un traitement sans parcelle vaut pour toutes les parcelles en place (pas l’arrachée) ;
   ④ la somme par parcelle, et la moyenne divisée par les années COUVERTES (de la première trace à la campagne) ;
   ⑤ le Pilotage (Conformité) : plafond 28 kg/ha, au-dessus = dépassé, de 87,5 % à 100 % = vigilance, l’arrachée exclue,
      les lignes de la plus chargée à la moins chargée.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { reg: lire('src/reglages.js'), pil: lire('src/pilotage.js') };

function fnSrc(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('fonction introuvable : ' + nom);
  let k = src.indexOf('{', i), n = 0, q = null;
  for (; k < src.length; k++) {
    const c = src[k];
    if (q) { if (c === '\\') { k++; continue; } if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '{') n++; else if (c === '}') { n--; if (n === 0) break; }
  }
  return src.slice(i, k + 1);
}
const DU_REGLAGE = ['_cuActiveParc', '_cuIsCu', '_cuYear', '_cuTreatParc', '_cuCampagneYear', '_cuTreatments', '_cuParcYear',
  '_cuRollingYears', '_cuParcRollN', '_cuParcRolling', '_cuParcRollSum'];

/* le domaine posé : quatre parcelles en place, une arrachée */
const PARCELLES = [
  { nom: 'Les Charmes', surface: '1.00' }, { nom: 'Aux Murgers', surface: '0.50' }, { nom: 'La Combotte', surface: '0.30' },
  { nom: 'En Bertrange', surface: '0.80' }, { nom: 'Vieille Parcelle', surface: '0.40', statut: 'Arrachee' }];
const TRAITEMENTS = [
  { date: '2019-06-01', type: 'Cuivre', cuMetal: 10, parcelles: ['Les Charmes'] },          // avant la fenêtre : ne compte pas
  { date: '2020-06-01', type: 'Cuivre', cuMetal: 4, parcelles: ['Les Charmes'] },
  { date: '2021-06-01', type: 'Cuivre', cuMetal: 25, parcelles: ['Aux Murgers'] },
  { date: '2022-06-01', type: 'Cuivre', cuMetal: 25, parcelles: ['La Combotte'] },
  { date: '2022-07-01', type: 'Cuivre', cuMetal: 30, parcelles: ['Vieille Parcelle'] },
  { date: '2023-06-01', type: 'Cuivre', cuMetal: 3, parcelles: ['Les Charmes', 'Aux Murgers'] },
  { date: '2024-06-01', type: 'Cuivre', cuMetal: 0, parcelles: ['Les Charmes'] },             // dose à zéro : ne compte pas
  { date: '2025-06-01', type: 'Cuivre', cuMetal: 1.5, parcelles: [] },                         // sans parcelle : toutes celles en place
  { date: '2026-05-01', type: 'Cuivre', cuMetal: 2, parcelles: 'Les Charmes' },                // une chaîne, pas un tableau
  { date: '2026-05-02', type: 'Soufre', cuMetal: 5, parcelles: ['Aux Murgers'] }];             // pas du cuivre

function jouer(S) {
  const ctx = { Math, Number, String, Array, Object, parseInt, parseFloat, Date };
  ctx.window = ctx;
  ctx.PARCELLES = PARCELLES; ctx.TRAITEMENTS = TRAITEMENTS;
  ctx.getSaisonActive = () => ({ debut: '2026-03-01', fin: '2027-02-28' });
  vm.createContext(ctx);
  vm.runInContext(DU_REGLAGE.map((n) => fnSrc(S.reg, n)).join('\n') + '\nwindow._cuParcRollSum=_cuParcRollSum;\n' + fnSrc(S.pil, '_cfmCuivre')
    + '\nthis.__R={ans:_cuRollingYears(),somme:function(n){return _cuParcRollSum(n);},n:function(n){return _cuParcRollN(n);},moy:function(n){return _cuParcRolling(n);},cfm:_cfmCuivre()};', ctx);
  return ctx.__R;
}
const proche = (a, b) => Math.abs(a - b) < 1e-9;

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d]);
  let R;
  try { R = jouer(S); } catch (e) { T('les fonctions du cuivre se chargent', false, e.message); return out; }
  T('① la fenêtre : 2020 → 2026, sept années', JSON.stringify(R.ans) === JSON.stringify(['2020', '2021', '2022', '2023', '2024', '2025', '2026']), JSON.stringify(R.ans));
  T('① 2019 ne compte pas, ② une dose à zéro non plus : Les Charmes = 4 + 3 + 1,5 + 2 = 10,5', proche(R.somme('Les Charmes'), 10.5), R.somme('Les Charmes'));
  T('② le soufre ne compte pas : Aux Murgers = 25 + 3 + 1,5 = 29,5', proche(R.somme('Aux Murgers'), 29.5), R.somme('Aux Murgers'));
  T('③ un traitement sans parcelle vaut pour toutes celles en place : En Bertrange = 1,5', proche(R.somme('En Bertrange'), 1.5), R.somme('En Bertrange'));
  T('④ la moyenne divise par les années couvertes : Les Charmes 10,5 / 7, Aux Murgers 29,5 / 6, La Combotte 26,5 / 5',
    R.n('Les Charmes') === 7 && R.n('Aux Murgers') === 6 && R.n('La Combotte') === 5 && proche(R.moy('Les Charmes'), 1.5) && proche(R.moy('Aux Murgers'), 29.5 / 6),
    [R.n('Les Charmes'), R.n('Aux Murgers'), R.n('La Combotte')].join(','));
  const C = R.cfm || {};
  T('⑤ Conformité : plafond 28 kg/ha sur sept ans', C.avail === true && C.plaf === 28, JSON.stringify({ avail: C.avail, plaf: C.plaf }));
  T('⑤ l’arrachée n’est pas listée, les quatre autres le sont, de la plus chargée à la moins chargée',
    (C.rows || []).map((r) => r.nom).join('|') === 'Aux Murgers|La Combotte|Les Charmes|En Bertrange', (C.rows || []).map((r) => r.nom + ':' + r.cu).join(' '));
  T('⑤ au-dessus du plafond : 1 (Aux Murgers, 29,5) ; en vigilance : 1 (La Combotte, 26,5 = 95 %)', C.over === 1 && C.warn === 1, JSON.stringify({ over: C.over, warn: C.warn }));
  return out;
}

/* dans une fonction précise : le même texte peut exister ailleurs dans le fichier (la première occurrence n'est pas forcément la sienne) */
const dans = (cle, nom, a, b) => (S) => { const f = fnSrc(S[cle], nom); if (!f.includes(a)) throw new Error('mutant sans prise dans ' + nom + ' : ' + a.slice(0, 60)); return { ...S, [cle]: S[cle].replace(f, f.replace(a, b)) }; };
const MUTANTS = [
  ['huit années au lieu de sept', dans('reg', '_cuRollingYears', 'for(var k=6;k>=0;k--)', 'for(var k=7;k>=0;k--)')],
  ['le soufre compté comme du cuivre', dans('reg', '_cuIsCu', "t.type==='Cuivre'&&", '')],
  ['un traitement sans parcelle ne vaut pour personne', dans('reg', '_cuTreatParc', 'if(!a||!a.length)return _cuActiveParc().map(function(p){return p.nom;});', 'if(!a||!a.length)return [];')],
  ['la moyenne toujours divisée par 7', dans('reg', '_cuParcRollN', 'if(_cuParcYear(nom,ys[i])>0) return ys.length-i;', 'if(_cuParcYear(nom,ys[i])>0) return 7;')],
  ['l’arrachée remise dans la Conformité', dans('pil', '_cfmCuivre', "return p && p.statut!=='Arrachee';", 'return !!p;')],
  ['le plafond passé à 30', dans('pil', '_cfmCuivre', 'var PLAF=28;', 'var PLAF=30;')],
  ['la vigilance à 97 % au lieu de 87,5 %', dans('pil', '_cfmCuivre', 'r.ratio>=0.875 && r.ratio<=1', 'r.ratio>=0.97 && r.ratio<=1')],
];

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  for (const [n, ok, d] of r) { console.log((ok ? '  ✓ ' : '  ✗ ') + n + (ok ? '' : '  → ' + d)); if (!ok) ko++; }
  console.log(ko ? `✗ cuivre sur sept ans : ${ko} rouge(s) sur ${r.length}` : `✓ cuivre sur sept ans : ${r.length} vertes`);
  process.exit(ko ? 1 : 0);
} else {
  const base = suite(S0);
  if (base.some(([, ok]) => !ok)) { console.log('✗ la suite doit être verte avant les contre-épreuves'); process.exit(1); }
  let ko = 0;
  for (const [nom, f] of MUTANTS) {
    let rouge;
    try { const r = suite(f(S0)); rouge = r.find(([, ok]) => !ok); } catch (e) { console.log('  ✗ ' + nom + ' : ' + e.message); ko++; continue; }
    if (rouge) console.log('  ✓ ' + nom + ' → rougit (' + rouge[0] + ')'); else { console.log('  ✗ ' + nom + ' → reste vert'); ko++; }
  }
  console.log(ko ? `✗ contre-épreuve cuivre : ${ko} mutant(s) non vus` : `✓ contre-épreuve cuivre : ${MUTANTS.length}/${MUTANTS.length}`);
  process.exit(ko ? 1 : 0);
}
