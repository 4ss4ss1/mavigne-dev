// ════════════════════════════════════
// MA VIGNE — tracteur.js
// Module Tracteur extrait de app.js
// Sessions, Entretien, Réparateur, Parc tracteurs
// © 2026 Nicolas GUERET / GUERETTECH
// ════════════════════════════════════

import { isAdmin, isTractoriste, isSaisonnier, canWrite,
         showToast, _escHtml, _escAttr, tNom, logError, _swNotify, dreEffectif
, _mvBadge, _mvIcon, _actIcone, _mvSetIcon } from './utils.js';

// ── Flag debug (console.log silencieux en prod — manquait après extraction du module) ──
const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// ── Filtres Tracteur : état porté par window (les onclick inline y écrivent) ──
if(window.fCond===undefined)window.fCond='tous';
if(window.fAct===undefined)window.fAct='toutes';
if(window.tracSessionId===undefined)window.tracSessionId=null; // session ouverte dans le panneau détail (lu par app.js)
if(window.selEmoji===undefined)window.selEmoji='\uD83D\uDE9C';

// ── Raccourcis globals app.js (définis après chargement) ──
function _saveData(k,l){ if(window.saveData) window.saveData(k,l); }
function _openOv(id){ if(window.openOv) window.openOv(id); }
function _condList(){ return (typeof window!=='undefined'&&window._conducteursDispo)?window._conducteursDispo():((typeof CONDUCTEURS!=='undefined'&&CONDUCTEURS)||(window&&window.CONDUCTEURS)||[]); }
function _closeOv(e,id){ if(window.closeOv) window.closeOv(e,id); }
function _openConfirmDel(t,m,cb,icon,btnLabel,btnColor){ if(window.openConfirmDel) window.openConfirmDel(t,m,cb,icon,btnLabel,btnColor); }
function _fmtDate(d){ return window.fmtDate ? window.fmtDate(d) : d; }

// ════ TRACTEUR — ONGLETS & ENTRETIEN ════

// ── Onglet actif ──
var _tracOnglet = 'sessions'; // 'sessions' | 'entretiens'

function renderCatalogueTrac(){
  const el=document.getElementById('catalogue-list-trac');if(!el)return;
  el.innerHTML=CATALOGUE.map(p=>`<div class="catitem" onclick="openCatDetail('${_escAttr(p.nom)}')"><div class="cat-l"><div class="cat-nom">${_escHtml(p.nom)}</div><div class="cat-det">AMM ${_escHtml(p.amm)} · ${_escHtml(p.dose)}${p.cible?' · '+_escHtml(p.cible):''}</div>${p.usage?`<div style="font-size:9px;color:var(--texte-doux);margin-top:2px">ℹ️ ${_escHtml(p.usage)}</div>`:''}</div><div class="cat-r"><span class="cat-db ${TCLS[p.type]||'tfc'}">${_escHtml(p.type)}</span><span style="font-size:10px;color:var(--texte-doux);display:block">DAR ${p.dar}j</span>${p.drae>0?`<span style="font-size:9px;color:var(--tag-amber-tx,#856404);font-weight:600;display:block">DRAE ${p.drae}h</span>`:''}${p.znt?`<span style="font-size:9px;color:var(--rouge);font-weight:600;display:block">ZNT ${p.znt}m</span>`:''}</div></div>`).join('');
}
// ════ Catalogue E-Phy (ANSES) — référentiel officiel vigne, lecture seule ════
var _catSub = 'ephy';
var _ephyQ = '', _ephyType = 'Tous', _ephyHideKo = true, _ephyChipsBuilt = false;
var EPHY_TYPES = ['Tous','Cuivre','Soufre','Fongicide','Insecticide','Herbicide','Biocontrôle','MFSC','Adjuvant','Mixte'];

function _ephyList(){ return (window.EPHY && window.EPHY.length) ? window.EPHY : []; }

function catSub(which){
  _catSub = which;
  var ev = document.getElementById('cat-ephy-view');
  if(ev) ev.style.display = (which==='ephy'?'':'none');
  if(which==='mine'){ renderCatalogueTrac(); return; }
  if(!_ephyChipsBuilt) _ephyBuildChips();
  ephyRender();
}

function _ephyBuildChips(){
  var el = document.getElementById('ephy-chips'); if(!el) return;
  el.innerHTML = EPHY_TYPES.map(function(tp){
    return '<button class="ephy-chip'+(tp===_ephyType?' on':'')+'" onclick="ephySetType(\'' + tp + '\')">'+tp+'</button>';
  }).join('');
  _ephyChipsBuilt = true;
}
function ephySetType(tp){ _ephyType = tp; _ephyBuildChips(); ephyRender(); }
function ephyClear(){ var i=document.getElementById('ephy-q'); if(i) i.value=''; _ephyQ=''; ephyRender(); }
function ephyToggleKo(){ _ephyHideKo=!_ephyHideKo; var t=document.getElementById('ephy-tgl'); if(t) t.classList.toggle('on',_ephyHideKo); ephyRender(); }
function _ephyMini(label,cls){ return '<span class="ephy-mini '+cls+'">'+label+'</span>'; }

function ephyRender(){
  var listEl = document.getElementById('catalogue-list-ephy'); if(!listEl) return;
  var qel = document.getElementById('ephy-q'); _ephyQ = qel ? qel.value.trim().toLowerCase() : '';
  var clr = document.getElementById('ephy-clr'); if(clr) clr.style.display = _ephyQ ? 'flex' : 'none';
  var attr = document.getElementById('ephy-attr');
  if(attr){
    var meta = window.EPHY_META || {}; var dt='';
    try{ if(meta.updated && meta.updated.seconds) dt = new Date(meta.updated.seconds*1000).toLocaleDateString('fr-FR'); }catch(e){}
    attr.innerHTML = 'Source : <b>Données E-Phy — Anses</b>'+(dt?' · MAJ '+dt:'')+' · Licence Ouverte<br>Données indicatives, non opposables.';
  }
  var all = _ephyList();
  if(!all.length){
    var st=window._ephyStatus||'loading', msg, retry='';
    if(st==='error'){ msg='Catalogue momentanément indisponible.'; retry='<div style="margin-top:12px"><button class="ephy-chip" style="cursor:pointer" onclick="if(window._fbLoadEphy)window._fbLoadEphy()">Réessayer</button></div>'; }
    else if(st==='offline'){ msg='Catalogue indisponible hors connexion.'; }
    else if(st==='empty'){ msg='Catalogue E-Phy vide pour le moment.'; }
    else{ msg='Catalogue E-Phy en cours de chargement…'; }
    listEl.innerHTML = '<div style="padding:30px 16px;text-align:center;color:var(--texte-doux);font-size:13px">'+msg+retry+'</div>';
    var c0=document.getElementById('ephy-cnt'); if(c0) c0.textContent='—'; return;
  }
  var l = all.filter(function(p){
    if(_ephyType!=='Tous' && p.type!==_ephyType) return false;
    if(_ephyHideKo && p.statut==='ko') return false;
    if(_ephyQ){
      var hay = (p.nom+' '+(p.sub||'')+' '+p.amm+' '+((p.noms2||[]).join(' '))+' '+((p.usages||[]).map(function(u){return u.cible;}).join(' '))).toLowerCase();
      if(hay.indexOf(_ephyQ)<0) return false;
    }
    return true;
  });
  var cnt=document.getElementById('ephy-cnt');
  if(cnt) cnt.textContent = l.length+' produit'+(l.length>1?'s':'')+(_ephyType!=='Tous'?' · '+_ephyType:'');
  if(!l.length){ listEl.innerHTML='<div style="padding:30px 16px;text-align:center;color:var(--texte-doux);font-size:13px">Aucun produit ne correspond.</div>'; return; }
  listEl.innerHTML = l.map(function(p){
    var u = (p.usages&&p.usages[0])||{}; var minis=[];
    if(u.dar!=null && u.dar!=='—') minis.push(_ephyMini('DAR '+u.dar+'j','m-dar'));
    if(u.znt!=null && u.znt!=='—') minis.push(_ephyMini('ZNT '+u.znt+'m','m-znt'));
    var _dl=dreEffectif(p.drae,p.type,p.dreH,p.dreHc);
    if(_dl.h>0 && !_dl.defaut) minis.push(_ephyMini('Réentrée '+_dl.h+'h','m-drae'));
    if((p.ment||[]).indexOf('AB')>=0) minis.push(_ephyMini('AB','m-ab'));
    var stat = p.statut==='ok' ? '<span class="ephy-stat s-ok">'+_mvIcon('check',16)+' Autorisé</span>' : '<span class="ephy-stat s-ko">'+_mvIcon('interdit',16)+' Retiré</span>';
    return '<div class="catitem'+(p.statut==='ko'?' is-ko':'')+'" onclick="openEphyDetail(\'' + _escAttr(p.amm) + '\')">'
      + '<div class="cat-l"><div class="cat-nom">'+_escHtml(p.nom)+'</div>'
      + '<div class="cat-det"><span style="font-family:monospace">AMM '+_escHtml(p.amm)+'</span> · '+_escHtml(p.sub||'—')+'</div>'
      + (minis.length?'<div class="ephy-minis">'+minis.join('')+'</div>':'')+'</div>'
      + '<div class="cat-r"><span class="cat-db '+(TCLS[p.type]||'tfc')+'">'+_escHtml(p.type)+'</span>'+stat+'</div></div>';
  }).join('');
}

function openEphyDetail(amm){
  var p = _ephyList().find(function(x){return x.amm===amm;}); if(!p) return;
  var statBox = p.statut==='ok'
    ? '<div class="oed-box" style="background:var(--vert-pale);grid-column:1/-1"><div class="oed-l">Statut</div><div class="oed-v" style="color:var(--vert)">'+_mvIcon('check',16)+' Autorisé à la vente et à l\'usage</div></div>'
    : '<div class="oed-box" style="background:var(--tag-red-bg,#FEE8E8);grid-column:1/-1"><div class="oed-l">Statut</div><div class="oed-v" style="color:var(--rouge)">'+_mvIcon('interdit',16)+' Retiré — usage interdit</div>'+((p.retraitDate||p.ecoulement)?'<div style="font-size:11px;color:var(--texte-doux);margin-top:5px">'+(p.retraitDate?'Retrait : <b>'+_escHtml(p.retraitDate)+'</b>':'')+(p.ecoulement?' · Fin d\'écoulement : <b>'+_escHtml(p.ecoulement)+'</b>':'')+'</div>':'')+'</div>';
  var usages = (p.usages||[]).map(function(u){
    return '<div class="oed-usage"><div class="oed-uh"><span class="oed-uc">'+_escHtml(u.cible)+'</span><span class="oed-ud">'+_escHtml(u.dose)+'</span></div>'
      + '<div class="oed-ur"><span>DAR : <b>'+(u.dar==='—'?'—':u.dar+' j')+'</b></span><span>ZNT : <b>'+(u.znt==='—'?'—':u.znt+' m')+'</b></span><span>Réentrée : <b>'+dreEffectif(p.drae,p.type,p.dreH,p.dreHc).txt+'</b></span></div></div>';
  }).join('') || '<div style="font-size:12px;color:var(--texte-doux)">Aucun usage vigne listé.</div>';
  var ments = (p.ment||[]).map(function(m){
    var cls = m==='AB'?'m-ab':(m==='Abeilles'?'m-dar':'m-znt');
    var lbl = m==='Abeilles'?(_mvIcon('abeille',16)+' Toxique abeilles')
        :(m==='AB'?(_mvIcon('check',16)+' Utilisable en bio'):_escHtml(m));
    return '<span class="ephy-mini '+cls+'">'+lbl+'</span>';
  }).join('');
  document.getElementById('oed-title').textContent = p.nom;
  document.getElementById('oed-sub').textContent = 'N° AMM '+p.amm+' · '+p.type;
  var noms2Html = (p.noms2&&p.noms2.length)
    ? '<div class="oed-box" style="grid-column:1/-1"><div class="oed-l">Aussi commercialisé sous</div><div class="oed-v" style="font-size:12px;line-height:1.5">'+p.noms2.map(function(n){return _escHtml(n);}).join(' · ')+'</div></div>'
    : '';
  var _dreP=dreEffectif(p.drae,p.type,p.dreH,p.dreHc);
  var dreBox='';
  if(!_dreP.na){
    var _dCol=_dreP.h>=48?'#7A1020':(_dreP.h>=24?'#B5621A':'var(--texte)');
    var _dBg=_dreP.h>=48?'#FEE8E8':(_dreP.h>=24?'#FFF3CD':'var(--gris-clair)');
    var _dNote=_dreP.defaut?'Minimum légal — aucune mention de danger ne majore ce délai (arrêté du 4 mai 2017).':'Délai majoré selon la classification de danger du produit (arrêté du 4 mai 2017).';
    dreBox='<div class="oed-box" style="background:'+_dBg+';grid-column:1/-1"><div class="oed-l">Délai de rentrée</div><div class="oed-v" style="color:'+_dCol+';font-weight:700">'+_escHtml(_dreP.txtLong)+'</div><div style="font-size:11px;color:var(--texte-doux);margin-top:4px">'+_dNote+'</div></div>';
  }
  document.getElementById('oed-body').innerHTML =
      '<div class="oed-grid">'+statBox+dreBox+'<div class="oed-box" style="grid-column:1/-1"><div class="oed-l">Substance active</div><div class="oed-v">'+_escHtml(p.sub||'—')+'</div></div>'+noms2Html+'</div>'
    + (ments?'<div class="ephy-minis" style="margin:0 0 12px">'+ments+'</div>':'')
    + '<div class="oed-sec">Usages homologués · Vigne</div>'+usages
    + '<div class="oed-disc"><b>'+_mvIcon('alerte',16)+' Donnée indicative.</b> Les informations E-Phy ne sont pas opposables : seul le registre officiel fait foi. Vérifiez avant tout traitement sur <a href="https://ephy.anses.fr" target="_blank" rel="noopener">ephy.anses.fr</a>.</div>';
  if(window.openOv) window.openOv('ovEphyDetail');
}

window.applyEphy = function(){ if(_catSub==='ephy' && document.getElementById('catalogue-list-ephy')) ephyRender(); };

function _phParcTxt(t){
  var act=(window.PARCELLES||[]).filter(function(p){return p.statut!=='Arrachee';});
  var tot=act.length;
  var a=t.parcelles;
  if(typeof a==='string') return a;
  if(!a||!a.length) return '';
  if(tot && a.length>=tot) return 'Domaine entier ('+a.length+')';
  if(a.length<=3) return a.join(', ');
  return a.slice(0,3).join(', ')+' +'+(a.length-3);
}
function renderPhytoTrac(){
  const el=document.getElementById('traitements-list-trac');if(!el)return;
  const list=[...TRAITEMENTS].sort((a,b)=>b.date.localeCompare(a.date));
  if(!list.length){el.innerHTML='<div class="empty-state" style="margin-top:40px"><div class="ei">'+_mvIcon('eprouvette',40)+'</div><p>Aucun traitement cette saison</p></div>';return;}
  const now=new Date();
  const TC={'Cuivre':'var(--tag-blue-tx,#1A4A7A)','Soufre':'var(--tag-amber-tx,#7D6608)','Fongicide':'var(--tag-purple-tx,#4A2060)','Insecticide':'var(--tag-red-tx,#A0291E)','Herbicide':'var(--tag-green-tx,#1E3A12)','Biocontrôle':'var(--tag-teal-tx,#2C6E49)'};
  const TB={'Cuivre':'var(--tag-blue-bg,rgba(26,74,122,0.14))','Soufre':'var(--tag-amber-bg,rgba(125,102,8,0.16))','Fongicide':'var(--tag-purple-bg,rgba(90,45,142,0.16))','Insecticide':'var(--tag-red-bg,rgba(160,41,30,0.14))','Herbicide':'var(--tag-green-bg,rgba(30,58,18,0.14))','Biocontrôle':'var(--tag-teal-bg,rgba(44,110,73,0.14))'};
  el.innerHTML=list.map(t=>{
    const idx=TRAITEMENTS.indexOf(t);
    const m=window._phResolve?window._phResolve(t):{type:t.type||'',amm:t.amm,dar:t.dar,drae:t.drae||0,dose:t.dose};
    const darBase=(m.dar!=null?m.dar:0);
    let darBadge='';
    if(darBase>0&&t.date){
      const ap=new Date(t.date);const fin=new Date(ap.getTime()+darBase*86400000);
      const reste=Math.ceil((fin-now)/86400000);
      if(reste>0) darBadge='<span style="background:var(--rouge-pale);color:var(--rouge);font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px">DAR '+reste+'j</span>';
    }
    const dreInfo=dreEffectif(m.drae,m.type,m.dreH,m.dreHc);
    let draeBadge='';
    if(dreInfo.h>0&&t.date){
      const draeR=Math.max(0,dreInfo.h-Math.floor((now-new Date(t.date))/3600000));
      if(draeR>0) draeBadge='<span style="background:var(--tag-amber-bg,#FFF3CD);color:var(--tag-amber-tx,#856404);font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px">Réentrée '+draeR+'h</span>';
    }
    const tc=TC[m.type]||'var(--texte-doux)', tb=TB[m.type]||'var(--gris-clair)';
    const emj='';
    const parc=_phParcTxt(t);
    const cond=t.conducteur||t.operateur||'';
    const meta3=(parc||cond);
    return `<div class="phyto-row" onclick="openTraitDetail(${idx})" style="background:var(--bg-card);border-radius:12px;padding:12px 14px;margin-bottom:8px;border:1px solid var(--gris-clair);cursor:pointer">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:14px;font-weight:600;color:var(--texte)">${_escHtml(t.produit)}</span>
        <span style="font-size:11px;color:var(--texte-doux);white-space:nowrap">${_escHtml(t.date)}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;${meta3?'margin-bottom:6px':''}">
        <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:7px;background:${tb};color:${tc}">${emj}${_escHtml(m.type||'—')}</span>
        ${m.dose?'<span style="font-size:11px;color:var(--texte-doux);background:var(--gris-clair);padding:2px 8px;border-radius:7px">'+_escHtml(m.dose)+'</span>':''}
        ${darBadge}
        ${draeBadge}
      </div>
      ${meta3?`<div style="display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11px;color:var(--texte-doux);align-items:center">${parc?'<span>'+_escHtml(parc)+'</span>':''}${cond?'<span>'+_escHtml(cond)+'</span>':''}<span style="margin-left:auto;color:var(--gris)">›</span></div>`:''}
    </div>`;
  }).join('');
}
function switchTracOnglet(ong){
  // Phyto est un module autonome du dock : le Tracteur n'a plus que Sessions / Entretien.
  if(ong==='phyto'){ if(window.goTo) window.goTo('phyto'); return; }
  _tracOnglet = ong;
  document.getElementById('trac-panel-sessions').style.display = ong==='sessions' ? '' : 'none';
  document.getElementById('trac-panel-entretiens').style.display = ong==='entretiens' ? '' : 'none';
  var btnS = document.getElementById('trac-ong-sessions');
  var btnE = document.getElementById('trac-ong-entretiens');
  if(btnS){ btnS.classList.toggle('active', ong==='sessions'); }
  if(btnE){ btnE.classList.toggle('active', ong==='entretiens'); }
  // FAB visible seulement sur Sessions si tractoriste
  var fab = document.getElementById('trac-fab');
  if(fab) fab.style.display = (ong==='sessions' && isTractoriste()) ? 'flex' : 'none';
  if(ong==='entretiens') { renderTracParcPills(); renderRepBanner(); renderEntretiens(); renderEntTracFilter(); }
}

// ── Pills parc tracteurs dans l'en-tête ──
function renderTracParcPills(){
  var el = document.getElementById('trac-parc-pills');
  if(!el) return;
  var today = todayStr();
  el.innerHTML = TRACTEURS_LIST.map(function(t){
    var col = couleurTracType(t.type);
    var rep = REPARATEUR[t.id];
    var badge='', pill='';
    if(rep){
      var retour = rep.prevu_retour||'';
      var depasse = retour && today>retour;
      var proche  = retour && (today===retour || today===addDays(retour,-1));
      var pc = depasse?'bad':(proche?'warn':'info');
      var ptxt = retour ? ('Retour '+_fmtDate(retour)) : 'Au garage';
      badge = _mvBadge('Au garage','rouge');
      pill  = '<span class="tpc-pill '+pc+'">'+ptxt+'</span>';
    } else {
      var comp=t.compteur_h, rev=t.revision_h;
      var hasComp=(comp!=null&&comp!==''&&rev!=null&&rev!=='');
      if(hasComp){
        var reste=Number(rev)-Number(comp);
        var rc=reste<=50?'bad':(reste<=120?'warn':'ok');
        pill=_mvBadge('Révision dans '+_gnrNum(reste)+' h', rc==='urg'?'rouge':rc==='soon'?'ambre':'neutre');
      } else {
        pill=_mvBadge('Révision à renseigner','neutre');
      }
    }
    return '<div class="tpc'+(rep?' rep':'')+'" onclick="switchTracOnglet(\'entretiens\');selectTracteur(\''+_escAttr(t.id)+'\')">'
      +badge
      +'<div class="tpc-ic" style="background:'+col+'26;color:'+col+'">'+_mvIcon('tracteur',20)+'</div>'
      +'<div class="tpc-b">'
        +'<div class="tpc-n">'+_escHtml(t.nom)+'</div>'
        +'<div class="tpc-m">'+_escHtml(t.modele||t.type||'')+'</div>'
        +pill
      +'</div>'
    +'</div>';
  }).join('');
}

// ── Pills filtre tracteur dans onglet Entretiens ──
function renderEntTracFilter(){
  var el = document.getElementById('ent-trac-filter');
  if(!el) return;
  el.innerHTML = '<button onclick="selectTracteur(null)" class="chip'+((!_tracSelId)?'  active ac':'')+'" style="min-height:44px">Tous</button>'
    + TRACTEURS_LIST.map(function(t){
      var active = _tracSelId===t.id;
      var enR = REPARATEUR[t.id];
      return '<button onclick="selectTracteur(\''+_escAttr(t.id)+'\')" class="chip'+(active?' active ac':'')+'" style="min-height:44px">'
        +_escHtml(t.nom)
      +'</button>';
    }).join('');
}

// ── Tracteur actuellement sélectionné ──
var _tracSelId = null;

function getTracteurSel(){
  if(!_tracSelId||!TRACTEURS_LIST.find(t=>t.id===_tracSelId)){
    _tracSelId = TRACTEURS_LIST[0]?.id || null;
  }
  return TRACTEURS_LIST.find(t=>t.id===_tracSelId)||null;
}

function couleurTracType(type){
  return type==='mécanique' ? '#3D6B27' : '#1A4A7A';
}

// ── Render onglets tracteurs (conservé pour compatibilité, remplacé par pills) ──
function renderTracTabs(){
  // Les onglets par tracteur sont remplacés par les pills dans renderTracParcPills()
  // Appel redirigé vers renderTracParcPills si on est sur la page tracteur
  renderTracParcPills();
}

// ── Sélection d'un tracteur ──
function selectTracteur(id){
  _tracSelId=id||null;
  renderEntTracFilter();
  renderRepBanner();
  renderEntretiens();
}

// ── Barre info tracteur (remplacée par pills — conservé pour compatibilité) ──
function renderTracInfoBar(){
  // Remplacé par renderTracParcPills() dans le nouveau layout
}

// ════ RÉPARATEUR ════

function todayStr(){return new Date().toISOString().slice(0,10);}
function addDays(iso,n){var d=new Date(iso);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}

