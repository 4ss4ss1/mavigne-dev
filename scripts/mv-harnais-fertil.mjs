#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais FERTI-1 : l'amendement et le registre de fertilisation
// ═══════════════════════════════════════════════════════════════════════════
//  Demande de Nico (02/10) : choisir un amendement, cocher des parcelles, et
//  que les sacs, le temps tracteur, le travail prévu et le cahier de
//  fertilisation se remplissent seuls. Ce qu'on éprouve :
//    · le barème h/ha depuis vitesse, écartement et temps utile
//    · sacs par parcelle (demi-sac) et commande (sac entier)
//    · l'azote : dose × % N ; composition absente = null, jamais 0
//    · les dates d'épandage LUES : session « Amendement », tâche validée,
//      date posée à la main — et une validation ne sert qu'à UN apport
//    · la campagne du 1er septembre au 31 août
//    · l'enregistrement : apport, produit de La Réserve (sans doublon),
//      tâche + exclusions des parcelles non cochées, activité et barème
//    · `fertil` relu par _rsvApply, compté par le garde anti-perte,
//      protégé par LISTES-1 (sinon il s'efface au rechargement)
//    · contre-épreuves : chaque garde cassée doit faire rougir
//  Le code est EXTRAIT de phyto.js, jamais réécrit ici.
//  Usage : node scripts/mv-harnais-fertil.mjs
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const R = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const PHY = lire('src/phyto.js');
const i0 = PHY.indexOf('// FERTI-1 \u2014 L\u2019AMENDEMENT'.replace('\u2019', "'"));
const i1 = PHY.indexOf('window.openOvFerti=openOvFerti;');
if (i0 < 0 || i1 < 0) { console.error('bloc FERTI-1 introuvable dans phyto.js'); process.exit(1); }
const BLOC = PHY.slice(i0, i1);
const NORM = PHY.slice(PHY.indexOf('function _phyNorm('), PHY.indexOf('function _phyEphyMeta('));

let vert = 0, rouge = 0;
const t = (nom, ok) => { if (ok) { vert++; console.log('  \u2713 ' + nom); } else { rouge++; console.log('  \u2717 ' + nom); } };

function monde(src) {
  const win = {
    PARCELLES: [
      { nom:'A', surface:0.42, statut:'Active', zv:true, ilot:'\u00celot 4' },
      { nom:'B', surface:0.38, statut:'Active' },
      { nom:'C', surface:1.12, statut:'Active', zv:true },
      { nom:'X', surface:0.50, statut:'Arrachee' }
    ],
    SESSIONS: [], JOURNAL: [], TACHES: [], ACTIVITES: [], TRACTEURS_LIST: [{ id:'t1', nom:'Bobard' }],
    INTRANTS: { produits: [], achats: [], achat_four: [] },
    CONFIG: { vigne: { ec_rang: 1, ec_pied: 1 } },
    EPHY: [], saved: [],
    saveIntrants() { win.saved.push('intrants'); },
    saveData(k) { win.saved.push(k); },
    getSaisonActive: () => ({ nom: '2026' }),
    _perPoseTache: () => true,
    _mvVigne: () => ({ ec_rang: 1, ec_pied: 1, pieds: 10000 })
  };
  const fn = new Function('window', 'isAdmin', 'showToast', '_escHtml', '_escAttr', '_mvToday', 'openOv', 'closeOv', 'document',
    NORM + (src || BLOC) +
    '\nreturn { _ferHha, _ferNha, _ferFaits, _ferLignes, _ferCampDe, _ferCalc, _ferSave, _ferList, _ferSyncSessions,' +
    ' setFer: function(o){ _fer = o; }, neuf: _ferNeuf };');
  const doc = { getElementById: () => null, createElement: () => ({}), head: { appendChild() {} }, body: { appendChild() {} } };
  const api = fn(win, () => true, () => {}, x => String(x), x => String(x), () => '2026-10-02', () => {}, () => {}, doc);
  return { win, api };
}

