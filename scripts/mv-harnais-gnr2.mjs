#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────────────
   HARNAIS GNR-2 (§256) — LA CUVE GNR SE LIT SUR TÉLÉPHONE COMME SUR ORDINATEUR
   Lancer :  node scripts/mv-harnais-gnr2.mjs            (scénarios)
             node scripts/mv-harnais-gnr2.mjs --contre   (chaque défaut réinjecté doit rougir)

   La capture de Nico (06/10) : au Pilotage › Aujourd'hui, la carte Cuve GNR tassée dans une
   demi-colonne de téléphone — barres invisibles, litres coupés (« −19 »), échelle écrasée en
   « 0625125 L », titre sur trois lignes, la moitié droite de l'écran vide. Cause : le bloc tracteur
   portait `.pil-dec`, la grille de la décision du jour, et ALIGN-1 (§236) y a posé « par deux sous
   600 px » pour les quatre tuiles. Le bloc a maintenant SA grille.

   Ce qui est tenu :
   ① EXÉCUTÉ — le vrai _pilCkTracteur, extrait de src/pilotage.js avec ses helpers réels (méthode
     §6b) : le bloc n'est plus `.pil-dec` ; sa classe suit les cartes présentes (travaux + une carte
     → cote1, travaux + deux → cote2, révision + cuve sans travaux → paire, une carte seule → rien) ;
     les cartes portent pil-trx-wide / pil-trx-rev / pil-trx-cuve ; le chiffre de la cuve en grand,
     sa phrase à côté, orange sous le seuil.
   ② LU — src/styles.css : une colonne de base ; AUCUNE règle ne met le bloc sur plusieurs colonnes
     hors de @media (min-width:1024px) ; à partir de 1 024 px les travaux à gauche (2/3), la cuve à
     droite (1/3), la révision dessous sur toute la largeur ; la cascade de la cuve garde une barre
     d'au moins 80 px sur le plus petit téléphone (contenu de carte 280 px à 360 px d'écran).
   ⚠️ Aucun harnais ne lit un écran. Le rendu a été REGARDÉ dans Chromium au moment du lot
      (360, 392, 834, 1 280 et 1 440 px, thème clair et sombre) : ce harnais garde ce qui l'a
      rendu juste, il ne remplace pas l'œil sur un vrai téléphone.
   ───────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const PIL0 = readFileSync(path.join(RACINE, 'src/pilotage.js'), 'utf8');
const CSS0 = readFileSync(path.join(RACINE, 'src/styles.css'), 'utf8');

/* ══ ① Le vrai bloc, exécuté ═══════════════════════════════════════════════ */
function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('fonction introuvable : ' + nom);
  let j = src.indexOf('{', i), n = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') n++;
    else if (src[k] === '}') { n--; if (n === 0) return src.slice(i, k + 1); }
  }
  throw new Error('accolades : ' + nom);
}
function bloc(src) {
  const a = src.indexOf('function _pilCkAlertes(d){');
  const b = src.indexOf("// ── Onglet AUJOURD'HUI (cockpit) ──");
  if (a < 0 || b < 0 || b < a) throw new Error('bloc _pilCkAlertes → cockpit introuvable');
  return src.slice(a, b);
}
const RealDate = Date;
const FIXED = new RealDate('2026-10-06T10:00:00').getTime();
function FakeDate(...a) { return a.length ? new RealDate(...a) : new RealDate(FIXED); }
FakeDate.prototype = RealDate.prototype; FakeDate.now = () => FIXED; FakeDate.parse = RealDate.parse; FakeDate.UTC = RealDate.UTC;

