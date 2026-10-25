/* ───────────────────────────────────────────────────────
   HARNAIS — CAVE-FIX-1 (§448) : LA PART DES ANGES D'UN JEUNE MILLÉSIME SUR SA PÉRIODE RÉELLE
   Lancer :          node scripts/mv-harnais-cavefix1.mjs
   Contre-épreuves : node scripts/mv-harnais-cavefix1.mjs --contre

   POURQUOI IL EXISTE
   Audit du rangement (§439, défaut C1) : _pcavAnges écrivait « %/an » un pourcentage mesuré sur douze mois glissants
   sans le ramener à l'année — un millésime entonné il y a trois mois n'a que trois mois d'ouillages : le chiffre sortait
   environ quatre fois trop bas. Ce harnais EXÉCUTE les vraies _pcavAnges et _pcavAngesCard (cave.js) sur des ouillages
   datés : millésime ancien (la période est l'année, rien ne change), millésime jeune (période réelle et équivalent
   annuel), tout jeune (pas d'extrapolation), sans date d'entonnage (le premier ouillage borne), opération mixte.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { cave: lire('src/cave.js'), utils: lire('src/utils.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
function corps(src, nom) { const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction absente : ' + nom); const j = src.indexOf('{', i); let p = 0, k = j; for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
const AUJ = '2026-10-23';
function monter(S, ops, cuvees) {
  const c = { window: { CAVE_ELEVAGE: { operations: ops } }, CAVE_ELEVAGE: { operations: ops }, Math, Date, String, parseFloat, parseInt, isNaN, Number, Object,
    _mvToday: () => AUJ, _mvISO: () => '2025-10-23', _pcavMilKey: (m) => (m == null || m === '') ? '?' : String(m),
    _caveFutsL: (x) => (x.tonneaux || []).reduce((s, tt) => s + (tt.nb || 0) * 228, 0),
    _pcavF1: (v) => (Math.round(v * 10) / 10).toString().replace('.', ','), _escHtml: (x) => String(x), _mvIcon: () => '',
    _pcavCard: (ic, col, titre, stat, corpsH) => '<card>' + stat + '|' + corpsH + '</card>' };
  vm.createContext(c); vm.runInContext(corps(S.cave, '_pcavAnges') + '\n' + corps(S.cave, '_pcavAngesCard'), c);
  const a = c._pcavAnges({ enElevage: cuvees });
  return { a, carte: c._pcavAngesCard({ anges: a }) };
}
const ou = (date, L, id) => ({ type: 'ouillage', date, data: { vol_total_L: L }, cuvees_ids: [id] });
function jouer(S) {
  const cuvees = [
    { id: 'v25', millesime: 2025, tonneaux: [{ nb: 10 }], date_entonnage: '2025-10-03' },   // en fût depuis plus d'un an
    { id: 'v26', millesime: 2026, tonneaux: [{ nb: 10 }], date_entonnage: '2026-07-25' },   // trois mois (91 jours)
    { id: 'v27', millesime: 2027, tonneaux: [{ nb: 2 }], date_entonnage: '2026-10-10' },    // quatorze jours
    { id: 'vx', millesime: 2024, tonneaux: [{ nb: 4 }] },                                   // sans date d'entonnage
  ];
  const ops = [ou('2025-12-01', 30, 'v25'), ou('2026-06-01', 30, 'v25'), ou('2026-08-15', 20, 'v26'), ou('2026-09-30', 20, 'v26'),
    ou('2026-10-20', 3, 'v27'), ou('2026-04-25', 10, 'vx'), ou('2026-09-01', 10, 'vx'),
    { type: 'ouillage', date: '2026-10-01', data: { vol_total_L: 5 }, cuvees_ids: ['v25', 'v26'] }];
  const { a, carte } = monter(S, ops, cuvees);
  const L = (m) => (a.lignes || []).find((x) => x.mil === m) || {};
  const per = (x) => (x.L / 100) / (x.loge + x.L / 100) * 100;
  const p25 = per({ L: 60, loge: 22.8 }), p26 = per({ L: 40, loge: 22.8 });
  t('① millésime en fût depuis plus d’un an : la période est l’année, même chiffre qu’avant', L('2025').annee === true && Math.abs(L('2025').pctAn - p25) < 1e-9, JSON.stringify(L('2025')));
  t('② millésime entonné le 25 juillet : la période court du 25 juillet à aujourd’hui (91 jours)', L('2026').debut === '2026-07-25' && L('2026').jours === 91 && L('2026').annee === false, JSON.stringify(L('2026')));
  t('② son pourcentage de la période, et l’équivalent annuel = × 365 / 91', Math.abs(L('2026').pctPeriode - p26) < 1e-9 && Math.abs(L('2026').pctAn - p26 * 365 / 91) < 1e-9);
  t('② la carte le dit : « … % en 3 mois » et « soit env. … %/an »', /1,7 % en 3 mois<small>soit env\. 6,9 %\/an<\/small>/.test(carte), (carte.match(/1,7[^<]*<small>[^<]*/) || [''])[0]);
  t('③ quatorze jours d’élevage : le pourcentage des jours, sans extrapolation', L('2027').jours === 14 && L('2027').pctAn === null && /% en 14 j</.test(carte));
  t('④ sans date d’entonnage, le premier ouillage de la fenêtre borne la période', L('2024').debut === '2026-04-25' && L('2024').jours === 182, JSON.stringify(L('2024')));
  t('⑤ une opération sur deux millésimes compte au total, pas dans une ligne (règle d’origine)', a.nonVentile === 1 && Math.abs(a.hlPerdu - 1.28) < 1e-9);
  t('⑥ la fiche « i » explique la période réelle et l’équivalent annuel', /moins d\\u2019un an|moins d’un an/.test(S.utils.slice(S.utils.indexOf("'cave.anges':"), S.utils.indexOf("'cave.anges':") + 2000)) && /équivalent annuel/.test(S.utils.slice(S.utils.indexOf("'cave.anges':"), S.utils.indexOf("'cave.anges':") + 2000)));
  t('⑥ la nouveauté le dit en « À vérifier » (10.05, niv 2)', /\{ v: '10\.05', d: '[^']*', items: \[\s*\{ niv: 2, pour: \['admin'\], emoji: 'sablier'/.test(S.utils));
  t('⑦ la liste des harnais joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-cavefix1.mjs'") > 0 && S.liste.indexOf("mv-harnais-cavefix1.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const R = (S, a, b) => { if (S.cave.split(a).length !== 2) throw new Error('ancre : ' + a.slice(0, 50)); return Object.assign({}, S, { cave: S.cave.split(a).join(b) }); };
  const mutants = [
    ['le « %/an » revient sans ramener à l’année', (S) => R(S, "pctAn:(pctPer==null)?null:(annee?pctPer:(jours>=30?pctPer*365/jours:null)),", 'pctAn:pctPer,')],
    ['la date d’entonnage est ignorée', (S) => R(S, "var debut=entreeDe[k] || p.prem || d0;", 'var debut=d0;')],
    ['le premier ouillage ne borne plus', (S) => R(S, "var debut=entreeDe[k] || p.prem || d0;", 'var debut=entreeDe[k] || d0;')],
    ['l’extrapolation dès le premier jour', (S) => R(S, '(jours>=30?pctPer*365/jours:null)', 'pctPer*365/jours')],
    ['un jeune millésime affiché « %/an »', (S) => R(S, "      if(x.annee) pct=_pcavF1(x.pctPeriode)+' %/an';", "      if(true) pct=_pcavF1(x.pctPeriode)+' %/an';")],
    ['l’équivalent annuel disparaît de la carte', (S) => R(S, "(x.pctAn!=null?'<small>soit env. '+_pcavF1(x.pctAn)+' %/an</small>':'')", "''")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-cavefix1.mjs'").join("mv-harnais-cavefixX.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m non injecté (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + ' (' + ko + ')'); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
