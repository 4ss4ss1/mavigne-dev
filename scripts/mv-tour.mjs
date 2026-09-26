#!/usr/bin/env node
// =============================================================================
// Ma Vigne — LE TOUR COMPLET, LOT 2 : RÔLES ET MISE EN PAGE (§175)
// -----------------------------------------------------------------------------
// Lancer :  npm run tour                 (Chromium + Safari/WebKit si installé)
//           npm run tour -- --chromium   (Chromium seul, plus rapide)
//           npm run tour -- --captures   (une capture de CHAQUE écran, pas seulement des fautifs)
//           npm run tour -- --headed     (voir le navigateur travailler)
// Première fois :  npx playwright install chromium webkit
//
// Même principe qu'e2e-local : ZÉRO émulateur, réseau Firebase COUPÉ, données
// INJECTÉES par window.applyFbData, UNE seule fonction mockée (signIn). Tout le
// reste est le vrai code : roster, confirmLogin, applyRoles, dock, rendus, onglets.
//
// POUR CHAQUE navigateur × rôle × écran × page du dock × onglet de la page :
//   BUG     erreur JS · texte cassé à l'écran (&amp; &#39; undefined NaN
//           [object Object] \u00e9…) · balise piégée exécutée (XSS) · la page
//           déborde sur le côté · image cassée · id en double · page interdite
//           atteinte (Pilotage sans le rôle)
//   À VOIR  textes qui se chevauchent · texte coupé sans « … » · bouton trop
//           petit pour un doigt (< 32 px) · police de secours à la place de
//           Outfit / Cormorant · élément qui sort de l'écran à droite
//
// Les données de test contiennent EXPRÈS des apostrophes, des « & », des accents
// et une balise piégée dans un nom de parcelle : ce sont eux qui font sortir les
// défauts d'échappement.
//
// Sortie : rapports/tour/rapport.html (+ captures) — le dossier rapports/ est
// dans .gitignore. Code 0 = aucun BUG, 1 = au moins un BUG, 2 = le tour n'a pas
// pu tourner.
//
// ⚠️ Ce script a été écrit SANS pouvoir être lancé (pas de navigateur dans le bac à
//    sable de Claude). Un premier lancement qui plante sur une ancre ou un délai
//    est un défaut du SCRIPT : coller la sortie, on corrige.
// ⚠️ CHEMINS : fileURLToPath, jamais new URL(...).pathname (Windows, 20/08).
// =============================================================================
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI      = path.dirname(fileURLToPath(import.meta.url));
const RACINE   = path.resolve(ICI, '..');
const SORTIE   = path.join(RACINE, 'rapports', 'tour');
const DEV_PORT = 5198;                         // ≠ 5199 (e2e) : les deux peuvent coexister
const DEV_URL  = 'http://localhost:' + DEV_PORT;
const TENANT   = 'e2e-test';
const ARGS     = process.argv.slice(2);
const HEADED   = ARGS.includes('--headed');
const TOUT_CAP = ARGS.includes('--captures');
const CHROMIUM_SEUL = ARGS.includes('--chromium');

const ECRANS = [
  { id: 'iphone-se', w: 375,  h: 667,  lib: 'iPhone SE' },
  { id: 'android',   w: 412,  h: 915,  lib: 'Android' },
  { id: 'tablette',  w: 820,  h: 1180, lib: 'Tablette' },
  { id: 'ordi',      w: 1280, h: 800,  lib: 'Ordinateur' },
];
// Un compte par rôle. `pilotage` attendu : le dock ne doit proposer Pilotage
// qu'à l'admin et au rôle pilotage (_canPilotage, app.js).
const ROLES = [
  { id: 'admin',       nom: 'Nico E2E',       pilotage: true  },
  { id: 'pilotage',    nom: 'Pilote E2E',     pilotage: true  },
  { id: 'ouvrier',     nom: 'Ouvrier E2E',    pilotage: false },
  { id: 'tractoriste', nom: 'Tracto E2E',     pilotage: false },
  { id: 'saisonnier',  nom: 'Saisonnier E2E', pilotage: false },
];

