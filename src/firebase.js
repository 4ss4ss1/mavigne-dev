// ════════════════════════════════════
// FIREBASE — SDK modulaire v10
// Remplace les 3 CDN firebase-*-compat + le bloc <script> inline
// Toutes les fonctions sont exposées sur window.* pour compatibilité
// avec le reste du code index.html (pas de refacto des autres modules)
// ════════════════════════════════════

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  runTransaction,
  getDocs,
} from 'firebase/firestore';
import { getStorage, ref as _storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { deepClone } from './utils.js';
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
} from 'firebase/auth';

const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if(DEBUG) console.log('🔥 Firebase modulaire v10 chargé');

// ── Configuration ──
const firebaseConfig = {
  apiKey:            'AIzaSyBtMdRk1ubHowIgXuZqB4NTWMNn7fD3I7Y',
  authDomain:        'mavigne-a0fd5.firebaseapp.com',
  projectId:         'mavigne-a0fd5',
  storageBucket:     'mavigne-a0fd5.firebasestorage.app',
  messagingSenderId: '171431979576',
  appId:             '1:171431979576:web:76f291373b187b0ce514cd',
};

const app     = initializeApp(firebaseConfig);

// ── App Check (#4) — DORMANT tant que la clé n'est pas renseignée ──
// Tant que APPCHECK_SITE_KEY est vide : App Check n'est pas initialisé → aucun
// changement de comportement. Activation = coller la clé reCAPTCHA v3 ci-dessous.
// ATTENTION : n'activer l'ENFORCEMENT (console Firebase) qu'APRÈS déploiement + vérif monitoring.
const APPCHECK_SITE_KEY = '6Lcfth4tAAAAADxqNDW4G4vS6Xk_oklQ9qFTLE8q';
if (APPCHECK_SITE_KEY) {
  try {
    if (DEBUG) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true; // jeton debug en dev (localhost)
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(APPCHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
    if (DEBUG) console.log('[AppCheck] initialise');
  } catch (e) { console.warn('App Check init echouee (non bloquant) :', e); }
}

// ── Cloud Functions (europe-west1) — lot 5 sécurité ──
const fns = getFunctions(app, 'europe-west1');
// Appel générique : window.fbCallFn('nomFonction', {…}, {timeout:ms}) → data
window.fbCallFn = function (name, data, opts) {
  return httpsCallable(fns, name, opts || undefined)(data || {}).then(function (r) { return r.data; });
};
// Mode émulateur (DEV/E2E) détecté tôt : Firestore en long-polling pour fiabiliser
// la connexion navigateur → émulateur (le streaming WebChannel échoue souvent contre l'émulateur).
const _MV_EMU = DEBUG && (window.__MV_USE_EMULATOR || new URLSearchParams(location.search).has('emu'));
// PERF-1 (#3) — CACHE PERSISTANT IndexedDB.
// Sans cache persistant, chaque lancement repart de zero : tout getDoc exige le reseau, et
// un reseau fantome (navigator.onLine=true mais lien mort -- le quotidien en Cote de Nuits)
// faisait echouer TOUT le pull -> l'app tournait sur le seul localStorage.
// Avec le cache : les lectures se resolvent depuis IndexedDB des que le lien est mort, les
// listeners repartent d'un resume token (deltas au lieu des docs entiers) et les lectures
// facturees chutent. Repli automatique du SDK en cache MEMOIRE si IndexedDB est refuse
// (navigation privee, 2e onglet, quota) -> jamais bloquant.
// ATTENTION : ne rien changer au chemin emulateur (DEV/E2E) -- il reste inerte en prod.
const db = (function () {
  if (_MV_EMU) return initializeFirestore(app, { experimentalForceLongPolling: true });
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch (e) {
    console.warn('[Firestore] Cache persistant refuse -> repli cache memoire :', (e && (e.code || e.message)) || e);
    return getFirestore(app);
  }
})();
const auth    = getAuth(app);
const _storage = getStorage(app);

// ── Émulateurs Firebase (DEV/E2E uniquement) — JAMAIS actif en prod ──
if (_MV_EMU) {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(fns, '127.0.0.1', 5001);
    console.log('[EMU] Émulateurs connectés (Auth 9099 / Firestore 8080 / Functions 5001)');
  } catch (e) { console.warn('[EMU] connexion émulateur échouée :', e); }
}

// ── TenantId — multi-tenant ──
(function () {
  try {
    var _sp = new URLSearchParams(window.location.search);
    // Démo visite guidée — accès libre sans code (lien public) : on basculera sur le
    // bac à sable « domaine-dupont » et on posera un drapeau pour lancer la visite côté app.
    var _demoVisite = (_sp.get('demo') === 'visite');
    // 1. URL param ?tenant=slug → priorité absolue, validation format strict
    var urlTenant = _sp.get('tenant');
    if (urlTenant) {
      urlTenant = urlTenant.trim().toLowerCase();
      if (/^[a-z0-9][a-z0-9-]*$/.test(urlTenant) && urlTenant.length <= 50) {
        localStorage.setItem('mavigne_tenant', urlTenant);
        var clean = window.location.pathname + (window.location.hash || '');
        window.history.replaceState({}, '', clean);
        if(DEBUG) console.log('[Tenant] Posé depuis URL :', urlTenant);
      } else {
        console.warn('[Tenant] Slug URL invalide ignoré :', urlTenant);
      }
    }
    // 2. Fallback uniquement si migration Marchand-Grillot déjà effectuée
    //    (flag mavigne_migrated_v1 posé par _migrateTaskNames au premier lancement).
    //    Protège les membres actuels en cas de clear localStorage inattendu.
    //    Pour les nouveaux clients (localStorage vierge), _fbLoad() déclenche l'onboarding.
    //    Le manifest start_url='./?tenant=marchand-grillot' re-pose le tenant
    //    à chaque lancement depuis l'icône PWA — ce fallback est un filet secondaire.
    if (!localStorage.getItem('mavigne_tenant') && localStorage.getItem('mavigne_migrated_v1')) {
      localStorage.setItem('mavigne_tenant', 'marchand-grillot');
      if(DEBUG) console.log('[Tenant] Fallback → marchand-grillot (migration v1 détectée)');
    }
    // 3. Démo visite guidée : force le bac à sable + drapeau de lancement (gagne sur tout le reste).
    if (_demoVisite) {
      localStorage.setItem('mavigne_tenant', 'domaine-dupont');
      try { sessionStorage.setItem('mavigne_demo_visite', '1'); } catch (e) {}
      if(DEBUG) console.log('[Tenant] Démo visite guidée → domaine-dupont');
    }
  } catch (e) {}
})();

// Guard format — rejeter tout slug au format invalide (multi-tenant : plus de whitelist fixe).
// Format attendu : lettres minuscules, chiffres, tirets ; 1 à 50 caractères.
// Un nouveau client arrive avec ?tenant=son-slug → passe le guard → onboarding s'ouvre.
(function () {
  var t = localStorage.getItem('mavigne_tenant');
  if (t && (!/^[a-z0-9][a-z0-9-]*$/.test(t) || t.length > 50)) {
    console.warn('[Ma Vigne] Slug tenant invalide :', t, '→ supprimé');
    localStorage.removeItem('mavigne_tenant');
    location.reload();
  }
})();

var TENANT_ID = (function () {
  // Si localStorage est vide, _fbLoad() retourne avant toute opération Firebase
  // et affiche l'onboarding. Ce fallback est un filet de sécurité qui ne s'active pas
  // en usage normal depuis que le manifest inclut ?tenant=marchand-grillot.
  // #10 : plus de defaut 'marchand-grillot' code en dur. localStorage vide → _fbLoad()
  // affiche l'onboarding avant toute operation Firebase. Le filet 'marchand-grillot'
  // reste pose par l'IIFE de migration ci-dessus (si mavigne_migrated_v1 existe).
  return localStorage.getItem('mavigne_tenant') || '';
})();

// ── Notifier le SW du tenant courant → manifest.json dynamique ──
// Envoyé dès que TENANT_ID est résolu, avant tout chargement Firebase.
// Le SW stocke la valeur dans TENANT_CACHE (CacheStorage persistant).
(function () {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function (reg) {
      if (reg.active) {
        reg.active.postMessage({ type: 'SET_TENANT', tenant: TENANT_ID });
        if(DEBUG) console.log('[Tenant→SW] Notifié :', TENANT_ID);
      }
    }).catch(function () {});
  }
})();

// ── Helpers Firestore ──
function fbDocRef(key) {
  return doc(db, 'mavigne_' + TENANT_ID, key);
}

// deepClone — centralisé dans utils.js (Patch 3)

// ── Garde Firestore : tableaux imbriqués interdits ──
// Firestore rejette tout array-of-arrays. Or pilote_default.kpis / .panels
// (= [['surface',1],...]) en sont → l'écriture du doc 'config' entier échoue
// en boucle ("Synchro échouée: config") et bloque AUSSI toutes les autres
// écritures config (GNR, nom du domaine, priorité, timings RH...).
// On encode les tableaux imbriqués en objets indexés AVANT envoi. Ciblé sur
// 'config' uniquement : les coordonnées KML/parcelles ([lat,lng]) restent
// intactes (elles sont relues telles quelles par Leaflet).
function _fsNoNestedArrays(v){
  if (Array.isArray(v)) {
    var hasInner = false;
    for (var i=0;i<v.length;i++){ if (Array.isArray(v[i])) { hasInner = true; break; } }
    if (hasInner) {
      return v.map(function(x){
        if (Array.isArray(x)) { var o={}; for (var j=0;j<x.length;j++) o[j]=_fsNoNestedArrays(x[j]); return o; }
        return _fsNoNestedArrays(x);
      });
    }
    return v.map(_fsNoNestedArrays);
  }
  if (v && typeof v === 'object') {
    var out={}; for (var k in v) { if (Object.prototype.hasOwnProperty.call(v,k)) out[k]=_fsNoNestedArrays(v[k]); }
    return out;
  }
  return v;
}
// Clone Firestore-safe : deepClone (retire les undefined) puis, pour 'config'
// seulement, neutralise les tableaux imbriqués. Auto-réparateur : une config
// déjà « empoisonnée » en mémoire/queue repart dès la 1re écriture.
function _fbClone(key, v){
  var c = deepClone(v);
  return key === 'config' ? _fsNoNestedArrays(c) : c;
}

// ── Collections ──
const COLLECTIONS = [
  'parcelles','journal','sessions','travaux','traitements',
  'catalogue','conducteurs','activites','membres','saisons',
  'taches','config','historique','tracteurs_list','entretiens','reparateur','reparateur_hist',
  'cave_elevage','cave_vendange','planning_templates','planning_entries','planning_acomptes','planning_hsup',
  'kml_polygons',
  'intrants',
  // `paie` — taux horaires nominatifs + appoints de cuve GNR (prix d'achat).
  // Admin-only en LECTURE comme en écriture (firestore.rules). Un non-admin reçoit
  // ici un permission-denied absorbé par le catch level:'info' de _pullKeys : la clé
  // n'est simplement pas appliquée. Volontairement ABSENTE de _initData (aucun
  // fbPushIfAbsent) et de la snapshot localStorage de saveData : les rémunérations
  // ne descendent jamais sur le disque de l'appareil. Presente dans FB_STATIC (pull),
  // JAMAIS dans FB_REALTIME -- voir la note de couverture au-dessus de FB_REALTIME.
  'paie',
];

