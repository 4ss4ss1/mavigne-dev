#!/usr/bin/env node
// PIL-RANGE-1b (§441) : « Alertes matériel » de l'ancien Aujourd'hui (_pilCkAlertes) est retiré ; les cartes du tracteur (_pilCkTracteur)
//   sont relogées dans Équipe & matériel › Matériel (_pilTabMat). Les machines immobilisées sont dans « À savoir » du cockpit v2.
// ★ MOTS-9 (§592) — RÉÉCRIT. Les trois grandes cartes (_pilCkTracteur, la grille .pil-trx cote1/cote2/paire) sont parties :
//   « Travaux tracteur en cours » est UNE carte repliée (_pilPanelTrx), la cascade de la cuve est dans la carte Cuve GNR
//   (_pilPanelGnr), les morceaux viennent de _pilTrxParts (calculs inchangés). Ce que GNR-2 tenait reste tenu : la cuve se lit
//   sur téléphone comme sur ordinateur (la cascade garde sa barre, la ligne d'un travail rétrécit), et la grille morte ne
//   revient pas. Les cas sont les mêmes six.
/* ─────────────────────────────────────────────────────────────────────────
   HARNAIS GNR-2 (§256) — LA CUVE GNR SE LIT SUR TÉLÉPHONE COMME SUR ORDINATEUR
   Lancer :  node scripts/mv-harnais-gnr2.mjs            (scénarios)
             node scripts/mv-harnais-gnr2.mjs --contre   (chaque défaut réinjecté doit rougir)

   La capture de Nico (06/10) : au Pilotage › Aujourd'hui, la carte Cuve GNR tassée dans une
   demi-colonne de téléphone — barres invisibles, litres coupés (« −19 »), échelle écrasée en
   « 0625125 L », titre sur trois lignes, la moitié droite de l'écran vide. Cause : le bloc tracteur
   portait `.pil-dec`, la grille de la décision du jour, et ALIGN-1 (§236) y a posé « par deux sous
   600 px » pour les quatre tuiles. Le bloc a maintenant SA grille.

   Ce qui est tenu (MOTS-9) :
   ① EXÉCUTÉ — les vrais _pilTrxParts, _pilPanelTrx et _pilPanelGnr, extraits de src/pilotage.js avec
     leurs helpers réels (méthode §6b), sur les six cas : la carte des travaux paraît quand il y a un
     travail OU un entretien à dire (« 0 en cours » et la pastille de la révision dépassée, sinon) ; la
     pastille de l'entretien monte sur le chiffre quand elle n'est pas verte ; la cascade « Après les
     travaux en cours » vit dans la carte de la cuve, seulement quand un travail a des litres ; le
     niveau du jour en chiffre, « sous le seuil » en pastille, le seuil posé sur la barre ; 873 L
     s'écrit une fois ; jamais .pil-dec ni les classes de l'ancienne grille ; <div> équilibrés.
   ② LU — src/styles.css et src/pilotage.css : la grille de l'ancien bloc est partie (aucune règle,
     aucun émetteur) ; la cascade garde une barre d'au moins 80 px sur le plus petit téléphone
     (contenu de carte 280 px à 360 px d'écran) ; dans la carte, la ligne d'un travail n'a que des
     colonnes qui rétrécissent (aucun minimum en px).
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
const PCSS0 = readFileSync(path.join(RACINE, 'src/pilotage.css'), 'utf8');

/* ══ ① Les vraies cartes, exécutées ════════════════════════════════════════ */
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
  const a = Math.min(...['var _PIL_GM_', 'function _pilGm'].map(k => src.indexOf(k)).filter(i => i >= 0));   // PIL-RANGE-1b : le bloc part des aides GNR-M
  const b = src.indexOf("// ── Onglet AUJOURD'HUI (cockpit) ──");
  if (a < 0 || b < 0 || b < a) throw new Error('bloc des aides GNR-M → cockpit introuvable');
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
    ...['_pilEsc', '_pilNum', '_pilTnom', '_pilDfr', '_pilStat', '_pilIco', '_pilIcoFor', '_pilTile', '_ecoCfg',
      '_pilPhPl', '_pilTvBtn', '_pilEmptyGo', '_pilTrxParts', '_pilPanelTrx', '_pilPanelGnr'].map(f => corps(src, f)),
    bloc(src)].join('\n');
  vm.runInContext(code, ctx, { filename: 'gnr2-extrait.js' });
  return ctx;
}
const NH = rev => [{ id: 't1', nom: 'NH', revReste: rev }];
const CUVE_HAUTE = { capacite: 1500, niveau: 900, seuil: 300 }, CUVE_BASSE = { capacite: 1500, niveau: 250, seuil: 300 };
// [nom, avec un travail lancé ?, d, carte des travaux ?, l'entretien dedans ?, la cascade dans la cuve ?, cuve renseignée ?]
const CAS = [
  ['travaux + cuve', true, { tracs: NH(400), gnr: CUVE_HAUTE }, true, false, true, true],
  ['travaux + révision + cuve', true, { tracs: NH(2), gnr: CUVE_HAUTE }, true, true, true, true],
  ['travaux + révision, sans cuve renseignée', true, { tracs: NH(2), gnr: null }, true, true, false, false],
  ['travaux seuls', true, { tracs: NH(400), gnr: null }, true, false, false, false],
  ['une cuve sous le seuil, seule', false, { tracs: NH(400), gnr: CUVE_BASSE }, false, false, false, true],
  ['révision dépassée + cuve basse, sans travaux', false, { tracs: NH(-5), gnr: CUVE_BASSE }, true, true, false, true],
];
const ANCIENNE_GRILLE = /pil-trx-(?:cote[12]|paire|wide|rev|cuve|v|vu|axl)\b|class="pil-trx"/;

