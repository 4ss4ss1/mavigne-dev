// HARNAIS — MATU-1 (§366) : les Maturités rangées (Cuvier › Maturités).
//   node scripts/mv-harnais-matu1.mjs           → doit être vert
//   node scripts/mv-harnais-matu1.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue les VRAIES fonctions de cuvier.js (_matSynth, _matFour, _matRegLire, _matOrdreHtml, _vendAnaAdd) sur un
// domaine fabriqué : six parcelles (deux rouges fraîches, un blanc frais, une rouge mesurée il y a deux semaines,
// une jamais mesurée, une déjà rentrée), une mesure de la vendange d'avant, une fourchette des rouges et une
// fourchette des blancs incohérente.
// Bouchons (dits ici, pas cachés) : la couleur d'une parcelle (_parcCoul) est une table ; l'échappement, les icônes,
// la sauvegarde et le toast sont des marques ; le graphe (_vendMatSvg) et la page (index.html, les nouveautés) sont lus
// dans le texte — le graphe a son propre harnais (courbes).
import fs from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const SAIN = {
  cuv: fs.readFileSync('src/cuvier.js', 'utf8'),
  html: fs.readFileSync('index.html', 'utf8'),
  utils: (fs.readFileSync('src/utils.js', 'utf8') + '\n' + fs.readFileSync('src/whats-new.js', 'utf8')),
};