// ── Couverture de synchronisation ──
// INVARIANT : toute cle de COLLECTIONS doit appartenir a FB_REALTIME **ou** a FB_STATIC.
// Une cle absente des deux n'est lue QU'AU BOOT : elle ne recoit ni listener, ni
// pull-to-refresh -> deux appareils divergent en silence et le dernier fbSave ecrase
// l'autre, sans toast et sans trace. (Vecu : `intrants` et `paie`, ajoutees a
// COLLECTIONS sans etre reportees ici.)
//
// `intrants`  -> TEMPS REEL. Le doc est lisible par tout membre du tenant (seule
//                l'ECRITURE est admin-only, cf. isAdminOnlyDoc dans firestore.rules)
//                donc onSnapshot ne peut pas etre refuse. applyFbData('intrants')
//                route vers _rsvApply, qui re-rend deja la page Reserve si elle est
//                active : aucun hook supplementaire n'est necessaire dans fbListen().
//
// `paie`      -> PULL SEULEMENT, volontairement PAS en temps reel. C'est le seul doc
//                du modele restreint en LECTURE (admin-only). Un onSnapshot pose par
//                un non-admin serait refuse par les regles : Firestore detache alors
//                le listener et l'erreur revient a chaque re-souscription. En pull, le
//                meme refus est absorbe par le .catch() par-promesse de _pullKeys
//                (level:'info'), exactement comme au boot dans fbPullAll.
//                NB : etre dans FB_STATIC ne met PAS `paie` dans _initData (objet
//                litteral explicite) ni dans la snapshot localStorage de saveData
//                (qui ne route pas cette cle) -> les remunerations ne descendent
//                toujours jamais sur le disque de l'appareil.
var FB_REALTIME = ['parcelles','journal','sessions','traitements','reparateur','reparateur_hist','entretiens','planning_templates','planning_entries','planning_acomptes','planning_hsup',
                   'intrants'];
var FB_STATIC   = ['travaux','catalogue','conducteurs','activites',
                   'membres','saisons','taches','config','historique','tracteurs_list',
                   'cave_elevage','cave_vendange','kml_polygons',
                   'paie'];

// ── Queue offline ──
var _offlineQueue = {};

function _queueSave(key, value) {
  _offlineQueue[key] = value;
  try { localStorage.setItem('mavigne_offline_queue', JSON.stringify(_offlineQueue)); } catch (e) {}
  _showOfflineQueueBadge();
}

// ── Badge persistant : nombre de modifications en attente de synchro ──
function _showOfflineQueueBadge() {
  var n = Object.keys(_offlineQueue).length;
  if (n === 0) { showSyncBadge('📵 Hors ligne', '#7A4F2E'); return; }
  showSyncBadge('📵 Hors ligne — ' + n + ' modification' + (n > 1 ? 's' : '') + ' en attente', '#7A4F2E');
}
window._offlineQueueCount = function () { return Object.keys(_offlineQueue).length; };

function _loadQueue() {
  try {
    var raw = localStorage.getItem('mavigne_offline_queue');
    if (raw) _offlineQueue = JSON.parse(raw) || {};
  } catch (e) { _offlineQueue = {}; }
}

async function _flushQueue() {
  _loadQueue();
  var keys = Object.keys(_offlineQueue);
  if (keys.length === 0) return;
  if(DEBUG) console.log('[Sync] Vidage queue hors ligne :', keys);
  showSyncBadge('🔄 Synchronisation…', '#1A4A7A');
  var success = true;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    try {
      if (key === 'parcelles') {
        await _saveParcellesMerged(_offlineQueue[key]); // #1 : fusion a la reconnexion (ne pas ecraser le travail des autres)
      } else if (await _mvBlockDestructive(key, _offlineQueue[key])) {
        // #wipe : ecriture destructrice en file -> on l'abandonne (pas de re-tentative en boucle)
        if (window.logError) window.logError({ level:'critical', cat:'guard', msg:'flush ' + key + ' BLOQUE (anti-ecrasement) -- retire de la file' });
      } else {
        await setDoc(fbDocRef(key), { value: _fbClone(key, _offlineQueue[key]) });
      }
      delete _offlineQueue[key];
    } catch (e) {
      // SEC-1 : idem fbSave — un refus de droits reste refusé. On l'abandonne (comme le
      // fait déjà la garde anti-écrasement) pour ne pas coincer la file à vie.
      if (_isDenied(e)) {
        if (window.logError) window.logError({ level:'error', cat:'sync', msg:'Écriture refusée (droits) : ' + key + ' — retirée de la file', detail:String(e) });
        delete _offlineQueue[key];
        continue;
      }
      if(window.logError) window.logError({level:'warning',cat:'sync',msg:'Synchro échouée: '+key,detail:String(e)});
      success = false;
    }
  }
  try { localStorage.setItem('mavigne_offline_queue', JSON.stringify(_offlineQueue)); } catch (e) {}
  if (success && keys.length > 0) {
    showSyncBadge('✅ ' + keys.length + ' modif. synchronisée' + (keys.length > 1 ? 's' : ''), '#3D6B27');
  } else if (!success) {
    var nRest = Object.keys(_offlineQueue).length;
    showSyncBadge('⚠️ Synchro partielle — ' + nRest + ' en attente', '#B85A1A');
  }
}

window._flushOfflineQueue = _flushQueue;

// Filet de sécurité : une modif mise en file en restant EN LIGNE (échec transitoire
// après 3 tentatives) ne serait jamais retentée sans event 'online' ni rechargement.
// On la re-tente périodiquement tant que la file n'est pas vide.
var _onlineRetryTO = null;
setInterval(function(){
  if (navigator.onLine && Object.keys(_offlineQueue).length > 0) {
    _flushQueue().catch(function(){});
  }
}, 30000);

// ── Badge synchro — proxy vers la fonction définie dans index.html ──
// showSyncBadge est définie dans le <script> inline plus loin dans index.html.
// En module ES, on appelle window.showSyncBadge pour ne pas créer de dépendance
// circulaire. Si elle n'est pas encore définie (appel très précoce), on log uniquement.
function showSyncBadge(msg, color) {
  // ⚠️ Ne JAMAIS annoncer « Synchronisé » quand un listener est mort. Firestore
  // détache définitivement un onSnapshot en erreur : l'app continuait d'afficher la
  // pastille verte pendant que deux appareils divergeaient en silence — exactement
  // le sinistre que la couverture FB_REALTIME/FB_STATIC sert à empêcher.
  // Comparaison sur l'égalité EXACTE (3 sites d'appel) plutôt que sur une sous-chaîne :
  // « ✅ N modif. synchronisée » parle de la file d'écriture et reste vrai, lui.
  if (msg === '✅ Synchronisé' && _fbDeadCount()) { msg = '⚠️ Synchro partielle'; color = '#B85A1A'; }
  if (typeof window.showSyncBadge === 'function') {
    window.showSyncBadge(msg, color);
  } else {
    if(DEBUG) console.log('[SyncBadge]', msg);
  }
}

// ── Écoute réseau ──
window.addEventListener('online', function () {
  if(DEBUG) console.log('[Réseau] Connexion rétablie');
  showSyncBadge('📶 Connexion rétablie…', '#1A4A7A');
  if (typeof window._updateMapOfflineBanner === 'function') window._updateMapOfflineBanner();
  setTimeout(function(){ _flushQueue().catch(function(e){ if(window.logError) window.logError({level:'warning',cat:'sync',msg:'Flush offline échoué',detail:String(e)}); }); }, 800);
  setTimeout(function () {
    fbPullAll().then(function () {
      showSyncBadge('✅ Synchronisé', '#3D6B27');
      if (window.currentUser) {
        if (window.renderHome)     window.renderHome();
        if (window.renderParcelles) window.renderParcelles();
        if (window.computePStats)  window.computePStats();
      }
    }).catch(function () {});
  }, 2000);
});

window.addEventListener('offline', function () {
  if(DEBUG) console.log('[Réseau] Connexion perdue');
  _showOfflineQueueBadge();
  if (typeof window._updateMapOfflineBanner === 'function') window._updateMapOfflineBanner();
});

// ── Messages Service Worker ──
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'FLUSH_OFFLINE_QUEUE') {
      _flushQueue().catch(function(e){ if(window.logError) window.logError({level:'info',cat:'sync',msg:'Flush SW échoué',detail:String(e)}); });
    }
  });
}

// ── Etat serveur de reference (base du merge 3-way parcelles, #1) ──
var _baseParcelles = null;

// ── applyFbData — proxy vers window + capture de la base parcelles ──
function applyFbData(key, value) {
  if (key === 'parcelles' && Array.isArray(value)) _baseParcelles = deepClone(value);
  // kml_polygons : Firestore interdit les tableaux imbriques -> les points sont stockes
  // en objets {lat,lng} ; on reconstruit [[lat,lng],...] pour Leaflet (rendu inchange).
  if (key === 'kml_polygons' && Array.isArray(value)) {
    value = value.map(function(poly) {
      if (!poly || !Array.isArray(poly.pts)) return poly;
      return { name: poly.name, pts: poly.pts.map(function(pt) {
        return Array.isArray(pt) ? pt : [pt.lat, pt.lng];
      }) };
    });
  }
  if (typeof window.applyFbData === 'function') {
    window.applyFbData(key, value);
  }
}

// ── Pull / Push Firestore ──
// PERF-1 (#1) — LECTURE PARALLELE, APPLICATION ORDONNEE.
// Avant : une boucle `await getDoc` par cle = 24 allers-retours ENCHAINES au boot (chacun
// paie la latence complete : ~2 a 4 s en 4G avant le moindre pixel de donnee).
// Maintenant : les lectures partent TOUTES ensemble (le SDK les multiplexe sur UN SEUL flux
// watch -> ce n'est pas 24 requetes HTTP, c'est 1 aller-retour), puis on applique cle par cle
// DANS L'ORDRE de la liste fournie.
//   → applyFbData reste appele PAR CLE, dans le MEME ORDRE qu'avant : seul le temps d'attente
//     change, jamais la sequence vue par app.js.
//   → isolation par cle preservee : une lecture KO (ou un applyFbData qui jette) n'empeche
//     aucune autre cle d'etre appliquee. Promise.all ne voit JAMAIS de rejet : chaque lecture
//     porte son propre catch (un rejet unique aurait annule tout le pull = regression majeure).
// Retourne l'etat par cle : 'ok' (doc lu) | 'missing' (doc absent) | 'error' (lecture KO)
// | 'skip' (sauvegarde en cours). Cet etat supprime les relectures redondantes en aval (#2).
async function _pullKeys(keys, tag, respectIgnore) {
  var t0 = Date.now();
  var reads = keys.map(function (key) {
    // Ne pas écraser une clé sauvegardée très récemment (race condition fbSave async)
    if (respectIgnore && _ignoreBefore[key] && Date.now() < _ignoreBefore[key]) {
      if(DEBUG) console.log('[' + tag + '] Skip', key, '— sauvegarde en cours');
      return Promise.resolve({ key: key, skip: true });
    }
    return getDoc(fbDocRef(key)).then(
      function (snap) { return { key: key, snap: snap }; },
      function (e) {
        // ⚠️ Un refus ATTENDU n'est pas une erreur. `paie` est le seul document
        // admin-only EN LECTURE : tout ouvrier, saisonnier ou visiteur de la demo se
        // le voit refuser a CHAQUE pull, par construction. On le journalisait quand
        // meme — donc les signalements de la population qui en emet le plus, les
        // non-admins, arrivaient noyes sous un refus parfaitement normal.
        // Le refus reste journalise pour un VRAI admin : la, c'est une anomalie.
        var code = (e && e.code) ? String(e.code) : '';
        var cu   = window.currentUser;
        var adm  = !!(cu && !cu._isDemo && Array.isArray(cu.roles) && cu.roles.indexOf('admin') >= 0);
        var attendu = (key === 'paie' && code === 'permission-denied' && !adm);
        if (!attendu && window.logError) window.logError({
          level:'info', cat:'firebase', msg:tag+': '+key,
          detail: code ? (code + ' — ' + ((e && e.message) || '')) : String(e)
        });
        return { key: key, err: e };
      }
    );
  });
  var res = await Promise.all(reads);   // ordre d'entree preserve -> ordre d'application stable
  var state = {};
  for (var i = 0; i < res.length; i++) {
    var r = res[i];
    if (r.skip)           { state[r.key] = 'skip';    continue; }
    if (r.err)            { state[r.key] = 'error';   continue; }
    if (!r.snap.exists()) { state[r.key] = 'missing'; continue; }
    // Re-controle a l'APPLICATION : une sauvegarde a pu demarrer PENDANT la fenetre de lecture
    // parallele. Sans ce 2e controle, on ecraserait en memoire une valeur en cours d'ecriture.
    if (respectIgnore && _ignoreBefore[r.key] && Date.now() < _ignoreBefore[r.key]) {
      if(DEBUG) console.log('[' + tag + '] Skip (apply)', r.key, '— sauvegarde en cours');
      state[r.key] = 'skip'; continue;
    }
    state[r.key] = 'ok';
    try { applyFbData(r.key, r.snap.data().value); }
    catch (e) { if(window.logError) window.logError({level:'info',cat:'firebase',msg:tag+': '+r.key,detail:String(e)}); }
  }
  if(DEBUG) console.log('[PERF] ' + tag + ' — ' + keys.length + ' docs en ' + (Date.now() - t0) + ' ms');
  return state;
}

