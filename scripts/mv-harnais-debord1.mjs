#!/usr/bin/env node
/* ───────────────────────────────────────────────────────
   HARNAIS — DEBORD-1 (§593) : PLUS RIEN NE DÉBORDE
   Lancer :          node scripts/mv-harnais-debord1.mjs
   Contre-épreuves : node scripts/mv-harnais-debord1.mjs --contre

   POURQUOI IL EXISTE
   Nico (18/11) : « la bulle rouge de 2 cuves demandent… qui déborde, il ne faut plus voir ce genre de problème ». La règle
   qui REGARDE l'écran est scripts/mv-debord-rendu.mjs (npm run test:debord, sept largeurs, un job de la CI) : elle a trouvé
   les vingt défauts du §593a. Ce harnais tient, sur le texte, chacune des vingt corrections — une règle d'écran dit qu'un
   défaut existe, celui-ci dit lequel est revenu — et le branchement de la règle (le script, sa contre-épreuve, npm, la CI).
   ⚠️ Il ne remplace pas la règle : une boîte peut déborder pour une raison neuve. Le rendu a été REGARDÉ, à 360, 390, 412,
   768, 1 024, 1 280, 1 366 et 1 440 px.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { auj: lire('src/aujourdhui.css'), an: lire('src/annee.css'), css: lire('src/styles.css'), cave: lire('src/cave.js'), cuv: lire('src/cuvier.js'), pa: lire('src/planning-annee.js'), vu: lire('src/planning-annee-vue.js'),
  pil: lire('src/pilotage.js'), reg: lire('src/reglages.js'), idx: lire('index.html'), regle: lire('scripts/mv-debord-rendu.mjs'), pkg: lire('package.json'),
  ci: lire('.github/workflows/ci.yml'), uti: lire('src/utils.js'), wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), liste: lire('scripts/mv-harnais-liste.mjs') };

// [ce qui est tenu, fichier, le texte qui le porte (une fois), ce qui ne doit plus y être]
const TENU = [
  ['① la bulle rouge du Pilotage : la couleur seule, le fond reste dans le dessin (background-clip n’est plus remis à border-box)', 'auj',
    '.ck2 .ck-res-pl .ck-res-pts.alerte{background-color:var(--danger-doux)}', /\.ck-res-pts\.[a-z-]+\{background:/],
  ['② la bande de la Cave au téléphone : le mot sous le chiffre', 'css',
    '@media (max-width:599px){ #page-cave #cave-kpis .mvu-kpi{ flex-direction:column; align-items:flex-start; gap:0; min-width:0;', null],
  ['③ le tableau des cuves et des cuvées suit la largeur de sa carte (requête de conteneur, 640 px)', 'css',
    '#page-cave .caj-c{ container-type:inline-size; }\n@container (min-width:640px){\n  #page-cave .caj-cv{ grid-template-columns:minmax(0,1.6fr) minmax(min-content,1.15fr)', /@media \(min-width:1024px\)\{\n  #page-cave \.caj-cv\{/],
  ['③ … la semaine aussi (sept jours et leur résumé, dans la carte)', 'css',
    '@container (min-width:640px){\n  #page-cave .caj-grille{ grid-template-columns:repeat(7,minmax(0,1fr)) calc(var(--e-10,64px) * 2.75);', /@media \(min-width:1024px\)\{[^}]*\n  #page-cave \.caj-grille\{ grid-template-columns:repeat\(7/],
  ['③ … le nom d’une cuve à gauche (plus centré par align-self:center)', 'css', '#page-cave .caj-cvn .caj-nom{ align-self:flex-start; }', null],
  ['④ la tournée : « Terminer » et « Intervention groupée » rétrécissent et passent à la ligne', 'cuv',
    '".vt-fab{flex:0 1 auto;min-width:0;max-width:42%;min-height:var(--e-9,48px)}",', /"\.vt-fab\{flex:none;/],
  ['④ … leur texte va à la ligne', 'cuv', '".vt-bot .mvbtn{min-width:0;white-space:normal;line-height:1.2}",', null],
  ['⑤ le Millésime au téléphone : le nom a sa ligne, la pastille ne passe plus dessus', 'cave',
    "+'@media (max-width:599px){.mlg-cl{flex-wrap:wrap;row-gap:var(--e-2,8px)}.mlg-cl .mlg-cn{flex-basis:100%}.mlg-cl .mlg-cf{margin-left:auto}}'", null],
  ['⑥ les courbes : les trois colonnes de contexte suivent la largeur de la carte', 'cave',
    "+'.pcrb-b{container-type:inline-size}@container (max-width:640px){.pcrb-tb .o{display:none}}'", null],
  ['⑥ … un écart à gauche des chiffres, « Fin de FA » passe à la ligne', 'cave', "+'.pcrb-tb th.n,.pcrb-tb td.n{padding-left:var(--e-3,12px)}.pcrb-tb td:nth-child(2){white-space:normal}'", null],
  // ANNEE-2 (§613) : la vue de l'année est refaite — la semaine et son rythme vivent dans un panneau de 400 px (une colonne), les mois
  //   au téléphone sont des initiales (une par mois). Les vérités ⑦ suivent.
  // ANNEE-3 (§614) : plus de « − / + » — la semaine type est une grille de sept cases, un jour de la semaine une rangée ; la vue
  //   vit dans planning-annee-vue.js.
  ['⑦ le Planning de l’année : dans le panneau, un jour garde sa ligne (son nom ne passe jamais à la ligne)', 'an',
    '.anv-ov .anv-jr-n{ flex:none; min-width:6.5em; font-weight:var(--fw-med,500); white-space:nowrap; }', /minmax\(230px,1fr\)/],
  ['⑦ … la semaine type : sept cases qui suivent la largeur du panneau', 'an', '.anv-ov .anv-gr{ display:grid; grid-template-columns:0 repeat(7,minmax(0,1fr)) 3.6em;', /minmax\(210px,1fr\)/],
  ['⑦ … au téléphone, une initiale par mois (le nom entier dès 1 024 px ; src/annee.css)', 'an', '#page-planning .anv-mo-l{ display:none; }', null],
  ['⑦ … chaque mois porte son nom et son initiale', 'vu', "<span class=\"anv-mo-l\">'+window.PLAN_MOIS_FR[m]+'</span><span class=\"anv-mo-c\">'", null],
  ['⑧ Décider : le nom s’abrège, « J3→J4 » reste entier', 'pil', '<div class="nm"><span class="nmt">', null],
  ['⑧ … la feuille', 'css', '.pil-dz-row .nm .nmt{min-width:0;overflow:hidden;text-overflow:ellipsis;}', /\.pil-dz-row \.nm\{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;/],
  ['⑧ … la carte du trajet n’a plus qu’un « Agrandir » (celui des graphes ne cache plus le trajet)', 'pil', "window._mvGraphSuivre('#pil-g-opmap', function(lg){ return _opMapSvg(rows,lg); }, { agrandir:false });", null],
  ['⑨ les Réglages : un segment étroit finit en « … », son nom entier en bulle', 'idx',
    '.cmp-seg b{font-size:var(--pt-lbl,10.5px);font-weight:700;color:#fff;padding:0 7px;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.3);min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis}', null],
  ['⑨ … le title', 'reg', "segs+='<div class=\"cmp-seg'+(chev?' ovl':'')+'\" title=\"'+_escHtml(s.nom)+'\"", null],
  ['⑩ l’Entretien du Tracteur : deux colonnes à partir de 1 600 px seulement (la fiche garde 360 px à droite)', 'css',
    '@media (min-width:1600px){\n  #page-tracteur #trac-panel-entretiens{ display:grid;', /@media \(min-width:1024px\)\{\n  #page-tracteur #trac-panel-entretiens\{ display:grid;/],
  ['⑩ … les cartes sans en-tête ont leur marge', 'css', '#page-tracteur .ent-resume-card:not(:has(> .ent-resume-hd)){ padding:var(--e-3,12px) var(--e-4,16px); }', null],
  ['⑪ les Stades : les onze étapes passent à la ligne', 'css', '.phr-ech-pc{display:flex;flex-wrap:wrap;gap:2px;}', null],
  ['⑪ le Journal : le badge et « Équipe » vont à la ligne', 'css', '#page-journal .jitem .jcard-inner .mv-hd{flex-wrap:wrap;row-gap:var(--e-1,4px);}', null],
  ['⑪ l’Accueil : la pastille de la campagne rétrécit', 'css', '#page-home .hk-chip{ margin-left:auto; flex-shrink:1; min-width:0; max-width:100%; white-space:normal; }', null],
  ['⑪ la fiche d’une cuvée a sa marge au téléphone', 'css', '@media (max-width:1023px){ #ml-fiche{ padding:var(--e-3,12px) var(--e-4,16px); } }', null],
  ['⑪ les fûts d’une cuvée : le caractère « · », plus l’entité échappée', 'cave', "}).join(' \\u00b7 ');   // DEBORD-1 (§593)", /\}\)\.join\(' &middot; '\);\n\}\n\nfunction _renderCuvTonneaux/],
  ['⑫ la règle : six sortes de débordement, la contre-épreuve qui en pose une de chaque', 'regle', "['texte collé au bord', '<div style=\"border:1px solid #ccc;padding:0;width:240px;min-height:48px;background:#fff\">", null],
  ['⑫ … les écrans lus dans mv-mots-rendu.mjs, sept largeurs, deux cuves en alerte', 'regle', "(opt('--largeurs') || '360,390,412,768,1024,1280,1366')", null],
  ['⑫ … l’état posé', 'regle', "lm.temp_c=31; n++;", null],
  // MOTS-10 (§594) : la CI a rougi sur « 0 € » d'un tableau qui défile de côté (Économie › Le détail, 390 px, 2 px du bord).
  ['⑫ … un texte dans un tableau qui défile de côté n’est pas « collé au bord » (le bord est celui du défilement)', 'regle', "if (/(auto|scroll)/.test(ca.overflowX) && a.scrollWidth > a.clientWidth + 1) { sc6 = true; break; } }", null],
  ['⑫ … npm run test:debord', 'pkg', '"test:debord": "node scripts/mv-debord-rendu.mjs",', null],
  ['⑫ … un job de la CI', 'ci', '        run: npm run test:debord', null],
  ['⑬ l’annonce 11.21 et le service worker qui dit le lot', 'wn', "{ v: '11.21', d: '2026-11-18', items: [   // DEBORD-1 (§593)", null],
  ['⑬ … le service worker', 'sw', '// v12.12 (18/11/2026) — DEBORD-1 (§593)', null],
  ['⑬ … la liste joue ce fichier et sa contre-épreuve', 'liste', "['node scripts/mv-harnais-debord1.mjs --contre']", null],
];
function jouer(S) {
  const out = [];
  for (const [nom, f, aiguille, interdit] of TENU) {
    const n = S[f].split(aiguille).length - 1;
    out.push([nom, n === 1 && (!interdit || !interdit.test(S[f])), n !== 1 ? (n + ' occurrence(s) de : ' + aiguille.slice(0, 70)) : 'l’ancien texte est encore là']);
  }
  const app = (S.uti.match(/APP_VERSION = '([\d.]+)'/) || [])[1] || '0';
  out.push(['⑬ les versions : APP 11.21 au moins, et l’affichage', Number(app) >= 11.21 && S.idx.includes('Ma Vigne v' + app) && S.idx.includes('/boot.js?v=' + app), app]);
  return out;
}
let ok = 0, ko = 0;
if (!CONTRE) {
  for (const [nom, c, det] of jouer(S0)) { if (c) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + '\n      → ' + det); } }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + '/' + (ok + ko));
  process.exit(ko ? 1 : 0);
}
if (jouer(S0).some(([, c]) => !c)) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien'); process.exit(1); }
// Chaque correction défaite, une à une : remettre l'ancien texte (quand il est connu) ou retirer le nouveau.
const ANCIEN = {
  'auj': [".ck2 .ck-res-pl .ck-res-pts.alerte{background-color:var(--danger-doux)}", ".ck2 .ck-res-pl .ck-res-pts.alerte{background:var(--danger-doux)}"],
};
let bons = 0;
TENU.forEach(([nom, f, aiguille]) => {
  const S = Object.assign({}, S0); S[f] = S[f].split(aiguille).join(f === 'auj' && aiguille === ANCIEN.auj[0] ? ANCIEN.auj[1] : '');
  const rouges = jouer(S).filter(([, c]) => !c).length;
  if (rouges) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
});
// Et deux retours en arrière nommés : l'ancien texte revient À CÔTÉ du nouveau.
const RETOURS = [
  ['la bulle reprend le raccourci « background: » dans une autre variante', 'auj', (s) => s + '\n.ck2 .ck-res-pl .ck-res-pts.ok{background:var(--ok-doux)}\n'],
  ['l’Entretien repasse en deux colonnes dès 1 024 px', 'css', (s) => s + '\n@media (min-width:1024px){\n  #page-tracteur #trac-panel-entretiens{ display:grid; }\n}\n'],
];
RETOURS.forEach(([nom, f, fn]) => { const S = Object.assign({}, S0); S[f] = fn(S[f]); const rouges = jouer(S).filter(([, c]) => !c).length;
  if (rouges) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom); });
const total = TENU.length + RETOURS.length;
console.log('\n' + (bons === total ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + total + ' contre-épreuves rougissent');
process.exit(bons === total ? 0 : 1);
