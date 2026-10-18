// ═══════════════════════════════════════════════════════════════════════════
//  HARNAIS FML-1 — PAS DE « FINI » AVANT LA MALO
// ═══════════════════════════════════════════════════════════════════════════
//  Nico, 17/10 : « tu ne peux pas indiquer que la cuvée est terminée si la FML
//  n'est pas faite ». « Décuver » posait 'termine' le jour même : la frise du
//  Cuvier coloriait l'étape FML d'un tiret et écrivait « Terminé depuis le … »
//  sur un vin qui n'avait pas commencé sa malo. Ajouts de Nico : on fait aussi
//  du blanc (malo évitée exprès), et la malo d'un rouge peut se bloquer.
//
//  Sur les VRAIES fonctions extraites de src/cave.js + src/cuvier.js (méthode
//  C20). Bouchons : ce qui n'est pas le sujet (toasts, rendu, icônes).
//
//  CE QUE CE HARNAIS PROUVE
//   1. une cuve décuvée : l'étape en cours est FML tant que Le Chai ne dit pas
//      la malo finie — pas encore déclarée, en cours (fin estimée), bloquée ;
//   2. « Fini » s'allume avec la date de fin de malo (analyse, fiche, mesure),
//      la plus ancienne des preuves, jamais avec celle du décuvage ;
//   3. « Pas de malo (voulu) » finit la vinification, et une analyse
//      postérieure qui dit la malo partie l'emporte ;
//   4. « Terminé » à la main : depuis l'étape FML seulement (Modifier, Changer
//      l'étape) ; corriger la date d'un « Terminé » déjà là reste permis ;
//   5. le jour du décuvage s'appelle « Décuvée » (parcours, graphe, légende,
//      cahier), une fusion « Fusionnée » ;
//   6. Aujourd'hui ne crie pas « malo bloquée » sur une malo évitée exprès ;
//   7. la feuille de décuvage demande la malo, « au chai » d'office ;
//   8. le Cuvier charge le style de la légende du graphe ;
//   9. l'écran, l'aide et le guide le disent.
//
//  ⚠ Contre-épreuve : chaque ancre doit être UNIQUE dans le bloc extrait — une
//    ancre absente ou double est ROUGE, jamais « détectée » ; l'essai est joué
//    d'abord sur le code sain.
//  ⚠ Dates RELATIVES à aujourd'hui : un décor qui fige une année devient faux.
//
//  Usage :  node scripts/mv-harnais-fml1.mjs
//           node scripts/mv-harnais-fml1.mjs --contre
//  LECTURE SEULE. Jamais déployé → aucun bump.
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import { lireCave } from './mv-cave-src.mjs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = lireCave();
const sansCom = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/* ══ EXTRACTION — ordre réel du fichier ══ */
const NOMS = [
  '_vendFrDate', '_vendStatLbl', '_vendHist', '_vendStatIdx', '_vendStatDeb', '_vendStatFin',
  '_vendStatDuree', '_vendHistPose', '_vendTriDate', '_vendEstFusionnee', '_vendDecuvee',
  '_vendPassLbl', '_vendFmlPassee', '_vendFmlFin', '_vendFmlVin', '_vendFmlLigne',
  '_vendStepper', '_vendParcLigne', '_vendParcHist', '_vendCuvF1',
  'saveVendCuve', 'saveVendStat', '_vendDecFmlHtml', '_vendDecFmlSet',
  '_mlD', '_mlIso', '_mlAuj', '_mlAddJ', '_mlEcartJ', '_mlNomCuvee', '_mlMesMalo', '_mlFinMalo', '_mlMalo',
  '_caveFmlDerniereOp', '_caveFmlEtat'
];
function extraire(nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(SRC);
  if (!m) { console.error('ABSENTE de la Cave : ' + nom); process.exit(1); }
  let i = SRC.indexOf('{', m.index), d = 0;
  for (let j = i; j < SRC.length; j++) {
    if (SRC[j] === '{') d++;
    else if (SRC[j] === '}' && --d === 0) return [m.index, SRC.slice(m.index, j + 1)];
  }
  console.error('accolade non fermée : ' + nom); process.exit(1);
}
function expression(nom) {   // window.X = function(){…};
  const m = new RegExp('^window\\.' + nom.replace(/\./g, '\\.') + '\\s*=\\s*function', 'm').exec(SRC);
  if (!m) { console.error('EXPRESSION ABSENTE : window.' + nom); process.exit(1); }
  let i = SRC.indexOf('{', m.index), d = 0;
  for (let j = i; j < SRC.length; j++) {
    if (SRC[j] === '{') d++;
    else if (SRC[j] === '}' && --d === 0) return [m.index, SRC.slice(m.index, j + 1) + ';'];
  }
  console.error('accolade non fermée : window.' + nom); process.exit(1);
}
function table(nom) {
  const m = new RegExp('^var ' + nom + '\\s*=', 'm').exec(SRC);
  if (!m) { console.error('TABLE ABSENTE : ' + nom); process.exit(1); }
  let d = 0;
  for (let j = m.index; j < SRC.length; j++) {
    const ch = SRC[j];
    if (ch === '[' || ch === '{' || ch === '(') d++;
    else if (ch === ']' || ch === '}' || ch === ')') d--;
    else if (ch === ';' && d === 0) return [m.index, SRC.slice(m.index, j + 1)];
  }
  console.error('point-virgule non trouvé : ' + nom); process.exit(1);
}
const BLOC = [...NOMS.map(extraire), expression('_mlProjMalo'),
  ...['_VEND_STAT', '_VEND_STEPS', '_ML_MAL_FIN', '_ML_MAL_PRES', '_vendDecFml'].map(table)]
  .sort((a, b) => a[0] - b[0]).map(x => x[1]).join('\n');

