// HARNAIS — CAVE-4 (§291) : le Millésime au dessin de la maquette v8 (habit seulement).
//   node scripts/mv-harnais-cave4.mjs           → doit être vert
//   node scripts/mv-harnais-cave4.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/styles.css'), cave: L('src/cave.js'), liste: L('scripts/mv-harnais-liste.mjs') };
function bloc(css) { const i = css.indexOf('★ CAVE-4 (§291)'); if (i < 0) return ''; const j = css.indexOf('★ FIN CAVE-4', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  T('le bloc CAVE-4 est posé après CAVE-3, par jetons seulement (' + dur.length + ')', B.length > 2500 && S.css.indexOf('★ CAVE-4 (§291)') > S.css.indexOf('★ FIN CAVE-3') && dur.length === 0);
  T('les feuilles recalées existent bien (mlx-chip.on, mlx-rd.over, pcav-k.dark, pcav-kv)', ['.mlx-chip.on', '.mlx-rd.over', '.pcav-k.dark', '.pcav-kv', '.pcav-vbig', '.mlx-p.alerte'].every((c) => S.cave.includes(c)));
  T('le millésime choisi à l’accent (plus de noir et or)', B.includes('#page-cave .mlx-chip.on{ border-color:var(--accent); background:var(--accent-doux); color:var(--accent-texte); }'));
  T('les chiffres en Outfit (tuiles et verdict), les étiquettes en casse normale', B.includes('#page-cave .pcav-kv,#page-cave .pcav-k.dark .pcav-kv{ font-family:var(--font-ui);') && B.includes('#page-cave .pcav-vbig{ font-family:var(--font-ui);') && B.includes('#page-cave .pcav-t,#page-cave .pcav-kl{ letter-spacing:0; text-transform:none;'));
  T('la tuile mise en avant passe en accent doux, le rendement au-delà du plafond en rouge pâle', B.includes('#page-cave .pcav-k.dark{ border-color:var(--accent); background:var(--accent-doux); }') && B.includes('#page-cave .mlx-rd.over{ border-color:var(--danger); background:var(--danger-doux); }'));
  T('les points et jauges par les états', B.includes('#page-cave .mlx-p.alerte{ background:var(--danger); }') && B.includes('#page-cave .mlx-fi{ background:var(--ok); }'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-cave4.mjs'],") && S.liste.includes("['node scripts/mv-harnais-cave4.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['une couleur écrite en dur dans le bloc', 'css', '#page-cave .mlx-fi{ background:var(--ok); }', '#page-cave .mlx-fi{ background:#3D6B27; }', 0],
    ['la feuille du Millésime renomme son choix', 'cave', '.mlx-chip.on', '.mlx-chip.sel', 1],
    ['le millésime choisi repasse en noir', 'css', '#page-cave .mlx-chip.on{ border-color:var(--accent); background:var(--accent-doux); color:var(--accent-texte); }', '#page-cave .mlx-chip.on{ border-color:var(--accent); }', 2],
    ['les chiffres repassent en Cormorant', 'css', '#page-cave .pcav-kv,#page-cave .pcav-k.dark .pcav-kv{ font-family:var(--font-ui);', '#page-cave .pcav-kv,#page-cave .pcav-k.dark .pcav-kv{ font-family:var(--font-titre);', 3],
    ['le dépassement perd son rouge', 'css', '#page-cave .mlx-rd.over{ border-color:var(--danger); background:var(--danger-doux); }', '', 4],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-cave4.mjs'],", '', 6]
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
