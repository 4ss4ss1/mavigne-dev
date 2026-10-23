#!/usr/bin/env node
// PIL-RANGE-1b (§441) : le rendu de secours de cockpit.js (fil, plan et cockpit de secours) est retiré avec l'ancien Aujourd'hui ;
//   les assertions qui le visaient partent, celles du cockpit v2 et des lectures partagées restent.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
//  HORS-1 (§322) — LA PARCELLE PAS CONCERNÉE PAR LA TÂCHE AFFICHÉE : UN FANTÔME
//  Nico (12/10, dicté) : « dans le pilotage, toutes les parcelles sont indiquées pour des tâches qui ne les concernent pas, qui ont
//  été désactivées ; elles sont indiquées à faire, ce qui est faux ». Choix (12/10) : « fantôme » — la parcelle garde sa place, en
//  contour pâle, et ne compte nulle part. La carte « Priorité du moment » de l'Accueil avait le même trou.
//  Exécute la VRAIE règle « concernée » (utils.js : _mvTacheSel, _mvSelChoisie, _mvTacheConcerne), la VRAIE lecture du plan
//  (cockpit.js entier : états, équipes, « En cours sur … » d'À savoir, plan de secours), le VRAI modèle du cockpit (_pilCk2Modele),
//  les VRAIS calc, majPlan et phraseEtat de cockpit-vue.js sur un faux DOM, la VRAIE carte de l'Accueil (_homePrioCarte) ; lit la
//  feuille, l'aide, le guide, les nouveautés et la liste.
//    node scripts/mv-harnais-hors1.mjs [--contre]
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RAC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const L = f => fs.readFileSync(path.join(RAC, f), 'utf8');
const CONTRE = process.argv.includes('--contre');
const SRC0 = { ck: L('src/cockpit.js'), pil: L('src/pilotage.js'), vue: L('src/cockpit-vue.js'), app: L('src/app.js'), uti: L('src/utils.js'), css: L('src/styles.css'),
  g11: L('guide/11-pilotage.html'), g04: L('guide/04-vigne.html'), liste: L('scripts/mv-harnais-liste.mjs') };
const fnDe = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n}\n', i) + 3); };
const fonction = (src, debut) => { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0;
  for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1) + '\n'; };
const ligne = (s, re) => { const m = s.match(re); if (!m) throw new Error('absente : ' + re); return m[0] + '\n'; };
const blocDe = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error('bloc introuvable : ' + a); return s.slice(i, j); };
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3;
  for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