const PRELUDE = `
var CAVE_VENDANGE = { cuves_vinif: [], recoltes: [] };
var CAVE_ELEVAGE = { cuvees: [], operations: [] };
var TOASTS = [], CHAMPS = {}, RENDUS = 0;
var window = { logError: null, closeOv: null, CAVE_VENDANGE: null };
var _mlProjMalo;
var _vcuvRef = null, _vcuvFromGrp = null, _vcuvMpfActive = false;
var _vstCuveId = null, _vstEditId = null, _vstSel = '';
function showToast(m){ TOASTS.push(String(m)); }
function _vendGarde(){ return true; }
function _vendFbSave(m){ if(m) TOASTS.push(String(m)); }
function _vendSheetClose(){}
function renderVendCuves(){ RENDUS++; }
function _caveCuveOcc(){ return false; }
function _caveCuve(){ return null; }
function _caveLastSout(){ return null; }
function _escHtml(s){ return String(s == null ? '' : s); }
function _escAttr(s){ return String(s == null ? '' : s); }
function _mvIcon(){ return '<svg></svg>'; }
var BOUTONS = [{ cls: {}, classList: null }, { cls: {}, classList: null }];
BOUTONS.forEach(function(b){ b.classList = { toggle: function(k, v){ b.cls[k] = !!v; } }; });
var document = { getElementById: function(id){
  if (id === 'vdec-fml') return { querySelectorAll: function(){ return BOUTONS; } };
  return (id in CHAMPS) ? { value: CHAMPS[id] } : null; } };
`;
const RETOUR = `
_mlProjMalo = window._mlProjMalo;
return { _vendPassLbl, _vendFmlVin, _vendStepper, _vendParcLigne, _vendParcHist, _caveFmlEtat, _mlMalo,
  saveVendCuve, saveVendStat, _vendDecFmlHtml, _vendDecFmlSet,
  dec: function(){ return _vendDecFml; }, boutons: BOUTONS,
  etat: function(){ return { CAVE_VENDANGE, TOASTS, RENDUS }; },
  pose: function(cv, ce, champs, vst){
    CAVE_VENDANGE = cv || { cuves_vinif: [], recoltes: [] }; CAVE_ELEVAGE = ce || { cuvees: [], operations: [] };
    CHAMPS = champs || {}; TOASTS = []; RENDUS = 0;
    _vstCuveId = vst ? vst.cuve : null; _vstEditId = vst ? (vst.hist || null) : null; _vstSel = vst ? (vst.sel || '') : '';
  } };
`;
function monter(mutation) {
  const corps = mutation ? mutation(BLOC) : BLOC;
  return new Function(PRELUDE + corps + RETOUR)();
}

let vert = 0; const rouges = [];
function pose(cond, quoi) {
  if (cond) { vert++; console.log('  vert   ' + quoi); }
  else { rouges.push(quoi); console.log('  ROUGE  ' + quoi); }
}

