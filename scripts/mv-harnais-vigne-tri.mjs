/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LE TRI DES PARCELLES, ET L'APPARTENANCE D'UNE TÂCHE À UNE PÉRIODE
   Lancer :          node scripts/mv-harnais-vigne-tri.mjs
   Contre-épreuves : node scripts/mv-harnais-vigne-tri.mjs --contre

   POURQUOI IL EXISTE (lot VIG-TRI + VIG-TACHE, 10/09/2026)
   ① Le comparateur de `renderParcelles` lisait `{'Non démarré':0,'En cours':1}`.
      Commencé valait 1 : la parcelle sur laquelle on venait d'appuyer « Début »
      partait EN DERNIER. Le commentaire au-dessus — « Non démarré > En cours » —
      décrivait fidèlement un tri que personne ne voulait. Et sur une tâche à
      passages ou à niveaux, `_tachesFor(p)[t]` rend un OBJET : `ordre[objet]`
      vaut `undefined`, ramené à 0 des DEUX côtés — l'état ne comptait pas.
   ② `saveTache()` poussait la tâche dans TACHES et RIEN D'AUTRE, alors que
      l'écran lit `getTachesSaison()`, filtré par `s.taches` de la période. Une
      tâche créée hors convention disparaissait donc au moment même où on
      l'enregistrait. `tcfgSave()`, lui, la posait — deux chemins pour un même
      effet, dont un seul le faisait.

   ★★★ CE QUI EST GRAVÉ ICI
   1. La parcelle commencée passe en tête, AU-DESSUS de la tournée et du GPS.
   2. L'état se lit par `_pvCurStarted` / `_pvCurDone` — les mêmes définitions
      que les boutons de la carte. Une seconde table d'états ferait deux vérités.
   3. Les trois natures de tâche (simple, passages, niveaux) se trient pareil.
   4. `_perPoseTache` est l'écrivain UNIQUE de l'appartenance à une période, et
      il pose les dates dans le même passage.

   Méthode C20 : fonctions extraites des vrais fichiers et exécutées, bouchons
   minimaux. Aucune formule réécrite ici.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const APP = readFileSync('src/app.js', 'utf8');
const REG = readFileSync('src/reglages.js', 'utf8');

let vert = 0, total = 0;
const rouges = [];
function pose(ok, nom) {
  total++;
  if (ok) { vert++; console.log('   \u2713 ' + nom); }
  else { rouges.push(nom); console.log('   \u2717 ' + nom); }
}

/* ══ EXTRACTION ════════════════════════════════════════════════════════════ */
function bloc(src, depart, fin, quoi) {
  const i = src.indexOf(depart);
  if (i < 0) throw new Error('ancre introuvable : ' + quoi);
  const j = src.indexOf(fin, i + depart.length);
  if (j < 0) throw new Error('fin introuvable : ' + quoi);
  return src.slice(i, j + fin.length);
}
function fonction(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('fonction introuvable : ' + nom);
  let p = 0, dans = false;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') { p++; dans = true; }
    else if (src[k] === '}') { p--; if (dans && p === 0) return src.slice(i, k + 1); }
  }
  throw new Error('accolades non refermees : ' + nom);
}

const CMP = bloc(APP, '  const data=_dataF.sort((a,b)=>{', '\n  });\n', 'comparateur');
const PVSTATE = [ '_pvDef', '_pvType', '_pvPrefix', '_pvSeasonPlan', '_pvEffPlan',
                  '_pvStepState', '_pvCurDone', '_pvCurStarted' ].map(n => fonction(APP, n)).join('\n');
const POSE = fonction(REG, '_perPoseTache');

