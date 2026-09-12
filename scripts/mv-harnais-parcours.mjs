/* ══════════════════════════════════════════════════════════════════════
   HARNAIS — PARC-1 : le parcours DATE d'une cuve de vinification.

   Ce qu'il garde :
     1. Un changement d'etape ecrit une ligne, a la date choisie.
     2. Deux enregistrements sans changement n'ecrivent RIEN.
     3. La duree inconnue rend `null`, JAMAIS zero.
     4. Un retour en arriere lit le DERNIER passage, pas le premier.
     5. Une date hors bornes est refusee AVANT toute ecriture.
     6. `statut_hist` survit a la refonte de l'objet dans saveVendCuve.
     7. Aucun rattrapage invente sur une cuve d'avant le lot.
     8. `_mlProjFA` compte les jours de FERMENTATION, pas de cuvaison.

   Methode C20 : les VRAIES fonctions sont extraites de src/cave.js et
   executees. Aucun motif de texte — un controle qui lit du texte aurait
   dit vert sur la moitie de ces defauts.

   ⚠️ CONTRE-EPREUVE OBLIGATOIRE, une par defaut, JOUEES SEPAREMENT :
   reintroduire six defauts d'un coup et constater « c'est rouge » ne
   prouve rien (§80d). Un sabotage dont l'ancre a disparu doit echouer
   BRUYAMMENT, pas se taire.
   ⚠️ Toutes les dates du decor sont RELATIVES a aujourd'hui : un harnais
   qui fige une annee devient faux le 1er janvier (§80g).
   ══════════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const F_CAVE = fileURLToPath(new URL('../src/cave.js', import.meta.url));

let ok = 0, ko = 0;
const dit = [];
function T(nom, cond, detail) {
  if (cond) { ok++; }
  else { ko++; dit.push('  \u2717 ' + nom + (detail ? ' \u2014 ' + detail : '')); }
}

function bloc(src, debut, fin) {
  const i = src.indexOf(debut);
  if (i < 0) throw new Error('bloc introuvable : ' + debut.slice(0, 60));
  const j = src.indexOf(fin, i);
  if (j < 0) throw new Error('fin introuvable pour : ' + debut.slice(0, 60));
  return src.slice(i, j + fin.length);
}

/* ── dates relatives ──────────────────────────────────────────────────── */
function iso(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    + '-' + String(d.getDate()).padStart(2, '0');
}
function jourMoins(n) { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); }
function jourPlus(n) { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); }
const AUJ = iso(new Date());

