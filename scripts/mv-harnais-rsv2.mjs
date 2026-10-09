// HARNAIS — RSV-2 (§293) : la Réserve › Intrants au dessin de la maquette v9 (habit seulement).
//   node scripts/mv-harnais-rsv2.mjs           → doit être vert
//   node scripts/mv-harnais-rsv2.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/styles.css'), rsv: L('src/reserve.js'), liste: L('scripts/mv-harnais-liste.mjs') };
function bloc(css) { const i = css.indexOf('★ RSV-2 (§293)'); if (i < 0) return ''; const j = css.indexOf('★ FIN RSV-2', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  T('le bloc RSV-2 est posé après RSV-1, par jetons seulement (' + dur.length + ')', B.length > 2000 && S.css.indexOf('★ RSV-2 (§293)') > S.css.indexOf('★ FIN RSV-1') && dur.length === 0);
  T('le rendu produit bien les classes recalées et la couleur du stock écrite en ligne (terre / rouge)', S.rsv.includes("var stCol=(s.known&&s.q<0)?'var(--rouge)':'var(--terre)';") && S.rsv.includes('<span class="mvr-psv" style="color:\'+stCol+\'">') && S.rsv.includes("h+='<div class=\"mvr-pcard\">") && S.rsv.includes('<div class="mvr-alert">'));
  T('le stock en texte, en rouge s’il est négatif (le style en ligne est lu, pas écrasé à l’aveugle)', B.includes('#page-reserve .mvr-psv[style*="terre"]{ color:var(--texte)!important; }') && B.includes('#page-reserve .mvr-psv[style*="rouge"]{ color:var(--danger)!important; }'));
  T('l’alerte de stock négatif en rouge pâle, l’attente sur fond doux, le nom en Outfit', B.includes('#page-reserve .mvr-alert{ border:0; border-radius:var(--r-md,8px); background:var(--danger-doux);') && B.includes('#page-reserve .mvr-pending{') && B.includes('#page-reserve .mvr-pnom{ font-family:var(--font-ui);'));
  T('au large, les cartes par deux (seulement là où il y a des cartes d’intrant)', B.includes('#page-reserve .mvr-body:has(> .mvr-pcard){ display:grid; grid-template-columns:repeat(2,minmax(0,1fr));') && B.includes('#page-reserve .mvr-body:has(> .mvr-pcard) > .mvr-pcard{ grid-column:auto; }'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-rsv2.mjs'],") && S.liste.includes("['node scripts/mv-harnais-rsv2.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['une couleur écrite en dur dans le bloc', 'css', '#page-reserve .mvr-pin-v{ color:var(--ok); }', '#page-reserve .mvr-pin-v{ color:#3D6B27; }', 0],
    ['le rendu change la couleur du stock', 'rsv', "var stCol=(s.known&&s.q<0)?'var(--rouge)':'var(--terre)';", "var stCol=(s.known&&s.q<0)?'var(--danger)':'var(--texte)';", 1],
    ['le stock négatif perd son rouge', 'css', '#page-reserve .mvr-psv[style*="rouge"]{ color:var(--danger)!important; }', '', 2],
    ['l’alerte reste brute', 'css', '#page-reserve .mvr-alert{ border:0; border-radius:var(--r-md,8px); background:var(--danger-doux);', '#page-reserve .mvr-alert{ border:0;', 3],
    ['les cartes restent en colonne au large', 'css', '  #page-reserve .mvr-body:has(> .mvr-pcard) > .mvr-pcard{ grid-column:auto; }\n', '', 4],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-rsv2.mjs'],", '', 5]
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
