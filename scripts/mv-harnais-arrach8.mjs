// HARNAIS — ARRACH-8 (§306) : une parcelle arrachée avant l'appli, déclarée après coup.
//   node scripts/mv-harnais-arrach8.mjs           → doit être vert
//   node scripts/mv-harnais-arrach8.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions extraites de src/utils.js, src/app.js et src/pilotage.js (commentaires retirés) ;
// les stubs RENDENT des données, ils ne calculent rien de métier. Le cas vécu (09/10) : la fiche de droite disait
// « À faire » des tâches désactivées, un arrachage annulé deux fois restait « dernier passage » et compté à faire,
// des passages saisis après l'arrachage prenaient des heures dans le temps réel. Il MESURE aussi ce que pesait un
// passage fautif dans le temps réel (moteur exécuté avec et sans la règle).
// ⚠️ §25.2 : les contre-épreuves mutent EN MÉMOIRE, avec garde d'injection (une ancre introuvable = rouge).
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const BASE = { ut: lire('src/utils.js'), app: lire('src/app.js'), pil: lire('src/pilotage.js'), css: lire('src/styles.css') };
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n}\n', i) + 3); }
function fnw(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n};\n', i) + 4); }
function ligne(src, re, nom) { const m = src.match(re); if (!m) throw new Error('introuvable : ' + nom); return m[0]; }
function bloc(src, a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('bloc introuvable : ' + a); return src.slice(i, j + b.length); }
function extraire(src, nom) {   // accolades équilibrées (méthode de mv-harnais-temps-vigne)
  const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('introuvable : ' + nom);
  let d = 0; const s = src.indexOf('{', i);
  for (let k = s; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); } }
  throw new Error('non fermée : ' + nom);
}
// L'heure de saisie fait l'id (Date.now() en hexadécimal, comme l'appli).
const H = (iso, h = 10, m = 0) => new Date(iso + 'T' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':00').getTime().toString(16);
const SAIS = [
  { nom: 'Hiver 2025', debut: '2025-11-01', fin: '2026-03-31' },
  { nom: 'Printemps 2026', debut: '2026-04-01', fin: '2026-06-30' },
  { nom: 'Hiver 2026', debut: '2026-10-01', fin: '2027-03-31', active: true }];
const TACHES = ['Taille', 'Tirage', 'Brûlage', 'Réparation', 'Arrachage'];
const EXCL = ['Taille', 'Tirage', 'Brûlage', 'Réparation'];

