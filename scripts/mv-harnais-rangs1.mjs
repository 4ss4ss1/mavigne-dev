#!/usr/bin/env node
// HARNAIS — RANGS-1 (§528) : QUI EST DANS LES RANGS. Nico (04/11) : « le en direct, il est faux » — Pauline en formation, lui en repos,
//   Alicia et lui au tracteur, tous notés sur la réparation ; puis « il y a le même problème dans le journal ».
//   EXÉCUTE les VRAIES fonctions : la règle (utils.js : _mvHorsRangs, _mvJRangs, _mvRangsTexte), le tracteur (coequipier.js :
//   _trAuTracteur, _trPlagesDe), cockpit.js entier (_ckQui, _ckTracJour et son « entre deux parcelles »), app.js (_jFaitPar,
//   _jHorsRangs) — sur un domaine inventé, une semaine de novembre. Puis le câblage : le Pilotage, l'Accueil, le Journal, les
//   lecteurs de « qui a travaillé », l'aide, le guide, la nouveauté. --contre réinjecte chaque défaut et exige qu'il rougisse.
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const CONTRE = process.argv.includes('--contre');
const S0 = { uti: L('src/utils.js'), wn: L('src/whats-new.js'), coe: L('src/coequipier.js'), ck: L('src/cockpit.js'), app: L('src/app.js'),
  pil: L('src/pilotage.js'), vue: L('src/cockpit-vue.js'), cave: L('src/cave.js'), g04: L('guide/04-vigne.html'), g11: L('guide/11-pilotage.html'),
  liste: L('scripts/mv-harnais-liste.mjs') };
