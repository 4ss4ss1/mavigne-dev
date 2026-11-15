/* ───────────────────────────────────────────────────────
   HARNAIS — REGDEC-1 (§576) : L'EXPORT DU REGISTRE VIT DANS registre.js, ET LIT phyto.js PAR window
   Lancer :          node scripts/mv-harnais-regdec1.mjs
   Contre-épreuves : node scripts/mv-harnais-regdec1.mjs --contre

   POURQUOI IL EXISTE
   Le fichier du registre (ses lignes, ses périodes, son panneau) a quitté phyto.js pour registre.js, sans qu'une ligne soit
   réécrite. Ce que ce déplacement peut casser ne se voit pas à la lecture : après le build, un nom d'un AUTRE module n'existe
   pas (§24, Build n°6) — une fonction restée dans phyto.js et appelée « nue » depuis registre.js lèverait chez le client, alors
   que tous les harnais qui jouent les deux fichiers dans un même contexte resteraient verts. Ce harnais garde la frontière :
   chaque nom déplacé est défini une fois, dans registre.js ; les cinq fonctions restées dans phyto.js n'y sont appelées que par
   window, et phyto.js les y pose ; l'inverse aussi (phyto.js n'appelle rien de l'export sans window).
   Le sens du code, lui, est gardé par mv-harnais-reg27a / reg27b (qui JOUENT l'export) — un contrôle, une source.
   Jamais déployé (scripts/) → aucun bump.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { rg: lire('src/registre.js'), phy: lire('src/phyto.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
const nu = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const esc = (n) => n.replace(/[$]/g, '\\$');
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det != null ? '\n      → ' + det : '')); } };
// Ce qui a déménagé (16 noms), ce qui est resté et que le registre lit (5 noms).
const PARTIS = ['MV_OEPP_VIGNE', 'MV_PHY_CSV_COLS', '_phCsvBbch', '_phCsvCell', '_phCsvDate', '_phCsvDose', '_phCsvHeure', '_phCsvJour', '_phCsvNum', '_phytoCsvRows', '_phytoExportChoix', '_phytoExportCsv', '_phytoExportGarde', '_phytoFenAnnees', '_phytoFenCompte', '_phytoFenetres'];
const RESTES = ['_phResolve', '_phRentrees', '_phRentreeDelai', '_phParcHa', '_phCsvParcs'];
const SUR_WINDOW = ['_phytoFenetres', '_phytoCsvRows', '_phytoExportChoix', '_phytoExportCsv'];
const defs = (s, n) => (s.match(new RegExp('^(?:function\\s+' + esc(n) + '\\s*\\(|var\\s+' + esc(n) + '\\s*=|window\\.' + esc(n) + '\\s*=\\s*function)', 'gm')) || []).length;
const nus = (s, n) => (s.match(new RegExp('(?<![\\w$.])' + esc(n) + '(?![\\w$])', 'g')) || []).length;

function jouer(S) {
  const R = nu(S.rg), P = nu(S.phy);
  const mal = PARTIS.filter((n) => defs(R, n) !== 1 || defs(P, n) !== 0);
  t('① les 16 noms de l’export sont définis une fois, dans registre.js — plus dans phyto.js', !mal.length, mal.map((n) => n + ' (registre ' + defs(R, n) + ', phyto ' + defs(P, n) + ')').join(' · '));
  const appelsNus = RESTES.filter((n) => nus(R, n) > 0), lus = RESTES.filter((n) => new RegExp('window\\.' + esc(n) + '(?![\\w$])').test(R));
  t('② registre.js lit les cinq fonctions restées dans phyto.js, et seulement par window', !appelsNus.length && lus.length === RESTES.length, 'nus : ' + appelsNus.join() + ' · lus : ' + lus.join());
  const poses = RESTES.filter((n) => new RegExp('window\\.' + esc(n) + '\\s*=\\s*' + esc(n) + '\\s*;').test(P) || new RegExp('(?<![\\w$])' + esc(n) + '\\s*:\\s*' + esc(n) + '(?![\\w$])').test(P));
  const definies = RESTES.filter((n) => defs(P, n) === 1);
  t('② phyto.js définit ces cinq fonctions et les pose sur window', poses.length === RESTES.length && definies.length === RESTES.length, 'posées : ' + poses.join() + ' · définies : ' + definies.join());
  const exposes = SUR_WINDOW.filter((n) => new RegExp('^window\\.' + esc(n) + '\\s*=', 'm').test(R));
  t('③ registre.js pose sur window ce que les autres modules et les boutons appellent', exposes.length === SUR_WINDOW.length, exposes.join());
  const retours = PARTIS.filter((n) => nus(P, n) > 0 && !new RegExp('window\\.' + esc(n) + '(?![\\w$])').test(P));
  const nusPhy = PARTIS.filter((n) => (P.match(new RegExp('(?<![\\w$.\'"])' + esc(n) + '\\s*\\(', 'g')) || []).length > 0);
  t('③ phyto.js n’appelle rien de l’export sans passer par window', !nusPhy.length, nusPhy.join() + ' ' + retours.join());
  t('④ phyto.js charge registre.js avant de s’exécuter, et dit où l’export est parti', /^import '\.\/registre\.js';/m.test(S.phy) && S.phy.includes('// ★ REGDEC-1 (§576)') && S.rg.includes('// ════ ★ REGDEC-1 (§576)'));
  t('④ registre.js n’importe rien de phyto.js (pas de boucle entre les deux modules)', !/from\s+['"]\.\/phyto\.js['"]|import\s+['"]\.\/phyto\.js['"]/.test(S.rg));
  t('⑤ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-regdec1.mjs'") > 0 && S.liste.indexOf("mv-harnais-regdec1.mjs --contre'") > 0);
}

if (!CONTRE) {
  console.log('\n\x1b[1mMA VIGNE — Harnais REGDEC-1 · scénarios\x1b[0m');
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  console.log('\n\x1b[1mMA VIGNE — Harnais REGDEC-1 · contre-épreuves\x1b[0m');
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (S[cle].split(a).length !== 2) throw new Error('ancre absente ou multiple : ' + a.slice(0, 50)); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const plus = (cle, txt) => (S) => Object.assign({}, S, { [cle]: S[cle] + txt });
  const mutants = [
    ['registre.js appelle _phResolve sans window', m('rg', "(typeof window._phResolve==='function') ? window._phResolve(t) : {};", "(typeof window._phResolve==='function') ? _phResolve(t) : {};")],
    ['registre.js appelle _phRentrees sans window', m('rg', 'var RT = window._phRentrees(t);', 'var RT = _phRentrees(t);')],
    ['registre.js appelle _phCsvParcs sans window', m('rg', 'window._phCsvParcs(t).forEach(function(nom){', '_phCsvParcs(t).forEach(function(nom){')],
    ['phyto.js ne pose plus _phParcHa sur window', m('phy', 'window._phParcHa = _phParcHa;', '')],
    ['phyto.js ne pose plus _phCsvParcs sur window', m('phy', 'window._phCsvParcs = _phCsvParcs;', '')],
    ['une fonction de l’export revient dans phyto.js', plus('phy', "\nfunction _phCsvDate(iso){ return iso; }\n")],
    ['phyto.js appelle l’export sans window', plus('phy', "\nfunction _xExport(){ return _phytoFenetres(); }\n")],
    ['registre.js ne pose plus les lignes du fichier sur window', m('rg', 'window._phytoCsvRows = function(fen){', 'var _phytoCsvRows = function(fen){')],
    ['registre.js ne pose plus le panneau sur window', m('rg', 'window._phytoExportChoix = _phytoExportChoix;', '')],
    ['registre.js importe phyto.js (boucle)', (S) => Object.assign({}, S, { rg: "import './phyto.js';\n" + S.rg })],
    ['phyto.js ne charge plus registre.js', (S) => Object.assign({}, S, { phy: S.phy.replace(/^import '\.\/registre\.js';/m, "// import './registre.js';") })],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-regdec1.mjs'").join("mv-harnais-regdecZ.mjs'") })]];
  let rougit = 0;
  for (const [nom, f] of mutants) {
    let S; try { S = f(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m défaut non injecté : ' + nom + ' (' + e.message + ')'); continue; }
    const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S); } catch (e) { ko++; } console.log = log;
    if (ko) { rougit++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + '\x1b[2m  (' + ko + ')\x1b[0m'); } else console.log('  \x1b[31m✗\x1b[0m MUET : ' + nom);
  }
  console.log('\n  ' + rougit + '/' + mutants.length + ' contre-épreuves rougissent\n');
  process.exit(rougit === mutants.length ? 0 : 1);
}