/* ══ LE DÉCOR ══ */
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const jm = n => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const fr = s => s.slice(8) + '/' + s.slice(5, 7);
const AUJ = jm(0);
function cuveDec(o) {
  return Object.assign({ id: 'D1', nom: 'Pasquier', statut: 'termine', date_entree: jm(45), mesures_fa: [], operations: [],
    statut_hist: [{ id: 'h1', statut: 'mpf', date: jm(45) }, { id: 'h2', statut: 'fa', date: jm(40) },
      { id: 'h3', statut: 'decuvage', date: jm(32) }, { id: 'h4', statut: 'termine', date: jm(22) }],
    decuvage: { date: jm(22), cuvee_id: 'cv1', fa_finie: true } }, o || {});
}
const cuvee = o => Object.assign({ id: 'cv1', nom: 'Pasquier', millesime: 2026, statut: 'elevage', tonneaux: [{ annee: 2024, nb: 4 }], fml_terminee: false }, o || {});
const ana = (n, data, id) => ({ id: id || ('a' + n), type: 'analyse', date: jm(n), cuvees_ids: ['cv1'], data });
const mal = (n, v) => ana(n, { malique: v, fml: 'none' }, 'm' + n);
const MES = {
  bloquee: [mal(30, 2.0), mal(20, 1.6), mal(10, 1.6)],
  normale: [mal(30, 2.0), mal(20, 1.5), mal(10, 1.0)],
  finie:   [mal(60, 1.5), mal(40, 0.8), mal(20, 0.08), mal(10, 0.05)],
  /* Passé sous le seuil, remonté (saisie ou erreur), redescendu : la fin est le DERNIER passage dessous. */
  rechute: [mal(60, 1.5), mal(50, 0.08), mal(40, 0.4), mal(20, 0.09), mal(10, 0.05)]
};
const ETAPES = /<div class="mvv-step ([^"]*)"><div class="dot"><\/div><div class="lb">([^<]*)<\/div><div class="dt">([^<]*)<\/div><\/div>/g;
const etapes = html => [...html.matchAll(ETAPES)].map(m => ({ cls: m[1].trim(), lb: m[2], dt: m[3] }));
function scene(A, cuveO, cuveeO, ops) {
  A.pose({ cuves_vinif: [cuveDec(cuveO)], recoltes: [] }, { cuvees: cuveeO === null ? [] : [cuvee(cuveeO)], operations: ops || [] });
  return CAVEC => CAVEC;
}
const SCENES = {
  attente: A => { scene(A, {}, {}, []); return cuveDec(); },
  cours: A => { scene(A, {}, {}, [ana(5, { fml: 'cours' })]); return cuveDec(); },
  normale: A => { scene(A, {}, {}, MES.normale); return cuveDec(); },
  bloquee: A => { scene(A, {}, {}, MES.bloquee); return cuveDec(); },
  fiche: A => { scene(A, {}, { fml_terminee: true, fml_terminee_date: jm(3) }, []); return cuveDec(); },
  analyse: A => { scene(A, {}, {}, [ana(4, { fml: 'ok', fml_date: jm(5) })]); return cuveDec(); },
  mesure: A => { scene(A, {}, {}, MES.finie); return cuveDec(); },
  rechute: A => { scene(A, {}, {}, MES.rechute); return cuveDec(); },
  /* Deux preuves : la mesure sous le seuil (J-20) et une analyse « Terminée » plus tardive (J-5). */
  deuxPreuves: A => { scene(A, {}, {}, MES.finie.concat([ana(4, { fml: 'ok', fml_date: jm(5) })])); return cuveDec(); },
  sans: A => { scene(A, {}, { fml_sans: true, fml_sans_date: jm(8) }, MES.bloquee); return cuveDec(); },
  sansPuisCours: A => { scene(A, {}, { fml_sans: true, fml_sans_date: jm(8) }, [ana(2, { fml: 'cours' })]); return cuveDec(); },
  perdue: A => { scene(A, {}, null, []); return cuveDec(); }
};
const rend = (A, k) => { const c = SCENES[k](A); return { c, f: etapes(A._vendStepper(c)), l: A._vendParcLigne(c), v: A._vendFmlVin(c) }; };

const A = monter();

