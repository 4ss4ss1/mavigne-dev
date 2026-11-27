// ★ COULEUR-1 (§625) — OÙ VIVENT LES TUTOS : le moteur et le domaine d'entraînement dans src/tutos.js, la liste des tutos
//   rangée par module, un fichier chacun (src/tutos-vigne.js, -tracteur, -planning, -phyto, -reserve, -cave), que
//   src/tutos.js importe. Une seule définition pour tous les contrôles qui lisaient « src/tutos.js » : sinon l'un
//   lirait le moteur seul et croirait un tuto disparu, l'autre compterait la liste deux fois.
//   · fichiersTutos(lire) : src/tutos.js puis ses listes, DANS L'ORDRE où il les importe (l'ordre du catalogue).
//     `lire(f)` rend le texte d'un fichier ou null — un dépôt, un commit (git show), une copie modifiée en mémoire.
//   · texteTutos(lire) : leurs textes mis bout à bout (le moteur d'abord) — ce que lisait `lire('src/tutos.js')`.
//   · estTutos(f) : un fichier des tutos (le moteur ou une liste) — hors de « l'appli » pour les contrôles qui
//     cherchent ce que l'appli porte (une étiquette visée doit être posée par l'appli, pas par le tuto qui la vise).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MOTEUR = 'src/tutos.js';
export const RE_LISTE = /^src\/tutos-[a-z]+\.js$/;
export const estListe = (f) => RE_LISTE.test(String(f || ''));
export const estTutos = (f) => f === MOTEUR || estListe(f);

// Les listes que le moteur importe, dans son ordre.
export function listesDe(moteur) {
  return [...String(moteur || '').matchAll(/^import \{[^}]*\} from '\.\/(tutos-[a-z]+)\.js';/gm)].map((m) => 'src/' + m[1] + '.js');
}
export function fichiersTutos(lire) {
  return [MOTEUR, ...listesDe(lire(MOTEUR))];
}
export function texteTutos(lire) {
  return fichiersTutos(lire).map((f) => lire(f) || '').join('\n');
}

// Le dépôt courant (les harnais qui lisent leurs fichiers depuis la racine).
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const lireDepot = (f) => { const p = path.join(RACINE, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; };
export const texteTutosDepot = () => texteTutos(lireDepot);