// ---- Données du tenant de test : e2e-local, ENRICHIES de pièges d'échappement ----
const PIEGE = '<img src=x onerror="window.__mvXss=1">';
const DATA = {
  config: {
    domaine_nom: 'Domaine l\u2019Œil & Côte d\'Or',
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
    { nom: 'Clos de l\'Abbaye & Fils', surface: 0.8, lat: 47.2210, lng: 4.9710, statut: 'Actif',
      taches: { Taille: 'Validé', Ebourgeonnage: { p1: 'Non démarré', p2: 'Non démarré', ov: false } } },
    { nom: 'Les Échézeaux "du Bas"', surface: 0.5, lat: 47.2190, lng: 4.9690, statut: 'Actif', taches: {} },
    { nom: 'Piège ' + PIEGE, surface: 0.3, lat: 47.2180, lng: 4.9680, statut: 'Actif', taches: {} },
  ],
  tracteurs_list: [
    { id: 'tr1', nom: 'John Deere 5075E', modele: '5075E', type: 'Tracteur', traitementOnly: false },
    { id: 'tr2', nom: 'Enjambeur Bobard l\'ancien', modele: '1054', type: 'Enjambeur', traitementOnly: false },
  ],
  activites: [
    { nom: 'Rognage', tracteurDefautId: 'tr2' },
    { nom: 'Labour',  tracteurDefautId: 'tr1' },
    { nom: 'Tarière', tracteurDefautId: 'tr1', champCustom: { label: 'Trous', type: 'nombre', feedsPlantation: true } },
  ],
  sessions: [],
  membres: [
    { nom: 'Nico E2E',       email: 'nico@e2e.test',   roles: ['admin', 'ouvrier', 'tractoriste'], statut: 'Actif', couleur: '#3D6B27',
      debut_contrat: '2024-01-01' },
    { nom: 'Pilote E2E',     email: 'pil@e2e.test',    roles: ['pilotage'],    statut: 'Actif', couleur: '#8A5A1A', debut_contrat: '2024-01-01' },
    { nom: 'Ouvrier E2E',    email: 'ouv@e2e.test',    roles: ['ouvrier'],     statut: 'Actif', couleur: '#1A4A7A', debut_contrat: '2025-03-01' },
    { nom: 'Tracto E2E',     email: 'tra@e2e.test',    roles: ['tractoriste'], statut: 'Actif', couleur: '#5A1A7A', debut_contrat: '2025-03-01' },
    { nom: 'Saisonnier E2E', email: 'sai@e2e.test',    roles: ['saisonnier'],  statut: 'Actif', couleur: '#1A7A5A',
      debut_contrat: '2026-03-16', fin_contrat: '2026-07-31' },
    // Fiche SANS date (PRES-1) : le Pilotage doit la signaler.
    { nom: 'Jean-Noël d\'Arc', email: 'jn@e2e.test',   roles: ['ouvrier'],     statut: 'Actif', couleur: '#7A1A1A' },
  ],
};
const INJECT_ORDER = ['config', 'saisons', 'parcelles', 'tracteurs_list', 'activites', 'sessions', 'membres'];

const BENIGN = [
  /firestore/i, /client is offline/i, /unavailable/i, /INTERNAL ASSERTION/i,
  /fbPullStatic/i, /Firebase/i, /identitytoolkit/i, /googleapis/i, /gstatic/i,
  /recaptcha|grecaptcha|appcheck|app-check/i, /cloudfunctions|getLoginRoster|getLoginEmail/i,
  /net::ERR/i, /ERR_ABORTED|ERR_FAILED|ERR_CONNECTION/i, /Failed to load resource/i,
  /Access to (fetch|XMLHttpRequest)|CORS/i, /Quota/i, /permission-denied/i,
  /Service Worker non enregistr/i, /reading 'scope'/i, /ServiceWorker/i,
  /navigator\.vibrate/i, /hasn't tapped/i, /chromestatus/i,
];
const isBenign = (t) => BENIGN.some((re) => re.test(t || ''));
const c = { g:s=>`\x1b[32m${s}\x1b[0m`, r:s=>`\x1b[31m${s}\x1b[0m`, y:s=>`\x1b[33m${s}\x1b[0m`, dim:s=>`\x1b[2m${s}\x1b[0m`, b:s=>`\x1b[1m${s}\x1b[0m` };

function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((res, rej) => {
    const tick = () => {
      const req = http.get(url, (r) => { r.destroy(); res(true); });
      req.on('error', () => { if (Date.now() - start > timeoutMs) rej(new Error('serveur dev injoignable : ' + url)); else setTimeout(tick, 500); });
    };
    tick();
  });
}

