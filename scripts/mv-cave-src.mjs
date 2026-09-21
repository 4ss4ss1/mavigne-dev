// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — LA CAVE EN DEUX FICHIERS : UNE SEULE PORTE POUR LES HARNAIS
// ═══════════════════════════════════════════════════════════════════════════
//  ★ Lot CUV-DEC (CLAUDE.md §164). `src/cave.js` touchait le plafond de
//  1 024 ko : Le Cuvier en est sorti, dans `src/cuvier.js`. Une quarantaine
//  de harnais extrayaient leurs fonctions de `src/cave.js` par leur nom — la
//  moitié de ces noms vivent maintenant dans l'autre fichier.
//
//  Un harnais qui cherche une fonction DE LA CAVE lit ici, jamais un chemin
//  écrit en dur : le jour où la Cave se coupe encore, on ajoute UN fichier à
//  CAVE_FICHIERS et aucun harnais ne bouge.
//
//  ⚠️ La concaténation sert à EXTRAIRE (par nom, par motif). Elle ne se charge
//     pas telle quelle comme un module : les deux fichiers ont chacun leur
//     `import` et leur `const DEBUG`. Pour importer le vrai code, voir
//     `importerCave()` ci-dessous.
//  ⚠️ Un contrôle « ce fichier précis contient… » (poids, en-tête, frontière)
//     lit toujours le fichier par son nom : il ne passe pas par ici.
//
//  LECTURE SEULE. Jamais déployé (scripts/) → aucun bump.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/* L'ordre est celui d'app.js : cave.js, puis cuvier.js, juste après lui. */
export const CAVE_FICHIERS = ['src/cave.js', 'src/cuvier.js'];

/* Le texte des deux fichiers, dans l'ordre d'import. `racine` : une copie du
   dépôt (contre-épreuves qui travaillent sur un dossier temporaire). */
export function lireCave(racine) {
  return CAVE_FICHIERS.map(f => fs.readFileSync(path.join(racine || RACINE, f), 'utf8')).join('\n');
}

/* Importe le VRAI code des deux modules, dans l'ordre d'app.js.
   ⚠️⚠️ Dans le navigateur, `window` EST l'objet global : un nom nu lu par
   cuvier.js (`_caveCuve(...)`) se résout sur ce que cave.js a posé sur
   `window`. Un harnais qui fabrique un `window` DISTINCT de `globalThis` casse
   ce pont — ce n'est pas le code qui ment, c'est le décor. D'où la recopie :
   après chaque import, ce que le module vient de poser sur le faux `window`
   est reporté sur `globalThis`, sans écraser ce que le harnais y a mis.
   `fichiers` : pour une contre-épreuve sur une copie de cave.js — la liste de
   chemins remplace CAVE_FICHIERS, dans le même ordre. */
export async function importerCave(fichiers) {
  const liste = fichiers || CAVE_FICHIERS.map(f => path.join(RACINE, f));
  for (const f of liste) {
    await import(pathToFileURL(path.resolve(f)).href);
    const w = globalThis.window;
    if (w && w !== globalThis) {
      for (const k of Object.keys(w)) if (!(k in globalThis)) globalThis[k] = w[k];
    }
  }
}
