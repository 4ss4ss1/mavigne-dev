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
//  sur `mv-whatsnew-check`…
//
//  ★★★ LISTE-1 (§190, 27/09) — IL N'Y A PLUS QU'UNE PORTE.
//  Ce harnais comparait trois listes ecrites a la main (check, prebuild, CI)
//  pour les empecher de deriver. Elles sont remplacees par UNE liste,
//  scripts/mv-harnais-liste.mjs, jouee par scripts/mv-lanceur.mjs :
//      npm run check   = node scripts/mv-lanceur.mjs
//      prebuild        = npm run check
//      CI (controles)  = node scripts/mv-lanceur.mjs --continuer, puis
//                        npm run build --ignore-scripts (sinon tout rejoue)
//  Il garde desormais ce CABLAGE : qu'aucune seconde liste ne revienne, que la
//  CI ne lance rien hors de la liste, que rien ne tourne deux fois — et que la
//  liste elle-meme soit saine (forme, fichiers presents, aucun doublon, groupes).
//
//  Usage :  node scripts/mv-harnais-portes.mjs            (+ --contre)
//  LECTURE SEULE. Jamais deploye (scripts/) -> aucun bump.
//  ⚠️ CHEMINS : fileURLToPath (§53).
// ============================================================================

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HARNAIS, GROUPES } from './mv-harnais-liste.mjs';
import { FORME } from './mv-lanceur.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (p) => readFileSync(path.join(root, p), 'utf8').replace(/\r\n/g, '\n');
const c = { g: s => `\x1b[32m${s}\x1b[0m`, r: s => `\x1b[31m${s}\x1b[0m`, dim: s => `\x1b[2m${s}\x1b[0m`, b: s => `\x1b[1m${s}\x1b[0m` };

// Etapes que la CI est SEULE a pouvoir jouer, hors de la liste. Vide : la CI
// ne lance que le lanceur. Une entree ici se JUSTIFIE en commentaire — sinon
// c'est le trou d'hier (14 portes que le poste ne voyait pas) qui revient.
const CI_SEUL = new Set([]);

const BASE = {
  pkg: JSON.parse(lire('package.json')),
  ci: lire('.github/workflows/ci.yml'),
  liste: HARNAIS.map(([cmd, g]) => [cmd, g || null]),
  groupes: { ...GROUPES },
  existe: (f) => existsSync(path.join(root, f)),
};

function jouer(S, silencieux) {
  let ok = 0, ko = 0; const rouges = [];
  const t = (nom, cond, detail) => {
    if (cond) ok++; else { ko++; rouges.push(nom); }
    if (!silencieux) { console.log('  ' + (cond ? c.g('✓') : c.r('✗')) + ' ' + nom); if (!cond && detail) console.log(c.dim(detail)); }
  };
  const sc = S.pkg.scripts || {};
  const invoc = (txt) => [...String(txt).matchAll(/node (scripts\/[\w./-]+\.mjs)(?:\s+(--[\w-]+))?/g)].map(m => m[1] + (m[2] ? ' ' + m[2] : ''));

  if (!silencieux) console.log('\n' + c.b('A. Une seule liste, un seul lanceur'));
  t('`check` = node scripts/mv-lanceur.mjs', sc.check === 'node scripts/mv-lanceur.mjs', '      check : ' + sc.check);
  t('`prebuild` = npm run check (aucune seconde copie)', sc.prebuild === 'npm run check', '      prebuild : ' + String(sc.prebuild).slice(0, 120));
  const copies = Object.entries(sc).filter(([k, v]) => k !== 'check' && invoc(v).length >= 5).map(([k]) => k);
  t('aucun script de package.json ne recopie une chaîne de contrôles (≥ 5 invocations)', copies.length === 0,
    '      recopie(s) : ' + copies.join(', ') + ' — la liste vit dans scripts/mv-harnais-liste.mjs');

  if (!silencieux) console.log('\n' + c.b('B. La liste est saine'));
  const horsForme = S.liste.filter(([cmd]) => !FORME.test(cmd)).map(([cmd]) => cmd);
  t('chaque commande a la forme « node scripts/x.mjs [--drapeau] »', horsForme.length === 0, '      ' + horsForme.join('\n      '));
  const absents = S.liste.map(([cmd]) => (FORME.exec(cmd) || [])[1]).filter(f => f && !S.existe(f));
  t('chaque script de la liste existe sur le disque', absents.length === 0, '      absent(s) : ' + absents.join(', '));
  const vus = new Set(), doublons = [];
  for (const [cmd] of S.liste) { if (vus.has(cmd)) doublons.push(cmd); vus.add(cmd); }
  t('aucune commande en double', doublons.length === 0, '      ' + doublons.join(', '));
  const gInconnus = [...new Set(S.liste.map(([, g]) => g).filter(g => g && !(g in S.groupes)))];
  t('chaque groupe cité existe dans GROUPES', gInconnus.length === 0, '      ' + gInconnus.join(', '));
  const gOrphelins = Object.keys(S.groupes).filter(g => !S.liste.some(([, x]) => x === g));
  t('aucun groupe sans commande', gOrphelins.length === 0, '      ' + gOrphelins.join(', '));
  t('le cliquet ESLint est dans la liste', vus.has('node scripts/lint-cliquet.mjs'),
    '      C\'est la porte qui a fait echouer le plus de push : elle doit rougir sur le poste.');
  t('le lanceur ne se lance pas lui-même', ![...vus].some(x => x.includes('mv-lanceur.mjs')));

  if (!silencieux) console.log('\n' + c.b('C. La CI joue la même liste, une seule fois'));
  const ciInv = invoc(S.ci);
  const lanceur = ciInv.filter(x => x.startsWith('scripts/mv-lanceur.mjs'));
  t('la CI lance le lanceur une fois, avec --continuer', lanceur.length === 1 && lanceur[0] === 'scripts/mv-lanceur.mjs --continuer',
    '      trouvé : ' + (lanceur.join(' · ') || '(rien)'));
  const hors = ciInv.filter(x => !x.startsWith('scripts/mv-lanceur.mjs') && !CI_SEUL.has(x));
  t('la CI ne lance aucun contrôle hors de la liste', hors.length === 0,
    '      ' + hors.join(', ') + ' — l\'ajouter à mv-harnais-liste.mjs, pas à ci.yml');
  const builds = [...S.ci.matchAll(/run:\s*npm run build\b([^\n]*)/g)].map(m => m[1].trim());
  t('la CI construit sans relancer prebuild (npm run build --ignore-scripts)',
    builds.length >= 1 && builds.every(b => /--ignore-scripts/.test(b)),
    '      ' + (builds.length ? builds.map(b => 'npm run build ' + b).join(' · ') : 'aucun build trouvé'));

  return { ok, ko, rouges };
}