/* ══ MONTAGE — le comparateur, avec ses bouchons ═══════════════════════════ */
function monterTri(mutation) {
  const corps = (mutation ? mutation(CMP) : CMP);
  const src = `
    var TACHES=[{nom:'Taille',hha:60},{nom:'Relevage',type:'niveaux',niveaux:[{num:1,hha:50},{num:2,hha:20}]}];
    var SAISON_PASSAGES={};
    var _VISU=null, ACTIVE='Hiver 2026';
    function _tachesFor(p){ return p.taches||{}; }
    function getPCls(p){ return {pct:p.pct||0}; }
    ${PVSTATE}
    var _pProxPos=null, _pOrdRangs={ok:false,rang:{}}, pTacheFilter='Taille', pCurStep=1;
    function _pProxDistOf(p){ return p.dist!=null?p.dist:9999; }
    function _pOrdRang(n){ var r=_pOrdRangs.rang[n]; return (r>0)?r:null; }
    return function(parcelles, ctx){
      _pProxPos=ctx.prox?{}:null; _pOrdRangs=ctx.ord||{ok:false,rang:{}};
      pTacheFilter=ctx.tache||'Taille'; pCurStep=ctx.step||1;
      var _dataF=parcelles.slice(), data;
      ${corps.replace('const data=_dataF.sort', 'data=_dataF.sort')}
      return data.map(function(p){return p.nom;});
    };`;
  return new Function('PARCELLES', src)();
}

/* Trois parcelles, tournée A(1) C(2) B(3), GPS : B au plus loin. B est commencée. */
const jeu = (etat) => ([
  { nom: 'A-Combottes', taches: { Taille: 'Non démarré' }, dist: 100, pct: 0 },
  { nom: 'B-Corbeaux',  taches: { Taille: etat },          dist: 900, pct: 0 },
  { nom: 'C-Evocelles', taches: { Taille: 'Non démarré' }, dist: 300, pct: 0 }
]);
const ORD = { ok: true, rang: { 'A-Combottes': 1, 'C-Evocelles': 2, 'B-Corbeaux': 3 } };

console.log('\n  LE TRI DES PARCELLES\n');
const tri = monterTri(null);

pose(tri(jeu('En cours'), { ord: ORD })[0] === 'B-Corbeaux',
  'la parcelle commenc\u00e9e passe devant la tourn\u00e9e du domaine');
pose(tri(jeu('En cours'), { prox: true })[0] === 'B-Corbeaux',
  'elle passe aussi devant la proximit\u00e9 GPS, m\u00eame \u00e0 900 m');
pose(tri(jeu('Non démarré'), { ord: ORD }).join(' ') === 'A-Combottes C-Evocelles B-Corbeaux',
  'sans t\u00e2che commenc\u00e9e, la tourn\u00e9e reprend la main \u2014 rien d\u2019autre ne bouge');
pose(tri(jeu('Validé'), { ord: ORD })[2] === 'B-Corbeaux',
  'une t\u00e2che valid\u00e9e passe en dernier');

/* Multi-étapes : l'ancienne table ne voyait rien ici (ordre[objet] = undefined). */
const jeuNiv = [
  { nom: 'D-Justice',  taches: { Relevage: { n1: 'Commencé' } }, dist: 500, pct: 0 },
  { nom: 'E-Perriere', taches: { Relevage: {} },                 dist: 100, pct: 0 }
];
pose(monterTri(null)(jeuNiv, { tache: 'Relevage', step: 1, ord: { ok: true, rang: { 'D-Justice': 2, 'E-Perriere': 1 } } })[0] === 'D-Justice',
  'un NIVEAU commenc\u00e9 remonte aussi \u2014 l\u2019\u00e9tat n\u2019est plus un objet illisible');
pose(monterTri(null)(jeuNiv, { tache: 'Relevage', step: 2, ord: { ok: true, rang: { 'D-Justice': 2, 'E-Perriere': 1 } } })[0] === 'E-Perriere',
  'au niveau 2, rien n\u2019est commenc\u00e9 : la tourn\u00e9e reprend la main (l\u2019\u00e9tape compte)');

/* Les deux assertions ci-dessous portent sur le COMPARATEUR, pas sur le fichier :
   la section du lot cite l'ancienne table dans un commentaire, et `if(_pProxPos){`
   existe ailleurs dans app.js. Un test qui cherche trop large rougit sur du texte. */
