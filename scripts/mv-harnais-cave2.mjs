// HARNAIS — CAVE-2 (§289) : le Cuvier au dessin de la maquette v8 (habit seulement, la cuve s'ouvre toujours en place).
//   node scripts/mv-harnais-cave2.mjs           → doit être vert
//   node scripts/mv-harnais-cave2.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/styles.css'), cuv: L('src/cuvier.js'), liste: L('scripts/mv-harnais-liste.mjs') };
function bloc(css) { const i = css.indexOf('★ CAVE-2 (§289)'); if (i < 0) return ''; const j = css.indexOf('★ FIN CAVE-2', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  T('le bloc CAVE-2 est posé après CAVE-1, par jetons seulement (' + dur.length + ')', B.length > 3000 && S.css.indexOf('★ CAVE-2 (§289)') > S.css.indexOf('★ FIN CAVE-1') && dur.length === 0);
  T('le rendu produit bien les classes recalées (ligne ouverte, filtres, tri, alerte, bouton)', S.cuv.includes("'<div class=\"mvv-row '+cls+(ouv?' open':'')+'\">'") && S.cuv.includes('<div class="mvv-fils" id="mvv-fils">') && S.cuv.includes('<div class="mvv-seg" role="group" aria-label="Trier les cuves">') && S.cuv.includes('<div class="mvv-alert">') && S.cuv.includes('onclick="openOvVendCuve(null)">+ Nouvelle cuve</button>'));
  T('la cuve ouverte cerclée à l’accent, le nom en Outfit', B.includes('#page-cave .mvv-row.open{ border-color:var(--accent); }') && B.includes('#page-cave .mvv-nom{ font-family:var(--font-ui);'));
  T('le tri et les filtres : le choisi au kit, le filtre actif à l’accent (plus de terre)', B.includes('#page-cave .mvv-seg > button.on{ background:var(--bg-card);') && B.includes('#page-cave .mvv-fils > button.on{ border-color:var(--accent); background:var(--accent-doux);'));
  T('l’alerte « à mesurer » en ambre, « Nouvelle cuve » à l’accent, « Fusionner » en secondaire', B.includes('#page-cave .mvv-alert{ border-radius:var(--r-md,8px); background:var(--attention-doux);') && B.includes('#page-cave .mvv-fab-btn:not([onclick*="openVendFusion"]){') && B.includes('#page-cave .mvv-fab-btn[onclick*="openVendFusion"]{'));
  T('au large, les cuves par deux, la cuve ouverte sur toute la largeur', B.includes('#page-cave #mvv-corps{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr));') && B.includes('#page-cave #mvv-corps > .mvv-row.open{ grid-column:1 / -1; }'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-cave2.mjs'],") && S.liste.includes("['node scripts/mv-harnais-cave2.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['une couleur écrite en dur dans le bloc', 'css', '#page-cave .mvv-row.open{ border-color:var(--accent); }', '#page-cave .mvv-row.open{ border-color:#7A2048; }', 0],
    ['le rendu ne marque plus la cuve ouverte', 'cuv', "'<div class=\"mvv-row '+cls+(ouv?' open':'')+'\">'", "'<div class=\"mvv-row '+cls+'\">'", 1],
    ['le nom repasse en Cormorant', 'css', '#page-cave .mvv-nom{ font-family:var(--font-ui);', '#page-cave .mvv-nom{ font-family:var(--font-titre);', 2],
    ['le filtre actif garde la terre', 'css', '#page-cave .mvv-fils > button.on{ border-color:var(--accent); background:var(--accent-doux);', '#page-cave .mvv-fils > button.on{ border-color:var(--accent);', 3],
    ['« Fusionner » prend l’accent', 'css', '#page-cave .mvv-fab-btn:not([onclick*="openVendFusion"]){', '#page-cave .mvv-fab-btn{', 4],
    ['la cuve ouverte reste dans sa colonne', 'css', '  #page-cave #mvv-corps > .mvv-row.open{ grid-column:1 / -1; }\n', '', 5],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-cave2.mjs'],", '', 6]
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
