// ═══════════════════════════════════════════════════════════════════════════
//  HARNAIS PREP-1 — LE MODE PRÉPARATION GUERETTECH (§134)
// ═══════════════════════════════════════════════════════════════════════════
//  Nico, 16/09 : « je préfère mettre en place un mode préparation ». GUERETTECH
//  ouvre un domaine client dans les écrans normaux, depuis sa session GT, pour
//  le préparer avant la remise — au nom de GUERETTECH, sans valider aucune tâche.
//
//  ⚠️ LE DANGER QUE CE HARNAIS GARDE : pour un membre, les règles Firestore
//  refusent une écriture hors de son domaine ; le jeton GT écrit PARTOUT. Le
//  seul filet est dans l'application.
//
//  Sur les VRAIES fonctions extraites de src/app.js, src/firebase.js,
//  src/utils.js et src/admin-gt.js. Bouchons : stockage, DOM, session.
//
//  CE QUE CE HARNAIS PROUVE
//   1. on entre : drapeau et domaine posés AVANT le rechargement ; utilisateur
//      synthétique GUERETTECH, rôle admin SEUL, par le chemin de confirmLogin ;
//   2. on n'entre PAS : session GT fermée, sans gtAdmin, hors ligne, domaine
//      incohérent, file d'un autre domaine ou sans marque ;
//   3. dedans : aucun geste de travail, jamais l'écran de conditions, aucune
//      copie locale, écriture arrêtée avant la fin de session, bandeau en TEXTE ;
//   4. on sort : rien en attente, trace, coffre vidé ET dit, domaine d'avant rendu ;
//   5. la file porte son domaine ; en préparation une file d'ailleurs ne part
//      pas ; hors préparation, rien ne change ;
//   6. les fonctions d'équipe reçoivent le domaine en préparation, JAMAIS dehors ;
//   7. le journal d'accès GT est RELU avant d'être écrit ;
//   8. le câblage : gestes gardés, confirmLogin passe par _mvApresEntree…
//
//  ⚠ Contre-épreuve : chaque ancre doit être UNIQUE dans ce qu'elle mute, et
//    l'essai doit être VRAI sur le code sain — sinon ROUGE, jamais « détecté ».
//
//  Usage :  node scripts/mv-harnais-prep.mjs
//           node scripts/mv-harnais-prep.mjs --contre
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = {
  app: lire('src/app.js'), fb: lire('src/firebase.js'), utils: lire('src/utils.js'),
  gt: lire('src/admin-gt.js'), regl: lire('src/reglages.js')
};

/* ══ EXTRACTION ══ */
function fonction(src, nom, fichier) {
  const m = new RegExp('^(?:export\\s+)?(?:async\\s+)?function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) { console.error('ABSENTE de ' + fichier + ' : ' + nom); process.exit(1); }
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1).replace(/^export\s+/, '');
  }
  console.error('accolade non fermée : ' + nom); process.exit(1);
}
function affectation(src, nom, fichier) {
  const i = src.indexOf('window.' + nom + ' = ');
  if (i < 0) { console.error('AFFECTATION ABSENTE de ' + fichier + ' : window.' + nom); process.exit(1); }
  const k = src.indexOf('{', i); let d = 0;
  for (let j = k; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(i, src.indexOf(';', j) + 1);
  }
  console.error('accolade non fermée : window.' + nom); process.exit(1);
}
function ligneVar(src, nom, fichier) {
  const m = new RegExp('^var ' + nom + '\\s*=[^\\n]*;', 'm').exec(src);
  if (!m) { console.error('VAR ABSENTE de ' + fichier + ' : ' + nom); process.exit(1); }
  return m[0];
}

const STOCK = `function _Stock(){ var m = new Map(); return { getItem: function(k){ return m.has(k) ? m.get(k) : null; },
  setItem: function(k, v){ m.set(k, String(v)); }, removeItem: function(k){ m.delete(k); },
  key: function(i){ return Array.from(m.keys())[i] || null; }, get length(){ return m.size; } }; }
`;

/* ══ 1 · app.js ══ */
const APP_VAR = ['_MV_PREP_CLE', '_MV_PREP_RETOUR', '_MV_PREP_MSG', '_MV_PREP_MARGE', '_mvPrepT'];
const APP_FN = ['_mvLsKey', '_mvValidBlocked', '_mvTrialBanner', '_mvCheckExpired', '_mvTermsCheck',
  '_mvPrepLire', '_mvPrepDefaire', '_mvPrepPoser', '_mvPrepGesteRefuse', '_mvPrepReste', '_mvPrepFini',
  '_mvPrepDire', '_mvPrepDireMessage', '_mvPrepBoot', '_mvPrepMinuteur', '_mvPrepBandeau', '_mvPrepQuitter'];
const blocApp = S => APP_VAR.map(n => ligneVar(S.app, n, 'src/app.js')).join('\n') + '\n'
  + fonction(S.utils, '_mvPrepOn', 'src/utils.js') + '\n'
  + APP_FN.map(n => fonction(S.app, n, 'src/app.js')).join('\n');
const BLOC_APP = blocApp(SRC);

