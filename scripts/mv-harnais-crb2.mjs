// Harnais CRB-2 — L'ENVELOPPE DE DISPERSION, sur les VRAIES fonctions de cave.js.
//
// ★★★ POURQUOI CE HARNAIS EXISTE, ET CE QU'IL NE SAIT PAS FAIRE.
//   Il exécute le moteur (`_crbVal`, `_crbEnv`) et le tracé (`_crbEnvSvg`) avec
//   un faux socle graphique, sur des cuves écrites à la main. Il tient les
//   INVARIANTS : min ≤ médiane ≤ max, aucune extrapolation, le couloir qui
//   s'arrête quand il reste moins de trois cuves, deux cuves au maximum,
//   l'échappement des noms dans l'infobulle, et le fait que le cahier de
//   cuverie NE passe PAS par ici.
//   ⚠ Il ne lit AUCUNE mise en page (§42h). Un couloir illisible en mode sombre,
//   une bande de chips qui déborde : il les laisserait passer, et c'est l'œil
//   qui doit les attraper.
//
// Usage : node scripts/mv-harnais-crb2.mjs [--contre]
import fs from 'fs';

const SRC = fs.readFileSync(new URL('../src/cave.js', import.meta.url), 'utf8');
const CONTRE = process.argv.includes('--contre');

/* ⚠ Les commentaires sont ôtés AVANT toute assertion textuelle : trois fois
   dans l'histoire du projet, une assertion est passée au vert parce que le
   commentaire qui documentait la correction citait le texte corrigé (§34g). */
const NU = SRC.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

function extrait(nom) {
  const formes = ['function ' + nom + '(', 'window.' + nom + ' = function('];
  let i = -1;
  for (const f of formes) { const k = SRC.indexOf(f); if (k >= 0) { i = k; break; } }
  if (i < 0) throw new Error('introuvable : ' + nom);
  let d = 0;
  for (let k = SRC.indexOf('{', i); k < SRC.length; k++) {
    if (SRC[k] === '{') d++;
    else if (SRC[k] === '}') { d--; if (!d) return SRC.slice(i, k + 1); }
  }
  throw new Error('accolades : ' + nom);
}

const NOMS = ['_crbVal', '_crbMed', '_crbEnv', '_crbTroncons', '_crbSerie', '_crbEnvSvg'];
/* ⚠ Découper dans l'ORDRE RÉEL du fichier : un découpage à l'ordre du tableau
   recollerait les corps dans le désordre. */
NOMS.sort((a, b) => SRC.indexOf('function ' + a + '(') - SRC.indexOf('function ' + b + '('));

let ok = 0, ko = 0;
const T = (nom, cond, det) => {
  if (cond) { ok++; console.log('   vert  ' + nom); }
  else { ko++; console.log('   ROUGE ' + nom + (det ? '  → ' + det : '')); }
};

/* Le socle graphique, réduit à ce que le tracé lui demande. Ce n'est PAS le
   vrai `utils.js` : on ne teste pas le socle ici, on teste ce qu'on lui donne.
   ⚠ `_mvGraphHit` reproduit l'échappement réel — c'est lui qui prouve qu'un nom
   de cuve ne peut pas injecter une balise dans l'infobulle. */
