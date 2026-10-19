#!/usr/bin/env node
// =============================================================================
// Ma Vigne — LES CAPTURES DES VRAIS ÉCRANS (CAPTURES-1, §371)
// -----------------------------------------------------------------------------
// Lancer :  npm run build   (ou, sans la chaîne : node scripts/mv-gt-page.mjs puis npx vite build)
//           node scripts/mv-captures.mjs                       (tous les écrans de la liste)
//           node scripts/mv-captures.mjs --ecrans cave-operation,tracteur-ajout
// Première fois sur un poste : npx playwright install chromium
// Sortie : rapports/captures/<vue>-<thème>-<écran>.png  (rapports/ est dans .gitignore)
//
// POURQUOI CET OUTIL. Trois lots de la série CHARTE ont dû écrire « les écrans n'ont pas été
// regardés » : les montages d'e2e-local et de mv-tour restaient sur l'écran de connexion. Trois
// causes, trouvées une par une (§371) :
//   1. le serveur de développement de Vite RECHARGE la page quand il découvre une dépendance ;
//      → on capture l'appli CONSTRUITE (dist/), servie telle quelle ;
//   2. le premier chargement avec ?tenant= se recharge LUI-MÊME (le domaine est rangé) : tout ce
//      qu'on pose avant ce rechargement est perdu → on attend le second chargement ;
//   3. la connexion simulée d'e2e-local cherche une tuile au nom complet, et les membres injectés
//      n'arrivent pas toujours → on entre par la DÉMO : fbLoginDemo simulé, _authReady posé,
//      _startDemoVisite joue son scénario (Domaine des Grandes Vignes, données en mémoire,
//      AUCUNE écriture : le réseau extérieur est coupé, Firebase compris).
//   Et un serveur maison ne renvoie JAMAIS la page d'accueil pour un fichier absent (/version.json) :
//   il répond « absent ».
// ★ LA RÈGLE : une capture où l'écran de connexion est revenu NE COMPTE PAS — l'outil la nomme et
//   sort en code 1. Deux écrans de connexion identiques font zéro pixel d'écart et ne prouvent rien.
// ★ Bac à sable de Claude : MV_CHROMIUM=<chemin d'un Chromium> (Playwright ne peut pas y télécharger
//   le sien) ; les drapeaux --no-sandbox et compagnie sont alors posés.
// =============================================================================
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const DIST = path.join(RACINE, 'dist');
const SORTIE = path.join(RACINE, 'rapports', 'captures');
const PORT = 5341;
const ARGS = process.argv.slice(2);
const opt = k => { const i = ARGS.indexOf(k); return i >= 0 ? ARGS[i + 1] : ''; };

/* Les écrans : un nom, et le geste qui l'ouvre (des fonctions de l'appli posées sur window). */
const ECRANS = {
  'accueil': "goTo('home');",
  'parcelles': "goTo('parcelles');",
  'tracteur': "goTo('tracteur');",
  'tracteur-ajout': "goTo('tracteur'); openOv('ovAddTracteur');",
  'tracteur-session': "goTo('tracteur'); openOv('ovSessionDetail');",
  'phyto': "goTo('phyto');",
  'cave': "goTo('cave');",
  'cave-operation': "goTo('cave'); openOv('ovCaveOp');",
  'cave-retrait-fut': "goTo('cave'); openOv('ovRetraitFut');",
  'reserve': "goTo('reserve');",
  'planning': "goTo('planning');",
  'pilotage': "goTo('pilotage');",
  'reglages': "goTo('reglages');"
};
const choisis = opt('--ecrans') ? opt('--ecrans').split(',').map(x => x.trim()).filter(Boolean) : Object.keys(ECRANS);
const inconnus = choisis.filter(x => !ECRANS[x]);
if (inconnus.length) { console.error('écran(s) inconnu(s) : ' + inconnus.join(', ') + '\nconnus : ' + Object.keys(ECRANS).join(', ')); process.exit(2); }
if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('dist/ absent : lancer d’abord npm run build (ou node scripts/mv-gt-page.mjs puis npx vite build)'); process.exit(2); }