async function fbPullAll()    { return _pullKeys(COLLECTIONS, 'fbPullAll', false); }
async function fbPullStatic() { return _pullKeys(FB_STATIC,   'fbPullStatic', true); }

// PERF-1 (#2) — `known` = etat renvoye par le pull qui vient de lire cette meme cle.
//   'ok'      -> doc present : no-op SANS relecture (identique a l'ancien comportement)
//   'missing' -> doc absent, constat FRAIS du pull : ecriture directe SANS relecture
//   autre / undefined -> on ne SAIT pas (lecture KO, cle hors pull) : relecture-avant-ecriture,
//                        chemin historique conserve. Ne JAMAIS ecrire sans savoir : un setDoc
//                        aveugle sur un doc existant = ecrasement des donnees serveur.
async function fbPushIfAbsent(key, value, known) {
  try {
    if (known === 'ok') return;
    if (known === 'missing') {
      if (value === undefined) return;
      await setDoc(fbDocRef(key), { value: _fbClone(key, value) });
      if(DEBUG) console.log('[Firebase] Init collection absente :', key);
      return;
    }
    var snap = await getDoc(fbDocRef(key));
    if (!snap.exists() && value !== undefined) {
      await setDoc(fbDocRef(key), { value: _fbClone(key, value) });
      if(DEBUG) console.log('[Firebase] Init collection absente :', key);
    }
  } catch (e) { if(window.logError) window.logError({level:'info',cat:'firebase',msg:'fbPushIfAbsent: '+key,detail:String(e)}); }
}

// ── Listeners temps réel ──
var _ignoreNext   = {};
var _ignoreBefore = {};
// Handles onSnapshot actifs : permet de tout désabonner avant une re-souscription.
// _fbLoadAfterAuth() (donc fbListen) est appelé depuis plusieurs points (login, reprise en
// ligne, reconnexion) ; sans ce nettoyage, chaque re-run empilait un jeu complet de listeners
// sur les MÊMES documents (11 -> 22 -> 33…), gonflant la surface exposée au bug interne du
// flux de watch Firestore (« INTERNAL ASSERTION FAILED: Unexpected state »).
// ⚠️ INDEXÉS PAR CLÉ (et non plus dans un tableau) : une seule clé peut désormais
// être ré-abonnée sans toucher aux onze autres.
var _fbUnsubs = {};

// ── Reprise des listeners ────────────────────────────────────────────────────
// Firestore DÉTACHE DÉFINITIVEMENT un onSnapshot dont le callback d'erreur se
// déclenche. Rien ne les reposait : l'écouteur 'online' fait un fbPullAll(), pas un
// fbListen(), et seul un _fbLoadAfterAuth() complet (donc un login) reconstruisait le
// jeu. Un onglet pouvait donc tourner des heures sans aucune synchro temps réel,
// pastille verte comprise.
// Deux régimes, volontairement distincts :
//  • refus de droits → UNE seule reprise. Doctrine SEC-1 : un refus n'est pas une
//    panne transitoire. La reprise unique couvre le seul cas légitime — la rotation
//    de jeton juste après un changement d'état d'auth. Au-delà, on abandonne.
//  • autre code (réseau, « INTERNAL ASSERTION FAILED » du flux de watch) → 3 reprises
//    avec attente croissante.
// Plafond global de session en plus des budgets par clé : un listener qui délivrerait
// un snapshot puis mourrait en boucle remettrait son compteur à zéro à chaque fois.
var _FB_BACKOFF     = [2000, 5000, 15000];
var _FB_DENIED_WAIT = 4000;
var _FB_RESUB_MAX   = 30;
var _fbListenTries  = {};
var _fbListenTimers = {};
var _fbDeadKeys     = {};
var _fbResubTotal   = 0;
var _fbListenWarned = false;
// Exposé pour le diagnostic (console, signalement) : quelles clés ne se synchronisent
// plus. Objet STABLE — on vide ses clés, on ne le réassigne jamais, sinon la référence
// posée sur window pointerait sur un ancien objet.
window._MV_SYNC_DEAD = _fbDeadKeys;

function _fbWipe(o) { Object.keys(o).forEach(function (k) { delete o[k]; }); }
function _fbDeadCount() { return Object.keys(_fbDeadKeys).length; }
window._fbDeadCount = _fbDeadCount;

// ⚠️ UN SEUL catch{} vide dans tout ce bloc (cliquet C14 du preflight) : _fbSubscribe
// reutilise _fbUnsubOne au lieu de re-ecrire son propre try/catch.
function _fbUnsubOne(key) {
  try { if (_fbUnsubs[key]) _fbUnsubs[key](); } catch (e) {}
  delete _fbUnsubs[key];
}

function _fbUnsubAll() {
  Object.keys(_fbUnsubs).forEach(function (k) { _fbUnsubOne(k); });
  Object.keys(_fbListenTimers).forEach(function (k) { clearTimeout(_fbListenTimers[k]); });
  _fbWipe(_fbUnsubs); _fbWipe(_fbListenTimers); _fbWipe(_fbListenTries); _fbWipe(_fbDeadKeys);
  _fbResubTotal = 0;
  _fbListenWarned = false;
}
window._fbUnsubAll = _fbUnsubAll;

// Un seul avertissement pour toute une rafale : les douze listeners tombent dans la
// même seconde, douze toasts identiques seraient du bruit pur.
function _fbMarkDead(key) {
  _fbDeadKeys[key] = true;
  if (_fbListenWarned) return;
  _fbListenWarned = true;
  setTimeout(function () {
    if (!window.currentUser) return; // déconnexion entre-temps : plus rien à signaler
    if (window.logError) window.logError({
      level: 'warning', cat: 'firebase',
      msg: 'Synchronisation temps réel interrompue — rechargez l\'application',
      detail: 'Clés sans listener : ' + Object.keys(_fbDeadKeys).join(', ')
    });
  }, 1500);
}

function _fbListenFailed(key, e) {
  var code = (e && e.code) ? String(e.code) : '?';
  var txt  = (e && e.message) ? String(e.message) : String(e);
  delete _fbUnsubs[key]; // Firestore a déjà détaché : le handle ne vaut plus rien
  if (window.logError) window.logError({
    level: 'info', cat: 'firebase', msg: 'onSnapshot: ' + key, detail: code + ' — ' + txt
  });
  // Déconnexion en cours : le refus est ATTENDU, on ne relance rien et on n'alerte pas.
  if (!window.currentUser) return;
  var denied = (code === 'permission-denied');
  var n      = _fbListenTries[key] || 0;
  var budget = denied ? 1 : _FB_BACKOFF.length;
  if (n >= budget || _fbResubTotal >= _FB_RESUB_MAX) { _fbMarkDead(key); return; }
  _fbListenTries[key] = n + 1;
  _fbResubTotal++;
  clearTimeout(_fbListenTimers[key]);
  _fbListenTimers[key] = setTimeout(function () {
    if (!window.currentUser) return;
    _fbSubscribe(key);
  }, denied ? _FB_DENIED_WAIT : _FB_BACKOFF[n]);
}

function _fbSubscribe(key) {
  _fbUnsubOne(key);
  _fbUnsubs[key] = onSnapshot(fbDocRef(key), function (snap) {
      // Un snapshot reçu = le flux est vivant : la clé récupère son budget de reprise.
      _fbListenTries[key] = 0;
      if (_fbDeadKeys[key]) delete _fbDeadKeys[key];
      if (!snap.exists()) return;
      if (_ignoreNext[key])  { _ignoreNext[key] = false; return; }
      if (_ignoreBefore[key] && Date.now() < _ignoreBefore[key]) return;
      applyFbData(key, snap.data().value);
      if (window.currentUser) {
        var p = document.querySelector('.page.active');
        if (p) {
          var pid = p.id;
          if ((key==='parcelles'||key==='journal'||key==='travaux') &&
              (pid==='page-home'||pid==='page-parcelles'||pid==='page-journal')) {
            if (window.renderHome)        window.renderHome();
            if (window.renderParcelles)   window.renderParcelles();
            if (window.computePStats)     window.computePStats();
            if (pid==='page-journal' && window.renderJournalList) window.renderJournalList();
          }
          if (key==='sessions' && pid==='page-tracteur' && window.renderTracteur) window.renderTracteur();
          if (key==='sessions' && pid==='page-home'     && window.renderHome)     window.renderHome();
          if ((key==='traitements'||key==='catalogue') && pid==='page-phyto' && window.renderPhyto) window.renderPhyto();
          if ((key==='reparateur'||key==='entretiens'||key==='reparateur_hist')  && pid==='page-tracteur'  && window.renderTracteur) window.renderTracteur();
          if ((key==='planning_templates'||key==='planning_entries'||key==='planning_hsup') && pid==='page-planning' && window.renderPlanning) window.renderPlanning();
        }
        showSyncBadge('🔄 Mis à jour', '#1A4A7A');
        setTimeout(function () { showSyncBadge('✅ Synchronisé', '#3D6B27'); }, 1500);
      }
    }, function (e) { _fbListenFailed(key, e); });
}

function fbListen() {
  _fbUnsubAll(); // idempotent : purge tout listener précédent avant de re-souscrire
  FB_REALTIME.forEach(function (key) { _fbSubscribe(key); });
}

// ── Retry exponentiel — 3 tentatives avec backoff 1s/2s/4s ──
// SEC-1 : un refus de droits n'est PAS une panne transitoire. Le distinguer partout
// (retry, file d'attente) évite de transformer une erreur d'autorisation en boucle muette.
function _isDenied(e) {
  return !!e && (e.code === 'permission-denied' || e.code === 'firestore/permission-denied');
}
window._mvIsDenied = _isDenied;

async function _retryAsync(fn, retries, delayMs) {
  for (var i = 0; i <= retries; i++) {
    try { return await fn(); } catch(e) {
      if(i === retries || _isDenied(e)) throw e;   // SEC-1 : refus de droits -> inutile de retenter
      await new Promise(function(res){ setTimeout(res, delayMs * Math.pow(2, i)); });
    }
  }
}

