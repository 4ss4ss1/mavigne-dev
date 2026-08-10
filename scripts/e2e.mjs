#!/usr/bin/env node
// =============================================================================
// Ma Vigne — E2E émulateurs (palier 2)
// -----------------------------------------------------------------------------
// Ce que ça teste (bien plus que le smoke) :
//   • Login RÉEL via le roster (repli lecture directe Firestore) + mot de passe.
//   • RENDU de CHAQUE module du dock (Vigne, Tracteur, Cave, Planning, Pilotage,
//     Réglages) avec de VRAIES données seedées → attrape les erreurs de rendu
//     (TypeError sur une parcelle, un module qui plante à l'affichage…).
//   • AUCUNE exception JS non catchée sur tout le parcours.
//
// Pré-requis (voir e2e-README.md) :
//   1. Java 11+ (JDK)                     → java -version
//   2. npm i -D playwright firebase-admin ; npx playwright install chromium
//   3. Branchement émulateur AJOUTÉ dans src/firebase.js (voir e2e-README.md)
//   4. Émulateurs démarrés :   npm run emu     (terminal séparé)
//   5. Tenant seedé :          npm run seed:e2e
//   6. Lancer :                npm run test:e2e   (démarre le serveur dev tout seul)
//
// Sortie : code 0 = OK, code 1 = échec.
// =============================================================================

import { spawn } from 'node:child_process';
import http from 'node:http';

const DEV_PORT = 5199;                         // port dédié au test (évite ton npm run dev sur 5173)
const DEV_URL = 'http://localhost:' + DEV_PORT;
const TENANT  = 'e2e-test';
const EMAIL   = 'nico@e2e.test';
const PWD     = 'vigne21';
const HEADED  = process.argv.includes('--headed');
const PAGES   = ['home', 'tracteur', 'cave', 'planning', 'pilotage', 'reglages'];

const c = { g:(s)=>`\x1b[32m${s}\x1b[0m`, r:(s)=>`\x1b[31m${s}\x1b[0m`, y:(s)=>`\x1b[33m${s}\x1b[0m`, dim:(s)=>`\x1b[2m${s}\x1b[0m`, b:(s)=>`\x1b[1m${s}\x1b[0m` };

// Erreurs bénignes (reCAPTCHA localhost / Functions émulateur absent / etc.) → ignorées
const BENIGN = [
  /recaptcha/i, /grecaptcha/i, /appcheck/i, /app-check/i, /FIREBASE_APPCHECK/i,
  /net::ERR_CONNECTION_REFUSED/i, /ERR_ABORTED/i, /Failed to load resource/i,
  /5001/, /getLoginRoster/i, /cloudfunctions/i, /functions\/error/i,
  /\[EMU\]/i, /Quota/i, /permission-denied.*ephy/i,
  // Artefacts d'environnement de test (headless + service worker bloqué) :
  /Service Worker non enregistr/i, /reading 'scope'/i, /ServiceWorker/i,
  /navigator\.vibrate/i, /hasn't tapped/i, /chromestatus/i,
];
const isBenign = (t) => BENIGN.some((re) => re.test(t || ''));

function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((res, rej) => {
    const tick = () => {
      const req = http.get(url, (r) => { r.destroy(); res(true); });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) rej(new Error('serveur dev injoignable : ' + url));
        else setTimeout(tick, 500);
      });
    };
    tick();
  });
}

// GET simple avec timeout → renvoie le status HTTP, rejette si connexion impossible
function emuGet(url, headers) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers: headers || {} }, (r) => { r.resume(); resolve(r.statusCode); });
    req.on('error', reject);
    req.setTimeout(4000, () => req.destroy(new Error('timeout')));
  });
}

// Vérifie AVANT tout : émulateurs Firestore/Auth joignables ET tenant e2e-test seedé
async function checkEmulators() {
  const FS = 'http://127.0.0.1:8080', AUTH = 'http://127.0.0.1:9099';
  try { await emuGet(FS + '/'); }
  catch { throw new Error('Émulateur Firestore injoignable (port 8080).\n     → Ouvre un AUTRE terminal et lance :  npm run emu   (et laisse-le tourner)'); }
  try { await emuGet(AUTH + '/'); }
  catch { throw new Error('Émulateur Auth injoignable (port 9099).\n     → npm run emu  (démarre Auth + Firestore)'); }
  // doc membres du tenant seedé — REST émulateur, bypass des règles via "Bearer owner"
  const docUrl = FS + '/v1/projects/mavigne-a0fd5/databases/(default)/documents/mavigne_e2e-test/membres';
  let status;
  try { status = await emuGet(docUrl, { Authorization: 'Bearer owner' }); }
  catch { throw new Error('Lecture de l\'émulateur Firestore impossible (port 8080).'); }
  if (status === 404) throw new Error('Tenant « e2e-test » absent de l\'émulateur (pas encore seedé).\n     → Lance :  npm run seed:e2e   puis relance ce test');
}

