// HARNAIS — PLAN-1 (§279) : le Planning « Le mois » au dessin de la maquette v5 (habit seulement, mêmes gestes).
//   node scripts/mv-harnais-plan1.mjs           → doit être vert
//   node scripts/mv-harnais-plan1.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/styles.css'), pl: L('src/planning.js'), liste: L('scripts/mv-harnais-liste.mjs') };
function bloc(css) { const i = css.indexOf('★ PLAN-1 (§279)'); if (i < 0) return ''; const j = css.indexOf('★ FIN PLAN-1', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  T('le bloc PLAN-1 est posé après ACC-3, par jetons seulement (' + dur.length + ')', B.length > 4000 && S.css.indexOf('★ PLAN-1 (§279)') > S.css.indexOf('★ FIN ACC-3') && dur.length === 0);
  T('les outils tiennent sur une ligne (année, période, congés et chaleur), le reste en pleine largeur', B.includes('#page-planning #plan-body > .pl2-yrtabs,#page-planning #plan-body > .pl2-toolbar,#page-planning #plan-body > .pl2-perbar{ flex:0 0 auto;') && B.includes('#page-planning #plan-body > *{ flex:1 1 100%; min-width:0; }'));
  T('l’année et Semaine / Mois en segmenté', B.includes('#page-planning .pl2-yrtabs{ display:inline-flex;') && B.includes('#page-planning .pl2-seg button.on{ background:var(--bg-card)!important;'));
  T('les trois chiffres en bande fine', B.includes('#page-planning #plan-stats-band{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr));'));
  T('la base des cases a une spécificité basse (:where) et laisse les puces spéciales', B.includes('#page-planning .pl2-chip:where(:not(.pl2c-late,.pl2c-mod,.pl2c-brk,.pl2c-hc)){'));
  T('chaque type a sa teinte (plus, moins, congé, absence, récup, chaleur) et la légende suit', ['pl2c-up{ background:var(--ok-doux)', 'pl2c-dn{ background:var(--attention-doux)', 'pl2c-cp{ background:var(--accent-doux)', 'pl2c-abs{ background:var(--danger-doux)', 'pl2c-rec{ background:var(--survol)', 'pl2c-heat{ background:var(--attention-doux)'].every((x) => B.includes('.pl2-chip.' + x) && B.includes('.pl2-legend i.' + x)));
  T('la case cochée est cerclée à l’accent (contour, pas d’ombre écrasée)', B.includes('#page-planning .pl2-cell.pl2-selon .pl2-chip{ outline:var(--bw-2) solid var(--accent)!important;'));
  T('aujourd’hui à l’accent', B.includes('#page-planning .pl2-dh.pl2-today .pl2-dh-num{') && B.includes('background:var(--accent)!important; color:var(--sur-accent)!important; }'));
  T('la colonne des noms ne s’élargit que sur ordinateur ; au téléphone, sans avatar', /@media \(min-width:1024px\)\{\s*#page-planning \.pl2-grid\.pl2-wk\{ grid-template-columns:calc\(var\(--e-10,64px\) \* 2\.75\)/.test(B) && B.includes('#page-planning .pl2-ava{ display:none!important; }'));
  T('la barre du bas en sombre, « Heures » à l’accent', B.includes('#plan-mbar.pl2-mbar{ border:0!important; background:var(--inverse)!important;') && B.includes('#plan-mbar .pl2-mbar-acts button.pl2-mbar-heures{ background:var(--accent)!important;'));
  T('les gestes de la grille sont intacts (cocher une case, un jour, un nom, tout)', ['planCellTap(', 'planColTap(', 'planRowTap(', 'planSelAll()', "' pl2-selon'"].every((x) => S.pl.includes(x)));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-plan1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-plan1.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['une couleur écrite en dur dans le bloc', 'css', '#page-planning .pl2-chip.pl2c-up{ background:var(--ok-doux)!important;', '#page-planning .pl2-chip.pl2c-up{ background:#E6F0E9!important;', 0],
    ['les outils reprennent toute la largeur', 'css', '#page-planning #plan-body > .pl2-yrtabs,#page-planning #plan-body > .pl2-toolbar,#page-planning #plan-body > .pl2-perbar{ flex:0 0 auto;', '#page-planning #plan-body > .pl2-yrtabs,#page-planning #plan-body > .pl2-toolbar,#page-planning #plan-body > .pl2-perbar{ flex:1 1 100%;', 1],
    ['la base des cases écrase les teintes', 'css', '#page-planning .pl2-chip:where(:not(.pl2c-late,.pl2c-mod,.pl2c-brk,.pl2c-hc)){', '#page-planning .pl2-chip:not(.pl2c-late):not(.pl2c-mod):not(.pl2c-brk):not(.pl2c-hc){', 4],
    ['la légende garde les anciennes couleurs', 'css', '#page-planning .pl2-legend i.pl2c-cp{ background:var(--accent-doux)!important; }', '', 5],
    ['la case cochée redevient une ombre écrasée', 'css', '#page-planning .pl2-cell.pl2-selon .pl2-chip{ outline:var(--bw-2) solid var(--accent)!important;', '#page-planning .pl2-cell.pl2-selon .pl2-chip{ box-shadow:inset 0 0 0 var(--bw-2) var(--accent)!important;', 6],
    ['le téléphone garde l’avatar qui déborde', 'css', '#page-planning .pl2-ava{ display:none!important; }', '', 8],
    ['un geste de la grille disparaît', 'pl', 'planColTap(', 'planColTapX(', 10],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-plan1.mjs'],", '', 11]
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