function fnDe(src, sig) {
  const i = src.indexOf(sig); if (i < 0) throw new Error('absente : ' + sig);
  let n = 0;
  for (let j = src.indexOf('{', i); j < src.length; j++) { const c = src[j]; if (c === '{') n++; else if (c === '}') { n--; if (n === 0) return src.slice(i, j + 1) + '\n'; } }
  throw new Error('non fermée : ' + sig);
}
function entre(src, a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('bloc absent : ' + a); return src.slice(i, j + b.length) + '\n'; }
const DOC = { addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } };
// La semaine : lundi 2 → mercredi 4 novembre 2026 (aujourd'hui), samedi 7 (le domaine ne travaille pas).
const AUJ = '2026-11-04', HIER = '2026-11-03', SAM = '2026-11-07';
const T4 = (h, m) => new Date(2026, 10, 4, h, m || 0).getTime(), T3 = (h, m) => new Date(2026, 10, 3, h, m || 0).getTime(), T2 = (h, m) => new Date(2026, 10, 2, h, m || 0).getTime();
const hex = t => t.toString(16);
function domaine(C) {
  C.MEMBRES = [{ nom: 'Victor' }, { nom: 'Shana' }, { nom: 'Alicia' }, { nom: 'Pauline' }, { nom: 'Nico' }, { nom: 'Chloé', bureau: true }];
  C._mvEnContratLe = () => true;
  // Le planning : Nico au repos le mercredi ; personne le samedi (le domaine ne travaille pas).
  C._pilPrevuLe = (m, dt) => { const d = dt.getDay(); if (d === 0 || d === 6) return false; return !(m.nom === 'Nico' && d === 3); };
  C.PLANNING_ENTRIES = {
    Pauline: { 2026: { 10: { 3: { absent: true, comment: 'formation' }, 4: { absent: true, comment: 'formation' } } } },
    Shana: { 2026: { 10: { 2: { absent: true, abs_de: '14:00', abs_a: '17:00' }, 3: { absent: true, motif: 'retard', motif_h: 1 } } } },
    Victor: { 2026: { 10: { 2: { type: 'cp' } } } } };
  C.CONFIG = { cave_jours: { '2026-11-02': { Alicia: 'm', Nico: 'j' } } };
  C.SESSIONS = [
    // Mardi : l'amendement à deux, au chrono ; « Fin de journée » à midi. Un geste de l'administrateur depuis le bureau, à 15 h.
    { id: 'trat_' + T3(7, 30), conducteur: 'Nico', coequipier: 'Alicia', activite: 'Amendement', date: HIER, statut: 'En cours',
      parcellesFaites: [{ nom: 'Les Herbues', t0: T3(7, 40), t1: T3(9, 10), co: 'Alicia' }, { nom: 'Le Clos', t0: T3(9, 30), t1: T3(11, 0), co: 'Alicia' }],
      trace: [{ t: T3(7, 40), e: 'debut', p: 'Les Herbues', u: 'Nico' }, { t: T3(9, 10), e: 'fin', p: 'Les Herbues', u: 'Nico' }, { t: T3(9, 30), e: 'debut', p: 'Le Clos', u: 'Nico' },
        { t: T3(11, 0), e: 'fin', p: 'Le Clos', u: 'Nico' }, { t: T3(12, 0), e: 'finjour', u: 'Nico' }, { t: T3(15, 0), e: 'decoche', p: 'Le Clos', u: 'Admin' }] },
    // Lundi : une vieille session au chrono, sans boîte noire — la parcelle seule dit l'heure ; une coche sans heure ne dit rien.
    { id: 'trat_' + T2(13, 0), conducteur: 'Victor', coequipier: 'Shana', activite: 'Tarière', date: '2026-11-02', statut: 'Terminé',
      parcellesFaites: [{ nom: 'Les Crais', t0: T2(13, 0), t1: T2(14, 30), co: 'Pauline' }, { nom: 'La Pièce', d: '2026-11-02', co: 'Shana' }] },
    // Aujourd'hui : Marc et Léo ; une parcelle finie à 10 h ; Léo devenu coéquipier à 9 h (avant : Hugo, sur la première parcelle).
    { id: 'trat_' + T4(7, 50), conducteur: 'Marc', coequipier: 'Léo', coeqDepuis: { j: AUJ, h: '09:00' }, activite: 'Griffage', date: AUJ, statut: 'En cours',
      parcellesFaites: [{ nom: 'A', t0: T4(8, 0), t1: T4(8, 50), co: 'Hugo' }, { nom: 'B', t0: T4(9, 0), t1: T4(10, 0), co: 'Léo' }],
      trace: [{ t: T4(8, 0), e: 'debut', p: 'A', u: 'Marc' }, { t: T4(8, 50), e: 'fin', p: 'A', u: 'Marc' }, { t: T4(9, 0), e: 'debut', p: 'B', u: 'Marc' }, { t: T4(10, 0), e: 'fin', p: 'B', u: 'Marc' }] },
    // Aujourd'hui : Paul, une parcelle mesurée de 10 h à 10 h 40 pas encore rangée ; Léa coéquipière seulement depuis 11 h.
    { id: 'trat_' + T4(9, 55), conducteur: 'Paul', coequipier: 'Léa', coeqDepuis: { j: AUJ, h: '11:00' }, activite: 'Rognage', date: AUJ, statut: 'En cours',
      parcellesFaites: [], trace: [{ t: T4(10, 0), e: 'debut', p: 'Z', u: 'Paul' }, { t: T4(10, 40), e: 'fin', p: 'Z', u: 'Paul' }] }];
}
function charger(S) {
  const C = { console, Date, Math, JSON, Intl, isFinite, isNaN, parseInt, parseFloat, Number, String, Array, Object, RegExp, document: DOC,
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }, setTimeout, clearTimeout };
  C.window = C; vm.createContext(C);
  vm.runInContext(S.ck, C);
  const bloc = entre(S.uti, '// ★★★ RANGS-1 (§528, 04/11/2026)', 'window._mvRangsTexte = _mvRangsTexte;').replace(/^export /gm, '');
  vm.runInContext(bloc + '\nthis._mvRgReset = function(){ _MV_RG = { t: 0, m: {} }; };', C);
  C._mvCaveJour = function(nom, iso){ const J = ((C.CONFIG || {}).cave_jours || {})[iso]; const v = J ? J[nom] : ''; return (v === 'j' || v === 'm' || v === 'a') ? v : ''; };
  const has = /var _trHas=function\(o,k\)\{[^\n]*\};/.exec(S.coe); if (!has) throw new Error('_trHas absente');
  vm.runInContext(has[0] + '\n' + fnDe(S.coe, 'function _trCoDe(') + fnDe(S.coe, 'function _trIso(')
    + entre(S.coe, '// ── ★★ RANGS-1 (§528) — QUAND UNE PERSONNE EST AU TRACTEUR', "Object.assign(window,{ _trAuTracteur:_trAuTracteur, _trPlagesDe:_trPlagesDe });")
    + '\nthis._trRgReset = function(){ _TR_RG = { t: 0, m: {} }; };', C);
  vm.runInContext(fnDe(S.app, 'function _jFaitPar(') + fnDe(S.app, 'function _jHorsRangs(') + '\nthis._jFaitPar = _jFaitPar; this._jHorsRangs = _jHorsRangs;', C);
  domaine(C);
  return C;
}
function suite(S) {
  const out = [], T = (n, f) => { let ok = false, err = ''; try { ok = !!(typeof f === 'function' ? f() : f); } catch (e) { err = ' — ' + e.message; } out.push([n + err, ok]); };
  let C = null;
  T('0 les vraies fonctions se chargent (utils.js, coequipier.js, cockpit.js, app.js)', () => { C = charger(S); return typeof C._mvHorsRangs === 'function' && typeof C._mvJRangs === 'function' && typeof C._trAuTracteur === 'function' && typeof C._ckTracJour === 'function'; });
  if (!C) return out;
  const H = (n, iso, ts, o) => { C._mvRgReset(); C._trRgReset(); return C._mvHorsRangs(n, iso, ts, o); };
  // ── A. le planning, la cave
  T('A1 absente au planning (la journée) : écartée', () => H('Pauline', AUJ, T4(10)) === 'absent' && H('Pauline', AUJ, null) === 'absent');
  T('A2 pas prévue un jour où le domaine travaille : au repos', () => H('Nico', AUJ, T4(10)) === 'repos' && H('Victor', AUJ, T4(10)) === '');
  T('A3 un jour où le domaine ne travaille pas, « repos » ne dit rien : personne n’est écarté', () => H('Victor', SAM, null) === '' && H('Nico', SAM, null) === '');
  T('A4 une absence d’une partie de la journée : seulement à ses heures ; un retard jamais', () => H('Shana', '2026-11-02', T2(15)) === 'absent' && H('Shana', '2026-11-02', T2(10)) === '' && H('Shana', '2026-11-02', null) === '' && H('Shana', HIER, T3(8)) === '');
  T('A5 un congé payé : écarté', () => H('Victor', '2026-11-02', T2(10)) === 'absent');
  T('A6 la cave : la journée toujours, la demi-journée à son heure, heure inconnue rien', () => H('Nico', '2026-11-02', null) === 'cave' && H('Alicia', '2026-11-02', T2(10)) === 'cave' && H('Alicia', '2026-11-02', T2(15)) === '' && H('Alicia', '2026-11-02', null) === '');
  T('A7 un nom inconnu, ou sans données : jamais écarté', () => H('Inconnu', AUJ, T4(10)) === '' && (() => { const M = C.MEMBRES, P = C.PLANNING_ENTRIES, Z = C.SESSIONS; C.MEMBRES = []; C.PLANNING_ENTRIES = {}; C.SESSIONS = []; const r = H('Pauline', AUJ, T4(10)) === '' && H('Alicia', HIER, T3(8)) === ''; C.MEMBRES = M; C.PLANNING_ENTRIES = P; C.SESSIONS = Z; return r; })());
  // ── B. le tracteur, à une heure passée
  T('B1 mardi 8 h : le conducteur et la coéquipière sont au tracteur ; les autres non', () => H('Alicia', HIER, T3(8)) === 'tracteur' && H('Nico', HIER, T3(8), { tracteurSeul: true }) === 'tracteur' && H('Victor', HIER, T3(8)) === '');
  T('B2 entre deux parcelles (20 min, le trajet) : toujours au tracteur', () => H('Alicia', HIER, T3(9, 20)) === 'tracteur');
  T('B3 après « Fin de journée » : plus au tracteur — le geste de l’administrateur depuis le bureau n’y remet personne', () => H('Alicia', HIER, T3(13)) === '' && H('Alicia', HIER, T3(15)) === '');
  T('B4 une vieille mesure au chrono, sans boîte noire : son heure et son coéquipier font foi ; une coche sans heure ne dit rien', () => H('Pauline', '2026-11-02', T2(13, 30)) === 'tracteur' && H('Victor', '2026-11-02', T2(14), { tracteurSeul: true }) === 'tracteur' && H('Shana', '2026-11-02', T2(13, 30)) === '' && H('Victor', '2026-11-02', T2(16), { tracteurSeul: true }) === '');
  T('B5 le coéquipier changé à 9 h : Hugo au tracteur à 8 h 30, Léo à 9 h 30 — pas l’inverse', () => H('Hugo', AUJ, T4(8, 30)) === 'tracteur' && H('Léo', AUJ, T4(9, 30)) === 'tracteur' && H('Léo', AUJ, T4(8, 20)) === '');
  T('B6 avant l’heure où il est devenu coéquipier, le coéquipier du moment n’était pas au tracteur', () => H('Léa', AUJ, T4(10, 20)) === '' && H('Paul', AUJ, T4(10, 20), { tracteurSeul: true }) === 'tracteur');
  // ── C. le tracteur en direct (l'instant présent), la même lecture que la ligne « au tracteur »
  const D = (n, ts) => H(n, AUJ, ts, { direct: true });
  T('C1 une parcelle finie il y a 30 min : entre deux parcelles, Marc et Léo au tracteur ; à 50 min, plus', () => D('Marc', T4(10, 30)) === 'tracteur' && D('Léo', T4(10, 30)) === 'tracteur' && D('Léo', T4(10, 50)) === '');
  T('C2 _ckTracJour sans heure (les appels d’avant) : pas de « entre deux parcelles »', () => C._ckTracJour(C.SESSIONS, AUJ, { tracs: [] }).cours.length === 0);
  T('C3 avec l’heure : la ligne « entre deux parcelles », la dernière parcelle, le coéquipier', () => { const c = C._ckTracJour(C.SESSIONS, AUJ, { tracs: [], maint: T4(10, 30) }).cours; return c.length === 1 && c[0].entre === true && c[0].qui === 'Marc' && c[0].avec.join() === 'Léo' && c[0].parcs.join() === 'B' && c[0].ts === T4(10); });
  T('C4 une parcelle en mesure, puis une pause : au tracteur, jusqu’à « Fin de journée »', () => {
    const s = C.SESSIONS[2], tr0 = s.trace.slice();
    s.trace = tr0.concat([{ t: T4(10, 40), e: 'debut', p: 'C', u: 'Marc' }]); const a = D('Léo', T4(11, 30)) === 'tracteur';
    s.trace = tr0.concat([{ t: T4(10, 40), e: 'debut', p: 'C', u: 'Marc' }, { t: T4(12, 0), e: 'dejeuner', u: 'Marc' }]); const b = D('Marc', T4(13, 0)) === 'tracteur';
    s.trace = tr0.concat([{ t: T4(10, 40), e: 'debut', p: 'C', u: 'Marc' }, { t: T4(12, 0), e: 'finjour', u: 'Marc' }]); const c = D('Marc', T4(12, 10)) === '';
    s.trace = tr0; return a && b && c; });
  // ── D. une ligne du journal
  const J = (e, vu) => { C._mvRgReset(); C._trRgReset(); return C._mvJRangs(e, ['Nico', 'Victor', 'Shana', 'Alicia', 'Pauline'].filter(n => n === e.qui || (e.membresEquipe || []).includes(n)), vu); };
  const eMardi = { id: hex(T3(8, 30)), date: HIER, qui: 'Victor', tache: 'Réparation', parcelle: 'Les Herbues', statut: 'Validé', equipe: true, membresEquipe: ['Shana', 'Alicia', 'Nico', 'Pauline'] };
  T('D1 mardi 8 h 30 : Victor et Shana ; Alicia et Nico au tracteur, Pauline absente', () => { const r = J(eMardi); return r.dans.join() === 'Victor,Shana' && r.hors.map(h => h.nom + ':' + h.pourquoi).sort().join() === 'Alicia:tracteur,Nico:tracteur,Pauline:absent'; });
  T('D2 celui qui a saisi : écarté par le tracteur seulement (au chrono à 8 h 30, oui ; à 14 h, non ; absent au planning, il reste)', () => {
    const a = J({ id: hex(T3(8, 30)), date: HIER, qui: 'Nico', membresEquipe: ['Victor', 'Shana'] }), b = J({ id: hex(T3(14)), date: HIER, qui: 'Nico', membresEquipe: ['Victor'] }), c = J({ id: hex(T3(10)), date: HIER, qui: 'Pauline', membresEquipe: [] });
    return a.dans.join() === 'Victor,Shana' && b.dans.join() === 'Nico,Victor' && c.dans.join() === 'Pauline'; });
  T('D3 une équipe corrigée par l’administrateur fait foi telle quelle', () => J(Object.assign({}, eMardi, { eqCorr: { par: 'Nico', le: 'x' } })).dans.length === 5);
  T('D4 saisie un autre jour que le sien : l’heure ne compte plus (le tracteur ne joue pas), la journée oui (l’absence)', () => { const r = J(Object.assign({}, eMardi, { id: hex(T4(18)) })); return r.dans.slice().sort().join() === 'Alicia,Nico,Shana,Victor' && r.hors.map(h => h.nom).join() === 'Pauline'; });
  T('D5 « En ce moment » (vu) : la parcelle commencée lundi par tous — Nico au repos, Pauline absente, Alicia reste', () => { const e = { id: hex(T2(8)), date: '2026-11-02', qui: 'Nico', membresEquipe: ['Victor', 'Shana', 'Alicia', 'Pauline'], statut: 'En cours' }; return J(e, { iso: AUJ, ts: T4(10, 30) }).dans.join() === 'Victor,Shana,Alicia'; });
  T('D6 _jFaitPar (app.js) : la même règle ; sans la règle (hors navigateur), la liste entière', () => {
    C._mvRgReset(); C._trRgReset(); const a = C._jFaitPar(eMardi).join() === 'Victor,Shana';
    const sauv = C._mvJRangs; C._mvJRangs = undefined; const b = C._jFaitPar(eMardi).join() === 'Victor,Shana,Alicia,Nico,Pauline'; C._mvJRangs = sauv; return a && b; });
  T('D7 _jHorsRangs dit qui et pourquoi ; _mvRangsTexte l’écrit sans accord ni motif', () => { C._mvRgReset(); C._trRgReset(); const h = C._jHorsRangs(eMardi); return h.length === 3 && C._mvRangsTexte(h) === 'Alicia et Nico au tracteur \u00b7 absence\u00a0: Pauline'; });
  T('D8 _ckQui (le Pilotage) : l’équipe d’abord, la même règle, et `vu` pour l’instant présent', () => { C._mvRgReset(); C._trRgReset(); return C._ckQui(eMardi).join() === 'Shana,Victor' && C._ckQui({ id: hex(T2(8)), date: '2026-11-02', qui: 'Nico', membresEquipe: ['Victor', 'Alicia', 'Pauline'] }, { iso: AUJ, ts: T4(10, 30) }).join() === 'Victor,Alicia'; });
  // ── E. le câblage
  const sc = s => s.replace(/^\s*\/\/.*$/gm, '');
  const pil = fnDe(S.pil, 'function _pilCk2Modele('), dir = fnDe(S.app, 'function renderHomeDirect('), fiche = fnDe(S.app, 'function _jFicheHtml(');
  T('E1 le Pilotage : « En ce moment » jugé à l’instant (vide quand toute l’équipe est ailleurs), le tracteur avec l’heure', () => sc(pil).includes('q=qui(e, vuNow), vide=!!(q0.length&&!q.length)') && sc(pil).includes("noms:etN(q)||(vide?'personne en ce moment'") && sc(pil).includes('maint:maintenant') && sc(pil).includes('entre:!!x.entre'));
  T('E2 la vue : « personne en ce moment » et « entre deux parcelles »', () => sc(S.vue).includes("if (c.e.vide) { t = maj1(tt.art) + ' en cours'; s = [p.nom, quand(c.e.depuis), 'personne en ce moment']") && sc(S.vue).includes("'entre deux parcelles'") && S.vue.includes('if (q) q.vide = true;') && S.vue.includes('entre: !!x.entre'));
  T('E3 l’Accueil : le tracteur en ce moment seulement, les noms jugés maintenant', () => sc(dir).includes('window._ckTracJour(S, auj, { tracs:[], maint:maint })') && sc(dir).includes('_jFaitPar(j, vuNow)') && sc(dir).includes("'Personne en ce moment'") && sc(dir).includes('var n=cours.length+(TC?TC.length:S.length)'));
  T('E4 le Journal : la ligne, les initiales et la fiche ne nomment que ceux qui étaient dans les rangs', () => sc(S.app).includes("const _jhr=(typeof _jHorsRangs==='function')?_jHorsRangs(r):[]") && sc(S.app).includes('(r.quiHors||_jaut)?') && sc(S.app).includes("var _jhr=(typeof _jHorsRangs==='function')?_jHorsRangs(r):[];") && sc(fiche).includes("'<dt>Pas dans les rangs</dt><dd>'"));
  T('E5 les autres lecteurs de « qui a travaillé » passent par _jFaitPar (Ma part, la semaine du domaine, le bilan, la cave)', () => sc(fnDe(S.app, 'function _mvPartTache(')).includes('if(_jFaitPar(j).indexOf(me)<0)return;') && sc(fnDe(S.app, 'function _mvMurData(')).includes('_jFaitPar(j).slice()') && sc(fnDe(S.app, 'function _mvdsBilan(')).includes('_jFaitPar(j):[j.qui]') && sc(fnDe(S.cave, 'function _bcVigne(')).includes('window._jFaitPar(j)'));
  T('E6 l’aide, le guide et la nouveauté le disent', () => S.uti.includes("['Qui a travaillé'") && S.uti.includes('ni en cave ou au tracteur') && S.g04.includes('Pas dans les rangs') && S.g11.includes('personne en ce moment') && S.wn.includes("v: '10.65'") && S.wn.includes('dans les rangs'));
  T('E7 ce harnais est branché dans la liste des contrôles', () => S.liste.includes("['node scripts/mv-harnais-rangs1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-rangs1.mjs --contre'],"));
  return out;
}
function lancer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = lancer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const idx = nom => res.findIndex(([n]) => n.startsWith(nom + ' '));
  const DEF = [
    ['une équipe corrigée est rejugée', 'uti', '|| j.meteo || j.eqCorr || j.auTracteur', '|| j.meteo || j.auTracteur', 'D3'],
    ['celui qui a saisi est jugé sur le planning', 'uti', "(n === aut ? { tracteurSeul: true } : null)", 'null', 'D2'],
    ['une absence d’une partie de la journée écarte toute la journée', 'uti', "else if(de != null && a != null && a > de) v = { de: de, a: a };", '', 'A4'],
    ['« repos » joue un jour où le domaine ne travaille pas', 'uti', "&& _mvRgDomaine(iso) &&", '&&', 'A3'],
    ['les plages ne se rejoignent plus (le trajet sort du tracteur)', 'coe', 'var _TR_ENTRE_MS=45*60000', 'var _TR_ENTRE_MS=0', 'B2'],
    ['un geste depuis le bureau remet au tracteur', 'coe', "&&(!y.u||y.u===cond||(coM&&y.u===coM))", '', 'B3'],
    ['le coéquipier du moment prend tout le jour', 'coe', 'if(c==null) c=(coD==null||t>=coD)?coM:\'\';', 'if(c==null) c=coM;', 'B6'],
    ['« entre deux parcelles » disparaît', 'ck', "else if(tE != null && o && typeof o.maint === 'number'", "else if(false && tE != null && o && typeof o.maint === 'number'", 'C3'],
    ['_ckQui oublie la règle', 'ck', 'try{ r = window._mvJRangs(e, r, vu).dans; }', 'try{ }', 'D8'],
    ['l’Accueil reprend toutes les sessions ouvertes', 'app', 'window._ckTracJour(S, auj, { tracs:[], maint:maint })', 'null&&0', 'E3'],
    ['la fiche du Journal ne dit plus qui n’était pas dans les rangs', 'app', "'<dt>Pas dans les rangs</dt><dd>'", "'<dt>Qui</dt><dd>'", 'E4'],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-rangs1.mjs'],", '', 'E7'],
  ];
  let mord = 0;
  DEF.forEach(([nom, f, de, vers, cible]) => {
    const S = Object.assign({}, S0); if (!S[f].includes(de)) { console.log('  !! MOTIF ABSENT : ' + nom); return; }
    S[f] = S[f].replace(de, vers); if (S[f] === S0[f]) { console.log('  !! MUTATION SANS EFFET : ' + nom); return; }
    const r = lancer(S), k = idx(cible), ok = k >= 0 && r[k] && !r[k][1]; console.log((ok ? '  rougit  ' : '  NE MORD PAS  ') + nom); if (ok) mord++;
  });
  console.log('\n' + (mord === DEF.length ? 'CONTRE-ÉPREUVES VERTES' : 'CONTRE-ÉPREUVES ROUGES') + ' \u2014 ' + mord + '/' + DEF.length + ' défauts réinjectés');
  process.exit(mord === DEF.length ? 0 : 1);
}
process.exit(ko ? 1 : 0);