const PRELUDE_APP = STOCK + `
var E = { toasts: [], reloads: 0, entrees: 0, panneau: 0, logs: [], acces: [], auth: 0, jeton: 0 };
function _El(tag){
  var el = { tagName: tag, children: [], style: {}, className: '', type: '', _txt: '', _html: '', _innerHTMLPose: false, disabled: false,
    classList: { _s: new Set(), add: function(c){ this._s.add(c); }, remove: function(c){ this._s.delete(c); }, contains: function(c){ return this._s.has(c); } },
    appendChild: function(c){ this.children.push(c); return c; },
    addEventListener: function(t, f){ this['on_' + t] = f; } };
  Object.defineProperty(el, 'textContent', { get: function(){ return this._txt + this.children.map(function(c){ return c.textContent; }).join(''); },
    set: function(v){ this._txt = String(v); this.children = []; } });
  Object.defineProperty(el, 'innerHTML', { get: function(){ return this._html; }, set: function(v){ this._html = String(v); this._innerHTMLPose = true; } });
  return el;
}
var _els = { 'mv-trial-bar': _El('div'), 'login-screen': _El('div'), 'ovTerms': _El('div'), 'mv-expired-ov': _El('div') };
var document = { getElementById: function(id){ return _els[id] || null; }, createElement: function(t){ return _El(t); }, body: _El('body') };
var localStorage = _Stock(), sessionStorage = _Stock();
var navigator = { onLine: true };
var location = { reload: function(){ E.reloads++; } };
var setTimeout = function(f){ f(); return 0; };
var setInterval = function(){ return 1; };
var clearInterval = function(){};
var currentUser = null;
var window = { currentUser: null, _MV_LOCKED: false };
function showToast(t){ E.toasts.push(String(t)); }
var _AUTH = { user: { email: 'gt@exemple.test', uid: 'u-gt' }, claims: { gtAdmin: true, gts: Date.now() + 6 * 3600e3 } };
window.firebase = { auth: function(){ return { currentUser: _AUTH.user }; } };
window._fbAuthPret = async function(){ E.auth++; };
window._fbClaims = async function(){ return _AUTH.user ? _AUTH.claims : null; };
window._fbGtSessOk = function(cl){ return !!(cl && cl.gtAdmin === true && typeof cl.gts === 'number' && cl.gts > Date.now()); };
window._gtEnterPanel = function(){ E.panneau++; };
var _FB = { tenant: 'dom-a', file: 0, fileT: '', coffre: 0, flushVide: false };
window._fbTenant = function(){ return _FB.tenant; };
window._offlineQueueCount = function(){ return _FB.file; };
window._fbQueueTenant = function(){ return _FB.fileT; };
window._flushOfflineQueue = async function(){ if (_FB.flushVide) _FB.file = 0; };
window._agtLogAccessLu = async function(s, a){ E.acces.push(a + ':' + s); return true; };
window._fbStashVider = function(){ var n = _FB.coffre; _FB.coffre = 0; return n; };
window.logError = function(o){ E.logs.push(o); };
function _mvApresEntree(){ E.entrees++; }
var _VISU_SAISON = 'P2025';
function _mvOnActiveSaison(){ return true; }
function getSaisonActive(){ return { nom: 'P2026' }; }
function isAdmin(){ return true; }
function _mvTermsFromToken(){ E.jeton++; return { then: function(){ return this; } }; }
function _mvTermsOk(){ return false; }
function _mvTermsPrefill(){}
function _mvTrial(){ return { active: false, expired: false, daysLeft: 0, level: 'ok' }; }
function _mvIcon(){ return ''; }
function _mvContactMailto(){ return ''; }
var _mvLsKeyMuet = false;
`;
const RETOUR_APP = `
window._mvPrepOn = _mvPrepOn;
return { _mvPrepPoser, _mvPrepBoot, _mvPrepQuitter, _mvTrialBanner, _mvCheckExpired, _mvTermsCheck,
  _mvValidBlocked, _mvLsKey, E, _FB, _AUTH, _els, localStorage, sessionStorage, navigator, window, document,
  get cu(){ return currentUser; } };
`;
const monterApp = mut => new Function(PRELUDE_APP + (mut ? mut(BLOC_APP) : BLOC_APP) + RETOUR_APP)();

function drapeau(M, o) {
  M.sessionStorage.setItem('mv_prep', JSON.stringify(Object.assign(
    { slug: 'dom-a', nom: 'Domaine A', plan: 'vigneron', avant: 'marchand-grillot', at: 1 }, o || {})));
  M.localStorage.setItem('mavigne_tenant', 'dom-a');
}
async function entre(mut) { const M = monterApp(mut); drapeau(M); await M._mvPrepBoot(); return M; }

/* ══ 2 · firebase.js ══ */
const blocFb = S => fonction(S.utils, '_mvPrepOn', 'src/utils.js') + '\n'
  + ['_loadQueue', '_queueSave', '_flushQueue', '_mvPrepTenant', '_mvBaseFile', '_mvBasesFileEcrire'].map(n => fonction(S.fb, n, 'src/firebase.js')).join('\n') + '\n'
  + ['_fbQueueTenant', '_plan'].map(n => affectation(S.fb, n, 'src/firebase.js')).join('\n');
