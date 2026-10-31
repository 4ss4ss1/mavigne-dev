#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais FERTI-9 (§499) : l'amendement prépare sa session tracteur
// ═══════════════════════════════════════════════════════════════════════════
//  Nico (30/10, dicté) : « quand je valide cet amendement, ça crée une session
//  tracteur […] avec les parcelles qui ont été sélectionnées et la quantité de
//  sacs sur chaque parcelle ». Recommandation suivie (« oui ») : la session est
//  PRÉPARÉE — une carte « À démarrer » en tête du Tracteur — et ne naît qu'au
//  démarrage, par la feuille « Nouvelle session ». On éprouve :
//    · _ferPrepCalc : ce qui reste (registre, désactivées, arrachées), la session
//      en cours qui retire la carte, « À reprendre », les sacs figés ou recalculés
//    · _ferSave : `prep` et `sacsParc`, des sacs ENTIERS (décision de Nico, 30/10 : « si
//      c'est 1,5, on en dit 2 ») ; la commande est leur somme
//    · le jour de chaque parcelle : celui où elle a été faite (décision de Nico, 30/10),
//      la coche du Tracteur le porte, le registre et le journal le lisent
//    · _ferPrep : proposer, retirer, « Annuler » ; la ligne de l'apport
//    · le Tracteur : la carte (qui voit « Démarrer », ce qu'elle dit, l'échappement),
//      « Démarrer » (la feuille remplie), saveSession (reliée, ses parcelles seules),
//      l'activité changée en route, les sacs de chaque ligne
//    · le parcours entier, branché sur les vraies fonctions des DEUX modules :
//      enregistrer → carte → démarrer → cocher (FERTI-3) → terminer avant la fin →
//      « À reprendre » → désactiver la dernière → plus de carte
//    · les branchements : la page, la feuille, l'aide, les guides, les nouveautés,
//      les tutos
//  Le code est EXTRAIT de phyto.js et de tracteur.js, jamais réécrit ici.
//  Usage : node scripts/mv-harnais-ferti9.mjs [--contre]
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const R = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8').replace(/\r\n/g, '\n');
const SRC0 = {
  phy: lire('src/phyto.js'), tr: lire('src/tracteur.js'), html: lire('index.html'), css: lire('src/styles.css'),
  utl: lire('src/utils.js'), wn: lire('src/whats-new.js'), g6: lire('guide/06-tracteur.html'), g7: lire('guide/07-phyto.html'),
  tuto: lire('scripts/tutos-couverture.json')
};
const CONTRE = process.argv.includes('--contre');
const NB = '\u00a0';

function fonction(src, debut) {
  const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut);
  let k = src.indexOf('{', i), p = 0;
  for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── le monde de la fertilisation : le vrai bloc FERTI de phyto.js ──
function mondePhyto(S) {
  const i0 = S.phy.indexOf("// FERTI-1 \u2014 L'AMENDEMENT"), i1 = S.phy.indexOf('window.openOvFerti=openOvFerti;');
  if (i0 < 0 || i1 < 0) throw new Error('bloc FERTI introuvable dans phyto.js');
  const BLOC = S.phy.slice(i0, i1);
  const NORM = S.phy.slice(S.phy.indexOf('function _phyNorm('), S.phy.indexOf('function _phyEphyMeta('));
  const win = {
    PARCELLES: [
      { nom: 'A', surface: 0.42, statut: 'Active' }, { nom: 'B', surface: 0.38, statut: 'Active' },
      { nom: 'C', surface: 1.12, statut: 'Active' }, { nom: 'D', surface: 0.5, statut: 'Active' },
      { nom: 'X', surface: 0.5, statut: 'Arrachee' }
    ],
    SESSIONS: [], JOURNAL: [], TACHES: [], ACTIVITES: [],
    TRACTEURS_LIST: [{ id: 't1', nom: 'Bobard' }, { id: 't2', nom: 'Fendt' }],
    INTRANTS: { produits: [], achats: [], achat_four: [], fertil: [] },
    CONFIG: { vigne: { ec_rang: 1, ec_pied: 1 } }, EPHY: [], saved: [], toasts: [],
    saveIntrants() { win.saved.push('intrants'); }, saveData(k) { win.saved.push(k); },
    getSaisonActive: () => ({ nom: '2026' }), _perPoseTache: () => true,
    _mvVigne: () => ({ ec_rang: 1, ec_pied: 1, pieds: 10000 }),
    showToastAnnuler(m, f) { win.annul = { m, f }; }
  };
  const etat = { admin: true };
  const fn = new Function('window', 'isAdmin', 'showToast', '_escHtml', '_escAttr', '_mvToday', 'openOv', 'closeOv', 'document',
    NORM + BLOC + '\nreturn { _ferPrepCalc, _ferSacsDe, _ferSave, _ferPrep, _ferFaits, _ferPrepLigne, _ferSyncSessions, _ferSacsTxt,' +
    ' setFer: function(o){ _fer = o; }, neuf: _ferNeuf };');
  const doc = { getElementById: () => null, createElement: () => ({}), head: { appendChild() {} }, body: { appendChild() {} } };
  const api = fn(win, () => etat.admin, m => { win.toasts.push(m); }, esc, esc, () => '2026-10-30', () => {}, () => {}, doc);
  return { win, api, etat };
}
// Un amendement enregistré par le vrai _ferSave : Terrafumur, 1,5 t/ha, sacs de 25 kg, A et C, la machine t2.
function enregistrer(P) {
  const f = P.api.neuf();
  f.prod.nom = 'Terrafumur'; f.prod.N = '2'; f.dose = '1,5'; f.kg = '25'; f.parcs = { A: 1, C: 1 };
  f.v = '4'; f.ec = '1'; f.rd = '75'; f.mach = 't2'; f.sem = '2026-11-02';
  P.api.setFer(f); P.api._ferSave();
  return P.win.INTRANTS.fertil[P.win.INTRANTS.fertil.length - 1];
}