/* ══ ② Les feuilles, lues ══════════════════════════════════════════════════ */
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

function suite(PIL, CSS, PCSS) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  // ① exécuté
  let rendus = [], X0 = null;
  try {
    rendus = CAS.map(([nom, avec, d, trx, rev, casc, cuve]) => {
      const X = charger(PIL, avec); X0 = X0 || X;
      const dd = Object.assign({ refDate: '2026-10-06' }, d), P = X._pilTrxParts(dd);
      return { nom, trx, rev, casc, cuve, t: X._pilPanelTrx(dd, P), g: X._pilPanelGnr(dd, P) };
    });
  } catch (e) { T('les vraies cartes s’extraient et s’exécutent (' + e.message + ')', false); return out; }
  const N = v => X0._pilNum(v);
  for (const r of rendus) {
    const h = r.t + r.g;
    T(`① ${r.nom} : la carte des travaux ${r.trx ? 'paraît' : 'ne paraît pas'}`, r.trx ? /data-pid="trx"/.test(r.t) : r.t === '');
    T(`① ${r.nom} : l’entretien ${r.rev ? 'se lit' : 'ne se lit pas'} dans la carte des travaux`, /class="pil-trx-carnet"/.test(r.t) === r.rev);
    T(`① ${r.nom} : la cascade ${r.casc ? 'vit dans la carte de la cuve' : 'n’est pas posée'}`, /Après les travaux en cours/.test(r.g) === r.casc && /pil-trx-casc/.test(r.g) === r.casc && !/pil-trx-casc|Après les travaux/.test(r.t));
    T(`① ${r.nom} : la cuve ${r.cuve ? 'a son niveau en chiffre' : 'invite à la renseigner'}`, r.cuve ? /<span class="pil-th-stat"><b>(900|250)<\/b> L<\/span>/.test(r.g) : /aucune cuve renseignée/.test(r.g));
    T(`① ${r.nom} : jamais la grille de la décision du jour (.pil-dec) ni celle de l’ancien bloc ; aucun undefined / NaN`, !/pil-dec/.test(h) && !ANCIENNE_GRILLE.test(h) && !/undefined|NaN/.test(h));
    const ouv = (h.match(/<div[ >]/g) || []).length, fer = (h.match(/<\/div>/g) || []).length;
    T(`① ${r.nom} : <div> équilibrés`, ouv === fer);
  }
  const [r1, r2, , , r5, r6] = rendus;
  T('① le chiffre des travaux : 1 en cours, « reste 4,5 h · 27 L » dessous',
    r1.t.includes('<span class="pil-th-stat"><b>1</b> en cours</span>') && r1.t.includes('<div class="pil-tsub">reste 4,5 h · 27 L</div>'));
  T('① 900 − 27 = 873 L après les travaux : écrit UNE fois, dans la cascade de la cuve', ((r1.t + r1.g).match(/873 L/g) || []).length === 1 && /<span class="v">873 L<\/span>/.test(r1.g));
  T('① la révision atteinte pendant le griffage : sa pastille orange monte sur le chiffre', /<\/span><span class="pil-tv-pl or">Révision atteinte pendant : Griffage<\/span><\/div><div class="pil-tsub">/.test(r2.t));
  T('① sans travaux, la révision dépassée : « 0 en cours », pastille rouge', r6.t.includes('<b>0</b> en cours</span><span class="pil-tv-pl ko">Révision dépassée de 5 h</span>') && r6.t.includes('aucune session lancée'));
  T('① sous le seuil : 250 L, « sous le seuil » en pastille, le seuil posé sur la barre (300 / 1 500 = 20 %)',
    r5.g.includes('<b>250</b> L</span><span class="pil-tv-pl or">sous le seuil</span>') && r5.g.includes('<u style="left:20.0%" title="seuil ' + N(300) + ' L"></u>')
    && r5.g.includes('<div class="pil-tsub">seuil ' + N(300) + ' L · cuve de ' + N(1500) + ' L</div>'));
  T('① au-dessus du seuil : pas de pastille', !/sous le seuil/.test(r1.g));

  // ② lu
  const R = regles(CSS).concat(regles(PCSS));
  const mortes = R.filter(x => /\.pil-trx(?![\w-])|\.pil-trx-(?:cote[12]|paire|wide|rev|cuve|v|vu|axl)(?![\w-])/.test(x.sel));
  T('② la grille de l’ancien bloc est partie : aucune règle (.pil-trx, cote1/cote2/paire, -v/-vu, -axl)' + (mortes.length ? ' — ' + mortes.map(f => f.sel).join(' ; ') : ''), mortes.length === 0);
  T('② … ni aucun émetteur dans le Pilotage', !ANCIENNE_GRILLE.test(PIL.replace(/\/\/[^\n]*/g, '')));
  const cs = R.find(x => x.media === '' && x.sel === '.pil-trx-cs');
  const m = cs && /grid-template-columns:minmax\((\d+)px,min\((\d+)%,(\d+)px\)\) minmax\(0,1fr\) (\d+)px;gap:(\d+)px/.exec(cs.corps);
  let barre = -1;
  if (m) { const [lMin, lPc, lMax, val, gap] = m.slice(1).map(Number); const lab = Math.min(Math.max(lMin, 280 * lPc / 100), lMax); barre = 280 - lab - val - 2 * gap; }
  T('② la cascade : barre élastique d’au moins 80 px dans une carte de téléphone de 280 px (calculée : ' + Math.round(barre) + ' px)', m && barre >= 80);
  T('② la cascade : colonne des litres d’au moins 52 px (« 1 119 L » tient), l’ancienne grille fixe 104/46 a disparu',
    m && +m[4] >= 52 && !/104px 1fr 46px/.test(cs.corps));
  const job = R.find(x => x.sel === '#page-pilotage .pil-eq .pil-tbody .pil-trx-job');
  const gj = job && /grid-template-columns:([^;}]+)/.exec(job.corps);
  T('② dans la carte, la ligne d’un travail n’a que des colonnes qui rétrécissent (aucun minimum en px)', gj && !/\d+px/.test(gj[1]) && /minmax\(0,/.test(gj[1]));
  return out;
}