const BLOC_FB = blocFb(SRC);
const PRELUDE_FB = STOCK + `
var E = { ecrit: [], badge: '', logs: [] };
var localStorage = _Stock();
var TENANT_ID = 'dom-a', DEBUG = false;
var _offlineQueue = {};
// FUSION-1 (§146) — la file garde sa base, et l'envoi fusionne (éprouvé par mv-harnais-fusion-docs) :
// ici, seule compte la marque de domaine — une écriture fusionnée compte comme une écriture.
var _offlineBases = {}, _MV_FILE_BASE_CLE = 'mavigne_offline_queue_base', _fbBases = {}, _baseParcelles = null;
var _MV_FUSION_EXCLUES = { parcelles: 1, kml_polygons: 1, travaux: 1 };
function deepClone(v){ return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
function _mvBaseDe(){ return undefined; }
async function _mvSauverFusion(k){ E.ecrit.push(fbDocRef(k)); return { fusion: null, distant: false }; }
function _mvApresFusion(){ return 'rien'; }
function _mvParcellesApres(){ return 'rien'; }
var window = { currentUser: null, _MV_CLAIMS: {} };
window.logError = function(o){ E.logs.push(o); };
function setDoc(ref){ E.ecrit.push(ref); return Promise.resolve(); }
function fbDocRef(k){ return 'mavigne_' + TENANT_ID + '/' + k; }
function _fbClone(k, v){ return v; }
async function _saveParcellesMerged(){ E.ecrit.push('parcelles'); }
async function _mvBlockDestructive(){ return false; }
function _isDenied(){ return false; }
async function _mvTokenAlive(){ return true; }
function _mvStashDenied(){}
function showSyncBadge(t){ E.badge = String(t); }
function _showOfflineQueueBadge(){}
`;
const RETOUR_FB = `
window._mvPrepOn = _mvPrepOn;
return { _queueSave, _flushQueue, _mvPrepTenant, E, localStorage, window,
  prep: function(on, plan){ window.currentUser = on ? { _isPrep: true, _prepPlan: plan || '' } : null; },
  file: function(){ return Object.keys(_offlineQueue).length; } };
`;
const monterFb = mut => new Function(PRELUDE_FB + (mut ? mut(BLOC_FB) : BLOC_FB) + RETOUR_FB)();
function fileDisque(M, tenantMarque) {
  M.localStorage.setItem('mavigne_offline_queue', JSON.stringify({ journal: [1], cave_elevage: [2] }));
  if (tenantMarque != null) M.localStorage.setItem('mavigne_offline_queue_t', tenantMarque);
}

/* ══ 3 · admin-gt.js ══ */
const BLOC_GT = affectation(SRC.gt, '_agtLogAccessLu', 'src/admin-gt.js');
const PRELUDE_GT = `
var E = { ecrit: null };
var _LU = null;
var _agtAccessLog = [];
var window = {};
window.fbAdminReadGT = async function(){ return _LU; };
window.fbAdminWriteGT = async function(k, v){ E.ecrit = [k, v]; };
`;
const RETOUR_GT = `
return { lu: function(v){ _LU = v; }, E, window };
`;
const monterGt = mut => new Function(PRELUDE_GT + (mut ? mut(BLOC_GT) : BLOC_GT) + RETOUR_GT)();