function monter(saboter) {
  let code = NOMS.map(extrait).join('\n');
  if (saboter) code = saboter(code);
  const pre = `
var _ML_D20_SEC = 996, MV_CMP_TMIN = 18, MV_CMP_TMAX = 30;
var _PCRB_S = [], _CRB_SEL = [], _CRB_TOUCHE = false;
var MV_CRB_NMIN = 3, MV_CRB_DLO = 990, MV_CRB_DHI = 1100;
var MV_CRB_TLO = 10, MV_CRB_THI = 35, MV_CRB_H = 276, MV_CRB_TH2 = 244;
var MV_CRB_COLA = 'var(--terre)', MV_CRB_COLB = 'var(--bleu)';
function _mvF1(v){ return (v == null) ? '0' : (Math.round(v * 10) / 10).toString().replace('.', ','); }
function _escHtml(s){ return String(s == null ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
var HITS = [];
var window = {
  _mvGraphCadre: function(w, h, o){
    return { w:w, h:h, padL:o.padL, padR:o.padR, padT:o.padT, padB:o.padB,
             iw:w - o.padL - o.padR, ih:h - o.padT - o.padB, grad:6,
             txt:{ val:13, axe:11, unite:10.5, mini:10 },
             col:{ mesure:'var(--terre)', prevu:'var(--or)', fait:'var(--vert-med)',
                   alerte:'var(--rouge)', grille:'var(--gris-clair)', texte:'var(--texte-doux)' } };
  },
  _mvGraphSvg: function(c, aria, corps){
    return '<svg viewBox="0 0 ' + c.w + ' ' + c.h + '" width="' + c.w + '" height="' + c.h
      + '" role="img" aria-label="' + _escHtml(aria) + '">' + corps + '</svg>';
  },
  _mvGraphHit: function(c, x, y, xa, xb, tt){
    HITS.push({ x:x, y:y, xa:xa, xb:xb, tt:tt });
    return '<rect class="mvg-hit" aria-hidden="true" x="' + xa.toFixed(1) + '" y="0" width="'
      + Math.max(1, xb - xa).toFixed(1) + '" height="' + c.h + '" data-x="' + x.toFixed(1)
      + '" data-y="' + y.toFixed(1) + '" data-tt="' + _escHtml(tt) + '"/>';
  }
};
`;
  const post = `
return { val:_crbVal, med:_crbMed, env:_crbEnv, svg:_crbEnvSvg,
  set:function(S, sel){ _PCRB_S = S; _CRB_SEL = sel || []; HITS = []; },
  hits:function(){ return HITS; } };`;
  return new Function(pre + code + post)();
}

/* ── LE JEU D'ESSAI ────────────────────────────────────────────────────────
   Cinq cuves, encuvages décalés — c'est le décalage qui rend J0 utile. Les
   séries sont au format de `_cmpSerie` : { nom, pts:[{j,d,t}], jDeb, jFin }. */
function serie(nom, pts) {
  return { nom: nom, pts: pts, jDeb: pts[0].j, jFin: pts[pts.length - 1].j,
           dDeb: pts[0].d, dFin: pts[pts.length - 1].d };
}
const S = [
  serie('Cuve A', [{ j:0, d:1090, t:14 }, { j:2, d:1070, t:22 }, { j:4, d:1040, t:29 },
                   { j:6, d:1010, t:27 }, { j:8, d:995,  t:24 }]),
  serie('Cuve B', [{ j:0, d:1096, t:13 }, { j:2, d:1088, t:18 }, { j:4, d:1064, t:26 },
                   { j:6, d:1030, t:31 }, { j:8, d:1000, t:26 }, { j:10, d:993, t:23 }]),
  serie('Cuve C', [{ j:0, d:1086, t:15 }, { j:3, d:1058, t:28 }, { j:6, d:1016, t:25 },
                   { j:9, d:992,  t:22 }]),
  /* Une fermentation qui cale : elle doit rester le HAUT du couloir jusqu'au bout. */
  serie('Cuve D', [{ j:0, d:1092, t:14 }, { j:4, d:1060, t:20 }, { j:8, d:1032, t:19 },
                   { j:12, d:1028, t:18 }]),
  /* Aucune température : elle compte pour la densité, jamais pour la chaleur. */
  serie('Sans T', [{ j:0, d:1088, t:null }, { j:3, d:1050, t:null }, { j:6, d:1005, t:null }])
];

const H = monter();
H.set(S, ['Cuve A', 'Cuve B']);

console.log('\n══ MA VIGNE — Harnais CRB-2 (l’enveloppe de dispersion) ══');

console.log('\n── 1. L’INTERPOLATION, ET SES DEUX BORNES ──');
const p = S[0].pts;
T('un relevé réel est rendu tel quel', H.val(p, 4, 'd').v === 1040 && H.val(p, 4, 'd').reel === true);
T('un jour sans relevé est interpolé entre ses deux voisins', H.val(p, 3, 'd').v === 1055,
  'J3 = ' + (H.val(p, 3, 'd') || {}).v);
T('★ et il se DÉCLARE interpolé', H.val(p, 3, 'd').reel === false);
T('★ jamais avant le premier relevé', H.val([{ j:2, d:1080 }, { j:6, d:1040 }], 1, 'd') === null);
T('★ jamais après le dernier relevé', H.val(p, 9, 'd') === null);
T('une cuve à un seul relevé n’est pas interpolable', H.val([{ j:0, d:1090 }], 0, 'd') === null);
T('une clé absente n’est pas un zéro', H.val(S[4].pts, 3, 't') === null);

