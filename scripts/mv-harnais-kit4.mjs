// HARNAIS — KIT-4 (§229) : lot 3c du kit (Cave, Cuvier) et les surfaces de TOUS les modules.
//   node scripts/mv-harnais-kit4.mjs           → doit être vert
//   node scripts/mv-harnais-kit4.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIS _mvHaP / _mvHaT (src/utils.js) ; lit le reste dans les sources.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { uti: L('src/utils.js'), phyto: L('src/phyto.js'), trac: L('src/tracteur.js'), reg: L('src/reglages.js'), cuv: L('src/cuvier.js'), css: L('src/styles.css') };
function surf(S) {
  const ctx = { parseFloat, isFinite, String }; ctx.window = ctx; vm.createContext(ctx);
  const m = S.uti.match(/function _mvHaNum\(x\)\{[^\n]*\n(window\._mvHaP=[^\n]*\n)(window\._mvHaT=[^\n]*\n)/);
  if (!m) throw new Error('formateurs introuvables');
  vm.runInContext(m[0], ctx); return ctx;
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const w = surf(S);
  T('une parcelle au centiare, avec la virgule (0,0870 · 0,1144)', w._mvHaP(0.087) === '0,0870' && w._mvHaP('0,1144') === '0,1144' && w._mvHaP(null) === '');
  T('un total au centième, avec la virgule (11,85 · 1,25)', w._mvHaT(11.854) === '11,85' && w._mvHaT('1.25') === '1,25' && w._mvHaT('') === '');
  const RAW = [[S.phyto, /surfSel\.toFixed\(2\)\+' ha/], [S.phyto, /_tratSurfSel\(\)\.toFixed\(2\)/], [S.phyto, /'\+p\.surface\+' ha/],
    [S.trac, /'\+p\.surface\+' ha/], [S.trac, /\$\{doneSurf\.toFixed\(2\)\}/], [S.trac, /'\+sf\.toFixed\(2\)\+' ha'/],
    [S.reg, /surf\.toFixed\(2\)\+'ha'/], [S.reg, /\(parseFloat\(r\.p\.surface\)\|\|0\)\.toFixed\(2\)/], [S.reg, /\$\{haTot\.toFixed\(2\)\} ha/],
    [S.cuv, /_mvF1\(d\.surface\)\+' ha'/]];
  T('plus aucune surface écrite au point dans le Traitement, le Tracteur, les Réglages, le Cuvier', RAW.every(([s, re]) => !re.test(s)));
  T('… elles passent toutes par les deux formateurs', (S.phyto.match(/window\._mvHa[PT]\(/g) || []).length === 6 && (S.trac.match(/window\._mvHa[PT]\(/g) || []).length === 9   /* TRAC-1 (§282) : +2, la surface de la fiche de session */
    && (S.reg.match(/window\._mvHa[PT]\(/g) || []).length === 4 && (S.cuv.match(/window\._mvHaT\(/g) || []).length === 1);
  const css = S.css, apres = (sel, decl) => { const i = css.lastIndexOf(sel + '{' + decl); return i > 0 && i > css.indexOf(sel + '{'); };
  T('la Cave et la vendange au kit (6 px, pilule, piste gris-clair)', apres('.mvc-gauge-track', 'height:6px;border-radius:3px;background:var(--gris-clair);') && apres('.vend-prog-track', 'height:6px;border-radius:3px;background:var(--gris-clair);'));
  T('le Cuvier : l\u2019avancement en doré, le niveau de cuve en terre (le mesuré)', css.includes('body .vt-prog-f{border-radius:3px;background:var(--or);}') && css.includes('body .mvv-rh-fill{background:var(--terre,#8A5A38);}'));
  return out;
}
let ok = 0, ko = 0;
suite(SRC0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nKIT-4 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const sub = (k, a, b) => S => Object.assign({}, S, { [k]: S[k].replace(a, b) });
const D = [
  ['le total reprend son point', sub('uti', "window._mvHaT=function(x){ var v=_mvHaNum(x); return v==null?'':v.toFixed(2).replace('.',','); };", "window._mvHaT=function(x){ var v=_mvHaNum(x); return v==null?'':v.toFixed(2); };")],
  ['le Traitement réécrit une surface à la main', sub('phyto', "window._mvHaT(surfSel)+' ha", "surfSel.toFixed(2)+' ha")],
  ['le Tracteur réécrit l\u2019avancement du domaine à la main', sub('trac', '${window._mvHaT(doneSurf)}', '${doneSurf.toFixed(2)}')],
  ['l\u2019avancement du Cuvier reprend son dégradé', sub('css', 'body .vt-prog-f{border-radius:3px;background:var(--or);}', '')],
];
let rg = 0;
D.forEach(([n, f]) => {
  const S = f(SRC0);
  if (Object.keys(S).every(k => S[k] === SRC0[k])) { console.log('  \u26a0 non injecté : ' + n); return; }
  let res; try { res = suite(S); } catch (e) { res = [['exc', false]]; }
  const rouge = res.some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  \u2713 rougit : ' : '  \u2717 RESTE VERT : ') + n);
});
console.log(`\n${rg}/${D.length} défauts détectés`);
process.exit(rg === D.length ? 0 : 1);
