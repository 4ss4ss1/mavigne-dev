// HARNAIS — LARG-1 (§334) : sur ordinateur, UNE seule largeur. Chaque page de index.html est bornée par LA règle de
// styles.css (1 200 px, centrée, au-delà de 1 200 px de fenêtre) — ou exemptée ICI, avec sa raison.
//   node scripts/mv-harnais-larg1.mjs           → doit être vert
//   node scripts/mv-harnais-larg1.mjs --contre  → chaque défaut réinjecté doit rougir
// Pourquoi : KIT-1 (§226) avait posé la règle sur trois pages en laissant « les autres modules aux lots 3b/3c ». Personne
// ne l'a fait, et rien ne le voyait : sur un grand écran, l'appli changeait de largeur d'un module à l'autre. Une page
// ajoutée demain doit choisir : la règle, ou une raison ci-dessous.
// Ce qu'il ne voit pas : une mise en page. Le rendu a été MESURÉ dans la vraie appli (Chromium, 1 280 / 1 536 / 1 920 px) — §334.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/charte.css') + '\n' + L('src/styles.css'), idx: L('index.html'), liste: L('scripts/mv-harnais-liste.mjs') };
fs.readdirSync(path.join(R, 'src')).filter(f => f.endsWith('.js')).sort().forEach(f => { S0['js:' + f] = L('src/' + f); });