// ── le monde du Tracteur : les vraies fonctions FERTI-9 de tracteur.js et saveSession ──
function mondeTracteur(S, win, o) {
  const noms = ['function _trFerListe(', 'function _trFerSacsTxt(', 'function _trFerHtml(', 'function _trFerDemarrer(',
    'function _trFerBan(', 'function _trFerSacsLigne(', 'function saveSession(', 'function _trCocheJour('];
  const E = { ouvertes: 0, act: 0, trac: null, cond: null, condSel: null, toasts: [], saves: 0, rendus: 0 };
  const els = {
    's-date': { value: '2026-11-03' }, 's-trac-id': { value: 't2' }, 's-note': { value: '' }, 's-act': { value: 'Amendement' },
    's-fer': { style: { display: 'none' }, textContent: '', innerHTML: '' }
  };
  const conds = [{ textContent: 'Marc' }, { textContent: 'L\u00e9a' }];
  win._mvHaT = x => String(Math.round(x * 100) / 100).replace('.', ',');
  win.currentUser = { nom: o.moi || 'L\u00e9a' };
  const ctx = {
    E, window: win, PARCELLES: win.PARCELLES, SESSIONS: win.SESSIONS, ACTIVITES: win.ACTIVITES, TRACTEURS_LIST: win.TRACTEURS_LIST,
    REPARATEUR: o.rep || {}, isTractoriste: () => !!o.tract, isAdmin: () => !!o.adm,
    _actNomDuSelect: () => els['s-act'].value, _fmtDate: d => d, _escHtml: esc, _escAttr: esc, _mvToday: () => o.jour || '2026-11-03',
    _saisonForDate: () => '2026', _condList: () => [{ nom: 'Marc' }], _mvActCoeq: () => false,
    _saveData: () => { E.saves++; }, _closeOv: () => {}, renderTracteur: () => { E.rendus++; }, showToast: m => { E.toasts.push(m); },
    document: {
      getElementById: id => els[id] || null,
      querySelector: sel => (sel === '#s-cond-pick .pchk.sel' ? (E.condSel || conds[0]) : null),
      querySelectorAll: sel => (sel === '#s-cond-pick .pchk' ? conds : [])
    }
  };
  const code = 'var _trFerOp=null;\n' + noms.map(d => fonction(S.tr, d)).join('\n') +
    '\nfunction openNewSession(){ _trFerOp=null; E.ouvertes++; }' +
    '\nfunction onSessionActChange(){ E.act++; }' +
    '\nfunction _pickTrac(p,id,def){ E.trac=id; }' +
    '\nfunction pickCond(el){ E.cond=el.textContent; E.condSel=el; }' +
    '\nthis.api={ html:_trFerHtml, demarrer:_trFerDemarrer, ban:_trFerBan, ligne:_trFerSacsLigne, save:saveSession, liste:_trFerListe,' +
    ' op:function(){ return _trFerOp; }, cocheJour:_trCocheJour };';
  vm.createContext(ctx); vm.runInContext(code, ctx);
  return { t: ctx.api, E, els };
}