/* ── montage ──────────────────────────────────────────────────────────── */
function monte(SRC) {
  const MORCEAUX = [
    bloc(SRC, 'function _vendFrDate(s){', '\n'),
    bloc(SRC, 'function _vendStatLbl(st){', '\n'),
    bloc(SRC, 'function _vendIsActive(c)', '\n'),
    bloc(SRC, 'function _vendHist(c){', '\n}'),
    bloc(SRC, 'function _vendStatIdx(c,st){', '\n}'),
    bloc(SRC, 'function _vendStatDeb(c,st){', '\n'),
    bloc(SRC, 'function _vendStatFin(c,st){', '\n'),
    bloc(SRC, 'function _vendStatDuree(c,st,auj){', '\n}'),
    bloc(SRC, 'function _vendHistPose(c,st,date){', '\n}'),
    bloc(SRC, 'function _vendTriDate(a,b){', '\n}'),
    bloc(SRC, 'function _vendTriMes(c){', '\n}'),
    bloc(SRC, 'function _vendLastMes(c){', '\n'),
    bloc(SRC, 'function _vendEstFusionnee(c)', '\n'),
    bloc(SRC, 'function _vendStepper(c){', '\n}'),
    bloc(SRC, 'function _vendParcLigne(c){', '\n}'),
    bloc(SRC, 'function _vendParcHist(c,canEdit){', '\n}'),
    bloc(SRC, 'var _VEND_DCORR', '\n'),
    bloc(SRC, 'function _vendCorrTerm(t){', '\n}'),
    bloc(SRC, 'function _vendD20(densite,temp){', '\n}'),
    bloc(SRC, 'function _vendMesD20(m){', '\n'),
    bloc(SRC, 'function _mlD(iso){', '\n'),
    bloc(SRC, 'function _mlIso(d){', '\n}'),
    bloc(SRC, 'function _mlAuj(){', '\n'),
    bloc(SRC, 'function _mlAddJ(iso,n){', '\n'),
    bloc(SRC, 'function _mlEcartJ(a,b){', '\n'),
    bloc(SRC, 'function _mlProjFA(c,now){', '\n}'),
    bloc(SRC, 'function saveVendCuve() {', '\n}'),
    bloc(SRC, 'function saveVendStat(){', '\n}'),
  ];

  const PRELUDE = `
var CAVE_VENDANGE = { cuves_vinif: [], recoltes: [] };
var CAVE_ELEVAGE  = { cuvees: [] };
var TOASTS = [], CHAMPS = {}, RENDUS = 0;
var _VEND_STAT = ${JSON.stringify({
    setup: { i: 0, lbl: 'Setup' }, mpf: { i: 1, lbl: 'MPF' }, fa: { i: 2, lbl: 'FA' },
    decuvage: { i: 3, lbl: 'D\u00e9cuvage' }, fml: { i: 4, lbl: 'FML' }, termine: { i: 5, lbl: 'Termin\u00e9' }
  })};
var _VEND_STEPS = [['setup','Setup'],['mpf','MPF'],['fa','FA'],['decuvage','D\u00e9cuv.'],['fml','FML'],['termine','Fini']];
var _ML_D20_SEC = 996;
/* CUV-8 : bouchon. Ce harnais mesure le PARCOURS DATE d'une cuve, pas le
   seuil du vin sec — celui-ci a son harnais (mv-harnais-cuv8). Rendre 996,
   c'est garder ici exactement le comportement d'avant CUV-8. */
function _vendDSec(){ return 996; }
var _vcuvRef = null, _vcuvFromGrp = null, _vcuvMpfActive = false;
var _vstCuveId = null, _vstEditId = null, _vstSel = '';
function showToast(m, c){ TOASTS.push(String(m)); }
function _vendGarde(){ return true; }
function _vendFbSave(m){ if(m) TOASTS.push(String(m)); }
function _vendSheetClose(){}
function renderVendCuves(){ RENDUS++; }
function _caveCuveOcc(){ return false; }
function _caveCuve(){ return null; }
function _escHtml(s){ return String(s==null?'':s); }
function _escAttr(s){ return String(s==null?'':s); }
function _mvIcon(){ return '<svg></svg>'; }
var document = { getElementById: function(id){ return (id in CHAMPS) ? { value: CHAMPS[id] } : null; } };
var window = { CAVE_VENDANGE: null, closeOv: null };
`;

  const CODE = PRELUDE + MORCEAUX.join('\n') + `
;return {
  _vendHist, _vendStatIdx, _vendStatDeb, _vendStatFin, _vendStatDuree, _vendHistPose,
  _vendStepper, _vendParcLigne, _vendParcHist, _mlProjFA, _vendStatLbl,
  saveVendCuve, saveVendStat,
  etat: function(){ return { CAVE_VENDANGE, TOASTS, RENDUS }; },
  pose: function(cv, champs, vst){
    CAVE_VENDANGE = cv; CHAMPS = champs || {}; TOASTS = []; RENDUS = 0;
    _vstCuveId = vst ? vst.cuve : null;
    _vstEditId = vst ? (vst.hist || null) : null;
    _vstSel    = vst ? (vst.sel  || '')   : '';
  }
};
`;
  return new Function(CODE)();
}

const SRC = fs.readFileSync(F_CAVE, 'utf8');
let API;
try { API = monte(SRC); }
catch (e) { console.error('\u2717 le harnais n\'a pas pu charger les fonctions : ' + e.message); process.exit(1); }

/* ── decor ────────────────────────────────────────────────────────────── */
function cuveMpfPuisFa() {
  return {
    id: 'c1', nom: 'Les Damodes', statut: 'fa', volume_hl: 60,
    date_entree: jourMoins(9), parcelles: ['Les Damodes'],
    mpf: { active: true, temp_c: 8, duree_j: 4 },
    mesures_fa: [], operations: [],
    statut_hist: [
      { id: 'h1', statut: 'mpf', date: jourMoins(9) },
      { id: 'h2', statut: 'fa', date: jourMoins(5) }
    ]
  };
}
/* Une cuve d'AVANT le lot : un statut, aucune histoire. */
function cuveLegacy() {
  return {
    id: 'c9', nom: 'Aux Boudots', statut: 'fa', volume_hl: 40,
    date_entree: jourMoins(12), parcelles: [], mesures_fa: [], operations: []
  };
}