// ════ Fusion 3-way parcelles (#1) — fin du last-write-wins en concurrence ════
// base = dernier etat serveur connu (capte dans applyFbData) ; local = etat en memoire ;
// remote = etat serveur frais lu dans la transaction. Cles stables : nom → taches → tache.
// Logique prouvee par 8 scenarios de test. Prefixe _mv pour eviter toute collision bundle.
function _mvDeepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  var aArr = Array.isArray(a), bArr = Array.isArray(b);
  if (aArr !== bArr) return false;
  if (aArr) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (!_mvDeepEqual(a[i], b[i])) return false;
    return true;
  }
  var ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (var j = 0; j < ka.length; j++) {
    var k = ka[j];
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!_mvDeepEqual(a[k], b[k])) return false;
  }
  return true;
}
function _mvIsObj(v) { return v != null && typeof v === 'object' && !Array.isArray(v); }
function _mvMerge3(base, local, remote) {
  if (_mvDeepEqual(local, remote)) return local;       // pas de divergence
  if (_mvDeepEqual(local, base))   return remote;      // seul remote a change → ne pas ecraser autrui
  if (_mvDeepEqual(remote, base))  return local;       // seul local a change
  if (_mvIsObj(local) && _mvIsObj(remote)) {           // les deux → fusion cle par cle
    var out = {}, baseO = _mvIsObj(base) ? base : {}, keys = {};
    Object.keys(baseO).forEach(function(k){ keys[k] = 1; });
    Object.keys(local).forEach(function(k){ keys[k] = 1; });
    Object.keys(remote).forEach(function(k){ keys[k] = 1; });
    Object.keys(keys).forEach(function(k){
      var lHas = Object.prototype.hasOwnProperty.call(local, k);
      var rHas = Object.prototype.hasOwnProperty.call(remote, k);
      var bHas = Object.prototype.hasOwnProperty.call(baseO, k);
      var lv = local[k], rv = remote[k], bv = baseO[k];
      if (bHas && !lHas && rHas && _mvDeepEqual(rv, bv)) return; // local supprime, remote intact
      if (bHas && !rHas && lHas && _mvDeepEqual(lv, bv)) return; // remote supprime, local intact
      if (!lHas && rHas) { out[k] = rv; return; }
      if (!rHas && lHas) { out[k] = lv; return; }
      out[k] = _mvMerge3(bv, lv, rv);
    });
    return out;
  }
  return local; // conflit feuille/tableau → local gagne
}
function _mvMergeParcelles(base, local, remote) {
  base = Array.isArray(base) ? base : [];
  local = Array.isArray(local) ? local : [];
  remote = Array.isArray(remote) ? remote : [];
  function byNom(arr){ var m = {}; arr.forEach(function(p){ if (p && p.nom != null) m[p.nom] = p; }); return m; }
  var bM = byNom(base), lM = byNom(local), rM = byNom(remote), out = [], seen = {};
  function emit(n){
    if (seen[n]) return; seen[n] = 1;
    var lHas = (n in lM), rHas = (n in rM);
    if (lHas && rHas) out.push(_mvMerge3(bM[n], lM[n], rM[n]));
    else if (lHas) out.push(lM[n]);
    else if (rHas) out.push(rM[n]);
  }
  remote.forEach(function(p){ if (p && p.nom != null) emit(p.nom); });
  local.forEach(function(p){ if (p && p.nom != null) emit(p.nom); });
  return out;
}
// ============ GARDE ANTI-ECRASEMENT GLOBAL (#wipe) ============================
// Empeche tout etat par defaut / vide / tronque de remplacer des donnees serveur
// peuplees. Vaut pour TOUTES les collections critiques, TOUS les domaines.

// progression presente sur une valeur de tache (chaine "Valide" / objet {p1,p2,ov}
// ou {n1,n2,n3,ov}). Ignore "Non demarre", null, 0, false, chaine vide.
function _entryHasProg(v) {
  if (v == null || v === false) return false;
  if (typeof v === 'string') { var s = v.trim(); return s !== '' && s !== 'Non d\u00e9marr\u00e9' && s !== 'Non demarre' && s !== 'null'; }
  if (typeof v === 'number') return v > 0;
  if (v === true) return true;
  if (Array.isArray(v)) return v.some(_entryHasProg);
  if (typeof v === 'object') { for (var k in v) { if (Object.prototype.hasOwnProperty.call(v, k) && _entryHasProg(v[k])) return true; } return false; }
  return false;
}
// vrai si un bloc taches (objet {nomTache: valeur}) porte AU MOINS une progression.
function _tachesBlockHasProg(t) {
  if (!t || typeof t !== 'object') return false;
  for (var k in t) { if (Object.prototype.hasOwnProperty.call(t, k) && _entryHasProg(t[k])) return true; }
  return false;
}
// nb de parcelles ayant AU MOINS une tache avec progression, TOUTES SAISONS CONFONDUES
// (p.taches = saison consultee + p.tachesAll = archives par saison). #wipe/#saison : changer de
// saison vide p.taches mais conserve la progression dans p.tachesAll -> sans ce comptage global,
// un simple switch de saison ressemblerait a un wipe, serait bloque a tort par la garde, et
// desynchroniserait CONFIG.visuSaison (boucle d'« Erreur critique » au chargement). Le squelette
// par defaut (ni taches ni tachesAll peuples) compte toujours 0 -> protection reelle preservee.
function _mvParcProgCount(arr) {
  if (!Array.isArray(arr)) return 0;
  var n = 0;
  for (var i = 0; i < arr.length; i++) {
    var p = arr[i]; if (!p) continue;
    var has = _tachesBlockHasProg(p.taches);
    if (!has && p.tachesAll && typeof p.tachesAll === 'object') {
      for (var sn in p.tachesAll) {
        if (Object.prototype.hasOwnProperty.call(p.tachesAll, sn) && _tachesBlockHasProg(p.tachesAll[sn])) { has = true; break; }
      }
    }
    if (has) n++;
  }
  return n;
}
// "taille significative" d'une collection : parcelles -> progression ; tableau -> longueur ;
// objet -> nb de cles.
// `intrants` et `paie` sont des CONTENEURS a clefs fixes : Object.keys() y renvoie
// une constante (7 et 3) que le document soit plein ou vide -> le garde generique
// serait inoperant. On mesure donc le CONTENU, comme _mvParcProgCount le fait pour
// les parcelles. Les listes de memorisation (fut_four / fut_ref / achat_four) sont
// exclues : purement cosmetiques, elles ne doivent pas peser dans la decision.
function _mvIntrantsCount(v) {
  if (!v || typeof v !== 'object') return 0;
  var n = 0;
  ['produits','achats','inventaires','futs'].forEach(function (k) {
    if (Array.isArray(v[k])) n += v[k].length;
  });
  return n;
}
// Taux nominatifs + appoints de cuve GNR.
// ⚠️⚠️ `taux_serie` COMPTE, et c'est un changement de statut : ce n'est pas une trace,
// c'est la SOURCE de tout cout de main-d'oeuvre date. Une ecriture qui la viderait
// ferait retomber tous les calculs sur le taux du jour — exactement le bug que le lot
// des salaires dates a corrige. `taux_hist`, lui, reste un derive et ne compte pas :
// il n'est plus lu que pour deriver la serie d'un domaine jamais migre.
function _mvPaieCount(v) {
  if (!v || typeof v !== 'object') return 0;
  var n = 0;
  if (v.taux && typeof v.taux === 'object') n += Object.keys(v.taux).length;
  if (v.taux_serie && typeof v.taux_serie === 'object') {
    Object.keys(v.taux_serie).forEach(function (k) {
      var S = v.taux_serie[k];
      n += Array.isArray(S) ? S.length : 0;
    });
  }
  if (Array.isArray(v.gnr_appoints)) n += v.gnr_appoints.length;
  return n;
}
function _mvDocSize(key, val) {
  if (key === 'parcelles') return _mvParcProgCount(val);
  if (key === 'intrants')  return _mvIntrantsCount(val);
  if (key === 'paie')      return _mvPaieCount(val);
  if (Array.isArray(val)) return val.length;
  if (val && typeof val === 'object') return Object.keys(val).length;
  return (val == null) ? 0 : 1;
}
// Plancher d'activation par cle : en-dessous (domaine neuf, peu de donnees) le garde
// ne fait rien. Au-dessus, on REFUSE une ecriture qui ferait chuter la taille de plus
// de moitie -- signature d'un ecrasement par un etat par defaut/vide. Collections
// derivees/regenerables (travaux) volontairement non gardees.
// Le garde ne se declenche QUE sur une chute de plus de moitie en UNE SEULE ecriture :
// c'est la signature d'un ecrasement par un etat par defaut ou vide, pas celle d'une
// suppression faite a la main (qui retire un element a la fois et ne franchit jamais
// le seuil). Ajoute ici : les collections a valeur legale ou comptable, qui n'avaient
// aucune protection alors qu'elles sont reecrites en entier a chaque enregistrement.
//   traitements     registre phyto -- opposable en controle
//   intrants        comptabilite matiere bio (RE 2021/771) -- La Reserve
//   paie            remunerations nominatives + appoints GNR
//   taches          heures/ha : socle de tout le calcul charge / ETP / cout-ha
//   entretiens      carnet d'entretien du parc
//   historique      journal d'activite, ecrit par tous
//   reparateur_hist periodes d'immobilisation archivees
// NON gardees, volontairement : `travaux` (derive, regenerable par recalcTravaux) et
// `kml_polygons` (l'import KML est un REPLACE assume -- un garde y produirait un faux
// positif des qu'un domaine reimporte un parcellaire plus petit).
var _MV_GUARD_FLOORS = {
  parcelles: 5, membres: 2, saisons: 1, config: 3,
  journal: 5, sessions: 5, cave_elevage: 1, cave_vendange: 1,
  tracteurs_list: 2, conducteurs: 2, activites: 2,
  planning_entries: 2, planning_templates: 1, planning_acomptes: 1, planning_hsup: 1,
  traitements: 5, intrants: 3, paie: 2, taches: 5,
  entretiens: 5, historique: 5, reparateur_hist: 2
};
// Lecture-avant-ecriture pour les cles protegees (hors parcelles, qui a son garde
// transactionnel). Renvoie true s'il faut BLOQUER. Best-effort : toute erreur -> on laisse passer.
async function _mvBlockDestructive(key, value) {
  if (!Object.prototype.hasOwnProperty.call(_MV_GUARD_FLOORS, key)) return false;
  try {
    var snap = await getDoc(fbDocRef(key));
    if (!snap.exists()) return false;                 // doc neuf -> jamais bloque
    var curN = _mvDocSize(key, snap.data().value);
    var newN = _mvDocSize(key, value);
    if (curN >= _MV_GUARD_FLOORS[key] && newN < curN * 0.5) {
      if (window.logError) window.logError({ level:'critical', cat:'guard', msg:'fbSave ' + key + ' BLOQUE (anti-ecrasement)', detail:'cur=' + curN + ' new=' + newN });
      return true;
    }
  } catch (e) {}
  return false;
}

// Sauvegarde parcelles transactionnelle : lit le serveur frais, fusionne, ecrit, met la base a jour.
async function _saveParcellesMerged(localValue) {
  var ref = fbDocRef('parcelles');
  return runTransaction(db, async function (tx) {
    var snap = await tx.get(ref);
    var remote = (snap.exists() && Array.isArray(snap.data().value)) ? snap.data().value : [];
    var base = Array.isArray(_baseParcelles) ? _baseParcelles : remote;
    var merged = _mvMergeParcelles(base, localValue, remote);

    // -- GARDE : refuse une chute de progression > 50% (ecrasement massif) --------
    var remoteProg = _mvParcProgCount(remote);
    var mergedProg = _mvParcProgCount(merged);
    if (remoteProg >= 5 && mergedProg < remoteProg * 0.5) {
      return { __mvBlocked: true, remoteProg: remoteProg, mergedProg: mergedProg };
    }

    tx.set(ref, { value: deepClone(merged) });
    _baseParcelles = deepClone(merged);
    return merged;
  });
}

