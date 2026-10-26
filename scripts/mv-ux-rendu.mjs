#!/usr/bin/env node
// =============================================================================
// Ma Vigne — LE CLIQUET DE L’EXPÉRIENCE D’USAGE, MESURÉ SUR LE BUILD (UX-0, §459)
// -----------------------------------------------------------------------------
// Lancer :  npm run build (ou, sans la chaîne : node scripts/mv-gt-page.mjs, npx vite build, inject-precache, mv-version-json)
//           npm run test:ux                                   (CI : job des tests sur le build, après le gabarit)
//           npm run test:ux -- --contre                       (contre-épreuve : sept défauts posés à l’écran doivent rougir)
//           npm run test:ux -- --baseline                     (regraver la référence après une BAISSE — refusé s’il y a une hausse)
//           npm run test:ux -- --baseline --accepte "<raison>"   (une hausse VOULUE : la raison est écrite dans la référence)
// Bac à sable de Claude : MV_CHROMIUM=<chemin d’un Chromium>.
//
// POURQUOI. L’audit d’expérience d’usage du 25/10 (hors dépôt : audit-ux-2026-10-25.md, maquettes ux v1 et v2) a mesuré la
// démo construite : deux cibles sur trois sous les 44 px d’Apple, des « i » sous les 24 px de WCAG 2.2, des textes jusqu’à
// 7 px, près de 180 px de bandeaux avant le contenu. Le plan en 22 lots va faire baisser ces chiffres ; ce contrôle garantit
// qu’ils ne remontent plus. UN CLIQUET, comme le preflight (§6c) : hausse → rouge nommé ; égal → silence ; baisse → regraver.
// ★ CE QUI EST MESURÉ — dix pages, au téléphone (390 × 844) et sur ordinateur (1366 × 900), dans la page active :
//   c24 / c44  les cibles cliquables visibles dont le plus petit côté est sous 24 / 44 px (un lien dans une phrase n’est pas une cible) ;
//   t11 / t12  les textes visibles sous 11 / 12 px (exposants exclus) ;
//   chrome     la hauteur des bandeaux collés en tête de page, au repos ; chromeDefile, la même après 900 px de défilement
//              (ou ce que la page permet, 300 px au moins) ;
//   pouce      au téléphone, sur les pages de liste : les actions du tiers haut de l’écran moins celles du tiers bas (0 au mieux) ;
//   et neuf GESTES de la maquette v2 : la session du tracteur, le « + » du tracteur, les dates du registre, les gestes de la Cave,
//   son sommaire, l’action de la Réserve, la grille du Planning, le premier réglage, le bouton Valider des Parcelles.
// ★ L’HORLOGE est posée au mardi 27/10/2026, 9 h (Paris), puis elle tourne : la démo se construit autour d’« aujourd’hui »,
//   et un relevé qui changerait avec le jour de la semaine ferait un cliquet menteur (voir les harnais qui rougissent entre
//   minuit et 2 h, §28).
// ★ LA MARGE : 1 cible, ou 4 px pour une hauteur, de jeu — la CI joue un autre Chromium que le bac à sable (la police, elle,
//   est la même : servie par dist/fonts). Les textes, les dates, les oui/non : aucune marge.
// ★ Une page qui revient à l’écran de connexion, ou une mesure qui disparaît, rougit (CAPTURES-1, §371) : un harnais qui
//   déménage doit rougir (§6c), on le suit, on ne le contourne pas.
// =============================================================================
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url)), RACINE = path.resolve(ICI, '..'), DIST = path.join(RACINE, 'dist');
const REF = path.join(ICI, 'mv-ux-baseline.json');
if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('dist/ absent : npm run build d’abord'); process.exit(2); }
let playwright; try { playwright = await import('playwright'); } catch (e) { console.error('Playwright absent : npm i, puis npx playwright install chromium'); process.exit(2); }
const ARGS = process.argv.slice(2);
const CONTRE = ARGS.includes('--contre'), GRAVER = ARGS.includes('--baseline');
const iAcc = ARGS.indexOf('--accepte'), ACCEPTE = iAcc >= 0 ? String(ARGS[iAcc + 1] || '').trim() : '';
if (iAcc >= 0 && !ACCEPTE) { console.error('--accepte demande sa raison : --accepte "<pourquoi cette hausse est voulue>"'); process.exit(2); }

