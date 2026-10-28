/* ───────────────────────────────────────────────────────
   HARNAIS — WN-COUPE-1 (§469) : LE JOURNAL WHATS_NEW VIT DANS src/whats-new.js, utils.js NE FAIT QUE LE RÉEXPORTER
   Lancer :          node scripts/mv-harnais-wncoupe1.mjs
   Contre-épreuves : node scripts/mv-harnais-wncoupe1.mjs --contre

   POURQUOI IL EXISTE
   src/utils.js touchait le plafond de 1024 ko (mv-harnais-typo) : plus aucune annonce n’y tenait. Le journal est sorti dans
   son propre fichier. Ce harnais garde la coupe : le tableau n’existe qu’une fois, dans whats-new.js ; utils.js l’importe et le
   réexporte (le code de l’appli ne voit rien) ; utils.js garde de la marge sous le plafond ; et les contrôles qui lisent
   WHATS_NEW lisent bien les deux fichiers (sinon ils chercheraient le journal là où il n’est plus).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { utils: lire('src/utils.js'), wn: lire('src/whats-new.js'), check: lire('scripts/mv-whatsnew-check.mjs'), pre: lire('scripts/preflight.mjs'), liste: lire('scripts/mv-harnais-liste.mjs') };
const PLAFOND = 1024 * 1024, MARGE = 64 * 1024;
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function jouer(S) {
  t('① le tableau WHATS_NEW est déclaré dans src/whats-new.js, une fois', (S.wn.match(/^export const WHATS_NEW = \[/gm) || []).length === 1);
  t('② utils.js ne le déclare plus : il l’importe et le réexporte', !/export const WHATS_NEW = \[/.test(S.utils) && S.utils.includes("import { WHATS_NEW } from './whats-new.js';") && S.utils.includes('export { WHATS_NEW };'));
  t('③ utils.js garde au moins 64 ko de marge sous le plafond de 1024 ko', Buffer.byteLength(S.utils, 'utf8') <= PLAFOND - MARGE);
  t('④ le premier bloc du journal porte l’APP_VERSION d’utils.js', (() => { const a = S.utils.match(/export const APP_VERSION = '([\d.]+)'/), b = S.wn.match(/export const WHATS_NEW = \[\s*\{ v: '([\d.]+)'/); return !!a && !!b && a[1] === b[1]; })());
  t('⑤ les contrôles du journal lisent les deux fichiers (mv-whatsnew-check, preflight)', S.check.includes("'src', 'whats-new.js'") && S.pre.includes('src/whats-new.js'));
  t('⑥ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-wncoupe1.mjs'") > 0 && S.liste.indexOf("mv-harnais-wncoupe1.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const m = (cle, a, b) => (S) => Object.assign({}, S, { [cle]: S[cle].replace(a, b) });
  const mutants = [
    ['le journal revient dans utils.js', (S) => Object.assign({}, S, { utils: S.utils + '\nexport const WHATS_NEW = [\n];\n' })],
    ['utils.js ne réexporte plus', m('utils', 'export { WHATS_NEW };', '')],
    ['utils.js regonfle au plafond', (S) => Object.assign({}, S, { utils: S.utils + '/*' + 'x'.repeat(PLAFOND) + '*/' })],
    ['le journal ne s’ouvre plus sur l’APP_VERSION', m('wn', "export const WHATS_NEW = [\n  { v: '", "export const WHATS_NEW = [\n  { v: '0.")],
    ['mv-whatsnew-check ne lit plus whats-new.js', m('check', "'src', 'whats-new.js'", "'src', 'utils.js'")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-wncoupe1.mjs'").join("mv-harnais-wncoupeZ.mjs'") })],
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