console.log('\n── 2. LA MÉDIANE ──');
T('impaire = la valeur du milieu', H.med([3, 1, 2]) === 2);
T('paire = la moyenne des deux du milieu', H.med([1, 2, 3, 4]) === 2.5);
T('vide = null, jamais zéro', H.med([]) === null);

console.log('\n── 3. L’ENVELOPPE ──');
const E = H.env(S, 'd');
T('un jour par jour observé', E.jours.length === 13, 'jours=' + E.jours.length);
T('les cinq cuves sont là à J0', E.jours[0].n === 5, 'n=' + E.jours[0].n);
T('★ min ≤ médiane ≤ max, TOUJOURS',
  E.jours.every(d => d.min <= d.med && d.med <= d.max));
T('relevés réels ≤ cuves prises en compte', E.jours.every(d => d.reels <= d.n));
T('à J0 tout est réel', E.jours[0].reels === 5);
T('★ un jour où personne n’a relevé est compté comme tel',
  E.jours.some(d => d.reels < d.n), 'aucun jour interpolé dans le jeu');
const j12 = E.jours.find(d => d.j === 12);
T('la cuve qui cale tient le HAUT du couloir jusqu’au bout', j12.max === 1028 && j12.n === 1);
/* ⚠ ASSERTION D'ABORD FAUSSE, ET C'EST LE CODE QUI AVAIT RAISON. J'avais
   écrit 8 en comptant de tête. À J9 il reste Cuve B (jFin 10), Cuve C (9) et
   Cuve D (12) : trois cuves, le couloir tient jusqu'à J9. « Quand une assertion
   tombe, se demander D'ABORD laquelle des deux a tort » (§25). */
T('★ le couloir s’arrête quand il reste moins de 3 cuves', E.jCoupe === 9, 'jCoupe=' + E.jCoupe);
T('au-delà de la coupe, moins de 3 cuves',
  E.jours.filter(d => d.j > E.jCoupe).every(d => d.n < 3));
const ET = H.env(S, 't');
T('★ une cuve sans température est comptée, pas tracée', ET.sans === 1, 'sans=' + ET.sans);
T('au plus quatre cuves sur les températures', ET.jours.every(d => d.n <= 4));

console.log('\n── 4. LE TRACÉ ──');
const svg = H.svg(S, 640, 'd');
T('sort un svg', /^<svg /.test(svg));
T('un couloir dessiné', (svg.match(/<polygon/g) || []).length >= 1);
T('une médiane pointillée', /stroke-dasharray="5 4"[^>]*\/>/.test(svg) || svg.includes('stroke-dasharray="5 4"'));
T('le seuil du vin sec est écrit', svg.includes('996 · vin sec'));
T('l’axe compte des jours, pas des dates', svg.includes('jours depuis l’encuvage'));
T('★ DEUX cuves en avant, pas quinze', (svg.match(/stroke-width="2.6"/g) || []).length === 2,
  'traits épais=' + (svg.match(/stroke-width="2.6"/g) || []).length);
T('★ la seconde est tiretée (soleil : deux traits pleins se confondent)',
  svg.includes('stroke-dasharray="7 3.5"'));
T('★ plus AUCUN nom de cuve écrit dans le tracé — c’est le gain des 92 px',
  !svg.includes('>Cuve A</text>') && !svg.includes('>Cuve B</text>'));
T('l’aria nomme les cuves mises en avant', /Mis en avant : Cuve A, Cuve B\./.test(svg));
const svgT = H.svg(S, 640, 't');
T('le tracé des températures sort aussi', /^<svg /.test(svgT) && svgT.includes('>°C</text>'));
T('la fenêtre de travail est une BANDE, pas un seuil', svgT.includes('opacity="0.09"'));
T('★ la même sélection vaut pour les deux tracés', /Mis en avant : Cuve A, Cuve B\./.test(svgT));
H.set(S, []);
const svg0 = H.svg(S, 640, 'd');
T('sans sélection, le couloir seul se tient', /^<svg /.test(svg0)
  && !(svg0.match(/stroke-width="2.6"/g) || []).length
  && svg0.includes('Aucune cuve mise en avant.'));
H.set(S, ['Cuve A', 'Cuve B']);

console.log('\n── 5. LES BORNES DE L’AXE ──');
const svgB = H.svg(S, 640, 'd');
T('l’axe des densités part de 1100 et descend à 990',
  svgB.includes('>1100</text>') && svgB.includes('>1000</text>'));
