/* ───────────────────────────────────────────────────────
   HARNAIS — ANNULER-1 (§471) : ANNULER PLUTÔT QUE CONFIRMER (docs/maquettes/maquette-ux-v1.html, partie 4)
   Lancer :          node scripts/mv-harnais-annuler1.mjs
   Contre-épreuves : node scripts/mv-harnais-annuler1.mjs --contre

   POURQUOI IL EXISTE
   Un « Annuler » qui ne remet pas exactement l'état d'avant est pire qu'une confirmation : on croit avoir réparé, on a perdu.
   Ce harnais JOUE les vraies fonctions, extraites des sources : le toast commun (six secondes, la barre, un seul appel du geste
   inverse), Dévalider puis Annuler (une tâche simple, et un passage d'une tâche à étapes — l'objet copié, pas sa référence),
   le retrait d'un lot de fûts puis Annuler (sa place, son identifiant, pas de doublon au double appui, plus de fenêtre), et les
   gestes de sélection du Planning puis Annuler (un jour effacé revient, un jour posé repart, l'enregistrement sans second toast).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { uti: lire('src/utils.js'), app: lire('src/app.js'), rsv: lire('src/reserve.js'), pla: lire('src/planning.js'), css: lire('src/styles.css'), html: lire('index.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
const copie = (x) => JSON.parse(JSON.stringify(x));
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function toast(S) {
  const ms = /export const MV_ANNULER_MS = (\d+);/.exec(S.uti); const cls = new Set(), delais = [];
  const el = { t: { classList: { add: (...a) => a.forEach((x) => cls.add(x)), remove: (...a) => a.forEach((x) => cls.delete(x)), contains: (x) => cls.has(x) }, offsetWidth: 1 }, m: { textContent: '' }, u: { style: {}, onclick: null } };
  const ctx = { MV_ANNULER_MS: ms ? +ms[1] : 0, _mvAnnFn: null, _mvAnnTimer: null, document: { getElementById: (id) => ({ 'pv-toast': el.t, 'pv-toast-msg': el.m, 'pv-toast-undo': el.u }[id] || null) }, navigator: {}, window: {}, showToast() {},
    setTimeout: (f, d) => { delais.push(d); return 1; }, clearTimeout() {} };
  vm.createContext(ctx); vm.runInContext(fonction(S.uti, 'function showToastAnnuler(') + '\n' + fonction(S.uti, 'function _mvAnnCacher(') + '\nthis.f = showToastAnnuler;', ctx);
  return { ctx, el, cls, delais };
}
function parcelles(S, taches, step) {
  const P = [{ nom: 'Les Crais', taches }], appels = [], dit = [];
  const ctx = { PARCELLES: P, pTacheFilter: 'Rel', pCurStep: step || 1, canWrite: () => true, _pvType: () => (typeof taches.Rel === 'object' ? 'etapes' : 'simple'), _pvPrefix: () => 'r', _pvStepLabel: () => 'passage ',
    recalcTravaux() {}, saveData: (k) => appels.push(k), renderParcelles() {}, computePStats() {}, navigator: {}, tNom: (x) => x, showToast: (m) => dit.push(m), showToastAnnuler: (m, f) => { ctx.dernier = { m, f }; } };
  vm.createContext(ctx); vm.runInContext(fonction(S.app, 'function pQuickUndo(') + '\n' + fonction(S.app, 'function _pvRemettre(') + '\nthis.undo = pQuickUndo;', ctx);
  return { ctx, P, appels, dit };
}
function reserve(S) {
  const futs = [{ id: 'a', ref: 'A', qte: 2 }, { id: 'b', ref: 'B', qte: 3 }, { id: 'c', ref: 'C', qte: 1 }], sauv = [], conf = [];
  const ctx = { INTRANTS: { futs }, isAdmin: () => true, saveIntrants: () => sauv.push(1), _rsvRenderBody() {}, showToast() {} };
  ctx.window = { openConfirmDel: () => conf.push(1), showToastAnnuler: (m, f) => { ctx.dernier = { m, f }; } };
  vm.createContext(ctx); vm.runInContext(fonction(S.rsv, 'function _rsvDelFut(') + '\nthis.del = _rsvDelFut;', ctx);
  return { ctx, sauv, conf };
}
function planning(S, ENT, keys) {
  const msgs = [];
  const ctx = { PLANNING_ENTRIES: ENT, planMonth: 9, isAdmin: () => true, _planSelKeys: () => keys, _planSelParse: (k) => ({ nom: k.split('|')[0], d: +k.split('|')[1] }), _pEntYear: (n) => ENT[n],
    _planInContract: () => true, _planPlanned: () => 7, _planPlId: (m) => m.nom, _pEntDay: (n, m, d) => ENT[n][m] && ENT[n][m][d], _pEntPose: (n, m, d, o) => { (ENT[n][m] = ENT[n][m] || {})[d] = o; return true; },
    planSelClear() {}, _pl2Refresh() {} };
  ctx.window = { MEMBRES: [{ nom: 'Jean' }], fbSaveToast: (o, m) => msgs.push(m), showToastAnnuler: (m, f) => { ctx.dernier = { m, f }; } };
  vm.createContext(ctx); vm.runInContext(['function planSelAction(', 'function _planInstantane(', 'function _planRemettre(', 'function _planApplySimple('].map((d) => fonction(S.pla, d)).join('\n') + '\nthis.agir = planSelAction;', ctx);
  return { ctx, msgs };
}
function jouer(S) {
  const A = toast(S); let n = 0; A.ctx.f('Taille validée · Les Crais', () => { n++; });
  t('① le toast commun : le message, « Annuler » visible, la barre (mv-ann), six secondes', A.el.m.textContent === 'Taille validée · Les Crais' && A.el.u.style.display === '' && A.cls.has('show') && A.cls.has('mv-ann') && A.delais[0] === 6000);
  A.el.u.onclick(); A.el.u.onclick();
  t('① Annuler appelle le geste inverse UNE fois, et le toast se cache', n === 1 && !A.cls.has('show') && !A.cls.has('mv-ann'));
  const B = toast(S); B.ctx.f('Enregistré', null);
  t('① sans geste inverse : pas de bouton, pas de barre, 2,2 s', B.el.u.style.display === 'none' && !B.cls.has('mv-ann') && B.delais[0] === 2200);
  t('① le dessin : « Annuler » à 40 px, la barre en six secondes, rien d’animé pour qui réduit les animations ; le toast se lit (role="status")',
    S.css.includes('min-height:40px;}') && S.css.includes('#pv-toast.mv-ann::after{') && S.css.includes('animation:mvAnnBarre 6s linear forwards') && S.css.includes('@media (prefers-reduced-motion: reduce){ #pv-toast.mv-ann::after{animation:none;} }')
    && S.html.includes('<div id="pv-toast" role="status" aria-live="polite">'));
  t('① Parcelles passe par le toast commun (Valider garde son Annuler, à six secondes)', S.app.includes("function _pvToast(msg,undoFn){ showToastAnnuler(msg,undoFn||null); }"));
  const C = parcelles(S, { Rel: 'Validé' }); C.ctx.undo('Les Crais');
  const apres = C.P[0].taches.Rel, sauve = C.appels.join(','); C.appels.length = 0; C.ctx.dernier.f();
  t('② Dévalider (« Fait ») : remis en cours, puis Annuler remet « Validé » et l’enregistre', apres === 'En cours' && sauve === 'parcelles,travaux' && C.P[0].taches.Rel === 'Validé' && C.appels.join(',') === 'parcelles,travaux' && /remis comme avant/.test(C.dit.join('|')));
  const orig = { r1: 'Validé', r2: 'Validé' }, D = parcelles(S, { Rel: copie(orig) }, 2); D.ctx.undo('Les Crais');
  const mid = copie(D.P[0].taches.Rel); D.ctx.dernier.f();
  t('② une tâche à étapes : le passage 2 remis, puis Annuler rend l’objet d’avant (une copie, pas la référence modifiée)', mid.r2 === 'Non démarré' && JSON.stringify(D.P[0].taches.Rel) === JSON.stringify(orig));
  const E = reserve(S); E.ctx.del('b');
  const ids = E.ctx.INTRANTS.futs.map((x) => x.id).join('');
  E.ctx.dernier.f(); const ids2 = E.ctx.INTRANTS.futs.map((x) => x.id).join(''); E.ctx.dernier.f();
  t('③ un lot de fûts : retiré tout de suite, SANS fenêtre ; Annuler le remet à sa place ; un second Annuler ne le double pas',
    ids === 'ac' && E.conf.length === 0 && E.sauv.length === 2 && ids2 === 'abc' && E.ctx.INTRANTS.futs.map((x) => x.id).join('') === 'abc' && /^Lot retiré · B — 3 fûts$/.test(E.ctx.dernier.m));
  const ENT = { Jean: { 9: { 12: { type: 'cp', comment: 'x' } } } }, F = planning(S, ENT, ['Jean|12', 'Jean|13']); F.ctx.agir('clr');
  const efface = !(12 in ENT.Jean[9]), silencieux = F.msgs[0] === ''; F.ctx.dernier.f();
  t('④ Planning, Effacer : le jour part, enregistré sans second toast ; Annuler le remet tel quel, le jour vide reste vide',
    efface && silencieux && /^Saisies effac/.test(F.ctx.dernier.m) && JSON.stringify(ENT.Jean[9][12]) === JSON.stringify({ type: 'cp', comment: 'x' }) && !(13 in ENT.Jean[9]) && /Remis comme avant · 1 j/.test(F.msgs[1]));
  const ENT2 = { Jean: { 9: {} } }, G = planning(S, ENT2, ['Jean|14']); G.ctx.agir('rec');
  const pose = ENT2.Jean[9][14] && ENT2.Jean[9][14].type === 'recup'; G.ctx.dernier.f();
  t('④ Planning, Récup posée sur un jour vide : Annuler retire ce que le geste a posé', pose && !(14 in ENT2.Jean[9]));
  t('⑤ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-annuler1.mjs'") > 0 && S.liste.indexOf("mv-harnais-annuler1.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['le toast reste 4,5 s', m('uti', 'export const MV_ANNULER_MS = 6000;', 'export const MV_ANNULER_MS = 4500;')],
    ['la barre ne part plus', m('uti', "t.classList.add('show'); if (fn) t.classList.add('mv-ann');", "t.classList.add('show');")],
    ['Annuler appelé deux fois au double appui', m('uti', 'var f = _mvAnnFn; _mvAnnFn = null; _mvAnnCacher();', 'var f = annuler; _mvAnnCacher();')],
    ['Dévalider garde la référence au lieu d’une copie', m('app', "var avant=(p.taches[task]&&typeof p.taches[task]==='object')?JSON.parse(JSON.stringify(p.taches[task])):p.taches[task];", 'var avant=p.taches[task];')],
    ['Annuler de Dévalider n’enregistre plus', m('app', "recalcTravaux(task);\n  saveData('parcelles');saveData('travaux');\n  renderParcelles();computePStats();\n  showToast(tNom(task)+' · '+nom+' : remis comme avant'", "recalcTravaux(task);\n  renderParcelles();computePStats();\n  showToast(tNom(task)+' · '+nom+' : remis comme avant'")],
    ['le lot revient en fin de liste', m('rsv', 'INTRANTS.futs.splice(Math.min(i,INTRANTS.futs.length),0,f);', 'INTRANTS.futs.push(f);')],
    ['un second Annuler double le lot', m('rsv', "if(INTRANTS.futs.some(function(x){return x.id===id;})) return;   // déjà revenu (un autre appareil, un double appui)", '')],
    ['la Réserve perd son Annuler', m('rsv', "window.showToastAnnuler('Lot retiré · '+label, annuler)", "showToast('Lot retiré','#C0392B')")],
    ['la photo du Planning est prise après le geste', m('pla', "var avant=_planInstantane(keys);   // ★ ANNULER-1 (§471) : les jours tels qu'ils étaient, pour Annuler\n  var r=_planApplySimple(keys,kind,keys.length===1);", "var r=_planApplySimple(keys,kind,keys.length===1);\n  var avant=_planInstantane(keys);")],
    ['le Planning dit deux toasts', m('pla', "window.fbSaveToast({planning_entries:PLANNING_ENTRIES},'');", "window.fbSaveToast({planning_entries:PLANNING_ENTRIES},dit,'#3D6B27');")],
    ['Annuler laisse la récup posée sur un jour vide', m('pla', 'if(x.e===undefined){ if(yb[x.m]&&yb[x.m][x.d]!==undefined){ delete yb[x.m][x.d]; n++; } }', 'if(x.e===undefined){ }')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-annuler1.mjs'").join("mv-harnais-annulerZ.mjs'") })],
  ];
  // la base d'abord : une contre-épreuve sur une base rouge mordrait à tous les coups, pour rien.
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
