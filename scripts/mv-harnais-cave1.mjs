// HARNAIS — CAVE-1 (§288) : la bande de la Cave au dessin de la maquette v8.
//   ★ CAVEAUJ-1 (§434) : « Ce qui presse » et les semaines ont été refaits (bloc CAVEAUJ-1 de la feuille, tenu par
//   mv-harnais-caveauj1). Ce harnais garde ce qui reste à CAVE-1 — la bande en quatre cases fines, par jetons — et que
//   les pièces de l'ancien écran (verdict auj-hero, semaines mlx-wk, ligne _mlEvHtml) ne reviennent pas.
//   node scripts/mv-harnais-cave1.mjs           → doit être vert
//   node scripts/mv-harnais-cave1.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/styles.css'), cave: L('src/cave.js'), liste: L('scripts/mv-harnais-liste.mjs') };
function bloc(css) { const i = css.indexOf('★ CAVE-1 (§288)'); if (i < 0) return ''; const j = css.indexOf('★ FIN CAVE-1', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
function suite(S) {
  const out = []; const T = (n, ok) => out.push([n, !!ok]);
  const B = bloc(S.css), regles = B.replace(/\/\*[\s\S]*?\*\//g, '');
  const dur = sansVar(regles).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|font-size:\s*\d/g) || [];
  T('le bloc CAVE-1 est posé après PHYTO-3, par jetons seulement (' + dur.length + ')', B.length > 300 && S.css.indexOf('★ CAVE-1 (§288)') > S.css.indexOf('★ FIN PHYTO-3') && dur.length === 0);
  T('la bande en quatre cases fines', B.includes('#page-cave #cave-kpis{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr));'));
  T('les pièces de l’ancien écran ne reviennent ni dans le bloc ni dans le rendu (CAVEAUJ-1)', !/\.auj-hero|\.auj-big|\.mlx-wk|\.mlx-ev|#auj-body > /.test(regles) && !/class="auj-hero|mlx-wknow|function _mlEvHtml\(/.test(S.cave));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-cave1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-cave1.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['une couleur écrite en dur dans le bloc', 'css', '#page-cave #cave-kpis{ display:grid;', '#page-cave #cave-kpis{ color:#3D6B27; display:grid;', 0],
    ['la bande reprend ses tuiles', 'css', '#page-cave #cave-kpis{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr));', '#page-cave #cave-kpis{ display:flex;', 1],
    ['l’ancien verdict revient dans le bloc', 'css', '/* ★ FIN CAVE-1 */', '#page-cave .auj-hero{ padding:0; }\n/* ★ FIN CAVE-1 */', 2],
    ['l’ancienne ligne d’agenda revient dans le rendu', 'cave', 'function _aujLigne(x){', 'function _mlEvHtml(it){ return it; }\nfunction _aujLigne(x){', 2],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-cave1.mjs'],", '', 3]
  ];
  let mord = 0;
  DEF.forEach(([nom, f, de, vers, cible]) => {
    const S = Object.assign({}, S0); if (!S[f].includes(de)) { console.log('  !! MOTIF ABSENT : ' + nom); return; }
    S[f] = S[f].split(de).join(vers); if (S[f] === S0[f]) { console.log('  !! MUTATION SANS EFFET : ' + nom); return; }
    const r = jouer(S), ok = r[cible] && !r[cible][1]; console.log((ok ? '  rougit  ' : '  NE MORD PAS  ') + nom); if (ok) mord++;
  });
  console.log('\n' + (mord === DEF.length ? 'CONTRE-ÉPREUVES VERTES' : 'CONTRE-ÉPREUVES ROUGES') + ' \u2014 ' + mord + '/' + DEF.length + ' défauts réinjectés');
  if (mord !== DEF.length) process.exit(1);
}
if (ko) process.exit(1);
