/* ═══════════════════════════════════════════════════════════════════════════
   HARNAIS PILCRB-1 — Pilotage › Cave › Les courbes
   Méthode C20 : on EXTRAIT les fonctions réelles des fichiers livrés et on les
   joue sur des décors minimaux. Aucune réécriture, aucune copie : un harnais
   qui rejoue sa propre version du code ne prouve rien sur le code livré.
   Chaque assertion est suivie de sa CONTRE-ÉPREUVE plus bas (--contre).
   ═══════════════════════════════════════════════════════════════════════════ */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');

let ok = 0, ko = 0;
const T = (nom, cond, det) => {
  if (cond) { ok++; console.log('  ✓ ' + nom); }
  else { ko++; console.log('  ✗ ' + nom + (det ? '  → ' + det : '')); }
};

/* ── Extraction : on découpe le fichier entre deux ancres réelles ────────── */
function bloc(src, debut, fin) {
  const i = src.indexOf(debut);
  if (i < 0) throw new Error('ancre introuvable : ' + debut.slice(0, 50));
  const j = src.indexOf(fin, i + debut.length);
  if (j < 0) throw new Error('fin introuvable après : ' + debut.slice(0, 50));
  return src.slice(i, j);
}

const cave = fs.readFileSync(path.join(R, 'src/cave.js'), 'utf8');
/* Lot CAVE-3 : la vue des courbes est RENTREE dans cave.js (ex-Pilotage › Cave).
   `pilo` garde son nom pour ne pas reecrire le harnais : il pointe la Cave. */
const pilo = fs.readFileSync(path.join(R, 'src/cave.js'), 'utf8');

/* ── Le décor : le socle graphique réel d'utils.js, pas un faux ─────────── */
const utils = fs.readFileSync(path.join(R, 'src/utils.js'), 'utf8');
const socle = bloc(utils, 'window._mvGraphCadre = function(w, h, o){', 'window._mvGraphVide')
            + bloc(utils, 'window.MV_GRAPH_COL = {', 'window.MV_GRAPH_TRAIT')
            + 'window.MV_GRAPH_TXT = { val: 13, axe: 11, unite: 10.5, mini: 10 };\n';

const moteur = bloc(cave, 'function _cmpEcarte(lbl, hMin, yLo, yHi){', '/* Le comparatif complet');
const vue    = bloc(pilo, 'var MV_CRB_ELEV_MAX=6;', 'function _pcrbElev(c){');

const ctx = {
  window: {}, _ML_D20_SEC: 996, _ML_MAL_FIN: 0.1,
  CAVE_VENDANGE: { analyses: [], config: {} }, PARCELLES: [],
  _escHtml: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
  _pilEsc: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
  _mvF1: n => (Math.round(n * 10) / 10).toString().replace('.', ','),
  _pcavF1: n => (n == null || isNaN(n)) ? '—' : (Math.round(n * 10) / 10).toString().replace('.', ','),
  _pcavLog: () => {},
  _pcavHasW: f => typeof ctxRef[f] === 'function',
  _vendMesD20: m => (m && m.densite != null) ? m.densite : null,
  _matJours: (d, tj) => Math.round((tj - Date.parse(d)) / 86400000),
  _matSuc: a => (a && a.val) || 0,
  _MAT_CAMP_J: 150,
  /* La palette du tableau DOIT etre celle de MV_CMP_COL : on la reprend telle
     quelle depuis pilotage.js pour que l'assertion porte sur le vrai contrat. */
  _PCRB_COL: (pilo.match(/var _PCRB_COL=(\[[^\]]*\])/)||[])[1] ? JSON.parse((pilo.match(/var _PCRB_COL=(\[[^\]]*\])/))[1].replace(/'/g,'"')) : [], MV_GRAPH_MIN: 260, MV_GRAPH_DEF: 640, MV_GRAPH_PALIER: 560
};
const ctxRef = ctx; ctx.window = ctx;
const F = new Function('ctx', `with(ctx){ ${socle}\n${moteur}\n${vue}\n
  ctx._cuvCmpEcarte = _cmpEcarte;
  return { _cmpSerie, _cmpSeries, _cmpSvg, _cmpTempSvg, _cmpVigne, _cmpEcarte,
           _pcrbElevSeries, _pcrbElevSvg, MV_CMP_MIN, MV_CMP_TMAX, MV_CRB_ELEV_MAX }; }`)(ctx);

