#!/usr/bin/env node
// =============================================================================
// Ma Vigne — LE CLIQUET DES MOTS, MESURÉ SUR LE BUILD (MOTS-0, §580)
// -----------------------------------------------------------------------------
// Lancer :  npm run build (ou, sans la chaîne : node scripts/mv-gt-page.mjs, npx vite build, inject-precache, mv-version-json)
//           npm run test:mots                                   (CI : job « mesures », après l’expérience d’usage)
//           npm run test:mots -- --contre                       (contre-épreuve : quatre défauts posés à l’écran doivent rougir)
//           npm run test:mots -- --baseline                     (regraver la référence après une BAISSE — refusé s’il y a une hausse)
//           npm run test:mots -- --baseline --accepte "<raison>"   (une hausse VOULUE : la raison est écrite dans la référence)
//           npm run test:mots -- --baseline --motif "<texte>"     (dire pourquoi on regrave)
//           npm run test:mots -- --liste                         (le relevé, écran par écran, du plus chargé au plus léger)
// Bac à sable de Claude : MV_CHROMIUM=<chemin d’un Chromium>.
//
// POURQUOI. Nico, le 16/11 : « dans le pilotage il y a trop d’écriture, de texte à lire, et donc l’information est à chercher ».
// Le relevé du jour (docs/maquettes/maquette-moins-de-texte-v3.html) : 8 818 mots sur les 46 écrans de l’admin au téléphone,
// 77 phrases de 15 mots et plus, dont 42 au Pilotage et 23 dans la Cave ; 85 mots à passer avant le premier grand chiffre
// d’Économie. Le plan en lots va faire baisser ces chiffres ; ce contrôle garantit qu’ils ne remontent plus — une phrase
// d’explication posée « juste pour cette carte » est exactement ce qui a rempli les écrans. UN CLIQUET, comme l’expérience
// d’usage (§459) : hausse → rouge nommé ; égal → silence ; baisse → regraver.
// ★ CE QUI EST MESURÉ — les 46 écrans de l’admin (module, onglet, sous-onglet), au téléphone (390 × 844) et sur ordinateur
//   (1366 × 900), dans la page active, sans le bandeau (.mod-header) ni la ligne d’écran (.mv-ecran), fenêtres fermées :
//   mots    les mots visibles (au moins deux lettres ; les chiffres ne comptent pas) ;
//   p15     les blocs de texte de 15 mots et plus — une phrase à lire, pas une étiquette (un bloc = le plus petit élément
//           non « inline » au-dessus d’un texte : une phrase coupée par du gras reste une phrase, un texte n’est compté qu’une fois) ;
//   avant   les mots à passer avant le premier grand chiffre (20 px et plus) ; null si l’écran n’en a pas ;
//   lex     AU PILOTAGE SEULEMENT, les mots hors lexique (§580c) : « réalisé », « dépensé », « effectif », « la saison »,
//           « 25 novembre », « 24/10/2025 », « ~ »… Onze choses, onze mots : ceux-là doivent partir. Ailleurs, null —
//           « consommé » est le bon mot pour un intrant, « restants » pour des kilos.
// ★ L’HORLOGE est posée au mardi 27/10/2026, 9 h (Paris), puis elle tourne — la même que l’expérience d’usage : la démo se
//   construit autour d’« aujourd’hui », et un relevé qui changerait avec le jour ferait un cliquet menteur.
// ★ LA MARGE : 2 mots (un libellé d’heure qui change avec la minute), aucune pour les phrases ni pour le lexique.
// ★ Un écran qui revient à la connexion, un onglet introuvable, ou une mesure qui disparaît, rougit : un contrôle qui
//   déménage doit rougir (§6c), on le suit, on ne le contourne pas. ⚠️ UN ONGLET QUI DÉMÉNAGE (rangement admin, §577) :
//   son écran change de clé — retirer l’ancienne de ECRANS, poser la nouvelle, regraver avec --motif. Les mots, eux,
//   ne doivent pas monter au passage.
// ⚠️ Pas mesuré : la fiche d’une personne au téléphone (sur ordinateur, ses cinq onglets le sont depuis MOTS-18, §618), Parcelles › Carte, les fenêtres qui s’ouvrent par-dessus, le thème
//   sombre, la vue de l’équipe. Ce contrôle compte des mots ; il ne dit pas si un écran se comprend.
// =============================================================================
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url)), RACINE = path.resolve(ICI, '..'), DIST = path.join(RACINE, 'dist');
const REF = path.join(ICI, 'mv-mots-baseline.json');
if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('dist/ absent : npm run build d’abord'); process.exit(2); }
let playwright; try { playwright = await import('playwright'); } catch (e) { console.error('Playwright absent : npm i, puis npx playwright install chromium'); process.exit(2); }
const ARGS = process.argv.slice(2);
const CONTRE = ARGS.includes('--contre'), GRAVER = ARGS.includes('--baseline'), LISTE = ARGS.includes('--liste');
const iAcc = ARGS.indexOf('--accepte'), ACCEPTE = iAcc >= 0 ? String(ARGS[iAcc + 1] || '').trim() : '';
const iMot = ARGS.indexOf('--motif'), MOTIF = iMot >= 0 ? String(ARGS[iMot + 1] || '').trim() : '';
if (iMot >= 0 && !MOTIF) { console.error('--motif demande son texte : --motif "<pourquoi on regrave>"'); process.exit(2); }
if (iAcc >= 0 && !ACCEPTE) { console.error('--accepte demande sa raison : --accepte "<pourquoi cette hausse est voulue>"'); process.exit(2); }

