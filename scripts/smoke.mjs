#!/usr/bin/env node
// =============================================================================
// Ma Vigne — Smoke test de démarrage (palier 1)
// -----------------------------------------------------------------------------
// Ce que ça teste :
//   • L'appli BOOTE dans un vrai navigateur (Chromium headless) sans planter.
//   • AUCUNE exception JS non catchée (ReferenceError, TypeError d'un module,
//     un window.X manquant appelé au chargement…) — le type de bug qui casse
//     le bundle et que `node --check` NE VOIT PAS.
//   • Les fonctions critiques sont bien exposées sur window.
//
// Ce que ça NE teste PAS (→ palier 2, E2E avec émulateurs Firebase) :
//   • Login réel, lecture/écriture Firestore, App Check, clics dans les modules.
//   Le boot smoke est hermétique : le réseau Firebase/Google est COUPÉ, l'appli
//   dégrade proprement (roster de secours) → on teste le CODE, pas le backend.
//
// Pré-requis (une fois) :
//   npm i -D playwright
//   npx playwright install chromium
//
// Usage :
//   npm run build            # produit dist/  (fait par le script si absent ? non : à lancer avant)
//   node scripts/smoke.mjs                 # sert ./dist en local et le teste
//   node scripts/smoke.mjs --dir dist      # idem, dossier explicite
//   node scripts/smoke.mjs --url https://mavigneapp.fr   # teste une URL déployée
//   node scripts/smoke.mjs --tenant marchand-grillot     # ajoute ?tenant=… à l'URL
//   node scripts/smoke.mjs --headed        # navigateur visible (debug)
//
// Sortie : code 0 = OK, code 1 = échec (utilisable en CI / avant deploy).
// =============================================================================

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

// --- args ---
const args = process.argv.slice(2);
const getArg = (name, def = null) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def;
};
const flag = (name) => args.includes(name);
const DIR = resolve(getArg('--dir', 'dist'));
const URL_ARG = getArg('--url', null);
const TENANT = getArg('--tenant', null);
const HEADED = flag('--headed');
const BOOT_TIMEOUT_MS = parseInt(getArg('--timeout', '25000'), 10);

// --- fonctions critiques attendues sur window (dérivées des vrais fichiers) ---
// Volontairement SOFT : une absence = avertissement, pas un échec (certaines
// peuvent vivre dans un module non chargé au boot). L'échec DUR = exception JS.
const EXPECTED_GLOBALS = [
  'saveData', 'openOv', 'closeOv', 'goTo',
  '_dockBuild', '_dockSync', '_goLanding', '_canModule',
  '_mvApplyTrialGating', '_mvTrialBanner', '_mvCheckExpired', '_openEmailModal',
  '_switchSaison', '_saisonForDate', '_repairSessSaisons', '_migrateTachesSaison',
  '_recalcPlantationTrous', '_plantMinTrou', '_plantPlanTrous',
  '_parcelleWeatherGeo', '_communesActives', 'fetchMeteoCommunes', 'renderHomeMeteoCommunes',
];

// --- patterns d'erreurs BÉNIGNES (réseau coupé volontairement) → ignorées ---
const BENIGN = [
  /net::ERR_/i, /ERR_ABORTED/i, /ERR_FAILED/i, /Failed to load resource/i,
  /googleapis\.com/i, /cloudfunctions\.net/i, /gstatic\.com/i, /recaptcha/i,
  /grecaptcha/i, /appcheck/i, /app-check/i, /FIREBASE_APPCHECK/i,
  /Firebase: Error \(auth\//i, /firestore/i, /permission-denied/i,
  /unavailable/i, /Access to (fetch|XMLHttpRequest)/i, /blocked by CORS/i,
  /Fetch API cannot load/i, /openstreetmap/i, /unpkg\.com/i,
  /ERR_INTERNET_DISCONNECTED/i, /ERR_NAME_NOT_RESOLVED/i, /Quota/i,
  // Artefacts de l'ENVIRONNEMENT DE TEST (headless + service worker bloqué), pas des bugs de l'app :
  /navigator\.vibrate/i, /hasn't tapped/i, /chromestatus\.com/i,           // vibrate bloqué sans geste (headless)
  /Service Worker non enregistr/i, /reading 'scope'/i, /ServiceWorker/i,   // SW bloqué volontairement par le test
];
const isBenign = (txt) => BENIGN.some((re) => re.test(txt || ''));

// --- petit serveur statique (dist) ---
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};

function startStaticServer(rootDir) {
  return new Promise((res, rej) => {
    const server = http.createServer(async (req, resp) => {
      try {
        let p = decodeURIComponent(req.url.split('?')[0]);
        if (p === '/' || p === '') p = '/index.html';
        let fp = join(rootDir, p);
        try {
          const s = await stat(fp);
          if (s.isDirectory()) fp = join(fp, 'index.html');
        } catch { /* fallthrough → 404 */ }
        if (!existsSync(fp)) { resp.writeHead(404); resp.end('404'); return; }
        const buf = await readFile(fp);
        resp.writeHead(200, { 'Content-Type': MIME[extname(fp).toLowerCase()] || 'application/octet-stream' });
        resp.end(buf);
      } catch (e) { resp.writeHead(500); resp.end('500'); }
    });
    server.on('error', rej);
    server.listen(0, '127.0.0.1', () => res(server)); // port 0 = libre
  });
}

