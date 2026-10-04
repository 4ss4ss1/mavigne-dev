// HARNAIS — LOTS-1 (§231) : la garde des lots frères (scripts/mv-lots.mjs).
//   node scripts/mv-harnais-lots.mjs           → doit être vert
//   node scripts/mv-harnais-lots.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue le VRAI verdict() sur des marques factices — dont l'incident du 03/10 rejoué (§223).
import fs from 'fs'; import os from 'os'; import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const SRC0 = fs.readFileSync(path.join(R, 'scripts/mv-lots.mjs'), 'utf8');
async function charger(src) {
  const tmp = path.join(os.tmpdir(), 'mv-lots-' + process.pid + '-' + Math.random().toString(36).slice(2) + '.mjs');
  fs.writeFileSync(tmp, src); try { return await import(pathToFileURL(tmp).href); } finally { fs.unlinkSync(tmp); }
}
const M = (lot, fichiers, inclut) => ({ fichier: lot + '.json', lot, inclut: inclut || [], fichiers });
async function suite(src) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const { verdict } = await charger(src);
  const disque = { 'src/app.js': 'a2', 'src/pilotage.js': 'p2', 'src/utils.js': 'u1' }, emp = f => disque[f] || null;
  T('aucune marque en attente : rien à dire', verdict([M('ANCIEN', { 'src/app.js': 'zz' })], new Set(), emp).ok);
  T('un lot en attente, fichiers intacts : accepté', verdict([M('KIT-5', { 'src/app.js': 'a2', 'src/pilotage.js': 'p2' })], new Set(['KIT-5.json']), emp).ok);
  const freres = verdict([M('SERIE', { 'src/utils.js': 'u1' }), M('COH-1', { 'src/app.js': 'a2' })], new Set(['SERIE.json', 'COH-1.json']), emp);
  T('deux lots frères collés sans commit entre eux : REFUS, et il les nomme', !freres.ok && /SERIE/.test(freres.msg[0]) && /COH-1/.test(freres.msg[0]));
  T('un zip cumulatif (KIT-4 inclut KIT-3) n\u2019est pas une fratrie', verdict([M('KIT-3', { 'src/app.js': 'vieux' }), M('KIT-4', { 'src/app.js': 'a2' }, ['KIT-3'])], new Set(['KIT-3.json', 'KIT-4.json']), emp).ok);
  const ecrase = verdict([M('SERIE', { 'src/app.js': 'a1-serie', 'src/utils.js': 'u1' })], new Set(['SERIE.json']), emp);
  T('le 03/10 rejoué : un zip sans marque a écrasé app.js d\u2019un lot marqué → REFUS, le fichier est nommé', !ecrase.ok && /src\/app\.js/.test(ecrase.msg[0]));
  T('une marque déjà commitée ne compte plus', verdict([M('VIEUX', { 'src/app.js': 'autre' }), M('NEUF', { 'src/app.js': 'a2' })], new Set(['NEUF.json']), emp).ok);
  return out;
}
let ok = 0, ko = 0;
(await suite(SRC0)).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nLOTS-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const D = [
  ['la fratrie n\u2019est plus vue', s => s.replace('if (tetes.length > 1) return', 'if (false) return')],
  ['l\u2019empreinte n\u2019est plus vérifiée', s => s.replace('const ko = noms.filter(f => empreinte(f) !== T.fichiers[f]);', 'const ko = [];')],
  ['un zip cumulatif est pris pour une fratrie', s => s.replace('const tetes = att.filter(m => !inclus.has(m.lot));', 'const tetes = att;')],
  ['les marques commitées comptent encore', s => s.replace('const att = marques.filter(m => enAttente.has(m.fichier));', 'const att = marques;')],
];
let rg = 0;
for (const [n, mut] of D) {
  const S = mut(SRC0);
  if (S === SRC0) { console.log('  \u26a0 non injecté : ' + n); continue; }
  let res; try { res = await suite(S); } catch (e) { res = [['exc', false]]; }
  const rouge = res.some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  \u2713 rougit : ' : '  \u2717 RESTE VERT : ') + n);
}
console.log(`\n${rg}/${D.length} défauts détectés`);
process.exit(rg === D.length ? 0 : 1);
