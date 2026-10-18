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
  await navigateur.close(); srv.close();
  console.log('\n  ' + (rouges ? c.r(rouges + ' tuto(s) ne vont plus au bout : l\u2019écran a changé, le tuto doit suivre') : c.g('chaque tuto va au bout, sans rien envoyer au serveur')) + '\n');
  process.exit(rouges ? 1 : 0);
}
main().catch((e) => { console.error(c.r('✖ ' + (e && e.stack || e))); process.exit(1); });