function renderRepBanner(){
  renderRepHist();
  var wrap=document.getElementById('trac-rep-banner');
  if(!wrap)return;
  var t=_tracSelId?getTracteurSel():null;
  if(!t){wrap.style.display='none';return;}
  var rep=REPARATEUR[t.id];
  if(!rep){wrap.style.display='none';return;}
  wrap.style.display='block';
  var today=todayStr();
  var retour=rep.prevu_retour||'';
  var depasse=retour&&today>retour;
  var jourJ=retour&&today===retour;
  var demain=retour&&today===addDays(retour,-1);
  var nbJ=Math.max(0,Math.ceil((new Date(today)-new Date(rep.depuis))/86400000));
  var couleur=depasse?'var(--rouge)':jourJ||demain?'var(--orange)':'var(--bleu)';
  var bgCouleur=depasse?'var(--rouge-pale)':jourJ||demain?'var(--orange-pale)':'var(--bleu-pale)';
  var titre=depasse?'Retour dépassé':jourJ?'Retour prévu aujourd\'hui':demain?'Retour prévu demain':'Chez le réparateur';
  var depasseInfo=depasse&&retour?(' — dépassé de '+Math.ceil((new Date(today)-new Date(retour))/86400000)+'j'):'';
  wrap.innerHTML='<div class="rep-banner" style="background:'+bgCouleur+';border:1px solid '+couleur+'">'
    +'<div style="font-weight:700;color:'+couleur+';font-size:13px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">'
      +'<span>'+titre+' — '+nbJ+'j</span>'
      +'<span style="font-size:11px;font-weight:400;color:var(--texte-doux)">'+_fmtDate(rep.depuis)+'</span>'
    +'</div>'
    +'<div style="font-size:12px;margin-bottom:4px">'+_escHtml(rep.motif)+'</div>'
    +(retour?'<div style="font-size:11px;color:var(--texte-doux);margin-bottom:12px">Retour prévu : <strong style="color:'+couleur+'">'+_fmtDate(retour)+'</strong>'+depasseInfo+'</div>':'<div style="margin-bottom:12px"></div>')
    +((isAdmin()||isTractoriste())?('<div class="rep-banner-btns">'
      +'<button class="rep-banner-btn" style="border:1.5px solid var(--vert);background:transparent;color:var(--vert)" onclick="retourReparateur()">Rentré</button>'
      +'<button class="rep-banner-btn" style="border:1.5px solid var(--orange);background:transparent;color:var(--orange)" onclick="_openOv(\'ovReporter\')">Reporter</button>'
    +'</div>'):'')
  +'</div>';
}

// ── Historique des réparations terminées (affiché sous le bandeau, onglet Entretien) ──
function renderRepHist(){
  var el=document.getElementById('trac-rep-hist');
  if(!el)return;
  var H=window.REPARATEUR_HIST||{};
  var sel=_tracSelId;
  var items=[];
  if(sel){
    (H[sel]||[]).forEach(function(r,i){ items.push({tracId:sel,idx:i,nom:'',r:r}); });
  } else {
    TRACTEURS_LIST.forEach(function(t){
      (H[t.id]||[]).forEach(function(r,i){ items.push({tracId:t.id,idx:i,nom:t.nom,r:r}); });
    });
    items.sort(function(a,b){ return (b.r.retour||'').localeCompare(a.r.retour||''); });
  }
  if(!items.length){ el.style.display='none'; el.innerHTML=''; return; }
  el.style.display='block';
  var canEdit=isAdmin()||isTractoriste();
  var cards=items.map(function(it){
    var r=it.r;
    var dur=Math.max(1,Math.round((new Date(r.retour)-new Date(r.depuis))/86400000));
    return '<div class="rephist-card"><div class="rephist-top">'
      +'<div class="rephist-motif">'+(it.nom?'<span class="rephist-trac">'+_escHtml(it.nom)+'</span> ':'')+_escHtml(r.motif||'Réparation')+'</div>'
      +(canEdit?'<button class="mv-gh rephist-del" onclick="delRepHist(\''+_escAttr(it.tracId)+'\','+it.idx+')" title="Supprimer" aria-label="Supprimer">'+_mvIcon('corbeille',18)+'</button>':'')
      +'</div><div class="rephist-meta">'
      +'<span class="rephist-dates">'+_fmtDate(r.depuis)+' <span class="rephist-arr">→</span> '+_fmtDate(r.retour)+'</span>'
      +'<span class="rephist-dur">'+dur+' jour'+(dur>1?'s':'')+'</span>'
      +'</div></div>';
  }).join('');
  el.innerHTML='<div class="rephist-head"><span class="rephist-h-t">Historique réparations</span><span class="rephist-h-n">'+items.length+'</span></div><div class="rephist-list">'+cards+'</div>';
}

function delRepHist(tracId,idx){
  if(!isAdmin()&&!isTractoriste()){showToast('Réservé aux tractoristes et à l\u2019admin','#C0392B');return;}
  var H=window.REPARATEUR_HIST||{};
  if(!H[tracId]||!H[tracId][idx])return;
  var r=H[tracId][idx];
  _openConfirmDel('Supprimer cette réparation ?',_fmtDate(r.depuis)+' → '+_fmtDate(r.retour),function(){
    H[tracId].splice(idx,1);
    if(!H[tracId].length)delete H[tracId];
    window.REPARATEUR_HIST=H;
    _saveData('reparateur_hist');
    renderRepHist();
    showToast('Réparation supprimée','#C0392B');
  });
}

function openReparateur(){
  if(!isAdmin()&&!isTractoriste()){showToast('Réservé aux tractoristes et à l\u2019admin','#C0392B');return;}
  var t=getTracteurSel();if(!t)return;
  document.getElementById('ov-rep-sub').textContent=t.nom+(t.modele?' — '+t.modele:'');
  var d=document.getElementById('rep-depuis');if(d)d.value=todayStr();
  var m=document.getElementById('rep-motif');if(m)m.value='';
  var g=document.getElementById('rep-four');if(g)g.value='';
  var r=document.getElementById('rep-retour');if(r)r.value='';
  _openOv('ovReparateur');
}

function saveReparateur(){
  if(!isAdmin()&&!isTractoriste()){showToast('Réservé aux tractoristes et à l\u2019admin','#C0392B');return;}
  var t=getTracteurSel();if(!t)return;
  var depuis=document.getElementById('rep-depuis').value;
  var motif=document.getElementById('rep-motif').value.trim();
  var retour=document.getElementById('rep-retour').value;
  // Chez qui : on le sait au moment ou on emmene la machine, pas au retour.
  // ⚠️ Le MONTANT, lui, ne se demande NI ici NI au retour : il arrive avec la
  //   facture, des semaines plus tard, et se saisit dans Economie > Achats.
  //   Le demander a un tractoriste qui rend les cles serait lui demander une
  //   information qu'il n'a pas.
  var _g=document.getElementById('rep-four');
  var four=_g?_g.value.trim():'';
  if(!depuis||!motif){showToast('Date et motif requis','#C0392B');return;}
  REPARATEUR[t.id]={depuis:depuis,motif:motif,prevu_retour:retour,four:four};
  window.REPARATEUR=REPARATEUR;
  localStorage.removeItem('mavigne_notif_rep_'+t.id);
  _saveData('reparateur');
  _closeOv(null,'ovReparateur');
  renderTracTabs();
  renderRepBanner();
  checkRepNotifications();
  showToast('Tracteur signalé chez le réparateur','#E07B2A');
}

function retourReparateur(){
  if(!isAdmin()&&!isTractoriste()){showToast('Réservé aux tractoristes et à l\u2019admin','#C0392B');return;}
  var t=getTracteurSel();if(!t)return;
  _openConfirmDel('Retour de '+t.nom+' ?','La réparation sera archivée dans l\u2019historique.',function(){
    var _rep=REPARATEUR[t.id];
    if(_rep&&_rep.depuis){
      if(!window.REPARATEUR_HIST)window.REPARATEUR_HIST={};
      if(!window.REPARATEUR_HIST[t.id])window.REPARATEUR_HIST[t.id]=[];
      // ★ L'entree d'historique EST la ligne d'achat : c'est ce fait-la, et lui
      //   seul, qui remonte dans Economie > Achats. Une fiche d'entretien
      //   quotidienne (plein, huile, pression) n'est pas un achat et n'y monte
      //   jamais. `eur` reste ABSENT tant que la facture n'est pas arrivee :
      //   absent (a chiffrer) et 0 (sans frais) sont deux etats distincts.
      window.REPARATEUR_HIST[t.id].unshift({
        depuis:_rep.depuis, retour:todayStr(), motif:_rep.motif||'', four:_rep.four||''
      });
      _saveData('reparateur_hist');
    }
    delete REPARATEUR[t.id];
    window.REPARATEUR=REPARATEUR;
    localStorage.removeItem('mavigne_notif_rep_'+t.id);
    _saveData('reparateur');
    renderTracTabs();
    renderRepBanner();
    showToast('Tracteur de retour — réparation archivée','#3D6B27');
  },'','Oui, rentré','#3D6B27');
}

function saveReporter(){
  if(!isAdmin()&&!isTractoriste()){showToast('Réservé aux tractoristes et à l\u2019admin','#C0392B');return;}
  var t=getTracteurSel();if(!t)return;
  var nd=document.getElementById('reporter-date').value;
  if(!nd){showToast('Date requise','#C0392B');return;}
  if(!REPARATEUR[t.id])return;
  REPARATEUR[t.id].prevu_retour=nd;
  window.REPARATEUR=REPARATEUR;
  localStorage.removeItem('mavigne_notif_rep_'+t.id);
  _saveData('reparateur');
  _closeOv(null,'ovReporter');
  renderRepBanner();
  checkRepNotifications();
  showToast('Date de retour mise à jour','#E07B2A');
}

// Ouvrir l'overlay reporter en pré-remplissant la date actuelle

// ════ NOTIFICATIONS RÉPARATEUR ════
// Vérifie au lancement et après chaque modif : veille/jourJ/dépassement (1× chacun)
// _swNotify — centralisé dans utils.js (Patch 3)
function checkRepNotifications(){
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  var today=todayStr();
  TRACTEURS_LIST.forEach(function(t){
    var rep=REPARATEUR[t.id];
    if(!rep||!rep.prevu_retour)return;
    var retour=rep.prevu_retour;
    var veille=addDays(retour,-1);
    var key='mavigne_notif_rep_'+t.id;
    var last=localStorage.getItem(key)||'';
    var nom=t.nom+(t.modele?' ('+t.modele+')':'');
    if(today===veille&&last!=='veille_'+retour){
      _swNotify('Ma Vigne',{body:nom+' — retour prévu demain ('+_fmtDate(retour)+')',icon:'icon-192.png',tag:'rep_veille_'+t.id});
      localStorage.setItem(key,'veille_'+retour);
    } else if(today===retour&&last!=='jour_'+retour){
      _swNotify('Ma Vigne',{body:nom+' — retour prévu aujourd\'hui !',icon:'icon-192.png',tag:'rep_jour_'+t.id});
      localStorage.setItem(key,'jour_'+retour);
    } else if(today>retour&&last!=='depasse_'+retour){
      _swNotify('Ma Vigne',{body:nom+' — retour prévu dépassé ('+_fmtDate(retour)+')',icon:'icon-192.png',tag:'rep_depasse_'+t.id});
      localStorage.setItem(key,'depasse_'+retour);
    }
  });
}

// ════ ENTRETIEN ════

var _entFields=[
  {key:'plein',label:'Plein fait'},
  {key:'huile',label:'Niveau huile'},
  {key:'filtre_air',label:'Filtre à air'},
  {key:'radiateur',label:'Radiateur'},
  {key:'pression_pneu',label:'Pression pneus'},
  {key:'lavage',label:'Lavage'},
];

// ════ LITRES D'UN PLEIN NOTE DANS UNE FICHE D'ENTRETIEN ════
// Deux chemins notent un plein : le bouton « Plein » (qui ecrivait deja
// `litres_plein`) et la case « Plein fait » d'une fiche d'entretien, qui ne
// demandait JAMAIS les litres. Le cout carburant du Pilotage se calcule sur ces
// litres : un plein sans litres n'est pas un detail de saisie, c'est un trou dans
// le calcul. Le champ est donc EXIGE des que la case est cochee, des deux cotes.
// ⚠️ `_entFields` n'est PAS touche : quatre boucles le parcourent en supposant que
//   chaque cle porte un BOOLEEN (grille de resume, checklist, fiche, edition).
//   Les litres vivent A COTE, jamais dedans.
// ⚠️ Les deux overlays vivent dans `index.html`, mais leurs grilles sont peuplees
//   en JS : le champ est INJECTE ici, donc index.html reste intact et le lot ne
//   demande aucun bump de version.
function _pleinWrapId(pfx){ return pfx+'-plein-l-wrap'; }
function _pleinInpId(pfx){ return pfx+'-plein-l'; }
function _pleinBlocEnsure(pfx){
  var grid=document.getElementById(pfx+'-checklist'); if(!grid) return null;
  var w=document.getElementById(_pleinWrapId(pfx));
  if(!w){
    grid.insertAdjacentHTML('afterend',
      '<div id="'+_pleinWrapId(pfx)+'" style="display:none;margin:-2px 0 14px">'
      +'<div class="fl">Litres mis dans le r\u00e9servoir</div>'
      +'<input type="number" class="fi ac" id="'+_pleinInpId(pfx)+'" inputmode="decimal" min="0.1" step="0.1" placeholder="ex. 40">'
      +'<div id="'+pfx+'-plein-l-note" style="font-size:11px;color:var(--texte-doux);margin:6px 2px 0;line-height:1.45"></div>'
      +'</div>');
    w=document.getElementById(_pleinWrapId(pfx));
  }
  return w;
}
function _pleinBlocVal(pfx){
  var e=document.getElementById(_pleinInpId(pfx));
  var v=parseFloat(String((e&&e.value)||'').replace(',','.'));
  return (isFinite(v)&&v>0)?v:0;
}
function _pleinBlocSet(pfx,v){ var e=document.getElementById(_pleinInpId(pfx)); if(e) e.value=(Number(v)>0?v:''); }
// Le champ suit l'etat du bouton « Plein fait » : masque tant qu'il n'est pas coche.
function _pleinBlocSync(pfx){
  var w=_pleinBlocEnsure(pfx); if(!w) return;
  var b=document.getElementById(pfx+'-btn-plein');
  var on=!!(b&&b.classList.contains('checked'));
  w.style.display=on?'':'none';
  var nt=document.getElementById(pfx+'-plein-l-note');
  if(nt){
    var g=(window.CONFIG&&window.CONFIG.gnr)||null;
    nt.textContent=(g&&g.capacite)
      ? ('Cuve GNR : '+_gnrNum(g.niveau)+' / '+_gnrNum(g.capacite)+' L avant ce plein. Ces litres en seront d\u00e9compt\u00e9s.')
      : 'Cuve GNR non renseign\u00e9e \u2014 le plein sera not\u00e9, sans d\u00e9compte de cuve.';
  }
}
// ⚠️ UN SEUL point d'ecriture du niveau de cuve, pour les trois chemins (bouton
// « Plein », fiche d'entretien, correction de fiche). `d` en litres : negatif pour
// un plein qui sort de la cuve, positif pour des litres RENDUS a la cuve quand une
// saisie est corrigee a la baisse ou decochee. Rend le nouveau niveau, ou null si
// aucune cuve n'est renseignee (le plein reste note, il n'est juste pas decompte).
function _gnrCuveDelta(d){
  var cfg=window.CONFIG||{}, g=cfg.gnr;
  if(!g||!g.capacite||!Number(d)) return null;
  var cap=Number(g.capacite)||0;
  var lvl=Math.min(cap,Math.max(0,(Number(g.niveau)||0)+Number(d)));
  g.niveau=lvl; g.maj=_gnrTodayISO(); window.CONFIG=cfg;
  _saveData('config');
  return lvl;
}

function openOvEntretien(){
  if(!isTractoriste()&&!isAdmin()){showToast('Réservé aux tractoristes','#C0392B');return;}
  var t=getTracteurSel();if(!t)return;
  document.getElementById('ov-ent-sub').textContent=t.nom+(t.modele?' — '+t.modele:'');
  document.getElementById('ent-date').value=todayStr();

  // Conducteurs
  var cs=document.getElementById('ent-cond');
  cs.innerHTML=_condList().map(function(c){return '<option>'+_escHtml(c.nom)+'</option>';}).join('');

  // Checklist création
  var grid=document.getElementById('ent-checklist');
  grid.innerHTML=_entFields.map(function(f){
    return '<button class="ent-btn" id="ent-btn-'+f.key+'" onclick="toggleEntBtn(this,\''+f.key+'\')">'
      +'<span style="display:flex;flex-direction:column"><span class="ent-btn-lbl">'+f.label+'</span><span class="ent-btn-sub">Non fait</span></span>'
    +'</button>';
  }).join('');

  // Checklist édition — peupler aussi ef-checklist si pas encore fait
  var efGrid=document.getElementById('ef-checklist');
  if(efGrid&&!efGrid.children.length){
    efGrid.innerHTML=_entFields.map(function(f){
      return '<button class="ent-btn" id="ef-btn-'+f.key+'" onclick="toggleEntBtn(this,\''+f.key+'\')">'
        +'<span style="display:flex;flex-direction:column"><span class="ent-btn-lbl">'+f.label+'</span><span class="ent-btn-sub">Non fait</span></span>'
      +'</button>';
    }).join('');
  }

  // Reset anomalie + case traitée
  document.getElementById('ent-anomalie').value='';
  var wrap=document.getElementById('ent-ano-traitee-wrap');
  if(wrap)wrap.style.display='none';
  var btn=document.getElementById('ent-anomalie-traitee');
  if(btn&&btn.classList.contains('checked'))toggleEntAnoTraitee();

  // Champ litres : pose des l'ouverture, vide, masque tant que « Plein fait »
  // n'est pas coche. `ef-` est prepare ici aussi, comme sa checklist juste au-dessus.
  _pleinBlocEnsure('ent'); _pleinBlocSet('ent',0); _pleinBlocSync('ent');
  _pleinBlocEnsure('ef');

  _openOv('ovEntretien');
}

function toggleEntBtn(el,key){
  el.classList.toggle('checked');
  var sub=el.querySelector('.ent-btn-sub');
  if(el.classList.contains('checked')){sub.textContent='OK';}
  else{sub.textContent='Non fait';}
  // Le champ litres apparait avec la case « Plein fait ». Le prefixe se lit sur
  // l'id du bouton : `ent-btn-plein` (creation) ou `ef-btn-plein` (edition) —
  // cette fonction sert les DEUX overlays, elle ne peut pas supposer lequel.
  if(key==='plein'){ _pleinBlocSync(String(el.id||'').indexOf('ef-')===0?'ef':'ent'); }
}

// ── Préparer et afficher la confirmation avant saveEntretien ──
function confirmEntretien(){
  var t=getTracteurSel();if(!t)return;
  var date=document.getElementById('ent-date').value;
  var cond=document.getElementById('ent-cond').value;
  if(!date||!cond){showToast('Date et conducteur requis','#C0392B');return;}
  var nb=_entFields.filter(function(f){return document.getElementById('ent-btn-'+f.key)?.classList.contains('checked');}).length;
  // Un plein sans litres ne peut pas etre compte. On refuse ICI, avant la modale :
  // c'est le dernier ecran ou le champ est encore visible et corrigeable.
  var _pb=document.getElementById('ent-btn-plein');
  var pleinOn=!!(_pb&&_pb.classList.contains('checked'));
  var pleinL=pleinOn?_pleinBlocVal('ent'):0;
  if(pleinOn&&!(pleinL>0)){
    showToast('Indique les litres mis dans le r\u00e9servoir','#C0392B');
    var _lEl=document.getElementById(_pleinInpId('ent')); if(_lEl&&_lEl.focus)_lEl.focus();
    return;
  }
  var anomalie=document.getElementById('ent-anomalie').value.trim();
  var traitee=document.getElementById('ent-anomalie-traitee')?.classList.contains('checked')||false;
  // Peupler la modal de confirmation
  document.getElementById('ent-conf-date').textContent=_fmtDate(date)+' · '+cond;
  document.getElementById('ent-conf-score').textContent=nb+'/6 points OK'+(pleinL>0?(' \u00b7 plein de '+_gnrNum(pleinL)+' L'):'');
  var anoLine=document.getElementById('ent-conf-ano');
  if(anomalie){
    anoLine.style.display='block';
    anoLine.textContent=traitee?'Anomalie marquée traitée':'Anomalie signalée — non traitée';
    anoLine.style.color=traitee?'var(--vert)':'var(--rouge)';
    anoLine.style.fontWeight='600';
  } else {
    anoLine.style.display='none';
  }
  _openOv('ovConfirmEntretien');
}

function saveEntretien(){
  if(!isTractoriste()&&!isAdmin()){showToast('Réservé aux tractoristes','#C0392B');return;}
  var t=getTracteurSel();if(!t)return;
  var date=document.getElementById('ent-date').value;
  var cond=document.getElementById('ent-cond').value;
  if(!date||!cond){showToast('Date et conducteur requis','#C0392B');return;}
  var anomalie=document.getElementById('ent-anomalie').value.trim();
  var traitee=anomalie?(document.getElementById('ent-anomalie-traitee')?.classList.contains('checked')||false):false;
  var fiche={
    id:'ent'+Date.now(),
    tracteurId:t.id,
    date:date,
    conducteur:cond,
    anomalie:anomalie,
    anomalie_traitee:traitee,
  };
  _entFields.forEach(function(f){
    fiche[f.key]=document.getElementById('ent-btn-'+f.key)?.classList.contains('checked')||false;
  });
  // Litres du plein : meme regle que le bouton « Plein » dedie. La fiche porte le
  // chiffre, la cuve en est decomptee UNE fois. Sans case cochee, aucun champ.
  var _pl=fiche.plein?_pleinBlocVal('ent'):0;
  if(_pl>0) fiche.litres_plein=_pl;
  ENTRETIENS.unshift(fiche);
  window.ENTRETIENS=ENTRETIENS;
  _saveData('entretiens');
  var _nv=(_pl>0)?_gnrCuveDelta(-_pl):null;
  _closeOv(null,'ovConfirmEntretien');
  _closeOv(null,'ovEntretien');
  renderEntretiens();
  showToast('Fiche enregistrée'+(_pl>0?(' \u00b7 -'+_gnrNum(_pl)+' L'+(_nv!=null?(' \u00b7 cuve \u00e0 '+_gnrNum(_nv)+' L'):'')):''),'#3D6B27');
}

// ── Toggle case "Anomalie traitée" dans ovEntretien ──
function toggleEntAnoTraitee(){
  var btn=document.getElementById('ent-anomalie-traitee');
  if(!btn)return;
  var on=btn.classList.toggle('checked');
  var ico=btn.querySelector('.ent-ano-check');
  var lbl=btn.querySelector('.ent-ano-lbl');
  if(on){
    btn.style.borderColor='var(--vert)';btn.style.background='var(--vert-pale)';btn.style.color='var(--vert)';
    if(ico){ico.style.background='var(--vert)';ico.style.borderColor='var(--vert)';ico.textContent='';}
    if(lbl)lbl.textContent='Anomalie traitée';
  } else {
    btn.style.borderColor='rgba(192,57,43,0.4)';btn.style.background='rgba(192,57,43,0.05)';btn.style.color='var(--rouge)';
    if(ico){ico.style.background='transparent';ico.style.borderColor='rgba(192,57,43,0.5)';ico.textContent='';}
    if(lbl)lbl.textContent='Marquer comme traitée';
  }
}

// ── Afficher/masquer la case traitée selon le contenu du textarea ──
function onEntAnomalieInput(){
  var val=document.getElementById('ent-anomalie').value.trim();
  var wrap=document.getElementById('ent-ano-traitee-wrap');
  if(wrap)wrap.style.display=val?'block':'none';
  // Si on efface l'anomalie, décocher
  if(!val){
    var btn=document.getElementById('ent-anomalie-traitee');
    if(btn&&btn.classList.contains('checked'))toggleEntAnoTraitee();
  }
}

// ── Toggle rapide "traitée" depuis la liste des fiches ──
function toggleAnomalieTraitee(id){
  var f=ENTRETIENS.find(function(x){return x.id===id;});
  if(!f)return;
  f.anomalie_traitee=!f.anomalie_traitee;
  window.ENTRETIENS=ENTRETIENS;
  _saveData('entretiens');
  renderEntretiens();
  // Re-render la liste si le modal est ouvert
  var ov=document.getElementById('ovListeFiches');
  if(ov&&ov.classList.contains('open'))renderListeFiches();
  showToast(f.anomalie_traitee?'Anomalie marquée traitée':'Anomalie rouverte','#3D6B27');
}

