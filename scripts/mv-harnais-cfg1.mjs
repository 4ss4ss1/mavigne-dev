/* ───────────────────────────────────────────────────────
   HARNAIS — CFG-1 (§496) : LA CONFIGURATION REVIENT AVEC LA COPIE DU TÉLÉPHONE ; LA GARDE PARLE EN CLAIR
   Lancer :          node scripts/mv-harnais-cfg1.mjs
   Contre-épreuves : node scripts/mv-harnais-cfg1.mjs --contre

   POURQUOI IL EXISTE
   Vécu le 27/10, à l'ouverture de l'appli : « Erreur critique — fbSave config BLOQUE (anti-ecrasement) · cur=34 new=2 ».
   La chaîne : loadData ne remettait pas CONFIG en mémoire (seuls domaine_nom et saison_passages) ; un réglage enregistré
   avant la lecture du serveur partait d'une config VIDE ; rangé en file sur une saisie de config qui y attendait (sa
   PREMIÈRE base gardée), ce vide se lisait « 32 réglages supprimés » ; _mvFileParDessus le mettait en mémoire à l'arrivée
   du serveur, et l'envoi suivant était refusé par la garde. Ce harnais JOUE la chaîne avec les vraies fonctions —
   loadData (app.js, dans un bac à sable), _fbBasesDepuisAppareil, _queueSave, _mvFileParDessus, _mvFusion et
   _mvSauverFusion (firebase.js, transaction simulée) — et vérifie : ① la copie revient en mémoire et devient la base ;
   ② la chaîne de la file ne bloque plus et garde la saisie en attente ; ③ un réglage enregistré avant la lecture ne
   défait pas ce qu'un autre appareil a réglé ; ④ la fenêtre critique dit la garde en clair ; ⑤ les quatre endroits de
   la garde la passent ; ⑥ la liste joue ce fichier et sa contre-épreuve.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { app: lire('src/app.js'), fb: lire('src/firebase.js'), utils: lire('src/utils.js'), html: lire('index.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}') { p--; if (p === 0) break; } } return src.slice(i, k + 1); }
function instruction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); return src.slice(i, src.indexOf('};', i) + 2); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
const n = (o) => Object.keys(o || {}).length;

// ── Le moteur de file et de fusion de firebase.js, dans un contexte à part (transaction simulée) ──
function moteur(S) {
  const ctx = {
    window: {}, console, JSON, Object, Array, Math, Date, Promise, Error,
    _offlineQueue: {}, _offlineBases: {}, _fbBases: {}, _baseParcelles: null, _mvFileMemSeule: {},
    TENANT_ID: 't', localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
    _mvDemanderPersistance() {}, _mvFileDisqueKo() {}, _mvBasesFileEcrire() {}, _showOfflineQueueBadge() {}, _loadQueue() {},
    deepClone: clone, fbDocRef: (k) => ({ k }), db: {}, _fbClone: (k, v) => v, _mvTailleControle: () => 0, MV_LIMITE_DOC: 1e9,
    _mvErrLent: () => new Error('lent'), _mvFusionListe() { throw new Error('liste : hors du scénario'); },
    serveur: undefined, ecrit: undefined,
  };
  ctx.runTransaction = async (db, fn) => fn({ get: async () => ({ exists: () => ctx.serveur !== undefined, data: () => ({ value: clone(ctx.serveur) }) }), set: (ref, d) => { ctx.ecrit = d.value; } });
  const code = [instruction(S.fb, 'var _MV_FUSION_EXCLUES = {'), instruction(S.fb, 'var _MV_GUARD_FLOORS = {'), instruction(S.fb, 'var _MV_KEYLBL = {'),
    fonction(S.fb, 'function _mvKeyLbl('), fonction(S.fb, 'function _mvGardeEcran('),
    fonction(S.fb, 'function _mvIsObj('), fonction(S.fb, 'function _mvEgal('), fonction(S.fb, 'function _mvFusion('), fonction(S.fb, 'function _mvFusionObjet('),
    fonction(S.fb, 'function _mvDocSize('), fonction(S.fb, 'function _mvBaseFile('), fonction(S.fb, 'function _queueSave('),
    fonction(S.fb, 'function _mvFileParDessus('), fonction(S.fb, 'async function _mvSauverFusion('),
    fonction(S.fb, 'window._fbBasesDepuisAppareil = function'),
    'this.F = { _queueSave, _mvFileParDessus, _mvSauverFusion, _mvFusion, _mvGardeEcran };'].join('\n');
  vm.createContext(ctx); vm.runInContext(code, ctx);
  return ctx;
}
// ── loadData d'app.js, dans un bac à sable : chaque nom libre est lu dans `env` ──
function charger(S, snap, env) {
  const fil = (k) => (k === 'window' ? env.window : Object.prototype.hasOwnProperty.call(env, k) ? env[k] : (k in globalThis ? globalThis[k] : function () {}));
  const sb = new Proxy({}, { has: (o, k) => typeof k === 'string', get: (o, k) => (typeof k === 'string' ? fil(k) : undefined), set: (o, k, v) => { if (k === 'window') env.window = v; else env[k] = v; return true; } });
  const fn = new Function('sb', 'with (sb) {\n' + fonction(S.app, 'function loadData(') + '\n return loadData; }');
  Object.assign(env, { localStorage: { getItem: () => JSON.stringify(snap) }, _mvLsKey: () => 'mavigne_data_v1_t', _mvSnapCles: null,
    _MV_LISTES_OBJETS: {}, _MV_SOUS_LISTES: {}, _mvListeObjets: (k, v) => v, PARCELLES: [], JOURNAL: [], mvNomsJournal() {}, mvNomsParPid: () => ({}) });
  return fn(sb)();
}
const SERVEUR = {}; for (let i = 0; i < 33; i++) SERVEUR['r' + i] = i; SERVEUR.domaine_nom = 'Domaine';   // 34 réglages

async function jouer(S) {
  // ① la copie revient, et devient la base
  {
    const M = moteur(S), env = { CONFIG: {}, _mvKeyLoaded: {}, window: { _fbBasesDepuisAppareil: M.window._fbBasesDepuisAppareil } };
    const r = charger(S, { CONFIG: clone(SERVEUR) }, env);
    t('① loadData lit la copie (rend true)', r === true);
    t('① la configuration revient en mémoire : 34 réglages, la même dans CONFIG et window.CONFIG', n(env.CONFIG) === 34 && env.window.CONFIG === env.CONFIG);
    t('① la copie devient la base de fusion de « config »', n(M._fbBases.config) === 34 && M._fbBases.config !== env.CONFIG);
    const lu = { serveur: 1 }, env2 = { CONFIG: lu, _mvKeyLoaded: { config: true }, window: { CONFIG: lu, _fbBasesDepuisAppareil: M.window._fbBasesDepuisAppareil } };
    charger(S, { CONFIG: clone(SERVEUR) }, env2);
    t('① jamais par-dessus une config déjà lue du serveur', env2.CONFIG === lu && env2.window.CONFIG === lu);
    const M3 = moteur(S), env3 = { CONFIG: {}, _mvKeyLoaded: {}, window: { _fbBasesDepuisAppareil: M3.window._fbBasesDepuisAppareil } };
    charger(S, { CONFIG: {} }, env3);
    t('① une copie vide ne remplace rien et ne pose pas de base (l’envoi fera l’union)', n(env3.CONFIG) === 0 && M3._fbBases.config === undefined);
  }
  // ② la chaîne de la file, telle que vécue le 27/10
  {
    const M = moteur(S), F = M.F;
    const enFile = Object.assign(clone(SERVEUR), { r0: 'saisi hier' });           // une saisie de réglage restée en file…
    F._queueSave('config', clone(enFile), clone(SERVEUR));                          // …avec sa base : le serveur d'alors
    const env = { CONFIG: {}, _mvKeyLoaded: {}, window: { _fbBasesDepuisAppareil: M.window._fbBasesDepuisAppareil } };
    charger(S, { CONFIG: clone(enFile) }, env);                                     // le démarrage : la copie porte la saisie
    const ecrite = Object.assign(clone(env.CONFIG), { priorityMessage: 'a', priorityTask: 'b' });   // un réglage, avant la lecture
    F._queueSave('config', ecrite, M._fbBases.config);                              // en file (réseau lent) : la première base reste
    const memoire = F._mvFileParDessus('config', clone(SERVEUR));                   // le serveur arrive (inchangé)
    t('② à l’arrivée du serveur, la mémoire garde tous les réglages (34 + 2)', n(memoire) === 36);
    t('② …et la saisie qui attendait en file', memoire.r0 === 'saisi hier');
    M.serveur = clone(SERVEUR);
    const envoi = await F._mvSauverFusion('config', Object.assign(clone(memoire), { priorityMessage: 'c' }), clone(SERVEUR));
    t('② l’envoi suivant n’est pas bloqué par la garde (le « cur=34 new=2 » du 27/10)', !envoi.bloque);
    t('② ce qui part porte les 34 réglages, la saisie en attente et le nouveau', n(M.ecrit) === 36 && M.ecrit.r0 === 'saisi hier' && M.ecrit.priorityMessage === 'c');
  }
  // ③ un réglage enregistré avant la lecture ne défait pas celui d'un autre appareil
  {
    const M = moteur(S), F = M.F;
    const env = { CONFIG: {}, _mvKeyLoaded: {}, window: { _fbBasesDepuisAppareil: M.window._fbBasesDepuisAppareil } };
    charger(S, { CONFIG: clone(SERVEUR) }, env);
    M.serveur = Object.assign(clone(SERVEUR), { r5: 'réglé sur le PC' });         // changé ailleurs depuis la copie
    const envoi = await F._mvSauverFusion('config', Object.assign(clone(env.CONFIG), { photo: 7 }), M._fbBases.config);
    t('③ le réglage fait ailleurs reste (la copie n’écrase rien)', !envoi.bloque && M.ecrit && M.ecrit.r5 === 'réglé sur le PC');
    t('③ le réglage d’ici part, et rien d’autre ne bouge', M.ecrit && M.ecrit.photo === 7 && n(M.ecrit) === 35);
  }
  // ④ la fenêtre critique
  {
    const el = {}; ['mv-critical-overlay', 'mce-titre', 'mce-msg', 'mce-detail'].forEach((id) => { el[id] = { textContent: '', style: {} }; });
    const ctx = { document: { getElementById: (id) => el[id] || null } };
    vm.createContext(ctx); vm.runInContext(fonction(S.utils, 'function _showCriticalOverlay(') + '\nthis.f=_showCriticalOverlay;', ctx);
    const M = moteur(S), g = M.F._mvGardeEcran('config');
    ctx.f({ msg: 'fbSave config BLOQUE (anti-ecrasement)', detail: 'cur=34 new=2' }, g);
    t('④ la garde : un titre et une phrase en clair', el['mce-titre'].textContent === 'Enregistrement bloqué' && el['mce-msg'].textContent === g.ecran && el['mv-critical-overlay'].style.display === 'flex');
    t('④ le message technique passe sous « Détail technique »', el['mce-detail'].textContent === 'fbSave config BLOQUE (anti-ecrasement)\ncur=34 new=2');
    t('④ la phrase nomme le document, dit que rien n’est perdu et où la saisie attend', g.ecran.includes('«\u00a0Réglages\u00a0»') && g.ecran.includes('Rien n’est perdu') && g.ecran.includes('Réglages › Saisies non enregistrées'));
    ctx.f({ msg: 'Autre panne', detail: 'd' });
    t('④ une autre erreur critique : « Erreur critique » et son message, comme avant (le titre est remis)', el['mce-titre'].textContent === 'Erreur critique' && el['mce-msg'].textContent === 'Autre panne' && el['mce-detail'].textContent === 'd');
    t('④ logError passe ses options à la fenêtre', S.utils.includes("} else if(level === 'critical') {\n    _showCriticalOverlay(entry, opts);"));
  }
  // ⑤ les quatre endroits de la garde
  {
    const appels = S.fb.split('\n').filter((l) => l.includes('BLOQUE (anti-ecrasement)') && l.includes('logError('));
    t('⑤ quatre messages de garde, chacun avec sa phrase en clair (_mvGardeEcran)', appels.length === 4 && appels.every((l) => /_mvGardeEcran\((key|'parcelles')\)\)\);/.test(l)));
  }
  // ⑥ la page et la liste
  t('⑥ le titre de la fenêtre porte son id (mce-titre)', S.html.includes('<div id="mce-titre" style="color:#C0392B;'));
  t('⑥ la liste joue ce fichier et sa contre-épreuve', S.liste.includes("['node scripts/mv-harnais-cfg1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-cfg1.mjs --contre'],"));
}

if (!CONTRE) {
  try { await jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { await jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['loadData ne remet plus la config (le défaut du 27/10)', m('app', "      CONFIG = d.CONFIG; window.CONFIG = CONFIG;\n", '')],
    ['la copie revient sans devenir la base', m('app', "        try { window._fbBasesDepuisAppareil({ config: CONFIG }); }", '        try { }')],
    ['la copie passe par-dessus une config lue du serveur', m('app', "Object.keys(d.CONFIG).length && !_mvKeyLoaded.config) {", 'Object.keys(d.CONFIG).length) {')],
    ['une copie vide remplace la mémoire', m('app', "Object.keys(d.CONFIG).length && !_mvKeyLoaded.config) {", '!_mvKeyLoaded.config) {')],
    ['la fenêtre ignore la phrase en clair', m('utils', 'if(msgEl) msgEl.textContent = o.ecran || entry.msg;', 'if(msgEl) msgEl.textContent = entry.msg;')],
    ['le titre n’est plus remis', m('utils', "if(tEl) tEl.textContent = o.titre || 'Erreur critique';", 'if(tEl && o.titre) tEl.textContent = o.titre;')],
    ['une garde sans phrase en clair (la file)', m('fb', "detail: detail || '' }, _mvGardeEcran(key)));", "detail: detail || '' }));")],
    ['logError ne passe plus ses options', m('utils', '_showCriticalOverlay(entry, opts);', '_showCriticalOverlay(entry);')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-cfg1.mjs").join('mv-harnais-cfgZ.mjs') })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { await jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