// ── fbSave ──
window.fbSave = async function (key, value) {
  // Demo (bac a sable local) : on n'ecrit JAMAIS dans Firestore. L'etat en memoire + le
  // localStorage (deja ecrits par saveData) donnent l'experience interactive ; au rechargement
  // la demo repart du jeu de donnees d'origine (re-lu depuis Firestore). Aucune pollution,
  // aucune collision entre prospects, aucune surface d'ecriture exposee.
  if (TENANT_ID === 'domaine-dupont') {
    if (typeof showSyncBadge === 'function') showSyncBadge('✅ Sauvegardé', '#3D6B27');
    return;
  }
  _ignoreNext[key]   = true;
  _ignoreBefore[key] = Date.now() + 4000;
  if (!navigator.onLine) {
    _queueSave(key, value);
    return;
  }
  try {
    if (key === 'parcelles') {
      // #1 : fusion 3-way transactionnelle (fin du last-write-wins sur le point chaud terrain)
      // #wipe : peut renvoyer {__mvBlocked} si l'ecriture ferait disparaitre la progression
      var _pRes = await _retryAsync(function(){ return _saveParcellesMerged(value); }, 3, 1000);
      if (_pRes && _pRes.__mvBlocked) {
        if (window.logError) window.logError({ level:'critical', cat:'guard', msg:'fbSave parcelles BLOQUE (anti-ecrasement)', detail:'remoteProg='+_pRes.remoteProg+' mergedProg='+_pRes.mergedProg });
        try { var _sH = await getDoc(fbDocRef('parcelles')); if (_sH.exists()) applyFbData('parcelles', _sH.data().value); } catch (e) {}
        if (typeof showSyncBadge === 'function') showSyncBadge('\ud83d\udee1\ufe0f Sauvegarde ignoree (protection)', '#B5621A');
        if (window.showToast) window.showToast('Ecriture ignoree : protection anti-perte de donnees', '#7A1020');
        return;
      }
    } else {
      // #wipe : garde generique anti-ecrasement (lecture-avant-ecriture)
      if (await _mvBlockDestructive(key, value)) {
        try { var _sH2 = await getDoc(fbDocRef(key)); if (_sH2.exists()) applyFbData(key, _sH2.data().value); } catch (e) {}
        if (typeof showSyncBadge === 'function') showSyncBadge('\ud83d\udee1\ufe0f Sauvegarde ignoree (protection)', '#B5621A');
        if (window.showToast) window.showToast('Ecriture ignoree : protection anti-perte de donnees', '#7A1020');
        return;
      }
      await _retryAsync(function(){ return setDoc(fbDocRef(key), { value: _fbClone(key, value) }); }, 3, 1000);
    }
    showSyncBadge('✅ Sauvegardé', '#3D6B27');
    // Une modif a pu être mise en file lors d'un échec précédent ALORS QU'ON RESTAIT
    // en ligne (aucun event 'online' pour la retenter). On profite de ce succès pour
    // vider la file — la modif coincée repart sans attendre un rechargement.
    if (key !== 'parcelles' && Object.keys(_offlineQueue).length > 0) {
      setTimeout(function(){ _flushQueue().catch(function(){}); }, 300);
    }
  } catch (e) {
    // SEC-1 — REFUS DE DROITS : ne JAMAIS mettre en file. Une écriture refusée par les
    // règles le sera à chaque tentative : la remettre en file crée un poison pill retenté
    // toutes les 30 s à vie, badge « synchro partielle » permanent et aucune cause visible.
    // On la rejette bruyamment : badge explicite + entrée locale (embarquée dans
    // « Signaler un problème » → e-mail) + console.error. On relance quand même l'erreur
    // pour que saveData n'affiche pas un faux « enregistré ✓ ».
    if (_isDenied(e)) {
      if (window.logError) window.logError({ level:'error', cat:'firebase', msg:'Écriture refusée (droits) : ' + key, detail:String(e) });
      showSyncBadge('🔒 Écriture refusée — ' + key + ' (droits insuffisants)', '#7A1020');
      throw e;
    }
    if(window.logError) window.logError({level:'warning',cat:'firebase',msg:'fbSave échoué (3 tentatives): '+key,detail:String(e)});
    _queueSave(key, value);
    // Retenter bientôt même si on reste EN LIGNE (sinon la file ne se vide qu'au reload)
    if (navigator.onLine) { clearTimeout(_onlineRetryTO); _onlineRetryTO = setTimeout(function(){ _flushQueue().catch(function(){}); }, 5000); }
    throw e;
  }
};

// ── Migration noms de tâches (one-shot) ──
function _migrateTaskNames() {
  if (localStorage.getItem('mavigne_migrated_v1')) return;
  var RENAME = {
    Ebourgeonnage1: 'Ebourgeonnage', Ebourgeonnage2: 'Ebourgeonnage',
    Pioche1: 'Pioche', Pioche2: 'Pioche',
  };
  var changed = false;
  (window.PARCELLES || []).forEach(function (p) {
    if (!p.taches) return;
    Object.keys(RENAME).forEach(function (ancien) {
      if (p.taches[ancien] !== undefined) {
        var nouv = RENAME[ancien];
        if (p.taches[nouv] === undefined) p.taches[nouv] = p.taches[ancien];
        delete p.taches[ancien];
        changed = true;
      }
    });
  });
  (window.JOURNAL || []).forEach(function (j) {
    if (RENAME[j.tache]) { j.tache = RENAME[j.tache]; changed = true; }
  });
  if (changed) {
    if (typeof window.saveData === 'function') {
      window.saveData('parcelles');
      window.saveData('journal');
    }
    if(DEBUG) console.log('[Migration] Ebourgeonnage/Pioche renommés');
  }
  localStorage.setItem('mavigne_migrated_v1', '1');
}

// ── Catalogue E-Phy (ANSES) : doc partagé ephy/vigne → window.EPHY ──
// Référentiel national lecture seule, indépendant du tenant. Cache localStorage
// pour affichage instantané + hors-ligne. Statut exposé pour l'état vide du Phyto.
window._ephyStatus = 'idle';
window._fbLoadEphy = async function () {
  // 1) Cache local d'abord (instantané, hors-ligne)
  try {
    var raw = localStorage.getItem('mavigne_ephy_v1');
    if (raw) {
      var c = JSON.parse(raw);
      if (c && Array.isArray(c.produits) && c.produits.length) {
        window.EPHY = c.produits;
        window.EPHY_META = c.meta || {};
        window._ephyStatus = 'ready';
        if (window.applyEphy) window.applyEphy();
      }
    }
  } catch (e) {}
  // 2) Rafraîchir depuis Firestore (réseau requis)
  if (!navigator.onLine) {
    if (window._ephyStatus !== 'ready') { window._ephyStatus = 'offline'; if (window.applyEphy) window.applyEphy(); }
    return;
  }
  if (window._ephyStatus !== 'ready') { window._ephyStatus = 'loading'; if (window.applyEphy) window.applyEphy(); }
  try {
    var snap = await getDoc(doc(db, 'ephy', 'vigne'));
    if (snap.exists()) {
      var d = snap.data() || {};
      var arr = Array.isArray(d.produits) ? d.produits : [];
      window.EPHY = arr;
      window.EPHY_META = {
        updated: d.updated || null,
        source: d.source || 'Données E-Phy — Anses',
        sourceDate: d.sourceDate || null,
        count: (d.count != null ? d.count : arr.length)
      };
      window._ephyStatus = arr.length ? 'ready' : 'empty';
      // Cache : sérialiser updated en {seconds}
      try {
        var metaSer = {
          source: window.EPHY_META.source, sourceDate: window.EPHY_META.sourceDate, count: window.EPHY_META.count,
          updated: (d.updated && d.updated.seconds) ? { seconds: d.updated.seconds } : null
        };
        localStorage.setItem('mavigne_ephy_v1', JSON.stringify({ produits: arr, meta: metaSer }));
      } catch (e) {}
    } else {
      window._ephyStatus = 'empty';
    }
  } catch (e) {
    if (window.logError) window.logError({ level:'info', cat:'firebase', msg:'_fbLoadEphy', detail:String(e) });
    if (window._ephyStatus !== 'ready') window._ephyStatus = 'error';
  }
  if (window.applyEphy) window.applyEphy();
};

// ── _fbLoadAfterAuth ──
window._fbLoadAfterAuth = async function () {
  showSyncBadge('⏳ Chargement données…', '#B8913A');
  try {
    if(DEBUG) console.log('🔥 Pull complet post-auth');
    // PERF-1 : lectures en parallele ; _pulled = etat par cle, reutilise ci-dessous pour
    // supprimer les 16 relectures redondantes (garde membres + 15 fbPushIfAbsent).
    var _pulled = await fbPullAll();
    _migrateTaskNames();
    var _initData = {
      parcelles:      window.PARCELLES,
      journal:        window.JOURNAL,
      sessions:       window.SESSIONS,
      travaux:        window.TRAVAUX,
      traitements:    window.TRAITEMENTS,
      catalogue:      window.CATALOGUE,
      conducteurs:    window.CONDUCTEURS,
      activites:      window.ACTIVITES,
      membres:        window.MEMBRES,
      saisons:        window.SAISONS,
      taches:         window.TACHES,
      tracteurs_list: window.TRACTEURS_LIST,
      entretiens:     window.ENTRETIENS,
      reparateur:     window.REPARATEUR,
      historique:     window.HISTORIQUE,
    };
    // Guard : ne pousser les données par défaut que si le tenant est déjà initialisé.
    // Évite de copier les données localStorage d'un autre domaine dans un nouveau tenant.
    // PERF-1 (#2) : l'existence de 'membres' est DEJA connue -- fbPullAll vient de lire cette
    // cle. `_pulled.membres === 'ok'` est strictement equivalent a l'ancien
    // `_membresGuard.exists()` ; 'missing' comme 'error' -> seed ignore, exactement comme avant
    // (une lecture KO ne doit jamais autoriser le seed). Bonus : une erreur de lecture membres
    // ne fait plus sauter tout _fbLoadAfterAuth vers son catch (donc fbListen reste installe).
    // #3 : ne seeder les defauts QUE pour le tenant historique marchand-grillot (ses docs
    // existent deja → no-op). Tout autre tenant repart d'une page blanche : l'onboarding a
    // cree parcelles/membres/saisons/taches/config ; les collections restantes (conducteurs,
    // sessions, journal...) ne doivent PAS recevoir les defauts Marchand-Grillot.
    if (TENANT_ID === 'marchand-grillot' && _pulled.membres === 'ok') {
      // PERF-1 (#2) : chaque fbPushIfAbsent faisait SON getDoc (15 allers-retours en serie)
      // alors que les 15 cles viennent d'etre lues par le pull -> on lui passe l'etat connu.
      // Docs independants + fbPushIfAbsent n'echoue jamais (catch interne) -> Promise.all sur.
      await Promise.all(Object.keys(_initData).map(function (initKey) {
        return fbPushIfAbsent(initKey, _initData[initKey], _pulled[initKey]);
      }));
    } else {
      if(DEBUG) console.log('[Guard] Tenant', TENANT_ID, '- seed des defauts ignore (reserve marchand-grillot)');
    }
    showSyncBadge('✅ Synchronisé', '#3D6B27');
    window._authReady = true;
    fbListen();
    if (window._fbLoadEphy) window._fbLoadEphy(); // catalogue E-Phy partagé (non bloquant)
    if (Object.keys(_offlineQueue).length > 0) {
      setTimeout(_flushQueue, 1500);
    }
  } catch (e) {
    console.warn('🔥 _fbLoadAfterAuth error:', e);
    window._authReady = true;
    showSyncBadge('⚠️ Synchro partielle', '#B85A1A');
  }
};