// ════ CUVE GNR + PROCHAINE RÉVISION (saisie, écriture tractoriste/admin) ════
var _gnrEdit=false, _revEdit=false, _gnrAct='';
function _gnrNum(n){ return (Number(n)||0).toLocaleString('fr-FR'); }
function _gnrTodayISO(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function _gnrField(id,label,val){
  return '<div style="margin-bottom:8px"><div style="font-size:12px;color:var(--texte-doux);margin-bottom:3px">'+label+'</div>'
    +'<input type="number" id="'+id+'" value="'+(val!=null&&val!==''?val:'')+'" min="0" inputmode="numeric" style="width:100%;padding:9px 11px;border:1.5px solid var(--gris);border-radius:9px;font-size:16px;font-family:inherit;background:var(--bg-card);color:var(--texte);box-sizing:border-box"></div>';
}
function _gnrCardHtml(){
  var cfg=window.CONFIG||{}, g=cfg.gnr||null, canEdit=isAdmin()||isTractoriste();
  if(_gnrEdit && canEdit){
    var gg=g||{};
    return '<div class="ent-resume-card" style="margin-bottom:12px">'
      +'<div style="font-size:13px;font-weight:600;color:var(--texte);margin-bottom:10px">'+_mvIcon('carburant',16)+' Cuve GNR \u2014 modifier</div>'
      +_gnrField('gnr-cap','Capacit\u00e9 de la cuve (L)',gg.capacite)
      +_gnrField('gnr-lvl','Litrage restant (L)',gg.niveau)
      +_gnrField('gnr-seuil','Seuil d\u2019alerte (L)',gg.seuil)
      +'<div style="display:flex;gap:8px;margin-top:6px">'
      +'<button onclick="window.saveGnr()" style="flex:1;padding:11px;border:none;border-radius:10px;background:var(--vert-med);color:#fff;font-family:\'Outfit\',sans-serif;font-size:14px;font-weight:600;cursor:pointer;min-height:44px">Enregistrer</button>'
      +'<button onclick="window.cancelGnrEdit()" style="padding:11px 16px;border:1px solid var(--gris);border-radius:10px;background:transparent;color:var(--texte-doux);font-family:\'Outfit\',sans-serif;font-size:14px;cursor:pointer;min-height:44px">Annuler</button>'
      +'</div></div>';
  }
  if(_gnrAct==='appoint' && isAdmin()){
    var ga=g||{}, rest=Number(ga.niveau)||0, cap=Number(ga.capacite)||0;
    var fCss='width:100%;padding:9px 11px;border:1.5px solid var(--gris);border-radius:9px;font-size:16px;font-family:inherit;background:var(--bg-card);color:var(--texte);box-sizing:border-box';
    var lCss='font-size:12px;color:var(--texte-doux);margin-bottom:3px';
    return '<div class="ent-resume-card" style="margin-bottom:12px">'
      +'<div style="font-size:13px;font-weight:600;color:var(--texte);margin-bottom:4px">Appoint de cuve</div>'
      +'<div style="font-size:11px;color:var(--texte-doux);margin-bottom:10px">Livraison ou remplissage de la cuve du domaine. Le prix saisi ici alimente le coût du GNR dans Pilotage › Économie.</div>'
      +'<div style="margin-bottom:8px"><div style="'+lCss+'">Litres livrés</div><input type="number" id="gnr-ap-l" min="1" step="1" inputmode="decimal" placeholder="ex. 500" style="'+fCss+'"></div>'
      +'<div style="margin-bottom:8px"><div style="'+lCss+'">Prix du litre (€/L)</div><input type="number" id="gnr-ap-pu" min="0" step="0.001" inputmode="decimal" placeholder="ex. 1,24" style="'+fCss+'"></div>'
      +'<div style="margin-bottom:8px"><div style="'+lCss+'">Date</div><input type="date" id="gnr-ap-d" value="'+_gnrTodayISO()+'" style="'+fCss+'"></div>'
      +'<div style="margin-bottom:8px"><div style="'+lCss+'">Fournisseur <span style="opacity:.7">(facultatif)</span></div><input type="text" id="gnr-ap-f" placeholder="ex. coopérative" style="'+fCss+'"></div>'
      +'<div style="font-size:11px;color:var(--texte-doux);margin:2px 0 10px">Cuve : '+_gnrNum(rest)+' / '+_gnrNum(cap)+' L avant appoint.</div>'
      +'<div style="display:flex;gap:8px">'
      +'<button onclick="window.saveGnrAppoint()" style="flex:1;padding:11px;border:none;border-radius:10px;background:var(--vert-med);color:#fff;font-family:\'Outfit\',sans-serif;font-size:14px;font-weight:600;cursor:pointer;min-height:44px">Enregistrer l’appoint</button>'
      +'<button onclick="window.cancelGnrAct()" style="padding:11px 16px;border:1px solid var(--gris);border-radius:10px;background:transparent;color:var(--texte-doux);font-family:\'Outfit\',sans-serif;font-size:14px;cursor:pointer;min-height:44px">Annuler</button>'
      +'</div></div>';
  }
  if(_gnrAct==='corr' && canEdit){
    var gc=g||{};
    return '<div class="ent-resume-card" style="margin-bottom:12px">'
      +'<div style="font-size:13px;font-weight:600;color:var(--texte);margin-bottom:4px">Corriger le niveau</div>'
      +'<div style="font-size:11px;color:var(--texte-doux);margin-bottom:10px">À utiliser si un plein n\'a pas été noté.</div>'
      +_gnrField('gnr-corr','Litrage restant réel (L)',gc.niveau)
      +'<div style="display:flex;gap:8px;margin-top:6px">'
      +'<button onclick="window.saveGnrCorr()" style="flex:1;padding:11px;border:none;border-radius:10px;background:var(--vert-med);color:#fff;font-family:\'Outfit\',sans-serif;font-size:14px;font-weight:600;cursor:pointer;min-height:44px">Enregistrer</button>'
      +'<button onclick="window.cancelGnrAct()" style="padding:11px 16px;border:1px solid var(--gris);border-radius:10px;background:transparent;color:var(--texte-doux);font-family:\'Outfit\',sans-serif;font-size:14px;cursor:pointer;min-height:44px">Annuler</button>'
      +'</div></div>';
  }
  if(!g||!g.capacite){
    return '<div class="ent-resume-card" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:10px">'
      +'<div><div style="font-size:13px;font-weight:600;color:var(--texte)">'+_mvIcon('carburant',16)+' Cuve GNR</div><div style="font-size:11px;color:var(--texte-doux);margin-top:2px">Non renseign\u00e9e</div></div>'
      +(canEdit?'<button onclick="window.openGnrEdit()" style="padding:8px 14px;border:1px solid var(--acier);border-radius:8px;background:transparent;color:var(--acier);font-family:\'Outfit\',sans-serif;font-size:12px;font-weight:600;cursor:pointer;min-height:44px">Renseigner</button>':'')
      +'</div>';
  }
  var pc=Math.round((Number(g.niveau)||0)/(Number(g.capacite)||1)*100), low=(Number(g.niveau)||0)<=(Number(g.seuil)||0);
  var col=low?'var(--rouge)':pc<40?'var(--orange)':'var(--vert-med)';
  return '<div class="ent-resume-card" style="margin-bottom:12px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;gap:10px">'
      +'<div><div style="font-size:13px;font-weight:600;color:var(--texte)">'+_mvIcon('carburant',16)+' Cuve GNR'+(low?' <span style="color:var(--rouge);font-weight:700">'+_mvIcon('alerte',16)+' bas</span>':'')+'</div>'
      +'<div style="font-size:11px;color:var(--texte-doux);margin-top:2px">'+_gnrNum(g.niveau)+' / '+_gnrNum(g.capacite)+' L \u00b7 '+pc+' %'+(g.maj?(' \u00b7 maj '+_fmtDate(g.maj)):'')+'</div></div>'
      +(canEdit?'<button onclick="window.openGnrEdit()" style="padding:8px 12px;border:1px solid var(--gris);border-radius:8px;background:transparent;color:var(--texte-doux);font-family:\'Outfit\',sans-serif;font-size:13px;cursor:pointer;min-width:44px;min-height:44px">'+_mvIcon('crayon',18)+'</button>':'')
    +'</div>'
    +'<div style="height:8px;border-radius:5px;background:var(--gris-clair);overflow:hidden;margin-top:9px"><i style="display:block;height:100%;width:'+Math.min(pc,100)+'%;background:'+col+'"></i></div>'
    +(isAdmin()?_gnrPrixLigne():'')
    +(canEdit?'<div style="display:flex;gap:8px;margin-top:11px">'
      +(isAdmin()?'<button onclick="window.openGnrAppoint()" style="flex:1;padding:9px;border:1px solid var(--vert-med);border-radius:9px;background:transparent;color:var(--vert-med);font-family:\'Outfit\',sans-serif;font-size:12.5px;font-weight:600;cursor:pointer;min-height:44px">Appoint de cuve</button>':'')
      +'<button onclick="window.openGnrCorr()" style="flex:1;padding:9px;border:1px solid var(--gris);border-radius:9px;background:transparent;color:var(--texte-doux);font-family:\'Outfit\',sans-serif;font-size:12.5px;font-weight:600;cursor:pointer;min-height:44px">Corriger le niveau</button>'
    +'</div>':'')
  +'</div>';
}
function _revCardHtml(t){
  if(!t) return '';
  var canEdit=isAdmin()||isTractoriste(), comp=t.compteur_h, rev=t.revision_h;
  if(_revEdit && canEdit){
    return '<div class="ent-resume-card" style="margin-bottom:12px">'
      +'<div style="font-size:13px;font-weight:600;color:var(--texte);margin-bottom:10px">'+_mvIcon('engrenage',16)+' '+_escHtml(t.nom)+' \u2014 prochaine r\u00e9vision</div>'
      +_gnrField('rev-comp','Compteur actuel (h)',comp)
      +_gnrField('rev-target','Prochaine r\u00e9vision \u00e0 (h)',rev)
      +'<div style="display:flex;gap:8px;margin-top:6px">'
      +'<button onclick="window.saveRev()" style="flex:1;padding:11px;border:none;border-radius:10px;background:var(--vert-med);color:#fff;font-family:\'Outfit\',sans-serif;font-size:14px;font-weight:600;cursor:pointer;min-height:44px">Enregistrer</button>'
      +'<button onclick="window.cancelRevEdit()" style="padding:11px 16px;border:1px solid var(--gris);border-radius:10px;background:transparent;color:var(--texte-doux);font-family:\'Outfit\',sans-serif;font-size:14px;cursor:pointer;min-height:44px">Annuler</button>'
      +'</div></div>';
  }
  var hasComp=(comp!=null&&comp!==''&&rev!=null&&rev!=='');
  var sub, col='var(--texte-doux)', fw='400';
  if(hasComp){ var reste=Number(rev)-Number(comp); col=reste<=50?'var(--rouge)':reste<=120?'var(--orange)':'var(--vert-med)'; fw='600'; sub='R\u00e9vision dans '+_gnrNum(reste)+' h \u00b7 '+_gnrNum(comp)+'/'+_gnrNum(rev)+' h'; }
  else { sub='\u00c0 renseigner'; }
  return '<div class="ent-resume-card" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:10px">'
    +'<div><div style="font-size:13px;font-weight:600;color:var(--texte)">'+_mvIcon('engrenage',16)+' Prochaine r\u00e9vision</div>'
    +'<div style="font-size:11px;color:'+col+';font-weight:'+fw+';margin-top:2px">'+sub+'</div></div>'
    +(canEdit?'<button onclick="window.openRevEdit()" style="padding:8px 12px;border:1px solid var(--gris);border-radius:8px;background:transparent;color:var(--texte-doux);font-family:\'Outfit\',sans-serif;font-size:13px;cursor:pointer;min-width:44px;min-height:44px">'+_mvIcon('crayon',18)+'</button>':'')
  +'</div>';
}
// ════ APPOINT DE CUVE (admin uniquement) ════
// Le PRIX du GNR se saisit ici, au moment où l'information existe (la facture), et non
// plus comme un paramètre abstrait dans Réglages. Les appoints vivent dans la collection
// `paie` (admin-only en LECTURE comme en écriture) et non dans CONFIG.gnr, que les
// tractoristes peuvent écrire par les rules — un prix d'achat n'a pas à y être exposé.
// Le NIVEAU, lui, reste dans CONFIG.gnr : le plein tracteur doit pouvoir le décompter.
function _gnrPaie(){ return (window._mvPaie?window._mvPaie():null); }
function _gnrEur(n){ return (Math.round((Number(n)||0)*1000)/1000).toLocaleString('fr-FR',{minimumFractionDigits:0,maximumFractionDigits:3}); }
function _gnrPrixLigne(){
  var P=_gnrPaie(); if(!P) return '';
  var ap=(P.gnr_appoints||[]).filter(function(a){return a&&Number(a.l)>0;});
  var pmp=(window._mvPaieGnrPMP?window._mvPaieGnrPMP():0);
  if(!ap.length && !(pmp>0)) return '<div style="font-size:11px;color:var(--texte-doux);margin-top:9px">Prix du GNR non renseign\u00e9 \u2014 il se saisit au prochain appoint.</div>';
  var last=ap.slice().sort(function(a,b){return String(a.d||'').localeCompare(String(b.d||''));}).pop();
  var t='';
  if(last) t+='Dernier appoint : '+_gnrNum(last.l)+' L'+(Number(last.pu)>0?(' \u00e0 '+_gnrEur(last.pu)+' \u20AC/L'):'')+(last.d?(' \u00b7 '+_fmtDate(last.d)):'');
  if(pmp>0) t+=(t?' \u00b7 ':'')+'moyenne '+_gnrEur(pmp)+' \u20AC/L';
  return '<div style="font-size:11px;color:var(--texte-doux);margin-top:9px">'+_escHtml(t)+'</div>';
}
function openGnrAppoint(){
  if(!isAdmin()){showToast('R\u00e9serv\u00e9 \u00e0 l\u2019admin','#C0392B');return;}
  var cfg=window.CONFIG||{};
  if(!cfg.gnr||!cfg.gnr.capacite){showToast('Renseigne d\u2019abord la cuve GNR','#C0392B');return;}
  _gnrAct='appoint'; _gnrEdit=false; _revEdit=false; renderEntretiens();
  var e=document.getElementById('gnr-ap-l'); if(e)setTimeout(function(){e.focus();},80);
}
function saveGnrAppoint(){
  if(!isAdmin()){showToast('R\u00e9serv\u00e9 \u00e0 l\u2019admin','#C0392B');return;}
  var cfg=window.CONFIG||{}, g=cfg.gnr;
  if(!g||!g.capacite){showToast('Renseigne d\u2019abord la cuve GNR','#C0392B');return;}
  var P=_gnrPaie(); if(!P){showToast('Module indisponible','#C0392B');return;}
  function _n(id){ var el=document.getElementById(id); var v=parseFloat(String(el&&el.value||'').replace(',','.')); return isFinite(v)?v:0; }
  var l=_n('gnr-ap-l'), pu=_n('gnr-ap-pu');
  if(!(l>0)){showToast('Indique les litres livr\u00e9s','#C0392B');return;}
  var dEl=document.getElementById('gnr-ap-d'), fEl=document.getElementById('gnr-ap-f');
  var d=(dEl&&dEl.value)||_gnrTodayISO(), f=((fEl&&fEl.value)||'').trim().slice(0,60);
  // 1) Cuve : le niveau remonte, plafonn\u00e9 \u00e0 la capacit\u00e9 (une saisie \u00e0 c\u00f4t\u00e9 ne cr\u00e9e pas
  //    une cuve impossible ; le d\u00e9passement est signal\u00e9 dans le toast).
  var cap=Number(g.capacite)||0, av=Number(g.niveau)||0, nv=Math.min(cap, av+l), deb=(av+l)>cap;
  g.niveau=nv; g.maj=d; window.CONFIG=cfg;
  // 2) Historique + prix : collection `paie`
  P.gnr_appoints.push({ id:'ap'+Date.now(), d:d, l:l, pu:(pu>0?pu:null), f:f||null, par:((window.currentUser&&window.currentUser.nom)||'') });
  if(P.gnr_appoints.length>400) P.gnr_appoints=P.gnr_appoints.slice(-400);
  window.PAIE=P;
  var _sv=window.fbSaveToast({paie:P});
  _saveData('config');
  _gnrAct=''; renderEntretiens();
  window.fbToastApres(_sv,'Appoint not\u00e9 \u00b7 +'+_gnrNum(l)+' L \u00b7 cuve \u00e0 '+_gnrNum(nv)+' L'+(deb?' \u00b7 plafonn\u00e9e':'')+(pu>0?'':' \u00b7 sans prix'), deb?'#B85A1A':'#3D6B27');
}
function openGnrEdit(){ if(!isAdmin()&&!isTractoriste()){showToast('R\u00e9serv\u00e9 aux tractoristes et \u00e0 l\u2019admin','#C0392B');return;} _gnrEdit=true; _revEdit=false; _gnrAct=''; renderEntretiens(); }
function cancelGnrEdit(){ _gnrEdit=false; renderEntretiens(); }
function saveGnr(){
  if(!isAdmin()&&!isTractoriste()){showToast('R\u00e9serv\u00e9 aux tractoristes et \u00e0 l\u2019admin','#C0392B');return;}
  var capEl=document.getElementById('gnr-cap'), lvlEl=document.getElementById('gnr-lvl'), seuilEl=document.getElementById('gnr-seuil');
  var cap=parseFloat(capEl&&capEl.value)||0, lvl=parseFloat(lvlEl&&lvlEl.value)||0, seuil=parseFloat(seuilEl&&seuilEl.value)||0;
  if(cap<=0){showToast('Capacit\u00e9 requise','#C0392B');return;}
  if(lvl>cap)lvl=cap; if(lvl<0)lvl=0; if(seuil<0)seuil=0;
  var cfg=window.CONFIG||{}; cfg.gnr={capacite:cap,niveau:lvl,seuil:seuil,maj:_gnrTodayISO()}; window.CONFIG=cfg;
  _saveData('config');
  _gnrEdit=false; renderEntretiens();
  showToast('Cuve GNR mise \u00e0 jour','#3D6B27');
}
function openRevEdit(){ if(!isAdmin()&&!isTractoriste()){showToast('R\u00e9serv\u00e9 aux tractoristes et \u00e0 l\u2019admin','#C0392B');return;} _revEdit=true; _gnrEdit=false; _gnrAct=''; renderEntretiens(); }
function cancelRevEdit(){ _revEdit=false; renderEntretiens(); }
function saveRev(){
  if(!isAdmin()&&!isTractoriste()){showToast('R\u00e9serv\u00e9 aux tractoristes et \u00e0 l\u2019admin','#C0392B');return;}
  var t=_tracSelId?getTracteurSel():null; if(!t){_revEdit=false;renderEntretiens();return;}
  var compEl=document.getElementById('rev-comp'), revEl=document.getElementById('rev-target');
  var compV=compEl?compEl.value:'', revV=revEl?revEl.value:'';
  t.compteur_h = compV===''?'':(parseFloat(compV)||0);
  t.revision_h = revV===''?'':(parseFloat(revV)||0);
  window.TRACTEURS_LIST=TRACTEURS_LIST;
  _saveData('tracteurs_list');
  _revEdit=false; renderEntretiens();
  showToast('Prochaine r\u00e9vision mise \u00e0 jour','#3D6B27');
}

function openPlein(){
  if(!isAdmin()&&!isTractoriste()){showToast('Réservé aux tractoristes et à l’admin','#C0392B');return;}
  var t=_tracSelId?getTracteurSel():null;
  var cfg=window.CONFIG||{}, g=cfg.gnr;
  var sub=document.getElementById('plein-sub'); if(sub)sub.textContent=t?(t.nom+(t.modele?' — '+t.modele:'')):'Réservoir';
  var who=(currentUser&&currentUser.nom)||'';
  var cuveTxt=(g&&g.capacite)?('Cuve GNR : '+_gnrNum(g.niveau)+' / '+_gnrNum(g.capacite)+' L restants'):'Cuve GNR non renseignée';
  var info=document.getElementById('plein-cuve-info'); if(info)info.innerHTML=cuveTxt+'<br>Enregistre une fiche « Plein fait » ce jour'+(who?(' au nom de '+_escHtml(who)):'');
  var inp=document.getElementById('plein-litres'); if(inp)inp.value='';
  _openOv('ovPlein');
  if(inp)setTimeout(function(){inp.focus();},100);
}
function openGnrCorr(){ if(!isAdmin()&&!isTractoriste()){showToast('Réservé aux tractoristes et à l’admin','#C0392B');return;} _gnrAct='corr'; _gnrEdit=false; _revEdit=false; renderEntretiens(); var _e=document.getElementById('gnr-corr'); if(_e)_e.focus(); }
function cancelGnrAct(){ _gnrAct=''; renderEntretiens(); }
function savePleinFiche(){
  if(!isAdmin()&&!isTractoriste()){showToast('Réservé aux tractoristes et à l’admin','#C0392B');return;}
  var cfg=window.CONFIG||{}, g=cfg.gnr;
  if(!g||!g.capacite){showToast('Renseigne d’abord la cuve GNR','#C0392B');return;}
  var t=_tracSelId?getTracteurSel():null; if(!t){showToast('Sélectionne un tracteur','#C0392B');return;}
  var inp=document.getElementById('plein-litres'); var n=parseFloat(inp&&inp.value)||0;
  if(n<=0){showToast('Indique les litres mis dans le réservoir','#C0392B');return;}
  // 1) Cuve : decompte du plein — par _gnrCuveDelta, seul point d'ecriture du
  //    niveau. Le repli couvre le cas « pas de cuve » (deja refuse plus haut).
  var lvl=_gnrCuveDelta(-n); if(lvl==null) lvl=Number(g.niveau)||0;
  // 2) Fiche d'entretien auto : « Plein fait » coché, date du jour, au nom du conducteur courant
  var cond=(currentUser&&currentUser.nom)||(_condList()[0]&&_condList()[0].nom)||'';
  var fiche={ id:'ent'+Date.now(), tracteurId:t.id, date:todayStr(), conducteur:cond, anomalie:'', anomalie_traitee:false, litres_plein:n };
  _entFields.forEach(function(f){ fiche[f.key]=(f.key==='plein'); });
  ENTRETIENS.unshift(fiche); window.ENTRETIENS=ENTRETIENS;
  // 3) Sauvegardes
  _saveData('entretiens');
  _closeOv(null,'ovPlein'); renderEntretiens();
  var bas=(lvl<=(Number(g.seuil)||0));
  showToast('Plein noté · -'+_gnrNum(n)+' L · cuve à '+_gnrNum(lvl)+' L'+(bas?' · bas':''), bas?'#C0392B':'#3D6B27');
}
function saveGnrCorr(){
  if(!isAdmin()&&!isTractoriste()){showToast('Réservé aux tractoristes et à l’admin','#C0392B');return;}
  var cfg=window.CONFIG||{}, g=cfg.gnr; if(!g||!g.capacite){_gnrAct='';renderEntretiens();return;}
  var el=document.getElementById('gnr-corr'); var v=parseFloat(el&&el.value);
  if(isNaN(v)||v<0){showToast('Indique le litrage restant','#C0392B');return;}
  var cap=Number(g.capacite)||0; if(v>cap)v=cap;
  g.niveau=v; g.maj=_gnrTodayISO(); window.CONFIG=cfg;
  _saveData('config'); _gnrAct=''; renderEntretiens();
  var bas=(v<=(Number(g.seuil)||0));
  showToast('Cuve corrigée · '+_gnrNum(v)+' L'+(bas?' · bas':''), bas?'#C0392B':'#3D6B27');
}

// ── Encart résumé compact (remplace l'ancienne liste inline) ──
function renderEntretiens(){
  var el=document.getElementById('entretiens-list');
  if(!el)return;
  // Si pas de tracteur sélectionné → afficher résumé global de tous
  var t=_tracSelId?getTracteurSel():null;
  var fiches=_tracSelId
    ? ENTRETIENS.filter(function(f){return f.tracteurId===t.id;}).sort(function(a,b){return b.date.localeCompare(a.date);})
    : [...ENTRETIENS].sort(function(a,b){return b.date.localeCompare(a.date);});

  // Bouton réparateur : afficher si tracteur sélectionné et pas en répar
  var repBtn=document.getElementById('ent-rep-btn');
  if(repBtn){
    var showRep=t&&!REPARATEUR[t.id]&&(isAdmin()||isTractoriste());
    repBtn.style.display=showRep?'':'none';
  }
  var pleinBtn=document.getElementById('ent-plein-btn');
  if(pleinBtn){ pleinBtn.style.display=(t&&(isAdmin()||isTractoriste()))?'':'none'; }

  // Dernière date par champ
  var lastDates={};
  _entFields.forEach(function(fi){
    var match=fiches.find(function(f){return f[fi.key];});
    lastDates[fi.key]=match?match.date:null;
  });

  // Anomalies non traitées
  var anomActives=fiches.filter(function(f){return f.anomalie&&!f.anomalie_traitee;});
  var hasAnoActive=anomActives.length>0;

  if(!fiches.length){
    el.innerHTML=(_gnrCardHtml()+_revCardHtml(t))+'<div class="empty-state" style="padding:32px 20px"><div class="ei">'+_mvIcon('outil',40)+'</div><div class="et">Aucune fiche d\'entretien</div><div class="ed">Ajoutez une fiche avec le bouton ＋ pour commencer le suivi.</div></div>';
    return;
  }

  // Grille 6 cellules
  var gridHtml=_entFields.map(function(fi,i){
    var d=lastDates[fi.key];
    var ok=!!d;
    return '<div class="ent-resume-cell">'
      +'<div>'
        +'<div style="font-size:11px;color:var(--texte-doux);line-height:1.2">'+fi.label+'</div>'
        +'<div style="font-size:12px;font-weight:600;color:'+(ok?'var(--vert)':'var(--rouge)')+';margin-top:1px">'+(ok?_fmtDate(d):'Jamais')+'</div>'
      +'</div></div>';
  }).join('');

  // Bandeau anomalies actives
  var anoBanner='';
  if(hasAnoActive){
    var rows=anomActives.map(function(f){
      return '<div class="ent-ano-row">'
        +'<div style="font-size:12px;color:var(--texte);flex:1">'+f.anomalie+'</div>'
        +'<div style="font-size:11px;color:var(--texte-doux);white-space:nowrap">'+_fmtDate(f.date)+' · '+f.conducteur+'</div>'
      +'</div>';
    }).join('');
    anoBanner='<div class="ent-ano-banner">'
      +'<div style="font-size:11px;font-weight:700;color:var(--rouge);margin-bottom:6px">Anomalie'+(anomActives.length>1?'s':'')+' en attente de traitement</div>'
      +rows
      +'<div style="font-size:10px;color:var(--texte-doux);margin-top:6px">Ouvrez les fiches pour marquer comme traitée →</div>'
    +'</div>';
  }

  var nbF=fiches.length;
  var nbAnoText=hasAnoActive?('<span style="margin-left:8px;color:var(--rouge);font-weight:700">'+anomActives.length+' non traitée'+(anomActives.length>1?'s':'')+'</span>'):'';

  el.innerHTML=(_gnrCardHtml()+_revCardHtml(t))+'<div class="ent-resume-card'+(hasAnoActive?' has-ano-active':'')+'">'
    +'<div class="ent-resume-hd">'
      +'<div>'
        +'<div style="font-size:13px;font-weight:600;color:var(--texte)">Derniers contrôles</div>'
        +'<div style="font-size:11px;color:var(--texte-doux);margin-top:2px">'+nbF+' fiche'+(nbF>1?'s':'')+nbAnoText+'</div>'
      +'</div>'
      +'<button onclick="openListeFiches()" style="padding:6px 12px;border-radius:8px;border:1.5px solid var(--acier);background:transparent;color:var(--acier);font-size:12px;font-weight:600;font-family:\'Outfit\',sans-serif;cursor:pointer;min-height:44px">Voir tout →</button>'
    +'</div>'
    +'<div class="ent-resume-grid">'+gridHtml+'</div>'
    +anoBanner
  +'</div>';
}

// ── Ouvrir le modal liste des fiches ──
function openListeFiches(){
  renderListeFiches();
  _openOv('ovListeFiches');
}

// ── Rendre la liste des fiches dans le modal ──
function renderListeFiches(){
  var el=document.getElementById('ov-liste-fiches-body');
  if(!el)return;
  var t=getTracteurSel();
  if(!t){el.innerHTML='';return;}
  var fiches=ENTRETIENS.filter(function(f){return f.tracteurId===t.id;}).sort(function(a,b){return b.date.localeCompare(a.date);});
  var admin=isAdmin();

  if(!fiches.length){
    el.innerHTML='<div class="empty-state" style="padding:32px 20px"><div class="ei">'+_mvIcon('outil',40)+'</div><div class="et">Aucune fiche</div><div class="ed">Aucun entretien enregistré pour ce tracteur.</div></div>';
    return;
  }

  el.innerHTML=fiches.map(function(f){
    var nb=_entFields.filter(function(ef){return f[ef.key];}).length;
    var pct=Math.round(nb/6*100);
    var scoreColor=pct===100?'var(--vert)':pct>=50?'var(--orange)':'var(--rouge)';
    var hasAno=!!f.anomalie;
    var traitee=f.anomalie_traitee||false;
    var cardCls='fiche-card'+(hasAno&&!traitee?' has-ano':hasAno&&traitee?' ano-traitee':'');

    // Checklist en grille 3 colonnes
    var checkHtml=_entFields.map(function(ef){
      // Les litres etaient ecrits en base et affiches NULLE PART. Ils se lisent ici,
      // a cote du point de controle qu'ils chiffrent.
      var _lp=(ef.key==='plein'&&Number(f.litres_plein)>0)?(' \u2014 '+_gnrNum(f.litres_plein)+' L'):'';
      return '<div class="fiche-item"><span style="display:inline-flex;color:'+(f[ef.key]?'var(--vert-med)':'var(--rouge)')+'">'+_mvIcon(f[ef.key]?'check':'croix',16)+'</span>'
        +'<span style="color:'+(f[ef.key]?'var(--texte)':'var(--texte-doux)')+'">'+ef.label+_lp+'</span></div>';
    }).join('');

    // Boutons admin
    var adminHtml=admin?'<div class="fiche-admin-btns">'
      +'<button class="mv-gh fiche-admin-btn" data-id="'+f.id+'" onclick="openOvEditFiche(\''+f.id+'\')" title="Modifier" aria-label="Modifier">'+_mvIcon('crayon',18)+'</button>'
      +'<button class="mv-gh mv-gh-rouge fiche-admin-btn del" data-id="'+f.id+'" onclick="deleteFiche(\''+f.id+'\')" title="Supprimer" aria-label="Supprimer">'+_mvIcon('corbeille',18)+'</button>'
    +'</div>':'';

    // Bloc anomalie
    var anoHtml='';
    if(hasAno){
      var toggleLabel=traitee?'Anomalie traitée — appuyer pour annuler':'Marquer comme traitée';
      var toggleCls=traitee?'fiche-ano-toggle traite':'fiche-ano-toggle non-traite';
      anoHtml='<div class="fiche-ano-bloc">'
        +'<div style="font-size:12px;color:var(--texte);display:flex;gap:6px;align-items:flex-start;margin-bottom:8px">'
          +_mvBadge(traitee?'Traitée':'Anomalie', traitee?'vert':'rouge')+'<span>'+_escHtml(f.anomalie)+'</span>'
        +'</div>'
        +'<button class="'+toggleCls+'" onclick="toggleAnomalieTraitee(\''+f.id+'\')">'+toggleLabel+'</button>'
      +'</div>';
    }

    return '<div class="'+cardCls+'">'
      +'<div class="fiche-hd">'
        +'<div style="flex:1">'
          +'<div style="font-weight:700;font-size:13px">'+_fmtDate(f.date)+' · '+_escHtml(f.conducteur)+'</div>'
        +'</div>'
        +'<div style="display:flex;align-items:center;gap:8px">'
          +'<div class="fiche-score" style="color:'+scoreColor+'">'+nb+'/6</div>'
          +adminHtml
        +'</div>'
      +'</div>'
      +'<div class="fiche-grid'+(hasAno?'':' no-border')+'">'+checkHtml+'</div>'
      +anoHtml
    +'</div>';
  }).join('');

  // Mettre à jour le compteur
  var cpt=document.getElementById('ov-liste-fiches-count');
  if(cpt)cpt.textContent=fiches.length+' fiche'+(fiches.length>1?'s':'');
}

// ── Supprimer une fiche (admin) ──
function deleteFiche(id){
  if(!isAdmin())return;
  _openConfirmDel('Supprimer cette fiche ?','Cette action est irréversible.',function(){
    ENTRETIENS=ENTRETIENS.filter(function(f){return f.id!==id;});
    window.ENTRETIENS=ENTRETIENS;
    _saveData('entretiens');
    renderListeFiches();
    renderEntretiens();
    showToast('Fiche supprimée','#C0392B');
  });
}

// ── Ouvrir l'overlay édition d'une fiche existante (admin) ──
function openOvEditFiche(id){
  if(!isAdmin())return;
  var f=ENTRETIENS.find(function(x){return x.id===id;});
  if(!f)return;
  document.getElementById('ef-id').value=id;
  document.getElementById('ef-date').value=f.date;
  var cs=document.getElementById('ef-cond');
  cs.innerHTML=_condList().map(function(c){return '<option'+(c.nom===f.conducteur?' selected':'')+'>'+_escHtml(c.nom)+'</option>';}).join('');
  // Checklist
  _pleinBlocEnsure('ef');
  _pleinBlocSet('ef',Number(f.litres_plein)||0);
  _entFields.forEach(function(fi){
    var btn=document.getElementById('ef-btn-'+fi.key);
    if(!btn)return;
    var sub=btn.querySelector('.ent-btn-sub');
    if(f[fi.key]){btn.classList.add('checked');if(sub)sub.textContent='OK';}
    else{btn.classList.remove('checked');if(sub)sub.textContent='Non fait';}
  });
  // Anomalie
  var anoEl=document.getElementById('ef-anomalie');
  if(anoEl)anoEl.value=f.anomalie||'';
  var wrap=document.getElementById('ef-ano-traitee-wrap');
  if(wrap)wrap.style.display=f.anomalie?'block':'none';
  // Case traitée
  var btn=document.getElementById('ef-anomalie-traitee');
  if(btn){
    if(f.anomalie_traitee){if(!btn.classList.contains('checked'))toggleEfAnoTraitee();}
    else{if(btn.classList.contains('checked'))toggleEfAnoTraitee();}
  }
  // Fermer la liste et ouvrir édition
  // Apres la boucle : les boutons portent leur etat, le champ peut se caler dessus.
  _pleinBlocSync('ef');
  _closeOv(null,'ovListeFiches');
  _openOv('ovEditFiche');
}

function toggleEfAnoTraitee(){
  var btn=document.getElementById('ef-anomalie-traitee');
  if(!btn)return;
  var on=btn.classList.toggle('checked');
  var ico=btn.querySelector('.ent-ano-check');
  var lbl=btn.querySelector('.ent-ano-lbl');
  if(on){
    btn.style.borderColor='var(--vert)';btn.style.background='var(--vert-pale)';btn.style.color='var(--vert)';
    if(ico){ico.style.background='var(--vert)';ico.style.borderColor='var(--vert)';ico.textContent='';}
    if(lbl)lbl.textContent='Anomalie traitée';
  } else {
    btn.style.borderColor='rgba(192,57,43,0.4)';btn.style.background='rgba(192,57,43,0.05)';btn.style.color='var(--rouge)';
    if(ico){ico.style.background='transparent';ico.style.borderColor='rgba(192,57,43,0.5)';ico.textContent='';}
    if(lbl)lbl.textContent='Marquer comme traitée';
  }
}

function onEfAnomalieInput(){
  var val=document.getElementById('ef-anomalie').value.trim();
  var wrap=document.getElementById('ef-ano-traitee-wrap');
  if(wrap)wrap.style.display=val?'block':'none';
  if(!val){
    var btn=document.getElementById('ef-anomalie-traitee');
    if(btn&&btn.classList.contains('checked'))toggleEfAnoTraitee();
  }
}

function saveEditFiche(){
  var id=document.getElementById('ef-id').value;
  var f=ENTRETIENS.find(function(x){return x.id===id;});
  if(!f)return;
  // ⚠️ La validation passe AVANT la premiere ecriture sur `f` : un refus a
  //   mi-parcours laisserait la fiche a moitie modifiee en memoire, sauvee ou
  //   non au prochain _saveData d'un autre chemin.
  var _efPb=document.getElementById('ef-btn-plein');
  var _efPleinOn=!!(_efPb&&_efPb.classList.contains('checked'));
  var _ap=_efPleinOn?_pleinBlocVal('ef'):0;
  if(_efPleinOn&&!(_ap>0)){
    showToast('Indique les litres mis dans le r\u00e9servoir','#C0392B');
    var _eEl=document.getElementById(_pleinInpId('ef')); if(_eEl&&_eEl.focus)_eEl.focus();
    return;
  }
  // Litres deja portes par la fiche, AVANT modification : sert au delta de cuve.
  var _av=(f.plein&&Number(f.litres_plein)>0)?Number(f.litres_plein):0;
  f.date=document.getElementById('ef-date').value;
  f.conducteur=document.getElementById('ef-cond').value;
  var anomalie=document.getElementById('ef-anomalie').value.trim();
  f.anomalie=anomalie;
  f.anomalie_traitee=anomalie?(document.getElementById('ef-anomalie-traitee')?.classList.contains('checked')||false):false;
  _entFields.forEach(function(fi){
    f[fi.key]=document.getElementById('ef-btn-'+fi.key)?.classList.contains('checked')||false;
  });
  // Corriger a la baisse ou decocher « Plein fait » REND les litres a la cuve.
  // Sans ce delta, une faute de frappe laisserait le niveau faux pour toujours.
  if(_ap>0) f.litres_plein=_ap; else delete f.litres_plein;
  if(_av!==_ap) _gnrCuveDelta(_av-_ap);
  window.ENTRETIENS=ENTRETIENS;
  _saveData('entretiens');
  _closeOv(null,'ovEditFiche');
  renderEntretiens();
  // Rouvrir la liste
  renderListeFiches();
  _openOv('ovListeFiches');
  showToast('Fiche modifiée','#3D6B27');
}

// ════ GESTION DU PARC TRACTEURS (Réglages) ════

function renderTracteurSet(){
  var el=document.getElementById('tracteurs-set-list');
  if(!el)return;
  // Masquer la section si non admin
  var sec=document.getElementById('set-sec-tracteurs');
  if(sec)sec.style.display=isAdmin()?'block':'none';
  if(!isAdmin())return;
  el.innerHTML=TRACTEURS_LIST.map(function(t){
    var enR=REPARATEUR[t.id];
    var dot='<div class="trac-set-dot" style="background:'+couleurTracType(t.type)+'"></div>';
    var badges='';
    if(t.traitementOnly)badges+='<span style="font-size:9px;background:var(--orange-pale);color:var(--orange);border-radius:5px;padding:1px 6px;margin-left:4px">Traitement</span>';
    if(enR)badges+='<span style="font-size:9px;background:var(--rouge-pale);color:var(--rouge);border-radius:5px;padding:1px 6px;margin-left:4px">En réparation</span>';
    return '<div class="trac-set-card"><div style="display:flex;align-items:center;gap:12px">'+dot
      +'<div><div style="display:flex;align-items:center;gap:4px"><span style="font-weight:700;font-size:14px">'+_escHtml(t.nom)+'</span>'+badges+'</div>'
      +'<div style="font-size:12px;color:var(--texte-doux);margin-top:2px">'+_escHtml(t.modele||'—')+'</div>'
      +'<div style="font-size:11px;color:'+couleurTracType(t.type)+';margin-top:2px">'+_escHtml(t.type)+'</div>'
    +'</div></div>'
    +'<button class="mv-gh" onclick="openEditTracteur(\''+t.id+'\')" title="Modifier" aria-label="Modifier">'+_mvIcon('crayon',18)+'</button>'
    +'</div>';
  }).join('');
}

function pickTracType(type){
  document.getElementById('at-type').value=type;
  var meca=document.getElementById('at-btn-meca');
  var hydro=document.getElementById('at-btn-hydro');
  var wrap=document.getElementById('at-trait-wrap');
  meca.className='trac-type-btn'+(type==='mécanique'?' sel-meca':'');
  hydro.className='trac-type-btn'+(type==='hydrostatique'?' sel-hydro':'');
  if(wrap)wrap.style.display=type==='hydrostatique'?'block':'none';
  if(type==='mécanique'){document.getElementById('at-trait').value='0';updateTracTraitBtn('at');}
}
function pickTracTypeEdit(type){
  document.getElementById('et-type').value=type;
  var meca=document.getElementById('et-btn-meca');
  var hydro=document.getElementById('et-btn-hydro');
  var wrap=document.getElementById('et-trait-wrap');
  meca.className='trac-type-btn'+(type==='mécanique'?' sel-meca':'');
  hydro.className='trac-type-btn'+(type==='hydrostatique'?' sel-hydro':'');
  if(wrap)wrap.style.display=type==='hydrostatique'?'block':'none';
  if(type==='mécanique'){document.getElementById('et-trait').value='0';updateTracTraitBtn('et');}
}
function toggleTracTrait(pfx){
  var h=document.getElementById(pfx+'-trait');
  h.value=h.value==='1'?'0':'1';
  updateTracTraitBtn(pfx);
}
function updateTracTraitBtn(pfx){
  var on=document.getElementById(pfx+'-trait').value==='1';
  var btn=document.getElementById(pfx+'-trait-btn');
  var ico=document.getElementById(pfx+'-trait-ico');
  var lbl=document.getElementById(pfx+'-trait-lbl');
  if(!btn)return;
  btn.className='trac-trait-toggle'+(on?' on':'');
  if(ico)ico.textContent=on?'':'';
  if(lbl)lbl.style.color=on?'var(--orange)':'var(--texte)';
}

function saveAddTracteur(){
  if(!isAdmin()){showToast('Accès réservé à l\'admin','#C0392B');return;}
  var nom=document.getElementById('at-nom').value.trim();
  var modele=document.getElementById('at-modele').value.trim();
  var type=document.getElementById('at-type').value;
  var trait=document.getElementById('at-trait').value==='1';
  if(!nom||!modele){showToast('Nom et modèle requis','#C0392B');return;}
  var id='trac'+Date.now();
  TRACTEURS_LIST.push({id:id,nom:nom,modele:modele,type:type,traitementOnly:trait});
  window.TRACTEURS_LIST=TRACTEURS_LIST;
  REPARATEUR[id]=null;
  _saveData('tracteurs_list');
  _saveData('reparateur');
  _closeOv(null,'ovAddTracteur');
  renderTracTabs();
  renderTracteurSet();
  showToast(nom+' ajouté','#3D6B27');
}

function openEditTracteur(id){
  var t=TRACTEURS_LIST.find(function(x){return x.id===id;});
  if(!t)return;
  document.getElementById('et-id').value=id;
  document.getElementById('et-title').textContent='Modifier — '+t.nom;
  document.getElementById('et-nom').value=t.nom;
  document.getElementById('et-modele').value=t.modele||'';
  document.getElementById('et-type').value=t.type;
  document.getElementById('et-trait').value=t.traitementOnly?'1':'0';
  // Boutons type
  document.getElementById('et-btn-meca').className='trac-type-btn'+(t.type==='mécanique'?' sel-meca':'');
  document.getElementById('et-btn-hydro').className='trac-type-btn'+(t.type==='hydrostatique'?' sel-hydro':'');
  var wrap=document.getElementById('et-trait-wrap');
  if(wrap)wrap.style.display=t.type==='hydrostatique'?'block':'none';
  updateTracTraitBtn('et');
  _openOv('ovEditTracteur');
}

function saveEditTracteur(){
  var id=document.getElementById('et-id').value;
  var t=TRACTEURS_LIST.find(function(x){return x.id===id;});
  if(!t)return;
  t.nom=document.getElementById('et-nom').value.trim();
  t.modele=document.getElementById('et-modele').value.trim();
  t.type=document.getElementById('et-type').value;
  t.traitementOnly=document.getElementById('et-trait').value==='1';
  if(!t.nom){showToast('Nom requis','#C0392B');return;}
  window.TRACTEURS_LIST=TRACTEURS_LIST;
  _saveData('tracteurs_list');
  _closeOv(null,'ovEditTracteur');
  renderTracTabs();
  renderTracInfoBar();
  renderTracteurSet();
  showToast('Tracteur modifié','#3D6B27');
}

function deleteTracteur(){
  if(!isAdmin()){showToast('Admin requis pour supprimer','#C0392B');return;}
  var id=document.getElementById('et-id').value;
  if(TRACTEURS_LIST.length<=1){showToast('Impossible — 1 tracteur minimum','#C0392B');return;}
  var t=TRACTEURS_LIST.find(function(x){return x.id===id;});
  if(!t)return;
  _openConfirmDel('Supprimer '+t.nom+' ?','Les fiches d\'entretien associées seront aussi supprimées.',function(){
    TRACTEURS_LIST=TRACTEURS_LIST.filter(function(x){return x.id!==id;});
    window.TRACTEURS_LIST=TRACTEURS_LIST;
    ENTRETIENS=ENTRETIENS.filter(function(f){return f.tracteurId!==id;});
    window.ENTRETIENS=ENTRETIENS;
    delete REPARATEUR[id];
    if(_tracSelId===id)_tracSelId=TRACTEURS_LIST[0]?.id||null;
    _saveData('tracteurs_list');
    _saveData('entretiens');
    _saveData('reparateur');
    _closeOv(null,'ovEditTracteur');
    renderTracTabs();
    renderTracInfoBar();
    renderRepBanner();
    renderEntretiens();
    renderTracteurSet();
    showToast('Tracteur supprimé','#C0392B');
  });
}

// ── Libellé dates d'une session : début → fin (flèche) ──
function _sessDates(s){
  var deb=s.date||'', fin=s.dateFin||'';
  if(s.statut==='En cours') return ''+_fmtDate(deb)+' → en cours';
  if(fin && fin!==deb){ var nd=Math.round((new Date(fin)-new Date(deb))/86400000); return ''+_fmtDate(deb)+' → '+_fmtDate(fin)+(nd>0?' · '+nd+' j':''); }
  return ''+_fmtDate(deb);
}

// ════ TRACTEUR ════
function _sessSaisonNom(){return (window._visuSaison?window._visuSaison():(((window.getSaisonActive&&window.getSaisonActive())||{}).nom))||'';}
function _sessInSaison(s){
  var sn=_sessSaisonNom(); if(!sn)return true;
  var byDate=(s&&window._saisonForDate)?window._saisonForDate(s.date):'';
  var ss=byDate||(s&&s.saison)||'';
  if(ss) return ss===sn;
  var act=((window.getSaisonActive&&window.getSaisonActive())||{}).nom||'';
  return sn===act;
}
window._sessSaisonNom=_sessSaisonNom;
window._sessInSaison=_sessInSaison;
// _saisonForDate a été remonté dans utils.js (module chargé en 1er) : getTachesSaison en dépend
// désormais autant que _sessInSaison. Appel via window._saisonForDate, comme ci-dessus.
// Recale toutes les sessions sur la saison correspondant à leur date (orphelines → tag retiré). Manuel, admin.
function _repairSessSaisons(){
  if(window.isAdmin&&!window.isAdmin())return;
  var nOk=0,nNeutre=0;
  (SESSIONS||[]).forEach(function(s){
    if(!s)return;
    var sn=_saisonForDate(s.date);
    if(sn){ s.saison=sn; nOk++; }
    else { if(s.saison)delete s.saison; nNeutre++; }
  });
  _saveData('sessions');
  if(window.renderTracteur)window.renderTracteur();
  if(window.showToast)window.showToast(nOk+' session'+(nOk>1?'s':'')+' recalée'+(nOk>1?'s':'')+(nNeutre?(' · '+nNeutre+' hors saison'):''),'#3D6B27');
}
window._repairSessSaisons=_repairSessSaisons;
function renderTracteur(){
  // Init sélection tracteur au premier render
  if(!_tracSelId&&TRACTEURS_LIST.length)_tracSelId=TRACTEURS_LIST[0].id;
  var _SS=(SESSIONS||[]).filter(_sessInSaison);

  // Stats band en-tête
  var stSess=document.getElementById('trac-stat-sessions');
  var stEnc=document.getElementById('trac-stat-enc');
  var stRep=document.getElementById('trac-stat-rep');
  var _grpCount=(function(){var nDates={},nNorm=0;_SS.forEach(function(s){if(s.type==='traitement'){nDates[s.date||'']=1;}else{nNorm++;}});return nNorm+Object.keys(nDates).length;})();
  if(stSess)stSess.textContent=_grpCount;
  var hdrBadge=document.getElementById('trac-header-badge');
  if(hdrBadge)hdrBadge.textContent=_grpCount+' session'+(_grpCount>1?'s':'');
  if(stEnc)stEnc.textContent=_SS.filter(function(s){return s.statut==='En cours';}).length;
  if(stRep)stRep.textContent=Object.keys(REPARATEUR).length;

  // Render pills parc tracteurs en en-tête
  renderTracParcPills();

  // FAB visible si tractoriste + onglet sessions
  var fab=document.getElementById('trac-fab');
  if(fab)fab.style.display=(_tracOnglet==='sessions'&&(isTractoriste()||isAdmin()))?'flex':'none';

  // Readonly banner
  var rb=document.getElementById('trac-readonly');
  if(rb)rb.style.display=!isTractoriste()?'':'none';

  // ── Onglet actif : s'assurer du bon état ──
  document.getElementById('trac-panel-sessions').style.display=_tracOnglet==='sessions'?'':'none';
  document.getElementById('trac-panel-entretiens').style.display=_tracOnglet==='entretiens'?'':'none';
  var btnS=document.getElementById('trac-ong-sessions');
  var btnE=document.getElementById('trac-ong-entretiens');
  if(btnS)btnS.classList.toggle('active',_tracOnglet==='sessions');
  if(btnE)btnE.classList.toggle('active',_tracOnglet==='entretiens');

  if(_tracOnglet==='entretiens'){
    renderEntTracFilter();
    renderRepBanner();
    renderEntretiens();
    return;
  }

  // ── ONGLET SESSIONS ──

  // Normaliser "Validé" → "Terminé"
  SESSIONS.forEach(s=>{if(s.statut==='Validé')s.statut='Terminé';});

  // Filtres conducteurs
  const cc=document.getElementById('cond-chips');
  if(cc)cc.innerHTML=`<div class="chip ${window.fCond==='tous'?'active ac':''}" onclick="window.fCond='tous';renderTracteur()">Tous</div>`
    +_condList().map(c=>`<div class="chip ${window.fCond===c.nom?'active ac':''}" onclick="window.fCond='${_escAttr(c.nom)}';renderTracteur()">${c.statut==='En formation'?'':''} ${_escHtml(c.nom)}${isAdmin()?`<span style="opacity:0.5;margin-left:4px;padding:12px 8px;margin-top:-12px;margin-bottom:-12px;display:inline-flex;align-items:center" onclick="event.stopPropagation();editCond('${_escAttr(c.nom)}')"></span>`:''}</div>`).join('');

  if(cc && typeof isAdmin==='function' && isAdmin()) cc.insertAdjacentHTML('beforeend','<div class="chip" style="border-style:dashed;opacity:0.85;cursor:pointer" onclick="openAddConducteur()">Conducteur</div>');

  // Filtres activités
  const ac=document.getElementById('act-chips');
  if(ac)ac.innerHTML=`<div class="chip ${window.fAct==='toutes'?'active ac':''}" onclick="window.fAct='toutes';renderTracteur()">Toutes</div>`
    +ACTIVITES.map(a=>`<div class="chip ${window.fAct===a.nom?'active ac':''}" onclick="window.fAct='${_escAttr(a.nom)}';renderTracteur()">${_mvIcon(_actIcone(a.emoji),16)} ${_escHtml(a.nom)}</div>`).join('');

  // Données filtrées + triées (en cours en premier)
  let data=_SS.filter(s=>{if(window.fCond!=='tous'&&s.conducteur!==window.fCond)return false;if(window.fAct!=='toutes'&&s.activite!==window.fAct)return false;return true;});
  const isTrait=s=>s.type==='traitement';
  const dataEnc=data.filter(s=>s.statut==='En cours'&&!isTrait(s)).sort((a,b)=>b.date.localeCompare(a.date));
  const dataTer=data.filter(s=>s.statut!=='En cours'&&!isTrait(s)).sort((a,b)=>b.date.localeCompare(a.date));
  // ── Sessions de traitement regroupées par date (affichage seul — données/registre intacts) ──
  const _prodType={};(window.TRAITEMENTS||[]).forEach(function(t){if(t&&t.produit)_prodType[t.produit]=t.type;});
  const _tgMap={};
  data.filter(isTrait).forEach(function(s){var d=s.date||'';(_tgMap[d]=_tgMap[d]||[]).push(s);});
  const traitGroups=Object.keys(_tgMap).map(function(d){
    var arr=_tgMap[d],prods=[],seenP={},parcSet={},conds=[],seenC={},anyAb=false;
    arr.forEach(function(s){
      (s.produits||[]).forEach(function(p){if(p&&!seenP[p]){seenP[p]=1;prods.push(p);}});
      (s.parcelles||[]).forEach(function(x){if(x)parcSet[x]=1;});
      var c=s.conducteur||'';if(c&&!seenC[c]){seenC[c]=1;conds.push(c);}
      if(s.modeAb)anyAb=true;
    });
    return {date:d,produits:prods,nbParc:Object.keys(parcSet).length,conducteurs:conds,anyAb:anyAb,nbPass:arr.length};
  });

  // Résumé session en cours
  var encBanner=document.getElementById('trac-enc-banner');
  var encTxt=document.getElementById('trac-enc-txt');
  if(encBanner&&encTxt){
    if(dataEnc.length){
      encBanner.style.display='flex';
      encTxt.textContent=dataEnc.length+' session'+(dataEnc.length>1?'s':'')+' en cours · '+dataEnc[0].avancement+'% d\'avancement';
    } else {
      encBanner.style.display='none';
    }
  }

  const sl=document.getElementById('sessions-list');
  if(!sl)return;
  if(!window._dataReady){ sl.innerHTML=window._mvSk('tracteur'); return; }
  if(!data.length){
    sl.innerHTML=`<div class="empty-state"><div class="ei">${_mvIcon('tracteur',40)}</div><div class="et">Aucune session</div><div class="ed">Aucun passage tracteur enregistré pour cette saison.</div>${isTractoriste()?'<button class="empty-cta-ac" onclick="openNewSession()">＋ Démarrer une session</button>':''}</div>`;
    // Peupler quand même les selects du form nouvelle session
    _fillNewSessionForm();
    return;
  }

  const amap=ACTIVITES.reduce((m,a)=>{m[a.nom]=a;return m},{});
  const isAdm=currentUser&&currentUser.roles&&currentUser.roles.includes('admin');

  const mkScard=s=>{
    if(s.type==='traitement'){
      var nbP=(s.produits||[]).length;
      var abBadge=s.modeAb?'<span class="sc-ab-badge">AB</span>':'';
      var npTag='<span class="sc-phyto-badge">PHYTO</span>';
      return '<div class="scard scard-traitement">'
        +'<div class="sc-hd">'
        +'<div class="sc-info">'
        +'<div class="mv-t">Traitement '+npTag+abBadge+'</div>'
        +'<div class="sc-meta"><span class="sc-date">'+_fmtDate(s.date)+'</span>'
        +'<span class="sc-cond">'+_escHtml(s.conducteur||'—')+'</span></div>'
        +'<div class="mv-l" style="margin-top:2px">'+nbP+' produit'+(nbP>1?'s':'')+' · '+(s.parcelles||[]).length+' parcelle'+((s.parcelles||[]).length>1?'s':'')+'</div>'
        +'</div>'
        +'<div class="sc-right">'+_mvBadge('Terminé','vert')+'</div>'
        +'</div>'
        +'</div>';
    }
    const isEnc=s.statut==='En cours';
    const pct=s.avancement!=null?s.avancement:0;
    const skip=s.parcellesSkip||[];
    const actives=PARCELLES.filter(p=>p.statut!=='Arrachee'&&!skip.includes(p.nom));
    const totalSurf=actives.reduce((acc,p)=>acc+(parseFloat(p.surface)||0),0);
    const doneNoms=(s.parcellesFaites||[]).map(x=>typeof x==='string'?x:(x&&x.nom)||'');
    const doneSurf=actives.filter(p=>doneNoms.includes(p.nom)).reduce((acc,p)=>acc+(parseFloat(p.surface)||0),0);
    const canOpen=(isTractoriste()&&isEnc)||isAdm;
    const clk=canOpen?`onclick="openSessionDetail('${s.id}')" style="cursor:pointer"`:'';
    const editBtn=isAdm?`<button class="mv-gh sc-edit-btn" onclick="event.stopPropagation();openEditSession('${s.id}')" title="Modifier" aria-label="Modifier">${_mvIcon('crayon',18)}</button>`:'';
    const encCls=isEnc?' scard-enc':'';
    // Badge tracteur
    const actDef=ACTIVITES.find(a=>a.nom===s.activite);
    const trac=TRACTEURS_LIST.find(t=>t.id===s.tracteurId);
    const isOverride=s.tracteurOverride||(s.tracteurId&&s.tracteurId!==actDef?.tracteurDefautId);
    const tracRep=s.tracteurId&&REPARATEUR[s.tracteurId];
    const tracBadgeCls=tracRep?'en-rep':isOverride?'override':'defaut';
    const tracNom=trac?_escHtml(trac.nom):'';
    // ⚠️ « ✱ » RESTE : c'est un signe typographique de renvoi, comme un
    //   asterisque de note de bas de page. Ce n'est pas un pictogramme.
    const tracBadge=tracNom?`<span class="sc-trac-badge ${tracBadgeCls}">${tracNom}${isOverride?' ✱':''}</span>`:'';
    const tracRepBadge=tracRep&&isEnc?_mvBadge('En réparation','rouge'):'';
    const overrideAlert=isOverride&&actDef?.tracteurDefautId?`<div class="sc-override-alert">✱ Tracteur modifié — défaut : ${_escHtml(TRACTEURS_LIST.find(t=>t.id===actDef.tracteurDefautId)?.nom||'—')}</div>`:'';
    // Hint tactile si en cours + tractoriste
    const hint=isEnc&&isTractoriste()?`<div class="scard-enc-hint">Tap pour enregistrer l'avancement →</div>`:'';
    return `<div class="scard${encCls}" ${clk}>`
      +`<div class="sc-hd"><div class="sc-info"><div class="mv-t" style="color:inherit">${_escHtml(s.activite)}</div><div class="sc-meta"><span class="sc-date">${_sessDates(s)}</span><span class="sc-cond">${_escHtml(s.conducteur)}</span>${tracBadge}${tracRepBadge}</div></div><div class="sc-right">${editBtn}${_mvBadge(s.statut, isEnc?'ambre':'vert')}<div class="mv-n" style="color:inherit;margin-top:4px">${pct}<span style="font-size:13px">%</span></div></div></div>`
      +`<div class="sc-bwrap"><div class="sc-blbl"><span>Avancement domaine</span><span>${doneSurf.toFixed(2)}/${totalSurf.toFixed(2)} ha</span></div><div class="sc-btrack"><div class="sc-bfill ${isEnc?'sc-bfill-enc':''}" style="width:${pct}%"></div></div></div>`
      +(s.note?`<div style="padding:0 16px 12px;font-size:11px;color:${isEnc?'rgba(255,255,255,0.45)':'var(--texte-doux)'}">« ${_escHtml(s.note)} »</div>`:'')
      +overrideAlert+hint
    +`</div>`;
  };

  const _TC={'Cuivre':'var(--tag-blue-tx,#1A4A7A)','Soufre':'var(--tag-amber-tx,#7D6608)','Fongicide':'var(--tag-purple-tx,#4A2060)','Insecticide':'var(--tag-red-tx,#A0291E)','Herbicide':'var(--tag-green-tx,#1E3A12)','Biocontrôle':'var(--tag-teal-tx,#2C6E49)'};
  const _TB={'Cuivre':'var(--tag-blue-bg,rgba(26,74,122,0.14))','Soufre':'var(--tag-amber-bg,rgba(125,102,8,0.16))','Fongicide':'var(--tag-purple-bg,rgba(90,45,142,0.16))','Insecticide':'var(--tag-red-bg,rgba(160,41,30,0.14))','Herbicide':'var(--tag-green-bg,rgba(30,58,18,0.14))','Biocontrôle':'var(--tag-teal-bg,rgba(44,110,73,0.14))'};
  const mkTraitGroupCard=g=>{
    var nbProd=g.produits.length;
    var abBadge=g.anyAb?'<span class="sc-ab-badge">AB</span>':'';
    var npTag='<span class="sc-phyto-badge">PHYTO</span>';
    var passTag=g.nbPass>1?'<span style="display:inline-block;background:var(--vert-pale);color:var(--vert-med);border-radius:6px;padding:1px 7px;font-size:10px;font-weight:700;margin-left:4px">'+g.nbPass+' passages</span>':'';
    var condTxt=g.conducteurs.length===0?'—':(g.conducteurs.length===1?g.conducteurs[0]:'Plusieurs');
    var chips=g.produits.map(function(nom){
      var ty=_prodType[nom]||'';
      var col=_TC[ty]||'var(--texte-doux)',bg=_TB[ty]||'var(--gris-clair)';
      var emj='';
      return '<span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:8px;white-space:nowrap;background:'+bg+';color:'+col+'">'+emj+_escHtml(nom)+'</span>';
    }).join('');
    return '<div class="scard scard-traitement">'
      +'<div class="sc-hd">'
      +'<div class="sc-ico"></div>'
      +'<div class="sc-info">'
      +'<div class="sc-act">Traitement '+npTag+abBadge+'</div>'
      +'<div class="sc-meta"><span class="sc-date">'+_fmtDate(g.date)+'</span>'
      +'<span class="sc-cond">'+_escHtml(condTxt)+'</span>'+passTag+'</div>'
      +'<div style="font-size:11px;color:var(--texte-doux);margin-top:2px">'+nbProd+' produit'+(nbProd>1?'s':'')+' · '+g.nbParc+' parc.</div>'
      +'</div>'
      +'<div class="sc-right"><div class="sc-st sster">Terminé</div><div class="sc-pct">100%</div></div>'
      +'</div>'
      +(chips?'<div style="display:flex;flex-wrap:wrap;gap:5px;padding:0 16px 14px">'+chips+'</div>':'')
      +'</div>';
  };
  var _terItems=dataTer.map(function(s){return {date:s.date||'',html:mkScard(s)};})
    .concat(traitGroups.map(function(g){return {date:g.date||'',html:mkTraitGroupCard(g)};}))
    .sort(function(a,b){return (b.date||'').localeCompare(a.date||'');});
  sl.innerHTML=dataEnc.map(mkScard).join('')+_terItems.map(function(x){return x.html;}).join('');
  _fillNewSessionForm();
}

/* ★★★ LE NOM D'UNE ACTIVITE EST UNE VALEUR, PLUS UNE DEDUCTION (lot DS-M2).
   Avant : le <option> portait « <pictogramme> <nom> » et cinq endroits
   retrouvaient le nom par `rawAct.replace(/^\\S+ /,'')` — on jetait le premier
   mot en esperant que ce soit le pictogramme.
   ⚠⚠ Ca marchait TANT QU'IL Y EN AVAIT UN. Sur une activite sans pictogramme,
     « Reparation ponctuelle » devenait « ponctuelle », et la session partait
     avec un nom d'activite qui n'existe dans aucune table — en silence.
   ★ C'etait aussi LE VERROU de DS-M (§45j) : une balise <option> ne peut
     contenir aucun element, donc `a.emoji` ne pouvait pas devenir un nom
     d'icone tant qu'il etait RENDU la. Il ne l'est plus : le libelle est le nom
     seul, et le pictogramme a migre vers les puces (`act-chips`), ou une icone
     tient. La donnee en base n'est PAS touchee — migration a zero ecriture.
   ⚠ Le repli ne devine pas non plus : il ne retient l'ancienne deduction que si
     elle tombe sur une activite CONNUE. Un onglet reste ouvert sur l'ancien
     HTML pendant une mise a jour continue de fonctionner. */
function _actNomDuSelect(id){
  var el=document.getElementById(id);
  if(!el) return '';
  var v=String(el.value||'').trim();
  if(ACTIVITES.some(function(a){return a.nom===v;})) return v;
  var d=v.replace(/^\S+\s/,'').trim();
  return ACTIVITES.some(function(a){return a.nom===d;}) ? d : v;
}

function _fillNewSessionForm(){
  var sa=document.getElementById('s-act');
  if(sa)sa.innerHTML=ACTIVITES.map(a=>`<option value="${_escAttr(a.nom)}">${_escHtml(a.nom)}</option>`).join('');
  var sc=document.getElementById('s-cond-pick');
  if(sc)sc.innerHTML=_condList().map((c,i)=>`<div class="pchk ${i===0?'sel acre':''}" onclick="pickCond(this)">${_escHtml(c.nom)}</div>`).join('');
}
let sdShowDone=false;
let sdSkipMode=false;
/* ============ CHRONO PAR PARCELLE — MOTEUR INVERSE (v5.92) ============
   La coche EST le chrono. Trois gestes, un seul bouton pendant la mesure :
     • toucher une parcelle          -> la mesure demarre dessus
     • « J'AI FINI »                 -> la mesure se ferme, le temps part en HORS PARCELLE
     • toucher une AUTRE parcelle    -> cloture la premiere, demarre la seconde,
                                        SANS compter de deplacement (parcelles voisines)
     • appui long                    -> ajoute au bloc en cours (un climat coupe au
                                        cadastre, travaille d'une traite) : temps
                                        partage a la surface, comportement historique.

   CE CHRONO NE JUSTIFIE PAS LA JOURNEE DE TRAVAIL. Au retour il reste le lavage,
   les niveaux et le plein : ils n'y sont pas. Il sert a BUDGETER les travaux de
   tracteur et a connaitre le temps reellement passe dans les vignes. L'ecran le dit
   en toutes lettres, sinon un tractoriste lira le total comme sa journee.

   TROIS SEAUX, jamais quatre : MESURE (dans les parcelles) · HORS PARCELLE (trajets,
   pause legale, ravitaillement, reglage — tout du temps travaille) · PAUSE DEJEUNER
   (non travaillee). Le mot « pause dejeuner » est JUSTE ici et interdit dans le
   planning : le tractoriste est seul sur son tracteur, il en choisit le moment.
   C'est pourquoi le libelle vit dans ce fichier et pas dans index.html, qui reste a
   zero pour scripts/lint-vocabulaire.mjs.

   CHRONO DOUTEUX = MESURE ECARTEE. Au-dela de 3x le bareme, en dessous de 40 %, ou
   au-dela de 12 h, on n'ecrit PAS de dmin : la parcelle est cochee au bareme, sans
   temps constate. Rien a coder pour ca — _chronoSummary et pilotage.js retombent
   deja sur _sessBaremeMin quand dmin est absent. Mais l'ecart est DIT (toast, ligne
   ambre, compteur au bilan) : un ecart silencieux serait un indicateur qui ment.
   Une activite sans h_ha n'a pas de bareme -> aucun ecart possible, tout compte.

   PERSISTANCE. t0 est ABSOLU et l'etat vit dans localStorage, ecrit a chaque geste
   plus sur pagehide et visibilitychange. Avant, _chrono etait une variable JS que
   rien ne sauvait : un telephone verrouille pendant 40 min de rognage perdait la
   mesure en silence. C'etait le vrai defaut, pas l'oubli d'eteindre. */
var _chrono = _chrNeuf();
var _chronoTimer = null;
var _CHR_CLE = 'mavigne_chrono_session';
var _CHR_HAUT = 3, _CHR_BAS = 0.4, _CHR_BORNE_H = 12;

function _chrNeuf(){
  return {sid:null, bloc:[], t0:0, mesMs:0, horsMs:0, pauseMs:0,
          bucket:'hors', bT0:Date.now(), pause:false, pauseOuvert:null, dernier:null,
          ecarte:0, ecarteMs:0};
}
function _chrNom(x){return typeof x==='string'?x:(x&&x.nom)||'';}
function _chrDur(x){return (x&&typeof x==='object'&&typeof x.dmin==='number')?x.dmin:null;}
function _chrGrp(x){return (x&&typeof x==='object'&&x.grp)?x.grp:1;}
function _chrEcart(x){return (x&&typeof x==='object'&&x.ecarte)?x.ecarte:null;}
function _chronoOn(){return !!(window.CONFIG&&CONFIG.chrono_mode==='on');}
function _chronoEnabledForSession(s){
  if(!s||!_chronoOn())return false;
  if(!(isTractoriste()||isAdmin()))return false;
  var act=ACTIVITES.find(function(a){return a.nom===s.activite;});
  if(act&&act.champCustom&&act.champCustom.label)return false;
  return true;
}
function _sessBaremeMin(s,surface){
  var act=ACTIVITES.find(function(a){return a.nom===s.activite;});
  var hha=act?(parseFloat(act.h_ha)||0):0;
  return hha*60*(parseFloat(surface)||0);
}
function _chrSurf(nom){var p=PARCELLES.find(function(x){return x.nom===nom;});return p?(parseFloat(p.surface)||0):0;}
function _chrBareme(s,noms){var t=0;(noms||[]).forEach(function(n){t+=_chrSurf(n);});return _sessBaremeMin(s,t);}
function _chrFmtTimer(ms){
  var s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;
  function p(n){return n<10?('0'+n):(''+n);}
  return h>0?(h+':'+p(m)+':'+p(ss)):(p(m)+':'+p(ss));
}
function _chrFmtRate(minPerHa){var h=Math.floor(minPerHa/60),m=Math.round(minPerHa%60);if(m===60){h++;m=0;}return h+'h'+(m<10?('0'+m):m)+'/ha';}
function _chrFmtDur(min){if(min<1)return '0 min';if(min<60)return Math.round(min)+' min';var h=Math.floor(min/60),m=Math.round(min%60);if(m===60){h++;m=0;}return h+'h'+(m?(m<10?('0'+m):m):'');}

/* ── seaux de temps ── */
function _chrLive(){return _chrono.bloc.length>0 && !_chrono.pause;}
function _chrCourant(){return _chrLive()?(Date.now()-_chrono.t0):0;}
function _chrBucketMs(){return Date.now()-_chrono.bT0;}
function _chrHors(){return _chrono.horsMs+((_chrono.bucket==='hors'&&!_chrLive())?_chrBucketMs():0);}
function _chrPause(){return _chrono.pauseMs+(_chrono.bucket==='pause'?_chrBucketMs():0);}
function _chrMesure(){return _chrono.mesMs+_chrCourant();}
function _chrGoBucket(b){
  var d=_chrBucketMs();
  if(_chrono.bucket==='hors')_chrono.horsMs+=d;
  else if(_chrono.bucket==='pause')_chrono.pauseMs+=d;
  _chrono.bucket=b;_chrono.bT0=Date.now();
}

/* ── persistance : t0 ABSOLU, jamais un compteur ── */
// Si le stockage refuse (mode prive, quota), le chrono ne survivra PAS a une mise en
// veille : c'est la panne meme que ce moteur repare. On le dit une fois, on ne l'avale pas.
var _chrPersistKO=false;
function _chrSave(){
  try{
    if(!_chrono.sid){localStorage.removeItem(_CHR_CLE);return;}
    localStorage.setItem(_CHR_CLE,JSON.stringify(_chrono));
  }catch(e){
    if(!_chrPersistKO){
      _chrPersistKO=true;
      showToast('Chrono non sauvegard\u00e9 \u2014 ferme l\'app et la mesure sera perdue','#B85A1A');
    }
  }
}
function _chrLoad(sid){
  try{
    var r=localStorage.getItem(_CHR_CLE);if(!r)return null;
    var o=JSON.parse(r);
    if(!o||o.sid!==sid)return null;
    return o;
  }catch(e){return null;}
}
function _chronoReset(){_chrono=_chrNeuf();_stopChronoTimer();try{localStorage.removeItem(_CHR_CLE);}catch(e){_chrPersistKO=true;}}
function _stopChronoTimer(){if(_chronoTimer){clearInterval(_chronoTimer);_chronoTimer=null;}}
function _startChronoTimer(){_stopChronoTimer();_chronoTimer=setInterval(_chronoTick,500);}

/* ── mesure douteuse ── */
function _chrSuspect(s,bloc,ms){
  var b=_chrBareme(s,bloc);
  if(!b)return null;                       // activite sans h_ha : aucun seuil
  if(ms/3600000>=_CHR_BORNE_H)return 'dur';
  var min=ms/60000;
  if(min>_CHR_HAUT*b)return 'haut';
  if(min<_CHR_BAS*b)return 'bas';
  return null;
}
var _CHR_MOTIFS={haut:'chrono rest\u00e9 ouvert', bas:'chrono lanc\u00e9 en retard',
                 dur:'chrono ouvert plus de '+_CHR_BORNE_H+' h'};

/* ── ecriture d'un bloc dans la session ── */
function _chrPose(s,nom,entry){
  if(!s.parcellesFaites)s.parcellesFaites=[];
  var i=s.parcellesFaites.findIndex(function(x){return _chrNom(x)===nom;});
  if(i>=0)s.parcellesFaites[i]=entry;else s.parcellesFaites.push(entry);
}
function _chrEcrire(s,bloc,ms){
  var t1=Date.now(), min=Math.round(ms/60000*10)/10;
  var surf=bloc.reduce(function(a,n){return a+_chrSurf(n);},0);
  var rate=surf>0?(min/surf):0;
  bloc.forEach(function(nom){
    _chrPose(s,nom,{nom:nom,t0:_chrono.t0,t1:t1,ps:0,
                    dmin:Math.round(rate*_chrSurf(nom)*10)/10,grp:bloc.length});
  });
  _chrono.mesMs+=ms;
  return rate;
}
function _chrEcarter(s,bloc,ms,type){
  var t1=Date.now();
  bloc.forEach(function(nom){
    // PAS de dmin : _chronoSummary et pilotage.js retombent sur le bareme.
    _chrPose(s,nom,{nom:nom,t0:_chrono.t0,t1:t1,ps:0,grp:bloc.length,ecarte:type});
  });
  _chrono.ecarte++;_chrono.ecarteMs+=ms;
  showToast('Mesure \u00e9cart\u00e9e \u2014 '+_CHR_MOTIFS[type]+'. Cochée au barème.','#B85A1A');
  if(navigator.vibrate)navigator.vibrate([60,40,60]);
}
/* Cloture le bloc en cours. Rend true si la mesure a ete ecartee. */
function _chrCloturer(s){
  if(!_chrono.bloc.length)return false;
  var bloc=_chrono.bloc.slice(), ms=_chrCourant();
  var sp=_chrSuspect(s,bloc,ms);
  if(sp)_chrEcarter(s,bloc,ms,sp);
  else{
    var rate=_chrEcrire(s,bloc,ms);
    showToast(bloc.length>1?(bloc.length+' parcelles \u2014 '+_chrFmtRate(rate))
                           :('Mesur\u00e9 \u2014 '+_chrFmtRate(rate)),'#3D6B27');
  }
  _chrono.dernier=bloc[bloc.length-1];
  _chrono.bloc=[];_chrono.t0=0;
  return !!sp;
}

/* ── gestes ── */
function _chrTapParcelle(nom){
  var s=SESSIONS.find(function(x){return x.id===window.tracSessionId;});if(!s)return;
  if(_chrono.pause)return;
  if(_chrono.bloc.indexOf(nom)>=0)return;          // deja dans le bloc : rien
  if(_chrono.bloc.length){                          // ENCHAINEMENT : aucun deplacement
    _chrCloturer(s);
  } else {
    _chrGoBucket('none');
  }
  _chrono.bloc=[nom];_chrono.t0=Date.now();
  _startChronoTimer();
  if(navigator.vibrate)navigator.vibrate(20);
  _chrSave();_saveData('sessions');renderSessionProgress();renderSDParcelles();
}
function _chrAjouterAuBloc(nom){
  var s=SESSIONS.find(function(x){return x.id===window.tracSessionId;});if(!s)return;
  if(!_chrono.bloc.length||_chrono.bloc.indexOf(nom)>=0)return;
  _chrono.bloc.push(nom);
  if(navigator.vibrate)navigator.vibrate(45);
  showToast(nom+' ajout\u00e9e au bloc \u2014 temps partag\u00e9 \u00e0 la surface','#8A5A38');
  _chrSave();renderSDParcelles();
}
function _chrFini(){
  var s=SESSIONS.find(function(x){return x.id===window.tracSessionId;});if(!s)return;
  if(!_chrono.bloc.length)return;
  _chrCloturer(s);_chrGoBucket('hors');_stopChronoTimer();
  if(navigator.vibrate)navigator.vibrate(30);
  _chrSave();_saveData('sessions');renderSessionProgress();renderSDParcelles();
}
/* Interruption en pleine parcelle : la parcelle RESTE ouverte, rien n'est ecrit. */
function _chrInterrompre(){
  if(!_chrono.bloc.length)return;
  _chrono.mesMs+=_chrCourant();
  _chrono.pauseOuvert=_chrono.bloc.slice();
  _chrono.bloc=[];_chrono.t0=0;_chrono.pause=true;_chrGoBucket('pause');_stopChronoTimer();
  showToast('Mesure suspendue \u2014 '+_chrono.pauseOuvert.join(' + ')+' reprendra au retour','#8A5A38');
  _chrSave();renderSDParcelles();
}
function _chrDejeuner(){
  if(_chrono.bloc.length)return;
  _chrono.pause=true;_chrGoBucket('pause');_stopChronoTimer();
  _chrSave();renderSDParcelles();
}
function _chrReprendre(){
  _chrono.pause=false;
  if(_chrono.pauseOuvert&&_chrono.pauseOuvert.length){
    _chrGoBucket('none');
    _chrono.bloc=_chrono.pauseOuvert.slice();_chrono.t0=Date.now();_chrono.pauseOuvert=null;
    _startChronoTimer();
  } else _chrGoBucket('hors');
  _chrSave();renderSDParcelles();
}
function _chrFinJournee(){
  var s=SESSIONS.find(function(x){return x.id===window.tracSessionId;});if(!s)return;
  if(_chrono.bloc.length)_chrCloturer(s);
  _chrGoBucket('none');_stopChronoTimer();
  _saveData('sessions');renderSessionProgress();
  _chronoReset();
  closeSessionDetail();
}
/* Fermeture de l'ecran : on N'ECRIT PAS le bloc en cours — il est persiste et
   repris a la reouverture. Ecrire ici forcerait une mesure a chaque coup d'oeil. */
function _chronoFinalizeOnClose(){_stopChronoTimer();_chrSave();}

/* ── reprise a l'ouverture d'une session ── */
function _chrRestaurer(sid){
  var o=_chrLoad(sid);
  if(!o){_chrono=_chrNeuf();_chrono.sid=sid;_chrono.bT0=Date.now();return;}
  _chrono=o;
  if(_chrono.bloc.length){
    var s=SESSIONS.find(function(x){return x.id===sid;});
    var ms=_chrCourant(), sp=s?_chrSuspect(s,_chrono.bloc,ms):null;
    if(sp){_chrEcarter(s,_chrono.bloc.slice(),ms,sp);_chrono.bloc=[];_chrono.t0=0;
           _chrGoBucket('hors');_saveData('sessions');}
    else{_startChronoTimer();
         showToast('Mesure retrouv\u00e9e \u2014 '+_chrono.bloc.join(' + '),'#2C3E50');}
  }
  _chrSave();
}

/* ── ordre d'affichage : tournee du chef > proximite > sans polygone ──
   La geographie vient des POLYGONES KML via _mvParcGeo, jamais d'une geolocalisation
   du tractoriste : ce sont les parcelles qui sont situees, pas l'homme. */
function _chrHav(a,b){
  if(!a||!b)return null;
  var R=6371000,r=Math.PI/180;
  var dLa=(b.lat-a.lat)*r,dLo=(b.lng-a.lng)*r,l1=a.lat*r,l2=b.lat*r;
  var x=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(l1)*Math.cos(l2)*Math.sin(dLo/2)*Math.sin(dLo/2);
  return 2*R*Math.asin(Math.sqrt(x));
}
function _chrGeo(nom){
  var p=PARCELLES.find(function(x){return x.nom===nom;});
  return (p&&window._mvParcGeo)?window._mvParcGeo(p):null;
}
function _chrFmtM(m){return m<950?(Math.round(m/10)*10+' m'):((m/1000).toFixed(1).replace('.',',')+' km');}
/* Rend {liste, src, coupe} — coupe = index a partir duquel les parcelles n'ont pas
   de polygone (elles ne disparaissent jamais, elles passent en fin de liste). */
function _chrTrier(s,arr){
  var ord=(window._mvOrdreFor)?window._mvOrdreFor(s.activite):null;
  if(ord&&ord.ordre&&ord.ordre.length){
    var r={};ord.ordre.forEach(function(n,i){r[n]=i;});
    return {src:'tourn\u00e9e du chef',coupe:null,
      liste:arr.slice().sort(function(a,b){
        var ra=(r[a.nom]==null?9999:r[a.nom]),rb=(r[b.nom]==null?9999:r[b.nom]);
        return (ra-rb)||a.nom.localeCompare(b.nom,'fr');})};
  }
  var refNom=_chrono.bloc.length?_chrono.bloc[_chrono.bloc.length-1]:_chrono.dernier;
  var ref=refNom?_chrGeo(refNom):null;
  if(!ref)return {src:'ordre alphab\u00e9tique',coupe:null,
    liste:arr.slice().sort(function(a,b){return a.nom.localeCompare(b.nom,'fr');})};
  var avec=[],sans=[];
  arr.forEach(function(p){
    var g=_chrGeo(p.nom);
    if(g){p._chrD=(p.nom===refNom)?-1:_chrHav(ref,g);avec.push(p);}
    else{p._chrD=null;sans.push(p);}
  });
  avec.sort(function(a,b){return a._chrD-b._chrD;});
  sans.sort(function(a,b){return a.nom.localeCompare(b.nom,'fr');});
  return {src:'les plus proches de '+refNom,coupe:avec.length,liste:avec.concat(sans)};
}

/* ── rendu de la barre : trois etats, un seul gros bouton ── */
function _renderChronoBar(){
  var host=document.getElementById('sd-chrono');if(!host)return;
  var s=SESSIONS.find(function(x){return x.id===window.tracSessionId;});
  if(!s||!_chronoEnabledForSession(s)){host.innerHTML='';return;}
  var h='';
  if(_chrono.pause){
    h='<div class="chr-pz"><div class="chr-pz-e">'+_mvIcon('repas',24)+'</div>'
      +'<div class="chr-pz-t">Pause d\u00e9jeuner</div>'
      +'<div class="chr-pz-c" id="chr-pzc">'+_chrFmtTimer(_chrPause())+'</div>'
      +(_chrono.pauseOuvert&&_chrono.pauseOuvert.length
        ?'<div class="chr-pz-x">'+_escHtml(_chrono.pauseOuvert.join(' + '))+' reprendra au retour</div>':'')
      +'<button class="chr-pz-b" onclick="_chrReprendre()">'+_mvIcon('lecture',18)+'&nbsp; REPRENDRE</button></div>';
  } else if(_chrono.bloc.length){
    var bar=_chrBareme(s,_chrono.bloc), ms=_chrCourant();
    var al=bar>0&&(ms/60000)>_CHR_HAUT*bar;
    var sf=_chrono.bloc.reduce(function(a,n){return a+_chrSurf(n);},0);
    h='<div class="chr-run'+(al?' chr-al':'')+'"><div class="chr-run-hd">'
      +'<div><div class="chr-run-st"><span class="chr-dot"></span>'
      +(al?'Chrono encore ouvert\u00a0?':'Mesure en cours')+'</div>'
      +'<div class="chr-run-p">'+_escHtml(_chrono.bloc.join(' + '))+'</div>'
      +'<div class="chr-run-x">'+sf.toFixed(2)+' ha'
      +(_chrono.bloc.length>1?' \u00b7 bloc de '+_chrono.bloc.length:'')+'</div></div>'
      +'<button class="chr-mini" onclick="_chrInterrompre()">'+_mvIcon('pause',18)+'</button></div>'
      +'<div class="chr-run-t" id="chr-time">'+_chrFmtTimer(ms)+'</div>'
      +'<div class="chr-run-b" id="chr-bar">'
      +(bar>0?(al?'largement au-del\u00e0 du bar\u00e8me ('+_chrFmtDur(bar)+')':'bar\u00e8me '+_chrFmtDur(bar)):'pas de bar\u00e8me pour cette activit\u00e9')
      +'</div>'
      +'<button class="chr-fini" onclick="_chrFini()">'+_mvIcon('check',18)+'&nbsp; J\'AI FINI</button></div>';
  } else {
    h='<div class="chr-idle"><b>Touchez la parcelle o\u00f9 vous commencez.</b><br>'
      +'La mesure d\u00e9marre toute seule \u2014 rien d\'autre \u00e0 appuyer.</div>';
  }
  // Trois seaux + le cadrage : ce chrono ne fait pas la journee de travail.
  h+='<div class="chr-strip">'
    +'<div class="chr-st chr-st-m"><div class="chr-st-k">'+_mvIcon('chrono',16)+' Mesur\u00e9<br>dans les parcelles</div>'
      +'<div class="chr-st-v" id="chr-c-m">'+_chrFmtDur(_chrMesure()/60000)+'</div></div>'
    +'<div class="chr-st chr-st-h"><div class="chr-st-k">'+_mvIcon('route',16)+' Hors<br>parcelle</div>'
      +'<div class="chr-st-v" id="chr-c-h">'+_chrFmtDur(_chrHors()/60000)+'</div></div>'
    +'<div class="chr-st chr-st-p"><div class="chr-st-k">'+_mvIcon('repas',16)+' Pause<br>d\u00e9jeuner</div>'
      +'<div class="chr-st-v" id="chr-c-p">'+_chrFmtDur(_chrPause()/60000)+'</div></div>'
    +'</div>'
    +'<div class="chr-cadre">'+_mvIcon('chrono',16)+' Ce chrono mesure <b>le temps pass\u00e9 dans les parcelles</b>, '
    +'pour budg\u00e9ter les travaux. <b>Ce n\'est pas la journ\u00e9e de travail</b>\u00a0: le lavage, '
    +'les niveaux et le plein n\'y sont pas.'
    +(_chrono.ecarte?'<br><span class="chr-cadre-w">'+_chrono.ecarte+' mesure'+(_chrono.ecarte>1?'s':'')
      +' \u00e9cart\u00e9e'+(_chrono.ecarte>1?'s':'')+' \u2014 '+_chrFmtDur(_chrono.ecarteMs/60000)
      +' de chrono non exploitable'+(_chrono.ecarte>1?'s':'')+'.</span>':'')
    +'</div>';
  host.innerHTML=h;
}
function _chronoTick(){
  var e=document.getElementById('chr-time');if(e)e.textContent=_chrFmtTimer(_chrCourant());
  e=document.getElementById('chr-pzc');if(e)e.textContent=_chrFmtTimer(_chrPause());
  e=document.getElementById('chr-c-m');if(e)e.textContent=_chrFmtDur(_chrMesure()/60000);
  e=document.getElementById('chr-c-h');if(e)e.textContent=_chrFmtDur(_chrHors()/60000);
  e=document.getElementById('chr-c-p');if(e)e.textContent=_chrFmtDur(_chrPause()/60000);
  // le passage en alerte redessine une seule fois
  var s=SESSIONS.find(function(x){return x.id===window.tracSessionId;});
  if(s&&_chrono.bloc.length){
    var bar=_chrBareme(s,_chrono.bloc);
    var al=bar>0&&(_chrCourant()/60000)>_CHR_HAUT*bar;
    var box=document.querySelector('#sd-chrono .chr-run');
    if(box&&al&&box.className.indexOf('chr-al')<0)_renderChronoBar();
  }
}
/* Etiquette portee par la ligne de parcelle. */
function _chrTag(s,p,fait,entry){
  if(!fait)return '';
  if(_chrono.bloc.indexOf(p.nom)>=0)return '<div class="sdp-tag pend">'+_mvIcon('chrono',16)+' en cours\u2026</div>';
  var ec=_chrEcart(entry);
  if(ec)return '<div class="sdp-tag ecart">'+_mvIcon('alerte',16)+' bar\u00e8me<small>'+_escHtml(_CHR_MOTIFS[ec]||'mesure \u00e9cart\u00e9e')+'</small></div>';
  var d=_chrDur(entry);
  if(d!=null){
    var sf=parseFloat(p.surface)||0,rate=sf>0?(d/sf):0,grp=_chrGrp(entry);
    return '<div class="sdp-tag mes">'+_mvIcon('chrono',16)+' '+_chrFmtRate(rate)+'<small>'+(grp>1?('groupe de '+grp):_chrFmtDur(d))+'</small></div>';
  }
  return '';
}
function _chronoSummary(s){
  var pf=s.parcellesFaites||[];
  var mes=pf.filter(function(x){return _chrDur(x)!=null;});
  var min=mes.reduce(function(a,x){return a+_chrDur(x);},0);
  var surf=mes.reduce(function(a,x){return a+_chrSurf(_chrNom(x));},0);
  var appMin=pf.reduce(function(a,x){var d=_chrDur(x);if(d!=null)return a+d;return a+_sessBaremeMin(s,_chrSurf(_chrNom(x)));},0);
  return {n:mes.length,rate:surf>0?(min/surf):null,appMin:appMin};
}
/* Bas de l'ecran : deux gestes d'une fois par jour, visibles seulement a l'arret. */
function _renderChronoJour(){
  var host=document.getElementById('sd-jour');if(!host)return;
  var s=SESSIONS.find(function(x){return x.id===window.tracSessionId;});
  if(!s||!_chronoEnabledForSession(s)||_chrono.bloc.length||_chrono.pause){host.innerHTML='';return;}
  host.innerHTML='<div class="chr-acts">'
    +'<button class="chr-act" onclick="_chrDejeuner()">'+_mvIcon('repas',18)+' Pause d\u00e9jeuner</button>'
    +'<button class="chr-act chr-act-fin" onclick="_chrFinJournee()">'+_mvIcon('lune',18)+' Fin de journ\u00e9e</button></div>';
}

function openSessionDetail(id){
  const s=SESSIONS.find(x=>x.id===id);if(!s)return;
  window.tracSessionId=id;sdShowDone=false;sdSkipMode=false;
  if(!s.parcellesFaites)s.parcellesFaites=[];
  if(!s.parcellesSkip)s.parcellesSkip=[];
  const amap=ACTIVITES.reduce((m,a)=>{m[a.nom]=a;return m},{});
  document.getElementById('sd-titre').textContent=s.activite;
  document.getElementById('sd-meta').textContent=`${_fmtDate(s.date)} · ${s.conducteur}`;
  renderSDTracEncart();
  closeSdTracPicker();
  updateSDSkipBtn();
  _chrRestaurer(id);
  renderSDParcelles();
  renderSessionProgress();
  // Zone suppression admin
  var sdAdminZone=document.getElementById('sd-admin-zone');
  if(sdAdminZone)sdAdminZone.style.display=isAdmin()?'block':'none';
  var sdDelBtn=document.getElementById('sd-del-btn');
  if(sdDelBtn){sdDelBtn.dataset.confirm='';sdDelBtn.textContent='Supprimer cette session';sdDelBtn.style.background='';sdDelBtn.style.color='';}
  _openOv('ovSessionDetail');
}
function updateSDSkipBtn(){
  const btn=document.getElementById('sd-skip-mode-btn');if(!btn)return;
  if(sdSkipMode){btn.textContent='⊘ Mode désactivation ON';btn.style.background='#C83A20';btn.style.color='white';}
  else{btn.textContent='⊘ Désactiver';btn.style.background='#F0D0C8';btn.style.color='#8B3A28';}
}
function toggleSDSkipMode(){sdSkipMode=!sdSkipMode;updateSDSkipBtn();renderSDParcelles();}
function renderSDParcelles(){
  const s=SESSIONS.find(x=>x.id===window.tracSessionId);if(!s)return;
  const actives=PARCELLES.filter(p=>p.statut!=='Arrachee');
  const done=s.parcellesFaites||[];
  const skip=s.parcellesSkip||[];
  const chronoUi=_chronoEnabledForSession(s);
  // Helper : résoudre le nom depuis string ou objet
  function _pfNom(x){return typeof x==='string'?x:(x&&x.nom)||'';}
  function _pfData(x){return (typeof x==='object'&&x&&x.data)?x.data:null;}
  const doneNoms=done.map(_pfNom);
  let toShow;
  if(sdSkipMode){
    toShow=actives.filter(p=>!doneNoms.includes(p.nom)).slice().sort((a,b)=>a.nom.localeCompare(b.nom,'fr'));
  } else {
    toShow=(sdShowDone?actives:actives.filter(p=>(!doneNoms.includes(p.nom)||_chrono.bloc.indexOf(p.nom)>=0)&&!skip.includes(p.nom))).slice();
    var _t=chronoUi?_chrTrier(s,toShow):{liste:toShow.slice().sort((a,b)=>a.nom.localeCompare(b.nom,'fr')),src:null,coupe:null};
    toShow=_t.liste; window._sdTri=_t;
  }
  const btn=document.getElementById('sd-show-done-btn');
  if(btn)btn.textContent=sdShowDone?'Masquer faites':'Voir toutes';
  if(toShow.length===0){document.getElementById('sd-parcelles').innerHTML='<div style="text-align:center;padding:24px;color:var(--texte-doux);font-size:13px">Toutes les parcelles sont cochées</div>';_renderChronoBar();return;}
  // Activité courante pour savoir si il y a un champ custom
  var act=ACTIVITES.find(function(a){return a.nom===s.activite;});
  var hasChamp=!!(act&&act.champCustom&&act.champCustom.label);
  var _tri=window._sdTri||{coupe:null,src:null};
  document.getElementById('sd-parcelles').innerHTML=toShow.map((p,idxRow)=>{
    const fait=doneNoms.includes(p.nom);
    const skipped=skip.includes(p.nom);
    const entryFaite=done.find(function(x){return _pfNom(x)===p.nom;});
    const dataFaite=entryFaite?_pfData(entryFaite):null;
    if(sdSkipMode){
      return '<div class="sdp-row '+(skipped?'sdp-skip':'')+'" data-skip="1" data-nom="'+p.nom.replace(/"/g,'&quot;')+'">'
        +'<div class="sdp-check '+(skipped?'skip':'')+'">'+( skipped?'⊘':'')+'</div>'
        +'<div class="sdp-nom" style="'+(skipped?'color:#8B4A40;text-decoration:line-through;':'')+'">'+_escHtml(p.nom)+'</div>'
        +'<div class="sdp-surf">'+p.surface+' ha</div>'
        +'<button class="sdp-skip-btn '+(skipped?'active':'inactive')+'" data-action="skip" data-nom="'+p.nom.replace(/"/g,'&quot;')+'">'+(skipped?'Réactiver':'Désactiver')+'</button>'
      +'</div>';
    } else {
      const dataHtml=fait&&dataFaite&&Object.keys(dataFaite).length
        ?'<div style="font-size:10px;color:var(--acier-med);margin-top:2px">'+Object.entries(dataFaite).map(function(kv){return _escHtml(kv[0])+' : '+_escHtml(kv[1]);}).join(' · ')+'</div>'
        :'';
      const enCours=_chrono.bloc.indexOf(p.nom)>=0;
      const ecart=_chrEcart(entryFaite);
      const sep=(_tri.coupe!=null&&idxRow===_tri.coupe)?'<div class="sdp-sep">Sans polygone \u2014 position inconnue</div>':'';
      const dist=(!fait&&typeof p._chrD==='number'&&p._chrD>0)?'<div class="sdp-dist">'+_chrFmtM(p._chrD)+'</div>':'';
      return sep+'<div class="sdp-row '+(enCours?'sdp-live':(fait?(ecart?'sdp-done sdp-bar':'sdp-done'):''))+'" data-action="coche" data-nom="'+p.nom.replace(/"/g,'&quot;')+'" style="cursor:pointer">'
        +'<div class="sdp-check '+(enCours?'live':(fait?'on':''))+'">'+(enCours?_mvIcon('chrono',16):(fait?_mvIcon('check',16):''))+'</div>'
        +'<div style="flex:1;min-width:0"><div class="sdp-nom">'+_escHtml(p.nom)+'</div>'+dataHtml+'</div>'
        +'<div class="sdp-surf">'+p.surface+' ha'+dist+'</div>'
        +(chronoUi?_chrTag(s,p,fait,entryFaite):'')
      +'</div>';
    }
  }).join('');
  // Event listeners directs (Vite-safe — pas de onclick dans innerHTML)
  var _sdEl=document.getElementById('sd-parcelles');
  _sdEl.querySelectorAll('[data-action="coche"]').forEach(function(el){
    // Appui long = ajouter au bloc en cours. Geste rare pour un cas rare : deux
    // parcelles cadastrales travaillees d'une traite, temps partage a la surface.
    var _lp=null,_tire=false;
    function _dn(){_tire=false;_lp=setTimeout(function(){_tire=true;_chrAjouterAuBloc(el.dataset.nom);},480);}
    function _up(){clearTimeout(_lp);if(!_tire)toggleSessionParcelle(el.dataset.nom,el);}
    function _cx(){clearTimeout(_lp);}
    el.addEventListener('touchstart',_dn,{passive:true});
    el.addEventListener('touchend',function(e){e.preventDefault();_up();});
    el.addEventListener('touchmove',_cx,{passive:true});
    el.addEventListener('mousedown',_dn);
    el.addEventListener('mouseup',_up);
    el.addEventListener('mouseleave',_cx);
  });
  _sdEl.querySelectorAll('[data-action="skip"]').forEach(function(el){
    el.addEventListener('click',function(e){e.stopPropagation();toggleSessionSkip(el.dataset.nom);});
  });
  _renderChronoBar();_renderChronoJour();
  var _lb=document.getElementById('sd-parc-lbl');
  if(_lb)_lb.textContent=_tri.src?('Parcelles \u2014 '+_tri.src):'Parcelles restantes';
}
function toggleSDShowDone(){sdShowDone=!sdShowDone;renderSDParcelles();}
function toggleSessionParcelle(nom,row){
  const s=SESSIONS.find(x=>x.id===window.tracSessionId);if(!s)return;
  if(!s.parcellesFaites)s.parcellesFaites=[];
  // Déterminer si c'est une coche ou une décoche
  // parcellesFaites peut contenir des strings ou des objets {nom, data}
  const idx=s.parcellesFaites.findIndex(function(x){return (typeof x==='string'?x:(x&&x.nom))===nom;});
  const estDecoche=idx>=0;
  // Bloquer nouvelle coche si tracteur en réparation (cherche par id ET par nom)
  var _stid=s.tracteurId||'';
  var _strac=TRACTEURS_LIST.find(function(t){return t.id===_stid||t.nom===_stid;});
  var _sTracId=_strac?_strac.id:_stid;
  var _sTracRep=REPARATEUR[_sTracId]||REPARATEUR[_stid]||null;
  if(!estDecoche&&_sTracRep){
    if(navigator.vibrate)navigator.vibrate([80,60,80]);
    showToast('Tracteur en répar. — Change le tracteur d\'abord','#C0392B');
    var encart=document.getElementById('sd-trac-encart');
    if(encart){
      var t=0;
      var blink=function(){encart.style.opacity=encart.style.opacity==='0.3'?'1':'0.3';t++;if(t<4)setTimeout(blink,150);else encart.style.opacity='1';};
      blink();
    }
    return;
  }
  // -- CHRONO INVERSE : toucher une parcelle DEMARRE la mesure dessus. Toucher une
  //    AUTRE parcelle cloture la premiere et demarre la seconde sans compter de
  //    deplacement. La decoche reste une decoche : on ne mesure pas un retrait.
  if(_chronoEnabledForSession(s)&&!sdSkipMode&&!estDecoche){
    _chrTapParcelle(nom);
    return;
  }
  if(estDecoche){
    s.parcellesFaites.splice(idx,1);
  if(window._recalcPlantationTrous && _recalcPlantationTrous()){ try{ _saveData('parcelles'); }catch(e){} }
    _saveData('sessions');renderSessionProgress();renderSDParcelles();
    return;
  }
  // Vérifier si l'activité a un champ custom
  var act=ACTIVITES.find(function(a){return a.nom===s.activite;});
  if(act&&act.champCustom&&act.champCustom.label){
    // Ouvrir overlay de saisie
    _ocvNomParcelle=nom;
    document.getElementById('ocv-titre').textContent='Valider — '+nom;
    var _ocvS=document.getElementById('ocv-sub');
    _ocvS.textContent=s.activite;
    _ocvS.insertAdjacentHTML('afterbegin', _mvIcon(_actIcone(act.emoji),16)+' ');
    document.getElementById('ocv-label').textContent=act.champCustom.label+' *';
    var ocvVal=document.getElementById('ocv-val');
    ocvVal.type=act.champCustom.type==='nombre'?'number':'text';
    ocvVal.placeholder=act.champCustom.type==='nombre'?'0':'Saisir…';
    ocvVal.min=0;
    ocvVal.value='';
    _openOv('ovChampValidation');
    setTimeout(function(){ocvVal.focus();},200);
    return;
  }
  // Pas de champ custom : coche directe (string)
  s.parcellesFaites.push(nom);
  _saveData('sessions');renderSessionProgress();renderSDParcelles();
}

// Variable temporaire pour stocker la parcelle en attente de validation champ
var _ocvNomParcelle=null;

function confirmerValidationChamp(){
  var val=document.getElementById('ocv-val').value.trim();
  if(!val){if(navigator.vibrate)navigator.vibrate([60,40,60]);showToast('Champ obligatoire','#C0392B');return;}
  var s=SESSIONS.find(function(x){return x.id===window.tracSessionId;});
  if(!s||!_ocvNomParcelle)return;
  if(!s.parcellesFaites)s.parcellesFaites=[];
  var act=ACTIVITES.find(function(a){return a.nom===s.activite;});
  var data={};
  if(act&&act.champCustom&&act.champCustom.label){data[act.champCustom.label]=val;}
  s.parcellesFaites.push({nom:_ocvNomParcelle,data:data});
  if(window._recalcPlantationTrous && _recalcPlantationTrous()){ try{ _saveData('parcelles'); }catch(e){} }
  var nomAff=_ocvNomParcelle;
  _ocvNomParcelle=null;
  _closeOv(null,'ovChampValidation');
  _saveData('sessions');renderSessionProgress();renderSDParcelles();
  showToast(nomAff+' validée','#3D6B27');
}
function toggleSessionSkip(nom){
  const s=SESSIONS.find(x=>x.id===window.tracSessionId);if(!s)return;
  if(!s.parcellesSkip)s.parcellesSkip=[];
  const idx=s.parcellesSkip.indexOf(nom);
  if(idx>=0){s.parcellesSkip.splice(idx,1);}else{s.parcellesSkip.push(nom);}
  _saveData('sessions');renderSessionProgress();renderSDParcelles();
}
function renderSessionProgress(){
  const s=SESSIONS.find(x=>x.id===window.tracSessionId);if(!s)return;
  const skip=s.parcellesSkip||[];
  const actives=PARCELLES.filter(p=>p.statut!=='Arrachee'&&!skip.includes(p.nom));
  const totalSurf=actives.reduce((acc,p)=>acc+(parseFloat(p.surface)||0),0);
  const doneNoms=(s.parcellesFaites||[]).map(function(x){return typeof x==='string'?x:(x&&x.nom)||'';});
  const doneSurf=actives.filter(p=>doneNoms.includes(p.nom)).reduce((acc,p)=>acc+(parseFloat(p.surface)||0),0);
  const skipCount=skip.length;
  const pct=totalSurf>0?Math.round(doneSurf/totalSurf*100):100;
  s.avancement=pct;
  const skipTxt=skipCount>0?` · ${skipCount} désactivée${skipCount>1?'s':''}` : '';
  document.getElementById('sd-progress').textContent=`${doneSurf.toFixed(2)}/${totalSurf.toFixed(2)} ha · ${pct}%${skipTxt}`;
  document.getElementById('sd-bar').style.width=pct+'%';
  if(pct===100&&s.statut==='En cours'){s.statut='Terminé';if(!s.dateFin)s.dateFin=_gnrTodayISO();}
  else if(pct<100&&s.statut==='Terminé'){s.statut='En cours';s.dateFin=null;}
  // Persister l'avancement et le statut calculés (sinon _saveData() appelé avant ce calcul perdrait les valeurs)
  _saveData('sessions');
}
function closeSessionDetail(){
  _chronoFinalizeOnClose();
  _closeOv(null,'ovSessionDetail');
  renderTracteur();
  showToast('Passage enregistré','#3D6B27');
}
function deleteSessionFromDetail(btn){
  if(!isAdmin())return;
  if(btn.dataset.confirm!=='1'){
    btn.dataset.confirm='1';
    btn.textContent='Confirmer la suppression';
    btn.style.background='var(--rouge)';
    btn.style.color='white';
    setTimeout(function(){
      if(btn.dataset.confirm==='1'){
        btn.dataset.confirm='';
        btn.textContent='Supprimer cette session';
        btn.style.background='';
        btn.style.color='';
      }
    },3000);
    return;
  }
  btn.dataset.confirm='';
  var id=window.tracSessionId;
  if(!id)return;
  var idx=SESSIONS.findIndex(function(x){return x.id===id;});
  if(idx>=0)SESSIONS.splice(idx,1);
  if(window._recalcPlantationTrous && _recalcPlantationTrous()){ try{ _saveData('parcelles'); }catch(e){} }
  window.tracSessionId=null;
  if(navigator.vibrate)navigator.vibrate([80,60,80]);
  _saveData('sessions');
  document.getElementById('ovSessionDetail').classList.remove('open');
  renderTracteur();
  showToast('Session supprimée','#C0392B');
}
function openEditSession(id){
  if(DEBUG) console.log('openEditSession appelé, id=', id, 'isAdmin=', currentUser?.roles?.includes('admin'));
  if(!(currentUser&&currentUser.roles&&currentUser.roles.includes('admin'))){showToast('Réservé à l’administrateur','#C0392B');return;}
  var s=SESSIONS.find(function(x){return x.id===id;});if(!s)return;
  document.getElementById('es-id').value=id;
  var actHtml='';
  ACTIVITES.forEach(function(a){actHtml+='<option value="'+_escAttr(a.nom)+'"'+(a.nom===s.activite?' selected':'')+'>'+_escHtml(a.nom)+'</option>';});
  document.getElementById('es-act').innerHTML=actHtml;
  document.getElementById('es-date').value=s.date;
  var _efEl=document.getElementById('es-datefin'); if(_efEl)_efEl.value=s.dateFin||'';
  var condHtml='';
  _condList().forEach(function(c){condHtml+='<div class="pchk'+(c.nom===s.conducteur?' sel acre':'')+'" onclick="pickVal(this,\'es-cond\',\'acre\')" data-val="'+_escHtml(c.nom)+'">'+_escHtml(c.nom)+'</div>';});
  document.getElementById('es-cond-pick').innerHTML=condHtml;
  document.getElementById('es-cond').value=s.conducteur;
  document.querySelectorAll('#es-st-pick .pchk').forEach(function(el){el.classList.toggle('sel',el.dataset.val===s.statut);el.classList.toggle('acre',el.dataset.val===s.statut);});
  document.getElementById('es-st').value=s.statut;
  document.getElementById('es-av').value=s.avancement||100;
  document.getElementById('es-note').value=s.note||'';
  // Tracteur
  var esTracId=document.getElementById('es-trac-id');
  if(esTracId)esTracId.value=s.tracteurId||'';
  var esAct=ACTIVITES.find(function(a){return a.nom===s.activite;});
  _fillTracPickWithId('es', s.activite, s.tracteurId||'', esAct?esAct.tracteurDefautId:'');
  var esOvLbl=document.getElementById('es-trac-override-lbl');
  if(esOvLbl&&s.tracteurOverride){
    var esDefTrac=TRACTEURS_LIST.find(function(t){return t.id===(esAct?esAct.tracteurDefautId:'');});
    esOvLbl.style.display='inline';
    esOvLbl.textContent='✱ Modifié — défaut : '+(esDefTrac?esDefTrac.nom:'—');
  } else if(esOvLbl){esOvLbl.style.display='none';}
  _updateTracRepAlert('es', s.tracteurId||'');
  _openOv('ovEditSession');
}
function saveEditSession(){
  const id=document.getElementById('es-id').value;
  const s=SESSIONS.find(x=>x.id===id);if(!s)return;
  s.activite=_actNomDuSelect('es-act');
  s.date=document.getElementById('es-date').value;
  var _efEl=document.getElementById('es-datefin'); var _ef=_efEl?_efEl.value:'';
  const condVal=document.getElementById('es-cond').value;
  if(condVal)s.conducteur=condVal;
  s.statut=document.getElementById('es-st').value;
  if(s.statut==='Terminé'){ s.dateFin=_ef||s.dateFin||s.date; } else { s.dateFin=null; }
  s.avancement=parseInt(document.getElementById('es-av').value)||100;
  s.note=document.getElementById('es-note').value;
  var newTracId=document.getElementById('es-trac-id')?document.getElementById('es-trac-id').value:s.tracteurId||'';
  var esAct=ACTIVITES.find(function(a){return a.nom===s.activite;});
  s.tracteurId=newTracId;
  s.tracteurOverride=newTracId!==(esAct?esAct.tracteurDefautId:'');
  _saveData('sessions');
  _closeOv(null,'ovEditSession');
  renderTracteur();
  showToast('Session modifiée','#3D6B27');
}
function confirmDeleteSession(btn){
  if(btn.dataset.confirm==='1'){
    deleteSession();
  } else {
    btn.dataset.confirm='1';
    btn.textContent='Confirmer la suppression';
    btn.style.background='var(--rouge)';
    btn.style.color='white';
    setTimeout(function(){
      btn.dataset.confirm='';
      btn.textContent='Supprimer cette session';
      btn.style.background='';
      btn.style.color='';
    }, 3000);
  }
}
function deleteSession(){
  const id=document.getElementById('es-id').value;
  if(DEBUG) console.log('deleteSession appelé, id=', id);
  const s=SESSIONS.find(x=>x.id===id);
  if(DEBUG) console.log('session trouvée=', s);
  if(!s)return;
  const idx=SESSIONS.findIndex(x=>x.id===id);
  if(navigator.vibrate)navigator.vibrate([80,60,80]);
  if(idx>=0)SESSIONS.splice(idx,1);
  _saveData('sessions', 'Session supprimée');
  document.getElementById('ovEditSession').classList.remove('open');
  renderTracteur();
}
function pickCond(el){var parent=el.parentElement;parent.querySelectorAll('.pchk').forEach(function(x){x.classList.remove('sel','acre');});el.classList.add('sel','acre');}
function openTracAdd(){
  if(isTractoriste()){ _openOv('ovTracAdd'); return; }
  if(isAdmin() && window.openOvTraitement){ window.openOvTraitement(); return; }
}

function openNewSession(){
  if(DEBUG) console.log('openNewSession appelé, currentUser=', currentUser, 'isTractoriste=', isTractoriste());
  if(!isTractoriste()){showToast('Réservé aux tractoristes','#C0392B');return;}
  var actHtml='';
  ACTIVITES.forEach(function(a){actHtml+='<option value="'+_escAttr(a.nom)+'">'+_escHtml(a.nom)+'</option>';});
  document.getElementById('s-act').innerHTML=actHtml;
  var condHtml='';
  _condList().forEach(function(c,i){condHtml+='<div class="pchk'+(i===0?' sel acre':'')+'" onclick="pickCond(this)">'+_escHtml(c.nom)+'</div>';});
  document.getElementById('s-cond-pick').innerHTML=condHtml;
  document.getElementById('s-date').value=new Date().toISOString().split('T')[0];
  document.getElementById('s-note').value='';
  // Tracteur par défaut pour la première activité
  if(document.getElementById('s-trac-id'))document.getElementById('s-trac-id').value='';
  if(document.getElementById('s-trac-override'))document.getElementById('s-trac-override').value='0';
  _fillTracPick('s', ACTIVITES[0]?ACTIVITES[0].nom:'');
  _openOv('ovSession');
}
function onSessionActChange(){
  var actNom=_actNomDuSelect('s-act');
  if(document.getElementById('s-trac-id'))document.getElementById('s-trac-id').value='';
  _fillTracPick('s', actNom);
  // Vérifier si le tracteur défaut est en répar → bloquer avec modal
  var act=ACTIVITES.find(function(a){return a.nom===actNom;});
  if(act&&REPARATEUR[act.tracteurDefautId]){
    if(navigator.vibrate)navigator.vibrate([80,60,80]);
    _openRepBlock(actNom,act.tracteurDefautId);
  }
}

// ── Blocage répar création session ──────────────────────────────────
var _rbPfx='s'; // préfixe overlay source (toujours 's' pour nouvelle session)
var _rbSelTracId=null;

function _openRepBlock(actNom,defTracId){
  var act=ACTIVITES.find(function(a){return a.nom===actNom;});
  var trac=TRACTEURS_LIST.find(function(t){return t.id===defTracId;});
  var rep=REPARATEUR[defTracId]||{};
  // Titre
  document.getElementById('rb-titre').textContent=actNom;
  document.getElementById('rb-sub').textContent=(trac?trac.nom:'')+(trac&&trac.modele?' — '+trac.modele:'')+' est chez le réparateur';
  // Info répar
  var infoEl=document.getElementById('rb-info');
  infoEl.innerHTML='<div style="font-size:12px;color:var(--rouge,#E07070);font-weight:600;margin-bottom:4px">'+_escHtml(rep.motif||'Réparation en cours')+'</div>'
    +'<div style="font-size:11px;color:rgba(255,255,255,0.45)">Depuis le '+_fmtDate(rep.depuis||'')+(rep.prevu_retour?' · Retour prévu le '+_fmtDate(rep.prevu_retour):'')+'</div>';
  // Liste alternatifs
  var eligible=actNom==='Traitement'
    ?TRACTEURS_LIST.filter(function(t){return t.traitementOnly&&t.id!==defTracId;})
    :TRACTEURS_LIST.filter(function(t){return !t.traitementOnly&&t.id!==defTracId;});
  if(!eligible.length)eligible=TRACTEURS_LIST.filter(function(t){return t.id!==defTracId;});
  _rbSelTracId=null;
  var listEl=document.getElementById('rb-trac-list');
  listEl.innerHTML=eligible.map(function(t){
    var col=couleurTracType(t.type);
    var rep2=REPARATEUR[t.id];
    return '<div class="sd-trac-sheet-btn" data-tracid="'+t.id+'" onclick="_rbPick(this,\''+t.id+'\',\''+actNom+'\',\''+defTracId+'\')">'
      +'<div class="sd-trac-sheet-radio"></div>'
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:14px;font-weight:500;color:'+(rep2?'#E07070':'rgba(255,255,255,0.85)')+'">'+_escHtml(t.nom)+(t.modele?'<span style="font-weight:400;font-size:12px;margin-left:6px;color:rgba(255,255,255,0.4)">'+_escHtml(t.modele)+'</span>':'')+' </div>'
        +'<div style="font-size:11px;margin-top:2px;color:'+col+'">'+_escHtml(t.type)+(rep2?' · <span style="color:var(--rouge,#E07070)">En répar.</span>':'')+'</div>'
      +'</div>'
    +'</div>';
  }).join('');
  document.getElementById('rb-confirm-btn').disabled=true;
  document.getElementById('rb-warn').style.display='none';
  _openOv('ovRepBlock');
}

function _rbPick(el,tracId,actNom,defTracId){
  if(navigator.vibrate)navigator.vibrate(40);
  _rbSelTracId=tracId;
  // Mettre à jour visuellement
  document.querySelectorAll('#rb-trac-list .sd-trac-sheet-btn').forEach(function(b){
    var sel=b.dataset.tracid===tracId;
    b.classList.toggle('sel',sel);
    var radio=b.querySelector('.sd-trac-sheet-radio');
    if(radio){window._mvSetIcon(radio, sel?'check':'', 15);radio.style.background=sel?'var(--acier)':'transparent';radio.style.borderColor=sel?'var(--acier)':'rgba(255,255,255,0.2)';}
  });
  // Avertissement si choix lui-même en répar
  var rep=REPARATEUR[tracId];
  var warnEl=document.getElementById('rb-warn');
  if(rep){
    warnEl.style.display='block';
    document.getElementById('rb-warn-txt').textContent=(rep.motif||'Réparation')+(rep.prevu_retour?' · Retour prévu '+_fmtDate(rep.prevu_retour):'');
  } else { warnEl.style.display='none'; }
  document.getElementById('rb-confirm-btn').disabled=false;
}

function saveRepBlockChoice(){
  if(!_rbSelTracId)return;
  if(navigator.vibrate)navigator.vibrate(60);
  // Appliquer le tracteur choisi dans l'overlay de session
  var hidId=document.getElementById('s-trac-id');
  var hidOv=document.getElementById('s-trac-override');
  var actNom=_actNomDuSelect('s-act');
  var act=ACTIVITES.find(function(a){return a.nom===actNom;});
  if(hidId)hidId.value=_rbSelTracId;
  if(hidOv)hidOv.value=(act&&_rbSelTracId!==act.tracteurDefautId)?'1':'0';
  var ovLbl=document.getElementById('s-trac-override-lbl');
  if(ovLbl){
    var defTrac=act?TRACTEURS_LIST.find(function(t){return t.id===act.tracteurDefautId;}):null;
    ovLbl.style.display='inline';
    ovLbl.textContent='✱ Modifié — défaut : '+(defTrac?defTrac.nom:'—');
  }
  _fillTracPickWithId('s', actNom, _rbSelTracId, act?act.tracteurDefautId:'');
  _updateTracRepAlert('s', _rbSelTracId);
  document.getElementById('ovRepBlock').classList.remove('open');
  var trac=TRACTEURS_LIST.find(function(t){return t.id===_rbSelTracId;});
  showToast('Tracteur changé → '+(trac?trac.nom:''),'#E07B2A');
}

function closeRepBlock(){
  if(navigator.vibrate)navigator.vibrate(40);
  document.getElementById('ovRepBlock').classList.remove('open');
  // Remettre la sélection sur le premier tracteur dispo
  var actNom=_actNomDuSelect('s-act');
  _fillTracPick('s',actNom);
}

// ── Picker tracteur sur session EN COURS ──────────────────────────────
var _sdPickerSelId=null;

function renderSDTracEncart(){
  var encart=document.getElementById('sd-trac-encart');
  if(!encart)return;
  if(!isTractoriste()){encart.style.display='none';return;}
  var s=SESSIONS.find(function(x){return x.id===window.tracSessionId;});
  if(!s){encart.style.display='none';return;}
  // Chercher le tracteur : par id OU par nom (Firebase stocke parfois le nom comme id)
  var tid=s.tracteurId||'';
  var trac=TRACTEURS_LIST.find(function(t){return t.id===tid||t.nom===tid;});
  // tracId = clé réelle à utiliser pour REPARATEUR (id si trouvé, sinon la valeur brute)
  var tracId=trac?trac.id:tid;
  // Tracteur défaut de l'activité — même logique de résolution
  var act=ACTIVITES.find(function(a){return a.nom===s.activite;});
  var defRaw=act?act.tracteurDefautId:'';
  var defTrac=TRACTEURS_LIST.find(function(t){return t.id===defRaw||t.nom===defRaw;});
  var defId=defTrac?defTrac.id:defRaw;
  // Override : le tracteur utilisé est différent du défaut (comparaison sur IDs résolus)
  var isOverride=tracId&&defId&&tracId!==defId;
  // Réparateur : chercher par tracId ET par tid (couvre tous les formats de clé Firebase)
  var tracRep=REPARATEUR[tracId]||REPARATEUR[tid]||null;
  // Nom affiché : si nom===modele, afficher juste le nom une fois
  var tracNomAff=trac
    ?(trac.modele&&trac.modele!==trac.nom?trac.nom+' — '+trac.modele:trac.nom)
    :(tid||'—');
  var col=trac?couleurTracType(trac.type):'#888';
  var repKey=tracId||tid;
  var cls=tracRep?'sd-trac-encart is-rep':isOverride?'sd-trac-encart is-override':'sd-trac-encart';
  var nomCls=tracRep?'sd-trac-encart-nom is-rep':isOverride?'sd-trac-encart-nom is-override':'sd-trac-encart-nom';
  var sub=tracRep
    ?'Chez le réparateur · Retour '+_fmtDate((tracRep).prevu_retour||'')
    :isOverride
    ?'✱ Override — défaut : '+(defTrac?defTrac.nom:(defRaw||'—'))
    :'Tracteur dédié '+s.activite;
  var btnCls=tracRep?'sd-trac-changer-btn is-rep':'sd-trac-changer-btn';
  var dot='<div style="width:9px;height:9px;border-radius:50%;background:'+col+';flex-shrink:0;margin-top:1px"></div>';
  encart.className=cls;
  encart.style.display='flex';
  encart.innerHTML=dot
    +'<div class="sd-trac-encart-info">'
      +'<div class="'+nomCls+'">'+tracNomAff+(tracRep?'':'')+'</div>'
      +'<div class="sd-trac-encart-sub">'+sub+'</div>'
    +'</div>'
    +'<button class="'+btnCls+'" onclick="openSdTracPicker()">Changer</button>';
}

function openSdTracPicker(){
  if(navigator.vibrate)navigator.vibrate(40);
  var s=SESSIONS.find(function(x){return x.id===window.tracSessionId;});
  if(!s)return;
  var act=ACTIVITES.find(function(a){return a.nom===s.activite;});
  var defId=act?act.tracteurDefautId:'';
  var actNom=s.activite;
  // Sous-titre
  document.getElementById('sd-picker-sub').textContent='Session en cours · '+actNom;
  // Liste tracteurs éligibles
  var eligible=actNom==='Traitement'
    ?TRACTEURS_LIST.filter(function(t){return t.traitementOnly;})
    :TRACTEURS_LIST.filter(function(t){return !t.traitementOnly;});
  if(!eligible.length)eligible=TRACTEURS_LIST.slice();
  _sdPickerSelId=s.tracteurId;
  var listEl=document.getElementById('sd-trac-picker-list');
  listEl.innerHTML=eligible.map(function(t){
    var sel=t.id===s.tracteurId;
    var col=couleurTracType(t.type);
    var rep=REPARATEUR[t.id];
    var isDefaut=t.id===defId;
    return '<div class="sd-trac-sheet-btn'+(sel?' sel':'')+'" data-tracid="'+t.id+'" onclick="_sdPickTrac(this,\''+t.id+'\')">'
      +'<div class="sd-trac-sheet-radio"'+(sel?' style="border-color:var(--acier);background:var(--acier)"':'')+'>'+(sel?_mvIcon('check',16):'')+'</div>'
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:14px;font-weight:'+(sel?'700':'500')+';color:'+(rep?'#E07070':sel?'var(--acier)':'rgba(255,255,255,0.8)')+'">'+_escHtml(t.nom)+(t.modele?'<span style="font-weight:400;font-size:12px;margin-left:6px;color:rgba(255,255,255,0.4)">'+_escHtml(t.modele)+'</span>':'')+'</div>'
        +'<div style="font-size:11px;margin-top:2px;display:flex;gap:6px"><span style="color:'+col+'">'+t.type+'</span>'+(isDefaut?'<span style="color:rgba(255,255,255,0.3)">· Défaut '+actNom+'</span>':'')+(rep?'<span style="color:var(--rouge,#E07070)">· En répar.</span>':'')+'</div>'
      +'</div>'
      +(sel?'<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:6px;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.4)">Actuel</span>':'')
    +'</div>';
  }).join('');
  document.getElementById('sd-trac-confirm-btn').disabled=true;
  document.getElementById('sd-trac-picker-warn').style.display='none';
  // Afficher l'overlay
  var ov=document.getElementById('sd-trac-picker-overlay');
  ov.style.display='flex';
}

function _sdPickTrac(el,tracId){
  if(navigator.vibrate)navigator.vibrate(40);
  var s=SESSIONS.find(function(x){return x.id===window.tracSessionId;});
  if(!s)return;
  _sdPickerSelId=tracId;
  document.querySelectorAll('#sd-trac-picker-list .sd-trac-sheet-btn').forEach(function(b){
    var sel=b.dataset.tracid===tracId;
    b.classList.toggle('sel',sel);
    var radio=b.querySelector('.sd-trac-sheet-radio');
    if(radio){window._mvSetIcon(radio, sel?'check':'', 15);radio.style.background=sel?'var(--acier)':'transparent';radio.style.borderColor=sel?'var(--acier)':'rgba(255,255,255,0.2)';}
  });
  // Warning si en répar
  var rep=REPARATEUR[tracId];
  var warnEl=document.getElementById('sd-trac-picker-warn');
  if(rep){
    warnEl.style.display='block';
    document.getElementById('sd-picker-warn-txt').textContent=(rep.motif||'')+(rep.prevu_retour?' · Retour prévu '+_fmtDate(rep.prevu_retour):'');
  } else { warnEl.style.display='none'; }
  // Désactiver confirm si même tracteur
  document.getElementById('sd-trac-confirm-btn').disabled=(tracId===s.tracteurId);
}

function saveSdTracPicker(){
  if(!_sdPickerSelId)return;
  var s=SESSIONS.find(function(x){return x.id===window.tracSessionId;});
  if(!s)return;
  var act=ACTIVITES.find(function(a){return a.nom===s.activite;});
  var defId=act?act.tracteurDefautId:'';
  s.tracteurId=_sdPickerSelId;
  s.tracteurOverride=(_sdPickerSelId!==defId);
  _saveData('sessions');
  closeSdTracPicker();
  renderSDTracEncart();
  renderTracteur();
  var trac=TRACTEURS_LIST.find(function(t){return t.id===_sdPickerSelId;});
  showToast('Tracteur changé → '+(trac?trac.nom:''),'#3D6B27');
}

function closeSdTracPicker(){
  if(navigator.vibrate)navigator.vibrate(40);
  var ov=document.getElementById('sd-trac-picker-overlay');
  if(ov)ov.style.display='none';
}
// Remplit le sélecteur tracteur dans un overlay
function _fillTracPick(pfx, actNom){
  var act=ACTIVITES.find(function(a){return a.nom===actNom;});
  var defId=act?act.tracteurDefautId:(TRACTEURS_LIST[0]?TRACTEURS_LIST[0].id:'');
  var hidId=document.getElementById(pfx+'-trac-id');
  var curId=(hidId&&hidId.value)?hidId.value:defId;
  // S'assurer que curId est dans les éligibles
  var eligible=actNom==='Traitement'
    ?TRACTEURS_LIST.filter(function(t){return t.traitementOnly;})
    :TRACTEURS_LIST.filter(function(t){return !t.traitementOnly;});
  if(!eligible.length)eligible=TRACTEURS_LIST.slice();
  if(!eligible.find(function(t){return t.id===curId;}))curId=eligible[0]?eligible[0].id:'';
  if(hidId)hidId.value=curId;
  var hidOv=document.getElementById(pfx+'-trac-override');
  if(hidOv)hidOv.value=(curId!==defId)?'1':'0';
  var ovLbl=document.getElementById(pfx+'-trac-override-lbl');
  if(ovLbl){
    var defTrac=TRACTEURS_LIST.find(function(t){return t.id===defId;});
    ovLbl.style.display=(curId!==defId)?'inline':'none';
    ovLbl.textContent='✱ Modifié — défaut : '+(defTrac?defTrac.nom:'—');
  }
  _fillTracPickWithId(pfx, actNom, curId, defId);
  _updateTracRepAlert(pfx, curId);
}
function _fillTracPickWithId(pfx, actNom, selId, defId){
  var tracBtnEl=document.getElementById(pfx+'-trac-pick');
  if(!tracBtnEl)return;
  var eligible=actNom==='Traitement'
    ?TRACTEURS_LIST.filter(function(t){return t.traitementOnly;})
    :TRACTEURS_LIST.filter(function(t){return !t.traitementOnly;});
  if(!eligible.length)eligible=TRACTEURS_LIST.slice();
  tracBtnEl.innerHTML=eligible.map(function(t){
    var sel=t.id===selId;
    var rep=REPARATEUR[t.id];
    var col=couleurTracType(t.type);
    var isDefaut=t.id===defId;
    return '<div class="trac-sel-btn'+(sel?' selected':'')+'" data-pfx="'+pfx+'" data-tracid="'+t.id+'" data-defid="'+defId+'"'+(sel?' style="border-color:'+col+';background:'+col+'18"':'')+'>'+
      '<div style="display:flex;align-items:center;gap:10px">'+
        '<div class="trac-sel-radio"'+(sel?' style="border-color:'+col+';background:'+col+'"':'')+'>'+(sel?_mvIcon('check',16):'')+'</div>'+
        '<div>'+
          '<div style="font-size:13px;font-weight:'+(sel?'700':'500')+';color:'+(sel?'var(--texte)':'var(--texte-doux)')+'">'+_escHtml(t.nom)+' — '+_escHtml(t.modele)+'</div>'+
          '<div style="font-size:10px;color:'+col+'">'+t.type+(isDefaut?' · Défaut pour '+actNom:'')+'</div>'+
        '</div>'+
      '</div>'+
      (rep?'<span style="font-size:10px;font-weight:600;background:var(--rouge-pale);color:var(--rouge);border-radius:6px;padding:2px 8px">En répar.</span>':'')+
      ((!rep&&isDefaut)?'<span style="font-size:10px;background:var(--acier-pale);color:var(--acier-med);border-radius:6px;padding:2px 8px">Défaut</span>':'')+
    '</div>';
  }).join('');
  tracBtnEl.querySelectorAll('.trac-sel-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      _pickTrac(this.dataset.pfx, this.dataset.tracid, this.dataset.defid);
    });
  });
}
function _pickTrac(pfx, id, defId){
  var hidId=document.getElementById(pfx+'-trac-id');
  var hidOv=document.getElementById(pfx+'-trac-override');
  var ovLbl=document.getElementById(pfx+'-trac-override-lbl');
  if(hidId)hidId.value=id;
  if(hidOv)hidOv.value=(id!==defId)?'1':'0';
  if(ovLbl){
    var defTrac=TRACTEURS_LIST.find(function(t){return t.id===defId;});
    ovLbl.style.display=(id!==defId)?'inline':'none';
    ovLbl.textContent='✱ Modifié — défaut : '+(defTrac?defTrac.nom:'—');
  }
  var actNom=_actNomDuSelect(pfx+'-act');
  _fillTracPickWithId(pfx, actNom, id, defId);
  _updateTracRepAlert(pfx, id);
}
function _updateTracRepAlert(pfx, id){
  var alertEl=document.getElementById(pfx+'-trac-rep-alert');
  if(!alertEl)return;
  var rep=id?REPARATEUR[id]:null;
  var trac=TRACTEURS_LIST.find(function(t){return t.id===id;});
  if(rep&&trac){
    alertEl.style.display='block';
    alertEl.innerHTML='<strong>'+_escHtml(trac.nom)+'</strong> est actuellement chez le réparateur ('+_escHtml(rep.motif)+'). La session sera créée et signalée dans les exports.';
  } else {
    alertEl.style.display='none';
  }
}
function pickEmoji(el){document.querySelectorAll('#emoji-pick .pchk').forEach(x=>{x.classList.remove('sel','acre');});el.classList.add('sel','acre');window.selEmoji=el.dataset.val;}
function saveSession(){
  if(!isTractoriste()){showToast('Réservé aux tractoristes','#C0392B');return;}
  var a=_actNomDuSelect('s-act');
  const date=document.getElementById('s-date').value;
  if(!date){showToast('Date obligatoire','#B85A1A');var _dEl=document.getElementById('s-date');if(_dEl&&_dEl.focus)_dEl.focus();return;}
  const condEl=document.querySelector('#s-cond-pick .pchk.sel');
  var tracteurId=document.getElementById('s-trac-id')?document.getElementById('s-trac-id').value:'';
  if(!tracteurId&&TRACTEURS_LIST.length)tracteurId=TRACTEURS_LIST[0].id;
  var act=ACTIVITES.find(function(x){return x.nom===a;});
  var tracteurOverride=tracteurId!==act?.tracteurDefautId;
  SESSIONS.push({
    id:Date.now().toString(16),
    saison:_saisonForDate(date),
    activite:a,
    date:date,
    conducteur:condEl?condEl.textContent.trim():(_condList()[0]?_condList()[0].nom:''),
    statut:'En cours',
    avancement:0,
    parcellesFaites:[],
    tracteurId:tracteurId,
    tracteurOverride:tracteurOverride,
    note:document.getElementById('s-note').value
  });
  _saveData('sessions');
  _closeOv(null,'ovSession');
  renderTracteur();
  showToast('Session '+(a||'')+ ' démarrée','#2C3E50');
}
function saveActivite(){
  if(!isAdmin()){showToast('Réservé aux administrateurs','#C0392B');return;}
  var nom=document.getElementById('new-act').value.trim();
  if(!nom){showToast('Nom obligatoire','#B85A1A');var _nEl=document.getElementById('new-act');if(_nEl&&_nEl.focus)_nEl.focus();return;}
  var tracId=document.getElementById('new-act-trac').value;
  if(!tracId&&TRACTEURS_LIST.length){tracId=(TRACTEURS_LIST.find(function(t){return !t.traitementOnly;})||TRACTEURS_LIST[0]).id;}
  var champActif=document.getElementById('new-act-champ-actif').value==='1';
  var champLabel=(document.getElementById('new-act-champ-label').value||'').trim();
  var champType=document.getElementById('new-act-champ-type-val').value||'nombre';
  var champCustom=(champActif&&champLabel)?{label:champLabel,type:champType}:null;
  var emojiBtn=document.getElementById('new-act-emoji-btn');
  // Le bouton porte desormais une ICONE (lot DS-1) : son textContent est vide.
  // La valeur enregistree reste un emoji, rangee dans data-emoji — les <option>
  // de ce module ne peuvent pas contenir de SVG. Le repli couvre l'ancien HTML.
  var emoji=(emojiBtn&&(emojiBtn.dataset.emoji||emojiBtn.textContent.trim()))||'\u{1F69C}';
  ACTIVITES.push({nom:nom,emoji:emoji,tracteurDefautId:tracId,champCustom:champCustom});
  window.ACTIVITES=ACTIVITES;
  _saveData('activites');
  _closeOv(null,'ovActivite');
  document.getElementById('new-act').value='';
  renderActTracList();
  renderTracteur();
  showToast('Activité "'+nom+'" créée','#3D6B27');
}
function openAddConducteur(){
  if(typeof isAdmin==='function' && !isAdmin()){ if(window.showToast)showToast('Réservé aux administrateurs','#C0392B'); return; }
  _openOv('ovConducteur');
}
function saveConducteur(){
  if(typeof isAdmin==='function' && !isAdmin()){ if(window.showToast)showToast('Réservé aux administrateurs','#C0392B'); return; }
  const nom=document.getElementById('new-cond').value.trim();
  if(!nom){showToast('Prénom obligatoire','#B85A1A');var _cEl=document.getElementById('new-cond');if(_cEl&&_cEl.focus)_cEl.focus();return;}
  CONDUCTEURS.push({nom,statut:document.getElementById('nc-st').value});
  _saveData('conducteurs');
  document.getElementById('ovConducteur').classList.remove('open');
  document.getElementById('new-cond').value='';
  renderTracteur();
}
function editCond(nom){
  if(!isAdmin()){return;} // lecture seule pour tous sauf admin
  const c=CONDUCTEURS.find(x=>x.nom===nom);if(!c)return;
  document.getElementById('ec-title').textContent=nom;
  document.getElementById('ec-nom').value=nom;
  document.querySelectorAll('#ec-st-pick .pchk').forEach(el=>{el.classList.toggle('sel',el.dataset.val===c.statut);el.classList.toggle('acre',el.dataset.val===c.statut);});
  document.getElementById('ec-st').value=c.statut;
  _openOv('ovEditCond');
}
function saveEditCond(){if(!isAdmin())return;const nom=document.getElementById('ec-nom').value;const c=CONDUCTEURS.find(x=>x.nom===nom);if(c)c.statut=document.getElementById('ec-st').value;_saveData('conducteurs','Conducteur mis à jour');document.getElementById('ovEditCond').classList.remove('open');renderTracteur();}
function deleteCond(){const nom=document.getElementById('ec-nom').value;if(nom==='Nico'){showToast('Impossible — admin protégé','#C0392B');return;}_openConfirmDel('Supprimer '+nom+' ?','Ce conducteur sera retiré de la liste.',function(){CONDUCTEURS=CONDUCTEURS.filter(c=>c.nom!==nom);window.CONDUCTEURS=CONDUCTEURS;_saveData('conducteurs');_closeOv(null,'ovEditCond');renderTracteur();showToast(nom+' supprimé','#C0392B');});}


// ── Exposition window.* ──
window.catSub = catSub;
window.ephyRender = ephyRender;
window.ephySetType = ephySetType;
window.ephyClear = ephyClear;
window.ephyToggleKo = ephyToggleKo;
window.openEphyDetail = openEphyDetail;
window.renderCatalogueTrac = renderCatalogueTrac;
window.renderPhytoTrac = renderPhytoTrac;
window.switchTracOnglet = switchTracOnglet;
window.renderTracParcPills = renderTracParcPills;
window.renderEntTracFilter = renderEntTracFilter;
window.getTracteurSel = getTracteurSel;
window.couleurTracType = couleurTracType;
window.renderTracTabs = renderTracTabs;
window.selectTracteur = selectTracteur;
window.renderTracInfoBar = renderTracInfoBar;
window.todayStr = todayStr;
window.addDays = addDays;
window._openOv = _openOv;
window.renderRepBanner = renderRepBanner;
window.renderRepHist = renderRepHist;
window.delRepHist = delRepHist;
window.openReparateur = openReparateur;
window.saveReparateur = saveReparateur;
window.retourReparateur = retourReparateur;
window.saveReporter = saveReporter;
// window._swNotify — exposé par utils.js (Patch 3)
window.checkRepNotifications = checkRepNotifications;
window.openOvEntretien = openOvEntretien;
window.toggleEntBtn = toggleEntBtn;
window.confirmEntretien = confirmEntretien;
window.saveEntretien = saveEntretien;
window.toggleEntAnoTraitee = toggleEntAnoTraitee;
window.onEntAnomalieInput = onEntAnomalieInput;
window.toggleAnomalieTraitee = toggleAnomalieTraitee;
window.renderEntretiens = renderEntretiens;
window.openGnrEdit = openGnrEdit;
window.saveGnr = saveGnr;
window.openGnrAppoint = openGnrAppoint;
window.saveGnrAppoint = saveGnrAppoint;
window.cancelGnrEdit = cancelGnrEdit;
window.openPlein = openPlein;
window.savePleinFiche = savePleinFiche;
window.openGnrCorr = openGnrCorr;
window.saveGnrCorr = saveGnrCorr;
window.cancelGnrAct = cancelGnrAct;
window.openRevEdit = openRevEdit;
window.saveRev = saveRev;
window.cancelRevEdit = cancelRevEdit;
window.openListeFiches = openListeFiches;
window.renderListeFiches = renderListeFiches;
window.deleteFiche = deleteFiche;
window.openOvEditFiche = openOvEditFiche;
window.toggleEfAnoTraitee = toggleEfAnoTraitee;
window.onEfAnomalieInput = onEfAnomalieInput;
window.saveEditFiche = saveEditFiche;
window.renderTracteurSet = renderTracteurSet;
window.pickTracType = pickTracType;
window.pickTracTypeEdit = pickTracTypeEdit;
window.toggleTracTrait = toggleTracTrait;
window.updateTracTraitBtn = updateTracTraitBtn;
window.saveAddTracteur = saveAddTracteur;
window.openEditTracteur = openEditTracteur;
window.saveEditTracteur = saveEditTracteur;
window.deleteTracteur = deleteTracteur;
window.renderTracteur = renderTracteur;
window._fillNewSessionForm = _fillNewSessionForm;
window.openSessionDetail = openSessionDetail;
window.updateSDSkipBtn = updateSDSkipBtn;
window.toggleSDSkipMode = toggleSDSkipMode;
window.renderSDParcelles = renderSDParcelles;
window.toggleSDShowDone = toggleSDShowDone;
window.toggleSessionParcelle = toggleSessionParcelle;
window.confirmerValidationChamp = confirmerValidationChamp;
window.toggleSessionSkip = toggleSessionSkip;
window.renderSessionProgress = renderSessionProgress;
window.closeSessionDetail = closeSessionDetail;
window.deleteSessionFromDetail = deleteSessionFromDetail;
window.openEditSession = openEditSession;
window.saveEditSession = saveEditSession;
window.confirmDeleteSession = confirmDeleteSession;
window.deleteSession = deleteSession;
window.pickCond = pickCond;
window.openNewSession = openNewSession;
window.openTracAdd = openTracAdd;
window.onSessionActChange = onSessionActChange;
window._openRepBlock = _openRepBlock;
window._rbPick = _rbPick;
window.saveRepBlockChoice = saveRepBlockChoice;
window.closeRepBlock = closeRepBlock;
window.renderSDTracEncart = renderSDTracEncart;
window.openSdTracPicker = openSdTracPicker;
window._sdPickTrac = _sdPickTrac;
window.saveSdTracPicker = saveSdTracPicker;
window.closeSdTracPicker = closeSdTracPicker;
window._fillTracPick = _fillTracPick;
window._fillTracPickWithId = _fillTracPickWithId;
window._pickTrac = _pickTrac;
window._updateTracRepAlert = _updateTracRepAlert;
window.pickEmoji = pickEmoji;
window.saveSession = saveSession;
window.saveActivite = saveActivite;

// ── Heures TRACTEUR estimées sur une SAISON, au barème h/ha par activité (pour Rapport & Pilotage). ──
// = Σ sur les sessions de la saison de (surface travaillée × h/ha de l'activité).
// La surface d'une session = somme des surfaces des parcelles de parcellesFaites (comme le calcul d'avancement).
// Une activité sans h_ha (ou h_ha=0) ne compte pas → le tracteur reste alors fondu dans « Autres » (règle voulue).
// Renvoie un nombre d'heures (0 si aucun barème saisi). Ne dépend pas de _VISU_SAISON : filtre par la saison passée.
function _tractHoursSeason(s){
  if(!s)return 0;
  var seasonNom=(s&&s.nom)?s.nom:s;
  var sess=window.SESSIONS||[], acts=window.ACTIVITES||[], parcs=window.PARCELLES||[];
  function _pfNom(x){return (typeof x==='string')?x:((x&&x.nom)||'');}
  function _inSeason(se){
    var sn=(window._saisonForDate&&se.date)?window._saisonForDate(se.date):null;
    sn=sn||se.saison||'';
    if(sn)return sn===seasonNom;
    return seasonNom===(((window.getSaisonActive&&window.getSaisonActive())||{}).nom||'');
  }
  var total=0;
  sess.forEach(function(se){
    if(!se||!_inSeason(se))return;
    var act=acts.find(function(a){return a&&a.nom===se.activite;});
    var hha=act?(parseFloat(act.h_ha)||0):0;
    (se.parcellesFaites||[]).forEach(function(x){
      var d=(x&&typeof x==='object'&&typeof x.dmin==='number')?x.dmin:null;
      if(d!=null){ total+=d/60; return; }
      if(hha<=0)return;
      var nom=_pfNom(x);
      var p=parcs.find(function(pp){return pp&&pp.nom===nom;});
      total+=(p?(parseFloat(p.surface)||0):0)*hha;
    });
  });
  return Math.round(total*10)/10;
}
window._tractHoursSeason=_tractHoursSeason;
// L'app peut etre evincee de la memoire a tout instant (ecran verrouille dans une
// cabine). L'etat du chrono part sur disque a chaque sortie, jamais a la fermeture
// de l'ecran seulement.
window.addEventListener('pagehide', function(){ _chrSave(); });
document.addEventListener('visibilitychange', function(){ if(document.hidden) _chrSave(); });

window._chrTapParcelle=_chrTapParcelle;
window._chrAjouterAuBloc=_chrAjouterAuBloc;
window._chrFini=_chrFini;
window._chrInterrompre=_chrInterrompre;
window._chrDejeuner=_chrDejeuner;
window._chrReprendre=_chrReprendre;
window._chrFinJournee=_chrFinJournee;
window.saveConducteur = saveConducteur;
window.openAddConducteur = openAddConducteur;
window.editCond = editCond;
window.saveEditCond = saveEditCond;
window.deleteCond = deleteCond;