/* ── Le décor de cuves ───────────────────────────────────────────────────── */
const J = n => new Date(Date.UTC(2026, 8, 12 + n)).toISOString().slice(0, 10);
const cuve = (nom, entree, mes) => ({ nom, date_entree: entree, parcelles: [], mesures_fa: mes });
const CUVES = [
  cuve('Vite', J(0), [
    { date: J(0), densite: 1092, temp_c: 19 }, { date: J(3), densite: 1042, temp_c: 29 },
    { date: J(6), densite: 1002, temp_c: 25 }, { date: J(8), densite: 994, temp_c: 22 }]),
  cuve('Lente', J(2), [
    { date: J(2), densite: 1090, temp_c: 12 }, { date: J(6), densite: 1086, temp_c: 12 },
    { date: J(9), densite: 1050, temp_c: 26 }, { date: J(14), densite: 995, temp_c: 23 }]),
  cuve('Jeune', J(9), [
    { date: J(9), densite: 1094, temp_c: 20 }, { date: J(11), densite: 1068, temp_c: 31 }]),
  cuve('SansJ0', '', [{ date: J(3), densite: 1090, temp_c: 20 }, { date: J(5), densite: 1050, temp_c: 25 }]),
  cuve('UnSeul', J(1), [{ date: J(1), densite: 1090, temp_c: 20 }]),
  cuve('SansTemp', J(1), [
    { date: J(1), densite: 1091 }, { date: J(5), densite: 1030 }, { date: J(9), densite: 993 }])
];

console.log('\n── LES SÉRIES ────────────────────────────────────────────────');
const r = F._cmpSeries(CUVES);
T('une cuve sans date d’encuvage est écartée', !r.S.some(s => s.nom === 'SansJ0'));
T('une cuve à un seul relevé est écartée', !r.S.some(s => s.nom === 'UnSeul'));
T('le compte des écartées est rendu, pas avalé', r.hors === 2, 'hors=' + r.hors);
T('les cuves traçables sont retenues', r.S.length === 4, 'n=' + r.S.length);

console.log('\n── LE TRI (§88b) ─────────────────────────────────────────────');
const noms = r.S.map(s => s.nom);
T('classé sur le jour du vin sec observé, pas sur la vitesse',
  noms[0] === 'Vite' && noms.indexOf('Jeune') === noms.length - 1, noms.join(' > '));
const jeune = r.S.find(s => s.nom === 'Jeune');
const vite = r.S.find(s => s.nom === 'Vite');
T('la cuve la plus RAPIDE en pts/j n’est pas en tête',
  jeune.vit > vite.vit && noms.indexOf('Jeune') > 0,
  'Jeune=' + jeune.vit.toFixed(1) + ' pts/j vs Vite=' + vite.vit.toFixed(1));
T('le jour du vin sec est OBSERVÉ, jamais interpolé', jeune.jSec === null, 'jSec=' + jeune.jSec);
T('pts/j porte son intervalle réel', vite.jDeb === 0 && vite.jFin === 8);

console.log('\n── LE J0 (§88a) ──────────────────────────────────────────────');
const lente = r.S.find(s => s.nom === 'Lente');
T('J0 = date_entree, pas le premier relevé', lente.jDeb === 0);
T('la densité de départ est celle du premier relevé après encuvage', lente.dDeb === 1090);
const avant = F._cmpSerie(cuve('Avant', J(5), [
  { date: J(2), densite: 1110 }, { date: J(5), densite: 1090 }, { date: J(9), densite: 1000 }]));
