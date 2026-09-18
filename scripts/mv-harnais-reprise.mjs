// ═══════════════════════════════════════════════════════════════════════════
//  HARNAIS BOOT-1 + REPRISE-1 — LE DÉMARRAGE NE RESTE JAMAIS MUET, ET LE
//  RETOUR DE VEILLE VÉRIFIE QUE LE SERVEUR RÉPOND ENCORE (§145)
// ═══════════════════════════════════════════════════════════════════════════
//  Signalé sur iPhone : l'écran de connexion restait sur le logo, sans aucun
//  profil ; et ce qui était saisi sur l'ordinateur n'arrivait pas sur le
//  téléphone, qui disait pourtant « Synchronisé ».
//
//  Sur les VRAIES fonctions extraites de src/firebase.js et src/app.js, sous
//  une HORLOGE SIMULÉE : une attente qui ne se règle jamais se rejoue en une
//  milliseconde, et « l'écran n'est jamais vide après 20 s » se vérifie.
//  Bouchons : Firestore, App Check, stockage, DOM, rechargement.
//
//  CE QUE CE HARNAIS PROUVE
//   A. un appel au serveur se règle TOUJOURS, même si le jeton ne vient jamais ;
//   B. le démarrage va au bout quand tout pend ; la liste tardive remplace
//      celle de l'appareil, sauf tuile touchée ; une absence lue dans la copie
//      du téléphone n'ouvre jamais l'installation ; un filet final remplit
//      l'écran vide ;
//   C. une relecture servie par la copie du téléphone ne dit plus
//      « Synchronisé », et une absence n'y est pas un constat ;
//   D. Firestore hors service se DÉTECTE (lecture de la copie qui lève) ;
//   E. le retour de veille sonde, relance le flux, relit, ou le dit — et ne
//      relance la page que sans saisie ouverte, au plus toutes les 2 min ;
//   F. le script reCAPTCHA en échec relance l'écran de connexion, borné ;
//   G. une écoute qui lève sur un Firestore hors service ne boucle pas ;
//      seul un instantané confirmé par le serveur prouve la connexion ;
//   H. app.js : démarrage sans attendre `load`, reprise branchée au retour de
//      veille, assertion vérifiée, voyant « Pas de synchro », relance proposée.
//
//  ⚠ Contre-épreuve : chaque ancre doit être UNIQUE dans ce qu'elle mute, et
//    l'essai doit être VRAI sur le code sain — sinon ROUGE, jamais « détecté ».
//
//  Usage :  node scripts/mv-harnais-reprise.mjs
//           node scripts/mv-harnais-reprise.mjs --contre
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC0 = { fb: lire('src/firebase.js'), app: lire('src/app.js') };

/* ══ EXTRACTION ══ */
function fonction(src, nom, fichier) {
  const m = new RegExp('^(?:export\\s+)?(?:async\\s+)?function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) throw new Error('ABSENTE de ' + fichier + ' : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1).replace(/^export\s+/, '');
  }
  throw new Error('accolade non fermée : ' + nom);
}
function affectation(src, nom, fichier) {
  const i = src.indexOf('window.' + nom + ' = ');
  if (i < 0) throw new Error('AFFECTATION ABSENTE de ' + fichier + ' : window.' + nom);
  const k = src.indexOf('{', i); let d = 0;
  for (let j = k; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(i, src.indexOf(';', j) + 1);
  }
  throw new Error('accolade non fermée : window.' + nom);
}
function ligneVar(src, nom, fichier) {
  const m = new RegExp('^var ' + nom + '\\s*=[^\\n]*;', 'm').exec(src);
  if (!m) throw new Error('VAR ABSENTE de ' + fichier + ' : ' + nom);
  return m[0];
}

const FB_VARS = ['_MV_FN_MARGE_MS', '_MV_DEPASSE', '_MV_BOOT_BORNES', '_MV_RECHARGE_CLE', '_MV_INC_CLE', '_MV_REPRISE',
  '_MV_FUSION_EXCLUES', '_fbBases'];
const FB_FNS = ['_mvBorne', '_mvBootDebut', '_mvBootNote', '_mvBootGarde', '_mvTuileTouchee', '_mvMembresServeur',
  '_mvProfilsAfficher', '_mvDonneesAppareil', '_mvRosterTardif', '_mvAcEcouter', '_mvAcSonde', '_mvAcRelance', '_mvRechargePermise', '_mvRechargerBorne',
  '_mvSaisieEnCours', '_mvRechargeSure', '_mvIncident', '_mvIncidentsEnvoyer', '_mvFsEtat', '_mvFsCacheAbsent',
  '_mvFsMort', '_mvSrvPerdu', '_mvSrvRetrouve', '_mvSondeServeur', '_pullKeys', 'fbPushIfAbsent', 'showSyncBadge',
  '_fbSubscribe', '_mvBaseNoter'];
const FB_WIN = ['fbCallFn', '_mvRecharger', '_mvFsVerifier', '_mvReprise', '_fbLoad'];
const APP_FNS = ['_syncSetState', '_syncPending', '_syncRefresh', '_syncAgo', '_syncQueueBreakdown', '_syncOpenDetail',
  '_loginErreur', '_mvRendrePageActive'];

const blocFb = S => FB_VARS.map(n => ligneVar(S.fb, n, 'src/firebase.js')).join('\n') + '\n'
  + FB_FNS.map(n => fonction(S.fb, n, 'src/firebase.js')).join('\n') + '\n'
  + FB_WIN.map(n => affectation(S.fb, n, 'src/firebase.js')).join('\n');
const blocApp = S => 'var _syncTransient=false,_syncTT=null,_syncLastSync=null;\n'
  + APP_FNS.map(n => fonction(S.app, n, 'src/app.js')).join('\n');

/* ══ HORLOGE SIMULÉE ══ */
async function vider() { for (let k = 0; k < 30; k++) await new Promise(r => setImmediate(r)); }
function horloge() {
  let now = 1.7e12, id = 0; const taches = new Map();
  class FauxDate extends Date {
    constructor(...a) { if (a.length) super(...a); else super(now); }
    static now() { return now; }
  }
  return {
    Date: FauxDate,
    setTimeout(f, ms) { const i = ++id; taches.set(i, { t: now + (+ms || 0), f }); return i; },
    clearTimeout(i) { taches.delete(i); },
    enAttente() { return taches.size; },
    get now() { return now; },
    async avancer(ms) {
      const fin = now + ms;
      for (;;) {
        await vider();
        let p = null;
        for (const [i, x] of taches) if (x.t <= fin && (!p || x.t < p[1].t)) p = [i, x];
        if (!p) break;
        taches.delete(p[0]); now = p[1].t;
        p[1].f();   // une tâche qui lève fait échouer l'essai : un plantage compte comme un rouge
      }
      now = fin; await vider();
    }
  };
}
const jamais = () => new Promise(() => {});
const ASSERT = 'FIRESTORE (10.14.1) INTERNAL ASSERTION FAILED: Unexpected state';

