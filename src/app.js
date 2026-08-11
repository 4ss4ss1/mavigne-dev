// ════════════════════════════════════
// MA VIGNE — app.js
// Extrait depuis index.html — Phase 3 migration Vite
// © 2026 Nicolas GUERET / GUERETTECH
// ════════════════════════════════════

// ── Feuille de style globale (extraite d'index.html — allègement réseau, cache-first) ──
import './styles.css';
// ── Import Firebase (doit être en tête — fournit window.firebase, fbSave, etc.) ──
import { isAdmin, isTractoriste, isSaisonnier, canWrite,
         getRoleLabel, showToast, showSyncBadge, wmoDesc, wmoEmoji, TABREV, tNom,
         applyTheme, setThemeMode, initTheme, logError, _closeCriticalOverlay, _escHtml, _escAttr,
         GT_ADMIN_EMAIL, DEMO_TENANT, DEMO_FIREBASE_EMAIL, DEMO_FIREBASE_PWD, dreEffectif
} from './utils.js';
// Exposer constantes démo sur window pour accès cross-module
import './firebase.js';
import './onboarding.js';
import './admin-gt.js';
import './cave.js';
import './planning.js';
import './reglages.js';
import './tracteur.js';
import './phyto.js';
import './pilotage.js';
import './reserve.js';
const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if(DEBUG) console.log('[Ma Vigne] app.js ' + (window.APP_VERSION ? 'v' + window.APP_VERSION : '') + ' chargé — ' + new Date().toISOString());
// Garde anti-fuite : les jeux de données en dur ci-dessous (membres, parcelles, KML,
// nom de domaine, saison) appartiennent à Marchand-Grillot et ne servent QUE de seed/
// affichage immédiat pour CE tenant. Tout autre domaine (démo, nouveau client) part vide
// et charge ses propres données depuis Firestore — plus aucune donnée MG ne transparaît.
const _MV_IS_MG = (function(){try{return (localStorage.getItem('mavigne_tenant')||'')==='marchand-grillot';}catch(e){return false;}})();

// ════════════════════════════════════
// FONCTIONS DOM — appelées par firebase.js via window.*
// Doivent être définies avant l'exécution de firebase.js
// → exposées sur window immédiatement
// ════════════════════════════════════


// ── Applique les données Firebase dans les variables globales ──
// #wipe : cles deja chargees depuis Firestore dans la session (verrou anti-ecrasement saveData).
var _mvKeyLoaded = {};
// #wipe : cles LUES depuis Firestore, meme si la valeur a ete volontairement ignoree
// (cas du tableau vide filtre par _staticKeys ci-dessous). Distinct de _mvKeyLoaded :
// « on a eu la reponse du serveur » n'est pas « on a applique la reponse du serveur ».
// Sans ce second marqueur, un domaine dont le doc membres/saisons vaut [] en base
// (onboarding partiellement echoue) verrait saveData refuse EN BOUCLE, sans pouvoir
// creer le premier membre qui remplirait le doc -- un interblocage silencieux.
var _mvKeySeen = {};
window._mvKeyLoaded = _mvKeyLoaded;
window._mvKeySeen   = _mvKeySeen;
function applyFbData(key, value) {
  if(value === undefined || value === null) return;
  if(window._visiteScenarioReady) return; // Visite : scénario figé -> on ignore toute donnée Firestore tardive
  _mvKeySeen[key] = true;     // #wipe : reponse serveur RECUE pour cette cle (avant tout filtre)
  var _staticKeys = {saisons:1, taches:1, membres:1, activites:1, conducteurs:1, catalogue:1};
  if(_staticKeys[key] && Array.isArray(value) && value.length === 0) {
    console.warn('[applyFbData] Tableau vide ignore pour', key);
    return;
  }
  _mvKeyLoaded[key] = true;   // #wipe : cle chargee au moins une fois depuis Firestore
  if(key === 'parcelles') {
    var arr = window.PARCELLES;
    if(arr){ arr.length = 0; value.forEach(function(x){ arr.push(x); }); }
    if(typeof _recalcSurfTotale==='function') _recalcSurfTotale();
  } else if(key === 'config') {
    window.CONFIG = value;
    if(typeof CONFIG !== 'undefined') CONFIG = value;
    if(value.priorityMessage !== undefined) {
      window.priorityMessage = value.priorityMessage;
      if(window._syncLocalVars) window._syncLocalVars();
    }
    if(value.priorityTask !== undefined) {
      window.priorityTask = value.priorityTask;
      if(window._syncLocalVars) window._syncLocalVars();
    }
    // Priorite du moment (multi-taches, v5.05) : re-rendre la liste si elle est ouverte
    try{ var _ppEl=document.getElementById('page-parcelles'); if(_ppEl&&_ppEl.classList.contains('active')&&typeof renderParcelles==='function') renderParcelles(); }catch(e){}
    if(value.domaine_nom) {
      window.DOMAINE_NOM = value.domaine_nom;
      if(typeof DOMAINE_NOM !== 'undefined') DOMAINE_NOM = value.domaine_nom;
      if(typeof applyDomNom === 'function') applyDomNom();
    }
    if(value.saison_passages) {
      var sp = Object.assign({Ebourgeonnage:2, Pioche:2, Relevage:3}, value.saison_passages);
      SAISON_PASSAGES = sp; window.SAISON_PASSAGES = sp;
    }
    if(value.pause_dejeuner !== undefined) {
      window.PLAN_PAUSE_MIN = value.pause_dejeuner;
    }
    try{ if(window._mvTermsCheck) _mvTermsCheck(); }catch(e){}
  } else if(key === 'membres') {
    window.MEMBRES = value;
    if(typeof MEMBRES !== 'undefined') MEMBRES = value;
    _mvRefreshCurrentUserRoles();
    if(window.initLogin && document.getElementById('login-screen') &&
       document.getElementById('login-screen').style.display !== 'none') {
      window.initLogin();
    }
  } else if(key === 'taches') {
    var normT = typeof _normalizeTaches === 'function' ? _normalizeTaches(value) : value;
    window['TACHES'] = normT;
    if(typeof TACHES !== 'undefined') TACHES = normT;
  } else if(key === 'cave_elevage') {
    if(value && typeof value === 'object') {
      Object.assign(window.CAVE_ELEVAGE, {cuvees:[],operations:[],analyses:[],config:{ouillage_alerte_j:14}}, value);
      var _cp = document.querySelector('.page.active');
      if(_cp && _cp.id === 'page-cave') { if(window.renderCave) window.renderCave(); }
    }
  } else if(key === 'cave_vendange') {
    if(value && typeof value === 'object') {
      Object.assign(window.CAVE_VENDANGE, {config:{poids_caisse_kg:25,ratio_min:130,ratio_max:140},recoltes:[],cuves_vinif:[]}, value);
      var _cpv = document.querySelector('.page.active');
      if(_cpv && _cpv.id === 'page-cave') { if(window.renderCave) window.renderCave(); }
    }
  } else if(key === 'planning_templates') {
    if(value && typeof value === 'object') {
      Object.keys(window.PLANNING_TEMPLATES||{}).forEach(function(k){delete window.PLANNING_TEMPLATES[k];});
      Object.assign(window.PLANNING_TEMPLATES, value);
      var _ppa=document.querySelector('.page.active');
      if(_ppa&&_ppa.id==='page-planning'){if(window.renderPlanning)window.renderPlanning();}
    }
  } else if(key === 'planning_entries') {
    if(value && typeof value === 'object') {
      Object.keys(window.PLANNING_ENTRIES||{}).forEach(function(k){delete window.PLANNING_ENTRIES[k];});
      Object.assign(window.PLANNING_ENTRIES, value);
    }
  } else if(key === 'planning_acomptes') {
    if(value && typeof value === 'object') {
      Object.keys(window.PLANNING_ACOMPTES||{}).forEach(function(k){delete window.PLANNING_ACOMPTES[k];});
      Object.assign(window.PLANNING_ACOMPTES, value||{});
    }
  } else if(key === 'planning_hsup') {
    if(value && typeof value === 'object') {
      Object.keys(window.PLANNING_HSUP||{}).forEach(function(k){delete window.PLANNING_HSUP[k];});
      Object.assign(window.PLANNING_HSUP, value||{});
    }
  } else if(key === 'kml_polygons') {
    if(Array.isArray(value) && value.length > 0) {
      KML_POLYGONS_DYNAMIC = value;
      window.KML_POLYGONS_DYNAMIC = value;
    }
  } else if(key === 'intrants') {
    if(window._rsvApply) window._rsvApply(value);
  } else {
    window[key.toUpperCase()] = value;
    // ── Sync var locale (isolation scope ES module Vite) ──
    // window[KEY]=value ne met PAS à jour les let/var déclarés dans le scope module app.js.
    // renderJournalList(), renderTracteur(), etc. lisent les vars locales — il faut les syncer.
    if(key==='journal')       { JOURNAL      = value; window.JOURNAL      = JOURNAL; }
    if(key==='sessions')      { SESSIONS     = value; window.SESSIONS     = SESSIONS; }
    if(key==='traitements')   { TRAITEMENTS  = value; window.TRAITEMENTS  = TRAITEMENTS; }
    if(key==='catalogue')     { CATALOGUE    = value; window.CATALOGUE    = CATALOGUE; }
    if(key==='conducteurs')   { CONDUCTEURS  = value; window.CONDUCTEURS  = CONDUCTEURS; }
    if(key==='activites')     { ACTIVITES    = value; window.ACTIVITES    = ACTIVITES; }
    if(key==='historique')    { HISTORIQUE   = value; window.HISTORIQUE   = HISTORIQUE; }
    if(key==='tracteurs_list'){ TRACTEURS_LIST=value; window.TRACTEURS_LIST=TRACTEURS_LIST; }
    if(key==='entretiens')    { ENTRETIENS   = value; window.ENTRETIENS   = ENTRETIENS; }
    if(key==='reparateur')    { REPARATEUR   = value; window.REPARATEUR   = REPARATEUR; }
    if(key==='reparateur_hist'){ REPARATEUR_HIST = value; window.REPARATEUR_HIST = REPARATEUR_HIST; }
  }
  if(window._syncLocalVars) window._syncLocalVars();
  var _tracRelevant = {sessions:1, tracteurs_list:1, reparateur:1, activites:1};
  if(_tracRelevant[key] &&
     window.tracSessionId &&
     document.getElementById('ovSessionDetail') &&
     document.getElementById('ovSessionDetail').classList.contains('open') &&
     typeof renderSDTracEncart === 'function') {
    renderSDTracEncart();
  }
  // ── Plantation : tarière → trous (cascade au chargement) ──
  if(key==='activites' && _MV_IS_MG){
    try{
      if(Array.isArray(window.ACTIVITES) && !window.ACTIVITES.some(function(a){return a&&a.nom==='Tarière';})){
        window.ACTIVITES.push({nom:'Tarière',emoji:'🌱',tracteurDefautId:((window.TRACTEURS_LIST||[])[0]||{}).id||'trac1',champCustom:{label:'Trous',type:'nombre',feedsPlantation:true}});
        if(typeof ACTIVITES!=='undefined') ACTIVITES=window.ACTIVITES;
      }
    }catch(e){}
  }
  if((key==='sessions'||key==='parcelles') && typeof _recalcPlantationTrous==='function'
     && _mvKeyLoaded.parcelles && _mvKeyLoaded.sessions
     && Array.isArray(window.PARCELLES) && window.PARCELLES.length){
    try{ _recalcPlantationTrous(); }catch(e){}
  }
  if((key==='parcelles'||key==='taches'||key==='config') && typeof _mvMigrateEntreplantation==='function'
     && _mvKeyLoaded.parcelles && _mvKeyLoaded.taches && _mvKeyLoaded.config){
    try{ _mvMigrateEntreplantation(); }catch(e){}
  }
}
window.applyFbData = applyFbData;

/* ═══ PERF-3 : squelettes de liste (affichés au boot tant que !window._dataReady).
   Réutilisent les VRAIES coques (pcard, scard, mvc-cuv, mvv-cuve, pl2-grid, membre-card,
   mvr-*, timeline) → géométrie identique au contenu réel = zéro décalage. ═══ */
function _mvSk(kind){
  var e=function(w,h,r){ return '<span class="mv-sk" style="width:'+w+';height:'+(h||'11px')+';border-radius:'+(r||'5px')+'"></span>'; };
  // ── Parcelles ──
  var pcard=function(a,b,c){ return '<div class="pcard mvsk"><div class="pc-main">'
      +'<span class="pc-ava">'+e('100%','100%','12px')+'</span>'
      +'<div class="pc-info sk-stack">'+e(a,'18px')+e(b,'9px')+'</div>'
      +'<div class="pc-right sk-stack" style="text-align:right">'+e('38px','18px','6px')+e('44px','9px')+'</div>'
      +'</div><div class="pc-bar"></div>'
      +'<div class="pc-tchips">'+e('56px','20px','8px')+(c?e('64px','20px','8px'):'')+'</div></div>'; };
  if(kind==='parcelles') return pcard('56%','34%',1)+pcard('44%','40%',0);
  // ── Journal ──
  var jitem=function(a,b,line){ return '<div class="jitem"><div class="jdotcol"><span class="jdot jd-sk"></span>'
      +(line?'<span class="jlinev"></span>':'')+'</div>'
      +'<div class="jcard"><span class="jcard-bar jcard-bar-sk"></span><div class="jcard-inner">'
      +e(a,'13px')+e(b,'9px')+'</div></div></div>'; };
  if(kind==='journal') return '<div class="dgroup"><div class="dhead">'+e('120px','15px')
      +'<span class="dline"></span>'+e('26px','16px','8px')+'</div>'
      +jitem('42%','64%',1)+jitem('52%','48%',1)+jitem('36%','58%',0)+'</div>';
  // ── Tracteur ──
  var scard=function(a,b){ return '<div class="scard"><div class="sc-hd">'
      +'<span class="sc-ico">'+e('100%','100%','13px')+'</span>'
      +'<div class="sc-info sk-stack">'+e(a,'15px')+e(b,'9px')+'</div>'
      +'<div class="sc-right sk-stack" style="text-align:right">'+e('52px','16px','10px')+e('36px','18px','6px')+'</div>'
      +'</div><div class="sc-bwrap"><div class="sc-blbl">'+e('70px','9px')+e('44px','9px')+'</div><div class="sc-btrack"></div></div></div>'; };
  if(kind==='tracteur') return scard('52%','66%')+scard('44%','58%');
  // ── Réserve ──
  var mkpi=function(w){ return '<div class="mvr-kpi"><div class="mvr-kv">'+e('30px','26px','6px')
      +'</div><div class="mvr-kl">'+e(w,'9px')+'</div></div>'; };
  var fcard=function(a,b,c){ return '<div class="mvr-fcard"><span class="mvr-fband mvr-fband-sk"></span>'
      +'<div class="mvr-fin"><div class="mvr-ftop">'+e(a,'18px')+e('44px','16px','8px')+'</div>'
      +'<div class="sk-stack" style="margin-top:9px">'+e(b,'9px')+e(c,'9px')+'</div></div></div>'; };
  if(kind==='reserve') return '<div class="mvr-kpis">'+mkpi('70%')+mkpi('60%')+mkpi('66%')+'</div>'
      +fcard('52%','64%','40%')+fcard('44%','58%','46%');
  // ── Cave › Le Chai (dans #mvc-body-cuv) ──
  var ccuv=function(a,b,c){ return '<div class="mvc-cuv mvsk"><div class="mvc-cuv-head">'
      +'<div class="mvc-cuv-lead sk-stack">'+e(a,'18px')+e(b,'9px')+'</div>'+e('42px','22px','8px')+'</div>'
      +'<div style="margin:8px 0 2px">'+e(c,'11px')+'</div>'
      +'<div class="mvc-gauge"><div class="mvc-gauge-top">'+e('32%','9px')+e('18%','9px')+'</div>'
      +'<div class="mvc-gauge-track"></div><div style="margin-top:5px">'+e('46%','9px')+'</div></div>'
      +'<div class="mvc-cuv-actions"><span class="mv-sk" style="flex:1;min-height:40px;border-radius:11px"></span>'
      +'<span class="mv-sk" style="flex:0 0 auto;width:44px;min-height:40px;border-radius:11px"></span></div></div>'; };
  if(kind==='chai') return ccuv('62%','40%','48%')+ccuv('50%','44%','54%');
  // ── Cave › Le Cuvier (dans #mvv-body, surface claire comme Le Chai) ──
  var vcuve=function(a,b){ return '<div class="mvv-cuve mvsk"><div class="mvv-cuve-head">'
      +'<div class="sk-stack" style="flex:1;min-width:0">'+e(a,'18px')+e(b,'9px')+'</div>'+e('40px','18px','8px')+'</div>'
      +'<div class="mvv-ferm"><div class="mvv-ferm-top">'+e('34%','9px')+e('52px','22px','5px')+'</div>'
      +'<div class="mvv-gauge"></div><div style="margin-top:6px;display:flex;justify-content:space-between">'
      +e('20%','9px')+e('20%','9px')+'</div></div></div>'; };
  if(kind==='cuvier') return '<div>'+vcuve('58%','42%')+vcuve('50%','46%')+'</div>';
  // ── Planning (dans #plan-body) ──
  if(kind==='planning'){
    var dh=function(w){ return '<div class="pl2-dh"><div class="pl2-dh-in">'+e(w,'9px')+e('16px','14px','4px')+'</div></div>'; };
    var row=function(a,b){ var c='<div class="pl2-name"><span class="pl2-ava mv-sk sk-circle"></span>'
        +'<div class="pl2-name-t sk-stack">'+e(a,'9px')+e(b,'9px')+'</div></div>';
      for(var i=0;i<5;i++) c+='<div class="pl2-cell"><span class="pl2-chip mv-sk"></span></div>';
      c+='<div class="pl2-cell pl2-we"></div><div class="pl2-cell pl2-we"></div>'; return c; };
    var g='<div class="pl2-board"><div class="pl2-bwrap"><div class="pl2-grid pl2-wk">'
      +'<div class="pl2-corner">'+e('40px','9px')+'</div>'
      +dh('20px')+dh('20px')+dh('20px')+dh('20px')+dh('20px')+dh('18px')+dh('18px')
      +row('80%','50%')+row('66%','44%')+row('74%','48%')
      +'<div class="pl2-totl">'+e('34px','9px')+'</div>';
    for(var k=0;k<5;k++) g+='<div class="pl2-tot">'+e('60%','9px')+'</div>';
    g+='<div class="pl2-tot"></div><div class="pl2-tot"></div></div></div></div>';
    return g;
  }
  // ── Réglages (dans #membres-list) ──
  if(kind==='reglages'){
    var mc=function(a,b){ return '<div class="membre-card"><span class="mv-sk sk-circle" style="width:40px;height:40px;flex-shrink:0"></span>'
        +'<div class="sk-stack" style="flex:1;min-width:0">'+e(a,'13px')+e(b,'9px')+'</div>'
        +e('20px','20px','6px')+'</div>'; };
    return mc('44%','62%')+mc('36%','54%')+mc('40%','48%');
  }
  return '';
}
window._mvSk=_mvSk;


window.saveData       = function(k,t) { if(typeof saveData === 'function') saveData(k,t); };
window.initLogin      = function() { if(typeof initLogin === 'function') initLogin(); };
window.loadData       = function() { if(typeof loadData === 'function') loadData(); };



// Garde de démarrage (boot.js) : l'app a démarré — annuler le filet de sécurité
window.__MV_BOOTED=true;
if(window.__MV_BOOT_T)clearTimeout(window.__MV_BOOT_T);
try{sessionStorage.removeItem('mv_boot_retry');}catch(e){}

// ════ SPLASH SCREEN ════
(function(){
  const DUR_HOLD=2200, DUR_GLOW=900, DUR_FLASH=320;
  const title=document.getElementById('sp-title');
  const logo=document.getElementById('sp-logo-img');
  const flash=document.getElementById('sp-flash');
  const splash=document.getElementById('splash-screen');
  setTimeout(function(){
    var start=null;
    function glowFrame(ts){
      if(!start)start=ts;
      var p=Math.min((ts-start)/DUR_GLOW,1),e=p*p;
      title.style.textShadow='0 0 '+Math.round(e*80)+'px rgba(255,255,255,'+(e*0.9)+'),0 0 '+Math.round(e*160)+'px rgba(255,255,255,'+(e*0.5)+')';
      title.style.color='rgb('+Math.round(244+(255-244)*e)+','+Math.round(240+(255-240)*e)+','+Math.round(232+(255-232)*e)+')';
      logo.style.filter='drop-shadow(0 0 '+Math.round(e*20)+'px rgba(180,80,160,'+(e*0.6)+'))';
      var bg=Math.round(e*38);
      splash.style.background='rgb('+bg+','+bg+','+bg+')';
      if(p<1){requestAnimationFrame(glowFrame);}
      else{
        flash.style.transition='opacity '+DUR_FLASH+'ms ease-out';
        flash.style.opacity='1';
        setTimeout(function(){splash.style.display='none';},DUR_FLASH);
      }
    }
    requestAnimationFrame(glowFrame);
  },DUR_HOLD);

  // ── Failsafe iOS : fermeture forcée du splash après 6s (cold start, Firebase lent) ──
  setTimeout(function(){
    var s=document.getElementById('splash-screen');
    if(s && s.style.display!=='none'){
      s.style.transition='opacity 0.4s';
      s.style.opacity='0';
      setTimeout(function(){ s.style.display='none'; },400);
    }
  }, 6000);
})();

// ════ iOS FROZEN STATE ════
(function(){
  var _lastHidden=0;
  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState==='hidden'){
      _lastHidden=Date.now();
    } else if(document.visibilityState==='visible'){
      // En mode standalone iOS, après 30 min d'inactivité → reload propre
      var isStandaloneIOS=(window.navigator.standalone===true);
      var elapsed=Date.now()-_lastHidden;
      if(isStandaloneIOS && _lastHidden>0 && elapsed>30*60*1000){
        window.location.reload();
      }
    }
  });
})();

// ════ APPLICATION PRINCIPALE ════
// ════════════════════════════════════
// DONNÉES
// ════════════════════════════════════

let MEMBRES = _MV_IS_MG ? [
  {nom:'Nico',   email:'gueret.nicolas@gmail.com',       roles:['admin','ouvrier','tractoriste'], statut:'Actif', couleur:'#3D6B27'},
  {nom:'Victor', email:'leravictor904@gmail.com',         roles:['ouvrier','tractoriste'],         statut:'Actif', couleur:'#1A4A7A'},
  {nom:'Dessi',  email:'dessi.9332@yahoo.com',            roles:['ouvrier'],                       statut:'Actif', couleur:'#7A4F2E'},
  {nom:'Etienne',email:'etienne.marchand.21@gmail.com',   roles:['ouvrier','tractoriste'],         statut:'Actif', couleur:'#5B2D8E'},
  {nom:'Chloé',  email:'tonnelierchloe21@gmail.com',      roles:['ouvrier'],                       statut:'Actif', couleur:'#B8913A'},
  {nom:'Shana',  email:'nana.badyka@gmail.com',            roles:['ouvrier'],                       statut:'Actif', couleur:'#C0392B'},
  {nom:'Alicia', email:'alicia.dupont58@live.fr',          roles:['ouvrier','tractoriste'],         statut:'Actif', couleur:'#1A5276'},
] : [];

let SAISONS = _MV_IS_MG ? [
  {nom:'Hiver 2025–2026', periode:'Déc 2025 – Fév 2026', debut:'2025-11-01', fin:'2026-03-07', active:false},
  {nom:'Printemps 2026', periode:'Mar – Mai 2026', debut:'2026-03-08', fin:'2026-07-31', active:true},
] : [{nom:'Saison en cours', periode:'', active:true}];

let TACHES = [
  {nom:'Taille', hha:70, saisons:['Hiver']},
  {nom:'Tirage', hha:50, saisons:['Hiver']},
  {nom:'Brulage', hha:40, saisons:['Hiver']},
  {nom:'Reparation', hha:45, saisons:['Printemps']},
  {nom:'Pliage', hha:45, saisons:['Printemps']},
  {nom:'Ebourgeonnage', hha:35, saisons:['Printemps'], type:'passages'},
  {nom:'Pioche',        hha:40, saisons:['Printemps'], type:'passages'},
  {nom:'Relevage',     hha:90, saisons:['Printemps'], type:'niveaux',
    niveaux:[{num:1,hha:50},{num:2,hha:20},{num:3,hha:20}], skipRule:true},
  {nom:'Accolage', hha:45, saisons:['Printemps']},
  {nom:'Palissage', hha:30, saisons:['Printemps']},
  {nom:'Entreplantation', anytime:true, trous:true},
];

let SURF_TOTALE = 11.76;   // recalcule dynamiquement depuis les parcelles actives (_recalcSurfTotale)

// Avancement calculé depuis données réelles
let TRAVAUX = {}; // Données chargées depuis Firebase
let SAISON_PASSAGES = {Ebourgeonnage:2, Pioche:2, Relevage:3}; // Passages/niveaux par saison — configurable 1-3 via Réglages

const PARCELLES= _MV_IS_MG ? [{"nom":"Ruchottes","surface":0.077,"statut":"Active","lat":"47.220945445764066","lng":"4.965241122676378","taches":{}},{"nom":"Champitenois Grande","surface":0.3299,"statut":"Active","lat":"47.21695608571429","lng":"4.970948385714285","taches":{}},{"nom":"Champitenois Petite","surface":0.0732,"statut":"Active","lat":"47.21619832499999","lng":"4.971599275","taches":{}},{"nom":"Ergot","surface":0.3709,"statut":"Active","lat":"47.21576756666666","lng":"4.970841155555556","taches":{}},{"nom":"Perrieres Vieille","surface":0.1086,"statut":"Active","lat":"47.220130850000004","lng":"4.970564925","taches":{}},{"nom":"Perrieres Jeune","surface":0.1079,"statut":"Active","lat":"47.221010275000005","lng":"4.9709544999999995","taches":{}},{"nom":"7 Rangs","surface":0.0667,"statut":"Active","lat":"47.2321987","lng":"4.9669846","taches":{}},{"nom":"Champs","surface":0.1536,"statut":"Active","lat":"47.233109725000006","lng":"4.9675726749999995","taches":{}},{"nom":"Au Velle","surface":0.3699,"statut":"Active","lat":"47.23146115","lng":"4.966617233333333","taches":{}},{"nom":"20 Rangs","surface":0.1875,"statut":"Active","lat":"47.23192664999999","lng":"4.966694575","taches":{}},{"nom":"Songe du Haut","surface":0.2019,"statut":"Active","lat":"47.231575899999996","lng":"4.968590525","taches":{}},{"nom":"Chaziere","surface":0.087,"statut":"Arrachee","lat":"47.23062468333333","lng":"4.96851645","taches":{}},{"nom":"Entre 2 Routes","surface":0.0406,"statut":"Active","lat":"47.231785800000004","lng":"4.9676618","taches":{}},{"nom":"Songe du Bas","surface":0.1652,"statut":"Active","lat":"47.231314075","lng":"4.96999265","taches":{}},{"nom":"Combe du Dessus","surface":0.169,"statut":"Active","lat":"47.2285493875","lng":"4.9679725375","taches":{}},{"nom":"Carougeot","surface":0.1986,"statut":"Active","lat":"47.22154918333333","lng":"4.973382983333334","taches":{}},{"nom":"Jouise","surface":0.5151,"statut":"Active","lat":"47.222287725","lng":"4.9754784125","taches":{}},{"nom":"Créot","surface":0.3643,"statut":"Active","lat":"47.233935","lng":"4.972331225","taches":{}},{"nom":"Sylvie","surface":0.0457,"statut":"Active","lat":"47.23081858","lng":"4.97407412","taches":{}},{"nom":"Champerrier","surface":0.2968,"statut":"Active","lat":"47.23110025714286","lng":"4.971331928571429","taches":{}},{"nom":"Combe du Bas","surface":1.6753,"statut":"Active","lat":"47.228471828571436","lng":"4.973085071428571","taches":{}},{"nom":"Mansouze","surface":0.148,"statut":"Active","lat":"47.20969473333334","lng":"4.974225916666666","taches":{}},{"nom":"Charreux","surface":0.1139,"statut":"Active","lat":"47.22999388","lng":"4.9788474","taches":{}},{"nom":"Billard Petite","surface":0.2315,"statut":"Active","lat":"47.23032445","lng":"4.97894445","taches":{}},{"nom":"Billard Grande","surface":0.6484,"statut":"Active","lat":"47.230732","lng":"4.980187044444445","taches":{}},{"nom":"Crais","surface":0.554,"statut":"Active","lat":"47.227280549999996","lng":"4.985994825","taches":{}},{"nom":"Etelois","surface":0.2988,"statut":"Active","lat":"47.21371381428572","lng":"4.9710809","taches":{}},{"nom":"Fourneau Vieille","surface":0.1607,"statut":"Active","lat":"47.21490634999999","lng":"4.9775889","taches":{}},{"nom":"Fourneau Jeune","surface":0.1304,"statut":"Active","lat":"47.215599475","lng":"4.975778075","taches":{}},{"nom":"Marchais Petite","surface":0.0385,"statut":"Active","lat":"47.22525455","lng":"4.960455575","taches":{}},{"nom":"Marchais Grande","surface":0.405,"statut":"Active","lat":"47.22450284285714","lng":"4.961353242857143","taches":{}},{"nom":"Croix des Champs","surface":0.1259,"statut":"Active","lat":"47.221786175000005","lng":"4.978182125","taches":{}},{"nom":"Platieres","surface":0.3119,"statut":"Active","lat":"47.221922966666675","lng":"4.989312333333333","taches":{}},{"nom":"Reniard","surface":0.1871,"statut":"Active","lat":"47.21254178333333","lng":"4.978380283333333","taches":{}},{"nom":"Herbiottes","surface":0.2711,"statut":"Active","lat":"47.2012746","lng":"4.969528033333334","taches":{}},{"nom":"Cognées","surface":0.1385,"statut":"Active","lat":"47.197667925000005","lng":"4.971090125","taches":{}},{"nom":"Bras","surface":0.1144,"statut":"Active","lat":"47.203484849999995","lng":"4.97142495","taches":{}},{"nom":"Pouroux","surface":0.2021,"statut":"Active","lat":"47.192603725","lng":"4.965891900000001","taches":{}},{"nom":"Herbues","surface":0.335,"statut":"Active","lat":"47.189758899999994","lng":"4.9672456125","taches":{}},{"nom":"Pasquier des Chenes","surface":0.3325,"statut":"Active","lat":"47.20466566666666","lng":"4.979041383333334","taches":{}},{"nom":"Crotteaux","surface":0.2992,"statut":"Active","lat":"47.17761585","lng":"4.968223575000001","taches":{}},{"nom":"Gravieres","surface":0.165,"statut":"Active","lat":"47.1866447","lng":"4.976601574999999","taches":{}},{"nom":"Bollery Blanc","surface":0.2324,"statut":"Active","lat":"47.171483625","lng":"4.9644239875","taches":{}},{"nom":"Bollery","surface":0.3285,"statut":"Active","lat":"47.1714132125","lng":"4.964357925","taches":{}},{"nom":"Batailles","surface":0.1775,"statut":"Active","lat":"47.184826599999994","lng":"4.971313175","taches":{}},{"nom":"Comble","surface":0.2961,"statut":"Active","lat":"47.2381557875","lng":"4.981507875","taches":{}}] : []; // taches chargées depuis Firebase (Marchand-Grillot uniquement ; autres tenants → Firestore)

// Surface totale = somme des parcelles actives (jamais figee). MG : ~11.76 ha via PARCELLES statique.
function _recalcSurfTotale(){
  try{
    var _arr=(typeof PARCELLES!=='undefined'&&PARCELLES)?PARCELLES:(window.PARCELLES||[]);
    var _s=(_arr||[]).filter(function(p){return p&&p.statut!=='Arrachee';})
                     .reduce(function(a,p){return a+(parseFloat(p.surface)||0);},0);
    SURF_TOTALE=Math.round(_s*10000)/10000;
    window.SURF_TOTALE=SURF_TOTALE;
  }catch(e){}
  return SURF_TOTALE;
}
window._recalcSurfTotale=_recalcSurfTotale;
_recalcSurfTotale();

let JOURNAL=[]; // Données chargées depuis Firebase

let ACTIVITES = _MV_IS_MG ? [
  {nom:'Griffage',   emoji:'🚜',tracteurDefautId:'trac1',champCustom:null},
  {nom:'Intercep',   emoji:'✂️',tracteurDefautId:'trac2',champCustom:null},
  {nom:'Rognage',    emoji:'✂️',tracteurDefautId:'trac2',champCustom:null},
  {nom:'Buttage',    emoji:'🌱',tracteurDefautId:'trac1',champCustom:null},
  {nom:'Débuttage',  emoji:'🌱',tracteurDefautId:'trac1',champCustom:null},
  {nom:'Minibuttage',emoji:'🌱',tracteurDefautId:'trac1',champCustom:null},
  {nom:'Tarière',    emoji:'🌱',tracteurDefautId:'trac1',champCustom:{label:'Trous',type:'nombre',feedsPlantation:true}},
  {nom:'Traitement', emoji:'🌿',tracteurDefautId:'trac3',champCustom:null},
] : [
  {nom:'Griffage',  emoji:'🚜',tracteurDefautId:'trac1',champCustom:null},
  {nom:'Intercep',  emoji:'✂️',tracteurDefautId:'trac1',champCustom:null},
  {nom:'Rognage',   emoji:'✂️',tracteurDefautId:'trac1',champCustom:null},
  {nom:'Tarière',   emoji:'🌱',tracteurDefautId:'trac1',champCustom:{label:'Trous',type:'nombre',feedsPlantation:true}},
  {nom:'Traitement',emoji:'🌿',tracteurDefautId:'trac1',champCustom:null},
]; // nouveau tenant : activités viticoles génériques (toutes sur le tracteur unique par défaut)
let CONDUCTEURS=[]; // #3 : aucun conducteur par défaut (les noms réels viennent de Firestore ; un nouveau tenant démarre vide)
// ── Parc tracteurs (persisté Firebase + localStorage) ──
let TRACTEURS_LIST = _MV_IS_MG ? [
  {id:'trac1',nom:'T1',modele:'',type:'mécanique',   traitementOnly:false},
  {id:'trac2',nom:'T2',modele:'',type:'hydrostatique',traitementOnly:false},
  {id:'trac3',nom:'T3',modele:'',type:'hydrostatique',traitementOnly:true},
] : [
  {id:'trac1',nom:'Tracteur',modele:'',type:'mécanique',traitementOnly:false},
]; // nouveau tenant : 1 tracteur générique (minimum 1) — à renommer/compléter dans Réglages
// ── Fiches d'entretien {id, tracteurId, date, conducteur, activite, plein, huile, filtre_air, radiateur, pression_pneu, lavage, anomalie} ──
let ENTRETIENS=[];
// ── État réparateur par tracteur {tracteurId:{depuis,motif,prevu_retour}} ──
let REPARATEUR={};
// ── Historique des réparations terminées {tracteurId:[{depuis,retour,motif}]} ──
let REPARATEUR_HIST={};
let SESSIONS=[]; // Données chargées depuis Firebase
let CATALOGUE=[
  // ── Cuivre ──
  {nom:'Bouillie bordelaise 20 WG',type:'Cuivre',amm:'2010001',dar:21,drae:24,dose:'4 kg/ha',cible:'Mildiou',usage:'Max 6 kg/ha/an (cuivre métal)',znt:5},
  {nom:'Nordox 75 WG',type:'Cuivre',amm:'9200386',dar:56,drae:24,dose:'0,6 kg/ha',cible:'Mildiou',usage:'Max 3 applications',znt:5},
  {nom:'Cuprofix Disperss',type:'Cuivre',amm:'2020105',dar:21,drae:24,dose:'3 kg/ha',cible:'Mildiou',usage:'Base cuivre oxychlorure',znt:5},
  {nom:'Kocide Opti',type:'Cuivre',amm:'2130182',dar:21,drae:24,dose:'3 kg/ha',cible:'Mildiou',usage:'Hydroxyde de cuivre',znt:5},
  // ── Soufre ──
  {nom:'Microthiol Special Disperss',type:'Soufre',amm:'2020014',dar:35,drae:6,dose:'5 kg/ha',cible:'Oïdium',usage:'Max 20 kg/ha/an — ne pas appliquer T°>28°C',znt:5},
  {nom:'Thiovit Jet',type:'Soufre',amm:'8900225',dar:56,drae:6,dose:'3–5 kg/ha',cible:'Oïdium, Acariens',usage:'Max 10 appl. — T° max 25°C',znt:5},
  {nom:'Soufre 80 WG Stulln',type:'Soufre',amm:'2030057',dar:35,drae:6,dose:'4 kg/ha',cible:'Oïdium',usage:'Traitement préventif',znt:5},
  {nom:'Heliosoufre S',type:'Soufre',amm:'9200268',dar:35,drae:6,dose:'6 L/ha',cible:'Oïdium',usage:'Formule liquide — utilisation en circuit fermé',znt:5},
  // ── Fongicides anti-mildiou ──
  {nom:'Mildicut',type:'Fongicide',amm:'2100435',dar:21,drae:24,dose:'2,5 L/ha',cible:'Mildiou',usage:'Max 4 appl. — préventif/curatif',znt:5},
  {nom:'Equation Pro',type:'Fongicide',amm:'2030218',dar:21,drae:24,dose:'0,4 kg/ha',cible:'Mildiou',usage:'Max 3 appl. — cymoxanil + famoxadone',znt:20,stadeOblig:true},
  {nom:'Pergado F',type:'Fongicide',amm:'2130033',dar:28,drae:24,dose:'2 kg/ha',cible:'Mildiou',usage:'Max 4 appl. — mandipropamide + folpet',znt:20},
  {nom:'Profiler',type:'Fongicide',amm:'2120063',dar:56,drae:24,dose:'2,5 kg/ha',cible:'Mildiou',usage:'Max 4 appl. — fluopicolide + fosetyl',znt:20},
  {nom:'Ridomil Gold MZ Pepite',type:'Fongicide',amm:'9600487',dar:30,drae:24,dose:'2,5 kg/ha',cible:'Mildiou',usage:'Max 2 appl./an — metalaxyl-M',znt:20},
  {nom:'Valis M',type:'Fongicide',amm:'2100244',dar:28,drae:24,dose:'2 kg/ha',cible:'Mildiou',usage:'Max 4 appl. — valifénalate + mancozèbe',znt:20},
  // ── Fongicides anti-oïdium / botrytis ──
  {nom:'Switch',type:'Fongicide',amm:'9900455',dar:7,drae:24,dose:'0,8 kg/ha',cible:'Botrytis, Oïdium',usage:'Max 3 appl. — cyprodinil + fludioxonil',znt:20},
  {nom:'Cantus',type:'Fongicide',amm:'2060041',dar:7,drae:24,dose:'0,6 kg/ha',cible:'Botrytis',usage:'Max 2 appl./an — boscalide',znt:20},
  {nom:'Teldor',type:'Fongicide',amm:'9900354',dar:7,drae:24,dose:'1,5 kg/ha',cible:'Botrytis',usage:'Max 2 appl./an — fenhexamide',znt:5},
  {nom:'Luna Privilege',type:'Fongicide',amm:'2110299',dar:7,drae:24,dose:'0,5 L/ha',cible:'Oïdium, Botrytis',usage:'Max 3 appl. — fluopyram',znt:20},
  {nom:'Vivando',type:'Fongicide',amm:'2110128',dar:42,drae:24,dose:'0,16 L/ha',cible:'Oïdium',usage:'Max 2 appl./an — metrafenone',znt:5},
  {nom:'Talendo Extra',type:'Fongicide',amm:'2130076',dar:21,drae:24,dose:'0,35 L/ha',cible:'Oïdium',usage:'Max 3 appl. — proquinazid + tétraconazole',znt:20},
  // ── Insecticides ──
  {nom:'Karate Zeon',type:'Insecticide',amm:'9200556',dar:7,drae:48,dose:'0,1 L/ha',cible:'Eudémis, Cochylis, Cicadelles',usage:'Max 2 appl. — lambda-cyhalothrine — abeilles sensibles',znt:20,stadeOblig:true,heureOblig:true},
  {nom:'Coragen',type:'Insecticide',amm:'2100239',dar:7,drae:4,dose:'0,175 L/ha',cible:'Eudémis, Cochylis',usage:'Max 2 appl. — chlorantraniliprole',znt:20},
  {nom:'Affirm',type:'Insecticide',amm:'2100086',dar:7,drae:24,dose:'1,5 kg/ha',cible:'Eudémis, Noctuelles',usage:'Max 3 appl. — emamectine',znt:5},
  // ── Herbicides ──
  {nom:'Basta F1',type:'Herbicide',amm:'9200399',dar:0,drae:24,dose:'5 L/ha',cible:'Adventices',usage:'Glufosinate — inter-rang uniquement',znt:5},
  {nom:'Roundup Biactif',type:'Herbicide',amm:'2000270',dar:0,drae:24,dose:'5 L/ha',cible:'Adventices vivaces',usage:'Glyphosate — zones non ZNT uniquement',znt:20},
  {nom:'Devrinol FL',type:'Herbicide',amm:'9200270',dar:0,drae:24,dose:'5 L/ha',cible:'Adventices annuelles',usage:'Napropamide — préémergence',znt:5},
  // ── Biocontrôle ──
  {nom:'Serenade ASO',type:'Biocontrôle',amm:'2110156',dar:0,drae:0,dose:'4 L/ha',cible:'Botrytis, Mildiou',usage:'Bacillus subtilis — sans délai de rentrée',znt:5},
  {nom:'Sonata',type:'Biocontrôle',amm:'2120044',dar:0,drae:0,dose:'8 L/ha',cible:'Oïdium',usage:'Bacillus pumilus — homologué bio',znt:5},
  {nom:'Regalis Plus',type:'Biocontrôle',amm:'2060009',dar:0,drae:0,dose:'1 kg/ha',cible:'Oïdium',usage:'Prohexadione calcium — régulateur croissance',znt:5},
  {nom:'Botector',type:'Biocontrôle',amm:'2100299',dar:0,drae:0,dose:'0,5 kg/ha',cible:'Botrytis',usage:'Aureobasidium pullulans — homologué bio',znt:5},
];
let TRAITEMENTS=[];
const STADES_PHENO=[
  'Débourrement (BBCH 07)','Pointe verte (BBCH 09)',
  '2 feuilles étalées (BBCH 12)','4–5 feuilles (BBCH 14)',
  '6–8 feuilles (BBCH 16)','Pré-floraison (BBCH 57)',
  'Floraison (BBCH 60–69)','Nouaison (BBCH 71)',
  'Fermeture de grappe (BBCH 79)','Véraison (BBCH 81)',
  'Maturité (BBCH 89)'
];
function getDraeParcelle(nomParcelle){
  if(window._visiteDrae){ var _vh=window._visiteDrae[nomParcelle]||0; return _vh>0?{heures:_vh,produit:'Bouillie bordelaise'}:null; }
  var now=new Date(),maxH=0,prodNom='';
  TRAITEMENTS.forEach(function(t){
    var parc=t.parcelles||[];
    if(parc.length>0&&!parc.includes(nomParcelle))return;
    var m=window._phResolve?window._phResolve(t):{drae:t.drae||0,type:t.type||''};
    var dre=dreEffectif(m.drae,m.type,m.dreH,m.dreHc);
    if(!dre.h)return;
    var expire=new Date(new Date(t.date).getTime()+dre.h*3600000);
    var r=Math.max(0,Math.round((expire-now)/3600000));
    if(r>maxH){maxH=r;prodNom=t.produit;}
  });
  return maxH>0?{heures:maxH,produit:prodNom}:null;
}
let METEO_JOURNAL=[];
let HISTORIQUE=[]; // Snapshots archivés par saison
let CONFIG={}; // Config domaine : etp_saison, domaine_nom…

// Exposer les variables sur window pour accès depuis le module Firebase
window.PARCELLES  = PARCELLES;
window.JOURNAL    = JOURNAL;
window.SESSIONS   = SESSIONS;
window.TRAVAUX    = TRAVAUX;
window.SAISON_PASSAGES = SAISON_PASSAGES;
window.TRAITEMENTS= TRAITEMENTS;
window.CATALOGUE  = CATALOGUE;
window.CONDUCTEURS    = CONDUCTEURS;
window.ACTIVITES      = ACTIVITES;
window.TRACTEURS_LIST = TRACTEURS_LIST;
window.ENTRETIENS     = ENTRETIENS;
window.REPARATEUR     = REPARATEUR;
window.REPARATEUR_HIST= REPARATEUR_HIST;
window.MEMBRES        = MEMBRES;
window.CONFIG         = CONFIG;
window.SAISONS    = SAISONS;
window.TACHES     = TACHES;
window.HISTORIQUE = HISTORIQUE;

// Resynchronise les variables locales `let` depuis window.* après une mise à jour Firebase
// (nécessaire car le module Firebase réassigne window.JOURNAL etc. mais pas les let locaux)
window._syncLocalVars = function() {
  if(window.JOURNAL     !== undefined) JOURNAL     = window.JOURNAL;
  if(window.SESSIONS    !== undefined) SESSIONS    = window.SESSIONS;
  if(window.TRAVAUX     !== undefined) TRAVAUX     = window.TRAVAUX;
  if(window.TRAITEMENTS !== undefined) TRAITEMENTS = window.TRAITEMENTS;
  if(window.CATALOGUE   !== undefined) CATALOGUE   = window.CATALOGUE;
  if(window.CONDUCTEURS !== undefined) CONDUCTEURS = window.CONDUCTEURS;
  if(window.ACTIVITES   !== undefined) ACTIVITES   = window.ACTIVITES;
  if(window.TRACTEURS_LIST!==undefined) TRACTEURS_LIST=window.TRACTEURS_LIST;
  if(window.ENTRETIENS  !== undefined) ENTRETIENS  = window.ENTRETIENS;
  if(window.REPARATEUR  !== undefined) REPARATEUR  = window.REPARATEUR;
  if(window.REPARATEUR_HIST !== undefined) REPARATEUR_HIST = window.REPARATEUR_HIST;
  if(window.MEMBRES     !== undefined) MEMBRES     = window.MEMBRES;
  if(window.SAISONS     !== undefined) SAISONS     = window.SAISONS;
  if(window.TACHES      !== undefined) TACHES      = window.TACHES;
  if(window.HISTORIQUE  !== undefined) HISTORIQUE  = window.HISTORIQUE;
  if(window.SAISON_PASSAGES !== undefined) SAISON_PASSAGES = window.SAISON_PASSAGES;
  if(window.CONFIG      !== undefined) CONFIG      = window.CONFIG;
  // PLANNING_* vars → src/planning.js (sync par Object.assign sur ref partagée)
  if(window.priorityMessage !== undefined) priorityMessage = window.priorityMessage;
  if(window.priorityTask    !== undefined) priorityTask    = window.priorityTask;
  // PARCELLES est const : muté en place, pas besoin de réassigner
};

// ════════════════════════════════════
// PERSISTANCE — Firebase (primaire) + localStorage (fallback)
// ════════════════════════════════════
const LS_KEY = 'mavigne_data_v1_' + (localStorage.getItem('mavigne_tenant') || 'marchand-grillot');

// ════ SNAPSHOT localStorage — une seule écriture, groupée, et qui parle quand elle échoue ════
//
// Cette snapshot est le filet hors ligne : c'est elle que loadData() relit au démarrage
// quand Firestore ne répond pas. Quatre défauts corrigés ici :
//
//   1. la copie de secours du jour était RÉÉCRITE à CHAQUE saveData — des dizaines de fois
//      par jour, pour un contenu quasi identique. Elle ne s'écrit plus qu'UNE fois par jour.
//   2. elle était construite en RELISANT localStorage juste après y avoir écrit. On réutilise
//      désormais la chaîne JSON déjà en main : une sérialisation, une écriture, zéro relecture.
//   3. la purge ne regardait que l'ÂGE. Or 7 copies + la copie courante ne tiennent pas dans
//      les ~5 Mo du localStorage dès qu'un domaine a deux ans d'historique : on borne
//      maintenant le VOLUME (_MV_BK_MAX copies, les plus récentes).
//   4. le catch était VIDE. Une sauvegarde locale qui échoue en silence, c'est le scénario
//      « j'ai tout perdu en zone blanche ». Sur saturation on purge les copies de secours,
//      on retente une fois, et si ça échoue encore on le DIT (logError + toast orange).
//
// L'écriture est groupée : au plus une toutes les _MV_SNAP_MS, le dernier appel gagne, avec
// flush immédiat quand l'onglet part — même patron que le stepper de fûts de La Réserve.
// Sérialiser tout le domaine vingt fois pour vingt validations d'affilée ne servait qu'à
// faire ramer le téléphone dans les rangs.
//
// ⚠️ Toute purge VOLONTAIRE de LS_KEY (déconnexion SEC-5, remise à zéro) doit appeler
//    _mvSnapCancel() AVANT d'effacer : sinon une snapshot en attente se réécrirait après.

const _MV_BK_MAX  = 3;      // nombre maximum de copies de secours conservées
const _MV_SNAP_MS = 2000;   // fenêtre de regroupement des écritures
var _mvSnapT      = null;   // timer en attente (null = rien à écrire)
var _mvSnapWarnAt = 0;      // horodatage du dernier toast d'échec (anti-rafale)

// Le contenu de la snapshot. UNE seule définition : le flush différé doit écrire exactement
// ce qu'écrivait l'ancien chemin synchrone, avec l'état le plus récent des variables.
function _mvSnapPayload(){
  return {
    PARCELLES:window.PARCELLES||PARCELLES, JOURNAL:window.JOURNAL||JOURNAL, SESSIONS:window.SESSIONS||SESSIONS,
    TRAVAUX:window.TRAVAUX||TRAVAUX, TRAITEMENTS:window.TRAITEMENTS||TRAITEMENTS, CATALOGUE:window.CATALOGUE||CATALOGUE,
    CONDUCTEURS:window.CONDUCTEURS||CONDUCTEURS, ACTIVITES:window.ACTIVITES||ACTIVITES,
    TRACTEURS_LIST:window.TRACTEURS_LIST||TRACTEURS_LIST, ENTRETIENS:window.ENTRETIENS||ENTRETIENS,
    REPARATEUR:window.REPARATEUR||REPARATEUR, REPARATEUR_HIST:window.REPARATEUR_HIST||REPARATEUR_HIST,
    MEMBRES:window.MEMBRES||MEMBRES,
    SAISONS:window.SAISONS||SAISONS, TACHES:window.TACHES||TACHES, HISTORIQUE:window.HISTORIQUE||HISTORIQUE,
    CAVE_ELEVAGE:window.CAVE_ELEVAGE,
    CAVE_VENDANGE:window.CAVE_VENDANGE,
    PLANNING_TEMPLATES:window.PLANNING_TEMPLATES,
    PLANNING_ENTRIES:window.PLANNING_ENTRIES,
    PLANNING_ACOMPTES:window.PLANNING_ACOMPTES,
    PLANNING_HSUP:window.PLANNING_HSUP,
    CONFIG:window.CONFIG||CONFIG,
    priorityMessage:priorityMessage,
    priorityTask:priorityTask,
    savedAt:Date.now()
  };
}

// Les clés de secours, triées de la plus ancienne à la plus récente.
// mavigne_backup_AAAA-MM-JJ : l'ordre alphabétique EST l'ordre chronologique.
function _mvBkKeys(){
  var out = [];
  for(var i=0; i<localStorage.length; i++){
    var k = localStorage.key(i);
    if(k && k.indexOf('mavigne_backup_')===0) out.push(k);
  }
  return out.sort();
}

// Ne garder que les `keep` copies les plus récentes. keep=0 vide tout.
// On collecte les clés AVANT de supprimer : retirer en cours d'itération décale les index.
function _mvBkPurge(keep){
  var ks = _mvBkKeys();
  for(var i=0; i<ks.length-keep; i++){
    try { localStorage.removeItem(ks[i]); }
    catch(e){ if(window.logError) window.logError({level:'info', cat:'storage',
      msg:'Copie de secours non supprimée', detail:ks[i]}); }
  }
}

// QuotaExceededError sous ses noms réels : standard, Firefox historique, Safari.
// iOS en navigation privée passe par le code 22.
function _mvIsQuota(e){
  if(!e) return false;
  var n = e.name || '', c = (typeof e.code==='number') ? e.code : -1;
  return n==='QuotaExceededError' || n==='NS_ERROR_DOM_QUOTA_REACHED' || n==='QUOTA_EXCEEDED_ERR'
      || c===22 || c===1014;
}

// L'échec dit son nom : trace dans le journal d'erreurs du domaine + toast orange discret,
// au plus un toutes les 10 min pour ne pas transformer une panne en rafale de toasts.
// `vital` distingue la copie COURANTE (warning + toast) d'une copie de secours (info seule) :
// rater une copie de secours ne met rien en péril, rater la copie courante si.
function _mvSnapFail(key, e, vital){
  var nom = (e && e.name) ? e.name : 'erreur inconnue';
  if(window.logError) window.logError({
    level: vital ? 'warning' : 'info',
    cat: 'storage',
    msg: vital ? 'Sauvegarde locale impossible — mémoire du navigateur saturée'
               : 'Copie de secours non écrite — mémoire du navigateur saturée',
    detail: 'clé ' + key + ' · ' + nom });
  if(!vital) return;
  var now = Date.now();
  if(now - _mvSnapWarnAt < 600000) return;
  _mvSnapWarnAt = now;
  if(window.showToast) showToast('Mémoire pleine — sauvegarde hors ligne indisponible', '#B85A1A');
}

// Écriture localStorage tolérante au quota.
// Sur saturation : purge de TOUTES les copies de secours (seule la copie courante permet
// de repartir hors ligne), puis UNE seule nouvelle tentative.
function _mvLsPut(key, val, vital){
  try { localStorage.setItem(key, val); return true; }
  catch(e){
    if(_mvIsQuota(e)){
      _mvBkPurge(0);
      try { localStorage.setItem(key, val); return true; }
      catch(e2){ _mvSnapFail(key, e2, vital); return false; }
    }
    _mvSnapFail(key, e, vital);
    return false;
  }
}

// Écrit la snapshot maintenant. UNE sérialisation, réutilisée telle quelle pour la copie du jour.
function _mvSnapWrite(){
  if(_mvSnapT){ clearTimeout(_mvSnapT); _mvSnapT = null; }
  var json;
  try { json = JSON.stringify(_mvSnapPayload()); }
  catch(e){
    if(window.logError) window.logError({level:'warning', cat:'storage',
      msg:'Sauvegarde locale impossible — données non sérialisables',
      detail:(e && e.message) ? e.message : ''});
    return;
  }
  if(!_mvLsPut(LS_KEY, json, true)) return;
  // La copie courante vient de passer : localStorage répond, getItem ne peut plus échouer.
  var bk = 'mavigne_backup_' + new Date().toISOString().split('T')[0];
  if(localStorage.getItem(bk) !== null){ _mvBkPurge(_MV_BK_MAX); return; }
  _mvBkPurge(_MV_BK_MAX - 1);   // faire la place AVANT d'écrire, pas après
  _mvLsPut(bk, json, false);    // même chaîne, déjà en main : zéro relecture, zéro re-sérialisation
}

// Regroupement : le dernier appel gagne.
function _mvSnapSave(){
  if(_mvSnapT) clearTimeout(_mvSnapT);
  _mvSnapT = setTimeout(_mvSnapWrite, _MV_SNAP_MS);
}

// Annulation — obligatoire avant toute purge volontaire (cf. avertissement en tête de bloc).
function _mvSnapCancel(){ if(_mvSnapT){ clearTimeout(_mvSnapT); _mvSnapT = null; } }

// L'onglet part : on écrit tout de suite. pagehide couvre le rechargement et iOS,
// visibilitychange couvre le passage en arrière-plan (bouton home, appel entrant).
document.addEventListener('visibilitychange', function(){ if(document.hidden && _mvSnapT) _mvSnapWrite(); });
window.addEventListener('pagehide', function(){ if(_mvSnapT) _mvSnapWrite(); });

// Appelé à chaque modification : écrit dans Firebase ET localStorage
// toastMsg (optionnel) : si fourni, affiche un toast après confirmation Firebase
function saveData(keyHint, toastMsg) {
  if(window._MV_LOCKED){ if(window.showToast)showToast('Essai terminé · lecture seule','#7A1020'); return; }
  // #wipe : VERROU DE CHARGEMENT (Couche 2 anti-perte) -- ne jamais persister l'etat memoire
  // d'une cle sensible avant que Firestore ait repondu au moins une fois dans la session.
  //
  // Portee : TOUS LES TENANTS. Ce verrou etait limite a marchand-grillot parce que lui seul
  // porte un squelette de donnees en dur (MEMBRES/SAISONS/PARCELLES cf. _MV_IS_MG) : le
  // risque percu etait « ecrire le squelette par-dessus le vrai domaine ». Mais pour un autre
  // domaine ces memes variables demarrent a [] -- ecrire [] par-dessus des donnees reelles est
  // exactement le meme sinistre, en pire. Depuis qu'un second domaine est en production, le
  // scope MG n'a plus de justification.
  //
  // Echappatoire _mvKeySeen : on ne bloque que si le serveur n'a RIEN dit sur cette cle. Si la
  // reponse est arrivee mais que la valeur a ete ecartee (tableau vide filtre par _staticKeys),
  // l'ecriture passe -- sinon un domaine au doc vide ne pourrait jamais creer sa premiere ligne.
  //
  // La trace : l'ancien `if(window.DEBUG)` etait MORT (window.DEBUG n'est defini nulle part dans
  // le projet -- seul `const DEBUG` existe, par module). Ce verrou pouvait donc refuser une
  // sauvegarde sans laisser la moindre trace, nulle part. On journalise desormais en `warning`,
  // ce qui embarque l'entree dans « Signaler un probleme ». Pas de toast : le cas normal est la
  // fenetre de quelques centaines de ms entre le login et la fin du pull.
  if((keyHint==='parcelles'||keyHint==='membres'||keyHint==='saisons')
     && !_mvKeyLoaded[keyHint] && !_mvKeySeen[keyHint]) {
    if(window.logError) window.logError({level:'warning', cat:'guard',
      msg:'saveData('+keyHint+') ignore -- cle pas encore lue depuis Firestore',
      detail:'verrou de chargement (Couche 2 anti-perte)'});
    return;
  }
  if((keyHint==='parcelles'||!keyHint) && typeof _recalcSurfTotale==='function'){ try{ _recalcSurfTotale(); }catch(e){} }
  // Toujours lire depuis window.* (source de vérité après synchro Firebase)
  const W = {
    parcelles:   window.PARCELLES   || PARCELLES,
    journal:     window.JOURNAL     || JOURNAL,
    sessions:    window.SESSIONS    || SESSIONS,
    travaux:     window.TRAVAUX     || TRAVAUX,
    traitements: window.TRAITEMENTS || TRAITEMENTS,
    catalogue:   window.CATALOGUE   || CATALOGUE,
    conducteurs: window.CONDUCTEURS || CONDUCTEURS,
    activites:   window.ACTIVITES   || ACTIVITES,
    tracteurs_list: window.TRACTEURS_LIST || TRACTEURS_LIST,
    entretiens:  window.ENTRETIENS  || ENTRETIENS,
    reparateur:  window.REPARATEUR  || REPARATEUR,
    reparateur_hist: window.REPARATEUR_HIST || REPARATEUR_HIST,
    membres:     window.MEMBRES     || MEMBRES,
    saisons:     window.SAISONS     || SAISONS,
    taches:      window.TACHES      || TACHES,
    historique:  window.HISTORIQUE  || HISTORIQUE,
    cave_elevage: window.CAVE_ELEVAGE,
    cave_vendange: window.CAVE_VENDANGE,
    planning_templates: window.PLANNING_TEMPLATES,
    planning_entries:   window.PLANNING_ENTRIES,
    planning_acomptes:  window.PLANNING_ACOMPTES,
    planning_hsup:      window.PLANNING_HSUP,
    config:             window.CONFIG || CONFIG,
  };

  // localStorage fallback (immédiat, hors ligne) — écriture groupée, cf. _mvSnapWrite plus haut
  _mvSnapSave();

  // Firebase (async, ne bloque pas l'UI)
  if(window.fbSave) {
    // Helper interne : lance la sauvegarde Firebase et gère le toast de retour
    var _doFbSave = function(key, value) {
      if(!toastMsg) { window.fbSave(key, value); return; }
      // Avec toast : comportement selon état réseau
      if(!navigator.onLine) {
        // Hors ligne : sauvegarde locale OK, toast orange
        window.fbSave(key, value);
        showToast('📵 Sauvegardé localement', '#B85A1A');
        return;
      }
      // En ligne : attendre la promesse Firebase
      var p = window.fbSave(key, value);
      if(p && typeof p.then === 'function') {
        p.then(function() {
          showToast(toastMsg, '#3D6B27');
        }).catch(function() {
          showToast('📵 Sauvegardé localement', '#B85A1A');
        });
      } else {
        // fbSave ne retourne pas de promesse (ex: queue offline) → toast immédiat
        showToast(toastMsg, '#3D6B27');
      }
    };

    if(keyHint && W[keyHint] !== undefined) {
      _doFbSave(keyHint, W[keyHint]);
    } else {
      // Sauvegarde multi-clés : toast sur la première clé seulement
      var _first = true;
      Object.entries(W).forEach(function(entry) {
        var k = entry[0], v = entry[1];
        if(_first) { _first = false; _doFbSave(k, v); }
        else { window.fbSave(k, v); }
      });
    }
  }
}

function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (d.PARCELLES)    { PARCELLES.length=0; d.PARCELLES.forEach(x=>PARCELLES.push(x)); }
    if (d.JOURNAL)      { JOURNAL = d.JOURNAL; window.JOURNAL = JOURNAL; }
    if (d.SESSIONS)     { SESSIONS = d.SESSIONS; window.SESSIONS = SESSIONS; }
    if (d.TRAVAUX)      { TRAVAUX = d.TRAVAUX; window.TRAVAUX = TRAVAUX; }
    if (d.TRAITEMENTS)  { TRAITEMENTS = d.TRAITEMENTS; window.TRAITEMENTS = TRAITEMENTS; }
    if (d.CATALOGUE)    { CATALOGUE = d.CATALOGUE; window.CATALOGUE = CATALOGUE; }
    if (d.CONDUCTEURS)  { CONDUCTEURS = d.CONDUCTEURS; window.CONDUCTEURS = CONDUCTEURS; }
    if (d.ACTIVITES)    { ACTIVITES = d.ACTIVITES; window.ACTIVITES = ACTIVITES; }
    if (d.TRACTEURS_LIST){ TRACTEURS_LIST=d.TRACTEURS_LIST; window.TRACTEURS_LIST=TRACTEURS_LIST; }
    if (d.ENTRETIENS)   { ENTRETIENS=d.ENTRETIENS; window.ENTRETIENS=ENTRETIENS; }
    if (d.REPARATEUR)   { REPARATEUR=d.REPARATEUR; window.REPARATEUR=REPARATEUR; }
    if (d.REPARATEUR_HIST) { REPARATEUR_HIST=d.REPARATEUR_HIST; window.REPARATEUR_HIST=REPARATEUR_HIST; }
    if (d.MEMBRES && d.MEMBRES.length > 0) { MEMBRES = d.MEMBRES; window.MEMBRES = MEMBRES; _mvRefreshCurrentUserRoles(); }
    if (d.SAISONS && d.SAISONS.length > 0) { SAISONS = d.SAISONS; window.SAISONS = SAISONS; }
    if (d.TACHES && d.TACHES.length > 0)   { TACHES = typeof _normalizeTaches==='function'?_normalizeTaches(d.TACHES):d.TACHES; window.TACHES = TACHES; }
    if (d.HISTORIQUE)   { HISTORIQUE = d.HISTORIQUE; window.HISTORIQUE = HISTORIQUE; }
    if (d.priorityMessage !== undefined) { priorityMessage = d.priorityMessage; window.priorityMessage = priorityMessage; }
    if (d.priorityTask !== undefined) { priorityTask = d.priorityTask; window.priorityTask = priorityTask; }
    if (d.CAVE_ELEVAGE) { Object.assign(window.CAVE_ELEVAGE, {cuvees:[],operations:[],analyses:[],config:{ouillage_alerte_j:14}}, d.CAVE_ELEVAGE); }
    if (d.CAVE_VENDANGE) { Object.assign(window.CAVE_VENDANGE, {config:{poids_caisse_kg:25,ratio_min:130,ratio_max:140},recoltes:[],cuves_vinif:[]}, d.CAVE_VENDANGE); }
    if (d.PLANNING_TEMPLATES && typeof d.PLANNING_TEMPLATES === 'object') { Object.keys(window.PLANNING_TEMPLATES||{}).forEach(function(k){delete window.PLANNING_TEMPLATES[k];}); Object.assign(window.PLANNING_TEMPLATES, d.PLANNING_TEMPLATES); }
    if (d.PLANNING_ENTRIES && typeof d.PLANNING_ENTRIES === 'object')   { Object.keys(window.PLANNING_ENTRIES||{}).forEach(function(k){delete window.PLANNING_ENTRIES[k];}); Object.assign(window.PLANNING_ENTRIES, d.PLANNING_ENTRIES); }
    if (d.PLANNING_ACOMPTES && typeof d.PLANNING_ACOMPTES === 'object') { Object.keys(window.PLANNING_ACOMPTES||{}).forEach(function(k){delete window.PLANNING_ACOMPTES[k];}); Object.assign(window.PLANNING_ACOMPTES, d.PLANNING_ACOMPTES); }
    if (d.PLANNING_HSUP && typeof d.PLANNING_HSUP === 'object') { Object.keys(window.PLANNING_HSUP||{}).forEach(function(k){delete window.PLANNING_HSUP[k];}); Object.assign(window.PLANNING_HSUP, d.PLANNING_HSUP); }
    if (d.CONFIG && d.CONFIG.domaine_nom) { DOMAINE_NOM = d.CONFIG.domaine_nom; }
    if (d.CONFIG && d.CONFIG.saison_passages) { SAISON_PASSAGES = Object.assign({Ebourgeonnage:2, Pioche:2, Relevage:3}, d.CONFIG.saison_passages); window.SAISON_PASSAGES = SAISON_PASSAGES; }
    return true;
  } catch(e) { return false; }
}

function resetData() {
  // Conservée pour compatibilité interne — appelée via executeDangerAction
  _mvSnapCancel();   // sans ça, le pagehide du reload réécrirait LS_KEY juste après l'effacement
  localStorage.removeItem(LS_KEY);
  location.reload();
}

// ── Zone dangereuse : overlay de confirmation ──
const DANGER_CFG = {
  reset: {
    icon:'🗑️',
    title:'Réinitialiser l\'application',
    sub:'Cette action est irréversible et immédiate.',
    word:'EFFACER',
    btn:'🗑️ Réinitialiser l\'application',
    successSub:'L\'application va se recharger…',
    items:[
      'Toutes les données locales seront supprimées',
      'Les données Firebase ne sont pas affectées',
      'L\'application se rechargera automatiquement'
    ],
    exec: function(){ resetData(); }
  }
};
let _dangerAction = 'reset';

function openOvDanger(action) {
  if(!isAdmin()) return; // zone dangereuse réservée aux admins
  action = action || 'reset';
  if(!DANGER_CFG[action]) return;
  _dangerAction = action;
  const cfg = DANGER_CFG[action];
  document.getElementById('ovDangerIcon').textContent = cfg.icon;
  document.getElementById('ovDangerTitle').textContent = cfg.title;
  document.getElementById('ovDangerSub').textContent = cfg.sub;
  document.getElementById('ovDangerWord').textContent = cfg.word;
  document.getElementById('ovDangerBtnLbl').textContent = cfg.btn;
  document.getElementById('ovDangerSuccessSub').textContent = cfg.successSub;
  document.getElementById('ovDangerList').innerHTML = cfg.items.map(i=>`<li>${i}</li>`).join('');
  document.getElementById('ovDangerInput').value = '';
  document.getElementById('ovDangerInput').classList.remove('valid');
  document.getElementById('ovDangerBtn').classList.remove('unlocked');
  document.getElementById('ovDangerForm').style.display = 'block';
  document.getElementById('ovDangerSuccess').classList.remove('show');
  openOv('ovDanger');
  setTimeout(()=>{ try{ document.getElementById('ovDangerInput').focus(); }catch(e){} }, 350);
}

function closeOvDanger(e) {
  if(e && e.target !== document.getElementById('ovDanger')) return;
  closeOv(null,'ovDanger');
  setTimeout(()=>{
    document.getElementById('ovDangerInput').value = '';
    document.getElementById('ovDangerInput').classList.remove('valid');
    document.getElementById('ovDangerBtn').classList.remove('unlocked');
    document.getElementById('ovDangerForm').style.display = 'block';
    document.getElementById('ovDangerSuccess').classList.remove('show');
  }, 300);
}

function checkDangerConf() {
  const val = document.getElementById('ovDangerInput').value.trim().toUpperCase();
  const word = (DANGER_CFG[_dangerAction] || {}).word || '';
  const btn = document.getElementById('ovDangerBtn');
  const inp = document.getElementById('ovDangerInput');
  if(val === word){ btn.classList.add('unlocked'); inp.classList.add('valid'); }
  else { btn.classList.remove('unlocked'); inp.classList.remove('valid'); }
}

function executeDangerAction() {
  const cfg = DANGER_CFG[_dangerAction];
  if(!cfg) return;
  if(navigator.vibrate) navigator.vibrate([80,60,80]);
  document.getElementById('ovDangerForm').style.display = 'none';
  document.getElementById('ovDangerSuccess').classList.add('show');
  setTimeout(()=>{ cfg.exec(); }, 1200);
}

// Exposer loadData pour le module Firebase
window.loadData = loadData;

// État
// ── DEV MODE — modules en développement (visibles via DEV_EMAILS) ──
const DEV_MODULES=[]; // cave désormais disponible à tous
// GT_ADMIN_EMAIL importé depuis utils.js — source de vérité unique
const DEV_EMAILS=[GT_ADMIN_EMAIL,'gueret.nicolas@gmail.com'];
const GT_BASE_URL='https://mavigneapp.fr'; // URL production — liens d'invitation Admin GT

let currentUser=null;
let pFilter='toutes',pTacheFilter='toutes',pSearch='',pShowDone=false,jQui='tous',jTache='toutes',jSearch='',jParcelle='toutes',jDateDeb='',jDateFin='',phTab='reg',phFilter='tous';
var _pProxPos=null,_pProxHere=null,_pProxLoading=false; // tri des parcelles par proximite GPS (lecture seule)
let _jPage=0; // pagination journal (200 entrées/page)
// fCond/fAct/selEmoji — état déplacé sur window dans tracteur.js (fix v3.87)
// ════ KML INTÉGRÉ — polygones des 46 parcelles du domaine ════
// Généré depuis Domaine.kml — coordonnées [lat, lng] au format Leaflet
// ⚠️ Pour commercialisation : remplacer ce bloc par celui du client
//    (script d'extraction automatique disponible chez GUERETTECH)
const KML_DATA = _MV_IS_MG ? [
  {name:"Comble",pts:[[47.239263,4.9820081],[47.2387167,4.9817721],[47.2379518,4.9814073],[47.2368009,4.9805973],[47.2367499,4.9807367],[47.2379373,4.9815414],[47.2385965,4.9818686],[47.2392302,4.9821315],[47.239263,4.9820081]]},
  {name:"Créot",pts:[[47.2343293,4.9721301],[47.2337137,4.9719101],[47.2335425,4.9725324],[47.2341545,4.9727523],[47.2343293,4.9721301]]},
  {name:"Champerrier",pts:[[47.2313776,4.970684],[47.2313048,4.9706411],[47.2312556,4.9708395],[47.2311445,4.9707135],[47.2307893,4.9720465],[47.2308549,4.9721646],[47.2309751,4.9722343],[47.2313776,4.970684]]},
  {name:"Songe du Bas",pts:[[47.2312185,4.9706867],[47.2315317,4.9693804],[47.2314115,4.9693107],[47.2310946,4.9705928],[47.2312185,4.9706867]]},
  {name:"Songe du Haut",pts:[[47.2315099,4.969308],[47.2317958,4.9679428],[47.2316465,4.9678972],[47.2313514,4.9692141],[47.2315099,4.969308]]},
  {name:"Entre 2 routes",pts:[[47.2318286,4.9678167],[47.2318741,4.9675485],[47.2317485,4.9675002],[47.231692,4.9677818],[47.2318286,4.9678167]]},
  {name:"Champs",pts:[[47.2330157,4.9682355],[47.2333208,4.9669467],[47.2331978,4.966936],[47.2329046,4.9681725],[47.2330157,4.9682355]]},
  {name:"7 Rangs",pts:[[47.2323549,4.9664547],[47.2323184,4.9664031],[47.2320325,4.9675249],[47.232089,4.9675557],[47.2323549,4.9664547]]},
  {name:"20 Rangs",pts:[[47.2318574,4.9672733],[47.2321479,4.9661923],[47.231995,4.9661226],[47.2317063,4.9671901],[47.2318574,4.9672733]]},
  {name:"Au Velle",pts:[[47.2315169,4.9672156],[47.2318356,4.9660341],[47.2315405,4.9658436],[47.231301,4.9667636],[47.231322,4.9667784],[47.2312509,4.9670681],[47.2315169,4.9672156]]},
  {name:"Chaziere",pts:[[47.2308754,4.9677031],[47.2308117,4.9676963],[47.2305494,4.9686834],[47.2305658,4.9686888],[47.2304438,4.9691716],[47.230502,4.9691555],[47.2308754,4.9677031]]},
  {name:"Combe du Dessus",pts:[[47.2287941,4.9672309],[47.2285164,4.9679685],[47.2283625,4.9682931],[47.2282313,4.9686203],[47.228306,4.9686699],[47.2285947,4.9680141],[47.2287149,4.9677298],[47.2288752,4.9672537],[47.2287941,4.9672309]]},
  {name:"Marchais Petite",pts:[[47.2253488,4.9603543],[47.2250847,4.9604026],[47.2252031,4.9605367],[47.2253816,4.9605287],[47.2253488,4.9603543]]},
  {name:"Marchais Grande",pts:[[47.2246566,4.9609927],[47.2245237,4.96099],[47.2245018,4.9606708],[47.2243725,4.9606815],[47.2244089,4.9610168],[47.224387,4.9625162],[47.2246694,4.9626047],[47.2246566,4.9609927]]},
  {name:"Ruchottes",pts:[[47.2207787,4.9647346],[47.2208735,4.9647413],[47.2208489,4.9635625],[47.2207487,4.9635598],[47.2207787,4.9647346]]},
  {name:"Combe du Bas",pts:[[47.229127,4.9729724],[47.2286389,4.9726559],[47.2285624,4.9726559],[47.2283438,4.9725862],[47.2280597,4.9724199],[47.2277354,4.9738683],[47.2288356,4.9744369],[47.229127,4.9729724]]},
  {name:"Jouise",pts:[[47.2221878,4.9768715],[47.2226231,4.9744897],[47.2225357,4.9744655],[47.2223499,4.9744709],[47.2222825,4.9745353],[47.2220147,4.976048],[47.2222242,4.9761151],[47.2220839,4.9768313],[47.2221878,4.9768715]]},
  {name:"Carougeot",pts:[[47.2215012,4.9739793],[47.2215431,4.9737996],[47.2215613,4.9735287],[47.2217508,4.9725739],[47.2216014,4.9725631],[47.2213373,4.9738533],[47.2215012,4.9739793]]},
  {name:"Perrieres Jeune",pts:[[47.2208873,4.9714527],[47.2209657,4.9714903],[47.2211387,4.9704442],[47.2210494,4.9704308],[47.2208873,4.9714527]]},
  {name:"Perrieres Vieille",pts:[[47.2200257,4.9712328],[47.2203262,4.9698756],[47.2202315,4.9699078],[47.21994,4.9712435],[47.2200257,4.9712328]]},
  {name:"Champitenois Petite",pts:[[47.2160571,4.9723067],[47.2161191,4.9722772],[47.2163304,4.97092],[47.2162867,4.9708932],[47.2160571,4.9723067]]},
  {name:"Champitenois Grande",pts:[[47.2168788,4.9716925],[47.2170391,4.9709817],[47.2170573,4.9709308],[47.217163,4.9704158],[47.2170537,4.9703755],[47.216928,4.9703004],[47.2165727,4.971942],[47.2168788,4.9716925]]},
  {name:"Ergot",pts:[[47.2154834,4.972443],[47.2158149,4.9708471],[47.2159097,4.9708793],[47.2160991,4.9697876],[47.2159498,4.9697957],[47.2158623,4.9698011],[47.2156801,4.9707962],[47.2157202,4.9708096],[47.2153886,4.9724108],[47.2154834,4.972443]]},
  {name:"Etelois",pts:[[47.2134811,4.9725182],[47.2137216,4.9713353],[47.2138947,4.9704851],[47.2139913,4.9698494],[47.2138947,4.9698011],[47.2136506,4.9710912],[47.2133627,4.972486],[47.2134811,4.9725182]]},
  {name:"Herbiottes",pts:[[47.2013961,4.9689429],[47.2013578,4.9689187],[47.2012795,4.9694793],[47.201243,4.9694686],[47.2011519,4.9701767],[47.2012193,4.970182],[47.2013961,4.9689429]]},
  {name:"Pouroux",pts:[[47.1928457,4.9652824],[47.1926853,4.9651831],[47.1923718,4.9665162],[47.1925121,4.9665859],[47.1928457,4.9652824]]},
  {name:"Herbues",pts:[[47.1897521,4.9680945],[47.1900729,4.9666381],[47.1899835,4.9665496],[47.1898651,4.9670431],[47.1897229,4.9669895],[47.1896427,4.967306],[47.1895862,4.9672952],[47.1894458,4.9680489],[47.1897521,4.9680945]]},
  {name:"Bollery",pts:[[47.1716639,4.9628415],[47.1715965,4.9628442],[47.1715181,4.9635925],[47.1713977,4.9644132],[47.1710093,4.9665697],[47.1710804,4.9665939],[47.1714561,4.9644186],[47.1715837,4.9635898],[47.1716639,4.9628415]]},
  {name:"Bollery Blanc",pts:[[47.1714615,4.9649953],[47.1718043,4.9628683],[47.1716858,4.9628281],[47.171642,4.9631928],[47.1715582,4.9638554],[47.1714597,4.9644401],[47.1710914,4.9665912],[47.1711661,4.9666207],[47.1714615,4.9649953]]},
  {name:"Crotteaux",pts:[[47.1777236,4.9677461],[47.177359,4.9676094],[47.1772405,4.968237],[47.1774356,4.9683201],[47.177421,4.9683818],[47.1780773,4.9686474],[47.1781029,4.9685374],[47.1775669,4.9683094],[47.1777236,4.9677461]]},
  {name:"Batailles",pts:[[47.1850171,4.9706882],[47.1848494,4.9706319],[47.1846106,4.9720776],[47.1848293,4.971855],[47.1850171,4.9706882]]},
  {name:"Gravieres",pts:[[47.1873611,4.9769985],[47.1859757,4.9761027],[47.1859411,4.9762207],[47.1873009,4.9770844],[47.1873611,4.9769985]]},
  {name:"Cognées",pts:[[47.1976032,4.9716943],[47.1978402,4.9704873],[47.1977253,4.9705034],[47.197503,4.9716755],[47.1976032,4.9716943]]},
  {name:"Bras",pts:[[47.2034976,4.9719527],[47.2036233,4.9709281],[47.2034703,4.9709039],[47.2033482,4.9719151],[47.2034976,4.9719527]]},
  {name:"Pasquier des Chenes",pts:[[47.2049624,4.9773198],[47.204853,4.9772689],[47.2046253,4.9790204],[47.2043647,4.9807745],[47.204454,4.9807987],[47.2047346,4.979066],[47.2049624,4.9773198]]},
  {name:"Mansouze",pts:[[47.2101184,4.9733059],[47.2100455,4.973255],[47.2095936,4.9744029],[47.2095608,4.9744727],[47.2094096,4.9748831],[47.2094405,4.9750359],[47.2101184,4.9733059]]},
  {name:"Reniard",pts:[[47.2120787,4.9795305],[47.2124832,4.9785113],[47.2125469,4.9785381],[47.2130972,4.9771433],[47.2130134,4.9770629],[47.2120313,4.9794956],[47.2120787,4.9795305]]},
  {name:"Fourneau Vieille",pts:[[47.2141393,4.9770607],[47.2141184,4.9771475],[47.2156652,4.9781211],[47.2157025,4.9780263],[47.2141393,4.9770607]]},
  {name:"Fourneau Jeune",pts:[[47.2163651,4.9762381],[47.2148566,4.9752376],[47.2148293,4.9753234],[47.2163469,4.9763132],[47.2163651,4.9762381]]},
  {name:"Croix des Champs",pts:[[47.2225832,4.9784356],[47.2210238,4.9778187],[47.2209728,4.9779206],[47.2225649,4.9785536],[47.2225832,4.9784356]]},
  {name:"Platieres",pts:[[47.2221534,4.988201],[47.2220496,4.9881688],[47.2219476,4.9890003],[47.2216142,4.9907089],[47.2217198,4.9907518],[47.2220532,4.9890432],[47.2221534,4.988201]]},
  {name:"Crais",pts:[[47.2279117,4.9863127],[47.227919,4.9858942],[47.2267423,4.9857011],[47.2265492,4.9860713],[47.2279117,4.9863127]]},
  {name:"Billard Grande",pts:[[47.2319612,4.9807712],[47.231892,4.9802562],[47.2301945,4.9798109],[47.2302091,4.9799772],[47.2302783,4.9799987],[47.2302564,4.9800845],[47.2303766,4.9801221],[47.2303511,4.9802616],[47.2310688,4.980401],[47.2319612,4.9807712]]},
  {name:"Billard Petite",pts:[[47.2303217,4.9798269],[47.2304565,4.9781076],[47.2303254,4.9780486],[47.2301942,4.9797947],[47.2303217,4.9798269]]},
  {name:"Charreux",pts:[[47.2299338,4.9796821],[47.2301323,4.9780486],[47.2300886,4.9780352],[47.2299848,4.9788292],[47.2298299,4.9796419],[47.2299338,4.9796821]]},
  {name:"Sylvie",pts:[[47.2309191,4.9735962],[47.2308827,4.9735693],[47.230788,4.9740548],[47.2307224,4.9745859],[47.2307807,4.9745644],[47.2309191,4.9735962]]},
] : [];
var KML_POLYGONS_DYNAMIC = []; // polygones chargés depuis Firestore (remplace KML_DATA pour nouveaux clients)
window.KML_POLYGONS_DYNAMIC = KML_POLYGONS_DYNAMIC;
window.KML_DATA = KML_DATA;  // exposé pour le pilotage (carte du domaine)
let mapInit=false,leafMap=null;
var _mvMeMarker=null,_mvMapQuickNom=null; // carte = interface : marqueur GPS + parcelle tapée
let rolesTemp={ouvrier:true,tractoriste:false,saisonnier:false,pilotage:false};
let priorityMessage=''; // Message priorité admin pour onglet Parcelles
let priorityTask='';     // Tâche prioritaire admin (verrouille l'onglet Parcelles pour l'équipe)
var _prioOverride=false; // l'utilisateur a déverrouillé la priorité (session)

const COULEURS_MBR={Nico:'#3D6B27',Victor:'#1A4A7A',Dessi:'#7A4F2E',Etienne:'#5B2D8E',Chloé:'#B8913A',Chloe:'#B8913A',Shana:'#C0392B',Alicia:'#1A5276'};
window.COULEURS_MBR=COULEURS_MBR;
// TCLS / TEMJ / TEMOJI : source unique dans utils.js (exposés sur window, chargé avant app.js)

// LOGIN
let loginPendingIdx = -1;

// Couleurs avatars login — palette ardoise/or sobre
var LP_COLORS=['#2C4A3E','#3A3A5C','#4A3228','#1E3A4A','#3C2E4A','#2A4028','#4A3C1E'];

// ════════════════════════════════════
// ONBOARDING — Configuration initiale
// S'affiche uniquement si 'mavigne_tenant' absent du localStorage
// ════════════════════════════════════

const TACHES_CATALOGUE = [
  // ── Travaux OBLIGATOIRES (cycle 485 h/ha) — h/ha conseille ──
  {nom:'Taille',        label:'Taille',        hha:70,  saisons:['Hiver'],     obligatoire:true},
  {nom:'Tirage',        label:'Tirage',        hha:50,  saisons:['Hiver'],     obligatoire:true},
  {nom:'Brulage',       label:'Brûlage',       hha:40,  saisons:['Hiver'],     obligatoire:true},
  {nom:'Reparation',    label:'Réparation',    hha:45,  saisons:['Printemps'], obligatoire:true},
  {nom:'Pliage',        label:'Pliage',        hha:45,  saisons:['Printemps'], obligatoire:true},
  {nom:'Ebourgeonnage', label:'Ébourgeonnage', hha:35,  saisons:['Printemps'], type:'passages', passagesHha:[35,35], obligatoire:true},
  {nom:'Pioche',        label:'Pioche',        hha:40,  saisons:['Printemps'], type:'passages', passagesHha:[40,40], obligatoire:true},
  {nom:'Relevage',      label:'Relevage',      hha:90, saisons:['Printemps'], type:'niveaux',
    niveaux:[{num:1,hha:50},{num:2,hha:20},{num:3,hha:20}], skipRule:true, obligatoire:true},
  {nom:'Accolage',      label:'Accolage',      hha:45,  saisons:['Printemps'], obligatoire:true},
  {nom:'Palissage',     label:'Palissage',     hha:30,  saisons:['Printemps'], obligatoire:true},
  // Entreplantation : pilotee par les trous de tariere (temps = trous x min/trou)
  {nom:'Entreplantation', label:'Entreplantation', anytime:true, trous:true, minTrou:3, obligatoire:true},
  // ── Travaux COMPLEMENTAIRES (temps reel, hors bareme) ──
  {nom:'Plantation',    label:'Plantation (parcelle neuve)', hha:15, saisons:['Hiver','Printemps'], tempsReel:true, complementaire:true, obligatoire:false},
  {nom:'Arrachage',     label:'Arrachage',        anytime:true, tempsReel:true, complementaire:true, obligatoire:false},
  {nom:'Desherbage',    label:'Désherbage manuel', anytime:true, tempsReel:true, complementaire:true, obligatoire:false},
  {nom:'Effeuillage',   label:'Effeuillage',      anytime:true, tempsReel:true, complementaire:true, obligatoire:false},
  {nom:'Vendange',      label:'Vendange',         anytime:true, tempsReel:true, complementaire:true, obligatoire:false},
];

// ════════════════════════════════════════════════════════════════════
// BARÈMES RÉGIONAUX
// ────────────────────────────────────────────────────────────────────
// TACHES_CATALOGUE ci-dessus décrit la NATURE des travaux (nom, type, saisons,
// obligatoire, temps réel, tarière) et porte les heures de la Côte de Nuits. Ces heures
// sont une constante RÉGIONALE : hors de Bourgogne elles sont fausses, et pas d'un peu.
//
// Un barème régional est donc un CALQUE : il ne redéfinit que des heures, jamais la
// structure. Ajouter une région = ajouter une entrée ici, rien d'autre. Les travaux
// qu'un barème ne prévoit pas restent sans valeur conseillée — mieux vaut ne rien dire
// que dire faux.
//
// ⚠️ CONVENTION : toutes les valeurs sont exprimées en h/ha À 10 000 PIEDS/HA, y compris
// celles issues de textes qui comptent aux 1 000 pieds. La densité réelle du domaine
// s'applique ENSUITE (window._mvHhaDens). Les deux réglages sont indépendants et se
// composent : un girondin choisit son barème PUIS ses écartements.
//
// ⚠️ L'application est INFORMATIVE. Ces chiffres sont des références datées et sourcées,
// pas un texte opposable : le vigneron reste libre de ses valeurs, et les accords
// évoluent. Vérifier la source avant de s'en servir pour un contrat de travail.
const MV_BAREMES = {
  'cote-nuits': {
    label:  'Bourgogne \u2014 C\u00f4te-d\u2019Or, Ni\u00e8vre, Yonne',
    court:  'Bourgogne',
    source: 'Accord du 2 octobre 2023 relatif au travail \u00e0 la t\u00e2che en viticulture',
    note:   'Vigne basse, 10 000 pieds/ha. Barème de référence de l\u2019application.',
    hha: null, passages: null, niveaux: null   // null = le catalogue tel quel
  },
  'gironde': {
    label:  'Gironde \u2014 hors M\u00e9doc, guyot simple',
    court:  'Gironde',
    source: 'Avenant n\u00b0 12 du 30 juin 2021, CC Gironde (IDCC 9331), art. 89',
    note:   'Temps exprim\u00e9s aux 1 000 pieds dans le texte, ramen\u00e9s ici \u00e0 10 000 pieds/ha. '
          + 'Le M\u00e9doc, le guyot double et les vignes de plus de 20 ans ont leurs propres temps.',
    hha: { Taille:95, Tirage:60, Brulage:20, Reparation:25, Pliage:55 },
    passages: { Ebourgeonnage:[45,25], Pioche:[50,30] },
    niveaux:  { Relevage:[25,55,15] }
  }
};
window.MV_BAREMES = MV_BAREMES;

// Clé du barème choisi par le domaine. Repli sur la Côte de Nuits : une clé inconnue
// (barème retiré, faute de frappe) ne doit jamais vider les heures conseillées.
window._mvBaremeActif = function(){
  var k = (window.CONFIG && window.CONFIG.bareme) || 'cote-nuits';
  return MV_BAREMES[k] ? k : 'cote-nuits';
};

// Entrée du catalogue vue à travers le barème régional actif.
// Renvoie TOUJOURS un objet — jamais null — pour ne casser aucun appelant.
//   _regional : true  → les heures viennent du barème régional
//   _horsBareme : true → ce barème ne prévoit rien pour ce travail (saisie libre)
window._mvBaremeRef = function(cat){
  if(!cat) return cat;
  var B = MV_BAREMES[window._mvBaremeActif()];
  if(!B || (!B.hha && !B.passages && !B.niveaux)) return cat;   // Côte de Nuits
  if(cat.trous || cat.tempsReel) return cat;                    // hors barème horaire
  var h  = B.hha      && B.hha[cat.nom];
  var pa = B.passages && B.passages[cat.nom];
  var ni = B.niveaux  && B.niveaux[cat.nom];
  if(h==null && !pa && !ni) return Object.assign({}, cat, {_horsBareme:true});
  var r = Object.assign({}, cat, {_regional:true});
  if(pa){ r.passagesHha = pa.slice(); r.hha = pa[0]; }
  else if(ni){ r.niveaux = ni.map(function(x,i){return {num:i+1, hha:x};}); r.hha = ni.reduce(function(s,x){return s+x;},0); }
  else { r.hha = h; }
  return r;
};


// Référence conventionnelle d'une tâche du domaine.
// Le rattachement EXPLICITE (t.conv) prime sur la correspondance par le nom : une tâche
// créée avant cette option (« Taille douce ») peut ainsi pointer vers le travail
// conventionnel correspondant. Rattacher est une RÉFÉRENCE, jamais une fusion — la tâche
// garde son nom, ses saisons et ses h/ha propres.
// Un t.conv orphelin (catalogue modifié) retombe proprement sur la recherche par nom.
function _tacheConvRef(t){
  if(!t) return null;
  var cat = window.TACHES_CATALOGUE || TACHES_CATALOGUE || [];
  if(t.conv){
    var byConv = cat.find(function(c){return c.nom===t.conv;});
    if(byConv) return byConv;
  }
  return cat.find(function(c){return c.nom===t.nom;}) || null;
}
window._tacheConvRef = _tacheConvRef;

// h/ha pour un passage donné (utilise passagesHha si défini)
function _getPassHha(tDef, passNum) {
  if(tDef&&tDef.passagesHha&&tDef.passagesHha[passNum-1]!=null) return tDef.passagesHha[passNum-1];
  return (tDef&&tDef.hha)||0;
}


// Normalise TACHES : tâches standards toujours présentes, vieux noms retirés
function _normalizeTaches(fbTaches) {
  var REMOVE_NOMS = ['Ebourgeonnage1','Pioche1','Relevage 2','Relevage1'];
  var standardNoms = TACHES_CATALOGUE.map(function(t){return t.nom;});
  function _seed(t){
    var r = {nom:t.nom};
    if(t.saisons) r.saisons = t.saisons.slice();
    if(t.anytime) r.anytime = true;
    if(t.trous){ r.trous = true; if(t.minTrou) r.minTrou = t.minTrou; }
    else r.hha = t.hha;
    if(t.tempsReel) r.tempsReel = true;
    if(t.complementaire) r.complementaire = true;
    if(t.type)    r.type    = t.type;
    if(t.niveaux) r.niveaux = t.niveaux;
    if(t.passagesHha) r.passagesHha = t.passagesHha;
    if(t.skipRule)r.skipRule= t.skipRule;
    return r;
  }
  // Premier install (pas de donnees) -> seulement les travaux obligatoires (cycle + entreplantation)
  if (!fbTaches || fbTaches.length === 0) {
    return TACHES_CATALOGUE.filter(function(c){return c.obligatoire;}).map(_seed);
  }
  // Donnees existantes : nettoyer anciens noms, migrer saison->saisons, enrichir, garder les custom
  var cleaned = (fbTaches||[]).filter(function(t){ return !REMOVE_NOMS.includes(t.nom); });
  var mapped = cleaned.map(function(t){
    // Migration : ancienne tache 'Plantation' pilotee par trous -> 'Entreplantation'
    if ((t.nom==='Plantation' || t.nom==='Complantation') && !t.tempsReel && !t.complementaire) {
      var rc = {nom:'Entreplantation', anytime:true, trous:true};
      if(t.minTrou) rc.minTrou = t.minTrou;
      return rc;
    }
    if (standardNoms.includes(t.nom)) {
      var cat = TACHES_CATALOGUE.find(function(c){return c.nom===t.nom;});
      if (cat) {
        // On PART de l'entree du domaine : tout champ qu'elle porte survit. L'objet etait
        // auparavant reconstruit champ par champ, donc tout champ absent de la liste
        // ci-dessous disparaissait AU CHARGEMENT, sans erreur, puis etait efface en base
        // au premier saveData('taches'). Une tache CUSTOM, elle, conservait deja tout
        // (Object.assign plus bas) : cette asymetrie n'avait aucune raison d'etre.
        // Seuls les champs ci-dessous sont imposes par le catalogue — la NATURE du
        // travail. Le reste appartient au domaine.
        var r = Object.assign({}, t);
        delete r.saison; // legacy : migre vers saisons
        r.nom = cat.nom;
        // saisons : preserver si deja migre, sinon deriver de t.saison, sinon catalogue
        if(t.saisons && t.saisons.length){ r.saisons = t.saisons.slice(); delete r.anytime; }
        else if(t.anytime){ r.anytime = true; delete r.saisons; }
        else if(t.saison){ r.saisons = [t.saison]; delete r.anytime; }
        else if(cat.anytime){ r.anytime = true; delete r.saisons; }
        else if(cat.saisons){ r.saisons = cat.saisons.slice(); delete r.anytime; }
        // type d'heures
        if(cat.trous){ r.trous = true; delete r.hha; if(t.minTrou) r.minTrou = t.minTrou; else delete r.minTrou; }
        else { delete r.trous; delete r.minTrou; r.hha = (t.hha!=null ? t.hha : cat.hha); }
        if(cat.tempsReel) r.tempsReel = true; else delete r.tempsReel;
        if(cat.complementaire) r.complementaire = true; else delete r.complementaire;
        if(cat.type)    r.type    = cat.type; else delete r.type;
        if(t.niveaux&&t.niveaux.length) r.niveaux = t.niveaux;
        else if(cat.niveaux) r.niveaux = cat.niveaux;
        else delete r.niveaux;
        if(t.passagesHha&&t.passagesHha.length) r.passagesHha = t.passagesHha;
        else if(cat.passagesHha) r.passagesHha = cat.passagesHha;
        else delete r.passagesHha;
        if(cat.skipRule)r.skipRule= cat.skipRule; else delete r.skipRule;
        return r;
      }
    }
    // custom / non-standard : migrer saison->saisons, garder le reste
    var rr = Object.assign({},t);
    if(!(rr.saisons && rr.saisons.length) && !rr.anytime && rr.saison) rr.saisons = [rr.saison];
    delete rr.saison;
    return rr;
  });
  // dedup par nom (evite un double 'Entreplantation' lors d'une migration partielle)
  var seen={}, out=[];
  mapped.forEach(function(t){ if(t&&t.nom&&!seen[t.nom]){ seen[t.nom]=1; out.push(t); } });
  return out;
}



function initLogin(){
  if(window.initGTLoginTap) window.initGTLoginTap();

  // ── Démo visite guidée : accès libre sans code (lien public ?demo=visite) ──
  if(sessionStorage.getItem('mavigne_demo_visite')==='1'){ _startDemoVisite(); return; }

  // ── Tenant démo : écran code d'accès ────────────────────────────────
  var _tenantActuel = localStorage.getItem('mavigne_tenant') || '';
  if(DEBUG) console.log('[initLogin] tenant=', _tenantActuel, ' demo=', _tenantActuel === 'domaine-dupont');
  if(_tenantActuel === 'domaine-dupont'){
    _initLoginDemo();
    return;
  }
  // ────────────────────────────────────────────────────────────

  var profiles = document.getElementById('login-profiles');
  profiles.innerHTML = '';

  // ── Si MEMBRES vide : Firebase pas encore chargé → loader + retry infini ──
  if(!MEMBRES || MEMBRES.length === 0){
    if(!window._loginRetryCount) window._loginRetryCount = 0;
    window._loginRetryCount++;
    var _tenant = localStorage.getItem('mavigne_tenant') || '(absent)';
    profiles.style.display = 'block';
    profiles.innerHTML = '<div style="text-align:center;padding:40px 20px;color:rgba(255,255,255,0.4);font-family:Outfit,sans-serif;font-size:13px;letter-spacing:.08em">'
      + '<div style="font-size:28px;margin-bottom:12px;animation:spin 1.2s linear infinite;display:inline-block">⏳</div>'
      + '<div>Chargement… (' + window._loginRetryCount + ')</div>'
      + '<div style="margin-top:8px;font-size:10px;opacity:.5">tenant: ' + _tenant + '</div>'
      + (window._loginRetryCount >= 4 ? '<div style="margin-top:16px;font-size:11px;color:var(--rouge,#E74C3C)">Firebase lent — vérifie ta connexion.</div>' : '')
      + '</div>';
    console.warn('[initLogin] MEMBRES vide — retry', window._loginRetryCount, '— tenant:', _tenant);
    var _delays = [1500, 2000, 3000, 5000];
    var _delay = _delays[Math.min(window._loginRetryCount - 1, _delays.length - 1)];
    setTimeout(initLogin, _delay);
    return;
  }
  window._loginRetryCount = 0;

  profiles.style.display = '';
  for(var i=0; i<MEMBRES.length; i++){
    (function(idx){
      var m = MEMBRES[idx];
      if(m && m.statut==='Inactif') return; // ancien salarie : pas d'acces appli, masque du choix de profil
      var col = LP_COLORS[idx % LP_COLORS.length];
      var btn = document.createElement('div');
      btn.className = 'lp-btn';
      var avaDiv = document.createElement('div');
      avaDiv.className = 'lp-avatar';
      avaDiv.style.background = col;
      avaDiv.textContent = m.nom.charAt(0).toUpperCase();
      var nameDiv = document.createElement('div');
      nameDiv.className = 'lp-name';
      nameDiv.textContent = m.nom;
      var roleDiv = document.createElement('div');
      roleDiv.className = 'lp-role';
      roleDiv.textContent = getRoleLabel(m.roles);
      btn.appendChild(avaDiv);
      btn.appendChild(nameDiv);
      btn.appendChild(roleDiv);
      btn.addEventListener('click', function(){ selectProfile(idx); });
      profiles.appendChild(btn);
    })(i);
  }
}

// ════ FONCTIONS TENANT DÉMO ═══════════════════════════════════════════

var _demoCodeVerified = null;

function _initLoginDemo(){
  var banner = document.getElementById('demo-banner');
  if(banner) banner.style.display = 'flex';
  var profiles = document.getElementById('login-profiles');
  if(!profiles) return;
  profiles.style.display = 'block';
  profiles.innerHTML =
    '<div style="text-align:center;margin-bottom:20px">'
    +'<div style="font-size:28px;margin-bottom:8px">&#127815;</div>'
    +'<div style="font-family:Cormorant Garamond,serif;font-size:18px;font-weight:600;color:var(--or);margin-bottom:4px">Accès démo</div>'
    +'<div style="font-size:12px;color:var(--texte-doux);line-height:1.5">Entrez le code reçu par téléphone</div>'
    +'</div>'
    +'<div style="margin-bottom:14px">'
    +'<div style="font-size:11px;font-weight:600;color:var(--texte-doux);margin-bottom:6px;letter-spacing:.06em">CODE D&#39;ACCÈS</div>'
    +'<input id="demo-code-input" type="text" placeholder="ESSAI-XX-XXXX"'
    +' style="width:100%;background:rgba(184,145,58,0.08);border:1.5px solid rgba(184,145,58,0.3);border-radius:12px;'
    +'padding:13px 16px;font-family:monospace;font-size:16px;color:var(--or);text-align:center;'
    +'letter-spacing:.1em;text-transform:uppercase;box-sizing:border-box"'
    +' oninput="this.value=this.value.toUpperCase()"'
    +' onkeydown="if(event.keyCode===13)confirmDemoCode()">'
    +'</div>'
    +'<div id="demo-code-error" style="display:none;background:rgba(224,112,96,0.12);border:1px solid rgba(224,112,96,0.3);border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#E07060;text-align:center"></div>'
    +'<button onclick="confirmDemoCode()" style="width:100%;background:var(--or);color:#0C1A0A;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:Outfit,sans-serif">Accéder à la démo</button>'
    +'<div style="text-align:center;margin-top:14px;font-size:11px;color:var(--texte-doux)">Code valable 30 jours &middot; <a href="tel:+33699424859" style="color:var(--or);text-decoration:none">06 99 42 48 59</a></div>';
}

async function confirmDemoCode(){
  var codeEl = document.getElementById('demo-code-input');
  var errEl  = document.getElementById('demo-code-error');
  if(!codeEl) return;
  var code = codeEl.value.trim().toUpperCase();
  if(!code){ if(errEl){errEl.style.display='block';errEl.textContent='Saisissez votre code d\'accès.';} return; }
  if(errEl) errEl.style.display='none';
  codeEl.disabled = true;
  try {
    // Lot 5 : validation serveur (Cloud Function) — les codes ne sont plus lisibles côté client
    var check = null;
    try { check = await window.fbCallFn('checkTrialToken', { code: code }); } catch(_e) { check = null; }
    if(!check || !check.ok){
      var msg = (check && check.reason==='throttled')
        ? 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
        : (check && check.reason==='expired')
        ? 'Période d\'essai expirée. Contactez le 06 99 42 48 59.'
        : (check ? 'Code invalide. Vérifiez ou contactez GUERETTECH.' : 'Erreur de connexion. Réessayez.');
      if(errEl){errEl.style.display='block';errEl.textContent=msg;}
      codeEl.disabled=false;
      return;
    }
    var ok = window.fbLoginDemo ? await window.fbLoginDemo(DEMO_FIREBASE_EMAIL, DEMO_FIREBASE_PWD) : false;
    if(!ok){ if(errEl){errEl.style.display='block';errEl.textContent='Erreur de connexion. Réessayez.';} codeEl.disabled=false; return; }
    _demoCodeVerified = code;
    _showDemoProfiles();
  } catch(e) {
    if(errEl){errEl.style.display='block';errEl.textContent='Erreur inattendue. Réessayez.';}
    codeEl.disabled=false;
  }
}

function _showDemoProfiles(){
  var profiles = document.getElementById('login-profiles');
  if(!profiles) return;
  window._demoProfils = [
    {nom:'Admin',      roles:['admin','ouvrier','tractoriste'], couleur:'#3D6B27', desc:'Accès complet'},
    {nom:'Tractoriste',roles:['ouvrier','tractoriste'],         couleur:'#1A4A7A', desc:'Tracteur + Vigne'},
    {nom:'Ouvrier',    roles:['ouvrier'],                       couleur:'#5B2D8E', desc:'Journal + Parcelles'}
  ];
  // Définir la fonction globale AVANT de créer les éléments
  window._demoGo = function(idx){
    var p = window._demoProfils && window._demoProfils[idx];
    if(!p){ showToast('Erreur profil introuvable','#E07B2A'); return; }
    try {
      currentUser = { nom:p.nom, roles:p.roles, email:DEMO_FIREBASE_EMAIL, _isDemo:true };
      window.currentUser = currentUser;
      // Cacher le login-screen (position:fixed z-index:9999) — même chose que confirmLogin()
      var ls = document.getElementById('login-screen');
      if(ls) ls.style.display = 'none';
      if(_demoCodeVerified && window.fbCallFn) window.fbCallFn('logTrialAccess',{code:_demoCodeVerified,action:p.nom}).catch(function(){});
      if(_demoCodeVerified && window.agtUpdateEssaiAccess) window.agtUpdateEssaiAccess(_demoCodeVerified).catch(function(){});
      applyRoles();
      goHub();
      // Charger toutes les données + marquer _dataReady (comme confirmLogin)
      var _doAfterLoad = function(){
        window._dataReady = true;
        // Forcer le nom du domaine démo (le config Firestore a le nom du domaine réel)
        window.DOMAINE_NOM = 'Domaine des Grandes Vignes';
        if(typeof applyDomNom === 'function') applyDomNom();
        var pid = (document.querySelector('.page.active')||{}).id || '';
        if(pid === 'page-hub') goHub();
        if(pid === 'page-reglages' && window.renderReglages) window.renderReglages();
      };
      if(window._authReady) {
        // _fbLoadAfterAuth déjà terminé (appel depuis onAuthStateChanged)
        _doAfterLoad();
      } else if(window._fbLoadAfterAuth) {
        window._fbLoadAfterAuth().then(_doAfterLoad).catch(function(){ window._dataReady = true; });
      } else {
        window._dataReady = true;
      }
    } catch(e){
      showToast('Accès démo : ' + (e.message||'erreur'), '#E07B2A');
      console.error('[Demo] _demoGo erreur:', e);
    }
  };
  // Construire les cartes via createElement
  profiles.innerHTML =
    '<div style="text-align:center;margin-bottom:18px">'
    +'<div style="font-size:14px;font-weight:500;color:var(--or)">Bienvenue sur la démo</div>'
    +'<div style="font-size:12px;color:var(--texte-doux);margin-top:4px">Choisissez un rôle à explorer</div>'
    +'</div>'
    +'<div id="_dpl"></div>'
    +'<div style="text-align:center;margin-top:10px;font-size:10px;color:rgba(255,255,255,0.15)">Essai 15 jours</div>';
  var dl = document.getElementById('_dpl');
  window._demoProfils.forEach(function(p, idx){
    var r=parseInt(p.couleur.slice(1,3),16),g=parseInt(p.couleur.slice(3,5),16),b=parseInt(p.couleur.slice(5,7),16);
    var card = document.createElement('div');
    card.style.cssText = 'display:flex;align-items:center;gap:12px;background:rgba('+r+','+g+','+b+',0.1);border:1px solid rgba('+r+','+g+','+b+',0.25);border-radius:12px;padding:12px 14px;cursor:pointer;margin-bottom:10px;user-select:none;-webkit-tap-highlight-color:transparent';
    var av = document.createElement('div');
    av.style.cssText = 'width:38px;height:38px;border-radius:50%;background:'+p.couleur+';display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#fff;flex-shrink:0;pointer-events:none';
    av.textContent = p.nom.charAt(0);
    var info = document.createElement('div');
    info.style.cssText = 'pointer-events:none';
    var nm = document.createElement('div');
    nm.style.cssText = 'font-size:13px;font-weight:600;color:var(--texte)';
    nm.textContent = p.nom;
    var ds = document.createElement('div');
    ds.style.cssText = 'font-size:11px;color:var(--texte-doux)';
    ds.textContent = p.desc;
    info.appendChild(nm);
    info.appendChild(ds);
    card.appendChild(av);
    card.appendChild(info);
    // onclick direct sur la propriété (pas addEventListener)
    card.onclick = (function(i){ return function(){ window._demoGo(i); }; })(idx);
    dl.appendChild(card);
  });
}


// ════════════════════════════════════════════════════════════════════
// VISITE GUIDÉE — démo accessible sans code (lien public ?demo=visite)
// Écran de bienvenue + parcours narratif scénarisé (journée au domaine),
// thème clair, données de démo contrôlées (météo, priorité, délai de rentrée).
// Auto-login bac à sable (domaine-dupont, aucune écriture).
// ════════════════════════════════════════════════════════════════════
async function _startDemoVisite(){
  try { sessionStorage.removeItem('mavigne_demo_visite'); } catch(e){}
  window._visiteFakeWx = 1; // neutralise le fetch météo réel dès maintenant (météo scénarisée)
  // v5.58 : les caches météo ne sont PAS rattachés à un domaine. La visite y écrivait sa
  // météo inventée et ne les nettoyait jamais — de retour sur son vrai domaine, le client
  // héritait d'une journée qui n'a jamais eu lieu. Elle n'écrit plus rien, et efface ce
  // qu'elle trouve en entrant.
  try{ localStorage.removeItem('mavigne_meteocom_cache'); localStorage.removeItem('mavigne_meteo5_cache'); localStorage.removeItem('mavigne_meteohr_cache'); }catch(e){}
  // Démo en thème clair (pas sombre / pas auto) — c'est la 1re impression
  var _ar=document.getElementById('app-root'); if(_ar) _ar.setAttribute('data-theme','light');
  // Compteur GT admin : connexions + visiteurs uniques (id anonyme localStorage, best-effort)
  try {
    var _vid = localStorage.getItem('mavigne_visite_id');
    if(!_vid){ _vid = 'v'+Date.now().toString(36)+Math.random().toString(36).slice(2,9); localStorage.setItem('mavigne_visite_id', _vid); }
    if(window.fbCallFn) window.fbCallFn('logVisite', { mode:'visite', vid:_vid }).catch(function(){});
  } catch(e){}
  var ok = window.fbLoginDemo ? await window.fbLoginDemo(DEMO_FIREBASE_EMAIL, DEMO_FIREBASE_PWD) : false;
  if(!ok){ if(DEBUG) console.warn('[Visite] login démo échoué → écran code'); _initLoginDemo(); return; }
  currentUser = { nom:'Visiteur', roles:['admin','ouvrier','tractoriste'], email:DEMO_FIREBASE_EMAIL, _isDemo:true, _isVisite:true };
  window.currentUser = currentUser;
  var ls = document.getElementById('login-screen'); if(ls) ls.style.display='none';
  try{ applyRoles(); }catch(e){}
  var _go = function(){
    window._dataReady = true;
    window.DOMAINE_NOM = 'Domaine des Grandes Vignes';
    if(typeof applyDomNom==='function'){ try{ applyDomNom(); }catch(e){} }
    var _ar2=document.getElementById('app-root'); if(_ar2) _ar2.setAttribute('data-theme','light');
    try{ _visiteScenario(); }catch(e){ if(DEBUG)console.error('[Visite scénario]',e); }
    goTo('home');
    setTimeout(function(){ try{ _mvtWelcome(); }catch(e){ if(DEBUG)console.error('[Visite]',e); } }, 550);
  };
  if(window._authReady){ _go(); }
  else if(window._fbLoadAfterAuth){ window._fbLoadAfterAuth().then(_go).catch(function(){ _go(); }); }
  else { setTimeout(_go, 450); }
}
window._startDemoVisite = _startDemoVisite;

// ── Données de démo scénarisées (en mémoire — bac à sable, aucune écriture) ──
function _visiteScenario(){
  var now=new Date();
  function _p2(n){ return (n<10?'0':'')+n; }
  function _isoH(dt){ return dt.getFullYear()+'-'+_p2(dt.getMonth()+1)+'-'+_p2(dt.getDate())+'T'+_p2(dt.getHours())+':00'; }
  function _isoD(dt){ return dt.getFullYear()+'-'+_p2(dt.getMonth()+1)+'-'+_p2(dt.getDate()); }
  function _daysAgo(n){ var d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-n); return _isoD(d); }
  var _ap=function(k,v){ try{ if(window.applyFbData) window.applyFbData(k,v); }catch(e){} };

  // 1) Météo scénarisée 5 jours : 0 auj favorable · 1 demain favorable · 2 pluie · 3 vent · 4 favorable
  var time=[],temp=[],precip=[],wind=[],dT=[],dC=[],dmin=[],dmax=[],dpp=[];
  for(var d=0; d<5; d++){
    var base=new Date(now.getFullYear(),now.getMonth(),now.getDate()+d);
    dT.push(_isoD(base));
    if(d===2){ dC.push(61); dmin.push(11); dmax.push(14); dpp.push(85); }
    else if(d===3){ dC.push(3); dmin.push(10); dmax.push(16); dpp.push(20); }
    else { dC.push(d===0?1:(d===4?0:2)); dmin.push(10+d); dmax.push(17+(d%3)); dpp.push(5); }
    for(var h=0; h<24; h++){
      var dt=new Date(base); dt.setHours(h,0,0,0);
      time.push(_isoH(dt));
      var t,p,w;
      if(d===2){ t=13; p=(h>=8&&h<=18)?0.9:0.1; w=11; }
      else if(d===3){ t=16; p=0; w=(h>=9&&h<=19)?27:13; }
      else { t=(h<7||h>20)?12:17; p=0; w=9; }
      temp.push(t); precip.push(p); wind.push(w);
    }
  }
  window.METEO_HOURLY={time:time,temp:temp,precip:precip,wind:wind};
  window.METEO_DAILY={time:dT,code:dC,tmin:dmin,tmax:dmax,pp:dpp};
  // v5.58 : PAS d'écriture localStorage — window.METEO_* suffit au rendu de la visite,
  // et ces clés survivraient à la visite pour être relues sur le vrai domaine.
  try{ meteoData={temp:17,desc:'Ensoleill\u00e9',wind:9,emoji:'\u2600\uFE0F',date:_isoD(now)}; window.meteoData=meteoData; }catch(e){}

  // 2) Domaine sur 3 communes -> météo par secteur (hook personnalisé)
  var _COMM=[
    {nom:'Gevrey-Chambertin', lat:47.2262, lng:4.9672},
    {nom:'Brochon',           lat:47.2434, lng:4.9613},
    {nom:'Fixin',             lat:47.2531, lng:4.9576}
  ];
  try{
    (window.PARCELLES||[]).forEach(function(p,i){
      if(!p||p.statut==='Arrachee') return;
      var c=_COMM[i % _COMM.length];
      p.commune={nom:c.nom, lat:c.lat, lng:c.lng};
      p.lat=c.lat + ((i%3)-1)*0.0035;
      p.lng=c.lng + (((i+1)%3)-1)*0.0045;
    });
  }catch(e){}
  // Météo par secteur PRÉ-CALCULÉE (sinon le rendu déclencherait un appel réseau réel)
  try{
    window._domaineCommuneNom='Gevrey-Chambertin';
    var _wx=function(code,tp,wd,tn,tx,pp){ return {temp:tp,code:code,wind:wd,tmin:tn,tmax:tx,pp:pp,emoji:wmoEmoji(code),desc:wmoDesc(code)}; };
    var _grp=(window._communesActives?window._communesActives():[]);
    var _byNom={
      'Gevrey-Chambertin':_wx(1,18,8,11,21,5),
      'Brochon':_wx(2,17,12,10,20,15),
      'Fixin':_wx(61,15,14,10,17,60)
    };
    var _store={};
    _grp.forEach(function(g){ var w=_byNom[g.nom]||_wx(1,17,9,11,20,5); _store[g.key]={nom:g.nom,nbParc:g.nbParc,lat:g.lat,lng:g.lng,wx:w}; });
    window.METEO_PAR_COMMUNE=_store;
    window._MV_WXCOM_TS=Date.now();   // v5.58 : en mémoire seulement, jamais dans localStorage
  }catch(e){}

  // 3) Priorité diffusée + équipe + avancement réaliste (~45%)
  var _ts=(typeof getTachesSaison==='function')?getTachesSaison():[];
  var _tache=_ts.some(function(t){return t.nom==='Ebourgeonnage';})?'Ebourgeonnage':(_ts.length?_ts[0].nom:'Ebourgeonnage');
  window._visiteTache=_tache;
  try{ priorityTask=_tache; window.priorityTask=_tache; }catch(e){}
  try{ priorityMessage='Priorit\u00e9 du jour \u2014 '+_tache.toLowerCase()+' (secteur Gevrey-bas)'; window.priorityMessage=priorityMessage; }catch(e){}
  try{ pTacheFilter=_tache; }catch(e){}
  try{
    var _me=(currentUser&&currentUser.nom)||'';
    var _mem=(MEMBRES||[]).filter(function(m){ return m && m.nom && m.nom!==_me && m.statut!=='Inactif'; }).map(function(m){ return m.nom; });
    if(_mem.length) _eqtSet(_tache, _mem.slice(0,3));
  }catch(e){}
  try{
    var _actP=(PARCELLES||[]).filter(function(p){ return p && p.statut!=='Arrachee'; });
    var _totS=_actP.reduce(function(s,p){ return s+(+p.surface||0); },0), _cumS=0;
    _actP.forEach(function(p){ if(!p.taches)p.taches={}; if(_cumS < _totS*0.45){ p.taches[_tache]={ov:null,p1:'Valid\u00e9',p2:'Valid\u00e9'}; _cumS+=(+p.surface||0); } });
    if(typeof recalcTravaux==='function') recalcTravaux(_tache);
  }catch(e){}
  window._visiteDrae={};
  try{ var _tnp=(localStorage.getItem('mavigne_tenant')||'domaine-dupont'); localStorage.setItem('mavigne_pil_tab_'+_tnp,'auj'); }catch(e){}

  // 4) Conducteurs + activités (objets : sinon .nom indéfini)
  _ap('conducteurs',[{nom:'Marie',statut:'actif'},{nom:'Jean',statut:'actif'},{nom:'Paul',statut:'actif'}]);
  _ap('activites',[
    {nom:'Griffage',  emoji:'\uD83C\uDF3E', tracteurDefautId:'trac1', champCustom:null},
    {nom:'Buttage',   emoji:'\u26F0\uFE0F', tracteurDefautId:'trac1', champCustom:null},
    {nom:'Intercep',  emoji:'\uD83E\uDE9A', tracteurDefautId:'trac2', champCustom:null},
    {nom:'Traitement',emoji:'\uD83D\uDCA7', tracteurDefautId:'trac2', champCustom:null},
    {nom:'Broyage',   emoji:'\uD83C\uDF3F', tracteurDefautId:'trac1', champCustom:null}
  ]);

  // 5) Tracteurs (compteur + prochaine révision = alerte)
  _ap('tracteurs_list',[
    {id:'trac1',nom:'New Holland T4.90F', modele:'T4.90F', type:'m\u00e9canique',    traitementOnly:false, compteur_h:482, revision_h:500},
    {id:'trac2',nom:'Enjambeur Bobard',   modele:'1054',   type:'hydrostatique',traitementOnly:false, compteur_h:1180, revision_h:1400}
  ]);
  // Cuve GNR basse (alerte) — lue depuis CONFIG.gnr
  try{ window.CONFIG=window.CONFIG||{}; window.CONFIG.gnr={capacite:1000, niveau:255, seuil:300, maj:_daysAgo(2)}; window.CONFIG.features=Object.assign({}, window.CONFIG.features||{}, {cave:true}); }catch(e){}

  // 6) Sessions tracteur (terminées + en cours)
  var _sn=((window.SAISONS||[]).find(function(s){return s&&s.active;})||{}).nom||'Printemps 2026';
  _ap('sessions',[
    {id:'sess1', saison:_sn, activite:'Intercep', date:_daysAgo(1), conducteur:'Jean', statut:'Termin\u00e9', avancement:100, parcellesFaites:['Les Charmes','La Combotte','Les Perri\u00e8res'], tracteurId:'trac2', tracteurOverride:false, note:'', dateFin:_daysAgo(1)},
    {id:'sess2', saison:_sn, activite:'Griffage', date:_daysAgo(3), conducteur:'Paul', statut:'Termin\u00e9', avancement:100, parcellesFaites:['Clos du Moulin','Champ de la Croix'], tracteurId:'trac1', tracteurOverride:false, note:'', dateFin:_daysAgo(3)},
    {id:'sess3', saison:_sn, activite:'Broyage', date:_isoD(now), conducteur:'Marie', statut:'En cours', avancement:40, parcellesFaites:['Vieilles Vignes'], tracteurId:'trac1', tracteurOverride:false, note:'Inter-rangs'}
  ]);

  // 7) Entretiens (pleins + anomalie)
  _ap('entretiens',[
    {id:'ent1', tracteurId:'trac1', date:_daysAgo(2), conducteur:'Jean', anomalie:'', anomalie_traitee:false, plein:true, huile:true, filtre_air:false, radiateur:false, pression_pneu:true, lavage:false, litres_plein:45},
    {id:'ent2', tracteurId:'trac2', date:_daysAgo(6), conducteur:'Paul', anomalie:'L\u00e9ger jeu direction', anomalie_traitee:true, plein:true, huile:false, filtre_air:true, radiateur:false, pression_pneu:false, lavage:true},
    {id:'ent3', tracteurId:'trac1', date:_daysAgo(9), conducteur:'Marie', anomalie:'', anomalie_traitee:false, plein:false, huile:true, filtre_air:false, radiateur:true, pression_pneu:false, lavage:false}
  ]);

  // 8) Catalogue phyto + registre (champs E-Phy)
  _ap('catalogue',[
    {nom:'Bouillie bordelaise RSR', type:'Cuivre',     amm:'2020047', dar:21, drae:6,  znt:5,  dose:'1,5 kg/ha', cible:'Mildiou', usage:'Max 4 kg Cu/ha/an.', source:'mine'},
    {nom:'Soufre mouillable',       type:'Soufre',     amm:'9000287', dar:0,  drae:24, znt:5,  dose:'8 kg/ha',   cible:'O\u00efdium',  usage:'\u00c0 \u00e9viter par forte chaleur.', source:'mine'},
    {nom:'Profiler',                type:'Fongicide',  amm:'2090093', dar:28, drae:48, znt:5,  dose:'2,5 kg/ha', cible:'Mildiou', usage:'3 applications max/an.', source:'mine'},
    {nom:'Pyr\u00e9vert',          type:'Insecticide',amm:'2100403', dar:3,  drae:48, znt:20, dose:'1,25 L/ha', cible:'Cicadelle', usage:'ZNT 20 m \u2014 anti-d\u00e9rive requis.', source:'mine'},
    {nom:'Vacciplant',              type:'Biocontr\u00f4le',amm:'2150016', dar:0, drae:6, znt:5, dose:'0,75 L/ha', cible:'Stimulateur', usage:'Biocontr\u00f4le \u2014 sans DAR.', source:'mine'}
  ]);
  _ap('traitements',[
    {produit:'Profiler', type:'Fongicide', amm:'2090093', dar:28, drae:48, znt:5, dose:'2,5 kg/ha', operateur:'Jean', date:_daysAgo(1), parcelles:['Les Charmes','La Combotte'], note:'Pression mildiou \u2014 avant pluie'},
    {produit:'Soufre mouillable', type:'Soufre', amm:'9000287', dar:0, drae:24, znt:5, dose:'8 kg/ha', operateur:'Paul', date:_daysAgo(5), parcelles:['Les Perri\u00e8res'], note:''},
    {produit:'Bouillie bordelaise RSR', type:'Cuivre', amm:'2020047', dar:21, drae:6, znt:5, dose:'1,5 kg/ha', operateur:'Marie', date:_daysAgo(11), parcelles:['Clos du Moulin','Vieilles Vignes'], note:''}
  ]);

  // 9) Journal (déjà vécu : validations + équipes) — v5.95 : épaissi à 14
  //    entrées sur ~3 semaines pour donner de la matière à l'Économie
  //    (coût 1/N par parcelle, tractoriste à son taux) et au simulateur.
  _ap('journal',[
    {id:'j1', date:_daysAgo(1), parcelle:'Les Perri\u00e8res', tache:'Ebourgeonnage', qui:'Sophie', statut:'Valid\u00e9', equipe:true,  membresEquipe:['Sophie','Paul'], note:''},
    {id:'j2', date:_daysAgo(1), parcelle:'La Combotte',   tache:'Relevage',      qui:'Jean',   statut:'Valid\u00e9', equipe:true,  membresEquipe:['Jean','Marie'], niveaux:['n1','n2']},
    {id:'j3', date:_daysAgo(2), parcelle:'Les Charmes',   tache:'Ebourgeonnage', qui:'Paul',   statut:'Valid\u00e9', equipe:false, membresEquipe:[], note:''},
    {id:'j4', date:_daysAgo(2), parcelle:'Clos du Moulin',tache:'Pioche',        qui:'Marie',  statut:'Valid\u00e9', equipe:false, membresEquipe:[], note:''},
    {id:'j5', date:_daysAgo(3), parcelle:'Champ de la Croix', tache:'Ebourgeonnage', qui:'Sophie', statut:'Valid\u00e9', equipe:true, membresEquipe:['Sophie','Jean','Paul'], note:'Secteur Brochon'},
    {id:'j6', date:_daysAgo(4), parcelle:'En Bertrange',  tache:'Ebourgeonnage', qui:'Marie',  statut:'Valid\u00e9', equipe:true,  membresEquipe:['Marie','Sophie'], note:''},
    {id:'j7', date:_daysAgo(5), parcelle:'Vieilles Vignes', tache:'Ebourgeonnage', qui:'Paul', statut:'Valid\u00e9', equipe:true,  membresEquipe:['Paul','Marie','Sophie'], note:'Tout \u00e0 la main'},
    {id:'j8', date:_daysAgo(6), parcelle:'Aux Murgers',   tache:'Pioche',        qui:'Sophie', statut:'Valid\u00e9', equipe:false, membresEquipe:[], note:''},
    {id:'j9', date:_daysAgo(8), parcelle:'La Combotte',   tache:'Ebourgeonnage', qui:'Jean',   statut:'Valid\u00e9', equipe:true,  membresEquipe:['Jean','Paul'], note:''},
    {id:'j10',date:_daysAgo(9), parcelle:'Les Charmes',   tache:'Relevage',      qui:'Marie',  statut:'Valid\u00e9', equipe:true,  membresEquipe:['Marie','Sophie'], niveaux:['n1']},
    {id:'j11',date:_daysAgo(12),parcelle:'Les Perri\u00e8res', tache:'Pioche',    qui:'Paul',   statut:'Valid\u00e9', equipe:false, membresEquipe:[], note:''},
    {id:'j12',date:_daysAgo(15),parcelle:'Champ de la Croix', tache:'Pioche',    qui:'Marie',  statut:'Valid\u00e9', equipe:true,  membresEquipe:['Marie','Jean'], note:''},
    {id:'j13',date:_daysAgo(18),parcelle:'Vieilles Vignes', tache:'Pioche',      qui:'Sophie', statut:'Valid\u00e9', equipe:true,  membresEquipe:['Sophie','Paul'], note:'Rangs serr\u00e9s'},
    {id:'j14',date:_daysAgo(21),parcelle:'En Bertrange',  tache:'Pioche',        qui:'Jean',   statut:'Valid\u00e9', equipe:false, membresEquipe:[], note:''}
  ]);

  // 9pre) MEMBRES : la ligne « permanents présents » du simulateur compte les
  //        actifs non-bureau. Un compte technique (admin de connexion) dans le
  //        tenant de démo ferait afficher 5 permanents pour 4 vrais membres :
  //        tout actif hors {Marie, Jean, Sophie, Paul} passe bureau.
  try{
    var _coreM={'Marie':1,'Jean':1,'Sophie':1,'Paul':1};
    var _mAll=(window.MEMBRES||[]).map(function(mx){ var c=JSON.parse(JSON.stringify(mx||{})); if(c&&c.nom&&!_coreM[c.nom]) c.bureau=true; return c; });
    if(_mAll.length) _ap('membres',_mAll);
  }catch(e){ if(window.logError)window.logError({level:'info',cat:'demo',msg:'membres bureau'}); }

  // 9bis) Saisons DATÉES — le JSON de démo précède la refonte campagne : sans
  //       debut/fin, _chargeSaisonData() rend null → simulateur « Renfort » et
  //       tableau ETP entièrement vides (même bug que l'onboarding, §16c).
  //       Noms conservés : ns='Printemps' filtre les tâches par le champ
  //       legacy `saison` du barème.
  try{
    var _yrS=now.getFullYear();
    var _sAll=(window.SAISONS||[]).map(function(sx){ return JSON.parse(JSON.stringify(sx||{})); });
    _sAll.forEach(function(sx){
      if(!sx) return;
      if(sx.active){ sx.debut=sx.debut||(_yrS+'-03-01'); sx.fin=sx.fin||(_yrS+'-10-31'); }
      else { sx.debut=sx.debut||((_yrS-1)+'-11-01'); sx.fin=sx.fin||(_yrS+'-02-28'); }
    });
    _ap('saisons',_sAll);
  }catch(e){ if(window.logError)window.logError({level:'info',cat:'demo',msg:'saisons dates'}); }

  // 10) Cave & élevage (cuvées + ouillages, dont 1 en retard => alerte)
  try{
    if(window.CAVE_ELEVAGE && typeof window.CAVE_ELEVAGE==='object'){
      var _yr=now.getFullYear();
      window.CAVE_ELEVAGE.cuvees=[
        {id:'cuv1', nom:'Gevrey-Chambertin VV', millesime:_yr-1, tonneaux:[{annee:_yr-1,nb:6},{annee:_yr-3,nb:4}], statut:'elevage', fml_terminee:true,  sous_tire:false, last_ouillage:_daysAgo(6),  last_analyse:_daysAgo(20)},
        {id:'cuv2', nom:'Fixin 1er Cru',        millesime:_yr-1, tonneaux:[{annee:_yr-1,nb:3}],                  statut:'elevage', fml_terminee:true,  sous_tire:false, last_ouillage:_daysAgo(19), last_analyse:_daysAgo(35)},
        {id:'cuv3', nom:'Bourgogne Pinot Noir', millesime:_yr-1, tonneaux:[{annee:_yr-2,nb:8}],                  statut:'elevage', fml_terminee:false, sous_tire:true,  last_ouillage:_daysAgo(4),  last_analyse:null}
      ];
      window.CAVE_ELEVAGE.operations=[
        {id:'op1', type:'ouillage',  date:_daysAgo(6),  cuvee_id:'cuv1', cuvees_ids:['cuv1'], operateur:'Marie', intervenants:[], notes:'', data:{}},
        {id:'op2', type:'analyse',   date:_daysAgo(20), cuvee_id:'cuv1', cuvees_ids:['cuv1'], operateur:'Marie', intervenants:[], notes:'SO2 libre 28 mg/L · AV 0,38 g/L', data:{}},
        {id:'op3', type:'soutirage', date:_daysAgo(4),  cuvee_id:'cuv3', cuvees_ids:['cuv3'], operateur:'Jean',  intervenants:[], notes:'', data:{}},
        {id:'op4', type:'analyse',   date:_daysAgo(48), cuvee_id:'cuv1', cuvees_ids:['cuv1'], operateur:'Marie', intervenants:[], notes:'SO2 libre 34 mg/L · AV 0,42 g/L', data:{}}
      ];
      window.CAVE_ELEVAGE.config=window.CAVE_ELEVAGE.config||{ouillage_alerte_j:14};
    }
  }catch(e){}

  // 10ter) Le Cuvier : recoltes + cuves de vinification
  //        (branche 'cave_vendange' presente dans applyFbData ; sans seed
  //         le chapitre Cuvier ouvre un ecran vide, comme La Reserve avant lui)
  try{
    var _vD=function(k){ var t=new Date(now); t.setDate(t.getDate()-k); return t.toISOString().slice(0,10); };
    var _cvSeed={
      config:{poids_caisse_kg:25,ratio_min:130,ratio_max:140,sucre_par_degre:16.83},
      recoltes:[
        {id:'vrec_d1',parcelle:'Les Charmes',date:_vD(5),nb_caisses:48,temp_c:17,etat_pct:95,erasflage:true,er_pct:100,vendu:false,client:'',cuvee:'Charmes 2026',vcuvee_id:'vcv_a',note:'Belle maturit\u00e9',cuve_id:'vcuv_1'},
        {id:'vrec_d2',parcelle:'Le Clos',date:_vD(4),nb_caisses:36,temp_c:16,etat_pct:92,erasflage:true,er_pct:100,vendu:false,client:'',cuvee:'Charmes 2026',vcuvee_id:'vcv_a',note:'',cuve_id:'vcuv_1'},
        {id:'vrec_d3',parcelle:'Aux Combottes',date:_vD(3),nb_caisses:52,temp_c:18,etat_pct:88,erasflage:false,er_pct:0,vendu:false,client:'',cuvee:'Combottes 2026',vcuvee_id:'vcv_b',note:'Grappes enti\u00e8res',cuve_id:'vcuv_2'},
        {id:'vrec_d4',parcelle:'En Champs',date:_vD(2),nb_caisses:30,temp_c:19,etat_pct:90,erasflage:true,er_pct:100,vendu:true,client:'Maison Ducret',cuvee:'',vcuvee_id:null,note:'Vendu au kilo',cuve_id:null}
      ],
      cuves_vinif:[
        {id:'vcuv_1',nom:'Cuve 3 \u2014 inox 40 hL',volume_hl:21,statut:'fa',parcelles:['Les Charmes','Le Clos'],date_entree:_vD(5),erasflage:true,so2_g_hl:3,levures:'Indig\u00e8nes',mpf:{active:true,temp_c:12,duree_j:5},mesures_fa:[{id:'vm_d1',date:_vD(5),densite:1094,temp_c:22,remontages:1,pigeages:0,note:''},{id:'vm_d2',date:_vD(4),densite:1076,temp_c:24,remontages:2,pigeages:0,note:''},{id:'vm_d3',date:_vD(3),densite:1055,temp_c:26,remontages:2,pigeages:1,note:'FA franche'},{id:'vm_d4',date:_vD(2),densite:1034,temp_c:27,remontages:1,pigeages:1,note:''},{id:'vm_d5',date:_vD(1),densite:1018,temp_c:25,remontages:1,pigeages:0,note:''},{id:'vm_d6',date:_vD(0),densite:1006,temp_c:23,remontages:0,pigeages:1,note:'Fin de FA proche'}],decuvage:null,cuvee_src:'Charmes 2026',vcuvee_id:'vcv_a',recolte_ids:['vrec_d1','vrec_d2'],nb_caisses:84},
        {id:'vcuv_2',nom:'Cuve 5 \u2014 bois 30 hL',volume_hl:13,statut:'macera',parcelles:['Aux Combottes'],date_entree:_vD(3),erasflage:false,so2_g_hl:2,levures:'Indig\u00e8nes',mpf:{active:true,temp_c:11,duree_j:6},mesures_fa:[{id:'vm_e1',date:_vD(2),densite:1097,temp_c:12,remontages:0,pigeages:1,note:'Macération pré-fermentaire'},{id:'vm_e2',date:_vD(1),densite:1095,temp_c:13,remontages:0,pigeages:1,note:''}],decuvage:null,cuvee_src:'Combottes 2026',vcuvee_id:'vcv_b',recolte_ids:['vrec_d3'],nb_caisses:52}
      ],
      clients:['Maison Ducret'],
      analyses:[],
      cuvees:[{id:'vcv_a',nom:'Charmes 2026'},{id:'vcv_b',nom:'Combottes 2026'}]
    };
    _ap('cave_vendange',_cvSeed);
  }catch(e){ if(window.logError)window.logError({level:'info',cat:'demo',msg:'seed vendange'}); }

  // 10bis) La Reserve : produits + achats + inventaires + futs
  //        (sans intrants semes, le chapitre Reserve ouvre un ecran vide)
  try{
    var _rD=function(k){ var t=new Date(now); t.setDate(t.getDate()-k); return t.toISOString().slice(0,10); };
    _ap('intrants',{
      produits:[
        {id:'ri1',nom:'Bouillie bordelaise RSR',cat:'phyto',unite:'kg',contenance:5,contLbl:'sac',prixU:8.40,conso_src:'registre',conso_manuel:0},
        {id:'ri2',nom:'Soufre mouillable',cat:'phyto',unite:'kg',contenance:25,contLbl:'sac',prixU:1.95,conso_src:'registre',conso_manuel:0},
        {id:'ri3',nom:'M\u00e9tabisulfite de potassium',cat:'oeno',unite:'kg',contenance:1,contLbl:'sac',prixU:6.20,conso_src:'cave_so2',conso_manuel:0}
      ],
      achats:[
        {id:'ra1',prodId:'ri1',date:_rD(96),four:'Coop\u00e9rative de Nuits',q:60,unites:12,lot:'BB-2026-114',fact:'F-2026-0412',prix:504},
        {id:'ra2',prodId:'ri2',date:_rD(96),four:'Coop\u00e9rative de Nuits',q:150,unites:6,lot:'SF-2026-077',fact:'F-2026-0412',prix:292.50},
        {id:'ra3',prodId:'ri1',date:_rD(38),four:'Coop\u00e9rative de Nuits',q:25,unites:5,lot:'BB-2026-160',fact:'F-2026-0688',prix:210},
        {id:'ra4',prodId:'ri3',date:_rD(150),four:'\u0152nofrance',q:8,unites:8,lot:'MBK-25',fact:'F-2026-0203',prix:49.60}
      ],
      inventaires:[
        {prodId:'ri1',date:_rD(120),q:0},
        {prodId:'ri2',date:_rD(120),q:0},
        {prodId:'ri1',date:_rD(7),q:31},
        {prodId:'ri3',date:_rD(7),q:5.5}
      ],
      futs:[
        {id:'rf1',four:'Tonnellerie Rousseau',ref:'Chauffe moyenne 228 L',annee:'2025',qte:6,date:_rD(300)},
        {id:'rf2',four:'Tonnellerie Rousseau',ref:'Chauffe moyenne 228 L',annee:'2026',qte:4,date:_rD(45)},
        {id:'rf3',four:'Tonnellerie Damy',ref:'Chauffe longue 228 L',annee:'2026',qte:3,date:_rD(45)}
      ],
      fut_four:['Tonnellerie Rousseau','Tonnellerie Damy'],
      fut_ref:['Chauffe moyenne 228 L','Chauffe longue 228 L'],
      achat_four:['Coop\u00e9rative de Nuits','\u0152nofrance']
    });
  }catch(e){ if(window.logError)window.logError({level:'info',cat:'demo',msg:'seed intrants'}); }

  // 10quater) Remunerations fictives (collection `paie`)
  //   ⚠️ On pose window.PAIE DIRECTEMENT : 'paie' n'a pas de branche dans
  //   applyFbData, la branche generique poserait window.paie (minuscules).
  //   Aucune ecriture : pas de fbSave, et `paie` n'est pas dans la map de
  //   saveData -> rien ne descend sur le disque (invariant C21 preserve).
  //   Taux fictifs, coherents avec la CUMA IDCC 7024 — sans rapport avec un
  //   bareme reel. Sans eux, le cout d'une parcelle retombe sur le bareme
  //   par type de contrat et le tractoriste perd son taux propre.
  try{
    window.PAIE = {
      taux:{ 'Marie':15.80, 'Jean':14.60, 'Paul':13.20, 'Sophie':12.70, 'Alicia':12.10, 'Chlo\u00e9':12.10 },
      taux_hist:{ 'Jean':[{de:13.90,a:14.60,d:'2026-03-01'}] },
      gnr_appoints:[
        {d:'2026-02-12',l:1200,pu:1.18},
        {d:'2026-04-08',l:800, pu:1.24},
        {d:'2026-06-03',l:1000,pu:1.09}
      ]
    };
  }catch(e){ if(window.logError)window.logError({level:'info',cat:'demo',msg:'seed paie'}); }

  // 11) Planning du mois (présence + absence + CP + récup + acompte)
  try{
    window.PLANNING_ENTRIES=window.PLANNING_ENTRIES||{};
    window.PLANNING_HSUP=window.PLANNING_HSUP||{};
    window.PLANNING_ACOMPTES=window.PLANNING_ACOMPTES||{};
    var _m=now.getMonth();
    var _mk='2026-'+_p2(_m+1);
    function _cl(o){ return JSON.parse(JSON.stringify(o)); }
    // ATTENTION : _pEntDay lit PLANNING_ENTRIES[nom][ANNEE][mois][jour].
    // Le niveau annee manquait -> _pEntYear() renvoyait undefined et la
    // grille de la visite guidee s'affichait entierement vide.
    var _YR=now.getFullYear();
    var _nbd=new Date(_YR,_m+1,0).getDate();
    var _dw=function(dd){ return new Date(_YR,_m,dd).getDay(); };
    // Modeles horaires : sans eux _planPlanned() vaut 0 partout, donc aucune
    // heure de reference, donc aucun ecart et aucune heure supplementaire.
    // Modèle sur les 12 MOIS : _chargeSaisonData() bâtit la capacité mois par
    // mois sur toute la saison — un modèle limité au mois courant vidait le
    // simulateur de ses semaines.
    var _tpl={}; _tpl[_YR]={standard:{}};
    for(var _mo=0;_mo<12;_mo++){
      _tpl[_YR].standard[_mo]={};
      var _nb2=new Date(_YR,_mo+1,0).getDate();
      for(var _d1=1;_d1<=_nb2;_d1++){ var _w1=new Date(_YR,_mo,_d1).getDay(); if(_w1>=1&&_w1<=5) _tpl[_YR].standard[_mo][_d1]=7; }
    }
    _ap('planning_templates',_tpl);
    var _trav={timing:{debut:'08:00',fin:'17:00',continu:false},comment:''};
    var _pe={}; var _noms=['Marie','Jean','Sophie','Paul'];
    _noms.forEach(function(nm){
      _pe[nm]={}; _pe[nm][_YR]={}; _pe[nm][_YR][_m]={};
      for(var _d2=1;_d2<=_nbd;_d2++){ var _w2=_dw(_d2); if(_w2>=1&&_w2<=5) _pe[nm][_YR][_m][_d2]=_cl(_trav); }
    });
    var _E=function(nm){ return (_pe[nm]&&_pe[nm][_YR]&&_pe[nm][_YR][_m])||null; };
    var _wd=function(from,k){ var c=0; for(var i=from;i<=_nbd;i++){ var w=_dw(i); if(w>=1&&w<=5){ c++; if(c===k) return i; } } return 0; };
    // Jour de remplacement : un samedi, donc zero heure de reference au modele.
    var _sam=0; for(var _s=13;_s<=_nbd;_s++){ if(_dw(_s)===6){ _sam=_s; break; } }
    var _eM=_E('Marie'), _eJ=_E('Jean'), _eS=_E('Sophie'), _eP=_E('Paul');
    if(_eM && _sam) _eM[_sam]={remplacement:true,timing:{debut:'07:00',fin:'12:00',continu:true},comment:'Remplacement fermeture'};
    if(_eM) _eM[_wd(1,7)]={type:'recup'};
    if(_eS) _eS[_wd(1,8)]={absent:true,motif:'arret',comment:'Arr\u00eat de travail'};
    if(_eJ) _eJ[_wd(1,10)]={absent:true,motif:'injustifie'};
    // Retard : ancre sur le dernier jour ouvre STRICTEMENT passe, pour que la
    // narration (« une heure de retard ») reste vraie quel que soit le jour du mois.
    var _ret=0; for(var _r=now.getDate()-1;_r>=1;_r--){ var _wR=_dw(_r); if(_wR>=1&&_wR<=5){ _ret=_r; break; } }
    if(!_ret) _ret=_wd(1,3);
    if(_eJ && _ret) _eJ[_ret]={absent:true,motif:'retard',motif_h:1};
    // Conges sur DEUX periodes distinctes (multi-periode)
    if(_eP){ [1,2,3].forEach(function(k){ var dd=_wd(1,k); if(dd) _eP[dd]={type:'cp',heures:7}; });
             [11,12].forEach(function(k){ var dd=_wd(1,k); if(dd) _eP[dd]={type:'cp',heures:7}; }); }
    _ap('planning_entries',_pe);
    // Regle « heures dues » active sur toute l'annee de la demo
    try{ if(window.CONFIG) window.CONFIG.hsup_dues_debut=_YR+'-01'; }catch(e3){ if(window.logError)window.logError({level:'info',cat:'demo',msg:'hsup_dues_debut'}); }
    var _hs={}; _hs['Jean']={}; _hs['Jean'][_mk]={paye:0}; _ap('planning_hsup',_hs);
    var _ac={}; _ac['Jean']={}; _ac['Jean'][_mk]=[{date:'2026-'+_p2(_m+1)+'-15',montant:300,note:'Acompte'}]; _ap('planning_acomptes',_ac);
  }catch(e){}

  // 12bis) CEINTURE vendange : quel que soit l'ordre des pulls, on ré-affirme
  //         les tableaux du Cuvier en DIRECT (même motif que PAIE) juste avant
  //         le gel — un doc Firestore vide arrivé entre le seed et le gel
  //         écraserait recoltes/cuves_vinif par les défauts de la branche.
  try{
    if(window.CAVE_VENDANGE && typeof _cvSeed==='object'){
      ['config','recoltes','cuves_vinif','clients','analyses','cuvees'].forEach(function(k){
        if(_cvSeed[k]!==undefined) window.CAVE_VENDANGE[k]=_cvSeed[k];
      });
    }
  }catch(e){ if(window.logError)window.logError({level:'info',cat:'demo',msg:'ceinture vendange'}); }

  // 12) Gel du scenario : aucune donnee Firestore tardive ne le remplace
  window._visiteScenarioReady=true;
  try{ if(window._syncLocalVars) window._syncLocalVars(); }catch(e){}
  try{ if(window._dockBuild) window._dockBuild(); }catch(e){}
}

// ── Écran de bienvenue ──
function _mvtCap(ic,txt){ return '<div class="mvtwc-cap"><span class="ci">'+ic+'</span><span class="ct">'+txt+'</span></div>'; }
function _mvtWelcome(){
  _mvtBuild();
  if(document.getElementById('mvt-wc')) return;
  var w=document.createElement('div'); w.id='mvt-wc'; w.className='mvtwc';
  w.innerHTML='<div class="mvtwc-card">'
    +'<div class="mvtwc-top"><img class="mvtwc-logo-img" src="logo-gt.png" alt="GUERETTECH Ma Vigne"><div><div class="mvtwc-eye">GUERETTECH</div><div class="mvtwc-logo">Ma Vigne</div></div></div>'
    +'<div class="mvtwc-mid"><div class="mvtwc-h">Bienvenue — installez-vous,<br>on vous fait visiter.</div>'
    +'<div class="mvtwc-sub">L\'appli de gestion d\'un domaine viticole, <b>conçue sur le terrain, pour le terrain</b>, par un chef d\'équipe vigneron. Pas une usine à gaz : les bons outils du quotidien, au même endroit.</div></div>'
    +'<div class="mvtwc-grid">'
    +_mvtCap('\uD83C\uDF26\uFE0F','Météo & fenêtres de traitement')
    +_mvtCap('\uD83E\uDDEA','Registre phyto automatique')
    +_mvtCap('\uD83C\uDF47','Parcelles, avancement & délais')
    +_mvtCap('\uD83D\uDC65','Équipe, planning & heures')
    +_mvtCap('\uD83D\uDE9C','Tracteur, carburant & entretien')
    +_mvtCap('\uD83D\uDCCA','Pilotage : décider d\'un coup d\'œil')
    +'</div>'
    +'<div class="mvtwc-foot"><div class="mvtwc-note">Suivez une journée type au domaine — deux minutes, montre en main.</div>'
    +'<button class="mvtwc-go" id="mvtwc-go">Commencer la visite&nbsp;&nbsp;\u25B6</button>'
    +'<button class="mvtwc-skip" id="mvtwc-skip">Explorer par moi-même</button></div>'
    +'</div>';
  document.body.appendChild(w);
  var g=document.getElementById('mvtwc-go'); if(g) g.addEventListener('click', function(){ w.remove(); _mvtStart(); });
  var sk=document.getElementById('mvtwc-skip'); if(sk) sk.addEventListener('click', function(){ w.remove(); });
}

// ── Moteur de visite (coach-marks : spotlight + infobulles) ──
var _mvtCss = `
.mvtwc{position:fixed;inset:0;z-index:99999;background:rgba(12,10,8,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Outfit',sans-serif}
.mvtwc-card{width:392px;max-width:100%;max-height:94vh;overflow-y:auto;background:radial-gradient(circle at 50% 0%,#FCF7EC,#F1EADC 70%);border-radius:22px;box-shadow:0 30px 70px rgba(0,0,0,.5);display:flex;flex-direction:column}
.mvtwc-top{height:120px;flex-shrink:0;background:linear-gradient(165deg,#1C1813,#14110D);position:relative;overflow:hidden;display:flex;align-items:flex-end;padding:0 22px 16px;border-bottom:2px solid transparent;border-image:linear-gradient(90deg,#8A5A38,#C2871E,#3D6B27) 1;border-radius:22px 22px 0 0}
.mvtwc-top::before{content:'';position:absolute;top:-40px;right:-20px;width:150px;height:150px;border-radius:50%;background:rgba(201,168,76,.1)}
.mvtwc-logo-img{position:absolute;top:14px;right:18px;width:50px;height:50px;object-fit:contain}
.mvtwc-eye{font-size:10.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#C9A84C}
.mvtwc-logo{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:600;color:#fff;line-height:1;margin-top:2px}
.mvtwc-mid{padding:20px 22px 8px}
.mvtwc-h{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:600;line-height:1.12;color:#2A2521}
.mvtwc-sub{font-size:13px;color:#6a5f52;line-height:1.5;margin-top:9px}
.mvtwc-sub b{color:#8A5A38;font-weight:600}
.mvtwc-grid{padding:13px 22px 6px;display:grid;grid-template-columns:1fr 1fr;gap:9px}
.mvtwc-cap{display:flex;align-items:flex-start;gap:9px;background:#fff;border:1px solid #E8E0D2;border-radius:12px;padding:10px 11px}
.mvtwc-cap .ci{font-size:17px;line-height:1.1;flex-shrink:0}
.mvtwc-cap .ct{font-size:11.5px;font-weight:600;line-height:1.25;color:#2A2521}
.mvtwc-foot{padding:14px 22px calc(18px + env(safe-area-inset-bottom));position:sticky;bottom:0;background:linear-gradient(to top,#F1EADC 75%,transparent)}
.mvtwc-note{text-align:center;font-size:11.5px;color:#6a5f52;margin-bottom:11px}
.mvtwc-go{display:block;width:100%;border:0;border-radius:14px;padding:15px;cursor:pointer;font-family:inherit;font-weight:600;font-size:15px;background:linear-gradient(135deg,#2a2118,#14110D);color:#f3ecdf;box-shadow:0 8px 22px rgba(20,17,13,.3)}
.mvtwc-skip{display:block;width:100%;background:none;border:0;margin-top:8px;cursor:pointer;font-family:inherit;font-size:12.5px;color:#6a5f52;text-decoration:underline;text-underline-offset:3px}
#mvt{position:fixed;inset:0;z-index:100000;pointer-events:none;font-family:'Outfit',sans-serif}
.mvt-mask{position:fixed;background:rgba(10,8,5,.7);pointer-events:auto;transition:left .28s ease,top .28s ease,width .28s ease,height .28s ease}
#mvt-c{background:transparent}
.mvt-ring{position:fixed;border:2px solid #C9A84C;border-radius:13px;pointer-events:none;box-shadow:0 0 0 1px rgba(0,0,0,.3),0 0 22px rgba(201,168,76,.45);transition:all .28s ease;z-index:100002}
.mvt-ring.act{animation:mvtpulse 1.6s ease-in-out infinite}
@keyframes mvtpulse{0%,100%{box-shadow:0 0 0 1px rgba(0,0,0,.3),0 0 16px rgba(201,168,76,.35)}50%{box-shadow:0 0 0 1px rgba(0,0,0,.3),0 0 30px rgba(201,168,76,.75)}}
.mvt-bar{position:fixed;left:0;right:0;bottom:0;z-index:100003;pointer-events:auto;background:linear-gradient(180deg,#1C1813,#14110D);border-top:2px solid transparent;border-image:linear-gradient(90deg,#8A5A38,#C2871E,#3D6B27) 1;box-shadow:0 -10px 30px rgba(10,8,5,.5)}
.mvt-bar-in{max-width:560px;margin:0 auto;padding:11px 15px calc(12px + env(safe-area-inset-bottom))}
.mvt-bk{font-size:9.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#C9A84C}
.mvt-btx{font-size:13.5px;line-height:1.45;margin-top:4px;color:#EFE6D2}
.mvt-bh{font-size:10px;color:#9C8F79;margin-top:3px;line-height:1.35}
.mvt-brow{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:9px;min-height:34px}
.mvt-miss{display:inline-flex;align-items:center;gap:7px;background:rgba(201,168,76,.14);border:1px solid rgba(201,168,76,.5);color:#E8C98A;border-radius:999px;padding:6px 12px;font-size:11.5px;font-weight:600}
.mvt-hand{font-size:15px;animation:mvttap 1.1s ease-in-out infinite}
@keyframes mvttap{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.mvt-bnext{border:0;border-radius:11px;padding:9px 15px;cursor:pointer;font-family:inherit;font-weight:600;font-size:12.5px;background:#D8BC72;color:#241D12;display:none}
.mvt-bnext.on{display:inline-block}
.mvt-skip{font-size:11px;color:#9C8F79;background:none;border:0;cursor:pointer;font-family:inherit;text-decoration:underline;text-underline-offset:3px;padding:0;flex-shrink:0}
.mvt-dots{display:flex;gap:4px;align-items:center}
.mvt-dots i{width:5px;height:5px;border-radius:99px;background:rgba(245,238,223,.25)}
.mvt-dots i.on{width:16px;background:#D8BC72}
.mvt-chip{position:fixed;top:calc(10px + env(safe-area-inset-top));right:12px;z-index:100003;display:none;align-items:baseline;gap:7px;background:linear-gradient(150deg,#1C1813,#14110D);color:#F5EEDF;border-radius:999px;padding:7px 13px 7px 11px;border:1px solid rgba(201,168,76,.4);box-shadow:0 8px 20px rgba(20,17,13,.4);pointer-events:none;transition:transform .18s}
.mvt-chip.on{display:inline-flex}
.mvt-chip.zap{transform:scale(1.06)}
.mvt-chip .ic{font-size:12px}
.mvt-chip .v{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:700;color:#D8BC72;line-height:1;min-width:50px;text-align:right}
.mvt-chip .l{font-size:9px;letter-spacing:.4px;text-transform:uppercase;color:#9C8F79}
.mvt-fly{position:fixed;z-index:100004;font-family:'Cormorant Garamond',serif;font-weight:700;font-size:18px;color:#3D6B27;background:#FBFAF6;border:1px solid #E8E0D2;border-radius:999px;padding:4px 11px;box-shadow:0 6px 16px rgba(20,17,13,.3);transition:transform .75s cubic-bezier(.3,.7,.3,1),opacity .75s;pointer-events:none}
.mvt-add{position:fixed;inset:0;z-index:100004;overflow-y:auto;background:radial-gradient(circle at 50% -10%,#2b2318,#14110D 65%);color:#F5EEDF;font-family:'Outfit',sans-serif;pointer-events:auto;padding:32px 20px calc(28px + env(safe-area-inset-bottom));text-align:center}
.mvt-add::before{content:'';position:fixed;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,#8A5A38,#C2871E,#3D6B27)}
.mvt-add-in{max-width:360px;margin:0 auto}
.mvt-add-eye{font-size:10.5px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#C2A14D}
.mvt-add-td{font-size:13px;color:#C9BCA4;margin-top:10px}
.mvt-add-td b{color:#F5EEDF;font-weight:600}
.mvt-add-big{font-family:'Cormorant Garamond',serif;font-size:46px;font-weight:700;color:#D8BC72;line-height:1;margin-top:14px}
.mvt-add-sub{font-size:13px;color:#C9BCA4;margin-top:6px}
.mvt-add-rows{margin:16px auto 0;max-width:300px;text-align:left}
.mvt-add-row{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:7px 2px;border-bottom:1px solid rgba(245,238,223,.12);font-size:12.5px;color:#D8CDB8}
.mvt-add-row i{font-style:normal;font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:700;color:#F5EEDF;white-space:nowrap}
.mvt-add-hyp{font-size:10.5px;color:#9C8F79;line-height:1.55;margin-top:12px}
.mvt-add-eur{margin-top:13px;font-size:12.5px;color:#D8CDB8}
.mvt-add-plus{margin:16px auto 0;max-width:300px;text-align:left;border-top:1px solid rgba(245,238,223,.14);padding-top:12px}
.mvt-add-plus .ph{font-size:9.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#C2A14D}
.mvt-add-pr{display:flex;gap:9px;margin-top:9px;font-size:12px;line-height:1.5;color:#D8CDB8}
.mvt-add-pr .pi{flex-shrink:0}
.mvt-add-pr b{color:#F5EEDF;font-weight:600}
.mvt-add-inst{margin:13px auto 0;max-width:300px;background:rgba(201,168,76,.10);border:1px solid rgba(201,168,76,.42);border-radius:13px;padding:11px 13px;font-size:12.5px;line-height:1.5;color:#EFE6D2}
.mvt-add-inst b{color:#D8BC72}
.mvt-add-cta{display:block;width:100%;max-width:300px;margin:18px auto 0;border:0;border-radius:14px;padding:14px;cursor:pointer;font-family:inherit;font-weight:700;font-size:14.5px;background:linear-gradient(135deg,#D8BC72,#C2A14D);color:#241D12;text-decoration:none;box-sizing:border-box}
.mvt-add-ghost{display:block;width:100%;max-width:300px;margin:9px auto 0;border-radius:14px;padding:12px;cursor:pointer;font-family:inherit;font-weight:600;font-size:12.5px;background:none;border:1px solid rgba(245,238,223,.3);color:#F5EEDF;box-sizing:border-box}
.mvt-add-sign{margin-top:15px;font-size:11px;color:#9C8F79;line-height:1.5;font-style:italic}
.mvt-more{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:0 0 16px}
.mvt-more span{font-size:11px;font-weight:600;color:#8A5A38;background:#F3EADF;border:1px solid #E8E0D2;border-radius:99px;padding:4px 10px}
.mvt-eb{display:block;width:100%;box-sizing:border-box;font-family:inherit;font-weight:600;font-size:14px;border-radius:12px;padding:13px;cursor:pointer;border:1px solid #E8E0D2;background:#fff;color:#2A2521;margin-top:9px;text-decoration:none}
.mvt-eb.p{background:linear-gradient(135deg,#2a2118,#14110D);color:#f3ecdf;border-color:transparent}
.mvt-menu{position:fixed;inset:0;z-index:100005;background:rgba(12,10,8,.82);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Outfit',sans-serif;overflow-y:auto}
.mvt-menu-card{width:404px;max-width:100%;background:radial-gradient(circle at 50% 0%,#FCF7EC,#F1EADC 72%);border-radius:22px;box-shadow:0 30px 70px rgba(0,0,0,.5);padding:22px 20px calc(18px + env(safe-area-inset-bottom));max-height:94vh;overflow-y:auto}
.mvt-menu-eye{font-size:10.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#C2871E;text-align:center}
.mvt-menu-h{font-family:'Cormorant Garamond',serif;font-size:25px;font-weight:600;line-height:1.1;color:#2A2521;text-align:center;margin-top:4px}
.mvt-menu-sub{font-size:12.5px;color:#6a5f52;line-height:1.5;text-align:center;margin:8px 6px 4px}
.mvt-ch-grid{display:flex;flex-direction:column;gap:8px;margin:14px 0 6px}
.mvt-ch{display:flex;align-items:center;gap:12px;text-align:left;width:100%;background:#fff;border:1px solid #E8E0D2;border-radius:14px;padding:12px 13px;cursor:pointer;font-family:inherit;transition:transform .08s ease,box-shadow .15s ease}
.mvt-ch:hover{box-shadow:0 6px 18px rgba(20,17,13,.12);transform:translateY(-1px)}
.mvt-ch-ic{font-size:22px;flex-shrink:0;width:30px;text-align:center}
.mvt-ch-tx{flex:1;min-width:0}
.mvt-ch-tx b{display:block;font-size:13.5px;font-weight:600;color:#2A2521;line-height:1.2}
.mvt-ch-tx i{display:block;font-size:11.5px;font-style:normal;color:#76695a;line-height:1.35;margin-top:2px}
.mvt-ch-go{font-size:20px;color:#C2871E;flex-shrink:0;font-weight:600}
.mvt-menu-note{font-size:11.5px;color:#6a5f52;text-align:center;background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.28);border-radius:11px;padding:9px 11px;margin:8px 0 12px;line-height:1.4}
.mvt-chbar{position:fixed;left:0;right:0;bottom:0;z-index:100006;background:linear-gradient(180deg,#1C1813,#14110D);border-top:2px solid transparent;border-image:linear-gradient(90deg,#8A5A38,#C2871E,#3D6B27) 1;box-shadow:0 -10px 30px rgba(10,8,5,.5);padding:11px 14px calc(11px + env(safe-area-inset-bottom));font-family:'Outfit',sans-serif}
.mvt-chbar-in{display:flex;align-items:center;gap:12px;max-width:560px;margin:0 auto}
.mvt-chbar-tx{flex:1;min-width:0;color:#f3ecdf}
.mvt-chbar-tx b{display:block;font-size:13px;font-weight:600;line-height:1.2}
.mvt-chbar-tx span{display:block;font-size:11px;color:#cbb896;line-height:1.35;margin-top:2px}
.mvt-chbar-btn{flex-shrink:0;font-family:inherit;font-weight:600;font-size:12.5px;border:1px solid rgba(201,168,76,.5);background:rgba(201,168,76,.14);color:#E8C98A;border-radius:11px;padding:9px 13px;cursor:pointer;white-space:nowrap}
.mvt-chbar-btn:active{background:rgba(201,168,76,.26)}
`;
// ── DEMO-2 « L'addition » : table de chiffrage — SOURCE UNIQUE.
//    Créditée par le compteur pendant la visite, affichée par l'écran final.
//    Une seule définition des nombres (règle §25.16) — le harnais l'exécute.
var DEMO2_CREDITS = [
  { k:'phyto',      min:20, freq:16,  lab:'Registre phyto',                          hyp:'Estimation : 25 min de classeur ramen\u00e9es \u00e0 5 \u2014 mon propre registre papier, trois campagnes.' },
  { k:'validation', min:5,  freq:400, lab:'Journal & validations',                   hyp:'Estimation prudente : 5 min de papier par t\u00e2che valid\u00e9e \u2014 250 valid\u00e9es chez moi de janvier \u00e0 juillet.' },
  { k:'finmois',    min:90, freq:12,  lab:'Fins de mois \u2014 heures, CP, PDF MSA', hyp:'' },
  { k:'saisonniers',min:40, freq:12,  lab:'Saisonniers & vendanges \u2014 dossiers, heures, relev\u00e9s', hyp:'' },
  { k:'cuvees',     min:15, freq:24,  lab:'Chai & Cuvier \u2014 suivi des cuv\u00e9es', hyp:'' },
  { k:'reserve',    min:20, freq:12,  lab:'La R\u00e9serve \u2014 stock & bilan mati\u00e8re', hyp:'' },
  { k:'info',       min:10, freq:220, lab:'Retrouver l\u2019info, \u00e9viter le d\u00e9placement pour rien', hyp:'' }
];
function _demo2H(c){ return Math.round(c.min*c.freq/60); }
function _demo2TotalH(){ var s=0; DEMO2_CREDITS.forEach(function(c){ s+=c.min*c.freq; }); return s/60; }
function _demo2Hyp(k){ for(var i=0;i<DEMO2_CREDITS.length;i++){ if(DEMO2_CREDITS[i].k===k) return DEMO2_CREDITS[i].hyp||''; } return ''; }

// ── Les 9 moments : une phrase de d\u00e9cor, un geste, une cons\u00e9quence visible.
//    La narration vit en bandeau bas (.mvt-bar) ; le spotlight (masques + ring)
//    est conserv\u00e9 tel quel. Le 9e moment est l'addition (_mvtAddition).
var _mvtSteps = [
  { kick:'8 h \u00b7 moment 1 sur 13', tx:'Lundi. 7 hectares, 4 personnes \u2014 et la m\u00e9t\u00e9o d\u00e9j\u00e0 parcelle par parcelle. Aujourd\u2019hui, c\u2019est sec.',
    sel:['.home-w[data-w="meteo5"]','#home-meteo5'] },
  { kick:'Le cap du jour \u00b7 2 sur 13', tx:'Avant que l\u2019\u00e9quipe arrive : la t\u00e2che du moment, un mot pour tous.',
    mission:'Touchez \u00ab Diffuser la priorit\u00e9 \u00bb',
    nav:function(){ try{ openPriorityEdit(); }catch(e){} }, sel:'#ovPriority .modal', clickSel:'#ovPriority .mbtn.verte' },
  { kick:'9 h 40 \u00b7 3 sur 13', tx:'L\u2019\u00e9quipe vient de finir une parcelle. Notez-le.',
    mission:'Touchez le \u2713',
    nav:function(){ try{ pTacheFilter=window._visiteTache||'Ebourgeonnage'; }catch(e){} if(window.switchVigneOng) window.switchVigneOng('parcelles'); },
    sel:'.pcard-qv .pc-validate', clickSel:'.pcard-qv .pc-validate', actDelay:1700 },
  { kick:'C\u2019est trac\u00e9 \u00b7 4 sur 13', tx:'Votre validation est au journal : parcelle, \u00e9quipe, m\u00e9t\u00e9o du jour. Rien \u00e0 remplir.',
    nav:function(){ if(window.switchVigneOng) window.switchVigneOng('journal'); try{ renderJournal(); }catch(e){} },
    sel:'.jcard', credit:{ k:'validation', min:5 } },
  { kick:'16 h 20 \u00b7 5 sur 13', tx:'Le traitement d\u2019hier est au registre : n\u00b0 AMM, dose, DAR, ZNT remplis depuis le catalogue officiel E-Phy. Demain, la parcelle trait\u00e9e s\u2019affichera ferm\u00e9e.',
    nav:function(){ if(window.goTo) window.goTo('phyto'); },
    sel:'#page-phyto .content', credit:{ k:'phyto', min:20 } },
  { kick:'16 h 30 \u00b7 6 sur 13', tx:'La R\u00e9serve a suivi toute seule : la bouillie du registre est sortie du stock. Achats, inventaires, f\u00fbts \u2014 et le bilan mati\u00e8re s\u2019\u00e9crit au fil des traitements.',
    hyp:'\u2248 4 h d\u2019inventaires par an \u2014 et le bilan mati\u00e8re r\u00e9glementaire toujours \u00e0 jour.',
    nav:function(){ if(window.goTo) window.goTo('reserve'); setTimeout(function(){ try{ if(window._rsvTabTo) window._rsvTabTo('audit'); }catch(e){ if(window.logError)window.logError({level:'info',cat:'visite',msg:'rsvTabTo'}); } },240); },
    sel:['#mvr-body','#page-reserve'] },
  { kick:'17 h \u00b7 7 sur 13', tx:'Au Chai, chaque cuv\u00e9e suit ses f\u00fbts, sa part des anges et ses analyses \u2014 SO2 et acidit\u00e9 se comparent d\u2019un relev\u00e9 \u00e0 l\u2019autre, l\u2019ouillage en retard s\u2019est signal\u00e9 tout seul.',
    hyp:'Suivi des cuv\u00e9es : \u2248 6 h de cahier de cave par an.',
    nav:function(){ if(window.goTo) window.goTo('cave'); setTimeout(function(){ try{ if(window.renderCave) renderCave(); }catch(e){ if(window.logError)window.logError({level:'error',cat:'visite',msg:'chai: '+(e&&e.message)}); } },240); },
    sel:['#mvc-elevage','#page-cave'] },
  { kick:'17 h 15 \u00b7 8 sur 13', tx:'Le Cuvier suit la vendange cuve par cuve : un relev\u00e9 de densit\u00e9 par jour, et la cin\u00e9tique de fermentation se dessine toute seule.',
    hyp:'Apports, caisses, rendement par parcelle : tout se garde d\u2019un mill\u00e9sime \u00e0 l\u2019autre.',
    nav:function(){ if(window.goTo) window.goTo('cave'); setTimeout(function(){ try{ if(window.selectCaveSection) window.selectCaveSection('vendange'); }catch(e){ if(window.logError)window.logError({level:'error',cat:'visite',msg:'cuvier: '+(e&&e.message)}); } },260); },
    sel:['#mvv-body','#cave-view-vend','#page-cave'] },
  { kick:'17 h 30 \u00b7 9 sur 13', tx:'Le pointage du soir tient en deux gestes. Et l\u2019\u00e9cart se voit : Jean, une heure de retard \u2014 saisie en heures, elle tire sur son compteur.',
    hyp:'La feuille d\u2019heures du soir n\u2019existe plus.',
    nav:function(){ if(window.goTo) window.goTo('planning'); },
    sel:['#page-planning .pl2-board','#page-planning'] },
  { kick:'17 h 40 \u00b7 10 sur 13', tx:'La fiche de Jean, pr\u00eate pour la paie : acompte de 300 \u20ac, heures sup au compteur, retard et r\u00e9cup d\u00e9j\u00e0 compt\u00e9s \u2014 le relev\u00e9 MSA sort en PDF.',
    hyp:'\u2248 18 h de fins de mois par an \u2014 et chaque saisonnier de vendanges suivi sans classeur.',
    nav:function(){ setTimeout(function(){ try{ if(window.openPlanFiche) openPlanFiche('Jean'); }catch(e){ if(window.logError)window.logError({level:'info',cat:'visite',msg:'planFiche'}); } },180); },
    sel:['#ovPlanFiche .modal','#ovPlanFiche'] },
  { kick:'18 h \u00b7 11 sur 13', tx:'Le soir, la d\u00e9cision du jour est pr\u00eate \u2014 fen\u00eatre de traitement, mat\u00e9riel, cave. Rien \u00e0 chercher.',
    nav:function(){ try{ if(window.closePlanFiche) closePlanFiche(); }catch(e2){ if(window.logError)window.logError({level:'info',cat:'visite',msg:'closeFiche'}); } try{ if(window.goTo) window.goTo('pilotage'); window.scrollTo(0,0); }catch(e){} },
    sel:['.pil-dec','.pil-cockpit-card','#page-pilotage .content'] },
  { kick:'18 h 05 \u00b7 12 sur 13', tx:'Chaque parcelle porte son co\u00fbt r\u00e9el de main-d\u2019\u0153uvre \u2014 en euros, et \u00e0 l\u2019hectare, pond\u00e9r\u00e9 par l\u2019\u00e9quipe qui y est vraiment pass\u00e9e.',
    nav:function(){ try{ var b=document.querySelector('#pil-tabs [data-tab="eco"]'); if(b) b.click(); else if(window.logError) window.logError({level:'info',cat:'visite',msg:'onglet eco introuvable'}); }catch(e){ if(window.logError)window.logError({level:'info',cat:'visite',msg:'tab eco'}); } },
    sel:['.pil-tbody','.pil-panels','#page-pilotage .content'] },
  { kick:'18 h 10 \u00b7 13 sur 13', tx:'La question du renfort : combien, et quand ? Demandez au moteur \u2014 il essaie des centaines de placements et ne garde que ce qui boucle.',
    hyp:'Chaque proposition affiche son co\u00fbt \u2014 le classement se fait parmi ce qui boucle.',
    mission:'Touchez \u00ab Le meilleur placement trouv\u00e9 \u00bb',
    nav:function(){ try{ var b=document.querySelector('#pil-tabs [data-tab="sim"]'); if(b) b.click(); }catch(e){ if(window.logError)window.logError({level:'info',cat:'visite',msg:'tab sim'}); } },
    sel:['.rf-strats','.pil-panels','#page-pilotage .content'], clickSel:'.rf-strat.best', actDelay:900 }
];
var _mvtCur=-1, _mvtEl=null, _mvtEls=null, _mvtOne=null, _mvtBuilt=false, _mvtEarn=0, _mvtDone={};
function _mvtBuild(){
  if(_mvtBuilt) return;
  var st=document.createElement('style'); st.id='mvt-css'; st.textContent=_mvtCss; document.head.appendChild(st);
  var d=document.createElement('div'); d.id='mvt'; d.style.display='none';
  d.innerHTML='<div class="mvt-mask" id="mvt-mt"></div><div class="mvt-mask" id="mvt-mb"></div><div class="mvt-mask" id="mvt-ml"></div><div class="mvt-mask" id="mvt-mr"></div><div class="mvt-mask" id="mvt-c"></div><div class="mvt-ring" id="mvt-ring"></div><div class="mvt-bar" id="mvt-bar"></div><span class="mvt-chip" id="mvt-chip"><span class="ic">\u{23F1}\u{FE0F}</span><span class="v">0 min</span><span class="l">de moins qu\u2019au papier</span></span>';
  document.body.appendChild(d);
  window.addEventListener('resize', _mvtReposition);
  window.addEventListener('scroll', _mvtReposition, true);
  _mvtBuilt=true;
}
function _mvtClearOne(){ if(_mvtOne){ try{_mvtOne.el.removeEventListener('click', _mvtOne.fn);}catch(e){} _mvtOne=null; } }
function _mvtStart(){
  _mvtBuild();
  var t=document.getElementById('mvt'); if(t){ t.style.display='block'; }
  var oldAdd=document.getElementById('mvt-add'); if(oldAdd) oldAdd.remove();
  _mvtEarn=0; _mvtDone={};
  var ch=document.getElementById('mvt-chip');
  if(ch){ ch.classList.remove('on'); var v=ch.querySelector('.v'); if(v) v.textContent='0 min'; }
  _mvtCur=-1; _mvtNext();
}
window.mvTourStart=_mvtStart;
function _mvtQuery(sel){
  if(!sel) return null;
  if(typeof sel==='string') return document.querySelector(sel);
  for(var i=0;i<sel.length;i++){ var e=document.querySelector(sel[i]); if(e) return e; }
  return null;
}
function _mvtNext(){
  _mvtClearOne();
  _mvtCur++;
  if(_mvtCur>=_mvtSteps.length){ _mvtEnd(); return; }
  var s=_mvtSteps[_mvtCur];
  var doPlace=function(){
    if(s.prep){ try{ s.prep(); }catch(e){} }
    _mvtEl=null; _mvtEls=null;
    if(s.selAll){
      var all=document.querySelectorAll(s.selAll), arr=[];
      for(var i=0;i<all.length && i<(s.n||2);i++) arr.push(all[i]);
      _mvtEls = arr.length ? arr : null;
      if(_mvtEls && _mvtEls[0]){ try{ _mvtEls[0].scrollIntoView({block:'center'}); }catch(e){} }
    } else {
      var el=_mvtQuery(s.sel); _mvtEl=el;
      if(el){ try{ el.scrollIntoView({block:'center', inline:'nearest'}); }catch(e){} }
    }
    requestAnimationFrame(function(){ _mvtPlace(s); });
  };
  if(s.nav){ try{ s.nav(); }catch(e){} setTimeout(doPlace, 420); }
  else { requestAnimationFrame(doPlace); }
}
function _mvtPlace(s){
  var isAct = !!(s.tap || s.clickSel);
  var bar=document.getElementById('mvt-bar'); if(!bar) return;
  var dots=''; for(var i=0;i<14;i++){ dots += '<i class="'+(i===_mvtCur?'on':'')+'"></i>'; }
  var mid;
  if(isAct){
    mid='<span class="mvt-miss"><span class="mvt-hand">\u{1F446}</span><span>'+s.mission+'</span></span>';
  } else {
    mid='<button class="mvt-bnext on" id="mvt-next" type="button"><span>Continuer \u203a</span></button>';
  }
  var hyp=(s.credit && !_mvtDone[s.credit.k]) ? _demo2Hyp(s.credit.k) : (s.hyp||'');
  bar.innerHTML='<div class="mvt-bar-in"><div class="mvt-bk">'+s.kick+'</div>'
    +'<div class="mvt-btx">'+s.tx+'</div>'
    +(hyp?'<div class="mvt-bh">'+hyp+'</div>':'')
    +'<div class="mvt-brow">'+mid
    +'<span class="mvt-dots">'+dots+'</span>'
    +'<button class="mvt-skip" id="mvt-skip" type="button"><span>Passer</span></button></div></div>';
  var nx=document.getElementById('mvt-next'); if(nx) nx.addEventListener('click', _mvtNext);
  var sk=document.getElementById('mvt-skip'); if(sk) sk.addEventListener('click', _mvtSkip);
  var c=document.getElementById('mvt-c'); if(c) c.style.display = isAct ? 'none' : 'block';
  var ring=document.getElementById('mvt-ring'); if(ring) ring.classList.toggle('act', isAct);
  if(isAct){
    var _clk = s.clickSel ? document.querySelector(s.clickSel) : _mvtEl;
    if(_clk){ var fn=function(){ setTimeout(_mvtNext, s.actDelay||320); }; _clk.addEventListener('click', fn); _mvtOne={el:_clk, fn:fn}; }
  }
  if(s.credit && !_mvtDone[s.credit.k]){
    (function(cr){ setTimeout(function(){ _mvtCredit(cr.k, cr.min); }, 750); })(s.credit);
  }
  _mvtReposition();
}
function _mvtSkip(){
  _mvtClearOne();
  var t=document.getElementById('mvt'); if(t){ t.style.display='none'; }
  _mvtMenu();
}
// Cr\u00e9dit du compteur : le montant vole du spotlight vers la pastille, puis
// le total monte (rAF \u2014 piège du 1er ts \u00e0 0 : t0===null, jamais !t0).
function _mvtCredit(key, min){
  if(_mvtDone[key]) return; _mvtDone[key]=1;
  var chip=document.getElementById('mvt-chip'); if(!chip) return;
  chip.classList.add('on');
  var vEl=chip.querySelector('.v');
  var ring=document.getElementById('mvt-ring');
  var rr=(ring && ring.style.opacity!=='0') ? ring.getBoundingClientRect() : {left:window.innerWidth/2-30, top:window.innerHeight/2, width:60, height:0};
  var cr=chip.getBoundingClientRect();
  var sx=rr.left+rr.width/2-32, sy=Math.max(60, rr.top)-2;
  var fly=document.createElement('span'); fly.className='mvt-fly'; fly.textContent='+'+min+' min';
  fly.style.left=sx+'px'; fly.style.top=sy+'px';
  document.body.appendChild(fly);
  requestAnimationFrame(function(){ requestAnimationFrame(function(){
    fly.style.transform='translate('+(cr.left+cr.width/2-(sx+32))+'px,'+(cr.top-sy+8)+'px) scale(.45)';
    fly.style.opacity='0';
  }); });
  setTimeout(function(){
    try{ fly.remove(); }catch(e){}
    chip.classList.add('zap'); setTimeout(function(){ chip.classList.remove('zap'); }, 200);
    var from=_mvtEarn, target=_mvtEarn+min, t0=null;
    function fr(ts){
      if(t0===null) t0=ts;
      var k=Math.min(1,(ts-t0)/650);
      if(vEl) vEl.textContent=Math.round(from+(target-from)*k)+' min';
      if(k<1){ requestAnimationFrame(fr); } else { _mvtEarn=target; }
    }
    requestAnimationFrame(fr);
  }, 700);
}
function _mvtSet(id,l,t,w,h){ var e=document.getElementById(id); if(!e)return; e.style.left=l+'px'; e.style.top=t+'px'; e.style.width=w+'px'; e.style.height=h+'px'; }
function _mvtUnionRect(els){
  var L=Infinity,T=Infinity,R=-Infinity,B=-Infinity,ok=false;
  for(var i=0;i<els.length;i++){ var e=els[i]; if(!e||!document.body.contains(e)) continue; var r=e.getBoundingClientRect(); if(r.width===0) continue; if(r.left<L)L=r.left; if(r.top<T)T=r.top; if(r.right>R)R=r.right; if(r.bottom>B)B=r.bottom; ok=true; }
  return ok?{left:L,top:T,right:R,bottom:B,width:R-L,height:B-T}:null;
}
function _mvtReposition(){
  if(!_mvtBuilt) return;
  var ring=document.getElementById('mvt-ring');
  var vw=window.innerWidth, vh=window.innerHeight, pad=6;
  var r=null;
  if(_mvtEls && _mvtEls.length){ r=_mvtUnionRect(_mvtEls); }
  else if(_mvtEl && document.body.contains(_mvtEl) && _mvtEl.getBoundingClientRect().width>0){ r=_mvtEl.getBoundingClientRect(); }
  if(!r){
    _mvtSet('mvt-mt',0,0,vw,vh); _mvtSet('mvt-mb',0,vh,0,0); _mvtSet('mvt-ml',0,0,0,0); _mvtSet('mvt-mr',0,0,0,0);
    _mvtSet('mvt-c',0,0,0,0);
    if(ring) ring.style.opacity='0';
    return;
  }
  if(ring) ring.style.opacity='1';
  _mvtSet('mvt-mt',0,0,vw,Math.max(0,r.top-pad));
  _mvtSet('mvt-mb',0,r.bottom+pad,vw,Math.max(0,vh-r.bottom-pad));
  _mvtSet('mvt-ml',0,r.top-pad,Math.max(0,r.left-pad),r.height+2*pad);
  _mvtSet('mvt-mr',r.right+pad,r.top-pad,Math.max(0,vw-r.right-pad),r.height+2*pad);
  _mvtSet('mvt-c',r.left-pad,r.top-pad,r.width+2*pad,r.height+2*pad);
  if(ring){ ring.style.left=(r.left-pad)+'px'; ring.style.top=(r.top-pad)+'px'; ring.style.width=(r.width+2*pad)+'px'; ring.style.height=(r.height+2*pad)+'px'; }
}
// ── L'addition : plein \u00e9cran sobre, calcul\u00e9 depuis DEMO2_CREDITS. ──
function _mvtAddition(){
  var old=document.getElementById('mvt-add'); if(old) old.remove();
  var totalH=_demo2TotalH();
  var eur=Math.round(totalH*20/100)*100;
  var abo=79*12, r1=Math.round((eur-abo-990)/10)*10, r1a=Math.round((eur-790-990)/10)*10, rn=Math.round((eur-abo)/10)*10;
  var rows='';
  DEMO2_CREDITS.forEach(function(c){ rows+='<div class="mvt-add-row"><span>'+c.lab+'</span><i>\u2248 '+_demo2H(c)+' h</i></div>'; });
  var today=(_mvtEarn>0)?('<div class="mvt-add-td">Avec vous, aujourd\u2019hui : <b>'+_mvtEarn+' min de moins qu\u2019au papier</b>.</div>'):'';
  var m=document.createElement('div'); m.id='mvt-add'; m.className='mvt-add';
  m.innerHTML='<div class="mvt-add-in">'
    +'<div class="mvt-add-eye">La journ\u00e9e est finie</div>'
    +today
    +'<div class="mvt-add-big">\u2248 '+Math.round(totalH)+' h</div>'
    +'<div class="mvt-add-sub">sur une campagne compl\u00e8te \u2014 12 mois, d\u2019une r\u00e9colte \u00e0 l\u2019autre.</div>'
    +'<div class="mvt-add-rows">'+rows+'</div>'
    +'<div class="mvt-add-hyp">Hypoth\u00e8ses, sur ces 12 mois : 16 traitements, \u2248 400 t\u00e2ches valid\u00e9es (compt\u00e9 chez moi : 250 de janvier \u00e0 juillet), 12 fins de mois, 24 op\u00e9rations de cave, une dizaine de dossiers saisonniers \u2014 et 10 minutes par jour ouvr\u00e9 \u00e0 ne plus chercher l\u2019info ni se d\u00e9placer pour rien. Des estimations franches, arrondies sans exc\u00e8s. Le v\u00f4tre donnera ses propres chiffres.</div>'
    +'<div class="mvt-add-eur">En main-d\u2019\u0153uvre charg\u00e9e \u00e0 20 \u20ac/h, cela repr\u00e9sente autour de '+eur.toLocaleString('fr-FR')+' \u20ac par campagne.</div>'
    +'<div class="mvt-add-plus"><div class="ph">Et ce qui ne se compte pas en minutes</div>'
    +'<div class="mvt-add-pr"><span class="pi">\u{1F9FE}</span><span><b>La tra\u00e7abilit\u00e9, sans y penser.</b> Du traitement au stock : registre phyto, d\u00e9lais de rentr\u00e9e, bilan mati\u00e8re \u2014 pr\u00eats le jour du contr\u00f4le.</span></div>'
    +'<div class="mvt-add-pr"><span class="pi">\u{1F4C5}</span><span><b>La m\u00e9moire du domaine.</b> Rendements par parcelle, co\u00fbts, avancement : chaque mill\u00e9sime se garde et se compare au suivant.</span></div>'
    +'<div class="mvt-add-pr"><span class="pi">\u{1F9ED}</span><span><b>Et d\u00e9cider.</b> Les d\u00e9cisions du Pilotage, elles, ne se comptent pas en minutes.</span></div></div>'
    +'<div class="mvt-add-eur">En face, ce que \u00e7a co\u00fbte : abonnement Domaine <b>79 \u20ac/mois</b> (948 \u20ac/an \u2014 790 \u20ac en formule annuelle) et l\u2019installation, une fois : <b>990 \u20ac</b>.</div>'
    +'<div class="mvt-add-inst">Premi\u00e8re ann\u00e9e, tout compris : \u2248 '+eur.toLocaleString('fr-FR')+' \u2212 '+abo+' \u2212 990 = <b>+\u2248 '+r1.toLocaleString('fr-FR')+' \u20ac</b> \u2014 l\u2019app est pay\u00e9e, et vous \u00eates d\u00e9j\u00e0 gagnant (+\u2248 '+r1a.toLocaleString('fr-FR')+' \u20ac en annuel). Ensuite : <b>\u2248 '+rn.toLocaleString('fr-FR')+' \u20ac de gagn\u00e9 chaque ann\u00e9e</b>.</div>'
    +'<a class="mvt-add-cta" href="/essai.html" target="_blank" rel="noopener">Essayer 15 jours sur mes parcelles</a>'
    +'<button class="mvt-add-ghost" id="mvt-add-ch" type="button"><span>Voir les 12 chapitres \u203a</span></button>'
    +'<div class="mvt-add-sign">\u2014 Nicolas, chef d\u2019\u00e9quipe viticole en C\u00f4te de Nuits.<br>Compt\u00e9 sur mes propres journ\u00e9es.</div>'
    +'</div>';
  document.body.appendChild(m);
  var ch=document.getElementById('mvt-add-ch');
  if(ch) ch.addEventListener('click', function(){ m.remove(); _mvtMenu(); });
}
function _mvtEnd(){
  _mvtClearOne();
  var t=document.getElementById('mvt'); if(t){ t.style.display='none'; }
  _mvtAddition();
}
// ── Menu de chapitres (exploration libre, écrans réels) ──
var _MVT_CHAPS=[
  {id:'pilotage', ic:'\uD83D\uDCCA', t:'Pilotage \u2014 la vue chef', x:'Avancement, charge restante, fen\u00eatres de traitement et mat\u00e9riel : tout le domaine en un \u00e9cran.'},
  {id:'carte',    ic:'\uD83D\uDDFA\uFE0F', t:'Carte du domaine', x:'Vos parcelles g\u00e9olocalis\u00e9es, color\u00e9es selon l\u2019avancement de la t\u00e2che en cours.'},
  {id:'secteurs', ic:'\uD83C\uDF26\uFE0F', t:'M\u00e9t\u00e9o par secteur', x:'Vos vignes sur 3 communes : une pr\u00e9vision distincte par secteur, pas une moyenne.'},
  {id:'planning', ic:'\uD83D\uDC65', t:'Planning & heures', x:'Pr\u00e9sence, compteur annuel des 1607 h, heures suppl\u00e9mentaires, cong\u00e9s et acomptes \u2014 la paie d\u00e9j\u00e0 pr\u00e9par\u00e9e.'},
  {id:'tracteur', ic:'\uD83D\uDE9C', t:'Tracteur & carburant', x:'Cuve GNR, prochaine r\u00e9vision, anomalies : le suivi du mat\u00e9riel se tient seul.'},
  {id:'phyto',    ic:'\uD83C\uDF3F', t:'Registre phytosanitaire', x:'Catalogue officiel E-Phy, d\u00e9lai de rentr\u00e9e calcul\u00e9 tout seul, registre pr\u00eat pour un contr\u00f4le.'},
  {id:'cave',     ic:'\uD83C\uDF77', t:'Le Chai \u2014 \u00e9levage', x:'Cuv\u00e9es en f\u00fbt, rappels d\u2019ouillage, analyses labo, puis la mise en bouteille.'},
  {id:'eco',      ic:'\uD83D\uDCB6', t:'Ce que co\u00fbte une parcelle', x:'Le co\u00fbt en euros et \u00e0 l\u2019hectare, pond\u00e9r\u00e9 par l\u2019\u00e9quipe r\u00e9ellement pass\u00e9e. La bascule pilote aussi le tri.'},
  {id:'etp',      ic:'\uD83D\uDCC8', t:'Combien de bras', x:'Effectif pr\u00e9sent semaine par semaine, charge \u00e0 absorber, et le co\u00fbt total selon la taille d\u2019\u00e9quipe.'},
  {id:'cuvier',   ic:'\uD83C\uDF47', t:'Le Cuvier \u2014 la vendange', x:'Du raisin \u00e0 la cuve : caisses, \u00e9tat du raisin, \u00e9raflage, rendement contr\u00f4l\u00e9 au remplissage.'},
  {id:'reserve',  ic:'\uD83D\uDCE6', t:'La R\u00e9serve', x:'Stocks, achats et inventaires : le bilan mati\u00e8re se tient tout seul, produit par produit.'},
  {id:'ouvrier',  ic:'\uD83D\uDC77', t:'Ce que voit l\u2019ouvrier', x:'Bascule sur l\u2019interface simplifi\u00e9e d\u2019un ouvrier : sa journ\u00e9e, sans le reste.'}
];
function _mvtMenu(){
  _mvtChapterClose(true);
  var old=document.getElementById('mvt-menu'); if(old) old.remove();
  var grid=_MVT_CHAPS.map(function(c){
    return '<button class="mvt-ch" data-cid="'+c.id+'"><span class="mvt-ch-ic">'+c.ic+'</span><span class="mvt-ch-tx"><b>'+c.t+'</b><i>'+c.x+'</i></span><span class="mvt-ch-go">\u203A</span></button>';
  }).join('');
  var m=document.createElement('div'); m.id='mvt-menu'; m.className='mvt-menu';
  m.innerHTML='<div class="mvt-menu-card">'
    +'<div class="mvt-menu-eye">La visite continue</div>'
    +'<div class="mvt-menu-h">Vous avez suivi une journ\u00e9e.<br>Voici tout le reste.</div>'
    +'<div class="mvt-menu-sub">Choisissez ce que vous voulez explorer \u2014 chaque \u00e9cran est r\u00e9el, rien n\u2019est enregistr\u00e9.</div>'
    +'<div class="mvt-ch-grid">'+grid+'</div>'
    +'<div class="mvt-menu-note">\u2699\uFE0F Et tout est param\u00e9trable : t\u00e2ches, heures/ha, \u00e9quipe, communes, mat\u00e9riel, produits\u2026</div>'
    +'<a class="mvt-eb p" href="/essai.html" target="_blank" rel="noopener">Demander un acc\u00e8s d\u2019essai</a>'
    +'<button class="mvt-eb" id="mvt-menu-free">Explorer l\u2019appli librement</button>'
    +'</div>';
  document.body.appendChild(m);
  Array.prototype.forEach.call(m.querySelectorAll('.mvt-ch'),function(b){ b.addEventListener('click',function(){ _mvtChapter(b.getAttribute('data-cid')); }); });
  var fr=document.getElementById('mvt-menu-free'); if(fr) fr.addEventListener('click',function(){ m.remove(); });
}
function _mvtChapterClose(silent){
  var b=document.getElementById('mvt-chbar'); if(b) b.remove();
  if(window._mvtOuvrierActive){
    try{ if(window.currentUser){ window.currentUser.roles=['admin','ouvrier','tractoriste']; } if(typeof currentUser!=='undefined'){ currentUser.roles=['admin','ouvrier','tractoriste']; } if(typeof applyRoles==='function')applyRoles(); }catch(e){}
    window._mvtOuvrierActive=false;
  }
}
function _mvtChapter(id){
  var c=null; for(var i=0;i<_MVT_CHAPS.length;i++){ if(_MVT_CHAPS[i].id===id){ c=_MVT_CHAPS[i]; break; } }
  if(!c) return;
  var menu=document.getElementById('mvt-menu'); if(menu) menu.remove();
  try{
    if(id==='pilotage'){ goTo('pilotage'); }
    else if(id==='carte'){ goTo('parcelles'); setTimeout(function(){ try{ if(window.switchPTab) window.switchPTab('carte'); }catch(e){} },240); }
    else if(id==='secteurs'){ goTo('home'); setTimeout(function(){ var el=document.getElementById('home-meteo-communes'); if(el){ try{ el.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){} } },340); }
    else if(id==='planning'){ goTo('planning'); }
    else if(id==='tracteur'){ goTo('tracteur'); setTimeout(function(){ try{ if(window.switchTracOnglet) window.switchTracOnglet('entretiens'); }catch(e){} },220); }
    else if(id==='cave'){ goTo('cave'); }
    else if(id==='phyto'){ goTo('phyto'); }
    else if(id==='eco'||id==='etp'){ goTo('pilotage'); (function(tb){ setTimeout(function(){ try{ var b=document.querySelector('#pil-tabs [data-tab="'+tb+'"]'); if(b) b.click(); else if(window.logError) window.logError({level:'info',cat:'demo',msg:'onglet '+tb+' introuvable'}); }catch(e){ if(window.logError)window.logError({level:'info',cat:'demo',msg:'pil tab'}); } },260); })(id==='eco'?'eco':'equ'); }
    else if(id==='cuvier'){ goTo('cave'); setTimeout(function(){ try{ if(window.selectCaveSection) window.selectCaveSection('vendange'); if(window.switchVendOng) window.switchVendOng('rec'); }catch(e){ if(window.logError)window.logError({level:'info',cat:'demo',msg:'cuvier'}); } },260); }
    else if(id==='reserve'){ goTo('reserve'); setTimeout(function(){ try{ if(window._rsvTabTo) window._rsvTabTo('audit'); }catch(e){ if(window.logError)window.logError({level:'info',cat:'demo',msg:'rsvTabTo'}); } },240); }
    else if(id==='ouvrier'){
      window._mvtOuvrierActive=true;
      try{ if(window.currentUser){ window.currentUser.roles=['ouvrier']; } if(typeof currentUser!=='undefined'){ currentUser.roles=['ouvrier']; } if(typeof applyRoles==='function')applyRoles(); }catch(e){}
      goTo('home');
    }
  }catch(e){}
  var oldb=document.getElementById('mvt-chbar'); if(oldb) oldb.remove();
  var bar=document.createElement('div'); bar.id='mvt-chbar'; bar.className='mvt-chbar';
  var backLbl=(id==='ouvrier')?'\u2039 Revenir (chef)':'\u2039 Les chapitres';
  bar.innerHTML='<div class="mvt-chbar-in"><div class="mvt-chbar-tx"><b>'+c.ic+' '+c.t+'</b><span>'+c.x+'</span></div>'
    +'<button class="mvt-chbar-btn" id="mvt-chbar-back">'+backLbl+'</button></div>';
  document.body.appendChild(bar);
  var bk=document.getElementById('mvt-chbar-back'); if(bk) bk.addEventListener('click',function(){ _mvtMenu(); });
}
window._mvtMenu=_mvtMenu;
window._mvtChapter=_mvtChapter;

// ⚠️ Exposé immédiatement sur window pour éviter la race condition iOS :
// Firebase (cache IndexedDB) peut répondre avant que le DOMContentLoaded l'assigne (ligne ~6156).
window.initLogin = initLogin;
window.confirmDemoCode      = confirmDemoCode;

function selectProfile(idx){
  loginPendingIdx = idx;
  var m = MEMBRES[idx];
  document.getElementById('login-profiles').style.display = 'none';
  document.getElementById('login-sub-txt').style.display = 'none';
  document.getElementById('login-pwd-panel').style.display = 'block';
  document.getElementById('login-pwd-name').textContent = m.nom;
  document.getElementById('login-pwd-input').value = '';
  document.getElementById('login-pwd-error').style.display = 'none';
  document.getElementById('login-screen').scrollTop = 0;
  setTimeout(function(){ document.getElementById('login-pwd-input').focus(); }, 150);
}

function backToProfiles(){
  loginPendingIdx = -1;
  document.getElementById('login-profiles').style.display = 'grid';
  document.getElementById('login-sub-txt').style.display = 'block';
  document.getElementById('login-pwd-panel').style.display = 'none';
  document.getElementById('login-forgot-panel').style.display = 'none';
  document.getElementById('login-pwd-error').style.display = 'none';
  document.getElementById('login-pwd-input').value = '';
  document.getElementById('login-screen').scrollTop = 0;
}

// ── SEC-2 — écran de premier login ───────────────────────────────────
// Affiché après une authentification RÉUSSIE quand le compte porte le claim
// mustChangePwd : mot de passe fraîchement créé par l'admin, ou réinitialisé.
// Volontairement sans bouton « plus tard » : ce mot de passe a transité par la voix ou
// un bout de papier, ce n'est pas un secret. Le seul « plus tard » possible est de
// fermer l'app — et l'écran revient à la connexion suivante.
function _mvShowFirstPwd(m){
  document.getElementById('login-pwd-panel').style.display = 'none';
  document.getElementById('login-forgot-panel').style.display = 'none';
  var who = document.getElementById('login-fp-who');
  if(who) who.textContent = '\uD83D\uDC64 ' + m.nom;
  ['login-fp-new','login-fp-confirm'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.value = '';
  });
  var er = document.getElementById('login-fp-error'); if(er) er.style.display = 'none';
  var btn = document.getElementById('login-fp-btn');
  if(btn){ btn.disabled = false; btn.textContent = '\u2713 Enregistrer et continuer'; }
  document.getElementById('login-first-pwd-panel').style.display = 'block';
  setTimeout(function(){
    document.getElementById('login-screen').scrollTop = 0;
    var f = document.getElementById('login-fp-new'); if(f) f.focus();
  }, 60);
}

async function _mvSubmitFirstPwd(){
  var nv  = (document.getElementById('login-fp-new').value || '');
  var cv  = (document.getElementById('login-fp-confirm').value || '');
  var er  = document.getElementById('login-fp-error');
  var btn = document.getElementById('login-fp-btn');
  var fail = function(msg){
    er.textContent = '\u274c ' + msg; er.style.display = 'block';
    btn.disabled = false; btn.textContent = '\u2713 Enregistrer et continuer';
  };
  er.style.display = 'none';
  if(nv.length < 8) return fail('Le mot de passe doit faire au moins 8 caract\u00e8res.');
  if(nv !== cv)     return fail('Les deux mots de passe ne correspondent pas.');

  btn.disabled = true; btn.textContent = '\u23f3 Enregistrement\u2026';
  try {
    await window._fbCompleteFirstLogin(nv);
  } catch(e) {
    var reason = (e && e.details && e.details.reason) || '';
    if(reason === 'same_as_initial') return fail('Choisissez un mot de passe personnel, diff\u00e9rent de celui qu\'on vous a communiqu\u00e9.');
    if(reason === 'too_short')       return fail('Le mot de passe doit faire au moins 8 caract\u00e8res.');
    if(reason === 'weak')            return fail('Mot de passe trop faible.');
    return fail((e && e.message) || 'Erreur, r\u00e9essayez.');
  }
  // Le mot de passe a changé côté serveur ET le claim est tombé (completeFirstLogin
  // rafraîchit le jeton). On rejoue confirmLogin avec le NOUVEAU mot de passe : zéro
  // duplication du flux d'entrée, et la garde ci-dessus laisse passer cette fois-ci.
  document.getElementById('login-first-pwd-panel').style.display = 'none';
  document.getElementById('login-pwd-panel').style.display = 'block';
  document.getElementById('login-pwd-input').value = nv;
  await confirmLogin();
  document.getElementById('login-pwd-input').value = '';
}

async function confirmLogin(){
  if(loginPendingIdx < 0) return;
  var m = MEMBRES[loginPendingIdx];
  var saisi = document.getElementById('login-pwd-input').value;
  if(!m.email) {
    document.getElementById('login-pwd-error').textContent = '❌ Aucun email associé à ce compte.';
    document.getElementById('login-pwd-error').style.display = 'block';
    return;
  }
  const btn = document.getElementById('login-pwd-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Connexion…';
  try {
    const cred = await firebase.auth().signInWithEmailAndPassword(m.email, saisi);

    // ── SEC-2 : premier login → changement de mot de passe obligatoire ──
    // Placé ICI, avant toute entrée : le compte est authentifié (la session existe) mais
    // ne franchit pas l'écran tant que le mot de passe initial n'est pas remplacé.
    // Le rafraîchissement du jeton est FORCÉ : le claim vient peut-être d'être posé côté
    // serveur (compte créé il y a 30 s) et le jeton en cache — ~1 h — ne le verrait pas.
    // C'est le SEUL point de passage : _fbLoad termine toujours par initLogin(), même
    // quand une session Firebase persiste → rouvrir l'app ne contourne pas cette garde.
    try {
      if (window._mvLoadClaims) await window._mvLoadClaims(true);
      if (window._mvMustChangePwd && window._mvMustChangePwd()) {
        btn.disabled = false; btn.textContent = 'Se connecter';
        _mvShowFirstPwd(m);
        return;
      }
    } catch(e) { /* claims illisibles (réseau) → on n'enferme personne dehors */ }

    m._firebaseUser = cred.user;
    currentUser = m;
    window.currentUser = currentUser;
    try{ _mvSessArm(cred.user && cred.user.uid); }catch(e){}
    if(DEBUG) console.log('✅ Login Firebase OK:', m.nom, 'roles:', m.roles);
    loginPendingIdx = -1;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('login-profiles').style.display = 'grid';
    document.getElementById('login-pwd-panel').style.display = 'none';
    document.getElementById('login-pwd-input').value = '';
    document.body.style.background = 'var(--blanc)';
    btn.disabled = false;
    btn.textContent = 'Se connecter';
    applyRoles();
    if(window._mvApplyTrialGating)window._mvApplyTrialGating();
    if(window.applyDomNom) window.applyDomNom();
    goHub();
    showHomeLoader();
    fetchMeteo();
    clearInterval(_meteoInterval); _meteoInterval = setInterval(fetchMeteo, 15 * 60 * 1000); // anti-empilement
    if(navigator.onLine && window._fbLoadAfterAuth) {
      window._fbLoadAfterAuth().then(function() {
        _migrateTachesV3();
        _migrateTachesSaison();
        window._dataReady = true;
        applyVigneSaison();
        var activePage = document.querySelector('.page.active');
        var pid = activePage ? activePage.id : '';
        if(pid === 'page-hub')       goHub();
        if(pid === 'page-home')      renderHome();
        if(pid === 'page-pilotage' && window.renderPilotage) _ensureLeaflet().then(function(){window.renderPilotage();}).catch(function(){window.renderPilotage();});
        if(pid === 'page-parcelles') { renderParcelles(); computePStats(); }
        if(pid === 'page-journal')   renderJournalList();
        if(pid === 'page-tracteur')  renderTracteur();
        if(pid === 'page-phyto')     renderPhyto();
        if(pid === 'page-reglages')  window.renderReglages();
        if(pid === 'page-cave'     && window.renderCave)     window.renderCave();
        if(pid === 'page-reserve'  && window.renderReserve)  window.renderReserve();
        if(pid === 'page-planning' && window.renderPlanning) window.renderPlanning();
        if(window.checkWhatsNew) setTimeout(window.checkWhatsNew, 700);
      }).catch(function(){ window._dataReady = true; });
    } else {
      window._dataReady = true;
    }
  } catch(e) {
    btn.disabled = false;
    btn.textContent = 'Se connecter';
    var _loginErr = '❌ Mot de passe incorrect.';
    if (e.code === 'auth/invalid-email') {
      _loginErr = '❌ Email invalide pour ce compte. Contactez l\'administrateur.';
    } else if (e.code === 'auth/user-not-found') {
      _loginErr = '❌ Compte introuvable. Contactez l\'administrateur.';
    } else if (e.code === 'auth/user-disabled') {
      _loginErr = '❌ Ce compte a été désactivé.';
    } else if (e.code === 'auth/network-request-failed') {
      _loginErr = '❌ Pas de connexion réseau.';
    } else if (!e.code) {
      _loginErr = '❌ Connexion bloquée (extension navigateur ou VPN). Désactivez uBlock / MetaMask et réessayez.';
    }
    console.warn('[Login] Erreur Firebase:', e.code, m.email);
    document.getElementById('login-pwd-error').textContent = _loginErr;
    document.getElementById('login-pwd-error').style.display = 'block';
    document.getElementById('login-pwd-input').value = '';
    document.getElementById('login-pwd-input').focus();
    console.warn('❌ Login Firebase error:', e.code);
  }
}


function logout(){
  clearInterval(_meteoInterval); _meteoInterval=null;
  // v5.58 : sans cette ligne, quitter la visite guidée pour son vrai compte dans le
  // même onglet laissait fetchMeteo() définitivement neutralisé — plus aucune météo.
  window._visiteFakeWx = 0;
  currentUser=null;
  window.currentUser = null;
  // ⚠️ Désabonner AVANT signOut. Sinon Firestore relance le flux de watch sans jeton,
  // les rules refusent, et les 12 listeners temps réel tombent d'un coup en
  // permission-denied — une rafale de bruit dans le journal d'erreurs qui enterrait
  // les vraies pannes du signalement. Se désabonner ne déclenche AUCUN callback.
  if (window._fbUnsubAll) window._fbUnsubAll();
  firebase.auth().signOut();
  _mvSessClear();
  // SEC-5 - Poste partage : effacer les donnees du domaine mises en cache localement.
  // LS_KEY (mavigne_data_v1_<tenant>) porte l'integralite des donnees du domaine ;
  // les snapshots mavigne_backup_* en conservent une COPIE et ne sont PAS scopees au
  // tenant -> sans les effacer aussi, la donnee resterait lisible apres deconnexion.
  // On NE touche PAS mavigne_offline_queue (ecritures en attente = perte si effacee)
  // ni les preferences d'affichage. Au prochain login, LS_KEY est re-hydrate depuis
  // Firestore ; la sauvegarde serveur (weeklyTenantJsonBackup, GCS) fait foi.
  _mvSnapCancel();   // une snapshot en attente se réécrirait APRÈS la purge — poste partagé
  try {
    localStorage.removeItem(LS_KEY);
    _mvBkPurge(0);
  } catch(e) { if(window.logError) window.logError({level:'info', cat:'storage',
    msg:'Purge locale de déconnexion incomplète', detail:(e && e.name) ? e.name : ''}); }
  loginPendingIdx=-1;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('login-profiles').style.display = 'grid';
  document.getElementById('login-pwd-panel').style.display = 'none';
  document.getElementById('login-screen').style.display='flex';
}


// Rafraîchit les rôles de la session active quand MEMBRES est re-synchronisé.
// currentUser est une référence figée au login ; sans ça, un changement de rôle
// (ex. ajout 'pilotage') n'apparaît qu'après reconnexion. Affichage/nav seulement
// (le claim Auth 'ro' des rôles lecture-seule reste géré côté serveur).
function _mvRefreshCurrentUserRoles(){
  try{
    var cu=window.currentUser;
    if(!cu||cu._isDemo||cu._isGTAdmin) return;
    var email=(cu.email||(cu._firebaseUser&&cu._firebaseUser.email)||'').toLowerCase();
    if(!email) return;
    var m=(window.MEMBRES||[]).find(function(x){return x&&(x.email||'').toLowerCase()===email;});
    if(!m||!Array.isArray(m.roles)) return;
    var _sig=function(u){ return JSON.stringify(u.roles||[])+'|'+JSON.stringify(u.mods||{}); };
    var before=_sig(cu);
    cu.roles=m.roles.slice();
    cu.statut=m.statut;
    if(m.bureau!==undefined) cu.bureau=m.bureau;
    // Modules visibles : meme raison que les roles. currentUser est une reference
    // figee au login et applyFbData REMPLACE le tableau MEMBRES -> sans recopie,
    // l'admin qui masque un module devrait dire « deconnecte-toi et reconnecte-toi ».
    // Copie profonde : cu et m peuvent etre deux objets distincts apres re-sync.
    cu.mods=(m.mods&&typeof m.mods==='object')?JSON.parse(JSON.stringify(m.mods)):undefined;
    window.currentUser=cu;
    if(before!==_sig(cu)){
      if(typeof applyRoles==='function') applyRoles();   // reconstruit le dock
      var _ap=(document.querySelector('.page.active')||{}).id||'';
      if(_ap==='page-reglages'&&typeof renderReglages==='function'){try{renderReglages();}catch(e){}}
      // La page ouverte vient peut-etre d'etre masquee : on ne laisse personne sur
      // un module qui a disparu du dock (il n'aurait plus aucun moyen d'en sortir
      // sinon que le bouton retour).
      try{ var _cp=_ap.replace('page-',''); if(_cp&&_mvPageGated(_cp)) _goLanding(); }
      catch(e){ if(window.logError)window.logError({level:'info',cat:'nav',msg:'sortie de page masquee impossible',detail:(e&&e.message)||String(e)}); }
    }
    try{ if(window._mvApplyTrialGating)window._mvApplyTrialGating(); }catch(e){}
  }catch(e){}
}
// Expose : reglages.js l'appelle apres avoir enregistre un membre, pour que
// l'admin qui se restreint lui-meme voie l'effet sans attendre le retour Firestore.
window._mvRefreshCurrentUserRoles=_mvRefreshCurrentUserRoles;

// ══════════════════════════════════════════════════════════════════════
// GARDE DE SESSION MULTI-ONGLET (collision démo / domaine)
// Firebase Auth partage currentUser entre TOUS les onglets d'une même origine.
// Ouvrir la démo (demo@…, domaine-dupont) dans un 2e onglet REMPLACE donc la
// session admin du 1er onglet : l'UI y reste celle du domaine (window.currentUser
// figé au login) mais le JETON devient celui de la démo (demo:true) → SEC-1 refuse
// toutes les écritures avec un message cryptique. On détecte la bascule et on
// l'explique, au lieu de laisser un « écriture refusée » sans cause visible.
// Source PER-ONGLET : sessionStorage (NON partagé entre onglets — contrairement à
// localStorage, que la démo pollue avec son tenant domaine-dupont).
function _mvSessArm(uid){
  try{
    var au = (window.firebase && window.firebase.auth) ? window.firebase.auth() : null;
    var u  = uid || (au && au.currentUser ? au.currentUser.uid : null);
    if(!u) return;
    sessionStorage.setItem('mv_sess_uid', u);
    sessionStorage.setItem('mv_sess_tenant', localStorage.getItem('mavigne_tenant') || '');
  }catch(e){}
  _mvSessCheck(); // ré-évalue (retire l'alerte si une session cohérente vient d'être posée)
}
function _mvSessClear(){ try{ sessionStorage.removeItem('mv_sess_uid'); sessionStorage.removeItem('mv_sess_tenant'); }catch(e){} }
function _mvSessCheck(){
  try{
    var base = sessionStorage.getItem('mv_sess_uid');
    if(!base) return;                        // aucun login établi dans cet onglet
    var cu = window.currentUser;
    // Bascules VOLONTAIRES dans le même onglet (GT / démo / visite) : pas une collision.
    if(cu && (cu._isGTAdmin || cu._isDemo || cu._isVisite)){ _mvSessHide(); return; }
    var au  = (window.firebase && window.firebase.auth) ? window.firebase.auth() : null;
    var cur = au && au.currentUser ? au.currentUser.uid : null;
    if(!cur) return;                         // transition / rechargement → currentUser restauré ensuite
    if(cur === base){ _mvSessHide(); return; }
    _mvSessShow();                           // uid différent = une AUTRE connexion a pris la session de cet onglet
  }catch(e){}
}
function _mvSessHide(){ var o=document.getElementById('mv-sess-lost'); if(o) o.remove(); }
function _mvSessShow(){
  if(document.getElementById('mv-sess-lost')) return; // idempotent
  var o=document.createElement('div');
  o.id='mv-sess-lost';
  o.setAttribute('role','alertdialog'); o.setAttribute('aria-modal','true');
  o.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(10,8,6,0.86);display:flex;align-items:center;justify-content:center;padding:22px;';
  o.innerHTML =
    '<div style="max-width:420px;width:100%;background:#FBFAF6;border-radius:18px;padding:26px 24px;box-shadow:0 24px 60px rgba(0,0,0,0.4);text-align:center;">'
    + '<div style="font-size:40px;line-height:1;margin-bottom:12px;">🔒</div>'
    + '<div style="font-family:Georgia,serif;font-size:26px;font-weight:600;color:#14110D;margin-bottom:10px;">Session interrompue</div>'
    + '<div style="font-size:15px;line-height:1.55;color:#4A463E;margin-bottom:18px;">La démonstration (ou une autre connexion) a remplacé ta session dans <b>ce navigateur</b>. Les modifications sont bloquées tant que la connexion à ton domaine n&#39;est pas rétablie.</div>'
    + '<button id="mv-sess-recover" style="width:100%;border:none;border-radius:12px;padding:14px;font-size:16px;font-weight:600;color:#fff;background:#7A1020;cursor:pointer;">Se reconnecter à mon domaine</button>'
    + '<div style="font-size:12.5px;line-height:1.5;color:#8A857A;margin-top:14px;">💡 Pour éviter cela, ouvre la démo en <b>navigation privée</b> ou dans un autre profil de navigateur.</div>'
    + '</div>';
  document.body.appendChild(o);
  var b=document.getElementById('mv-sess-recover'); if(b) b.onclick=_mvSessRecover;
}
function _mvSessRecover(){
  // 1) Restaurer le tenant du domaine : localStorage.mavigne_tenant a pu être écrasé
  //    par la démo (domaine-dupont) → on le remet à la valeur capturée au login.
  try{ var t=sessionStorage.getItem('mv_sess_tenant'); if(t) localStorage.setItem('mavigne_tenant', t); }catch(e){}
  _mvSessClear();
  // 2) Couper la session partagée puis recharger → écran de login du bon domaine.
  if (window._fbUnsubAll) window._fbUnsubAll(); // idem logout() : pas de rafale parasite
  try{ if(window.firebase && window.firebase.auth) window.firebase.auth().signOut(); }catch(e){}
  setTimeout(function(){ location.reload(); }, 60);
}
window._mvSessArm=_mvSessArm; window._mvSessCheck=_mvSessCheck; window._mvSessClear=_mvSessClear;
document.addEventListener('visibilitychange', function(){ if(document.visibilityState==='visible') _mvSessCheck(); });
setInterval(_mvSessCheck, 5000);

function applyRoles(){
  // GT Admin : interface dédiée — rien d'autre à appliquer
  if(currentUser&&currentUser._isGTAdmin){
    return;
  }
  // Tracteur readonly banner
  const isReadOnly=!isTractoriste();
  // Export PDF entretien masqué pour non-admins
  var _entExpBtn=document.getElementById('ent-export-pdf-btn');
  if(_entExpBtn) _entExpBtn.style.display=isAdmin()?'':'none';
  document.getElementById('trac-readonly').style.display=isReadOnly?'flex':'none';
  // Phyto : boutons d'écriture du registre (onglet Tracteur) réservés tractoriste + admin
  var _phytoCanWrite=isAdmin()||isTractoriste();
  document.querySelectorAll('#page-phyto [onclick*="openOvTraitement"], #page-phyto [onclick*="ovProduit"]').forEach(function(b){ b.style.display=_phytoCanWrite?'':'none'; });
  // Saisonnier : banner lecture seule sur Journal et Parcelles
  const saisonBanners=document.querySelectorAll('.saisonnier-readonly-banner');
  saisonBanners.forEach(b=>b.style.display=isSaisonnier()?'flex':'none');
  // Bouton + Journal : masqué pour saisonnier
  const jAddBtn=document.getElementById('journal-add-btn');
  if(jAddBtn)jAddBtn.style.display=canWrite()?'flex':'none';
  // Avatar v2 (header accueil)
  const m=currentUser;
  if(m){
    const ava2=document.getElementById('up-ava-v2');
    if(ava2){ava2.textContent=m.nom.charAt(0).toUpperCase();ava2.title=m.nom;}
  }
  // Mode plein soleil — appliquer la préférence de l'utilisateur (#6)
  _hcApply(_hcLoad());
  if(window._dockBuild)_dockBuild();
  // La question du jour. Si SESSIONS n'est pas encore charge, _mvModeCheck sort sans
  // rien marquer : le rattrapage differe repose la question une fois les donnees la.
  _mvModeCheck();
  setTimeout(_mvModeCheck, 1500);
}
// ════ MÉTÉO ════
let meteoData=null;
let _meteoInterval=null; // guard anti-empilement setInterval météo
function _renderMeteoMini(emoji,temp,wind,isCache){
  const mini=document.getElementById('hv2-meteo-mini');
  const icoEl=document.getElementById('hv2-mini-ico');
  const tempEl=document.getElementById('hv2-mini-temp');
  const descEl=document.getElementById('hv2-mini-desc');
  if(!mini)return;
  mini.style.display='flex';
  mini.style.opacity=isCache?'0.7':'1';
  if(icoEl)icoEl.textContent=emoji;
  if(tempEl)tempEl.textContent=temp+'°C';
  if(descEl)descEl.textContent='Vent '+wind+' km/h';
}
// ════ LOCALISATION DU DOMAINE (météo) ════
// Priorité : (1) coordonnées réglées manuellement (Réglages, geo_manual) ;
//            (2) centroïde des parcelles géolocalisées (vérité terrain) ;
//            (3) coordonnées config (défaut onboarding) ; (4) repli Bourgogne.
function getCentroideParcelles(){
  try{
    var src = window.PARCELLES || [];
    var sLat=0, sLng=0, n=0;
    for(var i=0;i<src.length;i++){
      var p=src[i]; if(!p || p.statut==='Arrachee') continue;
      var la=parseFloat(p.lat), ln=parseFloat(p.lng);
      if(isFinite(la) && isFinite(ln) && (la!==0 || ln!==0)){ sLat+=la; sLng+=ln; n++; }
    }
    if(!n) return null;
    return { lat:sLat/n, lng:sLng/n };
  }catch(e){ return null; }
}
function _geoPlausible(la, ln){
  return isFinite(la) && isFinite(ln) && la>=-90 && la<=90 && ln>=-180 && ln<=180 && (la!==0 || ln!==0);
}
function getDomaineGeo(){
  var c = window.CONFIG || {};
  var cLat=parseFloat(c.lat), cLng=parseFloat(c.lon);
  if(c.geo_manual && _geoPlausible(cLat, cLng)) return { lat:cLat, lng:cLng };
  var ctr = getCentroideParcelles();
  if(ctr && _geoPlausible(ctr.lat, ctr.lng)) return ctr;
  if(_geoPlausible(cLat, cLng)) return { lat:cLat, lng:cLng };
  return { lat:47.22, lng:4.97 };
}
window.getCentroideParcelles = getCentroideParcelles;
window.getDomaineGeo = getDomaineGeo;

// ════════════════════════════════════════════════════════════════
// MÉTÉO PAR COMMUNE — secteurs météo (parcelles dispersées)
// • Chaque parcelle peut porter p.commune = {nom, lat, lng} (facultatif).
//   Sans commune → héritage du domaine (getDomaineGeo / groupe __DOMAINE__).
// • Météo d'UNE parcelle = SON centroïde (p.lat/lng) en priorité, puis la
//   commune affectée, puis le domaine. Le nom de commune reste l'étiquette,
//   même après import KML (la météo bascule alors sur le centroïde réel).
// • Accueil : une mini-carte météo par secteur dès qu'il y a ≥2 communes.
// • Géocodage commune : BAN (api-adresse.data.gouv.fr) — gratuit, France.
// ════════════════════════════════════════════════════════════════
window.METEO_PAR_COMMUNE = window.METEO_PAR_COMMUNE || null;
window._domaineCommuneNom = window._domaineCommuneNom || '';

function _communeSlug(nom){
  return String(nom||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);
}
// Coordonnées météo d'une parcelle : centroïde parcelle > commune affectée > null
function _parcelleWeatherGeo(p){
  if(!p) return null;
  var la=parseFloat(p.lat), ln=parseFloat(p.lng);
  if(_geoPlausible(la,ln)) return {lat:la,lng:ln,src:'parcelle'};
  if(p.commune){ var cla=parseFloat(p.commune.lat), cln=parseFloat(p.commune.lng);
    if(_geoPlausible(cla,cln)) return {lat:cla,lng:cln,src:'commune'}; }
  return null;
}
// Groupes "secteurs météo" parmi les parcelles actives (regroupées par commune).
// Parcelles sans commune → groupe __DOMAINE__ (coords getDomaineGeo).
function _communesActives(){
  var groups={}; var src=window.PARCELLES||[];
  for(var i=0;i<src.length;i++){
    var p=src[i]; if(!p||p.statut==='Arrachee') continue;
    var nom=(p.commune&&p.commune.nom)?p.commune.nom:'';
    var key=nom?nom:'__DOMAINE__';
    if(!groups[key]) groups[key]={key:key,nom:nom,sLat:0,sLng:0,nP:0,fbLat:null,fbLng:null,nbParc:0};
    var g=groups[key]; g.nbParc++;
    var la=parseFloat(p.lat), ln=parseFloat(p.lng);
    if(_geoPlausible(la,ln)){ g.sLat+=la; g.sLng+=ln; g.nP++; }
    if(g.fbLat===null && p.commune && _geoPlausible(parseFloat(p.commune.lat),parseFloat(p.commune.lng))){
      g.fbLat=parseFloat(p.commune.lat); g.fbLng=parseFloat(p.commune.lng);
    }
  }
  var out=[];
  Object.keys(groups).forEach(function(k){
    var g=groups[k]; var lat,lng,nom;
    if(k==='__DOMAINE__'){ var dg=getDomaineGeo(); lat=dg.lat; lng=dg.lng; nom=window._domaineCommuneNom||'Domaine'; }
    else if(g.nP>0){ lat=g.sLat/g.nP; lng=g.sLng/g.nP; nom=g.nom; }      // centroïde réel des parcelles
    else if(g.fbLat!==null){ lat=g.fbLat; lng=g.fbLng; nom=g.nom; }       // repli : centre de la commune
    else { var dg2=getDomaineGeo(); lat=dg2.lat; lng=dg2.lng; nom=g.nom; }
    out.push({key:k,nom:nom,lat:lat,lng:lng,nbParc:g.nbParc});
  });
  out.sort(function(a,b){ if(a.key==='__DOMAINE__')return 1; if(b.key==='__DOMAINE__')return -1; return String(a.nom).localeCompare(String(b.nom),'fr'); });
  return out;
}

// ── Géocodage commune (BAN, France) ──
async function _geocodeCommuneBAN(q){
  try{
    var r=await fetch('https://api-adresse.data.gouv.fr/search/?q='+encodeURIComponent(q)+'&type=municipality&limit=7&autocomplete=1');
    var d=await r.json();
    return ((d&&d.features)||[]).map(function(f){
      var c=(f.geometry&&f.geometry.coordinates)||[]; var pr=f.properties||{};
      return {nom:pr.city||pr.name||pr.label, lat:c[1], lng:c[0], cp:pr.postcode||'', ctx:pr.context||''};
    }).filter(function(x){return x.nom&&isFinite(x.lat)&&isFinite(x.lng);});
  }catch(e){ return []; }
}
async function _reverseCommuneBAN(lat,lng){
  try{
    var r=await fetch('https://api-adresse.data.gouv.fr/reverse/?lat='+lat+'&lon='+lng);
    var d=await r.json();
    var f=(d&&d.features&&d.features[0])||null; if(!f) return null;
    var pr=f.properties||{};
    return {nom:pr.city||pr.name||'', cp:pr.postcode||'', ctx:pr.context||''};
  }catch(e){ return null; }
}
async function _ensureDomaineCommune(){
  if(window._domaineCommuneNom) return;
  try{
    var g=getDomaineGeo();
    var rv=await _reverseCommuneBAN(g.lat,g.lng);
    if(rv&&rv.nom){ window._domaineCommuneNom=rv.nom; try{renderHomeMeteoCommunes();}catch(e){} }
  }catch(e){}
}

// ── Météo courante pour un point (current + min/max/pluie du jour) ──
// v5.58 — deux défauts corrigés ici.
// (1) Le statut HTTP n'était PAS testé. Open-Meteo répond 429 avec un JSON
//     {error:true,reason:…} qui n'a simplement pas de champ `current` → return null,
//     donc un ⏳ éternel sur la carte et AUCUNE trace nulle part.
// (2) La pastille d'en-tête interroge le modèle Météo-France (fetchMeteo) et les cartes
//     de secteur le modèle par défaut : deux chiffres différents pour la même heure et
//     le même lieu, sur le même écran. Même source désormais, repli sur le défaut.
function _wxFromApi(d){
  if(!d||!d.current||typeof d.current.temperature_2m!=='number') return null;
  var dy=d.daily||{};
  return {
    temp:Math.round(d.current.temperature_2m), code:d.current.weathercode,
    wind:Math.round(d.current.windspeed_10m),
    tmin:(dy.temperature_2m_min&&dy.temperature_2m_min[0]!=null)?Math.round(dy.temperature_2m_min[0]):null,
    tmax:(dy.temperature_2m_max&&dy.temperature_2m_max[0]!=null)?Math.round(dy.temperature_2m_max[0]):null,
    pp:(dy.precipitation_probability_max&&dy.precipitation_probability_max[0]!=null)?dy.precipitation_probability_max[0]:null,
    emoji:wmoEmoji(d.current.weathercode), desc:wmoDesc(d.current.weathercode)
  };
}
async function _wxCurrent(lat,lng){
  var base='https://api.open-meteo.com/v1/forecast?latitude='+lat.toFixed(4)+'&longitude='+lng.toFixed(4)
    +'&current=temperature_2m,weathercode,windspeed_10m,precipitation'
    +'&daily=temperature_2m_min,temperature_2m_max,precipitation_probability_max'
    +'&timezone=Europe/Paris&forecast_days=1';
  var urls=[base+'&models=meteofrance_seamless', base];
  for(var i=0;i<urls.length;i++){
    try{
      var r=await fetch(urls[i]);
      if(!r.ok){
        if(window.logError) window.logError({level:(r.status===429?'warning':'info'),cat:'meteo',
          msg:'Open-Meteo HTTP '+r.status, detail:lat.toFixed(3)+','+lng.toFixed(3)});
        continue;
      }
      var w=_wxFromApi(await r.json());
      if(w) return w;
    }catch(e){
      if(window.logError) window.logError({level:'info',cat:'meteo',
        msg:'Meteo secteur injoignable', detail:String((e&&e.message)||e)});
    }
  }
  return null;
}

// ── Cache du relevé par secteur ──────────────────────────────────────────────
// v5.58 — ce cache n'était NI daté NI rattaché à un domaine, et sa simple présence
// interdisait tout nouvel appel (`if(!store)`). La visite guidée écrivait sa météo
// scénarisée dans cette même clé et ne la nettoyait jamais : de retour sur son vrai
// domaine, le client voyait une journée inventée sur le seul secteur dont le nom
// coïncidait, un ⏳ définitif sur tous les autres — et plus aucune requête, jamais.
var _WXCOM_KEY='mavigne_meteocom_cache';
var _WXCOM_V=2;
var _WXCOM_MAXAGE=45*60*1000;
function _wxTenant(){ try{ return localStorage.getItem('mavigne_tenant')||''; }catch(e){ return ''; } }
function _wxCacheRead(groups){
  var raw=null;
  try{ raw=JSON.parse(localStorage.getItem(_WXCOM_KEY)||'null'); }catch(e){ raw=null; }
  if(!raw||raw.v!==_WXCOM_V||!raw.data) return null;
  if(raw.tenant!==_wxTenant()) return null;                                    // relevé d'un AUTRE domaine
  if(!raw.ts||(Date.now()-raw.ts)>_WXCOM_MAXAGE) return null;                  // périmé
  for(var i=0;i<groups.length;i++){ if(!raw.data[groups[i].key]) return null; } // un secteur manque → incomplet
  return raw;
}
function _wxCacheWrite(res){
  try{ localStorage.setItem(_WXCOM_KEY,JSON.stringify({v:_WXCOM_V,tenant:_wxTenant(),ts:Date.now(),data:res})); }
  catch(e){ if(window.logError) window.logError({level:'info',cat:'meteo',msg:'cache secteur non ecrit'}); }
}
function _wxAgeTxt(ts){
  if(!ts) return '';
  var m=Math.round((Date.now()-ts)/60000);
  if(m<20) return '';
  if(m<90) return 'relevé il y a '+m+' min';
  return 'relevé il y a '+Math.round(m/60)+' h';
}

// ── Récupère la météo de chaque secteur (1 appel par commune distincte) ──
// v5.58 — le drapeau anti-relance retombait après 50 ms, c'est-à-dire au moment où la
// boucle DÉMARRAIT et non quand elle finissait : chaque rendu de l'accueil (un par
// snapshot Firestore, et il y en a douze en temps réel) relançait une série complète
// d'appels. De quoi se faire limiter par Open-Meteo en quelques secondes. Le verrou
// est désormais tenu jusqu'au `finally`, et c'est cette fonction qui le porte.
async function fetchMeteoCommunes(){
  if(window._mvComFetching) return;
  if(window._visiteFakeWx) return;   // visite guidée : météo scénarisée, aucun appel réseau réel
  var groups=_communesActives();
  if(groups.length<2){
    window.METEO_PAR_COMMUNE=null;
    try{localStorage.removeItem(_WXCOM_KEY);}catch(e){}
    try{renderHomeMeteoCommunes();}catch(e2){}
    return;
  }
  window._mvComFetching=true;
  try{
    if(!window._domaineCommuneNom){ try{await _ensureDomaineCommune();}catch(e){} }
    var res={}, ok=0;
    for(var i=0;i<groups.length;i++){
      var g=groups[i];
      var w=await _wxCurrent(g.lat,g.lng);
      if(w) ok++;
      res[g.key]={nom:g.nom, nbParc:g.nbParc, lat:g.lat, lng:g.lng, wx:w};
    }
    window.METEO_PAR_COMMUNE=res;
    window._MV_WXCOM_TS=Date.now();
    if(ok) _wxCacheWrite(res);   // un relevé entièrement vide ne mérite pas d'être gardé
    else if(window.logError) window.logError({level:'warning',cat:'meteo',
      msg:'Aucun secteur meteo obtenu', detail:groups.length+' secteurs'});
    try{renderHomeMeteoCommunes();}catch(e){}
  } finally {
    window._mvComFetching=false;
  }
}

function _wxStoreCard(g,store){
  var d=store&&store[g.key]; var wx=d&&d.wx;
  if(!wx){
    return '<div class="cm-wx-card"><div class="cm-wx-emoji">\u23F3</div><div class="cm-wx-mid"><div class="cm-wx-nom">'+_escHtml(g.nom)+'</div><div class="cm-wx-sub">'+g.nbParc+' parcelle'+(g.nbParc>1?'s':'')+'</div></div></div>';
  }
  var frost=wx.tmin!=null&&wx.tmin<=1;
  var badge=frost?('<span class="cm-wx-badge frost">\u2744 Gel '+wx.tmin+'\u00b0</span>')
            :((wx.pp!=null&&wx.pp>=50)?('<span class="cm-wx-badge rain">\uD83D\uDCA7 '+wx.pp+'%</span>'):'');
  return '<div class="cm-wx-card'+(frost?' alert':'')+'">'+badge
    +'<div class="cm-wx-emoji">'+wx.emoji+'</div>'
    +'<div class="cm-wx-mid"><div class="cm-wx-nom">'+_escHtml(g.nom)+'</div><div class="cm-wx-sub">'+wx.desc
      +(wx.tmin!=null?(' \u00b7 '+wx.tmin+'\u00b0/'+wx.tmax+'\u00b0'):'')+' \u00b7 '+g.nbParc+' p.</div></div>'
    +'<div class="cm-wx-temp"><div class="cm-wx-t">'+wx.temp+'\u00b0</div><div class="cm-wx-w">\uD83C\uDF2C '+wx.wind+'</div></div>'
    +'</div>';
}
// Cartes météo par secteur sur l'accueil (uniquement si ≥2 communes)
function renderHomeMeteoCommunes(){
  var c=document.getElementById('home-meteo-communes'); if(!c) return;
  var groups=_communesActives();
  if(groups.length<2){ c.innerHTML=''; return; }
  var store=window.METEO_PAR_COMMUNE, ts=window._MV_WXCOM_TS||0;
  // Un relevé en mémoire qui ne couvre pas tous les secteurs actuels est périmé :
  // une commune vient d'être affectée, ou l'on revient d'un autre domaine.
  if(store){ for(var i=0;i<groups.length;i++){ if(!store[groups[i].key]){ store=null; ts=0; break; } } }
  if(!store){ var cached=_wxCacheRead(groups); if(cached){ store=cached.data; ts=cached.ts; } }
  if(!store || !ts || (Date.now()-ts)>_WXCOM_MAXAGE){
    setTimeout(function(){ try{fetchMeteoCommunes();}catch(e){} },50);   // le verrou est tenu par fetchMeteoCommunes
  }
  var age=_wxAgeTxt(ts);
  var html='<div class="cm-wx-head">\uD83D\uDDFA\uFE0F M\u00e9t\u00e9o par secteur'
    +(age?('<span class="cm-wx-age">'+_escHtml(age)+'</span>'):'')+'</div><div class="cm-wx-grid">';
  groups.forEach(function(g){ html+=_wxStoreCard(g,store); });
  html+='</div>';
  c.innerHTML=html;
}

// ════ AFFECTATION COMMUNE — édition d'une parcelle ════
var _commEditNom='';
function _dpFillCommune(p){
  var row=document.getElementById('dp-commune-row'); if(!row) return;
  var val=document.getElementById('dp-commune-val');
  var btn=document.getElementById('dp-commune-edit-btn');
  row.style.display='';
  var nom=(p.commune&&p.commune.nom)?p.commune.nom:'';
  if(val){
    if(nom) val.innerHTML='<span style="font-size:15px;font-weight:600;color:var(--texte)">\uD83D\uDCCD '+_escHtml(nom)+'</span>';
    else val.innerHTML='<span style="color:var(--texte-doux);font-style:italic">\u2014 H\u00e9rit\u00e9e du domaine'+(window._domaineCommuneNom?(' ('+_escHtml(window._domaineCommuneNom)+')'):'')+'</span>';
  }
  if(btn){ btn.style.display=isAdmin()?'':'none'; btn.onclick=function(){ openCommuneEdit(p.nom); }; }
}
async function _dpFillParcMeteo(p){
  var el=document.getElementById('dp-parc-meteo'); if(!el) return;
  var geo=_parcelleWeatherGeo(p);
  if(!geo){ el.style.display='none'; return; }
  el.style.display='flex';
  el.innerHTML='<span class="dp-pm-ico">\u23F3</span><span class="dp-pm-txt">M\u00e9t\u00e9o de la parcelle\u2026</span>';
  var w=await _wxCurrent(geo.lat,geo.lng);
  if(el.dataset.nom && el.dataset.nom!==p.nom) return; // overlay a changé entre-temps
  if(!w){ el.innerHTML='<span class="dp-pm-ico">\uD83D\uDCE1</span><span class="dp-pm-txt">M\u00e9t\u00e9o indisponible</span>'; return; }
  var srcLbl=geo.src==='parcelle'?'centro\u00efde parcelle':((p.commune&&p.commune.nom)||'commune');
  el.innerHTML='<span class="dp-pm-ico">'+w.emoji+'</span><span class="dp-pm-txt"><b>'+w.temp+'\u00b0</b> \u00b7 '+w.desc+' \u00b7 vent '+w.wind+' km/h</span><span class="dp-pm-src">'+_escHtml(srcLbl)+'</span>';
}

function openCommuneEdit(nom){
  if(!isAdmin()){ showToast('Affectation des communes r\u00e9serv\u00e9e \u00e0 l\u2019administrateur','#B85A1A'); return; }
  _commEditNom=nom;
  var p=(window.PARCELLES||[]).find(function(x){return x.nom===nom;}); if(!p) return;
  var sub=document.getElementById('comm-sub'); if(sub)sub.textContent=nom+' \u00b7 '+p.surface+' ha';
  var inp=document.getElementById('comm-input'); if(inp)inp.value=(p.commune&&p.commune.nom)?p.commune.nom:'';
  var box=document.getElementById('comm-results'); if(box){box.innerHTML='';box.style.display='none';}
  window._commPick=(p.commune&&p.commune.nom)?{nom:p.commune.nom,lat:parseFloat(p.commune.lat),lng:parseFloat(p.commune.lng)}:null;
  var hasCoords=_geoPlausible(parseFloat(p.lat),parseFloat(p.lng));
  var sg=document.getElementById('comm-suggest'); if(sg)sg.style.display=hasCoords?'flex':'none';
  var hint=document.getElementById('comm-hint');
  if(hint)hint.textContent=hasCoords
    ? 'M\u00e9t\u00e9o de cette parcelle = son centro\u00efde GPS ; la commune sert d\u2019\u00e9tiquette et de repli.'
    : 'Sans coordonn\u00e9es, la m\u00e9t\u00e9o de la parcelle utilisera la commune choisie.';
  _commRenderPick();
  openOv('ovCommune');
  if(hasCoords && !(p.commune&&p.commune.nom)){ _commSuggestFromCoords(true); }   // suggestion auto si vide + géolocalisée
}
function _commRenderPick(){
  var box=document.getElementById('comm-picked'); if(!box) return;
  if(window._commPick&&window._commPick.nom){ box.style.display='block'; box.innerHTML='\u2705 Commune retenue : <b>'+_escHtml(window._commPick.nom)+'</b>'; }
  else { box.style.display='none'; box.innerHTML=''; }
}
var _commTimer=null;
function _commOnInput(){
  var inp=document.getElementById('comm-input'); var box=document.getElementById('comm-results');
  if(!inp||!box) return;
  clearTimeout(_commTimer); var q=inp.value.trim();
  if(q.length<2){ box.style.display='none'; return; }
  _commTimer=setTimeout(async function(){
    var res=await _geocodeCommuneBAN(q);
    if(!res.length){ box.innerHTML='<div class="cm-ac-empty">Aucune commune</div>'; box.style.display='block'; return; }
    window._commRes=res;
    box.innerHTML=res.map(function(r,i){ return '<div class="cm-ac-item" data-i="'+i+'">\uD83D\uDCCD '+_escHtml(r.nom)+(r.cp?(' <small>'+_escHtml(r.cp)+'</small>'):'')+'</div>'; }).join('');
    box.style.display='block';
    box.querySelectorAll('.cm-ac-item').forEach(function(el){ el.onclick=function(){ var r=window._commRes[+el.dataset.i]; window._commPick={nom:r.nom,lat:r.lat,lng:r.lng}; inp.value=r.nom; box.style.display='none'; _commRenderPick(); }; });
  },280);
}
async function _commSuggestFromCoords(silent){
  var p=(window.PARCELLES||[]).find(function(x){return x.nom===_commEditNom;}); if(!p) return;
  var la=parseFloat(p.lat), ln=parseFloat(p.lng);
  if(!_geoPlausible(la,ln)){ if(!silent)showToast('Cette parcelle n\u2019a pas de coordonn\u00e9es','#B85A1A'); return; }
  var sg=document.getElementById('comm-suggest'); var prev=sg?sg.innerHTML:'';
  if(sg)sg.innerHTML='<span>\u23F3 Recherche\u2026</span>';
  var rv=await _reverseCommuneBAN(la,ln);
  if(sg)sg.innerHTML=prev||'<span>\uD83D\uDCCD Sugg\u00e9rer depuis les coordonn\u00e9es GPS</span>';
  if(rv&&rv.nom){
    var inp=document.getElementById('comm-input'); if(inp)inp.value=rv.nom;
    window._commPick={nom:rv.nom,lat:la,lng:ln};   // parcelle géolocalisée → coords = parcelle
    _commRenderPick();
    if(!silent)showToast('Commune sugg\u00e9r\u00e9e : '+rv.nom,'#3D6B27');
  } else if(!silent){ showToast('Commune introuvable depuis les coordonn\u00e9es','#B85A1A'); }
}
function _commAfterSave(){
  closeOv(null,'ovCommune');
  var ovP=document.getElementById('ovParcelle');
  if(ovP&&ovP.classList.contains('open')){ try{openDP(_commEditNom);}catch(e){} }
  var ovB=document.getElementById('ovCommunes');
  if(ovB&&ovB.classList.contains('open')){ try{renderCommunesBulk();}catch(e){} }
  try{ fetchMeteoCommunes(); }catch(e){}
}
function saveCommune(){
  var p=(window.PARCELLES||[]).find(function(x){return x.nom===_commEditNom;}); if(!p) return;
  var pick=window._commPick;
  if(!pick||!pick.nom){ showToast('Choisissez une commune','#B85A1A'); return; }
  p.commune={nom:pick.nom, lat:pick.lat, lng:pick.lng};
  saveData('parcelles');
  _commAfterSave();
  showToast('\uD83D\uDCCD Commune enregistr\u00e9e : '+pick.nom,'#3D6B27');
}
function clearCommune(){
  var p=(window.PARCELLES||[]).find(function(x){return x.nom===_commEditNom;}); if(!p) return;
  delete p.commune; window._commPick=null;
  saveData('parcelles');
  _commAfterSave();
  showToast('Commune retir\u00e9e \u2014 h\u00e9ritage du domaine','#7A6A45');
}

// ════ AFFECTATION COMMUNE — vue groupée (toutes les parcelles) ════
function openCommunesBulk(){ renderCommunesBulk(); openOv('ovCommunes'); }
function renderCommunesBulk(){
  var c=document.getElementById('communes-bulk'); if(!c) return;
  if(!window._domaineCommuneNom){ try{_ensureDomaineCommune();}catch(e){} }
  var domNom=window._domaineCommuneNom||'Domaine';
  var parcs=(window.PARCELLES||[]).filter(function(p){return p.statut!=='Arrachee';}).slice()
    .sort(function(a,b){return String(a.nom).localeCompare(String(b.nom),'fr');});
  var groups=_communesActives();
  var grpHtml = groups.length>=2
    ? ('<div class="cmb-grp-head">'+groups.length+' secteurs m\u00e9t\u00e9o</div>'+groups.map(function(g){
        return '<div class="cmb-grp"><span class="cmb-dot"></span><b>'+_escHtml(g.nom)+'</b><span class="cmb-grp-n">'+g.nbParc+' parcelle'+(g.nbParc>1?'s':'')+' \u00b7 1 m\u00e9t\u00e9o</span></div>';
      }).join(''))
    : '<div class="cmb-note">Une seule commune : m\u00e9t\u00e9o unique du domaine. Affectez des communes diff\u00e9rentes pour activer la m\u00e9t\u00e9o par secteur.</div>';
  var _adm=isAdmin();
  var listHtml=parcs.map(function(p){
    var has=p.commune&&p.commune.nom;
    var tag=has?('<span class="cmb-tag set">\uD83D\uDCCD '+_escHtml(p.commune.nom)+'</span>')
               :('<span class="cmb-tag inherit">\u21B3 '+_escHtml(domNom)+'</span>');
    var gps=_geoPlausible(parseFloat(p.lat),parseFloat(p.lng))
      ? '<span class="cmb-gps" title="Parcelle g\u00e9olocalis\u00e9e \u2014 m\u00e9t\u00e9o = centro\u00efde">\uD83D\uDEF0\uFE0F</span>' : '';
    var clk=_adm?(' onclick="openCommuneEdit(\''+_escAttr(p.nom)+'\')" style="cursor:pointer"'):' style="cursor:default"';
    return '<div class="cmb-row"'+clk+'><div class="cmb-nom">'+_escHtml(p.nom)+gps+'</div><div class="cmb-surf">'+p.surface+' ha</div>'+tag+'</div>';
  }).join('');
  c.innerHTML='<div class="cmb-list">'+listHtml+'</div><div class="cmb-groups">'+grpHtml+'</div>';
}

// ── Exposition globale (onclick injectés) ──
window.fetchMeteoCommunes     = fetchMeteoCommunes;
window.renderHomeMeteoCommunes= renderHomeMeteoCommunes;
window.openCommuneEdit        = openCommuneEdit;
window._commOnInput           = _commOnInput;
window._commSuggestFromCoords = _commSuggestFromCoords;
window.saveCommune            = saveCommune;
window.clearCommune           = clearCommune;
window.openCommunesBulk       = openCommunesBulk;
window.renderCommunesBulk     = renderCommunesBulk;
window._communesActives       = _communesActives;
window._parcelleWeatherGeo    = _parcelleWeatherGeo;
// ════════════════════════════════════════════════════════════════

async function fetchMeteo(){
  if(window._visiteFakeWx) return; // Visite guidée : météo scénarisée → pas de re-fetch
  try{
    var _geo=getDomaineGeo(); var _ll='latitude='+(_geo.lat).toFixed(4)+'&longitude='+(_geo.lng).toFixed(4);
    const r=await fetch('https://api.open-meteo.com/v1/forecast?'+_ll+'&current=temperature_2m,weathercode,windspeed_10m,precipitation&daily=temperature_2m_min,temperature_2m_max,weathercode,precipitation_probability_max&hourly=temperature_2m,precipitation,precipitation_probability,windspeed_10m&timezone=Europe/Paris&forecast_days=5');
    const d=await r.json();
    // Conditions du moment en haute résolution (modèle Météo-France AROME ~1,5 km) — repli sur d.current si indispo
    let cur=d.current;
    try{
      const rHr=await fetch('https://api.open-meteo.com/v1/forecast?'+_ll+'&current=temperature_2m,weathercode,windspeed_10m,precipitation&models=meteofrance_seamless&timezone=Europe/Paris');
      const dHr=await rHr.json();
      if(dHr&&dHr.current&&typeof dHr.current.temperature_2m==='number')cur=dHr.current;
    }catch(eHr){}
    const temp=Math.round(cur.temperature_2m);
    const code=cur.weathercode;
    const wind=Math.round(cur.windspeed_10m);
    const rain=Math.round((cur.precipitation||0)*10)/10;
    const desc=wmoDesc(code);
    const emoji=wmoEmoji(code);
    meteoData={temp,desc,wind,emoji,date:new Date().toISOString().split('T')[0]};
    window.meteoData=meteoData;
    // Gel calculé avant la mise en cache (lu par le journal d'alertes du hub)
    let _gelIdx=-1,_gelTemp=null;
    if(d.daily&&d.daily.time){
      // Widget météo 5 jours (v4.34)
      window.METEO_DAILY={time:d.daily.time,code:d.daily.weathercode||[],tmin:d.daily.temperature_2m_min||[],tmax:d.daily.temperature_2m_max||[],pp:d.daily.precipitation_probability_max||[]};
      try{localStorage.setItem('mavigne_meteo5_cache',JSON.stringify(window.METEO_DAILY));}catch(e2){}
      if(typeof renderHomeMeteo5==='function')renderHomeMeteo5();
      if(d.hourly&&d.hourly.time){ window.METEO_HOURLY={time:d.hourly.time,temp:d.hourly.temperature_2m||[],precip:d.hourly.precipitation||[],pp:d.hourly.precipitation_probability||[],wind:d.hourly.windspeed_10m||[]}; try{localStorage.setItem('mavigne_meteohr_cache',JSON.stringify(window.METEO_HOURLY));}catch(e3){} }
    }
    if(d.daily&&d.daily.temperature_2m_min){
      _gelIdx=d.daily.temperature_2m_min.findIndex(t=>t<3);
      if(_gelIdx>=0)_gelTemp=Math.round(d.daily.temperature_2m_min[_gelIdx]);
    }
    // Sauvegarder en cache avec timestamp (+ info gel)
    try{localStorage.setItem('mavigne_meteo_cache',JSON.stringify({...meteoData,wind,rain,gelIdx:_gelIdx,gelTemp:_gelTemp,ts:Date.now()}));}catch(e){}
    // Badge météo mini dans le header
    _renderMeteoMini(emoji,temp,wind);
    // Alerte gel
    if(_gelIdx>=0){
      const gelIdx=_gelIdx;
      {
        const jrs=['ce soir','demain','après-demain','dans 3 jours','dans 4 jours'];
        const alertDiv=document.getElementById('home-gel-alert')||(()=>{const el=document.createElement('div');el.id='home-gel-alert';el.style.cssText='margin:8px 16px 0;background:#FFF8E8;border:1px solid #F0D080;border-radius:12px;padding:9px 14px;font-size:12px;color:#7A5C10;display:flex;align-items:center;gap:8px;';const card=document.getElementById('home-stat-card');if(card&&card.parentNode)card.parentNode.insertBefore(el,card);return el;})();
        alertDiv.innerHTML=`⚠️ Risque de gel ${jrs[gelIdx]||''} (${Math.round(d.daily.temperature_2m_min[gelIdx])}°C)`;
      }
    }
    // Météo par secteur (≥2 communes) — sinon météo unique du domaine
    try{ if(_communesActives().length>=2){ _ensureDomaineCommune(); fetchMeteoCommunes(); } else { window.METEO_PAR_COMMUNE=null; renderHomeMeteoCommunes(); } }catch(eCom){}
    // Enregistrer dans journal seulement si un vrai travail existe ce jour
    const existant=METEO_JOURNAL.find(m=>m.date===meteoData.date);
    if(!existant){
      METEO_JOURNAL.push({...meteoData});
    }
  }catch(e){
    // Fallback : afficher les données en cache si disponibles
    try{
      const raw=localStorage.getItem('mavigne_meteo_cache');
      if(raw){
        const cache=JSON.parse(raw);
        const ts=cache.ts?new Date(cache.ts):null;
        let label='';
        if(ts){
          const now=new Date();
          const diffH=Math.round((now-ts)/3600000);
          if(diffH<1)label='il y a moins d\'1h';
          else if(diffH<24)label=`il y a ${diffH}h`;
          else{const d=ts.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'});label=`le ${d} à ${ts.getHours()}h${String(ts.getMinutes()).padStart(2,'0')}`;}
        }
        // Afficher en cache dans le badge mini (opacité réduite)
        _renderMeteoMini(cache.emoji||'☁️',cache.temp||'—',cache.wind||'—',true);
      } else {
        // Badge vide offline
        const mini=document.getElementById('hv2-meteo-mini');
        if(mini){mini.style.display='flex';document.getElementById('hv2-mini-ico').textContent='📡';document.getElementById('hv2-mini-temp').textContent='—';document.getElementById('hv2-mini-desc').textContent='Hors ligne';}
      }
    }catch(e2){}
  }
}

// ════ MÉTÉO MOYENNE SUR PÉRIODE DE TÂCHE ════

// Trouve la date de la première entrée "En cours" pour un triplet parcelle+tâche,
// DANS LA PERIODE DE LA VALIDATION — jamais au-dela.
// ⚠️⚠️ DEFAUT REEL corrige le 11/08 : la fonction prenait le minimum sur TOUT le
// journal, sans borne. Une entree « En cours » restee ouverte d'une campagne a
// l'autre — un oubli de validation, ce qui arrive — faisait calculer la moyenne
// meteo sur quatorze mois. Le resultat partait dans `meteo_snapshot`, donc DANS
// LA TRACABILITE, avec l'autorite d'une mesure et aucun signe exterieur.
// Meme famille que l'ecart de cadence : un indicateur bati sur un signal non
// borne ment sans le dire.
// Escalier de bornes, du plus precis au plus sur :
//   1. la PERIODE de `dateRef` (_saisonForDate) — c'est le vocabulaire de
//      l'utilisateur, et c'est la borne du reste de l'app (_mvFinChantier fait
//      exactement ce filtre) ;
//   2. a defaut de periodes saisies, la CAMPAGNE (_mvCampagneDe, source unique
//      de utils.js, ouverture au 1er aout) ;
//   3. a defaut de tout, `dateRef` elle-meme — une moyenne d'un seul jour vaut
//      mieux qu'une moyenne de quatorze mois.
// ⚠️ `dateRef` est la date de la VALIDATION, pas la date du jour : rejouer une
// validation anterieure doit borner sur SA periode, pas sur la periode courante.
function _findDebutTache(parcelle, tache, dateRef){
  var ref=dateRef||new Date().toISOString().split('T')[0];
  var enc=JOURNAL.filter(function(j){return j.parcelle===parcelle&&j.tache===tache&&j.statut==='En cours'&&!j.meteo;});
  if(!enc.length)return null;
  var per=(typeof window._saisonForDate==='function')?window._saisonForDate(ref):'';
  var dans;
  if(per){
    dans=function(d){ return window._saisonForDate(d)===per; };
  }else if(typeof window._mvCampagneDe==='function'){
    var camp=window._mvCampagneDe(ref);
    dans=function(d){ return window._mvCampagneDe(d)===camp; };
  }else{
    dans=function(d){ return d===ref; };
  }
  var ok=enc.filter(function(j){ return j.date<=ref && dans(j.date); });
  if(!ok.length)return null;
  return ok.reduce(function(min,j){return j.date<min?j.date:min;},ok[0].date);
}

// Récupère la météo moyenne sur une plage de dates via Open-Meteo (daily)
async function fetchMeteoMoyenne(dateDebut, dateFin){
  try{
    var today=new Date().toISOString().split('T')[0];
    // Même jour = aujourd'hui : réutiliser le cache courant
    if(dateDebut===dateFin&&dateDebut===today&&meteoData){
      return{temp_moy:meteoData.temp,temp_min:meteoData.temp,temp_max:meteoData.temp,
        vent_moy:meteoData.wind,precip_tot:0,emoji:meteoData.emoji,desc:meteoData.desc,
        date_debut:dateDebut,date_fin:dateFin,nb_jours:1};
    }
    var _geo=getDomaineGeo(); var _ll='latitude='+(_geo.lat).toFixed(4)+'&longitude='+(_geo.lng).toFixed(4);
    var url='https://api.open-meteo.com/v1/forecast?'+_ll
      +'&daily=temperature_2m_mean,temperature_2m_min,temperature_2m_max,windspeed_10m_max,precipitation_sum,weathercode'
      +'&timezone=Europe%2FParis&start_date='+dateDebut+'&end_date='+dateFin;
    var r=await fetch(url);
    var d=await r.json();
    if(!d.daily||!d.daily.time)return null;
    var notNull=function(x){return x!==null&&x!==undefined;};
    var tMoys=d.daily.temperature_2m_mean.filter(notNull);
    var tMins=d.daily.temperature_2m_min.filter(notNull);
    var tMaxs=d.daily.temperature_2m_max.filter(notNull);
    var vents=d.daily.windspeed_10m_max.filter(notNull);
    var precips=d.daily.precipitation_sum.filter(notNull);
    var codes=d.daily.weathercode.filter(notNull);
    if(!tMoys.length)return null;
    var avg=function(a){return a.reduce(function(s,v){return s+v;},0)/a.length;};
    var tempMoy=Math.round(avg(tMoys)*10)/10;
    var tempMin=Math.round(Math.min.apply(null,tMins)*10)/10;
    var tempMax=Math.round(Math.max.apply(null,tMaxs)*10)/10;
    var ventMoy=Math.round(avg(vents));
    var precipTot=Math.round(precips.reduce(function(s,v){return s+v;},0)*10)/10;
    var codeFreq={};
    codes.forEach(function(c){codeFreq[c]=(codeFreq[c]||0)+1;});
    var codeTop=parseInt(Object.entries(codeFreq).sort(function(a,b){return b[1]-a[1];})[0][0]);
    return{temp_moy:tempMoy,temp_min:tempMin,temp_max:tempMax,vent_moy:ventMoy,precip_tot:precipTot,
      emoji:wmoEmoji(codeTop),desc:wmoDesc(codeTop),
      date_debut:dateDebut,date_fin:dateFin,nb_jours:d.daily.time.length};
  }catch(e){
    console.warn('[fetchMeteoMoyenne]',e);
    return null;
  }
}

// ════ SAISON ACTIVE ════
function getSaisonActive(){return SAISONS.find(s=>s.active)||SAISONS[SAISONS.length-1];}
// Tâches de la période CONSULTÉE. La période porte sa propre liste (s.taches) : le nom n'est plus
// interprété. Sans liste (période créée avant la migration), repli sur l'ancien filtre par type.
function getTachesSaison(){
  var vn=(typeof _visuSaison==='function')?_visuSaison():((getSaisonActive()||{}).nom||'');
  var noms=(typeof window._saisonTaches==='function')?window._saisonTaches(vn):null;
  if(noms) return TACHES.filter(function(t){ return t && noms.indexOf(t.nom)>=0; });
  return _tachesSaisonLegacy(vn);
}
// ANCIEN filtre : type de saison déduit du 1er mot du nom (« Printemps 2026 » -> « Printemps »)
// confronté à TACHES[].saisons / .anytime / .saison. Conservé UNIQUEMENT comme source de la
// migration _migrateSaisonTaches et comme repli. Ne plus l'appeler ailleurs : un domaine qui
// nomme ses périodes autrement (« Saison verte », « Campagne 2026 ») n'y trouve rien.
function _tachesSaisonLegacy(nomComplet){
  var nomSaison=String(nomComplet||'').split(' ')[0];
  return TACHES.filter(function(t){
    if(t.anytime) return true;
    if(t.saisons&&t.saisons.length) return t.saisons.indexOf(nomSaison)>=0;
    return t.saison===nomSaison || (t.saison && nomSaison.indexOf(t.saison)>=0);
  });
}

// ============================================================
// Lot 4 — Navigation entre saisons (avancement par saison)
// p.taches = avancement de la saison CONSULTEE (structure plate inchangee).
// p.tachesAll = {saison: avancement} pour les AUTRES saisons. Swap au changement.
// La saison consultee est un pointeur LOCAL (localStorage), jamais persiste en Firestore (isolation equipe).
// ============================================================
let _VISU_SAISON = null;
function _visuSaison(){ return _VISU_SAISON || ((getSaisonActive()||{}).nom) || ''; }
window._visuSaison = _visuSaison;

// ── Pointeur de vue LOCAL (par utilisateur) : JAMAIS persiste en Firestore. ──
function _visuKey(){ return 'mavigne_visu_saison_'+((typeof localStorage!=='undefined'&&localStorage.getItem&&localStorage.getItem('mavigne_tenant'))||''); }
function _visuLoad(){ try{ return localStorage.getItem(_visuKey())||''; }catch(e){ return ''; } }
function _visuSave(nom){ try{ if(nom)localStorage.setItem(_visuKey(),nom); }catch(e){} }
// Accesseur de LECTURE : bloc taches de la saison VUE. Vue===active (equipe + cas courant) => p.taches (transparent).
function _tachesFor(p){
  if(!p) return {};
  var v=_VISU_SAISON, act=((getSaisonActive()||{}).nom)||'';
  if(!v || v===act){ return (p.taches&&typeof p.taches==='object'&&!Array.isArray(p.taches))?p.taches:{}; }
  var ta=(p.tachesAll&&typeof p.tachesAll==='object')?p.tachesAll:{};
  return (ta[v]&&typeof ta[v]==='object'&&!Array.isArray(ta[v]))?ta[v]:{};
}
window._tachesFor=_tachesFor;
// Vrai quand on regarde la saison active (ou avant init du pointeur). p.taches (=active) n'est ecrit que dans ce cas.
function _mvOnActiveSaison(){ var v=_VISU_SAISON, act=((getSaisonActive()||{}).nom)||''; return (!v)||(!act)||(v===act); }
window._mvOnActiveSaison=_mvOnActiveSaison;
// Garde de validation : bloque toute ecriture d'avancement quand on CONSULTE une saison non-active.
function _mvValidBlocked(){
  if(_mvOnActiveSaison()) return false;
  var v=_VISU_SAISON, act=((getSaisonActive()||{}).nom)||'';
  if(typeof showToast==='function') showToast('Consultation de \u00ab '+v+' \u00bb \u2014 la validation se fait sur la saison active ('+act+')','#B85A1A');
  return true;
}
window._mvValidBlocked=_mvValidBlocked;

// vrai si un bloc taches porte au moins une progression (texte "Valide" / objet passages/niveaux).
function _tachesObjHasProg(t){
  if(!t||typeof t!=='object')return false;
  function _hp(v){
    if(v==null||v===false)return false;
    if(typeof v==='string'){var s=v.trim();return s!==''&&s!=='Non démarré'&&s!=='Non demarre'&&s!=='null';}
    if(typeof v==='number')return v>0;
    if(v===true)return true;
    if(Array.isArray(v))return v.some(_hp);
    if(typeof v==='object'){for(var k in v){if(Object.prototype.hasOwnProperty.call(v,k)&&_hp(v[k]))return true;}return false;}
    return false;
  }
  for(var kk in t){ if(Object.prototype.hasOwnProperty.call(t,kk)&&_hp(t[kk])) return true; }
  return false;
}
window._tachesObjHasProg=_tachesObjHasProg;

// ════ MIGRATION one-shot : chaque période porte sa liste de tâches ════
// Avant : la liste était DÉDUITE du 1er mot du nom de la période. Une période nommée autrement
// (« Saison verte », « Campagne 2026 », le « Saison en cours » d'un domaine neuf) ne matchait
// rien -> aucune tâche sauf « toute l'année », en silence. Après : la liste est explicite.
// Idempotent (ne touche que les périodes sans liste). 100 % additif : aucune garde anti-perte
// n'est concernée, le nombre de périodes ne bouge pas.
function _migrateSaisonTaches(){
  var arr=(window.SAISONS||[]); if(!arr.length) return;
  var tous=(TACHES||[]).map(function(t){return t.nom;});
  var changed=false;
  arr.forEach(function(s){
    if(!s || Array.isArray(s.taches)) return;
    var noms=_tachesSaisonLegacy(s.nom||'').map(function(t){return t.nom;});
    // Repli : une période où l'ancien filtre ne rendait RIEN était un écran vide sans recours.
    // On lui donne le référentiel complet du domaine, à charge pour l'admin d'élaguer.
    s.taches = noms.length ? noms : tous.slice();
    changed=true;
  });
  if(!changed) return;
  window.SAISONS=arr;
  try{ if(typeof saveData==='function') saveData('saisons'); }
  catch(e){ if(typeof logError==='function') logError({level:'warning',cat:'data',msg:'Migration liste de tâches par période non enregistrée',detail:String(e&&e.message||e)}); }
}
window._migrateSaisonTaches=_migrateSaisonTaches;

function _migrateTachesSaison(){
  var act=((getSaisonActive()||{}).nom)||'';
  _migrateSaisonTaches();
  (PARCELLES||[]).forEach(function(p){
    if(!p.tachesAll||typeof p.tachesAll!=='object'||Array.isArray(p.tachesAll)) p.tachesAll={};
    if(!p.taches||typeof p.taches!=='object'||Array.isArray(p.taches)) p.taches={};
  });
  // Pointeur de vue = LOCAL (localStorage), valide contre les saisons existantes ; defaut = active.
  var stored=_visuLoad();
  var exists=(window.SAISONS||[]).some(function(s){return s&&s.nom===stored;});
  _VISU_SAISON=(stored&&exists)?stored:act;
  // Purge du pointeur partage historique : n'est plus lu -> on le retire de CONFIG en memoire pour
  // qu'il cesse de se propager au prochain save config (la consultation n'ecrit plus jamais config).
  if(CONFIG && CONFIG.visuSaison!==undefined){ try{ delete CONFIG.visuSaison; }catch(e){} }
  if(!act) return;
  // Re-epinglage ONE-TIME : p.taches DOIT etre la saison ACTIVE. Le tag _tachesSaison (ecrit
  // atomiquement avec p.taches) dit ce que p.taches contient reellement ; toute donnee non-active est
  // rangee sous son vrai nom dans tachesAll, l'active promue dans p.taches. Total progression inchange
  // (re-etiquetage) -> garde anti-ecrasement non declenchee. Idempotent au chargement suivant.
  var changed=false;
  (PARCELLES||[]).forEach(function(p){
    var real=p._tachesSaison||act;   // sans tag : p.taches est repute etre l'active (cas nominal)
    if(real===act){ if(p._tachesSaison!==act){ p._tachesSaison=act; changed=true; } return; }
    p.tachesAll[real]=p.taches;
    p.taches=p.tachesAll[act]||{};
    delete p.tachesAll[act];
    p._tachesSaison=act;
    changed=true;
  });
  if(changed){ try{ if(typeof saveData==='function') saveData('parcelles'); }catch(e){} }
  // Le pointeur de vue (_VISU_SAISON) vient d'etre pose depuis localStorage : purger + reconstruire
  // TRAVAUX pour qu'il reflete la saison CONSULTEE des le 1er rendu. Sinon le cache TRAVAUX, peuple
  // pendant le chargement avec la saison ACTIVE, reste servi pour les taches simples -> avancement
  // 100% « fantome » au F5. Idem _switchSaison / activateSaison.
  try{
    Object.keys(TRAVAUX).forEach(function(n){delete TRAVAUX[n];});
    TACHES.forEach(function(t){recalcTravaux(t.nom);}); window.TRAVAUX=TRAVAUX;
  }catch(e){}
}
window._migrateTachesSaison=_migrateTachesSaison;

function _switchSaison(nom, silent){
  if(!nom) return;
  _VISU_SAISON=nom;
  _visuSave(nom);
  // La consultation n'ecrit RIEN (ni parcelles ni config). p.taches reste la saison ACTIVE ; les
  // lectures passent par _tachesFor(). On recalcule TRAVAUX pour la saison vue + rendu.
  Object.keys(TRAVAUX).forEach(function(n){delete TRAVAUX[n];});
  TACHES.forEach(function(t){recalcTravaux(t.nom);}); window.TRAVAUX=TRAVAUX;
  if(!silent && typeof _renderAfterSaison==='function') _renderAfterSaison();
}
window._switchSaison=_switchSaison;

// Reconstruction de l'avancement d'une saison à partir du JOURNAL (Réglages › Saisons).
// Des tâches validées peuvent exister dans le journal (ex. tailles d'hiver) alors que l'avancement
// structuré de la saison est vide (validations jamais écrites dans le bloc taches de cette saison).
// Le journal fait foi -> on reconstitue le bloc de la saison CONSULTÉE à partir des entrées « Validé »
// dont la date tombe dans la fenêtre [debut, fin]. 100 % ADDITIF (ne pose que du « Validé », ne retire
// jamais rien) -> la garde anti-écrasement saison-aware n'est jamais déclenchée, aucune donnée perdue.
// Un statut simple n'est reconstruit que si son DERNIER état au journal est « Validé » ; pour les tâches
// à passages/niveaux, on marque les sous-index validés vus (sauf si le dernier état est « Annulé »).
function _mvReconWriteBlock(p){
  if(_mvOnActiveSaison()){
    if(!p.taches||typeof p.taches!=='object'||Array.isArray(p.taches)) p.taches={};
    return p.taches;
  }
  var vn=_visuSaison();
  if(!p.tachesAll||typeof p.tachesAll!=='object'||Array.isArray(p.tachesAll)) p.tachesAll={};
  if(!p.tachesAll[vn]||typeof p.tachesAll[vn]!=='object'||Array.isArray(p.tachesAll[vn])) p.tachesAll[vn]={};
  return p.tachesAll[vn];
}
function _mvReconType(nom){
  var found=null;
  (TACHES||[]).concat(TACHES_CATALOGUE||[]).some(function(t){ if(t&&t.nom===nom){found=t;return true;} return false; });
  if(!found) return null;
  if(found.type==='passages'||nom==='Ebourgeonnage'||nom==='Pioche') return 'passages';
  if(found.type==='niveaux'||nom==='Relevage') return 'niveaux';
  return 'simple';
}
function _mvReconPlan(){
  var vn=(typeof _visuSaison==='function'?_visuSaison():((getSaisonActive()||{}).nom||''));
  var sObj=(SAISONS||[]).filter(function(s){return s&&s.nom===vn;})[0];
  if(!sObj) return {err:'Aucune saison consultée.'};
  if(!sObj.debut||!sObj.fin) return {err:'La saison « '+vn+' » n'+"'"+'a pas de dates — impossible de borner le journal.'};
  var d0=String(sObj.debut), d1=String(sObj.fin);
  var byNom={};
  (PARCELLES||[]).forEach(function(p){ if(p&&p.nom!=null) byNom[String(p.nom).trim()]=p; });
  var groups={};
  (JOURNAL||[]).forEach(function(j){
    if(!j||j.meteo) return;
    var dt=String(j.date||''); if(!dt||dt<d0||dt>d1) return;
    var nom=String(j.parcelle||'').trim();
    if(!nom||nom==='Domaine'||!byNom[nom]) return;
    var tache=String(j.tache||'').trim();
    var ty=_mvReconType(tache); if(!ty) return;
    var st=String(j.statut||''); if(st!=='Validé'&&st!=='En cours'&&st!=='Annulé') return;
    var gN=groups[nom]||(groups[nom]={});
    var g=gN[tache]||(gN[tache]={type:ty,last:'',lastDate:'',pass:{},niv:{}});
    if(dt>g.lastDate){ g.last=st; g.lastDate=dt; }
    if(st==='Validé'){
      (Array.isArray(j.passages)?j.passages:[]).forEach(function(i){ g.pass[i]=1; });
      (Array.isArray(j.niveaux)?j.niveaux:[]).forEach(function(i){ g.niv[i]=1; });
    }
  });
  var plan=[], parTache={};
  Object.keys(groups).forEach(function(nom){
    var p=byNom[nom]; if(!p) return;
    var cur=(typeof _tachesFor==='function')?(_tachesFor(p)||{}):{};
    Object.keys(groups[nom]).forEach(function(tache){
      var g=groups[nom][tache];
      if(g.last==='Annulé') return;
      if(g.type==='simple'){
        if(g.last!=='Validé') return;
        if(cur[tache]==='Validé') return;
        plan.push({nom:nom,tache:tache,type:'simple'});
      } else {
        var pref=(g.type==='passages')?'p':'n';
        var idx=Object.keys(g.type==='passages'?g.pass:g.niv);
        if(!idx.length) return;
        var curBlk=(cur[tache]&&typeof cur[tache]==='object'&&!Array.isArray(cur[tache]))?cur[tache]:{};
        var add=idx.filter(function(i){ return curBlk[pref+i]!=='Validé'; });
        if(!add.length) return;
        plan.push({nom:nom,tache:tache,type:g.type,idx:add});
      }
      parTache[tache]=(parTache[tache]||0)+1;
    });
  });
  return {vn:vn,plan:plan,parTache:parTache,byNom:byNom};
}
function _mvReconApply(res){
  var n=0, actNom=((getSaisonActive()||{}).nom)||'';
  res.plan.forEach(function(it){
    var p=res.byNom[it.nom]; if(!p) return;
    var blk=_mvReconWriteBlock(p);
    if(it.type==='simple'){ blk[it.tache]='Validé'; n++; }
    else {
      var pref=(it.type==='passages')?'p':'n';
      var cur=(blk[it.tache]&&typeof blk[it.tache]==='object'&&!Array.isArray(blk[it.tache]))?blk[it.tache]:{};
      it.idx.forEach(function(i){ cur[pref+i]='Validé'; });
      blk[it.tache]=cur; n++;
    }
    if(_mvOnActiveSaison()&&actNom) p._tachesSaison=actNom;
  });
  try{ if(typeof saveData==='function') saveData('parcelles'); }catch(e){}
  try{ Object.keys(TRAVAUX).forEach(function(k){delete TRAVAUX[k];}); TACHES.forEach(function(t){recalcTravaux(t.nom);}); window.TRAVAUX=TRAVAUX; }catch(e){}
  try{ if(typeof _renderAfterSaison==='function') _renderAfterSaison(); }catch(e){}
  if(typeof showToast==='function') showToast('✅ Avancement reconstruit — '+n+' validation'+(n>1?'s':'')+' ajoutée'+(n>1?'s':'')+' à « '+res.vn+' »','#3D6B27');
}
function _mvRepairSaisonProg(){
  try{
    var res=_mvReconPlan();
    if(res.err){ if(typeof showToast==='function') showToast('⚠️ '+res.err,'#B85A1A'); return; }
    if(!res.plan.length){ if(typeof showToast==='function') showToast('✅ Rien à reconstruire — l'+"'"+'avancement de « '+res.vn+' » reflète déjà le journal','#3D6B27'); return; }
    var tot=res.plan.length;
    var det=Object.keys(res.parTache).sort().map(function(t){ return t+' : '+res.parTache[t]; }).join('   ·   ');
    var sub=det+'   → « Validé ». Rien ne sera supprimé.';
    openConfirmDel('Reconstruire « '+res.vn+' » ?', sub, function(){ _mvReconApply(res); }, '🩹', 'Reconstruire ('+tot+')', '#3D6B27');
  }catch(e){ console.error('[reconstruction]',e); if(typeof showToast==='function') showToast('Erreur reconstruction','#B85A1A'); }
}
window._mvRepairSaisonProg=_mvRepairSaisonProg;

function _renderAfterSaison(){
  try{ if(typeof applyVigneSaison==='function')applyVigneSaison(); }catch(e){}
  try{ if(typeof renderHome==='function')renderHome(); }catch(e){}
  try{ if(typeof renderParcelles==='function')renderParcelles(); }catch(e){}
  try{ if(typeof renderPilotage==='function'&&document.getElementById('page-pilotage')&&document.getElementById('page-pilotage').classList.contains('active'))renderPilotage(); }catch(e){}
  _updateSaisonSelector();
  _seasonMenuClose();
}
window._renderAfterSaison=_renderAfterSaison;

function _fmtSaisonDatesSel(s){
  function f(iso){var pp=String(iso).split('-');if(pp.length!==3)return iso;var mo=['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];return parseInt(pp[2],10)+' '+mo[parseInt(pp[1],10)-1]+' '+pp[0];}
  return f(s.debut)+' \u2192 '+f(s.fin);
}

function _updateSaisonSelector(){
  var vn=_visuSaison(), act=((getSaisonActive()||{}).nom)||'';
  ['saison-badge-home','saison-badge-parc','saison-badge-jour'].forEach(function(id){
    var el=document.getElementById(id); if(el)el.textContent=vn+(vn!==act?' \u00b7 consult\u00e9e':'');
  });
  var pill=document.getElementById('hv2-saison-pill');
  if(pill) pill.classList.toggle('consult', vn!==act);
  var menu=document.getElementById('saison-menu');
  if(menu){
    var hint=menu.querySelector('.sm-hint');
    menu.querySelectorAll('.sm-item').forEach(function(x){x.remove();});
    (((typeof isAdmin==='function'&&isAdmin())?(SAISONS||[]):(SAISONS||[]).filter(function(s){return s&&s.active;}))).forEach(function(s){
      var it=document.createElement('div');
      it.className='sm-item'+(s.nom===vn?' sel':'');
      it.onclick=function(e){ if(e)e.stopPropagation(); _switchSaison(s.nom); };
      var dt=(s.debut&&s.fin)?_fmtSaisonDatesSel(s):(s.periode||'');
      it.innerHTML='<div class="sm-l"><div class="sm-n">'+_escHtml(s.nom)+(s.active?' <span class="sm-act">active</span>':'')+'</div>'+(dt?'<div class="sm-d">'+_escHtml(dt)+'</div>':'')+'</div>'+(s.nom===vn?'<span class="sm-ck">\u2713</span>':'');
      if(hint)menu.insertBefore(it,hint); else menu.appendChild(it);
    });
  }
}
window._updateSaisonSelector=_updateSaisonSelector;

function _seasonMenuToggle(e){ if(e)e.stopPropagation(); var m=document.getElementById('saison-menu'); var pl=document.getElementById('hv2-saison-pill'); if(!m)return; var willOpen=!m.classList.contains('open'); if(willOpen){ if(m.parentNode!==document.body)document.body.appendChild(m); _updateSaisonSelector(); if(pl){var r=pl.getBoundingClientRect(); m.style.top=(r.bottom+6)+'px'; m.style.left=Math.max(8,Math.min(r.left,(window.innerWidth||360)-262))+'px';} m.classList.add('open'); if(pl)pl.classList.add('open'); } else { _seasonMenuClose(); } }
window._seasonMenuToggle=_seasonMenuToggle;
function _seasonMenuClose(){ var m=document.getElementById('saison-menu'); var pl=document.getElementById('hv2-saison-pill'); if(m)m.classList.remove('open'); if(pl)pl.classList.remove('open'); }
window._seasonMenuClose=_seasonMenuClose;
document.addEventListener('click', function(ev){ var m=document.getElementById('saison-menu'); if(m&&m.classList.contains('open')){ var pl=document.getElementById('hv2-saison-pill'); if(pl&&!pl.contains(ev.target))_seasonMenuClose(); } });

// ════ HEURES ════
function calcHeures(){
  const tachesSaison=getTachesSaison();
  let totalReste=0,totalTotal=0;
  const data=tachesSaison.map(t=>{
    const surfT=_surfConcern(t.nom);            // surface concernée par cette tâche
    const parcT=_parcConcern(t.nom);            // parcelles concernées (hors désactivées)
    // Tâches multi-type : toujours recalculer (évite cache périmé)
    const _isNiv=t.type==='niveaux'||t.nom==='Relevage';
    const _isPass=t.type==='passages'||t.nom==='Ebourgeonnage'||t.nom==='Pioche';
    if(_isNiv||_isPass){
      recalcTravaux(t.nom);
      const tw=TRAVAUX[t.nom]||{pct:0,h_done:0,h_total:0,h_reste:0};
      totalReste+=tw.h_reste; totalTotal+=tw.h_total;
      // Détail par niveau (Relevage)
      let detail=null;
      if(_isNiv){
        const rPlanGlob=SAISON_PASSAGES[t.nom]||3;
        const allNivsRef=t.niveaux||[{num:1,hha:50},{num:2,hha:25},{num:3,hha:25}];
        const nivsRef=allNivsRef.filter(function(n){return n.num<=rPlanGlob;});
        detail=nivsRef.map(niv=>{
          const cnt=parcT.filter(p=>{
            const s=_tachesFor(p)[t.nom];
            // Ancien format string 'Validé' = tâche complète → tous les niveaux sont faits
            if(!s||typeof s==='string')return s==='Validé';
            // Un niveau 'Auto' a été SAUTÉ : N passages faits = les N PREMIERS niveaux.
            return niv.num <= window._mvNivH(nivsRef,s).n;
          });
          const sd=cnt.reduce((s,p)=>s+p.surface,0);
          const pct=surfT>0?Math.round(sd/surfT*100):0;
          return{num:niv.num,hha:niv.hha,pct,h_done:Math.round(niv.hha*sd*10)/10,h_total:Math.round(niv.hha*surfT)};
        });
      }
      // Détail par passage (Eb/Pioche)
      if(_isPass){
        const planNb=SAISON_PASSAGES[t.nom]||2;
        detail=Array.from({length:planNb},(_,i)=>i+1).map(pi=>{
          const cnt=parcT.filter(p=>{
            const s=_tachesFor(p)[t.nom];
            if(!s)return false;
            // Ancien format string 'Validé' = tâche complète → tous les passages sont faits
            if(typeof s==='string')return s==='Validé';
            return s['p'+pi]==='Validé';
          });
          const sd=cnt.reduce((s,p)=>s+p.surface,0);
          const pct=surfT>0?Math.round(sd/surfT*100):0;
          const phha=_getPassHha(t,pi);
          return{num:pi,hha:phha,pct,h_done:Math.round(phha*sd*10)/10,h_total:Math.round(phha*surfT)};
        });
      }
      // pct parent basé sur h_done/h_total (reflète les niveaux/passages partiels)
      const _hPct=tw.h_total>0?Math.round(tw.h_done/tw.h_total*100):0;
      return{nom:t.nom,type:_isNiv?'niveaux':'passages',pct:_hPct,h_done:tw.h_done,h_total:tw.h_total,h_reste:tw.h_reste,detail};
    }
    // Entreplantation : pilotée par les trous (tarière). Aucun trou = 0 (rien à entreplanter).
    if(t.trous || t.nom==='Entreplantation'){
      const _mt=_plantMinTrou();
      const _pv=parcT.filter(p=>getTacheStatut(p,t.nom)==='Validé');
      const _ptt=_plantTrousTot(parcT);
      if(_ptt>0){
        const _ptd=_plantTrousTot(_pv);
        const _ht=Math.round(_ptt*_mt/60*10)/10;
        const _hd=Math.round(_ptd*_mt/60*10)/10;
        const _hr=Math.round((_ht-_hd)*10)/10;
        const _pc=Math.round(_ptd/_ptt*100);
        TRAVAUX[t.nom]={h_ha:0,saison:((t.saisons&&t.saisons[0])||t.saison||''),surf_done:Math.round(_pv.reduce((s,p)=>s+(p.surface||0),0)*100)/100,surf_total:surfT,pct:_pc,h_total:_ht,h_done:_hd,h_reste:_hr,trous_total:_ptt,trous_done:_ptd,min_trou:_mt};
        totalReste+=_hr;totalTotal+=_ht;
        return{nom:t.nom,pct:_pc,h_done:_hd,h_total:_ht,h_reste:_hr,trous_total:_ptt,trous_done:_ptd};
      } else {
        const _sd=_pv.reduce((s,p)=>s+(p.surface||0),0);
        const _ht=Math.round((t.hha||0)*surfT);
        const _hd=Math.round((t.hha||0)*_sd*10)/10;
        const _hr=Math.round((_ht-_hd)*10)/10;
        const _pc=surfT>0?Math.round(_sd/surfT*100):0;
        TRAVAUX[t.nom]={h_ha:(t.hha||0),saison:((t.saisons&&t.saisons[0])||t.saison||''),surf_done:Math.round(_sd*100)/100,surf_total:surfT,pct:_pc,h_total:_ht,h_done:_hd,h_reste:_hr};
        totalReste+=_hr;totalTotal+=_ht;
        return{nom:t.nom,pct:_pc,h_done:_hd,h_total:_ht,h_reste:_hr};
      }
    }
    // Tâche simple : TOUJOURS recalculer. Le cache TRAVAUX peut etre perime apres un changement de
    // saison consultee (les taches simples ne se recalculaient pas et gardaient l'avancement de la
    // saison active) -> aligne sur les branches niveaux/passages/trous qui recalculent deja a la volee.
    const validees=parcT.filter(p=>getTacheStatut(p,t.nom)==='Validé');
    const surfDone=validees.reduce((s,p)=>s+(p.surface||0),0);
    const hTotal=Math.round(t.hha*surfT);
    const hDone=Math.round(t.hha*surfDone*10)/10;
    const hReste=Math.round((hTotal-hDone)*10)/10;
    const pct=surfT>0?Math.round(surfDone/surfT*100):0;
    TRAVAUX[t.nom]={h_ha:t.hha,saison:((t.saisons&&t.saisons[0])||t.saison||''),surf_done:Math.round(surfDone*100)/100,surf_total:surfT,pct,h_total:hTotal,h_done:hDone,h_reste:hReste};
    totalReste+=hReste;totalTotal+=hTotal;
    return{nom:t.nom,pct,h_done:hDone,h_total:hTotal,h_reste:hReste};
  });
  return{data,totalReste:Math.round(totalReste),totalTotal:Math.round(totalTotal)};
}

function renderHeuresCard(containerId){
  const {data,totalReste}=calcHeures();
  const c=document.getElementById(containerId);
  function _col(pct){return pct===100?'var(--vert-med)':pct>=50?'var(--or)':'var(--orange)';}
  function _bar(pct,col){return `<div class="htache-bar-track" aria-hidden="true"><div class="htache-bar-fill" style="width:${pct}%;background:${col}"></div></div>`;}
  // Grid CSS aligné : col1=label(72px) col2=barre(1fr) col3=%(40px) col4=h_total(90px)
  const G='display:grid;grid-template-columns:72px 1fr 40px 90px;gap:0 6px;align-items:center;';
  c.innerHTML=`<div class="hc-head"><div class="hc-title">Avancement — ${_visuSaison()}</div><div class="hc-total"><div class="hc-total-val">${totalReste}h</div><div class="hc-total-lbl">Restantes</div></div></div>`
    +data.map(t=>{
      const col=_col(t.pct);
      // ── Multi-niveaux (Relevage) : ligne parent globale + sous-ligne par niveau ──
      if(t.detail&&(t.type==='niveaux'||t.nom==='Relevage')){
        const subRows=t.detail.map(niv=>{
          const nc=_col(niv.pct);
          return `<div style="${G}padding:2px 0 2px 0;">
            <span style="font-size:10px;font-weight:700;color:${nc};padding-left:14px">N${niv.num}</span>
            ${_bar(niv.pct,nc)}
            <span style="font-size:10px;color:${nc};font-weight:700;text-align:right">${niv.pct}%</span>
            <span style="font-size:10px;color:var(--texte-doux);text-align:right">${niv.h_done}/${niv.h_total}h</span>
          </div>`;
        }).join('');
        // Ligne parent : barre globale (h_done/h_total) + sous-lignes
        return `<div class="htache-row" style="flex-direction:column;align-items:stretch;gap:1px">
          <div style="${G}padding:5px 0 2px;">
            <div class="htache-nom" style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${TEMOJI[t.nom]||'🌿'} ${tNom(t.nom)}</div>
            ${_bar(t.pct,col)}
            <div class="htache-pct" style="color:${col};text-align:right;font-size:13px">${t.pct}%</div>
            <div style="font-size:10px;color:var(--texte-doux);text-align:right">${t.h_done}h/${t.h_total}h</div>
          </div>
          ${subRows}
        </div>`;
      }
      // ── Multi-passages (Eb/Pioche) : ligne parent globale + sous-ligne par passage ──
      if(t.detail&&(t.type==='passages'||t.nom==='Ebourgeonnage'||t.nom==='Pioche')){
        // 1 seul passage configuré → affichage simple
        if(t.detail.length===1){
          const pas=t.detail[0];const nc=_col(pas.pct);
          return `<div class="htache-row" style="${G}padding:6px 0;">
            <div class="htache-nom" style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${TEMOJI[t.nom]||'🌿'} ${tNom(t.nom)}</div>
            ${_bar(pas.pct,nc)}
            <div class="htache-pct" style="color:${nc};text-align:right;font-size:13px">${pas.pct}%</div>
            <div style="font-size:10px;color:var(--texte-doux);text-align:right">${pas.h_done}/${pas.h_total}h</div>
          </div>`;
        }
        // 2+ passages → ligne parent + sous-lignes par passage
        const subRows=t.detail.map(pas=>{
          const nc=_col(pas.pct);
          return `<div style="${G}padding:2px 0 2px 0;">
            <span style="font-size:10px;font-weight:700;color:${nc};padding-left:14px">P${pas.num}</span>
            ${_bar(pas.pct,nc)}
            <span style="font-size:10px;color:${nc};font-weight:700;text-align:right">${pas.pct}%</span>
            <span style="font-size:10px;color:var(--texte-doux);text-align:right">${pas.h_done}/${pas.h_total}h</span>
          </div>`;
        }).join('');
        return `<div class="htache-row" style="flex-direction:column;align-items:stretch;gap:1px">
          <div style="${G}padding:5px 0 2px;">
            <div class="htache-nom" style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${TEMOJI[t.nom]||'🌿'} ${tNom(t.nom)}</div>
            ${_bar(t.pct,col)}
            <div class="htache-pct" style="color:${col};text-align:right;font-size:13px">${t.pct}%</div>
            <div style="font-size:10px;color:var(--texte-doux);text-align:right">${t.h_done}h/${t.h_total}h</div>
          </div>
          ${subRows}
        </div>`;
      }
      // ── Simple ────────────────────────────────────────────────────────
      return `<div class="htache-row" style="${G}padding:6px 0;">
        <div class="htache-nom" style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${TEMOJI[t.nom]||'🌿'} ${tNom(t.nom)}</div>
        ${_bar(t.pct,col)}
        <div class="htache-pct" style="color:${col};text-align:right;font-size:13px">${t.pct}%</div>
        <div style="font-size:10px;color:var(--texte-doux);text-align:right">${t.h_done}h / ${t.h_total}h</div>
      </div>`;
    }).join('');
}


/* ══ HUB — Thèmes saisonniers carte Vigne ══ */
const HUB_SAISON_THEMES = {
  Printemps:{bg:'#1B3A1F',dot:'#E8708A',txt:'#E8708A',sub:'rgba(255,255,255,0.38)',border:'rgba(255,255,255,0.06)',pillBg:'rgba(232,112,138,0.15)',pillTxt:'#E8708A',darkText:false},
  Été:      {bg:'#0F2210',dot:'#F5D328',txt:'#F5D328',sub:'rgba(255,255,255,0.38)',border:'rgba(255,255,255,0.06)',pillBg:'rgba(245,211,40,0.18)',pillTxt:'#D4B410',darkText:false},
  Automne:  {bg:'#C0641A',dot:'#1A3A12',txt:'#0E2A0A',sub:'rgba(14,42,10,0.65)',border:'rgba(0,0,0,0.1)',pillBg:'rgba(14,42,10,0.18)',pillTxt:'#1A3A12',darkText:true},
  Hiver:    {bg:'#EEF0F2',dot:'#7A4A28',txt:'#5A3318',sub:'rgba(90,51,24,0.55)',border:'rgba(0,0,0,0.08)',pillBg:'rgba(122,74,40,0.12)',pillTxt:'#7A4A28',darkText:true},
};

function applyVigneSaison(){
  const saison=getSaisonActive();if(!saison)return;
  const key=['Printemps','Été','Automne','Hiver'].find(k=>saison.nom.includes(k))||'Printemps';
  const t=HUB_SAISON_THEMES[key]||HUB_SAISON_THEMES.Printemps;
  const r=document.documentElement.style;
  r.setProperty('--vigne-bg',t.bg);r.setProperty('--vigne-dot',t.dot);r.setProperty('--vigne-txt',t.txt);
  r.setProperty('--vigne-sub',t.sub);r.setProperty('--vigne-border',t.border);
  r.setProperty('--vigne-pill-bg',t.pillBg);r.setProperty('--vigne-pill-txt',t.pillTxt);
}

// ════════════════════════════════════════════════════════════════
// CAVE — MODULE ÉLEVAGE
// ════════════════════════════════════════════════════════════════




// ── Planning RH → src/planning.js ──


// ════ LOT 3 — DOCK BAS (navigation globale ; remplace hub + sidebar) ════
function _canPilotage(){ return (typeof isAdmin==='function'&&isAdmin()) || !!(currentUser&&currentUser.roles&&currentUser.roles.indexOf('pilotage')>=0); }
window.canSeePilotage=_canPilotage;

// ═══════════════════════════════════════════════════════════════════════════
// MODE DU JOUR (v5.93) — « Tu prends le tracteur aujourd'hui ? »
// ---------------------------------------------------------------------------
// Le tracteur se prend pour la JOURNEE : on attelle le matin, on detelle le soir.
// Mais le lendemain la meme personne peut repartir au terrain. Le mode est donc
// journalier — ni permanent (il se tromperait un jour sur deux), ni redemande a
// chaque ouverture (la question est deja tranchee a 8 h).
//
// LA QUESTION PORTE SUR LE FAIT, PAS SUR L'IDENTITE. « Tu prends le tracteur
// aujourd'hui ? » et non « Ouvrier ou tractoriste ? » : un polyvalent n'a pas a
// choisir qui il est chaque matin, et « Ouvrier » ne doit pas se lire comme une
// retrogradation.
//
// ⚠️ LE MODE NE TOUCHE A AUCUN DROIT. Il ne fait que RANGER le dock et choisir
// l'atterrissage. Une personne en mode terrain reste tractoriste au sens des
// regles Firestore et des gardes isTractoriste(). Ne jamais ecrire
// `if (_mvMode()==='tracteur')` comme garde de securite : ce n'en est pas une.
//
// Rien ne disparait : ce qui sort des 4 cases du dock passe sous « Plus », et la
// feuille « Plus » porte la sortie du mode. Un module introuvable coute plus cher
// qu'un module de trop.
//
// Propose UNIQUEMENT a qui cumule ouvrier + tractoriste (hors admin, qui a besoin
// de tout) ET quand une session tracteur est reellement ouverte. Sans session
// ouverte, rien ne change : c'est le comportement habituel.
// ═══════════════════════════════════════════════════════════════════════════
function _mvModeKey(){ return 'mavigne_mode_'+(window.TENANT_ID||'default')+'_'+((currentUser&&currentUser.nom)||'anon'); }
function _mvModeAuj(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function _mvModeDouble(){
  var r=(currentUser&&currentUser.roles)||[];
  return r.indexOf('ouvrier')>=0 && r.indexOf('tractoriste')>=0 && r.indexOf('admin')<0;
}
// Une session TRACTEUR ouverte : les traitements phyto vivent dans le meme tableau
// (type:'traitement') et ne declenchent pas la question.
function _mvModeSessionOuverte(){
  try{
    var S=window.SESSIONS||[];
    for(var i=0;i<S.length;i++){ if(S[i]&&S[i].statut==='En cours'&&S[i].type!=='traitement') return true; }
    return false;
  }catch(e){ return false; }
}
// La date vit dans la VALEUR, pas dans la cle : la reponse d'hier expire d'elle-meme
// a minuit, sans rien a purger.
function _mvModeLu(){
  try{
    var r=localStorage.getItem(_mvModeKey()); if(!r) return null;
    var o=JSON.parse(r);
    if(!o||o.d!==_mvModeAuj()) return null;
    return (o.m==='tracteur'||o.m==='terrain')?o.m:null;
  }catch(e){ return null; }
}
function _mvModeEcrire(m){
  try{ localStorage.setItem(_mvModeKey(), JSON.stringify({d:_mvModeAuj(), m:m})); }
  catch(e){ if(window.logError)window.logError({level:'info',cat:'mode',msg:'mode du jour non memorise',detail:(e&&e.message)||String(e)}); }
}
// Mode effectif. null = comportement habituel (mono-role, admin, ou sans reponse).
function _mvMode(){ return _mvModeDouble() ? _mvModeLu() : null; }
window._mvMode=_mvMode;

var _mvModeAsked=false;
function _mvModeCheck(){
  if(_mvModeAsked) return;
  if(!_mvModeDouble()) return;         // un seul role : aucune question a poser
  if(_mvModeLu()) return;              // deja repondu aujourd'hui
  if(!_mvModeSessionOuverte()) return; // aucune session ouverte : rien ne change
  _mvModeAsked=true;
  // openOv est LA primitive d'app.js (_openOv n'existe que dans tracteur.js).
  if(document.getElementById('ovMode')) openOv('ovMode');
}
window._mvModeCheck=_mvModeCheck;
function _mvModeChoisir(m){
  _mvModeEcrire(m);
  try{ closeOv(null,'ovMode'); }catch(e){ if(window.logError)window.logError({level:'info',cat:'mode',msg:'ovMode non ferme',detail:(e&&e.message)||String(e)}); }
  try{ if(window._dockBuild)_dockBuild(); }catch(e){ if(window.logError)window.logError({level:'info',cat:'mode',msg:'dock non reconstruit apres choix du mode',detail:(e&&e.message)||String(e)}); }
  _goLanding();
}
window._mvModeChoisir=_mvModeChoisir;
// Sortie du mode : depuis la feuille « Plus ». On repose la question du jour.
function _mvModeChanger(){
  try{ if(window._dockPlusClose)_dockPlusClose(); }catch(e){ if(window.logError)window.logError({level:'info',cat:'mode',msg:'feuille Plus non fermee',detail:(e&&e.message)||String(e)}); }
  _mvModeAsked=true;
  openOv('ovMode');
}
window._mvModeChanger=_mvModeChanger;

function _landingPage(){
  if(currentUser&&currentUser._isGTAdmin) return 'page-admin-gt';
  if(_mvMode()==='tracteur'&&_mvCan('tracteur')) return 'page-tracteur';
  if(_canPilotage()&&_mvCan('pilotage')) return 'page-pilotage';
  if(_mvCan('vigne')){
    // Priorite du moment (v5.05) : membre affecte a une priorite -> atterrissage direct sur les parcelles
    try{ if(typeof _prioForMember==='function'&&currentUser&&_prioForMember(currentUser.nom)) return 'page-parcelles'; }catch(e){}
    return 'page-home';
  }
  // Vigne masquee pour ce membre (le cas du caviste) : on atterrit sur le premier
  // module que le dock lui laisse. Reglages y ferme toujours la marche -> le dock
  // n'est jamais vide et cette liste jamais nulle.
  var _it=[]; try{ _it=_dockDef(); }catch(e){ if(window.logError)window.logError({level:'info',cat:'nav',msg:'_dockDef a leve dans _landingPage',detail:(e&&e.message)||String(e)}); }
  return 'page-'+((_it[0]&&_it[0].p)||'reglages');
}
function _goLanding(){
  if(currentUser&&currentUser._isGTAdmin){ goTo('admin-gt'); return; }
  if(_mvMode()==='tracteur'&&_mvCan('tracteur')){ goTo('tracteur'); return; }
  if(_canPilotage()&&_mvCan('pilotage')){ goTo('pilotage'); return; }
  if(_mvCan('vigne')){
    // Priorite du moment (v5.05) : membre affecte -> Vigne > Parcelles, sa tache pre-selectionnee
    try{
      if(typeof _prioForMember==='function'&&currentUser){
        var _pit=_prioForMember(currentUser.nom);
        if(_pit){
          _prioOverride=false;
          pTacheFilter=_pit.t; pCurStep=_pvSmartStep(_pit.t);
          goTo('parcelles'); return;
        }
      }
    }catch(e){}
    goTo('home'); return;
  }
  // Vigne masquee : premier module du dock (cf. _landingPage).
  var _it=[]; try{ _it=_dockDef(); }catch(e){ if(window.logError)window.logError({level:'info',cat:'nav',msg:'_dockDef a leve dans _goLanding',detail:(e&&e.message)||String(e)}); }
  goTo((_it[0]&&_it[0].p)||'reglages');
}
window._goLanding=_goLanding;
function _dockDef(){
  var it=[];
  if(_canPilotage()&&_mvCan('pilotage')) it.push({p:'pilotage',ic:'\uD83D\uDCCA',l:'Pilotage'});
  if(_mvCan('vigne')) it.push({p:'home',ic:'\uD83C\uDF3F',l:'Vigne'});
  if(_mvCan('tracteur')) it.push({p:'tracteur',ic:'\uD83D\uDE9C',l:'Tracteur'});
  if(_mvCan('phyto')) it.push({p:'phyto',ic:'\uD83E\uDDEA',l:'Phyto'});
  if(_mvCan('cave')) it.push({p:'cave',ic:'\uD83C\uDF77',l:'Cave'});
  if(_mvCan('reserve')) it.push({p:'reserve',ic:'\uD83D\uDCE6',l:'R\u00e9serve'});
  if(_mvCan('planning')) it.push({p:'planning',ic:'\uD83D\uDCC5',l:'Planning'});
  // Reglages : JAMAIS gate. C'est le socle (mot de passe, theme, deconnexion) et
  // la garantie que le dock n'est jamais vide, quelle que soit la formule ou les
  // cases decochees dans la fiche du membre.
  it.push({p:'reglages',ic:'\u2699\uFE0F',l:'R\u00e9glages'});
  // Mode tracteur : on RANGE, on ne retire pas. Les 3 modules du jour passent en
  // tete ; le reste glisse sous « Plus » et reste a un tap.
  if(_mvMode()==='tracteur'){
    var _pri={tracteur:0,phyto:1,home:2};
    it=it.slice().sort(function(x,y){
      var a=(_pri[x.p]!=null?_pri[x.p]:9), b=(_pri[y.p]!=null?_pri[y.p]:9);
      return a-b;
    });
  }
  return it;
}
function _dockBuild(){
  var dock=document.getElementById('mv-dock'),inner=document.getElementById('mv-dock-inner'),sheet=document.getElementById('mv-dock-sheet-items');
  if(!dock||!inner) return;
  if(!currentUser||currentUser._isGTAdmin){ dock.style.display='none'; return; }
  dock.style.display='flex';
  var items=_dockDef();
  var pc=!!(window.matchMedia&&window.matchMedia('(min-width:768px)').matches);
  var main,ov;
  if(pc||items.length<=5){ main=items; ov=[]; } else { main=items.slice(0,4); ov=items.slice(4); }
  inner.innerHTML=main.map(function(x){return '<button class="mv-dk" data-page="'+x.p+'"><span class="mv-dk-ic">'+x.ic+'</span><span class="mv-dk-lb">'+x.l+'</span></button>';}).join('')
    +(ov.length?'<button class="mv-dk mv-dk-plus" data-plus="1"><span class="mv-dk-ic">\u22EF</span><span class="mv-dk-lb">Plus</span></button>':'');
  Array.prototype.forEach.call(inner.querySelectorAll('.mv-dk'),function(b){ b.onclick=function(){ if(b.getAttribute('data-plus')){ _dockPlus(); } else { _dockGo(b.getAttribute('data-page')); } }; });
  if(sheet){
    sheet.innerHTML=ov.map(function(x){return '<button class="mv-sg" data-page="'+x.p+'"><span class="mv-sg-ic">'+x.ic+'</span><span class="mv-sg-lb">'+x.l+'</span></button>';}).join('')
      +(_mvMode()?'<button class="mv-sg mv-sg-mode" data-mode="1"><span class="mv-sg-ic">\uD83D\uDD01</span><span class="mv-sg-lb">'
        +(_mvMode()==='tracteur'?'Mode tracteur':'Mode terrain')+'</span></button>':'');
    Array.prototype.forEach.call(sheet.querySelectorAll('.mv-sg'),function(b){ b.onclick=function(){ if(b.getAttribute('data-mode')){ _mvModeChanger(); } else { _dockGo(b.getAttribute('data-page')); } }; });
  }
  var act=document.querySelector('.page.active');
  _dockSync(act?act.id.replace('page-',''):'');
}
window._dockBuild=_dockBuild;
function _dockSync(page){
  var inner=document.getElementById('mv-dock-inner'); if(!inner) return;
  var a=(page==='parcelles'||page==='journal')?'home':page;
  var bs=inner.querySelectorAll('.mv-dk');
  for(var i=0;i<bs.length;i++){ bs[i].classList.toggle('on', bs[i].getAttribute('data-page')===a); }
}
window._dockSync=_dockSync;
function _dockGo(p){ _dockPlusClose(); goTo(p); }
window._dockGo=_dockGo;
function _dockPlus(){ var s=document.getElementById('mv-dock-sheet'),b=document.getElementById('mv-dock-sheet-bg'); if(s)s.classList.add('show'); if(b)b.classList.add('show'); }
window._dockPlus=_dockPlus;
function _dockPlusClose(){ var s=document.getElementById('mv-dock-sheet'),b=document.getElementById('mv-dock-sheet-bg'); if(s)s.classList.remove('show'); if(b)b.classList.remove('show'); }
window._dockPlusClose=_dockPlusClose;
window.addEventListener('resize',function(){ if(window._dockRT)clearTimeout(window._dockRT); window._dockRT=setTimeout(function(){ if(window._dockBuild)_dockBuild(); },200); });

// goHub redéfini : redirige vers l'atterrissage selon rôle (hub dormant/injoignable)

// ════ FORMULES & ESSAI 15 JOURS — gating modules + bandeau J-X + écran lecture seule ════
// Lit les helpers de claims exposés par firebase.js : window._canModule / _trialStatus / _mvLoadClaims.
function _mvCan(mod){ try{ return (typeof window._canModule==='function') ? window._canModule(mod) : true; }catch(e){ return true; } }
function _mvTrial(){ try{ return (typeof window._trialStatus==='function') ? window._trialStatus() : {active:false,expired:false,daysLeft:0,level:'ok'}; }catch(e){ return {active:false,expired:false,daysLeft:0,level:'ok'}; } }
// Table page -> module gatable. Une page absente de la table n'est jamais gatee :
// c'est le cas de `reglages` (socle inalienable) et des ecrans hors tenant.
// Vigne compte pour ses 3 onglets : masquer le module doit fermer les 3 portes,
// sinon un lien interne ou l'historique du navigateur rouvre ce qu'on vient de
// masquer.
var _MV_PAGE_MOD={tracteur:'tracteur',phyto:'phyto',planning:'planning',pilotage:'pilotage',
  cave:'cave',reserve:'reserve',home:'vigne',parcelles:'vigne',journal:'vigne'};
function _mvPageGated(p){ var mod=_MV_PAGE_MOD[p]; return !!mod && !_mvCan(mod); }
window._MV_PAGE_MOD=_MV_PAGE_MOD;
window._mvPageGated=_mvPageGated;

// Mail pré-rempli de conversion (objet + domaine + tenant + admin + ligne « Mon numéro »).
function _mvContactMailto(){
  var tenant=(localStorage.getItem('mavigne_tenant')||'');
  var dom=((window.DOMAINE_NOM||'')+'').trim();
  var admin=(currentUser&&currentUser.nom)||'';
  var mail=(currentUser&&currentUser.email)||'';
  var subj='Ma Vigne — je souhaite continuer · '+tenant;
  var body='Bonjour,\n\nJe souhaite continuer avec Ma Vigne pour mon domaine.\n\n'
    +'Domaine : '+dom+'\n'
    +'Identifiant (tenant) : '+tenant+'\n'
    +'Admin : '+admin+(mail?(' ('+mail+')'):'')+'\n'
    +'Mon numéro : ____________\n\n'
    +'Merci de me recontacter.\n';
  return 'mailto:ngdevpro@gmail.com?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body);
}
function _mvContactGo(){ try{ window.location.href=_mvContactMailto(); }catch(e){} }
window._mvContactGo=_mvContactGo;

// Bandeau d'essai en haut (barre fixe). Couleur évolutive : or (>=4 j) → orange (2-3 j) → rouge (<=1 j).
function _mvTrialBanner(){
  var bar=document.getElementById('mv-trial-bar'); if(!bar) return;
  var t=_mvTrial();
  if(!t.active || t.expired || !currentUser || currentUser._isGTAdmin || currentUser._isDemo){
    bar.classList.remove('show'); document.body.classList.remove('mv-trial-on'); return;
  }
  var d=t.daysLeft, lvl=t.level;
  var col = (lvl==='urgent') ? {bg:'#7A1020',fg:'#FBE9E9'} : ((lvl==='warn') ? {bg:'#B5621A',fg:'#FFF1E0'} : {bg:'#B8911F',fg:'#FFF8E6'});
  var label = (d<=1) ? 'Dernier jour d\'essai' : ('Essai · '+d+' jours restants');
  bar.style.background=col.bg;
  bar.innerHTML='<div class="mvtb-in" style="color:'+col.fg+'">'
    +'<span class="mvtb-ic" aria-hidden="true">\u23F3</span>'
    +'<span class="mvtb-txt"><b>'+label+'</b></span>'
    +'<button class="mvtb-btn" style="color:'+col.bg+'" onclick="window._mvContactGo()">Continuer</button>'
    +'</div>';
  bar.classList.add('show'); document.body.classList.add('mv-trial-on');
}
window._mvTrialBanner=_mvTrialBanner;

// Écran lecture seule à l'expiration (données conservées). Verrouille les écritures via window._MV_LOCKED.
function _mvCheckExpired(){
  var ov=document.getElementById('mv-expired-ov'); if(!ov) return;
  var t=_mvTrial();
  if(t.active && t.expired && currentUser && !currentUser._isGTAdmin && !currentUser._isDemo){
    window._MV_LOCKED=true;
    var em=document.getElementById('mv-exp-mail'); if(em){ try{ em.href=_mvContactMailto(); }catch(e){} }
    if(!window._MV_EXPIRED_DISMISSED){ ov.style.display='flex'; }
  } else {
    window._MV_LOCKED=false; ov.style.display='none';
  }
}
window._mvCheckExpired=_mvCheckExpired;
function _mvExpiredDismiss(){ window._MV_EXPIRED_DISMISSED=true; var ov=document.getElementById('mv-expired-ov'); if(ov)ov.style.display='none'; if(window.showToast)showToast('Essai terminé · lecture seule','#7A1020'); }
window._mvExpiredDismiss=_mvExpiredDismiss;

// ── SEC-DPA — Acceptation CGU + DPA à la 1ère ouverture (fail-closed) ──
// Aucun geste d'armement : l'écran s'affiche pour tout admin du domaine dont le compte ne
// porte pas le claim `terms` à jour. Un tenant neuf bloque par construction. Remplace le
// mécanisme _mvCguAccept (fail-open, armé à la main dans GT).
var _MVT_CGV = '1.1', _MVT_DPA = '1.0';

function _mvTermsClaim(){
  try{ return (window._MV_CLAIMS && window._MV_CLAIMS.terms) || null; }catch(e){ return null; }
}
// Lecture directe du jeton (indépendante de la structure interne de firebase.js) : c'est la
// source qui fait foi pour le gating. Repli sur le cache _MV_CLAIMS si le SDK est indispo.
function _mvTermsFromToken(){
  return new Promise(function(res){
    try{
      var fu = currentUser && currentUser._firebaseUser;
      if(!fu || !fu.getIdTokenResult){ res(_mvTermsClaim()); return; }
      fu.getIdTokenResult().then(function(r){ res((r&&r.claims&&r.claims.terms)||null); })
                           .catch(function(){ res(_mvTermsClaim()); });
    }catch(e){ res(_mvTermsClaim()); }
  });
}
// À jour = versions acceptées identiques aux versions courantes. Une version différente
// (nouvelle publication) fait réapparaître l'écran → re-signature.
function _mvTermsOk(t){ return !!(t && t.c===_MVT_CGV && t.d===_MVT_DPA); }

// Point d'entrée du gating (remplace _mvTermsCheck). Appelé par _mvApplyTrialGating.
function _mvTermsCheck(){
  try{
    var ov=document.getElementById('ovTerms'); if(!ov) return;
    var cu=currentUser;
    if(!cu||cu._isGTAdmin||cu._isDemo){ ov.style.display='none'; return; }
    if(!(typeof isAdmin==='function'&&isAdmin())){ ov.style.display='none'; return; } // seul l'admin accepte au nom du domaine
    _mvTermsFromToken().then(function(t){
      if(_mvTermsOk(t)){ ov.style.display='none'; return; }
      _mvTermsPrefill();
      var f=document.getElementById('mvt-form'), d=document.getElementById('mvt-done');
      if(f)f.style.display='block'; if(d)d.style.display='none';
      ov.style.display='flex';
    });
  }catch(e){}
}
window._mvTermsCheck=_mvTermsCheck;

// Pré-remplit ce que l'app connaît déjà : raison sociale (nom du domaine) + nom du signataire.
function _mvTermsPrefill(){
  try{
    var sub=document.getElementById('mvt-sub'); if(sub) sub.textContent=((window.DOMAINE_NOM||'')+'').trim()||'Votre domaine';
    var rs=document.getElementById('mvt-rs'); if(rs && !rs.value){ rs.value=((window.DOMAINE_NOM||'')+'').trim(); }
    var nm=document.getElementById('mvt-nom'); if(nm && !nm.value){ nm.value=((currentUser&&currentUser.nom)||''); }
    if(window._mvTermsSync) window._mvTermsSync();
  }catch(e){}
}
// SIRET : 14 chiffres, groupés à la saisie (3 3 3 5).
window._mvtSiret=function(el){
  var x=(el.value||'').replace(/\D/g,'').slice(0,14);
  el.value=x.replace(/(\d{3})(?=\d)/,'$1 ').replace(/^(\d{3} \d{3})(\d)/,'$1 $2');
  if(window._mvTermsSync) window._mvTermsSync();
};
function _mvtVal(id){ var e=document.getElementById(id); return e?(e.value||'').trim():''; }
function _mvtChk(id){ var e=document.getElementById(id); return !!(e&&e.checked); }
// Garde du bouton : il dit pourquoi il est fermé, plutôt que de rester grisé en silence.
window._mvTermsSync=function(){
  var siret=_mvtVal('mvt-siret').replace(/\D/g,'');
  var manque='';
  if(!_mvtVal('mvt-rs')||!_mvtVal('mvt-adr')||!_mvtVal('mvt-cpv')) manque='Compl\u00e9tez l\u2019identit\u00e9 du domaine.';
  else if(siret.length!==14) manque='Le SIRET doit compter 14 chiffres.';
  else if(!_mvtVal('mvt-nom')||!_mvtVal('mvt-fct')) manque='Indiquez votre nom et votre fonction.';
  else if(!_mvtChk('mvt-hab')) manque='Confirmez votre pouvoir d\u2019engager le domaine.';
  else if(!_mvtChk('mvt-cgv')||!_mvtChk('mvt-dpa')) manque='Acceptez les deux documents.';
  var btn=document.getElementById('mvt-btn'), why=document.getElementById('mvt-why');
  if(btn){ btn.disabled=!!manque; }
  if(why){ why.textContent=manque; }
  var echo=document.getElementById('mvt-rs-echo'); if(echo){ echo.textContent=_mvtVal('mvt-rs')||'votre domaine'; }
  var dc=document.getElementById('mvt-d-cgv'); if(dc) dc.classList.toggle('on',_mvtChk('mvt-cgv'));
  var dd=document.getElementById('mvt-d-dpa'); if(dd) dd.classList.toggle('on',_mvtChk('mvt-dpa'));
};

// Envoi : appelle la CF acceptTerms, rafraîchit le jeton (le claim frais), affiche le reçu.
window._mvTermsSubmit=async function(){
  var btn=document.getElementById('mvt-btn'), why=document.getElementById('mvt-why');
  var fail=function(m){ if(why)why.textContent=m; if(btn){btn.disabled=false;btn.textContent='J\u2019accepte et je continue';} };
  if(btn){ btn.disabled=true; btn.textContent='\u23f3 Enregistrement\u2026'; }
  var payload={
    cgvVersion:_MVT_CGV, dpaVersion:_MVT_DPA,
    fonction:_mvtVal('mvt-fct'), nom:_mvtVal('mvt-nom'),
    client:{ raison_sociale:_mvtVal('mvt-rs'), siret:_mvtVal('mvt-siret').replace(/\D/g,''),
             adresse:_mvtVal('mvt-adr'), cp_ville:_mvtVal('mvt-cpv') }
  };
  try{
    if(typeof window.fbCallFn!=='function'){ return fail('Service indisponible, r\u00e9essayez.'); }
    var r=await window.fbCallFn('acceptTerms', payload, { timeout:30000 });
    var res=(r&&r.data)?r.data:r;
    if(!res||!res.ok){ return fail('Enregistrement refus\u00e9, r\u00e9essayez.'); }
    // Rafraîchit le jeton pour voir le claim `terms` fraîchement posé, sans F5.
    try{ if(currentUser&&currentUser._firebaseUser) await currentUser._firebaseUser.getIdToken(true); }catch(e){}
    try{ if(window._mvLoadClaims) await window._mvLoadClaims(true); }catch(e){}
    _mvTermsFillReceipt(res, payload);
    try{ _mvTermsStoreFill(res, payload); }catch(e){}
    var f=document.getElementById('mvt-form'), d=document.getElementById('mvt-done');
    if(f)f.style.display='none'; if(d)d.style.display='block';
    try{ _mvReceiptRender(); }catch(e){}
  }catch(e){
    var reason=(e&&e.details&&e.details.reason)||'';
    if(reason==='stale_version') return fail('Documents mis \u00e0 jour \u2014 rechargez la page.');
    if(reason==='bad_siret')     return fail('SIRET invalide (14 chiffres).');
    return fail((e&&e.message)||'Erreur, r\u00e9essayez.');
  }
};
function _mvTermsFillReceipt(res, payload){
  try{
    var set=function(id,v){ var e=document.getElementById(id); if(e)e.textContent=v; };
    var at=res.at?new Date(res.at):new Date();
    set('mvt-r-rs', payload.client.raison_sociale);
    set('mvt-r-sig', payload.nom+' \u00b7 '+payload.fonction);
    set('mvt-r-ts', at.toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})+' \u00e0 '+at.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}));
    set('mvt-r-ref', res.ref||'\u2014');
    set('mvt-r-cgv', 'CGU v'+(res.cgvVersion||_MVT_CGV));
    set('mvt-r-dpa', 'DPA v'+(res.dpaVersion||_MVT_DPA));
  }catch(e){}
}
window._mvTermsClose=function(){ var ov=document.getElementById('ovTerms'); if(ov)ov.style.display='none'; };

// Exemplaire personnalisé du contrat : handoff vers dpa.html / cgu.html via localStorage
// (même origine → aucune donnée personnelle en URL). Les pages lisent la clé au chargement.
function _mvTermsStoreFill(res, payload){
  try{
    var c=(payload&&payload.client)||{};
    var f={
      rs:(c.raison_sociale||''), siret:(c.siret||''), adr:(c.adresse||''), cpv:(c.cp_ville||''),
      sig_nom:((payload&&payload.nom)||''), sig_fct:((payload&&payload.fonction)||''),
      ref:((res&&res.ref)||''),
      date_iso:((res&&res.at)? new Date(res.at).toISOString() : new Date().toISOString()),
      hashCgv:((res&&res.hashCgv)||''), hashDpa:((res&&res.hashDpa)||''),
      signed:true
    };
    window._MV_TERMS_FILL=f;
    try{ localStorage.setItem('mv_terms_fill', JSON.stringify(f)); }catch(e){}
    try{ localStorage.removeItem('mv_terms_draft'); }catch(e){}
  }catch(e){}
}
// Ouvre l'exemplaire SIGNÉ (écran de fin, Réglages). kind: 'dpa' | 'cgv'/'cgu'.
window._mvTermsOpenDoc=function(kind){
  try{
    if(window._MV_TERMS_FILL){ try{ localStorage.setItem('mv_terms_fill', JSON.stringify(window._MV_TERMS_FILL)); }catch(e){} }
    var url=(kind==='dpa'?'/dpa.html':'/cgu.html')+'#mv';
    window.open(url,'_blank','noopener');
  }catch(e){}
};
// Aperçu AVANT signature : écrit un brouillon depuis les champs saisis puis ouvre en #mvp.
window._mvTermsPreviewDoc=function(kind){
  var url=(kind==='dpa'?'/dpa.html':'/cgu.html');
  try{
    var draft={
      rs:_mvtVal('mvt-rs'), siret:_mvtVal('mvt-siret').replace(/[^0-9]/g,''),
      adr:_mvtVal('mvt-adr'), cpv:_mvtVal('mvt-cpv'),
      sig_nom:_mvtVal('mvt-nom'), sig_fct:_mvtVal('mvt-fct'),
      ref:'', date_iso:'', hashCgv:'', hashDpa:'', signed:false
    };
    try{ localStorage.setItem('mv_terms_draft', JSON.stringify(draft)); }catch(e){}
    window.open(url+'#mvp','_blank','noopener');
  }catch(e){ window.open(url,'_blank','noopener'); }
};

// Reçu consultable dans Réglages › CGU & Mentions légales (peuplé depuis le claim `terms`).
function _mvReceiptRender(){
  try{
    var box=document.getElementById('mvt-receipt'); if(!box) return;
    var t=_mvTermsClaim();
    if(!t){ box.style.display='none'; box.innerHTML=''; return; }
    var at=t.t?new Date(t.t):null;
    var when=at?(at.toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})+' \u00e0 '+at.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})):'\u2014';
    box.style.display='block';
    box.innerHTML='<div style="font-weight:600;color:var(--vert,#3D6B27);font-size:12.5px;margin-bottom:4px">\u2713 Conditions accept\u00e9es</div>'
      +'<div style="font-size:12px;color:var(--texte-doux,#726A5E);line-height:1.6">CGU v'+(t.c||'?')+' + DPA v'+(t.d||'?')+' \u00b7 le '+when+(t.r?(' \u00b7 r\u00e9f '+t.r):'')+'</div>';
    var _hasFill=false; try{ _hasFill=!!localStorage.getItem('mv_terms_fill'); }catch(e){}
    if(_hasFill){
      box.innerHTML+='<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">'
        +'<button onclick="window._mvTermsOpenDoc&&_mvTermsOpenDoc(\'dpa\')" style="flex:1;min-width:148px;font-family:\'Outfit\',sans-serif;font-weight:600;font-size:12px;color:var(--vert,#3D6B27);background:var(--bg-card,#FBFAF6);border:1px solid rgba(61,107,39,0.4);border-radius:9px;padding:9px 10px;cursor:pointer">&#128196; DPA sign\u00e9</button>'
        +'<button onclick="window._mvTermsOpenDoc&&_mvTermsOpenDoc(\'cgv\')" style="flex:1;min-width:148px;font-family:\'Outfit\',sans-serif;font-weight:600;font-size:12px;color:var(--vert,#3D6B27);background:var(--bg-card,#FBFAF6);border:1px solid rgba(61,107,39,0.4);border-radius:9px;padding:9px 10px;cursor:pointer">&#128196; CGU sign\u00e9es</button>'
        +'</div>';
    }
  }catch(e){}
}
window._mvReceiptRender=_mvReceiptRender;

// Si la page active n'est plus accessible (changement de plan), revenir à l'accueil.
function _mvGuardActivePage(){
  try{ var a=document.querySelector('.page.active'); if(!a) return; var p=a.id.replace('page-',''); if(_mvPageGated(p)&&window.goTo){ _goLanding(); } }catch(e){}
}

// Point d'entrée appelé après login : recharge les claims puis applique gating + bandeau + expiration.
window._mvApplyTrialGating=function(){
  (window._mvLoadClaims?window._mvLoadClaims():Promise.resolve()).then(function(){
    try{ if(window._dockBuild)_dockBuild(); }catch(e){}
    try{ _mvTrialBanner(); }catch(e){}
    try{ _mvCheckExpired(); }catch(e){}
    try{ _mvGuardActivePage(); }catch(e){}
    try{ _mvTermsCheck(); }catch(e){}
    try{ _mvReceiptRender(); }catch(e){}
  });
};

// Crayon « modifier l'e-mail » : admin domaine HORS essai (= abonnement actif) ou admin GT.
function _mvCanEditEmail(){
  try{
    if(currentUser&&currentUser._isGTAdmin) return true;
    if(!(typeof isAdmin==='function'&&isAdmin())) return false;
    return !_mvTrial().active;
  }catch(e){ return false; }
}
window._mvCanEditEmail=_mvCanEditEmail;

window._openEmailModal=function(oldEmail,nom){
  if(!_mvCanEditEmail()){ if(window.showToast)showToast('Réservé à l\'admin (abonnement actif)','#C0392B'); return; }
  var ov=document.getElementById('mv-email-ov'); if(!ov) return;
  window._mvEmailOld=oldEmail||'';
  var sub=document.getElementById('mv-email-sub'); if(sub)sub.textContent=(nom||'')+' \u00b7 '+(oldEmail||'');
  var inp=document.getElementById('mv-email-input'); if(inp){ inp.value=''; }
  var msg=document.getElementById('mv-email-msg'); if(msg){ msg.textContent=''; msg.style.display='none'; }
  if(window.openOv)openOv('mv-email-ov'); else ov.classList.add('open');
  setTimeout(function(){ if(inp)try{inp.focus();}catch(e){} },120);
};
window._closeEmailModal=function(){ if(window.closeOv)closeOv(null,'mv-email-ov'); else { var ov=document.getElementById('mv-email-ov'); if(ov)ov.classList.remove('open'); } };
window._saveEmailModal=async function(){
  var inp=document.getElementById('mv-email-input'), msg=document.getElementById('mv-email-msg'), sb=document.getElementById('mv-email-save');
  function err(t){ if(msg){ msg.textContent=t; msg.style.color='#C0392B'; msg.style.display='block'; } }
  var ne=((inp&&inp.value)||'').trim();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ne)){ err('Adresse e-mail invalide.'); return; }
  var oldEmail=window._mvEmailOld||'';
  if(ne.toLowerCase()===oldEmail.toLowerCase()){ err('C\'est déjà cette adresse.'); return; }
  if(!window._fbUpdateMemberEmail){ err('Indisponible (fonction non déployée).'); return; }
  var bt=sb?sb.textContent:''; if(sb){ sb.disabled=true; sb.textContent='\u23F3 …'; }
  try{
    await window._fbUpdateMemberEmail(oldEmail, ne);
    try{ var arr=window.MEMBRES||[]; for(var i=0;i<arr.length;i++){ if(arr[i]&&arr[i].email===oldEmail) arr[i].email=ne; } }catch(e){}
    if(window._closeEmailModal)window._closeEmailModal();
    if(window.showToast)showToast('Adresse mise à jour','#3D6B27');
    try{ if(typeof window.renderReglages==='function')window.renderReglages(); }catch(e){}
  }catch(e){
    var code=(e&&(e.code||(e.details&&e.details.authCode)))||'';
    var m2='Échec de la mise à jour.';
    if(code==='auth/email-already-in-use'||code==='already-exists') m2='Cette adresse est déjà utilisée.';
    else if(code==='auth/invalid-email') m2='Adresse e-mail invalide.';
    else if(code==='functions/failed-precondition'||/abonnement/i.test((e&&e.message)||'')) m2='Disponible une fois l\'abonnement activé.';
    else if(e&&e.message) m2=e.message;
    err(m2);
  } finally { if(sb){ sb.disabled=false; sb.textContent=bt||'Enregistrer'; } }
};
// ════ fin FORMULES & ESSAI ════

function goHub(){ try{applyVigneSaison();}catch(e){} _goLanding(); }


// ════ MODE PLEIN SOLEIL (#6) — v4.36 ════
function _hcKey(){return 'mavigne_hc_'+(window.TENANT_ID||'default')+'_'+((currentUser&&currentUser.nom)||'anon');}
function _hcLoad(){try{return localStorage.getItem(_hcKey())==='1';}catch(e){return false;}}
function _hcApply(on){
  var r=document.getElementById('app-root');if(!r)return;
  if(on)r.setAttribute('data-hicontrast','1');else r.removeAttribute('data-hicontrast');
  var _hcS=document.getElementById('regl-hc-state'); if(_hcS){_hcS.textContent=on?'Activ\u00e9 \u2713':'Activer';}
}
function toggleHiContrast(){
  var r=document.getElementById('app-root');
  var on=!(r&&r.getAttribute('data-hicontrast')==='1');
  _hcApply(on);
  try{localStorage.setItem(_hcKey(),on?'1':'0');}catch(e){}
  if(window.showToast)showToast(on?'\u2600\ufe0f Mode plein soleil activ\u00e9':'Mode normal','#3D6B27');
}
window.toggleHiContrast=toggleHiContrast;

// ════════════════════════════════
// ACCUEIL PERSONNALISABLE v2 (v4.34)
// Ordre + masquage + taille compacte par utilisateur, priorité épinglée en haut,
// drag&drop appui long, disposition par défaut du domaine (admin).
// localStorage (immédiat) + CONFIG.home_layout[nom] via saveData('config').
// ════════════════════════════════
const HOME_WIDGETS=['demarrage','mapart','avancement','meteo5','raccourcis','masemaine','dre','heures','tracteur','travaux'];
// Widgets qui doivent apparaitre EN HAUT chez ceux qui ont deja personnalise leur accueil :
// la regle generale ajoute les nouveaux widgets en QUEUE, ou celui-ci serait invisible.
const HOME_NEW_TOP=['demarrage','mapart'];
const HOME_PINNED='priorite'; // toujours en haut — seule la taille est modifiable
let homeEditMode=false;
function _homeLayoutKey(){return 'mavigne_home_layout_'+(window.TENANT_ID||'default')+'_'+((currentUser&&currentUser.nom)||'anon');}
function getHomeLayout(){
  var lay=null;
  try{
    var cfg=window.CONFIG||{};
    if(cfg.home_layout&&currentUser&&cfg.home_layout[currentUser.nom])lay=cfg.home_layout[currentUser.nom];
  }catch(e){}
  if(!lay){try{lay=JSON.parse(localStorage.getItem(_homeLayoutKey())||'null');}catch(e){}}
  if(!lay){try{var cfgD=window.CONFIG||{};if(cfgD.home_layout_default&&Array.isArray(cfgD.home_layout_default.order))lay=cfgD.home_layout_default;}catch(e){}}
  if(!lay||!Array.isArray(lay.order))lay={order:HOME_WIDGETS.slice(),hidden:[],compact:[]};
  lay={order:(lay.order||[]).slice(),hidden:(lay.hidden||[]).slice(),compact:(lay.compact||[]).slice()};
  HOME_WIDGETS.forEach(function(w){
    if(lay.order.indexOf(w)!==-1)return;
    if(HOME_NEW_TOP.indexOf(w)!==-1)lay.order.unshift(w); else lay.order.push(w); // futurs widgets
  });
  lay.order=lay.order.filter(function(w){return HOME_WIDGETS.indexOf(w)!==-1;});   // purge aussi 'priorite' des anciens layouts
  lay.hidden=lay.hidden.filter(function(w){return HOME_WIDGETS.indexOf(w)!==-1;});
  lay.compact=lay.compact.filter(function(w){return HOME_WIDGETS.indexOf(w)!==-1||w===HOME_PINNED;});
  return lay;
}
function saveHomeLayout(lay){
  try{localStorage.setItem(_homeLayoutKey(),JSON.stringify(lay));}catch(e){}
  try{
    if(typeof canWrite==='function'&&canWrite()&&currentUser&&currentUser.nom){
      var cfg=window.CONFIG||{};
      cfg.home_layout=cfg.home_layout||{};
      cfg.home_layout[currentUser.nom]=lay;
      window.CONFIG=cfg;
      saveData('config');
    }
  }catch(e){}
}
function _homeIsCompact(id){return getHomeLayout().compact.indexOf(id)!==-1;}
function applyHomeLayout(){
  var page=document.getElementById('page-home');if(!page)return;
  if(!page.querySelector('.home-w'))return;
  var lay=getHomeLayout();
  // priorité épinglée : toujours en premier, jamais masquée
  var pin=page.querySelector('.home-w[data-w="'+HOME_PINNED+'"]');
  if(pin){
    page.appendChild(pin);
    pin.classList.add('home-w-pinned');
    pin.classList.remove('home-w-off');
    pin.classList.toggle('home-w-compact',lay.compact.indexOf(HOME_PINNED)!==-1);
  }
  lay.order.forEach(function(id){
    var el=page.querySelector('.home-w[data-w="'+id+'"]');if(!el)return;
    page.appendChild(el); // ré-appende dans l'ordre du layout
    el.classList.toggle('home-w-off',lay.hidden.indexOf(id)!==-1);
    el.classList.toggle('home-w-compact',lay.compact.indexOf(id)!==-1);
  });
  // footer admin (disposition du domaine) toujours en dernier
  var foot=document.getElementById('home-admin-foot');
  if(foot){
    page.appendChild(foot);
    foot.style.display=(homeEditMode&&typeof isAdmin==='function'&&isAdmin())?'block':'none';
  }
  _homeRenderGrips(lay);
  _homeDndInit();
}
function _homeRenderGrips(lay){
  var page=document.getElementById('page-home');if(!page)return;
  page.querySelectorAll('.home-w').forEach(function(el){
    ['.home-w-grip','.home-w-eye','.home-w-size','.home-w-pin'].forEach(function(sel){
      var old=el.querySelector(':scope > '+sel);if(old)old.remove();
    });
    if(!homeEditMode)return;
    var id=el.getAttribute('data-w');
    var compact=lay.compact.indexOf(id)!==-1;
    // bouton taille (commun épinglé + déplaçables)
    var sz=document.createElement('button');sz.className='home-w-size'+(compact?' act':'');
    sz.textContent=compact?'\u25AD':'\u25FC';
    sz.title=compact?'Repasser en taille normale':'Taille compacte';
    sz.setAttribute('onclick','homeWidgetSize(\''+id+'\')');
    el.appendChild(sz);
    if(id===HOME_PINNED){
      var pinB=document.createElement('div');pinB.className='home-w-pin';pinB.textContent='\uD83D\uDCCC';pinB.title='\u00c9pingl\u00e9 en haut';
      el.appendChild(pinB);
      return;
    }
    var idx=lay.order.indexOf(id);
    var hidden=lay.hidden.indexOf(id)!==-1;
    var grip=document.createElement('div');grip.className='home-w-grip';
    grip.innerHTML='<div class="home-w-drag" title="Appui long puis glisser">\u283F</div>'
      +'<button onclick="homeWidgetMove(\''+id+'\',-1)"'+(idx<=0?' disabled':'')+'>\u25B2</button>'
      +'<button onclick="homeWidgetMove(\''+id+'\',1)"'+(idx>=lay.order.length-1?' disabled':'')+'>\u25BC</button>';
    el.appendChild(grip);
    var eye=document.createElement('button');eye.className='home-w-eye';
    eye.textContent=hidden?'\uD83D\uDEAB':'\uD83D\uDC41';
    eye.setAttribute('onclick','homeWidgetToggle(\''+id+'\')');
    el.appendChild(eye);
  });
}
function homeWidgetMove(id,dir){
  var lay=getHomeLayout();var i=lay.order.indexOf(id);var j=i+dir;
  if(i<0||j<0||j>=lay.order.length)return;
  var t=lay.order[i];lay.order[i]=lay.order[j];lay.order[j]=t;
  saveHomeLayout(lay);applyHomeLayout();
}
function homeWidgetToggle(id){
  var lay=getHomeLayout();var i=lay.hidden.indexOf(id);
  if(i>=0)lay.hidden.splice(i,1);else lay.hidden.push(id);
  saveHomeLayout(lay);applyHomeLayout();
}
function homeWidgetSize(id){
  var lay=getHomeLayout();var i=lay.compact.indexOf(id);
  if(i>=0)lay.compact.splice(i,1);else lay.compact.push(id);
  saveHomeLayout(lay);applyHomeLayout();
  _renderHomeWidgets();
  showToast(i>=0?'Bloc en taille normale':'Bloc compact \u2713','#3D6B27');
}
function toggleHomeEdit(){
  homeEditMode=!homeEditMode;
  var page=document.getElementById('page-home');if(page)page.classList.toggle('home-edit',homeEditMode);
  var btn=document.getElementById('hv2-perso-btn');
  if(btn){btn.textContent=homeEditMode?'\u2713':'\u2699';btn.classList.toggle('editing',homeEditMode);btn.title=homeEditMode?'Terminer':'Personnaliser';}
  applyHomeLayout();
  if(homeEditMode)showToast('Personnalisation \u2014 composez votre accueil','#3D6B27');
  else showToast('Disposition enregistr\u00e9e \u2713','#3D6B27');
}
// ── Disposition par défaut du domaine (admin) ──
function homeSetDomainLayout(){
  if(typeof isAdmin!=='function'||!isAdmin())return;
  var lay=getHomeLayout();
  var cfg=window.CONFIG||{};
  cfg.home_layout_default=lay;
  window.CONFIG=cfg;
  saveData('config');
  showToast('\uD83D\uDCCC Disposition du domaine enregistr\u00e9e \u2713','#3D6B27');
}
// ── Drag & drop appui long (poignée ⠿) ──
var _homeDndReady=false,_homeDrag=null;
function _homeDndInit(){
  if(_homeDndReady)return;_homeDndReady=true;
  document.addEventListener('pointerdown',function(e){
    if(!homeEditMode)return;
    var h=e.target.closest&&e.target.closest('.home-w-drag');if(!h)return;
    var el=h.closest('.home-w');if(!el||el.classList.contains('home-w-pinned'))return;
    e.preventDefault();
    var timer=setTimeout(function(){_homeDragStart(el,e);},250);
    var cancel=function(){clearTimeout(timer);document.removeEventListener('pointerup',cancel);document.removeEventListener('pointercancel',cancel);};
    document.addEventListener('pointerup',cancel);
    document.addEventListener('pointercancel',cancel);
  });
}
function _homeDragStart(el,e){
  if(navigator.vibrate)navigator.vibrate(40);
  _homeDrag={el:el,y:e.clientY};
  el.classList.add('home-w-dragging');
  document.addEventListener('pointermove',_homeDragMove,{passive:false});
  document.addEventListener('pointerup',_homeDragEnd);
  document.addEventListener('pointercancel',_homeDragEnd);
}
function _homeDragMove(e){
  if(!_homeDrag)return;
  e.preventDefault();
  var dy=e.clientY-_homeDrag.y;
  _homeDrag.el.style.transform='translateY('+dy+'px)';
  var page=document.getElementById('page-home');if(!page)return;
  var sibs=[].slice.call(page.querySelectorAll('.home-w:not(.home-w-dragging):not(.home-w-pinned)'));
  var r=_homeDrag.el.getBoundingClientRect();
  var mid=r.top+r.height/2;
  for(var k=0;k<sibs.length;k++){
    var sr=sibs[k].getBoundingClientRect();
    if(mid>sr.top&&mid<sr.top+sr.height/2){sibs[k].before(_homeDrag.el);_homeDrag.el.style.transform='';_homeDrag.y=e.clientY;break;}
    if(mid<sr.bottom&&mid>sr.top+sr.height/2){sibs[k].after(_homeDrag.el);_homeDrag.el.style.transform='';_homeDrag.y=e.clientY;break;}
  }
}
function _homeDragEnd(){
  if(!_homeDrag)return;
  _homeDrag.el.style.transform='';
  _homeDrag.el.classList.remove('home-w-dragging');
  var page=document.getElementById('page-home');
  var lay=getHomeLayout();
  if(page){
    lay.order=[].slice.call(page.querySelectorAll('.home-w')).map(function(n){return n.getAttribute('data-w');})
      .filter(function(id){return HOME_WIDGETS.indexOf(id)!==-1;});
  }
  saveHomeLayout(lay);
  _homeRenderGrips(lay);
  if(navigator.vibrate)navigator.vibrate(60);
  showToast('Ordre enregistr\u00e9 \u2713','#3D6B27');
  _homeDrag=null;
  document.removeEventListener('pointermove',_homeDragMove);
  document.removeEventListener('pointerup',_homeDragEnd);
  document.removeEventListener('pointercancel',_homeDragEnd);
}
window.toggleHomeEdit=toggleHomeEdit;
window.homeWidgetMove=homeWidgetMove;
window.homeWidgetToggle=homeWidgetToggle;
window.homeWidgetSize=homeWidgetSize;
window.homeSetDomainLayout=homeSetDomainLayout;
window.applyHomeLayout=applyHomeLayout;

function openHubAide(){
  var ov=document.getElementById('ovHubAide');
  if(ov) ov.classList.add('open');
}


// ════ ROUTEUR HISTORIQUE — bouton retour Android/navigateur (v4.35) ════
// Aucune fermeture d'overlay existante n'est modifiee : au retour, on
// detecte .overlay.open et on la ferme en priorite, sinon retour au hub.
function _mvCloseable(){
  if(document.querySelector('.overlay.open')) return true;
  var _a=document.querySelector('.page.active');
  return !!(_a && _a.id!=='page-hub');
}
function _mvHistPush(){ try{ history.pushState({mv:1},''); }catch(e){} }
// Overlay reellement au-dessus : z-index le plus eleve, puis dernier dans le DOM
// (a z-index egal, l'element peint en dernier est visuellement au-dessus).
function _mvTopOverlay(){
  var list=document.querySelectorAll('.overlay.open');
  if(!list.length) return null;
  var top=null, topZ=-Infinity;
  for(var i=0;i<list.length;i++){
    var z=parseInt(getComputedStyle(list[i]).zIndex,10); if(isNaN(z)) z=0;
    if(z>=topZ){ topZ=z; top=list[i]; } // >= : l'egalite favorise l'ordre DOM (dernier)
  }
  return top;
}
function _mvBack(){
  var ov=_mvTopOverlay();
  if(ov){ ov.classList.remove('open'); return true; }
  var a=document.querySelector('.page.active');
  if(a && a.id!==_landingPage()){ _goLanding(); return true; }
  return false; // deja au hub -> laisser quitter l'app
}
window.addEventListener('popstate', function(){
  var consumed=_mvBack();
  if(consumed && _mvCloseable()) _mvHistPush();
});

// ════ NAVIGATION ════
function goTo(page){
  // SEC-GT — le panneau GUERETTECH n'est atteignable que par le compte GUERETTECH.
  // Cette page n'est PAS couverte par _mvPageGated (qui ne connaît que les modules
  // vendus) : sans cette garde, goTo('admin-gt') tapé en console ouvrait la coquille
  // pour n'importe qui. Garde de première ligne, volontairement synchrone ; la
  // vérification RÉELLE (claim gtAdmin lu dans le jeton) est refaite par
  // renderAdminGT, qui refuse de construire quoi que ce soit sans elle.
  if(page==='admin-gt' && !(currentUser && currentUser._isGTAdmin===true)){
    if(window.showToast)showToast('Acc\u00e8s r\u00e9serv\u00e9','#C0392B');
    page=_landingPage().replace('page-','');
  }
  if(_mvPageGated(page)){
    // Deux causes possibles, deux messages : la formule du domaine (l'admin peut
    // y remedier en changeant d'abonnement) ou un masquage decide pour ce membre
    // (rien a « debloquer », c'est un choix d'affichage). Dire « non inclus dans
    // votre formule » a un caviste dont on a simplement masque la Vigne enverrait
    // l'admin ouvrir un ticket pour un probleme qui n'existe pas.
    var _md=_MV_PAGE_MOD[page];
    var _perso=!!(window._mvModOff&&window._mvModOff(_md));
    if(window.showToast)showToast(_perso?'Module masqu\u00e9 pour votre profil':'Module non inclus dans votre formule','#C0392B');
    // Repli sur l'atterrissage recalcule : 'home' en dur enverrait dans le mur un
    // membre a qui la Vigne est justement masquee.
    page=_landingPage().replace('page-','');
    if(_mvPageGated(page)) page='reglages';   // ceinture : Reglages n'est jamais gate
  }
  // Reset filtre parcelle Journal à chaque sortie du journal
  if(page!=='journal'){jParcelle='toutes';}
  // Masquage immédiat de l'ancienne page (évite le double-affichage et le scroll infini)
  const oldPage=document.querySelector('.page.active');
  // Vigne intra-module (Accueil/Parcelles/Journal) : aucune animation -> fluide comme Tracteur
  var _vgP=['home','parcelles','journal'];
  var _oldVgId=oldPage?oldPage.id.replace('page-',''):'';
  var _vgNoAnim=(_vgP.indexOf(page)>=0)&&(_vgP.indexOf(_oldVgId)>=0);
  if(oldPage){oldPage.classList.remove('active','pageOut');}
  if(oldPage&&oldPage.id==='page-hub'){_mvHistPush();}
  const newPage=document.getElementById('page-'+page);
  if(newPage){newPage.classList.remove('nav-back');if(_vgNoAnim){newPage.classList.add('no-anim');}else{newPage.classList.remove('no-anim');}newPage.classList.add('active');}
  if(window._dockSync)_dockSync(page);
  window.scrollTo(0,0);
  if(page==='home'){renderHome();}
  if(page==='parcelles'){
    renderParcelles();computePStats();
    // Leaflet perd ses dimensions quand la page est cachée — recalcul sans recréer
    if(mapInit&&leafMap){requestAnimationFrame(function(){requestAnimationFrame(function(){leafMap.invalidateSize();refreshMapColors();});});}
  }
  if(page==='journal')renderJournal();
  if(page==='tracteur')renderTracteur();
  if(page==='phyto')renderPhyto();
  if(page==='reglages'){
    if(!window._dataReady) {
      // Données pas encore chargées — overlay d'attente sur page-reglages
      var _ov = document.getElementById('regl-wait-ov');
      if(!_ov) {
        _ov = document.createElement('div');
        _ov.id = 'regl-wait-ov';
        _ov.style.cssText = 'position:absolute;inset:0;background:rgba(240,238,232,0.92);z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;';
        _ov.innerHTML = '<div style="font-size:28px">⏳</div><div style="font-size:13px;color:var(--texte-med,#5F5F5F);font-family:Outfit,sans-serif">Chargement en cours...</div>';
        var pg = document.getElementById('page-reglages');
        if(pg) { pg.style.position='relative'; pg.appendChild(_ov); }
      }
      _ov.style.display='flex';
      var _rRetry = setInterval(function(){
        if(window._dataReady) {
          clearInterval(_rRetry);
          if(_ov) _ov.style.display='none';
          var cur = document.querySelector('.page.active');
          if(cur && cur.id === 'page-reglages') window.renderReglages();
        }
      }, 300);
      return;
    }
    window.renderReglages();
    if(window.fbPullStatic && navigator.onLine) {
      window.fbPullStatic().then(function(){
        var p = document.querySelector('.page.active');
        if(p && p.id === 'page-reglages') window.renderReglages();
      });
    }
  }
  if(page==='cave'){
    // Aucune remise a zero de caveSection/caveTab ici. Ces deux variables ne sont PAS
    // exposees sur window : les deux gardes etaient des no-op. Mais poser caveTab='dash'
    // ressusciterait le Chai vide le jour ou elles le seraient — 'dash' ne fait pas
    // partie des onglets. L'etat d'onglet appartient a cave.js (valeur initiale 'cuv'
    // + filet de tolerance dans switchCaveOng) ; la section retombe sur 'elevage' par
    // le filet de renderCave().
    if(window.renderCave)window.renderCave();
    // cave_elevage est FB_STATIC : re-pull pour garantir données fraîches
    if(navigator.onLine&&window.fbPullStatic){
      window.fbPullStatic().then(function(){
        var _acp=document.querySelector('.page.active');
        if(_acp&&_acp.id==='page-cave'&&window.renderCave)window.renderCave();
      }).catch(function(){});
    }
  }
  if(page==='chat')chatRender();
  if(page==='planning'){if(window.renderPlanning)window.renderPlanning();}
  if(page==='admin-gt'){if(window.renderAdminGT)window.renderAdminGT();}
  if(page==='pilotage'){ if(window.renderPilotage){ _ensureLeaflet().then(function(){window.renderPilotage();}).catch(function(){window.renderPilotage();}); } }
  if(page==='reserve'){if(window.renderReserve)window.renderReserve();}
  if(window._mvTrialBanner)_mvTrialBanner();
}

// ════ ACCUEIL ════
let homeCardMode = 0; // 0 = avancement global, 1 = tâche en cours — mémorisé par utilisateur (v4.34)
function _homeCardModeKey(){return 'mavigne_card_mode_'+(window.TENANT_ID||'default')+'_'+((currentUser&&currentUser.nom)||'anon');}
function _homeLoadCardMode(){try{var v=parseInt(localStorage.getItem(_homeCardModeKey())||'0',10);return (v===1)?1:0;}catch(e){return 0;}}
let DOMAINE_NOM = _MV_IS_MG ? 'Domaine Marchand-Grillot' : 'Mon domaine'; // Nom configurable du domaine viticole (autres tenants : neutre jusqu'au chargement Firestore)
window.DOMAINE_NOM = DOMAINE_NOM; // Exposer immédiatement pour applyDomNom() (appelée au login avant Firebase)

function getHomeCardData(){
  const tachesSaison = getTachesSaison();
  const parcActives = PARCELLES.filter(p=>p.statut!=='Arrachee');
  // Avancement global — surface concernée × tâches (parcelles désactivées exclues)
  let totalSurfTaches = 0, totalSurfDone = 0;
  tachesSaison.forEach(t=>{
    const parcT=_parcConcern(t.nom);
    totalSurfTaches += parcT.reduce((s,p)=>s+parseFloat(p.surface||0),0);
    totalSurfDone   += parcT.filter(p=>getTacheStatut(p,t.nom)==='Validé').reduce((s,p)=>s+parseFloat(p.surface||0),0);
  });
  const pctGlobal = totalSurfTaches>0 ? Math.round(totalSurfDone/totalSurfTaches*100) : 100;
  // Tâches en cours — pct par surface concernée (cohérent avec renderHeuresCard)
  const tachesAvec = tachesSaison.map(t=>{
    const parcT=_parcConcern(t.nom);
    const surfT=parcT.reduce((s,p)=>s+parseFloat(p.surface||0),0);
    const parcVal=parcT.filter(p=>getTacheStatut(p,t.nom)==='Validé');
    const val=parcVal.length;
    const enc=parcT.filter(p=>getTacheStatut(p,t.nom)==='En cours').length;
    const surfDone=parcVal.reduce((s,p)=>s+parseFloat(p.surface||0),0);
    const pct=surfT>0?Math.round(surfDone/surfT*100):0;
    return {nom:t.nom, val, enc, pct, total:parcT.length};
  }).filter(t=>t.val>0&&t.pct<100);
  const tacheLaMoinsAvancee = tachesAvec.length>0 ? tachesAvec.sort((a,b)=>a.pct-b.pct)[0] : null;
  const tacheLaPlusAvancee  = tachesAvec.length>0 ? tachesAvec.sort((a,b)=>b.pct-a.pct)[0] : null;
  return {pctGlobal, tacheLaMoinsAvancee, tacheLaPlusAvancee, parcActives};
}

function renderHomeCard(){
  const {pctGlobal, tacheLaPlusAvancee, parcActives} = getHomeCardData();
  const saison = getSaisonActive();
  const {totalReste} = calcHeures();
  const _picto=document.getElementById('home-stat-picto');
  const _chip=document.getElementById('home-stat-chip');
  const _content=document.getElementById('home-stat-content');
  const barCol=pctGlobal>=75?'var(--vert-med)':pctGlobal>=40?'var(--or)':'var(--orange)';
  if(homeCardMode===0){
    _picto.textContent='🌿';
    _chip.textContent=_visuSaison();
    _content.innerHTML=`<div style="font-family:Cormorant Garamond,serif;font-size:38px;font-weight:600;line-height:1;color:var(--texte)">${pctGlobal}%</div>
      <div class="hv2-prog-track" aria-hidden="true"><div class="hv2-prog-fill" style="width:${pctGlobal}%;background:${barCol}"></div></div>
      <div style="font-size:12px;font-weight:500;color:var(--texte-med)">Avancement saison</div>
      <div style="font-size:11px;color:var(--texte-doux);margin-top:2px">${parcActives.length} parcelles · ${parcActives.reduce((s,p)=>s+(parseFloat(p.surface)||0),0).toLocaleString('fr-FR',{minimumFractionDigits:0,maximumFractionDigits:2})} ha</div>`;
  } else {
    const t=tacheLaPlusAvancee;
    _picto.textContent=t?(TEMOJI[t.nom]||'🌾'):'✅';
    _chip.textContent=t?'En cours':'Saison complète';
    if(t){
      const colT=t.pct>=75?'var(--or)':'var(--orange)';
      _content.innerHTML=`<div style="font-family:Cormorant Garamond,serif;font-size:38px;font-weight:600;line-height:1;color:var(--texte)">${t.pct}%</div>
        <div class="hv2-prog-track" aria-hidden="true"><div class="hv2-prog-fill" style="width:${t.pct}%;background:${colT}"></div></div>
        <div style="font-size:12px;font-weight:500;color:var(--texte-med)">${tNom(t.nom)}</div>
        <div style="font-size:11px;color:var(--texte-doux);margin-top:2px">${t.val}/${t.total} parcelles</div>`;
    } else {
      _content.innerHTML=`<div style="font-family:Cormorant Garamond,serif;font-size:38px;font-weight:600;color:var(--vert-med)">✅</div>
        <div style="font-size:12px;font-weight:500;color:var(--texte-med);margin-top:8px">Toutes les tâches</div>
        <div style="font-size:11px;color:var(--texte-doux);margin-top:2px">Saison complète !</div>`;
    }
  }
  // Animation tap
  const card=document.getElementById('home-stat-card');
  card.style.transition='transform 0.15s';
  card.style.transform='scale(0.96)';
  setTimeout(()=>{card.style.transform='scale(1)';},150);
  updateHomeDots();
}

function toggleHomeCard(){
  homeCardMode = (homeCardMode+1) % 2;
  try{localStorage.setItem(_homeCardModeKey(),String(homeCardMode));}catch(e){}
  renderHomeCard();
}

function togglePrioPill(){
  const detail=document.getElementById('home-prio-detail');
  const chevron=document.getElementById('home-prio-chevron');
  if(!detail)return;
  const isOpen=detail.classList.contains('open');
  detail.classList.toggle('open',!isOpen);
  if(chevron)chevron.classList.toggle('open',!isOpen);
}


// ── Loader global post-login (pendant _fbLoadAfterAuth) ──
function _showAppLoader() {
  var el = document.getElementById('app-loader');
  if (!el) {
    el = document.createElement('div');
    el.id = 'app-loader';
    el.style.cssText = 'position:fixed;inset:0;background:#F0EEE8;z-index:8000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';
    el.innerHTML = '<div style="font-size:40px">🍇</div>'
      + '<div style="width:36px;height:36px;border:3px solid rgba(61,107,39,0.2);border-top-color:#3D6B27;border-radius:50%;animation:spin 0.8s linear infinite"></div>'
      + '<div style="font-family:Outfit,sans-serif;font-size:13px;color:var(--texte-med,#5F5F5F);font-weight:500">Chargement des données...</div>';
    var root = document.getElementById('app-root') || document.body;
    root.appendChild(el);
  }
  el.style.display = 'flex';
}
function _hideAppLoader() {
  var el = document.getElementById('app-loader');
  if (el) {
    el.style.transition = 'opacity 0.3s';
    el.style.opacity = '0';
    setTimeout(function(){ el.style.display = 'none'; el.style.opacity = '1'; }, 300);
  }
}

// ── Indicateur chargement accueil ──
function showHomeLoader() {
  var el = document.getElementById('home-stat-content');
  if(!el) return;
  el.innerHTML = '<div class="mv-sk sk-ln" style="width:44%;height:34px;border-radius:8px;margin:2px 0"></div>'
    + '<div class="hv2-prog-track" aria-hidden="true" style="margin:8px 0 6px"></div>'
    + '<div class="mv-sk sk-ln h13" style="width:56%"></div>'
    + '<div class="mv-sk sk-ln h9" style="width:40%;margin-top:6px"></div>';
  // Ajouter l'animation si pas déjà présente
  if(!document.getElementById('spin-style')) {
    var s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }
}

function renderHome(){
  applyHomeLayout();
  // Réactiver l'onglet Accueil dans tous les headers vigne
  ['','p','j'].forEach(function(sfx){
    ['home','parcelles','journal'].forEach(function(o){
      var id = sfx ? 'vng-ong-'+o+'-'+sfx : 'vng-ong-'+o;
      var b = document.getElementById(id);
      if(b) b.classList.toggle('active', o==='home');
    });
  });
  const {totalReste}=calcHeures();
  const saison=getSaisonActive();

  // Saison badge (Accueil, Parcelles, Journal)
  ['saison-badge-home','saison-badge-parc','saison-badge-jour'].forEach(function(id){
    var el=document.getElementById(id); if(el)el.textContent=(typeof _visuSaison==='function'?_visuSaison():saison.nom);
  });
  if(typeof _updateSaisonSelector==='function')_updateSaisonSelector();


  // Stats band Accueil
  const {pctGlobal, parcActives} = getHomeCardData();
  var elAvt=document.getElementById('hs-avancement');
  var elNbP=document.getElementById('hs-nb-parc');
  var elSurf=document.getElementById('hs-surf');
  if(elAvt)elAvt.textContent=pctGlobal+'%';
  if(elNbP)elNbP.textContent=parcActives.length;
  if(elSurf){
    var surfTot=PARCELLES.filter(function(p){return p.statut!=='Arrachee';}).reduce(function(s,p){return s+parseFloat(p.surface||0);},0);
    elSurf.textContent=surfTot>0?surfTot.toFixed(2):'—';
  }

  // Sub line Accueil
  var sub=document.getElementById('hv2-header-sub');
  if(sub)sub.textContent=_visuSaison();

  // Carte stat domaine — mode mémorisé (v4.34)
  homeCardMode=_homeLoadCardMode();
  renderHomeCard();

  // Date (Accueil, Parcelles, Journal)
  const jours=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const mois=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const now=new Date();
  const dateStr=jours[now.getDay()]+' '+now.getDate()+' '+mois[now.getMonth()];
  ['hv2-date','date-parc','date-jour'].forEach(function(id){
    var el=document.getElementById(id); if(el)el.textContent=dateStr;
  });

  // Avatar initiale
  const ava=document.getElementById('up-ava-v2');
  if(ava&&currentUser)ava.textContent=currentUser.nom.charAt(0).toUpperCase();

  // Pill priorité — dépliable
  const pm=(typeof priorityMessage!=='undefined')&&priorityMessage&&priorityMessage.trim()?priorityMessage.trim():'';
  const pillTxt=document.getElementById('home-prio-pill-txt');
  const pillEl=document.getElementById('home-prio-pill');
  const pillWrap=document.getElementById('home-prio-pill-wrap');
  const editBtn=document.getElementById('home-prio-edit-btn');
  const detailTxt=document.getElementById('home-prio-detail-txt');
  if(pillTxt){
    if(pm){
      pillTxt.textContent=pm.length>60?pm.substring(0,60)+'…':pm;
      if(pillEl){pillEl.style.background='var(--or-pale)';pillEl.style.borderColor='rgba(184,145,58,0.35)';}
      if(pillTxt)pillTxt.style.color='var(--or)';
      if(editBtn)editBtn.style.display='none';
      if(detailTxt)detailTxt.textContent=pm;
      if(pillWrap)pillWrap.classList.remove('home-prio-pill-vide');
    } else {
      pillTxt.textContent='Aucune priorité définie';
      if(pillEl){pillEl.style.background='var(--gris-clair)';pillEl.style.borderColor='var(--gris)';}
      if(pillTxt)pillTxt.style.color='var(--texte-doux)';
      if(editBtn)editBtn.style.display='none';
      if(detailTxt)detailTxt.textContent='';
      if(pillWrap)pillWrap.classList.add('home-prio-pill-vide');
    }
  }


  // Heures cachées compat
  const nbTravaux=JOURNAL.filter(j=>!j.meteo).length;
  const htEl=document.getElementById('hs-travaux');
  if(htEl)htEl.textContent=nbTravaux;

  // Tracteur sessions
  const _sessVue=(window._sessInSaison?SESSIONS.filter(window._sessInSaison):SESSIONS);
  const tracBars=document.getElementById('hv2-trac-bars');
  if(tracBars){
    tracBars.innerHTML=_sessVue.map(s=>{
      const pct=s.avancement||0;
      const isCours=s.statut==='En cours';
      return `<div class="hv2-bar-item">
        <div class="hv2-bar-label"><span>${s.activite}</span><span>${pct}%</span></div>
        <div class="hv2-bar-track" aria-hidden="true"><div class="hv2-bar-fill${isCours?' or':''}" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');
  }
  const tracNb=document.getElementById('hv2-trac-nb');
  if(tracNb)tracNb.innerHTML=_sessVue.length+' <span>sessions</span>';

  // Heures card
  renderHeuresCard('heures-card-home');

  // Derniers travaux — nouveau markup
  const dt=document.getElementById('derniers-travaux');
  const recent=JOURNAL.filter(j=>!j.meteo).slice(0,4);
  dt.innerHTML=recent.map(r=>{
    const isEq=r.equipe||r.qui==='Equipe';
    const quiAff=isEq&&r.qui&&r.qui!=='Equipe'?`Équipe (${r.qui})`:isEq?'Équipe':r.qui||'—';
    const isVal=r.statut==='Validé';
    const dotCls=isVal?'hv2-dot-v':'hv2-dot-e';
    const badgeCls=isVal?'bv2-v':'bv2-e';
    return `<div class="hv2-tv-item" onclick="goTo('journal')">
      <div class="hv2-tv-dot ${dotCls}">${TEMOJI[r.tache]||'📋'}</div>
      <div class="hv2-tv-corps">
        <div class="hv2-tv-tache">${r.tache}</div>
        <div class="hv2-tv-meta">${quiAff} · ${r.parcelle}</div>
      </div>
      <div class="hv2-tv-right">
        <div class="hv2-tv-date">${fmtDate(r.date)}</div>
        <div class="hv2-tv-badge ${badgeCls}">${r.statut}</div>
      </div>
    </div>`;
  }).join('');

  // Nouveaux widgets personnalisables (v4.34)
  _renderHomeWidgets();
}

// ════ WIDGETS ACCUEIL v4.34 — Météo 5j · Ma semaine · Délai de rentrée · Raccourcis · Mini-carte ════
function _renderHomeWidgets(){
  try{renderHomeDemarrage();}catch(e){window.logError&&window.logError({level:'info',cat:'home',msg:'renderHomeDemarrage'});}
  try{renderHomeMaPart();}catch(e){window.logError&&window.logError({level:'info',cat:'home',msg:'renderHomeMaPart'});}
  try{renderHomeMeteo5();}catch(e){}
  try{renderHomeMaSemaine();}catch(e){}
  try{renderHomeDRE();}catch(e){}
  try{renderHomeRaccourcis();}catch(e){}
}

// ── Météo 5 jours ──
function renderHomeMeteo5(){
  try{renderHomeMeteoCommunes();}catch(_e){}
  var c=document.getElementById('home-meteo5');if(!c)return;
  var md=window.METEO_DAILY;
  if(!md){try{md=JSON.parse(localStorage.getItem('mavigne_meteo5_cache')||'null');}catch(e){}}
  if(!md||!md.time||!md.time.length){
    c.innerHTML='<div class="hm5-mini">\uD83D\uDCE1 M\u00e9t\u00e9o indisponible hors ligne</div>';
    return;
  }
  var jn=['dim','lun','mar','mer','jeu','ven','sam'];
  if(_homeIsCompact('meteo5')){
    var t0=(md.tmax[0]!=null)?Math.round(md.tmax[0])+'\u00b0':'\u2014';
    var rainTxt='';
    for(var i=1;i<md.time.length;i++){
      if((md.pp[i]||0)>=50){rainTxt=' \u00b7 \uD83C\uDF27\uFE0F '+jn[new Date(md.time[i]+'T12:00:00').getDay()]+'. '+md.pp[i]+'%';break;}
    }
    c.innerHTML='<div class="hm5-mini">'+wmoEmoji(md.code[0])+' <b>'+t0+'</b> aujourd\u2019hui'+rainTxt+'</div>';
    return;
  }
  var html='<div class="hm5">';
  md.time.slice(0,5).forEach(function(dt,i){
    var d=new Date(dt+'T12:00:00');
    var gel=(md.tmin[i]!=null&&md.tmin[i]<3);
    html+='<div class="hm5-d'+(i===0?' today':'')+(gel?' gel':'')+'">'
      +'<div class="hm5-n">'+(i===0?'Auj.':jn[d.getDay()])+'</div>'
      +'<div class="hm5-i">'+wmoEmoji(md.code[i])+'</div>'
      +'<div class="hm5-tx">'+(md.tmax[i]!=null?Math.round(md.tmax[i])+'\u00b0':'\u2014')+'</div>'
      +'<div class="hm5-tn">'+(md.tmin[i]!=null?Math.round(md.tmin[i])+'\u00b0':'')+'</div>'
      +'<div class="hm5-p">'+((md.pp[i]||0)>=30?('\uD83D\uDCA7'+md.pp[i]+'%'):'')+'</div>'
      +'</div>';
  });
  c.innerHTML=html+'</div>';
}

// ── Ma semaine : interventions + heures estimées (surface × h/ha, ÷ équipe) ──
function renderHomeMaSemaine(){
  var c=document.getElementById('home-msem');if(!c)return;
  if(!currentUser){c.innerHTML='';return;}
  var nom=currentUser.nom;
  var lbl=document.getElementById('home-msem-label');
  if(lbl)lbl.textContent='Ma semaine \u00b7 '+nom;
  var now=new Date();
  var lundi=new Date(now.getFullYear(),now.getMonth(),now.getDate()-((now.getDay()+6)%7));
  var hours=[0,0,0,0,0,0,0],nbInt=0;
  (JOURNAL||[]).forEach(function(j){
    if(j.meteo||!j.date)return;
    var d=new Date(j.date+'T12:00:00');if(isNaN(d))return;
    var di=Math.floor((d-lundi)/86400000);
    if(di<0||di>6)return;
    var moi=(j.qui===nom)||(j.equipe&&Array.isArray(j.membresEquipe)&&j.membresEquipe.indexOf(nom)!==-1);
    if(!moi)return;
    nbInt++;
    if(j.statut==='Validé'){
      var p=PARCELLES.find(function(x){return x.nom===j.parcelle;});
      var tDef=TACHES.find(function(t){return t.nom===j.tache;});
      if(p&&tDef){
        var h=(parseFloat(p.surface)||0)*(parseFloat(tDef.hha)||0);
        if(j.equipe)h=h/Math.max(1,(j.membresEquipe||[]).length||1);
        hours[di]+=h;
      }
    }
  });
  var tot=hours.reduce(function(a,b){return a+b;},0);
  var totTxt=tot>0?('\u2248 '+(Math.round(tot*2)/2)+'h'):String(nbInt);
  var totLbl=tot>0?'estim\u00e9es cette semaine':'intervention'+(nbInt>1?'s':'')+' cette semaine';
  if(_homeIsCompact('masemaine')){
    c.innerHTML='<div class="hmsem-mini">\uD83D\uDC64 <b>'+totTxt+'</b> '+totLbl+' \u00b7 '+nbInt+' entr\u00e9e'+(nbInt>1?'s':'')+' journal</div>';
    return;
  }
  var maxH=Math.max.apply(null,hours.concat([1]));
  var bl=['L','M','M','J','V','S','D'];
  var bars=hours.map(function(h,i){
    var pct=Math.round(h/maxH*100);
    return '<div class="hmsem-b'+(h<=0?' off':'')+'"><div class="hmsem-bar" style="height:'+Math.max(5,pct)+'%"></div><div class="hmsem-bl">'+bl[i]+'</div></div>';
  }).join('');
  c.innerHTML='<div class="hmsem"><div><div class="hmsem-v">'+totTxt+'</div><div class="hmsem-l">'+totLbl+'</div></div><div class="hmsem-bars">'+bars+'</div></div>';
}

// ── Délai de rentrée (DRE) : sessions traitement T3, max drae des produits ──
function renderHomeDRE(){
  var c=document.getElementById('home-dre');if(!c)return;
  var TR=window.TRAITEMENTS||[];var CAT=window.CATALOGUE||[];
  var now=new Date();
  var groups={};
  TR.forEach(function(t){
    if(!t.date)return;
    var key=t.sessionId||('t-'+(t.produit||'')+'-'+t.date);
    if(!groups[key])groups[key]={date:t.date,heure:t.heureFin||t.heureDebut||'',produits:[],parcelles:t.parcelles||[],dreAnticipe:t.dreAnticipe||''};
    if(t.produit&&groups[key].produits.indexOf(t.produit)===-1)groups[key].produits.push(t.produit);
    if(t.heureFin)groups[key].heure=t.heureFin;
  });
  var rows=[];
  Object.keys(groups).forEach(function(k){
    var g=groups[k];
    var drae=0;
    g.produits.forEach(function(nm){var p=CAT.find(function(x){return x.nom===nm;})||{};var h=dreEffectif(p.drae,p.type,p.dreH,p.dreHc).h;if(h>drae)drae=h;});
    if(!drae)return; // produits sans délai de rentrée (MFSC/adjuvants) : aucune restriction
    var hm=String(g.heure||'12:00').split(':');
    var app=new Date(g.date+'T'+('0'+(hm[0]||'12')).slice(-2)+':'+('0'+(hm[1]||'00')).slice(-2)+':00');
    if(isNaN(app))return;
    var fin=new Date(app.getTime()+drae*3600000);
    var diffH=(fin-now)/3600000;
    if(diffH<=-24)return; // rentrée autorisée depuis plus de 24h → on n'affiche plus
    rows.push({g:g,fin:fin,diffH:diffH,drae:drae});
  });
  rows.sort(function(a,b){return b.fin-a.fin;});
  rows=rows.slice(0,3);
  var nbWait=rows.filter(function(r){return r.diffH>0;}).length;
  if(_homeIsCompact('dre')){
    if(!rows.length){c.innerHTML='<div class="hdre-empty">\u2705 Aucune restriction de rentr\u00e9e</div>';return;}
    if(nbWait>0){
      var next=rows.filter(function(r){return r.diffH>0;}).sort(function(a,b){return a.fin-b.fin;})[0];
      var hh=('0'+next.fin.getHours()).slice(-2)+'h'+('0'+next.fin.getMinutes()).slice(-2);
      var jourTxt=(next.fin.toDateString()===now.toDateString())?'':' demain';
      c.innerHTML='<div class="hdre-mini">\u23F3 <b>'+nbWait+' zone'+(nbWait>1?'s':'')+' en d\u00e9lai de rentr\u00e9e</b> \u2014 prochaine'+jourTxt+' '+hh+'</div>';
    }else{
      c.innerHTML='<div class="hdre-mini">\u2705 Rentr\u00e9e autoris\u00e9e sur toutes les zones trait\u00e9es</div>';
    }
    return;
  }
  if(!rows.length){
    c.innerHTML='<div class="hdre-empty">\u2705 Aucune restriction de rentr\u00e9e en cours</div>';
    return;
  }
  c.innerHTML='<div class="hdre">'+rows.map(function(r){
    var g=r.g;var wait=r.diffH>0;
    var badge;
    if(wait){
      badge=(r.diffH>=1)?('encore '+Math.ceil(r.diffH)+'h'):('encore '+Math.max(5,Math.round(r.diffH*60))+' min');
    }else badge='rentr\u00e9e OK';
    var nbP=(g.parcelles||[]).length;
    var sub=fmtDate(g.date)+(g.heure?' '+_escHtml(g.heure):'')+' \u00b7 '+(nbP?nbP+' parcelle'+(nbP>1?'s':''):'domaine')+' \u00b7 DRE '+r.drae+'h';
    if(g.dreAnticipe)sub+=' \u00b7 \u26A0\uFE0F '+_escHtml(g.dreAnticipe);
    return '<div class="hdre-row '+(wait?'wait':'ok')+'">'
      +'<div class="hdre-ico">'+(wait?'\u23F3':'\u2705')+'</div>'
      +'<div><div class="hdre-tit">'+_escHtml(g.produits.join(' + ')||'Traitement')+'</div><div class="hdre-sub">'+sub+'</div></div>'
      +'<div class="hdre-bad '+(wait?'wait':'ok')+'">'+badge+'</div></div>';
  }).join('')+'</div>';
}

// ── Raccourcis selon rôles ──
function renderHomeRaccourcis(){
  var c=document.getElementById('home-shc');if(!c)return;
  var cmp=_homeIsCompact('raccourcis');
  var btns=[];
  if(typeof canWrite==='function'&&canWrite())btns.push({i:'\uD83D\uDCDD',l:'+ Journal',a:'journal'});
  btns.push({i:'\u2705',l:'Valider',a:'valider'});
  btns.push({i:'\u{1F4D6}',l:'Ma trace',a:'trace'});
  if(typeof isTractoriste==='function'&&isTractoriste())btns.push({i:'\uD83D\uDE9C',l:'Session',a:'session'});
  c.style.gridTemplateColumns='repeat('+btns.length+',1fr)';
  c.innerHTML=btns.map(function(b){
    var inner=cmp?('<span class="shc-l">'+b.i+' '+b.l+'</span>'):('<span class="shc-i">'+b.i+'</span><span class="shc-l">'+b.l+'</span>');
    return '<button onclick="homeShortcut(\''+b.a+'\')">'+inner+'</button>';
  }).join('');
}
function homeShortcut(which){
  if(which==='journal'){if(window.openJournalEntry)window.openJournalEntry();}
  else if(which==='valider'){if(window.switchVigneOng)window.switchVigneOng('parcelles');}
  else if(which==='session'){if(window.openNewSession)window.openNewSession();}
  else if(which==='trace'){if(window.openMaTrace)window.openMaTrace();}
}

window.homeShortcut=homeShortcut;

// ════════════════════════════════════════════════════════════════════════════
// « MA PART DU CHANTIER » — widget d'accueil (lot UX-R2)
// L'accueil montrait l'avancement du DOMAINE ; celui qui le fait avancer ne se
// voyait nulle part dedans. Ce widget affiche la meme barre, coupee en deux :
// sa part en or, celle de l'equipe en vert.
// RIGUEUR DU CHIFFRE : la part personnelle est decoupee DANS surf_done (les
// parcelles reellement validees), jamais calculee a part — sinon la somme des
// parts depasserait l'avancement affiche et la barre mentirait.
// Aucune donnee nouvelle : PARCELLES.surface + JOURNAL.membresEquipe (regle 1/N,
// la meme que le cout par parcelle du Pilotage).
// ════════════════════════════════════════════════════════════════════════════

// Tache « du moment » : la plus travaillee sur 15 jours, sinon la plus avancee
// parmi celles qui restent ouvertes dans la periode consultee.
function _mvPartTache(){
  var lst=(typeof getTachesSaison==='function')?getTachesSaison():[];
  if(!lst.length)return null;
  var vn=(typeof _visuSaison==='function')?_visuSaison():((getSaisonActive()||{}).nom||'');
  var d15=new Date(Date.now()-15*86400000).toISOString().split('T')[0];
  var cnt={};
  JOURNAL.forEach(function(j){
    if(!j||j.meteo||!j.tache||!j.date||j.date<d15)return;
    if(vn&&typeof window._saisonForDate==='function'&&window._saisonForDate(j.date)!==vn)return;
    cnt[j.tache]=(cnt[j.tache]||0)+1;
  });
  var best=null,bestN=0;
  lst.forEach(function(t){
    var tw=TRAVAUX[t.nom]||{};
    if((tw.pct||0)>=100)return;              // chantier fini : on ne le remet pas en avant
    var n=cnt[t.nom]||0;
    if(n>bestN){bestN=n;best=t.nom;}
  });
  if(best)return best;
  var open=lst.filter(function(t){var tw=TRAVAUX[t.nom]||{};return (tw.pct||0)<100;});
  if(!open.length)return null;
  open.sort(function(a,b){return ((TRAVAUX[b.nom]||{}).pct||0)-((TRAVAUX[a.nom]||{}).pct||0);});
  return open[0].nom;
}

// Repartition de surf_done entre « moi » et « l'equipe », + reste et cadence.
function _mvPartCalc(tache,nom){
  var parcs=_parcConcern(tache);
  var vn=(typeof _visuSaison==='function')?_visuSaison():((getSaisonActive()||{}).nom||'');
  var d15=new Date(Date.now()-15*86400000).toISOString().split('T')[0];
  var contrib={},recent={};
  JOURNAL.forEach(function(j){
    if(!j||j.meteo||j.tache!==tache||!j.parcelle||!j.date)return;
    if(vn&&typeof window._saisonForDate==='function'&&window._saisonForDate(j.date)!==vn)return;
    var set=contrib[j.parcelle]||(contrib[j.parcelle]={});
    if(j.qui)set[j.qui]=1;
    (j.membresEquipe||[]).forEach(function(n){ if(n)set[n]=1; });
    if(j.date>=d15&&j.statut==='Validé')recent[j.parcelle]=1;
  });
  var mine=0,done=0,restS=0,restN=0,recS=0,restNoms=[],mineParcs=[];
  parcs.forEach(function(p){
    var s=parseFloat(p.surface)||0;
    if(getTacheStatut(p,tache)==='Validé'){
      done+=s;
      if(recent[p.nom])recS+=s;
      var c=contrib[p.nom]?Object.keys(contrib[p.nom]):[];
      if(nom&&c.length&&c.indexOf(nom)>=0){
        // Repartition PONDEREE : une equipe collective (vendange) pese son effectif,
        // pas 1. Sans ca, une parcelle faite par le chef + 30 vendangeurs donnait
        // la moitie de la surface au chef. L'invariant mine+them===done tient par
        // construction, them etant une soustraction — quel que soit le jeu de poids.
        var _w=1,_sw=0;
        if(typeof window._mvPoidsNom==='function'){
          _w=window._mvPoidsNom(nom);
          c.forEach(function(n){_sw+=window._mvPoidsNom(n);});
        }else{_sw=c.length;}
        mine+=(_sw>0)?(s*_w/_sw):(s/c.length);
        mineParcs.push(p.nom);
      }
    }else{
      restS+=s;restN++;
      if(restNoms.length<3)restNoms.push(p.nom);
    }
  });
  var tot=done+restS;
  var parJour=recS/15;
  var fin=null;
  if(parJour>0&&restS>0){
    var d=new Date(Date.now()+Math.ceil(restS/parJour)*86400000);
    if(!isNaN(d.getTime()))fin=d;
  }
  return {mine:mine,done:done,them:Math.max(0,done-mine),rest:restS,restN:restN,
          restNoms:restNoms,mineParcs:mineParcs,tot:tot,
          pct:tot>0?Math.round(done/tot*100):0,fin:fin};
}

function _mvPartDate(d){
  var M=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  return d.getDate()+' '+M[d.getMonth()];
}

// ════════════════════════════════════════════════════════════════════════════
// MISE EN ROUTE — accompagner l'installation, sans rien demander de plus
// ════════════════════════════════════════════════════════════════════════════
// Un domaine qui vient d'etre installe n'a AUCUN repere : dix modules, et rien
// qui dise par ou commencer. Ce bloc repond a « qu'est-ce que je fais
// maintenant ? », et il s'efface tout seul quand la reponse est « plus rien ».
//
// ⚠ REGLE DU LOT, la meme que la serie UX-R : AUCUNE SAISIE NOUVELLE.
//   Chaque etape se coche en LISANT ce qui est deja en base. Une case a cocher
//   a la main serait une donnee de plus a tenir a jour, donc une donnee fausse.
//
// ⚠ Admin seulement. Un ouvrier n'a pas la main sur ces reglages, et lui
//   montrer une liste de choses qu'il ne peut pas faire n'aide personne.
//
// ⚠ Une etape ne propose un geste QUE si l'ecran existe cote client. Les
//   contours de parcelles, par exemple, sont mis en place a l'installation :
//   l'application n'a pas d'import KML. L'etape le CONSTATE, sans envoyer
//   l'utilisateur sur un ecran qui n'existe pas.
//
// Deux niveaux, volontairement distincts :
//   · les ETAPES  — tant qu'il en reste une, le bloc est la ;
//   · les CONSEILS — des reglages qui ameliorent un calcul sans etre requis.
//     Quand toutes les etapes sont faites, le bloc se reduit au premier conseil
//     utile, sur une seule ligne. Quand il n'en reste aucun, il disparait.
//     C'est ce qui evite un widget mort en tete d'accueil pour toujours.

function _dmrCfg(){ return window.CONFIG || {}; }
function _dmrLen(v){ try { return (v && v.length) ? v.length : 0; } catch(e) { return 0; } }

// Les etapes de l'installation, dans l'ordre ou on les franchit.
// `go` absent = l'etape se constate mais ne se fait pas depuis l'application.
function _dmrEtapes(){
  var cfg = _dmrCfg();
  var kml = 0;
  try { kml = _dmrLen(_pProxKmlSrc()); } catch(e) { kml = 0; }
  var periodes = 0;
  try { periodes = (window.SAISONS||[]).filter(function(s){ return s && s.nom && s.debut && s.fin; }).length; } catch(e) { periodes = 0; }
  var taches = 0;
  try { taches = (window.TACHES||[]).filter(function(t){ return t && parseFloat(t.hha) > 0; }).length; } catch(e) { taches = 0; }

  return [
    { k:'dom',  ok: !!(cfg.domaine_nom || window.DOMAINE_NOM), go:'dom',
      t:'Le nom de votre domaine',
      f:'Il apparaît en tête de chaque document que vous imprimez.' },
    { k:'parc', ok: _dmrLen(window.PARCELLES) > 0,
      t:'Vos parcelles',
      f:'Elles sont mises en place à l\u2019installation, avec vos contours. Voyez cela avec votre installateur.' },
    { k:'kml',  ok: kml > 0,
      t:'Les contours sur la carte',
      f:'Ils viennent de votre fichier KML, chargé à l\u2019installation. Sans eux, la carte reste vide mais tout le reste fonctionne.' },
    { k:'per',  ok: periodes > 0, go:'vigne',
      t:'Vos périodes de travail',
      f:'Chacune porte ses propres dates et ses propres travaux. Sans dates, une période reste invisible partout.' },
    { k:'tac',  ok: taches > 0, go:'vigne',
      t:'Le barème de vos tâches',
      f:'Les heures par hectare de chaque travail. C\u2019est la base de l\u2019avancement, de la charge et du budget.' },
    { k:'equ',  ok: _dmrLen(window.MEMBRES) > 1, go:'equipe',
      t:'Votre équipe',
      f:'Chacun son compte et son mot de passe. Un membre inactif garde son historique.' },
    { k:'jrn',  ok: _dmrLen(window.JOURNAL) > 0, go:'parc',
      t:'Un premier travail validé',
      f:'Validez une parcelle depuis Mes Parcelles : tout le reste en découle.' }
  ];
}

// Des reglages qui rendent un calcul plus juste. Aucun n'est obligatoire, et on
// n'en montre qu'UN a la fois — une liste de conseils permanents devient un
// decor qu'on ne lit plus.
function _dmrConseils(){
  var cfg = _dmrCfg(), out = [];
  var v = cfg.vigne || {};
  if (!cfg.siret) out.push({ go:'dom',
    t:'Ajoutez le SIRET de l\u2019exploitation',
    f:'Le registre phyto en fichier le porte sur chaque ligne. Sans lui, le fichier sort quand même, mais incomplet.' });
  if (!(parseFloat(v.ec_rang) > 0 && parseFloat(v.ec_pied) > 0)) out.push({ go:'vigne',
    t:'Renseignez vos écartements de plantation',
    f:'Sans eux, le barème conseillé suppose 10 000 pieds à l\u2019hectare. À 6 000 pieds, il propose un tiers d\u2019heures de trop.' });
  return out;
}

// ⚠ Expose sur window : l'onclick est ecrit dans une chaine HTML, donc evalue
//   hors du module (Rollup sort en IIFE, rien n'est global par defaut).
window._dmrGo = function(k){
  try {
    if (k === 'parc') { if (window.goTo) window.goTo('parcelles'); return; }
    if (window.goTo) window.goTo('reglages');
    var onglet = (k === 'dom') ? 'domaine' : (k === 'equipe' ? 'equipe' : 'vigne');
    setTimeout(function(){ if (window.switchReglTab) window.switchReglTab(onglet); }, 220);
  } catch(e) { if (window.logError) window.logError({ level:'info', cat:'home', msg:'dmrGo' }); }
};

function _dmrInjectCss(){
  if (document.getElementById('dmr-css')) return;
  var s = document.createElement('style'); s.id = 'dmr-css';
  s.textContent = ''
    + '.dmr{background:var(--bg-card);border:1px solid var(--bord);border-radius:14px;padding:4px 0;overflow:hidden}'
    + '.dmr-it{display:flex;align-items:flex-start;gap:10px;padding:11px 14px;border-bottom:1px solid var(--bord)}'
    + '.dmr-it:last-child{border-bottom:none}'
    + '.dmr-it.go{cursor:pointer}'
    + '.dmr-mk{flex:0 0 20px;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;margin-top:1px}'
    + '.dmr-mk.on{background:var(--vert);color:#fff}'
    + '.dmr-mk.off{background:transparent;border:1.5px dashed var(--bord-fort,#C9C2B4)}'
    + '.dmr-tx{flex:1;min-width:0}'
    + '.dmr-t{font-size:14px;font-weight:600;color:var(--txt)}'
    + '.dmr-it.done .dmr-t{color:var(--txt-doux,#8A8072);font-weight:500}'
    + '.dmr-f{font-size:12px;line-height:1.45;color:var(--txt-doux,#8A8072);margin-top:2px}'
    + '.dmr-ar{flex:0 0 auto;color:var(--or);font-size:16px;margin-top:1px}'
    + '.dmr-mini{font-size:13px;color:var(--txt-doux,#8A8072);padding:2px 2px 6px}'
    + '.dmr-cons{display:flex;align-items:flex-start;gap:10px;background:var(--or-pale);border:1px solid rgba(184,145,58,0.30);'
    +   'border-radius:12px;padding:11px 13px;cursor:pointer}'
    + '.dmr-cons .dmr-t{color:var(--or)}';
  document.head.appendChild(s);
}

function renderHomeDemarrage(){
  var c = document.getElementById('home-demarrage');
  if (!c) return;
  var wrap = document.querySelector('.home-w[data-w="demarrage"]');
  var lbl  = document.getElementById('home-demarrage-label');
  var cacher = function(){ if (wrap) wrap.style.display = 'none'; c.innerHTML = ''; };

  // Reglages du domaine : l'administrateur seul peut y repondre.
  var adm = false;
  try { adm = (typeof isAdmin === 'function') ? isAdmin() : false; } catch(e) { adm = false; }
  if (!adm) { cacher(); return; }

  var et = _dmrEtapes();
  var reste = et.filter(function(e){ return !e.ok; });
  var cons  = _dmrConseils();

  // Tout est fait et rien a conseiller : le bloc s'efface pour de bon.
  if (!reste.length && !cons.length) { cacher(); return; }
  if (wrap) wrap.style.display = '';
  _dmrInjectCss();

  // Installation terminee : il ne reste qu'un conseil, sur une seule ligne.
  if (!reste.length) {
    // ⚠ Ne pas dependre de la garde ecrite plus haut : deux endroits qui
    //   decident la meme chose finissent par diverger, et celui-la planterait
    //   le rendu de l'accueil entier.
    var k = cons[0];
    if (!k) { cacher(); return; }
    if (lbl) lbl.textContent = 'Pour aller plus loin';
    c.innerHTML = '<div class="dmr-cons" onclick="_dmrGo(\'' + k.go + '\')">'
      + '<span class="dmr-tx"><span class="dmr-t">' + _escHtml(k.t) + '</span>'
      + '<span class="dmr-f" style="display:block">' + _escHtml(k.f) + '</span></span>'
      + '<span class="dmr-ar">\u203A</span></div>';
    return;
  }

  var faites = et.length - reste.length;
  if (lbl) lbl.textContent = 'Mise en route';
  if (_homeIsCompact('demarrage')) {
    c.innerHTML = '<div class="dmr-mini">' + faites + ' étape' + (faites > 1 ? 's' : '') + ' sur '
      + et.length + ' \u00b7 ' + _escHtml(reste[0].t.toLowerCase()) + ' \u00e0 faire</div>';
    return;
  }

  var h = '<div class="dmr">';
  for (var i = 0; i < et.length; i++) {
    var e = et[i];
    var cliquable = (!e.ok && e.go);
    h += '<div class="dmr-it' + (e.ok ? ' done' : '') + (cliquable ? ' go' : '') + '"'
      + (cliquable ? ' onclick="_dmrGo(\'' + e.go + '\')"' : '') + '>'
      + '<span class="dmr-mk ' + (e.ok ? 'on' : 'off') + '">' + (e.ok ? '\u2713' : '') + '</span>'
      + '<span class="dmr-tx"><span class="dmr-t">' + _escHtml(e.t) + '</span>'
      + (e.ok ? '' : '<span class="dmr-f" style="display:block">' + _escHtml(e.f) + '</span>')
      + '</span>'
      + (cliquable ? '<span class="dmr-ar">\u203A</span>' : '')
      + '</div>';
  }
  h += '</div>';
  c.innerHTML = h;
}

function renderHomeMaPart(){
  var c=document.getElementById('home-mapart');
  if(!c)return;
  var wrap=document.querySelector('.home-w[data-w="mapart"]');
  var tache=_mvPartTache();
  if(!tache){ if(wrap)wrap.style.display='none'; c.innerHTML=''; return; }
  if(wrap)wrap.style.display='';
  var nom=(currentUser&&currentUser.nom)||'';
  var r=_mvPartCalc(tache,nom);
  var lbl=document.getElementById('home-mapart-label');
  if(lbl)lbl.textContent='Ma part du chantier';
  var pMine=r.tot>0?(r.mine/r.tot*100):0;
  var pThem=r.tot>0?(r.them/r.tot*100):0;
  var ha=function(v){return (Math.round((parseFloat(v)||0)*100)/100).toFixed(2).replace('.',',');};
  var titre=(window.TEMOJI&&window.TEMOJI[tache]||'\u{1F33F}')+' '+_escHtml(tNom(tache));

  if(_homeIsCompact('mapart')){
    c.innerHTML='<div class="hmp-mini">'+titre+' \u00b7 <b>'+ha(r.mine)+' ha</b> de vous sur '+ha(r.done)+' ha faits</div>';
    return;
  }

  c.innerHTML='<div class="hmp" onclick="goTo(\'parcelles\')">'
    +'<div class="hmp-top"><span class="hmp-n">'+titre+'</span><span class="hmp-p">'+r.pct+' %</span></div>'
    +'<div class="hmp-sub">'+ha(r.done)+' ha faits sur '+ha(r.tot)+' ha</div>'
    +'<div class="hmp-bar" aria-hidden="true"><span class="mine" style="width:'+pMine.toFixed(1)+'%"></span>'
      +'<span class="them" style="width:'+pThem.toFixed(1)+'%"></span></div>'
    +'<div class="hmp-leg">'
      +'<span><i class="hmp-i-or"></i>'+(r.mine>0?('Votre part \u00b7 '+ha(r.mine)+' ha'):'Vous n\'avez pas encore travaill\u00e9 ce chantier')+'</span>'
      +(r.them>0?('<span><i class="hmp-i-vt"></i>L\'\u00e9quipe \u00b7 '+ha(r.them)+' ha</span>'):'')
    +'</div>'
    +(r.restN>0?('<div class="hmp-rest">Il reste <b>'+r.restN+' parcelle'+(r.restN>1?'s':'')+'</b> \u2014 '+ha(r.rest)+' ha'
      +(r.restNoms.length?(' \u00b7 '+_escHtml(r.restNoms.join(', '))+(r.restN>r.restNoms.length?'\u2026':'')):'')+'.'
      +(r.fin?('<br>Au rythme des 15 derniers jours, fin vers le <b>'+_mvPartDate(r.fin)+'</b>.'):'')
      +(function(){
         if(!r.fin)return '';
         var t=(typeof _mvCompTxt==='function')?_mvCompTxt(tache,_mvIsoLocal(r.fin)):'';
         return t?('<br><span class="hmp-n1">'+t+'</span>'):'';
       })()
      +'</div>'):'<div class="hmp-rest">Chantier termin\u00e9 sur tout le domaine.</div>')
  +'</div>';
}

window.renderHomeMaPart=renderHomeMaPart;

// ════════════════════════════════════════════════════════════════════════════
// « MA TRACE » — la seule page de l'app qui appartienne a celui qui la remplit
// (lot UX-R3). Contrepoids du Pilotage : memes donnees, point de vue de celui
// qui les produit. En SURFACE, jamais en heures — les heures sont le sujet de
// la paie, les hectares sont ceux qui les a faits.
// Reutilise _mvPartCalc (lot UX-R2) tache par tache : une seule definition de
// « ma part », jamais deux (regle §25.15).
// Aucun classement entre collegues : « avec qui » compte des jours partages,
// pas une performance.
// ════════════════════════════════════════════════════════════════════════════
function _mvTraceData(nom){
  var lst=(typeof getTachesSaison==='function')?getTachesSaison():[];
  var vn=(typeof _visuSaison==='function')?_visuSaison():((getSaisonActive()||{}).nom||'');
  var taches=[],total=0,parcs={};
  lst.forEach(function(t){
    var r=_mvPartCalc(t.nom,nom);
    (r.mineParcs||[]).forEach(function(pn){ parcs[pn]=(parcs[pn]||0)+1; });
    if(r.mine>0.0001)  { taches.push({nom:t.nom,ha:r.mine,n:(r.mineParcs||[]).length}); total+=r.mine; }
  });
  taches.sort(function(a,b){return b.ha-a.ha;});
  var jours={},co={};
  JOURNAL.forEach(function(j){
    if(!j||j.meteo||!j.date)return;
    if(vn&&typeof window._saisonForDate==='function'&&window._saisonForDate(j.date)!==vn)return;
    var eq=[];
    if(j.qui)eq.push(j.qui);
    (j.membresEquipe||[]).forEach(function(n){ if(n&&eq.indexOf(n)<0)eq.push(n); });
    if(eq.indexOf(nom)<0)return;
    jours[j.date]=1;
    eq.forEach(function(n){ if(n!==nom){ co[n]=co[n]||{}; co[n][j.date]=1; } });
  });
  var parcsL=Object.keys(parcs).sort(function(a,b){return parcs[b]-parcs[a];});
  return {total:total,taches:taches,parcs:parcsL,parcsN:parcs,
          jours:Object.keys(jours).length,
          co:Object.keys(co).map(function(n){return {nom:n,j:Object.keys(co[n]).length};})
                            .sort(function(a,b){return b.j-a.j;})};
}

function _mvTraceHa(v){ return (Math.round((parseFloat(v)||0)*100)/100).toFixed(2).replace('.',','); }

function renderMaTrace(){
  var c=document.getElementById('mtr-body');
  if(!c)return;
  var nom=(currentUser&&currentUser.nom)||'';
  var d=_mvTraceData(nom);
  var per=(typeof _visuSaison==='function')?_visuSaison():((getSaisonActive()||{}).nom||'');
  var ha=_mvTraceHa;

  var h='<div class="mtr-hero">'
    +'<span class="mtr-k">Travaillé sur '+_escHtml(per)+'</span>'
    +'<span class="mtr-v">'+ha(d.total)+'<em>ha</em></span>'
    +'<span class="mtr-s">'+(d.parcs.length?('sur '+d.parcs.length+' parcelle'+(d.parcs.length>1?'s':'')):'aucune parcelle encore validée')
      +(d.jours?(' · '+d.jours+' journée'+(d.jours>1?'s':'')):'')+'</span>'
  +'</div>';

  if(d.taches.length){
    h+='<div class="mtr-lab">Par tâche</div><div class="mtr-card">'
      +d.taches.map(function(t){
        return '<div class="mtr-r">'
          +'<span class="em">'+((window.TEMOJI&&window.TEMOJI[t.nom])||'\u{1F33F}')+'</span>'
          +'<span class="nm"><b>'+_escHtml(tNom(t.nom))+'</b><span>'+t.n+' parcelle'+(t.n>1?'s':'')+'</span></span>'
          +'<span class="vv">'+ha(t.ha)+'<em>ha</em></span></div>';
      }).join('')+'</div>';
  }

  if(d.parcs.length){
    var show=d.parcs.slice(0,14),extra=d.parcs.length-show.length;
    h+='<div class="mtr-lab">Parcelles où vous êtes intervenu</div><div class="mtr-card mtr-chips">'
      +show.map(function(p){
        var n=d.parcsN[p]||1;
        return '<span class="mtr-pc">'+_escHtml(p)+(n>1?'<em>'+n+' tâches</em>':'')+'</span>';
      }).join('')
      +(extra>0?('<span class="mtr-pc q">+ '+extra+' autre'+(extra>1?'s':'')+'</span>'):'')
      +'</div>';
  }

  if(d.co.length){
    h+='<div class="mtr-lab">Avec qui</div><div class="mtr-card mtr-chips">'
      +d.co.map(function(m){
        var mb=(window.MEMBRES||[]).find(function(x){return x&&x.nom===m.nom;});
        return '<span class="mtr-tm"><i style="background:'+_escAttr((mb&&mb.couleur)||'#8A5A38')+'">'
          +_escHtml(String(m.nom).charAt(0).toUpperCase())+'</i><b>'+_escHtml(m.nom)+'</b>'
          +'<span>'+m.j+' j</span></span>';
      }).join('')+'</div>';
  }

  if(!d.taches.length&&!d.parcs.length){
    h+='<div class="mtr-card mtr-vide">Rien n\'est encore enregistré à votre nom sur cette période. '
      +'Chaque parcelle validée et chaque entrée de journal alimentent cette page.</div>';
  }

  if(typeof _mvMurVisible==='function'&&_mvMurVisible()){
    h+='<button class="mtr-go" onclick="openMur()"><span>Le domaine cette semaine'
      +'<span class="sub">Ce que toute l\'équipe a fait</span></span><span class="arw">\u203a</span></button>';
  }
  h+='<div class="mtr-note">Les surfaces sont partagées entre les personnes notées sur chaque chantier : '
    +'une parcelle faite à trois compte pour un tiers à chacun. Aucun chiffre n\'est comparé entre collègues.</div>';

  c.innerHTML=h;
}

function openMaTrace(){
  renderMaTrace();
  if(typeof openOv==='function')openOv('ovMaTrace');
}

window.openMaTrace=openMaTrace;

// ════════════════════════════════════════════════════════════════════════════
// « LE DOMAINE CETTE SEMAINE » — le mur (lot UX-R4)
// Un ouvrier saisit dans un puits : rien ne lui dit que quelqu'un lit. Le mur
// affiche la semaine du domaine, visible de toute l'equipe.
// COLLECTIF D'ABORD : le grand chiffre est celui du domaine. La liste est
// ALPHABETIQUE — jamais triee par surface. Aucune heure, aucune remuneration.
// Surface « parcourue » : chaque entree de journal (hors annulee) vaut la
// surface de sa parcelle divisee par ses intervenants, dedoublonnee par
// parcelle+tache — deux saisies du meme travail ne comptent qu'une fois.
// ════════════════════════════════════════════════════════════════════════════

// Semaine calendaire lundi -> dimanche, en dates locales (jamais toISOString :
// il bascule d'un jour selon le fuseau).
function _mvMurSemaine(){
  var n=new Date();
  var lu=new Date(n.getFullYear(),n.getMonth(),n.getDate()-((n.getDay()+6)%7));
  var di=new Date(lu.getFullYear(),lu.getMonth(),lu.getDate()+6);
  var iso=function(x){return x.getFullYear()+'-'+('0'+(x.getMonth()+1)).slice(-2)+'-'+('0'+x.getDate()).slice(-2);};
  return {a:iso(lu),b:iso(di),lundi:lu};
}

function _mvMurData(){
  var w=_mvMurSemaine(),pS={};
  PARCELLES.forEach(function(p){ if(p&&p.nom)pS[p.nom]=parseFloat(p.surface)||0; });
  var seen={},gens={},fini={},tot=0,nTr=0;
  JOURNAL.forEach(function(j){
    if(!j||j.meteo||!j.date||j.date<w.a||j.date>w.b)return;
    if(j.statut==='Annulé')return;
    if(!j.parcelle||j.parcelle==='Domaine'||!(j.parcelle in pS))return;
    var key=j.parcelle+'|'+(j.tache||'');
    if(seen[key])return;
    seen[key]=1;
    var eq=[];
    if(j.qui)eq.push(j.qui);
    (j.membresEquipe||[]).forEach(function(n){ if(n&&eq.indexOf(n)<0)eq.push(n); });
    if(!eq.length)return;
    var s=pS[j.parcelle],part=s/eq.length;
    tot+=s; nTr++;
    if(j.statut==='Validé')fini[j.parcelle]=1;
    eq.forEach(function(n){
      var g=gens[n]||(gens[n]={nom:n,ha:0,parcs:{},taches:{}});
      g.ha+=part;g.parcs[j.parcelle]=1;
      if(j.tache)g.taches[j.tache]=1;
    });
  });
  var list=Object.keys(gens).sort(function(a,b){return a.localeCompare(b,'fr');})
    .map(function(n){
      var g=gens[n];
      return {nom:n,ha:g.ha,nParc:Object.keys(g.parcs).length,
              taches:Object.keys(g.taches),parcs:Object.keys(g.parcs)};
    });
  return {sem:w,total:tot,travaux:nTr,fini:Object.keys(fini).length,gens:list};
}

// Ce qui reste ouvert sur la campagne (reutilise _mvPartCalc — une seule definition).
function _mvMurReste(){
  var lst=(typeof getTachesSaison==='function')?getTachesSaison():[];
  var out=[];
  lst.forEach(function(t){
    var r=_mvPartCalc(t.nom,'');
    if(r.restN>0)out.push({nom:t.nom,rest:r.rest,n:r.restN,pct:r.pct});
  });
  out.sort(function(a,b){return b.pct-a.pct;});
  return out.slice(0,4);
}

function _mvMurVisible(){
  var v=(window.CONFIG&&window.CONFIG.mur_visible)||'equipe';
  if(v==='admin')return (typeof isAdmin==='function')&&isAdmin();
  return true;
}

function _mvMurHa(v){ return (Math.round((parseFloat(v)||0)*100)/100).toFixed(2).replace('.',','); }

function _mvMurDate(d){
  var M=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  return d.getDate()+' '+M[d.getMonth()];
}

function renderMur(){
  var c=document.getElementById('mur-body');
  if(!c)return;
  var adm=(typeof isAdmin==='function')&&isAdmin();
  if(!_mvMurVisible()){
    c.innerHTML='<div class="mur-card mur-vide">Cette page est réservée à l\'administrateur du domaine.</div>';
    return;
  }
  var d=_mvMurData(),moi=(currentUser&&currentUser.nom)||'',ha=_mvMurHa;
  var sub=document.getElementById('mur-sub');
  if(sub)sub.textContent='Semaine du '+_mvMurDate(d.sem.lundi);

  var h='<div class="mur-tot"><div class="mur-tot-r"><div>'
    +'<span class="mur-tot-v">'+ha(d.total)+'<em>ha</em></span>'
    +'<span class="mur-tot-l">parcourus cette semaine<br>'
      +(d.gens.length?('par '+d.gens.length+' personne'+(d.gens.length>1?'s':'')):'aucune saisie pour l\'instant')+'</span>'
    +'</div><div class="mur-tot-b"><span class="v">'+d.fini+'</span>'
      +'<span class="l">parcelle'+(d.fini>1?'s':'')+'<br>terminée'+(d.fini>1?'s':'')+'</span></div>'
  +'</div></div>';

  if(d.gens.length){
    h+='<div class="mur-lab">Qui a fait quoi</div><div class="mur-card">'
      +d.gens.map(function(g){
        var mb=(window.MEMBRES||[]).find(function(x){return x&&x.nom===g.nom;});
        var det=(g.taches.length?g.taches.map(function(t){return _escHtml(tNom(t));}).join(', '):'Travaux')
          +' \u00b7 '+g.nParc+' parcelle'+(g.nParc>1?'s':'');
        return '<div class="mur-row'+(g.nom===moi?' mur-me':'')+'">'
          +'<span class="av" style="background:'+_escAttr((mb&&mb.couleur)||'#8A5A38')+'">'
            +_escHtml(String(g.nom).charAt(0).toUpperCase())+'</span>'
          +'<span class="in"><b>'+_escHtml(g.nom)+(g.nom===moi?' \u00b7 vous':'')+'</b><span>'+det+'</span></span>'
          +'<span class="hb">'+ha(g.ha)+'<em> ha</em></span></div>';
      }).join('')+'</div>';
  }

  // Mot du chef de culture — seul contenu saisi a la main de tout le lot.
  var mot=(window.CONFIG&&window.CONFIG.mur_mot)||null;
  h+='<div class="mur-lab">Le mot du chef de culture</div>';
  if(mot&&mot.txt){
    h+='<div class="mur-card mur-mot"><span class="q">\u00ab</span><span class="tx">'+_escHtml(mot.txt)
      +'<span class="sg">'+_escHtml(mot.par||'')+(mot.date?(' \u00b7 '+_escHtml(mot.date)):'')+'</span></span></div>';
  } else if(!adm){
    h+='<div class="mur-card mur-vide">Rien cette semaine.</div>';
  }
  if(adm){
    h+='<div class="mur-card mur-ed">'
      +'<textarea class="mur-ta" rows="3" placeholder="Deux lignes pour l\'équipe : ce qui a bien tourné, ce qui vient…"></textarea>'
      +'<div class="mur-ed-row">'
        +'<button class="mur-btn" onclick="saveMurMot()"><span>Enregistrer le mot</span></button>'
        +(mot&&mot.txt?'<button class="mur-btn q" onclick="clearMurMot()"><span>Effacer</span></button>':'')
      +'</div>'
      +'<div class="mur-ed-row mur-vis">'
        +'<span>Ce mur est visible par</span>'
        +'<button class="mur-seg'+(_mvMurCfgVis()==='equipe'?' on':'')+'" onclick="setMurVisible(\'equipe\')"><span>toute l\'équipe</span></button>'
        +'<button class="mur-seg'+(_mvMurCfgVis()==='admin'?' on':'')+'" onclick="setMurVisible(\'admin\')"><span>l\'administrateur seul</span></button>'
      +'</div>'
    +'</div>';
  }

  var rest=_mvMurReste();
  if(rest.length){
    h+='<div class="mur-lab">Ce qui reste ouvert</div><div class="mur-card">'
      +rest.map(function(r){
        return '<div class="mur-row"><span class="em">'+((window.TEMOJI&&window.TEMOJI[r.nom])||'\u{1F33F}')+'</span>'
          +'<span class="in"><b>'+_escHtml(tNom(r.nom))+'</b><span>'+r.n+' parcelle'+(r.n>1?'s':'')+' \u00b7 '+ha(r.rest)+' ha</span></span>'
          +'<span class="hb">'+r.pct+'<em> %</em></span></div>';
      }).join('')+'</div>';
  }

  h+='<div class="mur-note">Les surfaces sont partagées entre les personnes notées sur chaque chantier. '
    +'La liste est alphabétique : rien n\'est classé, aucune heure ni rémunération n\'apparaît ici.</div>';

  c.innerHTML=h;
  var ta=c.querySelector('.mur-ta');
  if(ta&&mot&&mot.txt)ta.value=mot.txt;   // iOS : la valeur doit etre posee EN JS apres innerHTML
}

function _mvMurCfgVis(){ return (window.CONFIG&&window.CONFIG.mur_visible)||'equipe'; }

// Ecriture du doc config COMPLET (ne jamais le remplacer par la seule cle ajoutee).
function _mvMurSaveCfg(){
  if(!window.fbSave)return;
  window.CONFIG=window.CONFIG||{};
  if(typeof CONFIG!=='undefined')CONFIG=window.CONFIG;
  if(typeof saveData==='function')saveData('config');
}

function saveMurMot(){
  if(!(typeof isAdmin==='function'&&isAdmin()))return;
  var mb=document.getElementById('mur-body');
  var ta=mb?mb.querySelector('.mur-ta'):null;
  var txt=ta?String(ta.value||'').trim():'';
  if(!txt){ showToast('Rien à enregistrer','#B85A1A'); return; }
  var cfg=window.CONFIG||{};
  cfg.mur_mot={txt:txt.slice(0,600),par:(currentUser&&currentUser.nom)||'',
               date:_mvMurDate(new Date())};
  window.CONFIG=cfg;
  _mvMurSaveCfg();
  renderMur();
  showToast('\u{2705} Mot enregistré pour l\'équipe','#3D6B27');
}

function clearMurMot(){
  if(!(typeof isAdmin==='function'&&isAdmin()))return;
  var cfg=window.CONFIG||{};
  delete cfg.mur_mot;
  window.CONFIG=cfg;
  _mvMurSaveCfg();
  renderMur();
  showToast('Mot effacé','#B85A1A');
}

function setMurVisible(v){
  if(!(typeof isAdmin==='function'&&isAdmin()))return;
  var cfg=window.CONFIG||{};
  cfg.mur_visible=(v==='admin')?'admin':'equipe';
  window.CONFIG=cfg;
  _mvMurSaveCfg();
  renderMur();
}

function openMur(){
  renderMur();
  if(typeof openOv==='function')openOv('ovMur');
}

window.openMur=openMur;
window.renderMur=renderMur;
window.saveMurMot=saveMurMot;
window.clearMurMot=clearMurMot;
window.setMurVisible=setMurVisible;


window.renderMaTrace=renderMaTrace;



window.renderHomeMeteo5=renderHomeMeteo5;

// ════ PARCELLES ════

// ════════════════════════════════════════════════════════════════════════════
// MULTI-TÂCHES — niveaux (Relevage) & passages (Ebourgeonnage/Pioche)
// ════════════════════════════════════════════════════════════════════════════

// Règle skip Relevage : N3 sans N1 → N1 auto ; N1+N3 → N2 auto
function _computeAutoNiv(done, planNb) {
  planNb = planNb || SAISON_PASSAGES['Relevage'] || 3;
  if(done.indexOf(planNb) < 0) return [];
  var auto = [];
  for(var _cai=1; _cai<planNb; _cai++){
    if(done.indexOf(_cai) < 0) auto.push(_cai);
  }
  return auto;
}

// Statut global d'une tâche multi-type sur une parcelle
function getTacheStatut(p, nomTache) {
  var s = _tachesFor(p)[nomTache];
  if (!s) return 'Non démarré';
  if (typeof s === 'string') return s;
  if (typeof s === 'object') {
    if (nomTache === 'Relevage') {
      var rPlanGlobal = SAISON_PASSAGES['Relevage'] || 3;
      var rPlanNb = (s.ov != null) ? Math.min(s.ov, rPlanGlobal) : rPlanGlobal;
      var rAllDone = true, rAnyDone = false, rAnyComm = false;
      for(var _ri=1; _ri<=rPlanNb; _ri++){
        var _rv = s['n'+_ri];
        if(_rv==='Validé'||_rv==='Auto'){rAnyDone=true;}
        else if(_rv==='Commencé'){rAnyComm=true;rAllDone=false;}
        else{rAllDone=false;}
      }
      return (rAllDone&&rAnyDone) ? 'Validé' : (rAnyDone||rAnyComm) ? 'En cours' : 'Non démarré';
    }
    if (nomTache === 'Ebourgeonnage' || nomTache === 'Pioche') {
      var globalNb = SAISON_PASSAGES[nomTache] || 2;
      var planNb = (s.ov != null) ? Math.min(s.ov, globalNb) : globalNb; // ov ne peut pas dépasser le global
      var doneCnt = 0, commCnt = 0;
      for (var i = 1; i <= planNb; i++) {
        if (s['p'+i] === 'Validé') doneCnt++;
        else if (s['p'+i] === 'Commencé') commCnt++;
      }
      return doneCnt >= planNb ? 'Validé' : (doneCnt > 0 || commCnt > 0) ? 'En cours' : 'Non démarré';
    }
  }
  return 'Non démarré';
}

// État niveaux Relevage d'une parcelle : {done:[1,3], auto:[2]}
function _relNivState(p) {
  var s = _tachesFor(p)['Relevage'];
  var planGlobal = SAISON_PASSAGES['Relevage'] || 3;
  if (!s || typeof s === 'string') {
    return (s === 'Validé') ? {done:[1], auto:[], ov:null, planNb:1} : {done:[], auto:[], ov:null, planNb:planGlobal};
  }
  var ov = (s.ov != null) ? s.ov : null;
  var planNb = ov != null ? Math.min(ov, planGlobal) : planGlobal;
  var done = [], auto = [], comm = [];
  for(var _l=1; _l<=planNb; _l++){
    var _v = s['n'+_l];
    if (_v === 'Validé') done.push(_l);
    else if (_v === 'Auto') auto.push(_l);
    else if (_v === 'Commencé') comm.push(_l);
  }
  return {done:done, auto:auto, comm:comm, ov:ov, planNb:planNb};
}

// Badges HTML niveaux Relevage (inline, pour openDP)
function _relNivBadgesHtml(p) {
  var st = _relNivState(p);
  var planNb = st.planNb || 3;
  var planGlobal = SAISON_PASSAGES['Relevage'] || 3;
  var html = Array.from({length:planNb},function(_,i){return i+1;}).map(function(l) {
    var d = st.done.indexOf(l)>=0, a = st.auto.indexOf(l)>=0, c = (st.comm||[]).indexOf(l)>=0;
    var bg = d ? 'rgba(90,156,74,0.15)' : a ? 'rgba(74,159,200,0.13)' : c ? 'rgba(220,140,30,0.12)' : 'rgba(255,255,255,0.05)';
    var col = d ? '#6AB855' : a ? '#4A9FC8' : c ? '#DCA030' : '#5A5248';
    var brd = d ? 'rgba(90,156,74,0.4)' : a ? 'rgba(74,159,200,0.35)' : c ? 'rgba(220,140,30,0.35)' : 'rgba(255,255,255,0.08)';
    var lbl = d ? '✓' : a ? '~' : c ? '▶' : '○';
    return '<span style="display:inline-flex;align-items:center;padding:2px 7px;border-radius:5px;font-size:11px;font-weight:700;background:'+bg+';color:'+col+';border:1px solid '+brd+'">'+lbl+' N'+l+'</span>';
  }).join('');
  if(st.ov != null && st.ov < planGlobal) {
    html += ' <span style="font-size:11px;color:var(--ink-info,#4A9FC8)">⚙</span>';
  }
  return html;
}

// Badges HTML passages Eb/Pioche (inline, pour openDP)
function _passBadgesHtml(p, nomTache) {
  var s = _tachesFor(p)[nomTache];
  var globalNb = SAISON_PASSAGES[nomTache]||2;
  var planNb = (!s || typeof s === 'string') ? globalNb
             : ((s.ov != null) ? Math.min(s.ov, globalNb) : globalNb); // ov capé au global
  var html = '';
  for (var i = 1; i <= planNb; i++) {
    var d = s && typeof s === 'object' ? s['p'+i]==='Validé' : (s==='Validé');
    var c = s && typeof s === 'object' ? s['p'+i]==='Commencé' : false;
    html += '<span style="display:inline-flex;align-items:center;padding:2px 7px;border-radius:5px;font-size:11px;font-weight:700;'
          + 'background:'+(d?'rgba(90,156,74,0.15)':c?'rgba(220,140,30,0.12)':'rgba(255,255,255,0.05)')
          + ';color:'+(d?'#6AB855':c?'#DCA030':'#5A5248')
          + ';border:1px solid '+(d?'rgba(90,156,74,0.4)':c?'rgba(220,140,30,0.35)':'rgba(255,255,255,0.08)')+'">'+( d?'✓':c?'▶':'○')+' P'+i+'</span>';
  }
  // Icône ⚙ seulement si ov < global (parcelle avec moins de passages que le standard)
  if (s && typeof s === 'object' && s.ov != null && s.ov < globalNb) {
    html += ' <span style="font-size:11px;color:var(--ink-info,#4A9FC8)">⚙</span>';
  }
  return html;
}

// ── Migration tâches multi-type — idempotente, tourne à chaque login ─────────
function _migrateRelev2() { _migrateTachesV3(); } // alias backward-compat
function _migrateTachesV3() {
  var changed = false;
  var changedTaches = false; // flag séparé : saveData('taches') uniquement si TACHES a réellement changé

  // ── 1. Nettoyage TACHES via _normalizeTaches (standard tasks toujours là)
  var oldSer = JSON.stringify(TACHES.map(function(t){return t.nom;}).sort());
  TACHES = _normalizeTaches(TACHES); window.TACHES = TACHES;
  var newSer = JSON.stringify(TACHES.map(function(t){return t.nom;}).sort());
  if(oldSer !== newSer) { changed = true; changedTaches = true; }

  // ── 2. Migration PARCELLES : convert string→objet + renommage Eb1/Pi1 ────
  PARCELLES.forEach(function(p){
    if(!p.taches)return;
    // Relevage string → objet niveaux
    var relOld=p.taches['Relevage'], rel2=p.taches['Relevage 2'];
    if(typeof relOld!=='object'||relOld===null){
      var nr={n1:'Non démarré',n2:'Non démarré',n3:'Non démarré'};
      if(relOld==='Validé'||relOld==='En cours')nr.n1='Validé';
      if(rel2==='Validé'||rel2==='En cours')nr.n2='Validé';
      var dn=[]; if(nr.n1==='Validé')dn.push(1); if(nr.n2==='Validé')dn.push(2); if(nr.n3==='Validé')dn.push(3);
      var an=_computeAutoNiv(dn); if(an.indexOf(1)>=0)nr.n1='Auto'; if(an.indexOf(2)>=0)nr.n2='Auto';
      p.taches['Relevage']=nr; delete p.taches['Relevage 2']; changed=true;
    } else if(p.taches['Relevage 2']!==undefined){ delete p.taches['Relevage 2']; changed=true; }
    // Ebourgeonnage1 → Ebourgeonnage
    if(p.taches['Ebourgeonnage1']!==undefined){
      var eb=(typeof p.taches['Ebourgeonnage']==='object'&&p.taches['Ebourgeonnage'])||{ov:null};
      if(p.taches['Ebourgeonnage1']==='Validé'||p.taches['Ebourgeonnage1']==='En cours')eb.p1='Validé';
      p.taches['Ebourgeonnage']=eb; delete p.taches['Ebourgeonnage1']; changed=true;
    }
    if(typeof p.taches['Ebourgeonnage']==='string'){
      var oldEb=p.taches['Ebourgeonnage'],newEb={ov:null};
      if(oldEb==='Validé')newEb.p1='Validé'; p.taches['Ebourgeonnage']=newEb; changed=true;
    }
    // Pioche1 → Pioche
    if(p.taches['Pioche1']!==undefined){
      var pi=(typeof p.taches['Pioche']==='object'&&p.taches['Pioche'])||{ov:null};
      if(p.taches['Pioche1']==='Validé'||p.taches['Pioche1']==='En cours')pi.p1='Validé';
      p.taches['Pioche']=pi; delete p.taches['Pioche1']; changed=true;
    }
    if(typeof p.taches['Pioche']==='string'){
      var oldPi=p.taches['Pioche'],newPi={ov:null};
      if(oldPi==='Validé')newPi.p1='Validé'; p.taches['Pioche']=newPi; changed=true;
    }
  });

  // ── 3. SAISON_PASSAGES depuis CONFIG (fallback : 2 passages) ─────────────
  if(CONFIG&&CONFIG.saison_passages){
    SAISON_PASSAGES=Object.assign({Ebourgeonnage:2,Pioche:2,Relevage:3},CONFIG.saison_passages);
    window.SAISON_PASSAGES=SAISON_PASSAGES;
  }

  // ── 4. Reset TOUS les TRAVAUX et recalcul (chaque login, pas de cache périmé)
  // Inclut les tâches simples (Réparation, Pliage…) qui pouvaient avoir surf_total périmé
  Object.keys(TRAVAUX).forEach(function(n){delete TRAVAUX[n];});
  TACHES.forEach(function(t){recalcTravaux(t.nom);});
  window.TRAVAUX=TRAVAUX;

  // ── 5. Sauvegarder si des données ont changé ──────────────────────────────
  if(changed){
    if(DEBUG) console.log('[Migration] _migrateTachesV3 — données migrées, sauvegarde');
    saveData('parcelles');
    if(changedTaches) saveData('taches'); // ne sauvegarder taches que si elles ont vraiment changé
    setTimeout(function(){
      var pid = (document.querySelector('.page.active')||{}).id||'';
      if(pid==='page-home'&&typeof renderHome==='function') renderHome();
      if(pid==='page-reglages') window.renderReglages();
    }, 200);
  }
  // Fix ciblé : reset p2+ si ancienne migration a mis p2:'Validé' par erreur
  _fixPassagesP2();
}

// Reset p2+ pour Eb/Pioche — la 1ère migration avait mis p1+p2 au lieu de p1 seul
function _fixPassagesP2(){
  var flag='mavigne_pass_fix_v2';
  if(localStorage.getItem(flag))return;
  var changed=false;
  PARCELLES.forEach(function(p){
    if(!p.taches)return;
    ['Ebourgeonnage','Pioche'].forEach(function(nom){
      var s=p.taches[nom];
      if(!s||typeof s!=='object')return;
      // Retirer tous les passages sauf p1
      var newS={ov:s.ov!=null?s.ov:null};
      if(s.p1==='Validé')newS.p1='Validé'; // garder P1 si validé
      // p2, p3... remis à zéro (la migration avait tout mis à Validé par erreur)
      var hadExtra=s.p2==='Validé'||s.p3==='Validé';
      if(hadExtra){p.taches[nom]=newS;changed=true;}
    });
  });
  localStorage.setItem(flag,'1');
  if(changed){
    if(DEBUG) console.log('[_fixPassagesP2] p2+ remis à Non démarré pour Eb/Pioche');
    saveData('parcelles');
    setTimeout(function(){
      ['Ebourgeonnage','Pioche'].forEach(function(n){delete TRAVAUX[n];recalcTravaux(n);});
      window.TRAVAUX=TRAVAUX;saveData('travaux');
      var pid=(document.querySelector('.page.active')||{}).id||'';
      if(pid==='page-home')renderHome();
    },300);
  }
}

// Valider P1 pour toutes les parcelles actives d'une tâche passages
function bulkValidateP1(nomTache){
  if(_mvValidBlocked())return;
  if(!isAdmin()){showToast('Admin requis','#B85A1A');return;}
  var date=new Date().toISOString().split('T')[0];
  var cnt=0;
  PARCELLES.filter(function(p){return p.statut!=='Arrachee';}).forEach(function(p){
    var s=p.taches&&p.taches[nomTache];
    var obj=(s&&typeof s==='object')?Object.assign({},s):{ov:null};
    if(obj.p1!=='Validé'){obj.p1='Validé';p.taches[nomTache]=obj;cnt++;}
  });
  if(cnt>0){
    JOURNAL.unshift({id:Date.now().toString(16),date,parcelle:'Domaine',tache:nomTache,qui:currentUser.nom,statut:'Validé',equipe:false,membresEquipe:[],note:'P1 - validation groupée '+cnt+' parcelles'});
    recalcTravaux(nomTache);
    saveData('parcelles');saveData('journal');saveData('travaux');
    showToast('P1 '+nomTache+' validé sur '+cnt+' parcelles','#3D6B27');
    window.renderReglages();if(typeof renderHome==='function')renderHome();
  } else {
    showToast('P1 '+nomTache+' déjà validé partout','#3D6B27');
  }
}

// ── Dégradé d'avancement continu 0%→100% (terre brûlée → orange → ambre → vert vigne) ──
const _PCT_STOPS=[
  {p:0,   c:[181,67,28]},
  {p:0.30,c:[201,112,30]},
  {p:0.55,c:[201,161,42]},
  {p:0.78,c:[132,174,58]},
  {p:1,   c:[78,140,50]}
];
function _lerp(a,b,t){return Math.round(a+(b-a)*t);}
function pctColor(pct){
  var t=Math.max(0,Math.min(1,(parseFloat(pct)||0)/100));
  for(var i=1;i<_PCT_STOPS.length;i++){
    if(t<=_PCT_STOPS[i].p){
      var a=_PCT_STOPS[i-1],b=_PCT_STOPS[i],k=(t-a.p)/(b.p-a.p);
      return 'rgb('+_lerp(a.c[0],b.c[0],k)+','+_lerp(a.c[1],b.c[1],k)+','+_lerp(a.c[2],b.c[2],k)+')';
    }
  }
  return 'rgb(78,140,50)';
}
function getPCls(p){
  const tachesSaison=getTachesSaison();
  const exclues=p.tachesExclues||[];
  // Tâches actives (non exclues pour cette parcelle)
  const tachesActives=tachesSaison.filter(t=>!exclues.includes(t.nom));
  const totalSaison=tachesActives.length;
  const nbDone=tachesActives.filter(t=>getTacheStatut(p,t.nom)==='Validé').length;
  const pct=totalSaison>0?Math.round(nbDone/totalSaison*100):0;
  if(p.statut==='Arrachee')return{a:'ava-x',d:'dr',cl:'pr',col:'var(--rouge)',fill:'var(--rouge)',em:'🚫',pct,nbDone,nbTotal:totalSaison};
  var _gc=pctColor(pct);
  if(pct===100)return{a:'ava-c',d:'dc',cl:'pv',col:_gc,fill:_gc,em:'✅',pct,nbDone,nbTotal:totalSaison};
  if(pct>=75)return{a:'ava-a',d:'da',cl:'pa',col:_gc,fill:_gc,em:'🌿',pct,nbDone,nbTotal:totalSaison};
  return{a:'ava-r',d:'dr',cl:'pr',col:_gc,fill:_gc,em:'🍇',pct,nbDone,nbTotal:totalSaison};
}
function computePStats(){
  let c=0,e=0,r=0,a=0;
  PARCELLES.forEach(p=>{
    if(p.statut==='Arrachee')a++;
    else{const cl=getPCls(p);if(cl.pct===100)c++;else if(cl.pct>=75)e++;else r++;}
  });
  document.getElementById('pc-c').textContent=c;
  document.getElementById('pc-e').textContent=e;
  document.getElementById('pc-a').textContent=a;
  const pcBadge=document.getElementById('pc-badge');
  if(pcBadge)pcBadge.textContent=(c+e+r)+' actives';
  document.getElementById('p-saison-sub').textContent=`${c+e+r} actives · ${_visuSaison()}`;
  if(typeof _updateSaisonSelector==='function')_updateSaisonSelector();
}
/* ── Tri des parcelles par proximité GPS (lecture seule, tous rôles) ── */
function _geoHaversine(p1,p2){
  var R=6371000,toR=function(d){return d*Math.PI/180;};
  var dLa=toR(p2.lat-p1.lat),dLn=toR(p2.lng-p1.lng);
  var h=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(toR(p1.lat))*Math.cos(toR(p2.lat))*Math.sin(dLn/2)*Math.sin(dLn/2);
  return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));
}
function _geoPointInPoly(pt,pts){
  var inside=false,x=pt.lng,y=pt.lat;
  for(var i=0,j=pts.length-1;i<pts.length;j=i++){
    var xi=pts[i][1],yi=pts[i][0],xj=pts[j][1],yj=pts[j][0];
    if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;
  }
  return inside;
}
function _geoFmtDist(m){
  if(!isFinite(m))return '';
  if(m<950)return Math.max(10,Math.round(m/10)*10)+' m';
  return (m/1000).toFixed(1).replace('.',',')+' km';
}
function _pProxKmlSrc(){
  return (window.KML_POLYGONS_DYNAMIC&&window.KML_POLYGONS_DYNAMIC.length)?window.KML_POLYGONS_DYNAMIC:((typeof KML_DATA!=='undefined')?KML_DATA:[]);
}
function _pProxPolyOf(nom){
  var src=_pProxKmlSrc();
  var k=src.find(function(x){return x.name&&x.name.toLowerCase()===String(nom||'').toLowerCase();});
  return (k&&k.pts&&k.pts.length)?k.pts:null;
}
function _pProxPoint(p){
  var poly=_pProxPolyOf(p.nom);
  if(poly){
    var c=poly.reduce(function(s,pt){return[s[0]+pt[0],s[1]+pt[1]];},[0,0]);
    return {lat:c[0]/poly.length,lng:c[1]/poly.length};
  }
  var la=parseFloat(p.lat),ln=parseFloat(p.lng);
  if(isFinite(la)&&isFinite(ln)&&(la!==0||ln!==0))return {lat:la,lng:ln};
  return null;
}
function _pProxDistOf(p){
  if(!_pProxPos)return null;
  var pt=_pProxPoint(p);
  if(!pt)return Infinity;
  return _geoHaversine(_pProxPos,pt);
}
function _pProxDetectHere(pos){
  var src=_pProxKmlSrc();
  for(var i=0;i<src.length;i++){
    if(src[i].pts&&src[i].pts.length&&_geoPointInPoly(pos,src[i].pts)){
      var nm=src[i].name;
      var pc=(window.PARCELLES||[]).find(function(x){return x.nom&&x.nom.toLowerCase()===String(nm||'').toLowerCase();});
      if(pc)return pc.nom;
    }
  }
  return null;
}
function pToggleProximite(){
  if(_pProxPos){ _pProxPos=null; _pProxHere=null; renderParcelles(); return; }
  if(!navigator.geolocation){ showToast('Position indisponible sur cet appareil','#C0392B'); return; }
  _pProxLoading=true; _pvRenderProxBar();
  navigator.geolocation.getCurrentPosition(function(pos){
    _pProxLoading=false;
    _pProxPos={lat:pos.coords.latitude,lng:pos.coords.longitude};
    _pProxHere=_pProxDetectHere(_pProxPos);
    if(navigator.vibrate)navigator.vibrate(40);
    renderParcelles();
  },function(){
    _pProxLoading=false; _pProxPos=null; _pProxHere=null;
    showToast('Position indisponible — tri normal conservé','#C0392B');
    _pvRenderProxBar();
  },{enableHighAccuracy:true,timeout:12000,maximumAge:30000});
}
/* ═══════════════════════════════════════════════════════════════════
   TOURNÉE — l'ordre de passage de Pilotage arrive ICI
   ───────────────────────────────────────────────────────────────────
   Jusqu'ici « Enregistrer l'ordre » écrivait CONFIG.ordre_passage et
   PERSONNE ne le lisait : le message « partagé à l'équipe » était faux
   depuis le premier jour (vérifié par grep : zéro occurrence hors
   pilotage.js). L'ordre est maintenant rangé PAR TÂCHE et pilote deux
   choses : le tri de cette liste, et les numéros sur la carte.
   Règles arbitrées :
     · numérotation VIVANTE — le rang se recalcule sur les parcelles
       réellement affichées : 1, 2, 3… sans trou quand une parcelle est
       terminée (c'est déjà ce que fait Pilotage) ;
     · la tournée suit la TÂCHE AFFICHÉE — filtre « Toutes tâches » = pas
       de tournée, deux équipes sur deux travaux voient chacune la sienne ;
     · elle est active par défaut, avec une sortie « Tri normal » retenue
       par utilisateur (localStorage, comme l'isolation des périodes) ;
     · la proximité GPS, si l'ouvrier l'active, PASSE DEVANT : c'est un
       geste explicite fait sur le terrain, il gagne toujours ;
     · rien ne s'applique quand on consulte une période archivée.
   ═══════════════════════════════════════════════════════════════════ */
var _pOrdRangs={rang:{},n:0,ok:false,hors:0};
function _pOrdKey(){ try{ return 'mavigne_ordre_off_'+(localStorage.getItem('mavigne_tenant')||''); }catch(e){ return 'mavigne_ordre_off_'; } }
function _pOrdOff(){ try{ return localStorage.getItem(_pOrdKey())==='1'; }catch(e){ return false; } }
function pOrdreToggle(){ try{ localStorage.setItem(_pOrdKey(), _pOrdOff()?'0':'1'); }catch(e){ if(window.logError)window.logError({level:'info',cat:'tournee',msg:'preference tri non memorisee'}); } renderParcelles(); }
// Une tournée décrit le travail d'AUJOURD'HUI : consulter une archive ne doit
// pas réorganiser l'écran avec elle.
function _pOrdPeriodeOK(){
  try{
    var act=(getSaisonActive()||{}).nom||'';
    if(!act) return true;
    return (typeof _visuSaison!=='function') || _visuSaison()===act;
  }catch(e){ return true; }
}
// Tâche dont la tournée s'applique — la tâche affichée, rien d'autre.
function _pOrdTache(){
  if(_pOrdOff()||!_pOrdPeriodeOK()) return '';
  if(pTacheFilter==='toutes') return '';
  if(typeof window._mvOrdreFor!=='function') return '';
  return window._mvOrdreFor(pTacheFilter) ? pTacheFilter : '';
}
function _pOrdCalc(noms){
  var t=_pOrdTache();
  _pOrdRangs=(t && typeof window._mvOrdreRangs==='function') ? window._mvOrdreRangs(t,noms) : {rang:{},n:0,ok:false,hors:0};
  return _pOrdRangs;
}
function _pOrdRang(nom){ var r=(_pOrdRangs&&_pOrdRangs.rang)?_pOrdRangs.rang[nom]:null; return (r>0)?r:null; }
function _pOrdPill(nom){ var r=_pOrdRang(nom); return r?('<span class="pc-ord">'+r+'</span>'):''; }
function _pOrdDateFr(iso){ var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||'')); return m?(m[3]+'/'+m[2]):''; }
// Étiquette de carte : le numéro devant le nom quand la tournée est active.
function _pOrdMapLabel(nom){ var r=_pOrdRang(nom); return (r?('<span class="pl-ord">'+r+'</span>'):'')+_escHtml(nom||''); }
function _pOrdMapSync(){
  if(typeof leafMap==='undefined'||!leafMap||!_leafLayers||!_leafLayers.length) return;
  _leafLayers.forEach(function(item){
    if(!item||!item.tooltip) return;
    var nm=item.parcelle?item.parcelle.nom:(item.kname||'');
    try{ item.tooltip.setContent(_pOrdMapLabel(nm)); }catch(e){ if(window.logError)window.logError({level:'info',cat:'tournee',msg:'etiquette carte'}); }
  });
}
function _pvRenderOrdreBar(){
  var el=document.getElementById('p-ordre-bar'); if(!el) return;
  var dispo=(typeof window._mvOrdreTaches==='function')?window._mvOrdreTaches():[];
  if(!dispo.length || !_pOrdPeriodeOK()){ el.innerHTML=''; el.style.display='none'; return; }
  el.style.display='';
  if(_pOrdOff()){
    el.innerHTML='<button onclick="pOrdreToggle()" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;min-height:40px;border:1.5px dashed var(--or);border-radius:12px;background:transparent;color:var(--or);font-size:13px;font-weight:600;font-family:inherit;cursor:pointer">🧭 Reprendre la tournée du domaine</button>';
    return;
  }
  var t=_pOrdTache();
  if(t){
    var o=window._mvOrdreFor(t)||{}, n=_pOrdRangs.n||0, d=_pOrdDateFr(o.date);
    var sub=(n>0?(n+' parcelle'+(n>1?'s':'')+' à faire, dans l’ordre'):'tout est fait sur ce travail')+(d?(' · ordre du '+d):'');
    el.innerHTML='<div style="display:flex;align-items:center;gap:10px;background:var(--bg-card);border:1.5px solid var(--or);border-radius:12px;padding:9px 12px">'
      +'<span style="font-size:17px;flex-shrink:0">🧭</span>'
      +'<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;color:var(--texte);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Tournée du domaine · '+_escHtml(t)+'</div>'
      +'<div style="font-size:11px;color:var(--texte-doux)">'+_escHtml(sub)+'</div></div>'
      +'<button onclick="pOrdreToggle()" style="border:none;background:var(--gris-clair);border-radius:9px;min-height:34px;padding:0 11px;font-size:12px;font-weight:600;color:var(--texte);cursor:pointer;font-family:inherit;flex-shrink:0">Tri normal</button></div>';
    return;
  }
  // Filtre « Toutes tâches » : une tournée existe mais on ne sait pas laquelle
  // appliquer. On le dit, et on donne l'accès en un tap.
  if(pTacheFilter==='toutes'){
    el.innerHTML='<div style="background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:12px;padding:8px 11px">'
      +'<div style="font-size:11.5px;color:var(--texte-doux);margin-bottom:6px">🧭 Tournée définie pour :</div>'
      +'<div style="display:flex;flex-wrap:wrap;gap:6px">'
      +dispo.map(function(nm){
          var em=(window.TEMOJI&&window.TEMOJI[nm])?window.TEMOJI[nm]:'🌿';
          return '<button onclick="setPTacheFilter(\''+_escAttr(nm)+'\')" style="border:1px solid var(--or);background:rgba(201,168,76,.12);color:var(--or);border-radius:20px;min-height:34px;padding:0 12px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit">'+em+' '+_escHtml(nm)+'</button>';
        }).join('')
      +'</div></div>';
    return;
  }
  el.innerHTML=''; el.style.display='none';
}
function _pvRenderProxBar(){
  var el=document.getElementById('p-prox-bar');
  if(!el)return;
  if(_pProxLoading){
    el.innerHTML='<button disabled style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;border:none;border-radius:12px;background:var(--gris-clair);color:var(--texte-doux);font-size:14px;font-weight:600;font-family:inherit">📍 Localisation…</button>';
    return;
  }
  if(_pProxPos){
    var sub=_pProxHere?('Vous êtes sur '+_escHtml(_pProxHere)):'Plus proche en tête';
    el.innerHTML='<div style="display:flex;align-items:center;gap:10px;background:var(--bg-card);border:1.5px solid #C0845A;border-radius:12px;padding:9px 12px">'
      +'<span style="width:11px;height:11px;border-radius:50%;background:#C0845A;flex-shrink:0"></span>'
      +'<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--texte)">Trié par proximité</div>'
      +'<div style="font-size:11px;color:var(--texte-doux)">'+sub+'</div></div>'
      +'<button onclick="pToggleProximite()" style="border:none;background:var(--gris-clair);border-radius:9px;min-height:34px;padding:0 11px;font-size:13px;font-weight:600;color:var(--texte);cursor:pointer;font-family:inherit">✕</button></div>';
  } else {
    el.innerHTML='<button onclick="pToggleProximite()" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;border:none;border-radius:12px;background:#2B1A10;color:#F0E2C8;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer">📍 Trier par proximité</button>';
  }
}
window.pToggleProximite=pToggleProximite;
window.pOrdreToggle=pOrdreToggle;
window._pOrdMapSync=_pOrdMapSync;

function renderParcelles(){
  if(!window._dataReady){ var _skc=document.getElementById('pList'); if(_skc)_skc.innerHTML=window._mvSk('parcelles'); return; }
  // Encart priorité (message + tâche prioritaire)
  var _prioIts=(typeof _prioItems==='function')?_prioItems():[];
  var _prioTaskOK=_prioIts.length>0;
  var _prioActive=!!(priorityMessage||_prioTaskOK);
  var _prioLocked=_prioTaskOK&&!isAdmin()&&!_prioOverride;
  const pb=document.getElementById('priority-banner');
  const pe=document.getElementById('priority-empty');
  const editBtn=document.getElementById('priority-edit-btn');
  const pTaskRow=document.getElementById('priority-task-row');
  const pTaskTxt=document.getElementById('priority-task-text');
  if(_prioActive){
    pb.style.display='block';pe.style.display='none';
    var _pt=document.getElementById('priority-text');
    if(_pt){_pt.textContent=priorityMessage||'';_pt.style.display=priorityMessage?'':'none';}
    if(pTaskRow){
      if(_prioTaskOK){
        pTaskRow.style.display='';
        if(pTaskTxt)pTaskTxt.textContent=_prioIts.map(function(it){
          var _em=(window.TEMOJI&&window.TEMOJI[it.t])?window.TEMOJI[it.t]:String.fromCodePoint(0x2B50);
          return _em+' '+(typeof tNom==='function'?tNom(it.t):it.t);
        }).join('  \u00B7  ');
      } else { pTaskRow.style.display='none'; }
    }
    if(editBtn)editBtn.style.display=isAdmin()?'block':'none';
  } else {
    pb.style.display='none';
    if(pe)pe.style.display=isAdmin()?'block':'none';
  }
  // Mettre à jour le filtre tâche
  const tachesSaisonF=getTachesSaison();
  const parcActivesFilt=PARCELLES.filter(p=>p.statut!=='Arrachee');
  const tachesSaisonFSorted=[...tachesSaisonF].sort((a,b)=>{
    const doneA=parcActivesFilt.length>0&&parcActivesFilt.every(p=>getTacheStatut(p,a.nom)==='Validé')?1:0;
    const doneB=parcActivesFilt.length>0&&parcActivesFilt.every(p=>getTacheStatut(p,b.nom)==='Validé')?1:0;
    return doneA-doneB;
  });
  // Verrouillage du filtre tâche pour l'équipe quand une tâche prioritaire est active
  if(_prioLocked && !_prioIts.some(function(it){return it.t===pTacheFilter;})){ var _pdef=_prioDefaultTask(_prioIts); pTacheFilter=_pdef; pCurStep=_pvSmartStep(_pdef); }
  if(_prioLocked) _prioSeedEquipe(pTacheFilter);
  const tfRow=document.getElementById('p-tache-filter-row');
  if(tfRow){
    if(_prioLocked){
      var _tgt=String.fromCodePoint(0x2B50);
      var _mePr=(currentUser&&currentUser.nom)||'';
      var _chipsP=_prioIts.map(function(it,i){
        var _em=(window.TEMOJI&&window.TEMOJI[it.t])?window.TEMOJI[it.t]:String.fromCodePoint(0x1F3AF);
        var _mine=_mePr&&(it.equipe||[]).indexOf(_mePr)>=0;
        var _on=(pTacheFilter===it.t);
        return '<span class="p-focus-tache'+(_on?' pft-on':'')+(_prioIts.length>1?' pft-click':'')+'" onclick="_prioPick('+i+')">'
          +_em+' '+_escHtml(typeof tNom==='function'?tNom(it.t):it.t)
          +(_mine?' <span class="pft-me">'+String.fromCodePoint(0x1F464)+' Toi</span>':'')
          +'</span>';
      }).join('');
      tfRow.innerHTML='<div class="p-focus-bar"><span class="p-focus-lbl">'+_tgt+' Priorit\u00e9 du moment</span>'+_chipsP+'<button class="p-focus-all" onclick="_prioShowAll()">Voir toutes les t\u00e2ches</button></div>';
    } else {
    var showDoneBtn=pTacheFilter!=='toutes'?`<div class="ptfchip${pShowDone?' active ac':''}" onclick="pShowDone=!pShowDone;renderParcelles()" style="margin-left:auto;flex-shrink:0;border-style:dashed">${pShowDone?'👁 Toutes':'🔲 À faire'}</div>`:'';
    var backPrio=(_prioTaskOK&&!isAdmin()&&_prioOverride)?'<div class="ptfchip pfc-back" onclick="_prioBackToPriority()">\u2190 Priorit\u00e9</div>':'';
    tfRow.innerHTML=backPrio+`<div class="ptfchip${pTacheFilter==='toutes'?' active':''}" data-t="toutes" onclick="setPTacheFilter('toutes',this)">Toutes tâches</div>`
      +tachesSaisonFSorted.map(t=>`<div class="ptfchip${pTacheFilter===t.nom?' active':''}" data-t="${t.nom}" onclick="setPTacheFilter('${_escAttr(t.nom)}',this)">${TEMOJI[t.nom]||'🌿'} ${t.nom}</div>`).join('')
      +showDoneBtn;
    }
  }
  _pvRenderSubsel();
  _pvRenderTeamBar();
  const _dataF=PARCELLES.filter(p=>{
    const cl=getPCls(p);
    if(pFilter==='complet'&&(cl.pct!==100||p.statut==='Arrachee'))return false;
    if(pFilter==='avance'&&(cl.pct<75||cl.pct===100||p.statut==='Arrachee'))return false;
    if(pFilter==='arrachee'&&p.statut!=='Arrachee')return false;
    if(pSearch&&!p.nom.toLowerCase().includes(pSearch.toLowerCase()))return false;
    // Filtre par tâche : afficher seulement les parcelles où la tâche n'est pas encore Validé
    if(pTacheFilter!=='toutes'){
      if(p.statut==='Arrachee')return false; // jamais dans le filtre tâche
      if((p.tachesExclues||[]).includes(pTacheFilter))return false; // tâche désactivée sur cette parcelle
      if(!pShowDone&&_pvCurDone(p,pTacheFilter))return false; // étape/tâche courante déjà faite (QV)
    }
    return true;
  });
  // Rangs de la tournee : calcules sur l'ensemble AFFICHE, avant le tri.
  _pOrdCalc(_dataF.map(function(p){return p.nom;}));
  const data=_dataF.sort((a,b)=>{
    // Parcelles arrachées toujours en dernier
    const arrA=a.statut==='Arrachee'?1:0, arrB=b.statut==='Arrachee'?1:0;
    if(arrA!==arrB)return arrA-arrB;
    if(_pProxPos){
      const da=_pProxDistOf(a), db=_pProxDistOf(b);
      if(da!==db)return da-db;
      return a.nom.localeCompare(b.nom,'fr');
    }
    // Tournee du domaine : APRES la proximite GPS (geste explicite du terrain,
    // il gagne toujours), AVANT le tri par statut. Une parcelle hors tournee
    // passe derriere celles qui en font partie.
    if(_pOrdRangs.ok){
      const oa=_pOrdRang(a.nom), ob=_pOrdRang(b.nom);
      if(oa&&ob){ if(oa!==ob) return oa-ob; }
      else if(oa) return -1;
      else if(ob) return 1;
    }
    if(pTacheFilter!=='toutes'){
      // Tri par statut de la tâche filtrée : Non démarré > En cours
      const ordre={'Non démarré':0,'En cours':1};
      const sa=ordre[(_tachesFor(a)[pTacheFilter])||'Non démarré']??0;
      const sb=ordre[(_tachesFor(b)[pTacheFilter])||'Non démarré']??0;
      if(sa!==sb)return sa-sb;
    }
    const pa=getPCls(a).pct, pb=getPCls(b).pct;
    if(pa!==pb)return pa-pb;
    return a.nom.localeCompare(b.nom,'fr');
  });
  const cont=document.getElementById('pList');
  if(!data.length){
    const msg=pTacheFilter!=='toutes'
      ?`<div class="empty-state"><div class="ei"><svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="28,4 50,16 50,44 28,56 6,44 6,16" fill="none" stroke="var(--texte-doux)" stroke-width="1.8"/><polyline points="18,28 25,35 38,21" stroke="var(--texte-doux)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="et">${pTacheFilter} terminé</div><div class="ed">Cette tâche est terminée sur toutes les parcelles de la saison !</div></div>`
      :`<div class="empty-state"><div class="ei"><svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="10" width="18" height="18" rx="3" fill="none" stroke="var(--texte-doux)" stroke-width="1.8" opacity="0.4"/><rect x="32" y="10" width="18" height="18" rx="3" fill="none" stroke="var(--texte-doux)" stroke-width="1.8" opacity="0.4"/><rect x="6" y="34" width="18" height="14" rx="3" fill="none" stroke="var(--texte-doux)" stroke-width="1.8" opacity="0.4"/><rect x="32" y="34" width="18" height="14" rx="3" fill="none" stroke="var(--texte-doux)" stroke-width="1.8" opacity="0.4"/><line x1="14" y1="5" x2="42" y2="53" stroke="var(--texte-doux)" stroke-width="2" stroke-linecap="round" opacity="0.65"/></svg></div><div class="et">Aucun résultat</div><div class="ed">Aucune parcelle ne correspond aux filtres actifs.</div></div>`;
    cont.innerHTML=msg;return;
  }
  cont.innerHTML=data.map(p=>{
    const cl=getPCls(p);
    const _proxD=_pProxPos?_pProxDistOf(p):null;
    const _proxHere=!!(_pProxPos&&_pProxHere&&p.nom===_pProxHere);
    const _proxPill=(_proxD!=null)?`<span style="display:inline-flex;align-items:center;gap:3px;background:${_proxHere?'#C0845A':'var(--gris-clair)'};color:${_proxHere?'#fff':'var(--texte-doux)'};border-radius:20px;padding:2px 8px;font-size:11px;font-weight:700;margin-left:6px">${_proxHere?'📍 ici':'↳ '+_geoFmtDist(_proxD)}</span>`:'';
    const _proxStyle=_proxHere?'border-color:#C0845A;box-shadow:inset 3px 0 0 #C0845A;':'';
    const tps=getTachesSaison().map(t=>([t.nom,getTacheStatut(p,t.nom)||'Non démarré']));
    let chips,more;
    if(pTacheFilter!=='toutes'){
      if(_pvType(pTacheFilter)!=='simple'){
        chips=_pvStepChips(p,pTacheFilter)
          +tps.filter(([t])=>t!==pTacheFilter).slice(0,1).map(([t,s])=>`<span class="tc ${s==='Validé'?'tcv':'tce'}">${t}</span>`).join('');
      } else {
        const statutFiltre=getTacheStatut(p,pTacheFilter)||'Non démarré';
        const badgeCls=statutFiltre==='En cours'?'tce':'tc-nd';
        const badgeEmoji=statutFiltre==='En cours'?'⏳':'🔲';
        chips=`<span class="tc ${badgeCls}" style="font-weight:700">${badgeEmoji} ${pTacheFilter} · ${statutFiltre}</span>`
          +tps.filter(([t])=>t!==pTacheFilter).slice(0,2).map(([t,s])=>`<span class="tc ${s==='Validé'?'tcv':'tce'}">${t}</span>`).join('');
      }
      more='';
    } else {
      chips=tps.slice(0,4).map(([t,s])=>`<span class="tc ${s==='Validé'?'tcv':'tce'}">${t}</span>`).join('');
      more=tps.length>4?`<span class="tc tcm">+${tps.length-4}</span>`:'';
    }
    var draeInfo=getDraeParcelle(p.nom);
    var hasDrae=draeInfo&&draeInfo.heures>0;
    var draeBadge=hasDrae?'<span class="pc-drae-badge">⚠️ DRAE '+draeInfo.heures+'h</span>':'';
    var draeStyle=hasDrae?'border-color:var(--rouge);box-shadow:inset 3px 0 0 var(--rouge);':'';
    const _pvInner=`
      <div class="pc-main">
        <div class="pc-info"><div class="pc-nom">${_pOrdPill(p.nom)+p.nom+draeBadge}</div><div class="pc-meta"><span class="pc-surf">📐 ${p.surface} ha</span><span class="pc-st ${p.statut==='Arrachee'?'st-arr':'st-act'}">${p.statut}</span>${_proxPill}</div></div>
        <div class="pc-right"><div class="pc-pct ${cl.cl}" style="color:${cl.col}">${cl.pct}%</div><div class="pc-pct-lbl">${cl.nbDone}/${cl.nbTotal} tâches</div></div>
      </div>
      <div class="pc-bar"><div class="pc-bar-fill" style="width:${cl.pct}%;background:${cl.fill}"></div></div>
      <div class="pc-tchips">${chips}${more}</div>`;
    const _pvAct=(pTacheFilter!=='toutes')?_pvActions(p):'';
    if(_pvAct){
      return `<div class="pcard pcard-qv${hasDrae?' pcard-drae':''}" data-nom="${_escAttr(p.nom)}" style="${draeStyle}${_proxStyle}"><div class="pc-row"><div class="pc-left" onclick="openDP('${_escAttr(p.nom)}')">${_pvInner}</div>${_pvAct}</div></div>`;
    }
    return `<div class="pcard${hasDrae?' pcard-drae':''}" onclick="openDP('${_escAttr(p.nom)}')" style="${draeStyle}${_proxStyle}">${_pvInner}</div>`;
  }).join('');
  _pvRenderProxBar();
  _pvRenderOrdreBar();
  _pOrdMapSync();
}

// ── Cépage ──
var CEPAGES=['Pinot Noir','Chardonnay','Aligoté','Gamay','Pinot Gris','Pinot Blanc','Melon de Bourgogne','Autre'];
var _dpCurrentNom='';

function openDPCepage(nom){
  var p=PARCELLES.find(function(x){return x.nom===nom;});
  if(!p||!isAdmin())return;
  _dpCurrentNom=nom;
  var el=document.getElementById('dpc-parc-nom');if(el)el.textContent=nom;
  var hn=document.getElementById('dpc-hidden-nom');if(hn)hn.value=nom;
  // Compat ancien format string → tableau
  var curArr=p.cepages||(p.cepage?[p.cepage]:[]);
  while(curArr.length<3)curArr.push('');
  // Entreplantation checkbox
  var chk=document.getElementById('dpc-entreplantation');
  var isComp=!!(p.entreplantation||(curArr.filter(function(x){return x;}).length>1));
  if(chk)chk.checked=isComp;
  _dpcToggleEntreplantation(isComp);
  // Remplir les 3 sélects
  [0,1,2].forEach(function(i){
    var sel=document.getElementById('dpc-cepage-sel-'+(i+1));
    if(!sel)return;
    var cur=curArr[i]||'';
    var placeholder=i===0?'':'— Aucun';
    var opts=(i>0?'<option value="">'+placeholder+'</option>':'')+CEPAGES.map(function(c){return '<option value="'+c+'"'+(c===cur?' selected':'')+'>'+c+'</option>';}).join('');
    sel.innerHTML=opts;
    if(cur&&CEPAGES.indexOf(cur)<0&&cur!=='Autre'){sel.innerHTML+='<option value="'+cur+'" selected>'+cur+'</option>';}
    sel.value=cur||'';
  });
  openOv('ovCepage');
}
function _dpcToggleEntreplantation(on){
  var sec2=document.getElementById('dpc-sec-2');
  var sec3=document.getElementById('dpc-sec-3');
  if(sec2)sec2.style.display=on?'':'none';
  if(sec3)sec3.style.display=on?'':'none';
}
function saveDPCepage(){
  var nom=document.getElementById('dpc-hidden-nom').value;
  var isComp=document.getElementById('dpc-entreplantation').checked;
  var v1=document.getElementById('dpc-cepage-sel-1').value;
  var v2=isComp?(document.getElementById('dpc-cepage-sel-2').value||''):'';
  var v3=isComp?(document.getElementById('dpc-cepage-sel-3').value||''):'';
  if(!v1)return showToast('⚠️ Choisir au moins un cépage','#B85A1A');
  var p=PARCELLES.find(function(x){return x.nom===nom;});
  if(!p)return;
  p.cepages=[v1,v2,v3].filter(function(v){return v;});
  p.cepage=p.cepages[0]; // compat ancien format
  p.entreplantation=isComp&&p.cepages.length>1;
  saveData('parcelles');
  closeOv(null,'ovCepage');
  openDP(nom);
  showToast('🍇 Cépage(s) enregistré(s)','#3D6B27');
}

// ══════ Fork b — Historique des rendements par millésime (détail parcelle Vigne) ══════
// Lit p.rendement_hist[] (écrit par le Cuvier, fork a). Rendu autonome (thème clair),
// aucune dépendance à cave.js ni à index.html. Aucun onclick -> aucun export window.
function _dpRendInjectCss(){
  if(document.getElementById('dp-rh-css')) return;
  var s=document.createElement('style'); s.id='dp-rh-css';
  s.textContent=`
.dprh-card{margin-top:14px;background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.14);border-radius:14px;padding:13px 14px}
.dprh-head{font-size:12px;font-weight:700;letter-spacing:.02em;color:var(--terre,#8A5A38);display:flex;align-items:center;gap:7px;margin-bottom:11px}
.dprh-ico{font-size:15px}
.dprh-surf{margin-left:auto;font-size:11px;font-weight:500;color:var(--texte-doux,#5F5F5F)}
.dprh-row{display:flex;align-items:center;gap:9px}
.dprh-yr{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:18px;color:var(--texte,#2A241C);width:46px;flex-shrink:0}
.dprh-bar{flex:1;height:8px;border-radius:5px;background:rgba(138,90,56,.1);overflow:hidden}
.dprh-fill{height:100%;border-radius:5px;background:linear-gradient(90deg,var(--terre,#8A5A38),var(--or,#C9A84C))}
.dprh-val{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:17px;color:var(--bordeaux,#7A1020);width:98px;text-align:right;flex-shrink:0;line-height:1.05}
.dprh-u{font-family:inherit;font-size:9px;color:var(--texte-doux,#5F5F5F);font-weight:400}
.dprh-d{width:58px;text-align:right;flex-shrink:0;font-size:11px;font-weight:700}
.dprh-d.up{color:var(--vert-med,#3D6B27)}
.dprh-d.down{color:#B85A1A}
.dprh-d.flat{color:var(--texte-doux,#5F5F5F)}
.dprh-sub2{font-size:10.5px;color:var(--texte-doux,#5F5F5F);margin:3px 0 12px 55px}
.dprh-empty{font-size:11.5px;color:var(--texte-doux,#5F5F5F);font-style:italic}
`;
  document.head.appendChild(s);
}
// Agrège rendement_hist d'UNE parcelle par millésime (récent -> ancien). kg_ha = Σ kg / surface.
function _dpRendHistRows(p){
  var h=Array.isArray(p&&p.rendement_hist)?p.rendement_hist:[];
  if(!h.length) return [];
  var surf=parseFloat(p.surface)||0, byM={};
  h.forEach(function(e){
    if(!e) return;
    var m=e.millesime||parseInt(String(e.date||'').slice(0,4),10)||0;
    if(!m) return;
    if(!byM[m]) byM[m]={millesime:m,kg:0,caisses:0};
    byM[m].kg+=(e.kg||0); byM[m].caisses+=(e.caisses||0);
  });
  var years=Object.keys(byM).map(Number).sort(function(a,b){return b-a;});
  return years.map(function(m){var o=byM[m]; o.kg_ha=surf>0?Math.round(o.kg/surf):null; return o;});
}
function _dpRendHistHtml(p){
  var rows=_dpRendHistRows(p).slice().reverse();
  if(!rows.length) return '';
  _dpRendInjectCss();
  var surf=parseFloat(p.surface)||0;
  var vals=rows.map(function(r){return r.kg_ha||0;});
  var max=Math.max.apply(null,vals.concat([1]));
  var body=rows.map(function(r,i){
    var older=rows[i-1];
    var delta='<span class="dprh-d flat"></span>';
    if(older&&older.kg_ha&&r.kg_ha){
      var dp=Math.round((r.kg_ha/older.kg_ha-1)*100);
      var cls=dp>2?'up':dp<-2?'down':'flat';
      var arw=dp>2?'▲ +':dp<-2?'▼ ':'';
      delta='<span class="dprh-d '+cls+'">'+arw+dp+'%</span>';
    }
    var w=r.kg_ha?Math.max(4,Math.round(r.kg_ha/max*100)):0;
    var valH=r.kg_ha!=null
      ? r.kg_ha.toLocaleString('fr-FR')+'<span class="dprh-u"> kg/ha</span>'
      : (r.kg||0).toLocaleString('fr-FR')+'<span class="dprh-u"> kg</span>';
    return '<div class="dprh-row"><div class="dprh-yr">'+r.millesime+'</div>'
      +'<div class="dprh-bar" aria-hidden="true"><div class="dprh-fill" style="width:'+w+'%"></div></div>'
      +'<div class="dprh-val">'+valH+'</div>'+delta+'</div>'
      +'<div class="dprh-sub2">'+(r.kg||0).toLocaleString('fr-FR')+' kg · '+(r.caisses||0)+' caisse'+((r.caisses||0)>1?'s':'')+'</div>';
  }).join('');
  return '<div class="dprh-card"><div class="dprh-head"><span class="dprh-ico">📊</span> Rendements par millésime'
    +(surf>0?'<span class="dprh-surf">'+(Math.round(surf*10)/10).toLocaleString('fr-FR')+' ha</span>':'')+'</div>'
    +body+'</div>';
}
// Insère/rafraîchit la section sous la liste des tâches du détail parcelle.
function _dpRenderRendHist(p){
  var host=document.getElementById('dp-taches'); if(!host||!host.parentNode) return;
  var box=document.getElementById('dp-rendhist');
  if(!box){ box=document.createElement('div'); box.id='dp-rendhist'; host.parentNode.insertBefore(box,host.nextSibling); }
  var html=_dpRendHistHtml(p);
  box.innerHTML=html;
  box.style.display=html?'':'none';
}

function openDP(nom){
  const p=PARCELLES.find(x=>x.nom===nom);if(!p)return;
  const cl=getPCls(p);
  document.getElementById('dp-nom').textContent=p.nom;
  document.getElementById('dp-sub').textContent=`${p.statut} · ${p.surface} ha`;
  _dpCurrentNom=nom;
  // Cépage (multi, entreplantation)
  var dpCepRow=document.getElementById('dp-cepage-row');
  var dpCepVal=document.getElementById('dp-cepage-val');
  var dpCepBtn=document.getElementById('dp-cepage-edit-btn');
  if(dpCepRow){
    var cepArr=p.cepages||(p.cepage?[p.cepage]:[]);
    var hasCep=cepArr.length>0;
    if(hasCep||isAdmin()){
      dpCepRow.style.display='';
      if(dpCepVal){
        if(hasCep){
          var compBadge=p.entreplantation?'<span style="font-size:10px;font-weight:700;background:rgba(74,159,200,0.15);color:#4A9FC8;border-radius:6px;padding:1px 7px;margin-left:6px;vertical-align:middle">Complantation</span>':'';
          dpCepVal.innerHTML='<span style="font-size:15px;font-weight:600;color:var(--texte)">'+cepArr.join(' · ')+'</span>'+compBadge;
        } else {
          dpCepVal.innerHTML='<span style="color:var(--texte-doux);font-style:italic">— Non renseigné</span>';
        }
      }
    } else {
      dpCepRow.style.display='none';
    }
    if(dpCepBtn){dpCepBtn.style.display=isAdmin()?'':'none';dpCepBtn.onclick=function(){openDPCepage(nom);};}
  }
  try{ var _pmEl=document.getElementById('dp-parc-meteo'); if(_pmEl)_pmEl.dataset.nom=nom; }catch(e){}
  try{ _dpFillCommune(p); }catch(e){}
  try{ _dpFillParcMeteo(p); }catch(e){}
  const pe=document.getElementById('dp-pct');
  pe.textContent=cl.pct+'%';
  pe.style.cssText='float:right;font-family:"Cormorant Garamond",serif;font-size:38px;font-weight:600;color:'+(cl.pct===100?'var(--vert)':cl.pct>=75?'var(--or)':'var(--orange)');
  document.getElementById('dp-surf').textContent=p.surface+' ha';
  // Heures restantes (hors tâches exclues)
  const tachesSaison=getTachesSaison();
  const exclues=p.tachesExclues||[];
  let hReste=0;
  tachesSaison.forEach(t=>{
    if(exclues.includes(t.nom))return;
    if(getTacheStatut(p,t.nom)!=='Validé')hReste+=((t.trous||t.nom==='Entreplantation')&&(p.plantation_trous||0)>0)?(p.plantation_trous*_plantMinTrou()/60):(t.hha*p.surface);
  });
  document.getElementById('dp-hreste').textContent=Math.round(hReste)+'h';
  var _dpVS=(typeof _visuSaison==='function'?_visuSaison():((getSaisonActive()||{}).nom||''));
  var _dpRO=(typeof _mvOnActiveSaison==='function'&&!_mvOnActiveSaison());
  var _dpLbl=document.getElementById('dp-saison-label');
  if(_dpLbl){ _dpLbl.textContent=_dpVS+(_dpRO?' \u00b7 lecture seule':''); _dpLbl.style.color=_dpRO?'#B85A1A':''; }
  var _dpRB=document.getElementById('dp-readonly-banner');
  if(_dpRB){ if(_dpRO){ _dpRB.style.display=''; _dpRB.innerHTML='Consultation de \u00ab '+_escHtml(_dpVS)+' \u00bb \u2014 pr\u00e9paration en <b>lecture seule</b>. La validation reste sur la saison active ('+_escHtml((getSaisonActive()||{}).nom||'')+').'; } else { _dpRB.style.display='none'; _dpRB.innerHTML=''; } }
  // ── Bandeau DRAE ── dernier traitement avec DRAE actif
  const today2=new Date();
  const traitementsActifs=TRAITEMENTS.filter(t=>{
    const pr=CATALOGUE.find(c=>c.nom===t.produit);
    if(!pr||!pr.drae)return false;
    if(t.parcelles&&t.parcelles.length>0&&!t.parcelles.includes(nom))return false;
    const draeR=pr.drae-Math.floor((today2-new Date(t.date))/3600000);
    return draeR>0;
  }).sort((a,b)=>b.date.localeCompare(a.date));
  const draeEl=document.getElementById('dp-drae-alert');
  if(draeEl){
    if(traitementsActifs.length>0){
      const tLast=traitementsActifs[0];
      const prLast=CATALOGUE.find(c=>c.nom===tLast.produit);
      const draeRLast=Math.max(0,prLast.drae-Math.floor((today2-new Date(tLast.date))/3600000));
      draeEl.style.display='flex';
      draeEl.innerHTML=`<span style="font-size:18px">⚠️</span><div><strong>DRAE en cours — ${draeRLast}h restantes</strong><div style="font-size:11px;margin-top:2px;opacity:0.85">${_escHtml(tLast.produit)} · traité le ${fmtDate(tLast.date)} · Pas d'entrée équipe sol</div></div>`;
    } else {
      draeEl.style.display='none';
    }
  }
  // Tâches : afficher toutes, exclues en grisé
  const canEdit=canWrite();
  const nomParcelle=p.nom;
  document.getElementById('dp-taches').innerHTML=tachesSaison.map(t=>{
    const stat=getTacheStatut(p,t.nom);
    const isExclu=exclues.includes(t.nom);
    const isOn=stat==='Validé';
    const isEnCours=stat==='En cours';
    const _plTr=((t.trous||t.nom==='Entreplantation'))?(parseInt(p.plantation_trous)||0):0;
    const hEstim=(_plTr>0)?Math.round(_plTr*_plantMinTrou()/60*10)/10:(t.hha?Math.round(t.hha*p.surface*10)/10:0);
    const statusColor=isExclu?'var(--texte-doux)':isOn?'var(--vert)':isEnCours?'var(--or)':'var(--texte-doux)';
    const statusLabel=isExclu?'Non applicable':isOn?'Validé':isEnCours?'En cours':'À faire';
    if(isExclu){
      return `<div class="val-row" style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--gris-clair);opacity:0.45">
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600;color:var(--texte-doux);text-decoration:line-through">🚫 ${t.nom}</div>
          <div style="font-size:10px;color:var(--texte-doux);margin-top:2px">Non applicable sur cette parcelle</div>
        </div>
        ${canEdit?`<button onclick="toggleExcluTache('${_escAttr(nomParcelle)}','${_escAttr(t.nom)}')" style="background:var(--gris-clair);border:none;border-radius:8px;padding:5px 10px;font-size:10px;font-weight:600;color:var(--texte-doux);cursor:pointer;white-space:nowrap;margin-left:10px">Réactiver</button>`:''}
      </div>`;
    }
    // ── Multi-niveaux (Relevage) ────────────────────────────────────────────
    if(t.type==='niveaux'){
      const badgesHtml=_relNivBadgesHtml(p);
      const hhaDetail=(t.niveaux||[]).map(n=>'N'+n.num+' '+n.hha+'h/ha').join(' · ');
      return `<div class="val-row" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--gris-clair);gap:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600">${TEMOJI[t.nom]||'↑'} ${t.nom}</div>
          <div style="font-size:10px;color:var(--texte-doux);margin-top:2px">${hhaDetail} · <span style="color:${statusColor};font-weight:600">${statusLabel}</span></div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:5px">${badgesHtml}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          ${canEdit?`<button onclick="openNiveauxPanel('${_escAttr(nomParcelle)}','${_escAttr(t.nom)}')" style="background:rgba(74,159,200,0.12);border:1px solid rgba(74,159,200,0.3);border-radius:8px;padding:7px 11px;font-size:11px;font-weight:600;color:var(--acier-med);cursor:pointer;white-space:nowrap">${isOn?'✏ Modifier':'↑ Niveaux'}</button>`:''}
          ${canEdit&&stat!=='Non démarré'?`<button onclick="annulerTache('${_escAttr(nomParcelle)}','${_escAttr(t.nom)}')" style="min-height:44px;min-width:44px;background:rgba(184,90,26,0.08);border:1px solid rgba(184,90,26,0.28);border-radius:8px;padding:7px 9px;font-size:11px;font-weight:600;color:#B85A1A;cursor:pointer" title="Annuler">↩</button>`:''}
          ${canEdit&&!isOn?`<button onclick="toggleExcluTache('${_escAttr(nomParcelle)}','${_escAttr(t.nom)}')" style="min-height:44px;min-width:44px;background:var(--gris-clair);border:none;border-radius:8px;padding:5px 6px;font-size:12px;cursor:pointer" title="Désactiver">🚫</button>`:''}
        </div>
      </div>`;
    }
    // ── Multi-passages (Ebourgeonnage, Pioche) ──────────────────────────────
    if(t.type==='passages'){
      const badgesHtml=_passBadgesHtml(p,t.nom);
      return `<div class="val-row" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--gris-clair);gap:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600">${TEMOJI[t.nom]||'🔄'} ${t.nom}</div>
          <div style="font-size:10px;color:var(--texte-doux);margin-top:2px">${t.hha}h/ha/passage · ~${hEstim}h · <span style="color:${statusColor};font-weight:600">${statusLabel}</span></div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:5px">${badgesHtml}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          ${canEdit?`<button onclick="openPassagesPanel('${_escAttr(nomParcelle)}','${_escAttr(t.nom)}')" style="background:rgba(90,156,74,0.1);border:1px solid rgba(90,156,74,0.28);border-radius:8px;padding:7px 11px;font-size:11px;font-weight:600;color:var(--vert);cursor:pointer;white-space:nowrap">${isOn?'✏ Modifier':'▶ Passages'}</button>`:''}
          ${canEdit&&isOn&&isAdmin()?`<button onclick="annulerTache('${_escAttr(nomParcelle)}','${_escAttr(t.nom)}')" style="min-height:44px;min-width:44px;background:rgba(184,90,26,0.12);border:1px solid rgba(184,90,26,0.3);border-radius:8px;padding:7px 9px;font-size:11px;font-weight:600;color:#B85A1A;cursor:pointer" title="Admin : tout annuler">↩</button>`:''}
          ${canEdit&&!isOn?`<button onclick="toggleExcluTache('${_escAttr(nomParcelle)}','${_escAttr(t.nom)}')" style="min-height:44px;min-width:44px;background:var(--gris-clair);border:none;border-radius:8px;padding:5px 6px;font-size:12px;cursor:pointer" title="Désactiver">🚫</button>`:''}
        </div>
      </div>`;
    }
    // ── Simple (défaut) ────────────────────────────────────────────────────
    return `<div class="val-row" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--gris-clair);gap:8px">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600">${TEMOJI[t.nom]||'🌿'} ${t.nom}</div>
        <div style="font-size:10px;color:var(--texte-doux);margin-top:2px">${(t.trous||t.nom==='Entreplantation')?(_plTr>0?('🪛 '+_plTr+' trous · ~'+hEstim+'h'):'🪛 Tarière · aucun trou'):((t.tempsReel?(t.hha?('~'+t.hha+'h/ha estimé'):'temps réel'):(t.hha+'h/ha'))+' · ~'+hEstim+'h')} · <span style="color:${statusColor};font-weight:600">${statusLabel}</span></div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
        ${canEdit?`<button onclick="tapTacheSimple('${_escAttr(nomParcelle)}','${_escAttr(t.nom)}',this)" style="min-height:44px;padding:6px 11px;border-radius:8px;font-family:inherit;font-size:11px;font-weight:700;cursor:${isOn?'default':'pointer'};border:1.5px solid ${isOn?'rgba(90,156,74,0.38)':isEnCours?'rgba(220,140,30,0.4)':'rgba(255,255,255,0.08)'};background:${isOn?'rgba(90,156,74,0.14)':isEnCours?'rgba(220,140,30,0.13)':'rgba(255,255,255,0.03)'};color:${isOn?'#6AB855':isEnCours?'#DCA030':'var(--texte-doux)'};white-space:nowrap">${isOn?'✓ Validé':isEnCours?'✓ Valider':'▶ Démarrer'}</button>`:`<span class="jst" style="font-size:10px;color:${isOn?'var(--vert)':isEnCours?'var(--or)':'var(--texte-doux)'}">${stat}</span>`}
        ${canEdit&&stat!=='Non démarré'?`<button onclick="annulerTache('${_escAttr(nomParcelle)}','${_escAttr(t.nom)}')" style="min-height:44px;min-width:44px;background:rgba(184,90,26,0.08);border:1px solid rgba(184,90,26,0.28);border-radius:8px;padding:6px 9px;font-size:13px;font-weight:600;color:#B85A1A;cursor:pointer" title="Annuler">↩</button>`:''}
        ${canEdit&&!isOn&&!isEnCours?`<button onclick="toggleExcluTache('${_escAttr(nomParcelle)}','${_escAttr(t.nom)}')" style="min-height:44px;min-width:44px;background:var(--gris-clair);border:none;border-radius:8px;padding:5px 6px;font-size:12px;cursor:pointer" title="Désactiver cette tâche pour cette parcelle">🚫</button>`:''}
      </div>
    </div>`;
  }).join('');
  _dpRenderRendHist(p);
  // Stocker les coordonnées GPS pour le bouton
  const gpsBtn=document.getElementById('dp-gps-btn');
  if(gpsBtn){
    if(p.lat&&p.lng){
      gpsBtn.style.display='flex';
      gpsBtn.dataset.lat=p.lat;
      gpsBtn.dataset.lng=p.lng;
    } else {
      gpsBtn.style.display='none';
    }
  }
  // Stocker le nom pour le bouton Ouvrir dans carte
  const mapBtn=document.getElementById('dp-map-btn');
  if(mapBtn)mapBtn.dataset.nom=nom;
  // Bouton réparation ponctuelle (écriture seulement)
  const repBtn=document.getElementById('dp-rep-btn');
  if(repBtn)repBtn.style.display=canWrite()?'flex':'none';
  openOv('ovParcelle');
}

// ════ RÉPARATION PONCTUELLE ════
// Journal d'une réparation ad hoc (piquet/amarre/fil, multi) — n'affecte PAS l'avancement de la tâche planifiée « Reparation ».
var _repTypes=[],_repQ=0;
function openRepPonct(){
  if(!_dpCurrentNom)return;
  var p=PARCELLES.find(function(x){return x.nom===_dpCurrentNom;});
  _repTypes=[];_repQ=0;
  var sub=document.getElementById('rp-sub');if(sub)sub.textContent=_dpCurrentNom+(p?(' · '+p.surface+' ha'):'');
  document.querySelectorAll('#rp-chips .rp-chip').forEach(function(c){c.classList.remove('sel');});
  var qv=document.getElementById('rp-qval');if(qv)qv.textContent='0';
  var dt=document.getElementById('rp-date');if(dt)dt.value=new Date().toISOString().split('T')[0];
  _repPonctRefresh();
  openOv('ovRepPonct');
}
function repPonctChip(el){
  var t=el.getAttribute('data-t');var i=_repTypes.indexOf(t);
  if(i>=0){_repTypes.splice(i,1);el.classList.remove('sel');}
  else{_repTypes.push(t);el.classList.add('sel');}
  _repPonctRefresh();
}
function repPonctQty(d){_repQ=Math.max(0,_repQ+d);var qv=document.getElementById('rp-qval');if(qv)qv.textContent=_repQ;}
function _repPonctRefresh(){
  var btn=document.getElementById('rp-save');if(btn)btn.disabled=_repTypes.length===0;
  var qw=document.getElementById('rp-qty-wrap');if(qw)qw.style.opacity=_repTypes.length?'1':'0.45';
}
function saveRepPonct(){
  if(!_dpCurrentNom||!_repTypes.length)return;
  var date=(document.getElementById('rp-date')||{}).value||new Date().toISOString().split('T')[0];
  var jEntry={id:Date.now().toString(16),date:date,parcelle:_dpCurrentNom,tache:'Réparation ponctuelle',qui:currentUser.nom,statut:'Validé',equipe:false,membresEquipe:[],reparation_types:_repTypes.slice(),reparation_qte:_repQ||0};
  JOURNAL.unshift(jEntry);
  injectMeteoIfNeeded(date);
  if(navigator.vibrate)navigator.vibrate(60);
  saveData('journal');
  closeOv(null,'ovRepPonct');
  showToast('🔧 Réparation notée · '+_repTypes.join(', ')+(_repQ>0?(' ×'+_repQ):''),'#3D6B27');
  try{renderJournalList();}catch(e){}
  try{renderHome();}catch(e){}
}

function openGPS(){
  const btn=document.getElementById('dp-gps-btn');
  const lat=btn.dataset.lat,lng=btn.dataset.lng;
  if(!lat||!lng)return;
  const nom=document.getElementById('dp-nom').textContent;
  // Ouvre l'app GPS native (fonctionne iOS/Android/desktop)
  const url=`geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(nom)})`;
  // Fallback Apple Maps / Google Maps selon la plateforme
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
  if(isIOS){
    window.open(`maps://maps.apple.com/?q=${encodeURIComponent(nom)}&ll=${lat},${lng}`,'_blank');
  } else {
    window.open(`https://maps.google.com/?q=${lat},${lng}(${encodeURIComponent(nom)})`,'_blank');
  }
}

function openInMap(){
  const btn=document.getElementById('dp-map-btn');
  const nom=btn?btn.dataset.nom:'';
  if(!nom)return;
  closeOv(null,'ovParcelle');
  switchPTab('carte');
  setTimeout(function(){
    if(leafMap)leafMap.invalidateSize();
    var item=_leafLayers.find(function(l){return l.parcelle&&l.parcelle.nom===nom;});
    if(item&&leafMap){
      leafMap.fitBounds(item.poly.getBounds(),{maxZoom:17,padding:[40,40]});
      item.poly.setStyle({weight:4,dashArray:'8,4'});
      setTimeout(function(){item.poly.setStyle({weight:2,dashArray:null});},2000);
    } else {
      var p=PARCELLES.find(function(x){return x.nom===nom;});
      if(p&&p.lat&&p.lng&&leafMap){leafMap.setView([parseFloat(p.lat),parseFloat(p.lng)],17);}
    }
  },250);
}

function toggleExcluTache(nomParcelle,nomTache){
  const p=PARCELLES.find(x=>x.nom===nomParcelle);if(!p)return;
  if(!p.tachesExclues)p.tachesExclues=[];
  const idx=p.tachesExclues.indexOf(nomTache);
  if(idx>=0){p.tachesExclues.splice(idx,1);}
  else{p.tachesExclues.push(nomTache);}
  recalcTravaux(nomTache); window.TRAVAUX=TRAVAUX; // MAJ heures + avancement du domaine
  saveData('parcelles');                            // persister l'exclusion
  renderParcelles();computePStats();
  if(typeof renderHomeCard==='function'){try{renderHomeCard();}catch(e){}}
  // Rafraîchir la fiche ouverte
  openDP(nomParcelle);
}

function marquerEnCours(nomParcelle,nomTache,btn){
  if(_mvValidBlocked())return;
  const p=PARCELLES.find(x=>x.nom===nomParcelle);if(!p)return;
  const stat=p.taches[nomTache]||'Non démarré';
  if(stat==='En cours'){
    p.taches[nomTache]='Non démarré';
    const idx=JOURNAL.findIndex(j=>j.parcelle===nomParcelle&&j.tache===nomTache&&j.statut==='En cours'&&!j.meteo);
    if(idx>=0) JOURNAL.splice(idx,1);
    saveData('journal');
    showToast('↩️ Démarrage annulé — non enregistré','#7A4F2E');
  } else {
    p.taches[nomTache]='En cours';
    const today=new Date().toISOString().split('T')[0];
    JOURNAL.unshift({id:Date.now().toString(16),date:today,parcelle:nomParcelle,tache:nomTache,qui:currentUser.nom,statut:'En cours',equipe:false,ts_debut:Date.now()});
    injectMeteoIfNeeded(today);
    saveData('journal');
  }
  if(navigator.vibrate)navigator.vibrate(40);
  saveData('parcelles', '⏳ En cours enregistré');
  renderParcelles();computePStats();
  openDP(nomParcelle);
}

function tapTacheSimple(nomParcelle,nomTache,btn){
  if(_mvValidBlocked())return;
  var p=PARCELLES.find(function(x){return x.nom===nomParcelle;});
  if(!p)return;
  var stat=p.taches[nomTache]||'Non démarré';
  if(stat==='Non démarré'){
    marquerEnCours(nomParcelle,nomTache,btn);
  } else if(stat==='En cours'){
    openValidationPanel(nomParcelle,nomTache,btn);
  }
  // Validé : sans effet (bouton verrouillé — utiliser ↩ pour annuler)
}

var _prioEdit=[]; var _prioEditTasks=[]; var _prioEditMbrs=[];
function openPriorityEdit(){
  document.getElementById('prio-input').value=priorityMessage;
  // etat d'edition : depuis CONFIG.tachesPrio (saison active) ou compat mono-tache
  _prioEdit=_prioItems().map(function(it){return {t:it.t,equipe:(it.equipe||[]).slice()};});
  _prioEditTasks=((typeof getTachesSaison==='function')?getTachesSaison():[]).map(function(t){return t.nom;});
  _prioEditMbrs=(MEMBRES||[]).filter(function(m){return m&&m.nom&&m.statut!=='Inactif';}).map(function(m){return m.nom;});
  _prioEditRender();
  openOv('ovPriority');
}
function _prioEditFind(t){ for(var i=0;i<_prioEdit.length;i++){ if(_prioEdit[i].t===t) return _prioEdit[i]; } return null; }
function _prioEditStar(i){
  var t=_prioEditTasks[i]; if(!t) return;
  if(_prioEditFind(t)){ _prioEdit=_prioEdit.filter(function(x){return x.t!==t;}); }
  else { _prioEdit.push({t:t,equipe:[]}); }
  _prioEditRender();
}
window._prioEditStar=_prioEditStar;
function _prioEditMbr(ti,mi){
  var t=_prioEditTasks[ti], nom=_prioEditMbrs[mi];
  var it=_prioEditFind(t); if(!it||!nom) return;
  var ix=it.equipe.indexOf(nom);
  if(ix>=0){ it.equipe.splice(ix,1); }
  else{
    var pris=null;
    _prioEdit.forEach(function(x){ if(x.t!==t&&x.equipe.indexOf(nom)>=0) pris=x.t; });
    if(pris){ showToast(nom+' est d\u00e9j\u00e0 affect\u00e9(e) \u00e0 '+pris,'#B85A1A'); return; }
    it.equipe.push(nom);
  }
  _prioEditRender();
}
window._prioEditMbr=_prioEditMbr;
function _prioEditRender(){
  var c=document.getElementById('prio-task-list'); if(!c) return;
  var taken={}; // nom -> tache (exclusivite : un membre = une seule priorite)
  _prioEdit.forEach(function(x){ (x.equipe||[]).forEach(function(n){ taken[n]=x.t; }); });
  c.innerHTML=_prioEditTasks.map(function(t,ti){
    var it=_prioEditFind(t); var on=!!it;
    var em=(window.TEMOJI&&window.TEMOJI[t])?window.TEMOJI[t]:String.fromCodePoint(0x1F33F);
    var h='<div class="pe-row'+(on?' on':'')+'">'
      +'<div class="pe-main" onclick="_prioEditStar('+ti+')">'
      +'<span class="pe-star">'+(on?String.fromCodePoint(0x2B50):String.fromCodePoint(0x2606))+'</span>'
      +'<span class="pe-nm">'+em+' '+_escHtml(typeof tNom==='function'?tNom(t):t)+'</span>'
      +'</div>';
    if(on){
      h+='<div class="pe-chips">'+_prioEditMbrs.map(function(n,mi){
        var sel=it.equipe.indexOf(n)>=0;
        var lockBy=(!sel&&taken[n]&&taken[n]!==t)?taken[n]:null;
        return '<span class="pe-chip'+(sel?' on':'')+(lockBy?' lock':'')+'" onclick="_prioEditMbr('+ti+','+mi+')">'
          +_escHtml(n)+(sel?' \u2713':'')+(lockBy?' <small>\u2192 '+_escHtml(lockBy)+'</small>':'')+'</span>';
      }).join('')+'</div>';
    }
    h+='</div>';
    return h;
  }).join('');
}
function savePriority(){
  priorityMessage=document.getElementById('prio-input').value.trim();
  // construire tachesPrio (dedoublonnage de securite : un membre = une seule priorite)
  var _seen={};
  var items=_prioEdit.map(function(it){
    return {t:it.t, equipe:(it.equipe||[]).filter(function(n){ if(_seen[n]) return false; _seen[n]=true; return true; })};
  });
  var sa=(typeof getSaisonActive==='function')?getSaisonActive():null;
  var cfg=window.CONFIG||{};
  if(items.length){ cfg.tachesPrio={saison:(sa?sa.nom:''),items:items}; }
  else { delete cfg.tachesPrio; }
  window.CONFIG=cfg; if(typeof CONFIG!=='undefined') CONFIG=cfg;
  priorityTask=items.length?items[0].t:''; // compat ancien format (appareils non recharges)
  _prioOverride=false;
  _prioEqSeeded={}; // re-appliquer les equipes affectees sur cet appareil
  document.getElementById('ovPriority').classList.remove('open');
  savePriorityData();
  notifyPriorityChange();
  renderParcelles();
  var lbl=items.length?(String.fromCodePoint(0x2B50)+' Priorit\u00e9 : '+items.map(function(it){return (typeof tNom==='function'?tNom(it.t):it.t);}).join(' \u00B7 ')):(String.fromCodePoint(0x1F4CC)+' Message de priorit\u00e9 enregistr\u00e9');
  showToast(lbl,'#3D6B27');
}
function clearPriority(){
  priorityMessage='';
  priorityTask='';
  _prioEdit=[];
  var cfg=window.CONFIG||{};
  delete cfg.tachesPrio;
  window.CONFIG=cfg; if(typeof CONFIG!=='undefined') CONFIG=cfg;
  _prioOverride=false;
  _prioEqSeeded={};
  document.getElementById('ovPriority').classList.remove('open');
  savePriorityData();
  notifyPriorityChange();
  renderParcelles();
}
function savePriorityData(){
  // localStorage
  try { localStorage.setItem('mavigne_priority', priorityMessage); } catch(e){}
  try { localStorage.setItem('mavigne_priority_task', priorityTask); } catch(e){}
  // Firebase — écrire le doc config COMPLET (ne jamais le remplacer par {priorityMessage}
  // seul, sinon gnr / pilote_default / domaine_nom / timings… sont écrasés)
  if(window.fbSave){
    var cfg = window.CONFIG || {};
    cfg.priorityMessage = priorityMessage;
    cfg.priorityTask = priorityTask;
    window.CONFIG = cfg;
    if(typeof CONFIG !== 'undefined') CONFIG = cfg;
    window.priorityMessage = priorityMessage;
    window.priorityTask = priorityTask;
    window.fbSave('config', cfg);
  }
}
function toggleTravail(nomParcelle,nomTache,btn){
  if(_mvValidBlocked())return;
  const p=PARCELLES.find(x=>x.nom===nomParcelle);if(!p)return;
  const isOn=btn.classList.contains('on');
  if(isOn){
    // Dévalider : remettre à En cours
    p.taches[nomTache]='En cours';
    btn.classList.remove('on');btn.classList.add('off');btn.textContent='';
    btn.title='Cliquer pour valider';
    saveData('parcelles');
    renderParcelles();computePStats();
    if(navigator.vibrate)navigator.vibrate(40);
    showToast('↩️ '+tNom(nomTache)+' remis en cours','#B85A1A');
  } else {
    // Ouvrir le mini-panneau de validation avec choix équipe/seul
    openValidationPanel(nomParcelle,nomTache,btn);
  }
}

let _validParcelle='',_validTache='',_validBtn=null;
function openValidationPanel(nomParcelle,nomTache,btn){
  _validParcelle=nomParcelle;_validTache=nomTache;_validBtn=btn;
  document.getElementById('vp-titre').textContent=`${TEMOJI[nomTache]||'🌿'} ${nomTache}`;
  document.getElementById('vp-parcelle').textContent=nomParcelle;
  document.getElementById('vp-date').value=new Date().toISOString().split('T')[0];
  // Reset mode Seul
  document.querySelectorAll('#vp-equipe-pick .pchk').forEach((el,i)=>{el.classList.toggle('sel',i===0);el.classList.toggle('vert',i===0);});
  document.getElementById('vp-equipe-val').value='non';
  document.getElementById('vp-equipe-section').style.display='none';
  // Préparer la liste des membres
  _buildMembresCheckboxes('vp-membres-pick',nomParcelle);
  var jEC=JOURNAL.find(function(j){return j.parcelle===nomParcelle&&j.tache===nomTache&&j.statut==='En cours'&&!j.meteo&&j.ts_debut;});
  var vpT=document.getElementById('vp-temps-ecoule');
  if(jEC&&vpT){var el=Date.now()-jEC.ts_debut,hh=Math.floor(el/3600000),mm=Math.floor((el%3600000)/60000);vpT.style.display='block';vpT.textContent='⏱ Démarré il y a '+(hh>0?hh+'h ':'')+mm+'min';}
  else if(vpT){vpT.style.display='none';}
  // Section trous tarrière — visible uniquement pour Plantation
  var vpPlant=document.getElementById('vp-plantation-section');
  var vpTrous=document.getElementById('vp-trous');
  if(vpPlant)vpPlant.style.display=((_vp_tDef(nomTache)&&_vp_tDef(nomTache).trous)||nomTache==='Entreplantation')?'block':'none';
  if(vpTrous){var _pvObj=PARCELLES.find(function(x){return x.nom===nomParcelle;});vpTrous.value=(_pvObj&&_pvObj.plantation_trous)?_pvObj.plantation_trous:'';}
  openOv('ovValidation');
}
function toggleEquipeMode(val){
  document.querySelectorAll('#vp-equipe-pick .pchk').forEach(el=>{
    const isTarget=el.dataset.val===val;
    el.classList.toggle('sel',isTarget);el.classList.toggle('vert',isTarget);
  });
  document.getElementById('vp-equipe-val').value=val;
  document.getElementById('vp-equipe-section').style.display=val==='oui'?'block':'none';
}
function toggleNivEquipeMode(val){
  document.querySelectorAll('#niv-equipe-pick .pchk').forEach(function(el){
    var isTarget=el.dataset.val===val;
    el.classList.toggle('sel',isTarget);el.classList.toggle('vert',isTarget);
  });
  var hv=document.getElementById('niv-equipe-val');if(hv)hv.value=val;
  var sec=document.getElementById('niv-equipe-section');if(sec)sec.style.display=val==='oui'?'block':'none';
  if(val==='oui')_buildMembresCheckboxes('niv-membres-pick','');
}
function toggleJEMode(val){
  document.querySelectorAll('#je-equipe-pick .pchk').forEach(el=>{
    const isTarget=el.dataset.val===val;
    el.classList.toggle('sel',isTarget);el.classList.toggle('vert',isTarget);
  });
  document.getElementById('je-equipe-val').value=val;
  document.getElementById('je-equipe-section').style.display=val==='oui'?'block':'none';
}
function _buildMembresCheckboxes(containerId,excludeNom){
  const container=document.getElementById(containerId);
  if(!container)return;
  const membres=MEMBRES.filter(m=>m.statut!=='Inactif'&&m.nom!==(excludeNom||currentUser?.nom)&&m.nom!==currentUser?.nom);
  container.innerHTML=membres.map(m=>`<div class="pchk mbr-chk" data-nom="${_escHtml(m.nom)}" onclick="this.classList.toggle('sel');this.classList.toggle('vert')" style="display:flex;align-items:center;gap:6px"><div style="width:20px;height:20px;border-radius:50%;background:${m.couleur||'#888'};display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:white">${_escHtml(m.nom[0])}</div>${_escHtml(m.nom)}</div>`).join('');
}
function _getSelectedMembres(containerId){
  return Array.from(document.querySelectorAll(`#${containerId} .pchk.sel`)).map(el=>el.dataset.nom).filter(Boolean);
}
async function confirmValidation(){
  if(_mvValidBlocked())return;
  const p=PARCELLES.find(x=>x.nom===_validParcelle);if(!p)return;
  _mvdsSnap(_validTache);
  const equipe=document.getElementById('vp-equipe-val').value==='oui';
  const date=document.getElementById('vp-date').value||new Date().toISOString().split('T')[0];
  const membresEquipe=equipe?_getSelectedMembres('vp-membres-pick'):[];
  p.taches[_validTache]='Validé';
  // Entreplantation : stocker le nombre de trous tarrière (saisie manuelle)
  var trous=null;
  if(((_vp_tDef(_validTache)&&_vp_tDef(_validTache).trous)||_validTache==='Entreplantation')){
    var trousEl=document.getElementById('vp-trous');
    var trousVal=trousEl?parseInt(trousEl.value)||0:0;
    if(trousVal>0){
      p.plantation_trous=trousVal;
      delete p.plantation_trous_src;
      trous=trousVal;
    }
  }
  if(_validBtn){_validBtn.classList.add('on');_validBtn.classList.remove('off');_validBtn.textContent='✓';_validBtn.title='Validé — cliquer pour annuler';}
  var jEntry={id:Date.now().toString(16),date,parcelle:_validParcelle,tache:_validTache,qui:currentUser.nom,statut:'Validé',equipe,membresEquipe};
  if(trous)jEntry.plantation_trous=trous;
  // Météo moyenne sur la période de la tâche (du premier "En cours" à aujourd'hui)
  var _mDeb=_findDebutTache(_validParcelle,_validTache,date)||date;
  var _mSnap=await fetchMeteoMoyenne(_mDeb,date);
  if(_mSnap)jEntry.meteo_snapshot=_mSnap;
  JOURNAL.unshift(jEntry);
  recalcTravaux(_validTache);
  injectMeteoIfNeeded(date);
  saveData('parcelles'); saveData('journal'); saveData('travaux');
  document.getElementById('ovValidation').classList.remove('open');
  renderParcelles();computePStats();
  if(navigator.vibrate)navigator.vibrate(60);
  _mvdsOpen({tache:_validTache,parcelle:_validParcelle,surf:p.surface,
             membres:equipe?[currentUser.nom].concat(membresEquipe.filter(function(n){return n!==currentUser.nom;})):[],
             detail:trous?(trous+' trous'):''});
}
function _jePrefillTeam(){
  var ts=document.getElementById('je-tache');if(!ts)return;
  var team=_eqtFor(ts.value).filter(function(n){return n!==(currentUser&&currentUser.nom);}); // validateur implicite
  var sec=document.getElementById('je-equipe-section');
  if(team.length){
    document.getElementById('je-equipe-val').value='oui';
    document.querySelectorAll('#je-equipe-pick .pchk').forEach(function(el){var on=el.dataset.val==='oui';el.classList.toggle('sel',on);el.classList.toggle('vert',on);});
    if(sec)sec.style.display='block';
    document.querySelectorAll('#je-membres-pick .pchk.mbr-chk').forEach(function(el){var on=team.indexOf(el.dataset.nom)>=0;el.classList.toggle('sel',on);el.classList.toggle('vert',on);});
  }
}
// Liste des tâches du journal, pilotée par la DATE de l'entrée et non par la période consultée :
// les tâches de la période qui contient la date arrivent en tête, TOUTES les autres restent
// accessibles juste en dessous. Plus rien n'est masqué — c'est ce qui rendait une taille datée de
// février insaisissable pendant la saison verte.
function _jeBuildTaches(){
  var ts=document.getElementById('je-tache'); if(!ts) return;
  var prev=ts.value;
  var d=((document.getElementById('je-date')||{}).value)||new Date().toISOString().split('T')[0];
  var perN=(typeof window._saisonForDate==='function')?window._saisonForDate(d):'';
  var noms=(perN&&typeof window._saisonTaches==='function')?window._saisonTaches(perN):null;
  var dans=noms?TACHES.filter(function(t){return t&&noms.indexOf(t.nom)>=0;}):getTachesSaison();
  var autres=TACHES.filter(function(t){return t&&dans.indexOf(t)<0;});
  var opt=function(t){
    return '<option value="'+_escAttr(t.nom)+'">'+(TEMOJI[t.nom]||'')+' '+_escHtml(t.nom)+'</option>';
  };
  var h='';
  if(dans.length){
    var lbl=perN||((getSaisonActive()||{}).nom)||'Période en cours';
    h+='<optgroup label="'+_escAttr(lbl)+'">'+dans.map(opt).join('')+'</optgroup>';
  }
  if(autres.length){
    h+='<optgroup label="'+(dans.length?'Autres tâches du domaine':'Aucune période pour cette date')
      +'">'+autres.map(opt).join('')+'</optgroup>';
  }
  ts.innerHTML=h;
  if(prev && TACHES.some(function(t){return t.nom===prev;})) ts.value=prev;
  if(typeof _jePrefillTeam==='function') _jePrefillTeam();
}

function openJournalEntry(){
  // Remplir les selects
  const ps=document.getElementById('je-parcelle');
  ps.innerHTML=PARCELLES.filter(p=>p.statut!=='Arrachee').map(p=>`<option value="${_escHtml(p.nom)}">${_escHtml(p.nom)}</option>`).join('');
  document.getElementById('je-date').value=new Date().toISOString().split('T')[0];
  var _jeD=document.getElementById('je-date');
  // onblur (et non onchange seul) : un <input type=date> émet onchange sur chaque date
  // intermédiaire structurellement valide pendant la frappe (année « 2 » -> 0002).
  if(_jeD){ _jeD.onblur=_jeBuildTaches; _jeD.onchange=_jeBuildTaches; }
  _jeBuildTaches();
  // Reset équipe
  document.querySelectorAll('#je-equipe-pick .pchk').forEach((el,i)=>{el.classList.toggle('sel',i===0);el.classList.toggle('vert',i===0);});
  document.getElementById('je-equipe-val').value='non';
  document.getElementById('je-equipe-section').style.display='none';
  document.getElementById('je-statut').value='Validé';
  _buildMembresCheckboxes('je-membres-pick','');
  var _jeTs=document.getElementById('je-tache'); if(_jeTs){_jeTs.onchange=_jePrefillTeam;}
  _jePrefillTeam();
  openOv('ovJournalEntry');
}
async function saveJournalEntry(){
  const parcelle=document.getElementById('je-parcelle').value;
  const tache=document.getElementById('je-tache').value;
  const date=document.getElementById('je-date').value||new Date().toISOString().split('T')[0];
  const statut=document.getElementById('je-statut').value;
  const equipe=document.getElementById('je-equipe-val').value==='oui';
  const membresEquipe=equipe?_getSelectedMembres('je-membres-pick'):[];
  if(!parcelle||!tache)return;
  var jEntry={id:Date.now().toString(16),date,parcelle,tache,qui:currentUser.nom,statut,equipe,membresEquipe};
  // Météo moyenne si validation
  if(statut==='Validé'){
    var _mDeb=_findDebutTache(parcelle,tache,date)||date;
    var _mSnap=await fetchMeteoMoyenne(_mDeb,date);
    if(_mSnap)jEntry.meteo_snapshot=_mSnap;
  }
  JOURNAL.unshift(jEntry);
  // Mettre à jour le statut de la parcelle si validé
  if(statut==='Validé'||statut==='En cours'){
    const p=PARCELLES.find(x=>x.nom===parcelle);
    if(p&&p.taches&&_mvOnActiveSaison()){
      const actuel=p.taches[tache]||'Non démarré';
      if(statut==='Validé'&&actuel!=='Validé'){p.taches[tache]='Validé';recalcTravaux(tache);saveData('parcelles');saveData('travaux');}
      else if(statut==='En cours'&&actuel==='Non démarré'){p.taches[tache]='En cours';saveData('parcelles');}
    }
  }
  injectMeteoIfNeeded(date);
  if(navigator.vibrate)navigator.vibrate(60);
  saveData('journal');
  showToast('📝 Entrée enregistrée ✓','#3D6B27');
  document.getElementById('ovJournalEntry').classList.remove('open');
  renderJournalList();
  renderHome();
}

function injectMeteoIfNeeded(date){
  // Injecter une entrée météo dans le journal si ce jour a un travail et qu'on a des données météo.
  // Multi-commune : une entrée par secteur ayant un travail ce jour (id meteo-{date}-{commune}).
  // Mono-commune / pas de cache secteur : comportement historique (id meteo-{date}, météo domaine).
  const hasTravail=JOURNAL.some(j=>!j.meteo&&j.date===date);
  if(!hasTravail)return;
  const store=window.METEO_PAR_COMMUNE;
  if(store){
    const keysToday={};
    JOURNAL.forEach(function(j){
      if(j.meteo||j.date!==date)return;
      var p=(window.PARCELLES||[]).find(function(x){return x.nom===j.parcelle;});
      var k=(p&&p.commune&&p.commune.nom)?p.commune.nom:'__DOMAINE__';
      keysToday[k]=true;
    });
    const keys=Object.keys(keysToday);
    if(keys.length>=2 || (keys.length===1 && keys[0]!=='__DOMAINE__')){
      keys.forEach(function(k){
        if(k==='__DOMAINE__'){
          if(meteoData&&meteoData.date===date && !JOURNAL.some(function(j){return j.meteo&&j.id==='meteo-'+date;})){
            JOURNAL.push({id:'meteo-'+date,date:date,parcelle:'Domaine',tache:'Météo',qui:'Auto',statut:'Info',equipe:false,meteo:true,temp:meteoData.temp,desc:meteoData.desc,wind:meteoData.wind,emoji:meteoData.emoji});
          }
          return;
        }
        var d=store[k]; var wx=d&&d.wx; if(!wx)return;
        var id='meteo-'+date+'-'+_communeSlug(k);
        if(JOURNAL.some(function(j){return j.meteo&&j.id===id;}))return;
        JOURNAL.push({id:id,date:date,parcelle:(d.nom||k),tache:'Météo',qui:'Auto',statut:'Info',equipe:false,meteo:true,commune:(d.nom||k),temp:wx.temp,desc:wx.desc,wind:wx.wind,emoji:wx.emoji});
      });
      return;
    }
  }
  const alreadyMeteo=JOURNAL.some(j=>j.meteo&&j.date===date);
  if(!alreadyMeteo&&meteoData&&meteoData.date===date){
    JOURNAL.push({id:'meteo-'+date,date,parcelle:'Domaine',tache:'Météo',qui:'Auto',statut:'Info',equipe:false,meteo:true,temp:meteoData.temp,desc:meteoData.desc,wind:meteoData.wind,emoji:meteoData.emoji});
  }
}

// ── Surface / parcelles concernées par une tâche ─────────────────────────────
// Une tâche désactivée sur une parcelle (p.tachesExclues) sort ENTIÈREMENT du
// calcul de cette tâche : ni heures à faire, ni dénominateur d'avancement.
function _parcConcern(nomTache){
  return PARCELLES.filter(p=>p.statut!=='Arrachee' && !((p.tachesExclues||[]).includes(nomTache)));
}
function _surfConcern(nomTache){
  return _parcConcern(nomTache).reduce((s,p)=>s+(parseFloat(p.surface)||0),0);
}

// ════════════════════════════════════════════════════════════════════════════
// « C'EST FAIT » — restitution apres validation (lot UX-R1)
// Avant : un toast vert de 2 s. Le seul instant ou celui qui remplit l'app
// recevait quelque chose etait traite comme un accuse de reception.
// UN SEUL composant, appele par les 4 chemins de validation (regle §25.15 :
// deux chemins qui doivent produire le meme resultat appellent la meme fonction).
// AUCUNE donnee nouvelle : tout vient de TRAVAUX[tache] (deja recalcule juste
// avant l'appel par recalcTravaux) et de PARCELLES/JOURNAL/MEMBRES.
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// COMPARAISON A L'AN DERNIER (lot UX-R5)
// « Est-ce qu'on s'y est pris plus tot cette annee ? » — la question qu'un
// vigneron se pose vraiment. Lue dans le JOURNAL, pas dans les instantanes de
// cloture : le journal est integral et ne depend d'aucune archive.
// L'ecart est calcule en RANG DANS LA PERIODE (jours ecoules depuis son debut),
// jamais en dates brutes : deux campagnes qui ne commencent pas le meme jour
// resteraient comparables.
// ════════════════════════════════════════════════════════════════════════════

// Periode de l'an dernier = celle qui recouvre le plus la fenetre de la periode
// consultee decalee d'un an.
function _mvPeriodeN1(){
  var nom=(typeof _visuSaison==='function')?_visuSaison():'';
  var cur=(typeof window._saisonObj==='function')?window._saisonObj(nom):null;
  if(!cur||!cur.debut||!cur.fin)return null;
  var m1=function(d){var q=String(d).split('-');return (parseInt(q[0],10)-1)+'-'+q[1]+'-'+q[2];};
  var d1=m1(cur.debut),f1=m1(cur.fin),best=null,bestOv=-1;
  (window.SAISONS||[]).forEach(function(s){
    if(!s||!s.debut||!s.fin||s.nom===cur.nom)return;
    var a=s.debut>d1?s.debut:d1,b=s.fin<f1?s.fin:f1;
    if(a>b)return;
    var ov=(new Date(b+'T12:00:00')-new Date(a+'T12:00:00'));
    if(ov>bestOv){bestOv=ov;best=s;}
  });
  return best?{cur:cur,prev:best}:null;
}

// Derniere validation d'une tache dans une periode donnee.
function _mvFinChantier(tache,nomPeriode){
  var last=null;
  JOURNAL.forEach(function(j){
    if(!j||j.meteo||j.tache!==tache||!j.date||j.statut!=='Validé')return;
    if(typeof window._saisonForDate==='function'&&window._saisonForDate(j.date)!==nomPeriode)return;
    if(!last||j.date>last)last=j.date;
  });
  return last;
}

function _mvRang(dateISO,debutISO){
  var a=new Date(dateISO+'T12:00:00'),b=new Date(debutISO+'T12:00:00');
  if(isNaN(a.getTime())||isNaN(b.getTime()))return null;
  return Math.round((a-b)/86400000);
}

// {ecart, jours, periode} — ecart<0 = plus tot que l'an dernier. null si rien a comparer.
// dateFin : date reelle (chantier fini) ou date projetee (chantier en cours).
function _mvCompN1(tache,dateFin){
  if(!dateFin)return null;
  var pp=_mvPeriodeN1();
  if(!pp)return null;
  var finPrev=_mvFinChantier(tache,pp.prev.nom);
  if(!finPrev)return null;
  var r1=_mvRang(dateFin,pp.cur.debut),r0=_mvRang(finPrev,pp.prev.debut);
  if(r1===null||r0===null)return null;
  return {ecart:r1-r0,jours:Math.abs(r1-r0),periode:pp.prev.nom,fin:finPrev};
}

// Phrase prete a afficher, ou '' si aucune comparaison possible.
function _mvCompTxt(tache,dateFin){
  var c=_mvCompN1(tache,dateFin);
  if(!c)return '';
  if(c.jours===0)return 'Exactement au même moment que sur « '+_escHtml(c.periode)+' ».';
  return c.jours+' jour'+(c.jours>1?'s':'')+(c.ecart<0?' plus tôt':' plus tard')
    +' que sur « '+_escHtml(c.periode)+' ».';
}

function _mvIsoLocal(d){
  return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
}

window._mvCompN1=_mvCompN1;
window._mvCompTxt=_mvCompTxt;

var _MVDS_SNAP=null;   // photo de TRAVAUX[tache] AVANT mutation
var _MVDS_NEXT=null;   // parcelle suivante, pour le bouton d'enchainement
var _MVDS_UNDO=null;   // callback d'annulation (chemin rapide uniquement)

// A appeler en tete d'un chemin de validation, AVANT toute mutation de p.taches.
// L'oubli degrade proprement : sans photo, le bloc « le domaine avance » est masque.
function _mvdsSnap(tache){
  var tw=TRAVAUX[tache];
  _MVDS_SNAP=tw?{t:tache,pct:tw.pct||0,surf:tw.surf_done||0}:null;
}

function _mvdsHa(v){ return (Math.round((parseFloat(v)||0)*100)/100).toFixed(2).replace('.',','); }

// Ce qui reste a faire sur la tache, apres la validation en cours.
function _mvdsReste(tache){
  var rest=_parcConcern(tache).filter(function(p){return getTacheStatut(p,tache)!=='Validé';});
  return {
    n:rest.length,
    surf:rest.reduce(function(s,p){return s+(parseFloat(p.surface)||0);},0),
    noms:rest.slice(0,3).map(function(p){return p.nom;}),
    next:rest.length?rest[0].nom:null
  };
}

// Bilan d'un chantier termine : lu dans le journal de la PERIODE ACTIVE
// (la validation est de toute facon bloquee hors periode active par _mvValidBlocked).
function _mvdsBilan(tache){
  var vn=(typeof _visuSaison==='function')?_visuSaison():((getSaisonActive()||{}).nom||'');
  var qui={},dmin=null,dmax=null;
  JOURNAL.forEach(function(j){
    if(!j||j.meteo||j.tache!==tache||!j.date)return;
    if(vn&&typeof window._saisonForDate==='function'&&window._saisonForDate(j.date)!==vn)return;
    if(j.qui)qui[j.qui]=1;
    (j.membresEquipe||[]).forEach(function(n){ if(n)qui[n]=1; });
    if(!dmin||j.date<dmin)dmin=j.date;
    if(!dmax||j.date>dmax)dmax=j.date;
  });
  var jours=0;
  if(dmin&&dmax){
    var a=new Date(dmin+'T12:00:00'),b=new Date(dmax+'T12:00:00');
    if(!isNaN(a.getTime())&&!isNaN(b.getTime()))jours=Math.round((b-a)/86400000)+1;
  }
  var tw=TRAVAUX[tache]||{};
  return {surf:tw.surf_total||0,nb:_parcConcern(tache).length,jours:jours,qui:Object.keys(qui)};
}

function _mvdsAvatar(n){
  var m=(window.MEMBRES||[]).find(function(x){return x&&x.nom===n;});
  var c=(m&&m.couleur)||'#8A5A38';
  return '<span class="mvds-av" style="background:'+_escAttr(c)+'">'+_escHtml(String(n||'?').charAt(0).toUpperCase())+'</span>';
}

// Compteur anime : le chiffre du domaine bouge sous les yeux de celui qui vient
// de valider. C'est le mecanisme central du lot — et il est honnete, le chiffre est vrai.
function _mvdsCount(el,from,to){
  if(!el)return;
  var t0=null,dur=650;
  function step(ts){
    if(t0===null)t0=ts;
    var k=Math.min(1,(ts-t0)/dur);
    el.textContent=Math.round(from+(to-from)*(1-Math.pow(1-k,3)))+' %';
    if(k<1)requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function _mvdsClose(){
  var bg=document.querySelector('.mvds-bg');
  if(bg&&bg.parentNode)bg.parentNode.removeChild(bg);
  _MVDS_NEXT=null;_MVDS_UNDO=null;
}

function _mvdsNext(){
  var n=_MVDS_NEXT;
  _mvdsClose();
  if(!n)return;
  var td=(window.TACHES||[]).find(function(t){return t&&t.nom===n.tache;});
  var ty=(td&&td.type)||'simple';
  if(ty==='niveaux'&&typeof openNiveauxPanel==='function')openNiveauxPanel(n.parcelle,n.tache);
  else if(ty==='passages'&&typeof openPassagesPanel==='function')openPassagesPanel(n.parcelle,n.tache);
  else if(typeof openValidationPanel==='function')openValidationPanel(n.parcelle,n.tache,null);
}

function _mvdsUndo(){
  var f=_MVDS_UNDO;
  _mvdsClose();
  if(typeof f==='function')f();
}

// o = {tache, parcelle, surf, membres:[], detail:'', fini:bool, undo:fn|null}
function _mvdsOpen(o){
  o=o||{};
  _mvdsClose();
  var tache=o.tache||'',parc=o.parcelle||'';
  var tw=TRAVAUX[tache]||{};
  var snap=(_MVDS_SNAP&&_MVDS_SNAP.t===tache)?_MVDS_SNAP:null;
  _MVDS_SNAP=null;
  var reste=_mvdsReste(tache);
  var fini=(reste.n===0);
  var pctNew=tw.pct||0, pctOld=snap?snap.pct:pctNew;
  var gain=snap?Math.max(0,(tw.surf_done||0)-(snap.surf||0)):0;
  var membres=(o.membres||[]).filter(function(n){return !!n;});
  _MVDS_NEXT=reste.next?{parcelle:reste.next,tache:tache}:null;
  _MVDS_UNDO=(typeof o.undo==='function')?o.undo:null;

  var h='';
  if(fini){
    var b=_mvdsBilan(tache);
    h='<div class="mvds-sheet mvds-fin">'
      +'<span class="mvds-grab"></span>'
      +'<span class="mvds-k">Chantier terminé</span>'
      +'<span class="mvds-fin-t">'+_escHtml(tNom(tache))+'</span>'
      +'<span class="mvds-fin-s">Le domaine entier est passé.<br>Dernière parcelle : '+_escHtml(parc)+'.</span>'
      +'<span class="mvds-g">'
        +'<span class="mvds-c"><span class="v">'+_mvdsHa(b.surf)+'</span><span class="l">HECTARES</span></span>'
        +'<span class="mvds-c"><span class="v">'+b.nb+'</span><span class="l">PARCELLE'+(b.nb>1?'S':'')+'</span></span>'
        +(b.jours>0?'<span class="mvds-c"><span class="v">'+b.jours+'</span><span class="l">JOUR'+(b.jours>1?'S':'')+'</span></span>':'')
      +'</span>'
      +(b.qui.length?'<span class="mvds-fin-w">'+(b.qui.length>1?('À '+b.qui.length+' : '):'')+'<b>'+_escHtml(b.qui.join(', '))+'</b></span>':'')
      +(function(){
         var t=_mvCompTxt(tache,_mvIsoLocal(new Date()));
         return t?('<span class="mvds-fin-c">'+t+'</span>'):'';
       })()
      +'<button class="mvds-btn-or" onclick="_mvdsClose()"><span>Continuer</span></button>'
      +(_MVDS_UNDO?'<button class="mvds-btn-o mvds-btn-o-d" onclick="_mvdsUndo()"><span>Annuler cette validation</span></button>':'')
    +'</div>';
  } else {
    h='<div class="mvds-sheet">'
      +'<span class="mvds-grab"></span>'
      +'<span class="mvds-tick">✓</span>'
      +'<span class="mvds-t">'+_escHtml(parc)+', c\'est fait</span>'
      +'<span class="mvds-s">'+_escHtml(tNom(tache))+(o.detail?' · '+_escHtml(o.detail):'')
        +(o.surf?' · '+_mvdsHa(o.surf)+' ha':'')+'</span>'
      +(snap?('<span class="mvds-move">'
        +'<span class="mvds-move-k">Le domaine avance</span>'
        +'<span class="mvds-move-v"><span class="old">'+pctOld+' %</span><span class="arw">→</span>'
          +'<span class="mvds-cnt">'+pctOld+' %</span></span>'
        +(gain>0?'<span class="mvds-move-s">+ '+_mvdsHa(gain)+' ha sur '+_escHtml(tNom(tache))+'</span>':'')
      +'</span>'):'')
      +'<span class="mvds-rest"><span class="n">'+reste.n+'</span>'
        +'<span class="l">Il reste <b>'+reste.n+' parcelle'+(reste.n>1?'s':'')+'</b> sur '+_escHtml(tNom(tache))
        +' — '+_mvdsHa(reste.surf)+' ha.'
        +(reste.noms.length?'<br>'+_escHtml(reste.noms.join(', '))+(reste.n>reste.noms.length?'…':''):'')
        +'</span></span>'
      +(membres.length?('<span class="mvds-with">'+membres.map(_mvdsAvatar).join('')
        +'<span class="mvds-with-l">Enregistré au nom de '+_escHtml(membres.join(', '))+'</span></span>'):'')
      +(reste.next?('<button class="mvds-btn-g" onclick="_mvdsNext()"><span>Parcelle suivante · '+_escHtml(reste.next)+'</span></button>'):'')
      +'<button class="mvds-btn-o" onclick="_mvdsClose()"><span>'+(reste.next?'Revenir à la liste':'Fermer')+'</span></button>'
      +(_MVDS_UNDO?'<button class="mvds-btn-o mvds-btn-o-d" onclick="_mvdsUndo()"><span>Annuler cette validation</span></button>':'')
    +'</div>';
  }

  var bg=document.createElement('div');
  bg.className='mvds-bg'+(fini?' mvds-bg-fin':'');
  bg.innerHTML=h;
  bg.addEventListener('click',function(e){ if(e.target===bg)_mvdsClose(); });
  document.body.appendChild(bg);
  if(snap&&!fini)_mvdsCount(bg.querySelector('.mvds-cnt'),pctOld,pctNew);
}

window._mvdsOpen=_mvdsOpen;
window._mvdsClose=_mvdsClose;
window._mvdsNext=_mvdsNext;
window._mvdsUndo=_mvdsUndo;
window._mvdsSnap=_mvdsSnap;


// ── Plantation pilotée par le nombre de trous (tarière) ──────────────────────
function _vp_tDef(nm){ return (window.TACHES||TACHES||[]).find(function(t){return t&&t.nom===nm;}); }
function _plantMinTrou(){ var v=window.CONFIG&&parseFloat(CONFIG.plantation_min_trou); return (v&&v>0)?v:3; }
function _plantParcTrous(p){ return parseInt(p&&p.plantation_trous)||0; }
function _plantTrousTot(parcs){ return (parcs||[]).reduce(function(s,p){return s+_plantParcTrous(p);},0); }
function _plantPlanTrous(nomTache){ return _plantTrousTot(_parcConcern(nomTache||'Entreplantation')); }
// Recalcule p.plantation_trous depuis les sessions Tarière (champCustom.feedsPlantation).
// Parcelles 'session' (src=tariere) suivent les sessions ; valeurs manuelles préservées.
function _recalcPlantationTrous(){
  var fromSess={};
  (window.SESSIONS||[]).forEach(function(s){
    if(!s)return;
    var act=(window.ACTIVITES||[]).find(function(a){return a&&a.nom===s.activite;});
    if(!act||!act.champCustom||!act.champCustom.feedsPlantation)return;
    var label=act.champCustom.label;
    (s.parcellesFaites||[]).forEach(function(x){
      if(typeof x!=='object'||!x||!x.nom)return;
      var nb=parseInt(x.data&&x.data[label])||0;
      if(nb>0)fromSess[x.nom]=(fromSess[x.nom]||0)+nb;
    });
  });
  var changed=false;
  (window.PARCELLES||[]).forEach(function(p){
    if(!p)return;
    if(Object.prototype.hasOwnProperty.call(fromSess,p.nom)){
      if((p.plantation_trous||0)!==fromSess[p.nom]||p.plantation_trous_src!=='tariere'){
        p.plantation_trous=fromSess[p.nom]; p.plantation_trous_src='tariere'; changed=true;
      }
    } else if(p.plantation_trous_src==='tariere'){
      if((p.plantation_trous||0)!==0){ p.plantation_trous=0; changed=true; }
      delete p.plantation_trous_src;
    }
  });
  return changed;
}
window._plantMinTrou=_plantMinTrou;
window._plantPlanTrous=_plantPlanTrous;
window._recalcPlantationTrous=_recalcPlantationTrous;
// ── Migration one-time : avancement parcelle 'Plantation'/'Complantation' -> 'Entreplantation' (+ flag cépage) ──
// Lit les DEUX anciens noms : 'Plantation' (jamais migré) ET 'Complantation' (déjà migré côté MG en base).
function _mvMigrateEntreplantation(){
  try{
    if(window.CONFIG && window.CONFIG._mvEntreplantationMigrated2) return;
    if(!_mvKeyLoaded.parcelles || !_mvKeyLoaded.taches || !_mvKeyLoaded.config) return;
    var SRC=['Plantation','Complantation']; // anciens noms de la tâche pilotée tarière
    var didParc=false;
    function _migBloc(obj){
      if(!obj || typeof obj!=='object') return;
      SRC.forEach(function(src){
        if(Object.prototype.hasOwnProperty.call(obj,src)){
          if(!Object.prototype.hasOwnProperty.call(obj,'Entreplantation')) obj['Entreplantation']=obj[src];
          delete obj[src]; didParc=true;
        }
      });
    }
    (window.PARCELLES||[]).forEach(function(p){
      if(!p) return;
      if(p.taches) _migBloc(p.taches);
      if(p.tachesAll && typeof p.tachesAll==='object'){
        Object.keys(p.tachesAll).forEach(function(sn){ _migBloc(p.tachesAll[sn]); });
      }
      // Flag cépage : ancien champ p.complantation (parcelle multi-cépages) -> p.entreplantation
      if(Object.prototype.hasOwnProperty.call(p,'complantation')){
        if(p.entreplantation===undefined) p.entreplantation=p.complantation;
        delete p.complantation; didParc=true;
      }
    });
    window.CONFIG=window.CONFIG||{};
    window.CONFIG._mvEntreplantationMigrated2=true;
    if(typeof saveData==='function'){
      if(didParc){ saveData('parcelles'); saveData('taches'); }
      saveData('config'); // config déjà chargée → marqueur ajouté à la config pleine (garde anti-écrasement OK)
    }
  }catch(e){}
}
window._mvMigrateEntreplantation=_mvMigrateEntreplantation;

function recalcTravaux(nomTache){
  const tDef=TACHES.find(t=>t.nom===nomTache);
  const surfTot=_surfConcern(nomTache); // surface concernée (parcelles non désactivées)
  if(!TRAVAUX[nomTache]){
    if(!tDef)return;
    TRAVAUX[nomTache]={h_ha:(tDef.hha||0),saison:((tDef.saisons&&tDef.saisons[0])||tDef.saison||''),surf_done:0,surf_total:surfTot,
      pct:0,h_total:Math.round((tDef.hha||0)*surfTot),h_done:0,h_reste:Math.round((tDef.hha||0)*surfTot)};
  }
  const tw=TRAVAUX[nomTache];
  const parcActives=_parcConcern(nomTache);

  if(tDef&&tDef.type==='niveaux'){
    // Relevage : h_done pondéré par niveaux (configurable + override par parcelle)
    const rPlanGlobal=SAISON_PASSAGES[nomTache]||3;
    const allNivs=tDef.niveaux||[{num:1,hha:50},{num:2,hha:25},{num:3,hha:25}];
    // h_total se calcule PARCELLE PAR PARCELLE : un passage sauté ('Auto') sort du
    // travail fait ET du travail restant, sinon une parcelle terminée en un passage
    // laisserait une dette qui ne sera jamais payée. window._mvNivH (utils.js) est la
    // source unique de cette règle — pilotage.js l'appelle aussi.
    let hDone=0,hTot=0;
    parcActives.forEach(p=>{
      const s=_tachesFor(p)[nomTache];
      const pOv=(s&&typeof s==='object'&&s.ov!=null)?Math.min(s.ov,rPlanGlobal):rPlanGlobal;
      const nivsP=allNivs.filter(function(n){return n.num<=pOv;});
      const r=window._mvNivH(nivsP,s);
      hDone+=p.surface*r.done;
      hTot +=p.surface*r.total;
    });
    const parcsVal=parcActives.filter(p=>getTacheStatut(p,nomTache)==='Validé');
    const surfDone=parcsVal.reduce((s,p)=>s+p.surface,0);
    tw.surf_done=Math.round(surfDone*100)/100;
    tw.h_total=Math.round(hTot);
    tw.h_done=Math.round(hDone*10)/10;
    tw.h_reste=Math.round(Math.max(0,hTot-hDone)*10)/10;
    tw.pct=surfTot>0?Math.round(surfDone/surfTot*100):0;
  } else if(tDef&&tDef.type==='passages'){
    // Eb/Pioche : h_done pondéré par passages réalisés
    const planGlobal=SAISON_PASSAGES[nomTache]||2; // défaut configurable 1-3
    let hDone=0;
    parcActives.forEach(p=>{
      const s=_tachesFor(p)[nomTache];
      if(!s)return;
      if(typeof s==='string'){if(s==='Validé')hDone+=p.surface*tDef.hha*planGlobal;return;}
      const planNb=(s.ov!=null)?Math.min(s.ov,planGlobal):planGlobal; // ov ne dépasse pas le global
      for(let i=1;i<=planNb;i++){if(s['p'+i]==='Validé')hDone+=p.surface*_getPassHha(tDef,i);}
    });
    const parcsVal=parcActives.filter(p=>getTacheStatut(p,nomTache)==='Validé');
    const surfDone=parcsVal.reduce((s,p)=>s+p.surface,0);
    tw.surf_done=Math.round(surfDone*100)/100;
    let _htot=0;for(let i=1;i<=planGlobal;i++)_htot+=_getPassHha(tDef,i);
    tw.h_total=Math.round(_htot*surfTot);
    tw.h_done=Math.round(hDone*10)/10;
    tw.h_reste=Math.round((tw.h_total-hDone)*10)/10;
    tw.pct=surfTot>0?Math.round(surfDone/surfTot*100):0;
  } else if((nomTache==='Entreplantation'||(tDef&&tDef.trous)) && _plantTrousTot(parcActives)>0){
    // Plantation pilotée par les trous (tarière)
    var _rmt=_plantMinTrou();
    var _rtt=_plantTrousTot(parcActives);
    var _rpv=parcActives.filter(function(p){return getTacheStatut(p,nomTache)==='Validé';});
    var _rtd=_plantTrousTot(_rpv);
    tw.surf_total=surfTot;
    tw.surf_done=Math.round(_rpv.reduce(function(s,p){return s+(p.surface||0);},0)*100)/100;
    tw.h_total=Math.round(_rtt*_rmt/60*10)/10;
    tw.h_done=Math.round(_rtd*_rmt/60*10)/10;
    tw.h_reste=Math.round((tw.h_total-tw.h_done)*10)/10;
    tw.pct=_rtt>0?Math.round(_rtd/_rtt*100):0;
    tw.trous_total=_rtt;tw.trous_done=_rtd;tw.min_trou=_rmt;
  } else {
    // Simple — toujours rafraîchir surf_total/h_total (évite pct>100% si Firebase périmé)
    tw.surf_total=surfTot;
    tw.h_total=Math.round((tw.h_ha||0)*surfTot);
    const parcsVal=parcActives.filter(p=>getTacheStatut(p,nomTache)==='Validé');
    const surfDone=parcsVal.reduce((s,p)=>s+p.surface,0);
    tw.surf_done=Math.round(surfDone*100)/100;
    tw.h_done=Math.round((tw.h_ha||0)*surfDone*10)/10;
    tw.h_reste=Math.round((tw.h_total-tw.h_done)*10)/10;
    tw.pct=surfTot>0?Math.round(surfDone/surfTot*100):0;
  }
}


// ════════════════════════════════════════════════════════════════════════════
// PANELS MULTI-TÂCHES — Relevage (niveaux) & Eb/Pioche (passages)
// ════════════════════════════════════════════════════════════════════════════

var _nivParcelle='', _nivTache='', _nivSelDone=[], _nivSelComm=[], _adminNiveaux=false, _nivOv=null;

function openNiveauxPanel(nomParcelle, nomTache) {
  _nivParcelle=nomParcelle; _nivTache=nomTache;
  _adminNiveaux=isAdmin();
  var p=PARCELLES.find(function(x){return x.nom===nomParcelle;});
  var st=_relNivState(p);
  _nivSelDone=st.done.slice();
  _nivSelComm=st.comm ? st.comm.slice() : [];
  _nivOv=st.ov;
  var titEl=document.getElementById('niv-titre');
  var parEl=document.getElementById('niv-parcelle');
  var dateEl=document.getElementById('niv-date');
  if(titEl)titEl.textContent=(TEMOJI[nomTache]||'↑')+' '+nomTache;
  if(parEl)parEl.textContent=nomParcelle;
  if(dateEl)dateEl.value=new Date().toISOString().split('T')[0];
  var ab=document.getElementById('niv-admin-badge');
  if(ab)ab.style.display=_adminNiveaux?'inline-flex':'none';
  // Reset team picker
  document.querySelectorAll('#niv-equipe-pick .pchk').forEach(function(el,i){el.classList.toggle('sel',i===0);el.classList.toggle('vert',i===0);});
  var _nhv=document.getElementById('niv-equipe-val');if(_nhv)_nhv.value='non';
  var _nsec=document.getElementById('niv-equipe-section');if(_nsec)_nsec.style.display='none';
  _renderNiveauxModal();
  openOv('ovNiveaux');
}

function _renderNiveauxModal(){
  var tDef=TACHES.find(function(t){return t.nom===_nivTache;});
  var allNivs=(tDef&&tDef.niveaux)||[{num:1,hha:50},{num:2,hha:25},{num:3,hha:25}];
  var planGlobal=SAISON_PASSAGES[_nivTache]||3;
  var planNb=(_nivOv!=null)?Math.min(_nivOv,planGlobal):planGlobal;
  var nivs=allNivs.filter(function(n){return n.num<=planNb;});
  var auto=_computeAutoNiv(_nivSelDone, planNb);
  var p=PARCELLES.find(function(x){return x.nom===_nivParcelle;});
  var savedDone=_relNivState(p).done;
  var body=document.getElementById('niv-body');
  if(!body)return;
  var html='<p style="color:var(--texte-doux);font-size:12px;margin:0 0 12px">Tap 1 = commencé · tap 2 = validé (cascade) · ↩ pour annuler</p>';
  html+='<div style="display:flex;gap:8px;margin-bottom:14px">';
  nivs.forEach(function(niv){
    var l=niv.num;
    var isAuto=auto.indexOf(l)>=0;
    var isSel=_nivSelDone.indexOf(l)>=0;
    var isComm=_nivSelComm.indexOf(l)>=0;
    var locked=isSel||isAuto;
    var bg=isSel?'rgba(90,156,74,0.14)':isAuto?'rgba(74,159,200,0.13)':isComm?'rgba(220,140,30,0.13)':'rgba(255,255,255,0.03)';
    var brd=isSel?'rgba(90,156,74,0.38)':isAuto?'rgba(74,159,200,0.3)':isComm?'rgba(220,140,30,0.4)':'rgba(255,255,255,0.08)';
    var col=isSel?'#6AB855':isAuto?'#4A9FC8':isComm?'#DCA030':'var(--texte-doux)';
    var ico=isSel?'✓':isAuto?'~':isComm?'▶':'○';
    var canCancel=(isSel||isComm)&&!isAuto;
    html+='<div style="flex:1;display:flex;flex-direction:column;gap:5px;">';
    html+='<button onclick="_toggleNiv('+l+')" style="width:100%;padding:14px 0;border-radius:10px;font-family:inherit;cursor:'+(locked?'default':'pointer')+';border:1.5px solid '+brd+';background:'+bg+';color:'+col+';font-weight:700;font-size:16px;transition:all 0.15s;display:flex;flex-direction:column;align-items:center;gap:3px">'
      +'<span>'+ico+'</span><span style="font-size:9px;font-weight:700;letter-spacing:.06em;opacity:.75">N'+l+(isAuto?' auto':'')+'</span></button>';
    html+='<button onclick="_cancelNiv('+l+')" '+(canCancel?'':'disabled')+' style="width:100%;padding:5px 0;border-radius:7px;border:1px solid rgba(184,90,26,'+(canCancel?'0.25':'0.1')+');background:rgba(184,90,26,'+(canCancel?'0.06':'0.02')+');color:#B85A1A;font-size:11px;font-family:inherit;cursor:'+(canCancel?'pointer':'default')+';font-weight:600;opacity:'+(canCancel?'1':'0.3')+'">↩ N'+l+'</button>';
    html+='</div>';
  });
  html+='</div>';
  var cascadeUp=[];
  _nivSelDone.forEach(function(l){for(var j=1;j<l;j++){if(cascadeUp.indexOf(j)<0&&auto.indexOf(j)<0)cascadeUp.push(j);}});
  if(cascadeUp.length>0){
    var topVal=_nivSelDone.slice().sort(function(a,b){return b-a;})[0];
    var skipMsg='N'+topVal+' valid\u00e9 \u2192 N'+cascadeUp.join('+N')+' auto-valid\u00e9'+(cascadeUp.length>1?'s':'');
    html+='<div style="margin-bottom:10px;padding:9px 12px;border-radius:8px;background:rgba(74,159,200,0.08);border:1px solid rgba(74,159,200,0.22);color:var(--acier-med);font-size:12px;display:flex;gap:8px;align-items:flex-start"><span>&#9889;</span><span>'+skipMsg+'</span></div>';
  }
  // Section override par parcelle
  html+='<div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:14px;margin-top:4px">';
  html+='<p style="color:var(--texte-doux);font-size:12px;margin:0 0 8px">Niveaux pr\u00e9vus pour cette parcelle :</p>';
  for(var _n=1;_n<=3;_n++){
    var _selN=(planNb===_n);
    var _isDef=(_n===planGlobal);
    html+='<div onclick="_setNivOv('+_n+')" style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;margin-bottom:6px;cursor:pointer;background:'+(_selN?'rgba(192,132,90,0.07)':'rgba(255,255,255,0.02)')+';border:1px solid '+(_selN?'rgba(192,132,90,0.22)':'rgba(255,255,255,0.05)')+';transition:all 0.12s">'
      +'<span style="width:16px;height:16px;border-radius:50%;flex-shrink:0;border:2px solid '+(_selN?'var(--accent)':'rgba(255,255,255,0.2)')+';background:'+(_selN?'var(--accent)':'transparent')+';transition:all 0.12s"></span>'
      +'<span style="color:'+(_selN?'var(--texte)':'var(--texte-doux)')+';font-size:13px">'+_n+' niveau'+(_n>1?'x':'')+(_isDef?' <span style="color:var(--texte-doux);font-size:11px">(d\u00e9faut saison)</span>':'')+'</span>'
      +'</div>';
  }
  if(_nivOv!==null&&_nivOv!==planGlobal){
    html+='<div style="margin-top:8px;padding:8px 12px;border-radius:7px;background:rgba(74,159,200,0.08);border:1px solid rgba(74,159,200,0.2);color:var(--acier-med);font-size:11px">&#9881; Override activ\u00e9 — cette parcelle diff\u00e8re du plan saison</div>';
  }
  html+='</div>';
  body.innerHTML=html;
}

function _toggleNiv(l){
  var planGlobal=SAISON_PASSAGES[_nivTache]||3;
  var planNb=(_nivOv!=null)?Math.min(_nivOv,planGlobal):planGlobal;
  var auto=_computeAutoNiv(_nivSelDone, planNb);
  if(auto.indexOf(l)>=0)return; // auto = intangible
  var inDone=_nivSelDone.indexOf(l)>=0;
  var inComm=_nivSelComm.indexOf(l)>=0;
  if(inDone)return; // Validé = verrouillé, utiliser ↩ pour annuler
  if(inComm){
    // Commencé → Validé (cascade : tous les niveaux inférieurs → Validé)
    _nivSelComm.splice(_nivSelComm.indexOf(l),1);
    _nivSelDone.push(l);
    for(var j=1;j<l;j++){
      if(_nivSelDone.indexOf(j)<0){_nivSelDone.push(j);}
      var cj=_nivSelComm.indexOf(j);if(cj>=0)_nivSelComm.splice(cj,1);
    }
  } else {
    // Non démarré → Commencé (pas de cascade)
    _nivSelComm.push(l);
  }
  _renderNiveauxModal();
}
function _cancelNiv(l){
  // Réinitialiser ce niveau + cascade : tous les niveaux supérieurs réinitialisés
  var di=_nivSelDone.indexOf(l);if(di>=0)_nivSelDone.splice(di,1);
  var ci=_nivSelComm.indexOf(l);if(ci>=0)_nivSelComm.splice(ci,1);
  for(var j=l+1;j<=3;j++){
    var dj=_nivSelDone.indexOf(j);if(dj>=0)_nivSelDone.splice(dj,1);
    var cj=_nivSelComm.indexOf(j);if(cj>=0)_nivSelComm.splice(cj,1);
  }
  _renderNiveauxModal();
}

function _setNivOv(n){
  var planGlobal=SAISON_PASSAGES[_nivTache]||3;
  _nivOv=(n===planGlobal)?null:n;
  var planNb=_nivOv!=null?_nivOv:planGlobal;
  _nivSelDone=_nivSelDone.filter(function(l){return l<=planNb;});
  _renderNiveauxModal();
}

function confirmNiveaux(){
  if(_mvValidBlocked())return;
  var p=PARCELLES.find(function(x){return x.nom===_nivParcelle;});
  if(!p)return;
  _mvdsSnap(_nivTache);
  var planGlobal=SAISON_PASSAGES[_nivTache]||3;
  var planNb=(_nivOv!=null)?Math.min(_nivOv,planGlobal):planGlobal;
  var auto=_computeAutoNiv(_nivSelDone, planNb);
  var newState={ov:_nivOv};
  for(var _cl=1;_cl<=3;_cl++){
    if(_cl<=planNb){
      if(_nivSelDone.indexOf(_cl)>=0)newState['n'+_cl]='Validé';
      else if(auto.indexOf(_cl)>=0)newState['n'+_cl]='Auto';
      else if(_nivSelComm.indexOf(_cl)>=0)newState['n'+_cl]='Commencé';
      else newState['n'+_cl]='Non démarré';
    } else {
      newState['n'+_cl]='Non démarré';
    }
  }
  p.taches[_nivTache]=newState;
  var statut=getTacheStatut(p,_nivTache);
  var date=document.getElementById('niv-date')&&document.getElementById('niv-date').value||new Date().toISOString().split('T')[0];
  var equipe=document.getElementById('niv-equipe-val')&&document.getElementById('niv-equipe-val').value==='oui';
  var membresEquipe=equipe?_getSelectedMembres('niv-membres-pick'):[];
  JOURNAL.unshift({id:Date.now().toString(16),date:date,parcelle:_nivParcelle,tache:_nivTache,qui:currentUser.nom,statut:statut,equipe:equipe,membresEquipe:membresEquipe,niveaux:_nivSelDone.slice().sort()});
  recalcTravaux(_nivTache);
  injectMeteoIfNeeded(date);
  saveData('parcelles');saveData('journal');saveData('travaux');
  document.getElementById('ovNiveaux').classList.remove('open');
  renderParcelles();computePStats();
  if(navigator.vibrate)navigator.vibrate(60);
  var doneLabel=_nivSelDone.slice().sort().map(function(n){return 'N'+n;}).join('+');
  _mvdsOpen({tache:_nivTache,parcelle:_nivParcelle,surf:p.surface,detail:doneLabel||'mise à jour',
             membres:equipe?[currentUser.nom].concat(membresEquipe.filter(function(n){return n!==currentUser.nom;})):[]});
  // Rafraîchir l'Accueil si actif (heures card + avancement)
  var _nivPid=(document.querySelector('.page.active')||{}).id||'';
  if(_nivPid==='page-home'&&typeof renderHome==='function')renderHome();
}

// ── Passages ─────────────────────────────────────────────────────────────────
var _passParcelle='', _passTache='', _passSelDone=[], _passSelComm=[], _passOv=null;

function openPassagesPanel(nomParcelle, nomTache){
  _passParcelle=nomParcelle; _passTache=nomTache;
  var p=PARCELLES.find(function(x){return x.nom===nomParcelle;});
  var s=p&&p.taches&&p.taches[nomTache];
  if(s&&typeof s==='object'){
    _passOv=s.ov;
    _passSelDone=[];
    _passSelComm=[];
    for(var i=1;i<=4;i++){
      if(s['p'+i]==='Validé')_passSelDone.push(i);
      else if(s['p'+i]==='Commencé')_passSelComm.push(i);
    }
  } else {
    _passOv=null;
    _passSelDone=(s==='Validé')?[1,2]:[];
    _passSelComm=[];
  }
  var titEl=document.getElementById('pass-titre');
  var parEl=document.getElementById('pass-parcelle');
  var dateEl=document.getElementById('pass-date');
  if(titEl)titEl.textContent=(TEMOJI[nomTache]||'🔄')+' '+nomTache;
  if(parEl)parEl.textContent=nomParcelle;
  if(dateEl)dateEl.value=new Date().toISOString().split('T')[0];
  // Reset team picker
  document.querySelectorAll('#pass-equipe-pick .pchk').forEach(function(el,i){el.classList.toggle('sel',i===0);el.classList.toggle('vert',i===0);});
  var _phv=document.getElementById('pass-equipe-val');if(_phv)_phv.value='non';
  var _psec=document.getElementById('pass-equipe-section');if(_psec)_psec.style.display='none';
  _renderPassagesModal();
  openOv('ovPassages');
}

function _renderPassagesModal(){
  var planDef=SAISON_PASSAGES[_passTache]||2;
  var planNb=(_passOv!=null)?_passOv:planDef;
  var body=document.getElementById('pass-body');
  if(!body)return;
  var html='<p style="color:var(--texte-doux);font-size:13px;margin:0 0 10px">Tap 1 = commencé · tap 2 = validé · tap 3 = sans effet</p>';
  html+='<div style="display:flex;gap:8px;margin-bottom:16px">';
  for(var i=1;i<=planNb;i++){
    var va=_passSelDone.indexOf(i)>=0;
    var co=_passSelComm.indexOf(i)>=0;
    var bg=va?'rgba(90,156,74,0.14)':co?'rgba(220,140,30,0.13)':'rgba(255,255,255,0.03)';
    var brd=va?'rgba(90,156,74,0.38)':co?'rgba(220,140,30,0.4)':'rgba(255,255,255,0.08)';
    var col=va?'#6AB855':co?'#DCA030':'var(--texte-doux)';
    var ico=va?'✓':co?'▶':'○';
    var cur=va?'default':'pointer';
    html+='<div style="flex:1;display:flex;flex-direction:column;gap:5px;">';
    html+='<button onclick="_togglePass('+i+')" style="width:100%;padding:14px 0;border-radius:10px;font-family:inherit;cursor:'+cur+';border:1.5px solid '+brd+';background:'+bg+';color:'+col+';font-weight:700;font-size:16px;transition:all 0.15s;display:flex;flex-direction:column;align-items:center;gap:3px"><span>'+ico+'</span><span style="font-size:9px;font-weight:700;letter-spacing:.06em;opacity:.75">P'+i+'</span></button>';
    html+='<button onclick="_cancelPass('+i+')" '+(va||co?'':'disabled')+' style="width:100%;padding:5px 0;border-radius:7px;border:1px solid rgba(184,90,26,'+(va||co?'0.25':'0.1')+');background:rgba(184,90,26,'+(va||co?'0.06':'0.02')+');color:#B85A1A;font-size:11px;font-family:inherit;cursor:'+(va||co?'pointer':'default')+';font-weight:600;opacity:'+(va||co?'1':'0.3')+'">↩ Annuler P'+i+'</button>';
    html+='</div>';
  }
  html+='</div>';
  html+='<div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:14px">';
  html+='<p style="color:var(--texte-doux);font-size:12px;margin:0 0 8px">Passages prévus pour cette parcelle :</p>';
  for(var n=1;n<=3;n++){
    var selN=(planNb===n);
    var isDef=(n===planDef);
    html+='<div onclick="_setPassOv('+n+')" style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;margin-bottom:6px;cursor:pointer;background:'+(selN?'rgba(192,132,90,0.07)':'rgba(255,255,255,0.02)')+';border:1px solid '+(selN?'rgba(192,132,90,0.22)':'rgba(255,255,255,0.05)')+';transition:all 0.12s">'
      +'<span style="width:16px;height:16px;border-radius:50%;flex-shrink:0;border:2px solid '+(selN?'var(--accent)':'rgba(255,255,255,0.2)')+';background:'+(selN?'var(--accent)':'transparent')+';transition:all 0.12s"></span>'
      +'<span style="color:'+(selN?'var(--texte)':'var(--texte-doux)')+';font-size:13px">'+n+' passage'+(n>1?'s':'')+(isDef?' <span style=\"color:var(--texte-doux);font-size:11px\">(défaut saison)</span>':'')+'</span>'
      +'</div>';
  }
  if(_passOv!==null&&_passOv!==planDef){
    html+='<div style="margin-top:8px;padding:8px 12px;border-radius:7px;background:rgba(74,159,200,0.08);border:1px solid rgba(74,159,200,0.2);color:var(--acier-med);font-size:11px">⚙ Override activé — cette parcelle diffère du plan saison</div>';
  }
  html+='</div>';
  body.innerHTML=html;
}

function _togglePass(i){
  var inDone=_passSelDone.indexOf(i)>=0;
  var inComm=_passSelComm.indexOf(i)>=0;
  if(inDone)return; // Validé = verrouillé, utiliser ↩ pour annuler
  if(inComm){
    // Commencé → Validé
    _passSelComm.splice(_passSelComm.indexOf(i),1);
    _passSelDone.push(i);
    _passSelDone.sort(function(a,b){return a-b;});
  } else {
    // Non démarré → Commencé
    _passSelComm.push(i);
    _passSelComm.sort(function(a,b){return a-b;});
  }
  _renderPassagesModal();
}
function _cancelPass(i){
  var di=_passSelDone.indexOf(i);if(di>=0)_passSelDone.splice(di,1);
  var ci=_passSelComm.indexOf(i);if(ci>=0)_passSelComm.splice(ci,1);
  _renderPassagesModal();
}

function _setPassOv(n){
  var planDef=SAISON_PASSAGES[_passTache]||2;
  _passOv=(n===planDef)?null:n;
  _renderPassagesModal();
}

function confirmPassages(){
  if(_mvValidBlocked())return;
  var p=PARCELLES.find(function(x){return x.nom===_passParcelle;});
  if(!p)return;
  _mvdsSnap(_passTache);
  var planGlobal=SAISON_PASSAGES[_passTache]||2;
  var planNb=(_passOv!=null)?_passOv:planGlobal;
  var newState={ov:_passOv};
  for(var i=1;i<=4;i++){
    if(i<=planNb)newState['p'+i]=_passSelDone.indexOf(i)>=0?'Validé':_passSelComm.indexOf(i)>=0?'Commencé':'Non démarré';
  }
  p.taches[_passTache]=newState;
  var doneParcelle=_passSelDone.filter(function(i){return i<=planNb;});
  var doneCnt=doneParcelle.length;
  var commParcelle=_passSelComm.filter(function(i){return i<=planNb;});
  var date=document.getElementById('pass-date')&&document.getElementById('pass-date').value||new Date().toISOString().split('T')[0];
  var equipe=document.getElementById('pass-equipe-val')&&document.getElementById('pass-equipe-val').value==='oui';
  var membresEquipe=equipe?_getSelectedMembres('pass-membres-pick'):[];
  var statut=doneCnt>=planNb?'Validé':(doneCnt>0||commParcelle.length>0)?'En cours':'Non démarré';
  JOURNAL.unshift({id:Date.now().toString(16),date:date,parcelle:_passParcelle,tache:_passTache,qui:currentUser.nom,statut:statut,equipe:equipe,membresEquipe:membresEquipe,passages:doneParcelle});
  recalcTravaux(_passTache);
  injectMeteoIfNeeded(date);
  saveData('parcelles');saveData('journal');saveData('travaux');
  document.getElementById('ovPassages').classList.remove('open');
  renderParcelles();computePStats();
  if(navigator.vibrate)navigator.vibrate(60);
  var passLabel=doneParcelle.map(function(i){return 'P'+i;}).join('+');
  _mvdsOpen({tache:_passTache,parcelle:_passParcelle,surf:p.surface,detail:passLabel,
             membres:equipe?[currentUser.nom].concat(membresEquipe.filter(function(n){return n!==currentUser.nom;})):[]});
  // Rafraîchir l'Accueil si actif (heures card + avancement)
  var _pasPid=(document.querySelector('.page.active')||{}).id||'';
  if(_pasPid==='page-home'&&typeof renderHome==='function')renderHome();
}

// ── Config passages saison ────────────────────────────────────────────────────
function saveSaisonPassages(nomTache, nb){
  SAISON_PASSAGES[nomTache]=nb; window.SAISON_PASSAGES=SAISON_PASSAGES;
  if(!CONFIG)CONFIG={}; if(!window.CONFIG)window.CONFIG={};
  CONFIG.saison_passages=Object.assign({},SAISON_PASSAGES);
  window.CONFIG.saison_passages=CONFIG.saison_passages;
  if(window.fbSave)window.fbSave('config',CONFIG);
  delete TRAVAUX[nomTache]; recalcTravaux(nomTache); window.TRAVAUX=TRAVAUX;
  var typeLabel=nomTache==='Relevage'?'niveau'+(nb>1?'x':''):'passage'+(nb>1?'s':'');
  showToast('✅ '+nomTache+' : '+nb+' '+typeLabel+' par saison','#3D6B27');
  window.renderReglages();
}

function togglePassEquipeMode(val){
  document.querySelectorAll('#pass-equipe-pick .pchk').forEach(function(el){
    var isTarget=el.dataset.val===val;
    el.classList.toggle('sel',isTarget);el.classList.toggle('vert',isTarget);
  });
  var hv=document.getElementById('pass-equipe-val');if(hv)hv.value=val;
  var sec=document.getElementById('pass-equipe-section');if(sec)sec.style.display=val==='oui'?'block':'none';
  if(val==='oui')_buildMembresCheckboxes('pass-membres-pick','');
}


function annulerTache(nomParcelle,nomTache){
  if(_mvValidBlocked())return;
  if(!canWrite()){showToast('Droits insuffisants','#B85A1A');return;}
  const p=PARCELLES.find(x=>x.nom===nomParcelle);if(!p)return;
  const tDef=TACHES.find(t=>t.nom===nomTache);
  if(tDef&&tDef.type==='niveaux'){
    var _existOv=(p.taches[nomTache]&&typeof p.taches[nomTache]==='object')?p.taches[nomTache].ov:null;
    p.taches[nomTache]={n1:'Non démarré',n2:'Non démarré',n3:'Non démarré',ov:_existOv};
  } else if(tDef&&tDef.type==='passages'){
    const ov=(p.taches[nomTache]&&typeof p.taches[nomTache]==='object')?p.taches[nomTache].ov:null;
    p.taches[nomTache]={ov};
  } else {
    p.taches[nomTache]='Non démarré';
  }
  const date=new Date().toISOString().split('T')[0];
  JOURNAL.unshift({id:Date.now().toString(16),date,parcelle:nomParcelle,tache:nomTache,qui:currentUser.nom,statut:'Annulé',equipe:false,membresEquipe:[]});
  recalcTravaux(nomTache);injectMeteoIfNeeded(date);
  saveData('parcelles');saveData('journal');saveData('travaux');
  openDP(nomParcelle);renderParcelles();computePStats();
  if(navigator.vibrate)navigator.vibrate(60);
  showToast('Annulé : '+tNom(nomTache)+' - '+nomParcelle,'#B85A1A');
  // Rafraîchir l'Accueil si actif
  var _annPid=(document.querySelector('.page.active')||{}).id||'';
  if(_annPid==='page-home'&&typeof renderHome==='function')renderHome();
}
function savePassageHha(nomTache,passNum,hhaVal){
  const t=TACHES.find(x=>x.nom===nomTache);if(!t)return;
  const planNb=SAISON_PASSAGES[nomTache]||2;
  if(!t.passagesHha)t.passagesHha=Array.from({length:planNb},function(){return t.hha;});
  while(t.passagesHha.length<planNb)t.passagesHha.push(t.hha);
  t.passagesHha[passNum-1]=parseFloat(hhaVal)||t.hha;
  window.TACHES=TACHES;
  delete TRAVAUX[nomTache];recalcTravaux(nomTache);window.TRAVAUX=TRAVAUX;
  saveData('taches');saveData('travaux');
  showToast('P'+passNum+' '+nomTache+' : '+t.passagesHha[passNum-1]+'h/ha','#3D6B27');
  window.renderReglages();
}

// ── PERF-2 : Leaflet charge A LA DEMANDE (retire du <head>, non bloquant au demarrage) ──
// Injecte CSS+JS Leaflet 1.9.4 (unpkg) avec controle d'integrite SRI, au 1er besoin de carte (Parcelles/Pilotage).
// Idempotent : renvoie immediatement si window.L est deja present ; memorise la promesse en vol.
var _leafletPromise=null;
function _ensureLeaflet(){
  if(window.L) return Promise.resolve(window.L);
  if(_leafletPromise) return _leafletPromise;
  _leafletPromise=new Promise(function(resolve,reject){
    try{
      if(!document.getElementById('mv-leaflet-css')){
        var lk=document.createElement('link');
        lk.id='mv-leaflet-css'; lk.rel='stylesheet';
        lk.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        lk.integrity='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        lk.crossOrigin='anonymous';
        document.head.appendChild(lk);
      }
      var sc=document.createElement('script');
      sc.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      sc.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      sc.crossOrigin='anonymous'; sc.async=true;
      sc.onload=function(){ if(window.L){ resolve(window.L); } else { _leafletPromise=null; reject(new Error('L absent apres chargement')); } };
      sc.onerror=function(){ _leafletPromise=null; reject(new Error('Leaflet indisponible')); };
      document.head.appendChild(sc);
    }catch(e){ _leafletPromise=null; reject(e); }
  });
  return _leafletPromise;
}
window._ensureLeaflet=_ensureLeaflet;
function _mvLeafletFail(){ if(window.showToast) showToast('Carte indisponible hors ligne','#C0392B'); }
function switchPTab(tab){
  document.getElementById('tbl').classList.toggle('active',tab==='liste');
  document.getElementById('tbc').classList.toggle('active',tab==='carte');
  document.getElementById('pwrapliste').classList.toggle('vis',tab==='liste');
  document.getElementById('pwrapcarte').classList.toggle('vis',tab==='carte');
  if(tab==='carte'){
    if(!mapInit){
      _ensureLeaflet().then(function(){
        if(!mapInit){initMap();mapInit=true;}
        _updateMapOfflineBanner();
      }).catch(function(){ _mvLeafletFail(); _updateMapOfflineBanner(); });
    }
    else if(leafMap){
      setTimeout(function(){leafMap.invalidateSize();},100);
      refreshMapColors();
      _updateMapOfflineBanner();
    }
    else { _updateMapOfflineBanner(); }
  }
}
var _leafLayers=[]; // stocke {poly, parcelle} pour rafraîchir les couleurs sans recréer la carte
var _mapLabelsVisible=true; // toggle noms parcelles sur la carte
function initMap(){
  leafMap=L.map('map');
  var _mvFitBnds=[]; // points pour recadrer la carte sur le vignoble (parcelles + secteurs)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM'}).addTo(leafMap);
  _leafLayers=[];
  var _kmlSource = (window.KML_POLYGONS_DYNAMIC && window.KML_POLYGONS_DYNAMIC.length) ? window.KML_POLYGONS_DYNAMIC : KML_DATA;
  _kmlSource.forEach(function(k){
    const p=PARCELLES.find(function(x){return x.nom.toLowerCase()===k.name.toLowerCase();});
    const col=p?getPCls(p).col:'#888888';
    const popup=p?('<b>'+_escHtml(p.nom)+'</b><br>'+p.surface+' ha · '+getPCls(p).pct+'%'):('<b>'+_escHtml(k.name)+'</b>');
    const poly=L.polygon(k.pts,{color:col,fillColor:col,fillOpacity:0.28,weight:2}).addTo(leafMap).bindPopup(popup);
    var _ctr=k.pts.reduce(function(a,b){return[a[0]+b[0],a[1]+b[1]];},[0,0]);
    var _lc=[_ctr[0]/k.pts.length,_ctr[1]/k.pts.length];
    var _tt=L.tooltip({permanent:true,direction:'center',className:'parcel-label'}).setContent(_pOrdMapLabel(p?p.nom:k.name)).setLatLng(_lc).addTo(leafMap);
    if(p){poly.on('click',function(){_mvMapTap(p.nom);});}
    _leafLayers.push({poly,parcelle:p||null,tooltip:_tt,kname:k.name});
    (k.pts||[]).forEach(function(pt){ _mvFitBnds.push(pt); });
  });
  // Epingles : parcelle geolocalisee -> son centroide ; sinon -> centre de sa
  // commune affectee (meteo par secteur), regroupe par commune pour eviter
  // l'empilement de reperes au meme point.
  var _mvCommGroups={};
  PARCELLES.forEach(function(p){
    if(!p||p.statut==='Arrachee')return;
    var la=parseFloat(p.lat), ln=parseFloat(p.lng);
    if(_geoPlausible(la,ln)){
      var cl=getPCls(p);
      L.circleMarker([la,ln],{radius:6,fillColor:cl.col,color:'white',weight:2,fillOpacity:0.9})
        .addTo(leafMap).bindPopup('<b>'+_escHtml(p.nom)+'</b><br>'+p.surface+' ha · '+cl.pct+'%')
        .on('click',function(){_mvMapTap(p.nom);});
      _mvFitBnds.push([la,ln]);
    } else if(p.commune && _geoPlausible(parseFloat(p.commune.lat),parseFloat(p.commune.lng))){
      var _ck=_communeSlug(p.commune.nom);
      if(!_mvCommGroups[_ck]) _mvCommGroups[_ck]={nom:p.commune.nom,lat:parseFloat(p.commune.lat),lng:parseFloat(p.commune.lng),parc:[]};
      _mvCommGroups[_ck].parc.push(p);
    }
  });
  // Un repere "secteur" par commune (parcelles sans contour ni coordonnees propres)
  Object.keys(_mvCommGroups).forEach(function(_ck){
    var g=_mvCommGroups[_ck];
    var liste=g.parc.map(function(pp){var c=getPCls(pp);return '<b>'+_escHtml(pp.nom)+'</b> · '+pp.surface+' ha · '+c.pct+'%';}).join('<br>');
    var n=g.parc.length;
    var ic=L.divIcon({className:'',iconSize:[28,28],iconAnchor:[14,14],html:'<div style="width:28px;height:28px;border-radius:50%;background:#C9A84C;color:#1C1813;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font:700 13px/1 system-ui,sans-serif;">'+n+'</div>'});
    L.marker([g.lat,g.lng],{icon:ic}).addTo(leafMap)
      .bindPopup('<b>'+String.fromCodePoint(0x1F4CD)+' '+_escHtml(g.nom)+'</b><br><span style="color:var(--texte-doux,#888);font-size:12px;">'+n+' parcelle'+(n>1?'s':'')+' · commune (repère)</span><br>'+liste);
    _mvFitBnds.push([g.lat,g.lng]);
  });
  // Recadrage : sur le vignoble si on a des points, sinon centre du domaine
  if(_mvFitBnds.length){
    try{ leafMap.fitBounds(L.latLngBounds(_mvFitBnds),{padding:[40,40],maxZoom:16}); }
    catch(e){ var _dg=getDomaineGeo(); leafMap.setView([_dg.lat,_dg.lng],13); }
  } else {
    var _dg2=getDomaineGeo(); leafMap.setView([_dg2.lat,_dg2.lng],13);
  }
}
function refreshMapColors(){
  _leafLayers.forEach(function(item){
    if(!item.parcelle)return;
    const cl=getPCls(item.parcelle);
    item.poly.setStyle({color:cl.col,fillColor:cl.col});
    item.poly.setPopupContent('<b>'+_escHtml(item.parcelle.nom)+'</b><br>'+item.parcelle.surface+' ha · '+cl.pct+'%');
  });
  _pOrdMapSync();
}
function _mvMapTap(nom){
  var p=PARCELLES.find(function(x){return x.nom===nom;});
  if(!p)return;
  if(p.statut==='Arrachee'||!canWrite()){ openDP(nom); return; }
  var _pt=(typeof priorityTask!=='undefined')?priorityTask:'';
  var _ptOK=_pt&&getTachesSaison().some(function(t){return t.nom===_pt;});
  var activeTask='toutes';
  if(_ptOK && !isAdmin()) activeTask=_pt;
  else if(pTacheFilter && pTacheFilter!=='toutes') activeTask=pTacheFilter;
  else if(_ptOK) activeTask=_pt;
  if(activeTask==='toutes'){ openDP(nom); return; }
  if(pTacheFilter!==activeTask){ pTacheFilter=activeTask; pCurStep=_pvSmartStep(activeTask); }
  _mvMapQuickOpen(nom);
}
function _mvMapQuickOpen(nom){
  var p=PARCELLES.find(function(x){return x.nom===nom;});if(!p)return;
  _mvMapQuickNom=nom;
  var cl=getPCls(p);
  var task=pTacheFilter,type=_pvType(task);
  var em=(window.TEMOJI&&window.TEMOJI[task])?window.TEMOJI[task]:String.fromCodePoint(0x1F3AF);
  var _e=document.getElementById('mq-nom'); if(_e)_e.textContent=p.nom;
  var _s=document.getElementById('mq-sub'); if(_s)_s.textContent=p.statut+' '+String.fromCodePoint(0x00b7)+' '+p.surface+' ha';
  var pe=document.getElementById('mq-pct');
  if(pe){pe.textContent=cl.pct+'%';pe.style.color=(cl.pct===100?'var(--vert)':cl.pct>=75?'var(--or)':'var(--orange)');}
  var bar=document.getElementById('mq-bar-fill'); if(bar){bar.style.width=cl.pct+'%';bar.style.background=cl.col;}
  var stepLbl=(type!=='simple')?(' '+_pvStepLabel(task)+pCurStep):'';
  var _t=document.getElementById('mq-task'); if(_t)_t.textContent=em+' '+(typeof tNom==='function'?tNom(task):task)+stepLbl;
  var here=(typeof _pProxHere!=='undefined'&&_pProxHere===nom);
  var _h=document.getElementById('mq-here'); if(_h)_h.style.display=here?'':'none';
  var done=_pvCurDone(p,task), started=_pvCurStarted(p,task);
  var bStart=document.getElementById('mq-start'), bVal=document.getElementById('mq-validate');
  if(bStart)bStart.style.display=(done||started)?'none':'';
  if(bVal){
    if(done){bVal.textContent=String.fromCodePoint(0x2713)+' D\u00e9j\u00e0 fait';bVal.classList.add('mq-done');bVal.disabled=true;}
    else {bVal.textContent=String.fromCodePoint(0x2713)+' Valider'+stepLbl;bVal.classList.remove('mq-done');bVal.disabled=false;}
  }
  openOv('ovMapQuick');
}
function _mvMapQuickValidate(){
  var nom=_mvMapQuickNom;if(!nom)return;
  var p=PARCELLES.find(function(x){return x.nom===nom;});
  document.getElementById('ovMapQuick').classList.remove('open');
  if(p&&_pvCurDone(p,pTacheFilter))return;
  pQuickValidate(nom,null);
  _mvMapHighlight();
}
function _mvMapQuickStart(){
  var nom=_mvMapQuickNom;if(!nom)return;
  document.getElementById('ovMapQuick').classList.remove('open');
  pQuickStart(nom,null);
  _mvMapHighlight();
}
function _mvMapQuickFiche(){
  var nom=_mvMapQuickNom;
  document.getElementById('ovMapQuick').classList.remove('open');
  if(nom)setTimeout(function(){openDP(nom);},120);
}
function _mvMapLocate(){
  if(!leafMap)return;
  if(!navigator.geolocation){showToast(String.fromCodePoint(0x1F4CD)+' GPS indisponible','#C0392B');return;}
  var btn=document.getElementById('map-loc-btn');
  if(btn)btn.classList.add('loading');
  navigator.geolocation.getCurrentPosition(function(pos){
    if(btn)btn.classList.remove('loading');
    var lat=pos.coords.latitude,lng=pos.coords.longitude;
    _pProxPos={lat:lat,lng:lng};
    _pProxHere=_pProxDetectHere(_pProxPos);
    _mvMapMeMarker(lat,lng);
    leafMap.setView([lat,lng],Math.max(leafMap.getZoom(),16));
    _mvMapHighlight();
    if(_pProxHere)showToast(String.fromCodePoint(0x1F4CD)+' Vous \u00eates sur '+_pProxHere,'#3D6B27');
    else showToast(String.fromCodePoint(0x1F4CD)+' Position trouv\u00e9e','#3D6B27');
  },function(){
    if(btn)btn.classList.remove('loading');
    showToast(String.fromCodePoint(0x1F4CD)+' Position indisponible','#C0392B');
  },{enableHighAccuracy:true,timeout:10000,maximumAge:5000});
}
function _mvMapMeMarker(lat,lng){
  if(!leafMap)return;
  if(_mvMeMarker){try{_mvMeMarker.setLatLng([lat,lng]);}catch(e){}return;}
  var ic=L.divIcon({className:'mv-mehere-wrap',html:'<div class="mv-mehere-pulse"></div><div class="mv-mehere-dot"></div>',iconSize:[22,22],iconAnchor:[11,11]});
  _mvMeMarker=L.marker([lat,lng],{icon:ic,interactive:false,keyboard:false,zIndexOffset:1000}).addTo(leafMap);
}
function _mvMapHighlight(){
  if(!leafMap||!_leafLayers)return;
  _leafLayers.forEach(function(item){
    if(!item.parcelle)return;
    var cl=getPCls(item.parcelle);
    item.poly.setStyle({color:cl.col,fillColor:cl.col,weight:2,dashArray:null,fillOpacity:0.28});
    item.poly.setPopupContent('<b>'+_escHtml(item.parcelle.nom)+'</b><br>'+item.parcelle.surface+' ha '+String.fromCodePoint(0x00b7)+' '+cl.pct+'%');
  });
  if(typeof _pProxHere==='undefined'||!_pProxHere)return;
  _leafLayers.forEach(function(item){
    if(item.parcelle&&item.parcelle.nom===_pProxHere){
      item.poly.setStyle({color:'#C9A84C',weight:5,dashArray:'7 5',fillOpacity:0.42});
      try{item.poly.bringToFront();}catch(e){}
    }
  });
}
function toggleMapLabels(){
  _mapLabelsVisible=!_mapLabelsVisible;
  if(leafMap){
    _leafLayers.forEach(function(item){
      if(_mapLabelsVisible){
        if(!leafMap.hasLayer(item.tooltip))item.tooltip.addTo(leafMap);
      } else {
        if(leafMap.hasLayer(item.tooltip))leafMap.removeLayer(item.tooltip);
      }
    });
  }
  var btn=document.getElementById('map-lbl-btn');
  if(btn)btn.textContent=_mapLabelsVisible?'🏷 Noms ✓':'🏷 Noms';
}
function _updateMapOfflineBanner(){
  var b=document.getElementById('map-offline-banner');
  if(!b)return;
  b.classList.toggle('show',!navigator.onLine);
}
// fchip + pSearch listeners moved to DOMContentLoaded

// ════ JOURNAL ════
function fmtDate(d){if(!d)return'—';const[y,m,j]=d.split('-');return`${parseInt(j)} ${['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'][parseInt(m)-1]}`;}
function renderJournal(){
  // Remplir les selects de l'overlay saisie directe dès qu'on entre dans le Journal
  openJournalEntry._ready=false; // lazy — sera peuplé à l'ouverture
  // Chips ouvriers
  const orow=document.getElementById('ouvrier-chips-row');
  const membres=MEMBRES.filter(m=>m.statut!=='Inactif');
  orow.innerHTML=`<div class="ochip active" data-qui="tous" onclick="setJQui('tous',this)"><span>👥</span> Tous</div>`
    +membres.map(m=>`<div class="ochip" data-qui="${m.nom}" onclick="setJQui('${m.nom}',this)"><div class="oava" style="background:${m.couleur||'#888'}">${m.nom[0]}</div> ${m.nom}</div>`).join('');
  // Chips tâches
  const trow=document.getElementById('tache-chips-row');
  if(trow) trow.innerHTML=`<div class="tfchip active" data-t="toutes" onclick="setJTache('toutes',this)">Toutes</div>`
    +TACHES.map(t=>`<div class="tfchip" data-t="${t.nom}" onclick="setJTache('${t.nom}',this)">${TEMOJI[t.nom]||''} ${t.nom}</div>`).join('');
  renderJournalList();
}
function setPTacheFilter(v,el){pShowDone=false;pCurStep=_pvSmartStep(v);
  pTacheFilter=v;
  document.querySelectorAll('.ptfchip').forEach(x=>x.classList.remove('active'));
  if(el)el.classList.add('active');
  renderParcelles();
}
function setJQui(v,el){jQui=v;_jPage=0;document.querySelectorAll('.ochip').forEach(x=>x.classList.remove('active'));el.classList.add('active');renderJournalList();}
function setJTache(v,el){jTache=v;_jPage=0;document.querySelectorAll('.tfchip').forEach(x=>x.classList.remove('active'));el.classList.add('active');renderJournalList();}
function setJParcelle(v){jParcelle=v;_jPage=0;renderParcelleFilterChips();renderJournalList();}
function renderParcelleFilterChips(){
  const row=document.getElementById('j-parcelle-filter-row');
  if(!row)return;
  // Parcelles présentes dans le journal (triées alphabétiquement)
  const parcelles=[...new Set(JOURNAL.filter(j=>!j.meteo).map(j=>j.parcelle))].sort();
  if(parcelles.length===0){row.style.display='none';return;}
  row.style.display='flex';
  row.innerHTML=`<div class="tfchip ${jParcelle==='toutes'?'active':''}" onclick="setJParcelle('toutes')">📍 Toutes</div>`
    +parcelles.map(p=>`<div class="tfchip ${jParcelle===p?'active':''}" onclick="setJParcelle('${p.replace(/'/g,"\\'")}')" style="white-space:nowrap">${p}</div>`).join('');
}
// ── Snapshot météo dans la fiche journal ──
function _renderMeteoSnapshot(s){
  var _fd=function(d){if(!d)return'';var p=d.split('-');var m=['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];return parseInt(p[2])+' '+m[parseInt(p[1])-1];};
  var periode='';
  if(s.date_debut&&s.date_fin&&s.date_debut!==s.date_fin){
    periode='<span class="jms-periode">'+_fd(s.date_debut)+' → '+_fd(s.date_fin)+'</span>';
  }
  var precipStr=s.precip_tot>0?' · 🌧 '+s.precip_tot+'mm':'';
  var joursStr=s.nb_jours>1?' · '+s.nb_jours+' j':'';
  return '<div class="jcard-meteo-snap">'+periode+(s.emoji||'🌤')+' '
    +(s.temp_moy!==undefined?s.temp_moy+'°C moy':'—')
    +' · ↑'+s.temp_max+'° ↓'+s.temp_min+'°'
    +' · 💨 '+s.vent_moy+'km/h'
    +precipStr+joursStr+'</div>';
}

function renderJournalList(){
  if(!window._dataReady){ var _skj=document.getElementById('timeline'); if(_skj)_skj.innerHTML=window._mvSk('journal'); return; }
  // Rafraîchir les chips de parcelle à chaque rendu
  renderParcelleFilterChips();
  let data=JOURNAL.filter(r=>{
    if(jQui!=='tous'&&r.qui!==jQui)return false;
    if(jTache!=='toutes'&&r.tache!==jTache)return false;
    if(jParcelle!=='toutes'&&r.parcelle!==jParcelle&&!r.meteo)return false;
    if(r.meteo&&jParcelle!=='toutes')return false;
    if(jDateDeb&&r.date<jDateDeb)return false;
    if(jDateFin&&r.date>jDateFin)return false;
    if(jSearch){if(r.meteo)return false;const q=jSearch.toLowerCase();if(!((r.parcelle||'').toLowerCase().includes(q)||(r.tache||'').toLowerCase().includes(q)||(r.qui||'').toLowerCase().includes(q)))return false;}
    return true;
  });
  // Stats sur données COMPLÈTES (avant pagination)
  const tot=data.filter(j=>!j.meteo).length;
  const val=data.filter(j=>j.statut==='Validé'&&!j.meteo).length;
  const enc=data.filter(j=>j.statut==='En cours'&&!j.meteo).length;
  // ── Pagination ──────────────────────────────────────────────────────────────
  const _J_PAGE_SIZE=200;
  const _hasMore=data.length>_J_PAGE_SIZE*(_jPage+1);
  const _remaining=data.length-_J_PAGE_SIZE*(_jPage+1);
  data=data.slice(0,_J_PAGE_SIZE*(_jPage+1));
  // ─────────────────────────────────────────────────────────────────────────
  document.getElementById('js-tot').textContent=tot;
  document.getElementById('js-val').textContent=val;
  document.getElementById('js-e').textContent=enc;
  document.getElementById('j-sub').textContent=`${tot} entrées · ${_visuSaison()}`;
  if(typeof _updateSaisonSelector==='function')_updateSaisonSelector();
  // Pill filtres actifs
  var _jFiltres=[];
  if(jQui!=='tous')_jFiltres.push(jQui);
  if(jTache!=='toutes')_jFiltres.push(jTache);
  if(jParcelle!=='toutes')_jFiltres.push(jParcelle);
  if(jDateDeb||jDateFin)_jFiltres.push('Dates');
  if(jSearch)_jFiltres.push('Recherche');
  var _pillEl=document.getElementById('j-filtres-pill');
  if(_pillEl){
    if(_jFiltres.length>0){
      _pillEl.style.display='inline-flex';
      _pillEl.innerHTML=`<div class="j-filtres-pill-dot"></div><span>${_jFiltres.length} filtre${_jFiltres.length>1?'s':''} actif${_jFiltres.length>1?'s':''} — ${_jFiltres.join(' · ')}</span><span class="j-filtres-pill-clear" onclick="clearAllJFiltres()">✕</span>`;
    } else {
      _pillEl.style.display='none';
    }
  }
  const grouped={};
  data.forEach(r=>{if(!grouped[r.date])grouped[r.date]=[];grouped[r.date].push(r);});
  const tl=document.getElementById('timeline');
  if(!data.length){
    const hasFilters=jQui!=='tous'||jTache!=='toutes'||jSearch||jParcelle!=='toutes'||jDateDeb||jDateFin;
    tl.innerHTML=hasFilters
      ?`<div class="empty-state"><div class="ei"><svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="14" stroke="var(--texte-doux)" stroke-width="2" fill="none"/><line x1="34" y1="34" x2="48" y2="48" stroke="var(--texte-doux)" stroke-width="2.5" stroke-linecap="round"/><line x1="18" y1="24" x2="30" y2="24" stroke="var(--texte-doux)" stroke-width="2" stroke-linecap="round" opacity="0.5"/></svg></div><div class="et">Aucun résultat</div><div class="ed">Aucune entrée ne correspond aux filtres actifs.</div><button class="empty-cta-or" onclick="clearAllJFiltres()">✕ Effacer les filtres</button></div>`
      :`<div class="empty-state"><div class="ei"><svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="6" width="40" height="46" rx="5" fill="none" stroke="var(--texte-doux)" stroke-width="1.8"/><rect x="16" y="18" width="24" height="2.5" rx="1.25" fill="var(--texte-doux)" opacity="0.3"/><rect x="16" y="24" width="17" height="2" rx="1" fill="var(--texte-doux)" opacity="0.2"/><rect x="16" y="30" width="21" height="2" rx="1" fill="var(--texte-doux)" opacity="0.2"/><circle cx="41" cy="41" r="9" fill="var(--fond)" stroke="var(--texte-doux)" stroke-width="1.8"/><line x1="41" y1="36.5" x2="41" y2="45.5" stroke="var(--texte-doux)" stroke-width="2" stroke-linecap="round"/><line x1="36.5" y1="41" x2="45.5" y2="41" stroke="var(--texte-doux)" stroke-width="2" stroke-linecap="round"/></svg></div><div class="et">Journal vide</div><div class="ed">Aucun travail enregistré pour cette saison. Les entrées apparaîtront ici au fil des journées.</div>${canWrite()?'<button class="empty-cta-v" onclick="openOv(\'ovJournalEntry\')">+ Ajouter un travail</button>':''}</div>`;
    return;
  }
  tl.innerHTML=Object.entries(grouped).map(([date,items])=>`
    <div class="dgroup">
      <div class="dhead"><div class="dline"></div><div class="dlabel">${fmtDate(date)}</div><div class="dcnt">${items.filter(r=>!r.meteo).length}</div><div class="dline"></div></div>
      ${items.map((r,i)=>{
        const hasNext=i<items.length-1;
        if(r.meteo)return `<div class="jitem"><div class="jdotcol"><div class="jdot jdm"></div>${hasNext?'<div class="jlinev"></div>':''}</div><div class="meteo-card" style="flex:1"><div class="mc-left"><div class="mc-title">Météo enregistrée</div><div class="mc-val">${r.emoji} ${r.temp}°C</div><div class="mc-detail">${r.desc} · Vent ${r.wind} km/h</div></div><div class="mc-icon">${r.emoji}</div></div></div>`;
        const isValide=r.statut==='Validé';
        const isInfo=r.statut==='Info';
        const sc=isValide?'jdv':isInfo?'jdm':'jde';
        const sb=isValide?'jsv':isInfo?'jsm':'jse';
        const barCls=isValide?'jcard-bar-v':isInfo?'jcard-bar-m':'jcard-bar-e';
        const badgeIcon=isValide?'✓':'…';
        const m=MEMBRES.find(x=>x.nom===r.qui);
        const col=m?.couleur||COULEURS_MBR[r.qui]||'#888';
        const isEq=r.equipe||r.qui==='Equipe';
        const membresStr=isEq&&r.membresEquipe&&r.membresEquipe.length>0?` + ${r.membresEquipe.join(', ')}`:isEq?' + équipe':'';
        const quiAff=isEq&&r.qui&&r.qui!=='Equipe'?`Équipe (${r.qui}${membresStr})`:isEq?'Équipe':r.qui||'Non assigné';
        const tacheAff=_escHtml(TABREV[r.tache]||r.tache);
        const repSuffix=(r.reparation_types&&r.reparation_types.length)?_escHtml(' · '+r.reparation_types.join(', ')+(r.reparation_qte?(' ×'+r.reparation_qte):'')):'';
        const quiAffE=_escHtml(quiAff);
        const parcelleE=_escHtml(r.parcelle);
        return `<div class="jitem"><div class="jdotcol"><div class="jdot ${sc}"></div>${hasNext?'<div class="jlinev"></div>':''}</div><div class="jcard"><div class="jcard-bar ${barCls}"></div><div class="jcard-col"><div class="jcard-inner"><div style="flex:1;min-width:0"><div class="jtache">${TEMOJI[r.tache]||'📋'} ${tacheAff}${repSuffix}</div><div class="jmeta"><div class="java" style="background:${col}">${_escHtml((r.qui||'?')[0])}</div><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${quiAffE}</span>${isEq?'<span class="eq-tag">👥</span>':''}<span style="color:var(--gris-clair)">·</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">📍 ${parcelleE}</span></div></div><div class="jst ${sb}">${badgeIcon} ${r.statut}</div></div>${r.meteo_snapshot?_renderMeteoSnapshot(r.meteo_snapshot):''}</div></div></div>`;
      }).join('')}
    </div>`).join('');
  // ── Bouton "Charger plus" ──────────────────────────────────────────────────
  if(_hasMore){
    var _btnMore=document.createElement('button');
    _btnMore.className='j-load-more-btn';
    _btnMore.onclick=function(){_jPage++;renderJournalList();};
    _btnMore.innerHTML='<span>📋</span> Voir '+_remaining+' entrée'+(_remaining>1?'s':'')+' de plus';
    tl.appendChild(_btnMore);
  }
}
// jSearch listener moved to DOMContentLoaded

// ── [Tracteur extrait] ─────────────────────────────────────────────────────
// ════ OVERLAYS ════
/* ══════════════ A11Y-2 — accessibilite centralisee des overlays ══════════════
   POINT UNIQUE : _mvOvSync() reconcilie tout l'etat a11y a partir du DOM
   (role/aria-modal/aria-labelledby, focus-trap, verrou de scroll, focus restaure).
   Il est appele par openOv/closeOv ET par un MutationObserver, parce qu'une quinzaine
   d'endroits d'app.js + les autres modules (planning.js closePlanDayModal,
   cave.js _vendSheetClose, tracteur.js...) ferment leurs overlays par un
   classList.remove('open') direct sans passer par closeOv : sans ce reconciliateur
   l'inert et le verrou de scroll resteraient colles apres fermeture.
   DOM (verifie) : 68 overlays sont DANS #app-root (enfants de #app-content-wrap) et 8
   sont enfants de <body> -> un inert pose sur #app-root rendrait les overlays eux-memes
   inertes. On inerte donc les FRERES le long de la chaine d'ancetres de l'overlay du
   dessus : couvre les deux niveaux et les overlays empiles, quelle que soit la
   profondeur, sans toucher au z-index dynamique (base 600) ni aux bottom-sheets.
   ECHAP = clic simule sur le fond : declenche le onclick/listener reel de l'overlay
   (closeOv, closePlanDayModal, closeOvDanger, _vendSheetClose...) donc le nettoyage
   d'etat propre a chaque module est preserve, et un overlay non fermable au fond
   resterait non fermable. Strictement symetrique du clic sur le fond. */
var _MV_INERT_OK = (typeof HTMLElement !== 'undefined') && ('inert' in HTMLElement.prototype);
var _MV_FOCUS_SEL = 'a[href],area[href],button,input,select,textarea,iframe,object,embed,summary,[tabindex],[contenteditable="true"],audio[controls],video[controls]';
var _mvOvStack = [];      // [{el,trigger}] overlays ouverts, du plus ancien au plus recent
var _mvOvTrigPend = null; // declencheur capture par openOv AVANT l'ajout de .open
var _mvOvScrollY = 0;
var _mvOvLockPage = '';
var _mvOvUid = 0;
var _mvOvBusy = false;

function _mvOvIdx(el){ for(var i=0;i<_mvOvStack.length;i++){ if(_mvOvStack[i].el===el) return i; } return -1; }

function _mvOvVisible(el){ return !!(el.offsetWidth||el.offsetHeight||el.getClientRects().length); }

function _mvOvFocusables(root){
  var out=[]; if(!root) return out;
  var l=root.querySelectorAll(_MV_FOCUS_SEL);
  for(var i=0;i<l.length;i++){
    var el=l[i];
    if(el.disabled) continue;
    if(el.type==='hidden') continue;
    if(el.getAttribute('tabindex')==='-1') continue;
    if(el.getAttribute('aria-hidden')==='true') continue;
    if(el.closest('[inert]')) continue;
    if(!_mvOvVisible(el)) continue;
    out.push(el);
  }
  return out;
}

/* inert : data-mv-inert = notre marque, pour ne jamais retirer un inert pose par autrui. */
function _mvInertClear(){
  var l=document.querySelectorAll('[data-mv-inert]');
  for(var i=0;i<l.length;i++){ l[i].removeAttribute('inert'); l[i].removeAttribute('data-mv-inert'); }
}
function _mvInertOutside(el){
  var node=el, guard=0;
  while(node && node.parentElement && node!==document.body && guard++<40){
    var kids=node.parentElement.children;
    for(var i=0;i<kids.length;i++){
      var k=kids[i], tg=k.tagName;
      if(k===node || k.hasAttribute('inert')) continue;
      if(tg==='SCRIPT'||tg==='STYLE'||tg==='LINK'||tg==='TEMPLATE'||tg==='NOSCRIPT') continue;
      k.setAttribute('inert','');
      k.setAttribute('data-mv-inert','');
    }
    node=node.parentElement;
  }
}

/* Verrou du scroll de fond (classe posee sur <html> ET <body> : le scroller est le
   document). overflow:hidden conserve l'offset dans les moteurs modernes ; le filet de
   restauration ne joue QUE si le moteur l'a remis a 0 et que la page n'a pas change
   entre-temps (sinon on ecraserait le scrollTo(0,0) legitime de goTo). */
function _mvScrollLock(on){
  var de=document.documentElement, b=document.body;
  if(!b) return;
  if(on){
    if(b.classList.contains('mv-ov-lock')) return;
    _mvOvScrollY = window.scrollY || de.scrollTop || 0;
    _mvOvLockPage = (document.querySelector('.page.active')||{}).id || '';
    de.classList.add('mv-ov-lock'); b.classList.add('mv-ov-lock');
  }else{
    if(!b.classList.contains('mv-ov-lock')) return;
    de.classList.remove('mv-ov-lock'); b.classList.remove('mv-ov-lock');
    var pg=(document.querySelector('.page.active')||{}).id || '';
    if(_mvOvScrollY>0 && !window.scrollY && pg===_mvOvLockPage){ try{ window.scrollTo(0,_mvOvScrollY); }catch(e){} }
    _mvOvScrollY=0;
  }
}

/* role/aria : poses sur l'overlay ouvert ; aria-labelledby branche sur .modal-title
   (id stable -> le titre peut etre reecrit apres coup, l'annonce suit). */
function _mvOvDress(ov){
  ov.setAttribute('role','dialog');
  ov.setAttribute('aria-modal','true');
  ov.setAttribute('data-mv-dlg','');
  var t=ov.querySelector('.modal-title');
  if(t){
    if(!t.id) t.id='mv-ovt-'+(ov.id||('x'+(++_mvOvUid)));
    ov.setAttribute('aria-labelledby',t.id);
  }else if(!ov.getAttribute('aria-label') && !ov.getAttribute('aria-labelledby')){
    ov.setAttribute('aria-label','Fenêtre');
  }
}
function _mvOvUndress(ov){ ov.removeAttribute('aria-modal'); ov.removeAttribute('data-mv-dlg'); }

function _mvOvRefocus(el){
  if(!el || !el.isConnected) return false;
  try{
    if(el.closest('[inert]')) return false;
    if(!_mvOvVisible(el)) return false;
    el.focus({preventScroll:true});
    return document.activeElement===el;
  }catch(e){ return false; }
}
/* On donne le focus au CONTENEUR (tabindex -1), pas au 1er champ : VoiceOver annonce le
   dialogue et le clavier iOS ne surgit pas a chaque ouverture. Tab enchaine ensuite sur
   le 1er controle. Les .focus() differes existants (ovDanger...) passent apres et gagnent. */
function _mvOvFocusIn(ov){
  var box=ov.querySelector('.modal')||ov;
  if(!box.getAttribute('tabindex')) box.setAttribute('tabindex','-1');
  try{ box.focus({preventScroll:true}); }catch(e){ try{ box.focus(); }catch(e2){} }
}

function _mvOvSync(){
  if(_mvOvBusy) return;
  _mvOvBusy=true;
  try{
    var nl=document.querySelectorAll('.overlay.open'), open=[];
    for(var i=0;i<nl.length;i++) open.push(nl[i]);
    // 1) depiler ce qui s'est ferme (closeOv, _mvBack, ou remove('open') direct d'un module)
    var restore=null;
    for(var k=_mvOvStack.length-1;k>=0;k--){
      if(open.indexOf(_mvOvStack[k].el)<0){
        _mvOvUndress(_mvOvStack[k].el);
        restore=_mvOvStack[k].trigger||restore; // le plus ancien depile gagne
        _mvOvStack.splice(k,1);
      }
    }
    // 2) empiler les nouveaux
    for(var j=0;j<open.length;j++){
      if(_mvOvIdx(open[j])<0){
        var tr=_mvOvTrigPend||document.activeElement;
        if(!tr||tr===document.body||tr===document.documentElement) tr=null;
        _mvOvStack.push({el:open[j],trigger:tr});
        _mvOvTrigPend=null;
      }
    }
    _mvOvTrigPend=null;
    // 3) etat a11y, entierement derive du DOM
    var top=_mvTopOverlay();
    _mvInertClear();
    var dl=document.querySelectorAll('.overlay[data-mv-dlg]');
    for(var d=0;d<dl.length;d++){ if(dl[d]!==top) _mvOvUndress(dl[d]); }
    if(top){ _mvOvDress(top); _mvInertOutside(top); _mvScrollLock(true); }
    else { _mvScrollLock(false); }
    // 4) focus : declencheur d'abord (fermeture), sinon on entre dans le dialogue du dessus
    if(restore && (!top || top.contains(restore)) && _mvOvRefocus(restore)) return;
    if(top && !top.contains(document.activeElement)) _mvOvFocusIn(top);
  } finally { _mvOvBusy=false; }
}

function openOv(id){
  var el=document.getElementById(id);if(!el)return;
  var base=600,max=base-1;
  document.querySelectorAll('.overlay.open').forEach(function(o){if(o===el)return;var z=parseInt(o.style.zIndex,10)||base;if(z>max)max=z;});
  var a=document.activeElement;
  _mvOvTrigPend=(a&&a!==document.body&&a!==document.documentElement)?a:null;
  el.classList.add('open');el.style.zIndex=(max+1);
  _mvHistPush();
  _mvOvSync();
}
function closeOv(e,id){
  if(!e||e.target===document.getElementById(id)){
    var el=document.getElementById(id);
    if(el){el.classList.remove('open');el.style.zIndex='';}
    _mvOvSync();
    if(window._swUpdatePending&&!document.querySelector('.overlay.open')){window._swUpdatePending=false;window.location.reload();}
  }
}

/* Echap : clic simule sur le fond de l'overlay du dessus. On ne touche pas a l'historique
   (_mvBack consomme toujours et n'a jamais laisse quitter l'app : l'entree poussee par
   openOv reste sans effet observable, alors qu'un history.back() sauterait le nettoyage
   d'etat des fermetures custom type closePlanDayModal). */
function _mvOvDismissTop(){
  var top=_mvTopOverlay(); if(!top) return false;
  try{ top.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window})); }
  catch(err){ top.classList.remove('open'); top.style.zIndex=''; }
  _mvOvSync();
  return true;
}
function _mvOvKey(e){
  if(!e) return;
  if(e.key==='Escape'||e.key==='Esc'){
    if(e.defaultPrevented||e.isComposing) return;
    if(!_mvTopOverlay()) return;
    e.preventDefault();
    _mvOvDismissTop();
    return;
  }
  if(e.key==='Tab' && !_MV_INERT_OK){ // repli navigateurs sans inert : boucle Tab manuelle
    var top=_mvTopOverlay(); if(!top) return;
    var f=_mvOvFocusables(top);
    if(!f.length){ e.preventDefault(); _mvOvFocusIn(top); return; }
    var first=f[0], last=f[f.length-1], cur=document.activeElement;
    if(!top.contains(cur)){ e.preventDefault(); (e.shiftKey?last:first).focus(); return; }
    if(e.shiftKey && cur===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && cur===last){ e.preventDefault(); first.focus(); }
  }
}
document.addEventListener('keydown',_mvOvKey);

/* Filet : couvre les ouvertures/fermetures directes par classList qui ne passent pas par
   openOv/closeOv. Cout : un classList.contains par mutation de classe. _mvScrollLock
   touche html/body (pas .overlay) -> aucune boucle. */
try{
  new MutationObserver(function(muts){
    for(var i=0;i<muts.length;i++){
      var t=muts[i].target;
      if(t&&t.classList&&t.classList.contains('overlay')){ _mvOvSync(); return; }
    }
  }).observe(document.documentElement,{attributes:true,attributeFilter:['class'],subtree:true});
}catch(e){}
window._mvOvSync=_mvOvSync; window._mvOvDismissTop=_mvOvDismissTop;
function pickVal(el,hid,cls){el.parentElement.querySelectorAll('.pchk').forEach(x=>{x.classList.remove('sel','vert','acre','phyt');});el.classList.add('sel',cls);document.getElementById(hid).value=el.dataset.val;}





// ════ MODULE CHAT ════


// ════════════════════════════════════
// MODULE CHAT
// ════════════════════════════════════

var _chatCanal = 'general';
var _chatDMTarget = null;
var _chatUnsub = null;
var _chatDMUnsub = null;

var CHAT_CANAUX = {
  general:  {ico:'#',  label:'Général',  desc:'Discussion générale du domaine'},
  travaux:  {ico:'🌿', label:'Travaux',  desc:'Suivi des travaux en cours'},
  tracteur: {ico:'🚜', label:'Tracteur', desc:'Passages et sessions tracteur'},
  phyto:    {ico:'🧪', label:'Phyto',    desc:'Traitements phytosanitaires'},
  meteo:    {ico:'🌤', label:'Météo',    desc:'Alertes météo et gel'}
};

function _chatDoc(canal){
  return db.collection('mavigne').doc('chat_canal_' + canal);
}
function _dmDoc(a, b){
  var k = [a, b].sort().join('__');
  return db.collection('mavigne').doc('chat_dm_' + k);
}

// ── Init : peupler la liste des membres DM ──
function chatInit(){
  if(!currentUser) return;
  var dl = document.getElementById('chat-dm-list');
  if(!dl) return;
  dl.innerHTML = MEMBRES
    .filter(function(m){ return m.nom !== currentUser.nom; })
    .map(function(m){
      var bg = COULEURS_MBR[m.nom] || '#3D6B27';
      return '<div class="chat-dm" onclick="chatOpenDM(this,\'' + m.nom + '\')">' +
        '<div class="chat-dm-ava" style="background:' + bg + '">' +
          m.nom.charAt(0).toUpperCase() +
          '<div class="chat-dm-status"></div>' +
        '</div>' +
        '<span class="chat-canal-badge" id="dmbadge-' + m.nom + '" style="display:none">!</span>' +
      '</div>';
    }).join('');
}

// ── Chargement des messages via .get() (fiable) ──
function chatLoad(){
  var area = document.getElementById('chat-msgs-area');
  if(!area) return;
  area.innerHTML = '<div class="chat-system">⏳ Chargement…</div>';

  // Détacher les anciens listeners
  if(_chatUnsub){ _chatUnsub(); _chatUnsub = null; }
  if(_chatDMUnsub){ _chatDMUnsub(); _chatDMUnsub = null; }

  if(_chatDMTarget){
    // ── DM ──
    var dmRef = _dmDoc(currentUser.nom, _chatDMTarget);
    dmRef.get().then(function(snap){
      var msgs = (snap.exists && snap.data() && snap.data().msgs) ? snap.data().msgs : [];
      chatRenderMsgs(msgs, area);
    }).catch(function(e){
      area.innerHTML = '<div class="chat-system">⚠️ Erreur : ' + e.code + '</div>';
    });
    // Listener temps réel
    _chatDMUnsub = dmRef.onSnapshot(function(snap){
      var msgs = (snap.exists && snap.data() && snap.data().msgs) ? snap.data().msgs : [];
      chatRenderMsgs(msgs, area);
      // Masquer badge
      var badge = document.getElementById('dmbadge-' + _chatDMTarget);
      if(badge) badge.style.display = 'none';
      chatCheckNavDot();
    }, function(e){ console.warn('[Chat DM]', e.code); });

  } else {
    // ── Canal ──
    var cRef = _chatDoc(_chatCanal);
    cRef.get().then(function(snap){
      var msgs = (snap.exists && snap.data() && snap.data().msgs) ? snap.data().msgs : [];
      chatRenderMsgs(msgs, area);
    }).catch(function(e){
      area.innerHTML = '<div class="chat-system">⚠️ Erreur : ' + e.code + '</div>';
    });
    // Listener temps réel
    _chatUnsub = cRef.onSnapshot(function(snap){
      var msgs = (snap.exists && snap.data() && snap.data().msgs) ? snap.data().msgs : [];
      chatRenderMsgs(msgs, area);
      var badge = document.getElementById('cbadge-' + _chatCanal);
      if(badge) badge.style.display = 'none';
      chatCheckNavDot();
    }, function(e){ console.warn('[Chat canal]', e.code); });
  }
}

// ── Afficher la topbar selon le contexte ──
function chatUpdateTopbar(){
  var ico  = document.getElementById('chat-topbar-ico');
  var name = document.getElementById('chat-topbar-name');
  var desc = document.getElementById('chat-topbar-desc');
  var ta   = document.getElementById('chat-ta');
  if(_chatDMTarget){
    var bg = COULEURS_MBR[_chatDMTarget] || '#3D6B27';
    if(ico) ico.innerHTML = '<span style="width:22px;height:22px;border-radius:50%;background:'+bg+';display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:white">'+_chatDMTarget.charAt(0)+'</span>';
    if(name) name.textContent = _chatDMTarget;
    if(desc) desc.textContent = 'Message privé';
    if(ta) ta.placeholder = 'Message à ' + _chatDMTarget + '…';
  } else {
    var cfg = CHAT_CANAUX[_chatCanal] || {ico:'#', label:_chatCanal, desc:''};
    if(ico) ico.textContent = cfg.ico;
    if(name) name.textContent = cfg.label;
    if(desc) desc.textContent = cfg.desc;
    if(ta) ta.placeholder = 'Message #' + cfg.label + '…';
  }
}

// ── Rendu des messages ──
function chatRenderMsgs(msgs, area){
  if(!area) return;
  if(!msgs || !msgs.length){
    area.innerHTML = '<div class="chat-empty">Aucun message — soyez le premier à écrire !</div>';
    return;
  }
  var html = '';
  var lastDate = '';
  msgs.forEach(function(msg){
    var d = new Date(msg.ts);
    var dateStr = d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
    if(dateStr !== lastDate){
      html += '<div class="chat-date-sep"><span>' + dateStr + '</span></div>';
      lastDate = dateStr;
    }
    var isMine = currentUser && msg.auteur === currentUser.nom;
    var bg = COULEURS_MBR[msg.auteur] || '#3D6B27';
    var hhmm = d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
    html += '<div class="chat-msg' + (isMine ? ' mine' : '') + '">';
    if(!isMine){
      html += '<div class="chat-msg-ava" style="background:' + bg + '">' + msg.auteur.charAt(0) + '</div>';
    }
    html += '<div class="chat-msg-body">';
    html += '<div class="chat-msg-meta">';
    if(!isMine) html += '<span class="chat-msg-author" style="color:' + bg + '">' + msg.auteur + '</span>';
    html += '<span class="chat-msg-time">' + hhmm + '</span>';
    html += '</div>';
    html += '<div class="chat-bubble">' + _chatEscapeHtml(msg.txt) + '</div>';
    html += '</div></div>';
  });
  area.innerHTML = html;
  area.scrollTop = area.scrollHeight;
}

function _chatEscapeHtml(txt){
  return String(txt)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}

// ── Switcher canal ──
function chatSwitch(el, canal){
  _chatCanal = canal;
  _chatDMTarget = null;
  document.querySelectorAll('.chat-canal,.chat-dm').forEach(function(x){ x.classList.remove('actif'); });
  el.classList.add('actif');
  chatUpdateTopbar();
  chatLoad();
}

// ── Ouvrir DM ──
function chatOpenDM(el, nom){
  _chatDMTarget = nom;
  _chatCanal = null;
  document.querySelectorAll('.chat-canal,.chat-dm').forEach(function(x){ x.classList.remove('actif'); });
  el.classList.add('actif');
  chatUpdateTopbar();
  chatLoad();
}

// ── Envoi message ──
async function chatSend(){
  if(isSaisonnier()){ showToast('🔒 Lecture seule · envoi impossible','#C0392B'); return; }
  var ta = document.getElementById('chat-ta');
  var txt = ta.value.trim();
  if(!txt) return;
  var msg = {auteur: currentUser.nom, txt: txt, ts: Date.now()};
  ta.value = '';
  ta.style.height = 'auto';
  try{
    if(_chatDMTarget){
      var dmRef = _dmDoc(currentUser.nom, _chatDMTarget);
      var snap = await dmRef.get();
      var msgs = (snap.exists && snap.data().msgs) ? snap.data().msgs : [];
      msgs.push(msg);
      if(msgs.length > 200) msgs = msgs.slice(msgs.length - 200);
      await dmRef.set({msgs: msgs, updatedAt: Date.now()});
    } else {
      var cRef = _chatDoc(_chatCanal);
      var snap2 = await cRef.get();
      var msgs2 = (snap2.exists && snap2.data().msgs) ? snap2.data().msgs : [];
      msgs2.push(msg);
      if(msgs2.length > 200) msgs2 = msgs2.slice(msgs2.length - 200);
      await cRef.set({msgs: msgs2, updatedAt: Date.now()});
    }
  } catch(e){
    console.error('[Chat] Envoi échoué', e);
    showSyncBadge('⚠️ Message non envoyé', '#B85A1A');
  }
}

// ── Helpers textarea ──
function chatAutoResize(el){
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 90) + 'px';
}
function chatHandleKey(e){
  if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); chatSend(); }
}

// ── Badge notification nav ──
function chatCheckNavDot(){
  var hasNew = false;
  Object.keys(CHAT_CANAUX).forEach(function(c){
    var b = document.getElementById('cbadge-' + c);
    if(b && b.style.display !== 'none') hasNew = true;
  });
  if(currentUser){
    MEMBRES.filter(function(m){ return m.nom !== currentUser.nom; }).forEach(function(m){
      var b = document.getElementById('dmbadge-' + m.nom);
      if(b && b.style.display !== 'none') hasNew = true;
    });
  }
  // pastille nav supprimée avec la nav-bar (v4.28) — badges canaux/DM gérés dans la page chat
}

// ── Appelé au goTo('chat') ──
function chatRender(){
  chatInit();
  chatUpdateTopbar();
  chatLoad();
}

// ── Effacer recherche Parcelles ──
function clearPSearch(){
  pSearch='';
  document.getElementById('pSearch').value='';
  document.getElementById('pSearch-clear').style.display='none';
  renderParcelles();
}
// ── Effacer recherche Journal ──
function clearJSearch(){
  jSearch='';
  document.getElementById('jSearch').value='';
  document.getElementById('jSearch-clear').style.display='none';
  renderJournalList();
}

// ── Toast confirmation pill ──


// ════ DOMAINE_NOM ════
var _confirmDelCb=null;
function openConfirmDel(title,sub,cb,icon,btnLabel,btnColor){
  _confirmDelCb=cb||null;
  document.getElementById('ocd-icon').textContent=icon||'⚠️';
  document.getElementById('ocd-title').textContent=title||'Confirmer ?';
  document.getElementById('ocd-sub').textContent=sub||'';
  var _ocdBtn=document.getElementById('ocd-btn');
  _ocdBtn.textContent=btnLabel||'Supprimer';
  _ocdBtn.style.background=btnColor||'#C0392B';
  openOv('ovConfirmDel');
}
function _execConfirmDel(){
  closeOv(null,'ovConfirmDel');
  if(typeof _confirmDelCb==='function'){
    if(navigator.vibrate)navigator.vibrate([60,40,60]);
    setTimeout(function(){_confirmDelCb();_confirmDelCb=null;},120);
  }
}

// ── Saisie d'une valeur — remplace prompt(), qui est BLOQUANT en PWA iOS ──
// prompt() n'y affiche RIEN : l'utilisateur reste coince sans aucun retour.
// Contrat identique a prompt() : le callback n'est appele QUE si l'on valide ;
// annuler (ou fermer l'overlay) ne rappelle jamais rien.
// Options : {titre, sub, valeur, unite, icone, btnLabel, type:'texte'|'nombre', placeholder, cb}
var _mvPromptCb=null;
function openPrompt(o){
  o=o||{};
  var g=function(id){return document.getElementById(id);};
  var el=g('mvp-input');
  if(!el){ showToast('Saisie indisponible','#C0392B'); return; }
  _mvPromptCb=(typeof o.cb==='function')?o.cb:null;
  g('mvp-icon').textContent  = o.icone||'\u270F\uFE0F';
  g('mvp-title').textContent = o.titre||'Saisir une valeur';
  g('mvp-sub').textContent   = o.sub||'';
  g('mvp-unit').textContent  = o.unite||'';
  g('mvp-btn').textContent   = o.btnLabel||'Enregistrer';
  el.setAttribute('inputmode',(o.type==='texte')?'text':'decimal');
  el.placeholder = o.placeholder||'';
  // iOS : la valeur DOIT etre assignee en JS, jamais portee par un attribut HTML.
  el.value = (o.valeur==null)?'':String(o.valeur);
  openOv('ovPrompt');
  setTimeout(function(){ if(el.focus)el.focus(); if(el.select)el.select(); },160);
}
function _execPrompt(){
  var el=document.getElementById('mvp-input');
  var v=el?String(el.value):'';
  var cb=_mvPromptCb; _mvPromptCb=null;
  closeOv(null,'ovPrompt');
  if(typeof cb==='function') setTimeout(function(){ cb(v); },80);
}
window.openPrompt  = openPrompt;
window._execPrompt = _execPrompt;

// ── Mise à jour dots card accueil ──
function updateHomeDots(){
  var dots=document.querySelectorAll('.hv2-card-dot');
  dots.forEach(function(d,i){
    d.classList.toggle('active',i===homeCardMode);
  });
}

// ── Filtre dates Journal ──
function applyJDateFilter(){
  jDateDeb=document.getElementById('jDateDeb').value||'';
  jDateFin=document.getElementById('jDateFin').value||'';
  _jPage=0;
  var clr=document.getElementById('jDateClear');
  if(clr)clr.style.display=(jDateDeb||jDateFin)?'inline':'none';
  renderJournalList();
}
function clearJDateFilter(){
  jDateDeb='';jDateFin='';
  _jPage=0;
  var dd=document.getElementById('jDateDeb');var df=document.getElementById('jDateFin');
  if(dd)dd.value='';if(df)df.value='';
  var clr=document.getElementById('jDateClear');
  if(clr)clr.style.display='none';
  renderJournalList();
}
function clearAllJFiltres(){
  jQui='tous';jTache='toutes';jParcelle='toutes';jSearch='';jDateDeb='';jDateFin='';_jPage=0;
  var dd=document.getElementById('jDateDeb');var df=document.getElementById('jDateFin');
  if(dd)dd.value='';if(df)df.value='';
  var clr=document.getElementById('jDateClear');if(clr)clr.style.display='none';
  var js=document.getElementById('jSearch');if(js)js.value='';
  var jsc=document.getElementById('jSearch-clear');if(jsc)jsc.style.display='none';
  document.querySelectorAll('.ochip').forEach(x=>x.classList.remove('active'));
  var oc=document.querySelector('.ochip[data-qui="tous"]');if(oc)oc.classList.add('active');
  document.querySelectorAll('.tfchip').forEach(x=>x.classList.remove('active'));
  var tc=document.querySelector('.tfchip[data-t="toutes"]');if(tc)tc.classList.add('active');
  renderParcelleFilterChips();renderJournalList();
}

// ════ EXPORT PDF ENTRETIEN ════
function ouvrirExportEntretien(){
  var annees=new Set();
  ENTRETIENS.forEach(function(e){if(e.date)annees.add(e.date.slice(0,4));});
  Object.values(REPARATEUR).forEach(function(r){if(r&&r.depuis)annees.add(r.depuis.slice(0,4));});
  var anArr=[...annees].sort(function(a,b){return b-a;});
  if(!anArr.length)anArr=[new Date().getFullYear().toString()];
  var anneeEl=document.getElementById('exp-ent-annee');
  if(anneeEl){anneeEl.innerHTML=anArr.map(function(a){return '<option value="'+a+'">'+a+'</option>';}).join('');}
  var listEl=document.getElementById('exp-ent-trac-list');
  if(listEl){
    listEl.innerHTML=TRACTEURS_LIST.map(function(t){
      var col=couleurTracType(t.type);
      return '<label style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--gris-clair);cursor:pointer;min-height:44px">'
        +'<input type="checkbox" class="exp-ent-trac-cb" value="'+t.id+'" onchange="_updateExportSummary()" checked style="width:18px;height:18px;accent-color:'+col+';cursor:pointer">'
        +'<div><div style="font-weight:600;font-size:13px">'+_escHtml(t.nom)+(t.traitementOnly?' <span style="font-size:9px;background:var(--orange-pale);color:var(--orange);border-radius:4px;padding:1px 5px">Traitement</span>':'')+'</div>'
        +'<div style="font-size:11px;color:'+col+'">🔩 '+_escHtml(t.modele||'—')+' · '+_escHtml(t.type)+'</div></div>'
      +'</label>';
    }).join('');
  }
  _updateExportSummary();
  openOv('ovExportEntretien');
}
function _updateExportSummary(){
  var annee=(document.getElementById('exp-ent-annee')||{}).value||new Date().getFullYear().toString();
  var selIds=[];
  document.querySelectorAll('.exp-ent-trac-cb:checked').forEach(function(cb){selIds.push(cb.value);});
  var nbF=ENTRETIENS.filter(function(e){return selIds.includes(e.tracteurId)&&e.date&&e.date.startsWith(annee);}).length;
  var nbR=Object.entries(REPARATEUR).filter(function(kv){return selIds.includes(kv[0])&&kv[1]&&kv[1].depuis&&kv[1].depuis.startsWith(annee);}).length;
  var sumEl=document.getElementById('exp-ent-summary');
  if(sumEl)sumEl.textContent=nbF+' fiche'+(nbF!==1?'s':'')+' · '+nbR+' répar. · '+selIds.length+' tracteur'+(selIds.length!==1?'s':'');
}
function lancerExportEntretienPDF(){
  var annee=(document.getElementById('exp-ent-annee')||{}).value||new Date().getFullYear().toString();
  var selIds=[];
  document.querySelectorAll('.exp-ent-trac-cb:checked').forEach(function(cb){selIds.push(cb.value);});
  if(!selIds.length){showToast('Sélectionnez au moins un tracteur','#C0392B');return;}
  var tracteursSelectionnes=TRACTEURS_LIST.filter(function(t){return selIds.includes(t.id);});
  var fmtD=function(iso){if(!iso)return'—';var p=iso.split('-');var mois=['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];return parseInt(p[2])+' '+mois[parseInt(p[1])-1]+' '+p[0];};
  var champs=[{key:'plein',label:'Plein fait',icon:'⛽'},{key:'huile',label:'Niveau huile',icon:'🛢️'},{key:'filtre_air',label:'Filtre à air',icon:'💨'},{key:'radiateur',label:'Radiateur',icon:'🌀'},{key:'pression_pneu',label:'Pression pneus',icon:'🔵'},{key:'lavage',label:'Lavage',icon:'🪣'}];
  var sectionsHTML=tracteursSelectionnes.map(function(t){
    var fiches=ENTRETIENS.filter(function(e){return e.tracteurId===t.id&&e.date&&e.date.startsWith(annee);}).sort(function(a,b){return b.date.localeCompare(a.date);});
    var rep=REPARATEUR[t.id];
    var repsAll=[];
    if(rep&&rep.depuis&&rep.depuis.startsWith(annee))repsAll.push(rep);
    var nbAno=fiches.filter(function(f){return f.anomalie;}).length;
    var moyScore=fiches.length?Math.round(fiches.reduce(function(s,f){return s+champs.filter(function(c){return f[c.key];}).length;},0)/fiches.length*100/6):0;
    var resumeHTML='<div class="resume-bar" aria-hidden="true"><div class="resume-item"><span class="resume-val">'+fiches.length+'</span><span class="resume-lbl">Fiches</span></div><div class="resume-item"><span class="resume-val '+(nbAno>0?'val-warn':'')+'">'+nbAno+'</span><span class="resume-lbl">Anomalies</span></div><div class="resume-item"><span class="resume-val">'+repsAll.length+'</span><span class="resume-lbl">Répar.</span></div><div class="resume-item"><span class="resume-val">'+moyScore+'%</span><span class="resume-lbl">Moy. contrôle</span></div></div>';
    var fichesHTML=!fiches.length?'<p class="empty">Aucune fiche pour '+annee+'.</p>':fiches.map(function(f){
      var nb=champs.filter(function(c){return f[c.key];}).length;
      var checkHtml=champs.map(function(c){return '<div class="check-item '+(f[c.key]?'ok':'ko')+'">'+c.icon+' '+c.label+' <span>'+(f[c.key]?'✓':'✗')+'</span></div>';}).join('');
      var actDef=ACTIVITES.find(function(a){return a.nom===f.activite;});
      var defTracNom=actDef?((TRACTEURS_LIST.find(function(x){return x.id===actDef.tracteurDefautId;}))||{}).nom||'—':'—';
      var tracNom=((TRACTEURS_LIST.find(function(x){return x.id===f.tracteurId;}))||{}).nom||'';
      var overrideInfo=f.tracteurOverride?'<div style="background:#FEF3E2;border-left:3px solid #E07B2A;padding:5px 10px;font-size:10px;color:#935116;margin-top:4px">✱ Tracteur utilisé : '+_escHtml(tracNom)+' (défaut : '+_escHtml(defTracNom)+')</div>':'';
      return '<div class="fiche-bloc'+(f.anomalie?' has-anomalie':'')+'"><div class="fiche-header"><div><div class="fiche-date">📅 '+fmtD(f.date)+'</div><div class="fiche-meta">👤 '+_escHtml(f.conducteur)+(f.activite?' · 🚜 '+_escHtml(f.activite):'')+(tracNom&&!f.tracteurOverride?' · '+_escHtml(tracNom):'')+'</div></div><div class="fiche-score '+(nb===6?'score-ok':'score-warn')+'">'+nb+'/6</div></div><div class="check-grid">'+checkHtml+'</div>'+(f.anomalie?'<div class="anomalie">⚠️ Anomalie : '+_escHtml(f.anomalie)+'</div>':'')+overrideInfo+'</div>';
    }).join('');
    var repsHTML=!repsAll.length?'<p class="empty">Aucun passage réparateur pour '+annee+'.</p>':repsAll.map(function(r){
      var retour=r.retour_reel||null;var enCours=!retour;
      var nbJ=retour?Math.ceil((new Date(retour)-new Date(r.depuis))/86400000):Math.ceil((new Date()-new Date(r.depuis))/86400000);
      var depasse=r.prevu_retour&&!retour&&new Date()>new Date(r.prevu_retour);
      return '<div class="rep-bloc'+(enCours?' rep-en-cours':'')+(depasse?' rep-depasse':'')+'"><div class="rep-header"><div><div class="rep-motif">'+_escHtml(r.motif)+'</div><div class="rep-dates">Entrée : <strong>'+fmtD(r.depuis)+'</strong>'+(r.prevu_retour?' · Retour prévu : <strong>'+fmtD(r.prevu_retour)+'</strong>':'')+(retour?' · Retour réel : <strong>'+fmtD(retour)+'</strong>':'')+'</div></div><div class="rep-badge '+(enCours?'badge-cours':'badge-ok')+'">'+( enCours?(depasse?'⚠️ Dépassé':'🔧 En cours'):'✓ '+nbJ+'j')+'</div></div></div>';
    }).join('');
    return '<section class="tracteur-section"><div class="tracteur-title"><div><div class="tracteur-nom">'+_escHtml(t.nom)+(t.traitementOnly?' <span class="badge-trait">Traitement</span>':'')+'</div><div class="tracteur-modele">🔩 '+_escHtml(t.modele||'—')+' · '+_escHtml(t.type)+'</div></div><div class="tracteur-annee">'+annee+'</div></div>'+resumeHTML+'<h3 class="section-sub">📋 Fiches d\'entretien</h3>'+fichesHTML+'<h3 class="section-sub" style="margin-top:20px">🔧 Passages réparateur</h3>'+repsHTML+'</section>';
  }).join('<div class="page-break"></div>');
  var aujourd_hui=fmtD(new Date().toISOString().slice(0,10));
  var html='<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Ma Vigne — Entretien '+annee+'</title><link rel="stylesheet" href="/fonts/fonts.css"><style>@page{size:A4 portrait;margin:14mm 12mm}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Outfit,system-ui,-apple-system,sans-serif;font-size:11px;color:#1A1A1A;}.doc-title{font-family:"Cormorant Garamond",Georgia,serif}.doc-header{border-bottom:2px solid #3D6B27;padding-bottom:12px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end;}.doc-title{font-size:20px;font-weight:bold;color:#3D6B27;}.doc-meta{text-align:right;font-size:10px;color:#888;}.tracteur-section{margin-bottom:30px;}.tracteur-title{display:flex;justify-content:space-between;align-items:flex-start;background:#2A3547;color:white;padding:12px 16px;border-radius:8px;margin-bottom:12px;}.tracteur-nom{font-size:16px;font-weight:bold;}.tracteur-modele{font-size:10px;color:rgba(255,255,255,0.6);margin-top:3px;}.tracteur-annee{font-size:22px;font-weight:bold;color:rgba(255,255,255,0.35);}.badge-trait{font-size:9px;background:#E07B2A;color:white;border-radius:4px;padding:1px 6px;vertical-align:middle;font-weight:normal;margin-left:6px;}.resume-bar{display:flex;border:1px solid #E0DDD5;border-radius:8px;overflow:hidden;margin-bottom:16px;}.resume-item{flex:1;text-align:center;padding:10px 6px;border-right:1px solid #E0DDD5;}.resume-item:last-child{border-right:none;}.resume-val{display:block;font-size:18px;font-weight:bold;color:#2A3547;}.val-warn{color:#C0392B;}.resume-lbl{display:block;font-size:9px;color:#888;margin-top:2px;text-transform:uppercase;letter-spacing:0.04em;}.section-sub{font-size:12px;font-weight:bold;color:#2A3547;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #E8E4D9;}.fiche-bloc{border:1px solid #E0DDD5;border-radius:6px;margin-bottom:8px;overflow:hidden;break-inside:avoid;}.fiche-bloc.has-anomalie{border-color:#F5B8B4;}.fiche-header{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#F9F8F5;border-bottom:1px solid #E0DDD5;}.fiche-date{font-weight:bold;font-size:11px;}.fiche-meta{font-size:10px;color:#666;margin-top:2px;}.fiche-score{font-size:18px;font-weight:bold;}.score-ok{color:#3D6B27;}.score-warn{color:#E07B2A;}.check-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;padding:8px 12px;}.check-item{font-size:10px;display:flex;justify-content:space-between;align-items:center;padding:3px 6px;border-radius:4px;}.check-item.ok{background:#EAF4E2;color:#2D5A1B;}.check-item.ko{background:#FEF0EF;color:#922B21;}.check-item span{font-weight:bold;}.anomalie{padding:6px 12px 8px;background:#FEF0EF;font-size:10px;color:#922B21;border-top:1px solid #F5B8B4;}.rep-bloc{border:1px solid #E0DDD5;border-radius:6px;margin-bottom:8px;padding:10px 14px;break-inside:avoid;}.rep-bloc.rep-en-cours{border-color:#F5CBA7;background:#FEF9F5;}.rep-bloc.rep-depasse{border-color:#F5B8B4;background:#FEF0EF;}.rep-header{display:flex;justify-content:space-between;align-items:center;gap:10px;}.rep-motif{font-weight:bold;font-size:11px;margin-bottom:4px;}.rep-dates{font-size:10px;color:#555;}.rep-badge{font-size:10px;font-weight:bold;padding:4px 10px;border-radius:12px;white-space:nowrap;}.badge-ok{background:#EAF4E2;color:#2D5A1B;}.badge-cours{background:#FEF3E2;color:#935116;}.empty{font-size:10px;color:#999;font-style:italic;padding:8px 0;}.page-break{page-break-after:always;}.doc-footer{border-top:1px solid #E0DDD5;padding-top:8px;margin-top:20px;font-size:9px;color:#AAA;display:flex;justify-content:space-between;}@media print{.page-break{page-break-after:always;border:none;margin:0;}}</style></head><body><div class="doc-header"><div><div class="doc-title">🍇 Ma Vigne — Entretien tracteurs</div><div style="font-size:11px;color:var(--texte-doux,#666);margin-top:2px">Historique '+annee+' · '+tracteursSelectionnes.map(function(t){return t.nom;}).join(', ')+'</div></div><div class="doc-meta">Généré le '+aujourd_hui+'<br>Ma Vigne ' + (window.APP_VERSION ? 'v' + window.APP_VERSION : '') + ' \u00b7 GUERETTECH</div></div>'+sectionsHTML+'<div class="doc-footer"><span>Ma Vigne — Document confidentiel · Usage interne</span><span>© 2026 Nicolas GUERET / GUERETTECH</span></div></body></html>';
  var win=window.open('','_blank');
  if(!win){showToast('Autorisez les popups pour l\'impression','#C0392B');return;}
  win.document.write(html);
  win.document.close();
  win.onload=function(){win.focus();win.print();};
  document.getElementById('ovExportEntretien').classList.remove('open');
  showToast('PDF ouvert ✓','#3D6B27');
}

// ════ SWIPE TO CLOSE — bottom sheets / modals ════
// Délégation unique sur document — couvre .modal, .ov-panel et .sd-trac-sheet
// Déclenchement uniquement depuis la handle (.modal-handle / .ov-drag / .sd-trac-sheet-bar)
// + bloc pull-to-refresh Chrome Android pendant le drag
(function() {
  var CLOSE_THRESHOLD = 50;  // px vers le bas pour valider la fermeture
  var LOCK_PX = 6;           // px min avant de confirmer la direction

  var _panel = null;
  var _overlay = null;
  var _startY = 0;
  var _startX = 0;
  var _locked = false;   // direction verticale confirmée
  var _refused = false;  // mouvement horizontal → ignorer

  // La zone de déclenchement : uniquement les handles visuelles
  var HANDLE_SEL = '.modal-handle, .ov-drag, .sd-trac-sheet-bar, .sd-trac-sheet-handle';

  function _findPanel(target) {
    return target.closest('.modal, .ov-panel, .sd-trac-sheet');
  }

  function _findOverlayId(panel) {
    var ov = panel.closest('.overlay');
    return ov ? ov.id : null;
  }

  function _reset() {
    _panel = null; _overlay = null;
    _locked = false; _refused = false;
  }

  document.addEventListener('touchstart', function(e) {
    _reset();
    // Déclenchement uniquement si le doigt démarre sur une handle
    if (!e.target.closest(HANDLE_SEL)) return;

    var panel = _findPanel(e.target);
    if (!panel) return;

    _panel = panel;
    _overlay = panel.closest('.overlay');
    _startY = e.touches[0].clientY;
    _startX = e.touches[0].clientX;
    _panel.style.transition = 'none';
  }, { passive: true });

  // passive: false OBLIGATOIRE pour pouvoir appeler preventDefault()
  // et bloquer le pull-to-refresh natif Chrome Android
  document.addEventListener('touchmove', function(e) {
    if (!_panel || _refused) return;

    var dy = e.touches[0].clientY - _startY;
    var dx = e.touches[0].clientX - _startX;

    if (!_locked) {
      if (Math.abs(dx) > Math.abs(dy) + 2) { _refused = true; return; }
      if (Math.abs(dy) < LOCK_PX) {
        // Bloquer le pull-to-refresh dès le début du touch sur une handle
        e.preventDefault();
        return;
      }
      if (dy < 0) { _refused = true; return; } // swipe vers le haut → ignorer
      _locked = true;
    }

    // Bloquer le pull-to-refresh Chrome pendant tout le drag
    e.preventDefault();

    if (dy < 0) dy = 0;
    var travel = dy < CLOSE_THRESHOLD
      ? dy
      : CLOSE_THRESHOLD + (dy - CLOSE_THRESHOLD) * 0.35;

    _panel.style.transform = 'translateY(' + travel + 'px)';

    if (_overlay) {
      var alpha = Math.max(0, 1 - dy / 260);
      _overlay.style.background = 'rgba(0,0,0,' + (alpha * 0.55) + ')';
    }
  }, { passive: false });

  document.addEventListener('touchend', function(e) {
    if (!_panel) return;

    var dy = e.changedTouches[0].clientY - _startY;
    var panel = _panel, overlay = _overlay;
    panel.style.transition = '';

    if (_locked && dy > CLOSE_THRESHOLD) {
      // ── Fermeture ──
      panel.style.transition = 'transform 0.22s ease-in';
      panel.style.transform = 'translateY(110%)';
      if (overlay) {
        overlay.style.transition = 'background 0.22s ease-in';
        overlay.style.background = 'rgba(0,0,0,0)';
      }
      var ovId = _findOverlayId(panel);
      setTimeout(function() {
        panel.style.transform = '';
        panel.style.transition = '';
        if (overlay) { overlay.style.background = ''; overlay.style.transition = ''; }
        if (ovId) closeOv(null, ovId);
      }, 220);
    } else {
      // ── Annulation : rebond en place ──
      panel.style.transition = 'transform 0.32s cubic-bezier(.32,1.2,.32,1)';
      panel.style.transform = 'translateY(0)';
      if (overlay) {
        overlay.style.transition = 'background 0.32s ease-out';
        overlay.style.background = '';
      }
      setTimeout(function() {
        panel.style.transition = '';
        if (overlay) overlay.style.transition = '';
      }, 320);
    }

    _reset();
  }, { passive: true });
})();

window.addEventListener('load', function(){
  // Initialiser le thème dès le chargement
  if(typeof initTheme==='function') initTheme();

  var todayStr = new Date().toISOString().split('T')[0];
  var sd = document.getElementById('s-date'); if(sd) sd.value = todayStr;
  var pm = document.getElementById('pdf-mois'); if(pm) pm.value = todayStr.slice(0,7);

  // Exposer les fonctions render sur window pour le module Firebase
  window.renderHome        = renderHome;
  window.renderParcelles   = renderParcelles;
  window.computePStats     = computePStats;
  window.renderJournalList = renderJournalList;
  window.renderTracteur    = renderTracteur;
  // window.renderReglages — exposed by reglages.js
  window.initLogin         = initLogin;

  // Initialisation : Firebase en priorité, localStorage en fallback
  // try/catch global pour éviter l'écran noir iOS en cas d'erreur silencieuse
  try {
    if(window._fbLoad) {
      window._fbLoad().catch(function(){
        try { loadData(); initLogin(); } catch(e){ console.error('[Init fallback]',e); }
      });
    } else {
      loadData();
      initLogin();
    }
  } catch(e) {
    console.error('[Init erreur critique]',e);
    try { loadData(); initLogin(); } catch(e2){}
  }

  // ── Intercepteurs erreurs globaux (v2.68) ──
  window.addEventListener('error', function(e) {
    if(typeof logError !== 'function') return;
    logError({
      level: 'error', cat: 'runtime',
      msg: e.message || 'Erreur JS non gérée',
      detail: (e.filename ? e.filename + ':' + e.lineno : '') + (e.error && e.error.stack ? '\n' + e.error.stack : '')
    });
  });
  window.addEventListener('unhandledrejection', function(e) {
    var reason = e.reason;
    var _rmsg = (reason && reason.message ? reason.message : String(reason)) || '';
    // Bug SDK Firestore connu (firebase-js-sdk : « INTERNAL ASSERTION FAILED: Unexpected
    // state ») — assertion interne du flux de watch temps réel, intermittente, plus fréquente
    // sur réseau mobile instable, NON corrigée par les versions récentes du SDK. Sans perte de
    // données (le pull getDoc réussit). On NE l'affiche PAS au client : trace silencieuse (une
    // seule entrée error_log par session + compteur console) au lieu du bandeau d'erreur rouge.
    if (/INTERNAL ASSERTION FAILED/i.test(_rmsg)) {
      try { e.preventDefault(); } catch(_e){}
      window._mvFsAssertCount = (window._mvFsAssertCount || 0) + 1;
      try { console.warn('[Firestore] assertion interne SDK ignorée (bug connu, non bloquant) x' + window._mvFsAssertCount + ' : ' + _rmsg); } catch(_e){}
      if (!window._mvFsAssertLogged) {
        window._mvFsAssertLogged = true;
        try { if (window.fbAppendError) window.fbAppendError({ id:'fa'+Date.now(), ts:new Date().toISOString(), level:'info', cat:'firebase', msg:'Assertion interne SDK Firestore (bug connu, masquée a l’ecran)', detail:_rmsg }); } catch(_e){}
      }
      return;
    }
    if(typeof logError !== 'function') return;
    logError({
      level: 'error', cat: 'runtime',
      msg: 'Promesse rejetée : ' + _rmsg,
      detail: reason && reason.stack ? reason.stack : ''
    });
  });
  window.addEventListener('offline', function() {
    if(typeof logError !== 'function') return;
    logError({ level: 'warning', cat: 'network', msg: 'Hors ligne — synchronisation suspendue' });
  });

  document.getElementById('login-back-btn').addEventListener('click', backToProfiles);
  document.getElementById('login-pwd-btn').addEventListener('click', confirmLogin);
  document.getElementById('login-pwd-input').addEventListener('keydown', function(e){ if(e.key==='Enter') confirmLogin(); });
  document.querySelectorAll('.fchip').forEach(c=>c.addEventListener('click',function(){
  document.querySelectorAll('.fchip').forEach(x=>x.classList.remove('active'));
  this.classList.add('active');
  pFilter=this.dataset.filter;
  // Reset du filtre tâche lors du changement de catégorie statut
  pTacheFilter='toutes';
  renderParcelles();
}));
  // ── Debounce 300ms sur les champs de recherche (évite un render par frappe sur Android) ──
  var _dbPSearch=null;
  document.getElementById('pSearch').addEventListener('input',function(){
    pSearch=this.value;
    document.getElementById('pSearch-clear').style.display=this.value?'inline':'none';
    clearTimeout(_dbPSearch);
    _dbPSearch=setTimeout(renderParcelles,300);
  });
  var _dbJSearch=null;
  document.getElementById('jSearch').addEventListener('input',function(){
    jSearch=this.value;
    document.getElementById('jSearch-clear').style.display=this.value?'inline':'none';
    clearTimeout(_dbJSearch);
    _dbJSearch=setTimeout(renderJournalList,300);
  });
  if('Notification' in window&&Notification.permission==='granted'){
    if(window.updateNotifUI) window.updateNotifUI('granted');
    if(window.scheduleNotifCheck) window.scheduleNotifCheck();
    checkRepNotifications();
  } else if('Notification' in window&&Notification.permission==='denied'){
    if(window.updateNotifUI) window.updateNotifUI('denied');
  }
});

// ════ SERVICE WORKER ════
// ── Enregistrement Service Worker (PWA offline) ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js').then(function(reg) {
      if(DEBUG) console.log('[SW] Enregistré :', reg.scope);
      // Forcer vérification mise à jour SW à chaque chargement
      reg.update().catch(function(){});
      // Si un SW est en attente, lui demander de prendre le contrôle immédiatement
      if(reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
      // Détecter installation d'un nouveau SW et forcer skip
      reg.addEventListener('updatefound', function(){
        var inst = reg.installing;
        if(!inst) return;
        inst.addEventListener('statechange', function(){
          if(inst.state === 'installed') inst.postMessage({type:'SKIP_WAITING'});
        });
      });
      if ('sync' in reg) {
        reg.sync.register('mavigne-sync').catch(function(e) {
          console.warn('[SW] Background Sync non dispo :', e);
        });
      }
    }).catch(function(err) {
      console.warn('[SW] Échec enregistrement :', err);
      if(typeof logError === 'function') logError({level:'warning',cat:'runtime',msg:'Service Worker non enregistré',detail:String(err)});
    });

    // controllerchange : rechargement quand un nouveau SW prend le contrôle
    // Pas de guard : fonctionne aussi en navigation privée (SW vierge au premier lancement)
    // Safe : après rechargement le SW est déjà actif, pas de nouveau controllerchange
    var _swReloadDone = false;
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      if (_swReloadDone) return;
      _swReloadDone = true;
      if(DEBUG) console.log('[SW] Nouveau contrôleur — rechargement auto');
      _swReload();
    });

    // Vérifier mises à jour SW à chaque retour au premier plan (fix PWA icône Android)
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.getRegistration().then(function(reg) {
          if (reg) reg.update().catch(function(){});
        }).catch(function(){});
      }
    });
  });
}
// Rechargement SW différé : attend la fermeture des overlays ouverts
window._swUpdatePending = false;
function _swReload() {
  // Toujours recharger immédiatement : le SW apportera les nouveaux assets
  if(DEBUG) console.log('[SW] Rechargement pour nouveaux assets');
  window.location.reload();
}


// ════ REFRESH SANS DÉCONNEXION ════
async function refreshApp(){
  if(!navigator.onLine){showToast('📵 Hors ligne','#7A4F2E');return;}
  if(!currentUser){showToast('⚠️ Non connecté','#C0392B');return;}
  showSyncBadge('🔄 Actualisation…','#1A4A7A');
  var btn=document.getElementById('hv2-refresh-btn');
  if(btn){btn.style.transform='rotate(360deg)';btn.style.transition='transform 0.6s ease';}
  try{
    if(window._fbLoadAfterAuth)await window._fbLoadAfterAuth();
    var p=document.querySelector('.page.active');
    if(p){var pid=p.id;
      if(pid==='page-home')renderHome();
      if(pid==='page-parcelles'){renderParcelles();computePStats();}
      if(pid==='page-journal')renderJournalList();
      if(pid==='page-tracteur')renderTracteur();
      if(pid==='page-phyto')renderPhyto();
      if(pid==='page-reglages')window.renderReglages();
    }
    showSyncBadge('✅ Actualisé','#3D6B27');
    showToast('✅ Données actualisées','#3D6B27');
  }catch(e){showToast('⚠️ Erreur actualisation','#C0392B');}
  setTimeout(function(){if(btn){btn.style.transform='';btn.style.transition='';}},700);
}
(function(){
  // PTR : seuil 120px (était 75) + départ touch dans la zone haute (Y<80px depuis le bord)
  // Évite les déclenchements accidentels en scrollant normalement
  var _sy=0,_startY=0,_act=false,_ind=null,PTR=120,START_ZONE=80;
  function gi(){if(!_ind){_ind=document.createElement('div');_ind.style.cssText='position:fixed;top:0;left:50%;transform:translateX(-50%) translateY(-60px);z-index:9999;background:#3D6B27;color:#fff;border-radius:0 0 20px 20px;padding:8px 20px;font-size:13px;font-family:Outfit,sans-serif;font-weight:600;pointer-events:none;opacity:0;transition:opacity 0.1s;';document.body.appendChild(_ind);}return _ind;}
  document.addEventListener('touchstart',function(e){
    if(document.querySelector('.overlay.open'))return;
    var pg=document.querySelector('.page.active');
    if(pg&&pg.scrollTop>0)return;
    _startY=e.touches[0].clientY;
    // Ne démarrer le PTR que si le doigt part de la zone haute de l'écran
    if(_startY>START_ZONE)return;
    _sy=_startY;
    _act=true;
  },{passive:true});
  document.addEventListener('touchmove',function(e){if(!_act)return;if(document.querySelector('.overlay.open')){_act=false;return;}var dy=e.touches[0].clientY-_sy;if(dy<10)return;var ind=gi(),p=Math.min(dy/PTR,1);ind.style.opacity=String(p);ind.textContent=dy>=PTR?'↑ Relâcher pour actualiser':'↓ Tirer pour actualiser';},{passive:true});
  document.addEventListener('touchend',function(e){if(!_act)return;_act=false;var dy=e.changedTouches[0].clientY-_sy,ind=gi();ind.style.opacity='0';if(dy>=PTR)refreshApp();},{passive:true});
})();

// ════════════════════════════════════
// EXPOSITION GLOBALE — modules ES ne pollue plus window automatiquement
// Fonctions appelées via onclick/oninput dans index.html
// ════════════════════════════════════
(function() {
  if (typeof _execConfirmDel !== "undefined") window._execConfirmDel = _execConfirmDel;
  if (typeof _setActChampType !== "undefined") window._setActChampType = _setActChampType;
  if (typeof _toggleActChamp !== "undefined") window._toggleActChamp = _toggleActChamp;
  if (typeof _toggleActEmojiPick !== "undefined") window._toggleActEmojiPick = _toggleActEmojiPick;
  if (typeof _updateExportSummary !== "undefined") window._updateExportSummary = _updateExportSummary;
  if (typeof applyJDateFilter !== "undefined") window.applyJDateFilter = applyJDateFilter;
  if (typeof calcEtpLive !== "undefined") window.calcEtpLive = calcEtpLive;
  if (typeof planFillPDFFromMonth !== "undefined") window.planFillPDFFromMonth = planFillPDFFromMonth;
  if (typeof calcEtpLivePdf !== "undefined") window.calcEtpLivePdf = calcEtpLivePdf;
  if (typeof onPdfManualEdit !== "undefined") window.onPdfManualEdit = onPdfManualEdit;
  if (typeof pdfDetailToggle !== "undefined") window.pdfDetailToggle = pdfDetailToggle;
  if (typeof chatAutoResize !== "undefined") window.chatAutoResize = chatAutoResize;
  if (typeof chatHandleKey !== "undefined") window.chatHandleKey = chatHandleKey;
  if (typeof chatSend !== "undefined") window.chatSend = chatSend;
  if (typeof chatSwitch !== "undefined") window.chatSwitch = chatSwitch;
  if (typeof checkDangerConf !== "undefined") window.checkDangerConf = checkDangerConf;
  if (typeof clearJDateFilter !== "undefined") window.clearJDateFilter = clearJDateFilter;
  if (typeof clearJSearch !== "undefined") window.clearJSearch = clearJSearch;
  if (typeof clearPSearch !== "undefined") window.clearPSearch = clearPSearch;
  if (typeof clearPriority !== "undefined") window.clearPriority = clearPriority;
  if (typeof closeOv !== "undefined") window.closeOv = closeOv;
  if (typeof closeOvDanger !== "undefined") window.closeOvDanger = closeOvDanger;
  if (typeof closeRepBlock !== "undefined") window.closeRepBlock = closeRepBlock;
  if (typeof closeSdTracPicker !== "undefined") window.closeSdTracPicker = closeSdTracPicker;
  if (typeof closeSessionDetail !== "undefined") window.closeSessionDetail = closeSessionDetail;
  if (typeof confirmChangePwd !== "undefined") window.confirmChangePwd = confirmChangePwd;
  if (typeof _mvShowFirstPwd !== "undefined") window._mvShowFirstPwd = _mvShowFirstPwd;
  if (typeof _mvSubmitFirstPwd !== "undefined") window._mvSubmitFirstPwd = _mvSubmitFirstPwd;
  if (typeof confirmDeleteSession !== "undefined") window.confirmDeleteSession = confirmDeleteSession;
  if (typeof deleteSessionFromDetail !== "undefined") window.deleteSessionFromDetail = deleteSessionFromDetail;
  if (typeof confirmDeleteTraitement !== "undefined") window.confirmDeleteTraitement = confirmDeleteTraitement;
  if (typeof confirmEntretien !== "undefined") window.confirmEntretien = confirmEntretien;
  if (typeof confirmValidation !== "undefined") window.confirmValidation = confirmValidation;
  if (typeof confirmerValidationChamp !== "undefined") window.confirmerValidationChamp = confirmerValidationChamp;
  if (typeof copyInviteLink !== "undefined") window.copyInviteLink = copyInviteLink;
  if (typeof deleteActivite !== "undefined") window.deleteActivite = deleteActivite;
  if (typeof deleteCond !== "undefined") window.deleteCond = deleteCond;
  if (typeof deleteMembre !== "undefined") window.deleteMembre = deleteMembre;
  if (typeof deleteTracteur !== "undefined") window.deleteTracteur = deleteTracteur;
  if (typeof executeDangerAction !== "undefined") window.executeDangerAction = executeDangerAction;
  if (typeof exportCSVJournal !== "undefined") window.exportCSVJournal = exportCSVJournal;
  if (typeof exportCSVParcelles !== "undefined") window.exportCSVParcelles = exportCSVParcelles;
  if (typeof exportJSON !== "undefined") window.exportJSON = exportJSON;
  if (typeof exportPDFMois !== "undefined") window.exportPDFMois = exportPDFMois;
  if (typeof exportPDFPhyto !== "undefined") window.exportPDFPhyto = exportPDFPhyto;
  if (typeof exportPDFRapportSaison !== "undefined") window.exportPDFRapportSaison = exportPDFRapportSaison;
  if (typeof goTo !== "undefined") window.goTo = goTo;
  if (typeof saveData !== "undefined") window.saveData = saveData;
  if (typeof showHomeLoader !== "undefined") window.showHomeLoader = showHomeLoader;
  if (typeof _showAppLoader !== "undefined") window._showAppLoader = _showAppLoader;
  if (typeof _hideAppLoader !== "undefined") window._hideAppLoader = _hideAppLoader;
  if (typeof hideForgotPanel !== "undefined") window.hideForgotPanel = hideForgotPanel;
  if (typeof importJSON !== "undefined") window.importJSON = importJSON;
  if (typeof lancerExportEntretienPDF !== "undefined") window.lancerExportEntretienPDF = lancerExportEntretienPDF;
  if (typeof logout !== "undefined") window.logout = logout;
  if (typeof onEfAnomalieInput !== "undefined") window.onEfAnomalieInput = onEfAnomalieInput;
  if (typeof onEntAnomalieInput !== "undefined") window.onEntAnomalieInput = onEntAnomalieInput;
  if (typeof onProdChange !== "undefined") window.onProdChange = onProdChange;
  if (typeof onSessionActChange !== "undefined") window.onSessionActChange = onSessionActChange;
  if (typeof openChangePwd !== "undefined") window.openChangePwd = openChangePwd;
  if (typeof openEditDomNom !== "undefined") window.openEditDomNom = openEditDomNom;
  if (typeof openExport !== "undefined") window.openExport = openExport;
  if (typeof openGPS !== "undefined") window.openGPS = openGPS;
  if (typeof openInMap !== "undefined") window.openInMap = openInMap;
  if (typeof toggleMapLabels !== "undefined") window.toggleMapLabels = toggleMapLabels;
  if (typeof openJournalEntry !== "undefined") window.openJournalEntry = openJournalEntry;
  if (typeof openMentionsLogin !== "undefined") window.openMentionsLogin = openMentionsLogin;
  if (typeof openNewSession !== "undefined") window.openNewSession = openNewSession;
  if (typeof openOv !== "undefined") window.openOv = openOv;
  if (typeof openOvDanger !== "undefined") window.openOvDanger = openOvDanger;
  if (typeof openOvEntretien !== "undefined") window.openOvEntretien = openOvEntretien;
  if (typeof openOvNouvelleActivite !== "undefined") window.openOvNouvelleActivite = openOvNouvelleActivite;
  if (typeof openPriorityEdit !== "undefined") window.openPriorityEdit = openPriorityEdit;
  if (typeof openReparateur !== "undefined") window.openReparateur = openReparateur;
  if (typeof ouvrirExportEntretien !== "undefined") window.ouvrirExportEntretien = ouvrirExportEntretien;
  if (typeof pickTracType !== "undefined") window.pickTracType = pickTracType;
  if (typeof pickTracTypeEdit !== "undefined") window.pickTracTypeEdit = pickTracTypeEdit;
  if (typeof pickVal !== "undefined") window.pickVal = pickVal;
  if (typeof renderHistorique !== "undefined") window.renderHistorique = renderHistorique;
  if (typeof renderListeFiches !== "undefined") window.renderListeFiches = renderListeFiches;
  if (typeof requestNotifications !== "undefined") window.requestNotifications = requestNotifications;
  if (typeof saveActivite !== "undefined") window.saveActivite = saveActivite;
  if (typeof saveAddTracteur !== "undefined") window.saveAddTracteur = saveAddTracteur;
  if (typeof saveConducteur !== "undefined") window.saveConducteur = saveConducteur;
  if (typeof saveEditActTrac !== "undefined") window.saveEditActTrac = saveEditActTrac;
  if (typeof saveEditCond !== "undefined") window.saveEditCond = saveEditCond;
  if (typeof saveEditDomNom !== "undefined") window.saveEditDomNom = saveEditDomNom;
  if (typeof saveEditFiche !== "undefined") window.saveEditFiche = saveEditFiche;
  if (typeof saveEditMembre !== "undefined") window.saveEditMembre = saveEditMembre;
  if (typeof saveEditSession !== "undefined") window.saveEditSession = saveEditSession;
  if (typeof saveEditTracteur !== "undefined") window.saveEditTracteur = saveEditTracteur;
  if (typeof saveEntretien !== "undefined") window.saveEntretien = saveEntretien;
  if (typeof saveEtpSaison !== "undefined") window.saveEtpSaison = saveEtpSaison;
  if (typeof saveJournalEntry !== "undefined") window.saveJournalEntry = saveJournalEntry;
  if (typeof saveMembre !== "undefined") window.saveMembre = saveMembre;
  if (typeof savePriority !== "undefined") window.savePriority = savePriority;
  if (typeof saveProduit !== "undefined") window.saveProduit = saveProduit;
  if (typeof saveRepBlockChoice !== "undefined") window.saveRepBlockChoice = saveRepBlockChoice;
  if (typeof saveReparateur !== "undefined") window.saveReparateur = saveReparateur;
  if (typeof saveReporter !== "undefined") window.saveReporter = saveReporter;
  if (typeof saveSaison !== "undefined") window.saveSaison = saveSaison;
  if (typeof saveSdTracPicker !== "undefined") window.saveSdTracPicker = saveSdTracPicker;
  if (typeof saveSession !== "undefined") window.saveSession = saveSession;
  if (typeof saveTache !== "undefined") window.saveTache = saveTache;
  if (typeof openOvTache !== "undefined") window.openOvTache = openOvTache;
  if (typeof addTacheFromCatalogue !== "undefined") window.addTacheFromCatalogue = addTacheFromCatalogue;
  if (typeof showOvTacheForm !== "undefined") window.showOvTacheForm = showOvTacheForm;
  if (typeof showOvTacheCatalog !== "undefined") window.showOvTacheCatalog = showOvTacheCatalog;
  if (typeof _computeAutoNiv !== "undefined") window._computeAutoNiv = _computeAutoNiv;
  if (typeof getTacheStatut !== "undefined") window.getTacheStatut = getTacheStatut;
  if (typeof _relNivState !== "undefined") window._relNivState = _relNivState;
  if (typeof _normalizeTaches !== "undefined") window._normalizeTaches = _normalizeTaches;
  if (typeof _migrateRelev2 !== "undefined") window._migrateRelev2 = _migrateRelev2;
  if (typeof _migrateTachesV3 !== "undefined") window._migrateTachesV3 = _migrateTachesV3;
  if (typeof openNiveauxPanel !== "undefined") window.openNiveauxPanel = openNiveauxPanel;
  if (typeof _renderNiveauxModal !== "undefined") window._renderNiveauxModal = _renderNiveauxModal;
  if (typeof _toggleNiv !== "undefined") window._toggleNiv = _toggleNiv;
  if (typeof confirmNiveaux !== "undefined") window.confirmNiveaux = confirmNiveaux;
  if (typeof openPassagesPanel !== "undefined") window.openPassagesPanel = openPassagesPanel;
  if (typeof _renderPassagesModal !== "undefined") window._renderPassagesModal = _renderPassagesModal;
  if (typeof _togglePass !== "undefined") window._togglePass = _togglePass;
  if (typeof _cancelPass !== "undefined") window._cancelPass = _cancelPass;
  if (typeof _cancelNiv !== "undefined") window._cancelNiv = _cancelNiv;
  if (typeof tapTacheSimple !== "undefined") window.tapTacheSimple = tapTacheSimple;
  if (typeof _setPassOv !== "undefined") window._setPassOv = _setPassOv;
  if (typeof confirmPassages !== "undefined") window.confirmPassages = confirmPassages;
  if (typeof saveSaisonPassages !== "undefined") window.saveSaisonPassages = saveSaisonPassages;
  if (typeof annulerTache !== "undefined") window.annulerTache = annulerTache;
  if (typeof bulkValidateP1 !== "undefined") window.bulkValidateP1 = bulkValidateP1;
  if (typeof _fixPassagesP2 !== "undefined") window._fixPassagesP2 = _fixPassagesP2;
  if (typeof savePassageHha !== "undefined") window.savePassageHha = savePassageHha;
  if (typeof openEditHha !== "undefined") window.openEditHha = openEditHha;
  if (typeof saveEditHha !== "undefined") window.saveEditHha = saveEditHha;
  if (typeof _getPassHha !== "undefined") window._getPassHha = _getPassHha;
  if (typeof _setNivOv !== "undefined") window._setNivOv = _setNivOv;
  if (typeof togglePassEquipeMode !== "undefined") window.togglePassEquipeMode = togglePassEquipeMode;
  if (typeof toggleNivEquipeMode !== "undefined") window.toggleNivEquipeMode = toggleNivEquipeMode;
  if (typeof saveTraitement !== "undefined") window.saveTraitement = saveTraitement;
  if (typeof sendForgotPwd !== "undefined") window.sendForgotPwd = sendForgotPwd;
  if (typeof showForgotPanel !== "undefined") window.showForgotPanel = showForgotPanel;
  if (typeof submitForgotLogin !== "undefined") window.submitForgotLogin = submitForgotLogin;
  if (typeof switchPTab !== "undefined") window.switchPTab = switchPTab;
  if (typeof switchPhTab !== "undefined") window.switchPhTab = switchPhTab;
  if (typeof switchTracOnglet !== "undefined") window.switchTracOnglet = switchTracOnglet;
  if (typeof toggleEfAnoTraitee !== "undefined") window.toggleEfAnoTraitee = toggleEfAnoTraitee;
  if (typeof toggleEntAnoTraitee !== "undefined") window.toggleEntAnoTraitee = toggleEntAnoTraitee;
  if (typeof toggleEquipeMode !== "undefined") window.toggleEquipeMode = toggleEquipeMode;
  if (typeof toggleHomeCard !== "undefined") window.toggleHomeCard = toggleHomeCard;
  if (typeof toggleJEMode !== "undefined") window.toggleJEMode = toggleJEMode;
  if (typeof togglePrioPill !== "undefined") window.togglePrioPill = togglePrioPill;
  if (typeof toggleRole !== "undefined") window.toggleRole = toggleRole;
  if (typeof toggleSDShowDone !== "undefined") window.toggleSDShowDone = toggleSDShowDone;
  if (typeof toggleSDSkipMode !== "undefined") window.toggleSDSkipMode = toggleSDSkipMode;
  if (typeof toggleTracTrait !== "undefined") window.toggleTracTrait = toggleTracTrait;

  // ── Fonctions manquantes — appelées via onclick dans innerHTML dynamique ──
  if (typeof openDP !== "undefined") window.openDP = openDP;
  if (typeof openRepPonct !== "undefined") window.openRepPonct = openRepPonct;
  if (typeof repPonctChip !== "undefined") window.repPonctChip = repPonctChip;
  if (typeof repPonctQty !== "undefined") window.repPonctQty = repPonctQty;
  if (typeof saveRepPonct !== "undefined") window.saveRepPonct = saveRepPonct;
  if (typeof openDPCepage !== "undefined") window.openDPCepage = openDPCepage;
  if (typeof saveDPCepage !== "undefined") window.saveDPCepage = saveDPCepage;
  if (typeof _dpcToggleEntreplantation !== "undefined") window._dpcToggleEntreplantation = _dpcToggleEntreplantation;
  if (typeof openSessionDetail !== "undefined") window.openSessionDetail = openSessionDetail;
  if (typeof openEditSession !== "undefined") window.openEditSession = openEditSession;
  if (typeof toggleTravail !== "undefined") window.toggleTravail = toggleTravail;
  if (typeof marquerEnCours !== "undefined") window.marquerEnCours = marquerEnCours;
  if (typeof toggleExcluTache !== "undefined") window.toggleExcluTache = toggleExcluTache;
  if (typeof pickEmoji !== "undefined") window.pickEmoji = pickEmoji;
  if (typeof pickCond !== "undefined") window.pickCond = pickCond;
  if (typeof setJParcelle !== "undefined") window.setJParcelle = setJParcelle;
  if (typeof selectTracteur !== "undefined") window.selectTracteur = selectTracteur;
  if (typeof editCond !== "undefined") window.editCond = editCond;
  if (typeof applyDomNom !== "undefined") window.applyDomNom = applyDomNom;
  if (typeof goHub !== "undefined") window.goHub = goHub;
  if (typeof openHubAide !== "undefined") window.openHubAide = openHubAide;
  // ── Planning RH → src/planning.js (exports dans planning.js) ──
  if (typeof applyVigneSaison !== "undefined") window.applyVigneSaison = applyVigneSaison;
  // ── Audit mai 2026 — fonctions manquantes ──
  if (typeof saveEditSaison !== "undefined") window.saveEditSaison = saveEditSaison;
  if (typeof openEditSaison !== "undefined") window.openEditSaison = openEditSaison;
  if (typeof refreshApp !== "undefined") window.refreshApp = refreshApp;
  if (typeof setPTacheFilter !== "undefined") window.setPTacheFilter = setPTacheFilter;
  if (typeof setJQui !== "undefined") window.setJQui = setJQui;
  if (typeof setJTache !== "undefined") window.setJTache = setJTache;
  if (typeof clearAllJFiltres !== "undefined") window.clearAllJFiltres = clearAllJFiltres;
  if (typeof toggleEntBtn !== "undefined") window.toggleEntBtn = toggleEntBtn;
  if (typeof openListeFiches !== "undefined") window.openListeFiches = openListeFiches;
  if (typeof openOvEditFiche !== "undefined") window.openOvEditFiche = openOvEditFiche;
  if (typeof deleteFiche !== "undefined") window.deleteFiche = deleteFiche;
  if (typeof toggleAnomalieTraitee !== "undefined") window.toggleAnomalieTraitee = toggleAnomalieTraitee;
  if (typeof openTraitDetail !== "undefined") window.openTraitDetail = openTraitDetail;
  if (typeof openCatDetail !== "undefined") window.openCatDetail = openCatDetail;
  if (typeof selFromCatAndClose !== "undefined") window.selFromCatAndClose = selFromCatAndClose;
  if (typeof openOvTraitement !== "undefined") window.openOvTraitement = openOvTraitement;
  if (typeof deleteTache !== "undefined") window.deleteTache = deleteTache;
  if (typeof toggleEmRole !== "undefined") window.toggleEmRole = toggleEmRole;
  if (typeof editMembre !== "undefined") window.editMembre = editMembre;
  if (typeof archiveSaisonActive !== "undefined") window.archiveSaisonActive = archiveSaisonActive;
  if (typeof histoSelectA !== "undefined") window.histoSelectA = histoSelectA;
  if (typeof histoSelectB !== "undefined") window.histoSelectB = histoSelectB;
  if (typeof deleteHistoSnapshot !== "undefined") window.deleteHistoSnapshot = deleteHistoSnapshot;

  if (typeof openEditActTrac !== "undefined") window.openEditActTrac = openEditActTrac;
  if (typeof renderActTracList !== "undefined") window.renderActTracList = renderActTracList;
  if (typeof openEditTracteur !== "undefined") window.openEditTracteur = openEditTracteur;
  if (typeof openSdTracPicker !== "undefined") window.openSdTracPicker = openSdTracPicker;
  if (typeof retourReparateur !== "undefined") window.retourReparateur = retourReparateur;
  if (typeof chatOpenDM !== "undefined") window.chatOpenDM = chatOpenDM;
  if (typeof _pickActEmoji !== "undefined") window._pickActEmoji = _pickActEmoji;
  if (typeof _pickNewActTrac !== "undefined") window._pickNewActTrac = _pickNewActTrac;
  if (typeof _rbPick !== "undefined") window._rbPick = _rbPick;
  if (typeof _sdPickTrac !== "undefined") window._sdPickTrac = _sdPickTrac;
  // Setter currentUser — permet à onboarding.js de sync la variable locale app.js
  window.setCurrentUser = function(user) { currentUser = user; window.currentUser = user; };
  // Constantes partagées avec modules
  window.GT_ADMIN_EMAIL = GT_ADMIN_EMAIL;
  window.GT_BASE_URL    = GT_BASE_URL;
  // ── Expositions pour reglages.js (Phase 3b) ──
  window.DANGER_CFG       = DANGER_CFG;
  window.TACHES_CATALOGUE = TACHES_CATALOGUE;
  window.SURF_TOTALE      = SURF_TOTALE;
  window.rolesTemp        = rolesTemp;
  window.getSaisonActive  = getSaisonActive;
  window.calcHeures       = calcHeures;
  window.getTachesSaison  = getTachesSaison;
  window._jeBuildTaches   = _jeBuildTaches;
  window.getHomeCardData  = getHomeCardData;
  window.getPCls          = getPCls;
  window.recalcTravaux    = recalcTravaux;
  window.openConfirmDel   = openConfirmDel;
  window.couleurTracType  = couleurTracType;
  window.fmtDate          = fmtDate;
})();

function switchVigneOng(dest){
  // Synchroniser les onglets dans les 3 headers vigne (home/parcelles/journal)
  ['','p','j'].forEach(function(sfx){
    ['home','parcelles','journal'].forEach(function(o){
      var id = sfx ? 'vng-ong-'+o+'-'+sfx : 'vng-ong-'+o;
      var b = document.getElementById(id);
      if(b) b.classList.toggle('active', o===dest);
    });
  });
  goTo(dest);
}
window.switchVigneOng = switchVigneOng;

/* ════════════════════════════════════════════════════════════════════
   LOT 1 — Validation rapide depuis la liste filtrée (1 tap)  [v4.43]
   Tâches simples + passages (Ébourgeonnage/Pioche) + niveaux (Relevage)
   Réutilise getTacheStatut / recalcTravaux / _computeAutoNiv / injectMeteoIfNeeded
   ════════════════════════════════════════════════════════════════════ */
let pCurStep = 1;       // passage/niveau courant pour le filtre tâche actif
var EQUIPE_TACHE = {};  // {tache:[membres]} — équipe mémorisée PAR TÂCHE (équipes parallèles)
var EQUIPE_RECENT = []; // dernières compositions utilisées (réassignation rapide), max 4
var _eqtLoaded = false;

function _eqtKey(){return 'mavigne_eqt_'+(window.TENANT_ID||'default')+'_'+((currentUser&&currentUser.nom)||'anon');}
function _eqtRecentKey(){return 'mavigne_eqt_recent_'+(window.TENANT_ID||'default')+'_'+((currentUser&&currentUser.nom)||'anon');}
function _eqtClean(team){return (Array.isArray(team)?team:[]).filter(function(n){return (MEMBRES||[]).some(function(m){return m.nom===n&&m.statut!=='Inactif';});});}
function _eqtSameTeam(a,b){return a.length===b.length&&a.every(function(n){return b.indexOf(n)>=0;});}
function _eqtPushRecent(team){team=_eqtClean(team);if(!team.length)return;EQUIPE_RECENT=EQUIPE_RECENT.filter(function(t){return !_eqtSameTeam(_eqtClean(t),team);});EQUIPE_RECENT.unshift(team.slice());EQUIPE_RECENT=EQUIPE_RECENT.slice(0,4);}
function _eqtLoad(){
  try{var o=JSON.parse(localStorage.getItem(_eqtKey())||'{}');EQUIPE_TACHE=(o&&typeof o==='object'&&!Array.isArray(o))?o:{};}catch(e){EQUIPE_TACHE={};}
  try{var r=JSON.parse(localStorage.getItem(_eqtRecentKey())||'[]');EQUIPE_RECENT=Array.isArray(r)?r:[];}catch(e){EQUIPE_RECENT=[];}
  // migration douce one-shot depuis l'ancien EQUIPE_JOUR (lots précédents)
  try{
    var oldKey='mavigne_eqj_'+(window.TENANT_ID||'default')+'_'+((currentUser&&currentUser.nom)||'anon');
    var old=localStorage.getItem(oldKey);
    if(old){var oj=JSON.parse(old);if(Array.isArray(oj)&&oj.length){ if(EQUIPE_TACHE.__default===undefined)EQUIPE_TACHE.__default=oj.slice(); _eqtPushRecent(oj); }
      localStorage.removeItem(oldKey); _eqtSave(); }
  }catch(e){}
  _eqtLoaded=true;
}
function _eqtSave(){try{localStorage.setItem(_eqtKey(),JSON.stringify(EQUIPE_TACHE));localStorage.setItem(_eqtRecentKey(),JSON.stringify(EQUIPE_RECENT));}catch(e){}}
function _eqtFor(task){ if(!_eqtLoaded)_eqtLoad(); var t=(EQUIPE_TACHE[task]!==undefined)?EQUIPE_TACHE[task]:(EQUIPE_TACHE.__default||[]); return _eqtClean(t); }
function _eqtSet(task,team){ if(!_eqtLoaded)_eqtLoad(); team=_eqtClean(team); EQUIPE_TACHE[task]=team; _eqtPushRecent(team); _eqtSave(); }

function _pvDef(nom){return (TACHES||[]).find(function(t){return t.nom===nom;});}
function _pvType(nom){var d=_pvDef(nom);return (d&&d.type)?d.type:'simple';}
function _pvPrefix(nom){return _pvType(nom)==='niveaux'?'n':'p';}
function _pvStepLabel(nom){return _pvType(nom)==='niveaux'?'N':'P';}
function _pvSeasonPlan(nom){
  var d=_pvDef(nom);
  if(typeof SAISON_PASSAGES!=='undefined'&&SAISON_PASSAGES&&SAISON_PASSAGES[nom]!=null)return SAISON_PASSAGES[nom];
  if(_pvType(nom)==='niveaux')return (d&&d.niveaux?d.niveaux.length:3);
  return 2;
}
function _pvEffPlan(p,nom){
  var sp=_pvSeasonPlan(nom),s=_tachesFor(p)[nom];
  if(s&&typeof s==='object'&&s.ov!=null)return Math.min(s.ov,sp);
  return sp;
}
function _pvStepState(p,nom,i){
  var s=_tachesFor(p)[nom];
  if(!s)return 'Non démarré';
  if(typeof s==='string')return s==='Validé'?'Validé':'Non démarré';
  return s[_pvPrefix(nom)+i]||'Non démarré';
}
function _pvCurDone(p,nom){
  nom=nom||pTacheFilter;
  if(_pvType(nom)==='simple')return getTacheStatut(p,nom)==='Validé';
  if(pCurStep>_pvEffPlan(p,nom))return true; // étape non applicable (override) -> hors "à faire"
  var st=_pvStepState(p,nom,pCurStep);
  return st==='Validé'||st==='Auto';
}
function _pvStepChips(p,nom){
  var plan=_pvSeasonPlan(nom),lab=_pvStepLabel(nom),eff=_pvEffPlan(p,nom),h='';
  for(var i=1;i<=plan;i++){
    if(i>eff){h+='<span class="pdot na">— '+lab+i+'</span>';continue;}
    var st=_pvStepState(p,nom,i);
    var cls=(st==='Validé'||st==='Auto')?'done':st==='Commencé'?'comm':'todo';
    var ico=(st==='Validé')?'✓':st==='Auto'?'~':st==='Commencé'?'▶':'○';
    h+='<span class="pdot '+cls+(i===pCurStep?' cur':'')+'">'+ico+' '+lab+i+'</span>';
  }
  return h;
}
function _pvSmartStep(nom){
  if(_pvType(nom)==='simple')return 1;
  var plan=_pvSeasonPlan(nom),counts={},act=PARCELLES.filter(function(p){return p.statut!=='Arrachee';});
  act.forEach(function(p){
    var eff=_pvEffPlan(p,nom);
    for(var i=1;i<=Math.min(plan,eff);i++){var st=_pvStepState(p,nom,i);if(st!=='Validé'&&st!=='Auto'){counts[i]=(counts[i]||0)+1;break;}}
  });
  var best=1,bc=-1;for(var i=1;i<=plan;i++){if((counts[i]||0)>bc){bc=counts[i]||0;best=i;}}
  return best;
}
function setPCurStep(i){pCurStep=i;renderParcelles();}

function _pvRenderSubsel(){
  var w=document.getElementById('p-subsel-wrap');if(!w)return;
  if(pTacheFilter==='toutes'||_pvType(pTacheFilter)==='simple'){w.innerHTML='';return;}
  var plan=_pvSeasonPlan(pTacheFilter),sl=_pvStepLabel(pTacheFilter),lab=(sl==='N')?'Niveau':'Passage';
  var act=PARCELLES.filter(function(p){return p.statut!=='Arrachee';});
  if(pCurStep>plan)pCurStep=1;
  var chips='';
  for(var i=1;i<=plan;i++){
    var todo=act.filter(function(p){return i<=_pvEffPlan(p,pTacheFilter)&&_pvStepState(p,pTacheFilter,i)!=='Validé'&&_pvStepState(p,pTacheFilter,i)!=='Auto';}).length;
    chips+='<button class="pv-pchip'+(pCurStep===i?' on':'')+'" onclick="setPCurStep('+i+')">'+sl+i+'<span class="pv-pchip-cnt">'+todo+'</span></button>';
  }
  w.innerHTML='<div class="pv-subsel"><span class="pv-subsel-lbl">'+lab+'</span><div class="pv-subsel-chips">'+chips+'</div></div>';
}
function _pvRenderTeamBar(){
  var w=document.getElementById('p-team-bar');if(!w)return;
  if(pTacheFilter==='toutes'||!canWrite()){w.innerHTML='';return;}
  var team=_eqtFor(pTacheFilter);
  var names=team.length?team.join(', '):'Moi seul';
  var avs=team.length?team.slice(0,4).map(function(n){return '<div class="pv-team-av" style="background:'+(COULEURS_MBR[n]||'#3D6B27')+'">'+(n[0]||'?')+'</div>';}).join(''):'<div class="pv-team-av" style="background:#3D6B27">🙋</div>';
  var tl=(typeof tNom==='function')?tNom(pTacheFilter):pTacheFilter;
  w.innerHTML='<div class="pv-team-bar" onclick="openPTeamJour()"><span class="pv-team-ico">👥</span><div class="pv-team-info"><div class="pv-team-lbl">Équipe sur <b>'+_escHtml(tl)+'</b></div><div class="pv-team-names">'+_escHtml(names)+'</div></div><div class="pv-team-avs">'+avs+'</div><span class="pv-team-edit">Changer</span></div>';
}

var _pvTeamSel=[];
function openPTeamJour(){
  _pvTeamSel=_eqtFor(pTacheFilter).slice();
  var tt=document.getElementById('pv-team-task');if(tt)tt.textContent=((typeof tNom==='function')?tNom(pTacheFilter):pTacheFilter);
  _pvBuildRecent();_pvBuildTeamPick();openOv('ovPTeam');
}
function _pvBuildRecent(){
  var c=document.getElementById('pv-team-recent');if(!c)return;
  var cur=_eqtFor(pTacheFilter);
  var h='<div class="pv-recent-chip'+(cur.length===0?' sel':'')+'" onclick="_pvApplyTeam([])"><span class="pv-recent-ico">🙋</span><span class="pv-recent-txt">Moi seul</span><span class="pv-recent-go">Affecter</span></div>';
  (EQUIPE_RECENT||[]).forEach(function(t){
    var team=_eqtClean(t);if(!team.length)return;
    var same=_eqtSameTeam(team,cur);
    var avs=team.slice(0,4).map(function(n){return '<span class="pv-recent-av" style="background:'+(COULEURS_MBR[n]||'#3D6B27')+'">'+(n[0]||'?')+'</span>';}).join('');
    var arg=team.map(function(n){return "'"+_escAttr(n)+"'";}).join(',');
    h+='<div class="pv-recent-chip'+(same?' sel':'')+'" onclick="_pvApplyTeam(['+arg+'])"><span class="pv-recent-avs">'+avs+'</span><span class="pv-recent-txt">'+_escHtml(team.join(', '))+'</span><span class="pv-recent-go">Affecter</span></div>';
  });
  c.innerHTML=h;
}
function _pvBuildTeamPick(){
  var c=document.getElementById('pv-team-pick');if(!c)return;
  c.innerHTML=(MEMBRES||[]).filter(function(m){return m.statut!=='Inactif';}).map(function(m){
    var on=_pvTeamSel.indexOf(m.nom)>=0;
    return '<div class="pv-mbr-chip'+(on?' sel':'')+'" onclick="_pvToggleTeamMbr(\''+_escAttr(m.nom)+'\')"><span class="pv-mbr-av" style="background:'+(COULEURS_MBR[m.nom]||'#3D6B27')+'">'+(m.nom[0]||'?')+'</span>'+_escHtml(m.nom)+'</div>';
  }).join('');
}
function _pvToggleTeamMbr(n){var i=_pvTeamSel.indexOf(n);if(i>=0)_pvTeamSel.splice(i,1);else _pvTeamSel.push(n);_pvBuildTeamPick();}
function _pvApplyTeam(team){
  _eqtSet(pTacheFilter,team);closeOv(null,'ovPTeam');_pvRenderTeamBar();
  var t=_eqtClean(team),tl=(typeof tNom==='function')?tNom(pTacheFilter):pTacheFilter;
  showToast((t.length?'👥 '+t.join(', '):'🙋 Seul')+' → '+tl,'#3D6B27');
}
function savePTeamJour(){_pvApplyTeam(_pvTeamSel.slice());}

/* Toast dédié avec bouton Annuler */
var _pvUndoFn=null,_pvUndoTimer=null;
function _pvToast(msg,undoFn){
  var t=document.getElementById('pv-toast'),m=document.getElementById('pv-toast-msg'),u=document.getElementById('pv-toast-undo');
  if(!t){showToast(msg,'#3D6B27');return;}
  m.textContent=msg;
  if(undoFn){u.style.display='';_pvUndoFn=undoFn;u.onclick=function(){if(_pvUndoFn){_pvUndoFn();_pvUndoFn=null;}_pvHideToast();};}
  else{u.style.display='none';_pvUndoFn=null;}
  t.classList.add('show');
  clearTimeout(_pvUndoTimer);_pvUndoTimer=setTimeout(_pvHideToast,undoFn?4500:2200);
}
function _pvHideToast(){var t=document.getElementById('pv-toast');if(t)t.classList.remove('show');_pvUndoFn=null;}

/* Validation rapide 1-tap */
function pQuickValidate(nom,evt){
  if(_mvValidBlocked())return;
  if(!canWrite()){showToast('🔒 Lecture seule','#7A4F2E');return;}
  var p=PARCELLES.find(function(x){return x.nom===nom;});if(!p)return;
  var task=pTacheFilter,type=_pvType(task);
  if(type!=='simple'&&pCurStep>_pvEffPlan(p,task)){openDP(nom);return;}
  _mvdsSnap(task);
  if(!p.taches)p.taches={};
  var prev=(p.taches[task]===undefined)?undefined:JSON.parse(JSON.stringify(p.taches[task]));
  var date=new Date().toISOString().split('T')[0];
  var _eqt=_eqtFor(task);var equipe=_eqt.length>0,membresEquipe=equipe?_eqt.slice():[];
  var jid=Date.now().toString(16)+'-qv';
  var label,extra={};
  if(type==='simple'){
    p.taches[task]='Validé';label=tNom(task);extra.statut='Validé';
  } else {
    var pref=_pvPrefix(task),plan=_pvEffPlan(p,task);
    var cur=(p.taches[task]&&typeof p.taches[task]==='object')?Object.assign({},p.taches[task]):{ov:(p.taches[task]&&p.taches[task].ov!=null)?p.taches[task].ov:null};
    if(type==='niveaux'){
      var done=[],i;for(i=1;i<=plan;i++){if(cur[pref+i]==='Validé')done.push(i);}
      if(done.indexOf(pCurStep)<0)done.push(pCurStep);
      var auto=_computeAutoNiv(done,plan);
      for(i=1;i<=plan;i++){
        cur['n'+i]=(done.indexOf(i)>=0)?'Validé':(auto.indexOf(i)>=0?'Auto':(cur['n'+i]==='Commencé'?'Commencé':(cur['n'+i]||'Non démarré')));
      }
      extra.niveaux=done.slice().sort(function(a,b){return a-b;});
    } else {
      cur[pref+pCurStep]='Validé';extra.passages=[pCurStep];
    }
    p.taches[task]=cur;
    var g=getTacheStatut(p,task);
    label=tNom(task)+' '+_pvStepLabel(task)+pCurStep+(g==='Validé'?' · terminé ✓':'');
    extra.statut=g;
  }
  var jEntry=Object.assign({id:jid,date:date,parcelle:nom,tache:task,qui:currentUser.nom,equipe:equipe,membresEquipe:membresEquipe},extra);
  JOURNAL.unshift(jEntry);
  recalcTravaux(task);
  injectMeteoIfNeeded(date);
  saveData('parcelles');saveData('journal');saveData('travaux');
  if(navigator.vibrate)navigator.vibrate(55);
  var who=equipe?('Équipe ('+membresEquipe.length+')'):currentUser.nom;
  if(getTacheStatut(p,task)==='Validé'){
    _mvdsOpen({tache:task,parcelle:nom,surf:p.surface,
               membres:equipe?[currentUser.nom].concat(membresEquipe.filter(function(n){return n!==currentUser.nom;})):[],
               undo:function(){pQuickUndoEntry(nom,task,prev,jid);}});
  } else {
    _pvToast('✅ '+label+' · '+nom+' · '+who, function(){pQuickUndoEntry(nom,task,prev,jid);});
  }
  (async function(){try{var _d=_findDebutTache(nom,task,date)||date;var _m=await fetchMeteoMoyenne(_d,date);if(_m){jEntry.meteo_snapshot=_m;saveData('journal');}}catch(e){}})();
  var card=evt&&evt.target?evt.target.closest('.pcard'):null;
  if(!pShowDone&&card&&_pvCurDone(p,task)){
    card.classList.add('pv-removing');
    setTimeout(function(){renderParcelles();computePStats();},330);
  } else {
    renderParcelles();computePStats();
  }
}
function pQuickUndoEntry(nom,task,prev,jid){
  var p=PARCELLES.find(function(x){return x.nom===nom;});if(!p)return;
  if(prev===undefined){delete p.taches[task];}else{p.taches[task]=prev;}
  var idx=JOURNAL.findIndex(function(j){return j.id===jid;});if(idx>=0)JOURNAL.splice(idx,1);
  recalcTravaux(task);
  saveData('parcelles');saveData('journal');saveData('travaux');
  if(navigator.vibrate)navigator.vibrate(30);
  renderParcelles();computePStats();
  showToast('↩︎ Validation annulée · '+nom,'#7A4F2E');
}
function pQuickUndo(nom){
  if(!canWrite())return;
  var p=PARCELLES.find(function(x){return x.nom===nom;});if(!p)return;
  var task=pTacheFilter,type=_pvType(task);
  if(type==='simple'){p.taches[task]='En cours';}
  else if(p.taches[task]&&typeof p.taches[task]==='object'){p.taches[task][_pvPrefix(task)+pCurStep]='Non démarré';}
  recalcTravaux(task);
  saveData('parcelles');saveData('travaux');
  if(navigator.vibrate)navigator.vibrate(30);
  renderParcelles();computePStats();
  showToast('↩︎ '+tNom(task)+(type!=='simple'?' '+_pvStepLabel(task)+pCurStep:'')+' remis · '+nom,'#B85A1A');
}
function pQuickStart(nom,evt){
  if(_mvValidBlocked())return;
  if(!canWrite()){showToast(String.fromCodePoint(0x1F512)+' Lecture seule','#7A4F2E');return;}
  var p=PARCELLES.find(function(x){return x.nom===nom;});if(!p)return;
  var task=pTacheFilter,type=_pvType(task);
  if(task==='toutes')return;
  if(!p.taches)p.taches={};
  var date=new Date().toISOString().split('T')[0];
  if(type==='simple'){
    if((p.taches[task]||'Non d\u00e9marr\u00e9')!=='Non d\u00e9marr\u00e9'){renderParcelles();return;}
    p.taches[task]='En cours';
    JOURNAL.unshift({id:Date.now().toString(16),date:date,parcelle:nom,tache:task,qui:currentUser.nom,statut:'En cours',equipe:false,ts_debut:Date.now()});
    injectMeteoIfNeeded(date);
    saveData('journal');
  } else {
    if(pCurStep>_pvEffPlan(p,task))return;
    var pref=_pvPrefix(task);
    var cur=(p.taches[task]&&typeof p.taches[task]==='object')?Object.assign({},p.taches[task]):{ov:(p.taches[task]&&p.taches[task].ov!=null)?p.taches[task].ov:null};
    if(cur[pref+pCurStep]==='Valid\u00e9'||cur[pref+pCurStep]==='Commenc\u00e9'){renderParcelles();return;}
    cur[pref+pCurStep]='Commenc\u00e9';
    p.taches[task]=cur;
  }
  saveData('parcelles');
  if(navigator.vibrate)navigator.vibrate(40);
  showToast(String.fromCodePoint(0x23F3)+' '+tNom(task)+(type!=='simple'?' '+_pvStepLabel(task)+pCurStep:'')+' commenc\u00e9 \u00b7 '+nom,'#B85A1A');
  renderParcelles();computePStats();
  if(typeof refreshMapColors==='function')refreshMapColors();
}
function _pvCurStarted(p,nom){
  nom=nom||pTacheFilter;
  if(_pvType(nom)==='simple')return ((_tachesFor(p)[nom])||'Non d\u00e9marr\u00e9')==='En cours';
  return _pvStepState(p,nom,pCurStep)==='Commenc\u00e9';
}
function _prioShowAll(){_prioOverride=true;renderParcelles();}
function _prioBackToPriority(){_prioOverride=false;var _bits=_prioItems();if(_bits.length){var _bt=_prioDefaultTask(_bits);pTacheFilter=_bt;pCurStep=_pvSmartStep(_bt);}renderParcelles();}
// ── Priorite du moment : multi-taches + equipes affectees (v5.05) ──
// CONFIG.tachesPrio = {saison:'<nom saison active>', items:[{t:'Relevage', equipe:['Dessi','Chloe']}]}
// - additif (n'effleure pas p.taches -> garde anti-ecrasement insensible) ; compat : priorityTask seul = 1 item sans equipe
// - un membre = UNE seule priorite (exclusivite verifiee dans l'editeur ET dedoublonnee au save)
function _prioItems(){
  try{
    var sa=(typeof getSaisonActive==='function')?getSaisonActive():null;
    var ts=(typeof getTachesSaison==='function')?getTachesSaison():[];
    var _valid=function(n){return ts.some(function(t){return t.nom===n;});};
    var tp=(window.CONFIG&&window.CONFIG.tachesPrio)||null;
    if(tp&&Array.isArray(tp.items)&&tp.items.length&&sa&&tp.saison===sa.nom){
      return tp.items.filter(function(it){return it&&it.t&&_valid(it.t);})
        .map(function(it){return {t:it.t,equipe:(typeof _eqtClean==='function')?_eqtClean(it.equipe||[]):(it.equipe||[])};});
    }
    if(typeof priorityTask!=='undefined'&&priorityTask&&_valid(priorityTask)) return [{t:priorityTask,equipe:[]}];
  }catch(e){}
  return [];
}
window._prioItems=_prioItems;
function _prioForMember(nom){
  if(!nom) return null;
  var its=_prioItems();
  for(var i=0;i<its.length;i++){ if((its[i].equipe||[]).indexOf(nom)>=0) return its[i]; }
  return null;
}
window._prioForMember=_prioForMember;
function _prioDefaultTask(its){
  its=its||_prioItems();
  if(!its.length) return '';
  var me=(currentUser&&currentUser.nom)||'';
  for(var i=0;i<its.length;i++){ if(me&&(its[i].equipe||[]).indexOf(me)>=0) return its[i].t; }
  return its[0].t;
}
function _prioPick(i){
  var its=_prioItems(); var it=its[i]; if(!it) return;
  pTacheFilter=it.t; pCurStep=_pvSmartStep(it.t);
  _prioSeedEquipe(it.t);
  renderParcelles();
}
window._prioPick=_prioPick;
var _prioEqSeeded={};
function _prioSeedEquipe(task){
  // Pre-selectionne l'equipe affectee (bandeau Equipe) - 1x par session/tache, modifiable ensuite (guidage souple)
  try{
    if(_prioEqSeeded[task]) return;
    var it=_prioItems().filter(function(x){return x.t===task;})[0];
    if(!it||!(it.equipe&&it.equipe.length)) return;
    _prioEqSeeded[task]=true;
    var cur=_eqtFor(task).slice().sort().join('|'), tgt=it.equipe.slice().sort().join('|');
    if(cur!==tgt) _eqtSet(task, it.equipe.slice());
  }catch(e){}
}
function _pvActions(p){
  if(!canWrite()||p.statut==='Arrachee')return '';
  var task=pTacheFilter,type=_pvType(task);
  if(task==='toutes')return '';
  if(type!=='simple'&&pCurStep>_pvEffPlan(p,task))return '';
  var done=_pvCurDone(p,task);
  var started=_pvCurStarted(p,task);
  var sub=(type!=='simple')?('<span class="pcv-sub">'+_pvStepLabel(task)+pCurStep+'</span>'):'';
  var CK=String.fromCodePoint(0x2713), HG=String.fromCodePoint(0x23F3);
  if(done)return '<div class="pc-actions"><button class="pc-validate done" onclick="pQuickUndo(\''+_escAttr(p.nom)+'\')" aria-label="Annuler">'+CK+sub+'</button></div>';
  var startBtn=started?'':'<button class="pc-start" onclick="pQuickStart(\''+_escAttr(p.nom)+'\',event)" aria-label="Commencer">'+HG+'</button>';
  return '<div class="pc-actions">'+startBtn+'<button class="pc-validate" onclick="pQuickValidate(\''+_escAttr(p.nom)+'\',event)" aria-label="Valider '+_escAttr(tNom(task))+'">'+CK+sub+'</button></div>';
}

window.pQuickValidate=pQuickValidate;
window.pQuickUndo=pQuickUndo;
window.pQuickUndoEntry=pQuickUndoEntry;
window.setPCurStep=setPCurStep;
window.openPTeamJour=openPTeamJour;
window.savePTeamJour=savePTeamJour;
window._pvToggleTeamMbr=_pvToggleTeamMbr;
window._pvApplyTeam=_pvApplyTeam;
window._pvActions=_pvActions;
window.pQuickStart=pQuickStart;
window._pvCurStarted=_pvCurStarted;
window._prioShowAll=_prioShowAll;
window._prioBackToPriority=_prioBackToPriority;
window._mvMapTap=_mvMapTap;
window._mvMapQuickOpen=_mvMapQuickOpen;
window._mvMapQuickValidate=_mvMapQuickValidate;
window._mvMapQuickStart=_mvMapQuickStart;
window._mvMapQuickFiche=_mvMapQuickFiche;
window._mvMapLocate=_mvMapLocate;
window._mvMapHighlight=_mvMapHighlight;
window._pvRenderSubsel=_pvRenderSubsel;
window._pvRenderTeamBar=_pvRenderTeamBar;
window._pvType=_pvType;
window._pvCurDone=_pvCurDone;
window._pvStepChips=_pvStepChips;

/* ════════════════════════════════════════════════════════════════════
   LOT 2 — Indicateur de synchronisation permanent dans les headers [v4.45]
   Point d'état toujours visible : 🟢 synchronisé / 🔵 synchro / 🟠 hors-ligne·N
   Branché sur la plomberie existante (window.showSyncBadge, online/offline,
   _offlineQueueCount). Aucune nouvelle logique réseau.
   ════════════════════════════════════════════════════════════════════ */
var _syncTransient=false,_syncTT=null,_syncLastSync=null;

function _syncMakeDot(){
  var b=document.createElement('button');
  b.className='mv-syncdot synced';
  b.type='button';
  b.setAttribute('aria-label','Synchronisé');
  b.setAttribute('onclick','_syncOpenDetail()');
  b.innerHTML='<span class="mvs-dot"></span><span class="mvs-lbl"></span><span class="mvs-cnt" style="display:none"></span>';
  return b;
}
function _syncEnsureDots(){
  // un point avant chaque bouton ⌂ (goHub) des headers de module
  document.querySelectorAll('button.mod-home-btn').forEach(function(btn){
    var oc=btn.getAttribute('onclick')||'';
    if(oc.indexOf('goHub')<0)return;
    var prev=btn.previousElementSibling;
    if(prev&&prev.classList&&prev.classList.contains('mv-syncdot'))return;
    btn.parentNode.insertBefore(_syncMakeDot(),btn);
  });
}
function _syncSetState(state,count){
  document.querySelectorAll('.mv-syncdot').forEach(function(el){
    el.classList.remove('synced','syncing','offline');
    el.classList.add(state);
    var lbl=el.querySelector('.mvs-lbl'),cnt=el.querySelector('.mvs-cnt');
    if(!lbl||!cnt)return;
    if(state==='synced'){lbl.textContent='';cnt.style.display='none';el.setAttribute('aria-label','Synchronisé');}
    else if(state==='syncing'){lbl.textContent='Synchro…';cnt.style.display='none';el.setAttribute('aria-label','Synchronisation en cours');}
    else{ // offline / en attente
      if(count>0){lbl.textContent='';cnt.style.display='';cnt.textContent=count;}
      else{lbl.textContent='Hors ligne';cnt.style.display='none';}
      el.setAttribute('aria-label','Hors ligne'+(count>0?' — '+count+' en attente':''));
    }
  });
}
function _syncPending(){try{return (typeof window._offlineQueueCount==='function')?(window._offlineQueueCount()||0):0;}catch(e){return 0;}}
function _syncRefresh(){
  if(_syncTransient)return;
  var pending=_syncPending();
  if(!navigator.onLine||pending>0){_syncSetState('offline',pending);}
  else{_syncSetState('synced',0);if(!_syncLastSync)_syncLastSync=Date.now();}
}
function _syncFromMessage(msg){
  msg=String(msg||'');
  if(/Synchronisation|🔄|rétablie|📶|Chargement|Connexion|Actualisation/.test(msg)){
    _syncTransient=true;_syncSetState('syncing',0);
    clearTimeout(_syncTT);_syncTT=setTimeout(function(){_syncTransient=false;_syncRefresh();},1400);
  }else{
    if(/✅|Synchronisé|synchronisée|Actualisé/.test(msg))_syncLastSync=Date.now();
    _syncTransient=false;clearTimeout(_syncTT);_syncRefresh();
  }
}
function _syncAgo(){
  if(!_syncLastSync)return 'à l\'instant';
  var s=Math.round((Date.now()-_syncLastSync)/1000);
  if(s<60)return 'à l\'instant';
  var m=Math.round(s/60);if(m<60)return 'il y a '+m+' min';
  var h=Math.round(m/60);return 'il y a '+h+' h';
}
function _syncQueueBreakdown(){
  try{var raw=localStorage.getItem('mavigne_offline_queue');if(!raw)return [];var q=JSON.parse(raw)||{};return Object.keys(q);}catch(e){return [];}
}
var _PV_KEYLBL={parcelles:'Parcelles',journal:'Journal',sessions:'Tracteur',travaux:'Travaux',traitements:'Phyto',reparateur:'Réparateur',entretiens:'Entretiens',planning_entries:'Planning',planning_acomptes:'Planning (acomptes)',planning_hsup:'Planning (heures sup.)',planning_templates:'Planning (modèles)',config:'Réglages',cave_elevage:'Cave',cave_vendange:'Cave (vendange)'};
function _syncOpenDetail(){
  var b=document.getElementById('sync-pop-body');if(!b){_syncRefresh();return;}
  var pending=_syncPending(),online=navigator.onLine,h='';
  if(online&&pending===0){
    h='<div class="sync-pop-hd"><div class="sync-pop-ico synced">✓</div><div><div class="sync-pop-t">Tout est enregistré</div></div></div>'
     +'<div class="sync-pop-d">Toutes les modifications sont synchronisées dans le cloud.</div>'
     +'<div class="sync-pop-foot">Dernière synchro : '+_syncAgo()+'</div>';
  }else{
    var keys=_syncQueueBreakdown();
    h='<div class="sync-pop-hd"><div class="sync-pop-ico offline">📵</div><div><div class="sync-pop-t">'+(online?'Modifications en attente':'Hors ligne')+'</div></div></div>'
     +'<div class="sync-pop-d">'+(pending>0?(pending+' modification'+(pending>1?'s':'')+' enregistrée'+(pending>1?'s':'')+' sur l\'appareil. '):'')
        +(online?'Synchronisation en cours…':'Elles partiront automatiquement au retour du réseau — tu peux continuer à travailler.')+'</div>';
    if(keys.length){
      h+='<div class="sync-pop-list">'+keys.map(function(k){return '<div class="sync-pop-item"><span>'+_escHtml(_PV_KEYLBL[k]||k)+'</span><span>en attente</span></div>';}).join('')+'</div>';
    }
    h+='<div class="sync-pop-foot">Dernière synchro réussie : '+_syncAgo()+'</div>';
  }
  b.innerHTML=h;
  openOv('ovSync');
}

// Wrap de window.showSyncBadge (posé par utils.js) — préserve la pilule, pilote le point
(function(){
  var _orig=window.showSyncBadge;
  window.showSyncBadge=function(msg,color){
    try{if(typeof _orig==='function')_orig(msg,color);}catch(e){}
    try{_syncFromMessage(msg);}catch(e){}
  };
})();
window.addEventListener('online',function(){setTimeout(_syncRefresh,50);});
window.addEventListener('offline',function(){setTimeout(_syncRefresh,50);});
// ré-injection défensive lors des navigations (pages statiques, mais sûr)
['goHub','goTo'].forEach(function(fn){
  var _o=window[fn];
  if(typeof _o==='function'){window[fn]=function(){var r=_o.apply(this,arguments);try{_syncEnsureDots();_syncRefresh();}catch(e){}return r;};}
});
window._syncOpenDetail=_syncOpenDetail;
window._syncEnsureDots=_syncEnsureDots;
window._syncRefresh=_syncRefresh;
// init (module déféré : DOM prêt)
try{_syncEnsureDots();_syncRefresh();}catch(e){}
setTimeout(function(){try{_syncEnsureDots();_syncRefresh();}catch(e){}},1200);

/* ════════════════════════════════════════════════════════════════════
   LOT 5 — Export PDF du rapport de saison [v4.49]
   HTML imprimable A4 (window.open + print), réutilise getSaisonActive,
   getTachesSaison, recalcTravaux/TRAVAUX, SESSIONS, TRAITEMENTS, JOURNAL.
   ════════════════════════════════════════════════════════════════════ */
// ── Rapport de saison unifié (remplace exportSaisonPDF + exportPDFRapportSaison) ──
function _rsCss(){
return `:root{--cave:#14110D; --cave-2:#1C1813; --cave-3:#241f18;
  --bg-app:#ECE6DB; --bg-card:#FBFAF6; --paper:#fff;
  --terre:#8A5A38; --or:#C2871E; --or-2:#C9A84C; --vert:#3D6B27; --vert-med:#4E7D34; --vert-clair:#8BC474;
  --bordeaux:#7A1020; --acier:#4A9FC8; --acier-2:#8FC7E0; --acier-d:#2E6D8C;
  --texte:#221C15; --texte-doux:#8b8175; --ligne:#EAE3D6; --ligne-2:#F1ECE2;
  --ok:#4E7D34; --ok-bg:#EDF3E7; --warn:#C08328; --warn-bg:#FBF1DE; --bad:#B4432E; --bad-bg:#FBEAE4;}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{font-family:'Outfit',system-ui,sans-serif;background:var(--bg-app);color:var(--texte);line-height:1.5;
  background-image:radial-gradient(circle at 20% -10%,rgba(194,135,30,.05),transparent 55%),radial-gradient(circle at 90% 110%,rgba(61,107,39,.05),transparent 55%)}
/* ───────── FEUILLE A4 ───────── */
.sheet{max-width:210mm;margin:26px auto;background:var(--paper);box-shadow:0 20px 60px rgba(20,17,13,.18);
  border-radius:3px;overflow:hidden}
.pad{padding:0 15mm 12mm}
/* ── Couverture ── */
.cover{position:relative;background:
  radial-gradient(circle at 85% 15%,rgba(194,135,30,.14),transparent 42%),
  linear-gradient(158deg,var(--cave-3) 0%,var(--cave) 55%,#0d0b08 100%);
  color:#fff;padding:34px 15mm 30px;overflow:hidden}
.cover::before{content:"";position:absolute;inset:0;background-image:
  repeating-linear-gradient(90deg,rgba(255,255,255,.02) 0 1px,transparent 1px 42px);opacity:.5}
.cover::after{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;
  background:linear-gradient(90deg,var(--terre),var(--or),var(--vert))}
.cover>*{position:relative}
.cov-eyebrow{font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--or-2);font-weight:600;
  display:flex;align-items:center;gap:12px;margin-bottom:22px}
.cov-eyebrow::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(201,168,76,.5),transparent)}
.cov-dom{font-family:'Cormorant Garamond',serif;font-size:42px;font-weight:700;line-height:1.02;letter-spacing:.3px}
.cov-grape{color:var(--or);font-size:.7em;margin-right:6px}
.cov-sais{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:19px;color:rgba(255,255,255,.62);margin-top:4px}
.cov-meta{font-size:11px;color:rgba(255,255,255,.42);margin-top:14px;display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center}
.cov-meta .dot{width:3px;height:3px;border-radius:50%;background:var(--or);opacity:.6}
.cov-state{display:inline-flex;align-items:center;gap:6px;background:rgba(78,125,52,.18);border:1px solid rgba(139,196,116,.35);
  color:var(--vert-clair);font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 9px;border-radius:20px}
.cov-state.encours{background:rgba(192,131,40,.16);border-color:rgba(224,165,106,.4);color:#E5B36A}
.kpi-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:24px}
.kpi{background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.09);border-radius:11px;padding:13px 12px;text-align:center;position:relative}
.kpi .v{font-size:25px;font-weight:800;line-height:1;color:#fff;letter-spacing:-.5px}
.kpi .v.g{color:var(--vert-clair)}
.kpi .v.o{color:var(--or-2)}
.kpi .v.a{color:var(--acier-2)}
.kpi .l{font-size:8px;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.4);margin-top:5px;font-weight:600}
.kpi .u{font-size:.55em;font-weight:600;opacity:.7;margin-left:1px}
/* ── En-tête de section ── */
.section{margin-top:26px}
.section.brk{page-break-before:always}
.sec-head{display:flex;align-items:baseline;gap:12px;border-bottom:1.5px solid var(--cave);padding-bottom:8px;margin-bottom:14px}
.sec-eyebrow{font-size:9px;letter-spacing:2.6px;text-transform:uppercase;color:var(--terre);font-weight:700;margin-bottom:2px}
.sec-titles{flex:1}
.sec-title{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:700;line-height:1;letter-spacing:.2px;color:var(--cave)}
.sec-title .acc{color:var(--acier-d)}
.sec-title .cop{color:var(--terre)}
.sec-count{font-size:11px;font-weight:700;color:var(--texte-doux);white-space:nowrap;align-self:center;
  background:var(--bg-card);border:1px solid var(--ligne);border-radius:20px;padding:3px 11px}
.sec-note{font-size:10.5px;color:var(--texte-doux);font-style:italic;line-height:1.45;margin:-4px 0 12px}
/* ── Synthèse boxes ── */
.summ{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.sbox{background:var(--bg-card);border:1px solid var(--ligne);border-radius:11px;padding:13px 10px;text-align:center;position:relative;overflow:hidden}
.sbox::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:var(--or-2)}
.sbox.g::before{background:var(--vert)}
.sbox.a::before{background:var(--acier)}
.sbox.c::before{background:var(--terre)}
.sbox .v{font-size:22px;font-weight:800;line-height:1;letter-spacing:-.5px}
.sbox .v.g{color:var(--vert)}
.sbox .v.a{color:var(--acier-d)}
.sbox .v.c{color:var(--terre)}
.sbox .u{font-size:.55em;font-weight:600;color:var(--texte-doux);margin-left:1px}
.sbox .l{font-size:8px;text-transform:uppercase;letter-spacing:.6px;color:var(--texte-doux);margin-top:6px;font-weight:600}
/* ── Tables ── */
table{width:100%;border-collapse:collapse;font-size:11px}
thead tr{background:var(--cave)}
th{color:#fff;padding:7px 9px;text-align:left;font-size:8px;text-transform:uppercase;letter-spacing:.5px;font-weight:600;white-space:nowrap}
th.r,td.r{text-align:right}
th.c,td.c{text-align:center}
td{padding:6px 9px;border-bottom:1px solid var(--ligne-2);vertical-align:middle}
tbody tr:nth-child(even){background:var(--bg-card)}
.tot td{border-top:2px solid var(--cave);font-weight:800;background:#F3EEE4!important;font-size:11px}
.pnom{font-weight:700}
.muted{color:var(--texte-doux)}
.emptyrow td{color:var(--texte-doux);font-style:italic;padding:10px 9px}
.chip-d{display:inline-block;background:var(--ligne-2);border-radius:5px;padding:2px 7px;font-size:9.5px;font-weight:600;color:#5c5348}
.arrow{color:var(--vert-med);font-weight:700;margin:0 3px}
.dur{display:inline-block;background:var(--ok-bg);color:var(--ok);border-radius:8px;padding:1px 8px;font-size:9px;font-weight:700}
/* ── Barre d'avancement ── */
.bar{height:7px;background:#EBE4D8;border-radius:4px;overflow:hidden;width:96px;display:inline-block;vertical-align:middle;margin-right:8px}
.bar>i{display:block;height:100%;border-radius:4px}
.pct{font-weight:800;font-size:11px}
/* ── Tags ── */
.tag{display:inline-block;font-size:9px;font-weight:700;padding:2px 8px;border-radius:6px;white-space:nowrap}
.tag.ok{background:var(--ok-bg);color:var(--ok)}
.tag.warn{background:var(--warn-bg);color:var(--warn)}
.tag.bad{background:var(--bad-bg);color:var(--bad)}
.tag.info{background:#E7F1F6;color:var(--acier-d)}
.tag.neu{background:var(--ligne-2);color:#6a6157}
/* ── Cartes tracteur (parc) ── */
.parc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
.tcard{background:var(--bg-card);border:1px solid var(--ligne);border-radius:11px;padding:11px 12px;position:relative;overflow:hidden}
.tcard::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px}
.tcard.meca::before{background:var(--vert)}
.tcard.hydro::before{background:var(--acier)}
.tcard.rep::before{background:var(--warn)}
.tc-nom{font-weight:800;font-size:12.5px;display:flex;align-items:center;gap:6px}
.tc-mod{font-size:10px;color:var(--texte-doux);margin-bottom:8px}
.tc-line{display:flex;justify-content:space-between;font-size:10px;padding:2.5px 0}
.tc-line b{font-weight:700}
.tc-pill{margin-top:8px;text-align:center;border-radius:8px;padding:5px;font-size:10px;font-weight:800}
.tc-pill.ok{background:var(--ok-bg);color:var(--ok)}
.tc-pill.warn{background:var(--warn-bg);color:var(--warn)}
.tc-pill.bad{background:var(--bad-bg);color:var(--bad)}
.tc-pill.gar{background:#3b2f1e;color:#E5B36A}
/* ── GNR gauge ── */
.gnr{margin-top:11px;background:var(--cave);border-radius:11px;padding:13px 15px;color:#fff;display:flex;align-items:center;gap:16px}
.gnr .ic{font-size:22px}
.gnr .g-body{flex:1}
.gnr .g-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}
.gnr .g-lbl{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.5);font-weight:600}
.gnr .g-val{font-size:16px;font-weight:800}
.gnr .g-val small{font-size:10px;color:rgba(255,255,255,.5);font-weight:600}
.gnr .g-track{height:9px;background:rgba(255,255,255,.12);border-radius:5px;overflow:hidden;position:relative}
.gnr .g-fill{height:100%;border-radius:5px;background:linear-gradient(90deg,var(--terre),var(--or))}
.gnr .g-seuil{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--bad)}
.gnr .g-note{font-size:8.5px;color:rgba(255,255,255,.4);margin-top:5px}
/* ── Entretien fiches ── */
.ent-row{display:flex;align-items:center;gap:12px;background:var(--bg-card);border:1px solid var(--ligne);border-radius:10px;padding:9px 12px;margin-bottom:7px}
.ent-date{text-align:center;flex-shrink:0;min-width:52px}
.ent-date .d{font-size:15px;font-weight:800;line-height:1;color:var(--cave)}
.ent-date .m{font-size:8.5px;text-transform:uppercase;color:var(--texte-doux);font-weight:600;margin-top:1px}
.ent-body{flex:1}
.ent-top{font-size:11.5px;font-weight:700;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ent-checks{margin-top:4px;display:flex;gap:5px;flex-wrap:wrap}
.ent-ck{font-size:9px;padding:1.5px 6px;border-radius:5px;background:var(--ok-bg);color:var(--ok);font-weight:600}
.ent-ck.off{background:var(--ligne-2);color:#b3a89a;text-decoration:line-through}
.ent-ano{font-size:10px;margin-top:5px;padding:5px 9px;border-radius:7px;background:var(--bad-bg);color:var(--bad);font-weight:600}
.ent-ano.ok{background:var(--ok-bg);color:var(--ok)}
/* ── Incidents timeline ── */
.inc{position:relative;border-left:3px solid var(--terre);padding:9px 0 9px 15px;margin-left:5px}
.inc-item{background:var(--bg-card);border:1px solid var(--ligne);border-radius:0 9px 9px 0;padding:10px 13px;margin-bottom:8px;display:flex;justify-content:space-between;gap:12px;align-items:center}
.inc-item.open{border-left:3px solid var(--warn);background:#FDF7EE}
.inc-l .who{font-size:9px;color:var(--texte-doux);font-weight:600}
.inc-l .motif{font-size:12px;font-weight:800;color:var(--cave);margin:2px 0}
.inc-l .meta{font-size:9.5px;color:#7c7264}
.inc-r{flex-shrink:0;text-align:center;border-radius:8px;padding:6px 11px;font-weight:800;font-size:9px}
.inc-r.done{background:var(--ok-bg);color:var(--ok)}
.inc-r.open{background:var(--warn-bg);color:var(--warn)}
.inc-r .big{font-size:11px;display:block}
/* ── Registre phyto : sur-tableau ── */
.phyto-t td{font-size:10px}
.phyto-t .sub{font-size:9px;color:var(--texte-doux)}
.ptype{display:inline-block;padding:1.5px 7px;border-radius:6px;font-size:8px;font-weight:700}
/* ── Cuivre / bio ── */
.cu-band{background:linear-gradient(180deg,#F6EFE4,#F1E8D9);border:1px solid #E4D3B8;border-radius:12px;padding:13px 16px;margin-bottom:14px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.cu-band .big{font-size:30px;font-weight:800;color:var(--terre);line-height:1}
.cu-band .txt{font-size:11px;color:#6a5638}
.cu-band .txt b{color:var(--terre)}
.cu-band .plaf{margin-left:auto;text-align:right;font-size:10px;color:#8a7350}
.cu-band .plaf b{font-size:18px;color:var(--terre);display:block}
.cu-row{display:flex;align-items:center;gap:11px;padding:7px 0;border-bottom:1px solid var(--ligne-2)}
.cu-row .nm{width:150px;font-size:11px;font-weight:700;flex-shrink:0}
.cu-gauge{flex:1;height:12px;background:#EEE6D8;border-radius:6px;position:relative;overflow:hidden}
.cu-gfill{height:100%;border-radius:6px}
.cu-row .rt{width:96px;text-align:right;font-size:10.5px;font-weight:800;flex-shrink:0}
/* ── Heures / ETP ── */
.etp-band{display:grid;grid-template-columns:repeat(4,1fr);gap:0;background:var(--bg-card);border:1px solid var(--ligne);border-radius:11px;overflow:hidden;margin:12px 0}
.etp-cell{text-align:center;padding:11px 8px;border-right:1px solid var(--ligne)}
.etp-cell:last-child{border-right:none}
.etp-cell .v{font-size:20px;font-weight:800;color:var(--cave)}
.etp-cell .v.g{color:var(--vert)}
.etp-cell .l{font-size:8px;text-transform:uppercase;letter-spacing:.6px;color:var(--texte-doux);font-weight:600;margin-top:3px}
.ouv-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:8px}
.ouv{background:var(--bg-card);border:1px solid var(--ligne);border-radius:9px;padding:8px 6px;text-align:center}
.ouv .av{width:26px;height:26px;border-radius:50%;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 5px}
.ouv .nm{font-size:9.5px;font-weight:700}
.ouv .hh{font-size:8.5px;color:var(--texte-doux);margin:3px 0}
.ouv .etpv{font-size:12px;font-weight:800;color:var(--vert);border-top:1px solid var(--ligne-2);padding-top:4px;margin-top:3px}
.hs-band{background:linear-gradient(180deg,#F3EEE4,#EFE7D9);border:1px solid #E5DAC7;border-radius:10px;padding:11px 15px;margin-top:11px;display:flex;align-items:center;gap:14px}
.hs-band .hs-v{font-size:24px;font-weight:800;color:var(--bordeaux)}
.hs-band .hs-t b{font-weight:700}
.hs-band .hs-t{font-size:11px;color:#6a5f52}
/* ── Cave ── */
.cave-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.cave-op{background:var(--bg-card);border:1px solid var(--ligne);border-radius:9px;padding:9px 12px;display:flex;gap:10px;align-items:center}
.cave-op .ic{font-size:18px}
.cave-op .t{font-size:11.5px;font-weight:700}
.cave-op .s{font-size:9.5px;color:var(--texte-doux)}
/* ── Signatures + credit ── */
.sig-row{display:flex;gap:50px;margin-top:34px}
.sig{flex:1;border-top:1px solid #D8D1C5;padding-top:8px;font-size:10.5px;color:var(--texte-doux);text-align:center;font-weight:600}
.credit{margin-top:22px;border-top:1px solid var(--ligne-2);padding-top:11px;text-align:center;font-size:8.5px;color:#c2bbb0}
.credit b{color:#9a9186}
.foot-band{background:var(--cave);color:rgba(255,255,255,.4);font-size:8px;padding:8px 15mm;display:flex;justify-content:space-between;
  border-top:3px solid transparent;border-image:linear-gradient(90deg,var(--terre),var(--or),var(--vert)) 1}
@media(max-width:640px){
  .kpi-strip,.summ,.etp-band{grid-template-columns:repeat(2,1fr)}
  .parc-grid,.ouv-grid,.cave-grid{grid-template-columns:1fr}
  .cov-dom{font-size:32px} .sheet{margin:12px 8px}
  .cu-row .nm{width:100px}
}
@media print{
  @page{size:A4;margin:0}
  body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  
  .sheet{margin:0;box-shadow:none;max-width:none;border-radius:0}
  .section{break-inside:avoid}
  tr,.tcard,.inc-item,.ent-row,.cu-row,.ouv,.cave-op{break-inside:avoid}
}`;
}
window._rsCss=_rsCss;

// ══════════════════════════════════════════════════════════════════════════════
// RAPPORT DE SAISON — unifié + sélecteur de saison
// Remplace exportSaisonPDF (app.js) ET exportPDFRapportSaison (reglages.js).
// Sélecteur : openRapportSaison() ouvre #ovRapportSaison (liste des saisons).
// Génération : exportRapportSaison(nom) — scope la saison choisie via le pointeur
// LOCAL _VISU_SAISON (aucune écriture Firestore ; restauré en fin), exactement
// comme _switchSaison. TRAVAUX / getTachesSaison / _sessInSaison / _tachesFor
// pointent alors sur la saison demandée. ETP par saison : CONFIG.etp_saisons[nom].
// ══════════════════════════════════════════════════════════════════════════════
function openRapportSaison(){
  if(typeof isAdmin==='function' && !isAdmin()){ showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#7A4F2E'); return; }
  var list=document.getElementById('rs-season-list');
  if(!list){ exportRapportSaison(); return; }
  var actNom=((getSaisonActive()||{}).nom)||'';
  var vue=(typeof _visuSaison==='function'?_visuSaison():actNom);
  var arr=(window.SAISONS||[]).slice().sort(function(a,b){return (b.debut||'').localeCompare(a.debut||'');});
  if(!arr.length)arr=[{nom:actNom,periode:''}];
  list.innerHTML=arr.map(function(s){
    var act=s.nom===actNom, cons=(s.nom===vue)&&!act;
    var nomEsc=(window._escAttr?_escAttr(s.nom):s.nom), htmlNom=_escHtml(s.nom);
    var sub=_escHtml(s.periode||(((s.debut||'')&&(s.fin||''))?((s.debut||'')+' \u2192 '+(s.fin||'')):''));
    var badge=act?'<span style="margin-left:8px;font-size:10px;font-weight:700;color:#2C6E29;background:rgba(61,107,39,.14);padding:2px 8px;border-radius:20px">active</span>'
             :(cons?'<span style="margin-left:8px;font-size:10px;font-weight:700;color:#7A4F2E;background:rgba(138,90,56,.14);padding:2px 8px;border-radius:20px">consult\u00e9e</span>':'');
    return '<div onclick="closeOv(null,\'ovRapportSaison\');exportRapportSaison(\''+nomEsc+'\')" '
      +'style="display:flex;align-items:center;gap:12px;padding:14px 16px;margin-bottom:10px;background:var(--fond-module,#FBFAF6);border:1px solid var(--gris,#e5e2d8);border-radius:14px;cursor:pointer">'
      +'<div style="width:40px;height:40px;border-radius:11px;background:linear-gradient(135deg,#7A1020,#8A5A38);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">\uD83D\uDCC4</div>'
      +'<div style="flex:1;min-width:0"><div style="font-family:\'Cormorant Garamond\',serif;font-size:19px;font-weight:700;color:var(--texte,#2A2118);line-height:1.1">'+htmlNom+badge+'</div>'
      +(sub?'<div style="font-size:11px;color:var(--texte-doux,#8a8a7a);margin-top:2px">'+sub+'</div>':'')+'</div>'
      +'<div style="font-size:18px;color:var(--texte-doux,#8a8a7a)">\u203a</div></div>';
  }).join('');
  _openOv('ovRapportSaison');
}
window.openRapportSaison=openRapportSaison;

function exportRapportSaison(seasonNom){
  if(typeof isAdmin==='function' && !isAdmin()){ showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#7A4F2E'); return; }
  var S=(window.SAISONS||[]).find(function(s){return s&&s.nom===seasonNom;})
        || (typeof getSaisonActive==='function'?getSaisonActive():{nom:'Saison',periode:''});
  if(!S)S={nom:'Saison',periode:''};

  // ── Bascule LOCALE du pointeur de saison (zéro écriture Firestore) ──
  var _prevVisu=_VISU_SAISON;
  function _rebuild(){ try{ Object.keys(TRAVAUX).forEach(function(n){delete TRAVAUX[n];}); TACHES.forEach(function(t){recalcTravaux(t.nom);}); window.TRAVAUX=TRAVAUX; }catch(e){} }
  _VISU_SAISON=S.nom; _rebuild();

  try{
    var dom=window.DOMAINE_NOM||'Domaine';
    var surfTot=(typeof _recalcSurfTotale==='function'?_recalcSurfTotale():parseFloat(SURF_TOTALE))||0;
    var parcActives=PARCELLES.filter(function(p){return p.statut!=='Arrachee';});
    var parcArr=PARCELLES.filter(function(p){return p.statut==='Arrachee';});
    var now=new Date();
    var dStr=now.toLocaleDateString('fr-FR'), tStr=now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
    var esc=function(s){return (typeof _escHtml==='function')?_escHtml(String(s==null?'':s)):String(s==null?'':s);};
    var f0=function(n){return Math.round(n||0).toLocaleString('fr-FR');};
    var pctCol=function(p){return p>=100?'#3D6B27':p>=70?'#6E9A3A':p>=40?'#C08328':'#B4432E';};
    var cuCol=function(r){return r>1?'#B4432E':r>=.875?'#C08328':r>=.75?'#C2871E':'#3D6B27';};
    var frD=function(d){if(!d)return '\u2014';var p=String(d).split('-');return p.length>=3?(parseInt(p[2],10)+'/'+p[1]+'/'+p[0]):d;};
    var Mfr=['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];
    var fDs=function(d){if(!d)return '\u2014';var p=String(d).split('-');if(p.length<3)return d;return parseInt(p[2],10)+' '+Mfr[parseInt(p[1],10)-1];};
    var hasWin=!!(S.debut&&S.fin);
    var inWin=function(d){ if(!hasWin)return true; if(!d)return false; return d>=S.debut&&d<=S.fin; };

    // ── 1) Avancement par tâche ──
    var taches=(typeof getTachesSaison==='function')?getTachesSaison():[];
    function dureeTache(nom){
      var ds=JOURNAL.filter(function(j){return j&&j.tache===nom&&(j.statut==='Valid\u00e9')&&inWin(j.date);}).map(function(j){return j.date;}).sort();
      if(!ds.length)return null; var d1=ds[0],dN=ds[ds.length-1];
      return {d1:d1,dN:dN,j:Math.round((new Date(dN)-new Date(d1))/86400000)+1};
    }
    var sHd=0,sHt=0,sHr=0;
    var trows=taches.map(function(t){
      try{recalcTravaux(t.nom);}catch(e){}
      var tw=TRAVAUX[t.nom]; if(!tw)return '';
      sHd+=tw.h_done||0; sHt+=tw.h_total||0; sHr+=tw.h_reste||0;
      var pc=tw.pct||0,c=pctCol(pc),du=dureeTache(t.nom);
      var isReel=(t.trous||t.nom==='Pioche'||t.nom==='Entreplantation');
      return '<tr><td class="pnom">'+esc(tNom(t.nom))+(isReel?' <span class="tag neu" style="font-size:8px">temps r\u00e9el</span>':'')+'</td>'
        +'<td><span class="bar"><i style="width:'+pc+'%;background:'+c+'"></i></span><span class="pct" style="color:'+c+'">'+pc+'\u00a0%</span></td>'
        +'<td class="r muted">'+(tw.surf_done||0).toFixed(1)+' / '+(tw.surf_total||surfTot).toFixed(2)+' ha</td>'
        +'<td class="c">'+(du?'<span class="chip-d">'+fDs(du.d1)+'</span><span class="arrow">\u2192</span><span class="chip-d">'+fDs(du.dN)+'</span>':'\u2014')+'</td>'
        +'<td class="c">'+(du?'<span class="dur">'+du.j+' j</span>':'\u2014')+'</td>'
        +'<td class="r">'+f0(tw.h_done)+' h</td><td class="r muted">'+f0(tw.h_total)+' h</td>'
        +'<td class="r">'+((tw.h_reste||0)>0?f0(tw.h_reste)+' h':'\u2014')+'</td></tr>';
    }).join('');
    var gPct=sHt>0?Math.round(sHd/sHt*100):0;

    // ── 2) Bilan par parcelle ──
    var mt=(typeof _plantMinTrou==='function')?_plantMinTrou():3;
    var trousTot=parcActives.reduce(function(s,p){return s+(p.plantation_trous||0);},0);
    var anyTrous=trousTot>0;
    var anyCu=(typeof window._cuParcRollSum==='function') && parcActives.some(function(p){return window._cuParcRollSum(p.nom)>0;});
    function parcDates(nom){
      var ds=JOURNAL.filter(function(j){return j&&j.parcelle===nom&&(j.statut==='Valid\u00e9')&&inWin(j.date);}).map(function(j){return j.date;}).sort();
      return {d1:ds[0],dN:ds[ds.length-1]};
    }
    var prows=parcActives.map(function(p){
      var ok=taches.filter(function(t){return getTacheStatut(p,t.nom)==='Valid\u00e9';}).length, tot=taches.length;
      var dd=parcDates(p.nom);
      var cu=anyCu?window._cuParcRollSum(p.nom):0, cuR=cu/28;
      return '<tr><td class="pnom">'+esc(p.nom)+'</td>'
        +'<td class="r muted">'+(parseFloat(p.surface)||0).toFixed(2)+' ha</td>'
        +'<td class="c"><span class="tag '+(tot>0&&ok>=tot?'ok':ok>=tot*0.5?'warn':'neu')+'">'+ok+'/'+tot+' \u2713</span></td>'
        +'<td class="c">'+(dd.d1?'<span class="chip-d">'+fDs(dd.d1)+'</span><span class="arrow">\u2192</span><span class="chip-d">'+fDs(dd.dN)+'</span>':'\u2014')+'</td>'
        +(anyTrous?'<td class="r">'+((p.plantation_trous||0)>0?'\uD83E\uDE9B '+p.plantation_trous:'\u2014')+'</td>':'')
        +(anyCu?'<td class="r" style="font-weight:700;color:'+cuCol(cuR)+'">'+(cu>0?cu.toFixed(1)+' <span class="muted" style="font-weight:400;font-size:9px">/28</span>':'\u2014')+'</td>':'')
        +'</tr>';
    }).join('');

    // ── 3) Travaux tracteur (sessions) ──
    var sess=(window.SESSIONS||SESSIONS||[]).slice().filter(window._sessInSaison||function(){return true;}).sort(function(a,b){return (a.date||'').localeCompare(b.date||'');});
    var TL=window.TRACTEURS_LIST||[];
    function tracNom(id){var t=TL.find(function(x){return x.id===id;});return t?t.nom:'';}
    var srows=sess.map(function(s){
      var st=s.statut||'',done=((s.avancement||0)>=100||st==='Valid\u00e9'||st==='Termin\u00e9');
      var tn=s.tracteurId?tracNom(s.tracteurId):'';
      return '<tr><td class="pnom">'+esc((s.emoji||'\uD83D\uDE9C')+' '+(s.activite||''))+'</td>'
        +'<td class="muted">'+esc(tn)+'</td><td>'+esc(s.conducteur||'')+'</td>'
        +'<td class="r muted">'+((s.surface!=null)?(parseFloat(s.surface)||0).toFixed(2)+' ha':'\u2014')+'</td>'
        +'<td class="c"><span class="tag '+(done?'ok':'warn')+'">'+esc(st||((s.avancement||0)+'%'))+'</span></td>'
        +'<td class="r"><span class="pct" style="color:'+pctCol(s.avancement||0)+'">'+(s.avancement||0)+' %</span></td></tr>';
    }).join('');

    // ── 4) Parc & entretien ──
    var REP=window.REPARATEUR||{}, HIST=window.REPARATEUR_HIST||{}, ENT=window.ENTRETIENS||[];
    var cfgG=(window.CONFIG&&window.CONFIG.gnr)||null;
    var pcards=TL.map(function(t){
      var isMeca=(t.type==='m\u00e9canique'), rep=REP[t.id];
      var comp=t.compteur_h, rev=t.revision_h;
      var pill;
      if(rep){ pill='<div class="tc-pill gar">\uD83D\uDD27 Au garage'+(rep.prevu_retour?' \u00b7 retour '+frD(rep.prevu_retour):'')+'</div>'; }
      else if(comp!=null&&rev!=null&&comp!==''&&rev!==''){ var reste=(parseFloat(rev)||0)-(parseFloat(comp)||0); var cc=reste<=50?'bad':reste<=120?'warn':'ok'; pill='<div class="tc-pill '+cc+'">'+(reste<=50?'\u26a0\ufe0f ':'')+'r\u00e9vision dans '+reste+' h</div>'; }
      else { pill='<div class="tc-pill warn">R\u00e9vision \u00e0 renseigner</div>'; }
      return '<div class="tcard '+(rep?'rep':(isMeca?'meca':'hydro'))+'">'
        +'<div class="tc-nom">'+(isMeca?'\uD83D\uDFE2':'\uD83D\uDD35')+' '+esc(t.nom)+'</div>'
        +'<div class="tc-mod">'+esc(t.modele||t.type||'')+'</div>'
        +'<div class="tc-line"><span class="muted">Compteur</span><b>'+((comp!=null&&comp!=='')?comp+' h':'\u2014')+'</b></div>'
        +'<div class="tc-line"><span class="muted">R\u00e9vision \u00e0</span><b>'+((rev!=null&&rev!=='')?rev+' h':'\u2014')+'</b></div>'
        +(rep?'<div class="tc-line"><span class="muted">Motif</span><b style="color:#C08328">'+esc(rep.motif||'\u2014')+'</b></div>':'')
        +pill+'</div>';
    }).join('');
    var gnrHtml='';
    if(cfgG&&cfgG.capacite){
      var cap=parseFloat(cfgG.capacite)||0, niv=parseFloat(cfgG.niveau)||0, seuil=parseFloat(cfgG.seuil)||0;
      var fill=cap>0?Math.min(100,Math.round(niv/cap*100)):0, low=niv<=seuil;
      gnrHtml='<div class="gnr"><div class="ic">\u26FD</div><div class="g-body">'
        +'<div class="g-top"><span class="g-lbl">Cuve GNR du domaine</span><span class="g-val">'+f0(niv)+' <small>/ '+f0(cap)+' L</small></span></div>'
        +'<div class="g-track"><div class="g-fill" style="width:'+fill+'%;'+(low?'background:linear-gradient(90deg,#B4432E,#C08328)':'')+'"></div>'+(cap>0?'<div class="g-seuil" style="left:'+Math.round(seuil/cap*100)+'%"></div>':'')+'</div>'
        +'<div class="g-note">Seuil d\u2019alerte '+f0(seuil)+' L'+(cfgG.maj?' \u00b7 mise \u00e0 jour '+esc(cfgG.maj):'')+(low?' \u00b7 \u26a0\ufe0f sous le seuil':'')+'</div>'
        +'</div></div>';
    }
    var entWin=ENT.filter(function(e){return inWin(e.date);}).sort(function(a,b){return (b.date||'').localeCompare(a.date||'');});
    var CKF=[['plein','Plein','\u26FD'],['huile','Huile','\uD83D\uDEE2\uFE0F'],['filtre_air','Filtre air','\uD83D\uDCA8'],['radiateur','Radiateur','\uD83C\uDF00'],['pression_pneu','Pneus','\uD83D\uDD35'],['lavage','Lavage','\uD83E\uDEA3']];
    var entHtml=entWin.map(function(e){
      var tn=e.tracteurId?tracNom(e.tracteurId):'';
      var p=String(e.date||'').split('-');
      var cks=CKF.map(function(a){return '<span class="ent-ck '+(e[a[0]]?'':'off')+'">'+a[2]+' '+a[1]+'</span>';}).join('');
      var nOk=CKF.reduce(function(s,a){return s+(e[a[0]]?1:0);},0);
      var ano=(e.anomalie&&String(e.anomalie).trim());
      var anoBlk=ano?'<div class="ent-ano '+(e.anomalie_traitee?'ok':'')+'">'+(e.anomalie_traitee?'\u2705':'\u26a0\ufe0f')+' '+esc(e.anomalie)+'</div>':'';
      return '<div class="ent-row"><div class="ent-date"><div class="d">'+(p[2]||'')+'</div><div class="m">'+(p[1]?Mfr[parseInt(p[1],10)-1]:'')+'</div></div>'
        +'<div class="ent-body"><div class="ent-top">'+esc(tn)+' <span class="tag neu">'+nOk+'/6 points</span>'+(e.conducteur?' <span class="muted" style="font-size:10px">\u00b7 '+esc(e.conducteur)+'</span>':'')+'</div>'
        +'<div class="ent-checks">'+cks+'</div>'+anoBlk+'</div></div>';
    }).join('');

    // ── 5) Incidents & réparations tracteur ──
    var incArr=[];
    Object.keys(REP).forEach(function(id){var r=REP[id];if(!r)return;incArr.push({trac:tracNom(id)||('Tracteur '+id),motif:r.motif||'R\u00e9paration',depuis:r.depuis||'',retour:r.prevu_retour||'',rep:r.reparateur||'',open:true});});
    Object.keys(HIST).forEach(function(id){(HIST[id]||[]).forEach(function(r){ if(!inWin(r.retour)&&!inWin(r.depuis))return; incArr.push({trac:tracNom(id)||('Tracteur '+id),motif:r.motif||'R\u00e9paration',depuis:r.depuis||'',retour:r.retour||'',rep:r.reparateur||'',open:false});});});
    incArr.sort(function(a,b){return (b.depuis||'').localeCompare(a.depuis||'');});
    function immob(d1,d2){if(!d1||!d2)return '\u2014';var n=Math.round((new Date(d2)-new Date(d1))/86400000);return (n>=0?n:0)+' j';}
    var incHtml=incArr.map(function(a){
      return '<div class="inc-item '+(a.open?'open':'')+'"><div class="inc-l"><div class="who">'+esc(a.trac)+'</div>'
        +'<div class="motif">'+esc(a.motif)+'</div><div class="meta">Depuis le '+frD(a.depuis)+(a.rep?' \u00b7 '+esc(a.rep):'')+' \u00b7 immobilisation '+immob(a.depuis,a.retour)+'</div></div>'
        +'<div class="inc-r '+(a.open?'open':'done')+'">'+(a.open?'Retour pr\u00e9vu':'R\u00e9par\u00e9')+'<span class="big">'+frD(a.retour)+'</span></div></div>';
    }).join('');
    var nOpen=incArr.filter(function(a){return a.open;}).length;

    // ── 6) Réparations ponctuelles vigne (journal) ──
    var repByP={};
    JOURNAL.forEach(function(j){ if(!j||j.tache!=='R\u00e9paration ponctuelle'||!inWin(j.date))return;
      var k=j.parcelle||'?'; if(!repByP[k])repByP[k]={types:{},qte:0,last:''};
      (j.reparation_types||[]).forEach(function(ty){repByP[k].types[ty]=(repByP[k].types[ty]||0)+1;});
      repByP[k].qte+=(j.reparation_qte||0); if((j.date||'')>repByP[k].last)repByP[k].last=j.date||'';
    });
    var repKeys=Object.keys(repByP).sort(), rvTot=repKeys.reduce(function(s,k){return s+(repByP[k].qte||0);},0);
    var rvHtml=repKeys.map(function(k){var r=repByP[k];return '<tr><td class="pnom">'+esc(k)+'</td><td class="muted">'+esc(Object.keys(r.types).join(', '))+'</td><td class="r">'+(r.qte||'\u2014')+'</td><td class="r muted">'+frD(r.last)+'</td></tr>';}).join('');

    // ── 7) Registre phytosanitaire ──
    var TBG={'Cuivre':'#E7F0E4','Soufre':'#FCF6DD','Fongicide':'#E7EEF7','Insecticide':'#FBEAE4','Herbicide':'#E7F0E7','Biocontr\u00f4le':'#EAF3EC'};
    var TCOL={'Cuivre':'#1E5A2E','Soufre':'#9A7A12','Fongicide':'#1A4A7A','Insecticide':'#922B21','Herbicide':'#1E3A12','Biocontr\u00f4le':'#2C6E49'};
    var _actCnt=parcActives.length;
    function zoneTxt(t){var a=t.parcelles;if(typeof a==='string')return a||'Domaine entier';if(!a||!a.length)return 'Domaine entier';if(_actCnt&&a.length>=_actCnt)return 'Domaine entier';if(a.length<=3)return a.join(', ');return a.slice(0,3).join(', ')+' +'+(a.length-3);}
    var trait=(window.TRAITEMENTS||[]).slice().filter(function(t){return inWin(t.date);}).sort(function(a,b){return (a.date||'').localeCompare(b.date||'');});
    var phRows=trait.map(function(t){
      var m=window._phResolve?window._phResolve(t):{type:t.type||'\u2014',amm:t.amm||'',dar:(t.dar!=null?t.dar:0),drae:t.drae||0,sub:t.sub||'',dose:t.dose||''};
      var darR;var darBase=(m.dar!=null?m.dar:0);
      if(darBase>0&&t.date){var r=Math.max(0,darBase-Math.floor((now-new Date(t.date))/86400000)); darR=r>0?'<span class="tag warn">'+r+' j \u26a0</span>':'<span class="tag ok">respect\u00e9 \u2713</span>';}
      else darR='<span class="tag ok">respect\u00e9 \u2713</span>';
      var dre='\u2014';
      if(typeof dreEffectif==='function'){var _d=dreEffectif(m.drae,m.type,m.dreH,m.dreHc);if(_d&&_d.h)dre=_d.h+' h';}
      else if(m.drae)dre=m.drae+' h';
      return '<tr><td><div class="pnom">'+esc(t.produit||'')+'</div>'+((m.sub||m.amm)?'<div class="sub">'+esc(m.sub||'')+(m.amm?' \u00b7 AMM '+esc(m.amm):'')+'</div>':'')+'</td>'
        +'<td><span class="ptype" style="background:'+(TBG[m.type]||'#f0f0f0')+';color:'+(TCOL[m.type]||'#666')+'">'+esc(m.type||'\u2014')+'</span></td>'
        +'<td>'+fDs(t.date)+'</td><td>'+esc(m.dose||t.dose||'')+'</td><td class="muted">'+esc(t.stade||'\u2014')+'</td>'
        +'<td class="muted">'+esc(zoneTxt(t))+'</td><td>'+esc(t.conducteur||t.operateur||'')+'</td>'
        +'<td class="c">'+darR+'</td><td class="c muted">'+dre+'</td></tr>';
    }).join('');

    // ── 8) Conformité cuivre (bio) ──
    var cuHtml='';
    if(anyCu){
      var cuList=parcActives.map(function(p){return {nom:p.nom,surf:parseFloat(p.surface)||0,cu:window._cuParcRollSum(p.nom)};}).filter(function(x){return x.cu>0;}).sort(function(a,b){return b.cu-a.cu;});
      var maxCu=cuList.reduce(function(m,x){return Math.max(m,x.cu);},0);
      var wSum=cuList.reduce(function(s,x){return s+x.cu*x.surf;},0), sSum=cuList.reduce(function(s,x){return s+x.surf;},0);
      var wAvg=sSum>0?wSum/sSum:0, nOver=cuList.filter(function(x){return x.cu>28;}).length;
      var cuRows=cuList.map(function(x){var r=x.cu/28;return '<div class="cu-row"><div class="nm">'+esc(x.nom)+'</div>'
        +'<div class="cu-gauge"><div class="cu-gfill" style="width:'+Math.min(100,r*100)+'%;background:'+cuCol(r)+'"></div></div>'
        +'<div class="rt" style="color:'+cuCol(r)+'">'+x.cu.toFixed(1)+' <span class="muted" style="font-weight:400">/ 28</span></div></div>';}).join('');
      cuHtml='<div class="section">'
        +'<div class="sec-head"><div class="sec-titles"><div class="sec-eyebrow">Certification bio</div><div class="sec-title"><span class="cop">Conformit\u00e9 cuivre</span> \u2014 7 ans glissants</div></div><div class="sec-count">'+(nOver===0?'0 d\u00e9passement \u2713':nOver+' \u00e0 surveiller')+'</div></div>'
        +'<div class="cu-band"><div><div class="big">'+maxCu.toFixed(1)+'</div><div class="txt"><b>Max parcelle</b> liss\u00e9 7 ans (kg/ha)</div></div>'
        +'<div><div class="big" style="font-size:22px">'+wAvg.toFixed(1)+'</div><div class="txt">Moyenne <b>pond\u00e9r\u00e9e</b> domaine</div></div>'
        +'<div class="plaf">Plafond UE<b>28 kg/ha</b>sur 7 ans (\u2248 4 kg/ha/an)</div></div>'
        +cuRows
        +'<div class="sec-note">Cumul du cuivre m\u00e9tal (kg/ha) sur 7 ann\u00e9es glissantes vs plafond 28 kg/ha. Vert &lt; 75 % \u00b7 or 75\u201387 % \u00b7 orange 87\u2013100 % \u00b7 rouge &gt; plafond. Indicatif \u2014 \u00e0 recouper avec l\u2019organisme certificateur.</div></div>';
    }

    // ── 9) Heures & ETP — présence (Planning/manuel) répartie en Travaux vigne / Tracteur / Autres ──
    var cd=(window._chargeSaisonData)?window._chargeSaisonData(S):null;
    var etpMap=(window.CONFIG&&window.CONFIG.etp_saisons)||{};
    var etpManual=etpMap[S.nom]||(S.active?((window.CONFIG&&window.CONFIG.etp_saison)||null):null);
    var _manHas=!!(etpManual&&((parseFloat(etpManual.h_dues)||0)>0||(parseFloat(etpManual.h_faites)||0)>0));
    var etpAuto=(!_manHas&&window._planSeasonHours)?window._planSeasonHours(S):null;
    var presPrev=_manHas?(parseFloat(etpManual.h_dues)||0):((cd&&cd.capEquipe>0)?cd.capEquipe:(etpAuto?etpAuto.h_dues:0));
    var worked=_manHas?(parseFloat(etpManual.h_faites)||0):(etpAuto?etpAuto.h_faites:0);
    var presSrc=_manHas?'manuel':((cd&&cd.capEquipe>0)?'planning':(etpAuto?'planning':'none'));
    var capRef=cd?cd.capRefTotal:0;
    var vigneH=cd?Math.round(cd.charge):0;
    var tractH=(window._tractHoursSeason)?Math.round(window._tractHoursSeason(S)||0):0;
    if(vigneH+tractH>Math.round(presPrev))tractH=Math.max(0,Math.round(presPrev)-vigneH);
    var autresH=Math.max(0,Math.round(presPrev)-vigneH-tractH);
    var _etpS=function(h){return (capRef>0)?(h/capRef).toFixed(1):'\u2014';};
    var etpEquipe=_etpS(presPrev);
    var etpV=(capRef>0)?etpEquipe:((presPrev>0&&worked>0)?(worked/presPrev).toFixed(2):'\u2014');
    var pctV=presPrev>0?Math.round(vigneH/presPrev*100):0;
    var pctT=presPrev>0?Math.round(tractH/presPrev*100):0;
    var pctA=presPrev>0?Math.max(0,100-pctV-pctT):0;
    var wV=presPrev>0?(vigneH/presPrev*100):0, wT=presPrev>0?(tractH/presPrev*100):0, wA=Math.max(0,100-wV-wT);
    var _rich=(presPrev>0&&vigneH>0&&capRef>0);
    var etpBand;
    if(_rich){
      var tag=(presSrc==='manuel')?'\u270E saisie manuelle (R\u00e9glages)':'\uD83D\uDD17 depuis le Planning';
      etpBand='<div style="display:flex;align-items:center;gap:16px;background:linear-gradient(135deg,#14110D,#1C1813);border-radius:12px;padding:16px 20px;color:#F2EFE7;position:relative;overflow:hidden;margin-bottom:4px">'
        +'<div style="font-size:24px;opacity:.9">\uD83D\uDC65</div>'
        +'<div><div style="font-family:\'Cormorant Garamond\',serif;font-size:32px;font-weight:700;line-height:1">'+f0(presPrev)+' <span style="font-size:15px;opacity:.7">h</span></div>'
        +'<div style="font-size:11px;opacity:.82;margin-top:2px">Pr\u00e9sence de l\u2019\u00e9quipe sur la saison ('+tag+')'+((worked>0)?(' \u00b7 dont '+f0(worked)+' h travaill\u00e9es'):'')+'</div></div>'
        +'<div style="margin-left:auto;text-align:right"><div style="font-size:18px;font-weight:800">'+etpEquipe+' ETP</div><div style="font-size:9px;opacity:.7;text-transform:uppercase;letter-spacing:.5px">\u00e9quipe</div></div></div>';
      var _seg=function(w,grad,txt){ return (w>0.5)?('<div style="width:'+w+'%;background:'+grad+';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden">'+txt+'</div>'):''; };
      etpBand+='<div style="font-size:12px;font-weight:600;color:var(--texte-doux);margin:16px 0 8px">O\u00f9 va la pr\u00e9sence</div>'
        +'<div style="display:flex;height:32px;border-radius:9px;overflow:hidden;border:1px solid var(--ligne)">'
        +_seg(wV,'linear-gradient(180deg,#5C8A3A,#3D6B27)','Vigne \u00b7 '+f0(vigneH)+' h')
        +_seg(wT,'linear-gradient(180deg,#6FB6D6,#4A9FC8)','Tracteur \u00b7 '+f0(tractH)+' h')
        +_seg(wA,'linear-gradient(180deg,#B98A5E,#8A5A38)','Autres \u00b7 '+f0(autresH)+' h')
        +'</div>';
      var _lg=function(col,titre,val,pct,sub,etp){ return '<div style="display:flex;align-items:flex-start;gap:8px;flex:1;min-width:170px"><span style="width:11px;height:11px;border-radius:3px;background:'+col+';margin-top:3px;flex-shrink:0"></span><div><b style="font-size:12.5px">'+titre+' \u2014 '+f0(val)+' h ('+pct+'\u00a0%)</b><div style="color:var(--texte-doux);font-size:10.5px">'+sub+'</div><div style="color:var(--texte-doux);font-size:10.5px;font-weight:600">\u2248 '+etp+' ETP</div></div></div>'; };
      etpBand+='<div style="display:flex;gap:16px;margin-top:11px;flex-wrap:wrap">'
        +_lg('#3D6B27','Travaux vigne',vigneH,pctV,'au bar\u00e8me \u00ab travail \u00e0 la t\u00e2che \u00bb',_etpS(vigneH))
        +((tractH>0)?_lg('#4A9FC8','Tracteur',tractH,pctT,'estim\u00e9 au bar\u00e8me h/ha par passage',_etpS(tractH)):'')
        +_lg('#8A5A38','Autres',autresH,pctA,((tractH>0)?'cave, trajet, entretien, montage, bureau\u2026':'tracteur, cave, trajet, entretien, montage, bureau\u2026'),_etpS(autresH))
        +'</div>';
      var _vpct=vigneH>0?Math.round(sHd/vigneH*100):0; if(_vpct>100)_vpct=100;
      etpBand+='<div style="display:grid;grid-template-columns:1.3fr 1fr;gap:12px;margin-top:18px">'
        +'<div style="border:1px solid var(--ligne);border-radius:12px;padding:14px 16px;background:#fff">'
        +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--texte-doux)">Travaux vigne \u2014 avancement</div>'
        +'<div style="display:flex;align-items:baseline;gap:9px;margin-top:8px"><span style="font-family:\'Cormorant Garamond\',serif;font-size:30px;font-weight:700;color:#3D6B27">'+_vpct+'\u00a0%</span><span style="font-size:12px;color:var(--texte-doux)">'+f0(sHd)+' h r\u00e9alis\u00e9es / '+f0(vigneH)+' h au total</span></div>'
        +'<div style="height:9px;background:var(--ligne);border-radius:6px;overflow:hidden;margin-top:10px"><i style="display:block;height:100%;width:'+_vpct+'%;background:linear-gradient(90deg,#5C8A3A,#3D6B27);border-radius:6px"></i></div></div>'
        +'<div style="border:1px solid rgba(61,107,39,.22);border-radius:12px;padding:14px;background:linear-gradient(135deg,rgba(61,107,39,.08),rgba(194,135,30,.08));display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">'
        +'<div style="font-family:\'Cormorant Garamond\',serif;font-size:38px;font-weight:700;color:#3D6B27;line-height:1">'+_etpS(vigneH)+'<span style="font-size:15px;color:#8A5A38"> ETP</span></div>'
        +'<div style="font-size:12px;font-weight:600;margin-top:4px">ETP vigne</div><div style="font-size:10px;color:var(--texte-doux);margin-top:3px">pour les seuls travaux vigne</div></div></div>';
    } else {
      var hDues=Math.round(presPrev), hFaites=Math.round(worked), ecart=hFaites-hDues;
      var etpVf=hDues>0?(hFaites/hDues).toFixed(2):'\u2014';
      var tagf=(presSrc==='manuel')?'\u270E saisie manuelle':((presSrc==='planning')?'\uD83D\uDD17 depuis le Planning':'');
      etpBand=(tagf?'<div style="font-size:11px;color:var(--texte-doux);font-weight:700;margin-bottom:8px">'+tagf+'</div>':'')
        +'<div class="etp-band">'
        +'<div class="etp-cell"><div class="v">'+(hDues?f0(hDues)+' h':'\u2014')+'</div><div class="l">Heures pr\u00e9vues</div></div>'
        +'<div class="etp-cell"><div class="v">'+(hFaites?f0(hFaites)+' h':'\u2014')+'</div><div class="l">Heures travaill\u00e9es</div></div>'
        +'<div class="etp-cell"><div class="v '+(ecart>=0?'g':'')+'">'+(hDues&&hFaites?((ecart>=0?'+':'')+f0(ecart)+' h'):'\u2014')+'</div><div class="l">\u00c9cart</div></div>'
        +'<div class="etp-cell"><div class="v g">'+etpVf+'</div><div class="l">ETP</div></div></div>';
      etpV=(capRef>0)?etpEquipe:etpVf;
    }
    var moisTable='';
    var ouvSrc=_manHas?((S.active&&window.CONFIG)?(window.CONFIG.etp_ouvriers||null):null):(etpAuto?etpAuto.ouvriers:null);
    var ouvHtml='';
    if(ouvSrc&&typeof ouvSrc==='object'){
      var COUL=window.COULEURS_MBR||{};
      var cards=Object.keys(ouvSrc).map(function(nm){var d=ouvSrc[nm]||{};var du=d.h_dues||0,fa=d.h_faites||0;if(!du&&!fa)return '';var e=du>0?(fa/du).toFixed(2):'\u2014';var bg=COUL[nm]||'#3D6B27';
        return '<div class="ouv"><div class="av" style="background:'+bg+'">'+esc(nm.charAt(0))+'</div><div class="nm">'+esc(nm)+'</div><div class="hh">'+f0(fa)+' h / '+f0(du)+' h</div><div class="etpv">'+e+' ETP</div></div>';}).filter(Boolean).join('');
      if(cards)ouvHtml='<div class="sec-eyebrow" style="margin:16px 0 8px">D\u00e9tail par personne (heures travaill\u00e9es)</div><div class="ouv-grid">'+cards+'</div>';
    }
    var etpNote;
    if(_rich)etpNote='<b>Pr\u00e9sence = Travaux vigne (bar\u00e8me) + Tracteur (estim\u00e9) + Autres.</b> Les heures \u00ab vigne \u00bb et \u00ab tracteur \u00bb sont des valorisations au bar\u00e8me (h/ha), pas des heures point\u00e9es. Tracteur = \u03a3 (surface du passage \u00d7 h/ha de l\u2019activit\u00e9)'+((tractH>0)?'':' \u2014 renseignez un bar\u00e8me h/ha par activit\u00e9 (R\u00e9glages) pour le d\u00e9tacher de \u00ab Autres \u00bb')+'. ETP = heures \u00f7 capacit\u00e9 d\u2019un temps plein sur la saison. La saisie manuelle des heures (R\u00e9glages) reste prioritaire sur le Planning.';
    else etpNote='Renseignez les dates de la saison (R\u00e9glages \u203A Saisons) et le Planning, ou saisissez les heures dans R\u00e9glages \u203A App \u203A Heures & ETP, pour d\u00e9tailler la charge et l\u2019ETP.';

    // ── 10) Cave & élevage (conditionnel) ──
    var caveHtml='';
    var CE=window.CAVE_ELEVAGE;
    var caveVisible=(!window._canModule||window._canModule('cave'))&&CE&&((CE.cuvees&&CE.cuvees.length)||(CE.operations&&CE.operations.length));
    if(caveVisible){
      var CEMOJI={ouillage:'\uD83E\uDEA3',soutirage:'\u21D5\uFE0F',soufre:'\uD83E\uDDEA',analyse:'\uD83D\uDD2C',autre:'\uD83D\uDCDD'};
      var CELBL={ouillage:'Ouillage',soutirage:'Soutirage',soufre:'Soufrage',analyse:'Analyse',autre:'Autre'};
      var ops=(CE.operations||[]).filter(function(o){return inWin(o.date);}).sort(function(a,b){return (b.date||'').localeCompare(a.date||'');});
      function cuvNames(o){var ids=o.cuvees_ids||(o.cuvee_id?[o.cuvee_id]:[]);if(!ids.length)return '';return ids.map(function(id){var c=(CE.cuvees||[]).find(function(x){return x.id===id;})||{};return (c.nom||'')+(c.millesime?' '+c.millesime:'');}).filter(Boolean).join(', ');}
      var cnt={};ops.forEach(function(o){cnt[o.type]=(cnt[o.type]||0)+1;});
      var cntChips=Object.keys(cnt).map(function(k){return '<span class="tag neu" style="margin-right:5px">'+(CEMOJI[k]||'')+' '+(CELBL[k]||k)+' \u00d7'+cnt[k]+'</span>';}).join('');
      var opRows=ops.slice(0,16).map(function(o){var nm=cuvNames(o);return '<div class="cave-op"><div class="ic">'+(CEMOJI[o.type]||'\uD83D\uDCDD')+'</div><div><div class="t">'+esc(CELBL[o.type]||o.type)+(nm?' \u2014 '+esc(nm):'')+'</div><div class="s">'+frD(o.date)+'</div></div></div>';}).join('');
      caveHtml='<div class="section">'
        +'<div class="sec-head"><div class="sec-titles"><div class="sec-eyebrow">Chai</div><div class="sec-title">Cave & \u00e9levage</div></div><div class="sec-count">'+ops.length+' op\u00e9rations</div></div>'
        +(cntChips?'<div style="margin-bottom:10px">'+cntChips+'</div>':'')
        +(opRows?'<div class="cave-grid">'+opRows+'</div>':'<div class="emptyrow" style="padding:8px 0">Aucune op\u00e9ration d\u2019\u00e9levage sur cette p\u00e9riode.</div>')
        +'<div class="sec-note">Op\u00e9rations d\u2019\u00e9levage dat\u00e9es dans la p\u00e9riode de la saison (ouillage, soutirage, soufrage, analyses).</div></div>';
    }

    // ── KPIs & compteurs ──
    var interv=JOURNAL.filter(function(j){return j&&!j.meteo&&j.statut!=='Info'&&inWin(j.date);}).length;
    var isEncours=!!S.active;
    var periode=S.periode||((S.debut&&S.fin)?(frD(S.debut)+' \u2192 '+frD(S.fin)):'');

    // ── CSS (print-oriented, identité cave/horizon) ──
    var CSS=_rsCss();

    // ── ASSEMBLAGE ──
    var H=[];
    H.push('<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rapport de saison \u2014 '+esc(S.nom)+' \u2014 '+esc(dom)+'</title><link rel="stylesheet" href="/fonts/fonts.css"><style>'+CSS+'</style></head><body><div class="sheet">');
    // Cover
    H.push('<div class="cover"><div class="cov-eyebrow">Ma Vigne \u00b7 Rapport de saison</div>'
      +'<div class="cov-dom"><span class="cov-grape">\uD83C\uDF47</span>'+esc(dom)+'</div>'
      +'<div class="cov-sais">'+esc(S.nom)+(periode?' \u00b7 '+esc(periode):'')+'</div>'
      +'<div class="cov-meta"><span class="cov-state '+(isEncours?'encours':'')+'">'+(isEncours?'\u25b5 Saison en cours':'\u2713 Saison cl\u00f4tur\u00e9e')+'</span>'
      +'<span class="dot"></span><span>'+surfTot.toFixed(2).replace('.',',')+' ha \u00b7 '+parcActives.length+' parcelles</span>'
      +'<span class="dot"></span><span>\u00c9dit\u00e9 le '+dStr+' \u00e0 '+tStr+'</span></div>'
      +'<div class="kpi-strip">'
      +'<div class="kpi"><div class="v g">'+gPct+'<span class="u">%</span></div><div class="l">Avancement</div></div>'
      +'<div class="kpi"><div class="v">'+f0(sHd)+'<span class="u">h</span></div><div class="l">Heures r\u00e9alis\u00e9es</div></div>'
      +'<div class="kpi"><div class="v o">'+etpV+'</div><div class="l">ETP saison</div></div>'
      +'<div class="kpi"><div class="v a">'+sess.length+'</div><div class="l">Sessions tracteur</div></div></div></div>');
    H.push('<div class="pad">');
    // §1 Synthèse
    H.push('<div class="section"><div class="sec-head"><div class="sec-titles"><div class="sec-eyebrow">Vue d\u2019ensemble</div><div class="sec-title">Synth\u00e8se de la saison</div></div></div><div class="summ">'
      +'<div class="sbox g"><div class="v g">'+gPct+'<span class="u">%</span></div><div class="l">Avancement global</div></div>'
      +'<div class="sbox"><div class="v">'+f0(sHd)+'<span class="u">h</span></div><div class="l">Heures r\u00e9alis\u00e9es</div></div>'
      +'<div class="sbox"><div class="v">'+f0(sHt)+'<span class="u">h</span></div><div class="l">Heures estim\u00e9es</div></div>'
      +'<div class="sbox"><div class="v">'+(hDues?f0(hDues)+'<span class="u">h</span>':'\u2014')+'</div><div class="l">Heures dues</div></div>'
      +'<div class="sbox"><div class="v">'+interv+'</div><div class="l">Interventions</div></div>'
      +'<div class="sbox a"><div class="v a">'+sess.length+'</div><div class="l">Sessions tracteur</div></div>'
      +'<div class="sbox"><div class="v">'+trait.length+'</div><div class="l">Traitements phyto</div></div>'
      +'<div class="sbox c"><div class="v c">'+incArr.length+'</div><div class="l">Incidents tracteur</div></div></div>'
      +'<div class="sec-note">P\u00e9riode : '+(S.debut?frD(S.debut):'\u2014')+' \u2192 '+(S.fin?frD(S.fin):'\u2014')+'. Avancement calcul\u00e9 par surface valid\u00e9e (ha) sur le r\u00e9f\u00e9rentiel \u00ab travail \u00e0 la t\u00e2che \u00bb C\u00f4te de Nuits.</div></div>');
    // §2 Avancement par tâche
    H.push('<div class="section"><div class="sec-head"><div class="sec-titles"><div class="sec-eyebrow">Travaux manuels</div><div class="sec-title">Avancement par t\u00e2che</div></div><div class="sec-count">'+taches.length+' t\u00e2ches</div></div>'
      +'<table><thead><tr><th>T\u00e2che</th><th>Avancement</th><th class="r">Surface</th><th class="c">1\u02b3\u1d49 \u2192 derni\u00e8re</th><th class="c">Dur\u00e9e</th><th class="r">H. r\u00e9elles</th><th class="r">H. estim\u00e9es</th><th class="r">Reste</th></tr></thead><tbody>'
      +(trows||'<tr class="emptyrow"><td colspan="8">Aucune t\u00e2che pour cette saison.</td></tr>')
      +(trows?'<tr class="tot"><td>Total saison</td><td><span class="pct" style="color:'+pctCol(gPct)+'">'+gPct+' %</span></td><td class="r">\u2014</td><td class="c">\u2014</td><td class="c">\u2014</td><td class="r">'+f0(sHd)+' h</td><td class="r">'+f0(sHt)+' h</td><td class="r">'+f0(sHr)+' h</td></tr>':'')
      +'</tbody></table><div class="sec-note">Dates issues des validations journal. H. estim\u00e9es = r\u00e9f\u00e9rentiel h/ha \u00d7 surface. Reste = heures th\u00e9oriques non r\u00e9alis\u00e9es.</div></div>');
    // §3 Bilan par parcelle
    H.push('<div class="section brk"><div class="sec-head"><div class="sec-titles"><div class="sec-eyebrow">Terroir</div><div class="sec-title">Bilan par parcelle</div></div><div class="sec-count">'+parcActives.length+' parcelles \u00b7 '+surfTot.toFixed(2).replace('.',',')+' ha</div></div>'
      +'<table><thead><tr><th>Parcelle</th><th class="r">Surface</th><th class="c">T\u00e2ches</th><th class="c">1\u02b3\u1d49 \u2192 derni\u00e8re validation</th>'+(anyTrous?'<th class="r">Trous plant.</th>':'')+(anyCu?'<th class="r">Cu 7 ans</th>':'')+'</tr></thead><tbody>'
      +(prows||'<tr class="emptyrow"><td colspan="4">Aucune parcelle active.</td></tr>')
      +(anyTrous?'<tr class="tot"><td>Total</td><td class="r">'+surfTot.toFixed(2)+' ha</td><td class="c">\u2014</td><td class="c">\u2014</td><td class="r">\uD83E\uDE9B '+trousTot+'</td>'+(anyCu?'<td class="r">\u2014</td>':'')+'</tr>':'')
      +'</tbody></table><div class="sec-note">'+(anyCu?'Colonne Cu = cuivre m\u00e9tal cumul\u00e9 sur 7 ans glissants (kg/ha) vs plafond 28 kg/ha \u2014 voir Conformit\u00e9 cuivre. ':'')+(parcArr.length?parcArr.length+' parcelle(s) arrach\u00e9e(s) non incluse(s). ':'')+'Dates = 1\u02b3\u1d49 et derni\u00e8re validation toutes t\u00e2ches confondues.</div></div>');
    // §4 Sessions
    H.push('<div class="section"><div class="sec-head"><div class="sec-titles"><div class="sec-eyebrow">M\u00e9canisation</div><div class="sec-title"><span class="acc">Travaux tracteur</span> \u2014 sessions</div></div><div class="sec-count">'+sess.length+' sessions</div></div>'
      +'<table><thead><tr><th>Activit\u00e9</th><th>Tracteur</th><th>Conducteur</th><th class="r">Surface</th><th class="c">Statut</th><th class="r">Avanct.</th></tr></thead><tbody>'
      +(srows||'<tr class="emptyrow"><td colspan="6">Aucune session enregistr\u00e9e pour cette saison.</td></tr>')
      +'</tbody></table><div class="sec-note">Avancement session = surface travaill\u00e9e (ha). Sessions filtr\u00e9es par la p\u00e9riode de la saison.</div></div>');
    // §5 Parc & entretien
    H.push('<div class="section brk"><div class="sec-head"><div class="sec-titles"><div class="sec-eyebrow">Mat\u00e9riel</div><div class="sec-title"><span class="acc">Parc & entretien</span></div></div><div class="sec-count">'+TL.length+' tracteurs</div></div>'
      +(pcards?'<div class="parc-grid">'+pcards+'</div>':'<div class="emptyrow" style="padding:8px 0">Aucun tracteur enregistr\u00e9.</div>')
      +gnrHtml
      +'<div class="sec-eyebrow" style="margin:16px 0 8px;color:#2E6D8C">Fiches d\u2019entretien de la saison</div>'
      +(entHtml||'<div class="emptyrow" style="padding:10px 0">Aucune fiche d\u2019entretien sur cette p\u00e9riode.</div>')
      +'<div class="sec-note">Le GNR est une cuve unique pour tout le domaine (\u00e9tat actuel). R\u00e9vision = heures restantes avant l\u2019\u00e9ch\u00e9ance (compteur vs seuil).</div></div>');
    // §6 Incidents
    H.push('<div class="section"><div class="sec-head"><div class="sec-titles"><div class="sec-eyebrow">Fiabilit\u00e9</div><div class="sec-title"><span class="cop">Incidents & r\u00e9parations</span> tracteur</div></div><div class="sec-count">'+incArr.length+(incArr.length?' \u2014 '+nOpen+' en cours':'')+'</div></div>'
      +'<div class="inc">'+(incHtml||'<div class="emptyrow" style="padding:8px 0">Aucun incident tracteur sur cette saison.</div>')+'</div>'
      +'<div class="sec-note">R\u00e9parations en cours (retour pr\u00e9vu) et cl\u00f4tur\u00e9es de l\u2019historique. L\u2019immobilisation cumule les jours au garage.</div></div>');
    // §7 Réparations vigne
    H.push('<div class="section"><div class="sec-head"><div class="sec-titles"><div class="sec-eyebrow">Palissage</div><div class="sec-title">R\u00e9parations ponctuelles \u2014 vigne</div></div><div class="sec-count">'+repKeys.length+' parcelles</div></div>'
      +'<table><thead><tr><th>Parcelle</th><th>\u00c9l\u00e9ments r\u00e9par\u00e9s</th><th class="r">Quantit\u00e9</th><th class="r">Derni\u00e8re</th></tr></thead><tbody>'
      +(rvHtml||'<tr class="emptyrow"><td colspan="4">Aucune r\u00e9paration ponctuelle enregistr\u00e9e.</td></tr>')
      +(rvHtml?'<tr class="tot"><td>Total</td><td>\u2014</td><td class="r">'+rvTot+'</td><td class="r">\u2014</td></tr>':'')
      +'</tbody></table><div class="sec-note">R\u00e9parations de palissage saisies au journal (piquets, fils, ancres\u2026), agr\u00e9g\u00e9es par parcelle.</div></div>');
    // §8 Phyto
    H.push('<div class="section brk"><div class="sec-head"><div class="sec-titles"><div class="sec-eyebrow">R\u00e9glementaire</div><div class="sec-title">Registre phytosanitaire</div></div><div class="sec-count">'+trait.length+' traitements</div></div>'
      +'<table class="phyto-t"><thead><tr><th>Produit / substance</th><th>Classe</th><th>Date</th><th>Dose</th><th>Stade</th><th>Zone</th><th>Conduct.</th><th class="c">DAR r\u00e9colte</th><th class="c">DRE</th></tr></thead><tbody>'
      +(phRows||'<tr class="emptyrow"><td colspan="9">Aucun traitement sur cette saison'+(hasWin&&(S.debut<'2026-03')?' (p\u00e9riode hivernale).':'.')+'</td></tr>')
      +'</tbody></table><div class="sec-note">Registre conforme (produit, substance, AMM, dose, stade, parcelles, conducteur, DAR, d\u00e9lai de r\u00e9-entr\u00e9e). Donn\u00e9es E-Phy indicatives, non opposables.</div></div>');
    // §9 Cuivre
    H.push(cuHtml);
    // §10 Heures & ETP
    H.push('<div class="section '+(anyCu?'':'brk')+'"><div class="sec-head"><div class="sec-titles"><div class="sec-eyebrow">Main-d\u2019\u0153uvre</div><div class="sec-title">Heures & ETP</div></div><div class="sec-count">'+etpV+' ETP</div></div>'
      +etpBand+moisTable+ouvHtml
      +'<div class="sec-note">'+etpNote+'</div></div>');
    // §11 Cave
    H.push(caveHtml);
    // Signatures + credit
    H.push('<div class="sig-row"><div class="sig">Le chef de culture</div><div class="sig">Le responsable du domaine</div></div>'
      +'<div class="credit">Rapport g\u00e9n\u00e9r\u00e9 par <b>Ma Vigne</b> \u00b7 GUERETTECH \u00b7 '+esc(dom)+' \u00b7 Bourgogne \u2014 C\u00f4te de Nuits \u00b7 le '+dStr+' \u00e0 '+tStr+'<br>Donn\u00e9es E-Phy indicatives, non opposables \u00b7 SIRET 98214811600022</div>');
    H.push('</div>'); // .pad
    H.push('<div class="foot-band"><span>'+esc(dom)+' \u00b7 '+esc(S.nom)+'</span><span>Ma Vigne \u00b7 Rapport de saison</span></div>');
    H.push('<scr'+'ipt>setTimeout(function(){try{window.print();}catch(e){}} ,450);<\/scr'+'ipt></div></body></html>');

    var html=H.join('');
    var w=window.open('','_blank');
    if(w){w.document.write(html);w.document.close();}
    else showToast('Autorisez les fen\u00eatres pop-up pour le PDF','#B85A1A');
  } finally {
    _VISU_SAISON=_prevVisu; _rebuild();
  }
}
window.exportRapportSaison=exportRapportSaison;

// Alias rétro-compat : les anciens appels ouvrent le sélecteur de saison.
window.exportSaisonPDF=openRapportSaison;