T('un relevé ANTÉRIEUR à l’encuvage est écarté', avant.dDeb === 1090, 'dDeb=' + avant.dDeb);

console.log('\n── LE TRACÉ DES DENSITÉS ─────────────────────────────────────');
const svgD = F._cmpSvg(r.S, 640);
T('le tracé sort un svg', /^<svg /.test(svgD));
T('une polyligne par cuve', (svgD.match(/<polyline/g) || []).length === 4);
T('le seuil du vin sec est écrit', svgD.includes('996 · vin sec'));
T('l’axe compte des jours, pas des dates', svgD.includes('jours depuis l’encuvage'));
T('chaque cuve porte son nom au bout', ['Vite','Lente','Jeune','SansTemp'].every(n => svgD.includes('>' + n + '</text>')));

console.log('\n── LE TRACÉ DES TEMPÉRATURES (neuf) ──────────────────────────');
const svgT = F._cmpTempSvg(r.S, 640);
T('le tracé sort un svg', /^<svg /.test(svgT));
T('la cuve SANS temp n’est pas tracée', (svgT.match(/<polyline/g) || []).length === 3,
  'polylignes=' + (svgT.match(/<polyline/g) || []).length);
T('l’axe est en degrés', svgT.includes('>°C</text>'));
T('même rail de jours que la densité', svgT.includes('jours depuis l’encuvage'));
T('un relevé ≥ 30 °C porte un point', svgT.includes('r="3.2"'));
T('l’aria compte les relevés chauds', /relev\u00e9s \u00e0 30 degr\u00e9s ou plus/.test(svgT), svgT.match(/aria-label="([^"]*)"/)?.[1]);

/* ★★★ L'INVARIANT N'EST PAS UN COMPTE, C'EST UN ÉCART (§87b). On n'exige pas
   « N noms écrits » — le code a le droit d'avoir raison autrement. On exige
   que deux noms ne se marchent jamais dessus. */
console.log('\n── L’ÉCARTEMENT DES NOMS (§88d) ──────────────────────────────');
function ysNoms(svg, liste) {
  return [...svg.matchAll(/<text x="[\d.]+" y="([\d.]+)" font-size="10" font-weight="600"[^>]*>([^<]+)<\/text>/g)]
    .filter(m => liste.includes(m[2])).map(m => parseFloat(m[1])).sort((a, b) => a - b);
}
const memeFin = [
  cuve('A', J(0), [{ date: J(0), densite: 1090 }, { date: J(8), densite: 994 }]),
  cuve('B', J(0), [{ date: J(0), densite: 1092 }, { date: J(8), densite: 994 }]),
  cuve('C', J(0), [{ date: J(0), densite: 1088 }, { date: J(8), densite: 994 }])
];
const sMF = F._cmpSeries(memeFin).S;
const ys = ysNoms(F._cmpSvg(sMF, 640), ['A', 'B', 'C']);
let ecartMin = Infinity;
for (let i = 1; i < ys.length; i++) ecartMin = Math.min(ecartMin, ys[i] - ys[i - 1]);
T('trois cuves finissant à la MÊME densité écrivent trois noms distincts', ys.length === 3, 'n=' + ys.length);
T('aucun chevauchement : écart ≥ 11 px', ecartMin >= 10.9, 'écart min = ' + ecartMin);

