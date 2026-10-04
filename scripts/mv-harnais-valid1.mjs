// HARNAIS — VALID-1 + LOGIN-1 (§242) : « Valider » n'attend plus la météo ; sans réseau, la connexion dit la vérité.
//   node scripts/mv-harnais-valid1.mjs           → doit être vert
//   node scripts/mv-harnais-valid1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions extraites de src/app.js (confirmValidation, saveJournalEntry, pQuickValidate,
// fetchMeteoMoyenne, _mvMeteoApres, _findDebutTache, confirmLogin, _loginErreur), branchées les unes sur les autres
// dans un contexte vm, et le VRAI public/sw.js (son gestionnaire fetch, branche météo). Aucun moteur inventé.
// Prouvé dans Chromium AVANT le lot (§241) : météo sans réponse → feuille ouverte et rien d'écrit à 30 s ;
// hors réseau → « Mot de passe incorrect. » sur appCheck/fetch-network-error.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const APP = lire('src/app.js'), SW = lire('public/sw.js');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) {
  const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig);
  if (src.indexOf(sig, i + 1) >= 0) throw new Error('en double : ' + sig);
  return src.slice(i, src.indexOf('\n}\n', i) + 3);
}
const ligne = (src, re) => { const m = src.match(re); if (!m) throw new Error('introuvable : ' + re); return m[0]; };
const BASE = {
  delai: ligne(APP, /var _MV_METEO_DELAI = \d+;\n/),
  meteo: sansCom(fn(APP, 'async function fetchMeteoMoyenne(dateDebut, dateFin){')),
  apres: sansCom(fn(APP, 'function _mvMeteoApres(id, dateDebut, dateFin){')),
  debut: sansCom(fn(APP, 'function _findDebutTache(parcelle, tache, dateRef){')),
  valid: sansCom(fn(APP, 'async function confirmValidation(){')),
  jour: sansCom(fn(APP, 'async function saveJournalEntry(){')),
  rapide: sansCom(fn(APP, 'function pQuickValidate(nom,evt){')),
  login: sansCom(fn(APP, 'async function confirmLogin(){')),
  erreur: sansCom(fn(APP, 'function _loginErreur(msg, relancer){')),
  sw: SW,
};
const vide = async (n = 8) => { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };
const DAILY = { daily: { time: ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'], temperature_2m_mean: [12, 13, 14, 15],
  temperature_2m_min: [8, 9, 10, 11], temperature_2m_max: [16, 17, 18, 19], windspeed_10m_max: [10, 12, 14, 16],
  precipitation_sum: [0, 1, 0, 2], weathercode: [3, 3, 61, 3] } };