/* ═══════════ 1. La lecture du parcours ═══════════════════════════════ */
{
  const c = cuveMpfPuisFa();
  T('A1 debut de MPF = la 1re ligne', API._vendStatDeb(c, 'mpf') === jourMoins(9));
  T('A2 debut de FA = la 2e ligne', API._vendStatDeb(c, 'fa') === jourMoins(5));
  T('A3 fin de MPF = le passage suivant', API._vendStatFin(c, 'mpf') === jourMoins(5));
  T('A4 FA n\'a pas de fin', API._vendStatFin(c, 'fa') === null);
  T('A5 MPF a dure 4 jours', API._vendStatDuree(c, 'mpf') === 4,
    'rendu : ' + API._vendStatDuree(c, 'mpf'));
  T('A6 FA court depuis 5 jours', API._vendStatDuree(c, 'fa') === 5,
    'rendu : ' + API._vendStatDuree(c, 'fa'));
  T('A7 une etape jamais franchie rend null', API._vendStatDeb(c, 'decuvage') === null);
  T('A8 sa duree rend null, PAS zero', API._vendStatDuree(c, 'decuvage') === null,
    'rendu : ' + JSON.stringify(API._vendStatDuree(c, 'decuvage')));
}

/* ═══════════ 2. Aucun rattrapage invente ═════════════════════════════ */
{
  const c = cuveLegacy();
  T('B1 cuve d\'avant le lot : aucune date de FA', API._vendStatDeb(c, 'fa') === null);
  T('B2 sa duree ne s\'invente pas', API._vendStatDuree(c, 'fa') === null);
  T('B3 la ligne de parcours ne s\'affiche pas', API._vendParcLigne(c) === '');
  T('B4 le parcours vide ne rend rien', API._vendParcHist(c, true) === '');
  const f = API._vendStepper(c);
  T('B5 la frise sort quand meme', f.indexOf('mvv-steps') !== -1);
  T('B6 et elle ecrit un tiret, pas date_entree',
    f.indexOf('\u2014') !== -1 && f.indexOf(API._vendStatLbl('fa') + ' ' + jourMoins(12)) === -1);
  T('B7 la date d\'encuvage n\'apparait NULLE PART dans la frise',
    f.indexOf(jourMoins(12).slice(8) + '/' + jourMoins(12).slice(5, 7)) === -1,
    'la frise a invente une date');
}

/* ═══════════ 3. Le retour en arriere lit le DERNIER passage ══════════ */
{
  const c = cuveMpfPuisFa();
  c.statut_hist.push({ id: 'h3', statut: 'mpf', date: jourMoins(3) });
  c.statut_hist.push({ id: 'h4', statut: 'fa', date: jourMoins(1) });
  c.statut = 'fa';
  T('C1 FA est lue au DERNIER passage', API._vendStatDeb(c, 'fa') === jourMoins(1),
    'rendu : ' + API._vendStatDeb(c, 'fa'));
  T('C2 MPF aussi', API._vendStatDeb(c, 'mpf') === jourMoins(3));
  T('C3 la fin du dernier MPF est le FA qui suit', API._vendStatFin(c, 'mpf') === jourMoins(1));
  T('C4 duree du dernier MPF = 2 j', API._vendStatDuree(c, 'mpf') === 2,
    'rendu : ' + API._vendStatDuree(c, 'mpf'));
}

/* ═══════════ 4. L'empilement ═════════════════════════════════════════ */
{
  const c = { id: 'x', statut: 'mpf', statut_hist: [] };
  API._vendHistPose(c, 'mpf', jourMoins(6));
  T('D1 une premiere etape s\'ecrit', c.statut_hist.length === 1);
  const rien = API._vendHistPose(c, 'mpf', jourMoins(2));
  T('D2 la MEME etape ne s\'ecrit pas deux fois', rien === null && c.statut_hist.length === 1,
    'rendu : ' + c.statut_hist.length + ' ligne(s)');
  API._vendHistPose(c, 'fa', jourMoins(2));
  T('D3 une etape differente s\'ecrit', c.statut_hist.length === 2);
  T('D4 chaque ligne porte un id', c.statut_hist.every(e => !!e.id));

  /* Le tri repare une saisie posee dans le desordre. */
  const d = { id: 'y', statut_hist: [
    { statut: 'fa', date: jourMoins(2) }, { statut: 'mpf', date: jourMoins(6) } ] };
  const h = API._vendHist(d);
  T('D5 le parcours se range par date', h[0].statut === 'mpf' && h[1].statut === 'fa');
  T('D6 et les ids manquants sont poses', h.every(e => !!e.id));
}

