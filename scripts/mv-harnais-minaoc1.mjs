// HARNAIS — MINAOC-1 (§385) : le minimum de maturité de l'appellation — réglé dans Réglages › Appellations, tracé dans
// les Maturités (le trait rouge, la légende, la phrase du haut, la ligne « Minimum » de la fiche).
//   node scripts/mv-harnais-minaoc1.mjs           → doit être vert
//   node scripts/mv-harnais-minaoc1.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue les VRAIES fonctions : _matSynth, _matMin, _matOrdreHtml, _matMinRp, _vendAocDe (cuvier.js) ; window._aocSetMin et
// _aocPlafondsHtml (reglages.js). Bouchons : la fenêtre de saisie (openPrompt) répond tout de suite ; la couleur d'une
// parcelle est une table ; l'enregistrement et le toast sont des marques ; les petits outils de l'appellation (_aocAll,
// _aocTrouve, _aocMax…) sont réécrits ici en une ligne chacun.
import fs from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const SAIN = { cuv: fs.readFileSync('src/cuvier.js', 'utf8'), reg: fs.readFileSync('src/reglages.js', 'utf8'),
  css: fs.readFileSync('src/styles.css', 'utf8'), utils: (fs.readFileSync('src/utils.js', 'utf8') + '\n' + fs.readFileSync('src/whats-new.js', 'utf8')) };