// ── #tenant-recovery : récupération du tenant depuis une session restaurée ──
// Attend la résolution de l'état d'auth (une seule fois), puis lit le claim `tenant`.
// Best-effort : toute erreur / absence de session → null (= comportement actuel, onboarding).
function _mvAuthReadyOnce(timeoutMs) {
  return new Promise(function (resolve) {
    var done = false, unsub = null;
    var finish = function () { if (done) return; done = true; try { if (unsub) unsub(); } catch (e) {} clearTimeout(to); resolve(); };
    var to = setTimeout(finish, timeoutMs || 3000);
    try { unsub = onAuthStateChanged(auth, function () { finish(); }); } catch (e) { finish(); }
  });
}
async function _mvRecoverTenantFromClaim() {
  try {
    await _mvAuthReadyOnce(3000);
    var u = auth.currentUser;
    if (!u) return null;
    var res = await u.getIdTokenResult(false);   // token en cache : aucun appel réseau requis (OK hors ligne)
    var claims = (res && res.claims) || {};
    var slug = claims.tenant;
    if (typeof slug === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(slug) && slug.length <= 50) return slug;
    return null;
  } catch (e) {
    if (DEBUG) console.warn('[_mvRecoverTenantFromClaim]', (e && (e.code || e.message)) || e);
    return null;
  }
}

// ── _fbLoad (point d'entrée pré-auth) ──
window._fbLoad = async function () {
  _loadQueue();
  if (!localStorage.getItem('mavigne_tenant')) {
    // #tenant-recovery : localStorage purgé (éviction iOS/ITP, données effacées) alors qu'une
    // session Firebase est restaurée → on récupère le slug depuis le claim plutôt que d'ouvrir
    // le wizard "nouveau domaine" pour un utilisateur déjà installé.
    var _recoveredSlug = await _mvRecoverTenantFromClaim();
    if (_recoveredSlug) {
      localStorage.setItem('mavigne_tenant', _recoveredSlug);
      if (typeof window.fbSetTenant === 'function') window.fbSetTenant(_recoveredSlug);
      if(DEBUG) console.log('[Tenant] Récupéré depuis le claim après purge localStorage :', _recoveredSlug);
      // → on poursuit le flux normal ci-dessous (pending / roster / …) avec le tenant restauré.
    } else {
      // Accueil public : aucun tenant ET aucune session = ce n'est pas un client, c'est un
      // visiteur. Lui ouvrir l'assistant « Configuration initiale » n'a aucun sens : le serveur
      // (onboardTenant) refuse tout slug absent du registre GT, le formulaire ne peut pas aboutir.
      // On affiche les portes réelles (site, démo, lien d'installation). L'onboarding reste
      // atteignable par le chemin normal : lien ?tenant=slug → statut 'pending' ci-dessous.
      if(DEBUG) console.log('[Accueil] Aucun tenant — écran public');
      if (typeof window.showPublicLanding === 'function') { window.showPublicLanding(); return; }
      if (typeof window.showOnboarding === 'function') window.showOnboarding();
      return;
    }
  }
  // Routage registre PUBLIC : un domaine « en attente » (créé par GT, jamais configuré)
  // ouvre l'assistant d'onboarding sans dépendre d'une lecture authentifiée (la lecture de
  // mavigne_<slug>/membres ci-dessous échouerait sans session → page de login parasite).
  try {
    var _tstatus = await window._fbTenantStatus(localStorage.getItem('mavigne_tenant'));
    if (_tstatus === 'pending' && typeof window.showOnboarding === 'function') {
      if(DEBUG) console.log('[Onboarding] Domaine en attente →', localStorage.getItem('mavigne_tenant'));
      window.showOnboarding();
      return;
    }
  } catch (e) {}
  if (!navigator.onLine) {
    if(DEBUG) console.log('[Offline] Démarrage hors ligne — chargement localStorage');
    _showOfflineQueueBadge();
    if (typeof window.loadData === 'function') window.loadData();
    if (typeof window.initLogin === 'function') window.initLogin();
    return;
  }
  showSyncBadge('⏳ Connexion…', '#B8913A');
  // #roster : la liste des profils de l'écran de connexion est lue via une Cloud Function
  // (getLoginRoster, App Check, SANS auth requise). Un téléphone qui n'a jamais eu de session
  // ne peut PAS lire mavigne_<slug>/membres (les règles exigent le claim tenant) ; il retombait
  // alors sur la liste codée en dur (permanents seulement) → les membres ajoutés ensuite (ex.
  // nouveaux saisonniers) n'avaient pas de tuile. On lit ici la liste à jour côté serveur ;
  // si la function échoue (offline / KO), on retombe sur la lecture Firestore directe ci-dessous
  // (qui fonctionne quand une session est déjà active sur l'appareil).
  try {
    if(DEBUG) console.log('[Login] Roster via getLoginRoster (pre-auth)');
    var _rr = await window.fbCallFn('getLoginRoster', { tenant: localStorage.getItem('mavigne_tenant') }, { timeout: 15000 });
    var _roster = (_rr && Array.isArray(_rr.roster)) ? _rr.roster : null;
    if (_roster) {
      if (_roster.length > 0) {
        applyFbData('membres', _roster);
        showSyncBadge('', '#3D6B27');
      } else {
        if(DEBUG) console.log('[Onboarding] Roster vide pour tenant', TENANT_ID, '-> onboarding');
        if (typeof window.showOnboarding === 'function') window.showOnboarding();
        return;
      }
      if (typeof window.initLogin === 'function') window.initLogin();
      return;
    }
  } catch (e) {
    if(DEBUG) console.warn('[Login] getLoginRoster KO -> repli lecture directe:', (e && (e.code || e.message)) || e);
  }
  try {
    if(DEBUG) console.log('🔥 Chargement membres (pré-auth)');
    var membresSnap = await getDoc(fbDocRef('membres'));
    if (membresSnap.exists()) {
      applyFbData('membres', membresSnap.data().value);
      showSyncBadge('', '#3D6B27');
    } else {
      // Nouveau tenant sans membres — afficher l'onboarding
      if(DEBUG) console.log('[Onboarding] Aucun membre Firestore pour tenant', TENANT_ID, '→ onboarding');
      if (typeof window.showOnboarding === 'function') window.showOnboarding();
      return;
    }
  } catch (e) {
    console.warn('🔥 Firebase membres load error:', e);
    showSyncBadge('📵 Mode hors ligne', '#7A4F2E');
    if (typeof window.loadData === 'function') window.loadData();
  }
  if (typeof window.initLogin === 'function') window.initLogin();
};

// ════════════════════════════════════
// EXPOSITION AUTH sur window.firebase
// Le reste du code appelle firebase.auth().signInWithEmailAndPassword(...)
// On recrée l'objet firebase.auth() comme compatibilité minimale
// ════════════════════════════════════
window.firebase = window.firebase || {};

// Objet qui imite firebase.auth() (compat SDK v8/v9)
var _authCompat = {
  signInWithEmailAndPassword: function (email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  },
  signOut: function () {
    return signOut(auth);
  },
  sendPasswordResetEmail: function (email) {
    return sendPasswordResetEmail(auth, email);
  },
  createUserWithEmailAndPassword: function (email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  },
  get currentUser() {
    return auth.currentUser;
  },
  onAuthStateChanged: function (cb) {
    return onAuthStateChanged(auth, cb);
  },
};

// EmailAuthProvider.credential — utilisé dans confirmChangePwd()
_authCompat.EmailAuthProvider = {
  credential: function (email, password) {
    return EmailAuthProvider.credential(email, password);
  },
};

// reauthenticateWithCredential et updatePassword sont appelés sur le user Firebase
// On les greffe sur le prototype de l'objet user retourné par auth.currentUser
// via monkey-patch au niveau de l'objet auth
window.firebase.auth = function () { return _authCompat; };
// Copie statique pour firebase.auth.EmailAuthProvider (syntaxe compat)
window.firebase.auth.EmailAuthProvider = _authCompat.EmailAuthProvider;

// reauthenticateWithCredential et updatePassword sont des fonctions top-level
// dans SDK v10 — on les expose sur window pour que confirmChangePwd() puisse
// les appeler via : await firebaseUser.reauthenticateWithCredential(credential)
// → on les greffe sur tous les objets User via un wrapper au moment de la connexion.
// Voir note dans index.html : confirmChangePwd() utilise firebaseUser.reauthenticateWithCredential
// On surcharge la valeur retournée par auth.currentUser pour ajouter ces méthodes.
function _wrapFirebaseUser(user) {
  if (!user) return user;
  if (user._mavigneWrapped) return user;
  user.reauthenticateWithCredential = function (credential) {
    return reauthenticateWithCredential(user, credential);
  };
  user.updatePassword = function (newPassword) {
    return updatePassword(user, newPassword);
  };
  user._mavigneWrapped = true;
  return user;
}

// Intercepter currentUser pour toujours retourner un user wrappé
Object.defineProperty(_authCompat, 'currentUser', {
  get: function () { return _wrapFirebaseUser(auth.currentUser); },
  configurable: true,
});

// Wrapper signInWithEmailAndPassword pour que le cred.user retourné soit wrappé
_authCompat.signInWithEmailAndPassword = function (email, password) {
  return signInWithEmailAndPassword(auth, email, password).then(function (cred) {
    _wrapFirebaseUser(cred.user);
    return cred;
  });
};

_authCompat.createUserWithEmailAndPassword = function (email, password) {
  return createUserWithEmailAndPassword(auth, email, password).then(function (cred) {
    _wrapFirebaseUser(cred.user);
    return cred;
  });
};

// Exposer fbPullStatic pour Réglages (appelé depuis renderReglages)
window.fbPullStatic = fbPullStatic;

// ════ Création compte Auth sans déconnecter l'admin ════
// Utilise une app Firebase secondaire temporaire pour créer le compte
// sans affecter la session de l'admin connecté.
// SEC-1 : le fallback « app secondaire » a été RETIRÉ.
//   Il ne se déclenchait que sur functions/not-found | functions/unavailable, c'est-à-dire
//   sur une panne TRANSITOIRE de Cloud Functions (cold start, 503) — exactement le cas où
//   il suffit de réessayer. Son commentaire disait lui-même « claims à poser via
//   gtSetTenantClaims » : il créait un compte Auth SANS AUCUN claim. Conséquences :
//     • ni `tenant` → le compte ne lit rien, ni `adm`/`plan` → il n'écrit rien ;
//     • l'admin voyait pourtant « 👤 X ajouté ✓ » et le membre partait dans le doc
//       `membres` : panne différée, sans trace, découverte des semaines plus tard ;
//     • le compte Auth orphelin réservait l'adresse → toute nouvelle tentative
//       échouait en auth/email-already-in-use, erreur incompréhensible sur le terrain.
//   Le rendre « bruyant » n'aurait rien réglé : il faut ne RIEN créer. Sans lui, l'erreur
//   remonte immédiatement (« ❌ Erreur : … »), rien n'est créé, et réessayer marche.
//   Seul chemin de création : la Cloud Function createMemberAccount, qui pose
//   {tenant, ro?, adm?, plan, trial_until?} de façon atomique.
// SEC-2 — `password` est désormais FACULTATIF. Omis (ou vide), le serveur génère un mot
// de passe prononçable unique et le renvoie : l'appelant DOIT l'afficher à l'admin, car
// il n'existe plus nulle part ensuite. Le compte porte mustChangePwd → 1er login forcé.
window.createAuthAccount = async function (email, password, opts) {
  try {
    // ⚠️ `opts.tenant` AVANT TENANT_ID, et ce n'est pas un detail : depuis le panneau
    //    GUERETTECH, TENANT_ID vaut ce que localStorage porte (souvent rien en fenetre
    //    privee, parfois le domaine consulte juste avant) — jamais le domaine affiche a
    //    l'ecran. Le compte partait donc sur le mauvais tenant, ou nulle part, pendant
    //    que la fiche membre, elle, etait ecrite chez le bon via fbAdminWrite. Le membre
    //    apparaissait dans l'equipe et ne pouvait pas se connecter : panne differee, sans
    //    trace. Un appelant client ne passe pas `tenant` et retombe sur TENANT_ID : le
    //    chemin Reglages › Equipe ne change pas d'un iota.
    const res = await window.fbCallFn('createMemberAccount', {
      email: email, password: password || undefined,
      tenant: (opts && opts.tenant) || TENANT_ID, roles: (opts && opts.roles) || []
    });
    return { user: { uid: res.uid, email: res.email }, password: res.password, generated: !!res.generated };
  } catch (e) {
    // Codes auth/* préservés pour les messages d'erreur existants (reglages/admin-gt)
    if (e && e.details && e.details.authCode) { e.code = e.details.authCode; throw e; }
    throw e;
  }
};

