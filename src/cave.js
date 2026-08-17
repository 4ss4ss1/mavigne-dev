// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// MA VIGNE \u2014 src/cave.js
// Module Cave \u00C9levage (cuv\u00E9es, op\u00E9rations, analyses)
// Phase 2b \u2014 extrait depuis app.js
// \u00A9 2026 Nicolas GUERET / GUERETTECH
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//
// D\u00E9pendances (via window.*) :
//   window.fbSave, window.fbDeleteAnalyse   \u2190 firebase.js
//   window.CAVE_ELEVAGE                     \u2190 expos\u00E9 sur window par ce module
//   window.currentUser                      \u2190 app.js globals
//   window.closeOv                          \u2190 app.js
//
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

import { isAdmin, isSaisonnier, canWrite, showToast, showSyncBadge, _escHtml,
         _mvBadge, _mvIcon } from './utils.js';

const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// \u2550\u2550\u2550\u2550 CAVE \u00C9LEVAGE \u2550\u2550\u2550\u2550
var CAVE_ELEVAGE = { cuvees:[], operations:[], analyses:[], config:{ ouillage_alerte_j:14 } };
var CAVE_VENDANGE = { config:{poids_caisse_kg:25,ratio_min:130,ratio_max:140,sucre_par_degre:16.83}, recoltes:[], cuves_vinif:[], clients:[], analyses:[], cuvees:[] };
var _vendTab = 'cuves';
var _vendEditId = null;
var _vendVendu = false;
var _vendEraflage = 'total';
var _vcuvEditId = null;
var _vcuvMpfActive = false;
var _vmesureCuveId = null;
var _vmRem = 2;
var _vmPig = 1;
var caveTab = 'cuv';   // onglet actif du Chai — DOIT etre l'un des 4 de switchCaveOng
var caveSection = 'elevage'; // section active : 'elevage' (Le Chai) | 'vendange' (Le Cuvier). Plus de s\u00E9lecteur interm\u00E9diaire : onglets unifi\u00E9s dans l'en-t\u00EAte.
var _caveFml = 'none';
var _caveOpType = 'ouillage';
var _copCuvSel = new Set();
var _copIntSel = []; // intervenants sélectionnés (multi) — v4.33
var _copAllCuv = false;
var _copOuillette = 10;
var _copSo2Mode = 'none';
var _copSo2Nb = 2;
var _copSo2Freq = 10;
var _cuvTonneaux = []; // [{annee:2025, nb:2}, ...] \u2014 \u00E9tat formulaire cuv\u00E9e
var _copSoufreG = 5;      // grammes pastille soufre: 2 ou 5
var _copPdfFile = null;   // PDF stag\u00E9 pour op analyse en cours (null|File|'__keep__url|nom|size|path')
var _copSoufreMode = 'fut'; // 'fut' | 'total'
var _jFilter = 'tous';    // filtre journal cave: tous|ouillage|soutirage|soufre|analyse|autre
var _caveAnaLinkedOpIds = [];  // IDs ops s\u00E9lectionn\u00E9es pour rattachement PDF (multi)
var _caveExpAllCuv = true;     // export: toutes cuv\u00E9es
var _caveExpCuvSel = new Set(); // export: cuv\u00E9es s\u00E9lectionn\u00E9es
var _caveExpTypes = new Set(['ouillage','soutirage','soufre','analyse','autre']); // export: types actifs
var _convMode = 'liq2past'; // convertisseur SO2
var _convDilution = 5;


function _copFmtSize(b){if(!b)return'';return b<1048576?Math.round(b/1024)+'\u00a0Ko':(b/1048576).toFixed(1)+'\u00a0Mo';}

function _copStagePdf(input) {
  var file=input&&input.files&&input.files[0];
  input.value='';
  if(!file)return;
  if(file.type!=='application/pdf'){showToast('Seuls les PDF sont accept\u00e9s','#E07060');return;}
  if(file.size>10*1024*1024){showToast('PDF trop lourd \u2014 max 10\u00a0Mo','#E07060');return;}
  _copPdfFile=file;
  var nm=document.getElementById('cop-pdf-name');if(nm)nm.textContent=file.name;
  var sz=document.getElementById('cop-pdf-size');if(sz)sz.textContent=_copFmtSize(file.size);
  var ep=document.getElementById('cop-pdf-empty');if(ep)ep.style.display='none';
  var sp=document.getElementById('cop-pdf-staged');if(sp)sp.style.display='flex';
}

function _copRemovePdf() {
  _copPdfFile=null;
  var ep=document.getElementById('cop-pdf-empty');if(ep)ep.style.display='';
  var sp=document.getElementById('cop-pdf-staged');if(sp)sp.style.display='none';
}

function _copResetPdfZone() {
  _copPdfFile=null;
  var ep=document.getElementById('cop-pdf-empty');if(ep)ep.style.display='';
  var sp=document.getElementById('cop-pdf-staged');if(sp)sp.style.display='none';
  var inp=document.getElementById('cop-pdf-input');if(inp)inp.value='';
}

async function _attachPdfToOp(input) {
  var opId=input&&input.dataset&&input.dataset.opId;
  input.value='';
  if(!opId)return;
  var file=input.files&&input.files[0];
  if(!file)return;
  if(file.type!=='application/pdf'){showToast('Seuls les PDF sont accept\u00e9s','#E07060');return;}
  if(file.size>10*1024*1024){showToast('PDF trop lourd \u2014 max 10\u00a0Mo','#E07060');return;}
  var op=(CAVE_ELEVAGE.operations||[]).find(function(o){return o.id===opId;});
  if(!op){showToast('Op\u00e9ration introuvable','#E07060');return;}
  showSyncBadge('\u23f3 Upload PDF\u2026','#B8913A');
  try {
    var res=await window.fbUploadAnalyse(file,function(){});
    if(!op.data)op.data={};
    op.data.pdf_url=res.url;op.data.pdf_path=res.storage_path;
    op.data.pdf_nom=file.name;op.data.pdf_taille=file.size;
    window.CAVE_ELEVAGE=CAVE_ELEVAGE;
    if(window.fbSave)window.fbSave('cave_elevage',CAVE_ELEVAGE);
    showToast('\u2705 PDF rattach\u00e9','#3D6B27');
    showSyncBadge('\u2705 Synchronis\u00e9','#3D6B27');
    renderCave();
  } catch(e) {
    showToast('Erreur upload PDF','#E07060');
    showSyncBadge('\u26a0 Erreur upload','#B85A1A');
  }
}

// \u2550\u2550\u2550\u2550 CONTENANCE D'UN F\u00DBT \u2014 SOURCE UNIQUE \u2550\u2550\u2550\u2550
// La barrique bourguignonne fait 228 L, la bordelaise 225, un demi-muid 500 a
// 600. La contenance etait ecrite EN DUR a douze endroits de ce fichier : hors
// de Bourgogne, tous les volumes affiches etaient faux, en silence.
// Meme patron que la densite (CONFIG.vigne) et les baremes regionaux :
// CONFIG.cave.fut_l porte la valeur, le DEFAUT reste 228 -> sans reglage, rien
// ne bouge sur les domaines deja installes (228/100 est bit-a-bit identique a
// l'ancien litteral 2.28).
// \u26a0 Les volume_L deja enregistres ne sont JAMAIS recalcules : ce qui est
//   ecrit dans une operation est un fait date, pas une projection.
function _caveFutL(){
  var c=(window.CONFIG&&window.CONFIG.cave)?window.CONFIG.cave:null;
  var v=c?parseFloat(c.fut_l):NaN;
  return (isFinite(v)&&v>0)?v:228; // 228 L = barrique bourguignonne
}
function _caveFutHl(){ return _caveFutL()/100; }

function _caveNbTonneaux(cuv) {
  if(!cuv) return 0;
  if(cuv.tonneaux && cuv.tonneaux.length) return cuv.tonneaux.reduce(function(s,t){return s+(t.nb||0);},0);
  return cuv.nb_tonneaux || 0;
}

function _caveTonneauxStr(cuv) {
  if(!cuv) return '';
  var list = cuv.tonneaux && cuv.tonneaux.length ? cuv.tonneaux : [];
  if(!list.length) return cuv.nb_tonneaux ? cuv.nb_tonneaux+' tonneau'+(cuv.nb_tonneaux>1?'x':'') : '';
  var curY = new Date().getFullYear();
  return list.map(function(t){
    return t.nb+'\u00d7 '+(t.annee>=curY?'Neuf':t.annee);
  }).join(' &middot; ');
}

function _renderCuvTonneaux() {
  var el = document.getElementById('cuv-tonneaux-body'); if(!el) return;
  var curY = new Date().getFullYear();
  var html = '';
  _cuvTonneaux.forEach(function(t, i) {
    var lbl = t.annee >= curY ? 'Neuf' : (curY - t.annee)+' vin'+(curY-t.annee>1?'s':'');
    html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">'
          + '<input type="number" class="fi ac" style="flex:1;margin-bottom:0;" value="'+t.annee+'" min="2000" max="'+(curY+1)+'" placeholder="Ann\u00e9e" onchange="updateCuvTonneau('+i+',\'annee\',this.value)">'
          + '<span style="font-size:11px;color:var(--texte-doux);white-space:nowrap;width:50px;flex-shrink:0;">'+lbl+'</span>'
          + '<input type="number" class="fi ac" style="width:62px;margin-bottom:0;text-align:center;" value="'+t.nb+'" min="1" max="30" placeholder="Nb" onchange="updateCuvTonneau('+i+',\'nb\',this.value)">'
          + '<button onclick="removeCuvTonneau('+i+')" style="background:none;border:none;cursor:pointer;font-size:18px;color:var(--texte-doux);min-height:44px;min-width:44px;padding:0;display:flex;align-items:center;justify-content:center;">\u00d7</button>'
          + '</div>';
  });
  var total = _cuvTonneaux.reduce(function(s,t){return s+(t.nb||0);},0);
  html += '<div style="font-size:12px;color:var(--texte-doux);text-align:right;margin-bottom:4px;">Total\u00a0: <strong style="color:var(--texte);">'+total+'</strong> tonneau'+(total>1?'x':'')+'</div>';
  el.innerHTML = html;
}

function addCuvTonneau() {
  _cuvTonneaux.push({annee:new Date().getFullYear(), nb:1});
  _renderCuvTonneaux();
}

function removeCuvTonneau(i) {
  _cuvTonneaux.splice(i,1);
  _renderCuvTonneaux();
}

function updateCuvTonneau(i, field, val) {
  if(!_cuvTonneaux[i]) return;
  _cuvTonneaux[i][field] = parseInt(val)||(field==='nb'?1:new Date().getFullYear());
  _renderCuvTonneaux();
}

// \u2500\u2500 Multi-intervenants (v4.33) \u2500\u2500
// R\u00e9tro-compatible : anciennes ops = operateur (texte), nouvelles = intervenants[].
function _caveIntLabel(arr){
  if(!arr||!arr.length)return '';
  if(arr.length===1)return arr[0];
  if(arr.length<=3)return arr.join(' + ');
  return '\u00c9quipe ('+arr.length+')';
}
function _caveWho(op){
  var arr=(op&&op.intervenants&&op.intervenants.length)?op.intervenants:((op&&op.operateur)?[op.operateur]:[]);
  return _caveIntLabel(arr);
}
function _caveWhoHtml(op){
  var arr=(op&&op.intervenants&&op.intervenants.length)?op.intervenants:((op&&op.operateur)?[op.operateur]:[]);
  if(!arr.length)return '';
  var avs=arr.slice(0,4).map(function(n){
    var col=(window.COULEURS_MBR||{})[n]||'#7A4F2E';
    return '<span class="cws-av" style="background:'+col+';">'+_escHtml(String(n||'?').charAt(0).toUpperCase())+'</span>';
  }).join('');
  return '<span class="cave-who-stack">'+avs+'</span>'+_escHtml(_caveIntLabel(arr));
}
function _copRenderIntChips(){
  var wrap=document.getElementById('cop-int-wrap');if(!wrap)return;
  var mbrs=(window.MEMBRES||[]).map(function(m){return m.nom;}).filter(Boolean);
  if(!mbrs.length&&window.currentUser&&window.currentUser.nom)mbrs=[window.currentUser.nom];
  wrap.innerHTML=mbrs.map(function(n){
    var sel=_copIntSel.indexOf(n)!==-1;
    var col=(window.COULEURS_MBR||{})[n]||'#7A4F2E';
    var nj=String(n).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return '<button class="cop-int-chip'+(sel?' sel':'')+'" onclick="toggleCopInt(\''+nj+'\')">'
      +'<span class="cic-av" style="background:'+col+';">'+_escHtml(String(n).charAt(0).toUpperCase())+'</span>'
      +'<span class="cic-nm">'+_escHtml(n)+(sel?' \u2713':'')+'</span></button>';
  }).join('');
}
function toggleCopInt(n){
  var i=_copIntSel.indexOf(n);
  if(i>=0){if(_copIntSel.length>1)_copIntSel.splice(i,1);}
  else _copIntSel.push(n);
  _copRenderIntChips();
}

// ── LE SEUIL D'OUILLAGE, PAR MILLESIME ───────────────────────────────
// ⚠ MODELE : un vin jeune s'ouille tous les 7 jours, un vin d'un an tous
// les 14. Le seuil ne peut donc pas etre unique pour la cave entiere.
// Stockage : CAVE_ELEVAGE.config.ouillage_par_mil = { '2026':7, '2025':14 }.
// ⚠ RETRO-COMPATIBLE : sans entree pour un millesime, on retombe sur
// ouillage_alerte_j, le reglage global qui existe deja. Un domaine qui n'y
// touche pas ne voit AUCUN changement.
// SOURCE UNIQUE : onze sites lisaient le seuil chacun de leur cote. Tous
// passent desormais ici, sinon la prochaine correction en oubliera un.
// Le filtre millesime du Chai existe depuis longtemps (_caveMillFilter).
// Ces deux helpers en font la SOURCE UNIQUE : la liste des cuvees, les KPIs
// et l'alerte s'y accrochent au lieu de refiltrer chacun de leur cote.
function _caveDansFiltre(c){
  if(!c) return false;
  if(_caveMillFilter==='tous') return true;
  return String(c.millesime)===String(_caveMillFilter);
}
function _caveCuvsFiltrees(){
  return (CAVE_ELEVAGE.cuvees||[]).filter(function(c){
    return c && c.statut!=='embouteille' && _caveDansFiltre(c);
  });
}
function _caveSeuilGlobal(){
  return (CAVE_ELEVAGE.config && CAVE_ELEVAGE.config.ouillage_alerte_j) || 14;
}
function _caveMilKey(m){ return (m==null||m==='')?'?':String(m); }
// Accepte une CUVEE ou un millesime. Sans argument : le seuil global.
function _caveSeuilOu(x){
  if(x==null) return _caveSeuilGlobal();
  var m=(typeof x==='object')?x.millesime:x;
  var par=(CAVE_ELEVAGE.config && CAVE_ELEVAGE.config.ouillage_par_mil) || {};
  var v=par[_caveMilKey(m)];
  v=parseInt(v,10);
  return (v>0)?v:_caveSeuilGlobal();
}
// Les millesimes presents en cave, du plus recent au plus ancien.
function _caveMilsEnCave(){
  var set={};
  (CAVE_ELEVAGE.cuvees||[]).forEach(function(c){
    if(!c||c.statut==='embouteille') return;
    set[_caveMilKey(c.millesime)]=1;
  });
  return Object.keys(set).sort(function(a,b){
    if(a==='?') return 1; if(b==='?') return -1; return Number(b)-Number(a);
  });
}
function _caveSetSeuilMil(m,n){
  if(typeof isAdmin==='function' && !isAdmin()){ if(window.showToast)window.showToast('Admin requis','#C0392B'); return; }
  var v=Math.max(3,Math.min(30,parseInt(n,10)||0));
  if(!CAVE_ELEVAGE.config) CAVE_ELEVAGE.config={};
  if(!CAVE_ELEVAGE.config.ouillage_par_mil) CAVE_ELEVAGE.config.ouillage_par_mil={};
  CAVE_ELEVAGE.config.ouillage_par_mil[_caveMilKey(m)]=v;
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  if(window.fbSave) window.fbSave('cave_elevage', CAVE_ELEVAGE);
  if(typeof renderCaveReglages==='function') renderCaveReglages();
  if(typeof renderCave==='function') renderCave();
}
function _caveSeuilMilReset(m){
  if(typeof isAdmin==='function' && !isAdmin()){ if(window.showToast)window.showToast('Admin requis','#C0392B'); return; }
  var par=(CAVE_ELEVAGE.config&&CAVE_ELEVAGE.config.ouillage_par_mil);
  if(par) delete par[_caveMilKey(m)];
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  if(window.fbSave) window.fbSave('cave_elevage', CAVE_ELEVAGE);
  if(typeof renderCaveReglages==='function') renderCaveReglages();
  if(typeof renderCave==='function') renderCave();
}
function _caveSeuilMilStep(m,delta){
  _caveSetSeuilMil(m, _caveSeuilOu(m)+delta);
}


function _caveAlerts() {
  var now = Date.now();
  return CAVE_ELEVAGE.cuvees.filter(function(cuv) {
    if(cuv.statut === 'embouteille') return false;
    // Le seuil suit le millesime de LA cuvee, pas un reglage de cave.
    var seuil = _caveSeuilOu(cuv);
    var lastMs = cuv.last_ouillage ? new Date(cuv.last_ouillage).getTime() : 0;
    return !lastMs || Math.floor((now - lastMs) / 86400000) >= seuil;
  }).map(function(cuv) {
    var lastMs = cuv.last_ouillage ? new Date(cuv.last_ouillage).getTime() : 0;
    return { cuv: cuv, daysSince: lastMs ? Math.floor((Date.now()-lastMs)/86400000) : 9999 };
  });
}

function _caveDateFr(iso) {
  if(!iso) return '\u2014';
  var d = new Date(iso); if(isNaN(d)) return iso;
  var m = ['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];
  return d.getDate()+' '+m[d.getMonth()]+' '+d.getFullYear();
}




function _caveFmlLabel(v) {
  return {none:'Non d\u00e9clench\u00e9e',cours:'En cours',ok:'Termin\u00e9e \u2713'}[v]||v;
}

function _caveTypeLabel(type) {
  return {ouillage:'Ouillage',soutirage:'Soutirage',soufre:'Soufre',analyse:'Analyse',autre:'Autre'}[type]||type;
}

// \u2500\u2500 helpers multi-cuv\u00E9es formulaire op\u00E9ration \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
var _COP_MOIS_C=['jan','f\u00e9v','mar','avr','mai','juin','juil','ao\u00fbt','sep','oct','nov','d\u00e9c'];
var _COP_MOIS_L=['janvier','f\u00e9vrier','mars','avril','mai','juin','juillet','ao\u00fbt','septembre','octobre','novembre','d\u00e9cembre'];
function _copAccent(){return {ouillage:'#C0845A',soutirage:'#5CB87A',soufre:'#4A9C50',analyse:'#4A9FC8',autre:'#A0A8B8'}[_caveOpType]||'#A0A8B8';}
function _caveCuvLabel(op){
  var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
  if(!ids.length)return '\u2014';
  if(ids.length===1){var c=CAVE_ELEVAGE.cuvees.find(function(x){return x.id===ids[0];})||{};return (c.nom||'?')+(c.millesime?' '+c.millesime:'');}
  var tot=CAVE_ELEVAGE.cuvees.filter(function(c){return c.statut!=='embouteille';}).length;
  if(ids.length>=tot)return 'Toutes les cuv\u00e9es';
  if(ids.length>3)return ids.length+' cuv\u00e9es';
  return ids.map(function(id){var c=CAVE_ELEVAGE.cuvees.find(function(x){return x.id===id;})||{};return c.nom||(c.id||'?');}).join(' \u00b7 ');
}
// Pills HTML pour affichage journal \u2014 toujours les vrais noms (jamais "N cuv\u00e9es" ni "Toutes les cuv\u00e9es" sans noms)
function _caveCuvPillsHtml(op){
  var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
  if(!ids.length)return '<span style="color:var(--texte-leger);">\u2014</span>';
  var cuvs=ids.map(function(id){return CAVE_ELEVAGE.cuvees.find(function(x){return x.id===id;});}).filter(Boolean);
  if(!cuvs.length)return '<span style="color:var(--texte-leger);">\u2014</span>';
  return '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px;">'
    +cuvs.map(function(c){
      return '<span style="font-size:11px;font-weight:500;background:rgba(74,159,200,0.12);color:#4A9FC8;'
            +'border:1px solid rgba(74,159,200,0.22);border-radius:7px;padding:2px 8px;white-space:nowrap;">'
            +'\uD83C\uDF77\u00a0'+_escHtml(c.nom)+(c.millesime?'\u00a0\u2019'+String(c.millesime).slice(2):'')+'</span>';
    }).join('')
    +'</div>';
}
function _copGetNbFuts(){
  // ⚠ « Toutes » ne veut plus dire toute la cave : seulement le millesime
  // courant. Sans ce filtre, cocher « Toutes » recreait une operation mixte.
  var actives=_copCuvsDuMil();
  if(_copAllCuv)return actives.reduce(function(s,c){return s+_caveNbTonneaux(c);},0);
  return Array.from(_copCuvSel).reduce(function(s,id){var c=actives.find(function(x){return x.id===id;});return s+(c?_caveNbTonneaux(c):0);},0);
}
function _copUpdateChips(){
  var actives=_copCuvsDuMil();
  var a=_copAccent();
  var ab=document.getElementById('cop-chip-all');
  if(ab){ab.style.background=_copAllCuv?a:'';ab.style.color=_copAllCuv?'#fff':'';ab.style.border=_copAllCuv?'none':'';}
  actives.forEach(function(c){
    var b=document.getElementById('cop-chip-'+c.id);if(!b)return;
    var on=_copAllCuv||_copCuvSel.has(c.id);
    b.style.background=on?a+'1e':'';b.style.color=on?a:'';b.style.border=on?'1px solid '+a+'88':'';
  });
}
function _copUpdateFutsSummary(){
  var n=_copGetNbFuts(),el=document.getElementById('cop-cuvees-summary');if(!el)return;
  if(!_copAllCuv&&_copCuvSel.size===0){el.textContent='S\u00e9lectionnez des cuv\u00e9es';el.style.color='var(--texte-leger)';}
  else{var _mm=(_copMil!=null&&_copMillesimes().length>1)?(' du '+(_copMil==='?'?'sans millésime':_copMil)):'';
    var lbl=_copAllCuv?('Toutes les cuv\u00e9es'+_mm):(_copCuvSel.size+' cuv\u00e9e'+(_copCuvSel.size>1?'s':'')+_mm);el.textContent=n+' f\u00fbt'+(n>1?'s':'')+' \u00b7 '+lbl;el.style.color='var(--texte)';}
  updateCopOuillageCalc();
}

// ── UN MILLESIME PAR OPERATION ───────────────────────────────────────
// ⚠ MODELE ARBITRE PAR NICO : chaque millesime est une entite a part, ils
// sont dans des caves separees. On n'ouille pas les futs de 2025 avec du
// vin de 2026. L'interdiction vaut pour TOUTES les operations, pas juste
// l'ouillage : le millesime se choisit AVANT les cuvees, et seules celles
// de ce millesime sont proposees.
// ⚠ Volontairement PAS de « Tous » ici : ce serait rouvrir exactement la
// porte qu'on ferme. Le tout-confondu vit en CONSULTATION (Chai, Pilotage),
// jamais en saisie.
var _copMil = null;

// Les millesimes reellement en cave, du plus recent au plus ancien.
function _copMillesimes(){
  var act=(CAVE_ELEVAGE.cuvees||[]).filter(function(c){return c&&c.statut!=='embouteille';});
  var set={};
  act.forEach(function(c){ var m=(c.millesime==null||c.millesime==='')?'?':String(c.millesime); set[m]=1; });
  return Object.keys(set).sort(function(a,b){
    if(a==='?') return 1; if(b==='?') return -1;
    return Number(b)-Number(a);
  });
}

// Les cuvees actives du millesime courant. C'est la SEULE porte d'entree
// vers les chips : tout ce qui construit ou compte passe par elle.
function _copCuvsDuMil(){
  var act=(CAVE_ELEVAGE.cuvees||[]).filter(function(c){return c&&c.statut!=='embouteille';});
  if(_copMil==null) return act;
  return act.filter(function(c){
    var m=(c.millesime==null||c.millesime==='')?'?':String(c.millesime);
    return m===_copMil;
  });
}

function _copRenderMils(){
  var wrap=document.getElementById('cop-mil-wrap'); if(!wrap) return;
  var mils=_copMillesimes(), a=_copAccent();
  if(mils.length<=1){
    // Un seul millesime en cave : le rang n'apporte rien, on le masque et on
    // le fixe. C'est le cas de tout domaine qui debute.
    _copMil=mils.length?mils[0]:null;
    wrap.innerHTML=''; wrap.style.display='none';
    var n0=document.getElementById('cop-mil-note'); if(n0) n0.style.display='none';
    return;
  }
  wrap.style.display='flex';
  wrap.innerHTML=mils.map(function(m){
    var nb=(CAVE_ELEVAGE.cuvees||[]).filter(function(c){
      if(!c||c.statut==='embouteille') return false;
      return ((c.millesime==null||c.millesime==='')?'?':String(c.millesime))===m;
    }).length;
    var on=(m===_copMil);
    return '<button class="cave-cuvee-chip" id="cop-mil-'+_escHtml(m)+'" onclick="selCopMil(\''+_escHtml(m)+'\')"'
      +(on?' style="background:'+a+';color:#fff;border:none;"':'')
      +'>'+(m==='?'?'Sans millésime':_escHtml(m))+' \u00b7 '+nb+'</button>';
  }).join('');
  var note=document.getElementById('cop-mil-note');
  if(note){
    note.style.display='block';
    note.textContent='Une opération porte sur un seul millésime : on ne mélange pas les vins.';
  }
}

// Changer de millesime VIDE la selection : garder des cuvees d'un autre
// millesime cochees serait precisement l'operation mixte qu'on interdit.
function selCopMil(m){
  if(_copMil===m) return;
  _copMil=m; _copAllCuv=false; _copCuvSel.clear();
  _copRenderMils(); _copRenderCuvChips(); _copUpdateChips(); _copUpdateFutsSummary();
}

// Construction des chips de cuvees — filtree par _copMil.
function _copRenderCuvChips(){
  var wrap=document.getElementById('cop-cuvees-wrap'); if(!wrap) return;
  var cuvs=_copCuvsDuMil();
  var totalFuts=cuvs.reduce(function(s,c){return s+_caveNbTonneaux(c);},0);
  var lblAll=(_copMillesimes().length>1&&_copMil!=null)
    ? ('Tout le '+(_copMil==='?'?'sans millésime':_copMil)+' \u00b7 '+totalFuts+' fûts')
    : ('Toutes \u00b7 '+totalFuts+' fûts');
  var ch='<button class="cave-cuvee-chip" id="cop-chip-all" onclick="toggleCopAllCuv()">'+_escHtml(lblAll)+'</button>';
  cuvs.forEach(function(c){
    var nbT=_caveNbTonneaux(c);
    ch+='<button class="cave-cuvee-chip" id="cop-chip-'+c.id+'" onclick="toggleCopCuvee(\''+c.id+'\')">'
       +_escHtml(c.nom)+(c.millesime?' '+_escHtml(c.millesime):'')+'\u00b7 '+nbT+'</button>';
  });
  wrap.innerHTML=ch;
}

function toggleCopAllCuv(){_copAllCuv=!_copAllCuv;if(_copAllCuv)_copCuvSel.clear();_copUpdateChips();_copUpdateFutsSummary();}
function toggleCopCuvee(id){if(_copAllCuv){_copAllCuv=false;_copCuvSel.clear();}if(_copCuvSel.has(id))_copCuvSel.delete(id);else _copCuvSel.add(id);_copUpdateChips();_copUpdateFutsSummary();}
function adjCopOuillette(d){_copOuillette=Math.max(1,_copOuillette+d);var el=document.getElementById('cop-ouillette-val');if(el)el.textContent=_copOuillette;updateCopOuillageCalc();}
function updateCopOuillageCalc(){
  var nb=parseInt((document.getElementById('cop-nb-ouillettes')||{}).value)||0;
  var n=_copGetNbFuts(),res=document.getElementById('cop-ouillage-result');
  if(nb>0&&n>0){
    var v=nb*_copOuillette;if(res)res.style.display='flex';
    var ve=document.getElementById('cop-res-vol');if(ve)ve.textContent=v+' L';
    var pe=document.getElementById('cop-res-parfut');if(pe)pe.textContent=(v/n).toFixed(1);
  } else {if(res)res.style.display='none';}
}
function setCopSo2Mode(mode){
  _copSo2Mode=mode;
  ['none','unique','recurrent'].forEach(function(m){var b=document.getElementById('cop-so2-'+m);if(b)b.classList.toggle('cave-so2-active',m===mode);});
  var u=document.getElementById('cop-so2-f-unique'),r=document.getElementById('cop-so2-f-recurrent');
  if(u)u.style.display=mode==='unique'?'block':'none';
  if(r)r.style.display=mode==='recurrent'?'block':'none';
  _copUpdateOpDate();
}
function setCopSo2Nb(n){
  _copSo2Nb=n;[2,3].forEach(function(v){var b=document.getElementById('cop-so2-nb-'+v);if(b)b.classList.toggle('cave-toggle-active',v===n);});
  _copUpdateSo2Cal();
}
function setCopSo2Freq(f){
  _copSo2Freq=f;[10,15].forEach(function(v){var b=document.getElementById('cop-so2-freq-'+v);if(b)b.classList.toggle('cave-toggle-active',v===f);});
  _copUpdateSo2Cal();
}
function _copUpdateSo2Cal(){
  var cal=document.getElementById('cop-so2-cal');if(!cal)return;
  var dv=(document.getElementById('cop-date')||{}).value;if(!dv){cal.style.display='none';return;}
  var base=new Date(dv);
  var html='<div class="cave-so2-cal-title">\uD83D\uDCC5 Calendrier SO\u2082 pr\u00e9vu</div>';
  for(var i=0;i<_copSo2Nb;i++){
    var d=new Date(base);d.setDate(d.getDate()+i*_copSo2Freq);
    var ds=d.getDate()+' '+_COP_MOIS_C[d.getMonth()]+' '+d.getFullYear();
    var jl=i===0?'J0 \u00b7 soutirage':'J+'+(i*_copSo2Freq);
    html+='<div class="cave-so2-cal-row"><span class="cave-so2-cal-j">'+jl+'</span><span class="cave-so2-cal-d">'+ds+'</span></div>';
  }
  cal.innerHTML=html;cal.style.display='block';
}
function _copUpdateOpDate(){
  var dv=(document.getElementById('cop-date')||{}).value;if(!dv)return;
  var d=new Date(dv);
  var el=document.getElementById('cop-so2-unique-date');
  if(el)el.textContent='Le '+d.getDate()+' '+_COP_MOIS_L[d.getMonth()]+' '+d.getFullYear();
  _copUpdateSo2Cal();
}


function _caveSaisBanner() {
  if(!isSaisonnier()) return '';
  return '<div style="margin:0 0 10px;padding:8px 12px;border-radius:10px;background:rgba(184,90,26,.08);border:1px solid rgba(184,90,26,.2);display:flex;align-items:center;gap:8px;font-size:11.5px;color:#B85A1A">'
    +'\uD83D\uDD12 Lecture seule \u2014 votre r\u00f4le ne permet pas de modifier les donn\u00e9es.</div>';
}

// ══════ REFONTE ÉLEVAGE (mvc) ══════
function _mvcHide(){
  var host=document.getElementById('mvc-elevage'); if(host) host.style.display='none';
}
function _caveDSince(c){
  if(!c || !c.last_ouillage) return 9999;
  var ms=new Date(c.last_ouillage).getTime();
  if(!ms) return 9999;
  return Math.floor((Date.now()-ms)/86400000);
}
function _caveState(c){
  if(c.statut==='embouteille') return 'bottled';
  var seuil=_caveSeuilOu(c);
  var d=_caveDSince(c);
  if(d>=seuil) return 'due';
  if(d>=seuil*0.7) return 'watch';
  return 'ok';
}
function _mvcRenderHeader(){
  var el=document.getElementById('mvc-header');
  // Le bandeau suit le filtre millesime du Chai : afficher « 32 cuvees »
  // pendant qu'on ne regarde que le 2026 ne correspond a rien de concret.
  // _caveMillFilter='tous' redonne la cave entiere — c'est le defaut.
  var act=_caveCuvsFiltrees();
  var futs=act.reduce(function(s,c){return s+_caveNbTonneaux(c);},0);
  var hl=futs?(futs*_caveFutHl()).toFixed(0):'0';
  // ⚠ _caveAlerts() renvoie des {cuv, daysSince}, pas des cuvees : le filtre
  // doit porter sur .cuv, sinon il ne matche jamais et le compteur tombe a 0.
  var due=_caveAlerts().filter(function(a){ return _caveDansFiltre(a.cuv); }).length;
  var okN=Math.max(0,act.length-due);
  var okPct=act.length?Math.round(okN/act.length*100):100;
  var kpis=[[act.length,'Cuvées',false],[futs,'Fûts',false],[hl,'hL',false],[due,'À ouiller',true]];
  // En-t\u00EAte UNIQUE : on alimente le bandeau commun (plus de second en-t\u00EAte empil\u00E9)
  var _ico=document.getElementById('cave-hdr-ico'); if(_ico) _ico.textContent='\ud83d\udee2\ufe0f';
  var _ttl=document.getElementById('cave-hdr-title'); if(_ttl) _ttl.textContent='Le Chai';
  var _sub=document.getElementById('cave-hdr-sub'); if(_sub) _sub.textContent=(window.DOMAINE_NOM||'Mon domaine');
  var _bdg=document.getElementById('cave-hdr-badge');
  if(_bdg) _bdg.textContent=act.length?(act.length+' cuv\u00E9e'+(act.length>1?'s':'')):'\u2014';
  // Bande de chiffres HORS en-t\u00EAte \u2192 hauteur d'en-t\u00EAte constante
  var _kp=document.getElementById('cave-kpis');
  if(_kp){
    _kp.style.display='';
    _kp.innerHTML=kpis.map(function(k){
      return '<div class="mvu-kpi'+(k[2]&&due>0?' due':'')+'"><div class="mvu-kpi-v">'+k[0]+'</div><div class="mvu-kpi-l">'+k[1]+'</div></div>';
    }).join('');
  }
  if(el) el.innerHTML=''
    +'<div class="mvc-health"><div class="mvc-health-track"><div class="mvc-health-ok" style="width:'+okPct+'%"></div><div class="mvc-health-due" style="width:'+(100-okPct)+'%"></div></div>'
    +'<div class="mvc-health-lbl"><span><b>'+okN+'</b> \u00e0 jour</span><span>'+(due?'<b>'+due+'</b> en retard':'Chai sous contr\u00f4le \u2713')+'</span></div></div>';
  if(typeof window._mvMetaSync==='function') window._mvMetaSync();
  var tabCuv=document.getElementById('mvc-tbtn-cuv');
  if(tabCuv) tabCuv.innerHTML='\ud83d\udee2\ufe0f Cuv\u00e9es'+(due>0?' <span class="mvc-tab-badge">'+due+'</span>':'');
}
function _caveGaugeHtml(c){
  var seuil=_caveSeuilOu(c);
  var d=_caveDSince(c), st=_caveState(c);
  var pct=Math.min(100,Math.round(d/seuil*100));
  var cls=st==='due'?'g-due':st==='watch'?'g-watch':'g-ok';
  var stateLbl,stateCol,sub;
  if(!c.last_ouillage){stateLbl='Jamais ouill\u00e9';stateCol='var(--rouge-soft,#E07060)';sub='\u00c0 ouiller sans attendre';pct=100;}
  else if(st==='due'){stateLbl='\u00c0 ouiller';stateCol='var(--rouge-soft,#E07060)';sub='Ouill\u00e9 il y a '+d+' j \u00b7 seuil d\u00e9pass\u00e9 (+'+(d-seuil)+' j)';}
  else if(st==='watch'){stateLbl='Bient\u00f4t';stateCol='#B8913A';sub='Ouill\u00e9 il y a '+d+' j \u00b7 reste '+(seuil-d)+' j';}
  else {stateLbl='\u00c0 jour';stateCol='var(--vert-med,#3D6B27)';sub='Ouill\u00e9 '+(d===0?'aujourd\u2019hui':'il y a '+d+' j')+' \u00b7 reste '+(seuil-d)+' j';}
  return '<div class="mvc-gauge"><div class="mvc-gauge-top"><span class="mvc-gauge-lbl">\u23f3 Part des anges</span><span class="mvc-gauge-state" style="color:'+stateCol+'">'+stateLbl+'</span></div>'
    +'<div class="mvc-gauge-track"><div class="mvc-gauge-fill '+cls+'" style="width:'+pct+'%"></div></div>'
    +'<div class="mvc-gauge-sub">'+sub+'</div></div>';
}
function _caveAnaLineHtml(c){
  var la=_caveLastAna(c.id);
  if(!la) return '<div class="mvc-cuv-ana"><span class="mvc-tag-none">Aucune analyse enregistr\u00e9e</span></div>';
  var so2=(la._src==='op'&&la.data)?la.data.so2_libre:null;
  var lao=_caveLastAnaOp(c.id);
  var fml=(lao&&lao.data)?lao.data.fml:(c.fml_terminee?'ok':null);
  var tags='';
  if(so2) tags+='<span class="mvc-tag mvc-tag-so2">SO\u2082 '+so2+' mg/L</span>';
  if(fml==='ok') tags+='<span class="mvc-tag mvc-tag-fmlok">FML \u2713</span>';
  else if(fml==='cours') tags+='<span class="mvc-tag mvc-tag-fmlc">FML en cours</span>';
  var pdf=(la.data&&la.data.pdf_url)?'<span class="mvc-tag-pdf">\ud83d\udcc4</span>':'';
  if(!tags&&!pdf) tags='<span class="mvc-tag-none">Analyse le '+_caveDateFr(la.date_analyse)+'</span>';
  return '<div class="mvc-cuv-ana">'+tags+pdf+'<span class="mvc-ana-date">'+_caveDateFr(la.date_analyse)+'</span></div>';
}
// Ce que le Chai montrait du soutirage : rien. Ni les operations, ni le
// drapeau qu'on saisissait dans la fiche. Une cuvee est SOUTIREE, et elle
// peut l'etre plusieurs fois : on montre la derniere date et le compte.
function _caveSoutLineHtml(c){
  var d=_caveLastSout(c.id);
  if(!d) return '';
  var n=_caveSoutOps(c.id).length;
  return '<div class="mvc-cuv-sout"><span class="mvc-tag mvc-tag-sout">\u21d5 Soutir\u00e9e le '+_caveDateFr(d)+'</span>'
    +(n>1?'<span class="mvc-sout-note">'+n+' soutirages</span>':'')+'</div>';
}
function _caveCuvCardHtml(c,w){
  var st=_caveState(c);
  var nbT=_caveNbTonneaux(c);
  var hl=(nbT*_caveFutHl()).toFixed(1);
  var isEmb=c.statut==='embouteille';
  var urgent=st==='due';
  var right=isEmb?'<span class="mvc-badge-bottled">Embouteill\u00e9e</span>':'<span class="mvc-mill">\u2019'+String(c.millesime||'').slice(-2)+'</span>';
  var tonStr=_caveTonneauxStr(c);
  var actions='';
  if(!isEmb && w){
    actions='<div class="mvc-cuv-actions">'
      +'<button class="mvc-act primary'+(urgent?' urgent':'')+'" onclick="_caveQuickOp(event,\'ouillage\',\''+c.id+'\')">\ud83e\udea3 Ouiller</button>'
      +'<button class="mvc-act icon" onclick="_caveQuickOp(event,\'soutirage\',\''+c.id+'\')" aria-label="Soutirer">\u21d5</button>'
      +'<button class="mvc-act icon" onclick="_caveQuickOp(event,\'analyse\',\''+c.id+'\')" aria-label="Analyser">\ud83d\udd2c</button>'
    +'</div>';
  }
  return '<div class="mvc-cuv st-'+st+'" onclick="openCuveeDetail(\''+c.id+'\')">'
    +'<div class="mvc-cuv-head"><div class="mvc-cuv-lead"><div class="mvc-cuv-name">'+_escHtml(c.nom)+'</div>'
    +(tonStr?'<div class="mvc-cuv-ton">'+tonStr+'</div>':'')+'</div>'+right+'</div>'
    +'<div class="mvc-cuv-vol">\ud83d\udee2\ufe0f '+nbT+' f\u00fbt'+(nbT>1?'s':'')+' <span class="mvc-dot"></span> '+hl+' hL</div>'
    +(isEmb?'':_caveGaugeHtml(c))
    +_caveAnaLineHtml(c)
    +(isEmb?'':_caveSoutLineHtml(c))
    +actions
  +'</div>';
}
function _caveQuickOp(ev,type,cuvId){
  if(ev) ev.stopPropagation();
  if(isSaisonnier()){showToast('Acc\u00e8s lecture seule \ud83d\udd12','#B85A1A');return;}
  openOvCaveOp();
  selCaveOpType(type);
  _copAllCuv=false;
  _copCuvSel=new Set([cuvId]);
  _copUpdateChips();
  if(typeof _copUpdateFutsSummary==='function') _copUpdateFutsSummary();
}
function _caveOuillerTous(){
  if(isSaisonnier()){showToast('Acc\u00e8s lecture seule \ud83d\udd12','#B85A1A');return;}
  var due=_caveAlerts();
  if(!due.length) return;
  openOvCaveOp();
  selCaveOpType('ouillage');
  _copAllCuv=false;
  _copCuvSel=new Set(due.map(function(a){return a.cuv.id;}));
  _copUpdateChips();
  if(typeof _copUpdateFutsSummary==='function') _copUpdateFutsSummary();
  showToast(due.length+' cuv\u00e9e'+(due.length>1?'s':'')+' pr\u00e9s\u00e9lectionn\u00e9e'+(due.length>1?'s':'')+' \u2014 saisissez l\u2019ouillage','#C0845A');
}
function _caveJDet(op){
  var h='';
  if(op.type==='ouillage'&&op.data&&op.data.nb_ouillettes){
    h+='<div class="mvc-jdet">'+op.data.nb_ouillettes+' ouillettes \u00d7 '+op.data.vol_ouillette_L+' L = '+op.data.vol_total_L+' L'+(op.data.vol_par_fut_L?' \u00b7 '+op.data.vol_par_fut_L+' L/f\u00fbt':'')+'</div>';
  }
  if(op.type==='soutirage'&&op.data&&op.data.so2&&op.data.so2.mode&&op.data.so2.mode!=='none'){
    var s=op.data.so2, str='SO\u2082 ';
    if(s.dose) str+=s.dose+' '+(s.unite||'cL')+' ';
    str+=(s.mode==='unique')?'\u00b7 dose unique':'\u00d7 '+s.nb_doses+' / '+s.freq_j+' j';
    h+='<div class="mvc-jdet" style="color:#5CB87A">'+str+'</div>';
  }
  if(op.type==='soufre'&&op.data){
    h+='<div class="mvc-jdet"><span class="mvc-soufre-g">'+op.data.grammes_pastille+'g</span>'+op.data.nb_total+' pastille'+(op.data.nb_total>1?'s':'')+' <b style="color:#3A8C40">= '+op.data.so2_total_g+' g SO\u2082</b></div>';
  }
  if(op.type==='analyse'&&op._src==='op'&&op.data){
    var chips='';
    if(op.data.so2_libre) chips+='<span class="mvc-tag mvc-tag-so2">SO\u2082 libre '+op.data.so2_libre+'</span>';
    if(op.data.so2_total) chips+='<span class="mvc-tag mvc-tag-so2">SO\u2082 total '+op.data.so2_total+'</span>';
    if(op.data.av) chips+='<span class="mvc-tag mvc-tag-av">AV '+op.data.av+'</span>';
    if(op.data.malique!=null) chips+='<span class="mvc-tag mvc-tag-av">Malique '+op.data.malique+' g/L</span>';
    if(op.data.fml){var fc=op.data.fml==='ok'?'mvc-tag-fmlok':op.data.fml==='cours'?'mvc-tag-fmlc':'mvc-tag-fmlno';chips+='<span class="mvc-tag '+fc+'">'+_caveFmlLabel(op.data.fml)+'</span>';}
    if(chips) h+='<div class="mvc-jtags">'+chips+'</div>';
    if(op.data.pdf_url){
      h+='<div class="mvc-jpdf">\ud83d\udcc4 <span class="mvc-jpdf-nm">'+_escHtml(op.data.pdf_nom||'analyse.pdf')+'</span><button onclick="window.open(\''+_escHtml(op.data.pdf_url)+'\',\'_blank\')" class="mvc-jpdf-btn">Ouvrir</button></div>';
    } else if(typeof isAdmin==='function'&&isAdmin()){
      h+='<div style="margin-top:6px"><label class="mvc-attach">\ud83d\udcce Joindre un PDF<input type="file" accept="application/pdf" style="display:none" data-op-id="'+op.id+'" onchange="window._attachPdfToOp(this)"></label></div>';
    }
  }
  if(op.type==='analyse'&&op._src==='ana'&&op.data){
    if(op.data.fichier) h+='<div class="mvc-jdet">\ud83d\udcc4 '+_escHtml(op.data.fichier||'')+(op.data.taille?' \u00b7 '+_caveAnaFmtSize(op.data.taille):'')+'</div>';
    if(op.data.url) h+='<div class="mvc-jpdf"><button onclick="window.open(\''+_escHtml(op.data.url)+'\',\'_blank\')" class="mvc-jpdf-btn">Ouvrir</button></div>';
  }
  return h;
}
function renderCaveReglages(){
  var el=document.getElementById('mvc-body-reglages'); if(!el) return;
  var adm=(typeof isAdmin==='function'&&isAdmin());
  var seuil=_caveSeuilGlobal();
  var _mils=_caveMilsEnCave();
  var html='';
  if(adm){
    // Un seuil par millesime : un vin jeune s'ouille plus souvent qu'un vin
    // d'un an. Le stepper global reste la reference des millesimes non regles.
    html+='<div class="mvc-set-card"><div class="mvc-set-t">\u23f3 Alerte d\u2019ouillage</div>'
      +'<div class="mvc-set-d">Nombre de jours sans ouillage avant qu\u2019une cuv\u00e9e passe au rouge. La jauge \u00ab part des anges \u00bb se cale sur ce seuil.</div>'
      +'<div class="mvc-stepper"><button class="mvc-step-btn" onclick="_caveSeuilStep(-1)" aria-label="Diminuer">\u2212</button>'
      +'<div class="mvc-step-val"><div class="mvc-step-num" id="mvc-seuil-num">'+seuil+'</div><div class="mvc-step-unit">JOURS</div></div>'
      +'<button class="mvc-step-btn" onclick="_caveSeuilStep(1)" aria-label="Augmenter">\uff0b</button></div>';
    if(_mils.length){
      html+='<div class="mvc-set-sep"></div><div class="mvc-set-d" style="margin-bottom:8px">Par mill\u00e9sime \u2014 un vin jeune se rattrape plus souvent qu\u2019un vin d\u2019un an. Sans r\u00e9glage propre, le mill\u00e9sime suit le seuil ci-dessus.</div>';
      _mils.forEach(function(m){
        var par=(CAVE_ELEVAGE.config&&CAVE_ELEVAGE.config.ouillage_par_mil)||{};
        var propre=(parseInt(par[m],10)>0);
        html+='<div class="mvc-milrow"><span class="mvc-milrow-a">'+(m==='?'?'Sans mill\u00e9sime':_escHtml(m))+'</span>'
          +'<button class="mvc-step-btn sm" onclick="_caveSeuilMilStep(\''+_escHtml(m)+'\',-1)" aria-label="Diminuer">\u2212</button>'
          +'<span class="mvc-milrow-v'+(propre?' own':'')+'">'+_caveSeuilOu(m)+' j</span>'
          +'<button class="mvc-step-btn sm" onclick="_caveSeuilMilStep(\''+_escHtml(m)+'\',1)" aria-label="Augmenter">\uff0b</button>'
          +(propre?'<button class="mvc-milrow-x" onclick="_caveSeuilMilReset(\''+_escHtml(m)+'\')" title="Revenir au seuil g\u00e9n\u00e9ral">\u21a9</button>':'<span class="mvc-milrow-x" style="visibility:hidden">\u21a9</span>')
          +'</div>';
      });
    }
    html+='</div>';
    html+='<div class="mvc-set-card"><div class="mvc-set-t">\ud83d\udee2\ufe0f Contenance d\u2019un f\u00fbt</div>'
      +'<div class="mvc-set-d">Volume d\u2019une barrique. Sert \u00e0 convertir les f\u00fbts en hL partout dans Le Chai. 228 L en Bourgogne, 225 L \u00e0 Bordeaux, 500 \u00e0 600 L pour un demi-muid.</div>'
      +'<button class="mvc-set-btn" onclick="_caveFutPrompt()">'+_caveFutL()+' L \u00b7 Modifier</button></div>';
  }
  html+='<div class="mvc-set-card"><div class="mvc-set-t">\ud83e\uddea Convertisseur SO\u2082</div>'
    +'<div class="mvc-set-d">Dose, dilution, pastilles \u2014 pour pr\u00e9parer vos sulfitages.</div>'
    +'<button class="mvc-set-btn" onclick="openOvCaveConvert()">Ouvrir le convertisseur</button></div>';
  el.innerHTML=html;
}
function _caveSeuilStep(delta){
  var cur=(CAVE_ELEVAGE.config&&CAVE_ELEVAGE.config.ouillage_alerte_j)||14;
  var v=Math.max(3,Math.min(30,cur+delta));
  if(!CAVE_ELEVAGE.config) CAVE_ELEVAGE.config={};
  CAVE_ELEVAGE.config.ouillage_alerte_j=v;
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  if(window.fbSave) window.fbSave('cave_elevage',CAVE_ELEVAGE);
  var n=document.getElementById('mvc-seuil-num'); if(n) n.textContent=v;
  _mvcRenderHeader();
  renderCaveCuvees();
  showToast('Seuil r\u00e9gl\u00e9 \u00e0 '+v+' jours \u23f3','#3D6B27');
}
// Reglage de la contenance d'un fut. openPrompt (jamais prompt() natif : il ne
// rend RIEN en PWA iOS). Ecrit CONFIG.cave.fut_l en PRESERVANT le reste de
// CONFIG.cave, puis re-rend l'affichage. Ne recalcule AUCUN volume deja stocke.
function _caveFutPrompt(){
  if(!(typeof isAdmin==='function'&&isAdmin())){ showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur \ud83d\udd12','#C0392B'); return; }
  if(typeof window.openPrompt!=='function'){ showToast('Saisie indisponible','#C0392B'); return; }
  window.openPrompt({
    icone:'\ud83d\udee2\ufe0f',
    titre:'Contenance d\u2019un f\u00fbt',
    sub:'228 L en Bourgogne, 225 L \u00e0 Bordeaux, 500 \u00e0 600 L pour un demi-muid.',
    valeur:_caveFutL(),
    unite:'L',
    type:'nombre',
    btnLabel:'Enregistrer',
    cb:function(v){
      var n=parseFloat(String(v).replace(',','.'));
      if(!isFinite(n)||n<50||n>5000){ showToast('Contenance attendue entre 50 et 5000 L','#B85A1A'); return; }
      window.CONFIG=window.CONFIG||{};
      window.CONFIG.cave=Object.assign({},window.CONFIG.cave||{},{fut_l:n});
      if(window.saveData)window.saveData('config');
      _mvcRenderHeader();
      renderCaveCuvees();
      renderCaveReglages();
      showToast('\u2705 F\u00fbt r\u00e9gl\u00e9 \u00e0 '+n+' L','#3D6B27');
    }
  });
}



function _caveSyncSecTabs(){
  ['elevage','vendange','millesime'].forEach(function(s){
    var b=document.getElementById('cave-sec-'+s);
    if(b) b.classList.toggle('active', s===caveSection);
  });
}

function renderCave() {
  // Filet de tolerance : une valeur hors des TROIS sections connues replie sur
  // l'Elevage. Sans lui, une valeur reposee par un autre module masque les trois
  // vues et la Cave s'ouvre VIDE, sans erreur et sans test qui le voie.
  if (['elevage','vendange','millesime'].indexOf(caveSection)<0) caveSection = 'elevage';
  _caveSyncSecTabs();
  if (caveSection === 'millesime') { _mvcHide(); _mlHideAutres(); renderCaveMillesime(); return; }
  var _mlHost=document.getElementById('cave-view-mil'); if(_mlHost) _mlHost.style.display='none';
  if (caveSection === 'vendange') { _mvcHide(); renderCaveVendange(); return; }
  // ── Élevage (refonte mvc) ──
  ['cuv','journal','divers','vend'].forEach(function(t){var v=document.getElementById('cave-view-'+t);if(v)v.style.display='none';});
  var mlv2=document.getElementById('cave-view-mil'); if(mlv2) mlv2.style.display='none';
  var host=document.getElementById('mvc-elevage'); if(host) host.style.display='block';
  _mvcRenderHeader();
  switchCaveOng(caveTab||'cuv');
}



function selectCaveSection(id) {
  caveSection=id;
  caveTab='cuv';
  _vendTab='cuves';
  renderCave();
}

// Masque les vues du Chai et du Cuvier quand on ouvre Le millesime.
function _mlHideAutres(){
  ['cuv','journal','divers','vend'].forEach(function(t){
    var v=document.getElementById('cave-view-'+t); if(v) v.style.display='none';
  });
}


function switchCaveOng(tab) {
  // Les QUATRE onglets du Chai, definis UNE seule fois : le filet ci-dessous et la
  // boucle d'affichage doivent parler de la meme liste (deux definitions du meme
  // concept dans un module = incoherence garantie entre deux ecrans).
  var ONGLETS = ['cuv','journal','reglages','bouteille'];
  if(tab==='divers') tab='reglages';
  // Filet de tolerance, meme patron que switchPhytoTab qui replie tout inconnu sur 'reg'.
  // Sans lui, une valeur hors liste (l'ancien 'dash' du tableau de bord purge, ou une
  // valeur reposee par un autre module) masque les QUATRE vues et n'active aucun
  // bouton : Le Chai s'ouvre VIDE, sans erreur, sans trace, sans test qui le voie.
  if(ONGLETS.indexOf(tab)<0) tab='cuv';
  caveTab = tab;
  _caveEnsureBtlTab();
  ONGLETS.forEach(function(t) {
    var btn=document.getElementById('mvc-tbtn-'+t);
    var view=document.getElementById('mvc-view-'+t);
    if(btn) btn.classList.toggle('active',t===tab);
    if(view) view.style.display=t===tab?'block':'none';
  });
  if(tab==='cuv') renderCaveCuvees();
  else if(tab==='journal') renderCaveJournal();
  else if(tab==='reglages') renderCaveReglages();
  else if(tab==='bouteille') renderCaveBouteille();
}


function renderCaveCuvees() {
  var el=document.getElementById('mvc-body-cuv'); if(!el) return;
  if(!window._dataReady){ el.innerHTML=window._mvSk('chai'); return; }
  var cuvs=CAVE_ELEVAGE.cuvees||[];
  if(!cuvs.length) {
    el.innerHTML='<div class="cave-empty"><div class="cave-empty-ico">\ud83e\udea3</div>'
      +'<div class="cave-empty-txt">Aucune cuv\u00e9e.</div>'
      +((typeof isAdmin==='function'&&isAdmin())?'<button class="cave-empty-btn" onclick="openOvCavee()">\uff0b Nouvelle cuv\u00e9e</button>':'')
      +'</div>';
    return;
  }
  var order={due:0,watch:1,ok:2,bottled:3};
  var sorted=cuvs.slice().sort(function(a,b){
    var da=order[_caveState(a)], db=order[_caveState(b)];
    if(da!==db) return da-db;
    return _caveDSince(b)-_caveDSince(a);
  });
  var due=_caveAlerts();
  var w=canWrite();
  _caveV2InjectCss();
  var html=_caveMillChipsHtml(cuvs);
  due=due.filter(function(a){ return _caveDansFiltre(a.cuv); });
  if(due.length){
    html+='<div class="mvc-alert"><div class="mvc-alert-ico">\ud83e\udea3</div><div class="mvc-alert-txt">'
      +'<div class="mvc-alert-t">'+due.length+' cuv\u00e9e'+(due.length>1?'s':'')+' \u00e0 ouiller</div>'
      +'<div class="mvc-alert-s">L\u2019\u00e9vaporation menace \u2014 remplissez les f\u00fbts pour \u00e9viter l\u2019oxydation.</div></div></div>';
    if(w) html+='<button class="mvc-batch" onclick="_caveOuillerTous()">\ud83e\udea3 Ouiller les '+due.length+' aujourd\u2019hui</button>';
  }
  sorted.filter(_caveDansFiltre).forEach(function(c){ html+=_caveCuvCardHtml(c,w); });
  if(typeof isAdmin==='function'&&isAdmin()){
    html+='<button class="mvc-add" onclick="openOvCavee()">\uff0b Nouvelle cuv\u00e9e</button>';
  }
  el.innerHTML=html;
}


function openOvCaveOp(opId) {
  if(isSaisonnier()){showToast('Acc\u00E8s lecture seule \uD83D\uDD12','#B85A1A');return;}
  var actives=CAVE_ELEVAGE.cuvees.filter(function(c){return c.statut!=='embouteille';});
  if(!actives.length) {
    if(typeof isAdmin==='function'&&isAdmin()){showToast('Cr\u00e9ez d\'abord une cuv\u00e9e','#C0845A');openOvCavee();}
    else showToast('Aucune cuv\u00e9e active','#B85A1A');
    return;
  }
  // Reset \u00E9tat multi-cuv\u00E9es
  _copCuvSel=new Set();_copAllCuv=false;_copOuillette=10;_copSo2Mode='none';_copSo2Nb=2;_copSo2Freq=10;
  _copIntSel=(window.currentUser&&window.currentUser.nom)?[window.currentUser.nom]:[];
  var today=new Date().toISOString().split('T')[0];
  _caveOpType='ouillage';_caveFml='none';
  ['cop-so2l','cop-so2t','cop-av','cop-mal','cop-fml-date'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.value='';
  });
  _copResetPdfZone();
  selCaveOpType('ouillage');
  var dateEl=document.getElementById('cop-date');if(dateEl)dateEl.value=today;
  // Millesime par defaut : le plus recent en cave. Une seule porte de
  // construction des chips, pour qu'aucun chemin ne reconstruise a cote.
  var _mils=_copMillesimes();
  _copMil=_mils.length?_mils[0]:null;
  _copRenderMils();
  _copRenderCuvChips();
  var sumEl=document.getElementById('cop-cuvees-summary');
  if(sumEl){sumEl.textContent='S\u00e9lectionnez des cuv\u00e9es';sumEl.style.color='var(--texte-leger)';}
  _copRenderIntChips();
  // Reset champs ouillage
  var ouEl=document.getElementById('cop-ouillette-val');if(ouEl)ouEl.textContent='10';
  var nbEl=document.getElementById('cop-nb-ouillettes');if(nbEl)nbEl.value='';
  var resEl=document.getElementById('cop-ouillage-result');if(resEl)resEl.style.display='none';
  // Reset champs soutirage
  var snEl=document.getElementById('cop-sout-note');if(snEl)snEl.value='';
  setCopSo2Mode('none');setCopSo2Nb(2);setCopSo2Freq(10);
  // Reset champs soufre
  _copSoufreG=5;_copSoufreMode='fut';
  var sfEl=document.getElementById('cop-sf-nb');if(sfEl)sfEl.value='';
  var sfCalc=document.getElementById('cop-sf-result');if(sfCalc)sfCalc.style.display='none';
  _copSyncSoufreUI();
  var nEl=document.getElementById('cop-notes');if(nEl)nEl.value='';
  var idEl=document.getElementById('cop-op-id');if(idEl)idEl.value=opId||'';
  var titleEl=document.getElementById('ov-cave-title');
  if(titleEl)titleEl.textContent=opId?'\u270F\uFE0F Modifier op\u00e9ration':'\uD83E\uDEA3 Nouvelle op\u00e9ration';
  if(opId){
    var op=CAVE_ELEVAGE.operations.find(function(o){return o.id===opId;});
    if(op){
      if(dateEl)dateEl.value=op.date;
      selCaveOpType(op.type);
      var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
      // On se place sur le millesime de l'operation editee, sinon ses cuvees
      // ne seraient meme pas affichees. Une operation mixte heritee du passe
      // est signalee plutot que silencieusement amputee.
      var _om={};
      ids.forEach(function(id){
        var _c=actives.find(function(x){return x.id===id;});
        if(_c) _om[(_c.millesime==null||_c.millesime==='')?'?':String(_c.millesime)]=1;
      });
      var _ok=Object.keys(_om);
      if(_ok.length){ _copMil=_ok[0]; }
      _copRenderMils(); _copRenderCuvChips();
      if(_ok.length>1) showToast('Cette opération couvre '+_ok.join(' et ')+' \u2014 choisissez un millésime','#B85A1A');
      var _duMil=_copCuvsDuMil();
      if(_ok.length===1 && ids.length===_duMil.length){_copAllCuv=true;}
      else{ids.forEach(function(id){_copCuvSel.add(id);});}
      _copUpdateChips();_copUpdateFutsSummary();
      if(op.type==='ouillage'&&op.data){
        _copOuillette=op.data.vol_ouillette_L||10;
        var ov2=document.getElementById('cop-ouillette-val');if(ov2)ov2.textContent=_copOuillette;
        var nb2=document.getElementById('cop-nb-ouillettes');if(nb2)nb2.value=op.data.nb_ouillettes||'';
        updateCopOuillageCalc();
      }
      if(op.type==='soutirage'&&op.data){
        if(snEl)snEl.value=op.data.note||'';
        if(op.data.so2&&op.data.so2.mode){
          setCopSo2Mode(op.data.so2.mode);
          if(op.data.so2.nb_doses)setCopSo2Nb(op.data.so2.nb_doses);
          if(op.data.so2.freq_j)setCopSo2Freq(op.data.so2.freq_j);
          if(op.data.so2.mode==='unique'){
            var du=document.getElementById('cop-so2-dose-u');if(du)du.value=op.data.so2.dose||'';
            var uu=document.getElementById('cop-so2-unite-u');if(uu)uu.value=op.data.so2.unite||'cL';
          } else if(op.data.so2.mode==='recurrent'){
            var dr=document.getElementById('cop-so2-dose-r');if(dr)dr.value=op.data.so2.dose||'';
            var ur=document.getElementById('cop-so2-unite-r');if(ur)ur.value=op.data.so2.unite||'cL';
          }
        }
      }
      if(op.type==='soufre'&&op.data){
        _copSoufreG=op.data.grammes_pastille||5;
        _copSoufreMode=op.data.mode||'fut';
        _copSyncSoufreUI();
        var sfnEl=document.getElementById('cop-sf-nb');if(sfnEl)sfnEl.value=op.data.nb_input||'';
        _copUpdateSoufreCalc();
      }
      if(nEl)nEl.value=op.notes||'';
      _copIntSel=(op.intervenants&&op.intervenants.length)?op.intervenants.slice():(op.operateur?[op.operateur]:_copIntSel);
      _copRenderIntChips();
      if(op.type==='analyse'&&op.data){
        // ⚠ BUG PREEXISTANT corrige ici : opData est reconstruit EN ENTIER a
        // l'enregistrement. Sans ce pre-remplissage, editer une analyse pour
        // corriger sa date reecrivait so2_libre/so2_total/av avec ce qui
        // restait dans le DOM de la saisie precedente.
        // .value pose EN JS : un attribut HTML ne survit ni a iOS ni au
        // reaffichage du formulaire.
        var _fa=[['cop-so2l','so2_libre'],['cop-so2t','so2_total'],['cop-av','av'],['cop-mal','malique']];
        _fa.forEach(function(f){ var el=document.getElementById(f[0]);
          if(el) el.value=(op.data[f[1]]!=null?op.data[f[1]]:''); });
        if(op.data.fml){ selCaveFml(op.data.fml);
          if(op.data.fml==='ok'&&op.data.fml_date){ var _fd=document.getElementById('cop-fml-date'); if(_fd)_fd.value=op.data.fml_date; } }
      }
      if(op.type==='analyse'&&op.data&&op.data.pdf_url){
        var _en=document.getElementById('cop-pdf-name');if(_en)_en.textContent=op.data.pdf_nom||'rapport.pdf';
        var _es=document.getElementById('cop-pdf-size');if(_es)_es.textContent=op.data.pdf_taille?_copFmtSize(op.data.pdf_taille):'';
        var _ee=document.getElementById('cop-pdf-empty');if(_ee)_ee.style.display='none';
        var _est=document.getElementById('cop-pdf-staged');if(_est)_est.style.display='flex';
        _copPdfFile='__keep__'+op.data.pdf_url+'|'+(op.data.pdf_nom||'')+'|'+(op.data.pdf_taille||0)+'|'+(op.data.pdf_path||'');
      }
    }
  }
  _copUpdateOpDate();
  var _ovCo=document.getElementById('ovCaveOp');if(_ovCo)_ovCo.classList.add('open');
}

// remplac\u00E9 par syst\u00E8me chips multi-cuv\u00E9es

function selCaveOpType(type) {
  _caveOpType=type;
  ['ouillage','soutirage','soufre','analyse','autre'].forEach(function(t) {
    var btn=document.getElementById('cot-'+t);
    if(btn) btn.classList.toggle('sel',t===type);
    var fields=document.getElementById('cop-fields-'+t);
    if(fields) fields.style.display=t===type?'block':'none';
  });
  var nw=document.getElementById('cop-notes-wrap');
  if(nw)nw.style.display=type==='soutirage'?'none':'block';
  if(type==='soufre') _copUpdateSoufreCalc();
  _copUpdateChips();
}

function selCaveFml(v) {
  _caveFml=v;
  var classes={none:'fml-none',cours:'fml-cours',ok:'fml-ok'};
  ['none','cours','ok'].forEach(function(k){
    var btn=document.getElementById('cfml-'+k); if(!btn) return;
    btn.className='cave-fml-opt'+(k===v?' '+classes[k]:'');
  });
  var wrap=document.getElementById('cop-fml-date-wrap');
  if(wrap) wrap.style.display=v==='ok'?'block':'none';
}

// Un seul basculement subsiste : la FML. Le « sous tirage » a ete retire du
// formulaire — un oui/non ne peut pas decrire un geste qui a lieu PLUSIEURS
// FOIS, et il contredisait a l'ecran les soutirages enregistres au Chai.
// La signature garde son parametre : les onclick de index.html passent 'fml'.
function _cuvToggle(field, val) {
  if(field!=='fml') return;
  var hid=document.getElementById('cuv-fml-val'); if(!hid) return;
  hid.value=val;
  var actif={
    non:{bg:'rgba(180,140,50,0.15)',color:'#B8913A',bdr:'rgba(180,140,50,0.35)'},
    ok:{bg:'rgba(58,140,64,0.15)',color:'#3A8C40',bdr:'rgba(58,140,64,0.35)'}
  };
  var inact={bg:'var(--bg-card)',color:'var(--texte-doux)',bdr:'var(--gris)'};
  ['non','ok'].forEach(function(k){
    var btn=document.getElementById('cuv-fml-'+k); if(!btn) return;
    var s=k===val?actif[k]:inact;
    btn.style.background=s.bg;
    btn.style.color=s.color;
    btn.style.borderColor=s.bdr;
  });
}

async function saveCaveOp() {
  var actives=CAVE_ELEVAGE.cuvees.filter(function(c){return c.statut!=='embouteille';});
  var date=(document.getElementById('cop-date')||{}).value;
  var notes=((document.getElementById('cop-notes')||{}).value||'').trim();
  if(!date){showToast('Saisissez une date','#E07060');return;}
  if(!_copAllCuv&&_copCuvSel.size===0){showToast('S\u00e9lectionnez au moins une cuv\u00e9e','#E07060');return;}
  // « Toutes » = toutes les cuvees DU MILLESIME courant, jamais toute la cave.
  var cuvIds=_copAllCuv?_copCuvsDuMil().map(function(c){return c.id;}):Array.from(_copCuvSel);
  var cuvees=actives.filter(function(c){return cuvIds.indexOf(c.id)!==-1;});
  // ⚠ Derniere garde avant ecriture : une operation ne porte QUE sur un
  // millesime. L'interface l'empeche deja, mais un etat rejoue (edition d'une
  // vieille operation, retour arriere) pourrait passer entre les mailles.
  // On refuse plutot que d'ecrire une donnee qu'aucun calcul ne saura lire.
  var _mset={};
  cuvees.forEach(function(c){ _mset[(c.millesime==null||c.millesime==='')?'?':String(c.millesime)]=1; });
  var _mkeys=Object.keys(_mset);
  if(_mkeys.length>1){
    showToast('Un millésime à la fois \u2014 ici '+_mkeys.join(' et '),'#C0392B');
    return;
  }
  var opData={};
  if(_caveOpType==='ouillage'){
    var nbOuillettes=parseInt((document.getElementById('cop-nb-ouillettes')||{}).value)||0;
    if(!nbOuillettes){showToast('Saisissez le nombre d\u0027ouillettes','#E07060');return;}
    var volTotal=nbOuillettes*_copOuillette;
    var nbFuts=_copGetNbFuts();
    opData={nb_ouillettes:nbOuillettes,vol_ouillette_L:_copOuillette,vol_total_L:volTotal,
            vol_par_fut_L:nbFuts>0?Math.round(volTotal/nbFuts*10)/10:null};
    cuvees.forEach(function(c){c.last_ouillage=date;});
  } else if(_caveOpType==='soutirage'){
    var sn=((document.getElementById('cop-sout-note')||{}).value||'').trim();
    opData={note:sn};
    if(_copSo2Mode!=='none'){
      var so2={mode:_copSo2Mode};
      if(_copSo2Mode==='unique'){
        so2.dose=parseFloat((document.getElementById('cop-so2-dose-u')||{}).value)||null;
        so2.unite=((document.getElementById('cop-so2-unite-u')||{}).value)||'cL';
        so2.dates=[date];
      } else {
        so2.dose=parseFloat((document.getElementById('cop-so2-dose-r')||{}).value)||null;
        so2.unite=((document.getElementById('cop-so2-unite-r')||{}).value)||'cL';
        so2.nb_doses=_copSo2Nb;so2.freq_j=_copSo2Freq;
        var base=new Date(date),dArr=[];
        for(var i=0;i<_copSo2Nb;i++){var dd=new Date(base);dd.setDate(dd.getDate()+i*_copSo2Freq);dArr.push(dd.toISOString().split('T')[0]);}
        so2.dates=dArr;
      }
      opData.so2=so2;
    }
  } else if(_caveOpType==='analyse'){
    opData={
      so2_libre:parseFloat((document.getElementById('cop-so2l')||{}).value)||null,
      so2_total:parseFloat((document.getElementById('cop-so2t')||{}).value)||null,
      av:parseFloat((document.getElementById('cop-av')||{}).value)||null,
      malique:parseFloat((document.getElementById('cop-mal')||{}).value)||null,
      fml:_caveFml,
      fml_date:_caveFml==='ok'?((document.getElementById('cop-fml-date')||{}).value||date):null
    };
    if(_copPdfFile&&typeof _copPdfFile==='object'){
      var _sb=document.querySelector('#ovCaveOp .mbtn');
      if(_sb){_sb.disabled=true;_sb.textContent='Upload PDF\u2026';}
      showSyncBadge('\u23F3 Upload PDF\u2026','#B8913A');
      try{
        var _pr=await window.fbUploadAnalyse(_copPdfFile,function(p){if(_sb)_sb.textContent='Upload '+p+'%';});
        opData.pdf_url=_pr.url;opData.pdf_path=_pr.storage_path;
        opData.pdf_nom=_copPdfFile.name;opData.pdf_taille=_copPdfFile.size;
        if(_sb){_sb.disabled=false;_sb.textContent='Enregistrer';}
      }catch(e){
        showToast('Erreur upload PDF','#E07060');
        if(_sb){_sb.disabled=false;_sb.textContent='Enregistrer';}
        return;
      }
    } else if(_copPdfFile&&typeof _copPdfFile==='string'&&_copPdfFile.startsWith('__keep__')){
      var _kp=_copPdfFile.slice(8).split('|');
      opData.pdf_url=_kp[0];opData.pdf_nom=_kp[1];opData.pdf_taille=parseInt(_kp[2])||0;opData.pdf_path=_kp[3]||'';
    }
    cuvees.forEach(function(c){c.last_analyse=date;});
  } else if(_caveOpType==='soufre'){
    var sfG=_copSoufreG;
    var sfMode=_copSoufreMode;
    var sfNb=parseInt((document.getElementById('cop-sf-nb')||{}).value)||0;
    if(!sfNb){showToast('Saisissez le nombre de pastilles','#E07060');return;}
    var nbFutsTotal=_copGetNbFuts();
    var sfTotal=sfMode==='fut'?sfNb*nbFutsTotal:sfNb;
    opData={grammes_pastille:sfG,mode:sfMode,nb_input:sfNb,nb_total:sfTotal,so2_total_g:sfTotal*sfG};
  } else {
    opData={desc:((document.getElementById('cop-autre-desc')||{}).value||'').trim()};
  }
  var firstId=cuvIds[0]||null;
  var existId=(document.getElementById('cop-op-id')||{}).value;
  if(existId){
    var idx=CAVE_ELEVAGE.operations.findIndex(function(o){return o.id===existId;});
    if(idx!==-1) CAVE_ELEVAGE.operations[idx]=Object.assign(CAVE_ELEVAGE.operations[idx],
      {type:_caveOpType,date:date,cuvee_id:firstId,cuvees_ids:cuvIds,operateur:window.currentUser?.nom||'',intervenants:_copIntSel.slice(),notes:notes,data:opData});
  } else {
    CAVE_ELEVAGE.operations.push({id:'op_'+Date.now(),type:_caveOpType,date:date,
      cuvee_id:firstId,cuvees_ids:cuvIds,operateur:window.currentUser?.nom||'',intervenants:_copIntSel.slice(),notes:notes,data:opData});
  }
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  if(window.fbSave)window.fbSave('cave_elevage',CAVE_ELEVAGE);
  window.closeOv(null,'ovCaveOp');
  _copResetPdfZone();
  showToast('\u2705 Op\u00e9ration enregistr\u00e9e','#C0845A');
  renderCave();
}

function openOvCavee(cuvId) {
  var cuv=cuvId?CAVE_ELEVAGE.cuvees.find(function(c){return c.id===cuvId;}):null;
  var titleEl=document.getElementById('ov-cuv-title');
  if(titleEl) titleEl.textContent=cuv?'\u270F\uFE0F Modifier la cuv\u00e9e':'\uD83C\uDF77 Nouvelle cuv\u00e9e';
  var el;
  el=document.getElementById('cuv-nom'); if(el) el.value=cuv?cuv.nom:'';
  el=document.getElementById('cuv-millesime'); if(el) el.value=cuv?cuv.millesime:new Date().getFullYear();
  el=document.getElementById('cuv-statut'); if(el) el.value=cuv?(cuv.statut||'elevage'):'elevage';
  // Basculement FML
  var fmlInit=cuv&&cuv.fml_terminee?'ok':'non';
  var hFml=document.getElementById('cuv-fml-val');if(hFml)hFml.value=fmlInit;
  window._cuvToggle('fml',fmlInit);
  // Peupler la r\u00E9partition des tonneaux
  if(cuv&&cuv.tonneaux&&cuv.tonneaux.length) {
    _cuvTonneaux=cuv.tonneaux.map(function(t){return{annee:t.annee,nb:t.nb};});
  } else if(cuv&&cuv.nb_tonneaux) {
    _cuvTonneaux=[{annee:new Date().getFullYear(),nb:cuv.nb_tonneaux}];
  } else {
    _cuvTonneaux=[{annee:new Date().getFullYear(),nb:2},{annee:new Date().getFullYear()-2,nb:4}];
  }
  _renderCuvTonneaux();
  el=document.getElementById('cuv-id'); if(el) el.value=cuvId||'';
  el=document.getElementById('cuv-del-btn'); if(el) el.style.display=cuv?'block':'none';
  var _ovCm=document.getElementById('ovCuveeMgmt');if(_ovCm)_ovCm.classList.add('open');
}

function saveCuvee() {
  var nom=((document.getElementById('cuv-nom')||{}).value||'').trim();
  var millesime=parseInt((document.getElementById('cuv-millesime')||{}).value)||new Date().getFullYear();
  var statut=(document.getElementById('cuv-statut')||{}).value||'elevage';
  var fmlTerminee=(document.getElementById('cuv-fml-val')||{}).value==='ok';
  var existId=(document.getElementById('cuv-id')||{}).value;
  var tonneaux=_cuvTonneaux.filter(function(t){return t.nb>0;});
  var nbTotal=tonneaux.reduce(function(s,t){return s+(t.nb||0);},0);
  if(!nom){showToast('Saisissez un nom','#E07060');return;}
  if(!nbTotal){showToast('Indiquez au moins un tonneau','#E07060');return;}
  if(existId) {
    var idx=CAVE_ELEVAGE.cuvees.findIndex(function(c){return c.id===existId;});
    // sous_tire n'est plus ecrit : l'ancienne valeur reste en base, inerte,
    // et n'est plus lue nulle part. Le soutirage vit dans les operations.
    if(idx!==-1) Object.assign(CAVE_ELEVAGE.cuvees[idx],{nom:nom,millesime:millesime,tonneaux:tonneaux,statut:statut,fml_terminee:fmlTerminee});
  } else {
    CAVE_ELEVAGE.cuvees.push({id:'cuv_'+Date.now(),nom:nom,millesime:millesime,
      tonneaux:tonneaux,statut:'elevage',fml_terminee:fmlTerminee,last_ouillage:null,last_analyse:null});
  }
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  if(window.fbSave) window.fbSave('cave_elevage',CAVE_ELEVAGE);
  window.closeOv(null,'ovCuveeMgmt');
  showToast(existId?'\u2705 Cuv\u00e9e mise \u00e0 jour':'\u2705 Cuv\u00e9e cr\u00e9\u00e9e','#C0845A');
  renderCave();
}

function deleteCuvee() {
  var existId=(document.getElementById('cuv-id')||{}).value;
  if(!existId) return;
  CAVE_ELEVAGE.cuvees=CAVE_ELEVAGE.cuvees.filter(function(c){return c.id!==existId;});
  CAVE_ELEVAGE.operations=CAVE_ELEVAGE.operations.filter(function(o){return o.cuvee_id!==existId;});
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  if(window.fbSave) window.fbSave('cave_elevage',CAVE_ELEVAGE);
  window.closeOv(null,'ovCuveeMgmt');
  showToast('\uD83D\uDDD1 Cuv\u00e9e supprim\u00e9e','#B85A1A');
  renderCave();
}

// \u2500\u2500 Cave Analyses Labo \u2500\u2500


// ── Soutirages d'une cuvee ────────────────────────────────
// ⚠ MODELE : le soutirage n'est PAS un etat. Il a lieu PLUSIEURS FOIS
// pendant l'elevage, et toujours au Chai, une fois les futs entonnes.
// La verite est donc la suite des operations datees, jamais un drapeau
// oui/non. Le drapeau cuvee.sous_tire a ete retire du formulaire : les
// anciennes valeurs dorment en base et ne sont plus lues nulle part.
// SOURCE UNIQUE : le Pilotage la consomme au lieu de recompter de son cote.
function _caveSoutOps(cuvId){
  return (CAVE_ELEVAGE.operations||[]).filter(function(op){
    if(!op||op.type!=='soutirage'||!op.date) return false;
    var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
    return ids.indexOf(cuvId)!==-1;
  }).sort(function(a,b){ return a.date>b.date?-1:(a.date<b.date?1:0); });
}
function _caveLastSout(cuvId){
  var l=_caveSoutOps(cuvId);
  return l.length?l[0].date:null;
}

function _caveLastAnaOp(cuvId) {
  // Retourne la derniere operation de type 'analyse' pour cette cuvee (pour FML/SO2)
  var ops=(CAVE_ELEVAGE.operations||[]).filter(function(op){
    if(op.type!=='analyse')return false;
    var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
    return ids.indexOf(cuvId)!==-1;
  });
  if(!ops.length)return null;
  return ops.reduce(function(best,op){return(!best||op.date>best.date)?op:best;},null);
}

function _caveLastAna(cuvId) {
  // Operations type='analyse' pour cette cuvee
  var opAnas=(CAVE_ELEVAGE.operations||[]).filter(function(op){
    if(op.type!=='analyse')return false;
    var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
    return ids.indexOf(cuvId)!==-1;
  }).map(function(op){
    return{_src:'op',id:op.id,date:op.date,date_analyse:op.date,data:op.data||{},notes:op.notes||''};
  });
  // Analyses PDF standalone
  var pdfAnas=(CAVE_ELEVAGE.analyses||[]).filter(function(a){
    return Array.isArray(a.cuvee_ids)&&a.cuvee_ids.indexOf(cuvId)!==-1;
  }).map(function(a){
    return{_src:'ana',id:a.id,date:a.date_analyse||a.date||'',date_analyse:a.date_analyse||a.date||'',
      type:a.type,data:{pdf_url:a.url,pdf_nom:a.nom_fichier,pdf_taille:a.taille},notes:a.commentaire||''};
  });
  var all=opAnas.concat(pdfAnas);
  if(!all.length)return null;
  return all.reduce(function(best,a){return(!best||a.date_analyse>best.date_analyse)?a:best;},null);
}



function _caveAnaFmtSize(bytes) {
  if(!bytes) return '';
  if(bytes<1048576) return Math.round(bytes/1024)+'\u00a0Ko';
  return (bytes/1048576).toFixed(1)+'\u00a0Mo';
}



function _copSyncSoufreUI() {
  var g2=document.getElementById('cop-sf-g2'), g5=document.getElementById('cop-sf-g5');
  if(g2) g2.classList.toggle('sel', _copSoufreG===2);
  if(g5) g5.classList.toggle('sel', _copSoufreG===5);
  var mf=document.getElementById('cop-sf-mode-fut'), mt=document.getElementById('cop-sf-mode-tot');
  if(mf) mf.classList.toggle('sel', _copSoufreMode==='fut');
  if(mt) mt.classList.toggle('sel', _copSoufreMode==='total');
  var lbl=document.getElementById('cop-sf-nb-lbl');
  if(lbl) lbl.textContent=_copSoufreMode==='fut'?'Pastilles par f\u00fbt':'Nombre total de pastilles';
  var ph=document.getElementById('cop-sf-nb');
  if(ph) ph.placeholder=_copSoufreMode==='fut'?'ex. 1':'ex. 82';
}

function setCopSoufreG(g) {
  _copSoufreG=g;
  _copSyncSoufreUI();
  _copUpdateSoufreCalc();
}

function setCopSoufreMode(m) {
  _copSoufreMode=m;
  _copSyncSoufreUI();
  _copUpdateSoufreCalc();
}

function _copUpdateSoufreCalc() {
  var nbEl=document.getElementById('cop-sf-nb');
  var resEl=document.getElementById('cop-sf-result');
  if(!nbEl||!resEl) return;
  var nb=parseInt(nbEl.value);
  if(!nb){resEl.style.display='none';return;}
  var nbFuts=_copGetNbFuts()||82;
  var total=_copSoufreMode==='fut'?nb*nbFuts:nb;
  var so2=total*_copSoufreG;
  var pastEl=document.getElementById('cop-sf-res-past');
  var so2El=document.getElementById('cop-sf-res-so2');
  if(_copSoufreMode==='fut'){
    if(pastEl) pastEl.textContent=nb+'/f\u00fbt \u00d7 '+nbFuts+' = '+total;
  } else {
    if(pastEl) pastEl.textContent=total;
  }
  if(so2El) so2El.textContent=so2+' g SO\u2082';
  resEl.style.display='block';
}

// \u2500\u2500 Convertisseur SO\u2082 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function openOvCaveConvert() {
  _convMode='liq2past'; _convDilution=5;
  _syncConvUI();
  var ov=document.getElementById('ovCaveConvert'); if(ov) ov.classList.add('open');
}

function _syncConvUI() {
  ['liq2past','past2liq'].forEach(function(m){
    var b=document.getElementById('cbtn-'+m); if(b) b.classList.toggle('sel',m===_convMode);
    var p=document.getElementById('conv-panel-'+m); if(p) p.style.display=m===_convMode?'block':'none';
  });
  [3,5,6,8].forEach(function(d){
    var b=document.getElementById('cdil-'+d); if(b) b.classList.toggle('sel',d===_convDilution);
  });
  var dn=document.getElementById('conv-dil-note');
  if(dn) dn.innerHTML='1 cL \u00e0 '+_convDilution+'% = <strong>'+(Math.round(_convDilution/10*100)/100)+' g SO\u2082</strong>';
  var pl=document.getElementById('conv-pct-lbl'); if(pl) pl.textContent=_convDilution;
  _calcConvLiq(); _calcConvPast();
}

function setConvMode(m) { _convMode=m; _syncConvUI(); }

function setConvDil(d) {
  _convDilution=d;
  var inp=document.getElementById('conv-dil-inp'); if(inp) inp.value=d;
  _syncConvUI();
}

function onConvDilInput() {
  var v=parseFloat((document.getElementById('conv-dil-inp')||{}).value)||5;
  _convDilution=v;
  [3,5,6,8].forEach(function(d){
    var b=document.getElementById('cdil-'+d); if(b) b.classList.remove('sel');
  });
  var dn=document.getElementById('conv-dil-note');
  if(dn) dn.innerHTML='1 cL \u00e0 '+v+'% = <strong>'+(Math.round(v/10*100)/100)+' g SO\u2082</strong>';
  var pl=document.getElementById('conv-pct-lbl'); if(pl) pl.textContent=v;
  _calcConvLiq(); _calcConvPast();
}

function _fmtN(n,dec){
  if(!n&&n!==0)return '\u2014';
  var v=parseFloat(n.toFixed(dec));
  return v%1===0?v.toFixed(0):v.toFixed(dec);
}

function _calcConvLiq() {
  if(_convMode!=='liq2past') return;
  var cl=parseFloat((document.getElementById('conv-cl')||{}).value);
  var res=document.getElementById('conv-res-liq2past');
  if(!res) return;
  if(!cl){res.style.display='none';return;}
  var g=cl*_convDilution/10;
  var p2=g/2, p5=g/5;
  var gEl=document.getElementById('conv-res-g'); if(gEl) gEl.textContent=_fmtN(g,2)+' g';
  var p2El=document.getElementById('conv-res-p2'); if(p2El) p2El.textContent=_fmtN(p2,1)+' pastille'+(p2>1?'s':'');
  var p5El=document.getElementById('conv-res-p5'); if(p5El) p5El.textContent=_fmtN(p5,1)+' pastille'+(p5>1?'s':'');
  var hEl=document.getElementById('conv-res-hint');
  if(hEl){var h='';if(p2%1!==0||p5%1!==0)h='\u2248 '+Math.round(p2)+' pastille'+(Math.round(p2)>1?'s':'')+' 2g ou '+Math.round(p5)+' pastille'+(Math.round(p5)>1?'s':'')+' 5g';hEl.textContent=h;}
  res.style.display='block';
}

function _calcConvPast() {
  if(_convMode!=='past2liq') return;
  var p2=parseFloat((document.getElementById('conv-p2')||{}).value)||0;
  var p5=parseFloat((document.getElementById('conv-p5')||{}).value)||0;
  var res=document.getElementById('conv-res-past2liq');
  if(!res) return;
  if(!p2&&!p5){res.style.display='none';return;}
  var tg=p2*2+p5*5;
  var cl=tg*10/_convDilution;
  var tEl=document.getElementById('conv-res-total'); if(tEl) tEl.textContent=_fmtN(tg,1)+' g';
  var cEl=document.getElementById('conv-res-cl'); if(cEl) cEl.textContent=_fmtN(cl,2)+' cL';
  var mEl=document.getElementById('conv-res-ml'); if(mEl) mEl.textContent=_fmtN(cl*10,1)+' mL \u00b7 '+_fmtN(cl/10,2)+' dL';
  res.style.display='block';
}

function renderCaveJournal() {
  var el=document.getElementById('mvc-journal-timeline'); if(!el) return;
  var ops=(CAVE_ELEVAGE.operations||[]).map(function(o){return Object.assign({},o,{_src:'op'});});
  var anas=(CAVE_ELEVAGE.analyses||[]).map(function(a){return {_src:'ana',id:a.id,type:'analyse',
    date:a.date||a.date_analyse,date_analyse:a.date_analyse,cuvees_ids:a.cuvee_ids||[],
    operateur:a.uploaded_by||'',notes:a.commentaire||'',
    data:{label:a.type,fichier:a.nom_fichier,taille:a.taille,url:a.url}};});
  var all=ops.concat(anas).sort(function(a,b){return b.date>a.date?1:-1;});
  var filtered=_jFilter==='tous'?all:all.filter(function(o){return o.type===_jFilter;});
  if(!filtered.length){
    el.innerHTML='<div class="cave-empty"><div class="cave-empty-ico">'+(_jFilter==='analyse'?'\ud83d\udd2c':'\ud83d\udccb')+'</div><div class="cave-empty-txt">Aucune op\u00e9ration.</div></div>';
    return;
  }
  var opMeta={ouillage:{ico:'\ud83e\udea3',col:'#C0845A'},soutirage:{ico:'\u21d5',col:'#5CB87A'},soufre:{ico:'\ud83e\uddea',col:'#4A9C50'},analyse:{ico:'\ud83d\udd2c',col:'#4A9FC8'},autre:{ico:'\ud83d\udcdd',col:'#A0A8B8'}};
  var monthNames=['Janvier','F\u00e9vrier','Mars','Avril','Mai','Juin','Juillet','Ao\u00fbt','Septembre','Octobre','Novembre','D\u00e9cembre'];
  var byMonth={}, order=[];
  filtered.forEach(function(o){
    var dstr=(o.type==='analyse')?(o.date_analyse||o.date):o.date; if(!dstr) dstr='';
    var dd=new Date(dstr);
    var key=isNaN(dd)?'?':(dd.getFullYear()+'-'+('0'+(dd.getMonth()+1)).slice(-2));
    if(!byMonth[key]){byMonth[key]=[];order.push(key);}
    byMonth[key].push(o);
  });
  var keys=order.sort(function(a,b){return b>a?1:-1;});
  var html='';
  keys.forEach(function(k){
    var mLbl=(k==='?')?'':(function(){var pp=k.split('-');return monthNames[parseInt(pp[1],10)-1]+' '+pp[0];})();
    html+='<div class="mvc-jmonth">'+mLbl+'</div>';
    byMonth[k].sort(function(a,b){return b.date>a.date?1:-1;}).forEach(function(op){
      var m=opMeta[op.type]||opMeta.autre;
      html+='<div class="mvc-jitem"><div class="mvc-jdot" style="background:'+m.col+'"></div><div class="mvc-jcard">';
      html+='<div class="mvc-jhead"><span class="mvc-jico">'+m.ico+'</span><span class="mvc-jtype">'+_caveTypeLabel(op.type)+'</span>'+_caveWhoHtml(op)+'</div>';
      html+=_caveCuvPillsHtml(op);
      var det=_caveJDet(op); if(det) html+=det;
      if(op.notes&&op.type!=='analyse') html+='<div class="mvc-jnote">'+_escHtml(op.notes)+'</div>';
      html+='<div class="mvc-jdate">'+_caveDateFr((op.type==='analyse')?(op.date_analyse||op.date):op.date)+'</div>';
      if(op._src==='op'&&typeof isAdmin==='function'&&isAdmin()){
        html+='<div class="mvc-jact"><button onclick="window.openOvCaveOp(\''+op.id+'\')" class="mvc-jact-e">\u270f\ufe0f Modifier</button><button onclick="window.deleteCaveOp(\''+op.id+'\')" class="mvc-jact-d">\ud83d\uddd1</button></div>';
      }
      html+='</div></div>';
    });
  });
  el.innerHTML=html;
}

function setCaveJFilter(f) {
  _jFilter=f;
  document.querySelectorAll('.mvc-jf').forEach(function(b){b.classList.toggle('active',b.dataset.f===f);});
  var upEl=document.getElementById('mvc-journal-upload');
  if(upEl) upEl.style.display=(f==='analyse'||f==='tous')?'':'none';
  renderCaveJournal();
}

var _caveAnaPendingFile=null;
var _caveAnaSelIds=[];


// Handler de l'input #cave-ana-input (onchange dans index.html)
function _onCaveAnaFileChange(input) {
  var file = input && input.files && input.files[0];
  input.value = '';
  if (!file) return;
  if (file.type !== 'application/pdf') { showToast('Seuls les PDF sont accept\u00e9s', '#E07060'); return; }
  if (file.size > 10 * 1024 * 1024) { showToast('PDF trop lourd \u2014 max 10\u00a0Mo', '#E07060'); return; }
  openOvCaveAna(file);
}

function openOvCaveAna(file) {
  _caveAnaPendingFile=file||_caveAnaPendingFile;
  if(!_caveAnaPendingFile) return;
  _caveAnaSelIds=[];
  var el;
  el=document.getElementById('cana-filename'); if(el) el.textContent=_caveAnaPendingFile.name;
  el=document.getElementById('cana-filesize'); if(el) el.textContent=_caveAnaFmtSize(_caveAnaPendingFile.size);
  el=document.getElementById('cana-date'); if(el) el.value=new Date().toISOString().split('T')[0];
  el=document.getElementById('cana-type'); if(el) el.value='so2';
  el=document.getElementById('cana-commentaire'); if(el) el.value='';
  el=document.getElementById('cana-save-btn'); if(el){el.disabled=false;el.textContent='Enregistrer';}
  el=document.getElementById('cana-cuv-hint'); if(el) el.textContent='';
  _renderCaveAnaChips();
  setCanaMode('new');
  _populateCanaLinkOps();
  var ov=document.getElementById('ovCaveAna'); if(ov) ov.classList.add('open');
}

function selectCanaLinkOp(el,id) {
  var idx=_caveAnaLinkedOpIds.indexOf(id);
  if(idx===-1){_caveAnaLinkedOpIds.push(id);el.classList.add('sel');}
  else{_caveAnaLinkedOpIds.splice(idx,1);el.classList.remove('sel');}
  var hint=document.getElementById('cana-link-count');
  if(hint)hint.textContent=_caveAnaLinkedOpIds.length
    ?_caveAnaLinkedOpIds.length+' op\u00e9ration'+(_caveAnaLinkedOpIds.length>1?'s':'')+' s\u00e9lectionn\u00e9e'+(_caveAnaLinkedOpIds.length>1?'s':'') : '';
}

function setCanaMode(mode) {
  var isLink=mode==='link';
  var secNew=document.getElementById('cana-section-new');
  var secLink=document.getElementById('cana-section-link');
  if(secNew) secNew.style.display=isLink?'none':'';
  if(secLink) secLink.style.display=isLink?'':'none';
  var btnNew=document.getElementById('cana-mode-new');
  var btnLink=document.getElementById('cana-mode-link');
  if(btnNew) btnNew.classList.toggle('cana-mode-sel',!isLink);
  if(btnLink) btnLink.classList.toggle('cana-mode-sel',isLink);
  var inp=document.getElementById('cana-link-op-id'); if(inp) inp.value='';
  _caveAnaLinkedOpIds=[];
  document.querySelectorAll('.cana-link-op-item').forEach(function(x){x.classList.remove('sel');});
  var hint=document.getElementById('cana-link-count');if(hint)hint.textContent='';
}

function _populateCanaLinkOps() {
  var el=document.getElementById('cana-link-op-list'); if(!el) return;
  var ops=(CAVE_ELEVAGE.operations||[]).filter(function(o){
    return o.type==='analyse'&&!(o.data&&o.data.pdf_url);
  }).sort(function(a,b){return b.date>a.date?1:-1;});
  if(!ops.length){
    el.innerHTML='<div style="text-align:center;padding:20px 0;font-size:13px;color:var(--texte-doux);">Aucune op\u00e9ration d\'analyse sans PDF.<br><span style="font-size:11px;">Cr\u00e9ez d\'abord une op\u00e9ration de type Analyse.</span></div>';
    return;
  }
  el.innerHTML=ops.map(function(op){
    var cuvLabel=_caveCuvLabel(op);
    var notesHtml=op.notes?'<div style="font-size:11px;font-style:italic;color:var(--texte-doux);margin-top:1px;">'+_escHtml(op.notes)+'</div>':'' ;
    var hasSO2=op.data&&(op.data.so2_libre||op.data.so2_total);
    return '<div class="cana-link-op-item" data-id="'+op.id+'" onclick="window.selectCanaLinkOp(this,\''+op.id+'\')">'  
      +'<div style="display:flex;align-items:flex-start;gap:8px;">'  
      +'<span style="font-size:15px;margin-top:1px;">\uFFFD\uFFFD</span>'  
      +'<div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="font-size:13px;font-weight:600;color:var(--texte);">'+_caveDateFr(op.date)+'</span>'+(hasSO2?'<span style="font-size:10px;font-weight:600;color:#4A9FC8;background:rgba(74,159,200,0.1);border-radius:6px;padding:1px 6px;">SO\u2082 \u2713</span>':'')+'</div>'  
      +'<div style="font-size:12px;font-weight:500;color:var(--terre,#C0845A);margin-bottom:2px;">\uD83C\uDF77 '+_escHtml(cuvLabel)+'</div>'  
      +notesHtml+'</div>'  
      +'</div>';
  }).join('');
}
// ══════ REFONTE VENDANGE — « Le Cuvier » (mvv) ══════
function _vendInjectCss(){
  if(document.getElementById('mvv-vend-css')) return;
  var s=document.createElement('style'); s.id='mvv-vend-css';
  s.textContent=`
.mvv-wrap{background:var(--bg-app,#F2EFE7);min-height:60vh;color:var(--texte,#1A1A14);
  padding-bottom:calc(96px + env(safe-area-inset-bottom,0px))}
.mvv-wrap *{box-sizing:border-box}
.mvv-hdr{padding:0 14px 6px;background:var(--bg-app,#F2EFE7)}
.mvv-kpis{display:flex;gap:8px;margin-bottom:10px}
.mvv-kpi{flex:1;background:var(--bg-card,#FBFAF6);border:1px solid var(--gris-clair,#ECE6DA);border-radius:13px;padding:10px 6px;text-align:center;box-shadow:0 2px 8px rgba(20,17,13,.04)}
.mvv-kpi.live{background:var(--or-pale,#FAF3E0);border-color:rgba(194,161,77,.32)}
.mvv-kpi-num{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:21px;line-height:1;color:var(--cave,#14110D)}
.mvv-kpi.live .mvv-kpi-num{color:var(--or,#C2A14D)}
.mvv-kpi-lbl{font-size:9.5px;letter-spacing:.4px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);margin-top:4px;line-height:1.2}
.mvv-health{position:relative}
.mvv-health-track{height:7px;border-radius:5px;background:var(--gris-clair,#ECE6DA);overflow:hidden;display:flex}
.mvv-health-ok{height:100%;background:linear-gradient(90deg,#5B8C3E,#3D6B27);transition:width .5s ease}
.mvv-health-due{height:100%;background:linear-gradient(90deg,#C86A4E,#B0412C);transition:width .5s ease}
.mvv-health-lbl{display:flex;justify-content:space-between;font-size:11px;margin-top:5px;color:var(--texte-med,#4A4A3A)}
.mvv-health-lbl b{color:var(--texte,#1A1A14)}
.mvv-tabs{display:flex;gap:5px;padding:12px 14px 2px;background:var(--bg-app,#F2EFE7)}
.mvv-tab{flex:1;border:1px solid transparent;background:var(--gris-clair,#ECE6DA);border-radius:11px;padding:9px 4px;
  color:var(--texte-doux,#5F5F5F);font-size:12.5px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:5px;transition:.18s;font-family:inherit}
.mvv-tab .t-ico{font-size:14px}
.mvv-tab.active{background:var(--bg-card,#FBFAF6);border-color:rgba(138,90,56,.14);color:var(--cave,#14110D);box-shadow:0 1px 4px rgba(20,17,13,.14)}
.mvv-tab .t-badge{background:#E8836F;color:#fff;font-size:9.5px;font-weight:700;border-radius:8px;padding:1px 6px;min-width:16px;text-align:center}
.mvu-tabs.mvu-sub .mvu-tab .t-badge{background:#E8836F;color:#fff}
/* Bande de chiffres commune (#cave-kpis) : « en fermentation » est un etat vivant,
   pas un retard — il prend l'or, pas le rouge de .mvu-kpi.due du Chai. */
.mvu-kpi.live{background:var(--or-pale,#FAF3E0);border-color:rgba(194,161,77,.32)}
.mvu-kpi.live .mvu-kpi-v{color:var(--or,#C2A14D)}
.mvv-body{padding:2px 14px 0}
.mvv-alert{border-radius:14px;padding:12px 13px;margin:8px 0 12px;position:relative;overflow:hidden;
  background:linear-gradient(135deg,rgba(232,131,111,.12),rgba(232,131,111,.05));border:1px solid rgba(232,131,111,.28)}
.mvv-alert::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,#C86A4E,#B0412C)}
.mvv-alert-t{font-size:14px;font-weight:600;color:var(--texte,#1A1A14);display:flex;align-items:center;gap:7px}
.mvv-alert-d{font-size:12px;color:var(--texte-med,#4A4A3A);margin-top:3px;line-height:1.4}
.mvv-alert-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
.mvv-alert-chip{background:var(--bg-card,#FBFAF6);border:1px solid rgba(200,106,78,.38);color:#B0412C;font-family:inherit;
  font-size:11.5px;font-weight:600;border-radius:9px;padding:7px 11px;display:flex;align-items:center;gap:5px;cursor:pointer;min-height:40px}
.mvv-alert-chip small{opacity:.72;font-weight:500}
.mvv-seclbl{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--terre,#8A5A38);font-weight:600;margin:18px 2px 9px}
.mvv-cuve{background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.10);
  border-radius:16px;padding:13px 14px 13px 17px;margin-bottom:11px;position:relative;overflow:hidden;
  box-shadow:0 1px 7px rgba(20,17,13,.05);transition:transform .12s,box-shadow .12s}
.mvv-cuve::after{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:16px 0 0 16px;background:linear-gradient(180deg,#9A93A8,#6E6878)}
.mvv-cuve.act::after{background:linear-gradient(180deg,#5B8C3E,#3D6B27)}
.mvv-cuve.due::after{background:linear-gradient(180deg,#C86A4E,#B0412C)}
.mvv-cuve.due{border-color:rgba(200,106,78,.30)}
.mvv-cuve-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.mvv-cuve-name{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:20px;line-height:1.12;color:var(--texte,#1A1A14)}
.mvv-cuve-meta{font-size:11.5px;color:var(--texte-doux,#5F5F5F);margin-top:1px}
.mvv-cuve-par{font-size:11px;color:var(--texte-doux,#5F5F5F);margin-top:2px;opacity:.9}
.mvv-vol{text-align:right;flex-shrink:0}
.mvv-vol-n{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:19px;color:var(--terre,#8A5A38);line-height:1}
.mvv-vol-u{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);margin-top:2px}
.mvv-edit{background:none;border:none;color:var(--texte-doux,#5F5F5F);font-size:15px;padding:4px;margin:-4px -4px 0 0;line-height:1;cursor:pointer}
.mvv-steps{display:flex;align-items:center;margin:12px 0 4px}
.mvv-step{flex:1;display:flex;flex-direction:column;align-items:center;position:relative;gap:5px}
.mvv-step .dot{width:9px;height:9px;border-radius:50%;background:var(--gris,#DED7C9);border:1.5px solid var(--gris-clair,#ECE6DA);z-index:2}
.mvv-step.done .dot{background:var(--or,#C2A14D);border-color:var(--or,#C2A14D)}
.mvv-step.cur .dot{background:var(--terre,#8A5A38);border-color:var(--terre,#8A5A38);box-shadow:0 0 0 4px rgba(138,90,56,.18)}
.mvv-step .lb{font-size:8px;letter-spacing:.3px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);text-align:center;white-space:nowrap}
.mvv-step.done .lb{color:var(--texte-med,#4A4A3A)}
.mvv-step.cur .lb{color:var(--terre,#8A5A38);font-weight:700}
.mvv-step::before{content:"";position:absolute;top:4px;left:-50%;width:100%;height:1.5px;background:var(--gris-clair,#ECE6DA);z-index:1}
.mvv-step:first-child::before{display:none}
.mvv-step.done::before,.mvv-step.cur::before{background:var(--or,#C2A14D)}
.mvv-ferm{margin-top:14px;background:var(--bg-app,#F2EFE7);border-radius:13px;padding:12px 13px 11px;border:1px solid rgba(138,90,56,.10)}
.mvv-ferm-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px}
.mvv-ferm-lbl{font-size:11px;letter-spacing:.4px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);font-weight:500}
.mvv-ferm-pct{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:24px;line-height:1;color:var(--terre,#8A5A38)}
.mvv-ferm-pct small{font-family:inherit;font-size:10px;font-weight:600;color:var(--texte-doux,#5F5F5F);letter-spacing:.5px;margin-left:3px}
.mvv-gauge{height:11px;border-radius:7px;background:rgba(138,90,56,.11);position:relative;overflow:hidden}
.mvv-gauge-fill{height:100%;border-radius:7px;background:linear-gradient(90deg,#8A5A38 0,#C2871E 55%,#3D6B27 100%);transition:width .5s cubic-bezier(.4,0,.2,1)}
.mvv-gauge-mk{position:absolute;top:-3px;width:2px;height:17px;background:var(--texte,#1A1A14);border-radius:2px;opacity:.55;transition:left .5s}
.mvv-ferm-scale{display:flex;justify-content:space-between;font-size:9.5px;color:var(--texte-doux,#5F5F5F);margin-top:6px}
.mvv-spark{margin-top:11px}
.mvv-spark-lbl{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);margin-bottom:4px;display:flex;justify-content:space-between}
.mvv-spark svg{display:block;width:100%;height:38px;overflow:visible}
.mvv-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:11px}
.mvv-chip{background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.16);border-radius:9px;padding:5px 9px;font-size:11px;font-weight:600;color:var(--texte-med,#4A4A3A);display:flex;align-items:center;gap:4px}
.mvv-chip .u{color:var(--texte-doux,#5F5F5F);font-weight:400;font-size:10px}
.mvv-chip.cool{border-color:rgba(74,159,200,.28);color:var(--ink-info,#4A9FC8);background:rgba(74,159,200,.10)}
.mvv-chip.warm{border-color:rgba(184,145,58,.30);color:#8A6A12;background:rgba(184,145,58,.12)}
.mvv-chip.hot{border-color:rgba(176,65,44,.32);color:#B0412C;background:rgba(176,65,44,.10)}
.mvv-recency{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;border-radius:9px;padding:6px 11px;margin-top:11px}
.mvv-recency.ok{background:rgba(61,107,39,.10);border:1px solid rgba(61,107,39,.26);color:var(--vert-med,#3D6B27)}
.mvv-recency.watch{background:rgba(184,145,58,.12);border:1px solid rgba(184,145,58,.30);color:#8A6A12}
.mvv-recency.late{background:rgba(176,65,44,.10);border:1px solid rgba(176,65,44,.30);color:#B0412C}
.mvv-recency .pulse{animation:mvvPulse 1.6s infinite}
@keyframes mvvPulse{0%,100%{opacity:1}50%{opacity:.35}}
.mvv-act-btn{margin-top:12px;width:100%;padding:11px;border-radius:11px;font-size:13.5px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:7px;transition:.15s;cursor:pointer;font-family:inherit;min-height:44px;
  background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.2);color:var(--terre,#8A5A38)}
.mvv-act-btn.measure{background:linear-gradient(135deg,var(--terre,#8A5A38),#6E4526);border:0;color:#fff;box-shadow:0 2px 9px rgba(138,90,56,.24)}
.mvv-act-btn.measure:active{transform:translateY(1px)}
.mvv-act-btn.ghost{background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.2);color:var(--terre,#8A5A38)}
.mvv-done-tag{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:var(--vert-med,#3D6B27);background:rgba(61,107,39,.10);border:1px solid rgba(61,107,39,.26);border-radius:9px;padding:6px 11px;margin-top:11px}
.mvv-camp{background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.10);border-radius:16px;padding:15px 15px 13px;margin:6px 0 14px;position:relative;overflow:hidden;box-shadow:0 1px 7px rgba(20,17,13,.05)}
.mvv-camp::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--horizon,linear-gradient(90deg,#8A5A38 0%,#C2871E 50%,#3D6B27 100%))}
.mvv-camp-lbl{font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--terre,#8A5A38);font-weight:700;margin-bottom:11px}
.mvv-camp-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.mvv-camp-n{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:26px;line-height:1;color:var(--texte,#1A1A14)}
.mvv-camp-n .u{font-family:inherit;font-size:11px;font-weight:600;color:var(--texte-doux,#5F5F5F);margin-left:3px}
.mvv-camp-cl{font-size:9px;letter-spacing:.5px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);margin-top:4px}
.mvv-camp-sold{font-size:11px;color:var(--texte-med,#4A4A3A);margin-top:12px;padding-top:10px;border-top:1px solid rgba(138,90,56,.12);display:flex;align-items:center;gap:6px}
.mvv-rec{background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.10);border-radius:15px;padding:13px 14px;margin-bottom:10px;display:flex;gap:11px;align-items:flex-start;box-shadow:0 1px 5px rgba(20,17,13,.04);transition:.16s;cursor:pointer}
.mvv-rec-l{flex:1;min-width:0}
.mvv-rec-nm{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:17px;color:var(--texte,#1A1A14);line-height:1.1}
.mvv-rec-mt{font-size:11px;color:var(--texte-doux,#5F5F5F);margin-top:3px}
.mvv-rec-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}
.mvv-b{font-size:10px;font-weight:600;border-radius:8px;padding:3px 8px;display:inline-flex;align-items:center;gap:4px}
.mvv-b.san-hi{background:rgba(61,107,39,.10);border:1px solid rgba(61,107,39,.24);color:var(--vert-med,#3D6B27)}
.mvv-b.san-mid{background:rgba(184,145,58,.12);border:1px solid rgba(184,145,58,.28);color:#8A6A12}
.mvv-b.san-lo{background:rgba(176,65,44,.10);border:1px solid rgba(176,65,44,.28);color:#B0412C}
.mvv-b.er{background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.16);color:var(--texte-med,#4A4A3A)}
.mvv-b.vendu{background:rgba(194,161,77,.14);border:1px solid rgba(194,161,77,.32);color:#8A6A12}
.mvv-rec-r{text-align:right;flex-shrink:0}
.mvv-rec-hl{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:18px;color:var(--terre,#8A5A38);line-height:1}
.mvv-rec-hl .su{font-size:9px;color:var(--texte-doux,#5F5F5F);font-weight:400;font-family:inherit;display:block}
.mvv-rec-hl.sold{color:var(--texte-doux,#5F5F5F);font-size:12px;font-family:inherit;font-weight:500}
.mvv-rec-kg{font-size:10px;color:var(--texte-doux,#5F5F5F);margin-top:3px}
.mvv-empty{text-align:center;padding:46px 20px;color:var(--texte-doux,#5F5F5F)}
.mvv-empty-ic{font-size:34px;opacity:.5}
.mvv-empty-tx{font-size:13px;margin-top:10px;line-height:1.5}
.mvv-fab{margin:16px 0 0;padding:2px 0}
.mvv-fab-btn{width:100%;padding:14px;border-radius:14px;border:none;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit;cursor:pointer;background:linear-gradient(180deg,var(--or,#C2A14D),#B8952F);color:#241B08;box-shadow:0 3px 12px rgba(194,161,77,.25);min-height:44px}
.mvv-fab-btn:active{transform:translateY(1px)}
.mvv-set{background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.10);border-radius:15px;padding:14px;margin-bottom:11px;box-shadow:0 1px 5px rgba(20,17,13,.04)}
.mvv-set-t{font-size:13.5px;font-weight:600;color:var(--texte,#1A1A14);display:flex;align-items:center;gap:7px}
.mvv-set-d{font-size:11.5px;color:var(--texte-doux,#5F5F5F);margin-top:4px;line-height:1.5}
.mvv-prow{display:flex;align-items:center;justify-content:space-between;margin-top:13px;gap:10px}
.mvv-prow-l{font-size:12.5px;color:var(--texte-med,#4A4A3A);font-weight:500}
.mvv-fi{width:78px;background:#fff;border:1px solid rgba(138,90,56,.3);border-radius:9px;padding:9px 10px;color:var(--texte,#1A1A14);font-size:15px;font-weight:600;text-align:center;font-family:inherit}
.mvv-fi:focus{border-color:var(--terre,#8A5A38);outline:none;box-shadow:0 0 0 3px rgba(138,90,56,.12)}
.mvv-preview{background:var(--terre-pale,#F3EADF);border:1px solid rgba(138,90,56,.16);border-radius:10px;padding:10px 12px;margin-top:12px;font-size:11.5px;color:var(--texte-med,#4A4A3A)}
.mvv-preview b{color:var(--terre,#8A5A38)}
.mvv-save{width:100%;padding:13px;border-radius:12px;border:none;background:linear-gradient(180deg,var(--or,#C2A14D),#B8952F);color:#241B08;font-size:13.5px;font-weight:600;margin-top:4px;font-family:inherit;cursor:pointer;min-height:44px}
.mvv-wrap :focus-visible{outline:2px solid var(--terre,#8A5A38);outline-offset:2px;border-radius:6px}
@media (prefers-reduced-motion: reduce){.mvv-wrap *{animation-duration:.001ms !important;transition-duration:.001ms !important}}
.mvv-dlots{display:flex;flex-direction:column;gap:2px;margin-bottom:4px}
.mvv-dlot{display:flex;align-items:center;gap:10px;padding:9px 0}
.mvv-dlot+.mvv-dlot{border-top:1px solid rgba(138,90,56,.12)}
.mvv-dlot-b{flex:1;min-width:0}
.mvv-dlot-n{display:block;font-size:14px;font-weight:600;color:var(--texte,#1A1A14)}
.mvv-dlot-m{display:block;font-size:11.5px;color:var(--texte-doux,#5F5F5F);margin-top:2px}
.mvv-dstp{display:flex;align-items:center;gap:3px;flex-shrink:0}
.mvv-dstp button{width:38px;height:38px;border-radius:9px;border:1px solid rgba(138,90,56,.28);background:var(--bg-app,#F2EFE7);color:var(--terre,#8A5A38);font-size:17px;font-family:inherit;cursor:pointer;line-height:1}
.mvv-dstp button:disabled{opacity:.32;cursor:default}
.mvv-dstp>span{min-width:32px;text-align:center;font-size:16px;font-weight:700;color:var(--texte,#1A1A14)}
.mvv-dtot{display:flex;align-items:baseline;gap:8px;padding:11px 0 2px;margin-top:4px;border-top:1px dashed rgba(138,90,56,.24)}
.mvv-dtot-n{font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:700;color:var(--terre,#8A5A38);line-height:1}
.mvv-dtot-n.ko{color:var(--orange,#B85A1A)}
.mvv-dtot-l{font-size:12px;color:var(--texte-doux,#5F5F5F)}
.mvv-dwarn{background:var(--orange-pale,#FBF0E6);border:1px solid rgba(184,90,26,.3);border-radius:11px;padding:10px 12px;margin-top:9px;font-size:12px;color:var(--texte-med,#4A4A3A);line-height:1.5}
.mvv-dwarn b{color:#8A4212}
.mvv-dlnote{font-size:12px;color:var(--texte-doux,#5F5F5F);font-style:italic;line-height:1.5;margin:4px 0 2px}
.mvv-dneuf{font-size:12px;color:var(--texte-med,#4A4A3A);line-height:1.5;margin-top:7px;padding:8px 11px;background:var(--or-pale,#FAF3E0);border:1px solid rgba(194,161,77,.3);border-radius:10px}
.mvv-dneuf b{color:var(--terre,#8A5A38)}
`;
  document.head.appendChild(s);
}

function _vendFrDate(s){ if(!s) return ''; var p=String(s).split('-'); return p.length===3?(p[2]+'/'+p[1]):s; }
function _vendFaPct(d){ if(!d) return 0; return Math.max(0,Math.min(100,Math.round((1085-d)/(1085-990)*100))); }
function _vendHlRange(kg){ var c=_vendCfg(); if(!kg) return '0'; return (kg/c.ratio_max).toFixed(1)+'–'+(kg/c.ratio_min).toFixed(1); }
function _vendEtatBadge(p){ p=parseInt(p)||0;
  if(p>=80) return _mvBadge('Sanitaire '+p+' %','vert');
  if(p>=55) return _mvBadge('Sanitaire '+p+' %','ambre');
  return '<span class="mvv-b san-lo">▲ Tri renforcé '+p+'%</span>';
}
var _VEND_STAT={setup:{i:0,lbl:'Setup'},mpf:{i:1,lbl:'MPF'},fa:{i:2,lbl:'FA'},decuvage:{i:3,lbl:'Décuvage'},fml:{i:4,lbl:'FML'},termine:{i:5,lbl:'Terminé'}};
var _VEND_STEPS=[['setup','Setup'],['mpf','MPF'],['fa','FA'],['decuvage','Décuv.'],['fml','FML'],['termine','Fini']];
function _vendStatLbl(st){ return (_VEND_STAT[st]||{lbl:st||'—'}).lbl; }
function _vendTempCls(t){ return t>=30?'hot':t>=26?'warm':'cool'; }
function _vendIsActive(c){ return c.statut==='fa'||c.statut==='mpf'; }
function _vendLastMes(c){ var m=c.mesures_fa||[]; return m.length?m[m.length-1]:null; }
function _vendSince(s){ if(!s) return 999; var t=new Date(s).getTime(); if(!t) return 999; return Math.floor((Date.now()-t)/86400000); }
function _vendStale(c){ var l=_vendLastMes(c); return l?_vendSince(l.date):999; }

function _vendSparkline(mes,uid,w){
  if(!mes||mes.length<2) return '';
  // preserveAspectRatio="none" ecrasait le dessin : le point de fin sortait en
  // ovale et l'epaisseur du trait n'etait pas la meme selon la direction.
  var c=window._mvGraphCadre(w,44,{padL:3,padR:3,padT:3,padB:3});
  var W=c.w,H=c.h,pad=3;
  var ds=mes.map(function(m){return _vendMesD20(m);});
  var min=Math.min.apply(null,ds.concat([992])), max=Math.max.apply(null,ds.concat([1085]));
  var rng=(max-min)||1;
  var pts=mes.map(function(m,i){
    var dv=_vendMesD20(m);
    var x=pad+(i/(mes.length-1))*(W-2*pad);
    var y=pad+(1-(dv-min)/rng)*(H-2*pad);
    return x.toFixed(1)+','+y.toFixed(1);
  });
  var lastX=(W-pad).toFixed(1); var lastY=pts[pts.length-1].split(',')[1];
  var gid='mvvsg-'+uid;
  var g='<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="1" y2="0">'
    +'<stop offset="0" stop-color="'+c.col.mesure+'"/>'
    +'<stop offset="0.55" stop-color="'+c.col.prevu+'"/>'
    +'<stop offset="1" stop-color="'+c.col.fait+'"/></linearGradient></defs>'
    +'<polyline points="'+pts.join(' ')+'" fill="none" stroke="url(#'+gid+')" stroke-width="'+c.trait.mesure+'" stroke-linecap="round" stroke-linejoin="round"/>'
    +'<circle cx="'+lastX+'" cy="'+lastY+'" r="2.6" fill="'+c.col.mesure+'"/>';
  var aria='Cin\u00e9tique de la fermentation : '+mes.length+' relev\u00e9s, densit\u00e9 de '
    +Math.round(ds[0])+' \u00e0 '+Math.round(ds[ds.length-1])+'.';
  return '<div class="mvv-spark"><div class="mvv-spark-lbl"><span>Cin\u00e9tique \u2014 densit\u00e9</span><span>'+mes.length+' relev\u00e9s</span></div>'
    +window._mvGraphSvg(c,aria,g)+'</div>';
}
function _vendStepper(statut){
  var cur=(_VEND_STAT[statut]||{i:0}).i;
  return '<div class="mvv-steps">'+_VEND_STEPS.map(function(s,i){
    var cls=i<cur?'done':i===cur?'cur':'';
    return '<div class="mvv-step '+cls+'"><div class="dot"></div><div class="lb">'+s[1]+'</div></div>';
  }).join('')+'</div>';
}
function _vendErLbl(r){ return r.erasflage==='total'?'Éraflage total':r.erasflage==='partiel'?('Partiel '+(r.er_pct||30)+'%'):'Vendange entière'; }

function _vendKpiData(){
  var cfg=_vendCfg(); var recs=CAVE_VENDANGE.recoltes||[]; var cuves=CAVE_VENDANGE.cuves_vinif||[];
  var caisses=recs.reduce(function(s,r){return s+(r.nb_caisses||0);},0);
  var kg=recs.reduce(function(s,r){return s+_recKg(r);},0);
  var kgCuve=recs.filter(function(r){return !_recSold(r);}).reduce(function(s,r){return s+_recKg(r);},0);
  var hl=(kgCuve/cfg.ratio_max).toFixed(0)+'–'+(kgCuve/cfg.ratio_min).toFixed(0);
  var active=cuves.filter(_vendIsActive);
  var due=active.filter(function(c){return _vendStale(c)>=1;}).length;
  return {caisses:caisses,tonnes:(kg/1000).toFixed(1),hl:hl,enFA:active.length,due:due,activeN:active.length};
}
function _vendCockpitHtml(){
  // Meme anatomie que Le Chai et Le millesime : les chiffres vivent dans la
  // bande commune #cave-kpis (hors de cette vue), il ne reste ici que la barre
  // d'etat. La barre d'onglets n'est plus .on-dark : le Cuvier est sur papier.
  return '<div class="mvv-hdr">'
    +'<div class="mvv-health"><div class="mvv-health-track" id="mvv-health-track"></div><div class="mvv-health-lbl" id="mvv-health-lbl"></div></div>'
    +'</div>'
    +'<div class="mvu-tabs mvu-sub">'
    +'<button class="mvu-tab" id="mvv-tab-ana" onclick="switchVendOng(\'ana\')"><span class="t-ico"></span> Analyses</button>'
    +'<button class="mvu-tab" id="mvv-tab-rec" onclick="switchVendOng(\'rec\')"><span class="t-ico"></span> Récoltes</button>'
    +'<button class="mvu-tab" id="mvv-tab-cuves" onclick="switchVendOng(\'cuves\')"><span class="t-ico"></span> Cuvier</button>'
    +'<button class="mvu-tab" id="mvv-tab-param" onclick="switchVendOng(\'param\')"><span class="t-ico"></span> Réglages</button>'
    +'</div>';
}
function _vendRefreshCockpit(){
  var d=_vendKpiData();
  // La bande de chiffres est celle de la Cave entiere, la meme que Le Chai
  // (_mvcRenderHeader) et Le millesime : une seule barre, une seule peau.
  var kp=document.getElementById('cave-kpis');
  if(kp){
    kp.style.display='';
    var kpis=[[d.caisses,'Caisses',false],[d.tonnes+'t','Récoltés',false],[d.hl,'hL cuvés',false],[d.enFA,'En ferment.',d.enFA>0]];
    kp.innerHTML=kpis.map(function(k){return '<div class="mvu-kpi'+(k[2]?' live':'')+'"><div class="mvu-kpi-v">'+k[0]+'</div><div class="mvu-kpi-l">'+k[1]+'</div></div>';}).join('');
  }
  var ok=d.activeN-d.due; var okPct=d.activeN?Math.round(ok/d.activeN*100):100;
  var ht=document.getElementById('mvv-health-track');
  if(ht) ht.innerHTML='<div class="mvv-health-ok" style="width:'+okPct+'%"></div><div class="mvv-health-due" style="width:'+(100-okPct)+'%"></div>';
  var hlb=document.getElementById('mvv-health-lbl');
  if(hlb) hlb.innerHTML='<span><b>'+ok+'</b> cuve'+(ok>1?'s':'')+' à jour</span><span>'+(d.due?'<b>'+d.due+'</b> à mesurer':'Fermentations suivies ✔')+'</span>';
  var tb=document.getElementById('mvv-tab-cuves');
  if(tb){ var b=tb.querySelector('.t-badge');
    if(d.due>0){ if(!b){b=document.createElement('span');b.className='t-badge';tb.appendChild(b);} b.textContent=d.due; }
    else if(b){ b.remove(); } }
}
function _vendRenderTab(){
  if(!window._dataReady){ var _vb=document.getElementById('mvv-body'); if(_vb)_vb.innerHTML=window._mvSk('cuvier'); return; }
  ['ana','cuves','rec','param'].forEach(function(t){var b=document.getElementById('mvv-tab-'+t); if(b) b.classList.toggle('active',t===_vendTab);});
  if(_vendTab==='ana') renderVendAna();
  else if(_vendTab==='rec') renderVendRec();
  else if(_vendTab==='param') renderVendParam();
  else renderVendCuves();
}

function renderCaveVendange() {
  _vendInjectCss();
  var icoEl=document.getElementById('cave-hdr-ico'); if(icoEl) icoEl.textContent='\uD83C\uDF47';
  var titleEl=document.getElementById('cave-hdr-title'); if(titleEl) titleEl.textContent='Le Cuvier';
  var subEl=document.getElementById('cave-hdr-sub'); if(subEl) subEl.textContent=(window.DOMAINE_NOM||'Mon domaine');
  var bdgV=document.getElementById('cave-hdr-badge'); if(bdgV) bdgV.textContent='Campagne '+(new Date().getFullYear());
  // Etat initial propre : _vendRefreshCockpit la remplit et la rallume des que
  // les donnees sont la (skeleton tant que _dataReady est faux).
  var kpV=document.getElementById('cave-kpis'); if(kpV){ kpV.innerHTML=''; kpV.style.display='none'; }
  var mvcHost=document.getElementById('mvc-elevage'); if(mvcHost) mvcHost.style.display='none';
  ['cuv','journal','divers'].forEach(function(t){var v=document.getElementById('cave-view-'+t);if(v)v.style.display='none';});
  var mlv=document.getElementById('cave-view-mil'); if(mlv) mlv.style.display='none';
  var vv=document.getElementById('cave-view-vend'); if(vv) vv.style.display='block';
  var body=document.getElementById('cave-vend-body'); if(!body) return;
  body.style.padding='0';
  body.innerHTML='<div class="mvv-wrap">'+_vendCockpitHtml()+'<div class="mvv-body" id="mvv-body"></div></div>';
  _vendRenderTab();
}

function renderVendRec() {
  var el=document.getElementById('mvv-body'); if(!el) return;
  var cfg=_vendCfg();
  var recoltes=CAVE_VENDANGE.recoltes||[];
  var canEdit=canWrite();
  var caisses=recoltes.reduce(function(s,r){return s+(r.nb_caisses||0);},0);
  var kg=recoltes.reduce(function(s,r){return s+_recKg(r);},0);
  var kgCuve=recoltes.filter(function(r){return !_recSold(r);}).reduce(function(s,r){return s+_recKg(r);},0);
  var kgVendu=recoltes.filter(function(r){return _recSold(r);}).reduce(function(s,r){return s+_recKg(r);},0);
  var html=_caveSaisBanner();
  if(recoltes.length){
    html+='<div class="mvv-camp"><div class="mvv-camp-lbl">Campagne '+(new Date().getFullYear())+' · '+recoltes.length+' récolte'+(recoltes.length>1?'s':'')+'</div><div class="mvv-camp-grid">'
      +'<div><div class="mvv-camp-n">'+caisses+'</div><div class="mvv-camp-cl">Caisses</div></div>'
      +'<div><div class="mvv-camp-n">'+(kg/1000).toFixed(1)+'<span class="u">t</span></div><div class="mvv-camp-cl">Récoltés</div></div>'
      +'<div><div class="mvv-camp-n">'+(kgCuve/cfg.ratio_max).toFixed(0)+'<span class="u">hL</span></div><div class="mvv-camp-cl">Estimés cuvés</div></div>'
      +'</div>'
      +(kgVendu>0?'<div class="mvv-camp-sold">'+kgVendu.toLocaleString('fr-FR')+' kg vendus en raisin (non vinifiés)</div>':'')
      +'</div>';
    window._mvGraphOublier('#mvg-ap-');
    html+='<div class="mvmat-card"><div class="mvmat-ttl">Apports par parcelle</div>'
      +'<div id="mvg-ap-all"></div></div>';
    (function(rr){ window._mvGraphSuivre('#mvg-ap-all', function(lg){ return _vendApportsSvg(rr,lg); }); })(recoltes);
    html+='<div class="mvv-seclbl">Détail des récoltes</div>';
    recoltes.forEach(function(r){
      var kg_=_recKg(r);
      var surf_=_vendParcSurf(r.parcelle);
      html+='<div class="mvv-rec" onclick="openOvVendRec(\''+r.id+'\')"><div class="mvv-rec-l">'
        +'<div class="mvv-rec-nm">'+_escHtml(r.parcelle)+'</div>'
        +'<div class="mvv-rec-mt">'+_vendFrDate(r.date)+' · '+(r.nb_caisses||0)+' caisses</div>'
        +'<div class="mvv-rec-badges">'+_vendEtatBadge(r.etat_pct||0)
        +'<span class="mvv-b er">'+_vendErLbl(r)+'</span>'
        +(r.client?_mvBadge(r.client,'neutre'):(r.vendu?_mvBadge('Vendu raisin','neutre'):''))
        +'</div></div>'
        +'<div class="mvv-rec-r">'
        +(_recSold(r)?'<div class="mvv-rec-hl sold">vendu</div>':'<div class="mvv-rec-hl">'+_vendHlRange(kg_)+'<span class="su">hL est.</span></div>')
        +'<div class="mvv-rec-kg">'+kg_.toLocaleString('fr-FR')+' kg</div>'
        +(surf_>0?'<div class="mvv-rec-kg">'+Math.round(kg_/surf_).toLocaleString('fr-FR')+' kg/ha</div>':'')
        +'</div></div>';
    });
  } else {
    html+='<div class="mvv-empty"><div class="mvv-empty-ic">'+_mvIcon('raisin',40)+'</div><div class="mvv-empty-tx">Aucune récolte saisie.<br>Pesez votre première benne pour lancer la campagne.</div></div>';
  }
  html+=_vendRendHistHtml();
  if(canEdit) html+='<div class="mvv-fab"><button class="mvv-fab-btn" onclick="openOvVendRec(null)">＋ Nouvelle récolte</button></div>';
  el.innerHTML=html;
  _vendRefreshCockpit();
}

function _mvgId(x){ return String(x==null?'':x).replace(/[^A-Za-z0-9_-]/g,''); }
function renderVendCuves() {
  var el=document.getElementById('mvv-body'); if(!el) return;
  window._mvGraphOublier('#mvg-fa-');
  window._mvGraphOublier('#mvg-fm-');
  window._mvGraphOublier('#mvg-cv-');
  var cuves=CAVE_VENDANGE.cuves_vinif||[];
  var canEdit=canWrite();
  var actives=cuves.filter(function(c){return c.statut!=='termine';});
  var decuvees=cuves.filter(function(c){return c.statut==='termine';});
  var sorted=actives.slice().sort(function(a,b){
    var sa=_vendIsActive(a)?_vendStale(a):-1, sb=_vendIsActive(b)?_vendStale(b):-1;
    return sb-sa;
  });
  var due=actives.filter(function(c){return _vendIsActive(c)&&_vendStale(c)>=1;});
  var h=_caveSaisBanner();
  if(due.length){
    h+='<div class="mvv-alert"><div class="mvv-alert-t">'+due.length+' cuve'+(due.length>1?'s':'')+' à mesurer</div>'
      +'<div class="mvv-alert-d">En fermentation active, un relevé de densité par jour suit la cinétique et anticipe un arrêt.</div>'
      +'<div class="mvv-alert-chips">'+due.map(function(c){
        return '<button class="mvv-alert-chip" onclick="openOvVendMesure(\''+c.id+'\')">'+_escHtml(c.nom)+' <small>· '+_vendStale(c)+' j</small></button>';
      }).join('')+'</div></div>';
  }
  if(actives.length){
    // Le remplissage, parcelle par parcelle, AVANT la liste des cuves : c'est
    // lui qui dit si la journee de recolte de demain peut etre lancee.
    h+='<div class="mvmat-card"><div class="mvmat-ttl">Remplissage des cuves \u00b7 parcelle par parcelle</div>'
      +'<div id="mvg-cv-all"></div></div>';
    (function(cc,rr){ window._mvGraphSuivre('#mvg-cv-all', function(lg){ return _vendRemplirSvg(cc,rr,lg); }); })(actives, CAVE_VENDANGE.recoltes||[]);
    h+='<div class="mvv-seclbl">'+actives.length+' cuve'+(actives.length>1?'s':'')+' de vinification</div>';
    sorted.forEach(function(c){
      var last=_vendLastMes(c), active=_vendIsActive(c), stale=_vendStale(c);
      var pct=last?_vendFaPct(_vendMesD20(last)):0;
      var dueCls=active&&stale>=1?' due':'';
      h+='<div class="mvv-cuve'+(active?' act':'')+dueCls+'">';
      h+='<div class="mvv-cuve-head"><div style="flex:1;min-width:0">'
        +'<div class="mvv-cuve-name">'+_escHtml(c.nom)+'</div>'
        +'<div class="mvv-cuve-meta">Entrée le '+_vendFrDate(c.date_entree)+(c.parcelles&&c.parcelles.length?' · '+c.parcelles.length+' parcelle'+(c.parcelles.length>1?'s':''):'')+'</div>'
        +(c.parcelles&&c.parcelles.length?'<div class="mvv-cuve-par">'+c.parcelles.map(function(p){return _escHtml(p);}).join(' · ')+'</div>':'')
        +'</div>'
        +'<div class="mvv-vol"><div class="mvv-vol-n">'+(c.volume_hl||0)+'</div><div class="mvv-vol-u">hL</div>'
        +(canEdit?'<button class="mv-gh mvv-edit" onclick="event.stopPropagation();openOvVendCuve(\''+c.id+'\')" title="Modifier" aria-label="Modifier">'+_mvIcon('crayon',18)+'</button>':'')
        +'</div></div>';
      h+=_vendStepper(c.statut);
      if(last && active){
        h+='<div class="mvv-ferm"><div class="mvv-ferm-top"><span class="mvv-ferm-lbl">Fermentation alcoolique</span>'
          +'<span class="mvv-ferm-pct">'+pct+'<small>% FA</small></span></div>'
          +'<div class="mvv-gauge"><div class="mvv-gauge-fill" style="width:'+pct+'%"></div><div class="mvv-gauge-mk" style="left:calc('+pct+'% - 1.5px)"></div></div>'
          +'<div class="mvv-ferm-scale"><span>Densité '+Math.round(_vendMesD20(last))+' (20°C)'+(last.temp_c!=null?' · '+last.temp_c+'°C brut':'')+'</span><span>reste ~'+_vendDegrePot(_vendMesD20(last)).toFixed(1)+'°</span></div></div>';
        // La cinetique compacte cede la place au graphe complet des qu'il y a
        // trois releves : densite, temperature et les operations sur le meme axe.
        if((c.mesures_fa||[]).length>=3){
          (function(cu){ window._mvGraphSuivre('#mvg-fm-'+_mvgId(cu.id), function(lg){ return _vendFermSvg(cu,lg); }); })(c);
          h+='<div id="mvg-fm-'+_mvgId(c.id)+'"></div>';
        } else {
          (function(cu){ window._mvGraphSuivre('#mvg-fa-'+_mvgId(cu.id), function(lg){ return _vendSparkline(cu.mesures_fa,cu.id,lg); }); })(c);
          h+='<div id="mvg-fa-'+_mvgId(c.id)+'"></div>';
        }
        h+='<div class="mvv-chips">'
          +(last.temp_c!=null?'<span class="mvv-chip '+_vendTempCls(last.temp_c)+'">'+last.temp_c+'<span class="u">°C</span></span>':'')
          +(last.remontages>0?'<span class="mvv-chip">'+last.remontages+'<span class="u">remont.</span></span>':'')
          +(last.pigeages>0?'<span class="mvv-chip">'+last.pigeages+'<span class="u">pigeage</span></span>':'')
          +'</div>';
        var rc=stale===0?'ok':stale===1?'watch':'late';
        var rt=stale===0?'Mesuré aujourd\'hui':stale===1?'Dernier relevé hier':'<span class="pulse"></span> '+stale+' j sans relevé — à contrôler';
        h+='<div class="mvv-recency '+rc+'">'+rt+'</div>';
        if(canEdit) h+='<button class="mvv-act-btn measure" onclick="openOvVendMesure(\''+c.id+'\')">Saisir une mesure</button>';
        h+=_vendOpsSummary(c);
        if(canEdit) h+=_vendActRow(c);
      } else if(c.statut==='setup'){
        h+='<div class="mvv-recency watch" style="margin-top:12px">Cuve prête — en attente d\'encuvage</div>';
        if(canEdit) h+='<button class="mvv-act-btn ghost" onclick="openOvVendCuve(\''+c.id+'\')">Démarrer la fermentation</button>';
        h+=_vendOpsSummary(c);
      } else {
        h+='<div class="mvv-done-tag">'+_mvBadge(_vendStatLbl(c.statut)+' — cuvaison terminée','vert')+'</div>';
        h+=_vendOpsSummary(c);
        if(canEdit) h+=_vendActRow(c);
      }
      h+='</div>';
    });
  } else if(!decuvees.length){
    h+='<div class="mvv-empty"><div class="mvv-empty-ic">'+_mvIcon('verre',40)+'</div><div class="mvv-empty-tx">Aucune cuve de vinification.<br>Créez votre première cuve pour suivre la fermentation.</div></div>';
  }
  h+=_vendDecuveesSection(decuvees);
  if(canEdit) h+='<div class="mvv-fab"><button class="mvv-fab-btn" onclick="openOvVendCuve(null)">＋ Nouvelle cuve</button></div>';
  el.innerHTML=h;
  if(window._mvGraphRepeindre) window._mvGraphRepeindre();
  _vendRefreshCockpit();
}

function _vendCfg(){return Object.assign({poids_caisse_kg:25,ratio_min:130,ratio_max:140,sucre_par_degre:16.83},CAVE_VENDANGE.config||{});}
function renderVendParam() {
  var el=document.getElementById('mvv-body'); if(!el) return;
  var cfg=_vendCfg();
  var pck=cfg.poids_caisse_kg, rMin=cfg.ratio_min, rMax=cfg.ratio_max;
  var ex=100*pck;
  var admin=(typeof isAdmin==='function'&&isAdmin());
  var html=_caveSaisBanner();
  html+='<div class="mvv-set"><div class="mvv-set-t">Pesée</div>'
    +'<div class="mvv-set-d">Poids moyen d\'une caisse de vendange, utilisé pour convertir les caisses en kilos.</div>'
    +'<div class="mvv-prow"><div class="mvv-prow-l">Poids par caisse</div><div style="display:flex;align-items:center;gap:7px"><input class="mvv-fi" id="vpfi-pck" type="number" min="10" max="60" value="'+pck+'"><span style="font-size:11px;color:var(--texte-doux,#5F5F5F)">kg</span></div></div></div>';
  html+='<div class="mvv-set"><div class="mvv-set-t">Rendement jus</div>'
    +'<div class="mvv-set-d">Kilos de raisin pour produire 1 hL de jus. Standard Bourgogne rouge : 130–140 kg/hL.</div>'
    +'<div class="mvv-prow"><div class="mvv-prow-l">Ratio minimum</div><div style="display:flex;align-items:center;gap:7px"><input class="mvv-fi" id="vpfi-rmin" type="number" min="80" max="200" value="'+rMin+'"><span style="font-size:11px;color:var(--texte-doux,#5F5F5F)">kg/hL</span></div></div>'
    +'<div class="mvv-prow"><div class="mvv-prow-l">Ratio maximum</div><div style="display:flex;align-items:center;gap:7px"><input class="mvv-fi" id="vpfi-rmax" type="number" min="80" max="200" value="'+rMax+'"><span style="font-size:11px;color:var(--texte-doux,#5F5F5F)">kg/hL</span></div></div>'
    +'<div class="mvv-preview">100 caisses de '+pck+' kg → <b>'+(ex/rMax).toFixed(1)+'–'+(ex/rMin).toFixed(1)+' hL</b></div></div>';
  html+='<div class="mvv-set"><div class="mvv-set-t">Chaptalisation</div>'
    +'<div class="mvv-set-d">Sucre pour enrichir de 1° d’alcool potentiel. Standard : 16,83 g/L (≈ 17 g/L). Utilisé par l’assistant d’opération sur cuve.</div>'
    +'<div class="mvv-prow"><div class="mvv-prow-l">Sucre par degré</div><div style="display:flex;align-items:center;gap:7px"><input class="mvv-fi" id="vpfi-spd" type="number" min="15" max="20" step="0.01" value="'+cfg.sucre_par_degre+'"><span style="font-size:11px;color:var(--texte-doux,#5F5F5F)">g/L</span></div></div></div>';
  html+='<div class="mvv-set"><div class="mvv-set-t">Clients vrac</div>'
    +'<div class="mvv-set-d">Acheteurs de raisin en vrac, avec leur poids par caisse. Sert à convertir les caisses vendues et suivre les volumes livrés.</div>'
    +(canWrite()?'<button class="mvv-save ghost2" style="margin-top:12px" onclick="openVendClients()">Gérer les clients ('+_vendClients().length+')</button>':'')+'</div>';
  if(admin) html+='<button class="mvv-save" onclick="_vendSaveParam()">Enregistrer les paramètres</button>';
  el.innerHTML=html;
  _vendRefreshCockpit();
}

function _vndUpdateCalc() {
  var elC=document.getElementById('vrec-caisses'); if(!elC) return;
  var nb=parseInt(elC.value)||0;
  var clObj=_vendClient((document.getElementById('vrec-client')||{}).value||'');
  var kg=nb*((clObj&&clObj.poids_caisse_kg)||_vendCfg().poids_caisse_kg||25);
  var wrap=document.getElementById('vrec-calc-wrap'); if(!wrap) return;
  if(nb<=0){wrap.innerHTML='';return;}
  var hlHtml=!_vendVendu?('<b style="color:var(--terre,#8A5A38)">'+_vendHlRange(kg)+' hl</b>'):'<span style="color:var(--texte-doux,#5F5F5F);">\u2014 (vendu en raisin)</span>';
  wrap.innerHTML='<div class="vend-calc-band" style="margin-bottom:10px"><div class="vend-calc-cell"><div class="vend-calc-v">'+kg.toLocaleString('fr-FR')+'</div><div class="vend-calc-l">kg</div></div><div class="vend-calc-sep"></div><div class="vend-calc-cell"><div style="font-size:13px;font-weight:600;margin:2px 0;">'+hlHtml+'</div><div class="vend-calc-l">hl estim\u00e9s</div></div></div>';
}
function _vndAdjCaisses(d) {
  var el=document.getElementById('vrec-caisses'); if(!el) return;
  el.value=Math.max(0,(parseInt(el.value)||0)+d);
  _vndUpdateCalc();
}
function _vndSyncCaisses() { _vndUpdateCalc();
  if(!_vcuvSel.volTouched){ _vcuvSel.vol=null; if(document.getElementById('vrec-cuv-att')) _vendCuvAtt(); }
}
function _vndSetEtat(v) {
  var el=document.getElementById('vrec-etat-pct'); if(el) el.textContent=v+'%';
  var bd=document.getElementById('vrec-etat-badge'); if(bd) bd.innerHTML=_vendEtatBadge(parseInt(v));
}
function _vndToggleVendu() {
  _vendVendu=!_vendVendu;
  _renderVendVenduWrap();
  var vs=document.getElementById('vrec-vinif-section');
  if(vs){vs.style.opacity=_vendVendu?'0.35':'1';vs.style.pointerEvents=_vendVendu?'none':'';}
  _vendSyncDest();
  _vndUpdateCalc();
}
function _renderVendVenduWrap() {
  var wrap=document.getElementById('vrec-vendu-wrap'); if(!wrap) return;
  var bg=_vendVendu?'rgba(205,148,38,.06)':'rgba(74,159,200,.04)';
  var bd=_vendVendu?'rgba(205,148,38,.3)':'rgba(74,159,200,.2)';
  var col=_vendVendu?'#8A6A12':'var(--texte,#1A1A14)';
  var swBg=_vendVendu?'rgba(205,148,38,.5)':'rgba(192,132,90,.15)';
  var knobLeft=_vendVendu?'23':'3';
  var knobBg='#FFFFFF';
  var lbl=_vendVendu?'\uD83E\uDD1D Vendu en raisin':'\uD83E\uDEA3 Vinifi\u00e9 au domaine';
  var sub=_vendVendu?'Pes\u00e9e conserv\u00e9e \u2014 pas de cuve cr\u00e9\u00e9e':'Mise en cuve apr\u00e8s r\u00e9colte';
  wrap.innerHTML='<div onclick="_vndToggleVendu()" style="display:flex;align-items:center;justify-content:space-between;border-radius:12px;padding:11px 13px;margin-bottom:10px;cursor:pointer;border:1px solid '+bd+';background:'+bg+'"><div><div style="font-size:13px;font-weight:600;color:'+col+'">'+lbl+'</div><div style="font-size:10.5px;color:var(--texte-doux,#5F5F5F);margin-top:2px">'+sub+'</div></div><div style="width:46px;height:26px;background:'+swBg+';border-radius:13px;position:relative;flex-shrink:0;"><div style="position:absolute;top:3px;left:'+knobLeft+'px;width:20px;height:20px;border-radius:10px;background:'+knobBg+'"></div></div></div>';
}
function _vndSetEr(e) {
  _vendEraflage=e;
  ['total','partiel','entiere'].forEach(function(b){
    var el=document.getElementById('vrec-er-'+b); if(!el) return;
    var on=b===e;
    el.style.background=on?'rgba(192,132,90,.18)':'rgba(192,132,90,.04)';
    el.style.borderColor=on?'rgba(192,132,90,.4)':'rgba(192,132,90,.15)';
    el.style.color=on?'#8A5A38':'#5F5F5F';
  });
  var pw=document.getElementById('vrec-er-pct-wrap'); if(pw) pw.style.display=e==='partiel'?'block':'none';
}
function openOvVendRec(id) {
  if(!canWrite()) return;
  _vendEditId=id||null;
  var r=id?(CAVE_VENDANGE.recoltes||[]).find(function(x){return x.id===id;}):null;
  var titleEl=document.getElementById('ov-vend-rec-title');
  if(titleEl) titleEl.textContent=r?'\u270f\ufe0f Modifier la r\u00e9colte':'\uD83C\uDF47 Nouvelle r\u00e9colte';
  var el;
  _vendInjectParcelleSelect(r?r.parcelle:'');
  el=document.getElementById('vrec-date'); if(el) el.value=r?r.date:new Date().toISOString().slice(0,10);
  el=document.getElementById('vrec-caisses'); if(el) el.value=r?r.nb_caisses:0;
  el=document.getElementById('vrec-temp'); if(el) el.value=r&&r.temp_c?r.temp_c:'';
  var etatPct=r?(r.etat_pct||0):0;
  el=document.getElementById('vrec-etat-range'); if(el) el.value=etatPct;
  _vndSetEtat(etatPct);
  _vendVendu=r?!!r.vendu:false;
  _vendEraflage=r?(r.erasflage||'total'):'total';
  _renderVendVenduWrap();
  var vs=document.getElementById('vrec-vinif-section');
  if(vs){vs.style.opacity=_vendVendu?'0.35':'1';vs.style.pointerEvents=_vendVendu?'none':'';}
  _vndSetEr(_vendEraflage);
  _vendInjectDestFields(r);
  el=document.getElementById('vrec-er-pct'); if(el) el.value=r?(r.er_pct||30):30;
  el=document.getElementById('vrec-note'); if(el) el.value=r?(r.note||''):'';
  el=document.getElementById('vrec-id'); if(el) el.value=id||'';
  el=document.getElementById('vrec-del-btn'); if(el) el.style.display=r?'block':'none';
  _vndUpdateCalc();
  var ov=document.getElementById('ovVendRec'); if(ov) ov.classList.add('open');
}
function saveVendRec() {
  var parcelle=((document.getElementById('vrec-parcelle')||{}).value||'').trim();
  if(!parcelle){showToast('Saisissez le nom de la parcelle','#E07060');return;}
  var nb=parseInt((document.getElementById('vrec-caisses')||{}).value)||0;
  var date=(document.getElementById('vrec-date')||{}).value||'';
  var temp=parseFloat((document.getElementById('vrec-temp')||{}).value)||null;
  var etatPct=parseInt((document.getElementById('vrec-etat-range')||{}).value)||0;
  var erPct=parseInt((document.getElementById('vrec-er-pct')||{}).value)||30;
  var note=((document.getElementById('vrec-note')||{}).value||'');
  var id=((document.getElementById('vrec-id')||{}).value||'');
  var vendu=_vendVendu;
  var client=vendu?((document.getElementById('vrec-client')||{}).value||''):'';
  var prev=id?(CAVE_VENDANGE.recoltes||[]).find(function(r){return r.id===id;}):null;
  // ── cuvee de destination : registre + rattachement de cuve ──
  var _mill=_vendMillOfDate(date), _cuv=null;
  if(!vendu){
    if(_vcuvSel.id) _cuv=_vendCuvById(_vcuvSel.id);
    if(_cuv&&_cuv.millesime!==_mill) _cuv=_vendCuvEnsure(_cuv.nom,_mill);
    if(!_cuv&&(_vcuvSel.nom||'').trim()) _cuv=_vendCuvEnsure(_vcuvSel.nom,_mill);
    if(!_cuv){showToast('Choisissez ou cr\u00e9ez une cuv\u00e9e de destination','#E07060');return;}
  }
  var cuvee=_cuv?_cuv.nom:'';
  var _vcid=_cuv?_cuv.id:null;
  var _prevCuve=prev?(prev.cuve_id||null):null;
  var _cuveId=null;
  if(_cuv){
    var _cvs=_vendCuvStats(_cuv.id).cuves;
    if(_cvs.length){
      if(_vcuvSel.cuveIdx>=0&&_cvs[_vcuvSel.cuveIdx]) _cuveId=_cvs[_vcuvSel.cuveIdx].id;
    } else if(_prevCuve){ _cuveId=_prevCuve; }
  }
  var obj={id:id||'vrec_'+Date.now(),parcelle:parcelle,date:date,nb_caisses:nb,temp_c:temp,etat_pct:etatPct,erasflage:_vendEraflage,er_pct:erPct,vendu:vendu,client:client,cuvee:cuvee,vcuvee_id:_vcid,note:note,cuve_id:_cuveId};
  if(!CAVE_VENDANGE.recoltes) CAVE_VENDANGE.recoltes=[];
  // la recolte quitte son ancienne cuve
  if(_prevCuve&&_prevCuve!==_cuveId){
    var _oc=(CAVE_VENDANGE.cuves_vinif||[]).find(function(c){return c.id===_prevCuve;});
    if(_oc&&Array.isArray(_oc.recolte_ids)) _oc.recolte_ids=_oc.recolte_ids.filter(function(x){return x!==obj.id;});
  }
  // ... et rejoint la nouvelle (volume propose, modifiable)
  if(_cuveId){
    var _nc=(CAVE_VENDANGE.cuves_vinif||[]).find(function(c){return c.id===_cuveId;});
    if(_nc){
      if(!Array.isArray(_nc.recolte_ids)) _nc.recolte_ids=[];
      if(_nc.recolte_ids.indexOf(obj.id)===-1) _nc.recolte_ids.push(obj.id);
      if(_vcuvSel.vol!=null&&_vcuvSel.vol>0) _nc.volume_hl=_vcuvSel.vol;
      if(_vcid&&!_nc.vcuvee_id) _nc.vcuvee_id=_vcid;
    }
  }
  if(id){var idx=CAVE_VENDANGE.recoltes.findIndex(function(r){return r.id===id;});if(idx!==-1)CAVE_VENDANGE.recoltes[idx]=obj;else CAVE_VENDANGE.recoltes.push(obj);}
  else{CAVE_VENDANGE.recoltes.push(obj);}
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  if(window.fbSave) window.fbSave('cave_vendange',CAVE_VENDANGE);
  _vendRecordRendement(obj,prev);
  if(window.closeOv) window.closeOv(null,'ovVendRec');
  showToast(id?'\u2705 R\u00e9colte mise \u00e0 jour':'\u2705 R\u00e9colte enregistr\u00e9e','#3D6B27');
  renderVendRec();
}
function deleteVendRec() {
  var id=((document.getElementById('vrec-id')||{}).value||'');
  if(!id) return;
  var rec=(CAVE_VENDANGE.recoltes||[]).find(function(r){return r.id===id;});
  var pnom=rec?rec.parcelle:'';
  window.openConfirmDel('Supprimer cette récolte ?','',function(){
    var _dc=rec&&rec.cuve_id?(CAVE_VENDANGE.cuves_vinif||[]).find(function(c){return c.id===rec.cuve_id;}):null;
    if(_dc&&Array.isArray(_dc.recolte_ids)) _dc.recolte_ids=_dc.recolte_ids.filter(function(x){return x!==id;});
    CAVE_VENDANGE.recoltes=(CAVE_VENDANGE.recoltes||[]).filter(function(r){return r.id!==id;});
    _vendCuvSync();
    window.CAVE_VENDANGE=CAVE_VENDANGE;
    if(window.fbSave) window.fbSave('cave_vendange',CAVE_VENDANGE);
    _vendUnrecordRendement(id,pnom);
    if(window.closeOv) window.closeOv(null,'ovVendRec');
    showToast('\uD83D\uDDD1 R\u00e9colte supprim\u00e9e','#B85A1A');
    renderVendRec();
  });
}
function _vndToggleMpf() {
  _vcuvMpfActive=!_vcuvMpfActive;
  var sw=document.getElementById('vcuv-mpf-sw');
  if(sw) sw.style.background=_vcuvMpfActive?'rgba(205,148,38,.5)':'rgba(192,132,90,.15)';
  var kn=document.getElementById('vcuv-mpf-knob');
  if(kn){kn.style.left=_vcuvMpfActive?'23px':'3px';kn.style.background='#FFFFFF';}
  var p=document.getElementById('vcuv-mpf-params'); if(p) p.style.display=_vcuvMpfActive?'block':'none';
}
function openOvVendCuve(id) {
  if(!canWrite()) return;
  _vcuvEditId=id||null;
  var c=id?(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===id;}):null;
  var titleEl=document.getElementById('ov-vend-cuv-title');
  if(titleEl) titleEl.textContent=c?'\u270f\ufe0f Modifier la cuve':'\uD83E\uDEA3 Nouvelle cuve';
  var el;
  el=document.getElementById('vcuv-nom'); if(el) el.value=c?c.nom:'';
  el=document.getElementById('vcuv-volume'); if(el) el.value=c?c.volume_hl:'';
  el=document.getElementById('vcuv-date'); if(el) el.value=c?c.date_entree:new Date().toISOString().slice(0,10);
  el=document.getElementById('vcuv-parcelles'); if(el) el.value=c&&c.parcelles?c.parcelles.join(', '):'';
  el=document.getElementById('vcuv-statut'); if(el) el.value=c?(c.statut||'setup'):'setup';
  el=document.getElementById('vcuv-so2'); if(el) el.value=c&&c.so2_g_hl?c.so2_g_hl:'';
  el=document.getElementById('vcuv-levures'); if(el) el.value=c?(c.levures||'indigenes'):'indigenes';
  el=document.getElementById('vcuv-erasflage'); if(el) el.value=c?(c.erasflage||'total'):'total';
  _vcuvMpfActive=c&&c.mpf?!!c.mpf.active:false;
  var sw=document.getElementById('vcuv-mpf-sw');
  if(sw) sw.style.background=_vcuvMpfActive?'rgba(205,148,38,.5)':'rgba(192,132,90,.15)';
  var kn=document.getElementById('vcuv-mpf-knob');
  if(kn){kn.style.left=_vcuvMpfActive?'23px':'3px';kn.style.background='#FFFFFF';}
  el=document.getElementById('vcuv-mpf-temp'); if(el) el.value=c&&c.mpf?(c.mpf.temp_c||12):12;
  el=document.getElementById('vcuv-mpf-duree'); if(el) el.value=c&&c.mpf?(c.mpf.duree_j||4):4;
  var p=document.getElementById('vcuv-mpf-params'); if(p) p.style.display=_vcuvMpfActive?'block':'none';
  el=document.getElementById('vcuv-id'); if(el) el.value=id||'';
  el=document.getElementById('vcuv-del-btn'); if(el) el.style.display=c?'block':'none';
  _vendInjectCuveFrom(!c);
  var ov=document.getElementById('ovVendCuve'); if(ov) ov.classList.add('open');
}
function saveVendCuve() {
  var nom=((document.getElementById('vcuv-nom')||{}).value||'').trim();
  if(!nom){showToast('Saisissez le nom de la cuve','#E07060');return;}
  var vol=parseFloat((document.getElementById('vcuv-volume')||{}).value)||0;
  var date=(document.getElementById('vcuv-date')||{}).value||'';
  var parTxt=((document.getElementById('vcuv-parcelles')||{}).value||'');
  var parcelles=parTxt.split(',').map(function(s){return s.trim();}).filter(Boolean);
  var statut=(document.getElementById('vcuv-statut')||{}).value||'setup';
  var so2=parseFloat((document.getElementById('vcuv-so2')||{}).value)||null;
  var levures=(document.getElementById('vcuv-levures')||{}).value||'indigenes';
  var erasflage=(document.getElementById('vcuv-erasflage')||{}).value||'total';
  var mpfT=parseFloat((document.getElementById('vcuv-mpf-temp')||{}).value)||12;
  var mpfD=parseInt((document.getElementById('vcuv-mpf-duree')||{}).value)||4;
  var id=((document.getElementById('vcuv-id')||{}).value||'');
  var existing=id?(CAVE_VENDANGE.cuves_vinif||[]).find(function(c){return c.id===id;}):null;
  var obj={id:id||'vcuv_'+Date.now(),nom:nom,volume_hl:vol,statut:statut,parcelles:parcelles,date_entree:date,erasflage:erasflage,so2_g_hl:so2,levures:levures,mpf:{active:_vcuvMpfActive,temp_c:mpfT,duree_j:mpfD},mesures_fa:existing?(existing.mesures_fa||[]):[],decuvage:existing?(existing.decuvage||null):null};
  if(!id && _vcuvFromGrp){
    var _d=_vcuvFromGrp;
    obj.cuvee_src=_d.cuvee; obj.vcuvee_id=_d.id||null; obj.recolte_ids=_d.ids.slice(); obj.nb_caisses=_d.caisses;
    (CAVE_VENDANGE.recoltes||[]).forEach(function(r){ if(_d.ids.indexOf(r.id)!==-1) r.cuve_id=obj.id; });
  }
  if(existing&&existing.vcuvee_id&&!obj.vcuvee_id) obj.vcuvee_id=existing.vcuvee_id;
  if(existing&&existing.cuvee_src&&!obj.cuvee_src) obj.cuvee_src=existing.cuvee_src;
  if(existing&&existing.recolte_ids&&!obj.recolte_ids) obj.recolte_ids=existing.recolte_ids.slice();
  if(existing&&existing.nb_caisses!=null&&obj.nb_caisses==null) obj.nb_caisses=existing.nb_caisses;
  if(!CAVE_VENDANGE.cuves_vinif) CAVE_VENDANGE.cuves_vinif=[];
  if(id){var idx=CAVE_VENDANGE.cuves_vinif.findIndex(function(c){return c.id===id;});if(idx!==-1)CAVE_VENDANGE.cuves_vinif[idx]=obj;else CAVE_VENDANGE.cuves_vinif.push(obj);}
  else{CAVE_VENDANGE.cuves_vinif.push(obj);}
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  if(window.fbSave) window.fbSave('cave_vendange',CAVE_VENDANGE);
  if(window.closeOv) window.closeOv(null,'ovVendCuve');
  showToast(id?'\u2705 Cuve mise \u00e0 jour':'\u2705 Cuve cr\u00e9\u00e9e','#3D6B27');
  renderVendCuves();
}
function deleteVendCuve() {
  var id=((document.getElementById('vcuv-id')||{}).value||'');
  if(!id) return;
  window.openConfirmDel('Supprimer cette cuve ?','Toutes ses mesures seront également supprimées.',function(){
    CAVE_VENDANGE.cuves_vinif=(CAVE_VENDANGE.cuves_vinif||[]).filter(function(c){return c.id!==id;});
    (CAVE_VENDANGE.recoltes||[]).forEach(function(r){ if(r.cuve_id===id) r.cuve_id=null; });
    _vendCuvSync();
    window.CAVE_VENDANGE=CAVE_VENDANGE;
    if(window.fbSave) window.fbSave('cave_vendange',CAVE_VENDANGE);
    if(window.closeOv) window.closeOv(null,'ovVendCuve');
    showToast('\uD83D\uDDD1 Cuve supprim\u00e9e','#B85A1A');
    renderVendCuves();
  });
}
function _vmAdjRem(d){_vmRem=Math.max(0,_vmRem+d);var el=document.getElementById('vm-rem-val');if(el)el.textContent=_vmRem;}
function _vmAdjPig(d){_vmPig=Math.max(0,_vmPig+d);var el=document.getElementById('vm-pig-val');if(el)el.textContent=_vmPig;}
function openOvVendMesure(cuveId) {
  if(!canWrite()) return;
  _vmesureCuveId=cuveId;
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===cuveId;});
  var titleEl=document.getElementById('ov-vend-mes-title');
  if(titleEl) titleEl.textContent='\uD83D\uDCCA Mesure FA \u2014 '+(c?_escHtml(c.nom):'');
  _vmRem=2; _vmPig=1;
  var el;
  el=document.getElementById('vm-date'); if(el) el.value=new Date().toISOString().slice(0,10);
  el=document.getElementById('vm-densite'); if(el) el.value='';
  el=document.getElementById('vm-temp'); if(el) el.value='';
  el=document.getElementById('vm-rem-val'); if(el) el.textContent=_vmRem;
  el=document.getElementById('vm-pig-val'); if(el) el.textContent=_vmPig;
  el=document.getElementById('vm-note'); if(el) el.value='';
  var ov=document.getElementById('ovVendMesure'); if(ov) ov.classList.add('open');
}
function saveVendMesure() {
  var cuveId=_vmesureCuveId; if(!cuveId) return;
  var densite=parseFloat((document.getElementById('vm-densite')||{}).value)||null;
  if(!densite){showToast('Saisissez la densit\u00e9','#E07060');return;}
  var date=(document.getElementById('vm-date')||{}).value||new Date().toISOString().slice(0,10);
  var tempC=parseFloat((document.getElementById('vm-temp')||{}).value)||null;
  var note=((document.getElementById('vm-note')||{}).value||'');
  var mesure={id:'vm_'+Date.now(),date:date,densite:densite,temp_c:tempC,remontages:_vmRem,pigeages:_vmPig,note:note};
  var idx=(CAVE_VENDANGE.cuves_vinif||[]).findIndex(function(c){return c.id===cuveId;});
  if(idx===-1) return;
  if(!CAVE_VENDANGE.cuves_vinif[idx].mesures_fa) CAVE_VENDANGE.cuves_vinif[idx].mesures_fa=[];
  CAVE_VENDANGE.cuves_vinif[idx].mesures_fa.push(mesure);
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  if(window.fbSave) window.fbSave('cave_vendange',CAVE_VENDANGE);
  if(window.closeOv) window.closeOv(null,'ovVendMesure');
  showToast('\u2705 Mesure enregistr\u00e9e','#3D6B27');
  renderVendCuves();
}
function _vendSaveParam() {
  if(typeof isAdmin==='function'&&!isAdmin()) return;
  var pck=parseFloat((document.getElementById('vpfi-pck')||{}).value)||25;
  var rMin=parseFloat((document.getElementById('vpfi-rmin')||{}).value)||130;
  var rMax=parseFloat((document.getElementById('vpfi-rmax')||{}).value)||140;
  var spd=parseFloat((document.getElementById('vpfi-spd')||{}).value)||16.83;
  if(!CAVE_VENDANGE.config) CAVE_VENDANGE.config={};
  CAVE_VENDANGE.config.poids_caisse_kg=pck;
  CAVE_VENDANGE.config.ratio_min=rMin;
  CAVE_VENDANGE.config.ratio_max=rMax;
  CAVE_VENDANGE.config.sucre_par_degre=spd;
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  if(window.fbSave) window.fbSave('cave_vendange',CAVE_VENDANGE);
  showToast('\u2705 Param\u00e8tres enregistr\u00e9s','#3D6B27');
  renderVendParam();
}

// ═══════════════════════════════════════════════════════════════════════════
// VENDANGE v2 — densité @20°C · opérations cuve · clients vrac · décuvage → Chai
// (cave.js seul — CSS injecté en JS, bottom-sheets construits en JS)
// ═══════════════════════════════════════════════════════════════════════════

function _vendEnsureSheetCss(){
  if(document.getElementById('mvv-sheet-css')) return;
  var s=document.createElement('style'); s.id='mvv-sheet-css';
  s.textContent=`
.mvv-ov{position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.58);display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .22s}
.mvv-ov.open{opacity:1;pointer-events:auto}
.mvv-sheet{width:100%;max-width:560px;max-height:88vh;overflow-y:auto;background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.12);border-bottom:none;border-radius:24px 24px 0 0;padding:18px 17px calc(20px + env(safe-area-inset-bottom,0px));color:var(--texte,#1A1A14);transform:translateY(100%);transition:transform .26s cubic-bezier(.4,0,.2,1);font-family:inherit;box-shadow:0 -12px 40px rgba(20,17,13,.22)}
.mvv-ov.open .mvv-sheet{transform:translateY(0)}
.mvv-sheet *{box-sizing:border-box}
.mvv-sheet-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px}
.mvv-sheet-t{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:22px;color:var(--texte,#1A1A14);line-height:1.1}
.mvv-sheet-x{background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.18);color:var(--texte-doux,#5F5F5F);width:38px;height:38px;border-radius:10px;font-size:15px;cursor:pointer;flex-shrink:0}
.mvv-sheet-sub{font-size:12px;color:var(--texte-doux,#5F5F5F);line-height:1.5;margin-bottom:6px}
.mvv-flbl{display:block;font-size:11px;letter-spacing:.8px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);font-weight:700;margin:14px 0 6px}
.mvv-fhint{text-transform:none;letter-spacing:0;color:var(--texte-doux,#5F5F5F);font-weight:400}
.mvv-tin{width:100%;background:#fff;border:1px solid rgba(138,90,56,.3);border-radius:11px;padding:11px 13px;color:var(--texte,#1A1A14);font-size:15px;font-weight:500;font-family:inherit}
.mvv-tin:focus{border-color:var(--terre,#8A5A38);outline:none;box-shadow:0 0 0 3px rgba(138,90,56,.12)}
.mvv-fnote{font-size:11.5px;color:#8A4212;margin-top:8px;line-height:1.45}
.mvv-step2{display:flex;align-items:center;gap:12px;margin-top:4px}
.mvv-step2-b{width:44px;height:44px;border-radius:12px;background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.28);color:var(--terre,#8A5A38);font-size:22px;font-weight:700;cursor:pointer;line-height:1}
.mvv-step2-v{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:32px;color:var(--texte,#1A1A14);min-width:44px;text-align:center}
.mvv-step2-u{font-size:12px;color:var(--texte-doux,#5F5F5F)}
.mvv-optabs{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 4px}
.mvv-optab{border:1px solid rgba(138,90,56,.2);background:transparent;color:var(--texte-med,#4A4A3A);border-radius:10px;padding:9px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;min-height:40px}
.mvv-optab.on{background:var(--cave,#14110D);border-color:var(--cave,#14110D);color:#F0E2C8}
.mvv-bigcalc{margin-top:14px;background:var(--terre-pale,#F3EADF);border:1px solid rgba(138,90,56,.18);border-radius:14px;padding:15px;text-align:center}
.mvv-bigcalc-n{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:42px;line-height:1;color:var(--terre,#8A5A38)}
.mvv-bigcalc-l{font-size:11.5px;color:var(--texte-doux,#5F5F5F);margin-top:6px}
.mvv-bigcalc-cum{font-size:11.5px;color:var(--texte-med,#4A4A3A);margin-top:9px;min-height:0}
.mvv-clrow{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.12);border-radius:12px;padding:11px 13px;margin-bottom:8px}
.mvv-clrow-nm{font-size:14px;font-weight:600;color:var(--texte,#1A1A14)}
.mvv-clrow-mt{font-size:11px;color:var(--texte-doux,#5F5F5F);margin-top:2px}
.mvv-clrow-r{display:flex;gap:6px;flex-shrink:0}
.mvv-icbtn{width:40px;height:40px;border-radius:10px;background:#fff;border:1px solid rgba(138,90,56,.18);color:var(--texte-doux,#5F5F5F);font-size:14px;cursor:pointer}
.mvv-cllist{margin-top:4px}
.mvv-del{width:100%;padding:12px;border-radius:11px;background:var(--rouge-pale,#FAEAE8);border:1px solid rgba(160,41,30,.28);color:var(--rouge,#A0291E);font-size:13px;font-weight:600;cursor:pointer;margin-top:10px;font-family:inherit;min-height:44px}
.mvv-save.ghost2{background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.24);color:var(--terre,#8A5A38)}
.mvv-actrow{display:flex;gap:8px;margin-top:9px}
.mvv-act2{flex:1;padding:11px;border-radius:10px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.2);color:var(--terre,#8A5A38);min-height:44px}
.mvv-act2.dec{background:rgba(200,106,78,.10);border-color:rgba(200,106,78,.32);color:#B0412C}
.mvv-opslist{margin-top:10px;font-size:11.5px;color:var(--texte-med,#4A4A3A);background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.10);border-radius:9px;padding:7px 10px}
.mvv-opslist .u{color:var(--texte-doux,#5F5F5F);font-weight:400}
.mvv-decwrap{margin-top:16px;background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.10);border-radius:12px;padding:2px 12px 8px}
.mvv-decsum{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);font-weight:600;padding:11px 2px;cursor:pointer;list-style:none}
.mvv-decsum::-webkit-details-marker{display:none}
.mvv-decrow{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:var(--texte-med,#4A4A3A);padding:7px 2px;border-top:1px solid rgba(138,90,56,.10)}
.mvv-decrow .u{color:var(--texte-doux,#5F5F5F)}
.mvv-degchip{display:inline-block;font-size:10px;font-weight:600;color:var(--ink-info,#4A9FC8);background:rgba(74,159,200,.10);border:1px solid rgba(74,159,200,.26);border-radius:8px;padding:2px 7px;margin-left:6px}
`;
  document.head.appendChild(s);
}

// —— Densité corrigée à 20 °C (table Véron / OIV) ——
var _VEND_DCORR={10:-2.5,11:-2.5,12:-2.0,13:-2.0,14:-1.5,15:-1.5,16:-1.0,17:-1.0,18:-0.5,19:-0.5,20:0,21:0.5,22:0.5,23:1.0,24:1.0,25:1.5,26:1.5,27:2.0,28:2.0,29:2.5,30:2.5};
function _vendCorrTerm(t){
  if(t==null||isNaN(t)) return 0;
  if(t<=10) return -2.5+(t-10)*0.25;   // extrapolation ±0,25/°C
  if(t>=30) return 2.5+(t-30)*0.25;
  var lo=Math.floor(t),hi=Math.ceil(t);
  if(lo===hi) return _VEND_DCORR[lo];
  return _VEND_DCORR[lo]+(_VEND_DCORR[hi]-_VEND_DCORR[lo])*(t-lo);
}
function _vendD20(densite,temp){
  if(densite==null) return densite;
  if(temp==null||isNaN(temp)) return densite;         // pas de température → densité brute
  return densite+_vendCorrTerm(temp)-_vendCorrTerm(20); // C(20)=0
}
function _vendMesD20(m){ return m?_vendD20(m.densite,m.temp_c):null; }
function _vendSucre(d20){ if(d20==null) return 0; return Math.max(0,2.564*d20-2581.5); }
function _vendDegrePot(d20){ return _vendSucre(d20)/16.83; }

// —— Clients vrac + poids récolte ——
function _vendClients(){ if(!CAVE_VENDANGE.clients) CAVE_VENDANGE.clients=[]; return CAVE_VENDANGE.clients; }
function _vendClient(nom){ if(!nom) return null; return _vendClients().find(function(c){return c.nom===nom;})||null; }
function _vendRecPck(r){ var cl=_vendClient(r&&r.client); return (cl&&cl.poids_caisse_kg)||_vendCfg().poids_caisse_kg||25; }
function _recKg(r){ return (r&&r.nb_caisses||0)*_vendRecPck(r); }
function _recSold(r){ return !!(r&&(r.vendu||r.client)); }
function _vendParcSurf(nom){
  if(!nom) return 0;
  var ps=window.PARCELLES||[]; var k=String(nom).trim().toLowerCase();
  var p=ps.find(function(x){return x&&String(x.nom||'').trim().toLowerCase()===k;});
  return p?(parseFloat(p.surface)||0):0;
}

// —— Hôte bottom-sheet (cave.js seul, indépendant d'index.html) ——
function _vendSheet(html){
  _vendEnsureSheetCss();
  var ov=document.getElementById('mvv-ov');
  if(!ov){ ov=document.createElement('div'); ov.id='mvv-ov'; ov.className='mvv-ov';
    ov.addEventListener('click',function(e){ if(e.target===ov) _vendSheetClose(); });
    document.body.appendChild(ov); }
  ov.innerHTML='<div class="mvv-sheet" onclick="event.stopPropagation()">'+html+'</div>';
  requestAnimationFrame(function(){ ov.classList.add('open'); });
}
function _vendSheetClose(){ var ov=document.getElementById('mvv-ov'); if(ov) ov.classList.remove('open'); }

// —— Injection du champ « client » dans l'overlay récolte (cave.js seul) ——
function _vendInjectClientField(sel){
  var anchor=document.getElementById('vrec-vinif-section');
  if(!anchor||!anchor.parentNode) return;
  var row=document.getElementById('vrec-client-row');
  if(!row){
    row=document.createElement('div'); row.id='vrec-client-row'; row.style.marginBottom='12px';
    row.innerHTML='<label style="display:block;font-size:12px;font-weight:600;color:var(--terre,#8A5A38);margin-bottom:6px">Client (vente en vrac)</label>'
      +'<select id="vrec-client" class="fi ac" style="width:100%" onchange="_vndSyncCaisses()"></select>';
    anchor.parentNode.insertBefore(row,anchor);
  }
  var s=document.getElementById('vrec-client');
  if(s){
    s.innerHTML='<option value="">— Aucun (vinifié / vrac générique) —</option>'
      +_vendClients().map(function(c){return '<option value="'+_escHtml(c.nom)+'"'+(c.nom===sel?' selected':'')+'>'+_escHtml(c.nom)+' · '+(c.poids_caisse_kg||25)+' kg/caisse</option>';}).join('');
  }
}

// —— Décuvage → élevage (Le Chai) ——
var _vendDecNb=2, _vendDecCuveId=null;
// Choix des futs a l'entonnage : {lot_id: nb}. Vide = on retombe sur le simple
// compte de barriques, comme avant ce lot.
var _vendDecChoix={};
function openVendDecuvage(cuveId){
  if(!canWrite()) return;
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===cuveId;});
  if(!c){ showToast('Cuve introuvable','#E07060'); return; }
  _vendDecCuveId=cuveId;
  var yr=new Date().getFullYear();
  var _futHl=_caveFutHl(), _futTxt=String(_futHl).replace('.',',');
  _vendDecNb=Math.max(1,Math.round((c.volume_hl||0)/_futHl));
  // Proposition : du plus VIEUX au plus neuf. Un fut age doit tourner ; le neuf
  // se garde pour les cuvees qui le meritent. Proposition, jamais contrainte.
  _vendDecChoix={};
  if(!_vendDecParcVide() && typeof window._mvFutProposer==='function'){
    _vendDecChoix=window._mvFutProposer(window._mvFutStock(window.INTRANTS), _vendDecNb);
  }
  var html=''
    +'<div class="mvv-sheet-hd"><div class="mvv-sheet-t">Décuver → Le Chai</div>'
    +'<button class="mv-gh mvv-sheet-x" onclick="_vendSheetClose()" title="Fermer" aria-label="Fermer">'+_mvIcon('croix',18)+'</button></div>'
    +'<div class="mvv-sheet-sub">La cuve sort du Cuvier et devient une cuvée en élevage dans « Le Chai ». Le vin en barrique commence son suivi d\'ouillage.</div>'
    +'<label class="mvv-flbl">Nom de la cuvée</label>'
    +'<input id="vdec-nom" class="mvv-tin" type="text" value="'+_escHtml(c.nom||'')+'">'
    +'<label class="mvv-flbl">Millésime</label>'
    +'<input id="vdec-mil" class="mvv-tin" type="number" value="'+yr+'" min="2000" max="'+(yr+1)+'">'
    +(_vendDecParcVide()
      ? ('<label class="mvv-flbl">Nombre de barriques <span class="mvv-fhint">(≈ '+(c.volume_hl||0)+' hL ÷ '+_futTxt+' hL)</span></label>'
        +'<div class="mvv-step2"><button class="mvv-step2-b" onclick="_vendDecAdj(-1)">−</button>'
        +'<span id="vdec-nb" class="mvv-step2-v">'+_vendDecNb+'</span>'
        +'<button class="mvv-step2-b" onclick="_vendDecAdj(1)">＋</button>'
        +'<span class="mvv-step2-u">barriques ('+_futTxt+' hL)</span></div>')
      : '')
    +_vendDecLotsHtml(_futTxt)
    +'<button class="mvv-save" style="margin-top:18px" onclick="saveVendDecuvage()" id="vdec-go">Décuver et créer la cuvée</button>';
  _vendSheet(html);
  if(!_vendDecParcVide()) _vendDecRender();
}
function _vendDecAdj(d){ _vendDecNb=Math.max(1,_vendDecNb+d); var el=document.getElementById('vdec-nb'); if(el) el.textContent=_vendDecNb; }

// ── ENTONNAGE : piocher les futs dans le parc ─────────────────────────────
// Le parc vit dans La Reserve (INTRANTS.futs) ; le moteur dans utils.js. Si l'un
// ou l'autre manque — domaine qui n'a jamais rempli son parc, utils.js anterieur
// a ce lot — on retombe sur le simple compte de barriques d'avant. Personne n'est
// bloque parce qu'il n'a pas fait son inventaire.
function _vendDecParcVide(){
  if(typeof window._mvFutStock!=='function' || !window.INTRANTS) return true;
  return !window._mvFutStock(window.INTRANTS).lots.length;
}
function _vendDecTotal(){
  return (typeof window._mvFutTotal==='function') ? window._mvFutTotal(_vendDecChoix) : 0;
}
function _vendDecLotsHtml(futTxt){
  if(_vendDecParcVide()){
    return '<div class="mvv-dlnote">Aucun f\u00fbt libre dans La R\u00e9serve. '
      + 'Renseignez votre parc \u00e0 f\u00fbts pour choisir vos barriques une \u00e0 une.</div>';
  }
  return '<label class="mvv-flbl">Quelles barriques '
    + '<span class="mvv-fhint">(' + futTxt + ' hL chacune)</span></label>'
    + '<div id="vdec-lots"></div>';
}
// Re-rend UNIQUEMENT la liste : reconstruire la feuille entiere effacerait le nom
// et le millesime deja saisis.
function _vendDecRender(){
  var host=document.getElementById('vdec-lots'); if(!host) return;
  var st=window._mvFutStock(window.INTRANTS);
  var tot=_vendDecTotal(), manque=_vendDecNb-tot;
  var h='<div class="mvv-dlots">';
  st.lots.forEach(function(l){
    var n=parseInt(_vendDecChoix[l.id],10)||0;
    h+='<div class="mvv-dlot"><span class="mvv-dlot-b">'
      +'<span class="mvv-dlot-n">'+_escHtml(l.nom)+'</span>'
      +'<span class="mvv-dlot-m">'+(l.annee||'ann\u00e9e inconnue')+' \u00b7 '
      +window._mvFutAge(l.vins)+' \u00b7 '+l.qte+' libre'+(l.qte>1?'s':'')+'</span></span>'
      +'<span class="mvv-dstp">'
      +'<button type="button" onclick="_vendDecAdjLot(\''+_escHtml(l.id)+'\',-1)"'
      +(n<=0?' disabled':'')+'>\u2212</button>'
      +'<span>'+n+'</span>'
      +'<button type="button" onclick="_vendDecAdjLot(\''+_escHtml(l.id)+'\',1)"'
      +(n>=l.qte?' disabled':'')+'>\uff0b</button></span></div>';
  });
  var neuf=0;
  st.lots.forEach(function(l){ if(l.vins===0) neuf+=parseInt(_vendDecChoix[l.id],10)||0; });
  h+='</div><div class="mvv-dtot"><span class="mvv-dtot-n'+(manque>0?' ko':'')+'">'+tot+'</span>'
    +'<span class="mvv-dtot-l">barrique'+(tot>1?'s':'')+' choisie'+(tot>1?'s':'')
    +' sur '+_vendDecNb+' pour ce volume</span></div>';
  if(neuf>0){
    h+='<div class="mvv-dneuf">\u2728 dont <b>'+neuf+' barrique'+(neuf>1?'s':'')+' neuve'
      +(neuf>1?'s':'')+'</b> \u2014 v\u00e9rifiez que cette cuv\u00e9e les m\u00e9rite.</div>';
  }
  if(manque>0){
    h+='<div class="mvv-dwarn">Il manque <b>'+manque+' barrique'+(manque>1?'s':'')+'</b>. '
      +'Compl\u00e9tez votre parc dans La R\u00e9serve, ou d\u00e9cuvez quand m\u00eame \u2014 rien n\u2019est bloqu\u00e9.</div>';
  }
  host.innerHTML=h;
  var go=document.getElementById('vdec-go');
  if(go) go.textContent=tot>0
    ? ('D\u00e9cuver dans '+tot+' barrique'+(tot>1?'s':''))
    : 'D\u00e9cuver et cr\u00e9er la cuv\u00e9e';
}
function _vendDecAdjLot(id,d){
  var lot=window._mvFutStock(window.INTRANTS).lots.find(function(l){ return l.id===id; });
  if(!lot) return;
  var v=(parseInt(_vendDecChoix[id],10)||0)+d;
  if(v<0) v=0;
  if(v>lot.qte) v=lot.qte;      // on ne pose jamais plus que le disponible
  _vendDecChoix[id]=v;
  _vendDecRender();
}
window._vendDecAdjLot = _vendDecAdjLot;
window._vendDecRender = _vendDecRender;
function saveVendDecuvage(){
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===_vendDecCuveId;});
  if(!c) return;
  var nom=((document.getElementById('vdec-nom')||{}).value||'').trim()||c.nom||'Cuvée';
  var mil=parseInt((document.getElementById('vdec-mil')||{}).value)||new Date().getFullYear();
  var nb=(_vendDecTotal()>0?_vendDecTotal():(_vendDecNb||1));
  // Les futs choisis SORTENT du parc et emportent leur identite : tonnelier,
  // reference, annee d'achat, lot d'origine.
  // ⚠️ L'ancien chemin ecrivait {annee: millesime de la cuvee} : tout fut cree au
  // decuvage passait pour NEUF, meme avec cinq vins. Piocher dans le parc corrige
  // ce biais, l'annee venant du lot et non de la vendange.
  var _ton=null;
  if(typeof window._mvFutEntonner==='function' && window.INTRANTS && _vendDecTotal()>0){
    _ton=window._mvFutEntonner(_vendDecChoix, window.INTRANTS, nom+' '+mil);
    if(_ton && _ton.length && typeof window.saveIntrants==='function') window.saveIntrants();
  }
  if(_ton && _ton.length) nb=_ton.reduce(function(s,t){ return s+(t.nb||0); },0);
  var cuvee={id:'cuv_'+Date.now(),nom:nom,millesime:mil,
    tonneaux:(_ton&&_ton.length)?_ton:[{annee:mil,nb:nb}],
    statut:'elevage',fml_terminee:false,last_ouillage:null,last_analyse:null};
  if(!CAVE_ELEVAGE.cuvees) CAVE_ELEVAGE.cuvees=[];
  CAVE_ELEVAGE.cuvees.push(cuvee);
  c.decuvage={date:new Date().toISOString().slice(0,10),cuvee_id:cuvee.id};
  c.statut='termine';
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  if(window.fbSave){ window.fbSave('cave_vendange',CAVE_VENDANGE); window.fbSave('cave_elevage',CAVE_ELEVAGE); }
  _vendSheetClose();
  showToast(nom+' → Le Chai ('+nb+' barrique'+(nb>1?'s':'')+')'
    +((_ton&&_ton.length)?' · sorties du parc':''),'#3D6B27');
  renderVendCuves();
}

// —— Opérations sur cuve (chaptalisation, saignée, thermo, levurage, nutriment, SO₂, délestage) ——
var _VEND_OPS=[
  {k:'chaptalisation',lbl:'Chaptalisation'},
  {k:'saignee',lbl:'Saignée'},
  {k:'refroidissement',lbl:'Refroidir'},
  {k:'rechauffement',lbl:'Réchauffer'},
  {k:'levurage',lbl:'Levurage'},
  {k:'nutriment',lbl:'Nutriment'},
  {k:'so2',lbl:'SO₂'},
  {k:'delestage',lbl:'Délestage'}
];
var _vendOpType='chaptalisation', _vendOpCuveId=null;
function _vendOpLbl(k){ var o=_VEND_OPS.find(function(x){return x.k===k;}); return o?o.lbl:k; }
function openVendOp(cuveId){
  if(!canWrite()) return;
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===cuveId;});
  if(!c) return;
  _vendOpCuveId=cuveId; _vendOpType='chaptalisation';
  var chips=_VEND_OPS.map(function(o){
    return '<button class="mvv-optab'+(o.k===_vendOpType?' on':'')+'" onclick="_vendOpSet(\''+o.k+'\')">'+o.lbl+'</button>';
  }).join('');
  var html=''
    +'<div class="mvv-sheet-hd"><div class="mvv-sheet-t">Opération — '+_escHtml(c.nom)+'</div>'
    +'<button class="mv-gh mvv-sheet-x" onclick="_vendSheetClose()" title="Fermer" aria-label="Fermer">'+_mvIcon('croix',18)+'</button></div>'
    +'<div class="mvv-optabs">'+chips+'</div>'
    +'<label class="mvv-flbl">Date</label><input id="vop-date" class="mvv-tin" type="date" value="'+new Date().toISOString().slice(0,10)+'">'
    +'<div id="vop-fields"></div>'
    +'<label class="mvv-flbl">Note</label><input id="vop-note" class="mvv-tin" type="text" placeholder="Observation…">'
    +'<button class="mvv-save" style="margin-top:18px" onclick="saveVendOp()">Enregistrer l\'opération</button>';
  _vendSheet(html);
  _vendOpFields(c);
}
function _vendOpSet(k){
  _vendOpType=k;
  var tabs=document.querySelectorAll('#mvv-ov .mvv-optab');
  tabs.forEach(function(b,i){ if(_VEND_OPS[i]) b.classList.toggle('on',_VEND_OPS[i].k===k); });
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===_vendOpCuveId;});
  _vendOpFields(c);
}
function _vendOpFields(c){
  var el=document.getElementById('vop-fields'); if(!el||!c) return;
  var vol=c.volume_hl||0; var h='';
  if(_vendOpType==='chaptalisation'){
    var spd=_vendCfg().sucre_par_degre||16.83;
    h='<label class="mvv-flbl">Volume à chaptaliser (hL)</label><input id="vop-vol" class="mvv-tin" type="number" value="'+vol+'" min="0" step="0.1" oninput="_vendOpCalc()">'
      +'<label class="mvv-flbl">Enrichissement visé (° d\'alcool)</label><input id="vop-deg" class="mvv-tin" type="number" value="1" min="0" max="3" step="0.1" oninput="_vendOpCalc()">'
      +'<div class="mvv-bigcalc"><div class="mvv-bigcalc-n" id="vop-kg">—</div><div class="mvv-bigcalc-l">kg de sucre <span style="opacity:.6">· base '+spd+' g/L</span></div><div class="mvv-bigcalc-cum" id="vop-cum"></div></div>';
  } else if(_vendOpType==='saignee'){
    h='<label class="mvv-flbl">Volume saigné (hL)</label><input id="vop-vol" class="mvv-tin" type="number" value="0" min="0" max="'+vol+'" step="0.1">'
      +'<div class="mvv-fnote">Réduit le volume de la cuve (actuel : '+vol+' hL).</div>';
  } else if(_vendOpType==='refroidissement'||_vendOpType==='rechauffement'){
    h='<label class="mvv-flbl">Température cible (°C)</label><input id="vop-temp" class="mvv-tin" type="number" value="" min="0" max="45" step="0.5" placeholder="ex. 18">';
  } else if(_vendOpType==='levurage'){
    h='<label class="mvv-flbl">Souche / levain</label><input id="vop-souche" class="mvv-tin" type="text" placeholder="ex. indigènes, RC212…">'
      +'<label class="mvv-flbl">Dose (g/hL)</label><input id="vop-dose" class="mvv-tin" type="number" value="" min="0" step="1" placeholder="ex. 20">';
  } else if(_vendOpType==='nutriment'){
    h='<label class="mvv-flbl">Type (azote / nutriment)</label><input id="vop-ntype" class="mvv-tin" type="text" placeholder="ex. DAP, azote organique…">'
      +'<label class="mvv-flbl">Dose (g/hL)</label><input id="vop-dose" class="mvv-tin" type="number" value="" min="0" step="1" placeholder="ex. 30">';
  } else if(_vendOpType==='so2'){
    h='<label class="mvv-flbl">Dose SO₂ (g/hL)</label><input id="vop-dose" class="mvv-tin" type="number" value="" min="0" step="0.5" placeholder="ex. 3">';
  } else if(_vendOpType==='delestage'){
    h='<label class="mvv-flbl">Nombre de délestages</label><input id="vop-nb" class="mvv-tin" type="number" value="1" min="1" step="1">';
  }
  el.innerHTML=h;
  if(_vendOpType==='chaptalisation') _vendOpCalc();
}
function _vendOpCalc(){
  var vol=parseFloat((document.getElementById('vop-vol')||{}).value)||0;
  var deg=parseFloat((document.getElementById('vop-deg')||{}).value)||0;
  var spd=_vendCfg().sucre_par_degre||16.83;
  var kg=spd*deg*vol/10;
  var el=document.getElementById('vop-kg'); if(el) el.textContent=kg>0?kg.toFixed(1):'—';
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===_vendOpCuveId;});
  var prev=((c&&c.operations)||[]).filter(function(o){return o.type==='chaptalisation';}).reduce(function(s,o){return s+(o.kg_sucre||0);},0);
  var cu=document.getElementById('vop-cum');
  if(cu){
    if(prev>0){
      var tot=prev+kg;
      var degTot=vol>0?(tot/(spd*vol/10)):0;
      cu.innerHTML='Cumul cuve : <b>'+tot.toFixed(1)+' kg</b>'+(degTot>2?' <span style="color:#B0412C">— soit ~'+degTot.toFixed(1)+'° cumulés, surveiller le plafond réglementaire</span>':'');
    } else cu.innerHTML='';
  }
}
function saveVendOp(){
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===_vendOpCuveId;});
  if(!c) return;
  var date=(document.getElementById('vop-date')||{}).value||new Date().toISOString().slice(0,10);
  var note=((document.getElementById('vop-note')||{}).value||'').trim();
  var op={id:'vop_'+Date.now(),type:_vendOpType,date:date,note:note};
  if(_vendOpType==='chaptalisation'){
    op.volume_hl=parseFloat((document.getElementById('vop-vol')||{}).value)||0;
    op.degre=parseFloat((document.getElementById('vop-deg')||{}).value)||0;
    var spd=_vendCfg().sucre_par_degre||16.83;
    op.kg_sucre=spd*op.degre*op.volume_hl/10;
  } else if(_vendOpType==='saignee'){
    op.volume_hl=parseFloat((document.getElementById('vop-vol')||{}).value)||0;
    if(op.volume_hl>0) c.volume_hl=Math.max(0,(c.volume_hl||0)-op.volume_hl);
  } else if(_vendOpType==='refroidissement'||_vendOpType==='rechauffement'){
    op.temp_c=parseFloat((document.getElementById('vop-temp')||{}).value)||null;
  } else if(_vendOpType==='levurage'){
    op.souche=((document.getElementById('vop-souche')||{}).value||'').trim();
    op.dose=parseFloat((document.getElementById('vop-dose')||{}).value)||null;
  } else if(_vendOpType==='nutriment'){
    op.ntype=((document.getElementById('vop-ntype')||{}).value||'').trim();
    op.dose=parseFloat((document.getElementById('vop-dose')||{}).value)||null;
  } else if(_vendOpType==='so2'){
    op.dose=parseFloat((document.getElementById('vop-dose')||{}).value)||null;
  } else if(_vendOpType==='delestage'){
    op.nb=parseInt((document.getElementById('vop-nb')||{}).value)||1;
  }
  if(!c.operations) c.operations=[];
  c.operations.push(op);
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  if(window.fbSave) window.fbSave('cave_vendange',CAVE_VENDANGE);
  _vendSheetClose();
  showToast(_vendOpLbl(_vendOpType)+' enregistrée','#3D6B27');
  renderVendCuves();
}
function _vendOpsSummary(c){
  var ops=((c&&c.operations)||[]).slice().sort(function(a,b){return a.date>b.date?-1:1;});
  if(!ops.length) return '';
  var last=ops[0], extra='';
  if(last.type==='chaptalisation') extra=' · '+(last.kg_sucre||0).toFixed(1)+' kg';
  else if(last.type==='saignee') extra=' · '+(last.volume_hl||0)+' hL';
  else if(last.type==='delestage') extra=' · '+(last.nb||1)+'×';
  else if(last.temp_c!=null) extra=' · '+last.temp_c+'°C';
  else if(last.dose!=null) extra=' · '+last.dose+' g/hL';
  return '<div class="mvv-opslist">'+_vendOpLbl(last.type)+' <span class="u">'+_vendFrDate(last.date)+extra+'</span>'
    +(ops.length>1?' <span class="u">· +'+(ops.length-1)+' autre'+(ops.length>2?'s':'')+'</span>':'')+'</div>';
}
function _vendActRow(c){
  return '<div class="mvv-actrow">'
    +'<button class="mvv-act2" onclick="openVendOp(\''+c.id+'\')">Opération</button>'
    +'<button class="mvv-act2 dec" onclick="openVendDecuvage(\''+c.id+'\')">Décuver</button></div>';
}
function _vendDecuveesSection(list){
  if(!list.length) return '';
  var rows=list.slice().sort(function(a,b){var da=(a.decuvage||{}).date||'',db=(b.decuvage||{}).date||'';return da>db?-1:1;}).map(function(c){
    var d=c.decuvage||{};
    return '<div class="mvv-decrow"><span>'+_escHtml(c.nom)+'</span><span class="u">'+(d.date?_vendFrDate(d.date):'')+' · '+(c.volume_hl||0)+' hL → Le Chai</span></div>';
  }).join('');
  return '<details class="mvv-decwrap"><summary class="mvv-decsum">Décuvées ('+list.length+')</summary>'+rows+'</details>';
}

// —— Gestionnaire de clients vrac ——
var _vendClientEdit=null;
function openVendClients(){
  var cls=_vendClients();
  var totBy={}; (CAVE_VENDANGE.recoltes||[]).forEach(function(r){ if(r.client){ totBy[r.client]=(totBy[r.client]||0)+_recKg(r); } });
  var rows=cls.length?cls.map(function(c,i){
    var tot=totBy[c.nom]||0;
    return '<div class="mvv-clrow"><div style="flex:1;min-width:0"><div class="mvv-clrow-nm">'+_escHtml(c.nom)+'</div>'
      +'<div class="mvv-clrow-mt">'+(c.poids_caisse_kg||25)+' kg/caisse'+(tot>0?' · '+tot.toLocaleString('fr-FR')+' kg livrés':'')+'</div></div>'
      +'<div class="mvv-clrow-r"><button class="mv-gh mvv-icbtn" onclick="openVendClient('+i+')" title="Modifier" aria-label="Modifier">'+_mvIcon('crayon',18)+'</button>'
      +'<button class="mv-gh mv-gh-rouge mvv-icbtn" onclick="deleteVendClient('+i+')" title="Supprimer" aria-label="Supprimer">'+_mvIcon('corbeille',18)+'</button></div></div>';
  }).join(''):'<div class="mvv-fnote">Aucun client vrac. Ajoutez-en un pour tracer les ventes de raisin en vrac et leur poids par caisse.</div>';
  var html=''
    +'<div class="mvv-sheet-hd"><div class="mvv-sheet-t">Clients vrac</div>'
    +'<button class="mv-gh mvv-sheet-x" onclick="_vendSheetClose()" title="Fermer" aria-label="Fermer">'+_mvIcon('croix',18)+'</button></div>'
    +'<div class="mvv-sheet-sub">Référentiel propre à la vendange. Le poids par caisse de chaque client sert à convertir les caisses vendues en kilos.</div>'
    +'<div class="mvv-cllist">'+rows+'</div>'
    +'<button class="mvv-save ghost2" style="margin-top:14px" onclick="openVendClient(-1)">＋ Ajouter un client</button>';
  _vendSheet(html);
}
function openVendClient(i){
  _vendClientEdit=i;
  var cls=_vendClients(); var c=(i>=0)?cls[i]:null;
  var html=''
    +'<div class="mvv-sheet-hd"><div class="mvv-sheet-t">'+(c?'Modifier le client':'Nouveau client')+'</div>'
    +'<button class="mv-gh mvv-sheet-x" onclick="openVendClients()" title="Fermer" aria-label="Fermer">'+_mvIcon('croix',18)+'</button></div>'
    +'<label class="mvv-flbl">Nom du client</label><input id="vcl-nom" class="mvv-tin" type="text" value="'+_escHtml(c?c.nom:'')+'" placeholder="ex. Maison Bouchard">'
    +'<label class="mvv-flbl">Poids par caisse (kg)</label><input id="vcl-pck" class="mvv-tin" type="number" value="'+(c?(c.poids_caisse_kg||25):25)+'" min="10" max="60">'
    +'<button class="mvv-save" style="margin-top:18px" onclick="saveVendClient()">Enregistrer</button>'
    +(c?'<button class="mvv-del" onclick="deleteVendClient('+i+')">Supprimer ce client</button>':'');
  _vendSheet(html);
}
function saveVendClient(){
  var nom=((document.getElementById('vcl-nom')||{}).value||'').trim();
  if(!nom){ showToast('Saisissez un nom','#E07060'); return; }
  var pck=parseFloat((document.getElementById('vcl-pck')||{}).value)||25;
  var cls=_vendClients();
  if(_vendClientEdit!=null&&_vendClientEdit>=0&&cls[_vendClientEdit]){
    var old=cls[_vendClientEdit].nom;
    if(old!==nom&&cls.some(function(x,j){return j!==_vendClientEdit&&x.nom===nom;})){ showToast('Ce client existe déjà','#E07060'); return; }
    cls[_vendClientEdit]={nom:nom,poids_caisse_kg:pck};
    if(old&&old!==nom){ (CAVE_VENDANGE.recoltes||[]).forEach(function(r){ if(r.client===old) r.client=nom; }); }
  } else {
    if(cls.some(function(x){return x.nom===nom;})){ showToast('Ce client existe déjà','#E07060'); return; }
    cls.push({nom:nom,poids_caisse_kg:pck});
  }
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  if(window.fbSave) window.fbSave('cave_vendange',CAVE_VENDANGE);
  showToast('Client enregistré','#3D6B27');
  openVendClients();
}
function deleteVendClient(i){
  var cls=_vendClients(); var c=cls[i]; if(!c) return;
  var nm=c.nom;
  _vendSheetClose();
  window.openConfirmDel('Supprimer le client « '+nm+' » ?','Les récoltes liées repasseront en vrac générique.',function(){
    var arr=_vendClients();
    var idx=arr.findIndex(function(x){return x.nom===nm;});
    if(idx===-1){ openVendClients(); return; }
    (CAVE_VENDANGE.recoltes||[]).forEach(function(r){ if(r.client===nm) r.client=''; });
    arr.splice(idx,1);
    window.CAVE_VENDANGE=CAVE_VENDANGE;
    if(window.fbSave) window.fbSave('cave_vendange',CAVE_VENDANGE);
    showToast('Client supprimé','#B85A1A');
    openVendClients();
  });
}

// —— Exports fenêtre (Vendange v2) ——
window._vendSheetClose      = _vendSheetClose;
window.openVendDecuvage     = openVendDecuvage;
window._vendDecAdj          = _vendDecAdj;
window.saveVendDecuvage     = saveVendDecuvage;
window.openVendOp           = openVendOp;
window._vendOpSet           = _vendOpSet;
window._vendOpCalc          = _vendOpCalc;
window.saveVendOp           = saveVendOp;
window.openVendClients      = openVendClients;
window.openVendClient       = openVendClient;
window.saveVendClient       = saveVendClient;
window.deleteVendClient     = deleteVendClient;

// ═══════════════════════════════════════════════════════════════════════════
// VENDANGE v2.1 — parcelle en liste · cuvée · liaison Récolte→Cuve · PDF récoltes
// (cave.js seul — champs injectés dans les overlays existants)
// ═══════════════════════════════════════════════════════════════════════════

// —— Noms des parcelles enregistrées (window.PARCELLES) ——
function _vendParcelleNames(){
  var ps=window.PARCELLES||[];
  var names=ps.map(function(p){return (p&&p.nom||'').trim();}).filter(Boolean);
  return Array.from(new Set(names)).sort(function(a,b){return a.localeCompare(b,'fr');});
}

// —— Transforme #vrec-parcelle en menu déroulant des parcelles ——
function _vendInjectParcelleSelect(cur){
  var el=document.getElementById('vrec-parcelle'); if(!el) return;
  var names=_vendParcelleNames();
  if(!names.length){ el.value=cur||''; return; }              // aucune parcelle → saisie libre
  if(cur&&names.indexOf(cur)===-1) names=[cur].concat(names);  // préserve une valeur hors liste
  var opts='<option value="">— Choisir une parcelle —</option>'
    +names.map(function(n){return '<option value="'+_escHtml(n)+'"'+(n===cur?' selected':'')+'>'+_escHtml(n)+'</option>';}).join('');
  if(el.tagName==='SELECT'){ el.innerHTML=opts; el.value=cur||''; return; }
  var sel=document.createElement('select');
  sel.id='vrec-parcelle';
  if(el.className) sel.className=el.className;
  sel.setAttribute('style', el.getAttribute('style')||'width:100%');
  sel.innerHTML=opts;
  el.parentNode.replaceChild(sel,el);
  sel.value=cur||'';
}

// ══════ REGISTRE DES CUVÉES DE VENDANGE (anti-doublon) ══════
// Modèle : CAVE_VENDANGE.cuvees = [{id:'vcv_…', nom, millesime}]
//          récolte.vcuvee_id  → clé réelle ; récolte.cuvee → miroir (PDF/export/legacy)
// ⚠️ vcuvee_id ≠ cuvee_id : ce dernier désigne une cuvée d'ÉLEVAGE (op.cuvee_id, decuvage.cuvee_id).
var _vcuvSel = {mode:'pick', id:null, nom:'', dup:null, force:false, cuveIdx:0, vol:null};
var _vcuvIdx = {cur:[], old:[], cuves:[]};
var _vrecDateHooked = false;

function _cuvKey(s){
  return String(s==null?'':s).trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}
function _cuvLev(a,b){
  if(a===b) return 0;
  var m=a.length,n=b.length; if(!m) return n; if(!n) return m;
  var prev=[],cur=[],i,j;
  for(j=0;j<=n;j++) prev[j]=j;
  for(i=1;i<=m;i++){
    cur[0]=i;
    for(j=1;j<=n;j++) cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a.charAt(i-1)===b.charAt(j-1)?0:1));
    prev=cur.slice();
  }
  return prev[n];
}
// Millésime = ANNÉE CIVILE de la date de récolte (convention vin, cf. rendement_hist)
function _vendMillOfDate(d){
  var y=parseInt(String(d||'').slice(0,4),10);
  return y>1900?y:(new Date()).getFullYear();
}
function _vendCuvById(id){
  if(!id) return null;
  return (CAVE_VENDANGE.cuvees||[]).find(function(c){return c&&c.id===id;})||null;
}
// Reconstruction déterministe : migre les récoltes legacy (cuvee texte, sans vcuvee_id)
// et élague les cuvées orphelines. EN MÉMOIRE — aucune écriture Firestore spontanée.
function _vendCuvSync(){
  if(!CAVE_VENDANGE.cuvees) CAVE_VENDANGE.cuvees=[];
  var reg=CAVE_VENDANGE.cuvees, recs=CAVE_VENDANGE.recoltes||[], chg=false;
  var byKey={};
  reg.forEach(function(c){ if(c&&c.id) byKey[_cuvKey(c.nom)+'|'+c.millesime]=c; });
  recs.forEach(function(r){
    if(!r||r.vendu) return;
    var nom=(r.cuvee||'').trim(); if(!nom) return;
    var mil=_vendMillOfDate(r.date), k=_cuvKey(nom)+'|'+mil;
    var c=r.vcuvee_id?_vendCuvById(r.vcuvee_id):null;
    if(!c){
      c=byKey[k];
      if(!c){
        c={id:'vcv_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),nom:nom,millesime:mil};
        reg.push(c); byKey[k]=c; chg=true;
      }
      r.vcuvee_id=c.id; chg=true;
    }
    if(r.cuvee!==c.nom){ r.cuvee=c.nom; chg=true; }
  });
  var used={};
  recs.forEach(function(r){ if(r&&r.vcuvee_id) used[r.vcuvee_id]=1; });
  (CAVE_VENDANGE.cuves_vinif||[]).forEach(function(c){ if(c&&c.vcuvee_id) used[c.vcuvee_id]=1; });
  var keep=reg.filter(function(c){ return c&&c.id&&used[c.id]; });
  if(keep.length!==reg.length){ CAVE_VENDANGE.cuvees=keep; chg=true; }
  return chg;
}
function _vendCuvList(mill){
  _vendCuvSync();
  return (CAVE_VENDANGE.cuvees||[]).filter(function(c){return c&&c.millesime===mill;})
    .sort(function(a,b){return String(a.nom).localeCompare(String(b.nom),'fr');});
}
// Noms des millésimes antérieurs, non encore repris cette année
function _vendCuvPast(mill){
  _vendCuvSync();
  var pris={}, vus={}, out=[];
  (CAVE_VENDANGE.cuvees||[]).forEach(function(c){ if(c&&c.millesime===mill) pris[_cuvKey(c.nom)]=1; });
  (CAVE_VENDANGE.cuvees||[]).filter(function(c){return c&&c.millesime<mill;})
    .sort(function(a,b){return (b.millesime-a.millesime)||String(a.nom).localeCompare(String(b.nom),'fr');})
    .forEach(function(c){
      var k=_cuvKey(c.nom); if(!k||pris[k]||vus[k]) return; vus[k]=1; out.push(c);
    });
  return out;
}
// Voisin le plus proche dans le millésime — seuil proportionnel à la longueur
function _vendCuvNear(nom,mill){
  var k=_cuvKey(nom); if(k.length<3) return null;
  var best=null;
  _vendCuvList(mill).forEach(function(c){
    var ck=_cuvKey(c.nom), d;
    if(ck===k) d=0;
    else if(ck.indexOf(k)===0||k.indexOf(ck)===0) d=1;
    else d=_cuvLev(ck,k);
    var seuil=Math.max(1,Math.floor(Math.min(ck.length,k.length)/6));
    if(d<=seuil&&(!best||d<best.d)) best={cuvee:c,d:d};
  });
  return best;
}
function _vendCuvEnsure(nom,mill){
  nom=String(nom||'').trim(); if(!nom) return null;
  if(!CAVE_VENDANGE.cuvees) CAVE_VENDANGE.cuvees=[];
  var k=_cuvKey(nom);
  var ex=(CAVE_VENDANGE.cuvees||[]).find(function(c){return c&&c.millesime===mill&&_cuvKey(c.nom)===k;});
  if(ex) return ex;
  var c={id:'vcv_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),nom:nom,millesime:mill};
  CAVE_VENDANGE.cuvees.push(c);
  return c;
}
function _vendCuvStats(id){
  var rs=(CAVE_VENDANGE.recoltes||[]).filter(function(r){return r&&!r.vendu&&r.vcuvee_id===id;});
  var parc=[];
  rs.forEach(function(r){ var n=(r.parcelle||'').trim(); if(n&&parc.indexOf(n)===-1) parc.push(n); });
  var cids={};
  rs.forEach(function(r){ if(r.cuve_id) cids[r.cuve_id]=1; });
  var cuves=(CAVE_VENDANGE.cuves_vinif||[]).filter(function(c){return c&&(c.vcuvee_id===id||cids[c.id]);});
  return {n:rs.length,caisses:rs.reduce(function(s,r){return s+(r.nb_caisses||0);},0),parcelles:parc,cuves:cuves};
}
function _vendCuvHl(caisses){
  var cfg=_vendCfg();
  var ratio=_mlKgHl();
  return (caisses||0)*(cfg.poids_caisse_kg||25)/(ratio||135);
}
function _vendCuvF1(n){ return (Math.round((n||0)*10)/10).toString().replace('.',','); }

// —— Champs de destination : cuvée (vinifié) vs client (vrac) ——
function _vendCuvInjectCss(){
  if(document.getElementById('mvv-cuvsel-css')) return;
  var s=document.createElement('style'); s.id='mvv-cuvsel-css';
  s.textContent=[
".mvcs-list{display:flex;flex-direction:column;gap:6px}",
".mvcs-sep{font-size:9.5px;letter-spacing:1.4px;text-transform:uppercase;color:var(--texte-doux);font-weight:700;margin:11px 2px 3px;display:flex;align-items:center;gap:8px}",
".mvcs-sep::after{content:'';flex:1;height:1px;background:var(--gris-clair)}",
".mvcs-row{display:flex;align-items:center;gap:11px;width:100%;min-height:56px;padding:9px 12px;border-radius:12px;border:1.5px solid var(--gris-clair);background:var(--bg-card);font-family:inherit;text-align:left;cursor:pointer;transition:border-color .15s,background .15s}",
".mvcs-row:hover{border-color:rgba(192,132,90,.45);background:rgba(192,132,90,.05)}",
".mvcs-row:focus-visible{outline:2px solid #8A5A38;outline-offset:2px}",
".mvcs-row.on{border-color:#8A5A38;background:rgba(138,90,56,.10);box-shadow:0 0 0 3px rgba(138,90,56,.10)}",
".mvcs-ico{width:34px;height:34px;flex-shrink:0;border-radius:9px;background:var(--terre-pale);display:flex;align-items:center;justify-content:center;font-size:16px}",
".mvcs-row.on .mvcs-ico{background:rgba(138,90,56,.20)}",
".mvcs-mid{flex:1;min-width:0}",
".mvcs-nom{display:block;font-size:14px;font-weight:600;color:var(--texte);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
".mvcs-sub{display:block;font-size:11px;color:var(--texte-doux);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
".mvcs-tag{flex-shrink:0;max-width:38%;font-size:10px;font-weight:700;padding:3px 8px;border-radius:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
".mvcs-tag.wait{background:var(--or-pale);color:#7A6320}",
".mvcs-tag.cuve{background:var(--vert-pale);color:#2D5016}",
".mvcs-tag.past{background:var(--gris-clair);color:var(--texte-doux)}",
".mvcs-row.new{border-style:dashed;border-color:rgba(138,90,56,.5);background:rgba(138,90,56,.04)}",
".mvcs-row.new .mvcs-ico{background:rgba(138,90,56,.14);color:#7A4A28;font-weight:700}",
".mvcs-row.new .mvcs-nom{color:#7A4A28}",
".mvcs-box{border:1.5px solid rgba(138,90,56,.5);border-radius:12px;padding:12px;background:rgba(138,90,56,.05)}",
".mvcs-act{display:flex;gap:7px;margin-top:9px}",
".mvcs-b{flex:1;min-height:44px;padding:10px 12px;border-radius:10px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;border:1px solid transparent}",
".mvcs-b:focus-visible{outline:2px solid #8A5A38;outline-offset:2px}",
".mvcs-b.p{background:#8A5A38;color:#FFF6EA;font-weight:700}",
".mvcs-b.p:disabled{opacity:.45;cursor:not-allowed}",
".mvcs-b.s{background:var(--bg-card);border-color:var(--gris);color:var(--texte-med)}",
".mvcs-dup{margin-top:10px;border-radius:11px;padding:11px 12px;position:relative;overflow:hidden;background:var(--orange-pale);border:1px solid rgba(184,90,26,.35)}",
".mvcs-dup::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--orange)}",
".mvcs-dup-t{font-size:12.5px;font-weight:700;color:#8A4212;display:flex;gap:6px;align-items:flex-start}",
".mvcs-dup-d{font-size:11.5px;color:#8A4212;opacity:.9;margin-top:3px;line-height:1.4}",
".mvcs-dup-a{display:flex;gap:7px;margin-top:10px;flex-wrap:wrap}",
".mvcs-dup-a .mvcs-b{min-width:132px}",
".mvcs-b.j{background:#B85A1A;color:#FFF6EA;font-weight:700}",
".mvcs-b.k{background:transparent;border-color:rgba(184,90,26,.45);color:#8A4212}",
".mvcs-att{margin-top:12px;border-radius:13px;overflow:hidden;border:1px solid rgba(61,107,39,.3);background:var(--vert-pale)}",
".mvcs-att-h{padding:10px 13px;background:rgba(61,107,39,.10);font-size:12.5px;font-weight:700;color:#2D5016;display:flex;align-items:center;gap:7px}",
".mvcs-att-b{padding:11px 13px 13px}",
".mvcs-opt{display:flex;align-items:flex-start;gap:10px;padding:10px 11px;border-radius:11px;border:1.5px solid rgba(61,107,39,.22);background:var(--bg-card);cursor:pointer;margin-bottom:7px;min-height:44px}",
".mvcs-opt:last-child{margin-bottom:0}",
".mvcs-opt.on{border-color:#3D6B27;box-shadow:0 0 0 3px rgba(61,107,39,.10)}",
".mvcs-opt input{margin:3px 0 0;accent-color:#3D6B27;width:17px;height:17px;flex-shrink:0}",
".mvcs-opt-t{display:block;font-size:13px;font-weight:600;color:var(--texte)}",
".mvcs-opt-s{display:block;font-size:11px;color:var(--texte-doux);margin-top:2px;line-height:1.35}",
".mvcs-vol{display:flex;align-items:center;gap:8px;margin-top:9px;padding-top:9px;border-top:1px dashed rgba(61,107,39,.25)}",
".mvcs-vol label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#2D5016;flex:1}",
".mvcs-vol input{width:86px;text-align:center;background:var(--bg-card);border:2px solid rgba(61,107,39,.25);border-radius:9px;padding:9px;font-family:inherit;font-size:14px;font-weight:700;color:var(--texte);outline:none}",
".mvcs-vol input:focus{border-color:#3D6B27;box-shadow:0 0 0 3px rgba(61,107,39,.14)}",
".mvcs-vol span{font-size:12px;font-weight:600;color:#2D5016}",
".mvcs-hint{font-size:10.5px;color:#2D5016;opacity:.8;margin-top:6px;line-height:1.4}",
".mvcs-empty{font-size:12px;color:var(--texte-doux);padding:2px 2px 6px;line-height:1.45}"
].join('\n');
  document.head.appendChild(s);
}

// —— Champ « cuvée de destination » : sélecteur, plus jamais de saisie libre répétée ——
function _vendCuvMill(){
  var d=(document.getElementById('vrec-date')||{}).value||'';
  return _vendMillOfDate(d);
}
function _vendCuvRowHtml(c,on,tag,tagCls,sub,ico,fn,i){
  return '<button type="button" class="mvcs-row'+(on?' on':'')+'" role="radio" aria-checked="'+(on?'true':'false')+'"'
    +' onclick="'+fn+'('+i+')">'
    +'<span class="mvcs-ico">'+ico+'</span>'
    +'<span class="mvcs-mid"><span class="mvcs-nom">'+_escHtml(c.nom)+'</span>'
    +'<span class="mvcs-sub">'+sub+'</span></span>'
    +(tag?'<span class="mvcs-tag '+tagCls+'">'+_escHtml(tag)+'</span>':'')+'</button>';
}
function _vendCuvRender(){
  var box=document.getElementById('vrec-cuv-box'); if(!box) return;
  var mill=_vendCuvMill();
  var caisses=parseInt((document.getElementById('vrec-caisses')||{}).value)||0;
  var h='';
  if(_vcuvSel.mode==='new'){
    h='<div class="mvcs-box"><input id="vrec-cuv-new" type="text" class="fi" autocomplete="off"'
      +' placeholder="ex. Gevrey Villages, Charmes 1er Cru…" oninput="_vendCuvInput(this.value)">';
    if(_vcuvSel.dup&&!_vcuvSel.force){
      var dc=_vcuvSel.dup.cuvee, st=_vendCuvStats(dc.id);
      h+='<div class="mvcs-dup"><div class="mvcs-dup-t"><span>&#9888;&#65039;</span><span>'
        +(_vcuvSel.dup.d===0?'Ce nom existe d\u00e9j\u00e0':'Un nom tr\u00e8s proche existe d\u00e9j\u00e0')+' pour '+mill+'</span></div>'
        +'<div class="mvcs-dup-d"><b>'+_escHtml(dc.nom)+'</b>'
        +(st.parcelles.length?' \u2014 '+st.parcelles.length+' parcelle'+(st.parcelles.length>1?'s':'')+' d\u00e9j\u00e0 rentr\u00e9e'+(st.parcelles.length>1?'s':'')+' ('+_escHtml(st.parcelles.join(', '))+').':'.')
        +'<br>Cr\u00e9er un second nom couperait la cuv\u00e9e en deux.</div>'
        +'<div class="mvcs-dup-a">'
        +'<button type="button" class="mvcs-b j" onclick="_vendCuvJoinDup()">Rejoindre '+_escHtml(dc.nom)+'</button>'
        +'<button type="button" class="mvcs-b k" onclick="_vendCuvForce()">Cr\u00e9er quand m\u00eame</button></div></div>';
    }
    h+='<div class="mvcs-act"><button type="button" class="mvcs-b s" onclick="_vendCuvCancel()">Annuler</button>'
      +'<button type="button" class="mvcs-b p" onclick="_vendCuvKeep()"'
      +((!_vcuvSel.nom.trim()||(_vcuvSel.dup&&!_vcuvSel.force))?' disabled':'')+'>Utiliser ce nom</button></div></div>';
    box.innerHTML=h;
    var inp=document.getElementById('vrec-cuv-new');
    if(inp){ inp.value=_vcuvSel.nom; try{inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);}catch(e){} }
    _vendCuvAtt(); return;
  }
  var cur=_vendCuvList(mill); _vcuvIdx.cur=cur;
  h+='<div class="mvcs-list" role="radiogroup" aria-label="Cuv\u00e9e de destination">';
  if(cur.length){
    cur.forEach(function(c,i){
      var st=_vendCuvStats(c.id);
      var sub=(st.parcelles.length?st.parcelles.length+' parcelle'+(st.parcelles.length>1?'s':'')+' \u00b7 ':'')
        +st.caisses+' caisses \u00b7 '+_vendCuvF1(_vendCuvHl(st.caisses))+' hL';
      var tag,cls;
      if(st.cuves.length>1){ tag=st.cuves.length+' cuves'; cls='cuve'; }
      else if(st.cuves.length===1){ tag=st.cuves[0].nom||'en cuve'; cls='cuve'; }
      else { tag='sans cuve'; cls='wait'; }
      h+=_vendCuvRowHtml(c,_vcuvSel.id===c.id,tag,cls,sub,'\uD83E\uDED9','_vendCuvPick',i);
    });
  } else {
    h+='<div class="mvcs-empty">Aucune cuv\u00e9e ouverte pour '+mill+'. Cr\u00e9ez la premi\u00e8re ci-dessous.</div>';
  }
  h+='</div>';
  var old=_vendCuvPast(mill); _vcuvIdx.old=old;
  if(old.length){
    h+='<div class="mvcs-sep">Mill\u00e9simes pr\u00e9c\u00e9dents</div><div class="mvcs-list">';
    old.forEach(function(c,i){
      h+=_vendCuvRowHtml(c,false,String(c.millesime),'past','Reprendre ce nom pour '+mill,'\u21ba','_vendCuvReuse',i);
    });
    h+='</div>';
  }
  h+='<div class="mvcs-list" style="margin-top:10px">'
    +'<button type="button" class="mvcs-row new" onclick="_vendCuvNew()">'
    +'<span class="mvcs-ico">\uFF0B</span>'
    +'<span class="mvcs-mid"><span class="mvcs-nom">Nouvelle cuv\u00e9e\u2026</span>'
    +'<span class="mvcs-sub">Un nom qui n\u2019existe pas encore</span></span></button></div>';
  box.innerHTML=h;
  var hid=document.getElementById('vrec-cuvee');
  var sc=_vcuvSel.id?_vendCuvById(_vcuvSel.id):null;
  if(hid) hid.value=sc?sc.nom:'';
  _vendCuvAtt(caisses);
}
// Panneau de rattachement : compléter une cuve existante ou en créer une de plus
function _vendCuvAtt(caisses){
  var z=document.getElementById('vrec-cuv-att'); if(!z) return;
  z.innerHTML='';
  if(_vcuvSel.mode!=='pick'||!_vcuvSel.id) return;
  var st=_vendCuvStats(_vcuvSel.id); _vcuvIdx.cuves=st.cuves;
  if(!st.cuves.length) return;
  if(caisses==null) caisses=parseInt((document.getElementById('vrec-caisses')||{}).value)||0;
  var add=_vendCuvHl(caisses);
  var idx=_vcuvSel.cuveIdx; if(idx>=st.cuves.length) idx=st.cuves.length-1;
  var h='<div class="mvcs-att"><div class="mvcs-att-h"><span>\u2697\uFE0F</span><span>Cette cuv\u00e9e a d\u00e9j\u00e0 '
    +(st.cuves.length>1?'des cuves':'une cuve')+'</span></div><div class="mvcs-att-b">';
  st.cuves.forEach(function(cv,i){
    var on=idx===i;
    h+='<label class="mvcs-opt'+(on?' on':'')+'"><input type="radio" name="vrec-att" '+(on?'checked':'')+' onchange="_vendCuvSetCuve('+i+')">'
      +'<span><span class="mvcs-opt-t">Compl\u00e9ter \u00ab\u00a0'+_escHtml(cv.nom||'cuve')+'\u00a0\u00bb</span>'
      +'<span class="mvcs-opt-s">'+_vendCuvF1(cv.volume_hl||0)+' hL en place'
      +(cv.statut?' \u00b7 '+_escHtml(String(cv.statut).toUpperCase()):'')+'</span></span></label>';
  });
  var onNew=idx<0;
  h+='<label class="mvcs-opt'+(onNew?' on':'')+'"><input type="radio" name="vrec-att" '+(onNew?'checked':'')+' onchange="_vendCuvSetCuve(-1)">'
    +'<span><span class="mvcs-opt-t">Cr\u00e9er une '+(st.cuves.length+1)+'\u1d49 cuve pour cette cuv\u00e9e</span>'
    +'<span class="mvcs-opt-s">M\u00eame cuv\u00e9e, cuve s\u00e9par\u00e9e \u2014 le nom reste unique</span></span></label>';
  if(idx>=0){
    var cv=st.cuves[idx];
    var prop=Math.round(((cv.volume_hl||0)+add)*10)/10;
    if(_vcuvSel.vol==null) _vcuvSel.vol=prop;
    h+='<div class="mvcs-vol"><label for="vrec-cuv-vol">Volume de la cuve</label>'
      +'<input id="vrec-cuv-vol" type="number" step="0.1" min="0" value="'+(_vcuvSel.vol)+'" onchange="_vendCuvVol(this.value)">'
      +'<span>hL</span></div>'
      +'<div class="mvcs-hint">Propos\u00e9 : '+_vendCuvF1(cv.volume_hl||0)+' + '+_vendCuvF1(add)+' estim\u00e9s = '+_vendCuvF1(prop)
      +' hL. Modifiable \u2014 c\u2019est le volume r\u00e9el de la cuve qui fait foi.</div>';
  }
  h+='</div></div>';
  z.innerHTML=h;
}
function _vendCuvPick(i){
  var c=_vcuvIdx.cur[i]; if(!c) return;
  _vcuvSel.mode='pick'; _vcuvSel.id=c.id; _vcuvSel.nom=''; _vcuvSel.dup=null; _vcuvSel.force=false;
  _vcuvSel.cuveIdx=0; _vcuvSel.vol=null; _vcuvSel.volTouched=false;
  _vendCuvRender();
}
function _vendCuvReuse(i){
  var c=_vcuvIdx.old[i]; if(!c) return;
  _vcuvSel.mode='new'; _vcuvSel.id=null; _vcuvSel.nom=c.nom; _vcuvSel.force=false;
  _vcuvSel.dup=_vendCuvNear(c.nom,_vendCuvMill());
  _vcuvSel.cuveIdx=0; _vcuvSel.vol=null;
  _vendCuvRender();
}
function _vendCuvNew(){
  _vcuvSel.mode='new'; _vcuvSel.id=null; _vcuvSel.nom=''; _vcuvSel.dup=null; _vcuvSel.force=false;
  _vcuvSel.cuveIdx=0; _vcuvSel.vol=null;
  _vendCuvRender();
}
function _vendCuvCancel(){
  _vcuvSel.mode='pick'; _vcuvSel.nom=''; _vcuvSel.dup=null; _vcuvSel.force=false;
  _vendCuvRender();
}
function _vendCuvInput(v){
  _vcuvSel.nom=v; _vcuvSel.force=false;
  var was=_vcuvSel.dup?_vcuvSel.dup.cuvee.id+'/'+_vcuvSel.dup.d:'';
  _vcuvSel.dup=_vendCuvNear(v,_vendCuvMill());
  var now=_vcuvSel.dup?_vcuvSel.dup.cuvee.id+'/'+_vcuvSel.dup.d:'';
  var btn=document.getElementById('vrec-cuv-new');
  if(was===now){
    var b=document.querySelector('#vrec-cuv-box .mvcs-b.p');
    if(b) b.disabled=(!v.trim()||(_vcuvSel.dup&&!_vcuvSel.force));
    return;                       // pas de re-render : la saisie n’est jamais interrompue
  }
  var pos=btn?btn.selectionStart:null;
  _vendCuvRender();
  var n=document.getElementById('vrec-cuv-new');
  if(n&&pos!=null){ try{n.setSelectionRange(pos,pos);}catch(e){} }
}
function _vendCuvForce(){ _vcuvSel.force=true; _vendCuvRender(); }
function _vendCuvJoinDup(){
  if(!_vcuvSel.dup) return;
  var id=_vcuvSel.dup.cuvee.id;
  _vcuvSel.mode='pick'; _vcuvSel.id=id; _vcuvSel.nom=''; _vcuvSel.dup=null; _vcuvSel.force=false;
  _vcuvSel.cuveIdx=0; _vcuvSel.vol=null;
  _vendCuvRender();
}
function _vendCuvKeep(){
  var nom=(_vcuvSel.nom||'').trim(); if(!nom) return;
  _vcuvSel.mode='pick'; _vcuvSel.id=null; _vcuvSel.nom=nom; _vcuvSel.cuveIdx=0; _vcuvSel.vol=null;
  var box=document.getElementById('vrec-cuv-box');
  if(box){
    box.innerHTML='<div class="mvcs-list"><button type="button" class="mvcs-row on" onclick="_vendCuvNew()">'
      +'<span class="mvcs-ico">\uD83E\uDED9</span><span class="mvcs-mid">'
      +'<span class="mvcs-nom">'+_escHtml(nom)+'</span>'
      +'<span class="mvcs-sub">Nouvelle cuv\u00e9e \u2014 cr\u00e9\u00e9e \u00e0 l\u2019enregistrement</span></span>'
      +'<span class="mvcs-tag wait">nouvelle</span></button></div>';
  }
  var hid=document.getElementById('vrec-cuvee'); if(hid) hid.value=nom;
  _vendCuvAtt();
}
function _vendCuvSetCuve(i){ _vcuvSel.cuveIdx=i; _vcuvSel.vol=null; _vcuvSel.volTouched=false; _vendCuvAtt(); }
function _vendCuvVol(v){
  var n=parseFloat(String(v).replace(',','.'));
  if(isFinite(n)&&n>=0){ _vcuvSel.vol=n; _vcuvSel.volTouched=true; }
}

function _vendInjectDestFields(rec){
  _vendCuvInjectCss();
  var anchor=document.getElementById('vrec-vinif-section');
  if(anchor&&anchor.parentNode){
    var crow=document.getElementById('vrec-cuvee-row');
    if(!crow){
      crow=document.createElement('div'); crow.id='vrec-cuvee-row'; crow.style.marginBottom='12px';
      crow.innerHTML='<div class="fl" style="margin-top:0">Cuv\u00e9e de destination</div>'
        +'<div id="vrec-cuv-box"></div><div id="vrec-cuv-att"></div>'
        +'<input type="hidden" id="vrec-cuvee">';
      anchor.parentNode.insertBefore(crow,anchor);
    }
  }
  _vendCuvSync();
  var mill=_vendMillOfDate(rec?rec.date:((document.getElementById('vrec-date')||{}).value||''));
  var cur=rec&&rec.vcuvee_id?_vendCuvById(rec.vcuvee_id):null;
  if(!cur&&rec&&(rec.cuvee||'').trim()){
    var k=_cuvKey(rec.cuvee);
    cur=_vendCuvList(mill).find(function(c){return _cuvKey(c.nom)===k;})||null;
  }
  _vcuvSel={mode:'pick',id:cur?cur.id:null,nom:cur?'':((rec&&rec.cuvee)||''),dup:null,force:false,cuveIdx:0,vol:null,volTouched:false};
  if(!cur&&_vcuvSel.nom.trim()) _vcuvSel.mode='pick';
  if(rec&&rec.cuve_id&&cur){
    var st=_vendCuvStats(cur.id);
    var ix=st.cuves.findIndex(function(c){return c.id===rec.cuve_id;});
    _vcuvSel.cuveIdx=ix===-1?-1:ix;
  }
  if(!_vrecDateHooked){
    var de=document.getElementById('vrec-date');
    if(de){ de.addEventListener('change',function(){ _vcuvSel.id=null; _vcuvSel.vol=null; _vendCuvRender(); }); _vrecDateHooked=true; }
  }
  _vendCuvRender();
  if(_vcuvSel.nom.trim()&&!_vcuvSel.id) _vendCuvKeep();
  _vendInjectClientField(rec?(rec.client||''):'');
  _vendSyncDest();
}
function _vendSyncDest(){
  var crow=document.getElementById('vrec-cuvee-row');
  var clrow=document.getElementById('vrec-client-row');
  if(crow) crow.style.display=_vendVendu?'none':'block';
  if(clrow) clrow.style.display=_vendVendu?'block':'none';
}

// —— Récoltes vinifiées disponibles (non affectées à une cuve), agrégées par cuvée ——
function _vendRecoltesDispo(){
  _vendCuvSync();
  var recs=(CAVE_VENDANGE.recoltes||[]).filter(function(r){return !r.vendu && (r.cuvee||'').trim() && !r.cuve_id;});
  var by={},ord=[];
  recs.forEach(function(r){
    var c=r.vcuvee_id?_vendCuvById(r.vcuvee_id):null;
    var k=c?c.id:('nom:'+_cuvKey(r.cuvee)+'|'+_vendMillOfDate(r.date));
    if(!by[k]){ by[k]={id:c?c.id:null,cuvee:c?c.nom:(r.cuvee||'').trim(),millesime:c?c.millesime:_vendMillOfDate(r.date),
                       ids:[],caisses:0,kg:0,parcelles:[],erasflage:r.erasflage||'total'}; ord.push(k); }
    by[k].ids.push(r.id); by[k].caisses+=(r.nb_caisses||0); by[k].kg+=_recKg(r);
    var pn=(r.parcelle||'').trim(); if(pn&&by[k].parcelles.indexOf(pn)===-1) by[k].parcelles.push(pn);
  });
  return ord.map(function(k){return by[k];});
}

// —— Sélecteur « depuis une récolte » (nouvelle cuve seulement) ——
var _vcuvFromGrp=null;
var _vcuvFromList=[];
function _vendInjectCuveFrom(isNew){
  var existing=document.getElementById('vcuv-from-row');
  if(existing&&existing.parentNode) existing.parentNode.removeChild(existing);
  _vcuvFromGrp=null; _vcuvFromList=[];
  if(!isNew) return;
  var dispo=_vendRecoltesDispo();
  if(!dispo.length) return;
  _vcuvFromList=dispo;
  var nomEl=document.getElementById('vcuv-nom'); if(!nomEl) return;
  var host=nomEl.closest('div')||nomEl;
  var row=document.createElement('div'); row.id='vcuv-from-row'; row.style.marginBottom='14px';
  row.innerHTML='<div class="fl" style="margin-top:0">\uD83C\uDF47 Depuis une r\u00e9colte enregistr\u00e9e</div>'
    +'<select id="vcuv-from" class="fi" style="width:100%" onchange="_vendCuveFromRecolte(this.value)">'
    +'<option value="">\u2014 Saisie manuelle \u2014</option>'
    +dispo.map(function(d,i){return '<option value="'+i+'">'+_escHtml(d.cuvee)+' \u00b7 '+d.caisses+' caisses'+(d.parcelles.length?' \u00b7 '+d.parcelles.length+' parcelle'+(d.parcelles.length>1?'s':''):'')+'</option>';}).join('')
    +'</select>'
    +'<div style="font-size:10.5px;color:var(--texte-doux);margin-top:5px">Reprend le nom, les parcelles et le volume estim\u00e9 automatiquement.</div>';
  host.parentNode.insertBefore(row,host);
}
function _vendCuveFromRecolte(idx){
  var i=parseInt(idx,10);
  _vcuvFromGrp=(idx===''||isNaN(i))?null:(_vcuvFromList[i]||null);
  var d=_vcuvFromGrp; if(!d) return;
  var cfg=_vendCfg();
  var el=document.getElementById('vcuv-nom'); if(el) el.value=d.cuvee;
  el=document.getElementById('vcuv-parcelles'); if(el) el.value=d.parcelles.join(', ');
  el=document.getElementById('vcuv-volume'); if(el&&!el.value) el.value=Math.max(1,Math.round(d.kg/(cfg.ratio_max||140)));
  el=document.getElementById('vcuv-erasflage'); if(el&&['total','partiel','entiere'].indexOf(d.erasflage)!==-1) el.value=d.erasflage;
}

// —— Export PDF des récoltes (cuvier + vrac) ——
window.exportVendRecoltesPdf = function(){
  var recs=CAVE_VENDANGE.recoltes||[];
  if(!recs.length){ showToast('Aucune récolte à exporter','#B85A1A'); return; }
  var cfg=_vendCfg();
  var domNom=window.DOMAINE_NOM||'Ma Vigne';
  var now=new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});
  var yr=new Date().getFullYear();
  var erLbl={total:'Éraflée',partiel:'Partielle',entiere:'Vendange entière'};
  function _row(r,vrac){
    var kg=_recKg(r), surf=_vendParcSurf(r.parcelle);
    var kgha=surf>0?Math.round(kg/surf).toLocaleString('fr-FR')+' kg/ha':'—';
    var dest=vrac?(r.client||'Vrac générique'):(r.cuvee||'—');
    return '<tr><td>'+_escHtml(r.parcelle||'')+'</td>'
      +'<td>'+_vendFrDate(r.date)+'</td>'
      +'<td>'+_escHtml(dest)+'</td>'
      +'<td class="n">'+(r.nb_caisses||0)+'</td>'
      +'<td class="n">'+kg.toLocaleString('fr-FR')+'</td>'
      +'<td class="n">'+kgha+'</td>'
      +'<td class="n">'+(r.etat_pct||0)+'%</td>'
      +'<td>'+(erLbl[r.erasflage]||'—')+'</td>'
      +(vrac?'':'<td class="n">'+_vendHlRange(kg)+' hL</td>')
      +'</tr>';
  }
  var cuvier=recs.filter(function(r){return !r.vendu;});
  var vrac=recs.filter(function(r){return r.vendu;});
  function _tot(list){var c=list.reduce(function(s,r){return s+(r.nb_caisses||0);},0);var k=list.reduce(function(s,r){return s+_recKg(r);},0);return {c:c,k:k};}
  var tc=_tot(cuvier), tv=_tot(vrac), ta=_tot(recs);
  var secCuvier=cuvier.length?(
    '<h2>Parti au cuvier — '+cuvier.length+' récolte'+(cuvier.length>1?'s':'')+'</h2>'
    +'<table><thead><tr><th>Parcelle</th><th>Date</th><th>Cuvée</th><th>Caisses</th><th>kg</th><th>Rendement</th><th>État</th><th>Éraflage</th><th>hL est.</th></tr></thead><tbody>'
    +cuvier.map(function(r){return _row(r,false);}).join('')
    +'<tr class="tot"><td colspan="3">Total cuvier</td><td class="n">'+tc.c+'</td><td class="n">'+tc.k.toLocaleString('fr-FR')+'</td><td colspan="4"></td></tr>'
    +'</tbody></table>'):'';
  var secVrac=vrac.length?(
    '<h2>Vendu en vrac — '+vrac.length+' récolte'+(vrac.length>1?'s':'')+'</h2>'
    +'<table><thead><tr><th>Parcelle</th><th>Date</th><th>Client</th><th>Caisses</th><th>kg</th><th>Rendement</th><th>État</th><th>Éraflage</th></tr></thead><tbody>'
    +vrac.map(function(r){return _row(r,true);}).join('')
    +'<tr class="tot"><td colspan="3">Total vrac</td><td class="n">'+tv.c+'</td><td class="n">'+tv.k.toLocaleString('fr-FR')+'</td><td colspan="3"></td></tr>'
    +'</tbody></table>'):'';
  var css='*{box-sizing:border-box;margin:0;padding:0}'
    +'h1{font-size:20px;color:#1A0E05;margin-bottom:3px}'
    +'.sub{font-size:13px;color:#7B4A1A;font-weight:600;margin-bottom:4px}'
    +'.meta{font-size:11px;color:#999;margin-bottom:16px}'
    +'.kpis{display:flex;gap:22px;flex-wrap:wrap;background:#FAF5EE;border:1px solid #E8D5B0;border-radius:8px;padding:10px 16px;margin-bottom:18px}'
    +'.kpi strong{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#8B6020;margin-bottom:2px}'
    +'.kpi{font-size:15px;color:#3A2A0E;font-weight:700}'
    +'h2{font-size:14px;color:#2D1B09;margin:18px 0 8px}'
    +'table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:6px}'
    +'th{text-align:left;padding:7px 9px;background:#2D1B09;color:#F5E6CC;font-size:10px;text-transform:uppercase;letter-spacing:.5px}'
    +'td{border-bottom:1px solid #EEE;padding:6px 9px}'
    +'td.n{text-align:right;white-space:nowrap}'
    +'th:nth-child(n+4){text-align:right}'
    +'tr:nth-child(even) td{background:#FAFAFA}'
    +'tr.tot td{background:#F5F0E8;font-weight:700;border-top:2px solid #C8A060;border-bottom:none}'
    +'.footer{margin-top:16px;font-size:10px;color:#BBB;text-align:right;border-top:1px solid #EEE;padding-top:8px}'
    +'';
  if(typeof window._mvDocOpen!=='function'){ showToast('Mise \u00e0 jour incompl\u00e8te \u2014 rechargez l\u2019application','#B85A1A'); return; }
  var corps='<div class="kpis"><div class="kpi"><strong>Caisses</strong>'+ta.c+'</div>'
    +'<div class="kpi"><strong>R\u00e9colt\u00e9</strong>'+(ta.k/1000).toFixed(2)+' t</div>'
    +'<div class="kpi"><strong>Au cuvier</strong>'+(tc.k/1000).toFixed(2)+' t</div>'
    +'<div class="kpi"><strong>En vrac</strong>'+(tv.k/1000).toFixed(2)+' t</div></div>'
    +secCuvier+secVrac;
  window._mvDocOpen({
    titre:'R\u00e9coltes '+yr, domaine:domNom, orient:'paysage', cat:'cave',
    metas:['\u00c9dit\u00e9 le '+now, recs.length+' r\u00e9colte'+(recs.length>1?'s':'')],
    corps:corps, css:css
  });
}

window._vendCuveFromRecolte  = _vendCuveFromRecolte;

// ── registre des cuvees de vendange (anti-doublon) ──
window._vendCuvPick     = _vendCuvPick;
window._vendCuvReuse    = _vendCuvReuse;
window._vendCuvNew      = _vendCuvNew;
window._vendCuvCancel   = _vendCuvCancel;
window._vendCuvInput    = _vendCuvInput;
window._vendCuvForce    = _vendCuvForce;
window._vendCuvJoinDup  = _vendCuvJoinDup;
window._vendCuvKeep     = _vendCuvKeep;
window._vendCuvSetCuve  = _vendCuvSetCuve;
window._vendCuvVol      = _vendCuvVol;
window._vendCuvSync     = _vendCuvSync;
window._vendCuvList     = _vendCuvList;
window._vendCuvStats    = _vendCuvStats;
window._vendCuvNear     = _vendCuvNear;
window._cuvKey          = _cuvKey;

// ═══════════════════════════════════════════════════════════════════════════
// VENDANGE v2.2 — Rendement pluriannuel par climat (cave.js seul)
// kg/ha dénormalisé dans p.rendement_hist[] à la validation d'une récolte.
// Écriture parcelles via saveData('parcelles') (garde anti-perte saison-aware)
// — jamais de write brut. MERGE : seul rendement_hist est touché.
// ═══════════════════════════════════════════════════════════════════════════
function _vendParcByName(nom){
  if(!nom) return null;
  var ps=window.PARCELLES||[]; var k=String(nom).trim().toLowerCase();
  return ps.find(function(x){return x&&String(x.nom||'').trim().toLowerCase()===k;})||null;
}
function _vendSaveParcelles(){
  var fn=window.saveData||window._saveData;
  if(typeof fn==='function') fn('parcelles');
}
// Upsert par recolte_id. Millésime = année civile de la date de récolte.
function _vendRecordRendement(rec, prev){
  try{
    if(!rec||!rec.id) return;
    var moved=false;
    if(prev&&prev.parcelle&&String(prev.parcelle).trim().toLowerCase()!==String(rec.parcelle||'').trim().toLowerCase()){
      var oldP=_vendParcByName(prev.parcelle);
      if(oldP&&Array.isArray(oldP.rendement_hist)){
        var n0=oldP.rendement_hist.length;
        oldP.rendement_hist=oldP.rendement_hist.filter(function(e){return e&&e.recolte_id!==rec.id;});
        if(oldP.rendement_hist.length!==n0) moved=true;
      }
    }
    var p=_vendParcByName(rec.parcelle);
    if(p){
      if(!Array.isArray(p.rendement_hist)) p.rendement_hist=[];
      var surf=parseFloat(p.surface)||0;
      var kg=_recKg(rec);
      var mil=parseInt(String(rec.date||'').slice(0,4),10)||new Date().getFullYear();
      var entry={recolte_id:rec.id,millesime:mil,kg:kg,caisses:rec.nb_caisses||0,
        kg_ha:surf>0?Math.round(kg/surf):null,date:rec.date||''};
      var i=p.rendement_hist.findIndex(function(e){return e&&e.recolte_id===rec.id;});
      if(i!==-1) p.rendement_hist[i]=entry; else p.rendement_hist.push(entry);
      _vendSaveParcelles();
    } else if(moved){
      _vendSaveParcelles();
    }
  }catch(e){ /* ne jamais casser l'enregistrement de la récolte */ }
}
function _vendUnrecordRendement(recId, parcelleNom){
  try{
    if(!recId) return;
    var p=_vendParcByName(parcelleNom);
    if(p&&Array.isArray(p.rendement_hist)){
      var n0=p.rendement_hist.length;
      p.rendement_hist=p.rendement_hist.filter(function(e){return e&&e.recolte_id!==recId;});
      if(p.rendement_hist.length!==n0) _vendSaveParcelles();
    }
  }catch(e){}
}
// Agrège rendement_hist de toutes les parcelles, groupé climat -> millésime
function _vendRendHistData(){
  var ps=window.PARCELLES||[]; var out=[];
  ps.forEach(function(p){
    var h=Array.isArray(p.rendement_hist)?p.rendement_hist:[];
    if(!h.length) return;
    var surf=parseFloat(p.surface)||0, byM={};
    h.forEach(function(e){
      if(!e) return;
      var m=e.millesime||parseInt(String(e.date||'').slice(0,4),10)||0;
      if(!m) return;
      if(!byM[m]) byM[m]={millesime:m,kg:0,caisses:0};
      byM[m].kg+=(e.kg||0); byM[m].caisses+=(e.caisses||0);
    });
    var years=Object.keys(byM).map(Number).sort(function(a,b){return a-b;});
    if(!years.length) return;
    var rows=years.map(function(m){var o=byM[m]; o.kg_ha=surf>0?Math.round(o.kg/surf):null; return o;});
    out.push({nom:p.nom,surface:surf,rows:rows});
  });
  out.sort(function(a,b){return String(a.nom||'').localeCompare(String(b.nom||''),'fr');});
  return out;
}
function _vendRendInjectCss(){
  if(document.getElementById('mvv-rh-css')) return;
  var s=document.createElement('style'); s.id='mvv-rh-css';
  s.textContent=`
.mvv-rh{margin-top:20px}
.mvv-rh-p{background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.10);border-radius:15px;padding:13px 14px;margin-bottom:10px;box-shadow:0 1px 5px rgba(20,17,13,.04)}
.mvv-rh-nm{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:17px;color:var(--texte,#1A1A14);line-height:1.1}
.mvv-rh-sub{font-size:11px;color:var(--texte-doux,#5F5F5F);margin-top:2px}
.mvv-rh-years{margin-top:11px;display:flex;flex-direction:column;gap:7px}
.mvv-rh-row{display:flex;align-items:center;gap:9px}
.mvv-rh-yr{font-size:12px;font-weight:600;color:var(--texte-med,#4A4A3A);width:40px;flex-shrink:0}
.mvv-rh-bar{flex:1;height:9px;border-radius:5px;background:var(--gris-clair,#ECE6DA);overflow:hidden}
.mvv-rh-fill{height:100%;border-radius:5px;background:linear-gradient(90deg,var(--terre,#8A5A38),#C2871E)}
.mvv-rh-val{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:15px;color:var(--terre,#8A5A38);width:104px;text-align:right;flex-shrink:0}
.mvv-rh-val .u{font-family:inherit;font-size:9px;color:var(--texte-doux,#5F5F5F);font-weight:400;margin-left:2px}
.mvv-rh-val.na{color:var(--texte-doux,#5F5F5F);font-size:11px;font-family:inherit;font-weight:500}
.mvv-rh-delta{font-size:10.5px;font-weight:600;width:50px;text-align:right;flex-shrink:0}
.mvv-rh-delta.up{color:var(--vert-med,#3D6B27)}
.mvv-rh-delta.down{color:#B0412C}
.mvv-rh-delta.flat{color:var(--texte-doux,#5F5F5F)}
`;
  document.head.appendChild(s);
}
function _vendRendHistHtml(){
  var data=_vendRendHistData();
  if(!data.length) return '';
  _vendRendInjectCss();
  var html='<div class="mvv-rh"><div class="mvv-seclbl">Rendements par climat · pluriannuel</div>';
  data.forEach(function(d){
    var vals=d.rows.map(function(r){return r.kg_ha||0;});
    var max=Math.max.apply(null,vals.concat([1]));
    var rowsH=d.rows.map(function(r,i){
      var prev=i>0?d.rows[i-1]:null, delta;
      if(prev&&prev.kg_ha&&r.kg_ha){
        var dp=Math.round((r.kg_ha/prev.kg_ha-1)*100);
        var cls=dp>2?'up':dp<-2?'down':'flat';
        delta='<span class="mvv-rh-delta '+cls+'">'+(dp>0?'+':'')+dp+'%</span>';
      } else delta='<span class="mvv-rh-delta flat">—</span>';
      var w=r.kg_ha?Math.max(4,Math.round(r.kg_ha/max*100)):0;
      var valH=r.kg_ha!=null
        ?'<span class="mvv-rh-val">'+r.kg_ha.toLocaleString('fr-FR')+'<span class="u">kg/ha</span></span>'
        :'<span class="mvv-rh-val na">'+(r.kg||0).toLocaleString('fr-FR')+' kg</span>';
      return '<div class="mvv-rh-row"><span class="mvv-rh-yr">'+r.millesime+'</span>'
        +'<span class="mvv-rh-bar"><span class="mvv-rh-fill" style="width:'+w+'%"></span></span>'
        +valH+delta+'</div>';
    }).join('');
    var span=d.rows.length>1?(d.rows[0].millesime+'–'+d.rows[d.rows.length-1].millesime):String(d.rows[0].millesime);
    html+='<div class="mvv-rh-p"><div class="mvv-rh-nm">'+_escHtml(d.nom||'')+'</div>'
      +'<div class="mvv-rh-sub">'+d.rows.length+' millésime'+(d.rows.length>1?'s':'')+' · '+span+(d.surface>0?' · '+_mvF1(d.surface)+' ha':'')+'</div>'
      +'<div class="mvv-rh-years">'+rowsH+'</div></div>';
  });
  return html+'</div>';
}





// \u2500\u2500 Cuv\u00E9e detail view \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function _caveOpenPdf(el){var u=el.dataset.url;if(u)window.open(u,'_blank');}

function _caveSparkSO2(cuvId,w){
  var ops=(CAVE_ELEVAGE.operations||[]).filter(function(op){
    if(op.type!=='analyse')return false;
    var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
    return ids.indexOf(cuvId)!==-1&&op.data&&op.data.so2_libre;
  }).sort(function(a,b){return a.date>b.date?1:-1;});
  // Aucune analyse : la section n'existe pas, l'appelant ne l'affiche meme pas.
  // UNE analyse : il y a de la matiere mais pas de courbe — on dit pourquoi.
  if(!ops.length) return null;
  if(ops.length<2) return window._mvGraphVide('Une seule analyse de SO\u2082 libre',
    'Une deuxi\u00e8me mesure suffit \u00e0 tracer l\u2019\u00e9volution.');
  var vals=ops.map(function(op){return parseFloat(op.data.so2_libre);});
  var dates=ops.map(function(op){return _caveDateFr(op.date);});
  var mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals),rng=mx-mn||10;
  var c=window._mvGraphCadre(w,82,{padL:10,padR:10,padT:20,padB:22});
  var W=c.w,H=c.h,pX=c.padL,pY=c.padT,iW=c.iw,iH=c.ih;
  var pts=vals.map(function(v,i){
    return{x:pX+(i/(vals.length-1))*iW,y:pY+(1-(v-mn)/rng)*iH,v:v,d:dates[i]};
  });
  var pl=pts.map(function(p){return p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' ');
  var ap='M'+pts[0].x.toFixed(1)+','+(H-c.padB)+' L'+pts.map(function(p){return p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' L')+' L'+pts[pts.length-1].x.toFixed(1)+','+(H-c.padB)+' Z';
  var COL='var(--ink-info)';
  var g='<path d="'+ap+'" fill="'+COL+'" fill-opacity="0.10"/>';
  g+='<polyline fill="none" stroke="'+COL+'" stroke-width="'+c.trait.prevu+'" stroke-linejoin="round" points="'+pl+'"/>';
  // Une etiquette sur deux au-dela de six mesures : on retire des reperes, on ne
  // reduit pas la police.
  var pas=vals.length>6?2:1;
  pts.forEach(function(p,i){
    g+='<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="3" fill="'+COL+'"/>';
    if(i%pas===0||i===pts.length-1)
      g+='<text x="'+p.x.toFixed(1)+'" y="'+Math.max(c.txt.mini+2,p.y-6).toFixed(1)+'" fill="'+COL+'" font-size="'+c.txt.mini+'" text-anchor="middle">'+p.v+'</text>';
    if(i===0||i===pts.length-1){
      // Les deux dates etaient ecrites en blanc a 25 % sur une carte claire :
      // invisibles depuis toujours.
      var tx=i===0?pX:W-pX;
      g+='<text x="'+tx+'" y="'+(H-6)+'" fill="'+c.col.texte+'" font-size="'+c.txt.mini+'" text-anchor="'+(i===0?'start':'end')+'">'+p.d+'</text>';
    }
  });
  return window._mvGraphSvg(c,'SO\u2082 libre : '+vals.length+' analyses, de '+mn+' \u00e0 '+mx+' milligrammes par litre.',g);
}

function openCuveeDetail(cuvId){
  var cuv=(CAVE_ELEVAGE.cuvees||[]).find(function(c){return c.id===cuvId;});
  if(!cuv)return;
  var bodyEl=document.getElementById('cuvd-body');
  if(!bodyEl){var ov2=document.getElementById('ovCuveeDetail');if(ov2)ov2.classList.add('open');return;}
  var nbT=_caveNbTonneaux(cuv);
  var tEl=document.getElementById('cuvd-title');var sEl=document.getElementById('cuvd-sub');
  if(tEl)tEl.textContent=cuv.nom+(cuv.millesime?' '+cuv.millesime:'');
  if(sEl)sEl.textContent=nbT+' tonneau'+(nbT>1?'x':'')+' \u00B7 '+(nbT*_caveFutHl()).toFixed(1)+' hL'+(_caveTonneauxStr(cuv)?' \u00B7 '+_caveTonneauxStr(cuv):'');
  var seuil=_caveSeuilOu(cuv);
  var lMs=cuv.last_ouillage?new Date(cuv.last_ouillage).getTime():0;
  var dSince=lMs?Math.floor((Date.now()-lMs)/86400000):9999;
  var ouOk=lMs&&dSince<seuil;
  var ouC=ouOk?'#3A8C40':'#E07060';
  var ouD=cuv.last_ouillage?_caveDateFr(cuv.last_ouillage):'Jamais';
  var ouS=lMs?(dSince===0?'aujourd\'hui':dSince+'\u00A0j'):'';
  var lAna=_caveLastAna(cuvId);
  var lSO2L=null,lSO2T=null,lFml=null,lAv=null,lPdfUrl=null,lPdfNom=null;
  if(lAna&&lAna._src==='op'&&lAna.data){
    lSO2L=lAna.data.so2_libre;lSO2T=lAna.data.so2_total;
    lFml=lAna.data.fml;lAv=lAna.data.av;
    lPdfUrl=lAna.data.pdf_url;lPdfNom=lAna.data.pdf_nom;
  } else if(lAna&&lAna.data){lPdfUrl=lAna.data.pdf_url;lPdfNom=lAna.data.pdf_nom;}
  var fmlH='';
  if(lFml==='ok')fmlH='<div style="font-size:10px;font-weight:600;color:#3A8C40;background:rgba(58,140,64,0.12);border-radius:6px;padding:2px 8px;display:inline-block;margin-top:4px;">FML \u2713</div>';
  else if(lFml==='cours')fmlH='<div style="font-size:10px;font-weight:600;color:#B8913A;background:rgba(184,145,58,0.12);border-radius:6px;padding:2px 8px;display:inline-block;margin-top:4px;">FML en cours</div>';
  else if(lFml==='non')fmlH='<div style="font-size:10px;font-weight:600;color:#E07060;background:rgba(224,112,96,0.1);border-radius:6px;padding:2px 8px;display:inline-block;margin-top:4px;">FML non faite</div>';
  var cOps=(CAVE_ELEVAGE.operations||[]).filter(function(op){
    var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
    return ids.indexOf(cuvId)!==-1;
  });
  var cAnas=(CAVE_ELEVAGE.analyses||[]).filter(function(a){
    return Array.isArray(a.cuvee_ids)&&a.cuvee_ids.indexOf(cuvId)!==-1;
  }).map(function(a){return{_src:'ana',type:'analyse',date:a.date_analyse||a.date||'',data:{pdf_url:a.url,pdf_nom:a.nom_fichier},notes:a.commentaire||''};});
  var allIt=cOps.map(function(op){return Object.assign({},op,{_src:'op'});}).concat(cAnas).sort(function(a,b){return a.date>b.date?-1:1;});
  var html='';
  // Stat cards
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">';
  html+='<div style="background:var(--bg-card);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:11px;">';
  html+='<div style="font-size:10px;color:var(--texte-doux);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Ouillage</div>';
  html+='<div style="font-size:15px;font-weight:600;color:'+ouC+';">'+ouD+'</div>';
  if(ouS)html+='<div style="font-size:11px;color:'+ouC+';margin-top:2px;">il y a '+ouS+(ouOk?'':' \u26A0')+'</div>';
  html+='</div>';
  html+='<div style="background:var(--bg-card);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:11px;">';
  html+='<div style="font-size:10px;color:var(--texte-doux);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Derni\u00E8re analyse</div>';
  html+='<div style="font-size:15px;font-weight:600;color:var(--texte);">'+(lAna?_caveDateFr(lAna.date_analyse):'Aucune')+'</div>'+fmlH;
  if(lPdfUrl)html+='<div style="margin-top:5px;"><button class="cave-pdf-chip" data-url="'+_escHtml(lPdfUrl)+'" onclick="_caveOpenPdf(this)">\uD83D\uDCC4 '+(lPdfNom?_escHtml(lPdfNom):'PDF')+'</button></div>';
  html+='</div>';
  // Le soutirage a lieu plusieurs fois : on montre le DERNIER et le compte,
  // jamais un oui/non. Pleine largeur pour ne pas laisser un demi-trou.
  var soutD=_caveLastSout(cuvId), soutN=_caveSoutOps(cuvId).length;
  html+='<div style="grid-column:1/-1;background:var(--bg-card);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:11px;">';
  html+='<div style="font-size:10px;color:var(--texte-doux);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Dernier soutirage</div>';
  html+='<div style="font-size:15px;font-weight:600;color:'+(soutD?'var(--texte)':'var(--texte-doux)')+';">'
    +(soutD?_caveDateFr(soutD):'Aucun enregistr\u00E9')
    +(soutN>1?'<span style="font-size:11px;font-weight:400;color:var(--texte-doux);"> \u00B7 '+soutN+' au total</span>':'')+'</div>';
  html+='</div>';
  html+='</div>';
  // SO2 + AV chips
  if(lSO2L||lSO2T||lAv){
    html+='<div style="display:flex;gap:7px;margin-bottom:12px;flex-wrap:wrap;">';
    if(lSO2L)html+='<div style="background:var(--bg-card);border:1px solid rgba(74,159,200,0.3);border-radius:10px;padding:8px 12px;flex:1;min-width:80px;"><div style="font-size:10px;color:var(--texte-doux);">SO\u2082 libre</div><div style="font-size:17px;font-weight:700;color:var(--ink-info,#4A9FC8);">'+lSO2L+'<span style="font-size:11px;font-weight:400;"> mg/L</span></div></div>';
    if(lSO2T)html+='<div style="background:var(--bg-card);border:1px solid rgba(74,159,200,0.2);border-radius:10px;padding:8px 12px;flex:1;min-width:80px;"><div style="font-size:10px;color:var(--texte-doux);">SO\u2082 total</div><div style="font-size:17px;font-weight:700;color:var(--ink-info,#4A9FC8);">'+lSO2T+'<span style="font-size:11px;font-weight:400;"> mg/L</span></div></div>';
    if(lAv)html+='<div style="background:var(--bg-card);border:1px solid rgba(224,112,96,0.25);border-radius:10px;padding:8px 12px;flex:1;min-width:80px;"><div style="font-size:10px;color:var(--texte-doux);">Ac. volatile</div><div style="font-size:17px;font-weight:700;color:var(--rouge,#E07060);">'+lAv+'<span style="font-size:11px;font-weight:400;"> g/L</span></div></div>';
    html+='</div>';
  }
  // SO2 sparkline
  window._mvGraphOublier('#mvg-so2-');
  var spark=_caveSparkSO2(cuvId, window._mvGraphW(null));
  if(spark) window._mvGraphSuivre('#mvg-so2-'+_mvgId(cuvId), function(lg){ return _caveSparkSO2(cuvId,lg); });
  if(spark) spark='<div id="mvg-so2-'+_mvgId(cuvId)+'"></div>';
  if(spark)html+='<div style="background:var(--bg-card);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:11px;margin-bottom:12px;"><div style="font-size:10px;color:var(--texte-doux);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">'+'\u00C9volution SO\u2082 libre (mg/L)</div>'+spark+'</div>';
  // Journal
  if(allIt.length){
    html+='<div style="font-size:10px;color:var(--texte-doux);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">Journal</div>';
    var tI={ouillage:'\uD83E\uDEA3',soutirage:'\uD83D\uDD04',soufre:'\uD83E\uDDEA',analyse:'\uD83D\uDD2C',retrait_fut:'\uD83D\uDEAA',autre:'\uD83D\uDCDD'};
    var tL={ouillage:'Ouillage',soutirage:'Soutirage',soufre:'Soufre',analyse:'Analyse',retrait_fut:'Retrait f\u00FBt',autre:'Autre'};
    allIt.forEach(function(op){
      var ico=tI[op.type]||'\uD83D\uDCDD',lbl=tL[op.type]||op.type;
      html+='<div style="background:var(--bg-card);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:11px;margin-bottom:7px;">';
      html+='<div style="display:flex;align-items:flex-start;gap:8px;">';
      html+='<span style="font-size:16px;margin-top:1px;">'+ico+'</span>';
      html+='<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;color:var(--texte);">'+lbl+'</div>';
      html+='<div style="font-size:11px;color:var(--texte-doux);">'+_caveDateFr(op.date)+(_caveWho(op)?' \u00B7 '+_escHtml(_caveWho(op)):'')+'</div></div>';
      if(op._src==='op'&&typeof isAdmin==='function'&&isAdmin()){
        html+='<button onclick="window.openOvCaveOp&&window.openOvCaveOp(\''+op.id+'\')" style="background:none;border:none;font-size:13px;cursor:pointer;color:var(--texte-doux);padding:2px;min-width:28px;">\u270F\uFE0F</button>';
        html+='<button onclick="window.deleteCaveOp&&window.deleteCaveOp(\''+op.id+'\')" style="background:none;border:none;font-size:13px;cursor:pointer;color:#E07060;padding:2px;min-width:28px;">\uD83D\uDDD1</button>';
      }
      html+='</div>';
      var det=[];
      if(op.type==='ouillage'&&op.data&&op.data.nb_ouillettes)det.push(op.data.nb_ouillettes+' ouillettes \u00D7 '+op.data.vol_ouillette_L+'L = '+op.data.vol_total_L+' L');
      if(op.type==='soufre'&&op.data&&op.data.grammes_pastille)det.push(op.data.grammes_pastille+'g \u00D7 '+op.data.nb_total+' = '+op.data.so2_total_g+' g SO\u2082');
      if(op.type==='soutirage'&&op.data&&op.data.so2&&op.data.so2.mode!=='none'){var ss=op.data.so2;det.push('SO\u2082 '+ss.dose+' '+(ss.unite||'cL')+(ss.mode==='unique'?' dose unique':' \u00D7 '+ss.nb_doses));}
      if(op.type==='analyse'&&op._src==='op'&&op.data){
        if(op.data.so2_libre)det.push('SO\u2082 libre: '+op.data.so2_libre+' mg/L');
        if(op.data.so2_total)det.push('SO\u2082 total: '+op.data.so2_total+' mg/L');
        if(op.data.av)det.push('Ac. volatile: '+op.data.av+' g/L');
        if(op.data.fml&&op.data.fml!=='none'){var ffl={cours:'FML en cours',ok:'FML termin\u00E9e',non:'Pas de FML'};if(ffl[op.data.fml])det.push(ffl[op.data.fml]);}
      }
      if(op.type==='retrait_fut'&&op.data){var _anFut=op.data.annee_fut?(op.data.annee_fut>=new Date().getFullYear()?'neuf':op.data.annee_fut)+' \u00B7 ':'';det.push(op.data.nb_futs+' f\u00FBt'+(op.data.nb_futs>1?'s':'')+' '+_anFut+'retir\u00E9'+(op.data.nb_futs>1?'s':'')+' \u2014 '+(op.data.raison_lbl||''));}
      if(det.length)html+='<div style="font-size:11px;color:var(--texte-doux);margin-top:5px;line-height:1.5;">'+det.join(' \u00B7 ')+'</div>';
      if(op.notes)html+='<div style="font-size:11px;font-style:italic;color:var(--texte-doux);margin-top:3px;">'+_escHtml(op.notes)+'</div>';
      if(op.type==='analyse'&&op.data&&op.data.pdf_url){
        html+='<div style="display:flex;align-items:center;gap:6px;margin-top:6px;padding:6px 8px;background:rgba(192,132,90,0.06);border-radius:8px;border:1px solid rgba(192,132,90,0.2);">\uD83D\uDCC4 <span style="font-size:11px;color:var(--texte-doux);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_escHtml(op.data.pdf_nom||'rapport.pdf')+'</span>';
        html+='<button class="cave-pdf-chip" data-url="'+_escHtml(op.data.pdf_url)+'" onclick="_caveOpenPdf(this)">Ouvrir</button></div>';
      }
      html+='</div>';
    });
  } else {
    html+='<div style="font-size:13px;color:var(--texte-doux);text-align:center;padding:24px 0;">Aucune op\u00E9ration pour cette cuv\u00E9e</div>';
  }
  html+='<div style="height:1px;background:rgba(255,255,255,0.07);margin:12px 0;"></div>';
  html+='<button onclick="window.openOvRetraitFut&&window.openOvRetraitFut(\''+cuv.id+'\')" style="width:100%;padding:10px;border:1px solid rgba(139,32,32,0.3);border-radius:10px;background:rgba(139,32,32,0.06);font-size:13px;font-weight:500;color:#8B2020;cursor:pointer;min-height:44px;font-family:Outfit,sans-serif;margin-bottom:6px;">\uD83D\uDEAA Retirer un f\u00FCt</button>';
  if(typeof isAdmin==='function'&&isAdmin()){
    html+='<div style="display:flex;gap:8px;">';
    html+='<button onclick="closeOv(null,\'ovCuveeDetail\');openOvCavee(\''+cuv.id+'\')" class="mbtn" style="flex:1;background:rgba(192,132,90,0.12);color:#C0845A;border-color:rgba(192,132,90,0.3);">\u270F\uFE0F Modifier</button>';
    html+='<button onclick="closeOv(null,\'ovCuveeDetail\');deleteCuveeById(\''+cuv.id+'\')" style="padding:10px 14px;border:1px solid rgba(224,112,96,0.3);border-radius:10px;background:rgba(224,112,96,0.08);font-size:12px;color:#E07060;cursor:pointer;min-height:44px;">\uD83D\uDDD1</button>';
    html+='</div>';
  }
  bodyEl.innerHTML=html;
  if(window._mvGraphRepeindre) window._mvGraphRepeindre();
  var ov3=document.getElementById('ovCuveeDetail');if(ov3)ov3.classList.add('open');
}


function deleteCuveeById(cuvId) {
  window.openConfirmDel('Supprimer cette cuvée ?','Toutes ses opérations seront également supprimées.',function(){
    var existId=cuvId;
    CAVE_ELEVAGE.cuvees=CAVE_ELEVAGE.cuvees.filter(function(c){return c.id!==existId;});
    CAVE_ELEVAGE.operations=CAVE_ELEVAGE.operations.filter(function(o){return o.cuvee_id!==existId;});
    window.CAVE_ELEVAGE=CAVE_ELEVAGE;
    if(window.fbSave) window.fbSave('cave_elevage',CAVE_ELEVAGE);
    showToast('\uD83D\uDDD1 Cuv\u00E9e supprim\u00E9e','#B85A1A');
    renderCave();
  });
}

// \u2500\u2500 Edit analyse metadata \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
var _editAnaId=null;
var _editAnaSelIds=[];


function _toggleEditAnaChip(cuvId) {
  var idx=_editAnaSelIds.indexOf(cuvId);
  if(idx===-1) _editAnaSelIds.push(cuvId);
  else _editAnaSelIds.splice(idx,1);
  // Re-render chips
  var wrap=document.getElementById('cana-edit-cuv-chips');
  if(wrap) {
    wrap.innerHTML=CAVE_ELEVAGE.cuvees.map(function(c){
      var sel=_editAnaSelIds.indexOf(c.id)!==-1;
      return '<button onclick="_toggleEditAnaChip(\''+c.id+'\')" style="padding:7px 11px;border-radius:10px;border:1px solid '+(sel?'rgba(192,132,90,0.5)':'rgba(255,255,255,0.1)')+';background:'+(sel?'rgba(192,132,90,0.14)':'rgba(255,255,255,0.04)')+';font-size:11px;color:'+(sel?'#C0845A':'var(--texte-doux)')+';cursor:pointer;min-height:44px;font-weight:'+(sel?'500':'400')+';">'+_escHtml(c.nom+(c.millesime?' '+c.millesime:''))+'</button>';
    }).join('');
  }
  _updateEditAnaHint();
}

function _updateEditAnaHint() {
  var hint=document.getElementById('cana-edit-cuv-hint');
  if(hint) hint.textContent=_editAnaSelIds.length?_editAnaSelIds.length+' cuv\u00E9e'+(_editAnaSelIds.length>1?'s':'')+' s\u00E9lectionn\u00E9e'+(_editAnaSelIds.length>1?'s':''):'';
}

function saveCaveAnaEdit() {
  if(!_editAnaId) return;
  if(!_editAnaSelIds.length){showToast('S\u00E9lectionnez au moins une cuv\u00E9e','#E07060');return;}
  var idx=(CAVE_ELEVAGE.analyses||[]).findIndex(function(a){return a.id===_editAnaId;});
  if(idx===-1) return;
  var date=(document.getElementById('cana-edit-date')||{}).value||CAVE_ELEVAGE.analyses[idx].date_analyse;
  var type=(document.getElementById('cana-edit-type')||{}).value||CAVE_ELEVAGE.analyses[idx].type;
  var commentaire=((document.getElementById('cana-edit-commentaire')||{}).value||'').trim();
  Object.assign(CAVE_ELEVAGE.analyses[idx],{date_analyse:date,type:type,cuvee_ids:_editAnaSelIds.slice(),commentaire:commentaire});
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  if(window.fbSave) window.fbSave('cave_elevage',CAVE_ELEVAGE);
  window.closeOv(null,'ovCaveAnaEdit');
  showToast('\u2705 Analyse mise \u00E0 jour','#3D6B27');
  renderCave();
}

// \u2500\u2500 FIN CAVE \u00C9LEVAGE \u2500\u2500

// \u2550\u2550\u2550\u2550 EXPOSITION GLOBALE \u2550\u2550\u2550\u2550
window.CAVE_ELEVAGE         = CAVE_ELEVAGE;
window.toggleCopInt          = toggleCopInt;
window.renderCave           = renderCave;
window.selectCaveSection    = selectCaveSection;
function setOuillageAlerte(n){
  if(typeof isAdmin==='function' && !isAdmin()){ if(window.showToast)window.showToast('Admin requis','#C0392B'); return; }
  if(!CAVE_ELEVAGE.config) CAVE_ELEVAGE.config={};
  CAVE_ELEVAGE.config.ouillage_alerte_j = n;
  window.CAVE_ELEVAGE = CAVE_ELEVAGE;
  if(window.fbSave) window.fbSave('cave_elevage', CAVE_ELEVAGE);
  _caveOuillageRefresh();
  if(window.showToast) window.showToast('Alerte ouillage : '+n+' jours', '#3D6B27');
}
function _caveOuillageRefresh(){
  var v=(CAVE_ELEVAGE.config && CAVE_ELEVAGE.config.ouillage_alerte_j) || 14;
  var el=document.getElementById('cave-ouillage-val'); if(el) el.textContent=v;
  [7,14].forEach(function(n){ var b=document.getElementById('cave-oub-'+n); if(!b)return; var on=(Number(v)===n); b.style.borderColor=on?'#4A9FC8':'var(--gris)'; b.style.background=on?'rgba(74,159,200,0.14)':'transparent'; b.style.color=on?'#4A9FC8':'var(--texte)'; b.style.fontWeight=on?'700':'600'; });
}
window.setOuillageAlerte    = setOuillageAlerte;
window.switchCaveOng        = switchCaveOng;
window.openOvCaveOp         = openOvCaveOp;
window.saveCaveOp           = saveCaveOp;
window.selCaveOpType        = selCaveOpType;
window.selCaveFml           = selCaveFml;
window._cuvToggle           = _cuvToggle;
window.openOvCavee          = openOvCavee;
window.toggleCopAllCuv      = toggleCopAllCuv;
// Appelee depuis un onclick inline du rang de millesimes : sans cet export,
// le build IIFE la rend invisible et le bouton ne fait rien, en silence.
window.selCopMil           = selCopMil;
window.toggleCopCuvee       = toggleCopCuvee;
window.adjCopOuillette      = adjCopOuillette;
window.updateCopOuillageCalc= updateCopOuillageCalc;
window.setCopSo2Mode        = setCopSo2Mode;
window.setCopSo2Nb          = setCopSo2Nb;
window.setCopSo2Freq        = setCopSo2Freq;
window._copUpdateOpDate     = _copUpdateOpDate;
window.saveCuvee            = saveCuvee;
window.deleteCuvee          = deleteCuvee;

function deleteCaveOp(opId) {
  if(!isAdmin())return;
  window.openConfirmDel('Supprimer cette opération ?','',function(){
    CAVE_ELEVAGE.operations=CAVE_ELEVAGE.operations.filter(function(o){return o.id!==opId;});
    window.CAVE_ELEVAGE=CAVE_ELEVAGE;
    if(window.fbSave)window.fbSave('cave_elevage',CAVE_ELEVAGE);
    showToast('\u2705 Op\u00E9ration supprim\u00E9e','#3D6B27');
    renderCave();
  });
}

window.openOvCaveExport = function() {
  if(!isAdmin())return;
  _caveExpAllCuv=true;
  _caveExpCuvSel=new Set();
  _caveExpTypes=new Set(['ouillage','soutirage','soufre','analyse','autre']);
  _renderCaveExpCuvChips();
  ['ouillage','soutirage','soufre','analyse','autre'].forEach(function(t){
    var el=document.getElementById('cexp-type-'+t);if(el)el.checked=true;
  });
  var d=document.getElementById('cexp-date-deb');if(d)d.value='';
  var f=document.getElementById('cexp-date-fin');if(f)f.value='';
  var g=document.getElementById('cexp-group-date');if(g)g.checked=true;
  var ov=document.getElementById('ovCaveExport');if(ov)ov.classList.add('open');
}

function _renderCaveExpCuvChips() {
  var el=document.getElementById('cexp-cuv-chips');if(!el)return;
  var cuvees=CAVE_ELEVAGE.cuvees||[];
  var h='<button class="cave-cuvee-chip'+(_caveExpAllCuv?' sel':'')+'" onclick="window._caveExpToggleCuv(null)">Toutes</button>';
  cuvees.forEach(function(c){
    var _eid='cexp-cuv-'+c.id;
    h+='<button id="'+_eid+'" class="cave-cuvee-chip'+(!_caveExpAllCuv&&_caveExpCuvSel.has(c.id)?' sel':'')+'" data-cuv-id="'+c.id+'" onclick="window._caveExpToggleCuvById(this)">'+c.nom+(c.millesime?' '+c.millesime:'')+'</button>';
  });
  el.innerHTML=h;
}

function _caveExpToggleCuvById(el) {
  var id=el.dataset.cuvId||null;
  _caveExpToggleCuv(id);
}

function _caveExpToggleCuv(id) {
  if(id===null){_caveExpAllCuv=true;_caveExpCuvSel=new Set();}
  else{
    _caveExpAllCuv=false;
    if(_caveExpCuvSel.has(id))_caveExpCuvSel.delete(id);
    else _caveExpCuvSel.add(id);
    if(_caveExpCuvSel.size===0)_caveExpAllCuv=true;
  }
  _renderCaveExpCuvChips();
}

function _caveExpToggleType(type) {
  if(_caveExpTypes.has(type))_caveExpTypes.delete(type);
  else _caveExpTypes.add(type);
}

function _caveExpCuvLabelTxt(op) {
  var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
  var cuv=CAVE_ELEVAGE.cuvees||[];
  if(!ids.length)return'Toutes cuv\u00E9es';
  if(ids.length===cuv.length)return'Toutes cuv\u00E9es';
  return ids.map(function(id){var c=cuv.find(function(x){return x.id===id;});return c?c.nom+(c.millesime?' '+c.millesime:''):id;}).join(', ');
}

function generateCaveExport() {
  if(!isAdmin())return;
  var ops=(CAVE_ELEVAGE.operations||[]).map(function(o){return Object.assign({},o,{_src:'op'});});
  var anas=(CAVE_ELEVAGE.analyses||[]).map(function(a){return{_src:'ana',id:a.id,type:'analyse',date:a.date||a.date_analyse,cuvees_ids:a.cuvee_ids||[],operateur:a.uploaded_by||'',notes:a.commentaire||'',data:{label:a.type,fichier:a.nom_fichier,url:a.url}};});
  var all=ops.concat(anas);
  if(!_caveExpAllCuv&&_caveExpCuvSel.size>0){
    all=all.filter(function(op){
      var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
      return ids.some(function(id){return _caveExpCuvSel.has(id);});
    });
  }
  all=all.filter(function(op){return _caveExpTypes.has(op.type);});
  var deb=(document.getElementById('cexp-date-deb')||{}).value||'';
  var fin=(document.getElementById('cexp-date-fin')||{}).value||'';
  if(deb)all=all.filter(function(op){return op.date>=deb;});
  if(fin)all=all.filter(function(op){return op.date<=fin;});
  if(!all.length){showToast('Aucune op\u00E9ration avec ces filtres','#B85A1A');return;}
  all.sort(function(a,b){return a.date>b.date?1:-1;});
  var groupByCuv=(document.getElementById('cexp-group-cuv')||{}).checked;
  var domNom=window.DOMAINE_NOM||'Ma Vigne';
  var now=new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});

  function _opDetail(op){
    var lines=[];
    if(op.type==='ouillage'&&op.data&&op.data.nb_ouillettes)
      lines.push(op.data.nb_ouillettes+' ouillettes \u00D7 '+op.data.vol_ouillette_L+'L = '+op.data.vol_total_L+' L'+(op.data.vol_par_fut_L?' \u00B7 '+op.data.vol_par_fut_L+' L/f\u00FBt':''));
    if(op.type==='soutirage'&&op.data&&op.data.so2&&op.data.so2.mode!=='none'){
      var s=op.data.so2,str='SO\u2082 ';
      if(s.dose)str+=s.dose+' '+(s.unite||'cL')+' ';
      if(s.mode==='unique')str+='\u00B7 dose unique';
      else if(s.mode==='recurrent')str+='\u00D7 '+s.nb_doses+' / '+s.freq_j+' j';
      lines.push(str);
    }
    if(op.type==='soufre'&&op.data)
      lines.push(op.data.grammes_pastille+'g \u00B7 '+op.data.nb_total+' pastilles = '+op.data.so2_total_g+' g SO\u2082');
    if(op.type==='analyse'&&op.data&&op._src==='op'){
      var parts=[];
      if(op.data.so2_libre)parts.push('SO\u2082 libre: '+op.data.so2_libre+' mg/L');
      if(op.data.so2_total)parts.push('SO\u2082 total: '+op.data.so2_total+' mg/L');
      if(op.data.av)parts.push('Alcool: '+op.data.av+'% vol.');
      if(op.data.fml&&op.data.fml!=='none'){var fl={cours:'FML en cours',ok:'FML termin\u00E9e',non:'Pas de FML'}[op.data.fml]||'';if(fl)parts.push(fl);}
      if(parts.length)lines.push(parts.join(' \u00B7 '));
      if(op.data.pdf_nom)lines.push('\uD83D\uDCC4 '+op.data.pdf_nom);
    }
    if(op.type==='analyse'&&op._src==='ana'&&op.data){
      if(op.data.label)lines.push(op.data.label);
      if(op.data.fichier)lines.push('\uD83D\uDCC4 '+op.data.fichier);
    }
    if(op.notes)lines.push('<em>'+_escHtml(op.notes)+'</em>');
    return lines.map(function(l){return _escHtml(l.replace(/<em>|<\/em>/g,''));}).join('<br>');
  }

  var typeColors={ouillage:'#7B4A1A',soutirage:'#1A5E36',soufre:'#1A5E1A',analyse:'#1D4E89',autre:'#444'};
  var typeIcos={ouillage:'\uD83E\uDEA3',soutirage:'\uD83D\uDD04',soufre:'\uD83E\uDDEA',analyse:'\uD83D\uDD2C',autre:'\uD83D\uDCDD'};
  var typeLabels={ouillage:'Ouillage',soutirage:'Soutirage',soufre:'Soufre',analyse:'Analyse',autre:'Autre'};

  function _opRow(op){
    var tc=typeColors[op.type]||'#444';
    var ti=typeIcos[op.type]||'';
    var tl=typeLabels[op.type]||op.type;
    return '<tr><td style="padding:7px 10px;white-space:nowrap;color:var(--texte-doux,#666);font-size:12px;vertical-align:top;">'+_caveDateFr(op.date)+'</td>'
      +'<td style="padding:7px 10px;vertical-align:top;"><span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;color:'+tc+';background:'+tc+'22;">'+ti+' '+tl+'</span></td>'
      +'<td style="padding:7px 10px;vertical-align:top;font-size:12px;color:var(--texte,#333);">'+_escHtml(_caveExpCuvLabelTxt(op))+'</td>'
      +'<td style="padding:7px 10px;vertical-align:top;font-size:12px;color:var(--texte-doux,#666);">'+_escHtml(_caveWho(op))+'</td>'
      +'<td style="padding:7px 10px;vertical-align:top;font-size:11px;color:var(--texte-med,#555);line-height:1.5;">'+_opDetail(op)+'</td>'
      +'</tr>';
  }

  var rows='';
  if(groupByCuv){
    var grps={};
    all.forEach(function(op){
      var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
      if(!ids.length)ids=['_none'];
      ids.forEach(function(id){if(!grps[id])grps[id]=[];grps[id].push(op);});
    });
    var cuvs=CAVE_ELEVAGE.cuvees||[];
    var sortedIds=Object.keys(grps).sort(function(a,b){
      var ca=cuvs.find(function(c){return c.id===a;}),cb=cuvs.find(function(c){return c.id===b;});
      return (ca?ca.nom:'').localeCompare(cb?cb.nom:'','fr');
    });
    sortedIds.forEach(function(cid){
      var cuv=cuvs.find(function(c){return c.id===cid;});
      var cNom=cuv?cuv.nom+(cuv.millesime?' '+cuv.millesime:''):'Autres';
      rows+='<tr><td colspan="5" style="padding:10px 10px 5px;background:#f5f0e8;font-weight:700;font-size:13px;color:#3A2A0E;border-top:2px solid #C8A060;">\uD83C\uDF77 '+_escHtml(cNom)+'</td></tr>';
      grps[cid].forEach(function(op){rows+=_opRow(op);});
    });
  } else {
    rows=all.map(_opRow).join('');
  }

  var typeLabelsAll={ouillage:'Ouillage',soutirage:'Soutirage',soufre:'Soufre',analyse:'Analyse',autre:'Autre'};
  var typeFiltLbl=_caveExpTypes.size===5?'Tous types':Array.from(_caveExpTypes).map(function(t){return typeLabelsAll[t]||t;}).join(', ');
  var cuvFiltLbl=_caveExpAllCuv?'Toutes cuv\u00E9es':Array.from(_caveExpCuvSel).map(function(id){var c=(CAVE_ELEVAGE.cuvees||[]).find(function(x){return x.id===id;});return c?c.nom+(c.millesime?' '+c.millesime:''):id;}).join(', ');
  var perFiltLbl=(deb||fin)?((deb?_caveDateFr(deb):'-')+' \u2192 '+(fin?_caveDateFr(fin):'-')):'Toutes dates';

  var css=(
    '*{box-sizing:border-box;margin:0;padding:0;}'
    +'h1{font-size:20px;font-weight:700;color:#1A0E05;margin-bottom:3px;}'
    +'.sub{font-size:13px;color:#7B4A1A;font-weight:600;margin-bottom:12px;}'
    +'.meta{font-size:11px;color:#999;margin-bottom:16px;}'
    +'.filters{display:flex;gap:24px;flex-wrap:wrap;background:#FAF5EE;border:1px solid #E8D5B0;border-radius:8px;padding:9px 14px;margin-bottom:18px;}'
    +'.fi strong{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#8B6020;margin-bottom:2px;}'
    +'.fi{font-size:11px;color:#5A3A10;}'
    +'table{width:100%;border-collapse:collapse;font-size:12px;}'
    +'th{text-align:left;padding:8px 10px;background:#2D1B09;color:#F5E6CC;font-size:10px;text-transform:uppercase;letter-spacing:.6px;}'
    +'td{border-bottom:1px solid #EEE;}'
    +'tr:nth-child(even) td{background:#FAFAFA;}'
    +'.footer{margin-top:16px;font-size:10px;color:#BBB;text-align:right;border-top:1px solid #EEE;padding-top:8px;}'
    +''
  );

  if(typeof window._mvDocOpen!=='function'){ showToast('Mise \u00e0 jour incompl\u00e8te \u2014 rechargez l\u2019application','#B85A1A'); return; }
  var corps='<div class="filters">'
    +'<div class="fi"><strong>Cuv\u00E9es</strong>'+_escHtml(cuvFiltLbl)+'</div>'
    +'<div class="fi"><strong>Types</strong>'+_escHtml(typeFiltLbl)+'</div>'
    +'<div class="fi"><strong>P\u00E9riode</strong>'+_escHtml(perFiltLbl)+'</div>'
    +'<div class="fi"><strong>Regroupement</strong>'+(groupByCuv?'Par cuv\u00E9e':'Chronologique')+'</div>'
    +'</div>'
    +'<table><thead><tr><th>Date</th><th>Type</th><th>Cuv\u00E9e(s)</th><th>Op\u00E9rateur</th><th>D\u00E9tails</th></tr></thead><tbody>'+rows+'</tbody></table>';
  window._mvDocOpen({
    titre:'Rapport d\u2019op\u00E9rations \u2014 cave', domaine:domNom, orient:'paysage', cat:'cave',
    metas:['\u00c9dit\u00e9 le '+now, all.length+' op\u00E9ration'+(all.length>1?'s':'')],
    corps:corps, css:css
  });
  window.closeOv(null,'ovCaveExport');
}

var _retraitFutCuvId=null,_retraitFutNb=1,_retraitFutRaison='vente',_retraitFutAnnee=null;
// Sort du CONTENANT apres retrait : true = le fut revient au parc a futs.
var _retraitFutGarder=true;

function openOvRetraitFut(cuvId){
  var cuv=(CAVE_ELEVAGE.cuvees||[]).find(function(c){return c.id===cuvId;});
  if(!cuv){showToast('Cuv\u00E9e introuvable','#E07060');return;}
  _retraitFutCuvId=cuvId;_retraitFutNb=1;_retraitFutRaison='vente';_retraitFutAnnee=null;
  _retraitFutGarder=true;
  var el=document.getElementById('rfut-cuv-nom');if(el)el.textContent=cuv.nom+(cuv.millesime?' '+cuv.millesime:'');
  var repart=(cuv.tonneaux||[]).filter(function(t){return (t.nb||0)>0;});
  el=document.getElementById('rfut-cuv-info');
  if(el)el.innerHTML=_caveNbTonneaux(cuv)+' tonneaux disponibles'+(repart.length?' \u00B7 '+_caveTonneauxStr(cuv):'');
  // Chips de s\u00E9lection du f\u00FBt dans la r\u00E9partition
  var lblEl=document.getElementById('rfut-annee-lbl'),zone=document.getElementById('rfut-annees');
  if(zone){
    if(repart.length){
      var curY=new Date().getFullYear();
      _retraitFutAnnee=repart[0].annee;
      zone.innerHTML=repart.map(function(t){
        var lbl=t.annee>=curY?'Neuf':t.annee;
        return '<button class="rfut-reason-btn'+(t.annee===_retraitFutAnnee?' sel':'')+'" data-annee="'+t.annee+'" onclick="window._retraitFutSetAnnee('+t.annee+',this)">'+lbl+' <span style="opacity:.65">('+t.nb+'\u00D7)</span></button>';
      }).join('');
      zone.style.display='grid';if(lblEl)lblEl.style.display='';
    } else {
      zone.innerHTML='';zone.style.display='none';if(lblEl)lblEl.style.display='none';
    }
  }
  _retraitFutUpdate(cuv);
  document.querySelectorAll('.rfut-reason-btn').forEach(function(b){b.classList.toggle('sel',b.dataset.reason==='vente');});
  _rfutRenderGarder();
  el=document.getElementById('rfut-notes');if(el)el.value='';
  var ov=document.getElementById('ovRetraitFut');if(ov)ov.classList.add('open');
}

function _retraitFutUpdate(cuv){
  var c2=cuv||(CAVE_ELEVAGE.cuvees||[]).find(function(c){return c.id===_retraitFutCuvId;});
  if(!c2)return;
  var max=_retraitFutMax(c2);
  _retraitFutNb=Math.max(1,Math.min(_retraitFutNb,max));
  var el=document.getElementById('rfut-nb');if(el)el.textContent=_retraitFutNb;
  var rest=max-_retraitFutNb;
  el=document.getElementById('rfut-calcul');if(el)el.textContent='\u2192 '+rest+' restant'+(rest>1?'s':'')+' \u00B7 \u2212'+(_retraitFutNb*_caveFutHl()).toFixed(1)+' hL';
}

function _retraitFutMax(cuv){
  if(cuv.tonneaux&&cuv.tonneaux.length&&_retraitFutAnnee!==null){
    var e=cuv.tonneaux.find(function(t){return t.annee===_retraitFutAnnee;});
    return e?(e.nb||0):0;
  }
  return _caveNbTonneaux(cuv);
}

function _retraitFutSetAnnee(annee,el){
  _retraitFutAnnee=annee;
  document.querySelectorAll('#rfut-annees .rfut-reason-btn').forEach(function(b){b.classList.toggle('sel',b===el);});
  _retraitFutNb=1;_retraitFutUpdate(null);
}

function _retraitFutAdj(d){
  _retraitFutNb+=d;_retraitFutUpdate(null);
}

function _retraitFutSetRaison(raison,el){
  _retraitFutRaison=raison;
  document.querySelectorAll('.rfut-reason-btn').forEach(function(b){b.classList.toggle('sel',b===el);});
}

async function saveRetraitFut(){
  if(!_retraitFutCuvId)return;
  var cuv=(CAVE_ELEVAGE.cuvees||[]).find(function(c){return c.id===_retraitFutCuvId;});
  if(!cuv){showToast('Cuv\u00E9e introuvable','#E07060');return;}
  var max=_retraitFutMax(cuv);
  if(_retraitFutNb<1||_retraitFutNb>max){showToast('Nombre invalide','#E07060');return;}
  var notes=((document.getElementById('rfut-notes')||{}).value||'').trim();
  var lbl={vente:'Vente',remplissage:'Cuve de remplissage',pique:'Vin piqu\u00E9',acetique:'Acide ac\u00E9tique',autre:'Autre'}[_retraitFutRaison]||_retraitFutRaison;
  var op={id:'op_'+Date.now(),type:'retrait_fut',date:new Date().toISOString().split('T')[0],
    cuvees_ids:[_retraitFutCuvId],operateur:(window.currentUser&&window.currentUser.prenom)||'',
    data:{nb_futs:_retraitFutNb,raison:_retraitFutRaison,raison_lbl:lbl,vol_retire_L:parseFloat((_retraitFutNb*_caveFutL()).toFixed(0)),annee_fut:_retraitFutAnnee},notes:notes};
  if(cuv.tonneaux&&cuv.tonneaux.length&&_retraitFutAnnee!==null){
    // Retrait dans la r\u00E9partition des tonneaux
    var entree=cuv.tonneaux.find(function(t){return t.annee===_retraitFutAnnee;});
    if(entree)entree.nb=Math.max(0,(entree.nb||0)-_retraitFutNb);
    // Le fut vide n'est pas perdu : il retourne au parc, sauf si le vigneron le
    // jette. Le motif du RETRAIT parle du VIN (vente, vin pique) ; le sort du
    // CONTENANT est une question distincte, posee dans l'overlay.
    if(typeof window._mvFutRetirer==='function' && window.INTRANTS){
      window._mvFutRetirer({nom:cuv.nom, tonneaux:[{annee:_retraitFutAnnee, nb:_retraitFutNb,
          four:(entree&&entree.four)||'', ref:(entree&&entree.ref)||''}]},
        _retraitFutAnnee, _retraitFutNb, window.INTRANTS,
        _retraitFutGarder!==false, lbl+(notes?' · '+notes:''));
      if(typeof window.saveIntrants==='function') window.saveIntrants();
    }
    cuv.tonneaux=cuv.tonneaux.filter(function(t){return (t.nb||0)>0;});
    if(typeof cuv.nb_tonneaux==='number')cuv.nb_tonneaux=_caveNbTonneaux(cuv);
  } else {
    cuv.nb_tonneaux=(cuv.nb_tonneaux||0)-_retraitFutNb;
  }
  cuv.volume_L=(cuv.volume_L||0)-(_retraitFutNb*_caveFutL());
  if(!CAVE_ELEVAGE.operations)CAVE_ELEVAGE.operations=[];
  CAVE_ELEVAGE.operations.push(op);
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  if(window.fbSave)window.fbSave('cave_elevage',CAVE_ELEVAGE);
  window.closeOv(null,'ovRetraitFut');
  showToast('\u2705 '+_retraitFutNb+' f\u00FBt'+(+_retraitFutNb>1?'s':'')+' retir\u00E9'+(+_retraitFutNb>1?'s':'')+' ('+lbl+')','#3D6B27');
  renderCave();
}

window._caveOpenPdf         = _caveOpenPdf;
window._caveOpenPdf         = _caveOpenPdf;
window.deleteCaveOp         = deleteCaveOp;
window._caveExpToggleCuv    = _caveExpToggleCuv;
window._caveExpToggleCuvById = _caveExpToggleCuvById;
window._caveExpToggleType   = _caveExpToggleType;
window.generateCaveExport   = generateCaveExport;
window._copStagePdf         = _copStagePdf;
window._copRemovePdf        = _copRemovePdf;
window._attachPdfToOp      = _attachPdfToOp;

// \u2500\u2500 Fonctions manquantes reconstruites \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

async function saveCaveAna() {
  if(!_caveAnaPendingFile){showToast('Aucun fichier s\u00E9lectionn\u00E9','#E07060');return;}
  var secLink=document.getElementById('cana-section-link');
  var isLinkMode=secLink&&secLink.style.display!=='none';
  if(isLinkMode){
    if(!_caveAnaLinkedOpIds.length){showToast('S\u00E9lectionnez au moins une op\u00E9ration','#E07060');return;}
    var linkOps=_caveAnaLinkedOpIds.map(function(lid){return(CAVE_ELEVAGE.operations||[]).find(function(o){return o.id===lid;});}).filter(Boolean);
    if(!linkOps.length){showToast('Op\u00E9rations introuvables','#E07060');return;}
    var btn=document.getElementById('cana-save-btn');
    if(btn){btn.disabled=true;btn.textContent='Envoi\u2026';}
    showSyncBadge('\u23F3 Upload PDF\u2026','#B8913A');
    try{
      var res=await window.fbUploadAnalyse(_caveAnaPendingFile,function(p){if(btn)btn.textContent='Envoi\u2026 '+p+'%';});
      linkOps.forEach(function(op){
        if(!op.data)op.data={};
        op.data.pdf_url=res.url;op.data.pdf_path=res.storage_path;
        op.data.pdf_nom=_caveAnaPendingFile.name;op.data.pdf_taille=_caveAnaPendingFile.size;
      });
      window.CAVE_ELEVAGE=CAVE_ELEVAGE;
      if(window.fbSave)window.fbSave('cave_elevage',CAVE_ELEVAGE);
      window.closeOv(null,'ovCaveAna');
      _caveAnaPendingFile=null;_caveAnaSelIds=[];_caveAnaLinkedOpIds=[];
      var nb=linkOps.length;
      showToast('\u2705 PDF rattach\u00E9 \u00E0 '+nb+' op\u00E9ration'+(nb>1?'s':''),'#3D6B27');
      showSyncBadge('\u2705 Synchronis\u00E9','#3D6B27');
      renderCave();
    }catch(e){
      showToast('Erreur upload PDF','#E07060');
      showSyncBadge('\u26A0 Erreur','#B85A1A');
      if(btn){btn.disabled=false;btn.textContent='Enregistrer';}
    }
    return;
  }
  // Mode "Nouvelle analyse" standalone
  if(!_caveAnaSelIds.length){showToast('S\u00E9lectionnez au moins une cuv\u00E9e','#E07060');return;}
  var date=(document.getElementById('cana-date')||{}).value||new Date().toISOString().split('T')[0];
  var type=(document.getElementById('cana-type')||{}).value||'autre';
  var commentaire=((document.getElementById('cana-commentaire')||{}).value||'').trim();
  var btn2=document.getElementById('cana-save-btn');
  if(btn2){btn2.disabled=true;btn2.textContent='Envoi\u2026';}
  showSyncBadge('\u23F3 Upload PDF\u2026','#B8913A');
  try{
    var res2=await window.fbUploadAnalyse(_caveAnaPendingFile,function(p){if(btn2)btn2.textContent='Envoi\u2026 '+p+'%';});
    var ana={
      id:'ana_'+Date.now(),date_analyse:date,date:date,type:type,
      cuvee_ids:_caveAnaSelIds.slice(),commentaire:commentaire,
      nom_fichier:_caveAnaPendingFile.name,taille:_caveAnaPendingFile.size,
      url:res2.url,storage_path:res2.storage_path,
      uploaded_by:(window.currentUser&&window.currentUser.prenom)||'',
      uploaded_at:new Date().toISOString()
    };
    if(!CAVE_ELEVAGE.analyses)CAVE_ELEVAGE.analyses=[];
    CAVE_ELEVAGE.analyses.push(ana);
    window.CAVE_ELEVAGE=CAVE_ELEVAGE;
    if(window.fbSave)window.fbSave('cave_elevage',CAVE_ELEVAGE);
    window.closeOv(null,'ovCaveAna');
    _caveAnaPendingFile=null;_caveAnaSelIds=[];
    showToast('\u2705 Analyse enregistr\u00E9e','#3D6B27');
    showSyncBadge('\u2705 Synchronis\u00E9','#3D6B27');
    renderCave();
  }catch(e){
    showToast('Erreur upload PDF','#E07060');
    showSyncBadge('\u26A0 Erreur','#B85A1A');
    if(btn2){btn2.disabled=false;btn2.textContent='Enregistrer';}
  }
}

function switchVendOng(tab) {
  _vendTab = tab;
  _vendRenderTab();
}

function _renderCaveAnaChips() {
  var wrap=document.getElementById('cana-cuv-chips');
  if(!wrap)return;
  var cuv=CAVE_ELEVAGE.cuvees||[];
  if(!cuv.length){wrap.innerHTML='<span style="font-size:12px;color:var(--texte-doux);">Aucune cuv\u00e9e configur\u00e9e</span>';return;}
  wrap.innerHTML=cuv.map(function(cv){
    var sel=_caveAnaSelIds.indexOf(cv.id)!==-1;
    return '<button onclick="window._toggleCaveAnaChip(\''+cv.id+'\')" style="padding:5px 11px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1.5px solid '+(sel?'#C0845A':'var(--gris)')+';background:'+(sel?'rgba(192,132,90,0.12)':'transparent')+';color:'+(sel?'#C0845A':'var(--texte-doux)')+';">'
      +cv.nom+(cv.millesime?' '+cv.millesime:'')+'</button>';
  }).join('');
  var hint=document.getElementById('cana-cuv-hint');
  if(hint)hint.textContent=_caveAnaSelIds.length?_caveAnaSelIds.length+' cuv\u00e9e'+(_caveAnaSelIds.length>1?'s':'')+' s\u00e9lectionn\u00e9e'+(_caveAnaSelIds.length>1?'s':''):'';
}

function _toggleCaveAnaChip(cuvId) {
  var idx=_caveAnaSelIds.indexOf(cuvId);
  if(idx===-1)_caveAnaSelIds.push(cuvId);
  else _caveAnaSelIds.splice(idx,1);
  _renderCaveAnaChips();
}


window.openOvCaveAna        = openOvCaveAna;
window.setCanaMode          = setCanaMode;
window.selectCanaLinkOp     = selectCanaLinkOp;
window.saveCaveAna          = saveCaveAna;
window._toggleCaveAnaChip   = _toggleCaveAnaChip;
window._renderCaveAnaChips  = _renderCaveAnaChips;
window._caveLastAna         = _caveLastAna;
window.addCuvTonneau        = addCuvTonneau;
window.removeCuvTonneau     = removeCuvTonneau;
window.updateCuvTonneau     = updateCuvTonneau;
window.CAVE_VENDANGE        = CAVE_VENDANGE;
window.renderCaveVendange   = renderCaveVendange;
window.switchVendOng        = switchVendOng;
window.openOvVendRec        = openOvVendRec;
window.saveVendRec          = saveVendRec;
window.deleteVendRec        = deleteVendRec;
window.openOvVendCuve       = openOvVendCuve;
window.saveVendCuve         = saveVendCuve;
window.deleteVendCuve       = deleteVendCuve;
window.openOvVendMesure     = openOvVendMesure;
window.saveVendMesure       = saveVendMesure;
window._vndAdjCaisses       = _vndAdjCaisses;
window._vndSyncCaisses      = _vndSyncCaisses;
window._vndSetEtat          = _vndSetEtat;
window._vndToggleVendu      = _vndToggleVendu;
window._vndSetEr            = _vndSetEr;
window._vndToggleMpf        = _vndToggleMpf;
window._vmAdjRem            = _vmAdjRem;
window._vmAdjPig            = _vmAdjPig;
window._vendSaveParam       = _vendSaveParam;
window.setCopSoufreG        = setCopSoufreG;
window.setCopSoufreMode     = setCopSoufreMode;
window._copUpdateSoufreCalc = _copUpdateSoufreCalc;
window.openOvCaveConvert    = openOvCaveConvert;
window.setConvMode          = setConvMode;
window.setConvDil           = setConvDil;
window.onConvDilInput       = onConvDilInput;
window._calcConvLiq         = _calcConvLiq;
window._calcConvPast        = _calcConvPast;
window.setCaveJFilter       = setCaveJFilter;
window.renderCaveJournal    = renderCaveJournal;
window.openCuveeDetail      = openCuveeDetail;
window.deleteCuveeById      = deleteCuveeById;
window._toggleEditAnaChip   = _toggleEditAnaChip;
window.saveCaveAnaEdit      = saveCaveAnaEdit;
window._onCaveAnaFileChange = _onCaveAnaFileChange;
window.openOvRetraitFut     = openOvRetraitFut;
window.saveRetraitFut       = saveRetraitFut;
window._retraitFutAdj       = _retraitFutAdj;
window._retraitFutSetRaison = _retraitFutSetRaison;
window._retraitFutSetAnnee  = _retraitFutSetAnnee;



// ══════════════════════════════════════════════════════════════════
// ── AJOUTS v2 : Analyses maturité (Cuvier) · Millésimes + Mise en
//    bouteille (Le Chai). Injections DOM+CSS idempotentes → aucun bump.
// ══════════════════════════════════════════════════════════════════
var _vendAnaUnitMode = 'sucre';   // 'sucre' (g/L) | 'alc' (%vol)
var _caveMillFilter  = 'tous';    // filtre millésime Le Chai
var _caveBtlConfirm  = null;      // id cuvée en attente de confirmation d'embouteillage

function _mvBtl(hl){ return Math.round((hl||0)*100/0.75); }               // bouteilles 75 cl
function _mvF1(n){ return (Math.round((n||0)*10)/10).toString().replace('.',','); }
// Le coefficient sucre/degre est FIGE dans l'analyse au moment de la saisie.
// Sans cela, changer le reglage aujourd'hui redresserait retroactivement toutes
// les mesures saisies dans l'autre unite : le passe se reecrirait tout seul.
// Les analyses d'avant portent le reglage courant en repli — zero ecriture.
function _anaSpd(a, def){
  var f = parseFloat(a && a.spd);
  if(f > 0) return f;
  return def || (_vendCfg().sucre_par_degre) || 16.83;
}
function _vendAnaAlc(a){ var spd=_anaSpd(a); return a.mode==='alc'?(a.val||0):((a.val||0)/spd); }

function _caveV2InjectCss(){
  if(document.getElementById('mv-cave-v2-css')) return;
  var s=document.createElement('style'); s.id='mv-cave-v2-css';
  s.textContent=''
  /* — Seuil d'ouillage par millésime (Réglages du Chai) — */
  +'.mvc-set-sep{height:1px;background:var(--gris-clair);margin:14px 0 10px}'
  +'.mvc-milrow{display:flex;align-items:center;gap:9px;padding:7px 0;border-top:1px solid rgba(0,0,0,.05)}'
  +'.mvc-milrow:first-of-type{border-top:none}'
  +'.mvc-milrow-a{flex:1;font-size:13px;font-weight:600;color:var(--texte)}'
  +'.mvc-milrow-v{min-width:52px;text-align:center;font-size:13px;font-weight:600;color:var(--texte-doux)}'
  +'.mvc-milrow-v.own{color:var(--vert-med,#3D6B27)}'
  +'.mvc-step-btn.sm{width:34px;height:34px;min-width:34px;font-size:17px;line-height:1}'
  +'.mvc-milrow-x{width:30px;height:30px;min-width:30px;border:none;background:transparent;color:var(--texte-doux);font-size:14px;cursor:pointer;border-radius:8px}'
  +'.mvc-milrow-x:hover{background:var(--gris-clair)}'
  /* — Soutirage sur la carte de cuvée — */
  +'.mvc-cuv-sout{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:5px}'
  +'.mvc-tag-sout{background:rgba(93,124,168,.12);color:#4A6E9C;border:1px solid rgba(93,124,168,.25)}'
  +'.mvc-sout-note{font-size:10px;color:var(--texte-doux)}'
  /* — Synthese de maturite a date (Cuvier > Analyses) — */
  +'.mvsy{background:var(--bg-card,#FBFAF6);border:1px solid var(--gris-clair,#ECE6DA);border-radius:14px;padding:15px;margin:2px 0 14px;box-shadow:0 1px 4px rgba(20,17,13,.06)}'
  +'.mvsy-hd{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:11px}'
  +'.mvsy-ttl{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);font-weight:600}'
  +'.mvsy-dt{font-size:11px;color:var(--texte-doux,#5F5F5F);font-variant-numeric:tabular-nums}'
  +'.mvsy-fen{display:flex;border:1px solid var(--gris-clair,#ECE6DA);border-radius:9px;overflow:hidden;margin-bottom:12px}'
  +'.mvsy-fen button{flex:1;background:var(--bg-card,#FBFAF6);border:0;padding:9px 4px;font-family:inherit;font-size:12px;color:var(--texte-doux,#5F5F5F);cursor:pointer;border-left:1px solid var(--gris-clair,#ECE6DA);min-height:38px}'
  +'.mvsy-fen button:first-child{border-left:0}'
  +'.mvsy-fen button.on{background:var(--terre,#8A5A38);color:#fff;font-weight:600}'
  +'.mvsy-tiles{display:flex;gap:8px}'
  +'.mvsy-t{flex:1;min-width:0;position:relative;overflow:hidden;display:block;text-align:left;font-family:inherit;color:inherit;cursor:pointer;background:var(--blanc,#FBFAF6);border:1px solid var(--gris-clair,#ECE6DA);border-radius:12px;padding:10px 9px 9px}'
  +'.mvsy-t::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--gris,#DED7C9)}'
  +'.mvsy-t.dom::before{background:var(--terre,#8A5A38)}'
  +'.mvsy-t.rge::before{background:var(--rouge,#A0291E)}'
  +'.mvsy-t.bl::before{background:var(--or,#C2A14D)}'
  +'.mvsy-t.sel{border-color:var(--terre,#8A5A38);box-shadow:0 0 0 2px var(--terre-pale,#F3EADF)}'
  +'.mvsy-t .lb{display:block;font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);font-weight:600}'
  +'.mvsy-t .gl{display:block;font-size:23px;font-weight:700;color:var(--texte,#2A241C);line-height:1.1;margin-top:3px;font-variant-numeric:tabular-nums}'
  +'.mvsy-t .gl em{font-style:normal;font-size:11px;font-weight:500;color:var(--texte-doux,#5F5F5F);margin-left:2px}'
  +'.mvsy-t .al{display:block;font-size:13px;font-weight:600;color:var(--bordeaux,#7A1020);font-variant-numeric:tabular-nums}'
  +'.mvsy-t .cv{display:block;font-size:10px;color:var(--texte-doux,#5F5F5F);margin-top:5px;line-height:1.35}'
  +'.mvsy-t.vide .gl{color:var(--texte-doux,#5F5F5F);font-size:17px;font-weight:600}'
  +'.mvsy-simple{font-size:10.5px;color:var(--texte-doux,#5F5F5F);margin-top:8px;text-align:center;font-variant-numeric:tabular-nums}'
  +'.mvcl{margin-top:14px;padding-top:12px;border-top:1px solid var(--gris-clair,#ECE6DA)}'
  +'.mvcl-hd{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:9px}'
  +'.mvcl-ttl{font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);font-weight:600}'
  +'.mvcl-n{font-size:10.5px;color:var(--texte-doux,#5F5F5F)}'
  +'.mvcl-vide{font-size:12px;color:var(--texte-doux,#5F5F5F);padding:6px 0}'
  +'.mvcl-grad{display:grid;grid-template-columns:96px 1fr 52px;align-items:center;height:14px;margin-bottom:2px}'
  +'.mvcl-grad .g{position:relative;height:100%}'
  +'.mvcl-grad .g span{position:absolute;top:0;transform:translateX(-50%);font-size:9.5px;color:var(--texte-doux,#5F5F5F);font-variant-numeric:tabular-nums;white-space:nowrap}'
  +'.mvcl-zone{position:relative}'
  +'.mvcl-ov{position:absolute;left:96px;right:52px;top:0;bottom:0;pointer-events:none}'
  +'.mvcl-ov i{position:absolute;top:0;bottom:0;width:0;border-left:1.5px dashed var(--terre,#8A5A38);opacity:.55}'
  +'.mvcl-ov i.obj{border-left-style:solid;border-color:var(--vert-med,#3D6B27);opacity:.75}'
  +'.mvcl-ov b{position:absolute;top:-1px;transform:translateX(-50%);font-size:9px;font-weight:700;padding:1px 4px;border-radius:5px;white-space:nowrap;letter-spacing:.04em}'
  +'.mvcl-ov b.moy{background:var(--terre,#8A5A38);color:#fff}'
  +'.mvcl-ov b.obj{background:var(--vert-med,#3D6B27);color:#fff}'
  +'.mvcl-r{display:grid;grid-template-columns:96px 1fr 52px;align-items:center;height:26px}'
  +'.mvcl-r .n{font-size:11.5px;font-weight:600;color:var(--texte,#2A241C);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:7px}'
  +'.mvcl-r .pi{position:relative;height:100%}'
  +'.mvcl-r .pi::before{content:"";position:absolute;left:0;right:0;top:50%;height:1.5px;margin-top:-.75px;background:var(--gris-clair,#ECE6DA);border-radius:2px}'
  +'.mvcl-r .dot{position:absolute;top:50%;width:11px;height:11px;margin-top:-5.5px;margin-left:-5.5px;border-radius:50%;background:var(--gris,#DED7C9);box-shadow:0 0 0 2px var(--bg-card,#FBFAF6)}'
  +'.mvcl-r .dot.r{background:var(--rouge,#A0291E)}'
  +'.mvcl-r .dot.b{background:var(--or,#C2A14D)}'
  +'.mvcl-r .dot.q{background:var(--texte-doux,#5F5F5F)}'
  +'.mvcl-r .dot.old{background:var(--bg-card,#FBFAF6);border:2px solid var(--gris,#DED7C9)}'
  +'.mvcl-r .dot.old.r{border-color:var(--rouge,#A0291E)}'
  +'.mvcl-r .dot.old.b{border-color:var(--or,#C2A14D)}'
  +'.mvcl-r .v{text-align:right;font-size:12px;font-weight:700;color:var(--texte,#2A241C);font-variant-numeric:tabular-nums;line-height:1.05}'
  +'.mvcl-r .v s{text-decoration:none;display:block;font-size:9.5px;font-weight:500;color:var(--texte-doux,#5F5F5F)}'
  +'.mvcl-r .v.conv b{border-bottom:1px dotted var(--texte-doux,#5F5F5F)}'
  +'.mvcl-r.pale .n{font-weight:500;color:var(--texte-doux,#5F5F5F)}'
  +'.mvcl-r.pale .v{font-weight:600;color:var(--texte-doux,#5F5F5F)}'
  +'.mvcl-r.out .n{text-decoration:line-through;text-decoration-thickness:1px}'
  +'.mvcl-sep{font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);padding:9px 0 3px;border-top:1px solid var(--gris-clair,#ECE6DA);margin-top:5px}'
  +'.mvcl-plus{display:block;font-size:11px;color:var(--terre,#8A5A38);background:none;border:0;font-family:inherit;padding:8px 0 2px;cursor:pointer;text-align:left;text-decoration:underline}'
  +'.mvcl-lg{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;font-size:10.5px;color:var(--texte-doux,#5F5F5F)}'
  +'.mvcl-lg span{display:inline-flex;align-items:center;gap:5px}'
  +'.mvcl-lg i{width:10px;height:10px;border-radius:50%;background:var(--gris,#DED7C9);flex:none}'
  +'.mvcl-lg i.pl{background:var(--terre,#8A5A38)}'
  +'.mvcl-lg i.cr{background:transparent;border:2px solid var(--gris,#DED7C9)}'
  +'.mvcl-lg i.tr{width:0;height:11px;border-radius:0;border-left:1.5px dashed var(--terre,#8A5A38);background:none}'
  +'.mvcl-lg i.cv{width:auto;height:auto;border-radius:0;background:none;font-style:normal;border-bottom:1px dotted var(--texte-doux,#5F5F5F);line-height:1}'
  +'.mvcl-pied{font-size:10.5px;color:var(--texte-doux,#5F5F5F);margin-top:8px;line-height:1.45}'
  +'.mvsy-ec{font-size:12px;color:var(--texte-med,#4A4A3A);margin-top:11px;padding-top:10px;border-top:1px solid var(--gris-clair,#ECE6DA);line-height:1.5}'
  +'.mvsy-ec b{color:var(--terre,#8A5A38);font-weight:700}'
  +'.mvsy-warn{font-size:11.5px;line-height:1.5;color:var(--texte-med,#4A4A3A);background:var(--orange-pale,#FBF0E6);border-radius:9px;padding:9px 10px;margin-top:10px}'
  +'.mvsy-warn b{color:var(--orange,#B85A1A)}'
  +'.mvsy-info{font-size:11.5px;line-height:1.5;color:var(--texte-doux,#5F5F5F);margin-top:9px}'
  +'.mvsy-info b{color:var(--texte-med,#4A4A3A);font-weight:600}'
  +'.mvsy-cls{margin-top:11px;padding-top:10px;border-top:1px solid var(--gris-clair,#ECE6DA)}'
  +'.mvsy-cls .t{font-size:11.5px;color:var(--texte-med,#4A4A3A);margin-bottom:7px;line-height:1.45}'
  +'.mvsy-clr{display:flex;align-items:center;gap:7px;padding:5px 0}'
  +'.mvsy-clr .n{font-size:12.5px;font-weight:600;color:var(--texte,#2A241C);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
  +'.mvsy-clr button{font-family:inherit;font-size:11.5px;font-weight:600;padding:6px 12px;border-radius:8px;border:1px solid var(--gris,#DED7C9);background:var(--bg-card,#FBFAF6);color:var(--texte-doux,#5F5F5F);cursor:pointer;min-height:38px}'
  +'.mvsy-clr button.r.on{background:var(--rouge,#A0291E);border-color:var(--rouge,#A0291E);color:#fff}'
  +'.mvsy-clr button.b.on{background:var(--or,#C2A14D);border-color:var(--or,#C2A14D);color:#241B08}'
  +'@media(max-width:360px){.mvcl-grad,.mvcl-r{grid-template-columns:78px 1fr 46px}.mvcl-ov{left:78px;right:46px}}'
  /* — Analyses maturité — */
  +'.mva-form{background:linear-gradient(180deg,#fff,var(--terre-pale,#F3EADF));border:1px solid rgba(201,168,76,.35);border-radius:14px;padding:14px;margin:2px 0 14px}'
  +'.mva-frow{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end}'
  +'.mva-fld{flex:1;min-width:110px}'
  +'.mva-fld label{display:block;font-size:10px;letter-spacing:.06em;color:var(--texte-doux,#5F5F5F);margin-bottom:4px;text-transform:uppercase}'
  +'.mva-fld input,.mva-fld select{width:100%;font-family:inherit;font-size:14px;padding:9px 10px;border:1px solid rgba(138,90,56,.3);border-radius:9px;background:#fff;color:var(--texte,#2A241C)}'
  +'.mva-useg{display:flex;border:1px solid rgba(138,90,56,.3);border-radius:9px;overflow:hidden}'
  +'.mva-useg button{flex:1;background:#fff;border:0;padding:9px 6px;font-family:inherit;font-size:12.5px;font-weight:500;color:var(--texte-doux,#5F5F5F);cursor:pointer}'
  +'.mva-useg button.on{background:var(--terre,#8A5A38);color:#fff}'
  +'.mva-add{background:linear-gradient(180deg,var(--or,#C9A84C),#B8952F);color:#241B08;border:0;font-weight:600;font-size:13px;padding:10px 14px;border-radius:9px;cursor:pointer;white-space:nowrap;min-height:44px}'
  +'.mva-derived{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px dashed rgba(138,90,56,.25)}'
  +'.mva-derived div{font-size:11px;color:var(--texte-doux,#5F5F5F)}'
  +'.mva-derived b{display:block;font-size:18px;color:var(--terre,#8A5A38);font-weight:700}'
  +'.mvap-tot{display:flex;align-items:baseline;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid var(--gris-clair,#ECE6DA)}'
  +'.mvap-tot span{display:flex;flex-direction:column;align-items:center;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F)}'
  +'.mvap-tot span b{font-size:21px;font-weight:600;letter-spacing:0;text-transform:none;color:var(--texte,#2A241C);font-variant-numeric:tabular-nums}'
  +'.mvap-tot span.hl b{color:var(--terre,#8A5A38)}'
  +'.mvap-tot em{font-style:normal;font-size:11px;color:var(--texte-doux,#5F5F5F);font-variant-numeric:tabular-nums}'
  +'.mvap-note{font-size:11.5px;color:var(--texte-doux,#5F5F5F);margin-top:10px;line-height:1.5}'
  +'.mvfm-lg{display:flex;gap:14px;flex-wrap:wrap;font-size:11.5px;color:var(--texte-doux,#5F5F5F);margin-top:11px}'
  +'.mvfm-lg span{display:inline-flex;align-items:center;gap:6px}'
  +'.mvfm-lg i.l{width:15px;height:3px;border-radius:2px}'
  +'.mvfm-lg i.d{width:15px;height:0;border-top:2px dashed}'
  +'.mvfm-ops{display:flex;flex-direction:column;gap:4px;margin-top:10px}'
  +'.mvfm-op{display:flex;align-items:baseline;gap:7px;font-size:12px;color:var(--texte-med,#4A4A3A)}'
  +'.mvfm-op i{width:7px;height:7px;border-radius:50%;background:var(--or,#C2A14D);flex:none}'
  +'.mvfm-op b{font-weight:600;color:var(--texte,#2A241C);font-variant-numeric:tabular-nums}'
  +'.mvfm-note{font-size:11.5px;color:var(--texte-doux,#5F5F5F);margin-top:10px;line-height:1.5}'
  +'.mvfm-fin{font-size:12.5px;color:var(--texte-med,#4A4A3A);margin-top:10px;padding-top:10px;border-top:1px solid var(--gris-clair,#ECE6DA)}'
  +'.mvfm-fin b{color:var(--terre,#8A5A38)}'
  +'.mvcv-ord{font-size:12.5px;color:var(--texte-med,#4A4A3A);margin-top:12px;padding-top:10px;border-top:1px solid var(--gris-clair,#ECE6DA)}'
  +'.mvcv-ord b{color:var(--terre,#8A5A38);font-weight:700}'
  +'.mvcv-note{font-size:11.5px;color:var(--texte-doux,#5F5F5F);margin-top:8px;line-height:1.5}'
  +'.mvmat-lg{display:flex;flex-direction:column;gap:5px;margin-top:12px}'
  +'.mvmat-it{display:flex;align-items:baseline;gap:7px;font-size:12px;line-height:1.35}'
  +'.mvmat-it i{width:11px;height:3px;border-radius:2px;flex:none;position:relative;top:-3px}'
  +'.mvmat-it b{font-weight:600;color:var(--texte,#2A241C)}'
  +'.mvmat-it em{font-style:normal;color:var(--texte-doux,#5F5F5F);font-variant-numeric:tabular-nums;margin-left:auto;text-align:right}'
  +'.mvmat-note{font-size:11.5px;color:var(--texte-doux,#5F5F5F);margin-top:8px}'
  +'.mvmat-ord{font-size:12.5px;color:var(--texte-med,#4A4A3A);margin-top:10px;padding-top:10px;border-top:1px solid var(--gris-clair,#ECE6DA)}'
  +'.mvmat-card{background:var(--bg-card,#FBFAF6);border-radius:14px;padding:15px;margin-bottom:14px;box-shadow:0 1px 4px rgba(20,17,13,.06);border:1px solid var(--gris-clair,#ECE6DA)}'
  +'.mvmat-ttl{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);font-weight:600;margin-bottom:10px}'
  +'.mva-card{background:var(--bg-card,#FBFAF6);border-radius:14px;padding:15px;margin-bottom:12px;box-shadow:0 1px 4px rgba(20,17,13,.06);border:1px solid rgba(138,90,56,.08)}'
  +'.mva-cname{font-size:17px;font-weight:600;color:var(--texte,#2A241C)}'
  +'.mva-meta{font-size:12px;color:var(--texte-doux,#5F5F5F);margin-top:2px}'
  +'.mva-line{display:flex;gap:16px;align-items:center;margin-top:8px;font-size:13px;flex-wrap:wrap}'
  +'.mva-line .pot{color:var(--bordeaux,#7A1020);font-weight:700}'
  +'.mva-spark{width:100%;height:118px;display:block;margin-top:8px}'
  +'.mva-rows{margin-top:8px;border-top:1px solid rgba(138,90,56,.12);padding-top:6px}'
  +'.mva-row{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--texte-doux,#5F5F5F);padding:3px 0}'
  +'.mva-x{background:none;border:0;color:var(--texte-doux,#5F5F5F);cursor:pointer;font-size:15px;min-width:40px;min-height:40px}'
  +'.mva-hint{font-size:11.5px;color:var(--texte-doux,#5F5F5F);font-style:italic;margin:2px 0 10px}'
  /* — Chips millésime — */
  +'.mvcm-chips{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin:2px 0 12px}'
  +'.mvcm-lab{font-size:10px;letter-spacing:.1em;color:var(--texte-doux,#5F5F5F);text-transform:uppercase;margin-right:2px}'
  +'.mvcm-chip{font-size:12.5px;font-weight:500;padding:6px 13px;border-radius:99px;border:1px solid rgba(138,90,56,.25);background:var(--bg-card,#FBFAF6);color:var(--terre,#8A5A38);cursor:pointer}'
  +'.mvcm-chip.on{background:var(--cave,#14110D);color:var(--or,#C9A84C);border-color:var(--cave,#14110D)}'
  +'.mvcm-c{opacity:.6;font-size:10.5px;margin-left:4px}'
  /* — Mise en bouteille — */
  +'.mvb-sec{font-size:10px;letter-spacing:.13em;color:var(--terre,#8A5A38);text-transform:uppercase;margin:6px 0 8px;font-weight:600}'
  +'.mvb-sec.sep{border-top:1px solid rgba(138,90,56,.15);padding-top:14px;margin-top:16px}'
  +'.mvb-card{background:var(--bg-card,#FBFAF6);border-radius:14px;padding:15px;margin-bottom:12px;box-shadow:0 1px 4px rgba(20,17,13,.06);border:1px solid rgba(138,90,56,.08);position:relative}'
  +'.mvb-badge{position:absolute;top:14px;right:14px;font-size:12.5px;font-weight:700;color:var(--terre,#8A5A38);background:var(--terre-pale,#F3EADF);border-radius:8px;padding:3px 9px}'
  +'.mvb-name{font-size:18px;font-weight:600;color:var(--texte,#2A241C)}'
  +'.mvb-meta{font-size:12px;color:var(--texte-doux,#5F5F5F);margin-top:2px}'
  +'.mvb-line{font-size:13.5px;margin-top:9px}'
  +'.mvb-line b{font-weight:700;color:var(--terre,#8A5A38)}'
  +'.mvb-frow{display:flex;gap:8px;align-items:flex-end;margin-top:10px;flex-wrap:wrap}'
  +'.mvb-fld label{display:block;font-size:10px;letter-spacing:.06em;color:var(--texte-doux,#5F5F5F);margin-bottom:4px;text-transform:uppercase}'
  +'.mvb-fld input{width:150px;max-width:100%;font-family:inherit;font-size:14px;padding:9px 10px;border:1px solid rgba(138,90,56,.3);border-radius:9px;background:#fff;color:var(--texte,#2A241C)}'
  +'.mvb-btn{background:linear-gradient(180deg,#8A5A38,#6E4326);color:#fff;border:0;font-weight:600;font-size:14px;padding:12px 18px;border-radius:11px;cursor:pointer;min-height:44px}'
  +'.mvb-yes{background:linear-gradient(180deg,var(--vert-med,#3D6B27),#2E5220);color:#fff;border:0;font-weight:600;font-size:14px;padding:12px 16px;border-radius:11px;cursor:pointer;min-height:44px}'
  +'.mvb-no{background:#fff;border:1px solid rgba(138,90,56,.3);color:var(--texte-doux,#5F5F5F);font-weight:500;font-size:14px;padding:12px 16px;border-radius:11px;cursor:pointer;min-height:44px}'
  +'.mvb-ask{font-size:12.5px;color:var(--bordeaux,#7A1020);margin:10px 0 6px;font-weight:500}'
  +'.mvb-grp{margin-bottom:14px}'
  +'.mvb-grphead{font-size:15px;font-weight:700;color:var(--terre,#8A5A38);border-bottom:2px solid rgba(201,168,76,.35);padding-bottom:5px;margin-bottom:8px}'
  +'.mvb-split{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:8px}'
  +'.mvb-tot{font-size:30px;font-weight:700;color:var(--bordeaux,#7A1020);line-height:1}'
  +'.mvb-tot small{font-size:11px;color:var(--texte-doux,#5F5F5F);display:block;letter-spacing:.08em;text-transform:uppercase;font-weight:400}'
  +'.mvb-hint{font-size:11.5px;color:var(--texte-doux,#5F5F5F);font-style:italic;margin:2px 0 10px}'
  +'.mvb-empty{text-align:center;color:var(--texte-doux,#5F5F5F);padding:34px 20px;font-size:13px}';
  document.head.appendChild(s);
}

// ─────────── ANALYSES DE MATURITÉ (Cuvier) ───────────
// ═══════════════════════════════════════════════════════════════════════════
// LOT M2 — Apports par parcelle. Ce qui se decide : rien. Ce qu'il prouve :
// le rendement de chaque parcelle sort tout seul, le jour meme.
// ═══════════════════════════════════════════════════════════════════════════
var MV_APP_MAX = 10;

function _apportsRangs(recs){
  var byP = {};
  recs.forEach(function(r){
    if(!r || !r.parcelle) return;
    var o = byP[r.parcelle] || (byP[r.parcelle] = { nom:r.parcelle, caisses:0, kg:0 });
    o.caisses += (r.nb_caisses || 0);
    o.kg += _recKg(r);
  });
  return Object.keys(byP).map(function(n){
    var o = byP[n], p = _vendParcByName(n);
    o.ha = p ? (parseFloat(p.surface) || 0) : 0;
    o.hl = _vendCuvHl(o.caisses);
    o.hlHa = o.ha > 0 ? o.hl / o.ha : null;
    return o;
  }).sort(function(a,b){ return b.caisses - a.caisses; });
}

function _vendApportsSvg(recs, w){
  var rs = _apportsRangs(recs || []);
  if(!rs.length) return window._mvGraphVide('Aucun apport pes\u00e9 pour l\u2019instant',
    'Chaque pes\u00e9e de caisses au quai alimente ce graphe.');
  var caches = Math.max(0, rs.length - MV_APP_MAX);
  rs = rs.slice(0, MV_APP_MAX);

  var c0 = window._mvGraphCadre(w, 100), et = c0.etroit;
  var rowH = et ? 46 : 30, pT = et ? 12 : 14, pB = 8;
  var c = window._mvGraphCadre(w, pT + rs.length * rowH + pB,
    { padL: et ? 0 : 168, padR: et ? 0 : 150, padT: pT, padB: pB });
  var W = c.w, iw = c.iw, mx = rs[0].caisses || 1;
  var g = '';
  rs.forEach(function(o, i){
    var y = pT + i * rowH, bw = Math.max(2, o.caisses / mx * iw);
    var kgTxt = Math.round(o.kg) + ' kg';
    var rdt = o.hlHa != null ? _mvF1(o.hlHa) + ' hL/ha' : '\u2014';
    if(et){
      g += '<text x="0" y="' + (y + 11) + '" font-size="' + c.txt.axe + '" font-weight="600" fill="var(--texte)">' + _escHtml(o.nom) + '</text>'
        + '<text x="' + W + '" y="' + (y + 11) + '" text-anchor="end" font-size="' + c.txt.axe + '" fill="' + c.col.texte + '">' + kgTxt + ' \u00b7 ' + rdt + '</text>'
        + '<rect x="0" y="' + (y + 18) + '" width="' + iw.toFixed(1) + '" height="15" rx="4" fill="' + c.col.mesure + '" opacity=".16"/>'
        + '<rect x="0" y="' + (y + 18) + '" width="' + bw.toFixed(1) + '" height="15" rx="4" fill="' + c.col.mesure + '"/>'
        + '<text x="7" y="' + (y + 29) + '" font-size="' + c.txt.mini + '" font-weight="700" fill="#fff">' + o.caisses + ' caisses</text>';
    } else {
      g += '<text x="' + (c.padL - 12) + '" y="' + (y + 15) + '" text-anchor="end" font-size="' + c.txt.axe + '" font-weight="600" fill="var(--texte)">' + _escHtml(o.nom) + '</text>'
        + '<text x="' + (c.padL - 12) + '" y="' + (y + 26) + '" text-anchor="end" font-size="' + c.txt.mini + '" fill="' + c.col.texte + '">' + (o.ha > 0 ? _mvF1(o.ha) + ' ha' : '') + '</text>'
        + '<rect x="' + c.padL + '" y="' + (y + 4) + '" width="' + iw.toFixed(1) + '" height="18" rx="4" fill="' + c.col.mesure + '" opacity=".16"/>'
        + '<rect x="' + c.padL + '" y="' + (y + 4) + '" width="' + bw.toFixed(1) + '" height="18" rx="4" fill="' + c.col.mesure + '"/>'
        + '<text x="' + (c.padL + 8) + '" y="' + (y + 17) + '" font-size="' + c.txt.mini + '" font-weight="700" fill="#fff">' + o.caisses + ' caisses</text>'
        + '<text x="' + (W - 80) + '" y="' + (y + 17) + '" text-anchor="end" font-size="' + c.txt.axe + '" font-weight="600" fill="var(--texte)">' + kgTxt + '</text>'
        + '<text x="' + W + '" y="' + (y + 17) + '" text-anchor="end" font-size="' + c.txt.axe + '" fill="' + c.col.texte + '">' + rdt + '</text>';
    }
  });
  var tete = rs[0].nom, teteC = rs[0].caisses;
  var aria = 'Apports par parcelle : ' + rs.length + ' parcelles pes\u00e9es, ' + tete + ' en t\u00eate avec ' + teteC + ' caisses.';
  return window._mvGraphSvg(c, aria, g) + _apportsPied(rs, caches);
}

// Le pied porte la conversion, en FOURCHETTE. Le rendement en jus n'est pas
// connu avant le pressoir : annoncer un seul chiffre serait plus faux que
// d'annoncer une plage, meme si l'app calcule ailleurs sur le milieu.
function _apportsPied(rs, caches){
  var cfg = _vendCfg();
  var caisses = rs.reduce(function(s,o){ return s + o.caisses; }, 0);
  var kg = rs.reduce(function(s,o){ return s + o.kg; }, 0);
  var rmin = parseFloat(cfg.ratio_min) || 130, rmax = parseFloat(cfg.ratio_max) || 140;
  var h = '<div class="mvap-tot">'
    + '<span><b>' + caisses.toLocaleString('fr-FR') + '</b>caisses pes\u00e9es</span>'
    + '<em>\u00d7 ' + (cfg.poids_caisse_kg || 25) + ' kg</em>'
    + '<span><b>' + Math.round(kg).toLocaleString('fr-FR') + '</b>kilos</span>'
    + '<em>\u00f7 ' + Math.round(rmin) + '\u2013' + Math.round(rmax) + '</em>'
    + '<span class="hl"><b>' + Math.round(kg/rmax) + '\u2013' + Math.round(kg/rmin) + '</b>hectolitres</span>'
    + '</div>'
    + '<div class="mvap-note">Au quai on compte des caisses, pas des hectolitres. La conversion donne une '
    + '<b>fourchette</b> plut\u00f4t qu\u2019un chiffre faux : le rendement en jus n\u2019est jamais connu avant le pressoir.</div>';
  if(caches > 0) h += '<div class="mvap-note">Les ' + rs.length + ' parcelles les plus apport\u00e9es. '
    + caches + ' autre' + (caches > 1 ? 's' : '') + ' plus bas.</div>';
  return h;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOT M3 — La fermentation : densite, temperature, et les operations DATEES
// sur le meme axe. La seule remontee de la courbe s'explique par une
// chaptalisation ; sans les reperes, personne ne peut le voir.
// ═══════════════════════════════════════════════════════════════════════════
function _vendFermSvg(cu, w){
  var mes = ((cu && cu.mesures_fa) || []).slice()
    .filter(function(m){ return m && m.date && m.densite != null; })
    .sort(function(a,b){ return a.date < b.date ? -1 : 1; });
  if(mes.length < 3) return window._mvGraphVide('Pas encore assez de relev\u00e9s sur cette cuve',
    'Trois densit\u00e9s suffisent \u00e0 tracer la cin\u00e9tique et \u00e0 projeter la fin.');

  var t0 = Date.parse(mes[0].date), t1 = Date.parse(mes[mes.length-1].date);
  if(!(t1 > t0)) t1 = t0 + 86400000;
  var c0 = window._mvGraphCadre(w, 100), et = c0.etroit;
  // A l'etroit, l'axe des temperatures passe dans la legende : deux axes
  // chiffres ne tiennent pas sur un telephone.
  var deuxAxes = !et;
  var c = window._mvGraphCadre(w, et ? 232 : 288,
    { padL: et ? 44 : 52, padR: deuxAxes ? 44 : 12, padT: 26, padB: et ? 30 : 34 });
  var W = c.w, pL = c.padL, pT = c.padT, iw = c.iw, ih = c.ih;

  var ds = mes.map(function(m){ return _vendMesD20(m); });
  var dMin = Math.min(_ML_D20_SEC - 6, Math.min.apply(null, ds) - 4);
  var dMax = Math.max.apply(null, ds) + 6;
  var temps = mes.map(function(m){ return m.temp_c; }).filter(function(x){ return x != null; });
  var tMin = temps.length ? Math.min.apply(null, temps) - 3 : 10;
  var tMax = temps.length ? Math.max.apply(null, temps) + 3 : 35;
  if(tMax - tMin < 8){ tMax = tMin + 8; }

  function X(t){ return pL + (Math.max(t0, Math.min(t1, t)) - t0) / (t1 - t0) * iw; }
  function Yd(v){ return pT + ih - (Math.max(dMin, Math.min(dMax, v)) - dMin) / (dMax - dMin) * ih; }
  function Yt(v){ return pT + ih - (Math.max(tMin, Math.min(tMax, v)) - tMin) / (tMax - tMin) * ih; }
  function jour(t){ return Math.round((t - t0) / 86400000); }

  var g = '';
  for(var i = 0; i <= c.grad; i++){
    var v = dMin + (dMax - dMin) * i / c.grad, y = Yd(v);
    g += '<line x1="' + pL + '" y1="' + y.toFixed(1) + '" x2="' + (W - c.padR) + '" y2="' + y.toFixed(1) + '" stroke="' + c.col.grille + '" stroke-width="' + c.trait.grille + '"/>'
      + '<text x="' + (pL - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="' + c.txt.axe + '" fill="' + c.col.texte + '">' + Math.round(v) + '</text>';
    if(deuxAxes){
      var tv = tMin + (tMax - tMin) * i / c.grad;
      g += '<text x="' + (W - c.padR + 8) + '" y="' + (y + 4).toFixed(1) + '" font-size="' + c.txt.axe + '" fill="' + c.col.attention + '">' + Math.round(tv) + '\u00b0</text>';
    }
  }
  g += '<text x="' + (pL - 8) + '" y="' + (pT - 10) + '" text-anchor="end" font-size="' + c.txt.unite + '" fill="' + c.col.texte + '">d20</text>';

  // Le seuil du vin sec : la meme constante que la projection de fin.
  var ysec = Yd(_ML_D20_SEC);
  g += '<line x1="' + pL + '" y1="' + ysec.toFixed(1) + '" x2="' + (W - c.padR) + '" y2="' + ysec.toFixed(1) + '" stroke="' + c.col.fait + '" stroke-width="' + c.trait.seuil + '" stroke-dasharray="5 4"/>'
    + '<text x="' + (pL + 6) + '" y="' + (ysec - 6).toFixed(1) + '" font-size="' + c.txt.mini + '" font-weight="700" fill="' + c.col.fait + '">' + _ML_D20_SEC + ' \u00b7 vin sec</text>';

  // Les operations, posees sur l'axe des dates. C'est la piece qui manquait.
  var ops = ((cu && cu.operations) || []).slice()
    .filter(function(o){ var t = Date.parse(o.date); return !isNaN(t) && t >= t0 && t <= t1; })
    .sort(function(a,b){ return a.date < b.date ? -1 : 1; });
  ops.forEach(function(o){
    var x = X(Date.parse(o.date));
    g += '<line x1="' + x.toFixed(1) + '" y1="' + (pT - 8) + '" x2="' + x.toFixed(1) + '" y2="' + (pT + ih) + '" stroke="' + c.col.prevu + '" stroke-width="1.2"/>'
      + '<circle cx="' + x.toFixed(1) + '" cy="' + (pT - 8) + '" r="3.4" fill="' + c.col.prevu + '"/>';
  });

  // Temperature : une mesure, mais pas LA mesure de cet ecran — trait fin.
  if(temps.length >= 2){
    var dt = mes.filter(function(m){ return m.temp_c != null; })
      .map(function(m){ return X(Date.parse(m.date)).toFixed(1) + ',' + Yt(m.temp_c).toFixed(1); });
    g += '<polyline points="' + dt.join(' ') + '" fill="none" stroke="' + c.col.attention + '" stroke-width="' + c.trait.prevu + '" stroke-dasharray="5 4" stroke-linejoin="round"/>';
  }

  var dd = mes.map(function(m){ return X(Date.parse(m.date)).toFixed(1) + ',' + Yd(_vendMesD20(m)).toFixed(1); });
  g += '<polyline points="' + dd.join(' ') + '" fill="none" stroke="' + c.col.mesure + '" stroke-width="' + c.trait.mesure + '" stroke-linejoin="round" stroke-linecap="round"/>';
  mes.forEach(function(m){
    g += '<circle cx="' + X(Date.parse(m.date)).toFixed(1) + '" cy="' + Yd(_vendMesD20(m)).toFixed(1) + '" r="3.2" fill="' + c.col.mesure + '"/>';
  });

  var pas = et ? Math.max(1, Math.ceil(jour(t1) / 3)) : Math.max(1, Math.ceil(jour(t1) / 6));
  for(var j = 0; j <= jour(t1); j += pas){
    var xj = X(t0 + j * 86400000);
    g += '<text x="' + xj.toFixed(1) + '" y="' + (c.h - 11) + '" text-anchor="middle" font-size="' + c.txt.axe + '" fill="' + c.col.texte + '">J' + j + '</text>';
  }

  var der = _vendMesD20(mes[mes.length-1]);
  var aria = 'Fermentation de ' + (cu.nom || 'la cuve') + ' : ' + mes.length + ' relev\u00e9s, densit\u00e9 de '
    + Math.round(ds[0]) + ' \u00e0 ' + Math.round(der) + ', ' + ops.length + ' op\u00e9rations dat\u00e9es.';
  return window._mvGraphSvg(c, aria, g) + _fermLegende(cu, ops, t0, mes, deuxAxes);
}

function _fermLegende(cu, ops, t0, mes, deuxAxes){
  function jour(d){ return Math.round((Date.parse(d) - t0) / 86400000); }
  var h = '<div class="mvfm-lg">'
    + '<span><i class="l" style="background:var(--terre)"></i>densit\u00e9 ramen\u00e9e \u00e0 20 \u00b0C</span>'
    + '<span><i class="d" style="border-top-color:var(--orange)"></i>temp\u00e9rature de cuve'
    + (deuxAxes ? '' : ' (axe de droite masqu\u00e9 sur \u00e9cran \u00e9troit)') + '</span></div>';
  if(ops.length){
    h += '<div class="mvfm-ops">';
    ops.forEach(function(o){
      var det = '';
      if(o.type === 'chaptalisation' && o.kg_sucre) det = ' \u00b7 ' + _mvF1(o.kg_sucre) + ' kg de sucre';
      else if(o.temp_c != null) det = ' \u00b7 cible ' + o.temp_c + ' \u00b0C';
      else if(o.dose != null) det = ' \u00b7 ' + o.dose + ' g/hL';
      else if(o.type === 'delestage') det = ' \u00b7 ' + (o.nb || 1) + '\u00d7';
      h += '<span class="mvfm-op"><i></i><b>J' + jour(o.date) + '</b> ' + _escHtml(_vendOpLbl(o.type)) + det + '</span>';
    });
    h += '</div>';
  }
  var chap = ops.filter(function(o){ return o.type === 'chaptalisation'; });
  if(chap.length) h += '<div class="mvfm-note">La seule remont\u00e9e possible de la courbe, c\u2019est une chaptalisation. '
    + 'Elle est ici dat\u00e9e au m\u00eame endroit que la mesure, on ne la cherche plus.</div>';
  var der = _vendMesD20(mes[mes.length-1]);
  if(der <= _ML_D20_SEC) h += '<div class="mvfm-fin"><b>' + Math.round(der) + ' au jour '
    + jour(mes[mes.length-1].date) + '</b> : la cuve est s\u00e8che. Ce n\u2019est pas un pressentiment, c\u2019est la derni\u00e8re mesure.</div>';
  return h;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOT M4 — Le remplissage des cuves, parcelle par parcelle. Ce que ca decide :
// si la journee de recolte de demain peut etre lancee.
// ═══════════════════════════════════════════════════════════════════════════
var MV_CUV_LARG = 92;   // largeur minimale d'une cuve lisible

function _cuveCouches(cu, recs){
  var mine = (recs || []).filter(function(r){ return r && r.cuve_id === cu.id; });
  var byP = {};
  mine.forEach(function(r){
    var o = byP[r.parcelle] || (byP[r.parcelle] = { nom:r.parcelle, caisses:0 });
    o.caisses += (r.nb_caisses || 0);
  });
  var cs = Object.keys(byP).map(function(n){
    var o = byP[n]; o.hl = _vendCuvHl(o.caisses); return o;
  }).sort(function(a,b){ return b.hl - a.hl; });
  var plein = cs.reduce(function(s,o){ return s + o.hl; }, 0);
  return { couches: cs, plein: plein, cap: parseFloat(cu.volume_hl) || 0 };
}

function _vendRemplirSvg(cuves, recs, w){
  var cs = (cuves || []).map(function(cu){
    var d = _cuveCouches(cu, recs);
    return { cu:cu, couches:d.couches, plein:d.plein, cap:d.cap };
  }).filter(function(x){ return x.plein > 0 || x.cap > 0; });
  if(!cs.length) return window._mvGraphVide('Aucune cuve remplie pour l\u2019instant',
    'Rattachez vos pes\u00e9es \u00e0 une cuve pour voir l\u2019assemblage se dessiner.');

  var c0 = window._mvGraphCadre(w, 100), et = c0.etroit;
  var c = window._mvGraphCadre(w, et ? 250 : 288, { padL: 4, padR: 4, padT: 10, padB: et ? 54 : 50 });
  var W = c.w, iw = c.iw;
  var tient = Math.max(1, Math.floor((iw + 12) / (MV_CUV_LARG + 12)));
  var caches = Math.max(0, cs.length - tient);
  cs = cs.slice(0, tient);
  var bw = (iw - 12 * (cs.length - 1)) / cs.length;
  var hMax = c.ih;
  var capMax = Math.max.apply(null, cs.map(function(x){ return Math.max(x.cap, x.plein); })) || 1;

  var g = '';
  cs.forEach(function(x, i){
    var bx = c.padL + i * (bw + 12);
    var hCuve = Math.max(30, x.cap / capMax * hMax);
    var by = c.padT + (hMax - hCuve);
    // La cuve : un contour, et le vide au-dessus qui se voit.
    g += '<rect x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hCuve.toFixed(1) + '" rx="4" fill="var(--bg-card)" stroke="' + c.col.grille + '" stroke-width="1.5"/>';
    var acc = 0;
    x.couches.forEach(function(o, k){
      var hh = (o.hl / (x.cap || x.plein || 1)) * hCuve;
      var y = by + hCuve - acc - hh;
      var op = 1 - k * 0.16;
      g += '<rect x="' + (bx + 2).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw - 4).toFixed(1) + '" height="' + Math.max(1, hh).toFixed(1) + '" fill="' + c.col.mesure + '" opacity="' + Math.max(0.3, op).toFixed(2) + '"/>';
      if(hh >= 15)
        g += '<text x="' + (bx + 7).toFixed(1) + '" y="' + (y + 13).toFixed(1) + '" font-size="' + c.txt.mini + '" font-weight="600" fill="#fff">' + _escHtml(_apTronc(o.nom, et ? 11 : 15)) + '</text>'
           + '<text x="' + (bx + 7).toFixed(1) + '" y="' + (y + 24).toFixed(1) + '" font-size="' + c.txt.mini + '" fill="#fff" opacity=".85">' + _mvF1(o.hl) + ' hL</text>';
      acc += hh;
    });
    var pct = x.cap > 0 ? Math.round(x.plein / x.cap * 100) : 0;
    g += '<text x="' + (bx + bw/2).toFixed(1) + '" y="' + (c.h - 34) + '" text-anchor="middle" font-size="' + c.txt.axe + '" font-weight="600" fill="var(--texte)">' + _escHtml(_apTronc(x.cu.nom || '', et ? 12 : 16)) + '</text>'
      + '<text x="' + (bx + bw/2).toFixed(1) + '" y="' + (c.h - 21) + '" text-anchor="middle" font-size="' + c.txt.mini + '" font-weight="700" fill="' + c.col.mesure + '">' + _mvF1(x.plein) + ' hL</text>'
      + '<text x="' + (bx + bw/2).toFixed(1) + '" y="' + (c.h - 9) + '" text-anchor="middle" font-size="' + c.txt.mini + '" fill="' + c.col.texte + '">' + (x.cap > 0 ? 'sur ' + _mvF1(x.cap) + ' \u00b7 ' + pct + ' %' : '') + '</text>';
  });

  var tPlein = cs.reduce(function(s,x){ return s + x.plein; }, 0);
  var tCap = cs.reduce(function(s,x){ return s + x.cap; }, 0);
  var aria = 'Remplissage des cuves : ' + cs.length + ' cuves, ' + _mvF1(tPlein) + ' hectolitres'
    + (tCap > 0 ? ' pour ' + _mvF1(tCap) + ' de cuverie' : '') + '.';
  return window._mvGraphSvg(c, aria, g) + _remplirPied(tPlein, tCap, caches);
}

function _apTronc(s, n){ s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '\u2026' : s; }

function _remplirPied(plein, cap, caches){
  var h = '';
  if(cap > 0){
    var pct = Math.round(plein / cap * 100);
    h += '<div class="mvcv-ord">La cuverie est remplie \u00e0 <b>' + pct + ' %</b>. '
      + 'C\u2019est le chiffre qui dit si la journ\u00e9e de r\u00e9colte de demain peut \u00eatre lanc\u00e9e.</div>';
  }
  h += '<div class="mvcv-note">Chaque apport garde le nom de sa parcelle jusque dans la cuve. '
    + 'Le vide au-dessus, c\u2019est la marge qui reste.</div>';
  if(caches > 0) h += '<div class="mvcv-note">' + caches + ' cuve' + (caches > 1 ? 's' : '')
    + ' de plus, visible' + (caches > 1 ? 's' : '') + ' sur un \u00e9cran plus large ou fiche par fiche.</div>';
  return h;
}

// ── CANDIDAT — Maturite par parcelle, une seule courbe pour tout le domaine ──
// Remplace les N sparklines separees de renderVendAna par UN graphe qui compare.
// Ce qui se decide ici : l'ordre de recolte. Le graphe ne sert qu'a le montrer.
//
// Aucune saisie nouvelle : tout vient de CAVE_VENDANGE.analyses, deja saisies.

// Palette CATEGORIELLE — une parcelle, une couleur. Ce ne sont pas des roles de
// la charte, mais toutes les teintes sortent des variables existantes.
var MV_MAT_COL = ['var(--rouge)','var(--or)','var(--vert-med)','var(--terre)','var(--phyto-med)','var(--bleu)'];
var MV_MAT_MAX = 6;   // au-dela, on garde les plus avancees et on le dit

// Sucre en g/L, quelle que soit l'unite de saisie.
function _matSuc(a, spd){ var s = _anaSpd(a, spd); return a.mode === 'alc' ? (a.val || 0) * s : (a.val || 0); }

// Le classement : derniere valeur, et vitesse sur les deux derniers releves.
// La vitesse est le vrai signal — deux parcelles au meme sucre ne se recoltent
// pas le meme jour si l'une monte deux fois plus vite.
function _matClasse(byP, spd){
  return Object.keys(byP).map(function(nom){
    var arr = byP[nom].slice().sort(function(a,b){ return (a.date||'') < (b.date||'') ? -1 : 1; });
    var der = arr[arr.length - 1], suc = _matSuc(der, spd), vit = null;
    if(arr.length >= 2){
      var av = arr[arr.length - 2];
      var dj = (Date.parse(der.date) - Date.parse(av.date)) / 86400000;
      if(dj > 0) vit = (suc - _matSuc(av, spd)) / dj;
    }
    return { nom:nom, arr:arr, suc:suc, alc:suc / spd, vit:vit, date:der.date };
  }).sort(function(a,b){ return b.suc - a.suc; });
}

function _vendMatSvg(byP, w, opt){
  opt = opt || {};
  var spd = (_vendCfg().sucre_par_degre) || 16.83;
  var rangs = _matClasse(byP, spd);
  var traces = rangs.filter(function(r){ return r.arr.length >= 2; });
  if(traces.length < 1) return window._mvGraphVide(
    'Pas encore de suivi de maturit\u00e9 \u00e0 comparer',
    'Il faut deux analyses sur une m\u00eame parcelle pour tracer une courbe.');

  var caches = Math.max(0, traces.length - MV_MAT_MAX);
  traces = traces.slice(0, MV_MAT_MAX);

  var c0 = window._mvGraphCadre(w, 100), et = c0.etroit;
  // A l'aise, on pose l'etiquette de fin a droite du trace. A l'etroit, il n'y a
  // pas la place : la legende passe sous le graphe, en HTML.
  var padR = et ? 14 : 96;
  var c = window._mvGraphCadre(w, et ? 244 : 288, { padL: et ? 42 : 52, padR: padR, padT: 28, padB: et ? 34 : 32 });
  var W = c.w, pL = c.padL, pT = c.padT, iw = c.iw, ih = c.ih;

  var ts = [], vs = [];
  traces.forEach(function(r){ r.arr.forEach(function(a){
    var t = Date.parse(a.date); if(!isNaN(t)) ts.push(t);
    vs.push(_matSuc(a, spd));
  }); });
  var t0 = Math.min.apply(null, ts), t1 = Math.max.apply(null, ts);
  if(!(t1 > t0)) t1 = t0 + 86400000;
  var vMin = Math.floor((Math.min.apply(null, vs) - 8) / 10) * 10;
  var vMax = Math.ceil((Math.max.apply(null, vs) + 8) / 10) * 10;
  if(opt.objectif > 0){ vMin = Math.min(vMin, opt.objectif - 10); vMax = Math.max(vMax, opt.objectif + 10); }
  if(vMax - vMin < 20) vMax = vMin + 20;

  function X(t){ return pL + (t - t0) / (t1 - t0) * iw; }
  function Y(v){ return pT + ih - (Math.max(vMin, Math.min(vMax, v)) - vMin) / (vMax - vMin) * ih; }

  var g = '';
  for(var i = 0; i <= c.grad; i++){
    var v = vMin + (vMax - vMin) * i / c.grad, y = Y(v);
    g += '<line x1="' + pL + '" y1="' + y.toFixed(1) + '" x2="' + (W - c.padR) + '" y2="' + y.toFixed(1) + '" stroke="' + c.col.grille + '" stroke-width="' + c.trait.grille + '"/>'
       + '<text x="' + (pL - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="' + c.txt.axe + '" fill="' + c.col.texte + '">' + Math.round(v) + '</text>';
  }
  g += '<text x="' + (pL - 8) + '" y="' + (pT - 10) + '" text-anchor="end" font-size="' + c.txt.unite + '" fill="' + c.col.texte + '">g/L</text>';

  // Axe des dates : la premiere et la derniere, plus celle du milieu si la place
  // le permet. On retire des reperes, on ne reduit pas la police.
  var jours = [t0, t1];
  if(!et) jours = [t0, t0 + (t1 - t0) / 2, t1];
  jours.forEach(function(t, k){
    var d = new Date(t);
    var lab = d.getUTCDate() + '/' + String(d.getUTCMonth() + 1).padStart(2, '0');
    g += '<text x="' + X(t).toFixed(1) + '" y="' + (c.h - 12) + '" text-anchor="' + (k === 0 ? 'start' : (k === jours.length - 1 ? 'end' : 'middle')) + '" font-size="' + c.txt.axe + '" fill="' + c.col.texte + '">' + lab + '</text>';
  });

  // L'objectif n'existe que si le domaine l'a pose. Rien d'invente.
  if(opt.objectif > 0){
    var yo = Y(opt.objectif);
    g += '<line x1="' + pL + '" y1="' + yo.toFixed(1) + '" x2="' + (W - c.padR) + '" y2="' + yo.toFixed(1) + '" stroke="' + c.col.alerte + '" stroke-width="' + c.trait.seuil + '" stroke-dasharray="6 4"/>'
       + '<text x="' + (pL + 6) + '" y="' + (yo - 7).toFixed(1) + '" font-size="' + c.txt.mini + '" font-weight="700" fill="' + c.col.alerte + '">objectif ' + Math.round(opt.objectif) + ' g/L \u00b7 ' + _mvF1(opt.objectif / spd) + ' %vol</text>';
  }

  traces.forEach(function(r, k){
    var col = MV_MAT_COL[k % MV_MAT_COL.length];
    var pts = r.arr.map(function(a){ return X(Date.parse(a.date)).toFixed(1) + ',' + Y(_matSuc(a, spd)).toFixed(1); });
    g += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + col + '" stroke-width="' + c.trait.mesure + '" stroke-linejoin="round" stroke-linecap="round"/>';
    r.arr.forEach(function(a){
      g += '<circle cx="' + X(Date.parse(a.date)).toFixed(1) + '" cy="' + Y(_matSuc(a, spd)).toFixed(1) + '" r="3.4" fill="' + col + '"/>';
    });
    if(!et){
      var yl = Y(r.suc);
      g += '<text x="' + (W - c.padR + 8) + '" y="' + (yl + 4).toFixed(1) + '" font-size="' + c.txt.axe + '" font-weight="600" fill="' + col + '">' + _mvF1(r.alc) + ' %vol</text>';
    }
  });

  var premiere = traces[0].nom;
  var aria = 'Maturit\u00e9 par parcelle : ' + traces.length + ' parcelles suivies, de '
    + Math.round(traces[traces.length - 1].suc) + ' \u00e0 ' + Math.round(traces[0].suc)
    + ' grammes de sucre par litre. ' + premiere + ' est la plus avanc\u00e9e.';
  return window._mvGraphSvg(c, aria, g) + _matLegende(traces, caches, et);
}

// La legende vit SOUS le graphe, en HTML : elle reste lisible quand le graphe
// retrecit, et elle porte l'ordre de recolte — c'est elle le vrai livrable.
function _matLegende(traces, caches, etroit){
  var h = '<div class="mvmat-lg">';
  traces.forEach(function(r, k){
    var col = MV_MAT_COL[k % MV_MAT_COL.length];
    h += '<span class="mvmat-it"><i style="background:' + col + '"></i>'
      + '<b>' + _escHtml(r.nom) + '</b>'
      + '<em>' + Math.round(r.suc) + ' g/L'
      + (etroit ? ' \u00b7 ' + _mvF1(r.alc) + ' %vol' : '')
      + (r.vit != null ? ' \u00b7 ' + (r.vit >= 0 ? '+' : '\u2212') + _mvF1(Math.abs(r.vit)) + ' g/L par jour' : '')
      + '</em></span>';
  });
  h += '</div>';
  if(caches > 0) h += '<div class="mvmat-note">Les ' + traces.length + ' parcelles les plus avanc\u00e9es. '
    + caches + ' autre' + (caches > 1 ? 's' : '') + ' suivie' + (caches > 1 ? 's' : '') + ' plus bas, fiche par fiche.</div>';
  var t = traces[0];
  h += '<div class="mvmat-ord"><b>' + _escHtml(t.nom) + '</b> est la plus avanc\u00e9e'
    + (t.vit != null && t.vit > 0 ? ', et elle monte de ' + _mvF1(t.vit) + ' g/L par jour' : '')
    + '. L\u2019ordre de r\u00e9colte se lit dans cette liste, du haut vers le bas.</div>';
  return h;
}

function _vendAnaSpark(arr,w){
  if(arr.length<2) return window._mvGraphVide('Une seule analyse sur cette parcelle',
    'La courbe de maturit\u00e9 se trace \u00e0 partir de deux mesures.');
  var c=window._mvGraphCadre(w,126,{padL:26,padR:8,padT:20,padB:26});
  var W=c.w,H=c.h,pad=c.padL;
  var ys=arr.map(_vendAnaAlc);
  var mn=Math.min.apply(null,ys)-0.4, mx=Math.max.apply(null,ys)+0.4;
  if(mx-mn<0.2){mn-=0.5;mx+=0.5;}
  var px=function(i){return pad+i*(W-pad-c.padR)/(arr.length-1);};
  var py=function(v){return H-c.padB-(v-mn)/(mx-mn)*c.ih;};
  var pts=arr.map(function(a,i){return px(i)+','+py(_vendAnaAlc(a));}).join(' ');
  var pas=arr.length>7?Math.ceil(arr.length/7):1;
  var dots=arr.map(function(a,i){
    return '<circle cx="'+px(i)+'" cy="'+py(_vendAnaAlc(a))+'" r="3.5" fill="'+c.col.mesure+'"/>'
      +((i%pas===0||i===arr.length-1)
        ? '<text x="'+px(i)+'" y="'+(H-6)+'" font-size="'+c.txt.mini+'" fill="'+c.col.texte+'" text-anchor="middle">'+(a.date?a.date.slice(8)+'/'+a.date.slice(5,7):'')+'</text>'
        : '');
  }).join('');
  var last=_vendAnaAlc(arr[arr.length-1]);
  var g='<line x1="'+pad+'" y1="'+c.padT+'" x2="'+pad+'" y2="'+(H-c.padB)+'" stroke="'+c.col.grille+'" stroke-width="'+c.trait.grille+'"/>'
    +'<line x1="'+pad+'" y1="'+(H-c.padB)+'" x2="'+(W-c.padR)+'" y2="'+(H-c.padB)+'" stroke="'+c.col.grille+'" stroke-width="'+c.trait.grille+'"/>'
    +'<polyline points="'+pts+'" fill="none" stroke="'+c.col.mesure+'" stroke-width="'+c.trait.mesure+'"/>'+dots
    +'<text x="'+(W-c.padR)+'" y="'+(c.txt.axe+3)+'" font-size="'+c.txt.axe+'" fill="var(--texte)" text-anchor="end" font-weight="600">~'+_mvF1(last)+'% vol potentiel</text>';
  return window._mvGraphSvg(c,'Maturit\u00e9 : '+arr.length+' analyses, degr\u00e9 potentiel jusqu\u2019\u00e0 '+_mvF1(last)+' pour cent volume.',g);
}

// ══════════════════════════════════════════════════════════════════
// ── SYNTHESE DE MATURITE A DATE (Cuvier › Analyses)
//    Repond a « ou en est-on » quand on n'a mesure qu'une partie du
//    domaine : trois moyennes (domaine / rouges / blancs) et le
//    classement de TOUTES les parcelles. Aucune saisie nouvelle —
//    analyses, surfaces, cepages et recoltes existent deja.
//
//    ⚠️ Le calcul vit toujours en SUCRE. La conversion est lineaire :
//    moyenner en g/L puis reconvertir redonne exactement le degre.
//    C'est l'AFFICHAGE qui suit l'unite de saisie du domaine. Un
//    domaine qui lit son degre au refractometre ne doit pas trouver un
//    chiffre en g/L en gros : personne ne l'a mesure.
// ══════════════════════════════════════════════════════════════════
var _matFen      = 7;      // fenetre de fraicheur, en jours
var _matFiltre   = 'dom';  // 'dom' | 'rge' | 'bl'
var _matVoirTout = false;  // deplier les parcelles jamais analysees
var _matUn       = 's';    // unite d'affichage : 's' g/L | 'a' %vol
var _MAT_CAMP_J  = 150;    // au-dela, c'est la vendange precedente

var _MV_CEP_COUL = {
  'pinot noir':'r','gamay':'r','cesar':'r','pinot meunier':'r','merlot':'r','syrah':'r',
  'cabernet sauvignon':'r','cabernet franc':'r','grenache':'r','malbec':'r','cot':'r',
  'mourvedre':'r','carignan':'r','cinsault':'r','tannat':'r','petit verdot':'r',
  'poulsard':'r','trousseau':'r','nebbiolo':'r','sangiovese':'r','tempranillo':'r',
  'chardonnay':'b','aligote':'b','pinot blanc':'b','pinot gris':'b','melon de bourgogne':'b',
  'sauvignon':'b','sauvignon blanc':'b','semillon':'b','muscadelle':'b','viognier':'b',
  'chenin':'b','riesling':'b','savagnin':'b','gewurztraminer':'b','marsanne':'b',
  'roussanne':'b','ugni blanc':'b','colombard':'b','muscat':'b','sylvaner':'b'
};

function _matNorm(s){
  var t = String(s || '').trim().toLowerCase();
  return t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
}
// Couleur d'une parcelle. Le cepage tranche ; un choix manuel prime.
// Deux cepages de couleurs differentes : on ne choisit PAS a la place du
// vigneron — la parcelle reste a classer.
function _parcCoul(nom){
  var ov = (_vendCfg().coul_parc || {})[nom];
  if(ov === 'r' || ov === 'b') return ov;
  var p = _vendParcByName(nom); if(!p) return '?';
  var arr = p.cepages || (p.cepage ? [p.cepage] : []);
  var vu = null;
  for(var i = 0; i < arr.length; i++){
    var c = _MV_CEP_COUL[_matNorm(arr[i])];
    if(!c) continue;                    // cepage inconnu : il ne tranche rien
    if(vu && vu !== c) return '?';      // complantation de deux couleurs
    vu = c;
  }
  return vu || '?';
}
function _vendSetCoul(nom, c){
  if(!canWrite()){ showToast('Accès lecture seule', '#B85A1A'); return; }
  if(!CAVE_VENDANGE.config) CAVE_VENDANGE.config = {};
  if(!CAVE_VENDANGE.config.coul_parc) CAVE_VENDANGE.config.coul_parc = {};
  if(CAVE_VENDANGE.config.coul_parc[nom] === c) delete CAVE_VENDANGE.config.coul_parc[nom];
  else CAVE_VENDANGE.config.coul_parc[nom] = c;
  window.CAVE_VENDANGE = CAVE_VENDANGE;
  if(window.fbSave) window.fbSave('cave_vendange', CAVE_VENDANGE);
  renderVendAna();
}

function _matJours(d, tj){ return Math.round((tj - Date.parse(d)) / 86400000); }

// Le calcul. Rien n'est invente : une parcelle sans mesure n'a pas de valeur,
// une mesure trop vieille sort de la moyenne mais reste affichee.
//
// ★ `refIso` n'existe QUE pour le document imprime : il rejoue la synthese a
// une date passee. Sans lui, rien ne change — l'ecran appelle _matSynth(_matFen)
// et lit aujourd'hui, exactement comme avant ce lot. Avec lui, il faut aussi
// borner PAR LE HAUT : _matJours rend un ecart NEGATIF pour une mesure
// posterieure a la reference, donc le filtre des 150 jours la laisse passer.
// Un releve de la vendange suivante se serait invite dans le document de
// l'annee precedente — un seul moteur, mais deux bornes.
function _matSynth(fen, refIso){
  var o = { frais:[], vieilles:[], jamais:[], rentrees:[], nonClass:[], tiles:{} };
  var ref = refIso || new Date().toISOString().slice(0, 10);
  var tj = Date.parse(ref);

  var byP = {};
  (CAVE_VENDANGE.analyses || []).forEach(function(a){
    if(!a || !a.parcelle || !a.date) return;
    if(_matJours(a.date, tj) > _MAT_CAMP_J) return;   // vendange precedente
    if(refIso && a.date > ref) return;                // vendange suivante
    (byP[a.parcelle] = byP[a.parcelle] || []).push(a);
  });
  // Une recolte de l'an dernier ne sort pas la parcelle de cette campagne.
  var rec = {};
  (CAVE_VENDANGE.recoltes || []).forEach(function(r){
    if(!r || !r.parcelle || !r.date) return;
    if(_matJours(r.date, tj) > _MAT_CAMP_J) return;
    if(refIso && r.date > ref) return;
    if(!rec[r.parcelle] || r.date > rec[r.parcelle]) rec[r.parcelle] = r.date;
  });

  var actives = (window.PARCELLES || []).filter(function(p){
    return p && p.nom && p.statut !== 'Arrachee';
  });

  actives.forEach(function(p){
    var nom = String(p.nom).trim();
    var e = { nom:nom, ha:parseFloat(p.surface) || 0, coul:_parcCoul(nom),
              suc:null, date:null, age:null, vit:null, mode:null, rentree:rec[nom] || null };
    if(e.coul === '?') o.nonClass.push(e);
    var arr = (byP[nom] || []).slice().sort(function(a, b){ return (a.date || '') < (b.date || '') ? -1 : 1; });
    if(arr.length){
      var der = arr[arr.length - 1];
      e.suc = _matSuc(der); e.date = der.date; e.age = _matJours(der.date, tj);
      e.mode = der.mode === 'alc' ? 'a' : 's';
      if(arr.length >= 2){
        var av = arr[arr.length - 2], dj = (Date.parse(der.date) - Date.parse(av.date)) / 86400000;
        if(dj > 0) e.vit = (e.suc - _matSuc(av)) / dj;
      }
    }
    if(e.rentree)        o.rentrees.push(e);
    else if(e.suc == null) o.jamais.push(e);
    else if(e.age > fen)   o.vieilles.push(e);
    else                   o.frais.push(e);
  });

  o.frais.sort(function(a, b){ return b.suc - a.suc; });
  o.vieilles.sort(function(a, b){ return b.suc - a.suc; });
  o.jamais.sort(function(a, b){ return a.nom.localeCompare(b.nom, 'fr'); });
  o.nonClass = o.nonClass.filter(function(e){ return !e.rentree; });

  // Pondere par la SURFACE : une moyenne simple ferait peser 0,26 ha autant
  // que 1,54 ha. Le denominateur, lui, est tout ce qui reste a rentrer.
  function bloc(f){
    var m = o.frais.filter(f);
    var tous = actives.filter(function(p){
      var nom = String(p.nom).trim();
      return !rec[nom] && f({ coul:_parcCoul(nom) });
    });
    var haTot = tous.reduce(function(s, p){ return s + (parseFloat(p.surface) || 0); }, 0);
    if(!m.length) return { n:0, nTot:tous.length, haTot:haTot };
    var haM = m.reduce(function(s, x){ return s + x.ha; }, 0);
    if(!(haM > 0)) haM = m.length;   // surfaces non renseignees : moyenne simple
    return { n:m.length, nTot:tous.length, ha:haM, haTot:haTot,
      pond:   m.reduce(function(s, x){ return s + x.suc * (x.ha || 1); }, 0) / (haM || 1),
      simple: m.reduce(function(s, x){ return s + x.suc; }, 0) / m.length,
      pct:    haTot > 0 ? Math.round(haM / haTot * 100) : 0 };
  }
  o.tiles.dom = bloc(function(){ return true; });
  o.tiles.rge = bloc(function(x){ return x.coul === 'r'; });
  o.tiles.bl  = bloc(function(x){ return x.coul === 'b'; });
  return o;
}


// ─────────── Rendu de la synthese ───────────
function _matUnite(){ return _matUn === 'a' ? '%vol' : 'g/L'; }
function _matGros(suc, spd){ return _matUn === 'a' ? _mvF1(suc / spd) : String(Math.round(suc)); }
function _matPetit(suc, spd){
  return _matUn === 'a' ? Math.round(suc) + ' g/L' : '~' + _mvF1(suc / spd) + ' %vol';
}
function _matTuile(cls, lab, b, spd){
  var sel = _matFiltre === cls ? ' sel' : '';
  if(!b.n) return '<button type="button" class="mvsy-t vide ' + cls + sel + '" onclick="_matSetFiltre(\'' + cls + '\')">'
    + '<span class="lb">' + lab + '</span><span class="gl">—</span>'
    + '<span class="cv">aucune mesure<br>dans la fenêtre</span></button>';
  return '<button type="button" class="mvsy-t ' + cls + sel + '" onclick="_matSetFiltre(\'' + cls + '\')">'
    + '<span class="lb">' + lab + '</span>'
    + '<span class="gl">' + _matGros(b.pond, spd) + '<em>' + _matUnite() + '</em></span>'
    + '<span class="al">' + _matPetit(b.pond, spd) + '</span>'
    + '<span class="cv">' + b.n + ' parc. sur ' + b.nTot + '<br>' + _mvF1(b.ha) + ' ha · ' + b.pct + ' %</span></button>';
}

function _matSynthHtml(){
  var r = _matSynth(_matFen);
  var spd = (_vendCfg().sucre_par_degre) || 16.83;
  // L'unite d'affichage suit la majorite des saisies retenues.
  var tot = 0, alc = 0;
  r.frais.concat(r.vieilles).forEach(function(e){ if(e.mode){ tot++; if(e.mode === 'a') alc++; } });
  _matUn = (tot && alc > tot / 2) ? 'a' : 's';

  var h = '<div class="mvsy">'
    + '<div class="mvsy-hd"><div class="mvsy-ttl">Où en est la maturité</div>'
    + '<div class="mvsy-dt">au ' + new Date().toISOString().slice(8, 10) + '/' + new Date().toISOString().slice(5, 7) + '</div></div>'
    + '<div class="mvsy-fen">'
    + [[7, '7 derniers jours'], [14, '14 jours'], [_MAT_CAMP_J, 'Cette vendange']].map(function(f){
        return '<button type="button" class="' + (_matFen === f[0] ? 'on' : '') + '" onclick="_matSetFen(' + f[0] + ')">' + f[1] + '</button>';
      }).join('')
    + '</div>'
    + '<div class="mvsy-tiles">' + _matTuile('dom', 'Domaine', r.tiles.dom, spd)
    + _matTuile('rge', 'Rouges', r.tiles.rge, spd) + _matTuile('bl', 'Blancs', r.tiles.bl, spd) + '</div>';

  var b = r.tiles[_matFiltre] || r.tiles.dom;
  if(b.n) h += '<div class="mvsy-simple">moyenne pondérée par la surface · sans pondération : '
    + _matGros(b.simple, spd) + ' ' + _matUnite() + '</div>';

  // ── Classement : TOUTES les parcelles, une piste commune ──
  function garde(e){ return _matFiltre === 'dom' || e.coul === (_matFiltre === 'rge' ? 'r' : 'b'); }
  var frais = r.frais.filter(garde), vieilles = r.vieilles.filter(garde),
      jamais = r.jamais.filter(garde), rent = r.rentrees.filter(garde);
  // Une parcelle rentree (ou listee) sans analyse porte suc = null : la laisser
  // entrer ici ferait Math.min(null, ...) = 0 et l'echelle partirait a zero.
  var vals = frais.concat(vieilles, rent)
    .filter(function(e){ return e.suc != null; }).map(function(e){ return e.suc; });
  var obj = parseFloat(_vendCfg().mat_objectif) || 0;
  if(obj > 0) vals.push(obj);

  h += '<div class="mvcl"><div class="mvcl-hd"><div class="mvcl-ttl">Classement à date'
    + (_matFiltre === 'rge' ? ' · rouges' : _matFiltre === 'bl' ? ' · blancs' : '') + '</div>'
    + '<div class="mvcl-n">' + (frais.length + vieilles.length + jamais.length + rent.length) + ' parcelles</div></div>';

  if(!vals.length){
    h += '<div class="mvcl-vide">Aucune mesure à classer dans cette fenêtre.</div></div></div>';
    return h;
  }

  var vMin = Math.floor((Math.min.apply(null, vals) - 8) / 10) * 10;
  var vMax = Math.ceil((Math.max.apply(null, vals) + 8) / 10) * 10;
  if(vMax - vMin < 30) vMax = vMin + 30;
  function pos(v){ return ((v - vMin) / (vMax - vMin) * 100).toFixed(1); }

  // Graduations posees sur des valeurs RONDES DANS L'UNITE AFFICHEE : des g/L
  // reconvertis donneraient 10,1 · 11,3 · 12,5.
  var gr = '';
  if(_matUn === 'a'){
    var aMin = Math.ceil(vMin / spd * 2) / 2, aMax = vMax / spd, pasA = (aMax - aMin) > 3 ? 1 : 0.5;
    for(var a = aMin; a <= aMax + 0.01; a += pasA) gr += '<span style="left:' + pos(a * spd) + '%">' + _mvF1(a) + '</span>';
  } else {
    var pasS = Math.max(10, Math.round((vMax - vMin) / 4 / 10) * 10);
    for(var v = vMin; v <= vMax; v += pasS) gr += '<span style="left:' + pos(v) + '%">' + v + '</span>';
  }
  h += '<div class="mvcl-grad"><div></div><div class="g">' + gr + '</div><div></div></div>';

  var ov = '';
  if(b.n) ov += '<i style="left:' + pos(b.pond) + '%"></i><b class="moy" style="left:' + pos(b.pond) + '%">moy.</b>';
  if(obj > 0) ov += '<i class="obj" style="left:' + pos(obj) + '%"></i><b class="obj" style="left:' + pos(obj) + '%">objectif</b>';

  var nConv = 0;
  function ligne(e, cls, dot, sous){
    var conv = e.suc != null && e.mode && e.mode !== _matUn;
    if(conv) nConv++;
    return '<div class="mvcl-r' + (cls ? ' ' + cls : '') + '">'
      + '<span class="n">' + _escHtml(e.nom) + '</span>'
      + '<span class="pi">' + (e.suc != null ? '<i class="dot ' + dot + '" style="left:' + pos(e.suc) + '%"></i>' : '') + '</span>'
      + '<span class="v' + (conv ? ' conv' : '') + '">' + (e.suc != null ? '<b>' + _matGros(e.suc, spd) + '</b>' : '—')
      + '<s>' + sous + '</s></span></div>';
  }
  var rows = '';
  frais.forEach(function(e){ rows += ligne(e, '', e.coul === '?' ? 'q' : e.coul, _matPetit(e.suc, spd)); });
  if(vieilles.length){
    rows += '<div class="mvcl-sep">Mesure de plus de ' + _matFen + ' jours — hors moyenne</div>';
    vieilles.forEach(function(e){ rows += ligne(e, 'pale', 'old ' + (e.coul === '?' ? 'q' : e.coul), 'le ' + e.date.slice(8) + '/' + e.date.slice(5, 7)); });
  }
  if(jamais.length){
    // Ce qui est MESURE reste toujours visible. Ce qui n'a rien se COMPTE :
    // sur quarante parcelles, la liste des muettes noierait le classement.
    rows += '<div class="mvcl-sep">Jamais analysées — ' + jamais.length + ' parcelles · '
      + _mvF1(jamais.reduce(function(x, e){ return x + e.ha; }, 0)) + ' ha</div>';
    (_matVoirTout ? jamais : jamais.slice(0, 3)).forEach(function(e){ rows += ligne(e, 'pale', '', _mvF1(e.ha) + ' ha'); });
    if(jamais.length > 3) rows += '<button type="button" class="mvcl-plus" onclick="_matVoirPlus()">'
      + (_matVoirTout ? 'replier' : 'voir les ' + (jamais.length - 3) + ' autres') + '</button>';
  }
  if(rent.length){
    rows += '<div class="mvcl-sep">Déjà rentrées</div>';
    rent.forEach(function(e){ rows += ligne(e, 'pale out', 'old ' + (e.coul === '?' ? 'q' : e.coul), 'le ' + e.rentree.slice(8) + '/' + e.rentree.slice(5, 7)); });
  }
  h += '<div class="mvcl-zone"><div class="mvcl-ov">' + ov + '</div>' + rows + '</div>'
    + '<div class="mvcl-lg"><span><i class="pl"></i>mesure dans la fenêtre</span>'
    + '<span><i class="cr"></i>mesure plus ancienne, hors moyenne</span>'
    + '<span><i class="tr"></i>moyenne</span>'
    + (nConv ? '<span><i class="cv">' + (_matUn === 'a' ? '12,7' : '214') + '</i>valeur convertie, pas mesurée</span>' : '')
    + '</div>';
  if(nConv) h += '<div class="mvcl-pied">' + (_matUn === 'a'
      ? 'Les ' + nConv + ' valeurs soulignées ont été saisies en sucre et converties : sucre ÷ ' + _mvF1(spd) + '.'
      : 'Les ' + nConv + ' valeurs soulignées ont été lues en degré au réfractomètre et converties : degré × ' + _mvF1(spd) + '.') + '</div>';
  h += '</div>';

  // ── L'ecart, ce que la benne mettrait ensemble ──
  if(frais.length > 1){
    var hi = frais[0], lo = frais[frais.length - 1], d = hi.suc - lo.suc;
    h += '<div class="mvsy-ec"><b>' + _escHtml(hi.nom) + '</b> en tête, <b>' + _escHtml(lo.nom) + '</b> en queue : <b>'
      + (_matUn === 'a' ? _mvF1(d / spd) + ' %vol d’écart</b>, ' + Math.round(d) + ' g/L'
                        : Math.round(d) + ' g/L d’écart</b>, ' + _mvF1(d / spd) + ' %vol')
      + '. C’est ce que la même benne mettrait ensemble.</div>';
  }

  if(vieilles.length){
    h += '<div class="mvsy-warn"><b>' + vieilles.length + ' parcelle' + (vieilles.length > 1 ? 's écartées' : ' écartée')
      + '</b> du calcul : rien depuis plus de ' + _matFen + ' jours. ';
    vieilles.forEach(function(e){
      h += _escHtml(e.nom) + ' en est restée au ' + e.date.slice(8) + '/' + e.date.slice(5, 7)
        + ' (' + e.age + ' j, ' + _matGros(e.suc, spd) + ' ' + _matUnite() + ')';
      // La projection est une projection : elle se dit, elle ne se compte pas.
      h += (e.vit != null && e.vit > 0)
        ? ' — à ' + (_matUn === 'a' ? _mvF1(e.vit / spd) + ' %vol' : _mvF1(e.vit) + ' g/L') + ' par jour elle serait vers '
          + _matGros(e.suc + e.vit * e.age, spd) + ', mais personne ne l’a mesurée. '
        : '. ';
    });
    h += '</div>';
  }

  h += '<div class="mvsy-info"><b>Ce chiffre n’est pas la moyenne du domaine</b> : c’est la moyenne des parcelles '
    + 'qui ont une mesure fraîche, pondérée par leur surface. ' + r.jamais.length + ' parcelle'
    + (r.jamais.length > 1 ? 's n’ont' : ' n’a') + ' aucune analyse cette vendange.'
    + (r.rentrees.length ? ' ' + r.rentrees.length + ' parcelle' + (r.rentrees.length > 1 ? 's déjà rentrées ne comptent' : ' déjà rentrée ne compte') + ' plus.' : '')
    + '</div>';

  if(r.nonClass.length && canWrite()){
    h += '<div class="mvsy-cls"><div class="t"><b>' + r.nonClass.length + ' parcelle'
      + (r.nonClass.length > 1 ? 's' : '') + ' sans couleur.</b> Le cépage ne permet pas de trancher. '
      + (r.nonClass.length > 1 ? 'Elles comptent' : 'Elle compte') + ' dans le domaine, pas dans les deux colonnes.</div>';
    var cp = _vendCfg().coul_parc || {};
    r.nonClass.forEach(function(e){
      h += '<div class="mvsy-clr"><span class="n">' + _escHtml(e.nom) + ' · ' + _mvF1(e.ha) + ' ha</span>'
        + '<button type="button" class="r' + (cp[e.nom] === 'r' ? ' on' : '') + '" onclick="_vendSetCoul(' + _mvQ(e.nom) + ',\'r\')">Rouge</button>'
        + '<button type="button" class="b' + (cp[e.nom] === 'b' ? ' on' : '') + '" onclick="_vendSetCoul(' + _mvQ(e.nom) + ',\'b\')">Blanc</button></div>';
    });
    h += '</div>';
  }
  return h + '</div>';
}

// Nom de parcelle passe a un onclick : il vient de la saisie du domaine.
function _mvQ(s){
  var t = String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");   // 1. litteral JS
  t = t.replace(/&/g, '&amp;').replace(/"/g, '&quot;')             // 2. attribut HTML
       .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return "'" + t + "'";
}
function _matSetFen(f){ _matFen = f; renderVendAna(); }
function _matSetFiltre(k){ _matFiltre = (_matFiltre === k ? 'dom' : k); renderVendAna(); }
function _matVoirPlus(){ _matVoirTout = !_matVoirTout; renderVendAna(); }

function renderVendAna(){
  _caveV2InjectCss();
  var el=document.getElementById('mvv-body'); if(!el) return;
  var spd=(_vendCfg().sucre_par_degre)||16.83;
  var names=_vendParcelleNames();
  var opts='<option value="">— Choisir une parcelle —</option>'+names.map(function(n){return '<option value="'+_escHtml(n)+'">'+_escHtml(n)+'</option>';}).join('');
  var sucOn=_vendAnaUnitMode==='sucre';
  var canEdit=canWrite();
  var html='';
  if(canEdit){
    html+='<div class="mva-form">'
      +'<div class="mva-frow">'
        +'<div class="mva-fld" style="min-width:150px"><label>Parcelle</label><select id="mva-parc">'+opts+'</select></div>'
        +'<div class="mva-fld" style="max-width:150px"><label>Date</label><input id="mva-date" type="date" value="'+(new Date().toISOString().slice(0,10))+'"></div>'
        +'<div class="mva-fld" style="max-width:160px"><label>Mesure</label><div class="mva-useg">'
          +'<button id="mva-u-suc" class="'+(sucOn?'on':'')+'" onclick="_vendAnaUnit(\'sucre\')">Sucre g/L</button>'
          +'<button id="mva-u-alc" class="'+(sucOn?'':'on')+'" onclick="_vendAnaUnit(\'alc\')">°alc %vol</button>'
        +'</div></div>'
        +'<div class="mva-fld" style="max-width:120px"><label id="mva-vlab">'+(sucOn?'Sucre (g/L)':'°alc (%vol)')+'</label><input id="mva-val" type="number" step="'+(sucOn?'1':'0.1')+'" value="'+(sucOn?'200':'12')+'" oninput="_vendAnaLive()"></div>'
        +'<div class="mva-fld" style="flex:0 0 auto"><button class="mva-add" onclick="_vendAnaAdd()">＋ Ajouter</button></div>'
      +'</div>'
      +'<div class="mva-derived"><div>Sucre<b id="mva-d-suc">—</b></div><div>Degré potentiel<b id="mva-d-alc">—</b></div><div>Estimation alcoolique<b id="mva-d-est" style="color:var(--bordeaux,#7A1020)">—</b></div></div>'
    +'</div>';
  }
  html+='<div class="mva-hint">Réfractomètre : saisie en sucre (g/L) ou en degré potentiel (%vol). Degré = sucre ÷ '+_mvF1(spd)+'. Courbe d\'évolution par parcelle.</div>';
  var all=CAVE_VENDANGE.analyses||[];
  var byP={};
  all.forEach(function(a){ if(!a||!a.parcelle) return; (byP[a.parcelle]=byP[a.parcelle]||[]).push(a); });
  var parcs=Object.keys(byP).sort(function(a,b){return a.localeCompare(b,'fr');});
  if(!parcs.length){
    html+='<div class="mvb-empty">Aucune analyse enregistrée.<br>Ajoutez une première mesure de maturité ci-dessus.</div>';
  } else {
    window._mvGraphOublier('#mvg-mat-');
    // La synthese « ou en est-on » AVANT tout : c'est la question qu'on se pose
    // en montant au cuvier. Le graphe d'evolution et les fiches restent dessous.
    html+=_matSynthHtml();
    // Le graphe qui COMPARE. Les fiches par parcelle restent dessous :
    // elles portent le detail des mesures et leur suppression.
    html+='<div class="mvmat-card"><div class="mvmat-ttl">Maturit\u00e9 par parcelle \u00b7 r\u00e9fractom\u00e8tre</div>'
      +'<div id="mvg-mat-all"></div></div>';
    (function(bp){
      window._mvGraphSuivre('#mvg-mat-all', function(lg){
        // L'objectif n'existe que si le domaine l'a pose : absent, la ligne ne
        // s'affiche pas. Rien n'est invente, et le jour ou le reglage existe,
        // il n'y a rien d'autre a brancher.
        return _vendMatSvg(bp, lg, { objectif: parseFloat(_vendCfg().mat_objectif) || 0 });
      });
    })(byP);
    parcs.forEach(function(p,pi){
      var arr=byP[p].slice().sort(function(a,b){return (a.date||'')<(b.date||'')?-1:1;});
      var last=arr[arr.length-1];
      var lastSuc=_matSuc(last,spd);
      html+='<div class="mva-card"><div class="mva-cname">'+_escHtml(p)+'</div>'
        +'<div class="mva-meta">'+arr.length+' analyse'+(arr.length>1?'s':'')+' · dernière le '+(last.date?last.date.slice(8)+'/'+last.date.slice(5,7):'')+'</div>'
        +'<div class="mva-line"><span>'+Math.round(lastSuc)+' g/L</span><span class="pot">~'+_mvF1(_vendAnaAlc(last))+'% vol potentiel</span></div>'
        +'<div id="mvg-mat-'+pi+'"></div>';
      (function(a2,ix){ window._mvGraphSuivre('#mvg-mat-'+ix, function(lg){ return _vendAnaSpark(a2,lg); }); })(arr,pi);
      html+='<div class="mva-rows">';
      arr.slice().reverse().forEach(function(a){
        var suc=_matSuc(a,spd);
        html+='<div class="mva-row"><span>'+(a.date?a.date.slice(8)+'/'+a.date.slice(5,7)+'/'+a.date.slice(0,4):'')+' · '+Math.round(suc)+' g/L · ~'+_mvF1(_vendAnaAlc(a))+'% vol</span>'
          +(canEdit?'<button class="mva-x" onclick="_vendAnaDel(\''+a.id+'\')" aria-label="Supprimer">×</button>':'')+'</div>';
      });
      html+='</div></div>';
    });
  }
  el.innerHTML=html;
  if(window._mvGraphRepeindre) window._mvGraphRepeindre();
  if(canEdit) _vendAnaLive();
  _vendRefreshCockpit();
}
function _vendAnaUnit(u){
  _vendAnaUnitMode=u;
  var bs=document.getElementById('mva-u-suc'), ba=document.getElementById('mva-u-alc');
  if(bs) bs.classList.toggle('on',u==='sucre'); if(ba) ba.classList.toggle('on',u==='alc');
  var lab=document.getElementById('mva-vlab'); if(lab) lab.textContent=u==='sucre'?'Sucre (g/L)':'°alc (%vol)';
  var v=document.getElementById('mva-val'); if(v){ v.value=u==='sucre'?200:12; v.step=u==='sucre'?'1':'0.1'; }
  _vendAnaLive();
}
function _vendAnaLive(){
  var el=document.getElementById('mva-val'); if(!el) return;
  var spd=(_vendCfg().sucre_par_degre)||16.83;
  var v=parseFloat(el.value)||0;
  var suc=_vendAnaUnitMode==='sucre'?v:(v*spd);
  var alc=_vendAnaUnitMode==='sucre'?(v/spd):v;
  var ds=document.getElementById('mva-d-suc'); if(ds) ds.textContent=Math.round(suc)+' g/L';
  var da=document.getElementById('mva-d-alc'); if(da) da.textContent='~'+_mvF1(alc)+'% vol';
  var de=document.getElementById('mva-d-est'); if(de) de.textContent='~'+_mvF1(alc)+'% vol';
}
function _vendAnaAdd(){
  if(!canWrite()){ showToast('Accès lecture seule','#B85A1A'); return; }
  var p=(document.getElementById('mva-parc')||{}).value||'';
  var d=(document.getElementById('mva-date')||{}).value||'';
  var v=parseFloat((document.getElementById('mva-val')||{}).value);
  if(!p){ showToast('Choisissez une parcelle','#E07060'); return; }
  if(!(v>0)){ showToast('Saisissez une mesure','#E07060'); return; }
  if(!CAVE_VENDANGE.analyses) CAVE_VENDANGE.analyses=[];
  CAVE_VENDANGE.analyses.push({id:'vana_'+Date.now(),parcelle:p,date:d||new Date().toISOString().slice(0,10),
    mode:_vendAnaUnitMode,val:v,spd:(_vendCfg().sucre_par_degre)||16.83});
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  if(window.fbSave) window.fbSave('cave_vendange',CAVE_VENDANGE);
  showToast('Analyse enregistrée','#C0845A');
  renderVendAna();
}
function _vendAnaDel(id){
  if(!canWrite()){ showToast('Accès lecture seule','#B85A1A'); return; }
  CAVE_VENDANGE.analyses=(CAVE_VENDANGE.analyses||[]).filter(function(a){return a.id!==id;});
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  if(window.fbSave) window.fbSave('cave_vendange',CAVE_VENDANGE);
  renderVendAna();
}

// ─────────── MILLÉSIMES (Le Chai) ───────────
function _caveMillChipsHtml(cuvs){
  var act=(cuvs||[]).filter(function(c){return c.statut!=='embouteille';});
  var ms=[]; act.forEach(function(c){ var m=c.millesime; if(m&&ms.indexOf(m)===-1) ms.push(m); });
  ms.sort(function(a,b){return b-a;});
  if(ms.length<2) return '';   // un seul millésime → pas de filtre utile
  var h='<div class="mvcm-chips"><span class="mvcm-lab">Millésime</span>';
  h+='<button class="mvcm-chip'+(_caveMillFilter==='tous'?' on':'')+'" onclick="_caveSetMill(\'tous\')">Tous<span class="mvcm-c">'+act.length+'</span></button>';
  ms.forEach(function(m){
    var n=act.filter(function(c){return String(c.millesime)===String(m);}).length;
    h+='<button class="mvcm-chip'+(String(_caveMillFilter)===String(m)?' on':'')+'" onclick="_caveSetMill(\''+m+'\')">'+m+'<span class="mvcm-c">'+n+'</span></button>';
  });
  return h+'</div>';
}
function _caveSetMill(m){
  _caveMillFilter=m;
  renderCaveCuvees();
  // Sans ce rappel, les chiffres du bandeau restaient sur la cave entiere
  // pendant que la liste, elle, etait filtree.
  if(typeof _caveSaisBanner==='function') _caveSaisBanner();
}

// ─────────── MISE EN BOUTEILLE (Le Chai) ───────────
function _caveEnsureBtlTab(){
  var ref=document.getElementById('mvc-tbtn-cuv');
  if(ref && !document.getElementById('mvc-tbtn-bouteille')){
    var b=document.createElement('button');
    b.id='mvc-tbtn-bouteille';
    b.className=ref.className; b.classList.remove('active');
    b.setAttribute('onclick',"switchCaveOng('bouteille')");
    b.innerHTML='\uD83C\uDF7E Bouteilles';
    if(ref.nextSibling) ref.parentNode.insertBefore(b,ref.nextSibling); else ref.parentNode.appendChild(b);
  }
  var vref=document.getElementById('mvc-view-cuv');
  if(vref && !document.getElementById('mvc-view-bouteille')){
    var v=document.createElement('div');
    v.id='mvc-view-bouteille'; v.style.display='none';
    if(vref.nextSibling) vref.parentNode.insertBefore(v,vref.nextSibling); else vref.parentNode.appendChild(v);
  }
}
function _caveBilanChaine(c){
  var eleveHl=_caveNbTonneaux(c)*_caveFutHl();
  var cuveHl=null, recolteKg=null;
  var cv=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x&&x.decuvage&&x.decuvage.cuvee_id===c.id;});
  if(cv){
    cuveHl=parseFloat(cv.volume_hl)||null;
    var rk=0, any=false;
    (CAVE_VENDANGE.recoltes||[]).forEach(function(r){ if(r.cuve_id===cv.id){ rk+=_recKg(r); any=true; } });
    if(any) recolteKg=rk;
  }
  return { recolteKg:recolteKg, cuveHl:cuveHl, eleveHl:eleveHl, nbBtl:(c.nb_bouteilles!=null?c.nb_bouteilles:null) };
}
function _caveBtlGraphSvg(ch,nbBtl,w){
  var steps=[];
  if(ch.recolteKg!=null) steps.push({lab:'R\u00e9colte',sub:Math.round(ch.recolteKg)+' kg',v:_mvBtl(ch.recolteKg/_mlKgHl())});
  if(ch.cuveHl!=null)    steps.push({lab:'En cuve',sub:_mvF1(ch.cuveHl)+' hL',v:_mvBtl(ch.cuveHl)});
  steps.push({lab:'Apr\u00e8s \u00e9levage',sub:_mvF1(ch.eleveHl)+' hL',v:_mvBtl(ch.eleveHl)});
  if(nbBtl!=null)        steps.push({lab:'Bouteilles',sub:nbBtl+' btl',v:nbBtl});
  if(steps.length<2) return '';
  var c=window._mvGraphCadre(w,168,{padL:12,padR:12,padT:34,padB:34});
  var W=c.w,H=c.h,pad=c.padL;
  var bw=Math.min(96,Math.max(24,c.iw/steps.length-10));
  var gap=(c.iw-bw*steps.length)/(steps.length-1||1);
  var max=steps[0].v||1, base=H-c.padB;
  var bars=steps.map(function(s,i){
    var h=Math.max(3,(s.v/max)*(base-c.padT)), x=pad+i*(bw+gap), y=base-h;
    var perte=i>0?Math.round((1-s.v/(steps[i-1].v||1))*100):0;
    return '<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="5" fill="url(#mvbgd)"/>'
      +'<text x="'+(x+bw/2).toFixed(1)+'" y="'+(y-14).toFixed(1)+'" font-size="'+c.txt.val+'" font-weight="700" fill="'+c.col.mesure+'" text-anchor="middle">'+s.v+'</text>'
      +(i>0?'<text x="'+(x+bw/2).toFixed(1)+'" y="'+(y-2).toFixed(1)+'" font-size="'+c.txt.mini+'" fill="'+c.col.alerte+'" text-anchor="middle">\u2212'+perte+'%</text>':'')
      +'<text x="'+(x+bw/2).toFixed(1)+'" y="'+(base+14)+'" font-size="'+c.txt.mini+'" fill="var(--texte)" text-anchor="middle" font-weight="600">'+s.lab+'</text>'
      +'<text x="'+(x+bw/2).toFixed(1)+'" y="'+(base+26)+'" font-size="'+c.txt.mini+'" fill="'+c.col.texte+'" text-anchor="middle">'+s.sub+'</text>';
  }).join('');
  var g='<defs><linearGradient id="mvbgd" x1="0" y1="0" x2="0" y2="1">'
    +'<stop offset="0" stop-color="'+c.col.prevu+'"/><stop offset="1" stop-color="'+c.col.mesure+'"/></linearGradient></defs>'+bars;
  var aria='\u00c9volution du volume en \u00e9quivalent bouteilles, de '+steps[0].lab.toLowerCase()
    +' \u00e0 '+steps[steps.length-1].lab.toLowerCase()+' : '+steps[0].v+' puis '+steps[steps.length-1].v+' cols.';
  return window._mvGraphSvg(c,aria,g);
}
function renderCaveBouteille(){
  _caveV2InjectCss();
  var el=document.getElementById('mvc-view-bouteille'); if(!el) return;
  var cuvs=CAVE_ELEVAGE.cuvees||[];
  var act=cuvs.filter(function(c){return c.statut!=='embouteille';});
  var emb=cuvs.filter(function(c){return c.statut==='embouteille';});
  var w=canWrite();
  var html='<div class="mvb-sec">Prêt à mettre en bouteille</div>';
  html+='<div class="mvb-hint">Bouteilles auto = volume élevé × 133,33 (75 cl). Ajustable. Mettre en bouteille sort la cuvée du chai et l\'archive par millésime.</div>';
  if(!act.length){
    html+='<div class="mvb-empty">Aucune cuvée en élevage.</div>';
  } else {
    act.forEach(function(c){
      var hl=_caveNbTonneaux(c)*_caveFutHl(), auto=_mvBtl(hl);
      html+='<div class="mvb-card"><div class="mvb-badge">\u2019'+String(c.millesime||'').slice(-2)+'</div>'
        +'<div class="mvb-name">'+_escHtml(c.nom)+'</div>'
        +'<div class="mvb-meta">Millésime '+(c.millesime||'?')+' · '+_caveNbTonneaux(c)+' fûts · '+_mvF1(hl)+' hL élevés</div>'
        +'<div class="mvb-line">théorique <b>'+auto+'</b> bouteilles</div>';
      if(w){
        if(_caveBtlConfirm===c.id){
          html+='<div class="mvb-ask">Mettre « '+_escHtml(c.nom)+' » en bouteille ? Elle quittera le chai.</div>'
            +'<div class="mvb-frow"><div class="mvb-fld"><label>Bouteilles réelles</label><input id="mvb-reel-'+c.id+'" type="number" value="'+auto+'"></div>'
            +'<button class="mvb-yes" onclick="_caveBtlConfirmYes(\''+c.id+'\')">Confirmer</button>'
            +'<button class="mvb-no" onclick="_caveBtlConfirmNo()">Annuler</button></div>';
        } else {
          html+='<div class="mvb-frow"><button class="mvb-btn" onclick="_caveMettreEnBouteille(\''+c.id+'\')">Mettre en bouteille</button></div>';
        }
      }
      html+='</div>';
    });
  }
  html+='<div class="mvb-sec sep">En stock · archive par millésime</div>';
  if(!emb.length){
    html+='<div class="mvb-empty">Aucune cuvée embouteillée.</div>';
  } else {
    window._mvGraphOublier('#mvg-btl-');
    var byM={};
    emb.forEach(function(c){ var m=c.millesime||'?'; (byM[m]=byM[m]||[]).push(c); });
    var mills=Object.keys(byM).sort(function(a,b){return b-a;});
    mills.forEach(function(m){
      var list=byM[m];
      var totBtl=list.reduce(function(s,c){return s+(c.nb_bouteilles||0);},0);
      html+='<div class="mvb-grp"><div class="mvb-grphead">Millésime '+m+' · '+totBtl+' bouteilles</div>';
      list.forEach(function(c){
        var ch=c.bilan_perte||_caveBilanChaine(c);
        ch.nbBtl=(c.nb_bouteilles!=null?c.nb_bouteilles:null);
        var perteTot=(ch.recolteKg!=null&&c.nb_bouteilles)?Math.round((1-c.nb_bouteilles/_mvBtl(ch.recolteKg/_mlKgHl()))*100):null;
        html+='<div class="mvb-card"><div class="mvb-name">'+_escHtml(c.nom)+'</div>'
          +'<div class="mvb-meta">Mis en bouteille'+(c.date_embouteillage?' · '+_caveDateFr(c.date_embouteillage):'')+'</div>'
          +'<div class="mvb-split"><div><div class="mvb-tot">'+(c.nb_bouteilles||0)+'<small>bouteilles en stock</small></div></div>'
          +(perteTot!=null?'<div style="margin-left:auto;text-align:right"><div class="mvb-tot" style="font-size:24px">\u2212'+perteTot+'%<small>perte récolte → bouteille</small></div></div>':'')
          +'</div>';
        var g=_caveBtlGraphSvg(ch,c.nb_bouteilles!=null?c.nb_bouteilles:null, window._mvGraphW(null));
        if(g){
          (function(ch2,nb,id){ window._mvGraphSuivre('#mvg-btl-'+_mvgId(id), function(lg){ return _caveBtlGraphSvg(ch2,nb,lg); }); })(ch,(c.nb_bouteilles!=null?c.nb_bouteilles:null),c.id);
          html+='<div class="mvb-sec" style="margin:14px 0 0;border:0">Évolution du volume (équiv. bouteilles)</div><div id="mvg-btl-'+_mvgId(c.id)+'"></div>';
        }
        else html+='<div class="mvb-hint" style="margin-top:8px">Chaîne de perte partielle — liez la cuvée à sa cuve de vinification pour l\'afficher.</div>';
        if(w) html+='<div class="mvb-frow"><div class="mvb-fld"><label>Corriger bouteilles</label><input type="number" value="'+(c.nb_bouteilles||0)+'" onchange="_caveBtlEditReel(\''+c.id+'\',this.value)"></div></div>';
        html+='</div>';
      });
      html+='</div>';
    });
  }
  el.innerHTML=html;
}
function _caveMettreEnBouteille(id){
  if(!canWrite()){ showToast('Accès lecture seule','#B85A1A'); return; }
  _caveBtlConfirm=id; renderCaveBouteille();
}
function _caveBtlConfirmNo(){ _caveBtlConfirm=null; renderCaveBouteille(); }
function _caveBtlConfirmYes(id){
  if(!canWrite()){ showToast('Accès lecture seule','#B85A1A'); return; }
  var c=(CAVE_ELEVAGE.cuvees||[]).find(function(x){return x.id===id;}); if(!c) return;
  var hl=_caveNbTonneaux(c)*_caveFutHl();
  var reel=parseInt((document.getElementById('mvb-reel-'+id)||{}).value)||_mvBtl(hl);
  var ch=_caveBilanChaine(c);
  // Les futs de la cuvee redeviennent disponibles : ils sont physiquement vides,
  // vieillis d'un vin. Sans ce retour, le parc fondait a chaque mise en bouteille.
  // ⚠️ AVANT de poser le statut : _mvFutLiberer ignore les cuvees embouteillees.
  var _rendus=0;
  if(typeof window._mvFutLiberer==='function' && window.INTRANTS){
    _rendus=window._mvFutLiberer(c, window.INTRANTS);
    if(_rendus && typeof window.saveIntrants==='function') window.saveIntrants();
  }
  c.statut='embouteille';
  c.nb_bouteilles=reel;
  c.date_embouteillage=new Date().toISOString().slice(0,10);
  c.bilan_perte={recolteKg:ch.recolteKg,cuveHl:ch.cuveHl,eleveHl:ch.eleveHl};
  _caveBtlConfirm=null;
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  if(window.fbSave) window.fbSave('cave_elevage',CAVE_ELEVAGE);
  showToast('« '+c.nom+' » embouteillée'
    +(_rendus?(' — '+_rendus+' fût'+(_rendus>1?'s':'')+' revenu'+(_rendus>1?'s':'')+' au parc')
             :' — retirée du chai'),'#C0845A');
  if(typeof _mvcRenderHeader==='function') _mvcRenderHeader();
  renderCaveBouteille();
}
function _caveBtlEditReel(id,val){
  if(!canWrite()){ showToast('Accès lecture seule','#B85A1A'); return; }
  var c=(CAVE_ELEVAGE.cuvees||[]).find(function(x){return x.id===id;}); if(!c) return;
  c.nb_bouteilles=parseInt(val)||0;
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  if(window.fbSave) window.fbSave('cave_elevage',CAVE_ELEVAGE);
  renderCaveBouteille();
}

// ── expositions v2 ──
window.renderVendAna        = renderVendAna;
window._vendAnaUnit         = _vendAnaUnit;
window._vendAnaLive         = _vendAnaLive;
window._vendAnaAdd          = _vendAnaAdd;
window._matSetFen           = _matSetFen;
window._matSetFiltre        = _matSetFiltre;
window._matVoirPlus         = _matVoirPlus;
window._vendSetCoul         = _vendSetCoul;
window._vendAnaDel          = _vendAnaDel;
window._caveSetMill         = _caveSetMill;
window._caveEnsureBtlTab    = _caveEnsureBtlTab;
window.renderCaveBouteille  = renderCaveBouteille;
window._caveMettreEnBouteille = _caveMettreEnBouteille;
window._caveBtlConfirmYes   = _caveBtlConfirmYes;
window._caveBtlConfirmNo    = _caveBtlConfirmNo;
window._caveBtlEditReel     = _caveBtlEditReel;


// ── expositions refonte élevage (mvc) ──
window.switchCaveOng     = switchCaveOng;
window.renderCaveCuvees  = renderCaveCuvees;
window.renderCaveJournal = renderCaveJournal;
window.renderCaveReglages= renderCaveReglages;
window.setCaveJFilter    = setCaveJFilter;
// Consommees par pilotage.js : une seule definition du « dernier soutirage ».
window._caveSoutOps      = _caveSoutOps;
window._caveLastSout     = _caveLastSout;
window._caveQuickOp      = _caveQuickOp;
window._caveOuillerTous  = _caveOuillerTous;
window._caveSeuilStep    = _caveSeuilStep;
// Appelees depuis les onclick inline des lignes « par millesime ».
// Sans export, le build IIFE les rend introuvables et le bouton est muet.
// Consommee par pilotage.js (onglet Cave) : le seuil affiche a cote de chaque
// millesime doit etre CELUI du Chai, pas une seconde regle qui divergerait.
window._caveSeuilOu      = _caveSeuilOu;
window._caveMilsEnCave   = _caveMilsEnCave;
window._caveSeuilMilStep = _caveSeuilMilStep;
window._caveSeuilMilReset= _caveSeuilMilReset;
window._caveFutL         = _caveFutL;
window._caveFutHl        = _caveFutHl;
window._caveFutPrompt    = _caveFutPrompt;
window._mvcRenderHeader  = _mvcRenderHeader;

// ════════════════════════════════════════════════════════════════════════════
// LE MILLESIME — 3e section de la Cave, a cote du Chai et du Cuvier.
//
// Deux questions, deux sous-onglets :
//   « Ce qui vient »   -> l'agenda des 4 prochaines semaines
//   « La ligne de vie » -> le parcours du millesime, de la vigne a la bouteille
//
// AUCUNE SAISIE NOUVELLE. Tout se deduit de ce qui est deja enregistre :
// last_ouillage, mesures_fa, operations d'ouillage, recoltes, cuves, decuvages.
// Seule exception, signalee a l'ecran : p.rdt_max (rendement maximum de
// l'appellation), un reglage pose une fois par parcelle, admin only.
//
// PRINCIPE DE NON-DUPLICATION : ce bloc n'a AUCUNE copie privee. Il appelle
// _caveNbTonneaux / _caveFutHl / _caveAlerts / _recKg / _vendMesD20 /
// _vendParcByName / _vendSaveParcelles / _mvBtl / _mvF1 / _vendCfg, et pour la
// campagne, window._mvCampagneDe (utils.js), la meme que _arcCampagneDe du
// Pilotage. Deux definitions du meme concept = incoherence garantie.
// ════════════════════════════════════════════════════════════════════════════

var _mlTab = 'venir';        // 'venir' | 'vie'
var _mlMil = null;           // millesime consulte ; null = campagne en cours
var _ML_SEM = 4;             // horizon de l'agenda, en semaines
var _ML_D20_SEC = 996;       // densite 20 C sous laquelle le vin est sec

// ── dates ────────────────────────────────────────────────────────────────
function _mlD(iso){ var p=String(iso).split('-'); return new Date(+p[0],+p[1]-1,+p[2]); }
function _mlIso(d){
  var m=String(d.getMonth()+1), j=String(d.getDate());
  return d.getFullYear()+'-'+(m.length<2?'0'+m:m)+'-'+(j.length<2?'0'+j:j);
}
function _mlAuj(){ return _mlIso(new Date()); }
function _mlAddJ(iso,n){ var d=_mlD(iso); d.setDate(d.getDate()+n); return _mlIso(d); }
function _mlEcartJ(a,b){ return Math.round((_mlD(b)-_mlD(a))/86400000); }
function _mlLundi(iso){ var d=_mlD(iso); d.setDate(d.getDate()-((d.getDay()+6)%7)); return _mlIso(d); }
var _ML_MOIS=['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];
var _ML_JOURS=['dim','lun','mar','mer','jeu','ven','sam'];
function _mlFrJ(iso){ var d=_mlD(iso); return _ML_JOURS[d.getDay()]+' '+d.getDate(); }
function _mlFrC(iso){ var d=_mlD(iso); return d.getDate()+' '+_ML_MOIS[d.getMonth()]; }

// Millesime de la campagne en cours. Repli local si utils.js est anterieur a ce
// lot : un cave.js neuf avec un utils.js ancien ne doit pas planter.
function _mlCampagne(){
  if(typeof window._mvCampagneDe==='function') return window._mvCampagneDe(_mlAuj());
  var p=_mlAuj().split('-'); return (+p[1]>=8)?(+p[0]):(+p[0]-1);
}
function _mlMilActif(){ return _mlMil!=null?_mlMil:_mlCampagne(); }
// Le millesime affiche son propre seuil : _mlSeuil prend la cuvee quand on
// l'a, et retombe sur le global sinon (appels anciens sans argument).
function _mlSeuil(c){ return _caveSeuilOu(c!=null?c:null); }
// kg de raisin par hL de vin fini : la moyenne des bornes deja reglees au Cuvier.
function _mlKgHl(){ var c=_vendCfg(); return ((c.ratio_min||130)+(c.ratio_max||140))/2; }
function _mlHlCuvee(c){ return Math.round(_caveNbTonneaux(c)*_caveFutHl()*10)/10; }
function _mlNomCuvee(c){
  // Deux cuvees peuvent porter le MEME nom sur deux millesimes : seul l'id est
  // unique. Sans le millesime, l'agenda affiche deux lignes indiscernables.
  return (c.nom||'')+' \u2019'+String(c.millesime||'').slice(-2);
}

// ── CE QUI VIENT ─────────────────────────────────────────────────────────

// Volume d'ouillage par fut, deduit des ouillages deja saisis pour cette cuvee.
// Repli : moyenne du domaine, puis 7 L. Rien a renseigner.
function _mlVolParFut(cuvId){
  var v=[], all=[];
  (CAVE_ELEVAGE.operations||[]).forEach(function(o){
    if(!o||o.type!=='ouillage'||!o.data||!o.data.vol_par_fut_L) return;
    all.push(o.data.vol_par_fut_L);
    // ⚠ BUG CORRIGE : le champ s'appelle cuvees_ids (cuvee_id au singulier
    // pour les operations anciennes). « o.cuvees » ne matchait JAMAIS, donc
    // la fonction retombait toujours sur la moyenne de TOUS les ouillages du
    // domaine — le volume propose pour un fut de 2026 etait calcule sur le
    // 2025. Un millesime ne s'ouille pas au rythme d'un autre.
    var _ids=o.cuvees_ids||(o.cuvee_id?[o.cuvee_id]:[]);
    if(_ids.indexOf(cuvId)>=0) v.push(o.data.vol_par_fut_L);
  });
  var arr=v.length?v:all;
  if(!arr.length) return 7;
  return Math.round(arr.reduce(function(s,x){return s+x;},0)/arr.length*10)/10;
}

// Echeances d'ouillage a venir. Jamais ouillee = due aujourd'hui.
function _mlOuillages(from,nSem){
  var fin=_mlAddJ(from,nSem*7-1), out=[];
  (CAVE_ELEVAGE.cuvees||[]).forEach(function(c){
    if(!c||c.statut==='embouteille') return;
    var futs=_caveNbTonneaux(c); if(!futs) return;
    // ⚠ Le seuil se calcule DANS la boucle : un 2026 revient tous les 7 jours
    // quand un 2025 revient tous les 14. Hors boucle, l'agenda des quatre
    // semaines cadençait toute la cave au meme rythme.
    var seuil=_mlSeuil(c);
    var d = c.last_ouillage ? _mlAddJ(c.last_ouillage,seuil) : from;
    var retard = c.last_ouillage ? Math.max(0,_mlEcartJ(d,from)) : 0;
    if(retard>0) d=from;
    var garde=0;
    while(d<=fin && garde++<12){
      out.push({cuvee:c, date:d, futs:futs,
                litres:Math.round(futs*_mlVolParFut(c.id)),
                retard:(d===from)?retard:0,
                jamais:(!c.last_ouillage && d===from)});
      d=_mlAddJ(d,seuil);
    }
  });
  return out.sort(function(a,b){ return a.date<b.date?-1:a.date>b.date?1:0; });
}

// Fin de fermentation estimee.
// DEUX pentes, volontairement distinctes :
//   penteMoy (3 derniers releves) -> PROJETTE la date
//   penteRec (2 derniers releves) -> DETECTE l'arret
// Une moyenne sur 3 points lisse le decrochage recent, c'est exactement ce qu'il
// ne faut pas lisser quand une fermentation s'arrete.
// Une cuve de moins de 3 jours ou de moins de 3 releves n'est pas projetable :
// la FA demarre lentement puis accelere, une pente de depart donnerait une date
// fausse avec l'autorite d'un calcul.
// ── Projection de fin de MALO sur les valeurs mesurees ───────────────
// ⚠ MODELE ARBITRE PAR NICO : chaque cuvee a SA malo. On ne projette pas
// sur la duree des FML passees du domaine — on projette sur la decroissance
// de l'acide malique REELLEMENT mesuree sur cette cuvee-la.
// Meme mecanique que _mlProjFA, pour la meme raison :
//   · penteMoy sur 3 releves  -> PROJETTE la date de fin
//   · penteRec sur 2 derniers -> DETECTE l'arret
// Une moyenne sur 3 points lisse le decrochage recent : c'est exactement ce
// qu'il ne faut pas lisser quand une malo se bloque.
// ⚠ Sous 3 mesures, AUCUNE projection : la malo demarre lentement puis
// accelere, une pente de depart donnerait une date fausse avec l'autorite
// d'un calcul. Meme garde que la FA.
var _ML_MAL_FIN = 0.10;   // g/L — seuil oenologique de malo achevee
var _ML_MAL_PRES = 0.30;  // g/L — en dessous, elle touche a sa fin

// Les mesures de malique d'une cuvee, dans l'ordre, depuis les analyses.
function _mlMesMalo(cuveeId){
  var ops=(CAVE_ELEVAGE&&CAVE_ELEVAGE.operations)||[], out=[];
  ops.forEach(function(o){
    if(!o||o.type!=='analyse'||!o.date||!o.data) return;
    var v=o.data.malique;
    if(v==null||isNaN(v)) return;
    var ids=(o.cuvees_ids&&o.cuvees_ids.length)?o.cuvees_ids:(o.cuvee_id?[o.cuvee_id]:[]);
    if(ids.indexOf(cuveeId)===-1) return;
    out.push({date:o.date, val:parseFloat(v)});
  });
  out.sort(function(a,b){ return a.date<b.date?-1:(a.date>b.date?1:0); });
  // Un meme jour reanalyse : on garde la derniere valeur saisie.
  var f=[];
  out.forEach(function(m){
    if(f.length&&f[f.length-1].date===m.date) f[f.length-1]=m; else f.push(m);
  });
  return f;
}

// ⚠ C15 : ses seuls appelants sont dans pilotage.js. Une declaration serait
// comptee MORTE par le preflight, qui raisonne fichier par fichier.
window._mlProjMalo = function(c,now){
  now=now||_mlAuj();
  if(!c||!c.id) return {etat:'attente'};
  var m=_mlMesMalo(c.id);
  if(!m.length) return {etat:'attente', n:0};
  var last=m[m.length-1], vl=last.val;
  if(vl<=_ML_MAL_FIN) return {etat:'finie', mal:vl, dernier:last.date, n:m.length};
  if(m.length<3) return {etat:'demarrage', mal:vl, dernier:last.date, n:m.length,
                         proche:vl<=_ML_MAL_PRES};
  var a=m[m.length-2], b=last;
  var jRec=_mlEcartJ(a.date,b.date)||1;
  var penteRec=(a.val-b.val)/jRec;                       // g/L par jour, positif si ca descend
  var p3=m.slice(-3);
  var jMoy=_mlEcartJ(p3[0].date,p3[2].date)||1;
  var penteMoy=(p3[0].val-p3[2].val)/jMoy;
  var r4=function(x){ return Math.round(x*1000)/1000; };
  // ⚠ Le malique qui REMONTE n'est pas une malo bloquee : il ne se recree
  // pas. C'est une erreur de saisie ou une confusion de cuvee. Annoncer un
  // blocage enverrait rechauffer une cuve alors que le probleme est dans la
  // donnee. Ce test passe donc AVANT celui du blocage. Le seuil de 0,05 g/L
  // laisse passer le bruit analytique, qui lui reste un blocage.
  if((b.val-a.val)>0.05 || penteMoy<0)
    return {etat:'irreguliere', mal:vl, dernier:last.date, n:m.length,
            monte:r4(b.val-a.val)};
  // Bloquee : la decroissance recente est quasi nulle alors qu'il reste du
  // malique. Seuil exprime en g/L/jour, calibre sur une malo lente (0,02).
  if(penteRec<0.005) return {etat:'bloquee', mal:vl, pente:r4(penteRec), penteMoy:r4(penteMoy),
                             dernier:last.date, stableJ:jRec, n:m.length};
  if(penteMoy<=0) return {etat:'irreguliere', mal:vl, dernier:last.date, n:m.length};
  var jours=(vl-_ML_MAL_FIN)/penteMoy;
  if(!(jours>=0)||jours>365) return {etat:'irreguliere', mal:vl, dernier:last.date, n:m.length};
  return {etat:'normal', mal:vl, pente:r4(penteMoy), penteRec:r4(penteRec),
          jours:Math.round(jours), date:_mlAddJ(last.date,Math.round(jours)),
          marge:Math.max(1,Math.round(jours*0.3)), dernier:last.date, n:m.length,
          mesures:m.slice(-8)};
};
window._mlMesMalo=_mlMesMalo;
window._ML_MAL_FIN=_ML_MAL_FIN;
function _mlProjFA(c,now){
  now=now||_mlAuj();
  var m=(c&&c.mesures_fa)?c.mesures_fa.slice():[];
  if(!m.length) return {etat:'attente'};
  var last=m[m.length-1], dl=_vendMesD20(last), dernier=last.date;
  if(dl==null) return {etat:'attente'};
  if(dl<=_ML_D20_SEC) return {etat:'sec', d20:dl, dernier:dernier};
  var jCuve=c.date_entree?_mlEcartJ(c.date_entree,now):99;
  if(m.length<3 || jCuve<3) return {etat:'demarrage', d20:dl, dernier:dernier, jCuve:jCuve};
  var a=m[m.length-2], b=last;
  var penteRec=(_vendMesD20(a)-_vendMesD20(b))/(_mlEcartJ(a.date,b.date)||1);
  var p3=m.slice(-3);
  var penteMoy=(_vendMesD20(p3[0])-_vendMesD20(p3[2]))/(_mlEcartJ(p3[0].date,p3[2].date)||1);
  if(penteRec<1.5) return {etat:'ralentit', d20:dl, pente:Math.round(penteRec*10)/10,
                           penteMoy:Math.round(penteMoy*10)/10, dernier:dernier,
                           stableJ:_mlEcartJ(a.date,b.date)};
  var jours=(dl-995)/penteMoy;
  return {etat:'normal', d20:dl, pente:Math.round(penteMoy*10)/10,
          jours:Math.max(0,Math.round(jours*10)/10),
          date:_mlAddJ(dernier,Math.max(0,Math.round(jours))),
          marge:Math.max(1,Math.round(jours*0.3)), dernier:dernier};
}

function _mlAMesurer(from){
  return (CAVE_VENDANGE.cuves_vinif||[]).filter(function(c){
    if(!c||!_vendIsActive(c)) return false;
    var m=c.mesures_fa||[]; if(!m.length) return true;
    return _mlEcartJ(m[m.length-1].date,from)>=1;
  }).map(function(c){
    var m=c.mesures_fa||[];
    return {cuve:c, depuis:m.length?_mlEcartJ(m[m.length-1].date,from):999};
  });
}

// Agenda groupe par semaine calendaire.
function _mlAgenda(from,nSem){
  var sem=[], l0=_mlLundi(from), i;
  for(i=0;i<nSem;i++){ var lu=_mlAddJ(l0,i*7); sem.push({lundi:lu, dim:_mlAddJ(lu,6), items:[]}); }
  function pousse(d,item){
    for(var k=0;k<sem.length;k++){
      if(d>=sem[k].lundi && d<=sem[k].dim){ item.date=d; sem[k].items.push(item); return true; }
    }
    return false;
  }
  _mlOuillages(from,nSem).forEach(function(o){
    var note = o.jamais ? 'jamais ouill\u00e9e depuis l\u2019entonnage'
             : o.retard ? ('en retard de '+o.retard+' j') : '';
    pousse(o.date,{kind:'ouillage', titre:_mlNomCuvee(o.cuvee),
      detail:o.futs+' f\u00fbt'+(o.futs>1?'s':'')+' \u00b7 ~'+o.litres+' L',
      urgence:(o.retard||o.jamais)?'due':'', note:note, futs:o.futs, ref:o.cuvee.id});
  });
  (CAVE_VENDANGE.cuves_vinif||[]).forEach(function(c){
    if(!c||!_vendIsActive(c)) return;
    var p=_mlProjFA(c,from);
    if(p.etat==='normal'&&p.date) pousse(p.date,{kind:'fa', titre:c.nom,
      detail:'fin de fermentation estim\u00e9e \u00b7 \u00b1 '+p.marge+' j',
      note:'densit\u00e9 '+Math.round(p.d20)+' \u00b7 \u2212'+p.pente+' pts/j', ref:c.id});
    if(p.etat==='ralentit') pousse(from,{kind:'alerte', titre:c.nom,
      detail:'densit\u00e9 '+Math.round(p.d20)+', \u2212'+p.pente+' pt/j sur les '+p.stableJ+' derniers jours',
      note:'la fermentation ralentit \u2014 \u00e0 contr\u00f4ler', urgence:'due', ref:c.id});
    if(p.etat==='sec') pousse(from,{kind:'decuvage', titre:c.nom,
      detail:'vin sec (densit\u00e9 '+Math.round(p.d20)+') \u2014 d\u00e9cuvage possible', ref:c.id});
    if(p.etat==='demarrage') pousse(from,{kind:'demarrage', titre:c.nom,
      detail:'en cuve depuis '+p.jCuve+' j \u00b7 densit\u00e9 '+Math.round(p.d20),
      note:'trop t\u00f4t pour estimer la fin', ref:c.id});
    var mm=c.mesures_fa||[], lm=mm[mm.length-1];
    if(lm&&lm.temp_c>=29) pousse(from,{kind:'alerte', titre:c.nom,
      detail:lm.temp_c+' \u00b0C au dernier relev\u00e9', note:'temp\u00e9rature haute',
      urgence:'warn', ref:c.id});
  });
  _mlAMesurer(from).forEach(function(x){
    pousse(from,{kind:'mesure', titre:x.cuve.nom,
      detail:x.depuis>900?'aucun relev\u00e9':('dernier relev\u00e9 il y a '+x.depuis+' j'),
      urgence:x.depuis>=2?'due':'', ref:x.cuve.id});
  });
  // Ordre d'affichage. ATTENTION : ne jamais ecrire (ordre[k]||9) — 'alerte' vaut
  // 0 et 0||9 rend 9, ce qui envoie l'alerte en DERNIER, sous les ouillages.
  var ordre={alerte:0,mesure:1,fa:2,decuvage:3,demarrage:4,ouillage:5};
  sem.forEach(function(s){
    s.items.sort(function(a,b){
      if(a.date!==b.date) return a.date<b.date?-1:1;
      var oa=(ordre[a.kind]!=null?ordre[a.kind]:9), ob=(ordre[b.kind]!=null?ordre[b.kind]:9);
      return oa-ob;
    });
  });
  return sem;
}

function _mlResumeSem(s){
  var r={futs:0,litres:0,alertes:0,mesures:0,n:s.items.length};
  s.items.forEach(function(i){
    if(i.kind==='ouillage'){ r.futs+=i.futs||0; r.litres+=Math.round((i.futs||0)*7); }
    if(i.kind==='alerte') r.alertes++;
    if(i.kind==='mesure') r.mesures++;
  });
  // litres : on repasse par le detail deja calcule plutot que par une moyenne fixe
  r.litres=0;
  s.items.forEach(function(i){
    if(i.kind!=='ouillage') return;
    var m=String(i.detail).match(/~(\d+) L/); if(m) r.litres+=parseInt(m[1],10)||0;
  });
  return r;
}

// ── LA LIGNE DE VIE ──────────────────────────────────────────────────────

function _mlRecoltesDe(mil){
  return (CAVE_VENDANGE.recoltes||[]).filter(function(r){
    return r && String(r.date||'').slice(0,4)===String(mil);
  });
}

function _mlChaine(mil){
  var kgHl=_mlKgHl();
  var recs=_mlRecoltesDe(mil);
  var kgTot=0, kgVendu=0, haTot=0, vus={};
  recs.forEach(function(r){
    var kg=_recKg(r); kgTot+=kg; if(_recSold(r)) kgVendu+=kg;
    var p=_vendParcByName(r.parcelle);
    if(p&&!vus[p.nom]){ vus[p.nom]=1; haTot+=(parseFloat(p.surface)||0); }
  });
  var ids={}; recs.forEach(function(r){ if(r.cuve_id) ids[r.cuve_id]=1; });
  var cuves=(CAVE_VENDANGE.cuves_vinif||[]).filter(function(c){ return c&&ids[c.id]; });
  var hlCuve=cuves.filter(function(c){ return c.statut!=='termine'; })
                  .reduce(function(s,c){ return s+(parseFloat(c.volume_hl)||0); },0);
  var hlDecuve=cuves.filter(function(c){ return c.statut==='termine'; })
                    .reduce(function(s,c){ return s+(parseFloat(c.volume_hl)||0); },0);
  var cuvees=(CAVE_ELEVAGE.cuvees||[]).filter(function(c){ return String(c.millesime)===String(mil); });
  var enFut=cuvees.filter(function(c){ return c.statut!=='embouteille'; });
  var hlFut=enFut.reduce(function(s,c){ return s+_mlHlCuvee(c); },0);
  var nFuts=enFut.reduce(function(s,c){ return s+_caveNbTonneaux(c); },0);
  var nBtl=cuvees.reduce(function(s,c){ return s+(c.nb_bouteilles||0); },0);
  var retro=false;
  // Millesime anterieur au suivi du Cuvier : aucune recolte saisie, mais le bilan
  // a ete fige a la mise en bouteille. On le relit plutot que d'afficher zero.
  if(!recs.length && cuvees.length){
    var bp={kg:0,cuve:0,eleve:0,vu:false};
    cuvees.forEach(function(c){
      var b=c.bilan_perte; if(!b) return; bp.vu=true;
      bp.kg+=(b.recolteKg||0); bp.cuve+=(b.cuveHl||0); bp.eleve+=(b.eleveHl||0);
    });
    if(bp.vu){ kgTot=bp.kg; hlDecuve=Math.round(bp.cuve); hlFut=bp.eleve; retro=true; }
  }
  return {millesime:mil, retro:retro, parcelles:Object.keys(vus).length,
          ha:Math.round(haTot*100)/100, kg:kgTot, kgVendu:kgVendu, kgCuve:kgTot-kgVendu,
          kgHl:kgHl, cuves:cuves, hlCuve:Math.round(hlCuve), hlDecuve:Math.round(hlDecuve),
          cuvees:cuvees, futs:nFuts, hlFut:Math.round(hlFut*10)/10, btl:nBtl};
}

function _mlMillesimes(){
  var set={};
  (CAVE_VENDANGE.recoltes||[]).forEach(function(r){
    var a=String(r&&r.date||'').slice(0,4); if(a) set[a]=1;
  });
  (CAVE_ELEVAGE.cuvees||[]).forEach(function(c){ if(c&&c.millesime) set[c.millesime]=1; });
  set[_mlCampagne()]=1;
  return Object.keys(set).map(Number).sort(function(a,b){ return b-a; }).slice(0,6);
}

function _mlRendements(mil){
  var kgHl=_mlKgHl(), out={};
  _mlRecoltesDe(mil).forEach(function(r){
    var p=_vendParcByName(r.parcelle); if(!p) return;
    if(!out[p.nom]) out[p.nom]={parcelle:p, kg:0, caisses:0, vendu:false};
    out[p.nom].kg+=_recKg(r); out[p.nom].caisses+=(r.nb_caisses||0);
    if(_recSold(r)) out[p.nom].vendu=true;
  });
  return Object.keys(out).map(function(k){
    var o=out[k], s=parseFloat(o.parcelle.surface)||0;
    o.hlHa = s>0?Math.round(o.kg/s/kgHl*10)/10:null;
    o.max  = parseFloat(o.parcelle.rdt_max)||null;
    o.depasse = (o.max&&o.hlHa)?(o.hlHa>o.max):false;
    o.pct = (o.max&&o.hlHa)?Math.round(o.hlHa/o.max*100):null;
    return o;
  }).sort(function(a,b){
    if(a.pct==null&&b.pct==null) return (b.hlHa||0)-(a.hlHa||0);
    if(a.pct==null) return 1;
    if(b.pct==null) return -1;
    return b.pct-a.pct;
  });
}

function _mlResteARentrer(mil){
  if(String(mil)!==String(_mlCampagne())) return [];
  var faites={};
  _mlRecoltesDe(mil).forEach(function(r){ faites[r.parcelle]=1; });
  return (window.PARCELLES||[]).filter(function(p){
    return p && p.nom && !faites[p.nom] && (parseFloat(p.surface)||0)>0;
  });
}

// D'ou vient ce vin : cuvee d'elevage -> cuve -> recoltes -> parcelles.
function _mlOrigine(cuvId){
  var cv=(CAVE_VENDANGE.cuves_vinif||[]).find(function(c){
    return c && c.decuvage && c.decuvage.cuvee_id===cuvId;
  });
  if(!cv) return null;
  var recs=(CAVE_VENDANGE.recoltes||[]).filter(function(r){ return r&&r.cuve_id===cv.id; });
  return {cuve:cv, recoltes:recs, parcelles:recs.map(function(r){
    var p=_vendParcByName(r.parcelle);
    return {nom:r.parcelle, kg:_recKg(r), ha:p?(parseFloat(p.surface)||0):null};
  })};
}

// ── CSS (injecte par le module, comme le reste de la Cave) ───────────────
function _mlInjectCss(){
  if(document.getElementById('mv-ml-css')) return;
  var s=document.createElement('style'); s.id='mv-ml-css';
  s.textContent=''
  +'.mlx-sec{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--terre,#8A5A38);font-weight:600;margin:18px 0 9px}'
  +'.mlx-sec:first-child{margin-top:2px}'
  +'.mlx-hint{font-size:11.5px;color:var(--texte-doux,#5F5F5F);font-style:italic;margin:-4px 0 11px;line-height:1.5}'
  +'.mlx-wk{background:var(--bg-card,#FBFAF6);border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(20,17,13,.06);border:1px solid rgba(138,90,56,.09)}'
  +'.mlx-wk.now{border-color:rgba(194,161,77,.5)}'
  +'.mlx-wkh{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}'
  +'.mlx-wkt{font-size:15.5px;font-weight:600;color:var(--texte,#2A241C)}'
  +'.mlx-wknow{font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#241B08;font-weight:700;background:var(--or,#C2A14D);border-radius:5px;padding:2px 6px}'
  +'.mlx-wkd{margin-left:auto;font-size:11.5px;color:var(--texte-doux,#5F5F5F)}'
  +'.mlx-wks{font-size:12.5px;color:var(--texte-med,#4A4A3A);margin:6px 0 8px;line-height:1.5}'
  +'.mlx-wks b{color:var(--terre,#8A5A38);font-weight:700}'
  +'.mlx-wks .al{color:var(--rouge,#A0291E);font-weight:600}'
  +'.mlx-wke{font-size:12.5px;color:var(--texte-doux,#5F5F5F);padding:6px 0 2px}'
  +'.mlx-ev{display:flex;gap:10px;align-items:flex-start;padding:10px 8px;border-radius:11px;border:0;background:transparent;width:100%;text-align:left;font-family:inherit;min-height:44px;color:inherit;cursor:pointer}'
  +'.mlx-ev+.mlx-ev{border-top:1px solid rgba(138,90,56,.08)}'
  +'.mlx-p{width:8px;height:8px;border-radius:99px;margin-top:6px;flex-shrink:0;background:#A0A8B8}'
  +'.mlx-p.ouillage{background:#C0845A}.mlx-p.mesure{background:#4A9FC8}.mlx-p.fa{background:#7A4A8A}'
  +'.mlx-p.decuvage{background:var(--or,#C2A14D)}.mlx-p.alerte{background:var(--rouge,#A0291E)}'
  +'.mlx-b{flex:1;min-width:0}'
  +'.mlx-t{display:block;font-size:14px;font-weight:600;color:var(--texte,#2A241C);line-height:1.3}'
  +'.mlx-d{display:block;font-size:12px;color:var(--texte-med,#4A4A3A);margin-top:2px;line-height:1.4}'
  +'.mlx-n{display:block;font-size:11.5px;margin-top:3px;color:var(--texte-doux,#5F5F5F)}'
  +'.mlx-ev.due .mlx-n{color:var(--rouge,#A0291E);font-weight:600}'
  +'.mlx-ev.warn .mlx-n{color:var(--orange,#B85A1A);font-weight:600}'
  +'.mlx-j{display:block;font-size:10.5px;color:var(--texte-doux,#5F5F5F);white-space:nowrap;margin-top:2px;text-align:right;flex-shrink:0;min-width:50px}'
  +'.mlx-j b{display:block;font-size:15px;color:var(--terre,#8A5A38);font-weight:700}'
  +'.mlx-chips{display:flex;gap:7px;flex-wrap:wrap;margin:2px 0 14px}'
  +'.mlx-chip{font-size:13px;font-weight:500;padding:9px 15px;border-radius:99px;border:1px solid rgba(138,90,56,.25);background:var(--bg-card,#FBFAF6);color:var(--terre,#8A5A38);cursor:pointer;font-family:inherit;min-height:44px}'
  +'.mlx-chip.on{background:var(--cave,#14110D);color:var(--or-clair,#D8BC72);border-color:var(--cave,#14110D)}'
  +'.mlx-chip small{opacity:.65;font-size:10.5px;margin-left:4px}'
  +'.mlx-flux{background:var(--bg-card,#FBFAF6);border-radius:16px;padding:16px 14px 10px;box-shadow:0 1px 4px rgba(20,17,13,.06);border:1px solid rgba(138,90,56,.09);margin-bottom:14px}'
  +'.mlx-fluxsvg{width:100%}'
  +'.mlx-flux svg{display:block;max-width:100%;height:auto;overflow:visible}'
  +'.mlx-foot{font-size:11.5px;color:var(--texte-doux,#5F5F5F);line-height:1.55;margin-top:10px;padding-top:10px;border-top:1px dashed rgba(138,90,56,.22)}'
  +'.mlx-foot b{color:var(--terre,#8A5A38)}'
  +'.mlx-rd{background:var(--bg-card,#FBFAF6);border-radius:13px;padding:12px 13px;margin-bottom:9px;box-shadow:0 1px 4px rgba(20,17,13,.06);border:1px solid rgba(138,90,56,.09);width:100%;text-align:left;font-family:inherit;cursor:pointer;min-height:44px}'
  +'.mlx-rd.over{border-color:rgba(160,41,30,.4);background:var(--rouge-pale,#FAEAE8)}'
  +'.mlx-rdh{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}'
  +'.mlx-rdn{font-size:14.5px;font-weight:600;color:var(--texte,#2A241C)}'
  +'.mlx-rdv{margin-left:auto;font-family:\'Cormorant Garamond\',Georgia,serif;font-size:19px;font-weight:700;color:var(--terre,#8A5A38)}'
  +'.mlx-rd.over .mlx-rdv{color:var(--rouge,#A0291E)}'
  +'.mlx-rdv small{font-size:10.5px;font-family:inherit;font-weight:400;color:var(--texte-doux,#5F5F5F);margin-left:3px}'
  +'.mlx-rda{display:block;font-size:11px;color:var(--texte-doux,#5F5F5F);margin-top:2px}'
  +'.mlx-tr{height:7px;border-radius:99px;background:var(--gris-clair,#ECE6DA);margin-top:9px;position:relative;overflow:hidden}'
  +'.mlx-fi{height:100%;border-radius:99px;background:linear-gradient(90deg,#6BA34A,#3D6B27)}'
  +'.mlx-rd.over .mlx-fi{background:linear-gradient(90deg,#D4721A,#A0291E)}'
  +'.mlx-mk{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--texte-med,#4A4A3A);opacity:.55}'
  +'.mlx-rdf{display:flex;justify-content:space-between;font-size:11px;color:var(--texte-doux,#5F5F5F);margin-top:5px}'
  +'.mlx-tag{font-size:10.5px;font-weight:600;padding:2px 7px;border-radius:6px;background:var(--rouge,#A0291E);color:#fff}'
  +'.mlx-tag.sold{background:var(--gris,#DED7C9);color:var(--texte-med,#4A4A3A)}'
  +'.mlx-org{background:var(--bg-card,#FBFAF6);border-radius:13px;padding:13px;margin-bottom:9px;box-shadow:0 1px 4px rgba(20,17,13,.06);border:1px solid rgba(138,90,56,.09)}'
  +'.mlx-orgt{font-size:15px;font-weight:600;color:var(--texte,#2A241C)}'
  +'.mlx-orgs{font-size:11.5px;color:var(--texte-doux,#5F5F5F);margin-top:2px}'
  +'.mlx-orgc{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:10px;font-size:12px}'
  +'.mlx-st{background:var(--terre-pale,#F3EADF);color:var(--terre,#8A5A38);border-radius:8px;padding:5px 9px;font-weight:500}'
  +'.mlx-ar{color:var(--texte-doux,#5F5F5F);font-size:13px}'
  +'.mlx-row{display:flex;justify-content:space-between;font-size:12.5px;color:var(--texte-med,#4A4A3A);padding:5px 0}'
  +'.mlx-row+.mlx-row{border-top:1px solid rgba(138,90,56,.08)}'
  +'.mlx-row b{color:var(--texte,#2A241C);font-weight:600}'
  +'.mlx-reste{background:var(--or-pale,#FAF3E0);border:1px solid rgba(194,161,77,.35);border-radius:13px;padding:12px 13px;margin-bottom:12px;font-size:13px;color:var(--texte-med,#4A4A3A);line-height:1.5}'
  +'.mlx-reste b{color:var(--terre,#8A5A38)}'
  +'.mlx-empty{text-align:center;color:var(--texte-doux,#5F5F5F);padding:34px 20px;font-size:13px;line-height:1.6}';
  document.head.appendChild(s);
}

// ── RENDU ────────────────────────────────────────────────────────────────
var _ML_LBL={ouillage:'Ouiller', mesure:'Mesurer', fa:'Fin de fermentation',
  decuvage:'D\u00e9cuvage possible', alerte:'\u00c0 contr\u00f4ler',
  demarrage:'D\u00e9part en fermentation'};

function _mlEvHtml(it){
  var right = (it.kind==='ouillage')
    ? '<span class="mlx-j"><b>'+it.futs+'</b>f\u00fbts</span>'
    : '<span class="mlx-j">'+_mlFrJ(it.date).replace(' ','<b>')+'</b></span>';
  return '<button class="mlx-ev '+(it.urgence||'')+'" onclick="_mlGo(\''+it.kind+'\',\''+_escHtml(it.ref)+'\')">'
    +'<span class="mlx-p '+it.kind+'"></span><span class="mlx-b">'
    +'<span class="mlx-t">'+_escHtml(it.titre)+'</span>'
    +'<span class="mlx-d">'+_ML_LBL[it.kind]+' \u00b7 '+_escHtml(it.detail)+'</span>'
    +(it.note?'<span class="mlx-n">'+_escHtml(it.note)+'</span>':'')
    +'</span>'+right+'</button>';
}

// Chaque ligne renvoie vers l'ecran qui existe deja : rien de neuf a apprendre.
function _mlGo(kind,ref){
  if(kind==='ouillage'){
    if(isSaisonnier()){ showToast('Acc\u00e8s lecture seule \ud83d\udd12','#B85A1A'); return; }
    caveSection='elevage'; renderCave();
    _caveQuickOp(null,'ouillage',ref);
    return;
  }
  if(kind==='decuvage'){
    if(isSaisonnier()){ showToast('Acc\u00e8s lecture seule \ud83d\udd12','#B85A1A'); return; }
    caveSection='vendange'; _vendTab='cuves'; renderCave();
    if(typeof openVendDecuvage==='function') openVendDecuvage(ref);
    return;
  }
  if(kind==='mesure'){
    if(isSaisonnier()){ showToast('Acc\u00e8s lecture seule \ud83d\udd12','#B85A1A'); return; }
    caveSection='vendange'; _vendTab='cuves'; renderCave();
    openOvVendMesure(ref);
    return;
  }
  if(kind==='soutirage'){
    if(isSaisonnier()){ showToast('Acc\u00e8s lecture seule \ud83d\udd12','#B85A1A'); return; }
    caveSection='elevage'; renderCave();
    _caveQuickOp(null,'soutirage',ref);
    return;
  }
  // ⚠ Les kinds ci-dessous decrivent une CUVE : ils vivent au Cuvier.
  // Tout le reste est un geste du CHAI. Le repli partait autrefois au
  // Cuvier quel que soit le kind : « Soutirer » atterrissait donc sur
  // l'ecran des cuves, en silence. Un kind inconnu reste au Chai.
  if(kind==='fa'||kind==='alerte'||kind==='demarrage'){
    caveSection='vendange'; _vendTab='cuves'; renderCave();
    return;
  }
  caveSection='elevage'; renderCave();
}

function _mlRenderVenir(){
  var from=_mlAuj(), ag=_mlAgenda(from,_ML_SEM), h='';
  var vide=ag.every(function(s){ return !s.items.length; });
  if(vide){
    return '<div class="mlx-empty">Rien ne vient dans les quatre prochaines semaines.<br>'
      +'Ni f\u00fbt \u00e0 ouiller, ni cuve en fermentation.</div>';
  }
  h+='<div class="mlx-sec">Les quatre prochaines semaines</div>';
  h+='<div class="mlx-hint">Tout vient de ce qui est d\u00e9j\u00e0 saisi : dernier ouillage, relev\u00e9s de '
    +'densit\u00e9, seuil d\u2019alerte '+(_caveMilsEnCave().length>1?'de chaque mill\u00e9sime':'du domaine ('+_mlSeuil()+' jours)')+'. Rien de plus \u00e0 remplir.</div>';
  ag.forEach(function(s,i){
    var r=_mlResumeSem(s), sum=[];
    if(r.futs) sum.push('<b>'+r.futs+' f\u00fbt'+(r.futs>1?'s':'')+'</b> \u00e0 ouiller (~'+r.litres+' L)');
    if(r.mesures) sum.push(r.mesures+' cuve'+(r.mesures>1?'s':'')+' \u00e0 mesurer');
    if(r.alertes) sum.push('<span class="al">'+r.alertes+' alerte'+(r.alertes>1?'s':'')+'</span>');
    h+='<div class="mlx-wk'+(i===0?' now':'')+'">'
      +'<div class="mlx-wkh"><span class="mlx-wkt">'+(i===0?'Cette semaine':'Semaine du '+_mlFrC(s.lundi))+'</span>'
      +(i===0?'<span class="mlx-wknow">en cours</span>':'')
      +'<span class="mlx-wkd">'+_mlFrC(s.lundi)+' \u2013 '+_mlFrC(s.dim)+'</span></div>'
      +(sum.length?'<div class="mlx-wks">'+sum.join(' \u00b7 ')+'</div>':'')
      +(s.items.length?s.items.map(_mlEvHtml).join(''):'<div class="mlx-wke">Rien de pr\u00e9vu.</div>')
      +'</div>';
  });
  h+='<div class="mlx-hint" style="margin-top:14px">La charge repart au rythme propre \u00e0 chaque mill\u00e9sime : '
    +'c\u2019est le rythme d\u2019ouillage r\u00e9gl\u00e9 dans Le Chai.</div>';
  return h;
}

// Le graphique est dessine a 1 unite SVG = 1 pixel. Sans cela, width:100% plus
// height:auto etirent AUSSI les hauteurs de barres et les tailles de texte : sur
// un ecran large tout partait a x5 (constate le 06/08/2026 en 1900 px de large).
// La largeur de dessin est donc MESUREE sur le conteneur, bornee, et le dessin
// est repeint au redimensionnement. Meme principe que .mvv-spark (height fixe)
// et que le donut du Pilotage (max-width) : jamais de SVG libre en hauteur.
var _ML_FLUX_MIN=300, _ML_FLUX_MAX=720, _ML_FLUX_DEF=352;
var _mlFluxCh=null, _mlFluxW0=0, _mlFluxHooked=false;

function _mlFluxW(el){
  var w=0;
  if(el&&el.clientWidth>0) w=el.clientWidth;
  else {
    var b=document.getElementById('ml-body');
    if(b&&b.clientWidth>0) w=b.clientWidth-30;   // padding + bordures de .mlx-flux
  }
  if(!(w>0)) return _ML_FLUX_DEF;
  return Math.round(Math.max(_ML_FLUX_MIN,Math.min(_ML_FLUX_MAX,w)));
}

// Repeint le seul graphique, sans reconstruire la page. Silencieux si la vue
// n'est pas a l'ecran ou si la largeur n'a pas bouge.
function _mlFluxPaint(){
  var box=document.querySelector('.mlx-fluxsvg');
  if(!box||!_mlFluxCh) return;
  var w=_mlFluxW(box);
  if(w===_mlFluxW0) return;
  _mlFluxW0=w;
  box.innerHTML=_mlFluxSvg(_mlFluxCh,w);
}

function _mlFluxHook(){
  if(_mlFluxHooked) return;
  _mlFluxHooked=true;
  var t=null;
  window.addEventListener('resize',function(){
    if(t) clearTimeout(t);
    t=setTimeout(_mlFluxPaint,200);
  });
}

// Flux vertical : la largeur d'un etage est proportionnelle au volume.
function _mlFluxSvg(ch,W){
  W=(W>0)?Math.round(W):_ML_FLUX_DEF;
  var PAD=8, ROW=46, GAP=34;
  var hlRentre=ch.kg/ch.kgHl, hlVendu=ch.kgVendu/ch.kgHl, hlCuve=hlRentre-hlVendu;
  var etages=[
    {lab:'Rentr\u00e9 de la vigne', v:hlRentre,
     sub:Math.round(ch.kg)+' kg \u00b7 '+ch.parcelles+' parcelle'+(ch.parcelles>1?'s':''), c:'#8A5A38'},
    {lab:'Encuv\u00e9', v:hlCuve,
     sub:ch.hlCuve?('dont '+ch.hlCuve+' hL encore en cuve'):'cuvaison termin\u00e9e', c:'#7A4A8A'},
    {lab:'En f\u00fbt', v:ch.hlFut, sub:ch.futs?(ch.futs+' f\u00fbts'):'\u2014', c:'#C0845A'},
    {lab:'En bouteille', v:ch.btl?ch.btl*0.75/100:0,
     sub:ch.btl?(ch.btl+' cols en stock'):('projection '+_mvBtl(ch.hlFut)+' cols'),
     c:'#7A1020', proj:!ch.btl}
  ];
  // Les etages de TETE a zero sont retires : sans recolte saisie au Cuvier, un flux
  // qui part de 0 hL pour arriver aux futs dessine un ruban qui s'elargit, soit
  // l'inverse de ce qui se passe. On commence au premier etage renseigne.
  while(etages.length>1 && !(etages[0].v>0)) etages.shift();
  var max=Math.max(etages[0].v,1);
  var H=etages.length*ROW+(etages.length-1)*GAP+26;
  function larg(v){ return Math.max(6,(v/max)*(W-2*PAD)); }
  var s='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="Parcours du mill\u00e9sime, de la vigne \u00e0 la bouteille">'
    +'<defs><linearGradient id="mlxgr" x1="0" y1="0" x2="1" y2="0">'
    +'<stop offset="0" stop-color="#C2A14D"/><stop offset="1" stop-color="#8A5A38"/></linearGradient></defs>';
  etages.forEach(function(e,i){
    var y=i*(ROW+GAP), w=larg(e.v), x=PAD;
    if(i<etages.length-1){
      var n=etages[i+1], wn=larg(n.v), y2=y+ROW+GAP;
      s+='<path d="M'+x+' '+(y+ROW)+' L'+(x+w)+' '+(y+ROW)
        +' C'+(x+w)+' '+(y+ROW+GAP*0.6)+' '+(x+wn)+' '+(y2-GAP*0.6)+' '+(x+wn)+' '+y2
        +' L'+x+' '+y2+' Z" fill="url(#mlxgr)" opacity="'+(n.proj?0.16:0.3)+'"'
        +(n.proj?' stroke="#8A5A38" stroke-dasharray="3 3" stroke-opacity=".4"':'')+'/>';
      var perte=e.v>0?Math.round((1-n.v/e.v)*100):0;
      if(perte>0&&!n.proj) s+='<text x="'+(x+Math.min(w,wn)/2)+'" y="'+(y+ROW+GAP/2+4)
        +'" font-size="10.5" fill="#7A1020" text-anchor="middle" font-weight="600">\u2212'+perte+' %</text>';
    }
    s+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+ROW+'" rx="9" fill="'+e.c+'"'
      +(e.proj?' opacity=".28" stroke="'+e.c+'" stroke-dasharray="4 3"':'')+'/>'
      +'<text x="'+(x+11)+'" y="'+(y+20)+'" font-size="12.5" fill="#F5EFE2" font-weight="600">'+e.lab+'</text>'
      +'<text x="'+(x+11)+'" y="'+(y+35)+'" font-size="10.5" fill="#F5EFE2" opacity=".72">'+e.sub+'</text>'
      +'<text x="'+(W-2)+'" y="'+(y+27)+'" font-size="15" fill="#2A241C" text-anchor="end" font-weight="700">'
      +_mvF1(e.v)+'<tspan font-size="10" opacity=".6"> hL</tspan></text>';
    if(i===0&&hlVendu>0){
      s+='<path d="M'+(x+w)+' '+(y+8)+' q26 6 26 26 l0 10" stroke="#A0A8B8" stroke-width="2.5" fill="none" opacity=".6"/>'
        +'<text x="'+(x+w+18)+'" y="'+(y+ROW+18)+'" font-size="10" fill="#5F5F5F" text-anchor="middle">vendu</text>'
        +'<text x="'+(x+w+18)+'" y="'+(y+ROW+30)+'" font-size="10" fill="#5F5F5F" text-anchor="middle" font-weight="600">'
        +_mvF1(hlVendu)+' hL</text>';
    }
  });
  return s+'</svg>';
}

function _mlRenderVie(){
  var mil=_mlMilActif(), h='';
  h+='<div class="mlx-chips">';
  _mlMillesimes().forEach(function(m){
    var c=_mlChaine(m);
    var sub=c.btl?(c.btl+' cols'):(c.futs?(c.futs+' f\u00fbts'):(c.kg?(Math.round(c.kg/1000*10)/10+' t'):'\u2014'));
    h+='<button class="mlx-chip'+(String(m)===String(mil)?' on':'')+'" onclick="_mlSetMil('+m+')">'
      +m+'<small>'+sub+'</small></button>';
  });
  h+='</div>';

  var ch=_mlChaine(mil);
  if(!ch.kg && !ch.futs && !ch.btl){
    return h+'<div class="mlx-empty">Rien d\u2019enregistr\u00e9 sur ce mill\u00e9sime.<br>'
      +'Les r\u00e9coltes se saisissent au Cuvier, les cuv\u00e9es au Chai.</div>';
  }

  h+='<div class="mlx-sec">De la vigne \u00e0 la bouteille</div>';
  _mlFluxCh=ch; _mlFluxW0=_mlFluxW();
  h+='<div class="mlx-flux"><div class="mlx-fluxsvg">'+_mlFluxSvg(ch,_mlFluxW0)+'</div>';
  var cuve0=ch.kgCuve/ch.kgHl, foot='';
  if(ch.retro) foot+='Mill\u00e9sime ant\u00e9rieur au suivi du Cuvier : les volumes viennent du bilan '
    +'fig\u00e9 \u00e0 la mise en bouteille. ';
  else if(!ch.kg && (ch.futs||ch.btl)) foot+='Aucune r\u00e9colte saisie au Cuvier pour ce '
    +'mill\u00e9sime : le parcours commence au chai. Renseignez les r\u00e9coltes pour voir le volume '
    +'perdu depuis la vigne. ';
  // Une perte « de la benne au col » ne se calcule QUE si plus rien n'est en cuve.
  // Sinon on compare les futs au total encuve et on annonce une perte enorme la ou
  // le vin est simplement en train de fermenter.
  if(ch.hlCuve>0){
    foot+='Mill\u00e9sime en cours : <b>'+ch.hlCuve+' hL</b> fermentent encore, <b>'+_mvF1(ch.hlFut)
      +' hL</b> sont d\u00e9j\u00e0 descendus au chai. La perte totale se lira quand tout sera d\u00e9cuv\u00e9. ';
  } else if(ch.btl&&cuve0>0){
    foot+='De la benne au col, <b>'+Math.round((1-(ch.btl*0.75/100)/cuve0)*100)
      +' %</b> du volume s\u2019est perdu en marc, lies et soutirages. ';
  } else if(ch.hlFut&&cuve0>0){
    foot+='De la benne au f\u00fbt, <b>'+Math.round((1-ch.hlFut/cuve0)*100)
      +' %</b> du volume s\u2019est perdu. Le reste se jouera \u00e0 l\u2019\u00e9levage et \u00e0 la mise. ';
  }
  foot+='Chaque \u00e9tage est un chiffre d\u00e9j\u00e0 saisi ailleurs \u2014 rien n\u2019est estim\u00e9 sauf la projection en pointill\u00e9.';
  h+='<div class="mlx-foot">'+foot+'</div></div>';

  var reste=_mlResteARentrer(mil);
  if(reste.length&&reste.length<=12){
    var haR=reste.reduce(function(s,p){ return s+(parseFloat(p.surface)||0); },0);
    h+='<div class="mlx-reste">\ud83c\udf47 Encore sur pied : <b>'
      +reste.map(function(p){ return _escHtml(p.nom); }).join(', ')+'</b> \u2014 '+_mvF1(haR)+' ha.</div>';
  }

  var rd=_mlRendements(mil);
  if(rd.length){
    var adm=(typeof isAdmin==='function'&&isAdmin());
    h+='<div class="mlx-sec">Rendement par parcelle</div>';
    h+='<div class="mlx-hint">'+(rd.some(function(r){return r.max;})
        ? 'Le trait vertical est le maximum de l\u2019appellation. Un d\u00e9passement ne bloque rien : il se voit.'
        : 'Aucun maximum d\u2019appellation renseign\u00e9.'+(adm?' Touchez une parcelle pour le poser.':''))+'</div>';
    rd.forEach(function(r){
      var ech=(r.max||0)*1.15;
      var wFill=r.max?Math.min(100,Math.round((r.hlHa/ech)*100)):0;
      h+='<button class="mlx-rd'+(r.depasse?' over':'')+'" onclick="_mlSetRdtMax(\''+_escHtml(r.parcelle.nom)+'\')">'
        +'<span class="mlx-rdh"><span class="mlx-rdn">'+_escHtml(r.parcelle.nom)+'</span>'
        +(r.depasse?'<span class="mlx-tag">au-dessus</span>':'')
        +(r.vendu?'<span class="mlx-tag sold">vendu</span>':'')
        +'<span class="mlx-rdv">'+_mvF1(r.hlHa)+'<small>hL/ha</small></span></span>'
        +'<span class="mlx-rda">'+_mvF1(parseFloat(r.parcelle.surface)||0)+' ha \u00b7 '
        +Math.round(r.kg)+' kg \u00b7 '+r.caisses+' caisses</span>';
      if(r.max){
        h+='<span class="mlx-tr" style="display:block"><span class="mlx-fi" style="display:block;width:'+wFill+'%"></span>'
          +'<span class="mlx-mk" style="left:87%"></span></span>'
          +'<span class="mlx-rdf"><span>'+r.pct+' % du maximum</span><span>max '+r.max+' hL/ha</span></span>';
      } else {
        h+='<span class="mlx-rdf"><span>'+(adm?'Toucher pour poser le maximum de l\u2019appellation'
          :'Maximum de l\u2019appellation non renseign\u00e9')+'</span></span>';
      }
      h+='</button>';
    });
  }

  var orgs=ch.cuvees.map(function(c){ return {c:c, o:_mlOrigine(c.id)}; })
                    .filter(function(x){ return x.o; });
  if(orgs.length){
    h+='<div class="mlx-sec">D\u2019o\u00f9 vient chaque cuv\u00e9e</div>';
    orgs.forEach(function(x){
      var kg=x.o.parcelles.reduce(function(s,p){ return s+p.kg; },0);
      h+='<div class="mlx-org"><div class="mlx-orgt">'+_escHtml(_mlNomCuvee(x.c))+'</div>'
        +'<div class="mlx-orgs">'+(x.c.statut==='embouteille'
            ? ((x.c.nb_bouteilles||0)+' bouteilles \u00b7 mise en bouteille le '+_caveDateFr(x.c.date_embouteillage))
            : (_caveNbTonneaux(x.c)+' f\u00fbts \u00b7 '+_mvF1(_mlHlCuvee(x.c))+' hL en \u00e9levage'))+'</div>'
        +'<div class="mlx-orgc"><span class="mlx-st">'+x.o.parcelles.length+' parcelle'
        +(x.o.parcelles.length>1?'s':'')+'</span><span class="mlx-ar">\u2192</span>'
        +'<span class="mlx-st">'+_escHtml(String(x.o.cuve.nom||'Cuve').split('\u00b7')[0].trim())+'</span>'
        +'<span class="mlx-ar">\u2192</span><span class="mlx-st">'+_caveNbTonneaux(x.c)+' f\u00fbts</span></div>';
      x.o.parcelles.forEach(function(p){
        h+='<div class="mlx-row"><span>'+_escHtml(p.nom)+'</span><b>'+Math.round(p.kg)+' kg</b></div>';
      });
      h+='<div class="mlx-row" style="border-top:1px solid rgba(138,90,56,.2)"><span>Encuv\u00e9 le '
        +_caveDateFr(x.o.cuve.date_entree)+'</span><b>'+Math.round(kg)+' kg</b></div></div>';
    });
  }
  return h;
}

// Maximum de l'appellation : seule donnee que l'ecran demande, posee une fois
// par parcelle, par un administrateur. Ecrite dans PARCELLES, pas ailleurs.
function _mlSetRdtMax(nom){
  if(typeof isAdmin!=='function'||!isAdmin()){
    showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur \ud83d\udd12','#B85A1A'); return;
  }
  var p=_vendParcByName(nom);
  if(!p){ showToast('Parcelle introuvable','#B85A1A'); return; }
  if(typeof window.openPrompt!=='function'){ showToast('Saisie indisponible','#B85A1A'); return; }
  window.openPrompt({
    titre:'Rendement maximum', sub:nom+' \u2014 le plafond de l\u2019appellation, en hL/ha.',
    valeur:(p.rdt_max!=null?String(p.rdt_max):''), unite:'hL/ha', icone:'\u{1F347}',
    type:'nombre', placeholder:'45', btnLabel:'Enregistrer',
    cb:function(v){
      var n=parseFloat(String(v).replace(',','.'));
      if(!isFinite(n)||n<=0){ showToast('Valeur non comprise','#B85A1A'); return; }
      p.rdt_max=Math.round(n*10)/10;
      _vendSaveParcelles();
      showToast('\u2705 '+nom+' \u00b7 max '+_mvF1(p.rdt_max)+' hL/ha','#3D6B27');
      renderCaveMillesime();
    }
  });
}

function _mlSetMil(m){ _mlMil=m; renderCaveMillesime(); }
function _mlSetTab(t){ _mlTab=(t==='vie')?'vie':'venir'; renderCaveMillesime(); }

function renderCaveMillesime(){
  _mlInjectCss();
  var icoEl=document.getElementById('cave-hdr-ico'); if(icoEl) icoEl.textContent='\u{1F570}\u{FE0F}';
  var ttlEl=document.getElementById('cave-hdr-title'); if(ttlEl) ttlEl.textContent='Le mill\u00e9sime';
  var subEl=document.getElementById('cave-hdr-sub'); if(subEl) subEl.textContent=(window.DOMAINE_NOM||'Mon domaine');
  var bdg=document.getElementById('cave-hdr-badge'); if(bdg) bdg.textContent='Campagne '+_mlCampagne();
  var mvcHost=document.getElementById('mvc-elevage'); if(mvcHost) mvcHost.style.display='none';
  ['cuv','journal','divers','vend'].forEach(function(t){
    var v=document.getElementById('cave-view-'+t); if(v) v.style.display='none';
  });
  var host=document.getElementById('cave-view-mil'); if(!host) return;
  host.style.display='block';

  var body=document.getElementById('ml-body'); if(!body) return;
  if(!window._dataReady){
    var kpS=document.getElementById('cave-kpis'); if(kpS){ kpS.innerHTML=''; kpS.style.display='none'; }
    body.innerHTML=window._mvSk?window._mvSk('chai'):'';
    return;
  }

  // bande de chiffres
  var ag=_mlAgenda(_mlAuj(),_ML_SEM), r=_mlResumeSem(ag[0]);
  var actives=(CAVE_VENDANGE.cuves_vinif||[]).filter(_vendIsActive).length;
  var kp=document.getElementById('cave-kpis');
  if(kp){
    kp.style.display='';
    kp.innerHTML=[[r.futs,'f\u00fbts cette sem.',false],[r.mesures,'\u00e0 mesurer',false],
                  [actives,'en cuve',false],[r.alertes,'alertes',r.alertes>0]]
      .map(function(k){
        return '<div class="mvu-kpi'+(k[2]?' due':'')+'"><div class="mvu-kpi-v">'+k[0]
          +'</div><div class="mvu-kpi-l">'+k[1]+'</div></div>';
      }).join('');
  }
  var tv=document.getElementById('ml-tab-venir'); if(tv) tv.classList.toggle('active',_mlTab==='venir');
  var tl=document.getElementById('ml-tab-vie');   if(tl) tl.classList.toggle('active',_mlTab==='vie');
  body.innerHTML=_caveSaisBanner()+(_mlTab==='vie'?_mlRenderVie():_mlRenderVenir());
  _mlFluxPaint();   // la largeur reelle n'est connue qu'une fois le HTML pose
  _mlFluxHook();
}

window.renderCaveMillesime = renderCaveMillesime;
window._mlSetTab           = _mlSetTab;
window._mlSetMil           = _mlSetMil;
window._mlSetRdtMax        = _mlSetRdtMax;
window._mlGo               = _mlGo;
window._mlAgenda           = _mlAgenda;
window._mlProjFA           = _mlProjFA;
window._mlChaine           = _mlChaine;
window._mlRendements       = _mlRendements;
window._mlOrigine          = _mlOrigine;
window._mlOuillages        = _mlOuillages;
window._mlResumeSem        = _mlResumeSem;
window._mlMillesimes       = _mlMillesimes;
window._mlResteARentrer    = _mlResteARentrer;

// ── Sort du contenant apres retrait ────────────────────────────────────────
// Le bloc est injecte au-dessus des notes de l'overlay existant : aucun id neuf
// dans index.html, meme patron que _caveEnsureBtlTab.
function _rfutRenderGarder(){
  var host=document.getElementById('rfut-garder');
  if(!host){
    var anc=document.getElementById('rfut-notes');
    if(!anc||!anc.parentNode) return;
    host=document.createElement('div');
    host.id='rfut-garder';
    host.style.margin='4px 0 12px';
    anc.parentNode.insertBefore(host, anc);
  }
  host.innerHTML='<div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;'
    +'color:var(--texte-doux);margin-bottom:6px">Et le f\u00fbt ?</div>'
    +'<div style="display:flex;gap:7px">'
    +'<button type="button" class="rfut-reason-btn'+(_retraitFutGarder?' sel':'')+'" style="flex:1"'
    +' onclick="window._rfutSetGarder(true)">\u{1F513} Revient au parc</button>'
    +'<button type="button" class="rfut-reason-btn'+(!_retraitFutGarder?' sel':'')+'" style="flex:1"'
    +' onclick="window._rfutSetGarder(false)">\u{1F5D1}\u{FE0F} Je le jette</button>'
    +'</div>';
}
function _rfutSetGarder(v){ _retraitFutGarder=!!v; _rfutRenderGarder(); }
window._rfutSetGarder = _rfutSetGarder;

/* ════════════════════════════════════════════════════════════════
   MA VIGNE — REGISTRE DES MANIPULATIONS OENOLOGIQUES
   Etape A du lot 5. On ne demande RIEN de nouveau : tout est deja
   saisi au Cuvier (operations de cuve) et au Chai (operations de
   cave). On met en forme.

   PERIMETRE : les MANIPULATIONS, c'est-a-dire ce qu'on ajoute au vin
   ou ce qu'on lui fait subir. Le suivi courant — ouillage, mesures de
   densite, analyses — n'en fait pas partie : l'inclure noierait le
   document sous des dizaines de lignes sans interet pour un controle.
   Il est resume en pied plutot qu'ignore.

   ⚠️ Ma Vigne PREPARE, l'exploitant DECLARE. Ce document est un etat
   interne, pas une declaration officielle.
   ════════════════════════════════════════════════════════════════ */

/* Familles de manipulations. L'ordre compte : l'enrichissement et le
   sulfitage sont les deux postes qu'un controle regarde en premier. */
var RM_FAMILLES = [
  {k:'enrichissement', lbl:'Enrichissement',      ico:'\u{1F36C}'},
  {k:'sulfitage',      lbl:'Sulfitage',           ico:'\u{1F9EA}'},
  {k:'intrant',        lbl:'Adjonctions',         ico:'\u{1F9EB}'},
  {k:'pratique',       lbl:'Pratiques de cave',   ico:'\u{1F504}'}
];
/* Correspondance type saisi -> famille. Un type absent de cette table
   n'entre PAS au registre : c'est du suivi, pas une manipulation. */
var RM_TYPES = {
  // Cuvier
  chaptalisation:  {fam:'enrichissement', lbl:'Chaptalisation'},
  so2:             {fam:'sulfitage',      lbl:'Sulfitage'},
  levurage:        {fam:'intrant',        lbl:'Levurage'},
  nutriment:       {fam:'intrant',        lbl:'Nutriment'},
  saignee:         {fam:'pratique',       lbl:'Saign\u00e9e'},
  refroidissement: {fam:'pratique',       lbl:'Refroidissement'},
  rechauffement:   {fam:'pratique',       lbl:'R\u00e9chauffement'},
  delestage:       {fam:'pratique',       lbl:'D\u00e9lestage'},
  // Chai
  soufre:          {fam:'sulfitage',      lbl:'M\u00e8che / pastille de soufre'},
  soutirage:       {fam:'pratique',       lbl:'Soutirage'}
};
/* Volontairement HORS registre, et resumes en pied de document. */
var RM_HORS = {ouillage:'Ouillages', analyse:'Analyses', retrait_fut:'Retraits de f\u00fbts', autre:'Autres'};

function _rmNum(v){ var n = parseFloat(v); return isFinite(n) ? n : null; }
function _rmF(n, d){
  if(n == null) return '\u2014';
  var s = (Math.round(n * Math.pow(10, d==null?1:d)) / Math.pow(10, d==null?1:d));
  return String(s).replace('.', ',');
}
function _rmDate(iso){
  var p = String(iso||'').split('-');
  return (p.length === 3) ? (p[2] + '/' + p[1] + '/' + p[0]) : (iso || '');
}
/* Campagne d'une date : meme axe 1er aout -> 31 juillet que le reste de l'app. */
function _rmCampagne(iso){
  if(typeof window !== 'undefined' && typeof window._mvCampagneDe === 'function')
    return window._mvCampagneDe(iso);
  var p = String(iso||'').split('-');
  var a = parseInt(p[0],10), m = parseInt(p[1],10);
  if(!a || !m){ var d = new Date(); return (d.getMonth()+1 >= 8) ? d.getFullYear() : d.getFullYear()-1; }
  return (m >= 8) ? a : (a - 1);
}

/* ── Le detail lisible d'une manipulation ──────────────────────────
   Chaque ligne doit se comprendre SANS revenir a l'ecran de saisie. */
function _rmDetail(o){
  var d = [];
  switch(o.type){
    case 'chaptalisation':
      if(o.volume_hl != null) d.push(_rmF(o.volume_hl) + ' hL trait\u00e9s');
      if(o.degre != null)     d.push('+' + _rmF(o.degre) + '\u00b0 vis\u00e9');
      if(o.kg_sucre != null)  d.push(_rmF(o.kg_sucre) + ' kg de sucre');
      break;
    case 'so2':
      if(o.dose != null) d.push(_rmF(o.dose) + ' g/hL');
      if(o.dose != null && o.volume_hl) d.push('soit ' + _rmF(o.dose * o.volume_hl) + ' g');
      break;
    case 'soufre':
      if(o.grammes_pastille) d.push(o.grammes_pastille + ' g/pastille');
      if(o.nb_total)         d.push(o.nb_total + ' pastille' + (o.nb_total>1?'s':''));
      if(o.so2_total_g)      d.push(_rmF(o.so2_total_g) + ' g de SO\u2082');
      break;
    case 'levurage':
      if(o.souche) d.push(o.souche);
      if(o.dose != null) d.push(_rmF(o.dose) + ' g/hL');
      break;
    case 'nutriment':
      if(o.ntype) d.push(o.ntype);
      if(o.dose != null) d.push(_rmF(o.dose) + ' g/hL');
      break;
    case 'saignee':
      if(o.volume_hl != null) d.push(_rmF(o.volume_hl) + ' hL saign\u00e9s');
      break;
    case 'refroidissement':
    case 'rechauffement':
      if(o.temp_c != null) d.push('cible ' + _rmF(o.temp_c) + ' \u00b0C');
      break;
    case 'delestage':
      if(o.nb) d.push(o.nb + ' d\u00e9lestage' + (o.nb>1?'s':''));
      break;
    case 'soutirage':
      if(o.so2_dose != null) d.push('SO\u2082 ' + _rmF(o.so2_dose) + ' ' + (o.so2_unite||'cL'));
      if(o.so2_mode === 'repete' && o.so2_nb) d.push(o.so2_nb + ' doses / ' + o.so2_freq + ' j');
      break;
  }
  return d.join(' \u00b7 ');
}

/* ── Collecte : Cuvier puis Chai, une ligne par manipulation ──────── */
function _rmLignes(CAVE_VENDANGE, CAVE_ELEVAGE, campagne, millesime){
  var out = [], hors = {};
  var milOk = function(m){ return millesime == null || String(m) === String(millesime); };

  // ── Cuvier : operations de cuve ──
  ((CAVE_VENDANGE && CAVE_VENDANGE.cuves_vinif) || []).forEach(function(c){
    ((c.operations) || []).forEach(function(o){
      if(!o || !o.date) return;
      if(campagne != null && _rmCampagne(o.date) !== campagne) return;
      var T = RM_TYPES[o.type];
      if(!T){ hors[o.type] = (hors[o.type]||0) + 1; return; }
      // le volume de la cuve sert a convertir les doses en g/hL
      var e = {};
      for(var k in o) if(Object.prototype.hasOwnProperty.call(o,k)) e[k] = o[k];
      if(e.volume_hl == null) e.volume_hl = _rmNum(c.volume_hl);
      var mc = _rmMilCuve(CAVE_VENDANGE, c.id);
      if(!milOk(mc)) return;
      out.push({date:o.date, fam:T.fam, type:o.type, lbl:T.lbl, source:'Cuvier', mil:mc,
                contenant:c.nom || 'Cuve', volume:_rmNum(c.volume_hl),
                detail:_rmDetail(e), note:o.note || '', operateur:'', brut:e});
    });
  });

  // ── Chai : operations de cave ──
  ((CAVE_ELEVAGE && CAVE_ELEVAGE.operations) || []).forEach(function(o){
    if(!o || !o.date) return;
    if(campagne != null && _rmCampagne(o.date) !== campagne) return;
    var T = RM_TYPES[o.type];
    if(!T){ hors[o.type] = (hors[o.type]||0) + 1; return; }
    // ⚠ BUG CORRIGE, deuxieme occurrence du meme : le champ s'appelle
    // cuvees_ids (cuvee_id au singulier pour les operations anciennes).
    // « o.cuvees » ne matchait jamais : la colonne « contenant » du registre
    // sortait VIDE pour toutes les operations du Chai.
    var _ids = o.cuvees_ids || (o.cuvee_id ? [o.cuvee_id] : []);
    var noms = _ids.map(function(id){
      var c = ((CAVE_ELEVAGE.cuvees)||[]).find(function(x){ return x.id === id; });
      return c ? (c.nom + (c.millesime ? ' \u2019' + String(c.millesime).slice(-2) : '')) : null;
    }).filter(Boolean);
    var mch = _rmMilCuvees(CAVE_ELEVAGE, _ids);
    if(!milOk(mch)) return;
    var e = {};
    if(o.data) for(var k in o.data) if(Object.prototype.hasOwnProperty.call(o.data,k)) e[k] = o.data[k];
    e.type = o.type;
    // le SO2 d'un soutirage est imbrique dans data.so2
    if(o.type === 'soutirage' && o.data && o.data.so2 && o.data.so2.mode && o.data.so2.mode !== 'none'){
      e.so2_dose = _rmNum(o.data.so2.dose);
      e.so2_unite = o.data.so2.unite;
      e.so2_mode = (o.data.so2.mode === 'unique') ? 'unique' : 'repete';
      e.so2_nb = o.data.so2.nb_doses; e.so2_freq = o.data.so2.freq_j;
    }
    var qui = o.operateur || '';
    if(!qui && o.intervenants && o.intervenants.length) qui = o.intervenants.join(', ');
    out.push({date:o.date, fam:T.fam, type:o.type, lbl:T.lbl, source:'Chai', mil:mch,
              contenant:noms.length ? noms.join(', ') : 'Toutes cuv\u00e9es',
              volume:null, detail:_rmDetail(e),
              note:(o.notes || (o.data && o.data.note) || ''), operateur:qui, brut:e});
  });

  out.sort(function(a,b){
    if(a.date !== b.date) return String(a.date).localeCompare(String(b.date));
    return a.fam.localeCompare(b.fam);
  });
  return {lignes:out, hors:hors};
}

/* ── Totaux : ce qu'un controle regarde en premier ────────────────── */
function _rmTotaux(lignes){
  var t = {sucre:0, volEnrichi:0, nbEnrich:0, so2g:0, nbSulf:0, saignee:0, parFam:{}, parType:{}};
  lignes.forEach(function(l){
    t.parFam[l.fam] = (t.parFam[l.fam]||0) + 1;
    t.parType[l.type] = (t.parType[l.type]||0) + 1;
    var b = l.brut || {};
    if(l.type === 'chaptalisation'){
      t.nbEnrich++;
      if(b.kg_sucre != null) t.sucre += b.kg_sucre;
      if(b.volume_hl != null) t.volEnrichi += b.volume_hl;
    }
    if(l.type === 'so2'){
      t.nbSulf++;
      if(b.dose != null && b.volume_hl) t.so2g += b.dose * b.volume_hl;
    }
    if(l.type === 'soufre'){
      t.nbSulf++;
      if(b.so2_total_g != null) t.so2g += b.so2_total_g;
    }
    if(l.type === 'soutirage' && b.so2_dose != null) t.nbSulf++;
    if(l.type === 'saignee' && b.volume_hl != null) t.saignee += b.volume_hl;
  });
  return t;
}

/* ── Campagnes disponibles, la plus recente d'abord ──────────────── */
/* ── Rattacher une operation a SON millesime ───────────────────────
   ⚠ MODELE ARBITRE PAR NICO : chaque millesime est une entite a part, dans
   sa propre cave. Le registre doit donc se lire millesime par millesime,
   pas campagne par campagne : une campagne contient le millesime qui rentre
   ET celui qui finit son elevage.
   Une CUVE se rattache par les recoltes qui l'alimentent ; une CUVEE porte
   son millesime en clair. */
function _rmMilCuve(CAVE_VENDANGE, cuveId){
  var recs = ((CAVE_VENDANGE && CAVE_VENDANGE.recoltes) || [])
    .filter(function(r){ return r && r.cuve_id === cuveId && r.date; });
  if(!recs.length) return null;
  // Une cuve remplie sur deux annees civiles n'existe pas en pratique ;
  // on prend la plus ancienne recolte, qui date la cuvaison.
  recs.sort(function(a,b){ return String(a.date).localeCompare(String(b.date)); });
  return String(recs[0].date).slice(0,4);
}
function _rmMilCuvees(CAVE_ELEVAGE, ids){
  var set = {};
  (ids||[]).forEach(function(id){
    var c = ((CAVE_ELEVAGE && CAVE_ELEVAGE.cuvees) || []).find(function(x){ return x.id === id; });
    if(c && c.millesime) set[String(c.millesime)] = 1;
  });
  var k = Object.keys(set);
  return k.length === 1 ? k[0] : null;   // mixte ou inconnu -> non rattachable
}
/* Les millesimes pour lesquels il y a des manipulations a raconter. */
function _rmMillesimes(CAVE_VENDANGE, CAVE_ELEVAGE){
  var set = {};
  _rmLignes(CAVE_VENDANGE, CAVE_ELEVAGE, null, null).lignes.forEach(function(l){
    if(l.mil) set[l.mil] = 1;
  });
  return Object.keys(set).sort(function(a,b){ return Number(b)-Number(a); });
}
function _rmCampagnes(CAVE_VENDANGE, CAVE_ELEVAGE){
  var set = {};
  ((CAVE_VENDANGE && CAVE_VENDANGE.cuves_vinif) || []).forEach(function(c){
    ((c.operations)||[]).forEach(function(o){ if(o && o.date && RM_TYPES[o.type]) set[_rmCampagne(o.date)] = 1; });
  });
  ((CAVE_ELEVAGE && CAVE_ELEVAGE.operations) || []).forEach(function(o){
    if(o && o.date && RM_TYPES[o.type]) set[_rmCampagne(o.date)] = 1;
  });
  return Object.keys(set).map(Number).sort(function(a,b){ return b-a; });
}

function _rmDoc(CAVE_VENDANGE, CAVE_ELEVAGE, DOM, campagne, millesime){
  var r = _rmLignes(CAVE_VENDANGE, CAVE_ELEVAGE, campagne, millesime);
  var T = _rmTotaux(r.lignes);
  var e = function(s){ return String(s==null?'':s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var auj = new Date();
  var jj = String(auj.getDate()).padStart(2,'0') + '/'
         + String(auj.getMonth()+1).padStart(2,'0') + '/' + auj.getFullYear();

  /* ── en-tête ── */
  var h = '<div class="rm-hero">'
    + '<div class="rm-hero-k">Registre des manipulations \u0153nologiques</div>'
    + '<div class="rm-hero-t">' + e(DOM.nom) + '</div>'
    + '<div class="rm-hero-s">' + e(DOM.commune || '')
    + (DOM.siret ? ' \u00b7 SIRET ' + e(DOM.siret) : '') + '</div>'
    + '<div class="rm-hero-c">'
    + (millesime != null
        ? ('<span>Mill\u00e9sime <b>' + millesime + '</b></span>'
           + '<span>toutes les manipulations de ce vin, de la cuve au f\u00fbt</span>')
        : ('<span>Campagne <b>' + campagne + '\u2013' + (campagne+1) + '</b></span>'
           + '<span>du 1<sup>er</sup> ao\u00fbt ' + campagne + ' au 31 juillet ' + (campagne+1) + '</span>'))
    + '<span>\u00e9dit\u00e9 le ' + jj + '</span></div></div>';

  /* ── les deux chiffres qu'un contrôle regarde en premier ── */
  h += '<div class="rm-tiles">'
    + '<div class="rm-tile"><div class="rm-tile-v">' + _rmF(T.sucre,1) + '<small>kg</small></div>'
    + '<div class="rm-tile-l">sucre d\u2019enrichissement</div>'
    + '<div class="rm-tile-s">' + T.nbEnrich + ' op\u00e9ration' + (T.nbEnrich>1?'s':'')
    + ' \u00b7 ' + _rmF(T.volEnrichi,0) + ' hL trait\u00e9s</div></div>'
    + '<div class="rm-tile"><div class="rm-tile-v">' + _rmF(T.so2g,0) + '<small>g</small></div>'
    + '<div class="rm-tile-l">SO\u2082 tra\u00e7able</div>'
    + '<div class="rm-tile-s">' + T.nbSulf + ' sulfitage' + (T.nbSulf>1?'s':'')
    + ' \u00b7 doses en cL non converties</div></div>'
    + '<div class="rm-tile"><div class="rm-tile-v">' + r.lignes.length + '</div>'
    + '<div class="rm-tile-l">manipulations</div>'
    + '<div class="rm-tile-s">' + RM_FAMILLES.filter(function(f){ return T.parFam[f.k]; })
        .map(function(f){ return T.parFam[f.k] + ' ' + f.lbl.toLowerCase(); }).join(' \u00b7 ') + '</div></div>'
    + '</div>';

  if(!r.lignes.length){
    h += '<div class="rm-vide">Aucune manipulation enregistr\u00e9e sur cette campagne.</div>';
    return h + _rmPied(r, DOM);
  }

  /* ── par famille : l'enrichissement d'abord ── */
  RM_FAMILLES.forEach(function(F){
    var L = r.lignes.filter(function(l){ return l.fam === F.k; });
    if(!L.length) return;
    h += '<div class="rm-sec"><span class="rm-sec-i">' + F.ico + '</span>' + F.lbl
      + '<span class="rm-sec-n">' + L.length + '</span></div>';
    h += '<table class="rm-t"><thead><tr>'
      + '<th class="d">Date</th><th>Contenant</th><th>Nature</th>'
      + '<th class="w">D\u00e9tail</th><th>Intervenant</th></tr></thead><tbody>';
    L.forEach(function(l){
      h += '<tr><td class="d">' + _rmDate(l.date) + '</td>'
        + '<td class="c">' + e(l.contenant) + '<span class="src">' + l.source + '</span></td>'
        + '<td>' + e(l.lbl) + '</td>'
        + '<td class="w">' + e(l.detail || '\u2014')
        + (l.note ? '<span class="nt">' + e(l.note) + '</span>' : '') + '</td>'
        + '<td class="o">' + (l.operateur ? e(l.operateur) : '\u2014') + '</td></tr>';
    });
    h += '</tbody></table>';
    if(F.k === 'enrichissement' && T.nbEnrich){
      h += '<div class="rm-tot">Total campagne : <b>' + _rmF(T.sucre,1) + ' kg</b> de sucre '
        + 'sur <b>' + _rmF(T.volEnrichi,0) + ' hL</b>.</div>';
    }
    if(F.k === 'sulfitage' && T.so2g){
      h += '<div class="rm-tot">Total tra\u00e7able : <b>' + _rmF(T.so2g,0) + ' g</b> de SO\u2082. '
        + 'Les doses saisies en cL de solution ne sont pas converties \u2014 elles d\u00e9pendent '
        + 'du titre de votre solution.</div>';
    }
  });

  /* ── chronologie ── */
  h += '<div class="rm-sec rm-brk"><span class="rm-sec-i">\u{1F4C5}</span>Chronologie'
    + '<span class="rm-sec-n">' + r.lignes.length + '</span></div>';
  h += '<table class="rm-t rm-chr"><thead><tr><th class="d">Date</th><th>Nature</th>'
    + '<th>Contenant</th><th class="w">D\u00e9tail</th></tr></thead><tbody>';
  r.lignes.forEach(function(l){
    h += '<tr><td class="d">' + _rmDate(l.date) + '</td><td>' + e(l.lbl) + '</td>'
      + '<td class="c">' + e(l.contenant) + '</td>'
      + '<td class="w">' + e(l.detail || '\u2014') + '</td></tr>';
  });
  h += '</tbody></table>';
  return h + _rmPied(r, DOM);
}

function _rmPied(r, DOM){
  var hors = Object.keys(r.hors).filter(function(k){ return RM_HORS[k]; })
    .map(function(k){
      var n = r.hors[k], lbl = RM_HORS[k].toLowerCase();
      // « 1 analyses » : le libelle est au pluriel, on le repasse au singulier.
      if(n === 1) lbl = lbl.replace(/s$/, '').replace(/s de /, ' de ');
      return n + ' ' + lbl;
    });
  var h = '<div class="rm-pied">';
  if(hors.length){
    h += '<p><b>Hors registre.</b> Le suivi courant n\u2019est pas une manipulation et n\u2019entre '
      + 'pas dans ce document : ' + hors.join(', ') + ' sur la p\u00e9riode. '
      + 'Ils restent consultables dans le journal de cave.</p>';
  }
  h += '<p><b>Ce que ce document est.</b> Un \u00e9tat interne, produit \u00e0 partir des op\u00e9rations '
    + 'que vous avez saisies au Cuvier et au Chai. Il vous permet de retrouver et de pr\u00e9senter '
    + 'vos manipulations. <b>Ce n\u2019est pas une d\u00e9claration officielle</b> : Ma Vigne pr\u00e9pare, '
    + 'l\u2019exploitant d\u00e9clare et reste responsable de ses obligations.</p>'
    + '<p><b>Limite connue.</b> Les op\u00e9rations saisies au Cuvier n\u2019enregistrent pas '
    + 'd\u2019intervenant : la colonne reste vide pour celles-ci. Celles du Chai le portent.</p>'
    + '<div class="rm-sig">G\u00e9n\u00e9r\u00e9 par Ma Vigne \u00b7 ' + String(DOM.nom||'') + '</div>'
    + '</div>';
  return h;
}

var RM_CSS = ''
+ '@page{size:A4 portrait;margin:14mm 12mm}'
+ '.rm-doc{font-family:Outfit,system-ui,sans-serif;color:#2A241C;font-size:11px;line-height:1.45;'
+ 'background:#fff;max-width:186mm;margin:0 auto;padding:0 0 20px}'
+ '.rm-hero{background:linear-gradient(160deg,#14110D,#1C1813);color:#F0E2C8;padding:20px 22px 17px;'
+ 'border-radius:12px;position:relative;overflow:hidden;margin-bottom:16px}'
+ '.rm-hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;'
+ 'background:linear-gradient(90deg,#8A5A38 0%,#C2871E 50%,#3D6B27 100%)}'
+ '.rm-hero-k{font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:#A99C82}'
+ '.rm-hero-t{font-family:"Cormorant Garamond",Georgia,serif;font-size:30px;font-weight:700;'
+ 'line-height:1.05;margin-top:5px}'
+ '.rm-hero-s{font-size:11px;color:#9C9184;margin-top:3px}'
+ '.rm-hero-c{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;padding-top:11px;'
+ 'border-top:1px solid rgba(216,188,114,.2);font-size:10.5px;color:#C8BCA6}'
+ '.rm-hero-c b{color:#E7CE86}'
+ '.rm-tiles{display:flex;gap:10px;margin-bottom:18px}'
+ '.rm-tile{flex:1;border:1px solid #E4DAC8;border-radius:11px;padding:12px 13px;background:#FBFAF6}'
+ '.rm-tile-v{font-family:"Cormorant Garamond",Georgia,serif;font-size:29px;font-weight:700;'
+ 'color:#8A5A38;line-height:1}'
+ '.rm-tile-v small{font-size:13px;margin-left:3px;color:#8B8175;font-family:Outfit,sans-serif;font-weight:400}'
+ '.rm-tile-l{font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:#8B8175;margin-top:5px}'
+ '.rm-tile-s{font-size:10px;color:#8B8175;margin-top:5px;line-height:1.4}'
+ '.rm-sec{display:flex;align-items:center;gap:7px;font-size:13.5px;font-weight:600;color:#8A5A38;'
+ 'margin:18px 0 7px;padding-bottom:5px;border-bottom:2px solid rgba(194,161,77,.35)}'
+ '.rm-sec-i{font-size:14px}'
+ '.rm-sec-n{margin-left:auto;font-size:11px;font-weight:600;color:#8B8175;background:#F3EADF;'
+ 'border-radius:20px;padding:2px 9px}'
+ '.rm-brk{page-break-before:always}'
+ '.rm-t{width:100%;border-collapse:collapse;font-size:10.5px;margin-bottom:4px}'
+ '.rm-t th{text-align:left;font-size:9px;letter-spacing:.07em;text-transform:uppercase;'
+ 'color:#8B8175;font-weight:600;padding:5px 7px;border-bottom:1px solid #E4DAC8}'
+ '.rm-t td{padding:6px 7px;border-bottom:1px solid #F0EAE0;vertical-align:top}'
+ '.rm-t tr:last-child td{border-bottom:0}'
+ '.rm-t .d{white-space:nowrap;color:#5F5F5F;width:64px}'
+ '.rm-t .c{font-weight:600;color:#2A241C}'
+ '.rm-t .c .src{display:block;font-size:9px;font-weight:400;color:#A09684;margin-top:1px}'
+ '.rm-t .w{color:#4A4A3A}'
+ '.rm-t .w .nt{display:block;font-size:9.5px;color:#8B8175;font-style:italic;margin-top:2px}'
+ '.rm-t .o{color:#5F5F5F;white-space:nowrap}'
+ '.rm-chr td{padding:4px 7px}'
+ '.rm-tot{font-size:11px;color:#4A4A3A;background:#FAF3E0;border:1px solid rgba(194,161,77,.35);'
+ 'border-radius:9px;padding:9px 12px;margin:6px 0 4px;line-height:1.5}'
+ '.rm-tot b{color:#8A5A38}'
+ '.rm-vide{text-align:center;color:#8B8175;padding:40px 20px;font-size:12px}'
+ '.rm-pied{margin-top:22px;padding-top:13px;border-top:1px solid #E4DAC8;font-size:10px;'
+ 'color:#6F675C;line-height:1.55}'
+ '.rm-pied p{margin:0 0 7px}.rm-pied b{color:#4A4A3A}'
+ '.rm-sig{margin-top:10px;text-align:center;font-size:9.5px;color:#A09684}'
+ '@media print{.rm-doc{max-width:none;padding:0}.rm-sec{page-break-after:avoid}'
+ '.rm-t{page-break-inside:auto}.rm-t tr{page-break-inside:avoid}.rm-tiles{page-break-inside:avoid}}';

/* ── L'export : Blob -> nouvel onglet -> impression ────────────────
   Meme mecanique que l'inventaire des futs et le bilan matiere. */
function _rmExport(campagne, millesime){
  var DOM = {
    nom: (window.DOMAINE_NOM || (window.CONFIG && window.CONFIG.domaine) || 'Mon domaine'),
    commune: (window.CONFIG && window.CONFIG.commune) || '',
    siret: (window.CONFIG && window.CONFIG.siret) || ''
  };
  // Un millesime donne prime sur la campagne : le document porte alors sur
  // TOUT le vin de cette annee, quelle que soit la campagne de l'operation.
  var an = (millesime != null) ? null
         : ((campagne != null) ? campagne : _rmCampagne(new Date().toISOString().slice(0,10)));
  var body, nb = 0;
  try{
    var r = _rmLignes(CAVE_VENDANGE, CAVE_ELEVAGE, an, millesime);
    nb = r.lignes.length;
    body = _rmDoc(CAVE_VENDANGE, CAVE_ELEVAGE, DOM, an, millesime);
  }catch(err){
    window.logError && window.logError({level:'error', cat:'cave', msg:'registre manipulations'});
    showToast('Registre impossible \u00e0 produire', '#C0392B'); return;
  }
  var html = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
    + '<title>Registre des manipulations' + (millesime!=null ? ' ' + millesime : '')
    + ' \u2014 ' + _rmEsc(DOM.nom) + '</title>'
    + '<link rel="stylesheet" href="/fonts/fonts.css">'
    + '<style>body{margin:0;background:#fff}' + RM_CSS + '</style></head>'
    + '<body><div class="rm-doc">' + body + '</div>'
    + '<scr'+'ipt>window.onload=function(){setTimeout(function(){window.print();},500);};</scr'+'ipt>'
    + '</body></html>';
  try{
    var blob = new Blob([html], {type:'text/html'});
    var url = URL.createObjectURL(blob);
    var w = window.open(url, '_blank');
    if(!w) showToast('Autorise les pop-ups pour imprimer', '#B85A1A');
    else showToast('\u{1F4CB} Registre' + (millesime!=null?' '+millesime:'') + ' \u00b7 '
      + nb + ' manipulation' + (nb>1?'s':''), '#3D6B27');
  }catch(err){ showToast('Export impossible', '#C0392B'); }
}
function _rmEsc(s){ return String(s==null?'':s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* Choix de la campagne quand il y en a plusieurs, sinon export direct. */
/* ⚠ Le registre se lit par MILLESIME, pas par campagne : une campagne
   contient le millesime qui rentre ET celui qui finit son elevage.
   Repli sur le choix par campagne quand aucune ligne n'est rattachable
   (donnees anciennes, cuve sans recolte liee) : c'est le comportement
   d'avant ce lot, jamais un ecran vide. */
window._rmExportChoix = function(){
  var ms = _rmMillesimes(CAVE_VENDANGE, CAVE_ELEVAGE);
  if(ms.length === 1){ _rmExport(null, ms[0]); return; }
  if(ms.length > 1 && typeof window.openPrompt === 'function'){
    window.openPrompt({
      titre:'Quel mill\u00e9sime ?', unite:'', icone:'\u{1F4CB}', type:'nombre',
      sub:'Chaque mill\u00e9sime a son registre \u2014 on ne m\u00e9lange pas les vins. '
         + 'Disponibles : ' + ms.join(', ') + '.',
      valeur:String(ms[0]), placeholder:String(ms[0]), btnLabel:'\u00c9diter le registre',
      cb:function(v){
        var n = String(parseInt(String(v).replace(/\D/g,''), 10));
        if(ms.indexOf(n) < 0){ showToast('Aucune manipulation sur ' + n, '#B85A1A'); return; }
        _rmExport(null, n);
      }
    });
    return;
  }
  if(ms.length > 1){ _rmExport(null, ms[0]); return; }
  var cs = _rmCampagnes(CAVE_VENDANGE, CAVE_ELEVAGE);
  if(!cs.length){ showToast('Aucune manipulation enregistr\u00e9e', '#B85A1A'); return; }
  if(cs.length === 1 || typeof window.openPrompt !== 'function'){ _rmExport(cs[0]); return; }
  window.openPrompt({
    titre:'Quelle campagne ?', unite:'', icone:'\u{1F4CB}', type:'nombre',
    sub:'Campagnes disponibles : ' + cs.map(function(c){ return c + '\u2013' + (c+1); }).join(', ')
       + '. Indiquez l\u2019ann\u00e9e de d\u00e9but.',
    valeur:String(cs[0]), placeholder:String(cs[0]), btnLabel:'\u00c9diter le registre',
    cb:function(v){
      var n = parseInt(String(v).replace(/\D/g,''), 10);
      if(cs.indexOf(n) < 0){ showToast('Aucune manipulation sur ' + n, '#B85A1A'); return; }
      _rmExport(n);
    }
  });
}
window._rmExport       = _rmExport;
window._rmCampagnes    = _rmCampagnes;
window._rmLignes       = _rmLignes;
window._rmTotaux       = _rmTotaux;
window._rmDoc          = _rmDoc;

/* ════════════════════════════════════════════════════════════════
   MA VIGNE — BILAN DE CAMPAGNE
   Etape B, recadree par Nico : ce n'est PAS une declaration de
   recolte. C'est un etat INTERNE de fin d'annee, informatif.
   Aucun terrain declaratif, aucune obligation, aucun format impose.

   ⚠️ CE FICHIER N'INVENTE AUCUN CALCUL. Il agrege ce qui existe :
     _mlChaine   (Le millesime)  -> le flux benne -> bouteille
     _mvFutParc  (parc a futs)   -> l'etat et les mouvements du parc
     _rmLignes   (registre)      -> les manipulations
   Seules la VIGNE (journal) et la PROTECTION (traitements) sont
   calculees ici, faute de source existante a la maille campagne.
   ════════════════════════════════════════════════════════════════ */

function _bcNum(v){ var n = parseFloat(v); return isFinite(n) ? n : 0; }
function _bcF(n, d){
  if(n == null || !isFinite(n)) return '\u2014';
  var p = Math.pow(10, d==null?1:d);
  return String(Math.round(n*p)/p).replace('.', ',');
}
function _bcInt(n){
  if(n == null || !isFinite(n)) return '\u2014';
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
}
function _bcDate(iso){
  var p = String(iso||'').split('-');
  return (p.length === 3) ? (p[2] + '/' + p[1] + '/' + p[0]) : (iso||'');
}
var _BC_MOIS = ['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];
function _bcMois(iso){
  var p = String(iso||'').split('-');
  return (p.length >= 2) ? (_BC_MOIS[parseInt(p[1],10)-1] + ' ' + p[0]) : '';
}
function _bcCampagne(iso){
  if(typeof window !== 'undefined' && typeof window._mvCampagneDe === 'function')
    return window._mvCampagneDe(iso);
  var p = String(iso||'').split('-');
  var a = parseInt(p[0],10), m = parseInt(p[1],10);
  if(!a || !m){ var d = new Date(); return (d.getMonth()+1 >= 8) ? d.getFullYear() : d.getFullYear()-1; }
  return (m >= 8) ? a : (a-1);
}
/* Bornes d'une campagne : 1er aout -> 31 juillet, la meme partout. */
function _bcBornes(c){ return {d0:c + '-08-01', d1:(c+1) + '-07-31'}; }

/* ── LA VIGNE : ce qui a ete fait, depuis le journal ───────────────
   ⚠️ Le journal porte une entree par VALIDATION. Une parcelle relevee
   trois fois y figure trois fois : c'est voulu, c'est l'effort reel.
   On distingue donc deux mesures qui ne veulent pas dire la meme chose :
     surface travaillee = somme des passages  (l'effort)
     parcelles couvertes = distinctes         (l'etendue)
   Les melanger produirait un chiffre qui ne veut rien dire. */
function _bcVigne(JOURNAL, PARCELLES, c){
  var b = _bcBornes(c);
  var surf = {};
  (PARCELLES||[]).forEach(function(p){ if(p && p.nom) surf[p.nom] = _bcNum(p.surface); });
  var parT = {}, jours = {}, gens = {};
  (JOURNAL||[]).forEach(function(j){
    if(!j || j.meteo || !j.date || !j.tache) return;
    if(j.date < b.d0 || j.date > b.d1) return;
    if(j.statut !== 'Valid\u00e9') return;
    var t = parT[j.tache] || (parT[j.tache] = {tache:j.tache, n:0, surface:0, parcelles:{},
                                              d0:j.date, d1:j.date, gens:{}});
    t.n++;
    t.surface += (surf[j.parcelle] || 0);      // 'Domaine' n'a pas de surface : 0, volontairement
    if(j.parcelle && j.parcelle !== 'Domaine') t.parcelles[j.parcelle] = 1;
    if(j.date < t.d0) t.d0 = j.date;
    if(j.date > t.d1) t.d1 = j.date;
    if(j.qui){ t.gens[j.qui] = 1; gens[j.qui] = 1; }
    (j.membresEquipe||[]).forEach(function(n){ if(n){ t.gens[n] = 1; gens[n] = 1; } });
    jours[j.date] = 1;
  });
  var lignes = Object.keys(parT).map(function(k){
    var t = parT[k];
    return {tache:t.tache, n:t.n, surface:t.surface,
            parcelles:Object.keys(t.parcelles).length,
            gens:Object.keys(t.gens).length, d0:t.d0, d1:t.d1};
  }).sort(function(a,b2){ return b2.surface - a.surface; });
  return {lignes:lignes, jours:Object.keys(jours).length,
          gens:Object.keys(gens).length,
          surface:lignes.reduce(function(s,l){ return s+l.surface; }, 0),
          validations:lignes.reduce(function(s,l){ return s+l.n; }, 0)};
}

/* ── LA PROTECTION : traitements de la campagne ───────────────────── */
function _bcPhyto(TRAITEMENTS, c){
  var b = _bcBornes(c);
  var n = 0, parc = {}, prods = {}, dates = {};
  (TRAITEMENTS||[]).forEach(function(t){
    if(!t || !t.date) return;
    if(t.date < b.d0 || t.date > b.d1) return;
    n++;
    if(t.parcelle) parc[t.parcelle] = (parc[t.parcelle]||0) + 1;
    var p = t.produit || t.nom || '';
    if(p) prods[p] = (prods[p]||0) + 1;
    dates[t.date] = 1;
  });
  var passages = Object.keys(parc).map(function(k){ return parc[k]; });
  return {n:n, parcelles:Object.keys(parc).length, produits:Object.keys(prods).length,
          jours:Object.keys(dates).length,
          maxPassages: passages.length ? Math.max.apply(null, passages) : 0,
          topProduits: Object.keys(prods).sort(function(a,b2){ return prods[b2]-prods[a]; })
                             .slice(0,6).map(function(k){ return {nom:k, n:prods[k]}; })};
}

/* ── L'ASSEMBLAGE ────────────────────────────────────────────────── */
/* ⚠ La campagne et le millesime ne recouvrent PAS la meme chose. La vigne,
   la protection et le parc a futs sont des grandeurs de CAMPAGNE : ils
   decrivent une annee de travail, pas un vin. La chaine benne -> bouteille,
   le chai et les manipulations sont des grandeurs de MILLESIME.
   Le document le dit explicitement plutot que de laisser croire que tout
   porte sur la meme chose. Par defaut mil = c, l'usage le plus courant. */
function _bcData(ctx, c, mil){
  var W = (typeof window !== 'undefined') ? window : {};
  if(mil == null) mil = c;
  var d = {campagne:c, millesime:mil, memeAxe:(String(mil)===String(c)), bornes:_bcBornes(c)};

  d.vigne = _bcVigne(ctx.JOURNAL, ctx.PARCELLES, c);
  d.phyto = _bcPhyto(ctx.TRAITEMENTS, c);

  d.surfaceTotale = (ctx.PARCELLES||[]).reduce(function(s,p){
    return s + ((p && p.arrachee) ? 0 : _bcNum(p && p.surface));
  }, 0);
  d.nbParcelles = (ctx.PARCELLES||[]).filter(function(p){ return p && p.nom && !p.arrachee; }).length;

  /* Le flux benne -> bouteille vient du moteur du millesime : pas de copie. */
  d.chaine = (typeof W._mlChaine === 'function') ? W._mlChaine(mil) : null;
  /* L'etat du parc a futs vient du moteur du parc. */
  d.parc = (typeof W._mvFutParc === 'function')
    ? W._mvFutParc(ctx.INTRANTS, ctx.CAVE_ELEVAGE, c+1) : null;
  /* Les manipulations viennent du registre. */
  d.manip = (typeof W._rmLignes === 'function')
    ? W._rmLignes(ctx.CAVE_VENDANGE, ctx.CAVE_ELEVAGE, null, mil) : null;

  /* Rendement moyen du domaine : sur les seules parcelles RECOLTEES.
     Le rapporter a la surface totale ferait mentir le chiffre d'un domaine
     qui a vendu du raisin sur pied ou laisse une parcelle. */
  if(d.chaine && d.chaine.ha > 0){
    d.rdtMoyen = (d.chaine.kg / d.chaine.ha) / (d.chaine.kgHl || 135);
  } else d.rdtMoyen = null;

  /* Cuvees en elevage au 31 juillet. Filtrees sur le millesime du document :
     chaque millesime est une entite a part, dans sa propre cave. Le total
     general reste affiche a cote, car c'est ce qui remplit le chai. */
  d.chaiTous = ((ctx.CAVE_ELEVAGE && ctx.CAVE_ELEVAGE.cuvees) || [])
    .filter(function(x){ return x && x.statut !== 'embouteille'; }).length;
  d.chai = ((ctx.CAVE_ELEVAGE && ctx.CAVE_ELEVAGE.cuvees) || [])
    .filter(function(x){ return x && x.statut !== 'embouteille'
                          && String(x.millesime) === String(mil); })
    .map(function(x){
      var f = (x.tonneaux||[]).reduce(function(s,t){ return s + (parseInt(t.nb,10)||0); }, 0);
      return {nom:x.nom, millesime:x.millesime, futs:f, hl:Math.round(f*2.28*10)/10};
    }).sort(function(a,b2){
      if(a.millesime !== b2.millesime) return b2.millesime - a.millesime;
      return b2.futs - a.futs;
    });
  d.chaiFuts = d.chai.reduce(function(s,x){ return s+x.futs; }, 0);
  d.chaiHl = Math.round(d.chai.reduce(function(s,x){ return s+x.hl; }, 0)*10)/10;

  /* Mises en bouteille de la campagne. */
  d.bouteilles = ((ctx.CAVE_ELEVAGE && ctx.CAVE_ELEVAGE.cuvees) || [])
    .filter(function(x){ return x && x.statut === 'embouteille' && x.date_embouteillage
                          && String(x.millesime) === String(mil); })
    .map(function(x){ return {nom:x.nom, millesime:x.millesime, nb:x.nb_bouteilles||0,
                              date:x.date_embouteillage}; })
    .sort(function(a,b2){ return String(a.date).localeCompare(String(b2.date)); });
  d.btlTotal = d.bouteilles.reduce(function(s,x){ return s+x.nb; }, 0);

  return d;
}

/* Campagnes pour lesquelles il y a quelque chose a raconter. */
function _bcCampagnes(ctx){
  var set = {};
  (ctx.JOURNAL||[]).forEach(function(j){ if(j && j.date && !j.meteo) set[_bcCampagne(j.date)] = 1; });
  ((ctx.CAVE_VENDANGE && ctx.CAVE_VENDANGE.recoltes)||[]).forEach(function(r){
    if(r && r.date) set[_bcCampagne(r.date)] = 1; });
  return Object.keys(set).map(Number).filter(function(x){ return isFinite(x); })
    .sort(function(a,b2){ return b2-a; });
}

function _bcDoc(ctx, DOM, c, mil){
  var d = _bcData(ctx, c, mil);
  var e = function(s){ return String(s==null?'':s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var a = new Date();
  var jj = String(a.getDate()).padStart(2,'0') + '/' + String(a.getMonth()+1).padStart(2,'0')
         + '/' + a.getFullYear();
  var ch = d.chaine;
  var kgHl = (ch && ch.kgHl) || 135;

  /* ── en-tête ── */
  var h = '<div class="bc-hero">'
    + '<div class="bc-hero-k">Bilan de campagne</div>'
    + '<div class="bc-hero-t">' + e(DOM.nom) + '</div>'
    + '<div class="bc-hero-y">' + c + '\u2013' + (c+1)
    + (d.memeAxe ? '' : ' \u00b7 mill\u00e9sime ' + d.millesime) + '</div>'
    + '<div class="bc-hero-c"><span>' + e(DOM.commune||'') + '</span>'
    + '<span>du 1<sup>er</sup> ao\u00fbt ' + c + ' au 31 juillet ' + (c+1) + '</span>'
    + '<span>\u00e9dit\u00e9 le ' + jj + '</span></div></div>';

  /* ── les quatre chiffres de l'année ── */
  var tiles = [
    {v:_bcF(d.surfaceTotale,2), u:'ha', l:'exploit\u00e9s',
     s:d.nbParcelles + ' parcelle' + (d.nbParcelles>1?'s':'')},
    {v:ch ? _bcInt(ch.kg/1000) : '\u2014', u:'t', l:'de raisin rentr\u00e9',
     s:ch ? (ch.parcelles + ' parcelle' + (ch.parcelles>1?'s':'') + ' r\u00e9colt\u00e9e'
            + (ch.parcelles>1?'s':'')) : ''},
    {v:d.rdtMoyen!=null ? _bcF(d.rdtMoyen,1) : '\u2014', u:'hL/ha', l:'rendement moyen',
     s:'sur les parcelles r\u00e9colt\u00e9es'},
    {v:_bcF(d.chaiHl,0), u:'hL', l:'au chai',
     s:d.chaiFuts + ' f\u00fbt' + (d.chaiFuts>1?'s':'') + ' en \u00e9levage'}
  ];
  h += '<div class="bc-axes">Deux axes cohabitent dans ce document, et c\u2019est voulu. '
    + '<b>La vigne, la protection et le parc \u00e0 f\u00fbts</b> portent sur la campagne '
    + c + '\u2013' + (c+1) + ' : ils d\u00e9crivent une ann\u00e9e de travail. '
    + '<b>La r\u00e9colte, le flux et le chai</b> portent sur le mill\u00e9sime <b>' + d.millesime
    + '</b> : ils d\u00e9crivent un vin. Les m\u00e9langer produirait des chiffres qui ne veulent rien dire.</div>';
  h += '<div class="bc-tiles">' + tiles.map(function(t){
    return '<div class="bc-tile"><div class="bc-tile-v">' + t.v + '<small>' + t.u + '</small></div>'
      + '<div class="bc-tile-l">' + t.l + '</div>'
      + (t.s ? '<div class="bc-tile-s">' + t.s + '</div>' : '') + '</div>';
  }).join('') + '</div>';

  /* ── la vigne ── */
  h += _bcSec('\u{1F33F}', 'Les travaux de la vigne',
        d.vigne.lignes.length ? (d.vigne.validations + ' validations') : '');
  if(!d.vigne.lignes.length){
    h += '<div class="bc-vide">Aucun travail valid\u00e9 sur cette campagne.</div>';
  } else {
    h += '<div class="bc-intro">' + d.vigne.jours + ' journ\u00e9es de travail not\u00e9es, '
      + d.vigne.gens + ' personne' + (d.vigne.gens>1?'s':'') + ' au total. '
      + 'La <b>surface travaill\u00e9e</b> additionne les passages : une parcelle relev\u00e9e trois fois '
      + 'y compte trois fois. C\u2019est l\u2019effort, pas l\u2019\u00e9tendue.</div>';
    h += '<table class="bc-t"><thead><tr><th>Travail</th><th class="n">Parcelles</th>'
      + '<th class="n">Surface travaill\u00e9e</th><th class="n">\u00c9quipe</th>'
      + '<th>P\u00e9riode</th></tr></thead><tbody>';
    d.vigne.lignes.forEach(function(l){
      h += '<tr><td class="b">' + e(l.tache) + '</td>'
        + '<td class="n">' + l.parcelles + '</td>'
        + '<td class="n">' + _bcF(l.surface,2) + ' ha</td>'
        + '<td class="n">' + l.gens + '</td>'
        + '<td class="p">' + _bcMois(l.d0) + (_bcMois(l.d0)!==_bcMois(l.d1)
            ? ' \u2192 ' + _bcMois(l.d1) : '') + '</td></tr>';
    });
    h += '</tbody><tfoot><tr><td class="b">Total</td><td class="n">\u2014</td>'
      + '<td class="n">' + _bcF(d.vigne.surface,2) + ' ha</td>'
      + '<td class="n">' + d.vigne.gens + '</td><td></td></tr></tfoot></table>';
  }

  /* ── la récolte ── */
  h += _bcSec('\u{1F347}', 'La r\u00e9colte', ch && ch.kg ? _bcInt(ch.kg) + ' kg' : '');
  // _mlChaine donne des TOTAUX, pas le detail par parcelle : le bilan lit donc la
  // source, filtree sur le millesime. Projection differente de la meme donnee,
  // pas une copie du calcul.
  var recs = ((ctx.CAVE_VENDANGE && ctx.CAVE_VENDANGE.recoltes) || []).filter(function(r){
    return r && String(r.date||'').slice(0,4) === String(c);
  });
  if(!recs.length){
    h += '<div class="bc-vide">Aucune r\u00e9colte saisie au Cuvier sur cette campagne.</div>';
  } else {
    var parP = {};
    recs.forEach(function(r){
      var k = r.parcelle || '\u2014';
      if(!parP[k]) parP[k] = {nom:k, caisses:0, kg:0, vendu:false, d0:r.date, d1:r.date};
      var kg = (r.nb_caisses||0) * 25;
      if(typeof window !== 'undefined' && typeof window._recKg === 'function') kg = window._recKg(r);
      parP[k].caisses += (r.nb_caisses||0);
      parP[k].kg += kg;
      if(r.client) parP[k].vendu = true;
      if(r.date < parP[k].d0) parP[k].d0 = r.date;
      if(r.date > parP[k].d1) parP[k].d1 = r.date;
    });
    var surf = {};
    (ctx.PARCELLES||[]).forEach(function(p){ if(p && p.nom) surf[p.nom] = _bcNum(p.surface); });
    var rows = Object.keys(parP).map(function(k){
      var o = parP[k], s = surf[k] || 0;
      o.ha = s; o.hlHa = s > 0 ? (o.kg / s / kgHl) : null;
      return o;
    }).sort(function(a2,b2){ return (b2.hlHa||0) - (a2.hlHa||0); });
    h += '<table class="bc-t"><thead><tr><th>Parcelle</th><th class="n">Surface</th>'
      + '<th class="n">Caisses</th><th class="n">Kilos</th><th class="n">hL/ha</th>'
      + '<th>Date</th></tr></thead><tbody>';
    rows.forEach(function(o){
      h += '<tr><td class="b">' + e(o.nom)
        + (o.vendu ? '<span class="bc-tag">vendu</span>' : '') + '</td>'
        + '<td class="n">' + (o.ha ? _bcF(o.ha,2) + ' ha' : '\u2014') + '</td>'
        + '<td class="n">' + _bcInt(o.caisses) + '</td>'
        + '<td class="n">' + _bcInt(o.kg) + '</td>'
        + '<td class="n s">' + (o.hlHa!=null ? _bcF(o.hlHa,1) : '\u2014') + '</td>'
        + '<td class="p">' + _bcDate(o.d0) + '</td></tr>';
    });
    h += '</tbody><tfoot><tr><td class="b">Total</td>'
      + '<td class="n">' + _bcF(ch.ha,2) + ' ha</td>'
      + '<td class="n">' + _bcInt(rows.reduce(function(s,o){ return s+o.caisses; },0)) + '</td>'
      + '<td class="n">' + _bcInt(ch.kg) + '</td>'
      + '<td class="n s">' + (d.rdtMoyen!=null ? _bcF(d.rdtMoyen,1) : '\u2014') + '</td>'
      + '<td></td></tr></tfoot></table>';
    if(ch.kgVendu > 0){
      h += '<div class="bc-note">Dont <b>' + _bcInt(ch.kgVendu) + ' kg</b> de raisin vendu, '
        + 'sortis du circuit avant cuvaison.</div>';
    }
  }

  /* ── de la benne à la bouteille ── */
  h += '<div class="bc-brk"></div>';
  h += _bcSec('\u{1F377}', 'De la benne \u00e0 la bouteille', '');
  if(!ch || !ch.kg){
    h += '<div class="bc-vide">Pas de suivi de cuverie sur cette campagne.</div>';
  } else {
    var et = [
      {l:'Rentr\u00e9 de la vigne', v:ch.kg/kgHl, s:_bcInt(ch.kg) + ' kg'},
      {l:'Encuv\u00e9', v:(ch.kg-ch.kgVendu)/kgHl,
       s:ch.kgVendu ? ('hors ' + _bcInt(ch.kgVendu) + ' kg vendus') : 'tout le raisin'},
      {l:'En f\u00fbt', v:ch.hlFut, s:ch.futs ? (ch.futs + ' f\u00fbts') : '\u2014'},
      {l:'En bouteille', v:d.btlTotal ? d.btlTotal*0.75/100 : 0,
       s:d.btlTotal ? (_bcInt(d.btlTotal) + ' cols') : 'pas encore'}
    ].filter(function(x,i){ return i === 0 || x.v > 0; });
    var max = Math.max(et[0].v, 1);
    h += '<div class="bc-flux">';
    et.forEach(function(x,i){
      var w = Math.max(6, Math.round(x.v/max*100));
      var perte = (i > 0 && et[i-1].v > 0) ? Math.round((1 - x.v/et[i-1].v)*100) : null;
      if(perte != null && perte > 0){
        h += '<div class="bc-perte">\u2212' + perte + ' %</div>';
      }
      h += '<div class="bc-fl"><div class="bc-fl-bar" style="width:' + w + '%"></div>'
        + '<div class="bc-fl-txt"><b>' + x.l + '</b><span>' + x.s + '</span></div>'
        + '<div class="bc-fl-v">' + _bcF(x.v,1) + '<small>hL</small></div></div>';
    });
    h += '</div>';
    if(ch.hlCuve > 0){
      h += '<div class="bc-note">Au moment de l\u2019\u00e9dition, <b>' + _bcF(ch.hlCuve,0)
        + ' hL</b> fermentent encore : la perte totale se lira quand tout sera d\u00e9cuv\u00e9.</div>';
    }
  }

  /* ── le chai ── */
  h += _bcSec('\u{1F6E2}\u{FE0F}', 'Le chai \u2014 mill\u00e9sime ' + d.millesime,
        d.chaiFuts ? (d.chaiFuts + ' f\u00fbts') : '');
  if(d.chaiTous > d.chai.length){
    h += '<div class="bc-note">Ce tableau ne montre que le <b>' + d.millesime + '</b>. '
      + 'Le chai compte <b>' + d.chaiTous + '</b> cuv\u00e9es en \u00e9levage au total, tous mill\u00e9simes '
      + 'confondus \u2014 chacun a son propre bilan.</div>';
  }
  if(!d.chai.length){
    h += '<div class="bc-vide">Aucune cuv\u00e9e du ' + d.millesime + ' en \u00e9levage.</div>';
  } else {
    h += '<table class="bc-t"><thead><tr><th>Cuv\u00e9e</th><th class="n">Mill\u00e9sime</th>'
      + '<th class="n">F\u00fbts</th><th class="n">Volume</th></tr></thead><tbody>';
    d.chai.forEach(function(x){
      h += '<tr><td class="b">' + e(x.nom) + '</td><td class="n">' + (x.millesime||'\u2014') + '</td>'
        + '<td class="n">' + x.futs + '</td><td class="n s">' + _bcF(x.hl,1) + ' hL</td></tr>';
    });
    h += '</tbody><tfoot><tr><td class="b">Total</td><td class="n"></td>'
      + '<td class="n">' + d.chaiFuts + '</td>'
      + '<td class="n s">' + _bcF(d.chaiHl,1) + ' hL</td></tr></tfoot></table>';
  }
  if(d.bouteilles.length){
    h += '<div class="bc-sub">Mises en bouteille de la campagne</div><table class="bc-t"><tbody>';
    d.bouteilles.forEach(function(b){
      h += '<tr><td class="b">' + e(b.nom) + ' ' + (b.millesime||'') + '</td>'
        + '<td class="p">' + _bcDate(b.date) + '</td>'
        + '<td class="n s">' + _bcInt(b.nb) + ' cols</td></tr>';
    });
    h += '</tbody></table>';
  }

  /* ── le parc à fûts ── */
  if(d.parc){
    var mv = d.parc.mouv || {entrees:0, sorties:0};
    h += _bcSec('\u{1F6D2}', 'Le parc \u00e0 f\u00fbts', d.parc.parc + ' f\u00fbts');
    h += '<div class="bc-kv">'
      + '<span><b>' + d.parc.parc + '</b> f\u00fbts au domaine</span>'
      + '<span><b>' + d.parc.occupes + '</b> en vin</span>'
      + '<span><b>' + d.parc.libres + '</b> libres</span>'
      + (d.parc.aReformer ? '<span class="al"><b>' + d.parc.aReformer
          + '</b> au-del\u00e0 de ' + d.parc.vie + ' vins</span>' : '')
      + '</div>';
    if(mv.entrees || mv.sorties){
      h += '<div class="bc-note">Sur l\u2019ann\u00e9e civile : <b>+' + mv.entrees + '</b> entr\u00e9s, '
        + '<b>\u2212' + mv.sorties + '</b> sortis. Le d\u00e9tail est au registre du parc, dans La R\u00e9serve.</div>';
    }
  }

  /* ── la protection ── */
  h += _bcSec('\u{1F9EA}', 'La protection du vignoble',
        d.phyto.n ? (d.phyto.n + ' interventions') : '');
  if(!d.phyto.n){
    h += '<div class="bc-vide">Aucun traitement enregistr\u00e9 sur cette campagne.</div>';
  } else {
    h += '<div class="bc-kv">'
      + '<span><b>' + d.phyto.n + '</b> lignes de registre</span>'
      + '<span><b>' + d.phyto.jours + '</b> journ\u00e9es d\u2019application</span>'
      + '<span><b>' + d.phyto.parcelles + '</b> parcelles trait\u00e9es</span>'
      + '<span><b>' + d.phyto.maxPassages + '</b> passages au maximum sur une parcelle</span>'
      + '</div>';
    if(d.phyto.topProduits.length){
      h += '<div class="bc-note">Produits les plus employ\u00e9s : '
        + d.phyto.topProduits.map(function(p){ return e(p.nom) + ' (' + p.n + ')'; }).join(', ')
        + '. Le registre complet et l\u2019export r\u00e9glementaire sont dans le module Phyto.</div>';
    }
  }

  /* ── les manipulations ── */
  if(d.manip && d.manip.lignes.length){
    h += '<div class="bc-note bc-lien">\u{1F4CB} <b>' + d.manip.lignes.length
      + ' manipulations \u0153nologiques</b> sur le mill\u00e9sime ' + d.millesime
      + '. Le registre d\u00e9taill\u00e9 s\u2019\u00e9dite depuis Le Cuvier \u203a R\u00e9glages.</div>';
  }

  /* ── pied ── */
  h += '<div class="bc-pied">'
    + '<p><b>Ce que ce document est.</b> Un bilan interne de fin de campagne, construit \u00e0 partir '
    + 'de ce que vous avez saisi tout au long de l\u2019ann\u00e9e. Il sert \u00e0 se souvenir, comparer et '
    + 'd\u00e9cider. <b>Ce n\u2019est pas une d\u00e9claration</b> et il n\u2019en tient lieu pour aucune '
    + 'administration.</p>'
    + '<p><b>Ce qu\u2019il ne contient pas.</b> Ni heures de travail, ni co\u00fbts : ils vivent dans '
    + 'Pilotage, o\u00f9 ils sont calcul\u00e9s avec les taux et les mod\u00e8les de chacun. '
    + 'Le rendement moyen se rapporte aux seules parcelles r\u00e9colt\u00e9es.</p>'
    + '<div class="bc-sig">G\u00e9n\u00e9r\u00e9 par Ma Vigne \u00b7 ' + e(DOM.nom) + '</div></div>';
  return h;
}

function _bcSec(ico, titre, droite){
  return '<div class="bc-sec"><span class="bc-sec-i">' + ico + '</span>' + titre
    + (droite ? '<span class="bc-sec-n">' + droite + '</span>' : '') + '</div>';
}

var BC_CSS = ''
+ '@page{size:A4 portrait;margin:14mm 12mm}'
+ '.bc-doc{font-family:Outfit,system-ui,sans-serif;color:#2A241C;font-size:11px;line-height:1.45;'
+ 'background:#fff;max-width:186mm;margin:0 auto;padding:0 0 20px}'
+ '.bc-hero{background:linear-gradient(160deg,#14110D,#1C1813);color:#F0E2C8;padding:22px 24px 18px;'
+ 'border-radius:12px;position:relative;overflow:hidden;margin-bottom:16px}'
+ '.bc-hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;'
+ 'background:linear-gradient(90deg,#8A5A38 0%,#C2871E 50%,#3D6B27 100%)}'
+ '.bc-hero-k{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:#A99C82}'
+ '.bc-hero-t{font-family:"Cormorant Garamond",Georgia,serif;font-size:31px;font-weight:700;'
+ 'line-height:1.05;margin-top:5px}'
+ '.bc-hero-y{font-family:"Cormorant Garamond",Georgia,serif;font-size:19px;color:#C2A14D;'
+ 'font-weight:600;margin-top:1px;letter-spacing:.04em}'
+ '.bc-hero-c{display:flex;gap:16px;flex-wrap:wrap;margin-top:13px;padding-top:11px;'
+ 'border-top:1px solid rgba(216,188,114,.2);font-size:10.5px;color:#C8BCA6}'
+ '.bc-axes{font-size:10px;color:#6F675C;line-height:1.55;background:#F3EADF;'
+ 'border:1px solid rgba(138,90,56,.22);border-radius:9px;padding:9px 12px;margin-bottom:10px}'
+ '.bc-axes b{color:#8A5A38}'
+ '.bc-tiles{display:flex;gap:9px;margin-bottom:6px}'
+ '.bc-tile{flex:1;border:1px solid #E4DAC8;border-radius:11px;padding:12px 12px 11px;background:#FBFAF6}'
+ '.bc-tile-v{font-family:"Cormorant Garamond",Georgia,serif;font-size:27px;font-weight:700;'
+ 'color:#8A5A38;line-height:1}'
+ '.bc-tile-v small{font-size:12px;margin-left:3px;color:#8B8175;font-family:Outfit,sans-serif;font-weight:400}'
+ '.bc-tile-l{font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:#8B8175;margin-top:5px}'
+ '.bc-tile-s{font-size:9.5px;color:#A09684;margin-top:3px;line-height:1.35}'
+ '.bc-sec{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:600;color:#8A5A38;'
+ 'margin:20px 0 8px;padding-bottom:5px;border-bottom:2px solid rgba(194,161,77,.35)}'
+ '.bc-sec-i{font-size:14px}'
+ '.bc-sec-n{margin-left:auto;font-size:11px;font-weight:600;color:#8B8175;background:#F3EADF;'
+ 'border-radius:20px;padding:2px 10px}'
+ '.bc-brk{page-break-before:always;height:0}'
+ '.bc-intro{font-size:10.5px;color:#6F675C;line-height:1.55;margin-bottom:8px}'
+ '.bc-intro b{color:#4A4A3A}'
+ '.bc-t{width:100%;border-collapse:collapse;font-size:10.5px;margin-bottom:4px}'
+ '.bc-t th{text-align:left;font-size:9px;letter-spacing:.07em;text-transform:uppercase;color:#8B8175;'
+ 'font-weight:600;padding:5px 7px;border-bottom:1px solid #E4DAC8}'
+ '.bc-t th.n{text-align:right}'
+ '.bc-t td{padding:6px 7px;border-bottom:1px solid #F0EAE0;vertical-align:top}'
+ '.bc-t td.n{text-align:right;white-space:nowrap}'
+ '.bc-t td.s{font-family:"Cormorant Garamond",Georgia,serif;font-size:14px;font-weight:700;color:#8A5A38}'
+ '.bc-t td.b{font-weight:600;color:#2A241C}'
+ '.bc-t td.p{color:#8B8175;white-space:nowrap}'
+ '.bc-t tfoot td{border-top:1.5px solid #C2A14D;border-bottom:0;font-weight:700;'
+ 'color:#8A5A38;padding-top:7px}'
+ '.bc-tag{font-size:8.5px;font-weight:600;background:#ECE6DA;color:#6F675C;border-radius:5px;'
+ 'padding:1px 6px;margin-left:6px;vertical-align:1px}'
+ '.bc-flux{margin:4px 0 6px}'
+ '.bc-fl{position:relative;height:38px;margin-bottom:2px;display:flex;align-items:center}'
+ '.bc-fl-bar{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#C2A14D,#8A5A38);'
+ 'border-radius:8px;opacity:.9}'
+ '.bc-fl-txt{position:relative;padding-left:12px;color:#FBF6EC;z-index:1;line-height:1.25}'
+ '.bc-fl-txt b{display:block;font-size:12px}'
+ '.bc-fl-txt span{font-size:9.5px;opacity:.8}'
+ '.bc-fl-v{margin-left:auto;padding-left:12px;font-family:"Cormorant Garamond",Georgia,serif;'
+ 'font-size:17px;font-weight:700;color:#2A241C;position:relative;z-index:1;white-space:nowrap}'
+ '.bc-fl-v small{font-size:9.5px;font-family:Outfit,sans-serif;font-weight:400;color:#8B8175;margin-left:2px}'
+ '.bc-perte{font-size:9.5px;color:#7A1020;font-weight:600;padding:2px 0 2px 14px}'
+ '.bc-kv{display:flex;gap:18px;flex-wrap:wrap;font-size:11px;color:#4A4A3A;'
+ 'background:#FBFAF6;border:1px solid #E4DAC8;border-radius:11px;padding:11px 13px;margin-bottom:6px}'
+ '.bc-kv b{font-family:"Cormorant Garamond",Georgia,serif;font-size:17px;color:#8A5A38;'
+ 'font-weight:700;margin-right:3px}'
+ '.bc-kv .al b{color:#A0291E}'
+ '.bc-note{font-size:10.5px;color:#6F675C;line-height:1.55;background:#FAF3E0;'
+ 'border:1px solid rgba(194,161,77,.3);border-radius:9px;padding:9px 12px;margin:6px 0 4px}'
+ '.bc-note b{color:#8A5A38}'
+ '.bc-lien{background:#F3EADF;border-color:rgba(138,90,56,.22)}'
+ '.bc-sub{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#8B8175;'
+ 'font-weight:600;margin:14px 0 5px}'
+ '.bc-vide{text-align:center;color:#8B8175;padding:20px;font-size:11px;background:#FBFAF6;'
+ 'border:1px dashed #E4DAC8;border-radius:10px}'
+ '.bc-pied{margin-top:22px;padding-top:13px;border-top:1px solid #E4DAC8;font-size:10px;'
+ 'color:#6F675C;line-height:1.55}'
+ '.bc-pied p{margin:0 0 7px}.bc-pied b{color:#4A4A3A}'
+ '.bc-sig{margin-top:10px;text-align:center;font-size:9.5px;color:#A09684}'
+ '@media print{.bc-doc{max-width:none;padding:0}.bc-sec{page-break-after:avoid}'
+ '.bc-t tr{page-break-inside:avoid}.bc-tiles,.bc-flux,.bc-kv{page-break-inside:avoid}}';

/* ── Le contexte : les globales lues avec repli ────────────────────
   TRAITEMENTS et JOURNAL vivent hors de cave.js. Un domaine sans registre
   phyto doit voir « aucun traitement », pas un ecran casse. */
function _bcCtx(){
  return {
    JOURNAL:      window.JOURNAL      || [],
    PARCELLES:    window.PARCELLES    || [],
    TRAITEMENTS:  window.TRAITEMENTS  || [],
    CAVE_VENDANGE: (typeof CAVE_VENDANGE !== 'undefined') ? CAVE_VENDANGE : {},
    CAVE_ELEVAGE:  (typeof CAVE_ELEVAGE  !== 'undefined') ? CAVE_ELEVAGE  : {},
    INTRANTS:     window.INTRANTS     || {}
  };
}

/* ── L'export : Blob -> nouvel onglet -> impression ──────────────── */
function _bcExport(c, mil){
  var ctx = _bcCtx();
  var DOM = {
    nom: (window.DOMAINE_NOM || (window.CONFIG && window.CONFIG.domaine) || 'Mon domaine'),
    commune: (window.CONFIG && window.CONFIG.commune) || ''
  };
  var an = (c != null) ? c : _bcCampagne(new Date().toISOString().slice(0,10));
  var body;
  try{ body = _bcDoc(ctx, DOM, an, (mil!=null?mil:an)); }
  catch(err){
    window.logError && window.logError({level:'error', cat:'cave', msg:'bilan de campagne'});
    showToast('Bilan impossible \u00e0 produire', '#C0392B'); return;
  }
  var html = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
    + '<title>Bilan de campagne ' + an + '\u2013' + (an+1)
    + ((mil!=null && String(mil)!==String(an)) ? ' \u00b7 mill\u00e9sime ' + mil : '')
    + ' \u2014 ' + _bcEsc(DOM.nom) + '</title>'
    + '<link rel="stylesheet" href="/fonts/fonts.css">'
    + '<style>body{margin:0;background:#fff}' + BC_CSS + '</style></head>'
    + '<body><div class="bc-doc">' + body + '</div>'
    + '<scr'+'ipt>window.onload=function(){setTimeout(function(){window.print();},500);};</scr'+'ipt>'
    + '</body></html>';
  try{
    var blob = new Blob([html], {type:'text/html'});
    var w = window.open(URL.createObjectURL(blob), '_blank');
    if(!w) showToast('Autorise les pop-ups pour imprimer', '#B85A1A');
    else showToast('\u{1F4D6} Bilan ' + an + '\u2013' + (an+1), '#3D6B27');
  }catch(err){ showToast('Export impossible', '#C0392B'); }
}
function _bcEsc(s){ return String(s==null?'':s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* Choix de la campagne quand il y en a plusieurs, sinon export direct.
   Expression assignee a window et non fonction declaree : ses SEULS appelants vivent
   dans un autre fichier (onclick d'index.html, bouton de pilotage.js), et le cliquet
   C15 raisonne fichier par fichier. */
window._bcExportChoix = function(){
  var cs = _bcCampagnes(_bcCtx());
  if(!cs.length){ showToast('Aucune campagne \u00e0 r\u00e9sumer', '#B85A1A'); return; }
  if(cs.length === 1 || typeof window.openPrompt !== 'function'){ _bcChoixMil(cs[0]); return; }
  window.openPrompt({
    titre:'Quelle campagne ?', unite:'', icone:'\u{1F4D6}', type:'nombre',
    sub:'Campagnes disponibles : ' + cs.map(function(x){ return x + '\u2013' + (x+1); }).join(', ')
       + '. Indiquez l\u2019ann\u00e9e de d\u00e9but.',
    valeur:String(cs[0]), placeholder:String(cs[0]), btnLabel:'\u00c9diter le bilan',
    cb:function(v){
      var n = parseInt(String(v).replace(/\D/g,''), 10);
      if(cs.indexOf(n) < 0){ showToast('Rien \u00e0 r\u00e9sumer sur ' + n, '#B85A1A'); return; }
      _bcChoixMil(n);
    }
  });
}
/* Second temps : quel millesime pour les sections cave ? On ne le demande
   que si plusieurs sont reellement en cave — ne jamais poser une question
   dont la reponse est unique. */
function _bcChoixMil(c){
  var ms = (typeof window._caveMilsEnCave === 'function')
    ? window._caveMilsEnCave().filter(function(m){ return m !== '?'; }) : [];
  if(ms.length < 2 || typeof window.openPrompt !== 'function'){ _bcExport(c, c); return; }
  window.openPrompt({
    titre:'Quel mill\u00e9sime ?', unite:'', icone:'\u{1F377}', type:'nombre',
    sub:'La vigne, la protection et le parc porteront sur la campagne ' + c + '\u2013' + (c+1)
       + '. La r\u00e9colte, le flux et le chai porteront sur le mill\u00e9sime choisi. '
       + 'En cave : ' + ms.join(', ') + '.',
    valeur:String(c), placeholder:String(c), btnLabel:'\u00c9diter le bilan',
    cb:function(v){
      var m = parseInt(String(v).replace(/\D/g,''), 10);
      _bcExport(c, isFinite(m) ? m : c);
    }
  });
}
window._bcExport       = _bcExport;
window._bcCampagnes    = _bcCampagnes;
window._bcData         = _bcData;
window._bcDoc          = _bcDoc;

/* ══════════════════════════════════════════════════════════════════════════
   MA VIGNE — LES DEUX DOCUMENTS DU CUVIER
   ══════════════════════════════════════════════════════════════════════════
   Le Cuvier saisissait deux choses que rien ne savait imprimer :
     · le CONTROLE DE MATURITE  (CAVE_VENDANGE.analyses)        — avant la vendange
     · les MESURES DE FERMENTATION (cuves_vinif[].mesures_fa)   — pendant

   Ce n'est pas un oubli du registre des manipulations : il les ecarte
   VOLONTAIREMENT (voir son en-tete — « densite, analyses n'en font pas partie :
   l'inclure noierait le document sous des dizaines de lignes »). Un controle
   regarde l'enrichissement et le sulfitage ; le vigneron, lui, a besoin de ses
   courbes. Deux publics, deux documents.

   ⚠️ AUCUN CALCUL NEUF ICI. Tout vient des moteurs deja a l'ecran :
     _matSynth   moyennes ponderees par surface, fraicheur, parcelles rentrees
     _matClasse  derniere valeur + vitesse, dans l'ordre de maturite
     _matSuc / _anaSpd     conversion sucre <-> degre, coefficient FIGE a la saisie
     _vendD20 / _vendSucre / _vendFaPct   densite corrigee, sucre restant, avancement
     _rmDetail   le detail lisible d'une operation de cuve
   Deux definitions du meme chiffre finissent toujours par diverger : le
   document LIT l'ecran, il ne le refait pas.

   ⚠️ Ces documents ne touchent AUCUN etat d'ecran. En particulier ils ne
   changent pas `_matUn` (l'unite d'affichage du Cuvier) : ils calculent la
   leur, localement, et la laissent la.
   ══════════════════════════════════════════════════════════════════════════ */

var MV_CUVDOC_CSS = ''
  + '.cd-kpis{display:flex;gap:16px;flex-wrap:wrap;background:#FAF6EC;border:1px solid #E8DCC0;'
    + 'border-radius:7px;padding:9px 13px;margin-bottom:13px}'
  + '.cd-k{min-width:96px}'
  + '.cd-k b{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.6px;color:#8B6020;margin-bottom:2px}'
  + '.cd-k span{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:20px;font-weight:700;color:#2D1B09;line-height:1.05}'
  + '.cd-k span small{font-family:\'Outfit\',sans-serif;font-size:9px;font-weight:600;color:#7A6A4A}'
  + '.cd-k i{display:block;font-style:normal;font-size:8px;color:#7A7263;margin-top:2px;line-height:1.4}'
  + 'h2{font-size:11px;color:#2D1B09;margin:15px 0 6px;text-transform:uppercase;letter-spacing:.9px}'
  + 'h3{font-size:12.5px;color:#2D1B09;margin:0 0 3px;font-family:\'Cormorant Garamond\',Georgia,serif;font-weight:700}'
  + 'table{width:100%;border-collapse:collapse;font-size:9.5px;margin-bottom:4px}'
  + 'th{text-align:left;padding:5px 6px;background:#2D1B09;color:#F3E7CE;font-size:8px;'
    + 'text-transform:uppercase;letter-spacing:.4px;font-weight:700}'
  + 'td{border-bottom:1px solid #EDE7DA;padding:4px 6px;vertical-align:top}'
  + 'td.n,th.n{text-align:right;white-space:nowrap}'
  + 'tr:nth-child(even) td{background:#FBFAF6}'
  + 'tr.tot td{background:#F4EEE2;font-weight:700;border-top:1.5px solid #C8A060;border-bottom:none}'
  + '.cd-conv{font-style:italic;color:#7A6A4A}'
  + '.cd-note{font-size:8.5px;color:#7A7263;margin:2px 0 11px;line-height:1.5}'
  + '.cd-vide{font-size:9.5px;color:#7A7263;margin:0 0 11px}'
  + '.cd-cuve{margin-bottom:16px;padding-bottom:4px;border-top:1.5px solid #C8A060;padding-top:9px}'
  + '.cd-idr{display:flex;flex-wrap:wrap;gap:5px 14px;margin:0 0 7px}'
  + '.cd-idr em{font-style:normal;font-size:9px;color:#7A7263}'
  + '.cd-idr em b{font-weight:700;color:#2D1B09}'
  + '.cd-tag{display:inline-block;font-size:8px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;'
    + 'padding:1.5px 6px;border-radius:9px;background:#F0E6D2;color:#7B4A1A;margin-left:6px}';

/* ── Le controle de maturite ───────────────────────────────────────────────
   Une matrice : une ligne par parcelle, une colonne par jour de releve. C'est
   la forme que le papier sait faire mieux que l'ecran — la courbe compare deux
   parcelles, le tableau les compare toutes. */

/* Les annees ou l'on a mesure quelque chose, la plus recente d'abord. */
function _matAnnees(){
  var s = {};
  (CAVE_VENDANGE.analyses || []).forEach(function(a){
    if(a && a.date && String(a.date).length >= 4) s[String(a.date).slice(0, 4)] = 1;
  });
  return Object.keys(s).sort().reverse();
}

/* La date a laquelle le document se place. L'annee en cours se lit AUJOURD'HUI,
   comme l'ecran. Une annee passee se lit a son DERNIER releve : sinon la
   fenetre de fraicheur de sept jours ne contiendrait plus rien et les trois
   moyennes sortiraient vides d'un document pourtant plein de mesures. */
function _matRefIso(an){
  var today = new Date().toISOString().slice(0, 10);
  if(String(an) === today.slice(0, 4)) return today;
  var last = '';
  (CAVE_VENDANGE.analyses || []).forEach(function(a){
    if(a && a.date && String(a.date).slice(0, 4) === String(an) && a.date > last) last = a.date;
  });
  return last || (an + '-12-31');
}

/* Formatage seul — le calcul vit en sucre, l'affichage suit l'unite de saisie
   majoritaire. Un domaine qui lit son degre au refractometre ne doit pas
   trouver un chiffre en g/L en gros : personne ne l'a mesure. */
function _matDocVal(suc, spd, un){ return un === 'a' ? _mvF1(suc / spd) : String(Math.round(suc)); }
function _matDocAlt(suc, spd, un){ return un === 'a' ? (Math.round(suc) + ' g/L') : ('~' + _mvF1(suc / spd) + ' %vol'); }
function _matDocUn(un){ return un === 'a' ? '%vol' : 'g/L'; }

function _matDoc(an){
  var spd = (_vendCfg().sucre_par_degre) || 16.83;
  var ref = _matRefIso(an);
  var tj  = Date.parse(ref);
  var S;
  try{ S = _matSynth(_matFen, ref); }
  catch(err){
    if(window.logError) window.logError({ level:'error', cat:'cave', msg:'controle de maturite' });
    showToast('Document impossible à produire', '#C0392B'); return;
  }

  /* Le meme filtre que la synthese, au caractere pres : ce qui est dans le
     tableau est ce qui est dans les moyennes. */
  var byP = {}, jours = {}, nAlc = 0, nTot = 0;
  (CAVE_VENDANGE.analyses || []).forEach(function(a){
    if(!a || !a.parcelle || !a.date) return;
    if(a.date > ref) return;
    if(_matJours(a.date, tj) > _MAT_CAMP_J) return;
    (byP[a.parcelle] = byP[a.parcelle] || []).push(a);
    jours[a.date] = 1; nTot++; if(a.mode === 'alc') nAlc++;
  });
  if(!nTot){ showToast('Aucun relevé de maturité sur ' + an, '#B85A1A'); return; }

  var un    = (nAlc > nTot / 2) ? 'a' : 's';
  var toutes = Object.keys(jours).sort();
  var cols   = toutes.length > 8 ? toutes.slice(-8) : toutes;
  var caches = toutes.length - cols.length;
  var rangs  = _matClasse(byP, spd);

  /* Rentrees : la synthese sait deja lesquelles, et depuis quand. */
  var rentree = {};
  (S.rentrees || []).forEach(function(e){ rentree[e.nom] = e.rentree; });

  function tuile(lab, b){
    if(!b || !b.n) return '<div class="cd-k"><b>' + lab + '</b><span>—</span>'
      + '<i>aucune mesure dans la fenêtre</i></div>';
    return '<div class="cd-k"><b>' + lab + '</b>'
      + '<span>' + _matDocVal(b.pond, spd, un) + ' <small>' + _matDocUn(un) + '</small></span>'
      + '<i>' + _matDocAlt(b.pond, spd, un) + '<br>' + b.n + ' parcelle' + (b.n > 1 ? 's' : '')
      + ' sur ' + b.nTot + ' · ' + _mvF1(b.ha || 0) + ' ha (' + b.pct + ' %)</i></div>';
  }

  var nConv = 0;
  function cell(arr, d){
    var v = null;
    for(var i = 0; i < arr.length; i++) if(arr[i].date === d) v = arr[i];
    if(!v) return '<td class="n">·</td>';
    var suc  = _matSuc(v, spd);
    var conv = (un === 'a') !== (v.mode === 'alc');
    if(conv) nConv++;
    return '<td class="n' + (conv ? ' cd-conv' : '') + '">' + _matDocVal(suc, spd, un) + '</td>';
  }

  var lignes = rangs.map(function(r){
    var ha  = _vendParcSurf(r.nom);
    var c   = _parcCoul(r.nom);
    var age = _matJours(r.date, tj);
    var etat = rentree[r.nom]
      ? ('Rentrée le ' + _vendFrDate(rentree[r.nom]))
      : (age <= _matFen ? 'À jour' : ('Relevé il y a ' + age + ' j'));
    var vit = (r.vit == null) ? '—'
      : ((r.vit >= 0 ? '+' : '−') + _mvF1(Math.abs(un === 'a' ? r.vit / spd : r.vit)));
    return '<tr><td>' + _escHtml(r.nom) + '</td>'
      + '<td>' + (c === 'r' ? 'Rouge' : c === 'b' ? 'Blanc' : '—') + '</td>'
      + '<td class="n">' + _mvF1(ha) + '</td>'
      + cols.map(function(d){ return cell(r.arr, d); }).join('')
      + '<td class="n">' + _matDocVal(r.suc, spd, un) + '</td>'
      + '<td class="n">' + vit + '</td>'
      + '<td>' + etat + '</td></tr>';
  }).join('');

  var tete = '<tr><th>Parcelle</th><th>Couleur</th><th class="n">ha</th>'
    + cols.map(function(d){ return '<th class="n">' + _vendFrDate(d) + '</th>'; }).join('')
    + '<th class="n">Dernier</th><th class="n">Vitesse</th><th>État</th></tr>';

  var corps = '<div class="cd-kpis">'
    + tuile('Domaine', S.tiles.dom) + tuile('Rouges', S.tiles.rge) + tuile('Blancs', S.tiles.bl)
    + '</div>'
    + '<h2>Ordre de maturité — ' + rangs.length + ' parcelle' + (rangs.length > 1 ? 's' : '')
    + ' suivie' + (rangs.length > 1 ? 's' : '') + '</h2>'
    + '<table><thead>' + tete + '</thead><tbody>' + lignes + '</tbody></table>'
    + '<div class="cd-note">Valeurs en ' + _matDocUn(un) + '. La vitesse est calculée sur les deux '
    + 'derniers relevés de la parcelle, en ' + _matDocUn(un) + ' par jour. Un point signifie : pas de '
    + 'relevé ce jour-là.'
    + (nConv ? ' Les ' + nConv + ' valeur' + (nConv > 1 ? 's' : '') + ' en italique '
        + (nConv > 1 ? 'ont' : 'a') + ' été saisie' + (nConv > 1 ? 's' : '')
        + ' dans l’autre unité puis convertie' + (nConv > 1 ? 's' : '') + '.' : '')
    + (caches ? ' Les ' + caches + ' premier' + (caches > 1 ? 's' : '') + ' jour'
        + (caches > 1 ? 's' : '') + ' de relevé ne tiennent pas dans le tableau : seuls les huit '
        + 'derniers sont affichés.' : '')
    + '</div>';

  if(S.jamais && S.jamais.length){
    corps += '<h2>Sans aucun relevé — ' + S.jamais.length + ' parcelle'
      + (S.jamais.length > 1 ? 's' : '') + '</h2>'
      + '<div class="cd-vide">' + S.jamais.map(function(e){
          return _escHtml(e.nom) + ' <span style="color:#9A9080">(' + _mvF1(e.ha) + ' ha)</span>';
        }).join(' · ') + '</div>';
  }
  if(S.nonClass && S.nonClass.length){
    corps += '<div class="cd-note"><b>' + S.nonClass.length + ' parcelle'
      + (S.nonClass.length > 1 ? 's ne sont pas classées' : ' n’est pas classée')
      + ' en rouge ou blanc</b> — cépage non renseigné, ou deux couleurs complantées : '
      + S.nonClass.map(function(e){ return _escHtml(e.nom); }).join(', ')
      + '. Elles comptent dans la moyenne du domaine, jamais dans celle d’une couleur.</div>';
  }

  corps += '<div class="mvdoc-lim"><b>Ce document présente vos propres mesures.</b> '
    + 'C’est un état interne : il ne tient lieu d’aucune déclaration. '
    + 'Les trois moyennes sont <b>pondérées par la surface</b> et ne retiennent que les relevés '
    + 'des ' + _matFen + ' derniers jours au ' + _vendFrDate(ref) + ' — une parcelle mesurée avant '
    + 'reste dans le tableau, pas dans la moyenne. Le pourcentage dit quelle part de la surface '
    + 'encore sur pied est couverte par ces relevés. La conversion sucre ↔ degré utilise le '
    + 'coefficient <b>figé au moment de chaque saisie</b> (réglage actuel : ' + _mvF1(spd)
    + ' g/L par degré) : changer ce réglage ne réécrit pas le passé.</div>';

  if(typeof window._mvDocOpen !== 'function'){
    showToast('Mise à jour incomplète — rechargez l’application', '#B85A1A'); return;
  }
  var d1 = toutes[0], d2 = toutes[toutes.length - 1];
  window._mvDocOpen({
    titre: 'Contrôle de maturité ' + an,
    orient: 'paysage', cat: 'cave', css: MV_CUVDOC_CSS, corps: corps,
    metas: [nTot + ' relevé' + (nTot > 1 ? 's' : '') + ' sur ' + rangs.length + ' parcelle'
              + (rangs.length > 1 ? 's' : ''),
            'du ' + _vendFrDate(d1) + ' au ' + _vendFrDate(d2),
            'Édité le ' + new Date().toLocaleDateString('fr-FR')]
  });
  showToast('\u{1F347} Contrôle de maturité ' + an, '#3D6B27');
}

/* Ne jamais poser une question dont la reponse est unique. */
window._matExportChoix = function(){
  var ans = _matAnnees();
  if(!ans.length){ showToast('Aucun relevé de maturité enregistré', '#B85A1A'); return; }
  if(ans.length === 1 || typeof window.openPrompt !== 'function'){ _matDoc(ans[0]); return; }
  window.openPrompt({
    titre:'Quelle année ?', unite:'', icone:'\u{1F347}', type:'nombre',
    sub:'Le contrôle de maturité se lit vendange par vendange. Disponibles : ' + ans.join(', ') + '.',
    valeur:String(ans[0]), placeholder:String(ans[0]), btnLabel:'Éditer le relevé',
    cb:function(v){
      var n = String(parseInt(String(v).replace(/\D/g, ''), 10));
      if(ans.indexOf(n) < 0){ showToast('Aucun relevé sur ' + n, '#B85A1A'); return; }
      _matDoc(n);
    }
  });
};

/* ── Le cahier de cuverie ──────────────────────────────────────────────────
   Une page par cuve : ce qui y est entre, la cinetique jour par jour, les
   operations, et ou le vin est parti. C'est le cahier qu'on tenait au mur du
   cuvier, et qu'on recopiait le soir. */

/* L'annee d'une cuve. La date d'entree fait foi ; a defaut on prend le premier
   releve, puis le decuvage — une cuve sans aucune date ne se rattache a rien
   et ne doit pas atterrir dans l'annee courante par defaut. */
function _cuvAn(c){
  if(!c) return '';
  if(c.date_entree) return String(c.date_entree).slice(0, 4);
  var m = (c.mesures_fa || [])[0];
  if(m && m.date) return String(m.date).slice(0, 4);
  if(c.decuvage && c.decuvage.date) return String(c.decuvage.date).slice(0, 4);
  return '';
}
function _cuvAnnees(){
  var s = {};
  (CAVE_VENDANGE.cuves_vinif || []).forEach(function(c){ var a = _cuvAn(c); if(a) s[a] = 1; });
  return Object.keys(s).sort().reverse();
}
function _cuvErLbl(k){
  return k === 'total' ? 'Éraflage total' : k === 'partiel' ? 'Éraflage partiel' : 'Vendange entière';
}
function _cuvJours(a, b){
  if(!a || !b) return null;
  var d = Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
  return isFinite(d) ? d : null;
}

function _cuvDoc(an){
  var cuves = (CAVE_VENDANGE.cuves_vinif || []).filter(function(c){ return _cuvAn(c) === String(an); })
    .sort(function(a, b){ return String(a.date_entree || '') < String(b.date_entree || '') ? -1 : 1; });
  if(!cuves.length){ showToast('Aucune cuve sur ' + an, '#B85A1A'); return; }

  var totVol = 0, totMes = 0, totSuc = 0, totRem = 0, totPig = 0;
  var sections = cuves.map(function(c){
    var mes = (c.mesures_fa || []).slice().sort(function(a, b){ return String(a.date) < String(b.date) ? -1 : 1; });
    var ops = (c.operations || []).slice().sort(function(a, b){ return String(a.date) < String(b.date) ? -1 : 1; });
    totVol += (c.volume_hl || 0);
    totMes += mes.length;
    ops.forEach(function(o){ if(o.type === 'chaptalisation' && o.kg_sucre) totSuc += o.kg_sucre; });

    var rem = 0, pig = 0;
    var rows = mes.map(function(m){
      rem += (m.remontages || 0); pig += (m.pigeages || 0);
      var d20 = _vendMesD20(m);
      return '<tr><td>' + _vendFrDate(m.date) + '</td>'
        + '<td class="n">' + (m.densite != null ? Math.round(m.densite) : '—') + '</td>'
        + '<td class="n">' + (d20 != null ? Math.round(d20) : '—') + '</td>'
        + '<td class="n">' + (m.temp_c != null ? _mvF1(m.temp_c) : '—') + '</td>'
        + '<td class="n">' + (d20 != null ? Math.round(_vendSucre(d20)) : '—') + '</td>'
        + '<td class="n">' + (d20 != null ? _vendFaPct(d20) + ' %' : '—') + '</td>'
        + '<td class="n">' + (m.remontages || 0) + '</td>'
        + '<td class="n">' + (m.pigeages || 0) + '</td>'
        + '<td>' + _escHtml(m.note || '') + '</td></tr>';
    }).join('');
    totRem += rem; totPig += pig;

    var fin  = (c.decuvage && c.decuvage.date) || (mes.length ? mes[mes.length - 1].date : null);
    var nj   = _cuvJours(c.date_entree, fin);
    var dDeb = mes.length ? _vendMesD20(mes[0]) : null;
    var dFin = mes.length ? _vendMesD20(mes[mes.length - 1]) : null;

    var tbl = mes.length
      ? ('<table><thead><tr><th>Date</th><th class="n">Densité</th><th class="n">à 20 °C</th>'
          + '<th class="n">T °C</th><th class="n">Sucre g/L</th><th class="n">Avanc.</th>'
          + '<th class="n">Rem.</th><th class="n">Pig.</th><th>Note</th></tr></thead><tbody>'
          + rows
          + '<tr class="tot"><td>' + mes.length + ' relevé' + (mes.length > 1 ? 's' : '') + '</td>'
          + '<td class="n">' + (dDeb != null ? Math.round(dDeb) : '—') + '</td>'
          + '<td class="n">' + (dFin != null ? Math.round(dFin) : '—') + '</td>'
          + '<td colspan="3"></td>'
          + '<td class="n">' + rem + '</td><td class="n">' + pig + '</td><td></td></tr>'
          + '</tbody></table>')
      : '<div class="cd-vide">Aucun relevé de fermentation sur cette cuve.</div>';

    var tops = ops.length
      ? ('<table><thead><tr><th>Date</th><th>Opération</th><th>Détail</th><th>Note</th></tr></thead><tbody>'
          + ops.map(function(o){
              return '<tr><td>' + _vendFrDate(o.date) + '</td>'
                + '<td>' + _escHtml(_vendOpLbl(o.type)) + '</td>'
                + '<td>' + _escHtml(_rmDetail(o) || '—') + '</td>'
                + '<td>' + _escHtml(o.note || '') + '</td></tr>';
            }).join('')
          + '</tbody></table>')
      : '';

    var parc = (c.parcelles || []);
    var haP  = parc.reduce(function(s, n){ return s + _vendParcSurf(n); }, 0);
    var id = [];
    if(c.date_entree) id.push('<em>Entrée le <b>' + _vendFrDate(c.date_entree) + '</b></em>');
    if(c.volume_hl)   id.push('<em>Volume <b>' + _mvF1(c.volume_hl) + ' hL</b></em>');
    if(parc.length)   id.push('<em>' + parc.length + ' parcelle' + (parc.length > 1 ? 's' : '')
                        + ' <b>' + _escHtml(parc.join(', ')) + '</b>'
                        + (haP > 0 ? ' (' + _mvF1(haP) + ' ha)' : '') + '</em>');
    if(c.nb_caisses)  id.push('<em>Apport <b>' + c.nb_caisses + ' caisses</b></em>');
    id.push('<em><b>' + _cuvErLbl(c.erasflage) + '</b></em>');
    id.push('<em>Levures <b>' + (c.levures === 'selectionnees' ? 'sélectionnées' : 'indigènes') + '</b></em>');
    if(c.so2_g_hl)    id.push('<em>SO₂ à l’encuvage <b>' + _mvF1(c.so2_g_hl) + ' g/hL</b></em>');
    if(c.mpf && c.mpf.active) id.push('<em>Macération préfermentaire <b>' + _mvF1(c.mpf.temp_c || 0)
                        + ' °C · ' + (c.mpf.duree_j || 0) + ' j</b></em>');
    if(nj != null)    id.push('<em>Cuvaison <b>' + nj + ' jour' + (nj > 1 ? 's' : '') + '</b></em>');

    var pied = '';
    if(c.decuvage && c.decuvage.date){
      var cu = (CAVE_ELEVAGE.cuvees || []).filter(function(x){ return x.id === c.decuvage.cuvee_id; })[0];
      pied = '<div class="cd-note"><b>Décuvée le ' + _vendFrDate(c.decuvage.date) + '</b>'
        + (cu ? ' → passée au Chai sous le nom « ' + _escHtml(cu.nom) + ' » (millésime '
            + _escHtml(String(cu.millesime || an)) + ')' : '') + '.</div>';
    }

    return '<div class="cd-cuve mvdoc-avoid"><h3>' + _escHtml(c.nom || 'Cuve')
      + '<span class="cd-tag">' + _escHtml(_vendStatLbl(c.statut)) + '</span></h3>'
      + '<div class="cd-idr">' + id.join('') + '</div>'
      + tbl + (tops ? ('<h2 style="margin-top:9px">Opérations</h2>' + tops) : '') + pied + '</div>';
  }).join('');

  var enCours = cuves.filter(function(c){ return c.statut !== 'termine'; }).length;
  var corps = '<div class="cd-kpis">'
    + '<div class="cd-k"><b>Cuves</b><span>' + cuves.length + '</span><i>' + enCours
      + ' encore en cuve</i></div>'
    + '<div class="cd-k"><b>Volume</b><span>' + _mvF1(totVol) + ' <small>hL</small></span>'
      + '<i>à l’encuvage, saignées déduites</i></div>'
    + '<div class="cd-k"><b>Relevés</b><span>' + totMes + '</span><i>' + totRem + ' remontages · '
      + totPig + ' pigeages</i></div>'
    + '<div class="cd-k"><b>Sucre ajouté</b><span>' + _mvF1(totSuc) + ' <small>kg</small></span>'
      + '<i>toutes cuves confondues</i></div>'
    + '</div>'
    + sections
    + '<div class="mvdoc-lim"><b>Ce document présente vos propres relevés.</b> '
    + 'C’est un état interne : il ne tient lieu d’aucune déclaration, et il ne remplace pas le '
    + 'registre des manipulations, qui reste le document du contrôle. '
    + 'La <b>densité à 20 °C</b> est votre densité corrigée par la température saisie — sans '
    + 'température, la valeur brute est reprise telle quelle. Le <b>sucre restant</b> et '
    + 'l’<b>avancement</b> sont estimés à partir de cette densité : ce sont des ordres de '
    + 'grandeur, jamais une analyse de laboratoire.</div>';

  if(typeof window._mvDocOpen !== 'function'){
    showToast('Mise à jour incomplète — rechargez l’application', '#B85A1A'); return;
  }
  window._mvDocOpen({
    titre: 'Cahier de cuverie ' + an,
    orient: 'portrait', cat: 'cave', css: MV_CUVDOC_CSS, corps: corps,
    metas: [cuves.length + ' cuve' + (cuves.length > 1 ? 's' : ''),
            totMes + ' relevé' + (totMes > 1 ? 's' : '') + ' de fermentation',
            'Édité le ' + new Date().toLocaleDateString('fr-FR')]
  });
  showToast('\u{1FAA3} Cahier de cuverie ' + an, '#3D6B27');
}

window._cuvExportChoix = function(){
  var ans = _cuvAnnees();
  if(!ans.length){ showToast('Aucune cuve de vinification enregistrée', '#B85A1A'); return; }
  if(ans.length === 1 || typeof window.openPrompt !== 'function'){ _cuvDoc(ans[0]); return; }
  window.openPrompt({
    titre:'Quelle vendange ?', unite:'', icone:'\u{1FAA3}', type:'nombre',
    sub:'Une cuve appartient à l’année où elle est entrée. Disponibles : ' + ans.join(', ') + '.',
    valeur:String(ans[0]), placeholder:String(ans[0]), btnLabel:'Éditer le cahier',
    cb:function(v){
      var n = String(parseInt(String(v).replace(/\D/g, ''), 10));
      if(ans.indexOf(n) < 0){ showToast('Aucune cuve sur ' + n, '#B85A1A'); return; }
      _cuvDoc(n);
    }
  });
};

window._matDoc     = _matDoc;
window._matAnnees  = _matAnnees;
window._cuvDoc     = _cuvDoc;
window._cuvAnnees  = _cuvAnnees;