if (!CONTRE) {
  console.log('\n── 1 · une cuve décuvée : l’étape en cours est la malo ──');
  {
    const r = rend(A, 'attente');
    pose(r.f.length === 6, 'la frise rend ses six étapes');
    pose(r.f[3].cls === 'done' && r.f[3].dt === fr(jm(32)), 'Pressurage reste franchi, à sa date');
    pose(r.f[4].cls === 'cur' && r.f[4].lb === 'FML' && r.f[4].dt === fr(jm(22)),
      '★★★ FML est l’étape EN COURS, depuis le décuvage (le défaut d’origine : un tiret « franchi »)');
    pose(r.f[5].cls === '' && r.f[5].dt === '', '★★★ « Fini » n’est ni franchi ni daté');
    pose(r.l.indexOf('Termin') === -1 && r.l.indexOf('Fini') === -1, '★★★ la phrase ne dit plus « Terminé depuis le … »');
    pose(r.l.indexOf('<b>FML</b> depuis le ' + fr(jm(22))) !== -1 && r.l.indexOf('malo pas encore déclarée') !== -1,
      '« FML depuis le … · au Chai, malo pas encore déclarée »');
    pose(r.l.indexOf('22\u00a0j') !== -1, 'avec le nombre de jours au Chai');
    const c = rend(A, 'cours');
    pose(c.f[4].cls === 'cur' && c.l.indexOf('malo en cours au Chai') !== -1, 'une analyse « En cours » : malo en cours');
    const n = rend(A, 'normale');
    pose(n.v.etat === 'cours' && n.l.indexOf('fin estimée vers le') !== -1, 'trois mesures qui descendent : la fin estimée s’affiche');
    const b = rend(A, 'bloquee');
    pose(b.v.etat === 'bloquee' && b.f[4].cls === 'cur alerte', '★★ malo bloquée : l’étape FML passe en alerte');
    pose(b.l.indexOf('class="mvv-parc alerte"') !== -1 && b.l.indexOf('malo bloquée') !== -1 && b.l.indexOf('à contrôler') !== -1,
      '★★ la phrase le dit avec les mots de l’agenda (« malo bloquée — à contrôler »)');
    pose(b.l.indexOf('1,6\u00a0g/L') !== -1, 'avec le malique mesuré');
    pose(b.f[5].cls === '', '… et « Fini » reste éteint');
  }

  console.log('\n── 2 · « Fini » porte la date de fin de malo ──');
  {
    const f = rend(A, 'fiche');
    pose(f.f[5].cls === 'cur' && f.f[5].dt === fr(jm(3)), '★★ bouton « Terminée » de la fiche : Fini à sa date');
    pose(f.f[4].cls === 'done' && f.f[4].dt === fr(jm(22)), 'FML franchie, datée du décuvage');
    pose(f.l.indexOf('<b>Fini</b> le ' + fr(jm(3))) !== -1 && f.l.indexOf('malo finie au Chai') !== -1, '« Fini le … · malo finie au Chai »');
    const a = rend(A, 'analyse');
    pose(a.f[5].dt === fr(jm(5)), 'analyse « Terminée » : la date de fin qu’elle porte');
    const m = rend(A, 'mesure');
    pose(m.v.etat === 'finie' && m.f[5].dt === fr(jm(20)),
      '★★ malique passé sous 0,10 g/L : la PREMIÈRE mesure restée dessous, pas la dernière');
    pose(m.f.every(e => e.dt !== fr(jm(22)) || e.lb === 'FML'), 'la date du décuvage n’est jamais celle de « Fini »');
    pose(rend(A, 'rechute').f[5].dt === fr(jm(20)), '★ passé dessous, remonté, redescendu : la fin est le dernier passage sous le seuil');
    pose(rend(A, 'deuxPreuves').f[5].dt === fr(jm(20)), '★★ deux preuves : la plus ANCIENNE fait la date (la mesure, pas l’analyse tardive)');
  }

  console.log('\n── 3 · « Pas de malo (voulu) » ──');
  {
    const s = rend(A, 'sans');
    pose(s.v.etat === 'sans', '★★★ la malo évitée exprès est lue, même avec un malique plat');
    pose(s.f[4].cls === 'done sans' && s.f[4].dt === 'sans', 'l’étape FML porte « sans »');
    pose(s.f[5].cls === 'cur' && s.f[5].dt === fr(jm(8)), '★★ « Fini » s’allume, daté du jour de la déclaration');
    pose(s.l.indexOf('pas de malo, choix du domaine') !== -1, 'la phrase le dit');
    const p = rend(A, 'sansPuisCours');
    pose(p.v.etat === 'cours', '★ une analyse POSTÉRIEURE qui dit la malo partie l’emporte');
    A.pose(null, { cuvees: [cuvee({ fml_sans: true, fml_sans_date: jm(8) })], operations: [ana(12, { fml: 'cours' })] });
    pose(A._caveFmlEtat(cuvee({ fml_sans: true, fml_sans_date: jm(8) })) === 'sans', '… une analyse ANTÉRIEURE, non');
  }

  console.log('\n── 4 · les autres formes de cuve terminée ──');
  {
    A.pose({ cuves_vinif: [] }, { cuvees: [], operations: [] });
    const main = { id: 'M1', statut: 'termine', decuvage: null,
      statut_hist: [{ id: 'm1', statut: 'fa', date: jm(30) }, { id: 'm2', statut: 'fml', date: jm(20) }, { id: 'm3', statut: 'termine', date: jm(5) }] };
    const fm = etapes(A._vendStepper(main));
    pose(fm[5].cls === 'cur' && fm[5].dt === fr(jm(5)) && fm[4].dt === fr(jm(20)), '« Terminé » après l’étape FML : la malo a été faite en cuve');
    pose(A._vendParcLigne(main).indexOf('malo faite en cuve') !== -1, 'la phrase le dit');
    const vieux = { id: 'V1', statut: 'termine', statut_hist: [{ id: 'v1', statut: 'fa', date: jm(30) }, { id: 'v2', statut: 'termine', date: jm(5) }] };
    const fv = etapes(A._vendStepper(vieux));
    pose(fv[4].cls === 'cur' && fv[4].dt === '\u2014' && fv[5].cls === '', '★ un « Terminé » d’avant ce lot, sans FML : la malo reste à dire (tiret)');
    pose(A._vendParcLigne(vieux).indexOf('sans étape FML') !== -1, 'et la phrase ne le cache pas');
    const fus = { id: 'F1', statut: 'termine', fusion: { vers: 'X', vers_nom: 'Cuve A+B', date: jm(12) },
      statut_hist: [{ id: 'f1', statut: 'fa', date: jm(20) }, { id: 'f2', statut: 'termine', date: jm(12) }] };
    const ff = etapes(A._vendStepper(fus));
    pose(ff.every(e => e.cls.indexOf('cur') === -1) && ff[2].cls === 'done' && ff[3].cls === '' && ff[4].cls === '' && ff[5].cls === '',
      '★ une cuve fusionnée s’arrête à sa dernière étape : rien « en cours », pas de « Fini »');
    pose(A._vendParcLigne(fus).indexOf('<b>Fusionnée</b> le ' + fr(jm(12)) + ' dans Cuve A+B') !== -1, 'la phrase dit où est son vin');
    scene(A, {}, null, []);
    const pe = rend(A, 'perdue');
    pose(pe.f[4].cls === 'cur' && pe.l.indexOf('n’est plus au Chai') !== -1, 'la cuvée introuvable au Chai : la malo ne se lit pas, et c’est dit');
    const fa = { id: 'A1', statut: 'fa', statut_hist: [{ id: 'a1', statut: 'mpf', date: jm(10) }, { id: 'a2', statut: 'fa', date: jm(6) }] };
    const ffa = etapes(A._vendStepper(fa));
    pose(ffa[2].cls === 'cur' && ffa[2].dt === fr(jm(6)) && A._vendParcLigne(fa).indexOf('<b>FA</b> depuis le ' + fr(jm(6))) !== -1,
      'une cuve en FA : frise et phrase inchangées');
  }

  console.log('\n── 5 · le nom des passages ──');
  {
    scene(A, {}, {}, []);
    const c = cuveDec();
    pose(A._vendPassLbl(c, 'termine') === 'Décuvée', '★★ le décuvage s’appelle « Décuvée »');
    pose(A._vendPassLbl({ fusion: { vers: 'X' } }, 'termine') === 'Fusionnée', 'une fusion « Fusionnée »');
    pose(A._vendPassLbl({ statut: 'termine' }, 'termine') === 'Terminé', '« Terminé » à la main garde son nom');
    pose(A._vendPassLbl(c, 'decuvage') === 'Pressurage', 'les autres étapes ne bougent pas');
    const h = A._vendParcHist(c, true);
    pose(h.indexOf('<b>Décuvée</b>') !== -1 && h.indexOf('<b>Terminé</b>') === -1, 'le parcours écrit « Décuvée »');
    const cv = sansCom(lire('src/cuvier.js')), ca = sansCom(lire('src/cave.js'));
    pose(cv.indexOf('var lbl = _vendPassLbl(cu, e.statut)') !== -1 && cv.indexOf('return _vendPassLbl(cu, e.statut); })') !== -1,
      'le graphe (marge haute et bulle) lit le même nom');
    pose(ca.indexOf('_escHtml(_vendPassLbl(cu, e.statut))') !== -1, 'la légende du graphe aussi');
    pose(ca.indexOf("return _vendPassLbl(c, e.statut) + ' '") !== -1 && ca.indexOf('_escHtml(_vendPassLbl(c, c.statut))') !== -1,
      'et le cahier de cuverie imprimé');
  }

  console.log('\n── 6 · les deux portes de « Terminé » ──');
  {
    const champs = o => Object.assign({ 'vcuv-nom': 'Les Damodes', 'vcuv-volume': '60', 'vcuv-date': jm(30),
      'vcuv-parcelles': 'Les Damodes', 'vcuv-statut': 'termine', 'vcuv-so2': '', 'vcuv-levures': 'indigenes',
      'vcuv-erasflage': 'total', 'vcuv-mpf-temp': '8', 'vcuv-mpf-duree': '4', 'vcuv-id': 'c1', 'vcuv-stdate': AUJ }, o || {});
    const cuve = (st, h) => ({ id: 'c1', nom: 'Les Damodes', statut: st, date_entree: jm(30), mesures_fa: [], operations: [], statut_hist: h });
    let cv = { cuves_vinif: [cuve('fa', [{ id: 'x1', statut: 'fa', date: jm(25) }])], recoltes: [] };
    A.pose(cv, null, champs());
    A.saveVendCuve();
    pose(A.etat().TOASTS.some(t => /malo n’est pas faite/.test(t)), '★★★ « Modifier » : de FA à « Terminé », refusé');
    pose(cv.cuves_vinif[0].statut === 'fa' && cv.cuves_vinif[0].statut_hist.length === 1, 'et rien n’a été écrit');
    cv = { cuves_vinif: [cuve('fml', [{ id: 'x1', statut: 'fa', date: jm(25) }, { id: 'x2', statut: 'fml', date: jm(15) }])], recoltes: [] };
    A.pose(cv, null, champs());
    A.saveVendCuve();
    pose(cv.cuves_vinif[0].statut === 'termine' && cv.cuves_vinif[0].statut_hist.length === 3, '★★ depuis l’étape FML : accepté et daté');
    A.pose({ cuves_vinif: [], recoltes: [] }, null, champs({ 'vcuv-id': '' }));
    A.saveVendCuve();
    pose(A.etat().CAVE_VENDANGE.cuves_vinif.length === 0, 'une cuve NEUVE ne naît pas « Terminé »');
    cv = { cuves_vinif: [cuve('fa', [{ id: 'x1', statut: 'fa', date: jm(25) }])], recoltes: [] };
    A.pose(cv, null, { 'vst-date': jm(1) }, { cuve: 'c1', hist: null, sel: 'termine' });
    A.saveVendStat();
    pose(A.etat().TOASTS.some(t => /malo n’est pas faite/.test(t)) && cv.cuves_vinif[0].statut_hist.length === 1,
      '★★ « Changer l’étape » : poser « Terminé » sans FML, refusé');
    cv = { cuves_vinif: [cuve('fml', [{ id: 'x1', statut: 'fa', date: jm(25) }, { id: 'x2', statut: 'fml', date: jm(15) }])], recoltes: [] };
    A.pose(cv, null, { 'vst-date': jm(1) }, { cuve: 'c1', hist: null, sel: 'termine' });
    A.saveVendStat();
    pose(cv.cuves_vinif[0].statut === 'termine', 'après l’étape FML, accepté');
    cv = { cuves_vinif: [cuve('termine', [{ id: 'x1', statut: 'fa', date: jm(25) }, { id: 'x3', statut: 'termine', date: jm(10) }])], recoltes: [] };
    A.pose(cv, null, { 'vst-date': jm(9) }, { cuve: 'c1', hist: 'x3', sel: 'termine' });
    A.saveVendStat();
    pose(!A.etat().TOASTS.some(t => /malo/.test(t)) && cv.cuves_vinif[0].statut_hist[1].date === jm(9),
      '★ corriger la date d’un « Terminé » déjà là reste permis');
    const d = cuveDec({ statut_hist: [{ id: 'h2', statut: 'fa', date: jm(40) }] });
    cv = { cuves_vinif: [d], recoltes: [] };
    A.pose(cv, null, { 'vst-date': jm(2) }, { cuve: 'D1', hist: null, sel: 'termine' });
    A.saveVendStat();
    pose(!A.etat().TOASTS.some(t => /malo/.test(t)), 'une cuve décuvée est close : la garde ne la concerne pas (§81)');
  }

  console.log('\n── 7 · Aujourd’hui et la fiche du Chai ──');
  {
    A.pose(null, { cuvees: [cuvee({ id: 'cv1' })], operations: MES.bloquee });
    pose(A._mlMalo().some(x => x.id === 'cv1' && x.p && x.p.etat === 'bloquee'), 'un malique plat SANS déclaration : l’agenda signale la malo bloquée');
    A.pose(null, { cuvees: [cuvee({ id: 'cv1', fml_sans: true, fml_sans_date: jm(8) })], operations: MES.bloquee });
    pose(A._mlMalo().length === 0, '★★★ « Pas de malo (voulu) » : aucune fausse alerte « malo bloquée »');
    const ca = sansCom(lire('src/cave.js'));
    pose(ca.indexOf("var fmlSans=_fmlV==='sans';") !== -1 && ca.indexOf('_prevC.fml_sans=true;') !== -1
      && ca.indexOf('delete _prevC.fml_sans;') !== -1 && ca.indexOf('_nc.fml_sans=true;') !== -1, 'la fiche enregistre le choix, cuvée neuve comme existante');
    pose(ca.indexOf("['non','ok','sans'].forEach") !== -1 && ca.indexOf("(_fmlE==='ok'||_fmlE==='sans')?_fmlE:'non'") !== -1,
      'la bascule a trois boutons, et la fiche rouvre sur le bon');
    pose(ca.indexOf("fml==='sans') fmlTag='<span class=\"mvc-tag mvc-tag-fmlno\">Pas de malo</span>'") !== -1
      && ca.indexOf(">Pas de malo (voulu)</div>'") !== -1, 'la carte et la fiche du Chai l’affichent');
  }

  console.log('\n── 8 · la feuille de décuvage, et la légende du graphe ──');
  {
    const h = A._vendDecFmlHtml();
    pose(/class="mvv-optab on" onclick="_vendDecFmlSet\(0\)">Elle se fera au chai</.test(h)
      && /class="mvv-optab" onclick="_vendDecFmlSet\(1\)">Déjà finie en cuve</.test(h), '★★ « Et la malo ? » : « au chai » d’office, « finie en cuve » à cocher');
    A._vendDecFmlSet(1);
    pose(A.dec() === true && A.boutons[1].cls.on === true && A.boutons[0].cls.on === false, 'le choix bascule');
    const cv = sansCom(lire('src/cuvier.js'));
    const oD = extraire('openVendDecuvage')[1], sD = sansCom(extraire('saveVendDecuvage')[1]);
    pose(/_vendDecFaFinie=true; _vendDecFml=false;/.test(oD) && oD.indexOf('+_vendDecFmlHtml()') !== -1, 'la feuille repart « au chai » à chaque ouverture');
    pose(sD.indexOf('fml_terminee:!!_vendDecFml,fml_terminee_date:_vendDecFml?_mvToday():null') !== -1,
      '★ « finie en cuve » : la cuvée naît malo terminée, datée du décuvage');
    pose(/window\._vendDecFmlSet=_vendDecFmlSet;/.test(cv) && /window\._vendPassLbl = _vendPassLbl;/.test(cv), 'les noms lus ailleurs passent par window');
    const ca = sansCom(lire('src/cave.js'));
    const rv = sansCom(extraire('renderCaveVendange')[1]), cs = extraire('_caveV2InjectCss')[1];
    pose(rv.indexOf('_caveV2InjectCss();') !== -1 && cs.indexOf('.mvfm-lg{') !== -1, '★★ le Cuvier charge le style de la légende (capture du 17/10)');
    pose(/window\._caveFmlEtat = _caveFmlEtat;/.test(ca) && /window\._mlFinMalo = _mlFinMalo;/.test(ca), 'la frontière laisse passer la malo du Chai');
  }

  console.log('\n── 9 · l’écran, l’aide et le guide ──');
  {
    const ix = lire('index.html'), u = lire('src/utils.js'), g = lire('guide/08-cave.html');
    pose(ix.indexOf('id="cuv-fml-sans" onclick="window._cuvToggle(\'fml\',\'sans\')"') !== -1 && ix.indexOf('>Pas de malo (voulu)</button>') !== -1,
      '★ la fiche cuvée a son bouton « Pas de malo (voulu) »');
    pose(ix.indexOf('<option value="termine">Termin&eacute; &mdash; malo faite en cuve</option>') !== -1 && ix.indexOf('pr&ecirc;t pour &eacute;levage') === -1,
      '« Modifier » dit ce que « Terminé » veut dire maintenant');
    pose(u.indexOf("['« Fini », c’est la malo faite'") !== -1 && u.indexOf('<b>Pas de malo (voulu)</b>') !== -1, 'l’aide de la Cave l’explique');
    pose(u.indexOf("['Décuver, c’est constater que c’est fini'") === -1, 'et ne dit plus que décuver, c’est « fini »');
    pose(g.indexOf("<b>« Fini », c'est la malo faite.</b>") !== -1 && g.indexOf('<b>Pas de malo (voulu)</b>') !== -1, 'le guide aussi');
  }
}