function code(S) {
  const dep = [ligne(S.ut, /var MV_EX_MOIS_LBL = .*;/, 'MV_EX_MOIS_LBL'), 'var MV_CAMP_MOIS_DEF = 7;',
    fn(S.ut, 'function _mvCampagneMois(){'), fn(S.ut, 'function _mvCampagneDe(iso){'), fn(S.ut, 'function _mvCampagneBornes(c){'),
    fn(S.ut, 'function _saisonObj(nom){'), fn(S.ut, 'function _saisonForDate(ds){'),
    'function _mvAujIso(){ return window.__AUJ; }', 'window._saisonForDate = _saisonForDate;'].join('\n');
  const ut = sansCom(bloc(S.ut, 'var MV_TACHES_SEL', 'window._mvSelResume       = _mvSelResume;'));
  const app = [sansCom(bloc(S.app, '// ══════ ARRACH-3', '// ══════ ARRACHAGE —')),
    ligne(S.app, /function _mvArrHors\(p,nom\)\{[^\n]*\n/, '_mvArrHors'),
    sansCom(fn(S.app, 'function _mvExclu(p,nom,exclues){')), sansCom(fn(S.app, 'function getPCls(p){')),
    ligne(S.app, /function _pDateFr\(iso\)\{[^\n]*\n/, '_pDateFr'), ligne(S.app, /function _pEtatBadge\(e\)\{[^\n]*\n/, '_pEtatBadge'),
    ligne(S.app, /function _pvNbFait\(cl\)\{[^\n]*\n/, '_pvNbFait'), ligne(S.app, /function _pvCompte\(cl\)\{[^\n]*\n/, '_pvCompte'),
    sansCom(fn(S.app, 'function _pDernier(nom,tache){')), sansCom(fn(S.app, 'function _arrFrDate(iso){')),
    sansCom(fn(S.app, 'function _pFicheHtml(p){'))].join('\n');
  return dep + '\n' + ut + '\n' + app + '\n' + fnw(S.ut, 'window._mvDerniereValidee = function(taches, garde){');
}
function monde(S, o = {}) {
  const els = {}; const el = id => (els[id] ||= { id, value: '', style: {}, innerHTML: '' });
  const visu = o.visu || 'Hiver 2026';
  const ctx = { console, Date, Math, String, Number, Array, Object, JSON, parseInt, parseFloat, isNaN, isFinite,
    __AUJ: '2026-10-09', CONFIG: o.config || {}, SAISONS: SAIS, PARCELLES: o.parc || [], JOURNAL: o.j || [],
    TACHES_CATALOGUE: [{ nom: 'Arrachage', label: 'Arrachage' }, { nom: 'Effeuillage', label: 'Effeuillage' }, { nom: 'Desherbage', label: 'Désherbage manuel' }],
    TRAVAUX: {}, currentUser: { nom: 'Nico' }, pTacheFilter: 'toutes', _dpCurrentNom: '',
    _P_MOIS: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    isAdmin: () => true, canWrite: () => true, getSaisonActive: () => SAIS.find(s => s.active), _visuSaison: () => visu,
    _mvOnActiveSaison: () => visu === 'Hiver 2026',
    getTachesSaison: () => (o.taches || TACHES).map(n => ({ nom: n })), getTacheStatut: (p, n) => ((p.taches || {})[n] || 'Non démarré'),
    pctColor: () => 'x', getDraeParcelle: () => null, _pvSurfFr: s => String(s), _pvActions: () => '', tNom: n => n,
    _mvBadge: (t, ton) => '<i class="bdg-' + ton + '">' + t + '</i>', _escHtml: s => String(s), _escAttr: s => String(s),
    _mvEqApplique: e => e, _mvIcon: () => '', saveData: () => 0, recalcTravaux: () => 0, openDPArrachage: () => 0, showToast: () => 0,
    document: { getElementById: id => (/^arr/.test(id) ? el(id) : null) } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(code(S), ctx);
  return { ctx, el };
}

// ── Le temps réel, moteur exécuté (méthode de mv-harnais-temps-vigne : extraction + prélude de stubs) ──
const VOULUES = ['_ecoCaveJours', '_pexIso', '_pexD', '_pexIsoToMs2', '_pexIsoPlus', '_pexJourApres', '_opPassHha', '_opMinTrou',
  '_ecoTvNivs', '_ecoTvDef', '_ecoTvBar', '_ecoTvEvents', '_ecoTempsVigne'];
const PRELUDE = `
var window = { PARCELLES:[], JOURNAL:[], MEMBRES:[], TACHES:[] };
var HEURES = {}, COND = {}, PER = { nom:'Hiver', debut:'2026-01-05', fin:'2026-01-16' };
var TAUX = {}, RATE0 = 18, EQJ = {};
window._mvEqJour = function(iso){ var L=EQJ[iso]; return (L&&L.length)?L:null; };
function _ecoRate(){ return RATE0; }
window._mvPaieTauxEffAt = function(m, iso){ var t=TAUX[m.nom]; if(typeof t==='function') return t(iso); return t||0; };
var _ECO_TV = null;
window._pilSaison = function(){ return PER; };
window._mvEnContratSurPeriode = function(m){ return !m.bureau; };
window._planChampPersRange = function(m, a, b){
  var iso = a.getFullYear()+'-'+String(a.getMonth()+1).padStart(2,'0')+'-'+String(a.getDate()).padStart(2,'0');
  return ((HEURES[m.nom]||{})[iso])||0;
};
function _ecoTracHByParc(){ return { condH: COND }; }
`;
function tempsReel(S, w, heures) {
  const apr = fnw(S.ut, 'window._mvApresArrachage = function(p, j){') + '\n' + extraire(S.ut, '_mvArrDate');
  const src = PRELUDE + apr + '\n' + VOULUES.map(n => extraire(S.pil, n)).join('\n')
    + '\n;return function(o){ Object.assign(window, o.w); HEURES = o.h; _ECO_TV = null; return _ecoTempsVigne(); };';
  return new Function(src)()({ w, h: heures });
}
const hp = (V, parc, t) => ((V.pairs[parc + '\u0000' + t] || {}).h) || 0;
const jours = (arr, h) => Object.fromEntries(arr.map(d => [d, h]));
const MBR = [{ nom: 'Victor' }, { nom: 'Shana' }, { nom: 'Alicia' }];
const TR_A = { nom: 'A', surface: 0.5, statut: 'Active' };
const TR_X = { nom: 'X', surface: 0.087, statut: 'Arrachee', dateArrachage: '2026-01-02' };
function trJour(S) {   // une journée : 3 × 8 h, taille validée sur A (0,5 ha) et sur X, arrachée le 2 janvier
  return tempsReel(S, { PARCELLES: [TR_A, TR_X], TACHES: [{ nom: 'Taille', hha: 15 }], MEMBRES: MBR,
    JOURNAL: ['A', 'X'].map((p, i) => ({ id: (0x100 + i).toString(16), date: '2026-01-05', parcelle: p, tache: 'Taille', qui: 'Victor',
      statut: 'Validé', membresEquipe: ['Shana', 'Alicia'] })) },
    { Victor: jours(['2026-01-05'], 8), Shana: jours(['2026-01-05'], 8), Alicia: jours(['2026-01-05'], 8) });
}
function trAttente(S) {   // trois jours sans validation, puis X seule (fautive), puis A le 9
  return tempsReel(S, { PARCELLES: [TR_A, TR_X], TACHES: [{ nom: 'Taille', hha: 15 }], MEMBRES: [{ nom: 'Victor' }],
    JOURNAL: [{ id: '200', date: '2026-01-07', parcelle: 'X', tache: 'Taille', qui: 'Victor', statut: 'Validé', membresEquipe: [] },
      { id: '201', date: '2026-01-09', parcelle: 'A', tache: 'Taille', qui: 'Victor', statut: 'Validé', membresEquipe: [] }] },
    { Victor: jours(['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09'], 8) });
}

function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const P = (w, n) => w.ctx.PARCELLES.find(x => x.nom === n);
  // ── A. Une saisie annulée ensuite ne compte plus (utils.js, _mvAnnulee) ──
  const J = [
    { id: H('2026-10-05', 9), date: '2026-10-05', parcelle: 'Z', tache: 'Arrachage', statut: 'Validé' },
    { id: H('2026-10-09', 17, 58), date: '2026-01-15', parcelle: 'Z', tache: 'Arrachage', statut: 'Validé' },
    { id: H('2026-10-09', 18), date: '2026-10-09', parcelle: 'Z', tache: 'Arrachage', statut: 'Annulé' },
    { id: H('2026-10-09', 18, 5), date: '2026-10-09', parcelle: 'Z', tache: 'Arrachage', statut: 'Annulé' },
    { id: H('2026-02-02', 16), date: '2026-02-02', parcelle: 'Z', tache: 'Taille', statut: 'Validé' },
    { id: H('2026-10-09', 18, 10), date: '2026-10-09', parcelle: 'Z', tache: 'Taille', statut: 'Validé' },
    { id: H('2026-10-09', 18, 20), date: '2026-10-09', parcelle: 'Z', tache: 'Taille', statut: 'Annulé' },
    { id: H('2026-10-09', 18, 30), date: '2026-10-09', parcelle: 'Z', tache: 'Taille', statut: 'Validé' },
    { id: H('2026-09-25', 9), date: '2026-09-25', parcelle: 'Z', tache: 'Brûlage', statut: 'Validé' },
    { id: H('2026-10-09', 18, 40), date: '2026-10-09', parcelle: 'Z', tache: 'Brûlage', statut: 'Annulé' },
    { id: H('2026-10-06', 8), date: '2026-10-06', parcelle: 'Y', tache: 'Arrachage', etape: 'demontage', statut: 'Validé' },
    { id: H('2026-10-07', 8), date: '2026-10-07', parcelle: 'Y', tache: 'Arrachage', etape: 'souches', statut: 'Validé' },
    { id: H('2026-10-08', 8), date: '2026-10-08', parcelle: 'Y', tache: 'Arrachage', etape: 'souches', statut: 'Annulé' },
    { id: 'a1', date: '2026-10-02', parcelle: 'W', tache: 'Effeuillage', statut: 'Validé' },
    { id: 'a2', date: '2026-10-03', parcelle: 'W', tache: 'Effeuillage', statut: 'Annulé' },
    { id: 'a3', date: '2026-10-04', parcelle: 'V', tache: 'Effeuillage', statut: 'Validé' },
    { id: 'a4', date: '2026-10-03', parcelle: 'V', tache: 'Effeuillage', statut: 'Annulé' }];
  let w = monde(S, { parc: [{ nom: 'Z', surface: 0.087, statut: 'Active', taches: {}, tachesExclues: EXCL }], j: J });
  const an = e => w.ctx._mvAnnulee(e);
  T('A1 · une validation suivie d’une « Annulé » ne compte plus', an(J[0]));
  T('A2 · une validation ANTIDATÉE (janvier), saisie avant l’annulation, est annulée aussi', an(J[1]));
  T('A3 · une annulation d’octobre ne touche pas la taille de l’hiver d’avant', !an(J[4]));
  T('A4 · annulée puis revalidée : la première ne compte plus, la seconde compte', an(J[5]) && !an(J[7]));
  T('A5 · une saisie faite dans une AUTRE période n’est pas visée (annulerTache ne remet à zéro que la période active)', !an(J[8]));
  T('A6 · une « Annulé » n’est pas elle-même une saisie annulée', !an(J[2]));
  T('A7 · une étape annulée ne vise qu’elle (démontage compte, souches non)', !an(J[10]) && an(J[11]));
  T('A8 · sans heure lisible, le jour tranche (annulée après : oui ; avant : non)', an(J[13]) && !an(J[15]));
  // ── B. La sélection de l'arrachage ignore une validation annulée (utils.js, _mvSelTravaillees) ──
  w = monde(S, { parc: [{ nom: 'Z', surface: 0.087, statut: 'Active', taches: {} }], j: J.slice(0, 4) });
  T('B1 · arrachage validé puis annulé : la parcelle n’est plus « travaillée », plus concernée', !w.ctx._mvTacheConcerne(P(w, 'Z'), 'Arrachage'));
  w.ctx.JOURNAL.unshift({ id: H('2026-10-09', 19), date: '2026-10-09', parcelle: 'Z', tache: 'Arrachage', statut: 'Validé' });
  T('B2 · une validation saisie après l’annulation la rend concernée', w.ctx._mvTacheConcerne(P(w, 'Z'), 'Arrachage'));
  // ── C. La date d'arrachage compte enfin (utils.js) ──
  const pJan = { nom: 'X', surface: 0.087, statut: 'Arrachee', dateArrachage: '2026-01-15', taches: {}, tachesExclues: EXCL };
  const pOct = { nom: 'O', surface: 0.2, statut: 'Arrachee', dateArrachage: '2026-10-05', taches: {}, selCamp: { Arrachage: 2026 } };
  const pSans = { nom: 'S', surface: 0.3, statut: 'Arrachee', taches: {} };
  const pAct = { nom: 'Z', surface: 0.087, statut: 'Active', taches: {}, tachesExclues: EXCL, selCamp: { Arrachage: 2026 } };
  w = monde(S, { parc: [pJan, pOct, pSans, pAct], j: [] });
  const ap = (p, t, st, d) => w.ctx._mvApresArrachage(P(w, p), { tache: t, statut: st, date: d });
  T('C1 · une taille validée APRÈS l’arrachage est un passage fautif', ap('X', 'Taille', 'Validé', '2026-02-02'));
  T('C2 · une taille d’AVANT l’arrachage compte', !ap('X', 'Taille', 'Validé', '2026-01-10'));
  T('C3 · l’arrachage lui-même compte après la date (souches, piquets)', !ap('X', 'Arrachage', 'Validé', '2026-02-02'));
  T('C4 · une « Annulé » d’après l’arrachage n’est jamais écartée', !ap('X', 'Taille', 'Annulé', '2026-02-03'));
  T('C5 · sans date d’arrachage, ou vigne en place : rien ne change', !ap('S', 'Taille', 'Validé', '2026-02-02') && !ap('Z', 'Taille', 'Validé', '2026-02-02'));
  T('C6 · arrachée en janvier, période consultée commencée le 1er octobre : avant la période', w.ctx._mvArrAvantPeriode(P(w, 'X')));
  T('C7 · arrachée le 5 octobre (dans la période), ou sans date : pas avant', !w.ctx._mvArrAvantPeriode(P(w, 'O')) && !w.ctx._mvArrAvantPeriode(P(w, 'S')));
  T('C8 · éligibilité : plus rien pour l’arrachée de janvier, l’arrachage pour celle d’octobre', !w.ctx._mvSelEligible(P(w, 'X'), 'Arrachage') && w.ctx._mvSelEligible(P(w, 'O'), 'Arrachage') && w.ctx._mvSelEligible(P(w, 'Z'), 'Effeuillage'));
  let wa = monde(S, { parc: [pJan], j: [], visu: 'Hiver 2025' });
  T('C9 · consultée dans SA période (hiver 2025-2026) : l’arrachage y figure encore', !wa.ctx._mvArrAvantPeriode(wa.ctx.PARCELLES[0]));
  const cfgE = { arrachage: { etapes: [{ id: 'demontage', lbl: 'Démontage' }, { id: 'souches', lbl: 'Souches', presta: true }], apres: 'demontage' } };
  const pEt = { nom: 'E', surface: 0.4, statut: 'Arrachee', dateArrachage: '2026-09-20', taches: {}, arrEtapes: { c: 2026, f: { demontage: { d: '2026-09-20' } } } };
  wa = monde(S, { parc: [pEt], j: [], config: cfgE });
  T('C10 · arrachage en étapes entamé et pas fini : la suite reste à valider après la date', !wa.ctx._mvArrAvantPeriode(wa.ctx.PARCELLES[0]) && wa.ctx._arrEntame(wa.ctx.PARCELLES[0]));
  wa.ctx.PARCELLES[0].arrEtapes.f.souches = { d: '2026-09-28', presta: true };
  T('C11 · toutes les étapes faites : plus rien dans la période d’après', wa.ctx._mvArrAvantPeriode(wa.ctx.PARCELLES[0]) && !wa.ctx._arrEntame(wa.ctx.PARCELLES[0]));
  // ── D. Le compte « n/N tâches » (app.js, getPCls réelle) ──
  w = monde(S, { parc: [pJan, pOct, pAct], j: J.slice(0, 4) });
  T('D1 · arrachée en janvier : plus aucune tâche cette période (0/0)', w.ctx.getPCls(P(w, 'X')).nbTotal === 0);
  T('D2 · arrachée dans la période : l’arrachage seul (1 tâche)', w.ctx.getPCls(P(w, 'O')).nbTotal === 1);
  T('D3 · la capture : tâches désactivées, arrachage choisi → 0/1', w.ctx.getPCls(P(w, 'Z')).nbTotal === 1 && w.ctx.getPCls(P(w, 'Z')).nbDone === 0);
  // ── E. « Dernier passage » (app.js, _pDernier réelle) ──
  const JE = J.slice(0, 5).concat([
    { id: H('2026-10-06', 9), date: '2026-10-06', parcelle: 'Z', tache: 'Tirage', statut: 'Validé' },
    { id: H('2026-10-03', 9), date: '2026-10-03', parcelle: 'X', tache: 'Taille', statut: 'Validé' }]);
  w = monde(S, { parc: [pJan, pAct], j: JE });
  const der = (p, t) => w.ctx._pDernier(p, t);
  T('E1 · arrachage validé puis annulé deux fois : plus de « dernier passage »', der('Z', 'Arrachage') === '\u2014');
  T('E2 · la taille de l’hiver d’avant ne s’affiche pas sous la période en cours', der('Z', 'Taille') === '\u2014');
  T('E3 · un passage valable de la période s’affiche', /^6\u00a0oct\.$/.test(der('Z', 'Tirage')));
  T('E4 · un passage saisi après l’arrachage ne s’affiche pas', der('X', 'Taille') === '\u2014');
  wa = monde(S, { parc: [pJan, pAct], j: JE, visu: 'Hiver 2025' });
  T('E5 · consultée en archive, la taille de février s’y affiche', /^2\u00a0févr\.$/.test(wa.ctx._pDernier('Z', 'Taille')));
  // ── F. La fiche de droite (app.js, _pFicheHtml réelle) ──
  const hz = w.ctx._pFicheHtml(P(w, 'Z')), hx = w.ctx._pFicheHtml(P(w, 'X'));
  const nb = (s, m) => s.split(m).length - 1;
  T('F1 · la capture : les quatre tâches désactivées grisées « Non applicable », pas « À faire »', nb(hz, 'pfx-off') === 4 && nb(hz, 'Non applicable') === 4);
  T('F2 · seul l’arrachage choisi reste « À faire » (comme le 0/1 au-dessus)', nb(hz, 'À faire') === 1);
  T('F3 · l’arrachée de janvier le dit en haut, avec sa date, et plus aucun travail', hx.includes('pfx-arr') && hx.includes('Arrachée le 15/01/2026') && hx.includes('Plus aucun travail sur cette parcelle.') && !hx.includes('<table'));
  T('F4 · derniers passages : l’arrachage annulé dit « Annulé ensuite »', hz.includes('Annulé ensuite'));
  T('F5 · derniers passages : la taille d’après l’arrachage le dit', hx.includes('Après l’arrachage'));
  // ── G. La feuille « Arracher la parcelle » (app.js, bloc ARRACH-3/6) ──
  const pB = () => ({ nom: 'B', surface: 0.1, statut: 'Active', taches: {} });
  w = monde(S, { parc: [pB()], j: [] }); w.el('arr-date').value = '2026-01-15'; w.ctx._arrValideRowMaj(P(w, 'B'));
  T('G1 · date d’avant la période : pas de case, la feuille le dit', /avant la p/.test(w.el('arr-valide-row').innerHTML) && !/sel vert/.test(w.el('arr-valide-row').innerHTML));
  T('G2 · …et déclarer ne valide rien', !w.ctx._arrValideAuPassage(P(w, 'B'), '2026-01-15') && !w.ctx.JOURNAL.length && !P(w, 'B').taches.Arrachage);
  w = monde(S, { parc: [pB()], j: [] }); w.el('arr-date').value = '2026-10-05'; w.ctx._arrValideRowMaj(P(w, 'B'));
  T('G3 · date de la période : case cochée d’office, la validation s’écrit à sa date', /sel vert/.test(w.el('arr-valide-row').innerHTML)
    && w.ctx._arrValideAuPassage(P(w, 'B'), '2026-10-05') && w.ctx.JOURNAL.length === 1 && w.ctx.JOURNAL[0].date === '2026-10-05');
  w = monde(S, { parc: [pB()], j: [] }); w.ctx._arrValideRowMaj(P(w, 'B'));
  T('G4 · la garde est dans l’écriture : case cochée, date de janvier → rien', !w.ctx._arrValideAuPassage(P(w, 'B'), '2026-01-15') && !w.ctx.JOURNAL.length);
  w = monde(S, { parc: [pB()], j: [] }); w.el('arr-date').value = '2026-01-15'; w.ctx._arrValideRowMaj(P(w, 'B'));
  w.el('arr-date').value = '2026-10-05'; w.ctx._arrValideRowMaj(P(w, 'B'), true);
  T('G5 · revenir à une date de la période recoche la case', /sel vert/.test(w.el('arr-valide-row').innerHTML));
  w = monde(S, { parc: [pB()], j: [] }); w.el('arr-date').value = '2026-10-05'; w.ctx._arrValideRowMaj(P(w, 'B'));
  w.ctx._arrValideBascule(); w.el('arr-date').value = '2026-10-06'; w.ctx._arrValideRowMaj(P(w, 'B'), true);
  T('G6 · changer de date dans la période garde le choix de l’admin (décochée)', !/sel vert/.test(w.el('arr-valide-row').innerHTML));
  // ── H. Le temps réel (pilotage.js, moteur exécuté) ──
  let V = trJour(S);
  T('H1 · une taille saisie sur une arrachée après sa date ne prend aucune heure (A garde les 24 h)', hp(V, 'X', 'Taille') === 0 && Math.abs(hp(V, 'A', 'Taille') - 24) < 1e-6);
  V = trAttente(S);
  T('H2 · elle ne ramasse plus les heures en attente : elles vont à la vraie clôture suivante (40 h sur A)', hp(V, 'X', 'Taille') === 0 && Math.abs(hp(V, 'A', 'Taille') - 40) < 1e-6);
  // ── I. Les définitions d'une annulation disent la même chose dans le cas courant ──
  const JI = [{ id: H('2026-10-06', 10), date: '2026-10-06', parcelle: 'B', tache: 'Relevage', statut: 'Validé' },
    { id: H('2026-10-06', 10, 15), date: '2026-10-06', parcelle: 'C', tache: 'Relevage', statut: 'Validé' },
    { id: H('2026-10-06', 10, 20), date: '2026-10-06', parcelle: 'C', tache: 'Relevage', statut: 'Annulé' }];
  w = monde(S, { parc: [{ nom: 'B', statut: 'Active' }, { nom: 'C', statut: 'Active' }], j: JI });
  const dv = w.ctx._mvDerniereValidee(['Relevage']);
  T('I1 · CIBLE-1 (la dernière validée) et ARRACH-8 s’accordent sur la validation annulée', dv && dv.nom === 'B' && w.ctx._mvAnnulee(JI[1]) && !w.ctx._mvAnnulee(JI[0]));
  V = tempsReel(S, { PARCELLES: [TR_A], TACHES: [{ nom: 'Taille', hha: 15 }], MEMBRES: [{ nom: 'Victor' }],
    JOURNAL: [{ id: '300', date: '2026-01-05', parcelle: 'A', tache: 'Taille', qui: 'Victor', statut: 'Validé', membresEquipe: [] },
      { id: '301', date: '2026-01-06', parcelle: 'A', tache: 'Taille', qui: 'Victor', statut: 'Annulé', membresEquipe: [] }] },
    { Victor: jours(['2026-01-05'], 8) });
  wa = monde(S, { parc: [{ nom: 'A', statut: 'Active' }], j: [{ id: '300', date: '2026-01-05', parcelle: 'A', tache: 'Taille', statut: 'Validé' },
    { id: '301', date: '2026-01-06', parcelle: 'A', tache: 'Taille', statut: 'Annulé' }] });
  T('I2 · le temps réel et ARRACH-8 s’accordent : validée puis annulée, plus rien', hp(V, 'A', 'Taille') === 0 && wa.ctx._mvAnnulee(wa.ctx.JOURNAL[0]));
  // ── K. Les branchements, lus dans le source ──
  T('K1 · la liste filtrée par tâche suit la même règle', /if\(_mvArrHors\(p,pTacheFilter\)\)return false;/.test(S.app));
  T('K2 · la case suit la date choisie et la date proposée', /el\.onchange=el\.oninput=function\(\)\{ _arrValideRowMaj\(p,true\); \}/.test(fn(S.app, 'function openDPArrachage(){'))
    && /d\.value=date; _arrValideRowMaj\(p,true\);/.test(S.app));
  T('K3 · le journal ne propose plus une arrachée d’avant la période', /_mvTacheConcerne\(p,'Arrachage'\)&&!_mvArrHors\(p,'Arrachage'\)/.test(S.app));
  T('K4 · utils.js expose les définitions communes', S.ut.includes('window._mvAnnulee         = _mvAnnulee;') && S.ut.includes('window._mvArrAvantPeriode = _mvArrAvantPeriode;') && S.ut.includes('window._mvApresArrachage = function(p, j){'));
  const parc1 = bloc(BASE.css, '/* ★ PARC-1 (§274)', '/* ★ FIN PARC-1 */');
  T('K5 · la feuille de style porte le bandeau et la ligne grisée (bloc PARC-1)', parc1.includes('#p-fiche .pfx-arr{') && parc1.includes('tr.pfx-off td{'));
  return out;
}

let ok = 0, ko = 0;
let res; try { res = suite(BASE); } catch (e) { res = [['exception : ' + e.message, false]]; }
res.forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
// La mesure demandée : ce que pesait un passage fautif, moteur exécuté sans la règle ARRACH-8.
try {
  const sans = Object.assign({}, BASE, { pil: BASE.pil.replace("if(typeof window._mvApresArrachage==='function' && window._mvApresArrachage(p,j)) e.horsArr=true;", '') });
  const a = trJour(sans), b = trAttente(sans);
  console.log('\n  MESURE (sans ARRACH-8) · une journée de 24 h, taille validée sur 0,5 ha et sur 0,087 ha arrachés : '
    + hp(a, 'X', 'Taille').toFixed(2) + ' h à la parcelle arrachée (' + Math.round(hp(a, 'X', 'Taille') / 24 * 100) + ' %).');
  console.log('  MESURE (sans ARRACH-8) · trois jours en attente puis la seule validation fautive : ' + hp(b, 'X', 'Taille').toFixed(0)
    + ' h ramassées par elle, ' + hp(b, 'A', 'Taille').toFixed(0) + ' h pour la vraie parcelle.');
} catch (e) { console.log('  (mesure impossible : ' + e.message + ')'); }
console.log(`\nARRACH-8 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) { console.log('base rouge : contre-épreuve sans objet'); process.exit(1); }

const D = [
  ['la fiche liste encore toutes les tâches de la période', 'app', 'var _tv=getTachesSaison().filter(function(t){ return !_mvArrHors(p,t.nom); });', 'var _tv=getTachesSaison();'],
  ['une tâche désactivée redevient « À faire »', 'app', "      if((typeof _mvExclu==='function')?_mvExclu(p,t.nom):(p.tachesExclues||[]).indexOf(t.nom)>=0)\n", '      if(false)\n'],
  ['« Dernier passage » voit les validations annulées', 'app', '    if(ann&&ann(e))return;\n', ''],
  ['« Dernier passage » relit tout le journal', 'app', "    if(vn&&typeof window._saisonForDate==='function'&&window._saisonForDate(ds)!==vn)return;\n", ''],
  ['« Dernier passage » voit les passages d’après l’arrachage', 'app', '    if(apr&&p&&apr(p,e))return;\n', ''],
  ['les derniers passages taisent l’annulation', 'app', "s='Annul\\u00e9 ensuite';", 's=s;'],
  ['une étape annulée annule les autres', 'ut', '    if(a.e && a.e !== e) continue;', ''],
  ['une annulation d’octobre touche l’hiver d’avant', 'ut', '    if(a.per === per) return true;', '    return true;'],
  ['la sélection compte les saisies annulées', 'ut', '    if(_mvAnnulee(j)) continue;', ''],
  ['l’arrachage en étapes entamé disparaît', 'ut', "  if(typeof window._arrEntame === 'function' && window._arrEntame(p)) return false;\n", ''],
  ['l’éligibilité oublie la date d’arrachage', 'ut', ' && !_mvArrAvantPeriode(p));', ');'],
  ['la règle de la fiche oublie la date d’arrachage', 'app', " || !!(nom==='Arrachage' && typeof window._mvArrAvantPeriode==='function' && window._mvArrAvantPeriode(p))", ''],
  ['l’écriture valide un arrachage d’avant la période', 'app', '  if(_arrDateAvantPeriode(date)) return false;', ''],
  ['la feuille ignore la date', 'app', "  if(_arrDateAvantPeriode(((document.getElementById('arr-date')||{}).value)||'')){", '  if(false){'],
  ['la case perd le choix de l’admin quand la date change', 'app', '  if(!parDate||_ARRV.avant) _ARRV.on=true;', '  _ARRV.on=true;'],
  ['le temps réel compte les passages d’après l’arrachage', 'pil', "if(typeof window._mvApresArrachage==='function' && window._mvApresArrachage(p,j)) e.horsArr=true;", ''],
  ['une « Annulé » d’après l’arrachage est écartée', 'ut', "  if(st !== 'Valid\\u00e9' && st !== 'En cours') return false;\n  var a = _mvArrDate(p);", '  var a = _mvArrDate(p);'],
  ['le filtre de la liste garde une arrachée d’avant la période', 'app', '      if(_mvArrHors(p,pTacheFilter))return false;', "      if(p.statut==='Arrachee'&&pTacheFilter!=='Arrachage')return false;"],
];
let rg = 0;
D.forEach(([nom, f, a, b]) => {
  const n = BASE[f].split(a).length - 1;
  if (n !== 1) { console.log('  \u2717 ANCRE ' + (n ? 'NON UNIQUE' : 'INTROUVABLE') + ' : ' + nom); return; }
  const S2 = Object.assign({}, BASE, { [f]: BASE[f].replace(a, b) });
  let r; try { r = suite(S2); } catch (e) { r = [['exception', false]]; }
  const rouge = r.some(([, c]) => !c); if (rouge) rg++;
  console.log((rouge ? '  \u2713 rougit : ' : '  \u2717 RESTE VERT : ') + nom);
});
console.log(`\n${rg}/${D.length} contre-épreuves rougissent`);
process.exit(rg === D.length ? 0 : 1);
