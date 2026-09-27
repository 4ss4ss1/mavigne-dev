#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   VER-1 (§184) — PUBLIE /version.json AU BUILD
   Lancé par `npm run build` après inject-precache. Écrit dist/version.json :
     { "app": APP_VERSION, "format": MV_FORMAT, "build": <date ISO> }
   lus dans src/utils.js. Les appareils le relisent (app.js, _mvVerifierVersion) ;
   un format installé plus bas que celui-ci = version périmée, écritures suspendues.
   Servi sans cache (firebase.json) et jamais intercepté par le service worker.
   `--test` : vérifie la lecture des constantes, sans écrire (dans check).
   ⚠️ CHEMINS : fileURLToPath (20/08).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(RACINE, 'src', 'utils.js'), 'utf8');
const app = (src.match(/export const APP_VERSION = '([0-9.]+)';/) || [])[1];
const format = parseInt((src.match(/export const MV_FORMAT = (\d+);/) || [])[1], 10);
if (!app || !(format > 0)) {
  console.error('✖ mv-version-json : APP_VERSION ou MV_FORMAT introuvable dans src/utils.js');
  process.exit(1);
}
if (process.argv.includes('--test')) {
  console.log('  ✓ version.json lirait : app ' + app + ', format ' + format);
  process.exit(0);
}
const dist = path.join(RACINE, 'dist');
if (!fs.existsSync(dist)) { console.error('✖ mv-version-json : dist/ absent — lancer après vite build'); process.exit(1); }
fs.writeFileSync(path.join(dist, 'version.json'), JSON.stringify({ app, format, build: new Date().toISOString() }) + '\n');
console.log('  ✓ dist/version.json : app ' + app + ', format ' + format);
