#!/usr/bin/env node
// =============================================================================
// Ma Vigne — LES CAPTURES DE LA DÉMO DU SITE (DEMO-5)
// -----------------------------------------------------------------------------
// Lancer :  npm run build   (ou, sans la chaîne : node scripts/mv-gt-page.mjs && npx vite build)
//           node scripts/mv-demo-captures.mjs                  → public/demo/*.webp + les deux tables de public/demo.html
//           node scripts/mv-demo-captures.mjs --ecrans r-ouv-arrivee,r-trac-matin
//           node scripts/mv-demo-captures.mjs --sortie /tmp/essai --sans-page   (essai : rien n'est touché dans le dépôt)
// Bac à sable de Claude : MV_CHROMIUM=<chemin d'un Chromium>.
//
// POURQUOI. La démo du site (`/demo.html`, DEMO-4 §240) montre des CAPTURES de la vraie appli. Elles vieillissent
// à chaque écran qui change : celles du 04/10 montraient encore l'appli d'avant la refonte (en-tête noir, barre
// dorée). DEMO-4 avait écrit « les scripts de capture ne sont pas versionnés (à faire) » : les voici. Mettre la
// démo à jour après un changement d'écran = relancer ce script, puis relire les textes des scènes (le script ne
// juge aucun texte).
// ★ COMMENT : l'appli CONSTRUITE (dist/), entrée par la démo comme mv-captures (CAPTURES-1, §371) — le domaine
//   fictif des tutos, puis _startDemoVisite, réseau extérieur coupé, AUCUNE écriture. L'horloge est posée au mardi
//   27/10/2026, 9 h (Paris), comme test:ux : la démo se construit autour d'« aujourd'hui ».
// ★ CHAQUE TÉLÉPHONE AVEC SES DROITS : le rôle et les modules d'un vrai membre (Jean, Paul, Sophie), le drapeau de
//   démo levé (sinon _mvModOff ne restreint rien), menu du bas reconstruit. Le gérant reste le visiteur de la démo.
// ★ LES SITUATIONS sont posées EN MÉMOIRE par ce script (la démo des visiteurs n'est pas touchée) : la saison de Jean
//   pour « Ma trace », un taux horaire pour le coût par parcelle. Le palissage fait vient du scénario de la démo.
// ★ SORTIES : <id>.webp (téléphone 720 px de large, ordinateur 1600) et t-<id>.webp (vignette 200 × 250) ;
//   les rectangles des éléments visés (le doigt, l'anneau) dans la table `metadata` de la page.
// ★ Une capture où l'écran de connexion est revenu NE COMPTE PAS : le script la nomme et sort en code 1.
// =============================================================================
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const DIST = path.join(RACINE, 'dist');
const ARGS = process.argv.slice(2);
const opt = (k) => { const i = ARGS.indexOf(k); return i >= 0 ? ARGS[i + 1] : ''; };
const SORTIE = opt('--sortie') || path.join(RACINE, 'public', 'demo');
const SANS_PAGE = ARGS.includes('--sans-page') || !!opt('--sortie');
const PAGE_DEMO = path.join(RACINE, 'public', 'demo.html');
const HORLOGE = '2026-10-27T08:00:00Z';   // mardi 27 octobre 2026, 9 h à Paris
const PORT = 5361;

// ── Les personnes ─────────────────────────────────────────────────────────────
const QUI = {
  gerant: null,   // le visiteur de la démo : admin, ouvrier, tractoriste — il voit tout
  jean: { nom: 'Jean', roles: ['ouvrier'], mods: { cave: false, tracteur: false } },
  paul: { nom: 'Paul', roles: ['ouvrier', 'tractoriste'], mods: { cave: false } },
  sophie: { nom: 'Sophie', roles: ['ouvrier'], mods: { vigne: false, tracteur: false, phyto: false } }
};

