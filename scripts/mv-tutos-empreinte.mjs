// ★ TUTO-9 (§423) — L'EMPREINTE DES SOURCES DE L'APPLI : ce que npm run test:tutos a rejoué (rapports/tutos.json), et ce que la
//   marque d'un lot vérifie (scripts/mv-lot-marque.mjs). Une seule définition des « sources » pour les deux : sinon le rapport
//   et la marque compteraient deux choses. Le contenu fait foi, pas la date (un harnais qui rend un fichier à l'identique ne
//   change rien) ; la date ne sert qu'à refuser un build plus ancien que les sources.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const SOURCES = ['index.html', 'vite.config.js', 'src', 'public/boot.js', 'public/sw.js'];

function lister(R) {
  const out = [];
  const voir = (rel) => {
    const p = path.join(R, rel);
    if (!fs.existsSync(p)) return;
    if (fs.statSync(p).isDirectory()) fs.readdirSync(p).sort().forEach((n) => voir(path.join(rel, n)));
    else out.push(rel.split(path.sep).join('/'));
  };
  SOURCES.forEach(voir);
  return out;
}
export function empreinteSources(R) {
  const h = crypto.createHash('sha256');
  lister(R).forEach((f) => { h.update(f + '\0'); h.update(fs.readFileSync(path.join(R, f))); h.update('\0'); });
  return h.digest('hex');
}
// Les sources modifiées APRÈS le repère (dist/version.json, écrit en dernier par le build).
export function sourcesPlusRecentes(R, repere) {
  if (!fs.existsSync(repere)) return ['(le build est absent)'];
  const t = fs.statSync(repere).mtimeMs;
  return lister(R).filter((f) => fs.statSync(path.join(R, f)).mtimeMs > t);
}
// Un lot touche-t-il l'appli ? (les fichiers d'une marque, chemins du dépôt)
export function toucheAppli(fichiers) {
  return (fichiers || []).some((f) => f === 'index.html' || f === 'vite.config.js' || f.startsWith('src/') || f === 'public/boot.js' || f === 'public/sw.js');
}
