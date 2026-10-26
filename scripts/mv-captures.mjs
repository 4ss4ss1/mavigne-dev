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
  'reglages': "goTo('reglages');",
  // ★ CAPTURES-2 (§375) : les vues profondes où vivent les pastilles du jeu (CHARTE-4a)
  'planning-gens': "goTo('planning'); planSwitchTab('gens');",
  'pilotage-decider': "goTo('pilotage'); if (window._pilSetTab) window._pilSetTab('sim');",   // l’onglet « Décider » a la clé sim
  'tracteur-session-detail': "goTo('tracteur'); setTimeout(function(){ var c = document.querySelector('[onclick^=\"openSessionDetail\"]'); if (c) c.click(); }, 400);",
  'cave-chai': "goTo('cave'); selectCaveSection('elevage');",
  // ★ REVUE-1 (§389) : les écrans où vivent les pièces passées au jeu (CHARTE-3 à 5c) sans avoir été vues
  'accueil-ouvrier': "window.currentUser.roles = ['ouvrier']; if (window.applyRoles) window.applyRoles(); goTo('home');",
  'phyto-traitement': "goTo('phyto'); setTimeout(function(){ var c = document.querySelector('[onclick^=\"openTraitEdit\"]'); if (c) c.click(); }, 500);",
  'cave-cuvee': "goTo('cave'); selectCaveSection('elevage'); setTimeout(function(){ var c = document.querySelector('#mvc-body-cuv .mvc-cuv[data-cuv]'); if (c) c.click(); }, 500);",
  'tracteur-entretien': "goTo('tracteur'); switchTracOnglet('entretiens');",
  'reglages-documents': "goTo('reglages'); window.openDocs();",
  'ma-trace': "window.currentUser.roles = ['ouvrier']; goTo('home'); setTimeout(function(){ if (window.openMaTrace) window.openMaTrace(); }, 400);",
  // ★ REVUE-2 (§390)
  'phyto-saisie': "goTo('phyto'); setTimeout(function(){ if (window.openTraitEdit) window.openTraitEdit(0); }, 400);",
  'mur': "goTo('home'); setTimeout(function(){ if (window.openMur) window.openMur(); }, 400);",
  // ★ REVUE-3 (§392) : des situations mises en place par l’outil, sans toucher à la démo des visiteurs
  'phyto-produit': "goTo('phyto'); switchPhytoTab('cat'); setTimeout(function(){ var c = document.querySelector('.catitem'); if (c) c.click(); }, 500);",
  'phyto-cuivre': "var _r = window._visiteScenarioReady; window._visiteScenarioReady = false; window.applyFbData('parcelles', [{ id: 'rv1', nom: 'Les Grandes Vignes', surface: 0.42, superficie: 0.42, statut: 'Actif', cepage: 'Pinot noir' }, { id: 'rv2', nom: 'Champ Perdrix', surface: 0.31, superficie: 0.31, statut: 'Actif', cepage: 'Pinot noir' }]); window._visiteScenarioReady = _r; goTo('phyto'); openOvTraitement(); setTimeout(function(){ window._tratSearch('Bouillie bordelaise RSR'); window._tratPick(0); var d = document.getElementById('trat-dose-input'); if (d) d.value = '1,5'; window._tratAddSel(); window._tratSetCu(0, '30'); window._tratSetConducteur('Paul'); var dt = document.getElementById('trat-date'); if (dt) dt.value = '2026-10-20'; window._tratNext(); window._tratAllParc(); window._tratNext(); }, 400);",
  'phyto-cuivre-1': "var _r = window._visiteScenarioReady; window._visiteScenarioReady = false; window.applyFbData('parcelles', [{ id: 'rv1', nom: 'Les Grandes Vignes', surface: 0.42, superficie: 0.42, statut: 'Actif', cepage: 'Pinot noir' }, { id: 'rv2', nom: 'Champ Perdrix', surface: 0.31, superficie: 0.31, statut: 'Actif', cepage: 'Pinot noir' }]); window._visiteScenarioReady = _r; goTo('phyto'); openOvTraitement(); setTimeout(function(){ window._tratSearch('Bouillie bordelaise RSR'); window._tratPick(0); var d = document.getElementById('trat-dose-input'); if (d) d.value = '1,5'; window._tratAddSel(); window._tratSetCu(0, '30'); window._tratSetConducteur('Paul'); var dt = document.getElementById('trat-date'); if (dt) dt.value = '2026-10-20'; }, 400);",   // ★ CHARTE-5f (§399) : l’étape 1 (produit choisi, conducteur, mode)
  'phyto-cuivre-2': "var _r = window._visiteScenarioReady; window._visiteScenarioReady = false; window.applyFbData('parcelles', [{ id: 'rv1', nom: 'Les Grandes Vignes', surface: 0.42, superficie: 0.42, statut: 'Actif', cepage: 'Pinot noir' }, { id: 'rv2', nom: 'Champ Perdrix', surface: 0.31, superficie: 0.31, statut: 'Actif', cepage: 'Pinot noir' }]); window._visiteScenarioReady = _r; goTo('phyto'); openOvTraitement(); setTimeout(function(){ window._tratSearch('Bouillie bordelaise RSR'); window._tratPick(0); var d = document.getElementById('trat-dose-input'); if (d) d.value = '1,5'; window._tratAddSel(); window._tratSetCu(0, '30'); window._tratSetConducteur('Paul'); var dt = document.getElementById('trat-date'); if (dt) dt.value = '2026-10-20'; window._tratNext(); window._tratAllParc(); }, 400);",   // l’étape 2 (les parcelles choisies)
  // ★ REVUE-4 (§393)
  'session-chrono': "var _r = window._visiteScenarioReady; window._visiteScenarioReady = false; window.applyFbData('parcelles', [{ id: 'rv1', nom: 'Les Grandes Vignes', surface: 0.42, superficie: 0.42, statut: 'Actif', cepage: 'Pinot noir' }, { id: 'rv2', nom: 'Champ Perdrix', surface: 0.31, superficie: 0.31, statut: 'Actif', cepage: 'Pinot noir' }, { id: 'rv3', nom: 'Les Murgers', surface: 0.55, superficie: 0.55, statut: 'Actif', cepage: 'Pinot noir' }]); window._visiteScenarioReady = _r; if (window.CONFIG) window.CONFIG.chrono_mode = 'on'; var s = (window.SESSIONS || [])[0]; if (s) s.parcellesFaites = [{ nom: 'Les Grandes Vignes', mes: 42 }, { nom: 'Champ Perdrix', mes: 95, ecarte: 'haut' }]; goTo('tracteur'); setTimeout(function(){ var c = document.querySelector('[onclick^=\"openSessionDetail\"]'); if (c) c.click(); setTimeout(function(){ if (window.toggleSDShowDone) window.toggleSDShowDone(); var b = document.getElementById('sd-show-done-btn'); if (b) b.scrollIntoView({ block: 'start' }); }, 400); }, 400);",
  'session-chrono-haut': "var _r = window._visiteScenarioReady; window._visiteScenarioReady = false; window.applyFbData('parcelles', [{ id: 'rv1', nom: 'Les Grandes Vignes', surface: 0.42, superficie: 0.42, statut: 'Actif', cepage: 'Pinot noir' }, { id: 'rv2', nom: 'Champ Perdrix', surface: 0.31, superficie: 0.31, statut: 'Actif', cepage: 'Pinot noir' }, { id: 'rv3', nom: 'Les Murgers', surface: 0.55, superficie: 0.55, statut: 'Actif', cepage: 'Pinot noir' }]); window._visiteScenarioReady = _r; if (window.CONFIG) window.CONFIG.chrono_mode = 'on'; var s = (window.SESSIONS || [])[0]; if (s) s.parcellesFaites = [{ nom: 'Les Grandes Vignes', mes: 42 }, { nom: 'Champ Perdrix', mes: 95, ecarte: 'haut' }]; goTo('tracteur'); setTimeout(function(){ var c = document.querySelector('[onclick^=\"openSessionDetail\"]'); if (c) c.click(); }, 400);",   // ★ CHRONO-1 (§394) : le haut de la session (la bande des trois temps)
  // ★ JCAVE-1 (§428) : les journées de cave au Planning — des bandes posées par l’outil sur les jours qui précèdent (rien
  //   d’enregistré : CONFIG en mémoire), un jour coché pour la barre et son bouton « Cave », puis la fenêtre « Travail de cave ».
  'planning-cave': "goTo('planning'); setTimeout(function(){ if (window.planSelClear) window.planSelClear(); var t=new Date(), J={}, p=function(n){ return String(n).padStart(2,'0'); }, M=(window.MEMBRES||[]).filter(function(m){ return !m.bureau; }); for(var i=0;i<4;i++){ var d=new Date(t.getFullYear(),t.getMonth(),t.getDate()-i); if(d.getMonth()!==t.getMonth()) continue; var iso=d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); J[iso]={}; if(M[1]) J[iso][M[1].nom]=['j','m','a','j'][i]; if(M[2]) J[iso][M[2].nom]='j'; } window.CONFIG.cave_jours=J; if(window._pl2Refresh) window._pl2Refresh(); var h=document.querySelector('[data-tuto=\"plan.jour\"]'); if(h) h.click(); }, 700);",
  'planning-cave-fenetre': "goTo('planning'); setTimeout(function(){ if (window.planSelClear) window.planSelClear(); var t=new Date(), J={}, p=function(n){ return String(n).padStart(2,'0'); }, M=(window.MEMBRES||[]).filter(function(m){ return !m.bureau; }); for(var i=0;i<4;i++){ var d=new Date(t.getFullYear(),t.getMonth(),t.getDate()-i); if(d.getMonth()!==t.getMonth()) continue; var iso=d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); J[iso]={}; if(M[1]) J[iso][M[1].nom]=['j','m','a','j'][i]; if(M[2]) J[iso][M[2].nom]='j'; } window.CONFIG.cave_jours=J; if(window._pl2Refresh) window._pl2Refresh(); var h=document.querySelector('[data-tuto=\"plan.jour\"]'); if(h) h.click(); setTimeout(function(){ if (window.planCaveSheet) window.planCaveSheet(); if (window.planCaveMode) window.planCaveMode('a'); }, 300); }, 700);",
  'planning-demande': "goTo('planning'); planSwitchTab('gens'); setTimeout(function(){ var d = document.querySelector('.pf-dem'); if (d) d.scrollIntoView({ block: 'center' }); }, 600);",
  // ★ CHARTE-6b (§401) : un formulaire de la Réserve (ses champs .mvr-fi)
  'reserve-achat': "goTo('reserve'); setTimeout(function(){ if (window._rsvOpenAchat) window._rsvOpenAchat(); }, 500);",
  // ★ CHARTE-6c (§403) : une fiche du Cuvier (ses champs .mvv-tin)
  'cuvier-client': "goTo('cave'); setTimeout(function(){ if (window._caveRegSec) window._caveRegSec('cuvier'); setTimeout(function(){ if (window.openVendClient) window.openVendClient(); }, 400); }, 400);",
  'mot-de-passe-erreur': "goTo('reglages'); if (window.openChangePwd) window.openChangePwd(); else window._openOv('ovChangePwd'); setTimeout(function(){ var e = document.getElementById('cpwd-error'); if (e) { e.textContent = 'Le mot de passe actuel ne correspond pas.'; e.style.display = 'block'; } }, 300);",
  // ★ BASCULE-1 (§422) : la bascule « Vignoble / Secteurs » de la carte Météo. La démo n’a qu’une commune : l’appli la cache
  // (moins de deux communes), c’est pourquoi ACCV-3 ne l’a jamais vue au rendu. L’outil l’affiche, sans rien changer d’autre.
  'accueil-meteo-bascule': "goTo('home'); setTimeout(function(){ var s = document.getElementById('home-meteo-vue'); if (s) s.style.display = ''; var c = document.querySelector('.home-w[data-w=\"meteo5\"]'); if (c) c.scrollIntoView({ block: 'center' }); }, 400);",
  // ★ ECART-1 (§460) : la vue Économie d’Aujourd’hui. La démo n’a pas de taux horaire, donc pas d’économie : l’outil lui en
  // donne un en mémoire (le barème de repli par contrat, CONFIG.eco.taux_horaire, rien d’enregistré), puis ouvre la bascule
  // Économie et amène la carte « Écart au barème, par tâche » au milieu de l’écran.
  'pilotage-eco': "var c = window.CONFIG || {}; c.eco = Object.assign({}, c.eco || {}, { taux_horaire: { CDI: 22, CDD: 20, TESA: 19, Saisonnier: 19 } }); window.CONFIG = c; goTo('pilotage'); if (window._pilSetTab) window._pilSetTab('auj'); setTimeout(function(){ var b = document.querySelector('[data-mode=\"eco\"]'); if (b) b.click(); setTimeout(function(){ var s = document.getElementById('ck-etac'); if (s) s.scrollIntoView({ block: 'center' }); }, 500); }, 900);",
  // Puis deux lignes comparables — les chiffres de la capture de Nico (15,4 h pour 108,2 h ; 322 h pour 374 h) — posées dans le
  // modèle au montage du cockpit (la démo n’a ni parcelle ni tâche à cet écran : deux tâches y sont ajoutées, en mémoire) ;
  // la tuile prend le total, la première barre passe hors échelle.
  'pilotage-eco-ecart': "var c = window.CONFIG || {}; c.eco = Object.assign({}, c.eco || {}, { taux_horaire: { CDI: 22, CDD: 20, TESA: 19, Saisonnier: 19 } }); window.CONFIG = c; var f = window._ck2Monter; window._ck2Monter = function(v){ var T = v.taches = (v.taches || []).slice(); var t = function(cle, nom){ return { id: cle.toLowerCase(), cle: cle, nom: nom, art: 'la ' + nom.toLowerCase(), pct: 30, hha: 8 }; }; if (T.length < 2) { T.push(t('Reparation', 'Réparation')); T.push(t('Degraffage', 'Dégraffage')); } if (v.eco) { var a = T[0].cle || T[0].nom, z = T[1].cle || T[1].nom; v.eco.ecTache = {}; v.eco.hBarTache = {}; v.eco.hReelTache = {}; v.eco.ecTache[a] = (108.2 - 15.4) / 15.4; v.eco.hBarTache[a] = 15.4; v.eco.hReelTache[a] = 108.2; v.eco.ecTache[z] = 52 / 322; v.eco.hBarTache[z] = 322; v.eco.hReelTache[z] = 374; v.eco.ecartMoy = (482.2 - 337.4) / 337.4; } return f(v); }; goTo('pilotage'); if (window._pilSetTab) window._pilSetTab('auj'); setTimeout(function(){ window._ck2Monter = f; var b = document.querySelector('[data-mode=\"eco\"]'); if (b) b.click(); setTimeout(function(){ var s = document.getElementById('ck-etac'); if (s) s.scrollIntoView({ block: 'center' }); }, 300); }, 700);",
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
        // ★ REVUE-1 (§389) : chaque écran repart avec les rôles de la démo (admin, ouvrier, tractoriste) — un écran « ouvrier »
        // les réduit, et sans cette remise les écrans suivants seraient pris en ouvrier (« Réservé à l’administrateur »).
        if (window.currentUser) { if (!window.__MV_ROLES0) window.__MV_ROLES0 = (window.currentUser.roles || []).slice(); window.currentUser.roles = window.__MV_ROLES0.slice(); if (window.applyRoles) window.applyRoles(); }
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