// ── Les écrans ────────────────────────────────────────────────────────────────
// id · vue (tel | pc) · qui · geste (code joué dans la page) · attente (ms) · vise (sélecteurs mesurés) · centre (sélecteur amené au milieu)
const S = (id, vue, qui, geste, extra) => Object.assign({ id, vue, qui, geste, attente: 1800, vise: [] }, extra || {});
const ECRANS = [
  // — le gérant —
  S('r-ger-accueil', 'tel', 'gerant', "goTo('home');"),
  S('r-ger-prep', 'tel', 'gerant', "goTo('home'); setTimeout(function(){ openPriorityEdit(); }, 300);", { vise: ['#ovPriority .mbtn.verte'] }),
  S('r-ger-equipes', 'tel', 'gerant', "goTo('home'); setTimeout(function(){ var b=document.querySelector('[data-tuto=\"home.eqj\"]'); if(b) b.click(); }, 400);", { attente: 2200 }),
  S('r-ger-pilotage', 'tel', 'gerant', "goTo('pilotage'); _pilSetTab('auj');", { attente: 2600 }),
  S('r-ger-echeances', 'tel', 'gerant', "goTo('pilotage'); _pilSetTab('avc');", { attente: 2400, centre: '.pil-tile[data-pid=\"echeances\"]', vise: ['.pil-tile[data-pid=\"echeances\"]'] }),
  S('r-ger-renfort', 'tel', 'gerant', "goTo('pilotage'); _pilSetTab('sim');", { attente: 2400, centre: '.pil-tile[data-pid=\"renfort\"]', vise: ['.pil-tile[data-pid=\"renfort\"]'] }),
  S('r-ger-cout', 'tel', 'gerant', "__ecoTaux(); goTo('pilotage'); _pilSetTab('eco'); setTimeout(function(){ __clic('Parcelles', '.page.active'); }, 900);", { attente: 3000 }),
  S('r-ger-conformite', 'tel', 'gerant', "goTo('pilotage'); _pilSetTab('cfm');", { attente: 2400 }),
  S('r-ger-journal', 'tel', 'gerant', "goTo('journal');"),
  S('meteo-secteurs', 'tel', 'gerant', "goTo('home'); setTimeout(function(){ var c=document.querySelector('.home-w[data-w=\"meteo5\"]'); if(c) c.scrollIntoView({block:'center'}); }, 400);"),
  S('planning', 'tel', 'gerant', "goTo('planning');"),
  S('fiche-jean', 'tel', 'gerant', "goTo('planning'); setTimeout(function(){ if(window.openPlanFiche) openPlanFiche('Jean'); }, 500);"),
  S('documents', 'tel', 'gerant', "goTo('reglages'); setTimeout(function(){ window.openDocs(); }, 400);"),
  S('phyto', 'tel', 'gerant', "goTo('phyto');"),
  S('reserve', 'tel', 'gerant', "goTo('reserve');"),
  S('aide-tutos', 'tel', 'gerant', "goTo('home'); setTimeout(function(){ if(window.openAide) openAide(); }, 400);"),
  S('pilotage-auj-pc', 'pc', 'gerant', "goTo('pilotage'); _pilSetTab('auj');", { attente: 2800 }),
  S('cout-pc', 'pc', 'gerant', "__ecoTaux(); goTo('pilotage'); _pilSetTab('eco'); setTimeout(function(){ __clic('Parcelles', '.page.active'); }, 900);", { attente: 3200 }),
  S('renfort-pc', 'pc', 'gerant', "goTo('pilotage'); _pilSetTab('sim');", { attente: 2600 }),
  S('journal-pc', 'pc', 'gerant', "goTo('journal');"),
  S('planning-pc', 'pc', 'gerant', "goTo('planning');"),
  S('cave-pc', 'pc', 'gerant', "goTo('cave'); selectCaveSection('aujourdhui');", { attente: 2400 }),
  // — l'ouvrier —
  S('r-ouv-accueil', 'tel', 'jean', "goTo('home');", { vise: ['#mv-dock'] }),
  S('r-ouv-arrivee', 'tel', 'jean', "goTo('parcelles');", { vise: ['.pcard-qv .pc-validate', '.pcard-qv'] }),
  S('r-ouv-pourquoi', 'tel', 'jean', "goTo('home'); setTimeout(function(){ var b=[...document.querySelectorAll('button,[onclick]')].find(function(e){ return /Pourquoi/.test(e.textContent||'') && e.getClientRects().length; }); if(b) b.click(); }, 400);"),
  S('r-ouv-trace', 'tel', 'jean', "goTo('home'); setTimeout(function(){ if(window.openMaTrace) openMaTrace(); }, 400);", { attente: 2400 }),
  // — le tractoriste —
  S('r-trac-matin', 'tel', 'paul', "goTo('home'); setTimeout(function(){ openOv('ovMode'); }, 300);", { vise: ['.mvmode-oui'] }),
  S('r-trac-sessions', 'tel', 'paul', "_mvModeChoisir('tracteur');", { attente: 2200, vise: ['#mv-dock'] }),
  S('r-trac-compteur', 'tel', 'paul', "goTo('tracteur'); setTimeout(function(){ if(window.switchTracOnglet) switchTracOnglet('entretiens'); }, 300);", { attente: 2200 }),
  // — le maître de chai —
  S('r-chai-accueil', 'tel', 'sophie', "_goLanding(); setTimeout(function(){ if(window.selectCaveSection) selectCaveSection('aujourdhui'); }, 300);", { attente: 2400, vise: ['#mv-dock'] }),
  S('r-chai-chai', 'tel', 'sophie', "goTo('cave'); selectCaveSection('elevage');", { attente: 2200 }),
  S('r-chai-tournee', 'tel', 'sophie', "goTo('cave'); selectCaveSection('vendange'); setTimeout(function(){ if(window.switchVendOng) switchVendOng('tour'); }, 300);", { attente: 2400, vise: ['.vt-cnt'] }),
  S('r-chai-courbe', 'tel', 'sophie', "goTo('cave'); selectCaveSection('vendange'); setTimeout(function(){ if(window.switchVendOng) switchVendOng('cuves'); setTimeout(function(){ var r=[...document.querySelectorAll('.page.active .mvv-row')].filter(function(x){ return x.getClientRects().length; }); var c=r.find(function(x){ return /Cuve 3/.test(x.textContent||''); })||r[0]; if(c){ var h=c.querySelector('[onclick]')||c; h.click(); } }, 500); }, 300);", { attente: 2800, centre: '.mvv-det-g', vise: ['.mvv-det-g'] }),
  S('r-chai-cuvee', 'tel', 'sophie', "goTo('cave'); selectCaveSection('elevage'); setTimeout(function(){ var c=document.querySelector('#mvc-body-cuv .mvc-cuv[data-cuv]'); if(c) c.click(); }, 600);", { attente: 2400 }),
  S('r-chai-millesime', 'tel', 'sophie', "goTo('cave'); selectCaveSection('millesime');", { attente: 2400 }),
  S('r-chai-labo', 'tel', 'sophie', "goTo('cave'); selectCaveSection('elevage'); setTimeout(function(){ __clic('Labo', '.page.active'); }, 500);", { attente: 2400 }),
  S('r-chai-deguster', 'tel', 'sophie', "goTo('cave'); selectCaveSection('elevage'); setTimeout(function(){ if(window.openOvCaveOp) openOvCaveOp(); setTimeout(function(){ if(window.selCaveOpType) selCaveOpType('degustation'); }, 500); }, 400);", { attente: 2600, centre: '#cop-dg-next', vise: ['#cop-dg-next'] }),
  // — après les gestes (l'état change : en dernier) —
  S('pilotage-auj-apres-pc', 'pc', 'gerant', "var p=(PARCELLES||[]).find(function(x){return x.nom==='Aux Murgers';}); if(p){ if(!p.taches)p.taches={}; p.taches.Palissage='Validé'; (window.JOURNAL||[]).unshift({id:'dm-'+Date.now(), date:_mvToday(), parcelle:'Aux Murgers', tache:'Palissage', qui:'Jean', statut:'Validé', equipe:true, membresEquipe:['Jean','Marie','Sophie']}); if(window.recalcTravaux) recalcTravaux('Palissage'); } goTo('pilotage'); _pilSetTab('auj');", { attente: 2800 }),
  S('r-chai-tournee-apres', 'tel', 'sophie', "goTo('cave'); selectCaveSection('vendange'); setTimeout(function(){ if(window.switchVendOng) switchVendOng('tour'); setTimeout(function(){ var b=document.querySelector('.page.active .vt-cnt'); if(b) b.click(); }, 500); }, 300);", { attente: 2600 }),
  S('r-ouv-fait', 'tel', 'jean', "goTo('parcelles'); setTimeout(function(){ var b=document.querySelector('.pcard-qv .pc-validate'); if(b) b.click(); }, 700);", { attente: 2600 })
];