console.log('\n\u2500\u2500 Le temps tracteur');
{
  const { api } = monde();
  t('1 m, 4 km/h, 75 % \u2192 3,33 h/ha', Math.abs(api._ferHha(4, 1, 75) - 3.3333) < 0.001);
  t('vitesse absente \u2192 0 (aucun bar\u00e8me invent\u00e9)', api._ferHha('', 1, 75) === 0);
  t('virgule d\u00e9cimale accept\u00e9e', Math.abs(api._ferHha('4,5', '1,2', 80) - (10000/1.2)/4500/0.8) < 1e-9);
}

console.log('\n\u2500\u2500 L\u2019azote');
{
  const { api } = monde();
  t('1,5 t/ha \u00e0 3 % \u2192 45 kg N/ha', api._ferNha({ dose: 1.5, prod: { N: 3 } }) === 45);
  t('teneur absente \u2192 null, jamais 0', api._ferNha({ dose: 1.5, prod: { N: null } }) === null);
  t('dose absente \u2192 null', api._ferNha({ dose: null, prod: { N: 3 } }) === null);
}

console.log('\n\u2500\u2500 La campagne');
{
  const { api } = monde();
  t('09/11/2026 \u2192 campagne 2026', api._ferCampDe('2026-11-09') === 2026);
  t('31/08/2027 \u2192 campagne 2026', api._ferCampDe('2027-08-31') === 2026);
  t('01/09/2027 \u2192 campagne 2027', api._ferCampDe('2027-09-01') === 2027);
}

function avecOps(api, win) {
  win.INTRANTS.fertil = [
    { id: 'f1', cree: '2026-10-02', dose: 1.5, prod: { N: 3, typ: 'II' }, parcs: ['A', 'B', 'C'], man: { C: '2026-11-20' } },
    { id: 'f2', cree: '2026-10-05', dose: 1, prod: { N: null }, parcs: ['A'], man: {} }
  ];
  win.SESSIONS = [
    { activite: 'Amendement', date: '2026-11-10', parcellesFaites: ['A', { nom: 'B', t1: new Date(2026, 10, 12, 15).getTime() }] },
    { activite: 'Rognage', date: '2026-11-11', parcellesFaites: ['A'] },
    { activite: 'Amendement', date: '2026-09-01', parcellesFaites: ['A'] }          // avant la cr\u00e9ation : ignor\u00e9e
  ];
  win.JOURNAL = [ { tache: 'Amendement', parcelle: 'A', statut: 'Valid\u00e9', date: '2026-12-01' } ];
}
console.log('\n\u2500\u2500 Les dates d\u2019\u00e9pandage, lues');
{
  const { api, win } = monde(); avecOps(api, win);
  const F = api._ferFaits();
  t('session \u00ab Amendement \u00bb \u2192 A le 10/11', F.f1.A && F.f1.A.date === '2026-11-10' && F.f1.A.src === 'session');
  t('heure de fin de la parcelle \u2192 B le 12/11', F.f1.B && F.f1.B.date === '2026-11-12');
  t('date pos\u00e9e \u00e0 la main gagne \u2192 C le 20/11', F.f1.C && F.f1.C.src === 'main');
  t('la validation du 10/11 sert au 1er apport, le 2e prend la t\u00e2che du 01/12', F.f2.A && F.f2.A.date === '2026-12-01' && F.f2.A.src === 'journal');
  const L = api._ferLignes(2026);
  t('4 lignes au cahier 2026', L.length === 4);
  const lA2 = L.find(l => l.op.id === 'f2');
  t('composition absente \u2192 quantit\u00e9 d\u2019azote null', lA2 && lA2.nTot === null);
  const lA1 = L.find(l => l.op.id === 'f1' && l.nom === 'A');
  t('A : 45 kg N/ha \u00d7 0,42 ha = 18,9 kg', lA1 && Math.abs(lA1.nTot - 18.9) < 1e-9);
  t('aucune ligne en campagne 2027', api._ferLignes(2027).length === 0);
}