// ---- L'AUDIT, exécuté DANS la page ------------------------------------------
// Rend { bug:[{type,detail}], voir:[{type,detail}] }. Ne lit que ce qui est
// VISIBLE : un défaut dans un bloc masqué ne gêne personne.
function auditDansLaPage(piegeActif) {
  const W = window.innerWidth;
  const bug = [], voir = [];
  const vis = (el) => {
    if (!el || !el.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) return false;
    if (el.offsetParent === null && cs.position !== 'fixed' && el.tagName !== 'BODY') return false;
    return true;
  };
  const court = (el) => {
    if (!el) return '?';
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    else if (el.classList && el.classList.length) s += '.' + Array.from(el.classList).slice(0, 2).join('.');
    return s;
  };
  const txt = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
  const racine = document.querySelector('.page.active') || document.querySelector('[id^="page-"].active') || document.body;
  const zones = [racine].concat(Array.from(document.querySelectorAll('.overlay.open, #mv-dock')));

  // 1. Texte cassé à l'écran
  const RE = /(&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;|&nbsp;|\\u[0-9a-fA-F]{4}|\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b|\bInfinity\b)/;
  const vu = new Set();
  for (const z of zones) {
    const tw = document.createTreeWalker(z, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      const t = n.nodeValue; if (!t || !RE.test(t)) continue;
      const el = n.parentElement; if (!vis(el)) continue;
      if (el.closest('script,style,textarea,code,pre')) continue;
      const m = t.match(RE); const i = t.indexOf(m[0]);
      const extrait = t.slice(Math.max(0, i - 30), i + 30).replace(/\s+/g, ' ');
      const k = m[0] + '|' + extrait; if (vu.has(k)) continue; vu.add(k);
      bug.push({ type: 'texte cassé', detail: '« ' + m[0] + ' » dans ' + court(el) + ' : …' + extrait + '…' });
    }
  }
  // 2. Balise piégée exécutée
  // Remis à zéro aussitôt : l'écran suivant ne doit pas hériter du constat.
  if (piegeActif && window.__mvXss) { window.__mvXss = 0; bug.push({ type: 'balise exécutée (XSS)', detail: 'le nom de parcelle piégé a exécuté du code sur cet écran' }); }
  // 3. La page déborde sur le côté
  const sw = document.documentElement.scrollWidth;
  if (sw > W + 2) bug.push({ type: 'débordement horizontal', detail: 'la page fait ' + sw + ' px pour un écran de ' + W + ' px' });
  // 4. Images cassées
  document.querySelectorAll('img').forEach((im) => { if (vis(im) && im.complete && im.naturalWidth === 0) bug.push({ type: 'image cassée', detail: (im.getAttribute('src') || '').slice(0, 80) }); });
  // 5. Id en double (un getElementById prendra le mauvais)
  const ids = {};
  document.querySelectorAll('[id]').forEach((e) => { if (e.id) ids[e.id] = (ids[e.id] || 0) + 1; });
  Object.keys(ids).filter((k) => ids[k] > 1).slice(0, 15).forEach((k) => bug.push({ type: 'id en double', detail: '#' + k + ' × ' + ids[k] }));

  // Éléments porteurs de texte, visibles, dans la page active et les fenêtres ouvertes
  const feuilles = [];
  for (const z of zones) {
    z.querySelectorAll('*').forEach((el) => {
      if (feuilles.length > 700) return;
      if (/^(SCRIPT|STYLE|SVG|PATH|G|OPTION)$/i.test(el.tagName)) return;
      const aTexte = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.nodeValue.trim().length > 1);
      if (!aTexte && !/^(BUTTON|INPUT|SELECT|IMG)$/.test(el.tagName)) return;
      if (!vis(el)) return;
      feuilles.push(el);
    });
  }
  // 6. Chevauchements (textes qui se recouvrent)
  // Chaque élément appartient à une COUCHE : son ancêtre fixe/collant le plus proche
  // (dock, fenêtre ouverte, en-tête collant) ou la page elle-même. On ne compare que
  // dans une même couche : le contenu qui défile SOUS le dock n'est pas un défaut.
  const couche = (el) => { for (let p = el; p && p !== document.body; p = p.parentElement) { if (/fixed|sticky/.test(getComputedStyle(p).position)) return p; } return null; };
  const R = feuilles.map((el) => { const k = couche(el); return { el, r: el.getBoundingClientRect(), couche: k, fixe: !!k }; });
  let nChev = 0;
  for (let i = 0; i < R.length && nChev < 12; i++) {
    for (let j = i + 1; j < R.length && nChev < 12; j++) {
      const a = R[i], b = R[j];
      if (a.couche !== b.couche) continue;
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const x = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const y = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (x < 3 || y < 3) continue;
      const petit = Math.min(a.r.width * a.r.height, b.r.width * b.r.height);
      if (x * y < 0.25 * petit) continue;
      nChev++;
      voir.push({ type: 'chevauchement', detail: court(a.el) + ' « ' + txt(a.el) + ' » ⟷ ' + court(b.el) + ' « ' + txt(b.el) + ' »' });
    }
  }
  // 7. Texte coupé sans « … »
  let nCoupe = 0;
  for (const el of feuilles) {
    if (nCoupe >= 10) break;
    if (/^(INPUT|SELECT|IMG)$/.test(el.tagName)) continue;
    const cs = getComputedStyle(el);
    if (!/hidden|clip/.test(cs.overflowX + cs.overflow)) continue;
    if (cs.textOverflow === 'ellipsis') continue;
    if (el.scrollWidth > el.clientWidth + 2) { nCoupe++; voir.push({ type: 'texte coupé', detail: court(el) + ' « ' + txt(el) + ' » (' + el.scrollWidth + ' px dans ' + el.clientWidth + ')' }); }
  }
  // 8. Sort de l'écran à droite (hors bloc qui défile)
  let nSort = 0;
  const defile = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return true; } return false; };
  for (const x of R) {
    if (nSort >= 8) break;
    if (x.r.right > W + 2 && !x.fixe && !defile(x.el)) { nSort++; voir.push({ type: 'sort de l\u2019écran', detail: court(x.el) + ' « ' + txt(x.el) + ' » (bord droit ' + Math.round(x.r.right) + ' px)' }); }
  }
  // 9. Boutons trop petits pour un doigt
  let nPetit = 0;
  for (const z of zones) {
    z.querySelectorAll('button, [onclick], .mvu-tab, a[href], input[type=checkbox], input[type=radio]').forEach((el) => {
      if (nPetit >= 10 || !vis(el)) return;
      if (el.closest('p, li') && el.tagName === 'A') return;        // lien dans une phrase
      const r = el.getBoundingClientRect();
      if (r.width < 32 || r.height < 32) { nPetit++; voir.push({ type: 'bouton trop petit', detail: court(el) + ' « ' + txt(el) + ' » ' + Math.round(r.width) + '×' + Math.round(r.height) + ' px' }); }
    });
  }
  // 10. Police de secours
  const GEN = /^(system-ui|-apple-system|blinkmacsystemfont|sans-serif|serif|monospace|cursive|fantasy|ui-sans-serif|ui-serif|ui-monospace|inherit|initial|arial|helvetica|segoe ui|roboto)$/i;
  const fam = new Set();
  feuilles.forEach((el) => { const f = (getComputedStyle(el).fontFamily || '').split(',')[0].replace(/["']/g, '').trim(); if (f) fam.add(f); });
  fam.forEach((f) => { if (!GEN.test(f) && document.fonts && !document.fonts.check('16px "' + f + '"')) voir.push({ type: 'police de secours', detail: '« ' + f + ' » demandée mais pas chargée' }); });

  return { bug, voir, page: racine.id || '?' };
}

// ---- Une session : un navigateur, un rôle ------------------------------------
async function session(type, nav, role, ctx) {
  const context = await nav.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.route('**/*', (route) => {
    const u = route.request().url();
    if (/googleapis\.com|gstatic\.com|recaptcha\.net|google\.com\/recaptcha|cloudfunctions\.net|firebaseapp\.com|firebasestorage|firebaseio\.com|identitytoolkit/i.test(u)) return route.abort();
    return route.continue();
  });
  let ecran = 'boot';
  const noter = (nature, typeDef, detail) => ctx.constats.push({ nav: type, role: role.id, ecran, nature, type: typeDef, detail });
  page.on('pageerror', (e) => { const t = e && e.message ? e.message : String(e); if (!isBenign(t)) noter('bug', 'erreur JS', t.slice(0, 300)); });
  page.on('console', (m) => { if (m.type() === 'error' && !isBenign(m.text())) noter('bug', 'erreur JS', m.text().slice(0, 300)); });

  const fermer = () => page.evaluate(() => {
    try { if (window._mvTermsClose) window._mvTermsClose(); } catch (e) {}
    ['ovTerms', 'onboarding-screen', 'mv-expired-ov'].forEach((id) => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    document.querySelectorAll('.overlay.open').forEach((o) => { try { window.closeOv && window.closeOv(null, o.id); } catch (e) {} o.classList.remove('open'); });
  }).catch(() => {});

  try {
    await page.goto(DEV_URL + '/?tenant=' + TENANT, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => window.__MV_BOOTED === true, { timeout: 45000 });
    await page.waitForFunction(() => typeof window.applyFbData === 'function', { timeout: 15000 });
    await page.evaluate(({ data, order }) => {
      for (const k of order) { try { window.applyFbData(k, data[k]); } catch (e) { console.error('[TOUR inject] ' + k + ' : ' + (e && e.message)); } }
      if (typeof window.initLogin === 'function') window.initLogin();
    }, { data: DATA, order: INJECT_ORDER });
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      const compat = window.firebase.auth();
      const mock = Object.create(compat);
      mock.signInWithEmailAndPassword = async (email) => ({
        user: { uid: 'tour-' + email, email, emailVerified: true, getIdToken: async () => 'tour-token', getIdTokenResult: async () => ({ claims: {} }) },
      });
      const EAP = window.firebase.auth.EmailAuthProvider;
      const f = function () { return mock; }; f.EmailAuthProvider = EAP || {};
      window.firebase.auth = f;
    });
    ecran = 'login';
    await page.getByText(role.nom, { exact: false }).first().click({ timeout: 15000 });
    await page.fill('#login-pwd-input', 'vigne21', { timeout: 10000 });
    await page.click('#login-pwd-btn', { timeout: 10000 });
    await page.waitForFunction(() => {
      const ls = document.getElementById('login-screen');
      return (!ls || ls.style.display === 'none' || ls.offsetParent === null) && !!window.currentUser;
    }, { timeout: 20000 });
    await fermer();
  } catch (e) {
    noter('bug', 'connexion impossible', (e && e.message ? e.message : String(e)).split('\n')[0]);
    await context.close();
    return;
  }

  for (const E of ECRANS) {
    await page.setViewportSize({ width: E.w, height: E.h });
    await page.waitForTimeout(300);
    await page.evaluate(() => { if (window._dockBuild) window._dockBuild(); }).catch(() => {});
    await page.waitForTimeout(300);
    const pages = await page.evaluate(() => Array.from(document.querySelectorAll('#mv-dock-inner .mv-dk[data-page], #mv-dock-sheet-items .mv-sg[data-page]')).map((b) => b.getAttribute('data-page'))).catch(() => []);
    ecran = E.id + ' › dock';
    if (!pages.length) { noter('bug', 'dock vide', 'aucun module proposé'); continue; }
    if (E.id === 'ordi') ctx.dock[type + '|' + role.id] = pages.slice();
    const aPil = pages.includes('pilotage');
    if (aPil !== role.pilotage) noter('bug', 'droit d\u2019accès', 'Pilotage ' + (aPil ? 'proposé' : 'absent') + ' pour le rôle ' + role.id);
    // Accès FORCÉ : goTo('pilotage') sans le rôle doit retomber ailleurs.
    if (!role.pilotage && E.id === 'ordi') {
      const ou = await page.evaluate(() => { try { window.goTo('pilotage'); } catch (e) {} const a = document.querySelector('.page.active'); return a ? a.id : ''; }).catch(() => '');
      if (ou === 'page-pilotage') noter('bug', 'droit d\u2019accès', 'goTo(\u2018pilotage\u2019) ouvre le Pilotage pour le rôle ' + role.id);
      await fermer();
    }
    for (const p of pages) {
      await fermer();
      await page.evaluate((pg) => { if (window.goTo) window.goTo(pg); }, p).catch(() => {});
      await page.waitForTimeout(900);
      const nOng = await page.evaluate(() => { const a = document.querySelector('.page.active'); return a ? Array.from(a.querySelectorAll('.mvu-tab')).filter((t) => t.offsetParent !== null).length : 0; }).catch(() => 0);
      const tours = Math.max(1, Math.min(nOng, 8));
      for (let k = 0; k < tours; k++) {
        let nomOng = '';
        if (nOng) {
          nomOng = await page.evaluate((i) => {
            const a = document.querySelector('.page.active');
            const t = a ? Array.from(a.querySelectorAll('.mvu-tab')).filter((x) => x.offsetParent !== null)[i] : null;
            if (!t) return '';
            t.click();
            return (t.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 30);
          }, k).catch(() => '');
          await page.waitForTimeout(500);
        }
        ecran = E.id + ' › ' + p + (nomOng ? ' › ' + nomOng : '');
        ctx.nEcrans++;
        let r;
        try { r = await page.evaluate(auditDansLaPage, true); }
        catch (e) { noter('bug', 'audit impossible', (e && e.message ? e.message : String(e)).split('\n')[0]); continue; }
        r.bug.forEach((x) => noter('bug', x.type, x.detail));
        r.voir.forEach((x) => noter('voir', x.type, x.detail));
        if (r.bug.length || r.voir.length || TOUT_CAP || (role.id === 'admin' && (E.id === 'iphone-se' || E.id === 'ordi'))) {
          const nom = [type, role.id, E.id, p, (nomOng || 'vue').replace(/[^a-z0-9]+/gi, '-').toLowerCase()].join('_') + '.png';
          try { await page.screenshot({ path: path.join(SORTIE, nom), fullPage: true }); ctx.captures[type + '|' + role.id + '|' + ecran] = nom; } catch (e) {}
        }
      }
    }
  }
  await context.close();
}

// ---- Le rapport HTML ---------------------------------------------------------
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function rapport(ctx, navs, duree) {
  const par = {};
  for (const k of ctx.constats) {
    const cle = k.nature + '|' + k.type + '|' + k.detail;
    (par[cle] = par[cle] || { nature: k.nature, type: k.type, detail: k.detail, ou: [] }).ou.push(k);
  }
  const groupes = Object.values(par).sort((a, b) => (a.nature === b.nature ? b.ou.length - a.ou.length : a.nature === 'bug' ? -1 : 1));
  const nBug = groupes.filter((g) => g.nature === 'bug').length, nVoir = groupes.length - nBug;
  const lignes = groupes.map((g) => {
    const ex = g.ou.slice(0, 6).map((k) => {
      const cap = ctx.captures[k.nav + '|' + k.role + '|' + k.ecran];
      const lib = esc(k.nav + ' · ' + k.role + ' · ' + k.ecran);
      return cap ? '<a href="' + esc(cap) + '">' + lib + '</a>' : lib;
    }).join('<br>') + (g.ou.length > 6 ? '<br>… et ' + (g.ou.length - 6) + ' autres' : '');
    return '<tr class="' + g.nature + '"><td>' + (g.nature === 'bug' ? 'BUG' : 'À voir') + '</td><td>' + esc(g.type) + '</td><td>' + esc(g.detail) + '</td><td>' + g.ou.length + '</td><td class="ou">' + ex + '</td></tr>';
  }).join('\n');
  const dock = Object.entries(ctx.dock).map(([k, v]) => '<tr><td>' + esc(k.replace('|', ' · ')) + '</td><td>' + esc(v.join(', ')) + '</td></tr>').join('');
  const html = '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tour complet — Ma Vigne</title>'
    + '<style>body{font:14px/1.5 system-ui,sans-serif;margin:24px;color:#222}h1{font-size:20px}table{border-collapse:collapse;width:100%;margin:12px 0 28px}td,th{border:1px solid #ddd;padding:6px 8px;vertical-align:top;text-align:left}'
    + 'tr.bug td:first-child{color:#fff;background:#B83A2A;font-weight:600}tr.voir td:first-child{background:#F3E2B8}.ou{font-size:12px;color:#555}.r{display:flex;gap:24px;flex-wrap:wrap}.r div{background:#f5f2ea;padding:10px 16px;border-radius:8px}</style>'
    + '<h1>Tour complet — rôles et mise en page</h1><div class="r"><div><b>' + nBug + '</b> bugs distincts</div><div><b>' + nVoir + '</b> points à voir</div><div><b>' + ctx.nEcrans + '</b> écrans audités</div>'
    + '<div>' + esc(navs.join(' + ')) + '</div><div>' + Math.round(duree / 1000) + ' s</div></div>'
    + '<h2>Constats</h2><table><tr><th>Nature</th><th>Type</th><th>Détail</th><th>Écrans</th><th>Où (lien = capture)</th></tr>' + (lignes || '<tr><td colspan="5">Aucun constat.</td></tr>') + '</table>'
    + '<h2>Ce que chaque rôle voit dans le dock (écran ordinateur)</h2><table><tr><th>Navigateur · rôle</th><th>Modules</th></tr>' + dock + '</table>'
    + '<p class="ou">« À voir » n\u2019est pas forcément un défaut : un badge posé exprès sur une icône est un chevauchement voulu. Ouvrir la capture et juger.</p></html>';
  fs.writeFileSync(path.join(SORTIE, 'rapport.html'), html);
  return { nBug, nVoir, groupes };
}

async function main() {
  let playwright;
  try { playwright = await import('playwright'); }
  catch { console.error(c.r('\n✖ Playwright non installé — npm i -D playwright && npx playwright install chromium webkit\n')); process.exit(2); }
  fs.rmSync(SORTIE, { recursive: true, force: true });
  fs.mkdirSync(SORTIE, { recursive: true });

  console.log(c.dim('  Démarrage du serveur dev (port ' + DEV_PORT + ')…'));
  const dev = spawn('npm', ['run', 'dev', '--', '--port', String(DEV_PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
  let devKilled = false;
  const killDev = () => { if (!devKilled) { devKilled = true; try { process.platform === 'win32' ? spawn('taskkill', ['/pid', String(dev.pid), '/f', '/t'], { shell: true }) : dev.kill('SIGTERM'); } catch (e) {} } };
  process.on('exit', killDev);
  try { await waitForServer(DEV_URL); console.log(c.dim('  Serveur dev prêt : ' + DEV_URL)); }
  catch (e) { console.error(c.r('✖ ' + e.message)); killDev(); process.exit(2); }

  const t0 = Date.now();
  const ctx = { constats: [], captures: {}, dock: {}, nEcrans: 0 };
  const navs = [];
  const types = CHROMIUM_SEUL ? ['chromium'] : ['chromium', 'webkit'];
  for (const type of types) {
    let nav;
    try { nav = await playwright[type].launch({ headless: !HEADED }); }
    catch (e) {
      console.log(c.y('  ! ' + type + ' indisponible — npx playwright install ' + type + '  (tour poursuivi sans lui)'));
      continue;
    }
    navs.push(type === 'webkit' ? 'Safari (WebKit)' : 'Chrome (Chromium)');
    for (const role of ROLES) {
      process.stdout.write(c.dim('  ' + type + ' · ' + role.id + '… '));
      const avant = ctx.constats.length;
      try { await session(type, nav, role, ctx); }
      catch (e) { ctx.constats.push({ nav: type, role: role.id, ecran: '?', nature: 'bug', type: 'le tour a planté', detail: (e && e.message ? e.message : String(e)).split('\n')[0] }); }
      const n = ctx.constats.slice(avant);
      console.log((n.some((k) => k.nature === 'bug') ? c.r : c.g)(n.filter((k) => k.nature === 'bug').length + ' bug(s)') + c.dim(', ' + n.filter((k) => k.nature === 'voir').length + ' à voir'));
    }
    await nav.close();
  }
  killDev();
  if (!navs.length) { console.error(c.r('✖ Aucun navigateur n\u2019a pu démarrer.')); process.exit(2); }

  const R = rapport(ctx, navs, Date.now() - t0);
  console.log('\n' + c.b('── Tour complet — lot 2 ────────────────────────────────'));
  for (const g of R.groupes.slice(0, 25)) console.log('  ' + (g.nature === 'bug' ? c.r('BUG ') : c.y('voir')) + ' ' + g.type + c.dim(' — ' + g.detail.slice(0, 110) + ' (' + g.ou.length + ' écran' + (g.ou.length > 1 ? 's' : '') + ')'));
  if (R.groupes.length > 25) console.log(c.dim('  … ' + (R.groupes.length - 25) + ' autres dans le rapport'));
  console.log('\n  ' + ctx.nEcrans + ' écrans · ' + (R.nBug ? c.r(R.nBug + ' bug(s) distinct(s)') : c.g('0 bug')) + ' · ' + R.nVoir + ' point(s) à voir');
  console.log('  Rapport : ' + path.join('rapports', 'tour', 'rapport.html') + '\n');
  process.exit(R.nBug ? 1 : 0);
}
main().catch((e) => { console.error(c.r('Erreur du tour : ' + (e && e.stack || e))); process.exit(2); });