/* ══ BAC DE TEST ══ */
function _Stock() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), _m: m };
}
function _El(id) {
  const el = { id, style: {}, children: [], className: '', _html: '', _txt: '', type: '', onclick: null,
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, contains(c) { return this._s.has(c); } },
    appendChild(c) { this.children.push(c); return c; },
    setAttribute(k, v) { this['attr_' + k] = String(v); },
    querySelector(sel) { return (this._sous || {})[sel] || null; },
    addEventListener(t, f) { (this._ecoute = this._ecoute || {})[t] = f; } };
  Object.defineProperty(el, 'innerHTML', { get() { return this._html; }, set(v) { this._html = String(v); } });
  Object.defineProperty(el, 'textContent', { get() { return this._txt; }, set(v) { this._txt = String(v); this.children = []; } });
  return el;
}

function monter(S, sc) {
  sc = sc || {};
  const H = horloge();
  const E = { reloads: 0, applique: [], badges: [], wbadges: [], logs: [], avales: [], initLogin: 0, loadData: 0,
    onboarding: 0, landing: 0, pull: 0, rendu: 0, abonnes: [], echecs: [], coupe: 0, rouvre: 0, envoi: [],
    ecritures: [], ecoutes: 0 };
  const els = { 'login-screen': _El('login-screen'), 'login-profiles': _El('login-profiles'),
    'login-pwd-error': _El('login-pwd-error'), 'sync-pop-body': _El('sync-pop-body') };
  const script = _El('recaptcha');
  const W = {
    APP_VERSION: '7.35', currentUser: sc.currentUser || null, _authReady: sc.authReady !== false,
    loginPendingIdx: sc.tuile,
    logError: o => E.logs.push(o), _mvAvale: (e, c) => E.avales.push(c),
    loadData: () => { E.loadData++; }, showOnboarding: () => { E.onboarding++; }, showPublicLanding: () => { E.landing++; },
    initLogin: () => { E.initLogin++; els['login-profiles'].children.push({ tuile: 1 }); },
    showSyncBadge: (m) => { E.wbadges.push(String(m)); },
    _fbTenantStatus: sc.statut || (() => Promise.resolve('active')),
    _mvPrepBoot: sc.prep || (async () => false),
    _mvRendrePageActive: () => { E.rendu++; return 'page-home'; },
    fbAppendError: (x) => { E.envoi.push(x); return Promise.resolve(); },
    addEventListener: (t, f) => { (W._ecoute = W._ecoute || {})[t] = f; },
  };
  const docu = {
    getElementById: id => els[id] || null,
    querySelector: sel => {
      if (sel.indexOf('recaptcha') >= 0) return sc.pasDeScript ? null : script;
      if (sel.indexOf('.overlay.open') >= 0) return sc.fenetreOuverte ? {} : null;
      return null;
    },
    querySelectorAll: sel => (sel === '.mv-syncdot' ? (sc.points || []) : []),
    createElement: t => _El(t),
    get activeElement() { return sc.actif || null; },
    body: _El('body'), documentElement: _El('html'),
  };
  const sandbox = {
    window: W, document: docu, localStorage: _Stock(), sessionStorage: _Stock(),
    navigator: { onLine: sc.horsLigne ? false : true, userAgent: 'Harnais/1.0 (iPhone)' },
    location: { reload: () => { E.reloads++; } },
    setTimeout: H.setTimeout, clearTimeout: H.clearTimeout, Date: H.Date, console,
    DEBUG: false, TENANT_ID: 'dom-test', FB_STATIC: ['config', 'cave_elevage'],
    _ignoreBefore: {}, _ignoreNext: {}, _fbUnsubs: {}, _fbListenTries: {}, _fbDeadKeys: sc.morts || {},
    db: {}, fns: {},
    _loadQueue: () => {}, _showOfflineQueueBadge: () => {},
    _mvRecoverTenantFromClaim: async () => null,
    _fbDeadCount: () => 0,
    applyFbData: (k, v) => { E.applique.push([k, v]); },
    fbDocRef: k => ({ k }),
    deepClone: v => JSON.parse(JSON.stringify(v)), _fbClone: (k, v) => v,
    setDoc: (ref, v) => { E.ecritures.push(ref.k); return Promise.resolve(); },
    getDoc: sc.getDoc || (ref => Promise.resolve({ exists: () => true, data: () => ({ value: [{ nom: 'A', email: 'a@x' }] }), metadata: { fromCache: false } })),
    getDocFromCache: sc.getDocFromCache || (() => Promise.reject(Object.assign(new Error('absent'), { code: 'unavailable' }))),
    getDocFromServer: sc.getDocFromServer || (() => Promise.resolve({ exists: () => true })),
    disableNetwork: () => { E.coupe++; return Promise.resolve(); },
    enableNetwork: () => { E.rouvre++; if (sc.apresRelance) sc.apresRelance(); return Promise.resolve(); },
    fbPullStatic: async () => { E.pull++; return {}; },
    _fbUnsubOne: () => {},
    _fbListenFailed: (k, e) => { E.echecs.push(k); },
    onSnapshot: sc.onSnapshot || ((ref, ok) => { E.ecoutes++; W._dernierSnap = ok; return () => {}; }),
    httpsCallable: sc.httpsCallable || (() => () => Promise.resolve({ data: { roster: [{ nom: 'A' }] } })),
    fetch: () => { E.sondes = (E.sondes || 0) + 1; return sc.sondeKo ? Promise.reject(new TypeError('Failed to fetch')) : Promise.resolve({ type: 'opaque' }); },
    _mvIcon: n => '<svg data-ic="' + n + '"></svg>', _escHtml: s => String(s), _PV_KEYLBL: {},
    openOv: id => { E.ov = id; },
    _ensureLeaflet: () => Promise.resolve(),
    renderHome: () => { E.rendu++; },
  };
  if (!sc.sansDomaine) sandbox.localStorage.setItem('mavigne_tenant', 'dom-test');
  vm.createContext(sandbox);
  vm.runInContext(blocFb(S) + '\n' + blocApp(S), sandbox);
  W.fbCallFn = sc.fbCallFn || W.fbCallFn;
  return { H, E, W, S: sandbox, els, script, sc };
}

