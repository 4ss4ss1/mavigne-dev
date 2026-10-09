// HARNAIS — TETE-1 (§272) : les en-têtes de module, le bandeau du Pilotage et les onglets au dessin de la maquette v2.
//   node scripts/mv-harnais-tete1.mjs           → doit être vert
//   node scripts/mv-harnais-tete1.mjs --contre  → chaque défaut réinjecté doit rougir
// Lit le bloc CSS TETE-1 (balisé ★ TETE-1 … ★ FIN TETE-1) : présent après COQ-2, écrit par jetons seulement (replis
// compris), et porteur des règles qui font l'habit de la maquette. Aucun balisage ne change : le reste n'est pas lu.
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/styles.css'), liste: L('scripts/mv-harnais-liste.mjs') };
function bloc(css) { const i = css.indexOf('★ TETE-1 (§272)'); if (i < 0) return ''; const j = css.indexOf('★ FIN TETE-1', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) {
  let out = '', i = 0;
  for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3;
    for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; }
}
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).replace(/env\([^)]*\)/g, '')
  .match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  T('le bloc TETE-1 est posé après COQ-2 et n’écrit aucune valeur en dur (' + dur.length + ')',
    B.length > 3000 && S.css.indexOf('★ TETE-1 (§272)') > S.css.indexOf('★ FIN COQ-2') && dur.length === 0);
  T('les en-têtes de module sont sur la surface, avec un filet dessous', B.includes('body .mod-header{ background:var(--bg-card)!important; border-bottom:var(--bw) solid var(--ligne,#E7E6E2)!important;'));
  T('la bande sombre sous le titre disparaît (Vigne, Tracteur, Cave…)', B.includes('body .mod-header .mod-header-top,body .mvc-hdr .mvc-hdr-top{ background:var(--bg-card)!important;') && B.includes('.mod-header-top::before,body .mvc-hdr .mvc-hdr-top::before{ display:none!important; }'));
  T('l’icône du module n’a plus de boîte', B.includes('body .mod-header .mod-header-icon{ background:none!important; border:0!important;'));
  T('les titres passent en Outfit (le serif reste à la marque et à l’objet ouvert)', B.includes('body .mod-header .mod-header-title{ font-family:var(--font-ui)!important;') && B.includes('body .pil-mast .pil-dom{ font-family:var(--font-ui)!important;'));
  T('les onglets sont soulignés : pas de pastille, un trait sous l’onglet ouvert, pas d’icône',
    B.includes('.mvu-tab{ flex:none!important; position:relative; height:var(--h-row); padding:0 var(--e-2,8px); border:0!important; border-radius:0!important; background:transparent!important;')
    && B.includes('.mvu-tab.active::after') && B.includes('.mvu-tab .mvu-tab-em,body .mvu-tabs:not(.mvu-sub) .mvu-tab .t-ico{ display:none!important; }'));
  T('les sous-onglets sont un filtre segmenté', B.includes('body .mvu-tabs.mvu-sub{ gap:var(--e-0,2px); padding:var(--e-0,2px);') && B.includes('body .mvu-tabs.mvu-sub .mvu-tab.active,body .mvu-tabs.mvu-sub .mvu-tab.on{ background:var(--bg-card)!important;'));
  T('le bandeau du Pilotage quitte le brun : surface, plus de halo ni de filet dégradé', B.includes('body .pil-mast{ background:var(--bg-card)!important;') && B.includes('body .pil-mast::after,body .pil-mast .pil-mast-orb{ display:none!important; }'));
  T('les petites étiquettes ne sont plus en capitales espacées', B.includes('.pil-eyebrow{ color:var(--texte-doux)!important; font-size:var(--pt-micro,12px)!important; font-weight:var(--fw-med,500)!important; letter-spacing:0!important; text-transform:none!important; }'));
  T('la barre d’onglets du Pilotage est sur la surface', B.includes('body .pil-tabsbar{ background:var(--bg-card)!important;'));
  T('sur ordinateur avec la barre, le contenu est un panneau posé sur le fond (et la barre perd son filet)',
    /@media \(min-width:1024px\)\{\s*body\.mv-avec-rail \.mv-rail\{ border-right-color:transparent; \}\s*body\.mv-avec-rail #app-content-wrap\{ margin:var\(--l-inset\) var\(--l-inset\) var\(--l-inset\) 0;[^}]*border-radius:var\(--r-md,8px\);[^}]*overflow:clip; \}/.test(B));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-tete1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-tete1.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['une couleur écrite en dur dans le bloc', 'css', 'body .pil-mast{ background:var(--bg-card)!important;', 'body .pil-mast{ background:#14110D!important;', 0],
    ['l’en-tête redevient sombre', 'css', 'body .mod-header{ background:var(--bg-card)!important;', 'body .mod-header{ background:var(--cave)!important;', 1],
    ['la bande sombre revient sous le titre', 'css', 'body .mod-header .mod-header-top,body .mvc-hdr .mvc-hdr-top{ background:var(--bg-card)!important;', 'body .mod-header .mod-header-top,body .mvc-hdr .mvc-hdr-top{ background:var(--cave)!important;', 2],
    ['l’icône reprend sa boîte', 'css', 'body .mod-header .mod-header-icon{ background:none!important;', 'body .mod-header .mod-header-icon{ background:var(--cave)!important;', 3],
    ['le titre repasse en serif', 'css', 'body .mod-header .mod-header-title{ font-family:var(--font-ui)!important;', 'body .mod-header .mod-header-title{ font-family:var(--font-titre)!important;', 4],
    ['les onglets reprennent leurs icônes', 'css', '.mvu-tab .mvu-tab-em,body .mvu-tabs:not(.mvu-sub) .mvu-tab .t-ico{ display:none!important; }', '.mvu-tab .mvu-tab-em{ opacity:1; }', 5],
    ['le halo du bandeau revient', 'css', 'body .pil-mast::after,body .pil-mast .pil-mast-orb{ display:none!important; }', '', 7],
    ['les capitales espacées reviennent', 'css', 'letter-spacing:0!important; text-transform:none!important; }\nbody .pil-mast .pil-syncdot', 'letter-spacing:.12em!important; text-transform:uppercase!important; }\nbody .pil-mast .pil-syncdot', 8],
    ['le panneau perd son arrondi', 'css', 'border-radius:var(--r-md,8px); box-shadow:var(--panneau); overflow:clip; }', 'box-shadow:var(--panneau); overflow:clip; }', 10],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-tete1.mjs'],", '', 11]
  ];
  let mord = 0;
  DEF.forEach(([nom, f, de, vers, cible]) => {
    const S = Object.assign({}, S0); if (!S[f].includes(de)) { console.log('  !! MOTIF ABSENT : ' + nom); return; }
    S[f] = S[f].replace(de, vers); if (S[f] === S0[f]) { console.log('  !! MUTATION SANS EFFET : ' + nom); return; }
    const r = jouer(S), ok = r[cible] && !r[cible][1]; console.log((ok ? '  rougit  ' : '  NE MORD PAS  ') + nom); if (ok) mord++;
  });
  console.log('\n' + (mord === DEF.length ? 'CONTRE-ÉPREUVES VERTES' : 'CONTRE-ÉPREUVES ROUGES') + ' \u2014 ' + mord + '/' + DEF.length + ' défauts réinjectés');
  if (mord !== DEF.length) process.exit(1);
}
if (ko) process.exit(1);
