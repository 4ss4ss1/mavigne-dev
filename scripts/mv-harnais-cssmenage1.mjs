/* ───────────────────────────────────────────────────────
   HARNAIS — CSS-MENAGE-1 (§453) : LE STYLE DE L'ANCIEN AUJOURD'HUI NE REVIENT PAS
   Lancer :          node scripts/mv-harnais-cssmenage1.mjs
   Contre-épreuves : node scripts/mv-harnais-cssmenage1.mjs --contre

   POURQUOI IL EXISTE
   PIL-RANGE-1b (§441) a retiré l'ancien Aujourd'hui et le rendu de secours de cockpit.js ; leur style restait (dette notée
   §441d). Mesuré : 33 classes sans plus aucun producteur (ni écrites dans le code, ni construites par concaténation ou par
   gabarit), 67 règles. Ce harnais garde le ménage : aucune règle ne les cible plus (feuilles et style injecté), et aucun code
   ne les produit — si une revient, c'est qu'un écran l'utilise : il faut alors la retirer d'ici, en connaissance de cause.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const MORTES = ["ck-relief", "ck-village", "ck-lieu", "ck-etiq", "ck-clos", "ck-zone-f", "ck-c-aire", "ck-c-conges", "ck-c-it", "ck-e-ecart", "ck-v-date", "pil-tz", "pil-tz-ban", "pil-tz-big", "pil-tz-ini", "pil-tz-pied", "pil-tz-rai", "pil-tz-tens", "pil-tl", "pil-tl-marge", "pil-tl-mk", "pil-tl-obj", "pil-tl-proj", "pil-tl-today", "pil-tl-wrap", "pil-ck", "pil-ck-btn", "pil-ck-row", "pil-cks", "pil-cockpit-card", "pil-dec", "pil-dec2", "pil-spark"];
const sansCom = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
const S0 = { css: lire('src/styles.css') + '\n' + lire('src/charte.css'), js: fs.readdirSync(path.join(RACINE, 'src')).filter((f) => f.endsWith('.js')).map((f) => lire('src/' + f)).join('\n'), html: lire('index.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
const rx = new RegExp('\\.(' + MORTES.map((c) => c.replace(/[-]/g, '\\-')).sort((a, b) => b.length - a.length).join('|') + ')(?![\\w-])');
function jouer(S) {
  const css = sansCom(S.css), js = sansCom(S.js);
  const regles = (css.match(new RegExp(rx.source, 'g')) || []);
  t('① aucune règle des feuilles ne cible une des ' + MORTES.length + ' classes retirées', regles.length === 0, regles.slice(0, 5).join(' '));
  const inj = js.split('\n').filter((l) => /^\s*\+'\./.test(l) && rx.test(l));
  t('① aucun style injecté par un module ne les cible non plus', inj.length === 0, inj.slice(0, 3).join(' | '));
  const prod = MORTES.filter((c) => new RegExp('(?<![\\w.-])' + c.replace(/[-]/g, '\\-') + '(?![\\w-])').test(js + S.html) || js.includes(c.slice(0, c.lastIndexOf('-') + 1) + '${'));
  t('② et aucun code ne les produit (classe écrite ou gabarit)', prod.length === 0, prod.join(', '));
  t('③ la liste des harnais joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-cssmenage1.mjs'") > 0 && S.liste.indexOf("mv-harnais-cssmenage1.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const mutants = [
    ['une règle morte revient dans la feuille', (S) => Object.assign({}, S, { css: S.css + '\n.pil-tz-big{font-size:20px}\n' })],
    ['une règle morte revient dans un groupe', (S) => Object.assign({}, S, { css: S.css + '\n.pil-panel,.pil-cockpit-card{margin:0}\n' })],
    ['un module réinjecte une règle morte', (S) => Object.assign({}, S, { js: S.js + "\n  +'.pil-tl-mk{opacity:1}'\n" })],
    ['un écran reproduit une classe retirée', (S) => Object.assign({}, S, { js: S.js + "\nvar h='<div class=\"pil-dec\"></div>';\n" })],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-cssmenage1.mjs'").join("mv-harnais-cssmenageX.mjs'") })],
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