/* ═══════════ 5. saveVendCuve : dater, refuser, conserver ═════════════ */
function champs(o) {
  return Object.assign({
    'vcuv-nom': 'Les Damodes', 'vcuv-volume': '60', 'vcuv-date': jourMoins(9),
    'vcuv-parcelles': 'Les Damodes', 'vcuv-statut': 'mpf', 'vcuv-so2': '',
    'vcuv-levures': 'indigenes', 'vcuv-erasflage': 'total',
    'vcuv-mpf-temp': '8', 'vcuv-mpf-duree': '4', 'vcuv-id': '', 'vcuv-stdate': AUJ
  }, o || {});
}
{
  /* Creation : l'etape est datee du JOUR D'ENCUVAGE, pas d'aujourd'hui. */
  const cv = { cuves_vinif: [], recoltes: [] };
  API.pose(cv, champs({}));
  API.saveVendCuve();
  const n = cv.cuves_vinif[0];
  T('E1 la cuve neuve porte une etape', n && n.statut_hist && n.statut_hist.length === 1);
  T('E2 datee de l\'encuvage, pas d\'aujourd\'hui', n.statut_hist[0].date === jourMoins(9),
    'rendu : ' + n.statut_hist[0].date);
  T('E3 et c\'est bien son statut', n.statut_hist[0].statut === 'mpf');
}
{
  /* Changement d'etape : la date du champ fait foi. */
  const cv = { cuves_vinif: [cuveMpfPuisFa()], recoltes: [] };
  cv.cuves_vinif[0].statut = 'mpf';
  cv.cuves_vinif[0].statut_hist = [{ id: 'h1', statut: 'mpf', date: jourMoins(9) }];
  API.pose(cv, champs({ 'vcuv-id': 'c1', 'vcuv-statut': 'fa', 'vcuv-stdate': jourMoins(5) }));
  API.saveVendCuve();
  const c = cv.cuves_vinif[0];
  T('E4 le passage est ecrit', c.statut_hist.length === 2);
  T('E5 a la date choisie, pas a aujourd\'hui', c.statut_hist[1].date === jourMoins(5),
    'rendu : ' + c.statut_hist[1].date);
  T('E6 MPF a donc dure 4 j', API._vendStatDuree(c, 'mpf') === 4);
}
{
  /* ⚠️ LE PIEGE §53 : `obj` est rebati de zero. Rouvrir la fiche sans rien
     changer ne doit PAS effacer le parcours. */
  const cv = { cuves_vinif: [cuveMpfPuisFa()], recoltes: [] };
  API.pose(cv, champs({ 'vcuv-id': 'c1', 'vcuv-statut': 'fa', 'vcuv-nom': 'Les Damodes (corrige)' }));
  API.saveVendCuve();
  const c = cv.cuves_vinif[0];
  T('E7 rouvrir la fiche ne perd pas le parcours', c.statut_hist && c.statut_hist.length === 2,
    'rendu : ' + JSON.stringify(c.statut_hist));
  T('E8 un enregistrement sans changement n\'ajoute rien', c.statut_hist.length === 2);
  T('E9 le nom, lui, a bien change', c.nom === 'Les Damodes (corrige)');
}
{
  /* Refus : anterieur a l'encuvage. Rien ne doit bouger. */
  const cv = { cuves_vinif: [cuveMpfPuisFa()], recoltes: [] };
  cv.cuves_vinif[0].statut = 'mpf';
  API.pose(cv, champs({ 'vcuv-id': 'c1', 'vcuv-statut': 'fa', 'vcuv-stdate': jourMoins(20) }));
  API.saveVendCuve();
  T('E10 date avant l\'encuvage : refusee',
    API.etat().TOASTS.some(t => /ant\u00e9rieur/.test(t)), JSON.stringify(API.etat().TOASTS));
  T('E11 et le statut n\'a PAS bouge', cv.cuves_vinif[0].statut === 'mpf');
  T('E12 le parcours non plus', cv.cuves_vinif[0].statut_hist.length === 2);
}
{
  /* Refus : dans le futur. */
  const cv = { cuves_vinif: [cuveMpfPuisFa()], recoltes: [] };
  cv.cuves_vinif[0].statut = 'mpf';
  API.pose(cv, champs({ 'vcuv-id': 'c1', 'vcuv-statut': 'fa', 'vcuv-stdate': jourPlus(2) }));
  API.saveVendCuve();
  T('E13 date future : refusee',
    API.etat().TOASTS.some(t => /futur/.test(t)), JSON.stringify(API.etat().TOASTS));
  T('E14 et rien n\'a ete ecrit', cv.cuves_vinif[0].statut === 'mpf');
}