const J0 = new Date(), iso = k => { const d = new Date(J0.getFullYear(), J0.getMonth(), J0.getDate() + k); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const ord = k => Math.round((Date.UTC(J0.getFullYear(), J0.getMonth(), J0.getDate() + k) - Date.UTC(2026, 0, 1)) / 864e5);

// La VRAIE règle « concernée » (utils.js). Deux doublures qui LISENT leurs arguments : la campagne du jour vaut 7 (_mvCampNum),
// et la parcelle « Vigne » a de l'effeuillage saisi pendant la campagne 7 (_mvSelTravaillees) — sinon rien.
const regle = S => ligne(S.uti, /^var MV_TACHES_SEL = .*$/m) + ligne(S.uti, /^function _mvTacheSel\(nom\)\{.*$/m)
  + 'function _mvCampNum(c){ var n = parseInt(c, 10); return isNaN(n) ? 7 : n; }\n'
  + "function _mvSelTravaillees(c){ return c === 7 ? { 'Vigne\\u0000Effeuillage': true } : {}; }\n"
  + fnDe(S.uti, 'function _mvSelChoisie(p, nom, camp){') + fnDe(S.uti, 'function _mvTacheConcerne(p, nom, camp){');
// La lecture du plan : cockpit.js entier, avec ou sans la règle (sans : une fonction absente ne doit rien casser).
function lecture(S, avecRegle = true) {
  const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, isNaN, setTimeout: () => 0, localStorage: { getItem: () => null } };
  ctx.window = ctx; vm.createContext(ctx);
  if (avecRegle) vm.runInContext(regle(S), ctx);
  vm.runInContext(S.ck, ctx);
  return ctx;
}
// Le modèle du cockpit (pilotage.js), comme mv-harnais-etat1, avec la vraie règle : la taille désactivée sur Combe, le désherbage choisi sur Champ seulement.
function modele(S) {
  const P = [{ nom: 'Combe', surface: .5, appellation: '', commune: 'Gevrey-Chambertin', statut: 'Active', tachesExclues: ['Taille'], taches: {} },
    { nom: 'Clos', surface: .4, appellation: '', commune: 'Gevrey-Chambertin', statut: 'Active', taches: { Taille: 'En cours' } },
    { nom: 'Champ', surface: .3, appellation: '', commune: 'Brochon', statut: 'Active', selCamp: { Desherbage: 7 }, taches: {} },
    { nom: 'Vigne', surface: .2, appellation: '', commune: 'Brochon', statut: 'Active', taches: {} }];
  const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, isNaN, setTimeout: () => 0, localStorage: { getItem: () => null } };
  ctx.window = ctx;
  Object.assign(ctx, { PARCELLES: P, JOURNAL: [], MEMBRES: [], PLANNING_ENTRIES: {}, METEO_HOURLY: null, METEO_DAILY: null,
    tNom: n => ({ Desherbage: 'Désherbage manuel' }[n] || n), _mvToday: () => iso(0),
    _mvTacheDuMoment: o => (o && Array.isArray(o.noms) && typeof o.fini === 'function')
      ? { mode: 'dates', taches: ['Taille'], items: [], dates: { Taille: { debut: iso(-20), fin: iso(59) } }, retard: {} }
      : { mode: 'aucune', taches: [], items: [], dates: {}, retard: {} } });
  vm.createContext(ctx); vm.runInContext(regle(S), ctx); vm.runInContext(S.ck, ctx);
  vm.runInContext(fnDe(S.pil, 'function _pilEtatEntree(e){') + "window._mvEnContratLe = window._mvEnContratLe || function(){ return true; };\n" + fnDe(S.pil, 'function _pilPhotoIso(dt){')
    + fnDe(S.pil, 'function _pilPrevuLe(m, dt){') + fnDe(S.pil, 'function _pilFerieLe(dt){') + fnDe(S.pil, 'function _pilJourCalendrier(dt){') + fnDe(S.pil, 'function _pilSaisiAuTravail(m, d0){') + fnDe(S.pil, 'function _pilJourDomaine(dt){') + fnDe(S.pil, 'function _pilMembresActifs(ds){') + fnDe(S.pil, 'function _pilPrioDuJour(d){')
    + fnDe(S.pil, 'function _pilCk2Modele(d, m){') + `
    function _pilSaison(){ return { nom:'Hiver 2026-2027', debut:'${iso(-60)}', fin:'${iso(120)}' }; }
    function _pilFmtD(s){ return String(s || ''); }
    function _rfCd(){ return { taskWindows: [{ nom:'Taille', ws:${ord(-20)}, we:${ord(60)} }] }; }
    function _pilRetards(){ return {}; }
    function _pilTensData(){ return { rows: [], nRouge:0, nSeuil:0 }; }
    function _pilPhotoListe(){ return []; }
    function _pilTraiterCalc(){ return { big:'Pas aujourd’hui', rai:'Hors saison', ban:'' }; }
    function _pilDiag(){ return []; }
    function _pilGainsProlong(){ return {}; }
    function _pilMargeCalc(){ return { fin:null, obj:null, marge:0 }; }
    this.__V = _pilCk2Modele({ data: [{ nom:'Taille', pct:10, h_done:10, h_total:100, surf_total:1 }, { nom:'Desherbage', pct:0, h_done:0, h_total:0, surf_total:1 }],
      totalReste:90, totalTotal:100, hDone:10, gaugePct:10, saison:{ nom:'Hiver' }, presences:[{ nom:'Hugo', etat:'present' }], tracs:[] },
      { obj:new Date(Date.now()+48*864e5), proj:new Date(Date.now()+43*864e5), marge:5, cadH:35 });`, ctx);
  return ctx.__V;
}
// La vue (cockpit-vue.js) : calc, majPlan, phraseEtat et leurs helpers extraits du vrai fichier, sur un faux DOM qui garde ce qu'on y écrit.
const DOM = `
function El(attrs){ var e = { attrs: Object.assign({}, attrs || {}), dataset: {}, hidden: false, textContent: '', style: {}, _c: {} };
  e.getAttribute = function(k){ return this.attrs[k] == null ? null : this.attrs[k]; };
  e.setAttribute = function(k, v){ this.attrs[k] = String(v); };
  e.classList = { toggle: function(k, on){ if(on) e._c[k] = 1; else delete e._c[k]; }, contains: function(k){ return !!e._c[k]; } };
  return e; }
var ELS = {}, PATHS = [], LEGB = [];
function $(sel){ if(sel === '.ck-leg-i[data-f="hors"]') return LEGB.filter(function(b){ return b.dataset.f === 'hors'; })[0] || null; return ELS[sel] || null; }
function $$(sel){ return sel === '.ck-pa' ? PATHS : (sel === '.ck-leg-i' ? LEGB : []); }
var document = { getElementById: function(id){ return ELS['#' + id] || null; } };
var Anim = { compter: function(el, v){ if(el) el.textContent = String(v); } };
`;
// Deux tâches : la taille (désactivée sur Combe et sur Loin) et l'effeuillage (à la sélection). Gevrey : Clos, Combe et une arrachée ;
// Bourgogne : Loin seule.
const SCENE = `
AUJ = new Date(2026, 9, 12); VISEE = new Date(2026, 11, 1); HA_TOT = 2.5;
V = { hFait: 0, hTotal: 0, pct: 0, reste: 0, marge: 0, capMoy: 0, besoin: 0, eco: {} };
TACHES = [{ id: 'taille', nom: 'Taille', art: 'la taille', f: true, sel: false, fin: new Date(2099, 0, 1), pct: null, hDone: null, hTotal: null, hha: 0, eqFini: false, cle: 'Taille' },
  { id: 'eff', nom: 'Effeuillage', art: 'l\\u2019effeuillage', f: false, sel: true, fin: new Date(2099, 0, 1), pct: null, hDone: null, hTotal: null, hha: 0, eqFini: false, cle: 'Effeuillage' }];
T = {}; TACHES.forEach(function(t){ T[t.id] = t; });
PARCS = [{ id: 'p0', nom: 'Clos', ha: 1, app: 'a0', arr: false, f: null }, { id: 'p1', nom: 'Combe', ha: 1, app: 'a0', arr: false, f: null },
  { id: 'p2', nom: 'Loin', ha: 0.5, app: 'a1', arr: false, f: null }, { id: 'p3', nom: 'Vieille', ha: 1, app: 'a0', arr: true, f: null }];
PIDX = {}; PARCS.forEach(function(p){ PIDX[p.id] = p; });
APPS = [{ id: 'a0', nom: 'Gevrey-Chambertin', ha: 2 }, { id: 'a1', nom: 'Bourgogne', ha: 0.5 }]; AIDX = { a0: APPS[0], a1: APPS[1] };
S = { etats: { taille: { p0: 'faite', p1: 'hors', p2: 'hors' }, eff: { p0: 'afaire', p1: 'afaire', p2: 'afaire' } }, presta: {}, equipes: [], vue: 'taille', filtre: null, sel: null };
PARCS.forEach(function(p){ var el = El({ class: 'ck-pa' }); el.dataset.id = p.id; PATHS.push(el); ELS['#ck-pr-' + p.id] = El({}); });
LEG.forEach(function(x){ var b = El({ 'aria-pressed': 'false' }); b.dataset.f = x[0]; LEGB.push(b); ELS['#ck-leg-' + x[0]] = El({}); });
['a0', 'a1'].forEach(function(a){ ELS['#ck-zp-' + a] = El({}); ELS['#ck-zt-' + a] = El({}); });
ELS['#ck-plan-cadre'] = El({}); ELS['#ck-carte'] = El({});
`;
function vue(S) {
  const c = { Math, Number, String, Array, Object, JSON, Date, Set, Intl, isNaN, parseFloat };
  vm.createContext(c);
  const i = S.vue.indexOf('const etatVue = (t, pid) => {'); if (i < 0) throw new Error('etatVue introuvable');
  const etatVue = S.vue.slice(i, S.vue.indexOf('\n};\n', i) + 4);
  vm.runInContext(ligne(S.vue, /^const NF0 = .*$/m) + ligne(S.vue, /^const NF2 = .*$/m) + ligne(S.vue, /^const nb = .*$/m) + ligne(S.vue, /^const haTxt = .*$/m)
    + ligne(S.vue, /^const esc = .*$/m) + ligne(S.vue, /^const libEtat = .*$/m) + ligne(S.vue, /^const LEG = .*$/m) + DOM
    + 'var S, T, TACHES, PARCS, PIDX, APPS, AIDX, AUJ, VISEE, V, R, HA_TOT, EQ = {};\nfunction finPrevue(){ return AUJ; }\nfunction majEquipes(){}\nfunction onde(){}\nfunction quand(){ return "aujourd\\u2019hui"; }\n'
    + etatVue + fnDe(S.vue, 'function calc() {') + fnDe(S.vue, 'function majPlan(o = {}) {') + fnDe(S.vue, 'function phraseEtat(t, pid) {') + SCENE, c);
  return c;
}
// La VRAIE carte de l'Accueil (app.js), comme mv-harnais-forme2, sans contours (des rectangles), priorité « Taille ».
function accueil(S, P, ST, avecPrio, avecRegle) {
  const ctx = { Math, Object, String, Array, Number, isFinite, JSON, parseInt, isNaN };
  ctx.window = ctx; vm.createContext(ctx);
  if (avecRegle) vm.runInContext(regle(S), ctx);
  vm.runInContext(['function _homeSurf(p){', 'function _homeHa(x){', 'function _homeForme(f,r){', 'function _homePrioCarte(){'].map(d => fonction(S.app, d)).join('\n'), ctx);
  const el = id => ({ id, parentNode: null, className: '', classList: { add() {} }, innerHTML: '' });
  const w = el('w'), kp = el('home-kpis'), eq = el('home-eqj-wrap'), corps = { v: null };
  w.insertBefore = n => { n.parentNode = w; if (n.id === 'home-prio-corps') corps.v = n; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  Object.assign(ctx, {
    document: { querySelector: () => w, getElementById: id => (id === 'home-kpis' ? kp : id === 'home-eqj-wrap' ? eq : id === 'home-prio-corps' ? corps.v : null), createElement: () => el('home-prio-corps') },
    PARCELLES: P, _prioItems: () => (avecPrio ? [{ t: 'Taille', equipe: [] }] : []), getTacheStatut: p => ST[p.nom],
    getPCls: p => ({ pct: ST[p.nom] === 'Validé' ? 100 : 0 }), tNom: t => t, _escAttr: esc, _escHtml: esc, _pvSurfFr: s => s });
  ctx._homePrioCarte();
  const html = corps.v ? corps.v.innerHTML : '', noms = [], btn = {};
  html.replace(/<button[^>]*data-nom="([^"]*)"[^>]*>/g, (m, n) => { noms.push(n); btn[n] = m; return m; });
  return { html, noms, btn };
}