let vert = 0; const rouges = [];
const pose = (ok, nom) => { if (ok) { vert++; console.log('  ✓ ' + nom); } else { rouges.push(nom); console.log('  ✗ ' + nom); } };
// Un essai qui ne se règle pas en 3 s RÉELLES compte comme un rouge : c'est exactement le défaut chassé.
// Un rejet que personne n'attrape aussi (§52 : un minuteur oublié rejette plus tard, dans le vide).
const PEND = { pend: true };
let REJETS = 0;
process.on('unhandledRejection', () => { REJETS++; });
async function jouer(f, S) {
  const r0 = REJETS;
  try {
    const r = await Promise.race([f(sc => monter(S, sc)), new Promise(res => setTimeout(() => res(PEND), 3000))]);
    await vider();
    return r !== PEND && !!r && REJETS === r0;
  } catch (e) { return false; }
}
async function essai(nom, f) {
  let ok = false;
  const r0 = REJETS;
  try {
    const r = await Promise.race([f(sc => monter(SRC0, sc)), new Promise(res => setTimeout(() => res(PEND), 3000))]);
    await vider();
    if (r === PEND) console.log('    (ne se règle pas)');
    if (REJETS !== r0) console.log('    (rejet non attrapé)');
    ok = r !== PEND && !!r && REJETS === r0;
  } catch (e) { ok = false; console.log('    (plantage : ' + (e && e.message) + ')'); }
  pose(ok, nom);
}