// Un domaine de 1,5 ha ; un griffage lancé (3 h/ha, tracteur t1, conso du réglage 6 L/h) → 4,5 h · 27 L.
function charger(src, avecTravaux) {
  const ctx = {
    console, Math, JSON, Object, Array, String, Number, isFinite, parseFloat, Date: FakeDate,
    PARCELLES: [{ nom: 'A', surface: 1.0 }, { nom: 'B', surface: 0.5 }],
    ACTIVITES: [{ nom: 'Griffage', h_ha: 3, tracteurDefautId: 't1' }],
    ENTRETIENS: [], INTRANTS: { fertil: [] },
    SESSIONS: avecTravaux ? [{ id: 'G1', activite: 'Griffage', statut: 'En cours', date: '2026-10-01', tracteurId: 't1', parcellesFaites: [] }] : [],
    CONFIG: { eco: {}, features: {} }, _PIL_STATE: {},
    _sessInSaison: s => !!s, _pilSaison: () => ({ nom: '2026' }), _saisonForDate: () => '2026',
    getSaisonActive: () => ({ nom: '2026' }), _ferFaits: () => ({}),
    _mvIcon: n => '<svg data-ic="' + n + '"></svg>',
    _mvInfoBtn: k => '<button type="button" class="mv-i" data-mvi="' + k + '"><span>i</span></button>',
    tNom: n => n, TRACTEURS_LIST: [{ id: 't1', nom: 'NH' }],
    _pilProtData: () => ({ n: 0, nu: [], bientot: [] }), _pilTreatDays: () => [],
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  const code = [src.match(/var _PIL_TILE_ICO=\{[\s\S]*?\};/)[0],
    ...['_pilEsc', '_pilNum', '_pilTnom', '_pilDfr', '_pilStat', '_pilIco', '_pilIcoFor', '_pilTile', '_ecoCfg'].map(f => corps(src, f)),
    bloc(src)].join('\n');
  vm.runInContext(code, ctx, { filename: 'gnr2-extrait.js' });
  return ctx;
}
const NH = rev => [{ id: 't1', nom: 'NH', revReste: rev }];
const CUVE_HAUTE = { capacite: 1500, niveau: 900, seuil: 300 }, CUVE_BASSE = { capacite: 1500, niveau: 250, seuil: 300 };
// [nom, avec un travail lancé ?, d, classe attendue (après « pil-trx »), cartes attendues dans l'ordre]
const CAS = [
  ['travaux + cuve', true, { tracs: NH(400), gnr: CUVE_HAUTE }, ' pil-trx-cote1', ['wide', 'cuve']],
  ['travaux + révision + cuve', true, { tracs: NH(2), gnr: CUVE_HAUTE }, ' pil-trx-cote2', ['wide', 'rev', 'cuve']],
  ['travaux + révision, sans cuve renseignée', true, { tracs: NH(2), gnr: null }, ' pil-trx-cote1', ['wide', 'rev']],
  ['travaux seuls', true, { tracs: NH(400), gnr: null }, '', ['wide']],
  ['une cuve sous le seuil, seule', false, { tracs: NH(400), gnr: CUVE_BASSE }, '', ['cuve']],
  ['révision dépassée + cuve basse, sans travaux', false, { tracs: NH(-5), gnr: CUVE_BASSE }, ' pil-trx-paire', ['rev', 'cuve']],
];

/* ══ ② La feuille, lue ═════════════════════════════════════════════════════ */
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
// Les règles de la feuille, chacune avec le @media qui l'enveloppe (accolades appariées, @keyframes sautés).
function regles(css) {
  const out = [];
  (function marche(s, media) {
    let k = 0;
    while (k < s.length) {
      const o = s.indexOf('{', k); if (o < 0) break;
      const pre = s.slice(k, o).trim();
      let n = 1, j = o + 1;
      for (; j < s.length && n; j++) { if (s[j] === '{') n++; else if (s[j] === '}') n--; }
      const dedans = s.slice(o + 1, j - 1);
      if (pre.startsWith('@media') || pre.startsWith('@supports')) marche(dedans, pre.replace(/\s+/g, ' '));
      else if (!pre.startsWith('@')) out.push({ media, sel: pre.replace(/\s+/g, ' '), corps: dedans });
      k = j;
    }
  })(sansCom(css), '');
  return out;
}
// Combien de colonnes une valeur de grid-template-columns ouvre-t-elle ?
function colonnes(v) {
  const r = /^repeat\(\s*(\d+|auto-fit|auto-fill)\s*,/.exec(v);
  if (r) return /^\d+$/.test(r[1]) ? +r[1] : 99;
  let p = 0, n = 1;
  for (const ch of v.trim()) { if (ch === '(') p++; else if (ch === ')') p--; else if (ch === ' ' && p === 0) n++; }
  return n;
}
const BLOC = /\.pil-trx(?![\w-])|\.pil-trx-cote[12]|\.pil-trx-paire/;

function suite(PIL, CSS) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  // ① exécuté
  let rendus = [];
  try {
    rendus = CAS.map(([nom, avec, d, cls, cartes]) => {
      const X = charger(PIL, avec);
      return { nom, cls, cartes, h: X._pilCkTracteur(Object.assign({ refDate: '2026-10-06' }, d)) };
    });
  } catch (e) { T('le vrai bloc s’extrait et s’exécute (' + e.message + ')', false); return out; }
  for (const r of rendus) {
    const m = /^<div class="([^"]*)">/.exec(r.h);
    T(`① ${r.nom} : le bloc a sa grille, classe « pil-trx${r.cls} »`, m && m[1] === 'pil-trx' + r.cls);
    const vues = [...r.h.matchAll(/<div class="pil-tile2 pil-trx-(wide|rev|cuve)"/g)].map(x => x[1]);
    T(`① ${r.nom} : cartes ${r.cartes.join(' · ')}, dans cet ordre, chacune nommée`, JSON.stringify(vues) === JSON.stringify(r.cartes));
    T(`① ${r.nom} : jamais la grille de la décision du jour (.pil-dec), aucun undefined / NaN`, !/pil-dec/.test(r.h) && !/undefined|NaN/.test(r.h));
    const ouv = (r.h.match(/<div[ >]/g) || []).length, fer = (r.h.match(/<\/div>/g) || []).length;
    T(`① ${r.nom} : <div> équilibrés`, ouv === fer);
  }
  const h1 = rendus[0].h, h5 = rendus[4].h;
  T('① le chiffre de la cuve en grand (vert), sa phrase à côté : 900 − 27 = 873 L après les travaux en cours',
    h1.includes('<div class="pil-trx-v"><span class="pil-big" style="color:var(--vert-med)">873 L</span><span class="pil-trx-vu">après les travaux en cours</span></div>'));
  T('① sous le seuil et sans travail : 250 L en orange, « sous le seuil » à côté',
    h5.includes('<span class="pil-big" style="color:var(--orange)">250 L</span><span class="pil-trx-vu">sous le seuil</span>'));
  T('① la phrase n’est plus collée au chiffre dans le grand titre (trois lignes en demi-colonne)', !/L après les travaux en cours<\/div>/.test(h1) && !/L, sous le seuil/.test(h5));

  // ② lu
  const R = regles(CSS);
  const base = R.find(x => x.media === '' && x.sel === '.pil-trx');
  T('② le bloc a sa propre grille, une colonne de base', base && /display:grid/.test(base.corps) && /grid-template-columns:minmax\(0,1fr\)/.test(base.corps));
  const fautes = R.filter(x => BLOC.test(x.sel) && x.media !== '@media (min-width:1024px)')
    .filter(x => { const m = /grid-template-columns:([^;]+)/.exec(x.corps); return m && colonnes(m[1]) > 1; });
  T('② aucune règle ne met le bloc sur plusieurs colonnes sous 1 024 px (téléphone, tablette)' + (fautes.length ? ' — ' + fautes.map(f => (f.media || 'hors media') + ' ' + f.sel).join(' ; ') : ''), fautes.length === 0);
  const pc = R.filter(x => x.media === '@media (min-width:1024px)');
  const dans = (sel, re) => pc.some(x => x.sel === sel && re.test(x.corps));
  T('② ordinateur : les travaux (2/3) et la carte qui s’y projette (1/3) sur la même rangée',
    dans('.pil-trx.pil-trx-cote1,.pil-trx.pil-trx-cote2', /grid-template-columns:minmax\(0,2fr\) minmax\(0,1fr\)/)
    && dans('.pil-trx-cote1>.pil-trx-wide', /grid-column:1;grid-row:1/) && dans('.pil-trx-cote2>.pil-trx-wide', /grid-column:1;grid-row:1/));
  T('② ordinateur, trois cartes : la cuve en haut à droite, la révision dessous sur toute la largeur',
    dans('.pil-trx-cote2>.pil-trx-cuve', /grid-column:2;grid-row:1/) && dans('.pil-trx-cote2>.pil-trx-rev', /grid-column:1\/-1;grid-row:2/));
  T('② ordinateur, révision + cuve sans travaux : par deux', dans('.pil-trx.pil-trx-paire', /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/));
  const cs = R.find(x => x.media === '' && x.sel === '.pil-trx-cs');
  const m = cs && /grid-template-columns:minmax\((\d+)px,min\((\d+)%,(\d+)px\)\) minmax\(0,1fr\) (\d+)px;gap:(\d+)px/.exec(cs.corps);
  let barre = -1;
  if (m) { const [lMin, lPc, lMax, val, gap] = m.slice(1).map(Number); const lab = Math.min(Math.max(lMin, 280 * lPc / 100), lMax); barre = 280 - lab - val - 2 * gap; }
  T('② la cascade : barre élastique d’au moins 80 px dans une carte de téléphone de 280 px (calculée : ' + Math.round(barre) + ' px)', m && barre >= 80);
  T('② la cascade : colonne des litres d’au moins 52 px (« 1 119 L » tient), l’ancienne grille fixe 104/46 a disparu',
    m && +m[4] >= 52 && !/104px 1fr 46px/.test(cs.corps));
  const v = R.find(x => x.media === '' && x.sel === '.pil-trx-v'), vu = R.find(x => x.media === '' && x.sel === '.pil-trx-vu');
  T('② le titre de la cuve : chiffre et phrase sur la ligne de base, la phrase passe dessous s’il le faut',
    v && /display:flex/.test(v.corps) && /align-items:baseline/.test(v.corps) && /flex-wrap:wrap/.test(v.corps)
    && vu && /font-size:var\(--pt-base,14px\)/.test(vu.corps));
  return out;
}

