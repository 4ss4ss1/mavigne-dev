// ============================================================================
//  MA VIGNE — Les dates RÉELLES, pour les harnais (FUS-2)
//  --------------------------------------------------------------------------
//  `_mvToday` / `_mvISO` (utils.js) sont devenues une dépendance de tout le code
//  qui pose une date. Six harnais intégrés ont donc cassé d'un coup — ce qui est
//  exactement leur travail : ils exécutent du VRAI code, et ce code a gagné une
//  dépendance.
//
//  ⚠️ On ne comble PAS ce trou avec un bouchon écrit à la main. Un bouchon a sa
//  propre signature, et il ment le jour où la vraie fonction change — ici, il
//  suffirait qu'elle reparte en UTC pour que tous les harnais restent verts sur
//  un code faux. On EXTRAIT donc les deux fonctions du fichier réel, comme le
//  fait déjà le harnais fuseau.
//
//  Deux usages, selon la mécanique du harnais :
//    · sourceDates()      → le TEXTE, à coller dans un préambule `new Function`
//    · poseDates(cible)   → les fonctions, posées sur globalThis / un contexte
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export function sourceDates() {
  const s = fs.readFileSync(path.join(RACINE, 'src', 'utils.js'), 'utf8');
  const bloc = (sig) => {
    const i = s.indexOf(sig);
    if (i < 0) throw new Error('mv-dates-reelles : introuvable dans src/utils.js \u2014 ' + sig);
    let d = 0, k = s.indexOf('{', i);
    for (; k < s.length; k++) {
      if (s[k] === '{') d++;
      else if (s[k] === '}') { d--; if (d === 0) { k++; break; } }
    }
    return s.slice(i, k).replace(/^export\s+/, '');
  };
  return bloc('export function _mvISO(') + '\n' + bloc('export function _mvToday(') + '\n';
}

export function poseDates(cible) {
  const fns = new Function(sourceDates() + 'return { _mvISO: _mvISO, _mvToday: _mvToday };')();
  cible._mvISO = fns._mvISO;
  cible._mvToday = fns._mvToday;
  return fns;
}
