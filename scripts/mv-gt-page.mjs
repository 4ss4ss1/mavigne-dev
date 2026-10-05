// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — scripts/mv-gt-page.mjs — FABRIQUE gt.html, LA PAGE DE LA CONSOLE GUERETTECH (GT-1, §249)
// ════════════════════════════════════════════════════════════════════════════
// L'appli des clients (index.html) ne contient plus la console GUERETTECH. gt.html est la MÊME appli, avec en plus :
//   - le panneau de connexion GUERETTECH (src/gt/connexion.html) à la place du repère MV-GT:CONNEXION ;
//   - la console et ses deux panneaux (src/gt/console.html) à la place du repère MV-GT:CONSOLE ;
//   - l'entrée src/gt.js (app.js + admin-gt.js) au lieu de src/app.js ; noindex ; pas de manifeste d'installation.
// gt.html est FABRIQUÉ, jamais édité à la main (et ignoré par git) : un seul index.html à maintenir. `npm run build` et
// `npm run dev` le fabriquent avant Vite ; mv-harnais-gt1 vérifie la fabrique sans écrire de fichier.
// Chaque remplacement doit trouver son repère UNE fois exactement — sinon la fabrique refuse (jamais de page à moitié).
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const ICI = path.dirname(fileURLToPath(import.meta.url)), RACINE = path.resolve(ICI, '..');
export const REPERES = {
  connexion: /^[ \t]*<!-- MV-GT:CONNEXION —[^\n]*-->[ \t]*$/m,
  console: /^[ \t]*<!-- MV-GT:CONSOLE —[^\n]*-->[ \t]*$/m,
};
const ENTREE_CLIENT = '<script type="module" src="/src/app.js"></script>';
const ENTREE_GT = '<script type="module" src="/src/gt.js"></script>';

function unique(texte, motif, nom) {
  const n = typeof motif === 'string' ? texte.split(motif).length - 1 : (texte.match(new RegExp(motif.source, 'gm')) || []).length;
  if (n !== 1) throw new Error('[mv-gt-page] « ' + nom + ' » trouvé ' + n + ' fois dans index.html (il en faut 1)');
}
// Fragment sans son en-tête de commentaire (le repère d'origine est cité dans le commentaire d'en-tête).
const corps = f => f.replace(/^<!-- ★★ GT-1[\s\S]*?-->\n/, '');

export function fabriquerPageGT(index, connexion, consoleGT) {
  unique(index, REPERES.connexion, 'repère MV-GT:CONNEXION');
  unique(index, REPERES.console, 'repère MV-GT:CONSOLE');
  unique(index, ENTREE_CLIENT, 'entrée src/app.js');
  unique(index, '</head>', '</head>');
  unique(index, /<meta name="robots"[^>]*>/, 'balise robots');
  let h = index
    .replace(REPERES.connexion, () => corps(connexion).replace(/\n$/, ''))
    .replace(REPERES.console, () => corps(consoleGT).replace(/\n$/, ''))
    .replace(ENTREE_CLIENT, ENTREE_GT)
    .replace(/<link rel="manifest"[^>]*>\n?/g, '')
    .replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, nofollow">');
  h = h.replace(/<title>[^<]*<\/title>/, '<title>Ma Vigne · GUERETTECH</title>');
  return '<!-- FABRIQUÉ par scripts/mv-gt-page.mjs à partir d\'index.html — ne pas éditer (GT-1, §249) -->\n' + h;
}

export function lireSources(racine = RACINE) {
  const l = f => readFileSync(path.join(racine, f), 'utf8');
  return { index: l('index.html'), connexion: l('src/gt/connexion.html'), console: l('src/gt/console.html') };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const s = lireSources();
  const h = fabriquerPageGT(s.index, s.connexion, s.console);
  writeFileSync(path.join(RACINE, 'gt.html'), h, 'utf8');
  console.log('[mv-gt-page] ✓ gt.html fabriqué (' + Math.round(h.length / 1024) + ' Ko)');
}