/* ⚠ L'axe est FIXE, mais il s'ÉLARGIT si la donnée sort — un axe fixe qui coupe
   une valeur est pire qu'un axe mobile. */
const chaud = [serie('Bouillante', [{ j:0, d:1090, t:20 }, { j:2, d:1060, t:38 }, { j:4, d:1020, t:36 }]),
               serie('Normale', [{ j:0, d:1092, t:19 }, { j:2, d:1064, t:27 }, { j:4, d:1028, t:26 }]),
               serie('Froide', [{ j:0, d:1088, t:8 }, { j:2, d:1070, t:12 }, { j:4, d:1040, t:15 }])];
H.set(chaud, []);
const svgC = H.svg(chaud, 640, 't');
T('★ 38 °C ne sort PAS du cadre : l’axe s’élargit', svgC.includes('>40</text>'),
  'graduations : ' + (svgC.match(/>(\d+)<\/text>/g) || []).join(' '));
T('★ et 8 °C non plus, dans l’autre sens : le cadre DESCEND et se gradue',
  svgC.includes('>5</text>'), 'graduations : ' + (svgC.match(/>(\d+)<\/text>/g) || []).join(' '));
H.set(S, ['Cuve A', 'Cuve B']);

console.log('\n── 6. L’INFOBULLE ──');
H.svg(S, 640, 'd');
const hits = H.hits();
T('une zone de touche par jour', hits.length === E.jours.length, 'zones=' + hits.length);
/* ★ Un creux entre deux colonnes, c'est un doigt qui tombe dans le vide. */
const tri = hits.slice().sort((a, b) => a.xa - b.xa);
T('★ les colonnes sont bord à bord, sans creux',
  tri.every((h, i) => i === 0 || Math.abs(h.xa - tri[i - 1].xb) < 0.01),
  'premier creux : ' + (tri.findIndex((h, i) => i > 0 && Math.abs(h.xa - tri[i - 1].xb) >= 0.01)));
const tt = hits.find(h => h.tt.includes('>J4<')).tt;
T('l’étiquette donne la valeur de la cuve suivie', /Cuve A<\/i><b>1040/.test(tt), tt);
T('★ et la médiane du cuvage', tt.includes('médiane'));
T('★ et l’écart EN TOUTES LETTRES, pas juste un signe',
  /en retard sur|en avance sur|sur la médiane du cuvage/.test(tt), tt);
T('★ et les deux comptes', /cuves dans le couloir/.test(tt));
const ttI = hits.find(h => h.tt.includes('>J1<')).tt;
T('★ une valeur estimée porte sa marque', ttI.includes('~'), ttI);

console.log('\n── 7. LE NOM D’UNE CUVE NE PEUT PAS INJECTER DE BALISE ──');
const mechant = [serie('Cuve <b>"Haute"</b>', [{ j:0, d:1090, t:20 }, { j:4, d:1020, t:28 }]),
                 serie('Normale', [{ j:0, d:1092, t:19 }, { j:4, d:1028, t:26 }])];
H.set(mechant, ['Cuve <b>"Haute"</b>']);
const svgM = H.svg(mechant, 640, 'd');
T('★ le nom est échappé DEUX fois : par l’appelant, puis par le socle',
  svgM.includes('&amp;lt;b&amp;gt;') && !/data-tt="[^"]*<b>/.test(svgM));
