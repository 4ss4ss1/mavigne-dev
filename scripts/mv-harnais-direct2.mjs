#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
//  DIRECT-2 (§328) — « EN DIRECT » DONNE LE VRAI JOUR DE DÉBUT D'UN ARRACHAGE, ET N'INVENTE PLUS « AUJOURD'HUI »
//  Nico (14/10, capture) : dans Pilotage › Aujourd'hui › En direct, quatre parcelles d'arrachage « commencée aujourd'hui »,
//  en tête d'« En ce moment », alors qu'elles avaient été commencées avant. Cause : une étape d'arrachage met la parcelle en
//  cours sans écrire de « Début » ; sans ligne « Début », le cockpit posait la date du jour (le filet « Personne d'indiqué »).
//  Exécute le VRAI _arrDebut (app.js, avec _arrCfg / _arrActif / _arrEtat), le VRAI modèle (_pilCk2Modele, pilotage.js, sur
//  cockpit.js entier), et les VRAIS quand, filet du chargement, htmlCoursLi, coursItems, phraseEtat et majEquipes
//  (cockpit-vue.js, faux DOM) ; lit sur le texte la bulle « i », la nouveauté et le branchement.
//    node scripts/mv-harnais-direct2.mjs [--contre]
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RAC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const L = f => fs.readFileSync(path.join(RAC, f), 'utf8');
const CONTRE = process.argv.includes('--contre');
const SRC0 = { app: L('src/app.js'), pil: L('src/pilotage.js'), ck: L('src/cockpit.js'), vue: L('src/cockpit-vue.js'), uti: L('src/utils.js') };
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
// Une fonction de premier niveau : de sa signature à l'accolade fermante en colonne 0 (« } » ou « }; »).
const fnDe = (s, sig) => {
  const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig);
  const m = /\n\};?\n/g; m.lastIndex = i; const r = m.exec(s); if (!r) throw new Error('non fermée : ' + sig);
  return s.slice(i, r.index + r[0].length);
};
const ligne = (s, re) => { const m = s.match(re); if (!m) throw new Error('absente : ' + re); return m[0] + '\n'; };
const J0 = new Date(), iso = k => { const d = new Date(J0.getFullYear(), J0.getMonth(), J0.getDate() + k); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const ord = k => Math.round((Date.UTC(J0.getFullYear(), J0.getMonth(), J0.getDate() + k) - Date.UTC(2026, 0, 1)) / 864e5);
const ETAPES = [{ id: 'demontage', lbl: 'Démontage du palissage' }, { id: 'souches', lbl: 'Arrachage des souches' }, { id: 'ramassage', lbl: 'Ramassage', presta: true }];

// Le VRAI _arrDebut (app.js) et ses trois dépendances, dans un contexte donné (window = ctx).
function arrDans(S, ctx, cfg) {
  ctx.CONFIG = { arrachage: cfg === undefined ? { etapes: ETAPES, apres: 'souches' } : cfg };
  ctx._mvCampRef = () => 2026;
  vm.runInContext(fnDe(S.app, 'function _arrCfg(){') + fnDe(S.app, 'function _arrActif(){') + fnDe(S.app, 'function _arrEtat(p){')
    + fnDe(S.app, 'window._arrDebut = function(p){'), ctx);
  return ctx;
}
function arrSeul(S, cfg) { const c = { Math, Number, String, Array, Object, JSON }; c.window = c; vm.createContext(c); return arrDans(S, c, cfg); }

// Le VRAI modèle du cockpit (pilotage.js) sur cockpit.js entier, comme mv-harnais-etat1, avec le VRAI _arrDebut.
function modele(S) {
  const P = [
    { nom: 'Les Crais', surface: .3, appellation: '', commune: 'Brochon', statut: 'Active', taches: { Arrachage: 'En cours', Taille: 'En cours' },   // la taille aussi : ses étapes ne la datent pas
      arrEtapes: { c: 2026, f: { souches: { d: iso(-12) }, demontage: { d: iso(-19) } } } },
    { nom: 'La Combe', surface: .2, appellation: '', commune: 'Brochon', statut: 'Active', taches: { Arrachage: 'En cours' },
      arrEtapes: { c: 2026, f: { demontage: { d: iso(-25) } } } },
    { nom: 'Champ', surface: .3, appellation: '', commune: 'Brochon', statut: 'Active', taches: { Arrachage: 'En cours' }, auPresta: true,
      arrEtapes: { c: 2026, f: { demontage: { d: iso(-30) }, souches: { d: iso(-28) } } } },
    { nom: 'Vieille', surface: .2, appellation: '', commune: 'Brochon', statut: 'Active', taches: { Arrachage: 'En cours' },
      arrEtapes: { c: 2025, f: { demontage: { d: iso(-400) } } } },
    { nom: 'Futur', surface: .2, appellation: '', commune: 'Brochon', statut: 'Active', taches: { Arrachage: 'En cours' },
      arrEtapes: { c: 2026, f: { demontage: { d: iso(3) } } } },
    { nom: 'Clos', surface: .4, appellation: '', commune: 'Gevrey-Chambertin', statut: 'Active', taches: { Taille: 'En cours' } }];
  const hex = t => Math.floor(t).toString(16), now = Date.now();
  // La Combe : un « Début » dans la période (Hugo, il y a 3 jours) — son équipe et son jour viennent de là, pas des étapes.
  const JOURNAL = [{ id: hex(now - 864e5 * 3), date: iso(-3), parcelle: 'La Combe', tache: 'Arrachage', qui: 'Hugo', membresEquipe: ['Hugo', 'Léa'], statut: 'En cours' }];
  const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, setTimeout: () => 0, localStorage: { getItem: () => null } };
  ctx.window = ctx;
  Object.assign(ctx, { PARCELLES: P, JOURNAL, MEMBRES: [], PLANNING_ENTRIES: {}, METEO_HOURLY: null, METEO_DAILY: null,
    tNom: n => n, _mvToday: () => iso(0), _mvAuPrestataire: (p, T) => T === 'Arrachage' && !!(p && p.auPresta),
    _mvTacheDuMoment: () => ({ mode: 'aucune', taches: [], items: [], dates: {}, retard: {} }) });
  vm.createContext(ctx); vm.runInContext(S.ck, ctx); arrDans(S, ctx);
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
    this.__V = _pilCk2Modele({ data: [{ nom:'Taille', pct:10, h_done:10, h_total:100, surf_total:1 }, { nom:'Arrachage', pct:0, h_done:0, h_total:0, surf_total:1 }],
      totalReste:90, totalTotal:100, hDone:10, gaugePct:10, saison:{ nom:'Hiver' }, presences:[{ nom:'Hugo', etat:'present' }], tracs:[] },
      { obj:new Date(Date.now()+48*864e5), proj:new Date(Date.now()+43*864e5), marge:5, cadH:35 });`, ctx);
  return ctx.__V;
}

// La vue (cockpit-vue.js) : les petites fonctions et les vraies fonctions du lot, AUJ fixé au mercredi 14/10/2026.
function vue(S) {
  const c = { Math, Number, String, Array, Object, JSON, Date, Set, setTimeout: () => 0, requestAnimationFrame: () => 0 };
  c.window = c; vm.createContext(c);
  vm.runInContext(ligne(S.vue, /^const esc = .*$/m) + ligne(S.vue, /^const maj1 = .*$/m) + ligne(S.vue, /^const iso = .*$/m) + ligne(S.vue, /^const deIso = .*$/m)
    + ligne(S.vue, /^const MOIS_C = .*$/m) + ligne(S.vue, /^const JOURS_L = .*$/m) + ligne(S.vue, /^const listeTxt = .*$/m) + ligne(S.vue, /^const heureTxt = .*$/m)
    + ligne(S.vue, /^const libEtat = .*$/m) + ligne(S.vue, /^const bornePl = .*$/m) + fnDe(S.vue, 'const etatVue = (t, pid) => {')
    + "var AUJ = deIso('2026-10-14'), S = { etats: {}, equipes: [], presta: {}, trac: [], vue: 'arrachage' }, EQ = {}, PIDX = {}, T = {}, TACHES = [], V = { jourTravaille: true }, PLAN_W = 1000, PLAN_H = 600;\n"
    + fnDe(S.vue, 'function quand(d) {') + fnDe(S.vue, 'function coursItems() {') + fnDe(S.vue, 'function htmlCoursLi(c) {')
    + fnDe(S.vue, 'function phraseEtat(t, pid) {') + fnDe(S.vue, 'function majEquipes() {')
    + 'this.__f = { quand, coursItems, htmlCoursLi, phraseEtat, majEquipes, set: o => { if (o.S) S = o.S; if (o.EQ) EQ = o.EQ; if (o.PIDX) PIDX = o.PIDX; if (o.T) T = o.T; if (o.TACHES) TACHES = o.TACHES; } };', c);
  return c;
}
// Le VRAI filet du chargement (charger : une parcelle en cours sans équipe en reçoit une) et la VRAIE ligne des équipes du modèle.
function filet(S, o) {
  const a = S.vue.indexOf('  TACHES.forEach(t => Object.keys(S.etats[t.id]).forEach(pid => {');
  if (a < 0 || S.vue.indexOf('  TACHES.forEach(t => Object.keys(S.etats[t.id]).forEach(pid => {', a + 1) >= 0) throw new Error('filet introuvable ou en double');
  const b = S.vue.indexOf('\n  }));\n', a); if (b < 0) throw new Error('filet non fermé');
  const c = { Math, Number, String, Array, Object, JSON, Date }; c.window = c; vm.createContext(c);
  vm.runInContext(ligne(S.vue, /^const iso = .*$/m) + ligne(S.vue, /^const deIso = .*$/m)
    + 'var AUJ = deIso("2026-10-14"), v = ' + JSON.stringify(o.v) + ', S = ' + JSON.stringify(o.S) + ', EQ = ' + JSON.stringify(o.EQ || {})
    + ', TACHES = ' + JSON.stringify(o.TACHES) + ', PIDX = ' + JSON.stringify(o.PIDX) + ', T = ' + JSON.stringify(o.T || {}) + ', parNom = ' + JSON.stringify(o.parNom || {}) + ';\n'
    + (o.equipes ? ligne(S.vue, /^ {2}\(v\.equipes \|\| \[\]\)\.forEach\(.*$/m) : '') + S.vue.slice(a, b + 7) + '\nthis.__S = S;', c);
  return c.__S;
}
// Un faux calque pour majEquipes : ce que la fonction pose sur les pastilles.
function calqueFaux() {
  const cl = () => { const s = new Set(); return { add: x => s.add(x), remove: x => s.delete(x), contains: x => s.has(x), toggle: (x, f) => { if (f === undefined) f = !s.has(x); if (f) s.add(x); else s.delete(x); return f; } }; };
  const kids = [], calque = { classList: cl(), querySelector: () => null, appendChild: m => kids.push(m), kids };
  const doc = { createElement: () => ({ classList: cl(), dataset: {}, style: {}, title: '', innerHTML: '' }) };
  return { calque, doc };
}

function suite(S) {
  const out = []; const T = (n, c) => { let v; try { v = typeof c === 'function' ? c() : c; } catch (e) { v = false; n += ' — plantage : ' + (e && e.message); } out.push([n, !!v]); };
  // ── A. le VRAI _arrDebut (app.js)
  const A = arrSeul(S);
  T('A1 deux étapes faites, dans le désordre : le jour de la PREMIÈRE', () => A._arrDebut({ arrEtapes: { c: 2026, f: { souches: { d: '2026-10-02' }, demontage: { d: '2026-09-25' } } } }) === '2026-09-25');
  T('A2 une étape d’une autre campagne ne compte pas (l’état tombe de lui-même l’an suivant)', () => A._arrDebut({ arrEtapes: { c: 2025, f: { demontage: { d: '2025-09-25' } } } }) === '');
  T('A3 une étape retirée du réglage ne compte pas, comme pour le statut', () => A._arrDebut({ arrEtapes: { c: 2026, f: { epierrage: { d: '2026-09-01' }, souches: { d: '2026-10-02' } } } }) === '2026-10-02');
  T('A4 une date mal formée est ignorée ; aucune étape : rien', () => A._arrDebut({ arrEtapes: { c: 2026, f: { demontage: { d: 'hier' } } } }) === '' && A._arrDebut({ nom: 'x' }) === '' && A._arrDebut(null) === '');
  T('A5 une date avec heure est ramenée au jour', () => A._arrDebut({ arrEtapes: { c: 2026, f: { demontage: { d: '2026-09-25T08:30' } } } }) === '2026-09-25');
  T('A6 arrachage non découpé (aucune étape au réglage) : rien', () => arrSeul(S, null)._arrDebut({ arrEtapes: { c: 2026, f: { demontage: { d: '2026-09-25' } } } }) === '');
  // ── B. le VRAI modèle du cockpit (pilotage.js)
  let V = null; T('B0 le modèle se construit', () => { V = modele(S); return !!(V && V.etats && V.etats.arrachage); });
  if (V) {
    const DA = (V.depuis && V.depuis.arrachage) || {};
    T('B1 garde : les parcelles du scénario sont bien en cours (Les Crais, La Combe, Vieille, Futur), Champ faite pour l’équipe',
      () => ['Les Crais', 'La Combe', 'Vieille', 'Futur'].every(n => V.etats.arrachage[n] === 'cours') && V.etats.arrachage.Champ === 'faite' && V.etats.taille.Clos === 'cours');
    T('B2 le cas de Nico : un arrachage en étapes sans « Début » est daté de sa première étape (pas d’aujourd’hui)', () => DA['Les Crais'] === iso(-19));
    T('B3 une parcelle qui a son « Début » garde son équipe et son jour — le modèle ne la date pas une seconde fois',
      () => !('La Combe' in DA) && V.equipes.some(e => e.parcelle === 'La Combe' && e.noms === 'Hugo et Léa' && e.depuis === iso(-3)));
    T('B4 jour inconnu : absent (étapes d’une autre campagne, « remis » sans début, jour futur) ; les étapes de l’arrachage ne datent pas la taille',
      () => !('Vieille' in DA) && !('Futur' in DA) && !('taille' in V.depuis) && V.etats.taille['Les Crais'] === 'cours');
    T('B5 les équipes ne changent pas : seules celles d’un « Début » (le modèle n’invente pas de « qui »)', () => V.equipes.length === 1);
    T('B6 rien pour une parcelle faite pour l’équipe', () => !('Champ' in DA));
  }
  // ── C. la vue (cockpit-vue.js)
  let W = null; T('C0 la vue se monte (quand, coursItems, htmlCoursLi, phraseEtat, majEquipes extraits du vrai fichier)', () => { W = vue(S).__f; return !!W; });
  if (W) {
    const NB = '\u00a0';
    T('C1 jour inconnu : rien — jamais « commencée aujourd’hui »', () => W.quand('') === '' && W.quand(undefined) === '' && W.quand(null) === '');
    T('C2 aujourd’hui, hier, dans la semaine, plus loin', () => W.quand('2026-10-14') === 'commencée aujourd’hui' && W.quand('2026-10-13') === 'commencée hier'
      && W.quand('2026-10-10') === 'commencée samedi' && W.quand('2026-09-25') === 'commencée le 25' + NB + 'sept.' && W.quand('2026-10-01') === 'commencée le 1er' + NB + 'oct.');
    const PIDX = { p1: { nom: 'Les Crais', arr: false, cx: 100, cy: 100 }, p2: { nom: 'La Pièce', arr: false, cx: 200, cy: 100 }, p3: { nom: 'Clos du Bas', arr: false, cx: 300, cy: 100 } };
    const TT = { arrachage: { nom: 'Arrachage', art: 'l’arrachage', f: false, fin: new Date(Date.UTC(2027, 2, 31)) }, reparation: { nom: 'Réparation', art: 'la réparation', f: true, fin: new Date(Date.UTC(2027, 2, 31)) } };
    const EQ = { e0: { noms: 'Hugo et Léa', ini: ['H', 'L'] }, e1: { noms: 'Personne d’indiqué', ini: ['?'] }, e2: { noms: 'Personne d’indiqué', ini: ['?'] } };
    const EQS = [{ id: 'e1', tache: 'arrachage', parc: 'p1', depuis: '2026-09-25' }, { id: 'e0', tache: 'reparation', parc: 'p3', depuis: '2026-10-06' }, { id: 'e2', tache: 'arrachage', parc: 'p2', depuis: '' }];
    W.set({ S: { etats: { arrachage: { p1: 'cours', p2: 'cours' }, reparation: { p3: 'cours' } }, equipes: EQS, presta: {}, trac: [], vue: 'arrachage' }, EQ, PIDX, T: TT });
    const li = c => W.htmlCoursLi(c);
    T('C3 « En ce moment » : l’arrachage dit son vrai jour', () => li({ k: 'v', e: EQS[0] }).includes('>L’arrachage en cours</span><span class="ck-ev-s">Les Crais, commencée le 25' + NB + 'sept., personne d’indiqué</span>'));
    T('C4 jour inconnu : la ligne ne porte pas de date, ni de virgule orpheline', () => { const h = li({ k: 'v', e: EQS[2] }); return h.includes('>La Pièce, personne d’indiqué<') && !h.includes(', ,') && !h.includes('aujourd’hui'); });
    T('C5 une équipe nommée garde sa phrase', () => li({ k: 'v', e: EQS[1] }).includes('>Hugo et Léa sur la réparation</span><span class="ck-ev-s">Clos du Bas, commencée le 6' + NB + 'oct.</span>'));
    T('C6 l’ordre : le plus récemment commencé d’abord ; un jour inconnu en dernier', () => W.coursItems().map(x => x.e.parc).join() === 'p3,p1,p2');
    T('C7 la loupe : le vrai jour ; sans jour, pas de date vide', () => W.phraseEtat('arrachage', 'p1') === 'Arrachage en cours, Personne d’indiqué, <em>commencée le 25' + NB + 'sept.</em>'
      && W.phraseEtat('arrachage', 'p2') === 'Arrachage en cours, Personne d’indiqué');
    T('C8 la pastille du plan : passée en clair, un titre sans virgule orpheline — commencée un autre jour comme jour inconnu', () => {
      const { calque, doc } = calqueFaux(); const c = vue(S);
      c.$ = () => calque; c.$$ = () => []; c.document = doc;
      c.__f.set({ S: { etats: { arrachage: { p1: 'cours', p2: 'cours' } }, equipes: [EQS[0], EQS[2], { id: 'e3', tache: 'arrachage', parc: 'p3', depuis: '2026-10-14' }], presta: {}, trac: [], vue: 'arrachage' },
        EQ: Object.assign({ e3: { noms: 'Paul', ini: ['P'] } }, EQ), PIDX, T: TT });
      c.__f.majEquipes();
      const k = calque.kids, de = id => k.find(m => m.dataset.eq === id);
      return k.length === 3 && de('e1').classList.contains('ancien') && de('e1').title === 'Personne d’indiqué, commencée le 25' + NB + 'sept.'
        && de('e2').classList.contains('ancien') && de('e2').title === 'Personne d’indiqué'
        && !de('e3').classList.contains('ancien') && de('e3').title === 'Paul, commencée aujourd’hui';
    });
    // Le VRAI filet du chargement : le jour vient du modèle, sinon rien.
    T('C9 le filet : le jour du modèle (v.depuis), sinon vide — jamais celui du jour ; une parcelle qui a déjà son équipe n’est pas doublée', () => {
      const R = filet(S, { v: { depuis: { arrachage: { 'Les Crais': '2026-09-25' } } }, TACHES: [{ id: 'arrachage' }],
        S: { etats: { arrachage: { p1: 'cours', p2: 'cours', p3: 'cours', p4: 'afaire' } }, equipes: [{ id: 'e0', tache: 'arrachage', parc: 'p3', depuis: '2026-10-06' }] },
        EQ: { e0: { noms: 'Hugo et Léa', ini: ['H', 'L'] } }, PIDX: { p1: { nom: 'Les Crais' }, p2: { nom: 'La Pièce' }, p3: { nom: 'Clos du Bas' }, p4: { nom: 'X' } } });
      const d = p => R.equipes.filter(e => e.parc === p).map(e => e.depuis);
      return R.equipes.length === 3 && d('p1').join() === '2026-09-25' && d('p2').length === 1 && d('p2')[0] === '' && d('p3').join() === '2026-10-06' && d('p4').length === 0;
    });
    T('C10 une équipe du modèle sans jour reste sans jour (la ligne des équipes de charger)', () => {
      const R = filet(S, { equipes: true, v: { equipes: [{ noms: 'Hugo', ini: ['H'], tache: 'taille', parcelle: 'Clos' }] }, TACHES: [{ id: 'taille' }],
        S: { etats: { taille: { p1: 'cours' } }, equipes: [] }, PIDX: { p1: { nom: 'Clos' } }, T: { taille: { id: 'taille' } }, parNom: { Clos: 'p1' } });
      return R.equipes.length === 1 && R.equipes[0].depuis === '';
    });
  }
  // ── D. le branchement, la bulle, la nouveauté (sur le texte)
  const b = sansCom(fnDe(S.pil, 'function _pilCk2Modele(d, m){')), v = sansCom(S.vue);
  T('D1 le modèle publie depuis et lit le VRAI _arrDebut ; la vue le lit dans le filet', b.includes('depuis:depuis') && b.includes('window._arrDebut(p)') && v.includes('((v.depuis || {})[t.id] || {})[PIDX[pid].nom]'));
  T('D2 la bulle « i » d’En direct dit la règle de l’arrachage', S.vue.includes(' Un arrachage en étapes compte depuis sa première étape validée. Aujourd’hui :'));
  T('D3 la nouveauté : bloc 8.96 présent, niveau 0 (Journal), pour l’admin ; APP au moins 8.96', (() => {
      const x = (S.uti.match(/export const APP_VERSION = '(\d+)\.(\d+)';/) || []).slice(1).map(Number);
      return x.length === 2 && (x[0] > 8 || (x[0] === 8 && x[1] >= 96)); })()
    && S.uti.includes("  { v: '8.96', d: '2026-10-14', items: [\n    { niv: 0, pour: ['admin'], emoji: 'calendrier', titre: 'En direct donne le vrai jour de début d’un arrachage',"));
  return out;
}

function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'DIRECT-2 : ' + ko + ' ROUGE(S) sur ' + res.length : 'DIRECT-2 : ' + res.length + ' vertes'));
if (CONTRE) {
  const DEF = [
    ['quand : un jour inconnu redevient « commencée aujourd’hui » (le défaut signalé)', 'vue', "  if (!d) return '';\n  if (d >= iso(AUJ)) return 'commencée aujourd’hui';", "  if (!d || d >= iso(AUJ)) return 'commencée aujourd’hui';"],
    ['le filet pose la date du jour', 'vue', "depuis: typeof dj === 'string' ? dj : '' });", 'depuis: iso(AUJ) });'],
    ['le filet ignore le jour du modèle', 'vue', 'const dj = ((v.depuis || {})[t.id] || {})[PIDX[pid].nom];', 'const dj = undefined;'],
    ['les équipes du modèle sans jour : aujourd’hui', 'vue', "depuis: typeof e.depuis === 'string' ? e.depuis : '' });", "depuis: typeof e.depuis === 'string' ? e.depuis : iso(AUJ) });"],
    ['_arrDebut prend la DERNIÈRE étape', 'app', '(!m||d<m)', '(!m||d>m)'],
    ['_arrDebut ignore la campagne', 'app', "var f=_arrEtat(p), m='';", "var f=(p.arrEtapes&&p.arrEtapes.f)||{}, m='';"],
    ['_arrDebut compte une étape retirée du réglage', 'app', "  _arrCfg().etapes.forEach(function(e){\n    var d=(f[e.id]&&f[e.id].d)", "  Object.keys(f).map(function(k){ return {id:k}; }).forEach(function(e){\n    var d=(f[e.id]&&f[e.id].d)"],
    ['_arrDebut garde l’heure', 'app', '?String(f[e.id].d).slice(0,10):', '?String(f[e.id].d):'],
    ['le modèle ne publie pas depuis', 'pil', 'equipes:equipes, depuis:depuis, evts:evts', 'equipes:equipes, evts:evts'],
    ['le modèle date aussi une parcelle qui a son « Début »', 'pil', "if(ec[p.nom]!=='cours'||equipes.some(function(e){ return e.tache===t.id&&e.parcelle===p.nom; })) return;", "if(ec[p.nom]!=='cours') return;"],
    ['le modèle publie un jour futur', 'pil', '&&d0<=auj){', '){'],
    ['le modèle date toutes les tâches avec les étapes de l’arrachage', 'pil', "(t.cle==='Arrachage'&&typeof window._arrDebut==='function')", "(typeof window._arrDebut==='function')"],
    ['« En ce moment » : la virgule orpheline revient', 'vue', "    s = [p.nom, quand(c.e.depuis), anonyme ? 'personne d’indiqué' : ''].filter(Boolean).join(', ');", "    s = p.nom + ', ' + quand(c.e.depuis) + (anonyme ? ', personne d’indiqué' : '');"],
    ['la loupe écrit une date vide', 'vue', "(q ? ', <em>' + q + '</em>' : '')", "', <em>' + q + '</em>'"],
    ['la pastille d’un jour inconnu reste vive', 'vue', "m.classList.toggle('ancien', !(e.depuis && e.depuis >= aujIso));", "m.classList.toggle('ancien', !!(e.depuis && e.depuis < aujIso));"],
    ['le titre de la pastille garde une virgule orpheline', 'vue', "m.title = [EQ[e.id].noms, quand(e.depuis)].filter(Boolean).join(', ');", "m.title = EQ[e.id].noms + ', ' + quand(e.depuis);"],
    ['la bulle ne dit plus la règle de l’arrachage', 'vue', ' Un arrachage en étapes compte depuis sa première étape validée.', ''],
  ];
  let aveugles = 0;
  DEF.forEach(([nom, f, a, z]) => {
    const n = SRC0[f].split(a).length - 1;
    if (n !== 1) { aveugles++; console.log('  KO  contre-épreuve « ' + nom + ' » : motif trouvé ' + n + ' fois (défaut non injecté)'); return; }
    const S = Object.assign({}, SRC0); S[f] = SRC0[f].replace(a, z);
    const r = jouer(S).filter(x => !x[1]).length;
    if (!r) aveugles++;
    console.log((r ? '  ok  ' : '  KO  ') + 'contre-épreuve « ' + nom + ' » → ' + r + ' rouge(s)');
  });
  console.log('\n' + (aveugles ? 'DIRECT-2 --contre : ' + aveugles + ' contre-épreuve(s) aveugle(s) sur ' + DEF.length : 'DIRECT-2 --contre : ' + DEF.length + ' défauts réinjectés, tous attrapés'));
  process.exit(ko || aveugles ? 1 : 0);
}
process.exit(ko ? 1 : 0);