/* ═══════════ 6. saveVendStat : le statut suit, sauf parcours clos ════ */
{
  const cv = { cuves_vinif: [cuveMpfPuisFa()], recoltes: [] };
  API.pose(cv, { 'vst-date': jourMoins(1) }, { cuve: 'c1', hist: null, sel: 'decuvage' });
  API.saveVendStat();
  T('F1 le passage est ecrit', cv.cuves_vinif[0].statut_hist.length === 3);
  T('F2 le statut de la cuve SUIT la derniere etape', cv.cuves_vinif[0].statut === 'decuvage',
    'rendu : ' + cv.cuves_vinif[0].statut);
}
{
  /* Une cuve DECUVEE ne se rouvre pas : la cuvee existe deja au Chai. */
  const cv = { cuves_vinif: [cuveMpfPuisFa()], recoltes: [] };
  cv.cuves_vinif[0].statut = 'termine';
  cv.cuves_vinif[0].decuvage = { date: jourMoins(1), cuvee_id: 'cuv_1' };
  API.pose(cv, { 'vst-date': jourMoins(2) }, { cuve: 'c1', hist: null, sel: 'fa' });
  API.saveVendStat();
  T('F3 une cuve decuvee reste terminee', cv.cuves_vinif[0].statut === 'termine',
    'rendu : ' + cv.cuves_vinif[0].statut);
  T('F4 mais sa date a bien ete enregistree', cv.cuves_vinif[0].statut_hist.length === 3);
}
{
  /* Une cuve FUSIONNEE non plus. */
  const cv = { cuves_vinif: [cuveMpfPuisFa()], recoltes: [] };
  cv.cuves_vinif[0].statut = 'termine';
  cv.cuves_vinif[0].fusion = { vers: 'c2', vers_nom: 'A+B', date: jourMoins(1) };
  API.pose(cv, { 'vst-date': jourMoins(2) }, { cuve: 'c1', hist: null, sel: 'fa' });
  API.saveVendStat();
  T('F5 une cuve fusionnee reste terminee', cv.cuves_vinif[0].statut === 'termine');
}
{
  /* Correction d'une ligne existante. */
  const cv = { cuves_vinif: [cuveMpfPuisFa()], recoltes: [] };
  API.pose(cv, { 'vst-date': jourMoins(6) }, { cuve: 'c1', hist: 'h2', sel: 'fa' });
  API.saveVendStat();
  const c = cv.cuves_vinif[0];
  T('F6 corriger ne cree pas de ligne', c.statut_hist.length === 2);
  T('F7 la date est corrigee', API._vendStatDeb(c, 'fa') === jourMoins(6));
  T('F8 et MPF ne dure plus que 3 j', API._vendStatDuree(c, 'mpf') === 3,
    'rendu : ' + API._vendStatDuree(c, 'mpf'));
}
{
  /* Bornes, ici aussi. */
  const cv = { cuves_vinif: [cuveMpfPuisFa()], recoltes: [] };
  API.pose(cv, { 'vst-date': jourPlus(3) }, { cuve: 'c1', hist: null, sel: 'decuvage' });
  API.saveVendStat();
  T('F9 la feuille refuse aussi le futur',
    API.etat().TOASTS.some(t => /futur/.test(t)) && cv.cuves_vinif[0].statut_hist.length === 2);
  API.pose(cv, { 'vst-date': jourMoins(30) }, { cuve: 'c1', hist: null, sel: 'decuvage' });
  API.saveVendStat();
  T('F10 et l\'anterieur a l\'encuvage',
    API.etat().TOASTS.some(t => /ant\u00e9rieur/i.test(t)) && cv.cuves_vinif[0].statut_hist.length === 2,
    JSON.stringify(API.etat().TOASTS));
}