const HORLOGE = '2026-10-27T08:00:00Z';   // mardi 27 octobre 2026, 9 h à Paris (heure d’hiver)
const PAGES = ['home', 'parcelles', 'journal', 'tracteur', 'phyto', 'cave', 'reserve', 'planning', 'pilotage', 'reglages'];
const LISTES = ['parcelles', 'journal', 'tracteur', 'phyto', 'reserve'];
const ECRANS = [{ id: 'téléphone', w: 390, h: 844, tel: true }, { id: 'ordinateur', w: 1366, h: 900, tel: false }];
// sens : 'bas' = plus petit vaut mieux ; 'haut' = plus grand vaut mieux. tol : le jeu toléré. obj : la cible du plan.
const MESURES = {
  c24: { sens: 'bas', tol: 1, obj: '0', lib: 'cibles sous 24 px' },
  c44: { sens: 'bas', tol: 1, obj: '≤ 15 % des cibles', lib: 'cibles sous 44 px' },
  t11: { sens: 'bas', tol: 0, obj: '0', lib: 'textes sous 11 px' },
  t12: { sens: 'bas', tol: 0, obj: '≤ 3 % au téléphone', lib: 'textes sous 12 px' },
  chrome: { sens: 'bas', tol: 4, obj: '≤ 120 px', lib: 'bandeaux en tête, au repos (px)' },
  chromeDefile: { sens: 'bas', tol: 4, obj: '≤ 56 px', lib: 'bandeaux en tête, en défilant (px)' },
  pouce: { sens: 'bas', tol: 1, obj: '0', lib: 'actions plus haut que le pouce (téléphone, listes)' },
};
const GESTES = {
  'tracteur.session_y': { sens: 'bas', tol: 4, obj: '≤ 200 px', lib: 'Tracteur : le haut de la session en cours (px)' },
  'tracteur.fab_recouvre': { sens: 'bas', tol: 0, obj: '0', lib: 'Tracteur : cibles sous le « + »' },
  'phyto.dates_machine': { sens: 'bas', tol: 0, obj: '0', lib: 'Phyto : dates écrites « 2026-09-08 »' },
  'cave.gestes_44': { sens: 'bas', tol: 0, obj: '0', lib: 'Cave : Relever, Ouiller, Soutirer sous 44 px' },
  'cave.sommaire': { sens: 'haut', tol: 0, obj: '1 (oui)', lib: 'Cave : un sommaire reste collé en défilant' },
  'reserve.action': { sens: 'haut', tol: 0, obj: '1 (oui)', lib: 'Réserve : une action principale flottante' },
  'planning.grille_y': { sens: 'bas', tol: 4, obj: '≤ 300 px', lib: 'Planning : le haut de la grille (px)' },
  'reglages.premier_y': { sens: 'bas', tol: 4, obj: '≤ 200 px', lib: 'Réglages : le haut du premier réglage (px)' },
  'parcelles.valider': { sens: 'haut', tol: 1, obj: '≥ 44 px', lib: 'Parcelles : le plus petit côté du bouton Valider (px)' },
};

