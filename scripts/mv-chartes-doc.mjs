#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Cliquet des chartes de document
// ═══════════════════════════════════════════════════════════════════════════
//  MV_DOC (utils.js) existe parce que les documents ne se ressemblaient pas :
//  neuf reglages de marges differents, portrait et paysage melanges, trois
//  documents seulement chargeant les polices du domaine. La primitive a ete
//  ecrite, quatre documents l'ont adoptee — et les suivants ont continue a
//  ecrire leur propre <!DOCTYPE>. Personne ne le voyait : un document hors
//  charte fonctionne parfaitement, il est juste etranger aux autres.
//
//  Ce script REGARDE. Pour chaque generateur de document, il dit :
//    · s'il passe par window._mvDocOpen   -> charte MV_DOC
//    · sinon, comment il ouvre            -> document.write ou Blob
//    · sa regle @page, s'il en pose une   -> la marge qu'il s'invente
//
//  Et il ECHOUE si le nombre de documents hors charte AUGMENTE. C'est un
//  cliquet, pas un mur : il ne bloque pas ce qui existe, il empeche seulement
//  qu'un document neuf naisse hors charte en silence.
//
//  ⚠️ LE PLAFOND NE DOIT QUE DESCENDRE. On ne le releve jamais pour faire
//  taire le script : on convertit, puis on baisse le plafond.
//
//  Usage : node scripts/mv-chartes-doc.mjs [racine] [--liste]
//  Exit 0 si le plafond est tenu, 1 sinon.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(process.argv.find(a => !a.startsWith('-') && a !== process.argv[0] && a !== process.argv[1]) || path.join(ICI, '..'));
const LISTE  = process.argv.includes('--liste');

// ── Le plafond, tenu a la main, qui ne doit que descendre ──────────────────
//  13/08/2026 : 4 documents hors MV_DOC.
//    · registre des manipulations, bilan de campagne, inventaire des futs
//      -> ils partagent une SECONDE charte, non ecrite mais coherente entre
//         eux (encre #14110D, filet #8A5A38 -> #C2871E -> #3D6B27, Cormorant,
//         marge 14mm 12mm). Plus riche que MV_DOC, ecrite apres elle. A
//         arbitrer : remonter ce hero dans la charte, plutot que l'aplatir.
//    · releve mensuel, registre phyto (paysage 9mm), rapport de saison
//      (margin:0), releve individuel (10mm) -> vrais retardataires. Leur
//      conversion CHANGE LA LARGEUR UTILE : elle demande un rendu pour etre
//      validee, pas une relecture de source.
const PLAFOND = 7;

// ── Les generateurs connus. Un document = une fonction qui produit une page. ─
const DOCS = [
  ['src/app.js',      'lancerExportEntretienPDF', 'Carnet d\u2019entretien'],
  ['src/app.js',      'exportRapportSaison',      'Rapport de saison'],
  ['src/reglages.js', 'exportPDFMois',            'Relev\u00e9 mensuel d\u2019heures'],
  ['src/reglages.js', 'exportPDFPhyto',           'Registre phytosanitaire'],
  ['src/planning.js', 'planExportPDF',            'Relev\u00e9 individuel'],
  ['src/planning.js', '_paDoc',                   'Planning de l\u2019ann\u00e9e'],
  ['src/cave.js',     'exportVendRecoltesPdf',    'R\u00e9coltes de la vendange'],
  ['src/cave.js',     'generateCaveExport',       'Suivi d\u2019\u00e9levage'],
  ['src/cave.js',     '_rmExport',                'Registre des manipulations'],
  ['src/cave.js',     '_bcExport',                'Bilan de campagne'],
  ['src/cave.js',     '_matDoc',                  'Contr\u00f4le de maturit\u00e9'],
  ['src/cave.js',     '_cuvDoc',                  'Cahier de cuverie'],
  ['src/reserve.js',  '_rsvExportPdf',            'Inventaire des intrants'],
  ['src/reserve.js',  '_rsvExportFutsPdf',        'Inventaire des f\u00fbts'],
  ['src/reglages.js', '_vgnDoc',                  '\u00c9tat du vignoble']
];