function controles(S) {
  const out = [];
  const T = (id, lib, ok) => out.push([id, lib, !!ok]);
  const essai = (id, lib, f) => { try { f(); } catch (e) { T(id, lib + ' — PLANTAGE : ' + e.message, false); } };

  // 1. LE MOTEUR (pur)
  essai('M', 'moteur', () => {
    const P = mondePhyto(S), calc = P.api._ferPrepCalc;
    const PARC = [{ nom: 'A', surface: 0.42 }, { nom: 'B', surface: 0.38 }, { nom: 'C', surface: 1.12 }, { nom: 'X', surface: 0.5, statut: 'Arrachee' }];
    const op1 = { id: 'f1', prep: true, cree: '2026-10-20', sem: '2026-11-02', parcs: ['A', 'B', 'C', 'X'], dose: 1.5, kgSac: 25,
      prod: { nom: 'Terrafumur' }, sacsParc: { A: 26, B: 23, C: 68 }, trac: { mach: 't2' } };
    const r1 = calc([op1], {}, [], PARC);
    T('M1', 'un apport préparé : ses parcelles qui restent (l’arrachée en moins), ses sacs, sa surface, sa machine',
      r1.length === 1 && r1[0].reste.join() === 'A,B,C' && r1[0].sacs === 117 && Math.abs(r1[0].surf - 1.92) < 1e-9 && r1[0].mach === 't2' && r1[0].demarree === false && r1[0].act === 'Amendement');
    T('M2', 'un apport non préparé (prep absent ou faux) ne fait pas de carte',
      calc([Object.assign({}, op1, { prep: false })], {}, [], PARC).length === 0 && calc([Object.assign({}, op1, { prep: undefined })], {}, [], PARC).length === 0);
    T('M3', 'une session « En cours » née de l’apport retire la carte (elle est déjà en tête)',
      calc([op1], {}, [{ ferOp: 'f1', statut: 'En cours' }], PARC).length === 0 && calc([op1], {}, [{ ferOp: 'autre', statut: 'En cours' }], PARC).length === 1);
    const r4 = calc([op1], { f1: { A: { date: '2026-11-03', src: 'session' } } }, [{ ferOp: 'f1', statut: 'Termin\u00e9', parcellesSkip: ['B'] }], PARC);
    T('M4', 'terminée avant la fin : « À reprendre », sans la parcelle faite ni celle désactivée exprès',
      r4.length === 1 && r4[0].reste.join() === 'C' && r4[0].demarree === true && r4[0].sacs === 68);
    T('M5', 'tout est fait (registre ou désactivées) : plus de carte',
      calc([op1], { f1: { A: { date: 'x' }, B: { date: 'x' } } }, [{ ferOp: 'f1', statut: 'Termin\u00e9', parcellesSkip: ['C'] }], PARC).length === 0);
    const op2 = Object.assign({}, op1, { id: 'f2', sacsParc: undefined });
    const r6 = calc([op2], {}, [], PARC)[0];
    T('M6', 'sans sacs figés, ils se recalculent comme à l’étape 2 : 1,5 t × 0,42 ha / 25 kg = 25,2 → 26 (le sac entier)',
      !!r6 && r6.sacsParc.A === 26 && r6.sacsParc.B === 23 && r6.sacsParc.C === 68);
    const r7 = calc([Object.assign({}, op2, { dose: null })], {}, [], PARC)[0];
    T('M7', 'sans dose : les sacs restent inconnus (jamais inventés), la carte existe quand même',
      !!r7 && r7.sacsInc === true && r7.sacs === 0 && r7.sacsParc.A === null);
    const tri = calc([Object.assign({}, op1, { id: 'tard', sem: '2026-11-20' }), Object.assign({}, op1, { id: 'tot', sem: '2026-11-05' })], {}, [], PARC);
    T('M8', 'les cartes se rangent par semaine prévue', tri.map(x => x.id).join() === 'tot,tard');
    T('M9', 'des sacs entiers, le pluriel à partir de 2 : « 1 sac », 1,5 → « 2 sacs », 0,4 → « 1 sac », 25,2 → « 26 sacs »',
      P.api._ferSacsTxt(1) === '1' + NB + 'sac' && P.api._ferSacsTxt(1.5) === '2' + NB + 'sacs' && P.api._ferSacsTxt(0.4) === '1' + NB + 'sac' && P.api._ferSacsTxt(25.2) === '26' + NB + 'sacs');
  });

  // 2. L'ENREGISTREMENT (le vrai _ferSave)
  essai('S', 'enregistrement', () => {
    const P = mondePhyto(S), op = enregistrer(P);
    T('S1', 'l’apport enregistré est préparé pour le tracteur (prep:true)', !!op && op.prep === true);
    T('S2', 'les sacs de chaque parcelle sont figés comme l’étape 2 les montre, entiers (A 25,2 → 26 · C 67,2 → 68)',
      !!op && op.sacsParc && op.sacsParc.A === 26 && op.sacsParc.C === 68 && Object.keys(op.sacsParc).join() === 'A,C');
    T('S5', 'la commande est la somme des sacs à mettre (26 + 68 = 94) : autant de sacs achetés que de sacs à mettre', !!op && op.sacs === 94);
    T('S3', 'le message dit que la session est prête dans Tracteur', P.win.toasts.some(m => /session pr\u00eate dans Tracteur/.test(m)));
    const P2 = mondePhyto(S), f = P2.api.neuf(); f.prod.nom = 'Sans dose'; f.parcs = { B: 1 }; P2.api.setFer(f); P2.api._ferSave();
    const op2 = P2.win.INTRANTS.fertil[0];
    T('S4', 'sans dose ni sac : préparé quand même, sacs à null (rien d’inventé, Firestore refuse undefined)', !!op2 && op2.prep === true && op2.sacsParc === null);
  });

  // 3. PROPOSER / RETIRER, ET LA LIGNE DE L'APPORT
  essai('P', 'proposer', () => {
    const P = mondePhyto(S);
    const ancien = { id: 'v1', cree: '2026-10-26', parcs: ['A', 'B'], dose: 1, kgSac: 25, prod: { nom: 'Vieux' }, man: {} };
    P.win.INTRANTS.fertil.push(ancien);
    T('P1', 'un apport d’avant : « Préparer la session tracteur » pour l’administrateur, rien pour les autres',
      /onclick="_ferPrep\(this\.dataset\.op\)">Pr\u00e9parer la session tracteur/.test(P.api._ferPrepLigne(ancien, {}, true)) && P.api._ferPrepLigne(ancien, {}, false) === '');
    P.api._ferPrep('v1');
    T('P2', 'préparé : prep:true, ses sacs calculés entiers (A 16,8 → 17 · B 15,2 → 16)', ancien.prep === true && ancien.sacsParc && ancien.sacsParc.A === 17 && ancien.sacsParc.B === 16);
    const lg = P.api._ferPrepLigne(ancien, {}, true);
    T('P3', 'la ligne dit « session prête », le nombre de parcelles, et « Ne plus la proposer » (valeur lue dans data-op, jamais interpolée dans le geste)',
      /session pr\u00eate/.test(lg) && /2 parcelles/.test(lg) && /data-op="v1" onclick="_ferPrep\(this\.dataset\.op\)">Ne plus la proposer/.test(lg));
    P.win.annul.f();
    T('P4', '« Annuler » remet l’apport tel qu’il était (ni prep ni sacs)', !('prep' in ancien) && !('sacsParc' in ancien));
    P.etat.admin = false; P.api._ferPrep('v1');
    T('P5', 'hors administrateur, rien ne bouge', !('prep' in ancien));
    P.etat.admin = true; ancien.prep = true; P.api._ferPrep('v1');
    T('P6', '« Ne plus la proposer » : prep:false, la carte disparaît', ancien.prep === false && P.win._ferPreps().length === 0);
    P.win.SESSIONS.push({ ferOp: 'v1', statut: 'En cours' });
    T('P7', 'une session en cours née de l’apport : « session en cours » sur sa ligne', /session en cours/.test(P.api._ferPrepLigne(ancien, {}, true)));
    T('P8', '_ferPreps rend vide d’un coup quand aucun apport n’est préparé (le Tracteur se rend souvent)',
      (() => { const Q = mondePhyto(S); Q.win.INTRANTS.fertil.push({ id: 'z', parcs: ['A'] }); return Array.isArray(Q.win._ferPreps()) && Q.win._ferPreps().length === 0; })());
  });

  // 4. LA CARTE DU TRACTEUR
  essai('C', 'carte', () => {
    const P = mondePhyto(S); enregistrer(P);
    const W = mondeTracteur(S, P.win, { tract: true }), f = W.t.liste()[0];
    const h = W.t.html(f);
    T('C1', 'la carte dit « À démarrer », l’activité, le produit, la semaine prévue, 2 parcelles, 1,54 ha, 94 sacs de 25 kg',
      /\u00c0 d\u00e9marrer/.test(h) && /Amendement/.test(h) && /Terrafumur/.test(h) && /pr\u00e9vu semaine du 2026-11-02/.test(h) && /2 parcelles/.test(h) && /1,54 ha/.test(h) && h.includes('94' + NB + 'sacs de 25' + NB + 'kg'));
    T('C2', 'pour le tractoriste : « Démarrer », la valeur lue dans data-op', h.includes('onclick="_trFerDemarrer(this.closest(\'.trx\').dataset.op)">D\u00e9marrer</button>') && h.includes('data-op="' + f.id + '"'));
    const W2 = mondeTracteur(S, P.win, { adm: true });
    const h2 = W2.t.html(f);
    T('C3', 'pour les autres (l’administrateur non tractoriste compris) : pas de bouton, « Le tractoriste la démarre le jour venu »',
      !/_trFerDemarrer/.test(h2) && /Le tractoriste la d\u00e9marre le jour venu/.test(h2));
    const h3 = W.t.html(Object.assign({}, f, { prod: '<img src=x onerror=alert(1)>' }));
    T('C4', 'le nom du produit est échappé', h3.includes('&lt;img') && !h3.includes('<img'));
    const h4 = W.t.html(Object.assign({}, f, { demarree: true, reste: ['C'], sacs: 68 }));
    T('C5', 'après une session terminée avant la fin : « À reprendre », « 1 parcelle restante »', /\u00c0 reprendre/.test(h4) && /1 parcelle restante/.test(h4));
  });

  // 5. « DÉMARRER » ET LA CRÉATION DE LA SESSION
  essai('D', 'demarrer', () => {
    const P = mondePhyto(S), op = enregistrer(P);
    P.win.ACTIVITES[0].tracteurDefautId = 't1';   // un autre amendement a changé la machine de l'activité depuis
    const W = mondeTracteur(S, P.win, { tract: true, moi: 'L\u00e9a' });
    W.t.demarrer(op.id);
    T('D1', '« Démarrer » ouvre la feuille habituelle, sur l’activité Amendement', W.E.ouvertes === 1 && W.els['s-act'].value === 'Amendement' && W.E.act === 1);
    T('D2', 'la machine de l’amendement est reprise, et le conducteur est soi', W.E.trac === 't2' && W.E.cond === 'L\u00e9a');
    T('D3', 'la feuille est reliée à l’amendement (posé APRÈS l’ouverture, qui remet à zéro), l’encadré dit le produit, 2 parcelles, 94 sacs',
      W.t.op() === op.id && W.els['s-fer'].style.display === '' && /Terrafumur/.test(W.els['s-fer'].innerHTML) && /2 parcelles/.test(W.els['s-fer'].innerHTML) && W.els['s-fer'].innerHTML.includes('94' + NB + 'sacs'));
    W.t.save();
    const s = P.win.SESSIONS[P.win.SESSIONS.length - 1];
    T('D4', 'la session créée est reliée (ferOp) et ne garde que ses parcelles : B et D désactivées, l’arrachée hors jeu',
      !!s && s.ferOp === op.id && Array.isArray(s.parcellesSkip) && s.parcellesSkip.join() === 'B,D' && s.statut === 'En cours' && s.date === '2026-11-03');
    T('D5', 'après la création, la feuille n’est plus reliée', W.t.op() === null);
    T('D6', 'pendant la session, plus de carte « À démarrer »', W.t.liste().length === 0);
    // l'activité changée en route : la session n'est pas reliée
    const P2 = mondePhyto(S), op2 = enregistrer(P2); P2.win.ACTIVITES.push({ nom: 'Rognage', tracteurDefautId: 't1' });
    const W2 = mondeTracteur(S, P2.win, { tract: true });
    W2.t.demarrer(op2.id); W2.els['s-act'].value = 'Rognage'; W2.t.ban();
    T('D7', 'l’activité changée dans la feuille : l’encadré disparaît', W2.els['s-fer'].style.display === 'none');
    W2.t.save();
    const s2 = P2.win.SESSIONS[P2.win.SESSIONS.length - 1];
    T('D8', '… et la session créée n’est ni reliée ni limitée', !!s2 && s2.activite === 'Rognage' && !('ferOp' in s2) && !('parcellesSkip' in s2) && W2.t.op() === null);
    const W3 = mondeTracteur(S, P2.win, { adm: true });
    W3.t.demarrer(op2.id);
    T('D9', 'sans le rôle tractoriste : refusé, la feuille ne s’ouvre pas', W3.E.ouvertes === 0 && W3.E.toasts.some(m => /tractoristes/.test(m)));
    const W4 = mondeTracteur(S, P2.win, { tract: true });
    W4.t.demarrer('inconnu');
    T('D10', 'un amendement qui n’attend plus : dit, la page se redessine', W4.E.ouvertes === 0 && W4.E.toasts.some(m => /n\u2019attend plus/.test(m)) && W4.E.rendus === 1);
  });

  // 6. LE PARCOURS ENTIER — enregistrer, démarrer, cocher (FERTI-3), terminer avant la fin, reprendre, désactiver
  essai('J', 'parcours', () => {
    const P = mondePhyto(S), op = enregistrer(P);
    const W = mondeTracteur(S, P.win, { tract: true });
    W.t.demarrer(op.id); W.t.save();
    const s = P.win.SESSIONS[P.win.SESSIONS.length - 1];
    s.parcellesFaites.push({ nom: 'A' });
    P.api._ferSyncSessions();
    T('J1', 'cocher A : la tâche se valide au nom du conducteur (FERTI-3), le registre date A au jour de la session',
      P.win.JOURNAL.some(j => j.parcelle === 'A' && j.auTracteur && j.session === String(s.id)) && P.api._ferFaits()[op.id].A && P.api._ferFaits()[op.id].A.date === '2026-11-03');
    s.statut = 'Termin\u00e9';
    const r = W.t.liste();
    T('J2', 'terminée avant la fin : la carte revient, « À reprendre », avec C seule', r.length === 1 && r[0].reste.join() === 'C' && r[0].demarree === true && /\u00c0 reprendre/.test(W.t.html(r[0])));
    W.t.demarrer(op.id); W.t.save();
    const s2 = P.win.SESSIONS[P.win.SESSIONS.length - 1];
    T('J3', 'la seconde session ne garde que C', s2.ferOp === op.id && s2.parcellesSkip.join() === 'A,B,D');
    s2.parcellesSkip.push('C'); s2.statut = 'Termin\u00e9';
    T('J4', 'C désactivée exprès puis la session terminée : plus de carte', W.t.liste().length === 0);
  });

  // 6bis. LE JOUR DE CHAQUE PARCELLE — décision de Nico (30/10) : le jour où ELLE a été faite
  essai('Q', 'jour', () => {
    const P = mondePhyto(S), op = enregistrer(P);
    P.win.SESSIONS.push({ id: 'q1', activite: 'Amendement', date: '2026-11-03', conducteur: 'Marc', statut: 'En cours',
      parcellesFaites: [{ nom: 'A', d: '2026-11-04' }, { nom: 'C', t0: new Date(2026, 10, 5, 23, 50).getTime(), t1: new Date(2026, 10, 6, 0, 20).getTime() }] });
    const F = P.api._ferFaits()[op.id] || {};
    T('Q1', 'sans chrono : la parcelle cochée le lendemain est datée du lendemain, pas du jour où la session a démarré', F.A && F.A.date === '2026-11-04');
    T('Q2', 'avec le chrono : le jour où la parcelle a été démarrée (le début de sa mesure, même finie après minuit)', F.C && F.C.date === '2026-11-05');
    P.api._ferSyncSessions();
    T('Q3', 'la tâche validée au journal (FERTI-3) porte le même jour', P.win.JOURNAL.some(j => j.parcelle === 'A' && j.date === '2026-11-04' && j.auTracteur));
    const W = mondeTracteur(S, P.win, { tract: true, jour: '2026-11-04' });
    const s = { date: '2026-11-03', parcellesFaites: [{ nom: 'A' }, { nom: 'B', t0: 5 }, 'C'] };
    W.t.cocheJour(s, 'A'); W.t.cocheJour(s, 'B'); W.t.cocheJour(s, 'C');
    const W2 = mondeTracteur(S, P.win, { tract: true, jour: '2026-11-03' }), s2 = { date: '2026-11-03', parcellesFaites: [{ nom: 'A' }] };
    W2.t.cocheJour(s2, 'A');
    T('Q4', 'la coche porte son jour s’il diffère de celui de la session — rien le même jour, rien sur une parcelle mesurée au chrono',
      s.parcellesFaites[0].d === '2026-11-04' && !('d' in s.parcellesFaites[1]) && s.parcellesFaites[2] === 'C' && !('d' in s2.parcellesFaites[0]));
    T('Q5', 'le jour est posé par la coche simple et par la coche avec valeur',
      /s\.parcellesFaites\.push\(\{nom:nom\}\);\n  _trCocheJour\(s,nom\);/.test(fonction(S.tr, 'function toggleSessionParcelle(')) && /_trCocheJour\(s,_ocvNomParcelle\);/.test(fonction(S.tr, 'function confirmerValidationChamp(')));
  });

  // 7. LES SACS DANS LA FEUILLE D'UNE SESSION
  essai('L', 'lignes', () => {
    const P = mondePhyto(S), op = enregistrer(P);
    const W = mondeTracteur(S, P.win, { tract: true });
    T('L1', 'une session née de l’amendement : chaque ligne dit ses sacs entiers', W.t.ligne({ ferOp: op.id }, 'A') === '<div class="sdp-sacs">26' + NB + 'sacs</div>');
    T('L2', 'une autre session, ou un apport retiré : rien', W.t.ligne({}, 'A') === '' && W.t.ligne({ ferOp: 'parti' }, 'A') === '');
  });

  // 8. LES BRANCHEMENTS
  essai('B', 'branchements', () => {
    const iE = S.html.indexOf('<div class="trac-encours" id="trac-encours"></div>'), iP = S.html.indexOf('<div class="trac-prep" id="trac-prep"></div>'), iK = S.html.indexOf('<div class="mvu-kpis" id="trac-kpis">');
    T('B1', 'la page : la boîte des cartes sous la session en cours, avant les compteurs', iE > 0 && iP > iE && iP < iK);
    const ov = S.html.slice(S.html.indexOf('id="ovSession"'), S.html.indexOf('id="ovSession"') + 2500);
    T('B2', 'la feuille « Nouvelle session » porte l’encadré, caché d’office, avant l’activité',
      /<div class="mvencadre mvencadre-info" id="s-fer" style="display:none;[^"]*"><\/div><div class="fl">Activit\u00e9<\/div>/.test(ov));
    const ons = fonction(S.tr, 'function openNewSession(');
    T('B3', '« + » remet la feuille à zéro (ni reliée, ni encadré) avant de l’ouvrir',
      /_trFerOp=null; var _sf=document\.getElementById\('s-fer'\); if\(_sf\)\{ _sf\.style\.display='none'; _sf\.textContent=''; \}/.test(ons) && ons.indexOf('_trFerOp=null') < ons.indexOf("_openOv('ovSession')"));
    T('B4', 'l’encadré suit l’activité choisie', /_trFerBan\(\);/.test(fonction(S.tr, 'function onSessionActChange(')));
    T('B5', 'le Tracteur dessine les cartes dans leur boîte', S.tr.includes("var _prp=document.getElementById('trac-prep'); if(_prp) _prp.innerHTML=_trFerListe().map(_trFerHtml).join('');"));
    T('B6', 'la feuille d’une session : les sacs sous le nom de la parcelle', /_trFerSacsLigne\(s,p\.nom\)/.test(fonction(S.tr, 'function renderSDParcelles(')));
    T('B7', 'les gestes sont posés sur window (sinon le bouton ne fait rien, en silence)',
      S.tr.includes('window._trFerDemarrer=_trFerDemarrer;') && S.phy.includes('window._ferPrep=_ferPrep;') && S.phy.includes('window._ferPreps=function(){') && S.phy.includes('window._ferSacsParc=function(opId, nom){'));
    T('B8', 'la feuille de style : la boîte vide cachée, le liseré « à faire », les sacs',
      S.css.includes('.trac-prep:empty{display:none;}') && S.css.includes('.trx-prep{border-left-color:var(--attention,') && S.css.includes('.sdp-sacs{'));
    const tu = JSON.parse(S.tuto);
    T('B9', 'les deux gestes neufs sont exemptés de tuto, avec leur raison', !!(tu.exempts && tu.exempts._trFerDemarrer && tu.exempts._ferPrep));
    T('B10', 'l’aide du Tracteur et du Phyto le disent',
      S.utl.includes('une carte \\u00ab\\u00a0\\u00c0 d\\u00e9marrer\\u00a0\\u00bb attend sous la session en cours') && S.utl.includes('\\u00ab\\u00a0Pr\\u00e9parer la session tracteur\\u00a0\\u00bb'));
    T('B11', 'les guides le disent (Tracteur, Phyto)', S.g6.includes('<b>Un amendement à démarrer</b>') && S.g7.includes('une <b>session tracteur se prépare</b>'));
    T('B12', 'les nouveautés 10.49 l’annoncent à l’administrateur et au tractoriste',
      /export const WHATS_NEW = \[\n  \{ v: '10\.49', d: '2026-10-30', items: \[\n    \{ niv: 0, pour: \['admin'\], emoji: 'pousse', titre: 'L’amendement prépare sa session tracteur',[\s\S]{0,2400}?\{ niv: 0, pour: \['tractoriste'\], emoji: 'tracteur'/.test(S.wn));
  });
  return out;
}

const L0 = controles(SRC0);
if (!CONTRE) {
  console.log('\n\u2500\u2500 FERTI-9 \u2014 l\u2019amendement pr\u00e9pare sa session tracteur\n');
  let ok = 0, ko = 0;
  for (const [id, lib, c] of L0) { if (c) { ok++; console.log('  \x1b[32m\u2713\x1b[0m ' + id + ' \u00b7 ' + lib); } else { ko++; console.log('  \x1b[31m\u2717\x1b[0m ' + id + ' \u00b7 ' + lib); } }
  console.log('\n  mv-harnais-ferti9 : ' + ok + ' vertes, ' + ko + ' rouge' + (ko > 1 ? 's' : '') + '\n');
  process.exit(ko ? 1 : 0);
}
// Contre-épreuves : chaque défaut réinjecté DOIT faire rougir le contrôle qu'il vise.
const MUT = [
  ['la session en cours ne retire plus la carte', 'phy', "    if(liees.some(function(s){ return s.statut==='En cours'; })) return;\n", '', 'M3'],
  ['une parcelle désactivée exprès revient sur la carte', 'phy', ' && !retirees[n]; });', '; });', 'M4'],
  ['un apport non préparé fait une carte', 'phy', 'if(!op||op.prep!==true||!op.id) return;', 'if(!op||!op.id) return;', 'M2'],
  ['la session n’est plus limitée à ses parcelles', 'tr', '_sess.ferOp=_fx.id;\n      _sess.parcellesSkip=', '_sess.ferOp=_fx.id;\n      var _plusLimitee=', 'D4'],
  ['« + » ne remet plus la feuille à zéro', 'tr', "  _trFerOp=null; var _sf=document.getElementById('s-fer');", "  var _sf=document.getElementById('s-fer');", 'B3'],
  ['l’enregistrement ne prépare plus la session', 'phy', '    prep:true, sacsParc:sacsParc };', '    sacsParc:sacsParc };', 'S1'],
  ['les sacs ne sont plus ceux de l’étape 2', 'phy', 'sacsParc[p.nom]=_ferSacEntier(o.dose*_ferSurf(p)*1000/o.kg);', 'sacsParc[p.nom]=Math.round(o.dose*_ferSurf(p)*1000/o.kg);', 'S2'],
  ['la commande revient au total arrondi (on manque de sacs)', 'phy', 'o.sacsCmd=(o.dose&&o.kg)?o.SC:0;', 'o.sacsCmd=(o.dose&&o.kg)?Math.ceil(o.SA-1e-9):0;', 'S5'],
  ['le demi-sac revient', 'phy', 'function _ferSacEntier(x){ return Math.ceil(x-1e-9); }', 'function _ferSacEntier(x){ return Math.ceil(x*2-1e-9)/2; }', 'M9'],
  ['sans chrono, la parcelle reprend le jour de la session', 'phy', "    if(typeof x.d==='string'&&/^\\d{4}-\\d{2}-\\d{2}$/.test(x.d)) return x.d;\n", '', 'Q1'],
  ['avec le chrono, la fin de la mesure au lieu de son début', 'phy', "    if(typeof x.t0==='number'&&x.t0>0) return _ferIso(new Date(x.t0));\n", '', 'Q2'],
  ['la coche simple ne porte plus son jour', 'tr', '  _trCocheJour(s,nom);   // FERTI-9 (§499) : la parcelle porte le jour où elle est faite\n', '', 'Q5'],
  ['« Démarrer » montré à qui ne peut pas démarrer', 'tr', "var peut=(typeof isTractoriste==='function'&&isTractoriste()), n=f.reste.length;", 'var peut=true, n=f.reste.length;', 'C3'],
  ['l’activité changée en route : la session reste reliée', 'tr', 'if(_fx&&_fx.act===a){', 'if(_fx){', 'D8'],
  ['le lien relié avant l’ouverture de la feuille (qui l’efface)', 'tr', "  _trFerOp=f.id;   // après openNewSession, qui le remet à zéro\n  _trFerBan();\n", '', 'D3'],
];
console.log('\n\u2500\u2500 FERTI-9 \u2014 contre-\u00e9preuve\n');
let rates = 0;
for (const [lib, cle, avant, apres, cible] of MUT) {
  const n = SRC0[cle].split(avant).length - 1;
  if (n !== 1) { rates++; console.log('  \x1b[31m\u2717\x1b[0m ' + lib + ' \u2014 ancre trouv\u00e9e ' + n + ' fois'); continue; }
  const S = Object.assign({}, SRC0, { [cle]: SRC0[cle].replace(avant, apres) });
  const vu = controles(S).some(([id, , c]) => id === cible && !c);
  if (vu) console.log('  \x1b[32m\u2713\x1b[0m ' + lib + ' (' + cible + ' rougit)');
  else { rates++; console.log('  \x1b[31m\u2717\x1b[0m ' + lib + ' \u2014 non vu par ' + cible); }
}
console.log('\n  ' + (MUT.length - rates) + ' contre-\u00e9preuve(s) tenue(s) sur ' + MUT.length + '\n');
process.exit(rates ? 1 : 0);
