/* ───────────────────────────────────────────────────────
   HARNAIS — UX-0 (§459), UX-1 (§467) : LE CLIQUET DE L’EXPÉRIENCE D’USAGE EST BRANCHÉ, SA RÉFÉRENCE TIENT DEBOUT,
   ET UNE CIBLE S’Y MESURE PAR SA ZONE D’APPUI
   Lancer :          node scripts/mv-harnais-ux0.mjs
   Contre-épreuves : node scripts/mv-harnais-ux0.mjs --contre

   POURQUOI IL EXISTE
   Le contrôle au rendu (scripts/mv-ux-rendu.mjs) demande un build et un navigateur : il vit hors de `npm run check`,
   comme le gabarit (§456), et la CI le joue après lui. Ce harnais, lui, tourne à chaque check et garde ce qui ne se voit
   pas tant que rien ne rougit : que npm et la CI jouent bien le contrôle — UN CLIQUET ÉCRIT N’EST PAS UN CLIQUET BRANCHÉ —,
   que la référence (scripts/mv-ux-baseline.json) couvre les dix pages, les deux écrans et les neuf gestes que le contrôle
   relève, avec des nombres, que l’horloge y est la même que dans le contrôle, que le contrôle pose bien son horloge, refuse
   de regraver une hausse sans raison écrite, garde sa contre-épreuve — et que la LISTE ne le joue pas : il lui faut un build et un
   navigateur, et sous --baseline il écrit dans scripts/ (la règle F de mv-harnais-lanceur ne garde que les scripts de la liste).
   ⚠️ Il ne mesure rien à l’écran : la preuve au navigateur, c’est `npm run test:ux` (et `-- --contre`).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pkg: lire('package.json'), ci: lire('.github/workflows/ci.yml'), rendu: lire('scripts/mv-ux-rendu.mjs'), ref: lire('scripts/mv-ux-baseline.json'), liste: lire('scripts/mv-harnais-liste.mjs') };
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
const nombre = (v) => typeof v === 'number' && Number.isFinite(v);
function jouer(S) {
  let pkg = {}; try { pkg = JSON.parse(S.pkg); } catch (e) { pkg = {}; }
  t('① npm run test:ux joue le contrôle au rendu', (pkg.scripts || {})['test:ux'] === 'node scripts/mv-ux-rendu.mjs', String((pkg.scripts || {})['test:ux']));
  const iG = S.ci.indexOf('run: npm run test:gabarit'), iU = S.ci.indexOf('run: npm run test:ux');
  t('② la CI le joue sur le build, après le gabarit', iG > 0 && iU > iG, 'gabarit à ' + iG + ', test:ux à ' + iU);
  // ce que le contrôle relève, lu dans le contrôle lui-même
  const mP = S.rendu.match(/const PAGES = \[([^\]]+)\]/);
  const pages = mP ? [...mP[1].matchAll(/'([a-z]+)'/g)].map((m) => m[1]) : [];
  const iGe = S.rendu.indexOf('const GESTES = {'), jGe = S.rendu.indexOf('\n};', iGe);
  const gestes = iGe > 0 ? [...S.rendu.slice(iGe, jGe).matchAll(/'([a-z]+\.[a-z_0-9]+)': \{ sens:/g)].map((m) => m[1]) : [];
  const mH = S.rendu.match(/const HORLOGE = '([^']+)'/);
  t('③ le contrôle relève dix pages et neuf gestes', pages.length === 10 && gestes.length === 9, pages.length + ' pages, ' + gestes.length + ' gestes');
  let ref = null; try { ref = JSON.parse(S.ref); } catch (e) { ref = null; }
  t('④ la référence se lit (JSON)', !!ref);
  if (ref) {
    t('④ la référence a l’horloge du contrôle', !!mH && ref.horloge === mH[1], (ref.horloge || '(aucune)') + ' contre ' + (mH ? mH[1] : '(aucune)'));
    const manques = [];
    ['téléphone', 'ordinateur'].forEach((e) => pages.forEach((p) => { const m = ((ref.mesures || {})[e] || {})[p];
      if (!m) { manques.push(e + ' › ' + p + ' absente'); return; }
      ['c24', 'c44', 't11', 't12', 'chrome'].forEach((k) => { if (!nombre(m[k])) manques.push(e + ' › ' + p + ' › ' + k + ' = ' + JSON.stringify(m[k])); });
      ['chromeDefile', 'pouce'].forEach((k) => { if (m[k] !== null && !nombre(m[k])) manques.push(e + ' › ' + p + ' › ' + k + ' = ' + JSON.stringify(m[k])); }); }));
    t('④ la référence couvre les deux écrans × dix pages, avec des nombres', manques.length === 0, manques.slice(0, 4).join(' · '));
    const gm = gestes.filter((g) => !((ref.gestes || {}).hasOwnProperty(g)) || (ref.gestes[g] !== null && !nombre(ref.gestes[g])));
    t('④ la référence porte les neuf gestes (un nombre, ou null si la pièce manque)', gm.length === 0, gm.join(', '));
    t('④ chaque regravure dit pourquoi', Array.isArray(ref.regravures) && ref.regravures.every((r) => r && typeof r.motif === 'string' && r.motif.length > 0));
  }
  t('⑤ le contrôle pose l’horloge, puis la laisse tourner', /await page\.clock\.install\(\{ time: new Date\(HORLOGE\) \}\)/.test(S.rendu) && /await page\.clock\.resume\(\)/.test(S.rendu));
  t('⑤ il lit et écrit sa référence là où ce harnais la lit', /path\.join\(ICI, 'mv-ux-baseline\.json'\)/.test(S.rendu));
  t('⑥ il refuse de regraver une hausse sans raison écrite (--accepte)', /if \(ref && hausses\.length && !ACCEPTE\)/.test(S.rendu) && /process\.exit\(1\)/.test(S.rendu));
  const mA = S.rendu.match(/const attendus = \[([^\]]+)\]/);
  t('⑦ il garde sa contre-épreuve (des défauts posés à l’écran, huit attendus, dont une zone d’appui retirée)', /const DEFAUTS = /.test(S.rendu) && !!mA && (mA[1].match(/'/g) || []).length === 16 && /\.ck-i::after\{content:none!important\}/.test(S.rendu));
  t('⑨ une cible se mesure par sa zone d’appui, pas par sa boîte (UX-1, §467)', /window\.__mvZone = function/.test(S.rendu) && /await page\.addInitScript\(ZONE_INIT\)/.test(S.rendu)
    && /const z = window\.__mvZone\(e\); return \{ m: Math\.round\(Math\.min\(z\.w, z\.h\)\)/.test(S.rendu));
  t('⑨ un texte à 0 px (libellé caché) n’est pas compté comme petit', /if \(fs > 0\) tailles\.push\(fs\)/.test(S.rendu));
  t('⑧ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-ux0.mjs'") > 0 && S.liste.indexOf("mv-harnais-ux0.mjs --contre'") > 0);
  t('⑧ la liste ne joue pas le contrôle au rendu (build et navigateur ; il écrit sous --baseline)', S.liste.indexOf('scripts/mv-ux-rendu.mjs') < 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const avecRef = (S, f) => { const r = JSON.parse(S.ref); f(r); return Object.assign({}, S, { ref: JSON.stringify(r) }); };
  const mutants = [
    ['npm ne joue plus le contrôle au rendu', (S) => Object.assign({}, S, { pkg: S.pkg.replace('"test:ux"', '"test:ux-off"') })],
    ['la CI ne le joue plus', (S) => Object.assign({}, S, { ci: S.ci.replace('run: npm run test:ux', 'run: echo rien') })],
    ['la CI le joue avant le gabarit', (S) => Object.assign({}, S, { ci: S.ci.replace('run: npm run test:ux', 'run: echo rien').replace('run: npm run test:tutos', 'run: npm run test:ux\n        run: npm run test:tutos') })],
    ['le contrôle perd une page', (S) => Object.assign({}, S, { rendu: S.rendu.replace("'reserve', ", '') })],
    ['la référence perd une page', (S) => avecRef(S, (r) => { delete r.mesures['téléphone'].cave; })],
    ['la référence perd un geste', (S) => avecRef(S, (r) => { delete r.gestes['cave.sommaire']; })],
    ['une mesure de la référence devient un texte', (S) => avecRef(S, (r) => { r.mesures['ordinateur'].journal.t11 = '18'; })],
    ['la référence n’a plus l’horloge du contrôle', (S) => avecRef(S, (r) => { r.horloge = '2026-10-25T08:00:00Z'; })],
    ['une regravure sans motif', (S) => avecRef(S, (r) => { r.regravures = [{ date: '2026-10-26', motif: '' }]; })],
    ['le contrôle ne pose plus l’horloge', (S) => Object.assign({}, S, { rendu: S.rendu.replace('await page.clock.resume()', 'await page.waitForTimeout(0)') })],
    ['le contrôle regrave une hausse sans raison', (S) => Object.assign({}, S, { rendu: S.rendu.replace('if (ref && hausses.length && !ACCEPTE)', 'if (false)') })],
    ['le contrôle perd sa contre-épreuve', (S) => Object.assign({}, S, { rendu: S.rendu.replace('const DEFAUTS = ', 'const SANS = ') })],
    ['le contrôle remesure la boîte au lieu de la zone d’appui', (S) => Object.assign({}, S, { rendu: S.rendu.replace('const z = window.__mvZone(e); return { m: Math.round(Math.min(z.w, z.h))', 'const z = e.getBoundingClientRect(); return { m: Math.round(Math.min(z.width, z.height))') })],
    ['le contrôle ne pose plus le relevé de zone dans la page', (S) => Object.assign({}, S, { rendu: S.rendu.replace('await page.addInitScript(ZONE_INIT)', 'await page.waitForTimeout(0)') })],
    ['le contrôle recompte les textes à 0 px', (S) => Object.assign({}, S, { rendu: S.rendu.replace('if (fs > 0) tailles.push(fs)', 'tailles.push(fs)') })],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-ux0.mjs'").join("mv-harnais-uxY.mjs'") })],
    ['la liste joue le contrôle au rendu', (S) => Object.assign({}, S, { liste: S.liste.replace("  ['node scripts/mv-harnais-ux0.mjs'],", "  ['node scripts/mv-ux-rendu.mjs'],\n  ['node scripts/mv-harnais-ux0.mjs'],") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible : ' + nom + ' (' + e.message + ')'); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