{
  const { api, win } = monde(); avecOps(api, win);
  win.SESSIONS = [ { activite: 'Rognage', date: '2026-11-11', parcellesFaites: ['A', 'B'] } ]; win.JOURNAL = [];
  const F = api._ferFaits();
  t('une session d\u2019une autre activit\u00e9 ne date rien', !F.f1.A && !F.f1.B);
}
console.log('\n\u2500\u2500 L\u2019enregistrement');
{
  const { api, win } = monde();
  const f = api.neuf();
  f.prod.nom = 'Fertil Bio 3-2-3'; f.prod.N = '3'; f.dose = '1,5'; f.kg = '25'; f.parcs = { A: 1, C: 1 }; f.v = '4'; f.ec = '1'; f.rd = '75'; f.mach = 't1';
  api.setFer(f);
  const o = api._ferCalc();
  t('sacs : 1,5 t \u00d7 1,54 ha / 25 kg \u2192 commande 93', o.sacsCmd === 93);
  t('heures : 3,33 h/ha \u00d7 1,54 ha', Math.abs(o.H - 1.54 * 10000 / 4000 / 0.75) < 1e-9);
  api._ferSave();
  const op = (win.INTRANTS.fertil || [])[0];
  t('l\u2019apport est dans INTRANTS.fertil', !!op && op.parcs.join() === 'A,C');
  t('dose et teneur gard\u00e9es en nombres', op && op.dose === 1.5 && op.prod.N === 3);
  t('le produit entre dans La R\u00e9serve, fournitures vigne', win.INTRANTS.produits.length === 1 && win.INTRANTS.produits[0].cat === 'vigne');
  const ta = win.TACHES.find(x => x.nom === 'Amendement');
  t('la t\u00e2che \u00ab Amendement \u00bb est cr\u00e9\u00e9e avec le bar\u00e8me', ta && ta.hha === 3.33);
  const B = win.PARCELLES.find(p => p.nom === 'B'), A = win.PARCELLES.find(p => p.nom === 'A'), X = win.PARCELLES.find(p => p.nom === 'X');
  t('B (non coch\u00e9e) exclut la t\u00e2che', (B.tachesExclues || []).includes('Amendement'));
  t('A (coch\u00e9e) ne l\u2019exclut pas', !(A.tachesExclues || []).includes('Amendement'));
  t('une parcelle arrach\u00e9e n\u2019est pas touch\u00e9e', !X.tachesExclues);
  const ac = win.ACTIVITES.find(x => x.nom === 'Amendement');
  t('l\u2019activit\u00e9 tracteur porte le bar\u00e8me et la machine', ac && ac.h_ha === 3.33 && ac.tracteurDefautId === 't1');
  t('cinq sauvegardes : intrants, taches, saisons, parcelles, activites',
    ['intrants', 'taches', 'saisons', 'parcelles', 'activites'].every(k => win.saved.includes(k)));
  // 2e apport, m\u00eame produit, sur B : pas de doublon, B r\u00e9-incluse
  const g = api.neuf(); g.prod.nom = 'fertil bio 3-2-3'; g.dose = '1'; g.v = ''; g.parcs = { B: 1 }; api.setFer(g); api._ferSave();
  t('m\u00eame produit (casse diff\u00e9rente) : pas de doublon dans La R\u00e9serve', win.INTRANTS.produits.length === 1);
  t('B coch\u00e9e au 2e apport : r\u00e9-incluse', !(B.tachesExclues || []).includes('Amendement'));
  t('sans vitesse, le bar\u00e8me existant n\u2019est pas \u00e9cras\u00e9 par 0', win.TACHES.find(x => x.nom === 'Amendement').hha === 3.33);
}

