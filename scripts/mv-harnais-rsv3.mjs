// HARNAIS — RSV-3 (§294) : le Bilan matière au dessin de la maquette v9 (habit seulement).
//   node scripts/mv-harnais-rsv3.mjs           → doit être vert
//   node scripts/mv-harnais-rsv3.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/styles.css'), rsv: L('src/reserve.js'), liste: L('scripts/mv-harnais-liste.mjs') };
function bloc(css) { const i = css.indexOf('★ RSV-3 (§294)'); if (i < 0) return ''; const j = css.indexOf('★ FIN RSV-3', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  T('le bloc RSV-3 est posé après RSV-2, par jetons seulement (' + dur.length + ')', B.length > 1500 && S.css.indexOf('★ RSV-3 (§294)') > S.css.indexOf('★ FIN RSV-2') && dur.length === 0);
  T('le rendu du bilan produit bien les classes recalées (en-tête, tableau, stock négatif, note)', S.rsv.includes('<div class="mvr-exp-head"><div class="mvr-exp-t">Bilan matière — Intrants</div>') && S.rsv.includes('<div class="mvr-exp-tbl"><table>') && S.rsv.includes("((s.known&&s.q<0)?'mvr-neg':'')") && S.rsv.includes('<div class="mvr-exp-legal">'));
  T('l’en-tête quitte le noir cave : carte claire, titre en Outfit', B.includes('#page-reserve .mvr-exp-head{ border:var(--bw) solid var(--ligne,#E7E6E2);') && B.includes('background:var(--bg-card); }') && B.includes('#page-reserve .mvr-exp-t{ font-family:var(--font-ui);'));
  T('le stock négatif reste en rouge, plus fort que la couleur des cellules', B.includes('#page-reserve .mvr-exp-tbl td.mvr-neg{ color:var(--danger);') && B.includes('#page-reserve .mvr-exp-tbl td{ border-top-color:var(--ligne,#E7E6E2); color:var(--texte-med); }'));
  T('les titres de colonne du kit, les chiffres tabulaires, la note sur fond doux', B.includes('#page-reserve .mvr-exp-tbl table{ font-size:var(--pt-txt,13px); font-variant-numeric:tabular-nums; }') && B.includes('#page-reserve .mvr-exp-legal{ border-radius:var(--r-sm,6px); background:var(--bg-doux);'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-rsv3.mjs'],") && S.liste.includes("['node scripts/mv-harnais-rsv3.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['une couleur écrite en dur dans le bloc', 'css', '#page-reserve .mvr-tag-p{ background:var(--attention-doux); color:var(--attention); }', '#page-reserve .mvr-tag-p{ background:#F7EBD6; color:var(--attention); }', 0],
    ['le rendu ne marque plus le stock négatif', 'rsv', "((s.known&&s.q<0)?'mvr-neg':'')", "''", 1],
    ['l’en-tête repasse en Cormorant', 'css', '#page-reserve .mvr-exp-t{ font-family:var(--font-ui);', '#page-reserve .mvr-exp-t{ font-family:var(--font-titre);', 2],
    ['le stock négatif perd sa priorité', 'css', '#page-reserve .mvr-exp-tbl td.mvr-neg{ color:var(--danger);', '#page-reserve .mvr-neg{ color:var(--danger);', 3],
    ['la note reste brute', 'css', '#page-reserve .mvr-exp-legal{ border-radius:var(--r-sm,6px); background:var(--bg-doux);', '#page-reserve .mvr-exp-legal{ border-radius:var(--r-sm,6px);', 4],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-rsv3.mjs'],", '', 5]
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