/* ⚠️ Sur le comparateur PRIVÉ DE SES COMMENTAIRES : celui du lot cite l'ancienne
   table pour expliquer ce qu'elle faisait. Un grep brut compte les commentaires
   (§ des pièges d'ancre) et rougirait sur une explication. */
const CMP_VIF = CMP.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
pose(!/ordre\[\(_tachesFor/.test(CMP_VIF) && !/'Non démarré':0,'En cours':1/.test(CMP_VIF),
  'l\u2019ancienne table d\u2019\u00e9tats a disparu du code, elle ne survit qu\u2019en commentaire');
pose(CMP.indexOf('_pvCurStarted(a,pTacheFilter)') >= 0
  && CMP.indexOf('_pvCurStarted(a,pTacheFilter)') < CMP.indexOf('if(_pProxPos){'),
  'le test du commenc\u00e9 est \u00e9crit AVANT la proximit\u00e9 dans le comparateur');

/* ══ L'APPARTENANCE À UNE PÉRIODE ══════════════════════════════════════════ */
console.log('\n  UNE T\u00c2CHE, SES P\u00c9RIODES\n');
function monterPose(mutation) {
  const corps = mutation ? mutation(POSE) : POSE;
  return new Function('window', corps + '\n return _perPoseTache;');
}
function cave() {
  return { SAISONS: [
    { nom: 'Hiver 2026', taches: ['Taille'] },
    { nom: 'Saison verte 2026', taches: [] },
    { nom: 'Vendanges 2026' }
  ] };
}
let w = cave(), poser = monterPose(null)(w);
pose(poser('Pose de manchons', ['Hiver 2026', 'Saison verte 2026'], null) === true
  && w.SAISONS[0].taches.join() === 'Taille,Pose de manchons'
  && w.SAISONS[1].taches.join() === 'Pose de manchons',
  'la t\u00e2che est pos\u00e9e dans TOUTES les p\u00e9riodes coch\u00e9es, en un passage');
pose(w.SAISONS[2].taches === undefined || w.SAISONS[2].taches.length === 0,
  'une p\u00e9riode non coch\u00e9e n\u2019est pas touch\u00e9e');
pose(poser('Pose de manchons', ['Hiver 2026'], null) === false
  && w.SAISONS[0].taches.filter(x => x === 'Pose de manchons').length === 1,
  'reposer la m\u00eame t\u00e2che ne la duplique pas et n\u2019annonce aucune \u00e9criture');
w = cave(); poser = monterPose(null)(w);
poser('Taille', ['Hiver 2026'], { 'Hiver 2026': { d1: '2026-01-05', d2: '2026-03-10' } });
pose(w.SAISONS[0].echeances && w.SAISONS[0].echeances.Taille.d1 === '2026-01-05'
  && w.SAISONS[0].echeances.Taille.d2 === '2026-03-10',
  'les dates estim\u00e9es sont pos\u00e9es dans le m\u00eame passage');
w = cave(); poser = monterPose(null)(w);
pose(poser('Taille', ['Hiver 2026'], { 'Hiver 2026': {} }) === false
  && !w.SAISONS[0].echeances,
  'deux dates vides n\u2019inventent pas d\u2019\u00e9ch\u00e9ance');
w = cave(); w.SAISONS[2].taches = 'pas-un-tableau'; poser = monterPose(null)(w);
poser('Taille', ['Vendanges 2026'], null);
pose(Array.isArray(w.SAISONS[2].taches) && w.SAISONS[2].taches.join() === 'Taille',
  'une liste ab\u00eem\u00e9e est refaite plut\u00f4t que d\u2019exploser');

/* Les deux portes passent par le même écrivain — plus aucune écriture directe. */
pose(/function tcfgSave\(\)\{[\s\S]{0,400}_perPoseTache\(_tcfg\.nom,\[_per\.nom\]/.test(REG),
  'le bar\u00e8me (tcfgSave) passe par l\u2019\u00e9crivain unique');
pose(/_perPoseTache\(nom,pers,_tn\.dates\)/.test(REG),
  'le panneau « Nouvelle t\u00e2che » passe par le m\u00eame \u00e9crivain');
pose(!/function saveTache\(\)/.test(REG),
  'l\u2019ancien saveTache(), qui n\u2019\u00e9crivait que TACHES, n\u2019existe plus');
pose(/_esBuildTaches\(\); _esBuildEch\(\);/.test(REG),
  'cocher une t\u00e2che dans une p\u00e9riode reconstruit ses lignes de dates');

/* ══ CONTRE-ÉPREUVES ═══════════════════════════════════════════════════════ */
if (CONTRE) {
  console.log('\n  CONTRE-\u00c9PREUVES \u2014 chaque d\u00e9faut r\u00e9introduit doit faire rougir\n');
  const cas = [
    ['le test du commenc\u00e9 remis APR\u00c8S la tourn\u00e9e',
      s => s.replace(/    if\(pTacheFilter!=='toutes'\)\{\n      const ca=[\s\S]*?\n    \}\n/, ''),
      f => f(jeu('En cours'), { ord: ORD })[0] === 'B-Corbeaux',
      'la commenc\u00e9e retombe au rang 3 de la tourn\u00e9e'],
    ['la table invers\u00e9e d\u2019avant',
      s => s.replace('const ca=_pvCurStarted(a,pTacheFilter)?0:1, cb=_pvCurStarted(b,pTacheFilter)?0:1;',
                     'const ca=_pvCurStarted(a,pTacheFilter)?1:0, cb=_pvCurStarted(b,pTacheFilter)?1:0;'),
      f => f(jeu('En cours'), { prox: true })[0] === 'B-Corbeaux',
      'commenc\u00e9 = 1 : la parcelle repart en dernier'],
    ['l\u2019\u00e9tat relu \u00e0 la main au lieu de _pvCurStarted',
      s => s.replace('_pvCurStarted(a,pTacheFilter)?0:1', "(_tachesFor(a)[pTacheFilter]==='En cours')?0:1")
            .replace('_pvCurStarted(b,pTacheFilter)?0:1', "(_tachesFor(b)[pTacheFilter]==='En cours')?0:1"),
      f => f(jeuNiv, { tache: 'Relevage', step: 1, ord: { ok: true, rang: { 'D-Justice': 2, 'E-Perriere': 1 } } })[0] === 'D-Justice',
      'les niveaux redeviennent invisibles au tri']
  ];
  for (const [nom, mut, verif, effet] of cas) {
    if (mut(CMP) === CMP) { pose(false, nom + ' \u2014 motif introuvable, la contre-\u00e9preuve ne peut pas rougir'); continue; }
    let rougit = false;
    try { rougit = !verif(monterTri(mut)); } catch (e) { rougit = true; }
    console.log('   ' + nom + ' \u2192 ' + effet);
    pose(rougit, nom + ' fait bien rougir');
  }
  const casPose = [
    ['la garde anti-doublon retir\u00e9e',
      s => s.replace('if(s.taches.indexOf(nom)<0){ s.taches.push(nom); touche=true; }', 's.taches.push(nom); touche=true;'),
      w2 => { const p = monterPose(s => s.replace('if(s.taches.indexOf(nom)<0){ s.taches.push(nom); touche=true; }', 's.taches.push(nom); touche=true;'))(w2);
              p('Taille', ['Hiver 2026'], null); return w2.SAISONS[0].taches.filter(x => x === 'Taille').length === 1; },
      'la t\u00e2che est inscrite deux fois dans la m\u00eame p\u00e9riode']
  ];
  for (const [nom, mut, verif, effet] of casPose) {
    if (mut(POSE) === POSE) { pose(false, nom + ' \u2014 motif introuvable'); continue; }
    let rougit = false;
    try { rougit = !verif(cave()); } catch (e) { rougit = true; }
    console.log('   ' + nom + ' \u2192 ' + effet);
    pose(rougit, nom + ' fait bien rougir');
  }
}

console.log('\n' + vert + '/' + total + ' assertions vertes');
if (rouges.length) { console.error('ROUGE : ' + rouges.join(' | ')); process.exit(1); }