/* ═══════════ 7. La projection compte les jours de FERMENTATION ═══════ */
{
  /* Cinq jours de froid, puis deux jours de FA, quatre releves : la
     projection ne doit PAS s'ouvrir — la cuve vient de partir. */
  const c = cuveMpfPuisFa();
  c.statut_hist = [
    { id: 'h1', statut: 'mpf', date: jourMoins(7) },
    { id: 'h2', statut: 'fa', date: jourMoins(2) }
  ];
  c.date_entree = jourMoins(7);
  c.mesures_fa = [
    { id: 'm1', date: jourMoins(2), densite: 1085, temp_c: 20 },
    { id: 'm2', date: jourMoins(1), densite: 1070, temp_c: 24 },
    { id: 'm3', date: AUJ, densite: 1050, temp_c: 26 }
  ];
  const p = API._mlProjFA(c);
  T('G1 deux jours de FA : la projection dit « demarrage »', p.etat === 'demarrage',
    'rendu : ' + p.etat);
  T('G2 et elle donne les jours de FA', p.jFA === 2, 'rendu : ' + p.jFA);
  T('G3 `jCuve` garde son sens (temps en cuve), l\'agenda l\'affiche', p.jCuve === 7,
    'rendu : ' + p.jCuve);

  /* Meme cuve, mais la FA a commence il y a 5 jours : la projection s'ouvre. */
  const d = cuveMpfPuisFa();
  d.date_entree = jourMoins(9);
  d.statut_hist = [
    { id: 'h1', statut: 'mpf', date: jourMoins(9) },
    { id: 'h2', statut: 'fa', date: jourMoins(5) }
  ];
  d.mesures_fa = [
    { id: 'm1', date: jourMoins(4), densite: 1085, temp_c: 20 },
    { id: 'm2', date: jourMoins(2), densite: 1055, temp_c: 24 },
    { id: 'm3', date: AUJ, densite: 1020, temp_c: 25 }
  ];
  T('G4 cinq jours de FA : la projection s\'ouvre', API._mlProjFA(d).etat !== 'demarrage',
    'rendu : ' + API._mlProjFA(d).etat);

  /* Cuve d'avant le lot : l'ANCIEN comportement, a l'identique. */
  const e = cuveLegacy();
  e.date_entree = jourMoins(1);
  e.mesures_fa = d.mesures_fa;
  T('G5 sans parcours, le repli est l\'ancien calcul', API._mlProjFA(e).etat === 'demarrage'
    && API._mlProjFA(e).jFA === API._mlProjFA(e).jCuve);
}

/* ═══════════ 8. Ce que l'ecran montre ════════════════════════════════ */
{
  const c = cuveMpfPuisFa();
  const l = API._vendParcLigne(c);
  T('H1 la ligne dit l\'etape et sa date', l.indexOf('FA') !== -1 && l.indexOf('depuis le') !== -1);
  T('H2 et le nombre de jours', l.indexOf('5') !== -1, 'rendu : ' + l);
  const h = API._vendParcHist(c, true);
  /* ⚠ Mon assertion etait fausse : /mvv-hrow/ matche aussi -l, -d et -u.
     Se demander si le controle a tort AVANT d'accuser le code. */
  T('H3 le parcours liste les deux etapes',
    (h.match(/class="mvv-hrow"/g) || []).length === 2,
    'rendu : ' + (h.match(/class="mvv-hrow"/g) || []).length);
  T('H4 la ligne close dit jusqu\'a quand', h.indexOf('jusqu') !== -1);
  T('H5 la ligne ouverte dit « en cours »', h.indexOf('en cours') !== -1);
  T('H6 sans droit d\'ecriture, aucun crayon', API._vendParcHist(c, false).indexOf('openVendStat') === -1);
  const f = API._vendStepper(c);
  T('H7 la frise porte la date de MPF et celle de FA',
    f.indexOf(jourMoins(9).slice(8) + '/' + jourMoins(9).slice(5, 7)) !== -1
    && f.indexOf(jourMoins(5).slice(8) + '/' + jourMoins(5).slice(5, 7)) !== -1);
  T('H8 les etapes a venir n\'affichent rien', (f.match(/class="dt">(<|—)/g) || []).length >= 1
    || f.indexOf('<div class="dt"></div>') !== -1);
}