// --- ANSI ---
const c = { g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, y: (s) => `\x1b[33m${s}\x1b[0m`, dim: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m` };

async function main() {
  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    console.error(c.r('\n✖ Playwright non installé.'));
    console.error('  Lance :  ' + c.b('npm i -D playwright') + '  puis  ' + c.b('npx playwright install chromium') + '\n');
    process.exit(2);
  }
  const { chromium } = playwright;

  // Résoudre l'URL de test
  let server = null, baseUrl = URL_ARG;
  if (!baseUrl) {
    if (!existsSync(DIR)) {
      console.error(c.r(`\n✖ Dossier introuvable : ${DIR}`));
      console.error('  Lance ' + c.b('npm run build') + ' d\'abord, ou passe ' + c.b('--url https://mavigneapp.fr') + '\n');
      process.exit(2);
    }
    server = await startStaticServer(DIR);
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}/`;
    console.log(c.dim(`  Serveur statique : ${baseUrl}  (dossier ${DIR})`));
  }
  const testUrl = baseUrl + (TENANT ? (baseUrl.includes('?') ? '&' : '?') + 'tenant=' + TENANT : '');

  const hardErrors = [];   // exceptions non catchées + console.error non bénignes
  const benignSeen = [];   // pour info

  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({ serviceWorkers: 'block' }); // pas de SW → pas de reload boot.js
  // Force le token debug App Check avant tout code de l'appli
  await context.addInitScript(() => { try { self.FIREBASE_APPCHECK_DEBUG_TOKEN = true; } catch (e) {} });
  const page = await context.newPage();

  // Réseau Firebase/Google COUPÉ → hermétique, pas de contact prod, l'appli dégrade
  await page.route('**/*', (route) => {
    const u = route.request().url();
    if (/googleapis\.com|cloudfunctions\.net|gstatic\.com|recaptcha|unpkg\.com|tile\.openstreetmap\.org|api\.open-meteo\.com|api-adresse\.data\.gouv\.fr/i.test(u)) {
      return route.abort();
    }
    return route.continue();
  });

  page.on('pageerror', (err) => {
    // Exception JS non catchée = quasi toujours un vrai bug → DUR (pas de filtre)
    hardErrors.push('[pageerror] ' + (err && err.message ? err.message : String(err)));
  });
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const t = msg.text();
    if (isBenign(t)) { benignSeen.push(t); return; }
    hardErrors.push('[console.error] ' + t);
  });

  console.log(c.dim(`  Chargement : ${testUrl}`));
  let bootOk = false, bootErr = null;
  try {
    await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: BOOT_TIMEOUT_MS });
    // Signal de démarrage universel : l'appli pose window.__MV_BOOTED
    await page.waitForFunction(() => window.__MV_BOOTED === true, { timeout: BOOT_TIMEOUT_MS });
    bootOk = true;
  } catch (e) {
    bootErr = e && e.message ? e.message : String(e);
  }

  // Vérif des globals (soft)
  let globalsReport = { present: [], missing: [] };
  if (bootOk) {
    globalsReport = await page.evaluate((names) => {
      const present = [], missing = [];
      for (const n of names) (typeof window[n] === 'function' ? present : missing).push(n);
      return { present, missing };
    }, EXPECTED_GLOBALS);
  }

  await browser.close();
  if (server) server.close();

  // ---- Rapport ----
  console.log('\n' + c.b('── Smoke test de démarrage ─────────────────────────────'));
  if (bootOk) {
    console.log(c.g('  ✓ Boot OK') + c.dim('  (window.__MV_BOOTED === true)'));
  } else {
    console.log(c.r('  ✖ Boot ÉCHEC') + c.dim('  — window.__MV_BOOTED jamais passé à true dans le délai'));
    if (bootErr) console.log(c.dim('    ' + bootErr));
    hardErrors.unshift('[boot] L\'appli n\'a pas démarré (window.__MV_BOOTED absent).');
  }

  if (bootOk) {
    console.log(`  ${globalsReport.missing.length === 0 ? c.g('✓') : c.y('!')} Globals critiques : ${c.b(globalsReport.present.length + '/' + EXPECTED_GLOBALS.length)} exposés`);
    if (globalsReport.missing.length) {
      console.log(c.y('    manquants : ') + globalsReport.missing.join(', '));
      console.log(c.dim('    (soft — peut vivre dans un module non chargé au boot ; à vérifier si inattendu)'));
    }
  }

  if (benignSeen.length) console.log(c.dim(`  ${benignSeen.length} erreur(s) réseau ignorée(s) (Firebase/reCAPTCHA/tiles coupés volontairement)`));

  if (hardErrors.length) {
    console.log('\n' + c.r(c.b(`  ✖ ${hardErrors.length} erreur(s) JS bloquante(s) :`)));
    for (const e of hardErrors) console.log(c.r('    • ') + e);
    console.log('\n' + c.r(c.b('  RÉSULTAT : ÉCHEC')) + '\n');
    process.exit(1);
  }
  console.log('\n' + c.g(c.b('  RÉSULTAT : OK')) + c.dim('  — l\'appli démarre proprement, aucune exception.') + '\n');
  process.exit(0);
}

main().catch((e) => { console.error(c.r('Erreur du harnais : ' + (e && e.stack || e))); process.exit(2); });
