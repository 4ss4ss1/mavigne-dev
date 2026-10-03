#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────────────
   HARNAIS SPARK-1 (§214) — LA PETITE COURBE D'UN CHIFFRE
   Lancer :  node scripts/mv-harnais-spark.mjs            (scénarios)
             node scripts/mv-harnais-spark.mjs --contre   (contre-épreuves)
   Méthode §6b (harnais INTÉGRÉ) : `_mvGraphSpark` est extrait de src/utils.js
   AVEC le moteur qu'il appelle (_mvGraphCadre, _mvGraphSvg, _mvEsc et les
   constantes MV_GRAPH_*), `_pilSparkCadence` de src/pilotage.js ; seul
   `_planTeamCadence` est doublé — avec SA signature (deux Date) et en
   enregistrant ses appels, pour prouver la fenêtre de 7 jours.
   Ce qui est prouvé : la bande commune ±30 % (le point se colle au bord), le
   trou qui coupe la courbe (jamais un zéro), moins de deux mesures = rien, la
   couleur (favorable / à moins de 3 % / défavorable), la référence au milieu,
   l'aria échappé UNE fois ; la série de cadence : 14 points, fenêtres de 7 jours
   finissant chaque jour jusqu'à aujourd'hui, écart à la cadence affichée.
   ───────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const UT = readFileSync('src/utils.js', 'utf8');
const PIL = readFileSync('src/pilotage.js', 'utf8');

function apres(src, debut) {   // de `debut` jusqu'a l'accolade fermante appariee (+ le ; qui suit)
  const i = src.indexOf(debut);
  if (i < 0) throw new Error('introuvable : ' + debut);
  let j = src.indexOf('{', i), n = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') n++;
    else if (src[k] === '}') { n--; if (n === 0) { let e = k + 1; if (src[e] === ';') e++; return src.slice(i, e); } }
  }
  throw new Error('accolades : ' + debut);
}
function ligne(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); return src.slice(i, src.indexOf('\n', i)); }

const RealDate = Date;
const FIXED = new RealDate('2026-06-16T10:00:00').getTime();
function FakeDate(...a) { return a.length ? new RealDate(...a) : new RealDate(FIXED); }
FakeDate.prototype = RealDate.prototype; FakeDate.now = () => FIXED; FakeDate.parse = RealDate.parse; FakeDate.UTC = RealDate.UTC;
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

function charger(ut, pil) {
  const appels = [];
  const ctx = { console, Math, String, Number, Array, isFinite, Date: FakeDate, appels,
    _planTeamCadence: (deb, fin) => { appels.push([iso(deb), iso(fin)]); const f = iso(fin);
      if (f === '2026-06-10') return { cadence: 0 };           // fenetre sans jour travaille
      return { cadence: f >= '2026-06-12' ? 45 : 60 }; } };
  ctx.window = ctx;
  vm.createContext(ctx);
  const code = [ligne(ut, 'var MV_GRAPH_MIN'), ligne(ut, 'var MV_GRAPH_PALIER'),
    apres(ut, 'window.MV_GRAPH_COL = {'), ligne(ut, 'window.MV_GRAPH_TXT ='), ligne(ut, 'window.MV_GRAPH_TRAIT ='),
    apres(ut, 'window._mvGraphCadre = function('), apres(ut, 'function _mvEsc('), apres(ut, 'window._mvGraphSvg = function('),
    ligne(ut, 'window.MV_SPARK_BANDE ='), apres(ut, 'window._mvGraphSpark = function('), apres(pil, 'function _pilSparkCadence(')].join('\n');
  vm.runInContext(code, ctx, { filename: 'spark-extrait.js' });
  return ctx;
}