/* ══════════════════════════════════════════════════════════════════════
   CONTRE-EPREUVES — un defaut a la fois, chacune DOIT rougir.
   ⚠️ Un sabotage dont l'ancre a disparu echoue BRUYAMMENT (§72c).
   ══════════════════════════════════════════════════════════════════════ */
const SABOTAGES = [
  ['1. l\'empilement n\'ecarte plus le doublon',
    "  if(h.length && h[h.length-1].statut===st) return null;",
    "  if(false) return null;"],
  ['2. la duree inconnue rend 0 au lieu de null',
    "  var d=_vendStatDeb(c,st); if(!d) return null;",
    "  var d=_vendStatDeb(c,st); if(!d) return 0;"],
  ['3. le parcours lit la PREMIERE occurrence',
    "  for(var i=h.length-1;i>=0;i--) if(h[i].statut===st) return i;",
    "  for(var i=0;i<h.length;i++) if(h[i].statut===st) return i;"],
  ['4. saveVendCuve n\'accepte plus la date du champ',
    "  else if(_stChg) _vendHistPose(obj,statut,_stDate);",
    "  else if(_stChg) _vendHistPose(obj,statut,_mlAuj());"],
  ['5. le parcours est efface par la refonte de l\'objet',
    "  obj.statut_hist=(existing&&Array.isArray(existing.statut_hist))?existing.statut_hist.slice():[];",
    "  obj.statut_hist=[];"],
  ['6. la borne d\'anteriorite saute',
    "    if(date && _stDate<date){ showToast('Le passage est ant\\u00e9rieur \\u00e0 l\\u2019encuvage du '+_vendFrDate(date),'#B85A1A'); return; }",
    "    if(false){ showToast('x','#B85A1A'); return; }"],
  ['7. la borne du futur saute',
    "    if(_stDate>_mlAuj()){ showToast('Un passage ne se pose pas dans le futur','#B85A1A'); return; }",
    "    if(false){ showToast('x','#B85A1A'); return; }"],
  ['8. la projection recompte depuis l\'encuvage',
    "  if(m.length<3 || jFA<3) return {etat:'demarrage', d20:dl, dernier:dernier, jCuve:jCuve, jFA:jFA};",
    "  if(m.length<3 || jCuve<3) return {etat:'demarrage', d20:dl, dernier:dernier, jCuve:jCuve, jFA:jFA};"],
  ['9. une cuve decuvee se laisse retrograder',
    "  var clos=_vendEstFusionnee(c)||!!(c.decuvage&&c.decuvage.date);",
    "  var clos=false;"],
  ['10. la frise invente la date d\'encuvage',
    "    var d=(i<=cur)?_vendStatDeb(c,s[0]):null;",
    "    var d=(i<=cur)?(_vendStatDeb(c,s[0])||c.date_entree):null;"],
];

console.log('\n  Contre-epreuves (une par defaut, jouees separement)');
let cpKo = 0;
for (const [nom, ancre, sabot] of SABOTAGES) {
  if (SRC.indexOf(ancre) === -1) {
    console.log('  \u2717 ANCRE DISPARUE \u2014 ' + nom + '  (le sabotage ne prouve plus rien)');
    cpKo++; continue;
  }
  if (SRC.split(ancre).length - 1 !== 1) {
    console.log('  \u2717 ANCRE AMBIGUE \u2014 ' + nom);
    cpKo++; continue;
  }
  let rouge = false, crash = '';
  try {
    const sabote = monte(SRC.replace(ancre, sabot));
    const avant = ko, avantDit = dit.length;
    rejoue(sabote);
    rouge = (ko > avant);
    ko = avant;                       // on ne compte pas les rouges du sabotage
    dit.length = avantDit;            // ni ses messages dans le rapport final
  } catch (e) { rouge = true; crash = ' (plantage : ' + e.message.slice(0, 60) + ')'; }
  if (rouge) { console.log('  \u2713 ' + nom + ' \u2192 rouge' + crash); }
  else { console.log('  \u2717 ' + nom + ' \u2192 RESTE VERT'); cpKo++; }
}

/* Le sous-ensemble d'assertions rejoue sur chaque sabotage. Volontairement
   court et cible : il doit couvrir les dix defauts, rien de plus. */
