// Extraction des fonctions REELLES de src/pilotage.js.
// Regle du projet : un banc ne reimplemente jamais ce qu'il mesure. Une copie
// diverge en silence dès le premier lot et verdit sur du code mort (§40).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Decoupe un bloc `function nom(...){...}` par equilibre d'accolades.
// Le comptage naif casserait sur une accolade DANS une chaine ou un commentaire :
// on saute donc chaines, gabarits, regex et commentaires pendant le balayage.
function bloc(src, nom) {
  const sig = new RegExp('(?:^|\\n)(function ' + nom.replace(/[$]/g, '\\$') + '\\s*\\()');
  const m = sig.exec(src);
  if (!m) throw new Error('fonction introuvable dans la source : ' + nom);
  let i = src.indexOf('{', m.index + m[1].length ? m.index : m.index);
  i = src.indexOf('{', m.index);
  const dep = i;
  let prof = 0, j = i;
  while (j < src.length) {
    const c = src[j], d = src[j + 1];
    if (c === '/' && d === '/') { j = src.indexOf('\n', j); if (j < 0) break; continue; }
    if (c === '/' && d === '*') { j = src.indexOf('*/', j) + 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; j++;
      while (j < src.length && src[j] !== q) { if (src[j] === '\\') j++; j++; }
      j++; continue;
    }
    if (c === '{') prof++;
    else if (c === '}') { prof--; if (prof === 0) return src.slice(m.index, j + 1); }
    j++;
  }
  throw new Error('bloc non ferme : ' + nom);
}

function ligneVar(src, nom) {
  const re = new RegExp('(?:^|\\n)(var ' + nom + '\\s*=[^;]+;)');
  const m = re.exec(src);
  if (!m) throw new Error('variable introuvable dans la source : ' + nom);
  return m[1];
}

export function chargePilotage(fichier) {
  const src = fs.readFileSync(fichier || path.join(RACINE, 'src/pilotage.js'), 'utf8');

  const FN = ['_arcN', '_arcISO', '_arcCampagneDe', '_arcHeures',
              '_pilCmpPeriode', '_pilCmpOffset', '_pilCmpSnapshot',
              '_pilCmpSegment', '_pilCmpRecouvre', '_pilCmpAcheve'];
  const VR = ['_PIL_CMP_TOL', '_PIL_CMP_RECOUV', '_PIL_CMP_ACHEVE'];

  let code = '';
  for (const v of VR) code += ligneVar(src, v) + '\n';
  for (const f of FN) code += bloc(src, f) + '\n';
  code += '\nreturn {' + FN.concat(VR).join(',') + '};';

  const win = {};
  const fabrique = new Function('window', code);
  const api = fabrique(win);
  return { api, win, taille: code.length, nbFn: FN.length };
}