function scenarios(ut, pil, journal) {
  let ok = 0, ko = 0;
  const t = (nom, cond, det) => { if (cond) { ok++; if (journal) console.log('  \x1b[32m✓\x1b[0m ' + nom); }
    else { ko++; if (journal) console.log('  \x1b[31m✗\x1b[0m ' + nom + (det != null ? '\n      → ' + det : '')); } };
  let X; try { X = charger(ut, pil); } catch (e) { t('les fonctions s’extraient et s’exécutent', false, e.message); return { ok, ko }; }
  try {
    const S = X._mvGraphSpark;
    const v14 = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26];
    const s1 = S(v14, { aria: 'Cadence <b>"x"</b> & co' });
    t('14 écarts : une seule courbe (1 M, 13 L), cadre 96 × 34', (s1.match(/[ML]\d/g) || []).length === 14 && (s1.match(/M\d/g) || []).length === 1 && s1.includes('viewBox="0 0 96 34"'), s1.slice(0, 120));
    t('l’aria est échappé une fois, jamais deux', s1.includes('aria-label="Cadence &lt;b&gt;&quot;x&quot;&lt;/b&gt; &amp; co"') && !s1.includes('&amp;amp;'));
    const ys = s => [...s.matchAll(/[ML][\d.]+ ([\d.]+)/g)].map(m => +m[1]);
    const y1 = ys(S([80, -80], {}));
    t('bande ±30 % : +80 % se colle au bord haut (4), −80 % au bord bas (30)', y1[0] === 4 && y1[1] === 30, JSON.stringify(y1));
    const y2 = ys(S([30, 0, -30], {}));
    t('la bande est la même pour tous : +30 % = bord, 0 = milieu (17)', y2[0] === 4 && y2[1] === 17 && y2[2] === 30, JSON.stringify(y2));
    t('la référence, en pointillé, au milieu', /<line[^>]*y1="17\.0"[^>]*stroke-dasharray/.test(s1));
    const s3 = S([1, 2, null, 3, 4], {});
    t('un jour sans mesure coupe la courbe : deux tracés', (s3.match(/M\d/g) || []).length === 2, s3);
    t('moins de deux mesures : rien du tout (pas de ligne plate)', S([5], {}) === '' && S([null, 4, null], {}) === '' && S([], {}) === '' && S(null) === '');
    const col = s => (s.match(/<circle[^>]*fill="([^"]+)"/) || [])[1];
    t('défavorable (sous la référence quand le bas est mauvais) : orange', col(S([0, -10], { mauvais: 'bas' })) === 'var(--orange)');
    t('favorable : vert', col(S([0, 10], { mauvais: 'bas' })) === 'var(--vert-med)' && col(S([0, -10], { mauvais: 'haut' })) === 'var(--vert-med)');
    t('à moins de 3 % de la référence : vert, quel que soit le sens', col(S([0, -2], { mauvais: 'bas' })) === 'var(--vert-med)');
    t('aucun texte dans la petite courbe, aucun NaN', !/<text|NaN|undefined/.test(s1));

    // la serie de cadence
    const m = { cadH: 50, estim: false };
    X.appels.length = 0;
    const sc = X._pilSparkCadence(m);
    t('cadence : 14 points', Array.isArray(sc) && sc.length === 14, sc && sc.length);
    t('chaque point = 7 jours finissant ce jour-là (début = fin − 6)', X.appels.length === 14 && X.appels.every(([a, b]) => (new RealDate(b + 'T12:00:00') - new RealDate(a + 'T12:00:00')) / 86400000 === 6), JSON.stringify(X.appels[0]));
    t('la dernière fenêtre finit aujourd’hui, la première il y a 13 jours', X.appels[13][1] === '2026-06-16' && X.appels[0][1] === '2026-06-03', JSON.stringify([X.appels[0][1], X.appels[13][1]]));
    t('écart à la cadence affichée : 45 h/j contre 50 = −10 %, 60 = +20 %', sc && Math.abs(sc[13] + 10) < 1e-9 && Math.abs(sc[0] - 20) < 1e-9, sc && JSON.stringify([sc[0], sc[13]]));
    t('une fenêtre sans jour travaillé est un trou (null), pas −100 %', sc && sc[7] === null, sc && sc[7]);
    t('cadence estimée, nulle ou sans planning : pas de courbe', X._pilSparkCadence({ cadH: 50, estim: true }) === null && X._pilSparkCadence({ cadH: 0 }) === null && X._pilSparkCadence(null) === null);
    const t0 = X._planTeamCadence; X._planTeamCadence = undefined;
    t('planning absent : pas de courbe, sans planter', X._pilSparkCadence(m) === null); X._planTeamCadence = t0;
    // epinglage : le KPI appelle bien la serie et la petite courbe
    t('le KPI Cadence appelle _pilSparkCadence puis _mvGraphSpark', /_pilSparkCadence\(m\)[\s\S]{0,80}_mvGraphSpark\(_spC/.test(pil));
  } catch (e) { t('les scénarios s’exécutent sans planter', false, e.stack); }
  return { ok, ko };
}

console.log('\n\x1b[1mMA VIGNE — Harnais SPARK-1 · ' + (CONTRE ? 'contre-épreuves' : 'scénarios') + '\x1b[0m');
if (!CONTRE) { const r = scenarios(UT, PIL, true); console.log('\n  ' + r.ok + ' vertes, ' + r.ko + ' rouges\n'); process.exit(r.ko ? 1 : 0); }
const DEFAUTS = [
  ['utils', 'la bande n’est plus bornée', 'var k = Math.max(-B, Math.min(B, e));', 'var k = e;'],
  ['utils', 'un trou ne coupe plus la courbe', "if(!(typeof e === 'number' && isFinite(e))){ ouvert = false; continue; }", "if(!(typeof e === 'number' && isFinite(e))){ continue; }"],
  ['utils', 'le « à moins de 3 % » disparaît', 'var col = (Math.abs(eL) < 3 || !mauvais)', 'var col = (!mauvais)'],
  ['utils', 'une seule mesure trace une ligne', 'if(nOk < 2 || n < 2) return', 'if(nOk < 1 || n < 2) return'],
  ['pil', 'la fenêtre passe à 8 jours', 'fin.getDate()-6)', 'fin.getDate()-7)'],
  ['pil', 'l’écart oublie la référence', '((v-m.cadH)/m.cadH*100)', '(v)'],
  ['pil', 'un jour sans mesure compte zéro', 'var v=(c&&c.cadence>0)?c.cadence:null;', 'var v=(c&&c.cadence>0)?c.cadence:0;'],
];
let rougit = 0;
for (const [f, nom, a, b] of DEFAUTS) {
  const src = f === 'utils' ? UT : PIL, n = src.split(a).length - 1;
  if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m défaut non injecté (' + n + ') : ' + nom); continue; }
  const r = f === 'utils' ? scenarios(UT.replace(a, b), PIL, false) : scenarios(UT, PIL.replace(a, b), false);
  if (r.ko > 0) { rougit++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + '\x1b[2m  (' + r.ko + ' rouge' + (r.ko > 1 ? 's' : '') + ')\x1b[0m'); }
  else console.log('  \x1b[31m✗\x1b[0m MUET : ' + nom);
}
console.log('\n  ' + rougit + '/' + DEFAUTS.length + ' contre-épreuves rougissent\n');
process.exit(rougit === DEFAUTS.length ? 0 : 1);