function rejoue(A) {
  const c = cuveMpfPuisFa();
  T('cp duree MPF', A._vendStatDuree(c, 'mpf') === 4);
  T('cp duree inconnue = null', A._vendStatDuree(c, 'decuvage') === null);
  const r = cuveMpfPuisFa();
  r.statut_hist.push({ id: 'h3', statut: 'mpf', date: jourMoins(3) });
  r.statut_hist.push({ id: 'h4', statut: 'fa', date: jourMoins(1) });
  T('cp dernier passage', A._vendStatDeb(r, 'fa') === jourMoins(1));
  const d = { id: 'x', statut_hist: [] };
  A._vendHistPose(d, 'mpf', jourMoins(6));
  A._vendHistPose(d, 'mpf', jourMoins(2));
  T('cp pas de doublon', d.statut_hist.length === 1);

  const cv1 = { cuves_vinif: [cuveMpfPuisFa()], recoltes: [] };
  cv1.cuves_vinif[0].statut = 'mpf';
  cv1.cuves_vinif[0].statut_hist = [{ id: 'h1', statut: 'mpf', date: jourMoins(9) }];
  A.pose(cv1, champs({ 'vcuv-id': 'c1', 'vcuv-statut': 'fa', 'vcuv-stdate': jourMoins(5) }));
  A.saveVendCuve();
  T('cp date du champ retenue', cv1.cuves_vinif[0].statut_hist.length === 2
    && cv1.cuves_vinif[0].statut_hist[1].date === jourMoins(5));

  const cv2 = { cuves_vinif: [cuveMpfPuisFa()], recoltes: [] };
  A.pose(cv2, champs({ 'vcuv-id': 'c1', 'vcuv-statut': 'fa', 'vcuv-nom': 'X' }));
  A.saveVendCuve();
  T('cp parcours conserve', (cv2.cuves_vinif[0].statut_hist || []).length === 2);

  const cv3 = { cuves_vinif: [cuveMpfPuisFa()], recoltes: [] };
  cv3.cuves_vinif[0].statut = 'mpf';
  A.pose(cv3, champs({ 'vcuv-id': 'c1', 'vcuv-statut': 'fa', 'vcuv-stdate': jourMoins(20) }));
  A.saveVendCuve();
  T('cp borne anteriorite', cv3.cuves_vinif[0].statut === 'mpf');

  const cv4 = { cuves_vinif: [cuveMpfPuisFa()], recoltes: [] };
  cv4.cuves_vinif[0].statut = 'mpf';
  A.pose(cv4, champs({ 'vcuv-id': 'c1', 'vcuv-statut': 'fa', 'vcuv-stdate': jourPlus(2) }));
  A.saveVendCuve();
  T('cp borne futur', cv4.cuves_vinif[0].statut === 'mpf');

  const g = cuveMpfPuisFa();
  g.date_entree = jourMoins(7);
  g.statut_hist = [{ id: 'h1', statut: 'mpf', date: jourMoins(7) },
                   { id: 'h2', statut: 'fa', date: jourMoins(2) }];
  g.mesures_fa = [{ id: 'm1', date: jourMoins(2), densite: 1085, temp_c: 20 },
                  { id: 'm2', date: jourMoins(1), densite: 1070, temp_c: 24 },
                  { id: 'm3', date: AUJ, densite: 1050, temp_c: 26 }];
  T('cp projection en demarrage', A._mlProjFA(g).etat === 'demarrage');

  const cv5 = { cuves_vinif: [cuveMpfPuisFa()], recoltes: [] };
  cv5.cuves_vinif[0].statut = 'termine';
  cv5.cuves_vinif[0].decuvage = { date: jourMoins(1), cuvee_id: 'z' };
  A.pose(cv5, { 'vst-date': jourMoins(2) }, { cuve: 'c1', hist: null, sel: 'fa' });
  A.saveVendStat();
  T('cp decuvee non retrogradee', cv5.cuves_vinif[0].statut === 'termine');

  const lg = cuveLegacy();
  const fr = A._vendStepper(lg);
  T('cp frise n\'invente pas',
    fr.indexOf(jourMoins(12).slice(8) + '/' + jourMoins(12).slice(5, 7)) === -1);
}

/* ── verdict ──────────────────────────────────────────────────────────── */
console.log('\nHARNAIS PARC-1 \u2014 ' + ok + ' vertes, ' + ko + ' rouges, '
  + (SABOTAGES.length - cpKo) + '/' + SABOTAGES.length + ' contre-epreuves mordent');
if (ko) console.log(dit.join('\n'));
if (ko || cpKo) process.exit(1);
console.log('\u2714 tout est vert');
process.exit(0);