/* ══ LES ESSAIS — chacun rend VRAI sur le code sain ══ */
const snap = (existe, cache, valeur) => ({ exists: () => existe, data: () => ({ value: valeur }), metadata: { fromCache: !!cache } });
const ESSAIS = {
  /* A — un appel au serveur se règle toujours */
  appelFige: async mk => {
    const M = mk({ httpsCallable: () => () => jamais() });
    let err = null, fini = false;
    M.W.fbCallFn('getLoginRoster', {}, { timeout: 15000 }).then(() => { fini = true; }, e => { fini = true; err = e; });
    await M.H.avancer(24900); const avant = fini;
    await M.H.avancer(300);
    return !avant && fini && err && err.code === 'mv/timeout';
  },
  appelSansDelai: async mk => {
    const M = mk({ httpsCallable: () => () => jamais() });
    let err = null;
    M.W.fbCallFn('logVisite', {}).catch(e => { err = e; });
    await M.H.avancer(79000); const avant = err;
    await M.H.avancer(1500);
    return !avant && err && err.code === 'mv/timeout';
  },
  appelNormal: async mk => {
    const M = mk({ httpsCallable: () => () => new Promise(r => M.S.setTimeout(() => r({ data: 42 }), 1000)) });
    let v = null, err = null;
    M.W.fbCallFn('x', {}, { timeout: 15000 }).then(x => { v = x; }, e => { err = e; });
    await M.H.avancer(1200);
    return v === 42 && !err && M.H.enAttente() === 0;   // minuteur nettoyé : aucun rejet tardif
  },

  /* B — le démarrage */
  bootNominal: async mk => {
    const M = mk({ fbCallFn: () => Promise.resolve({ roster: [{ nom: 'A' }, { nom: 'B' }] }) });
    let fini = false; M.W._fbLoad().then(() => { fini = true; });
    await M.H.avancer(500);
    return fini && M.E.initLogin === 1 && M.E.loadData === 0 && M.E.applique.length === 1
      && M.E.applique[0][0] === 'membres' && M.W.__MV_BOOT.fin === true
      && !M.S.localStorage.getItem('mavigne_incidents_v1');
  },
  bootToutFige: async mk => {
    const M = mk({ statut: jamais, fbCallFn: jamais, getDoc: jamais });
    let fini = false; M.W._fbLoad().then(() => { fini = true; });
    await M.H.avancer(20000);
    const inc = JSON.parse(M.S.localStorage.getItem('mavigne_incidents_v1') || '[]').map(x => x.type);
    return fini && M.E.initLogin >= 1 && M.E.loadData >= 1 && inc.indexOf('profils-lents') >= 0 && inc.indexOf('membres-lents') >= 0;
  },
  bootListeTardive: async mk => {
    let rez; const tard = new Promise(r => { rez = r; });
    const M = mk({ fbCallFn: () => tard, getDoc: () => Promise.resolve(snap(true, true, [{ nom: 'A', email: 'a@x' }])) });
    M.W._fbLoad();
    await M.H.avancer(9000);
    const avant = M.E.applique.length;
    rez({ roster: [{ nom: 'A' }, { nom: 'Z' }] });
    await M.H.avancer(100);
    const der = M.E.applique[M.E.applique.length - 1];
    return avant === 1 && M.E.applique.length === 2 && der[1].length === 2 && der[1][1].nom === 'Z';
  },
  bootTuileTouchee: async mk => {
    let rez; const tard = new Promise(r => { rez = r; });
    const M = mk({ fbCallFn: () => tard, getDoc: () => Promise.resolve(snap(true, true, [{ nom: 'A', email: 'a@x' }])) });
    M.W._fbLoad();
    await M.H.avancer(9000);
    M.W.loginPendingIdx = 0;                       // quelqu'un a touché une tuile
    rez({ roster: [{ nom: 'Z' }, { nom: 'A' }] });
    await M.H.avancer(100);
    return M.E.applique.length === 1;
  },
  bootAbsentCopie: async mk => {
    const M = mk({ fbCallFn: () => Promise.reject(new Error('KO')), getDoc: () => Promise.resolve(snap(false, true)) });
    let fini = false; M.W._fbLoad().then(() => { fini = true; });
    await M.H.avancer(500);
    return fini && M.E.onboarding === 0 && M.E.loadData === 1 && M.E.initLogin === 1;
  },
  bootAbsentServeur: async mk => {
    const M = mk({ fbCallFn: () => Promise.reject(new Error('KO')), getDoc: () => Promise.resolve(snap(false, false)) });
    await M.W._fbLoad();
    return M.E.onboarding === 1 && M.E.initLogin === 0;
  },
  bootFiletFinal: async mk => {
    const M = mk({ prep: jamais });                // une attente que rien ne borne
    M.W._fbLoad();
    await M.H.avancer(14900); const avant = M.E.initLogin;
    await M.H.avancer(200);
    return avant === 0 && M.E.initLogin === 1 && M.E.loadData === 1;
  },
  bootApresConnexion: async mk => {
    const M = mk({ statut: jamais, fbCallFn: jamais, getDoc: jamais });
    M.W._fbLoad();
    await M.H.avancer(2000);
    M.W.currentUser = { nom: 'A' };                  // tuiles montrées (injectées, ou par le filet), connecté
    M.els['login-screen'].style.display = 'none';
    await M.H.avancer(20000);
    return M.E.loadData === 0 && M.E.initLogin === 0 && M.W.__MV_BOOT.fin === true;
  },
  bootFiletDiscret: async mk => {
    const M = mk({ fbCallFn: () => Promise.resolve({ roster: [] }) });   // domaine neuf : l'installation s'ouvre
    await M.W._fbLoad();
    await M.H.avancer(16000);
    return M.E.onboarding === 1 && M.E.loadData === 0 && M.E.initLogin === 0;
  },

  /* C — d'où vient ce qu'on lit */
  pullServeur: async mk => {
    const M = mk({ getDoc: ref => Promise.resolve(snap(true, false, [1])) });
    const st = await M.S._pullKeys(['config', 'journal'], 'essai', false);
    return st.config === 'ok' && st.journal === 'ok' && !M.W._mvSrvKO;
  },
  pullCopieDit: async mk => {
    const M = mk({ getDoc: ref => Promise.resolve(snap(true, ref.k === 'journal', [1])) });
    await M.S._pullKeys(['config', 'journal'], 'essai', false);
    M.S.showSyncBadge('\u2705 Synchronisé', '#3D6B27');
    M.S.showSyncBadge('Synchronisé', '#3D6B27');
    return !!M.W._mvSrvKO && M.E.wbadges.length === 2
      && M.E.wbadges.every(b => b === 'Serveur injoignable — données du téléphone');
  },
  pullAbsentCopie: async mk => {
    const M = mk({ getDoc: ref => Promise.resolve(snap(false, true)) });
    const st = await M.S._pullKeys(['cave_vendange'], 'essai', false);
    return st.cave_vendange === 'error';
  },
  pullAbsentServeur: async mk => {
    const M = mk({ getDoc: ref => Promise.resolve(snap(false, false)) });
    const st = await M.S._pullKeys(['cave_vendange'], 'essai', false);
    return st.cave_vendange === 'missing';
  },
  pullRetrouve: async mk => {
    let cache = true;
    const M = mk({ getDoc: ref => Promise.resolve(snap(true, cache, [1])) });
    await M.S._pullKeys(['config'], 'essai', false); const perdu = !!M.W._mvSrvKO;
    cache = false;
    await M.S._pullKeys(['config'], 'essai', false);
    M.S.showSyncBadge('Synchronisé', '#3D6B27');
    return perdu && !M.W._mvSrvKO && M.E.wbadges[M.E.wbadges.length - 1] === 'Synchronisé';
  },
  semisCopie: async mk => {
    const M = mk({ getDoc: ref => Promise.resolve(snap(false, true)) });
    await M.S.fbPushIfAbsent('journal', [{ a: 1 }], 'error');
    return M.E.ecritures.length === 0;
  },
  semisServeur: async mk => {
    const M = mk({ getDoc: ref => Promise.resolve(snap(false, false)) });
    await M.S.fbPushIfAbsent('journal', [{ a: 1 }], 'error');
    return M.E.ecritures.length === 1;
  },

  /* D — Firestore hors service se détecte */
  fsMort: async mk => {
    const M = mk({ getDocFromCache: () => { throw new Error(ASSERT); } });
    const r = M.W._mvFsVerifier('assertion');
    const inc = JSON.parse(M.S.localStorage.getItem('mavigne_incidents_v1') || '[]').map(x => x.type);
    await M.H.avancer(5000);
    return r === 'voyant' && !!M.W._mvSrvKO && !!M.W._mvFsDead && inc.indexOf('firestore-hors-service') >= 0 && M.E.reloads === 0;
  },
  fsVivant: async mk => {
    const M = mk({});
    const r = M.W._mvFsVerifier('assertion');
    await M.H.avancer(100);
    return r === 'vivant' && !M.W._mvSrvKO && !M.W._mvFsDead && M.E.avales.length === 0;
  },

  /* E — le retour de veille */
  repriseCourte: async mk => {
    let sondes = 0;
    const M = mk({ currentUser: { nom: 'A' }, getDocFromServer: () => { sondes++; return Promise.resolve({}); } });
    return (await M.W._mvReprise(10000)) === 'court' && sondes === 0;
  },
  repriseHorsSession: async mk => {
    const M = mk({});
    return (await M.W._mvReprise(600000)) === 'hors-session';
  },
  repriseHorsLigne: async mk => {
    const M = mk({ currentUser: { nom: 'A' }, horsLigne: true });
    return (await M.W._mvReprise(600000)) === 'hors-ligne';
  },
  repriseOk: async mk => {
    const M = mk({ currentUser: { nom: 'A' } });
    M.W._mvSrvKO = { motif: 'avant', depuis: 1 };
    const r = await M.W._mvReprise(600000);
    return r === 'ok' && M.E.pull === 1 && M.E.rendu === 1 && M.E.coupe === 0 && !M.W._mvSrvKO;
  },
  repriseRelance: async mk => {
    let vivant = false;
    const M = mk({ currentUser: { nom: 'A' }, getDocFromServer: () => (vivant ? Promise.resolve({}) : jamais()),
      apresRelance: () => { vivant = true; } });
    const p = M.W._mvReprise(600000);
    await M.H.avancer(20000);
    const r = await p;
    return r === 'ok' && M.E.coupe === 1 && M.E.rouvre === 1 && M.E.pull === 1;
  },
  repriseInjoignable: async mk => {
    const M = mk({ currentUser: { nom: 'A' }, getDocFromServer: jamais });
    const p = M.W._mvReprise(600000);
    await M.H.avancer(30000);
    const r = await p;
    const inc = JSON.parse(M.S.localStorage.getItem('mavigne_incidents_v1') || '[]').map(x => x.type);
    return r === 'injoignable' && !!M.W._mvSrvKO && M.E.pull === 0 && M.E.reloads === 0 && inc.indexOf('serveur-injoignable') >= 0
      && M.E.wbadges.indexOf('Serveur injoignable — données du téléphone') >= 0;
  },
  repriseFsMortRelance: async mk => {
    const M = mk({ currentUser: { nom: 'A' }, getDocFromCache: () => { throw new Error(ASSERT); } });
    const r = await M.W._mvReprise(600000);
    await M.H.avancer(1300);
    return r === 'recharge' && M.E.reloads === 1;
  },
  repriseFsMortFenetre: async mk => {
    const M = mk({ currentUser: { nom: 'A' }, fenetreOuverte: true, getDocFromCache: () => { throw new Error(ASSERT); } });
    const r = await M.W._mvReprise(600000);
    await M.H.avancer(3000);
    return r === 'voyant' && M.E.reloads === 0 && !!M.W._mvSrvKO;
  },
  repriseFsMortSaisie: async mk => {
    const M = mk({ currentUser: { nom: 'A' }, actif: { tagName: 'INPUT' }, getDocFromCache: () => { throw new Error(ASSERT); } });
    const r = await M.W._mvReprise(600000);
    await M.H.avancer(3000);
    return r === 'voyant' && M.E.reloads === 0;
  },
  repriseEcoutesMortes: async mk => {
    const M = mk({ currentUser: { nom: 'A' }, morts: { journal: true, sessions: true } });
    const r = await M.W._mvReprise(600000);
    return r === 'ok' && M.E.ecoutes === 2;
  },

  /* F — le script reCAPTCHA en échec */
  acRelance: async mk => {
    const M = mk({});
    const pose = M.S._mvAcEcouter();
    M.script.src = 'https://www.google.com/recaptcha/api.js?render=cle';
    M.script._ecoute.error();
    await M.H.avancer(3100);
    return pose === true && !!M.W._mvAcKO && M.E.sondes === 1 && M.E.reloads === 1;
  },
  acBloque: async mk => {
    const M = mk({ sondeKo: true });                 // bloqueur, réseau filtré — ou l'e2e, qui coupe exprès
    M.S._mvAcEcouter();
    M.script.src = 'https://www.google.com/recaptcha/api.js?render=cle';
    M.script._ecoute.error();
    await M.H.avancer(20000);
    const inc = JSON.parse(M.S.localStorage.getItem('mavigne_incidents_v1') || '[]').map(x => x.type);
    return M.E.reloads === 0 && M.E.sondes === 2 && inc.indexOf('appcheck-bloque') >= 0;
  },
  acBorne: async mk => {
    const M = mk({});
    M.S.sessionStorage.setItem('mv_recharge_auto', String(M.H.now - 30000));   // relancée il y a 30 s
    M.S._mvAcEcouter(); M.script.src = 'https://www.google.com/recaptcha/api.js'; M.script._ecoute.error();
    await M.H.avancer(3100);
    return M.E.reloads === 0 && (await M.S._mvAcRelance()) === 'borne';
  },
  acTuile: async mk => {
    const M = mk({ tuile: 2 });
    M.S._mvAcEcouter(); M.script.src = 'https://www.google.com/recaptcha/api.js'; M.script._ecoute.error();
    await M.H.avancer(3100);
    return M.E.reloads === 0 && !M.E.sondes;         // pas même une sonde : on ne touche à rien
  },
  acHorsLigne: async mk => {
    const M = mk({ horsLigne: true });
    M.S._mvAcEcouter(); M.script._ecoute.error();
    await M.H.avancer(3100);
    const avant = M.E.reloads;
    M.S.navigator.onLine = true;
    M.S.window._mvAcSrc = 'https://www.google.com/recaptcha/api.js';
    M.W._ecoute.online();
    await vider();
    return avant === 0 && M.E.reloads === 1;
  },

  /* G — les écoutes */
  ecouteFsMort: async mk => {
    const M = mk({ onSnapshot: () => { throw new Error(ASSERT); }, getDocFromCache: () => { throw new Error(ASSERT); } });
    M.S._fbSubscribe('journal');
    return M.E.echecs.length === 0 && !!M.W._mvFsDead && !!M.W._mvSrvKO;
  },
  ecouteAutreErreur: async mk => {
    const M = mk({ onSnapshot: () => { throw new Error('autre'); } });
    M.S._fbSubscribe('journal');
    return M.E.echecs.length === 1 && M.E.echecs[0] === 'journal' && !M.W._mvFsDead;
  },
  ecoutePreuve: async mk => {
    const M = mk({ currentUser: { nom: 'A' } });
    M.S._fbSubscribe('journal');
    M.W._mvSrvKO = { motif: 'x', depuis: 1 };
    M.W._dernierSnap({ exists: () => true, data: () => ({ value: [] }), metadata: { fromCache: true, hasPendingWrites: false } });
    const apresCopie = !!M.W._mvSrvKO;
    M.W._dernierSnap({ exists: () => true, data: () => ({ value: [] }), metadata: { fromCache: false, hasPendingWrites: true } });
    const apresEcho = !!M.W._mvSrvKO;
    M.W._dernierSnap({ exists: () => true, data: () => ({ value: [] }), metadata: { fromCache: false, hasPendingWrites: false } });
    return apresCopie && apresEcho && !M.W._mvSrvKO;
  },
  ecouteBadgeCopie: async mk => {
    const M = mk({ currentUser: { nom: 'A' } });
    M.S._fbSubscribe('journal');
    M.W._dernierSnap({ exists: () => true, data: () => ({ value: [] }), metadata: { fromCache: true, hasPendingWrites: false } });
    await M.H.avancer(2000);
    return M.E.applique.length === 1 && M.E.wbadges.length === 0;
  },

  /* H — le voyant et la connexion (app.js) */
  voyantKO: async mk => {
    const pt = _El('pt'); pt._sous = { '.mvs-lbl': _El('l'), '.mvs-cnt': _El('c') };
    const M = mk({ points: [pt] });
    M.W._offlineQueueCount = () => 0;
    M.W._mvSrvKO = { motif: 'x', depuis: 1 };
    M.S._syncRefresh();
    const ko = pt.classList.contains('offline') && pt._sous['.mvs-lbl'].textContent === 'Pas de synchro';
    M.W._mvSrvKO = null;
    M.S._syncRefresh();
    return ko && pt.classList.contains('synced');
  },
  voyantFenetre: async mk => {
    const M = mk({});
    M.W._offlineQueueCount = () => 0;
    M.W._mvSrvKO = { motif: 'x', depuis: 1 };
    M.S._syncOpenDetail();
    const h = M.els['sync-pop-body'].innerHTML;
    return h.indexOf('Pas de connexion au serveur') >= 0 && h.indexOf('onclick="_mvRecharger()"') >= 0
      && h.indexOf('Tout est enregistré') < 0 && M.E.ov === 'ovSync';
  },
  loginRelance: async mk => {
    const M = mk({});
    let relance = 0; M.W._mvRecharger = () => { relance++; };
    M.S._loginErreur('Le serveur ne répond pas.', true);
    const el = M.els['login-pwd-error'], b = el.children[0];
    b && b.onclick && b.onclick();
    const sansBouton = mk({}); sansBouton.S._loginErreur('Mot de passe incorrect.', false);
    return el.style.display === 'block' && b && b.className === 'login-btn' && relance === 1
      && sansBouton.els['login-pwd-error'].children.length === 0;
  },
};