function El(id) {
  const el = { id, value: '', textContent: '', disabled: false, style: {}, children: [], cls: new Set(['open']), retire: [] };
  el.classList = { add: c => el.cls.add(c), remove: c => { el.cls.delete(c); el.retire.push(c); }, contains: c => el.cls.has(c), toggle() {} };
  el.appendChild = c => { el.children.push(c); return c; }; el.focus = () => {}; el.closest = () => null;
  el.setAttribute = () => {}; el.getAttribute = () => null;
  return el;
}
// Un domaine : quatre parcelles, chacune « En cours » sur le Palissage depuis le 1er octobre (même période).
function monde(B, o) {
  o = o || {};
  const els = {}, minuteries = [], appels = { fetch: [], save: [], avale: [] };
  let libere = null;
  const fetchPendante = (url, opt) => { appels.fetch.push(url);
    return new Promise((res, rej) => { if (opt && opt.signal) opt.signal.addEventListener('abort', () => rej(new Error('AbortError'))); }); };
  const fetchOk = url => { appels.fetch.push(url); return Promise.resolve({ json: () => Promise.resolve(DAILY) }); };
  const fetchDiff = url => { appels.fetch.push(url); return new Promise(r => { libere = () => r({ json: () => Promise.resolve(DAILY) }); }); };
  const P = ['P1', 'P2', 'P3', 'P4', 'P5'];
  const ctx = {
    console: { log() {}, warn() {}, error() {} }, AbortController,
    setTimeout: (f, ms) => { minuteries.push({ f, ms }); return minuteries.length; }, clearTimeout() {},
    navigator: { onLine: !o.horsLigne, vibrate() {} },
    document: { getElementById: id => els[id] || (els[id] = El(id)), createElement: () => El('cree'), querySelector: () => null },
    fetch: o.fetch === 'ok' ? fetchOk : o.fetch === 'diff' ? fetchDiff : fetchPendante,
    PARCELLES: P.map(nom => ({ nom, surface: 1, statut: 'Actif', taches: { Palissage: 'En cours' } })),
    JOURNAL: P.map((nom, i) => ({ id: 'enc' + i, date: '2026-10-01', parcelle: nom, tache: 'Palissage', qui: 'Nico', statut: 'En cours', equipe: false, membresEquipe: [], ts_debut: 1 })),
    MEMBRES: [{ nom: 'Nico', statut: 'Actif', roles: ['admin'] }],
    currentUser: { nom: 'Nico', roles: ['admin'] }, meteoData: null,
    _validParcelle: null, _validTache: null, _validBtn: null, pTacheFilter: 'Palissage', pCurStep: 1, _loginVoirTous: false,
    _mvToday: () => '2026-10-04', getDomaineGeo: () => ({ lat: 47.22, lng: 4.97 }), wmoIcone: () => 'nuage', wmoDesc: () => 'Nuageux',
    _mvValidBlocked: () => false, _mvPrepGesteRefuse: () => false, _mvdsSnap() {}, _mvdsOpen() {}, _getSelectedMembres: () => [],
    _mvQuiHors: () => false, showToast() {}, _vp_tDef: () => null, _mvEqApplique: e => e, recalcTravaux() {}, injectMeteoIfNeeded() {},
    saveData: k => appels.save.push(k), renderParcelles() {}, computePStats() {}, renderJournalList() {}, renderHome() {},
    isAdmin: () => false, _arrProposer: () => false, _jeEtapeLue: () => null, _arrPose() {}, _mvOnActiveSaison: () => true,
    _arrActif: () => false, openDP() {}, _mvArrRefus: () => false, canWrite: () => true, _pvType: () => 'simple', _pvEffPlan: () => 1,
    _eqtFor: () => [], _eqtHors: () => false, tNom: t => t, _pvPrefix: () => 'p', _computeAutoNiv: () => [],
    getTacheStatut: (p, t) => (p.taches || {})[t], _pvStepLabel: () => '', _pvToast() {}, pQuickUndoEntry() {}, _pvCurDone: () => false,
    _loginAwaitEmail: async () => 'compte.test', _mvLoadClaims: async () => {}, _mvMustChangePwd: () => false, _mvShowFirstPwd() {},
    _loginMemEcrire() {}, _mvSessArm() {}, _mvApresEntree() {},
    firebase: { auth: () => ({ signInWithEmailAndPassword: async () => { throw { code: o.code || 'auth/invalid-credential' }; } }) },
  };
  ctx.window = ctx;
  ctx._saisonForDate = d => (d >= '2026-03-16' && d <= '2026-10-31') ? 'Printemps 2026' : 'Hiver';
  ctx._mvAvale = (e, ou) => appels.avale.push(ou + ' : ' + ((e && e.message) || e));
  ctx.loginPendingIdx = 0;
  vm.createContext(ctx);
  vm.runInContext([B.delai, B.meteo, B.apres, B.debut, B.valid, B.jour, B.rapide, B.login, B.erreur].join('\n'), ctx);
  return { ctx, els, minuteries, appels, libere: () => libere && libere() };
}
const valide = (c, parc) => c.ctx.JOURNAL.find(j => j.parcelle === parc && j.statut === 'Validé' && j.tache === 'Palissage');
const nSave = (c, k) => c.appels.save.filter(x => x === k).length;
function feuille(c, parc) { c.ctx._validParcelle = parc; c.ctx._validTache = 'Palissage'; c.els['vp-equipe-val'] = El('vp-equipe-val');
  c.els['vp-equipe-val'].value = 'non'; c.els['vp-date'] = El('vp-date'); c.els['vp-date'].value = '2026-10-04'; c.els.ovValidation = El('ovValidation'); }
