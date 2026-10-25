/* ───────────────────────────────────────────────────────
   HARNAIS — GABARIT-2 (§456) : LES BARRES DES GRAPHIQUES À LA MESURE DE LA CHARTE ; LE GABARIT MESURÉ SUR LE BUILD
   Lancer :          node scripts/mv-harnais-gabarit2.mjs
   Contre-épreuves : node scripts/mv-harnais-gabarit2.mjs --contre

   POURQUOI IL EXISTE
   Les barres des graphiques du Pilotage étaient dessinées à la main, chacune à sa mesure (15, 16, 17 px, le réel à 11,
   des arrondis de 1,5 à 5). Un attribut SVG ne lit pas var() : la mesure commune vit dans `_PIL_GB` (pilotage.js), qui
   recopie la charte. Ce harnais garde ce qui ne se voit pas à l'écran : `_PIL_GB` colle à la charte, les trois graphiques
   à barres la lisent, plus aucun arrondi « à part », plus aucune police Cormorant dans le module, et le contrôle au rendu
   (scripts/mv-gabarit-rendu.mjs) est bien joué par npm et par la CI — UN CLIQUET ÉCRIT N'EST PAS UN CLIQUET BRANCHÉ.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), charte: lire('src/charte.css'), pkg: lire('package.json'), ci: lire('.github/workflows/ci.yml'), rendu: lire('scripts/mv-gabarit-rendu.mjs'), liste: lire('scripts/mv-harnais-liste.mjs') };
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
const corps = (s, f) => { const i = s.indexOf('function ' + f + '('); if (i < 0) return ''; const j = s.indexOf('\n}\n', i); return s.slice(i, j > 0 ? j : i + 20000); };
const px = (ch, j) => { const m = ch.match(new RegExp(j.replace(/-/g, '\\-') + '\\s*:\\s*(\\d+(?:\\.\\d+)?)px')); return m ? +m[1] : NaN; };
function jouer(S) {
  const m = S.pil.match(/var _PIL_GB = \{ h:(\d+), h2:(\d+), r:(\d+), rv:(\d+) \};/);
  t('① `_PIL_GB` existe dans pilotage.js', !!m);
  const gb = m ? { h: +m[1], h2: +m[2], r: +m[3], rv: +m[4] } : {};
  t('① et colle à la charte : h = --barre-graph-h, h2 = --jauge-h, r = --r-xs', m && gb.h === px(S.charte, '--barre-graph-h') && gb.h2 === px(S.charte, '--jauge-h') && gb.r === px(S.charte, '--r-xs'),
    JSON.stringify(gb) + ' contre ' + [px(S.charte, '--barre-graph-h'), px(S.charte, '--jauge-h'), px(S.charte, '--r-xs')].join('/'));
  const fr = corps(S.pil, '_pilFriseSvg'), ta = corps(S.pil, '_pecTaskSvg'), ec = corps(S.pil, '_pecEcartSvg');
  t('② la frise prévu / réel lit la mesure commune (prévu h, réel h2)', /hP=_PIL_GB\.h,/.test(fr) && /hR=_PIL_GB\.h2;/.test(fr));
  t('② « Postes & travaux » aussi, dans ses deux dispositions', /bh=_PIL_GB\.h;/.test(ta) && /bh2=_PIL_GB\.h;/.test(ta));
  t('② « Parcelles » (écart) aussi', /bh=_PIL_GB\.h;/.test(ec));
  const fns = ['_pilFriseSvg', '_pecTaskSvg', '_pecEcartSvg', '_rfCalSvg', '_pilAnRenfortSvg', '_pilAnBudgetSvg', '_pilDemandSvg', '_pexGraph'];
  const apart = fns.filter((f) => /rx="(1\.5|3|5)"/.test(corps(S.pil, f)));
  t('③ plus aucun arrondi de barre « à part » (1,5 · 3 · 5) dans les ' + fns.length + ' graphiques', fns.every((f) => corps(S.pil, f).length > 0) && apart.length === 0, apart.join(', '));
  t('④ plus aucune police Cormorant écrite dans pilotage.js', !/--font-titre/.test(S.pil));
  let pkg = {}; try { pkg = JSON.parse(S.pkg); } catch (e) { pkg = {}; }
  t('⑤ npm run test:gabarit joue le contrôle au rendu', (pkg.scripts || {})['test:gabarit'] === 'node scripts/mv-gabarit-rendu.mjs');
  const iT = S.ci.indexOf('run: npm run test:tutos'), iG = S.ci.indexOf('run: npm run test:gabarit');
  t('⑤ la CI le joue sur le build, après les tutos', iT > 0 && iG > iT);
  t('⑥ le contrôle au rendu a sa contre-épreuve (cinq défauts posés à l’écran)', /const CONTRE = process\.argv\.includes\('--contre'\)/.test(S.rendu) && /const DEFAUTS = /.test(S.rendu) && /attendus = \[/.test(S.rendu));
  t('⑦ la liste des harnais joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-gabarit2.mjs'") > 0 && S.liste.indexOf("mv-harnais-gabarit2.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const mutants = [
    ['la mesure commune ne colle plus à la charte', (S) => Object.assign({}, S, { pil: S.pil.replace('var _PIL_GB = { h:16,', 'var _PIL_GB = { h:17,') })],
    ['la charte change sans la mesure commune', (S) => Object.assign({}, S, { charte: S.charte.replace(/--barre-graph-h:16px/, '--barre-graph-h:18px') })],
    ['la frise reprend un réel à 11 px', (S) => Object.assign({}, S, { pil: S.pil.replace('hR=_PIL_GB.h2;', 'hR=11;') })],
    ['« Postes & travaux » reprend 17 px', (S) => Object.assign({}, S, { pil: S.pil.replace('var by2=y+5, bh2=_PIL_GB.h;', 'var by2=y+5, bh2=17;') })],
    ['« Parcelles » reprend 15 px', (S) => Object.assign({}, S, { pil: S.pil.replace('bh=_PIL_GB.h;\n', 'bh=et?16:15;\n').replace(/(function _pecEcartSvg[\s\S]*?)bh=_PIL_GB\.h;/, '$1bh=et?16:15;') })],
    ['un graphique reprend un arrondi à 1,5', (S) => Object.assign({}, S, { pil: S.pil.replace(/(function _rfCalSvg[\s\S]*?)rx="'\+_PIL_GB\.rv\+'"/, '$1rx="1.5"') })],
    ['une police Cormorant revient', (S) => Object.assign({}, S, { pil: S.pil + "\n  +'.pec-ct{font-family:var(--font-titre,serif)}'\n" })],
    ['npm ne joue plus le contrôle au rendu', (S) => Object.assign({}, S, { pkg: S.pkg.replace('"test:gabarit"', '"test:gabarit-off"') })],
    ['la CI ne le joue plus', (S) => Object.assign({}, S, { ci: S.ci.replace('run: npm run test:gabarit', 'run: echo rien') })],
    ['le contrôle au rendu perd sa contre-épreuve', (S) => Object.assign({}, S, { rendu: S.rendu.replace('const DEFAUTS = ', 'const SANS = ') })],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-gabarit2.mjs'").join("mv-harnais-gabaritY.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    const S = mut(S0); ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