/* Contrôles de câblage (app.js) — sur la SOURCE, sans commentaires. */
const sansCommentaires = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
function statiques(S) {
  const a = sansCommentaires(S.app), r = [];
  const iV = a.indexOf("if(isStandaloneIOS && _lastHidden>0 && elapsed>30*60*1000){");
  const zv = iV < 0 ? '' : a.slice(iV, iV + 500);
  r.push([iV >= 0 && /window\.location\.reload\(\);\s*return;/.test(zv) && zv.indexOf('window._mvReprise(elapsed)') > 0,
    '★★ retour de veille : la relance des 30 min, PUIS la reprise']);
  r.push([/window\.addEventListener\('load', _mvDemarrer\);/.test(a)
    && /setTimeout\(function\(\)\{\s*if\(_mvDemarre\) return;[\s\S]{0,200}_mvDemarrer\(\);\s*\}, (\d+)\);/.test(a)
    && +(/_mvDemarrer\(\);\s*\}, (\d+)\);/.exec(a) || [0, 99999])[1] <= 3000
    && /function _mvDemarrer\(\)\{\s*if\(_mvDemarre\) return;\s*_mvDemarre=true;/.test(a),
    '★★ démarrage : `load` OU 2,5 s, une seule exécution']);
  r.push([!/window\.addEventListener\('load', function\(\)\{\s*\n\s*if\(typeof initTheme/.test(a), 'plus aucun démarrage suspendu à `load` seul']);
  const iA = a.indexOf('if (/INTERNAL ASSERTION FAILED/i.test(_rmsg)) {');
  r.push([iA >= 0 && a.slice(iA, iA + 400).indexOf("window._mvFsVerifier('assertion')") > 0, '★★ l’assertion interne est VÉRIFIÉE, plus supposée bénigne']);
  const iC = a.indexOf("e.code === 'auth/network-request-failed'");
  r.push([iC >= 0 && a.slice(iC, iC + 400).indexOf('_loginRelancer = navigator.onLine;') > 0
    && a.indexOf('_loginErreur(_loginErr, _loginRelancer);') > 0, '★ connexion : avec du réseau, « le serveur ne répond pas » + relancer']);
  const iS = a.indexOf('window._loginRetryCount >= 4 ?');
  r.push([iS >= 0 && a.slice(iS, iS + 600).indexOf('onclick="_mvRecharger()"') > 0, 'le sablier de connexion propose la relance']);
  return r;
}

if (!CONTRE) {
  console.log('\n── A · un appel au serveur se règle toujours ──');
  await essai('★★★ jeton App Check jamais obtenu : rejet « mv/timeout » à 15 s + 10 s, pas avant', ESSAIS.appelFige);
  await essai('★ sans délai demandé : borné à 70 s + 10 s', ESSAIS.appelSansDelai);
  await essai('un appel normal rend sa valeur, et son minuteur est nettoyé', ESSAIS.appelNormal);
  console.log('\n── B · le démarrage ──');
  await essai('tout répond : une liste, un affichage, aucun repli, aucun incident', ESSAIS.bootNominal);
  await essai('★★★ tout pend (statut, profils, membres) : le démarrage va AU BOUT, profils de l’appareil', ESSAIS.bootToutFige);
  await essai('★★ la liste arrivée après la borne remplace celle de l’appareil', ESSAIS.bootListeTardive);
  await essai('★★ … sauf si une tuile est déjà touchée', ESSAIS.bootTuileTouchee);
  await essai('★★ « absent » lu dans la copie du téléphone n’ouvre PAS l’installation', ESSAIS.bootAbsentCopie);
  await essai('« absent » confirmé par le serveur ouvre l’installation (inchangé)', ESSAIS.bootAbsentServeur);
  await essai('★★★ une attente que rien ne borne : le filet final remplit l’écran à 15 s', ESSAIS.bootFiletFinal);
  await essai('le filet ne touche pas un écran déjà pris (installation)', ESSAIS.bootFiletDiscret);
  await essai('★★★ connecté avant la fin du démarrage : la mémoire n’est pas remplacée par la copie du disque', ESSAIS.bootApresConnexion);
  console.log('\n── C · d’où vient ce qu’on lit ──');
  await essai('relecture servie par le serveur : rien à signaler', ESSAIS.pullServeur);
  await essai('★★★ servie par la copie du téléphone : ni « Synchronisé » ni « ✅ Synchronisé »', ESSAIS.pullCopieDit);
  await essai('★★ une absence lue dans la copie n’est pas un constat', ESSAIS.pullAbsentCopie);
  await essai('une absence confirmée par le serveur l’est (inchangé)', ESSAIS.pullAbsentServeur);
  await essai('le serveur revenu, le voyant se rétablit', ESSAIS.pullRetrouve);
  await essai('★★ aucune valeur par défaut écrite sur une absence lue dans la copie', ESSAIS.semisCopie);
  await essai('… mais écrite sur une absence confirmée (inchangé)', ESSAIS.semisServeur);
  console.log('\n── D · Firestore hors service ──');
  await essai('★★★ la lecture de la copie lève : hors service, noté, voyant — sans relance pendant le travail', ESSAIS.fsMort);
  await essai('vivant : rien n’est posé, rien n’est journalisé', ESSAIS.fsVivant);
  console.log('\n── E · le retour de veille ──');
  await essai('absence courte : aucune sonde', ESSAIS.repriseCourte);
  await essai('personne de connecté : rien', ESSAIS.repriseHorsSession);
  await essai('hors ligne : rien (le badge hors ligne dit déjà la vérité)', ESSAIS.repriseHorsLigne);
  await essai('★★ le serveur répond : relecture, écran repeint, voyant rétabli, sans couper le réseau', ESSAIS.repriseOk);
  await essai('★★★ flux fantôme : coupé, rouvert, et la relecture a lieu', ESSAIS.repriseRelance);
  await essai('★★ injoignable : dit, noté, voyant — rien n’est relu, rien n’est relancé', ESSAIS.repriseInjoignable);
  await essai('★★★ Firestore hors service au retour : l’application se relance', ESSAIS.repriseFsMortRelance);
  await essai('★★ … mais jamais avec une fenêtre de saisie ouverte', ESSAIS.repriseFsMortFenetre);
  await essai('★ … ni quand on tape dans un champ', ESSAIS.repriseFsMortSaisie);
  await essai('les écoutes détachées pendant l’absence repartent', ESSAIS.repriseEcoutesMortes);
  console.log('\n── F · le script reCAPTCHA en échec ──');
  await essai('★★★ échec du script, adresse joignable : l’écran de connexion se relance', ESSAIS.acRelance);
  await essai('★★★ adresse bloquée (bloqueur, réseau filtré, e2e) : AUCUNE relance, deux sondes, noté', ESSAIS.acBloque);
  await essai('★★ une relance au plus toutes les 2 min : jamais de boucle', ESSAIS.acBorne);
  await essai('★ jamais quand une tuile est touchée', ESSAIS.acTuile);
  await essai('hors ligne : la relance attend le réseau', ESSAIS.acHorsLigne);
  console.log('\n── G · les écoutes ──');
  await essai('★★ Firestore hors service : l’écoute ne boucle pas, le voyant le dit', ESSAIS.ecouteFsMort);
  await essai('autre erreur : la reprise des écoutes d’avant (inchangé)', ESSAIS.ecouteAutreErreur);
  await essai('★★ seul un instantané CONFIRMÉ par le serveur rétablit le voyant', ESSAIS.ecoutePreuve);
  await essai('un instantané de la copie met à jour sans annoncer « Mis à jour »', ESSAIS.ecouteBadgeCopie);
  console.log('\n── H · app.js ──');
  await essai('★★ voyant : « Pas de synchro » avec du réseau et sans serveur, vert ensuite', ESSAIS.voyantKO);
  await essai('★★ sa fenêtre ne dit plus « Tout est enregistré » et propose la relance', ESSAIS.voyantFenetre);
  await essai('★ l’échec de connexion propose la relance quand c’est le serveur', ESSAIS.loginRelance);
  for (const [c, q] of statiques(SRC0)) pose(c, q);
}

/* ══ CONTRE-ÉPREUVE ═══════════════════════════════════════════════════════
   Chaque défaut est réintroduit dans la SOURCE lue : le harnais doit rougir. */
if (CONTRE) {
  console.log('\n── CONTRE-ÉPREUVE : chaque défaut réintroduit doit mordre ──');
  const mord = async (titre, cle, ancre, remplace, f) => {
    const n = SRC0[cle].split(ancre).length - 1;
    if (n !== 1) { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → ANCRE ' + (n ? 'NON UNIQUE (' + n + ')' : 'INTROUVABLE')); return; }
    if (!(await jouer(f, SRC0))) { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → ESSAI FAUX SUR LE CODE SAIN'); return; }
    const S = Object.assign({}, SRC0, { [cle]: SRC0[cle].replace(ancre, remplace) });
    if (!(await jouer(f, S))) { vert++; console.log('  vert   ' + titre + ' → détecté'); }
    else { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
  };
  await mord('★★★ l’appel au serveur n’est plus borné en entier', 'fb',
    '  return Promise.race([appel, borne]).finally(function () { clearTimeout(t); });', '  return appel;', ESSAIS.appelFige);
  await mord('★★★ la liste des profils attend sans borne', 'fb',
    'var _rr = await _mvBorne(_rosterP, _MV_BOOT_BORNES.profils, _MV_DEPASSE);', 'var _rr = await _rosterP;', ESSAIS.bootToutFige);
  await mord('★★★ plus de filet final', 'fb',
    '  setTimeout(function () { _mvBootGarde(B); }, _MV_BOOT_BORNES.garde);\n', '', ESSAIS.bootFiletFinal);
  await mord('★★ une absence lue dans la copie ouvre l’installation', 'fb',
    '} else if (membresSnap.metadata && membresSnap.metadata.fromCache) {', '} else if (false) {', ESSAIS.bootAbsentCopie);
  await mord('★★ la liste tardive remplace celle d’une tuile touchée', 'fb',
    "  if (window.currentUser || _mvTuileTouchee()) return false;\n  applyFbData('membres', liste);",
    "  if (window.currentUser) return false;\n  applyFbData('membres', liste);", ESSAIS.bootTuileTouchee);
  await mord('★ la liste tardive est perdue', 'fb',
    "_mvBootNote(B, 'profils-lents'); _mvRosterTardif(_rosterP); _rr = null;", "_mvBootNote(B, 'profils-lents'); _rr = null;", ESSAIS.bootListeTardive);
  await mord('★★ une absence lue dans la copie redevient un constat', 'fb',
    "state[r.key] = _deCache ? 'error' : 'missing';", "state[r.key] = 'missing';", ESSAIS.pullAbsentCopie);
  await mord('★★★ la relecture servie par la copie ne dit plus rien', 'fb',
    'if (nCache > 0) _mvSrvPerdu(', 'if (false) _mvSrvPerdu(', ESSAIS.pullCopieDit);
  await mord('★★★ le badge redit « Synchronisé » sur la copie', 'fb',
    "if (String(msg).slice(-11) === 'Synchronisé' && window._mvSrvKO) {", 'if (false) {', ESSAIS.pullCopieDit);
  await mord('★★ les valeurs par défaut s’écrivent sur une absence de la copie', 'fb',
    'if (!snap.exists() && !(snap.metadata && snap.metadata.fromCache) && value !== undefined) {',
    'if (!snap.exists() && value !== undefined) {', ESSAIS.semisCopie);
  await mord('★★★ Firestore hors service ne se détecte plus', 'fb',
    "return /INTERNAL ASSERTION FAILED/i.test(String((e && e.message) || e)) ? 'mort' : 'vivant';", "return 'vivant';", ESSAIS.fsMort);
  await mord('★★★ le flux fantôme n’est plus relancé', 'fb',
    'try { await _mvBorne(disableNetwork(db).then(function () { return enableNetwork(db); }), _MV_REPRISE.relance, null); }',
    'try { }', ESSAIS.repriseRelance);
  await mord('★★ le retour de veille ne relit plus', 'fb',
    '    await _mvBorne(fbPullStatic(), _MV_REPRISE.relecture, null);\n', '', ESSAIS.repriseOk);
  await mord('★ chaque passage d’application déclenche une sonde', 'fb',
    "  if (!(absenceMs >= _MV_REPRISE.seuil)) return 'court';\n", '', ESSAIS.repriseCourte);
  await mord('★★★ la relance tombe sur une fenêtre de saisie ouverte', 'fb',
    "if (origine === 'reprise' && _mvRechargeSure() && _mvRechargePermise()) {", "if (origine === 'reprise' && _mvRechargePermise()) {",
    ESSAIS.repriseFsMortFenetre);
  await mord('★★★ la relance automatique n’a plus de borne (boucle)', 'fb',
    '  if (!_mvRechargePermise()) return false;\n  try { sessionStorage.setItem(_MV_RECHARGE_CLE', '  try { sessionStorage.setItem(_MV_RECHARGE_CLE',
    ESSAIS.acBorne);
  await mord('★★ l’échec du script ne relance plus rien', 'fb',
    "      setTimeout(function () { _mvAcRelance().catch(", "      void(function () { _mvAcRelance().catch(", ESSAIS.acRelance);
  await mord('★★★ relance sans sonde : l’écran se rejoue sous les doigts (vu par l’e2e)', 'fb',
    '    if (!joignable) {\n', '    if (false) {\n', ESSAIS.acBloque);
  await mord('★★★ les données de l’appareil remplacent la mémoire après connexion (vu par l’e2e)', 'fb',
    "function _mvDonneesAppareil() {\n  if (window.currentUser || _mvTuileTouchee()) return false;", "function _mvDonneesAppareil() {", ESSAIS.bootApresConnexion);
  await mord('★ la relance ignore une tuile touchée', 'fb',
    "if (!window._mvAcKO || window.currentUser || _mvTuileTouchee()) return Promise.resolve('non');", "if (!window._mvAcKO || window.currentUser) return Promise.resolve('non');",
    ESSAIS.acTuile);
  await mord('★★ l’écoute reboucle sur un Firestore hors service', 'fb',
    "    if (_mvFsEtat() === 'mort') _mvFsMort('ecoute');\n    else _fbListenFailed(key, e);", '    _fbListenFailed(key, e);', ESSAIS.ecouteFsMort);
  await mord('★★ l’écho d’une écriture locale passe pour une preuve du serveur', 'fb',
    'var _duServeur = !_md.fromCache && !_md.hasPendingWrites;', 'var _duServeur = !_md.fromCache;', ESSAIS.ecoutePreuve);
  await mord('★★★ le voyant repasse au vert sans serveur', 'app',
    'if(!navigator.onLine||pending>0||_srvKO){', 'if(!navigator.onLine||pending>0){', ESSAIS.voyantKO);
  await mord('★★ sa fenêtre redit « Tout est enregistré »', 'app',
    'if(online&&window._mvSrvKO){', 'if(false){', ESSAIS.voyantFenetre);
  await mord('★ l’échec de connexion ne propose plus la relance', 'app',
    "  if(relancer){\n    var b=document.createElement('button');", "  if(false){\n    var b=document.createElement('button');", ESSAIS.loginRelance);

  const mordS = (titre, ancre, remplace, motif) => {
    const n = SRC0.app.split(ancre).length - 1;
    if (n !== 1) { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → ANCRE ' + (n ? 'NON UNIQUE (' + n + ')' : 'INTROUVABLE')); return; }
    const cible = r => r.filter(([, q]) => motif.test(q));
    const sain = cible(statiques(SRC0));
    if (!sain.length || !sain.every(([c]) => c)) { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → CONTRÔLE ABSENT OU FAUX SUR LE CODE SAIN'); return; }
    let rouge = false;
    try { rouge = cible(statiques(Object.assign({}, SRC0, { app: SRC0.app.replace(ancre, remplace) }))).some(([c]) => !c); }
    catch (e) { rouge = true; }
    if (rouge) { vert++; console.log('  vert   ' + titre + ' → détecté'); }
    else { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
  };
  mordS('★★★ le démarrage attend de nouveau `load`', "window.addEventListener('load', _mvDemarrer);\nsetTimeout(function(){",
    "window.addEventListener('load', _mvDemarrer);\nvoid(function(){", /démarrage : `load` OU/);
  mordS('★★★ la reprise n’est plus appelée au retour de veille', 'window._mvReprise(elapsed).catch(',
    'window._mvRepriseX(elapsed).catch(', /retour de veille/);
  mordS('★★ la relance des 30 min laisse filer la reprise', "        window.location.reload();\n        return;\n      }\n      // ★★★ REPRISE-1",
    "        window.location.reload();\n      }\n      // ★★★ REPRISE-1", /retour de veille/);
  mordS('★★★ l’assertion interne redevient supposée bénigne', "try { if (window._mvFsVerifier) window._mvFsVerifier('assertion'); }",
    'try { }', /assertion interne/);
  mordS('★ « pas de connexion réseau » à qui a du réseau', '_loginRelancer = navigator.onLine;', '_loginRelancer = false;', /connexion : avec du réseau/);
  mordS('le sablier ne propose plus la relance', 'onclick="_mvRecharger()" style="margin-top:14px"', 'style="margin-top:14px"', /sablier/);
}

console.log('\n' + '─'.repeat(30));
console.log('  ' + vert + ' vert' + (rouges.length ? ' · ' + rouges.length + ' ROUGE' : ' · 0 rouge'));
if (rouges.length) { rouges.forEach(r => console.log('   ✗ ' + r)); process.exit(1); }
process.exit(0);