if (!process.argv.includes('--contre')) {
  console.log('\n' + c.b('  MA VIGNE — Harnais des portes') + c.dim(`  (liste : ${HARNAIS.length} commandes, ${Object.keys(GROUPES).length} groupes)`));
  const r = jouer(BASE, false);
  console.log('\n  ' + r.ok + ' vert' + (r.ok > 1 ? 's' : '') + ' · ' + r.ko + ' rouge' + (r.ko > 1 ? 's' : '') + '\n');
  process.exit(r.ko ? 1 : 0);
}

// ── Contre-epreuves : chaque faute sur une COPIE des entrees, le controle vise doit rougir.
const cloneP = (S) => ({ ...S, pkg: JSON.parse(JSON.stringify(S.pkg)), liste: S.liste.map(x => [...x]), groupes: { ...S.groupes } });
const ANCIENNE = BASE.liste.map(([cmd]) => cmd).join(' && ');
const MUT = [
  ['check redevient la chaîne recopiée', S => { S.pkg.scripts.check = ANCIENNE; }, '`check` = node scripts/mv-lanceur.mjs'],
  ['prebuild redevient une copie', S => { S.pkg.scripts.prebuild = ANCIENNE; }, '`prebuild` = npm run check (aucune seconde copie)'],
  ['un script test:tout recopie la chaîne', S => { S.pkg.scripts['test:tout'] = ANCIENNE; }, 'aucun script de package.json ne recopie une chaîne de contrôles (≥ 5 invocations)'],
  ['une commande avec &&', S => { S.liste.push(['node scripts/preflight.mjs && node scripts/smoke.mjs', null]); }, 'chaque commande a la forme « node scripts/x.mjs [--drapeau] »'],
  ['un script absent du disque', S => { S.liste.push(['node scripts/mv-harnais-fantome.mjs', null]); }, 'chaque script de la liste existe sur le disque'],
  ['une commande en double', S => { S.liste.push([S.liste[3][0], null]); }, 'aucune commande en double'],
  ['un groupe inconnu', S => { S.liste[3][1] = 'groupe-fantome'; }, 'chaque groupe cité existe dans GROUPES'],
  ['un groupe orphelin', S => { S.groupes['orphelin'] = 'Personne'; }, 'aucun groupe sans commande'],
  ['le cliquet ESLint disparaît', S => { S.liste = S.liste.filter(([cmd]) => cmd !== 'node scripts/lint-cliquet.mjs'); }, 'le cliquet ESLint est dans la liste'],
  ['la CI relance un harnais à la main', S => { S.ci += '\n      - name: x\n        run: node scripts/mv-harnais-cible.mjs\n'; }, 'la CI ne lance aucun contrôle hors de la liste'],
  ['la CI oublie --continuer', S => { S.ci = S.ci.replace('node scripts/mv-lanceur.mjs --continuer', 'node scripts/mv-lanceur.mjs'); }, 'la CI lance le lanceur une fois, avec --continuer'],
  ['la CI rejoue tout via prebuild', S => { S.ci = S.ci.replace('npm run build --ignore-scripts', 'npm run build'); }, 'la CI construit sans relancer prebuild (npm run build --ignore-scripts)'],
];
console.log(c.b('\n  MA VIGNE — Harnais des portes · contre-épreuves'));
const temoin = jouer(BASE, true);
console.log('  ' + (temoin.ko ? c.r('✗ témoin ROUGE : ' + temoin.rouges.join(' · ')) : c.g('✓ témoin vert')));
let bad = temoin.ko ? 1 : 0;
for (const [nom, f, vise] of MUT) {
  const S = cloneP(BASE); f(S);
  const r = jouer(S, true);
  const ok = r.rouges.includes(vise);
  if (!ok) bad++;
  console.log('  ' + (ok ? c.g('✓ rougit : ') : c.r('✗ reste vert : ')) + nom + c.dim('  (' + vise.slice(0, 60) + ')'));
}
console.log('\n  ' + (MUT.length - (bad - (temoin.ko ? 1 : 0))) + '/' + MUT.length + ' contre-épreuves rougissent\n');
process.exit(bad ? 1 : 0);
