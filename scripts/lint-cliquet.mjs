#!/usr/bin/env node
// ============================================================================
//  MA VIGNE — Cliquet ESLint
//  --------------------------------------------------------------------------
//  Meme logique que preflight-baseline.json : on ne demande pas zero erreur du
//  jour au lendemain, on interdit d'en AJOUTER une. Le plafond ne monte jamais ;
//  chaque fois qu'une erreur connue est corrigee, on BAISSE le plafond ici.
//
//  Usage :  node scripts/lint-cliquet.mjs
//  Sortie :  0 si erreurs <= PLAFOND, 1 sinon.
//  LECTURE SEULE. Jamais deploye (scripts/) -> aucun bump.
// ============================================================================

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// ---- LE PLAFOND ------------------------------------------------------------
// 1 erreur toleree au 10/08/2026 :
//   src/app.js:9498  'i' is already defined (no-redeclare)
//   -> deux boucles `for(var i=1;i<=plan;i++)` dans le meme bloc. SANS EFFET
//      (la 2e reutilise le meme compteur, deja remis a 1). Cosmetique.
//      Corrige seule, elle imposerait un bump APP + SW pour un renommage :
//      a plier dans le prochain lot qui touche app.js de toute facon.
//      ⚠️ EN LA CORRIGEANT, PASSER CE PLAFOND A 0.
const PLAFOND = 1;

// ---- execution -------------------------------------------------------------
const bin = path.join(root, 'node_modules', 'eslint', 'bin', 'eslint.js');
let out = '';
try {
  out = execFileSync(process.execPath, [bin, 'src/', '-f', 'json'],
    { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (e) {
  // eslint sort en 1 des qu'il y a une erreur : le JSON est quand meme sur stdout.
  out = (e && e.stdout) ? String(e.stdout) : '';
  if (!out.trim()) {
    console.error('✖ ESLint n\u2019a rien renvoye. Dependances installees ? (npm ci)');
    if (e && e.stderr) console.error(String(e.stderr).slice(0, 2000));
    process.exit(2);
  }
}

let rapport;
try { rapport = JSON.parse(out); }
catch { console.error('✖ Sortie ESLint illisible (JSON invalide).'); process.exit(2); }

// ---- comptage --------------------------------------------------------------
let erreurs = 0, avertissements = 0;
const lignes = [];
for (const f of rapport) {
  erreurs += f.errorCount;
  avertissements += f.warningCount;
  for (const m of f.messages) {
    if (m.severity !== 2) continue;
    const rel = path.relative(root, f.filePath).split(path.sep).join('/');
    lignes.push(`  ${rel}:${m.line}:${m.column}  ${m.message}  (${m.ruleId || '?'})`);
  }
}

console.log('\n  MA VIGNE — Cliquet ESLint');
if (lignes.length) { console.log(''); lignes.forEach(l => console.log(l)); }
console.log(`\n  ${erreurs} erreur(s) · ${avertissements} avertissement(s) · plafond : ${PLAFOND}`);

if (erreurs > PLAFOND) {
  console.error(`\n  ✖ ${erreurs} erreurs pour un plafond de ${PLAFOND} : une erreur NOUVELLE a ete introduite.`);
  console.error('    Corriger, ou — si elle est deliberee — remonter PLAFOND en le JUSTIFIANT ici.\n');
  process.exit(1);
}

if (erreurs < PLAFOND) {
  console.log(`\n  ✓ Sous le plafond. ★ BAISSER PLAFOND a ${erreurs} dans scripts/lint-cliquet.mjs.\n`);
  process.exit(0);
}

console.log('\n  ✓ Aucune erreur nouvelle.\n');
process.exit(0);