// La contre-épreuve pose SEPT défauts à l’écran, chacun visé par une mesure. ⚠️ Avec un identifiant de page en tête : une
// règle moins spécifique que celles de styles.css perdrait contre elles, et la contre-épreuve passerait pour muette.
const DEFAUTS = '#page-journal #tache-chips-row button,#page-journal #tache-chips-row [onclick]{height:18px!important;min-height:0!important;max-height:18px!important;padding:0 3px!important;line-height:1!important;font-size:9px!important;overflow:hidden!important}'
  + '#page-journal .mod-header{padding-bottom:80px!important}'
  + '#page-planning #plan-stats-band{padding-bottom:200px!important}'
  + '#page-tracteur #trac-fab{top:470px!important;bottom:auto!important;left:20px!important;right:auto!important;width:330px!important;height:240px!important}';
const attendus = ['journal › téléphone › c24', 'journal › téléphone › t11', 'journal › téléphone › chrome', 'planning.grille_y', 'tracteur.fab_recouvre', 'phyto.dates_machine', 'cave.gestes_44'];

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(DIST, p);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
await new Promise((ok) => srv.on('listening', ok));
const U = 'http://localhost:' + srv.address().port;
const exe = process.env.MV_CHROMIUM || '';
const nav = await playwright.chromium.launch({ headless: true, ...(exe ? { executablePath: exe, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-zygote'] } : {}) });

// ── Mesure d’une page (exécutée dans le navigateur). Tout se lit dans la page ACTIVE : le dock est commun à toutes. ──
const MESURE = ([tel, liste]) => {
  const ls = document.getElementById('login-screen'); if (ls && ls.style.display !== 'none') return { connexion: true };
  const pg = document.querySelector('.page.active'); if (!pg) return { absente: true };
  const vh = window.innerHeight, vw = window.innerWidth;
  const vis = (el) => { try { if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false; } catch (e) { /* navigateur ancien : la boîte suffit */ } const r = el.getBoundingClientRect(); return r.width >= 1 && r.height >= 1; };
  const ferme = (el) => { const o = el.closest('.overlay'); return !!(o && !o.classList.contains('open')); };
  const SEL = 'button, a[href], [onclick], input:not([type=hidden]), select, textarea, [role=button], label[for], summary';
  const enLigne = (e) => e.tagName === 'A' && !!e.closest('p,li,td') && !e.closest('button,[onclick]');
  const cibles = Array.from(pg.querySelectorAll(SEL)).filter((e) => vis(e) && !ferme(e) && !enLigne(e)).map((e) => { const r = e.getBoundingClientRect(); return { m: Math.round(Math.min(r.width, r.height)), y: r.top + r.height / 2 }; });
  const tailles = []; const vus = new Set(); const w = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const t = w.currentNode; if (!t.nodeValue.trim()) continue; const el = t.parentElement; if (!el || vus.has(el)) continue; vus.add(el);
    if (el.closest('script,style,sup,sub') || ferme(el) || !vis(el)) continue; tailles.push(parseFloat(getComputedStyle(el).fontSize)); }
  // Les bandeaux collés en tête : on empile, du haut vers le bas, ce qui est collé (sticky) ou fixe, large (la moitié de l’écran au
  // moins : ni un « + », ni une colonne), et touche la pile à 24 px près (sur ordinateur, la page commence 9 px sous le haut).
  const pile = () => { const els = Array.from(pg.querySelectorAll('*')).filter((e) => { const p = getComputedStyle(e).position; return (p === 'sticky' || p === 'fixed') && vis(e) && !ferme(e); })
      .map((e) => e.getBoundingClientRect()).filter((r) => r.width >= vw * 0.5 && r.top >= -1 && r.top <= vh * 0.6).sort((a, b) => a.top - b.top);
    let bas = 0; els.forEach((r) => { if (r.top <= bas + 24) bas = Math.max(bas, r.bottom); }); return Math.round(bas); };
  const visibles = cibles.filter((c) => c.y >= 0 && c.y <= vh);
  return { cibles: cibles.length, c24: cibles.filter((c) => c.m < 24).length, c44: cibles.filter((c) => c.m < 44).length,
    textes: tailles.length, t11: tailles.filter((f) => f < 11).length, t12: tailles.filter((f) => f < 12).length,
    chrome: pile(), hauteur: Math.max(document.documentElement.scrollHeight, pg.scrollHeight),
    pouce: (tel && liste) ? Math.max(0, visibles.filter((c) => c.y < vh / 3).length - visibles.filter((c) => c.y > vh * 2 / 3).length) : null };
};
const PILE_SEULE = () => {   // la même pile, après défilement
  const pg = document.querySelector('.page.active'); if (!pg) return null; const vh = window.innerHeight, vw = window.innerWidth;
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width >= 1 && r.height >= 1 && getComputedStyle(el).visibility !== 'hidden'; };
  const els = Array.from(pg.querySelectorAll('*')).filter((e) => { const p = getComputedStyle(e).position; return (p === 'sticky' || p === 'fixed') && vis(e); })
    .map((e) => e.getBoundingClientRect()).filter((r) => r.width >= vw * 0.5 && r.top >= -1 && r.top <= vh * 0.6).sort((a, b) => a.top - b.top);
  let bas = 0; els.forEach((r) => { if (r.top <= bas + 24) bas = Math.max(bas, r.bottom); }); return Math.round(bas);
};
const defiler = async (page, y) => { await page.evaluate((y) => { window.scrollTo(0, y); const pg = document.querySelector('.page.active'); if (pg) pg.scrollTop = y; }, y); await page.waitForTimeout(450); };

// ── Les neuf gestes (au téléphone). Chaque lecteur rend null s’il ne trouve pas sa pièce : la comparaison le dira. ──
const L = {
  tracteur: () => {
    const pg = document.getElementById('page-tracteur'); const o = {};
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width >= 1 && r.height >= 1; };
    const s = Array.from(pg.querySelectorAll('.scard-enc')).find(vis); o.session = s ? Math.round(s.getBoundingClientRect().top) : null;
    const fab = document.getElementById('trac-fab'); o.recouvre = null;
    if (fab && vis(fab)) { const f = fab.getBoundingClientRect();
      o.recouvre = Array.from(pg.querySelectorAll('button, a[href], [onclick], input:not([type=hidden]), select'))
        .filter((e) => e !== fab && !fab.contains(e) && vis(e)).map((e) => e.getBoundingClientRect())
        .filter((r) => r.left < f.right && r.right > f.left && r.top < f.bottom && r.bottom > f.top).length; }
    return o;
  },
  phyto: () => {
    const pg = document.getElementById('page-phyto'); const re = /\b\d{4}-\d{2}-\d{2}\b/; let n = 0;
    const w = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const t = w.currentNode, el = t.parentElement; if (!el || !re.test(t.nodeValue)) continue; const r = el.getBoundingClientRect(); if (r.width >= 1 && r.height >= 1) n++; }
    return n;
  },
  caveGestes: () => Array.from(document.querySelectorAll('#page-cave button, #page-cave [onclick]')).filter((e) => /^(Relever|Ouiller|Soutirer)$/.test((e.textContent || '').trim()))
    .map((e) => e.getBoundingClientRect()).filter((r) => r.width >= 1 && r.height >= 1 && Math.round(Math.min(r.width, r.height)) < 44).length,
  caveSommaire: () => {
    const pg = document.getElementById('page-cave'); const vh = window.innerHeight;
    return Array.from(pg.querySelectorAll('*')).some((e) => { const p = getComputedStyle(e).position; if (p !== 'sticky' && p !== 'fixed') return false;
      if (e.closest('.mod-header')) return false; const r = e.getBoundingClientRect();
      return r.height >= 24 && r.top >= -1 && r.top <= vh * 0.4 && e.querySelectorAll('button, [onclick], a[href]').length >= 3; }) ? 1 : 0;
  },
  reserve: () => Array.from(document.querySelectorAll('#page-reserve *')).some((e) => { if (getComputedStyle(e).position !== 'fixed') return false; const r = e.getBoundingClientRect();
    return r.height >= 40 && r.width >= 40 && (e.matches('button, [onclick]') || !!e.querySelector('button, [onclick]')); }) ? 1 : 0,
  planning: () => { const g = Array.from(document.querySelectorAll('#page-planning .pl2-grid')).find((e) => e.getBoundingClientRect().height >= 1); return g ? Math.round(g.getBoundingClientRect().top) : null; },
  reglages: () => { const g = Array.from(document.querySelectorAll('#regl-view-domaine .set-row')).find((e) => e.getBoundingClientRect().height >= 1); return g ? Math.round(g.getBoundingClientRect().top) : null; },
  valider: () => { const b = Array.from(document.querySelectorAll('#page-parcelles [onclick^="pQuickValidate"]')).find((e) => e.getBoundingClientRect().height >= 1);
    if (!b) return null; const r = b.getBoundingClientRect(); return Math.round(Math.min(r.width, r.height)); },
};
async function gestes(page, aller) {
  const G = {};
  await aller('tracteur'); const tr = await page.evaluate(L.tracteur); G['tracteur.session_y'] = tr.session; G['tracteur.fab_recouvre'] = tr.recouvre;
  await aller('phyto'); G['phyto.dates_machine'] = await page.evaluate(L.phyto);
  await aller('cave'); G['cave.gestes_44'] = await page.evaluate(L.caveGestes);
  await defiler(page, 1200); G['cave.sommaire'] = await page.evaluate(L.caveSommaire); await defiler(page, 0);
  await aller('reserve'); G['reserve.action'] = await page.evaluate(L.reserve);
  await aller('planning'); G['planning.grille_y'] = await page.evaluate(L.planning);
  await aller('reglages'); G['reglages.premier_y'] = await page.evaluate(L.reglages);
  await aller('parcelles'); G['parcelles.valider'] = await page.evaluate(L.valider);
  return G;
}
// La contre-épreuve relit quatre gestes, chacun après son défaut — sans repasser par goTo, qui reconstruirait la page.
async function gestesContre(page, aller) {
  const G = {};
  await aller('tracteur'); G['tracteur.fab_recouvre'] = (await page.evaluate(L.tracteur)).recouvre;
  await aller('phyto'); await page.evaluate(() => { const s = document.createElement('span'); s.textContent = '2026-01-01'; (document.querySelector('#page-phyto .content') || document.getElementById('page-phyto')).prepend(s); });
  G['phyto.dates_machine'] = await page.evaluate(L.phyto);
  await aller('cave'); await page.evaluate(() => { const b = Array.from(document.querySelectorAll('#page-cave button, #page-cave [onclick]')).find((e) => /^(Relever|Ouiller|Soutirer)$/.test((e.textContent || '').trim())); if (b) b.after(b.cloneNode(true)); });
  G['cave.gestes_44'] = await page.evaluate(L.caveGestes);
  await aller('planning'); G['planning.grille_y'] = await page.evaluate(L.planning);
  return G;
}

