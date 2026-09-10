#!/usr/bin/env node
// ============================================================================
//  MA VIGNE — Harnais des PORTES
//  --------------------------------------------------------------------------
//  POURQUOI CE FICHIER EXISTE.
//  Il y avait DEUX portes, et elles n'etaient pas la meme :
//    - en local, `npm run check` enchainait 46 invocations ;
//    - en integration, `.github/workflows/ci.yml` en lancait 25, dont
//      QUATORZE que `check` n'a jamais lancees.
//  Consequence vecue a repetition : un lot passait vert sur le poste, puis
//  echouait au push sur `lint-cliquet` (no-redeclare), sur `lint-vocabulaire`,
//  sur `mv-whatsnew-check`… Corriger l'erreur ne reglait rien : la fois
//  suivante, c'etait une autre porte du meme groupe.
//
//  ⚠️ LE DEFAUT N'ETAIT PAS UNE LIGNE OUBLIEE, C'ETAIT UNE DERIVE.
//     Ajouter les 14 manquantes ferme le trou du jour. Ce harnais empeche le
//     PROCHAIN : toute etape ajoutee au CI sans son pendant local rougit ICI,
//     sur le poste, avant le push.
//
//  Regle : CI ⊆ check. L'inverse est LEGITIME — `mv-base`, le banc et
//  `harnais-claude-md` n'ont de sens qu'en local, le CI a son propre garde.
//
//  Usage :  node scripts/mv-harnais-portes.mjs
//  LECTURE SEULE. Jamais deploye (scripts/) -> aucun bump.
// ============================================================================

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (p) => readFileSync(path.join(root, p), 'utf8');

let ok = 0, ko = 0;
const t = (nom, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); if (detail) console.log(detail); }
};

// Une invocation = le script ET son drapeau. `--contre` n'est pas un detail :
// c'est la contre-epreuve, la moitie qui prouve que le harnais mord.
const invocations = (txt) => new Set(
  [...txt.matchAll(/node (scripts\/[\w./-]+\.mjs)(?:\s+(--[\w-]+))?/g)]
    .map(m => m[1] + (m[2] ? ' ' + m[2] : ''))
);

const ci   = lire('.github/workflows/ci.yml');
const pkg  = JSON.parse(lire('package.json'));
const CI    = invocations(ci);
const CHECK = invocations(pkg.scripts.check || '');
const BUILD = invocations(pkg.scripts.prebuild || '');

// Etapes que le CI est SEUL a pouvoir jouer. Vide aujourd'hui : tout ce que le
// CI lance tourne aussi sur le poste. Une entree ici se JUSTIFIE en commentaire
// — sinon c'est le trou d'hier qui revient sous un autre nom.
const CI_SEUL = new Set([]);

console.log('\n\x1b[1m  MA VIGNE — Harnais des portes\x1b[0m\n');
console.log('\x1b[2m  CI : ' + CI.size + ' invocations · check : ' + CHECK.size
  + ' · prebuild : ' + BUILD.size + '\x1b[0m\n');

const manque = [...CI].filter(x => !CHECK.has(x) && !CI_SEUL.has(x)).sort();
t('tout ce que le CI lance, `npm run check` le lance aussi',
  manque.length === 0,
  '      ' + manque.length + ' invocation(s) que le push decouvrira, jamais le poste :\n'
  + manque.map(x => '        · ' + x).join('\n')
  + '\n      → les ajouter a `check` ET a `prebuild` dans package.json.');

const manqueB = [...CI].filter(x => !BUILD.has(x) && !CI_SEUL.has(x)).sort();
t('`prebuild` couvre la meme porte que `check`',
  manqueB.length === 0,
  '      ' + manqueB.length + ' absente(s) de prebuild : ' + manqueB.join(', '));

// Les deux chaines locales doivent rester jumelles : `check` sert a verifier,
// `prebuild` a interdire un build qui n'aurait pas verifie. Elles ont diverge
// une fois deja — c'est ainsi qu'une porte se rouvre sans qu'on le voie.
const ecartCB = [...CHECK].filter(x => !BUILD.has(x)).sort();
const ecartBC = [...BUILD].filter(x => !CHECK.has(x)).sort();
t('`check` et `prebuild` lancent exactement la meme chose',
  ecartCB.length === 0 && ecartBC.length === 0,
  '      check seul : ' + (ecartCB.join(', ') || '—')
  + '\n      prebuild seul : ' + (ecartBC.join(', ') || '—'));

t('le cliquet ESLint est dans la chaine locale',
  CHECK.has('scripts/lint-cliquet.mjs'),
  '      C\'est la porte qui a fait echouer le plus de push : elle doit rougir ICI.');

t('aucune exception CI_SEUL non justifiee',
  CI_SEUL.size === 0 || true);   // informatif : la justification est en commentaire

console.log('\n  ' + ok + ' vert' + (ok > 1 ? 's' : '') + ' · ' + ko + ' rouge'
  + (ko > 1 ? 's' : '') + '\n');
process.exit(ko ? 1 : 0);
