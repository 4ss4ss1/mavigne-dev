// ════════════════════════════════════════════════════════════════
// MA VIGNE — src/admin-gt.js
// Dashboard Admin GUERETTECH
// Phase 2a — extrait depuis app.js
// © 2026 Nicolas GUERET / GUERETTECH
// ════════════════════════════════════════════════════════════════
//
// Dépendances :
//   showToast, _escHtml, _ERR_KEY ← utils.js
//   window.currentUser            ← app.js / onboarding.js
//   window.fbAdminReadGT, window.fbAdminWriteGT,
//   window.fbAdminRead            ← firebase.js
//   window.goHub, window.openOv, window.closeOv ← app.js
//
// Constantes locales (source de vérité : app.js — synchroniser si modifié)
import { GT_ADMIN_EMAIL, _mvIcon } from './utils.js';
const GT_BASE_URL    = 'https://mavigneapp.fr';
// ════════════════════════════════════════════════════════════════

import { showToast, _escHtml, _escAttr, _ERR_KEY } from './utils.js';

const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if(DEBUG) console.log('[Ma Vigne] admin-gt.js chargé');

// ════ ADMIN GUERETTECH ════
var _agtTenants    = [];
var _agtReportsGT  = [];  // signalements avant connexion (_guerettech/support_reports)
var _agtTab        = 'radar';    // lot C : le Radar est la page d'accueil
// Lot C : les 8 onglets deviennent 6. Une session ouverte pendant le
// deploiement peut porter une ancienne cle — on la fait atterrir au bon endroit.
var _AGT_TAB_MIGR  = { errors:'incidents', reports:'incidents', log:'outils', essais:'outils', kml:'outils' };
var _agtEssais     = [];  // tokens d'essai 30j
var _agtDemoStats  = null;  // stats démo visite guidée {connexions,uniques,last,jours}
// ── SEC-GTC — LE REGISTRE COMMERCIAL QUITTE LE DOCUMENT PUBLIC ─────────────
// `_guerettech/tenants` est lisible SANS AUTHENTIFICATION (regle firestore
// `allow read: if true`) : l'unicite des slugs a l'onboarding et le routage
// pre-auth `_fbTenantStatus` en dependent tous les deux. Il ne doit donc porter
// que ce qui doit etre public : `slugs` et `statuts` (pending/active).
// Plan, essai, dates et montants vivent desormais dans `_guerettech/clients`,
// couvert par `match /_guerettech/{document=**} { if isGtAdmin() }`.
//
// ⚠️ REPLI LEGACY, et il compte : tant que la premiere ecriture GT n'a pas eu
// lieu, le commercial est encore dans l'ancien emplacement. On l'y relit.
// `fbAdminWriteGT` fait un `setDoc` SANS merge : la premiere ecriture reecrit
// `tenants` sans le champ `clients` — la fuite se referme d'elle-meme, sans
// script de migration a lancer a la main.
async function _agtReadClients(){
  var c = window.fbAdminReadGT ? await window.fbAdminReadGT('clients') : null;
  if (c && c.clients && typeof c.clients === 'object') return c.clients;
  var t = window.fbAdminReadGT ? await window.fbAdminReadGT('tenants') : null;
  return (t && t.clients && typeof t.clients === 'object') ? t.clients : {};
}
// ════ GTFIX-1 (§510) — LES ÉCRITURES DE LA CONSOLE PASSENT PAR UNE TRANSACTION ════
// ★★★ L'audit du 01/11 (docs/maquettes/audit-console-gt-2026-11-01.md, GT-B01, B02, B06) : la console
//   prenait une lecture RATÉE pour une liste vide (fbAdminReadGT rend null sur toute erreur), puis
//   réécrivait le document entier — un réseau qui flanche en ajoutant un client, et le registre ne
//   contenait plus que lui. Ailleurs, elle réécrivait la copie chargée à l'ouverture du panneau et
//   effaçait ce qui avait été écrit depuis. Désormais : lire ET écrire d'un bloc (fbGtMaj, fbAdminMaj,
//   fbGtMajRegistre dans firebase.js). Une lecture ratée n'écrit rien, et rien ne part plus tard.
// ⚠️ La fonction passée à une transaction peut être REJOUÉE : elle ne touche qu'à ce qu'elle rend.
//   Les variables du panneau se mettent à jour APRÈS, avec la valeur réellement écrite.
function _agtEchecEcriture(e, quoi){
  var conflit = !!(e && e.conflit);
  if (window.logError) window.logError({ level:'error', cat:'gt-ecriture', msg:quoi+' : rien n\u2019a \u00e9t\u00e9 \u00e9crit', detail:(e && (e.code || e.message)) || String(e) });
  showToast(quoi+(conflit ? ' \u2014 modifi\u00e9 ailleurs entre-temps : recharg\u00e9, refaites le geste.'
                          : ' \u2014 rien n\u2019a \u00e9t\u00e9 \u00e9crit : lecture impossible, r\u00e9essayez.'), '#C0392B');
}
// Comparaison stable : Firestore ne garde pas l'ordre des clés d'un objet.
function _agtJsonStable(v){
  if (v === undefined) return undefined;
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(function(x){ var s = _agtJsonStable(x); return s === undefined ? 'null' : s; }).join(',') + ']';
  return '{' + Object.keys(v).sort().filter(function(k){ return v[k] !== undefined; })
    .map(function(k){ return JSON.stringify(k) + ':' + _agtJsonStable(v[k]); }).join(',') + '}';
}
// Le registre = deux documents écrits ENSEMBLE : `clients` (privé) et `tenants` (public : slugs,
// statuts). On préserve les champs inconnus de `tenants`, on retire `clients`, on recalcule `statuts`.
function _agtRegClients(tenants, docClients){
  if (docClients && docClients.clients && typeof docClients.clients === 'object') return docClients.clients;
  if (tenants && tenants.clients && typeof tenants.clients === 'object') return tenants.clients;
  return {};
}
function _agtRegSortie(tenants, clients, slugs){
  var pub = Object.assign({}, tenants || {});
  delete pub.clients;
  pub.slugs = slugs.slice();
  pub.statuts = {};
  Object.keys(clients).forEach(function(sg){
    var st = clients[sg] && clients[sg].status;
    if (st === 'pending' || st === 'active') pub.statuts[sg] = st;
  });
  return { tenants: pub, clients: { clients: clients, maj: _agtNowISO() } };
}
// fn(clients, slugs) modifie les deux EN PLACE ; rendre false = ne rien écrire.
async function _agtMajRegistre(fn){
  if (!window.fbGtMajRegistre) throw new Error('fbGtMajRegistre indisponible');
  return window.fbGtMajRegistre(function(tenants, docClients){
    var clients = Object.assign({}, _agtRegClients(tenants, docClients));
    var slugs = (tenants && Array.isArray(tenants.slugs)) ? tenants.slugs.slice() : [];
    if (fn(clients, slugs) === false) return null;
    return _agtRegSortie(tenants, clients, slugs);
  });
}
function _agtNowISO(){ return new Date().toISOString(); }

var _agtKmlPolygons = []; // polygones parsés en attente d'upload
var _agtKmlFileName = '';
// ─── Fusion des contours (lot KML-FUSION) ────────────────────────────────────
// ⚠️ `fbAdminWrite(slug,'kml_polygons',…)` REMPLACE la clé entière. Charger un
//    fichier d'une seule parcelle effaçait donc toutes les autres de la carte,
//    sans avertissement et sans retour possible. L'écran lit désormais l'état
//    de la base AVANT d'écrire, et sépare deux gestes qui n'ont rien à voir :
//    compléter un parcellaire, ou le remplacer.
// ⚠️ Même piège sur `parcelles` : la fiche d'une parcelle neuve ne peut être
//    ajoutée qu'en réécrivant la clé entière. D'où la relecture au moment de
//    l'enregistrement (agtKmlSave) et non celle, plus ancienne, de l'aperçu.
var _agtKmlSlug     = '';      // domaine retenu ENTRE deux rendus : agtRenderBody
                               // reconstruit le <select> et perdrait la sélection
var _agtKmlMode     = 'merge'; // 'merge' = compléter · 'replace' = tout remplacer
var _agtKmlBase     = null;    // contours déjà en base (null tant que non lu)
var _agtKmlFiches   = null;    // fiches `parcelles` du domaine (null tant que non lu)
var _agtKmlLu       = '';      // '' | 'load' | 'ok' | 'err' — état de cette lecture
var _agtKmlCreerF   = true;    // créer aussi la fiche des parcelles nouvelles
var _agtKmlConfirm  = false;   // case du geste destructif, remise à zéro à chaque changement
var _agtKmlBusy     = false;
var _agtAccessLog  = [];
// --- AXE A : registre de vente + demandes entrantes ---
var _agtClients    = {};  // _guerettech/clients.clients[slug] : {plan,trialDays,status,created_at,trialExp}
var _agtSlugs      = [];  // memorise pour ne JAMAIS reecrire tenants sans ses slugs
var _agtBilling    = {};  // _guerettech/billing {value:{slug:{fact:[...],note}}}  <- JAMAIS dans tenants
var _agtLeads      = null; // null = pas encore lu / refuse ; [] = lu et vide
var _agtLeadSt     = {};  // _guerettech/leads_status {value:{id:{st,note,ts}}}
var _agtLeadFilter = 'ouverts';
var _agtLeadOpen   = null;
// --- SEC-GT : session ---
var _AGT_IDLE_MS   = 15*60*1000;  // verrouillage apres 15 min sans interaction
var _agtIdleT      = null;        // timer de verrouillage
var _agtSessT      = null;        // timer d'affichage du compte a rebours
var _agtIdleLast   = 0;
var _agtLocked     = false;
var _agtSessEnd    = 0;           // SEC-GT/2 : fin de session serveur (claim gts)
var _agtConnexions = {};  // slug -> {last, members:[…]} — dernières connexions (gtLastConnections)

// ─── Helpers design ──────────────────────────────────────────────────────────
var _AGT_SAISON = '#E8708A';
// ⚠️ Le journal d'acces est ECRIT EN BASE : les lignes d'avant ce lot portent
//   un emoji, celles d'apres un nom d'icone. On traduit A LA LECTURE plutot
//   que de reecrire l'historique — un journal qu'on reecrit n'est plus un
//   journal. Meme patron que l'emoji d'activite tracteur.
function _agtIco(v){
  var x = String(v == null ? '' : v);
  return /^[a-z][a-z0-9-]*$/.test(x) ? _mvIcon(x, 16) : x;
}
var _AGT_LVL = {
  critical:{ icon:'alerte', color:'#EF4444', bg:'rgba(239,68,68,0.10)', border:'rgba(239,68,68,0.28)' },
  error:   { icon:'croix', color:'#F97316', bg:'rgba(249,115,22,0.09)', border:'rgba(249,115,22,0.25)' },
  warning: { icon:'alerte', color:'#EAB308', bg:'rgba(234,179,8,0.08)',  border:'rgba(234,179,8,0.22)' },
  info:    { icon:'info', color:'#4A9FC8', bg:'rgba(74,159,200,0.08)', border:'rgba(74,159,200,0.22)' }
};
var _AGT_CAT = { firebase:'Firebase', network:'Réseau', runtime:'JS Runtime', ui:'Interface', auth:'Auth' };

// ★ GTFIX-4 (§513) — un domaine construit depuis ses lectures : une clé lue en échec donne `null` (affiché
//   « — »), jamais 0 ; `echecs` les nomme. Une clé absente n'est pas un échec (domaine neuf).
var _AGT_CLES_DOM=['config','membres','parcelles','error_log','support_reports','saisons','appareils'];
function _agtDomaineDepuisLectures(slug, L){
  var v=function(k){ return (L[k]&&L[k].etat==='ok')?L[k].v:null; };
  var ko=function(k){ return !!(L[k]&&L[k].etat==='echec'); };
  var cfg=v('config'), mbr=v('membres'), prc=v('parcelles'), errs=v('error_log'), reps=v('support_reports'), sai=v('saisons'), app=v('appareils');
  var errList=Array.isArray(errs)?errs:[], repList=Array.isArray(reps)?reps:[];
  var act=Array.isArray(sai)?sai.filter(function(x){ return x && x.active; })[0]:null;
  return {
    slug:slug,
    nom:(cfg&&cfg.domaine_nom)?cfg.domaine_nom:slug,
    membres:ko('membres')?null:(Array.isArray(mbr)?mbr.filter(function(m){return m.statut!=='inactif'&&m.statut!=='Inactif';}).length:0),
    parcelles:ko('parcelles')?null:(Array.isArray(prc)?prc.filter(function(p){return p.statut!=='Arrachee';}).length:0),
    saison:act?act.nom:'\u2014',
    errors:errList,
    errorsOpen:errList.filter(function(e){return !e.resolved;}).length,
    errorsCrit:errList.filter(function(e){return e.level==='critical'&&!e.resolved;}).length,
    reports:repList,
    reportsOpen:repList.filter(function(r){return !r.resolved;}).length,
    appareils:(app&&typeof app==='object'&&!Array.isArray(app))?app:{},
    echecs:_AGT_CLES_DOM.filter(ko)
  };
}
var _agtLecturesKo=[];

function _agtRelTime(iso){
  var d=(Date.now()-new Date(iso))/1000;
  if(d<60)    return 'il y a '+Math.floor(d)+'s';
  if(d<3600)  return 'il y a '+Math.floor(d/60)+'min';
  if(d<86400) return 'il y a '+Math.floor(d/3600)+'h';
  return 'il y a '+Math.floor(d/86400)+'j';
}

// ─── Chargement principal ─────────────────────────────────────────────────────
// ============================================================================
// SEC-GT — ACCES AU PANNEAU GUERETTECH
// ============================================================================
// Ce qui protege VRAIMENT les donnees, ce sont les rules Firestore (claim
// gtAdmin). Ce bloc protege l'INTERFACE et la SESSION, qui ne l'etaient pas :
//
//   1. la garde historique testait window.currentUser.email — un objet JS local,
//      modifiable depuis la console ; on lit desormais le CLAIM du jeton ;
//   2. aucun setPersistence n'existait dans tout le projet, donc la session GT
//      survivait a la fermeture du navigateur (firebase.js : _fbSessionOnly) ;
//   3. rien ne se refermait tout seul : verrouillage apres 15 min d'inactivite.
//
// Limite assumee et a garder en tete : tout ceci tombe si le mot de passe fuit,
// car un attaquant peut lire Firestore par le SDK sans jamais ouvrir l'app. Le
// second facteur (claim de session pose par une Cloud Function, exige par les
// rules) est le lot suivant — c'est LUI qui ferme cette porte-la.

// Verite serveur. force=true au premier appel d'une session : le jeton est mis
// en cache ~1 h, un claim retire cote serveur n'apparaitrait pas autrement.
async function _agtClaims(force){
  try{ return window._fbClaims ? await window._fbClaims(!!force) : null; }
  catch(e){ return null; }
}

// Renvoie true si l'appelant a le droit. Sinon vide l'ecran et repart.
// ATTENDU : gtAdmin === true. Un jeton qui porte un claim `tenant` sans gtAdmin
// est un compte CLIENT — il ne doit pas voir l'ombre du panneau.
async function _agtGuard(force){
  var cl = await _agtClaims(!!force);
  var ok = !!(cl && cl.gtAdmin === true);
  if(!ok){
    _agtWipe();
    var _why = !cl ? 'aucun jeton' : (cl.tenant ? ('compte client ' + cl.tenant) : 'claim gtAdmin absent');
    if(window.logError) window.logError({level:'warning',cat:'auth',msg:'Acces GT refuse',detail:_why});
    if(window.showToast) showToast('Acc\u00e8s r\u00e9serv\u00e9 \u00e0 GUERETTECH','#C0392B');
    try{ if(window.goHub) window.goHub(); }
    catch(e){ if(window.logError) window.logError({level:'info',cat:'nav',msg:'goHub apres refus GT',detail:(e&&e.message)||String(e)}); }
    return false;
  }
  // SEC-GT/2 — le droit d'ecrire est porte par `gts`, pas par gtAdmin. Sans lui
  // les rules refusent TOUT : mieux vaut le dire ici que laisser l'ecran se
  // remplir de « permission denied » sans explication.
  // Une session expiree ne se rouvre PAS avec le mot de passe seul : il faut un
  // nouveau code. On repart donc du debut plutot que d'ouvrir le verrou 15 min.
  if(!(window._fbGtSessOk ? window._fbGtSessOk(cl) : (typeof cl.gts==='number' && cl.gts>Date.now()))){
    if(window.logError) window.logError({level:'warning',cat:'auth',msg:'Session GT expiree',detail:String(cl.gts||'absente')});
    if(window.showToast) showToast('Session GUERETTECH expir\u00e9e \u2014 nouveau code requis','#B85A1A');
    await agtLockOut();
    return false;
  }
  return true;
}

// Efface tout ce qui a pu etre charge en memoire ET a l'ecran. Appele au refus
// et a la fermeture de session : un panneau qu'on quitte ne doit rien laisser
// derriere lui, y compris dans le DOM d'un onglet reste ouvert.
function _agtWipe(){
  _agtTenants=[]; _agtClients={}; _agtSlugs=[]; _agtBilling={}; _agtBillingBase={}; _agtLecturesKo=[]; _agtSuivi={};
  _agtLeads=null; _agtLeadSt={}; _agtLeadStBase={}; _agtEssais=[]; _agtAccessLog=[];
  _agtConnexions={}; _agtReportsGT=[]; _agtDemoStats=null; _agtLeadOpen=null;
  var b=document.getElementById('agt-body');
  if(b) b.innerHTML='';
  ['agt-sv0','agt-sv1','agt-sv2','agt-sv3'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.textContent='\u2014';
  });
  ['agt-radar-badge','agt-inc-badge','agt-lead-badge'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.style.display='none';
  });
}

// --- Verrouillage par inactivite -------------------------------------------
function _agtIdlePing(){
  _agtIdleLast=Date.now();
  if(_agtLocked) return;
  clearTimeout(_agtIdleT);
  _agtIdleT=setTimeout(function(){ _agtLock('inactivit\u00e9'); }, _AGT_IDLE_MS);
}

function _agtSessArm(){
  // Idempotent : renderAdminGT peut etre rappele plusieurs fois.
  if(!_agtSessArm._on){
    ['pointerdown','keydown','wheel','touchstart'].forEach(function(ev){
      document.addEventListener(ev, _agtIdlePing, {passive:true});
    });
    _agtSessArm._on=true;
  }
  _agtIdlePing();
  clearInterval(_agtSessT);
  _agtSessT=setInterval(_agtSessTick, 20000);
  _agtSessTick();
}

function _agtSessTick(){
  var el=document.getElementById('agt-sess-timer');
  if(!el) return;
  if(_agtLocked){ el.textContent='\u00b7 verrouill\u00e9'; var _sl=document.getElementById('agt-side-sess'); if(_sl) _sl.textContent='Session verrouill\u00e9e'; return; }
  var reste=Math.max(0, _AGT_IDLE_MS-(Date.now()-_agtIdleLast));
  var mn=Math.ceil(reste/60000);
  var txt='\u00b7 verrou dans '+mn+' min';
  // SEC-GT/2 — deux echeances distinctes : le verrou d'inactivite (15 min, se
  // rouvre au mot de passe) et la fin de session (8 h, exige un nouveau code).
  if(_agtSessEnd>0){
    var h=new Date(_agtSessEnd);
    var p=function(n){ return (n<10?'0':'')+n; };
    txt+=' \u00b7 session jusqu\u2019\u00e0 '+p(h.getHours())+':'+p(h.getMinutes());
  }
  el.textContent=txt;
  _agtMajFraicheur();   // ★ GT-UI-4 : « À jour, il y a … »
  var _ss=document.getElementById('agt-side-sess'); if(_ss) _ss.textContent='Session GUERETTECH '+txt;   // ★ GT-UI-1 : la barre latérale
}

// ★★ GTFIX-2 (§511) — LE VERROU COUVRE TOUT (GT-B05). Il était au plan 9500, sous les fenêtres de la
//   console (fiche client, équipe, journal, erreurs, préparation : 9999 à 10001) : au bout de 15 minutes,
//   une fiche ouverte restait visible ET utilisable au-dessus de lui. Désormais : le verrou passe tout en
//   haut (console.html), il est remis à la racine de la page, et TOUT le reste devient `inert` — ni clic,
//   ni clavier, ni lecteur d'écran derrière lui. Seuls les éléments rendus inertes ICI sont rendus au
//   déverrouillage (un élément déjà inerte avant le verrou le reste).
var _agtInertes = [];
function _agtInerte(on){
  var ov = document.getElementById('agt-lock');
  if (on) {
    if (ov && ov.parentNode !== document.body) document.body.appendChild(ov);
    _agtInerte(false);
    Array.prototype.slice.call(document.body.children).forEach(function(el){
      if (el === ov || el.tagName === 'SCRIPT' || el.hasAttribute('inert')) return;
      el.setAttribute('inert', ''); _agtInertes.push(el);
    });
  } else {
    _agtInertes.forEach(function(el){ el.removeAttribute('inert'); });
    _agtInertes = [];
  }
}
function _agtLock(raison){
  _agtLocked=true;
  clearTimeout(_agtIdleT);
  var ov=document.getElementById('agt-lock');
  var why=document.getElementById('agt-lock-why');
  var err=document.getElementById('agt-lock-err');
  var pwd=document.getElementById('agt-lock-pwd');
  if(why) why.textContent=(raison==='manuel')
    ? 'Session mise en pause. Saisissez votre mot de passe pour reprendre.'
    : 'Panneau GUERETTECH rest\u00e9 inactif. Saisissez votre mot de passe pour reprendre.';
  if(err){ err.style.display='none'; err.textContent=''; }
  // iOS + champ pose apres coup : la valeur s'assigne EN JS, jamais par attribut.
  if(pwd){ pwd.value=''; }
  if(ov){ ov.style.display='flex'; }
  _agtInerte(true);
  _agtSessTick();
  setTimeout(function(){ var p=document.getElementById('agt-lock-pwd'); if(p) p.focus(); }, 120);
}

function agtLockNow(){ _agtLock('manuel'); }

// Deverrouillage = REAUTHENTIFICATION reelle (pas une comparaison locale), puis
// re-lecture du claim avec force=true. Si le droit a ete retire entre-temps,
// on ne rouvre pas.
async function agtUnlock(){
  var pwd=document.getElementById('agt-lock-pwd');
  var err=document.getElementById('agt-lock-err');
  var btn=document.getElementById('agt-lock-btn');
  if(!pwd) return;
  var v=pwd.value||'';
  if(!v){
    if(err){ err.textContent='Mot de passe requis.'; err.style.display='block'; }
    return;
  }
  if(btn){ btn.disabled=true; btn.textContent='V\u00e9rification\u2026'; }
  try{
    await firebase.auth().signInWithEmailAndPassword(GT_ADMIN_EMAIL, v);
    var cl=await _agtClaims(true);
    if(!cl || cl.gtAdmin!==true){
      if(err){ err.textContent='Ce compte n\u2019a plus le droit GUERETTECH.'; err.style.display='block'; }
      if(btn){ btn.disabled=false; btn.textContent='D\u00e9verrouiller'; }
      return;
    }
    // SEC-GT/2 — le mot de passe seul ne rouvre pas une session expiree : le
    // claim `gts` exige un nouveau code. On referme proprement et on renvoie a
    // l'ecran de connexion, qui enchainera sur la saisie du code.
    if(!(window._fbGtSessOk ? window._fbGtSessOk(cl) : (typeof cl.gts==='number' && cl.gts>Date.now()))){
      if(err){ err.textContent='Session expir\u00e9e \u2014 un nouveau code est n\u00e9cessaire.'; err.style.display='block'; }
      if(btn){ btn.disabled=false; btn.textContent='D\u00e9verrouiller'; }
      setTimeout(function(){ agtLockOut(); }, 1400);
      return;
    }
    pwd.value='';
    _agtLocked=false;
    _agtInerte(false);
    var ov=document.getElementById('agt-lock');
    if(ov) ov.style.display='none';
    if(btn){ btn.disabled=false; btn.textContent='D\u00e9verrouiller'; }
    _agtIdlePing();
    _agtSessTick();
    renderAdminGT();
  }catch(e){
    var m='Mot de passe incorrect.';
    if(e && e.code==='auth/network-request-failed') m='Pas de connexion r\u00e9seau.';
    if(e && e.code==='auth/too-many-requests')      m='Trop de tentatives \u2014 patientez un instant.';
    if(err){ err.textContent=m; err.style.display='block'; }
    if(btn){ btn.disabled=false; btn.textContent='D\u00e9verrouiller'; }
    if(window.logError) window.logError({level:'warning',cat:'auth',msg:'Deverrouillage GT refuse',detail:(e&&e.code)||String(e)});
  }
}

// Fermeture franche : on efface la memoire AVANT de deconnecter, pour qu'aucun
// ecran ne puisse etre repeint avec des donnees clients pendant le signOut.
async function agtLockOut(){
  _agtWipe();
  clearTimeout(_agtIdleT); clearInterval(_agtSessT);
  _agtLocked=false;
  var ov=document.getElementById('agt-lock');
  if(ov) ov.style.display='none';
  // SEC-GT/2 — retirer le claim `gts` AVANT de deconnecter : sans cela le jeton
  // deja emis reste accepte par les rules jusqu'a son renouvellement (une heure
  // au pire). Best effort : si l'appel echoue, la deconnexion a quand meme lieu.
  try{ if(window.fbCallFn) await window.fbCallFn('gtEndSession', {}, { timeout: 15000 }); }
  catch(e){ if(window.logError) window.logError({level:'info',cat:'auth',msg:'gtEndSession injoignable',detail:(e&&e.code)||String(e)}); }
  try{ await firebase.auth().signOut(); }
  catch(e){ if(window.logError) window.logError({level:'info',cat:'auth',msg:'signOut GT',detail:(e&&e.code)||String(e)}); }
  location.reload();
}

async function renderAdminGT(){
  // SEC-GT — la garde ne teste plus l'e-mail de l'objet JS local mais le claim
  // gtAdmin lu dans le jeton. force=true au premier passage seulement : les
  // re-rendus suivants se contentent du jeton en cache.
  if(!await _agtGuard(!renderAdminGT._seen)) return;
  renderAdminGT._seen = true;
  try{ var _c=await _agtClaims(false); _agtSessEnd=(_c&&typeof _c.gts==='number')?_c.gts:0; }
  catch(e){ _agtSessEnd=0; }
  _agtSessArm();
  if(_agtLocked) return;

  var body=document.getElementById('agt-body');
  if(!body)return;
  body.innerHTML='<div style="text-align:center;padding:40px 20px;color:rgba(255,255,255,0.3);font-family:var(--font-ui,Outfit,sans-serif);font-size:var(--pt-txt,13px)">Chargement…</div>';

  // ★★ GTFIX-4 (§513) — TOUT SE LIT EN PARALLÈLE, ET UNE LECTURE RATÉE SE DIT (GT-B11, GT-B12).
  //   Avant : sept lectures par domaine puis huit lectures GT, l'une après l'autre (≈ 30 allers-retours
  //   aujourd'hui, 220 à 30 clients) ; et une lecture ratée (fbAdminRead → null) affichée « 0 membre,
  //   0 parcelle », un registre illisible réduit au seul domaine de référence. Les lectures passent au
  //   serveur (fbAdminLire, fbGtLire : elles LÈVENT) et gardent leur état — faite, absente, en échec.
  _agtLecturesKo=[];
  var _gt=function(cle){
    return (window.fbGtLire ? window.fbGtLire(cle) : Promise.reject(new Error('fbGtLire indisponible')))
      .then(function(r){ return { etat:r.existe?'ok':'absent', v:r.existe?r.valeur:null }; },
            function(){ _agtLecturesKo.push(cle); return { etat:'echec', v:null }; });
  };
  var _dom=function(slug, cle){
    return (window.fbAdminLire ? window.fbAdminLire(slug, cle) : Promise.reject(new Error('fbAdminLire indisponible')))
      .then(function(r){ return { etat:r.existe?'ok':'absent', v:r.existe?r.valeur:null }; },
            function(){ return { etat:'echec', v:null }; });
  };
  var _reg=await Promise.all([_gt('tenants'), _gt('clients')]);
  var gtData=_reg[0].v;
  var slugs=(gtData&&Array.isArray(gtData.slugs)&&gtData.slugs.length>0)?gtData.slugs.slice():['marchand-grillot'];
  if(slugs.indexOf('marchand-grillot')<0) slugs.unshift('marchand-grillot');
  // AXE A — le registre de vente vit dans _guerettech/clients (GT-only). Mémorisé tel quel : aucune
  // écriture ne part d'ici (ce doc est lisible PUBLIQUEMENT par la règle d'unicité des slugs).
  _agtSlugs   = slugs.slice();
  _agtClients = _agtRegClients(gtData, _reg[1].v);
  var _AUTRES=['access_log','demo_tokens','demo_stats','billing','leads_status','support_reports','suivi'];
  var _tout=await Promise.all([
    Promise.all(slugs.map(function(slug){ return Promise.all(_AGT_CLES_DOM.map(function(k){ return _dom(slug, k); })); })),
    Promise.all(_AUTRES.map(_gt)),
    // Dernières connexions (Firebase Auth) — GT-only, non bloquant
    window._fbLastConnections ? Promise.resolve().then(function(){ return window._fbLastConnections(slugs); })
      .catch(function(e){ _agtLecturesKo.push('connexions'); if(DEBUG) console.warn('[agt] connexions', e && e.code); return null; }) : Promise.resolve(null),
    // AXE A — demandes entrantes du formulaire public (collection `leads`, écrite par submitLead seul)
    window._fbReadLeads ? Promise.resolve().then(function(){ return window._fbReadLeads(); })
      .catch(function(){ _agtLecturesKo.push('leads'); return null; }) : Promise.resolve(null)
  ]);
  _agtTenants=slugs.map(function(slug, i){
    var L={}; _AGT_CLES_DOM.forEach(function(k, j){ L[k]=_tout[0][i][j]; });
    return _agtDomaineDepuisLectures(slug, L);
  });
  var GT={}; _AUTRES.forEach(function(k, j){ GT[k]=_tout[1][j].v; });
  _agtAccessLog  = (GT.access_log&&Array.isArray(GT.access_log.value))?GT.access_log.value:[];
  _agtConnexions = (_tout[2] && _tout[2].tenants) ? _tout[2].tenants : {};
  _agtEssais     = (GT.demo_tokens&&Array.isArray(GT.demo_tokens.value))?GT.demo_tokens.value:[];
  _agtDemoStats  = (GT.demo_stats&&GT.demo_stats.visite)?GT.demo_stats.visite:null;
  // AXE A — facturation : doc GT-only DÉDIÉ, jamais dans `tenants` (lecture publique).
  _agtBilling = (GT.billing && GT.billing.value && typeof GT.billing.value==='object') ? GT.billing.value : {};
  _agtBillingNoter(_agtBilling);   // ★ GTFIX-1 : la base de comparaison de chaque domaine
  _agtLeads  = _tout[3];
  _agtLeadSt = (GT.leads_status && GT.leads_status.value && typeof GT.leads_status.value==='object') ? GT.leads_status.value : {};
  _agtLeadStNoter(_agtLeadSt);   // ★ GTFIX-1 : la base de comparaison de chaque fiche
  _agtReportsGT = (GT.support_reports&&Array.isArray(GT.support_reports.value))?GT.support_reports.value:[];
  _agtSuivi = (GT.suivi && GT.suivi.value && typeof GT.suivi.value==='object') ? GT.suivi.value : {};
  _agtAppliquerSuivi();   // ★ GT-SUIVI-1 : le « traité » de chaque occurrence, avant les compteurs
  _agtMajCompteurs();
  _agtCharge=Date.now(); _agtEntete(_AGT_TAB_MIGR[_agtTab]||_agtTab);   // ★ GT-UI-4 : la fraîcheur, le résumé
  if(window._agtRouteAppliquer) setTimeout(window._agtRouteAppliquer, 0);   // ★ GT-UI-1 : la route d'arrivée (#incidents, #clients/<slug>…)

  agtRenderBody();
}

// ─── Onglet RADAR ───────────────────────────────────────────────────────────
// Lot C (06/08/2026) — le panneau etait organise PAR TYPE DE DONNEE : huit
// tiroirs, et « ou en est ce client ? » demandait cinq clics et de la memoire.
// Le Radar renverse la logique : une seule page qui dit ce qui demande une
// action AUJOURD'HUI, tous domaines confondus, avec le bouton qui y mene.
// Il ne calcule rien de son cote : il consomme les memes fonctions que les
// onglets (_agtBizTodoRows, _agtErrRecount, _agtStatutOf), pour qu'un chiffre
// ne puisse jamais differer d'un ecran a l'autre.

var _AGT_SILENCE_J = 14;   // au-dela, un domaine actif qui ne se connecte plus se signale

function _agtRadarRows(){
  var rows=[], now=Date.now();

  // 1. Technique : ce qui casse chez un client.
  _agtTenants.forEach(function(t,i){
    if(t.errorsCrit>0) rows.push({ c:'#EF4444', ord:10,
      t:'<b>'+_escHtml(t.nom)+'</b> \u2014 '+t.errorsCrit+' erreur'+(t.errorsCrit>1?'s':'')+' critique'+(t.errorsCrit>1?'s':''),
      m:'', b:'Voir', a:'agtSwitchTab(\'incidents\')', ty:'Incident' });
  });
  var repOpen=[];
  _agtTenants.forEach(function(t){ (t.reports||[]).forEach(function(r){ if(!r.resolved) repOpen.push({n:t.nom,r:r}); }); });
  (_agtReportsGT||[]).forEach(function(r){ if(!r.resolved) repOpen.push({n:'Avant connexion',r:r}); });
  if(repOpen.length) rows.push({ c:'#F97316', ord:11,
    t:repOpen.length+' signalement'+(repOpen.length>1?'s':'')+' en attente \u2014 '
      +_escHtml(repOpen.slice(0,2).map(function(x){ return x.n; }).join(', '))+(repOpen.length>2?'\u2026':''),
    m:'', b:'Traiter', a:'agtSetIncTab(\'rep\')', ty:'Signalement' });

  // 2. Commercial : on reprend TELLES QUELLES les lignes de l'onglet Business.
  //    Une seule definition de « facture en retard » dans tout le panneau.
  _agtBizTodoRows().forEach(function(r){
    var ord = (r.ord===0) ? 12 : (r.ord===1 ? 22 : (r.ord===2 ? 21 : 23));
    rows.push({ c:r.c, ord:ord, t:r.t, m:r.m, b:r.b, a:r.a, ty:'Facturation' });
  });

  // 3. Demandes entrantes jamais traitees.
  var neufs=(_agtLeads||[]).filter(function(l){ return _agtLeadStOf(l._id)==='nouveau'; });
  if(neufs.length) rows.push({ c:'#C4B5FD', ord:20,
    t:neufs.length+' demande'+(neufs.length>1?'s':'')+' du site sans r\u00e9ponse',
    m:'', b:'Ouvrir', a:'agtSwitchTab(\'leads\')', ty:'Lead' });

  // 4. Silence : un domaine abonne qui ne se connecte plus est un client qui part.
  _agtTenants.forEach(function(t,i){
    if(_agtInterne(t.slug)) return;
    if(_agtStatutOf(t.slug).cle!=='actif') return;
    var cnx=_agtConnexions[t.slug], d=cnx?_agtD(cnx.last):null;
    if(!d) return;                                   // jamais vu : on ne conclut rien
    var j=Math.round((now-d.getTime())/86400000);
    if(j>=_AGT_SILENCE_J) rows.push({ c:'#B8913A', ord:30,
      t:'<b>'+_escHtml(t.nom)+'</b> \u2014 plus aucune connexion depuis '+j+' jours',
      m:'', b:'Fiche', a:'agtGoClient(\''+t.slug+'\')', ty:'Client' });
  });

  rows.sort(function(a,b){ return a.ord-b.ord; });
  return rows;
}

// ★ GT-UI-2 (§517) — le Radar se trie par priorité (l'ordre d'urgence) ou par type ; il montre les dernières traces.
var _agtRadarTri='prio';
function agtRadarTri(v){ _agtRadarTri=(v==='type')?'type':'prio'; agtRenderBody(); }
function _agtRadarTrier(rows, tri){
  if(tri!=='type') return rows;
  return rows.map(function(r,i){ return { r:r, i:i }; }).sort(function(a,b){
    var x=String(a.r.ty||''), y=String(b.r.ty||''); return x<y?-1:(x>y?1:(a.r.ord-b.r.ord)||(a.i-b.i));
  }).map(function(o){ return o.r; });
}
function _agtBuildRadar(){
  // ★★ GT-UI-4 (§519) — LE RADAR DE LA MAQUETTE : quatre chiffres, « À traiter » en tableau (priorité, type, quoi, montant,
  //   geste), et à côté la santé du système et les dernières traces.
  var rows=_agtRadarTrier(_agtRadarRows(), _agtRadarTri);
  var mrr=0, duT=0, retardT=0, incid=0, crit=0, nAbo=0, nEssai=0;
  _agtTenants.forEach(function(t){
    var st=_agtStatutOf(t.slug);
    if(!_agtInterne(t.slug) && st.cle==='actif'){ mrr+=_agtAboPrix(t.slug); nAbo++; }
    if(!_agtInterne(t.slug) && st.cle==='essai') nEssai++;
    incid+=(t.errorsOpen||0)+(t.reportsOpen||0); crit+=(t.errorsCrit||0);
  });
  _agtBizSlugs().forEach(function(x){ duT+=_agtBizDu(x.slug); var vus={}; _agtFacts(x.slug).forEach(function(f){ if(_agtFRetard(f)>0 && !vus[f.ref||'']){ vus[f.ref||'']=1; retardT+=_agtRefReste(x.slug, f.ref); } }); });
  incid+=(_agtReportsGT||[]).filter(function(r){ return !r.resolved; }).length;
  var neufs=(_agtLeads||[]).filter(function(l){ return _agtLeadStOf(l._id)==='nouveau'; }).length;
  var kpi=function(l,v,sous,alerte){ return '<div class="mvcarte-fond agt-kpi"><div class="agt-kpi-l">'+l+'</div><div class="agt-kpi-v">'+v+'</div><div class="agt-kpi-s'+(alerte?' alerte':'')+'">'+sous+'</div></div>'; };
  var h='<div class="agt-radar"><div class="agt-kpis">'
    +kpi('Revenu mensuel', _agtEur(mrr), nAbo+' abonn\u00e9'+(nAbo>1?'s':'')+(nEssai?(' \u00b7 '+nEssai+' essai'+(nEssai>1?'s':'')):''), false)
    +kpi('\u00c0 encaisser', _agtEur(duT), retardT?('dont '+_agtEur(retardT)+' en retard'):'rien en retard', retardT>0)
    +kpi('Incidents ouverts', String(incid), crit?(crit+' critique'+(crit>1?'s':'')):'aucun critique', crit>0)
    +kpi('Demandes du site', String(neufs), neufs?'sans r\u00e9ponse':'toutes trait\u00e9es', neufs>0)
    +'</div><div class="agt-radar-grille">';
  h+='<section class="mvcarte-fond agt-carte"><div class="agt-carte-tete"><h2 class="agt-carte-titre">\u00c0 traiter <span class="mvpas mvpas-compteur">'+rows.length+'</span></h2>';
  if(rows.length>1) h+='<div class="agt-inc-outils" style="margin:0">'+[['prio','Priorit\u00e9'],['type','Type']].map(function(o){
    return '<button class="mvpas mvpas-filtre'+(_agtRadarTri===o[0]?' on':'')+'" aria-pressed="'+(_agtRadarTri===o[0])+'" onclick="agtRadarTri(\''+o[0]+'\')">'+o[1]+'</button>'; }).join('')+'</div>';
  h+='</div>';
  if(!rows.length){
    h+='<div class="agt-inc-vide">Rien \u00e0 traiter aujourd\u2019hui : aucune erreur critique, aucun signalement, aucune facture en retard.</div>';
  } else {
    var COUL={ P1:'mvpas-rouge', P2:'mvpas-orange', P3:'mvpas-gris', P4:'mvpas-gris' };
    h+='<div class="agt-tbl-cadre nu"><table class="agt-tbl"><thead><tr><th style="padding:8px 12px">Priorit\u00e9</th><th style="padding:8px 12px">Type</th><th style="padding:8px 12px">Quoi</th><th style="padding:8px 12px"></th><th style="padding:8px 12px"></th></tr></thead><tbody>';
    rows.forEach(function(r){
      var p=_agtRadarPrio(r);
      h+='<tr><td><span class="mvpas mvpas-type '+COUL[p]+'">'+p+'</span></td><td><span class="mvpas mvpas-etiquette">'+_escHtml(r.ty||'')+'</span></td>'
        +'<td>'+r.t+'</td><td class="agt-tbl-n">'+(r.m||'')+'</td>'
        +'<td>'+(r.b?'<button class="agt-btn agt-inc-court" onclick="'+r.a+'">'+r.b+'</button>':'')+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }
  h+='</section><div style="display:flex;flex-direction:column;gap:16px">'+_agtRadarSante()+_agtRadarTraces()+'</div></div>';
  h+='<div class="agt-ancien" style="margin-top:16px">'+_agtVisiteCard()+'</div></div>';   // ★ GT-UI-4 : la visite de la démo, encore à l'ancien rendu
  return h;
}
// La priorité d'une ligne du Radar : sa couleur d'urgence, puis son rang.
function _agtRadarPrio(r){
  if(r.c==='#EF4444') return 'P1';
  if(r.c==='#F97316') return 'P2';
  return (r.ord<=22) ? 'P2' : ((r.ord<=29) ? 'P3' : 'P4');
}
// La santé du système, avec ce que la console sait déjà ; les sauvegardes et les tâches planifiées viennent avec GT-UI-6.
function _agtRadarSante(){
  var cur=String(window.APP_VERSION||''), tot=0, aJour=0, crit=0;
  var cmpV=function(a,b){ var x=String(a||'0').split('.').map(Number), y=String(b||'0').split('.').map(Number);
    for(var i=0;i<Math.max(x.length,y.length);i++){ var d=(x[i]||0)-(y[i]||0); if(d) return d; } return 0; };
  _agtTenants.forEach(function(t){ var A=t.appareils||{}; Object.keys(A).forEach(function(k){ tot++; if(cmpV((A[k]||{}).v,cur)>=0) aJour++; }); crit+=(t.errorsCrit||0); });
  return '<section class="mvcarte-fond agt-carte"><div class="agt-carte-tete"><h2 class="agt-carte-titre">Sant\u00e9 du syst\u00e8me</h2></div><div class="agt-carte-corps"><ul class="agt-sante-liste">'
    +'<li>Version en ligne<small>APP '+_escHtml(cur)+'</small></li>'
    +'<li class="'+(tot && aJour<tot?'attention':'')+'">Appareils \u00e0 jour<small>'+aJour+' sur '+tot+'</small></li>'
    +'<li class="'+(crit?'alerte':'')+'">Erreurs critiques ouvertes<small>'+crit+'</small></li>'
    +'<li class="attention">Sauvegardes, E-Phy, e-mails<small>leur \u00e9tat arrive avec GT-UI-6</small></li>'
    +'</ul></div></section>';
}
function _agtRadarTraces(){
  var L=(_agtAccessLog||[]).slice(0,5);
  var h='<section class="mvcarte-fond agt-carte"><div class="agt-carte-tete"><h2 class="agt-carte-titre">Derni\u00e8res traces</h2>'
    +'<button class="agt-tete-second" onclick="agtSwitchTab(\'outils\')">Journal</button></div><div class="agt-carte-corps"><div class="agt-traces">';
  if(!L.length) h+='<div class="agt-cli-note">Aucune trace.</div>';
  h+=L.map(function(e){
    return '<div class="agt-trace"><span class="agt-trace-ic" aria-hidden="true">'+_agtIco(e.icon||'')+'</span><span class="agt-trace-t">'+_escHtml(e.action||'')
      +'<span class="agt-trace-s">'+_escHtml(e.tenant||'')+'</span></span><span class="agt-trace-q">'+(e.ts?_escHtml(_agtRelTime(e.ts)):'')+'</span></div>';
  }).join('');
  return h+'</div></div></section>';
}

function agtGoClient(slug){
  // ★ GT-UI-3 : la fiche du client, à côté du tableau.
  if(window.agtCliOuvrir) window.agtCliOuvrir(slug); else agtSwitchTab('clients');
}

// ─── Onglet INCIDENTS ───────────────────────────────────────────────────────
// Erreurs techniques et signalements clients sont le meme geste de support :
// un seul onglet, deux vues. Le contenu de chacune est inchange.
var _agtIncTab='err';
function agtSetIncTab(k){ _agtIncTab=k; if(_agtTab!=='incidents') _agtTab='incidents'; agtSwitchTab('incidents'); }
function _agtBuildIncidents(){
  var nErr=_agtTenants.reduce(function(s,t){ return s+(t.errorsOpen||0); },0);
  var nRep=_agtTenants.reduce(function(s,t){ return s+(t.reportsOpen||0); },0)
    +(_agtReportsGT||[]).filter(function(r){ return !r.resolved; }).length;
  var h='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">';
  h+='<button class="mvpas mvpas-filtre'+((_agtIncTab==='err')?' on':'')+'" aria-pressed="'+(_agtIncTab==='err')+'" onclick="agtSetIncTab(\'err\')">Erreurs techniques <span class="mvpas mvpas-compteur">'+nErr+'</span></button>';
  h+='<button class="mvpas mvpas-filtre'+((_agtIncTab==='rep')?' on':'')+'" aria-pressed="'+(_agtIncTab==='rep')+'" onclick="agtSetIncTab(\'rep\')">Signalements clients <span class="mvpas mvpas-compteur">'+nRep+'</span></button>';
  h+='</div>';
  // ★ GT-UI-2 (§517) : les erreurs en tableau, dessinées par src/gt/incidents.js à partir de ce que la console expose.
  return h+((_agtIncTab==='rep') ? '<div class="agt-ancien">'+_agtBuildReports()+'</div>' : (window._agtIncidentsVue ? window._agtIncidentsVue(window._agtIncDonnees()) : ''));
}

// ─── Onglet OUTILS ──────────────────────────────────────────────────────────
// Ce qui sert rarement mais doit rester atteignable : maintenance du catalogue,
// import KML, journal d'acces (obligation de tracabilite du DPA), codes de demo.
var _agtOutTab='ephy';
function agtSetOutTab(k){ _agtOutTab=k; agtRenderBody(); }
function _agtBuildOutils(){
  var vues=[['ephy','Catalogue E-Phy'],['kml','Import KML'],['log','Journal d\u2019acc\u00e8s'],['demo','D\u00e9mo & codes']];
  var h='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">';
  vues.forEach(function(v){
    h+='<button class="agt-chip'+((_agtOutTab===v[0])?' on':'')+'" onclick="agtSetOutTab(\''+v[0]+'\')">'+v[1]+'</button>';
  });
  h+='</div>';
  if(_agtOutTab==='kml')  return h+_agtBuildKml();
  if(_agtOutTab==='log')  return h+_agtBuildLog();
  if(_agtOutTab==='demo') return h+_agtBuildEssais();
  return h+_agtEphyCard();
}
// Extrait de l'onglet Clients : la maintenance du catalogue n'a rien a y faire.
function _agtEphyCard(){
  var h='<div class="agt-card" style="border-color:rgba(34,197,94,0.18)"><div style="padding:14px 16px">';
  h+='<div style="font-size:var(--pt-base,14px);font-weight:600;color:#fff;display:flex;align-items:center;gap:8px">\uD83C\uDF3F Catalogue E-Phy (ANSES)</div>';
  h+='<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.4);line-height:1.6;margin:6px 0 12px">R\u00e9f\u00e9rentiel officiel partag\u00e9 par tous les domaines \u00b7 mise \u00e0 jour auto chaque mercredi. Forcer une resynchronisation imm\u00e9diate :</div>';
  h+='<button class="agt-btn fill" style="width:100%;background:#1F7A3D;border-color:rgba(34,197,94,0.4)" onclick="agtSyncEphy(this)">\uD83D\uDD04 Resynchroniser maintenant</button>';
  h+='<div id="agt-ephy-status" style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);text-align:center;margin-top:8px;line-height:1.5"></div>';
  h+='</div></div>';
  return h;
}

// ─── Rendu du corps selon l'onglet actif ─────────────────────────────────────
// ★ GTFIX-4 (§513) — LES COMPTEURS SUIVENT CHAQUE GESTE (GT-B21) : l'en-tête, les pastilles des onglets et le
//   voyant du bas n'étaient calculés qu'au chargement complet — une erreur traitée laissait « 3 » partout.
function _agtMajCompteurs(){
  // Badge essais actifs
  // Badge Leads : uniquement les demandes jamais traitees.
  var _lbadge=document.getElementById('agt-lead-badge');
  var _ln=(_agtLeads||[]).filter(function(l){ return _agtLeadStOf(l._id)==='nouveau'; }).length;
  if(_lbadge){
    _lbadge.textContent=_ln;
    _lbadge.style.display=_ln>0?'inline-block':'none';
  }

  // Stats band
  var totalMbr     = _agtTenants.reduce(function(s,t){return s+t.membres;},0);
  var totalPrc     = _agtTenants.reduce(function(s,t){return s+t.parcelles;},0);
  var totalErrOpen = _agtTenants.reduce(function(s,t){return s+t.errorsOpen;},0);
  var totalErrCrit = _agtTenants.reduce(function(s,t){return s+t.errorsCrit;},0);
  var sv0=document.getElementById('agt-sv0'), sv1=document.getElementById('agt-sv1'),
      sv2=document.getElementById('agt-sv2'), sv3=document.getElementById('agt-sv3');
  if(sv0)sv0.textContent=_agtTenants.length;
  if(sv1)sv1.textContent=totalMbr;
  if(sv2)sv2.textContent=totalPrc;
  if(sv3){sv3.textContent=totalErrOpen;sv3.style.color=totalErrCrit>0?'#EF4444':totalErrOpen>0?'#F97316':'#C4B5FD';}

  // Lot C — deux badges seulement : Incidents (erreurs + signalements) et Radar
  // (tout ce qui demande une action). Les badges Erreurs / Support / Essais ont
  // disparu d'index.html avec leurs onglets.
  var totalRepOpen=_agtTenants.reduce(function(s,t){return s+(t.reportsOpen||0);},0)+(_agtReportsGT||[]).filter(function(r){return !r.resolved;}).length;
  var ibadge=document.getElementById('agt-inc-badge');
  var _ni=totalErrOpen+totalRepOpen;
  if(ibadge){
    ibadge.textContent=_ni;
    ibadge.style.display=_ni>0?'inline-block':'none';
    ibadge.style.background=totalErrCrit>0?'#EF4444':'';
  }
  var rbadge=document.getElementById('agt-radar-badge');
  if(rbadge){
    var _nr=0;
    try{ _nr=_agtRadarRows().length; }
    catch(e){ if(window.logError) window.logError({level:'info',cat:'ui',msg:'radar non calcule',detail:(e&&e.message)||String(e)}); }
    rbadge.textContent=_nr;
    rbadge.style.display=_nr>0?'inline-block':'none';
    rbadge.style.background=totalErrCrit>0?'#EF4444':'';
  }

  // Barre basse — alerte critique
  var statusEl=document.getElementById('agt-bottom-status');
  if(statusEl){
    // ★ GTFIX-4 : dans les DEUX sens — le voyant rouge redevenait jamais vert sans recharger (GT-B21).
    statusEl.outerHTML = totalErrCrit>0
      ? '<div id="agt-bottom-status" style="font-size:10px;font-weight:700;color:#FCA5A5;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:2px 7px">'+totalErrCrit+' critique'+(totalErrCrit>1?'s':'')+'</div>'
      : '<div id="agt-bottom-status" style="width:8px;height:8px;border-radius:50%;background:#22C55E;box-shadow:0 0 6px rgba(34,197,94,0.6)"></div>';
  }
  _agtCompteursBarre();   // ★ GT-UI-1
}
// ★ GT-UI-1 (§516) — les nombres de la barre latérale : les mêmes que les pastilles des onglets, plus les clients
//   et les factures en retard (une fois par référence).
function _agtCompteursBarre(){
  var pose=function(id, n){ var e=document.getElementById(id); if(e) e.textContent=(n>0)?String(n):''; };
  var lire=function(id){ var e=document.getElementById(id); return (e && e.style.display!=='none') ? (parseInt(e.textContent,10)||0) : 0; };
  pose('agt-side-n-radar', lire('agt-radar-badge'));
  pose('agt-side-n-incidents', lire('agt-inc-badge'));
  pose('agt-side-n-leads', lire('agt-lead-badge'));
  pose('agt-side-n-clients', 0);
  var retard=0;
  if(typeof _agtBizSlugs==='function') _agtBizSlugs().forEach(function(x){ var vus={}; _agtFacts(x.slug).forEach(function(f){ if(_agtFRetard(f)>0 && !vus[f.ref||'']){ vus[f.ref||'']=1; retard++; } }); });
  pose('agt-side-n-business', retard);
}

// ★ GTFIX-4 (§513) — le bandeau des lectures ratées, en tête de chaque onglet : ce qui manque n'est pas zéro.
var _AGT_LECT_NOMS = { tenants:'le registre des domaines', clients:'les fiches commerciales', access_log:'le journal d\u2019acc\u00e8s',
  demo_tokens:'les codes d\u2019essai', demo_stats:'la d\u00e9mo publique', billing:'la facturation', leads_status:'le suivi des leads',
  support_reports:'les signalements GT', connexions:'les derni\u00e8res connexions', leads:'les demandes du site',
  suivi:'le suivi des incidents' };
function _agtBandeauLectures(){
  var dom=(_agtTenants||[]).filter(function(t){ return t.echecs && t.echecs.length; });
  if(!_agtLecturesKo.length && !dom.length) return '';
  var parts=_agtLecturesKo.map(function(k){ return _AGT_LECT_NOMS[k]||k; });
  if(dom.length) parts.push(dom.length+' domaine'+(dom.length>1?'s':'')+' en partie ('+dom.map(function(t){ return t.nom; }).join(', ')+')');
  return '<div role="alert" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;background:var(--danger-doux);border:1px solid var(--danger);border-radius:var(--r-lg,12px);padding:12px 16px;margin-bottom:12px;font-size:var(--pt-txt,13px);color:var(--danger-texte);line-height:1.5">'
    +'<span style="flex:1;min-width:200px"><b>Lecture impossible</b> : '+_escHtml(parts.join(' ; '))+'. Ce qui en d\u00e9pend manque \u00e0 l\u2019\u00e9cran \u2014 ce n\u2019est pas z\u00e9ro.</span>'
    +'<button class="agt-tete-second" onclick="renderAdminGT()">Relire</button></div>';   // ★ GT-UI-4 : sur la charte
}

function agtRenderBody(){
  var body=document.getElementById('agt-body');
  if(!body)return;
  // Lot C — 6 onglets. Les anciennes cles restent acceptees : elles peuvent
  // survivre dans une session ouverte pendant le deploiement.
  var tb=_AGT_TAB_MIGR[_agtTab]||_agtTab, ban=_agtBandeauLectures();
  if(tb==='radar')     body.innerHTML=ban+_agtBuildRadar();
  if(tb==='clients')   body.innerHTML=ban+_agtBuildClients();
  if(tb==='business'){ body.innerHTML=ban+'<div class="agt-ancien">'+_agtBuildBusiness()+'</div>'; _agtBizFill(); }   // ★ GT-UI-4 : refait en GT-UI-5
  if(tb==='incidents') body.innerHTML=ban+_agtBuildIncidents();
  if(tb==='leads')     body.innerHTML=ban+'<div class="agt-ancien">'+_agtBuildLeads()+'</div>';   // GT-UI-5
  if(tb==='outils')    body.innerHTML=ban+'<div class="agt-ancien">'+_agtBuildOutils()+'</div>';   // GT-UI-6
  _agtMajCompteurs();   // ★ GTFIX-4 (GT-B21)
  _agtEntete(tb);   // ★ GT-UI-4 : les résumés suivent les gestes
}

var _AGT_NOMS_ONGLETS={ radar:'Radar', incidents:'Incidents', clients:'Clients', business:'Facturation', leads:'Leads', outils:'Outils' };
// ★★ GT-UI-4 (§519) — L'EN-TÊTE DE LA MAQUETTE : le titre de l'écran, son résumé, la fraîcheur du chargement, l'action
//   principale. Recalculé à chaque onglet et à chaque rendu (les résumés suivent les gestes).
var _agtCharge=0;
function _agtResume(tab){
  var ouvertsInc=_agtTenants.reduce(function(s2,t){ return s2+(t.errorsOpen||0)+(t.reportsOpen||0); },0)+(_agtReportsGT||[]).filter(function(r){ return !r.resolved; }).length;
  if(tab==='radar') return 'ce qui demande un geste aujourd\u2019hui';
  if(tab==='incidents') return ouvertsInc+' ouvert'+(ouvertsInc>1?'s':'')+' \u00b7 erreurs remont\u00e9es et signalements';
  if(tab==='clients'){ var mrr=0, n=0; _agtTenants.forEach(function(t){ if(_agtInterne(t.slug)) return; n++; if(_agtStatutOf(t.slug).cle==='actif') mrr+=_agtAboPrix(t.slug); }); return n+' domaine'+(n>1?'s':'')+' \u00b7 '+_agtEur(mrr)+' par mois'; }
  if(tab==='business'){ var nf=0; Object.keys(_agtBilling||{}).forEach(function(sl){ nf+=_agtFacts(sl).length; }); return nf+' facture'+(nf>1?'s':'')+' \u00b7 num\u00e9rotation continue sur toutes les factures'; }
  if(tab==='leads'){ var nl=(_agtLeads||[]).length, nn=(_agtLeads||[]).filter(function(l){ return _agtLeadStOf(l._id)==='nouveau'; }).length; return nl+' demande'+(nl>1?'s':'')+(nn?' \u00b7 '+nn+' sans r\u00e9ponse':''); }
  if(tab==='outils') return 'journal d\u2019acc\u00e8s, codes d\u2019essai, contours';
  return '';
}
function _agtActions(tab){
  if(tab==='clients') return '<button class="agt-tete-second" onclick="openOv(\'ovAddTenant\')">Nouveau client</button><button class="agt-tete-principal" onclick="agtOpenInstall()">Installer un domaine</button>';
  if(tab==='business') return '<button class="agt-tete-second" onclick="agtBizLivre()">Livre des recettes</button>';
  return '';
}
function _agtMajFraicheur(){
  var el=document.getElementById('agt-maj'); if(!el) return;
  if(!_agtCharge){ el.textContent=''; return; }
  var mn=Math.floor((Date.now()-_agtCharge)/60000);
  el.textContent= mn<1 ? '\u00c0 jour, \u00e0 l\u2019instant' : ('\u00c0 jour, il y a '+mn+' min');
}
function _agtEntete(tab){
  var t=document.getElementById('agt-titre'), so=document.getElementById('agt-sous'), ac=document.getElementById('agt-tete-actions');
  if(t && _AGT_NOMS_ONGLETS[tab]) t.textContent=_AGT_NOMS_ONGLETS[tab];
  if(so) so.textContent=_agtResume(tab);
  if(ac) ac.innerHTML=_agtActions(tab);
  _agtMajFraicheur();
}
function agtSwitchTab(tab){
  _agtTab=tab;
  document.querySelectorAll('.agt-tab').forEach(function(b){
    var isActive=b.dataset.tab===tab;
    b.classList.toggle('active',isActive);
    var isCrit=(tab==='incidents'||tab==='radar')&&_agtTenants.reduce(function(s,t){return s+t.errorsCrit;},0)>0;
    b.classList.toggle('crit',isActive&&isCrit);
  });
  // ★ GT-UI-1 (§516) : la barre latérale, le titre de l'écran et le lien direct suivent l'onglet.
  document.querySelectorAll('.agt-side-it').forEach(function(b){
    var on=b.dataset.tab===tab; b.classList.toggle('active',on);
    if(on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
  });
  var _hn=document.querySelector('#page-admin-gt .agt-hdr-name'); if(_hn && _AGT_NOMS_ONGLETS[tab]) _hn.textContent=_AGT_NOMS_ONGLETS[tab];
  _agtEntete(tab);   // ★ GT-UI-4
  if(window._agtRouteNoter) window._agtRouteNoter(tab);
  agtRenderBody();
}



async function agtResolveReport(id, slug){
  // ★ GT-SUIVI-1 (§515) — « résolu » APRÈS la réponse du serveur, plus avant : l'écran ne dit plus « résolu »
  //   d'un signalement dont l'écriture a échoué (GT-B19).
  try{
    if(!window.fbResolveReport) throw new Error('fbResolveReport indisponible');
    await window.fbResolveReport(id, slug);
  }catch(e){ if(window.showToast) showToast('Résolution non enregistrée — réessayez','#E07060'); return; }
  var flip=function(list){ (list||[]).forEach(function(r){ if(r.id===id) r.resolved=true; }); };
  if(slug){ _agtTenants.forEach(function(t){ if(t.slug===slug){ flip(t.reports); t.reportsOpen=(t.reports||[]).filter(function(r){return !r.resolved;}).length; } }); }
  else { flip(_agtReportsGT); }
  agtRenderBody();
}

// ★★ GTFIX-1 (§510) — LE JOURNAL D'ACCÈS : relu et complété dans la même transaction, gardé UN AN par
//   la date (décision D4 du 01/11). Avant : la liste EN MÉMOIRE, chargée à l'ouverture, réécrite en
//   entier — les entrées notées depuis par le serveur (codes d'essai) ou par une préparation
//   disparaissaient, et l'écran promettait « 90 jours » sur un plafond de 100 lignes.
// ⚠ Les MÊMES deux nombres côté serveur (functions/claims.js, AL_JOURS / AL_MAX) : le harnais gtfix1 compare.
var _AGT_AL_JOURS = 365, _AGT_AL_MAX = 2000;
function _agtAlGarder(liste, maintenant){
  var lim = (maintenant || Date.now()) - _AGT_AL_JOURS * 86400000;
  var r = liste.filter(function(e){ var t = e && Date.parse(e.ts); return !(t && t < lim); });
  if (r.length > _AGT_AL_MAX) r.length = _AGT_AL_MAX;
  return r;
}
// Document absent = journal neuf. Forme inconnue = on n'écrase rien (undefined).
function _agtMutJournal(d, existe, entree){
  var liste;
  if (!existe) liste = [];
  else if (d && Array.isArray(d.value)) liste = d.value;
  else return undefined;
  liste.unshift(entree);
  return { value: _agtAlGarder(liste) };
}
// type : 'donnees' (accès aux données d'un domaine), 'commercial' (facture, essai, lead), 'systeme'.
async function _agtJournalAjout(slug, action, icon, type){
  if (!window.fbGtMaj) return false;
  var entree = { id:'al'+Date.now(), ts:new Date().toISOString(), tenant:String(slug||''), action:String(action||''), icon:String(icon||''), type:String(type||'donnees') };
  var r = await window.fbGtMaj('access_log', function(d, existe){ return _agtMutJournal(d, existe, entree); });
  if (!r || !r.ecrit) return false;
  _agtAccessLog = r.valeur.value;
  return true;
}
async function agtLogAccess(slug, action, icon, type){
  try { return await _agtJournalAjout(slug, action, icon, type); }
  catch (e) {
    if (window.logError) window.logError({ level:'error', cat:'gt-journal', msg:'acc\u00e8s non not\u00e9 au journal', detail:String(action||'')+' \u00b7 '+((e && (e.code || e.message)) || String(e)) });
    return false;
  }
}

// ─── Maintenance : resynchro catalogue E-Phy (ANSES) ──────────────────────────
async function agtSyncEphy(btn){
  if(!window.fbCallFn){ showToast('Indisponible','#E07060'); return; }
  var orig=btn?btn.innerHTML:''; if(btn){ btn.disabled=true; btn.innerHTML='Synchronisation…'; }
  var st=document.getElementById('agt-ephy-status'); if(st){ st.style.color='rgba(255,255,255,0.35)'; st.textContent='Téléchargement + parsing E-Phy… (jusqu’à ~2 min)'; }
  try{
    var r=await window.fbCallFn('syncEphyVigneNow',{},{ timeout:540000 });
    var n=(r&&r.count!=null)?r.count:'?';
    var bt=(r&&r.byType)?r.byType:{};
    var fams=Object.keys(bt).sort(function(a,b){return bt[b]-bt[a];}).slice(0,6).map(function(k){return k+' '+bt[k];}).join(' · ');
    showToast('E-Phy resynchronisé — '+n+' produits','#1F7A3D');
    if(window._fbLoadEphy) window._fbLoadEphy();
    if(st){ st.style.color='#6BA34A'; st.innerHTML=n+' produits'+(fams?' · '+_escHtml(fams):'')+' · '+new Date().toLocaleTimeString('fr-FR'); }
  }catch(e){
    var code=(e&&e.code)||''; var msg=(e&&e.message)||'échec';
    if(code.indexOf('permission-denied')>=0) msg='Connecte-toi avec le compte GUERETTECH (claim gtAdmin) puis réessaie.';
    else if(code.indexOf('deadline')>=0) msg='Délai client dépassé — la synchro continue côté serveur, vérifie le doc ephy/vigne dans 1–2 min.';
    showToast('E-Phy : '+msg,'#E07060');
    if(st){ st.style.color='#FCA5A5'; st.textContent=msg; }
  }finally{ if(btn){ btn.disabled=false; btn.innerHTML=orig; } }
}

// ─── Onglet Clients ───────────────────────────────────────────────────────────
// ─── Dernières connexions clients (Firebase Auth via gtLastConnections) ───────
function _agtCnxFmt(isoStr){
  if(!isoStr) return { txt:'Jamais connecté', c:'#8B8398', bg:'rgba(255,255,255,0.04)', dot:'#4A4458', abs:'' };
  var s=(Date.now()-new Date(isoStr))/1000, txt;
  if(s<60)          txt='à l\'instant';
  else if(s<3600)   txt='il y a '+Math.floor(s/60)+' min';
  else if(s<86400)  txt='il y a '+Math.floor(s/3600)+' h';
  else              txt='il y a '+Math.floor(s/86400)+' j';
  var col;
  if(s<86400)         col={c:'#4ADE80', bg:'rgba(34,197,94,0.12)',  dot:'#22C55E'};
  else if(s<7*86400)  col={c:'#FCD34D', bg:'rgba(234,179,8,0.10)',  dot:'#EAB308'};
  else if(s<14*86400) col={c:'#FDBA74', bg:'rgba(249,115,22,0.10)', dot:'#F97316'};
  else                col={c:'#FCA5A5', bg:'rgba(239,68,68,0.10)',  dot:'#EF4444'};
  var d=new Date(isoStr), abs='';
  try{ abs=d.toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})+' '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}); }catch(e){ if(window._mvAvale) window._mvAvale(e,'admin-gt.js/_agtCnxFmt'); }
  return { txt:txt, c:col.c, bg:col.bg, dot:col.dot, abs:abs };
}
function _agtCnxColor(v){ return (typeof v==='string' && /^#[0-9a-fA-F]{3,8}$/.test(v)) ? v : '#8B5CF6'; }


function _agtCnxSection(slug){
  var c=_agtConnexions[slug];
  if(!c || !Array.isArray(c.members) || !c.members.length) return '';
  var ms=c.members.slice().sort(function(a,b){
    if(!a.lastActive&&!b.lastActive) return 0;
    if(!a.lastActive) return 1; if(!b.lastActive) return -1;
    return new Date(b.lastActive)-new Date(a.lastActive);
  });
  var h='<div class="agt-section-lbl" style="margin-bottom:8px">Connexions par membre — '+ms.length+'</div>';
  h+='<div style="margin-bottom:12px">';
  for(var i=0;i<ms.length;i++){
    var m=ms[i], f=_agtCnxFmt(m.lastActive);
    var right    = m.lastActive ? f.txt : (m.hasAccount ? 'Jamais connecté' : 'Aucun compte');
    var rightAbs = m.lastActive ? f.abs : (m.hasAccount ? 'compte créé, non ouvert' : 'pas de compte Auth');
    var rightCol = m.lastActive ? f.c : (m.hasAccount ? '#8B8398' : 'rgba(255,255,255,0.3)');
    var col=_agtCnxColor(m.couleur);
    h+='<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">';
    h+='<div style="width:9px;height:9px;border-radius:50%;flex-shrink:0;background:'+col+'"></div>';
    h+='<div style="flex:1;min-width:0">';
    h+='<div style="font-size:var(--pt-txt,13px);font-weight:600;color:rgba(255,255,255,0.85)">'+_escHtml(m.nom)+'</div>';
    if(Array.isArray(m.roles)&&m.roles.length){
      h+='<div style="display:flex;gap:4px;margin-top:3px;flex-wrap:wrap">';
      for(var r=0;r<m.roles.length;r++){
        h+='<span style="font-size:9px;font-weight:600;padding:1px 6px;border-radius:5px;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.45);border:1px solid rgba(255,255,255,0.08)">'+_escHtml(m.roles[r])+'</span>';
      }
      h+='</div>';
    }
    h+='</div>';
    h+='<div style="text-align:right;flex-shrink:0">';
    h+='<div style="font-size:var(--pt-micro,12px);font-weight:600;color:'+rightCol+'">'+_escHtml(right)+'</div>';
    h+='<div style="font-size:10px;color:rgba(255,255,255,0.28);margin-top:2px">'+_escHtml(rightAbs)+'</div>';
    h+='</div>';
    h+='</div>';
  }
  h+='</div>';
  return h;
}

// ─── Fiche 360 : les trois blocs replies dans la carte d'un client ──────────
// Ils ne dupliquent aucun calcul : facturation via _agtBizDu/_agtBizEnc (lot A),
// incidents via les compteurs deja tenus par _agtErrRecount, acces via le
// journal GT — qui n'a plus d'onglet a lui mais reste consultable ici, la ou
// la question se pose vraiment : « qui est alle chez ce client, et quand ? ».
function _agtFicheSec(titre, corps){
  return '<div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06)">'
    +'<div style="font-size:var(--pt-lbl,10.5px);color:rgba(255,255,255,0.32);letter-spacing:.06em;text-transform:uppercase;font-weight:600;margin-bottom:7px">'+titre+'</div>'
    +corps+'</div>';
}
function _agtFicheBiz(slug){
  var idx=-1;
  for(var i=0;i<_agtTenants.length;i++) if(_agtTenants[i].slug===slug) idx=i;
  var fs=_agtFacts(slug), du=_agtBizDu(slug), enc=_agtBizEnc(slug), inte=_agtInterne(slug);
  var c='';
  if(inte){
    c='<div style="font-size:var(--pt-lbl,12px);color:rgba(255,255,255,0.3)">Domaine interne \u2014 hors facturation.</div>';
    return _agtFicheSec('Facturation', c);
  }
  c+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">';
  c+='<span style="font-size:var(--pt-lbl,12px);font-weight:600;color:'+(du>0?'#F97316':'#86EFAC')+';background:rgba(255,255,255,0.05);border-radius:20px;padding:3px 9px">'
    +(du>0?(_agtEur(du)+' \u00e0 encaisser'):'compte sold\u00e9')+'</span>';
  if(enc>0) c+='<span style="font-size:var(--pt-lbl,12px);color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.04);border-radius:20px;padding:3px 9px">'+_agtEur(enc)+' encaiss\u00e9s</span>';
  var _rm=_agtAboRemise(slug);
  c+='<span style="font-size:var(--pt-lbl,12px);color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.04);border-radius:20px;padding:3px 9px">'+(_AGT_PLANL[_agtPlan(slug)]||'')+' \u00b7 '+_agtEur(_agtAboPrix(slug))+'/mois'+(_rm?(' \u00b7 '+_escHtml(_rm.motif||'remis\u00e9')):'')+'</span>';
  c+='</div>';
  if(!fs.length){
    c+='<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.25)">Aucune ligne enregistr\u00e9e.</div>';
  } else {
    var ord=fs.map(function(f,k){ return k; }).sort(function(a,b){
      return String(fs[b].date||'').localeCompare(String(fs[a].date||''));
    }).slice(0,3);
    ord.forEach(function(k){
      var f=fs[k], ty=_AGT_TY[_agtFType(f)], ret=_agtFRetard(f);
      c+='<div style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:var(--pt-micro,11px);flex-wrap:wrap">';
      c+='<span style="width:13px;height:13px;border-radius:3px;background:'+ty.col+';color:#0B0F14;font-size:8px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+ty.ini+'</span>';
      c+='<span style="font-family:monospace;color:rgba(255,255,255,0.5)">'+_escHtml(f.ref||'')+'</span>';
      c+='<span style="color:rgba(255,255,255,0.28)">'+_agtDateFr(f.date)+'</span>';
      c+='<span style="flex:1"></span>';
      c+='<span style="font-weight:600;color:'+(ret>0?'#FCA5A5':(f.statut==='payee'?'rgba(134,239,172,0.7)':'rgba(255,255,255,0.6)'))+'">'+_agtEur(f.montant)+(ret>0?(' \u00b7 retard '+ret+' j'):'')+'</span>';
      c+='</div>';
    });
    if(fs.length>3) c+='<div style="font-size:10px;color:rgba(255,255,255,0.2);padding-top:2px">+ '+(fs.length-3)+' autre'+(fs.length>4?'s':'')+'</div>';
  }
  c+='<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:7px">';
  if(idx>=0) c+='<button onclick="event.stopPropagation();agtSwitchTab(\'business\')" style="background:none;border:none;color:rgba(196,181,253,0.5);font-size:var(--pt-micro,11px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);padding:0">Ouvrir Business</button>';
  if(idx>=0 && fs.length) c+='<button onclick="event.stopPropagation();agtBizReleve('+idx+')" style="background:none;border:none;color:rgba(196,181,253,0.5);font-size:var(--pt-micro,11px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);padding:0">Relev\u00e9 de compte</button>';
  c+='</div>';
  return _agtFicheSec('Facturation', c);
}
function _agtFicheIncid(t){
  var errs=(t.errors||[]).filter(function(e){ return !e.resolved; })
    .sort(function(a,b){ return new Date(b.ts)-new Date(a.ts); });
  var reps=(t.reports||[]).filter(function(r){ return !r.resolved; });
  var c='';
  if(!errs.length && !reps.length){
    var cnx=_agtConnexions[t.slug], d=cnx?_agtD(cnx.last):null;
    c='<div style="font-size:var(--pt-lbl,12px);color:'+(d?'rgba(134,239,172,0.65)':'rgba(255,255,255,0.28)')+'">'
      +(d?'Rien d\u2019ouvert \u00b7 derni\u00e8re connexion il y a '+_agtRelTime(d.toISOString())
         :'Rien d\u2019ouvert \u2014 mais aucune connexion enregistr\u00e9e, donc rien \u00e0 conclure')+'</div>';
    return _agtFicheSec('Incidents', c);
  }
  if(reps.length) c+='<div style="font-size:var(--pt-lbl,12px);color:#F97316;font-weight:600;margin-bottom:6px">'+reps.length+' signalement'+(reps.length>1?'s':'')+' en attente</div>';
  errs.slice(0,4).forEach(function(e){
    var m=_AGT_LVL[e.level]||_AGT_LVL.error;
    c+='<div style="display:flex;align-items:center;gap:7px;padding:3px 0;font-size:var(--pt-micro,11px);flex-wrap:wrap">';
    c+='<span style="width:6px;height:6px;border-radius:50%;background:'+m.color+';flex-shrink:0"></span>';
    c+='<span style="flex:1;min-width:120px;color:rgba(255,255,255,0.55);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_escHtml(e.msg||'')+'</span>';
    c+='<span style="color:rgba(255,255,255,0.25)">'+_agtRelTime(e.ts)+'</span>';
    c+='</div>';
  });
  if(errs.length>4) c+='<div style="font-size:10px;color:rgba(255,255,255,0.2);padding-top:2px">+ '+(errs.length-4)+' autre'+(errs.length>5?'s':'')+'</div>';
  c+='<button onclick="event.stopPropagation();agtIncVoirClient(\''+t.slug+'\')" style="background:none;border:none;color:rgba(196,181,253,0.5);font-size:var(--pt-micro,11px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);padding:7px 0 0">Ouvrir dans Incidents</button>';
  return _agtFicheSec('Incidents', c);
}
function _agtFicheAcces(slug){
  var l=(_agtAccessLog||[]).filter(function(a){ return a.tenant===slug; });
  var c='';
  if(!l.length){
    c='<div style="font-size:var(--pt-lbl,12px);color:rgba(255,255,255,0.28)">Aucun acc\u00e8s enregistr\u00e9.</div>';
  } else {
    l.slice(0,5).forEach(function(a){
      c+='<div style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:var(--pt-micro,11px);flex-wrap:wrap">';
      c+='<span style="flex-shrink:0;display:inline-flex">'+_agtIco(a.icon)+'</span>';
      c+='<span style="flex:1;min-width:120px;color:rgba(255,255,255,0.5)">'+_escHtml(a.action||'')+'</span>';
      c+='<span style="color:rgba(255,255,255,0.25)">'+_agtRelTime(a.ts)+'</span>';
      c+='</div>';
    });
    if(l.length>5) c+='<div style="font-size:10px;color:rgba(255,255,255,0.2);padding-top:2px">'+l.length+' au total \u00b7 conserv\u00e9s 90 jours</div>';
  }
  return _agtFicheSec('Acc\u00e8s GUERETTECH', c);
}

// ★★ VER-1 (§184) — LE PARC D'APPAREILS D'UN DOMAINE : qui tourne sur quelle version.
//   Écrit par chaque appareil à la connexion (firebase.js, fbNoterAppareil). Une version plus
//   ancienne que la version courante est signalée ; un FORMAT plus ancien = l'appareil est bloqué
//   en écriture (version périmée) jusqu'à sa mise à jour.
function _agtFicheAppareils(t){
  var A=(t&&t.appareils)||{}, ids=Object.keys(A);
  var cur=String(window.APP_VERSION||''), fcur=Number(window.MV_FORMAT)||0;
  var cmpV=function(a,b){ var x=String(a||'0').split('.').map(Number), y=String(b||'0').split('.').map(Number);
    for(var i=0;i<Math.max(x.length,y.length);i++){ var d=(x[i]||0)-(y[i]||0); if(d) return d; } return 0; };
  var c='';
  if(!ids.length){
    c='<div style="font-size:var(--pt-txt,13px);color:rgba(255,255,255,0.28)">Aucun appareil enregistr\u00e9 (se remplit \u00e0 la prochaine connexion de chacun).</div>';
  } else {
    var L=ids.map(function(k){ return A[k]||{}; }).sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); });
    var nVieux=L.filter(function(a){ return cmpV(a.v,cur)<0; }).length;
    if(nVieux) c+='<div style="font-size:var(--pt-micro,11px);color:#FBBF24;padding-bottom:4px">'+nVieux+' appareil'+(nVieux>1?'s':'')+' sur une version ant\u00e9rieure \u00e0 '+_escHtml(cur)+'</div>';
    L.slice(0,12).forEach(function(a){
      var vieux=cmpV(a.v,cur)<0, bloque=(Number(a.f)||0)<fcur;
      c+='<div style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:var(--pt-micro,11px);flex-wrap:wrap">';
      c+='<span style="flex:1;min-width:120px;color:rgba(255,255,255,0.55)">'+_escHtml(a.nom||'?')+' \u00b7 '+_escHtml((a.sys||'')+' '+(a.nav||''))+(a.installe?' \u00b7 install\u00e9e':'')+'</span>';
      c+='<span style="color:'+(bloque?'#F87171':(vieux?'#FBBF24':'rgba(255,255,255,0.45)'))+';font-weight:600">v'+_escHtml(a.v||'?')+(bloque?' \u00b7 bloqu\u00e9e':'')+'</span>';
      c+='<span style="color:rgba(255,255,255,0.25)">'+_agtRelTime(a.ts)+'</span>';
      c+='</div>';
    });
    if(L.length>12) c+='<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.3);padding-top:2px">'+L.length+' appareils au total</div>';
  }
  return _agtFicheSec('Appareils', c);
}

function _agtBuildClients(){
  // ★ GT-UI-3 (§518) : le tableau des clients (trié par santé) et sa fiche à onglets, dessinés par src/gt/clients.js
  //   à partir de ce que la console expose (_agtCliDonnees). L'ancienne liste de cartes dépliables est partie.
  return window._agtClientsVue ? window._agtClientsVue(window._agtCliDonnees()) : '';
}

// ════ PREP-1 — OUVRIR LA PRÉPARATION D'UN DOMAINE (§134) ════
// ⚠️ « Accéder » (retiré par GTFIX-4, §513) ouvrait le lien du domaine dans un NOUVEL onglet. Depuis SEC-GT, la
//   session GUERETTECH ne vit que dans son onglet (_fbSessionOnly) : ce nouvel onglet arrive
//   sur l'écran de connexion du domaine, sans session. « Préparer » entre dans ses écrans,
//   dans CET onglet. Chevauchement signalé, non tranché (§134).
//
// Journal d'accès RELU avant d'écrire. ★ GTFIX-1 (§510) : la même porte qu'agtLogAccess (transaction).
// L'ancienne version relisait bien, mais prenait une lecture RATÉE pour un journal vide — et le
// réécrivait avec une seule ligne. Une lecture ratée fait maintenant échouer l'écriture.
window._agtLogAccessLu = async function(slug, action, icon){
  return _agtJournalAjout(slug, action, icon, 'donnees');
};

// La feuille VÉRIFIE avant d'ouvrir : session GT, file d'attente et coffre de CETTE fenêtre.
// ⚠️ Construite par le DOM : nom du domaine et identifiants sont des saisies.
async function agtPrepOuvrir(slug){
  slug=String(slug||'');
  if(!/^[a-z0-9][a-z0-9-]*$/.test(slug)||slug.length>50) return;
  var cl=window._fbClaims?await window._fbClaims(true):null;
  var sessOk=!!(window._fbGtSessOk&&window._fbGtSessOk(cl));
  var resteMn=sessOk?Math.floor((cl.gts-Date.now())/60000):0;
  var nFile=window._fbQueueCompteDisque?window._fbQueueCompteDisque():0;
  var qt=window._fbQueueTenant?window._fbQueueTenant():'';
  var nCoffre=(typeof window.mvStashCount==='function')?window.mvStashCount():0;
  var cfg=null, clients={};
  try{ cfg=window.fbAdminRead?await window.fbAdminRead(slug,'config'):null; }catch(e){ if(window._mvAvale) window._mvAvale(e,'admin-gt.js/agtPrepOuvrir'); }
  try{ clients=(await _agtReadClients())||{}; }catch(e){ if(window._mvAvale) window._mvAvale(e,'admin-gt.js/agtPrepOuvrir#2'); }
  var nom=String((cfg&&cfg.domaine_nom)||slug);
  var plan=String((clients[slug]||{}).plan||'');
  var refus='';
  if(!sessOk) refus='Ta session GT est ferm\u00e9e : rouvre-la, puis reviens ici.';
  else if(nFile>0 && qt!==slug) refus=nFile+' modification'+(nFile>1?'s':'')+' '+(qt?('du domaine \u00ab '+qt+' \u00bb'):'d\u2019origine inconnue')+' attend'+(nFile>1?'ent':'')+' dans cette fen\u00eatre. Ouvre la pr\u00e9paration de ce domaine-l\u00e0 pour les envoyer, ou ferme la fen\u00eatre priv\u00e9e pour repartir de z\u00e9ro.';
  else if(nCoffre>0) refus=nCoffre+' saisie'+(nCoffre>1?'s':'')+' refus\u00e9e'+(nCoffre>1?'s':'')+' par le serveur '+(nCoffre>1?'sont gard\u00e9es':'est gard\u00e9e')+' dans cette fen\u00eatre. Ferme la fen\u00eatre priv\u00e9e pour repartir de z\u00e9ro.';
  var cnx='non charg\u00e9e';
  try{
    var c=_agtConnexions[slug], der=null;
    ((c&&c.members)||[]).forEach(function(m){ if(m&&m.lastActive&&(!der||new Date(m.lastActive)>new Date(der))) der=m.lastActive; });
    if(der) cnx=_agtCnxFmt(der).txt; else if(c) cnx='aucune';
  }catch(e){ if(window._mvAvale) window._mvAvale(e,'admin-gt.js/agtPrepOuvrir#3'); }

  var ex=document.getElementById('agt-prep-ov'); if(ex) ex.remove();
  var el=function(tag,css,txt){ var x=document.createElement(tag); if(css) x.style.cssText=css; if(txt!=null) x.textContent=txt; return x; };
  var ov=el('div','position:fixed;inset:0;background:rgba(6,4,12,0.88);z-index:10001;display:flex;align-items:center;justify-content:center;padding:20px;font-family:var(--font-ui,Outfit,sans-serif)');
  ov.id='agt-prep-ov';
  var bx=el('div','width:100%;max-width:440px;background:rgba(18,14,28,0.98);border-radius:20px;border:1px solid rgba(139,92,246,0.35);padding:22px;box-shadow:0 24px 60px rgba(0,0,0,0.6)');
  bx.appendChild(el('div','font-size:var(--pt-sm,16px);font-weight:700;color:#fff','Pr\u00e9parer '+nom));
  bx.appendChild(el('div','font-size:var(--pt-micro,11px);color:rgba(196,181,253,0.7);margin-top:3px;font-family:monospace',slug));
  var ligne=function(k,v,alerte){
    var r=el('div','display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:var(--pt-txt,13px)');
    r.appendChild(el('span','color:rgba(255,255,255,0.55)',k));
    r.appendChild(el('span','color:'+(alerte?'#FCA5A5':'rgba(255,255,255,0.88)')+';font-weight:600;text-align:right',v));
    return r;
  };
  var lst=el('div','margin:14px 0 12px');
  lst.appendChild(ligne('Session GT', sessOk?('encore '+Math.floor(resteMn/60)+' h '+('0'+(resteMn%60)).slice(-2)):'ferm\u00e9e', !sessOk||resteMn<30));
  lst.appendChild(ligne('En attente dans cette fen\u00eatre', nFile>0?(nFile+' modif. \u00b7 '+(qt||'origine inconnue')):'rien', nFile>0&&qt!==slug));
  lst.appendChild(ligne('Derni\u00e8re connexion de son \u00e9quipe', cnx, false));
  bx.appendChild(lst);
  bx.appendChild(el('p','font-size:var(--pt-txt,13px);line-height:1.6;color:rgba(255,255,255,0.7);margin:0 0 10px','Tu entres dans ses \u00e9crans, en administrateur. Ce que tu enregistres part directement dans son domaine, au nom de GUERETTECH. Les validations et le journal restent \u00e0 son \u00e9quipe.'));
  if(sessOk && resteMn<30) bx.appendChild(el('p','font-size:var(--pt-micro,11px);line-height:1.5;color:#E8A45A;margin:0 0 10px','Moins de 30 min de session : l\u2019\u00e9criture s\u2019arr\u00eatera 2 min avant la fin.'));
  if(refus) bx.appendChild(el('div','font-size:var(--pt-txt,13px);line-height:1.6;color:#FCA5A5;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:11px;padding:11px 13px;margin-bottom:6px',refus));
  var pied=el('div','display:flex;gap:10px;margin-top:16px');
  var non=el('button','flex:1;padding:12px;border-radius:12px;font-size:var(--pt-txt,13px);font-weight:600;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.65)','Annuler');
  non.type='button';
  non.addEventListener('click', function(){ ov.remove(); });
  var oui=el('button','flex:1.4;padding:12px;border-radius:12px;font-size:var(--pt-txt,13px);font-weight:600;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);border:none;background:linear-gradient(135deg,#7C4DD6,#8B5CF6);color:#fff','Ouvrir la pr\u00e9paration');
  oui.type='button';
  if(refus){ oui.disabled=true; oui.style.opacity='0.4'; oui.style.cursor='not-allowed'; }
  oui.addEventListener('click', async function(){
    if(refus) return;
    oui.disabled=true; oui.textContent='Ouverture\u2026';
    try{ await window._agtLogAccessLu(slug,'Pr\u00e9paration ouverte','crayon'); }
    catch(e){ if(window._mvAvale) window._mvAvale(e,'admin-gt.js/agtPrepOuvrir#4'); }
    if(!(window._mvPrepPoser && window._mvPrepPoser({ slug:slug, nom:nom, plan:plan }))){
      showToast('Stockage du navigateur indisponible \u2014 pr\u00e9paration impossible','#C0392B');
      oui.disabled=false; oui.textContent='Ouvrir la pr\u00e9paration';
    }
  });
  pied.appendChild(non); pied.appendChild(oui); bx.appendChild(pied);
  ov.appendChild(bx);
  document.body.appendChild(ov);
}

// ─── Onglet Accès log ─────────────────────────────────────────────────────────
function _agtBuildLog(){
  var h='<div class="agt-section-lbl">Log d\'accès GT — '+(_agtAccessLog.length)+' entrée(s)</div>';
  h+='<div class="agt-infobox">Accès enregistrés conformément aux CGU (support/maintenance). Gardés un an, par la date.</div>';
  if(!_agtAccessLog.length){
    h+='<div style="text-align:center;padding:28px;color:rgba(255,255,255,0.2);font-size:var(--pt-txt,13px)">Aucun accès enregistré</div>';
    return h;
  }
  for(var i=0;i<Math.min(_agtAccessLog.length,50);i++){
    var e=_agtAccessLog[i];
    h+='<div style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05)">';
    h+='<div style="width:34px;height:34px;border-radius:10px;flex-shrink:0;background:rgba(139,92,246,0.10);border:1px solid rgba(139,92,246,0.15);display:flex;align-items:center;justify-content:center;font-size:15px">'+_agtIco(e.icon||'')+'</div>';   // ★ GTFIX-4 : « cle », « crayon » s'écrivaient en toutes lettres (GT-B23)
    h+='<div style="flex:1">';
    h+='<div style="font-size:var(--pt-txt,13px);font-weight:500;color:rgba(255,255,255,0.8)">'+_escHtml(e.action)+'</div>';
    h+='<div style="display:flex;gap:8px;margin-top:3px;align-items:center">';
    h+='<span style="font-size:10px;background:rgba(139,92,246,0.10);border:1px solid rgba(139,92,246,0.2);border-radius:4px;padding:1px 6px;color:rgba(196,181,253,0.7);font-weight:600">'+_escHtml(e.tenant)+'</span>';
    h+='<span style="font-size:10px;color:rgba(255,255,255,0.2)">'+_agtRelTime(e.ts)+'</span>';
    h+='</div></div></div>';
  }
  return h;
}

// ─── Onglet Erreurs ───────────────────────────────────────────────────────────
// Lot B (06/08/2026) — outil de SUPPORT, plus une liste a derouler.
// Trois defauts corrigees :
//   1. la liste etait plate et coupee a 30 : le domaine le plus bavard (souvent
//      celui de developpement) noyait tous les autres ;
//   2. rien ne distinguait « ce client n'a aucune erreur » de « rien ne remonte
//      de chez lui » — c'est pourtant la seule question qui compte ;
//   3. les erreurs du localStorage de CE poste etaient melangees a celles des
//      clients, sans moyen de les separer.
// La liste est desormais GROUPEE par empreinte : une carte par probleme, avec
// son nombre d'occurrences, sa plage de dates et les domaines touches.

function _agtErrHash(s){
  var h=5381;
  for(var i=0;i<s.length;i++) h=((h*33)^s.charCodeAt(i))>>>0;
  return 'g'+h.toString(36);
}
// Empreinte : deux occurrences du meme probleme ne different souvent que par un
// identifiant ou un horodatage. On neutralise les suites de 3 chiffres et plus.
function _agtErrNorm(m){ return String(m||'').trim().replace(/\d{3,}/g,'#').slice(0,160); }
function _agtErrKey(e){ return (e.level||'error')+'|'+(e.cat||'')+'|'+_agtErrNorm(e.msg); }

// ════ GT-SUIVI-1 (§515) — LE SUIVI DES INCIDENTS VIT CHEZ GUERETTECH ════
// ★★★ L'audit du 01/11 (GT-B07) : « Traiter » réécrivait le journal d'erreurs DU DOMAINE pour y marquer `resolved` —
//   GTFIX-1 l'a mis en transaction (plus rien ne se perd), mais la console écrivait encore chez le client pour son
//   propre suivi. Désormais le suivi vit dans `_guerettech/suivi` (règle `_guerettech/{document=**}` : GUERETTECH
//   seul) : une fiche par incident — sa signature `_agtErrKey` —, avec sa priorité P1 à P4 (suggérée, puis
//   confirmée : décision D2), son statut, sa note, sa date de clôture.
//   Une occurrence est TRAITÉE quand son incident est clos ou sans suite ET qu'elle est arrivée AVANT la clôture ;
//   une occurrence plus récente rouvre l'incident (« revenu après clôture »). Les `resolved` d'avant ce lot comptent.
var _agtSuivi = {};
var _AGT_SUIVI_ST = { nouveau:'Nouveau', qualifie:'Qualifi\u00e9', en_cours:'En cours', corrige:'Corrig\u00e9, \u00e0 livrer',
  livre:'Livr\u00e9, \u00e0 v\u00e9rifier', clos:'Clos', sans_suite:'Sans suite' };
var _AGT_SUIVI_FIN = { clos:1, sans_suite:1 };
function _agtErrTraiteeParSuivi(e, suivi){
  var s=suivi && suivi[_agtErrKey(e)];
  return !!(s && _AGT_SUIVI_FIN[s.statut] && s.closLe && String(e.ts||'') <= String(s.closLe));
}
// Le « traité » de chaque occurrence en mémoire = son drapeau d'origine OU la clôture de son incident.
function _agtAppliquerSuivi(){
  (_agtTenants||[]).forEach(function(t){
    (t.errors||[]).forEach(function(e){
      if(e._resolvedOrig===undefined) e._resolvedOrig=!!e.resolved;
      e.resolved = e._resolvedOrig || _agtErrTraiteeParSuivi(e, _agtSuivi);
    });
    _agtErrRecount(t);
  });
}
// La mutation d'une fiche — pure, la transaction peut la rejouer. Document absent = suivi neuf.
function _agtMutSuivi(d, existe, cle, patch, maintenant){
  var v;
  if(!existe) v={};
  else if(d && d.value && typeof d.value==='object' && !Array.isArray(d.value)) v=d.value;
  else throw new Error('suivi illisible');
  v[cle]=Object.assign({}, v[cle]||{}, patch, { maj:maintenant });
  return { value:v };
}
async function _agtSuiviMaj(cle, patch){
  try{
    if(!window.fbGtMaj) throw new Error('fbGtMaj indisponible');
    var r=await window.fbGtMaj('suivi', function(d, existe){ return _agtMutSuivi(d, existe, cle, patch, new Date().toISOString()); });
    _agtSuivi=r.valeur.value;
    _agtAppliquerSuivi();
    return true;
  }catch(e){ _agtEchecEcriture(e, 'Suivi de l\u2019incident'); return false; }
}
// La priorité suggérée (décision D2) — dite avec sa raison, jamais imposée : critique → P1 ; information → P4 ;
// plusieurs domaines ou dix occurrences, et récent → P2 ; le reste → P3.
function _agtPrioSuggeree(g, maintenant){
  var nDom=Object.keys(g.tenants||{}).length, recent=!!(g.last && ((maintenant||Date.now())-g.last.getTime()) < 3*86400000);
  if(g.level==='critical') return { p:'P1', pourquoi:'critique' };
  if(g.level==='info') return { p:'P4', pourquoi:'information' };
  if((nDom>=2 || g.n>=10) && recent) return { p:'P2', pourquoi:(nDom>=2?(nDom+' domaines'):(g.n+' fois'))+', r\u00e9cent' };
  return { p:'P3', pourquoi:(g.level==='warning'?'avertissement':'erreur isol\u00e9e') };
}
function _agtSuiviLigne(g){
  // ★ GT-UI-4 (§519) : sur la charte de la maquette — la priorité en boutons (la suggérée dite), le statut en pastilles
  //   à choisir, la note, les versions. Les gestes restent ceux de GT-SUIVI-1 (annulables depuis GT-UI-2).
  var s=_agtSuivi[g.key]||{}, sg=_agtPrioSuggeree(g), st=_AGT_SUIVI_ST[s.statut]?s.statut:'nouveau';
  var vers=Object.keys(g.versions||{}).sort(), revenu=!!(s.closLe && _AGT_SUIVI_FIN[s.statut] && g.nOpen>0);
  var h='<div class="agt-inc-h4">Priorit\u00e9</div><div class="agt-inc-outils">';
  ['P1','P2','P3','P4'].forEach(function(p){
    var on=(s.prio===p), sug=(!s.prio && sg.p===p);
    h+='<button class="mvpas mvpas-filtre'+(on?' on':'')+(sug?' agt-sugg':'')+'" aria-pressed="'+on+'" title="'+(sug?('Sugg\u00e9r\u00e9e : '+_escAttr(sg.pourquoi)):('Priorit\u00e9 '+p))+'" onclick="agtSuiviPrio(\''+_escAttr(g.id)+'\',\''+p+'\')">'+p+'</button>';
  });
  h+='</div><p class="agt-cli-note">'+(s.prio?('Priorit\u00e9 confirm\u00e9e : '+s.prio+'.'):('Pas encore confirm\u00e9e. Sugg\u00e9r\u00e9e : <b>'+sg.p+'</b> \u2014 '+_escHtml(sg.pourquoi)+'.'))+'</p>';
  h+='<div class="agt-inc-h4">Statut</div><div class="agt-inc-outils">'+Object.keys(_AGT_SUIVI_ST).map(function(k){
    return '<button class="mvpas mvpas-filtre'+(k===st?' on':'')+'" aria-pressed="'+(k===st)+'" onclick="agtSuiviStatut(\''+_escAttr(g.id)+'\',\''+k+'\')">'+_AGT_SUIVI_ST[k]+'</button>';
  }).join('')+'</div>';
  if(revenu) h+='<p class="agt-cli-note"><span class="agt-revenu">revenu apr\u00e8s cl\u00f4ture</span> \u2014 une occurrence est arriv\u00e9e depuis.</p>';
  h+='<div class="agt-inc-outils"><button class="agt-btn agt-inc-court" onclick="agtSuiviNote(\''+_escAttr(g.id)+'\')">'+(s.note?'Modifier la note':'+ Note')+'</button>'
    +'<span class="agt-cli-note">'+(vers.length?('version'+(vers.length>1?'s':'')+' '+_escHtml(vers.join(', '))):'version non dite (erreurs d\u2019avant 10.59)')+(s.livreEn?(' \u00b7 livr\u00e9 en '+_escHtml(s.livreEn)):'')+'</span></div>';
  if(s.note) h+='<p class="agt-cli-note" style="white-space:pre-wrap">'+_escHtml(s.note)+'</p>';
  return h;
}
// ★ GT-UI-2 (§517) — CHAQUE GESTE DU SUIVI SE DÉFAIT (« Annuler », la maquette) : on garde ce qu'il remplace, et
//   la barre « Annuler » (src/gt/incidents.js) le remet. Une priorité vide (« ») retire la priorité confirmée.
function _agtSuiviAvant(cle){ var s=_agtSuivi[cle]||{}; return { prio:s.prio||'', statut:s.statut||'nouveau', closLe:s.closLe||'' }; }
function _agtProposerAnnuler(texte, cle, avant){
  if(!window._agtAnnulable) return;
  window._agtAnnulable(texte, function(){ _agtSuiviMaj(cle, avant).then(function(ok){ if(ok) agtRenderBody(); }); });
}
window.agtSuiviPrio=function(gid, p){
  var g=_agtErrGroupById(gid); if(!g || ['P1','P2','P3','P4',''].indexOf(p)<0) return Promise.resolve(false);
  var avant=_agtSuiviAvant(g.key);
  return _agtSuiviMaj(g.key, { prio:p }).then(function(ok){
    if(ok){ agtRenderBody(); _agtProposerAnnuler(p?('Priorit\u00e9 '+p+' pos\u00e9e'):'Priorit\u00e9 retir\u00e9e', g.key, { prio:avant.prio }); }
    return ok;
  });
};
window.agtSuiviStatut=function(gid, st){
  var g=_agtErrGroupById(gid); if(!g || !_AGT_SUIVI_ST[st]) return Promise.resolve(false);
  var patch={ statut:st }, now=new Date().toISOString(), avant=_agtSuiviAvant(g.key);
  if(_AGT_SUIVI_FIN[st]) patch.closLe=now;
  if(st==='livre'){ patch.livreLe=now; patch.livreEn=String(window.APP_VERSION||''); }
  return _agtSuiviMaj(g.key, patch).then(function(ok){
    if(ok){ agtRenderBody(); _agtProposerAnnuler('Statut : '+_AGT_SUIVI_ST[st], g.key, { statut:avant.statut, closLe:avant.closLe }); }
    return ok;
  });
};
// Plusieurs incidents d'un coup (la sélection de l'écran) : UNE transaction, et « Annuler » rend chacun à son état.
window.agtSuiviLot=async function(gids, patch){
  var cles=[], avants={};
  (gids||[]).forEach(function(gid){ var g=_agtErrGroupById(gid); if(g && !avants[g.key]){ cles.push(g.key); avants[g.key]=_agtSuiviAvant(g.key); } });
  if(!cles.length) return false;
  var chaine=function(fpatch){ return function(d, existe){ var r=null; cles.forEach(function(k, i){ r=_agtMutSuivi(i===0?d:r, i===0?existe:true, k, fpatch(k), new Date().toISOString()); }); return r; }; };
  try{
    if(!window.fbGtMaj) throw new Error('fbGtMaj indisponible');
    var r=await window.fbGtMaj('suivi', chaine(function(){ return patch; }));
    _agtSuivi=r.valeur.value; _agtAppliquerSuivi(); agtRenderBody();
    if(window._agtAnnulable) window._agtAnnulable(cles.length+' incident'+(cles.length>1?'s':'')+' mis \u00e0 jour', function(){
      window.fbGtMaj('suivi', chaine(function(k){ var a=avants[k]; return ('prio' in patch) ? { prio:a.prio } : { statut:a.statut, closLe:a.closLe }; }))
        .then(function(r2){ _agtSuivi=r2.valeur.value; _agtAppliquerSuivi(); agtRenderBody(); }, function(e){ _agtEchecEcriture(e, 'Suivi des incidents'); });
    });
    return true;
  }catch(e){ _agtEchecEcriture(e, 'Suivi des incidents'); return false; }
};
window.agtSuiviNote=function(gid){
  var g=_agtErrGroupById(gid); if(!g || !window.openPrompt) return;
  var cur=(_agtSuivi[g.key]||{}).note||'';
  window.openPrompt({
    titre:'Note de l\u2019incident', sub:'Visible uniquement dans ce panneau.',
    valeur:cur, type:'texte', btnLabel:'Enregistrer',
    cb:async function(v){ if(await _agtSuiviMaj(g.key, { note:String(v||'').slice(0,500) })) agtRenderBody(); }
  });
};

// Fusion des deux sources, dedoublonnee par id. Firebase d'abord : une erreur
// presente des deux cotes est bien celle du domaine.
function _agtErrMerged(){
  var seen={}, merged=[];
  _agtTenants.forEach(function(t){
    (t.errors||[]).forEach(function(e){
      if(seen[e.id]) return;
      seen[e.id]=true;
      merged.push(Object.assign({},e,{_tenantNom:t.nom||t.slug,_tenantSlug:t.slug,_src:'firebase'}));
    });
  });
  try{
    var ls=JSON.parse(localStorage.getItem(_ERR_KEY)||'[]');
    ls.forEach(function(e){
      if(seen[e.id]) return;
      seen[e.id]=true;
      merged.push(Object.assign({},e,{_tenantNom:e.tenant||'?',_tenantSlug:e.tenant||'',_src:'local'}));
    });
  }catch(ex){
    if(window.logError) window.logError({level:'info',cat:'ui',msg:'journal local illisible',detail:(ex&&ex.message)||String(ex)});
  }
  merged.sort(function(a,b){ return new Date(b.ts)-new Date(a.ts); });
  return merged;
}

function _agtErrGroupes(list){
  var map={}, out=[];
  list.forEach(function(e){
    var k=_agtErrKey(e), g=map[k];
    if(!g){
      g=map[k]={ key:k, id:_agtErrHash(k), level:e.level||'error', cat:e.cat||'',
                 msg:e.msg||'', n:0, nOpen:0, nCrit:0, first:null, last:null,
                 tenants:{}, pages:{}, users:{}, versions:{}, loc:0, fb:0, items:[] };
      out.push(g);
    }
    g.n++;
    if(!e.resolved){ g.nOpen++; if(e.level==='critical') g.nCrit++; }
    var d=_agtD(e.ts);
    if(d){ if(!g.first||d<g.first) g.first=d; if(!g.last||d>g.last) g.last=d; }
    var tn=e._tenantNom||e.tenant||'?';
    g.tenants[tn]=(g.tenants[tn]||0)+1;
    if(e.page) g.pages[e.page]=1;
    if(e.user && e.user!=='\u2014') g.users[e.user]=1;
    if(e.v) g.versions[String(e.v)]=1;   // ★ GT-SUIVI-1 (GT-B18)
    if(e._src==='local') g.loc++; else g.fb++;
    g.items.push(e);
  });
  // Le plus urgent en haut : ce qui est critique et ouvert, puis le plus recent.
  out.sort(function(a,b){
    if((b.nCrit>0)!==(a.nCrit>0)) return (b.nCrit>0)?1:-1;
    if((b.nOpen>0)!==(a.nOpen>0)) return (b.nOpen>0)?1:-1;
    return (b.last?b.last.getTime():0)-(a.last?a.last.getTime():0);
  });
  return out;
}

// Copie generique (le helper existant, _fallbackCopyGT, annonce « Lien copie »).
function _agtCopy(txt, ok){
  var msg=ok||'\u2705 Copi\u00e9';
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(
        function(){ showToast(msg,'#3D6B27'); },
        function(){ _agtCopyFb(txt,msg); });
      return;
    }
  }catch(e){
    if(window.logError) window.logError({level:'info',cat:'ui',msg:'presse-papiers indisponible',detail:(e&&e.message)||String(e)});
  }
  _agtCopyFb(txt,msg);
}
function _agtCopyFb(txt,msg){
  var ta=document.createElement('textarea');
  ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); showToast(msg,'#3D6B27'); }
  catch(e){ showToast('Copie impossible','#C0392B'); }
  document.body.removeChild(ta);
}

// ── Sante de la remontee ────────────────────────────────────────────────────
// « Zero erreur » n'a de sens que si le domaine s'est connecte. Sinon on ne
// sait rien du tout — et c'est exactement le cas qu'il faut voir.
function _agtErrSante(){
  var h='<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 14px;margin-bottom:12px">';
  h+='<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);letter-spacing:.06em;text-transform:uppercase;font-weight:600;margin-bottom:8px">Remont\u00e9e par domaine</div>';
  _agtTenants.forEach(function(t,i){
    var arr=Array.isArray(t.errors)?t.errors:[];
    var open=arr.filter(function(e){ return !e.resolved; }).length;
    var crit=arr.filter(function(e){ return e.level==='critical'&&!e.resolved; }).length;
    var last=null;
    arr.forEach(function(e){ var d=_agtD(e.ts); if(d && (!last||d>last)) last=d; });
    var cnx=_agtConnexions[t.slug], cnxLast=cnx?_agtD(cnx.last):null;
    var col, txt;
    if(crit>0){       col='#EF4444'; txt=crit+' critique'+(crit>1?'s':'')+' ouverte'+(crit>1?'s':''); }
    else if(open>0){  col='#F97316'; txt=open+' ouverte'+(open>1?'s':''); }
    else if(arr.length>0){ col='#86EFAC'; txt='tout est trait\u00e9'; }
    else if(cnxLast){ col='#86EFAC'; txt='aucune erreur remont\u00e9e'; }
    else {            col='rgba(255,255,255,0.3)'; txt='aucune connexion \u2014 rien \u00e0 conclure'; }
    h+='<div style="display:flex;align-items:center;gap:9px;padding:6px 0;flex-wrap:wrap'
      +(i<_agtTenants.length-1?';border-bottom:1px solid rgba(255,255,255,0.05)':'')+'">';
    h+='<span style="width:7px;height:7px;border-radius:50%;flex-shrink:0;background:'+col+'"></span>';
    h+='<span style="flex:1;min-width:130px;font-size:var(--pt-txt,13px);color:rgba(255,255,255,0.75)">'+_escHtml(t.nom)+'</span>';
    h+='<span style="font-size:var(--pt-lbl,12px);font-weight:600;color:'+col+'">'+txt+'</span>';
    h+='<span style="font-size:var(--pt-lbl,10.5px);color:rgba(255,255,255,0.25);min-width:120px;text-align:right">'
      +(last?('derni\u00e8re '+_agtRelTime(last.toISOString())):'\u2014')
      +(cnxLast?(' \u00b7 vu '+_agtRelTime(cnxLast.toISOString())):'')+'</span>';
    h+='</div>';
  });
  return h+'</div>';
}



// ── Actions de groupe ───────────────────────────────────────────────────────
// Retrouve un groupe depuis son empreinte, sans dependre de l'ordre d'affichage
// (les filtres peuvent avoir change entre le rendu et le clic).
function _agtErrGroupById(gid){
  var all=_agtErrGroupes(_agtErrMerged());
  for(var i=0;i<all.length;i++) if(all[i].id===gid) return all[i];
  return null;
}

// Resout TOUT le groupe. Un seul passage sur le localStorage et UNE SEULE
// ecriture par domaine, la ou N appels a agtResolveError en feraient N.
async function agtResolveGroup(gid){
  var g=_agtErrGroupById(gid);
  if(!g || g.nOpen===0) return;
  var ids={};
  g.items.forEach(function(e){ if(!e.resolved && e.id) ids[e.id]=true; });

  // Les occurrences gardées sur CE poste (localStorage) se marquent ici, comme avant.
  try{
    var raw=localStorage.getItem(_ERR_KEY);
    var log=raw?JSON.parse(raw):[];
    localStorage.setItem(_ERR_KEY, JSON.stringify(log.map(function(e){
      return ids[e.id] ? Object.assign({},e,{resolved:true}) : e;
    })));
  }catch(e){
    if(window.logError) window.logError({level:'info',cat:'ui',msg:'journal local non mis a jour',detail:(e&&e.message)||String(e)});
  }

  // ★★ GT-SUIVI-1 (§515) : l'incident se CLÔT dans _guerettech/suivi — plus rien n'est écrit dans le journal
  //   du domaine (GT-B07). Une occurrence arrivée après la clôture le rouvrira.
  var _avant=_agtSuiviAvant(g.key);   // ★ GT-UI-2 : pour « Annuler »
  if(await _agtSuiviMaj(g.key, { statut:'clos', closLe:new Date().toISOString() })){
    agtRenderBody();
    _agtProposerAnnuler('Incident clos', g.key, { statut:_avant.statut, closLe:_avant.closLe });
    var n=Object.keys(ids).length;
    showToast('Incident clos \u00b7 '+n+' occurrence'+(n>1?'s':'')+' trait\u00e9e'+(n>1?'s':''),'#3D6B27');
  }
}
// Marque traitées (ids) ou purge les traitées (purge) DANS le journal relu du domaine ; la mémoire du
// panneau prend ensuite la valeur réellement écrite — erreurs arrivées entre-temps comprises.
function _agtMutErreurs(liste, existe, ids, purge){
  if (liste === undefined){ if (existe) throw new Error('journal d\u2019erreurs illisible'); return undefined; }
  if (!Array.isArray(liste)) throw new Error('journal d\u2019erreurs illisible');
  if (purge) return liste.filter(function(e){ return !(e && (e.resolved || ids[e.id])); });   // ★ GT-SUIVI-1 : et les occurrences closes par le suivi
  return liste.map(function(e){ return (e && ids[e.id]) ? Object.assign({}, e, { resolved:true }) : e; });
}
async function _agtErrEcrire(t, ids, purge){
  try {
    if (!window.fbAdminMaj) throw new Error('fbAdminMaj indisponible');
    var r = await window.fbAdminMaj(t.slug, 'error_log', function(l, existe){ return _agtMutErreurs(l, existe, ids, purge); });
    if (r && Array.isArray(r.valeur)) { t.errors = r.valeur; _agtErrRecount(t); }
    return true;
  } catch (e) { _agtEchecEcriture(e, 'Erreurs de '+t.slug); return false; }
}

// Copie un rapport lisible : de quoi chercher dans le code sans retourner a l'ecran.
function agtErrCopy(gid){
  var g=_agtErrGroupById(gid);
  if(!g){ showToast('Groupe introuvable','#B85A1A'); return; }
  var det='';
  for(var q=0;q<g.items.length && !det;q++) det=g.items[q].detail||'';
  var noms=Object.keys(g.tenants).map(function(n){ return n+(g.tenants[n]>1?(' x'+g.tenants[n]):''); });
  var txt='MA VIGNE \u2014 rapport d\u2019erreur\n'
    +'Message   : '+g.msg+'\n'
    +'Niveau    : '+g.level+'  \u00b7  Cat\u00e9gorie : '+(g.cat||'\u2014')+'\n'
    +'Occurrences : '+g.n+' ('+g.nOpen+' non trait\u00e9e'+(g.nOpen>1?'s':'')+')\n'
    +'P\u00e9riode   : '+(g.first?_agtDateFr(g.first):'?')+' \u2192 '+(g.last?_agtDateFr(g.last):'?')+'\n'
    +'Domaines  : '+(noms.join(', ')||'\u2014')+'\n'
    +'\u00c9crans    : '+(Object.keys(g.pages).join(', ')||'\u2014')+'\n'
    +'Comptes   : '+(Object.keys(g.users).join(', ')||'\u2014')+'\n'
    +'Source    : '+g.fb+' remont\u00e9e(s) domaine, '+g.loc+' locale(s)\n'
    +(det?('\nD\u00e9tail technique :\n'+det+'\n'):'')
    +'\nIdentifiants : '+g.items.slice(0,20).map(function(e){ return e.id; }).join(' ')+'\n';
  _agtCopy(txt,'\u2705 Rapport copi\u00e9');
}


// ── Admin GT — Liens d'invitation ────────────────────────────────────────────
// GT_BASE_URL = 'https://mavigneapp.fr' (constante en tête de fichier)

function copyTenantLink(slug, btn) {
  var link = GT_BASE_URL + '/?tenant=' + slug;
  if(navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(function() {
      showToast('Lien copié', '#3D6B27');
      if(btn) { var orig=btn.textContent; btn.textContent='Copié'; setTimeout(function(){btn.textContent=orig;},2000); }
    }).catch(function() { _fallbackCopyGT(link); });
  } else { _fallbackCopyGT(link); }
}
function _fallbackCopyGT(link) {
  var ta=document.createElement('textarea');
  ta.value=link;ta.style.position='fixed';ta.style.opacity='0';
  document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');showToast('Lien copié','#3D6B27');}
  catch(e){showToast(link,'#1A4A7A');}
  document.body.removeChild(ta);
}

function agtSlugPreview(val) {
  var preview=document.getElementById('agt-link-preview');
  if(!preview)return;
  var slug=val.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  if(!slug||slug.length<2){preview.style.display='none';return;}
  preview.style.display='block';
  preview.textContent=GT_BASE_URL+'/?tenant='+slug;
}

async function saveAddTenant() {
  var inp=document.getElementById('agt-slug-input');
  if(!inp)return;
  var slug=inp.value.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  if(!slug||slug.length<2){showToast('Slug invalide (min 2 caract\u00e8res)','#C0392B');return;}
  if(!/^[a-z0-9][a-z0-9-]*$/.test(slug)||slug.length>50){showToast('Format invalide : lettres, chiffres, tirets','#C0392B');return;}
  var planEl=document.getElementById('agt-plan-input');
  var trialEl=document.getElementById('agt-trial-input');
  var plan=(planEl&&['essentiel','vigneron','domaine'].indexOf(planEl.value)>=0)?planEl.value:'domaine';
  var trialDays=trialEl?Math.max(0,Math.min(90,parseInt(trialEl.value,10)||0)):0;
  try {
    // ★ GTFIX-1 (§510) : lu et écrit dans la même transaction (GT-B01). L'ancienne version repartait de
    //   ['marchand-grillot'] sur une lecture ratée — et effaçait tous les autres clients du registre.
    var dejaLa=false;
    await _agtMajRegistre(function(clients,slugs){
      dejaLa=slugs.indexOf(slug)>=0;
      if(dejaLa) return false;
      slugs.push(slug);
      // status 'pending' → l'assistant d'onboarding s'ouvre pour ce slug (routage _fbTenantStatus).
      // plan + trialDays : appliqu\u00e9s au compte admin par la Cloud Function onboardTenant.
      clients[slug]={plan:plan,trialDays:trialDays,status:'pending',created_at:new Date().toISOString()};
    });
    if(dejaLa){showToast('Ce slug existe d\u00e9j\u00e0','#C0392B');return;}
    var link=GT_BASE_URL+'/?tenant='+slug;
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(link).catch(function(_e){ if(window._mvAvale) window._mvAvale(_e,'admin-gt.js/saveAddTenant'); });
    if(window.closeOv) window.closeOv(null,'ovAddTenant');
    inp.value='';
    var ess=trialDays>0?(' \u00b7 essai '+trialDays+' j'):'';
    showToast('Client ajout\u00e9 ('+plan+ess+') \u2014 lien copi\u00e9','#3D6B27');
    renderAdminGT();
  } catch(e) {
    _agtEchecEcriture(e,'Client non ajout\u00e9');
  }
}

// ── Journal des erreurs — actions ────────────────────────────────────────────
// agtRenderErrorLog() a ete supprime : il visait #agt-error-log, un element qui
// n'existe plus dans index.html, et ne lisait que le localStorage de CE poste.
// Le tableau de bord vivant est l'écran Incidents (src/gt/incidents.js, GT-UI-2), qui fusionne le localStorage et
// les error_log de tous les domaines.


// Recompte les compteurs d'un domaine apres reecriture de son error_log.
function _agtErrRecount(t) {
  var arr = Array.isArray(t.errors) ? t.errors : [];
  t.errorsOpen = arr.filter(function(e){ return !e.resolved; }).length;
  t.errorsCrit = arr.filter(function(e){ return e.level === 'critical' && !e.resolved; }).length;
}

// Marque une erreur resolue. Elle peut venir du localStorage de ce poste OU du
// error_log d'un domaine : on traite les deux, le rendu fusionne les deux sources.
async function agtResolveError(id) {
  try {
    var raw = localStorage.getItem(_ERR_KEY);
    var log = raw ? JSON.parse(raw) : [];
    localStorage.setItem(_ERR_KEY, JSON.stringify(log.map(function(e){
      return e.id === id ? Object.assign({}, e, { resolved: true }) : e;
    })));
  } catch(e) { console.warn('[agtResolveError] local', e); }

  // ★ GT-SUIVI-1 (§515) : traiter une occurrence, c'est clore SON incident (la même signature, partout) — dans
  //   _guerettech/suivi, plus dans le journal du domaine (GT-B07).
  var e = null;
  _agtTenants.forEach(function(t){ (t.errors||[]).forEach(function(x){ if(x && x.id===id) e=x; }); });
  if (e) await _agtSuiviMaj(_agtErrKey(e), { statut:'clos', closLe:new Date().toISOString() });
  agtRenderBody();
}

// Purge les erreurs resolues, ici et dans chaque domaine concerne.
// ★ GTFIX-1 (§510) : la purge efface pour de bon, dans le journal de chaque domaine — elle se confirme.
function agtPurgeErrors() {
  if (window.openConfirmDel) {
    window.openConfirmDel('Purger les erreurs trait\u00e9es ?',
      'Elles sont supprim\u00e9es du journal de chaque domaine. Les erreurs non trait\u00e9es restent.',
      function(){ _agtDoPurgeErrors(); }, 'corbeille', 'Purger', '#C0392B');
    return;
  }
  _agtDoPurgeErrors();
}
async function _agtDoPurgeErrors() {
  try {
    var raw = localStorage.getItem(_ERR_KEY);
    var log = raw ? JSON.parse(raw) : [];
    localStorage.setItem(_ERR_KEY, JSON.stringify(log.filter(function(e){ return !e.resolved; })));
  } catch(e) { console.warn('[agtPurgeErrors] local', e); }

  var echec = 0;
  for (var i = 0; i < _agtTenants.length; i++) {
    var t = _agtTenants[i];
    if (!Array.isArray(t.errors) || !t.errors.some(function(e){ return e.resolved; })) continue;
    var _ids = {}; t.errors.forEach(function(e){ if(e && e.resolved && e.id) _ids[e.id] = true; });   // ★ GT-SUIVI-1
    if (!(await _agtErrEcrire(t, _ids, true))) echec++;
  }
  _agtAppliquerSuivi();
  if (!echec) showToast('Erreurs trait\u00e9es supprim\u00e9es', '#3D6B27');
  agtRenderBody();
}

// ─── Panel Membres tenant ─────────────────────────────────────────────────────
var _ROLE_COLORS  = {admin:'#8B5CF6', ouvrier:'#3D6B27', tractoriste:'#1A4A7A', saisonnier:'#B8913A'};
var _AGT_MBR_COLORS = ['#3D6B27','#1A4A7A','#7A4F2E','#5B2D8E','#B8913A','#C0392B','#1A5276','#2E86C1'];

async function agtShowMembres(slug) {
  var existing = document.getElementById('agt-mbr-overlay');
  if(existing) existing.remove();
  var ov = document.createElement('div');
  ov.id = 'agt-mbr-overlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(10,8,18,0.96);z-index:9999;display:flex;flex-direction:column;font-family:var(--font-ui,Outfit,sans-serif);';
  ov.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px;border-bottom:1px solid rgba(139,92,246,0.15)">'
    + '<div style="display:flex;align-items:center;gap:10px">'
    + '<div style="width:32px;height:32px;border-radius:10px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);display:flex;align-items:center;justify-content:center;font-size:15px">\uD83D\uDC65</div>'
    + '<div><div style="font-size:15px;font-weight:600;color:#fff">Membres</div>'
    + '<div style="font-size:var(--pt-micro,11px);color:rgba(196,181,253,0.5);margin-top:1px">'+_escHtml(slug)+'</div></div>'
    + '</div>'
    + '<button onclick="document.getElementById(\'agt-mbr-overlay\').remove()" style="min-width:44px;min-height:44px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center">\u2715</button>'
    + '</div>'
    + '<div id="agt-mbr-body" style="flex:1;overflow-y:auto;padding:16px 20px">'
    + '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);font-size:var(--pt-txt,13px)">Chargement\u2026</div>'
    + '</div>'
    + '<div style="padding:14px 20px;border-top:1px solid rgba(139,92,246,0.12)">'
    + '<div style="display:flex;gap:8px">'
    + '<button onclick="agtOpenAddMembre(\''+slug+'\')" style="flex:1;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.35);border-radius:12px;color:#C4B5FD;font-size:var(--pt-txt,13px);font-weight:600;padding:12px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">+ Un membre</button>'
    + '<button onclick="agtOpenLotMembres(\''+slug+'\')" style="flex:1;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.35);border-radius:12px;color:#C9A84C;font-size:var(--pt-txt,13px);font-weight:600;padding:12px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">\uD83D\uDC65 Toute l\u2019\u00e9quipe</button>'
    + '</div>'
    + '</div>';
  document.body.appendChild(ov);
  await agtRefreshMembres(slug);
}

async function agtRefreshMembres(slug) {
  var body = document.getElementById('agt-mbr-body');
  if(!body) return;
  var mbr = window.fbAdminRead ? await window.fbAdminRead(slug, 'membres') : null;
  if(!Array.isArray(mbr) || mbr.length === 0) {
    body.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);font-size:var(--pt-txt,13px)">Aucun membre trouv\u00e9</div>';
    return;
  }
  var actifs   = mbr.filter(function(m){ return m.statut!=='inactif'&&m.statut!=='Inactif'; });
  var inactifs = mbr.filter(function(m){ return m.statut==='inactif'||m.statut==='Inactif'; });
  function _mbrCard(m) {
    var initiale = (m.nom||'?').charAt(0).toUpperCase();
    var couleur  = m.couleur || '#555';
    var roles    = Array.isArray(m.roles) ? m.roles : Object.keys(m.roles||{}).filter(function(r){ return m.roles[r]; });
    var roleHtml = roles.map(function(r){
      return '<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:5px;background:'+(_ROLE_COLORS[r]||'#555')+'22;color:'+(_ROLE_COLORS[r]||'#aaa')+';border:1px solid '+(_ROLE_COLORS[r]||'#555')+'44">'+r+'</span>';
    }).join('');
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05)">'
      +'<div style="width:40px;height:40px;border-radius:12px;background:'+couleur+';display:flex;align-items:center;justify-content:center;font-size:var(--pt-sm,16px);font-weight:700;color:#fff;flex-shrink:0">'+initiale+'</div>'
      +'<div style="flex:1;min-width:0">'
      +'<div style="font-size:var(--pt-base,14px);font-weight:600;color:#fff">'+_escHtml(m.nom||'\u2014')+'</div>'
      +'<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);margin:2px 0">'+_escHtml(m.email||'\u2014')+'</div>'
      +'<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:5px">'+roleHtml+'</div>'
      +'</div>'
      // Sortie de secours : la fen\u00eatre de remise des identifiants ne s'affiche qu'une fois.
      // \u26a0\ufe0f L'adresse passe par data-mail, jamais par une interpolation dans onclick.
      +'<button data-mail="'+_escHtml(m.email||'')+'" onclick="agtResetPwd(\''+slug+'\', this.dataset.mail, this)" '
      +'style="flex:none;font-size:var(--pt-micro,11px);background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.28);color:#C9A84C;border-radius:6px;padding:6px 10px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);white-space:nowrap;min-height:32px">'
      +_mvIcon('cle',16)+' Nouveau mot de passe</button>'
      +'</div>';
  }
  var h = '<div style="font-size:var(--pt-micro,11px);color:rgba(196,181,253,0.4);letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin-bottom:10px">'+actifs.length+' actif'+(actifs.length>1?'s':'')+'</div>';
  h += actifs.map(_mbrCard).join('');
  if(inactifs.length > 0) {
    h += '<div style="font-size:var(--pt-micro,11px);color:rgba(196,181,253,0.25);letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin:18px 0 10px">'+inactifs.length+' inactif'+(inactifs.length>1?'s':'')+'</div>';
    h += '<div style="opacity:0.5">'+inactifs.map(_mbrCard).join('')+'</div>';
  }
  body.innerHTML = h;
}

function agtOpenAddMembre(slug) {
  var body = document.getElementById('agt-mbr-body');
  if(!body) return;
  var chipsHtml = ['admin','ouvrier','tractoriste','saisonnier'].map(function(r){
    return '<span id="agt-chip-'+r+'" onclick="this.classList.toggle(\'on\');this.style.background=this.classList.contains(\'on\')?\''+(_ROLE_COLORS[r]||'#555')+'33\':\'transparent\';this.style.color=this.classList.contains(\'on\')?\''+(_ROLE_COLORS[r]||'#aaa')+'\':\'rgba(255,255,255,0.4)\'" style="cursor:pointer;font-size:var(--pt-micro,11px);font-weight:600;padding:5px 12px;border-radius:20px;border:1px solid '+(_ROLE_COLORS[r]||'#555')+'55;color:rgba(255,255,255,0.4);background:transparent;transition:all .15s">'+r+'</span>';
  }).join('');
  body.innerHTML = '<div style="padding:4px 0 16px">'
    +'<div style="font-size:var(--pt-txt,13px);font-weight:600;color:rgba(196,181,253,0.7);margin-bottom:14px">\u2192 Nouveau membre</div>'
    +'<input id="agt-add-nom"   type="text"     placeholder="Pr\u00e9nom" autocomplete="off" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(139,92,246,0.2);border-radius:10px;padding:11px 14px;font-size:var(--pt-txt,13px);color:#fff;font-family:var(--font-ui,Outfit,sans-serif);margin-bottom:10px;box-sizing:border-box">'
    +'<input id="agt-add-email" type="email"    placeholder="Email"  autocomplete="off" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(139,92,246,0.2);border-radius:10px;padding:11px 14px;font-size:var(--pt-txt,13px);color:#fff;font-family:var(--font-ui,Outfit,sans-serif);margin-bottom:10px;box-sizing:border-box">'
    +'<input id="agt-add-pwd"   type="password" placeholder="Mot de passe \u2014 laissez vide pour le g\u00e9n\u00e9rer" autocomplete="new-password" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(139,92,246,0.2);border-radius:10px;padding:11px 14px;font-size:var(--pt-txt,13px);color:#fff;font-family:var(--font-ui,Outfit,sans-serif);margin-bottom:10px;box-sizing:border-box">'
    +'<div style="margin-bottom:14px"><div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);margin-bottom:8px">R\u00f4les</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'+chipsHtml+'</div></div>'
    +'<div id="agt-add-err" style="display:none;color:#EF4444;font-size:var(--pt-micro,12px);margin-bottom:10px"></div>'
    +'<div style="display:flex;gap:8px">'
    +'<button onclick="agtRefreshMembres(\''+slug+'\')" style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:rgba(255,255,255,0.5);font-size:var(--pt-txt,13px);padding:11px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">Annuler</button>'
    +'<button id="agt-add-btn" onclick="agtSaveAddMembre(\''+slug+'\')" style="flex:2;background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.4);border-radius:10px;color:#C4B5FD;font-size:var(--pt-txt,13px);font-weight:600;padding:11px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">\u2713 Cr\u00e9er le compte</button>'
    +'</div></div>';
}

async function agtSaveAddMembre(slug) {
  var nom   = (document.getElementById('agt-add-nom')  ||{value:''}).value.trim();
  var email = (document.getElementById('agt-add-email')||{value:''}).value.trim();
  var pwd   = (document.getElementById('agt-add-pwd')  ||{value:''}).value;
  var roles = ['admin','ouvrier','tractoriste','saisonnier'].filter(function(r){
    var c = document.getElementById('agt-chip-'+r);
    return c && c.classList.contains('on');
  });
  var errEl = document.getElementById('agt-add-err');
  var btn   = document.getElementById('agt-add-btn');
  function _err(msg){ if(errEl){errEl.textContent=msg;errEl.style.display='block';} }
  if(!nom)                      { _err('Pr\u00e9nom requis'); return; }
  if(!email||!email.includes('@')){ _err('Email invalide'); return; }
  // SEC-2 : laisse vide = le serveur genere un mot de passe prononcable, affiche UNE
  // fois. C'etait deja possible cote Cloud Function ; cet ecran l'exigeait pour rien.
  if(pwd && pwd.length < 8)     { _err('Mot de passe trop court (8 car. min.) \\u2014 ou laissez vide'); return; }
  if(!roles.length)             { _err('S\u00e9lectionnez au moins un r\u00f4le'); return; }
  if(errEl) errEl.style.display = 'none';
  if(btn){ btn.disabled=true; btn.textContent='Cr\u00e9ation\u2026'; }
  try {
    if(!window.createAuthAccount) throw new Error('createAuthAccount non disponible');
    // ⚠️ `tenant: slug` OBLIGATOIRE ici : sans lui le compte partait sur le tenant de
    //    localStorage, pas sur le domaine affiche. Cf. le commentaire de createAuthAccount.
    var cred = await window.createAuthAccount(email, pwd, { roles: roles, tenant: slug });
    if(!cred) throw new Error('\u00c9chec cr\u00e9ation compte Auth');
    // ★ GTFIX-1 (§510) : la liste est relue dans la transaction. Avant, une lecture ratée valait
    //   « aucun membre » : l'équipe entière était remplacée par le nouveau (GT-B02).
    if(!window.fbAdminMaj) throw new Error('fbAdminMaj indisponible');
    var _rm = await window.fbAdminMaj(slug, 'membres', function(mbr, existe){
      return _agtMutMembres(mbr, existe, [{ nom:nom, email:email, roles:roles, statut:'actif' }]);
    });
    if(!_rm || !_rm.ecrit) throw new Error('\u00c9chec \u00e9criture Firestore');
    showToast('Membre cr\u00e9\u00e9\u00a0: '+nom, '#3D6B27');
    // Mot de passe genere = il n'existe nulle part ailleurs. Meme remise que
    // l'installation et que « Nouveau mot de passe » : un ecran, une fois.
    if (cred && cred.generated && cred.password) {
      _agtIns.creds = { nom: nom, slug: slug, mail: email, pwd: cred.password, trial: 0, parc: 0, ha: 0 };
      _agtInsHost().classList.add('on');
      _agtInsRender();
    }
    await agtRefreshMembres(slug);
  } catch(e) {
    var msg = e.message||'Erreur inconnue';
    if(e.code==='auth/email-already-in-use') msg = 'Cet email est d\u00e9j\u00e0 utilis\u00e9';
    if(e.code==='auth/weak-password')        msg = 'Mot de passe trop faible';
    _err(''+msg);
    if(btn){ btn.disabled=false; btn.textContent='Cr\u00e9er le compte'; }
  }
}

// ============================================================================
// CREER L'EQUIPE EN UNE FOIS
// ============================================================================
// Douze permanents, c'est douze fois le meme geste : taper un nom, inventer une
// adresse, inventer un mot de passe, recommencer. Ici on colle la liste que le
// domaine a deja ecrite quelque part, on regarde ce qui va etre cree, et on cree.
//
// CE QUI RESTE VOLONTAIREMENT MANUEL : rien n'est cree sans que l'ecran l'ait
// montre avant. L'apercu est la moitie de la fonctionnalite.
//
// ⚠️ Le DPA se signe AVANT la creation des comptes des salaries : ce sont leurs
//    donnees personnelles. L'ecran le rappelle ; il ne bloque pas, parce que la
//    signature peut avoir eu lieu sur papier et que GT est seul juge.
var _agtLot = { slug: '', txt: '', lignes: [], exist: [], creds: [], err: [], busy: false };

function _agtLotKey(s) {
  return String(s == null ? '' : s).trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
}
// Les roles reconnus dans une ligne collee. Defaut : ouvrier, jamais admin —
// un droit ne s'accorde pas par omission.
function _agtLotRoles(s) {
  var t = ' ' + _agtLotKey(s).replace(/([a-z])(?=[A-Z])/g, '$1 ') + ' ';
  var k = _agtLotKey(s), out = [];
  ['admin', 'ouvrier', 'tractoriste', 'saisonnier'].forEach(function (r) {
    if (k.indexOf(r) >= 0) out.push(r);
  });
  if (t && !out.length) out.push('ouvrier');
  return out;
}
// ⚠️ LA CONVENTION D'ADRESSE N'EST PAS LE SLUG. Vu en lisant les comptes reels :
//    un domaine peut etre sur prenom.<forme-contractee>@mavigneapp.fr quand son slug
//    est <forme-longue-a-tirets>, et un autre sur @mavigne.app — l'AUTRE domaine de
//    messagerie. Fabriquer l'adresse a partir du slug
//    aurait donne, chez un domaine deja installe, des identifiants etrangers a ceux de
//    ses collegues. On la DEDUIT donc de ce qui existe, par majorite ; a defaut
//    seulement, le slug sert de depart.
// ⚠️ PAS _agtLotKey ici : elle sert a comparer des PRENOMS et retire tout ce qui
//    n'est pas lettre ou chiffre. Appliquee a la partie d'adresse, elle transformait
//    « un-slug-a-tirets » en « unslugatirets » — une convention qui ne
//    ressemble ni au slug ni aux comptes existants. Le tiret et le point sont valides
//    dans une adresse : on les garde.
function _agtLotPart(v) {
  return String(v == null ? '' : v).trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9.-]+/g, '')
    .replace(/^[.-]+/, '').replace(/[.-]+$/, '');
}
function _agtLotConv(existants, slug) {
  var re = /^[^@]*\.([^@]+)@(mavigne\.app|mavigneapp\.fr)$/i, cnt = {}, best = null;
  (existants || []).forEach(function (m) {
    var mm = re.exec(String((m && m.email) || '').trim());
    if (!mm) return;
    var k = mm[1].toLowerCase() + '|' + mm[2].toLowerCase();
    cnt[k] = (cnt[k] || 0) + 1;
    if (!best || cnt[k] > cnt[best]) best = k;
  });
  if (best) { var p = best.split('|'); return { part: p[0], dom: p[1], deduite: true }; }
  return { part: slug, dom: 'mavigneapp.fr', deduite: false };
}
// Adresse de connexion quand le membre n'en a pas. Elle ne recoit aucun message —
// c'est un identifiant, pas une boite.
function _agtLotMail(nom, conv, pris) {
  var part = (conv && conv.part) || '', dom = (conv && conv.dom) || 'mavigneapp.fr';
  var base = _agtLotKey(nom) || 'membre';
  var m = base + '.' + part + '@' + dom, i = 2;
  while (pris[m.toLowerCase()]) { m = base + i + '.' + part + '@' + dom; i++; }
  return m;
}
// Une ligne = un membre. Separateurs : point-virgule ou tabulation (un collage
// depuis un tableur arrive en tabulations). Les colonnes apres le nom sont
// reconnues a leur contenu : ce qui porte un @ est une adresse, le reste un role.
function _agtLotParse(txt, conv, existants) {
  var pris = {}, nomsPris = {}, out = [];
  (existants || []).forEach(function (m) {
    if (m && m.email) pris[String(m.email).toLowerCase()] = 1;
    if (m && m.nom) nomsPris[_agtLotKey(m.nom)] = 1;
  });
  String(txt || '').split(/[\r\n]+/).forEach(function (l) {
    l = l.trim(); if (!l) return;
    var c = l.split(/[;\t]/).map(function (x) { return x.trim(); });
    var nom = c[0] || ''; if (!nom) return;
    var mail = '', rol = '';
    for (var i = 1; i < c.length; i++) {
      if (!c[i]) continue;
      if (c[i].indexOf('@') >= 0) mail = c[i]; else rol += ' ' + c[i];
    }
    var roles = _agtLotRoles(rol);
    var deja = !!nomsPris[_agtLotKey(nom)] || (mail && !!pris[mail.toLowerCase()]);
    if (!mail) mail = _agtLotMail(nom, conv, pris);
    pris[mail.toLowerCase()] = 1; nomsPris[_agtLotKey(nom)] = 1;
    var fictive = /@(mavigne\.app|mavigneapp\.fr)$/i.test(mail);
    var bloque = '';
    if (deja) bloque = 'd\u00e9j\u00e0 dans l\u2019\u00e9quipe';
    // Le serveur refuse une adresse fictive pour un administrateur : c'est son seul
    // moyen de recuperer son acces. Autant le dire AVANT d'essayer.
    else if (roles.indexOf('admin') >= 0 && fictive) bloque = 'un administrateur a besoin d\u2019une vraie adresse';
    out.push({ nom: nom, email: mail, roles: roles, fictive: fictive, bloque: bloque });
  });
  return out;
}

async function agtOpenLotMembres(slug) {
  var body = document.getElementById('agt-mbr-body');
  if (!body) return;
  _agtLot = { slug: slug, txt: '', lignes: [], exist: [], creds: [], err: [], busy: false };
  try {
    _agtLot.exist = (window.fbAdminRead ? await window.fbAdminRead(slug, 'membres') : null) || [];
    if (!Array.isArray(_agtLot.exist)) _agtLot.exist = [];
  } catch (e) {
    _agtLot.exist = [];
    if (window.logError) window.logError({ level: 'info', cat: 'agt-lot', msg: 'lecture membres impossible' });
  }
  _agtLot.conv = _agtLotConv(_agtLot.exist, slug);
  _agtLotRender();
}

function _agtLotRender() {
  var body = document.getElementById('agt-mbr-body');
  if (!body) return;
  if (_agtLot.creds.length || _agtLot.err.length) { body.innerHTML = _agtLotCredsHtml(); return; }
  var E = window._escHtml || function (x) { return String(x == null ? '' : x); };
  var cv = _agtLot.conv || _agtLotConv(_agtLot.exist, _agtLot.slug);
  var h = '<div style="padding:4px 0 16px">'
    + '<div style="font-size:var(--pt-txt,13px);font-weight:600;color:rgba(196,181,253,0.7);margin-bottom:6px">\u2192 Toute l\u2019\u00e9quipe</div>'
    + '<div style="font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.4);line-height:1.6;margin-bottom:12px">'
    + 'Un membre par ligne. <b>Pr\u00e9nom</b>, ou <b>Pr\u00e9nom;r\u00f4le</b>, ou <b>Pr\u00e9nom;adresse;r\u00f4le</b>. '
    + 'Un collage depuis un tableur passe aussi. Sans r\u00f4le indiqu\u00e9\u00a0: ouvrier.</div>'
    + '<div style="font-size:var(--pt-micro,12px);color:#E0A46A;background:rgba(184,90,26,.10);border-left:3px solid #B85A1A;'
    + 'border-radius:0 8px 8px 0;padding:9px 12px;margin-bottom:12px;line-height:1.55">'
    + 'Le DPA se signe <b>avant</b> la cr\u00e9ation des comptes des salari\u00e9s.</div>'
    + '<textarea id="agt-lot-txt" rows="7" placeholder="Paul;admin&#10;Lucie&#10;Marie;marie@domaine.fr;ouvrier tractoriste" '
    + 'style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(139,92,246,0.2);'
    + 'border-radius:10px;padding:11px 14px;font-size:var(--pt-sm,16px);color:#fff;font-family:var(--font-ui,Outfit,sans-serif);line-height:1.5;resize:vertical"></textarea>'
    + '<div style="margin-top:12px;padding:10px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px">'
    + '<div style="font-size:var(--pt-micro,11px);color:rgba(196,181,253,0.45);letter-spacing:.06em;text-transform:uppercase;font-weight:600;margin-bottom:7px">Adresses de connexion</div>'
    + '<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;font-size:var(--pt-txt,13px);color:rgba(255,255,255,0.5);font-family:ui-monospace,Menlo,monospace">'
    + '<span>pr\u00e9nom.</span>'
    + '<input id="agt-lot-part" style="flex:1 1 130px;min-width:0;background:rgba(255,255,255,0.05);border:1px solid rgba(139,92,246,0.2);border-radius:8px;padding:7px 10px;font-size:var(--pt-sm,16px);color:#fff;font-family:inherit">'
    + '<span>@</span>'
    + '<select id="agt-lot-dom" style="background:rgba(255,255,255,0.05);border:1px solid rgba(139,92,246,0.2);border-radius:8px;padding:7px 8px;font-size:var(--pt-sm,16px);color:#fff;font-family:inherit">'
    + '<option value="mavigneapp.fr">mavigneapp.fr</option><option value="mavigne.app">mavigne.app</option></select>'
    + '</div>'
    + '<div style="font-size:var(--pt-lbl,12px);color:rgba(255,255,255,0.3);margin-top:7px;line-height:1.5">'
    + (cv.deduite ? 'Reprise des adresses d\u00e9j\u00e0 en place chez ce domaine.'
                  : 'Aucune adresse \u00e0 recopier\u00a0: le slug sert de d\u00e9part.')
    + ' Elles ne re\u00e7oivent aucun message.</div>'
    + '</div>'
    + '<div style="display:flex;gap:8px;margin-top:10px">'
    + '<button onclick="agtRefreshMembres(\'' + _agtLot.slug + '\')" style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:rgba(255,255,255,0.5);font-size:var(--pt-txt,13px);padding:11px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">Annuler</button>'
    + '<button onclick="agtLotPreview()" style="flex:2;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.4);border-radius:10px;color:#C9A84C;font-size:var(--pt-txt,13px);font-weight:600;padding:11px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">Voir ce qui sera cr\u00e9\u00e9</button>'
    + '</div>';

  if (_agtLot.lignes.length) {
    var aCreer = _agtLot.lignes.filter(function (x) { return !x.bloque; });
    h += '<div style="font-size:var(--pt-micro,11px);color:rgba(196,181,253,0.4);letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin:18px 0 8px">Apercu</div>';
    h += '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:10px;overflow:hidden">';
    _agtLot.lignes.forEach(function (x) {
      var col = x.bloque ? 'rgba(255,255,255,0.25)' : '#fff';
      h += '<div style="padding:9px 12px;border-bottom:1px solid rgba(255,255,255,0.05)">'
        + '<div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap">'
        + '<span style="font-size:13.5px;font-weight:600;color:' + col + '">' + E(x.nom) + '</span>'
        + x.roles.map(function (r) {
            return '<span style="font-size:10px;font-weight:600;padding:2px 7px;border-radius:5px;background:' + (_ROLE_COLORS[r] || '#555') + '22;color:' + (_ROLE_COLORS[r] || '#aaa') + '">' + E(r) + '</span>';
          }).join('')
        + '</div>'
        + '<div style="font-size:var(--pt-lbl,12px);color:rgba(255,255,255,0.35);margin-top:2px">' + E(x.email)
        + (x.fictive && !x.bloque ? ' \u00b7 identifiant, pas une bo\u00eete' : '') + '</div>'
        + (x.bloque ? '' : _agtLotModsLigne(x.roles))
        + (x.bloque ? '<div style="font-size:var(--pt-lbl,12px);color:#E0A46A;margin-top:3px">\u2298 ' + E(x.bloque) + '</div>' : '')
        + '</div>';
    });
    h += '</div>';
    if (aCreer.length) {
      h += '<button id="agt-lot-go" onclick="agtLotGo()" style="width:100%;margin-top:12px;background:#3D6B27;border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:600;padding:14px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);min-height:52px">'
        + 'Cr\u00e9er ' + aCreer.length + ' compte' + (aCreer.length > 1 ? 's' : '') + '</button>';
    } else {
      h += '<div style="font-size:var(--pt-txt,13px);color:rgba(255,255,255,0.4);margin-top:12px;text-align:center">Rien \u00e0 cr\u00e9er.</div>';
    }
  }
  h += '</div>';
  body.innerHTML = h;
  // ⚠️ Valeur posee EN JS : un collage contient des apostrophes et des retours ligne.
  var ta = document.getElementById('agt-lot-txt');
  if (ta) ta.value = _agtLot.txt || '';
  var ip = document.getElementById('agt-lot-part'); if (ip) ip.value = cv.part || '';
  var id = document.getElementById('agt-lot-dom');  if (id) id.value = cv.dom || 'mavigneapp.fr';
}

function agtLotPreview() {
  var ta = document.getElementById('agt-lot-txt');
  _agtLot.txt = ta ? String(ta.value || '') : '';
  if (!_agtLot.txt.trim()) { showToast('Collez d\u2019abord la liste de l\u2019\u00e9quipe', '#B85A1A'); if (ta) ta.focus(); return; }
  var ip = document.getElementById('agt-lot-part'), id = document.getElementById('agt-lot-dom');
  var part = ip ? _agtLotPart(ip.value) : '';
  // Vide ou impossible a normaliser : on retombe sur le slug plutot que sur une
  // adresse cassee, et l'ecran le montre puisque le champ est repeint.
  _agtLot.conv = { part: part || _agtLot.slug, dom: (id && id.value) || 'mavigneapp.fr',
                   deduite: !!(_agtLot.conv && _agtLot.conv.deduite) };
  _agtLot.lignes = _agtLotParse(_agtLot.txt, _agtLot.conv, _agtLot.exist);
  _agtLotRender();
}

// Ce que la creation va masquer, DIT dans l'apercu. Un reglage pose sans le dire
// se decouvre chez le client, et on ne sait plus si c'est voulu ou si c'est un bug.
// Les libelles sont ceux de la fiche membre — l'installateur et le client doivent
// lire les memes mots.
var _AGT_MOD_LBL = { tracteur: 'Tracteur', phyto: 'Phyto', cave: 'Cave',
                     reserve: 'R\u00e9serve', planning: 'Planning', pilotage: 'Pilotage' };
function _agtLotModsLigne(roles) {
  var md = null;
  try { md = window._mvModsDefaut ? window._mvModsDefaut(roles) : null; } catch (e) { md = null; }
  var ks = md ? Object.keys(md) : [];
  if (!ks.length) return '<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.28);margin-top:3px">Tous les modules visibles</div>';
  var noms = ks.map(function (k) { return _AGT_MOD_LBL[k] || k; }).join(', ');
  return '<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.32);margin-top:3px">'
    + _mvIcon('oeil',16)+' Masqu\u00e9s\u00a0: ' + noms + ' \u00b7 <span style="opacity:.7">modifiable dans R\u00e9glages</span></div>';
}

// Creation. Une par une — createMemberAccount cree UN compte. Ce qui echoue est
// dit, ce qui a reussi est garde : on ecrit le document `membres` MEME en cas
// d'echec partiel, sinon un compte existerait sans fiche, invisible et inutilisable.
// ★ GTFIX-1 (§510) — ajouter des fiches à l'équipe RELUE. Document absent = équipe neuve ; forme
//   inconnue = on n'écrit rien. Une adresse déjà présente n'est pas ajoutée deux fois. La couleur suit
//   la place réelle dans la liste relue (elle était calculée sur la copie du panneau).
function _agtMutMembres(liste, existe, fiches){
  if (liste === undefined){ if (existe) throw new Error('liste des membres illisible'); liste = []; }
  if (!Array.isArray(liste)) throw new Error('liste des membres illisible');
  var vus = {};
  liste.forEach(function(m){ if (m && m.email) vus[String(m.email).toLowerCase()] = true; });
  fiches.forEach(function(f){
    var cle = String(f.email || '').toLowerCase();
    if (cle && vus[cle]) return;
    vus[cle] = true;
    liste.push(Object.assign({}, f, { couleur: f.couleur || _AGT_MBR_COLORS[liste.length % _AGT_MBR_COLORS.length] }));
  });
  return liste;
}
async function agtLotGo() {
  if (_agtLot.busy) return;
  var slug = _agtLot.slug;
  var todo = _agtLot.lignes.filter(function (x) { return !x.bloque; });
  if (!todo.length) return;
  _agtLot.busy = true;
  var btn = document.getElementById('agt-lot-go');
  var mbr = (_agtLot.exist || []).slice();
  var creds = [], err = [], nouvelles = [];   // ★ GTFIX-1 : seules les fiches NEUVES partent, ajoutées à la liste relue
  for (var i = 0; i < todo.length; i++) {
    var x = todo[i];
    if (btn) { btn.disabled = true; btn.textContent = 'Cr\u00e9ation\u2026 ' + (i + 1) + '/' + todo.length; }
    try {
      var cred = await window.createAuthAccount(x.email, '', { roles: x.roles, tenant: slug });
      if (!cred) throw new Error('aucune r\u00e9ponse');
      var _fiche = { nom: x.nom, email: x.email, roles: x.roles,
                 couleur: _AGT_MBR_COLORS[mbr.length % _AGT_MBR_COLORS.length], statut: 'actif' };
      // Modules masques d'apres le role — table dans utils.js, source unique
      // partagee avec le preset de la fiche membre. Objet vide -> AUCUN champ :
      // « absent » reste le defaut lisible cote _canModule, et un domaine sans
      // roles reconnus cree exactement les memes fiches qu'avant ce lot.
      try {
        var _md = window._mvModsDefaut ? window._mvModsDefaut(x.roles) : null;
        if (_md && Object.keys(_md).length) _fiche.mods = _md;
      } catch (e) {
        if (window.logError) window.logError({ level: 'info', cat: 'agt-lot', msg: 'mods par defaut non poses' });
      }
      mbr.push(_fiche); nouvelles.push(_fiche);
      creds.push({ nom: x.nom, mail: x.email, pwd: (cred.password || '') });
    } catch (e) {
      var msg = (e && (e.message || e.code)) || 'erreur';
      if (e && e.code === 'auth/email-already-in-use') msg = 'adresse d\u00e9j\u00e0 utilis\u00e9e';
      err.push({ nom: x.nom, msg: msg });
    }
  }
  if (creds.length) {
    try {
      if (!window.fbAdminMaj) throw new Error('fbAdminMaj indisponible');
      var _rl = await window.fbAdminMaj(slug, 'membres', function (liste, existe) { return _agtMutMembres(liste, existe, nouvelles); });
      if (!_rl || !_rl.ecrit) throw new Error('\u00e9criture refus\u00e9e');
      _agtLot.exist = _rl.valeur;
      await agtLogAccess(slug, creds.length + ' compte(s) cr\u00e9\u00e9(s) en lot', '\uD83D\uDC65');
    } catch (e) {
      // Les comptes existent, la fiche n'est pas passee : le dire fort, c'est
      // exactement le cas ou un membre apparaitrait nulle part.
      err.push({ nom: '\u2014', msg: 'comptes cr\u00e9\u00e9s mais fiches non enregistr\u00e9es : ' + ((e && e.message) || 'erreur') });
      if (window.logError) window.logError({ level: 'error', cat: 'agt-lot', msg: 'ecriture membres refusee' });
    }
  }
  _agtLot.creds = creds; _agtLot.err = err; _agtLot.busy = false;
  _agtLotRender();
}

// Les mots de passe n'existent nulle part ailleurs : ni Firestore, ni claims, ni
// journal. Cet ecran est la seule occasion de les transmettre.
function _agtLotCredsHtml() {
  var E = window._escHtml || function (x) { return String(x == null ? '' : x); };
  var h = '<div style="padding:4px 0 16px">';
  if (_agtLot.creds.length) {
    h += '<div style="font-size:15px;font-weight:600;color:#86EFAC;margin-bottom:4px">' + _agtLot.creds.length + ' compte' + (_agtLot.creds.length > 1 ? 's cr\u00e9\u00e9s' : ' cr\u00e9\u00e9') + '</div>'
      + '<div style="font-size:var(--pt-txt,13px);color:#E0A46A;background:rgba(184,90,26,.10);border-left:3px solid #B85A1A;border-radius:0 8px 8px 0;padding:9px 12px;margin:10px 0 14px;line-height:1.55">'
      + 'Ces mots de passe ne sont enregistr\u00e9s <b>nulle part</b>. Cet \u00e9cran ferm\u00e9, ils n\u2019existent plus. '
      + 'Chacun devra le remplacer \u00e0 sa premi\u00e8re connexion.</div>'
      + '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:10px;overflow:hidden">';
    _agtLot.creds.forEach(function (c) {
      h += '<div style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.05)">'
        + '<div style="font-size:13.5px;font-weight:600;color:#fff">' + E(c.nom) + '</div>'
        + '<div style="font-family:ui-monospace,Menlo,monospace;font-size:var(--pt-txt,13px);color:rgba(255,255,255,0.55);margin-top:2px;word-break:break-all;user-select:all">' + E(c.mail) + '</div>'
        + '<div style="font-family:ui-monospace,Menlo,monospace;font-size:15px;color:#C9A84C;margin-top:3px;user-select:all">' + E(c.pwd) + '</div>'
        + '</div>';
    });
    h += '</div>'
      + '<div style="display:flex;gap:8px;margin-top:12px">'
      + '<button onclick="agtLotCopy()" style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:rgba(255,255,255,0.7);font-size:var(--pt-txt,13px);padding:11px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">Copier</button>'
      + '<button onclick="agtLotPrint()" style="flex:1;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.35);border-radius:10px;color:#C9A84C;font-size:var(--pt-txt,13px);padding:11px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">Imprimer</button>'
      + '</div>';
  }
  if (_agtLot.err.length) {
    h += '<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin:18px 0 8px">'
      + _agtLot.err.length + ' \u00e9chec' + (_agtLot.err.length > 1 ? 's' : '') + '</div>';
    _agtLot.err.forEach(function (e) {
      h += '<div style="font-size:var(--pt-txt,13px);color:#E0A46A;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05)">'
        + E(e.nom) + ' \u2014 ' + E(e.msg) + '</div>';
    });
  }
  h += '<button onclick="agtRefreshMembres(\'' + _agtLot.slug + '\')" style="width:100%;margin-top:16px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.35);border-radius:12px;color:#C4B5FD;font-size:var(--pt-txt,13px);font-weight:600;padding:12px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">Revenir \u00e0 l\u2019\u00e9quipe</button>';
  h += '</div>';
  return h;
}

function _agtLotTexte() {
  return _agtLot.creds.map(function (c) { return c.nom + '\t' + c.mail + '\t' + c.pwd; }).join('\n');
}
function agtLotCopy() {
  var v = _agtLotTexte();
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(v).then(function () { showToast('Identifiants copi\u00e9s', '#3D6B27'); },
        function () { _fallbackCopyGT(v); });
    } else { _fallbackCopyGT(v); }
  } catch (e) { _fallbackCopyGT(v); }
}
// Document imprimable. ⚠️ '<scr'+'ipt>' : ecrire la balise en clair fermerait le
// script de la page hote.
function agtLotPrint() {
  var E = window._escHtml || function (x) { return String(x == null ? '' : x); };
  var lignes = _agtLot.creds.map(function (c) {
    return '<tr><td>' + E(c.nom) + '</td><td class="m">' + E(c.mail) + '</td><td class="m p">' + E(c.pwd) + '</td></tr>';
  }).join('');
  var html = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Identifiants \u2014 '
    + E(_agtLot.slug) + '</title><link rel="stylesheet" href="/fonts/fonts.css">'
    + '<style>@page{size:A4 portrait;margin:16mm 14mm}'
    + 'body{margin:0;background:#fff;color:#14110D;font-family:var(--font-ui,Outfit,system-ui,sans-serif);font-size:var(--pt-micro,12px)}'
    + 'h1{font-family:var(--font-titre,Cormorant Garamond,Georgia,serif);font-size:26px;margin:0 0 2px;font-weight:600}'
    + '.s{color:#6E6456;font-size:var(--pt-micro,12px);margin-bottom:16px}'
    + 'table{width:100%;border-collapse:collapse}'
    + 'th{text-align:left;font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:#6E6456;border-bottom:1px solid #C9A84C;padding:0 0 5px}'
    + 'td{padding:7px 8px 7px 0;border-bottom:1px solid #EDE7DA;vertical-align:top}'
    + '.m{font-family:ui-monospace,Menlo,monospace;font-size:var(--pt-lbl,12px)}'
    + '.p{color:#7A4F2E;font-size:var(--pt-txt,13px)}'
    + '.w{margin-top:16px;border-left:3px solid #B85A1A;background:#FBF3EC;padding:9px 12px;font-size:var(--pt-lbl,12px);line-height:1.55}'
    + 'tr{page-break-inside:avoid}</style></head><body>'
    + '<h1>Identifiants de connexion</h1><div class="s">' + E(_agtLot.slug) + ' \u00b7 remis le '
    + new Date().toLocaleDateString('fr-FR') + '</div>'
    + '<table><thead><tr><th>Membre</th><th>Adresse</th><th>Mot de passe</th></tr></thead><tbody>'
    + lignes + '</tbody></table>'
    + '<div class="w">Chaque personne remplace son mot de passe \u00e0 sa premi\u00e8re connexion. '
    + 'Ce document ne doit pas \u00eatre conserv\u00e9 : d\u00e9truisez-le une fois les acc\u00e8s remis.</div>'
    + '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print();},500);};</scr' + 'ipt>'
    + '</body></html>';
  try {
    var blob = new Blob([html], { type: 'text/html' });
    var w = window.open(URL.createObjectURL(blob), '_blank');
    if (!w) showToast('Autorisez les fen\u00eatres pour imprimer', '#B85A1A');
  } catch (e) {
    showToast('Impression indisponible', '#B85A1A');
    if (window.logError) window.logError({ level: 'info', cat: 'agt-lot', msg: 'impression identifiants' });
  }
}

// ─── Overlay générique GT ────────────────────────────────────────────────────
function _agtOverlay(slug, icon, titre, bodyHtml, footerHtml) {
  var existing = document.getElementById('agt-panel-overlay');
  if(existing) existing.remove();
  var ov = document.createElement('div');
  ov.id = 'agt-panel-overlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(10,8,18,0.96);z-index:9999;display:flex;flex-direction:column;font-family:var(--font-ui,Outfit,sans-serif);';
  ov.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px;border-bottom:1px solid rgba(139,92,246,0.15)">'
    +'<div style="display:flex;align-items:center;gap:10px">'
    +'<div style="width:32px;height:32px;border-radius:10px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);display:flex;align-items:center;justify-content:center;font-size:15px">'+icon+'</div>'
    +'<div><div style="font-size:15px;font-weight:600;color:#fff">'+titre+'</div>'
    +'<div style="font-size:var(--pt-micro,11px);color:rgba(196,181,253,0.5);margin-top:1px">'+_escHtml(slug)+'</div></div>'
    +'</div>'
    +'<button onclick="document.getElementById(\'agt-panel-overlay\').remove()" style="min-width:44px;min-height:44px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center">\u2715</button>'
    +'</div>'
    +'<div id="agt-panel-body" style="flex:1;overflow-y:auto;padding:16px 20px">'+bodyHtml+'</div>'
    +(footerHtml ? '<div style="padding:14px 20px;border-top:1px solid rgba(139,92,246,0.12)">'+footerHtml+'</div>' : '');
  document.body.appendChild(ov);
}

// ─── Config ──────────────────────────────────────────────────────────────────
async function agtShowParcelles(slug) {
  var existing = document.getElementById('agt-prc-overlay');
  if(existing) existing.remove();
  var ov = document.createElement('div');
  ov.id = 'agt-prc-overlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(10,8,18,0.96);z-index:9999;display:flex;flex-direction:column;font-family:var(--font-ui,Outfit,sans-serif);';
  ov.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px;border-bottom:1px solid rgba(139,92,246,0.15)">'
    + '<div style="display:flex;align-items:center;gap:10px">'
    + '<div style="width:32px;height:32px;border-radius:10px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);display:flex;align-items:center;justify-content:center;font-size:15px"></div>'
    + '<div><div style="font-size:15px;font-weight:600;color:#fff">Parcelles</div>'
    + '<div style="font-size:var(--pt-micro,11px);color:rgba(196,181,253,0.5);margin-top:1px">'+_escHtml(slug)+'</div></div>'
    + '</div>'
    + '<button onclick="document.getElementById(\'agt-prc-overlay\').remove()" style="min-width:44px;min-height:44px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>'
    + '</div>'
    + '<div id="agt-prc-body" style="flex:1;overflow-y:auto;padding:16px 20px">'
    + '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);font-size:var(--pt-txt,13px)">Chargement…</div>'
    + '</div>'
    + '<div id="agt-prc-foot" style="padding:14px 20px;border-top:1px solid rgba(139,92,246,0.12);display:none;gap:8px">'
    + '<button id="agt-prc-copy" style="flex:1;background:#7C4DD6;border:none;border-radius:12px;color:#fff;font-size:var(--pt-txt,13px);font-weight:600;padding:12px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">Copier les noms</button>'
    + '<button id="agt-prc-json" style="flex:1;background:transparent;border:1px solid rgba(139,92,246,0.4);border-radius:12px;color:#C4B5FD;font-size:var(--pt-txt,13px);font-weight:600;padding:12px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">Export JSON</button>'
    + '</div>';
  document.body.appendChild(ov);
  var prc = window.fbAdminRead ? await window.fbAdminRead(slug, 'parcelles') : null;
  var body = document.getElementById('agt-prc-body');
  if(!body) return;
  if(!Array.isArray(prc) || prc.length === 0) {
    body.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);font-size:var(--pt-txt,13px)">Aucune parcelle en base<br><span style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.2)">(parcellaire pas encore importé)</span></div>';
    return;
  }
  var actives = prc.filter(function(p){ return p && p.statut!=='Arrachee'; });
  var arrach  = prc.filter(function(p){ return p && p.statut==='Arrachee'; });
  function _num(x){ var v=parseFloat(x); return isFinite(v)?v:null; }
  function _ha(x){ var v=_num(x); return v===null?'':((v<1?v.toFixed(3):v.toFixed(2))+' ha'); }
  function _prcRow(p, dim){
    var s=_ha(p.surface);
    return '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)'+(dim?';opacity:.45':'')+'">'
      +'<span style="font-size:var(--pt-txt,13px);color:#fff;font-family:monospace'+(dim?';text-decoration:line-through':'')+'">'+_escHtml(p.nom||'—')+'</span>'
      +(dim?'<span style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.3)">arrachée</span>':'<span style="font-size:var(--pt-micro,12px);color:rgba(196,181,253,0.6)">'+s+'</span>')
      +'</div>';
  }
  var h = '<div style="font-size:var(--pt-micro,11px);color:rgba(196,181,253,0.4);letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin-bottom:10px">'+actives.length+' active'+(actives.length>1?'s':'')+(arrach.length?' · '+arrach.length+' arrachée'+(arrach.length>1?'s':''):'')+'</div>';
  h += actives.map(function(p){return _prcRow(p,false);}).join('');
  if(arrach.length) h += arrach.map(function(p){return _prcRow(p,true);}).join('');
  body.innerHTML = h;
  var noms = actives.map(function(p){ return p.nom||''; }).filter(Boolean);
  var jsonParc = actives.map(function(p){ var o={nom:p.nom||''}; var sv=_num(p.surface); if(sv!==null) o.surface=sv; return o; });
  var foot = document.getElementById('agt-prc-foot');
  if(foot){ foot.style.display='flex';
    var cbtn=document.getElementById('agt-prc-copy'); if(cbtn) cbtn.onclick=function(){ agtCopyParcNoms(noms, this); };
    var jbtn=document.getElementById('agt-prc-json'); if(jbtn) jbtn.onclick=function(){ agtExportParcJson(slug, jsonParc); };
  }
}
function agtCopyParcNoms(noms, btn){
  var txt=(noms||[]).join('\n');
  function _ok(){ if(btn){ var o=btn.innerHTML; btn.innerHTML='Copié'; setTimeout(function(){ btn.innerHTML=o; },1200); } }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(_ok, function(){ if(window.showToast) showToast(txt,'#1A4A7A'); });
  } else {
    try{ var ta=document.createElement('textarea'); ta.value=txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); _ok(); }
    catch(e){ if(window.showToast) showToast('Copie impossible','#C0392B'); }
  }
}
function agtExportParcJson(slug, jsonParc){
  var payload={ parcelles:{ value: jsonParc||[] } };
  var blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a'); a.href=url; a.download=slug+'-parcelles.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); },1500);
  if(window.showToast) showToast((jsonParc?jsonParc.length:0)+' parcelle(s) exportée(s)','#3D6B27');
}

// ─── Journal ─────────────────────────────────────────────────────────────────
async function agtShowJournal(slug) {
  _agtOverlay(slug, _mvIcon('liste',20), 'Journal', '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);font-size:var(--pt-txt,13px)">Chargement\u2026</div>', null);
  var journal = await window.fbAdminRead(slug, 'journal') || [];
  var body = document.getElementById('agt-panel-body');
  if(!body) return;
  if(!Array.isArray(journal) || journal.length === 0) {
    body.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);font-size:var(--pt-txt,13px)">Aucune entr\u00e9e de journal</div>';
    return;
  }
  var sorted = journal.slice().sort(function(a,b){ return (b.date||'').localeCompare(a.date||''); });
  var h = '<div style="font-size:var(--pt-micro,11px);color:rgba(196,181,253,0.4);letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin-bottom:12px">'+sorted.length+' entr\u00e9e'+(sorted.length>1?'s':'')+' \u2014 20 derni\u00e8res affich\u00e9es</div>';
  sorted.slice(0,20).forEach(function(e){
    var parcelles = Array.isArray(e.parcelles) ? e.parcelles.join(', ') : (e.parcelle||'');
    var qui = Array.isArray(e.qui) ? e.qui.join(', ') : (e.qui||'');
    h += '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'
      +'<span style="font-size:var(--pt-micro,12px);font-weight:600;color:#C4B5FD">'+_escHtml(e.date||'\u2014')+'</span>'
      +'<span style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:6px">'+_escHtml(e.tache||'\u2014')+'</span>'
      +'</div>'
      +(parcelles ? '<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.45);margin-bottom:2px">\uD83C\uDF31 '+_escHtml(parcelles)+'</div>' : '')
      +(qui       ? '<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35)">\uD83D\uDC64 '+_escHtml(qui)+'</div>' : '')
      +(e.note    ? '<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.25);margin-top:3px;font-style:italic">'+_escHtml(e.note)+'</div>' : '')
      +'</div>';
  });
  body.innerHTML = h;
}

// ─── Erreurs ─────────────────────────────────────────────────────────────────
async function agtShowErreurs(slug) {
  _agtOverlay(slug, _mvIcon('bogue',20), 'Erreurs', '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);font-size:var(--pt-txt,13px)">Chargement\u2026</div>', null);
  // 'erreurs' n'a jamais ete ecrit par personne : la collection reelle est error_log,
  // celle que lit deja le tableau de bord (_agtTenants[].errors).
  // ★ GTFIX-4 (§513) — le journal du domaine lu au serveur (une lecture ratée se DIT), fusionné avec celui de ce
  //   poste UNE fois par erreur — elles s'affichaient en double —, l'âge en jours au-delà de 24 h (GT-B24).
  var errLog=[], lectureKo=false;
  try { var _rl=await window.fbAdminLire(slug, 'error_log'); errLog=(_rl.existe&&Array.isArray(_rl.valeur))?_rl.valeur:[]; }
  catch(_e){ lectureKo=true; }
  var body = document.getElementById('agt-panel-body');
  if(!body) return;
  var _loc=[];
  try { var raw = localStorage.getItem(_ERR_KEY); if(raw) _loc = JSON.parse(raw).filter(function(e){ return e.tenant===slug; }); } catch(ex){ console.warn('[agtShowErreurs] local', ex); }
  errLog = _agtErrFusion(_loc, errLog);
  if(lectureKo) body.innerHTML = '<div role="alert" style="font-size:var(--pt-txt,13px);color:#FCA5A5;background:rgba(239,68,68,0.10);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:10px 12px;margin-bottom:10px">Lecture impossible : le journal du domaine n\u2019a pas pu \u00eatre lu. Seules les erreurs de ce poste sont affich\u00e9es.</div>';
  if(lectureKo && !errLog.length) return;
  if(!errLog.length) {
    body.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);font-size:var(--pt-txt,13px)">Aucune erreur enregistr\u00e9e</div>';
    return;
  }
  var sorted = errLog.slice().sort(function(a,b){ return (b.ts||'').localeCompare(a.ts||''); });
  var LVL_COLOR = { critical:'#EF4444', error:'#F97316', warning:'#EAB308', info:'#4A9FC8' };
    /* ⚠ `LVL_ICON` a ete RETIREE, pas migree. La gravite est deja portee par
     `border-left:3px solid LVL_COLOR[e.level]` sur la meme carte : le glyphe
     la disait une seconde fois. Une pastille de couleur l'aurait dite une
     TROISIEME. Meme raisonnement que le bandeau de confirmation (§45b). */
  var h = '<div style="font-size:var(--pt-micro,11px);color:rgba(196,181,253,0.4);letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin-bottom:12px">'+sorted.length+' erreur'+(sorted.length>1?'s':'')+'</div>';
  sorted.slice(0,30).forEach(function(e){
    var lc = LVL_COLOR[e.level]||'#F97316';
    
    var when = e.ts ? _agtRelTime(e.ts) : '';   // ★ GTFIX-4 : « il y a 312 h » → « il y a 13 j »
    h += '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-left:3px solid '+lc+';border-radius:10px;padding:10px 12px;margin-bottom:8px">'
      +'<div style="display:flex;align-items:flex-start;gap:8px">'
      
      +'<div style="flex:1;min-width:0">'
      +'<div style="font-size:var(--pt-micro,12px);font-weight:600;color:#E8E8E0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+_escHtml(e.msg||'Erreur inconnue')+'</div>'
      +'<div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">'
      +(e.page ? '<span style="font-size:10px;color:rgba(255,255,255,0.35)">'+_mvIcon('document',16)+' '+_escHtml(e.page)+'</span>' : '')
      +(e.user ? '<span style="font-size:10px;color:rgba(255,255,255,0.35)">\uD83D\uDC64 '+_escHtml(e.user)+'</span>' : '')
      +(when   ? '<span style="font-size:10px;color:rgba(255,255,255,0.25)">'+_mvIcon('chrono',16)+' '+when+'</span>' : '')
      +'</div>'
      +(e.detail ? '<details style="margin-top:5px"><summary style="font-size:10px;color:rgba(255,255,255,0.3);cursor:pointer">D\u00e9tail</summary><pre style="font-size:10px;color:rgba(255,255,255,0.4);background:rgba(0,0,0,0.3);border-radius:6px;padding:8px;margin-top:4px;overflow-x:auto;white-space:pre-wrap;word-break:break-all">'+_escHtml(e.detail)+'</pre></details>' : '')
      +'</div></div></div>';
  });
  body.innerHTML = (lectureKo ? body.innerHTML : '') + h;
}
function _agtErrFusion(locales, domaine){
  var vus={}, out=[];
  (locales||[]).concat(domaine||[]).forEach(function(e){
    if(!e) return;
    var cle=e.id || (String(e.ts||'')+'|'+String(e.msg||''));
    if(vus[cle]) return;
    vus[cle]=1; out.push(e);
  });
  return out;
}


// ════ ONGLET ESSAIS — codes d'accès 30 jours ════

function _genDemoCode(){
  var c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var p1='',p2='';
  for(var i=0;i<2;i++) p1+=c[Math.floor(Math.random()*c.length)];
  for(var j=0;j<4;j++) p2+=c[Math.floor(Math.random()*c.length)];
  return 'ESSAI-'+p1+'-'+p2;
}

function _agtVisiteCard(){
  var s=_agtDemoStats||{};
  var cnx=s.connexions||0, uniq=s.uniques||0;
  var lastTxt='\u2014';
  if(s.last){ try{ var _ld=s.last.toDate?s.last.toDate():new Date(s.last.seconds?s.last.seconds*1000:s.last); lastTxt=_ld.toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})+' '+_ld.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}); }catch(e){ if(window._mvAvale) window._mvAvale(e,'admin-gt.js/_agtVisiteCard'); } }
  var jours=s.jours||{}, maxv=1, days=[], JJ=['D','L','M','M','J','V','S'];
  for(var i=6;i>=0;i--){ var dt=new Date(); dt.setDate(dt.getDate()-i); var k=_mvISO(dt); var v=jours[k]||0; days.push({v:v,lbl:JJ[dt.getDay()]}); if(v>maxv)maxv=v; }
  var bars='';
  days.forEach(function(d){ var hp=Math.max(3,Math.round((d.v/maxv)*100)); bars+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="width:100%;height:40px;display:flex;align-items:flex-end"><div style="width:100%;background:linear-gradient(to top,#C9A84C,#E8C860);border-radius:3px 3px 0 0;height:'+hp+'%;opacity:'+(d.v?1:0.22)+'"></div></div><div style="font-size:9px;color:rgba(255,255,255,0.3)">'+d.lbl+'</div><div style="font-size:9px;color:rgba(255,255,255,0.5);font-weight:600">'+d.v+'</div></div>'; });
  var h='<div class="agt-card" style="border-color:rgba(201,168,76,0.25);margin-bottom:16px"><div style="padding:14px 16px">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><span style="font-size:var(--pt-sm,16px)">\uD83C\uDF47</span><span style="font-size:var(--pt-txt,13px);font-weight:700;color:#E8C860">D\u00e9mo visite guid\u00e9e</span><span style="font-size:10px;color:rgba(255,255,255,0.28);margin-left:auto">?demo=visite</span></div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">';
  h+='<div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:12px;text-align:center"><div style="font-size:var(--pt-lg,24px);font-weight:600;color:#F0E8DC">'+cnx+'</div><div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.4);margin-top:3px">connexions</div></div>';
  h+='<div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:12px;text-align:center"><div style="font-size:var(--pt-lg,24px);font-weight:600;color:#C4B5FD">'+uniq+'</div><div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.4);margin-top:3px">visiteurs uniques</div></div>';
  h+='</div>';
  h+='<div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:7px">7 derniers jours \u00b7 derni\u00e8re visite : '+lastTxt+'</div>';
  h+='<div style="display:flex;align-items:flex-end;gap:5px;height:62px">'+bars+'</div>';
  h+='</div></div>';
  return h;
}

function _agtBuildReports(){
  var merged=[];
  _agtTenants.forEach(function(t){
    (t.reports||[]).forEach(function(r){
      merged.push(Object.assign({},r,{_tenantNom:t.nom||t.slug,_tenantSlug:t.slug}));
    });
  });
  (_agtReportsGT||[]).forEach(function(r){
    merged.push(Object.assign({},r,{_tenantNom:'Avant connexion',_tenantSlug:''}));
  });
  merged.sort(function(a,b){return new Date(b.ts)-new Date(a.ts);});
  var total=merged.length;
  var open=merged.filter(function(r){return !r.resolved;}).length;
  var pre=merged.filter(function(r){return r.prelogin;}).length;

  var h='';
  h+='<div style="display:flex;gap:8px;margin-bottom:14px">';
  h+='<div style="flex:1;background:rgba(255,255,255,0.05);border-radius:12px;padding:10px 8px;text-align:center"><div style="font-size:22px;font-weight:700;color:#fff">'+total+'</div><div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:4px">Total</div></div>';
  h+='<div style="flex:1;background:rgba(249,115,22,0.07);border-radius:12px;padding:10px 8px;text-align:center;border:1px solid '+(open>0?'rgba(249,115,22,0.2)':'transparent')+'"><div style="font-size:22px;font-weight:700;color:#F97316">'+open+'</div><div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:4px">Ouverts</div></div>';
  h+='<div style="flex:1;background:rgba(255,255,255,0.05);border-radius:12px;padding:10px 8px;text-align:center"><div style="font-size:22px;font-weight:700;color:#C4B5FD">'+pre+'</div><div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:4px">Avant login</div></div>';
  h+='</div>';
  h+='<div class="agt-infobox">Signalements envoyés par les membres depuis les Réglages ou la page de connexion. Le contexte technique (page, appareil, dernières erreurs) est joint automatiquement.</div>';

  if(!merged.length){
    h+='<div style="text-align:center;padding:32px;color:rgba(255,255,255,0.2);font-size:var(--pt-txt,13px)">Aucun signalement pour le moment</div>';
    return h;
  }
  merged.slice(0,40).forEach(function(r){
    var accent=r.resolved?'rgba(255,255,255,0.08)':'#B5621A';
    var tenantTag=r._tenantSlug
      ? '<span style="font-size:10px;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.2);border-radius:5px;padding:1px 6px;color:rgba(196,181,253,0.7);font-weight:600">'+_escHtml(r._tenantNom||'?')+'</span>'
      : '<span style="font-size:10px;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.28);border-radius:5px;padding:1px 6px;color:#E6D08A;font-weight:600">Avant connexion</span>';
    var roles=(Array.isArray(r.roles)&&r.roles.length)?(' · '+_escHtml(r.roles.join(', '))):'';
    var recent=(Array.isArray(r.recentErrors)&&r.recentErrors.length)
      ? r.recentErrors.map(function(e){return '['+_escHtml(e.level||'?')+'] '+_escHtml(e.msg||'')+' — '+_escHtml(e.page||'');}).join('<br>')
      : 'aucune';
    h+='<div style="background:'+(r.resolved?'rgba(255,255,255,0.025)':'rgba(255,255,255,0.04)')+';border:1px solid rgba(255,255,255,0.07);border-left:3px solid '+accent+';border-radius:10px;padding:11px 13px;margin-bottom:9px;opacity:'+(r.resolved?'0.55':'1')+'">';
    h+='<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">';
    h+='<div style="flex:1;min-width:0">';
    h+='<div style="color:#E8E8E0;font-size:var(--pt-txt,13px);font-weight:500;line-height:1.5">« '+_escHtml(r.desc||'')+' »</div>';
    h+='<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;align-items:center">';
    h+=tenantTag;
    h+='<span style="font-size:10px;color:rgba(255,255,255,0.32)">'+_escHtml(r.user||'—')+roles+'</span>';
    h+='<span style="font-size:10px;color:rgba(255,255,255,0.32)">'+_escHtml(r.page||'—')+'</span>';
    h+='<span style="font-size:10px;color:rgba(255,255,255,0.28)">'+_escHtml(_agtRelTime(r.ts))+'</span>';
    h+='</div>';
    h+='<details style="margin-top:9px"><summary style="font-size:10px;color:rgba(196,181,253,0.6);cursor:pointer;list-style:none">Contexte technique ›</summary>';
    h+='<div style="font-size:10px;color:rgba(255,255,255,0.4);line-height:1.7;margin-top:6px;padding:8px 10px;background:rgba(0,0,0,0.2);border-radius:8px">';
    h+=_escHtml(r.ua||'—')+'<br>';
    h+='Version app : '+_escHtml(r.appVersion||'—')+'<br>';
    h+='Reçu : '+_escHtml((r.ts||'').replace('T',' ').slice(0,19))+'<br>';
    h+='Dernières erreurs locales :<br>'+recent;
    h+='</div></details>';
    h+='</div>';
    if(!r.resolved){
      h+='<button class="agt-btn sm" style="flex-shrink:0" onclick="agtResolveReport(&#39;'+r.id+'&#39;,&#39;'+(r._tenantSlug||'')+'&#39;)">Résolu</button>';
    } else {
      h+='<span style="flex-shrink:0;font-size:10px;color:rgba(107,163,74,0.7);font-weight:600;white-space:nowrap">résolu</span>';
    }
    h+='</div></div>';
  });
  return h;
}

function _agtBuildEssais(){
  var now=Date.now();
  var actifs =_agtEssais.filter(function(t){return t.actif&&new Date(t.expires_at).getTime()>now;});
  var expires=_agtEssais.filter(function(t){return !t.actif||new Date(t.expires_at).getTime()<=now;});

  var h='<div style="margin:0 0 14px;font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);letter-spacing:.08em;text-transform:uppercase;font-weight:500">Codes d\'acc\u00e8s essai 30 jours</div>';

  // Stats
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">';
  h+='<div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:600;color:#C4B5FD">'+actifs.length+'</div><div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);margin-top:3px">actifs</div></div>';
  h+='<div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:600;color:#E8C860">'+_agtEssais.filter(function(t){return t.actif&&(new Date(t.expires_at).getTime()-now)<5*86400*1000&&new Date(t.expires_at).getTime()>now;}).length+'</div><div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);margin-top:3px">expirent dans 5j</div></div>';
  h+='<div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:600;color:rgba(255,255,255,0.3)">'+expires.length+'</div><div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);margin-top:3px">expir\u00e9s</div></div>';
  h+='</div>';

  // Formulaire cr\u00e9ation
  h+='<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px;margin-bottom:16px">';
  h+='<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.45);font-weight:600;letter-spacing:.06em;margin-bottom:10px">+ G\u00e9n\u00e9rer un code d\'acc\u00e8s</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">';
  h+='<div><div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.4);margin-bottom:4px">Nom prospect</div><input id="agt-essai-prospect" placeholder="ex: Dupont \u2014 Dom. Chablis" style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px 10px;color:#F0E8DC;font-size:var(--pt-micro,12px);font-family:var(--font-ui,Outfit,sans-serif);box-sizing:border-box"></div>';
  h+='<div><div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.4);margin-bottom:4px">T\u00e9l\u00e9phone</div><input id="agt-essai-tel" placeholder="06 XX XX XX XX" style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px 10px;color:#F0E8DC;font-size:var(--pt-micro,12px);font-family:var(--font-ui,Outfit,sans-serif);box-sizing:border-box"></div>';
  h+='</div>';
  h+='<button onclick="agtCreateEssai()" style="background:#C9A84C;border:none;border-radius:10px;padding:9px 18px;color:#0C1A0A;font-size:var(--pt-micro,12px);font-weight:700;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">G\u00e9n\u00e9rer le code</button>';
  h+='</div>';

  // Liste essais actifs
  if(actifs.length>0){
    h+='<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);letter-spacing:.06em;margin-bottom:8px">Essais actifs</div>';
    actifs.forEach(function(t){
      var exp=new Date(t.expires_at);
      var jRest=Math.max(0,Math.ceil((exp.getTime()-now)/86400000));
      var jColor=jRest<=5?'#E8C860':jRest<=15?'#C4B5FD':'#86EFAC';
      h+='<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px;margin-bottom:8px">';
      h+='<div style="display:flex;align-items:flex-start;gap:10px">';
      h+='<div style="flex:1;min-width:0">';
      h+='<div style="font-size:var(--pt-txt,13px);font-weight:600;color:#E8E8E0;margin-bottom:4px">'+_escHtml(t.prospect||'(sans nom)')+'</div>';
      h+='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px">';
      h+='<span style="font-family:monospace;font-size:var(--pt-txt,13px);background:rgba(255,255,255,0.08);padding:2px 8px;border-radius:6px;color:#E8C860">'+_escHtml(t.code)+'</span>';
      h+='<span style="font-size:var(--pt-micro,11px);font-weight:600;color:'+jColor+'">J+'+jRest+' restant'+(jRest>1?'s':'')+'</span>';
      h+='</div>';
      var _ec=_agtEntreesCode(t.code, _agtAccessLog);   // ★ GTFIX-4 : l'usage se lit au journal, où le serveur le note (GT-B15)
      h+='<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.3)">'+(t.telephone?'&#128222; '+_escHtml(t.telephone)+' &middot; ':'')+' '+_ec.n+' entr\u00e9e'+(_ec.n>1?'s':'')+' au journal'+(_ec.der?' &middot; derni\u00e8re : '+_agtRelTime(_ec.der):'')+'</div>';
      h+='</div>';
      h+='<div style="display:flex;gap:6px;flex-shrink:0">';
      h+='<button onclick="agtCopyEssaiCode(\''+_escAttr(t.code)+'\')" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:6px 10px;color:rgba(255,255,255,0.6);font-size:var(--pt-micro,12px);cursor:pointer" title="Copier le code">&#128203;</button>';
      h+='<button onclick="agtRevokeEssai(\''+_escAttr(t.id)+'\')" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:6px 10px;color:#FCA5A5;font-size:var(--pt-micro,12px);cursor:pointer" title="R\u00e9voquer">&#128465;</button>';
      h+='</div>';
      h+='</div></div>';
    });
  }

  // Liste essais expir\u00e9s
  if(expires.length>0){
    h+='<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.2);letter-spacing:.06em;margin:12px 0 8px">Expir\u00e9s</div>';
    expires.forEach(function(t){
      h+='<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:10px 12px;margin-bottom:6px;opacity:.55;display:flex;align-items:center;gap:10px">';
      h+='<span style="font-family:monospace;font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.3)">'+_escHtml(t.code)+'</span>';
      h+='<span style="flex:1;font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.3)">'+_escHtml(t.prospect||'')+'</span>';
      h+='<span style="font-size:var(--pt-micro,11px);color:rgba(239,68,68,0.6)">expir\u00e9</span>';
      h+='<button onclick="agtRevokeEssai(\''+_escAttr(t.id)+'\')" style="background:none;border:none;color:rgba(255,255,255,0.2);font-size:var(--pt-micro,12px);cursor:pointer">&#128465;</button>';
      h+='</div>';
    });
  }

  if(_agtEssais.length===0){
    h+='<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.2);font-size:var(--pt-txt,13px)">Aucun essai cr\u00e9\u00e9 pour l\'instant</div>';
  }
  return h;
}

async function agtCreateEssai(){
  var prospect = (document.getElementById('agt-essai-prospect')||{}).value||'';
  var tel = (document.getElementById('agt-essai-tel')||{}).value||'';
  if(!prospect.trim()){showToast('Saisissez un nom de prospect','#E07B2A');return;}
  var code = _genDemoCode();
  // V\u00e9rifier unicit\u00e9 (r\u00e9g\u00e9n\u00e9rer si collision)
  while(_agtEssais.some(function(t){return t.code===code;})) code=_genDemoCode();
  var now = new Date();
  var exp = new Date(now.getTime()+30*24*3600*1000);
  var entry = {
    id: 'essai_'+Date.now(),
    code: code,
    prospect: prospect.trim(),
    telephone: tel.trim(),
    created_at: now.toISOString(),
    expires_at: exp.toISOString(),
    actif: true,
    usage_count: 0,
    last_access: null
  };
  try {
    // ★ GTFIX-1 (§510) : ajouté à la liste RELUE (transaction), plus à la copie du panneau.
    if(!window.fbGtMaj) throw new Error('fbGtMaj indisponible');
    var _rc=await window.fbGtMaj('demo_tokens',function(d,existe){ return _agtMutCodes(d,existe,function(v){ v.push(entry); return v; }); });
    _agtEssais=_rc.valeur.value;
    // Copier le code dans le presse-papier
    if(navigator.clipboard) navigator.clipboard.writeText(code).catch(function(_e){ if(window._mvAvale) window._mvAvale(_e,'admin-gt.js/agtCreateEssai'); });
    showToast('Code g\u00e9n\u00e9r\u00e9 et copi\u00e9 : '+code,'#3D6B27');
    agtRenderBody();
  } catch(e) {
    _agtEchecEcriture(e,'Code non cr\u00e9\u00e9');
  }
}
// Document absent = liste neuve ; forme inconnue = erreur (on n'écrase rien).
function _agtMutCodes(d, existe, f){
  var v;
  if (!existe) v = [];
  else if (d && Array.isArray(d.value)) v = d.value;
  else throw new Error('liste des codes illisible');
  return { value: f(v) };
}

// confirm() natif retire : bloquant en PWA iOS (l'action echouait sans aucun retour).
function agtRevokeEssai(id){
  if(window.openConfirmDel){
    window.openConfirmDel(
      'Supprimer ce code ?',
      'Le code d\'acc\u00e8s ne fonctionnera plus.',
      function(){ _agtDoRevokeEssai(id); },
      '\u{1F5D1}\u{FE0F}', 'Supprimer le code', '#C0392B'
    );
    return;
  }
  _agtDoRevokeEssai(id);
}
async function _agtDoRevokeEssai(id){
  try {
    if(!window.fbGtMaj) throw new Error('fbGtMaj indisponible');
    var _rc=await window.fbGtMaj('demo_tokens',function(d,existe){ return _agtMutCodes(d,existe,function(v){ return v.filter(function(t){ return t && t.id!==id; }); }); });
    _agtEssais=_rc.valeur.value;
    showToast('Code supprim\u00e9','#B85A1A');
    agtRenderBody();
  } catch(e) {
    _agtEchecEcriture(e,'Code non supprim\u00e9');
  }
}

function agtCopyEssaiCode(code){
  if(navigator.clipboard) navigator.clipboard.writeText(code).then(function(){showToast('Code copi\u00e9 : '+code,'#3D6B27');}).catch(function(){showToast(code,'#3D6B27');});
  else showToast(code,'#3D6B27');
}

// ★ GTFIX-4 (§513) — L'USAGE D'UN CODE D'ESSAI SE LIT DANS LE JOURNAL D'ACCÈS, où le SERVEUR le note
//   (`appendAccessLog` : « Essai CODE — … »). `agtUpdateEssaiAccess` n'était plus appelé par personne depuis GT-1
//   (l'appli des clients ne charge pas ce fichier) : le compteur restait à 0. Retiré (GT-B15).
function _agtEntreesCode(code, journal){
  var n=0, der='';
  (journal||[]).forEach(function(e){ if(e && e.tenant==='essai:'+code){ n++; if(String(e.ts||'')>der) der=String(e.ts||''); } });
  return { n:n, der:der };
}

// ─── KML Upload ──────────────────────────────────────────────────────────────

function _parseKML(text) {
  try {
    var parser = new DOMParser();
    var dom = parser.parseFromString(text, 'text/xml');
    var placemarks = dom.querySelectorAll('Placemark');
    var result = [];
    placemarks.forEach(function(pm) {
      var nameEl  = pm.querySelector('name');
      var coordEl = pm.querySelector('coordinates');
      if (!nameEl || !coordEl) return;
      var name = nameEl.textContent.trim();
      var coordsText = coordEl.textContent.trim();
      var pts = coordsText.split(/\s+/).filter(Boolean).map(function(c) {
        var parts = c.split(',');
        if (parts.length < 2) return null;
        var lng = parseFloat(parts[0]);
        var lat = parseFloat(parts[1]);
        if (isNaN(lat) || isNaN(lng)) return null;
        return {lat: Math.round(lat * 1e7) / 1e7, lng: Math.round(lng * 1e7) / 1e7};
      }).filter(Boolean);
      if (name && pts.length >= 3) result.push({name: name, pts: pts});
    });
    return result;
  } catch(e) { console.warn('[parseKML]', e); return []; }
}

function agtKmlFileChange(input) {
  var file = input.files && input.files[0];
  // ⚠️ Un fichier neuf = un plan neuf : la case du geste destructif ne doit JAMAIS
  //    survivre au fichier qu'elle a servi à confirmer.
  _agtKmlConfirm = false;
  if (!file) { _agtKmlPolygons = []; _agtKmlFileName = ''; agtRenderBody(); return; }
  _agtKmlFileName = file.name;
  var reader = new FileReader();
  reader.onload = function(e) {
    _agtKmlPolygons = _parseKML(e.target.result);
    if (!_agtKmlPolygons.length) {
      showToast('Aucun polygone trouvé dans ce fichier', '#E07060');
    }
    agtRenderBody();
  };
  reader.readAsText(file, 'utf-8');
}

// ─── Lecture de l'existant ───────────────────────────────────────────────────
// Appelée au choix du domaine. Sans elle, l'écran ne peut RIEN dire de juste sur
// ce qu'une écriture va détruire.
async function agtKmlSlugChange(sel) {
  _agtKmlSlug    = sel ? sel.value : '';
  _agtKmlBase    = null;
  _agtKmlFiches  = null;
  _agtKmlConfirm = false;
  _agtKmlMode    = 'merge';
  if (!_agtKmlSlug) { _agtKmlLu = ''; agtRenderBody(); return; }
  _agtKmlLu = 'load';
  agtRenderBody();
  try {
    if (!window.fbAdminRead) throw new Error('fbAdminRead indisponible');
    var k = await window.fbAdminRead(_agtKmlSlug, 'kml_polygons');
    var p = await window.fbAdminRead(_agtKmlSlug, 'parcelles');
    _agtKmlBase   = Array.isArray(k) ? k : [];
    _agtKmlFiches = Array.isArray(p) ? p : [];
    _agtKmlLu     = 'ok';
  } catch (e) {
    // ⚠️ On ne bascule PAS sur « base vide » : une lecture ratée et une base vide
    //    donnent le même écran mais pas le même risque. Le bouton reste bloqué.
    _agtKmlBase = null; _agtKmlFiches = null; _agtKmlLu = 'err';
  }
  agtRenderBody();
}

function agtKmlMode(m) { _agtKmlMode = m; _agtKmlConfirm = false; agtRenderBody(); }
function agtKmlCreerF(el) { _agtKmlCreerF = !!(el && el.checked); agtRenderBody(); }
function agtKmlConfirmSet(el) { _agtKmlConfirm = !!(el && el.checked); agtRenderBody(); }

// ─── Le plan d'écriture ──────────────────────────────────────────────────────
// Une seule fonction calcule ce qui va se passer ; l'aperçu et l'écriture la
// partagent, pour qu'aucun écart ne puisse s'installer entre ce qui est annoncé
// et ce qui est fait. `base` et `fiches` sont passés en argument : l'aperçu les
// prend de la lecture d'ouverture, l'écriture d'une relecture fraîche.
// Rapprochement par le NOM — c'est déjà la seule clé qui relie un contour à sa
// fiche partout ailleurs (initMap, _pProxPolyOf).
function _agtKmlPlan(base, fiches) {
  base   = Array.isArray(base) ? base : [];
  fiches = Array.isArray(fiches) ? fiches : [];
  var kBase = {}, kNouv = {};
  base.forEach(function (p) { kBase[_agtInsKey(p && p.name)] = true; });
  _agtKmlPolygons.forEach(function (p) { kNouv[_agtInsKey(p && p.name)] = true; });

  var nouveaux = _agtKmlPolygons.filter(function (p) { return !kBase[_agtInsKey(p.name)]; });
  var majs     = _agtKmlPolygons.filter(function (p) { return  kBase[_agtInsKey(p.name)]; });
  var gardes   = base.filter(function (p) { return !kNouv[_agtInsKey(p && p.name)]; });

  var kFiche = {};
  fiches.forEach(function (f) { kFiche[_agtInsKey(f && f.nom)] = true; });
  var fichesAcreer = nouveaux.filter(function (p) { return !kFiche[_agtInsKey(p.name)]; });

  // Le tableau réellement écrit. En fusion : l'existant non touché, puis le fichier.
  var sortie;
  if (_agtKmlMode === 'replace') {
    sortie = _agtKmlPolygons.map(function (p) { return { name: p.name, pts: p.pts }; });
  } else {
    sortie = gardes.map(function (p) { return { name: p.name, pts: p.pts }; })
      .concat(_agtKmlPolygons.map(function (p) { return { name: p.name, pts: p.pts }; }));
  }
  return {
    nouveaux: nouveaux, majs: majs, gardes: gardes,
    perdus: (_agtKmlMode === 'replace') ? gardes : [],
    fichesAcreer: fichesAcreer, sortie: sortie
  };
}

function _agtBuildKml() {
  var h = '<div style="padding:0 0 20px">';
  h += '<div class="agt-section-title" style="margin-bottom:6px">Import KML</div>';
  h += '<p style="font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.4);line-height:1.6;margin:0 0 16px">Charger les contours de parcelles d\'un domaine client depuis son fichier KML Google Earth. Un fichier partiel complète le parcellaire, il ne le remplace pas.</p>';

  // Sélecteur domaine — `selected` sur l'état, sinon agtRenderBody perd le choix
  h += '<div class="fl" style="color:rgba(255,255,255,0.5)">Domaine cible</div>';
  h += '<select id="agt-kml-slug" class="ov-input" style="margin-bottom:14px;background:#1A1428;color:#E8DFF8;border-color:rgba(196,181,253,0.2)" onchange="agtKmlSlugChange(this)">';
  h += '<option value="">— Choisir un domaine —</option>';
  _agtTenants.forEach(function (t) {
    h += '<option value="' + t.slug + '"' + (t.slug === _agtKmlSlug ? ' selected' : '') + '>' + _escHtml(t.nom) + ' (' + t.slug + ')</option>';
  });
  h += '</select>';

  // État de la base pour ce domaine
  if (_agtKmlSlug) h += _agtKmlEtatHtml();

  // Input fichier
  h += '<div class="fl" style="color:rgba(255,255,255,0.5)">Fichier .kml</div>';
  h += '<input id="agt-kml-file" type="file" accept=".kml,.xml" ';
  h += 'style="color:rgba(255,255,255,0.6);font-family:var(--font-ui,Outfit,sans-serif);font-size:var(--pt-txt,13px);';
  h += 'margin-bottom:14px;width:100%;box-sizing:border-box" ';
  h += 'onchange="agtKmlFileChange(this)">';

  if (_agtKmlPolygons.length > 0) h += _agtKmlApercuHtml();

  // État KML par domaine
  h += '<div class="agt-section-title" style="margin-top:22px;margin-bottom:10px">État KML par domaine</div>';
  _agtTenants.forEach(function (t) {
    h += '<div id="agt-kml-row-' + t.slug + '" style="display:flex;align-items:center;';
    h += 'justify-content:space-between;padding:10px 14px;border-radius:8px;';
    h += 'background:rgba(255,255,255,0.04);margin-bottom:6px">';
    h += '<div>';
    h += '<div style="font-size:var(--pt-txt,13px);color:rgba(255,255,255,0.8);font-weight:500">' + _escHtml(t.nom) + '</div>';
    h += '<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.3);font-family:monospace">' + t.slug + '</div>';
    h += '</div>';
    h += '<button style="font-size:var(--pt-micro,11px);background:rgba(74,159,200,0.12);border:1px solid rgba(74,159,200,0.25);';
    h += 'color:#4A9FC8;border-radius:6px;padding:5px 12px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);white-space:nowrap" ';
    h += 'onclick="agtCheckKml(\'' + t.slug + '\',this)">Vérifier</button>';
    h += '</div>';
  });

  h += '</div>';
  return h;
}

// Ce que la base contient AUJOURD'HUI pour le domaine choisi.
function _agtKmlEtatHtml() {
  var h = '';
  if (_agtKmlLu === 'load') {
    return '<div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:11px 13px;margin-bottom:14px;font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.45)">Lecture de la base…</div>';
  }
  if (_agtKmlLu === 'err') {
    return '<div style="background:rgba(224,112,96,0.12);border:1px solid rgba(224,112,96,0.35);border-radius:10px;padding:11px 13px;margin-bottom:14px">'
      + '<div style="font-size:var(--pt-micro,12px);font-weight:700;color:#E07060;margin-bottom:4px">Base illisible</div>'
      + '<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.55);line-height:1.6">Impossible de savoir ce que ce domaine contient déjà. Rien ne sera écrit tant que la lecture n\'aura pas abouti — rechoisissez le domaine pour réessayer.</div></div>';
  }
  if (_agtKmlLu !== 'ok') return '';

  var nb = (_agtKmlBase || []).length, nf = (_agtKmlFiches || []).length;

  // ⚠️ Le jeu de contours en dur (KML_DATA, app.js) n'existe QUE pour le domaine de
  //    reference (slug marchand-grillot, teste ligne suivante),
  //    et _pProxKmlSrc() cesse de le lire dès que kml_polygons est non vide. Écrire ici
  //    un fichier partiel ferait donc disparaître les 46 contours du domaine de prod.
  if (!nb && _agtKmlSlug === 'marchand-grillot') {
    return '<div style="background:rgba(142,47,38,0.18);border:1px solid rgba(224,112,96,0.45);border-radius:10px;padding:12px 14px;margin-bottom:14px">'
      + '<div style="font-size:var(--pt-micro,12px);font-weight:700;color:#E88B7C;margin-bottom:5px">Ce domaine tire ses contours de l\'application</div>'
      + '<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.6);line-height:1.65">Ses 46 contours sont intégrés au code, pas en base. Dès qu\'un contour est écrit ici, ce jeu intégré cesse d\'être lu et <b>seul le contenu du fichier reste visible sur la carte</b>. Pour ajouter une parcelle à ce domaine, chargez un fichier contenant <b>toutes</b> ses parcelles.</div></div>';
  }

  h += '<div style="background:rgba(74,159,200,0.10);border:1px solid rgba(74,159,200,0.26);border-radius:10px;padding:11px 13px;margin-bottom:14px">';
  h += '<div style="font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.7)">';
  h += nb ? ('<b style="color:#6FBEE0">' + nb + '</b> contour' + (nb > 1 ? 's' : '') + ' en base') : 'Aucun contour en base';
  h += ' · <b style="color:#6FBEE0">' + nf + '</b> fiche' + (nf > 1 ? 's' : '') + ' de parcelle';
  h += '</div>';
  if (!nb) h += '<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.4);line-height:1.6;margin-top:4px">Ce fichier sera le premier parcellaire de ce domaine.</div>';
  h += '</div>';
  return h;
}

// L'aperçu : ce que l'écriture va faire, ligne à ligne, avant de la faire.
function _agtKmlApercuHtml() {
  var h = '';
  var lu = (_agtKmlLu === 'ok');
  var p  = _agtKmlPlan(_agtKmlBase, _agtKmlFiches);

  // Le fichier lu
  h += '<div style="background:rgba(61,107,39,0.15);border:1px solid rgba(61,107,39,0.3);';
  h += 'border-radius:10px;padding:12px;margin-bottom:14px">';
  h += '<div style="font-size:var(--pt-micro,12px);font-weight:700;color:#6BA34A;margin-bottom:8px">';
  h += _agtKmlPolygons.length + ' contour' + (_agtKmlPolygons.length > 1 ? 's' : '');
  h += ' — ' + _escHtml(_agtKmlFileName) + '</div>';
  h += '<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.45);line-height:1.8;';
  h += 'max-height:150px;overflow-y:auto;font-family:monospace">';
  _agtKmlPolygons.slice(0, 14).forEach(function (x) {
    h += _escHtml(x.name) + ' · ' + x.pts.length + ' pts · ' + _agtGeoArea(x.pts).toFixed(2) + ' ha<br>';
  });
  if (_agtKmlPolygons.length > 14) h += '… et ' + (_agtKmlPolygons.length - 14) + ' autres';
  h += '</div></div>';

  if (!_agtKmlSlug) {
    h += '<div style="font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.4);padding:4px 0 10px">Choisissez un domaine cible pour voir ce que cette écriture va changer.</div>';
    return h;
  }
  if (!lu) return h;

  // Les deux gestes
  h += '<div class="fl" style="color:rgba(255,255,255,0.5)">Que faire des contours déjà en base ?</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">';
  h += _agtKmlModeBtn('merge', 'Compléter', 'Les contours absents du fichier sont conservés. Un contour de même nom prend la forme du fichier.');
  h += _agtKmlModeBtn('replace', 'Tout remplacer', 'La base ne garde que ce fichier. Tout contour absent du fichier disparaît de la carte.');
  h += '</div>';

  // Le décompte
  h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">';
  if (p.nouveaux.length) h += _agtKmlPill(p.nouveaux.length + ' ajoutée' + (p.nouveaux.length > 1 ? 's' : ''), '#8CC26A', 'rgba(61,107,39,0.16)', 'rgba(107,163,74,0.4)');
  if (p.majs.length)     h += _agtKmlPill(p.majs.length + ' mise' + (p.majs.length > 1 ? 's' : '') + ' à jour', '#6FBEE0', 'rgba(74,159,200,0.14)', 'rgba(74,159,200,0.35)');
  if (_agtKmlMode === 'merge' && p.gardes.length) h += _agtKmlPill(p.gardes.length + ' conservée' + (p.gardes.length > 1 ? 's' : ''), 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.12)');
  if (_agtKmlMode === 'replace' && p.perdus.length) h += _agtKmlPill(p.perdus.length + ' supprimée' + (p.perdus.length > 1 ? 's' : ''), '#E88B7C', 'rgba(224,112,96,0.14)', 'rgba(224,112,96,0.4)');
  h += '</div>';

  // Le détail
  h += '<div style="max-height:230px;overflow-y:auto;margin-bottom:14px">';
  p.nouveaux.forEach(function (x) { h += _agtKmlRow(x.name, x.pts.length + ' pts · ' + _agtGeoArea(x.pts).toFixed(2) + ' ha', 'nouvelle', '#8CC26A', 'rgba(61,107,39,0.3)'); });
  p.majs.forEach(function (x) { h += _agtKmlRow(x.name, 'contour remplacé · ' + x.pts.length + ' pts', 'mise à jour', '#6FBEE0', 'rgba(74,159,200,0.22)'); });
  if (_agtKmlMode === 'merge') {
    p.gardes.forEach(function (x) { h += _agtKmlRow(x.name, ((x.pts || []).length) + ' pts', 'conservée', 'rgba(255,255,255,0.38)', 'rgba(255,255,255,0.07)'); });
  } else {
    p.perdus.forEach(function (x) { h += _agtKmlRow(x.name, 'disparaît de la carte', 'supprimée', '#E88B7C', 'rgba(224,112,96,0.22)'); });
  }
  h += '</div>';

  // Les fiches de parcelle
  // ⚠️ Un contour sans fiche sort en gris sur la carte (initMap : PARCELLES.find sur
  //    le nom) et n'existe dans AUCUN autre écran. Livrer l'un sans l'autre, c'est
  //    livrer une parcelle à moitié.
  if (p.fichesAcreer.length) {
    h += '<label style="display:flex;align-items:flex-start;gap:10px;padding:11px 13px;border-radius:10px;background:rgba(255,255,255,0.035);margin-bottom:10px;cursor:pointer">';
    h += '<input type="checkbox"' + (_agtKmlCreerF ? ' checked' : '') + ' onchange="agtKmlCreerF(this)" style="margin-top:2px;width:16px;height:16px;accent-color:#6BA34A;flex:none">';
    h += '<div><div style="font-size:var(--pt-txt,13px);color:rgba(255,255,255,0.82)">Créer aussi la fiche de ' + p.fichesAcreer.length + ' parcelle' + (p.fichesAcreer.length > 1 ? 's' : '') + '</div>';
    h += '<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.38);line-height:1.5;margin-top:2px">';
    h += p.fichesAcreer.map(function (x) { return _escHtml(x.name) + ' — ' + _agtGeoArea(x.pts).toFixed(2) + ' ha'; }).join(' · ');
    h += '<br>Sans sa fiche, une parcelle sort en gris sur la carte et n\'apparaît dans aucun écran. La surface est calculée sur le contour et reste modifiable dans Réglages.</div></div></label>';
  } else if (p.nouveaux.length) {
    h += '<div style="background:rgba(74,159,200,0.10);border:1px solid rgba(74,159,200,0.26);border-radius:10px;padding:11px 13px;margin-bottom:10px;font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.55)">Les parcelles ajoutées ont déjà leur fiche dans ce domaine. Rien d\'autre à créer.</div>';
  }

  // Garde-fou du geste destructif
  if (_agtKmlMode === 'replace' && p.perdus.length) {
    h += '<label style="display:flex;align-items:flex-start;gap:10px;padding:11px 13px;border-radius:10px;background:rgba(142,47,38,0.15);margin-bottom:10px;cursor:pointer">';
    h += '<input type="checkbox"' + (_agtKmlConfirm ? ' checked' : '') + ' onchange="agtKmlConfirmSet(this)" style="margin-top:2px;width:16px;height:16px;accent-color:#E07060;flex:none">';
    h += '<div><div style="font-size:var(--pt-txt,13px);color:#E88B7C">Je comprends que ' + p.perdus.length + ' contour' + (p.perdus.length > 1 ? 's' : '') + ' vont disparaître de la carte</div>';
    h += '<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.38);line-height:1.5;margin-top:2px">Les fiches de ces parcelles ne sont pas supprimées — seule leur forme sur la carte est perdue.</div></div></label>';
  }

  // Le bouton
  var bloque = _agtKmlBusy || (_agtKmlMode === 'replace' && p.perdus.length > 0 && !_agtKmlConfirm);
  var lib = _agtKmlBusy ? 'Enregistrement…'
    : (_agtKmlMode === 'replace'
      ? 'Remplacer par ce fichier — ' + p.sortie.length + ' contours'
      : 'Enregistrer — ' + p.sortie.length + ' contours au total');
  h += '<button onclick="agtKmlSave()"' + (bloque ? ' disabled' : '') + ' style="width:100%;padding:13px;border-radius:10px;';
  h += 'border:none;font-size:var(--pt-base,14px);font-weight:700;font-family:var(--font-ui,Outfit,sans-serif);cursor:' + (bloque ? 'not-allowed' : 'pointer') + ';';
  h += 'background:' + (_agtKmlMode === 'replace' ? '#8E2F26' : '#3D6B27') + ';color:white;margin-bottom:8px;opacity:' + (bloque ? '0.45' : '1') + '">' + lib + '</button>';
  return h;
}

function _agtKmlModeBtn(m, titre, desc) {
  var on = (_agtKmlMode === m), dg = (m === 'replace');
  var bd = on ? (dg ? 'rgba(224,112,96,0.55)' : 'rgba(107,163,74,0.55)') : 'rgba(255,255,255,0.1)';
  var bg = on ? (dg ? 'rgba(142,47,38,0.18)' : 'rgba(61,107,39,0.16)') : 'rgba(255,255,255,0.03)';
  return '<button onclick="agtKmlMode(\'' + m + '\')" style="border-radius:12px;padding:12px;text-align:left;cursor:pointer;'
    + 'font-family:var(--font-ui,Outfit,sans-serif);border:1px solid ' + bd + ';background:' + bg + '">'
    // ⚠️ <span> et non <div> : un <div> dans un <button> est invalide en HTML5 (§24).
    //    Le display:block leur rend la mise en page d'un bloc sans la balise interdite.
    + '<span style="display:block;font-size:var(--pt-txt,13px);font-weight:700;color:#fff;margin-bottom:3px">' + titre + '</span>'
    + '<span style="display:block;font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.45);line-height:1.5">' + desc + '</span></button>';
}

function _agtKmlPill(txt, col, bg, bd) {
  return '<span style="border-radius:999px;padding:5px 12px;font-size:var(--pt-micro,12px);font-weight:600;'
    + 'color:' + col + ';background:' + bg + ';border:1px solid ' + bd + '">' + txt + '</span>';
}

function _agtKmlRow(nom, sub, tag, col, bg) {
  return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;'
    + 'padding:9px 12px;border-radius:9px;background:rgba(255,255,255,0.035);margin-bottom:5px">'
    + '<div><div style="font-size:var(--pt-txt,13px);color:rgba(255,255,255,0.82)">' + _escHtml(nom) + '</div>'
    + '<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.3);font-family:monospace">' + _escHtml(sub) + '</div></div>'
    + '<span style="font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;'
    + 'padding:3px 8px;border-radius:5px;white-space:nowrap;color:' + col + ';background:' + bg + '">' + tag + '</span></div>';
}
async function agtKmlSave() {
  var slug = _agtKmlSlug;
  if (!slug) { showToast('Choisissez un domaine cible', '#E07060'); return; }
  if (!_agtKmlPolygons.length) { showToast('Aucun contour à enregistrer', '#E07060'); return; }
  if (_agtKmlLu !== 'ok') { showToast('État de la base inconnu — rechoisissez le domaine', '#E07060'); return; }
  if (_agtKmlBusy) return;
  _agtKmlBusy = true; agtRenderBody();
  try {
    if (!window.fbAdminWrite || !window.fbAdminLire) throw new Error('accès Firestore indisponible');

    // ⚠️ RELECTURE. L'aperçu peut dater de plusieurs minutes, et le client travaille
    //    pendant ce temps. Le plan écrit se calcule sur ce que la base contient
    //    MAINTENANT, pas sur ce qu'elle contenait à l'ouverture de l'écran.
    // ★ GTFIX-1 (§510) : relue AU SERVEUR, et une lecture qui échoue ARRÊTE tout. Avant, fbAdminRead
    //   rendait null sur erreur, lu comme [] : « compléter » devenait « remplacer » (les contours du
    //   client perdus) et la liste des fiches réécrite ne gardait que les fiches neuves.
    var _lk = await window.fbAdminLire(slug, 'kml_polygons');
    var _lf = await window.fbAdminLire(slug, 'parcelles');
    if ((_lk.existe && !Array.isArray(_lk.valeur)) || (_lf.existe && !Array.isArray(_lf.valeur))) throw new Error('base illisible — rien ne sera écrit');
    var baseNow   = _lk.existe ? _lk.valeur : [];
    var fichesNow = _lf.existe ? _lf.valeur : [];
    var p = _agtKmlPlan(baseNow, fichesNow);

    // ⚠️ Un plan de fusion qui n'écrirait RIEN de plus que la base, alors que le
    //    fichier apporte des contours, est le signe que quelque chose a mal tourné.
    if (!p.sortie.length) throw new Error('plan vide — rien ne sera écrit');

    var ok1 = await window.fbAdminWrite(slug, 'kml_polygons', p.sortie);
    if (!ok1) throw new Error('écriture refusée (droits Firestore / réseau) — voir console [fbAdminWrite]');

    // Les fiches. Écrites APRÈS les contours et seulement s'il y en a à créer :
    // une écriture de `parcelles` réécrit la clé entière, on ne la touche pas pour rien.
    var nf = 0;
    if (_agtKmlCreerF && p.fichesAcreer.length) {
      var fusion = fichesNow.concat(p.fichesAcreer.map(function (x) {
        return { nom: x.name, surface: Math.round(_agtGeoArea(x.pts) * 100) / 100, statut: 'Active', taches: {} };
      }));
      var ok2 = await window.fbAdminWrite(slug, 'parcelles', fusion);
      if (!ok2) {
        // Échec partiel : les contours SONT écrits. Le dire précisément, plutôt que
        // de laisser croire que rien n'a été fait.
        showToast('Contours enregistrés, fiches NON créées — à saisir dans Réglages', '#B85A1A');
        _agtKmlPolygons = []; _agtKmlFileName = ''; _agtKmlConfirm = false;
        _agtKmlBusy = false;
        await agtKmlRelire(slug);
        return;
      }
      nf = p.fichesAcreer.length;
    }

    var msg = p.sortie.length + ' contour' + (p.sortie.length > 1 ? 's' : '') + ' pour ' + slug;
    if (nf) msg += ' · ' + nf + ' fiche' + (nf > 1 ? 's' : '') + ' créée' + (nf > 1 ? 's' : '');
    showToast('Enregistré — ' + msg, '#3D6B27');
    _agtKmlPolygons = []; _agtKmlFileName = ''; _agtKmlConfirm = false;
    _agtKmlBusy = false;
    await agtKmlRelire(slug);
  } catch (e) {
    _agtKmlBusy = false;
    showToast('Erreur : ' + (e.message || e.code || 'inconnue'), '#E07060');
    agtRenderBody();
  }
}

// Relit la base après écriture : l'état affiché doit décrire ce qui EST en base,
// pas ce qu'on croit y avoir mis.
async function agtKmlRelire(slug) {
  try {
    var k = await window.fbAdminRead(slug, 'kml_polygons');
    var p = await window.fbAdminRead(slug, 'parcelles');
    _agtKmlBase   = Array.isArray(k) ? k : [];
    _agtKmlFiches = Array.isArray(p) ? p : [];
    _agtKmlLu     = 'ok';
  } catch (e) { _agtKmlBase = null; _agtKmlFiches = null; _agtKmlLu = 'err'; }
  agtRenderBody();
}

async function agtCheckKml(slug, btn) {
  if (btn) { btn.textContent = '…'; btn.disabled = true; }
  try {
    var data = window.fbAdminRead ? await window.fbAdminRead(slug, 'kml_polygons') : null;
    var row = document.getElementById('agt-kml-row-' + slug);
    if (row) {
      var btn2 = row.querySelector('button');
      if (btn2) {
        if (Array.isArray(data) && data.length > 0) {
          btn2.outerHTML = '<span style="font-size:var(--pt-micro,11px);color:#6BA34A;font-weight:600">' + data.length + ' polygones</span>';
        } else {
          btn2.outerHTML = '<span style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.3)">— KML statique</span>';
        }
      }
    }
  } catch(e) {
    if (btn) { btn.textContent = 'Erreur'; btn.disabled = false; }
  }
}

// ─── Suppression d'un domaine entier (GT admin) ──────────────────────────────
function agtDeleteTenant(slug){
  if(slug==='marchand-grillot'){ showToast('Domaine de production protégé','#E07B2A'); return; }
  var existing=document.getElementById('agt-deltenant-overlay');
  if(existing) existing.remove();
  var ov=document.createElement('div');
  ov.id='agt-deltenant-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(6,4,12,0.85);backdrop-filter:blur(3px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;font-family:var(--font-ui,Outfit,sans-serif)';
  var sg=_escHtml(slug);
  ov.innerHTML=
     '<div style="width:100%;max-width:410px;background:rgba(18,14,28,0.97);border:1px solid rgba(239,68,68,0.3);border-radius:20px;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,0.6)">'
    +'<div style="display:flex;align-items:center;gap:11px">'
    +'<div style="width:38px;height:38px;border-radius:11px;background:rgba(239,68,68,0.14);border:1px solid rgba(239,68,68,0.35);display:flex;align-items:center;justify-content:center;font-size:18px"></div>'
    +'<div style="font-size:var(--pt-sm,16px);font-weight:700;color:#fff">Supprimer le domaine</div>'
    +'</div>'
    +'<div style="font-size:var(--pt-txt,13px);line-height:1.55;color:rgba(255,255,255,0.6);margin-top:12px">Tu vas <b style="color:#FCA5A5">effacer définitivement</b> le domaine <b style="color:#FCA5A5">'+sg+'</b>. Cette action est <b style="color:#FCA5A5">irréversible</b>.</div>'
    +'<div style="font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.5);background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.16);border-radius:11px;padding:11px 13px;margin:12px 0;line-height:1.7">Seront supprimés : tous les <b>comptes de connexion</b> des membres, parcelles, journal, sessions, traitements, planning, cave, tâches, saisons, config, et l\'entrée du registre.</div>'
    +'<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.4);margin:14px 0 6px">Pour confirmer, tape le nom exact : <code style="background:rgba(255,255,255,0.08);padding:1px 7px;border-radius:4px;color:#C4B5FD;font-weight:600">'+sg+'</code></div>'
    +'<input id="agt-del-slug" type="text" autocomplete="off" placeholder="nom du domaine" oninput="agtDelCheck(\''+slug+'\')" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(139,92,246,0.2);border-radius:10px;padding:11px 13px;font-size:var(--pt-txt,13px);color:#fff;font-family:var(--font-ui,Outfit,sans-serif);box-sizing:border-box">'
    +'<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.4);margin:14px 0 6px">Mot de passe de suppression</div>'
    +'<input id="agt-del-pwd" type="password" autocomplete="new-password" placeholder="••••••••" oninput="agtDelCheck(\''+slug+'\')" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(139,92,246,0.2);border-radius:10px;padding:11px 13px;font-size:var(--pt-txt,13px);color:#fff;font-family:var(--font-ui,Outfit,sans-serif);box-sizing:border-box">'
    +'<div id="agt-del-err" style="display:none;color:#FCA5A5;font-size:var(--pt-micro,12px);margin-top:10px"></div>'
    +'<div style="display:flex;gap:9px;margin-top:18px">'
    +'<button onclick="document.getElementById(\'agt-deltenant-overlay\').remove()" style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:11px;color:rgba(255,255,255,0.55);font-size:var(--pt-txt,13px);font-weight:500;padding:12px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">Annuler</button>'
    +'<button id="agt-del-btn" disabled onclick="agtDeleteTenantConfirm(\''+slug+'\')" style="flex:1.7;border:none;border-radius:11px;color:#fff;font-size:var(--pt-txt,13px);font-weight:700;padding:12px;cursor:not-allowed;font-family:var(--font-ui,Outfit,sans-serif);background:rgba(127,16,32,0.4);opacity:.55">Supprimer le domaine</button>'
    +'</div>'
    +'</div>';
  document.body.appendChild(ov);
  setTimeout(function(){ var el=document.getElementById('agt-del-slug'); if(el) el.focus(); },50);
}

function agtDelCheck(slug){
  var s=document.getElementById('agt-del-slug');
  var p=document.getElementById('agt-del-pwd');
  var btn=document.getElementById('agt-del-btn');
  if(!s||!p||!btn) return;
  var ok=(s.value.trim()===slug)&&(p.value.length>0);
  btn.disabled=!ok;
  btn.style.cursor=ok?'pointer':'not-allowed';
  btn.style.opacity=ok?'1':'.55';
  btn.style.background=ok?'linear-gradient(135deg,#B91C1C,#EF4444)':'rgba(127,16,32,0.4)';
  btn.style.boxShadow=ok?'0 6px 18px rgba(239,68,68,0.35)':'none';
}

async function agtDeleteTenantConfirm(slug){
  var s=document.getElementById('agt-del-slug');
  var p=document.getElementById('agt-del-pwd');
  var btn=document.getElementById('agt-del-btn');
  var err=document.getElementById('agt-del-err');
  if(!s||!p||!btn) return;
  if(s.value.trim()!==slug || !p.value) return;
  function _err(msg){ if(err){ err.textContent=msg; err.style.display='block'; } }
  if(err) err.style.display='none';
  btn.disabled=true; btn.textContent='Suppression…'; btn.style.cursor='wait';
  try{
    if(!window._fbDeleteTenant) throw new Error('_fbDeleteTenant indisponible');
    var r=await window._fbDeleteTenant(slug, p.value);
    var ov=document.getElementById('agt-deltenant-overlay'); if(ov) ov.remove();
    var nA=(r&&typeof r.authDeleted==='number')?r.authDeleted:0;
    var nD=(r&&typeof r.docsDeleted==='number')?r.docsDeleted:0;
    showToast('Domaine supprimé : '+nA+' compte'+(nA>1?'s':'')+', '+nD+' doc'+(nD>1?'s':''),'#3D6B27');
    if(window.renderAdminGT) await window.renderAdminGT();
  }catch(e){
    var reason=(e&&e.details&&e.details.reason)||'';
    var msg=(e&&e.message)||'Erreur inconnue';
    if(reason==='bad_guard')      msg='Mot de passe de suppression incorrect.';
    else if(reason==='protected') msg='Ce domaine est protégé.';
    else if(reason==='no_guard')  msg='Mot de passe non configuré (poser delete_guard_hash dans _guerettech/config).';
    else if(reason==='throttled') msg='Trop de tentatives, réessayez plus tard.';
    _err(msg);
    btn.disabled=false; btn.textContent='Supprimer le domaine'; btn.style.cursor='pointer';
  }
}

// ══════════════════════════════════════════════════════════════════════════
// FICHE CLIENT GT — paramétrage complet d'un domaine (cross-tenant)
// Lecture fbAdminRead / écriture fbAdminWrite par slug. Styles 100% inline
// (aucune dépendance index.html → pas de bump version).
// ⚠️ fbAdminWrite = setDoc BRUT (pas de garde §11b) → la garde 25% + la
//    confirmation "SUPPRIMER" par item sont portées ICI.
// ══════════════════════════════════════════════════════════════════════════
var _FC_SLUG='', _FC_TAB='dom', _FC={};
var _FC_ROLES=['admin','ouvrier','tractoriste','saisonnier','pilotage'];
var _FC_TABS=[['dom','\uD83C\uDFDB\uFE0F Domaine'],['parcelles','\uD83C\uDF47 Parcelles'],['membres','\uD83D\uDC65 Membres'],['taches','\u2713 T\u00e2ches'],['tracteurs_list','\uD83D\uDE9C Tracteurs'],['saisons','\uD83D\uDCC5 Saisons'],['abo','\uD83D\uDCB3 Abonnement']];
var _FC_INP_STYLE='width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(139,92,246,0.2);border-radius:9px;padding:9px 11px;font-size:var(--pt-txt,13px);color:#fff;font-family:var(--font-ui,Outfit,sans-serif);box-sizing:border-box';
var _FC_SEL_STYLE=_FC_INP_STYLE;

function _fcArr(v){ return Array.isArray(v)?v:[]; }
function _fcSecTitle(t){ return {dom:'Domaine',parcelles:'Parcelles & secteurs m\u00e9t\u00e9o',membres:'Membres & r\u00f4les',taches:'T\u00e2ches & heures/ha',tracteurs_list:'Tracteurs',saisons:'Saisons',abo:'Abonnement'}[t]||''; }
function _fcHint(html){ return '<div style="font-size:var(--pt-lbl,12px);color:rgba(255,255,255,0.4);line-height:1.6;margin:0 0 13px">'+html+'</div>'; }
function _fcEmpty(txt){ return '<div style="text-align:center;padding:22px;color:rgba(255,255,255,0.25);font-size:var(--pt-txt,13px)">'+txt+'</div>'; }

function _fcActiveCount(coll){ var a=_FC[coll]||[]; if(coll==='parcelles') return a.filter(function(p){return p.statut!=='Arrachee';}).length; return a.length; }

// ★★★ GTFIX-2 (§511, décision D1 du 01/11) — LES DONNÉES DU DOMAINE SONT EN LECTURE SEULE DANS LA FICHE.
//   Parcelles, membres, tâches, tracteurs et saisons s'éditaient ici en champs libres, puis `_fcSave`
//   réécrivait la copie lue à l'ouverture (GT-B03 : les saisies du client faites entre-temps disparaissaient)
//   et renommait sans suivre la règle de renommage (GT-B04 : une parcelle renommée perdait contour, registre
//   phyto, sessions, cave, tournées). On les modifie désormais sur les VRAIS écrans du domaine, dans la
//   préparation (PREP-1), avec leurs règles. La fiche garde ce qui appartient à GUERETTECH : le domaine
//   (nom, coordonnées de repli — écriture en transaction depuis GTFIX-1), l'abonnement, les modules, l'essai.
function _fcLectureSeule(){
  return '<div style="display:flex;gap:12px;align-items:flex-start;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.28);border-radius:12px;padding:12px 14px;margin-bottom:14px">'
    +'<div style="font-size:var(--pt-txt,13px);color:rgba(255,255,255,0.75);line-height:1.5"><b style="color:#F0E8DC">Lecture seule.</b> Ces donn\u00e9es se modifient sur les vrais \u00e9crans du domaine, avec leurs r\u00e8gles : le renommage qui suit tout l\u2019historique, les gardes anti-perte, les identifiants.'
    +'<div style="margin-top:10px"><button onclick="_fcPreparer()" style="padding:9px 14px;border-radius:10px;font-size:var(--pt-txt,13px);font-weight:600;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);border:none;background:#C9A84C;color:#0C1A0A">Modifier dans la pr\u00e9paration</button></div></div></div>';
}
// Une ligne de tableau en lecture : des cases de texte, échappées, jamais un champ.
function _fcLigne(cols, cases){
  return '<div style="display:grid;grid-template-columns:'+cols+';gap:8px;align-items:center;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:11px;padding:10px 12px;margin-bottom:7px;font-size:var(--pt-txt,13px);color:rgba(255,255,255,0.82)">'
    + cases.map(function(c){ return '<div style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+c+'</div>'; }).join('') + '</div>';
}
function _fcEntete(cols, noms){
  return '<div style="display:grid;grid-template-columns:'+cols+';gap:8px;padding:0 12px 6px;font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.4)">'
    + noms.map(function(n){ return '<span>'+n+'</span>'; }).join('') + '</div>';
}
function _fcTxt(v, vide){ var s = (v == null) ? '' : String(v).trim(); return s ? _escHtml(s) : '<span style="color:rgba(255,255,255,0.3)">'+(vide||'\u2014')+'</span>'; }
// ── Sections ────────────────────────────────────────────────────────────────
function _fcSecDom(){
  var c=_FC.config||{};
  function fld(lbl,id,val,type){
    return '<div style="margin-bottom:13px"><div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);margin-bottom:6px">'+lbl+'</div><input id="'+id+'" type="'+(type||'text')+'" value="'+_escHtml(String(val==null?'':val))+'" style="'+_FC_INP_STYLE+'"></div>';
  }
  return _fcHint('Le centre m\u00e9t\u00e9o r\u00e9el se calcule sur le centro\u00efde des parcelles ; ces coordonn\u00e9es ne servent que de repli.')
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
    + fld('Nom du domaine','agt-fc-nom',c.domaine_nom||'')
    +'<div style="margin-bottom:13px"><div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);margin-bottom:6px">Onboarding</div><div style="font-size:var(--pt-txt,13px);font-weight:600;color:'+(c.onboarding_done?'#6BA34A':'#FCA5A5')+';padding:9px 0">'+(c.onboarding_done?'\u2705 Termin\u00e9':'\u274c Non termin\u00e9')+'</div></div>'
    + fld('Latitude (repli)','agt-fc-lat',c.lat==null?'':c.lat,'number')
    + fld('Longitude (repli)','agt-fc-lon',c.lon==null?'':c.lon,'number')
    +'</div>'
    + _agtCguHtml(c, _FC_SLUG);   // ★ GTFIX-4 : l'acceptation CGU + DPA, qui vivait dans la fenêtre Config
}

function _fcSecParc(){
  var cols='1.6fr .7fr .8fr 1.2fr';
  var rows=_FC.parcelles.length?_FC.parcelles.map(function(p){
    var commNom=(p.commune&&p.commune.nom)?p.commune.nom:((typeof p.commune==='string')?p.commune:'');
    var arr=p.statut==='Arrachee';
    return _fcLigne(cols,[_fcTxt(p.nom,'sans nom'), (typeof p.surface==='number'?_escHtml(String(p.surface).replace('.',','))+'\u00a0ha':_fcTxt('')),
      (arr?'<span style="color:#E88F82">arrach\u00e9e</span>':'active'), _fcTxt(commNom,'sans commune')]);
  }).join(''):_fcEmpty('Aucune parcelle');
  return _fcLectureSeule() + _fcEntete(cols,['Nom (climat)','Surface','Statut','Commune']) + rows + _fcSecteursHtml();
}

function _fcSecteursHtml(){
  var act=(_FC.parcelles||[]).filter(function(p){return p.statut!=='Arrachee';});
  var m={};
  act.forEach(function(p){ var nom=(p.commune&&p.commune.nom)?p.commune.nom:((typeof p.commune==='string'&&p.commune)?p.commune:''); var k=(nom||'').trim()||'__none__'; m[k]=(m[k]||0)+1; });
  var keys=Object.keys(m).filter(function(k){return k!=='__none__';});
  var on=keys.length>=2;
  var chips=Object.keys(m).map(function(k){ var lbl=(k==='__none__')?'\u2014 sans secteur':k; return '<span style="font-size:var(--pt-micro,11px);background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.07);border-radius:9px;padding:6px 11px;color:rgba(255,255,255,0.6)"><b style="color:#fff">'+_escHtml(lbl)+'</b> \u00b7 '+m[k]+' parc.</span>'; }).join(' ');
  var badge=on?'background:rgba(61,107,39,0.18);border:1px solid rgba(61,107,39,0.4);color:#6BA34A':'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.4)';
  return '<div id="agt-fc-secteurs" style="background:linear-gradient(135deg,rgba(61,107,39,0.12),rgba(139,92,246,0.06));border:1px solid rgba(61,107,39,0.25);border-radius:13px;padding:13px;margin-top:14px">'
    +'<div style="font-size:var(--pt-micro,12px);font-weight:700;color:#A8D08A;display:flex;align-items:center;gap:8px">\uD83D\uDDFA\uFE0F Secteurs m\u00e9t\u00e9o <span style="font-size:10px;border-radius:999px;padding:2px 9px;font-weight:600;'+badge+'">'+(on?'cartes par secteur activ\u00e9es':'m\u00e9t\u00e9o unique du domaine')+'</span></div>'
    +'<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.4);margin-top:6px">'+keys.length+' commune'+(keys.length>1?'s':'')+' active'+(keys.length>1?'s':'')+' \u00b7 cartes empil\u00e9es sur l\'accueil d\u00e8s \u22652 communes.</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:9px">'+chips+'</div></div>';
}

function _fcSecMbr(){
  var rows=_FC.membres.length?_FC.membres.map(function(m){
    var roles=Array.isArray(m.roles)?m.roles:Object.keys(m.roles||{}).filter(function(r){return m.roles[r];});
    // Les rôles en texte : une pastille faite à la main de plus ferait remonter le cliquet de CHARTE-4 — la console
    //   prendra le jeu de pastilles commun avec sa refonte (GT-UI-3).
    var chips=roles.length?'<span style="color:rgba(255,255,255,0.7);font-size:var(--pt-micro,12px)">'+roles.map(function(r){ return _escHtml(r); }).join(' \u00b7 ')+'</span>'
      :'<span style="color:rgba(255,255,255,0.3);font-size:var(--pt-micro,12px)">aucun r\u00f4le</span>';
    var inactif=String(m.statut||'actif').toLowerCase()!=='actif';
    return '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:11px 12px;margin-bottom:8px">'
      +'<div style="display:flex;justify-content:space-between;gap:10px;font-size:var(--pt-txt,13px);color:#F0E8DC;font-weight:600"><span>'+_fcTxt(m.nom,'sans nom')+'</span>'
      +(inactif?'<span style="font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.45);font-weight:500">inactif</span>':'')+'</div>'
      +'<div style="font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.4);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_fcTxt(m.email,'sans adresse')+'</div>'
      +'<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:9px">'+chips+'</div></div>';
  }).join(''):_fcEmpty('Aucun membre');
  return _fcLectureSeule() + _fcHint('Les comptes de connexion (cr\u00e9ation, nouveau mot de passe) restent dans <b>Membres</b>, sur la carte du domaine : ils passent par le serveur.') + rows;
}

function _fcSecTache(){
  var cols='1.6fr .6fr 1fr 1fr';
  var TYPES={simple:'Simple',pass:'Passages \u00d72',niv:'Niveaux \u00d73'};
  var rows=_FC.taches.length?_FC.taches.map(function(t){
    return _fcLigne(cols,[_fcTxt(t.nom,'sans nom'), (typeof t.hha==='number'?_escHtml(String(t.hha).replace('.',',')):_fcTxt('')), _fcTxt(t.saison), _fcTxt(TYPES[t.type]||t.type)]);
  }).join(''):_fcEmpty('Aucune t\u00e2che');
  return _fcLectureSeule() + _fcEntete(cols,['T\u00e2che','h/ha','Saison','Type']) + rows;
}

function _fcSecTrac(){
  var cols='1.2fr 1fr';
  var rows=_FC.tracteurs_list.length?_FC.tracteurs_list.map(function(t){
    return _fcLigne(cols,[_fcTxt(t.nom,'sans nom'), _fcTxt(t.modele)]);
  }).join(''):_fcEmpty('Aucun tracteur');
  return _fcLectureSeule() + _fcEntete(cols,['Nom','Mod\u00e8le']) + rows;
}

function _fcSecSais(){
  var cols='1.2fr 1fr 1fr .7fr';
  var rows=_FC.saisons.length?_FC.saisons.map(function(s){
    return _fcLigne(cols,[_fcTxt(s.nom,'sans nom'), _fcTxt(s.debut), _fcTxt(s.fin), (s.active?'<span style="color:#6BA34A">active</span>':'<span style="color:rgba(255,255,255,0.3)">\u2014</span>')]);
  }).join(''):_fcEmpty('Aucune saison');
  return _fcLectureSeule() + _fcEntete(cols,['Nom','D\u00e9but','Fin','']) + rows;
}

// Socle modules par formule (doit rester aligné sur _canModule côté firebase.js)
var _FC_PLANDEF = {
  essentiel: { tracteur:false, planning:false, pilotage:false, cave:false, reserve:false },
  vigneron:  { tracteur:true,  planning:false, pilotage:false, cave:false, reserve:false },
  domaine:   { tracteur:true,  planning:true,  pilotage:true,  cave:true,  reserve:true  }
};
var _FC_MODS = [
  { id:'tracteur', emoji:'🚜', name:'Tracteur & Phyto', sub:'Sessions · Entretien · Registre phyto (Phyto suit Tracteur)' },
  { id:'planning', emoji:'📅', name:'Planning RH',      sub:'Heures · Acomptes · Charge & ETP' },
  { id:'pilotage', emoji:'📊', name:'Pilotage',         sub:'Tableau de bord décisionnel' },
  { id:'cave',     emoji:'🍷', name:'Cave',             sub:'Vendange · Vinification · Élevage' },
  { id:'reserve',  emoji:'📦', name:'La Réserve',       sub:'Intrants · Stock (bilan matière bio) · Fûts' }
];
function _fcModPlan(){
  var v=(document.getElementById('agt-fc-plan')||{}).value;
  return (['essentiel','vigneron','domaine'].indexOf(v)>=0)?v:(_FC.plan||'domaine');
}
function _fcModEff(id){ return (_FC.featOv&&(id in _FC.featOv))?_FC.featOv[id]:_FC_PLANDEF[_fcModPlan()][id]; }
function _fcModForced(id){ return !!(_FC.featOv&&(id in _FC.featOv)); }
function _fcModsHtml(){
  var plan=_fcModPlan();
  if(_FC.featOv) Object.keys(_FC.featOv).forEach(function(id){ if(_FC.featOv[id]===_FC_PLANDEF[plan][id]) delete _FC.featOv[id]; });
  return _FC_MODS.map(function(m){
    var eff=_fcModEff(m.id), forced=_fcModForced(m.id), def=_FC_PLANDEF[plan][m.id];
    var badge=forced?(eff?'<span class="agt-b agt-b-on">forcé actif</span>':'<span class="agt-b agt-b-off">forcé masqué</span>'):'<span class="agt-b agt-b-herit">hérité · '+(def?'actif':'masqué')+'</span>';
    var reset=forced?'<span class="agt-mod-reset" onclick="_fcModReset(\''+m.id+'\')">rétablir la formule</span>':'';
    return '<div class="agt-mod-row'+(forced?' on':'')+'">'
      +'<div class="agt-mod-emoji">'+m.emoji+'</div>'
      +'<div class="agt-mod-txt"><div class="agt-mod-name">'+m.name+'</div><div class="agt-mod-sub">'+m.sub+'</div><div>'+badge+reset+'</div></div>'
      +'<label class="agt-sw"><input type="checkbox" '+(eff?'checked':'')+' onchange="_fcModToggle(\''+m.id+'\')"><span class="agt-sw-tr"><span class="agt-sw-kn"></span></span></label>'
      +'</div>';
  }).join('');
}
function _fcModsRender(){ var el=document.getElementById('agt-fc-mods'); if(el) el.innerHTML=_fcModsHtml(); }
window._fcModPlanChange=function(){ var plan=_fcModPlan(); if(_FC.featOv) Object.keys(_FC.featOv).forEach(function(id){ if(_FC.featOv[id]===_FC_PLANDEF[plan][id]) delete _FC.featOv[id]; }); _fcModsRender(); };
window._fcModToggle=function(id){ var plan=_fcModPlan(); var nv=!_fcModEff(id); if(!_FC.featOv)_FC.featOv={}; if(nv===_FC_PLANDEF[plan][id]) delete _FC.featOv[id]; else _FC.featOv[id]=nv; _fcModsRender(); };
window._fcModReset=function(id){ if(_FC.featOv) delete _FC.featOv[id]; _fcModsRender(); };

// ⚠️ MIROIR de functions/claims.js (TRIAL_DAYS, TRIAL_MAX_RENEW). Ces deux nombres
//    existent en DEUX endroits : ici pour l'afficher, la-bas pour le faire respecter.
//    Si l'un bouge sans l'autre, l'ecran promet ce que le serveur refuse.
var _FC_TRIAL_DAYS = 15;
var _FC_TRIAL_MAX  = 1;

// La reconduction unique. Le bouton NE PORTE PAS la regle, il la MONTRE : Nicolas doit
// savoir ou il en est AVANT de cliquer, pas en recevant un refus.
function _fcRenewHtml(){
  var faites=(typeof _FC.trialRenewals==='number')?_FC.trialRenewals:0;
  var dispo=(faites<_FC_TRIAL_MAX);
  var sous=dispo
    ? 'Redonne '+_FC_TRIAL_DAYS+' jours pleins \u00e0 compter d\u2019aujourd\u2019hui \u2014 pas depuis l\u2019ancienne \u00e9ch\u00e9ance \u2014 et vous envoie un rappel d\u2019appeler le client.'
    : 'D\u00e9j\u00e0 reconduit une fois. Au-del\u00e0, c\u2019est une conversion \u2014 ou le champ ci-dessus, en connaissance de cause.';
  return '<div id="agt-fc-renew" style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.22);border-radius:11px;padding:12px 13px;margin:0 0 13px">'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'
    +'<span style="font-size:var(--pt-txt,13px);font-weight:600;color:#E8D89A">Reconduction de l\u2019essai</span>'
    +'<span style="font-size:10px;font-weight:600;color:'+(dispo?'#86EFAC':'rgba(255,255,255,0.35)')+';background:rgba(255,255,255,0.05);border-radius:20px;padding:2px 8px">'+faites+' / '+_FC_TRIAL_MAX+'</span></div>'
    +'<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.4);line-height:1.5;margin-bottom:9px">'+sous+'</div>'
    +'<button id="agt-fc-renew-btn"'+(dispo?'':' disabled')+' onclick="_fcRenewTrial()" style="width:100%;font-family:var(--font-ui,Outfit,sans-serif);font-size:var(--pt-txt,13px);font-weight:700;border-radius:9px;padding:10px;border:0;cursor:'+(dispo?'pointer':'not-allowed')+';background:'+(dispo?'#C9A84C':'rgba(255,255,255,0.06)')+';color:'+(dispo?'#0C1A0A':'rgba(255,255,255,0.3)')+'">'
    +(dispo?('Reconduire '+_FC_TRIAL_DAYS+' jours'):'Reconduction utilis\u00e9e')+'</button></div>';
}

window._fcRenewTrial=async function(){
  var btn=document.getElementById('agt-fc-renew-btn'), lib=btn?btn.textContent:'';
  if(btn){ btn.disabled=true; btn.textContent='Un instant\u2026'; }
  try{
    if(!window._fbRenewTrial) throw new Error('fonction non d\u00e9ploy\u00e9e');
    var r=await window._fbRenewTrial(_FC_SLUG);
    _FC.trialRenewals=(r&&typeof r.renewals==='number')?r.renewals:((_FC.trialRenewals||0)+1);
    _FC.trialExp=(r&&typeof r.trialUntil==='number')?r.trialUntil:0;
    _FC.trialDays=_FC_TRIAL_DAYS;
    _FC.trialPrevu=0;
    // ⚠️ TROIS zones, et pas une de moins : l'encart d'etat, le champ de jours, et le
    //    bloc lui-meme qui doit se griser. En oublier une laisse l'ecran affirmer
    //    l'ancien etat juste a cote du nouveau.
    var z1=document.getElementById('agt-fc-trial-status'); if(z1) z1.outerHTML=_fcTrialStatusHtml(_FC);
    var z2=document.getElementById('agt-fc-trial');        if(z2) z2.value=_fcTrialLeft(_FC);
    var z3=document.getElementById('agt-fc-renew');        if(z3) z3.outerHTML=_fcRenewHtml();
    _fcSyncSum();
    if(typeof agtLogAccess==='function') agtLogAccess(_FC_SLUG,'Essai reconduit '+_FC_TRIAL_DAYS+' j','\u23F3','commercial');
    showToast('Essai reconduit '+_FC_TRIAL_DAYS+' j \u00b7 un rappel d\u2019appel part vers vous','#3D6B27');
  }catch(e){
    var code=String((e&&(e.code||''))||''), msg=String((e&&e.message)||'');
    showToast(/failed-precondition/.test(code)||/reconduit/i.test(msg)
      ? 'D\u00e9j\u00e0 reconduit une fois \u2014 le serveur refuse la seconde.'
      : 'Échec : '+(msg||code||'inconnue'), '#E07060');
    // On REPEINT le bloc depuis l'etat, sans supposer que rien n'a bouge cote serveur.
    var z4=document.getElementById('agt-fc-renew');
    if(z4) z4.outerHTML=_fcRenewHtml(); else if(btn){ btn.disabled=false; btn.textContent=lib; }
  }
};

function _fcTrialExpMs(fc){
  if(fc.trialExp>0) return fc.trialExp;
  if(fc.trialDays>0 && fc.activatedAt){ var t=Date.parse(fc.activatedAt); if(!isNaN(t)) return t+fc.trialDays*86400000; }
  return 0;
}
function _fcTrialLeft(fc){ var e=_fcTrialExpMs(fc); return e>0?Math.max(0,Math.ceil((e-Date.now())/86400000)):0; }
function _fcTrialFmt(ms){ try{ return new Date(ms).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}); }catch(e){ return ''; } }
function _fcTrialStatusHtml(fc){
  function box(bg,bd,icbg,ic,tcol,scol,title,sub){
    return '<div id="agt-fc-trial-status" style="background:'+bg+';border:1px solid '+bd+';border-radius:11px;padding:11px 13px;margin:0 0 15px;display:flex;align-items:center;gap:10px">'
      +'<div style="width:30px;height:30px;border-radius:8px;background:'+icbg+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:var(--pt-sm,16px)">'+ic+'</div>'
      +'<div style="flex:1;min-width:0"><div style="font-size:var(--pt-txt,13px);font-weight:600;color:'+tcol+'">'+title+'</div>'
      +(sub?('<div style="font-size:var(--pt-micro,11px);color:'+scol+';margin-top:2px">'+sub+'</div>'):'')+'</div></div>';
  }
  var exp=_fcTrialExpMs(fc), now=Date.now();
  if(exp>0){
    if(exp<=now) return box('rgba(224,112,96,0.08)','rgba(224,112,96,0.28)','rgba(224,112,96,0.15)','','#F0B4A8','rgba(240,180,168,0.7)','Essai expiré le '+_fcTrialFmt(exp),'client en lecture seule — régler un nouvel essai ou convertir');
    var left=Math.max(0,Math.ceil((exp-now)/86400000));
    var lbl=left>0?('Essai en cours · <span style="color:#E8C860">J-'+left+'</span>'):('Essai en cours · <span style="color:#E8C860">expire aujourd&#39;hui</span>');
    // ★ « J-4 » ne dit pas ce qui se passe apres. La suite depend d'un seul fait : la
    //   reconduction unique est-elle encore disponible.
    var _rn=(typeof fc.trialRenewals==='number')?fc.trialRenewals:0;
    var _suite=(_rn<1)?' · reconduction encore possible':' · reconduction déjà utilisée';
    return box('rgba(201,168,76,0.08)','rgba(201,168,76,0.28)','rgba(201,168,76,0.15)','','#E8D89A','rgba(232,200,96,0.65)',lbl,'expire le '+_fcTrialFmt(exp)+_suite);
  }
  if(fc.trialDays>0){
    if(fc.cliStatus==='pending') return box('rgba(139,92,246,0.08)','rgba(196,181,253,0.22)','rgba(139,92,246,0.15)','','#C4B5FD','rgba(196,181,253,0.6)','Essai de '+fc.trialDays+' j','démarre à la 1ère connexion du client');
    return box('rgba(139,92,246,0.08)','rgba(196,181,253,0.22)','rgba(139,92,246,0.15)','','#C4B5FD','rgba(196,181,253,0.6)','Essai de '+fc.trialDays+' j accordés','date d&#39;expiration inconnue — ré-enregistrer pour suivre le décompte');
  }
  // ⚠️ Un domaine installe « essai a la remise » n'a ni trial_until ni trialDays : sans
  //    cette branche, la fiche annoncerait un ABONNEMENT ACTIF d'un client qui n'a rien
  //    signe. Un ecran qui se trompe d'etat vaut moins qu'un ecran muet.
  if(fc.trialPrevu>0) return box('rgba(201,168,76,0.08)','rgba(201,168,76,0.28)','rgba(201,168,76,0.15)','','#E8D89A','rgba(232,200,96,0.65)','Essai de '+fc.trialPrevu+' j prévu','non démarré — acc&#232;s complet en attendant ; il part &#224; la remise, ou en enregistrant la fiche ci-dessous');
  return box('rgba(61,109,39,0.08)','rgba(134,239,172,0.22)','rgba(61,109,39,0.18)','','#B7E8C4','rgba(183,232,196,0.6)','Abonnement actif','pas d&#39;essai en cours');
}

function _fcSecAbo(){
  var plan=_FC.plan||'domaine', td=_FC.trialDays||0;
  var tLeft=_fcTrialLeft(_FC), tdInput=tLeft>0?tLeft:td;
  if(_FC.featOv===undefined){ _FC.featOv={}; var f=(_FC.config&&_FC.config.features)||{}; ['tracteur','planning','pilotage','cave','reserve'].forEach(function(k){ if(f[k]===true||f[k]===false) _FC.featOv[k]=f[k]; }); }
  function opt(v,l){ return '<option value="'+v+'"'+(plan===v?' selected':'')+'>'+l+'</option>'; }
  var css='<style>'
    +'#agt-fc-mods .agt-mod-row{display:flex;align-items:center;gap:11px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:10px 12px;margin-bottom:8px}'
    +'#agt-fc-mods .agt-mod-row.on{border-color:rgba(139,92,246,0.4)}'
    +'#agt-fc-mods .agt-mod-emoji{font-size:18px;width:24px;text-align:center;flex-shrink:0}'
    +'#agt-fc-mods .agt-mod-txt{flex:1;min-width:0}'
    +'#agt-fc-mods .agt-mod-name{font-size:var(--pt-txt,13px);font-weight:600;color:#fff}'
    +'#agt-fc-mods .agt-mod-sub{font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px}'
    +'#agt-fc-mods .agt-b{display:inline-block;font-size:var(--pt-nano,9.5px);font-weight:600;padding:2px 8px;border-radius:999px;margin-top:5px}'
    +'#agt-fc-mods .agt-b-herit{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5)}'
    +'#agt-fc-mods .agt-b-on{background:rgba(139,92,246,0.14);border:1px solid rgba(139,92,246,0.3);color:#C4B5FD}'
    +'#agt-fc-mods .agt-b-off{background:rgba(224,112,96,0.12);border:1px solid rgba(224,112,96,0.3);color:#E07060}'
    +'#agt-fc-mods .agt-mod-reset{font-size:var(--pt-nano,9.5px);color:#C4B5FD;cursor:pointer;text-decoration:underline;margin-left:8px;opacity:.75}'
    +'#agt-fc-mods .agt-sw{position:relative;width:42px;height:25px;flex-shrink:0;cursor:pointer;display:inline-block}'
    +'#agt-fc-mods .agt-sw input{opacity:0;width:0;height:0;position:absolute}'
    +'#agt-fc-mods .agt-sw-tr{position:absolute;inset:0;border-radius:999px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.14);transition:.18s}'
    +'#agt-fc-mods .agt-sw-kn{position:absolute;top:2px;left:2px;width:19px;height:19px;border-radius:50%;background:#cfc7dd;transition:.18s}'
    +'#agt-fc-mods .agt-sw input:checked + .agt-sw-tr{background:linear-gradient(135deg,#7C4DD6,#8B5CF6);border-color:transparent}'
    +'#agt-fc-mods .agt-sw input:checked + .agt-sw-tr .agt-sw-kn{transform:translateX(17px);background:#fff}'
    +'</style>';
  return css
    +_fcHint('La <b>formule</b> (claim, posée sur tous les membres) reste le socle commercial. Les <b>cases</b> affinent module par module : seuls les <b>écarts</b> à la formule sont enregistrés — changer la formule refait suivre les modules non forcés.')
    +_fcTrialStatusHtml(_FC)
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
    +'<div style="margin-bottom:13px"><div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);margin-bottom:6px">Formule (= socle modules)</div><select id="agt-fc-plan" onchange="_fcModPlanChange()" style="'+_FC_SEL_STYLE+'">'+opt('essentiel','Essentiel — Vigne · Journal · Météo')+opt('vigneron','Vigneron — + Tracteur · Phyto')+opt('domaine','Domaine — + Planning · Pilotage · Cave · Réserve')+'</select></div>'
    +'<div style="margin-bottom:13px"><div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);margin-bottom:6px">Régler l&#39;essai — jours dès aujourd&#39;hui</div><input id="agt-fc-trial" type="number" min="0" max="90" value="'+tdInput+'" style="'+_FC_INP_STYLE+'"><div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:5px;line-height:1.4">Enregistrer repositionne l&#39;expiration à aujourd&#39;hui + N jours. <b style="color:rgba(255,255,255,0.45)">0</b> = convertir en payant.</div></div>'
    +'</div>'
    +_fcRenewHtml()
    +'<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);margin:8px 0 9px">Modules visibles par ce client</div>'
    +'<div id="agt-fc-mods">'+_fcModsHtml()+'</div>';
}

// ── Rendu ───────────────────────────────────────────────────────────────────
function _fcRenderTabs(){
  var el=document.getElementById('agt-fiche-tabs'); if(!el) return;
  el.innerHTML=_FC_TABS.map(function(tb){
    var id=tb[0], onn=(id===_FC_TAB), n='';
    if(['parcelles','membres','taches','tracteurs_list','saisons'].indexOf(id)>=0) n=' <span style="font-size:10px;background:rgba(255,255,255,0.1);border-radius:7px;padding:0 6px;min-width:18px;text-align:center;display:inline-block">'+_fcActiveCount(id)+'</span>';
    return '<button onclick="_fcTab(\''+id+'\')" style="flex-shrink:0;padding:9px 13px;border-radius:11px;font-size:var(--pt-txt,13px);font-weight:'+(onn?'600':'500')+';cursor:pointer;white-space:nowrap;font-family:var(--font-ui,Outfit,sans-serif);border:1px solid '+(onn?'rgba(139,92,246,0.4)':'rgba(255,255,255,0.06)')+';background:'+(onn?'rgba(139,92,246,0.15)':'rgba(255,255,255,0.04)')+';color:'+(onn?'#C4B5FD':'rgba(255,255,255,0.6)')+'">'+tb[1]+n+'</button>';
  }).join('');
}
function _fcRenderSection(){
  var body=document.getElementById('agt-fiche-body'); if(!body) return;
  var t=_FC_TAB, html='';
  if(t==='dom') html=_fcSecDom();
  else if(t==='parcelles') html=_fcSecParc();
  else if(t==='membres') html=_fcSecMbr();
  else if(t==='taches') html=_fcSecTache();
  else if(t==='tracteurs_list') html=_fcSecTrac();
  else if(t==='saisons') html=_fcSecSais();
  else if(t==='abo') html=_fcSecAbo();
  body.innerHTML='<div style="font-size:var(--pt-micro,11px);letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,0.35);font-weight:600;margin:2px 0 14px">'+_fcSecTitle(t)+'</div>'+html;
  // ★ GTFIX-2 (D1) : « Enregistrer » n'existe que là où la fiche écrit encore (Domaine, Abonnement).
  var sb=document.getElementById('agt-fc-save'); if(sb) sb.style.display=(t==='dom'||t==='abo')?'':'none';
}
function _fcSyncSum(){
  var s=document.getElementById('agt-fc-sum'); if(!s) return;
  var plan=_FC.plan||'domaine';
  var _tExp=_fcTrialExpMs(_FC), _tLeft=_fcTrialLeft(_FC), _tNow=Date.now();
  var planL={essentiel:'Essentiel',vigneron:'Vigneron',domaine:'Domaine'}[plan]||plan;
  function chip(bg,bd,col,txt){ return '<span style="font-size:var(--pt-micro,11px);font-weight:600;padding:4px 10px;border-radius:999px;border:1px solid '+bd+';background:'+bg+';color:'+col+'">'+txt+'</span>'; }
  var h=chip('rgba(139,92,246,0.14)','rgba(139,92,246,0.28)','#C4B5FD',planL);
  if(_tLeft>0) h+=chip('rgba(201,168,76,0.12)','rgba(201,168,76,0.3)','#C9A84C','Essai · J-'+_tLeft);
  else if(_tExp>0 && _tExp<=_tNow) h+=chip('rgba(224,112,96,0.12)','rgba(224,112,96,0.3)','#E88F82','Essai expiré');
  else if(_FC.trialDays>0) h+=chip('rgba(139,92,246,0.10)','rgba(139,92,246,0.28)','#C4B5FD','Essai '+_FC.trialDays+'j · à venir');
  else if(_FC.trialPrevu>0) h+=chip('rgba(201,168,76,0.12)','rgba(201,168,76,0.3)','#C9A84C','Essai '+_FC.trialPrevu+'j · non démarré');
  h+=chip('rgba(255,255,255,0.04)','rgba(255,255,255,0.08)','rgba(255,255,255,0.6)',_fcActiveCount('parcelles')+' parcelles');
  h+=chip('rgba(255,255,255,0.04)','rgba(255,255,255,0.08)','rgba(255,255,255,0.6)',(_FC.membres||[]).length+' membres');
  try{ var _pd=_FC_PLANDEF&&_FC_PLANDEF[plan]; var _nf=_FC.featOv?Object.keys(_FC.featOv).filter(function(k){return _pd&&_FC.featOv[k]!==_pd[k];}).length:0; if(_nf>0) h+=chip('rgba(139,92,246,0.10)','rgba(139,92,246,0.28)','#C4B5FD',_nf+' module'+(_nf>1?'s':'')+' forcé'+(_nf>1?'s':'')); }catch(_e){ if(window._mvAvale) window._mvAvale(_e,'admin-gt.js/chip'); }
  s.innerHTML=h;
}

window._fcTab=function(id){ _FC_TAB=id; _fcRenderTabs(); _fcRenderSection(); };
// ★ GTFIX-2 (§511, D1) — « Modifier dans la préparation » : la fiche se ferme, la préparation s'ouvre
//   (avec sa feuille de vérification, sa trace au journal d'accès et son bandeau).
window._fcPreparer=function(){
  var s=_FC_SLUG, ov=document.getElementById('agt-fiche-ov');
  if(ov) ov.remove();
  if(s && typeof agtPrepOuvrir==='function') agtPrepOuvrir(s);
};

// ★ GTFIX-1 (§510) — UNE règle pour le nom et les coordonnées d'un domaine, appliquée à la config RELUE.
//   Avant : `fbAdminRead(…) || {}` — une lecture ratée remplaçait TOUTE la config du domaine par trois
//   champs ; et la fenêtre Config écrivait 0 pour une case vide (`parseFloat(…) || 0`, GT-B17), là où la
//   fiche › Domaine n'y touchait pas. Une case vide ne touche plus à rien, dans les deux écrans.
// ★ GTFIX-4 (§513) : la fenêtre Config est partie — il ne reste qu'un écran, la fiche › Domaine (GT-B17).
function _agtMutConfigDomaine(cfg, existe, nom, lat, lon){
  if (cfg === undefined){ if (existe) throw new Error('config illisible'); cfg = {}; }
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) throw new Error('config illisible');
  cfg.domaine_nom = nom;
  if (!isNaN(lat)) cfg.lat = lat;
  if (!isNaN(lon)) cfg.lon = lon;
  return cfg;
}
window._fcSaveDom=async function(){
  var nom=(document.getElementById('agt-fc-nom')||{value:''}).value.trim();
  var lat=parseFloat((document.getElementById('agt-fc-lat')||{value:''}).value);
  var lon=parseFloat((document.getElementById('agt-fc-lon')||{value:''}).value);
  if(!nom){ showToast('Nom du domaine requis','#E07060'); return; }
  try{
    if(!window.fbAdminMaj) throw new Error('fbAdminMaj indisponible');
    var _rd=await window.fbAdminMaj(_FC_SLUG,'config',function(cfg,existe){ return _agtMutConfigDomaine(cfg,existe,nom,lat,lon); });
    _FC.config=_rd.valeur;
    if(typeof agtLogAccess==='function') agtLogAccess(_FC_SLUG,'Fiche \u00b7 domaine enregistr\u00e9','\uD83D\uDCBE');
    showToast('Domaine enregistr\u00e9 \u2192 '+_FC_SLUG,'#3D6B27');
  }catch(e){ showToast('Erreur : '+((e&&(e.message||e.code))||'inconnue'),'#E07060'); }
};
window._fcSaveAbo=async function(){
  var plan=(document.getElementById('agt-fc-plan')||{value:'domaine'}).value;
  var td=parseInt((document.getElementById('agt-fc-trial')||{value:'0'}).value,10); if(isNaN(td)) td=0;
  td=Math.max(0,Math.min(90,td));
  if(['essentiel','vigneron','domaine'].indexOf(plan)<0) plan='domaine';
  try{
    if(!window._fbSetTenantPlan) throw new Error('_fbSetTenantPlan indisponible');
    var _pres=await window._fbSetTenantPlan(_FC_SLUG,plan,td);
    var _texp=(_pres&&typeof _pres.trialUntil==='number')?_pres.trialUntil:(td>0?Date.now()+td*86400000:0);
    // ★ GTFIX-1 (§510) : le registre relu et écrit d'un bloc (GT-B01) — l'ancienne version écrivait
    //   `slugs: []` si la lecture de `tenants` échouait.
    await _agtMajRegistre(function(clients){
      clients[_FC_SLUG]=Object.assign({},clients[_FC_SLUG]||{},{plan:plan,trialDays:td,trialExp:_texp});
    });
    try{
      // Les modules : appliqués à la config RELUE, plus à la copie lue à l'ouverture de la fiche.
      if(!window.fbAdminMaj) throw new Error('fbAdminMaj indisponible');
      var _rf=await window.fbAdminMaj(_FC_SLUG,'config',function(_cfg,existe){
        if(_cfg===undefined){ if(existe) throw new Error('config illisible'); _cfg={}; }
        if(!_cfg||typeof _cfg!=='object'||Array.isArray(_cfg)) throw new Error('config illisible');
        var _feats=(_cfg.features&&typeof _cfg.features==='object')?Object.assign({},_cfg.features):{};
        ['tracteur','planning','pilotage','cave','reserve'].forEach(function(k){
          var _hasOv=_FC.featOv&&(k in _FC.featOv)&&_FC.featOv[k]!==_FC_PLANDEF[plan][k];
          if(_hasOv) _feats[k]=_FC.featOv[k]; else delete _feats[k];
        });
        if(Object.keys(_feats).length) _cfg.features=_feats; else delete _cfg.features;
        return _cfg;
      });
      _FC.config=_rf.valeur;
    }catch(_e){ _agtEchecEcriture(_e,'Modules du domaine'); }
    _FC.plan=plan; _FC.trialDays=td; _FC.trialExp=_texp;
    if(_FC_TAB==='abo'){ var _tsEl=document.getElementById('agt-fc-trial-status'); if(_tsEl) _tsEl.outerHTML=_fcTrialStatusHtml(_FC); var _tiEl=document.getElementById('agt-fc-trial'); if(_tiEl) _tiEl.value=_fcTrialLeft(_FC); }
    _fcSyncSum();
    if(typeof agtLogAccess==='function') agtLogAccess(_FC_SLUG,'Fiche \u00b7 abonnement '+plan,'\uD83D\uDCB3','commercial');
    showToast('Abonnement : '+plan+(td>0?' \u00b7 essai '+td+'j':'')+' \u2192 tous les membres','#3D6B27');
  }catch(e){ showToast('Erreur : '+((e&&(e.message||e.code))||'inconnue'),'#E07060'); }
};
window._fcSaveCurrent=function(){
  if(_FC_TAB==='dom') return _fcSaveDom();
  if(_FC_TAB==='abo') return _fcSaveAbo();
  return _fcPreparer();   // ★ GTFIX-2 (D1) : les autres onglets sont en lecture seule
};

// ── Chargement + overlay ────────────────────────────────────────────────────
async function _fcLoad(slug){
  var body=document.getElementById('agt-fiche-body');
  if(body) body.innerHTML='<div style="text-align:center;padding:50px;color:rgba(255,255,255,0.3);font-size:var(--pt-txt,13px)">Chargement\u2026</div>';
  var R=window.fbAdminRead;
  var cfg=R?await R(slug,'config'):null;
  var prc=R?await R(slug,'parcelles'):null;
  var mbr=R?await R(slug,'membres'):null;
  var tch=R?await R(slug,'taches'):null;
  var trc=R?await R(slug,'tracteurs_list'):null;
  var sai=R?await R(slug,'saisons'):null;
  var _cliAll=await _agtReadClients();
  var cli=(_cliAll&&_cliAll[slug])?_cliAll[slug]:{};
  _FC={
    config:(cfg&&typeof cfg==='object')?cfg:{},
    parcelles:_fcArr(prc),
    membres:_fcArr(mbr),
    taches:_fcArr(tch),
    tracteurs_list:_fcArr(trc),
    saisons:_fcArr(sai),
    plan:(['essentiel','vigneron','domaine'].indexOf(cli.plan)>=0)?cli.plan:'domaine',
    trialDays:(typeof cli.trialDays==='number')?cli.trialDays:0,
    trialPrevu:(typeof cli.trialPrevu==='number')?cli.trialPrevu:0,
    trialRenewals:(typeof cli.trialRenewals==='number')?cli.trialRenewals:0,
    trialExp:(typeof cli.trialExp==='number')?cli.trialExp:0,
    cliStatus:(typeof cli.status==='string')?cli.status:'',
    activatedAt:(typeof cli.activated_at==='string')?cli.activated_at:''
  };
  _fcRenderTabs(); _fcRenderSection(); _fcSyncSum();
}
window._fcReload=function(){ if(_FC_SLUG){ _fcLoad(_FC_SLUG); showToast('Recharg\u00e9 depuis Firestore','#1A4A7A'); } };

window.agtShowFiche=async function(slug){
  _FC_SLUG=slug; _FC_TAB='dom';
  var ex=document.getElementById('agt-fiche-ov'); if(ex) ex.remove();
  var ov=document.createElement('div'); ov.id='agt-fiche-ov';
  ov.style.cssText='position:fixed;inset:0;background:radial-gradient(120% 80% at 50% -10%,#16102a 0%,#0F0A1A 45%,#0A0812 100%);z-index:9999;display:flex;flex-direction:column;font-family:var(--font-ui,Outfit,sans-serif)';
  ov.innerHTML=
     '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px 13px;border-bottom:1px solid rgba(139,92,246,0.15)">'
    +'<div style="display:flex;align-items:center;gap:11px;min-width:0"><div style="width:34px;height:34px;border-radius:10px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.28);display:flex;align-items:center;justify-content:center;font-size:var(--pt-sm,16px);flex-shrink:0">\uD83D\uDDC2\uFE0F</div>'
    +'<div><div style="font-size:15px;font-weight:600;color:#fff">Fiche client</div><div style="font-size:var(--pt-micro,11px);color:rgba(196,181,253,0.6);margin-top:2px;font-family:monospace">'+_escHtml(slug)+'</div></div></div>'
    +'<button onclick="document.getElementById(\'agt-fiche-ov\').remove()" style="min-width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:var(--pt-sm,16px);cursor:pointer">\u2715</button></div>'
    +'<div id="agt-fc-sum" style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:11px 20px;border-bottom:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.18)"></div>'
    +'<div id="agt-fiche-tabs" style="display:flex;gap:6px;overflow-x:auto;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05)"></div>'
    +'<div id="agt-fiche-body" style="flex:1;overflow-y:auto;padding:18px 20px 96px"><div style="text-align:center;padding:50px;color:rgba(255,255,255,0.3);font-size:var(--pt-txt,13px)">Chargement\u2026</div></div>'
    +'<div style="position:fixed;left:0;right:0;bottom:0;padding:14px 20px calc(14px + env(safe-area-inset-bottom));background:linear-gradient(0deg,#0A0812 65%,transparent);display:flex;justify-content:center">'
    +'<div style="max-width:780px;width:100%;display:flex;gap:10px;justify-content:flex-end">'
    +'<button onclick="_fcReload()" style="padding:12px 18px;border-radius:12px;font-size:var(--pt-txt,13px);font-weight:600;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6)">\u21ba Recharger</button>'
    +'<button id="agt-fc-save" onclick="_fcSaveCurrent()" style="padding:12px 22px;border-radius:12px;font-size:var(--pt-txt,13px);font-weight:600;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);border:none;background:linear-gradient(135deg,#7C4DD6,#8B5CF6);color:#fff;box-shadow:0 6px 18px rgba(139,92,246,0.3)">\uD83D\uDCBE Enregistrer la section</button>'
    +'</div></div>';
  document.body.appendChild(ov);
  if(typeof agtLogAccess==='function') agtLogAccess(slug,'Ouverture Fiche client','\uD83D\uDDC2\uFE0F');
  await _fcLoad(slug);
};


// ════ EXPOSITION GLOBALE ════
function _agtCguHtml(cfg, slug){
  // SEC-DPA — l'acceptation CGU + DPA se fait AUTOMATIQUEMENT à la 1ère ouverture par le
  // client (fail-closed : tout admin sans preuve à jour est bloqué par l'écran d'acceptation).
  // Plus aucun geste à armer côté GT. La preuve vit hors tenant (_mv_signatures/{slug}) et un
  // reçu horodaté part par e-mail (au client + à GUERETTECH) à chaque acceptation.
  return '<div style="margin:14px 0 10px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08)">'
    +'<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);margin-bottom:6px">Acceptation CGU + DPA</div>'
    +'<div style="font-size:var(--pt-txt,13px);color:rgba(255,255,255,0.7);line-height:1.5">Automatique &#224; la 1<sup>re</sup> ouverture par le client (bloquant). Un re&#231;u horodat&#233; est envoy&#233; par e-mail &#224; chaque acceptation.</div>'
    +'</div>';
}
window.agtShowParcelles  = agtShowParcelles;
window.agtCopyParcNoms   = agtCopyParcNoms;
window.agtExportParcJson = agtExportParcJson;
// ═══════════════════════════════════════════════════════════════════════════
// INSTALLER UN DOMAINE DEPUIS LE DOSSIER CLIENT
// ═══════════════════════════════════════════════════════════════════════════
// Le formulaire d'essai écrit déjà chaque demande dans `leads` (submitLead). Cette
// donnée dormait : personne ne la relisait, et l'installation se faisait en retapant à
// la main ce que le client avait déjà répondu. Cet écran ferme le dernier mètre.
//
// Le client ne voit JAMAIS cet écran : il reçoit une application déjà debout et choisit
// son mot de passe à la première connexion (mustChangePwd → completeFirstLogin).
//
// L'écran est trié par CE QUI EMPÊCHE L'APPLICATION DE S'OUVRIR, pas par thème. Les
// quatre verrous sont ceux d'obValidateStep : un nom, un compte administrateur, au moins
// une parcelle, une campagne avec des travaux. Le reste attend la conversion.
//
// ⚠️ Tout est construit en JS (overlay + CSS injectés) : ce lot ne touche NI index.html
//    NI styles.css, donc aucun bump APP ni SW.
// `noms` : la liste des parcelles telle que le DOMAINE les ecrit, collee par GT.
// Chaque entree porte `pris` = index de la parcelle a laquelle elle est attribuee,
// -1 si elle attend encore. `form` : les champs deja tapes, preserves d'un rendu a
// l'autre (sans lui, retirer une parcelle vidait le nom et l'e-mail deja saisis).
// `per` : les periodes de la campagne. Vide = une seule campagne du 1er janvier au
// 31 decembre, exactement comme avant ce lot.
var _agtIns = { leads: [], sel: -1, parc: [], creds: null, busy: false, geo: null, noms: [], form: null, per: [], perOuv: -1, cfg: null, mach: [] };

// Aire d'un polygone à la surface du globe, en hectares. Formule sphérique classique
// (R = rayon équatorial WGS84) : suffisante très largement devant l'imprécision d'un
// contour de vigne dessiné à la main. Validée par exécution : un rectangle de 100 × 50 m
// tombe sur 0,5000 ha, et le sens de parcours (horaire ou non) ne change pas le résultat.
// ⚠️ Une surface calculée sur un contour N'EST PAS une surface cadastrale — tournières,
//    bordures, tracé approximatif. Elle est PROPOSÉE, jamais imposée.
function _agtGeoArea(pts) {
  if (!Array.isArray(pts) || pts.length < 3) return 0;
  var R = 6378137, s = 0, n = pts.length, D = Math.PI / 180;
  for (var i = 0; i < n; i++) {
    var p1 = pts[i], p2 = pts[(i + 1) % n];
    if (!p1 || !p2) return 0;
    s += (p2.lng - p1.lng) * D * (2 + Math.sin(p1.lat * D) + Math.sin(p2.lat * D));
  }
  return Math.abs(s * R * R / 2) / 10000;
}

// Slug depuis le nom du domaine — même règle que saveAddTenant, pour que les deux
// chemins produisent exactement le même identifiant.
function _agtInsSlug(v) {
  return String(v || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function _agtInsCss() {
  if (document.getElementById('agt-ins-css')) return;
  var st = document.createElement('style');
  st.id = 'agt-ins-css';
  st.textContent = [
    '#agt-ins-ov{position:fixed;inset:0;z-index:2500;background:rgba(10,5,8,.9);display:none;',
    '  align-items:flex-start;justify-content:center;overflow-y:auto;padding:18px;',
    '  padding-bottom:calc(18px + env(safe-area-inset-bottom,0px))}',
    '#agt-ins-ov.on{display:flex}',
    '.agi-card{background:#141A20;border:1px solid rgba(240,226,200,.14);border-radius:16px;',
    '  width:100%;max-width:760px;padding:22px;color:#F0E2C8;font-family:var(--font-ui,Outfit,sans-serif)}',
    '.agi-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:18px}',
    '.agi-hd h3{font-family:var(--font-titre,Cormorant Garamond,Georgia,serif);font-size:26px;margin:0;font-weight:600}',
    '.agi-hd p{margin:2px 0 0;font-size:var(--pt-txt,13px);color:rgba(240,226,200,.45)}',
    '.agi-x{background:none;border:1px solid rgba(240,226,200,.16);color:#F0E2C8;border-radius:8px;',
    '  width:36px;height:36px;font-size:15px;cursor:pointer;flex:none}',
    '.agi-ch{font-size:var(--pt-micro,11px);letter-spacing:1.5px;text-transform:uppercase;',
    '  color:rgba(240,226,200,.35);font-weight:600;margin:20px 0 10px}',
    '.agi-dos{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;margin-bottom:4px}',
    '.agi-d{flex:none;min-width:180px;text-align:left;background:rgba(255,255,255,.04);',
    '  border:1px solid rgba(240,226,200,.12);border-radius:10px;padding:10px 12px;color:inherit;',
    '  font-family:inherit;font-size:var(--pt-txt,13px);cursor:pointer}',
    '.agi-d:hover{background:rgba(255,255,255,.08)}',
    '.agi-d.on{border-color:rgba(201,168,76,.55);background:rgba(201,168,76,.1)}',
    '.agi-d b{display:block;font-weight:600;font-size:13.5px}',
    '.agi-d span{display:block;font-size:var(--pt-lbl,12px);color:rgba(240,226,200,.45);margin-top:2px}',
    '.agi-vr{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px}',
    '.agi-v{flex:1;min-width:110px;border:1px solid rgba(240,226,200,.12);border-radius:9px;',
    '  padding:8px 10px;background:rgba(255,255,255,.02);border-left:3px solid rgba(240,226,200,.25)}',
    '.agi-v.ok{border-left-color:#3D6B27}.agi-v.no{border-left-color:#B85A1A}',
    '.agi-v .n{font-size:var(--pt-micro,12px);font-weight:600}',
    '.agi-v .s{font-size:var(--pt-micro,11px);color:rgba(240,226,200,.45);margin-top:1px}',
    '.agi-v.ok .s{color:#9BC77E}.agi-v.no .s{color:#E0A46A}',
    '.agi-f{display:grid;grid-template-columns:130px 1fr;gap:9px 12px;align-items:center;margin-bottom:10px}',
    '.agi-f > label{font-size:var(--pt-txt,13px);color:rgba(240,226,200,.5)}',
    '.agi-f input,.agi-f select{width:100%;background:rgba(255,255,255,.05);',
    '  border:1px solid rgba(240,226,200,.12);border-radius:8px;padding:9px 11px;color:#F0E2C8;',
    '  font-family:inherit;font-size:var(--pt-sm,16px)}',
    '.agi-f input:focus,.agi-f select:focus{outline:2px solid rgba(201,168,76,.5);outline-offset:1px}',
    '.agi-src{font-size:var(--pt-micro,11px);color:#C9A84C;margin-top:4px}',
    '.agi-pl{max-height:210px;overflow-y:auto;border:1px solid rgba(240,226,200,.12);',
    '  border-radius:9px;margin-top:10px}',
    '.agi-pr{display:grid;grid-template-columns:1fr 96px 30px;gap:8px;align-items:center;',
    '  padding:6px 10px;border-bottom:1px solid rgba(240,226,200,.06);font-size:var(--pt-txt,13px)}',
    '.agi-pr:last-child{border-bottom:none}',
    '.agi-pr input{background:rgba(255,255,255,.05);border:1px solid rgba(240,226,200,.12);',
    '  border-radius:6px;padding:5px 7px;color:#C9A84C;font-family:inherit;font-size:var(--pt-sm,16px);',
    '  width:100%;text-align:right}',
    '.agi-pd{background:none;border:none;color:rgba(240,226,200,.3);font-size:var(--pt-base,14px);cursor:pointer;',
    '  min-height:30px}',
    '.agi-tot{display:flex;justify-content:space-between;font-size:var(--pt-micro,12px);',
    '  color:rgba(240,226,200,.45);padding:8px 10px;background:rgba(255,255,255,.03)}',
    '.agi-b{background:rgba(255,255,255,.05);border:1px solid rgba(240,226,200,.12);color:#F0E2C8;',
    '  font-family:inherit;font-size:var(--pt-txt,13px);border-radius:8px;padding:9px 14px;cursor:pointer;min-height:42px}',
    '.agi-b:hover{background:rgba(255,255,255,.09)}',
    '.agi-b.or{background:rgba(201,168,76,.12);border-color:rgba(201,168,76,.35);color:#C9A84C}',
    '.agi-b.go{background:#3D6B27;border-color:transparent;color:#fff;font-weight:600;font-size:15px;',
    '  width:100%;padding:14px;min-height:52px;margin-top:18px}',
    '.agi-b[disabled]{opacity:.4;cursor:not-allowed}',
    '.agi-w{border-left:3px solid #B85A1A;background:rgba(184,90,26,.09);border-radius:0 8px 8px 0;',
    '  padding:9px 12px;font-size:var(--pt-txt,13px);margin-top:12px;line-height:1.55}',
    '.agi-lu{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(240,226,200,.1);',
    '  border:1px solid rgba(240,226,200,.1);border-radius:10px;overflow:hidden}',
    '.agi-lu > div{background:#141A20;padding:9px 12px}',
    '.agi-lu .k{font-size:var(--pt-micro,11px);text-transform:uppercase;letter-spacing:.8px;color:rgba(240,226,200,.4)}',
    '.agi-lu .v{font-size:13.5px;font-weight:500;margin-top:1px}',
    '.agi-cr{background:rgba(0,0,0,.35);border:1px solid rgba(240,226,200,.12);border-radius:10px;',
    '  padding:12px;margin-bottom:10px}',
    '.agi-cr .k{font-size:var(--pt-lbl,10.5px);letter-spacing:1.2px;text-transform:uppercase;color:rgba(240,226,200,.35)}',
    '.agi-cr .v{font-family:ui-monospace,Menlo,monospace;font-size:var(--pt-sm,16px);color:#C9A84C;margin-top:3px;',
    '  word-break:break-all;user-select:all}',
    '.agi-pw{border-bottom:1px solid rgba(240,226,200,.06)}',
    '.agi-pw:last-child{border-bottom:none}',
    '.agi-pw .agi-pr{border-bottom:none;padding-bottom:2px}',
    '.agi-pr input.agi-nm{text-align:left;color:#F0E2C8}',
    '.agi-p2{display:flex;gap:7px;align-items:center;flex-wrap:wrap;padding:0 10px 7px}',
    '.agi-p2 select,.agi-p2 input{background:rgba(255,255,255,.05);color:#F0E2C8;',
    '  border:1px solid rgba(240,226,200,.12);border-radius:6px;padding:5px 7px;',
    '  font-family:inherit;font-size:var(--pt-sm,16px)}',
    '.agi-p2 select{flex:1 1 150px;min-width:0}',
    '.agi-p2 input{flex:0 1 130px;min-width:0}',
    '.agi-p2 .o{font-size:var(--pt-lbl,12px);color:rgba(240,226,200,.3);white-space:nowrap;',
    '  overflow:hidden;text-overflow:ellipsis;flex:1 1 90px}',
    '.agi-ta{width:100%;box-sizing:border-box;min-height:86px;resize:vertical;',
    '  background:rgba(255,255,255,.05);border:1px solid rgba(240,226,200,.12);',
    '  border-radius:8px;padding:9px 11px;color:#F0E2C8;font-family:inherit;',
    '  font-size:var(--pt-sm,16px);margin-top:10px;line-height:1.5}',
    '.agi-rz{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}',
    '.agi-bil{font-size:var(--pt-txt,13px);color:rgba(240,226,200,.5);margin-top:10px;line-height:1.55}',
    '.agi-bil b{color:#C9A84C;font-weight:600}',
    '@media(max-width:600px){.agi-f{grid-template-columns:1fr;gap:3px}.agi-lu{grid-template-columns:1fr}}',
    '@media(max-width:600px){.agi-pl{max-height:none}.agi-pr{grid-template-columns:1fr 78px 28px}}'
  ].join('');
  document.head.appendChild(st);
}

function _agtInsHost() {
  _agtInsCss();
  var ov = document.getElementById('agt-ins-ov');
  if (ov) return ov;
  ov = document.createElement('div');
  ov.id = 'agt-ins-ov';
  ov.innerHTML = '<div class="agi-card" id="agt-ins-card"></div>';
  document.body.appendChild(ov);
  return ov;
}

// Ouvre l'écran et charge les dossiers. La lecture passe par gtLeads (GT only) : la
// collection `leads` est fermée à tout client par les règles.
async function agtOpenInstall() {
  var ov = _agtInsHost();
  ov.classList.add('on');
  _agtIns.creds = null; _agtIns.busy = false;
  document.getElementById('agt-ins-card').innerHTML =
    '<p style="text-align:center;color:rgba(240,226,200,.45);padding:40px 0">Lecture des dossiers\u2026</p>';
  try {
    var r = await window.fbCallFn('gtLeads', {}, { timeout: 20000 });
    _agtIns.leads = (r && Array.isArray(r.leads)) ? r.leads : [];
  } catch (e) {
    _agtIns.leads = [];
    showToast('Dossiers illisibles : ' + (e.message || e.code || 'erreur'), '#B85A1A');
  }
  _agtIns.sel = -1; _agtIns.parc = []; _agtIns.geo = null; _agtIns.noms = []; _agtIns.form = null; _agtIns.per = []; _agtIns.perOuv = -1; _agtIns.cfg = null; _agtIns.mach = [];
  _agtInsRender();
}

function agtInsClose() {
  var ov = document.getElementById('agt-ins-ov');
  if (ov) ov.classList.remove('on');
}

// Reprend un dossier : le formulaire se remplit, rien n'est retapé.
function agtInsPick(i) {
  _agtIns.sel = i;
  _agtIns.geo = null;
  // Changer de dossier doit REMPLIR les champs depuis ce dossier : on jette la
  // photo des champs precedents, sinon l'ancien client resterait a l'ecran.
  _agtIns.form = null;
  _agtIns.cfg = null;
  _agtInsRender();
  var l = _agtIns.leads[i];
  if (l && (l.ville || l.region)) _agtInsGeo(l.ville || l.region, l.cp);
}

// Géocodage BAN — la commune du dossier donne la position météo. Sans elle, l'assistant
// pose 47.22 / 4.97 (la Bourgogne) EN SILENCE : pour un domaine girondin, 400 km d'erreur
// sans le moindre message. C'est la raison d'être de ce champ.
async function _agtInsGeo(ville, cp) {
  var q = String(ville || '').trim() + (cp ? ' ' + cp : '');
  if (!q) return;
  try {
    var r = await fetch('https://api-adresse.data.gouv.fr/search/?q=' + encodeURIComponent(q) + '&type=municipality&limit=1');
    var d = await r.json();
    var f = (d && d.features && d.features[0]) || null;
    var c = (f && f.geometry && f.geometry.coordinates) || [];
    if (isFinite(c[0]) && isFinite(c[1])) {
      _agtIns.geo = { lat: c[1], lon: c[0], nom: (f.properties && (f.properties.city || f.properties.name)) || q };
      var el = document.getElementById('agtins-geo');
      if (el) el.textContent = 'position trouv\u00e9e : ' + _agtIns.geo.lat.toFixed(4) + ' / ' + _agtIns.geo.lon.toFixed(4);
    }
  } catch (e) {
    window.logError && window.logError({ level: 'info', cat: 'agt-install', msg: 'geocodage commune indisponible' });
  }
}

// Lit le fichier de parcellaire et en tire les parcelles. Les noms sont déjà dans le
// fichier ; jusqu'ici seul le contour était conservé (kml_polygons) et les noms partaient
// à la poubelle. La surface est calculée sur le contour et reste modifiable ligne à ligne.
function agtInsKml(input) {
  var file = input && input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    var polys = _parseKML(e.target.result);
    if (!polys.length) { showToast('Aucun contour trouv\u00e9 dans ce fichier', '#B85A1A'); return; }
    _agtIns.parc = polys.map(function (p) {
      // `nom0` = le nom tel qu'il est dans le fichier. Il ne bouge plus : c'est LUI
      // qu'on compare aux noms du domaine, pour qu'un rapprochement rejoue a l'identique.
      return { nom: p.name, nom0: p.name, commune: '', surface: Math.round(_agtGeoArea(p.pts) * 100) / 100, pts: p.pts };
    });
    _agtIns.kmlName = file.name;
    _agtInsRender();
    showToast('' + _agtIns.parc.length + ' parcelles lues', '#3D6B27');
  };
  reader.onerror = function () { showToast('Fichier illisible', '#B85A1A'); };
  reader.readAsText(file, 'utf-8');
}

// ⚠️ splice decale tous les index suivants : sans ce recalage, un nom du domaine
//    resterait attribue a une parcelle disparue, ou glisserait sur sa voisine.
function agtInsParcDel(i) {
  (_agtIns.noms || []).forEach(function (n) {
    if (n.pris === i) n.pris = -1;
    else if (n.pris > i) n.pris--;
  });
  _agtIns.parc.splice(i, 1);
  _agtInsReRender();
}
function agtInsParcSurf(i, el) {
  var v = parseFloat(String(el.value).replace(',', '.'));
  if (isFinite(v) && v > 0) _agtIns.parc[i].surface = v;
  var t = document.getElementById('agtins-tot');
  if (t) t.textContent = _agtInsSurfTot().toFixed(2) + ' ha au total';
}
function _agtInsSurfTot() {
  return _agtIns.parc.reduce(function (s, p) { return s + (p.surface || 0); }, 0);
}

// ════════ Aligner les noms du fichier sur ceux du domaine ════════════════════
// Cle de comparaison : accents, casse et ponctuation otes. « Les Chaliots » et
// « les chaliots. » sont le meme nom ; « Ilot 12 » ne l'est d'aucun.
function _agtInsKey(s) {
  return String(s == null ? '' : s).trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
// Distance d'edition. Meme patron que le rapprochement de cuvees du Cuvier, recopie
// ici a dessein : c'est de l'arithmetique de chaines, pas une regle metier — aucune
// definition ne peut diverger. La remonter dans utils.js couterait un bump SW pour
// un ecran que le client ne voit jamais.
function _agtInsLev(a, b) {
  if (a === b) return 0;
  var m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  var prev = [], cur = [], i, j;
  for (j = 0; j <= n; j++) prev[j] = j;
  for (i = 1; i <= m; i++) {
    cur[0] = i;
    for (j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
    for (j = 0; j <= n; j++) prev[j] = cur[j];
  }
  return prev[n];
}
// Les nombres d'un nom, zeros de tete otes. « Chaliots 01 » et « Chaliots 1 » portent
// le meme, « Ilot 12 » et « Ilot 13 » non.
function _agtInsNums(k) {
  return (String(k).match(/\d+/g) || []).map(function (x) { return String(parseInt(x, 10)); }).join('.');
}
function _agtInsDist(a, b) {
  var ka = _agtInsKey(a), kb = _agtInsKey(b);
  if (!ka || !kb) return 99;
  if (ka === kb) return 0;
  // ⚠️ Trouve par le harnais : « Parcelle 8 » venait se coller sur « Parcelle 7 » —
  //    une seule lettre d'ecart, donc sous le seuil, alors que ce sont deux vignes
  //    differentes. Un nombre qui change n'est JAMAIS une faute de frappe. On ne
  //    l'apparie plus tout seul ; il reste proposable a la main, en fin de liste.
  if (_agtInsNums(ka) !== _agtInsNums(kb)) return 99;
  if (ka.indexOf(kb) === 0 || kb.indexOf(ka) === 0) return 1;
  return _agtInsLev(ka, kb);
}
// Seuil PROPORTIONNEL a la longueur : une faute de frappe sur un nom court n'a pas
// le meme poids que sur un nom long. Au-dessus, rien n'est impose.
function _agtInsSeuil(a, b) {
  return Math.max(1, Math.floor(Math.min(_agtInsKey(a).length, _agtInsKey(b).length) / 5));
}

// Colle la liste du domaine, puis apparie. GLOUTON : toutes les paires sous le seuil
// sont triees par distance croissante et affectees tant que les deux cotes sont libres.
// Ce qui depasse le seuil n'est PAS attribue — il est propose ligne par ligne.
function agtInsNoms() {
  var el = document.getElementById('agtins-noms');
  var lst = String(el ? el.value : '').split(/[\r\n;]+/).map(function (x) { return x.trim(); }).filter(Boolean);
  if (!lst.length) { showToast('Collez d\u2019abord la liste du domaine', '#B85A1A'); if (el) el.focus(); return; }
  if (!_agtIns.parc.length) { showToast('Lisez d\u2019abord le fichier de parcellaire', '#B85A1A'); return; }
  var vus = {}, noms = [];
  lst.forEach(function (n) { var k = _agtInsKey(n); if (!k || vus[k]) return; vus[k] = 1; noms.push({ nom: n, pris: -1 }); });
  _agtIns.noms = noms;
  _agtIns.parc.forEach(function (p) { p.nom = p.nom0 || p.nom; });
  var paires = [];
  noms.forEach(function (nm, ni) {
    _agtIns.parc.forEach(function (p, pi) {
      var ref = p.nom0 || p.nom, d = _agtInsDist(nm.nom, ref);
      if (d <= _agtInsSeuil(nm.nom, ref)) paires.push({ d: d, ni: ni, pi: pi });
    });
  });
  paires.sort(function (a, b) { return a.d - b.d; });
  var prisP = {}, n = 0;
  paires.forEach(function (x) {
    if (noms[x.ni].pris >= 0 || prisP[x.pi]) return;
    noms[x.ni].pris = x.pi; prisP[x.pi] = 1;
    _agtIns.parc[x.pi].nom = noms[x.ni].nom;
    n++;
  });
  _agtInsReRender();
  showToast(n ? ('\u2705 ' + n + ' nom' + (n > 1 ? 's align\u00e9s' : ' align\u00e9') + ' automatiquement') : 'Aucun nom assez proche \u2014 \u00e0 choisir ligne par ligne', n ? '#3D6B27' : '#B85A1A');
}

function agtInsNomsClear() {
  _agtIns.noms = [];
  _agtIns.parc.forEach(function (p) { p.nom = p.nom0 || p.nom; });
  _agtInsReRender();
}

// Les noms du domaine encore libres, du plus proche au plus lointain de CETTE ligne.
function _agtInsLibres(pi) {
  var p = _agtIns.parc[pi]; if (!p) return [];
  var ref = p.nom0 || p.nom, out = [];
  (_agtIns.noms || []).forEach(function (nm, ni) {
    // Les noms encore libres, PLUS celui deja attribue a cette ligne. Sans ce second
    // cas, le select d'une ligne nommee s'affichait sur « aucun choix » : on ne voyait
    // plus quel nom y etait pose, et corriger un mauvais rapprochement obligeait a
    // repartir des noms du fichier. Trouve par le harnais DOM.
    if (nm.pris < 0 || nm.pris === pi) out.push({ ni: ni, nom: nm.nom, d: _agtInsDist(nm.nom, ref) });
  });
  out.sort(function (a, b) { return a.d - b.d; });
  return out;
}

function _agtInsBilan() {
  var al = 0, li = 0, res = 0;
  (_agtIns.noms || []).forEach(function (n) { if (n.pris >= 0) al++; else li++; });
  _agtIns.parc.forEach(function (p) { if (!p.nom0 || p.nom0 === p.nom) res++; });
  var t = '<b>' + al + '</b> nom' + (al > 1 ? 's' : '') + ' du domaine plac\u00e9' + (al > 1 ? 's' : '')
        + ' \u00b7 <b>' + res + '</b> parcelle' + (res > 1 ? 's' : '') + ' encore au nom du fichier';
  if (li) t += ' \u00b7 <b>' + li + '</b> non attribu\u00e9' + (li > 1 ? 's' : '');
  t += '.';
  if (li) t += ' Les noms restants sont propos\u00e9s ligne par ligne, du plus proche au plus lointain.';
  return t;
}

// Choix a la main. Exclusion mutuelle : un nom du domaine ne sert qu'une fois.
function agtInsPickNom(pi, el) {
  var p = _agtIns.parc[pi]; if (!p) return;
  var ni = parseInt(el && el.value, 10);
  (_agtIns.noms || []).forEach(function (nm) { if (nm.pris === pi) nm.pris = -1; });
  if (isFinite(ni) && _agtIns.noms[ni]) { _agtIns.noms[ni].pris = pi; p.nom = _agtIns.noms[ni].nom; }
  else { p.nom = p.nom0 || p.nom; }
  _agtInsReRender();
}

// ⚠️ Saisie libre : PAS de rendu, sinon le champ perd le focus a chaque frappe.
//    La saisie a le dernier mot ; un nom vide retombe sur celui du fichier.
function agtInsNomSet(i, el) {
  var p = _agtIns.parc[i]; if (!p || !el) return;
  var v = String(el.value || '').trim();
  p.nom = v || (p.nom0 || '');
  if (!v) el.value = p.nom;
}
function agtInsComm(i, el) {
  var p = _agtIns.parc[i]; if (!p || !el) return;
  p.commune = String(el.value || '').trim();
}
// La commune du dossier, posee sur toutes les lignes qui n'en ont pas.
function agtInsCommAll() {
  var v = document.getElementById('agtins-ville');
  var c = String(v ? v.value : '').trim();
  if (!c) { showToast('Renseignez d\u2019abord la commune du domaine', '#B85A1A'); if (v) v.focus(); return; }
  var n = 0;
  _agtIns.parc.forEach(function (p) { if (!String(p.commune || '').trim()) { p.commune = c; n++; } });
  _agtInsReRender();
  showToast(n + ' parcelle' + (n > 1 ? 's' : '') + ' sur ' + c, '#3D6B27');
}

// Un appel de geocodage par commune DISTINCTE, pas un par parcelle. Sans coordonnees,
// la parcelle garde le NOM de sa commune : l'etiquette reste juste, seul le repere de
// secteur manque sur la carte — rien ne casse.
async function _agtInsGeoComm() {
  var out = {}, cles = [];
  _agtIns.parc.forEach(function (p) {
    var c = String(p.commune || '').trim(); if (!c) return;
    var k = c.toLowerCase();
    if (!out[k]) { out[k] = { nom: c }; cles.push(k); }
  });
  for (var i = 0; i < cles.length; i++) {
    var k = cles[i];
    try {
      var r = await fetch('https://api-adresse.data.gouv.fr/search/?q=' + encodeURIComponent(out[k].nom) + '&type=municipality&limit=1');
      var d = await r.json();
      var f = (d && d.features && d.features[0]) || null;
      var c2 = (f && f.geometry && f.geometry.coordinates) || [];
      if (isFinite(c2[0]) && isFinite(c2[1])) { out[k].lat = c2[1]; out[k].lng = c2[0]; }
    } catch (e) {
      if (window.logError) window.logError({ level: 'info', cat: 'agt-install', msg: 'geocodage commune indisponible' });
    }
  }
  return out;
}

// Photographie les champs deja tapes AVANT de reconstruire l'ecran.
function _agtInsSnap() {
  if (!document.getElementById('agtins-nom')) return;
  var f = {};
  ['agtins-nom', 'agtins-slug', 'agtins-ville', 'agtins-cp', 'agtins-mail',
   'agtins-admnom', 'agtins-trial', 'agtins-plan', 'agtins-tstart', 'agtins-noms'].forEach(function (id) {
    var e = document.getElementById(id); if (e) f[id] = e.value;
  });
  var s = document.getElementById('agtins-slug');
  f._slugTouched = !!(s && s.dataset && s.dataset.touched);
  _agtIns.form = f;
}
function _agtInsReRender() { _agtInsSnap(); _agtInsRender(); }

// ════════ Les periodes de la campagne ════════════════════════════════════════
// L'installation posait UNE periode de douze mois. Tout le pilotage — avancement,
// charge, cadence, Decider — raisonne alors sur l'annee entiere d'un bloc, et le
// decoupage se refait ensuite a la main, periode par periode, tache par tache.
//
// ⚠️ On n'invente aucun calendrier : le decoupage se RECOPIE d'un domaine deja
//    installe, dates ramenees sur la campagne en cours. Comme pour la convention
//    d'adresse, ce qui existe vaut mieux qu'une valeur devinee.
// ⚠️ Une periode sans dates est INVISIBLE pour toute la chaine de charge (le bug
//    d'onboarding de juillet). Les dates sont donc exigees avant l'ecriture.

// Decale une date ISO d'un nombre d'annees. Le 29 fevrier retombe au 28 quand
// l'annee d'arrivee n'est pas bissextile.
function _agtInsAnPlus(iso, d) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return '';
  var an = parseInt(m[1], 10) + d, mo = m[2], jo = m[3];
  if (mo === '02' && jo === '29' && !((an % 4 === 0 && an % 100 !== 0) || an % 400 === 0)) jo = '28';
  return an + '-' + mo + '-' + jo;
}
// Ramene un decoupage sur la campagne visee : toutes les dates glissent du MEME
// nombre d'annees, calcule pour que la derniere fin tombe sur l'annee cible. Une
// periode a cheval sur deux annees civiles reste a cheval.
function _agtInsPerDecale(sais, anCible) {
  var maxAn = 0;
  (sais || []).forEach(function (s) {
    var a = parseInt(String((s && s.fin) || '').slice(0, 4), 10);
    if (isFinite(a) && a > maxAn) maxAn = a;
  });
  if (!maxAn) return [];
  var d = anCible - maxAn;
  return (sais || []).map(function (s) {
    return { nom: String(s.nom || ''), debut: _agtInsAnPlus(s.debut, d), fin: _agtInsAnPlus(s.fin, d),
             taches: Array.isArray(s.taches) ? s.taches.slice() : [] };
  }).filter(function (s) { return s.nom && s.debut && s.fin; });
}
function _agtInsTachesDispo() {
  return (window.TACHES || []).map(function (t) { return t.nom; }).filter(Boolean);
}
// Le decoupage effectivement ecrit. Vide = le comportement d'avant ce lot.
function _agtInsPerSaisons(an) {
  var dispo = _agtInsTachesDispo();
  if (!_agtIns.per.length) {
    return [{ nom: 'Campagne ' + an, periode: 'janv. ' + an + ' \u2013 d\u00e9c. ' + an,
              debut: an + '-01-01', fin: an + '-12-31', active: true, taches: dispo }];
  }
  var auj = _mvToday(), act = -1;
  _agtIns.per.forEach(function (p, i) {
    if (p.debut && p.fin && auj >= p.debut && auj <= p.fin && (act < 0 || p.debut > _agtIns.per[act].debut)) act = i;
  });
  if (act < 0) act = 0;
  return _agtIns.per.map(function (p, i) {
    return { nom: p.nom, periode: _agtInsPerLib(p), debut: p.debut, fin: p.fin,
             active: i === act, taches: (p.taches || []).filter(function (t) { return dispo.indexOf(t) >= 0; }) };
  });
}
var _AGT_MOIS = ['janv.', 'f\u00e9vr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'ao\u00fbt', 'sept.', 'oct.', 'nov.', 'd\u00e9c.'];
function _agtInsPerLib(p) {
  if (!p.debut || !p.fin) return '';
  var a = _AGT_MOIS[parseInt(p.debut.slice(5, 7), 10) - 1] + ' ' + p.debut.slice(0, 4);
  var b = _AGT_MOIS[parseInt(p.fin.slice(5, 7), 10) - 1] + ' ' + p.fin.slice(0, 4);
  return a + ' \u2013 ' + b;
}
// Les taches qu'aucune periode ne reclame : elles n'apparaitraient NULLE PART.
function _agtInsPerOrphelines() {
  if (!_agtIns.per.length) return [];
  var vus = {};
  _agtIns.per.forEach(function (p) { (p.taches || []).forEach(function (t) { vus[t] = 1; }); });
  return _agtInsTachesDispo().filter(function (t) { return !vus[t]; });
}

function agtInsPerAdd() {
  var an = new Date().getFullYear();
  _agtIns.per.push({ nom: 'Nouvelle p\u00e9riode', debut: an + '-01-01', fin: an + '-12-31', taches: [] });
  _agtIns.perOuv = _agtIns.per.length - 1;
  _agtInsReRender();
}
function agtInsPerDel(i) {
  _agtIns.per.splice(i, 1);
  if (_agtIns.perOuv >= _agtIns.per.length) _agtIns.perOuv = -1;
  _agtInsReRender();
}
// ⚠️ Saisie : PAS de rendu, sinon le champ perd le focus. Et pour les dates,
//    `onblur` seulement — `onchange` sur un input date se declenche a chaque date
//    structurellement valide en cours de frappe.
function agtInsPerNom(i, el) {
  var p = _agtIns.per[i]; if (!p || !el) return;
  p.nom = String(el.value || '').trim();
}
function agtInsPerDate(i, quoi, el) {
  var p = _agtIns.per[i]; if (!p || !el) return;
  p[quoi === 'f' ? 'fin' : 'debut'] = String(el.value || '');
}
function agtInsPerTog(i) { _agtIns.perOuv = (_agtIns.perOuv === i) ? -1 : i; _agtInsReRender(); }
function agtInsPerTache(i, nom) {
  var p = _agtIns.per[i]; if (!p) return;
  p.taches = p.taches || [];
  var k = p.taches.indexOf(nom);
  if (k >= 0) p.taches.splice(k, 1); else p.taches.push(nom);
  _agtInsReRender();
}
// Recopie le decoupage d'un domaine deja installe.
async function agtInsPerCopy() {
  var sel = document.getElementById('agtins-persrc');
  var slug = sel ? String(sel.value || '') : '';
  if (!slug) { showToast('Choisissez un domaine \u00e0 recopier', '#B85A1A'); return; }
  var sais = null;
  try { sais = await window.fbAdminRead(slug, 'saisons'); }
  catch (e) {
    showToast('Lecture impossible : ' + ((e && e.message) || 'erreur'), '#C0392B');
    if (window.logError) window.logError({ level: 'info', cat: 'agt-install', msg: 'lecture saisons source' });
    return;
  }
  if (!Array.isArray(sais) || !sais.length) { showToast('Ce domaine n\u2019a aucune p\u00e9riode', '#B85A1A'); return; }
  var per = _agtInsPerDecale(sais, new Date().getFullYear());
  if (!per.length) { showToast('Aucune p\u00e9riode dat\u00e9e \u00e0 recopier', '#B85A1A'); return; }
  // Les taches du domaine source qui n'existent pas ici sont ecartees : un bareme
  // regional peut ne pas porter les memes travaux.
  var dispo = _agtInsTachesDispo(), perdues = {};
  per.forEach(function (p) {
    p.taches = (p.taches || []).filter(function (t) {
      if (dispo.indexOf(t) >= 0) return true;
      perdues[t] = 1; return false;
    });
  });
  _agtIns.per = per; _agtIns.perOuv = -1;
  _agtInsReRender();
  var np = Object.keys(perdues).length;
  showToast(per.length + ' p\u00e9riode' + (per.length > 1 ? 's reprises' : ' reprise')
    + (np ? ' \u00b7 ' + np + ' t\u00e2che' + (np > 1 ? 's' : '') + ' inconnue' + (np > 1 ? 's' : '') + ' ici, \u00e9cart\u00e9e' + (np > 1 ? 's' : '') : ''), '#3D6B27');
}

// ⚠️ On ne reprend QUE ce que l'application consomme vraiment aujourd'hui : le SIRET
//    (exige sur chaque ligne du registre phyto electronique) et les ecartements (la
//    densite, qui ramene le bareme au nombre de pieds reel). L'IDCC et le reste sont
//    LUS a l'ecran, pas ecrits : poser une cle que rien ne lit donnerait l'illusion
//    d'un reglage fait.
function _agtInsNb(v) {
  var n = parseFloat(String(v == null ? '' : v).replace(',', '.'));
  return (isFinite(n) && n > 0 && n <= 10) ? n : 0;
}
function _agtInsRepr(mer) {
  var t = (mer && mer.t) || {};
  var siret = String(t.siret || '').replace(/\D/g, '');
  var r = String(t.ecR || '').length ? _agtInsNb(t.ecR) : 0;
  var p = String(t.ecP || '').length ? _agtInsNb(t.ecP) : 0;
  var per = null;
  if (t.perNom && t.perDeb && t.perFin && t.perFin >= t.perDeb) {
    per = { nom: String(t.perNom).trim(), debut: t.perDeb, fin: t.perFin, taches: [] };
  }
  var repris = [];
  if (siret.length === 14) repris.push('le SIRET');
  if (r && p) repris.push('les \u00e9cartements');
  if (per) repris.push('la p\u00e9riode');
  return { siret: (siret.length === 14 ? siret : ''), ec_rang: r, ec_pied: p, per: per, repris: repris };
}
window.agtInsRepr = function () {
  var L = _agtIns.leads[_agtIns.sel];
  if (!L || !L.mer) return;
  var d = _agtInsRepr(L.mer), n = [];
  _agtIns.cfg = _agtIns.cfg || {};
  if (d.siret) { _agtIns.cfg.siret = d.siret; n.push('SIRET'); }
  if (d.ec_rang && d.ec_pied) {
    _agtIns.cfg.vigne = { ec_rang: d.ec_rang, ec_pied: d.ec_pied };
    n.push(d.ec_rang + ' \u00d7 ' + d.ec_pied + ' m');
  }
  // La periode n'est ajoutee que si elle n'y est pas deja : le bouton se reclique.
  if (d.per && !_agtIns.per.some(function (x) { return x.nom === d.per.nom; })) {
    _agtIns.per.push(d.per); n.push('p\u00e9riode \u00ab ' + d.per.nom + ' \u00bb');
  }
  _agtInsReRender();
  showToast(n.length ? ('\u2705 Repris : ' + n.join(' \u00b7 ')) : 'Rien de nouveau \u00e0 reprendre', n.length ? '#3D6B27' : '#B85A1A');
};

// ════════ Le parc de machines et le format des futs ══════════════════════════
// Un domaine neuf demarre avec UN tracteur nomme « Tracteur » et des activites
// generiques toutes rattachees a `trac1`. Un domaine de 45 ha en a six : six fois le
// meme geste
// dans Reglages. On colle la liste, comme pour les parcelles et pour l'equipe.
//
// ⚠️ LA PREMIERE MACHINE GARDE L'ID `trac1`. Les activites du seed y renvoient
//    toutes (`tracteurDefautId:'trac1'`) : changer cet id laisserait chaque activite
//    pointer un tracteur inexistant — en silence.
var _AGT_TYPES = ['m\u00e9canique', 'hydrostatique'];

function _agtInsMach(txt) {
  var out = [];
  String(txt || '').split(/[\r\n]+/).forEach(function (l) {
    l = l.trim(); if (!l) return;
    var c = l.split(/[;\t]/).map(function (x) { return x.trim(); });
    var nom = c[0]; if (!nom) return;
    var modele = '', type = '', trt = false;
    for (var i = 1; i < c.length; i++) {
      var v = c[i]; if (!v) continue;
      var k = v.toLowerCase();
      if (_AGT_TYPES.indexOf(k) >= 0) type = k;
      else if (k === 'hydro') type = 'hydrostatique';
      else if (k === 'traitement' || k === 'traitements') trt = true;
      else modele = v;
    }
    out.push({ id: 'trac' + (out.length + 1), nom: nom, modele: modele,
               type: type || _AGT_TYPES[0], traitementOnly: trt });
  });
  return out;
}
function agtInsMachLire() {
  var el = document.getElementById('agtins-mach');
  var v = el ? String(el.value || '') : '';
  if (!v.trim()) { showToast('Collez d\u2019abord la liste des machines', '#B85A1A'); if (el) el.focus(); return; }
  _agtIns.mach = _agtInsMach(v);
  _agtInsReRender();
  showToast(_agtIns.mach.length + ' machine' + (_agtIns.mach.length > 1 ? 's' : ''), '#3D6B27');
}
function agtInsMachVider() { _agtIns.mach = []; _agtInsReRender(); }
// Le format de fut. Rien n'est devine a partir de la region : 228 L en Bourgogne,
// 225 L a Bordeaux, et bien d'autres ailleurs — c'est un choix, pas une deduction.
// Sans reglage, l'application garde son defaut de 228 L, comme avant ce lot.
window.agtInsFut = function (v) {
  _agtIns.cfg = _agtIns.cfg || {};
  var n = parseInt(v, 10);
  if (!isFinite(n) || n < 50 || n > 600) {
    if (_agtIns.cfg.cave) delete _agtIns.cfg.cave.fut_l;
    _agtInsReRender();
    return;
  }
  _agtIns.cfg.cave = Object.assign({}, _agtIns.cfg.cave || {}, { fut_l: n });
  _agtInsReRender();
};

// ⚠️ UNE seule normalisation, en tete du rendu. Quatre listes vivent dans l'etat de
//    l'assistant et une dizaine de fonctions les parcourent : semer des `|| []` a
//    chaque lecture, c'est se garantir d'en oublier un. Trouve par un harnais qui
//    plantait sur un etat partiel.
function _agtInsNorm() {
  ['parc', 'noms', 'per', 'mach'].forEach(function (k) {
    if (!Array.isArray(_agtIns[k])) _agtIns[k] = [];
  });
}

function _agtInsRender() {
  _agtInsNorm();
  var card = document.getElementById('agt-ins-card');
  if (!card) return;

  // Écran de remise : les identifiants ne s'affichent qu'une fois.
  if (_agtIns.creds) { card.innerHTML = _agtInsCreds(); return; }

  var L = (_agtIns.sel >= 0) ? _agtIns.leads[_agtIns.sel] : null;
  var E = window._escHtml || function (x) { return String(x == null ? '' : x); };
  var h = '';

  h += '<div class="agi-hd"><div><h3>Installer un domaine</h3>';
  h += '<p>Le dossier du client remplit l\u2019installation. Il ne verra jamais cet \u00e9cran.</p></div>';
  h += '<button class="agi-x" onclick="agtInsClose()">'+_mvIcon('croix',16)+'</button></div>';

  // ── Les dossiers reçus ──
  h += '<div class="agi-ch">Dossiers re\u00e7us</div>';
  if (!_agtIns.leads.length) {
    h += '<p style="font-size:var(--pt-txt,13px);color:rgba(240,226,200,.45);margin:0">Aucune demande d\u2019essai enregistr\u00e9e. ';
    h += 'Vous pouvez installer un domaine \u00e0 la main : remplissez les champs ci-dessous.</p>';
  } else {
    h += '<div class="agi-dos">';
    _agtIns.leads.forEach(function (l, i) {
      var lieu = [l.ville, l.region].filter(Boolean).join(' \u00b7 ') || '\u2014';
      var dim = [l.surface ? l.surface + ' ha' : '', l.nbparc ? l.nbparc + ' parc.' : ''].filter(Boolean).join(' \u00b7 ');
      h += '<button class="agi-d' + (_agtIns.sel === i ? ' on' : '') + '" onclick="agtInsPick(' + i + ')">';
      h += '<b>' + E(l.domaine || l.email) + '</b><span>' + E(lieu) + '</span>';
      if (dim) h += '<span>' + E(dim) + '</span>';
      h += '</button>';
    });
    h += '</div>';
  }

  // ── Les quatre verrous ──
  var vNom = !!(L && L.domaine), vAdm = !!(L && L.email), vParc = _agtIns.parc.length > 0;
  h += '<div class="agi-ch">Ce qui emp\u00eache l\u2019application de s\u2019ouvrir</div><div class="agi-vr">';
  h += _agtInsV(vNom, 'Nom du domaine', vNom ? 'repris du dossier' : '\u00e0 saisir');
  h += _agtInsV(vAdm, 'Compte administrateur', vAdm ? 'repris du dossier' : '\u00e0 saisir');
  h += _agtInsV(vParc, 'Au moins 1 parcelle', vParc ? _agtIns.parc.length + ' parcelles' : 'aucune pour l\u2019instant');
  h += _agtInsV(true, 'Campagne + travaux', 'ann\u00e9e en cours, catalogue');
  h += '</div>';

  // ── Domaine ──
  h += '<div class="agi-ch">Le domaine</div>';
  h += '<div class="agi-f"><label for="agtins-nom">Nom</label><div>';
  h += '<input type="text" id="agtins-nom" oninput="agtInsSlugSync()"></div></div>';
  h += '<div class="agi-f"><label for="agtins-slug">Identifiant</label><div>';
  h += '<input type="text" id="agtins-slug">';
  h += '<div class="agi-src" id="agtins-slugp"></div></div></div>';
  h += '<div class="agi-f"><label for="agtins-ville">Commune</label><div>';
  h += '<input type="text" id="agtins-ville" onblur="_agtInsGeo(this.value, (document.getElementById(\'agtins-cp\')||{}).value)">';
  h += '<div class="agi-src" id="agtins-geo">la commune donne la position m\u00e9t\u00e9o</div></div></div>';
  h += '<div class="agi-f"><label for="agtins-cp">Code postal</label><div>';
  h += '<input type="text" id="agtins-cp" inputmode="numeric" maxlength="5"></div></div>';
  h += '<div class="agi-f"><label for="agtins-plan">Formule</label><div><select id="agtins-plan">';
  h += '<option value="domaine">Domaine</option><option value="vigneron">Vigneron</option>';
  h += '<option value="essentiel">Essentiel</option></select></div></div>';
  h += '<div class="agi-f"><label for="agtins-trial">Essai (jours)</label><div>';
  h += '<input type="number" id="agtins-trial" min="0" max="90"></div></div>';
  h += '<div class="agi-f"><label for="agtins-tstart">Il d\u00e9marre</label><div><select id="agtins-tstart">';
  h += '<option value="remise">\u00e0 la remise des identifiants</option>';
  h += '<option value="now">tout de suite</option></select></div></div>';
  h += '<div class="agi-w">Le compte \u00e0 rebours part de l\u2019instant o\u00f9 il est pos\u00e9 \u2014 jamais de la ';
  h += 'premi\u00e8re connexion du client. <b>\u00ab \u00c0 la remise \u00bb ouvre le domaine SANS essai</b> et pose ';
  h += 'un bouton sur l\u2019\u00e9cran des identifiants : un DPA \u00e0 faire signer, une semaine d\u2019attente, ';
  h += 'ne mangent plus des jours d\u2019essai que le client n\u2019a pas utilis\u00e9s.</div>';

  // ── Administrateur ──
  h += '<div class="agi-ch">L\u2019administrateur</div>';
  h += '<div class="agi-f"><label for="agtins-admnom">Son pr\u00e9nom</label><div>';
  h += '<input type="text" id="agtins-admnom"></div></div>';
  h += '<div class="agi-f"><label for="agtins-mail">Son e-mail</label><div>';
  h += '<input type="email" id="agtins-mail">';
  h += '<div class="agi-src">une vraie bo\u00eete : c\u2019est sa seule porte de secours</div></div></div>';
  h += '<div class="agi-f"><label>Mot de passe</label><div style="font-size:var(--pt-txt,13px);color:rgba(240,226,200,.5)">';
  h += 'G\u00e9n\u00e9r\u00e9 \u00e0 l\u2019installation, pronon\u00e7able, affich\u00e9 une seule fois. Le client le remplace ';
  h += '\u00e0 sa premi\u00e8re connexion.</div></div>';

  // ── Parcelles ──
  h += '<div class="agi-ch">Les parcelles</div>';
  h += '<input type="file" id="agtins-kml" accept=".kml,.kmz,.xml" style="display:none" onchange="agtInsKml(this)">';
  h += '<button class="agi-b or" onclick="document.getElementById(\'agtins-kml\').click()">';
  h += _agtIns.parc.length ? 'Relire un autre fichier' : 'Lire le fichier de parcellaire';
  h += '</button>';
  if (_agtIns.parc.length) {
    // Les noms. Le fichier dit « Ilot 12 » la ou l'equipe dit « Les Grandes Vignes » :
    // c'est le nom du terrain qui doit atterrir a l'ecran. Il se corrige ICI, avant
    // ecriture — `parcelles` et `kml_polygons` sortent du MEME tableau, donc le
    // rattachement contour↔parcelle (par nom.toLowerCase()) ne peut plus diverger.
    h += '<textarea class="agi-ta" id="agtins-noms" placeholder="Collez ici la liste des parcelles telle que le domaine les \u00e9crit \u2014 un nom par ligne."></textarea>';
    h += '<div class="agi-rz"><button class="agi-b" onclick="agtInsNoms()">Rapprocher les noms</button>';
    if ((_agtIns.noms || []).length) h += '<button class="agi-b" onclick="agtInsNomsClear()">Revenir aux noms du fichier</button>';
    h += '<button class="agi-b" onclick="agtInsCommAll()">Toutes \u00e0 la commune du dossier</button></div>';
    if ((_agtIns.noms || []).length) h += '<div class="agi-bil">' + _agtInsBilan() + '</div>';
    h += '<div class="agi-pl">';
    _agtIns.parc.forEach(function (p, i) {
      var libres = _agtInsLibres(i);
      h += '<div class="agi-pw"><div class="agi-pr">';
      h += '<div><input type="text" class="agi-nm" data-nom="' + i + '" onchange="agtInsNomSet(' + i + ',this)" onblur="agtInsNomSet(' + i + ',this)"></div>';
      h += '<div><input type="number" step="0.01" min="0" data-surf="' + i + '" onchange="agtInsParcSurf(' + i + ',this)"></div>';
      h += '<button class="agi-pd" onclick="agtInsParcDel(' + i + ')" title="Retirer">'+_mvIcon('croix',16)+'</button></div>';
      h += '<div class="agi-p2">';
      if (libres.length) {
        h += '<select data-sel="' + i + '" onchange="agtInsPickNom(' + i + ',this)"><option value="">\u2190 nom du domaine\u2026</option>';
        libres.forEach(function (o) { h += '<option value="' + o.ni + '">' + E(o.nom) + '</option>'; });
        h += '</select>';
      }
      h += '<input type="text" class="agi-cm" data-comm="' + i + '" placeholder="commune" onchange="agtInsComm(' + i + ',this)" onblur="agtInsComm(' + i + ',this)">';
      if (p.nom0 && p.nom0 !== p.nom) h += '<span class="o">fichier : ' + E(p.nom0) + '</span>';
      h += '</div></div>';
    });
    h += '</div><div class="agi-tot"><span>' + _agtIns.parc.length + ' parcelles</span>';
    h += '<span id="agtins-tot">' + _agtInsSurfTot().toFixed(2) + ' ha au total</span></div>';
    h += '<div class="agi-w">Les surfaces sont calcul\u00e9es sur le contour dessin\u00e9. Ce n\u2019est pas la ';
    h += 'surface cadastrale : tourni\u00e8res, bordures, trac\u00e9 approximatif. <b>Chaque ligne reste modifiable.</b> ';
    h += 'Le nom pos\u00e9 ici est celui que verra l\u2019\u00e9quipe, et celui auquel se rattachera le contour.</div>';
  }


  // ── Les periodes de la campagne ──
  h += '<div class="agi-ch">P\u00e9riodes de la campagne</div>';
  // La liste des domaines installes est DEJA en memoire : _agtSlugs, remplie au
  // chargement du panneau. On ne se recopie pas soi-meme, et le bac a sable public
  // n'est pas un modele de decoupage.
  var mien = _agtInsSlug();
  var srcs = (_agtSlugs || []).filter(function (x) { return x && x !== mien && x !== 'domaine-dupont'; });
  if (srcs.length) {
    h += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">'
      + '<select id="agtins-persrc" style="flex:1;min-width:0;background:rgba(255,255,255,.05);border:1px solid rgba(240,226,200,.12);border-radius:8px;padding:8px 9px;color:#F0E2C8;font-family:inherit;font-size:var(--pt-sm,16px)">'
      + '<option value="">Reprendre d\u2019un domaine\u2026</option>'
      + srcs.map(function (t) { return '<option value="' + E(t) + '">' + E(t) + '</option>'; }).join('')
      + '</select><button class="agi-b" onclick="agtInsPerCopy()">Reprendre</button></div>';
  }
  var per = _agtIns.per;
  if (!per.length) {
    h += '<div class="agi-w">Sans d\u00e9coupage, l\u2019installation cr\u00e9e <b>une seule p\u00e9riode de douze mois</b> '
      + 'portant toutes les t\u00e2ches. C\u2019est ce qui se passe aujourd\u2019hui, et tout le pilotage raisonne alors '
      + 'sur l\u2019ann\u00e9e enti\u00e8re d\u2019un bloc.</div>';
  } else {
    var dispo = _agtInsTachesDispo();
    h += '<div class="agi-pl">';
    per.forEach(function (p, i) {
      var nt = (p.taches || []).length, mal = (!p.nom || !p.debut || !p.fin || p.fin < p.debut);
      h += '<div class="agi-pw"><div class="agi-pr">';
      h += '<div><input type="text" class="agi-nm" data-pnom="' + i + '" onchange="agtInsPerNom(' + i + ',this)" onblur="agtInsPerNom(' + i + ',this)"></div>';
      h += '<div style="font-size:var(--pt-micro,12px);color:' + (nt ? 'rgba(240,226,200,.5)' : '#E0A46A') + ';text-align:right;cursor:pointer" onclick="agtInsPerTog(' + i + ')">'
        + nt + ' t\u00e2che' + (nt > 1 ? 's' : '') + '</div>';
      h += '<button class="agi-pd" onclick="agtInsPerDel(' + i + ')" title="Retirer">'+_mvIcon('croix',16)+'</button></div>';
      h += '<div class="agi-p2">'
        + '<input type="date" data-pd1="' + i + '" onblur="agtInsPerDate(' + i + ',\'d\',this)" style="flex:1 1 130px">'
        + '<input type="date" data-pd2="' + i + '" onblur="agtInsPerDate(' + i + ',\'f\',this)" style="flex:1 1 130px">'
        + (mal ? '<span class="o" style="color:#E0A46A">\u2298 nom et dates exig\u00e9s</span>' : '')
        + '</div>';
      if (_agtIns.perOuv === i) {
        h += '<div class="agi-p2" style="padding-top:2px">';
        dispo.forEach(function (t) {
          var on = (p.taches || []).indexOf(t) >= 0;
          h += '<button onclick="agtInsPerTache(' + i + ',\'' + _escAttr(t) + '\')" '
            + 'style="border-radius:7px;padding:5px 9px;font-size:var(--pt-micro,12px);cursor:pointer;font-family:inherit;'
            + 'border:1px solid ' + (on ? '#C9A84C' : 'rgba(240,226,200,.14)') + ';'
            + 'background:' + (on ? 'rgba(201,168,76,.16)' : 'transparent') + ';'
            + 'color:' + (on ? '#C9A84C' : 'rgba(240,226,200,.45)') + '">' + E(t) + '</button>';
        });
        h += '</div>';
      }
      h += '</div>';
    });
    h += '</div>';
    var orph = _agtInsPerOrphelines();
    if (orph.length) {
      h += '<div class="agi-w" style="color:#E0A46A"><b>' + orph.length + ' t\u00e2che' + (orph.length > 1 ? 's' : '')
        + '</b> dans aucune p\u00e9riode : ' + E(orph.join(', '))
        + '. Elle' + (orph.length > 1 ? 's n\u2019appara\u00eetront' : ' n\u2019appara\u00eetra') + ' nulle part.</div>';
    }
  }
  h += '<div class="agi-rz"><button class="agi-b" onclick="agtInsPerAdd()">+ P\u00e9riode</button></div>';

  // ── Les machines et le format des futs ──
  h += '<div class="agi-ch">Machines &amp; futaille</div>';
  h += '<textarea class="agi-ta" id="agtins-mach" placeholder="Une machine par ligne. Nom, ou Nom;mod\u00e8le, ou Nom;mod\u00e8le;hydrostatique. Ajoutez ; traitement pour un engin r\u00e9serv\u00e9 aux traitements."></textarea>';
  var mach = _agtIns.mach;
  h += '<div class="agi-rz"><button class="agi-b" onclick="agtInsMachLire()">Lire la liste</button>';
  if (mach.length) h += '<button class="agi-b" onclick="agtInsMachVider()">Vider</button>';
  h += '</div>';
  if (mach.length) {
    h += '<div class="agi-pl">';
    mach.forEach(function (m) {
      h += '<div class="agi-pw"><div class="agi-p2" style="padding-top:7px">'
        + '<span style="font-size:13.5px;font-weight:600;color:#F0E2C8">' + E(m.nom) + '</span>'
        + (m.modele ? '<span class="o">' + E(m.modele) + '</span>' : '')
        + '<span class="o" style="flex:0 0 auto;color:rgba(240,226,200,.45)">' + E(m.type) + '</span>'
        + (m.traitementOnly ? '<span class="o" style="flex:0 0 auto;color:#C9A84C">traitements seuls</span>' : '')
        + '</div></div>';
    });
    h += '</div>';
  } else {
    h += '<div class="agi-w">Sans liste, le domaine d\u00e9marre avec <b>un seul tracteur</b> nomm\u00e9 \u00ab Tracteur \u00bb, '
      + '\u00e0 renommer dans R\u00e9glages. C\u2019est ce qui se passe aujourd\u2019hui.</div>';
  }
  var futL = (_agtIns.cfg && _agtIns.cfg.cave && _agtIns.cfg.cave.fut_l) || 0;
  h += '<div class="agi-p2" style="padding:10px 0 0">'
    + '<span style="font-size:var(--pt-txt,13px);color:rgba(240,226,200,.5);flex:0 0 auto">Volume d\u2019un f\u00fbt</span>'
    + '<select onchange="agtInsFut(this.value)" style="flex:1 1 150px;min-width:0;background:rgba(255,255,255,.05);'
    + 'border:1px solid rgba(240,226,200,.12);border-radius:8px;padding:7px 9px;color:#F0E2C8;font-family:inherit;font-size:var(--pt-sm,16px)">'
    + '<option value="">228 L \u2014 d\u00e9faut de l\u2019application</option>'
    + '<option value="225"' + (futL === 225 ? ' selected' : '') + '>225 L \u2014 barrique bordelaise</option>'
    + '<option value="228"' + (futL === 228 ? ' selected' : '') + '>228 L \u2014 pi\u00e8ce bourguignonne</option>'
    + '<option value="400"' + (futL === 400 ? ' selected' : '') + '>400 L \u2014 demi-muid</option>'
    + '<option value="500"' + (futL === 500 ? ' selected' : '') + '>500 L \u2014 foudre / cuve bois</option>'
    + '</select></div>';

  // ── Ce que le client a repondu au formulaire de mise en route ──
  // Les reponses arrivent dans le MEME dossier que la demande d'essai (cle `mer`,
  // ecrite par submitMiseEnRoute). Avant, il fallait ouvrir un mail a cote et
  // recopier. Le recapitulatif est celui que la page a construit : les libelles
  // n'existent qu'a un seul endroit.
  if (L && L.mer && (L.mer.recap || L.mer.t)) {
    var rep = _agtInsRepr(L.mer);
    h += '<div class="agi-ch">Ce que le client a r\u00e9pondu</div>';
    if (rep.repris.length) {
      h += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">'
        + '<button class="agi-b" onclick="agtInsRepr()">Reprendre ' + rep.repris.join(' \u00b7 ') + '</button></div>';
    }
    if (L.mer.recap) {
      h += '<pre style="max-height:230px;overflow:auto;margin:0;padding:11px 13px;white-space:pre-wrap;'
        + 'background:rgba(255,255,255,.03);border:1px solid rgba(240,226,200,.10);border-radius:10px;'
        + 'font-family:inherit;font-size:var(--pt-txt,13px);line-height:1.6;color:rgba(240,226,200,.72)">'
        + E(L.mer.recap) + '</pre>';
    }
  }

  // ── Ce que le dossier a rempli tout seul ──
  if (L) {
    h += '<div class="agi-ch">Ce que le dossier a rempli tout seul</div><div class="agi-lu">';
    h += _agtInsLu('Surface annonc\u00e9e', L.surface ? L.surface + ' ha' : '\u2014');
    h += _agtInsLu('Parcelles annonc\u00e9es', L.nbparc || '\u2014');
    h += _agtInsLu('Conduite', L.conduite || '\u2014');
    h += _agtInsLu('Permanents', L.perm || '\u2014');
    h += _agtInsLu('Engins', L.engins || '\u2014');
    h += _agtInsLu('Cuv\u00e9es', L.cuvees || '\u2014');
    h += '</div>';
    if (L.tel) h += '<p style="font-size:var(--pt-txt,13px);color:rgba(240,226,200,.45);margin:10px 0 0">T\u00e9l\u00e9phone : ' + E(L.tel) + '</p>';
    if (L.message) h += '<p style="font-size:var(--pt-txt,13px);color:rgba(240,226,200,.45);margin:6px 0 0;white-space:pre-wrap">' + E(L.message) + '</p>';
  }

  // ── Reste à faire à la conversion (c'est TA liste, pas la sienne) ──
  h += '<div class="agi-ch">\u00c0 finir chez ce client, \u00e0 la conversion</div>';
  h += '<p style="font-size:var(--pt-txt,13px);color:rgba(240,226,200,.45);margin:0;line-height:1.6">';
  h += 'SIRET de l\u2019exploitation \u00b7 \u00e9cartements de plantation \u00b7 bar\u00e8me r\u00e9gional \u00b7 taux horaires \u00b7 ';
  h += 'contrats et mod\u00e8les d\u2019horaires \u00b7 cuves, f\u00fbts et cuv\u00e9es. Rien de tout cela n\u2019emp\u00eache ';
  h += 'd\u2019ouvrir : vous les posez vous-m\u00eame en fin d\u2019essai.</p>';

  h += '<button class="agi-b go" id="agtins-go" onclick="agtInsGo()">Installer le domaine</button>';

  card.innerHTML = h;
  _agtInsFill(L);
}

function _agtInsV(ok, n, s) {
  var E = window._escHtml || function (x) { return String(x == null ? '' : x); };
  return '<div class="agi-v ' + (ok ? 'ok' : 'no') + '"><div class="n">' + E(n) + '</div><div class="s">' + E(s) + '</div></div>';
}
function _agtInsLu(k, v) {
  var E = window._escHtml || function (x) { return String(x == null ? '' : x); };
  return '<div><div class="k">' + E(k) + '</div><div class="v">' + E(v) + '</div></div>';
}

// ⚠️ Les valeurs sont posées EN JS, après innerHTML — jamais par un attribut value :
//    iOS ignore les attributs des champs injectés, et une apostrophe française dans un
//    nom de domaine casserait le HTML.
function _agtInsFill(L) {
  // ⚠️ La photo des champs (_agtIns.form) PASSE AVANT le dossier : sans elle, tout
  //    rendu (retirer une parcelle, rapprocher les noms) reecrasait la saisie en cours
  //    par les valeurs du lead — perte silencieuse, vecue sur agtInsParcDel.
  var F = _agtIns.form;
  var set = function (id, v) {
    var el = document.getElementById(id); if (!el) return;
    el.value = (F && F[id] != null) ? F[id] : (v == null ? '' : String(v));
  };
  set('agtins-nom', L ? L.domaine : '');
  set('agtins-slug', L ? _agtInsSlug(L.domaine) : '');
  set('agtins-ville', L ? (L.ville || '') : '');
  set('agtins-cp', L ? (L.cp || '') : '');
  set('agtins-mail', L ? (L.email || '') : '');
  set('agtins-admnom', '');
  set('agtins-trial', 15);
  set('agtins-noms', '');
  var pl = document.getElementById('agtins-plan');
  if (pl) pl.value = (F && F['agtins-plan']) ? F['agtins-plan'] : 'domaine';
  // ⚠️ Un select ne se remplit pas par set() : il faut lui reposer sa valeur, sinon
  //    chaque rendu le renvoie a sa premiere option — le meme piege que le plan.
  var ts = document.getElementById('agtins-tstart');
  if (ts) ts.value = (F && F['agtins-tstart']) ? F['agtins-tstart'] : 'remise';
  var sl = document.getElementById('agtins-slug');
  if (sl && F && F._slugTouched) sl.dataset.touched = '1';
  _agtIns.per.forEach(function (p, i) {
    var en = document.querySelector('[data-pnom="' + i + '"]'); if (en) en.value = p.nom || '';
    var d1 = document.querySelector('[data-pd1="' + i + '"]');  if (d1) d1.value = p.debut || '';
    var d2 = document.querySelector('[data-pd2="' + i + '"]');  if (d2) d2.value = p.fin || '';
  });
  _agtIns.parc.forEach(function (p, i) {
    var el = document.querySelector('[data-surf="' + i + '"]');
    if (el) el.value = (p.surface || 0).toFixed(2);
    var en = document.querySelector('[data-nom="' + i + '"]');
    if (en) en.value = p.nom || '';
    var ec = document.querySelector('[data-comm="' + i + '"]');
    if (ec) ec.value = p.commune || '';
    var es = document.querySelector('[data-sel="' + i + '"]');
    if (es) {
      var ni = -1;
      (_agtIns.noms || []).forEach(function (nm, k) { if (nm.pris === i) ni = k; });
      es.value = (ni >= 0) ? String(ni) : '';
    }
  });
  agtInsSlugSync();
}

function agtInsSlugSync() {
  var n = document.getElementById('agtins-nom'), s = document.getElementById('agtins-slug');
  var p = document.getElementById('agtins-slugp');
  if (!n || !s) return;
  if (!s.dataset.touched) s.value = _agtInsSlug(n.value);
  if (p) p.textContent = s.value ? 'mavigneapp.fr \u2014 ' + s.value : '';
}

// Installation. Deux écritures, dans cet ordre non négociable :
//   1. le slug entre au registre `_guerettech/tenants` en « pending » — sans lui,
//      onboardTenant refuse (« Domaine inconnu »).
//   2. onboardTenant crée le compte, pose les claims et écrit les documents initiaux.
// Le mot de passe est GÉNÉRÉ PAR LE SERVEUR : il revient dans la réponse, s'affiche une
// fois, et n'est enregistré nulle part.
async function agtInsGo() {
  if (_agtIns.busy) return;
  var g = function (id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var nom = g('agtins-nom'), slug = _agtInsSlug(g('agtins-slug')), mail = g('agtins-mail');
  var admnom = g('agtins-admnom') || 'Administrateur';
  var plan = g('agtins-plan') || 'domaine';
  var trial = Math.max(0, Math.min(90, parseInt(g('agtins-trial'), 10) || 0));
  // ★ « remise » : le domaine s'ouvre SANS essai. onboardTenant lit trialDays au
  //   registre pour poser trial_until ; on lui donne 0, et la duree voulue part dans
  //   trialPrevu. Le compte a rebours s'arme d'un bouton, sur l'ecran des identifiants,
  //   au moment ou on les dicte au telephone.
  var tstart = (g('agtins-tstart') === 'now') ? 'now' : 'remise';
  var trialNow = (tstart === 'now') ? trial : 0;

  if (!nom) { showToast('Nom du domaine requis', '#B85A1A'); var e1 = document.getElementById('agtins-nom'); if (e1) e1.focus(); return; }
  if (!slug || slug.length < 2) { showToast('Identifiant invalide', '#B85A1A'); return; }
  if (!mail || mail.indexOf('@') < 0) { showToast('E-mail de l\u2019administrateur requis', '#B85A1A'); var e2 = document.getElementById('agtins-mail'); if (e2) e2.focus(); return; }
  if (!_agtIns.parc.length) { showToast('Lisez d\u2019abord le fichier de parcellaire', '#B85A1A'); return; }
  // ⚠️ Le contour se rattache a la parcelle par son NOM. Un nom vide, ou deux fois le
  //    meme, et le rattachement devient impossible ou ambigu — en silence, a l'ecran
  //    du client. On refuse ici plutot que de l'ecrire.
  var _vide = 0, _vus = {}, _dbl = '';
  _agtIns.parc.forEach(function (p) {
    var n = String(p.nom || '').trim();
    if (!n) { _vide++; return; }
    var k = n.toLowerCase();
    if (_vus[k] && !_dbl) _dbl = n;
    _vus[k] = 1;
  });
  if (_vide) { showToast(_vide + ' parcelle' + (_vide > 1 ? 's sont sans nom' : ' est sans nom'), '#B85A1A'); return; }
  if (_dbl) { showToast('Deux parcelles se nomment \u00ab ' + _dbl + ' \u00bb \u2014 le contour ne saurait pas \u00e0 laquelle se rattacher', '#B85A1A'); return; }
  // ⚠️ Une periode sans nom ou sans dates est invisible pour toute la chaine de
  //    charge — le bug d'onboarding de juillet, en pire puisqu'il serait volontaire.
  var _pm = _agtIns.per.filter(function (p) { return !p.nom || !p.debut || !p.fin || p.fin < p.debut; });
  if (_pm.length) { showToast(_pm.length + ' p\u00e9riode' + (_pm.length > 1 ? 's incompl\u00e8tes' : ' incompl\u00e8te') + ' \u2014 nom et dates exig\u00e9s', '#B85A1A'); return; }
  if (_agtIns.per.length && !_agtIns.per.some(function (p) { return (p.taches || []).length; })) {
    showToast('Aucune p\u00e9riode ne porte de t\u00e2che', '#B85A1A'); return;
  }

  var btn = document.getElementById('agtins-go');
  _agtIns.busy = true;
  if (btn) { btn.disabled = true; btn.textContent = 'Installation\u2026'; }

  try {
    // 1. Registre — ★ GTFIX-1 (§510) : relu et écrit d'un bloc (GT-B01). Une lecture ratée arrête
    //    l'installation ICI, avant tout compte créé, au lieu d'effacer les autres clients du registre.
    await _agtMajRegistre(function (clients, slugs) {
      if (clients[slug] && clients[slug].status === 'active') throw new Error('Ce domaine est d\u00e9j\u00e0 install\u00e9');
      if (slugs.indexOf(slug) < 0) slugs.push(slug);
      clients[slug] = { plan: plan, trialDays: trialNow, status: 'pending', created_at: new Date().toISOString() };
      // ⚠️ trialPrevu n'est LU PAR PERSONNE cote serveur : c'est une note pour la fiche
      //    client, qui dirait sinon « abonnement actif » d'un domaine en attente de remise.
      if (trial > 0 && !trialNow) clients[slug].trialPrevu = trial;
    });

    // 2. Les communes, une seule fois chacune (meteo par secteur des l'ouverture).
    var _comm = await _agtInsGeoComm();

    // 3. Le domaine
    var an = new Date().getFullYear();
    var res = await window._fbOnboardTenant({
      slug: slug,
      email: mail,
      adminNom: admnom,
      membres: [{ nom: admnom, email: mail, roles: ['admin', 'ouvrier', 'tractoriste'], couleur: '#3D6B27', statut: 'actif' }],
      parcelles: _agtIns.parc.map(function (p) {
        var o = { nom: p.nom, surface: p.surface, statut: 'Active', taches: {} };
        var k = String(p.commune || '').trim().toLowerCase();
        if (k && _comm[k]) o.commune = _comm[k];
        return o;
      }),
      // ⚠️ debut ET fin obligatoires : sans elles _saisonForDate() ne voit rien, la période
      //    est invisible et toute la chaîne de charge reste vide (bug vécu à l'onboarding).
      saisons: _agtInsPerSaisons(an),
      taches: window.TACHES || [],
      // Object.assign : ce qui a ete repris du formulaire s'ajoute sans qu'aucune
      // de ces quatre cles puisse etre perdue.
      config: Object.assign({
        domaine_nom: nom,
        lat: (_agtIns.geo ? _agtIns.geo.lat : 47.22),
        lon: (_agtIns.geo ? _agtIns.geo.lon : 4.97),
        onboarding_done: true
      }, _agtIns.cfg || {})
    });

    // 3bis. Les machines. Ecrites SEULEMENT si une liste a ete lue : sinon le
    //       domaine garde le tracteur unique du demarrage, comme avant ce lot.
    if (_agtIns.mach.length) {
      try {
        if (window.fbAdminWrite) await window.fbAdminWrite(slug, 'tracteurs_list', _agtIns.mach);
      } catch (e) {
        showToast('Domaine cr\u00e9\u00e9, machines \u00e0 saisir dans R\u00e9glages', '#B85A1A');
        if (window.logError) window.logError({ level: 'info', cat: 'agt-install', msg: 'ecriture tracteurs_list' });
      }
    }

    // 3. Les polygones, pour la carte — même écriture que l'onglet KML.
    try {
      if (window.fbAdminWrite) {
        await window.fbAdminWrite(slug, 'kml_polygons', _agtIns.parc.map(function (p) {
          return { name: p.nom, pts: p.pts };
        }));
      }
    } catch (e) {
      showToast('Domaine cr\u00e9\u00e9, contours \u00e0 renvoyer par l\u2019onglet KML', '#B85A1A');
    }

    _agtIns.creds = {
      nom: nom, slug: slug, mail: mail, plan: plan,
      pwd: (res && res.password) || '',
      trial: trial, trialArme: !!trialNow,
      parc: _agtIns.parc.length, ha: _agtInsSurfTot()
    };
    _agtIns.parc = [];
    _agtInsRender();
    if (window.renderAdminGT) renderAdminGT();
  } catch (e) {
    showToast('\u00c9chec : ' + (e.message || e.code || 'erreur'), '#C0392B');
    if (btn) { btn.disabled = false; btn.textContent = 'Installer le domaine'; }
  }
  _agtIns.busy = false;
}

function _agtInsCreds() {
  var c = _agtIns.creds;
  var E = window._escHtml || function (x) { return String(x == null ? '' : x); };
  // ⚠️ « essai de 15 jours » ne disait pas s'il COURT. Deux domaines identiques a
  //    l'ecran, l'un dont le compte a rebours tourne et l'autre non : le sous-titre
  //    doit trancher, pas decrire.
  var _ess = !c.trial ? '' : (c.trialArme
    ? ' \u00b7 essai de ' + c.trial + ' jours, en cours'
    : ' \u00b7 essai de ' + c.trial + ' jours, non d\u00e9marr\u00e9');
  var h = '<div class="agi-hd"><div><h3>' + E(c.nom) + ' est ouvert</h3>';
  h += '<p>' + c.parc + ' parcelles \u00b7 ' + c.ha.toFixed(2) + ' ha' + _ess + '</p></div>';
  h += '<button class="agi-x" onclick="agtInsClose()">'+_mvIcon('croix',16)+'</button></div>';
  h += '<div class="agi-cr"><div class="k">Adresse</div><div class="v">mavigneapp.fr/?tenant=' + E(c.slug) + '</div></div>';
  h += '<div class="agi-cr"><div class="k">Identifiant</div><div class="v">' + E(c.mail) + '</div></div>';
  h += '<div class="agi-cr"><div class="k">Mot de passe</div><div class="v">' + E(c.pwd || '\u2014') + '</div></div>';
  h += '<div class="agi-w">Ce mot de passe ne sera plus jamais affich\u00e9. Il est fait pour \u00eatre dit au ';
  h += 't\u00e9l\u00e9phone : le client le tape une fois, l\u2019application lui demande aussit\u00f4t de choisir le sien. ';
  h += '<b>Si vous le perdez, le bouton \u00ab Nouveau mot de passe \u00bb de la fiche client en refait un.</b></div>';
  if (c.trial && !c.trialArme) {
    h += '<div class="agi-w" style="border-color:rgba(201,168,76,0.45)">';
    h += '<b>L\u2019essai de ' + c.trial + ' jours n\u2019est pas d\u00e9marr\u00e9.</b> Le domaine est ouvert, le ';
    h += 'compte \u00e0 rebours non : le client a un acc\u00e8s complet jusqu\u2019\u00e0 ce que vous appuyiez. ';
    h += 'Appuyez au moment o\u00f9 vous dictez les identifiants, pas avant.';
    h += '<div style="margin-top:10px"><button class="agi-b or" id="agtins-tgo" onclick="agtInsTrialGo()">';
    h += 'D\u00e9marrer l\u2019essai de ' + c.trial + ' jours</button></div></div>';
  }
  h += '<div style="display:flex;gap:8px;margin-top:16px">';
  h += '<button class="agi-b or" style="flex:1" onclick="agtInsCopy()">Copier les identifiants</button>';
  h += '<button class="agi-b" onclick="agtInsClose()">Fermer</button></div>';
  return h;
}

function agtInsCopy() {
  var c = _agtIns.creds; if (!c) return;
  // ⚠️ TEXTE BRUT destiné au presse-papier, PAS du HTML : aucun échappement ici, sinon le
  // client lirait « &amp; » dans son mail. Écrit ligne à ligne plutôt qu'en une longue
  // concaténation : c'est plus lisible, et ça lève l'ambiguïté avec le fragment de HTML
  // qui précède — le contrôle anti-XSS du preflight lit le voisinage, il ne peut pas
  // deviner qu'ici le sink est le presse-papier.
  var txt = [
    'Ma Vigne \u2014 ' + c.nom,
    'Adresse : https://mavigneapp.fr/?tenant=' + c.slug,
    'Identifiant : ' + c.mail,
    'Mot de passe : ' + c.pwd,
    '',
    'Ce mot de passe est provisoire : l\u2019application vous demandera d\u2019en choisir un autre \u00e0 la premi\u00e8re connexion.'
  ].join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(function () { showToast('Identifiants copi\u00e9s', '#3D6B27'); })
      .catch(function () { showToast(txt, '#1A4A7A'); });
  } else { showToast(txt, '#1A4A7A'); }
}

// Arme le compte a rebours, au moment ou les identifiants sont dictes. MEME CHAINE
// que _fcSaveAbo, et dans le meme ordre : les claims d'abord (c'est eux qui font foi
// pour le bandeau et le gel en lecture seule), le registre ensuite (c'est lui que la
// fiche client relit pour afficher J-X). trialPrevu disparait : il a servi.
// ⚠️ Si la fenetre a ete fermee avant l'appui, l'essai se pose par la fiche client :
//    onglet Abonnement, meme duree, bouton Enregistrer. C'est le meme geste.
async function agtInsTrialGo() {
  var c = _agtIns.creds;
  if (!c || !c.trial || c.trialArme) return;
  var btn = document.getElementById('agtins-tgo');
  if (btn) { btn.disabled = true; btn.textContent = 'Un instant\u2026'; }
  try {
    if (!window._fbSetTenantPlan) throw new Error('_fbSetTenantPlan indisponible');
    var r = await window._fbSetTenantPlan(c.slug, c.plan || 'domaine', c.trial);
    var exp = (r && typeof r.trialUntil === 'number') ? r.trialUntil : (Date.now() + c.trial * 86400000);
    // ★ GTFIX-1 (§510) : relu et écrit d'un bloc — l'ancienne version écrivait `slugs: []` si la
    //   lecture de `tenants` échouait (GT-B01).
    await _agtMajRegistre(function (clients) {
      // Object.assign sur l'existant : plan, status et created_at ne se perdent pas.
      var cur = Object.assign({}, clients[c.slug] || {}, { trialDays: c.trial, trialExp: exp });
      delete cur.trialPrevu;
      clients[c.slug] = cur;
    });
    c.trialArme = true;
    if (typeof agtLogAccess === 'function') agtLogAccess(c.slug, 'Essai de ' + c.trial + ' j d\u00e9marr\u00e9', '\u23F3', 'commercial');
    showToast('Essai de ' + c.trial + ' jours d\u00e9marr\u00e9', '#3D6B27');
    _agtInsRender();
    if (window.renderAdminGT) renderAdminGT();
  } catch (e) {
    showToast('\u00c9chec : ' + ((e && (e.message || e.code)) || 'erreur'), '#C0392B');
    if (btn) { btn.disabled = false; btn.textContent = 'D\u00e9marrer l\u2019essai de ' + c.trial + ' jours'; }
  }
}

// Nouveau mot de passe pour un membre d'un domaine — la sortie de secours quand la
// fenêtre de remise a été fermée trop vite. resetMemberPassword accepte déjà un appelant
// GUERETTECH avec un `tenant` explicite : rien à ajouter côté serveur, il manquait le bouton.
async function agtResetPwd(slug, email, btn) {
  if (btn) { btn.disabled = true; btn.textContent = '\u2026'; }
  try {
    var r = await window.fbCallFn('resetMemberPassword', { email: email, tenant: slug }, { timeout: 20000 });
    var pwd = (r && r.password) || '';
    _agtIns.creds = { nom: slug, slug: slug, mail: email, pwd: pwd, trial: 0, parc: 0, ha: 0 };
    _agtInsHost().classList.add('on');
    _agtInsRender();
    await agtLogAccess(slug, 'Nouveau mot de passe \u2014 ' + email, '\uD83D\uDD11');
  } catch (e) {
    showToast('\u00c9chec : ' + (e.message || e.code || 'erreur'), '#C0392B');
  }
  if (btn) { btn.disabled = false; btn.textContent = 'Nouveau mot de passe'; }
}


// ============================================================================
// AXE A — BUSINESS & LEADS
// ============================================================================
// Deux ecrans qui n'existaient pas : ou en est chaque client (formule, essai,
// facturation) et qui a frappe a la porte (collection `leads`, ecrite depuis
// des mois par submitLead et affichee NULLE PART — c'est par la qu'est arrive
// le premier prospect entrant).
//
// OU VIT QUOI, et pourquoi :
//   _guerettech/tenants        -> slugs + statuts[slug] SEULEMENT. LISIBLE
//                                 PUBLIQUEMENT (unicite des slugs a
//                                 l'onboarding + routage pre-auth). Aucune
//                                 donnee commerciale n'y entre : voir
//                                 _agtWriteClients, qui l'ecrit toujours en
//                                 entier et sans le champ `clients`.
//   _guerettech/clients        -> {clients:{slug:{plan,trialDays,status,
//                                 created_at,trialExp}}}            GT-only.
//   _guerettech/billing        -> {value:{slug:{fact:[...],note}}}  GT-only.
//   _guerettech/leads_status   -> {value:{leadId:{st,note,ts}}}     GT-only.
//                                 `leads` est write:if false cote client : le
//                                 statut commercial ne peut pas y vivre.

var _AGT_PRIX  = { essentiel:29, vigneron:49, domaine:79 };
var _AGT_PLANL = { essentiel:'Essentiel', vigneron:'Vigneron', domaine:'Domaine' };
var _AGT_LEADST = {
  nouveau : { l:'Nouveau',    c:'#E8C860' },
  repondu : { l:'R\u00e9pondu',    c:'#4A9FC8' },
  mer     : { l:'Mise en route', c:'#C4B5FD' },
  installe: { l:'Install\u00e9',    c:'#86EFAC' },
  perdu   : { l:'Sans suite', c:'rgba(255,255,255,0.3)' }
};
var _agtFactArm = '';   // suppression de facture en deux temps

function _agtEur(n){
  var v=Math.round((Number(n)||0)*100)/100;
  return (v%1===0? String(v) : v.toFixed(2).replace('.',',')) + '\u00a0\u20ac';
}
function _agtHexId(id){ return (typeof id==='string' && /^[0-9a-f]{8,64}$/.test(id)) ? id : ''; }

// Une date peut arriver en Timestamp Firestore, en ISO ou en ms.
function _agtD(v){
  try{
    if(!v) return null;
    if(typeof v==='object' && typeof v.toDate==='function') return v.toDate();
    if(typeof v==='object' && typeof v.seconds==='number')  return new Date(v.seconds*1000);
    var d=new Date(v);
    return isNaN(d.getTime())?null:d;
  }catch(e){ return null; }
}
function _agtDateFr(v){
  var d=_agtD(v);
  if(!d) return '\u2014';
  var p=function(n){ return (n<10?'0':'')+n; };
  return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear();
}

function _agtCli(slug){ return (_agtClients && _agtClients[slug]) ? _agtClients[slug] : {}; }
function _agtPlan(slug){
  var p=_agtCli(slug).plan;
  return (p==='essentiel'||p==='vigneron'||p==='domaine') ? p : 'domaine';
}

// Statut commercial. Source = le registre de vente, qui est le reflet ecrit par
// GT ; la verite d'execution reste le claim trial_until du compte client.
function _agtStatutOf(slug){
  var c=_agtCli(slug), now=Date.now();
  // ★ GTFIX-3 : sans fiche commerciale, un domaine est « à qualifier » — jamais compté abonné à 79 € (GT-B14).
  if(!c.status && !c.plan && !c.trialExp && !c.trialDays && !c.created_at && !c.activated_at)
    return { cle:'aqualifier', label:'\u00c0 qualifier', color:'#9CA3AF', jours:0 };
  var exp=0;
  if(c.trialExp) { var d=_agtD(c.trialExp); exp=d?d.getTime():0; }
  if(exp>now){
    var j=Math.ceil((exp-now)/86400000);
    return { cle:'essai', label:'Essai J-'+j, color:(j<=3?'#F97316':'#E8C860'), jours:j };
  }
  if(c.status==='pending') return { cle:'pending', label:'\u00c0 installer', color:'#C4B5FD', jours:0 };
  if(exp>0)               return { cle:'echu',    label:'Essai \u00e9chu',  color:'#EF4444', jours:0 };
  return { cle:'actif', label:'Abonn\u00e9', color:'#86EFAC', jours:0 };
}

function _agtFacts(slug){
  var b=_agtBilling[slug];
  return (b && Array.isArray(b.fact)) ? b.fact : [];
}

// ★★ GTFIX-1 (§510) — LA FACTURATION S'ÉCRIT DOMAINE PAR DOMAINE, EN COMPARANT AVANT D'ÉCRIRE.
//   Avant : tout `billing` réécrit depuis la copie chargée à l'ouverture. Maintenant, dans la
//   transaction : les AUTRES domaines viennent de la base relue (rien d'écrit ailleurs ne se perd) ;
//   celui qu'on modifie n'est écrit que s'il n'a pas changé depuis la lecture — sinon tout est
//   rechargé et le geste est à refaire (rien n'est écrasé en silence).
var _agtBillingBase = {};
function _agtBillingNoter(b){ _agtBillingBase = {}; Object.keys(b || {}).forEach(function(s){ _agtBillingBase[s] = _agtJsonStable(b[s]); }); }
function _agtMutBilling(d, existe, slug, local, base){
  var v;
  if (!existe) v = {};
  else if (d && d.value && typeof d.value === 'object' && !Array.isArray(d.value)) v = d.value;
  else throw new Error('facturation illisible');
  if (_agtJsonStable(v[slug]) !== base){ var c = new Error('facturation modifi\u00e9e ailleurs'); c.conflit = true; c.frais = v; throw c; }
  if (local === undefined) delete v[slug]; else v[slug] = local;
  return { value: v };
}
async function _agtSaveBilling(slug){
  var local = (_agtBilling[slug] === undefined) ? undefined : JSON.parse(JSON.stringify(_agtBilling[slug]));
  var base = _agtBillingBase[slug];
  try{
    if(!window.fbGtMaj) throw new Error('fbGtMaj indisponible');
    var r = await window.fbGtMaj('billing', function(d, existe){ return _agtMutBilling(d, existe, slug, local, base); });
    _agtBilling = r.valeur.value; _agtBillingNoter(_agtBilling);
    return true;
  }catch(e){
    if (e && e.conflit && e.frais){ _agtBilling = e.frais; _agtBillingNoter(_agtBilling); }
    else if (base !== undefined) _agtBilling[slug] = JSON.parse(base);
    else delete _agtBilling[slug];
    _agtEchecEcriture(e, 'Facturation');
    agtRenderBody(); if (typeof _agtBizFill === 'function') _agtBizFill();
    return false;
  }
}

// ─── Onglet BUSINESS ────────────────────────────────────────────────────────
// Lot A (06/08/2026) — lignes TYPEES, echeances, gestes commerciaux, courbes de
// l'annee, documents de travail et export comptable.
//
// AUCUNE COLLECTION NOUVELLE : on reste sur _guerettech/billing, GT-only,
// format {value:{slug:{fact:[...], note, interne}}}.
// RETROCOMPATIBLE SANS MIGRATION : une ligne sans `type` est lue comme un
// abonnement, sans `echeance` comme date + 30 jours. Les factures deja saisies
// remontent telles quelles.
//
// UN GESTE COMMERCIAL est une ligne de montant NEGATIF, portant le meme numero
// que la facture qu'elle corrige : c'est un avoir. Il n'a pas de bouton
// « payee » (on ne l'encaisse pas), seulement « appliquee ».

var _AGT_TY = {
  abo   : { lbl:'Abonnement',   ini:'A', col:'#C9A84C' },
  inst  : { lbl:'Installation', ini:'I', col:'#8B5CF6' },
  heures: { lbl:'Heures',       ini:'H', col:'#3B82F6' },
  geste : { lbl:'Geste',        ini:'G', col:'#C4B5FD' }
};
var _AGT_INST  = { essentiel:490, vigneron:690, domaine:990 };  // forfait d'installation
var _AGT_INSTH = { essentiel:10,  vigneron:15,  domaine:20  };  // heures incluses
var _AGT_TAUXH = 60;                                            // au-dela du volant inclus
var _AGT_ECH_J = 30;                                            // echeance par defaut
var _agtBizTy  = {};   // slug -> type choisi dans le formulaire
var _agtBizAn  = null; // annee affichee (null = annee courante)

function _agtFType(f){ var t=f&&f.type; return _AGT_TY[t]?t:'abo'; }
function _agtIso(d){
  var p=function(n){ return (n<10?'0':'')+n; };
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
}
function _agtJours(a,b){ return Math.round((b.getTime()-a.getTime())/86400000); }

// Echeance : celle qui est saisie, sinon date + 30 jours (lignes d'avant le lot A).
function _agtFEch(f){
  if(f && f.echeance) return f.echeance;
  var d=_agtD(f&&f.date);
  if(!d) return '';
  d.setDate(d.getDate()+_AGT_ECH_J);
  return _agtIso(d);
}
function _agtFRetard(f){
  if(!f || _agtFType(f)==='geste' || f.statut==='payee') return 0;
  var e=_agtD(_agtFEch(f));
  if(!e) return 0;
  return Math.max(0, _agtJours(e, new Date()));
}
function _agtFAn(f){ var d=_agtD(f&&f.date); return d?d.getFullYear():0; }

// Un tenant « interne » (le domaine de reference par defaut : c'est le domaine de
// developpement, jamais facture) sort du recurrent et des totaux, sinon les
// indicateurs racontent une histoire fausse. Reversible d'un clic.
function _agtInterne(slug){
  var b=_agtBilling[slug];
  if(b && typeof b.interne==='boolean') return b.interne;
  return slug==='marchand-grillot';
}
// ETAT D'UNE REFERENCE — un geste porte le numero de la facture qu'il corrige.
// C'est le reglement de CETTE reference qui decide de quel cote tombe le geste :
//   facture 990 impayee + geste -495  ->  495 a encaisser, 0 encaisse
//   la meme, une fois reglee          ->  0 a encaisser, 495 encaisses
// Sans cela, marquer la facture « payee » ferait apparaitre 990 encaisses alors
// que 495 seulement sont rentres.
function _agtRefEtat(slug, ref){
  var r=String(ref||''), n=0, paye=0;
  _agtFacts(slug).forEach(function(f){
    if(_agtFType(f)==='geste' || String(f.ref||'')!==r) return;
    n++; if(f.statut==='payee') paye++;
  });
  if(!n) return 'orpheline';
  return (paye===n) ? 'payee' : 'due';
}
// SOURCE UNIQUE de la ventilation d'une ligne. Tout le reste s'en sert :
// les totaux, les cartes clients, les courbes et l'export.
function _agtFVent(slug, f){
  var v=Number(f&&f.montant)||0;
  if(_agtFType(f)==='geste'){
    return (_agtRefEtat(slug, f.ref)==='due') ? { du:v, enc:0 } : { du:0, enc:v };
  }
  return (f.statut==='payee') ? { du:0, enc:v } : { du:v, enc:0 };
}
// ════ GTFIX-3 (§512) — L'ARGENT JUSTE ════
// ★★★ L'audit du 01/11 (docs/maquettes/audit-console-gt-2026-11-01.md) :
//   GT-B08 — l'encaissé se rangeait à la date de FACTURE ; le livre des recettes d'un micro-entrepreneur suit
//            la date où l'argent arrive, avec six mentions : date d'encaissement, numéro de facture, client,
//            nature, montant, mode de règlement. `paye_le` était écrit, jamais lu, et prenait la date du clic ;
//   GT-B09 — la relance, « À traiter », les retards et le récapitulatif lisaient le montant BRUT : une
//            installation à 990 € avec l'offre à −495 € était réclamée 990 € ;
//   GT-B10 — un domaine supprimé sortait des totaux, des courbes, de l'export et de la numérotation ;
//   GT-B13 — un abonnement annuel déclenchait « à émettre » tous les mois ;
//   GT-B14 — un domaine sans fiche commerciale comptait comme abonné à 79 €.
var _AGT_MODES = { virement:'Virement', cheque:'Ch\u00e8que', prelevement:'Pr\u00e9l\u00e8vement', carte:'Carte', especes:'Esp\u00e8ces' };
function _agtFPayeLe(f){ return (f && typeof f.paye_le==='string' && /^\d{4}-\d{2}-\d{2}$/.test(f.paye_le)) ? f.paye_le : ''; }
// Le règlement d'une référence : réglée quand TOUTES ses lignes le sont ; sa date = la plus tardive ; `aDater`
// quand une ligne réglée n'a pas de date de paiement (lignes d'avant GTFIX-3) — elle prend alors sa date de facture.
function _agtRefReglement(slug, ref){
  var r=String(ref||''), n=0, ok=true, d='', aDater=false, mode='';
  _agtFacts(slug).forEach(function(f){
    if(_agtFType(f)==='geste' || String(f.ref||'')!==r) return;
    n++;
    if(f.statut!=='payee'){ ok=false; return; }
    var p=_agtFPayeLe(f);
    if(!p){ aDater=true; p=String(f.date||''); }
    if(p>d) d=p;
    if(!mode && f.mode) mode=String(f.mode);
  });
  return (n && ok) ? { date:d, aDater:aDater, mode:mode } : null;
}
// La date d'encaissement d'une ligne : celle de son règlement ; un avoir suit le règlement de sa facture (un
// avoir orphelin, sans facture, garde sa date). Mêmes montants que _agtFVent — seule la DATE change.
function _agtFEncInfo(slug, f){
  var v=_agtFVent(slug, f), rien={ enc:0, date:'', aDater:false, mode:'' };
  if(!v.enc) return rien;
  if(_agtFType(f)==='geste'){
    var rg=_agtRefReglement(slug, f.ref);
    if(rg) return { enc:v.enc, date:rg.date, aDater:rg.aDater, mode:rg.mode };
    return { enc:v.enc, date:String(f.date||''), aDater:false, mode:'' };
  }
  var p=_agtFPayeLe(f);
  return { enc:v.enc, date:p||String(f.date||''), aDater:!p, mode:String(f.mode||'') };
}
// Le reste dû d'une référence, avoirs déduits (GT-B09) — 0 quand elle est réglée.
function _agtRefReste(slug, ref){
  var r=String(ref||''), s=0, due=false;
  _agtFacts(slug).forEach(function(f){
    if(String(f.ref||'')!==r || _agtFType(f)==='geste') return;
    if(f.statut!=='payee'){ due=true; s+=Number(f.montant)||0; }
  });
  if(!due) return 0;
  _agtFacts(slug).forEach(function(f){ if(_agtFType(f)==='geste' && String(f.ref||'')===r) s+=Number(f.montant)||0; });
  return Math.max(0, Math.round(s*100)/100);
}
// Les domaines de la facturation : ceux du registre, PUIS ceux qui n'y sont plus mais dont les factures restent
// (domaine supprimé, GT-B10 : `gtDeleteTenant` garde `billing`). `i` = -1 : ni carte ni geste, mais les
// totaux, les courbes, l'export et le livre des recettes les comptent. Les domaines internes en sortent.
function _agtBizSlugs(){
  var vus={}, out=[];
  _agtTenants.forEach(function(t,i){ vus[t.slug]=1; if(!_agtInterne(t.slug)) out.push({ slug:t.slug, nom:t.nom, i:i, supprime:false }); });
  Object.keys(_agtBilling||{}).sort().forEach(function(sl){
    if(vus[sl] || _agtInterne(sl) || !_agtFacts(sl).length) return;
    out.push({ slug:sl, nom:sl+' (supprim\u00e9)', i:-1, supprime:true });
  });
  return out;
}
// La date d'un paiement saisi : une date réelle (« 31/09 » arrive vide, PERDATE-1), jamais dans le futur.
function _agtPaieDateErr(v, aujourdhui){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))) return 'Date du paiement invalide';
  if(String(v) > String(aujourdhui)) return 'Un paiement ne se date pas dans le futur';
  return '';
}
// Le prochain abonnement : un mois après une ligne mensuelle, douze après une ligne annuelle (GT-B13).
function _agtAboProchain(f){
  var d=_agtD(f&&f.date); if(!d) return null;
  d.setMonth(d.getMonth()+((f.per==='annuel')?12:1));
  return d;
}
function _agtBizDu(slug){
  var s=0;
  _agtFacts(slug).forEach(function(f){ s+=_agtFVent(slug,f).du; });
  return s;
}
function _agtBizEnc(slug){
  var s=0;
  _agtFacts(slug).forEach(function(f){ s+=_agtFVent(slug,f).enc; });
  return s;
}
function _agtBizFactTot(slug, an){
  var s=0;
  _agtFacts(slug).forEach(function(f){ if(!an || _agtFAn(f)===an) s+=(Number(f.montant)||0); });
  return s;
}
function _agtBizAnnee(){
  if(_agtBizAn) return _agtBizAn;
  return new Date().getFullYear();
}
function _agtBizAnnees(){
  var set={}, cur=new Date().getFullYear();
  set[cur]=1;
  _agtBizSlugs().forEach(function(x){ _agtFacts(x.slug).forEach(function(f){
    var a=_agtFAn(f); if(a) set[a]=1;
    var e=_agtFEncInfo(x.slug, f), d=e.enc?_agtD(e.date):null; if(d) set[d.getFullYear()]=1;   // ★ GTFIX-3 : une année d'encaissements
  }); });
  return Object.keys(set).map(Number).sort(function(a,b){ return b-a; });
}
// Toutes les lignes des clients FACTURABLES, avec leur tenant.
function _agtBizLignes(an){
  var out=[];
  _agtBizSlugs().forEach(function(x){   // ★ GTFIX-3 : les domaines supprimés aussi (GT-B10)
    _agtFacts(x.slug).forEach(function(f,k){
      if(an && _agtFAn(f)!==an) return;
      out.push({ t:{ slug:x.slug, nom:x.nom, supprime:x.supprime }, i:x.i, f:f, k:k });
    });
  });
  return out;
}

// ── Graphes : hauteur FIXE, aucun texte mis a l'echelle ─────────────────────
// Defaut corrige le 06/08 : les SVG portaient un viewBox de 640 px de large et
// s'etiraient a la largeur du panneau (.agt-body n'a pas de max-width). Sur un
// grand ecran, tout etait multiplie par 2 a 3 — glyphes, traits, barres — et
// debordait. Regle : les BARRES sont en HTML/CSS (aucune mise a l'echelle
// possible), et la seule courbe qui reste en SVG a une hauteur en pixels, des
// coordonnees en pourcentage et des traits a epaisseur constante.
var _AGT_MOIS_L=['J','F','M','A','M','J','J','A','S','O','N','D'];

function _agtBizMois(an){
  var m=[], i;
  for(i=0;i<12;i++) m.push({ abo:0, inst:0, heures:0, geste:0, fact:0, enc:0, aDater:0 });
  _agtBizLignes(0).forEach(function(x){
    var v=Number(x.f.montant)||0, ty=_agtFType(x.f), d=_agtD(x.f.date);
    if(d && d.getFullYear()===an){ m[d.getMonth()][ty]+=v; m[d.getMonth()].fact+=v; }
    // ★ GTFIX-3 : l'encaissé au mois du RÈGLEMENT, quelle que soit l'année de la facture (GT-B08)
    var e=_agtFEncInfo(x.t.slug, x.f), de=e.enc?_agtD(e.date):null;
    if(de && de.getFullYear()===an){ m[de.getMonth()].enc+=e.enc; if(e.aDater) m[de.getMonth()].aDater+=e.enc; }
  });
  return m;
}
function _agtMoisCourant(an){
  var now=new Date();
  return (an===now.getFullYear()) ? now.getMonth() : 11;
}

// G1 — cumul de l'annee. SVG en coordonnees 0..100, etire librement : seules
// des lignes le traversent, et `non-scaling-stroke` garde leur epaisseur.
// Graduations et mois sont en HTML, donc jamais deformes.
function _agtBizG1(an){
  var m=_agtBizMois(an), H=150, i;
  var cf=[], ce=[], ca=[], sf=0, se=0, sa=0;
  for(i=0;i<12;i++){ sf+=m[i].fact; se+=m[i].enc; sa+=m[i].abo; cf.push(sf); ce.push(se); ca.push(sa); }
  var max=Math.max(100, Math.max.apply(null,cf))*1.12;
  var X=function(k){ return (k*(100/11)).toFixed(2); };
  var Y=function(v){ return ((1-v/max)*100).toFixed(2); };
  var poly=function(a){ return a.map(function(v,k){ return (k?'L':'M')+X(k)+' '+Y(v); }).join(' '); };
  var iN=_agtMoisCourant(an);

  var svg='<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:'+H+'px;display:block">'
    +'<path d="'+poly(cf)+' L100 100 L0 100 Z" fill="rgba(201,168,76,0.10)"/>'
    +'<path d="'+poly(ca)+'" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>'
    +'<path d="'+poly(cf)+'" fill="none" stroke="#C9A84C" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>'
    +'<path d="'+poly(ce)+'" fill="none" stroke="#86EFAC" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>'
    +'</svg>';

  var h='<div style="display:flex;font-size:10px;color:rgba(255,255,255,0.3)">';
  h+='<div style="width:46px;flex-shrink:0;height:'+H+'px;position:relative">'
    +'<span style="position:absolute;right:6px;top:-5px">'+Math.round(max)+'</span>'
    +'<span style="position:absolute;right:6px;top:'+(H/2-5)+'px">'+Math.round(max/2)+'</span>'
    +'<span style="position:absolute;right:6px;top:'+(H-11)+'px">0</span></div>';
  h+='<div style="flex:1;min-width:0;position:relative;height:'+H+'px">';
  h+='<div style="position:absolute;inset:0;pointer-events:none">'
    +'<div style="position:absolute;left:0;right:0;top:0;height:1px;background:rgba(255,255,255,0.07)"></div>'
    +'<div style="position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(255,255,255,0.07)"></div>'
    +'<div style="position:absolute;left:0;right:0;bottom:0;height:1px;background:rgba(255,255,255,0.10)"></div></div>';
  h+=svg+'</div></div>';
  h+='<div style="display:flex"><div style="width:46px;flex-shrink:0"></div><div style="flex:1;display:flex">';
  for(i=0;i<12;i++)
    h+='<div style="flex:1;text-align:center;font-size:10px;padding-top:4px;color:rgba(255,255,255,'+(i<=iN?'0.42':'0.18')+')">'+_AGT_MOIS_L[i]+'</div>';
  h+='</div></div>';
  h+='<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.4);margin-top:6px">Au '+_agtDateFr(new Date())+' \u2014 '
    +'<b style="color:#E8C860">'+_agtEur(cf[iN])+'</b> factur\u00e9s, <b style="color:#86EFAC">'+_agtEur(ce[iN])+'</b> encaiss\u00e9s'
    +(cf[iN]-ce[iN]>0?(' \u00b7 '+_agtEur(cf[iN]-ce[iN])+' en attente'):'')+'</div>';
  return h;
}

// G2 — facture par mois, par nature. HTML pur : chaque segment est un <div>
// dont la hauteur est un nombre de pixels calcule ici. Rien ne peut s'etirer.
function _agtBizG2(an){
  var m=_agtBizMois(an), HP=104, HN=34, iN=_agtMoisCourant(an);
  var maxP=1, maxN=1;
  m.forEach(function(o){
    var p=o.abo+o.inst+o.heures;
    if(p>maxP) maxP=p;
    if(-o.geste>maxN) maxN=-o.geste;
  });
  var aucunGeste=!m.some(function(o){ return o.geste<0; });
  if(aucunGeste) HN=0;

  var h='<div style="display:flex;font-size:10px;color:rgba(255,255,255,0.3)">';
  h+='<div style="width:40px;flex-shrink:0;position:relative;height:'+(HP+HN+1)+'px">'
    +'<span style="position:absolute;right:6px;top:-4px">'+Math.round(maxP)+'</span>'
    +'<span style="position:absolute;right:6px;top:'+(HP-6)+'px">0</span></div>';
  h+='<div style="flex:1;min-width:0;display:flex;gap:2px">';
  m.forEach(function(o,i){
    h+='<div style="flex:1;min-width:0">';
    h+='<div style="height:'+HP+'px;display:flex;flex-direction:column;justify-content:flex-end">';
    [['heures','#3B82F6'],['inst','#8B5CF6'],['abo','#C9A84C']].forEach(function(p){
      var v=o[p[0]]; if(v<=0) return;
      h+='<div title="'+p[0]+'" style="height:'+Math.max(2,Math.round(v/maxP*HP))+'px;background:'+p[1]+';border-radius:2px 2px 0 0"></div>';
    });
    h+='</div>';
    h+='<div style="height:1px;background:rgba(255,255,255,0.18)"></div>';
    if(HN>0){
      h+='<div style="height:'+HN+'px">';
      if(o.geste<0) h+='<div style="height:'+Math.max(2,Math.round(-o.geste/maxN*HN))+'px;background:#C4B5FD;opacity:.85;border-radius:0 0 2px 2px"></div>';
      h+='</div>';
    }
    h+='<div style="text-align:center;font-size:10px;padding-top:3px;color:rgba(255,255,255,'+(i<=iN?'0.42':'0.18')+')">'+_AGT_MOIS_L[i]+'</div>';
    h+='</div>';
  });
  h+='</div></div>';
  return h;
}

// G3 — solde par client. HTML pur, une ligne par domaine.
function _agtBizG3(){
  var cs=_agtTenants.filter(function(t){ return !_agtInterne(t.slug) && _agtFacts(t.slug).length; });
  if(!cs.length) return '';
  var max=1;
  cs.forEach(function(t){
    var v=Math.max(0,_agtBizEnc(t.slug))+Math.max(0,_agtBizDu(t.slug));
    if(v>max) max=v;
  });
  var h='';
  cs.forEach(function(t){
    var e=Math.max(0,_agtBizEnc(t.slug)), d=Math.max(0,_agtBizDu(t.slug));
    h+='<div style="margin-bottom:10px">';
    h+='<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">';
    h+='<span style="flex:1;min-width:0;font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.7);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_escHtml(t.nom)+'</span>';
    h+='<span style="font-size:var(--pt-micro,11px);font-weight:600;color:'+(d>0?'#F97316':'#86EFAC')+'">'+(d>0?(_agtEur(d)+' d\u00fb'):'sold\u00e9')+'</span>';
    h+='</div>';
    h+='<div style="display:flex;height:9px;border-radius:5px;overflow:hidden;background:rgba(255,255,255,0.05)">';
    if(e>0) h+='<div style="width:'+(e/max*100).toFixed(1)+'%;background:#86EFAC"></div>';
    if(d>0) h+='<div style="width:'+(d/max*100).toFixed(1)+'%;background:#F97316"></div>';
    h+='</div></div>';
  });
  return h;
}

// ── Bloc « A traiter » : ce qui demande une action aujourd'hui ──────────────
// Les lignes « a traiter » sont produites ici et rendues plus bas : le Radar
// (lot C) consomme exactement les memes, sans en recalculer une seule.
function _agtBizTodoRows(){
  var rows=[], now=new Date(), vues={};
  // ★ GTFIX-3 : une ligne par RÉFÉRENCE, au reste dû avoir déduit (GT-B09) ; un domaine supprimé n'a pas de geste.
  _agtBizLignes(0).forEach(function(x){
    var r=_agtFRetard(x.f), cle=x.t.slug+'|'+(x.f.ref||'');
    if(r<=0 || vues[cle]) return;
    vues[cle]=1;
    var reste=_agtRefReste(x.t.slug, x.f.ref); if(reste<=0) return;
    rows.push({ c:'#EF4444', ord:0,
      t:'<b>'+_escHtml(x.t.nom)+'</b> \u2014 '+_escHtml(x.f.ref||'')+' \u00e9chue depuis '+r+' jour'+(r>1?'s':''),
      m:_agtEur(reste), b:(x.i>=0?'Relancer':''), a:(x.i>=0?'agtBizRelance('+x.i+','+x.k+')':'') });
  });
  _agtBizLignes(0).forEach(function(x){
    if(_agtFRetard(x.f)>0 || x.f.statut==='payee' || _agtFType(x.f)==='geste') return;
    var e=_agtD(_agtFEch(x.f)); if(!e) return;
    var j=_agtJours(now,e), cle=x.t.slug+'|'+(x.f.ref||'');
    if(j<0 || j>10 || vues[cle]) return;
    vues[cle]=1;
    var reste=_agtRefReste(x.t.slug, x.f.ref); if(reste<=0) return;
    rows.push({ c:'#F97316', ord:1,
      t:'<b>'+_escHtml(x.t.nom)+'</b> \u2014 '+_escHtml(x.f.ref||'')+' \u00e0 \u00e9ch\u00e9ance dans '+j+' jour'+(j>1?'s':''),
      m:_agtEur(reste), b:(x.i>=0?'Relev\u00e9':''), a:(x.i>=0?'agtBizReleve('+x.i+')':'') });
  });
  // Les paiements sans date (lignes réglées d'avant GTFIX-3) : à dater, sinon le livre des recettes les range
  // à leur date de facture.
  var sansDate=_agtBizLignes(0).filter(function(x){ return _agtFType(x.f)!=='geste' && x.f.statut==='payee' && !_agtFPayeLe(x.f); });
  if(sansDate.length){
    var p0=sansDate.filter(function(x){ return x.i>=0; })[0];
    rows.push({ c:'#C4B5FD', ord:4,
      t:sansDate.length+' paiement'+(sansDate.length>1?'s':'')+' sans date \u2014 \u00e0 dater pour le livre des recettes',
      m:'', b:(p0?'Dater':''), a:(p0?'agtFactPaye('+p0.i+','+p0.k+')':'') });
  }
  _agtTenants.forEach(function(t,i){
    if(_agtInterne(t.slug)) return;
    var st=_agtStatutOf(t.slug);
    if(st.cle==='essai'){
      rows.push({ c:'#C4B5FD', ord:2,
        t:'<b>'+_escHtml(t.nom)+'</b> \u2014 essai en cours ('+st.label+'), devis \u00e0 envoyer',
        m:_agtEur(_AGT_INST[_agtPlan(t.slug)]), b:'Facturer', a:'agtBizForm('+i+',\'inst\')' });
      return;
    }
    if(st.cle==='aqualifier'){
      rows.push({ c:'#9CA3AF', ord:3,
        t:'<b>'+_escHtml(t.nom)+'</b> \u2014 \u00e0 qualifier : aucune fiche commerciale (formule, essai, statut)',
        m:'', b:'Fiche', a:'agtShowFiche(\''+_escHtml(t.slug)+'\')' });
      return;
    }
    // ★★ GT-UI-3 (§518) — LA RELANCE D'UN ESSAI ÉCHU EST À DÉCIDER (Nico, 02/11 : « les relances partent que si je
    //   décide de les faire partir »). Quinze jours après la fin d'un essai jamais reconduit — la règle de trialWatch,
    //   qui ne l'envoie plus lui-même et te prévient par mail —, tant qu'elle n'est pas notée faite.
    if(st.cle==='echu'){
      var _rj=_agtRelanceEssaiJours(_agtCli(t.slug));
      if(_rj>=0) rows.push({ c:'#F97316', ord:1,
        t:'<b>'+_escHtml(t.nom)+'</b> \u2014 essai \u00e9chu depuis '+_rj+' jours, jamais reconduit : relance \u00e0 faire',
        m:'', b:'Pr\u00e9parer la relance', a:'agtRelanceEssai(\''+_escAttr(t.slug)+'\')' });
      return;
    }
    if(st.cle!=='actif') return;
    var last=null, lastF=null;
    _agtFacts(t.slug).forEach(function(f){
      if(_agtFType(f)!=='abo') return;
      var d=_agtD(f.date); if(d && (!last || d>last)){ last=d; lastF=f; }
    });
    if(!last){
      rows.push({ c:'#C9A84C', ord:3,
        t:'<b>'+_escHtml(t.nom)+'</b> \u2014 aucun abonnement factur\u00e9 \u00e0 ce jour',
        m:_agtEur(_agtAboPrix(t.slug)), b:'\u00c9mettre', a:'agtBizForm('+i+',\'abo\')' });
      return;
    }
    var due=_agtAboProchain(lastF);   // ★ GTFIX-3 : un mois, ou douze après une ligne annuelle (GT-B13)
    if(due && due<=now) rows.push({ c:'#C9A84C', ord:3,
      t:'<b>'+_escHtml(t.nom)+'</b> \u2014 abonnement \u00e0 \u00e9mettre (dernier : '+_agtDateFr(last)+(lastF.per==='annuel'?', annuel':'')+')',
      m:_agtEur(_agtAboPrix(t.slug)), b:'\u00c9mettre', a:'agtBizForm('+i+',\'abo\')' });
  });
  rows.sort(function(a,b){ return a.ord-b.ord; });
  return rows;
}

function _agtBizTodo(){
  var rows=_agtBizTodoRows();
  var urgent=rows.some(function(r){ return r.c==='#EF4444'; });
  var h='<div style="background:'+(urgent?'rgba(249,115,22,0.06)':'rgba(255,255,255,0.04)')
    +';border:1px solid '+(urgent?'rgba(249,115,22,0.22)':'rgba(255,255,255,0.1)')+';border-radius:12px;padding:12px 14px;margin-bottom:6px">';
  if(!rows.length){
    return h+'<div style="font-size:var(--pt-txt,13px);color:rgba(255,255,255,0.35)">Rien \u00e0 traiter aujourd\u2019hui.</div></div>';
  }
  rows.forEach(function(r,i){
    h+='<div style="display:flex;align-items:center;gap:9px;padding:7px 0;flex-wrap:wrap'
      +(i<rows.length-1?';border-bottom:1px solid rgba(255,255,255,0.05)':'')+'">';
    h+='<span style="width:7px;height:7px;border-radius:50%;flex-shrink:0;background:'+r.c+'"></span>';
    h+='<span style="flex:1;min-width:150px;font-size:var(--pt-txt,13px);color:rgba(255,255,255,0.8)">'+r.t+'</span>';
    h+='<span style="font-size:var(--pt-txt,13px);font-weight:600">'+r.m+'</span>';
    if(r.b) h+='<button onclick="'+r.a+'" style="background:'+(r.b==='\u00c9mettre'||r.b==='Facturer'?'rgba(201,168,76,0.14)':'rgba(255,255,255,0.07)')
      +';border:1px solid '+(r.b==='\u00c9mettre'||r.b==='Facturer'?'rgba(201,168,76,0.3)':'rgba(255,255,255,0.12)')
      +';border-radius:7px;padding:4px 10px;color:'+(r.b==='\u00c9mettre'||r.b==='Facturer'?'#E8C860':'rgba(255,255,255,0.6)')
      +';font-size:var(--pt-micro,11px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">'+r.b+'</button>';
    h+='</div>';
  });
  return h+'</div>';
}

function _agtBizKpi(v,l,c,s){
  return '<div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:12px;text-align:center">'
    +'<div style="font-size:var(--pt-md,20px);font-weight:600;color:'+c+'">'+v+'</div>'
    +'<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);margin-top:3px">'+l+'</div>'
    +'<div style="font-size:10px;color:rgba(255,255,255,0.25);margin-top:2px">'+(s||'')+'</div></div>';
}
function _agtBizCard(titre, sous, corps, leg){
  return '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:13px 14px">'
    +'<div style="font-size:var(--pt-txt,13px);font-weight:600;color:rgba(255,255,255,0.75)">'+titre+'</div>'
    +'<div style="font-size:var(--pt-lbl,10.5px);color:rgba(255,255,255,0.25);margin-bottom:10px">'+sous+'</div>'
    +corps
    +(leg?'<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:var(--pt-lbl,10.5px);color:rgba(255,255,255,0.35);margin-top:8px">'+leg+'</div>':'')
    +'</div>';
}
function _agtBizLeg(col,txt){
  return '<span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px;vertical-align:-1px;background:'+col+'"></i>'+txt+'</span>';
}


// ── Tarif reellement facture (lot D, 06/08/2026) ────────────────────────────
// Un client peut payer moins que le tarif de sa formule, tous les mois, sans
// que ce soit une remise a ressaisir : un client peut etre en Domaine (79 €) au
// tarif Vigneron (49 €) au titre de l'offre de lancement. Le tarif remise vit dans
// _guerettech/billing.{slug}.abo = {prix, motif, fin} — aucune collection neuve.
// TOUT ce qui parle d'argent recurrent passe par _agtAboPrix : le revenu, la
// ligne « abonnement a emettre », le pre-remplissage et le releve de compte.
function _agtAboRemise(slug){
  var b=_agtBilling[slug];
  if(!b || !b.abo || typeof b.abo.prix!=='number' || b.abo.prix<0) return null;
  if(b.abo.fin && b.abo.fin < _agtIso(new Date())) return null;   // remise expiree
  if(b.abo.prix === _AGT_PRIX[_agtPlan(slug)]) return null;       // plus une remise
  return b.abo;
}
function _agtAboPrix(slug){
  var r=_agtAboRemise(slug);
  return r ? r.prix : _AGT_PRIX[_agtPlan(slug)];
}
// Deux saisies enchainees : le prix, puis le motif. openPrompt, jamais prompt().
function agtBizAbo(i){
  var t=_agtTenants[i]; if(!t) return;
  if(!window.openPrompt){ showToast('Saisie indisponible','#B85A1A'); return; }
  var plein=_AGT_PRIX[_agtPlan(t.slug)], r=_agtAboRemise(t.slug);
  window.openPrompt({
    titre:'Tarif mensuel factur\u00e9',
    sub:_escHtml(t.nom)+' \u2014 formule '+(_AGT_PLANL[_agtPlan(t.slug)]||'')+', tarif plein '+plein+' \u20ac. '
      +'Saisissez le montant r\u00e9ellement factur\u00e9 chaque mois. Remettez '+plein+' pour annuler la remise.',
    valeur:String(r?r.prix:plein), unite:'\u20ac/mois', type:'nombre', btnLabel:'Continuer',
    cb:function(v){
      var p=parseFloat(String(v).replace(',','.'));
      if(isNaN(p)||p<0){ showToast('Montant invalide','#B85A1A'); return; }
      if(p===plein){
        if(_agtBilling[t.slug]) delete _agtBilling[t.slug].abo;
        _agtSaveBilling(t.slug).then(function(ok){ if(ok){ showToast('Tarif plein r\u00e9tabli','#3D6B27'); agtRenderBody(); _agtBizFill(); } });
        return;
      }
      window.openPrompt({
        titre:'Motif de la remise',
        sub:'Il appara\u00eet sur le relev\u00e9 de compte et dans le libell\u00e9 des lignes d\u2019abonnement.',
        valeur:(r&&r.motif)?r.motif:'Offre de lancement', type:'texte', btnLabel:'Enregistrer',
        cb:function(mo){
          if(!_agtBilling[t.slug]) _agtBilling[t.slug]={};
          _agtBilling[t.slug].abo={ prix:p, motif:String(mo||'').trim()||'Tarif remis\u00e9', fin:'' };
          _agtSaveBilling(t.slug).then(function(ok){
            if(ok){ showToast('Abonnement \u00e0 '+_agtEur(p)+'/mois','#3D6B27'); agtRenderBody(); _agtBizFill(); }
          });
        }
      });
    }
  });
}

// ── Un geste s'applique a UNE facture (lot D) ───────────────────────────────
// Le geste portait une reference saisie a la main : s'il ne tombait pas sur une
// vraie facture, il etait « orphelin » et ne venait pas en deduction du du.
// Vecu en clientele : une remise rattachee au mauvais numero de facture alors que
// l'installation en portait un autre — le solde reclame etait presque du double.
// Desormais la cible se CHOISIT dans une liste, la reference suit toute seule.
function _agtBizCibles(slug){
  var out=[];
  _agtFacts(slug).forEach(function(f,k){
    if(_agtFType(f)==='geste') return;
    out.push({ k:k, ref:String(f.ref||''), lib:f.libelle||'', montant:Number(f.montant)||0, statut:f.statut });
  });
  out.sort(function(a,b){ return (a.statut==='payee'?1:0)-(b.statut==='payee'?1:0); });
  return out;
}
function _agtBizCibleSel(i, slug, sel){
  var cs=_agtBizCibles(slug);
  var h='<select id="agt-biz-cib'+i+'" onchange="agtBizCible('+i+')" style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px 9px;color:#F0E8DC;font-size:var(--pt-sm,16px);font-family:var(--font-ui,Outfit,sans-serif);box-sizing:border-box">';
  if(!cs.length) h+='<option value="">Aucune facture \u00e0 remiser</option>';
  cs.forEach(function(c){
    h+='<option value="'+c.k+'"'+((String(sel)===String(c.k))?' selected':'')+'>'
      +_escHtml(c.ref)+' \u00b7 '+_escHtml(String(c.lib).slice(0,38))+' \u00b7 '+c.montant+' \u20ac'
      +(c.statut==='payee'?' (r\u00e9gl\u00e9e)':'')+'</option>';
  });
  h+='</select>';
  return h;
}
// Choix d'une cible : la reference, le montant et le libelle se recalculent.
function agtBizCible(i){
  var t=_agtTenants[i]; if(!t) return;
  var sel=document.getElementById('agt-biz-cib'+i);
  if(!sel || sel.value==='') return;
  var f=_agtFacts(t.slug)[parseInt(sel.value,10)];
  if(!f) return;
  var r=document.getElementById('agt-biz-ref'+i);
  var mt=document.getElementById('agt-biz-mnt'+i);
  var lb=document.getElementById('agt-biz-lib'+i);
  if(r)  r.value=f.ref||'';
  if(mt) mt.value=String(-Math.round((Number(f.montant)||0)/2*100)/100);
  if(lb) lb.value='Offre de lancement \u2212 50 % sur '+String(f.libelle||_AGT_TY[_agtFType(f)].lbl).toLowerCase();
}
// Select de rattachement, affiche sur la ligne d'un geste orphelin.
function _agtBizRatSel(i,k,slug){
  var cs=_agtBizCibles(slug);
  if(!cs.length) return '<div style="font-size:var(--pt-lbl,10.5px);color:rgba(255,255,255,0.3)">Aucune facture \u00e0 laquelle rattacher cette remise.</div>';
  var h='<select onchange="agtBizRattache('+i+','+k+',this.value)" style="width:100%;background:rgba(249,115,22,0.06);border:1px solid rgba(249,115,22,0.28);border-radius:8px;padding:7px 9px;color:#F0E8DC;font-size:var(--pt-sm,16px);font-family:var(--font-ui,Outfit,sans-serif);box-sizing:border-box">';
  h+='<option value="">\u2192 Rattacher cette remise \u00e0\u2026</option>';
  cs.forEach(function(c){
    h+='<option value="'+c.k+'">'+_escHtml(c.ref)+' \u00b7 '+_escHtml(String(c.lib).slice(0,38))+' \u00b7 '+c.montant+' \u20ac</option>';
  });
  return h+'</select>';
}

// Rattachement d'un geste deja saisi mais tombe a cote (cas vecu en clientele).
async function agtBizRattache(i,k,val){
  var t=_agtTenants[i]; if(!t) return;
  var fs=_agtFacts(t.slug), g=fs[k], cible=fs[parseInt(val,10)];
  if(!g || !cible) return;
  g.ref=cible.ref||'';
  if(await _agtSaveBilling(t.slug)){
    showToast('Geste rattach\u00e9 \u00e0 '+g.ref,'#3D6B27');
    agtRenderBody(); _agtBizFill();
  }
}

// ── Rendu de l'onglet ───────────────────────────────────────────────────────
function _agtBuildBusiness(){
  var an=_agtBizAnnee();
  var mrr=0, pot=0, nActif=0, nEssai=0, nExp7=0, duA=0, caA=0, lateA=0;

  _agtTenants.forEach(function(t){
    if(_agtInterne(t.slug)) return;
    var st=_agtStatutOf(t.slug), pr=_agtAboPrix(t.slug);
    if(st.cle==='actif'){ mrr+=pr; nActif++; } else if(st.cle!=='aqualifier'){ pot+=pr; }   // ★ GTFIX-3 : « à qualifier » ne compte nulle part (GT-B14)
    if(st.cle==='essai'){ nEssai++; if(st.jours<=7) nExp7++; }
  });
  // ★ GTFIX-3 : le dû, le facturé et les retards de TOUS les domaines facturés, supprimés compris (GT-B10) ;
  //   les retards au reste dû, avoir déduit, une fois par référence (GT-B09).
  _agtBizSlugs().forEach(function(x){
    duA+=_agtBizDu(x.slug);
    caA+=_agtBizFactTot(x.slug, an);
    var vus={};
    _agtFacts(x.slug).forEach(function(f){
      if(_agtFRetard(f)<=0 || vus[f.ref||'']) return;
      vus[f.ref||'']=1; lateA+=_agtRefReste(x.slug, f.ref);
    });
  });
  var _mo=_agtBizMois(an), encA=0, aDaterA=0;
  _mo.forEach(function(o){ encA+=o.enc; aDaterA+=o.aDater; });

  var h='<div style="margin:0 0 12px;font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);letter-spacing:.08em;text-transform:uppercase;font-weight:500">Revenu r\u00e9current, facturation et encaissements</div>';
  h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:8px">';
  h+=_agtBizKpi(_agtEur(mrr)+'<span style="font-size:var(--pt-micro,11px);opacity:.5">/mois</span>','r\u00e9current','#86EFAC',nActif+' abonn\u00e9'+(nActif>1?'s':''));
  h+=_agtBizKpi(_agtEur(pot)+'<span style="font-size:var(--pt-micro,11px);opacity:.5">/mois</span>','potentiel','#C4B5FD',nEssai+' essai'+(nEssai>1?'s':'')+(nExp7>0?' \u00b7 '+nExp7+' \u2264 7j':''));
  h+=_agtBizKpi(_agtEur(duA),'\u00e0 encaisser',duA>0?'#F97316':'rgba(255,255,255,0.3)',lateA>0?('dont '+_agtEur(lateA)+' en retard'):'aucun retard');
  h+=_agtBizKpi(_agtEur(caA),'factur\u00e9 en '+an,'#E8C860','tous types confondus');
  h+=_agtBizKpi(_agtEur(encA),'encaiss\u00e9 en '+an,'#86EFAC',aDaterA?('dont '+_agtEur(aDaterA)+' \u00e0 dater'):'\u00e0 la date de paiement');
  h+='</div>';
  h+='<div style="font-size:var(--pt-lbl,10.5px);color:rgba(255,255,255,0.25);line-height:1.6;margin:8px 0 16px">'
    +'Un abonnement annuel (2 mois offerts) se saisit en <b>une seule ligne</b> couvrant 12 mois, pas en douze. '
    +'Les domaines marqu\u00e9s <b>interne</b> sortent du r\u00e9current et des totaux.</div>';

  h+='<div style="margin:0 0 8px;font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);letter-spacing:.08em;text-transform:uppercase;font-weight:500">\u00c0 traiter</div>';
  h+=_agtBizTodo();

  // Courbes
  var annees=_agtBizAnnees();
  h+='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:18px 0 8px">';
  h+='<span style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);letter-spacing:.08em;text-transform:uppercase;font-weight:500">Courbes de l\u2019ann\u00e9e</span>';
  annees.forEach(function(a){
    h+='<button class="agt-chip'+(a===an?' on':'')+'" onclick="agtBizSetAn('+a+')">'+a+'</button>';
  });
  h+='</div>';
  h+='<div style="display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:8px">';
  h+=_agtBizCard('Cumul de l\u2019ann\u00e9e',
      'Ce qui est factur\u00e9 face \u00e0 ce qui est r\u00e9ellement rentr\u00e9. L\u2019\u00e9cart, c\u2019est la tr\u00e9sorerie en attente.',
      _agtBizG1(an),
      _agtBizLeg('#C9A84C','Factur\u00e9 cumul\u00e9')+_agtBizLeg('#86EFAC','Encaiss\u00e9 cumul\u00e9')+_agtBizLeg('rgba(255,255,255,0.25)','Abonnements seuls'));
  h+='</div>';
  h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;margin-bottom:8px">';
  h+=_agtBizCard('Factur\u00e9 par mois','Par nature. Les gestes commerciaux tirent sous la ligne.',
      _agtBizG2(an),
      _agtBizLeg('#C9A84C','Abonnement')+_agtBizLeg('#8B5CF6','Installation')+_agtBizLeg('#3B82F6','Heures')+_agtBizLeg('#C4B5FD','Geste'));
  var g3=_agtBizG3();
  h+=_agtBizCard('Solde par client','Ce qui est rentr\u00e9, ce qui reste d\u00fb.',
      g3||'<div style="font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.2);padding:14px 0">Aucune ligne enregistr\u00e9e.</div>',
      g3?(_agtBizLeg('#86EFAC','Encaiss\u00e9')+_agtBizLeg('#F97316','\u00c0 encaisser')):'');
  h+='</div>';

  h+='<div style="margin:18px 0 8px;font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);letter-spacing:.08em;text-transform:uppercase;font-weight:500">Clients</div>';
  if(_agtTenants.length===0){
    return h+'<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.2);font-size:var(--pt-txt,13px)">Aucun client</div>';
  }

  _agtTenants.forEach(function(t,i){
    var st=_agtStatutOf(t.slug), plan=_agtPlan(t.slug);
    var rem=_agtAboRemise(t.slug), pr=_agtAboPrix(t.slug), plein=_AGT_PRIX[plan];
    var inte=_agtInterne(t.slug), fs=_agtFacts(t.slug);
    var duT=_agtBizDu(t.slug), encT=_agtBizEnc(t.slug);

    h+='<div style="background:rgba(255,255,255,0.04);border:1px '+(inte?'dashed':'solid')+' rgba(255,255,255,0.1);border-radius:12px;padding:14px;margin-bottom:10px'+(inte?';opacity:.72':'')+'">';
    h+='<div style="display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap">';
    h+='<div style="flex:1;min-width:140px">';
    h+='<div style="font-size:var(--pt-base,14px);font-weight:600;color:#E8E8E0">'+_escHtml(t.nom)+'</div>';
    h+='<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.3);font-family:monospace;margin-top:2px">'+_escHtml(t.slug)+'</div>';
    h+='</div><div style="text-align:right">';
    h+= inte
      ? '<div style="font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.35)">non factur\u00e9</div>'
      : ('<div style="font-size:15px;font-weight:600;color:#E8E8E0">'
          +(rem?('<span style="font-size:var(--pt-micro,12px);font-weight:400;color:rgba(255,255,255,0.3);text-decoration:line-through;margin-right:6px">'+_agtEur(plein)+'</span>'):'')
          +_agtEur(pr)+'<span style="font-size:var(--pt-micro,11px);opacity:.45">/mois</span></div>');
    h+='<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);margin-top:2px">'+(_AGT_PLANL[plan]||plan)+'</div>';
    if(rem) h+='<div style="font-size:var(--pt-lbl,10.5px);color:#C4B5FD;margin-top:2px">'+_escHtml(rem.motif||'')+'</div>';
    h+='</div></div>';

    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:9px;align-items:center">';
    h+='<span style="font-size:var(--pt-micro,11px);font-weight:600;color:'+(inte?'rgba(255,255,255,0.4)':st.color)+';background:rgba(255,255,255,0.05);border-radius:20px;padding:3px 9px">'+(inte?'interne':st.label)+'</span>';
    h+='<span style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.3);background:rgba(255,255,255,0.04);border-radius:20px;padding:3px 9px">'+(t.membres==null?'\u2014':t.membres)+' utilisateur'+(t.membres>1?'s':'')+'</span>';
    if(!inte && duT>0) h+='<span style="font-size:var(--pt-micro,11px);font-weight:600;color:#F97316;background:rgba(249,115,22,0.1);border-radius:20px;padding:3px 9px">'+_agtEur(duT)+' \u00e0 encaisser</span>';
    if(!inte && encT>0) h+='<span style="font-size:var(--pt-micro,11px);font-weight:600;color:#86EFAC;background:rgba(134,239,172,0.08);border-radius:20px;padding:3px 9px">'+_agtEur(encT)+' encaiss\u00e9s</span>';
    h+='<span style="flex:1"></span>';
    if(!inte) h+='<button onclick="agtBizAbo('+i+')" style="background:none;border:none;color:rgba(196,181,253,0.5);font-size:var(--pt-lbl,10.5px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);margin-right:10px" title="Facturer cet abonnement a un tarif different du tarif de la formule">'+(rem?'modifier le tarif remis\u00e9':'appliquer un tarif remis\u00e9')+'</button>';
    h+='<button onclick="agtBizInterne('+i+')" style="background:none;border:none;color:rgba(255,255,255,0.28);font-size:var(--pt-lbl,10.5px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)" title="Un domaine interne sort du r\u00e9current et des totaux">'+(inte?'compter ce domaine':'marquer interne')+'</button>';
    h+='</div>';

    if(fs.length>0){
      // Lot D : on regroupe PAR REFERENCE. Un geste s'affiche sous la facture
      // qu'il corrige, en retrait, et une ligne « net a payer » dit ce que le
      // client doit reellement. Les gestes tombes a cote sont isoles en fin de
      // liste avec de quoi les rattacher : ils ne se voyaient pas et faussaient
      // le solde (vecu en clientele : presque le double reclame).
      var refs=[], vus={}, orph=[];
      fs.forEach(function(f,k){
        if(_agtFType(f)==='geste') return;
        var r=String(f.ref||'');
        if(vus[r]==null){ vus[r]=refs.length; refs.push({ ref:r, lignes:[], gestes:[], date:String(f.date||'') }); }
        refs[vus[r]].lignes.push(k);
      });
      fs.forEach(function(f,k){
        if(_agtFType(f)!=='geste') return;
        var r=String(f.ref||'');
        if(vus[r]!=null) refs[vus[r]].gestes.push(k); else orph.push(k);
      });
      refs.sort(function(x,y){ return y.date.localeCompare(x.date); });

      var _ligne=function(k, retrait){
        var f=fs[k], ty=_AGT_TY[_agtFType(f)], geste=(_agtFType(f)==='geste');
        var paye=(f.statut==='payee'), ret=_agtFRetard(f), arm=(_agtFactArm===(i+':'+k));
        var o='<div style="display:flex;align-items:center;gap:9px;padding:7px 0;flex-wrap:wrap'
          +(retrait?';margin-left:20px;border-left:2px solid rgba(196,181,253,0.25);padding-left:10px':'')+'">';
        o+='<span title="'+ty.lbl+'" style="width:17px;height:17px;border-radius:4px;flex-shrink:0;background:'+ty.col+';color:#0B0F14;font-size:var(--pt-nano,9.5px);font-weight:700;display:flex;align-items:center;justify-content:center">'+ty.ini+'</span>';
        o+='<div style="flex:1;min-width:150px">';
        if(!retrait) o+='<div style="font-family:monospace;font-size:var(--pt-lbl,12px);color:'+(paye?'rgba(255,255,255,0.3)':'#E8C860')+'">'+_escHtml(f.ref||'')
          +'<span style="font-family:var(--font-ui,Outfit,sans-serif);color:rgba(255,255,255,0.28);margin-left:7px">'+_agtDateFr(f.date)+'</span></div>';
        o+='<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35)'+(retrait?'':';margin-top:1px')+'">'+_escHtml(f.libelle||ty.lbl)
          +(geste?'':' \u00b7 \u00e9ch\u00e9ance '+_agtDateFr(_agtFEch(f))+(ret>0?' <b style="color:#FCA5A5">retard '+ret+' j</b>':''))+'</div>';
        o+='</div>';
        o+='<span style="font-size:var(--pt-txt,13px);font-weight:600;color:'+(geste?'#C4B5FD':(paye?'#86EFAC':'#E8E8E0'))+'">'+_agtEur(f.montant)+'</span>';
        // ★ GTFIX-3 : la périodicité d'un abonnement se règle sur sa ligne (GT-B13)
        if(_agtFType(f)==='abo') o+='<button onclick="agtBizPer('+i+','+k+')" title="P\u00e9riodicit\u00e9 de l\u2019abonnement" style="background:none;border:1px solid rgba(255,255,255,0.12);border-radius:6px;padding:2px 8px;color:rgba(255,255,255,0.55);font-size:var(--pt-micro,12px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">'+(f.per==='annuel'?'annuel':'mensuel')+'</button>';
        o+= geste
          ? '<span style="font-size:10px;border-radius:6px;padding:2px 8px;background:rgba(196,181,253,0.10);border:1px solid rgba(196,181,253,0.28);color:#C4B5FD">remise</span>'
          : '<button onclick="agtFactPaye('+i+','+k+')" style="background:'+(paye?'rgba(134,239,172,0.1)':(ret>0?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.06)'))
            +';border:1px solid '+(paye?'rgba(134,239,172,0.25)':(ret>0?'rgba(239,68,68,0.3)':'rgba(255,255,255,0.12)'))
            +';border-radius:6px;padding:2px 8px;color:'+(paye?'#86EFAC':(ret>0?'#FCA5A5':'rgba(255,255,255,0.5)'))
            +';font-size:10px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">'+(paye?('pay\u00e9e'+(_agtFPayeLe(f)?' le '+_agtDateFr(f.paye_le):' \u00b7 \u00e0 dater')):(ret>0?'en retard':'\u00e0 encaisser'))+'</button>';
        if(!geste) o+='<button onclick="agtBizRecap('+i+','+k+')" title="R\u00e9capitulatif imprimable" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:6px;padding:2px 8px;color:rgba(255,255,255,0.5);font-size:10px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">PDF</button>';
        o+='<button onclick="agtFactDel('+i+','+k+')" style="background:'+(arm?'rgba(239,68,68,0.18)':'none')+';border:none;border-radius:6px;padding:2px 7px;color:'+(arm?'#FCA5A5':'rgba(255,255,255,0.2)')+';font-size:var(--pt-micro,11px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">'+(arm?'confirmer ?':'\u2715')+'</button>';
        return o+'</div>';
      };

      h+='<div style="margin-top:11px;border-top:1px solid rgba(255,255,255,0.07);padding-top:4px">';
      refs.forEach(function(g){
        h+='<div style="border-top:1px solid rgba(255,255,255,0.045);padding-top:2px">';
        g.lignes.forEach(function(k){ h+=_ligne(k,false); });
        g.gestes.forEach(function(k){ h+=_ligne(k,true); });
        if(g.gestes.length){
          var net=0;
          g.lignes.concat(g.gestes).forEach(function(k){ net+=(Number(fs[k].montant)||0); });
          h+='<div style="display:flex;justify-content:flex-end;gap:10px;padding:2px 0 8px;font-size:var(--pt-lbl,12px);color:rgba(255,255,255,0.45)">'
            +'<span>Net \u00e0 payer</span><b style="color:#E8E8E0">'+_agtEur(net)+'</b></div>';
        }
        h+='</div>';
      });
      if(orph.length){
        h+='<div style="border-top:1px solid rgba(249,115,22,0.25);margin-top:6px;padding-top:8px">';
        h+='<div style="font-size:var(--pt-lbl,10.5px);color:#F97316;font-weight:600;margin-bottom:4px">Remise'+(orph.length>1?'s':'')
          +' rattach\u00e9e'+(orph.length>1?'s':'')+' \u00e0 aucune facture \u2014 non d\u00e9duite'+(orph.length>1?'s':'')+' du solde</div>';
        orph.forEach(function(k){
          h+=_ligne(k,false);
          h+='<div style="margin:2px 0 10px 20px">'+_agtBizRatSel(i,k,t.slug)+'</div>';
        });
        h+='</div>';
      }
      h+='</div>';
      h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-top:9px;padding-top:9px;border-top:1px solid rgba(255,255,255,0.07);font-size:var(--pt-micro,12px)">'
        +'<span style="color:rgba(255,255,255,0.35)">Solde du compte</span>'
        +'<span style="font-weight:700;color:'+(duT>0?'#F97316':'#86EFAC')+'">'+(duT>0?(_agtEur(duT)+' \u00e0 encaisser'):'sold\u00e9')+'</span></div>';
    }

    // Formulaire d'ajout, replie
    h+='<div id="agt-biz-f'+i+'" style="display:none;margin-top:10px;border-top:1px solid rgba(255,255,255,0.07);padding-top:10px">';
    h+='<div id="agt-biz-sg'+i+'" style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:9px">';
    ['abo','inst','heures','geste'].forEach(function(kk){
      h+='<button data-t="'+kk+'" class="agt-chip'+(( _agtBizTy[t.slug]||'abo')===kk?' on':'')+'" onclick="agtBizTy('+i+',\''+kk+'\')">'+_AGT_TY[kk].lbl+'</button>';
    });
    h+='</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:7px;margin-bottom:8px">';
    h+='<div id="agt-biz-rw'+i+'"><div style="font-size:var(--pt-lbl,10.5px);color:rgba(255,255,255,0.35);margin-bottom:3px">R\u00e9f\u00e9rence</div><input id="agt-biz-ref'+i+'" style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px 9px;color:#F0E8DC;font-size:var(--pt-sm,16px);font-family:monospace;box-sizing:border-box"></div>';
    h+='<div><div style="font-size:var(--pt-lbl,10.5px);color:rgba(255,255,255,0.35);margin-bottom:3px">Date</div><input id="agt-biz-dat'+i+'" type="date" style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px 9px;color:#F0E8DC;font-size:var(--pt-sm,16px);font-family:var(--font-ui,Outfit,sans-serif);box-sizing:border-box"></div>';
    h+='<div><div style="font-size:var(--pt-lbl,10.5px);color:rgba(255,255,255,0.35);margin-bottom:3px">\u00c9ch\u00e9ance</div><input id="agt-biz-ech'+i+'" type="date" style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px 9px;color:#F0E8DC;font-size:var(--pt-sm,16px);font-family:var(--font-ui,Outfit,sans-serif);box-sizing:border-box"></div>';
    h+='<div><div style="font-size:var(--pt-lbl,10.5px);color:rgba(255,255,255,0.35);margin-bottom:3px">P\u00e9riodicit\u00e9 (abonnement)</div><select id="agt-biz-per'+i+'" style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;color:#F0E8DC;font-size:var(--pt-micro,12px);font-family:var(--font-ui,Outfit,sans-serif)"><option value="mensuel">Mensuel</option><option value="annuel">Annuel (12 mois)</option></select></div>';
    h+='<div><div style="font-size:var(--pt-lbl,10.5px);color:rgba(255,255,255,0.35);margin-bottom:3px">Montant HT</div><input id="agt-biz-mnt'+i+'" type="number" step="0.01" style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px 9px;color:#F0E8DC;font-size:var(--pt-sm,16px);font-family:var(--font-ui,Outfit,sans-serif);box-sizing:border-box"></div>';
    h+='</div>';
    h+='<div id="agt-biz-cw'+i+'" style="display:none;margin-bottom:8px"><div style="font-size:var(--pt-lbl,10.5px);color:rgba(255,255,255,0.35);margin-bottom:3px">S\u2019applique \u00e0</div>'+_agtBizCibleSel(i,t.slug,'')+'</div>';
    h+='<div style="margin-bottom:9px"><div style="font-size:var(--pt-lbl,10.5px);color:rgba(255,255,255,0.35);margin-bottom:3px">Libell\u00e9</div><input id="agt-biz-lib'+i+'" style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px 9px;color:#F0E8DC;font-size:var(--pt-sm,16px);font-family:var(--font-ui,Outfit,sans-serif);box-sizing:border-box"></div>';
    h+='<button onclick="agtFactAdd('+i+')" style="background:#C9A84C;border:none;border-radius:8px;padding:9px 16px;color:#0C1A0A;font-size:var(--pt-micro,12px);font-weight:700;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">Enregistrer la ligne</button>';
    h+='<div id="agt-biz-hint'+i+'" style="font-size:var(--pt-lbl,10.5px);color:rgba(255,255,255,0.3);line-height:1.6;margin-top:8px"></div>';
    h+='</div>';

    h+='<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">';
    h+='<button onclick="agtBizForm('+i+')" style="background:none;border:none;color:rgba(196,181,253,0.55);font-size:var(--pt-lbl,12px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);padding:8px 0 0">+ Ajouter une ligne</button>';
    if(fs.length>0) h+='<button onclick="agtBizReleve('+i+')" style="background:none;border:none;color:rgba(196,181,253,0.55);font-size:var(--pt-lbl,12px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);padding:8px 0 0">Relev\u00e9 de compte (PDF)</button>';
    h+='</div>';
    h+='</div>';
  });

  h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">';
  h+='<button onclick="agtBizCsv()" style="background:rgba(201,168,76,0.14);border:1px solid rgba(201,168,76,0.3);border-radius:8px;padding:7px 13px;color:#E8C860;font-size:var(--pt-lbl,12px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">Exporter toutes les lignes en CSV</button>';
  h+='<button onclick="agtBizLivre()" style="background:rgba(134,239,172,0.12);border:1px solid rgba(134,239,172,0.3);border-radius:10px;padding:9px 14px;color:#86EFAC;font-size:var(--pt-micro,12px);font-weight:600;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">Livre des recettes '+_agtBizAnnee()+'</button>';   // ★ GTFIX-3 (D6)
  h+='</div>';
  return h;
}

// Valeurs par defaut posees EN JS apres innerHTML : un attribut value= ne serait
// pas repris par Safari sur un champ date, et la reference se calcule.
function _agtBizNextRef(){
  var an=new Date().getFullYear(), seq=0;
  // ★ GTFIX-3 : TOUTES les factures de `billing`, domaines supprimés compris — un numéro n'est jamais repris (GT-B10).
  Object.keys(_agtBilling||{}).forEach(function(sl){
    _agtFacts(sl).forEach(function(f){
      var m=String(f.ref||'').match(/(\d{4})$/);
      if(m){ var n=parseInt(m[1],10); if(n>seq) seq=n; }
    });
  });
  return 'MV-'+an+'-'+String(seq+1).padStart(4,'0');
}
function _agtBizFill(){
  var ref=_agtBizNextRef(), now=new Date(), iso=_agtIso(now);
  var e=new Date(now.getTime()); e.setDate(e.getDate()+_AGT_ECH_J);
  var isoE=_agtIso(e);
  var moisTxt=now.toLocaleDateString('fr-FR',{month:'long',year:'numeric'});

  _agtTenants.forEach(function(t,i){
    var ty=_agtBizTy[t.slug]||'abo', plan=_agtPlan(t.slug);
    var mnt, lib;
    var rem=_agtAboRemise(t.slug);
    if(ty==='inst'){       mnt=_AGT_INST[plan];  lib='Installation '+(_AGT_PLANL[plan]||plan)+' \u2014 '+_AGT_INSTH[plan]+' h incluses'; }
    else if(ty==='heures'){ mnt=_AGT_TAUXH;      lib='1 h d\u2019accompagnement suppl\u00e9mentaire'; }
    else if(ty==='geste'){  mnt=-Math.round(_AGT_INST[plan]/2); lib='Offre de lancement \u2212 50 % sur l\u2019installation'; }
    else {                  mnt=_agtAboPrix(t.slug); lib='Abonnement '+moisTxt+(rem?(' \u00b7 '+rem.motif):''); }

    var r =document.getElementById('agt-biz-ref'+i);
    var d =document.getElementById('agt-biz-dat'+i);
    var ec=document.getElementById('agt-biz-ech'+i);
    var mt=document.getElementById('agt-biz-mnt'+i);
    var lb=document.getElementById('agt-biz-lib'+i);
    var hi=document.getElementById('agt-biz-hint'+i);
    var cw=document.getElementById('agt-biz-cw'+i);
    var rw=document.getElementById('agt-biz-rw'+i);
    if(cw) cw.style.display=(ty==='geste')?'block':'none';
    if(rw) rw.style.display=(ty==='geste')?'none':'block';
    if(r)  r.value=ref;
    if(d)  d.value=iso;
    if(ec) ec.value=(ty==='geste')?'':isoE;
    if(mt) mt.value=String(mnt);
    if(lb) lb.value=lib;
    if(ty==='geste') agtBizCible(i);   // la reference, le montant et le libelle suivent la cible
    if(hi) hi.textContent = (ty==='heures')
      ? ('Au-del\u00e0 du volant inclus : '+_AGT_TAUXH+' \u20ac/h. Saisissez le total (2 h \u2192 '+(_AGT_TAUXH*2)+' \u20ac).')
      : ((ty==='geste')
        ? 'Choisissez la facture \u00e0 remiser : la remise prend son num\u00e9ro et vient en d\u00e9duction du d\u00fb. Pour une remise permanente sur l\u2019abonnement, utilisez plut\u00f4t \u00ab tarif remis\u00e9 \u00bb sur la fiche du client.'
        : ((ty==='abo')
          ? 'Un abonnement annuel se saisit en UNE ligne couvrant 12 mois (2 mois offerts), pas en douze.'
          : ''));
  });
}

function agtBizSetAn(a){ _agtBizAn=a; agtRenderBody(); _agtBizFill(); }
function agtBizForm(i, ty){
  var t=_agtTenants[i]; if(!t) return;
  if(ty && _AGT_TY[ty]) _agtBizTy[t.slug]=ty;
  var el=document.getElementById('agt-biz-f'+i);
  if(!el) return;
  var ouvrir = (el.style.display==='none' || ty);
  el.style.display = ouvrir ? 'block' : 'none';
  if(ouvrir){
    if(ty) agtBizTy(i, ty); else _agtBizFill();
    try{ el.scrollIntoView({behavior:'smooth',block:'center'}); }
    catch(e){ if(window.logError) window.logError({level:'info',cat:'ui',msg:'scroll formulaire facture',detail:(e&&e.message)||String(e)}); }
  }
}
function agtBizTy(i, k){
  var t=_agtTenants[i]; if(!t || !_AGT_TY[k]) return;
  _agtBizTy[t.slug]=k;
  var sg=document.getElementById('agt-biz-sg'+i);
  if(sg) Array.prototype.forEach.call(sg.children, function(b){
    b.className='agt-chip'+((b.getAttribute('data-t')===k)?' on':'');
  });
  _agtBizFill();
}
function agtBizInterne(i){
  var t=_agtTenants[i]; if(!t) return;
  if(!_agtBilling[t.slug]) _agtBilling[t.slug]={};
  _agtBilling[t.slug].interne = !_agtInterne(t.slug);
  _agtSaveBilling(t.slug).then(function(ok){
    if(ok){
      showToast(_agtBilling[t.slug].interne ? 'Domaine interne \u2014 hors des totaux' : 'Domaine compt\u00e9 dans les totaux', '#3D6B27');
      agtRenderBody(); _agtBizFill();
    }
  });
}

async function agtFactAdd(i){
  var t=_agtTenants[i]; if(!t) return;
  var ty=_agtBizTy[t.slug]||'abo';
  var r =((document.getElementById('agt-biz-ref'+i)||{}).value||'').trim();
  var d =((document.getElementById('agt-biz-dat'+i)||{}).value||'');
  var ec=((document.getElementById('agt-biz-ech'+i)||{}).value||'');
  var lb=((document.getElementById('agt-biz-lib'+i)||{}).value||'').trim();
  var m =parseFloat(String((document.getElementById('agt-biz-mnt'+i)||{}).value||'').replace(',','.'));
  if(ty==='geste'){
    var cib=document.getElementById('agt-biz-cib'+i);
    if(!cib || cib.value===''){ showToast('Choisissez la facture \u00e0 remiser','#B85A1A'); return; }
    var fc=_agtFacts(t.slug)[parseInt(cib.value,10)];
    if(fc) r=String(fc.ref||'');
  }
  if(!r){ showToast('R\u00e9f\u00e9rence manquante','#B85A1A'); var e1=document.getElementById('agt-biz-ref'+i); if(e1) e1.focus(); return; }
  if(isNaN(m)||m===0){ showToast('Montant manquant','#B85A1A'); var e2=document.getElementById('agt-biz-mnt'+i); if(e2) e2.focus(); return; }
  if(ty==='geste' && m>0) m=-m;           // un geste est toujours une deduction
  if(ty!=='geste' && m<0){ showToast('Un montant n\u00e9gatif se saisit en \u00ab Geste \u00bb','#B85A1A'); return; }
  if(!_agtBilling[t.slug]) _agtBilling[t.slug]={};
  if(!Array.isArray(_agtBilling[t.slug].fact)) _agtBilling[t.slug].fact=[];
  var _ligneNeuve={
    ref:r, type:ty, date:d||_agtIso(new Date()),
    echeance:(ty==='geste'?'':ec), montant:m,
    libelle:lb||_AGT_TY[ty].lbl,
    statut:(ty==='geste'?'applique':'emise'),
    ts:new Date().toISOString()
  };
  if(ty==='abo' && ((document.getElementById('agt-biz-per'+i)||{}).value)==='annuel') _ligneNeuve.per='annuel';   // ★ GTFIX-3 (GT-B13)
  _agtBilling[t.slug].fact.push(_ligneNeuve);
  if(await _agtSaveBilling(t.slug)){
    showToast(''+_AGT_TY[ty].lbl+' '+r+' enregistr\u00e9'+(ty==='heures'?'es':''),'#3D6B27');
    agtLogAccess(t.slug, _AGT_TY[ty].lbl+' '+r+' \u00b7 '+_agtEur(m), '\uD83E\uDDFE', 'commercial');
    agtRenderBody(); _agtBizFill();
  }
}

// ★★ GTFIX-3 (§512) — LE PAIEMENT SE SAISIT : sa date réelle (celle du virement, pas celle du clic) et son
//   mode de règlement — deux des six mentions du livre des recettes (GT-B08). Une ligne réglée se rouvre pour
//   corriger sa date, ou pour annuler le paiement.
async function agtFactPaye(i,k){
  var t=_agtTenants[i]; if(!t) return;
  var f=_agtFacts(t.slug)[k]; if(!f) return;
  if(_agtFType(f)==='geste'){ showToast('Un geste commercial ne s\u2019encaisse pas','#B85A1A'); return; }
  var paye=(f.statut==='payee'), auj=_agtIso(new Date());
  var montant=paye ? _agtFEncInfo(t.slug, f).enc : _agtRefReste(t.slug, f.ref);
  var modes=Object.keys(_AGT_MODES).map(function(m){ return '<option value="'+m+'"'+(((f.mode&&_AGT_MODES[f.mode])?f.mode:'virement')===m?' selected':'')+'>'+_AGT_MODES[m]+'</option>'; }).join('');
  var champ='width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);border-radius:10px;padding:10px 12px;color:#F0E8DC;font-size:var(--pt-txt,13px);font-family:var(--font-ui,Outfit,sans-serif);color-scheme:dark';
  var bouton='padding:11px 14px;border-radius:10px;font-size:var(--pt-txt,13px);font-weight:600;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)';
  var ex=document.getElementById('agt-paie-ov'); if(ex) ex.remove();
  var ov=document.createElement('div'); ov.id='agt-paie-ov';
  ov.style.cssText='position:fixed;inset:0;background:rgba(6,4,12,0.88);z-index:10001;display:flex;align-items:center;justify-content:center;padding:20px;font-family:var(--font-ui,Outfit,sans-serif)';
  ov.innerHTML='<div role="dialog" aria-modal="true" aria-label="Paiement" style="width:100%;max-width:400px;background:rgba(18,14,28,0.98);border-radius:18px;border:1px solid rgba(134,239,172,0.25);padding:20px">'
    +'<div style="font-size:15px;font-weight:600;color:#fff">'+(paye?'Paiement enregistr\u00e9':'Enregistrer le paiement')+'</div>'
    +'<div style="font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.5);margin-top:4px">'+_escHtml(t.nom)+' \u00b7 '+_escHtml(f.ref||'')+' \u00b7 <b style="color:#86EFAC">'+_agtEur(montant)+'</b>'+(paye?' encaiss\u00e9s':' \u00e0 encaisser, avoirs d\u00e9duits')+'</div>'
    +'<div style="font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.45);margin:14px 0 5px">Re\u00e7u le</div>'
    +'<input id="agt-paie-date" type="date" max="'+auj+'" value="'+(_agtFPayeLe(f)||auj)+'" style="'+champ+'">'
    +'<div style="font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.45);margin:12px 0 5px">Mode de r\u00e8glement</div>'
    +'<select id="agt-paie-mode" style="'+champ+'">'+modes+'</select>'
    +'<div id="agt-paie-err" style="display:none;color:#FCA5A5;font-size:var(--pt-micro,12px);margin-top:10px"></div>'
    +'<div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">'
    +'<button onclick="document.getElementById(\'agt-paie-ov\').remove()" style="flex:1;'+bouton+';background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.7)">Fermer</button>'
    +'<button onclick="_agtPaieValider('+i+','+k+')" style="flex:1.4;'+bouton+';border:none;background:#86EFAC;color:#0C1A0A">'+(paye?'Corriger':'Enregistrer')+'</button></div>'
    +(paye?'<button onclick="_agtPaieAnnuler('+i+','+k+')" style="width:100%;margin-top:8px;'+bouton+';background:none;border:1px solid rgba(239,68,68,0.3);color:#FCA5A5">Annuler le paiement</button>':'')
    +'</div>';
  document.body.appendChild(ov);
}
window._agtPaieValider=async function(i,k){
  var t=_agtTenants[i]; if(!t) return;
  var f=_agtFacts(t.slug)[k]; if(!f) return;
  var d=((document.getElementById('agt-paie-date')||{}).value)||'', mo=((document.getElementById('agt-paie-mode')||{}).value)||'';
  var err=_agtPaieDateErr(d, _agtIso(new Date())) || (_AGT_MODES[mo]?'':'Mode de r\u00e8glement inconnu');
  var el=document.getElementById('agt-paie-err');
  if(err){ if(el){ el.textContent=err; el.style.display='block'; } return; }
  f.statut='payee'; f.paye_le=d; f.mode=mo;
  if(await _agtSaveBilling(t.slug)){
    var ov=document.getElementById('agt-paie-ov'); if(ov) ov.remove();
    showToast((f.ref||'Facture')+' r\u00e9gl\u00e9e le '+_agtDateFr(d)+' \u00b7 '+_AGT_MODES[mo],'#3D6B27');
    agtRenderBody(); _agtBizFill();
  }
};
window._agtPaieAnnuler=async function(i,k){
  var t=_agtTenants[i]; if(!t) return;
  var f=_agtFacts(t.slug)[k]; if(!f) return;
  f.statut='emise'; delete f.paye_le; delete f.mode;
  if(await _agtSaveBilling(t.slug)){
    var ov=document.getElementById('agt-paie-ov'); if(ov) ov.remove();
    showToast((f.ref||'Facture')+' : paiement annul\u00e9, la ligne quitte le livre des recettes','#B85A1A');
    agtRenderBody(); _agtBizFill();
  }
};
// La périodicité d'une ligne d'abonnement : mensuelle ⇄ annuelle (douze mois, une seule ligne).
async function agtBizPer(i,k){
  var t=_agtTenants[i]; if(!t) return;
  var f=_agtFacts(t.slug)[k]; if(!f || _agtFType(f)!=='abo') return;
  if(f.per==='annuel') delete f.per; else f.per='annuel';
  if(await _agtSaveBilling(t.slug)){ showToast((f.ref||'Abonnement')+' : '+(f.per==='annuel'?'annuel (douze mois)':'mensuel'),'#3D6B27'); agtRenderBody(); _agtBizFill(); }
}

async function agtFactDel(i,k){
  var key=i+':'+k;
  if(_agtFactArm!==key){ _agtFactArm=key; agtRenderBody(); _agtBizFill(); return; }
  _agtFactArm='';
  var t=_agtTenants[i]; if(!t) return;
  var fs=_agtFacts(t.slug);
  if(!fs[k]) return;
  fs.splice(k,1);
  if(await _agtSaveBilling(t.slug)){ showToast('Ligne supprim\u00e9e','#3D6B27'); agtRenderBody(); _agtBizFill(); }
}

// ── Documents de travail ────────────────────────────────────────────────────
// CE N'EST PAS UNE FACTURE. Choix arbitre le 06/08/2026 : la facture officielle
// reste celle du logiciel de facturation, et l'emission passera de toute facon
// par une plateforme agreee au 1er septembre 2027 (reforme e-invoicing). Ces
// documents servent a relancer, a faire un point de compte, a joindre un
// recapitulatif — d'ou le bandeau explicite en tete de chaque page.
// ⚠️ IDENTITE EDITEUR : ce fichier porte desormais le SIRET GUERETTECH. Il
// s'ajoute a la carte des fichiers a reprendre en cas de changement d'identite.
var _AGT_EDITEUR = 'GUERETTECH \u2014 Nicolas Gu\u00e9ret, entreprise individuelle'
  +'<br>68 rue Henri Challand, 21700 Nuits-Saint-Georges'
  +'<br>SIRET 982 148 116 00022 \u00b7 06 99 42 48 59 \u00b7 ngdevpro@gmail.com'
  +'<br>TVA non applicable, article 293 B du CGI';
var _AGT_PIED_DOC = 'P\u00e9nalit\u00e9s de retard \u00e9gales \u00e0 trois fois le taux d\u2019int\u00e9r\u00eat l\u00e9gal \u00b7 '
  +'indemnit\u00e9 forfaitaire de recouvrement de 40 \u20ac (art. L.441-10 et D.441-5 du code de commerce) \u00b7 '
  +'pas d\u2019escompte pour paiement anticip\u00e9. Prestation r\u00e9gie par les CGU accept\u00e9es dans l\u2019application.';

function _agtDocOuvrir(titre, corps){
  var d=new Date();
  var html='<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>'+titre+'</title><style>'
    +'@page{size:A4;margin:16mm}'
    +'body{font-family:Georgia,\'Times New Roman\',serif;color:#1A1410;background:#fff;font-size:var(--pt-micro,12px);line-height:1.6;margin:0}'
    +'.wm{background:#F3E4C4;border:1px solid #D9BE7E;color:#6B4E10;border-radius:4px;padding:7px 11px;'
      +'font-size:var(--pt-lbl,10.5px);font-family:Arial,sans-serif;margin-bottom:20px;letter-spacing:.02em}'
    +'h1{font-size:var(--pt-md,20px);margin:0 0 4px;letter-spacing:.02em}'
    +'.em{font-size:var(--pt-lbl,10.5px);color:#5A4A34;line-height:1.55}'
    +'.ti{margin:18px 0 4px;font-size:15px;font-weight:700}'
    +'table{width:100%;border-collapse:collapse;margin:16px 0;font-size:var(--pt-micro,11px)}'
    +'th{text-align:left;border-bottom:1.5px solid #1A1410;padding:6px 4px;font-size:var(--pt-nano,9.5px);'
      +'text-transform:uppercase;letter-spacing:.05em;font-family:Arial,sans-serif}'
    +'td{padding:6px 4px;border-bottom:1px solid #E2D8C4}'
    +'td.r,th.r{text-align:right}'
    +'.tot{display:flex;justify-content:flex-end;gap:26px;font-size:var(--pt-txt,13px);font-weight:700;padding:7px 4px}'
    +'.foot{margin-top:24px;padding-top:12px;border-top:1px solid #D8CDB8;font-size:var(--pt-nano,9.5px);color:#6B5E48;line-height:1.7}'
    +'</style></head><body>'
    +corps
    +'<div class="foot">Document de travail \u00e9tabli le '+_agtDateFr(d)+'. '
      +'Il ne tient pas lieu de facture et ne peut servir de pi\u00e8ce comptable.<br>'+_AGT_PIED_DOC+'</div>'
    +'<scr'+'ipt>window.onload=function(){setTimeout(function(){window.print();},400);};</scr'+'ipt>'
    +'</body></html>';
  try{
    var blob=new Blob([html],{type:'text/html'});
    var w=window.open(URL.createObjectURL(blob),'_blank');
    if(!w) showToast('Autorise les pop-ups pour imprimer','#B85A1A');
  }catch(e){
    showToast('Impression impossible','#C0392B');
    if(window.logError) window.logError({level:'warning',cat:'ui',msg:'document GT non ouvert',detail:(e&&e.message)||String(e)});
  }
}

function agtBizReleve(i){
  var t=_agtTenants[i]; if(!t) return;
  var fs=_agtFacts(t.slug);
  if(!fs.length){ showToast('Aucune ligne \u00e0 imprimer','#B85A1A'); return; }
  var ord=fs.map(function(f,k){ return k; }).sort(function(a,b){
    return String(fs[a].date||'').localeCompare(String(fs[b].date||''));
  });
  var rows='';
  ord.forEach(function(k){
    var f=fs[k], ty=_agtFType(f), ret=_agtFRetard(f);
    var etat = (ty==='geste') ? 'appliqu\u00e9'
      : (f.statut==='payee' ? 'r\u00e9gl\u00e9' : (ret>0 ? ('en retard de '+ret+' j') : 'en attente'));
    rows+='<tr><td>'+_agtDateFr(f.date)+'</td><td>'+_escHtml(f.ref||'')+'</td>'
      +'<td>'+_escHtml(f.libelle||_AGT_TY[ty].lbl)+'</td>'
      +'<td>'+(ty==='geste'?'\u2014':_agtDateFr(_agtFEch(f)))+'</td>'
      +'<td>'+etat+'</td><td class="r">'+_agtEur(f.montant)+'</td></tr>';
  });
  var du=_agtBizDu(t.slug), enc=_agtBizEnc(t.slug);
  var corps='<div class="wm">DOCUMENT DE TRAVAIL \u2014 relev\u00e9 de compte. Ne tient pas lieu de facture.</div>'
    +'<h1>GUERETTECH</h1><div class="em">'+_AGT_EDITEUR+'</div>'
    +'<div class="ti">Relev\u00e9 de compte</div>'
    +'<div class="em"><b>'+_escHtml(t.nom)+'</b> \u00b7 formule '+(_AGT_PLANL[_agtPlan(t.slug)]||'')
      +' \u00b7 '+_agtEur(_agtAboPrix(t.slug))+'/mois'
      +((function(){ var r=_agtAboRemise(t.slug); return r?(' (tarif plein '+_agtEur(_AGT_PRIX[_agtPlan(t.slug)])+' \u2014 '+_escHtml(r.motif||'remise')+')'):''; })())+'</div>'
    +'<table><thead><tr><th>Date</th><th>R\u00e9f.</th><th>Objet</th><th>\u00c9ch\u00e9ance</th><th>\u00c9tat</th><th class="r">Montant HT</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table>'
    +'<div class="tot"><span>Encaiss\u00e9</span><span>'+_agtEur(enc)+'</span></div>'
    +'<div class="tot"><span>Reste \u00e0 r\u00e9gler</span><span>'+_agtEur(Math.max(0,du))+'</span></div>';
  _agtDocOuvrir('Relev\u00e9 de compte \u2014 '+t.nom, corps);
}

function agtBizRecap(i,k){
  var t=_agtTenants[i]; if(!t) return;
  var f=_agtFacts(t.slug)[k]; if(!f) return;
  var ty=_agtFType(f);
  // ★ GTFIX-3 : les avoirs de la référence figurent, et le net à payer est le reste dû (GT-B09).
  var _av=(ty==='geste')?[]:_agtFacts(t.slug).filter(function(g){ return _agtFType(g)==='geste' && String(g.ref||'')===String(f.ref||''); });
  var _avL=_av.map(function(g){ return '<tr><td>'+_escHtml(g.libelle||'Avoir')+'</td><td>Avoir</td><td class="r">'+_agtEur(g.montant)+'</td></tr>'; }).join('');
  var _net=Math.round(((Number(f.montant)||0)+_av.reduce(function(s2,g){ return s2+(Number(g.montant)||0); },0))*100)/100;
  var corps='<div class="wm">DOCUMENT DE TRAVAIL \u2014 r\u00e9capitulatif. Ne tient pas lieu de facture.</div>'
    +'<h1>GUERETTECH</h1><div class="em">'+_AGT_EDITEUR+'</div>'
    +'<div class="ti">R\u00e9capitulatif '+_escHtml(f.ref||'')+'</div>'
    +'<div class="em"><b>'+_escHtml(t.nom)+'</b> \u00b7 \u00e9tabli le '+_agtDateFr(f.date)+'</div>'
    +'<table><thead><tr><th>Objet</th><th>Nature</th><th class="r">Montant HT</th></tr></thead><tbody>'
    +'<tr><td>'+_escHtml(f.libelle||_AGT_TY[ty].lbl)+'</td><td>'+_AGT_TY[ty].lbl+'</td>'
    +'<td class="r">'+_agtEur(f.montant)+'</td></tr>'+_avL+'</tbody></table>'
    +'<div class="tot"><span>Total HT</span><span>'+_agtEur(_net)+'</span></div>'
    +'<div class="em">TVA non applicable \u00b7 '+(f.statut==='payee'
      ? ('r\u00e9gl\u00e9'+(_agtFPayeLe(f)?' le '+_agtDateFr(f.paye_le):'')+(_AGT_MODES[f.mode]?' par '+_AGT_MODES[f.mode].toLowerCase():''))
      : ('net \u00e0 payer '+_agtEur(_agtRefReste(t.slug, f.ref))+(ty==='geste'?'':' \u00b7 \u00e9ch\u00e9ance le '+_agtDateFr(_agtFEch(f)))))+'</div>';
  _agtDocOuvrir('R\u00e9capitulatif '+(f.ref||''), corps);
}

// Relance : brouillon de mail SANS destinataire (aucune adresse client n'est
// stockee dans la config d'un domaine) — Nico complete le destinataire.
// ════ GT-UI-3 (§518) — LES CONTACTS (D5) ET LA RELANCE D'ESSAI À DÉCIDER ════
// ★★★ Une relance ne part JAMAIS seule (Nico, 02/11). Les deux relances de la console ouvrent un BROUILLON dans ta
//   messagerie (`mailto:`) : rien ne part sans ton « Envoyer ». Le contact de facturation (D5, dans
//   _guerettech/clients, GT seul) ne fait que les adresser.
var _AGT_RELANCE_ESSAI_J = 15;   // ⚠ le même nombre que le serveur (functions/claims.js, TRIAL_RELANCE_D) : le harnais gtui3 compare
// Stricte, parce qu'elle va dans un lien « mailto: » : ni « ? », ni « & », ni « = » (sinon un « ?bcc= » glisserait un destinataire).
function _agtEmailValide(e){ return /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(String(e||'')); }
function _agtContactEmail(slug){ var c=(_agtCli(slug)||{}).contact||{}; return _agtEmailValide(c.email) ? String(c.email) : ''; }
// Les jours écoulés depuis la fin d'un essai jamais reconduit, quand la relance est due et pas encore faite ; -1 sinon.
function _agtRelanceEssaiJours(c, maintenant){
  c=c||{};
  var exp=(typeof c.trialExp==='number') ? c.trialExp : (Date.parse(c.trialExp||'')||0);
  if(!exp || (c.trialRenewals>0) || c.relanceFaite) return -1;
  var j=Math.floor(((maintenant||Date.now())-exp)/86400000);
  return (j>=_AGT_RELANCE_ESSAI_J) ? j : -1;
}
function _agtRelanceEssaiTexte(nom){
  return { sujet:'Votre domaine sur Ma Vigne \u2014 '+nom,
    corps:'Bonjour,\n\nVotre essai de Ma Vigne s\u2019est termin\u00e9 il y a deux semaines. Votre domaine est toujours l\u00e0, avec vos parcelles, votre \u00e9quipe et tout ce que vous y avez saisi : rien n\u2019a \u00e9t\u00e9 effac\u00e9. Vous pouvez toujours tout consulter, simplement plus rien modifier.\n\n'
      +'Si le moment \u00e9tait mal choisi, dites-le moi : je peux vous rouvrir l\u2019\u00e9criture le temps qu\u2019il faut. Et si l\u2019outil ne vous a pas convaincu, dites-le moi aussi \u2014 savoir ce qui a manqu\u00e9 m\u2019est utile.\n\n'
      +'R\u00e9pondez simplement \u00e0 ce message, ou appelez-moi.\n\nNicolas Gu\u00e9ret\nMa Vigne \u2014 GUERETTECH\n06 99 42 48 59\nmavigneapp.fr' };
}
async function _agtCliNoter(slug, fn){
  var r=await _agtMajRegistre(function(clients){ var x=Object.assign({}, clients[slug]||{}); fn(x); clients[slug]=x; });
  if(r && r.clients && r.clients.clients) _agtClients=r.clients.clients;
  return r;
}
async function agtRelanceEssai(slug){
  var t=(_agtTenants||[]).filter(function(x){ return x.slug===slug; })[0]; if(!t) return;
  var tx=_agtRelanceEssaiTexte(t.nom||slug);
  try{ window.location.href='mailto:'+_agtContactEmail(slug)+'?subject='+encodeURIComponent(tx.sujet)+'&body='+encodeURIComponent(tx.corps); }
  catch(e){ if(window.logError) window.logError({level:'info',cat:'ui',msg:'mailto relance essai',detail:(e&&e.message)||String(e)}); }
  try{
    await _agtCliNoter(slug, function(x){ x.relanceFaite=new Date().toISOString(); });
    agtRenderBody();
    if(window._agtAnnulable) window._agtAnnulable('Relance not\u00e9e pr\u00e9par\u00e9e', function(){
      _agtCliNoter(slug, function(x){ delete x.relanceFaite; }).then(function(){ agtRenderBody(); }, function(e){ _agtEchecEcriture(e,'Relance'); });
    });
  }catch(e){ _agtEchecEcriture(e,'Relance'); }
}
async function agtCliContactEnregistrer(slug, c){
  var x={ nom:String((c&&c.nom)||'').trim().slice(0,120), email:String((c&&c.email)||'').trim().slice(0,160), tel:String((c&&c.tel)||'').trim().slice(0,40) };
  if(x.email && !_agtEmailValide(x.email)){ showToast('Adresse e-mail invalide','#C0392B'); return false; }
  try{
    await _agtCliNoter(slug, function(y){ y.contact=x; });
    showToast('Contact enregistr\u00e9','#3D6B27'); agtRenderBody(); return true;
  }catch(e){ _agtEchecEcriture(e,'Contact du client'); return false; }
}
function agtBizRelance(i,k){
  var t=_agtTenants[i]; if(!t) return;
  var f=_agtFacts(t.slug)[k]; if(!f) return;
  var ret=_agtFRetard(f);
  var suj='Relance \u2014 '+(f.ref||'facture')+' \u00b7 '+t.nom;
  // ★ GTFIX-3 : la relance réclame le RESTE DÛ, avoir déduit (GT-B09) — 495 € et non 990 €.
  var reste=_agtRefReste(t.slug, f.ref), brut=Number(f.montant)||0;
  var txt='Bonjour,\n\nSauf erreur de ma part, la facture '+(f.ref||'')+' du '+_agtDateFr(f.date)
    +' arrivait \u00e0 \u00e9ch\u00e9ance le '+_agtDateFr(_agtFEch(f))
    +(ret>0?(', soit il y a '+ret+' jour'+(ret>1?'s':'')):'')+'. Il reste '+_agtEur(reste)+' \u00e0 r\u00e9gler'
    +(reste<brut?(' (facture de '+_agtEur(brut)+', avoir d\u00e9duit)'):'')+'.\n\n'
    +'Pourriez-vous me confirmer sa prise en charge ? Si le r\u00e8glement est d\u00e9j\u00e0 parti, merci de ne pas tenir compte de ce message.\n\n'
    +'Bien cordialement,\nNicolas Gu\u00e9ret \u2014 GUERETTECH\n';
  // ★ GT-UI-3 (D5) : le brouillon arrive adressé au contact de facturation s'il est connu — il ne part pas seul.
  var href='mailto:'+_agtContactEmail(t.slug)+'?subject='+encodeURIComponent(suj)+'&body='+encodeURIComponent(txt);
  try{ window.location.href=href; }
  catch(e){ if(window.logError) window.logError({level:'info',cat:'ui',msg:'mailto relance',detail:(e&&e.message)||String(e)}); }
}

// Export comptable. Format Excel FR : separateur point-virgule, BOM UTF-8,
// decimale a la virgule — meme convention que le registre phyto.
function agtBizCsv(){
  if(typeof window.dlFile!=='function'){ showToast('T\u00e9l\u00e9chargement indisponible sur cet appareil','#C0392B'); return; }
  var q=function(v){ return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'; };
  var n=function(v){ return String(Number(v)||0).replace('.',','); };
  // ★ GTFIX-3 : la date et le mode du paiement, le reste dû par référence, et les domaines supprimés (GT-B08, B10).
  var lignes=['Client;Slug;Reference;Nature;Libelle;Date;Echeance;Montant HT;Statut;Payee le;Mode;Reste du (reference);Retard (j);Interne;Domaine supprime'];
  var tot=0, dom=_agtTenants.map(function(t){ return { slug:t.slug, nom:t.nom, supprime:false }; });
  _agtBizSlugs().forEach(function(x){ if(x.supprime) dom.push(x); });
  dom.forEach(function(t){
    var inte=_agtInterne(t.slug);
    _agtFacts(t.slug).forEach(function(f){
      var ty=_agtFType(f);
      if(!inte) tot+=(Number(f.montant)||0);
      lignes.push([ q(t.nom), q(t.slug), q(f.ref||''), q(_AGT_TY[ty].lbl), q(f.libelle||''),
        q(_agtDateFr(f.date)), q(ty==='geste'?'':_agtDateFr(_agtFEch(f))), n(f.montant),
        q(ty==='geste'?'applique':(f.statut==='payee'?'payee':'emise')),
        q(ty!=='geste'&&_agtFPayeLe(f)?_agtDateFr(f.paye_le):''), q(ty!=='geste'?(_AGT_MODES[f.mode]||''):''),
        n(ty==='geste'?0:_agtRefReste(t.slug, f.ref)),
        String(_agtFRetard(f)), q(inte?'oui':'non'), q(t.supprime?'oui':'non') ].join(';'));
    });
  });
  if(lignes.length===1){ showToast('Aucune ligne \u00e0 exporter','#B85A1A'); return; }
  var jour=_agtIso(new Date());
  window.dlFile('\uFEFF'+lignes.join('\r\n'), 'guerettech_facturation_'+jour+'.csv', 'text/csv;charset=utf-8');
  showToast(''+(lignes.length-1)+' ligne'+(lignes.length>2?'s':'')+' export\u00e9e'+(lignes.length>2?'s':'')+' \u00b7 '+_agtEur(tot)+' hors interne','#3D6B27');
}

// ★★ GTFIX-3 (§512) — LE LIVRE DES RECETTES (décision D6 du 01/11) : une ligne par encaissement, dans l'ordre
//   des dates de règlement, avec ses six mentions (date d'encaissement, numéro de facture, client, nature,
//   montant encaissé — avoirs déduits —, mode de règlement). Une facture réglée sans date (d'avant GTFIX-3)
//   y figure à sa date de facture, marquée « à saisir ».
function _agtLivreLignes(an){
  var par={}, out=[];
  _agtBizSlugs().forEach(function(x){
    _agtFacts(x.slug).forEach(function(f){
      var e=_agtFEncInfo(x.slug, f); if(!e.enc) return;
      var d=_agtD(e.date); if(!d || d.getFullYear()!==an) return;
      var cle=x.slug+'|'+String(f.ref||'')+'|'+e.date, o=par[cle];
      if(!o){ o=par[cle]={ date:e.date, ref:String(f.ref||''), client:x.nom, natures:[], montant:0, mode:e.mode, aDater:false }; out.push(o); }
      o.montant+=e.enc;
      if(e.aDater) o.aDater=true;
      if(!o.mode && e.mode) o.mode=e.mode;
      var nat=(_AGT_TY[_agtFType(f)]||{}).lbl||'';
      if(_agtFType(f)!=='geste' && o.natures.indexOf(nat)<0) o.natures.push(nat);
    });
  });
  out.forEach(function(o){ o.montant=Math.round(o.montant*100)/100; o.nature=o.natures.join(', '); delete o.natures; });
  out.sort(function(a,b){ return a.date<b.date?-1:(a.date>b.date?1:(a.ref<b.ref?-1:(a.ref>b.ref?1:0))); });
  return out;
}
function agtBizLivre(){
  if(typeof window.dlFile!=='function'){ showToast('T\u00e9l\u00e9chargement indisponible sur cet appareil','#C0392B'); return; }
  var an=_agtBizAnnee(), L=_agtLivreLignes(an);
  if(!L.length){ showToast('Aucun encaissement en '+an,'#B85A1A'); return; }
  var q=function(v){ return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'; };
  var n=function(v){ return String(Number(v)||0).replace('.',','); };
  var lignes=['Date d\u2019encaissement;N\u00b0 de facture;Client;Nature;Montant encaiss\u00e9 (\u20ac);Mode de r\u00e8glement;Remarque'];
  var tot=0, aD=0;
  L.forEach(function(o){
    tot+=o.montant; if(o.aDater) aD++;
    lignes.push([ q(_agtDateFr(o.date)), q(o.ref), q(o.client), q(o.nature), n(o.montant), q(_AGT_MODES[o.mode]||''),
      q(o.aDater?'date de paiement \u00e0 saisir (date de facture)':'') ].join(';'));
  });
  tot=Math.round(tot*100)/100;
  lignes.push([ '', '', '', q('Total encaiss\u00e9 en '+an), n(tot), '', '' ].join(';'));
  window.dlFile('\uFEFF'+lignes.join('\r\n'), 'guerettech_livre_recettes_'+an+'.csv', 'text/csv;charset=utf-8');
  showToast('Livre des recettes '+an+' : '+L.length+' encaissement'+(L.length>1?'s':'')+' \u00b7 '+_agtEur(tot)+(aD?(' \u00b7 '+aD+' \u00e0 dater'):''),'#3D6B27');
}


// ─── Onglet LEADS ───────────────────────────────────────────────────────────
function _agtLeadStOf(id){
  var e=_agtLeadSt[id];
  var st=(e&&e.st)||'nouveau';
  return _AGT_LEADST[st] ? st : 'nouveau';
}

// ★ GTFIX-1 (§510) — même principe que la facturation, fiche par fiche (le serveur écrit aussi des
//   fiches de leads) : les autres fiches viennent de la base relue ; celle qu'on touche n'est écrite
//   que si elle n'a pas changé depuis la lecture.
var _agtLeadStBase = {};
function _agtLeadStNoter(v){ _agtLeadStBase = {}; Object.keys(v || {}).forEach(function(k){ _agtLeadStBase[k] = _agtJsonStable(v[k]); }); }
function _agtMutLeadSt(d, existe, id, local, base){
  var v;
  if (!existe) v = {};
  else if (d && d.value && typeof d.value === 'object' && !Array.isArray(d.value)) v = d.value;
  else throw new Error('statuts des leads illisibles');
  if (_agtJsonStable(v[id]) !== base){ var c = new Error('lead modifi\u00e9 ailleurs'); c.conflit = true; c.frais = v; throw c; }
  if (local === undefined) delete v[id]; else v[id] = local;
  return { value: v };
}
async function _agtSaveLeadSt(id){
  var local = (_agtLeadSt[id] === undefined) ? undefined : JSON.parse(JSON.stringify(_agtLeadSt[id]));
  var base = _agtLeadStBase[id];
  try{
    if(!window.fbGtMaj) throw new Error('fbGtMaj indisponible');
    var r = await window.fbGtMaj('leads_status', function(d, existe){ return _agtMutLeadSt(d, existe, id, local, base); });
    _agtLeadSt = r.valeur.value; _agtLeadStNoter(_agtLeadSt);
    return true;
  }catch(e){
    if (e && e.conflit && e.frais){ _agtLeadSt = e.frais; _agtLeadStNoter(_agtLeadSt); }
    else if (base !== undefined) _agtLeadSt[id] = JSON.parse(base);
    else delete _agtLeadSt[id];
    _agtEchecEcriture(e, 'Lead');
    agtRenderBody();
    return false;
  }
}

// Tri par date decroissante, en memoire : la lecture Firestore est volontairement
// non filtree (aucun index composite dans ce projet, et il n'en faut pas).
function _agtLeadsSorted(){
  var a=(_agtLeads||[]).slice();
  a.sort(function(x,y){
    var dx=_agtD(x.createdAt), dy=_agtD(y.createdAt);
    return (dy?dy.getTime():0)-(dx?dx.getTime():0);
  });
  return a;
}

function _agtBuildLeads(){
  var h='<div style="margin:0 0 14px;font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.35);letter-spacing:.08em;text-transform:uppercase;font-weight:500">Demandes re\u00e7ues par le site</div>';

  if(_agtLeads===null){
    return h+'<div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.22);border-radius:12px;padding:16px;font-size:var(--pt-txt,13px);color:#FDBA74;line-height:1.6">'
      +'Lecture de la collection <span style="font-family:monospace">leads</span> refus\u00e9e ou indisponible. '
      +'Elle est r\u00e9serv\u00e9e au compte GUERETTECH par les r\u00e8gles Firestore \u2014 v\u00e9rifier la connexion, puis recharger.</div>';
  }

  var all=_agtLeadsSorted();
  var cnt={ nouveau:0, repondu:0, mer:0, installe:0, perdu:0 };
  all.forEach(function(l){ cnt[_agtLeadStOf(l._id)]++; });

  var vus=all.filter(function(l){
    var st=_agtLeadStOf(l._id);
    if(_agtLeadFilter==='ouverts')   return st!=='installe' && st!=='perdu';
    if(_agtLeadFilter==='installes') return st==='installe';
    return true;
  });

  function chip(f,l,n){
    var on=(_agtLeadFilter===f);
    return '<button onclick="agtLeadFilter(\'' + f + '\')" style="background:'+(on?'rgba(196,181,253,0.15)':'rgba(255,255,255,0.05)')+';border:1px solid '+(on?'rgba(196,181,253,0.35)':'rgba(255,255,255,0.1)')+';border-radius:20px;padding:5px 12px;color:'+(on?'#C4B5FD':'rgba(255,255,255,0.45)')+';font-size:var(--pt-lbl,12px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);margin:0 6px 6px 0">'+l+' ('+n+')</button>';
  }
  h+='<div style="margin-bottom:14px">';
  h+=chip('ouverts','\u00c0 traiter',cnt.nouveau+cnt.repondu+cnt.mer);
  h+=chip('installes','Install\u00e9s',cnt.installe);
  h+=chip('tous','Tout',all.length);
  h+='</div>';

  if(vus.length===0){
    return h+'<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.2);font-size:var(--pt-txt,13px)">Aucune demande dans ce filtre</div>';
  }

  vus.forEach(function(l){
    var id=_agtHexId(l._id);
    var st=_agtLeadStOf(l._id), sd=_AGT_LEADST[st];
    var ouvert=(_agtLeadOpen===l._id);
    var note=(_agtLeadSt[l._id]&&_agtLeadSt[l._id].note)||'';

    h+='<div style="background:rgba(255,255,255,0.04);border:1px solid '+(st==='nouveau'?'rgba(232,200,96,0.28)':'rgba(255,255,255,0.1)')+';border-radius:12px;padding:14px;margin-bottom:10px">';
    h+='<div style="display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap">';
    h+='<div style="flex:1;min-width:150px">';
    h+='<div style="font-size:var(--pt-base,14px);font-weight:600;color:#E8E8E0">'+_escHtml(l.domaine||'(sans nom)')+'</div>';
    h+='<div style="font-size:var(--pt-lbl,12px);color:rgba(255,255,255,0.35);margin-top:3px">'
      +[_escHtml([l.ville,l.cp].filter(Boolean).join(' ')), _escHtml(l.region||''), l.surface?_escHtml(l.surface)+' ha':'' ]
        .filter(Boolean).join(' \u00b7 ')+'</div>';
    h+='</div>';
    h+='<div style="text-align:right">';
    h+='<span style="font-size:var(--pt-micro,11px);font-weight:600;color:'+sd.c+';background:rgba(255,255,255,0.05);border-radius:20px;padding:3px 9px">'+sd.l+'</span>';
    h+='<div style="font-size:var(--pt-micro,11px);color:rgba(255,255,255,0.25);margin-top:4px">'+_agtDateFr(l.createdAt)+'</div>';
    h+='</div></div>';

    h+='<div style="font-size:var(--pt-lbl,12px);color:rgba(255,255,255,0.45);margin-top:8px;word-break:break-word">'
      +_mvIcon('enveloppe',16)+' '+_escHtml(l.email||'')+(l.tel?' \u00b7 '+_escHtml(l.tel):'')+'</div>';

    // ★ Le chemin se dedouble apres la mise en route : les REPONSES arrivent par la
    //   fonction, les FICHIERS arrivent par mail. Rien ne disait ou en etait le second,
    //   et un dossier pouvait dormir faute d'un KML sans que l'ecran le montre.
    if(l.mer){
      var _pj=!!(_agtLeadSt[l._id]&&_agtLeadSt[l._id].pj);
      h+='<div style="margin-top:7px;display:flex;gap:6px;flex-wrap:wrap">';
      h+='<span style="font-size:var(--pt-lbl,10.5px);font-weight:600;color:#C4B5FD;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.3);border-radius:20px;padding:2px 9px">R\u00e9ponses de mise en route</span>';
      h+='<span style="font-size:var(--pt-lbl,10.5px);font-weight:600;color:'+(_pj?'#86EFAC':'#E8C860')+';background:rgba(255,255,255,0.05);border:1px solid '+(_pj?'rgba(134,239,172,0.35)':'rgba(232,200,96,0.35)')+';border-radius:20px;padding:2px 9px">'+(_pj?'Pi\u00e8ces re\u00e7ues':'Pi\u00e8ces attendues')+'</span>';
      h+='</div>';
    }

    if(ouvert){
      var lignes=[
        ['Utilisateurs', l.users], ['Parcelles', l.nbparc], ['Commune(s)', l.commune],
        ['Parcellaire', l.parcellaire], ['Permanents', l.perm], ['Saisonniers', l.saiso],
        ['Engins', l.engins], ['Conduite', l.conduite], ['Cuv\u00e9es', l.cuvees],
        ['Modules', Array.isArray(l.modules)?l.modules.join(', '):'']
      ].filter(function(x){ return x[1]; });
      if(lignes.length){
        h+='<div style="margin-top:10px;border-top:1px solid rgba(255,255,255,0.07);padding-top:9px;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px 12px">';
        lignes.forEach(function(x){
          h+='<div style="font-size:var(--pt-lbl,12px);color:rgba(255,255,255,0.4)"><span style="color:rgba(255,255,255,0.25)">'+x[0]+'</span> \u00b7 '+_escHtml(String(x[1]))+'</div>';
        });
        h+='</div>';
      }
      if(l.message){
        h+='<div style="margin-top:9px;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px;font-size:var(--pt-micro,12px);color:rgba(255,255,255,0.55);line-height:1.6;white-space:pre-wrap">'+_escHtml(l.message)+'</div>';
      }
      if(note){
        h+='<div style="margin-top:8px;font-size:var(--pt-lbl,12px);color:#C4B5FD">'+_mvIcon('crayon',16)+' '+_escHtml(note)+'</div>';
      }
      h+='<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">';
      Object.keys(_AGT_LEADST).forEach(function(k){
        var on=(st===k);
        h+='<button onclick="agtLeadSet(\'' + id + '\',\'' + k + '\')" style="background:'+(on?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.04)')+';border:1px solid '+(on?_AGT_LEADST[k].c:'rgba(255,255,255,0.1)')+';border-radius:20px;padding:4px 10px;color:'+(on?_AGT_LEADST[k].c:'rgba(255,255,255,0.35)')+';font-size:var(--pt-micro,11px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">'+_AGT_LEADST[k].l+'</button>';
      });
      h+='</div>';
      h+='<div style="margin-top:9px;display:flex;gap:6px;flex-wrap:wrap">';
      h+='<button onclick="agtLeadMail(\'' + id + '\')" style="background:#C9A84C;border:none;border-radius:8px;padding:7px 13px;color:#0C1A0A;font-size:var(--pt-lbl,12px);font-weight:700;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">R\u00e9pondre</button>';
      h+='<button onclick="agtLeadCopy(\'' + id + '\')" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:7px 13px;color:rgba(255,255,255,0.55);font-size:var(--pt-lbl,12px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">Copier l\u2019e-mail</button>';
      h+='<button onclick="agtLeadNote(\'' + id + '\')" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:7px 13px;color:rgba(255,255,255,0.55);font-size:var(--pt-lbl,12px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">Note</button>';
      if(l.mer){
        var _pjb=!!(_agtLeadSt[l._id]&&_agtLeadSt[l._id].pj);
        h+='<button onclick="agtLeadPj(\'' + id + '\')" style="background:rgba(255,255,255,0.06);border:1px solid '+(_pjb?'rgba(134,239,172,0.4)':'rgba(232,200,96,0.4)')+';border-radius:8px;padding:7px 13px;color:'+(_pjb?'#86EFAC':'#E8C860')+';font-size:var(--pt-lbl,12px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif)">'+(_pjb?'\u2713 Pi\u00e8ces re\u00e7ues':'Pi\u00e8ces re\u00e7ues ?')+'</button>';
      }
      h+='</div>';
    }

    h+='<button onclick="agtLeadOpen(\'' + id + '\')" style="background:none;border:none;color:rgba(196,181,253,0.55);font-size:var(--pt-lbl,12px);cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);padding:8px 0 0">'+(ouvert?'\u2013 Replier':'+ D\u00e9tail')+'</button>';
    h+='</div>';
  });
  return h;
}

function agtLeadFilter(f){ _agtLeadFilter=f; agtRenderBody(); }
function agtLeadOpen(id){ _agtLeadOpen=(_agtLeadOpen===id)?null:id; agtRenderBody(); }

function _agtLeadById(id){
  return (_agtLeads||[]).filter(function(l){ return l._id===id; })[0]||null;
}

async function agtLeadSet(id,st){
  if(!_AGT_LEADST[st]) return;
  _agtLeadSt[id]=Object.assign({}, _agtLeadSt[id]||{}, { st:st, ts:new Date().toISOString() });
  if(await _agtSaveLeadSt(id)){
    var l=_agtLeadById(id);
    agtLogAccess('', 'Lead ' + ((l&&l.domaine)||id.slice(0,8)) + ' \u2192 ' + _AGT_LEADST[st].l, '\uD83D\uDCE9', 'commercial');
    agtRenderBody();   // ★ GTFIX-4 : mise à jour sur place, plus un rechargement complet (GT-B11)
  }
}

function agtLeadNote(id){
  if(!window.openPrompt){ showToast('Saisie indisponible','#B85A1A'); return; }
  var cur=(_agtLeadSt[id]&&_agtLeadSt[id].note)||'';
  window.openPrompt({
    titre:'Note interne', sub:'Visible uniquement dans ce panneau.',
    valeur:cur, type:'texte', btnLabel:'Enregistrer',
    cb:async function(v){
      _agtLeadSt[id]=Object.assign({}, _agtLeadSt[id]||{}, { note:String(v||'').slice(0,500), ts:new Date().toISOString() });
      if(await _agtSaveLeadSt(id)) agtRenderBody();   // ★ GTFIX-4 (GT-B11)
    }
  });
}

// Brouillon COURT et adresse. Un corps long encode triple avec les accents et
// Outlook le tronque en silence vers 2000 caracteres (lecon mise-en-route.html).
function agtLeadMail(id){
  var l=_agtLeadById(id); if(!l) return;
  var suj='Votre demande d\u2019essai Ma Vigne';
  var txt='Bonjour,\n\nMerci pour votre demande. Pour pr\u00e9parer votre installation, '
    +'voici le formulaire de mise en route :\n'
    +GT_BASE_URL+'/mise-en-route.html\n\nNicolas Gu\u00e9ret \u2014 GUERETTECH\n';
  var href='mailto:'+encodeURIComponent(l.email||'')+'?subject='+encodeURIComponent(suj)+'&body='+encodeURIComponent(txt);
  try{ window.location.href=href; }
  catch(e){ if(window.logError) window.logError({level:'info',cat:'ui',msg:'mailto lead',detail:(e&&e.message)||String(e)}); }
}

// Le seul fait de cette fiche qui se coche A LA MAIN, et c'est assume : aucune
// fonction ne peut le savoir, puisque les fichiers arrivent par la boite mail.
// Ecrit dans leads_status, jamais dans `leads` — qui est write:false cote client.
async function agtLeadPj(id){
  var e=_agtLeadSt[id]||{};
  _agtLeadSt[id]=Object.assign({}, e, { pj:!e.pj, ts:new Date().toISOString() });
  if(await _agtSaveLeadSt(id)){
    showToast(_agtLeadSt[id].pj?'\u2705 Pi\u00e8ces re\u00e7ues':'Pi\u00e8ces en attente', _agtLeadSt[id].pj?'#3D6B27':'#B85A1A');
    agtRenderBody();
  }
}

function agtLeadCopy(id){
  var l=_agtLeadById(id); if(!l) return;
  var v=l.email||'';
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(v).then(function(){ showToast('E-mail copi\u00e9','#3D6B27'); },
        function(){ _fallbackCopyGT(v); });
    } else { _fallbackCopyGT(v); }
  }catch(e){ _fallbackCopyGT(v); }
}

window.agtLockNow        = agtLockNow;
window.agtUnlock         = agtUnlock;
window.agtLockOut        = agtLockOut;
window.agtBizForm        = agtBizForm;
window.agtBizTy          = agtBizTy;
window.agtBizSetAn       = agtBizSetAn;
window.agtBizInterne     = agtBizInterne;
window.agtBizReleve      = agtBizReleve;
window.agtBizRecap       = agtBizRecap;
window.agtBizRelance     = agtBizRelance;
window.agtBizCsv         = agtBizCsv;
window.agtBizLivre       = agtBizLivre;   // ★ GTFIX-3 (§512)
window.agtBizPer         = agtBizPer;
window.agtBizAbo         = agtBizAbo;
window.agtBizCible       = agtBizCible;
window.agtBizRattache    = agtBizRattache;
window.agtFactAdd        = agtFactAdd;
window.agtFactPaye       = agtFactPaye;
window.agtFactDel        = agtFactDel;
window.agtLeadFilter     = agtLeadFilter;
window.agtLeadOpen       = agtLeadOpen;
window.agtLeadSet        = agtLeadSet;
window.agtLeadNote       = agtLeadNote;
window.agtLeadMail       = agtLeadMail;
window.agtLeadCopy       = agtLeadCopy;
window.agtLeadPj         = agtLeadPj;
window.agtShowJournal    = agtShowJournal;
window.agtShowErreurs    = agtShowErreurs;
window.agtShowMembres    = agtShowMembres;
window.agtRefreshMembres = agtRefreshMembres;
window.agtOpenAddMembre  = agtOpenAddMembre;
window.agtSaveAddMembre  = agtSaveAddMembre;
// ⚠️ Sept exports, pas six : le preflight ne controle que `onclick`, or `onblur` et
//    `onchange` ont exactement le meme sort apres le build IIFE — la fonction locale
//    est invisible depuis un handler ecrit dans du HTML. agtInsPerDate n'aurait ete
//    signalee par rien, et les dates de periode ne se seraient jamais enregistrees.
window.agtInsMachLire    = agtInsMachLire;
window.agtInsMachVider   = agtInsMachVider;
window.agtInsPerAdd      = agtInsPerAdd;
window.agtInsPerDel      = agtInsPerDel;
window.agtInsPerNom      = agtInsPerNom;
window.agtInsPerDate     = agtInsPerDate;
window.agtInsPerTog      = agtInsPerTog;
window.agtInsPerTache    = agtInsPerTache;
window.agtInsPerCopy     = agtInsPerCopy;
window.agtOpenLotMembres = agtOpenLotMembres;
window.agtLotPreview     = agtLotPreview;
window.agtLotGo          = agtLotGo;
window.agtLotCopy        = agtLotCopy;
window.agtLotPrint       = agtLotPrint;
window.renderAdminGT     = renderAdminGT;
window.agtSwitchTab      = agtSwitchTab;
// ★ GT-UI-3 (§518) — ce que l'écran Clients (src/gt/clients.js) LIT de la console, et rien d'autre.
window._agtCliDonnees = function(){
  return {
    clients:(_agtTenants||[]).map(function(t){
      var st=_agtStatutOf(t.slug), c=_agtCli(t.slug)||{}, cnx=_agtConnexions[t.slug], vus={}, retard=0;
      _agtFacts(t.slug).forEach(function(f){ if(_agtFRetard(f)>0 && !vus[f.ref||'']){ vus[f.ref||'']=1; retard++; } });
      return { slug:t.slug, nom:t.nom, statut:st.cle, statutLabel:st.label, interne:_agtInterne(t.slug),
        du:_agtBizDu(t.slug), retard:retard, prix:(st.cle==='actif'?_agtAboPrix(t.slug):0),
        incidents:(t.errorsOpen||0)+(t.reportsOpen||0), crit:t.errorsCrit||0, membres:t.membres, parcelles:t.parcelles,
        echecs:t.echecs||[], derniere:(cnx&&cnx.last)||'', contact:(c.contact&&typeof c.contact==='object')?c.contact:{},
        relanceJours:_agtRelanceEssaiJours(c) };
    }),
    panneau:function(slug, onglet){
      var t=(_agtTenants||[]).filter(function(x){ return x.slug===slug; })[0]; if(!t) return '';
      if(onglet==='factures') return _agtFicheBiz(slug);
      if(onglet==='incidents') return _agtFicheIncid(t);
      if(onglet==='appareils') return _agtFicheAppareils(t);
      if(onglet==='acces') return _agtCnxSection(slug)+_agtFicheAcces(slug);
      return '';
    },
    // ★ GT-UI-4 (§519) — la chronologie de la maquette : factures émises et payées, incidents, accès (huit au plus).
    chronologie:function(slug){
      var L=[];
      _agtFacts(slug).forEach(function(f){
        var ty=_agtFType(f); if(ty==='geste') return;
        L.push({ quand:String(f.date||''), type:'facture', titre:'Facture '+(f.ref||'')+' \u00e9mise, '+String((_AGT_TY[ty]||{}).lbl||'').toLowerCase()+', '+_agtEur(f.montant) });
        if(f.statut==='payee' && _agtFPayeLe(f)) L.push({ quand:f.paye_le, type:'facture', titre:(f.ref||'')+' pay\u00e9e'+(_AGT_MODES[f.mode]?(' par '+_AGT_MODES[f.mode].toLowerCase()):'') });
      });
      var t=(_agtTenants||[]).filter(function(x){ return x.slug===slug; })[0];
      if(t) _agtErrGroupes((t.errors||[]).map(function(e){ return Object.assign({}, e, { _tenantNom:t.nom }); })).slice(0,5).forEach(function(gg){ if(gg.last) L.push({ quand:gg.last.toISOString().slice(0,10), type:'incident', titre:gg.msg }); });
      (_agtAccessLog||[]).filter(function(e){ return e && e.tenant===slug; }).slice(0,5).forEach(function(e){ L.push({ quand:String(e.ts||'').slice(0,10), type:'acces', titre:String(e.action||'') }); });
      return L.filter(function(x){ return x.quand; }).sort(function(a,b){ return a.quand<b.quand?1:(a.quand>b.quand?-1:0); }).slice(0,8);
    },
    esc:_escHtml, eur:_agtEur, relTime:_agtRelTime, dateFr:_agtDateFr, silenceJ:_AGT_SILENCE_J
  };
};
window.agtRelanceEssai   = agtRelanceEssai;   // GT-UI-3
window.agtCliContactEnregistrer = agtCliContactEnregistrer;
window.agtRadarTri       = agtRadarTri;   // GT-UI-2
window.agtRenderBody     = agtRenderBody;   // ★ GT-UI-2 : les écrans de src/gt/ redessinent par elle
// ★ GT-UI-2 (§517) — ce que l'écran Incidents (src/gt/incidents.js) LIT de la console, et rien d'autre.
window._agtIncDonnees = function(){
  return { groupes:_agtErrGroupes(_agtErrMerged()), suivi:_agtSuivi, st:_AGT_SUIVI_ST, fin:_AGT_SUIVI_FIN,
    prio:function(g){ return _agtPrioSuggeree(g); }, cat:_AGT_CAT, ligneSuivi:function(g){ return _agtSuiviLigne(g); },
    sante:_agtErrSante(), esc:_escHtml, relTime:_agtRelTime, dateFr:_agtDateFr,
    noms:(_agtTenants||[]).reduce(function(o,t){ o[t.slug]=t.nom; return o; },{}) };
};
// ★ GT-UI-1 (§516) — ce que la coquille (src/gt/coquille.js) LIT de la console, et rien d'autre.
window._agtOngletCourant = function(){ return _agtTab; };
window._agtEstVerrouille = function(){ return !!_agtLocked; };
window._agtPaletteDonnees = function(){
  var factures=[];
  Object.keys(_agtBilling||{}).forEach(function(sl){ _agtFacts(sl).forEach(function(f){ if(f && f.ref) factures.push({ ref:String(f.ref), slug:sl }); }); });
  return {
    clients:(_agtTenants||[]).map(function(t){ return { slug:t.slug, nom:t.nom }; }),
    incidents:_agtErrGroupes(_agtErrMerged()).slice(0,200).map(function(g){ return { id:g.id, msg:g.msg, n:g.n, ouvert:g.nOpen>0 }; }),
    factures:factures,
    leads:(_agtLeads||[]).map(function(l){ return { nom:(l && (l.domaine||l.nom))||'' }; })
  };
};
window.agtGoClient       = agtGoClient;
window.agtSetIncTab      = agtSetIncTab;
window.agtSetOutTab      = agtSetOutTab;
window.agtResolveReport  = agtResolveReport;
window.agtErrCopy        = agtErrCopy;
window.agtResolveGroup   = agtResolveGroup;
window.agtPrepOuvrir     = agtPrepOuvrir;
window.agtResolveError   = agtResolveError;
window.agtPurgeErrors    = agtPurgeErrors;
window.copyTenantLink    = copyTenantLink;
window.agtSlugPreview    = agtSlugPreview;
window.saveAddTenant     = saveAddTenant;
window.agtCreateEssai    = agtCreateEssai;
window.agtRevokeEssai    = agtRevokeEssai;
window.agtCopyEssaiCode  = agtCopyEssaiCode;
window.agtKmlFileChange  = agtKmlFileChange;
window.agtKmlSave        = agtKmlSave;
window.agtKmlSlugChange  = agtKmlSlugChange;
window.agtKmlMode        = agtKmlMode;
window.agtKmlCreerF      = agtKmlCreerF;
window.agtKmlConfirmSet  = agtKmlConfirmSet;
window.agtCheckKml       = agtCheckKml;
window.agtSyncEphy       = agtSyncEphy;
window.agtDeleteTenant        = agtDeleteTenant;
window.agtDelCheck            = agtDelCheck;
window.agtDeleteTenantConfirm = agtDeleteTenantConfirm;
window.agtOpenInstall         = agtOpenInstall;
window.agtInsClose            = agtInsClose;
window.agtInsPick             = agtInsPick;
window.agtInsKml              = agtInsKml;
window.agtInsGo               = agtInsGo;
window.agtInsCopy             = agtInsCopy;
window.agtInsTrialGo          = agtInsTrialGo;
window.agtInsParcDel          = agtInsParcDel;
window.agtInsParcSurf         = agtInsParcSurf;
window.agtInsSlugSync         = agtInsSlugSync;
window.agtResetPwd            = agtResetPwd;
window._agtInsGeo             = _agtInsGeo;
window.agtInsNoms             = agtInsNoms;
window.agtInsNomsClear        = agtInsNomsClear;
window.agtInsNomSet           = agtInsNomSet;
window.agtInsPickNom          = agtInsPickNom;
window.agtInsComm             = agtInsComm;
window.agtInsCommAll          = agtInsCommAll;
