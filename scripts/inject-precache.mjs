// ════════════════════════════════════════════════════════════════════
// MA VIGNE — scripts/inject-precache.mjs — Zéro défaut PWA (v4.37 — idempotent)
// Exécuté APRÈS `vite build` : injecte la liste réelle des assets hashés
// du build dans dist/sw.js (marqueur /*__MV_PRECACHE__*/).
// Le SW précache alors TOUT le bundle de façon atomique à l'install :
// si un seul fichier ne peut pas être téléchargé, l'installation échoue
// et l'ancienne version reste active — jamais d'app à moitié mise à jour.
// Usage : "build": "vite build && node scripts/inject-precache.mjs"
// Idempotent : ré-exécutable sans danger (remplace le contenu de la liste,
// que le marqueur soit encore présent ou déjà injecté).
// ════════════════════════════════════════════════════════════════════
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

const DIST = 'dist';
const ASSETS_DIR = join(DIST, 'assets');
const SW_PATH = join(DIST, 'sw.js');
// Cible la déclaration entière `const PRECACHE_ASSETS = [ ... ];` plutôt qu'un
// marqueur consommable : on peut donc relancer le script autant de fois que voulu.
const ASSIGN_RE = /(const\s+PRECACHE_ASSETS\s*=\s*)\[[\s\S]*?\](\s*;)/;

let files;
try {
  files = readdirSync(ASSETS_DIR).filter(f => statSync(join(ASSETS_DIR, f)).isFile());
} catch (e) {
  console.error('[inject-precache] ✗ dist/assets introuvable — lancer après `vite build`.');
  process.exit(1);
}
if (!files.length) {
  console.error('[inject-precache] ✗ Aucun asset dans dist/assets — build incomplet ?');
  process.exit(1);
}

const urls = files.map(f => '/assets/' + f);
let sw = readFileSync(SW_PATH, 'utf8');
if (!ASSIGN_RE.test(sw)) {
  console.error('[inject-precache] ✗ Déclaration `const PRECACHE_ASSETS = [...]` introuvable dans dist/sw.js — sw.js obsolète ?');
  process.exit(1);
}
sw = sw.replace(ASSIGN_RE, '$1' + JSON.stringify(urls) + '$2');
writeFileSync(SW_PATH, sw);
console.log('[inject-precache] ✓ ' + urls.length + ' asset(s) précaché(s) dans dist/sw.js :');
urls.forEach(u => console.log('  · ' + u));