// SEC-1 — repose les claims `adm`/`ro` d'un membre après changement de rôles.
// Appelée par reglages.js (enregistrement d'un membre). Sans elle, promouvoir
// quelqu'un administrateur ne lui donnerait aucun droit d'écriture tant que
// gtBackfillClaims n'a pas été relancé à la main.
window._fbUpdateMemberRoles = function (email, roles) {
  return window.fbCallFn('updateMemberRoles', { email: email, roles: roles || [] });
};

// ── SEC-2 — mots de passe ────────────────────────────────────────────

// L'utilisateur remplace SON mot de passe initial. Aucune garde de rôle côté serveur
// (un saisonnier ro:true doit pouvoir s'en servir, sinon il reste bloqué à vie sur
// l'écran de premier login). Au retour, le jeton est rafraîchi de FORCE : le claim
// mustChangePwd vient de disparaître côté serveur, mais le jeton en cache (~1 h) le
// porterait encore → sans ce getIdTokenResult(true), l'app renverrait l'utilisateur sur
// l'écran de changement qu'il vient tout juste de valider.
window._fbCompleteFirstLogin = async function (newPassword) {
  var r = await window.fbCallFn('completeFirstLogin', { newPassword: newPassword });
  await _mvLoadClaims(true);
  return r;
};

// L'admin du domaine dépanne un membre. Renvoie { ok, email, password } — le mot de
// passe n'est lisible qu'ici, une seule fois.
window._fbResetMemberPassword = function (email) {
  return window.fbCallFn('resetMemberPassword', { email: email });
};

// Ce compte doit-il changer son mot de passe avant d'entrer ? Lu dans les claims déjà en
// mémoire (aucun appel réseau). Appelé par confirmLogin (app.js).
window._mvMustChangePwd = function () {
  return !!(window._MV_CLAIMS && window._MV_CLAIMS.mustChangePwd === true);
};


// ── Lecture cross-tenant — admin GUERETTECH uniquement ──
// Permet de lire n'importe quelle collection mavigne_{slug} depuis l'interface admin.
// Appels autorisés par les règles Firestore (auth!=null && tenant.matches('mavigne_.*')).
window.fbAdminRead = async function(tenantSlug, key) {
  try {
    var snap = await getDoc(doc(db, 'mavigne_' + tenantSlug, key));
    return snap.exists() ? snap.data().value : null;
  } catch(e) { console.warn('[fbAdminRead]', tenantSlug, key, e.code); return null; }
};

// Lecture de la collection _guerettech (liste des tenants, config opérateur).
// Nécessite la règle Firestore : match /_guerettech/{doc} { allow read, write: if request.auth.token.email == 'ngdevpro@gmail.com'; }
window.fbAdminReadGT = async function(key) {
  try {
    var snap = await getDoc(doc(db, '_guerettech', key));
    return snap.exists() ? snap.data() : null;
  } catch(e) { console.warn('[fbAdminReadGT]', key, e.code); return null; }
};

window.fbAdminWriteGT = async function(key, value) {
  try {
    await setDoc(doc(db, '_guerettech', key), value);
  } catch(e) { console.warn('[fbAdminWriteGT]', key, e.code); throw e; }
};

// ════ SEC-GT — session GUERETTECH : vérité serveur + session non persistante ════
//
// _fbClaims(force) : les claims RÉELS du jeton. Seule source de vérité pour l'accès
// GT — window.currentUser est un objet JS local, modifiable depuis la console du
// navigateur. force=true force le rafraîchissement du jeton (sinon ~1 h de cache).
window._fbClaims = async function(force) {
  try {
    var u = auth.currentUser;
    if (!u) return null;
    var r = await u.getIdTokenResult(!!force);
    return (r && r.claims) ? r.claims : null;
  } catch(e) {
    if (window.logError) window.logError({ level:'info', cat:'auth', msg:'_fbClaims a echoue', detail:(e && e.code) || String(e) });
    return null;
  }
};

// _fbGtSessOk(claims) : DEFINITION UNIQUE de « la session GUERETTECH est-elle
// ouverte ? ». Elle doit dire EXACTEMENT la meme chose que les deux autres
// couches, sinon l'ecran s'ouvre pendant que Firestore refuse tout, sans que
// rien n'explique pourquoi :
//   - claims.js  : typeof t.gts === 'number' && t.gts > Date.now()
//   - rules      : token.get('gts', 0) > request.time.toMillis()
// ⚠️ Le test de TYPE compte. `Number('1754…') > now` serait vrai cote client
// alors que les rules, qui comparent un texte a un entier, echouent et
// refusent : trois couches, un seul enonce.
window._fbGtSessOk = function(cl) {
  return !!(cl && cl.gtAdmin === true
            && typeof cl.gts === 'number' && cl.gts > Date.now());
};

// _fbSessionOnly() : la session ne survit pas à la fermeture de l'onglet.
// — Détecter la navigation privée n'est pas fiable ; rendre la session non
//   persistante donne le même résultat, dans tous les navigateurs.
// ⚠️ À poser AVANT signInWithEmailAndPassword : setPersistence ne s'applique
//   qu'aux connexions suivantes.
// ⚠️ Chemin GUERETTECH UNIQUEMENT. Les comptes clients gardent la persistance
//   locale : une PWA de terrain ne peut pas redemander un mot de passe à chaque
//   ouverture, entre deux rangs, avec des gants.
window._fbSessionOnly = async function() {
  try { await setPersistence(auth, browserSessionPersistence); return true; }
  catch(e) {
    if (window.logError) window.logError({ level:'warning', cat:'auth', msg:'setPersistence a echoue', detail:(e && e.code) || String(e) });
    return false;
  }
};

// _fbReadLeads() : collection `leads` (demandes du formulaire public), GT-only en
// lecture par les rules, écrite uniquement par la Cloud Function submitLead.
// ⚠️ Lecture INTÉGRALE, sans where/orderBy/limit : l'invariant « aucune requête
// filtrée, donc aucun index composite » reste vrai (cf. firestore.indexes.json,
// qui n'existe pas et ne doit pas exister). Le tri se fait en mémoire.
window._fbReadLeads = async function() {
  try {
    var snap = await getDocs(collection(db, 'leads'));
    var out = [];
    snap.forEach(function(d) {
      var v = d.data() || {};
      v._id = d.id;
      out.push(v);
    });
    return out;
  } catch(e) {
    if (window.logError) window.logError({ level:'info', cat:'firebase', msg:'_fbReadLeads refuse', detail:(e && e.code) || String(e) });
    return null;
  }
};

// ── Dernières connexions clients — admin GUERETTECH uniquement ──
// Source : métadonnées Firebase Auth (dernière activité = refresh de l'ID token, repli sur le
// dernier login). CF GT-only gtLastConnections. → { tenants: { slug: {last, members[]} } }.
window._fbLastConnections = function(slugs) {
  return window.fbCallFn('gtLastConnections', slugs ? { slugs: slugs } : {}, { timeout: 30000 });
};

// ── Écriture cross-tenant — admin GUERETTECH uniquement ──
// Écrit {value: …} dans mavigne_{slug}/{key} (même format que fbSave).
// Utilisé par admin-gt.js (création membre, config, KML). Retourne true/false.
window.fbAdminWrite = async function(tenantSlug, key, value) {
  try {
    await setDoc(doc(db, 'mavigne_' + tenantSlug, key), { value: deepClone(value) });
    return true;
  } catch(e) { console.warn('[fbAdminWrite]', tenantSlug, key, e.code); return false; }
};

// ── Vérification d'unicité du slug (onboarding) ──
// 1. Registre public _guerettech/tenants ({slugs:[…]}) — lisible sans auth (règle dédiée)
// 2. Si authentifié : vérifie aussi l'existence de mavigne_{slug}/config et /membres
// Retourne true si le slug est déjà pris, false sinon (false en cas de doute réseau).
window.fbCheckTenantExists = async function(slug) {
  try {
    var reg = await getDoc(doc(db, '_guerettech', 'tenants'));
    if (reg.exists() && Array.isArray(reg.data().slugs) && reg.data().slugs.indexOf(slug) >= 0) return true;
  } catch(e) { console.warn('[fbCheckTenantExists] registre', e.code); }
  if (auth.currentUser) {
    try {
      var c = await getDoc(doc(db, 'mavigne_' + slug, 'config'));
      if (c.exists()) return true;
      var m = await getDoc(doc(db, 'mavigne_' + slug, 'membres'));
      if (m.exists()) return true;
    } catch(e) { console.warn('[fbCheckTenantExists] tenant', e.code); }
  }
  return false;
};

// ── Statut d'un domaine dans le registre PUBLIC _guerettech/tenants ──
// Lisible sans authentification (règle dédiée allow read: if true). Sert au routage
// pré-auth de _fbLoad : un domaine « en attente » (créé par GT, jamais configuré) ouvre
// directement l'assistant d'onboarding, sans dépendre d'une lecture Firestore authentifiée.
// Retourne 'pending' | 'active' | null (inconnu / legacy comme marchand-grillot).
window._fbTenantStatus = async function (slug) {
  try {
    var reg = await getDoc(doc(db, '_guerettech', 'tenants'));
    if (!reg.exists()) return null;
    var data = reg.data() || {};
    var cli = (data.clients && typeof data.clients === 'object') ? data.clients[slug] : null;
    if (cli && (cli.status === 'pending' || cli.status === 'active')) return cli.status;
    return null;
  } catch (e) { if(DEBUG) console.warn('[_fbTenantStatus]', e.code || e.message); return null; }
};

// ── Onboarding E2E d'un nouveau domaine (Cloud Function, appelable sans auth) ──
// Crée le compte admin AVEC le claim tenant (+ plan/essai du registre) et écrit les docs
// initiaux côté serveur. obFinalize enchaîne ensuite signIn + getIdToken(true).
window._fbOnboardTenant = function (payload) {
  return window.fbCallFn('onboardTenant', payload, { timeout: 120000 });
};

// ════ PLAN & ESSAI 15 JOURS — lecture des custom claims (gating modules) ════
// Les claims plan/trial_until sont posés côté serveur (claims.js, inviolables).
// window._MV_CLAIMS est rafraîchi à chaque onAuthStateChanged + après activation/conversion.
window._MV_CLAIMS = window._MV_CLAIMS || {};
async function _mvLoadClaims(force) {
  try {
    var u = auth.currentUser;
    if (!u) { window._MV_CLAIMS = {}; return window._MV_CLAIMS; }
    var res = await u.getIdTokenResult(!!force);
    window._MV_CLAIMS = res.claims || {};
  } catch (e) { /* on garde l'ancien snapshot */ }
  return window._MV_CLAIMS;
}
window._mvLoadClaims = _mvLoadClaims;

// Plan d'abonnement : 'essentiel' | 'vigneron' | 'domaine'. Défaut 'domaine'
// (gating opt-in : l'existant garde l'accès complet ; on RESTREINT en posant un plan plus bas).
window._plan = function () {
  var p = window._MV_CLAIMS && window._MV_CLAIMS.plan;
  return (p === 'essentiel' || p === 'vigneron' || p === 'domaine') ? p : 'domaine';
};