// ── Ce qui est posé en mémoire, une fois, après l'entrée dans la démo ─────────
const POSER = `
  // le palissage fait vient du scénario de la démo lui-même (corrigé au §500 : il suit _pvType) — rien à poser ici
  var t = (typeof _pvType === 'function') ? _pvType('Palissage') : '?';
  // la saison de Jean, pour « Ma trace » (avant la période en cours : rien ne bouge dans le Pilotage du jour)
  var J = window.JOURNAL || [];
  [['2026-02-12','Les Charmes','Taille'],['2026-02-19','Vieilles Vignes','Taille'],['2026-03-03','Champ de la Croix','Taille'],['2026-03-10','Les Charmes','Tirage'],
   ['2026-05-12','Clos du Moulin','Ébourgeonnage'],['2026-05-20','La Combotte','Ébourgeonnage'],['2026-06-09','Les Perrières','Relevage'],['2026-06-16','En Bertrange','Relevage'],
   ['2026-07-01','Aux Murgers','Palissage'],['2026-07-08','Vieilles Vignes','Palissage']].forEach(function(x, i){
    J.push({ id: 'dmj' + i, date: x[0], parcelle: x[1], tache: x[2], qui: 'Jean', statut: 'Validé', equipe: true, membresEquipe: ['Jean', 'Paul'] });
  });
  window.__clic = function (t, racine) {
    var r = racine ? document.querySelector(racine) : document; if (!r) return false;
    var b = [...r.querySelectorAll('button,a,[onclick],[role=tab]')].find(function (x) { return x.getClientRects().length && (x.textContent || '').indexOf(t) >= 0; });
    if (b) b.click(); return !!b;
  };
  window.__ecoTaux = function () { var c = window.CONFIG || {}; c.eco = Object.assign({}, c.eco || {}, { taux_horaire: { CDI: 22, CDD: 20, TESA: 19, Saisonnier: 19 } }); window.CONFIG = c; };
  return t;
`;