/* ══ 4 · le câblage, lu dans les sources ══ */
const stripC23 = c => c.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
function statiques(S) {
  const r = [];
  const tous = [S.app, S.fb, S.utils, S.gt, S.regl].join('\n');
  r.push([(tous.match(/_isPrep:true/g) || []).length === 1, '★★ `_isPrep:true` n’est posé qu’à UN endroit']);
  for (const g of ['annulerTache', 'bulkValidateP1', 'confirmNiveaux', 'confirmPassages', 'confirmValidation',
                   'marquerEnCours', 'pQuickStart', 'pQuickValidate', 'tapTacheSimple', 'toggleTravail'])
    r.push([fonction(S.app, g, 'src/app.js').indexOf('_mvValidBlocked()') !== -1, 'le geste ' + g + ' passe par _mvValidBlocked']);
  for (const g of ['openRepPonct', 'saveRepPonct', 'openJournalEntry', 'saveJournalEntry']) {
    const c = fonction(S.app, g, 'src/app.js');
    r.push([c.slice(c.indexOf('{') + 1).trimStart().indexOf('if(_mvPrepGesteRefuse())return;') === 0,
      '★ ' + g + ' refuse EN PREMIER en préparation']);
  }
  const cp = fonction(S.regl, 'openChangePwd', 'src/reglages.js');
  r.push([cp.indexOf('_mvPrepOn()') !== -1 && cp.indexOf('_mvPrepOn()') < cp.indexOf("getElementById('cpwd-sub')"),
    '★★ « Changer mon mot de passe » refusé avant d’ouvrir (il viserait le compte GT)']);
  const cl = fonction(S.app, 'confirmLogin', 'src/app.js'), ae = fonction(S.app, '_mvApresEntree', 'src/app.js');
  r.push([cl.indexOf('_mvApresEntree();') !== -1 && cl.indexOf('goHub();') === -1, '★ confirmLogin entre par _mvApresEntree']);
  r.push([ae.indexOf('applyRoles();') !== -1 && ae.indexOf('_fbLoadAfterAuth') !== -1 && ae.indexOf('_migrateTachesV3();') !== -1,
    '_mvApresEntree porte la séquence d’entrée complète']);
  r.push([fonction(S.app, '_mvPrepBoot', 'src/app.js').indexOf('_mvApresEntree();') !== -1, '★ la préparation entre par le MÊME chemin']);
  r.push([fonction(S.app, '_mvSessCheck', 'src/app.js').indexOf('_mvPrepOn()') !== -1, 'la garde multi-onglet ignore la préparation']);
  r.push([fonction(S.app, '_mvRefreshCurrentUserRoles', 'src/app.js').indexOf('_mvPrepOn()') !== -1,
    'les rôles de GUERETTECH ne sont jamais relus dans MEMBRES']);
  r.push([fonction(S.app, 'renderHomeMaPart', 'src/app.js').indexOf('if(!tache||window._mvPrepOn())') !== -1,
    '« Ma part du chantier » masquée en préparation']);
  const mt = fonction(S.app, 'openMaTrace', 'src/app.js');
  r.push([mt.indexOf('_mvPrepOn()') !== -1 && mt.indexOf('_mvPrepOn()') < mt.indexOf('renderMaTrace();'), '« Ma trace » refusée en préparation']);
  const wn = fonction(S.utils, 'checkWhatsNew', 'src/utils.js');
  r.push([wn.indexOf('if (_mvPrepOn()) return;') !== -1 && wn.indexOf('if (_mvPrepOn()) return;') < wn.indexOf('localStorage'),
    'les nouveautés ne s’ouvrent pas en préparation']);
  const iL = S.fb.indexOf('window._fbLoad = async function () {');
  const fl = iL < 0 ? '' : S.fb.slice(iL, iL + 900);
  r.push([fl.indexOf('_loadQueue();') !== -1 && fl.indexOf('_loadQueue();') < fl.indexOf('_mvPrepBoot')
    && fl.indexOf('_mvPrepBoot') < fl.indexOf("getItem('mavigne_tenant')"),
    '★★ _fbLoad : la file est chargée, PUIS la préparation, PUIS tout le reste']);
  r.push([(S.fb.match(/fbCallFn\('(updateMemberRoles|resetMemberPassword|updateMemberEmail)', _mvPrepTenant\(/g) || []).length === 3,
    '★ les trois fonctions d’équipe passent par _mvPrepTenant']);
  r.push([/function\s+_mvPrepTenant/.test(stripC23(S.fb)),
    '★ _mvPrepTenant reste VISIBLE du preflight (C23) : aucun faux commentaire bloc ne l’avale']);
  const po = fonction(S.gt, 'agtPrepOuvrir', 'src/admin-gt.js');
  r.push([/window\.agtPrepOuvrir\s*=\s*agtPrepOuvrir;/.test(S.gt), 'agtPrepOuvrir est joignable depuis la carte']);
  r.push([S.gt.indexOf("onclick=\"agtPrepOuvrir(\\''+_escAttr(t.slug)+'\\')\"") !== -1, 'le bouton de la carte échappe le domaine (_escAttr)']);
  r.push([po.indexOf('agtLogAccess(') === -1 && po.indexOf('_agtLogAccessLu(') !== -1,
    '★★ l’ouverture trace par le journal RELU, jamais par agtLogAccess']);
  r.push([po.indexOf('innerHTML') === -1 && fonction(S.app, '_mvPrepBandeau', 'src/app.js').indexOf('innerHTML') === -1,
    '★ feuille et bandeau construits par le DOM, jamais par innerHTML']);
  r.push([po.indexOf('_mvPrepPoser(') !== -1, 'la feuille entre par _mvPrepPoser (une seule façon d’entrer)']);
  r.push([(S.app.match(/setItem\('mavigne_tenant'/g) || []).length === 3,
    '`mavigne_tenant` n’est écrit que par la préparation (2) et l’existant (1)']);
  return r;
}

let vert = 0; const rouges = [];
function pose(cond, quoi) {
  if (cond) { vert++; console.log('  vert   ' + quoi); }
  else { rouges.push(quoi); console.log('  ROUGE  ' + quoi); }
}

/* ══ LES ESSAIS — des FONCTIONS, pour que la contre-épreuve les rejoue ══ */
const ESSAIS = {
  poser: M => {
    M.localStorage.setItem('mavigne_tenant', 'marchand-grillot');
    const ok = M._mvPrepPoser({ slug: 'dom-a', nom: 'Domaine A', plan: 'vigneron' });
    const f = JSON.parse(M.sessionStorage.getItem('mv_prep') || 'null');
    return ok === true && M.E.reloads === 1 && f && f.slug === 'dom-a' && f.avant === 'marchand-grillot'
      && f.plan === 'vigneron' && M.localStorage.getItem('mavigne_tenant') === 'dom-a';
  },
  entreeNominale: async M => {
    drapeau(M); const r = await M._mvPrepBoot(); const u = M.cu;
    return r === true && M.E.entrees === 1 && u && u._isPrep === true && u.nom === 'GUERETTECH'
      && JSON.stringify(u.roles) === '["admin"]' && u._prepPlan === 'vigneron' && M.window._mvPrepOn() === true;
  },
  sessionExpiree: async M => {
    drapeau(M); M._AUTH.claims = { gtAdmin: true, gts: Date.now() - 1000 };
    const r = await M._mvPrepBoot();
    return r === false && !M.cu && M.E.entrees === 0 && !M.sessionStorage.getItem('mv_prep')
      && M.localStorage.getItem('mavigne_tenant') === 'marchand-grillot';
  },
  fileAutreDomaine: async M => {
    drapeau(M); M._FB.file = 3; M._FB.fileT = 'dom-b';
    const r = await M._mvPrepBoot();
    return r === true && !M.cu && M.E.reloads === 1 && M.sessionStorage.getItem('mv_prep_retour') === '1'
      && /autre domaine/.test(M.sessionStorage.getItem('mv_prep_msg') || '')
      && M.localStorage.getItem('mavigne_tenant') === 'marchand-grillot';
  },
  domaineIncoherent: async M => { drapeau(M); M._FB.tenant = 'dom-z'; await M._mvPrepBoot(); return !M.cu && M.E.reloads === 1; },
  gesteRefuse: async M => {
    drapeau(M); await M._mvPrepBoot();
    return M._mvValidBlocked() === true && M.E.toasts.some(t => /valident par l’équipe/.test(t));
  },
  jamaisConditions: async M => {
    drapeau(M); await M._mvPrepBoot(); M._els.ovTerms.style.display = 'flex'; M._mvTermsCheck();
    return M._els.ovTerms.style.display === 'none' && M.E.jeton === 0;
  },
  verrouFin: async M => {
    drapeau(M); await M._mvPrepBoot(); M.cu._prepFin = Date.now() + 60e3; M.window._MV_LOCKED = false; M._mvCheckExpired();
    return M.window._MV_LOCKED === true;
  },
  bandeauTexte: async M => {
    drapeau(M); await M._mvPrepBoot();
    M.cu._prepNom = '<img src=x onerror=alert(1)>'; M.cu._prepFin = Date.now() + 3 * 3600e3 + 5 * 60e3; M._mvTrialBanner();
    const bar = M._els['mv-trial-bar'];
    return bar.textContent.indexOf('Préparation · <img src=x onerror=alert(1)>') !== -1 && bar.classList.contains('show');
  },
  sortieBloqueeFile: async M => {
    drapeau(M); await M._mvPrepBoot(); M._FB.file = 2; M.navigator.onLine = false; await M._mvPrepQuitter();
    return M.E.reloads === 0 && !!M.sessionStorage.getItem('mv_prep') && M.E.toasts.some(t => /pas encore envoyée/.test(t));
  },
  sortieRendDomaine: async M => {
    drapeau(M); await M._mvPrepBoot(); M._FB.file = 2; M._FB.flushVide = true; M._FB.coffre = 2; await M._mvPrepQuitter();
    return M.E.reloads === 1 && !M.sessionStorage.getItem('mv_prep') && M.localStorage.getItem('mavigne_tenant') === 'marchand-grillot'
      && M._FB.coffre === 0 && /2 saisies refusées/.test(M.sessionStorage.getItem('mv_prep_msg') || '')
      && M.E.acces.indexOf('Préparation fermée:dom-a') !== -1;
  },
  sansCopieLocale: async M => { drapeau(M); await M._mvPrepBoot(); return M._mvLsKey() === ''; },
  fbMarque: M => { M._queueSave('journal', [1]); return M.localStorage.getItem('mavigne_offline_queue_t') === 'dom-a'; },
  fbAutreDomaineBloque: async M => { M.prep(true); fileDisque(M, 'dom-b'); await M._flushQueue(); return M.E.ecrit.length === 0 && M.file() === 2; },
  fbMemeDomainePart: async M => {
    M.prep(true); fileDisque(M, 'dom-a'); await M._flushQueue();
    return M.E.ecrit.length === 2 && M.file() === 0 && M.localStorage.getItem('mavigne_offline_queue_t') === null;
  },
  fbHorsPrepInchange: async M => { M.prep(false); fileDisque(M, 'dom-b'); await M._flushQueue(); return M.E.ecrit.length === 2; },
  fbTenantEnPrep: M => { M.prep(true); return M._mvPrepTenant({ email: 'a@b.c' }).tenant === 'dom-a'; },
  fbTenantHorsPrep: M => { M.prep(false); return !('tenant' in M._mvPrepTenant({ email: 'a@b.c' })); },
  fbPlan: M => { M.prep(true, 'vigneron'); M.window._MV_CLAIMS = { plan: 'domaine' }; return M.window._plan() === 'vigneron'; },
  gtRelu: async M => {
    M.lu({ value: [{ id: 'x1' }, { id: 'x2' }] });
    const ok = await M.window._agtLogAccessLu('dom-a', 'Préparation ouverte', '✎');
    const v = M.E.ecrit && M.E.ecrit[1] && M.E.ecrit[1].value;
    return ok === true && M.E.ecrit[0] === 'access_log' && v && v.length === 3 && v[0].action === 'Préparation ouverte' && v[1].id === 'x1';
  }
};

if (!CONTRE) {
  console.log('\n── 1 · entrer ──');
  pose(ESSAIS.poser(monterApp()), '★★ drapeau posé, domaine du client dans mavigne_tenant AVANT le rechargement, domaine d’avant gardé');
  {
    const M = monterApp();
    pose(M._mvPrepPoser({ slug: '../evil' }) === false && M.E.reloads === 0 && !M.sessionStorage.getItem('mv_prep'), 'un slug invalide ne pose rien');
  }
  { const M = monterApp(); pose((await M._mvPrepBoot()) === false && M.E.auth === 0, 'sans drapeau : démarrage normal, rien n’est attendu'); }
  pose(await ESSAIS.entreeNominale(monterApp()), '★★★ entrée : GUERETTECH, rôle admin SEUL, formule du registre, par _mvApresEntree');
  { const M = await entre(); pose(M._els['login-screen'].style.display === 'none', 'l’écran de connexion est masqué'); }

  console.log('\n── 2 · ne pas entrer ──');
  pose(await ESSAIS.sessionExpiree(monterApp()), '★★★ session GT expirée : on n’entre pas, drapeau retiré, domaine d’avant rendu');
  {
    const M = monterApp(); drapeau(M); M._AUTH.claims = { gts: Date.now() + 3600e3 };
    pose((await M._mvPrepBoot()) === false && !M.cu, '★★ sans le droit gtAdmin : on n’entre pas');
  }
  pose(await ESSAIS.fileAutreDomaine(monterApp()), '★★★ file d’un autre domaine : refus, retour au panneau, raison dite');
  {
    const M = monterApp(); drapeau(M); M._FB.file = 2; M._FB.fileT = '';
    pose((await M._mvPrepBoot()) === true && !M.cu, '★★ file SANS marque : refusée aussi');
  }
  {
    const M = monterApp(); drapeau(M); M._FB.file = 2; M._FB.fileT = 'dom-a'; await M._mvPrepBoot();
    pose(!!(M.cu && M.cu._isPrep), 'file du MÊME domaine : on entre, elle partira au bon endroit');
  }
  { const M = monterApp(); drapeau(M); M.navigator.onLine = false; await M._mvPrepBoot(); pose(!M.cu && M.E.reloads === 1, '★ hors ligne : refus'); }
  pose(await ESSAIS.domaineIncoherent(monterApp()), '★★ Firestore sur un autre domaine que le drapeau : refus');
  {
    const M = monterApp(); M.sessionStorage.setItem('mv_prep_retour', '1');
    M.sessionStorage.setItem('mv_prep_msg', JSON.stringify({ txt: 'Préparation fermée', col: '#3D6B27' }));
    const r = await M._mvPrepBoot();
    pose(r === true && M.E.panneau === 1 && !M.cu, 'retour après la sortie : on rentre dans le panneau GT');
    pose(M.E.toasts.indexOf('Préparation fermée') !== -1 && !M.sessionStorage.getItem('mv_prep_retour') && !M.sessionStorage.getItem('mv_prep_msg'),
      'le message est dit une fois, puis effacé');
  }

  console.log('\n── 3 · dedans ──');
  pose(await ESSAIS.gesteRefuse(monterApp()), '★★★ en préparation, les gestes de validation sont refusés, et c’est dit');
  { const M = monterApp(); pose(M._mvValidBlocked() === false, 'hors préparation, saison active : la validation passe'); }
  pose(await ESSAIS.jamaisConditions(monterApp()), '★★★ jamais l’écran de conditions : GUERETTECH ne signe pas pour le client');
  pose(await ESSAIS.verrouFin(monterApp()), '★★ à moins de 2 min de la fin de session, l’écriture s’arrête');
  {
    const M = await entre(); M.cu._prepFin = Date.now() + 3600e3; M.window._MV_LOCKED = true; M._mvCheckExpired();
    pose(M.window._MV_LOCKED === false && M._els['mv-expired-ov'].style.display === 'none', 'session ouverte : ni verrou, ni écran d’expiration');
  }
  pose(await ESSAIS.bandeauTexte(monterApp()), '★★ le nom du domaine est posé en TEXTE dans le bandeau');
  {
    const M = await entre(); M.cu._prepFin = Date.now() + 3 * 3600e3 + 5 * 60e3; M._mvTrialBanner();
    const bar = M._els['mv-trial-bar'];
    pose(/encore 3 h 0\d/.test(bar.textContent) && bar.style.background === '#4C2F96' && M.document.body.classList.contains('mv-trial-on'),
      'violet, durée restante dite, décalage d’en-tête du bandeau d’essai réutilisé');
  }
  {
    const M = await entre(); M.cu._prepFin = Date.now() + 8 * 60e3; M._mvTrialBanner();
    pose(M._els['mv-trial-bar'].style.background === '#9C4E14' && /plus que/.test(M._els['mv-trial-bar'].textContent), 'orange sous 10 min');
  }
  {
    const M = await entre(); M.cu._prepFin = Date.now() + 30e3; M._mvTrialBanner();
    pose(M._els['mv-trial-bar'].style.background === '#7A1020' && /plus rien n’est enregistré/.test(M._els['mv-trial-bar'].textContent),
      '★ rouge, et « plus rien n’est enregistré » à la fin');
  }
  pose(await ESSAIS.sansCopieLocale(monterApp()), '★★ en préparation : AUCUNE copie locale du domaine');
  { const M = monterApp(); M.localStorage.setItem('mavigne_tenant', 'dom-a'); pose(M._mvLsKey() === 'mavigne_data_v1_dom-a', 'hors préparation : la copie locale garde sa clé'); }

  console.log('\n── 4 · sortir ──');
  pose(await ESSAIS.sortieBloqueeFile(monterApp()), '★★★ des modifications en attente : on ne sort PAS, et c’est dit');
  pose(await ESSAIS.sortieRendDomaine(monterApp()), '★★ sortie : envoyé, tracé, coffre vidé ET compté, domaine d’avant rendu');
  {
    const M = await entre(); await M._mvPrepQuitter();
    pose(M.sessionStorage.getItem('mv_prep_retour') === '1' && /"Préparation fermée"/.test(M.sessionStorage.getItem('mv_prep_msg') || ''),
      'sortie propre : retour au panneau annoncé');
  }

  console.log('\n── 5 · la file d’attente ──');
  pose(ESSAIS.fbMarque(monterFb()), '★ la file porte le domaine qui l’a remplie');
  pose(await ESSAIS.fbAutreDomaineBloque(monterFb()), '★★★ en préparation, une file d’un autre domaine ne part PAS');
  { const M = monterFb(); M.prep(true); fileDisque(M, null); await M._flushQueue(); pose(M.E.ecrit.length === 0, '★★ en préparation, une file SANS marque ne part pas'); }
  pose(await ESSAIS.fbMemeDomainePart(monterFb()), 'même domaine : la file part, puis la marque s’efface');
  pose(await ESSAIS.fbHorsPrepInchange(monterFb()), '★ hors préparation : rien ne change pour les membres');

  console.log('\n── 6 · fonctions d’équipe, formule ──');
  pose(ESSAIS.fbTenantEnPrep(monterFb()), 'en préparation, le domaine part avec la demande');
  pose(ESSAIS.fbTenantHorsPrep(monterFb()), '★★ hors préparation, AUCUN domaine ajouté (le panneau passe le sien)');
  { const M = monterFb(); M.prep(true); pose(M._mvPrepTenant({ email: 'a', tenant: 'dom-x' }).tenant === 'dom-x', 'un domaine explicite n’est jamais remplacé'); }
  pose(ESSAIS.fbPlan(monterFb()), '★ en préparation, la formule vient du registre, pas du jeton GT');
  { const M = monterFb(); M.prep(false); M.window._MV_CLAIMS = { plan: 'essentiel' }; pose(M.window._plan() === 'essentiel', 'hors préparation, la formule vient du jeton'); }

  console.log('\n── 7 · journal d’accès GT ──');
  pose(await ESSAIS.gtRelu(monterGt()), '★★★ le journal est RELU puis complété, jamais remplacé');
  { const M = monterGt(); M.lu(null); await M.window._agtLogAccessLu('dom-a', 'x', ''); pose(M.E.ecrit && M.E.ecrit[1].value.length === 1, 'journal absent : première ligne'); }
  { const M = monterGt(); M.lu({ foo: 1 }); const ok = await M.window._agtLogAccessLu('dom-a', 'x', ''); pose(ok === false && M.E.ecrit === null, '★ forme inconnue : on n’écrase rien'); }
  {
    const M = monterGt(); M.lu({ value: Array.from({ length: 100 }, (_, i) => ({ id: 'e' + i })) });
    await M.window._agtLogAccessLu('dom-a', 'x', ''); pose(M.E.ecrit[1].value.length === 100 && M.E.ecrit[1].value[99].id === 'e98', 'plafond de 100 lignes tenu');
  }

  console.log('\n── 8 · câblage ──');
  for (const [c, q] of statiques(SRC)) pose(c, q);
}

/* ══ CONTRE-ÉPREUVE ═══════════════════════════════════════════════════════
   Chaque défaut est réintroduit dans le code EXTRAIT (ou dans la source lue
   par les contrôles de câblage) : le harnais doit rougir. */
if (CONTRE) {
  console.log('\n── CONTRE-ÉPREUVE : chaque défaut réintroduit doit mordre ──');
  const mord = async (titre, monter, bloc, ancre, remplace, essai) => {
    const n = bloc.split(ancre).length - 1;
    if (n !== 1) { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → ANCRE ' + (n ? 'NON UNIQUE (' + n + ')' : 'INTROUVABLE')); return; }
    let sain = false;
    try { sain = !!(await essai(monter())); } catch (e) { sain = false; }
    if (!sain) { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → ESSAI FAUX SUR LE CODE SAIN'); return; }
    let rouge = false;
    try { rouge = !(await essai(monter(b => b.replace(ancre, remplace)))); } catch (e) { rouge = true; }
    if (rouge) { vert++; console.log('  vert   ' + titre + ' → détecté'); }
    else { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
  };
  const A = (t, a, r, e) => mord(t, monterApp, BLOC_APP, a, r, e);
  const F = (t, a, r, e) => mord(t, monterFb, BLOC_FB, a, r, e);
  const G = (t, a, r, e) => mord(t, monterGt, BLOC_GT, a, r, e);

  await A('★★★ le verrou des gestes oublie la préparation',
    '  if(_mvPrepGesteRefuse()) return true;\n', '', ESSAIS.gesteRefuse);
  await A('★★★ l’écran de conditions s’ouvre pour GUERETTECH',
    "cu._isDemo||window._mvPrepOn()){ ov.style.display='none'; return; }", "cu._isDemo){ ov.style.display='none'; return; }", ESSAIS.jamaisConditions);
  await A('★★★ on entre sans session GT valide',
    'if(!(fu && window._fbGtSessOk && window._fbGtSessOk(cl))){', 'if(false){', ESSAIS.sessionExpiree);
  await A('★★★ on entre malgré une file d’un autre domaine',
    'else if(window._offlineQueueCount && window._offlineQueueCount()>0 && window._fbQueueTenant && window._fbQueueTenant()!==prep.slug) raison=',
    'else if(false) raison=', ESSAIS.fileAutreDomaine);
  await A('★★ on entre sur un domaine Firestore qui n’est pas celui du drapeau',
    "else if(!window._fbTenant || window._fbTenant()!==prep.slug) raison=", 'else if(false) raison=', ESSAIS.domaineIncoherent);
  await A('★★ GUERETTECH redevient ouvrier et tractoriste',
    "roles:['admin']", "roles:['admin','ouvrier','tractoriste']", ESSAIS.entreeNominale);
  await A('★★ le drapeau oublie le domaine d’avant',
    "avant:avant, at:Date.now()", "avant:'', at:Date.now()", ESSAIS.poser);
  await A('★★★ on sort avec des modifications en attente',
    "  if(n>0){\n    if(typeof showToast==='function') showToast(n+' modification'", "  if(false){\n    if(typeof showToast==='function') showToast(n+' modification'",
    ESSAIS.sortieBloqueeFile);
  await A('★★ la sortie ne rend pas le domaine d’avant',
    'var ec=window._fbStashVider?window._fbStashVider():0;\n  _mvPrepDefaire(prep);', 'var ec=window._fbStashVider?window._fbStashVider():0;',
    ESSAIS.sortieRendDomaine);
  await A('★★ la sortie ne vide plus le coffre',
    'var ec=window._fbStashVider?window._fbStashVider():0;', 'var ec=0;', ESSAIS.sortieRendDomaine);
  await A('★★ la copie locale revient en préparation',
    "  if(window._mvPrepOn && window._mvPrepOn()) return '';\n", '', ESSAIS.sansCopieLocale);
  await A('★★ l’écriture continue jusqu’à la dernière seconde de session',
    'if(window._mvPrepOn()){ window._MV_LOCKED=_mvPrepFini(); ov.style.display=\'none\'; return; }', '', ESSAIS.verrouFin);
  await A('★★ le nom du domaine passe par innerHTML',
    "titre.textContent='Pr\\u00e9paration \\u00b7 '+(cu._prepNom||cu._prepSlug||'');",
    "titre.innerHTML='Pr\\u00e9paration \\u00b7 '+(cu._prepNom||cu._prepSlug||'');", ESSAIS.bandeauTexte);

  await F('★ la file ne porte plus son domaine',
    "try { localStorage.setItem('mavigne_offline_queue_t', TENANT_ID || ''); }", 'try { }', ESSAIS.fbMarque);
  await F('★★★ en préparation, la file d’un autre domaine repart',
    'if (window._mvPrepOn && window._mvPrepOn() && window._fbQueueTenant() !== TENANT_ID) {', 'if (false) {', ESSAIS.fbAutreDomaineBloque);
  await F('★ la marque n’est plus effacée quand la file est vide',
    "try { localStorage.removeItem('mavigne_offline_queue_t'); }", 'try { }', ESSAIS.fbMemeDomainePart);
  await F('★★ la garde de la file bloque aussi les membres',
    'if (window._mvPrepOn && window._mvPrepOn() && window._fbQueueTenant() !== TENANT_ID) {', 'if (window._fbQueueTenant() !== TENANT_ID) {',
    ESSAIS.fbHorsPrepInchange);
  await F('★★ le domaine part avec la demande même hors préparation',
    'if (window._mvPrepOn && window._mvPrepOn() && TENANT_ID && data && !data.tenant)', 'if (TENANT_ID && data && !data.tenant)', ESSAIS.fbTenantHorsPrep);
  await F('la formule du registre est ignorée en préparation',
    '(window._mvPrepOn && window._mvPrepOn() && window.currentUser._prepPlan)', '(false)', ESSAIS.fbPlan);
  await G('★★★ le journal d’accès est écrit sans être relu',
    "var d=await window.fbAdminReadGT('access_log');", 'var d={ value:_agtAccessLog };', ESSAIS.gtRelu);

  /* Câblage : la mutation porte sur la SOURCE lue par statiques(). */
  const mordS = (titre, fichier, ancre, remplace, motif) => {
    const n = SRC[fichier].split(ancre).length - 1;
    if (n !== 1) { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → ANCRE ' + (n ? 'NON UNIQUE (' + n + ')' : 'INTROUVABLE')); return; }
    const cible = r => r.filter(([, q]) => motif.test(q));
    const sain = cible(statiques(SRC));
    if (!sain.length || !sain.every(([c]) => c)) { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → CONTRÔLE ABSENT OU FAUX SUR LE CODE SAIN'); return; }
    let rouge = false;
    try { rouge = cible(statiques(Object.assign({}, SRC, { [fichier]: SRC[fichier].replace(ancre, remplace) }))).some(([c]) => !c); }
    catch (e) { rouge = true; }
    if (rouge) { vert++; console.log('  vert   ' + titre + ' → détecté'); }
    else { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
  };
  mordS('★ « + Ajouter » du journal perd sa garde', 'app',
    "function openJournalEntry(){\n  if(_mvPrepGesteRefuse())return;", 'function openJournalEntry(){', /openJournalEntry refuse/);
  mordS('★★ « Changer mon mot de passe » s’ouvre en préparation', 'regl',
    "  if (window._mvPrepOn && window._mvPrepOn()) { if (window.showToast) window.showToast('Pr\\u00e9paration : ce bouton", "  if (false) { if (window.showToast) window.showToast('Pr\\u00e9paration : ce bouton",
    /Changer mon mot de passe/);
  mordS('★ la note retombe dans le piège « auth/ » + étoile', 'fb',
    "// ⚠️ Déclarée ICI et pas à côté des fonctions qui l'appellent",
    "// codes auth/" + "* écrits dans un commentaire, sans fermeture\n// ⚠️ Déclarée ICI et pas à côté des fonctions qui l'appellent", /VISIBLE du preflight/);
  mordS('★★ l’ouverture repasse par agtLogAccess (journal écrasé)', 'gt',
    "    try{ await window._agtLogAccessLu(slug,'Pr\\u00e9paration ouverte','crayon'); }", "    try{ agtLogAccess(slug,'Pr\\u00e9paration ouverte','crayon'); }",
    /journal RELU/);
  mordS('les nouveautés s’ouvrent en préparation', 'utils',
    "  if (_mvPrepOn()) return;   // PREP-1", '  // PREP-1', /nouveautés/);
  mordS('★ _fbLoad lance la préparation avant de charger la file', 'fb',
    "  _loadQueue();\n  // ★ PREP-1 (§134) — une préparation GUERETTECH", "  // ★ PREP-1 (§134) — une préparation GUERETTECH", /_fbLoad/);
}

console.log('\n' + '─'.repeat(30));
console.log('  ' + vert + ' vert' + (rouges.length ? ' · ' + rouges.length + ' ROUGE' : ' · 0 rouge'));
if (rouges.length) { rouges.forEach(r => console.log('   ✗ ' + r)); process.exit(1); }
