#!/usr/bin/env node
/* mv-harnais-chemins — LE CHEMIN D’UN FICHIER SE DÉDUIT AVEC fileURLToPath (§53, §376).
   `new URL(…, import.meta.url).pathname` rend « /C:/Users/… » sous Windows, que Node relit en
   « C:\C:\Users\… » : le harnais est vert dans le bac à sable (Linux) et plante au premier
   lancement sur le poste de Nico. Leçon payée trois fois — §53, puis mv-harnais-pastilles (§376).
   Ce contrôle lit la liste de la chaîne (mv-harnais-liste.mjs) et refuse le motif dans le CODE de
   chaque script qu’elle lance (un commentaire qui le cite pour l’interdire reste permis).
   Usage : node scripts/mv-harnais-chemins.mjs [--contre] */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = p => readFileSync(join(RACINE, p), 'utf8').replace(/\r\n/g, '\n');
const MOTIF = /new\s+URL\s*\([^;]*?import\.meta\.url\s*\)\s*\)?\s*\.pathname/;
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
function scriptsDeLaChaine(liste) {
  return [...new Set([...liste.matchAll(/node\s+(scripts\/[\w.-]+\.m?js)/g)].map(m => m[1]))];
}
function verifier(liste, lireScript) {
  const scripts = scriptsDeLaChaine(liste);
  const fautifs = scripts.filter(f => { const s = lireScript(f); return s !== null && MOTIF.test(sansCom(s)); });
  const absents = scripts.filter(f => lireScript(f) === null);
  return [
    { nom: `la liste de la chaîne lance des scripts (${scripts.length})`, ok: scripts.length > 100, det: '' },
    { nom: 'aucun script de la chaîne ne prend le chemin d’un fichier par .pathname', ok: !fautifs.length, det: fautifs.join(', ') },
    { nom: 'chaque script de la liste existe', ok: !absents.length, det: absents.slice(0, 5).join(', ') }
  ];
}
const lireScript = f => existsSync(join(RACINE, f)) ? lire(f) : null;
const V = s => `\x1b[32m✓\x1b[0m ${s}`, X = s => `\x1b[31m✗\x1b[0m ${s}`;
const liste = lire('scripts/mv-harnais-liste.mjs');
if (!process.argv.includes('--contre')) {
  console.log('\n── LE CHEMIN D’UN FICHIER SE DÉDUIT AVEC fileURLToPath\n');
  const R = verifier(liste, lireScript);
  for (const r of R) { console.log('  ' + (r.ok ? V(r.nom) : X(r.nom))); if (!r.ok && r.det) console.log('      → ' + r.det); }
  const ko = R.filter(r => !r.ok).length; console.log(`\n  ${R.length - ko} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
} else {
  console.log('\n── CONTRE-ÉPREUVES — le chemin d’un fichier\n');
  let ok = 0, ko = 0;
  const essai = (nom, contenu, attendu) => {
    const faux = f => f === 'scripts/mv-harnais-pastilles.mjs' ? contenu : lireScript(f);
    const R = verifier(liste, faux); const vert = R[1].ok;
    const bon = attendu === 'rouge' ? !vert : vert;
    console.log('  ' + (bon ? V(nom) : X(nom))); bon ? ok++ : ko++;
  };
  /* Les morceaux du motif sont recollés à l’exécution : écrit d’un bloc dans une chaîne, il ferait
     rougir ce fichier lui-même (le contrôle ne lit que le code, et une chaîne est du code). */
  const NU = 'new ' + 'URL', PN = '.path' + 'name';
  essai('le motif dans le code → rougit', `const ROOT = ${NU}('..', import.meta.url)${PN};\n`, 'rouge');
  essai('le motif sur deux lignes → rougit', `const R = ${NU}(\n  '../', import.meta.url\n)${PN};\n`, 'rouge');
  essai('témoin — le motif cité dans un commentaire /* */ ne compte pas', `/* jamais ${NU}('..', import.meta.url)${PN} (§53) */\nconst x = 1;\n`, 'vert');
  essai('témoin — le motif cité dans un commentaire // ne compte pas', `const ICI = 1;   // ⚠️ jamais ${NU}(import.meta.url)${PN} (§53)\n`, 'vert');
  essai('témoin — fileURLToPath passe', "const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');\n", 'vert');
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