// Les pages HORS de la règle, chacune avec sa raison. En retirer une = l'ajouter à la règle, dans le même lot.
// (Le Planning y a été jusqu'à sa maquette : Nico a choisi « A », borné comme les autres — LARG-1, §334.)
const EXEMPTES = {
  chat: 'page sans appelant (app.js : « #page-chat n’a AUCUN appelant »), hors périmètre client, comme dans C22',
};
const VIGNE_ET_MODULES = ['home', 'parcelles', 'journal', 'pilotage', 'tracteur', 'phyto', 'cave', 'reserve', 'planning', 'reglages'];
const RE_REGLE = /@media \(min-width:1200px\)\{ ((?:#page-[a-z0-9-]+,)*#page-[a-z0-9-]+)\{max-width:var\(--page-max,1200px\);margin-left:auto;margin-right:auto;\} \}/g;
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
// Le bloc @media qui CONTIENT `ancre`, par comptage d'accolades ('' si l'ancre est hors de tout bloc).
function blocMedia(css, ancre) {
  const i = css.indexOf(ancre); if (i < 0) return '';
  const m = css.lastIndexOf('@media', i); if (m < 0) return '';
  let p = 0;
  for (let j = css.indexOf('{', m); j >= 0 && j < css.length; j++) {
    if (css[j] === '{') p++;
    else if (css[j] === '}' && --p === 0) return j > i ? css.slice(m, j + 1) : '';
  }
  return '';
}
// Un sélecteur qui vise la page ELLE-MÊME (#page-x, #page-x.active, body #page-x…), pas un de ses descendants.
const visePage = sel => sel.split(',').map(x => x.trim())
  .filter(x => /(?:^|[\s>+~])#page-[a-z0-9-]+(?:\.[\w-]+|:[\w-]+(?:\([^)]*\))?)*$/.test(x));

function jouer(S) {
  const r = {}; const T = (k, n, c) => { r[k] = [n, !!c]; };
  const css = sansCom(S.css);
  const pages = [...S.idx.matchAll(/<div class="page" id="page-([a-z0-9-]+)"/g)].map(m => m[1]);
  T('pages', `index.html déclare ses pages (${pages.length} lues, dix au moins)`, pages.length >= 10);
  const regles = [...css.matchAll(RE_REGLE)];
  T('une', `une seule règle de largeur pour les pages (${regles.length} lue(s))`, regles.length === 1);
  const bornees = regles.length === 1 ? regles[0][1].split(',').map(s => s.slice('#page-'.length)) : [];
  T('jeton', 'le jeton --page-max vaut 1 200 px (la largeur du Pilotage depuis KIT-1)', /:root\{--page-max:1200px;\}/.test(css));
  const libres = pages.filter(p => !bornees.includes(p) && !Object.prototype.hasOwnProperty.call(EXEMPTES, p));
  T('libres', `chaque page est bornée, ou exemptée avec sa raison (libres : ${libres.join(', ') || 'aucune'})`, libres.length === 0);
  const deux = Object.keys(EXEMPTES).filter(p => bornees.includes(p));
  T('deux', `aucune page exemptée n’est aussi dans la règle (${deux.join(', ') || 'aucune'})`, deux.length === 0);
  const fantomes = bornees.filter(p => !pages.includes(p));
  T('fantomes', `la règle ne vise que des pages qui existent (${fantomes.join(', ') || 'toutes existent'})`, fantomes.length === 0);
  T('vigne', 'la Vigne entière (Accueil, Parcelles, Journal) et chaque module du dock sont dans la règle',
    VIGNE_ET_MODULES.every(p => bornees.includes(p)));
  // Personne ne la défait plus loin : une largeur ou une marge latérale posée sur une page ELLE-MÊME (une marge à 0 la
  // recollerait à gauche), dans la feuille, un module ou index.html. Mesuré le 14/10 : LA règle est la seule à en poser.
  const LARG = /(?:^|[;\s])(?:max-width|width|margin(?:-left|-right|-inline)?)\s*:/;
  const defaites = [];
  for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    if (!LARG.test(m[2])) continue;
    const v = visePage(m[1]); if (!v.length) continue;
    if (regles.length === 1 && m[0].includes(regles[0][1] + '{')) continue;
    defaites.push('styles.css : ' + v.join(','));
  }
  for (const k of Object.keys(S).filter(x => x.startsWith('js:'))) {
    for (const m of S[k].matchAll(/#page-([a-z0-9-]+)(?:\.[\w-]+|:[\w-]+)*\s*\{[^}'"]{0,400}(?:width|margin)/g)) defaites.push(k.slice(3) + ' : #page-' + m[1]);
    for (const m of S[k].matchAll(/getElementById\(\s*['"]page-([a-z0-9-]+)['"]\s*\)\.style\.maxWidth/g)) defaites.push(k.slice(3) + ' : style.maxWidth de page-' + m[1]);
  }
  for (const m of S.idx.matchAll(/<div class="page" id="page-([a-z0-9-]+)"[^>]*style="[^"]*(?:width|margin)/g)) defaites.push('index.html : page-' + m[1]);
  T('defait', `personne ne redonne une autre largeur ni une autre marge à une page (${defaites.join(' · ') || 'personne'})`, defaites.length === 0);
  // Les onglets de la Réserve : dans le MÊME bloc ≥ 1 024 px que son corps (RSV-1), sinon tablette et ordinateur divergent.
  const bR = blocMedia(css, '#page-reserve .mvr-tabs{ max-width:none; }');
  T('reserve', 'les onglets de la Réserve partent du bord, dans le bloc ≥ 1 024 px de son corps (RSV-1)',
    /^@media \(min-width:1024px\)\{/.test(bR) && bR.includes('#page-reserve .mvr-body{ max-width:none; }'));
  T('liste', 'le harnais et sa contre-épreuve sont dans la liste du lanceur',
    S.liste.includes("['node scripts/mv-harnais-larg1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-larg1.mjs --contre'],"));
  return r;
}

const r0 = jouer(S0); let ko = 0;
for (const [n, c] of Object.values(r0)) { console.log((c ? '  \u2713 ' : '  \u2717 ') + n); if (!c) ko++; }
console.log(`\nLARG-1 : ${Object.keys(r0).length - ko} vertes, ${ko} rouge(s)`);
let contreKO = false;
if (CONTRE) {
  if (ko) { console.log('  contre-épreuves non jouées : le harnais est rouge sur le code livré'); process.exit(1); }
  const ligneRegle = (S0.css.match(/@media \(min-width:1200px\)\{ #page-home,[^\n]*/) || [''])[0];
  const TABS = '  #page-reserve .mvr-tabs{ max-width:none; }\n';
  const DEF = [
    ['le Tracteur sort de la règle', 'css', '#page-pilotage,#page-tracteur,', '#page-pilotage,', 'libres'],
    ['une page neuve arrive sans largeur', 'idx', '<div class="page" id="page-reserve"></div>',
      '<div class="page" id="page-reserve"></div>\n<div class="page" id="page-nouveau"></div>', 'libres'],
    ['le Planning ressort de la règle', 'css', '#page-reserve,#page-planning,', '#page-reserve,', 'libres'],
    ['une page exemptée entre aussi dans la règle', 'css', '#page-planning,#page-reglages{', '#page-planning,#page-reglages,#page-chat{', 'deux'],
    ['la règle vise une page qui n’existe plus', 'css', '#page-planning,#page-reglages{', '#page-planning,#page-reglages,#page-ancienne{', 'fantomes'],
    ['la règle est mise en commentaire', 'css', ligneRegle, '/* ' + ligneRegle + ' */', 'une'],
    ['la Vigne perd son Journal', 'css', '#page-parcelles,#page-journal,', '#page-parcelles,', 'vigne'],
    ['une règle plus loin défait une page', 'css', '/* ★ FIN RSV-1 */', '#page-cave{max-width:none;}\n/* ★ FIN RSV-1 */', 'defait'],
    ['une règle plus loin recolle le Planning à gauche', 'css', '/* ★ FIN RSV-1 */', '#page-planning{margin-left:0;}\n/* ★ FIN RSV-1 */', 'defait'],
    ['un module injecte une largeur sur sa page', 'js:cave.js', 'const DEBUG', 'const DEBUG', 'defait', s => s + "\nvar __mvLarg='#page-cave{max-width:none}';\n"],
    ['une page reçoit une largeur en ligne', 'idx', '<div class="page" id="page-reserve"></div>', '<div class="page" id="page-reserve" style="max-width:100%"></div>', 'defait'],
    ['les onglets de la Réserve reviennent à 760 px', 'css', TABS, '', 'reserve'],
    ['les onglets de la Réserve sortent du bloc ≥ 1 024 px', 'css', TABS, '', 'reserve', s => s + '\n' + TABS],
    ['le jeton change', 'css', ':root{--page-max:1200px;}', ':root{--page-max:1280px;}', 'jeton'],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-larg1.mjs'],", '', 'liste'],
  ];
  let mord = 0;
  DEF.forEach(([nom, f, de, vers, cible, apres]) => {
    const S = Object.assign({}, S0);
    if (!de || !S[f] || !S[f].includes(de)) { console.log('  !! MOTIF ABSENT : ' + nom); return; }
    S[f] = S[f].replace(de, vers); if (apres) S[f] = apres(S[f]);
    if (S[f] === S0[f]) { console.log('  !! MUTATION SANS EFFET : ' + nom); return; }
    let r; try { r = jouer(S); } catch (e) { r = null; }
    const ok = !r || (r[cible] && !r[cible][1]);
    console.log((ok ? '  rougit  ' : '  NE MORD PAS  ') + nom); if (ok) mord++;
  });
  console.log('\n' + (mord === DEF.length ? 'CONTRE-ÉPREUVES VERTES' : 'CONTRE-ÉPREUVES ROUGES') + ' \u2014 ' + mord + '/' + DEF.length + ' défauts réinjectés');
  contreKO = mord !== DEF.length;
}
process.exit(ko || contreKO ? 1 : 0);