function bornes(src, nom) {
  const m = [...src.matchAll(new RegExp('^function ' + nom + '\\s*\\(', 'gm'))];
  if (m.length !== 1) throw new Error(nom + ' : ' + m.length + ' définition(s)');
  let d = 0, q = null;
  for (let j = src.indexOf('{', m[0].index); j < src.length; j++) {
    const ch = src[j];
    if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
    if (ch === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (ch === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j) + 1; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { q = ch; continue; }
    if (ch === '{') d++;
    else if (ch === '}' && --d === 0) return [m[0].index, j + 1];
  }
  throw new Error('accolade non fermée : ' + nom);
}
const fn = (src, nom) => { const [a, b] = bornes(src, nom); return src.slice(a, b); };
const CUV = ['_matJours', '_matLarge', '_matFour', '_matSynth', '_matUnite', '_matGros', '_matPetit', '_matJj', '_matAge', '_matVit', '_matVin', '_matPlur',
  '_matVuesHtml', '_matOrdreHtml', '_matSuc', '_vendCfg', '_matMin', '_matMinRp', '_vendAocDe', '_vendAocList', '_vendAocNorm'];

function jouer(S) {
  const L = [];
  const t = (nom, ok, detail) => L.push({ nom, ok: !!ok, detail: ok ? '' : (detail || '') });
  let code = S.cuv.slice(S.cuv.indexOf('var _matFen'), S.cuv.indexOf('function _matNorm')) + '\n';
  try {
    for (const f of CUV) code += fn(S.cuv, f) + '\n';
    code += fn(S.reg, '_aocPlafondsHtml') + '\n';
    const i = S.reg.indexOf('window._aocSetMin=function'); if (i < 0) throw new Error('window._aocSetMin absent');
    code += S.reg.slice(i, S.reg.indexOf('\n};', i) + 3) + '\n';
  } catch (e) { t('les fonctions du minimum existent', false, e.message); return L; }
  code += "var _aocMilSel = 2026, _aocOuvert = '';\n";
  const toasts = [], sauves = [], prompts = [];
  const GC = { nom: 'Gevrey-Chambertin', rdt_max_hist: [], sucre_min: { r: 180 } }, BG = { nom: 'Bourgogne', rdt_max_hist: [] };
  const A = (p, d, v) => ({ id: p + d, parcelle: p, date: d, mode: 'sucre', val: v });
  const ctx = {
    ADMIN: true, REPONSE: '',
    CONFIG: { appellations: [GC, BG] },
    PARCELLES: [{ nom: 'Les Charmes', surface: '1.0', appellation: 'Gevrey-Chambertin' }, { nom: 'Champ Perdrix', surface: '0.5', appellation: 'gevrey-chambertin' },
      { nom: 'Clos Blanc', surface: '0.8', appellation: 'Bourgogne' }, { nom: 'Jamais', surface: '0.3', appellation: 'Gevrey-Chambertin' }, { nom: 'Aux Murgers', surface: '0.4', appellation: 'Gevrey-Chambertin' }],
    CAVE_VENDANGE: { config: { sucre_par_degre: 16.83 }, recoltes: [],
      analyses: [A('Les Charmes', '2026-09-01', 170), A('Les Charmes', '2026-09-06', 175), A('Champ Perdrix', '2026-08-30', 178), A('Champ Perdrix', '2026-09-05', 185), A('Clos Blanc', '2026-09-06', 190), A('Aux Murgers', '2026-09-06', 190)] },
    document: { getElementById: () => null },
    _mvToday: () => '2026-09-08', _mvF1: (x) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ','),
    _escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    _escAttr: (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;'),
    _mvIcon: (n) => '<svg data-ic="' + n + '"></svg>', canWrite: () => true, isAdmin: () => ctx.ADMIN,
    _parcCoul: (n) => (n === 'Clos Blanc' ? 'b' : 'r'), _anaSpd: (a, spd) => spd || 16.83,
    _aocAll: () => ctx.CONFIG.appellations, _aocNorm: (s) => String(s || '').trim().toLowerCase(),
    _aocTrouve: (nom) => ctx.CONFIG.appellations.filter((a) => a.nom.toLowerCase() === String(nom).toLowerCase())[0] || null,
    _aocMils: () => [2026], _aocParcelles: () => [1, 2], _aocMax: () => 40, _aocAtt: (s) => s, _aocEsc: (s) => s, _aocNb: (x) => String(x),
    _aocSave: () => sauves.push(1), _aocRenderCard() {}, showToast: (m) => toasts.push(m),
    openPrompt: (o) => { prompts.push(o); o.cb(ctx.REPONSE); },
  };
  ctx.window = ctx; ctx.matchMedia = () => ({ matches: false });
  vm.createContext(ctx);
  try { vm.runInContext(code, ctx, { filename: 'minaoc1-extrait.js' }); } catch (e) { t('les fonctions extraites se chargent', false, e.message); return L; }

  /* ══ 1. L'APPELLATION SE LIT SUR LA PARCELLE ══ */
  const r = ctx._matSynth(7, null, '2026');
  t('la parcelle connaît son appellation (lue sur elle, pas sur son nom ; la casse ne compte pas)', r.tous['Les Charmes'].aoc === 'Gevrey-Chambertin' && r.tous['Champ Perdrix'].aoc === 'Gevrey-Chambertin', r.tous['Les Charmes'].aoc + ' / ' + r.tous['Champ Perdrix'].aoc);
  t('le minimum suit la couleur : un rouge de Gevrey a 180, un blanc de Bourgogne sans minimum n’a rien', ctx._matMin(r.tous['Les Charmes']) === 180 && ctx._matMin(r.tous['Clos Blanc']) === null);
  /* ══ 2. L'ORDRE DE MATURITÉ ══ */
  const h = ctx._matOrdreHtml(r, 16.83, { r: null, b: null }, true);
  t('un trait rouge sur chaque parcelle qui a un minimum (trois rouges de Gevrey mesurés)', (h.match(/class="mn" style=/g) || []).length === 3, (h.match(/class="mn" style=/g) || []).length + ' trait(s)');
  t('la légende le nomme', /<i class="mn"><\/i>minimum de l’appellation/.test(h));
  t('la phrase du haut compte les parcelles sous leur minimum', /<b class="att">1 parcelle sous le minimum de son appellation\.<\/b>/.test(h));
  /* ══ 3. LA LIGNE « MINIMUM » DE LA FICHE ══ */
  const rp1 = ctx._matMinRp(r.tous['Les Charmes'], 16.83), rp2 = ctx._matMinRp(r.tous['Champ Perdrix'], 16.83), rp3 = ctx._matMinRp(r.tous['Jamais'], 16.83);
  t('sous le minimum : ce qu’il manque', /Minimum · Gevrey-Chambertin<small>180 g\/L, cahier des charges<\/small>/.test(rp1) && /class="att">à 5 g\/L</.test(rp1), rp1);
  t('au-dessus : depuis quand', /class="ok">atteint le 05\/09</.test(rp2), rp2);
  t('sans mesure : il le dit ; sans minimum : rien', /pas de mesure/.test(rp3) && ctx._matMinRp(r.tous['Clos Blanc'], 16.83) === '');
  /* ══ 4. LE RÉGLAGE ══ */
  ctx.REPONSE = '182'; ctx._aocSetMin('Gevrey-Chambertin', 'r');
  t('le minimum des rouges se pose, s’enregistre et se dit', GC.sucre_min.r === 182 && sauves.length === 1 && /minimum des rouges : 182 g\/L/.test(toasts[toasts.length - 1]));
  ctx.REPONSE = '50'; ctx._aocSetMin('Gevrey-Chambertin', 'r');
  t('hors de 100 à 300 g/L : refusé, rien ne change', GC.sucre_min.r === 182 && /Entre 100 et 300 g\/L/.test(toasts[toasts.length - 1]) && sauves.length === 1);
  ctx.REPONSE = ''; ctx._aocSetMin('Gevrey-Chambertin', 'r');
  t('valider à vide le retire, et le minimum vide disparaît', GC.sucre_min === undefined && sauves.length === 2);
  ctx.ADMIN = false; const nP = prompts.length; ctx._aocSetMin('Gevrey-Chambertin', 'b');
  t('réservé à l’administrateur : pas de fenêtre', prompts.length === nP && /administrateur/.test(toasts[toasts.length - 1]));
  ctx.ADMIN = true; GC.sucre_min = { r: 180, b: 175 };
  /* ══ 5. LA FENÊTRE DES APPELLATIONS ══ */
  const p1 = ctx._aocPlafondsHtml();
  t('la ligne de l’appellation dit son minimum', /<b>Gevrey-Chambertin<\/b><span>2 parcelles · minimum rouges 180 · blancs 175 g\/L<\/span>/.test(p1));
  ctx._aocOuvert = 'Gevrey-Chambertin';
  const p2 = ctx._aocPlafondsHtml();
  t('« ··· » ouvre les deux minimums', /onclick="window\._aocSetMin\('Gevrey-Chambertin','r'\)">Minimum des rouges : 180 g\/L</.test(p2) && /_aocSetMin\('Gevrey-Chambertin','b'\)">Minimum des blancs : 175 g\/L</.test(p2));
  /* ══ 6. LE STYLE, L'AIDE, LA NOUVEAUTÉ ══ */
  t('le style du trait vit dans la feuille', S.css.indexOf('★ MINAOC-1 (§385)') > S.css.indexOf('★ FIN CUVES-1') && /\.mat-l \.mn\{/.test(S.css));
  t('l’aide et la nouveauté le disent', /minimum de maturité/.test(S.utils) && /\{ v: '9\.47'/.test(S.utils));
  return L;
}

const DEFAUTS = [
  ['l’appellation est relue sur le nom', (S) => ({ ...S, cuv: S.cuv.replace("var ao = (typeof _vendAocDe === 'function') ? _vendAocDe(p) : null;", "var ao = (typeof _vendAocDe === 'function') ? _vendAocDe(nom) : null;") })],
  ['le trait n’est plus tracé', (S) => ({ ...S, cuv: S.cuv.replace("var mn = mv ? '<i class=\"mn\" style=\"left:' + pos(mv) + '%\"></i>' : '';", "var mn = '';") })],
  ['« sous le minimum » compte à l’envers', (S) => ({ ...S, cuv: S.cuv.replace('var sousMin = frais.filter(function(e){ var m = _matMin(e); return m && e.suc < m; }).length;', 'var sousMin = frais.filter(function(e){ var m = _matMin(e); return m && e.suc > m; }).length;') })],
  ['la fiche dit « atteint » trop tôt', (S) => ({ ...S, cuv: S.cuv.replace("  else if(e.suc >= m){ var at = e.arr.filter(function(a){ return _matSuc(a) >= m; })[0];", "  else if(e.suc >= m - 10){ var at = e.arr.filter(function(a){ return _matSuc(a) >= m - 10; })[0];") })],
  ['le réglage accepte n’importe quoi', (S) => ({ ...S, reg: S.reg.replace("if(!isFinite(x)||x<100||x>300){ if(window.showToast) window.showToast('Entre 100 et 300 g/L','#B85A1A'); return; }", "if(!isFinite(x)){ return; }") })],
  ['« ··· » n’ouvre plus le minimum des blancs', (S) => ({ ...S, reg: S.reg.replace("+'<button type=\"button\" class=\"aoc-act\" onclick=\"window._aocSetMin('+q+',\\'b\\')\">Minimum des blancs'+(mn.b>0?' : '+mn.b+' g/L':'')+'</button>'\n", '') })],
];

const c = { v: (s) => '\x1b[32m' + s + '\x1b[0m', r: (s) => '\x1b[31m' + s + '\x1b[0m', d: (s) => '\x1b[2m' + s + '\x1b[0m' };
if (!CONTRE) {
  const L = jouer(SAIN);
  console.log('\nMINAOC-1 — le minimum de maturité de l’appellation');
  for (const x of L) console.log('  ' + (x.ok ? c.v('✓') : c.r('✗')) + ' ' + x.nom + (x.ok ? '' : c.d('  → ' + x.detail)));
  const ko = L.filter((x) => !x.ok).length;
  console.log('\n  ' + (L.length - ko) + ' verts · ' + ko + ' rouge(s)\n');
  process.exit(ko ? 1 : 0);
} else {
  const base = jouer(SAIN).filter((x) => !x.ok);
  if (base.length) { console.log(c.r('  le code sain n’est pas vert : ' + base.map((x) => x.nom).join(' · '))); process.exit(1); }
  let rate = 0;
  console.log('\nMINAOC-1 — contre-épreuve');
  for (const [nom, casse] of DEFAUTS) {
    const S = casse(SAIN);
    const inchange = S.cuv === SAIN.cuv && S.reg === SAIN.reg && S.css === SAIN.css && S.utils === SAIN.utils;
    const rouges = inchange ? 0 : jouer(S).filter((x) => !x.ok).length;
    if (inchange) { rate++; console.log('    ' + c.r('INJECTION RATÉE') + '  ' + nom + c.d('  (le texte visé a changé : mettre la contre-épreuve à jour)')); }
    else if (!rouges) { rate++; console.log('    ' + c.r('NON DÉTECTÉ') + '  ' + nom); }
    else console.log('    DÉTECTÉ  ' + nom + c.d(' (' + rouges + ' rouge' + (rouges > 1 ? 's' : '') + ')'));
  }
  console.log('\n  ' + (DEFAUTS.length - rate) + '/' + DEFAUTS.length + ' défauts détectés\n');
  process.exit(rate ? 1 : 0);
}