// Statut essai d'après le claim trial_until (epoch ms). {active, expired, daysLeft, level}.
// level : 'ok' (>=4 j, or) · 'warn' (2-3 j, orange) · 'urgent' (<=1 j, rouge).
window._trialStatus = function () {
  var tu = window._MV_CLAIMS && window._MV_CLAIMS.trial_until;
  if (!tu || typeof tu !== 'number') return { active: false, expired: false, daysLeft: 0, level: 'ok' };
  var now = Date.now();
  if (now >= tu) return { active: true, expired: true, daysLeft: 0, level: 'urgent' };
  var daysLeft = Math.ceil((tu - now) / 86400000);
  var level = daysLeft >= 4 ? 'ok' : (daysLeft >= 2 ? 'warn' : 'urgent');
  return { active: true, expired: false, daysLeft: daysLeft, level: level };
};

// Accès module selon plan + flag produit.
//   vigne / journal / reglages / accueil : tous les plans
//   tracteur / phyto                      : vigneron+
//   planning / pilotage / cave            : domaine
// Overrides par module (cases à cocher de la fiche GT), lus dans CONFIG.features :
//   features[mod] === true  -> module forcé visible (prime sur la formule)
//   features[mod] === false -> module forcé masqué
//   absent / undefined      -> repli sur le mapping de la formule (plan)
// Formule : essentiel = socle ; vigneron = + tracteur/phyto ; domaine = + planning/pilotage/cave.
// Phyto suit Tracteur (pas d'entrée dock propre). Cave visible par défaut dès la formule domaine.
// ── Restriction PAR MEMBRE (allegement de l'interface) ──────────────────────
// Un caviste n'a que faire de l'avancement des parcelles ; un ouvrier n'a rien
// a faire dans la Cave. L'admin coche/decoche les modules dans la fiche du
// membre (Reglages > Equipe) -> m.mods = { cave:false, vigne:false, … }.
// currentUser EST l'objet membre (confirmLogin : `currentUser = m`), et
// _mvRefreshCurrentUserRoles recopie `mods` a chaque re-sync du doc `membres`.
//
// ⚠️ RESTRICTION SEULE, jamais d'elargissement : seul `false` a un effet. Un
// `true` ne redonne PAS un module que la formule du domaine interdit — sinon un
// ouvrier qui se cocherait Planning tomberait sur les acomptes et les compteurs
// d'heures. Le champ ne descend donc jamais en dessous du gating existant.
//
// ⚠️⚠️ CE N'EST PAS UNE BARRIERE DE SECURITE, c'est du confort d'affichage. Le
// doc `membres` est lisible par toute l'equipe et rien n'empeche de forcer la
// main depuis la console. Le verrou REEL reste cote rules (SEC-1 : `paie` et
// `planning_*` admin-only en ecriture, `paie` admin-only en lecture). Ne jamais
// s'appuyer la-dessus pour cloisonner une donnee sensible.
//
// Defaut : champ absent -> aucune restriction (zero regression pour l'existant).
window._mvModOff = function (mod) {
  try {
    var cu = window.currentUser;
    // GT admin (hors tenant) et demo/visite guidee : jamais restreints.
    if (!cu || cu._isGTAdmin || cu._isDemo) return false;
    var mods = cu.mods;
    if (!mods || typeof mods !== 'object') return false;
    return mods[mod] === false;
  } catch (e) { return false; }
};

// Gating par FORMULE seul, sans la couche membre. Deux appelants :
//   • _canModule ci-dessous (le cas normal) ;
//   • la fiche membre de Reglages, qui doit lister les modules du DOMAINE et non
//     ceux de l'admin en train d'editer — sans quoi un admin qui s'est masque la
//     Cave ne pourrait plus la re-cocher pour son caviste.
// `vigne` et `reglages` n'ont pas de palier : tous les plans les incluent, elles
// tombent dans le `default: return true`.
window._planModule = function (mod) {
  var rank = { essentiel: 1, vigneron: 2, domaine: 3 };
  var pr = rank[window._plan()] || 3;
  var cfg = (window.CONFIG && window.CONFIG.features) || {};
  function ov(k) { return cfg[k] === true ? true : (cfg[k] === false ? false : null); }
  switch (mod) {
    case 'tracteur': { var oT = ov('tracteur'); return oT !== null ? oT : (pr >= 2); }
    case 'phyto': {
      var oP = ov('phyto'); if (oP !== null) return oP;
      var oPt = ov('tracteur'); if (oPt !== null) return oPt; // phyto suit tracteur
      return pr >= 2;
    }
    case 'planning': { var oL = ov('planning'); return oL !== null ? oL : (pr >= 3); }
    case 'pilotage': { var oI = ov('pilotage'); return oI !== null ? oI : (pr >= 3); }
    case 'cave':     { var oC = ov('cave');     return oC !== null ? oC : (pr >= 3); }
    case 'reserve':  { var oR = ov('reserve');  return oR !== null ? oR : (pr >= 3); }
    default: return true;
  }
};

// Acces effectif = formule du domaine ∧ restriction du membre.
window._canModule = function (mod) {
  // Socle inalienable : sans Reglages, plus de changement de mot de passe, plus
  // de theme, plus de deconnexion — on n'enferme personne dehors.
  if (mod === 'reglages') return true;
  if (window._mvModOff(mod)) return false;
  return window._planModule(mod);
};

// Wrappers callables : activation essai (client) · plan/conversion (GT) · e-mail membre.
window._fbActivateTrial = async function (code) {
  var r = await window.fbCallFn('activateTrial', { code: code });
  await _mvLoadClaims(true);
  return r;
};
window._fbSetTenantPlan = function (tenant, plan, trialDays) {
  return window.fbCallFn('gtSetTenantPlan', { tenant: tenant, plan: plan, trialDays: trialDays });
};
// Reconduction UNIQUE de l'essai : 15 jours de plus, a compter de MAINTENANT.
// ⚠️ La borne n'est pas ici. gtRenewTrial refuse la seconde reconduction avec
//    failed-precondition — un bouton grise se contourne, une regle serveur non.
// Timeout large : la fonction repose le claim trial_until sur chaque membre, un par un.
window._fbRenewTrial = function (tenant) {
  return window.fbCallFn('gtRenewTrial', { tenant: tenant }, { timeout: 120000 });
};
window._fbUpdateMemberEmail = function (oldEmail, newEmail, tenant) {
  return window.fbCallFn('updateMemberEmail', { oldEmail: oldEmail, newEmail: newEmail, tenant: tenant || undefined });
};
// Suppression DÉFINITIVE d'un domaine entier (GT admin) — guard = mot de passe de suppression.
window._fbDeleteTenant = function (slug, guard) {
  return window.fbCallFn('gtDeleteTenant', { slug: slug, guard: guard }, { timeout: 300000 });
};

// ════ FLUX ESSAI 30 JOURS (codes ESSAI-XX-XXXX) ════
// Appelées par app.js (écran code d'accès tenant démo).

// Connexion au compte démo (read-only par règles Firestore). Retourne true/false.
// Lot 5 : forcer un refresh du token ID une fois par chargement, pour que les
// custom claims fraîchement posés (backfill, création) soient pris en compte
// sans attendre l'expiration (~1h) du token en cache.
onAuthStateChanged(auth, function (u) {
  if (!u) { window._MV_CLAIMS = {}; return; }
  if (!window._claimsTokenRefreshed) {
    window._claimsTokenRefreshed = true;
    u.getIdToken(true).then(function () { return _mvLoadClaims(true); }).catch(function () { _mvLoadClaims(false); });
  } else {
    _mvLoadClaims(false);
  }
});

window.fbLoginDemo = async function(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return true;
  } catch(e) { console.warn('[fbLoginDemo]', e.code); return false; }
};

// Lecture des codes d'essai — _guerettech/demo_tokens {value:[…]}.
// Règle requise : allow read pour le compte démo sur ce document.
window.fbReadDemoTokens = async function() {
  try {
    var snap = await getDoc(doc(db, '_guerettech', 'demo_tokens'));
    return (snap.exists() && Array.isArray(snap.data().value)) ? snap.data().value : [];
  } catch(e) { console.warn('[fbReadDemoTokens]', e.code); return []; }
};

// Trace un accès essai dans _guerettech/access_log {value:[…]} (format agtLogAccess).
// Règle requise : allow write pour le compte démo sur ce document. Cap 100 entrées.
window.fbLogDemoAccess = async function(code, action) {
  try {
    var ref = doc(db, '_guerettech', 'access_log');
    var snap = await getDoc(ref);
    var list = (snap.exists() && Array.isArray(snap.data().value)) ? snap.data().value : [];
    list.unshift({ id: 'al' + Date.now(), ts: new Date().toISOString(), tenant: 'essai:' + code, action: 'Essai ' + code + ' \u2014 ' + action, icon: '\uD83C\uDFAB' });
    if (list.length > 100) list.length = 100;
    await setDoc(ref, { value: list });
  } catch(e) { console.warn('[fbLogDemoAccess]', e.code); }
};

// ── Centralisation cross-tenant des erreurs ──
// Appende une entrée dans mavigne_{TENANT_ID}/error_log (format {value:[…]})
// Accessible à tout utilisateur authentifié (règles Firestore existantes, pas de changement requis).
// Lisible par Admin GT via fbAdminRead(slug, 'error_log').
window.fbAppendError = async function(entry) {
  try {
    var ref = fbDocRef('error_log');
    var snap = await getDoc(ref);
    var list = (snap.exists() && Array.isArray(snap.data().value)) ? snap.data().value : [];
    list.unshift(entry);
    if (list.length > 100) list.length = 100; // cap 100 entrées par tenant
    await setDoc(ref, { value: list });
  } catch(e) { console.warn('[fbAppendError]', e.code || e.message); }
};

// ── Signalement de problème (support) — connecté OU avant connexion ──
// Relaye vers la Cloud Function submitReport (écrit support_reports + notifie par
// e-mail). Fonctionne aussi sans session Auth (onCall + App Check).
window.fbSubmitReport = function(payload) {
  return window.fbCallFn('submitReport', payload || {}, { timeout: 20000 });
};
window.fbResolveReport = function(id, tenant) {
  return window.fbCallFn('resolveReport', { id: id, tenant: tenant || '' }, { timeout: 15000 });
};

// ── Mise à jour runtime du TENANT_ID (utilisé par obFinalize dans app.js) ──
window.fbSetTenant = function(slug) {
  TENANT_ID = slug;
  if(DEBUG) console.log('[Tenant] Mise à jour runtime :', slug);
  // Notifier le SW pour maintenir le manifest dynamique à jour
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function (reg) {
      if (reg.active) reg.active.postMessage({ type: 'SET_TENANT', tenant: slug });
    }).catch(function () {});
  }
};

// ── Firebase Storage — analyses labo cave ──
// Limite 10 Mo imposée côté client ET côté Storage rules
const _CAVE_ANA_MAX_BYTES = 10 * 1024 * 1024;

window.fbUploadAnalyse = async function(file, onProgress) {
  var timestamp = Date.now();
  var safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  var path = 'tenants/' + TENANT_ID + '/analyses/' + timestamp + '_' + safeName;
  var fileRef = _storageRef(_storage, path);
  return new Promise(function(resolve, reject) {
    var task = uploadBytesResumable(fileRef, file, { contentType: 'application/pdf' });
    task.on('state_changed',
      function(snapshot) {
        var pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(pct);
      },
      function(error) { reject(error); },
      function() {
        getDownloadURL(task.snapshot.ref).then(function(url) {
          resolve({ url: url, storage_path: path });
        }).catch(reject);
      }
    );
  });
};

window.fbDeleteAnalyse = async function(storagePath) {
  var fileRef = _storageRef(_storage, storagePath);
  return deleteObject(fileRef);
};


if(DEBUG) console.log('🔥 Firebase prêt, en attente de _fbLoad()');
