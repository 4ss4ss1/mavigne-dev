#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
//  ETAT-1 (§320) — LE PLAN DU COCKPIT LIT L'ÉTAT DE LA FICHE
//  Nico (12/10) : une parcelle « Entreplantation fait » dans Le domaine en direct, « À faire » sur sa fiche, aucune
//  entreplantation validée cette saison. Le plan relisait le journal : sans borne pour une tâche sans fenêtre (entreplantation
//  sans trou, travaux sans barème), et sourd aux annulations (↩ écrit « Annulé », « remis » n'écrit rien).
//  Exécute la VRAIE lecture du plan (cockpit.js entier), les VRAIS getTacheStatut et _tachesFor (app.js), le VRAI
//  _mvDebutsSuivent (app.js), le VRAI modèle du cockpit (_pilCk2Modele, pilotage.js), la VRAIE phrase de la loupe
//  (cockpit-vue.js) et le VRAI plan de secours (_ckPlanCorps) ; lit sur le texte l'aide, le guide et les nouveautés.
//    node scripts/mv-harnais-etat1.mjs [--contre]
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RAC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const L = f => fs.readFileSync(path.join(RAC, f), 'utf8');
const CONTRE = process.argv.includes('--contre');
const SRC0 = { ck: L('src/cockpit.js'), pil: L('src/pilotage.js'), vue: L('src/cockpit-vue.js'), app: L('src/app.js'), uti: L('src/utils.js'), guide: L('guide/11-pilotage.html') };
const fnDe = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n}\n', i) + 3); };
const ligne = (s, re) => { const m = s.match(re); if (!m) throw new Error('absente : ' + re); return m[0] + '\n'; };
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
const J0 = new Date(), iso = k => { const d = new Date(J0.getFullYear(), J0.getMonth(), J0.getDate() + k); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const ord = k => Math.round((Date.UTC(J0.getFullYear(), J0.getMonth(), J0.getDate() + k) - Date.UTC(2026, 0, 1)) / 864e5);

// La lecture du plan : cockpit.js entier. o.app : les VRAIS _tachesFor / getTacheStatut d'app.js (o.visu = la période consultée).
// o.presta : la porte de l'arrachage au prestataire — elle lit ses arguments, comme app.js/_pvAuPresta (T==='Arrachage' && …).
function lecture(S, o = {}) {
  const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, setTimeout: () => 0, localStorage: { getItem: () => null } };
  ctx.window = ctx;
  if (o.presta) ctx._mvAuPrestataire = (p, T) => T === 'Arrachage' && !!(p && p.auPresta);
  vm.createContext(ctx);
  if (o.app) vm.runInContext('var _VISU_SAISON = ' + JSON.stringify(o.visu || null) + ';\nvar SAISON_PASSAGES = {};\nfunction getSaisonActive(){ return { nom: "Hiver 2026-2027" }; }\n'
    + fnDe(S.app, 'function _tachesFor(p){') + fnDe(S.app, 'function getTacheStatut(p, nomTache) {') + 'window.getTacheStatut = getTacheStatut;\n', ctx);
  vm.runInContext(S.ck, ctx);
  return ctx;
}
// Le modèle du cockpit (pilotage.js), comme mv-harnais-forme1, avec la période (_pilSaison) et une seule fenêtre : la taille.
function modele(S) {
  const P = [{ nom: 'Combe', surface: .5, appellation: '', commune: 'Gevrey-Chambertin', statut: 'Active', taches: { 'Dégraffage': 'Validé' } },
    { nom: 'Clos', surface: .4, appellation: '', commune: 'Gevrey-Chambertin', statut: 'Active', taches: { Taille: 'En cours' } },
    { nom: 'Champ', surface: .3, appellation: '', commune: 'Brochon', statut: 'Active', taches: { Arrachage: 'En cours' }, auPresta: true },
    { nom: 'Vigne', surface: .2, appellation: '', commune: 'Brochon', statut: 'Active', taches: { Arrachage: 'En cours' } }];
  const hex = t => Math.floor(t).toString(16), now = Date.now();
  // Combe : une entreplantation validée il y a six mois (une saison passée) ; Clos : commencé avant l'ouverture de la fenêtre de la taille.
  const JOURNAL = [{ id: hex(now - 864e5 * 180), date: iso(-180), parcelle: 'Combe', tache: 'Entreplantation', qui: 'Nico', statut: 'Validé' },
    { id: hex(now - 864e5 * 30), date: iso(-30), parcelle: 'Clos', tache: 'Taille', qui: 'Hugo', membresEquipe: ['Hugo', 'Léa'], statut: 'En cours' }];
  const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, setTimeout: () => 0, localStorage: { getItem: () => null } };
  ctx.window = ctx;
  Object.assign(ctx, { PARCELLES: P, JOURNAL, MEMBRES: [], PLANNING_ENTRIES: {}, METEO_HOURLY: null, METEO_DAILY: null,
    tNom: n => n, _mvToday: () => iso(0), _mvAuPrestataire: (p, T) => T === 'Arrachage' && !!(p && p.auPresta),
    _mvTacheDuMoment: o => (o && Array.isArray(o.noms) && typeof o.fini === 'function')
      ? { mode: 'dates', taches: ['Taille'], items: [], dates: { Taille: { debut: iso(-20), fin: iso(59) } }, retard: {} }
      : { mode: 'aucune', taches: [], items: [], dates: {}, retard: {} } });
  vm.createContext(ctx); vm.runInContext(S.ck, ctx);
  vm.runInContext(fnDe(S.pil, 'function _pilEtatEntree(e){') + "window._mvEnContratLe = window._mvEnContratLe || function(){ return true; };\n" + fnDe(S.pil, 'function _pilPhotoIso(dt){')
    + fnDe(S.pil, 'function _pilPrevuLe(m, dt){') + fnDe(S.pil, 'function _pilJourDomaine(dt){') + fnDe(S.pil, 'function _pilMembresActifs(ds){') + fnDe(S.pil, 'function _pilPrioDuJour(d){')
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
    this.__V = _pilCk2Modele({ data: [{ nom:'Taille', pct:10, h_done:10, h_total:100, surf_total:1 }, { nom:'Entreplantation', pct:0, h_done:0, h_total:0, surf_total:1 },
      { nom:'Arrachage', pct:0, h_done:0, h_total:0, surf_total:1 }], totalReste:90, totalTotal:100, hDone:10, gaugePct:10,
      saison:{ nom:'Hiver' }, presences:[{ nom:'Hugo', etat:'present' }], tracs:[] }, { obj:new Date(Date.now()+48*864e5), proj:new Date(Date.now()+43*864e5), marge:5, cadH:35 });`, ctx);
  return ctx.__V;
}

function suite(S) {
  const out = []; const T = (n, c) => { let v; try { v = typeof c === 'function' ? c() : c; } catch (e) { v = false; n += ' — plantage : ' + (e && e.message); } out.push([n, !!v]); };
  // ── A. l'état vient de la fiche
  const W = lecture(S, { presta: true });
  const crais = { nom: 'Combe', surface: 0.5, taches: { 'Dégraffage': 'Validé' } };
  const Jn = [{ date: '2026-04-20', parcelle: 'Combe', tache: 'Entreplantation', qui: 'Nico', statut: 'Validé' }, { date: '2026-10-12', parcelle: 'Combe', tache: 'Dégraffage', qui: 'Nico', statut: 'Validé' }];
  T('A1 le cas de Nico : une tâche sans fenêtre (début nul) et une validation d’une saison passée — la parcelle reste à faire ; le dégraffage validé sur la fiche est fait',
    () => W._ckPlanEtats([crais], Jn, 'Entreplantation', null, false).Combe === 'afaire' && W._ckPlanEtats([crais], Jn, 'Dégraffage', null, false).Combe === 'faite');
  const P2 = { nom: 'P', taches: { Taille: 'Non démarré' } };
  const J2 = [{ date: '2026-10-12', parcelle: 'P', tache: 'Taille', qui: 'Nico', statut: 'Validé' }, { date: '2026-10-12', parcelle: 'P', tache: 'Taille', qui: 'Nico', statut: 'Annulé' }];
  T('A2 validée puis annulée (↩) : à faire, comme sur la fiche', () => W._ckPlanEtats([P2], J2, 'Taille', '2026-10-01', false).P === 'afaire');
  const J3 = [{ date: '2026-10-12', parcelle: 'P', tache: 'Taille', qui: 'Nico', statut: 'En cours' }, { date: '2026-10-12', parcelle: 'P', tache: 'Taille', qui: 'Nico', statut: 'Annulé' }];
  T('A3 commencée puis annulée : à faire, et personne dessus', () => W._ckPlanEtats([P2], J3, 'Taille', '2026-10-01', false).P === 'afaire' && Object.keys(W._ckPlanDebuts([P2], J3, 'Taille', '2026-10-01')).length === 0);
  const P4 = { nom: 'P', taches: { Taille: 'En cours' } };
  const J4 = [{ date: '2026-10-10', parcelle: 'P', tache: 'Taille', qui: 'Hugo', statut: 'En cours' }, { date: '2026-10-12', parcelle: 'P', tache: 'Taille', qui: 'Hugo', statut: 'Validé' }];
  T('A4 « remis » (aucune trace au journal) : en cours, avec l’équipe du début', () => W._ckPlanEtats([P4], J4, 'Taille', '2026-10-01', false).P === 'cours' && (W._ckPlanDebuts([P4], J4, 'Taille', '2026-10-01').P || {}).qui === 'Hugo');
  T('A5 validée sur la fiche sans ligne à son nom (validation groupée « Domaine ») : faite',
    () => W._ckPlanEtats([{ nom: 'P', taches: { Taille: 'Validé' } }], [{ date: '2026-10-12', parcelle: 'Domaine', tache: 'Taille', statut: 'Validé' }], 'Taille', '2026-10-01', false).P === 'faite');
  T('A6 fenêtre passée : ce qui est à faire est en retard ; en cours et faite ne bougent pas',
    () => { const e = W._ckPlanEtats([{ nom: 'a', taches: {} }, { nom: 'c', taches: { Taille: 'En cours' } }, { nom: 'f', taches: { Taille: 'Validé' } }], [], 'Taille', null, true); return e.a === 'retard' && e.c === 'cours' && e.f === 'faite'; });
  T('A7 une parcelle arrachée reste arrachée, quel que soit son statut (avec ou sans accent)',
    () => { const e = W._ckPlanEtats([{ nom: 'x', statut: 'Arrachée', taches: { Taille: 'Validé' } }, { nom: 'y', statut: 'Arrachee', taches: { Taille: 'En cours' } }], [], 'Taille', null, true); return e.x === 'arr' && e.y === 'arr'; });
  const P8 = [{ nom: 'fini', auPresta: true, taches: { Arrachage: 'En cours', Taille: 'En cours' } }, { nom: 'entame', taches: { Arrachage: 'En cours' } }, { nom: 'tout', taches: { Arrachage: 'Validé' } }];
  T('A8 arrachage fini pour l’équipe : fait ; entamé : en cours ; validé en entier : fait — et la porte ne joue que pour l’arrachage',
    () => { const e = W._ckPlanEtats(P8, [], 'Arrachage', null, false); return e.fini === 'faite' && e.entame === 'cours' && e.tout === 'faite' && W._ckPlanEtats(P8, [], 'Taille', null, false).fini === 'cours'; });
  T('A9 un lecteur de statut passé en option l’emporte (« Changer » lit la période active)',
    () => W._ckPlanEtats([{ nom: 'P', taches: { Taille: 'En cours' } }], [], 'Taille', null, false, { statut: () => 'Validé' }).P === 'faite');
  // ── B. l'équipe : la dernière ligne « En cours » de la période
  const PB = [{ nom: 'P', taches: { Taille: 'En cours' } }];
  const b1 = [{ date: '2026-10-05', parcelle: 'P', tache: 'Taille', qui: 'Hugo', statut: 'En cours' }, { date: '2026-10-06', parcelle: 'P', tache: 'Taille', qui: 'Hugo', statut: 'Annulé' },
    { date: '2026-10-08', parcelle: 'P', tache: 'Taille', qui: 'Léa', statut: 'En cours' }];
  T('B1 commencée, annulée, recommencée : l’équipe du dernier début', () => (W._ckPlanDebuts(PB, b1, 'Taille', '2026-10-01').P || {}).qui === 'Léa');
  const b2 = [{ date: '2026-10-08', parcelle: 'P', tache: 'Taille', qui: 'Hugo', statut: 'En cours', ts_debut: 100 }, { date: '2026-10-08', parcelle: 'P', tache: 'Taille', qui: 'Léa', statut: 'En cours', ts_debut: 200 }];
  T('B2 deux débuts le même jour : l’heure du début départage', () => (W._ckPlanDebuts(PB, b2, 'Taille', '2026-10-01').P || {}).qui === 'Léa');
  const b3 = [{ date: '2026-09-20', parcelle: 'P', tache: 'Taille', qui: 'Hugo', statut: 'En cours' }];
  T('B3 un début d’avant la période n’est pas l’équipe de la période', () => Object.keys(W._ckPlanDebuts(PB, b3, 'Taille', '2026-10-01')).length === 0 && (W._ckPlanDebuts(PB, b3, 'Taille', null).P || {}).qui === 'Hugo');
  const b4 = [{ date: '2027-04-05', parcelle: 'P', tache: 'Taille', qui: 'Hugo', statut: 'En cours' }];
  T('B4 ni un début d’après sa fin (une période consultée en archive)', () => Object.keys(W._ckPlanDebuts(PB, b4, 'Taille', '2026-10-01', { fin: '2027-03-31' })).length === 0
    && (W._ckPlanDebuts(PB, b4, 'Taille', '2026-10-01').P || {}).qui === 'Hugo');
  const b5 = [{ date: '2026-10-08', parcelle: 'F', tache: 'Taille', qui: 'Hugo', statut: 'En cours' }, { date: '2026-10-08', parcelle: 'A', tache: 'Taille', qui: 'Hugo', statut: 'En cours' }];
  T('B5 seules les parcelles en cours ont une équipe (une faite, une à faire : personne)', () => Object.keys(W._ckPlanDebuts([{ nom: 'F', taches: { Taille: 'Validé' } }, { nom: 'A', taches: { Taille: 'Non démarré' } }], b5, 'Taille', '2026-10-01')).length === 0);
  // ── C. les VRAIS getTacheStatut et _tachesFor (app.js) : la période consultée, comme la fiche
  const pa = { nom: 'Arch', taches: { Taille: 'Non démarré' }, tachesAll: { 'Hiver 2025-2026': { Taille: 'Validé' } } };
  T('C1 le plan lit la fiche par getTacheStatut : la période consultée (archive : faite), sinon l’active (à faire)',
    () => lecture(S, { app: true, visu: 'Hiver 2025-2026' })._ckPlanEtats([pa], [], 'Taille', null, false).Arch === 'faite' && lecture(S, { app: true })._ckPlanEtats([pa], [], 'Taille', null, false).Arch === 'afaire');
  // ── D. le VRAI modèle du cockpit (pilotage.js)
  let V = null; T('D0 le modèle se construit', () => { V = modele(S); return !!(V && V.etats); });
  if (V) {
    T('D1 Combe : l’entreplantation d’une saison passée ne la peint plus « faite » (tâche sans fenêtre)', () => V.etats.entreplantation.Combe === 'afaire');
    T('D2 une parcelle commencée avant l’ouverture de la fenêtre porte son équipe et le jour du début (cherchés dans la période)',
      () => V.equipes.some(e => e.parcelle === 'Clos' && e.noms === 'Hugo et Léa' && e.depuis === iso(-30)) && V.etats.taille.Clos === 'cours');
    T('D3 l’arrachage fini pour l’équipe est fait et part dans presta ; l’entamé est en cours', () => V.etats.arrachage.Champ === 'faite' && V.etats.arrachage.Vigne === 'cours' && JSON.stringify(V.presta) === JSON.stringify({ arrachage: ['Champ'] }));
    T('D4 les tâches gardent leurs fenêtres (la taille ouvre il y a 20 jours, l’entreplantation n’en a pas)', () => V.taches.map(t => t.id).join() === 'taille,entreplantation,arrachage' && V.taches[0].debut === iso(-20) && V.taches[1].debut === null);
  }
  // ── E. le VRAI _mvDebutsSuivent (app.js) : « Changer » lit le statut de la période ACTIVE, même en consultant une archive
  T('E1 « Changer » donne l’équipe à la parcelle en cours de la période active, quoi que dise la période consultée', () => {
    const C = lecture(S); C.getTacheStatut = () => '';   // la période consultée (une archive) : rien n'y est en cours
    const A = { console, Date, Math, JSON, String, Number, Array, Object, isFinite, parseInt, navigator: {}, currentUser: { nom: 'Nico' }, SAVES: [],
      PARCELLES: [{ nom: 'Pasquier', taches: { 'Réparation': 'En cours' } }],
      JOURNAL: [{ id: 'a', date: '2026-10-08', parcelle: 'Pasquier', tache: 'Réparation', qui: 'Nico', statut: 'En cours', equipe: false }],
      _eqtFor: () => ['Victor', 'Shana'], _eqtHors: () => false, getSaisonActive: () => ({ nom: 'Automne 2026', debut: '2026-10-01' }), _mvEqDe: () => null, _mvMoiAdmin: () => true };
    A.window = A; A.saveData = k => { A.SAVES.push(k); }; A._ckPlanDebuts = C._ckPlanDebuts;
    vm.createContext(A);
    vm.runInContext(fnDe(S.app, 'function _mvEqApplique(e){') + fnDe(S.app, 'function _mvGroupeTache(task){') + fnDe(S.app, 'function _mvDebutLigne(e,task){') + fnDe(S.app, 'function _mvDebutsSuivent(task){'), A);
    const F = A._mvDebutsSuivent('Réparation');
    return F.join() === 'Pasquier' && A.JOURNAL[0].membresEquipe.join() === 'Victor,Shana';
  });
  // ── F. la VRAIE phrase de la loupe (cockpit-vue.js)
  T('F1 la loupe d’un arrachage fini pour l’équipe dit que la suite revient au prestataire ; les autres, comme avant', () => {
    const c = {}; vm.createContext(c);
    const i = S.vue.indexOf('const etatVue = (t, pid) => {'), etatVue = S.vue.slice(i, S.vue.indexOf('\n};\n', i) + 4);
    vm.runInContext(ligne(S.vue, /^const esc = .*$/m) + ligne(S.vue, /^const libEtat = .*$/m)
      + "const S = { etats: { arrachage: { p0: 'faite', p1: 'faite', p2: 'cours' } }, presta: { arrachage: { p0: true } }, equipes: [{ id: 'e0', tache: 'arrachage', parc: 'p2', depuis: '2026-10-12' }] };\n"
      + "const T = { arrachage: { nom: 'Arrachage', f: false, fin: new Date(Date.UTC(2027, 2, 31)) } };\nconst PIDX = { p0: { arr: false }, p1: { arr: false }, p2: { arr: false } };\n"
      + "const EQ = { e0: { noms: 'Victor et Shana' } };\nconst AUJ = new Date(Date.UTC(2026, 9, 12));\nfunction quand(d){ return 'aujourd’hui'; }\n"
      + etatVue + fnDe(S.vue, 'function phraseEtat(t, pid) {') + 'this.__f = phraseEtat;', c);
    return c.__f('arrachage', 'p0') === 'Arrachage fait pour l’équipe, la suite au prestataire' && c.__f('arrachage', 'p1') === 'Arrachage fait'
      && c.__f('arrachage', 'p2') === 'Arrachage en cours, Victor et Shana, <em>aujourd’hui</em>';
  });
  T('F2 le cockpit range les parcelles au prestataire reçues du modèle', S.vue.includes("S.presta[t.id] = {}; ((v.presta && v.presta[t.id]) || []).forEach(n => { const pid = parNom[n]; if (pid) S.presta[t.id][pid] = true; });"));
  // ── H. le VRAI plan de secours (_ckPlanCorps, cockpit.js) : la même lecture, la période du Pilotage
  T('H1 plan de secours : l’équipe d’une parcelle commencée avant la fenêtre est posée ; une validation d’une saison passée ne repeint rien', () => {
    const WH = lecture(S);
    WH._pilSaison = () => ({ nom: 'Hiver 2026-2027', debut: '2026-10-01', fin: '2027-03-31' });
    const CK = vm.runInContext('_CK', WH);
    CK.plan = { parcs: [{ nom: 'Clos', surface: 0.4, appellation: 'Gevrey-Chambertin', commune: 'Gevrey-Chambertin', taches: { Taille: 'En cours' } },
      { nom: 'Combe', surface: 0.5, appellation: 'Gevrey-Chambertin', commune: 'Gevrey-Chambertin', taches: {} }],
      journal: [{ date: '2026-10-20', parcelle: 'Clos', tache: 'Taille', qui: 'Hugo', membresEquipe: ['Hugo', 'Léa'], statut: 'En cours' }, { date: '2026-04-20', parcelle: 'Combe', tache: 'Taille', qui: 'Nico', statut: 'Validé' }],
      rows: [{ nom: 'Taille', pct: 10 }], fen: [{ nom: 'Taille', ws: 334, we: 441 }], retards: {} };
    CK.tachePlan = 'Taille';
    const h = WH._ckPlanCorps();
    return h.includes('>HL</text>') && h.includes('class="ck-pl-p et-cours"') && !h.includes('et-faite');
  });
  // ── G. le branchement, l'aide, le guide, les nouveautés (sur le texte)
  const b = sansCom(fnDe(S.pil, 'function _pilCk2Modele(d, m){'));
  T('G1 le modèle passe la période aux deux lectures et publie presta ; plus de date de tâche pour l’état ni pour l’équipe',
    b.includes('window._ckPlanEtats(PARC, J, t.cle, perD, !!retards[t.cle], perO)') && b.includes('window._ckPlanDebuts(PARC, J, t.cle, perD, perO)') && b.includes('presta:presta') && !b.includes('t.cle, t.debut'));
  T('G2 la porte de l’arrachage au prestataire existe dans app.js avec la signature lue par le plan', /window\._mvAuPrestataire=function\(p,T\)\{/.test(S.app));
  T('G3 l’aide, la bulle du plan et le guide disent que la couleur suit la fiche',
    S.uti.includes('celui de la fiche de la parcelle pour la période : faite (validée ; une annulation la remet à faire)') && S.uti.includes('colorée selon son état sur sa fiche pour la tâche choisie')
    && S.vue.includes('celui de sa fiche pour la période : faite une fois validée') && S.guide.includes('colorée selon son état sur sa fiche pour la tâche choisie'));
  /* ★ LABO-2 (§321) : « en tête » ne tient que jusqu'au lot suivant, qui pose son bloc au-dessus et relève APP. La règle garde ce
     qui compte : le bloc 8.88 existe, avec son niveau et son public, et APP n'est pas redescendu sous 8.88. */
  T('G4 la nouveauté : bloc 8.88 présent, niveau 0 (Journal), pour l’admin ; APP au moins 8.88', (() => {
      const v = (S.uti.match(/export const APP_VERSION = '(\d+)\.(\d+)';/) || []).slice(1).map(Number);
      return v.length === 2 && (v[0] > 8 || (v[0] === 8 && v[1] >= 88)); })()
    && S.uti.includes("  { v: '8.88', d: '2026-10-12', items: [\n    { niv: 0, pour: ['admin'], emoji: 'carte', titre: 'Le domaine en direct suit la fiche de chaque parcelle',"));
  return out;
}

function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ETAT-1 : ' + ko + ' ROUGE(S) sur ' + res.length : 'ETAT-1 : ' + res.length + ' vertes'));
if (CONTRE) {
  const JR = "  (journal || []).forEach(function(e){\n    if(!e || e.tache !== tache || e.statut !== 'En cours' || etat[e.parcelle] !== 'cours') return;";
  const DEF = [
    ['l’état relu au journal : une validation y repeint la parcelle (le défaut signalé)', 'ck', JR, "  (journal || []).forEach(function(e){ if(e && e.tache === tache && e.statut === 'Validé' && etat[e.parcelle] && etat[e.parcelle] !== 'arr') etat[e.parcelle] = 'faite'; });\n" + JR],
    ['la fiche jamais lue', 'ck', 'var s = lire(p, tache);', "var s = '';"],
    ['un arrachage fini pour l’équipe laissé en cours', 'ck', "((presta && presta(p, tache)) ? 'faite' : 'cours')", "'cours'"],
    ['l’équipe cherchée avant le début de la période', 'ck', '(debutIso && d < debutIso) || ', ''],
    ['l’équipe cherchée après la fin de la période', 'ck', ' || (fin && d > fin)', ''],
    ['le même jour, l’heure du début ignorée', 'ck', ' || (d === dc && (Number(e.ts_debut) || 0) > (Number(c.ts_debut) || 0))', ''],
    ['le premier début au lieu du dernier', 'ck', 'if(!c || d > dc ||', 'if(!c || d < dc ||'],
    ['le retard oublié', 'ck', 'if(enRetard) Object.keys(etat)', 'if(false) Object.keys(etat)'],
    ['une arrachée qui suit sa fiche', 'ck', "if(/arrach/i.test(String(p.statut || ''))){ etat[p.nom] = 'arr'; return; }", ''],
    ['le lecteur passé en option ignoré', 'ck', "(o && typeof o.statut === 'function') ? o.statut : _ckPlanStatut", '_ckPlanStatut'],
    ['la fiche lue sans getTacheStatut (la période consultée ignorée)', 'ck', "if(typeof window.getTacheStatut === 'function') return String(window.getTacheStatut(p, tache) || '');", ''],
    ['le modèle repasse la date de la tâche pour l’équipe', 'pil', 'window._ckPlanDebuts(PARC, J, t.cle, perD, perO)', 'window._ckPlanDebuts(PARC, J, t.cle, t.debut)'],
    ['le modèle oublie le prestataire', 'pil', '    if(pr.length) presta[t.id]=pr;\n', ''],
    ['la loupe sans la suite au prestataire', 'vue', "  if (e === 'faite' && (S.presta[t] || {})[pid]) return", '  if (false) return'],
    ['« Changer » lit la période consultée', 'app', "d0, { statut:function(p,t){ var s=p&&p.taches&&p.taches[t]; return typeof s==='string'?s:''; } });", 'd0);'],
    ['le plan de secours borné à la fenêtre de la tâche', 'ck', 'var per = _ckPlanPeriode(), etats =', "var per = { debut: _ckPlanDebut(P.fen, t.nom), fin: '' }, etats ="],
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