console.log('\n── L’ÉLEVAGE : UN VRAI AXE DE TEMPS ──────────────────────────');
ctx.window._mlMesMalo = id => ({
  a: [{ date: '2025-11-20', val: 2.1 }, { date: '2026-02-27', val: 0.55 }, { date: '2026-06-18', val: 0.05 }],
  b: [{ date: '2025-12-02', val: 1.9 }, { date: '2026-03-28', val: 0.14 }],
  c: [{ date: '2026-01-05', val: 1.4 }],
  d: [{ date: '2025-11-20', val: 2.0 }, { date: '2026-04-01', val: 0.3 }]
}[id] || []);
const CTX = { enElevage: [
  { id: 'a', nom: 'Alpha', millesime: 2025, date_entonnage: '2025-11-08' },
  { id: 'b', nom: 'Beta', millesime: 2025, date_entonnage: '2025-11-15' },
  { id: 'c', nom: 'Gamma', millesime: 2025, date_entonnage: '2025-11-15' },
  { id: 'd', nom: 'Delta', millesime: 2025, date_entonnage: '' }
] };
const E = F._pcrbElevSeries(CTX);
T('une cuvée à une seule analyse est écartée', !E.some(x => x.nom.startsWith('Gamma')));
T('une cuvée SANS date d’entonnage est écartée (pas de repli sur le 1er relevé)',
  !E.some(x => x.nom.startsWith('Delta')), E.map(x => x.nom).join(', '));
T('les cuvées traçables sont retenues', E.length === 2, 'n=' + E.length);
T('M0 est l’entonnage : la 1re analyse est APRÈS zéro', E[0].pts[0].m > 0);
/* ★★ Ce que _pcavMaloCourbe ne peut pas dire : l'écart RÉEL entre analyses. */
const a = E.find(x => x.nom.startsWith('Alpha'));
T('l’abscisse est le mois réel, pas le rang de l’analyse',
  Math.abs(a.pts[1].m - 3.4) < 0.4 && Math.abs(a.pts[2].m - 7.2) < 0.4,
  a.pts.map(p => 'M' + p.m.toFixed(1)).join(' '));
const svgE = F._pcrbElevSvg(E, 640);
T('le trait est TIRETÉ : entre deux analyses, personne n’a mesuré', svgE.includes('stroke-dasharray="5 3"'));
T('le seuil de malo achevée est écrit', svgE.includes('malo achevée'));
T('l’axe est en mois depuis l’entonnage', svgE.includes('mois depuis l’entonnage'));

console.log('\n── LA GARDE DES JETONS (§86b, transposée) ────────────────────');
const cssPil = bloc(pilo, "function _pcavInjectCss(){", "var st=document.createElement('style');");
const declares = new Set([...fs.readFileSync(path.join(R, 'src/styles.css'), 'utf8')
  .matchAll(/(--[a-z0-9-]+)\s*:/g)].map(m => m[1]));
