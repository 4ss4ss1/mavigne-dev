// HARNAIS — AVC-ARR : une parcelle arrachée ne porte plus que l'arrachage (avancement, fiche, gestes).
//   node scripts/mv-harnais-avc-arr.mjs           → doit être vert
//   node scripts/mv-harnais-avc-arr.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute la VRAIE getPCls (app.js) et la vraie règle _mvArrHors ; les gestes sont lus dans le source.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const APP = fs.readFileSync(path.join(R, 'src/app.js'), 'utf8');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n}\n', i) + 3); }
const HORS = APP.match(/function _mvArrHors\(p,nom\)\{[^\n]*\n/)[0];
const PCLS = sansCom(fn(APP, 'function getPCls(p){'));

function monde(hors, pcls) {
  const ctx = { console, Math, String, Number, Array, Object, JSON, parseInt, parseFloat,
    getTachesSaison: () => [{ nom: 'Arrachage' }, { nom: 'Prétaille' }],
    getTacheStatut: (p, n) => (p.taches[n] || 'Non démarré'),
    pctColor: () => 'x', _mvExclu: () => false };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(hors + pcls + '\nthis.__f={getPCls,_mvArrHors};', ctx);
  return ctx.__f;
}
function suite(hors, pcls) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const f = monde(hors, pcls);
  const arr = { nom: 'Bras', statut: 'Arrachee', taches: { 'Prétaille': 'Validé' } };
  let c = f.getPCls(arr);
  T('arrachée : seul l\u2019arrachage compte (0/1, 0 %) — le cas des captures', c.nbTotal === 1 && c.nbDone === 0 && c.pct === 0);
  arr.taches.Arrachage = 'Validé'; c = f.getPCls(arr);
  T('arrachée, arrachage validé : 1/1, 100 %', c.nbTotal === 1 && c.nbDone === 1 && c.pct === 100);
  const act = { nom: 'Clos', statut: 'Active', taches: { 'Prétaille': 'Validé' } };
  c = f.getPCls(act);
  T('vigne en place : inchangée (2 travaux, 1 fait)', c.nbTotal === 2 && c.nbDone === 1 && c.pct === 50);
  T('règle : arrachée hors arrachage refusée, arrachage permis, vigne en place libre',
    f._mvArrHors(arr, 'Prétaille') && !f._mvArrHors(arr, 'Arrachage') && !f._mvArrHors(act, 'Prétaille'));
  const gestes = ['marquerEnCours', 'openValidationPanel', 'openNiveauxPanel', 'openPassagesPanel', 'tapTacheSimple', 'pQuickValidate'];
  gestes.forEach(g => T('le geste ' + g + ' refuse une arrachée hors arrachage', /_mvArrRefus\(/.test(fn(APP, 'function ' + g + '('))));
  T('la fiche n\u2019affiche que l\u2019arrachage sur une arrachée', /getTachesSaison\(\)\.filter\(t=>!_mvArrHors\(p,t\.nom\)\)/.test(APP));
  return out;
}
let ok = 0, ko = 0;
suite(HORS, PCLS).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nAVC-ARR : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const D = [
  ['getPCls compte encore les autres travaux', h => h, p => p.replace("&& !((typeof _mvArrHors==='function')&&_mvArrHors(p,t.nom))", '')],
  ['la règle oublie l\u2019exception de l\u2019arrachage', h => h.replace("&& nom!=='Arrachage'", ''), p => p],
  ['la règle bloque aussi les vignes en place', h => h.replace("p.statut==='Arrachee' && ", ''), p => p],
];
let rg = 0;
D.forEach(([n, fh, fp]) => {
  const a = fh(HORS), b = fp(PCLS);
  if (a === HORS && b === PCLS) { console.log('  ⚠ non injecté : ' + n); return; }
  let res; try { res = suite(a, b); } catch (e) { res = [['exc', false]]; }
  const rouge = res.some(([, c]) => !c); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
});
console.log(`\n${rg}/${D.length} contre-épreuves rougissent`);
process.exit(rg === D.length ? 0 : 1);