console.log('\n\u2500\u2500 La cl\u00e9 `fertil` survit au rechargement');
const RSV = lire('src/reserve.js'), FB = lire('src/firebase.js'), APP = lire('src/app.js');
const relue = s => /var d=\{[^}]*fertil:\[\]/.test(s);
const comptee = s => /\[[^\]]*'fertil'[^\]]*\]\.forEach\(function \(k\)/.test(s);
const protegee = s => /intrants:\[[^\]]*'fertil'/.test(s);
t('_rsvApply relit `fertil`', relue(RSV));
t('le garde anti-perte compte `fertil`', comptee(FB));
t('LISTES-1 prot\u00e8ge `fertil`', protegee(APP));
t('le mod\u00e8le INTRANTS d\u00e9clare `fertil`', /\n  fertil: \[\],/.test(RSV));

console.log('\n\u2500\u2500 FERTI-2 \u00b7 le pr\u00e9vu des achats au Pilotage');
const PIL = lire('src/pilotage.js');
const pj = PIL.indexOf('var achP=0, nAchP=0;'), pk = PIL.indexOf('\n  }\n', pj);
const PREVU = (pj >= 0 && pk > pj) ? PIL.slice(pj, pk + 4) : '';
function prevu(src, o) {
    // ANNEE-1 (§234) : le bloc place aussi le prévu dans son mois (byM[k].achP) — on lui passe un byM vide.
  const f = new Function('window', 'enCoursC', 'ex', 'dFin', 'ach', 'byM', src + '\nreturn { achP, nAchP };');
  return f({ INTRANTS: { fertil: o.ops } }, o.enCours !== false, { d0: '2026-01-01', d1: '2026-12-31' }, o.dFin || '2026-10-02', o.ach || [], {});
}
const OPS = [{ cout: 410, prodId: 'p1', cree: '2026-10-02', sem: '2026-11-09' }, { cout: null, prodId: 'p2', cree: '2026-10-02' }];
t('le bloc du pr\u00e9vu est trouv\u00e9 dans pilotage.js', PREVU.length > 100);
if (PREVU) {
  t('un amendement chiffr\u00e9 entre au pr\u00e9vu (410 \u20ac)', prevu(PREVU, { ops: OPS }).achP === 410);
  t('un amendement sans prix ne pr\u00e9voit rien', prevu(PREVU, { ops: [OPS[1]] }).achP === 0);
  t('la facture chiffr\u00e9e saisie apr\u00e8s le retire du pr\u00e9vu', prevu(PREVU, { ops: OPS, ach: [{ prodId: 'p1', prix: 395, date: '2026-10-20' }], dFin: '2026-10-25' }).achP === 0);
  t('un achat d\u2019AVANT l\u2019amendement ne le retire pas', prevu(PREVU, { ops: OPS, ach: [{ prodId: 'p1', prix: 300, date: '2026-03-01' }] }).achP === 410);
  t('un achat SANS prix ne le retire pas', prevu(PREVU, { ops: OPS, ach: [{ prodId: 'p1', prix: null, date: '2026-10-20' }], dFin: '2026-10-25' }).achP === 410);
  t('hors exercice : rien', prevu(PREVU, { ops: [{ cout: 410, prodId: 'p1', cree: '2027-02-01' }] }).achP === 0);
  t('exercice clos : pas de pr\u00e9vu', prevu(PREVU, { ops: OPS, enCours: false }).achP === 0);
  t('rougit bien si l\u2019on casse : la facture ne retire plus le pr\u00e9vu (double compte)',
    prevu(PREVU.replace('if(facture) return;', ''), { ops: OPS, ach: [{ prodId: 'p1', prix: 395, date: '2026-10-20' }], dFin: '2026-10-25' }).achP === 0 === false);
}
t('le pr\u00e9vu entre dans totalP', /var totalP=salP\+achP,/.test(PIL));
t('la ligne Achats porte son pr\u00e9vu', /k:'ach'[^\n]*eurP:\(enCoursC\?achP:null\)/.test(PIL));
t('plus de phrase \u00ab les achats n\u2019ont pas de colonne pr\u00e9vu \u00bb', !/les achats et les r\\u00e9parations n\\u2019ont <b>pas de colonne/.test(PIL));

console.log('\n\u2500\u2500 FERTI-3 \u00b7 la session \u00ab Amendement \u00bb coche la t\u00e2che');
function avecSession(win) {
  win.TACHES = [{ nom: 'Amendement', hha: 3.33 }];
  win.PARCELLES[1].tachesExclues = ['Amendement'];                     // B non concern\u00e9e
  win.PARCELLES[2].taches = { Amendement: 'Valid\u00e9' };            // C d\u00e9j\u00e0 valid\u00e9e \u00e0 la main
  win.SESSIONS = [
    { id: 's1', activite: 'Amendement', date: '2026-11-10', conducteur: 'Victor', parcellesFaites: ['A', 'B', { nom: 'C', t1: Date.now() }] },
    { id: 's2', activite: 'Rognage', date: '2026-11-10', parcellesFaites: ['A'] }
  ];
  win.JOURNAL = [];
}
{
  const { api, win } = monde(); avecSession(win);
  const n = api._ferSyncSessions();
  const A = win.PARCELLES[0];
  t('A, faite dans la session, voit sa t\u00e2che valid\u00e9e', A.taches && A.taches.Amendement === 'Valid\u00e9');
  t('une seule entr\u00e9e de journal (A) : B exclue, C d\u00e9j\u00e0 valid\u00e9e', n === 1 && win.JOURNAL.length === 1);
  const j = win.JOURNAL[0] || {};
  t('l\u2019entr\u00e9e est marqu\u00e9e \u00ab faite au tracteur \u00bb, hors des rangs, sans \u00e9quipe', j.auTracteur === true && j.quiHors === true && (j.membresEquipe || []).length === 0);
  t('elle porte la date de la session, le conducteur et la session', j.date === '2026-11-10' && j.qui === 'Victor' && j.session === 's1');
  t('parcelles et journal sont sauv\u00e9s', win.saved.includes('parcelles') && win.saved.includes('journal'));
  const n2 = api._ferSyncSessions();
  t('rejou\u00e9e, la r\u00e9conciliation n\u2019\u00e9crit rien (idempotente)', n2 === 0 && win.JOURNAL.length === 1);
  win.PARCELLES[0].taches = {};   // l'admin annule la validation depuis la parcelle
  t('une validation annul\u00e9e n\u2019est pas refaite par la m\u00eame session', api._ferSyncSessions() === 0 && !win.PARCELLES[0].taches.Amendement);
  const F = (win.INTRANTS.fertil = [{ id: 'f1', cree: '2026-10-02', dose: 1, prod: { N: 3 }, parcs: ['A'], man: {} }, { id: 'f2', cree: '2026-10-03', dose: 1, prod: { N: 3 }, parcs: ['A'], man: {} }], api._ferFaits());
  t('le registre ne lit pas la copie journal : le 2e apport n\u2019est pas dat\u00e9 par elle', F.f1.A && F.f1.A.src === 'session' && !F.f2.A);
}
{
  const { api, win } = monde(); avecSession(win); win.TACHES = [];
  t('sans t\u00e2che \u00ab Amendement \u00bb : rien n\u2019est \u00e9crit', api._ferSyncSessions() === 0 && win.JOURNAL.length === 0);
}
{
  const { api, win } = monde(); avecSession(win); win._mvOnActiveSaison = () => false;
  t('sur une saison consult\u00e9e non active : rien n\u2019est \u00e9crit', api._ferSyncSessions() === 0);
}
const APP2 = lire('src/app.js'), PIL2 = lire('src/pilotage.js');
t('saveData(\'sessions\') appelle la r\u00e9conciliation, sans r\u00e9entrance', /keyHint==='sessions' && typeof window\._ferSyncSessions==='function' && !window\._ferSyncEnCours/.test(APP2));
t('le temps vigne (_ecoTvEvents) \u00e9carte auTracteur', /return j && !j\.meteo && !j\.auTracteur && j\.date/.test(PIL2));
t('le partage par personne \u00e9carte auTracteur', /if\(!j\|\|j\.meteo\|\|j\.auTracteur\|\|j\.statut!=='Valid\\u00e9'\|\|!j\.parcelle\|\|!j\.date\) return;/.test(PIL2));
t('le repli bar\u00e8me dat\u00e9 \u00e9carte auTracteur', /if\(!j \|\| j\.meteo \|\| j\.auTracteur \|\| j\.statut!=='Valid\\u00e9'/.test(PIL2));
{
  const casseS = BLOC.replace("if(deja[sid+'\\u0000'+nom]) return;", '');
  let r; try { const { api, win } = monde(casseS); avecSession(win); api._ferSyncSessions(); win.PARCELLES[0].taches = {}; api._ferSyncSessions(); r = win.JOURNAL.length === 1; } catch (e) { r = false; }
  t('rougit bien si l\u2019on casse : la r\u00e9conciliation n\u2019est plus idempotente', r === false);
  const casseE = BLOC.replace("if((p.tachesExclues||[]).indexOf(FER_TACHE)>=0) return;", '');
  try { const { api, win } = monde(casseE); avecSession(win); api._ferSyncSessions(); r = !(win.PARCELLES[1].taches && win.PARCELLES[1].taches.Amendement); } catch (e) { r = false; }
  t('rougit bien si l\u2019on casse : une parcelle exclue est valid\u00e9e', r === false);
}

console.log('\n\u2500\u2500 Contre-\u00e9preuves');
const casse = (nom, src, verif) => { let r; try { const { api, win } = monde(src); r = verif(api, win); } catch (e) { r = false; } t('rougit bien si l\u2019on casse : ' + nom, r === false); };
casse('une validation sert \u00e0 deux apports', BLOC.replace('pris[i]=1; ', ''), (api, win) => { avecOps(api, win); const F = api._ferFaits(); return F.f2.A && F.f2.A.date === '2026-12-01'; });
casse('une session d\u2019avant l\u2019apport compte', BLOC.replace('||e.date<c0', ''), (api, win) => { avecOps(api, win); win.SESSIONS = win.SESSIONS.slice(2); win.JOURNAL = []; const F = api._ferFaits(); return !F.f1.A; });
casse('composition absente rendue \u00e0 0', BLOC.replace("if(!d||n==null||n==='') return null;", "if(!d) return null;"), (api) => api._ferNha({ dose: 1, prod: { N: null } }) === null);
casse('les parcelles non coch\u00e9es gardent la t\u00e2che', BLOC.replace('else if(neuve && k<0) p.tachesExclues.push(FER_TACHE);', ''), (api, win) => { const f = api.neuf(); f.prod.nom = 'P'; f.parcs = { A: 1 }; api.setFer(f); api._ferSave(); return (win.PARCELLES[1].tachesExclues || []).includes('Amendement'); });
t('rougit bien si l\u2019on casse : `fertil` oubli\u00e9 par _rsvApply', relue(RSV.replace(',fertil:[]};', '};')) === false);
t('rougit bien si l\u2019on casse : `fertil` oubli\u00e9 par le garde', comptee(FB.replace(",'fertil']", ']')) === false);

console.log('\n' + (rouge ? '\x1b[31m' + rouge + ' ROUGE(S)\x1b[0m' : '\x1b[32m' + vert + ' vert(s), 0 rouge\x1b[0m'));
process.exit(rouge ? 1 : 0);
