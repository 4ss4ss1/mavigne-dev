#!/usr/bin/env node
// =============================================================================
// Ma Vigne — E2E LOCAL (palier 2, mode « données injectées »)
// -----------------------------------------------------------------------------
// ZÉRO émulateur, ZÉRO Java, UN seul terminal :  npm run test:e2e
//
// Principe :
//   • Réseau Firebase COUPÉ (routes abort) → aucun contact avec la prod.
//     Les services publics (Leaflet/unpkg, tuiles OSM, Open-Meteo, BAN) passent.
//   • Les données du tenant de test sont INJECTÉES en mémoire via
//     window.applyFbData(key, value) — le vrai point d'entrée temps réel de l'app
//     (même chemin que Firestore), AVANT le login, comme le fait _fbLoad.
//   • UNE seule fonction mockée : firebase.auth().signInWithEmailAndPassword.
//     Tout le reste est le VRAI code : roster, confirmLogin, applyRoles, dock,
//     rendus de modules, clics.
//
// Ce que ça couvre : login DOM réel → rendu de CHAQUE module → interactions
// (changer de saison, clic réel sur la FAB #trac-fab → openNewSession, openDP).
// Ce que ça ne couvre PAS : la couche Firestore/claims réelle (réseau coupé ;
// toutes les erreurs Firebase sont attendues et filtrées dans ce mode).
//
// L'ancien mode émulateur reste dispo :  npm run test:e2e:emu  (voir e2e-README).
// =============================================================================

import { spawn } from 'node:child_process';
import http from 'node:http';

const DEV_PORT = 5199;                       // port dédié (n'entre pas en conflit avec ton npm run dev)
const DEV_URL  = 'http://localhost:' + DEV_PORT;
const TENANT   = 'e2e-test';
const HEADED   = process.argv.includes('--headed');
// Le dock compte huit entrées depuis la refonte de navigation. Ce parcours les
// visite TOUTES : `phyto` est devenu un module autonome (il n'est plus un onglet
// du Tracteur) et `reserve` n'existait pas quand ce test a été écrit — deux
// modules qui n'étaient donc jamais rendus ici. On ajoute aussi `parcelles` et
// `journal`, les deux autres onglets du module Vigne.
const PAGES    = ['home', 'parcelles', 'journal', 'tracteur', 'phyto', 'cave',
                  'reserve', 'planning', 'pilotage', 'reglages'];

// ---- Données du tenant de test (formes réelles : la valeur = le .value du doc) ----
const DATA = {
  config: {
    domaine_nom: 'Domaine E2E Test',
    visuSaison: 'Printemps 2026',
    plantation_min_trou: 3,
    features: {},
    gnr: { capacite: 1000, niveau: 600, seuil: 200, maj: '2026-06-01' },
  },
  saisons: [
    { nom: 'Hiver 2025-2026', active: false, debut: '2025-11-01', fin: '2026-03-15' },
    { nom: 'Printemps 2026',  active: true,  debut: '2026-03-16', fin: '2026-07-31' },
  ],
  parcelles: [
    { nom: 'Parcelle Test A', surface: 1.2, lat: 47.2200, lng: 4.9700, statut: 'Actif',
      taches: { Taille: 'Validé', Reparation: 'Validé', Ebourgeonnage: { p1: 'Validé', p2: 'Non démarré', ov: false } } },
    { nom: 'Parcelle Test B', surface: 0.8, lat: 47.2210, lng: 4.9710, statut: 'Actif',
      taches: { Taille: 'Validé', Ebourgeonnage: { p1: 'Non démarré', p2: 'Non démarré', ov: false } } },
    { nom: 'Parcelle Test C', surface: 0.5, lat: 47.2190, lng: 4.9690, statut: 'Actif', taches: {} },
  ],
  tracteurs_list: [
    { id: 'tr1', nom: 'John Deere 5075E', modele: '5075E', type: 'Tracteur', traitementOnly: false },
    { id: 'tr2', nom: 'Enjambeur Bobard', modele: '1054', type: 'Enjambeur', traitementOnly: false },
  ],
  activites: [
    { nom: 'Rognage', tracteurDefautId: 'tr2' },
    { nom: 'Labour',  tracteurDefautId: 'tr1' },
    { nom: 'Tarière', tracteurDefautId: 'tr1', champCustom: { label: 'Trous', type: 'nombre', feedsPlantation: true } },
  ],
  sessions: [],
  membres: [
    { nom: 'Nico E2E',   email: 'nico@e2e.test',   roles: ['admin', 'ouvrier', 'tractoriste'], statut: 'Actif', couleur: '#3D6B27' },
    { nom: 'Victor E2E', email: 'victor@e2e.test', roles: ['ouvrier', 'tractoriste'],          statut: 'Actif', couleur: '#1A4A7A' },
  ],
};
// Ordre d'injection (dépendances : saisons avant parcelles ; membres en dernier)
const INJECT_ORDER = ['config', 'saisons', 'parcelles', 'tracteurs_list', 'activites', 'sessions', 'membres'];