/* ══ CONTRE-ÉPREUVE ══ */
if (CONTRE) {
  console.log('\n── CONTRE-ÉPREUVE : chaque défaut réintroduit doit mordre ──');
  const mord = (titre, ancre, remplace, essai) => {
    const n = BLOC.split(ancre).length - 1;
    if (n !== 1) { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → ANCRE ' + (n ? 'NON UNIQUE (' + n + ')' : 'INTROUVABLE')); return; }
    let sain = false;
    try { sain = !!essai(monter()); } catch (e) { sain = false; }
    if (!sain) { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → ESSAI FAUX SUR LE CODE SAIN'); return; }
    let rouge = false;
    try { rouge = !essai(monter(b => b.replace(ancre, remplace))); } catch (e) { rouge = true; }
    if (rouge) { vert++; console.log('  vert   ' + titre + ' → détecté'); }
    else { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
  };
  const cur = (M, k) => etapes(M._vendStepper(SCENES[k](M)));
  mord('★★★ le décuvage rallume « Fini » (le défaut d’origine)',
    '} else if(v&&!fini) cur=_VEND_STAT.fml.i;', '}',
    M => { const f = cur(M, 'attente'); return f[4].cls === 'cur' && f[5].cls === ''; });
  mord('★★★ la phrase redit « Terminé depuis le décuvage »',
    "  var v=(st==='termine')?_vendFmlVin(c):null;\n  if(v) return _vendFmlLigne(c,v);", '  var v=null;',
    M => M._vendParcLigne(SCENES.attente(M)).indexOf('Termin') === -1);
  mord('★★ « Fini » prend la date du décuvage',
    "else if(v&&!fus&&s[0]==='termine') d=fini?(v.fin||null):null;", '',
    M => cur(M, 'fiche')[5].dt === fr(jm(3)));
  mord('★★ la malo bloquée se lit comme une malo en cours',
    "if(p&&p.etat==='bloquee') return {etat:'bloquee', deb:deb, p:p, cu:cu};", '',
    M => cur(M, 'bloquee')[4].cls === 'cur alerte');
  mord('★★ « Fini » prend la DERNIÈRE preuve, pas la première',
    '  l.sort();\n  return l.length?l[0]:null;', '  l.sort(); l.reverse();\n  return l.length?l[0]:null;',
    M => cur(M, 'deuxPreuves')[5].dt === fr(jm(20)));
  mord('★ une remontée au-dessus du seuil ne remet plus la date à zéro',
    '} else f=null; });', '} });',
    M => cur(M, 'rechute')[5].dt === fr(jm(20)));
  mord('★★★ « Pas de malo (voulu) » n’est plus lu par la frise',
    "if(e==='sans') return {etat:'sans', deb:deb, fin:cu.fml_sans_date||null, cu:cu};", '',
    M => cur(M, 'sans')[5].cls === 'cur');
  mord('★★ le Chai oublie « Pas de malo (voulu) »',
    "    if(mes&&ds&&op&&(op.date||'')>ds) return mes;\n    return 'sans';", "    return mes;",
    M => { M.pose(null, { cuvees: [], operations: [] }); return M._caveFmlEtat(cuvee({ fml_sans: true, fml_sans_date: jm(8) })) === 'sans'; });
  mord('★ une analyse postérieure ne corrige plus « Pas de malo »',
    "    if(mes&&ds&&op&&(op.date||'')>ds) return mes;\n", '',
    M => M._vendFmlVin(SCENES.sansPuisCours(M)).etat === 'cours');
  mord('★★★ Aujourd’hui recrie « malo bloquée » sur une malo évitée exprès',
    "    if(_caveFmlEtat(x)==='sans') return;\n", '',
    M => { M.pose(null, { cuvees: [cuvee({ fml_sans: true, fml_sans_date: jm(8) })], operations: MES.bloquee }); return M._mlMalo().length === 0; });
  mord('★★★ « Modifier » repasse en « Terminé » sans malo',
    "if(statut==='termine' && !(existing && existing.statut==='termine') && !_vendFmlPassee(existing)){", 'if(false){',
    M => { const cv = { cuves_vinif: [{ id: 'c1', nom: 'X', statut: 'fa', date_entree: jm(30), mesures_fa: [], statut_hist: [{ id: 'x1', statut: 'fa', date: jm(25) }] }], recoltes: [] };
      M.pose(cv, null, { 'vcuv-nom': 'X', 'vcuv-statut': 'termine', 'vcuv-id': 'c1', 'vcuv-date': jm(30), 'vcuv-stdate': AUJ }); M.saveVendCuve(); return cv.cuves_vinif[0].statut === 'fa'; });
  mord('★★ « Changer l’étape » repose « Terminé » sans malo',
    "if(_vstSel==='termine' && !(_vendEstFusionnee(c)||!!(c.decuvage&&c.decuvage.date)) && !_vendFmlPassee(c)){", 'if(false){',
    M => { const cv = { cuves_vinif: [{ id: 'c1', nom: 'X', statut: 'fa', date_entree: jm(30), statut_hist: [{ id: 'x1', statut: 'fa', date: jm(25) }] }], recoltes: [] };
      M.pose(cv, null, { 'vst-date': jm(1) }, { cuve: 'c1', hist: null, sel: 'termine' }); M.saveVendStat(); return cv.cuves_vinif[0].statut_hist.length === 1; });
  mord('★★ le décuvage redevient « Terminé » dans le parcours',
    "    if(_vendDecuvee(c)) return 'D\\u00e9cuv\\u00e9e';\n", '',
    M => { SCENES.attente(M); return M._vendPassLbl(cuveDec(), 'termine') === 'Décuvée'; });
  mord('★ une cuve fusionnée rallume « Fini »',
    "  if(fus){", '  if(false){',
    M => { M.pose({ cuves_vinif: [] }, null); const f = etapes(M._vendStepper({ id: 'F1', statut: 'termine', fusion: { vers: 'X', date: jm(12) },
      statut_hist: [{ id: 'f1', statut: 'fa', date: jm(20) }, { id: 'f2', statut: 'termine', date: jm(12) }] }));
      return f[2].cls === 'done' && f[3].cls === '' && f[4].cls === '' && f[5].cls === ''; });
  mord('★ la feuille de décuvage coche « finie en cuve » d’office',
    'class="mvv-optab on" onclick="_vendDecFmlSet(0)"', 'class="mvv-optab" onclick="_vendDecFmlSet(0)"',
    M => /class="mvv-optab on" onclick="_vendDecFmlSet\(0\)"/.test(M._vendDecFmlHtml()));
}

console.log('\n' + (rouges.length ? '✗ ' + rouges.length + ' rouge(s) sur ' + (vert + rouges.length) : '✓ ' + vert + ' vérifications vertes')
  + (CONTRE ? ' (contre-épreuve)' : ''));
process.exit(rouges.length ? 1 : 0);
