// HARNAIS — KIT-2 (§227) : l'Accueil et les Parcelles sur deux colonnes, et ce que les captures de Nico (03/10) montraient.
//   node scripts/mv-harnais-kit2.mjs           → doit être vert
//   node scripts/mv-harnais-kit2.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute le VRAI _homeDragMove (src/app.js) sur une page factice en deux colonnes, puis en une seule ;
// lit le reste dans les sources (grille, chiffres alignés, tuiles, barre de saison).
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { app: L('src/app.js'), css: L('src/styles.css') };
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n}\n', i) + 3); }

function bloc(nom, left, top, log) {
  const r = { left, top, right: left + 400, bottom: top + 200, width: 400, height: 200 };
  return { nom, style: {}, getBoundingClientRect: () => r, before: () => log.push('avant ' + nom), after: () => log.push('après ' + nom) };
}
function glisse(S, blocs, cx, cy) {
  const log = [];
  const sibs = blocs.map(([n, l, t]) => bloc(n, l, t, log));
  const tire = { nom: 'X', style: {}, getBoundingClientRect: () => ({ left: cx - 200, top: cy - 100, right: cx + 200, bottom: cy + 100, width: 400, height: 200 }) };
  const ctx = { Math, document: { getElementById: () => ({ querySelectorAll: () => sibs }) } };
  vm.createContext(ctx);
  vm.runInContext('var _homeDrag=null;\n' + sansCom(fn(S.app, 'function _homeDragMove(e){')) + '\nthis.__m=_homeDragMove; this.__s=function(d){ _homeDrag=d; };', ctx);
  ctx.__s({ el: tire, x: 100, y: 100 });
  ctx.__m({ clientX: cx, clientY: cy, preventDefault() {} });
  return { log, tr: tire.style.transform };
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const DEUX = [['A', 0, 0], ['B', 450, 0], ['C', 0, 220], ['D', 450, 220]];
  let g = glisse(S, DEUX, 650, 300);
  T('deux colonnes : tiré dans la moitié haute du bloc de DROITE, il se range avant lui (D), pas avant son voisin de rangée',
    g.log.join() === 'avant D');
  g = glisse(S, DEUX, 200, 380);
  T('… dans la moitié basse d\u2019un bloc de gauche, il se range après lui (C)', g.log.join() === 'après C');
  T('… le bloc suit le doigt dans les deux sens (translate x et y)', /^translate\(|^$/.test(g.tr || '') && /translate\('\+dx\+'px,'\+dy\+'px\)/.test(S.app));
  g = glisse(S, [['A', 0, 0], ['C', 0, 220]], 200, 250);
  T('une colonne (téléphone) : la règle d\u2019avant — moitié haute de C → avant C', g.log.join() === 'avant C');
  g = glisse(S, DEUX, 425, 300);
  T('dans l\u2019allée entre deux colonnes, rien ne bouge', g.log.length === 0);
  const css = S.css;
  T('l\u2019Accueil sur deux colonnes à partir de 1 024 px, EN RANGÉES : les blocs dans #home-cols, même hauteur par rangée, un bloc seul en pleine largeur (ALIGN-2, §237)',
    /@media \(min-width:1024px\)\{[\s\S]{0,1400}#home-cols\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);column-gap:var\(--e-4,16px\);align-items:stretch;\}/.test(css) && /#home-cols > \.home-w-large,#home-cols > \.home-w-seul\{grid-column:1\/-1;\}/.test(css));   /* ALIGN-2 (§237) : en rangées */
  T('… les blocs vont dans #home-cols, l\u2019en-tête et le bloc épinglé restent hors des colonnes', /cols\.appendChild\(el\); \/\/ ré-appende dans l'ordre du layout/.test(S.app) && /page\.appendChild\(pin\);/.test(S.app) && !/#page-home\.active\{display:grid/.test(css));
  T('les Parcelles sur deux colonnes : la grille ne touche que les cartes (#pList), le reste pleine largeur',
    /#pList\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);/.test(css) && /#pList > :not\(\.mv-c\)\{grid-column:1\/-1;\}/.test(css));
  T('les chiffres alignés partout (lnum de la Cormorant, par héritage)', /\nbody\{font-variant-numeric:lining-nums;\}/.test(css));
  T('les tuiles : « 17 % » et « 11,85 »', S.app.includes("elAvt.textContent=pctGlobal+'\\u00a0%';") && S.app.includes("elSurf.textContent=surfTot>0?surfTot.toFixed(2).replace('.',','):"));
  T('la barre de la saison et le travail le plus avancé disent l\u2019état (doré, vert fini)',
    S.app.includes("const barCol=pctGlobal>=100?'var(--vert-med)':'var(--or)';") && S.app.includes("const colT=t.pct>=100?'var(--vert-med)':'var(--or)';"));
  return out;
}
let ok = 0, ko = 0;
suite(SRC0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nKIT-2 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const sub = (k, a, b) => S => Object.assign({}, S, { [k]: S[k].replace(a, b) });
const D = [
  ['le glissement ne regarde plus que la hauteur', sub('app', 'if(cx<sr.left||cx>sr.right||cy<sr.top||cy>sr.bottom) continue;', 'if(cy<sr.top||cy>sr.bottom) continue;')],
  ['l\u2019Accueil revient sur une colonne', sub('css', '#home-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));', '#home-cols{display:block;grid-template-columns:none;')],
  ['les blocs restent sous la page, hors des colonnes', sub('app', 'cols.appendChild(el); // ré-appende', 'page.appendChild(el); // ré-appende')],
  ['la liste des parcelles revient sur une colonne', sub('css', '#pList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));', '#pList{display:block;')],
  ['les chiffres elzéviriens reviennent', sub('css', '\nbody{font-variant-numeric:lining-nums;}', '\n')],
  ['la surface reprend son point', sub('app', "elSurf.textContent=surfTot>0?surfTot.toFixed(2).replace('.',','):", 'elSurf.textContent=surfTot>0?surfTot.toFixed(2):')],
  ['la barre de saison repart du pourcentage', sub('app', "const barCol=pctGlobal>=100?'var(--vert-med)':'var(--or)';", "const barCol=pctGlobal>=75?'var(--vert-med)':pctGlobal>=40?'var(--or)':'var(--orange)';")],
];
let rg = 0;
D.forEach(([n, f]) => {
  const S = f(SRC0);
  if (S.app === SRC0.app && S.css === SRC0.css) { console.log('  \u26a0 non injecté : ' + n); return; }
  let res; try { res = suite(S); } catch (e) { res = [['exc', false]]; }
  const rouge = res.some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  \u2713 rougit : ' : '  \u2717 RESTE VERT : ') + n);
});
console.log(`\n${rg}/${D.length} défauts détectés`);
process.exit(rg === D.length ? 0 : 1);