// ---- Bruit ATTENDU en ce mode (réseau Firebase coupé + environnement de test) ----
// ⚠️ S'applique aux console.error ET aux pageerror : toutes les erreurs Firebase
// sont normales ici (le but est d'attraper les erreurs de RENDU/CLIC, pas Firestore).
const BENIGN = [
  /firestore/i, /client is offline/i, /unavailable/i, /INTERNAL ASSERTION/i,
  /fbPullStatic/i, /Firebase/i, /identitytoolkit/i, /googleapis/i, /gstatic/i,
  /recaptcha|grecaptcha|appcheck|app-check/i, /cloudfunctions|getLoginRoster/i,
  /net::ERR/i, /ERR_ABORTED|ERR_FAILED|ERR_CONNECTION/i, /Failed to load resource/i,
  /Access to (fetch|XMLHttpRequest)|CORS/i, /Quota/i, /permission-denied/i,
  /Service Worker non enregistr/i, /reading 'scope'/i, /ServiceWorker/i,
  /navigator\.vibrate/i, /hasn't tapped/i, /chromestatus/i,
];
const isBenign = (t) => BENIGN.some((re) => re.test(t || ''));

const c = { g:(s)=>`\x1b[32m${s}\x1b[0m`, r:(s)=>`\x1b[31m${s}\x1b[0m`, y:(s)=>`\x1b[33m${s}\x1b[0m`, dim:(s)=>`\x1b[2m${s}\x1b[0m`, b:(s)=>`\x1b[1m${s}\x1b[0m` };

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

