// HARNAIS — FENETRES-1 (§533) : les fenêtres .mat-modal défilent (Cuvier, Chai).
//   node scripts/mv-harnais-fenetres1.mjs           → doit être vert
//   node scripts/mv-harnais-fenetres1.mjs --contre  → chaque défaut réinjecté doit rougir
// La coque .mat-modal (index.html, styles.css) est coupée à 92vh, en overflow:hidden. Jusqu'à FENETRES-1, aucun de ses corps
// ne défilait : sur un vrai domaine, « Noter des mesures » (40 parcelles) poussait Enregistrer hors de l'écran — mesuré dans
// Chromium à 390 × 844 avant et après (§533c). Une règle commune fait défiler le corps ; les fenêtres à pied (.mat-f-pied)
// sont en colonne, pour que la liste (.mat-f-liste) défile entre l'en-tête et le pied, qui reste visible.
// Ce harnais lit le texte (la mise en page a été prouvée au navigateur, une fois) et garde l'invariant pour les fenêtres À VENIR :
//   1. chaque fenêtre .mat-modal d'index.html a un corps « …-corps », que la règle commune couvre ;
//   2. tout corps rempli par une fonction qui écrit un .mat-f-pied est dans la règle de colonne — et elle ne nomme que des corps
//      qui existent ;
//   3. la règle de la fiche cuve (CUVFICHE-1) n'existe plus en double dans cuvier.js ;
//   4. la nouveauté le dit.
// Jamais déployé (scripts/) → aucun bump.
import fs from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const SRC = fs.readdirSync('src').filter((f) => f.endsWith('.js')).sort();
const SAIN = {
  html: fs.readFileSync('index.html', 'utf8'),
  css: fs.readFileSync('src/styles.css', 'utf8'),
  wn: fs.readFileSync('src/whats-new.js', 'utf8'),
  js: Object.fromEntries(SRC.map((f) => [f, fs.readFileSync('src/' + f, 'utf8')])),
};
const REGLE = '.mat-modal>[id$="-corps"]';

