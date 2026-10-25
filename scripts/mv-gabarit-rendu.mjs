#!/usr/bin/env node
// =============================================================================
// Ma Vigne — LE GABARIT DU PILOTAGE, MESURÉ SUR LE BUILD (GABARIT-2, §456)
// -----------------------------------------------------------------------------
// Lancer :  npm run build (ou, sans la chaîne : node scripts/mv-gt-page.mjs, npx vite build, inject-precache, mv-version-json)
//           npm run test:gabarit        (CI : job des tests sur le build, après les tutos)
//           npm run test:gabarit -- --contre   (contre-épreuve : cinq défauts posés à l'écran doivent rougir)
// Bac à sable de Claude : MV_CHROMIUM=<chemin d'un Chromium>.
//
// POURQUOI. GABARIT-1 (§455) donne un style par rôle (bloc final de styles.css, réglages de la charte). Un harnais qui lit
// le code vérifie que le bloc existe ; il ne voit pas l'écran. Une pièce neuve qui écrit sa taille en ligne, une règle
// injectée plus spécifique, un graphique qui pose son attribut : rien ne rougirait. Ici on fait ce qu'a fait la maquette :
// l'appli construite, la démo (le domaine fictif des tutos), les 15 vues du Pilotage au téléphone et sur ordinateur, les
// cartes repliées dépliées pour la mesure, et chaque texte, jauge et carte relevés à l'écran.
// ★ CE QUI ROUGIT : une seconde police, une graisse hors 400/500/600, une taille hors des huit crans, un RÔLE qui prend
//   deux styles d'une vue à l'autre, une jauge qui n'a pas 10 px (6 pour une frise), une carte qui n'est pas arrondie à 12.
// ★ CE QUI EST LAISSÉ HORS MESURE, EXPRÈS : les pièces communes à toute l'appli (en-tête de module, bouton Aide, pastille
//   de synchronisation, météo, titre des feuilles, .mvcarte-fond) et les exposants (<sup>) — §455f.
// ★ Une capture où l'écran de connexion est revenu ne compte pas (CAPTURES-1, §371) : l'outil sort en code 1.
// =============================================================================
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url)), RACINE = path.resolve(ICI, '..'), DIST = path.join(RACINE, 'dist');
if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('dist/ absent : npm run build d’abord'); process.exit(2); }
let playwright; try { playwright = await import('playwright'); } catch (e) { console.error('Playwright absent : npm i, puis npx playwright install chromium'); process.exit(2); }
const CONTRE = process.argv.includes('--contre');
const VUES = [
  { id: 'auj-terrain', tab: 'auj', mode: 'terrain' }, { id: 'auj-cave', tab: 'auj', mode: 'cave' }, { id: 'auj-eco', tab: 'auj', mode: 'eco' },
  { id: 'avc', tab: 'avc' }, { id: 'equ', tab: 'equ' }, { id: 'sim', tab: 'sim' },
  { id: 'eco-syn', tab: 'eco', sub: 'syn' }, { id: 'eco-pos', tab: 'eco', sub: 'pos' }, { id: 'eco-par', tab: 'eco', sub: 'par' },
  { id: 'eco-rev', tab: 'eco', sub: 'rev' }, { id: 'eco-ach', tab: 'eco', sub: 'ach' }, { id: 'eco-exe', tab: 'eco', sub: 'exe' },
  { id: 'cfm', tab: 'cfm' }, { id: 'arc', tab: 'arc' }, { id: 'param', param: true }];