async function main() {
  let playwright;
  try { playwright = await import('playwright'); }
  catch { console.error(c.r('\n✖ Playwright non installé — npm i -D playwright && npx playwright install chromium\n')); process.exit(2); }
  const { chromium } = playwright;

  // 0) Pré-check : émulateurs joignables + tenant seedé (message clair sinon)
  try { await checkEmulators(); console.log(c.g('  ✓ Émulateurs joignables + tenant « e2e-test » seedé')); }
  catch (e) { console.error('\n' + c.r('✖ ' + e.message) + '\n'); process.exit(2); }

  // 1) Démarrer le serveur dev (Vite) en sous-processus
  console.log(c.dim('  Démarrage du serveur dev (npm run dev)…'));
  const dev = spawn('npm', ['run', 'dev', '--', '--port', String(DEV_PORT), '--strictPort', '--force'], { shell: true, stdio: 'ignore' });
  let devKilled = false;
  const killDev = () => { if (!devKilled) { devKilled = true; try { process.platform === 'win32' ? spawn('taskkill', ['/pid', String(dev.pid), '/f', '/t'], { shell: true }) : dev.kill('SIGTERM'); } catch {} } };
  process.on('exit', killDev);

  try {
    await waitForServer(DEV_URL);
    console.log(c.dim('  Serveur dev prêt : ' + DEV_URL));
  } catch (e) { console.error(c.r('✖ ' + e.message)); killDev(); process.exit(2); }

  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({ serviceWorkers: 'block' });
  // Active le branchement émulateur AVANT tout code de l'app
  await context.addInitScript(() => { window.__MV_USE_EMULATOR = true; });
  const page = await context.newPage();

  const errorsByStep = {};
  let stepLabel = 'boot';
  let emuHookFired = false;   // témoin : le hook émulateur de firebase.js s'est-il exécuté ?
  const pushErr = (src, txt) => {
    if (src === 'console' && isBenign(txt)) return;
    (errorsByStep[stepLabel] = errorsByStep[stepLabel] || []).push(`[${src}] ${txt}`);
  };
  page.on('pageerror', (err) => pushErr('pageerror', err && err.message ? err.message : String(err)));
  page.on('console', (m) => {
    const t = m.text();
    if (/\[EMU\]/.test(t)) emuHookFired = true;
    if (m.type() === 'error') pushErr('console', t);
  });

  const hard = (msg) => { (errorsByStep[stepLabel] = errorsByStep[stepLabel] || []).push(msg); };

  try {
    // 2) Charger + attendre le boot
    stepLabel = 'boot';
    await page.goto(DEV_URL + '/?tenant=' + TENANT, { waitUntil: 'domcontentloaded', timeout: 45000 });
    // Confirme la connexion émulateur (log [EMU] émis par le hook firebase.js)
    await page.waitForFunction(() => window.__MV_BOOTED === true, { timeout: 45000 }).catch(() => hard('window.__MV_BOOTED jamais true (boot KO)'));

    // 3) Login via le roster (repli Firestore peuple la liste depuis le seed)
    stepLabel = 'login';
    try {
      await page.getByText('Nico E2E', { exact: false }).first().click({ timeout: 20000 });
      await page.fill('#login-pwd-input', PWD, { timeout: 10000 });
      await page.click('#login-pwd-btn', { timeout: 10000 });
      // Attendre la fin du login : écran masqué OU dock construit OU currentUser posé
      await page.waitForFunction(() => {
        const ls = document.getElementById('login-screen');
        const hidden = !ls || ls.style.display === 'none' || ls.offsetParent === null;
        return hidden && (!!window.currentUser || !!document.getElementById('mv-dock'));
      }, { timeout: 30000 });
      console.log(c.g('  ✓ Login OK') + c.dim('  (' + EMAIL + ')'));
    } catch (e) {
      hard('Login échoué : ' + (e && e.message ? e.message : String(e)) + ' — vérifier que les émulateurs tournent + seed lancé + hook firebase.js présent');
    }

    // 4) Parcourir chaque page du dock
    for (const p of PAGES) {
      stepLabel = 'page:' + p;
      try {
        await page.evaluate((pg) => { if (window.goTo) window.goTo(pg); }, p);
        await page.waitForTimeout(1500); // laisser le rendu + les fetch se faire
      } catch (e) {
        hard('Navigation ' + p + ' impossible : ' + (e && e.message ? e.message : String(e)));
      }
    }

    // 5) Interactions clés — couvrent les bugs au CLIC (type incident openNewSession/DEBUG)
    // a) Changer de saison (chemin sensible à la désync visuSaison, §11b)
    stepLabel = 'action:saison';
    try {
      await page.evaluate(() => { if (window._switchSaison) window._switchSaison('Hiver 2025-2026', true); });
      await page.waitForTimeout(600);
      await page.evaluate(() => { if (window._switchSaison) window._switchSaison('Printemps 2026', true); });
      await page.waitForTimeout(600);
    } catch (e) { hard('Changement de saison : ' + (e && e.message ? e.message : String(e))); }

    // b) Créer une session : clic RÉEL sur le FAB #trac-fab → openNewSession() (teste câblage + fonction)
    stepLabel = 'action:session';
    try {
      await page.evaluate(() => { if (window.goTo) window.goTo('tracteur'); });
      await page.waitForTimeout(800);
      await page.click('#trac-fab', { timeout: 8000 });
      await page.waitForTimeout(1000);
      // refermer l'overlay ouvert pour ne pas gêner la suite (les overlays n'ont pas de fermeture Escape)
      await page.evaluate(() => { document.querySelectorAll('.overlay.open').forEach((o) => { try { window.closeOv && window.closeOv(null, o.id); } catch (e) {} o.classList.remove('open'); }); });
    } catch (e) { hard('Créer une session (#trac-fab → openNewSession) : ' + (e && e.message ? e.message : String(e))); }

    // c) Ouvrir le détail d'une parcelle : rendu tâches + trous + météo avec données réelles
    stepLabel = 'action:parcelle';
    try {
      await page.evaluate(() => { if (window.openDP) window.openDP('Parcelle Test A'); });
      await page.waitForTimeout(1000);
      await page.evaluate(() => { document.querySelectorAll('.overlay.open').forEach((o) => { try { window.closeOv && window.closeOv(null, o.id); } catch (e) {} o.classList.remove('open'); }); });
    } catch (e) { hard('Ouvrir le détail parcelle (openDP) : ' + (e && e.message ? e.message : String(e))); }
  } finally {
    await browser.close();
    killDev();
  }

  // ---- Rapport ----
  console.log('\n' + c.b('── E2E émulateurs ──────────────────────────────────────'));
  console.log(`  ${emuHookFired ? c.g('✓') : c.y('!')} Hook émulateur firebase.js : ${emuHookFired ? c.g('exécuté ([EMU] vu)') : c.y('PAS vu → firebase.js corrigé non chargé (mauvais serveur/cache ?)')}`);
  const steps = ['boot', 'login', ...PAGES.map((p) => 'page:' + p), 'action:saison', 'action:session', 'action:parcelle'];
  let totalHard = 0;
  for (const s of steps) {
    const errs = errorsByStep[s] || [];
    totalHard += errs.length;
    let label;
    if (s.startsWith('page:')) label = 'Page ' + s.slice(5);
    else if (s.startsWith('action:')) label = 'Action ' + s.slice(7);
    else label = s[0].toUpperCase() + s.slice(1);
    console.log(`  ${errs.length ? c.r('✖') : c.g('✓')} ${label}${errs.length ? c.r('  (' + errs.length + ')') : ''}`);
    for (const e of errs) console.log(c.r('      • ') + e);
  }

  if (totalHard) {
    console.log('\n' + c.r(c.b('  RÉSULTAT : ÉCHEC')) + c.dim(`  — ${totalHard} problème(s) sur le parcours.`) + '\n');
    process.exit(1);
  }
  console.log('\n' + c.g(c.b('  RÉSULTAT : OK')) + c.dim('  — login + tous les modules rendus sans exception.') + '\n');
  process.exit(0);
}

main().catch((e) => { console.error(c.r('Erreur du harnais : ' + (e && e.stack || e))); process.exit(2); });