if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('dist/ absent : npm run build d’abord'); process.exit(2); }
let playwright; try { playwright = await import('playwright'); } catch (e) { console.error('Playwright absent : npm i'); process.exit(2); }
const choisis = opt('--ecrans') ? opt('--ecrans').split(',').map((x) => x.trim()).filter(Boolean) : null;
const LISTE = choisis ? ECRANS.filter((e) => choisis.includes(e.id)) : ECRANS;
if (choisis && LISTE.length !== choisis.length) { console.error('écran(s) inconnu(s) : ' + choisis.filter((c) => !ECRANS.some((e) => e.id === c)).join(', ')); process.exit(2); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(DIST, p);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(PORT);
const U = 'http://localhost:' + PORT;
const exe = process.env.MV_CHROMIUM || '';
const nav = await playwright.chromium.launch({ headless: true, args: ['--lang=fr-FR'].concat(exe ? ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-zygote'] : []), env: Object.assign({}, process.env, { LANG: 'fr_FR.UTF-8', LANGUAGE: 'fr' }), ...(exe ? { executablePath: exe } : {}) });
fs.mkdirSync(SORTIE, { recursive: true });

const VUES = { tel: { w: 390, h: 844, dpr: 2, mobile: true, larg: 720 }, pc: { w: 1280, h: 800, dpr: 1.5, mobile: false, larg: 1600 } };
const META = {}, faites = [], invalides = [], erreurs = [];

// La conversion en WebP se fait dans le navigateur lui-même (toile → image/webp) : aucune dépendance de plus.
const atelier = await (await nav.newContext()).newPage();
async function versWebp(png, larg, vignette) {
  const b64 = png.toString('base64');
  const out = await atelier.evaluate(async ([b64, larg, vignette]) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'), x = c.getContext('2d');
    if (vignette) {   // le haut de l'écran, au format 4:5
      const sw = Math.min(img.width, img.height * 0.8), sh = sw * 1.25;
      c.width = 200; c.height = 250; x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, sw, sh, 0, 0, 200, 250);
      return c.toDataURL('image/webp', 0.78).split(',')[1];
    }
    c.width = larg; c.height = Math.round(img.height * larg / img.width); x.imageSmoothingQuality = 'high';
    x.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/webp', 0.84).split(',')[1];
  }, [b64, larg, vignette]);
  return Buffer.from(out, 'base64');
}

for (const vueId of ['tel', 'pc']) {
  const lot = LISTE.filter((e) => e.vue === vueId); if (!lot.length) continue;
  const V = VUES[vueId];
  const ctx = await nav.newContext({ viewport: { width: V.w, height: V.h }, deviceScaleFactor: V.dpr, isMobile: V.mobile, hasTouch: V.mobile,
    reducedMotion: 'reduce', serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR' });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date(HORLOGE) }); await page.clock.resume();
  await page.route('**/*', (r) => { const u = r.request().url(); return (u.startsWith(U) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  let chargements = 0; page.on('load', () => { chargements++; });
  page.on('pageerror', (e) => erreurs.push(vueId + ' : ' + String(e && e.message).slice(0, 160)));
  try {
    await page.goto(U + '/?tenant=e2e-test', { waitUntil: 'domcontentloaded', timeout: 90000 });
    for (let k = 0; k < 40 && chargements < 2; k++) await page.waitForTimeout(250);
    await page.waitForFunction(() => window.__MV_BOOTED === true && typeof window._startDemoVisite === 'function', null, { timeout: 90000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { if (window._mvTutoCharger) window._mvTutoCharger(); window.fbLoginDemo = async () => true; window._authReady = true; window._startDemoVisite(); });
    await page.waitForFunction(() => { const ls = document.getElementById('login-screen'); return !ls || ls.style.display === 'none'; }, null, { timeout: 30000 });
    await page.waitForTimeout(2500);
    const type = await page.evaluate((c) => { try { return new Function(c)(); } catch (e) { return 'ERREUR ' + e.message; } }, POSER);
    if (vueId === 'tel') console.log('  palissage, type de tâche : ' + type);
    for (const e of lot) {
      await page.evaluate(([qui, code, centre]) => {
        // la personne : on MODIFIE l'objet de l'appli (il est partagé avec son module), jamais on ne le remplace
        const cu = window.currentUser;
        if (cu) {
          if (!window.__MV_CU0) window.__MV_CU0 = { nom: cu.nom, roles: (cu.roles || []).slice(), mods: cu.mods, _isDemo: cu._isDemo };
          const b = window.__MV_CU0;
          Object.assign(cu, qui ? { nom: qui.nom, roles: qui.roles.slice(), mods: Object.assign({}, qui.mods), _isDemo: false } : { nom: b.nom, roles: b.roles.slice(), mods: b.mods, _isDemo: b._isDemo });
          if (window.applyRoles) window.applyRoles();
          if (window._dockBuild) window._dockBuild();
        }
        document.querySelectorAll('.overlay.open').forEach((o) => o.classList.remove('open'));
        document.querySelectorAll('[id^="mvt"], [class^="mvt-"], [class*=" mvt-"]').forEach((x) => { x.style.display = 'none'; });
        document.documentElement.setAttribute('data-theme', 'light'); const a = document.getElementById('app-root'); if (a) a.setAttribute('data-theme', 'light');
        window.scrollTo(0, 0);
        try { new Function(code)(); } catch (err) { console.error('écran : ' + err.message); }
      }, [e.qui ? QUI[e.qui] : null, e.geste]);
      await page.waitForTimeout(e.attente);
      if (e.centre) { await page.evaluate((s) => { const x = document.querySelector(s); if (x) x.scrollIntoView({ block: 'center' }); }, e.centre); await page.waitForTimeout(500); }
      const etat = await page.evaluate((vise) => {
        const ls = document.getElementById('login-screen');
        const rects = vise.map((s) => { const el = [...document.querySelectorAll(s)].find((x) => x.getClientRects().length); if (!el) return null; const r = el.getBoundingClientRect(); return { s, x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 }; });
        return { connexion: !!(ls && ls.style.display !== 'none'), rects };
      }, e.vise);
      await page.evaluate(() => {
        if (!document.getElementById('mv-demo-cap')) { const st = document.createElement('style'); st.id = 'mv-demo-cap'; st.textContent = '#sync-badge{display:none!important}.mv-syncdot .mvs-lbl,.mv-syncdot .mvs-cnt{display:none!important}.mv-syncdot .mvs-dot{background:#6BD46B!important;animation:none!important;box-shadow:0 0 0 3px rgba(107,212,107,.18)!important}'; document.head.appendChild(st); }
        document.querySelectorAll('.mv-syncdot').forEach((el) => { el.classList.remove('syncing', 'offline'); el.classList.add('synced'); const c = el.querySelector('.mvs-cnt'), l = el.querySelector('.mvs-lbl'); if (c) c.style.display = 'none'; if (l) l.textContent = ''; });
      });
      const png = await page.screenshot();
      if (etat.connexion) { invalides.push(e.id); continue; }
      fs.writeFileSync(path.join(SORTIE, e.id + '.webp'), await versWebp(png, V.larg, false));
      fs.writeFileSync(path.join(SORTIE, 't-' + e.id + '.webp'), await versWebp(png, V.larg, true));
      META[e.id] = { vw: V.w, vh: V.h, rects: etat.rects.filter(Boolean) };
      const manque = e.vise.filter((s, i) => !etat.rects[i]);
      faites.push(e.id + (manque.length ? '  (introuvable : ' + manque.join(' ; ') + ')' : ''));
    }
  } catch (err) { erreurs.push(vueId + ' ARRÊT : ' + err.message); }
  await ctx.close();
}
await nav.close(); srv.close();

// ── Les deux tables de la page : les images, et les rectangles visés ──────────
if (!SANS_PAGE && faites.length) {
  let html = fs.readFileSync(PAGE_DEMO, 'utf8');
  const lire = (id) => { const m = html.match(new RegExp('<script id="' + id + '" type="application/json">([\\s\\S]*?)</script>')); return m ? JSON.parse(m[1]) : {}; };
  // la liste entière : les tables repartent de zéro (le logo reste) ; quelques écrans : on complète
  const IMG = choisis ? lire('imgdata') : { logo: '/demo/logo.webp' }, MT = choisis ? lire('metadata') : {};
  for (const id of Object.keys(META)) { IMG[id] = '/demo/' + id + '.webp'; IMG['t-' + id] = '/demo/t-' + id + '.webp'; MT[id] = META[id]; }
  html = html.replace(/(<script id="imgdata" type="application\/json">)[\s\S]*?(<\/script>)/, (_, a, b) => a + JSON.stringify(IMG) + b)
             .replace(/(<script id="metadata" type="application\/json">)[\s\S]*?(<\/script>)/, (_, a, b) => a + JSON.stringify(MT) + b);
  fs.writeFileSync(PAGE_DEMO, html);
  console.log('  ✓ public/demo.html : tables des images et des rectangles mises à jour (' + Object.keys(META).length + ' écrans)');
} else if (faites.length) {
  fs.writeFileSync(path.join(SORTIE, 'captures.json'), JSON.stringify(META, null, 1));
}
console.log('\n  captures : ' + faites.length + ' — dans ' + path.relative(RACINE, SORTIE) + '/');
faites.forEach((f) => console.log('    · ' + f));
if (erreurs.length) { console.log('  erreurs JS :'); erreurs.slice(0, 12).forEach((x) => console.log('    ' + x)); }
if (invalides.length) { console.log('  \x1b[31m✗ l’écran de connexion est revenu — ces captures NE COMPTENT PAS :\x1b[0m ' + invalides.join(', ')); }
process.exit(invalides.length || !faites.length ? 1 : 0);