const POLICE = 'Outfit', GRAISSES = ['400', '500', '600'], TAILLES = [11, 12, 13, 14, 16, 20, 24, 28];
// Un rôle, un style : chaque motif lit le chemin d'un élément (« tag#id.classes < parent… »), comme le relevé de la maquette.
const ROLES = [
  ['le chiffre d’une carte', [/^b(#[\w-]+)?(\.[\w-]+)* < span\.ck-ph-n/, /^b < span\.pil-th-stat/, /^span\.v < button\.pil-photo/, /^div\.v < div\.pec-k/, /^div\.v < div\.pil-anf-c/, /^div\.v < div\.prv-fx/, /^div\.v < div\.prv-go/, /^(div|span)\.pil-big/, /^div\.v < div < div\.pec-mini/], 1],
  ['le titre d’un panneau', [/^h2\.ck-titre-p/, /^div(#[\w-]+)?\.pil-panel-t/, /^div\.pec-ct/, /^span\.t < div\.pil-t2h/, /^div\.arcan-t/], 1],
  ['l’étiquette d’un chiffre', [/^span < div\.ck-ph-l/, /^span\.pil-th-t/, /^span\.k < button\.pil-photo/, /^div\.l < div\.pec-k/, /^div\.l < div < div\.pec-mini/, /^div\.ck-dz-t/], 1],
  ['le nom d’une ligne', [/^span\.ck-ch-nom/, /^span\.nom < div\.mvk-ligne/, /^div\.pil-li-t/, /^span\.ck-ta-n/, /^span\.n < div\.pil-tens-r/, /^span\.n < div\.pil-prot-r/], 1],
  ['la valeur d’une ligne', [/^b < span\.ck-ch-pct/, /^span\.pct/, /^div\.pil-li-r/, /^b < div\.pil-li-r/], 1],
  ['la ligne de cadre', [/^p(#[\w-]+)?\.ck-cadre/, /^div\.pil-tsub/, /^div\.pec-cs/, /^div\.s < div\.pec-k/], 1],
  ['les choix dans une carte', [/^button(\.on)? < div\.pec-sub/, /^button(\.on)? < div(#[\w-]+)?\.pil-seg/, /^button < div\.ck-seg/], 2],   // 500, et 600 pour le choix en cours
  ['l’en-tête de colonne', [/^th/], 1]];
const JAUGES = ['.pil-gauge-track', '.mvk-barre', '.pil-gbar', '.pec-bar', '.pil-anbar', '.pil-dz-rdt-bar', '.prv-jg', '.pil-tens-r .k', '.pil-trx-trk', '.cv-barre', '.pil-map-bar', '.pil-trx-carnet', '.ck-barre:not(.fine)'];
const FINES = ['.ck-fr-piste', '.ck-dz-fen-piste', '.ck-barre.fine'];
const CARTES = ['.pil-panel', '.pil-tile', '.pil-tile2', '.pec-card', '.pil-anc', '.arc-kpi'];
const COMMUNES = ['mod-header', 'mv-help-btn', 'mv-syncdot', 'hv2-meteo-mini', 'modal-hd', 'mvcarte-fond'];

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(DIST, p);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
await new Promise((ok) => srv.on('listening', ok));
const U = 'http://localhost:' + srv.address().port;
const exe = process.env.MV_CHROMIUM || '';
const nav = await playwright.chromium.launch({ headless: true, ...(exe ? { executablePath: exe, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-zygote'] } : {}) });

const relevés = []; const erreurs = []; let connexion = 0;
const VUES_JOUEES = CONTRE ? VUES.filter((v) => ['avc', 'eco-syn'].includes(v.id)) : VUES;
const ECRANS = CONTRE ? [{ id: 'ordinateur', w: 1366, h: 900 }] : [{ id: 'ordinateur', w: 1366, h: 900 }, { id: 'téléphone', w: 390, h: 844 }];
// La contre-épreuve pose CINQ défauts à l'écran, chacun visé par une vérification : une police, une taille, un rôle, une jauge, une carte.
//   ⚠️ Avec deux identifiants : le bloc du gabarit pèse un identifiant et deux classes (:is() prend le plus lourd de sa liste),
//   un défaut moins spécifique perdrait contre lui et la contre-épreuve passerait pour muette.
const DEFAUTS = '#page-pilotage #pil-content .pil-th-t{font-family:Georgia,serif!important;font-size:15px!important}#page-pilotage #pil-content .mvk-barre{height:7px!important;max-height:7px!important}#page-pilotage #pil-content .pil-panel{border-radius:15px!important}';
for (const vue of ECRANS) {
  const ctx = await nav.newContext({ viewport: { width: vue.w, height: vue.h }, reducedMotion: 'reduce', serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR' });
  const page = await ctx.newPage();
  await page.route('**/*', (r) => { const u = r.request().url(); return (u.startsWith(U) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  let chargements = 0; page.on('load', () => { chargements++; });
  page.on('pageerror', (e) => erreurs.push(vue.id + ' : ' + String(e && e.message).slice(0, 160)));
  try {
    await page.goto(U + '/?tenant=e2e-test', { waitUntil: 'domcontentloaded', timeout: 90000 });
    for (let k = 0; k < 40 && chargements < 2; k++) await page.waitForTimeout(250);
    await page.waitForFunction(() => window.__MV_BOOTED === true && typeof window._startDemoVisite === 'function', null, { timeout: 90000 });
    await page.waitForTimeout(1500);
    // le domaine fictif des tutos AVANT la démo (la démo complète la base du bac à sable, qu'elle n'a pas hors réseau)
    await page.evaluate(() => { if (window._mvTutoCharger) window._mvTutoCharger(); window.fbLoginDemo = async () => true; window._authReady = true; window._startDemoVisite(); });
    await page.waitForFunction(() => { const ls = document.getElementById('login-screen'); return !ls || ls.style.display === 'none'; }, null, { timeout: 30000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => {   // un peu de travail fait : les jauges se remplissent
      const P = window.PARCELLES || [], set = (n, t, v) => { const p = P.find((x) => x.nom === n); if (!p) return; if (!p.taches || typeof p.taches !== 'object' || Array.isArray(p.taches)) p.taches = {}; p.taches[t] = v; };
      ['La Combotte', 'Les Perrières', 'Les Charmes', 'Clos du Moulin'].forEach((n) => set(n, 'Palissage', 'Validé')); ['La Combotte', 'Les Charmes'].forEach((n) => set(n, 'Tirage', 'Validé')); set('Aux Murgers', 'Taille', 'Validé');
      document.querySelectorAll('.overlay.open').forEach((o) => o.classList.remove('open'));
      document.querySelectorAll('[id^="mvt"], [class^="mvt-"], [class*=" mvt-"]').forEach((e) => { e.style.display = 'none'; });
      window.goTo('pilotage');
    });
    if (CONTRE) await page.evaluate((css) => { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }, DEFAUTS);
    await page.waitForTimeout(2500);
    for (const v of VUES_JOUEES) {
      await page.evaluate((v) => { document.querySelectorAll('.overlay.open').forEach((o) => o.classList.remove('open')); window._pilSetTab(v.param ? 'auj' : v.tab); }, v);
      await page.waitForTimeout(1200);
      if (v.mode) { await page.evaluate((m) => { const b = document.querySelector('.ck-bascule [data-mode="' + m + '"]'); if (b) b.click(); }, v.mode); await page.waitForTimeout(1000); }
      if (v.sub) { await page.evaluate((s) => { const b = document.querySelector('[data-pec="sub"][data-v="' + s + '"]'); if (b) b.click(); }, v.sub); await page.waitForTimeout(1000); }
      if (v.param) { await page.evaluate(() => { if (window._pilParamOpen) window._pilParamOpen(); const o = document.getElementById('ovReglPilotage'); if (o && !o.classList.contains('open')) { if (window.openOv) window.openOv('ovReglPilotage'); if (!o.classList.contains('open')) o.classList.add('open'); } }); await page.waitForTimeout(1500); }
      await page.evaluate(() => { document.querySelectorAll('#page-pilotage .pil-tile:not(.open)').forEach((x) => x.classList.add('open')); if (window._mvGraphRepeindre) window._mvGraphRepeindre(); });
      await page.waitForTimeout(800);
      const m = await page.evaluate(([v, JAUGES, FINES, CARTES, COMMUNES]) => {
        const ls = document.getElementById('login-screen'); if (ls && ls.style.display !== 'none') return { connexion: true };
        const racine = v.param ? document.getElementById('ovReglPilotage') : document.getElementById('page-pilotage');
        const vis = (el) => { try { return el.checkVisibility({ opacityProperty: true, visibilityProperty: true }); } catch (e) { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; } };
        const cls = (e) => ((e.getAttribute && e.getAttribute('class')) || '').trim().split(/\s+/).filter(Boolean).join('.');
        const chemin = (el) => { const o = []; let e = el; for (let k = 0; k < 4 && e && e.nodeType === 1; k++, e = e.parentElement) { const c = cls(e); o.push(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (c ? '.' + c : '')); } return o.join(' < '); };
        const commune = (el) => COMMUNES.some((c) => el.closest('.' + c)) || !!el.closest('sup,sub');
        const textes = []; const vus = new Set(); const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
        while (w.nextNode()) { const t = w.currentNode; if (!t.nodeValue.trim()) continue; const el = t.parentElement; if (!el || vus.has(el)) continue; vus.add(el);
          if (el.closest('script,style') || commune(el) || !vis(el)) continue; const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
          const cs = getComputedStyle(el); textes.push({ t: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30), ch: chemin(el), ff: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), fs: parseFloat(cs.fontSize), fw: cs.fontWeight }); }
        const hauteurs = (sels) => sels.flatMap((s) => Array.from(racine.querySelectorAll(s)).filter(vis).map((e) => ({ s, h: +e.getBoundingClientRect().height.toFixed(1) })));
        const cartes = CARTES.flatMap((s) => Array.from(racine.querySelectorAll(s)).filter(vis).map((e) => ({ s, r: getComputedStyle(e).borderTopLeftRadius })));
        return { textes, jauges: hauteurs(JAUGES), fines: hauteurs(FINES), cartes };
      }, [v, JAUGES, FINES, CARTES, COMMUNES]);
      if (m.connexion) { connexion++; continue; }
      relevés.push({ vue: vue.id, id: v.id, ...m });
    }
  } catch (e) { erreurs.push(vue.id + ' ARRÊT : ' + e.message); }
  await ctx.close();
}
await nav.close(); srv.close();

let ok = 0, ko = 0; const rouges = [];
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; rouges.push(nom); console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
const ou = (r) => r.vue + ' › ' + r.id;
const tous = relevés.flatMap((r) => r.textes.map((x) => ({ ...x, ou: ou(r) })));
console.log('\x1b[1mMA VIGNE — Le gabarit du Pilotage, mesuré sur le build\x1b[0m  (' + relevés.length + ' vues relevées, ' + tous.length + ' textes)');
t('les ' + VUES_JOUEES.length + ' vues ont été relevées (' + ECRANS.map((e) => e.id).join(', ') + '), sans retour à l’écran de connexion', relevés.length === VUES_JOUEES.length * ECRANS.length && connexion === 0, relevés.length + ' vues, ' + connexion + ' écran(s) de connexion');
const polices = tous.filter((x) => x.ff !== POLICE);
t('une police : ' + POLICE, polices.length === 0, polices.slice(0, 3).map((x) => x.ff + ' « ' + x.t + ' » (' + x.ou + ')').join(' · '));
const graisses = tous.filter((x) => !GRAISSES.includes(String(x.fw)));
t('trois graisses : ' + GRAISSES.join(', '), graisses.length === 0, graisses.slice(0, 3).map((x) => x.fw + ' « ' + x.t + ' » ' + x.ch.split(' < ')[0] + ' (' + x.ou + ')').join(' · '));
const tailles = tous.filter((x) => !TAILLES.includes(x.fs));
t('huit tailles : ' + TAILLES.join(', ') + ' px', tailles.length === 0, tailles.slice(0, 3).map((x) => x.fs + ' px « ' + x.t + ' » ' + x.ch.split(' < ')[0] + ' (' + x.ou + ')').join(' · '));
for (const [nom, motifs, max] of ROLES) {
  const st = new Map(); tous.filter((x) => motifs.some((m) => m.test(x.ch))).forEach((x) => { const k = x.fs + ' px · ' + x.fw; if (!st.has(k)) st.set(k, x.ou); });
  t('un rôle, un style — ' + nom + (st.size ? ' (' + [...st.keys()].join(' / ') + ')' : ' (absent des vues)'), st.size <= max, [...st.entries()].map(([k, o]) => k + ' dans ' + o).join(' · '));
}
const jg = relevés.flatMap((r) => r.jauges.map((j) => ({ ...j, ou: ou(r) }))).filter((j) => Math.abs(j.h - 10) > 0.6);
t('les jauges ont 10 px', jg.length === 0, jg.slice(0, 3).map((j) => j.s + ' : ' + j.h + ' px (' + j.ou + ')').join(' · '));
const fn = relevés.flatMap((r) => r.fines.map((j) => ({ ...j, ou: ou(r) }))).filter((j) => Math.abs(j.h - 6) > 0.6);
t('les jauges fines ont 6 px', fn.length === 0, fn.slice(0, 3).map((j) => j.s + ' : ' + j.h + ' px (' + j.ou + ')').join(' · '));
const cr = relevés.flatMap((r) => r.cartes.map((c) => ({ ...c, ou: ou(r) }))).filter((c) => c.r !== '12px');
t('les cartes sont arrondies à 12 px', cr.length === 0, cr.slice(0, 3).map((c) => c.s + ' : ' + c.r + ' (' + c.ou + ')').join(' · '));
if (erreurs.length) { console.log('  erreurs JS :'); erreurs.slice(0, 6).forEach((e) => console.log('    ' + e)); }
if (CONTRE) {
  const attendus = ['une police', 'huit tailles', 'l’étiquette d’un chiffre', 'les jauges ont 10 px', 'arrondies à 12 px'];
  const muets = attendus.filter((a) => !rouges.some((r) => r.includes(a)));
  console.log('\n' + (muets.length ? '\x1b[31mROUGE\x1b[0m — ne rougissent pas : ' + muets.join(', ') : '\x1b[32mVERT\x1b[0m — les ' + attendus.length + ' défauts posés à l’écran rougissent'));
  process.exit(muets.length || relevés.length !== VUES_JOUEES.length * ECRANS.length ? 1 : 0);
}
console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' vérifications, ' + ko + ' échec(s)');
process.exit(ko ? 1 : 0);