function bornes(src, nom) {
  const re = new RegExp('^function ' + nom + '\\s*\\(', 'gm');
  const m = [...src.matchAll(re)];
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

const FONCTIONS = ['_matJours', '_matLarge', '_matFour', '_matSynth', '_matUnite', '_matGros', '_matPetit', '_matJj', '_matAge',
  '_matVit', '_matVin', '_matPlur', '_matVuesHtml', '_matOrdreHtml', '_vendAnaAdd', '_matSuc', '_vendCfg',
  '_matMin'];   // MINAOC-1 (§385) : l'ordre de maturité trace le minimum de l'appellation

function jouer(S) {
  const L = [];
  const t = (nom, ok, detail) => L.push({ nom, ok: !!ok, detail: ok ? '' : (detail || '') });
  const debut = S.cuv.indexOf('var _matFen'), finVars = S.cuv.indexOf('function _matNorm');
  if (debut < 0 || finVars < debut) { t('les variables de l’onglet sont déclarées en tête du bloc', false); return L; }
  let code = S.cuv.slice(debut, finVars) + '\n';
  for (const f of FONCTIONS) code += fn(S.cuv, f) + '\n';
  const DOM = {}, toasts = [], sauves = [];
  const COUL = { 'Les Charmes': 'r', 'Champ Perdrix': 'r', 'Clos Blanc': 'b', 'Vieille Vigne': 'r', 'Jamais': 'r', 'Rentrée': 'r' };
  const ctx = {
    AUJ: '2026-09-08',
    document: { getElementById: (id) => DOM[id] || null },
    _mvF1: (x) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ','),
    _escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    _escAttr: (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;'),
    _mvIcon: (n) => '<svg data-ic="' + n + '"></svg>',
    canWrite: () => true, isAdmin: () => true,
    showToast: (m) => toasts.push(m), _vendFbSave: (m) => sauves.push(m),
    _parcCoul: (nom) => COUL[nom] || '?', _vendAocDe: () => '', _anaSpd: (a, spd) => a.spd || spd || 16.83,
    renderVendAna() {}, closeOv() {},
    console,
  };
  ctx._mvToday = () => ctx.AUJ;
  ctx.window = ctx;
  ctx.window.matchMedia = () => ({ matches: false });
  ctx.PARCELLES = [
    { nom: 'Les Charmes', surface: '1.0' }, { nom: 'Champ Perdrix', surface: '0.5' }, { nom: 'Clos Blanc', surface: '0.8' },
    { nom: 'Vieille Vigne', surface: '0.4' }, { nom: 'Jamais', surface: '0.3' }, { nom: 'Rentrée', surface: '0.6' },
  ];
  const A = (p, d, v) => ({ id: 'a_' + p + d, parcelle: p, date: d, mode: 'sucre', val: v });
  ctx.CAVE_VENDANGE = {
    config: { sucre_par_degre: 16.83, mat_four: { r: { min: 205, max: 225 }, b: { min: 215, max: 200 } } },
    analyses: [A('Les Charmes', '2026-08-30', 200), A('Les Charmes', '2026-09-06', 212), A('Les Charmes', '2025-10-01', 238),
      A('Champ Perdrix', '2026-09-03', 214), A('Champ Perdrix', '2026-09-07', 220), A('Clos Blanc', '2026-09-05', 200),
      A('Vieille Vigne', '2026-08-25', 190), A('Rentrée', '2026-08-28', 215)],
    recoltes: [{ parcelle: 'Rentrée', date: '2026-09-01' }],
  };
  vm.createContext(ctx);
  try { vm.runInContext(code, ctx, { filename: 'matu1-extrait.js' }); }
  catch (e) { t('les fonctions extraites se chargent', false, e.message); return L; }

  /* ══ 1. LE CALCUL : les groupes, la moyenne pondérée, la vendange bornée ══ */
  const r = ctx._matSynth(7, null, '2026');
  const noms = (a) => a.map((e) => e.nom).join(',');
  t('frais : de la plus avancée à la moins avancée', noms(r.frais) === 'Champ Perdrix,Les Charmes,Clos Blanc', noms(r.frais));
  t('plus de 7 jours : hors moyenne, mais affichée', noms(r.vieilles) === 'Vieille Vigne', noms(r.vieilles));
  t('jamais mesurée, et déjà rentrée, à part', noms(r.jamais) === 'Jamais' && noms(r.rentrees) === 'Rentrée', noms(r.jamais) + ' | ' + noms(r.rentrees));
  const pond = (220 * 0.5 + 212 * 1.0 + 200 * 0.8) / 2.3;
  t('la moyenne du domaine est pondérée par la surface', Math.abs(r.tiles.dom.pond - pond) < 0.01, String(r.tiles.dom.pond));
  t('le dénominateur est ce qui reste à rentrer (5 parcelles)', r.tiles.dom.nTot === 5, String(r.tiles.dom.nTot));
  t('une parcelle ne porte que les mesures de SA vendange', r.tous['Les Charmes'].arr.length === 2, String(r.tous['Les Charmes'].arr.length));
  // L'hiver suivant : le 10 février, seules existent les mesures de l'automne d'avant (132 jours : dans la fenêtre des 150).
  ctx.AUJ = '2026-02-10';
  const tout = ctx.CAVE_VENDANGE.analyses;
  ctx.CAVE_VENDANGE.analyses = tout.filter((a) => a.date < '2026-01-01');
  const hiver = ctx._matSynth(7, null, '2026');
  ctx.CAVE_VENDANGE.analyses = tout;
  t('en février, la vendange 2026 ne reprend pas la fin de 2025', hiver.vieilles.length === 0 && hiver.frais.length === 0
    && hiver.jamais.some((e) => e.nom === 'Les Charmes'), noms(hiver.vieilles) + ' | ' + noms(hiver.frais));
  ctx.AUJ = '2026-09-08';

  /* ══ 2. LA FOURCHETTE : lue, refusée quand elle est incohérente ══ */
  const four = ctx._matFour();
  t('la fourchette des rouges est lue', four.r && four.r.min === 205 && four.r.max === 225, JSON.stringify(four.r));
  t('une fourchette dont le bas dépasse le haut n’est pas tracée', four.b === null, JSON.stringify(four.b));

  /* ══ 3. L'ORDRE DE MATURITÉ : la bande de SA couleur, les groupes repliés ══ */
  const html = ctx._matOrdreHtml(r, 16.83, four, true);
  const zones = (html.match(/class="zo"/g) || []).length;
  t('trois lignes rouges portent la bande des rouges, le blanc n’en a pas', zones === 3, zones + ' bande(s)');
  t('le compte dans la fourchette est écrit', /2 parcelles dans leur fourchette/.test(html));
  t('les jamais mesurées et les déjà rentrées sont repliées', /Jamais mesurées/.test(html) && /Déjà rentrées/.test(html)
    && !/data-nom="Jamais"/.test(html) && !/data-nom="Rentrée"/.test(html));
  ctx._matVoirTout.jamais = true;
  t('déplié, le groupe montre sa parcelle', /data-nom="Jamais"/.test(ctx._matOrdreHtml(r, 16.83, four, true)));
  ctx._matVoirTout.jamais = false;
  t('chaque ligne ouvre la fiche par son nom (data-nom, pas de nom dans le code du clic)',
    /data-nom="Champ Perdrix" onclick="_matSel\(this\.dataset\.nom\)"/.test(html));

  /* ══ 4. LE RÉGLAGE de la fourchette : depuis CAVEREG-2 (§387), sa fenêtre et ses règles ont leur harnais (cavereg2). ══ */
  /* ══ 5. LA SAISIE EN SÉRIE : seules les valeurs lisibles s'enregistrent, toutes d'un coup ══ */
  const avant = ctx.CAVE_VENDANGE.analyses.length;
  ctx._matSaisieEt = { date: '2026-09-08', unite: 's', vals: { 'Les Charmes': '214', 'Clos Blanc': '', 'Vieille Vigne': 'abc', 'Champ Perdrix': '222,5' }, focus: null };
  ctx._vendAnaAdd();
  const neuves = ctx.CAVE_VENDANGE.analyses.slice(avant);
  t('deux mesures lisibles, deux mesures enregistrées', neuves.length === 2, String(neuves.length));
  t('la virgule se lit, la date et l’unité suivent', neuves.some((a) => a.parcelle === 'Champ Perdrix' && a.val === 222.5)
    && neuves.every((a) => a.mode === 'sucre' && a.date === '2026-09-08'), JSON.stringify(neuves));
  t('une seule sauvegarde, qui dit combien', sauves.length === 1 && /^2 mesures enregistrées$/.test(sauves[0]), JSON.stringify(sauves));
  t('la feuille se referme', ctx._matSaisieEt === null);

  /* ══ 6. LE BRANCHEMENT : lu dans le texte ══ */
  t('l’écran passe la vendange choisie au calcul', /_matSynth\(_matFen, ref, an\)/.test(fn(S.cuv, 'renderVendAna')));
  t('le graphe trace les fourchettes et sait taire sa légende', /opt\.bandes/.test(fn(S.cuv, '_vendMatSvg'))
    && /--ok-doux/.test(fn(S.cuv, '_vendMatSvg')) && /opt\.sansLegende/.test(fn(S.cuv, '_vendMatSvg')));
  t('les trois fenêtres existent dans index.html', ['ovMatFiche" onclick', 'ovMatSaisie" onclick', 'ovMatCouleurs" onclick', 'id="mat-fiche-corps"',
    'id="mat-saisie-corps"', 'id="mat-coul-corps"'].every((x) => S.html.includes(x)));
  t('la bulle « i » de la synthèse a sa fiche', /'cave\.maturite': \{ t:/.test(S.utils) && /_mvInfoBtn\('cave\.maturite'\)/.test(S.cuv));
  t('la nouveauté vise l’onglet Maturités', /cible: '#mvv-tab-ana'/.test(S.utils) && /id="mvv-tab-ana"/.test(S.cuv));
  return L;
}

const DEFAUTS = [
  ['la vendange n’est plus bornée (les années se mêlent)', (S) => ({ ...S, cuv: S.cuv.replace("if(!a || !a.parcelle || !a.date || !dans(a.date)) return;", "if(!a || !a.parcelle || !a.date) return;") })],
  ['la moyenne redevient simple', (S) => ({ ...S, cuv: S.cuv.replace('pond:   m.reduce(function(s, x){ return s + x.suc * (x.ha || 1); }, 0) / (haM || 1),', 'pond:   m.reduce(function(s, x){ return s + x.suc; }, 0) / m.length,') })],
  ['une fourchette incohérente est tracée', (S) => ({ ...S, cuv: S.cuv.replace('if(mn > 0 && mx > mn) o[c] = { min:mn, max:mx };', 'if(mn > 0) o[c] = { min:mn, max:mx };') })],
  ['la bande prend la fourchette de l’autre couleur', (S) => ({ ...S, cuv: S.cuv.replace("var w = four[e.coul], pale = grp !== 'frais', sel = _matSelNom === e.nom;", "var w = four.b, pale = grp !== 'frais', sel = _matSelNom === e.nom;") })],
  ['les jamais mesurées ne sont plus repliées', (S) => ({ ...S, cuv: S.cuv.replace('if(ouv) liste.forEach(function(e){ s += ligne(e, grp); });', 'liste.forEach(function(e){ s += ligne(e, grp); });') })],
  ['une valeur illisible s’enregistre', (S) => ({ ...S, cuv: S.cuv.replace("    var v = parseFloat(String(s.vals[nom]).replace(',', '.'));\n    if(!(v > 0)) return;\n", "    var v = parseFloat(String(s.vals[nom]).replace(',', '.'));\n    if(s.vals[nom] === '') return;\n") })],
  ['l’écran ne passe plus la vendange au calcul', (S) => ({ ...S, cuv: S.cuv.replace('var r = _matSynth(_matFen, ref, an);', 'var r = _matSynth(_matFen, ref);') })],
  ['une fenêtre manque dans index.html', (S) => ({ ...S, html: S.html.replace('id="ovMatSaisie"', 'id="ovMatSaisieX"') })],
];

const c = { v: (s) => '\x1b[32m' + s + '\x1b[0m', r: (s) => '\x1b[31m' + s + '\x1b[0m', d: (s) => '\x1b[2m' + s + '\x1b[0m' };
if (!CONTRE) {
  const L = jouer(SAIN);
  console.log('\nMATU-1 — les Maturités rangées');
  for (const x of L) console.log('  ' + (x.ok ? c.v('✓') : c.r('✗')) + ' ' + x.nom + (x.ok ? '' : c.d('  → ' + x.detail)));
  const ko = L.filter((x) => !x.ok).length;
  console.log('\n  ' + (L.length - ko) + ' verts · ' + ko + ' rouge(s)\n');
  process.exit(ko ? 1 : 0);
} else {
  const base = jouer(SAIN).filter((x) => !x.ok);
  if (base.length) { console.log(c.r('  le code sain n’est pas vert : ' + base.map((x) => x.nom).join(' · '))); process.exit(1); }
  let rate = 0;
  console.log('\nMATU-1 — contre-épreuve');
  for (const [nom, casse] of DEFAUTS) {
    const S = casse(SAIN);
    const inchange = S.cuv === SAIN.cuv && S.html === SAIN.html && S.utils === SAIN.utils;
    const rouges = inchange ? 0 : jouer(S).filter((x) => !x.ok).length;
    if (inchange) { rate++; console.log('    ' + c.r('INJECTION RATÉE') + '  ' + nom + c.d('  (le texte visé a changé : mettre la contre-épreuve à jour)')); }
    else if (!rouges) { rate++; console.log('    ' + c.r('NON DÉTECTÉ') + '  ' + nom); }
    else console.log('    DÉTECTÉ  ' + nom + c.d(' (' + rouges + ' rouge' + (rouges > 1 ? 's' : '') + ')'));
  }
  console.log('\n  ' + (DEFAUTS.length - rate) + '/' + DEFAUTS.length + ' défauts détectés\n');
  process.exit(rate ? 1 : 0);
}
