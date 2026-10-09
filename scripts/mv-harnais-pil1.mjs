// HARNAIS — PIL-1 (§298) : les sept onglets du Pilotage hors « Aujourd'hui » à la charte (habit seulement).
//   node scripts/mv-harnais-pil1.mjs           → doit être vert
//   node scripts/mv-harnais-pil1.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/styles.css'), pil: L('src/pilotage.js'), liste: L('scripts/mv-harnais-liste.mjs') };
function bloc(css) { const i = css.indexOf('★ PIL-1 (§298)'); if (i < 0) return ''; const j = css.indexOf('★ FIN PIL-1', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  T('le bloc PIL-1 est posé après COUL-1… et RG-2, par jetons seulement (' + dur.length + ')', B.length > 4000 && S.css.indexOf('★ PIL-1 (§298)') > S.css.indexOf('★ FIN RG-2') && dur.length === 0);
  T('le Pilotage produit bien les composants recalés', ['pil-tile', 'pil-th-t', 'pil-seg', 'pil-anbadge', 'pil-photo', 'pil-dz-chip', 'pil-gauge-lab', 'pil-prot-big', 'pil-diagbtn', 'pil-cr'].every((c) => S.pil.includes(c) || S.css.includes('.' + c)));
  T('l’exercice comptable en accent doux (plus de noir et or), « à compléter » en couleur d’état', B.includes('#page-pilotage .pil-cr.root{ border-color:transparent; background:var(--accent-doux); color:var(--accent-texte);') && B.includes('#page-pilotage .pil-diagbtn.grave{ border-color:var(--danger); background:var(--danger-doux); color:var(--danger); }'));
  T('les titres de tuile et de panneau sans capitales, les chiffres en Outfit', B.includes('#page-pilotage .pil-th-t{ font-size:var(--pt-micro,12px); font-weight:var(--fw-semi,600); letter-spacing:0; text-transform:none;') && B.includes('#page-pilotage .pil-th-stat b{ font-family:var(--font-ui);') && B.includes('#page-pilotage .pil-prot-big{ font-family:var(--font-ui);'));
  T('les segmentés au kit (le choisi en carte, plus de noir et or)', B.includes('#page-pilotage :is(.pil-seg,.pil-anseg) button.on{ background:var(--bg-card); color:var(--texte);'));
  T('la jauge en vert plein (plus de dégradé brun), les puces de Décider à l’accent', B.includes('#page-pilotage .pil-gauge-fill{ background:var(--ok); }') && B.includes('#page-pilotage .pil-dz-chip.on{ border-color:var(--accent); background:var(--accent-doux);'));
  T('le cockpit n’est pas touché : aucune règle PIL-1 ne vise .ck2 ni une classe ck-', !/\.ck2|\.ck-/.test(B.slice(B.indexOf('*/') + 2).replace(/\/\*[\s\S]*?\*\//g, '')));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-pil1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-pil1.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['une couleur écrite en dur dans le bloc', 'css', '#page-pilotage .pil-gauge-fill{ background:var(--ok); }', '#page-pilotage .pil-gauge-fill{ background:#3D6B27; }', 0],
    ['l’exercice repasse en noir et or', 'css', '#page-pilotage .pil-cr.root{ border-color:transparent; background:var(--accent-doux); color:var(--accent-texte);', '#page-pilotage .pil-cr.root{ border-color:transparent;', 2],
    ['les titres reprennent leurs capitales', 'css', '#page-pilotage .pil-th-t{ font-size:var(--pt-micro,12px); font-weight:var(--fw-semi,600); letter-spacing:0; text-transform:none;', '#page-pilotage .pil-th-t{ font-size:var(--pt-micro,12px); font-weight:var(--fw-semi,600);', 3],
    ['le segmenté choisi repasse en noir', 'css', '#page-pilotage :is(.pil-seg,.pil-anseg) button.on{ background:var(--bg-card); color:var(--texte);', '#page-pilotage :is(.pil-seg,.pil-anseg) button.on{ color:var(--texte);', 4],
    ['une règle déborde sur le cockpit', 'css', '/* ★ FIN PIL-1 */', '#page-pilotage .ck2 .ck-v-phrase{ color:var(--texte); }\n/* ★ FIN PIL-1 */', 6],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-pil1.mjs'],", '', 7]
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