function formulaire(c, parc, statut) {
  for (const [id, v] of [['je-parcelle', parc], ['je-tache', 'Palissage'], ['je-date', '2026-10-04'], ['je-statut', statut], ['je-equipe-val', 'non']]) { c.els[id] = El(id); c.els[id].value = v; }
  c.els.ovJournalEntry = El('ovJournalEntry');
}
// Le service worker, chargé tel quel : son gestionnaire fetch reçoit une requête Open-Meteo.
async function swMeteo(B, o) {
  const ecoute = {}, minuteries = [];
  const cache = { put: async () => {}, match: async () => undefined, keys: async () => [], addAll: async () => {}, delete: async () => true };
  const ctx = {
    self: { addEventListener: (t, f) => { ecoute[t] = f; }, location: { hostname: 'mavigneapp.fr' }, skipWaiting() {}, clients: { claim() {}, matchAll: async () => [] }, registration: {} },
    caches: { open: async () => cache, match: async () => o.copie, keys: async () => [], delete: async () => true },
    fetch: () => new Promise(() => {}), Response, Headers, URL, Promise, console: { log() {}, warn() {}, error() {} },
    setTimeout: (f, ms) => { minuteries.push({ f, ms }); return minuteries.length; }, clearTimeout() {},
  };
  vm.createContext(ctx); vm.runInContext(B.sw, ctx);
  if (typeof ecoute.fetch !== 'function') throw new Error('sw.js : pas de gestionnaire fetch');
  const ev = { request: { url: 'https://api.open-meteo.com/v1/forecast?latitude=47.2200', method: 'GET', mode: 'cors' }, respondWith(p) { this.p = p; } };
  ecoute.fetch(ev);
  if (!ev.p) return { etat: 'non servie', minuteries };
  const delai = minuteries.find(t => t.ms > 0);
  if (delai) delai.f();
  const etat = await Promise.race([ev.p.then(r => r.status), vide(12).then(() => 'pendante')]);
  return { etat, ms: delai ? delai.ms : null };
}
async function suite(B) {
  const out = [], T = (n, ok) => out.push([n, !!ok]);
  // ── VALID-1 : la feuille de validation ──
  let c = monde(B, { fetch: 'pendante' }); feuille(c, 'P1');
  c.ctx.confirmValidation(); await vide();
  T('météo sans réponse : la validation est écrite tout de suite', !!valide(c, 'P1'));
  T('… la feuille se ferme tout de suite', c.els.ovValidation.retire.includes('open'));
  T('… le journal et les parcelles partent à l’enregistrement', nSave(c, 'journal') === 1 && nSave(c, 'parcelles') === 1);
  T('… la tâche est « Validé »', c.ctx.PARCELLES[0].taches.Palissage === 'Validé');
  T('… l’appel météo est bien parti (du 1er au 4 octobre)', c.appels.fetch.length === 1 && /start_date=2026-10-01&end_date=2026-10-04/.test(c.appels.fetch[0]));
  const mn = c.minuteries.find(t => t.ms > 0);
  T('l’appel météo est borné (≤ 8 s)', !!mn && mn.ms <= 8000);
  let res = 'pendante'; c.ctx.fetchMeteoMoyenne('2026-10-01', '2026-10-04').then(v => { res = v; });
  c.minuteries.forEach(t => t.f()); await vide();
  T('au bout de la borne, la météo rend « rien » au lieu d’attendre', res === null);
  T('… et l’entrée vit sans météo, sans second enregistrement', !valide(c, 'P1').meteo_snapshot && nSave(c, 'journal') === 1);
  c = monde(B, { fetch: 'ok' }); feuille(c, 'P2');
  c.ctx.confirmValidation(); await vide();
  T('météo qui répond : l’entrée est complétée', !!(valide(c, 'P2') && valide(c, 'P2').meteo_snapshot && valide(c, 'P2').meteo_snapshot.temp_moy === 13.5));
  T('… puis enregistrée une seconde fois', nSave(c, 'journal') === 2);
  c = monde(B, { fetch: 'diff' }); feuille(c, 'P3');
  c.ctx.confirmValidation(); await vide();
  const id3 = valide(c, 'P3').id;
  c.ctx.JOURNAL = c.ctx.JOURNAL.map(e => Object.assign({}, e));        // une synchronisation remplace le tableau
  c.libere(); await vide();
  T('journal remplacé entre-temps : la météo atterrit dans le journal du moment', !!c.ctx.JOURNAL.find(e => e.id === id3 && e.meteo_snapshot));
  c = monde(B, { fetch: 'diff' }); feuille(c, 'P4');
  c.ctx.confirmValidation(); await vide();
  const id4 = valide(c, 'P4').id; c.ctx.JOURNAL = c.ctx.JOURNAL.filter(e => e.id !== id4);   // annulée entre-temps
  const av = nSave(c, 'journal'); c.libere(); await vide();
  T('validation annulée entre-temps : rien n’est réécrit', nSave(c, 'journal') === av);
  // ── VALID-1 : le formulaire du journal ──
  c = monde(B, { fetch: 'pendante' }); formulaire(c, 'P1', 'Validé');
  c.ctx.saveJournalEntry(); await vide();
  T('journal, statut « Validé », météo sans réponse : l’entrée est écrite tout de suite', c.ctx.JOURNAL[0].statut === 'Validé' && c.ctx.JOURNAL[0].parcelle === 'P1');
  T('… le formulaire se ferme et le journal part', c.els.ovJournalEntry.retire.includes('open') && nSave(c, 'journal') >= 1);
  T('… et la météo est quand même demandée', c.appels.fetch.length === 1);
  c = monde(B, { fetch: 'pendante' }); formulaire(c, 'P2', 'En cours');
  c.ctx.saveJournalEntry(); await vide();
  T('journal, statut « En cours » : aucun appel météo', c.appels.fetch.length === 0 && c.ctx.JOURNAL[0].statut === 'En cours');
  // ── VALID-1 : le bouton « Valider » de la carte ──
  c = monde(B, { fetch: 'diff' });
  c.ctx.pQuickValidate('P5', null); await vide();
  const q = c.ctx.JOURNAL[0];
  T('carte de parcelle : la validation est écrite tout de suite', q.parcelle === 'P5' && q.statut === 'Validé' && nSave(c, 'journal') === 1);
  c.ctx.JOURNAL = c.ctx.JOURNAL.map(e => Object.assign({}, e)); c.libere(); await vide();
  T('carte de parcelle, journal remplacé : la météo atterrit dans le journal du moment', !!c.ctx.JOURNAL.find(e => e.id === q.id && e.meteo_snapshot));
  T('plus aucun « await fetchMeteoMoyenne » dans src/', fs.readdirSync(path.join(R, 'src')).filter(f => f.endsWith('.js'))
    .every(f => !/await\s+fetchMeteoMoyenne\s*\(/.test(sansCom(lire('src/' + f))))) ;
  // ── VALID-1 : le service worker ──
  const s1 = await swMeteo(B, {});
  T('service worker, météo sans réponse ni copie : l’échec net arrive à la borne (503)', s1.etat === 503);
  T('… et la borne du service worker est ≤ 8 s', s1.ms !== null && s1.ms <= 8000);
  const copie = new Response('{}', { status: 200, headers: { 'x-mv-cached-at': String(Date.now()) } });
  const s2 = await swMeteo(B, { copie });
  T('service worker, météo sans réponse mais copie récente : la copie est servie', s2.etat === 200);
  // ── LOGIN-1 : le message de connexion ──
  const msg = async (code, horsLigne) => { const m = monde(B, { code, horsLigne }); m.els['login-pwd-input'] = El('login-pwd-input');
    m.els['login-pwd-input'].value = 'secret'; m.els['login-pwd-btn'] = El('login-pwd-btn'); m.els['login-pwd-error'] = El('login-pwd-error');
    await m.ctx.confirmLogin(); await vide();
    return { t: m.els['login-pwd-error'].textContent, relance: m.els['login-pwd-error'].children.length > 0, btn: m.els['login-pwd-btn'] }; };
  let r = await msg('appCheck/fetch-network-error', true);
  T('hors réseau, App Check en échec : « Pas de connexion réseau », plus « Mot de passe incorrect »', /^Pas de connexion réseau/.test(r.t) && !/Mot de passe/.test(r.t));
  T('… avec ce qu’il faut faire (réessayer quand le téléphone capte)', /réessayez quand le téléphone capte/.test(r.t));
  r = await msg('appCheck/fetch-network-error', false);
  T('en ligne, App Check en échec : « Le serveur ne répond pas » et le bouton pour relancer', /^Le serveur ne répond pas/.test(r.t) && r.relance);
  r = await msg('auth/network-request-failed', true);
  T('hors réseau, requête en échec : « Pas de connexion réseau »', /^Pas de connexion réseau/.test(r.t));
  r = await msg('auth/internal-error', true);
  T('hors réseau, tout autre code : jamais le mot de passe', /^Pas de connexion réseau/.test(r.t));
  r = await msg('auth/network-request-failed', false);
  T('en ligne, requête en échec : « Le serveur ne répond pas » (inchangé)', /^Le serveur ne répond pas/.test(r.t) && r.relance);
  r = await msg('auth/invalid-credential', false);
  T('un vrai mauvais mot de passe dit toujours « Mot de passe incorrect. »', r.t === 'Mot de passe incorrect.' && !r.relance);
  T('… et le bouton redevient « Se connecter »', r.btn.textContent === 'Se connecter' && r.btn.disabled === false);
  r = await msg('auth/user-disabled', false);
  T('un compte désactivé le dit (inchangé)', /désactivé/.test(r.t));
  return out;
}
async function joue(B) { try { return await suite(B); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
(await joue(BASE)).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nVALID-1 + LOGIN-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['la feuille attend de nouveau la météo avant d’écrire', B => ({ ...B, valid: B.valid.replace('  JOURNAL.unshift(_mvEqApplique(jEntry));\n  recalcTravaux(_validTache);',
    '  var _mSnap=await fetchMeteoMoyenne(_mDeb,date); if(_mSnap)jEntry.meteo_snapshot=_mSnap;\n  JOURNAL.unshift(_mvEqApplique(jEntry));\n  recalcTravaux(_validTache);') })],
  ['le formulaire du journal attend de nouveau la météo', B => ({ ...B, jour: B.jour.replace('  JOURNAL.unshift(_mvEqApplique(jEntry));\n',
    '  if(_mDeb){ var _mSnap=await fetchMeteoMoyenne(_mDeb,date); if(_mSnap)jEntry.meteo_snapshot=_mSnap; }\n  JOURNAL.unshift(_mvEqApplique(jEntry));\n') })],
  ['l’appel météo n’est plus borné', B => ({ ...B, meteo: B.meteo.replace('fetch(url, _ctl ? { signal: _ctl.signal } : undefined)', 'fetch(url)') })],
  ['la météo complète le journal d’avant la synchronisation', B => ({ ...B, apres: B.apres
    .replace('  fetchMeteoMoyenne(dateDebut, dateFin).then(function(m){', '  var _J0=(window.JOURNAL||JOURNAL||[]);\n  fetchMeteoMoyenne(dateDebut, dateFin).then(function(m){')
    .replace('var e=(window.JOURNAL||JOURNAL||[]).find', 'var e=_J0.find') })],
  ['une validation annulée est réécrite quand même', B => ({ ...B, apres: B.apres.replace('    if(!e) return;', "    if(!e){ saveData('journal'); return; }") })],
  ['la carte complète l’objet d’origine (ancien patron)', B => ({ ...B, rapide: B.rapide.replace('try{ _mvMeteoApres(jid,_findDebutTache(nom,task,date)||date,date); }',
    "try{ (async function(){var _d=_findDebutTache(nom,task,date)||date;var _m=await fetchMeteoMoyenne(_d,date);if(_m){jEntry.meteo_snapshot=_m;saveData('journal');}})(); }") })],
  ['App Check en échec retombe sur « Mot de passe incorrect »', B => ({ ...B, login: B.login.replace(" || /^appCheck\\//.test(String(e.code || '')) || !navigator.onLine)", ')') })],
  ['hors réseau, un autre code retombe sur le mot de passe', B => ({ ...B, login: B.login.replace(" || !navigator.onLine) {", ') {') })],
  ['le message hors réseau ne dit plus quoi faire', B => ({ ...B, login: B.login.replace('Pas de connexion réseau \\u2014 réessayez quand le téléphone capte.', 'Pas de connexion réseau.') })],
  ['le service worker attend de nouveau sans borne', B => ({ ...B, sw: B.sw.replace('Promise.race([metReseau, metDelai])', 'metReseau') })],
];
let rg = 0;
for (const [n, f] of DEF) {
  const B2 = f(BASE);
  if (Object.keys(BASE).every(k => B2[k] === BASE[k])) { console.log('  ⚠ non injecté : ' + n); continue; }
  const res = await joue(B2); const rouge = res.some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
}
console.log(`\n${rg}/${DEF.length} contre-épreuves rougissent`);
process.exit(rg === DEF.length ? 0 : 1);