const invoques = new Set([...(cssPil + svgD + svgT + svgE).matchAll(/var\((--[a-z0-9-]+)/g)].map(m => m[1]));
const manquants = [...invoques].filter(v => !declares.has(v));
T('tout var(--x) des courbes est déclaré dans styles.css',
  manquants.length === 0, manquants.join(', '));

console.log('\n── LES COURBES SONT UN ONGLET DU MILLESIME (lot CAVE-3) ────────');
const idx = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
T('l’onglet Les courbes est déclaré dans la barre du millésime', /id="ml-tab-crb" onclick="_mlSetTab\('crb'\)"/.test(idx));
T('renderCaveMillesime pose les courbes après le HTML (_pcrbPose)', /_mlTab==='crb'\)\{[\s\S]{0,400}_pcrbPose\(\)/.test(pilo));
T('la famille de graphes est oubliée dès qu’on quitte les courbes', /_mvGraphOublier\('#pcrb-g-'\)/.test(pilo));
T('les icônes existent dans le sprite', (() => {
  const sprite = new Set([...fs.readFileSync(path.join(R, 'index.html'), 'utf8')
    .matchAll(/id="ic-([a-z0-9-]+)"/g)].map(m => m[1]));
  return ['chrono', 'raisin', 'barrique', 'graphique', 'thermometre', 'bouteille'].every(n => sprite.has(n));
})());

console.log('\n── LE PONT VERS PILOTAGE ─────────────────────────────────────');
for (const [nom, cible] of [['_cuvCmpSeries', '_cmpSeries'], ['_cuvCmpSvg', '_cmpSvg'],
     ['_cuvCmpTempSvg', '_cmpTempSvg'], ['_cuvCmpVigne', '_cmpVigne']])
  T('window.' + nom + ' expose ' + cible,
    new RegExp('window\\.' + nom + '\\s*=\\s*' + cible + ';').test(cave));
T('_cmpSvg n’est PAS exposé sous le préfixe _cmp (déjà pris par les campagnes)',
  !/window\._cmpSvg\s*=/.test(cave) && /window\._cmpVisibles/.test(fs.readFileSync(path.join(R, 'src/reglages.js'), 'utf8')));
T('pilotage n’appelle jamais _vendMatSvg nue (signature byP)',
  !/window\._vendMatSvg\s*\(/.test(pilo) && /window\._cuvMatSvg\s*\(/.test(pilo));
T('la vue oublie sa famille de graphes avant de la reposer',
  /_mvGraphOublier\s*&&\s*window\._mvGraphOublier\('#pcrb-g-'\)|_mvGraphOublier\('#pcrb-g-'\)/.test(pilo));

/* ═══ LES CONTRE-ÉPREUVES ═══════════════════════════════════════════════════
   Chacune réintroduit un défaut corrigé et EXIGE que le harnais rougisse.
   Un filet qui reste vert sur du code saboté ne prouve rien (§68). */
if (CONTRE) {
  console.log('\n══ CONTRE-ÉPREUVES ══════════════════════════════════════════');
  let n = 0, rouges = 0;
  const C = (nom, fn) => {
    n++;
    let rouge = false;
    try { rouge = !fn(); } catch (e) { rouge = true; }
    if (rouge) { rouges++; console.log('  ✓ rouge — ' + nom); }
    else console.log('  ✗ RESTE VERTE — ' + nom);
  };
  C('trier sur la vitesse remettrait « Jeune » en tête', () => {
    const t = r.S.slice().sort((a, b) => (b.vit || 0) - (a.vit || 0));
    return t[0].nom !== 'Jeune';
  });
  C('J0 = premier relevé au lieu de date_entree fausserait le départ', () => {
    const p = (CUVES[1].mesures_fa || []).slice().sort((a, b) => a.date < b.date ? -1 : 1);
    return p[0].densite !== lente.dDeb || lente.jDeb !== 0;
  });
  C('accepter un relevé antérieur à l’encuvage ferait partir de 1110', () => avant.dDeb === 1110);
  C('ne pas écarter les cuves sans J0 donnerait 6 séries', () => r.S.length === 6);
  C('avaler le compte des écartées', () => r.hors === 0);
  C('tracer une cuve sans température donnerait 4 polylignes', () =>
    (svgT.match(/<polyline/g) || []).length === 4);
  C('sans écartement, trois noms tomberaient au même y', () => {
    const yBruts = sMF.map(s => s.dFin);
    return new Set(yBruts).size === 3;
  });
  C('un repli sur le 1er relevé ferait entrer « Delta » sans entonnage', () =>
    E.some(x => x.nom.startsWith('Delta')));
  C('espacer les analyses par RANG effacerait l’écart réel', () =>
    Math.abs(a.pts[1].m - 1) < 0.4);
  C('un trait plein laisserait croire à un suivi continu', () =>
    !svgE.includes('stroke-dasharray="5 3"'));
  C('la sous-nav insérant s[1] brut afficherait « chrono Ce qui presse »', () =>
    /\+s\[1\]\+' '\+/.test(navBloc));
  C('exposer window._cmpSvg entrerait en collision avec les campagnes', () =>
    /window\._cmpSvg\s*=/.test(cave));
  console.log('\n  ' + rouges + '/' + n + ' contre-épreuves rouges'
    + (rouges === n ? ' ✅' : ' ❌ — une contre-épreuve verte ne prouve rien'));
  if (rouges !== n) ko++;
}

console.log('\n═════════════════════════════════════════════════════════════');
console.log('  ' + ok + ' assertions vertes, ' + ko + ' rouges');
process.exit(ko ? 1 : 0);