function suite(S) {
  const out = []; const T = (n, c) => { let v; try { v = typeof c === 'function' ? c() : c; } catch (e) { v = false; n += ' — plantage : ' + (e && e.message); } out.push([n, !!v]); };
  // ── A. la lecture du plan (cockpit.js) avec la vraie règle
  let W = null; T('A0 cockpit.js et la règle d’utils.js se chargent', () => { W = lecture(S); return typeof W._ckPlanEtats === 'function' && typeof W._mvTacheConcerne === 'function'; });
  const PA = [{ nom: 'A', taches: {} }, { nom: 'X', tachesExclues: ['Taille'], taches: { Taille: 'Validé' } }, { nom: 'R', statut: 'Arrachee', tachesExclues: ['Taille'], taches: {} },
    { nom: 'C', taches: { Taille: 'En cours' } }];
  T('A1 la taille désactivée sur X : « hors », même validée avant (la fiche dit « Non applicable ») ; à faire, en cours et arrachée ne bougent pas',
    () => { const e = W._ckPlanEtats(PA, [], 'Taille', null, false); return e.A === 'afaire' && e.X === 'hors' && e.R === 'arr' && e.C === 'cours'; });
  T('A2 fenêtre passée : ce qui est à faire est en retard, une parcelle hors reste hors', () => { const e = W._ckPlanEtats(PA, [], 'Taille', null, true); return e.A === 'retard' && e.X === 'hors'; });
  T('A3 l’exclusion vaut pour SA tâche : X reste à faire pour le tirage', () => W._ckPlanEtats(PA, [], 'Tirage', null, false).X === 'afaire');
  const PS = [{ nom: 'Ch', selCamp: { Effeuillage: 7 }, taches: {} }, { nom: 'Nc', taches: {} }, { nom: 'Vigne', taches: { Effeuillage: 'Validé' } },
    { nom: 'Old', selCamp: { Effeuillage: 6 }, taches: {} }, { nom: 'Ex', tachesExclues: ['Effeuillage'], selCamp: { Effeuillage: 7 }, taches: {} }];
  T('A4 tâche à la sélection : choisie pour la campagne = à faire ; pas choisie, ou une campagne d’avant = hors ; travaillée cette campagne = sa fiche ; p.tachesExclues ne joue pas (SEL-1)',
    () => { const e = W._ckPlanEtats(PS, [], 'Effeuillage', null, false); return e.Ch === 'afaire' && e.Nc === 'hors' && e.Old === 'hors' && e.Vigne === 'faite' && e.Ex === 'afaire'; });
  T('A5 aucune équipe sur une parcelle hors, même avec un « En cours » au journal', () => Object.keys(W._ckPlanDebuts([{ nom: 'X', tachesExclues: ['Taille'], taches: { Taille: 'En cours' } }],
    [{ date: iso(-2), parcelle: 'X', tache: 'Taille', qui: 'Hugo', statut: 'En cours' }], 'Taille', null)).length === 0);
  T('A6 sans la règle (fonction absente : harnais, ordre de chargement) : rien ne plante, l’état suit la fiche comme avant', () => lecture(S, false)._ckPlanEtats(PA, [], 'Taille', null, false).X === 'faite');
  T('A7 À savoir, « En cours sur … » : les parcelles pas encore faites ne comptent plus une parcelle hors', () => {
    const l = W._ckEnCours([{ nom: 'Taille', pct: 10 }], { parcs: [{ nom: 'A', taches: {} }, { nom: 'X', tachesExclues: ['Taille'], taches: {} }, { nom: 'C', taches: { Taille: 'En cours' } }],
      journal: [], fen: [{ nom: 'Taille', ws: ord(-5), we: ord(30) }] }, iso(0));
    return l.length === 1 && l[0].nom === 'Taille' && l[0].n === 2; });
  // ── C. le VRAI modèle du cockpit (pilotage.js)
  let V = null; T('C0 le modèle se construit', () => { V = modele(S); return !!(V && V.etats && V.etats.taille); });
  if (V) {
    T('C1 la taille désactivée sur Combe : « hors » dans le modèle ; Clos reste en cours', () => V.etats.taille.Combe === 'hors' && V.etats.taille.Clos === 'cours');
    T('C2 le désherbage choisi sur Champ seulement : Champ à faire, Vigne hors', () => V.etats.desherbage && V.etats.desherbage.Champ === 'afaire' && V.etats.desherbage.Vigne === 'hors');
    T('C3 chaque tâche dit si elle est à la sélection (la loupe en tire sa raison), et l’article suit le nom : « le désherbage manuel », « la taille »', () => {
      const td = V.taches.filter(t => t.id === 'desherbage')[0], tt = V.taches.filter(t => t.id === 'taille')[0];
      return !!td && !!tt && td.sel === true && tt.sel === false && td.art === 'le désherbage manuel' && tt.art === 'la taille'; });
  }
  // ── D. la vue (cockpit-vue.js) : calc, majPlan, phraseEtat
  let C = null; T('D0 la vue se monte (calc, majPlan, phraseEtat extraits du vrai fichier)', () => { C = vue(S); return !!C; });
  if (C) {
    const run = s => vm.runInContext(s, C);
    T('D1 l’avancement d’une tâche ne compte que les parcelles concernées (taille : 1 ha concerné, fait = 100 %) ; l’effeuillage les compte toutes', () => { run('R = calc();');
      return C.R.t.taille.haT === 1 && C.R.t.taille.pct === 100 && C.R.t.eff.haT === 2.5; });
    T('D2 l’appellation : Gevrey 100 % (Combe hors ne compte pas), Bourgogne sans parcelle concernée = null ; la surface en production ne bouge pas', () =>
      C.R.a.a0.pct === 100 && C.R.a.a1.pct === null && C.R.a.a0.ha === 2);
    T('D3 majPlan : Combe dessinée « et-hors », sans rangs, et lue « pas concernée par la taille » ; Clos reste faite', () => { run('majPlan();');
      const P0 = C.PATHS[0], P1 = C.PATHS[1];
      return /\bet-hors\b/.test(P1.attrs.class) && /\bet-faite\b/.test(P0.attrs.class) && C.ELS['#ck-pr-p1']._c.hors === 1 && !C.ELS['#ck-pr-p0']._c.hors
        && /, pas concernée par la taille$/.test(P1.attrs['aria-label']) && /taille faite$/.test(P0.attrs['aria-label']); });
    const btnH = () => C.LEGB.filter(b => b.dataset.f === 'hors')[0];
    T('D4 la légende : « Pas concernées 2 » visible ; faites 1, à faire 0, arrachée 1', () => C.ELS['#ck-leg-hors'].textContent === '2' && btnH().hidden === false
      && C.ELS['#ck-leg-faite'].textContent === '1' && C.ELS['#ck-leg-afaire'].textContent === '0' && C.ELS['#ck-leg-arr'].textContent === '1');
    T('D5 le trait des appellations : Gevrey 100 % fini ; Bourgogne un tiret, trait vide', () => C.ELS['#ck-zt-a0'].textContent === '100\u202f%' && C.ELS['#ck-zt-a1'].textContent === '\u2014'
      && C.ELS['#ck-zp-a1'].style.transform === 'scaleX(0.0000)' && !/fini/.test(C.ELS['#ck-zp-a1'].attrs.class || '') && /fini/.test(C.ELS['#ck-zp-a0'].attrs.class || ''));
    T('D6 une tâche sans parcelle hors : la ligne « Pas concernées » se cache, et le filtre posé dessus tombe avec elle (boutons relâchés)', () => {
      run("S.vue = 'eff'; S.filtre = 'hors'; ELS['#ck-carte'].dataset.filtre = 'hors'; LEGB.forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.f === 'hors' ? 'true' : 'false'); }); R = calc(); majPlan();");
      return btnH().hidden === true && C.S.filtre === null && !('filtre' in C.ELS['#ck-carte'].dataset) && C.LEGB.every(b => b.attrs['aria-pressed'] === 'false')
        && !/\bet-hors\b/.test(C.PATHS[1].attrs.class) && C.ELS['#ck-pr-p1']._c.hors === undefined; });
    T('D7 la loupe dit pourquoi : « désactivée sur cette parcelle », ou « pas choisie pour cette campagne » pour une tâche à la sélection ; les autres comme avant', () => {
      run("S.vue = 'taille'; S.etats.eff.p2 = 'hors';");
      return C.phraseEtat('taille', 'p1') === 'Pas concernée par la taille (désactivée sur cette parcelle)' && C.phraseEtat('eff', 'p2') === 'Pas concernée par l’effeuillage (pas choisie pour cette campagne)'
        && C.phraseEtat('taille', 'p0') === 'Taille faite'; });
  }
  // ── E. la VRAIE carte de l'Accueil (app.js)
  const PE = [{ nom: 'A', surface: '1', statut: 'Active' }, { nom: 'B', surface: '1', statut: 'Active' }, { nom: 'X', surface: '2', statut: 'Active', tachesExclues: ['Taille'] },
    { nom: 'Arr', surface: '1', statut: 'Arrachee' }];
  const STE = { A: 'Validé', X: 'Validé' };
  let E1 = { html: '', noms: [], btn: {} }; T('E0 la carte se rend', () => { E1 = accueil(S, PE, STE, true, true); return E1.html.length > 0; });
  T('E1 priorité « Taille » : X, où elle est désactivée, est un fantôme (hpc-hors), rangé en dernier, et son titre le dit', () => /class="hpc-p hpc-hors"/.test(E1.btn.X || '')
    && E1.noms.join() === 'A,B,X' && (E1.btn.X || '').includes('title="X, 2 ha, pas concernée"') && (E1.btn.X || '').includes('aria-label="X"'));
  T('E2 le pourcentage et les hectares ne comptent que les concernées : 50 %, 1,00 ha faits sur 2,00 ha', () => E1.html.includes('<div class="hpc-pct">50<small>')
    && E1.html.includes('1,00\u00a0ha faits sur 2,00\u00a0ha'));
  T('E3 la légende « Pas concernées » n’apparaît que s’il y en a', () => { const E3 = accueil(S, PE.map(p => Object.assign({}, p, { tachesExclues: [] })), STE, true, true);
    return /<span class="hpc-l-hors"><i><\/i><b>\d+<\/b> pas concernées?<\/span>/.test(E1.html) && !E3.html.includes('hpc-l-hors') && E3.html.includes('<div class="hpc-pct">75<small>'); });
  T('E4 sans la règle (fonction absente) : la carte d’avant, rien ne plante', () => { const E4 = accueil(S, PE, STE, true, false); return !E4.html.includes('hpc-hors') && E4.html.includes('<div class="hpc-pct">75<small>'); });
  T('E5 sans priorité, la saison parcelle par parcelle : pas de fantôme', () => { const E5 = accueil(S, PE, STE, false, true); return !E5.html.includes('hpc-hors') && E5.html.includes('3 parcelles, 4,00\u00a0ha'); });
  // ── F. la feuille
  T('F1 la feuille : le fantôme (sans fond, trait le plus pâle), sans rangs même sous un filtre, la ligne de légende cachée, la pastille, la loupe, la carte de l’Accueil — par jetons seulement', () => {
    const b = blocDe(S.css, '/* ★ HORS-1 (§322)', '/* ★ FIN HORS-1 */');
    return b.includes('.ck2 .ck-pa.et-hors{fill:transparent;stroke:var(--ligne,#E7E6E2)}') && b.includes('.ck2 .ck-pr.hors,.ck2 .ck-carte[data-filtre] .ck-pr.hors{opacity:0}')
      && b.includes('.ck-leg-i[hidden]{display:none}') && /\.sw-hors\{/.test(b) && /\.mv-fo\.et-hors\{/.test(b) && b.includes('#page-home .hpc-p.hpc-hors{')
      && b.includes('#page-home .hpc-fo.hpc-hors path{') && b.includes('#page-home .hpc-leg .hpc-l-hors i{') && enDur(b).length === 0; });
  // ── G. l'aide, la bulle, le guide, les nouveautés, la liste (sur le texte)
  T('G1 l’aide (MV_AIDE Pilotage et Accueil, MV_INFO du plan), la bulle du cockpit et les deux pages du guide disent le contour pâle',
    S.uti.includes('colorée selon son état sur sa fiche pour la tâche choisie, en contour pâle quand cette tâche y est désactivée, rangée par appellation')
    && S.uti.includes('reste en contour pâle, en dernier, et ne compte pas dans l’avancement')
    && S.vue.includes('reste à sa place en contour pâle : ni à faire ni en retard, elle ne compte pas dans l’avancement')
    && S.g11.includes('en contour pâle quand cette tâche y est désactivée') && S.g04.includes("reste en contour pâle et ne compte pas dans l'avancement"));
  T('G2 la nouveauté : bloc 8.90 (niveau 0 : le Journal), un item admin pour le plan, un item pour tous pour l’Accueil ; APP au moins 8.90', (() => {
      const v = (S.uti.match(/export const APP_VERSION = '(\d+)\.(\d+)';/) || []).slice(1).map(Number);
      return v.length === 2 && (v[0] > 8 || (v[0] === 8 && v[1] >= 90)); })()
    && S.uti.includes("  { v: '8.90', d: '2026-10-12', items: [\n    { niv: 0, pour: ['admin'], emoji: 'carte', titre: 'Le domaine en direct : les parcelles pas concernées en fantôme',")
    && S.uti.includes("    { niv: 0, pour: ['tous'], emoji: 'carte', titre: 'La priorité du moment ne compte que les parcelles concernées',"));
  T('G3 le harnais est dans la liste, avec sa contre-épreuve', S.liste.includes("['node scripts/mv-harnais-hors1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-hors1.mjs --contre'],"));
  return out;
}

function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'HORS-1 : ' + ko + ' ROUGE(S) sur ' + res.length : 'HORS-1 : ' + res.length + ' vertes'));
if (CONTRE) {
  const DEF = [
    ['le plan ignore la tâche désactivée (le défaut signalé)', 'ck', "    if(conc && !conc(p, tache)){ etat[p.nom] = 'hors'; return; }\n", ''],
    ['la règle appelée sans garde (fonction absente : plantage)', 'ck', 'if(conc && !conc(p, tache)){', 'if(!window._mvTacheConcerne(p, tache)){'],
    ['« hors » lu avant « arrachée »', 'ck', "    if(/arrach/i.test(String(p.statut || ''))){ etat[p.nom] = 'arr'; return; }\n    if(conc && !conc(p, tache)){ etat[p.nom] = 'hors'; return; }\n",
      "    if(conc && !conc(p, tache)){ etat[p.nom] = 'hors'; return; }\n    if(/arrach/i.test(String(p.statut || ''))){ etat[p.nom] = 'arr'; return; }\n"],
    ['une parcelle hors passe en retard', 'ck', "if(etat[n] === 'afaire') etat[n] = 'retard';", "if(etat[n] === 'afaire' || etat[n] === 'hors') etat[n] = 'retard';"],
    ['calc compte les hors dans l’appellation', 'vue', "const pc = S.vue ? ps.filter(p => S.etats[S.vue][p.id] !== 'hors') : ps,", 'const pc = ps,'],
    ['calc compte les hors dans la tâche', 'vue', "if (p.arr || S.etats[t.id][p.id] === 'hors') return;", 'if (p.arr) return;'],
    ['les rangs restent dessinés sur un fantôme', 'vue', " r.classList.toggle('hors', e === 'hors');", ''],
    ['la ligne « Pas concernées » toujours visible', 'vue', 'if (bh) bh.hidden = !n.hors;', 'if (bh) bh.hidden = false;'],
    ['le filtre posé sur une ligne cachée reste', 'vue', "if (S.filtre === 'hors' && !n.hors) {", 'if (false) {'],
    ['la loupe sans la raison', 'vue', "  if (e === 'hors') return 'Pas concernée par ' + esc(T[t].art)", "  if (false) return 'Pas concernée par ' + esc(T[t].art)"],
    ['un pourcentage écrit là où rien n’est concerné', 'vue', "x.pct == null ? '\\u2014' : nb(x.pct)", 'nb(x.pct)'],
    ['l’étiquette lue comme « taille pas concernée »', 'vue', "(e === 'hors' ? 'pas concernée par ' + T[t].art : ", "(false ? '' : "],
    ['le modèle ne dit plus la sélection', 'pil', " sel:(typeof window._mvTacheSel==='function')&&!!window._mvTacheSel(r.nom),", ''],
    ['l’article d’avant (« la désherbage manuel »)', 'pil', '(/age\\b/.test(l)?', '(/age$/.test(l)?'],
    ['l’Accueil ignore la tâche désactivée', 'app', "    if(t&&typeof window._mvTacheConcerne==='function'&&!window._mvTacheConcerne(p,t)) return 'hors';", ''],
    ['l’Accueil compte les hors dans les hectares', 'app', "if(e==='hors'){ nHors++; } else surf+=sf;", "if(e==='hors'){ nHors++; } surf+=sf;"],
    ['l’Accueil affiche la légende des hors sans hors', 'app', "+(nHors?'<span class=\"hpc-l-hors\">", "+(true?'<span class=\"hpc-l-hors\">"],
    ['l’Accueil range les hors au hasard', 'app', 'rang={fait:0,cours:1,afaire:2,hors:3};', 'rang={fait:0,cours:1,afaire:2};'],
    ['la feuille dessine les rangs du fantôme', 'css', '.ck2 .ck-pr.hors,.ck2 .ck-carte[data-filtre] .ck-pr.hors{opacity:0}\n', ''],
    ['la feuille sans le fantôme', 'css', '.ck2 .ck-pa.et-hors{fill:transparent;stroke:var(--ligne,#E7E6E2)}\n', ''],
    ['la feuille laisse voir la ligne cachée', 'css', '.ck-leg-i[hidden]{display:none}\n', ''],
  ];
  let manques = 0;
  DEF.forEach(([nom, f, a, bb]) => {
    const S = Object.assign({}, SRC0);
    if (S[f].split(a).length !== 2) { console.log('  ??  ancre introuvable ou multiple : ' + nom); manques++; return; }
    S[f] = S[f].replace(a, bb);
    const rouge = jouer(S).some(x => !x[1]);
    if (!rouge) manques++;
    console.log((rouge ? '  ok  rougit : ' : '  KO  reste vert : ') + nom);
  });
  console.log('\n' + (manques ? 'CONTRE-ÉPREUVES ROUGES ' + manques : 'CONTRE-ÉPREUVES VERTES') + ' \u2014 ' + DEF.length + ' défauts réinjectés');
  process.exit(ko || manques ? 1 : 0);
}
process.exit(ko ? 1 : 0);