// Une fonction de premier niveau : de sa déclaration à la suivante (le code de ces modules est écrit ainsi).
function fonctionAutour(src, pos) {
  const avant = src.slice(0, pos);
  const m = [...avant.matchAll(/^(?:function\s+([\w$]+)\s*\(|window\.([\w$]+)\s*=\s*function)/gm)].pop();
  if (!m) return null;
  const debut = m.index, suite = src.slice(debut + 10).search(/^(?:function\s|window\.[\w$]+\s*=|var\s)/m);
  return { nom: m[1] || m[2], texte: src.slice(debut, suite < 0 ? src.length : debut + 10 + suite) };
}
function definition(S, nom) {
  for (const src of Object.values(S.js)) {
    const m = new RegExp('^(?:function\\s+' + nom + '\\s*\\(|window\\.' + nom + '\\s*=\\s*function)', 'm').exec(src);
    if (m) return fonctionAutour(src, m.index + m[0].length).texte;   // après le mot « function » entier : sinon on lit la précédente
  }
  return '';
}
// Le texte qui remplit un corps : chaque fonction qui le lit par son id, et les fonctions « …Html » qu'elle appelle.
function remplissage(S, id) {
  const morceaux = [], noms = [];
  for (const src of Object.values(S.js)) {
    for (const m of src.matchAll(new RegExp("getElementById\\(['\"]" + id + "['\"]\\)", 'g'))) {
      const f = fonctionAutour(src, m.index); if (!f || noms.includes(f.nom)) continue;
      noms.push(f.nom); morceaux.push(f.texte);
      for (const h of new Set([...f.texte.matchAll(/\b(_[\w$]+Html)\s*\(/g)].map((x) => x[1]))) morceaux.push(definition(S, h));
    }
  }
  return { noms, texte: morceaux.join('\n') };
}
function blocCss(css, selecteur) {
  const i = css.indexOf(selecteur + '{'); if (i < 0) return null;
  return css.slice(i + selecteur.length + 1, css.indexOf('}', i));
}

function jouer(S) {
  const L = [];
  const t = (nom, ok, detail) => L.push({ nom, ok: !!ok, detail: ok ? '' : (detail || '') });
  /* ══ 1. LES FENÊTRES ET LEURS CORPS ══ */
  const fen = [...S.html.matchAll(/<div class="overlay" id="(\w+)"[^>]*>\s*<div class="modal mat-modal"[^>]*>\s*<div class="modal-handle"><\/div>\s*<div id="([\w-]+)"/g)].map((m) => ({ ov: m[1], id: m[2] }));
  const nCoques = (S.html.match(/class="modal mat-modal"/g) || []).length;
  t('index.html : six fenêtres .mat-modal, chacune lue avec son corps', fen.length === nCoques && nCoques >= 6, fen.length + ' corps lus pour ' + nCoques + ' coques');
  const r = blocCss(S.css, REGLE);
  t('la règle commune existe : le corps remplit la fenêtre et défile', !!r && /flex:1 1 auto/.test(r) && /min-height:0/.test(r) && /overflow-y:auto/.test(r), r || 'absente');
  const hors = fen.filter((f) => !/-corps$/.test(f.id));
  t('chaque corps de fenêtre est couvert par la règle commune (id en « -corps »)', !hors.length, hors.map((f) => f.ov + ' › ' + f.id).join(', '));
  /* ══ 2. LES FENÊTRES À PIED SONT EN COLONNE ══ */
  const mc = /((?:#[\w-]+,)*#[\w-]+)\{display:flex;flex-direction:column\}/.exec(S.css.slice(S.css.indexOf(REGLE)));
  const colonne = mc ? mc[1].split(',').map((x) => x.slice(1)) : [];
  t('la règle de colonne suit la règle commune', colonne.length > 0);
  const aPied = [];
  for (const f of fen) {
    const rp = remplissage(S, f.id);
    if (/mat-f-pied/.test(rp.texte)) aPied.push(f.id);
  }
  const manque = aPied.filter((id) => !colonne.includes(id));
  t('chaque fenêtre à pied (.mat-f-pied) est en colonne : sa liste défile, son pied reste', aPied.length >= 3 && !manque.length, 'à pied : ' + aPied.join(', ') + (manque.length ? ' — hors colonne : ' + manque.join(', ') : ''));
  const fantomes = colonne.filter((id) => !fen.some((f) => f.id === id));
  t('la règle de colonne ne nomme que des corps qui existent', !fantomes.length, fantomes.join(', '));
  t('les fiches sans pied (récolte, maturité, cuve) restent hors colonne : tout leur contenu défile', ['rec-fiche-corps', 'mat-fiche-corps', 'cuv-fiche-corps'].every((id) => !colonne.includes(id) && !aPied.includes(id)));
  /* ══ 3. UNE SEULE RÈGLE ══ */
  t('la règle propre à la fiche cuve (CUVFICHE-1) n’existe plus en double dans cuvier.js', !/#cuv-fiche-corps\{/.test(S.js['cuvier.js']));
  /* ══ 4. LA NOUVEAUTÉ ══ */
  const bloc = S.wn.slice(S.wn.indexOf("{ v: '10.67'"), S.wn.indexOf("{ v: '10.66'"));
  t('la nouveauté le dit, au Journal', /niv: 0/.test(bloc) && /Enregistrer/.test(bloc) && /défil/.test(bloc));
  return L;
}

const css = (a, b) => (S) => ({ ...S, css: S.css.replace(a, b) });
const js = (f, a, b) => (S) => ({ ...S, js: { ...S.js, [f]: S.js[f].replace(a, b) } });
const DEFAUTS = [
  ['la liste ne peut plus rétrécir (min-height:0 retiré)', css('.mat-modal>[id$="-corps"]{flex:1 1 auto;min-height:0;', '.mat-modal>[id$="-corps"]{flex:1 1 auto;')],
  ['le corps ne défile plus', css('min-height:0;overflow-y:auto;overscroll-behavior:contain}', 'min-height:0;overscroll-behavior:contain}')],
  ['la saisie en série sort de la colonne', css('#mat-saisie-corps,#mat-coul-corps,#creg-ed-corps{', '#mat-coul-corps,#creg-ed-corps{')],
  ['un corps renommé échappe à la règle', (S) => ({ ...S, html: S.html.replace('<div id="mat-coul-corps">', '<div id="mat-coul-zone">') })],
  ['une fiche gagne un pied sans passer en colonne', js('cuvier.js', 'var h = \'<div class="mat-fi-hd"><div class="mat-fi-cel">', 'var h = \'<div class="mat-f-pied"></div><div class="mat-fi-hd"><div class="mat-fi-cel">')],
  ['la règle de la fiche cuve revient en double', js('cuvier.js', "  s.textContent=`\n", "  s.textContent=`\n#cuv-fiche-corps{overflow-y:auto}\n")],
  ['la nouveauté manque', (S) => ({ ...S, wn: S.wn.replace("{ v: '10.67'", "{ v: '10.67x'") })],
];

const c = { v: (s) => '\x1b[32m' + s + '\x1b[0m', r: (s) => '\x1b[31m' + s + '\x1b[0m', d: (s) => '\x1b[2m' + s + '\x1b[0m' };
if (!CONTRE) {
  const L = jouer(SAIN);
  console.log('\nFENETRES-1 — les fenêtres .mat-modal défilent');
  for (const x of L) console.log('  ' + (x.ok ? c.v('✓') : c.r('✗')) + ' ' + x.nom + (x.ok ? '' : c.d('  → ' + x.detail)));
  const ko = L.filter((x) => !x.ok).length;
  console.log('\n  ' + (L.length - ko) + ' verts · ' + ko + ' rouge(s)\n');
  process.exit(ko ? 1 : 0);
} else {
  const base = jouer(SAIN).filter((x) => !x.ok);
  if (base.length) { console.log(c.r('  le code sain n’est pas vert : ' + base.map((x) => x.nom).join(' · '))); process.exit(1); }
  let rate = 0;
  console.log('\nFENETRES-1 — contre-épreuve');
  for (const [nom, casse] of DEFAUTS) {
    const S = casse(SAIN);
    const inchange = S.html === SAIN.html && S.css === SAIN.css && S.wn === SAIN.wn && Object.keys(S.js).every((f) => S.js[f] === SAIN.js[f]);
    const rouges = inchange ? 0 : jouer(S).filter((x) => !x.ok).length;
    if (inchange) { rate++; console.log('    ' + c.r('INJECTION RATÉE') + '  ' + nom + c.d('  (le texte visé a changé : mettre la contre-épreuve à jour)')); }
    else if (!rouges) { rate++; console.log('    ' + c.r('NON DÉTECTÉ') + '  ' + nom); }
    else console.log('    DÉTECTÉ  ' + nom + c.d(' (' + rouges + ' rouge' + (rouges > 1 ? 's' : '') + ')'));
  }
  console.log('\n  ' + (DEFAUTS.length - rate) + '/' + DEFAUTS.length + ' défauts détectés\n');
  process.exit(rate ? 1 : 0);
}