const HORLOGE = '2026-10-27T08:00:00Z';   // mardi 27 octobre 2026, 9 h à Paris (heure d’hiver) — celle de mv-ux-rendu.mjs
// Un écran = [clé, page, les gestes pour y arriver]. Un geste : { js: 'fonction("x")' } appelle window.fonction ; { clic: 'Texte' }
// touche, dans la page active et hors bandeau, le bouton dont c’est le texte exact (la bascule d’Aujourd’hui, les sous-vues d’Économie).
const J = (s) => ({ js: s }), C = (s) => ({ clic: s });
const ECRANS = [
  ['Vigne › Accueil', 'home', []], ['Vigne › Parcelles › Liste', 'parcelles', [J('switchPTab("liste")')]], ['Vigne › Parcelles › Stades', 'parcelles', [J('switchPTab("stades")')]], ['Vigne › Journal', 'journal', []],
  ['Tracteur › Sessions', 'tracteur', [J('switchTracOnglet("sessions")')]], ['Tracteur › Entretien', 'tracteur', [J('switchTracOnglet("entretiens")')]],
  ['Phyto › Registre', 'phyto', [J('switchPhytoTab("reg")')]], ['Phyto › Catalogue', 'phyto', [J('switchPhytoTab("cat")')]], ['Phyto › Fertilisation', 'phyto', [J('switchPhytoTab("fer")')]],
  ['Cave › Aujourd’hui', 'cave', [J('selectCaveSection("aujourdhui")')]],
  ['Cave › Le Cuvier › Maturités', 'cave', [J('selectCaveSection("vendange")'), J('switchVendOng("ana")')]], ['Cave › Le Cuvier › Récoltes', 'cave', [J('selectCaveSection("vendange")'), J('switchVendOng("rec")')]],
  ['Cave › Le Cuvier › Cuves', 'cave', [J('selectCaveSection("vendange")'), J('switchVendOng("cuves")')]], ['Cave › Le Cuvier › Tournée', 'cave', [J('selectCaveSection("vendange")'), J('switchVendOng("tour")')]],
  ['Cave › Le Chai › Cuvées', 'cave', [J('selectCaveSection("elevage")'), J('switchCaveOng("cuv")')]], ['Cave › Le Chai › Bouteilles', 'cave', [J('selectCaveSection("elevage")'), J('switchCaveOng("bouteille")')]],
  ['Cave › Le Chai › Labo', 'cave', [J('selectCaveSection("elevage")'), J('switchCaveOng("labo")')]], ['Cave › Le Chai › Diagnostic', 'cave', [J('selectCaveSection("elevage")'), J('switchCaveOng("diag")')]],
  ['Cave › Le Chai › Journal', 'cave', [J('selectCaveSection("elevage")'), J('switchCaveOng("journal")')]],
  ['Cave › Le Millésime › Ensemble', 'cave', [J('selectCaveSection("millesime")'), J('_mlSetTab("vie")')]], ['Cave › Le Millésime › Parcelles', 'cave', [J('selectCaveSection("millesime")'), J('_mlSetTab("parc")')]],
  ['Cave › Le Millésime › Cuvées', 'cave', [J('selectCaveSection("millesime")'), J('_mlSetTab("cuv")')]], ['Cave › Le Millésime › Courbes', 'cave', [J('selectCaveSection("millesime")'), J('_mlSetTab("crb")')]],
  ['Réserve › Fûts', 'reserve', [J('_rsvTabTo("futs")')]], ['Réserve › Intrants', 'reserve', [J('_rsvTabTo("intrants")')]], ['Réserve › Bilan matière', 'reserve', [J('_rsvTabTo("audit")')]],
  ['Planning › Mois', 'planning', [J('planSwitchTab("mois")')]], ['Planning › Année', 'planning', [J('planSwitchTab("annee")')]], ['Planning › Personnel', 'planning', [J('planSwitchTab("gens")')]],
  // ★ MOTS-18 (§618) : la fiche d'une personne, ses quatre autres onglets — sur ordinateur, elle est rangée dans la page (le Résumé l'est déjà
  //   avec « Planning › Personnel ») ; au téléphone elle s'ouvre par-dessus et ces quatre clés relèvent la liste, comme « Personnel ».
  ['Planning › Personnel › Jours', 'planning', [J('planSwitchTab("gens")'), J('planFicheTab("jours")')]], ['Planning › Personnel › Compteur', 'planning', [J('planSwitchTab("gens")'), J('planFicheTab("hsup")')]],
  ['Planning › Personnel › Congés', 'planning', [J('planSwitchTab("gens")'), J('planFicheTab("cp")')]], ['Planning › Personnel › Frais', 'planning', [J('planSwitchTab("gens")'), J('planFicheTab("frais")')]],
  ['Pilotage › Aujourd’hui › Terrain', 'pilotage', [J('_pilSetTab("auj")'), C('Terrain')]], ['Pilotage › Aujourd’hui › Cave', 'pilotage', [J('_pilSetTab("auj")'), C('Cave')]],
  ['Pilotage › Aujourd’hui › Économie', 'pilotage', [J('_pilSetTab("auj")'), C('Économie')]],
  ['Pilotage › Travaux', 'pilotage', [J('_pilSetTab("avc")')]], ['Pilotage › L’équipe & le matériel', 'pilotage', [J('_pilSetTab("equ")')]], ['Pilotage › Décider', 'pilotage', [J('_pilSetTab("sim")')]],
  ['Pilotage › Économie › Synthèse', 'pilotage', [J('_pilSetTab("eco")'), C('Synthèse')]], ['Pilotage › Économie › Postes & travaux', 'pilotage', [J('_pilSetTab("eco")'), C('Postes & travaux')]],
  ['Pilotage › Économie › Parcelles', 'pilotage', [J('_pilSetTab("eco")'), C('Parcelles')]], ['Pilotage › Économie › Revient', 'pilotage', [J('_pilSetTab("eco")'), C('Revient')]],
  ['Pilotage › Économie › Achats', 'pilotage', [J('_pilSetTab("eco")'), C('Achats')]], ['Pilotage › Économie › Le détail de l’exercice', 'pilotage', [J('_pilSetTab("eco")'), C('Le détail de l’exercice')]],
  ['Pilotage › Conformité', 'pilotage', [J('_pilSetTab("cfm")')]], ['Pilotage › Archives', 'pilotage', [J('_pilSetTab("arc")')]],
  ['Réglages › Domaine', 'reglages', [J('switchReglTab("domaine")')]], ['Réglages › Équipe', 'reglages', [J('switchReglTab("equipe")')]], ['Réglages › Moi', 'reglages', [J('switchReglTab("app")')]],
];
const TAILLES = [{ id: 'téléphone', w: 390, h: 844, tel: true }, { id: 'ordinateur', w: 1366, h: 900, tel: false }];
// sens : 'bas' = plus petit vaut mieux. tol : le jeu toléré. obj : la cible du plan (§580).
const MESURES = {
  mots: { tol: 2, obj: 'la moitié', lib: 'mots à l’écran' },
  p15: { tol: 0, obj: '0 hors la phrase du haut', lib: 'phrases de 15 mots et plus' },
  avant: { tol: 2, obj: '≤ 15', lib: 'mots avant le premier grand chiffre (le pire écran)' },
  lex: { tol: 0, obj: '0', lib: 'mots hors lexique, au Pilotage' },
};
// LE LEXIQUE (§580c) — les mots qui partent, lus dans le texte visible du Pilotage. Une expression par ligne, avec le mot gardé.
const HORS_LEXIQUE = [
  'r[ée]alis[ée]e?s?',                                          // → fait
  'avancement',                                                 // → fait
  'planifi[ée]e?s?', 'attendus?',                               // → prévu
  'restante?s?', 'reste à engager', 'encore à faire',           // → reste
  'd[ée]pens[ée]e?s?', 'consomm[ée]e?s?',                       // → engagé (la campagne) ou sorti (l’exercice)
  'effectif', 'pr[ée]sences', 'au champ', 'actifs',             // → présents, équipe
  'à trouver',                                                  // → renfort
  'fin de saison', 'fin estim[ée]e', 'pour finir',              // → fin prévue
  'saisons?', '(?:la|cette|de la) p[ée]riode', 'd’automne',      // → la campagne
  '\\d{1,2}(?:er)? (?:janvier|f[ée]vrier|avril|juillet|septembre|octobre|novembre|d[ée]cembre)',   // → « 25 nov. »
  '\\d{1,2}/\\d{1,2}/\\d{4}',                                   // → « 24 oct. 2025 »
  '~ ?[\\dA-Za-zÀ-ÿ]',                                           // → « ≈ »
];

