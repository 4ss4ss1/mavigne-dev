#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   TUTO-1 (§358) — CHAQUE TUTO, REJOUÉ TOUT SEUL SUR LE BUILD
   Lancer : npm run build  puis  npm run test:tutos        (la CI le fait après le smoke)
            MV_CHROMIUM=/chemin/vers/chrome  pour un Chromium à soi (bac à sable de Claude)

   ══ POURQUOI ══
   Un tuto vise de vrais boutons. Quand un écran change, le tuto doit suivre — et ce
   qui ne peut pas suivre tout seul (une étape nouvelle) doit se VOIR avant la mise
   en ligne, pas chez le client. Ce script ouvre ?tuto=<id>&tuto_auto=1 : le moteur
   joue lui-même chaque étape avec « Montre-moi » (le vrai geste sur le vrai écran)
   et attend que l'écran change. On exige : le bout du tuto, aucune exception, et
   AUCUNE requête vers Firestore pendant l'entraînement (la porte de firebase.js).
   Téléphone (390 × 844, tactile) PUIS ordinateur (1280 × 860) : le chemin vers un
   module n'est pas le même (dock ou barre de gauche), le tuto doit trouver les deux.
   Hermétique comme le smoke : tout ce qui n'est pas le serveur local est coupé.
   TUTO-2 (§359) : chaque tuto est aussi joué DANS UN CADRE (le panneau d'entraînement sur ordinateur) ; on
   exige que la mémoire de l'appli qui l'ouvre ne bouge pas et que « Fermer l'entraînement » la prévienne.
   ─────────────────────────────────────────────────────────────────────────── */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const DIR = resolve(process.argv.includes('--dir') ? process.argv[process.argv.indexOf('--dir') + 1] : 'dist');
const DELAI = 60000;
const c = { g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m`, dim: (s) => `\x1b[2m${s}\x1b[0m` };
const BENIN = [/net::ERR_/i, /ERR_ABORTED/i, /ERR_FAILED/i, /Failed to load resource/i, /googleapis\.com/i, /gstatic\.com/i,
  /recaptcha/i, /appcheck/i, /app-check/i, /Firebase: Error \(auth\//i, /firestore/i, /unavailable/i, /Access to (fetch|XMLHttpRequest)/i,
  /blocked by CORS/i, /Fetch API cannot load/i, /openstreetmap/i, /ERR_INTERNET_DISCONNECTED/i, /ERR_NAME_NOT_RESOLVED/i,
  /navigator\.vibrate/i, /hasn't tapped/i, /ServiceWorker/i, /Service Worker/i, /reading 'scope'/i, /stockage persistant/i, /\[Tuto\]/,
  // La porte qui fait son travail : un appel retenu pendant l'entraînement, avalé par l'appli et noté en console.
  /Entra(\u00ee|î|\\u00ee)nement.{0,12}rien n.{0,8}est envoy/i];
const benin = (t) => BENIN.some((re) => re.test(t || ''));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8' };

function serveur(racine) {
  return new Promise((ok, ko) => {
    const s = http.createServer(async (req, res) => {
      try {
        let p = decodeURIComponent(req.url.split('?')[0]);
        // TUTO-2 : une page d'appli qui ouvre le tuto dans un cadre, comme le panneau d'entraînement sur ordinateur.
        // TUTO-5 : une « appli » qui se laisse lire — chaque étape y est faite dès que le panneau y arrive (?aligne=1 : le
        // chemin du GNR — module et onglet — est déjà fait à l'ouverture, le panneau doit démarrer après lui).
        if (p === '/__miroir.html') {
          const id = (/[?&]id=([a-z0-9-]+)/.exec(req.url) || [])[1] || 'equipes';
          const aligne = /[?&]aligne=1/.test(req.url);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<!doctype html><html><body style="margin:0"><script>window.__anneau=[];window._mvTutoAvant=function(){return {};};'
            + 'window._mvTutoMiroirFait=function(id,i){var f=document.getElementById("f"),s=f&&f.contentWindow&&f.contentWindow.__MV_TUTO_ETAT,cur=(s&&s.etape)?s.etape-1:-1;return ' + (aligne ? '(id==="gnr"&&i<=1)||' : '') + 'i<=cur;};'
            + 'window._mvTutoValeur=function(id,i){return {v:(id==="gnr"&&i===3)?"1200":"",focus:false};};'
            + 'window._mvTutoAnneau=function(id,i){window.__anneau.push(i);};</script>'
            + '<iframe id="f" src="/?tuto=' + id + '&tuto_cadre=1" style="width:420px;height:860px;border:0"></iframe></body></html>');
          return;
        }
        if (p === '/__cadre.html') {
          const id = (/[?&]id=([a-z0-9-]+)/.exec(req.url) || [])[1] || 'equipes';
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<!doctype html><html><body style="margin:0"><script>window.__ferme=false;window.addEventListener("message",function(e){if(e.data&&e.data.mvtu==="fermer")window.__ferme=true;});</script>'
            + '<iframe id="f" src="/?tuto=' + id + '&tuto_auto=1&tuto_cadre=1" style="width:420px;height:860px;border:0"></iframe></body></html>');
          return;
        }
        if (p === '/' || p === '') p = '/index.html';
        let fp = join(racine, p);
        try { if ((await stat(fp)).isDirectory()) fp = join(fp, 'index.html'); } catch (e) { fp = join(racine, p); }
        if (!existsSync(fp)) { res.writeHead(404); res.end('404'); return; }
        res.writeHead(200, { 'Content-Type': MIME[extname(fp).toLowerCase()] || 'application/octet-stream' });
        res.end(await readFile(fp));
      } catch (e) { res.writeHead(500); res.end(String(e)); }
    });
    s.on('error', ko);
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}

async function jouer(navigateur, base, id, ecran) {
  const ctx = await navigateur.newContext(Object.assign({ serviceWorkers: 'block', locale: 'fr-FR' }, ecran.ctx));
  const fuites = [], erreurs = [];
  await ctx.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith(base)) return route.continue();
    if (/firestore\.googleapis\.com|firebasestorage|cloudfunctions\.net/.test(u)) fuites.push(route.request().method() + ' ' + u.slice(0, 90));
    return route.abort();
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { if (!benin(e.message)) erreurs.push('exception : ' + e.message); });
  page.on('console', (m) => { if (m.type() === 'error' && !benin(m.text())) erreurs.push('console : ' + m.text().slice(0, 200)); });
  const t0 = Date.now();
  let etat = null;
  try {
    await page.goto(base + '?tuto=' + encodeURIComponent(id) + '&tuto_auto=1', { waitUntil: 'load' });
    await page.waitForFunction(() => window.__MV_TUTO_ETAT && (window.__MV_TUTO_ETAT.fini || window.__MV_TUTO_ETAT.erreur), null, { timeout: DELAI });
  } catch (e) { erreurs.push('délai dépassé : ' + String(e.message || e).split('\n')[0]); }
  try { etat = await page.evaluate(() => Object.assign({ liste: window._mvTutoListe ? window._mvTutoListe() : [] }, window.__MV_TUTO_ETAT || {})); } catch (e) { erreurs.push('état illisible : ' + e.message); }
  await ctx.close();
  const ok = !!(etat && etat.fini && !etat.erreur && !erreurs.length && !fuites.length);
  return { ok, etat, erreurs, fuites, ms: Date.now() - t0 };
}

async function jouerCadre(navigateur, base, id) {
  const ctx = await navigateur.newContext({ serviceWorkers: 'block', locale: 'fr-FR', viewport: { width: 1280, height: 900 } });
  const fuites = [], erreurs = [];
  await ctx.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith(base)) return route.continue();
    if (/firestore\.googleapis\.com|firebasestorage|cloudfunctions\.net/.test(u)) fuites.push(route.request().method() + ' ' + u.slice(0, 90));
    return route.abort();
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { if (!benin(e.message)) erreurs.push('exception : ' + e.message); });
  const t0 = Date.now();
  let etat = null, parent = null;
  try {
    await page.goto(base + '__cadre.html?id=' + encodeURIComponent(id), { waitUntil: 'load' });
    await page.waitForFunction(() => { const f = document.getElementById('f'); return f && f.contentWindow && f.contentWindow.__MV_TUTO_ETAT && (f.contentWindow.__MV_TUTO_ETAT.fini || f.contentWindow.__MV_TUTO_ETAT.erreur); }, null, { timeout: DELAI });
    // « Fermer l'entraînement » dans le cadre : l'appli qui l'a ouvert doit recevoir la demande.
    await page.evaluate(() => { const d = document.getElementById('f').contentWindow.document; const b = d.querySelector('[data-f="sortir"]'); if (b) b.click(); });
    await page.waitForTimeout(400);
    etat = await page.evaluate(() => document.getElementById('f').contentWindow.__MV_TUTO_ETAT);
    parent = await page.evaluate(() => ({ session: sessionStorage.length, tenant: localStorage.getItem('mavigne_tenant'), local: localStorage.length, ferme: window.__ferme }));
  } catch (e) { erreurs.push('cadre : ' + String(e.message || e).split('\n')[0]); }
  await ctx.close();
  if (parent && (parent.session || parent.local || parent.tenant)) erreurs.push('la mémoire de l\u2019appli qui ouvre le panneau a bougé : ' + JSON.stringify(parent));
  if (parent && !parent.ferme) erreurs.push('« Fermer l\u2019entraînement » n\u2019a pas prévenu l\u2019appli');
  const ok = !!(etat && etat.fini && !etat.erreur && !erreurs.length && !fuites.length);
  return { ok, etat, erreurs, fuites, ms: Date.now() - t0 };
}

// TUTO-3 : le miroir. (1) côté fenêtre — une page qui répond « miroir » à chaque étape : la fenêtre doit aller au bout
// SANS qu'on touche à rien, et reprendre la valeur tapée « sur le domaine » (1 200 L). (2) côté domaine — l'appli joue le
// tuto en vrai (son propre écran) : à chaque étape qui se fait, la vérification du miroir doit la voir faite.
async function jouerMiroir(navigateur, base, id) {
  const ctx = await navigateur.newContext({ serviceWorkers: 'block', locale: 'fr-FR', viewport: { width: 1280, height: 900 } });
  await ctx.route('**/*', (route) => (route.request().url().startsWith(base) ? route.continue() : route.abort()));
  const page = await ctx.newPage(), erreurs = [];
  page.on('pageerror', (e) => { if (!benin(e.message)) erreurs.push('exception : ' + e.message); });
  let r1 = null;
  try {
    await page.goto(base + '__miroir.html?id=' + encodeURIComponent(id), { waitUntil: 'load' });
    await page.waitForFunction(() => { const w = document.getElementById('f').contentWindow; return w && w.__MV_TUTO_ETAT && w.__MV_TUTO_ETAT.fini; }, null, { timeout: DELAI });
    r1 = await page.evaluate(() => { const w = document.getElementById('f').contentWindow; return { etat: w.__MV_TUTO_ETAT, cuve: w.CONFIG && w.CONFIG.gnr ? w.CONFIG.gnr.niveau : null, anneau: window.__anneau.length }; });
    if (id === 'gnr' && r1.cuve !== 1850) erreurs.push('la valeur tapée sur le domaine n\u2019a pas suivi : cuve à ' + r1.cuve + ' L au lieu de 1 850');
    if (!r1.anneau) erreurs.push('le panneau n\u2019a jamais demandé l\u2019anneau doré');
    const nr = (r1.etat.types || []).filter((x) => x !== 'regarder').length, vites = r1.etat.vites || 0;
    if (vites > nr) erreurs.push('un geste rejoué plusieurs fois pour la même étape : ' + vites + ' gestes d\u2019un coup pour ' + nr + ' étapes');
    if (id === 'gnr') {   // départ aligné : chemin déjà fait sur le domaine → le panneau commence après lui
      const pa = await ctx.newPage();
      await pa.goto(base + '__miroir.html?id=gnr&aligne=1', { waitUntil: 'load' });
      await pa.waitForFunction(() => { const w = document.getElementById('f').contentWindow; return w && w.__MV_TUTO_ETAT && typeof w.__MV_TUTO_ETAT.depart === 'number'; }, null, { timeout: 30000 });
      const dep = await pa.evaluate(() => document.getElementById('f').contentWindow.__MV_TUTO_ETAT.depart);
      if (dep !== 2) erreurs.push('départ aligné : le panneau commence à l\u2019étape ' + (dep + 1) + ' au lieu de 3 (module et onglet déjà faits chez le client)');
      await pa.close();
    }
  } catch (e) { erreurs.push('miroir (fenêtre) : ' + String(e.message || e).split('\n')[0]); }
  // (2) la détection côté domaine
  const p2 = await ctx.newPage();
  let vus = null, types = [];
  try {
    await p2.goto(base + '?tuto=' + encodeURIComponent(id) + '&tuto_auto=1', { waitUntil: 'load' });
    await p2.waitForFunction(() => !!window._mvTutoAvant, null, { timeout: 20000 });
    // TUTO-7 : et JAMAIS une étape plus loin annoncée faite avant son tour (c'est ce qui faisait sauter le panneau de 2 à 4).
    await p2.evaluate((tid) => { window.__memo = window._mvTutoAvant(tid); window.__vus = {}; window.__tot = []; setInterval(function () { var s = window.__MV_TUTO_ETAT; if (!s || !s.etape) return; var i = s.etape - 1; if (window._mvTutoMiroirFait(tid, i, window.__memo)) window.__vus[i] = true; for (var j = i + 1; j <= i + 2 && j < s.total; j++) { if (window._mvTutoMiroirFait(tid, j, window.__memo) && window.__tot.indexOf(j + '<' + i) < 0) window.__tot.push(j + '<' + i); } }, 80); }, id);
    await p2.waitForFunction(() => window.__MV_TUTO_ETAT && (window.__MV_TUTO_ETAT.fini || window.__MV_TUTO_ETAT.erreur), null, { timeout: DELAI });
    const r2 = await p2.evaluate(() => ({ vus: window.__vus, types: window.__MV_TUTO_ETAT.types || [], suivis: window.__MV_TUTO_ETAT.suivis || [], tot: window.__tot }));
    vus = r2.vus; types = r2.types;
    r2.tot.forEach((x) => { const [a, b] = x.split('<').map(Number); erreurs.push('étape ' + (a + 1) + ' vue faite côté domaine alors que le panneau était à l\u2019étape ' + (b + 1) + ' (saut d\u2019étape)'); });
    types.forEach((ty, i) => { if (r2.suivis[i] && !vus[i]) erreurs.push('étape ' + (i + 1) + ' (' + ty + ') faite sur le domaine sans que le miroir la voie'); });
    types = types.filter((x, i) => r2.suivis[i]);
  } catch (e) { erreurs.push('miroir (domaine) : ' + String(e.message || e).split('\n')[0]); }
  await ctx.close();
  return { ok: !!(r1 && r1.etat && r1.etat.fini && !erreurs.length), erreurs, n: types.length };
}

// TUTO-4 : un boot.js d'une version précédente (resté en cache) — le panneau doit refuser, jamais ouvrir l'appli.
async function jouerVieuxBoot(navigateur, base) {
  const ctx = await navigateur.newContext({ serviceWorkers: 'block', locale: 'fr-FR', viewport: { width: 1280, height: 900 } });
  await ctx.route('**/*', (route) => (route.request().url().startsWith(base) ? route.continue() : route.abort()));
  await ctx.route('**/boot.js*', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '/* boot.js d\'une version précédente */' }));
  const page = await ctx.newPage(), erreurs = [];
  let r = null;
  try {
    await page.goto(base + '__cadre.html?id=equipes', { waitUntil: 'load' });
    await page.waitForFunction(() => { const f = document.getElementById('f'); return f && f.contentWindow && f.contentWindow.document.querySelector('.mvtu-bloque'); }, null, { timeout: 30000 });
    r = await page.evaluate(() => { const w = document.getElementById('f').contentWindow; return { bloque: w.__MV_TUTO_BLOQUE === true, accueil: !!w.document.querySelector('#page-home.active'), entrainement: !!w.__MV_TUTO_ETAT, session: sessionStorage.length }; });
    if (!r.bloque) erreurs.push('pas bloqué');
    if (r.accueil) erreurs.push('l\u2019appli s\u2019est ouverte dans le panneau');
    if (r.entrainement) erreurs.push('un entraînement a démarré sans le bon boot.js');
    if (r.session) erreurs.push('la mémoire de session de l\u2019appli a bougé');
  } catch (e) { erreurs.push('vieux boot.js : ' + String(e.message || e).split('\n')[0]); }
  await ctx.close();
  return { ok: !!r && !erreurs.length, erreurs };
}

async function main() {
  let pw;
  try { pw = await import('playwright'); } catch (e) { console.error(c.r('✖ Playwright absent : npm i -D playwright && npx playwright install chromium')); process.exit(2); }
  if (!existsSync(DIR)) { console.error(c.r('✖ ' + DIR + ' absent : lancer npm run build d\u2019abord')); process.exit(2); }
  const srv = await serveur(DIR), base = 'http://127.0.0.1:' + srv.address().port + '/';
  const navigateur = await pw.chromium.launch(process.env.MV_CHROMIUM ? { executablePath: process.env.MV_CHROMIUM, args: ['--no-sandbox'] } : {});
  const ECRANS = [
    { nom: 'téléphone', ctx: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
    { nom: 'ordinateur', ctx: { viewport: { width: 1280, height: 860 } } },
  ];
  console.log(c.b('MA VIGNE — Les tutos rejoués sur le build') + c.dim('  (' + base + ')'));
  let liste = ['equipes'], rouges = 0, premier = true;
  for (const ecran of ECRANS) {
    for (let i = 0; i < liste.length; i++) {
      const r = await jouer(navigateur, base, liste[i], ecran);
      if (premier && r.etat && r.etat.liste && r.etat.liste.length) { liste = r.etat.liste; premier = false; }
      const lib = ecran.nom + ' · ' + liste[i] + ' · ' + (r.etat ? (r.etat.etape + '/' + r.etat.total + ' étapes') : '?') + ' · ' + (r.ms / 1000).toFixed(1) + ' s · porte : ' + ((r.etat && r.etat.bloques) || 0) + ' appel(s) retenu(s)';
      if (r.ok) console.log(c.g('  ✓ ') + lib);
      else {
        rouges++;
        console.log(c.r('  ✗ ') + lib);
        if (r.etat && r.etat.erreur) console.log('      ' + r.etat.erreur);
        r.erreurs.slice(0, 5).forEach((e) => console.log('      ' + e));
        r.fuites.slice(0, 5).forEach((e) => console.log('      fuite vers le serveur : ' + e));
      }
    }
  }
  for (let i = 0; i < liste.length; i++) {
    const r = await jouerCadre(navigateur, base, liste[i]);
    const lib = 'panneau (cadre) · ' + liste[i] + ' · ' + (r.etat ? (r.etat.etape + '/' + r.etat.total + ' étapes') : '?') + ' · ' + (r.ms / 1000).toFixed(1) + ' s · mémoire de l\u2019appli intacte, fermeture transmise';
    if (r.ok) console.log(c.g('  ✓ ') + lib);
    else { rouges++; console.log(c.r('  ✗ ') + lib.split(' · mémoire')[0]); r.erreurs.slice(0, 5).forEach((e) => console.log('      ' + e)); r.fuites.slice(0, 5).forEach((e) => console.log('      fuite vers le serveur : ' + e)); }
  }
  for (let i = 0; i < liste.length; i++) {
    const r = await jouerMiroir(navigateur, base, liste[i]);
    if (r.ok) console.log(c.g('  ✓ ') + 'miroir · ' + liste[i] + ' · la fenêtre suit le domaine jusqu\u2019au bout ; ' + r.n + ' étape(s) vues faites côté domaine');
    else { rouges++; console.log(c.r('  ✗ ') + 'miroir · ' + liste[i]); r.erreurs.slice(0, 6).forEach((e) => console.log('      ' + e)); }
  }
  {
    const r = await jouerVieuxBoot(navigateur, base);
    if (r.ok) console.log(c.g('  ✓ ') + 'boot.js d\u2019une version précédente · le panneau refuse et le dit ; ni entraînement, ni appli');
    else { rouges++; console.log(c.r('  ✗ ') + 'boot.js d\u2019une version précédente'); r.erreurs.forEach((e) => console.log('      ' + e)); }
  }
  await navigateur.close(); srv.close();
  console.log('\n  ' + (rouges ? c.r(rouges + ' tuto(s) ne vont plus au bout : l\u2019écran a changé, le tuto doit suivre') : c.g('chaque tuto va au bout, sans rien envoyer au serveur')) + '\n');
  process.exit(rouges ? 1 : 0);
}
main().catch((e) => { console.error(c.r('✖ ' + (e && e.stack || e))); process.exit(1); });