function corps(src, nom) {
  const esc = nom.replace(/\$/g, '\\$');
  const m = src.match(new RegExp('\\nfunction ' + esc + '\\s*\\(')) ||
            src.match(new RegExp('\\nwindow\\.' + esc + '\\s*=\\s*function\\s*\\('));
  if (!m) return null;
  let i = m.index + 1, k = src.indexOf('{', i), d = 0;
  for (;; k++) {
    const c = src[k];
    if (c === undefined) return null;
    if (c === '{') d++;
    else if (c === '}') { d--; if (!d) break; }
  }
  return src.slice(i, k + 1);
}

const cache = {};
const lire = f => (cache[f] !== undefined ? cache[f]
  : (cache[f] = (() => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch { return null; } })()));

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const vert = s => useColor ? `\x1b[32m${s}\x1b[0m` : s;
const rge  = s => useColor ? `\x1b[31m${s}\x1b[0m` : s;
const dim  = s => useColor ? `\x1b[2m${s}\x1b[0m` : s;

const lignes = [], absents = [];
let hors = 0;
for (const [f, fn, titre] of DOCS) {
  const src = lire(f);
  if (!src) { absents.push(f + ' (fichier absent)'); continue; }
  const c = corps(src, fn);
  if (!c) { absents.push(fn + ' dans ' + f); continue; }
  // ⚠️ On cherche l'APPEL, pas la mention : le garde
  //   `if(typeof window._mvDocOpen!=='function')` cite le nom sans appeler.
  //   Un document qui perdrait son appel mais garderait son garde serait
  //   compte a la charte — faux positif trouve par la contre-epreuve.
  const charte = /_mvDocOpen\s*\(/.test(c);
  if (!charte) hors++;
  const pg = c.match(/@page\{([^}]{0,50})/);
  const ouv = charte ? 'MV_DOC'
    : (c.indexOf('document.write') !== -1 ? 'document.write'
      : (c.indexOf('createObjectURL') !== -1 ? 'Blob' : '?'));
  lignes.push({ titre, f: f.replace('src/', ''), fn, charte, ouv, page: pg ? pg[1] : '' });
}

console.log('\n  MA VIGNE — Chartes de document  (' + lignes.length + ' g\u00e9n\u00e9rateurs)\n');
console.log('  ' + 'Document'.padEnd(28) + 'Fichier'.padEnd(14) + 'Charte'.padEnd(9) + 'Ouverture'.padEnd(16) + '@page');
console.log('  ' + '-'.repeat(94));
for (const l of lignes.sort((a, b) => (a.charte === b.charte ? 0 : a.charte ? 1 : -1))) {
  console.log('  ' + l.titre.padEnd(28) + l.f.padEnd(14)
    + (l.charte ? vert('MV_DOC '.padEnd(9)) : rge('hors   '.padEnd(9)))
    + l.ouv.padEnd(16) + dim(l.page));
}
if (absents.length) {
  console.log('\n  ' + rge('Introuvables : ') + absents.join(', '));
  console.log('  ' + dim('(une fonction renommee sans mettre a jour ce script fausse le compte)'));
}
console.log('\n  ' + lignes.filter(l => l.charte).length + ' \u00e0 la charte \u00b7 '
  + hors + ' hors charte \u00b7 plafond ' + PLAFOND);

if (absents.length) {
  console.log('  ' + rge('\u2717 Le recensement est incomplet : corrigez la liste avant de conclure.') + '\n');
  process.exit(1);
}
if (hors > PLAFOND) {
  console.log('  ' + rge('\u2717 La dette AUGMENTE (' + hors + ' > ' + PLAFOND + ').')
    + ' Un document neuf doit passer par window._mvDocOpen.\n');
  process.exit(1);
}
if (hors < PLAFOND) {
  console.log('  ' + vert('\u2713 Sous le plafond') + ' \u2014 abaissez PLAFOND \u00e0 ' + hors
    + ' dans ce script pour verrouiller le gain.\n');
  process.exit(0);
}
console.log('  ' + vert('\u2713 Plafond tenu.') + '\n');