// La contre-épreuve pose QUATRE défauts dans Pilotage › Économie › Synthèse, au téléphone, chacun visé par une mesure :
// une phrase de 20 mots posée EN TÊTE de l’écran (mots, p15, et avant : elle passe devant le premier chiffre), et un mot hors lexique.
const DEFAUT_PHRASE = 'Ce chiffre est calculé à partir des validations du journal et des heures du planning sur toute la durée de la campagne en cours.';
const DEFAUT_MOT = 'budget dépensé';
const ECRAN_CONTRE = 'Pilotage › Économie › Synthèse';
const attendus = [ECRAN_CONTRE + ' › téléphone › mots', ECRAN_CONTRE + ' › téléphone › p15', ECRAN_CONTRE + ' › téléphone › avant', ECRAN_CONTRE + ' › téléphone › lex'];

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(DIST, p);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
await new Promise((ok) => srv.on('listening', ok));
const U = 'http://localhost:' + srv.address().port;
const exe = process.env.MV_CHROMIUM || '';
const nav = await playwright.chromium.launch({ headless: true, ...(exe ? { executablePath: exe, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-zygote'] } : {}) });

// ── Mesure d’un écran (exécutée dans le navigateur). Tout se lit dans la page ACTIVE, hors bandeau, hors ligne d’écran, fenêtres fermées. ──
const MESURE = ([lexSrc]) => {
  const ls = document.getElementById('login-screen'); if (ls && ls.style.display !== 'none') return { connexion: true };
  const pg = document.querySelector('.page.active'); if (!pg) return { absente: true };
  const vis = (el) => { try { if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false; } catch (e) { /* navigateur ancien : la boîte suffit */ } const r = el.getBoundingClientRect(); return r.width >= 1 && r.height >= 1; };
  const hors = (el) => { if (el.closest('.mod-header, .mv-ecran, script, style')) return true; const o = el.closest('.overlay'); return !!(o && !o.classList.contains('open')); };
  const nb = (s) => s.split(/\s+/).filter((m) => /[a-zA-ZÀ-ÿ]{2,}/.test(m)).length;
  const lex = lexSrc ? new RegExp('(?:^|[^a-zà-ÿ])(?:' + lexSrc + ')(?![a-zà-ÿ])', 'gi') : null;
  let mots = 0, nLex = 0; const textes = []; const w = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const t = w.currentNode; const s = t.nodeValue.replace(/\s+/g, ' ').trim(); if (!s) continue; const el = t.parentElement; if (!el || hors(el) || !vis(el)) continue;
    mots += nb(s); if (lex && !el.closest('svg')) nLex += (s.match(lex) || []).length;
    textes.push({ s, el, y: el.getBoundingClientRect().top + window.scrollY + (pg.scrollTop || 0), fs: parseFloat(getComputedStyle(el).fontSize), svg: !!el.closest('svg') }); }
  // les blocs : chaque texte va dans SON bloc — le plus petit élément non « inline » au-dessus de lui — et n’est compté qu’une fois
  const parBloc = new Map();
  textes.forEach((x) => { if (x.svg) return; let a = x.el; while (a.parentElement && a !== pg && getComputedStyle(a).display.startsWith('inline')) a = a.parentElement; parBloc.set(a, (parBloc.get(a) || 0) + nb(x.s)); });
  const p15 = Array.from(parBloc.values()).filter((n) => n >= 15);
  textes.sort((x, y) => x.y - y.y);
  const premier = textes.find((x) => x.fs >= 20 && /\d/.test(x.s) && !x.svg);
  const avant = premier ? textes.reduce((n, x) => n + (x.y < premier.y - 4 ? nb(x.s) : 0), 0) : null;
  return { mots, p15: p15.length, avant, lex: lex ? nLex : null, longue: p15.reduce((m, n) => Math.max(m, n), 0),
    hauteur: Math.round(Math.max(document.documentElement.scrollHeight, pg.scrollHeight) / window.innerHeight * 10) / 10 };
};

// L’ÉCRAN EST POSÉ quand son texte ne bouge plus : deux lectures égales à 200 ms d’écart (3 s au plus). Un délai fixe coûtait
// quatre minutes sur 92 écrans ; le job « mesures » de la CI n’a pas cette place (CI-1, §514 : aucun job près de sa limite).
const pose = async (page) => { let avant = -1;
  for (let k = 0; k < 15; k++) { await page.waitForTimeout(200); const n = await page.evaluate(() => { const p = document.querySelector('.page.active'); return p ? p.innerText.length : -1; }); if (n === avant && k >= 1) return; avant = n; } };

// ── Le relevé ──
const releve = { mesures: {} }; const erreurs = []; let connexion = 0, chromium = '';
try { chromium = nav.version(); } catch (e) { chromium = ''; }
const TAILLES_JOUEES = CONTRE ? TAILLES.filter((e) => e.tel) : TAILLES;
const ECRANS_JOUES = CONTRE ? ECRANS.filter((e) => e[0] === ECRAN_CONTRE) : ECRANS;
const LEX_SRC = HORS_LEXIQUE.join('|');
for (const taille of TAILLES_JOUEES) {
  const ctx = await nav.newContext({ viewport: { width: taille.w, height: taille.h }, reducedMotion: 'reduce', serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', isMobile: taille.tel, hasTouch: taille.tel });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date(HORLOGE) }); await page.clock.resume();   // l’horloge posée, puis elle tourne
  await page.route('**/*', (r) => { const u = r.request().url(); return (u.startsWith(U) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  let chargements = 0; page.on('load', () => { chargements++; });
  page.on('pageerror', (e) => erreurs.push(taille.id + ' : ' + String(e && e.message).slice(0, 160)));
  const menage = () => page.evaluate(() => { document.querySelectorAll('.overlay.open').forEach((o) => o.classList.remove('open')); document.querySelectorAll('[id^="mvt"], [class^="mvt-"], [class*=" mvt-"]').forEach((e) => { e.style.display = 'none'; }); });
  releve.mesures[taille.id] = {};
  try {
    await page.goto(U + '/?tenant=e2e-test', { waitUntil: 'domcontentloaded', timeout: 90000 });
    for (let k = 0; k < 40 && chargements < 2; k++) await page.waitForTimeout(250);
    await page.waitForFunction(() => window.__MV_BOOTED === true && typeof window._startDemoVisite === 'function', null, { timeout: 90000 });
    await page.waitForTimeout(1500);
    // le domaine fictif des tutos AVANT la démo (comme le gabarit, l’expérience d’usage et les tutos)
    await page.evaluate(() => { if (window._mvTutoCharger) window._mvTutoCharger(); window.fbLoginDemo = async () => true; window._authReady = true; window._startDemoVisite(); });
    await page.waitForFunction(() => { const ls = document.getElementById('login-screen'); return !ls || ls.style.display === 'none'; }, null, { timeout: 30000 });
    await page.waitForTimeout(2500); await menage();
    let courante = '';
    for (const [cle, pg, gestes] of ECRANS_JOUES) {
      if (courante !== pg) { await page.evaluate((p) => { document.querySelectorAll('.overlay.open').forEach((o) => o.classList.remove('open')); window.goTo(p); window.scrollTo(0, 0); }, pg); await page.waitForTimeout(1500); courante = pg; }
      let rate = '';
      for (const g of gestes) {
        if (g.js) { const nom = g.js.slice(0, g.js.indexOf('('));
          const ok = await page.evaluate(([nom, src]) => { if (typeof window[nom] !== 'function') return false; (0, eval)('window.' + src); return true; }, [nom, g.js]); if (!ok) rate = 'window.' + nom + ' introuvable'; }
        else { const ok = await page.evaluate((t) => { const p = document.querySelector('.page.active'); const e = p && Array.from(p.querySelectorAll('button,[onclick],[role=tab]')).find((x) => !x.closest('.mod-header,.mv-ecran') && x.getBoundingClientRect().width > 0 && (x.textContent || '').replace(/\s+/g, ' ').trim() === t); if (e) { e.click(); return true; } return false; }, g.clic);
          if (!ok) rate = 'le bouton « ' + g.clic + ' » introuvable'; }
        if (rate) break; await pose(page);
      }
      if (rate) { erreurs.push(taille.id + ' › ' + cle + ' : ' + rate); continue; }
      await page.evaluate(() => window.scrollTo(0, 0)); await pose(page); await menage();
      if (CONTRE) await page.evaluate(([phrase, mot]) => { const p = document.querySelector('.page.active'); const h = p.querySelector('.mv-ecran') || p.querySelector('.mod-header');
        const d = document.createElement('div'); d.textContent = phrase; const m = document.createElement('div'); m.textContent = mot; h.after(d, m); }, [DEFAUT_PHRASE, DEFAUT_MOT]);
      const m = await page.evaluate(MESURE, [cle.startsWith('Pilotage') ? LEX_SRC : '']);
      if (m.connexion) { connexion++; continue; }
      if (m.absente) { erreurs.push(taille.id + ' › ' + cle + ' : aucune page active'); continue; }
      releve.mesures[taille.id][cle] = m;
    }
  } catch (e) { erreurs.push(taille.id + ' ARRÊT : ' + e.message); }
  await ctx.close();
}
await nav.close(); srv.close();

// ── La comparaison avec la référence ──
let ok = 0, ko = 0; const rouges = [], baisses = [], nouvelles = [];
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; rouges.push(nom); console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
let ref = null; try { ref = JSON.parse(fs.readFileSync(REF, 'utf8')); } catch (e) { ref = null; }
if (!ref && !GRAVER) { console.error('référence absente ou illisible (' + path.relative(RACINE, REF) + ') : npm run test:mots -- --baseline'); process.exit(2); }
const ecarts = [];   // { cle, base, now, hausse }
const comparer = (cle, def, base, now) => {
  if (base === undefined) { nouvelles.push(cle + ' = ' + now); return; }
  if (base === null && (now === null || now === undefined)) return;
  if (base === null) { ecarts.push({ cle, base: 'aucun', now, hausse: true }); return; }   // un grand chiffre apparu loin des premiers mots, un lexique apparu : à regarder
  if (now === null || now === undefined) { if (cle.endsWith(' › avant')) baisses.push(cle + ' : ' + base + ' → plus de grand chiffre'); else ecarts.push({ cle, base, now: 'perdue', hausse: true }); return; }
  if (now > base + def.tol) ecarts.push({ cle, base, now, hausse: true });
  else if (now < base) baisses.push(cle + ' : ' + base + ' → ' + now);
};
const nbAttendu = ECRANS_JOUES.length * TAILLES_JOUEES.length;
const nbReleve = Object.values(releve.mesures).reduce((s, o) => s + Object.keys(o).length, 0);
console.log('\x1b[1mMA VIGNE — Le cliquet des mots, mesuré sur le build\x1b[0m  (' + nbReleve + ' écrans relevés, horloge au 27/10/2026 9 h' + (chromium ? ', Chromium ' + chromium : '') + ')');
t('les ' + ECRANS_JOUES.length + ' écrans ont été relevés (' + TAILLES_JOUEES.map((e) => e.id).join(', ') + '), sans retour à l’écran de connexion ni onglet introuvable', nbReleve === nbAttendu && connexion === 0,
  nbReleve + ' écrans sur ' + nbAttendu + ', ' + connexion + ' écran(s) de connexion' + (erreurs.length ? ' · ' + erreurs.slice(0, 3).join(' · ') : ''));
if (ref) {
  for (const [tid, ecrans] of Object.entries(releve.mesures)) for (const [cle, m] of Object.entries(ecrans)) for (const [k, def] of Object.entries(MESURES)) {
    const b = ((ref.mesures || {})[tid] || {})[cle]; comparer(cle + ' › ' + tid + ' › ' + k, def, b ? b[k] : undefined, m[k]);
  }
  if (!CONTRE) for (const [tid, ecrans] of Object.entries(ref.mesures || {})) for (const cle of Object.keys(ecrans)) if (!(releve.mesures[tid] || {})[cle]) ecarts.push({ cle: cle + ' › ' + tid, base: 'relevé', now: 'perdu', hausse: true });
}
// un résumé par mesure, avec l’objectif du plan
for (const [k, def] of Object.entries(MESURES)) {
  const parTaille = TAILLES_JOUEES.map((e) => { const v = Object.values(releve.mesures[e.id] || {}).map((m) => m[k]).filter((x) => x !== null && x !== undefined);
    if (!v.length) return null; return e.id + ' ' + (k === 'avant' ? Math.max(...v) : v.reduce((a, b) => a + b, 0)); }).filter(Boolean);
  const h = ecarts.filter((x) => x.cle.endsWith(' › ' + k));
  t(def.lib + ' — ' + (parTaille.join(' · ') || 'non mesuré') + ' · objectif ' + def.obj, h.length === 0, h.map((x) => x.cle + ' : ' + x.base + ' → ' + x.now).join(' · '));
}
const perdus = ecarts.filter((x) => x.now === 'perdu');
if (perdus.length) t('aucun écran de la référence n’a disparu', false, perdus.map((x) => x.cle).join(' · '));
if (erreurs.length) { console.log('  erreurs :'); erreurs.slice(0, 8).forEach((e) => console.log('    ' + e)); }
if (LISTE) { console.log('\n  Le relevé au téléphone, du plus chargé au plus léger (mots · phrases ≥ 15 · la plus longue · mots avant le 1er chiffre · hors lexique · hauteurs d’écran) :');
  Object.entries(releve.mesures['téléphone'] || {}).sort((a, b) => b[1].p15 - a[1].p15 || b[1].mots - a[1].mots).forEach(([cle, m]) => console.log('    ' + cle.padEnd(46) + String(m.mots).padStart(5) + String(m.p15).padStart(4) + String(m.longue).padStart(5) + String(m.avant === null ? '—' : m.avant).padStart(5) + String(m.lex === null ? '—' : m.lex).padStart(5) + String(m.hauteur).padStart(6))); }

// ── Contre-épreuve ──
if (CONTRE) {
  const rougis = ecarts.map((x) => x.cle);
  const muets = attendus.filter((a) => !rougis.includes(a));
  console.log('\n' + (muets.length ? '\x1b[31mROUGE\x1b[0m — ne rougissent pas : ' + muets.join(', ') : '\x1b[32mVERT\x1b[0m — les ' + attendus.length + ' défauts posés à l’écran rougissent'));
  process.exit(muets.length || nbReleve !== nbAttendu ? 1 : 0);
}

// ── Regravure ──
const hausses = ecarts.filter((x) => x.hausse);
if (GRAVER) {
  if (nbReleve !== nbAttendu || connexion > 0) { console.error('\nrelevé incomplet : on ne grave pas une référence trouée'); process.exit(1); }
  if (ref && hausses.length && !ACCEPTE) { console.error('\n\x1b[31mREFUSÉ\x1b[0m — ' + hausses.length + ' hausse(s) : une référence ne se regrave pas pour faire taire un rouge.\n  ' + hausses.slice(0, 8).map((x) => x.cle + ' : ' + x.base + ' → ' + x.now).join('\n  ') + '\n  Une hausse voulue : --baseline --accepte "<raison>"'); process.exit(1); }
  const regravures = (ref && Array.isArray(ref.regravures)) ? ref.regravures.slice() : [];
  const motif = ACCEPTE ? ('hausse acceptée — ' + ACCEPTE) : (MOTIF || (ref ? 'baisse' : ''));
  if (!motif) { console.error('\nune première référence dit pourquoi elle est posée : --baseline --motif "<texte>"'); process.exit(2); }
  regravures.push({ date: new Date().toISOString().slice(0, 10), motif, hausses: ACCEPTE ? hausses.map((x) => x.cle + ' : ' + x.base + ' → ' + x.now) : [] });
  const mesures = {};
  for (const [tid, ecrans] of Object.entries(releve.mesures)) { mesures[tid] = {}; for (const [cle, m] of Object.entries(ecrans)) mesures[tid][cle] = { mots: m.mots, p15: m.p15, avant: m.avant, lex: m.lex }; }
  fs.writeFileSync(REF, JSON.stringify({ _: 'MOTS-0 (§580) — la référence du cliquet des mots. Écrite par npm run test:mots -- --baseline : ne pas la retoucher à la main.', horloge: HORLOGE, chromium, regravures, mesures }, null, 1) + '\n');
  console.log('\n\x1b[32mGRAVÉ\x1b[0m — ' + path.relative(RACINE, REF) + ' (' + nbReleve + ' écrans, motif : ' + motif + ')');
  process.exit(0);
}
if (baisses.length) console.log('\n  ↓ ' + baisses.length + ' baisse(s) — regraver : npm run test:mots -- --baseline\n    ' + baisses.slice(0, 12).join('\n    ') + (baisses.length > 12 ? '\n    … et ' + (baisses.length - 12) + ' autre(s)' : ''));
if (nouvelles.length) console.log('\n  + ' + nouvelles.length + ' mesure(s) absente(s) de la référence — regraver avec --motif : ' + nouvelles.slice(0, 4).join(' · '));
console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' vérifications, ' + ko + ' échec(s)');
process.exit(ko ? 1 : 0);