let playwright;
try { playwright = await import('playwright'); } catch (e) { console.error('Playwright absent : npm i (il est dans les devDependencies), puis npx playwright install chromium'); process.exit(2); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml',
                '.json': 'application/json', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
const absents = new Set();
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(DIST, p);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { absents.add(p); r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(PORT);
const U = 'http://localhost:' + PORT;

const exe = process.env.MV_CHROMIUM || '';
const navigateur = await playwright.chromium.launch({ headless: true, ...(exe ? { executablePath: exe, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-zygote'] } : {}) });
fs.mkdirSync(SORTIE, { recursive: true });
const invalides = [], erreurs = []; let faites = 0;
for (const vue of [{ id: 'tel', w: 390, h: 844 }, { id: 'pc', w: 1366, h: 900 }]) for (const theme of ['clair', 'sombre']) {
  const ctx = await navigateur.newContext({ viewport: { width: vue.w, height: vue.h }, reducedMotion: 'reduce', serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR' });
  const page = await ctx.newPage();
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(U) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  let chargements = 0; page.on('load', () => { chargements++; });
  page.on('pageerror', e => erreurs.push(vue.id + '/' + theme + ' : ' + String(e && e.message).slice(0, 160)));
  try {
    await page.goto(U + '/?tenant=e2e-test', { waitUntil: 'domcontentloaded', timeout: 90000 });
    for (let k = 0; k < 40 && chargements < 2; k++) await page.waitForTimeout(250);   // cause n°2 : il se recharge lui-même
    await page.waitForFunction(() => window.__MV_BOOTED === true && typeof window._startDemoVisite === 'function', null, { timeout: 90000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { window.fbLoginDemo = async () => true; window._authReady = true; window._startDemoVisite(); });
    await page.waitForFunction(() => { const ls = document.getElementById('login-screen'); return !ls || ls.style.display === 'none'; }, null, { timeout: 30000 });
    await page.waitForTimeout(2500);
    for (const nom of choisis) {
      await page.evaluate(([code, th]) => {
        document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
        document.querySelectorAll('[id^="mvt"], [class^="mvt-"], [class*=" mvt-"]').forEach(e => { e.style.display = 'none'; });
        const t = th === 'sombre' ? 'dark' : 'light'; document.documentElement.setAttribute('data-theme', t);
        const a = document.getElementById('app-root'); if (a) a.setAttribute('data-theme', t);
        try { new Function(code)(); } catch (e) { console.error('écran : ' + e.message); }
      }, [ECRANS[nom], theme]);
      await page.waitForTimeout(1500);
      const connexion = await page.evaluate(() => { const ls = document.getElementById('login-screen'); return !!(ls && ls.style.display !== 'none'); });
      const fichier = path.join(SORTIE, vue.id + '-' + theme + '-' + nom + '.png');
      await page.screenshot({ path: fichier });
      if (connexion) invalides.push(path.relative(RACINE, fichier)); else faites++;
    }
  } catch (e) { erreurs.push(vue.id + '/' + theme + ' ARRÊT : ' + e.message); }
  await ctx.close();
}
await navigateur.close(); srv.close();
console.log('\n  captures valables : ' + faites + ' — dans ' + path.relative(RACINE, SORTIE) + '/');
if (absents.size) console.log('  fichiers demandés absents de dist/ (servis « absent ») : ' + [...absents].join(' '));
if (erreurs.length) { console.log('  erreurs JS :'); erreurs.slice(0, 10).forEach(e => console.log('    ' + e)); }
if (invalides.length) { console.log('  \x1b[31m✗ l’écran de connexion est revenu — ces captures NE COMPTENT PAS :\x1b[0m'); invalides.forEach(f => console.log('    ' + f)); }
process.exit(invalides.length || !faites ? 1 : 0);