function joue(P, C, PC) { try { return suite(P, C, PC); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
console.log('\n\x1b[1mMA VIGNE — Harnais GNR-2 · ' + (CONTRE ? 'contre-épreuves' : 'scénarios') + '\x1b[0m');
const res = joue(PIL0, CSS0, PCSS0);
if (!CONTRE) res.forEach(([n, c]) => { if (c) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + n); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + n); } });
else res.forEach(([, c]) => { if (c) ok++; else ko++; });
console.log(`\n  GNR-2 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) { console.log('  \x1b[31m✗\x1b[0m la base n’est pas verte : contre-épreuves sans objet'); process.exit(1); }

const sub = (a, b) => s => s.replace(a, b);
const id = s => s;
// [nom, pilotage.js, styles.css, pilotage.css]
const DEF = [
  ['la cascade quitte la carte de la cuve', sub('+((X&&X.cuve)?(', '+((false)?('), id, id],
  ['la cascade se pose même sans litres à compter', sub('    if(avecL.length){', '    if(true){'), id, id],
  ['la carte des travaux se tait quand seule la révision a quelque chose à dire', sub('if(!X || (!X.jobs && !X.rev)) return \'\';', 'if(!X || !X.jobs) return \'\';'), id, id],
  ['la pastille de l’entretien ne monte plus sur le chiffre', sub("if(Rv && Rv.cls!=='ok') stat+=", 'if(false) stat+='), id, id],
  ['« sous le seuil » disparaît', sub("(low?_pilPhPl('sous le seuil','or'):'')", "''"), id, id],
  ['le seuil quitte la barre', sub("(seuil>0?'<u style=", "(false?'<u style="), id, id],
  ['l’ancienne grille revient dans le rendu', sub("return _pilTile('trx','#4A9FC8'", "return '<div class=\"pil-trx pil-trx-cote1\"></div>'+_pilTile('trx','#4A9FC8'"), id, id],
  ['la grille de la décision du jour revient', sub("'<div class=\"pil-tv-act\">'+_pilTvBtn('tracteur'", "'<div class=\"pil-tv-act pil-dec\">'+_pilTvBtn('tracteur'"), id, id],
  ['la règle de l’ancien bloc revient dans la feuille', id, c => c + '\n.pil-trx{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));}\n', id],
  ['la cascade reprend ses colonnes fixes', id, sub('grid-template-columns:minmax(96px,min(40%,176px)) minmax(0,1fr) 56px;', 'grid-template-columns:104px 1fr 46px;'), id],
  ['la cascade ne laisse plus de place à la barre', id, sub('grid-template-columns:minmax(96px,min(40%,176px)) minmax(0,1fr) 56px;', 'grid-template-columns:minmax(150px,min(60%,176px)) minmax(0,1fr) 56px;'), id],
  ['la ligne d’un travail reprend ses minimums en px', id, id, sub('.pil-trx-job{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) auto auto}', '.pil-trx-job{grid-template-columns:minmax(140px,1.1fr) 2fr 64px 64px}')],
];
let rg = 0;
for (const [nom, fp, fc, fpc] of DEF) {
  const P2 = fp(PIL0), C2 = fc(CSS0), PC2 = fpc(PCSS0);
  if (P2 === PIL0 && C2 === CSS0 && PC2 === PCSS0) { console.log('  \x1b[31m✗\x1b[0m défaut non injecté : ' + nom); continue; }
  const n = joue(P2, C2, PC2).filter(([, x]) => !x).length;
  if (n) { rg++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + '\x1b[2m  (' + n + ' rouge' + (n > 1 ? 's' : '') + ')\x1b[0m'); }
  else console.log('  \x1b[31m✗\x1b[0m MUET : ' + nom);
}
console.log(`\n  ${rg}/${DEF.length} contre-épreuves rougissent\n`);
process.exit(rg === DEF.length ? 0 : 1);
