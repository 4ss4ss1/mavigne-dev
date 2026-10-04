#!/usr/bin/env node
// ── LOTS-1 (§231) — POSER LA MARQUE D'UN LOT, juste avant de faire le zip ──────────────────────────────────
//   node scripts/mv-lot-marque.mjs <LOT> [--section §NNN] [--inclut LOT-A,LOT-B]
// Écrit lots/<LOT>.json : la base (HEAD), les lots contenus (zip cumulatif), et l'empreinte SHA-256 de chaque fichier
// modifié ou nouveau par rapport à HEAD (hors lots/). La marque part dans le zip ; scripts/mv-lots.mjs la vérifie.
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { empreinteDe } from './mv-lots.mjs';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const a = process.argv.slice(2), lot = a[0];
if (!lot || !/^[A-Z0-9][A-Z0-9+_-]*$/.test(lot)) { console.error('usage : node scripts/mv-lot-marque.mjs <LOT> [--section §NNN] [--inclut A,B]'); process.exit(2); }
const opt = k => { const i = a.indexOf(k); return i > 0 ? a[i + 1] : ''; };
const git = (...x) => execFileSync('git', x, { cwd: R, encoding: 'utf8' });
const base = git('rev-parse', 'HEAD').trim();
const lignes = git('status', '--porcelain', '-uall').split('\n').filter(Boolean);
const fichiers = {};
lignes.forEach(l => {
  const etat = l.slice(0, 2), f = l.slice(3).trim().replace(/^"|"$/g, '');
  if (f.startsWith('lots/') || etat.includes('D')) return;
  fichiers[f] = empreinteDe(fs.readFileSync(path.join(R, f)));
});
const marque = { lot, section: opt('--section'), base, inclut: (opt('--inclut') || '').split(',').filter(Boolean), date: new Date().toISOString().slice(0, 10), fichiers };
fs.mkdirSync(path.join(R, 'lots'), { recursive: true });
fs.writeFileSync(path.join(R, 'lots', lot + '.json'), JSON.stringify(marque, null, 2) + '\n');
console.log('marque posée : lots/' + lot + '.json — ' + Object.keys(fichiers).length + ' fichiers, base ' + base.slice(0, 7));