// ── Le relevé ──
const releve = { mesures: {}, gestes: {} }; const erreurs = []; let connexion = 0, chromium = '';
try { chromium = nav.version(); } catch (e) { chromium = ''; }
const ECRANS_JOUES = CONTRE ? ECRANS.filter((e) => e.tel) : ECRANS;
const PAGES_CONTRE = ['journal', 'planning'];
for (const ecran of ECRANS_JOUES) {
  const ctx = await nav.newContext({ viewport: { width: ecran.w, height: ecran.h }, reducedMotion: 'reduce', serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', isMobile: ecran.tel, hasTouch: ecran.tel });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date(HORLOGE) }); await page.clock.resume();   // l’horloge posée, puis elle tourne
  await page.route('**/*', (r) => { const u = r.request().url(); return (u.startsWith(U) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  let chargements = 0; page.on('load', () => { chargements++; });
  page.on('pageerror', (e) => erreurs.push(ecran.id + ' : ' + String(e && e.message).slice(0, 160)));
  const aller = async (p) => { await page.evaluate((p) => { document.querySelectorAll('.overlay.open').forEach((o) => o.classList.remove('open')); window.goTo(p); window.scrollTo(0, 0); }, p); await page.waitForTimeout(1500); };
  releve.mesures[ecran.id] = {};
  try {
    await page.goto(U + '/?tenant=e2e-test', { waitUntil: 'domcontentloaded', timeout: 90000 });
    for (let k = 0; k < 40 && chargements < 2; k++) await page.waitForTimeout(250);
    await page.waitForFunction(() => window.__MV_BOOTED === true && typeof window._startDemoVisite === 'function', null, { timeout: 90000 });
    await page.waitForTimeout(1500);
    // le domaine fictif des tutos AVANT la démo (comme le gabarit et les tutos)
    await page.evaluate(() => { if (window._mvTutoCharger) window._mvTutoCharger(); window.fbLoginDemo = async () => true; window._authReady = true; window._startDemoVisite(); });
    await page.waitForFunction(() => { const ls = document.getElementById('login-screen'); return !ls || ls.style.display === 'none'; }, null, { timeout: 30000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => { document.querySelectorAll('.overlay.open').forEach((o) => o.classList.remove('open')); document.querySelectorAll('[id^="mvt"], [class^="mvt-"], [class*=" mvt-"]').forEach((e) => { e.style.display = 'none'; }); });
    if (CONTRE) await page.evaluate((css) => { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }, DEFAUTS);
    for (const p of (CONTRE ? PAGES_CONTRE : PAGES)) {
      await aller(p);
      const m = await page.evaluate(MESURE, [ecran.tel, LISTES.includes(p)]);
      if (m.connexion) { connexion++; continue; }
      if (m.absente) { erreurs.push(ecran.id + ' › ' + p + ' : aucune page active'); continue; }
      m.chromeDefile = null;   // défiler de 900 px, ou de ce que la page permet ; une page qui défile de moins de 300 px n’a pas de « en défilant »
      const dy = Math.min(900, m.hauteur - ecran.h - 10);
      if (dy >= 300) { await defiler(page, dy); m.chromeDefile = await page.evaluate(PILE_SEULE); await defiler(page, 0); }
      releve.mesures[ecran.id][p] = m;
    }
    if (ecran.tel) releve.gestes = CONTRE ? await gestesContre(page, aller) : await gestes(page, aller);
  } catch (e) { erreurs.push(ecran.id + ' ARRÊT : ' + e.message); }
  await ctx.close();
}
await nav.close(); srv.close();

// ── La comparaison avec la référence ──
let ok = 0, ko = 0; const rouges = [], baisses = [], nouvelles = [];
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; rouges.push(nom); console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
let ref = null; try { ref = JSON.parse(fs.readFileSync(REF, 'utf8')); } catch (e) { ref = null; }
if (!ref && !GRAVER) { console.error('référence absente ou illisible (' + path.relative(RACINE, REF) + ') : npm run test:ux -- --baseline'); process.exit(2); }
const pire = (def, base, now) => (def.sens === 'bas' ? now > base + def.tol : now < base - def.tol);
const mieux = (def, base, now) => (def.sens === 'bas' ? now < base : now > base);
const ecarts = [];   // { cle, base, now, hausse }
const comparer = (cle, def, base, now) => {
  if (base === undefined || base === null) { if (now !== null && now !== undefined) nouvelles.push(cle + ' = ' + now); return; }
  if (now === null || now === undefined) { ecarts.push({ cle, base, now: 'perdue', hausse: true }); return; }
  if (pire(def, base, now)) ecarts.push({ cle, base, now, hausse: true });
  else if (mieux(def, base, now)) baisses.push(cle + ' : ' + base + ' → ' + now);
};
const nbAttendu = CONTRE ? PAGES_CONTRE.length : PAGES.length * ECRANS.length;
const nbReleve = Object.values(releve.mesures).reduce((s, o) => s + Object.keys(o).length, 0);
console.log('\x1b[1mMA VIGNE — Le cliquet de l’expérience d’usage, mesuré sur le build\x1b[0m  (' + nbReleve + ' pages relevées, horloge au 27/10/2026 9 h' + (chromium ? ', Chromium ' + chromium : '') + ')');
t('les ' + (CONTRE ? PAGES_CONTRE.length : PAGES.length) + ' pages ont été relevées (' + ECRANS_JOUES.map((e) => e.id).join(', ') + '), sans retour à l’écran de connexion', nbReleve === nbAttendu && connexion === 0, nbReleve + ' pages sur ' + nbAttendu + ', ' + connexion + ' écran(s) de connexion');
if (ref) {
  for (const [eid, pages] of Object.entries(releve.mesures)) for (const [p, m] of Object.entries(pages)) for (const [k, def] of Object.entries(MESURES)) {
    const b = ((ref.mesures || {})[eid] || {})[p]; comparer(p + ' › ' + eid + ' › ' + k, def, b ? b[k] : undefined, m[k]);
  }
  if (!CONTRE) for (const [eid, pages] of Object.entries(ref.mesures || {})) for (const p of Object.keys(pages)) if (!(releve.mesures[eid] || {})[p]) ecarts.push({ cle: p + ' › ' + eid, base: 'relevée', now: 'perdue', hausse: true });
  for (const [k, def] of Object.entries(GESTES)) if (!CONTRE || k in releve.gestes) comparer(k, def, (ref.gestes || {})[k], releve.gestes[k]);
}
// un résumé par mesure, avec l’objectif du plan
for (const [k, def] of Object.entries(MESURES)) {
  const parEcran = ECRANS_JOUES.map((e) => { const ps = Object.values(releve.mesures[e.id] || {}); const v = ps.map((m) => m[k]).filter((x) => x !== null && x !== undefined);
    if (!v.length) return null; if (k === 'chrome' || k === 'chromeDefile') return e.id + ' ' + Math.min(...v) + ' à ' + Math.max(...v) + ' px';
    const s = v.reduce((a, b) => a + b, 0); const base = k.startsWith('c') ? ps.reduce((a, m) => a + (m.cibles || 0), 0) : k.startsWith('t') ? ps.reduce((a, m) => a + (m.textes || 0), 0) : 0;
    return e.id + ' ' + s + (base ? '/' + base + ' (' + Math.round(100 * s / base) + ' %)' : ''); }).filter(Boolean);
  const h = ecarts.filter((x) => x.cle.endsWith(' › ' + k));
  t(def.lib + ' — ' + (parEcran.join(' · ') || 'non mesuré') + ' · objectif ' + def.obj, h.length === 0, h.map((x) => x.cle + ' : ' + x.base + ' → ' + x.now).join(' · '));
}
for (const [k, def] of Object.entries(GESTES)) {
  if (CONTRE && !(k in releve.gestes)) continue;
  const h = ecarts.filter((x) => x.cle === k);
  t(def.lib + ' — ' + (releve.gestes[k] === null || releve.gestes[k] === undefined ? 'introuvable' : releve.gestes[k]) + ' · objectif ' + def.obj, h.length === 0, h.map((x) => x.base + ' → ' + x.now).join(' · '));
}
const autresPerdues = ecarts.filter((x) => x.now === 'perdue' && !Object.keys(MESURES).some((k) => x.cle.endsWith(' › ' + k)) && !(x.cle in GESTES));
if (autresPerdues.length) t('aucune page de la référence n’a disparu', false, autresPerdues.map((x) => x.cle).join(' · '));
if (erreurs.length) { console.log('  erreurs JS :'); erreurs.slice(0, 6).forEach((e) => console.log('    ' + e)); }

// ── Contre-épreuve ──
if (CONTRE) {
  const rougis = ecarts.map((x) => x.cle);
  const muets = attendus.filter((a) => !rougis.some((r) => r === a || r.startsWith(a)));
  console.log('\n' + (muets.length ? '\x1b[31mROUGE\x1b[0m — ne rougissent pas : ' + muets.join(', ') : '\x1b[32mVERT\x1b[0m — les ' + attendus.length + ' défauts posés à l’écran rougissent'));
  process.exit(muets.length || nbReleve !== nbAttendu ? 1 : 0);
}

// ── Regraver ──
if (GRAVER) {
  const hausses = ecarts.filter((x) => x.hausse);
  if (ref && hausses.length && !ACCEPTE) {
    console.log('\n\x1b[31mREFUSÉ\x1b[0m — ' + hausses.length + ' hausse(s) : on ne regrave jamais pour faire taire un rouge (§6c). Corriger, ou décider : --accepte "<raison>".');
    hausses.slice(0, 12).forEach((x) => console.log('    ' + x.cle + ' : ' + x.base + ' → ' + x.now));
    process.exit(1);
  }
  if (nbReleve !== PAGES.length * ECRANS.length || connexion) { console.log('\n\x1b[31mREFUSÉ\x1b[0m — relevé incomplet : on ne grave pas un trou.'); process.exit(1); }
  let base = ''; try { base = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: RACINE, encoding: 'utf8' }).trim(); } catch (e) { base = ''; }
  const jour = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const regravures = (ref && Array.isArray(ref.regravures)) ? ref.regravures.slice() : [];
  if (ref) regravures.push({ date: jour, base, motif: ACCEPTE ? 'hausse acceptée : ' + ACCEPTE : 'baisse', hausses: hausses.map((x) => x.cle + ' : ' + x.base + ' → ' + x.now), baisses: baisses.slice(0, 40) });
  const garder = (m) => { const o = {}; ['cibles', 'c24', 'c44', 'textes', 't11', 't12', 'chrome', 'chromeDefile', 'pouce', 'hauteur'].forEach((k) => { o[k] = m[k] === undefined ? null : m[k]; }); return o; };
  const mesures = {}; for (const [eid, pages] of Object.entries(releve.mesures)) { mesures[eid] = {}; for (const p of PAGES) if (pages[p]) mesures[eid][p] = garder(pages[p]); }
  const sortie = { lot: 'UX-0', section: '§459', date: jour, base, horloge: HORLOGE, chromium,
    lire: 'cibles et textes : informatif (le total de la page) ; hauteur : informatif ; tout le reste est le cliquet — voir MESURES et GESTES dans scripts/mv-ux-rendu.mjs',
    regravures, mesures, gestes: releve.gestes };
  fs.writeFileSync(REF, JSON.stringify(sortie, null, 1) + '\n');
  console.log('\n\x1b[32mGRAVÉ\x1b[0m — ' + path.relative(RACINE, REF) + ' (' + nbReleve + ' pages, ' + Object.keys(releve.gestes).length + ' gestes' + (ref ? ', ' + baisses.length + ' baisse(s), ' + hausses.length + ' hausse(s) acceptée(s)' : ', première gravure') + ')');
  process.exit(0);
}
if (baisses.length) { console.log('  \x1b[33m↓\x1b[0m ' + baisses.length + ' baisse(s) — à regraver (npm run test:ux -- --baseline), après avoir vérifié qu’aucune mesure ne monte :'); baisses.slice(0, 10).forEach((b) => console.log('      ' + b)); }
if (nouvelles.length) console.log('  \x1b[33m+\x1b[0m ' + nouvelles.length + ' mesure(s) absente(s) de la référence (à graver) : ' + nouvelles.slice(0, 6).join(' · '));
console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' vérifications, ' + ko + ' échec(s)');
process.exit(ko ? 1 : 0);
