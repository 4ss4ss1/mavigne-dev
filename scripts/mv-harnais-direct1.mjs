#!/usr/bin/env node
// PIL-RANGE-1b (§441) : le rendu de secours de cockpit.js (fil, plan et cockpit de secours) est retiré avec l'ancien Aujourd'hui ;
//   les assertions qui le visaient partent, celles du cockpit v2 et des lectures partagées restent.
// HARNAIS — DIRECT-1 (§318) : « Début » enregistre l'équipe comme « Valider » ; « Changer » la donne aux parcelles en cours
//   commencées sans équipe ; le cockpit met l'équipe d'abord et respecte « sans moi » ; « En direct » : en ce moment, puis la
//   journée, tracteur compris. EXÉCUTE cockpit.js entier, les VRAIS gestes d'app.js (pQuickStart, marquerEnCours,
//   _mvDebutsSuivent, _mvEqApplique) et le VRAI texte du tracteur (cockpit-vue.js) ; --contre réinjecte chaque défaut.
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { ck: L('src/cockpit.js'), app: L('src/app.js'), pil: L('src/pilotage.js'), vue: L('src/cockpit-vue.js'), uti: L('src/utils.js'),
  css: L('src/styles.css'), g04: L('guide/04-vigne.html'), g11: L('guide/11-pilotage.html') };
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fnDe(src, sig) {
  const i = src.indexOf(sig); if (i < 0) throw new Error('absente : ' + sig);
  let n = 0;
  for (let j = i + sig.length - 1; j < src.length; j++) {
    const c = src[j];
    if (c === '{') n++;
    else if (c === '}') { n--; if (n === 0) return src.slice(i, j + 1) + '\n'; }
  }
  throw new Error('non fermée : ' + sig);
}
const DOC = { addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } };
const J0 = (h, m) => new Date(2026, 9, 12, h, m || 0).getTime(), HIER = h => new Date(2026, 9, 11, h, 0).getTime(), AUJ = '2026-10-12';
function run(S) {
  const res = [];
  const T = (nom, f) => { let ok = false, err = ''; try { ok = !!(typeof f === 'function' ? f() : f); } catch (e) { err = ' — ' + e.message; } res.push([ok, nom + err]); };
  // ── A. cockpit.js entier : qui travaille, les noms en français, le fil de secours
  const C = { console, Date, Math, JSON, Intl, isFinite, isNaN, parseInt, parseFloat, Number, String, Array, Object, RegExp, document: DOC,
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }, setTimeout, clearTimeout, requestAnimationFrame: f => setTimeout(f, 0) };
  C.window = C;
  T('A0 cockpit.js se charge et expose _ckQui, _ckEt, _ckTracJour', () => { vm.createContext(C); vm.runInContext(S.ck, C);
    return typeof C._ckQui === 'function' && typeof C._ckEt === 'function' && typeof C._ckTracJour === 'function'; });
  if (typeof C._ckQui !== 'function' || typeof C._ckTracJour !== 'function') return res;
  const Q = e => C._ckQui(e).join('|');
  T('A1 sans équipe : l’auteur seul', Q({ qui: 'Nico' }) === 'Nico');
  T('A2 l’équipe d’abord, l’auteur ensuite (l’admin hors de sa propre liste)', Q({ qui: 'Nico', membresEquipe: ['Victor', 'Shana', 'Alicia', 'Pauline'] }) === 'Victor|Shana|Alicia|Pauline|Nico');
  T('A3 « sans moi » : l’auteur n’y est pas', Q({ qui: 'Nico', quiHors: true, membresEquipe: ['Victor', 'Shana'] }) === 'Victor|Shana');
  T('A4 « sans moi » sans personne d’autre : l’auteur reste (jamais une ligne sans nom)', Q({ qui: 'Nico', quiHors: true, membresEquipe: [] }) === 'Nico');
  T('A5 l’auteur déjà dans l’équipe garde sa place, sans doublon', Q({ qui: 'Hugo', membresEquipe: ['Hugo', 'Léa'] }) === 'Hugo|Léa');
  T('A6 noms nettoyés, doublons et vides retirés', Q({ qui: ' Victor ', membresEquipe: ['Shana', '', null, 'Shana ', 'Victor'] }) === 'Shana|Victor');
  T('A7 « Victor, Shana et Alicia »', C._ckEt(['Victor', 'Shana', 'Alicia']) === 'Victor, Shana et Alicia' && C._ckEt(['A', 'B']) === 'A et B' && C._ckEt(['A']) === 'A');
  // ── B. le tracteur du jour (cockpit.js/_ckTracJour)
  const S1 = { id: J0(7, 50).toString(16), date: AUJ, activite: 'Griffage', conducteur: 'Nico', statut: 'En cours', tracteurId: 'trac1',
    trace: [{ t: HIER(16), e: 'debut', p: 'Vieille' }, { t: HIER(17), e: 'fin', p: 'Vieille', m: 60 }, { t: J0(8), e: 'debut', p: 'Les Perrières' },
      { t: J0(8, 45), e: 'fin', p: 'Les Perrières', m: 45 }, { t: J0(8, 45), e: 'debut', p: 'Clos Prieur' }] };
  let TJ = C._ckTracJour([S1], AUJ, { tracs: [{ id: 'trac1', nom: 'Fendt 207' }] });
  T('B1 une parcelle finie : le conducteur, l’activité, la parcelle, les minutes, l’heure', TJ.evts.some(x => x.k === 'trac' && x.qui === 'Nico' && x.act === 'Griffage' && x.parcs.join() === 'Les Perrières' && x.m === 45 && x.ts === J0(8, 45)));
  T('B2 la session ouverte ce jour : son heure, son tracteur', TJ.evts.some(x => x.k === 'trac-debut' && x.ts === J0(7, 50) && x.trac === 'Fendt 207'));
  T('B3 en ce moment : sur Clos Prieur depuis 8 h 45', TJ.cours.length === 1 && TJ.cours[0].parcs.join() === 'Clos Prieur' && TJ.cours[0].ts === J0(8, 45) && !TJ.cours[0].pause);
  T('B4 la veille ne compte pas', !TJ.evts.some(x => x.parcs.indexOf('Vieille') >= 0));
  T('B5 deux événements, du plus récent au plus ancien', TJ.evts.length === 2 && TJ.evts[0].ts >= TJ.evts[1].ts);
  const S2 = { id: 'x2', date: '2026-10-10', activite: 'Rognage', conducteur: '', statut: 'En cours', trace: [{ t: J0(9), e: 'debut', p: 'A', u: 'Victor' }, { t: J0(10), e: 'interrompt', p: 'A', m: 60, u: 'Victor' }] };
  TJ = C._ckTracJour([S2], AUJ, {});
  T('B6 interrompu : en pause depuis 10 h, la parcelle gardée ; sans conducteur noté, celui du geste', TJ.cours.length === 1 && TJ.cours[0].pause && TJ.cours[0].parcs.join() === 'A' && TJ.cours[0].ts === J0(10) && TJ.cours[0].qui === 'Victor');
  T('B7 une session d’un autre jour n’est pas « ouverte aujourd’hui »', !TJ.evts.some(x => x.k === 'trac-debut'));
  S2.trace.push({ t: J0(10, 30), e: 'reprend', p: 'A' }); TJ = C._ckTracJour([S2], AUJ, {});
  T('B8 reprise : de nouveau en marche, depuis la reprise', TJ.cours.length === 1 && !TJ.cours[0].pause && TJ.cours[0].ts === J0(10, 30));
  S2.trace.push({ t: J0(11), e: 'fin', p: 'A + B', m: 90 }, { t: J0(12), e: 'dejeuner' }); TJ = C._ckTracJour([S2], AUJ, {});
  T('B9 un bloc de deux parcelles = un événement ; déjeuner : en pause sans parcelle', TJ.evts.some(x => x.k === 'trac' && x.parcs.join() === 'A,B' && x.m === 90) && TJ.cours.length === 1 && TJ.cours[0].pause && TJ.cours[0].parcs.length === 0);
  S2.trace.push({ t: J0(13), e: 'reprend' }); TJ = C._ckTracJour([S2], AUJ, {});
  T('B10 retour de déjeuner sans parcelle ouverte : plus rien en cours', TJ.cours.length === 0);
  S2.trace.push({ t: J0(14), e: 'debut', p: 'C' }, { t: J0(17), e: 'finjour' }); TJ = C._ckTracJour([S2], AUJ, {});
  T('B11 fin de journée : plus rien en cours', TJ.cours.length === 0);
  const S3 = { id: 'x3', date: AUJ, activite: 'Intercep', conducteur: 'Alicia', trace: [{ t: J0(9), e: 'coche', p: 'D' }, { t: J0(9, 5), e: 'coche', p: 'E' }, { t: J0(9, 10), e: 'decoche', p: 'D' }] };
  TJ = C._ckTracJour([S3], AUJ, {});
  T('B12 une parcelle décochée dans la journée sort du fil', TJ.evts.filter(x => x.k === 'trac').map(x => x.parcs.join()).join('|') === 'E');
  const S4 = { id: 'x4', date: '2026-10-11', activite: 'Buttage', conducteur: 'Shana', parcellesFaites: [{ nom: 'F', t1: J0(15) }, { nom: 'G', t1: J0(15) }, { nom: 'H', t1: HIER(15) }, 'I'] };
  TJ = C._ckTracJour([S4], AUJ, {});
  T('B13 sans geste du jour, les parcelles finies ce jour-là font foi, regroupées à leur heure', TJ.evts.length === 1 && TJ.evts[0].parcs.join() === 'F,G' && TJ.evts[0].ts === J0(15));
  const S5 = { id: 'trat_' + J0(6), type: 'traitement', activite: 'Traitement', date: AUJ, conducteur: 'Victor', parcelles: ['P1', 'P2', 'P3'], heureDebut: '06:30', heureFin: '09:15', statut: 'Terminé' };
  const S6 = Object.assign({}, S5, { id: 'trat_' + HIER(6), date: '2026-10-11' });
  TJ = C._ckTracJour([S5, S6, null, 'x'], AUJ, {});
  T('B14 un traitement du jour à son heure de fin ; celui de la veille non ; les entrées abîmées ignorées', TJ.evts.length === 1 && TJ.evts[0].k === 'traite' && TJ.evts[0].ts === J0(9, 15) && TJ.evts[0].parcs.length === 3);
  T('B15 rien du tout : deux listes vides', () => { const r = C._ckTracJour(undefined, AUJ); return Array.isArray(r.evts) && !r.evts.length && Array.isArray(r.cours) && !r.cours.length; });
  T('B16 une session terminée n’est jamais « en cours »', C._ckTracJour([Object.assign({}, S1, { statut: 'Terminé' })], AUJ, {}).cours.length === 0);
  // ── C/D. les VRAIS gestes d'app.js
  const EQT = { team: ['Victor', 'Shana', 'Alicia', 'Pauline'], hors: false };
  const A = { console, Date, Math, JSON, String, Number, Array, Object, isFinite, parseInt, navigator: {}, currentUser: { nom: 'Nico' }, PARCELLES: [], JOURNAL: [], SAVES: [],
    pTacheFilter: 'Réparation', pCurStep: 1, _eqtFor: () => EQT.team.slice(), _eqtHors: () => EQT.hors, getSaisonActive: () => ({ nom: 'Automne 2026', debut: '2026-10-01' }),
    _mvValidBlocked: () => false, canWrite: () => true, _mvArrRefus: () => false, _pvType: () => 'simple', _pvStepLabel: () => 'P', _pvEffPlan: () => 9, _pvPrefix: () => 'p',
    _mvToday: () => AUJ, tNom: x => x, injectMeteoIfNeeded() {}, showToast() {}, renderParcelles() {}, computePStats() {}, openDP() {}, _mvMoiAdmin: () => true, _mvEqDe: () => null };
  A.window = A; A.saveData = k => { A.SAVES.push(k); }; A._ckPlanDebuts = C._ckPlanDebuts;
  T('C0 les gestes d’app.js se chargent', () => { vm.createContext(A);
    vm.runInContext(fnDe(S.app, 'function _mvEqApplique(e){') + fnDe(S.app, 'function _mvGroupeTache(task){') + fnDe(S.app, 'function _mvDebutLigne(e,task){')
      + fnDe(S.app, 'function _mvDebutsSuivent(task){') + fnDe(S.app, 'function pQuickStart(nom,evt){') + fnDe(S.app, 'function marquerEnCours(nomParcelle,nomTache,btn){'), A);
    return typeof A.pQuickStart === 'function' && typeof A.marquerEnCours === 'function'; });
  if (typeof A.pQuickStart === 'function') {
    A.PARCELLES = [{ nom: 'Pasquier des Chenes', surface: 1, taches: {} }, { nom: '20 Rangs', surface: 0.5, taches: {} }];
    T('C1 « Début » (carte) : l’équipe de la tâche, l’auteur, « En cours », l’heure du début', () => { A.pQuickStart('20 Rangs', null); const e = A.JOURNAL[0];
      return e && e.statut === 'En cours' && e.qui === 'Nico' && e.equipe === true && e.membresEquipe.join() === 'Victor,Shana,Alicia,Pauline' && !e.quiHors && typeof e.ts_debut === 'number'; });
    T('C2 « Démarrer » (fiche) : la même équipe, « sans moi » compris', () => { EQT.hors = true; A.marquerEnCours('Pasquier des Chenes', 'Réparation', null); const e = A.JOURNAL[0];
      return e && e.parcelle === 'Pasquier des Chenes' && e.membresEquipe.length === 4 && e.quiHors === true; });
    T('C3 et le cockpit y lit l’équipe, sans l’auteur', C._ckQui(A.JOURNAL[0]).join() === 'Victor,Shana,Alicia,Pauline');
    T('C4 « Moi seul » : pas d’équipe, pas de « sans moi »', () => { EQT.team = []; A.PARCELLES[1].taches = {}; A.JOURNAL = []; A.pQuickStart('20 Rangs', null); const e = A.JOURNAL[0];
      return e.equipe === false && e.membresEquipe.length === 0 && !e.quiHors; });
    A.PARCELLES = ['Pasquier des Chenes', '7 Rangs', 'Clos', 'Vieille'].map(n => ({ nom: n, taches: { 'Réparation': 'En cours' } }));
    A.JOURNAL = [{ id: 'a', date: '2026-10-08', parcelle: 'Pasquier des Chenes', tache: 'Réparation', qui: 'Nico', statut: 'En cours', equipe: false, ts_debut: 1 },
      { id: 'b', date: '2026-10-09', parcelle: '7 Rangs', tache: 'Réparation', qui: 'Nico', statut: 'En cours', equipe: true, membresEquipe: ['Hugo'] },
      { id: 'c', date: '2026-10-09', parcelle: 'Clos', tache: 'Réparation', qui: 'Victor', statut: 'En cours', equipe: false },
      { id: 'd', date: '2026-09-20', parcelle: 'Vieille', tache: 'Réparation', qui: 'Nico', statut: 'En cours', equipe: false }];
    EQT.team = ['Victor', 'Shana', 'Alicia', 'Pauline']; EQT.hors = true; A.SAVES = [];
    let F = []; T('D0 « Changer » s’exécute', () => { F = A._mvDebutsSuivent('Réparation'); return Array.isArray(F); });
    const jA = A.JOURNAL[0];
    T('D1 sa parcelle en cours sans équipe prend l’équipe choisie, « sans moi » compris ; le jour du début ne bouge pas', F.join() === 'Pasquier des Chenes'
      && jA.membresEquipe.join() === 'Victor,Shana,Alicia,Pauline' && jA.quiHors === true && jA.equipe === true && jA.date === '2026-10-08' && jA.ts_debut === 1);
    T('D2 un groupe déjà écrit ne se réécrit pas', A.JOURNAL[1].membresEquipe.join() === 'Hugo');
    T('D3 le début d’un autre ne bouge pas', !A.JOURNAL[2].membresEquipe);
    T('D4 un début d’avant la période active ne bouge pas', !A.JOURNAL[3].membresEquipe);
    T('D5 le journal est enregistré une fois', A.SAVES.join() === 'journal');
    T('D6 « Moi seul » ne touche à rien', () => { EQT.team = []; A.SAVES = []; return A._mvDebutsSuivent('Réparation').length === 0 && A.SAVES.length === 0; });
  }
  // ── E. le modèle du cockpit (pilotage.js)
  const b = sansCom(fnDe(S.pil, 'function _pilCk2Modele(d, m){'));
  T('E1 qui travaille par _ckQui (repli : la même règle), les noms « A, B et C »', b.includes('window._ckQui(e)') && /if\(q&&r\.indexOf\(q\)<0&&!\(e\.quiHors&&r\.length\)\) r\.push\(q\);/.test(b)
    && b.includes('noms:etN(n)') && b.includes('noms:etN(q)'));
  T('E2 le tracteur du jour entre dans le fil, trié à l’heure, et dans « En ce moment »', b.includes('window._ckTracJour(window.SESSIONS||[], auj') && b.includes('evts.sort(') && b.includes('tracCours:tracCours'));
  // ── F. le cockpit (cockpit-vue.js)
  const v = sansCom(S.vue);
  T('F1 le fil : « En ce moment » au-dessus de la journée, un « i », la phrase vide qui dit les deux', v.includes('id="ck-fil-c"') && v.includes("btnI('fil', ")
    && /\n  fil: '/.test(S.vue) && v.includes('videFil(C.length)') && v.includes('function coursItems()') && v.includes('function htmlCoursLi(c)'));
  T('F2 le tracteur garde sa place dans le fil, même sans tâche du plan', v.includes('if (EV_TRAC[e.type]) { S.evts.push(') && v.includes('S.trac = (v.tracCours || [])') && v.includes('if (EV_TRAC[e.type]) return texteTrac(e);'));
  T('F3 une ligne sans heure n’affiche pas d’heure ; « En ce moment » se redessine avec le fil',
    v.includes(`(e.ts ? '<time data-ts="' + e.ts + '">' + ilYa(e.ts) + '</time>' : '')`) && v.includes("if (cl) cl.innerHTML = C.map(htmlCoursLi).join('');"));
  const W = { EQ: { f0: { noms: 'Nico', ini: ['N'] }, f1: { noms: 'Victor', ini: ['V'] } } };
  const ligne = re => { const m = S.vue.match(re); if (!m) throw new Error('absente : ' + re); return m[0] + '\n'; };
  T('F0 le texte du tracteur se charge', () => { vm.createContext(W);
    vm.runInContext(ligne(/^const maj1 = .*$/m) + ligne(/^const EV_TRAC = .*$/m) + ligne(/^const dureeTxt = .*$/m) + ligne(/^const listeTxt = .*$/m) + fnDe(S.vue, 'function texteTrac(e) {'), W);
    return typeof W.texteTrac === 'function'; });
  if (typeof W.texteTrac === 'function') {
    const t1 = W.texteTrac({ type: 'trac', eq: 'f0', act: 'griffage', parcs: ['Les Perrières'], m: 45 });
    T('F4 « Nico a fini Les Perrières » / « Griffage au tracteur, 45 min » — aucun article devant l’activité', t1.titre === 'Nico a fini Les Perrières' && t1.sous === 'Griffage au tracteur, 45\u00a0min');
    const t2 = W.texteTrac({ type: 'trac', eq: 'f0', act: 'Griffage', parcs: ['A', 'B'], m: 80 });
    T('F5 un bloc : « a fini 2 parcelles », les noms, 1 h 20', t2.titre === 'Nico a fini 2\u00a0parcelles' && t2.sous === 'Griffage au tracteur\u00a0: A et B, 1\u00a0h\u00a020');
    const t3 = W.texteTrac({ type: 'trac-debut', eq: 'f0', act: 'Griffage', parcs: [], trac: 'Fendt 207' }), t4 = W.texteTrac({ type: 'traite', eq: 'f1', act: 'Traitement', parcs: ['P1', 'P2', 'P3'] });
    T('F6 la session ouverte, le traitement', t3.titre === 'Nico a pris le tracteur' && t3.sous === 'Griffage, Fendt 207' && t4.titre === 'Victor a traité' && t4.sous === '3\u00a0parcelles');
  }
  // ── G/H. la feuille, l'aide, le guide, les nouveautés
  T('G1 la feuille : la liste, les intertitres, leur « hidden »', S.css.includes('.ck-fil-c{') && S.css.includes('.ck-fil-sec{') && S.css.includes('.ck-fil-sec[hidden]{display:none}'));
  T('H1 l’aide du Pilotage dit le nouveau fil', S.uti.includes('montre d’abord qui est où en ce moment'));
  T('H2 l’aide de la Vigne : « Début » enregistre l’équipe, « Changer » la donne aux parcelles en cours', S.uti.includes('Les deux enregistrent l’équipe de la barre « Équipe sur … »')
    && S.uti.includes('Changer l’équipe d’une tâche la donne aussi aux parcelles en cours'));
  T('H3 le guide (Vigne, Pilotage)', S.g04.includes("Les deux enregistrent l'équipe du bandeau") && S.g04.includes("Changer l'équipe d'une tâche la donne aussi") && S.g11.includes('qui est où en ce moment'));
  T('H4 les nouveautés 8.86', /\{ v: '8\.86', d: '2026-10-12', items: \[/.test(S.uti) && S.uti.includes("titre: 'En direct : qui est où, et le tracteur'"));
  return res;
}
const contre = process.argv.includes('--contre');
if (!contre) {
  const r = run(SRC0); r.forEach(([ok, nom]) => console.log((ok ? '  ✓ ' : '  ✗ ') + nom));
  const ko = r.filter(x => !x[0]).length;
  console.log('mv-harnais-direct1 : ' + (r.length - ko) + '/' + r.length + (ko ? ' — ' + ko + ' ROUGE(S)' : ' vertes'));
  process.exit(ko ? 1 : 0);
}
const CONTRE = [
  ['l’auteur repasse devant l’équipe', 'ck', 'if(q && r.indexOf(q) < 0 && !(e.quiHors && r.length)) r.push(q);', 'if(q && r.indexOf(q) < 0 && !(e.quiHors && r.length)) r.unshift(q);'],
  ['« sans moi » ignoré', 'ck', '!(e.quiHors && r.length)', '!(false && r.length)'],
  ['« Début » (carte) sans l’équipe', 'app', 'JOURNAL.unshift(_mvEqApplique(_mvDebutLigne({id:Date.now().toString(16),date:date,', 'JOURNAL.unshift(_mvEqApplique((function(e){ return e; })({id:Date.now().toString(16),date:date,'],
  ['« Démarrer » (fiche) sans l’équipe', 'app', 'JOURNAL.unshift(_mvEqApplique(_mvDebutLigne({id:Date.now().toString(16),date:today,', 'JOURNAL.unshift(_mvEqApplique((function(e){ return e; })({id:Date.now().toString(16),date:today,'],
  ['un début oublie « sans moi »', 'app', '  if(g.quiHors) e.quiHors=true;\n  return e;', '  return e;'],
  ['« Changer » réécrit un groupe déjà noté', 'app', 'if(!e||e.qui!==me||(Array.isArray(e.membresEquipe)&&e.membresEquipe.length)) return;', 'if(!e||e.qui!==me) return;'],
  ['« Changer » touche le début d’un autre', 'app', 'if(!e||e.qui!==me||(Array', 'if(!e||(Array'],
  ['une parcelle décochée reste au fil', 'ck', "else if(e === 'decoche'){", "else if(e === 'decoche-x'){"],
  ['la fin de journée ne ferme rien', 'ck', "else if(e === 'finjour' || e === 'ferme'){", "else if(e === 'ferme'){"],
  ['la veille compte', 'ck', 'return y && _ckJourDe(y.t) === auj;', 'return y && !!_ckJourDe(y.t);'],
  ['un traitement d’un autre jour compte', 'ck', "if(String(s.date || '').slice(0, 10) !== auj) return;", 'if(false) return;'],
  ['une session terminée reste « en cours »', 'ck', "if(s.statut === 'Terminé') return;", ''],
  ['le repli du modèle remet l’auteur devant', 'pil', 'if(q&&r.indexOf(q)<0&&!(e.quiHors&&r.length)) r.push(q);', 'if(q&&r.indexOf(q)<0&&!(e.quiHors&&r.length)) r.unshift(q);'],
  ['le modèle oublie le tracteur', 'pil', 'tracCours:tracCours, ', ''],
  ['une ligne sans heure affiche « il y a … »', 'vue', `(e.ts ? '<time data-ts="' + e.ts + '">' + ilYa(e.ts) + '</time>' : '')`, `('<time data-ts="' + e.ts + '">' + ilYa(e.ts) + '</time>')`],
  ['un article devant l’activité', 'vue', "qui + ' a fini '", "qui + ' a fini le '"],
  ['« En ce moment » sans sa règle « hidden »', 'css', '.ck-fil-sec[hidden]{display:none}', ''],
  ['l’aide du Pilotage décrit l’ancien fil', 'uti', 'montre d’abord qui est où en ce moment', 'montre ce que l’équipe valide'],
];
let ko = 0;
CONTRE.forEach(([lab, k, a, b]) => {
  const n = SRC0[k].split(a).length - 1;
  if (n !== 1) { console.log('  ✗ contre-épreuve « ' + lab + ' » : ancre trouvée ' + n + ' fois'); ko++; return; }
  const S = Object.assign({}, SRC0, { [k]: SRC0[k].replace(a, () => b) });
  let rouges = 0; try { rouges = run(S).filter(x => !x[0]).length; } catch (e) { rouges = 1; }
  console.log((rouges ? '  ✓ ' : '  ✗ ') + 'contre-épreuve « ' + lab + ' » : ' + (rouges ? rouges + ' rouge(s)' : 'RESTE VERTE'));
  if (!rouges) ko++;
});
console.log('mv-harnais-direct1 --contre : ' + (CONTRE.length - ko) + '/' + CONTRE.length);
process.exit(ko ? 1 : 0);
