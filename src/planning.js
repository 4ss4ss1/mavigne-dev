// ════════════════════════════════════════════════════════════════════
// MA VIGNE — src/planning.js
// Module Planning RH — refonte v5.08 : grille équipe (sem./mois), éditeur
// de jour sans navigation, sélection multiple, fiche salarié 4 volets, outils
// Phase 3a — extrait depuis app.js
// © 2026 Nicolas GUERET / GUERETTECH
// ════════════════════════════════════════════════════════════════════
//
// Dépendances (via window.*) :
//   window.fbSave            ← firebase.js
//   window.MEMBRES           ← app.js (tableau muté en place)
//   window.currentUser       ← app.js
//   window.CONFIG            ← app.js
//   window.PLAN_PAUSE_MIN    ← exposé par ce module
//   window.PLANNING_TEMPLATES, window.PLANNING_ENTRIES,
//   window.PLANNING_ACOMPTES ← exposés par ce module (même ref)
//
// ════════════════════════════════════════════════════════════════════

import { isAdmin, showToast, _escHtml, _escAttr } from './utils.js';

const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if(DEBUG) console.log('[Ma Vigne] planning.js chargé — ' + new Date().toISOString());

// ════════════════════════════════════════════════════════════════════
// MODULE PLANNING RH — v1.0
// Gestion des heures d'équipe, templates planning, saisie admin
// ════════════════════════════════════════════════════════════════════

var PLANNING_TEMPLATES = {};
var PLANNING_ENTRIES   = {};
var PLANNING_ACOMPTES  = {};
var PLANNING_HSUP      = {};
window.PLANNING_TEMPLATES = PLANNING_TEMPLATES;
window.PLANNING_ENTRIES   = PLANNING_ENTRIES;
window.PLANNING_ACOMPTES  = PLANNING_ACOMPTES;
window.PLANNING_HSUP      = PLANNING_HSUP;
var planTab    = 'planning';
var planMonth  = (new Date()).getMonth();
var planSelEmp = null;
var _planEditDay = null;
var _planModalMode = 'travail';
var _planEdHeat = false;   // preset chaleur de l'éditeur de jour (refonte v5.08)
var _planEdRemp = false;   // bascule « jour de remplacement » de l'éditeur de jour
var _planAbsSel = 'autre'; // motif d'absence selectionne dans l'editeur de jour
var _planEditing = null; // {templateId, month} pour l'éditeur grille
// ── Horaires chaleur (planning aménagé > 30°) — état du panneau, par appareil ──
var _planCanic = { du:'', au:'', deb:'06:00', fin:'14:00', continu:true, open:false };

// ════════════════════════════════════════════════════════════════════
// MULTI-ANNÉES — planning par année civile.
// Store canonique PARTITIONNÉ PAR ANNÉE :
//   PLANNING_ENTRIES[nom][année][mois][jour]     PLANNING_TEMPLATES[année][id]
// planYear = année AFFICHÉE ; _planCtxYear = override de CALCUL (null → planYear)
// pour les agrégats de saison qui traversent l'année civile.
// ════════════════════════════════════════════════════════════════════
var planYear     = (new Date()).getFullYear();  // année affichée du planning RH
var _planCtxYear = null;                         // année de calcul (interne)
var _planExtraYears = [];                        // années ajoutées via « + » (encore vides)
var _MV_PLAN_BASE_YEAR = 2026;                   // année de bascule des données pré-multi-années
function _pY(){ return _planCtxYear!=null ? _planCtxYear : planYear; }

// ── Accès année-aware aux ENTRÉES ──
function _pEntYear(nom){ var b=PLANNING_ENTRIES[nom]; return (b&&b[_pY()])||null; }
function _pEntMonth(nom,m){ var y=_pEntYear(nom); return (y&&y[m])||{}; }
function _pEntDay(nom,m,d){ var mo=_pEntMonth(nom,m); return mo[d]||null; }
function _pEntEnsure(nom,m){
  if(!PLANNING_ENTRIES[nom])PLANNING_ENTRIES[nom]={};
  var Y=_pY();
  if(!PLANNING_ENTRIES[nom][Y])PLANNING_ENTRIES[nom][Y]={};
  if(!PLANNING_ENTRIES[nom][Y][m])PLANNING_ENTRIES[nom][Y][m]={};
  return PLANNING_ENTRIES[nom][Y][m];
}
// ── Accès année-aware aux MODÈLES ──
function _pTplStore(){ var Y=_pY(); if(!PLANNING_TEMPLATES[Y])PLANNING_TEMPLATES[Y]={}; return PLANNING_TEMPLATES[Y]; }

// ── Jours fériés français calculés PAR ANNÉE (fixes + mobiles depuis Pâques, algo de Butcher) ──
var _MV_FERIES_CACHE={};
function _mvEasterMD(y){
  var a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,
      f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,
      i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,mm=Math.floor((a+11*h+22*l)/451),
      month=Math.floor((h+l-7*mm+114)/31),day=((h+l-7*mm+114)%31)+1;
  return {m:month-1,d:day};
}
function _feriesY(y){
  if(_MV_FERIES_CACHE[y])return _MV_FERIES_CACHE[y];
  var F={};
  function add(m,d,nom){ if(!F[m])F[m]={}; F[m][d]=nom; }
  add(0,1,"Jour de l'An"); add(4,1,'F\u00eate du Travail'); add(4,8,'Victoire 1945');
  add(6,14,'F\u00eate Nationale'); add(7,15,'Assomption'); add(10,1,'Toussaint');
  add(10,11,'Armistice'); add(11,25,'No\u00ebl');
  var em=_mvEasterMD(y), base=new Date(y,em.m,em.d);
  function sh(n){ var x=new Date(base.getTime()); x.setDate(x.getDate()+n); return x; }
  var lp=sh(1), asc=sh(39), pen=sh(50);
  add(lp.getMonth(),lp.getDate(),'Lundi de P\u00e2ques');
  add(asc.getMonth(),asc.getDate(),'Ascension');
  add(pen.getMonth(),pen.getDate(),'Lundi de Pentec\u00f4te');
  _MV_FERIES_CACHE[y]=F; return F;
}
function _planFerie(m,d){ var F=_feriesY(_pY()); return (F[m]&&F[m][d])||null; }

// ── Migration NON-DESTRUCTIVE des données pré-multi-années (idempotente par discriminateur) ──
function _planMigrateYears(){
  if(window.PLANNING_ENTRIES)   PLANNING_ENTRIES   = window.PLANNING_ENTRIES;
  if(window.PLANNING_TEMPLATES) PLANNING_TEMPLATES = window.PLANNING_TEMPLATES;
  // ENTRÉES : ancienne forme [nom][mois][jour] → [nom][année][mois][jour]
  Object.keys(PLANNING_ENTRIES).forEach(function(nom){
    var byNom=PLANNING_ENTRIES[nom];
    if(!byNom||typeof byNom!=='object')return;
    var keys=Object.keys(byNom); if(!keys.length)return;
    var allMonth=keys.every(function(k){ var n=parseInt(k,10); return !isNaN(n)&&n>=0&&n<=11; });
    if(!allMonth)return;                             // déjà migré (clés=années) ou forme inattendue
    var moved={}; moved[_MV_PLAN_BASE_YEAR]=byNom;
    PLANNING_ENTRIES[nom]=moved;
  });
  // MODÈLES : ancienne forme [id] → [année][id]
  var tk=Object.keys(PLANNING_TEMPLATES);
  var idKeys=tk.filter(function(k){ return !/^\d{4}$/.test(k); });
  if(idKeys.length){
    if(!PLANNING_TEMPLATES[_MV_PLAN_BASE_YEAR])PLANNING_TEMPLATES[_MV_PLAN_BASE_YEAR]={};
    idKeys.forEach(function(k){
      if(PLANNING_TEMPLATES[_MV_PLAN_BASE_YEAR][k]===undefined)PLANNING_TEMPLATES[_MV_PLAN_BASE_YEAR][k]=PLANNING_TEMPLATES[k];
      delete PLANNING_TEMPLATES[k];
    });
  }
}

// ── Années des onglets : données + année courante + N+1 + ajoutées ──
function _planYearList(){
  var set={}, cur=(new Date()).getFullYear();
  set[cur]=1; set[cur+1]=1; set[planYear]=1;
  Object.keys(PLANNING_ENTRIES).forEach(function(nom){
    var b=PLANNING_ENTRIES[nom]; if(b&&typeof b==='object')Object.keys(b).forEach(function(y){ var n=parseInt(y,10); if(n>=2000)set[n]=1; });
  });
  Object.keys(PLANNING_TEMPLATES).forEach(function(y){ var n=parseInt(y,10); if(n>=2000)set[n]=1; });
  _planExtraYears.forEach(function(y){ set[y]=1; });
  return Object.keys(set).map(Number).sort(function(a,b){ return a-b; });
}
function _planYearHasData(y){
  var had=false;
  Object.keys(PLANNING_ENTRIES).forEach(function(nom){ var b=PLANNING_ENTRIES[nom]; if(b&&b[y]&&Object.keys(b[y]).length)had=true; });
  if(PLANNING_TEMPLATES[y]&&Object.keys(PLANNING_TEMPLATES[y]).length)had=true;
  return had;
}
function planSetYear(y){ y=parseInt(y,10); if(isNaN(y))return; planYear=y; _pl2Wi=null; _pl2Sel={}; renderPlanning(); }
function planAddYear(){ var list=_planYearList(); var next=(list.length?Math.max.apply(null,list):(new Date()).getFullYear())+1; _planExtraYears.push(next); planSetYear(next); if(window.showToast)showToast('Ann\u00e9e '+next+' ajout\u00e9e','#3D6B27'); }
function _pl2YearTabs(){
  if(!isAdmin())return '';
  var list=_planYearList();
  var h='<div class="pl2-yrtabs" style="display:flex;gap:7px;flex-wrap:wrap;align-items:stretch;margin-bottom:10px">';
  list.forEach(function(y){
    var on=(y===planYear), data=_planYearHasData(y);
    h+='<button onclick="planSetYear('+y+')" style="cursor:pointer;font-family:inherit;border-radius:11px;padding:7px 13px;min-width:74px;text-align:left;'
      +'border:1.5px solid '+(on?'var(--plan-acc)':'var(--gris-clair)')+';background:'+(on?'var(--plan-acc-pale)':'var(--bg-card)')+';'
      +'box-shadow:'+(on?'0 0 0 1px var(--plan-acc) inset':'none')+';display:flex;flex-direction:column;gap:1px">'
      +'<span style="font-size:20px;font-weight:800;line-height:1;letter-spacing:.4px;color:'+(on?'#524399':'var(--texte)')+'">'+y+'</span>'
      +'<span style="font-size:9.5px;display:flex;align-items:center;gap:4px;color:var(--texte-doux)"><span style="width:6px;height:6px;border-radius:50%;background:'+(data?'var(--vert-med)':'var(--gris-clair)')+'"></span>'+(data?'saisi':'vide')+'</span>'
    +'</button>';
  });
  h+='<button onclick="planAddYear()" title="Ajouter l\'ann\u00e9e suivante" style="cursor:pointer;font-family:inherit;border-radius:11px;padding:7px 12px;min-width:44px;border:1.5px dashed var(--gris-clair);background:transparent;color:var(--texte-doux);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px">'
    +'<span style="font-size:22px;font-weight:400;line-height:.9">+</span><span style="font-size:9.5px">ann\u00e9e</span></button>';
  h+='</div>';
  return h;
}
(function(){
  try{
    var _t=new Date();
    if(_t.getFullYear()===planYear){ var _iso=_t.toISOString().slice(0,10); _planCanic.du=_iso; _planCanic.au=_iso; }
    else { _planCanic.du=planYear+'-01-01'; _planCanic.au=planYear+'-01-01'; }
    var _tn=localStorage.getItem('mavigne_tenant')||'';
    var _raw=localStorage.getItem('mavigne_canic_'+_tn);
    if(_raw){ var _o=JSON.parse(_raw); if(_o&&_o.deb)_planCanic.deb=_o.deb; if(_o&&_o.fin)_planCanic.fin=_o.fin; if(_o&&typeof _o.continu==='boolean')_planCanic.continu=_o.continu; }
  }catch(_e){}
})();

// Domaine de référence : templates personnels NON distribués aux autres tenants (flag local, indépendant d'app.js).
var _PLAN_IS_MG = (function(){try{return (localStorage.getItem('mavigne_tenant')||'')==='marchand-grillot';}catch(e){return false;}})();
// ── Templates par défaut (chargés si Firebase vide) ──
var PLAN_DEF = {
  standard:{
    0:{5:7,6:7,7:7,8:7,9:4,12:7,13:7,14:7,15:7,16:4,19:7,20:7,21:7,22:7,23:4,26:7,27:7,28:7,29:7,30:4},
    1:{2:7,3:7,4:7,5:7,6:4,9:7,10:7,11:7,12:7,13:4,16:7,17:7,18:7,19:7,20:4,23:7,24:7,25:7,26:7,27:4},
    2:{2:7.5,3:7.5,4:7.5,5:7.5,6:4,16:7.5,17:7.5,18:7.5,19:7.5,20:4,23:7.5,24:7.5,25:7.5,26:7.5,27:4,30:7.5,31:7.5},
    3:{1:8,2:8,3:5,7:8,8:8,9:8,10:5,13:8,14:8,15:8,16:8,17:5,20:8,21:8,22:8,23:8,24:5,27:8,28:8,29:8,30:8},
    4:{4:8.5,5:8.5,6:8.5,7:5,11:8.5,12:8.5,13:8.5,15:5,18:8.5,19:8.5,20:8.5,21:8.5,22:5,26:8.5,27:8.5,28:8.5,29:5},
    5:{1:8.5,2:8.5,3:8.5,4:8.5,5:5,8:8.5,9:8.5,10:8.5,11:8.5,12:5,15:8.5,16:8.5,17:8.5,18:8.5,19:5,22:8.5,23:8.5,24:8.5,25:8.5,26:5,29:8.5,30:8.5},
    6:{1:8.5,2:8.5,3:5,6:8.5,7:8.5,8:8.5,9:8.5,10:5,13:8.5,15:8.5,16:8.5,17:5,20:8.5,21:8.5,22:8.5,23:8.5,24:5,27:8.5,28:8.5,29:8.5,30:8.5,31:5},
    7:{24:8.5,25:8.5,26:8.5,27:8.5,28:5,31:8.5},
    8:{1:8.5,2:8.5,3:8.5,4:5,7:7,8:7,9:7,10:7,11:7,12:7,14:8.5,15:8.5,16:8.5,17:8.5,18:5,21:8.5,22:8.5,23:8.5,24:8.5,25:5,28:8.5,29:8.5,30:8.5},
    9:{1:7,2:4,5:7,6:7,7:7,8:7,9:4,12:7,13:7,14:7,15:7,16:4,19:7,20:7,21:7,22:7,23:4,26:7,27:7,28:7,29:7,30:4},
    10:{2:7,3:7,4:7,5:7,6:4,9:7,10:7,12:7,13:4,16:7,17:7,18:7,19:7,23:7,24:7,25:7,26:7,30:7},
    11:{1:7,2:7,3:7,7:7,8:7,9:7,10:7,14:7,15:7,16:7,17:7,21:7,22:7,23:7,24:6.5}
  }
};
// Template historique du domaine de référence (Marchand-Grillot) — réservé à ce tenant.
if (_PLAN_IS_MG) {
  PLAN_DEF.nico = {
    0:{5:7.5,6:6.5,7:6,8:7,9:4,12:6.5,13:7,15:6.5,16:4,19:7.5,20:6.5,21:6,22:7,23:4,26:6.5,27:7,29:7,30:4},
    1:{1:7.5,2:6.5,3:6,5:7,6:4,9:6,10:7,12:6.5,13:3,16:7.5,17:6.5,18:6,19:7,20:4,23:6,24:7,26:6.5,27:3},
    2:{1:8,2:6.5,3:6,5:7.5,6:8,16:8,17:6.5,18:6,19:7.5,20:8,23:6,24:7.5,26:6.5,27:3,30:8,31:6.5},
    3:{1:6.5,2:8,3:8,6:6.5,7:8,9:6.5,10:3,11:10,12:10,13:8,14:6.5,15:6.5,16:8,17:8,20:6.5,21:8,23:6.5,24:3,25:10,26:10,27:8,28:6.5,29:6.5,30:8},
    4:{4:6.5,5:8.5,7:6.5,8:8,9:10,10:10,11:8.5,12:6.5,13:6.5,14:8,15:8,18:6.5,19:8.5,21:6.5,22:8,23:10,24:10,26:6.5,27:6.5,28:8.5,29:8},
    5:{1:6.5,2:8.5,4:6.5,5:7,6:10,7:10,8:8.5,9:6.5,10:6.5,11:8.5,12:8,15:6.5,16:8.5,18:8.5,19:7,20:10,21:10,22:8.5,23:6.5,24:6.5,25:8.5,26:8,29:6.5,30:8.5},
    6:{2:6.5,3:7,4:10,5:10,6:8.5,7:6.5,8:6.5,9:8.5,10:8,13:6.5,16:6.5,17:7,18:10,19:10,20:8.5,21:6.5,22:6.5,23:8.5,24:8,27:6.5,28:8.5,30:6.5,31:7},
    7:{24:6.5,25:8.5,27:6.5,28:6.5,31:8.5},
    8:{1:8.5,2:6.5,3:8.5,4:8,7:7,8:7,9:7,10:7,11:7,12:7,14:8.5,15:6.5,16:6.5,17:8.5,18:8,21:6.5,22:8.5,24:6.5,25:7,28:8.5,29:6.5,30:6.5},
    9:{1:7,2:7.5,5:6,6:7,8:6.5,9:3,12:7.5,13:6.5,14:6,15:7,16:7.5,19:6,20:7,22:6.5,23:3,26:7.5,27:6.5,28:6,29:7,30:7.5},
    10:{2:6,3:7,5:6.5,6:6,9:7.5,10:6.5,12:7,13:7.5,16:6,17:7,19:6.5,20:6,23:7.5,24:6.5,25:6,26:7,27:7.5,30:6},
    11:{1:7,3:6.5,4:3,7:7.5,8:6.5,9:6,10:7,11:7.5,14:6,15:7,17:6.5,18:3,21:7.5,22:6.5,23:6,24:6.5}
  };
}
// PLAN_REF_H supprimé (v2.69) — les heures de référence sont calculées
// dynamiquement depuis la grille PLAN_DEF / PLANNING_TEMPLATES via _planGetRefH.
// Cela rend le planning configurable sans modifier le code.
var PLAN_DEF_T = {
  3:{d:'08:00',f:'11:00'},   // 3h (sans coupure, span=3h)
  4:{d:'08:00',f:'12:00'},   // 4h (sans coupure, span=4h)
  5:{d:'07:00',f:'12:00'},   // 5h (sans coupure, span=5h) ← demi-journée vendredi
  6:{d:'07:00',f:'14:00'},   // 7h - 1h pause = 6h
  6.5:{d:'07:00',f:'14:30'}, // 7.5h - 1h = 6.5h
  7:{d:'07:00',f:'15:00'},   // 8h - 1h = 7h
  7.5:{d:'07:00',f:'15:30'}, // 8.5h - 1h = 7.5h
  8:{d:'07:00',f:'16:00'},   // 9h - 1h = 8h
  8.5:{d:'07:00',f:'16:30'}, // 9.5h - 1h = 8.5h
  10:{d:'06:00',f:'17:00'}   // 11h - 1h = 10h
};
var PLAN_FERIES={0:{1:"Jour de l'An"},3:{6:'Lundi de P\u00e2ques'},4:{1:'F\u00eate du Travail',8:'Victoire 1945',14:'Ascension',25:'Lundi de Pentec\u00f4te'},6:{14:'F\u00eate Nationale'},7:{15:'Assomption'},10:{1:'Toussaint',11:'Armistice'},11:{25:'No\u00ebl'}};
var PLAN_MOIS=['Janvier','F\u00e9vrier','Mars','Avril','Mai','Juin','Juillet','Ao\u00fbt','Septembre','Octobre','Novembre','D\u00e9cembre'];
var PLAN_MOIS_C=['Jan','F\u00e9v','Mar','Avr','Mai','Jun','Jul','Ao\u00fb','Sep','Oct','Nov','D\u00e9c'];
var PLAN_JOURS=['Di','Lu','Ma','Me','Je','Ve','Sa'];
var PLAN_JOURS_L=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
var PLAN_PAUSE_MIN=60; // Duree de la COUPURE dejeuner, en minutes (reglable par domaine).
// Le mot « pause » est reserve a la pause legale (20 min, un droit du salarie).
// Ce qui est decide par le domaine et non travaille s'appelle une coupure.

// ── Cadre légal (durées à ne pas dépasser) — paramétrable par convention ──
// Défauts = convention nationale Production Agricole et CUMA (IDCC 7024) :
//   35 h/sem légale · 151,67 h/mois · max 48 h/sem (44 h moy. 12 sem.) · max 10 h/jour.
// Stocké dans CONFIG.cadre_legal pour adaptation à la convention d'un autre client.
var PLAN_LEGAL_DEF={hebdoLeg:35,mensLeg:151.67,maxHebdo:48,maxMoy:44,maxJour:10,
  plafAnnuel:1607,   // duree annuelle de reference (annualisation) — CONFIG.cadre_legal.plafAnnuel
  modulMax:250,      // plafond d'heures de modulation / an (accord national agricole), majorable par accord
  maxAnnuel:1940};   // duree annuelle maximale (accord national agricole)
function _planLegal(){
  var c=(window.CONFIG&&window.CONFIG.cadre_legal)||{};
  return {
    hebdoLeg:(c.hebdoLeg!=null?c.hebdoLeg:PLAN_LEGAL_DEF.hebdoLeg),
    mensLeg :(c.mensLeg !=null?c.mensLeg :PLAN_LEGAL_DEF.mensLeg),
    maxHebdo:(c.maxHebdo!=null?c.maxHebdo:PLAN_LEGAL_DEF.maxHebdo),
    maxMoy  :(c.maxMoy  !=null?c.maxMoy  :PLAN_LEGAL_DEF.maxMoy),
    maxJour :(c.maxJour !=null?c.maxJour :PLAN_LEGAL_DEF.maxJour),
    plafAnnuel:(c.plafAnnuel!=null?c.plafAnnuel:PLAN_LEGAL_DEF.plafAnnuel),
    modulMax:(c.modulMax!=null?c.modulMax:PLAN_LEGAL_DEF.modulMax),
    maxAnnuel:(c.maxAnnuel!=null?c.maxAnnuel:PLAN_LEGAL_DEF.maxAnnuel)
  };
}

// ── Politique du domaine pour les heures au-dela du planning du mois ──
// 'paye'    : payees le mois meme (Marchand-Grillot)
// 'recup'   : recuperees en repos, aucun paiement mensuel (Chapelle & Fils)
// 'cloture' : tout reporte au solde de fin d'annee
// Le CALCUL est identique dans les trois cas : seuls l'affichage et les colonnes changent.
function _planHsupMode(){
  var v=(window.CONFIG&&window.CONFIG.hsup_mode)||'paye';
  return (v==='recup'||v==='cloture')?v:'paye';
}
function _planHsupPayable(){return _planHsupMode()==='paye';}

// ★★ HEURES DUES — fenetre d'application (CONFIG.hsup_dues_debut = 'YYYY-MM')
// Le comportement HISTORIQUE est conserve avant le mois fixe : une paie deja editee ne
// doit pas changer de valeur retroactivement. Vide/absent = regle INACTIVE, rien ne bouge.
// A partir du mois fixe :
//   • absence injustifiee / retard  -> les heures perdues sont DUES : elles tirent sur le
//     compteur, exactement comme une recup ;
//   • arret, conge sans solde, formation, evenement familial, absence non precisee
//     -> NEUTRES : elles sortent de la reference du mois au lieu d'absorber en silence
//     les heures supplementaires faites par ailleurs (le max(0,ecart) les mangeait) ;
//   • formation / evenement familial sont assimiles a du travail effectif -> payes,
//     et un retard n'ampute plus que ses propres heures (avant : la journee entiere).
function _planDuesDebut(){
  var v=(window.CONFIG&&window.CONFIG.hsup_dues_debut)||'';
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(v)?v:'';
}
function _planDuesActive(m){
  var deb=_planDuesDebut();
  if(!deb)return false;
  return (_pY()+'-'+String(m+1).padStart(2,'0'))>=deb;   // 'YYYY-MM' : tri lexical = tri chrono
}
window._planDuesActive=_planDuesActive;

// ── Motifs d'absence — typage necessaire a l'annualisation ──
// suspend : suspension du contrat -> ABAISSE le plafond annuel (les heures ne sont pas dues)
// assim   : assimile a du travail effectif -> compte comme travaille
// paye    : journee remuneree
// heures  : se saisit en HEURES et non en journee (retard)
// 'autre' = absence non precisee : comportement historique strict, plafond inchange.
//           C'est le motif par defaut de toute entree anterieure a ce lot -> zero regression.
var PLAN_ABS_MOTIFS=[
  {id:'arret',     ico:'\ud83e\ude79', nom:'Arr\u00eat de travail',          sub:'Maladie, accident du travail ou de trajet', suspend:true,  assim:false, paye:true,  heures:false},
  {id:'sansolde',  ico:'\u2708\ufe0f', nom:'Cong\u00e9 sans solde',          sub:'Absence autoris\u00e9e, non r\u00e9mun\u00e9r\u00e9e',       suspend:true,  assim:false, paye:false, heures:false},
  {id:'famille',   ico:'\ud83d\udc65', nom:'\u00c9v\u00e9nement familial',   sub:'Mariage, naissance, d\u00e9c\u00e8s',                   suspend:false, assim:true,  paye:true,  heures:false},
  {id:'formation', ico:'\ud83c\udf93', nom:'Formation',                      sub:'Journ\u00e9e de formation professionnelle',        suspend:false, assim:true,  paye:true,  heures:false},
  {id:'injustifie',ico:'\u2715',       nom:'Absence injustifi\u00e9e',       sub:'Heures dues \u00b7 journ\u00e9e non pay\u00e9e',         suspend:false, assim:false, paye:false, heures:false},
  {id:'retard',    ico:'\u23f0',       nom:'Retard',                         sub:'Se saisit en heures \u00b7 heures dues',           suspend:false, assim:false, paye:false, heures:true},
  {id:'autre',     ico:'\u2014',       nom:'Absence non pr\u00e9cis\u00e9e',  sub:'Sans effet sur le plafond annuel',                suspend:false, assim:false, paye:false, heures:false}
];
function _planAbsDef(id){
  for(var i=0;i<PLAN_ABS_MOTIFS.length;i++)if(PLAN_ABS_MOTIFS[i].id===id)return PLAN_ABS_MOTIFS[i];
  return PLAN_ABS_MOTIFS[PLAN_ABS_MOTIFS.length-1];
}
function _planAbsMotif(e){return _planAbsDef((e&&e.motif)||'autre');}
function _planAbsH(e){var v=parseFloat(e&&e.motif_h);return(isNaN(v)||v<0)?0:v;}
function _planLegInput(id,label,val,step){
  return '<div style="background:var(--bg-app);border:1px solid var(--gris-clair);border-radius:11px;padding:9px 10px">'
    +'<div style="font-size:10.5px;color:var(--texte-doux);font-weight:600;line-height:1.25;margin-bottom:5px;min-height:26px">'+label+'</div>'
    +'<div style="display:flex;align-items:center;gap:5px"><input type="number" id="'+id+'" step="'+step+'" value="'+val+'" style="width:100%;font-family:inherit;font-size:16px;font-weight:700;padding:7px 8px;border:1.5px solid var(--gris-clair);border-radius:9px;outline:none;background:var(--bg-card);color:var(--texte);text-align:center"><span style="font-size:12px;color:var(--gris);font-weight:600">h</span></div>'
    +'</div>';
}

// ── Utilitaires planning ──
function _planDays(m){return new Date(_pY(),m+1,0).getDate();}
function _planDow(m,d){return new Date(_pY(),m,d).getDay();}
function _planIsoWeek(m,d){
  var dt=new Date(_pY(),m,d); dt.setHours(0,0,0,0);
  dt.setDate(dt.getDate()+3-((dt.getDay()+6)%7));
  var w1=new Date(dt.getFullYear(),0,4);
  return 1+Math.round(((dt-w1)/86400000-3+((w1.getDay()+6)%7))/7);
}
function _planMonthWeeks(m){
  var total=_planDays(m),order=[],map={};
  for(var d=1;d<=total;d++){
    var dt=new Date(_pY(),m,d); dt.setHours(0,0,0,0);
    var mon=new Date(dt); mon.setDate(dt.getDate()-((dt.getDay()+6)%7));
    var key=mon.getTime();
    if(!map[key]){map[key]={no:_planIsoWeek(m,d),mon:new Date(mon),days:[]};order.push(key);}
    map[key].days.push(d);
  }
  return order.map(function(k){
    var w=map[k],sun=new Date(w.mon); sun.setDate(w.mon.getDate()+6);
    return {no:w.no,mon:w.mon,sun:sun,days:w.days,partial:(w.mon.getMonth()!==m||sun.getMonth()!==m)};
  });
}
function _planGetTpl(plId,yr){
  var _Y=(yr!=null?yr:_pY());
  var _st=PLANNING_TEMPLATES[_Y];
  return (_st&&_st[plId])||PLAN_DEF[plId]||PLAN_DEF.standard;
}
function _planGetRefH(plId,m){
  // Toujours calculer depuis la grille du template (PLAN_DEF + overrides Firebase).
  // On filtre les clés non-numériques (_timings, _timings_jour…) pour ne sommer
  // que les jours 1–31. Fonctionne identiquement pour les templates intégrés
  // (standard, nico) et pour tout template custom créé par un client.
  var tpl=_planGetTpl(plId);
  var mo=tpl[m]||{};
  return Object.keys(mo).reduce(function(s,k){
    return /^\d+$/.test(k)?s+(parseFloat(mo[k])||0):s;
  },0);
}
function _planPlanned(plId,m,d,yr){
  var tpl=_planGetTpl(plId,yr);
  return (tpl[m]&&tpl[m][d])||0;
}
function _planTimingH(debut,fin,continu){
  if(!debut||!fin)return 0;
  var ds=debut.split(':'),fs=fin.split(':');
  var span=(parseInt(fs[0])*60+parseInt(fs[1]||0))-(parseInt(ds[0])*60+parseInt(ds[1]||0));
  if(span<=0)return 0;
  var brk=(!continu&&span>360)?(window.PLAN_PAUSE_MIN||PLAN_PAUSE_MIN||60):0;
  return (span-brk)/60; // précision à la minute (v4.32) — ex-arrondi au dixième affichait 8h48 pour 8h45
}
function _planDefTiming(pl,plId,m,d,yr){
  // Calcule le timing (debut/fin) d'un jour à partir du planning annualisé.
  // Logique : heure de début = celle du mois (depuis _timings[m]),
  //           heure de fin   = début + pl + pause (si pl>6h).
  // Priorité : 1. Code jour D/M/A  2. Calcul depuis _timings mensuel  3. PLAN_DEF_T (fallback)
  function _computeEnd(debutStr, plH, continu){
    // Fin = début + heures nettes + coupure dejeuner (sauf horaire continu).
    // La pause suit PLAN_PAUSE_MIN (réglage domaine) et non plus 60 en dur :
    // sinon un domaine à 30 min voyait une fin décalée d'1 h (ex. 08:00+8h → 17:00 au lieu de 16:30).
    var parts=debutStr.split(':');
    var startMin=parseInt(parts[0])*60+parseInt(parts[1]||0);
    var P=(window.PLAN_PAUSE_MIN!=null?window.PLAN_PAUSE_MIN:(PLAN_PAUSE_MIN!=null?PLAN_PAUSE_MIN:60));
    // Seuil a 6 h INCLUS, pas au-dela. La loi n'impose la pause qu'au-dela de
    // 6 h de travail effectif, mais la question posee ici n'est pas legale :
    // c'est « cette journee enjambe-t-elle midi ». Une journee de 6 h qui prend
    // a 09:00 finit a 16:00 avec la coupure, pas a 15:00 — c'est le cas reel des
    // jours a horaire decale, ou l'on debauche avec le reste de l'equipe.
    // Une journee de 6 h reellement faite d'une traite se marque `continu`.
    var pauseMin=(!continu&&plH>=6)?P:0;
    var endMin=startMin+Math.round(plH*60)+pauseMin;
    return String(Math.floor(endMin/60)).padStart(2,'0')+':'+String(endMin%60).padStart(2,'0');
  }
  if(plId!==undefined&&m!==undefined){
    var _ct=(PLANNING_TEMPLATES[(yr!=null?yr:_pY())]||{})[plId];
    if(_ct){
      // 1. Code jour D/M/A — timing selon la position dans la sequence de jours
      // ⚠️ Les horaires 09:00 et 16:30 ci-dessous sont ECRITS EN DUR. Ils viennent
      // du cas d'un salarie precis d'un domaine precis. Tant qu'ils ne sont pas
      // lus depuis le CSV, ce bloc n'est pas generalisable a un autre client.
      // D (1er jour ou isolé) : début mensuel → 16h30  (ex: 07:00→16:30 = 8h30 en juin)
      // M (milieu, séq. ≥ 3j) : 09:00 → 16h30          (= 6h30 net quel que soit le mois)
      // A (dernier, auto-lendemain) : 09:00 → fin mensuelle (= 6h30 si fin=16:30)
      // Fix v3.28: v3.27 ne différenciait pas D/M/A → M et A affichaient 8h30 au lieu de 6h30.
      if(d!==undefined&&_ct._timings_jour&&_ct._timings_jour[m]&&_ct._timings_jour[m][d]){
        var tCode=_ct._timings_jour[m][d];
        var base=(_ct._timings&&_ct._timings[m])||{d:'07:00',f:'16:30'};
        var bd=base.d||base.debut||'07:00';
        var bf=base.f||base.fin||'16:30';
        if(tCode==='M')return{d:'09:00',f:'16:30',continu:false};
        if(tCode==='A')return{d:'09:00',f:bf,     continu:false};
        return{d:bd,f:'16:30',continu:false}; // D (défaut, 1er jour ou isolé)
      }
      // 2. Horaire mensuel : utiliser l'heure de début du mois + calculer fin depuis pl
      // → gère l'annualisation : vendredi 5h en juin (début 07:00) → 07:00→12:00
      //                          vendredi 5h en février (début 08:00) → 08:00→13:00
      if(pl>0&&_ct._timings&&_ct._timings[m]){
        var _mt=_ct._timings[m];
        var _debut=_mt.d||_mt.debut||'07:00';
        var _fin=_computeEnd(_debut,pl,_mt.continu);
        return{d:_debut,f:_fin,continu:_mt.continu||false};
      }
    }
  }
  return PLAN_DEF_T[pl]||{d:'07:00',f:'16:00'};
}
function _planFmt(h){
  if(h===null||h===undefined)return '\u2014';
  var neg=h<0,abs=Math.abs(h),hh=Math.floor(abs),mm=Math.round((abs-hh)*60);
  return (neg?'-':'')+(mm===0?(hh+'h'):(hh+'h'+(mm<10?'0':'')+mm));
}
function _planFmtE(h){return h===0?'=':(h>0?'+':'')+_planFmt(h);}
function _planFmtEtp(r){return (r||0).toFixed(2);}
function _planMbrs(){return (window.MEMBRES||[]).filter(function(m){return m.statut!=='Inactif';});}
function _planInContract(mbr,m,d){
  // Retourne true si le jour d du mois m est dans la période de contrat du membre
  // Comparaison sur chaînes YYYY-MM-DD (tri lexicographique = tri chronologique)
  if(!mbr.debut_contrat&&!mbr.fin_contrat)return true;
  var year=_pY();
  var ds=year+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
  if(mbr.debut_contrat&&ds<mbr.debut_contrat)return false;
  if(mbr.fin_contrat&&ds>mbr.fin_contrat)return false;
  return true;
}
// ══════════════════════════════════════════════════════════════════════
// LES DEUX PORTAILS — ne jamais confondre le compteur et la mesure
// ══════════════════════════════════════════════════════════════════════
// _planInContract (au-dessus) repond a la question 3 : « combien d'heures
// lui doit-on SUR CE CONTRAT ? ». Il ne voit QUE le contrat en cours, et
// c'est juste : un contrat qui se termine SOLDE son compteur (paye, donc a
// zero) ; le contrat suivant, s'il demarre apres une coupure, se recale sur
// l'annualisation depuis sa date de debut, sans du ni indu. Ses ~35 points
// d'appel — plafond des 1607 h, conges, grille, maxima hebdo — NE DOIVENT
// PAS etre elargis.
//
// _planJourCouvert repond a la question 2 : « a-t-il travaille CE JOUR-LA,
// sous n'importe lequel de ses contrats ? ». C'est la mesure d'une fenetre
// de dates : masse salariale de l'exercice, capacite, cadence, presence.
// Mesure le 13/08 sur une fiche reelle : un CDD mars->juillet archive puis
// un nouveau contrat en aout donnait 0 h payee sur mars->juillet contre
// 735 h pour la meme fiche non archivee. Meme homme, meme planning ; la
// seule difference etait l'archivage.
function _planJourCouvert(mbr,m,d){
  var P=(typeof window._mvContrats==='function')?window._mvContrats(mbr):null;
  // Pas de tableau, ou fiche sans aucune date : comportement d'origine.
  if(!P||!P.length)return _planInContract(mbr,m,d);
  var year=_pY();
  var ds=year+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
  for(var i=0;i<P.length;i++){
    if(P[i].debut&&ds<P[i].debut)continue;
    if(P[i].fin&&ds>P[i].fin)continue;
    return true;
  }
  return false;
}
// Drapeau de contexte, meme patron que _planCtxYear. Pose UNIQUEMENT par les
// quatre entrees de mesure ci-dessous ; partout ailleurs il vaut false et le
// code se comporte a l'octet pres comme avant ce lot.
var _planWideCtx=false;
// Deuxieme contexte, oppose au premier : borner a UN contrat precis au lieu de
// les voir tous. Sert au releve PDF, qui est un document PAR CONTRAT — un mois
// couvert par un contrat archive sortait blanc, faute de pouvoir s'y borner.
// Le contrat gagne toujours sur le mode large : on demande un document precis.
var _planCtrCtx=null;
function _planDansCtr(m,d){
  var ds=_pY()+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
  if(_planCtrCtx.debut&&ds<_planCtrCtx.debut)return false;
  if(_planCtrCtx.fin&&ds>_planCtrCtx.fin)return false;
  return true;
}
function _planInContractRead(mbr,m,d){
  if(_planCtrCtx)return _planDansCtr(m,d);
  return _planWideCtx?_planJourCouvert(mbr,m,d):_planInContract(mbr,m,d);
}
// Lecteur des fonctions qui doivent suivre UN contrat mais JAMAIS le mode large :
// le plafond annuel, le travail du mois, les jours travailles. Elargir leur
// portee melangerait deux compteurs — c'est exactement ce que la question 3
// interdit.
function _planInContractCtr(mbr,m,d){
  if(_planCtrCtx)return _planDansCtr(m,d);
  return _planInContract(mbr,m,d);
}
// try/finally : une exception dans fn() ne doit JAMAIS laisser le drapeau
// pose — le reste de l'ecran lirait alors les contrats passes en silence.
// Restaure la valeur PRECEDENTE et non false, pour supporter l'imbrication.
function _planWide(fn){
  var _sv=_planWideCtx; _planWideCtx=true;
  try{ return fn(); } finally { _planWideCtx=_sv; }
}
// Meme patron. c = {debut,fin} ou null (null = ne borne rien).
function _planSurContrat(c,fn){
  var _sv=_planCtrCtx; _planCtrCtx=c||null;
  try{ return fn(); } finally { _planCtrCtx=_sv; }
}
function _planHasContractThisMonth(mbr,planMonth){
  // Retourne true si le membre a au moins un jour de contrat dans le mois planMonth
  if(!mbr.debut_contrat&&!mbr.fin_contrat)return true;
  var year=_pY();
  var mm=String(planMonth+1).padStart(2,'0');
  var firstDay=year+'-'+mm+'-01';
  var lastDay=year+'-'+mm+'-'+String(_planDays(planMonth)).padStart(2,'0');
  if(mbr.debut_contrat&&mbr.debut_contrat>lastDay)return false; // contrat commence après le mois
  if(mbr.fin_contrat&&mbr.fin_contrat<firstDay)return false;    // contrat terminé avant le mois
  return true;
}
function _planPlId(m){return m.planning_id||'standard';}

// ══ EQUIPE COLLECTIVE — l'effectif d'une ligne, jour par jour ══
// La saisie du jour prime sur le defaut de la fiche. Un membre NON collectif vaut
// toujours 1 : aucun appelant n'a donc a tester avant d'appeler, et un oubli de
// test ne peut pas fausser un total (c'est exactement le piege qu'on evite ici).
function _planEffN(mbr,m,d){
  if(!window._mvEstCollectif||!window._mvEstCollectif(mbr))return 1;
  var e=_pEntDay(mbr.nom,m,d);
  var v=e?parseInt(e.effectif,10):NaN;
  if(!isNaN(v)&&v>=1)return Math.min(999,v);
  return window._mvEffDef(mbr);
}
// Heures-personnes du mois : chaque jour compte ses heures MULTIPLIEES par son
// effectif. C'est le seul total qui ait un sens pour une equipe collective —
// _planSummary continue de renvoyer les heures d'UNE personne.
function _planCollH(mbr,m){
  var plId=_planPlId(mbr),tot=0;
  for(var d=1;d<=_planDays(m);d++){
    if(!_planInContract(mbr,m,d))continue;
    tot+=_planEffective(plId,m,d,_pEntDay(mbr.nom,m,d))*_planEffN(mbr,m,d);
  }
  return tot;
}
// Effectif MAXIMUM atteint dans le mois — etiquette de la ligne. Le maximum et
// non la moyenne : « on etait 32 au plus fort » est la question qu'on se pose.
function _planEffMax(mbr,m){
  if(!window._mvEstCollectif||!window._mvEstCollectif(mbr))return 1;
  var n=window._mvEffDef(mbr);
  for(var d=1;d<=_planDays(m);d++){var v=_planEffN(mbr,m,d);if(v>n)n=v;}
  return n;
}
// Encart affiche partout ou un compteur individuel n'aurait pas de sens.
function _planCollNote(mbr){
  var n=_planEffMax(mbr,planMonth),ch=_planCollH(mbr,planMonth);
  return '<div style="background:var(--tag-amber-bg,#fffbeb);border:1.5px solid #fcd34d;border-radius:12px;padding:13px 14px;margin-top:10px">'
    +'<div style="font-size:13px;font-weight:700;color:var(--tag-amber-tx,#92400e);margin-bottom:4px">\u{1F465} \u00c9quipe collective \u00b7 '+n+' personne'+(n>1?'s':'')+' au plus fort</div>'
    +'<div style="font-size:15px;font-weight:700;color:var(--tag-amber-tx,#92400e);margin-bottom:6px">'+_planFmt(ch)+' '+PLAN_MOIS[planMonth]+'</div>'
    +'<div style="font-size:11.5px;color:var(--tag-amber-tx,#92400e);line-height:1.5">Heures d\u2019une journ\u00e9e multipli\u00e9es par le nombre de personnes pr\u00e9sentes ce jour-l\u00e0. Une \u00e9quipe collective n\u2019a ni compteur des 1607\u00a0h, ni cong\u00e9s pay\u00e9s, ni heures suppl\u00e9mentaires, ni relev\u00e9 individuel\u00a0: ces compteurs sont propres \u00e0 UN salari\u00e9. Le nombre par d\u00e9faut se r\u00e8gle dans R\u00e9glages \u203a \u00c9quipe, jour par jour ici via <b>S\u00e9lection multiple \u2192 \u{1F465} Effectif</b>.</div>'
  +'</div>';
}
// ── Calcul heures d'un jour — timing annualisé prioritaire ──
// Sans entrée : _planDefTiming calcule fin = début_mois + pl + pause → toujours cohérent
// Avec entrée : absent/CP/timing sauvegardé/modifier (comportement inchangé)
function _planDayH(plId,m,d,e,yr){
  var pl=_planPlanned(plId,m,d,yr);
  if(e){
    if(e.absent){
      var _mo=_planAbsMotif(e);
      // ★★★ ASSIMILE = TRAVAIL EFFECTIF (art. L6222-24 pour le CFA, L3142 pour
      //   l'evenement familial). Ces heures sont dues par la LOI, pas par la
      //   politique du domaine : elles passent AVANT la fenetre « heures dues »,
      //   qui ne concerne que les absences qui, elles, DOIVENT des heures
      //   (injustifiee, retard). Avant ce lot le garde-fou etait teste en
      //   premier et rendait 0 pour une journee de formation tant que le
      //   reglage n'etait pas pose — alors que _planWorkH, lui, comptait deja
      //   ces heures. Deux fonctions qui repondent differemment sur le meme
      //   jour : c'est ce desaccord que ce lot ferme.
      if(_mo.assim)return pl;
      // Hors fenetre : comportement historique strict (toute absence = 0 h).
      if(!_planDuesActive(m))return 0;
      if(_mo.heures)return Math.max(0,pl-_planAbsH(e));    // retard : seules SES heures sont perdues
      return 0;
    }
    if(e.type==='cp')return e.heures||pl;
    if(e.type==='recup')return 0;
    if(e.timing)return _planTimingH(e.timing.debut,e.timing.fin,e.timing.continu);
    return pl+(e.modifier||0);
  }
  if(pl<=0)return 0;
  var defT=_planDefTiming(pl,plId,m,d,yr);
  var tH=_planTimingH(defT.d||defT.debut,defT.f||defT.fin,defT.continu||false);
  return tH>0?tH:pl;
}
function _planEffective(plId,m,d,e){return _planDayH(plId,m,d,e);}

// ── TRAVAIL EFFECTIF (art. L3121-1) — distinct des heures REMUNEREES ──
// _planDayH  = heures comptees/remunerees (un CP y vaut les heures prevues : maintien de salaire).
// _planWorkH = heures reellement travaillees. Seule base licite pour :
//   les durees maximales (10 h/j, 48 h/sem, 44 h moy.), le compteur d'annualisation
//   et les heures de modulation. Un conge paye, un arret ou une recup valent 0.
function _planWorkH(plId,m,d,e,yr){
  if(!e)return _planDayH(plId,m,d,null,yr);
  if(e.type==='cp')return 0;
  if(e.type==='recup')return 0;
  if(e.absent){
    var mo=_planAbsMotif(e);
    var prevu=_planDayH(plId,m,d,null,yr);
    if(mo.assim)return prevu;                              // formation / evenement familial
    if(mo.heures)return Math.max(0,prevu-_planAbsH(e));    // retard : journee amputee
    return 0;
  }
  return _planDayH(plId,m,d,e,yr);
}
// Travail effectif d'un mois (jours sous contrat uniquement)
function _planWorkMonth(mbr,m){
  var plId=_planPlId(mbr),ent=_pEntMonth(mbr.nom,m),w=0;
  for(var d=1;d<=_planDays(m);d++){
    if(!_planInContractCtr(mbr,m,d))continue;
    w+=_planWorkH(plId,m,d,ent[d]);
  }
  return w;
}
// Travail effectif sur une plage de dates reelles (bornes incluses) — annee-aware,
// necessaire au decompte hebdomadaire qui chevauche les mois et les annees.
function _planWorkRange(mbr,from,to){
  var plId=_planPlId(mbr),_sv=_planCtxYear,tot=0,guard=0;
  var cur=new Date(from.getFullYear(),from.getMonth(),from.getDate());
  var end=new Date(to.getFullYear(),to.getMonth(),to.getDate());
  while(cur<=end&&guard<420){
    guard++;
    var yr=cur.getFullYear(),mi=cur.getMonth(),d=cur.getDate();
    _planCtxYear=yr;
    if(_planInContract(mbr,mi,d)){
      var yb=(PLANNING_ENTRIES[mbr.nom]||{})[yr]||{};
      tot+=_planWorkH(plId,mi,d,(yb[mi]||{})[d]);
    }
    cur.setDate(cur.getDate()+1);
  }
  _planCtxYear=_sv;
  return tot;
}
// ★★ HEURES-PERSONNES SUR UNE PLAGE DE DATES REELLES — socle de la masse salariale.
//    Un seul parcours, deux mesures, exactement la paire documentee juste en dessous :
//      mode 'paid' -> _planDayH  = SOCLE PAYE       (un conge paye compte ses heures)
//      mode 'work' -> _planWorkH = TRAVAIL EFFECTIF (un conge paye compte 0)
//    Un exercice COMPTABLE veut le premier : un CP se paie. La capacite au champ, elle,
//    veut le second. Les melanger donnerait deux ecrans qui se contredisent.
//
//    ★ EFFECTIF COLLECTIF INTEGRE : chaque jour est multiplie par _planEffN, qui vaut
//      1 pour un membre normal et l'effectif du jour pour une ligne d'equipe. Sans cela
//      une ligne « 8 vendangeurs » pesait UNE personne dans la masse salariale.
//      _planCtxYear etant pose sur l'annee du jour courant, _pEntDay lit la bonne annee
//      — une fenetre a cheval sur deux annees civiles reste juste.
// ENTREE DE MESURE 1/4 — fenetre de dates. Appelee seulement par
// _planPaidRange / _planWorkPersRange, donc seulement par le Pilotage.
function _planRangeH(mbr,from,to,mode){
  return _planWide(function(){ return _planRangeH_(mbr,from,to,mode); });
}
function _planRangeH_(mbr,from,to,mode){
  var plId=_planPlId(mbr),_sv=_planCtxYear,tot=0,guard=0;
  var cur=new Date(from.getFullYear(),from.getMonth(),from.getDate());
  var end=new Date(to.getFullYear(),to.getMonth(),to.getDate());
  while(cur<=end&&guard<400){
    guard++;
    var yr=cur.getFullYear(),mi=cur.getMonth(),d=cur.getDate();
    _planCtxYear=yr;
    if(_planInContractRead(mbr,mi,d)){
      var yb=(PLANNING_ENTRIES[mbr.nom]||{})[yr]||{}, e=(yb[mi]||{})[d];
      var h=(mode==='work')?_planWorkH(plId,mi,d,e,yr):_planDayH(plId,mi,d,e,yr);
      if(h>0) tot+=h*_planEffN(mbr,mi,d);
    }
    cur.setDate(cur.getDate()+1);
  }
  _planCtxYear=_sv;
  return tot;
}
// Exposees pour Pilotage > Economie > Exercice : la masse salariale d'une fenetre de
// dates vient d'ICI, jamais d'une copie privee du parcours du planning.
function _planPaidRange(mbr,from,to){ return _planRangeH(mbr,from,to,'paid'); }
function _planWorkPersRange(mbr,from,to){ return _planRangeH(mbr,from,to,'work'); }
window._planPaidRange     = _planPaidRange;
window._planWorkPersRange = _planWorkPersRange;
window._planWorkMonth=_planWorkMonth;
function _planCalcMonth(mbr,m){
  var plId=_planPlId(mbr);
  var ent=_pEntMonth(mbr.nom,m);
  var w=0;
  for(var d=1;d<=_planDays(m);d++){
    if(!_planInContractRead(mbr,m,d))continue;
    w+=_planDayH(plId,m,d,ent[d]);
  }
  return w;
}
// ★★ Heures PERDUES sur les jours d'absence du mois.
//   duesOnly=false -> toutes les absences : ce montant sort de la REFERENCE du mois, si bien
//     qu'une absence n'a plus aucun effet sur l'ecart (elle ne cree ni credit ni dette).
//   duesOnly=true  -> uniquement absence injustifiee et retard : ce montant est DU et tire
//     sur le compteur d'heures comme une recup.
//   Les deux mesures partagent la meme arithmetique (prevu - compte) : impossible qu'elles
//   divergent, et un retard superieur a la journee ne peut pas depasser la journee.
function _planAbsLostH(mbr,m,duesOnly){
  if(!_planDuesActive(m))return 0;
  var plId=_planPlId(mbr),ent=_pEntMonth(mbr.nom,m),h=0;
  for(var d=1;d<=_planDays(m);d++){
    var e=ent[d];
    if(!e||!e.absent)continue;
    if(!_planInContractRead(mbr,m,d))continue;
    var mo=_planAbsMotif(e);
    if(duesOnly&&mo.id!=='injustifie'&&!mo.heures)continue;
    h+=Math.max(0,_planPlanned(plId,m,d)-_planDayH(plId,m,d,e));
  }
  return h;
}
function _planAbsNeutH(mbr,m){return _planAbsLostH(mbr,m,false);}
function _planDuesMonth(mbr,m){return _planAbsLostH(mbr,m,true);}
window._planDuesMonth=_planDuesMonth;

// ★ JOUR DE REMPLACEMENT — heures d'un jour travaille HORS planning en echange d'un
//   jour planifie pris ailleurs (fermeture decalee, conge pose a une autre date).
//   Ces heures entrent dans la REFERENCE a hauteur de ce qui a ete fait : l'ecart du mois
//   reste nul, aucune heure supplementaire n'est creee. C'est le pendant symetrique de la
//   recup, qui neutralise l'autre moitie de l'echange.
//   GARDE : le drapeau n'agit que si le jour est bien a 0 h au planning. Si le template
//   evolue et redonne des heures a ce jour, le drapeau devient inoperant plutot que de
//   compter la journee deux fois (dans la grille ET en remplacement).
function _planRempH(mbr,m){
  var plId=_planPlId(mbr),ent=_pEntMonth(mbr.nom,m),h=0;
  for(var d=1;d<=_planDays(m);d++){
    var e=ent[d];
    if(!e||!e.remplacement)continue;
    if(!_planInContractRead(mbr,m,d))continue;
    if(_planPlanned(plId,m,d)>0)continue;
    h+=_planDayH(plId,m,d,e);
  }
  return h;
}
window._planRempH=_planRempH;
function _planSummary(mbr,m){
  var plId=_planPlId(mbr);
  // ref : heures prévues sur les jours sous contrat — hors jours pris en récup
  var tpl=_planGetTpl(plId);
  var mo=tpl[m]||{};
  var ent=_pEntMonth(mbr.nom,m);
  var ref=Object.keys(mo).reduce(function(s,k){
    if(!/^\d+$/.test(k))return s;
    var dd=parseInt(k,10);
    if(!_planInContractRead(mbr,m,dd))return s;
    if(ent[dd]&&ent[dd].type==='recup')return s;
    return s+(parseFloat(mo[k])||0);
  },0);
  ref+=_planRempH(mbr,m);   // ★ jours de remplacement : entrent dans la reference → ecart nul
  ref-=_planAbsNeutH(mbr,m);// ★ absences : sortent de la reference → ecart neutre, dette comptee a part
  var worked=_planCalcMonth(mbr,m);
  return{ref:ref,worked:worked,ecart:worked-ref,etp:ref>0?worked/ref:0};
}
// Heures reellement presentes au champ (mois m) : prevues sur jours sous contrat, hors recup/CP/absence.
function _planPresentRef(mbr,m){
  var plId=_planPlId(mbr);
  var tpl=_planGetTpl(plId);
  var mo=tpl[m]||{};
  var ent=_pEntMonth(mbr.nom,m);
  return Object.keys(mo).reduce(function(s,k){
    if(!/^\d+$/.test(k))return s;
    var dd=parseInt(k,10);
    if(!_planInContractRead(mbr,m,dd))return s;
    var e=ent[dd];
    if(e&&(e.absent||e.type==='cp'||e.type==='recup'))return s;
    return s+(parseFloat(mo[k])||0);
  },0)+_planRempH(mbr,m);   // ★ un jour de remplacement est une presence reelle au champ
}
window._planPresentRef=_planPresentRef;
// Statuts payes mais NON travailles : _planEffective y renvoie quand meme les heures
// prevues (cf. rowFor du PDF) -> ils doivent etre ecartes AVANT le test sur les heures.
var _PLAN_ST_OFFDAY={cp:1,recup:1,absent:1};
// Nombre de JOURS REELLEMENT TRAVAILLES du mois (declaration MSA / TESA saisonniers).
// Un jour compte s'il est sous contrat, hors CP/recup/absence, ET d'heures effectives > 0.
// Le critere est l'HEURE FAITE, pas le type de jour (decision 24/07/2026) : un samedi ou un
// ferie reellement travaille compte ; un week-end ou un repos est a 0 h donc s'exclut seul.
function _planDaysWorked(mbr,m){
  var plId=_planPlId(mbr),ent=_pEntMonth(mbr.nom,m),n=0;
  for(var d=1;d<=_planDays(m);d++){
    if(!_planInContractCtr(mbr,m,d))continue;
    var e=ent[d],st=_planDayStatus(plId,m,d,e);
    if(_PLAN_ST_OFFDAY[st.t])continue;
    if(_planEffective(plId,m,d,e)>0.0001)n++;
  }
  return n;
}
// Ordre des travaux de printemps (valide terrain) -> fenetre relative [0..1] dans la saison datee.
// Reparation/pliage/entreplantation (debut) -> ebourgeonnage/relevage/palissage (milieu) -> accolage (fin) ; pioche partout.
// Bornes calees sur debut/fin de la saison. Tache inconnue -> pleine saison.
function _mvTaskNorm(s){ return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
var _MV_TASK_WIN={ reparation:[0,0.20], pliage:[0,0.25], entreplantation:[0,0.25], plantation:[0,0.25], relevage:[0.25,0.65], palissage:[0.25,0.65], ebourgeonnage:[0.25,0.75], accolage:[0.65,0.90], pioche:[0,1] };
function _mvTaskWin(nom){ return _MV_TASK_WIN[_mvTaskNorm(nom)]||[0,1]; }

// -- Charge & ETP d'une saison : somme (h/ha x surface concernee) des taches de la saison,
//    repartie sur la periode datee [debut,fin] au prorata de la capacite 1 ETP de chaque mois
//    (template standard). L'ETP cible = nb d'ouvriers moyens necessaires pour finir dans les delais.
function _chargeSaisonData(s){
  if(!s||!s.debut||!s.fin)return null;
  _planCtxYear=null; _planMigrateYears();
  var TAC=window.TACHES||[];
  // -- Quelles taches appartiennent a CETTE periode ? --------------------------
  // Source unique = la liste explicite portee par la periode (s.taches), celle que
  // lit deja Reglages via getTachesSaison(). On interroge la periode PASSEE EN
  // ARGUMENT, jamais la periode consultee : _chargeSaisonData sert aussi le
  // comparateur d'Archives, qui rejoue des campagnes anciennes.
  // AVANT : filtre « saison par type » (1er mot du nom + t.anytime). Toute tache
  // marquee anytime (Vendange, Arrachage, Desherbage manuel, Effeuillage) entrait
  // dans TOUTES les periodes. Vendange a 80 h/ha ajoutait ~941 h fantomes a un
  // hiver de 11,76 ha, soit pres de 30 % de charge inventee : ETP cible, frise,
  // courbe mensuelle, marge, date de fin projetee et simulateur de renfort tous
  // surevalues -- et une ligne « Vendange » dans Pilotage > Parametrage que
  // Reglages n'affichait pas. Deux definitions du meme concept = deux ecrans qui
  // se contredisent.
  // REPLI : periode creee avant la migration (pas de s.taches) -> ancien filtre,
  // comportement strictement inchange.
  var _nomsPer=(typeof window._saisonTaches==='function')?window._saisonTaches(s.nom):null;
  var ns=String(s.nom||'').split(' ')[0];
  function _inSaison(t){
    if(_nomsPer) return _nomsPer.indexOf(t.nom)>=0;
    return !!(t.anytime || (t.saisons&&t.saisons.length ? t.saisons.indexOf(ns)>=0 : (t.saison===ns||ns.indexOf(t.saison)>=0)));
  }
  // surface concernee = parcelles non arrachees et non exclues pour la tache (repro de _surfConcern, non expose)
  function surfFn(nm){ return (window.PARCELLES||[]).filter(function(p){return p&&p.statut!=='Arrachee'&&((p.tachesExclues||[]).indexOf(nm)<0);}).reduce(function(a,p){return a+(parseFloat(p.surface)||0);},0); }
  var pg=window.SAISON_PASSAGES||{};
  var charge=0, taskDet=[];
  TAC.forEach(function(t){
    if(!t)return;
    if(!_inSaison(t))return;
    // passages (Ebourg./Pioche) : hha par passage x nb de passages ; niveaux (Relevage) : hha deja total
    var mult=(t.type==='passages')?((pg[t.nom])||2):1;
    var h;
    if((t.trous||t.nom==='Entreplantation') && typeof window._plantPlanTrous==='function' && window._plantPlanTrous(t.nom)>0){
      h=window._plantPlanTrous(t.nom)*((typeof window._plantMinTrou==='function')?window._plantMinTrou():3)/60;
    } else if(t.trous||t.nom==='Entreplantation'){
      h=0;
    } else {
      h=(parseFloat(t.hha)||0)*mult*(surfFn(t.nom)||0);
    }
    if(h>0){ charge+=h; taskDet.push({nom:t.nom,h:h}); }
  });
  var tpl=_planGetTpl('standard');
  // capMonth ANNEE-AWARE (annee, index mois 0-11). Le template est un motif annuel repetitif
  // (cle = index de mois), mais la comparaison de dates porte la VRAIE annee -> saisons a cheval
  // sur l'annee civile (hiver dec.->mars) supportees.
  function capMonth(yr,mo,full){
    var mt=_planGetTpl('standard',yr)[mo]||{}, sum=0;
    Object.keys(mt).forEach(function(k){
      if(!/^[0-9]+$/.test(k))return;
      if(!full){
        var d=parseInt(k,10);
        var ds=yr+'-'+(mo+1<10?'0':'')+(mo+1)+'-'+(d<10?'0':'')+d;
        if(ds<s.debut||ds>s.fin)return;
      }
      sum+=parseFloat(mt[k])||0;
    });
    return sum;
  }
  var _dP=s.debut.split('-'), _fP=s.fin.split('-');
  var yDeb=parseInt(_dP[0],10), moDeb=parseInt(_dP[1],10)-1;
  var yFin=parseInt(_fP[0],10), moFin=parseInt(_fP[1],10)-1;
  if(isNaN(yDeb)||isNaN(moDeb)||isNaN(yFin)||isNaN(moFin))return null;
  var absDeb=yDeb*12+moDeb, absFin=yFin*12+moFin;
  if(absFin<absDeb)return null;
  function _dimUTC(yr,mo){ return new Date(Date.UTC(yr,mo+1,0)).getUTCDate(); }
  var months=[];
  // Iteration des mois en ABSOLU (annee*12+mois) -> traverse l'annee civile ; yr conserve sur
  // chaque entree pour un rendu (frise / courbe de demande) correctement place cote pilotage.
  for(var _ab=absDeb;_ab<=absFin;_ab++){
    var _yr=Math.floor(_ab/12), _mo=((_ab%12)+12)%12;
    var cr=capMonth(_yr,_mo,false);
    if(cr>0)months.push({m:_mo,yr:_yr,capRef:cr});
  }
  var capRefTotal=months.reduce(function(a,x){return a+x.capRef;},0);
  var etpCible=capRefTotal>0?charge/capRefTotal:0;
  months.forEach(function(x){ x.charge=capRefTotal>0?charge*(x.capRef/capRefTotal):0; x.etp=x.capRef>0?x.charge/x.capRef:0; });
  // Effectif de la SAISON, pas de l'instant. Le statut « Inactif » se pose a la main
  // quand un contrat se termine : filtrer dessus faisait disparaitre RETROACTIVEMENT
  // les saisonniers de toute la campagne (courbe, ETP present, capacite). La regle
  // « son contrat recoupe-t-il la periode ? » vit dans utils.js, une seule fois.
  var mbrs=(window.MEMBRES||[]).filter(function(m){
    return (typeof window._mvEnContratSurPeriode==='function')
      ? window._mvEnContratSurPeriode(m,s.debut,s.fin)
      : (m && m.statut!=='Inactif' && !m.bureau);
  });
  // Poids d'une fiche : une equipe COLLECTIVE pese son EFFECTIF, pas 1.
  // _headWeek et _capWeekReal l'appliquaient deja ; capEquipe et capPresent non.
  // Consequence mesuree le 11/08 sur un domaine reel : une equipe de 40 vendangeurs
  // comptait pour UNE personne, capEquipe sortait a ~600 h au lieu de ~3300, et la
  // barre « Ou va le temps » affichait une part de 392 % — une repartition qui
  // depasse 100 % — pendant qu'« Autres » tombait a 0 h par saturation du Math.max.
  // Une seule definition du poids, ici comme dans _headWeek.
  function _mbPoids(mb){
    return (window._mvEstCollectif && window._mvEstCollectif(mb) && typeof window._mvEffDef==='function')
      ? window._mvEffDef(mb) : 1;
  }
  var capEquipe=0;
  months.forEach(function(x){
    var full=capMonth(x.yr,x.m,true); var ratio=full>0?x.capRef/full:1;
    // ENTREE DE MESURE 2/4 — capacite de la saison. mbrs vient de
    // _mvEnContratSurPeriode (tous contrats) : sans le mode large, une fiche
    // reembauchee etait DANS la liste et pesait 0 h de capacite.
    _planCtxYear=x.yr; _planWide(function(){ mbrs.forEach(function(mb){ capEquipe+=(((_planSummary(mb,x.m)||{}).ref)||0)*ratio*_mbPoids(mb); }); }); _planCtxYear=null;
  });
  var etpDispo=capRefTotal>0?capEquipe/capRefTotal:0;
  // Repartition par ORDRE des taches (vue par pics) + capacite reellement presente / mois.
  function _ord(ymd){ var p=String(ymd||'').split('-'); return Math.round((Date.UTC(+p[0],(+p[1]||1)-1,(+p[2]||1))-Date.UTC(2026,0,1))/86400000); }
  function _ford(n){ var dd=new Date(Date.UTC(2026,0,1)+n*86400000); var mm=dd.getUTCMonth()+1, dj=dd.getUTCDate(); return dd.getUTCFullYear()+'-'+(mm<10?'0'+mm:mm)+'-'+(dj<10?'0'+dj:dj); }
  // Ordinal du 1er / dernier jour d'un mois DONNE (annee-aware) — remplace les ex-_moFirst/_moLast
  // qui figeaient 2026 (KO des que la saison passait sur 2027).
  function _moFirstY(yr,mo){ return _ord(yr+'-'+String(mo+1).padStart(2,'0')+'-01'); }
  function _moLastY(yr,mo){ return _ord(yr+'-'+String(mo+1).padStart(2,'0')+'-'+String(_dimUTC(yr,mo)).padStart(2,'0')); }
  var spanS=_ord(s.debut), spanE=_ord(s.fin), spanLen=Math.max(1,spanE-spanS);
  var _cfgW=(window.CONFIG&&window.CONFIG.task_windows)||{};
  var _ech=(s&&s.echeances&&typeof s.echeances==='object')?s.echeances:{};
  // Capacite 1 ETP d'un jour (ordinal) selon le template — base de l'etalement prorata-capacite.
  function _cap1(o){ var dt=new Date(Date.parse('2026-01-01T00:00:00')+o*86400000); var mo=_planGetTpl('standard',dt.getFullYear())[dt.getMonth()]||{}; var hv=mo[String(dt.getDate())]; return hv!=null?(parseFloat(hv)||0):0; }
  var taskWindows=taskDet.map(function(t){
    var key=_mvTaskNorm(t.nom), ws, we, custom=false;
    // 1) echeances de la saison (dates saisies dans « Modifier la periode ») en PRIORITE
    // ★★★ UNE FENETRE QUI NE RENCONTRE PAS LA PERIODE N'EST PAS UNE FENETRE.
    //   AVANT : les deux bornes etaient rabotees sur [spanS,spanE] SANS verifier
    //   qu'il restait quelque chose. Une echeance entierement hors periode donnait
    //   ws=we=spanE, puis `if(we<=ws) we=ws+1` : UN SEUL JOUR. Toutes les heures du
    //   travail tombaient sur ce jour-la, et `need = heures/capacite` explosait sur
    //   la derniere semaine de la periode.
    //   ⚠⚠ Le cas n'est pas theorique : CONFIG.task_windows est un override GLOBAL
    //   a dates ABSOLUES, applique a CHAQUE periode. Un relevage cale sur mai 2027
    //   s'ecrase donc sur le dernier jour de l'hiver 2026-2027, ou ces dates
    //   n'existent pas. Mesure du 12/08 : pic annonce a 46,3 personnes sur un
    //   domaine qui en emploie 2, porte par UNE barre d'un jour, invisible a
    //   l'ecran (1 px) mais assez haute pour ecraser l'axe des 52 semaines.
    //   Desormais : pas de recouvrement = on ignore la consigne et on retombe sur
    //   la fenetre par defaut, en le DISANT (horsPeriode).
    var e=_ech[t.nom], hors=false;
    if(e&&(e.d1||e.d2)){
      var es=_ord(e.d1||s.debut), ee=_ord(e.d2||s.fin);
      if(!isNaN(es)&&!isNaN(ee)&&ee>=es){
        if(ee>=spanS&&es<=spanE){ ws=Math.max(spanS,Math.min(spanE,es)); we=Math.max(spanS,Math.min(spanE,ee))+1; custom=true; }
        else hors=true;
      }
    }
    // 2) sinon CONFIG.task_windows (override global)
    if(!custom){ var ov=_cfgW[key];
      if(ov&&ov.start&&ov.end){ var os=_ord(ov.start), oe=_ord(ov.end);
        if(!isNaN(os)&&!isNaN(oe)&&oe>=os){
          if(oe>=spanS&&os<=spanE){ ws=Math.max(spanS,Math.min(spanE,os)); we=Math.max(spanS,Math.min(spanE,oe))+1; custom=true; }
          else hors=true;
        } }
    }
    // 3) sinon fenetre par defaut (fractions)
    // \u2605\u2605\u2605 LA FENETRE S'ARRETE LE JOUR ECRIT, PAS LA VEILLE.
    //   `we` est la borne EXCLUSIVE de l'etalement : _taskHoursIn et le calcul de
    //   winCap balaient [ws, we[. Elle valait exactement la date de fin saisie, si
    //   bien que le DERNIER JOUR de chaque fenetre ne recevait aucune heure.
    //   \u00ab fin le 25 avril \u00bb faisait travailler jusqu'au 24. Un jour perdu sur
    //   CHAQUE tache, y compris le dernier jour de la periode elle-meme.
    //   Desormais we = (dernier jour voulu) + 1. L'affichage lit `we-1` : les dates
    //   montrees ne bougent pas d'un pixel, c'est le calcul qui gagne le jour.
    if(!custom){ var fr=_mvTaskWin(t.nom); ws=spanS+fr[0]*spanLen; we=spanS+fr[1]*spanLen+1; }
    if(we<=ws)we=ws+1;
    // capacite 1 ETP cumulee sur la fenetre [ws,we) — denominateur de l'etalement prorata-capacite
    var winCap=0; for(var _d=Math.round(ws);_d<Math.round(we);_d++) winCap+=_cap1(_d);
    var s0=(ws-spanS)/spanLen, s1=(we-spanS)/spanLen;
    return {nom:t.nom,h:t.h,s0:s0,s1:s1,ws:ws,we:we,winCap:winCap,start:_ford(ws),end:_ford(we-1),custom:custom,horsPeriode:hors};
  });
  // Heures de t etalees au PRORATA DE LA CAPACITE sur [a,b) : une semaine de feries (capacite ~0)
  // recoit proportionnellement moins de travail -> plus de pic « fantome ». Repli uniforme si winCap==0.
  function _taskHoursIn(t,a,b){ a=Math.max(t.ws,a); b=Math.min(t.we,b); if(b<=a)return 0;
    if(t.winCap>0){ var s=0; for(var o=Math.round(a);o<Math.round(b);o++) s+=_cap1(o); return t.h*s/t.winCap; }
    return (t.h/(t.we-t.ws))*(b-a); }
  months.forEach(function(x){
    x.chargeOrd=0;
    x.o0=_moFirstY(x.yr,x.m); x.o1=_moLastY(x.yr,x.m);   // ordinaux annee-aware (rendu pilotage)
    x.f0=(Math.max(spanS,x.o0)-spanS)/spanLen;
    x.f1=(Math.min(spanE,x.o1)-spanS)/spanLen;
  });
  taskWindows.forEach(function(t){
    months.forEach(function(x){
      x.chargeOrd+=_taskHoursIn(t, Math.max(spanS,x.o0), Math.min(spanE,x.o1)+1);
    });
  });
  months.forEach(function(x){
    var full=capMonth(x.yr,x.m,true); var ratio=full>0?x.capRef/full:1;
    // ENTREE DE MESURE 3/4 — capacite reellement presente.
    var cp=0; _planCtxYear=x.yr; _planWide(function(){ mbrs.forEach(function(mb){ cp+=(_planPresentRef(mb,x.m)||0)*ratio*_mbPoids(mb); }); }); _planCtxYear=null;
    x.capPresent=cp;
    x.etpReq=x.capRef>0?x.chargeOrd/x.capRef:0;
    x.etpPres=x.capRef>0?x.capPresent/x.capRef:0;
  });
  var capPresentTotal=months.reduce(function(a,x){return a+x.capPresent;},0);
  var etpPresent=capRefTotal>0?capPresentTotal/capRefTotal:0;
  // Demande hebdomadaire (courbe personnes / semaine) — capacite 1 ETP via le meme template que capRef
  function _capDaysOrd(o0,o1){ var sum=0,a=Math.max(o0,spanS),b=Math.min(o1,spanE); for(var o=a;o<=b;o++){ var dt=new Date(Date.parse('2026-01-01T00:00:00')+o*86400000); var mo=_planGetTpl('standard',dt.getFullYear())[dt.getMonth()]||{}; var hv=mo[String(dt.getDate())]; if(hv!=null)sum+=parseFloat(hv)||0; } return sum; }
  // Effectif present LISSE : tetes non-bureau sous contrat, prorata de jours dans la semaine.
  // ANNEE REELLE via _ford (contrairement a _planInContract qui fige l'annee sur l'horloge -> KO saison a cheval sur l'an civil).
  // Question 2 — « etait-il la CE JOUR-LA ? » : TOUS les contrats de la fiche,
  // le contrat en cours ET les precedents (utils.js, _mvContrats). C'est cette
  // lecture-la qui effacait le passe : un salarie reembauche n'existait plus sur
  // les campagnes ou il avait pourtant travaille.
  // ⚠️ NE PAS CONFONDRE avec _planInContract (question 3, ~35 appels) : plafond
  // des 1607 h, conges, grille du planning. Celui-la ne voit QUE le contrat en
  // cours et NE DOIT PAS etre elargi — un contrat qui se termine SOLDE son
  // compteur (paye, donc a zero) et le suivant repart de sa date de debut, sans
  // du ni indu. Les fondre en un seul fausserait la paie.
  // Pour la MESURE d'une fenetre de dates (masse salariale, capacite, cadence,
  // presence), le portail est _planJourCouvert, pose par _planWide.
  function _inContractDay(mb,ds){
    var P=(typeof window._mvContrats==='function')?window._mvContrats(mb):null;
    if(!P){ if(!mb.debut_contrat&&!mb.fin_contrat)return true; if(mb.debut_contrat&&ds<mb.debut_contrat)return false; if(mb.fin_contrat&&ds>mb.fin_contrat)return false; return true; }
    if(!P.length) return true;
    for(var i=0;i<P.length;i++){ if(P[i].debut&&ds<P[i].debut)continue; if(P[i].fin&&ds>P[i].fin)continue; return true; }
    return false;
  }
  // Effectif LISSE de la semaine. DEUX mesures, volontairement distinctes :
  //   head     = personnes REELLEMENT presentes. Une equipe collective y pese son
  //              effectif, sinon la vendange afficherait 2 presents face au pic de
  //              charge et Pilotage crierait au sous-effectif tous les septembres.
  //   headPerm = le socle PERMANENT, equipes collectives EXCLUES. C'est lui que lit
  //              le simulateur de renfort (pilotage.js le prefere deja quand il
  //              existe) : on ne raisonne pas un recrutement sur des vendangeurs.
  // L'effectif retenu est celui PAR DEFAUT de la fiche, pas la saisie du jour : la
  // courbe est hebdomadaire et lissee, la precision quotidienne n'y ajouterait rien
  // de lisible et couterait un aller-retour dans PLANNING_ENTRIES par semaine.
  function _headWeek(o0,o1,permOnly){
    var nd=o1-o0+1; if(nd<=0)return 0; var sum=0;
    mbrs.forEach(function(mb){
      var coll=!!(window._mvEstCollectif&&window._mvEstCollectif(mb));
      if(permOnly&&coll)return;
      var w=(coll&&typeof window._mvEffDef==='function')?window._mvEffDef(mb):1;
      var din=0; for(var o=o0;o<=o1;o++){ if(_inContractDay(mb,_ford(o)))din++; }
      sum+=(din/nd)*w;
    });
    return sum;
  }
  // ★★★ COMBIEN DE CORPS DANS LES RANGS, AU PLUS FORT DE LA SEMAINE.
  //   head est un effectif LISSE : chaque fiche y pese ses jours sous contrat
  //   divises par les jours de la semaine. C'est juste pour une COURBE, et faux
  //   pour une TOURNEE. Mesure du 12/08 : 40 vendangeurs engages du 26 aout au
  //   4 septembre tombent a 28,6 sur la semaine du 24 aout — parce que leur
  //   contrat ne commence pas un lundi. Personne ne travaille a 28,6 : ce jour-la
  //   il y a 40 personnes dans les rangs, ou il n'y en a aucune.
  //   headMax repond a « combien de personnes au plus fort de la semaine ». Il
  //   sert a dimensionner un ordre de passage et une repartition de taches ;
  //   head reste la courbe. Meme boucle, meme poids _mvEffDef, meme
  //   _inContractDay : une seule definition de « etre la ce jour-la ».
  function _headDayMax(o0,o1){
    var mx=0;
    for(var o=o0;o<=o1;o++){
      var ds=_ford(o), s=0;
      mbrs.forEach(function(mb){
        if(!_inContractDay(mb,ds)) return;
        s+=(window._mvEstCollectif&&window._mvEstCollectif(mb)&&typeof window._mvEffDef==='function')
             ? window._mvEffDef(mb) : 1;
      });
      if(s>mx) mx=s;
    }
    return mx;
  }
  // ══ CAPACITE HEBDOMADAIRE REELLE ══════════════════════════════════════════
  // _capDaysOrd ne connait qu'UN modele, « standard », applique a tout le monde.
  // Ici on descend au salarie et au jour :
  //   - le modele de CHACUN (m.planning_id), pas le standard pour tous ;
  //   - l'entree du planning quand elle existe (CP, fermeture, absence, timing,
  //     remplacement) : elle PRIME sur le modele, exactement comme a l'ecran.
  // DEUX totaux, volontairement distincts :
  //   work = heures TRAVAILLABLES (_planWorkH : un CP vaut 0)  -> la capacite
  //   pay  = heures PAYEES        (_planDayH  : un CP vaut ses heures) -> le socle
  // Confondre les deux, c'est promettre du travail a quelqu'un qui est en conge,
  // ou effacer un salaire qui sera verse quand meme.
  // ANNEE EXPLICITE partout : _pEntDay et _planGetTpl passent par _pY(), l'annee
  // du contexte d'affichage. Une campagne 30 sept -> 30 mars traverse deux annees
  // civiles ; c'est exactement le piege qui fait renvoyer null a _planSeasonHours.
  function _entDayY(nom,yr,m,d){
    var b=PLANNING_ENTRIES[nom]; var y=b&&b[yr]; var mo=y&&y[m];
    return (mo&&mo[d])||null;
  }
  // ══ LA CAPACITE REELLE SE LIT AU JOUR, JAMAIS AU PRORATA DE LA SEMAINE ══
  // \u26a0\u26a0 DEFAUT MESURE LE 12/08/2026, CAPTURE DE NICO A L'APPUI.
  //   La projection de fin (_pilCapaProj) et le simulateur (_rfCtx) decoupaient une
  //   semaine ENTAMEE en multipliant capH par (jours retenus / jours de la semaine).
  //   Or les heures d'une semaine ne sont PAS reparties a plat sur ses sept jours :
  //   le week-end vaut 0, aout est ferme jusqu'au 24, et surtout une equipe de
  //   vendange sous contrat du 26 aout au 4 septembre concentre TOUTES ses heures
  //   sur les jours qu'on garde. Retirer 2/7 de la semaine du 24 au 30 aout, c'est
  //   retirer 2/7 des heures de 40 vendangeurs qui n'etaient pas la les 24 et 25.
  //   MESURE. Meme equipe, meme charge (2 352 h), meme depart (26 aout). La SEULE
  //   chose qui change est la date d'ouverture de la periode, donc l'endroit ou
  //   tombe la grille des semaines. Fin projetee : 7 sept. (periode ouverte le 26),
  //   10 sept. (le 25), 23 sept. (le 24), 1er oct. (le 20) et meme « capacite
  //   insuffisante » (le 21). Lue jour par jour, la reponse vaut 4 SEPTEMBRE dans
  //   les cinq cas — le dernier jour du contrat de groupe.
  //   Une date de fin qui depend de l'alignement du calendrier n'est pas une
  //   projection, c'est un artefact. Et l'erreur ne se voit pas : apres la vendange
  //   il ne reste qu'une personne, donc chaque heure perdue coute un jour entier.
  // \u2605 UNE SEULE DEFINITION. _capDayReal(o) rend les quatre mesures d'UN jour,
  //   capRCum en fait un cumul (meme convention que capCum : plage [a,b) exclusive
  //   a droite), _capReelIn lit une plage, _capWeekReal n'est plus qu'un appel.
  //   Personne ne recalcule, donc personne ne peut donner un second chiffre.
  function _capDayReal(o){
    var out={work:0,pay:0,workPerm:0,payPerm:0};
    var ds=_ford(o);
    var yr=parseInt(ds.slice(0,4),10), mi=parseInt(ds.slice(5,7),10)-1, dj=parseInt(ds.slice(8,10),10);
    mbrs.forEach(function(mb){
      if(!_inContractDay(mb,ds))return;
      var coll=!!(window._mvEstCollectif&&window._mvEstCollectif(mb));
      // Meme convention que _headWeek : l'effectif PAR DEFAUT de la fiche, pas la
      // saisie du jour. Une lecture hebdomadaire lissee n'y gagnerait rien.
      var w=(coll&&typeof window._mvEffDef==='function')?window._mvEffDef(mb):1;
      var plId=_planPlId(mb), e=_entDayY(mb.nom,yr,mi,dj);
      var hw=_planWorkH(plId,mi,dj,e,yr)*w, hp=_planDayH(plId,mi,dj,e,yr)*w;
      out.work+=hw; out.pay+=hp;
      if(!coll){ out.workPerm+=hw; out.payPerm+=hp; }
    });
    return out;
  }
  function _capReelIn(a,b){
    if(!capRCum) return null;
    var i=Math.round(a)-spanS, j=Math.round(b)-spanS, L=capRCum.length-1;
    if(i<0)i=0; if(i>L)i=L; if(j<0)j=0; if(j>L)j=L;
    if(j<=i) return {work:0,pay:0,workPerm:0,payPerm:0};
    var A=capRCum[i], B=capRCum[j];
    return {work:B.w-A.w,pay:B.p-A.p,workPerm:B.wp-A.wp,payPerm:B.pp-A.pp};
  }
  function _capWeekReal(o0,o1){
    if(typeof _planWorkH!=='function'||typeof _planDayH!=='function') return null;
    return _capReelIn(o0,o1+1);
  }
  // \u2605\u2605\u2605 LA CAPACITE CUMULEE, JOUR PAR JOUR, SORT D'ICI.
  //   Le simulateur de renfort recalculait les heures de chaque semaine avec SA
  //   propre regle : un etalement a plat sur les jours du CALENDRIER. Ici,
  //   _taskHoursIn etale au prorata des jours TRAVAILLABLES. Deux regles pour la
  //   meme courbe : la semaine du 1er mai recevait sa charge pleine alors qu'elle
  //   n'a que trois jours pour la faire — le graphe la montrait calme, les rangs
  //   disaient l'inverse. Et le test qui decide d'afficher un graphe ou deux
  //   comparait ces deux regles entre elles.
  //   capCum[k] = capacite 1 ETP cumulee de spanS jusqu'a spanS+k EXCLU. Le
  //   simulateur lit ce tableau ; il n'y a plus qu'UNE definition de l'etalement.
  var capCum=[0];
  for(var _cc=spanS;_cc<=spanE;_cc++) capCum.push(capCum[capCum.length-1]+_cap1(_cc));
  // \u2605 LE MEME CUMUL, SUR LES HEURES REELLES DE L'EQUIPE (quatre mesures).
  //   capCum repond « combien de temps offre UNE personne ce jour-la » (le
  //   template). capRCum repond « combien d'heures l'equipe SIGNEE offre ce
  //   jour-la » : modele de chacun, entrees du planning, contrats, effectif
  //   collectif. C'est cette seconde mesure que lisent la projection de fin et le
  //   simulateur ; elle n'existait qu'agregee a la semaine, ce qui interdisait
  //   toute lecture d'une semaine entamee autrement qu'au prorata du calendrier.
  var capRCum=[{w:0,p:0,wp:0,pp:0}];
  for(var _cr=spanS;_cr<=spanE;_cr++){
    var _dd=_capDayReal(_cr), _lv=capRCum[capRCum.length-1];
    capRCum.push({w:_lv.w+_dd.work,p:_lv.p+_dd.pay,wp:_lv.wp+_dd.workPerm,pp:_lv.pp+_dd.payPerm});
  }
  var weeks=[];
  for(var wo=spanS; wo<=spanE; wo+=7){
    var wo0=wo, wo1=Math.min(spanE,wo+6), wh=0;
    taskWindows.forEach(function(t){ wh+=_taskHoursIn(t, wo0, wo1+1); });
    var wcap=_capDaysOrd(wo0,wo1);
    var wm=new Date(Date.parse('2026-01-01T00:00:00')+(wo0+3)*86400000).getMonth();
    var wreal=_capWeekReal(wo0,wo1);
    weeks.push({o0:wo0,o1:wo1,nd:(wo1-wo0+1),m:wm,hours:wh,cap:wcap,need:wcap>0?wh/wcap:0,head:_headWeek(wo0,wo1),headPerm:_headWeek(wo0,wo1,true),headMax:_headDayMax(wo0,wo1),
                capH:wreal?wreal.work:null, capPay:wreal?wreal.pay:null,
                capHPerm:wreal?wreal.workPerm:null, capPayPerm:wreal?wreal.payPerm:null});
  }
  // ★★ PAS DE MOIGNON DE SEMAINE EN FIN DE PERIODE.
  //   Le decoupage part de spanS par pas de 7 : la DERNIERE case vaut 1 a 6 jours
  //   des que la periode ne fait pas un nombre entier de semaines. Cette case est
  //   une SEMAINE pour tout le module — elle porte un `need`, elle peut porter le
  //   pic de l'annee, elle se dessine sur la frise... large d'un pixel. Un chiffre
  //   qu'on ne peut pas voir ne se verifie pas. On la fond dans la precedente :
  //   une periode se termine par une case de 8 a 13 jours, jamais par un moignon.
  //   need reste une INTENSITE (heures / capacite) : la fusion ne la deforme pas.
  if(weeks.length>1 && weeks[weeks.length-1].nd<7){
    var _q=weeks.pop(), _p=weeks[weeks.length-1];
    _p.o1=_q.o1; _p.nd=_p.o1-_p.o0+1;
    _p.hours+=_q.hours; _p.cap+=_q.cap;
    _p.need=_p.cap>0?_p.hours/_p.cap:0;
    _p.head=_headWeek(_p.o0,_p.o1); _p.headPerm=_headWeek(_p.o0,_p.o1,true);
    _p.headMax=_headDayMax(_p.o0,_p.o1);
    var _wr=_capWeekReal(_p.o0,_p.o1);
    _p.capH=_wr?_wr.work:null; _p.capPay=_wr?_wr.pay:null;
    _p.capHPerm=_wr?_wr.workPerm:null; _p.capPayPerm=_wr?_wr.payPerm:null;
  }
  // ══ LE PIC SE LIT A LA SEMAINE, PLUS AU MOIS ══════════════════════════════
  // x.etpReq = x.chargeOrd / x.capRef divisait les heures TOMBANT dans le mois par
  // la capacite du mois ENTIER. Mesure du 11/08 : une vendange de 4 jours dans
  // septembre sortait a 6,1 ETP quand la MEME intensite en aout — tronque par le
  // debut de saison, donc a denominateur court — sortait a 27. Deux denominateurs
  // sous un seul mot. La semaine compare w.need = wh/wcap SUR LA MEME semaine :
  // c'est la seule maille ou le rapport a un sens, et elle ne depend pas de la
  // longueur de la periode (une campagne de cinq semaines et une de cinq mois s'y
  // lisent pareil).
  // L'effectif du pic suit la meme regle. L'ancienne moyenne mensuelle de head
  // noyait une semaine a 42 dans trois semaines a 2 et annoncait « 12 presents » —
  // un chiffre qui n'existe AUCUN jour de l'annee. On retient l'effectif de la
  // semaine du pic, le seul comparable au besoin de cette semaine-la.
  // ⚠️ w.cap<=0 : semaine hors template (feries, fermeture) — need n'y veut rien dire.
  var peakReq=0, peakWeek=null, peakMonth=null, peakPres=0, anyShort=false;
  weeks.forEach(function(w){
    if(!(w.cap>0)) return;
    if(w.need>peakReq){ peakReq=w.need; peakWeek=w; peakMonth=w.m; peakPres=w.head||0; }
    if(w.need>(w.head||0)+0.05) anyShort=true;
  });
  return {saison:s.nom,debut:s.debut,fin:s.fin,spanS:spanS,spanE:spanE,capCum:capCum,capRCum:capRCum,charge:charge,tasks:taskDet,months:months,capRefTotal:capRefTotal,etpCible:etpCible,capEquipe:capEquipe,etpDispo:etpDispo,nMbr:mbrs.length,taskWindows:taskWindows,weeks:weeks,capPresentTotal:capPresentTotal,etpPresent:etpPresent,peakReq:peakReq,peakMonth:peakMonth,peakWeek:peakWeek,peakPres:peakPres,anyShort:anyShort};
}
window._chargeSaisonData=_chargeSaisonData;
// \u2605\u2605 LA MEME LECTURE, DEPUIS LES AUTRES MODULES.
//   [a,b) en ordinaux (base 2026-01-01), exactement la convention de capCum et de
//   _rfCapIn (pilotage.js). Rend les quatre mesures d'une plage de jours.
//   null = la donnee n'est pas la (cd d'un planning.js anterieur a ce lot) : a
//   l'appelant de retomber sur son ancien calcul, et de le dire.
window._mvCapReelIn=function(cd,a,b){
  if(!cd||!cd.capRCum||cd.spanS==null) return null;
  var C=cd.capRCum, i=Math.round(a)-cd.spanS, j=Math.round(b)-cd.spanS, L=C.length-1;
  if(i<0)i=0; if(i>L)i=L; if(j<0)j=0; if(j>L)j=L;
  if(j<=i) return {work:0,pay:0,workPerm:0,payPerm:0};
  return {work:C[j].w-C[i].w,pay:C[j].p-C[i].p,workPerm:C[j].wp-C[i].wp,payPerm:C[j].pp-C[i].pp};
};

// ── Heures TRAVAILLÉES / PRÉVUES sur une SAISON, agrégées depuis le Planning (pour le Rapport de saison). ──
// Ne renvoie une valeur QUE si la saison tient ENTIÈREMENT dans UNE MÊME année civile (multi-années) :
// _planCtxYear est calé sur l'année de la saison, entrées/templates lus via les accesseurs année-aware.
// Une saison cross-year (Hiver déc.→mars, 2 années) renvoie null → le rapport garde la saisie manuelle.
// Fenêtre de dates EXACTE : les jours hors [debut,fin] sont exclus, y compris aux mois de bord (pas de double
// comptage entre saisons). Reproduit la logique de _planSummary (ref = template hors récup ; worked = _planDayH),
// mais bornée au jour. Le rapport fait PRIMER la saisie manuelle sur ce calcul auto.
function _planSeasonHours(s){
  if(!s||!s.debut||!s.fin)return null;
  _planMigrateYears();
  var _sy=parseInt(String(s.debut).slice(0,4),10);
  if(isNaN(_sy)||String(s.fin).slice(0,4)!==String(_sy))return null;
  // Meme regle historique que _chargeSaisonData : les heures deja faites par un
  // saisonnier ne s'effacent pas le jour ou sa fiche passe en Inactif.
  var mbrs=(window.MEMBRES||[]).filter(function(m){
    return (typeof window._mvEnContratSurPeriode==='function')
      ? window._mvEnContratSurPeriode(m,s.debut,s.fin)
      : (m && m.statut!=='Inactif' && !m.bureau);
  });
  if(!mbrs.length)return null;
  var m0=parseInt(String(s.debut).slice(5,7),10)-1, m1=parseInt(String(s.fin).slice(5,7),10)-1;
  if(isNaN(m0)||isNaN(m1)||m1<m0)return null;
  function pad(n){return ('0'+n).slice(-2);}
  var totRef=0,totWk=0,ouv={},any=false;
  _planCtxYear=_sy;
  mbrs.forEach(function(mb){
    var plId=_planPlId(mb),mref=0,mwk=0;
    for(var m=m0;m<=m1;m++){
      var days=_planDays(m);
      var ent=_pEntMonth(mb.nom,m);
      for(var d=1;d<=days;d++){
        var ds=_sy+'-'+pad(m+1)+'-'+pad(d);
        if(ds<s.debut||ds>s.fin)continue;
        if(!_planInContract(mb,m,d))continue;
        var ee=ent[d];
        var refD=(ee&&ee.type==='recup')?0:(parseFloat(_planPlanned(plId,m,d))||0);
        var wkD=parseFloat(_planDayH(plId,m,d,ee))||0;
        mref+=refD;mwk+=wkD;
      }
    }
    if(mref>0||mwk>0){ouv[mb.nom]={h_dues:Math.round(mref*10)/10,h_faites:Math.round(mwk*10)/10};any=true;}
    totRef+=mref;totWk+=mwk;
  });
  _planCtxYear=null;
  if(!any)return null;
  return {h_dues:Math.round(totRef*10)/10,h_faites:Math.round(totWk*10)/10,ouvriers:ouv,source:'planning'};
}
window._planSeasonHours=_planSeasonHours;
// ── Cadence équipe sur une fenêtre [from,to] (Date), hors salariés « bureau » ──
// Pilotage : jours ouvrés réels + Σ heures planning de l'équipe → cadence (h/jour ouvré).
// NB : le calcul suit l'année RÉELLE de chaque jour de la fenêtre (accesseurs année-aware).
// ENTREE DE MESURE 4/4 — cadence reelle de l'equipe sur une fenetre.
function _planTeamCadence(from, to){
  return _planWide(function(){ return _planTeamCadence_(from, to); });
}
function _planTeamCadence_(from, to){
  _planMigrateYears();
  var mbrs = _planMbrs().filter(function(m){ return !m.bureau; });
  var totalH = 0, jours = {}, guard = 0;
  var cur = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  var end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  while(cur <= end && guard < 400){
    guard++;
    var m = cur.getMonth(), d = cur.getDate(), dayTeam = 0;
    _planCtxYear = cur.getFullYear();
    for(var i=0;i<mbrs.length;i++){
      var mbr = mbrs[i];
      if(!_planInContractRead(mbr, m, d)) continue;
      var ent = _pEntDay(mbr.nom,m,d);
      dayTeam += _planDayH(_planPlId(mbr), m, d, ent);
    }
    if(dayTeam > 0){ totalH += dayTeam; jours[m + '-' + d] = 1; }
    cur.setDate(cur.getDate() + 1);
  }
  _planCtxYear = null;
  var jo = Object.keys(jours).length;
  return { totalH: totalH, joursOuvres: jo, cadence: jo > 0 ? totalH / jo : 0 };
}
// ── CP : jours pris (comptage entrées type=cp toutes années, calendrier réel par année) ──
// ── Periode de reference des CONGES PAYES ──
// Distincte de l'annee civile qui sert au compteur d'heures : chez la plupart
// des domaines les CP courent du 1er juin au 31 mai. Reglable par domaine
// (CONFIG.cp_periode_debut = mois de debut, 0-11 ; 5 = juin par defaut).
function _planCpMoisDebut(){
  var v=parseInt((window.CONFIG&&window.CONFIG.cp_periode_debut),10);
  return (isNaN(v)||v<0||v>11)?5:v;
}
// Periode contenant le mois consulte (planMonth) de l'annee consultee (planYear).
function _planCpPeriode(){
  var md=_planCpMoisDebut(),y=_pY();
  var m=(typeof planMonth==='number'?planMonth:0);
  var y1=(m>=md)?y:y-1;
  return {debut:new Date(y1,md,1), fin:new Date(y1+1,md,0), y1:y1, y2:y1+1, md:md};
}
function _planCpPeriodeLbl(){
  var p=_planCpPeriode();
  if(p.md===0)return String(p.y1);
  return PLAN_MOIS_C[p.md]+' '+p.y1+' \u2192 '+PLAN_MOIS_C[(p.md+11)%12]+' '+p.y2;
}
window._planCpPeriode=_planCpPeriode;

function _planCpPris(nom){
  // Décompte des congés selon le mode du domaine (window.CONFIG.cp_mode) :
  //  - 'ouvrables' (défaut) : lun→sam CP hors dimanches + fériés chômés, + samedi auto. Réf. 30 j/an.
  //  - 'ouvres' : lun→ven uniquement, hors samedis + dimanches + fériés. Réf. 25 j/an.
  // MULTI-ANNÉES : PLANNING_ENTRIES[nom] = {année:{mois:{jour:e}}} → boucle année→mois→jour,
  // le jour de semaine ET les fériés étant ceux de l'ANNÉE RÉELLE de chaque entrée.
  var mode=((window.CONFIG&&window.CONFIG.cp_mode)==='ouvres')?'ouvres':'ouvrables';
  _planMigrateYears();
  var _cpP=_planCpPeriode();
  var mbrEnt=PLANNING_ENTRIES[nom];
  if(!mbrEnt)return 0;
  var mbr=(window.MEMBRES||[]).find(function(x){return x.nom===nom;});
  var plId=mbr?_planPlId(mbr):'standard';
  function _plannedY(yr,m,d){ var t=_planGetTpl(plId,yr); return (t[m]&&t[m][d])||0; }
  var n=0;
  // Décompte principal
  Object.keys(mbrEnt).forEach(function(yk){
    var yearEnt=mbrEnt[yk]; if(!yearEnt||typeof yearEnt!=='object')return;
    var yr=parseInt(yk,10); if(isNaN(yr)||yr<2000)return;
    var F=_feriesY(yr);
    Object.keys(yearEnt).forEach(function(mk){
      var monthEnt=yearEnt[mk]; if(!monthEnt||typeof monthEnt!=='object')return;
      var m=parseInt(mk,10); if(isNaN(m))return;
      Object.keys(monthEnt).forEach(function(dk){
        var e=monthEnt[dk]; if(!e||e.type!=='cp')return;
        var d=parseInt(dk,10); if(isNaN(d))return;
        var _dt=new Date(yr,m,d);
        if(_dt<_cpP.debut||_dt>_cpP.fin)return;  // hors periode de reference
        var dow=_dt.getDay();
        if(dow===0)return;                       // dimanche : jamais décompté
        if(F[m]&&F[m][d])return;                 // férié chômé : jamais décompté
        if(mode==='ouvres'&&dow===6)return;      // ouvrés : samedi ne compte pas
        n++;
      });
    });
  });
  // Samedi automatique (mode ouvrables) : un vendredi CP entraîne le samedi de repos suivant
  if(mode!=='ouvres'){
    Object.keys(mbrEnt).forEach(function(yk){
      var yearEnt=mbrEnt[yk]; if(!yearEnt||typeof yearEnt!=='object')return;
      var yr=parseInt(yk,10); if(isNaN(yr)||yr<2000)return;
      Object.keys(yearEnt).forEach(function(mk){
        var monthEnt=yearEnt[mk]; if(!monthEnt||typeof monthEnt!=='object')return;
        var m=parseInt(mk,10); if(isNaN(m))return;
        Object.keys(monthEnt).forEach(function(dk){
          var e=monthEnt[dk]; if(!e||e.type!=='cp')return;
          var d=parseInt(dk,10); if(isNaN(d))return;
          var _dv=new Date(yr,m,d);
          if(_dv<_cpP.debut||_dv>_cpP.fin)return;            // hors periode de reference
          if(_dv.getDay()!==5)return;                        // vendredis CP uniquement
          var sat=new Date(yr,m,d+1); if(sat.getDay()!==6)return;
          var sy=sat.getFullYear(), sm=sat.getMonth(), sd=sat.getDate();
          var Fs=_feriesY(sy); if(Fs[sm]&&Fs[sm][sd])return;  // samedi férié : pas décompté
          var satY=mbrEnt[sy]||null;                          // bucket année du samedi (peut différer)
          var satMo=(satY&&satY[sm])||null;
          var se=(satMo&&satMo[sd])||null;
          if(se&&se.type==='cp')return;                       // déjà compté au décompte principal
          if(_plannedY(sy,sm,sd)>0)return;                    // samedi travaillé : pas décompté
          n++;                                                 // samedi de repos encadré
        });
      });
    });
  }
  return n;
}
function _planCpSolde(mbr){return(mbr.cp_initial_j||0)-_planCpPris(mbr.nom);}
// Periode de reference des conges payes (mois de debut, 0-11).
// Independante de l'annee civile qui sert au compteur d'heures.
function planSetCpPeriode(v){
  if(!isAdmin())return;
  var md=parseInt(v,10); if(isNaN(md)||md<0||md>11)md=5;
  window.CONFIG=window.CONFIG||{};
  window.CONFIG.cp_periode_debut=md;
  if(window.saveData)window.saveData('config');
  else if(window.fbSave)window.fbSave('config',window.CONFIG);
  showToast('\u2705 P\u00e9riode des cong\u00e9s\u00a0: '+_planCpPeriodeLbl(),PLAN_BG);
  if(typeof _planFicheRender==='function')_planFicheRender();
}

function planSetCpMode(v){
  if(!isAdmin())return;
  var mode=(v==='ouvres')?'ouvres':'ouvrables';
  window.CONFIG=window.CONFIG||{};
  window.CONFIG.cp_mode=mode;
  if(window.saveData)window.saveData('config');
  if(window.showToast)showToast('Décompte CP : '+(mode==='ouvres'?'jours ouvrés (5/sem)':'jours ouvrables (6/sem)'),'#3D6B27');
  if(typeof _pl2Refresh==='function')_pl2Refresh();else if(typeof _planFicheRender==='function')_planFicheRender();
}
function _planRecupH(mbr,m){
  var plId=_planPlId(mbr);
  var ent=_pEntMonth(mbr.nom,m);
  var h=0;
  for(var d=1;d<=_planDays(m);d++){
    var e=ent[d];
    if(e&&e.type==='recup'&&_planInContract(mbr,m,d))h+=_planPlanned(plId,m,d);
  }
  return h;
}
function _planHsupKey(m){return planYear+'-'+String(m+1).padStart(2,'0');}
function _planHsupPaye(nom,m){return((PLANNING_HSUP[nom]||{})[_planHsupKey(m)]||{}).paye||0;}
function _planHsupPayeBank(nom,m){return((PLANNING_HSUP[nom]||{})[_planHsupKey(m)]||{}).paye_bank||0;}
function _planHsupSupOv(nom,m){var r=(PLANNING_HSUP[nom]||{})[_planHsupKey(m)];return(r&&typeof r.sup_override==='number')?r.sup_override:null;}
function _planSupMonth(mbr,m){var o=_planHsupSupOv(mbr.nom,m);return(o!=null)?Math.max(0,o):Math.max(0,_planSummary(mbr,m).ecart);}
function _planBankAvailAt(mbr,m){var nom=mbr.nom,key=_planHsupKey(m);var had=!!(PLANNING_HSUP[nom]&&PLANNING_HSUP[nom][key]&&typeof PLANNING_HSUP[nom][key].paye_bank==='number');var prev=had?PLANNING_HSUP[nom][key].paye_bank:0;if(had)PLANNING_HSUP[nom][key].paye_bank=0;var b=_planBank(mbr,m);if(had)PLANNING_HSUP[nom][key].paye_bank=prev;return b.solde+b.forced;}
function _planBank(mbr,uptoMonth){
  var tr=[],overdraw=0,forced=0,forcedSrc=[];
  // Le SOLDE DE DEPART (report d'heures acquis avant Ma Vigne) est la tranche la PLUS
  // ANCIENNE du compteur : il s'y ajoute et se consomme EN PREMIER (recup, puis paiement
  // sur compteur). Sans lui, _planBankAvailAt renvoyait 0 pour un salarie sans heures sup
  // dans l'annee -> planSaveHsupBankAt ecrasait la saisie a 0 et le report etait
  // impayable/irrecuperable, alors que la fiche affichait bien le solde net.
  // Effet voulu : bank.solde == _planYearBalance().net (les 2 mesures coincident enfin).
  // NB : un report NEGATIF (heures dues) reste hors banque — une tranche FIFO ne peut pas
  // etre negative ; il continue d'apparaitre dans le solde net annuel.
  var _dep0=_planDepartSolde(mbr);
  if(_dep0>0.0001)tr.push({mois:-1,dep:true,h:_dep0});
  for(var i=0;i<=uptoMonth;i++){
    var sup=_planSupMonth(mbr,i);
    var paye=Math.min(Math.max(0,_planHsupPaye(mbr.nom,i)),sup);
    var reporte=sup-paye;
    if(reporte>0.0001)tr.push({mois:i,h:reporte});
    var draw=_planRecupH(mbr,i)+_planDuesMonth(mbr,i);   // ★ une heure due se retire comme une recup
    for(var k=0;k<tr.length&&draw>0.0001;k++){var take=Math.min(tr[k].h,draw);tr[k].h-=take;draw-=take;}
    if(i===uptoMonth)overdraw=draw;
    tr=tr.filter(function(t){return t.h>0.0001;});
    var pay=Math.max(0,_planHsupPayeBank(mbr.nom,i));
    for(var kp=0;kp<tr.length&&pay>0.0001;kp++){var tp=Math.min(tr[kp].h,pay);tr[kp].h-=tp;pay-=tp;}
    tr=tr.filter(function(t){return t.h>0.0001;});
    // ANNUALISATION : plus d'expiration a 3 mois. En decompte annualise les heures
    // ne periment pas en cours d'annee — le solde se regle a la cloture (31 decembre).
    // forced/forcedSrc sont conserves a 0 pour ne pas casser les appelants.
  }
  var solde=tr.reduce(function(a,t){return a+t.h;},0);
  return{tr:tr,solde:solde,forced:forced,forcedSrc:forcedSrc,overdraw:overdraw};
}
// ── Solde de départ (report d'heures avant Ma Vigne) — par salarié / année ──
function _planDepartKey(){ return planYear+'-dep'; }
function _planDepartRec(nom){ return (PLANNING_HSUP[nom]||{})[_planDepartKey()]||{}; }
function _planDepartSolde(mbr){ var v=parseFloat(_planDepartRec(mbr.nom).solde); return isNaN(v)?0:v; }
function _planDepartDate(mbr){ return _planDepartRec(mbr.nom).date||''; }
// ── Solde annuel des heures : cumul simple (départ + Σ reportées − Σ récup) ──
// Depuis le passage a l'annualisation, _planBank ne fait plus perimer les heures :
// les deux mesures coincident, _planBank conservant le detail par mois d'acquisition.
function _planYearBalance(mbr,uptoMonth){
  var dep=_planDepartSolde(mbr),plus=0,minus=0,minusPay=0,dues=0;
  for(var i=0;i<=uptoMonth;i++){
    var sup=_planSupMonth(mbr,i);
    var paye=Math.min(Math.max(0,_planHsupPaye(mbr.nom,i)),sup);
    plus+=sup-paye;
    minus+=_planRecupH(mbr,i);
    minusPay+=Math.max(0,_planHsupPayeBank(mbr.nom,i));
    dues+=_planDuesMonth(mbr,i);   // ★ absences injustifiees et retards
  }
  return {dep:dep,plus:plus,minus:minus,minusPay:minusPay,dues:dues,
          net:dep+plus-minus-minusPay-dues,upto:uptoMonth};
}
// ════════════════════════════════════════════════════════════════════
// ANNUALISATION — compteur annuel (annee civile) + heures de modulation
// Periode de reference du COMPTEUR D'HEURES = annee civile (planYear).
// Distincte de la periode des CONGES PAYES (juin -> mai, cf. _planCpPeriode).
// ════════════════════════════════════════════════════════════════════

// Heures des jours d'absence SUSPENSIVE (arret de travail, conge sans solde).
// Une suspension de contrat abaisse le plafond individuel : ces heures ne sont
// ni a rattraper, ni comptees en deficit.
function _planSuspH(mbr){
  var plId=_planPlId(mbr),tot=0;
  for(var m=0;m<12;m++){
    var ent=_pEntMonth(mbr.nom,m);
    for(var d=1;d<=_planDays(m);d++){
      var e=ent[d];
      if(!e||!e.absent)continue;
      if(!_planInContract(mbr,m,d))continue;
      if(!_planAbsMotif(e).suspend)continue;
      tot+=_planDayH(plId,m,d,null);
    }
  }
  return tot;
}
// Plafond annuel INDIVIDUEL : 1607 h proratisees aux jours sous contrat,
// moins les suspensions. Un saisonnier de 4 mois n'a pas un plafond de 1607 h.
function _planAnnuPlafond(mbr){
  var L=_planLegal(),plId=_planPlId(mbr),all=0,ctr=0;
  for(var m=0;m<12;m++){
    for(var d=1;d<=_planDays(m);d++){
      var pl=_planPlanned(plId,m,d);
      if(pl<=0)continue;
      all+=pl;
      if(_planInContractCtr(mbr,m,d))ctr+=pl;
    }
  }
  var plaf=(all>0)?(L.plafAnnuel*ctr/all):L.plafAnnuel;
  return Math.max(0,plaf-_planSuspH(mbr));
}
// Heures de MODULATION : cumul des depassements de 35 h, semaine par semaine.
// Une semaine creuse ne rattrape pas une semaine chargee -> jamais un simple
// total annuel moins 1607. Les semaines a cheval sur l'annee sont tronquees
// aux bornes du 1er janvier / 31 decembre.
function _planModulH(mbr,uptoMonth){
  var L=_planLegal(),yr=_pY();
  var jan=new Date(yr,0,1);
  var lim=(uptoMonth==null?11:uptoMonth);
  var end=new Date(yr,lim+1,0);
  var dec=new Date(yr,11,31);
  if(end>dec)end=dec;
  var cur=new Date(yr,0,1);
  cur.setDate(cur.getDate()-((cur.getDay()+6)%7));
  var tot=0,guard=0;
  while(cur<=end&&guard<60){
    guard++;
    var a=new Date(cur); if(a<jan)a=new Date(jan);
    var b=new Date(cur); b.setDate(cur.getDate()+6); if(b>end)b=new Date(end);
    if(a<=b){
      var h=_planWorkRange(mbr,a,b);
      if(h>L.hebdoLeg)tot+=h-L.hebdoLeg;
    }
    cur.setDate(cur.getDate()+7);
  }
  return tot;
}
// Synthese d'annualisation d'un salarie au mois uptoMonth inclus.
// ⚠️ annualise=false -> plafond, modulation, reste et cadence n'ont AUCUN sens :
// la personne est payee a l'heure. Ils sont mis a zero et la carte bascule sur
// un simple comptage. Voir _mvAnnualise (utils.js), definition unique.
function _planAnnu(mbr,uptoMonth){
  var L=_planLegal(),um=(uptoMonth==null?11:uptoMonth);
  var annu=(typeof window._mvAnnualise==='function')?window._mvAnnualise(mbr):true;
  var plaf=annu?_planAnnuPlafond(mbr):0,cum=0,proj=0;
  for(var m=0;m<12;m++){
    if(m<=um){var w=_planWorkMonth(mbr,m);cum+=w;proj+=w;}
    else proj+=_planSummary(mbr,m).ref;
  }
  var moisRest=Math.max(0,11-um);
  return {
    annualise:annu,
    plafond:plaf, cumul:cum, reste:plaf-cum,
    projection:proj, ecartProj:proj-plaf,
    modul:annu?_planModulH(mbr,um):0, modulMax:L.modulMax,
    susp:_planSuspH(mbr), maxAnnuel:L.maxAnnuel,
    moisRest:moisRest, cadence:moisRest>0?Math.max(0,plaf-cum)/moisRest:0
  };
}
window._planAnnu=_planAnnu;

// ── Editeur de jour : liste des motifs d'absence, avec l'effet annonce ──
function _planAbsEffet(mo){
  if(mo.suspend)return {t:'Abaisse le plafond annuel \u00b7 heures non dues',c:'var(--rouge)'};
  if(mo.assim)  return {t:'Compte comme du travail effectif \u00b7 pay\u00e9',c:'var(--vert-med)'};
  if(mo.heures) return {t:'Heures dues \u00b7 non pay\u00e9es',c:'var(--texte-doux)'};
  if(mo.id==='autre')return {t:'Plafond inchang\u00e9 \u00b7 comportement historique',c:'var(--texte-doux)'};
  return {t:'Plafond inchang\u00e9 \u00b7 heures dues',c:'var(--texte-doux)'};
}
function _planAbsMotifsHtml(sel,sansHeures){
  var h='';
  PLAN_ABS_MOTIFS.filter(function(mo){return !(sansHeures&&mo.heures);}).forEach(function(mo){
    var on=(mo.id===sel),ef=_planAbsEffet(mo);
    h+='<button type="button" class="plan-abs-mo" data-mo="'+_escAttr(mo.id)+'" onclick="planSetAbsMotif(\''+_escAttr(mo.id)+'\')" '
      +'style="display:flex;gap:9px;align-items:flex-start;width:100%;padding:10px 11px;margin-bottom:6px;'
      +'border:1.5px solid '+(on?'var(--terre)':'var(--gris-clair)')+';border-radius:11px;'
      +'background:'+(on?'var(--terre-pale)':'var(--bg-card)')+';font-family:inherit;cursor:pointer;text-align:left">'
      +'<span class="plan-abs-r" style="width:15px;height:15px;border-radius:50%;flex-shrink:0;margin-top:2px;'
      +'border:2px solid '+(on?'var(--terre)':'var(--gris)')+';background:'+(on?'var(--terre)':'transparent')+';box-shadow:inset 0 0 0 2px var(--bg-card)"></span>'
      +'<span style="flex:1">'
        +'<span style="display:block;font-size:13px;font-weight:600;color:var(--texte)">'+_escHtml(mo.ico)+' '+_escHtml(mo.nom)+'</span>'
        +'<span style="display:block;font-size:11px;color:var(--texte-doux);margin-top:1px;line-height:1.3">'+_escHtml(mo.sub)+'</span>'
        +'<span style="display:block;font-size:11px;font-weight:600;margin-top:3px;line-height:1.3;color:'+ef.c+'">'+ef.t+'</span>'
      +'</span>'
    +'</button>';
  });
  return h;
}
function planSetAbsMotif(id){
  _planAbsSel=id;
  var def=_planAbsDef(id);
  var btns=document.querySelectorAll('.plan-abs-mo');
  for(var i=0;i<btns.length;i++){
    var b=btns[i],on=(b.getAttribute('data-mo')===id);
    b.style.borderColor=on?'var(--terre)':'var(--gris-clair)';
    b.style.background=on?'var(--terre-pale)':'var(--bg-card)';
    var r=b.querySelector('.plan-abs-r');
    if(r){r.style.borderColor=on?'var(--terre)':'var(--gris)';r.style.background=on?'var(--terre)':'transparent';}
  }
  var w=document.getElementById('plan-abs-h-wrap');
  if(w)w.style.display=def.heures?'block':'none';
}

function _planDayStatus(plId,m,d,e){
  var f=_planFerie(m,d);
  var dow=_planDow(m,d),wk=dow===0||dow===6;
  var pl=_planPlanned(plId,m,d);
  if(e&&e.type==='cp')return{t:'cp',l:'Cong\u00e9 pay\u00e9',c:'var(--orange)',bg:'var(--orange-pale)',bd:'rgba(217,119,6,0.35)'};
  if(e&&e.type==='recup')return{t:'recup',l:'R\u00e9cup',c:'var(--plan-acc)',bg:'var(--plan-acc-pale)',bd:'rgba(123,109,184,0.4)'};
  if(e&&e.absent){
    // ⚠️ Le TYPE reste 'absent' : _PLAN_ST_OFFDAY et les tables de couleurs du
    //   PDF s'en servent comme cle, et un jour de CFA n'est PAS un jour travaille
    //   au domaine (il doit rester hors du compte MSA / TESA). Seuls le LIBELLE,
    //   la COULEUR et le nouveau drapeau `assim` changent — aucun consommateur
    //   existant ne voit son comportement modifie par surprise.
    var _ms=_planAbsMotif(e);
    if(_ms.assim)return{t:'absent',assim:true,paye:true,l:_ms.nom,c:'var(--bleu)',bg:'var(--bleu-pale)',bd:'rgba(26,74,122,0.35)'};
    if(_ms.paye) return{t:'absent',assim:false,paye:true,l:_ms.nom,c:'var(--orange)',bg:'var(--orange-pale)',bd:'rgba(217,119,6,0.35)'};
    return{t:'absent',assim:false,paye:false,l:(_ms.id==='autre'?'Absent':_ms.nom),c:'var(--rouge)',bg:'var(--rouge-pale)',bd:'rgba(220,38,38,0.4)'};
  }
  if(e&&e.canicule)return{t:'canicule',l:'\u2600\ufe0f Chaleur',c:'var(--orange)',bg:'var(--orange-pale)',bd:'rgba(217,119,6,0.5)'};
  if(e&&e.timing){
    var th=_planTimingH(e.timing.debut,e.timing.fin,e.timing.continu);
    if(e.remplacement)return{t:'extra',l:'Remplacement',c:'var(--bleu)',bg:'var(--bleu-pale)',bd:'rgba(26,74,122,0.35)'};
    if(e.extra)return{t:'extra',l:'Extra',c:'var(--bleu)',bg:'var(--bleu-pale)',bd:'rgba(26,74,122,0.35)'};
    if(e.timing.continu)return{t:'continu',l:'Horaire continu',c:'var(--plan-acc)',bg:'var(--plan-acc-pale)',bd:'rgba(123,109,184,0.4)'};
    if(th>pl+0.1)return{t:'supp',l:'Heures supp.',c:'var(--vert-med)',bg:'var(--vert-pale)',bd:'rgba(61,107,39,0.4)'};
    if(th<pl-0.1)return{t:'reduit',l:'Horaire r\u00e9duit',c:'var(--orange)',bg:'var(--orange-pale)',bd:'rgba(217,119,6,0.5)'};
    return{t:'work',l:'Travaill\u00e9',c:'var(--texte)',bg:'var(--bg-card)',bd:'var(--gris-clair)'};
  }
  if(f)return{t:'ferie',l:f,c:'var(--orange)',bg:'var(--orange-pale)',bd:'rgba(217,119,6,0.35)'};
  if(wk)return{t:'wknd',l:dow===0?'Dimanche':'Samedi',c:'var(--texte-doux)',bg:'var(--bg-app)',bd:'var(--gris-clair)'};
  if(pl>0)return{t:'work',l:'Travaill\u00e9',c:'var(--texte)',bg:'var(--bg-card)',bd:'var(--gris-clair)'};
  return{t:'off',l:'Repos',c:'var(--gris)',bg:'var(--bg-app)',bd:'var(--gris-clair)'};
}

// ── Couleurs thème ──
var PLAN_BG='#1C1A2E',PLAN_ACC='var(--plan-acc)',PLAN_ACC2='var(--plan-acc)';

// ── Render principal ──
// ══════════════════════════════════════════════════════════════════════
// TROIS ONGLETS, UN VERBE CHACUN
// ══════════════════════════════════════════════════════════════════════
// Le module mélangeait trois métiers qui n'ont ni la même fréquence ni le même
// acteur : TENIR le mois (tous les jours, le chef d'équipe), SUIVRE une personne
// (à la paie), RÉGLER le cadre (une fois l'an). Ils vivaient dans deux onglets et
// neuf feuilles, dont un onglet caché derrière « Outils › Modèles ».
//   mois  → la grille, et rien d'autre
//   gens  → une ligne par salarié, sa fiche, le récap annuel, les anciens
//   cadre → modèles de semaine, coupure, convention, congés, heures sup
// ★ Même patron que Pilotage › Cave (§20g) : la table de migration existe pour que
//   l'onglet mémorisé d'un client ne le renvoie pas dans le vide.
var _PLAN_TAB_MIGR={planning:'mois',equipe:'mois',tableau:'mois',saisie:'mois',templates:'cadre'};
var _PLAN_VALID_TAB={mois:1,gens:1,cadre:1,moi:1};

function renderPlanning(){
  if(!window._dataReady){ var _pb=document.getElementById('plan-body'); if(_pb)_pb.innerHTML=window._mvSk('planning'); return; }
  var pg=document.getElementById('page-planning');
  if(!pg)return;
  _planMigrateYears();
  // Les trois onglets d'administration ; l'ouvrier n'en voit aucun et tombe
  // directement sur son mois — un onglet unique n'est pas un choix, c'est un décor.
  var adm=isAdmin();
  document.querySelectorAll('.plan-tab-admin').forEach(function(t){t.style.display=adm?'':'none';});
  var tabsWrap=document.getElementById('plan-tabs');
  if(tabsWrap)tabsWrap.style.display=adm?'':'none';
  if(_PLAN_TAB_MIGR[planTab])planTab=_PLAN_TAB_MIGR[planTab];
  if(!adm)planTab='moi';
  else if(!_PLAN_VALID_TAB[planTab]||planTab==='moi')planTab='mois';
  _planRenderHeader();
  _planRenderBody();
}

function _planRenderHeader(){
  var sb=document.getElementById('plan-stats-band');
  if(!sb)return;
  var mbrs=_planMbrs();
  // La bande de chiffres suit l'onglet. « Le cadre » n'en porte aucun : ce sont des
  // réglages, pas une mesure — y afficher une charge du mois serait un décor.
  if(planTab==='cadre'){sb.innerHTML='';}
  else if(planTab==='gens'&&isAdmin()){
    var _act=mbrs.filter(function(m){return _planHasContractThisMonth(m,planMonth);});
    var _hT=_act.reduce(function(s,m){return s+_planCalcMonth(m,planMonth);},0);
    var _hR=_act.reduce(function(s,m){return s+((_planSummary(m,planMonth)||{}).ref||0);},0);
    var _ec=_hT-_hR;
    sb.innerHTML='<div class="mvu-kpi"><div class="mvu-kpi-v">'+_act.length+'</div><div class="mvu-kpi-l">Suivis ce mois</div></div>'
      +'<div class="mvu-kpi"><div class="mvu-kpi-v">'+_planFmt(_hT)+'</div><div class="mvu-kpi-l">Heures travaill\u00e9es</div></div>'
      +'<div class="mvu-kpi"><div class="mvu-kpi-v" style="color:'+(_ec>=0?'var(--vert-med)':'var(--orange)')+'">'+_planFmtE(_ec)+'</div><div class="mvu-kpi-l">\u00c9cart au pr\u00e9vu</div></div>';
  }
  else if(isAdmin()){
    // Charge du mois = part des saisons datees couvrant ce mois ; capacite = equipe reelle (hors bureau, contrats actifs)
    var _cm=0,_dated=false;
    (window.SAISONS||[]).forEach(function(_s){
      if(!_s.debut||!_s.fin)return;
      var _cd=window._chargeSaisonData&&window._chargeSaisonData(_s); if(!_cd)return;
      _dated=true;
      _cd.months.forEach(function(_x){ if(_x.m===planMonth)_cm+=_x.charge; });
    });
    var _cap=mbrs.filter(function(m){return !m.bureau;}).reduce(function(s,m){return s+((_planSummary(m,planMonth)||{}).ref||0);},0);
    var _cap1=_planGetRefH('standard',planMonth);
    var _etpM=_cap1>0?_cm/_cap1:0;
    var _actifs=mbrs.filter(function(m){return _planHasContractThisMonth(m,planMonth);});
    var _brc=_actifs.reduce(function(s,m){return s+_planLegalBreaches(m,planMonth);},0);
    var _alertHtml=_brc>0?'<button class="mvu-kpi pl2-kpi-alert" onclick="planKpiAlert()"><span class="mvu-kpi-v" style="display:block;color:#F0A9A0;font-size:14px">\u26a0 '+_brc+'</span><span class="mvu-kpi-l" style="display:block">sem. &gt; max</span></button>':'';
    if(!_dated){
      sb.innerHTML='<div class="mvu-kpi" style="flex:1"><div class="mvu-kpi-v" style="font-size:13px;color:var(--texte-doux)">Datez vos saisons</div><div class="mvu-kpi-l">pour charge &amp; ETP</div></div>'+_alertHtml;
    } else {
      var _tens=_cap>0?_cm/_cap:0;
      var _col=_tens>1.05?'var(--rouge)':'var(--vert-med)';
      sb.innerHTML='<div class="mvu-kpi"><div class="mvu-kpi-v">'+_planFmt(_cm)+'</div><div class="mvu-kpi-l">Charge du mois</div></div>'
        +'<div class="mvu-kpi"><div class="mvu-kpi-v">'+_planFmt(_cap)+'</div><div class="mvu-kpi-l">Capacit\u00e9 \u00e9quipe</div></div>'
        +'<div class="mvu-kpi"><div class="mvu-kpi-v" style="color:'+_col+'">'+_planFmtEtp(_etpM)+'</div><div class="mvu-kpi-l">ETP requis</div></div>'
        +_alertHtml;
    }
  } else if(window.currentUser){
    var me=_planMbrs().find(function(m){return m.nom===window.currentUser.nom;});
    if(me){
      var ms=_planSummary(me,planMonth);
      sb.innerHTML='<div class="mvu-kpi"><div class="mvu-kpi-v">'+_planFmt(ms.worked)+'</div><div class="mvu-kpi-l">Mes heures</div></div>'
        +'<div class="mvu-kpi"><div class="mvu-kpi-v">'+_planFmt(ms.ref)+'</div><div class="mvu-kpi-l">R\u00e9f\u00e9rence</div></div>'
        +'<div class="mvu-kpi"><div class="mvu-kpi-v" style="color:'+(ms.ecart>=0?'var(--vert-med)':'var(--rouge)')+'">'+_planFmtE(ms.ecart)+'</div><div class="mvu-kpi-l">\u00c9cart</div></div>';
    }
  }
  var _bdg=document.getElementById('plan-header-badge');
  if(_bdg){
    var _na=mbrs.filter(function(m){return _planHasContractThisMonth(m,planMonth);}).length;
    _bdg.textContent=_na+' salari\u00e9'+(_na>1?'s':'');
  }
  var tabs=document.querySelectorAll('#plan-tabs .mvu-tab');
  tabs.forEach(function(t){t.classList.toggle('active',t.getAttribute('data-tab')===planTab);});
}

function _planRenderBody(){
  if(!isAdmin()){_planRenderMon();_pl2AbarSync();return;}
  if(planTab==='cadre')_planRenderCadre();
  else if(planTab==='gens')_planRenderGens();
  else _pl2RenderEquipe();
  _pl2AbarSync();
}

function planSwitchTab(tab){
  planTab=tab;
  if(tab!=='mois')planSelClear();
  _planRenderHeader();
  _planRenderBody();
}
function planPrevMonth(){planMonth--;if(planMonth<0){planMonth=11;planYear--;}_pl2Wi=null;_pl2Sel={};renderPlanning();}
function planNextMonth(){planMonth++;if(planMonth>11){planMonth=0;planYear++;}_pl2Wi=null;_pl2Sel={};renderPlanning();}

// ── ONGLET ÉQUIPE — grille équipe + synthèse (refonte v5.08) ──
var _pl2View='wk';        // 'wk' | 'mo'
var _pl2Wi=null;          // index de la semaine affichée (null = recalculer)
var _pl2Sel={};           // {'Nom|jour':true} — cochage, jamais un mode
var _pl2PulseNom=null;    // salarié à surligner (alerte cadre légal)

function _pl2Actifs(){return _planMbrs().filter(function(m){return _planHasContractThisMonth(m,planMonth);});}
function _pl2WiDefault(){
  var ws=_planMonthWeeks(planMonth),t=new Date();
  if(t.getFullYear()===planYear&&t.getMonth()===planMonth){
    var d=t.getDate();
    for(var i=0;i<ws.length;i++){if(ws[i].days.indexOf(d)>=0)return i;}
  }
  return 0;
}
function _pl2Cell(mbr,plId,d,L){
  if(!_planInContract(mbr,planMonth,d))return{txt:'\u2013',cls:'pl2c-hc',hc:true};
  var e=_pEntDay(mbr.nom,planMonth,d);
  var pl=_planPlanned(plId,planMonth,d);
  if(e&&e.type==='cp')return{txt:'CP',cls:'pl2c-cp'};
  if(e&&e.type==='recup')return{txt:'\u21ba',cls:'pl2c-rec'};
  if(e&&e.absent)return{txt:'\u2715',cls:'pl2c-abs'};
  var eff=_planEffective(plId,planMonth,d,e);
  var brk=eff>L.maxJour+0.0001;
  if(e&&e.timing){
    var cls=e.canicule?'pl2c-heat':(eff>pl+0.05?'pl2c-up':(eff<pl-0.05?'pl2c-dn':'pl2c-mod'));
    return{txt:_planFmt(eff),cls:cls,brk:brk};
  }
  if(pl>0)return{txt:_planFmt(pl),cls:'pl2c-w',brk:brk};
  return{txt:'\u00b7',cls:'pl2c-off'};
}
function _pl2DayCols(){
  if(_pl2View==='mo'){
    var tot=_planDays(planMonth),a=[];
    for(var d=1;d<=tot;d++)a.push(d);
    return a;
  }
  var ws=_planMonthWeeks(planMonth);
  if(_pl2Wi==null||_pl2Wi<0||_pl2Wi>=ws.length)_pl2Wi=_pl2WiDefault();
  var w=ws[_pl2Wi],cols=[];
  for(var j=0;j<7;j++){
    var dt=new Date(w.mon); dt.setDate(w.mon.getDate()+j);
    cols.push(dt.getMonth()===planMonth?dt.getDate():null);
  }
  return cols;
}
function pl2SetView(v){_pl2View=v;_pl2RenderEquipe();}
function pl2Nav(dir){
  if(_pl2View==='mo'){if(dir<0)planPrevMonth();else planNextMonth();return;}
  var ws=_planMonthWeeks(planMonth);
  if(_pl2Wi==null)_pl2Wi=_pl2WiDefault();
  var ni=_pl2Wi+dir;
  if(ni<0){planMonth--;if(planMonth<0){planMonth=11;planYear--;}_pl2Sel={};_pl2Wi=_planMonthWeeks(planMonth).length-1;renderPlanning();return;}
  if(ni>=ws.length){planMonth++;if(planMonth>11){planMonth=0;planYear++;}_pl2Sel={};_pl2Wi=0;renderPlanning();return;}
  _pl2Wi=ni;_pl2RenderEquipe();
}
function _pl2Toolbar(){
  var lbl1,lbl2;
  if(_pl2View==='mo'){lbl1=PLAN_MOIS[planMonth]+' '+planYear;lbl2=_planDays(planMonth)+' jours';}
  else{
    var ws=_planMonthWeeks(planMonth);
    if(_pl2Wi==null||_pl2Wi>=ws.length)_pl2Wi=_pl2WiDefault();
    var w=ws[_pl2Wi];
    var d0=w.days[0],d1=w.days[w.days.length-1];
    lbl1='Semaine '+w.no;
    lbl2=d0+(d1!==d0?' \u2013 '+d1:'')+' '+PLAN_MOIS[planMonth].toLowerCase()+' '+planYear;
  }
  return '<div class="pl2-toolbar">'
    +'<button class="pl2-nav-btn" onclick="pl2Nav(-1)" aria-label="Pr\u00e9c\u00e9dent">\u2039</button>'
    +'<div class="pl2-nav-lbl"><span class="pl2-nav-l1">'+lbl1+'</span><span class="pl2-nav-l2">'+lbl2+'</span></div>'
    +'<button class="pl2-nav-btn" onclick="pl2Nav(1)" aria-label="Suivant">\u203a</button>'
    +'<div class="pl2-seg">'
      +'<button class="'+(_pl2View==='wk'?'on':'')+'" onclick="pl2SetView(\'wk\')">Sem.</button>'
      +'<button class="'+(_pl2View==='mo'?'on':'')+'" onclick="pl2SetView(\'mo\')">Mois</button>'
    +'</div>'
  +'</div>';
}
function _pl2IsToday(d){var t=new Date();return t.getFullYear()===planYear&&t.getMonth()===planMonth&&t.getDate()===d;}
// Classes de case qui portent des HEURES : seules celles-la recoivent l'exposant
// d'effectif. Un CP, une absence ou une recup sur une ligne collective resteraient
// muets — et afficher « CP x30 » n'aurait aucun sens.
var _PL2_EFF_CLS={'pl2c-w':1,'pl2c-up':1,'pl2c-dn':1,'pl2c-mod':1,'pl2c-heat':1};
function _pl2Board(){
  var mbrs=_pl2Actifs(),L=_planLegal();
  if(!mbrs.length)return '<div class="plan-empty">Aucun salari\u00e9 sous contrat ce mois.</div>';
  var cols=_pl2DayCols(),mo=_pl2View==='mo';
  var h='<div class="pl2-board"><div class="pl2-bwrap"><div class="pl2-grid'+(mo?' pl2-mo':' pl2-wk')+'" style="--nbc:'+cols.length+'">';
  // Le coin est le croisement de toutes les lignes et de toutes les colonnes :
  // il coche la vue entiere. C'est la selection « toute l'equipe, cette semaine ».
  h+='<button class="pl2-corner" onclick="planSelAll()" aria-label="Cocher toute la vue">Salari\u00e9</button>';
  cols.forEach(function(d){
    if(d==null){h+='<div class="pl2-dh pl2-dh-out"><span class="pl2-dh-dow">&nbsp;</span><span class="pl2-dh-num">\u00b7</span></div>';return;}
    var dow=_planDow(planMonth,d),we=(dow===0||dow===6);
    var fer=_planFerie(planMonth,d);
    // L'en-tete du jour coche la COLONNE : toute l'equipe, ce jour-la. C'est le geste
    // « demain tout le monde commence a 6 h » en deux touches au lieu de huit.
    h+='<button class="pl2-dh'+(we?' pl2-we':'')+(_pl2IsToday(d)?' pl2-today':'')+(_planColFull(d)?' pl2-hdon':'')+'" data-col="'+d+'" onclick="planColTap('+d+')" aria-label="Cocher le '+d+' pour toute l\u2019\u00e9quipe"><span class="pl2-dh-dow">'+(mo?PLAN_JOURS[dow].charAt(0):PLAN_JOURS[dow])+'</span><span class="pl2-dh-num">'+d+'</span>'+(fer?'<span class="pl2-dh-fer" title="'+_escAttr(fer)+'"></span>':'')+'</button>';
  });
  mbrs.forEach(function(mbr){
    var s=_planSummary(mbr,planMonth),plId=_planPlId(mbr),nomA=_escAttr(mbr.nom);
    var _coll=!!(window._mvEstCollectif&&window._mvEstCollectif(mbr));
    var _sub=_coll
      ?('\u{1F465} '+_planEffMax(mbr,planMonth)+' pers. \u00b7 '+_planFmt(_planCollH(mbr,planMonth)))
      :(_planFmt(s.worked)+' / '+_planFmt(s.ref));
    var pulse=_pl2PulseNom===mbr.nom?' pl2-pulse':'';
    // Le nom coche la LIGNE : cette personne, sur toute la vue. Sa fiche s'ouvre
    // depuis sa carte, sous la grille — une cible, un effet.
    h+='<button class="pl2-name'+pulse+(_planRowFull(mbr.nom)?' pl2-nameon':'')+'" data-plrow="'+nomA+'" onclick="planRowTap(\''+nomA+'\')" aria-label="Cocher toute la vue pour '+nomA+'">'
      +'<span class="pl2-ava" style="background:'+(mbr.couleur||'#3D6B27')+'">'+_escHtml(mbr.nom.charAt(0))+'</span>'
      +'<span class="pl2-name-t"><span class="pl2-name-n">'+_escHtml(mbr.nom)+'</span><span class="pl2-name-s">'+_sub+'</span></span>'
    +'</button>';
    cols.forEach(function(d){
      if(d==null){h+='<div class="pl2-cell pl2-cell-out"></div>';return;}
      var dow=_planDow(planMonth,d),we=(dow===0||dow===6);
      var c=_pl2Cell(mbr,plId,d,L);
      if(_coll&&!c.hc&&_PL2_EFF_CLS[c.cls]){
        var _n=_planEffN(mbr,planMonth,d);
        if(_n>1)c.txt=c.txt+'<sup style="font-size:8px;font-weight:700;opacity:.8">\u00d7'+_n+'</sup>';
      }
      if(c.hc){h+='<div class="pl2-cell pl2-cell-hc'+(we?' pl2-we':'')+'"><span class="pl2-chip pl2c-hc">\u2013</span></div>';return;}
      var sel=_pl2Sel[mbr.nom+'|'+d]?' pl2-selon':'';
      h+='<button class="pl2-cell'+(we?' pl2-we':'')+(_pl2IsToday(d)?' pl2-tdcol':'')+sel+'" data-cell="'+nomA+'|'+d+'" onclick="planCellTap(\''+nomA+'\','+d+')" aria-label="'+nomA+' '+d+' '+PLAN_MOIS_C[planMonth]+'"><span class="pl2-chip '+c.cls+(c.brk?' pl2c-brk':'')+'">'+c.txt+'</span></button>';
    });
  });
  h+='<div class="pl2-totl">\u03a3 jour</div>';
  cols.forEach(function(d){
    if(d==null){h+='<div class="pl2-tot">\u00b7</div>';return;}
    var t=0;
    mbrs.forEach(function(mbr){
      if(!_planInContract(mbr,planMonth,d))return;
      var e=_pEntDay(mbr.nom,planMonth,d);
      t+=_planEffective(_planPlId(mbr),planMonth,d,e)*_planEffN(mbr,planMonth,d);
    });
    h+='<div class="pl2-tot">'+(t>0?_planFmt(t):'\u00b7')+'</div>';
  });
  h+='</div></div>';
  h+='<div class="pl2-legend">'
    +'<span><i class="pl2c-w"></i> Pr\u00e9vu</span>'
    +'<span><i class="pl2c-up"></i> Heures +</span>'
    +'<span><i class="pl2c-dn"></i> Heures \u2212</span>'
    +'<span><i class="pl2c-cp"></i> CP</span>'
    +'<span><i class="pl2c-abs"></i> Absence</span>'
    +'<span><i class="pl2c-rec"></i> R\u00e9cup</span>'
    +'<span><i class="pl2c-heat"></i> Chaleur</span>'
    +'<span><i style="background:var(--or)"></i> F\u00e9ri\u00e9</span>'
  +'</div></div>';
  return h;
}
function _pl2Synth(){
  var mbrs=_pl2Actifs();
  var _nC=mbrs.filter(function(m){return window._mvEstCollectif&&window._mvEstCollectif(m);}).length;
  var _nS=mbrs.length-_nC;
  var h='<div class="plan-sec-lbl">'+_nS+' salari\u00e9'+(_nS>1?'s':'')
    +(_nC>0?(' \u00b7 '+_nC+' \u00e9quipe'+(_nC>1?'s':'')):'')+'</div>';
  mbrs.forEach(function(mbr){
    var s=_planSummary(mbr,planMonth),nomA=_escAttr(mbr.nom);
    if(window._mvEstCollectif&&window._mvEstCollectif(mbr)){h+=_pl2SynthColl(mbr,nomA);return;}
    var col=s.ecart>=0?'var(--vert-med)':'var(--orange)';
    var abs=0,cpj=0;
    var _mo=_pEntMonth(mbr.nom,planMonth);
    Object.values(_mo).forEach(function(e){if(e.absent)abs++;else if(e.type==='cp')cpj++;});
    var brc=_planLegalBreaches(mbr,planMonth);
    var badges=(brc>0?'<span class="plan-badge plan-badge-abs">\u26a0 '+brc+' sem. &gt; max</span>':'')
      +(abs>0?'<span class="plan-badge plan-badge-abs">'+abs+' abs.</span>':'')
      +(cpj>0?'<span class="plan-badge" style="background:var(--orange-pale);color:var(--orange)">CP '+cpj+' j</span>':'')
      +(mbr.planning_note?'<span class="plan-badge plan-badge-warn">\u26a0 '+_escHtml(mbr.planning_note)+'</span>':'');
    var pulse=_pl2PulseNom===mbr.nom?' pl2-pulse':'';
    h+='<button class="pl2-mcard'+pulse+'" data-plcard="'+nomA+'" onclick="openPlanFiche(\''+nomA+'\')">'
      +'<span class="pl2-ava pl2-ava-lg" style="background:'+(mbr.couleur||'#3D6B27')+'">'+_escHtml(mbr.nom.charAt(0))+'</span>'
      +'<span class="pl2-mc-mid">'
        +'<span class="pl2-mc-n">'+_escHtml(mbr.nom)+badges+'</span>'
        +'<span class="pl2-mc-s">'+_planFmt(s.worked)+' travaill\u00e9es \u00b7 '+_planFmt(s.ref)+' pr\u00e9vues</span>'
        +'<span class="pl2-mc-track" aria-hidden="true"><span class="pl2-mc-fill" style="width:'+Math.min(100,s.etp*100)+'%;background:'+col+'"></span></span>'
      +'</span>'
      +'<span class="pl2-mc-right"><span class="pl2-mc-e" style="color:'+col+'">'+_planFmtE(s.ecart)+'</span><span class="pl2-mc-etp">ETP '+_planFmtEtp(s.etp)+'</span></span>'
      +'<span class="pl2-chev">\u203a</span>'
    +'</button>';
  });
  return h;
}
// Carte de synthese d'une equipe collective : ni ecart, ni ETP, ni barre de
// progression — rien de tout cela ne veut dire quoi que ce soit sur 30 personnes.
// Ce qu'on veut savoir tient en deux nombres : combien ils etaient, combien d'heures.
function _pl2SynthColl(mbr,nomA){
  var n=_planEffMax(mbr,planMonth),ch=_planCollH(mbr,planMonth);
  var jours=0;
  for(var d=1;d<=_planDays(planMonth);d++){
    if(!_planInContract(mbr,planMonth,d))continue;
    if(_planEffective(_planPlId(mbr),planMonth,d,_pEntDay(mbr.nom,planMonth,d))>0.0001)jours++;
  }
  return '<button class="pl2-mcard" data-plcard="'+nomA+'" onclick="openPlanFiche(\''+nomA+'\')">'
    +'<span class="pl2-ava pl2-ava-lg" style="background:'+(mbr.couleur||'#8A5A38')+'">\u{1F465}</span>'
    +'<span class="pl2-mc-mid">'
      +'<span class="pl2-mc-n">'+_escHtml(mbr.nom)+'<span class="plan-badge" style="background:var(--tag-amber-bg,#fffbeb);color:var(--tag-amber-tx,#92400e)">\u00e9quipe</span></span>'
      +'<span class="pl2-mc-s">'+n+' personne'+(n>1?'s':'')+' au plus fort \u00b7 '+jours+' jour'+(jours>1?'s':'')+' travaill\u00e9'+(jours>1?'s':'')+'</span>'
    +'</span>'
    +'<span class="pl2-mc-right"><span class="pl2-mc-e" style="color:var(--terre,#8A5A38)">'+_planFmt(ch)+'</span><span class="pl2-mc-etp">au total</span></span>'
    +'<span class="pl2-chev">\u203a</span>'
  +'</button>';
}
function _pl2Annual(){
  // Recap annuel = heures des SALARIES face a leur modele de semaine. Une equipe
  // collective n'a pas de modele : l'y inclure ecraserait la barre de tous les mois.
  var mbrs=_planMbrs().filter(function(m){return !(window._mvEstCollectif&&window._mvEstCollectif(m));});
  var h='<div class="plan-card" style="margin-top:14px"><div class="plan-card-lbl">R\u00e9cap annuel \u2014 \u00e9quipe</div>';
  h+='<div class="plan-annual-bars">';
  for(var mi=0;mi<12;mi++){
    var mw=mbrs.reduce(function(s,m){return s+_planCalcMonth(m,mi);},0);
    var mr=mbrs.reduce(function(s,m){return s+_planGetRefH(_planPlId(m),mi);},0);
    var pct=mr>0?Math.min(100,mw/mr*100):0;
    var act=mi===planMonth;
    h+='<button class="plan-bar-btn" onclick="planGoMonth('+mi+')">'
      +'<span class="plan-bar-fill" style="display:block;height:'+Math.max(4,pct*0.38)+'px;background:'+(act?PLAN_ACC2:'var(--gris-clair)')+'"></span>'
      +'<span class="plan-bar-lbl" style="display:block;color:'+(act?PLAN_ACC2:'var(--texte-doux)')+';font-weight:'+(act?700:400)+'">'+PLAN_MOIS_C[mi].charAt(0)+'</span>'
    +'</button>';
  }
  h+='</div></div>';
  return h;
}
// ── ONGLET « LE MOIS » — la grille, et rien d'autre ──
// Les cartes de synthèse et le récap annuel sont partis dans « Les gens » : ils
// répétaient sous la grille les mêmes noms et les mêmes heures que dans la grille,
// et les deux ouvraient la même fiche.
function _pl2RenderEquipe(){
  var body=document.getElementById('plan-body');
  if(!body)return;
  body.innerHTML=_pl2YearTabs()+_pl2Toolbar()+_planPeriodeBar()+_pl2Board()+_pl2HorsContrat();
  _pl2MbarSync();
  if(_pl2PulseNom){
    var row=body.querySelector('.pl2-pulse');
    if(row&&row.scrollIntoView)row.scrollIntoView({block:'center',behavior:'smooth'});
    var nomP=_pl2PulseNom;
    setTimeout(function(){
      if(_pl2PulseNom!==nomP)return;
      _pl2PulseNom=null;
      document.querySelectorAll('.pl2-pulse').forEach(function(x){x.classList.remove('pl2-pulse');});
    },2600);
  }
}

// ★ Ce que la grille ne sait pas cocher : une plage qui déborde la vue affichée
//   (trois semaines de congés, deux mois de canicule). Deux boutons visibles,
//   au lieu d'un menu « Outils » qui cachait quatre entrées derrière un engrenage.
function _planPeriodeBar(){
  return '<div class="pl2-perbar">'
    +'<button onclick="openPlanCP()"><span>\u2600\uFE0F</span> Cong\u00e9s sur une p\u00e9riode</button>'
    +'<button onclick="openPlanChaleur()"><span>\ud83c\udf21\uFE0F</span> Chaleur sur une p\u00e9riode</button>'
  +'</div>';
}

// Hors contrat : l'information vivait sous les cartes de synthèse. Elle appartient
// à la grille — c'est elle qui montre des lignes absentes.
function _pl2HorsContrat(){
  var hors=_planMbrs().filter(function(m){return !_planHasContractThisMonth(m,planMonth);});
  if(!hors.length)return '';
  return '<div class="pl2-hors">Hors contrat ce mois \u2014 '+hors.map(function(m){
    var info='';
    if(m.fin_contrat){var fd=m.fin_contrat.split('-');info=' (fin '+parseInt(fd[2],10)+'/'+parseInt(fd[1],10)+')';}
    else if(m.debut_contrat){var dd=m.debut_contrat.split('-');info=' (d\u00e8s le '+parseInt(dd[2],10)+'/'+parseInt(dd[1],10)+')';}
    return _escHtml(m.nom)+info;
  }).join(' \u00b7 ')+'</div>';
}

// ── ONGLET « LES GENS » — une ligne par personne, une seule fois ──
function _planRenderGens(){
  var body=document.getElementById('plan-body');
  if(!body)return;
  body.innerHTML=_pl2YearTabs()+_planGensMois()+_pl2Synth()+_pl2Annual()+_planGensArchives();
  if(_pl2PulseNom){
    var row=body.querySelector('.pl2-pulse');
    if(row&&row.scrollIntoView)row.scrollIntoView({block:'center',behavior:'smooth'});
    var nomP=_pl2PulseNom;
    setTimeout(function(){
      if(_pl2PulseNom!==nomP)return;
      _pl2PulseNom=null;
      document.querySelectorAll('.pl2-pulse').forEach(function(x){x.classList.remove('pl2-pulse');});
    },2600);
  }
}
// Le mois consulté se change ici aussi : les chiffres de chaque carte en dépendent,
// et renvoyer l'utilisateur dans « Le mois » pour changer de mois serait un aller-retour.
function _planGensMois(){
  return '<div class="pl2-toolbar">'
    +'<button class="pl2-nav-btn" onclick="planPrevMonth()" aria-label="Mois pr\u00e9c\u00e9dent">\u2039</button>'
    +'<div class="pl2-nav-lbl"><span class="pl2-nav-l1">'+PLAN_MOIS[planMonth]+' '+planYear+'</span><span class="pl2-nav-l2">heures, cong\u00e9s, compteur</span></div>'
    +'<button class="pl2-nav-btn" onclick="planNextMonth()" aria-label="Mois suivant">\u203a</button>'
  +'</div>';
}
// Les anciens salariés : une section repliée en bas de la liste, plus une feuille
// séparée qu'il fallait aller chercher dans « Outils ». Ce sont des gens : ils sont
// dans « Les gens ».
function _planGensArchives(){
  var inactifs=(window.MEMBRES||[]).filter(function(m){return m.statut==='Inactif';});
  if(!inactifs.length)return '';
  var h='<div class="plan-sec-lbl" style="margin-top:18px">Anciens salari\u00e9s \u2014 '+inactifs.length+'</div>'
    +'<div class="pl2-note" style="margin-bottom:10px">Sans acc\u00e8s \u00e0 l\u2019application \u2014 heures et PDF restent consultables. Contrat modifiable dans R\u00e9glages \u203a Membres.</div>';
  inactifs.forEach(function(mbr){
    var s=_planSummary(mbr,planMonth),nomA=_escAttr(mbr.nom);
    var tc=mbr.type_contrat||'CDI',cinfo='';
    if(mbr.fin_contrat){var fd=mbr.fin_contrat.split('-');cinfo=' \u00b7 fin '+parseInt(fd[2],10)+'/'+parseInt(fd[1],10)+'/'+fd[0];}
    h+='<div class="pl2-arc-row">'
      +'<span class="pl2-ava" style="background:'+(mbr.couleur||'#888')+';opacity:.6">'+_escHtml(mbr.nom.charAt(0))+'</span>'
      +'<span class="pl2-arc-mid"><span class="pl2-arc-n">'+_escHtml(mbr.nom)+'</span><span class="pl2-arc-s">'+_planFmt(s.worked)+' / '+_planFmt(s.ref)+' \u00b7 '+_escHtml(tc)+cinfo+'</span></span>'
      +'<button class="plan-btn-saisir" onclick="openPlanFiche(\''+nomA+'\')">Heures</button>'
      +'<button class="plan-btn-pdf" onclick="planExportPDF(\''+nomA+'\')">PDF</button>'
    +'</div>';
  });
  return h;
}
// ══════════════════════════════════════════════════════════════════════
// LA SÉLECTION — ce n'est plus un mode, c'est un état
// ══════════════════════════════════════════════════════════════════════
// Avant ce lot il fallait ARMER « Sélection multiple » pour que toucher une case
// la coche ; sans le mode, la même case ouvrait l'éditeur du jour. Deux effets
// pour un geste identique, et rien à l'écran ne disait lequel s'appliquerait.
// Désormais toucher une case la coche, toujours. Un jour ou trente, c'est le même
// geste : la barre du bas dit ce qui est coché et ce qu'on peut en faire.
// ⚠️ Corollaire à ne pas défaire : plus aucun chemin ne doit dépendre d'un mode
//    armé au préalable. Un bouton qui ne marche « que si » est le défaut d'origine.

function _planSelKeys(){return Object.keys(_pl2Sel);}
function _planSelParse(k){var i=k.lastIndexOf('|');return {nom:k.slice(0,i),d:parseInt(k.slice(i+1),10)};}
function _planSelCount(){return _planSelKeys().length;}
window._planSelKeys=_planSelKeys;

// Jours cochables de la vue courante pour un salarié : hors contrat exclu, sinon
// cocher une ligne poserait des heures sur des jours où la personne n'est pas là.
function _planRowDays(nom){
  var mbr=(window.MEMBRES||[]).find(function(m){return m.nom===nom;});
  if(!mbr)return [];
  return _pl2DayCols().filter(function(d){return d!=null&&_planInContract(mbr,planMonth,d);});
}
function _planRowFull(nom){
  var ds=_planRowDays(nom);
  return ds.length>0&&ds.every(function(d){return !!_pl2Sel[nom+'|'+d];});
}
function _planColFull(d){
  var ms=_pl2Actifs().filter(function(m){return _planInContract(m,planMonth,d);});
  return ms.length>0&&ms.every(function(m){return !!_pl2Sel[m.nom+'|'+d];});
}

// ── Les trois gestes de cochage ──
function planCellTap(nom,d){
  if(!isAdmin())return;
  var k=nom+'|'+d;
  if(_pl2Sel[k])delete _pl2Sel[k];else _pl2Sel[k]=true;
  _pl2SelSync();
}
function planRowTap(nom){
  if(!isAdmin())return;
  var ds=_planRowDays(nom),on=_planRowFull(nom);
  ds.forEach(function(d){if(on)delete _pl2Sel[nom+'|'+d];else _pl2Sel[nom+'|'+d]=true;});
  _pl2SelSync();
}
function planColTap(d){
  if(!isAdmin())return;
  var ms=_pl2Actifs().filter(function(m){return _planInContract(m,planMonth,d);}),on=_planColFull(d);
  ms.forEach(function(m){if(on)delete _pl2Sel[m.nom+'|'+d];else _pl2Sel[m.nom+'|'+d]=true;});
  _pl2SelSync();
}
function planSelAll(){
  if(!isAdmin())return;
  var ms=_pl2Actifs(),cols=_pl2DayCols(),tot=0,on=0;
  ms.forEach(function(m){cols.forEach(function(d){
    if(d==null||!_planInContract(m,planMonth,d))return;
    tot++; if(_pl2Sel[m.nom+'|'+d])on++;
  });});
  var vider=(tot>0&&on===tot);
  ms.forEach(function(m){cols.forEach(function(d){
    if(d==null||!_planInContract(m,planMonth,d))return;
    if(vider)delete _pl2Sel[m.nom+'|'+d];else _pl2Sel[m.nom+'|'+d]=true;
  });});
  _pl2SelSync();
}
function planSelClear(){_pl2Sel={};_pl2SelSync();}

// ★ Sync SANS reconstruire la grille. Un rerender complet à chaque case touchée
//   coûtait le scroll et un clignotement, sur le geste le plus fréquent du module.
function _pl2SelSync(){
  document.querySelectorAll('#plan-body .pl2-cell[data-cell]').forEach(function(el){
    el.classList.toggle('pl2-selon',!!_pl2Sel[el.getAttribute('data-cell')]);
  });
  document.querySelectorAll('#plan-body .pl2-name[data-plrow]').forEach(function(el){
    el.classList.toggle('pl2-nameon',_planRowFull(el.getAttribute('data-plrow')));
  });
  document.querySelectorAll('#plan-body .pl2-dh[data-col]').forEach(function(el){
    el.classList.toggle('pl2-hdon',_planColFull(parseInt(el.getAttribute('data-col'),10)));
  });
  _pl2MbarSync();
}

// ── Ce que la sélection contient réellement ──
// La barre annonçait « 3 jours sélectionnés » : vrai, et inutile. Ce qu'on veut
// relire avant d'appliquer, c'est QUI et QUAND.
function _planSelResume(){
  var keys=_planSelKeys();
  if(!keys.length)return '';
  var noms={},jours={};
  keys.forEach(function(k){var p=_planSelParse(k);noms[p.nom]=1;if(!isNaN(p.d))jours[p.d]=1;});
  var nN=Object.keys(noms).length;
  var ds=Object.keys(jours).map(function(x){return parseInt(x,10);}).sort(function(a,b){return a-b;});
  var mois=PLAN_MOIS_C[planMonth].toLowerCase();
  var perJ=ds.length===0?''
    :ds.length===1?(ds[0]+' '+mois)
    :(ds[ds.length-1]-ds[0]===ds.length-1)?(ds[0]+' \u2192 '+ds[ds.length-1]+' '+mois)
    :(ds.length+' jours');
  var qui=nN===1?Object.keys(noms)[0]:(nN+' personnes');
  return qui+' \u00b7 '+perJ+(keys.length>1?(' \u00b7 '+keys.length+' cases'):'');
}

// ── La barre : elle ne propose que ce qui s'applique vraiment ──
// « Effectif » affichait un toast d'erreur quand aucune équipe collective n'était
// cochée : un bouton qui ne sert qu'à dire non. Désormais il n'apparaît pas.
function _planSelStats(){
  var st={n:0,coll:0,trav:0,saisis:0};
  _planSelKeys().forEach(function(k){
    var p=_planSelParse(k);
    var mbr=(window.MEMBRES||[]).find(function(m){return m.nom===p.nom;});
    if(!mbr)return;
    st.n++;
    if(window._mvEstCollectif&&window._mvEstCollectif(mbr))st.coll++;
    if(_planInContract(mbr,planMonth,p.d)&&_planPlanned(_planPlId(mbr),planMonth,p.d)>0)st.trav++;
    if(_pEntDay(p.nom,planMonth,p.d))st.saisis++;
  });
  return st;
}
function _pl2MbarSync(){
  var bar=document.getElementById('plan-mbar');
  var n=_planSelCount();
  if(bar)bar.classList.toggle('open',n>0);
  var lbl=document.getElementById('plan-mbar-lbl');
  if(lbl)lbl.textContent=n>0?_planSelResume():'';
  var acts=document.getElementById('plan-mbar-acts');
  if(!acts)return;
  if(!n){acts.innerHTML='';return;}
  var st=_planSelStats();
  var h='<button class="pl2-mbar-heures" onclick="planSelSheet(\'travail\')"><span>\u{1F550}</span><span>Heures</span></button>'
    +'<button onclick="openPlanCP(true)"><span>\u2600\uFE0F</span><span>Cong\u00e9</span></button>'
    +'<button onclick="planSelSheet(\'absent\')"><span>\u2715</span><span>Absence</span></button>';
  if(st.trav>0)h+='<button onclick="planSelAction(\'rec\')"><span>\u21BA</span><span>R\u00e9cup</span></button>'
    +'<button onclick="planSelAction(\'heat\')"><span>\u{1F321}\uFE0F</span><span>Chaleur</span></button>';
  if(st.coll>0)h+='<button onclick="planSelEffectif()"><span>\u{1F465}</span><span>Effectif</span></button>';
  if(st.saisis>0)h+='<button onclick="planSelAction(\'clr\')"><span>\u232B</span><span>Effacer</span></button>';
  acts.innerHTML=h;
}
// ══════════════════════════════════════════════════════════════════════
// LES MOTEURS D'ÉCRITURE — une seule règle métier pour un jour et pour trente
// ══════════════════════════════════════════════════════════════════════
// Avant ce lot, poser des heures avait DEUX implémentations : savePlanDay pour un
// jour, planMultiHApply pour une sélection. Elles ne préservaient pas les mêmes
// choses et ne comptaient pas pareil. Les feuilles ont fusionné ; ces fonctions
// sont ce qui reste dessous, appelées par les deux chemins.
// ⚠️ Elles ne lisent AUCUN champ du DOM : tout arrive en paramètre. C'est ce qui
//    les rend exécutables seules dans un harnais.
// ★ `force` = le geste porte sur UNE case, désignée à la main : on écrase ce qui
//   s'y trouve. Sans lui (geste groupé), congés, absences et récupérations de la
//   sélection sont préservés — on ne détruit pas en lot ce qu'on n'a pas relu.

function _planApplyHeures(keys,o){
  o=o||{};
  var deb=o.debut||'08:00',fin=o.fin||'16:00',cont=!!o.continu;
  var com=(o.comment||'').trim(),force=!!o.force,remp=!!o.remp,heat=!!o.heat;
  var n=0,skip=0,nCp=0;
  keys.forEach(function(k){
    var p=_planSelParse(k);
    var mbr=(window.MEMBRES||[]).find(function(m){return m.nom===p.nom;});
    if(!mbr||isNaN(p.d)||!_planInContract(mbr,planMonth,p.d)){skip++;return;}
    var pl=_planPlanned(_planPlId(mbr),planMonth,p.d);
    var ex=_pEntDay(p.nom,planMonth,p.d);
    if(remp){
      // Un remplacement est un ECHANGE : il ne concerne que les jours sans heures
      // prevues. Une absence ou une recup n'est jamais ecrasee — un arret de travail
      // ne doit pas devenir du travail par un geste groupe.
      if(pl>0){skip++;return;}
      if(ex&&(ex.absent||ex.type==='recup')){skip++;return;}
      if(ex&&ex.type==='cp')nCp++;
      _pEntEnsure(p.nom,planMonth)[p.d]={timing:{debut:deb,fin:fin,continu:cont},comment:com,remplacement:true};
      n++;return;
    }
    if(!force&&ex&&(ex.type==='cp'||ex.type==='recup'||ex.absent)){skip++;return;}
    var e={timing:{debut:deb,fin:fin,continu:cont},comment:com};
    if(heat){e.canicule=true;if(!e.comment)e.comment='Chaleur';}
    _pEntEnsure(p.nom,planMonth)[p.d]=e;
    n++;
  });
  return {n:n,skip:skip,cp:nCp};
}

function _planApplyAbs(keys,motifId,com,heuresVal){
  var mo=_planAbsDef(motifId),n=0,skip=0;
  keys.forEach(function(k){
    var p=_planSelParse(k);
    var mbr=(window.MEMBRES||[]).find(function(m){return m.nom===p.nom;});
    if(!mbr||isNaN(p.d)||!_planInContract(mbr,planMonth,p.d)){skip++;return;}
    var e={absent:true,motif:mo.id,comment:(com||'').trim()};
    if(mo.heures){var v=parseFloat(heuresVal);e.motif_h=(isNaN(v)||v<0)?0:v;}
    _pEntEnsure(p.nom,planMonth)[p.d]=e;
    n++;
  });
  return {n:n,skip:skip};
}

// Recup / chaleur / effacement : aucun parametre metier a qualifier, donc aucune
// feuille — ils s'appliquent depuis la barre. `force` sur une case unique, pour
// la meme raison que ci-dessus.
function _planApplySimple(keys,kind,force){
  var n=0,skip=0;
  keys.forEach(function(k){
    var p=_planSelParse(k);
    var mbr=(window.MEMBRES||[]).find(function(m){return m.nom===p.nom;});
    if(!mbr||isNaN(p.d)){skip++;return;}
    // « Effacer » retire une SAISIE : il doit rester possible hors contrat, sinon une
    // entree residuelle (salarie parti, contrat raccourci) devient impossible a retirer.
    if(kind==='clr'){
      var yb=_pEntYear(p.nom);
      if(yb&&yb[planMonth]&&yb[planMonth][p.d]){delete yb[planMonth][p.d];n++;}else skip++;
      return;
    }
    if(!_planInContract(mbr,planMonth,p.d)){skip++;return;}
    // Sur un geste groupe, un jour de repos n'est pas une cible : on ne cree pas
    // des journees de travail par inadvertance. Sur une case unique, designee a la
    // main, c'est un choix — poser une recup un samedi doit rester possible.
    if(!force&&_planPlanned(_planPlId(mbr),planMonth,p.d)<=0){skip++;return;}
    var ex=_pEntDay(p.nom,planMonth,p.d);
    // ⚠️ Corrige un defaut reel : poser recup ou chaleur sur une plage ecrasait en
    //    silence les conges deja poses dessus. Ils sont desormais preserves, et le
    //    toast le dit. Le geste unitaire (une seule case) ecrase toujours.
    if(!force&&ex&&(ex.type==='cp'||ex.type==='recup'||ex.absent)){skip++;return;}
    _pEntEnsure(p.nom,planMonth)[p.d]=(kind==='rec')
      ?{type:'recup'}
      :{timing:{debut:'06:00',fin:'14:00',continu:true},canicule:true,comment:'Chaleur'};
    n++;
  });
  return {n:n,skip:skip};
}

function planSelAction(kind){
  if(!isAdmin())return;
  var keys=_planSelKeys();
  if(!keys.length)return;
  var r=_planApplySimple(keys,kind,keys.length===1);
  window.PLANNING_ENTRIES=PLANNING_ENTRIES;
  if(r.n>0&&window.fbSave)window.fbSave('planning_entries',PLANNING_ENTRIES);
  var lbl={rec:'\u21ba R\u00e9cup pos\u00e9es',heat:'\ud83c\udf21 Horaires chaleur 06:00 \u2192 14:00',clr:'Saisies effac\u00e9es'}[kind]||'Fait';
  showToast(r.n>0?('\u2705 '+lbl+' \u00b7 '+r.n+' j'+(r.skip>0?' \u00b7 '+r.skip+' pr\u00e9serv\u00e9'+(r.skip>1?'s':''):'')):'Aucun jour applicable dans la s\u00e9lection',r.n>0?'#3D6B27':'#E07060');
  planSelClear();
  _pl2Refresh();
}

// ══ EFFECTIF D'UNE ÉQUIPE COLLECTIVE ══
// L'ecriture FUSIONNE dans l'entree du jour au lieu de la remplacer : on pose
// l'effectif APRES avoir pose les heures, jamais l'inverse. Un {effectif:n} nu
// effacerait les horaires de la vendange.
// Passe par openPrompt (#ovPrompt) : la boite de saisie native du navigateur
// n'affiche RIEN en PWA iOS — le bouton semblerait mort (lot UX-1).
function planSelEffectif(){
  if(!isAdmin())return;
  var keys=_planSelKeys();
  if(!keys.length)return;
  var noms={};keys.forEach(function(k){noms[_planSelParse(k).nom]=1;});
  var colls=Object.keys(noms).filter(function(n){
    var m=(window.MEMBRES||[]).find(function(x){return x.nom===n;});
    return !!(m&&window._mvEstCollectif&&window._mvEstCollectif(m));
  }).sort();
  if(!colls.length)return;
  if(typeof window.openPrompt!=='function'){showToast('Saisie indisponible','#C0392B');return;}
  var m0=(window.MEMBRES||[]).find(function(x){return x.nom===colls[0];});
  window.openPrompt({
    icone:'\u{1F465}',
    titre:'Combien de personnes\u00a0?',
    sub:colls.join(', ')+' \u00b7 '+keys.length+' jour'+(keys.length>1?'s':'')+' coch\u00e9'+(keys.length>1?'s':''),
    valeur:window._mvEffDef(m0),
    unite:'pers.',
    type:'nombre',
    placeholder:'ex. 28',
    btnLabel:'Appliquer',
    cb:function(v){ _planEffApply(v); }
  });
}
// Separee de la feuille de saisie pour etre executable seule dans un harnais.
function _planEffApply(v){
  var n=parseInt(String(v==null?'':v).replace(',','.'),10);
  if(isNaN(n)||n<1){showToast('Indiquez un nombre de personnes (1 minimum)','#B85A1A');return;}
  n=Math.min(999,n);
  var ok=0,skip=0,noH=0;
  _planSelKeys().forEach(function(k){
    var p=_planSelParse(k);
    var mbr=(window.MEMBRES||[]).find(function(x){return x.nom===p.nom;});
    if(!mbr||!(window._mvEstCollectif&&window._mvEstCollectif(mbr))){skip++;return;}
    if(isNaN(p.d)||!_planInContract(mbr,planMonth,p.d)){skip++;return;}
    var _eb=_pEntEnsure(p.nom,planMonth);
    var e=_eb[p.d]||{};
    e.effectif=n;
    _eb[p.d]=e;
    ok++;
    // Un effectif sans heures ne produit AUCUN total : 8 h x 0 personne et
    // 0 h x 30 personnes donnent le meme zero. On le dit plutot que de laisser
    // chercher pourquoi « ca ne compte rien ».
    if(_planEffective(_planPlId(mbr),planMonth,p.d,e)<=0.0001)noH++;
  });
  window.PLANNING_ENTRIES=PLANNING_ENTRIES;
  if(ok>0&&window.fbSave)window.fbSave('planning_entries',PLANNING_ENTRIES);
  var msg=ok>0
    ?('\u2705 '+n+' personne'+(n>1?'s':'')+' \u00b7 '+ok+' jour'+(ok>1?'s':'')
       +(skip>0?(' \u00b7 '+skip+' ignor\u00e9'+(skip>1?'s':'')):'')
       +(noH>0?(' \u00b7 \u26a0 '+noH+' sans heures pos\u00e9es'):''))
    :'Aucune case d\u2019\u00e9quipe collective dans la s\u00e9lection';
  showToast(msg,ok>0?(noH>0?'#B85A1A':'#3D6B27'):'#E07060');
  planSelClear();
  _pl2Refresh();
}

// ★ Jours de la selection SANS heures au planning (fermeture, samedi, repos).
//   Seuls ceux-la peuvent etre des jours de remplacement. Renvoie aussi le nombre
//   de conges deja poses dessus : c'est ce que la bascule remplacera, et l'annoncer
//   AVANT d'appliquer evite la surprise d'un conge efface en silence.
function _pmhNPStats(keys){
  var np=0,cp=0;
  (keys||_planSelKeys()).forEach(function(k){
    var p=_planSelParse(k);
    var mbr=(window.MEMBRES||[]).find(function(m){return m.nom===p.nom;});
    if(!mbr||isNaN(p.d)||!_planInContract(mbr,planMonth,p.d))return;
    if(_planPlanned(_planPlId(mbr),planMonth,p.d)>0)return;
    np++;
    var ex=_pEntDay(p.nom,planMonth,p.d);
    if(ex&&ex.type==='cp')cp++;
  });
  return {np:np,cp:cp};
}
function planKpiAlert(){
  var mbrs=_pl2Actifs(),hit=null;
  for(var i=0;i<mbrs.length;i++){if(_planLegalBreaches(mbrs[i],planMonth)>0){hit=mbrs[i];break;}}
  if(!hit){showToast('Aucun d\u00e9passement ce mois','#3D6B27');return;}
  if(planTab!=='mois'){planTab='mois';_planRenderHeader();_planRenderBody();}
  _pl2PulseNom=hit.nom;
  _pl2RenderEquipe();
  showToast('\u26a0 '+hit.nom+' \u00b7 semaine au-dessus du maximum \u2014 d\u00e9tail dans sa fiche','#B85A1A');
}
// La barre flottante « Outils » a disparu avec le menu du meme nom. Reste la garde :
// une selection ne doit pas survivre a un changement d'onglet, sinon la barre du bas
// propose d'agir sur des cases qui ne sont plus a l'ecran.
function _pl2AbarSync(){
  if((planTab!=='mois'||!isAdmin())&&_planSelCount())planSelClear();
}
function _pl2Refresh(){
  renderPlanning();
  var ov=document.getElementById('ovPlanFiche');
  if(_planFicheNom&&ov&&ov.classList.contains('open'))_planFicheRender();
}

function planGoMonth(m){planMonth=m;_pl2Wi=null;_pl2Sel={};renderPlanning();}

// ── ONGLET MON PLANNING ──
function _planRenderMon(){
  var body=document.getElementById('plan-body');
  if(!body)return;
  var me=window.currentUser?_planMbrs().find(function(m){return m.nom===window.currentUser.nom;}):null;
  if(!me){body.innerHTML='<div class="plan-empty">Connectez-vous pour voir votre planning.</div>';return;}
  body.innerHTML=_planBuildMonHtml(me,isAdmin());
}

function _planBuildMonHtml(mbr,canEdit){
  var plId=_planPlId(mbr);
  var ent=_pEntMonth(mbr.nom,planMonth);
  var s=_planSummary(mbr,planMonth);
  var total=_planDays(planMonth);
  var cpPris=_planCpPris(mbr.nom),cpSolde=_planCpSolde(mbr);

  // Card résumé (compact — CP intégrés, le reste vit dans la fiche salarié)
  var sumHtml='<div class="plan-card">'
    +'<div class="plan-sum-top">'
      +'<div class="plan-emp-ava" style="background:'+((mbr.couleur||'#3D6B27')+'22')+';color:'+(mbr.couleur||'#3D6B27')+'">'+_escHtml(mbr.nom.charAt(0))+'</div>'
      +'<div><div class="plan-emp-name">'+_escHtml(mbr.nom)+'</div><div class="plan-emp-sub">'+PLAN_MOIS[planMonth]+' '+planYear+' \u00b7 planning '+_escHtml(plId)+(mbr.planning_note?' \u00b7 \u26a0 '+_escHtml(mbr.planning_note):'')+'</div></div>'
      +'<div style="margin-left:auto;text-align:right"><div class="plan-sum-ecart" style="color:'+(s.ecart>=0?'var(--vert-med)':'var(--rouge)')+'">'+_planFmtE(s.ecart)+'</div><div class="plan-sub-lbl">\u00e9cart '+PLAN_MOIS_C[planMonth]+'</div></div>'
    +'</div>'
    +'<div class="plan-stat-grid3">'
      +'<div class="plan-sg-item" style="background:var(--plan-acc-pale)"><div class="plan-sg-v">'+_planFmt(s.ref)+'</div><div class="plan-sg-l">Pr\u00e9vu</div></div>'
      +'<div class="plan-sg-item" style="background:var(--plan-acc-pale)"><div class="plan-sg-v">'+_planFmt(s.worked)+'</div><div class="plan-sg-l">Travaill\u00e9</div></div>'
      +'<div class="plan-sg-item" style="background:var(--plan-acc-pale)"><div class="plan-sg-v" style="color:'+(cpSolde>5?'var(--vert-med)':cpSolde>=0?'var(--orange)':'var(--rouge)')+'">'+cpSolde+' j</div><div class="plan-sg-l">CP restants'+(cpPris>0?' \u00b7 '+cpPris+' pris':'')+'</div></div>'
    +'</div>'
    +(canEdit?'<button class="pl2-fiche-link" onclick="openPlanFiche(\''+_escAttr(mbr.nom)+'\')">\ud83d\udc64 Ma fiche compl\u00e8te \u2014 cong\u00e9s \u00b7 heures sup \u00b7 acomptes \u00b7 PDF <span class="pl2-chev">\u203a</span></button>':'')
    +'</div>';

  // Jours
  var daysHtml='<div class="plan-days-list">';
  for(var d=1;d<=total;d++){
    var e=ent[d],pl=_planPlanned(plId,planMonth,d);
    var f=_planFerie(planMonth,d);
    var dow=_planDow(planMonth,d);
    var isWeekend=(dow===0||dow===6);
    // Jours hors contrat
    if(!_planInContract(mbr,planMonth,d)){
      daysHtml+='<div class="plan-day-row" style="border-color:var(--gris-clair);background:var(--bg-app);opacity:0.5;cursor:default">'
        +'<div class="plan-day-num" style="color:var(--gris)"><div class="plan-day-n">'+d+'</div><div class="plan-day-dow">'+PLAN_JOURS[dow]+'</div></div>'
        +'<div class="plan-day-info"><div class="plan-day-label" style="color:var(--gris)">Hors contrat</div></div>'
        +'<div class="plan-day-hours"></div>'
      +'</div>';
      continue;
    }
    var eff=_planEffective(plId,planMonth,d,e);
    var st=_planDayStatus(plId,planMonth,d,e);
    // Horaires (pas pour CP ni absent)
    var isCp=!!(e&&e.type==='cp');
    var isRecup=!!(e&&e.type==='recup');
    var tData=(!isCp&&e&&e.timing)||(pl>0&&!isCp&&!(e&&e.absent)?_planDefTiming(pl,plId,planMonth,d):null);
    var tStr=tData?(tData.d||tData.debut)+' \u2192 '+(tData.f||tData.fin)+(tData.continu?' \u00b7 continu':''):'';
    var tModified=!!(e&&e.timing);
    var tColor=tModified?(st.t==='continu'?'var(--plan-acc)':st.t==='supp'?'var(--vert-med)':st.t==='reduit'?'var(--orange)':'var(--texte-doux)'):'var(--texte-doux)';
    // Couleurs verte/orange uniquement quand une entree est reellement sauvegardee
    // Une absence n'est plus rouge par principe : st.c porte deja la couleur du
    // motif (bleu = assimilee travail, orange = payee, rouge = non payee).
    var effColor=isRecup?'var(--plan-acc)':e&&e.absent?st.c:isCp?'var(--orange)':e&&eff>pl&&pl>0?'var(--vert-med)':e&&eff<pl&&pl>0?'var(--orange)':st.c;
    var cpBadge=isCp?'<span style="font-size:10px;font-weight:600;background:rgba(217,119,6,0.35);color:var(--orange);padding:1px 7px;border-radius:20px;margin-left:6px">CP</span>':'';
    daysHtml+='<div class="plan-day-row" style="border-color:'+st.bd+';background:'+st.bg+';cursor:'+(canEdit?'pointer':'default')+'"'+(canEdit?' onclick="openPlanDayModal(\''+_escAttr(mbr.nom)+'\','+d+')"':'')+'>'
      +'<div class="plan-day-num" style="color:'+st.c+'"><div class="plan-day-n">'+d+'</div><div class="plan-day-dow">'+PLAN_JOURS[dow]+'</div></div>'
      +'<div class="plan-day-info">'
        +'<div class="plan-day-label" style="color:'+st.c+'">'+st.l+cpBadge+'</div>'
        +(tStr?'<div class="plan-day-timing" style="color:'+tColor+'">\ud83d\udd50 '+tStr+'</div>':'')
        +(e&&e.comment&&!e.absent&&!isCp&&!e.canicule?'<div class="plan-day-comment">\ud83d\udcac '+e.comment+'</div>':'')
      +'</div>'
      +'<div class="plan-day-hours">'
        +(e&&pl>0?'<div class="plan-day-pl">'+_planFmt(pl)+'</div>':'')
        +'<div class="plan-day-eff" style="color:'+effColor+'">'+(isRecup?_planFmt(pl):(eff>0?_planFmt(eff):'\u2014'))+'</div>'
      +'</div>'
      +(canEdit?'<div class="plan-day-arrow">\u203a</div>':'')
    +'</div>';
  }
  daysHtml+='</div>';
  if(canEdit)daysHtml+='<div class="plan-edit-hint">\u270f\ufe0f Appuyez sur un jour pour le modifier \u2014 toute l\u2019\u00e9quipe se g\u00e8re depuis l\u2019onglet <b>Le mois</b>.</div>';

  return sumHtml+daysHtml+_planLegalCard(mbr);
}

// ── Compteur heures supplementaires (CDI/CDD) — carte saisie admin ──
var _planHsupDetM=null;
function _planHsupInjectCss(){
  if(document.getElementById('plh-css'))return;
  var st=document.createElement('style');st.id='plh-css';
  st.textContent='.plh-wrap{margin-bottom:14px}.plh-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--terre,#8A5A38);margin-bottom:8px}.plh-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1.5px solid var(--gris-clair,#E8E2D8);border-radius:12px;background:var(--bg-card,#FBFAF6)}.plh-tbl{width:100%;border-collapse:collapse;font-size:12px;min-width:328px}.plh-tbl th{font-size:8.5px;text-transform:uppercase;letter-spacing:.2px;color:var(--texte-doux,#8A8178);font-weight:700;text-align:center;padding:8px 3px 6px;line-height:1.15}.plh-tbl th.plh-mo{text-align:left;padding-left:10px}.plh-tbl td{padding:4px 3px;text-align:center;border-top:1px solid var(--gris-clair,#E8E2D8)}.plh-tbl td.plh-mo{text-align:left;padding-left:10px;font-weight:600;color:var(--texte,#2A2620);cursor:pointer;white-space:nowrap}.plh-tbl tr.plh-sel td{background:rgba(201,168,76,0.12)}.plh-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--terre,#8A5A38);margin-right:6px;vertical-align:1px}.plh-ro{font-weight:700;font-variant-numeric:tabular-nums}.plh-ro.z{color:#C3BBAE;font-weight:500}.plh-ro.rec{color:var(--rouge,#dc2626)}.plh-f{width:52px;font-family:inherit;font-size:13px;text-align:center;color:var(--texte,#2A2620);border-radius:7px;padding:5px 2px;outline:none;font-variant-numeric:tabular-nums;-moz-appearance:textfield}.plh-f::-webkit-outer-spin-button,.plh-f::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}.plh-ov{background:#fff;border:1.5px solid var(--gris-clair,#E8E2D8);color:var(--vert-med,#3D6B27);font-weight:700}.plh-ov.man{background:var(--orange-pale,#FDF0DE);border-color:var(--orange,#d97706)}.plh-pm{background:var(--plan-acc-pale,#F0EDF9);border:1.5px solid rgba(123,109,184,0.4)}.plh-pb{background:var(--orange-pale,#FDF0DE);border:1.5px solid rgba(217,119,6,0.5)}.plh-f:disabled{background:#F1EEE8;border:1.5px dashed var(--gris-clair,#E8E2D8);color:#C3BBAE}.plh-tbl tfoot td{border-top:2px solid var(--terre,#8A5A38);padding-top:8px;font-weight:800}.plh-tbl tfoot td.plh-mo{color:var(--terre,#8A5A38)}.plh-tot-v{font-variant-numeric:tabular-nums}.plh-tbl th.plh-restc,.plh-tbl td.plh-restc{background:rgba(138,90,56,0.03);border-left:1px solid var(--gris-clair,#E8E2D8)}.plh-tbl th.plh-cumc,.plh-tbl td.plh-cumc{background:rgba(138,90,56,0.055);border-left:1px solid var(--gris-clair,#E8E2D8)}.plh-tbl tfoot td.plh-restc{background:rgba(138,90,56,0.06)}.plh-tbl tfoot td.plh-cumc{background:rgba(138,90,56,0.1)}.plh-cum{font-weight:800}.plh-note{font-size:11px;color:var(--texte-doux,#8A8178);margin-top:8px;line-height:1.35}';
  document.head.appendChild(st);
}
// Total annuel d'un modele de planning. Un modele qui ne totalise pas le plafond
// fausse le compteur de TOUS les salaries qui l'utilisent, des le 1er janvier.
function _planModelTotal(plId){
  var t=0;
  for(var m=0;m<12;m++)t+=_planGetRefH(plId,m);
  return t;
}
window._planModelTotal=_planModelTotal;

// ── Carte COMPTAGE — pour qui n'est PAS annualise (TESA, saisonnier, extra) ──
// Ce qui remplace le compteur compte autant que l'exemption : une personne payee
// a l'heure a toujours besoin de ses heures faites et de ses jours travailles
// pour la MSA. Une carte vide serait une regression deguisee en correctif.
function _planCompteCard(mbr,uptoMonth,a){
  var um=(uptoMonth==null?11:uptoMonth),jours=0;
  for(var m=0;m<=um;m++)jours+=_planDaysWorked(mbr,m);
  var tc=mbr.type_contrat||'CDI';
  var h='<div class="plan-card" style="background:var(--bg-card);border:1.5px solid var(--gris-clair);margin-bottom:14px;flex-direction:column;align-items:stretch">';
  h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:11px">'
    +'<span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--terre)">\u23f1 Heures faites \u00b7 '+planYear+'</span>'
    +'<span style="margin-left:auto;font-size:10px;font-weight:700;color:var(--texte-doux);background:var(--bg-app);border:1px solid var(--gris-clair);padding:2px 8px;border-radius:20px">'+_escHtml(tc)+'</span>'
  +'</div>';
  h+='<div style="display:flex;gap:7px">'
    +'<div style="flex:1;text-align:center;padding:11px 4px;background:var(--bg-app);border-radius:10px"><div style="font-size:24px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums">'+_planFmt(a.cumul)+'</div><div style="font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:var(--texte-doux);margin-top:4px">Travail effectif</div></div>'
    +'<div style="flex:1;text-align:center;padding:11px 4px;background:var(--bg-app);border-radius:10px"><div style="font-size:24px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums">'+jours+'</div><div style="font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:var(--texte-doux);margin-top:4px">Jours travaill\u00e9s</div></div>'
  +'</div>';
  h+='<div style="font-size:11px;color:var(--texte-doux);margin-top:11px;line-height:1.4">'
    +'<b>Pas d\u2019annualisation</b> pour ce type de contrat\u00a0: les heures sont pay\u00e9es \u00e0 l\u2019heure. '
    +'Ni plafond de '+_planFmt(_planLegal().plafAnnuel)+', ni modulation, ni solde \u00e0 la cl\u00f4ture. '
    +'Mesur\u00e9 en travail effectif\u00a0: cong\u00e9s, arr\u00eats et r\u00e9cup n\u2019y entrent pas.'
  +'</div>';
  return h+'</div>';
}
// ── Carte COMPTEUR D'HEURES (annualisation) — en tete de l'onglet ──
function _planAnnuCard(mbr,uptoMonth){
  var a=_planAnnu(mbr,uptoMonth),L=_planLegal();
  // ★ Contrats soldés dans la même année civile (backlog 0e — affichage seul).
  // Un salarie ré-embauché dans l'annee a N compteurs : l'ecran n'en montrait qu'un
  // (celui du contrat en cours). Chaque contrat terminé gagne ici une carte compacte.
  // _planSurContrat() borne _planInContractCtr aux dates du contrat passé :
  // plafond et cumul sont recalculés sur CETTE periode seulement.
  var yr=planYear.toString();
  function _pShort(iso){
    if(!iso)return '?';
    var pp=iso.split('-'),d=parseInt(pp[2],10),m=parseInt(pp[1],10)-1;
    return d+'\u00a0'+(PLAN_MOIS_C[m]||'');
  }
  var prevH='';
  if(a.annualise && typeof window._mvPeriodes==='function'){
    var allCtrs=window._mvPeriodes(mbr)||[];
    var actifDebut=mbr.debut_contrat||'';
    allCtrs.forEach(function(ctr){
      if(!ctr.fin)return;                                    // ouvert a droite = contrat actif
      if(actifDebut && ctr.debut===actifDebut)return;        // c'est le contrat courant
      if(ctr.fin<(yr+'-01-01'))return;                       // terminé avant l'annee
      if(ctr.debut>(yr+'-12-31'))return;                     // commencé après l'annee
      var pa=_planSurContrat(ctr,function(){ return _planAnnu(mbr,11); });
      if(!(pa.plafond>0))return;
      var over2=(pa.reste<0), pct=Math.min(100,pa.cumul/pa.plafond*100);
      var col2=over2?'var(--orange)':'var(--texte-doux)';
      prevH+='<div class="plan-card" style="background:var(--bg-card);border:1.5px solid var(--gris-clair);margin-bottom:10px;flex-direction:column;align-items:stretch">'
        +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">'
        +'<span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--texte-doux)">'
        +'\u23f1 Compteur sold\u00e9 \u00b7 '+_pShort(ctr.debut)+' \u2192 '+_pShort(ctr.fin)+'</span>'
        +'<span style="margin-left:auto;font-size:10px;font-weight:700;color:'+(over2?'var(--orange)':'var(--vert-med)')+'">'+(over2?'surplus\u00a0\u26a0\ufe0f':'sold\u00e9\u00a0\u2713')+'</span>'
        +'</div>'
        +'<div style="display:flex;align-items:center;gap:9px">'
        +'<div><span style="font-size:22px;font-weight:800;font-variant-numeric:tabular-nums">'+_planFmt(pa.cumul)+'</span>'
        +'<span style="font-size:11px;color:var(--texte-doux);margin-left:3px"> sur '+_planFmt(pa.plafond)+'</span></div>'
        +'<div style="flex:1;height:7px;background:var(--gris-clair);border-radius:4px;position:relative;overflow:hidden">'
        +'<div style="position:absolute;left:0;top:0;bottom:0;border-radius:4px;width:'+pct+'%;background:'+col2+'"></div>'
        +'</div>'
        +'<div style="font-size:11px;font-weight:700;color:'+(over2?'var(--orange)':'var(--vert-med)')+'">'+_planFmt(Math.abs(pa.reste))+' '+(over2?'au-dessus':'cr\u00e9dit')+'</div>'
        +'</div>'
        +'</div>';
    });
  }
  if(!a.annualise)return prevH+_planCompteCard(mbr,uptoMonth,a);
  var ech=Math.max(a.maxAnnuel,Math.ceil(a.plafond*1.15/100)*100,1);
  var over=(a.cumul>a.plafond+0.0001);
  var fin=(uptoMonth>=11);
  var pill=fin?{t:'\u00e0 cl\u00f4turer',c:'var(--orange)',bg:'var(--orange-pale)',b:'rgba(184,90,26,0.4)'}
    :over?{t:'au-dessus',c:'var(--orange)',bg:'var(--orange-pale)',b:'rgba(184,90,26,0.4)'}
    :{t:'en cours',c:'var(--vert-med)',bg:'var(--vert-pale)',b:'rgba(61,107,39,0.35)'};
  var h='<div class="plan-card" style="background:var(--bg-card);border:1.5px solid var(--gris-clair);margin-bottom:14px;flex-direction:column;align-items:stretch">';
  h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:11px">'
    +'<span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--terre)">\ud83d\udcc5 Compteur d\u2019heures \u00b7 '+planYear+'</span>'
    +'<span style="margin-left:auto;font-size:10px;font-weight:700;color:'+pill.c+';background:'+pill.bg+';border:1px solid '+pill.b+';padding:2px 8px;border-radius:20px">'+pill.t+'</span>'
  +'</div>';
  h+='<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:10px">'
    +'<div><span style="font-size:32px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums">'+_planFmt(a.cumul)+'</span><span style="font-size:12px;font-weight:600;color:var(--texte-doux);margin-left:4px"> faites</span></div>'
    +'<div style="text-align:right;font-size:11px;color:var(--texte-doux);line-height:1.35">plafond<b style="display:block;font-size:14px;color:var(--texte);font-variant-numeric:tabular-nums">'+_planFmt(a.plafond)+'</b></div>'
  +'</div>';
  h+='<div style="position:relative;height:13px;background:var(--gris-clair);border-radius:7px;margin:13px 0 6px">'
    +'<div style="position:absolute;left:0;top:0;bottom:0;border-radius:7px;width:'+Math.min(100,a.cumul/ech*100)+'%;background:'+(over?'var(--orange)':'var(--vert-med)')+'"></div>'
    +'<div style="position:absolute;top:-3px;bottom:-3px;width:2.5px;background:var(--terre);left:'+Math.min(100,a.plafond/ech*100)+'%"></div>'
  +'</div>';
  h+='<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--texte-doux)"><span>0h</span><span>'+_planFmt(ech)+'</span></div>';
  h+='<div style="display:flex;gap:7px;margin-top:12px">'
    +'<div style="flex:1;text-align:center;padding:9px 4px;background:var(--bg-app);border-radius:10px"><div style="font-size:15px;font-weight:800;color:'+(a.reste<0?'var(--orange)':'var(--vert-med)')+'">'+_planFmt(Math.abs(a.reste))+'</div><div style="font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:var(--texte-doux);margin-top:2px">'+(a.reste<0?'Au-dessus':'Reste')+'</div></div>'
    +'<div style="flex:1;text-align:center;padding:9px 4px;background:var(--bg-app);border-radius:10px"><div style="font-size:15px;font-weight:800">'+a.moisRest+'</div><div style="font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:var(--texte-doux);margin-top:2px">Mois rest.</div></div>'
    +'<div style="flex:1;text-align:center;padding:9px 4px;background:var(--bg-app);border-radius:10px"><div style="font-size:15px;font-weight:800">'+(a.moisRest>0?_planFmt(a.cadence):'\u2014')+'</div><div style="font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:var(--texte-doux);margin-top:2px">h / mois</div></div>'
  +'</div>';
  var nt='Mesur\u00e9 en <b>travail effectif</b>\u00a0: cong\u00e9s, arr\u00eats et r\u00e9cup n\u2019y entrent pas. Les '+_planFmt(L.plafAnnuel)+' sont d\u00e9j\u00e0 calcul\u00e9es cong\u00e9s d\u00e9duits.';
  if(a.susp>0.0001)nt='<b>Suspension de contrat prise en compte\u00a0:</b> le plafond descend de '+_planFmt(a.susp)+'. Ces heures ne sont ni \u00e0 rattraper, ni compt\u00e9es en d\u00e9ficit. '+nt;
  else if(a.plafond<L.plafAnnuel-1)nt='<b>Plafond proratis\u00e9</b> \u00e0 la dur\u00e9e du contrat. '+nt;
  h+='<div style="font-size:11px;color:var(--texte-doux);margin-top:10px;line-height:1.4">'+nt+'</div>';
  var _mdl=_planModelTotal(_planPlId(mbr)),_dev=_mdl-L.plafAnnuel,_devAb=Math.abs(_dev);
  h+='<div style="margin-top:12px;padding-top:11px;border-top:1px solid var(--gris-clair)">';
  h+='<div style="display:flex;align-items:baseline;justify-content:space-between"><span style="font-size:12.5px;color:var(--texte-doux)">Mod\u00e8le \u00ab\u00a0'+_escHtml(_planPlId(mbr))+'\u00a0\u00bb sur l\u2019ann\u00e9e</span><span style="font-size:14px;font-weight:800;color:'+(_devAb>10?'var(--orange)':'var(--vert-med)')+';font-variant-numeric:tabular-nums">'+_planFmt(_mdl)+'</span></div>';
  h+='<div style="font-size:11px;color:'+(_devAb>10?'var(--orange)':'var(--texte-doux)')+';margin-top:5px;line-height:1.4">'
    +(_devAb>10
      ?'<b>\u00c9cart de '+(_dev>0?'+':'\u2212')+_planFmt(_devAb)+' avec les '+_planFmt(L.plafAnnuel)+' attendues.</b> Corrige la grille du mod\u00e8le dans R\u00e9glages\u00a0: l\u2019\u00e9cart se reporte sur chaque salari\u00e9 qui l\u2019utilise.'
      :'Conforme aux '+_planFmt(L.plafAnnuel)+' attendues ('+(_dev>=0?'+':'\u2212')+_planFmt(_devAb)+').')
  +'</div>';
  h+='</div><div style="margin-top:12px;padding-top:11px;border-top:1px solid var(--gris-clair)">';
  var mOver=(a.modul>a.modulMax+0.0001),mWarn=(a.modul>a.modulMax*0.8);
  var mCol=mOver?'var(--rouge)':mWarn?'var(--orange)':'var(--plan-acc)';
  h+='<div style="display:flex;align-items:baseline;justify-content:space-between"><span style="font-size:12.5px;color:var(--texte-doux)">Heures de modulation \u00b7 au-del\u00e0 de '+_planFmt(L.hebdoLeg)+'/sem.</span><span style="font-size:14px;font-weight:800;color:'+mCol+';font-variant-numeric:tabular-nums">'+_planFmt(a.modul)+' / '+_planFmt(a.modulMax)+'</span></div>';
  h+='<div style="position:relative;height:9px;background:var(--gris-clair);border-radius:5px;margin-top:8px"><div style="position:absolute;left:0;top:0;bottom:0;border-radius:5px;width:'+Math.min(100,a.modul/Math.max(1,a.modulMax)*100)+'%;background:'+mCol+'"></div></div>';
  h+='<div style="font-size:11px;color:'+(mOver?'var(--rouge)':'var(--texte-doux)')+';margin-top:8px;line-height:1.4">'
    +(mOver?'<b>Plafond d\u00e9pass\u00e9.</b> Au-del\u00e0, les heures sortent de la modulation. Un accord peut relever ce plafond.'
      :'Compt\u00e9es semaine par semaine\u00a0: une semaine creuse ne rattrape pas une semaine charg\u00e9e.')
  +'</div>';
  h+='</div></div>';
  return prevH+h;
}

function _planHsupTable(mbr){
  _planHsupInjectCss();
  var nomA=_escAttr(mbr.nom),dm=_planHsupDetM,_payOn=_planHsupPayable();
  var rows='',tsup=0,trec=0,tpm=0,tpb=0,tdue=0;
  // Le RESTE d'un mois est la difference entre deux cumuls, jamais une formule
  // recopiee : les deux colonnes ne peuvent donc pas se contredire. Le point de
  // depart est le report d'heures d'avant Ma Vigne.
  var cumPrev=_planDepartSolde(mbr);
  // ★ La colonne « Dues » n'apparait que si l'annee en contient : une colonne vide sur
  //   tous les domaines qui n'utilisent pas ce reglage ne ferait qu'encombrer la table.
  var duesA=[],anyDue=false;
  for(var _dm=0;_dm<12;_dm++){duesA[_dm]=_planDuesMonth(mbr,_dm);if(duesA[_dm]>0.0001)anyDue=true;}
  for(var m=0;m<12;m++){
    var supCalc=Math.max(0,_planSummary(mbr,m).ecart);
    var supOv=_planHsupSupOv(mbr.nom,m);
    var supShown=(supOv!=null)?Math.max(0,supOv):supCalc;
    var isOv=(supOv!=null);
    var recupH=_planRecupH(mbr,m);
    var payeMois=Math.min(Math.max(0,_planHsupPaye(mbr.nom,m)),supShown);
    var availB=_planBankAvailAt(mbr,m);
    var payB=Math.min(Math.max(0,_planHsupPayeBank(mbr.nom,m)),availB);
    tsup+=supShown;trec+=recupH;tpm+=payeMois;tpb+=payB;
    // ★ Solde cumule a la fin du mois. MEME source que la carte « Solde des heures
    //   · annee » et que le releve annuel du PDF : _planYearBalance(). Ne jamais
    //   recalculer la formule ici — les trois affichages divergeraient au premier
    //   changement de regle (report de depart, heures dues, mode de paiement).
    var cumM=_planYearBalance(mbr,m).net;
    var resteM=cumM-cumPrev;cumPrev=cumM;
    var resteZ=(Math.abs(resteM)<0.0001);
    var supCell='<td><input class="plh-f plh-ov'+(isOv?' man':'')+'" type="number" step="0.5" min="0" id="plan-supov-'+m+'" value="'+(Math.round(supShown*100)/100)+'" title="planning : '+_planFmt(supCalc)+'" onchange="planSaveHsupSupOvAt(\''+nomA+'\','+m+')"></td>';
    var recCell='<td><span class="plh-ro '+(recupH>0.0001?'rec':'z')+'">'+(recupH>0.0001?'\u2212':'')+_planFmt(recupH)+'</span></td>';
    var _pmMax=supShown+availB;
    var pmCell='<td><input class="plh-f plh-pm" type="number" step="0.5" min="0" max="'+_pmMax+'" id="plan-hsuprow-'+m+'" value="'+(Math.round(payeMois*100)/100)+'"'+(_pmMax<0.0001?' disabled':'')+' title="Au-del\u00e0 des '+_planFmt(supShown)+' du mois, le surplus est pris sur le compteur" onchange="planSaveHsupAt(\''+nomA+'\','+m+')"></td>';
    var pbCell='<td><input class="plh-f plh-pb" type="number" step="0.5" min="0" max="'+availB+'" id="plan-hsupbankrow-'+m+'" value="'+(Math.round(payB*100)/100)+'"'+(availB<0.0001?' disabled':'')+' onchange="planSaveHsupBankAt(\''+nomA+'\','+m+')"></td>';
    var resteCell='<td class="plh-restc"><span class="plh-ro'+(resteZ?' z':'')+'"'+(resteZ?'':' style="color:'+(resteM>0?'var(--vert-med,#3D6B27)':'var(--rouge,#dc2626)')+'"')+'>'+(resteZ?'0h':_planFmtE(resteM))+'</span></td>';
    var cumCell='<td class="plh-cumc"><span class="plh-ro plh-cum" style="color:'+(cumM>=-0.0001?'var(--vert-med,#3D6B27)':'var(--rouge,#dc2626)')+'">'+_planFmtE(cumM)+'</span></td>';
    var dueCell=anyDue?('<td><span class="plh-ro" style="color:'+(duesA[m]>0.0001?'var(--rouge,#dc2626)':'var(--gris-clair)')+'">'+(duesA[m]>0.0001?'\u2212':'')+_planFmt(duesA[m])+'</span></td>'):'';
    tdue+=duesA[m];
    rows+='<tr class="plh-tr'+(m===dm?' plh-sel':'')+'"><td class="plh-mo" onclick="planHsupDet('+m+')"><span class="plh-dot"></span>'+PLAN_MOIS_C[m]+'</td>'+supCell+recCell+dueCell+(_payOn?pmCell+pbCell:'')+resteCell+cumCell+'</tr>';
  }
  // Le pied de cette colonne n'est PAS une somme : additionner des cumuls n'a
  // aucun sens. C'est le solde tel qu'il sera au 31 decembre.
  var cumTot=_planYearBalance(mbr,11).net;
  var resteTot=cumTot-_planDepartSolde(mbr);
  var tot='<tr><td class="plh-mo">Total</td><td><span class="plh-tot-v" style="color:var(--vert-med,#3D6B27)">'+(tsup>0.0001?'+':'')+_planFmt(tsup)+'</span></td><td><span class="plh-tot-v" style="color:var(--rouge,#dc2626)">'+(trec>0.0001?'\u2212':'')+_planFmt(trec)+'</span></td>'+(anyDue?'<td><span class="plh-tot-v" style="color:var(--rouge,#dc2626)">'+(tdue>0.0001?'\u2212':'')+_planFmt(tdue)+'</span></td>':'')+(_payOn?'<td><span class="plh-tot-v" style="color:var(--plan-acc)">'+_planFmt(tpm)+'</span></td><td><span class="plh-tot-v" style="color:var(--orange,#d97706)">'+_planFmt(tpb)+'</span></td>':'')+'<td class="plh-restc"><span class="plh-tot-v" style="color:'+(resteTot>=-0.0001?'var(--vert-med,#3D6B27)':'var(--rouge,#dc2626)')+'">'+_planFmtE(resteTot)+'</span></td>'+'<td class="plh-cumc"><span class="plh-tot-v" style="color:'+(cumTot>=-0.0001?'var(--vert-med,#3D6B27)':'var(--rouge,#dc2626)')+'">'+_planFmtE(cumTot)+'</span></td>'+'</tr>';
  var head='<tr><th class="plh-mo">Mois</th><th>Au-del\u00e0<br>du mois</th><th>R\u00e9cup</th>'+(anyDue?'<th>Heures<br>dues</th>':'')+(_payOn?'<th>Acompte<br>pay\u00e9</th><th>Pris sur<br>le solde</th>':'')+'<th class="plh-restc">Reste<br>du mois</th>'+'<th class="plh-cumc">Solde<br>cumul\u00e9</th>'+'</tr>';
  var _mLbl=_planHsupMode()==='recup'?'Ces heures se r\u00e9cup\u00e8rent en repos \u2014 aucun paiement mensuel sur ce domaine.'
    :_planHsupMode()==='cloture'?'Ces heures sont report\u00e9es au solde de fin d\u2019ann\u00e9e.'
    :'Les acomptes pay\u00e9s en cours d\u2019ann\u00e9e se d\u00e9duisent du solde de cl\u00f4ture. Un mois peut \u00eatre pay\u00e9 au-del\u00e0 de ses propres heures sup\u00a0: le surplus est pris sur le compteur et appara\u00eet dans « Pris sur le solde ».';
  return '<div class="plh-wrap"><div class="plh-title">\u00c9cart au planning \u00b7 mois par mois</div><div class="plh-scroll"><table class="plh-tbl"><thead>'+head+'</thead><tbody>'+rows+'</tbody><tfoot>'+tot+'</tfoot></table></div><div class="plh-note">Heures faites au-del\u00e0 du planning du mois \u2014 calcul\u00e9es, modifiables en cas de besoin (fond orang\u00e9 = valeur manuelle). '+_mLbl+' Touche un mois pour son d\u00e9tail ci-dessous.</div>'+'<div class="plh-note"><b>Reste du mois</b>\u00a0: ce que le mois ajoute au compteur, r\u00e9cup'+(anyDue?', heures dues':'')+' et acomptes d\u00e9duits \u2014 son total est la somme de la colonne.'+' <b>Solde cumul\u00e9</b>\u00a0: ce qui reste \u00e0 prendre \u00e0 la fin du mois, report de d\u00e9part  compris \u2014 son total est le solde du 31 d\u00e9cembre, planning pr\u00e9vu compris.</div></div>';
}
function _planHsupCard(mbr){
  if(_planHsupDetM==null)_planHsupDetM=planMonth;
  var dm=_planHsupDetM;
  var _dep=_planDepartSolde(mbr),_depDate=_planDepartDate(mbr);
  var hDep='<div class="plan-card" style="background:var(--terre-pale,#F3EADF);border:1.5px solid rgba(138,90,56,0.35);margin-bottom:14px;flex-direction:column;align-items:stretch">'
    +'<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--terre,#8A5A38);margin-bottom:10px">🌱 Solde de départ · '+planYear+'</div>'
    +'<div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">'
      +'<div style="flex:1;min-width:120px"><div style="font-size:11px;color:var(--texte-doux);margin-bottom:4px">Report d’heures (avant Ma Vigne)</div><input type="number" step="0.5" id="plan-depsolde" value="'+(Math.round(_dep*100)/100)+'" onchange="planSaveDepart()" style="width:100%;border:1.5px solid rgba(138,90,56,0.4);border-radius:10px;padding:9px;font-size:16px;text-align:center;outline:none;background:var(--bg-card);color:var(--texte);box-sizing:border-box"></div>'
      +'<div style="flex:1;min-width:120px"><div style="font-size:11px;color:var(--texte-doux);margin-bottom:4px">À partir du</div><input type="date" id="plan-depdate" value="'+_escAttr(_depDate)+'" min="'+planYear+'-01-01" max="'+planYear+'-12-31" onblur="planSaveDepart()" style="width:100%;border:1.5px solid rgba(138,90,56,0.4);border-radius:10px;padding:9px;font-size:15px;outline:none;background:var(--bg-card);color:var(--texte);box-sizing:border-box"></div>'
    +'</div>'
    +'<div style="font-size:11px;color:var(--texte-doux);margin-top:8px;line-height:1.35">Saisi une fois par salarié. Point de départ du solde annuel ci-dessous.</div>'
  +'</div>';
  var hTab=_planHsupTable(mbr);
  var _yb=_planYearBalance(mbr,dm);
  var _plusStr=(_yb.plus>0?'+':'')+_planFmt(_yb.plus);
  var _minusStr=(_yb.minus>0.0001?'\u2212':'')+_planFmt(_yb.minus);
  var _netCol=_yb.net>=-0.0001?'var(--vert-med,#3D6B27)':'var(--rouge,#dc2626)';
  var hYb='<div class="plan-card" style="background:var(--bg-card);border:1.5px solid var(--gris-clair);margin-bottom:14px;flex-direction:column;align-items:stretch">'
    +'<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px"><span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--terre,#8A5A38)">📊 Solde des heures · année</span><span style="font-size:11px;color:var(--texte-doux)">au '+PLAN_MOIS_C[dm]+' '+planYear+'</span></div>'
    +'<div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:12px"><span style="font-size:13px;font-weight:600;color:var(--texte)">Solde net</span><span style="font-size:28px;font-weight:800;color:'+_netCol+'">'+_planFmtE(_yb.net)+'</span></div>'
    +'<div style="display:flex;gap:8px">'
      +'<div style="flex:1;text-align:center;padding:8px 4px;background:var(--terre-pale,#F3EADF);border-radius:10px"><div style="font-size:15px;font-weight:800;color:var(--terre,#8A5A38)">'+_planFmt(_dep)+'</div><div style="font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:var(--texte-doux);margin-top:2px">Départ</div></div>'
      +'<div style="flex:1;text-align:center;padding:8px 4px;background:var(--vert-pale);border-radius:10px"><div style="font-size:15px;font-weight:800;color:var(--vert-med)">'+_plusStr+'</div><div style="font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:var(--texte-doux);margin-top:2px">Sup + cumul</div></div>'
      +'<div style="flex:1;text-align:center;padding:8px 4px;background:var(--rouge-pale);border-radius:10px"><div style="font-size:15px;font-weight:800;color:var(--rouge)">'+_minusStr+'</div><div style="font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:var(--texte-doux);margin-top:2px">Récup − cumul</div></div>'
      +(_yb.minusPay>0.0001?'<div style="flex:1;text-align:center;padding:8px 4px;background:var(--orange-pale,#FDF0DE);border-radius:10px"><div style="font-size:15px;font-weight:800;color:var(--orange)">−'+_planFmt(_yb.minusPay)+'</div><div style="font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:var(--texte-doux);margin-top:2px">Payé − cumul</div></div>':'')
      +(_yb.dues>0.0001?'<div style="flex:1;text-align:center;padding:8px 4px;background:var(--rouge-pale);border-radius:10px"><div style="font-size:15px;font-weight:800;color:var(--rouge)">−'+_planFmt(_yb.dues)+'</div><div style="font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:var(--texte-doux);margin-top:2px">Dues − cumul</div></div>':'')
    +'</div>'
    +'<div style="font-size:11px;color:var(--texte-doux);margin-top:10px;line-height:1.35">Cumul depuis le départ : heures reportées (+), récup ou acomptes pris (−). Rien ne périme en cours d’année — le solde se règle à la clôture du 31 décembre.</div>'
  +'</div>';
  var s=_planSummary(mbr,dm);
  var sup=_planSupMonth(mbr,dm);
  var recupH=_planRecupH(mbr,dm);
  var paye=Math.min(Math.max(0,_planHsupPaye(mbr.nom,dm)),sup);
  var reporte=sup-paye;
  var bank=_planBank(mbr,dm);
  var payBank=Math.max(0,_planHsupPayeBank(mbr.nom,dm));
  // Ce qui est REELLEMENT paye ce mois : la part prise sur les heures du mois ET la
  // part prise sur le compteur. Les separer ici afficherait moins que ce que touche
  // le salarie.
  var aPayer=paye+payBank+bank.forced;
  var h=_planAnnuCard(mbr,dm)+hDep+hTab+hYb+'<div class="plan-card" style="background:var(--plan-acc-pale);border:1.5px solid rgba(123,109,184,0.4);margin-bottom:14px">';
  h+='<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--plan-acc);margin-bottom:10px">\u23f1 Compteur \u00b7 '+PLAN_MOIS_C[dm]+' '+planYear+'</div>';
  if(sup>0.0001){
    h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font-size:13px;color:var(--texte)">Heures sup. du mois</div><div style="font-size:16px;font-weight:700;color:var(--vert-med)">+'+_planFmt(sup)+'</div></div>';
    h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font-size:13px;color:var(--texte-doux)">Pay\u00e9es ce mois</div><div style="font-size:15px;font-weight:700;color:var(--texte)">'+_planFmt(paye)+'</div></div>';
    h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><div style="font-size:13px;color:var(--texte-doux)">Report\u00e9es \u2192 compteur</div><div style="font-size:15px;font-weight:700;color:var(--plan-acc)">'+_planFmt(reporte)+'</div></div>';
  } else {
    h+='<div style="font-size:12px;color:var(--texte-doux);margin-bottom:10px">'+(s.ecart<-0.0001?'D\u00e9ficit de '+_planFmt(-s.ecart)+' ce mois \u2014 pas d\u2019heures sup.':'Mois \u00e0 l\u2019\u00e9quilibre \u2014 pas d\u2019heures sup.')+'</div>';
  }
  if(recupH>0.0001){
    h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><div style="font-size:13px;color:var(--texte-doux)">R\u00e9cup prise ce mois</div><div style="font-size:15px;font-weight:700;color:var(--plan-acc)">\u2212'+_planFmt(recupH)+'</div></div>';
  }
  if(payBank>0.0001){
    h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><div style="font-size:13px;color:var(--texte-doux)">Pay\u00e9 depuis le compteur</div><div style="font-size:15px;font-weight:700;color:var(--orange,#d97706)">\u2212'+_planFmt(payBank)+'</div></div>';
  }
  h+='<div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid rgba(123,109,184,0.3)"><div style="font-size:13px;font-weight:600;color:var(--texte)">Compteur</div><div style="font-size:22px;font-weight:800;color:'+(bank.solde>0.0001?'var(--plan-acc)':'var(--texte-doux)')+'">'+_planFmt(bank.solde)+'</div></div>';
  bank.tr.forEach(function(t){
    var _trLbl=t.dep?'Report \u00b7 avant Ma Vigne':('Acquis '+PLAN_MOIS_C[t.mois]+' \u00b7 il y a '+(dm-t.mois)+' mois');
    h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;font-size:12px"><span style="color:var(--texte-doux)">'+_trLbl+'</span><span style="font-weight:700;color:var(--plan-acc)">'+_planFmt(t.h)+'</span></div>';
  });
  if(bank.overdraw>0.0001){
    h+='<div style="font-size:12px;color:var(--orange);margin-top:8px">\u26a0 '+_planFmt(bank.overdraw)+' de r\u00e9cup non couverte par le compteur.</div>';
  }
  if(aPayer>0.0001){
    var alerte=false;   // annualisation : aucune heure ne perime en cours d'annee
    var fTxt='';
    h+='<div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:'+(alerte?'var(--rouge-pale)':'var(--bg-card)')+';border:1.5px solid '+(alerte?'var(--rouge)':'var(--gris-clair)')+'">';
    h+='<div style="display:flex;align-items:center;justify-content:space-between"><div style="font-size:13px;font-weight:700;color:'+(alerte?'var(--rouge)':'var(--texte)')+'">'+(alerte?'\u26a0\ufe0f ':'')+'\u00c0 payer ce mois</div><div style="font-size:18px;font-weight:800;color:'+(alerte?'var(--rouge)':'var(--texte)')+'">'+_planFmt(aPayer)+'</div></div>';
    h+='<div style="font-size:11px;color:var(--texte-doux);margin-top:3px">'+(payBank>0.0001?_planFmt(paye)+' sur les heures du mois + '+_planFmt(payBank)+' sur le compteur':_planFmt(paye)+' en acompte')+'\u00a0\u2014 d\u00e9duites du solde de cl\u00f4ture.</div>';
    h+='</div>';
  }
  h+='</div>';
  return h;
}

// ── Cadre légal — suivi (mois courant + semaines) ──
// Total HEBDO en TRAVAIL EFFECTIF : les durees maximales (48 h, 44 h moyenne,
// 10 h/jour) portent sur le temps reellement travaille. Un conge paye ou un
// arret dans la semaine ne peut pas declencher une alerte de depassement.
function _planWeekTotal(mbr,m,w){
  var plId=_planPlId(mbr);
  var ent=_pEntMonth(mbr.nom,m);
  return w.days.reduce(function(s,d){return _planInContract(mbr,m,d)?s+_planWorkH(plId,m,d,ent[d]):s;},0);
}
function _planLegalBreaches(mbr,m){
  // Une equipe collective totalise 30 x 8 h = 240 h par semaine : la garde des
  // 48 h hebdomadaires crierait des le premier jour de vendange. Le maximum est
  // une regle PAR SALARIE — elle n'a pas d'objet sur une ligne qui en agrege 30.
  if(window._mvEstCollectif&&window._mvEstCollectif(mbr))return 0;
  var L=_planLegal(),n=0;
  _planMonthWeeks(m).forEach(function(w){if(!w.partial&&_planWeekTotal(mbr,m,w)>L.maxHebdo+0.0001)n++;});
  return n;
}
function _planLegalBar(value,scaleMax,fillColor,markLeg,markMax){
  var w=Math.min(100,value/scaleMax*100);
  var h='<div style="position:relative;height:12px;background:var(--gris-clair);border-radius:7px;margin-top:13px">';
  h+='<div style="position:absolute;left:0;top:0;bottom:0;border-radius:7px;width:'+w+'%;background:'+fillColor+'"></div>';
  if(markLeg!=null&&markLeg<scaleMax)h+='<div style="position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--texte);opacity:.6;left:'+(markLeg/scaleMax*100)+'%"></div>';
  if(markMax!=null&&markMax<scaleMax)h+='<div style="position:absolute;top:-3px;bottom:-3px;width:2.5px;background:var(--rouge);left:'+(markMax/scaleMax*100)+'%"></div>';
  h+='</div>';
  return h;
}
function _planLegalCard(mbr){
  var L=_planLegal(),plId=_planPlId(mbr);
  var weeks=_planMonthWeeks(planMonth);
  var breaches=_planLegalBreaches(mbr,planMonth);
  var worked=_planWorkMonth(mbr,planMonth);
  var headPill=breaches>0
    ?'<span style="margin-left:auto;font-size:10px;font-weight:700;color:var(--rouge);background:var(--rouge-pale);border:1px solid rgba(220,38,38,0.4);padding:2px 8px;border-radius:20px">\u26a0 '+breaches+' sem. &gt; max</span>'
    :'<span style="margin-left:auto;font-size:10px;font-weight:700;color:var(--vert-med);background:var(--vert-pale);border:1px solid rgba(61,107,39,0.35);padding:2px 8px;border-radius:20px">\u2713 conforme</span>';
  var border=breaches>0?'1.5px solid var(--rouge)':'1px solid var(--gris-clair)';
  var h='<div class="plan-card" style="border:'+border+';flex-direction:column;align-items:stretch;margin-bottom:14px">';
  h+='<div style="display:flex;align-items:center;gap:6px"><span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--plan-acc)">\u2696\ufe0f Cadre l\u00e9gal</span>'+headPill+'</div>';
  var overLeg=worked>L.mensLeg+0.0001;
  var mScale=Math.max(L.mensLeg*1.25,worked*1.08,1);
  h+='<div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:10px"><span style="font-size:12px;color:var(--texte-doux)">Mois \u00b7 travail effectif</span><span style="font-size:16px;font-weight:800">'+_planFmt(worked)+'</span></div>';
  h+=_planLegalBar(worked,mScale,overLeg?'var(--plan-acc)':'var(--vert-med)',L.mensLeg,null);
  h+='<div style="font-size:11px;margin-top:13px;color:'+(overLeg?'var(--plan-acc)':'var(--texte-doux)')+'">'+(overLeg?'+'+_planFmt(worked-L.mensLeg)+' au-dessus de la dur\u00e9e l\u00e9gale ('+_planFmt(L.mensLeg)+')':'Sous la dur\u00e9e l\u00e9gale mensuelle ('+_planFmt(L.mensLeg)+')')+'</div>';
  h+='<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--texte-doux);margin:16px 0 4px;border-top:1px solid var(--gris-clair);padding-top:12px">\ud83d\udcc6 Par semaine \u00b7 max '+_planFmt(L.maxHebdo)+'</div>';
  h+='<div style="font-size:10px;color:var(--gris);margin-bottom:8px">Rep\u00e8res : trait = dur\u00e9e l\u00e9gale, trait rouge = maximum.</div>';
  weeks.forEach(function(w){
    var tot=_planWeekTotal(mbr,planMonth,w),cls,sc,ic,txt;
    if(!w.partial&&tot>L.maxHebdo+0.0001){cls='r';sc='var(--rouge)';ic='\u26a0\ufe0f';txt='D\u00e9passe le maximum ('+_planFmt(L.maxHebdo)+') de '+_planFmt(tot-L.maxHebdo);}
    else if(!w.partial&&tot>L.maxMoy+0.0001){cls='o';sc='var(--orange)';ic='\u25b3';txt='Au-del\u00e0 de la moyenne '+_planFmt(L.maxMoy)+' \u2014 \u00e0 surveiller sur 12 sem.';}
    else if(tot>L.hebdoLeg+0.0001){cls='';sc='var(--vert-med)';ic='\u2713';txt='+'+_planFmt(tot-L.hebdoLeg)+' au-dessus de la dur\u00e9e l\u00e9gale';}
    else{cls='';sc='var(--texte-doux)';ic='\u00b7';txt='Sous la dur\u00e9e l\u00e9gale';}
    var rowBg=cls==='r'?'var(--rouge-pale)':cls==='o'?'var(--orange-pale)':'transparent';
    var rowBd=cls==='r'?'1px solid rgba(220,38,38,0.4)':cls==='o'?'1px solid rgba(217,119,6,0.4)':'1px solid var(--gris-clair)';
    var fill=cls==='r'?'var(--rouge)':cls==='o'?'var(--orange)':'var(--vert-med)';
    var ent=_pEntMonth(mbr.nom,planMonth);
    var capDay=w.days.some(function(d){return _planInContract(mbr,planMonth,d)&&_planWorkH(plId,planMonth,d,ent[d])>=L.maxJour-0.0001;});
    var d0=w.days[0],d1=w.days[w.days.length-1];
    var sc2=Math.max(L.maxHebdo*1.12,tot*1.05,1);
    h+='<div style="border:'+rowBd+';background:'+rowBg+';border-radius:12px;padding:10px 12px;margin-bottom:8px">'
      +'<div style="display:flex;align-items:baseline;gap:8px"><span style="font-size:13px;font-weight:800">S'+w.no+'</span><span style="font-size:11px;color:var(--texte-doux)">'+d0+(d1!==d0?'\u2013'+d1:'')+' '+PLAN_MOIS[planMonth].toLowerCase()+'</span><span style="margin-left:auto;font-size:16px;font-weight:800">'+_planFmt(tot)+'</span></div>'
      +_planLegalBar(tot,sc2,fill,L.hebdoLeg,L.maxHebdo)
      +'<div style="font-size:11.5px;font-weight:700;color:'+sc+';margin-top:12px">'+ic+' '+txt+'</div>'
      +(w.partial?'<div style="font-size:10px;color:var(--texte-doux);font-style:italic;margin-top:3px">Semaine \u00e0 cheval \u2014 jours du mois uniquement (le plafond '+_planFmt(L.maxHebdo)+' s\'\u00e9value sur la semaine compl\u00e8te).</div>':'')
      +(capDay?'<div style="font-size:10px;color:var(--orange);font-style:italic;margin-top:3px">Jour(s) au plafond quotidien de '+_planFmt(L.maxJour)+'.</div>':'')
      +'</div>';
  });
  h+='<div style="font-size:10px;color:var(--gris);font-style:italic;margin-top:2px">Indicatif \u2014 l\'employeur reste responsable du respect du droit applicable.</div>';
  h+='</div>';
  return h;
}
function planSaveHsupAt(nom,m){
  var mbr=(window.MEMBRES||[]).find(function(x){return x.nom===nom;});
  if(!mbr)return;
  var key=_planHsupKey(m),el=document.getElementById('plan-hsuprow-'+m);
  if(!el)return;
  var v=parseFloat(el.value);if(isNaN(v)||v<0)v=0;
  if(!PLANNING_HSUP[nom])PLANNING_HSUP[nom]={};
  if(!PLANNING_HSUP[nom][key])PLANNING_HSUP[nom][key]={};
  // ★ Un mois peut etre paye AU-DELA de ses propres heures sup : on puise alors
  //   dans le compteur (heures reportees des mois precedents, report d'avant Ma Vigne
  //   compris). Avant, la saisie etait ramenee en silence aux heures du mois : le
  //   paiement reel n'apparaissait nulle part et le solde restait surevalue.
  //   Le surplus part sur paye_bank — exactement le champ de la colonne « Pris sur
  //   le solde ». Le PDF, la carte compteur et le solde annuel le voient donc deja,
  //   sans aucune autre modification du modele de donnees.
  var supM=_planSupMonth(mbr,m);
  var pm=Math.min(v,supM);
  PLANNING_HSUP[nom][key].paye=pm;
  var sur=v-pm;
  if(sur>0.0001){
    PLANNING_HSUP[nom][key].paye_bank=0;              // neutralise avant de mesurer
    var availS=_planBankAvailAt(mbr,m);
    var pbS=Math.min(sur,availS);
    PLANNING_HSUP[nom][key].paye_bank=pbS;
    if(window.showToast){
      if(sur-pbS>0.0001)window.showToast('Compteur insuffisant\u00a0: '+_planFmt(pm)+' du mois + '+_planFmt(pbS)+' sur le solde. '+_planFmt(sur-pbS)+' non retenues.','#B85A1A');
      else window.showToast(_planFmt(v)+' pay\u00e9es\u00a0: '+_planFmt(pm)+' du mois + '+_planFmt(pbS)+' sur le solde.','#3D6B27');
    }
  }
  window.PLANNING_HSUP=PLANNING_HSUP;
  if(window.fbSave)window.fbSave('planning_hsup',PLANNING_HSUP);
  _pl2Refresh();
}
function planSaveHsupBankAt(nom,m){
  var mbr=(window.MEMBRES||[]).find(function(x){return x.nom===nom;});
  if(!mbr)return;
  var key=_planHsupKey(m),el=document.getElementById('plan-hsupbankrow-'+m);
  if(!el)return;
  var v=parseFloat(el.value);if(isNaN(v)||v<0)v=0;
  if(!PLANNING_HSUP[nom])PLANNING_HSUP[nom]={};
  if(!PLANNING_HSUP[nom][key])PLANNING_HSUP[nom][key]={};
  PLANNING_HSUP[nom][key].paye_bank=0;
  var b=_planBank(mbr,m);var avail=b.solde+b.forced;
  v=Math.min(v,avail);
  PLANNING_HSUP[nom][key].paye_bank=v;
  window.PLANNING_HSUP=PLANNING_HSUP;
  if(window.fbSave)window.fbSave('planning_hsup',PLANNING_HSUP);
  _pl2Refresh();
}
function planSaveHsupSupOvAt(nom,m){
  var mbr=(window.MEMBRES||[]).find(function(x){return x.nom===nom;});
  if(!mbr)return;
  var key=_planHsupKey(m),el=document.getElementById('plan-supov-'+m);
  if(!el)return;
  var raw=el.value,v=parseFloat(raw);
  var calc=Math.max(0,_planSummary(mbr,m).ecart);
  if(!PLANNING_HSUP[nom])PLANNING_HSUP[nom]={};
  if(!PLANNING_HSUP[nom][key])PLANNING_HSUP[nom][key]={};
  if(raw===''||isNaN(v)||Math.abs(v-calc)<1e-9){ if('sup_override' in PLANNING_HSUP[nom][key])delete PLANNING_HSUP[nom][key].sup_override; }
  else { PLANNING_HSUP[nom][key].sup_override=Math.max(0,v); }
  window.PLANNING_HSUP=PLANNING_HSUP;
  if(window.fbSave)window.fbSave('planning_hsup',PLANNING_HSUP);
  _pl2Refresh();
}
function planHsupDet(m){_planHsupDetM=m;if(typeof _planFicheRender==='function')_planFicheRender();}
function planSaveDepart(){
  if(!isAdmin())return;
  var nom=_planFicheNom;
  if(!nom)return;
  var mbr=(window.MEMBRES||[]).find(function(m){return m.nom===nom;});
  if(!mbr)return;
  var key=_planDepartKey();
  var elS=document.getElementById('plan-depsolde'),elD=document.getElementById('plan-depdate');
  var v=elS?parseFloat(elS.value):0; if(isNaN(v))v=0;
  var dv=elD?(elD.value||''):'';
  if(!PLANNING_HSUP[nom])PLANNING_HSUP[nom]={};
  if(!PLANNING_HSUP[nom][key])PLANNING_HSUP[nom][key]={};
  PLANNING_HSUP[nom][key].solde=v;
  PLANNING_HSUP[nom][key].date=dv;
  window.PLANNING_HSUP=PLANNING_HSUP;
  if(window.fbSave)window.fbSave('planning_hsup',PLANNING_HSUP);
  _pl2Refresh();
}

// ── (ex-onglet Saisie — remplacé par la fiche salarié · refonte v5.08) ──
// ── FICHE SALARIÉ (overlay 4 volets : Mois · Congés · H. sup · Acomptes) ──
var _planFicheNom=null,_planFicheTabId='mois';

function openPlanFiche(nom){
  if(!isAdmin())return;
  var mbr=(window.MEMBRES||[]).find(function(m){return m.nom===nom;});
  if(!mbr)return;
  _planFicheNom=nom;_planFicheTabId='mois';_planHsupDetM=planMonth;
  _planFicheRender();
  var ov=document.getElementById('ovPlanFiche');
  if(ov)ov.classList.add('open');
}
function closePlanFiche(){
  var ov=document.getElementById('ovPlanFiche');
  if(ov)ov.classList.remove('open');
  _planFicheNom=null;
}
function planFicheTab(t){_planFicheTabId=t;_planFicheRender();}
function planFichePdf(){if(_planFicheNom)planExportPDF(_planFicheNom);}
function planFicheOpenDay(d){var nom=_planFicheNom;closePlanFiche();if(nom)openPlanDayModal(nom,d);}
function _planFicheRender(){
  var mbr=(window.MEMBRES||[]).find(function(m){return m.nom===_planFicheNom;});
  if(!mbr)return;
  var ava=document.getElementById('pf-ava');
  if(ava){ava.textContent=mbr.nom.charAt(0);ava.style.background=mbr.couleur||'#3D6B27';}
  var nomEl=document.getElementById('pf-nom');
  if(nomEl)nomEl.textContent=mbr.nom;
  var sub=document.getElementById('pf-sub');
  if(sub)sub.textContent=((window._mvEstCollectif&&window._mvEstCollectif(mbr))
    ?('\u00c9quipe collective \u00b7 '+_planEffMax(mbr,planMonth)+' pers.')
    :('Planning '+_planPlId(mbr)+' \u00b7 '+(mbr.type_contrat||'CDI')))
    +(mbr.statut==='Inactif'?' \u00b7 inactif':'')+' \u00b7 '+PLAN_MOIS[planMonth]+' '+planYear;
  document.querySelectorAll('#ovPlanFiche .pl2-ftab').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-f')===_planFicheTabId);});
  var body=document.getElementById('pf-body');
  if(!body)return;
  var t=_planFicheTabId,s=_planSummary(mbr,planMonth),h='';
  // Une equipe collective n'a ni solde de conges ni compteur d'heures sup : ces
  // onglets afficheraient des chiffres faux avec l'aplomb de chiffres vrais.
  var _coll=!!(window._mvEstCollectif&&window._mvEstCollectif(mbr));
  if(_coll&&(t==='cp'||t==='hsup')){body.innerHTML=_planCollNote(mbr);return;}
  if(t==='mois'){
    h=(_coll?('<div class="pl2-note" style="margin-bottom:8px">Chiffres ci-dessous\u00a0: ceux d\u2019<b>une</b> personne. Le total de l\u2019\u00e9quipe est en bas de page.</div>'):'')
      +'<div class="pl2-fstat">'
      +'<div class="pl2-fs"><span class="pl2-fs-v">'+_planFmt(s.ref)+'</span><span class="pl2-fs-l">Pr\u00e9vu (h)</span></div>'
      +'<div class="pl2-fs"><span class="pl2-fs-v">'+_planFmt(s.worked)+'</span><span class="pl2-fs-l">Travaill\u00e9 (h)</span></div>'
      +'<div class="pl2-fs"><span class="pl2-fs-v" style="color:'+(s.ecart>=0?'var(--vert-med)':'var(--orange)')+'">'+_planFmtE(s.ecart)+'</span><span class="pl2-fs-l">\u00c9cart \u00b7 ETP '+_planFmtEtp(s.etp)+'</span></div>'
    +'</div>';
    var ent=_pEntMonth(mbr.nom,planMonth);
    var ks=Object.keys(ent).map(function(x){return parseInt(x,10);}).filter(function(x){return !isNaN(x);}).sort(function(a,b){return a-b;});
    h+='<div class="plan-sec-lbl" style="margin-top:2px">Jours particuliers du mois \u2014 '+ks.length+'</div>';
    if(!ks.length)h+='<div class="pl2-note">Aucune modification \u2014 le planning pr\u00e9vu s\u2019applique tel quel.</div>';
    var plId=_planPlId(mbr);
    ks.forEach(function(d){
      var e=ent[d],st=_planDayStatus(plId,planMonth,d,e);
      var eff=_planEffective(plId,planMonth,d,e);
      var tim=e&&e.timing?e.timing.debut+' \u2192 '+e.timing.fin+(e.timing.continu?' \u00b7 continu':''):'';
      h+='<button class="pl2-drow" onclick="planFicheOpenDay('+d+')">'
        +'<span class="pl2-drow-d"><span class="pl2-drow-n">'+d+'</span><span class="pl2-drow-w">'+PLAN_JOURS[_planDow(planMonth,d)]+'</span></span>'
        +'<span class="pl2-drow-mid"><span class="pl2-drow-l" style="color:'+st.c+'">'+st.l+'</span>'
          +(tim?'<span class="pl2-drow-t">\ud83d\udd50 '+tim+'</span>':'')
          +(e&&e.comment&&!e.absent?'<span class="pl2-drow-t">\ud83d\udcac '+_escHtml(e.comment)+'</span>':'')
          +(e&&e.absent&&e.comment?'<span class="pl2-drow-t">'+_escHtml(e.comment)+'</span>':'')
        +'</span>'
        // ⚠️ Ne JAMAIS reecrire un chiffre que _planEffective sait deja rendre :
        //   « 0h » etait pose en dur ici et contredisait le compteur du mois des
        //   qu'une absence etait assimilee a du travail effectif.
        +'<span class="pl2-drow-h" style="color:'+st.c+'">'+(e&&e.type==='recup'?'\u21ba':_planFmt(eff))+'</span>'
      +'</button>';
    });
    h+='<div class="pl2-note" style="margin-top:8px">\u270f\ufe0f Toucher un jour l\u2019ouvre dans la feuille \u2014 la grille compl\u00e8te est dans l\u2019onglet <b>Le mois</b>.</div>';
    h+=_coll?_planCollNote(mbr):_planLegalCard(mbr);
  }
  if(t==='cp'){
    var cpPris=_planCpPris(mbr.nom),cpSolde=_planCpSolde(mbr),cpIni=mbr.cp_initial_j||0;
    // ⚠️ Le mode de decompte et la periode de reference sont des reglages DU DOMAINE :
    //    ils se reglaient ici, dans la fiche d'UNE personne, ou les changer touchait
    //    tout le monde sans le dire. Ils vivent desormais dans l'onglet « Le cadre ».
    h='<div class="pl2-fstat">'
      +'<div class="pl2-fs"><span class="pl2-fs-v">'+cpIni+'</span><span class="pl2-fs-l">Solde initial (j)</span></div>'
      +'<div class="pl2-fs"><span class="pl2-fs-v" style="color:'+(cpPris>0?'var(--orange)':'var(--texte)')+'">'+cpPris+'</span><span class="pl2-fs-l">Pris (j)</span></div>'
      +'<div class="pl2-fs"><span class="pl2-fs-v" style="color:'+(cpSolde>5?'var(--vert-med)':cpSolde>=0?'var(--orange)':'var(--rouge)')+'">'+cpSolde+'</span><span class="pl2-fs-l">Restants (j)</span></div>'
    +'</div>'
    +'<div class="pl2-note">D\u00e9compte sur la p\u00e9riode <b>'+_planCpPeriodeLbl()+'</b>. Le solde initial se r\u00e8gle dans R\u00e9glages \u203a Membres, la r\u00e8gle de d\u00e9compte du domaine dans l\u2019onglet <b>Le cadre</b>.</div>';
  }
  if(t==='hsup')h=_planHsupCard(mbr);
  if(t==='ac')h=_planAcomptesCard(mbr,true);
  body.innerHTML=h;
}


// ── Les « Outils du planning » ont disparu ──
// Quatre entrees derriere un engrenage : deux sont devenues des boutons visibles
// au-dessus de la grille (conges et chaleur sur une periode), les modeles et le
// cadre legal ont leur onglet, les anciens salaries sont dans « Les gens ».

// ── HORAIRES CHALEUR — période + multi-salariés (remplace la carte par salarié) ──
var _pl2ChalSel={};
function openPlanChaleur(){
  if(!isAdmin())return;
  _pl2ChalSel={};
  _pl2Actifs().forEach(function(m){_pl2ChalSel[m.nom]=true;});
  _planChaleurRender();
  var ov=document.getElementById('ovPlanChaleur');
  if(ov)ov.classList.add('open');
  _planCaniculeFix();
  planCaniculeCalc();
}
function closePlanChaleur(){var ov=document.getElementById('ovPlanChaleur');if(ov)ov.classList.remove('open');}
function planChalMb(nom){_pl2ChalSel[nom]=!_pl2ChalSel[nom];_planChaleurRender();_planCaniculeFix();planCaniculeCalc();}
function _planChaleurRender(){
  var body=document.getElementById('pc-body');
  if(!body)return;
  var chk='<span id="planCanic-contchk" class="pl2-chal-chk'+(_planCanic.continu?' on':'')+'">'+(_planCanic.continu?'\u2713':'')+'</span>';
  var h='<div class="pl2-chal-dates">'
    +'<div class="pl2-chal-f"><span class="pl2-chal-lbl">Du</span><input type="date" id="planCanic-du" value="'+_planCanic.du+'" min="'+planYear+'-01-01" max="'+planYear+'-12-31" onchange="planCaniculeCalc()"></div>'
    +'<div class="pl2-chal-f"><span class="pl2-chal-lbl">Au</span><input type="date" id="planCanic-au" value="'+_planCanic.au+'" min="'+planYear+'-01-01" max="'+planYear+'-12-31" onchange="planCaniculeCalc()"></div>'
  +'</div>'
  +'<div class="pl2-chal-times">'
    +'<div class="pl2-chal-f"><span class="pl2-chal-lbl">D\u00e9but</span><input type="time" id="planCanic-deb" value="'+_planCanic.deb+'" onchange="planCaniculeCalc()"></div>'
    +'<span class="pl2-chal-arr">\u2192</span>'
    +'<div class="pl2-chal-f"><span class="pl2-chal-lbl">Fin</span><input type="time" id="planCanic-fin" value="'+_planCanic.fin+'" onchange="planCaniculeCalc()"></div>'
    +'<span class="pl2-chal-calc"><span id="planCanic-calc">'+_planFmt(_planTimingH(_planCanic.deb,_planCanic.fin,_planCanic.continu))+'</span><span id="planCanic-calcsub">'+(_planCanic.continu?'continu':'\u22121h pause')+'</span></span>'
  +'</div>'
  +'<button onclick="planCaniculeToggleContinu()" id="planCanic-contbtn" class="pl2-chal-cont'+(_planCanic.continu?' active':'')+'">'
    +chk
    +'<span class="pl2-chal-cont-t"><span id="planCanic-contlbl" style="color:'+(_planCanic.continu?'var(--orange)':'var(--texte-doux)')+'">Journ\u00e9e continue</span><span>Pas de coupure d\u00e9jeuner \u00b7 journ\u00e9e d\u2019un seul tenant d\u00e9duite</span></span>'
  +'</button>'
  +'<div class="plan-sec-lbl" style="margin-top:4px">Salari\u00e9s concern\u00e9s</div>'
  +'<div class="pl2-chal-mbrs">';
  _pl2Actifs().forEach(function(m){
    var on=!!_pl2ChalSel[m.nom];
    h+='<button class="pl2-ms'+(on?' on':'')+'" onclick="planChalMb(\''+_escAttr(m.nom)+'\')"><span class="pl2-ava" style="background:'+(m.couleur||'#3D6B27')+'">'+_escHtml(m.nom.charAt(0))+'</span>'+_escHtml(m.nom)+(_planHasCanicule(m.nom)?' \ud83c\udf21':'')+'</button>';
  });
  h+='</div>'
  +'<div class="pl2-note" style="border-color:rgba(217,119,6,0.4);color:var(--orange)">\u2139\ufe0f Appliqu\u00e9 du lundi au vendredi, uniquement sur les jours travaill\u00e9s. Cong\u00e9s, r\u00e9cup et absences sont conserv\u00e9s. \u00ab\u00a0Retirer\u00a0\u00bb ne touche que les jours marqu\u00e9s chaleur.</div>';
  body.innerHTML=h;
}
function _planChalNoms(){return Object.keys(_pl2ChalSel).filter(function(n){return _pl2ChalSel[n];});}
function planChalApply(){
  var noms=_planChalNoms();
  if(!noms.length){showToast('S\u00e9lectionnez au moins un salari\u00e9','#E07060');return;}
  planCaniculeReadInputs();
  noms.forEach(function(n){planCaniculeApply(n);});
  if(noms.length>1)showToast('\ud83c\udf21 Horaires chaleur appliqu\u00e9s \u00b7 '+noms.length+' salari\u00e9s','#D97706');
  closePlanChaleur();
  _pl2Refresh();
}
function planChalRemove(){
  var noms=_planChalNoms();
  if(!noms.length){showToast('S\u00e9lectionnez au moins un salari\u00e9','#E07060');return;}
  noms.forEach(function(n){planCaniculeRemove(n);});
  if(noms.length>1)showToast('Horaires chaleur retir\u00e9s \u00b7 '+noms.length+' salari\u00e9s','#D97706');
  closePlanChaleur();
  _pl2Refresh();
}

// ── POSER DES CONGÉS — période + multi-salariés ──
var _pl2CpSel={};
var _pl2CpDates={du:'',au:''};
function _cpIso(d){var m=d.getMonth()+1,j=d.getDate();return d.getFullYear()+'-'+(m<10?'0'+m:m)+'-'+(j<10?'0'+j:j);}
function _planCpMode(){return((window.CONFIG&&window.CONFIG.cp_mode)==='ouvres')?'ouvres':'ouvrables';}
// openPlanCP(fromSel) — unique point d'entree pour les deux modes de conges.
// Sans argument : mode PERIODE — plage de dates, tous les actifs preselectes.
// fromSel=true : mode SELECTION — cases cochees dans la grille (ex-openPlanCPSel).
// Les deux partagent l'overlay ovPlanCP depuis le lot §19a ; _pl2CpFromSel pilotait
// deja le branchement interne — on le rend simplement explicite ici plutot que d'avoir
// deux fonctions d'entree pour le meme overlay.
function openPlanCP(fromSel){
  if(!isAdmin())return;
  if(fromSel && !Object.keys(_pl2Sel).length){showToast('Touchez d\u2019abord des cases dans la grille','#E07060');return;}
  _pl2CpFromSel=!!fromSel; _pl2CpSelData=null; _planCpHdr(null,null,null);
  if(!fromSel){
    _pl2CpSel={};
    _pl2Actifs().forEach(function(m){_pl2CpSel[m.nom]=true;});
    var t=new Date();
    if(t.getFullYear()===planYear){
      var dow=t.getDay(), off=(dow===0?-6:1-dow);
      var mon=new Date(t); mon.setDate(t.getDate()+off);
      var fri=new Date(mon); fri.setDate(mon.getDate()+4);
      _pl2CpDates.du=_cpIso(mon); _pl2CpDates.au=_cpIso(fri);
    } else {
      _pl2CpDates.du=planYear+'-'+String(planMonth+1).padStart(2,'0')+'-01';
      _pl2CpDates.au=_pl2CpDates.du;
    }
    _planCPRender();
  } else {
    _planCPRenderSel();
  }
  var ov=document.getElementById('ovPlanCP');
  if(ov)ov.classList.add('open');
}
function closePlanCP(){
  var ov=document.getElementById('ovPlanCP');if(ov)ov.classList.remove('open');
  if(_pl2CpFromSel){_pl2CpFromSel=false;_pl2CpSelData=null;_planCpHdr(null,null,null);}
}

// ── CONGÉS DEPUIS LA SÉLECTION MULTIPLE (réutilise l'overlay ovPlanCP) ──
// Même overlay, deux sources de jours : une PÉRIODE continue (Du→Au, tous salariés) ou
// l'ENSEMBLE ARBITRAIRE de cases cochées dans la grille. Le classement des jours et le
// décompte sont les mêmes fonctions dans les deux cas (_planCpDayType / _planCpCount) :
// c'est tout l'objet de ce lot. _pl2CpFromSel dit seulement d'où viennent les jours.
var _pl2CpFromSel=false;
var _pl2CpSelData=null;   // [{mbr,plId,cells,marked,count}] recalculé à chaque rendu
var _pl2CpHdrSave=null;   // libellés d'origine de l'en-tête, restaurés à la fermeture

// Réécrit l'en-tête et le bouton d'action de la feuille ; (null,null,null) = restaure.
function _planCpHdr(titre,sous,btn){
  var ov=document.getElementById('ovPlanCP'); if(!ov)return;
  var d=ov.querySelector('.pl2-ed-d'), s=ov.querySelector('.pl2-ed-s'), b=ov.querySelector('.pl2-ed-heat');
  if(!_pl2CpHdrSave)_pl2CpHdrSave={d:d?d.innerHTML:'',s:s?s.innerHTML:'',b:b?b.innerHTML:''};
  if(d)d.innerHTML=(titre===null)?_pl2CpHdrSave.d:titre;
  if(s)s.innerHTML=(sous===null)?_pl2CpHdrSave.s:sous;
  if(b)b.innerHTML=(btn===null)?_pl2CpHdrSave.b:btn;
}

// Regroupe les cases cochées par salarié et classe chaque jour.
// La grille équipe n'affiche qu'un mois : toutes les cases sont dans planMonth/planYear.
function _planCpSelBuild(){
  var mode=_planCpMode(), byNom={};
  Object.keys(_pl2Sel).forEach(function(k){
    var i=k.lastIndexOf('|'), nom=k.slice(0,i), d=parseInt(k.slice(i+1),10);
    if(isNaN(d))return;
    (byNom[nom]=byNom[nom]||[]).push(d);
  });
  var out=[];
  Object.keys(byNom).sort().forEach(function(nom){
    var mbr=(window.MEMBRES||[]).find(function(x){return x.nom===nom;});
    if(!mbr)return;
    var plId=_planPlId(mbr), cells=[], marked=[];
    byNom[nom].sort(function(a,b){return a-b;}).forEach(function(d){
      var c=_planCpDayType(mbr,plId,planYear,planMonth,d);
      cells.push(c);
      if(c.type==='cp')marked.push(c);
    });
    out.push({mbr:mbr,plId:plId,cells:cells,marked:marked,count:_planCpCount(plId,marked,mode)});
  });
  return out;
}

function _planCPRenderSel(){
  var body=document.getElementById('plancp-body'); if(!body)return;
  var mode=_planCpMode();
  var modeLbl=mode==='ouvres'?'jours ouvr\u00e9s (5/sem)':'jours ouvrables (6/sem)';
  _pl2CpSelData=_planCpSelBuild();
  var total=0, nCells=0, ign=0, rows='';
  _pl2CpSelData.forEach(function(r){
    total+=r.count; nCells+=r.cells.length;
    var strip='';
    r.cells.forEach(function(c){
      if(c.type!=='cp')ign++;
      var bg='#efece3',col='var(--texte-doux)',bd='var(--gris-clair)',txt=c.d,ti='';
      if(c.type==='cp'){bg='var(--orange)';col='#fff';bd='var(--orange)';ti='Cong\u00e9 pos\u00e9';}
      else if(c.type==='fer'){bg='var(--or)';col='#3a2f10';bd='#b8912f';txt='F';ti='F\u00e9ri\u00e9 ch\u00f4m\u00e9 \u2014 non d\u00e9compt\u00e9';}
      else if(c.type==='we'){bg='#efece3';col='var(--texte-doux)';bd='var(--gris-clair)';ti=(c.dow===0?'Dimanche':'Samedi de repos')+' \u2014 non d\u00e9compt\u00e9';}
      else if(c.type==='out'){bg='transparent';col='#c9c4b8';bd='transparent';txt='\u00b7';ti='Hors contrat';}
      strip+='<span title="'+_escAttr(ti)+'" style="min-width:15px;height:17px;border-radius:4px;font-size:8px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;padding:0 1px;background:'+bg+';color:'+col+';border:1px solid '+bd+'">'+txt+'</span>';
    });
    rows+='<div style="display:flex;align-items:center;gap:7px;padding:5px 0;border-top:1px dashed var(--gris-clair)">'
      +'<span style="width:20px;height:20px;border-radius:50%;background:'+(r.mbr.couleur||'#3D6B27')+';color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex:0 0 auto">'+_escHtml(r.mbr.nom.charAt(0))+'</span>'
      +'<span style="font-size:12px;font-weight:700;width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:0 0 auto">'+_escHtml(r.mbr.nom)+'</span>'
      +'<span style="display:flex;gap:2px;flex-wrap:wrap;flex:1">'+strip+'</span>'
      +'<span style="font-size:11.5px;font-weight:800;color:var(--orange);min-width:32px;text-align:right;flex:0 0 auto">'+r.count+'\u00a0j</span>'
    +'</div>';
  });
  var head='<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px">'
    +'<span style="font-size:20px;font-weight:800;color:var(--orange)">'+total+'<span style="font-size:11px;font-weight:700;color:var(--texte-doux)">\u00a0j d\u00e9compt\u00e9s</span></span>'
    +'<span style="font-size:11px;color:var(--texte-doux);text-align:right">'+_pl2CpSelData.length+' salari\u00e9'+(_pl2CpSelData.length>1?'s':'')+' \u00b7 '+nCells+' case'+(nCells>1?'s':'')+'</span></div>';
  var h='<div class="pl2-note" style="border-color:rgba(217,119,6,0.35);color:var(--orange)">D\u00e9compte du domaine\u00a0: <b>'+modeLbl+'</b> \u00b7 modifiable dans R\u00e9glages \u203a Membres. Dimanches, f\u00e9ri\u00e9s et samedis de repos ne sont jamais d\u00e9compt\u00e9s\u00a0\u2014 ils sont ignor\u00e9s m\u00eame s\u2019ils sont coch\u00e9s.</div>'
    +'<div class="plan-sec-lbl" style="margin-top:8px">Aper\u00e7u de la s\u00e9lection</div>';
  if(!_pl2CpSelData.length){
    h+='<div style="font-size:12.5px;color:var(--texte-doux);text-align:center;padding:12px">Aucun salari\u00e9 reconnu dans la s\u00e9lection.</div>';
  } else {
    h+='<div style="background:var(--bg-app);border:1px solid var(--gris-clair);border-radius:12px;padding:10px 11px">'+head+rows+'</div>';
    if(ign>0)h+='<div class="pl2-note" style="margin-top:8px">\u2139\ufe0f '+ign+' case'+(ign>1?'s':'')+' de la s\u00e9lection ne '+(ign>1?'seront':'sera')+' pas pos\u00e9e'+(ign>1?'s':'')+' (dimanche, f\u00e9ri\u00e9, samedi de repos ou hors contrat). Survolez une case grise pour la raison.</div>';
    if(mode!=='ouvres')h+='<div class="pl2-note" style="margin-top:8px">Un vendredi pos\u00e9 entra\u00eene automatiquement le samedi de repos suivant dans le d\u00e9compte, sans occuper la case.</div>';
    h+='<div class="pl2-note" style="margin-top:8px">Les jours d\u00e9j\u00e0 en r\u00e9cup\u00e9ration ou en absence sont pr\u00e9serv\u00e9s.</div>';
  }
  body.innerHTML=h;
  _planCpHdr('\ud83c\udfd6\ufe0f Poser des cong\u00e9s','Depuis la s\u00e9lection \u00b7 '+PLAN_MOIS[planMonth]+' '+planYear,'\ud83c\udfd6\ufe0f Poser '+total+'\u00a0j');
}

// Pose depuis la sélection — écrit UNIQUEMENT les jours classés 'cp'.
function _planCpApplySel(){
  var data=_pl2CpSelData||_planCpSelBuild();
  var totJ=0, nMbr=0, prot=0, _sv=_planCtxYear;
  data.forEach(function(r){
    if(!r.marked.length)return;
    var posed=0;
    r.marked.forEach(function(mk){
      _planCtxYear=mk.yr;
      var ex=_pEntDay(r.mbr.nom,mk.mi,mk.d);
      if(ex&&(ex.type==='recup'||ex.absent)){_planCtxYear=_sv;prot++;return;}
      _pEntEnsure(r.mbr.nom,mk.mi)[mk.d]={type:'cp',heures:mk.pl};
      _planCtxYear=_sv;
      posed++;
    });
    if(posed>0){nMbr++;totJ+=r.count;}
  });
  _planCtxYear=_sv;
  window.PLANNING_ENTRIES=PLANNING_ENTRIES;
  if(nMbr>0&&window.fbSave)window.fbSave('planning_entries',PLANNING_ENTRIES);
  closePlanCP();
  planSelClear();
  showToast(nMbr>0?('\u2705 Cong\u00e9s pos\u00e9s \u00b7 '+nMbr+' salari\u00e9'+(nMbr>1?'s':'')+' \u00b7 '+totJ+'\u00a0j d\u00e9compt\u00e9'+(totJ>1?'s':'')+(prot>0?' \u00b7 '+prot+' pr\u00e9serv\u00e9'+(prot>1?'s':''):'')):'Aucun jour d\u00e9comptable dans la s\u00e9lection',nMbr>0?'#3D6B27':'#E07060');
  _pl2Refresh();
}

// Retrait depuis la sélection — balaye TOUTES les cases cochées, pas seulement les 'cp' :
// un congé mal posé avant ce lot (samedi, dimanche) doit pouvoir être retiré ici.
function _planCpRemoveSel(){
  var nJ=0, nMbr=0;
  var byNom={};
  Object.keys(_pl2Sel).forEach(function(k){
    var i=k.lastIndexOf('|'), nom=k.slice(0,i), d=parseInt(k.slice(i+1),10);
    if(isNaN(d))return;
    (byNom[nom]=byNom[nom]||[]).push(d);
  });
  Object.keys(byNom).forEach(function(nom){
    var hit=0;
    byNom[nom].forEach(function(d){
      var e=_pEntDay(nom,planMonth,d);
      if(e&&e.type==='cp'){delete _pEntEnsure(nom,planMonth)[d];hit++;}
    });
    if(hit>0){nMbr++;nJ+=hit;}
  });
  window.PLANNING_ENTRIES=PLANNING_ENTRIES;
  if(nJ>0&&window.fbSave)window.fbSave('planning_entries',PLANNING_ENTRIES);
  closePlanCP();
  planSelClear();
  showToast(nJ>0?('Cong\u00e9s retir\u00e9s \u00b7 '+nMbr+' salari\u00e9'+(nMbr>1?'s':'')+' \u00b7 '+nJ+'\u00a0j'):'Aucun cong\u00e9 dans la s\u00e9lection',nJ>0?'#D97706':'#E07060');
  _pl2Refresh();
}
function planCpMb(nom){_pl2CpSel[nom]=!_pl2CpSel[nom];_planCPRender();}
function _planCpReadInputs(){
  var du=(document.getElementById('plancp-du')||{}).value; if(du)_pl2CpDates.du=du;
  var au=(document.getElementById('plancp-au')||{}).value; if(au)_pl2CpDates.au=au;
}
function _planCpNoms(){return Object.keys(_pl2CpSel).filter(function(n){return _pl2CpSel[n];});}
// ── CLASSEMENT D'UN JOUR POUR LES CONGÉS — SOURCE UNIQUE ──
// Partagée par les DEUX chemins de pose : « période » (Outils › Poser des congés) et
// « sélection multiple » (bouton CP de la barre d'actions de la grille équipe).
// ⚠️ Avant ce lot, la sélection multiple écrivait {type:'cp'} sur chaque case cochée SANS
//    aucun filtre calendaire : un samedi de repos se retrouvait décompté par _planCpPris
//    (le skip dow===6 n'existe qu'en mode 'ouvres'), et un dimanche ou un férié s'affichait
//    en congé orange sans bouger le solde. Deux chemins d'écriture, une seule règle connue.
//    Toute nouvelle voie de pose DOIT passer par ici, sinon la divergence revient.
// Renvoie 'out' (hors contrat) | 'we' (dimanche, ou samedi de repos) | 'fer' (férié chômé) | 'cp'.
// ⚠️ _planCtxYear est positionné le temps du calcul puis RESTAURÉ : _planInContract,
//    _planFerie et _planPlanned lisent tous l'année de contexte via _pY().
function _planCpDayType(mbr,plId,yr,mi,d){
  var _sv=_planCtxYear; _planCtxYear=yr;
  var dow=new Date(yr,mi,d).getDay();
  var inC=_planInContract(mbr,mi,d), fer=_planFerie(mi,d), pl=_planPlanned(plId,mi,d);
  _planCtxYear=_sv;
  var type;
  if(!inC)type='out';
  else if(dow===0)type='we';            // dimanche : jamais un jour de congé
  else if(fer)type='fer';               // férié chômé payé : jamais décompté
  else if(dow===6&&pl<=0)type='we';     // samedi de repos : décompté par la règle du samedi auto, pas posé
  else type='cp';
  return {dow:dow,mi:mi,d:d,yr:yr,type:type,pl:pl};
}
// Décompte d'un ensemble de jours marqués — même règle que _planCpPris, appliquée en amont
// pour que l'aperçu affiche EXACTEMENT ce que le compteur affichera après la pose.
function _planCpCount(plId,marked,mode){
  var _sv=_planCtxYear, count=0;
  marked.forEach(function(mk){
    if(mode==='ouvres'){ if(mk.dow>=1&&mk.dow<=5)count++; }
    else { if(mk.dow>=1&&mk.dow<=6)count++; }
  });
  // Samedi automatique (mode ouvrables) : un vendredi posé entraîne le samedi de repos suivant.
  if(mode!=='ouvres'){
    marked.forEach(function(mk){
      if(mk.dow!==5)return;
      var sat=new Date(mk.yr,mk.mi,mk.d+1), sy=sat.getFullYear(), sm=sat.getMonth(), sd=sat.getDate();
      if(marked.some(function(x){return x.yr===sy&&x.mi===sm&&x.d===sd;}))return;
      _planCtxYear=sy; var sfer=_planFerie(sm,sd), spl=_planPlanned(plId,sm,sd); _planCtxYear=_sv;
      if(sfer||spl>0)return;
      count++;
    });
    _planCtxYear=_sv;
  }
  return count;
}
// Planifie les jours de congé d'un salarié sur [du..au] + décompte fidèle à _planCpPris (mode courant)
function _planCpPlan(mbr,du,au){
  var a=new Date(du+'T00:00:00'), b=new Date(au+'T00:00:00');
  if(isNaN(a.getTime())||isNaN(b.getTime())||a>b)return null;
  var plId=_planPlId(mbr), mode=_planCpMode();
  var cells=[], marked=[], cur=new Date(a), guard=0;
  while(cur<=b&&guard<420){
    guard++;
    var c=_planCpDayType(mbr,plId,cur.getFullYear(),cur.getMonth(),cur.getDate());
    cells.push(c);
    if(c.type==='cp')marked.push(c);
    cur.setDate(cur.getDate()+1);
  }
  return {cells:cells, marked:marked, count:_planCpCount(plId,marked,mode)};
}
function _planCPRender(){
  var body=document.getElementById('plancp-body');
  if(!body)return;
  var mode=_planCpMode();
  var modeLbl=mode==='ouvres'?'jours ouvr\u00e9s (5/sem)':'jours ouvrables (6/sem)';
  var h='<div class="pl2-chal-dates">'
    +'<div class="pl2-chal-f"><span class="pl2-chal-lbl">Du</span><input type="date" id="plancp-du" value="'+_pl2CpDates.du+'" min="'+planYear+'-01-01" max="'+planYear+'-12-31" onchange="_planCpOnDate()"></div>'
    +'<div class="pl2-chal-f"><span class="pl2-chal-lbl">Au</span><input type="date" id="plancp-au" value="'+_pl2CpDates.au+'" min="'+planYear+'-01-01" max="'+planYear+'-12-31" onchange="_planCpOnDate()"></div>'
  +'</div>'
  +'<div class="pl2-note" style="margin-top:2px;border-color:rgba(217,119,6,0.35);color:var(--orange)">D\u00e9compte du domaine\u00a0: <b>'+modeLbl+'</b> \u00b7 modifiable dans R\u00e9glages \u203a Membres. Dimanches et jours f\u00e9ri\u00e9s ne sont jamais d\u00e9compt\u00e9s.</div>'
  +'<div class="plan-sec-lbl" style="margin-top:4px">Salari\u00e9s concern\u00e9s</div>'
  +'<div class="pl2-chal-mbrs">';
  _pl2Actifs().forEach(function(m){
    var on=!!_pl2CpSel[m.nom];
    h+='<button class="pl2-ms'+(on?' on':'')+'" onclick="planCpMb(\''+_escAttr(m.nom)+'\')"><span class="pl2-ava" style="background:'+(m.couleur||'#3D6B27')+'">'+_escHtml(m.nom.charAt(0))+'</span>'+_escHtml(m.nom)+'</button>';
  });
  h+='</div>'
    +'<div class="plan-sec-lbl" style="margin-top:8px">Aper\u00e7u</div>'
    +'<div id="plancp-prev"></div>';
  body.innerHTML=h;
  _planCpPreview();
}
function _planCpOnDate(){_planCpReadInputs();_planCpPreview();}
function _planCpPreview(){
  var box=document.getElementById('plancp-prev'); if(!box)return;
  _planCpReadInputs();
  var du=_pl2CpDates.du, au=_pl2CpDates.au, noms=_planCpNoms();
  if(!du||!au||new Date(du+'T00:00:00')>new Date(au+'T00:00:00')){box.innerHTML='<div style="font-size:12.5px;color:var(--texte-doux);text-align:center;padding:12px">Choisissez une p\u00e9riode valide (Du \u2264 Au).</div>';return;}
  if(!noms.length){box.innerHTML='<div style="font-size:12.5px;color:var(--texte-doux);text-align:center;padding:12px">S\u00e9lectionnez au moins un salari\u00e9.</div>';return;}
  var rows='', total=0, fer=0;
  noms.forEach(function(nom){
    var mbr=(window.MEMBRES||[]).find(function(x){return x.nom===nom;}); if(!mbr)return;
    var r=_planCpPlan(mbr,du,au); if(!r)return;
    total+=r.count;
    var strip='';
    r.cells.forEach(function(c){
      var bg='#efece3',col='var(--texte-doux)',bd='var(--gris-clair)',txt=c.d;
      if(c.type==='cp'){bg='var(--orange)';col='#fff';bd='var(--orange)';}
      else if(c.type==='fer'){bg='var(--or)';col='#3a2f10';bd='#b8912f';txt='F';fer++;}
      else if(c.type==='out'){bg='transparent';col='#c9c4b8';bd='transparent';txt='\u00b7';}
      strip+='<span style="min-width:15px;height:17px;border-radius:4px;font-size:8px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;padding:0 1px;background:'+bg+';color:'+col+';border:1px solid '+bd+'">'+txt+'</span>';
    });
    rows+='<div style="display:flex;align-items:center;gap:7px;padding:5px 0;border-top:1px dashed var(--gris-clair)">'
      +'<span style="width:20px;height:20px;border-radius:50%;background:'+(mbr.couleur||'#3D6B27')+';color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex:0 0 auto">'+_escHtml(mbr.nom.charAt(0))+'</span>'
      +'<span style="font-size:12px;font-weight:700;width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:0 0 auto">'+_escHtml(mbr.nom)+'</span>'
      +'<span style="display:flex;gap:2px;flex-wrap:wrap;flex:1">'+strip+'</span>'
      +'<span style="font-size:11.5px;font-weight:800;color:var(--orange);min-width:32px;text-align:right;flex:0 0 auto">'+r.count+'\u00a0j</span>'
    +'</div>';
  });
  var head='<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px">'
    +'<span style="font-size:20px;font-weight:800;color:var(--orange)">'+total+'<span style="font-size:11px;font-weight:700;color:var(--texte-doux)">\u00a0j au total</span></span>'
    +'<span style="font-size:11px;color:var(--texte-doux);text-align:right">'+noms.length+' salari\u00e9'+(noms.length>1?'s':'')+'</span></div>';
  var note=fer>0?'<div class="pl2-note" style="margin-top:8px">\u2139\ufe0f Jour(s) f\u00e9ri\u00e9(s) dans la plage \u2014 non d\u00e9compt\u00e9(s) (jour ch\u00f4m\u00e9 pay\u00e9).</div>':'';
  box.innerHTML='<div style="background:var(--bg-app);border:1px solid var(--gris-clair);border-radius:12px;padding:10px 11px">'+head+rows+'</div>'+note;
}
function planCpApply(){
  if(!isAdmin())return;
  if(_pl2CpFromSel){_planCpApplySel();return;}
  _planCpReadInputs();
  var du=_pl2CpDates.du, au=_pl2CpDates.au, noms=_planCpNoms();
  if(!du||!au||new Date(du+'T00:00:00')>new Date(au+'T00:00:00')){showToast('Choisissez une plage de dates valide','#E07060');return;}
  if(!noms.length){showToast('S\u00e9lectionnez au moins un salari\u00e9','#E07060');return;}
  var totJ=0, nMbr=0, _sv=_planCtxYear;
  noms.forEach(function(nom){
    var mbr=(window.MEMBRES||[]).find(function(x){return x.nom===nom;}); if(!mbr)return;
    var r=_planCpPlan(mbr,du,au); if(!r||!r.marked.length)return;
    var posed=0;
    r.marked.forEach(function(mk){
      _planCtxYear=mk.yr;
      var ex=_pEntDay(nom,mk.mi,mk.d);
      if(ex&&(ex.type==='recup'||ex.absent)){_planCtxYear=_sv;return;}
      _pEntEnsure(nom,mk.mi)[mk.d]={type:'cp',heures:mk.pl};
      _planCtxYear=_sv;
      posed++;
    });
    if(posed>0){nMbr++;totJ+=r.count;}
  });
  _planCtxYear=_sv;
  window.PLANNING_ENTRIES=PLANNING_ENTRIES;
  if(nMbr>0&&window.fbSave)window.fbSave('planning_entries',PLANNING_ENTRIES);
  closePlanCP();
  showToast(nMbr>0?('\u2705 Cong\u00e9s pos\u00e9s \u00b7 '+nMbr+' salari\u00e9'+(nMbr>1?'s':'')+' \u00b7 '+totJ+' j'):'Aucun jour applicable dans la plage',nMbr>0?'#3D6B27':'#E07060');
  _pl2Refresh();
}
function planCpRemove(){
  if(!isAdmin())return;
  if(_pl2CpFromSel){_planCpRemoveSel();return;}
  _planCpReadInputs();
  var du=_pl2CpDates.du, au=_pl2CpDates.au, noms=_planCpNoms();
  if(!du||!au||new Date(du+'T00:00:00')>new Date(au+'T00:00:00')){showToast('Choisissez une plage de dates valide','#E07060');return;}
  if(!noms.length){showToast('S\u00e9lectionnez au moins un salari\u00e9','#E07060');return;}
  var a=new Date(du+'T00:00:00'), b=new Date(au+'T00:00:00'), nJ=0, nMbr=0, _sv=_planCtxYear;
  noms.forEach(function(nom){
    var cur=new Date(a), guard=0, hit=0;
    while(cur<=b&&guard<420){
      guard++;
      var mi=cur.getMonth(), d=cur.getDate(), yr=cur.getFullYear();
      _planCtxYear=yr;
      var e=_pEntDay(nom,mi,d);
      if(e&&e.type==='cp'){delete _pEntEnsure(nom,mi)[d];hit++;}
      _planCtxYear=_sv;
      cur.setDate(cur.getDate()+1);
    }
    if(hit>0){nMbr++;nJ+=hit;}
  });
  _planCtxYear=_sv;
  window.PLANNING_ENTRIES=PLANNING_ENTRIES;
  if(nJ>0&&window.fbSave)window.fbSave('planning_entries',PLANNING_ENTRIES);
  closePlanCP();
  showToast(nJ>0?('Cong\u00e9s retir\u00e9s \u00b7 '+nMbr+' salari\u00e9'+(nMbr>1?'s':'')+' \u00b7 '+nJ+' j'):'Aucun cong\u00e9 dans la plage',nJ>0?'#D97706':'#E07060');
  _pl2Refresh();
}

// ── ANCIENS SALARIÉS (overlay) ──
// ── ONGLET « LE CADRE » (admin) — ce qui se regle une fois par an ──
function _planRenderCadre(){
  var body=document.getElementById('plan-body');
  if(!body)return;
  if(_planEditing){_planRenderGridEditor();return;}

  var all=Object.assign({},PLAN_DEF,_pTplStore());
  var ids=Object.keys(all);
  var curPause=window.PLAN_PAUSE_MIN||PLAN_PAUSE_MIN||60;
  var curCoup=_planCoupureH();
  var curCoupFixe=!!(curCoup&&curCoup!=='libre');
  var html='<div class="plan-sec-lbl">R\u00e9glage coupure d\u00e9jeuner</div>'
    +'<div class="plan-card" style="flex-direction:column;gap:10px">'
      +'<div style="font-size:13px;color:var(--texte-doux);line-height:1.5">D\u00e9duite des journ\u00e9es de 6\u00a0h ou plus, hors horaire continu. Elle n\u2019est pas du temps de travail.</div>'
      +'<div style="display:flex;gap:0;border:1px solid var(--gris-clair);border-radius:10px;overflow:hidden">'
        +'<button id="plan-pause-30" onclick="planSavePause(30)" style="flex:1;padding:9px 4px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all .15s;background:'+(curPause===30?'#2D6A27':'transparent')+';color:'+(curPause===30?'white':'var(--texte-doux)')+'">30 min</button>'
        +'<button id="plan-pause-60" onclick="planSavePause(60)" style="flex:1;padding:9px 4px;font-size:13px;font-weight:600;border:none;border-left:1px solid var(--gris-clair);border-right:1px solid var(--gris-clair);cursor:pointer;transition:all .15s;background:'+(curPause===60?'#2D6A27':'transparent')+';color:'+(curPause===60?'white':'var(--texte-doux)')+'">1 h</button>'
        +'<button id="plan-pause-120" onclick="planSavePause(120)" style="flex:1;padding:9px 4px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all .15s;background:'+(curPause===120?'#2D6A27':'transparent')+';color:'+(curPause===120?'white':'var(--texte-doux)')+'">2 h</button>'
      +'</div>'
      // Le QUAND. Sans lui, « 1 h de coupure » laisse croire au salarie qu'il
      // choisit son moment ; avec lui, la journee se lit sans interpretation.
      +'<div style="font-size:13px;color:var(--texte-doux);line-height:1.5;margin-top:2px">\u00c0 quelle heure\u00a0?</div>'
      +'<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'
        +'<input type="time" id="plan-coup-h" value="'+(curCoupFixe?curCoup:'')+'" onchange="planSaveCoupureH()" style="font-family:inherit;font-size:14px;padding:9px 10px;border:1.5px solid var(--gris-clair);border-radius:10px;background:var(--bg-card);color:var(--texte);outline:none">'
        +'<button onclick="planSaveCoupure(\'libre\')" style="padding:9px 12px;font-size:13px;font-weight:600;border:1.5px solid '+(curCoup==='libre'?'#2D6A27':'var(--gris-clair)')+';border-radius:10px;cursor:pointer;background:'+(curCoup==='libre'?'#2D6A27':'transparent')+';color:'+(curCoup==='libre'?'white':'var(--texte-doux)')+'">Selon le chantier</button>'
        +(curCoup?'<button onclick="planSaveCoupure(\'\')" style="padding:9px 10px;font-size:12px;border:none;background:none;color:var(--texte-doux);cursor:pointer;text-decoration:underline">Effacer</button>':'')
      +'</div>'
      +'<div style="font-size:12px;color:var(--texte-doux);line-height:1.5">'
        +(curCoupFixe?('Les journ\u00e9es s\u2019afficheront coup\u00e9es\u00a0: 09:00\u2009\u2192\u2009'+curCoup+' puis reprise jusqu\u2019\u00e0 la fin de service.')
         :(curCoup==='libre'?'Les documents indiqueront que la coupure est prise selon le chantier.'
         :'Non renseign\u00e9\u00a0: seule la dur\u00e9e de coupure sera indiqu\u00e9e, sans l\u2019heure.'))
      +'</div>'
    +'</div>';
  // ── Cadre légal (config admin) ──
  var _L=_planLegal();
  var _isCuma=(_L.hebdoLeg===35&&Math.abs(_L.mensLeg-151.67)<0.01&&_L.maxHebdo===48&&_L.maxMoy===44&&_L.maxJour===10);
  html+='<div class="plan-sec-lbl" style="margin-top:8px">Cadre l\u00e9gal \u2014 dur\u00e9es \u00e0 ne pas d\u00e9passer</div>'
    +'<div class="plan-card" style="flex-direction:column;gap:10px;align-items:stretch">'
      +'<select id="plan-leg-preset" onchange="planLegalPreset(this.value)" style="width:100%;font-family:inherit;font-size:14px;padding:10px;border:1.5px solid var(--gris-clair);border-radius:10px;background:var(--bg-card);color:var(--texte);outline:none">'
        +'<option value="cuma"'+(_isCuma?' selected':'')+'>Production Agricole et CUMA \u2014 IDCC 7024</option>'
        +'<option value="custom"'+(_isCuma?'':' selected')+'>Personnalis\u00e9</option>'
      +'</select>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">'
        +_planLegInput('plan-leg-hebdo','Dur\u00e9e l\u00e9gale hebdo.',_L.hebdoLeg,'0.5')
        +_planLegInput('plan-leg-mens','L\u00e9gale mensuelle',_L.mensLeg,'0.01')
        +_planLegInput('plan-leg-maxh','Max. hebdo. (absolu)',_L.maxHebdo,'1')
        +_planLegInput('plan-leg-maxm','Max. hebdo. (moy. 12 sem.)',_L.maxMoy,'1')
        +_planLegInput('plan-leg-maxj','Max. quotidien',_L.maxJour,'0.5')
        +_planLegInput('plan-leg-annu','Dur\u00e9e annuelle (annualisation)',_L.plafAnnuel,'1')
        +_planLegInput('plan-leg-modul','Max. heures de modulation / an',_L.modulMax,'10')
      +'</div>'
      +'<button class="plan-btn-saisir" style="width:100%" onclick="planSaveLegal()">Enregistrer le cadre l\u00e9gal</button>'
      +'<div style="font-size:11px;color:var(--texte-doux);line-height:1.5">D\u00e9fauts = convention nationale Production Agricole et CUMA. Modifiez les valeurs pour la convention collective d\'un autre domaine.</div>'
    +'</div>';
  // ── Congés du domaine : règle de décompte et période de référence ──
  // ⚠️ Ces deux réglages vivaient dans la fiche d'UN salarié (onglet Congés), où les
  //    changer touchait TOUT LE MONDE sans que rien ne le dise. Ce sont des réglages
  //    du domaine : ils sont ici, avec les autres.
  var _cpMode=((window.CONFIG&&window.CONFIG.cp_mode)==='ouvres')?'ouvres':'ouvrables';
  var _cpMd=_planCpMoisDebut();
  var _cpSeg='flex:1;padding:9px 6px;border:1.5px solid;border-radius:10px;font-size:12.5px;font-weight:700;cursor:pointer;text-align:center;font-family:inherit;line-height:1.2';
  var _cpOn='background:var(--vert-med,#3D6B27);color:#fff;border-color:var(--vert-med,#3D6B27)';
  var _cpOff='background:transparent;color:var(--texte-doux,#6b7280);border-color:var(--gris,#d1d5db)';
  var _cpHint=_cpMode==='ouvres'?'Une semaine pos\u00e9e = 5 jours (lun\u2192ven). R\u00e9f\u00e9rence\u00a0: 25\u00a0j/an. Ce mode ne doit pas l\u00e9ser le salari\u00e9 par rapport aux jours ouvrables.':'Une semaine pos\u00e9e = 6 jours (samedi inclus, m\u00eame non travaill\u00e9). R\u00e9f\u00e9rence\u00a0: 30\u00a0j/an. Poser un vendredi d\u00e9compte le samedi suivant.';
  html+='<div class="plan-sec-lbl" style="margin-top:8px">Cong\u00e9s pay\u00e9s \u2014 d\u00e9compte du domaine</div>'
    +'<div class="plan-card" style="flex-direction:column;gap:10px;align-items:stretch">'
      +'<div style="display:flex;gap:8px">'
        +'<div id="pl-cpmode-ouvrables" onclick="planSetCpMode(\'ouvrables\')" style="'+_cpSeg+';'+(_cpMode==='ouvrables'?_cpOn:_cpOff)+'">6 jours ouvrables<div style="font-size:10px;font-weight:500;opacity:.85;margin-top:2px">lun\u2192sam</div></div>'
        +'<div id="pl-cpmode-ouvres" onclick="planSetCpMode(\'ouvres\')" style="'+_cpSeg+';'+(_cpMode==='ouvres'?_cpOn:_cpOff)+'">5 jours ouvr\u00e9s<div style="font-size:10px;font-weight:500;opacity:.85;margin-top:2px">lun\u2192ven</div></div>'
      +'</div>'
      +'<div style="font-size:11px;color:var(--texte-doux);line-height:1.5">'+_cpHint+'</div>'
      +'<div style="font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--texte-doux);margin-top:6px;padding-top:12px;border-top:1px solid var(--gris-clair)">P\u00e9riode de r\u00e9f\u00e9rence</div>'
      +'<div style="display:flex;gap:8px">'
        +'<div id="pl-cpper-juin" onclick="planSetCpPeriode(5)" style="'+_cpSeg+';'+(_cpMd===5?_cpOn:_cpOff)+'">1er juin \u2192 31 mai<span style="display:block;font-size:10px;font-weight:500;opacity:.85;margin-top:2px">usage agricole</span></div>'
        +'<div id="pl-cpper-jan" onclick="planSetCpPeriode(0)" style="'+_cpSeg+';'+(_cpMd===0?_cpOn:_cpOff)+'">Ann\u00e9e civile<span style="display:block;font-size:10px;font-weight:500;opacity:.85;margin-top:2px">janv. \u2192 d\u00e9c.</span></div>'
      +'</div>'
      +'<div style="font-size:11px;color:var(--texte-doux);line-height:1.5">Le solde de chaque salari\u00e9 ne compte que les cong\u00e9s pris sur la p\u00e9riode <b>'+_planCpPeriodeLbl()+'</b>. Distincte de l\u2019ann\u00e9e civile, qui sert au compteur d\u2019heures.</div>'
    +'</div>';
  // ★ Absences qui doivent des heures — a partir d'un mois choisi (jamais retroactif)
  var _dq=_planDuesDebut(),_dqOpt='';
  for(var _dqm=0;_dqm<12;_dqm++){
    var _dqv=planYear+'-'+String(_dqm+1).padStart(2,'0');
    _dqOpt+='<option value="'+_dqv+'"'+(_dq===_dqv?' selected':'')+'>'+PLAN_MOIS[_dqm]+' '+planYear+'</option>';
  }
  html+='<div class="plan-sec-lbl" style="margin-top:8px">Absences qui doivent des heures</div>'
    +'<div class="plan-card" style="flex-direction:column;gap:10px;align-items:stretch">'
      +'<select id="plan-dues-deb" onchange="planSetDuesDebut(this.value)" style="width:100%;font-family:inherit;font-size:14px;padding:10px;border:1.5px solid var(--gris-clair);border-radius:10px;background:var(--bg-card);color:var(--texte);outline:none">'
        +'<option value=""'+(_dq?'':' selected')+'>Inactif \u2014 aucune absence ne touche le compteur</option>'
        +_dqOpt
      +'</select>'
      +'<div style="font-size:11px;color:var(--texte-doux);line-height:1.5">À partir du mois choisi\u00a0: une <b>absence injustifi\u00e9e</b> ou un <b>retard</b> retire ses heures du compteur, comme une r\u00e9cup. Un arr\u00eat de travail, un cong\u00e9 sans solde, une formation ou un \u00e9v\u00e9nement familial deviennent <b>neutres</b> au lieu d\u2019absorber en silence les heures suppl\u00e9mentaires du mois. Les mois ant\u00e9rieurs ne bougent pas.</div>'
    +'</div>';
  // ── Politique du domaine : que deviennent les heures faites au-dela du planning ──
  var _hm=_planHsupMode();
  var _hmSeg='flex:1;padding:9px 6px;border:1.5px solid;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;text-align:center;font-family:inherit;line-height:1.2';
  var _hmOn='background:var(--vert-med);color:#fff;border-color:var(--vert-med)';
  var _hmOff='background:transparent;color:var(--texte-doux);border-color:var(--gris-clair)';
  var _hmHint={
    paye:'Les heures faites au-del\u00e0 du planning du mois sont pay\u00e9es en acompte. Elles se d\u00e9duisent du solde \u00e0 la cl\u00f4ture du 31 d\u00e9cembre.',
    recup:'Les heures se r\u00e9cup\u00e8rent en repos. Aucune colonne de paiement n\u2019appara\u00eet dans la fiche salari\u00e9.',
    cloture:'Rien ne se paie en cours d\u2019ann\u00e9e\u00a0: tout est report\u00e9 au solde de cl\u00f4ture du 31 d\u00e9cembre.'
  }[_hm];
  html+='<div class="plan-sec-lbl" style="margin-top:8px">Heures au-del\u00e0 du planning du mois</div>'
    +'<div class="plan-card" style="flex-direction:column;gap:10px;align-items:stretch">'
      +'<div style="display:flex;gap:7px">'
        +'<div onclick="planSetHsupMode(\'paye\')" style="'+_hmSeg+';'+(_hm==='paye'?_hmOn:_hmOff)+'">Pay\u00e9es<span style="display:block;font-size:10px;font-weight:500;opacity:.85;margin-top:2px">en acompte</span></div>'
        +'<div onclick="planSetHsupMode(\'recup\')" style="'+_hmSeg+';'+(_hm==='recup'?_hmOn:_hmOff)+'">R\u00e9cup\u00e9r\u00e9es<span style="display:block;font-size:10px;font-weight:500;opacity:.85;margin-top:2px">en repos</span></div>'
        +'<div onclick="planSetHsupMode(\'cloture\')" style="'+_hmSeg+';'+(_hm==='cloture'?_hmOn:_hmOff)+'">Report\u00e9es<span style="display:block;font-size:10px;font-weight:500;opacity:.85;margin-top:2px">\u00e0 la cl\u00f4ture</span></div>'
      +'</div>'
      +'<div style="font-size:11px;color:var(--texte-doux);line-height:1.5">'+_hmHint+'</div>'
    +'</div>';
  html+='<div class="plan-sec-lbl">Templates de planning</div>';
  ids.forEach(function(id){
    var isDefault=!!PLAN_DEF[id];
    var hasTpl=!!_pTplStore()[id];
    var hasTimings=hasTpl&&!!(_pTplStore()[id]._timings)&&Object.keys(_pTplStore()[id]._timings).length>0;
    var hasJour=hasTpl&&!!(_pTplStore()[id]._timings_jour)&&Object.keys(_pTplStore()[id]._timings_jour).length>0;
    var assignes=_planMbrs().filter(function(m){return _planPlId(m)===id;}).map(function(m){return m.nom;}).join(', ')||'\u2014';
    var delConfirm=window._planDeleteConfirm===id;
    html+='<div class="plan-card plan-tpl-row">'
      +'<input type="file" id="plan-csv-file-'+id+'" accept=".csv" style="display:none" onchange="planImportCSV(\''+id+'\')">'
      +'<div class="plan-tpl-info">'
        +'<div class="plan-tpl-name">'+id
          +(isDefault?' <span class="plan-badge plan-badge-def">D\u00e9faut</span>':'')
          +(hasTimings?' <span class="plan-badge" style="background:var(--vert-pale);color:var(--vert-med);font-size:9px">\ud83d\udd50 Horaires</span>':'')
          +(hasJour?' <span class="plan-badge" style="background:var(--plan-acc-pale);color:var(--plan-acc);font-size:9px">\ud83d\udcc6 Horaires par jour</span>':'')
        +'</div>'
        +'<div class="plan-tpl-sub">Assign\u00e9\u00a0: '+assignes+'</div>'
      +'</div>'
      +'<div class="plan-tpl-btns">'
        +'<button class="plan-btn-saisir" onclick="planOpenGridEditor(\''+id+'\')">Modifier</button>'
        +'<button class="plan-btn-pdf" onclick="planExportCSV(\''+id+'\')">CSV \u2193</button>'
        +'<button class="plan-btn-pdf" style="background:var(--plan-acc-pale);color:var(--plan-acc);border-color:rgba(123,109,184,0.4)" onclick="planDirectImportCSV(\''+id+'\')">CSV \u2191</button>'
        +(!isDefault?'<button class="plan-btn-pdf" style="background:var(--rouge-pale);color:var(--rouge);border-color:rgba(220,38,38,0.3)" onclick="planAskDeleteTemplate(\''+id+'\')">Suppr.</button>':'')
      +'</div>'
    +'</div>';
    if(delConfirm){
      html+='<div class="plan-card" style="background:var(--orange-pale);border:1.5px solid rgba(220,38,38,0.4);margin-top:-6px;border-radius:0 0 14px 14px;padding:10px 14px;flex-direction:row;align-items:center;gap:10px;flex-wrap:wrap">'
        +'<span style="flex:1;font-size:13px;color:var(--rouge)">Supprimer \u00ab\u00a0'+id+'\u00a0\u00bb ? Les membres assign\u00e9s passeront \u00e0 "standard".</span>'
        +'<button class="plan-btn-saisir" style="background:var(--rouge);border-color:var(--rouge);color:white" onclick="planDeleteTemplate(\''+id+'\')">Confirmer</button>'
        +'<button class="plan-btn-pdf" onclick="planCancelDeleteTemplate()">Annuler</button>'
      +'</div>';
    }
  });

  // Nouveau template
  html+='<div class="plan-card">'
    +'<div class="plan-card-lbl">Nouveau template</div>'
    +'<div style="display:flex;gap:8px;margin-top:8px">'
      +'<input id="plan-new-tpl-id" type="text" placeholder="Nom (ex: victor)" style="flex:1;padding:10px;border:1.5px solid var(--gris-clair);border-radius:10px;font-size:14px;font-family:inherit;outline:none">'
      +'<button class="plan-btn-saisir" onclick="planCreateTemplate()">Cr\u00e9er</button>'
    +'</div>'
  +'</div>';

  // Assignation membres
  html+='<div class="plan-sec-lbl" style="margin-top:8px">Assignation planning</div>';
  _planMbrs().forEach(function(mbr){
    var all2=Object.assign({},PLAN_DEF,_pTplStore());
    var opts=Object.keys(all2).map(function(id){return '<option value="'+_escHtml(id)+'"'+(_planPlId(mbr)===id?' selected':'')+'>'+_escHtml(id)+'</option>';}).join('');
    html+='<div class="plan-card" style="flex-direction:row;align-items:center;gap:12px;padding:12px 14px">'
      +'<div class="plan-emp-ava" style="background:'+((mbr.couleur||'#3D6B27')+'22')+';color:'+(mbr.couleur||'#3D6B27')+';width:36px;height:36px;font-size:15px">'+_escHtml(mbr.nom.charAt(0))+'</div>'
      +'<div style="flex:1;font-weight:600;font-size:14px">'+_escHtml(mbr.nom)+'</div>'
      +'<select onchange="planAssignTpl(\''+_escAttr(mbr.nom)+'\',this.value)" style="padding:8px;border:1.5px solid var(--gris-clair);border-radius:9px;font-size:13px;font-family:inherit;outline:none">'+opts+'</select>'
    +'</div>';
  });

  body.innerHTML=html;
}

function planCreateTemplate(){
  var id=(document.getElementById('plan-new-tpl-id')||{}).value;
  if(!id||!id.trim()){showToast('Saisissez un nom de template','var(--rouge)');return;}
  id=id.trim().toLowerCase().replace(/\s+/g,'-');
  if(_pTplStore()[id]||PLAN_DEF[id]){showToast('Template "'+id+'" existe d\u00e9j\u00e0','var(--rouge)');return;}
  _pTplStore()[id]={};
  window.PLANNING_TEMPLATES=PLANNING_TEMPLATES;
  if(window.fbSave)window.fbSave('planning_templates',PLANNING_TEMPLATES);
  showToast('\u2705 Template "'+id+'" cr\u00e9\u00e9','#3D6B27');
  planOpenGridEditor(id);
}

function planAssignTpl(nom,plId){
  var mbr=(window.MEMBRES||[]).find(function(m){return m.nom===nom;});
  if(!mbr)return;
  mbr.planning_id=plId;
  window.MEMBRES=window.MEMBRES;
  if(window.fbSave)window.fbSave('membres',window.MEMBRES);
  showToast('\u2705 '+nom+' \u2192 planning "'+plId+'"','#3D6B27');
}

// ── La coupure : combien, et quand ────────────────────────────────────────
// PLAN_PAUSE_MIN dit la DUREE. _planCoupureH dit l'HEURE de debut, ou rien.
// Trois etats, et le troisieme n'est pas un defaut mais une absence de reponse :
//   '12:00'  → coupure a heure fixe, le domaine l'a decidee
//   'libre'  → coupure prise selon le chantier, le domaine l'a decide aussi
//   ''       → le domaine ne s'est pas prononce : on n'affirme rien
// ⚠️ Un mois du CSV peut porter sa propre heure (champ `p` du timing) : chez un
// domaine dont la coupure suit la saison, le mois l'emporte sur le reglage.
function _planCoupureH(m,plId,yr){
  if(m!==undefined&&plId!==undefined){
    var tpl=_planGetTpl(plId,yr)||{};
    var mt=tpl._timings&&tpl._timings[m];
    if(mt&&mt.p)return mt.p;
  }
  var c=(window.CONFIG&&window.CONFIG.coupure_heure);
  return c||'';
}
// Comment dire la coupure a l'ouvrier, au gerant et a la paie d'un seul trait.
// « pause » est reserve a la pause legale (un droit du salarie) ; ce qui est
// decide par le domaine s'appelle une coupure.
function _planCoupureTxt(m,plId,yr){
  var h=_planCoupureH(m,plId,yr);
  if(h==='libre')return 'prise selon le chantier';
  if(h)return '\u00e0 '+h;
  return '';
}
function planSaveCoupure(v){
  if(!window.CONFIG)window.CONFIG={};
  window.CONFIG.coupure_heure=v;
  window.CONFIG=window.CONFIG;
  if(window.fbSave)window.fbSave('config',window.CONFIG);
  showToast(v==='libre'?'\u2705 Coupure prise selon le chantier'
            :(v?'\u2705 Coupure \u00e0 '+v:'\u2705 Heure de coupure effac\u00e9e'),'#3D6B27');
  _planRenderCadre();
}
function planSaveCoupureH(){
  var el=document.getElementById('plan-coup-h');
  if(el)planSaveCoupure(el.value||'');
}

function planSavePause(min){
  PLAN_PAUSE_MIN=min;
  window.PLAN_PAUSE_MIN=min;
  if(!window.CONFIG)window.CONFIG={};
  window.CONFIG.pause_dejeuner=min;
  window.CONFIG=window.CONFIG;
  if(window.fbSave)window.fbSave('config',window.CONFIG);
  showToast('\u2705 Coupure d\u00e9jeuner\u00a0: '+_planFmt(min/60),'#3D6B27');
  _planRenderCadre();
}

function planLegalPreset(v){
  if(v!=='cuma')return;
  var d=PLAN_LEGAL_DEF,set=function(id,val){var el=document.getElementById(id);if(el)el.value=val;};
  set('plan-leg-hebdo',d.hebdoLeg);set('plan-leg-mens',d.mensLeg);set('plan-leg-maxh',d.maxHebdo);set('plan-leg-maxm',d.maxMoy);set('plan-leg-maxj',d.maxJour);
  set('plan-leg-annu',d.plafAnnuel);set('plan-leg-modul',d.modulMax);
}
// Politique du domaine pour les heures au-dela du planning du mois.
// Ne change AUCUN calcul : seuls l'affichage et les colonnes de paiement varient.
function planSetHsupMode(v){
  if(!isAdmin())return;
  var mode=(v==='recup'||v==='cloture')?v:'paye';
  window.CONFIG=window.CONFIG||{};
  window.CONFIG.hsup_mode=mode;
  if(window.saveData)window.saveData('config');
  else if(window.fbSave)window.fbSave('config',window.CONFIG);
  showToast('\u2705 Heures au-del\u00e0 du planning\u00a0: '+({paye:'pay\u00e9es en acompte',recup:'r\u00e9cup\u00e9r\u00e9es en repos',cloture:'report\u00e9es \u00e0 la cl\u00f4ture'}[mode]),PLAN_BG);
  if(typeof renderPlanning==='function')renderPlanning();
}

function planSetDuesDebut(v){
  if(!isAdmin())return;
  var s=/^\d{4}-(0[1-9]|1[0-2])$/.test(v||'')?v:'';
  if(!window.CONFIG)window.CONFIG={};
  if(s)window.CONFIG.hsup_dues_debut=s; else delete window.CONFIG.hsup_dues_debut;
  if(window.saveData)window.saveData('config');
  else if(window.fbSave)window.fbSave('config',window.CONFIG);
  showToast(s?('\u2705 Heures dues compt\u00e9es \u00e0 partir de '+PLAN_MOIS[parseInt(s.slice(5,7),10)-1]+' '+s.slice(0,4))
             :'Heures dues\u00a0: inactif','#3D6B27');
  _planRenderCadre();
}
function planSaveLegal(){
  var gv=function(id,def){var v=parseFloat((document.getElementById(id)||{}).value);return isNaN(v)?def:v;};
  var L={hebdoLeg:gv('plan-leg-hebdo',PLAN_LEGAL_DEF.hebdoLeg),mensLeg:gv('plan-leg-mens',PLAN_LEGAL_DEF.mensLeg),maxHebdo:gv('plan-leg-maxh',PLAN_LEGAL_DEF.maxHebdo),maxMoy:gv('plan-leg-maxm',PLAN_LEGAL_DEF.maxMoy),maxJour:gv('plan-leg-maxj',PLAN_LEGAL_DEF.maxJour),plafAnnuel:gv('plan-leg-annu',PLAN_LEGAL_DEF.plafAnnuel),modulMax:gv('plan-leg-modul',PLAN_LEGAL_DEF.modulMax)};
  if(!window.CONFIG)window.CONFIG={};
  window.CONFIG.cadre_legal=L;
  window.CONFIG=window.CONFIG;
  if(window.fbSave)window.fbSave('config',window.CONFIG);
  showToast('\u2705 Cadre l\u00e9gal enregistr\u00e9','#3D6B27');
  _planRenderCadre();
}
// ── Éditeur de grille planning ──
function planOpenGridEditor(templateId){
  _planEditing={id:templateId,month:planMonth};
  _planRenderCadre();
}

function _planRenderGridEditor(){
  var body=document.getElementById('plan-body');
  if(!body||!_planEditing)return;
  var id=_planEditing.id;
  var m=_planEditing.month;
  var tpl=Object.assign({},PLAN_DEF[id]||{},_pTplStore()[id]||{});
  var total=_planDays(m);

  var html='<button class="plan-back-btn" onclick="planCloseGridEditor()">\u2190 Retour templates</button>'
    +'<div class="plan-card"><div class="plan-card-lbl">Template : '+id+'</div>';

  // Récap annuel des heures de référence calculées
  html+='<div class="plan-ref-recap">';
  var annuelTotal=0;
  for(var mi=0;mi<12;mi++){
    var mRef=_planGetRefH(id,mi);
    annuelTotal+=mRef;
    html+='<div class="plan-ref-mo'+(mi===m?' active':'')+'" onclick="planEditorSetMonth('+mi+')">'      +'<span class="plan-ref-mo-n">'+PLAN_MOIS_C[mi]+'</span>'      +'<span class="plan-ref-mo-h">'+(mRef>0?_planFmt(mRef):'—')+'</span>'    +'</div>';
  }
  html+='</div>';
  html+='<div class="plan-ref-total">Total annuel\u202f: <strong>'+_planFmt(annuelTotal)+'</strong> de r\u00e9f\u00e9rence</div>';

  // Sélection mois
  html+='<div class="plan-month-tabs" style="margin-bottom:12px">';
  for(mi=0;mi<12;mi++){
    html+='<button class="plan-mo-tab'+(mi===m?' active':'')+'" onclick="planEditorSetMonth('+mi+')">'+PLAN_MOIS_C[mi]+'</button>';
  }
  html+='</div>';

  // Total mois courant
  var mRefCur=_planGetRefH(id,m);
  html+='<div class="plan-ref-cur">\u23a3 R\u00e9f\u00e9rence '+PLAN_MOIS[m]+' (calcul\u00e9e depuis la grille)\u202f: <strong>'+_planFmt(mRefCur)+'</strong></div>';

  // Grille jours
  html+='<div class="plan-grid-editor" id="plan-grid-editor">';
  var moData=(tpl[m]||{});
  for(var d=1;d<=total;d++){
    var dow=_planDow(m,d),wk=dow===0||dow===6;
    var h=moData[d]||0;
    var rowBg=wk?'var(--bg-app)':'white';
    html+='<div class="plan-ge-row" style="background:'+rowBg+';opacity:'+(wk?0.6:1)+'">'
      +'<div class="plan-ge-day"><span class="plan-ge-n">'+d+'</span><span class="plan-ge-dow">'+PLAN_JOURS[dow]+'</span></div>'
      +'<input type="number" min="0" max="12" step="0.5" value="'+(h||'')+'" placeholder="0" '
        +'data-d="'+d+'" data-m="'+m+'" data-tpl="'+id+'" '
        +'class="plan-ge-input" onchange="planUpdateDay(this)">'
      +'<span class="plan-ge-unit">h</span>'
    +'</div>';
  }
  html+='</div>';

  // Actions
  html+='<div class="plan-ge-actions">'
    +'<button class="plan-btn-saisir" style="flex:1" onclick="planSaveTpl(\''+id+'\')">Enregistrer Firebase</button>'
    +'<button class="plan-btn-pdf" onclick="planExportCSV(\''+id+'\')">CSV \u2193</button>'
  +'</div>'
  +'</div>';

  body.innerHTML=html;
}

function planEditorSetMonth(m){if(_planEditing)_planEditing.month=m;_planRenderCadre();}

function planUpdateDay(input){
  var d=parseInt(input.getAttribute('data-d'));
  var m=parseInt(input.getAttribute('data-m'));
  var id=input.getAttribute('data-tpl');
  var h=parseFloat(input.value)||0;
  if(h<0)h=0;
  if(!_pTplStore()[id])_pTplStore()[id]={};
  if(!_pTplStore()[id][m])_pTplStore()[id][m]={};
  // Fusionner avec défaut
  var defData=PLAN_DEF[id]&&PLAN_DEF[id][m]?Object.assign({},PLAN_DEF[id][m]):{};
  Object.assign(defData,_pTplStore()[id][m]);
  if(h>0)defData[d]=h;else delete defData[d];
  _pTplStore()[id][m]=defData;
  window.PLANNING_TEMPLATES=PLANNING_TEMPLATES;
}

function planSaveTpl(id){
  window.PLANNING_TEMPLATES=PLANNING_TEMPLATES;
  if(window.fbSave)window.fbSave('planning_templates',PLANNING_TEMPLATES);
  showToast('\u2705 Template "'+id+'" enregistr\u00e9','#3D6B27');
}

function planCloseGridEditor(){_planEditing=null;_planRenderCadre();}

// ── Import direct par template ──
function planDirectImportCSV(id){
  var el=document.getElementById('plan-csv-file-'+id);
  if(el)el.click();
}

// ── Suppression template ──
function planAskDeleteTemplate(id){
  window._planDeleteConfirm=id;
  _planRenderCadre();
}
function planCancelDeleteTemplate(){
  window._planDeleteConfirm=null;
  _planRenderCadre();
}
function planDeleteTemplate(id){
  window._planDeleteConfirm=null;
  if(!_pTplStore()[id]){showToast('Template introuvable','var(--rouge)');return;}
  delete _pTplStore()[id];
  // Réassigner les membres sur "standard"
  (window.MEMBRES||[]).forEach(function(m){if(m.planning_id===id)m.planning_id='standard';});
  window.PLANNING_TEMPLATES=PLANNING_TEMPLATES;
  if(window.fbSave)window.fbSave('planning_templates',PLANNING_TEMPLATES);
  if(window.fbSave)window.fbSave('membres',window.MEMBRES);
  showToast('\uD83D\uDDD1 Template "'+id+'" supprim\u00e9','#B85A1A');
  _planRenderCadre();
}

// ── Export CSV ──
var _PLAN_MOIS_CSV=['jan','fev','mar','avr','mai','jun','jul','aou','sep','oct','nov','dec'];
function planExportCSV(templateId){
  var S=';'; // séparateur point-virgule → double-clic direct dans Excel FR
  var tpl=Object.assign({},PLAN_DEF[templateId]||{},_pTplStore()[templateId]||{});
  var rows=['# Planning Ma Vigne \u2014 template : '+templateId];
  // Lignes timing si définies
  if(tpl._timings){
    rows.push('# timing'+S+'mois'+S+'prise_de_service'+S+'fin_de_service'+S+'continu(oui/non)'+S+'heure_coupure(facultatif)');
    for(var ti=0;ti<12;ti++){
      var t=tpl._timings[ti];
      if(t)rows.push('timing'+S+_PLAN_MOIS_CSV[ti]+S+(t.d||t.debut||'08:00')+S+(t.f||t.fin||'16:00')+S+(t.continu?'oui':'non')+(t.p?(S+t.p):''));
    }
  }
  // En-tête + heures
  rows.push('# jour'+S+'jan'+S+'fev'+S+'... (heures pr\u00e9vues par mois \u00b7 suffixe D/M/A = horaire par jour)');
  rows.push(['jour'].concat(_PLAN_MOIS_CSV).join(S));
  for(var d=1;d<=31;d++){
    var cells=[d];
    for(var mi=0;mi<12;mi++){
      var h=(tpl[mi]&&tpl[mi][d])||0;
      var code=tpl._timings_jour&&tpl._timings_jour[mi]&&tpl._timings_jour[mi][d];
      cells.push(h>0?h+(code||''):0);
    }
    rows.push(cells.join(S));
  }
  var csv=rows.join('\n');
  var blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='planning_'+templateId+'_'+planYear+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('\u2705 CSV t\u00e9l\u00e9charg\u00e9','#3D6B27');
}

// ── Import CSV ──
var _PLAN_MOIS_IDX={jan:0,fev:1,mar:2,avr:3,mai:4,jun:5,jul:6,aou:7,sep:8,oct:9,nov:10,dec:11};
function planImportCSV(targetId){
  var fileEl=document.getElementById('plan-csv-file-'+targetId);
  var file=fileEl&&fileEl.files;
  if(!file||!file[0]||!targetId){showToast('S\u00e9lectionnez un fichier','var(--rouge)');return;}
  var reader=new FileReader();
  reader.onload=function(ev){
    try{
      var raw=ev.target.result.replace(/\r\n/g,'\n');
      // Auto-détection séparateur (point-virgule ou virgule)
      var S=raw.indexOf(';')>=0?';':',';
      var lines=raw.split('\n');
      var tplData={};
      var timings={};
      var jouTimings={};
      lines.forEach(function(line){
        if(!line.trim()||line.charAt(0)==='#')return;
        var prefix=line.split(S)[0].trim().toLowerCase();
        // Ligne timing mensuel
        if(prefix==='timing'){
          var parts=line.split(S);
          var mKey=(parts[1]||'').trim().toLowerCase();
          var mi2=(_PLAN_MOIS_IDX[mKey]!==undefined)?_PLAN_MOIS_IDX[mKey]:parseInt(mKey);
          if(!isNaN(mi2)&&mi2>=0&&mi2<12&&parts[2]&&parts[3]){
            var cont=(parts[4]||'').trim().toLowerCase();
            // 6e colonne facultative : l'heure de coupure du mois. Absente = le mois
      // suit le reglage du domaine ; presente = elle l'emporte.
      var _cp=(parts[5]||'').trim();
      timings[mi2]={d:parts[2].trim(),f:parts[3].trim(),continu:cont==='oui'||cont==='1'};
      if(/^\d{1,2}:\d{2}$/.test(_cp))timings[mi2].p=_cp;
          }
          return;
        }
        // En-tête
        if(prefix==='jour')return;
        // Données heures + codes D/M/A
        var cols=line.split(S);
        var d=parseInt(cols[0]);
        if(!d||d<1||d>31)return;
        for(var mi=0;mi<12;mi++){
          var cell=(cols[mi+1]||'').trim();
          var cm=cell.match(/^(\d+(?:[.,]\d+)?)([DMAdma]?)$/);
          if(!cm)continue;
          var h=parseFloat(cm[1].replace(',','.'))||0;
          var code=cm[2]?cm[2].toUpperCase():'';
          if(h>0){
            if(!tplData[mi])tplData[mi]={};
            tplData[mi][d]=h;
            if(code==='D'||code==='M'||code==='A'){
              if(!jouTimings[mi])jouTimings[mi]={};
              jouTimings[mi][d]=code;
            }
          }
        }
      });
      var nT=Object.keys(timings).length;
      var nJ=Object.keys(jouTimings).length;
      if(nT>0)tplData._timings=timings;
      if(nJ>0)tplData._timings_jour=jouTimings;
      _pTplStore()[targetId]=tplData;
      window.PLANNING_TEMPLATES=PLANNING_TEMPLATES;
      if(window.fbSave)window.fbSave('planning_templates',PLANNING_TEMPLATES);
      var msg='\u2705 CSV import\u00e9 \u2192 "'+targetId+'"';
      if(nT>0)msg+=' \u00b7 '+nT+' horaires mois';
      if(nJ>0)msg+=' \u00b7 '+(Object.values(jouTimings).reduce(function(s,m){return s+Object.keys(m).length;},0))+' jours \u00e0 horaire particulier';
      showToast(msg,'#3D6B27');
      _planRenderCadre();
    }catch(err){showToast('\u274c Erreur CSV\u00a0: '+err.message,'var(--rouge)');}
  };
  reader.readAsText(file[0]);
  if(fileEl)fileEl.value='';
}

// ── Modal édition jour ──
// ══════════════════════════════════════════════════════════════════════
// LA FEUILLE DU JOUR — la même pour un jour et pour une sélection
// ══════════════════════════════════════════════════════════════════════
// Il y avait trois feuilles pour la même chose : l'éditeur d'un jour, « Heures »
// en sélection, « Absence » en sélection. Trois rendus, trois calculs d'horaire,
// trois jeux d'identifiants — et des règles qui divergeaient sans que rien ne le
// dise. Il n'en reste qu'une : elle s'adapte au nombre de cases cochées.
// ⚠️ Les identifiants (#plan-t-debut, #plan-cont-btn, #plan-abs-h…) sont désormais
//    UNIQUES dans le DOM. C'est ce qui rend le namespace pma-/pmh- inutile.
var _planEdKeys=[];

function _planEdOne(){return _planEdKeys.length===1;}

// Ouverture sur UN jour précis, sans passer par la grille : « Mon planning », la
// fiche salarié, la visite guidée. La sélection en cours n'est pas touchée.
function openPlanDayModal(nom,day){
  if(!isAdmin())return;
  var mbr=(window.MEMBRES||[]).find(function(m){return m.nom===nom;});
  if(!mbr)return;
  _planEdKeys=[nom+'|'+day];
  _planEditDay={nom:nom,day:day,mbr:mbr};
  _planSheetOpen(null);
}

// Ouverture depuis les cases cochées.
function planSelSheet(mode){
  if(!isAdmin())return;
  var keys=_planSelKeys();
  if(!keys.length)return;
  _planEdKeys=keys.slice();
  if(keys.length===1){
    var p=_planSelParse(keys[0]);
    var m=(window.MEMBRES||[]).find(function(x){return x.nom===p.nom;});
    _planEditDay=m?{nom:p.nom,day:p.d,mbr:m}:null;
  } else _planEditDay=null;
  _planSheetOpen(mode||'travail');
}

function _planSheetOpen(mode){
  var one=_planEdOne();
  var html=one?_planSheetOneHtml(mode):_planSheetManyHtml(mode);
  var sheet=document.getElementById('ovPlanDaySheet');
  if(sheet)sheet.innerHTML=html;
  // iOS Safari : innerHTML n'initialise pas .value sur input[type="time"] → horaires faux
  var _elD=document.getElementById('plan-t-debut');
  var _elF=document.getElementById('plan-t-fin');
  if(_elD)_elD.value=_planEdT0;
  if(_elF)_elF.value=_planEdT1;
  var ov=document.getElementById('ovPlanDay');
  if(ov)ov.classList.add('open');
  planSetMode(_planModalMode);
  planCalcResult();
}

// Horaires proposés à l'ouverture — mémorisés le temps du rendu pour le correctif iOS.
var _planEdT0='08:00',_planEdT1='16:00';

// ── Blocs communs aux deux rendus ──
function _planSheetModes(withCp){
  return '<div class="plan-modal-modes">'
      +'<button class="plan-modal-mode" id="pmod-travail" onclick="planSetMode(\'travail\')">\u2713\u00a0 Travaill\u00e9</button>'
      +(withCp?'<button class="plan-modal-mode" id="pmod-cp" onclick="planSetMode(\'cp\')">\u2600\u00a0 Cong\u00e9</button>':'')
      +'<button class="plan-modal-mode" id="pmod-absent" onclick="planSetMode(\'absent\')">\u2715\u00a0 Absence</button>'
      +'<button class="plan-modal-mode" id="pmod-recup" onclick="planSetMode(\'recup\')">\u21ba\u00a0 R\u00e9cup</button>'
    +'</div>';
}
function _planSheetTiming(lbl,initCont,heatOn,rempHtml){
  return '<div id="plan-timing-section">'
      +'<div class="plan-modal-lbl">'+lbl+'</div>'
      +'<div class="plan-time-row">'
        +'<div class="plan-time-field"><div class="plan-time-lbl">Prise de service</div><input type="time" id="plan-t-debut" value="'+_planEdT0+'" onchange="planCalcResult()" style="width:100%;border:2px solid var(--gris-clair);border-radius:11px;padding:11px;font-size:17px;font-family:monospace;outline:none;text-align:center;background:var(--gris-clair);color:var(--texte);box-sizing:border-box;cursor:pointer"></div>'
        +'<div style="font-size:20px;color:var(--gris);align-self:flex-end;padding-bottom:11px;text-align:center">\u2192</div>'
        +'<div class="plan-time-field"><div class="plan-time-lbl">Fin de service</div><input type="time" id="plan-t-fin" value="'+_planEdT1+'" onchange="planCalcResult()" style="width:100%;border:2px solid var(--gris-clair);border-radius:11px;padding:11px;font-size:17px;font-family:monospace;outline:none;text-align:center;background:var(--gris-clair);color:var(--texte);box-sizing:border-box;cursor:pointer"></div>'
      +'</div>'
      +'<button id="plan-cont-btn" onclick="planToggleContinu()" class="plan-cont-btn'+(initCont?' active':'')+'">'
        +'<span id="plan-cont-chk" class="plan-cont-chk'+(initCont?' on':'')+'" style="display:flex;align-items:center;justify-content:center">'+(initCont?'\u2713':'')+'</span>'
        +'<span style="text-align:left"><span style="display:block;font-size:13px;font-weight:600;color:'+(initCont?PLAN_ACC2:'var(--texte-doux)')+'">Horaire continu</span><span style="display:block;font-size:11px;color:var(--texte-doux)">Sans coupure \u00b7 aucune coupure d\u00e9duite</span></span>'
      +'</button>'
      +'<button id="plan-heat-btn" onclick="planPresetChaleur()" class="pl2-heat-btn'+(heatOn?' on':'')+'">\ud83c\udf21 Chaleur \u00b7 06:00 \u2192 14:00 continu</button>'
      +(rempHtml||'')
      +'<div id="plan-calc-result" class="plan-calc-result"></div>'
    +'</div>';
}
function _planSheetRemp(lblTxt,subTxt){
  return '<button id="plan-remp-btn" onclick="planToggleRemp()" class="plan-cont-btn'+(_planEdRemp?' active':'')+'" style="margin-top:10px">'
    +'<span id="plan-remp-chk" class="plan-cont-chk'+(_planEdRemp?' on':'')+'" style="display:flex;align-items:center;justify-content:center">'+(_planEdRemp?'\u2713':'')+'</span>'
    +'<span style="text-align:left"><span id="plan-remp-lbl" style="display:block;font-size:13px;font-weight:600;color:'+(_planEdRemp?PLAN_ACC2:'var(--texte-doux)')+'">\u21c4 '+lblTxt+'</span>'
    +'<span style="display:block;font-size:11px;color:var(--texte-doux);line-height:1.35">'+subTxt+'</span></span>'
  +'</button>';
}
function _planSheetComment(val){
  return '<div id="plan-comment-section">'
      +'<div class="plan-modal-lbl" style="margin-top:12px">Commentaire <span style="font-size:11px;font-weight:400">(optionnel)</span></div>'
      +'<input type="text" id="plan-comment" value="'+_escAttr(val||'')+'" placeholder="Ex\u00a0: chaleur, vendanges\u2026" style="width:100%;border:2px solid var(--gris-clair);border-radius:10px;padding:11px;font-size:14px;outline:none;font-family:inherit;box-sizing:border-box">'
    +'</div>';
}
function _planSheetAbsSection(valH,initComment,manyOnly,prevuTxt){
  return '<div id="plan-absent-section" style="display:none">'
      +'<div class="plan-modal-lbl">Motif de l\'absence <span style="color:var(--rouge)">*</span></div>'
      +_planAbsMotifsHtml(_planAbsSel,manyOnly)
      +'<div id="plan-abs-h-wrap" style="display:'+((!manyOnly&&_planAbsDef(_planAbsSel).heures)?'block':'none')+';margin-top:4px">'
        +'<div class="plan-modal-lbl">Heures non travaill\u00e9es</div>'
        +'<div style="display:flex;gap:12px;align-items:center;margin-bottom:4px">'
          +'<input type="number" id="plan-abs-h" step="0.25" min="0" max="24" value="'+(valH==null?0:Math.round(valH*100)/100)+'" style="width:90px;border:2px solid var(--gris-clair);border-radius:10px;padding:10px;font-size:18px;text-align:center;outline:none;background:var(--bg-card);color:var(--texte);box-sizing:border-box">'
          +'<span style="font-size:13px;color:var(--texte-doux)">'+(prevuTxt||'h non travaill\u00e9es')+'</span>'
        +'</div>'
      +'</div>'
      +'<div class="plan-modal-lbl" style="margin-top:10px">Pr\u00e9cision (facultatif)</div>'
      +'<input type="text" id="plan-absent-reason" value="'+_escAttr(initComment||'')+'" placeholder="Ex\u00a0: reprise le 24" style="width:100%;border:2px solid var(--gris-clair);border-radius:10px;padding:11px;font-size:14px;outline:none;font-family:inherit;box-sizing:border-box;background:var(--bg-card)">'
    +'</div>';
}

// ── Rendu : UNE case ──
function _planSheetOneHtml(mode){
  var nom=_planEditDay.nom,day=_planEditDay.day,mbr=_planEditDay.mbr;
  var plId=_planPlId(mbr);
  var pl=_planPlanned(plId,planMonth,day);
  var isNP=pl===0;
  var ent=_pEntDay(nom,planMonth,day);
  var f=_planFerie(planMonth,day);
  var defT=_planDefTiming(pl,plId,planMonth,day);
  _planEdT0=(ent&&ent.timing&&ent.timing.debut)||defT.d||'08:00';
  _planEdT1=(ent&&ent.timing&&ent.timing.fin)||defT.f||'16:00';
  var initCont=!!(ent&&ent.timing&&ent.timing.continu);
  var initComment=(ent&&ent.comment)||'';
  _planEdHeat=!!(ent&&ent.canicule);
  _planEdRemp=!!(ent&&ent.remplacement);
  _planModalMode=mode||((ent&&ent.absent)?'absent':(ent&&ent.type==='cp')?'cp':(ent&&ent.type==='recup')?'recup':(isNP?'extra':'travail'));
  _planAbsSel=((ent&&ent.absent&&ent.motif)?_planAbsDef(ent.motif).id:'autre');
  var dowL=PLAN_JOURS_L[_planDow(planMonth,day)];
  var plDisplay=_planDayH(plId,planMonth,day,null);
  var tot=_planDays(planMonth);
  var sub=f?('\ud83c\udfd6 '+f+' \u2014 f\u00e9ri\u00e9'+(pl>0?' \u00b7 pr\u00e9vu '+_planFmt(plDisplay):''))
    :(pl>0?('Pr\u00e9vu\u00a0: '+_planFmt(plDisplay)+(defT.d?' \u00b7 '+defT.d+' \u2192 '+defT.f:'')+' \u00b7 planning '+plId)
    :'Repos pr\u00e9vu \u2014 heures saisies = jour suppl\u00e9mentaire \u00b7 CP / absence possibles (1 j, 0 h)');

  var strip='';
  _pl2Actifs().forEach(function(m2){
    strip+='<button class="pl2-ms pl2-ms-dk'+(m2.nom===nom?' on':'')+'" onclick="planEdSwitch(\''+_escAttr(m2.nom)+'\')"><span class="pl2-ava" style="background:'+(m2.couleur||'#3D6B27')+'">'+_escHtml(m2.nom.charAt(0))+'</span>'+_escHtml(m2.nom)+'</button>';
  });

  var initCpH=ent&&ent.type==='cp'?(ent.heures||pl):pl;
  var clrHtml='';
  if(ent){
    var _clWhat=ent.absent?'l\u2019absence'
      :(ent.type==='cp')?'le cong\u00e9 pay\u00e9'
      :(ent.type==='recup')?'la r\u00e9cup\u00e9ration'
      :(ent.canicule)?'les horaires chaleur'
      :'les heures saisies';
    var _clBack=f?'La journ\u00e9e redevient un jour f\u00e9ri\u00e9.'
      :(pl>0?('La journ\u00e9e revient au planning pr\u00e9vu \u00b7 '+_planFmt(plDisplay)+'.')
            :'La journ\u00e9e revient en repos pr\u00e9vu.');
    clrHtml='<button type="button" onclick="planClearDay()" '
      +'style="display:block;width:100%;margin-top:16px;padding:11px 13px;border:1.5px solid var(--gris-clair);border-radius:12px;background:var(--bg-card);font-family:inherit;cursor:pointer;text-align:left">'
      +'<span style="display:block;font-size:13.5px;font-weight:700;color:var(--rouge)">\u21a9 Annuler '+_clWhat+'</span>'
      +'<span style="display:block;font-size:11.5px;color:var(--texte-doux);margin-top:2px;line-height:1.35">'+_clBack+'</span>'
    +'</button>';
  }

  var rempHtml=isNP?_planSheetRemp('Jour de remplacement','\u00c9change avec un jour planifi\u00e9 pris ailleurs \u00b7 <strong>aucune heure suppl\u00e9mentaire</strong>'):'';

  return '<div class="plan-modal-hdr">'
    +'<div style="width:36px;height:4px;background:rgba(255,255,255,0.2);border-radius:99px;margin:0 auto 12px"></div>'
    +'<div class="pl2-ed-nav">'
      +'<button class="pl2-ed-arr" onclick="planEdNav(-1)"'+(day<=1?' disabled':'')+' aria-label="Jour pr\u00e9c\u00e9dent">\u2039</button>'
      +'<div class="pl2-ed-mid">'
        +'<div class="pl2-ed-d">'+dowL+' '+day+' '+PLAN_MOIS_C[planMonth]+'</div>'
        +'<div class="pl2-ed-s">'+sub+'</div>'
      +'</div>'
      +'<button class="pl2-ed-arr" onclick="planEdNav(1)"'+(day>=tot?' disabled':'')+' aria-label="Jour suivant">\u203a</button>'
      +'<button class="pl2-ed-x" onclick="closePlanDayModal()" aria-label="Fermer">\u00d7</button>'
    +'</div>'
    +'<div class="pl2-mstrip">'+strip+'</div>'
  +'</div>'
  +'<div id="plan-modal-body" style="overflow-y:auto;flex:1;padding:18px 24px 8px">'
    +_planSheetModes(true)
    +_planSheetTiming(isNP?'Heures travaill\u00e9es':'Horaires de la journ\u00e9e',initCont,_planEdHeat,rempHtml)
    +_planSheetAbsSection(_planAbsH(ent),(ent&&ent.absent)?initComment:'',false,'h sur '+_planFmt(plDisplay)+' pr\u00e9vues')
    +'<div id="plan-cp-section" style="display:none">'
      +'<div class="plan-modal-lbl">Heures d\u00e9compt\u00e9es</div>'
      +'<div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">'
        +'<input type="number" id="plan-cp-heures" step="0.5" min="0" max="24" value="'+(Math.round(initCpH*100)/100)+'" style="width:90px;border:2px solid rgba(217,119,6,0.35);border-radius:10px;padding:10px;font-size:18px;text-align:center;outline:none;background:var(--orange-pale);box-sizing:border-box">'
        +'<span style="font-size:13px;color:var(--texte-doux)">h (selon planning)</span>'
      +'</div>'
      +'<div style="font-size:12px;color:var(--orange);background:var(--orange-pale);border:1px solid rgba(217,119,6,0.35);padding:10px 12px;border-radius:10px">'
        +'\u2600 Journ\u00e9e de cong\u00e9 pay\u00e9 \u2014 d\u00e9compte <strong>1 jour</strong> du solde.'+(pl>0?'':' Jour sans heures pr\u00e9vues \u2192 0 h d\u00e9duite, le jour est bien d\u00e9compt\u00e9.')
      +'</div>'
    +'</div>'
    +'<div id="plan-recup-section" style="display:none">'
      +'<div class="plan-modal-lbl">R\u00e9cup\u00e9ration</div>'
      +'<div style="font-size:12px;color:var(--plan-acc);background:var(--plan-acc-pale);border:1px solid rgba(123,109,184,0.4);padding:10px 12px;border-radius:10px;line-height:1.5">'
        +'\u21ba Jour pris en r\u00e9cup\u00e9ration \u2014 compte comme pr\u00e9sence pay\u00e9e (\u00e9cart neutre) et d\u00e9duit <strong>'+_planFmt(plDisplay)+'</strong> du compteur d\u2019heures sup.'
      +'</div>'
    +'</div>'
    +_planSheetComment(!(ent&&ent.absent)?initComment:'')
    +clrHtml
  +'</div>'
  +'<div class="pl2-ed-foot">'
    +'<button class="pl2-ed-btn pl2-ed-ghost" onclick="closePlanDayModal()">Fermer</button>'
    +'<button class="pl2-ed-btn pl2-ed-dark" onclick="savePlanDay(false)">Enregistrer</button>'
    +'<button class="pl2-ed-btn pl2-ed-acc" onclick="savePlanDay(true)">Enreg. \u2192 suiv. \u203a</button>'
  +'</div>';
}

// ── Rendu : PLUSIEURS cases ──
function _planSheetManyHtml(mode){
  var keys=_planEdKeys,n=keys.length;
  var st=_planSelStats(),np=_pmhNPStats(keys);
  _planEdT0='07:00';_planEdT1='16:30';
  _planEdHeat=false;_planEdRemp=false;
  _planModalMode=(mode==='absent'||mode==='recup')?mode:'travail';
  _planAbsSel='arret';
  var rempHtml=np.np>0?_planSheetRemp('Jours de remplacement',
      np.np+' jour'+(np.np>1?'s':'')+' sans heures pr\u00e9vues dans la s\u00e9lection \u00b7 <strong>aucune heure suppl\u00e9mentaire</strong>'
      +(np.cp>0?(' \u00b7 remplace '+np.cp+' cong\u00e9'+(np.cp>1?'s':'')+' d\u00e9j\u00e0 pos\u00e9'+(np.cp>1?'s':'')):'')):'';

  return '<div class="plan-modal-hdr">'
    +'<div style="width:36px;height:4px;background:rgba(255,255,255,0.2);border-radius:99px;margin:0 auto 12px"></div>'
    +'<div class="pl2-ed-nav">'
      +'<div class="pl2-ed-mid">'
        +'<div class="pl2-ed-d">'+n+' jours coch\u00e9s</div>'
        +'<div class="pl2-ed-s">'+_escHtml(_planSelResume())+'</div>'
      +'</div>'
      +'<button class="pl2-ed-x" onclick="closePlanDayModal()" aria-label="Fermer">\u00d7</button>'
    +'</div>'
  +'</div>'
  +'<div id="plan-modal-body" style="overflow-y:auto;flex:1;padding:18px 24px 8px">'
    +_planSheetModes(false)
    +_planSheetTiming('Horaire appliqu\u00e9 aux '+n+' jours',false,false,rempHtml)
    +_planSheetAbsSection(null,'',true)
    +'<div id="plan-recup-section" style="display:none">'
      +'<div class="plan-modal-lbl">R\u00e9cup\u00e9ration</div>'
      +'<div style="font-size:12px;color:var(--plan-acc);background:var(--plan-acc-pale);border:1px solid rgba(123,109,184,0.4);padding:10px 12px;border-radius:10px;line-height:1.5">'
        +'\u21ba Chaque jour coch\u00e9 devient une r\u00e9cup\u00e9ration \u2014 pr\u00e9sence pay\u00e9e, \u00e9cart neutre, heures d\u00e9duites du compteur.'
      +'</div>'
    +'</div>'
    +_planSheetComment('')
    +'<div id="plan-sheet-note" style="font-size:12px;color:var(--texte-doux);background:var(--bg-app);border:1px solid var(--gris-clair);border-radius:11px;padding:10px 13px;line-height:1.5;margin-top:12px">'+_planSheetNote()+'</div>'
    +(st.saisis>0?('<button type="button" onclick="planSelAction(\'clr\');closePlanDayModal();" '
      +'style="display:block;width:100%;margin-top:14px;padding:11px 13px;border:1.5px solid var(--gris-clair);border-radius:12px;background:var(--bg-card);font-family:inherit;cursor:pointer;text-align:left">'
      +'<span style="display:block;font-size:13.5px;font-weight:700;color:var(--rouge)">\u21a9 Effacer les saisies de ces jours</span>'
      +'<span style="display:block;font-size:11.5px;color:var(--texte-doux);margin-top:2px;line-height:1.35">'+st.saisis+' jour'+(st.saisis>1?'s':'')+' revient'+(st.saisis>1?'':'')+' au planning pr\u00e9vu.</span>'
    +'</button>'):'')
  +'</div>'
  +'<div class="pl2-ed-foot">'
    +'<button class="pl2-ed-btn pl2-ed-ghost" onclick="closePlanDayModal()">Fermer</button>'
    +'<button class="pl2-ed-btn pl2-ed-dark" id="plan-sheet-apply" onclick="savePlanDay(false)">Appliquer aux '+n+' jours</button>'
  +'</div>';
}

// ★ La note dit exactement ce que le bouton va faire — elle change avec la bascule,
//   parce que la promesse « les congés sont préservés » devient fausse en remplacement.
function _planSheetNote(){
  if(_planModalMode==='absent')return 'Le motif s\u2019applique \u00e0 tous les jours coch\u00e9s. Un motif qui se compte en heures (retard) se saisit jour par jour.';
  if(_planModalMode==='recup')return 'Les jours d\u00e9j\u00e0 en cong\u00e9, en absence ou sans heures pr\u00e9vues sont pr\u00e9serv\u00e9s.';
  if(!_planEdRemp)return 'S\u2019applique \u00e0 tous les jours coch\u00e9s. Les cong\u00e9s, absences et r\u00e9cup\u00e9rations de la s\u00e9lection sont pr\u00e9serv\u00e9s.';
  var s=_pmhNPStats(_planEdKeys);
  return '\u21c4 <b>Mode remplacement</b> \u2014 seuls les <b>'+s.np+' jour'+(s.np>1?'s':'')+' sans heures pr\u00e9vues</b> re\u00e7oivent ces horaires'
    +(s.cp>0?(', et <b>'+s.cp+' cong\u00e9'+(s.cp>1?'s':'')+'</b> y sera'+(s.cp>1?'nt':'')+' remplac\u00e9'+(s.cp>1?'s':'')+' par du travail'):'')
    +'. Les jours d\u00e9j\u00e0 travaill\u00e9s au planning, les absences et les r\u00e9cup\u00e9rations ne bougent pas.'
    +(s.cp>0?'<br>\u26a0\ufe0f Pense \u00e0 poser ces '+s.cp+' jour'+(s.cp>1?'s':'')+' de cong\u00e9 \u00e0 la nouvelle date, sinon ils ne seront pas d\u00e9compt\u00e9s du solde.':'');
}
function _planSheetNoteSync(){
  var el=document.getElementById('plan-sheet-note');
  if(el)el.innerHTML=_planSheetNote();
  var ap=document.getElementById('plan-sheet-apply');
  if(ap){
    var nn=_planEdRemp?_pmhNPStats(_planEdKeys).np:_planEdKeys.length;
    ap.textContent='Appliquer aux '+nn+' jour'+(nn>1?'s':'');
  }
}

// ── Navigation à l'intérieur de la feuille (jour ↔ jour, salarié ↔ salarié) ──
function planEdNav(dir){
  if(!_planEdOne()||!_planEditDay)return;
  var d=_planEditDay.day+dir;
  if(d<1||d>_planDays(planMonth))return;
  openPlanDayModal(_planEditDay.nom,d);
}
function planEdSwitch(nom){
  if(!_planEdOne()||!_planEditDay||nom===_planEditDay.nom)return;
  openPlanDayModal(nom,_planEditDay.day);
}
function planPresetChaleur(){
  _planEdHeat=!_planEdHeat;
  var btn=document.getElementById('plan-heat-btn');
  if(btn)btn.classList.toggle('on',_planEdHeat);
  if(_planEdHeat){
    if(_planModalMode!=='travail'&&_planModalMode!=='extra')planSetMode('travail');
    var dEl=document.getElementById('plan-t-debut');
    var fEl=document.getElementById('plan-t-fin');
    if(dEl)dEl.value='06:00';
    if(fEl)fEl.value='14:00';
    var cb=document.getElementById('plan-cont-btn');
    if(cb&&!cb.classList.contains('active'))planToggleContinu();
  }
  planCalcResult();
}

function closePlanDayModal(){
  var ov=document.getElementById('ovPlanDay');
  if(ov)ov.classList.remove('open');
  _planEditDay=null;
  _planEdKeys=[];
  _planEdHeat=false;
  _planEdRemp=false;
}

function planSetMode(mode){
  _planModalMode=mode;
  var btns=document.querySelectorAll('.plan-modal-mode');
  btns.forEach(function(b){
    var bm=b.id==='pmod-absent'?'absent':b.id==='pmod-cp'?'cp':b.id==='pmod-recup'?'recup':'travail';
    var isActive=(bm===mode)||(bm==='travail'&&mode!=='absent'&&mode!=='cp'&&mode!=='recup');
    var col=bm==='absent'?'var(--rouge)':bm==='cp'?'var(--orange)':PLAN_ACC2;
    var bdc=bm==='absent'?'var(--rouge)':bm==='cp'?'rgba(217,119,6,0.35)':PLAN_ACC2;
    var bg=bm==='absent'?'var(--rouge-pale)':bm==='cp'?'var(--orange-pale)':'var(--plan-acc-pale)';
    b.style.borderColor=isActive?bdc:'var(--gris-clair)';
    b.style.background=isActive?bg:'var(--bg-card)';
    b.style.color=isActive?col:'var(--texte-doux)';
  });
  var ts=document.getElementById('plan-timing-section');
  var as=document.getElementById('plan-absent-section');
  var cs=document.getElementById('plan-comment-section');
  var cps=document.getElementById('plan-cp-section');
  var rs=document.getElementById('plan-recup-section');
  var hideWork=(mode==='absent'||mode==='cp'||mode==='recup');
  if(ts)ts.style.display=hideWork?'none':'block';
  if(as)as.style.display=mode==='absent'?'block':'none';
  if(cs)cs.style.display=hideWork?'none':'block';
  if(cps)cps.style.display=mode==='cp'?'block':'none';
  if(rs)rs.style.display=mode==='recup'?'block':'none';
  _planSheetNoteSync();
  planCalcResult();
}

function planToggleRemp(){
  var btn=document.getElementById('plan-remp-btn');
  var chk=document.getElementById('plan-remp-chk');
  if(!btn||!chk)return;
  _planEdRemp=!_planEdRemp;
  btn.classList.toggle('active',_planEdRemp);
  chk.classList.toggle('on',_planEdRemp);
  chk.textContent=_planEdRemp?'\u2713':'';
  var lbl=document.getElementById('plan-remp-lbl');
  if(lbl)lbl.style.color=_planEdRemp?PLAN_ACC2:'var(--texte-doux)';
  _planSheetNoteSync();
  planCalcResult();
}

function planToggleContinu(){
  var btn=document.getElementById('plan-cont-btn');
  var chk=document.getElementById('plan-cont-chk');
  if(!btn||!chk)return;
  var isOn=btn.classList.toggle('active');
  chk.classList.toggle('on',isOn);
  chk.textContent=isOn?'\u2713':'';
  planCalcResult();
}

function planCalcResult(){
  var res=document.getElementById('plan-calc-result');
  if(!res||!_planEdKeys.length)return;
  var debut=(document.getElementById('plan-t-debut')||{}).value||'08:00';
  var fin=(document.getElementById('plan-t-fin')||{}).value||'16:00';
  var cont=document.getElementById('plan-cont-btn')&&document.getElementById('plan-cont-btn').classList.contains('active');
  var h=_planTimingH(debut,fin,cont);
  var _pauseMin=window.PLAN_PAUSE_MIN||PLAN_PAUSE_MIN||60;
  var _pauseLbl=_planFmt(_pauseMin/60);
  // Sur une selection, il n'y a pas UNE reference a comparer : chaque jour a la
  // sienne. Afficher un ecart la-dessus serait un nombre faux avec l'autorite d'une
  // mesure — on affiche les heures posees, et le nombre de jours touches.
  if(!_planEdOne()||!_planEditDay){
    var nn=_planEdRemp?_pmhNPStats(_planEdKeys).np:_planEdKeys.length;
    res.innerHTML='<span style="font-size:11px;color:var(--texte-doux)">'+debut+' \u2192 '+fin+(cont?' \u00b7 continu':'')+(h>6&&!cont?' \u00b7 \u2212'+_pauseLbl+' de coupure':'')+'</span>'
      +'<div><span style="font-size:22px;font-weight:700;color:var(--texte)">'+_planFmt(h)+'</span>'
      +'<span style="font-size:12px;font-weight:600;color:var(--texte-doux)">/j \u00b7 '+nn+' jour'+(nn>1?'s':'')+'</span></div>';
    return;
  }
  var plId=_planPlId(_planEditDay.mbr);
  var plRef=_planDayH(plId,planMonth,_planEditDay.day,null);
  var diff=plRef>0?Math.round((h-plRef)*60)/60:null;
  var diffStr=diff===null?'':Math.abs(diff)<0.05?'\u00a0\u00b7 = pr\u00e9vu':(diff>0?'\u00a0\u00b7 +':'\u00a0\u00b7 ')+_planFmt(diff)+' vs pr\u00e9vu';
  var diffColor=!diff||Math.abs(diff)<0.05?'var(--texte-doux)':diff>0?'var(--vert-med)':'var(--orange)';
  res.innerHTML='<span style="font-size:11px;color:var(--texte-doux)">'+debut+' \u2192 '+fin+(cont?' \u00b7 continu':'')+(h>6&&!cont?' \u00b7 \u2212'+_pauseLbl+' de coupure':'')+'</span>'
    +'<div><span style="font-size:22px;font-weight:700;color:'+(Math.abs(diff||0)<0.05?'var(--texte)':diff>0?'var(--vert-med)':'var(--orange)')+'">'+_planFmt(h)+'</span>'
    +'<span style="font-size:12px;font-weight:600;color:'+diffColor+'">'+diffStr+'</span></div>'
    +((_planEdRemp&&plRef<=0)?'<div style="font-size:11.5px;font-weight:600;color:var(--bleu);margin-top:3px;line-height:1.35">\u21c4 Remplacement \u2014 compt\u00e9 dans la r\u00e9f\u00e9rence du mois, aucune heure suppl\u00e9mentaire</div>':'');
}

// ── L'écriture ──
// Un seul point de sortie pour les deux rendus : ce qui a divergé entre l'éditeur
// du jour et les feuilles de sélection ne peut plus diverger.
function savePlanDay(next){
  var keys=_planEdKeys.slice();
  if(!keys.length)return;
  var one=(keys.length===1);
  var nom=one&&_planEditDay?_planEditDay.nom:'';
  var day=one&&_planEditDay?_planEditDay.day:0;
  var r,msg;
  if(_planModalMode==='cp'&&one){
    var cpH=parseFloat((document.getElementById('plan-cp-heures')||{}).value);
    if(isNaN(cpH))cpH=_planPlanned(_planPlId(_planEditDay.mbr),planMonth,day);
    _pEntEnsure(nom,planMonth)[day]={type:'cp',heures:cpH};
    r={n:1,skip:0};
    msg='\u2705 '+nom+' \u00b7 '+PLAN_JOURS[_planDow(planMonth,day)]+' '+day+' enregistr\u00e9';
  } else if(_planModalMode==='recup'){
    r=_planApplySimple(keys,'rec',one);
    msg=r.n>0?('\u21ba R\u00e9cup \u00b7 '+r.n+' j'+(r.skip>0?' \u00b7 '+r.skip+' pr\u00e9serv\u00e9'+(r.skip>1?'s':''):'')):'Aucun jour applicable';
  } else if(_planModalMode==='absent'){
    var reason=((document.getElementById('plan-absent-reason')||{}).value||'').trim();
    var hv=(document.getElementById('plan-abs-h')||{}).value;
    r=_planApplyAbs(keys,_planAbsSel,reason,hv);
    var mo=_planAbsDef(_planAbsSel);
    msg=r.n>0?('\u2705 '+mo.ico+' '+mo.nom+' \u00b7 '+r.n+'\u00a0j'+(r.skip>0?' \u00b7 '+r.skip+' ignor\u00e9'+(r.skip>1?'s':''):'')):'Aucun jour applicable';
  } else {
    var debut=(document.getElementById('plan-t-debut')||{}).value||'08:00';
    var fin=(document.getElementById('plan-t-fin')||{}).value||'16:00';
    var cont=document.getElementById('plan-cont-btn')&&document.getElementById('plan-cont-btn').classList.contains('active');
    var comment=((document.getElementById('plan-comment')||{}).value||'').trim();
    if(_planTimingH(debut,fin,cont)<=0){showToast('Horaire invalide','#E07060');return;}
    r=_planApplyHeures(keys,{debut:debut,fin:fin,continu:cont,comment:comment,heat:_planEdHeat,remp:_planEdRemp,force:one});
    msg=r.n>0
      ?(one?('\u2705 '+nom+' \u00b7 '+PLAN_JOURS[_planDow(planMonth,day)]+' '+day+' enregistr\u00e9')
        :((_planEdRemp?'\u21c4 ':'\u2705 ')+debut+' \u2192 '+fin+' \u00b7 '+r.n+' j'
          +(r.cp>0?' \u00b7 '+r.cp+' cong\u00e9'+(r.cp>1?'s':'')+' remplac\u00e9'+(r.cp>1?'s':''):'')
          +(r.skip>0?' \u00b7 '+r.skip+' pr\u00e9serv\u00e9'+(r.skip>1?'s':''):'')))
      :(_planEdRemp?'Aucun jour sans heures pr\u00e9vues dans la s\u00e9lection':'Aucun jour applicable');
  }
  window.PLANNING_ENTRIES=PLANNING_ENTRIES;
  if(r.n>0&&window.fbSave)window.fbSave('planning_entries',PLANNING_ENTRIES);
  showToast(msg,r.n>0?PLAN_BG:'#E07060');
  if(!one)planSelClear();
  _pl2Refresh();
  if(one&&next===true&&day<_planDays(planMonth)){
    openPlanDayModal(nom,day+1);
  } else {
    closePlanDayModal();
  }
}

// ── Annuler la saisie d'une journee ──
// Supprime la SEULE entree du jour courant : le jour retombe sur le planning theorique.
// ⚠️ On ne supprime QUE le niveau jour. Nettoyer aussi les mois/annees/salaries devenus
//    vides ferait chuter Object.keys(PLANNING_ENTRIES) et pourrait reveiller la garde
//    anti-perte (chute de plus de moitie en une ecriture) sur un domaine a petit effectif.
// Pas de confirmation : le geste est immediatement refaisable (les modes sont juste au-dessus),
// et le projet ne confirme pas non plus la suppression d'un acompte.
function planClearDay(){
  if(!isAdmin()){showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#E07060');return;}
  if(!_planEdOne()||!_planEditDay)return;
  var nom=_planEditDay.nom, day=_planEditDay.day;
  var yb=_pEntYear(nom);
  var e=(yb&&yb[planMonth])?yb[planMonth][day]:null;
  if(!e){showToast('Rien \u00e0 annuler sur ce jour','#E07060');return;}
  delete yb[planMonth][day];
  window.PLANNING_ENTRIES=PLANNING_ENTRIES;
  if(window.fbSave)window.fbSave('planning_entries',PLANNING_ENTRIES);
  showToast('\u21a9 '+nom+' \u00b7 '+PLAN_JOURS[_planDow(planMonth,day)]+' '+day+' \u2014 saisie annul\u00e9e',PLAN_BG);
  _pl2Refresh();
  openPlanDayModal(nom,day);
}

// ════════════════════════════════════════════════════════════════════
// HORAIRES CHALEUR — planning aménagé (> 30°), par salarié
// Pose des horaires (6h–14h par défaut) sur les jours travaillés lun→ven
// d'une plage de dates, salarié par salarié. Week-ends, jours de repos,
// CP / récup / absences : conservés. Chaque entrée est marquée
// canicule:true → le bouton « Retirer » ne touche que ces jours-là.
// ════════════════════════════════════════════════════════════════════
function _planCaniculeFix(){
  // iOS Safari : innerHTML n'initialise pas .value des input date/time → forcer
  var _m={du:'planCanic-du',au:'planCanic-au',deb:'planCanic-deb',fin:'planCanic-fin'};
  Object.keys(_m).forEach(function(k){ var el=document.getElementById(_m[k]); if(el&&_planCanic[k]!=null)el.value=_planCanic[k]; });
}
function _planCanicSave(){
  try{ var tn=localStorage.getItem('mavigne_tenant')||''; localStorage.setItem('mavigne_canic_'+tn, JSON.stringify({deb:_planCanic.deb,fin:_planCanic.fin,continu:_planCanic.continu})); }catch(e){}
}
function _planHasCanicule(nom){
  var mE=PLANNING_ENTRIES[nom]; if(!mE)return false;
  return Object.keys(mE).some(function(yk){ var yr=mE[yk]; if(!yr||typeof yr!=='object')return false;
    return Object.keys(yr).some(function(mi){ var mo=yr[mi]; return mo&&typeof mo==='object'&&Object.keys(mo).some(function(d){return mo[d]&&mo[d].canicule;}); }); });
}
// (carte « Horaires chaleur » par salarié + planCaniculeToggle supprimées — remplacées par l'overlay ovPlanChaleur multi-salariés · refonte v5.08)
function planCaniculeReadInputs(){
  var du=(document.getElementById('planCanic-du')||{}).value; if(du)_planCanic.du=du;
  var au=(document.getElementById('planCanic-au')||{}).value; if(au)_planCanic.au=au;
  var deb=(document.getElementById('planCanic-deb')||{}).value; if(deb)_planCanic.deb=deb;
  var fin=(document.getElementById('planCanic-fin')||{}).value; if(fin)_planCanic.fin=fin;
}
function planCaniculeCalc(){
  planCaniculeReadInputs();
  var h=_planTimingH(_planCanic.deb,_planCanic.fin,_planCanic.continu);
  var c=document.getElementById('planCanic-calc'); if(c)c.textContent=_planFmt(h);
  var sub=document.getElementById('planCanic-calcsub'); if(sub)sub.textContent=_planCanic.continu?'continu':'\u22121h pause';
}
function planCaniculeToggleContinu(){
  planCaniculeReadInputs();
  _planCanic.continu=!_planCanic.continu; _planCanicSave();
  var on=_planCanic.continu, orL='rgba(217,119,6,0.4)';
  var btn=document.getElementById('planCanic-contbtn'); if(btn)btn.style.borderColor=on?'var(--orange)':orL;
  var chk=document.getElementById('planCanic-contchk');
  if(chk){ chk.style.background=on?'var(--orange)':'transparent'; chk.style.borderColor=on?'var(--orange)':orL; chk.innerHTML=on?'<span style="color:#fff;font-size:14px;line-height:1">\u2713</span>':''; }
  var lbl=document.getElementById('planCanic-contlbl'); if(lbl)lbl.style.color=on?'var(--orange)':'var(--texte-doux)';
  planCaniculeCalc();
}
function planCaniculeApply(nom){
  if(!isAdmin())return;
  var mbr=(window.MEMBRES||[]).find(function(m){return m.nom===nom;}); if(!mbr)return;
  planCaniculeReadInputs();
  var du=_planCanic.du, au=_planCanic.au, deb=_planCanic.deb, fin=_planCanic.fin, cont=_planCanic.continu;
  if(!du||!au){ showToast('Choisissez une plage de dates','#E07060'); return; }
  var a=new Date(du+'T00:00:00'), b=new Date(au+'T00:00:00');
  if(isNaN(a.getTime())||isNaN(b.getTime())||a>b){ showToast('Plage de dates invalide','#E07060'); return; }
  if(_planTimingH(deb,fin,cont)<=0){ showToast('Horaire invalide','#E07060'); return; }
  var plId=_planPlId(mbr), n=0, guard=0, cur=new Date(a);
  while(cur<=b&&guard<400){
    guard++;
    var dow=cur.getDay(), mi=cur.getMonth(), d=cur.getDate();
    _planCtxYear=cur.getFullYear();
    if(dow!==0&&dow!==6&&_planPlanned(plId,mi,d)>0&&_planInContract(mbr,mi,d)){
      var ex=_pEntDay(nom,mi,d);
      if(!(ex&&(ex.type==='cp'||ex.type==='recup'||ex.absent))){
        _pEntEnsure(nom,mi)[d]={timing:{debut:deb,fin:fin,continu:cont},canicule:true,comment:'Chaleur'};
        n++;
      }
    }
    _planCtxYear=null;
    cur.setDate(cur.getDate()+1);
  }
  _planCtxYear=null;
  window.PLANNING_ENTRIES=PLANNING_ENTRIES; _planCanicSave();
  if(n>0&&window.fbSave)window.fbSave('planning_entries',PLANNING_ENTRIES);
  if(n>0)showToast('\u2600\ufe0f '+n+' jour'+(n>1?'s':'')+' aménagé'+(n>1?'s':'')+' \u00b7 '+nom,'#D97706');
  else showToast('Aucun jour travaillé dans cette plage','#E07060');
  _pl2Refresh();
}
function planCaniculeRemove(nom){
  if(!isAdmin())return;
  var mE=PLANNING_ENTRIES[nom];
  if(!mE){ showToast('Aucun horaire chaleur','#E07060'); return; }
  var n=0;
  Object.keys(mE).forEach(function(yk){
    var yr=mE[yk]; if(!yr||typeof yr!=='object')return;
    Object.keys(yr).forEach(function(mi){
      var mo=yr[mi]; if(!mo||typeof mo!=='object')return;
      Object.keys(mo).forEach(function(d){ if(mo[d]&&mo[d].canicule){ delete mo[d]; n++; } });
    });
  });
  window.PLANNING_ENTRIES=PLANNING_ENTRIES;
  if(n>0&&window.fbSave)window.fbSave('planning_entries',PLANNING_ENTRIES);
  showToast(n>0?('Horaires chaleur retirés \u00b7 '+n+' jour'+(n>1?'s':'')):'Aucun horaire chaleur',n>0?'#D97706':'#E07060');
  _pl2Refresh();
}

// ── Export PDF feuille d'heures ──
function _planAcomptesCard(mbr,canEdit){
  var yr=planYear;
  var moisKey=yr+'-'+String(planMonth+1).padStart(2,'0');
  var list=((PLANNING_ACOMPTES[mbr.nom]||{})[moisKey]||[]).slice().sort(function(a,b){return a.date<b.date?-1:1;});
  var total=list.reduce(function(s,e){return s+e.montant;},0);
  var key=mbr.nom.replace(/[^a-zA-Z]/g,'');
  var html='<div class="plan-card" style="background:var(--orange-pale);border:1.5px solid rgba(217,119,6,0.5);margin-top:14px">';
  html+='<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--orange);margin-bottom:8px">\uD83D\uDCB6 Acomptes vers\u00e9s</div>';
  if(list.length>0){
    list.forEach(function(e,idx){
      var dp=e.date?e.date.split('-'):['','',''];
      var dateFmt=dp.length>=3?parseInt(dp[2],10)+'/'+parseInt(dp[1],10):'';
      html+='<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:0.5px solid rgba(217,119,6,0.35)">';
      html+='<span style="font-size:12px;color:var(--orange);min-width:44px">'+dateFmt+'</span>';
      html+='<span style="flex:1;font-size:13px;color:var(--orange)">'+_escHtml(e.note||'Acompte')+'</span>';
      html+='<span style="font-size:14px;font-weight:700;color:var(--orange)">'+e.montant.toLocaleString('fr-FR')+'&#8239;\u20ac</span>';
      if(canEdit)html+='<button onclick="planDeleteAcompte(\''+_escAttr(mbr.nom)+'\',\''+moisKey+'\','+idx+')" style="background:none;border:none;cursor:pointer;color:var(--orange);font-size:18px;padding:2px 6px;border-radius:4px;line-height:1;min-width:44px;min-height:44px">\u00d7</button>';
      html+='</div>';
    });
    html+='<div style="text-align:right;font-size:13px;font-weight:700;color:var(--orange);padding-top:8px">Total\u202f: '+total.toLocaleString('fr-FR')+'&#8239;\u20ac</div>';
  } else {
    html+='<div style="font-size:12px;color:var(--orange);font-style:italic;padding:4px 0">Aucun acompte ce mois</div>';
  }
  if(canEdit){
    html+='<div id="plan-ac-form-'+key+'" style="display:none;margin-top:10px;padding:10px;background:var(--orange-pale);border-radius:8px;border:0.5px solid rgba(217,119,6,0.35)">';
    html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">';
    html+='<div><div style="font-size:10px;font-weight:600;color:var(--orange);margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px">Date</div><input type="date" id="plan-ac-date-'+key+'" style="width:100%;font-size:14px;padding:9px 10px;border-radius:8px;border:0.5px solid rgba(217,119,6,0.35);background:var(--bg-card);color:var(--texte);font-family:inherit"></div>';
    html+='<div><div style="font-size:10px;font-weight:600;color:var(--orange);margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px">Montant (\u20ac)</div><input type="number" id="plan-ac-mt-'+key+'" style="width:100%;font-size:14px;padding:9px 10px;border-radius:8px;border:0.5px solid rgba(217,119,6,0.35);background:var(--bg-card);color:var(--texte);font-family:inherit" placeholder="ex\u202f: 200" min="1" step="1"></div>';
    html+='</div>';
    html+='<div style="margin-bottom:10px"><div style="font-size:10px;font-weight:600;color:var(--orange);margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px">Note (optionnel)</div><input type="text" id="plan-ac-note-'+key+'" style="width:100%;font-size:14px;padding:9px 10px;border-radius:8px;border:0.5px solid rgba(217,119,6,0.35);background:var(--bg-card);color:var(--texte);font-family:inherit" placeholder="Avance sur salaire"></div>';
    html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
    html+='<button onclick="planToggleAcForm(\''+_escAttr(mbr.nom)+'\')" style="padding:10px;border-radius:8px;border:0.5px solid rgba(217,119,6,0.35);background:var(--orange-pale);color:var(--orange);font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;min-height:44px">Annuler</button>';
    html+='<button onclick="planSaveAcompte(\''+_escAttr(mbr.nom)+'\',\''+moisKey+'\')" style="padding:10px;border-radius:8px;border:none;background:var(--orange);color:white;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;min-height:44px">Enregistrer</button>';
    html+='</div></div>';
    html+='<button id="plan-ac-add-'+key+'" onclick="planToggleAcForm(\''+_escAttr(mbr.nom)+'\')" style="width:100%;margin-top:10px;padding:10px 12px;background:rgba(217,119,6,0.1);border:1px dashed rgba(217,119,6,0.5);border-radius:8px;cursor:pointer;color:var(--orange);font-size:13px;font-weight:500;font-family:inherit;display:flex;align-items:center;gap:6px;justify-content:center;min-height:44px">+ Ajouter un acompte</button>';
  }
  html+='</div>';
  return html;
}

function planToggleAcForm(nom){
  var key=nom.replace(/[^a-zA-Z]/g,'');
  var form=document.getElementById('plan-ac-form-'+key);
  var addBtn=document.getElementById('plan-ac-add-'+key);
  if(!form)return;
  var isOpen=(form.style.display!=='none'&&form.style.display!=='');
  form.style.display=isOpen?'none':'block';
  if(addBtn)addBtn.style.display=isOpen?'flex':'none';
  if(!isOpen){
    var today=new Date();
    var yy=today.getFullYear(),mm=String(today.getMonth()+1).padStart(2,'0'),dd=String(today.getDate()).padStart(2,'0');
    var dEl=document.getElementById('plan-ac-date-'+key);
    var mEl=document.getElementById('plan-ac-mt-'+key);
    var nEl=document.getElementById('plan-ac-note-'+key);
    if(dEl){dEl.value=yy+'-'+mm+'-'+dd;}
    if(mEl){mEl.value='';setTimeout(function(){if(mEl)mEl.focus();},50);}
    if(nEl){nEl.value='';}
  }
}

function planSaveAcompte(nom,moisKey){
  var key=nom.replace(/[^a-zA-Z]/g,'');
  var dEl=document.getElementById('plan-ac-date-'+key);
  var mEl=document.getElementById('plan-ac-mt-'+key);
  var nEl=document.getElementById('plan-ac-note-'+key);
  var date=dEl?dEl.value:'';
  var montant=parseInt(mEl?mEl.value:'0')||0;
  var note=nEl?nEl.value.trim():'';
  if(!date||montant<=0){showToast('Date et montant obligatoires','var(--rouge)');return;}
  if(!PLANNING_ACOMPTES[nom])PLANNING_ACOMPTES[nom]={};
  if(!PLANNING_ACOMPTES[nom][moisKey])PLANNING_ACOMPTES[nom][moisKey]=[];
  PLANNING_ACOMPTES[nom][moisKey].push({date:date,montant:montant,note:note});
  window.PLANNING_ACOMPTES=PLANNING_ACOMPTES;
  if(window.fbSave)window.fbSave('planning_acomptes',PLANNING_ACOMPTES);
  showToast('\uD83D\uDCB6 Acompte enregistr\u00e9 \u2014 '+montant.toLocaleString('fr-FR')+'\u202f\u20ac','#2D7A27');
  _pl2Refresh();
}

function planDeleteAcompte(nom,moisKey,idx){
  if(!PLANNING_ACOMPTES[nom]||!PLANNING_ACOMPTES[nom][moisKey])return;
  var sorted=PLANNING_ACOMPTES[nom][moisKey].slice().sort(function(a,b){return a.date<b.date?-1:1;});
  sorted.splice(idx,1);
  PLANNING_ACOMPTES[nom][moisKey]=sorted;
  window.PLANNING_ACOMPTES=PLANNING_ACOMPTES;
  if(window.fbSave)window.fbSave('planning_acomptes',PLANNING_ACOMPTES);
  showToast('Acompte supprim\u00e9','var(--rouge)');
  _pl2Refresh();
}


// Contrat qui couvre le mois affiche. Retourne null si la fiche n'a qu'un seul
// contrat (comportement d'origine, aucun changement) OU si le mois est a cheval
// sur deux contrats (on montre alors le mois entier plutot que d'en amputer une
// moitie). Dans les deux cas le releve n'est JAMAIS blanc.
function _planCtrDuMois(mbr,m){
  var P=(typeof window._mvContrats==='function')?window._mvContrats(mbr):null;
  if(!P||P.length<2)return null;
  var mm=String(m+1).padStart(2,'0');
  var d0=_pY()+'-'+mm+'-01', d1=_pY()+'-'+mm+'-'+String(_planDays(m)).padStart(2,'0');
  var hit=P.filter(function(c){
    if(c.fin&&c.fin<d0)return false;
    if(c.debut&&c.debut>d1)return false;
    return true;
  });
  return hit.length===1?hit[0]:null;
}
function _planFmtJour(iso){
  if(!iso)return '';
  var p=String(iso).split('-');
  return p.length===3?(p[2]+'/'+p[1]+'/'+p[0]):iso;
}
function planExportPDF(nom){
  var mbr=(window.MEMBRES||[]).find(function(m){return m.nom===nom;});
  if(!mbr){showToast('Membre introuvable','#E07060');return;}
  var _ctr=_planCtrDuMois(mbr,planMonth);
  return _planSurContrat(_ctr,function(){ return _planExportPDF_(nom,mbr,_ctr); });
}
function _planExportPDF_(nom,mbr,_ctr){
  var _ctrTxt=_ctr?('Contrat du '+_planFmtJour(_ctr.debut||'')+(_ctr.fin?(' au '+_planFmtJour(_ctr.fin)):' \u2014 en cours')):'';
  var plId=_planPlId(mbr);
  var ent=_pEntMonth(nom,planMonth);
  var s=_planSummary(mbr,planMonth);
    var sup=_planSupMonth(mbr,planMonth);
  var recupH=_planRecupH(mbr,planMonth);
  var joursTrav=_planDaysWorked(mbr,planMonth);
  var paye=Math.min(Math.max(0,_planHsupPaye(nom,planMonth)),sup);
  var bank=_planBank(mbr,planMonth);
  var payBankP=Math.max(0,_planHsupPayeBank(nom,planMonth));
  var aPayer=paye+payBankP+bank.forced;   // idem carte ecran : tout ce qui est paye
  var yb=_planYearBalance(mbr,planMonth);
  var tc=mbr.type_contrat||'CDI';
  var total=_planDays(planMonth);
  var LBG={work:'#fff',supp:'#f0fdf4',continu:'#f5f3fc',reduit:'#fffbeb',cp:'#fffbeb',absent:'#fef2f2',recup:'#f5f3fc',ferie:'#fffbeb',wknd:'#fafaf9',off:'#fafaf9',extra:'#eff6ff',canicule:'#fff7ed'};
  var LFG={work:'#1c1917',supp:'#16a34a',continu:'#7B6DB8',reduit:'#d97706',cp:'#d97706',absent:'#dc2626',recup:'#7B6DB8',ferie:'#d97706',wknd:'#a8a29e',off:'#a8a29e',extra:'#1A4A7A',canicule:'#d97706'};
  function rowFor(d){
    if(!_planInContractCtr(mbr,planMonth,d))return '';
    var pl=_planPlanned(plId,planMonth,d);
    var e=ent[d];
    var dow=_planDow(planMonth,d);
    var st=_planDayStatus(plId,planMonth,d,e);
    var bg=LBG[st.t]||'#fff', fg=LFG[st.t]||'#1c1917';
    var tData=(st.t==='work'||st.t==='supp'||st.t==='continu'||st.t==='reduit'||st.t==='extra'||st.t==='canicule')?((e&&e.timing)||_planDefTiming(pl,plId,planMonth,d)):null;
    var tStr=tData?((tData.d||tData.debut)+'\u2192'+(tData.f||tData.fin)):'';
    var eff;
    if(st.t==='recup')eff=_planFmt(pl);
    // Une absence assimilee ou payee porte des heures : les masquer par un tiret
    // faisait mentir le total de la feuille, qui, lui, les comptait.
    else if(st.t==='absent'){ var _av=_planEffective(plId,planMonth,d,e); eff=_av>0?_planFmt(_av):'\u2014'; }
    else if(st.t==='cp')eff=_planFmt((e&&e.heures)||pl);
    else { var ev=_planEffective(plId,planMonth,d,e); eff=ev>0?_planFmt(ev):'\u2014'; }
    return '<tr style="background:'+bg+'">'
      +'<td class="c"><b style="color:var(--texte-med,#57534e)">'+d+'</b> <span style="color:#a8a29e;font-size:8.5px">'+PLAN_JOURS[dow]+'</span></td>'
      +'<td><span style="color:'+fg+';font-weight:'+(st.t==='work'||st.t==='wknd'||st.t==='off'?'500':'700')+'">'+st.l+'</span>'+(tStr?' <span style="color:#a8a29e;font-family:monospace;font-size:8.5px">'+tStr+'</span>':'')+'</td>'
      +'<td class="r2" style="font-weight:700;color:'+fg+'">'+eff+'</td>'
    +'</tr>';
  }
  var c1='',c2='';
  for(var d=1;d<=total;d++){ var r=rowFor(d); if(!r)continue; if(d<=15)c1+=r; else c2+=r; }
  var yr=planYear, mk=yr+'-'+String(planMonth+1).padStart(2,'0');
  var aco=((PLANNING_ACOMPTES[nom]||{})[mk]||[]).slice().sort(function(a,b){return a.date<b.date?-1:1;});
  var acoTot=aco.reduce(function(x,a){return x+a.montant;},0);
  var acoHtml='';
  if(aco.length){
    var acoItems=aco.map(function(a){var dp=(a.date||'').split('-');return a.montant.toLocaleString('fr-FR')+'\u202f\u20ac le '+(dp.length>=3?parseInt(dp[2],10)+'/'+parseInt(dp[1],10):'');}).join(' \u00b7 ');
    acoHtml='<div class="acomptes">\uD83D\uDCB6 Acomptes vers\u00e9s \u2014 '+acoItems+' \u2014 Total <b>'+acoTot.toLocaleString('fr-FR')+'\u202f\u20ac</b></div>';
  }
  // \u2605 Le chiffre que le gestionnaire cherche. Il est desormais TOUJOURS affiche,
  //   en tete de feuille : un bloc absent quand rien n'est a payer obligeait a relire
  //   tout le document pour en etre sur. Quand il n'y a rien a payer, le bloc le dit.
  var _apOn=(aPayer>0.0001);
  var _apSub;
  if(_apOn){
    _apSub=(payBankP>0.0001
      ?_planFmt(paye)+' faites en '+PLAN_MOIS_C[planMonth]+' + '+_planFmt(payBankP)+' prises sur le compteur'
      :_planFmt(paye)+' faites en '+PLAN_MOIS_C[planMonth])
      +' \u00b7 reste '+_planFmtE(yb.net)+' apr\u00e8s paiement';
  } else if(sup>0.0001){
    _apSub=_planFmt(sup)+' report\u00e9es au compteur \u00b7 reste \u00e0 prendre '+_planFmtE(yb.net);
  } else {
    _apSub='Aucune heure suppl\u00e9mentaire ce mois \u00b7 reste \u00e0 prendre '+_planFmtE(yb.net);
  }
  var apHtml='<div class="apay'+(_apOn?'':' off')+'">'
    +'<div><div class="t">Heures suppl\u00e9mentaires \u00e0 payer</div><div class="s">'+_apSub+'</div></div>'
    +'<div class="v">'+_planFmt(aPayer)+'</div></div>';
  var dom=(window.DOMAINE_NOM||'');
  // Janvier -> mois affiche, jamais au-dela. Un releve mensuel ne montre pas des
  // mois a venir : ils reposent sur du planning previsionnel, pas sur du travail fait.
  var _anLast=planMonth;
  var _anRows='',_anSup=0,_anRec=0,_anPm=0,_anPb=0,_anDue=0,_anOv=false;
  var _anDueA=[],_anAnyDue=false;
  for(var _dq=0;_dq<=_anLast;_dq++){_anDueA[_dq]=_planDuesMonth(mbr,_dq);if(_anDueA[_dq]>0.0001)_anAnyDue=true;}
  for(var _i=0;_i<=_anLast;_i++){
    var _sp=_planSupMonth(mbr,_i),_rc=_planRecupH(mbr,_i);
    var _pm=Math.min(Math.max(0,_planHsupPaye(nom,_i)),_sp);
    var _pb=Math.max(0,_planHsupPayeBank(nom,_i));
    var _isOv=_planHsupSupOv(nom,_i)!=null;
    if(_isOv)_anOv=true;
    _anSup+=_sp;_anRec+=_rc;_anPm+=_pm;_anPb+=_pb;_anDue+=(_anDueA[_i]||0);
    var _cum=_planYearBalance(mbr,_i).net;
    _anRows+='<tr'+(_i===planMonth?' style="background:#f8f6fd"':'')+'>'
      +'<td'+(_i===planMonth?' style="font-weight:700"':'')+'>'+PLAN_MOIS[_i]+(_isOv?' *':'')+'</td>'
      +'<td class="r2" style="color:'+(_sp>0.0001?'#16a34a':'#d6d3d1')+'">'+(_sp>0.0001?'+':'')+_planFmt(_sp)+'</td>'
      +'<td class="r2" style="color:'+(_rc>0.0001?'#dc2626':'#d6d3d1')+'">'+(_rc>0.0001?'\u2212':'')+_planFmt(_rc)+'</td>'
      +(_anAnyDue?('<td class="r2" style="color:'+(_anDueA[_i]>0.0001?'#dc2626':'#d6d3d1')+'">'+(_anDueA[_i]>0.0001?'\u2212':'')+_planFmt(_anDueA[_i])+'</td>'):'')
      +'<td class="r2" style="color:'+((_pm+_pb)>0.0001?'#1c1917':'#d6d3d1')+'">'+_planFmt(_pm+_pb)+'</td>'
      +'<td class="r2 hi" style="font-weight:700;color:'+(_cum>=-0.0001?'#16a34a':'#dc2626')+'">'+_planFmtE(_cum)+'</td>'
    +'</tr>';
  }
  var _anNet=_planYearBalance(mbr,_anLast).net;
  var _anTrTxt=bank.tr.map(function(t){return t.dep?('Report '+_planFmt(t.h)):(PLAN_MOIS_C[t.mois]+' '+_planFmt(t.h)+' (il y a '+(planMonth-t.mois)+' mois)');}).join(' \u00b7 ');
  // Compteur d'annualisation — le chiffre qui a valeur legale, a cote du releve mensuel
  var _an=_planAnnu(mbr,planMonth);
  var _anOver=(_an.cumul>_an.plafond+0.0001);
  var _anMod=(_an.modul>_an.modulMax+0.0001);
  var annuCptHtml=_an.annualise
  ? ('<div class="soldean"><div class="t">\u23f1 Compteur d\u2019heures \u2014 ann\u00e9e '+planYear+' (au '+PLAN_MOIS_C[planMonth]+')</div>'
    +'<span class="it">Plafond annuel <b>'+_planFmt(_an.plafond)+'</b></span>'
    +'<span class="it">Travail effectif <b>'+_planFmt(_an.cumul)+'</b></span>'
    +'<span class="it">'+(_an.reste<0?'Au-dessus':'Reste \u00e0 faire')+' <b style="color:'+(_anOver?'#d97706':'#16a34a')+'">'+_planFmt(Math.abs(_an.reste))+'</b></span>'
    +'<span class="it">Modulation <b style="color:'+(_anMod?'#dc2626':'#7B6DB8')+'">'+_planFmt(_an.modul)+' / '+_planFmt(_an.modulMax)+'</b></span>'
    +(_an.susp>0.0001?'<span class="it">Dont suspension <b style="color:#dc2626">\u2212'+_planFmt(_an.susp)+'</b></span>':'')
    +'<div style="font-size:9.5px;color:#78716c;margin-top:5px;line-height:1.4">Travail effectif\u00a0: hors cong\u00e9s pay\u00e9s, arr\u00eats et r\u00e9cup\u00e9rations. Le solde se r\u00e8gle \u00e0 la cl\u00f4ture du 31 d\u00e9cembre.</div>'
  +'</div>')
  : ('<div class="soldean"><div class="t">\u23f1 Heures faites \u2014 ann\u00e9e '+planYear+' (au '+PLAN_MOIS_C[planMonth]+')</div>'
    +'<span class="it">Travail effectif <b>'+_planFmt(_an.cumul)+'</b></span>'
    +'<span class="it">Type de contrat <b>'+_escHtml(tc)+'</b></span>'
    +'<div style="font-size:9.5px;color:#78716c;margin-top:5px;line-height:1.4">Pay\u00e9 \u00e0 l\u2019heure\u00a0: pas d\u2019annualisation, donc ni plafond annuel, ni modulation, ni solde \u00e0 la cl\u00f4ture. Travail effectif\u00a0: hors cong\u00e9s pay\u00e9s, arr\u00eats et r\u00e9cup\u00e9rations.</div>'
  +'</div>');
  var annuHtml='<div class="annu"><div class="t">\ud83d\udcc5 D\u00e9tail mois par mois \u2014 ann\u00e9e '+planYear+'</div>'
    +'<table><thead><tr><th>Mois</th><th class="r2" style="width:52px">Sup.</th><th class="r2" style="width:52px">R\u00e9cup</th>'+(_anAnyDue?'<th class="r2" style="width:56px">Heures dues</th>':'')+'<th class="r2" style="width:62px">Pay\u00e9</th><th class="r2 hi" style="width:72px">Reste \u00e0 prendre</th></tr></thead>'
    +'<tbody>'+_anRows+'</tbody>'
    +'<tfoot><tr><td>Total</td>'
      +'<td class="r2" style="color:#16a34a">'+(_anSup>0.0001?'+':'')+_planFmt(_anSup)+'</td>'
      +'<td class="r2" style="color:#dc2626">'+(_anRec>0.0001?'\u2212':'')+_planFmt(_anRec)+'</td>'
      +(_anAnyDue?('<td class="r2" style="color:#dc2626">'+(_anDue>0.0001?'\u2212':'')+_planFmt(_anDue)+'</td>'):'')
      +'<td class="r2">'+_planFmt(_anPm+_anPb)+'</td>'
      +'<td class="r2 hi" style="color:'+(_anNet>=-0.0001?'#16a34a':'#dc2626')+'">'+_planFmtE(_anNet)+'</td>'
    +'</tr></tfoot></table>'
    +'<div class="note">'+(_anOv?'<b>*</b> valeur ajust\u00e9e manuellement (hors calcul du planning). ':'')
      +'Reste \u00e0 prendre = report de d\u00e9part + heures sup cumul\u00e9es \u2212 r\u00e9cup\u00e9rations \u2212 heures pay\u00e9es'+(_anAnyDue?' \u2212 heures dues (absence injustifi\u00e9e ou retard).':'.')
      +(_anTrTxt?'<br>Compteur au '+PLAN_MOIS_C[planMonth]+' : <b>'+_planFmt(bank.solde)+'</b> \u2014 '+_anTrTxt+'. Le solde se r\u00e8gle \u00e0 la cl\u00f4ture du 31 d\u00e9cembre.':'')
    +'</div></div>';
  var html='<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">'
    +'<title>Heures \u2014 '+nom+' \u2014 '+PLAN_MOIS[planMonth]+' '+planYear+'</title>'
    +'<link rel="stylesheet" href="/fonts/fonts.css">'
    +'<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:\'Outfit\',system-ui,-apple-system,sans-serif;color:#1c1917;background:#fff}'
    +'.sheet{padding:6px}.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e7e5e4;padding-bottom:9px;margin-bottom:10px}'
    +'.hdr h1{font-size:19px;font-weight:800}.hdr .sub{font-size:11px;color:#78716c;margin-top:3px}.badge{display:inline-block;background:#f1eefa;color:#7B6DB8;font-weight:700;font-size:9px;padding:1px 7px;border-radius:6px;margin-right:6px}'
    +'.mo{font-size:17px;font-weight:700;color:#7B6DB8;text-align:right}.etp{font-size:10px;color:#a8a29e;text-align:right;margin-top:3px}'
    +'.summ{display:flex;gap:6px;margin-bottom:9px}.box{flex:1;background:#fafaf9;border:1px solid #e7e5e4;border-radius:6px;padding:6px 4px;text-align:center}.box .v{font-size:16px;font-weight:800}.box .l{font-size:8px;color:#a8a29e;text-transform:uppercase;letter-spacing:.5px;margin-top:1px}'
    +'.apay{display:flex;align-items:center;justify-content:space-between;border:2px solid #b45309;background:#fffbeb;border-radius:8px;padding:8px 13px;margin-bottom:9px}.apay .t{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#b45309}.apay .s{font-size:10px;color:#78716c;margin-top:2px}.apay .v{font-size:26px;font-weight:800;color:#b45309;line-height:1}.apay.off{border:1.5px solid #e7e5e4;background:#fafaf9}.apay.off .t{color:#78716c}.apay.off .v{color:#a8a29e}'
    +'.soldean{border:1.5px solid #d8c3a3;background:#faf6ef;border-radius:8px;padding:7px 12px;margin-bottom:9px;display:flex;flex-wrap:wrap;gap:4px 16px;align-items:center}.soldean .t{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#8A5A38;width:100%;margin-bottom:1px}.soldean .it{font-size:11px;color:#57534e}.soldean .it b{font-size:12px}.soldean .net{margin-left:auto;font-size:14px;font-weight:800}'
    +'.days{display:flex;gap:14px}.col{flex:1}table{width:100%;border-collapse:collapse}thead tr{background:#1C1A2E;color:#fff}th{padding:4px 6px;text-align:left;font-size:8px;text-transform:uppercase;letter-spacing:.4px;font-weight:700}th.c,td.c{text-align:center}th.r2,td.r2{text-align:right}td{padding:2px 6px;border-bottom:1px solid #f0ece8;font-size:9.5px;line-height:1.2}'
    +'.annu th.hi,.annu td.hi{background:#f7f3ec}.annu thead th.hi{background:#2c2942}.ctr{border:1.5px solid #d8c3a3;background:#faf6ef;border-radius:8px;padding:7px 12px;margin-bottom:9px;page-break-inside:avoid}.ctr .t{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#8A5A38;margin-bottom:4px}.crow{display:flex;justify-content:space-between;gap:12px;font-size:10px;color:#44403c;padding:2px 0;border-bottom:1px solid #efe7da}.crow:last-of-type{border-bottom:none}.crow .cv{white-space:nowrap;color:#78716c}.cgap .cl,.cgap .cv{color:#a8a29e;font-style:italic}.cbreak{background:repeating-linear-gradient(135deg,#fff,#fff 4px,#faf3ea 4px,#faf3ea 8px)}.cbreak .cl,.cbreak .cv{color:#b45309;font-style:normal}.cnow{font-size:8px;text-transform:uppercase;letter-spacing:.4px;color:#16a34a;background:#f0fdf4;border-radius:8px;padding:1px 5px;margin-left:4px}.annu{margin-top:10px;page-break-inside:avoid}.annu .t{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#8A5A38;margin-bottom:5px}.annu tfoot td{border-top:1.5px solid #d4d0cc;border-bottom:none;font-weight:800;background:#fafaf9}.annu .note{font-size:8.5px;color:#a8a29e;margin-top:5px;line-height:1.45}.annu .note b{color:#78716c}'
    +'.acomptes{margin-top:8px;font-size:10px;color:#92400e;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:7px 12px}.acomptes b{color:#b45309}'
    +'.foot{margin-top:16px;display:flex;gap:40px}.sig{flex:1;border-top:1px solid #d4d0cc;padding-top:6px;font-size:10px;color:#a8a29e;text-align:center}.credit{margin-top:14px;font-size:8px;color:#cbc7c2;text-align:center}'
    +'@media print{@page{size:A4;margin:10mm}}</style></head><body><div class="sheet">'
    +'<div class="hdr"><div><h1>\uD83C\uDF47 Feuille d\'heures</h1><div class="sub"><span class="badge">'+tc+'</span>'+nom+' \u00b7 Planning '+plId+'</div>'
      +(_ctrTxt?('<div class="sub" style="margin-top:2px;font-weight:600;color:#8A5A38">'+_escHtml(_ctrTxt)+'</div>'):'')
    +'</div>'
    +'<div><div class="mo">'+PLAN_MOIS[planMonth]+' '+planYear+'</div><div class="etp">ETP '+_planFmtEtp(s.etp)+'</div></div></div>'
    +apHtml
    +'<div class="summ">'
      +'<div class="box"><div class="v">'+_planFmt(s.ref)+'</div><div class="l">R\u00e9f\u00e9rence</div></div>'
      +'<div class="box"><div class="v">'+_planFmt(s.worked)+'</div><div class="l">Travaill\u00e9</div></div>'
      +'<div class="box"><div class="v" style="color:'+(s.ecart>=0?'#16a34a':'#dc2626')+'">'+_planFmtE(s.ecart)+'</div><div class="l">\u00c9cart</div></div>'
      +'<div class="box"><div class="v">'+joursTrav+'</div><div class="l">Jours travaill\u00e9s</div></div>'
      +'<div class="box"><div class="v" style="color:var(--phyto-med,#7B6DB8)">'+_planFmt(recupH)+'</div><div class="l">R\u00e9cup prise</div></div>'
      +'<div class="box"><div class="v" style="color:var(--phyto-med,#7B6DB8)">'+_planFmt(bank.solde)+'</div><div class="l">Compteur</div></div>'
    +'</div>'
    +_plRvContratsHtml(mbr)
    +_plRvCpHtml(mbr)
    +annuCptHtml
    +'<div class="days"><div class="col"><table><thead><tr><th class="c" style="width:34px">Jr</th><th>Statut</th><th class="r2" style="width:42px">Eff.</th></tr></thead><tbody>'+c1+'</tbody></table></div>'
    +'<div class="col"><table><thead><tr><th class="c" style="width:34px">Jr</th><th>Statut</th><th class="r2" style="width:42px">Eff.</th></tr></thead><tbody>'+c2+'</tbody></table></div></div>'
    +annuHtml
    +acoHtml
    +'<div class="foot"><div class="sig">Signature salari\u00e9</div><div class="sig">Signature employeur</div></div>'
    +'<div class="credit">'+(dom?dom+' \u00b7 ':'')+'Ma Vigne \u00b7 GUERETTECH</div>'
    +'</div><script>setTimeout(function(){window.print();},400);<\/script></body></html>';
  var w=window.open('','_blank');
  if(w){w.document.write(html);w.document.close();}
  else showToast('Autorisez les popups pour le PDF','#E07060');
}

// (updateHubPlanCard supprimée — hub purgé, plus aucun appelant · refonte v5.08)


// ════════════════════════════════════════════════════════════════════
// PLANNING DE L'ANNÉE — le document que l'équipe emporte
// ════════════════════════════════════════════════════════════════════
// Le relevé mensuel dit ce qui a été fait ; celui-ci dit ce qui est prévu.
// Il se lit à trois hauteurs : l'ouvrier y cherche ses heures de prise et de
// fin de service, le chef y cherche les semaines creuses, la paie y cherche
// la coupure déjeuner et une date d'édition.
//
// ⚠️ Une page par MODÈLE de semaine, jamais par salarié : quand cinq personnes
// suivent le même rythme, cinq feuilles identiques n'apprennent rien.
//
// ⚠️ Toutes les lectures passent l'année en argument. `_planGetTpl(plId,yr)` et
// `_planDefTiming(pl,plId,m,d,yr)` retombent sur l'année SÉLECTIONNÉE quand on
// l'omet : un document tiré pour 2027 depuis un écran calé sur 2026 afficherait
// les horaires de 2026 sans rien signaler.

function _paFmt(h){
  if(!h) return '';
  return (h===Math.round(h)) ? String(h) : String(h).replace('.',',');
}
function _paMin(t){ var p=String(t||'').split(':'); return (parseInt(p[0],10)||0)*60+(parseInt(p[1],10)||0); }
function _paDuree(min){
  var h=min/60;
  return (h===Math.round(h)) ? String(h) : (Math.round(h*10)/10).toString().replace('.',',');
}

// Les membres regroupés par modèle. Un membre dont le contrat ne couvre aucun
// jour de l'année cible n'a pas à figurer : _planInContract lit _pY() en dur,
// donc on refait la comparaison ici avec l'année demandée.
function _paGroupes(yr){
  var out={}, mbrs=(typeof _planMbrs==='function')?_planMbrs():[];
  mbrs.forEach(function(mb){
    var d0=mb.debut_contrat||'', f0=mb.fin_contrat||'';
    if(d0 && d0>String(yr)+'-12-31') return;
    if(f0 && f0<String(yr)+'-01-01') return;
    var id=_planPlId(mb);
    if(!out[id]) out[id]={id:id,noms:[]};
    out[id].noms.push(mb.nom||mb.prenom||'—');
  });
  return Object.keys(out).map(function(k){ return out[k]; });
}

// La grille de l'année : heures prévues par jour, fériés remis à zéro.
// \u2605 3e argument OPTIONNEL : sans lui, comportement d'origine mot pour mot
//   (le document par modele de semaine ne change pas d'une virgule). Avec lui,
//   les jours hors contrat tombent a 0 : un planning nominatif qui montrerait
//   janvier a une apprentie embauchee en septembre serait faux des la 1re ligne.
// \u26a0\ufe0f _planInContract lit _pY() en dur — on refait donc la comparaison ici
//   avec l'annee DEMANDEE, comme _paGroupes le fait deja pour la meme raison.
function _paPeriodes(mbr){
  if(!mbr) return null;
  if(typeof window!=='undefined' && typeof window._mvPeriodes==='function'){
    var P=window._mvPeriodes(mbr)||[];
    if(P.length) return P;
  }
  var d0=mbr.debut_contrat||'', f0=mbr.fin_contrat||'';
  return (d0||f0) ? [{debut:d0,fin:f0}] : null;
}
function _paSousContrat(per,iso){
  if(!per) return true;                       // aucun contrat connu : on ne masque rien
  for(var i=0;i<per.length;i++){
    var a=per[i].debut||'', b=per[i].fin||'';
    if(a && iso<a) continue;
    if(b && iso>b) continue;
    return true;
  }
  return false;
}
function _paGrille(plId,yr,mbr){
  var g={}, per=_paPeriodes(mbr);
  for(var m=0;m<12;m++){
    var n=new Date(yr,m+1,0).getDate();
    g[m]={};
    for(var d=1;d<=n;d++){
      if(per){
        var _iso=yr+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
        if(!_paSousContrat(per,_iso)){ g[m][d]=0; continue; }
      }
      // Le modele fait foi. Un ferie ou un dimanche sur lequel le planning porte
      // des heures est un jour TRAVAILLE : ecraser sa valeur par 0 remplacerait
      // une donnee reelle par une regle supposee, et l'equipe decouvrirait le
      // 14 juillet sur le terrain.
      g[m][d]=parseFloat(_planPlanned(plId,m,d,yr))||0;
    }
  }
  return g;
}

// \u2605\u2605 CE QUI EST DEJA POSE SUR LE CALENDRIER DE LA PERSONNE.
// Le planning previsionnel sort du MODELE ; les jours d'ecole, eux, sont saisis
// comme entrees. Sans cette lecture, le planning d'une alternante afficherait
// ses semaines de CFA comme des semaines au domaine — le document serait juste
// pour le modele et faux pour elle.
// \u26a0\ufe0f Lecture DIRECTE du store a l'annee demandee : _pEntMonth passe par _pY(),
//   qui rend l'annee AFFICHEE et non celle du document.
var _PA_MK={ecole:'CFA',cp:'CP',rec:'R\u00e9c',abs:'Abs'};
function _paMarques(nom,yr){
  var MK={};
  try{
    var base=(PLANNING_ENTRIES||{})[nom];
    var an=base&&base[yr];
    if(!an) return MK;
    for(var m=0;m<12;m++){
      var mo=an[m]; if(!mo) continue;
      for(var d in mo){
        var e=mo[d]; if(!e) continue;
        var k=null;
        if(e.type==='cp')          k='cp';
        else if(e.type==='recup')  k='rec';
        else if(e.absent){
          var mo2=_planAbsMotif(e);
          k=mo2.assim?'ecole':'abs';   // assimile travail effectif = formation / evenement familial
        }
        if(!k) continue;
        if(!MK[m]) MK[m]={};
        MK[m][parseInt(d,10)]=k;
      }
    }
  }catch(err){
    if(typeof window!=='undefined' && window.logError)
      window.logError({level:'warning',cat:'planning',msg:'_paMarques : '+(err&&err.message)});
  }
  return MK;
}

// Un modèle est RÉGULIER si, dans chaque mois, la durée dominante de chaque jour
// de semaine couvre au moins 70 % des cas. En dessous, résumer par « lundi–jeudi
// 7 h » inventerait une régularité absente : on bascule sur une clé de lecture.
function _paRegulier(g,yr){
  var ok=0;
  for(var m=0;m<12;m++){
    var byd={}, vide=true;
    for(var d in g[m]){
      var h=g[m][d]; if(!(h>0)) continue;
      vide=false;
      var w=new Date(yr,m,parseInt(d,10)).getDay(); w=(w+6)%7;
      (byd[w]=byd[w]||[]).push(h);
    }
    if(vide){ ok++; continue; }
    var mini=1;
    Object.keys(byd).forEach(function(w){
      var c={}, best=0;
      byd[w].forEach(function(v){ c[v]=(c[v]||0)+1; if(c[v]>best) best=c[v]; });
      var r=best/byd[w].length; if(r<mini) mini=r;
    });
    if(mini>=0.7) ok++;
  }
  return ok>=8;
}

// Prise de service, fin de service, et coupure DÉDUITE de l'écart entre
// l'amplitude et les heures dues. Rien n'est écrit en dur : l'heure de début de
// coupure n'existe pas en base, donc le document ne la prétend pas connue.
function _paHoraire(h,plId,m,yr,d){
  var t=_planDefTiming(h,plId,m,d,yr)||{};
  var d0=t.d||'07:00', f0=t.f||'';
  if(!f0) return null;
  var amp=_paMin(f0)-_paMin(d0);
  // `continu` vient du CSV (colonne 5) et de nulle part ailleurs. Le fallback
  // PLAN_DEF_T ne porte pas ce champ : absent ne veut pas dire vrai.
  var ch=(typeof _planCoupureH==='function')?_planCoupureH(m,plId,yr):'';
  var cq=(typeof _planCoupureTxt==='function')?_planCoupureTxt(m,plId,yr):'';
  return { d:d0, f:f0, amp:amp, coup:Math.max(0,amp-Math.round(h*60)),
           continu:(t.continu===true), ch:(ch==='libre'?'':ch), cq:cq };
}
// Les trois cas, dans les mots que le modal du planning emploie deja.
function _paPause(t,creneauxVisibles){
  if(t.coup>0){
    // Si les creneaux affichent deja l'heure, la redire ici allonge la ligne
    // au point de la faire deborder du bloc.
    var q=(!creneauxVisibles&&t.cq)?(' '+t.cq):'';
    return _paDuree(t.amp)+' h de pr\u00e9sence \u00b7 <b>'+_paDuree(t.coup)+' h de coupure</b>'+q;
  }
  if(t.continu) return 'horaire continu';
  return 'sans coupure (moins de 6\u00a0h)';
}
// La journee coupee en deux, quand le domaine a dit a quelle heure. Sinon on
// rend les deux bornes seules : mieux vaut une information manquante qu'une
// information inventee.
function _paCreneaux(t,e){
  if(t.coup>0&&/^\d{1,2}:\d{2}$/.test(t.ch||'')){
    var p0=_paMin(t.ch), p1=p0+t.coup;
    if(p0>_paMin(t.d)&&p1<_paMin(t.f)){
      var s2=function(x){return String(Math.floor(x/60)).padStart(2,'0')+':'+String(x%60).padStart(2,'0');};
      return '<b>'+e(t.d)+'</b><i>\u2192</i><b>'+e(s2(p0))+'</b><em>\u00b7</em><b>'+e(s2(p1))+'</b><i>\u2192</i><b>'+e(t.f)+'</b>';
    }
  }
  return '<b>'+e(t.d)+'</b><i>\u2192</i><b>'+e(t.f)+'</b>';
}

// Les codes jour du modele (D/M/A). Une duree ne suffit pas a designer un
// horaire : deux jours de 6,5 h peuvent valoir 08:00-15:30 et 09:00-16:30.
function _paCodes(plId,yr){
  var tpl=_planGetTpl(plId,yr)||{};
  return tpl._timings_jour||{};
}
var _PA_JL=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
var _PA_JA=['L','M','M','J','V','S','D'];
var _PA_MO=['Janvier','F\u00e9vrier','Mars','Avril','Mai','Juin','Juillet','Ao\u00fbt','Septembre','Octobre','Novembre','D\u00e9cembre'];
var _PA_MA=['JANV','F\u00c9VR','MARS','AVRIL','MAI','JUIN','JUIL','AO\u00dbT','SEPT','OCT','NOV','D\u00c9C'];

function _paPlage(ws){
  ws=ws.slice().sort(function(a,b){return a-b;});
  if(ws.length===1) return _PA_JL[ws[0]];
  var suite=true;
  for(var i=1;i<ws.length;i++) if(ws[i]!==ws[i-1]+1) suite=false;
  if(suite) return _PA_JL[ws[0]]+'\u2013'+_PA_JL[ws[ws.length-1]].toLowerCase();
  return ws.map(function(w){return _PA_JL[w].slice(0,2);}).join(' \u00b7 ');
}

// Signature d'un mois : la durée dominante de chaque jour de semaine. Deux mois
// de même signature se regroupent, ce qui donne des blocs « mai – août » plutôt
// que douze colonnes qui répètent la même chose.
function _paSig(g,m,yr){
  var byd={}, tot={};
  for(var d in g[m]){
    var w=new Date(yr,m,parseInt(d,10)).getDay(); w=(w+6)%7;
    tot[w]=(tot[w]||0)+1;
    var h=g[m][d]; if(!(h>0)) continue;
    (byd[w]=byd[w]||[]).push(h);
  }
  // Un jour de semaine n'entre dans le bandeau que s'il est travaille au moins
  // une fois sur deux dans le mois. Sinon c'est une EXCEPTION : l'annoncer comme
  // un rythme ferait lire « tous les samedis » la ou il n'y en a qu'un.
  return Object.keys(byd).sort(function(a,b){return a-b;}).filter(function(w){
    return byd[w].length*2 >= (tot[w]||1);
  }).map(function(w){
    var c={}, best=0, val=0;
    byd[w].forEach(function(v){ c[v]=(c[v]||0)+1; if(c[v]>best){best=c[v];val=v;} });
    return w+':'+val;
  }).join('|');
}
// Les jours travailles que le bandeau ne couvre pas : ils existent, ils sont
// dans la grille, et le document doit dire ou les chercher plutot que les taire.
function _paExceptions(g,yr){
  var n=0, F=(typeof _feriesY==='function')?_feriesY(yr):{};
  for(var m=0;m<12;m++){
    var gard={};
    _paSig(g,m,yr).split('|').forEach(function(p){ if(p) gard[p.split(':')[0]]=1; });
    for(var d in g[m]){
      if(!(g[m][d]>0)) continue;
      var dd=parseInt(d,10);
      var w=new Date(yr,m,dd).getDay(); w=(w+6)%7;
      if(!gard[w] || (F[m]&&F[m][dd])) n++;
    }
  }
  return n;
}

function _paBandeau(g,plId,yr,reg){
  var e=window._escHtml||function(x){return String(x==null?'':x);};
  var _paCoupe=false;
  if(reg){
    var grp=[], prev=null;
    for(var m=0;m<12;m++){
      var s=_paSig(g,m,yr);
      if(prev && prev.s===s){ prev.ms.push(m); }
      else { prev={s:s,ms:[m]}; grp.push(prev); }
    }
    var blocs=grp.map(function(gr){
      var byh={};
      gr.s.split('|').forEach(function(p){
        if(!p) return;
        var a=p.split(':'), w=parseInt(a[0],10), h=parseFloat(a[1]);
        (byh[h]=byh[h]||[]).push(w);
      });
      var hs=Object.keys(byh).map(Number).sort(function(a,b){return b-a;});
      var coupe=false;
      var lignes=hs.map(function(h){
        var t=_paHoraire(h,plId,gr.ms[0],yr);
        if(!t) return '';
        if(t.coup>0) coupe=true;
        var cr  = _paCreneaux(t,e);
        var det = _paPause(t, cr.indexOf('<em>')>=0);
        return '<div class="pa-hl"><div class="pa-hlt"><span class="pa-hj">'+e(_paPlage(byh[h]))+'</span>'
             + '<span class="pa-hn">'+_paFmt(h)+' h</span></div>'
             + '<div class="pa-hh">'+cr+'</div>'
             + '<span class="pa-hd2">'+det+'</span></div>';
      }).join('');
      if(!lignes) return '';
      var lbl = (gr.ms.length===1) ? _PA_MO[gr.ms[0]]
              : _PA_MO[gr.ms[0]]+' \u2013 '+_PA_MO[gr.ms[gr.ms.length-1]].toLowerCase();
      if(coupe)_paCoupe=true;
      return '<div class="pa-hb"><div class="pa-hm">'+e(lbl)+'</div>'+lignes+'</div>';
    }).filter(Boolean).join('');
    if(!blocs) return '';
    var note = _paCoupe
      ? 'La coupure d\u00e9jeuner n\u2019est pas travaill\u00e9e : les dur\u00e9es indiqu\u00e9es sont les heures dues.'
      : 'Pr\u00e9sence et heures dues sont identiques : aucune coupure \u00e0 d\u00e9duire.';
    return '<div class="pa-hz">'+blocs+'</div><div class="pa-hnote">'+note+'</div>';
  }
  // Modèle irrégulier : une clé de lecture bâtie sur les horaires REELLEMENT
  // observés, jour par jour. Un code jour (D/M/A) donne deux horaires differents
  // pour une meme duree : grouper par duree seule fabrique une correspondance
  // fausse. On groupe donc par (code, debut, fin).
  var vus={}, CO=_paCodes(plId,yr);
  for(var mm=0;mm<12;mm++) for(var dd in g[mm]){
    var hh=g[mm][dd]; if(!(hh>0)) continue;
    var di=parseInt(dd,10);
    var co=(CO[mm]&&CO[mm][di])||'';
    var t=_paHoraire(hh,plId,mm,yr,di);
    if(!t) continue;
    var k=co+'|'+t.d+'|'+t.f;
    if(!vus[k]) vus[k]={code:co,d:t.d,f:t.f,coup:t.coup,continu:t.continu,h:{},n:0};
    vus[k].h[hh]=1; vus[k].n++;
  }
  var ks=Object.keys(vus).sort(function(a,b){ return vus[b].n-vus[a].n; });
  if(!ks.length) return '';
  var cles=ks.map(function(k){
    var v=vus[k];
    var ds=Object.keys(v.h).map(Number).sort(function(a,b){return a-b;}).map(_paFmt).join(' / ');
    return '<span class="pa-kc"><u>'+(v.code?e(v.code):ds+' h')+'</u>'
         + '<b>'+e(v.d)+'</b><i>\u2192</i><b>'+e(v.f)+'</b>'
         + '<em>'+(v.code?(ds+' h \u00b7 '):'')
         + (v.coup>0?('coupure '+_paDuree(v.coup)+' h'):(v.continu?'continu':'sans coupure'))
         + ' \u00b7 '+v.n+' j</em></span>';
  }).join('');
  var aCode=ks.some(function(k){ return vus[k].code; });
  return '<div class="pa-hz pa-solo"><div class="pa-hb pa-full">'
       + '<div class="pa-hm">Horaires \u2014 dur\u00e9e variable d\u2019un jour \u00e0 l\u2019autre</div>'
       + '<div class="pa-hkl">La grille donne la dur\u00e9e de chaque journ\u00e9e. Cette cl\u00e9 donne l\u2019heure de prise '
       + 'et de fin de service correspondante, et la coupure d\u00e9jeuner comprise dedans.'
       + (aCode?' Les journ\u00e9es \u00e0 horaire particulier portent leur lettre dans la grille, '
               +'juste apr\u00e8s les heures.':'')
       + '</div>'
       + '<div class="pa-hk">'+cles+'</div></div></div>';
}

// \u2605 5e argument OPTIONNEL (MK). Omis \u2192 grille d'origine inchangee.
function _paGrilleHtml(g,yr,reg,plId,MK){
  var F=(typeof _feriesY==='function')?_feriesY(yr):{};
  var CO=plId?_paCodes(plId,yr):{};
  MK=MK||{};
  var cols='';
  for(var m=0;m<12;m++){
    var n=new Date(yr,m+1,0).getDate(), vals=[], k;
    for(k in g[m]) if(g[m][k]>0) vals.push(g[m][k]);
    var mn=vals.length?Math.min.apply(null,vals):0, mx=vals.length?Math.max.apply(null,vals):0;
    var cells='', tot=0, nj=0;
    for(var d=1;d<=31;d++){
      if(d>n){ cells+='<div class="pa-c pa-void"></div>'; continue; }
      var w=new Date(yr,m,d).getDay(); w=(w+6)%7;
      var h=g[m][d]||0, fe=(F[m]&&F[m][d])?true:false;
      var cl='pa-c';
      // Le fond dit le CALENDRIER (ferie, week-end, fermeture) ; le lisere dit
      // qu'on travaille quand meme. Les deux informations ne se remplacent pas.
      if(fe)          cl+=' pa-fer'+(h?' pa-hors':'');
      else if(w>=5)   cl+=h ? ' pa-we pa-hors' : ' pa-we';
      else if(!h)     cl+=' pa-clos';
      else if(reg && h===mn && mn<mx) cl+=' pa-court';
      if(w===0) cl+=' pa-wk';
      var _mk=(MK[m]&&MK[m][d])||null;
      if(_mk) cl+=' pa-mk pa-mk-'+_mk;
      if(h>0){ tot+=h; nj++; }
      // \u26a0\ufe0f Le code du modele (matin/apres-midi) cede la place a la marque : deux
      //   pastilles dans une case de 9 px ne se lisent ni l'une ni l'autre.
      var _pa=_mk?('<span class="pa-cd pa-cdmk">'+_PA_MK[_mk]+'</span>')
                 :((h&&CO[m]&&CO[m][d])?('<span class="pa-cd">'+CO[m][d]+'</span>'):'');
      cells+='<div class="'+cl+'"><span class="pa-d">'+(d<10?'0':'')+d+'</span>'
           + '<span class="pa-j">'+_PA_JA[w]+'</span>'
           + '<span class="pa-h">'+(h?_paFmt(h):(fe?'\u2022':''))+'</span>'
           + _pa+'</div>';
    }
    cols+='<div class="pa-col"><div class="pa-mh">'+_PA_MA[m]+'</div>'+cells
        + '<div class="pa-mt"><b>'+(_paFmt(Math.round(tot*10)/10)||'0')+'</b><span>'+nj+' j</span></div></div>';
  }
  return '<div class="pa-grid">'+cols+'</div>';
}

// Le CSS du CORPS seulement : la page, les polices, l'en-tête à filet d'or et
// le pied viennent de la charte MV_DOC. Un onzième document avec sa propre mise
// en page rouvrirait exactement ce que la charte a refermé.
var _PA_CSS =
  // \u2605 Marques du document NOMINATIF. Fonds pales : la case doit rester lisible
  //   en noir et blanc, une feuille de planning se photocopie.
  '.pa-mk-ecole{background:#DCE9F7!important}'
+ '.pa-mk-cp{background:#FBE08A!important}'
+ '.pa-mk-rec{background:#E5DFF5!important}'
+ '.pa-mk-abs{background:#F2D5CE!important}'
+ '.pa-cdmk{background:#2B2118;color:#fff;font-weight:700}'
+ '.pa-nom{display:flex;align-items:baseline;gap:8px;padding:4px 9px;background:#2B2118;'
  +'margin-bottom:5px;border-radius:4px}'
+ '.pa-nom b{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:14px;color:#F5EFE3;font-weight:700}'
+ '.pa-nom span{font-size:7.5px;color:#C2A14D;text-transform:uppercase;letter-spacing:1px;margin-left:auto}'
+ '.pa-vent{display:flex;gap:0;border:1px solid #C2A14D;margin-top:5px;page-break-inside:avoid}'
+ '.pa-vent div{flex:1;padding:4px 8px;border-right:1px solid #E0CFA6}'
+ '.pa-vent div:last-child{border-right:0}'
+ '.pa-vent b{display:block;font-family:\'Cormorant Garamond\',Georgia,serif;font-size:13px;color:#2B2118}'
+ '.pa-vent span{font-size:6.5px;color:#8A7A62;text-transform:uppercase;letter-spacing:.6px}'
+ '.pa-grp{page-break-after:always;break-after:page}'
+ '.pa-grp:last-child{page-break-after:auto;break-after:auto}'
+ '.pa-who{display:flex;align-items:baseline;gap:8px;padding:3px 9px;background:#FAF3E0;'
  +'border-left:3px solid #C2A14D;margin-bottom:5px;border-radius:0 4px 4px 0}'
+ '.pa-who b{font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#8A7A62;font-weight:700;white-space:nowrap}'
+ '.pa-who p{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:12px;font-weight:600;color:#2B2118;margin:0}'
+ '.pa-hz{display:flex;border:1px solid #A5701E;background:#FDF7E9;page-break-inside:avoid;break-inside:avoid}'
+ '.pa-hnote{font-size:6.5px;color:#96794A;line-height:1.3;margin:2px 0 5px;padding-left:2px}'
+ '.pa-hb{flex:1;padding:0 0 6px;border-right:1px solid #E0CFA6;min-width:0}'
+ '.pa-hb:last-child{border-right:0}'
+ '.pa-hm{font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#fff;'
  +'background:#8A5D08;padding:2px 6px;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
+ '.pa-hl{padding:0 5px;margin-top:2px}'
+ '.pa-hlt{display:flex;align-items:baseline;gap:5px}'
+ '.pa-hj{font-size:7.5px;font-weight:600;color:#8A5D08;text-transform:uppercase;letter-spacing:.4px;'
  +'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
+ '.pa-hn{margin-left:auto;font-family:\'Cormorant Garamond\',Georgia,serif;font-size:11px;font-weight:700;color:#4A3B28}'
+ '.pa-hh{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:10.5px;color:#1C1008;line-height:1.15;'
  +'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
+ '.pa-hh b{font-weight:700}'
+ '.pa-hh i{font-style:normal;color:#C8913A;font-weight:700;font-family:\'Outfit\',sans-serif;font-size:7px;margin:0 .5px}'
+ '.pa-hh em{font-style:normal;color:#D9A441;font-size:8px;margin:0 2px}'
+ '.pa-hd2{display:block;font-size:5.8px;color:#96794A;line-height:1.2}'
+ '.pa-hd2 b{color:#8A5D08;font-weight:700}'
+ '.pa-hp{margin:4px 6px 0;padding-top:3px;border-top:1px solid #E0CFA6;font-size:6.2px;color:#96794A;line-height:1.25}'
+ '.pa-full{padding:0 0 8px}.pa-hkl{font-size:8px;color:#6B5B44;margin:0 10px 7px}'
+ '.pa-hk{display:flex;flex-wrap:wrap;gap:6px 22px;margin:0 10px}'
+ '.pa-kc{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:13px;color:#1C1008;white-space:nowrap}'
+ '.pa-kc b{font-weight:700}'
+ '.pa-kc u{display:inline-block;text-decoration:none;font-family:\'Outfit\',sans-serif;font-size:8px;font-weight:700;'
  +'color:#fff;background:#8A5D08;border-radius:3px;padding:1px 5px;margin-right:5px;vertical-align:1px;min-width:26px;text-align:center}'
+ '.pa-kc i{font-style:normal;color:#C8913A;font-weight:700;font-family:\'Outfit\',sans-serif;font-size:8px;margin:0 1px}'
+ '.pa-kc em{font-style:normal;font-family:\'Outfit\',sans-serif;color:#96794A;font-size:7.5px;margin-left:5px}'
+ '.pa-grid{display:flex;border:1px solid #A5701E;border-right:0;page-break-inside:avoid;break-inside:avoid}'
+ '.pa-col{flex:1;display:flex;flex-direction:column;border-right:1px solid #C3B393;min-width:0}'
+ '.pa-mh{font-size:7px;font-weight:700;letter-spacing:.5px;text-align:center;padding:2px 0;color:#2B1D08;'
  +'background:#D9A441;border-bottom:1px solid #A5701E}'
+ '.pa-c{display:flex;align-items:center;gap:1px;padding:0 2.5px;height:2.6mm;font-size:6.5px;line-height:1;'
  +'box-sizing:border-box;border-bottom:1px solid #E2DCCF}'
// Le lisere vin : on travaille ce jour-la alors que le calendrier dit non.
+ '.pa-hors{border-left:2.2px solid #8C2E15;padding-left:1px}'
+ '.pa-hors .pa-h{color:#7A2510;font-weight:700}'
+ '.pa-we.pa-hors{background:#EDE7DC}'
+ '.pa-wk{border-top:1.4px solid #A5701E}'
+ '.pa-d{color:#9C8A6E;width:8px;font-weight:500}'
+ '.pa-j{color:#C9BCA4;width:5px;font-size:5.8px}'
+ '.pa-cd{margin-left:1px;font-size:5px;font-weight:700;color:#6D5FA8;vertical-align:top}'
+ '.pa-h{margin-left:auto;font-family:\'Cormorant Garamond\',Georgia,serif;font-size:9.5px;font-weight:700;color:#1C1008}'
+ '.pa-we{background:#DDD8CF}.pa-we .pa-d,.pa-we .pa-j{color:#8C8378}'
+ '.pa-clos{background:#FBE08A}.pa-clos .pa-d,.pa-clos .pa-j{color:#8A5D08}'
+ '.pa-court{background:#C7E3F5}.pa-court .pa-h{color:#0F5A87}.pa-court .pa-d,.pa-court .pa-j{color:#4C86A8}'
+ '.pa-fer{background:#F0AF9B}.pa-fer .pa-d{color:#8C2E15;font-weight:700}.pa-fer .pa-j{color:#A85A42}'
  +'.pa-fer .pa-h{color:#8C2E15}'
+ '.pa-void{background:#F2EFE9;border-bottom:0}'
+ '.pa-mt{text-align:center;padding:2px 0;background:#EDE1C6;border-top:1px solid #A5701E;font-size:6px;color:#8A7550}'
+ '.pa-mt b{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:10px;color:#2B2118;display:block;line-height:1}'
+ '.pa-mt span{display:block;margin-top:1px}'
+ '.pa-ft{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-top:4px}'
+ '.pa-lg{display:flex;flex-wrap:wrap;gap:2px 11px;font-size:6.8px;color:#5A4A30}'
+ '.pa-lg i{display:inline-block;width:9px;height:9px;border:1px solid #B9A98C;margin-right:4px;'
  +'vertical-align:-1px;border-radius:2px}'
+ '.pa-tot{text-align:right;white-space:nowrap}'
+ '.pa-tot .pa-v{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:18px;font-weight:700;color:#2B2118;line-height:1}'
+ '.pa-tot .pa-v em{font-style:normal;font-size:10px;color:#8A7A62;font-family:\'Outfit\',sans-serif}'
+ '.pa-tot .pa-s{font-size:7.5px;color:#8A7A62;margin-top:2px}'
+ '.pa-exc{margin-top:4px;padding:3px 8px;background:#FBEDE9;border-left:3px solid #8C2E15;'
  +'font-size:6.8px;color:#7A2510;line-height:1.4;border-radius:0 4px 4px 0}'
// Un groupe ne doit JAMAIS s'etaler sur deux pages : le budget vertical est
// calcule pour qu'il tienne, cette regle est la ceinture.
+ '.pa-grp{page-break-inside:avoid;break-inside:avoid}'
+ '.mvdoc-lim{font-size:6.8px!important;line-height:1.4!important;padding:5px 8px!important;margin-top:4px!important}';

// Le document. Une page par modèle ; le nom du domaine et l'année sont répétés
// sur chaque page, parce qu'une feuille arrachée du lot doit rester identifiable.
// \u2605 2e argument OPTIONNEL : un nom. Sans lui, le document par modele de semaine
//   sort exactement comme avant. Avec lui, UNE page pour cette personne, bornee
//   a ses contrats, ses jours de CFA marques, et la ventilation domaine / formation.
function _paDoc(yr,nom){
  var e=window._escHtml||function(x){return String(x==null?'':x);};
  if(nom) return _paDocNom(yr,nom,e);
  var grps=_paGroupes(yr);
  if(!grps.length){ if(window.showToast) window.showToast('Aucun salari\u00e9 sur '+yr,'#B85A1A'); return false; }
  var lim='<div class="mvdoc-lim"><b>Planning pr\u00e9visionnel.</b> Les dur\u00e9es sont des heures '
    + '<b>travaill\u00e9es</b>, coupure d\u00e9duite. Cong\u00e9s, absences et r\u00e9cup\u00e9rations n\u2019y figurent pas : ils '
    + 'apparaissent sur le relev\u00e9 mensuel d\u2019heures. Ni un contrat de travail, ni un bulletin de paie.</div>';

  var neuf = (typeof _planYearHasData==='function' && !_planYearHasData(yr));
  if(neuf){
    lim += '<div class="mvdoc-lim"><b>L\u2019ann\u00e9e '+yr+' n\u2019a pas encore de mod\u00e8le enregistr\u00e9.</b> '
        + 'Le document est construit sur le mod\u00e8le int\u00e9gr\u00e9, dont les jours sont cal\u00e9s sur un autre '
        + 'calendrier : les jours de semaine ne tombent pas aux m\u00eames dates. Importez le planning de '
        + 'l\u2019ann\u00e9e au format CSV avant de le diffuser \u00e0 l\u2019\u00e9quipe.</div>';
  }


  var corps=grps.map(function(gr){
    var g=_paGrille(gr.id,yr), reg=_paRegulier(g,yr);
    var tot=0, nj=0;
    for(var mm=0;mm<12;mm++) for(var dd in g[mm]) if(g[mm][dd]>0){ tot+=g[mm][dd]; nj++; }
    tot=Math.round(tot*10)/10;
    var ec=Math.round((tot-1607)*10)/10;
    var exc=_paExceptions(g,yr);
    var lg='<span><i style="background:#fff"></i>Journ\u00e9e compl\u00e8te</span>'
         + (reg?'<span><i style="background:#C7E3F5"></i>Journ\u00e9e courte</span>':'')
         + '<span><i style="background:#DDD8CF"></i>Week-end</span>'
         + '<span><i style="background:#FBE08A"></i>Fermeture du domaine</span>'
         + '<span><i style="background:#F0AF9B"></i>Jour f\u00e9ri\u00e9</span>'
         + '<span><i style="background:#fff;border-left:3px solid #8C2E15"></i>Travaill\u00e9 un f\u00e9ri\u00e9 ou un week-end</span>';
    return '<div class="pa-grp">'
      + '<div class="pa-who"><b>Suivent ce planning</b><p>'+e(gr.noms.join(' \u00b7 '))+'</p></div>'
      + _paBandeau(g,gr.id,yr,reg)
      + _paGrilleHtml(g,yr,reg,gr.id)
      + '<div class="pa-ft"><div class="pa-lg">'+lg+'</div>'
      + '<div class="pa-tot"><div class="pa-v">'+_paFmt(tot)+' <em>h</em></div>'
      + '<div class="pa-s">'+nj+' jours travaill\u00e9s \u00b7 '+(ec===0?'':(ec>0?'+':'\u2212'))+(ec===0?'0':_paFmt(Math.abs(ec)))
      + ' h par rapport aux 1 607 h</div></div></div>'
      + (exc ? ('<div class="pa-exc">'+exc+(exc>1?' journ\u00e9es sortent':' journ\u00e9e sort')
              +' du rythme annonc\u00e9 ci-dessus \u2014 elles figurent dans la grille, '
              +'rep\u00e9r\u00e9es par un lis\u00e9r\u00e9 rouge quand elles tombent un jour f\u00e9ri\u00e9 '
              +'ou un week-end.</div>') : '')
      + lim
      + '</div>';
  }).join('');

  return window._mvDocOpen({
    titre:'Planning de l\u2019ann\u00e9e '+yr,
    metas:[String(yr), grps.length+(grps.length>1?' mod\u00e8les de semaine':' mod\u00e8le de semaine'),
           '\u00c9dit\u00e9 le '+new Date().toLocaleDateString('fr-FR')],
    orient:'paysage', cat:'planning', css:_PA_CSS, corps:corps
  });
}

// \u2550\u2550 LE PLANNING DE L'ANNEE, AU NOM D'UNE PERSONNE \u2550\u2550
// Ce qu'un salarie demande quand il dit « mon planning » : ses jours a lui, sur
// douze mois, sur une feuille qui porte son nom et qu'il peut emporter.
function _paDocNom(yr,nom,e){
  var mbr=(window.MEMBRES||[]).find(function(m){ return m.nom===nom; });
  if(!mbr){ if(window.showToast) window.showToast('Salari\u00e9 introuvable','#E07060'); return false; }
  var plId=_planPlId(mbr);
  var g=_paGrille(plId,yr,mbr), reg=_paRegulier(g,yr), MK=_paMarques(nom,yr);

  // Le total se ventile : ce qui est fait AU DOMAINE et ce qui est fait AILLEURS
  // mais compte quand meme (CFA, evenement familial). Un apprenti dont on
  // additionnerait les deux sans le dire croirait devoir 1 607 h de vigne.
  var tot=0,nj=0,hEcole=0,jEcole=0,hCp=0,jCp=0;
  for(var m=0;m<12;m++) for(var d in g[m]){
    var h=g[m][d]; if(!(h>0)) continue;
    var k=(MK[m]&&MK[m][parseInt(d,10)])||null;
    if(k==='ecole'){ hEcole+=h; jEcole++; tot+=h; continue; }
    if(k==='cp'){ hCp+=h; jCp++; continue; }
    if(k==='rec'||k==='abs') continue;
    tot+=h; nj++;
  }
  var r1=function(x){ return Math.round(x*10)/10; };
  tot=r1(tot); hEcole=r1(hEcole); hCp=r1(hCp);
  var hDom=r1(tot-hEcole);

  var per=_paPeriodes(mbr)||[];
  var ctr=per.length
    ? per.map(function(p){
        return (p.type?e(p.type)+' ':'')+'du '+e(_planFmtJour(p.debut||''))
             +(p.fin?(' au '+e(_planFmtJour(p.fin))):' \u2014 en cours');
      }).join(' \u00b7 ')
    : 'Aucun contrat enregistr\u00e9';

  var vent='<div class="pa-vent">'
    +'<div><b>'+_paFmt(hDom)+' h</b><span>au domaine \u00b7 '+nj+' jours</span></div>'
    +(jEcole?('<div><b>'+_paFmt(hEcole)+' h</b><span>en formation \u00b7 '+jEcole+' jours</span></div>'):'')
    +(jCp?('<div><b>'+_paFmt(hCp)+' h</b><span>cong\u00e9s pos\u00e9s \u00b7 '+jCp+' jours</span></div>'):'')
    +'<div><b>'+_paFmt(tot)+' h</b><span>total comptabilis\u00e9</span></div>'
    +'</div>';

  var lg='<span><i style="background:#fff"></i>Journ\u00e9e compl\u00e8te</span>'
       + (reg?'<span><i style="background:#C7E3F5"></i>Journ\u00e9e courte</span>':'')
       + '<span><i style="background:#DDD8CF"></i>Week-end</span>'
       + '<span><i style="background:#F0AF9B"></i>Jour f\u00e9ri\u00e9</span>'
       + (jEcole?'<span><i style="background:#DCE9F7"></i>Formation (CFA)</span>':'')
       + (jCp?'<span><i style="background:#FBE08A"></i>Cong\u00e9 pos\u00e9</span>':'');

  var lim='<div class="mvdoc-lim"><b>Planning pr\u00e9visionnel.</b> Les dur\u00e9es sont des heures '
    +'<b>travaill\u00e9es</b>, coupure d\u00e9duite. Les jours d\u00e9j\u00e0 pos\u00e9s au calendrier '
    +'(formation, cong\u00e9s, r\u00e9cup\u00e9rations) sont report\u00e9s ; ce qui sera saisi plus tard ne '
    +'peut pas y figurer. Ni un contrat de travail, ni un bulletin de paie.</div>';
  if(jEcole){
    lim+='<div class="mvdoc-lim">Les heures de <b>formation</b> comptent comme du temps de '
      +'travail effectif et sont r\u00e9mun\u00e9r\u00e9es (art. L6222-24 du code du travail). Elles sont '
      +'compt\u00e9es dans le total mais distingu\u00e9es des heures faites au domaine.</div>';
  }

  var corps='<div class="pa-grp">'
    +'<div class="pa-nom"><b>'+e(nom)+'</b><span>Planning '+yr+'</span></div>'
    +'<div class="pa-who"><b>Contrat</b><p>'+ctr+'</p></div>'
    +_paBandeau(g,plId,yr,reg)
    +_paGrilleHtml(g,yr,reg,plId,MK)
    +'<div class="pa-ft"><div class="pa-lg">'+lg+'</div>'
    +'<div class="pa-tot"><div class="pa-v">'+_paFmt(tot)+' <em>h</em></div>'
    +'<div class="pa-s">'+(nj+jEcole)+' jours \u00b7 total comptabilis\u00e9</div></div></div>'
    +vent
    +lim
    +'</div>';

  return window._mvDocOpen({
    titre:'Planning '+yr+' \u2014 '+nom,
    metas:[String(yr), nom, '\u00c9dit\u00e9 le '+new Date().toLocaleDateString('fr-FR')],
    orient:'paysage', cat:'planning', css:_PA_CSS, corps:corps
  });
}

// Point d'entree du hub pour la version nominative.
function planAnnuelNomPdf(nom,an){
  if(!nom){ if(window.showToast) window.showToast('Choisissez un salari\u00e9','#B85A1A'); return false; }
  var yr=parseInt(an,10);
  if(!isFinite(yr)||yr<2000) yr=_pY();
  return _paDocNom(yr,nom,(window._escHtml||function(x){return String(x==null?'':x);}));
}

// Ne jamais poser une question dont la réponse est unique : s'il n'y a qu'une
// année possible, le document sort directement.
function planAnnuelPdf(){
  var ans=(typeof _planYearList==='function')?_planYearList():[];
  if(!ans.length) ans=[(new Date()).getFullYear()];
  var def=ans.indexOf(_pY()+1)>=0 ? (_pY()+1) : ans[ans.length-1];
  if(ans.length===1 || typeof window.openPrompt!=='function'){ _paDoc(ans[0]); return; }
  window.openPrompt({
    titre:'Quelle ann\u00e9e ?', unite:'', icone:'\u{1F5D3}\u{FE0F}', type:'nombre',
    sub:'Ann\u00e9es disponibles : '+ans.join(', ')+'. Le planning de l\u2019ann\u00e9e \u00e0 venir '
       +'se pr\u00e9pare en important son CSV depuis l\u2019onglet Mod\u00e8les.',
    valeur:String(def), placeholder:String(def), btnLabel:'\u00c9diter le planning',
    cb:function(v){
      var n=parseInt(String(v).replace(/\D/g,''),10);
      if(!isFinite(n)||n<2000){ if(window.showToast) window.showToast('Ann\u00e9e non reconnue','#B85A1A'); return; }
      _paDoc(n);
    }
  });
}
// ⚠️ Expose parce que le hub Documents (reglages.js) doit proposer les MEMES
//   annees que les onglets du Planning. Sans cette ligne, window._planYearList
//   est undefined, le panneau tombe sur son repli et n'offre qu'une annee —
//   sans qu'aucune erreur ne s'affiche. C'est exactement le silence que C23 vise.
window._planYearList    = _planYearList;
window.planAnnuelPdf    = planAnnuelPdf;
window.planAnnuelNomPdf = planAnnuelNomPdf;
window._paDoc           = _paDoc;
window._paDocNom        = _paDocNom;

// ════════════════════════════════════════════════════════════════════
// EXPORTS WINDOW — fonctions appelées depuis HTML (onclick) ou app.js
// ════════════════════════════════════════════════════════════════════

// ── Données (refs partagées initialisées en tête de module) ──
window.PLANNING_TEMPLATES = PLANNING_TEMPLATES;
window.PLANNING_ENTRIES   = PLANNING_ENTRIES;
window.PLANNING_ACOMPTES  = PLANNING_ACOMPTES;
window.PLANNING_HSUP      = PLANNING_HSUP;
window.PLAN_PAUSE_MIN     = PLAN_PAUSE_MIN;
window._planTeamCadence   = _planTeamCadence;

// ── Render principal ──
window.renderPlanning       = renderPlanning;

// ── Navigation planning ──
window.planSwitchTab        = planSwitchTab;
window.planPrevMonth        = planPrevMonth;
window.planNextMonth        = planNextMonth;
window.planGoMonth          = planGoMonth;

// ── Modal jour ──
window.openPlanDayModal     = openPlanDayModal;
window.closePlanDayModal    = closePlanDayModal;
window.savePlanDay          = savePlanDay;
window.planClearDay         = planClearDay;
window.planSetMode          = planSetMode;
window.planSetAbsMotif      = planSetAbsMotif;
window.planToggleContinu    = planToggleContinu;
window.planToggleRemp       = planToggleRemp;
window.planSetDuesDebut     = planSetDuesDebut;
window.planCalcResult       = planCalcResult;

// ── Grille équipe / fiche salarié / sélection / outils / chaleur ──
window.pl2SetView           = pl2SetView;
window.pl2Nav               = pl2Nav;
// ★ La sélection : quatre gestes de cochage, un seul état. planToggleMulti,
//   planMultiApply, planMultiHeures, planMultiHApply, planMultiAbsApply et leurs
//   satellites ont disparu avec le mode « Sélection multiple ».
window.planCellTap          = planCellTap;
window.planRowTap           = planRowTap;
window.planColTap           = planColTap;
window.planSelAll           = planSelAll;
window.planSelClear         = planSelClear;
window.planSelSheet         = planSelSheet;
window.planSelAction        = planSelAction;
window.planSelEffectif      = planSelEffectif;
window._planEffN            = _planEffN;
window._planCollH           = _planCollH;
window._planEffMax          = _planEffMax;
window._planApplyHeures     = _planApplyHeures;
window._planApplyAbs        = _planApplyAbs;
window._planApplySimple     = _planApplySimple;
window.planKpiAlert         = planKpiAlert;
window.openPlanFiche        = openPlanFiche;
window.closePlanFiche       = closePlanFiche;
window.planFicheTab         = planFicheTab;
window.planFichePdf         = planFichePdf;
window.planFicheOpenDay     = planFicheOpenDay;
window.planSetCpMode        = planSetCpMode;
window.planSetCpPeriode     = planSetCpPeriode;
window.planSetYear          = planSetYear;
window.planAddYear          = planAddYear;
window._planMigrateYears    = _planMigrateYears;
window._feriesY             = _feriesY;
window._planFerie           = _planFerie;
window.openPlanChaleur      = openPlanChaleur;
window.closePlanChaleur     = closePlanChaleur;
window.planChalMb           = planChalMb;
window.planChalApply        = planChalApply;
window.planChalRemove       = planChalRemove;
window.planEdNav            = planEdNav;
window.planEdSwitch         = planEdSwitch;
window.planPresetChaleur    = planPresetChaleur;
window._pl2Refresh          = _pl2Refresh;

// ── Saisie admin ──
window.planExportPDF        = planExportPDF;
window.planSaveHsupAt       = planSaveHsupAt;
window.planSaveHsupBankAt   = planSaveHsupBankAt;
window.planSaveHsupSupOvAt  = planSaveHsupSupOvAt;
window.planHsupDet          = planHsupDet;
window.planSaveDepart       = planSaveDepart;
window._planYearBalance     = _planYearBalance;
window.planCaniculeToggleContinu = planCaniculeToggleContinu;
window.planCaniculeCalc          = planCaniculeCalc;
window.planCaniculeApply         = planCaniculeApply;
window.planCaniculeRemove        = planCaniculeRemove;
window.openPlanCP           = openPlanCP;
// ★ Appelee depuis un onclick construit en JS (barre de selection) : sans cette
//   ligne, le bouton « Conge » serait un clic mort. Signale par le preflight C6.
// window.openPlanCPSel supprime — fusionne dans openPlanCP(true) (backlog 3)
window.closePlanCP          = closePlanCP;
window.planCpMb             = planCpMb;
window.planCpApply          = planCpApply;
window.planCpRemove         = planCpRemove;
window._planCpOnDate        = _planCpOnDate;

// ── Acomptes ──
window.planToggleAcForm     = planToggleAcForm;
window.planSaveAcompte      = planSaveAcompte;
window.planDeleteAcompte    = planDeleteAcompte;

// ── Templates ──
window.planExportCSV        = planExportCSV;
window.planImportCSV        = planImportCSV;
window.planDirectImportCSV  = planDirectImportCSV;
window.planCreateTemplate   = planCreateTemplate;
window.planAssignTpl        = planAssignTpl;
window.planSavePause        = planSavePause;
window.planSaveCoupure      = planSaveCoupure;
window.planSaveCoupureH     = planSaveCoupureH;
window._planCoupureH        = _planCoupureH;
window._planCoupureTxt      = _planCoupureTxt;
window.planSaveLegal        = planSaveLegal;
window.planSetHsupMode      = planSetHsupMode;
window.planLegalPreset      = planLegalPreset;
window.planOpenGridEditor   = planOpenGridEditor;
window.planCloseGridEditor  = planCloseGridEditor;
window.planEditorSetMonth   = planEditorSetMonth;
window.planUpdateDay        = planUpdateDay;
window.planSaveTpl          = planSaveTpl;
window.planAskDeleteTemplate    = planAskDeleteTemplate;
window.planCancelDeleteTemplate = planCancelDeleteTemplate;
window.planDeleteTemplate       = planDeleteTemplate;

// ── Helpers exposés pour app.js (hub, contrat, PDF mensuel) ──
window._planCalcMonth           = _planCalcMonth;
window._planGetRefH             = _planGetRefH;
window._planPlId                = _planPlId;
window._planFmt                 = _planFmt;
window._planInContract          = _planInContract;
window._planHasContractThisMonth= _planHasContractThisMonth;
window._planMbrs                = _planMbrs;
window._planSummary             = _planSummary;
window._planDays                = _planDays;
window._planDow                 = _planDow;
window.PLAN_MOIS                = PLAN_MOIS;
window.PLAN_MOIS_C              = PLAN_MOIS_C;
window.PLAN_JOURS               = PLAN_JOURS;
window.PLAN_FERIES              = PLAN_FERIES;

/* ══════════════════════════════════════════════════════════════════════════
   LE RELEVÉ INDIVIDUEL — LES CONTRATS, LES CONGÉS, ET L'ACCÈS AU DOCUMENT
   ══════════════════════════════════════════════════════════════════════════
   ⚠️⚠️ CE DOCUMENT EXISTAIT DEJA. Il ne fallait surtout pas en ecrire un
   second : planExportPDF sort deja le mois jour par jour, les heures
   supplementaires, le compteur d'annualisation et le detail mois par mois.
   Une « fiche salarie » de plus aurait refait 80 % du document — et deux
   definitions du meme chiffre finissent toujours par diverger.

   Ce lot fait deux choses, et deux seulement :

   1. IL LE REND ATTEIGNABLE. Le hub Documents annonce « tout ce que Ma Vigne
      sait sortir » ; le releve individuel n'y figurait pas. Il fallait ouvrir
      le Planning, la fiche du salarie, puis le bouton PDF. C'est le document
      qu'un controle demande en premier, et le seul a se cacher.

   2. IL AJOUTE CE QUI MANQUAIT SUR LE PAPIER :
      · LA VIE CONTRACTUELLE ENTIERE. L'en-tete nomme le contrat DU MOIS
        (_ctrTxt, v6.60) ; le compteur, lui, se lit sur l'ANNEE. Entre les
        deux, rien ne disait combien de contrats l'annee comptait ni ou
        tombaient les coupures — alors que c'est la coupure qui decide si le
        compteur repart de zero. La frise de la fiche membre le montre depuis
        la v6.60 ; le document l'ecrit desormais aussi.
      · LES CONGES PAYES : solde initial, pris, reste, periode de reference et
        mode de decompte du domaine.

   ⚠️ SOURCE DES PERIODES : window._mvPeriodes (utils.js, v6.59). Periodes NON
   fusionnees, chacune portant SON type — c'est ce qu'il faut a un document qui
   doit montrer qu'un CDD a succede a un TESA. _mvContrats, lui, FUSIONNE les
   contrats contigus : parfait pour « etait-il la ce jour-la », inutilisable
   pour lister des contrats. Repli sur _mvContrats si _mvPeriodes manque.

   ⚠️ ANNUALISE OU NON : window._mvAnnualise (utils.js, v6.61) est la
   definition unique. Ecrire « plafond proratise » sur le releve d'un TESA
   serait faux depuis ce lot-la : il est paye a l'heure, sans plafond.

   ⚠️ AUCUN CALCUL NEUF : _mvPeriodes, _mvAnnualise, _planCpPris, _planCpSolde,
   _planCpPeriodeLbl. Le document LIT, il ne recalcule pas.
   ══════════════════════════════════════════════════════════════════════════ */

/* Une date ISO en toutes lettres : « 2 mars 2026 ». Le document est lu par un
   tiers — un controleur, un comptable — pas seulement par le domaine.
   ⚠️ _planFmtJour rend « 02/03/2026 » : parfait dans un tableau serre, moins
   dans une phrase. Les deux coexistent, chacun a sa place. */
function _plRvDateLg(iso){
  if(!iso) return '';
  var p = String(iso).slice(0, 10).split('-');
  if(p.length !== 3) return String(iso);
  var mi = parseInt(p[1], 10) - 1;
  return parseInt(p[2], 10) + ' ' + (PLAN_MOIS[mi] || '').toLowerCase() + ' ' + p[0];
}
function _plRvJours(a, b){
  if(!a || !b) return null;
  var n = Math.round((Date.parse(b) - Date.parse(a)) / 86400000) + 1;
  return isFinite(n) && n > 0 ? n : null;
}
/* Le trou ENTRE deux periodes, en jours pleins. 0 = elles se touchent. */
function _plRvTrou(finPrec, debutSuiv){
  if(!finPrec || !debutSuiv) return null;
  var n = Math.round((Date.parse(debutSuiv) - Date.parse(finPrec)) / 86400000) - 1;
  return isFinite(n) ? Math.max(0, n) : null;
}
/* ⚠️ _planFmt formate des HEURES : _planFmt(12) rend « 12h ». Les conges se
   comptent en JOURS, et « 12h j » est exactement le genre de sottise qu'un
   document imprime porte pendant des mois. Formateur separe, donc. */
function _plRvJ(n){
  var v = Math.round((parseFloat(n) || 0) * 10) / 10;
  return String(v).replace('.', ',') + ' j';
}

function _plRvContratsHtml(mbr){
  var _plRvAuj = new Date().toISOString().slice(0, 10);
  var P = (typeof window._mvPeriodes === 'function') ? (window._mvPeriodes(mbr) || [])
        : ((typeof window._mvContrats === 'function') ? (window._mvContrats(mbr) || []) : []);
  var annu = (typeof window._mvAnnualise === 'function') ? !!window._mvAnnualise(mbr) : true;
  var pied = annu
    ? 'Le plafond annuel du compteur est <b>proratis\u00e9 aux jours sous contrat</b>, suspensions d\u00e9duites.'
    : '<b>Ce contrat n\u2019est pas annualis\u00e9</b> : les heures sont pay\u00e9es \u00e0 l\u2019heure, sans plafond '
      + 'annuel, et chaque contrat solde son compte \u00e0 sa fin.';

  if(!P.length){
    return '<div class="ctr"><div class="t">\u{1F4C4} Contrat</div>'
      + '<div class="crow"><span class="cl">' + _escHtml(mbr.type_contrat || 'CDI') + '</span>'
      + '<span class="cv">aucune date enregistr\u00e9e</span></div>'
      + '<div class="note">Sans date de d\u00e9but ni de fin, l\u2019application consid\u00e8re le salari\u00e9 '
      + 'pr\u00e9sent toute l\u2019ann\u00e9e : le plafond annuel n\u2019est alors pas proratis\u00e9.</div></div>';
  }

  var rows = '', coupures = 0;
  P.forEach(function(c, i){
    if(i > 0){
      var t = _plRvTrou(P[i - 1].fin, c.debut);
      if(t === null){ /* dates manquantes : on n'affirme rien */ }
      else if(t === 0){
        rows += '<div class="crow cgap"><span class="cl">\u2193 se poursuit sans interruption</span>'
          + '<span class="cv">m\u00eame compteur</span></div>';
      } else {
        coupures++;
        rows += '<div class="crow cgap cbreak"><span class="cl">\u2193 coupure de ' + t + ' jour'
          + (t > 1 ? 's' : '') + '</span>'
          + '<span class="cv">' + (annu ? 'compteur pr\u00e9c\u00e9dent sold\u00e9' : 'compte sold\u00e9') + '</span></div>';
      }
    }
    // « en cours » = la periode qui couvre AUJOURD'HUI. Un CDD dont le terme est
    // dans deux mois est bien le contrat courant : le marquer sur la seule
    // absence de fin ne signalerait que les CDI.
    var enCours = (!c.debut || c.debut <= _plRvAuj) && (!c.fin || c.fin >= _plRvAuj);
    var nj = _plRvJours(c.debut, c.fin);
    rows += '<div class="crow">'
      + '<span class="cl">' + (c.type ? ('<b>' + _escHtml(c.type) + '</b> \u00b7 ') : '')
      + (c.debut ? ('du ' + _plRvDateLg(c.debut)) : 'depuis toujours')
      + (c.fin ? (' au ' + _plRvDateLg(c.fin)) : ' \u2014 sans terme')
      + (enCours ? ' <b class="cnow">en cours</b>' : '') + '</span>'
      + '<span class="cv">' + (nj ? (nj + ' jour' + (nj > 1 ? 's' : '')) : '\u2014') + '</span>'
      + '</div>';
  });

  return '<div class="ctr"><div class="t">\u{1F4C4} Les contrats \u2014 ' + P.length
    + ' p\u00e9riode' + (P.length > 1 ? 's' : '') + '</div>'
    + rows
    + '<div class="note">' + pied
    + (coupures
        ? ' <b>Deux p\u00e9riodes s\u00e9par\u00e9es par une coupure comptent s\u00e9par\u00e9ment</b> : chaque contrat '
          + 'ouvre son propre compteur, rien ne se reporte de l\u2019un \u00e0 l\u2019autre.'
        : (P.length > 1
            ? ' Ces p\u00e9riodes se touchent : elles n\u2019en font qu\u2019un pour le compteur.'
            : ''))
    + '</div></div>';
}

/* Le bloc CONGES PAYES. Le mode de decompte et la periode de reference sont des
   reglages DU DOMAINE, pas du salarie : le document les nomme.
   ⚠️ Une ligne d'equipe collective n'a ni compteur, ni conges (utils.js) : pas
   de bloc du tout, plutot qu'un bloc a zero qui laisserait croire a un solde. */
function _plRvCpHtml(mbr){
  if(typeof window._mvEstCollectif === 'function' && window._mvEstCollectif(mbr)) return '';
  var ini = mbr.cp_initial_j || 0;
  var pris = _planCpPris(mbr.nom), solde = _planCpSolde(mbr);
  var mode = ((window.CONFIG && window.CONFIG.cp_mode) === 'ouvres') ? 'ouvr\u00e9s' : 'ouvrables';
  return '<div class="ctr"><div class="t">\u{1F334} Cong\u00e9s pay\u00e9s \u2014 ' + _planCpPeriodeLbl() + '</div>'
    + '<div class="crow"><span class="cl">Solde initial</span><span class="cv">' + _plRvJ(ini) + '</span></div>'
    + '<div class="crow"><span class="cl">Pris sur la p\u00e9riode</span><span class="cv">' + _plRvJ(pris) + '</span></div>'
    + '<div class="crow"><span class="cl"><b>Reste</b></span>'
      + '<span class="cv"><b style="color:' + (solde < 0 ? '#dc2626' : '#16a34a') + '">'
      + _plRvJ(solde) + '</b></span></div>'
    + '<div class="note">D\u00e9compte en jours <b>' + mode + '</b>, r\u00e9glage du domaine. '
    + 'Le solde initial se saisit dans la fiche du salari\u00e9.</div></div>';
}

window._plRvContratsHtml = _plRvContratsHtml;
window._plRvCpHtml       = _plRvCpHtml;

/* Point d'entree du hub : le mois n'est pas celui de l'ecran Planning.
   ⚠️ planExportPDF lit la variable de module `planMonth`. On la deplace le
   temps de produire le document, PUIS ON LA REMET : sans cette restauration,
   editer un releve depuis les Documents changerait le mois affiche au Planning
   sans que personne ne l'ait demande. planExportPDF est synchrone — la
   restauration a donc bien lieu apres la construction du document. */
window._planReleveIndiv = function(nom, mois){
  var mbr = (window.MEMBRES || []).find(function(m){ return m.nom === nom; });
  if(!mbr){ showToast('Salari\u00e9 introuvable', '#E07060'); return false; }
  var m = parseInt(mois, 10);
  var avant = planMonth;
  if(isFinite(m) && m >= 0 && m <= 11) planMonth = m;
  try{ planExportPDF(nom); }
  finally{ planMonth = avant; }
  return true;
};

/* La liste des salaries offerte au choix, et le mois par defaut : ceux que
   l'ecran Planning montre deja. */
window._planReleveMbrs = function(){
  return _planMbrs().map(function(m){
    return { nom: m.nom, coll: (typeof window._mvEstCollectif === 'function') && window._mvEstCollectif(m) };
  });
};
window._planReleveMois = function(){ return planMonth; };
window._planReleveAn   = function(){ return planYear; };