function joue(P, C) { try { return suite(P, C); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
console.log('\n\x1b[1mMA VIGNE — Harnais GNR-2 · ' + (CONTRE ? 'contre-épreuves' : 'scénarios') + '\x1b[0m');
const res = joue(PIL0, CSS0);
if (!CONTRE) res.forEach(([n, c]) => { if (c) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + n); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + n); } });
else res.forEach(([, c]) => { if (c) ok++; else ko++; });
console.log(`\n  GNR-2 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) { console.log('  \x1b[31m✗\x1b[0m la base n’est pas verte : contre-épreuves sans objet'); process.exit(1); }

const sub = (a, b) => s => s.replace(a, b);
const DEF = [
  ['le bloc reprend la grille de la décision du jour', sub(`var cls='pil-trx'+`, `var cls='pil-dec pil-trx'+`), c => c],
  ['la classe ne compte plus les cartes', sub(`var cls='pil-trx'+(T.jobs.length&&nCote?' pil-trx-cote'+nCote:(nCote===2?' pil-trx-paire':''));`, `var cls='pil-trx';`), c => c],
  ['la carte cuve perd son nom', sub('<div class="pil-tile2 pil-trx-cuve">', '<div class="pil-tile2">'), c => c],
  ['la carte révision perd son nom', sub('<div class="pil-tile2 pil-trx-rev">', '<div class="pil-tile2">'), c => c],
  ['la phrase repart dans le grand titre', sub(`'">'+bigN+'</span><span class="pil-trx-vu">'+bigP+'</span></div>'`, `'">'+bigN+' '+bigP+'</span></div>'`), c => c],
  ['« par deux » revient sur le téléphone', p => p, c => c + '\n@media (max-width:600px){.pil-trx{grid-template-columns:repeat(2,minmax(0,1fr));}}\n'],
  ['la tablette passe en deux colonnes (règle hors du bloc ordinateur)', p => p, c => c + '\n@media (min-width:768px){.pil-trx.pil-trx-cote1{grid-template-columns:minmax(0,2fr) minmax(0,1fr);}}\n'],
  ['le bloc perd sa propre grille', p => p, sub('.pil-trx{display:grid;grid-template-columns:minmax(0,1fr);', '.pil-trx{')],
  ['la révision repasse sous la cuve', p => p, sub('.pil-trx-cote2>.pil-trx-rev{grid-column:1/-1;grid-row:2;}', '.pil-trx-cote2>.pil-trx-rev{grid-column:2;grid-row:2;}')],
  ['la mise en page ordinateur disparaît', p => p, sub('.pil-trx.pil-trx-cote1,.pil-trx.pil-trx-cote2{grid-template-columns:minmax(0,2fr) minmax(0,1fr);}', '')],
  ['la cascade reprend ses colonnes fixes', p => p, sub('grid-template-columns:minmax(96px,min(40%,176px)) minmax(0,1fr) 56px;', 'grid-template-columns:104px 1fr 46px;')],
  ['la cascade ne laisse plus de place à la barre', p => p, sub('grid-template-columns:minmax(96px,min(40%,176px)) minmax(0,1fr) 56px;', 'grid-template-columns:minmax(150px,min(60%,176px)) minmax(0,1fr) 56px;')],
  ['le titre ne passe plus à la ligne', p => p, sub('.pil-trx-v{display:flex;gap:var(--e-1,4px) var(--e-3,12px);align-items:baseline;flex-wrap:wrap;}', '.pil-trx-v{display:flex;gap:var(--e-1,4px) var(--e-3,12px);align-items:baseline;}')],
];
let rg = 0;
for (const [nom, fp, fc] of DEF) {
  const P2 = fp(PIL0), C2 = fc(CSS0);
  if (P2 === PIL0 && C2 === CSS0) { console.log('  \x1b[31m✗\x1b[0m défaut non injecté : ' + nom); continue; }
  const n = joue(P2, C2).filter(([, x]) => !x).length;
  if (n) { rg++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + '\x1b[2m  (' + n + ' rouge' + (n > 1 ? 's' : '') + ')\x1b[0m'); }
  else console.log('  \x1b[31m✗\x1b[0m MUET : ' + nom);
}
console.log(`\n  ${rg}/${DEF.length} contre-épreuves rougissent\n`);
process.exit(rg === DEF.length ? 0 : 1);
