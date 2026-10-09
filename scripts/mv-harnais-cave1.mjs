// HARNAIS — CAVE-1 (§288) : la Cave › Aujourd'hui et sa bande au dessin de la maquette v8 (habit seulement).
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
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  T('le bloc CAVE-1 est posé après PHYTO-3, par jetons seulement (' + dur.length + ')', B.length > 3000 && S.css.indexOf('★ CAVE-1 (§288)') > S.css.indexOf('★ FIN PHYTO-3') && dur.length === 0);
  T('la bande en quatre cases fines', B.includes('#page-cave #cave-kpis{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr));'));
  T('« Ce qui presse » : la phrase en Outfit, la gravité en filet et en couleur (due, warn, ok)', B.includes('#page-cave .auj-big{ font-family:var(--font-ui);') && B.includes('#page-cave .auj-hero.due{ box-shadow:inset var(--bw-2) 0 0 var(--danger); }') && B.includes('#page-cave .auj-hero.warn .auj-big{ color:var(--attention); }') && B.includes('#page-cave .auj-hero.ok .auj-big{ color:var(--ok); }'));
  T('les classes recalées existent bien dans le rendu (_aujRender) et ses feuilles injectées', S.cave.includes("'<div class=\"auj-hero '+v.cls+'\"><div class=\"auj-k\">Ce qui presse</div>'") && ['auj-big', 'auj-cadre', 'mlx-wk', 'mlx-wknow', 'mlx-empty', 'mlx-hint'].every((c) => S.cave.includes(c)) && S.cave.includes('.mlx-ev.due .auj-ic'));
  T('les semaines en cartes, la semaine en cours cerclée à l’accent, l’évènement dû en rouge', B.includes('#page-cave .mlx-wk.now{ border-color:var(--accent); }') && B.includes('#page-cave .mlx-ev.due .auj-ic{ background:var(--danger-doux); color:var(--danger); }'));
  T('au large : le verdict à gauche sur plusieurs rangées, les semaines à droite, la note sur toute la largeur', B.includes('#page-cave #auj-body > .auj-hero{ grid-column:1; grid-row:span 4; }') && B.includes('#page-cave #auj-body > :is(.mlx-wk,.mlx-empty){ grid-column:2; }') && B.includes('#page-cave #auj-body > *{ grid-column:1 / -1; min-width:0; }'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-cave1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-cave1.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['une couleur écrite en dur dans le bloc', 'css', '#page-cave .auj-hero.ok .auj-big{ color:var(--ok); }', '#page-cave .auj-hero.ok .auj-big{ color:#3D6B27; }', 0],
    ['la bande reprend ses tuiles', 'css', '#page-cave #cave-kpis{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr));', '#page-cave #cave-kpis{ display:flex;', 1],
    ['la phrase repasse en Cormorant', 'css', '#page-cave .auj-big{ font-family:var(--font-ui);', '#page-cave .auj-big{ font-family:var(--font-titre);', 2],
    ['le rendu renomme sa carte', 'cave', "'<div class=\"auj-hero '", "'<div class=\"auj-verdict '", 3],
    ['la semaine en cours n’est plus cerclée', 'css', '#page-cave .mlx-wk.now{ border-color:var(--accent); }', '', 4],
    ['les semaines passent sous le verdict', 'css', '  #page-cave #auj-body > :is(.mlx-wk,.mlx-empty){ grid-column:2; }\n', '', 5],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-cave1.mjs'],", '', 6]
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