async function main() {
  let playwright;
  try { playwright = await import('playwright'); }
  catch { console.error(c.r('\n✖ Playwright non installé — npm i -D playwright && npx playwright install chromium\n')); process.exit(2); }
  const { chromium } = playwright;

  // 1) Serveur dev dédié
  console.log(c.dim('  Démarrage du serveur dev (port ' + DEV_PORT + ')…'));
  const dev = spawn('npm', ['run', 'dev', '--', '--port', String(DEV_PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
  let devKilled = false;
  const killDev = () => { if (!devKilled) { devKilled = true; try { process.platform === 'win32' ? spawn('taskkill', ['/pid', String(dev.pid), '/f', '/t'], { shell: true }) : dev.kill('SIGTERM'); } catch {} } };
  process.on('exit', killDev);
  try { await waitForServer(DEV_URL); console.log(c.dim('  Serveur dev prêt : ' + DEV_URL)); }
  catch (e) { console.error(c.r('✖ ' + e.message)); killDev(); process.exit(2); }

  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();

  // 2) Réseau Firebase COUPÉ (aucun contact prod) ; services publics laissés passer
  await page.route('**/*', (route) => {
    const u = route.request().url();
    if (/googleapis\.com|gstatic\.com|recaptcha\.net|google\.com\/recaptcha|cloudfunctions\.net|firebaseapp\.com|firebasestorage|firebaseio\.com|identitytoolkit/i.test(u)) return route.abort();
    return route.continue();
  });

  const errorsByStep = {};
  let stepLabel = 'boot';
  const pushErr = (src, txt) => {
    if (isBenign(txt)) return;                       // filtre les DEUX sources en ce mode
    (errorsByStep[stepLabel] = errorsByStep[stepLabel] || []).push(`[${src}] ${txt}`);
  };
  page.on('pageerror', (err) => pushErr('pageerror', err && err.message ? err.message : String(err)));
  page.on('console', (m) => { if (m.type() === 'error') pushErr('console', m.text()); });
  const hard = (msg) => { (errorsByStep[stepLabel] = errorsByStep[stepLabel] || []).push(msg); };

  try {
    // 3) Boot
    stepLabel = 'boot';
    await page.goto(DEV_URL + '/?tenant=' + TENANT, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => window.__MV_BOOTED === true, { timeout: 45000 }).catch(() => hard('window.__MV_BOOTED jamais true (boot KO)'));

    // 4) Injection des données (AVANT le login, comme _fbLoad) + refresh du roster
    stepLabel = 'injection';
    try {
      await page.waitForFunction(() => typeof window.applyFbData === 'function', { timeout: 15000 });
      await page.evaluate(({ data, order }) => {
        for (const k of order) { try { window.applyFbData(k, data[k]); } catch (e) { console.error('[E2E inject] ' + k + ' : ' + (e && e.message)); } }
        if (typeof window.initLogin === 'function') window.initLogin();
      }, { data: DATA, order: INJECT_ORDER });
      await page.waitForTimeout(600);
    } catch (e) { hard('Injection des données impossible : ' + (e && e.message ? e.message : String(e))); }

    // 5) Mock MINIMAL : uniquement signInWithEmailAndPassword (couche compat)
    stepLabel = 'login';
    try {
      await page.evaluate(() => {
        const compat = window.firebase.auth();
        const mock = Object.create(compat);
        mock.signInWithEmailAndPassword = async (email) => ({
          user: { uid: 'e2e-user', email, emailVerified: true, getIdToken: async () => 'e2e-token', getIdTokenResult: async () => ({ claims: {} }) },
        });
        const EAP = window.firebase.auth.EmailAuthProvider;
        const f = function () { return mock; };
        f.EmailAuthProvider = EAP || {};
        window.firebase.auth = f;
      });
      // 6) Login DOM réel : clic profil → mot de passe → bouton → confirmLogin (vrai code)
      await page.getByText('Nico E2E', { exact: false }).first().click({ timeout: 15000 });
      await page.fill('#login-pwd-input', 'vigne21', { timeout: 10000 });
      await page.click('#login-pwd-btn', { timeout: 10000 });
      await page.waitForFunction(() => {
        const ls = document.getElementById('login-screen');
        const hidden = !ls || ls.style.display === 'none' || ls.offsetParent === null;
        return hidden && !!window.currentUser;
      }, { timeout: 20000 });
      console.log(c.g('  ✓ Login OK') + c.dim('  (Nico E2E, flux DOM réel, auth mockée)'));
    } catch (e) { hard('Login échoué : ' + (e && e.message ? e.message : String(e))); }

    // 6b) Fermer les portails post-login qui INTERCEPTENT les clics réels en mode test.
    //  - #ovTerms (SEC-DPA) : le mock signIn renvoie claims:{} → l'admin injecté n'a pas le
    //    claim `terms` à jour → _mvTermsCheck ouvre l'ecran d'acceptation CGU/DPA (mvt-ov),
    //    qui recouvre l'app et bloque tout clic (ex. la FAB #trac-fab).
    //  - #onboarding-screen / #mv-expired-ov : filets eventuels (boot reseau coupe, essai).
    stepLabel = 'login';
    try {
      await page.evaluate(() => {
        try { if (window._mvTermsClose) window._mvTermsClose(); } catch (e) {}
        ['ovTerms', 'onboarding-screen', 'mv-expired-ov'].forEach((id) => {
          const el = document.getElementById(id); if (el) el.style.display = 'none';
        });
      });
    } catch (e) { /* best-effort : l'absence de ces portails n'est pas une erreur */ }

    // 7) Rendu de chaque module
    for (const p of PAGES) {
      stepLabel = 'page:' + p;
      try {
        await page.evaluate((pg) => { if (window.goTo) window.goTo(pg); }, p);
        await page.waitForTimeout(1200);
      } catch (e) { hard('Navigation ' + p + ' impossible : ' + (e && e.message ? e.message : String(e))); }
    }

    // 8) Interactions clés
    // a) Changer de saison (chemin sensible visuSaison, §11b — tourne en mémoire, save offline filtré)
    stepLabel = 'action:saison';
    try {
      await page.evaluate(() => { if (window._switchSaison) window._switchSaison('Hiver 2025-2026', true); });
      await page.waitForTimeout(600);
      await page.evaluate(() => { if (window._switchSaison) window._switchSaison('Printemps 2026', true); });
      await page.waitForTimeout(600);
    } catch (e) { hard('Changement de saison : ' + (e && e.message ? e.message : String(e))); }

    // b) Créer une session : clic RÉEL sur la FAB → openNewSession() (câblage onclick + fonction)
    stepLabel = 'action:session';
    try {
      await page.evaluate(() => { if (window.goTo) window.goTo('tracteur'); });
      await page.waitForTimeout(800);
      // Un portail CGU/DPA a pu se rouvrir via _mvApplyTrialGating pendant la nav → le refermer.
      await page.evaluate(() => { try { if (window._mvTermsClose) window._mvTermsClose(); } catch (e) {} const t = document.getElementById('ovTerms'); if (t) t.style.display = 'none'; });
      await page.click('#trac-fab', { timeout: 8000 });
      await page.waitForTimeout(900);
      const opened = await page.evaluate(() => !!document.querySelector('.overlay.open'));
      if (!opened) hard('La FAB a été cliquée mais aucun overlay ne s\'est ouvert (openNewSession KO ?)');
      await page.evaluate(() => { document.querySelectorAll('.overlay.open').forEach((o) => { try { window.closeOv && window.closeOv(null, o.id); } catch (e) {} o.classList.remove('open'); }); });
    } catch (e) { hard('Créer une session (#trac-fab → openNewSession) : ' + (e && e.message ? e.message : String(e))); }

    // b2) Barres d'onglets internes : une seule primitive .mvu-tab depuis la refonte
    //     de navigation, mais chaque module garde sa fonction de bascule. On les
    //     appelle vraiment : un onglet qui ne rend plus se voit ici, pas à l'œil.
    stepLabel = 'action:onglets';
    try {
      const tabs = [
        ['reserve',  '_rsvTabTo',      ['futs', 'intrants', 'audit']],
        ['cave',     'switchCaveOng',  ['cuv', 'journal', 'divers']],
        ['cave',     'switchVendOng',  ['rec', 'cuves', 'ana']],
        ['home',     'switchVigneOng', ['parcelles', 'journal', 'home']],
      ];
      // ⚠️ NE PAS nommer la variable de boucle `page` : elle masquerait l'objet
      //    `page` de Playwright, et tout appel page.evaluate() plus bas viserait
      //    une chaîne de caractères. (Vécu : « page.evaluate is not a function ».)
      for (const [pageName, fn, values] of tabs) {
        await page.evaluate((pg) => { if (window.goTo) window.goTo(pg); }, pageName);
        await page.waitForTimeout(400);
        for (const v of values) {
          await page.evaluate(([f, val]) => { if (typeof window[f] === 'function') window[f](val); }, [fn, v]);
          await page.waitForTimeout(250);
        }
      }
    } catch (e) { hard('Bascule des onglets internes : ' + (e && e.message ? e.message : String(e))); }

    // b3) Dock mobile : 4 modules visibles + « Plus ». Playwright ouvre par défaut
    //     une fenêtre large (>=768px) où _dockBuild affiche TOUT : sans réduire le
    //     viewport, la répartition mobile n'est jamais exécutée. On force donc une
    //     taille de téléphone, puis on rebâtit le dock et on compte ce qui s'affiche.
    //     Ce qui est vérifié : au plus 5 cases, et AUCUN module perdu en route
    //     (barre + feuille « Plus » = total des modules autorisés).
    stepLabel = 'action:dock';
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(400);
      await page.evaluate(() => { if (window._dockBuild) window._dockBuild(); });
      await page.waitForTimeout(400);
      const d = await page.evaluate(() => {
        const inner = document.getElementById('mv-dock-inner');
        const sheet = document.getElementById('mv-dock-sheet-items');
        const btns  = inner ? Array.from(inner.querySelectorAll('.mv-dk')) : [];
        const lb    = (b) => ((b.querySelector('.mv-dk-lb') || {}).textContent || '');
        const sg    = sheet ? Array.from(sheet.querySelectorAll('.mv-sg')) : [];
        return {
          barre:  btns.filter((b) => !b.getAttribute('data-plus')).length,
          plus:   btns.filter((b) =>  b.getAttribute('data-plus')).length,
          sheet:  sg.length,
          labels: btns.filter((b) => !b.getAttribute('data-plus')).map(lb),
          tous:   btns.filter((b) => !b.getAttribute('data-plus')).map(lb)
                   .concat(sg.map((b) => ((b.querySelector('.mv-sg-lb') || {}).textContent || ''))),
        };
      });
      const cases = d.barre + d.plus;
      if (cases === 0)        hard('Le dock est vide après _dockBuild');
      else if (cases > 5)     hard('Dock : ' + cases + ' cases affichées (5 au maximum)');
      else if (d.plus && d.barre !== 4)
        hard('Dock : ' + d.barre + ' modules dans la barre alors qu\'un « Plus » est affiché (4 attendus)');
      else if (d.plus && d.sheet < 2)
        hard('Dock : bouton « Plus » affiché pour seulement ' + d.sheet + ' module(s) — état dégénéré');
      else if (!d.plus && d.sheet !== 0)
        hard('Dock : pas de bouton « Plus » mais ' + d.sheet + ' module(s) enfermés dans la feuille');
      else if (!d.tous.some((t) => /glages/.test(t)))
        hard('Dock : Réglages n\'est atteignable nulle part (il ne doit JAMAIS être gaté)');
      else console.log(c.g('  ✓ Dock mobile') + c.dim('  (' + d.barre + ' dans la barre'
             + (d.plus ? ' + Plus(' + d.sheet + ')' : ', pas de « Plus »') + ' — '
             + d.labels.join(', ') + ')'));
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(400);
    } catch (e) { hard('Dock mobile : ' + (e && e.message ? e.message : String(e))); }

    // b4) Saisie d'une valeur (#ovPrompt) : le remplaçant de prompt(), qui n'affiche
    //     RIEN en PWA iOS. On ouvre, on vérifie que la valeur est bien posée EN JS
    //     (Safari ignore une valeur portée par un attribut HTML), on valide, et on
    //     contrôle que le callback reçoit la saisie — virgule française comprise.
    stepLabel = 'action:saisie';
    try {
      const r = await page.evaluate(async () => {
        if (typeof window.openPrompt !== 'function') return { err: 'openPrompt absente' };
        let recu = null;
        window.openPrompt({ titre: 'Consommé E2E', sub: 'Produit test', unite: 'kg',
                            valeur: 12.5, cb: (v) => { recu = v; } });
        const ov = document.getElementById('ovPrompt');
        const el = document.getElementById('mvp-input');
        const ouvert = !!(ov && ov.classList.contains('open'));
        const valeur = el ? el.value : null;
        const unite  = (document.getElementById('mvp-unit') || {}).textContent;
        if (el) el.value = '7,25';
        if (window._execPrompt) window._execPrompt();
        await new Promise((res) => setTimeout(res, 300));
        return { ouvert, valeur, unite, recu,
                 ferme: !(ov && ov.classList.contains('open')) };
      });
      if (r.err)                    hard(r.err);
      else if (!r.ouvert)           hard('#ovPrompt ne s\'ouvre pas');
      else if (r.valeur !== '12.5') hard('Valeur non posée en JS dans #mvp-input (lu : ' + r.valeur + ')');
      else if (r.unite !== 'kg')    hard('Unité non affichée dans #mvp-unit (lu : ' + r.unite + ')');
      else if (r.recu !== '7,25')   hard('Le callback n\'a pas reçu la saisie (reçu : ' + r.recu + ')');
      else if (!r.ferme)            hard('#ovPrompt reste ouvert après validation');
      else console.log(c.g('  ✓ Saisie #ovPrompt') + c.dim('  (valeur posée en JS, callback reçoit « 7,25 »)'));
      await page.evaluate(() => { const o = document.getElementById('ovPrompt'); if (o) o.classList.remove('open'); });
    } catch (e) { hard('Saisie #ovPrompt : ' + (e && e.message ? e.message : String(e))); }

    // c) Détail d'une parcelle (rendu tâches + trous + météo)
    stepLabel = 'action:parcelle';
    try {
      await page.evaluate(() => { if (window.openDP) window.openDP('Parcelle Test A'); });
      await page.waitForTimeout(900);
      await page.evaluate(() => { document.querySelectorAll('.overlay.open').forEach((o) => { try { window.closeOv && window.closeOv(null, o.id); } catch (e) {} o.classList.remove('open'); }); });
    } catch (e) { hard('Ouvrir le détail parcelle (openDP) : ' + (e && e.message ? e.message : String(e))); }
  } finally {
    await browser.close();
    killDev();
  }

  // ---- Rapport ----
  console.log('\n' + c.b('── E2E local (données injectées, sans émulateur) ───────'));
  const steps = ['boot', 'injection', 'login', ...PAGES.map((p) => 'page:' + p), 'action:saison', 'action:session', 'action:onglets', 'action:dock',
                 'action:saisie', 'action:parcelle'];
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
  console.log('\n' + c.g(c.b('  RÉSULTAT : OK')) + c.dim('  — login + tous les modules + interactions sans exception.') + '\n');
  process.exit(0);
}

main().catch((e) => { console.error(c.r('Erreur du harnais : ' + (e && e.stack || e))); process.exit(2); });