T('l’aria ne se referme pas sur un guillemet',
  (svgM.match(/aria-label="/g) || []).length === 1 && svgM.includes('&quot;Haute&quot;'));
H.set(S, ['Cuve A', 'Cuve B']);

console.log('\n── 8. LE CAHIER DE CUVERIE NE PASSE PAS PAR LE COULOIR ──');
T('★ `_cuvDoc` appelle `_cmpSvg`, la superposition nommée',
  /_cmpSvg\(S, MV_CUVDOC_GRW\)/.test(NU));
T('★ et jamais `_crbEnvSvg`', !/MV_CUVDOC_GRW[\s\S]{0,200}_crbEnvSvg/.test(NU));
T('l’écran, lui, passe par `_crbRepeint`', /if\(_PCRB_S\) _crbRepeint\(\);/.test(NU));
T('`_crbRepeint` n’oublie QUE les deux graphes du couloir',
  /_mvGraphOublier\('#pcrb-g-' \+ x\[0\]\)/.test(NU) && !/_crbRepeint[\s\S]{0,400}'#pcrb-g-'\)/.test(NU));

console.log('\n── 8b. LES TEMPÉRATURES ARRIVENT SUR LE PAPIER ──');
/* `_cmpTempSvg` n'avait plus d'appelant depuis que l'écran est passé au couloir.
   Arbitrage de Nico : on la met sur le cahier plutôt que de la supprimer. Le
   bloc s'exécute POUR DE BON, avec un faux tracé — c'est la garde du vide qu'on
   teste, pas le dessin. */
function bloc(svgRendu, saboter) {
  let corps = extrait('_cmpTempBlocDoc');
  if (saboter) corps = saboter(corps);
  return new Function(`
    var MV_CUVDOC_GRW = 640, MV_CMP_TMIN = 18, MV_CMP_TMAX = 30;
    function _cmpTempSvg(){ return ${JSON.stringify(svgRendu)}; }
    ${corps}
    return _cmpTempBlocDoc([]);`)();
}
T('★ `_cmpBloc` imprime désormais les températures', /\+ _cmpTempBlocDoc\(S\)/.test(NU));
T('le bloc porte l’habillage d’impression', bloc('<svg/>').includes('cmp-gr mvdoc-avoid'));
T('★ et il dit ce que la bande verte veut dire', bloc('<svg/>').includes('fenêtre de travail'));
T('★ UN TRACÉ VIDE N’IMPRIME NI TITRE NI NOTE', bloc('') === '', bloc(''));
T('la note rappelle qu’un relevé sans température n’est pas un zéro',
  bloc('<svg/>').includes('n’est pas une température de zéro'));
T('★ le papier garde la SUPERPOSITION, pas le couloir',
  !/_cmpTempBlocDoc[\s\S]{0,700}_crbEnvSvg/.test(NU));

console.log('\n── 9. LA SÉLECTION ──');
T('★ deux cuves au maximum, la plus ancienne est relâchée',
  /if\(_CRB_SEL\.length > 2\) _CRB_SEL\.shift\(\);/.test(NU));
T('★ la sélection est nettoyée quand les séries changent',
  /_CRB_SEL=_CRB_SEL\.filter\(function\(n\)\{ return noms\[n\]; \}\);/.test(NU));
T('★ le défaut ne s’applique que si l’utilisateur n’a rien touché',
  /if\(!_CRB_SEL\.length && !_CRB_TOUCHE/.test(NU));
T('`_crbTap` est exposé sur window (onclick après build IIFE)',
  /window\._crbTap = function\(nom\)\{/.test(NU));
T('★ la barre se met à jour par ATTRIBUT, jamais par innerHTML (le défilement)',
  /el\.setAttribute\('data-on', on\)/.test(NU) && !/crb-sc-[^)]*\)\.innerHTML/.test(NU));
T('les deux barres et le tableau partagent le même marqueur `data-crbn`',
  (NU.match(/data-crbn="/g) || []).length >= 2 && /querySelectorAll\('\[data-crbn\]'\)/.test(NU));

console.log('\n── 10. CE QUE L’ÉCRAN DIT DE LUI-MÊME (§27a) ──');
T('★ la pastille du tableau ne prétend plus désigner une couleur de courbe',
  /var _PCRB_COL=\['var\(--gris\)'\];/.test(NU));
T('l’interpolation est ÉCRITE à l’écran, pas seulement en commentaire',
  /estim\\u00e9e entre ses|estimée entre ses/.test(NU) && /_crbNoteInterp\(\)/.test(NU));
T('les deux cartes portent la note d’interpolation',
  (NU.match(/_crbNoteInterp\(\)/g) || []).length >= 3);
T('le slot du couloir ne déborde plus de ses gouttières',
  /\.pcrb-g\.crb-g\{overflow-x:visible/.test(NU));

/* ═══ LES CONTRE-ÉPREUVES ══════════════════════════════════════════════════
   Chacune réintroduit un défaut et EXIGE que le harnais rougisse. Un filet qui
   reste vert sur du code saboté ne prouve rien. */
if (CONTRE) {
  console.log('\n══ CONTRE-ÉPREUVES ══');
  let n = 0, rouges = 0;
  const C = (nom, fn) => {
    n++;
    let rouge = false;
    try { rouge = !fn(); } catch (e) { rouge = true; }
    if (rouge) { rouges++; console.log('   rouge  ' + nom); }
    else console.log('   RESTE VERTE  ' + nom);
  };
  C('extrapoler avant le premier relevé', () => {
    const G = monter(c => c.replace('if(j < P[0].j || j > P[P.length - 1].j) return null;', ''));
    return G.val([{ j:2, d:1080 }, { j:6, d:1040 }], 1, 'd') === null;
  });
  /* ⚠⚠ SABOTAGE D'ABORD MAL CHOISI, CHANGÉ APRÈS MESURE. Retirer la garde
     haute laissait le harnais VERT : la boucle épuise ses points et rend `null`
     toute seule. La garde est donc de la défense en profondeur, pas un test
     aveugle — « se demander pourquoi avant de conclure » (§6b). Le sabotage qui
     mord fait rendre la DERNIÈRE valeur au lieu de rien. */
  C('prolonger la courbe par son dernier relevé au lieu de s’arrêter', () => {
    const G = monter(c => c.replace('if(j < P[0].j || j > P[P.length - 1].j) return null;',
      'if(j < P[0].j) return null; if(j > P[P.length - 1].j) return { v:P[P.length - 1][cle], reel:false };'));
    return G.val(p, 9, 'd') === null;
  });
  C('ne plus couper le couloir sous trois cuves', () => {
    const G = monter(c => c.replace('if(vals.length >= MV_CRB_NMIN) jc = j;', 'jc = j;'));
    return G.env(S, 'd').jCoupe === 8;
  });
  C('compter une clé absente comme un zéro', () => {
    const G = monter(c => c.replace('if(pts[i][cle] != null) P.push(pts[i]);', 'P.push(pts[i]);'));
    const e = G.env(S, 't');
    return e.jours.every(d => d.min >= 8);
  });
  C('laisser passer une troisième cuve en avant', () => {
    H.set(S, ['Cuve A', 'Cuve B', 'Cuve C']);
    const s3 = H.svg(S, 640, 'd');
    H.set(S, ['Cuve A', 'Cuve B']);
    return (s3.match(/stroke-width="2.6"/g) || []).length === 2;
  });
  C('ne plus échapper le nom dans l’étiquette', () => {
    const G = monter(c => c.replace("tt += '<div class=\"r\"><i>' + _escHtml(nom) + '</i><b>'",
                                    "tt += '<div class=\"r\"><i>' + nom + '</i><b>'"));
    G.set(mechant, ['Cuve <b>"Haute"</b>']);
    const sm = G.svg(mechant, 640, 'd');
    return !/data-tt="[^"]*&lt;b&gt;/.test(sm);
  });
  C('laisser des creux entre les colonnes de touche', () => {
    const G = monter(c => c.replace('var demi = (iw / jMax) / 2;', 'var demi = (iw / jMax) / 4;'));
    G.set(S, ['Cuve A']);
    G.svg(S, 640, 'd');
    const t2 = G.hits().slice().sort((a, b) => a.xa - b.xa);
    return t2.every((h, i) => i === 0 || Math.abs(h.xa - t2[i - 1].xb) < 0.01);
  });
  C('ne plus élargir l’axe vers le haut : 38 °C sortirait du cadre', () => {
    const G = monter(c => c.replace('if(hi + marge > aHi) aHi =', 'if(false) aHi ='));
    G.set(chaud, []);
    return G.svg(chaud, 640, 't').includes('>40</text>');
  });
  /* ⚠ PREMIERE VERSION MUETTE : elle rejouait le code intact au lieu de le
     casser. Un sabotage qui ne change rien n'est pas une contre-épreuve. */
  C('retirer la garde du vide : un titre s’imprimerait au-dessus de rien', () =>
    bloc('', c => c.replace("if(!svg) return '';", '')) === '');
  C('ne plus le descendre : 8 °C sortirait par le bas', () => {
    const G = monter(c => c.replace('if(lo - marge < aLo) aLo =', 'if(false) aLo ='));
    G.set(chaud, []);
    return G.svg(chaud, 640, 't').includes('>5</text>');
  });
  console.log('\n   ' + rouges + ' / ' + n + ' défauts attrapés'
    + (rouges === n ? '' : '  ❌ — une contre-épreuve verte ne prouve rien'));
  if (rouges !== n) ko++;
}

console.log('\n' + (ko ? ('ROUGE ' + ko) : 'VERT ') + '  —  ' + (ok + ko) + ' assertions, ' + ko + ' échecs\n');
process.exit(ko ? 1 : 0);
