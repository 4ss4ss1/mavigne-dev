// ════════════════════════════════════
// MA VIGNE — phyto.js
// Assistant de traitement phytosanitaire + référentiel E-Phy + registre + budget cuivre
// Extrait d'app.js (MAINT-1) — iso-comportement, aucune logique modifiée.
// © 2026 Nicolas GUERET / GUERETTECH
// ════════════════════════════════════

// Fonctions pures importées d'utils.js (mêmes exports que tracteur.js)
import { isAdmin, isTractoriste, showToast, _escHtml, _escAttr, dreEffectif, _mvIcon } from './utils.js';

// Flag debug (console.log silencieux en prod) — const par module (cf. tracteur.js)
const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// Données partagées (PARCELLES, CATALOGUE, SESSIONS, TRAITEMENTS, CONDUCTEURS, MEMBRES, CONFIG,
// EPHY…), helpers app.js (saveData, openOv, closeOv, openConfirmDel, fmtDate, getPCls,
// _saisonForDate, _cuParcRollSum…) et fonctions cross-module Tracteur (renderPhytoTrac,
// renderCatalogueTrac, applyEphy, openOvPhyto) sont résolus via le scope global (window.*),
// exposés par app.js/tracteur.js/reglages.js — même mécanisme que les autres modules extraits.

// ════ PHYTO ════
// Onglet courant de la page Phyto autonome ('reg' = registre, 'cat' = catalogue E-Phy).
var _phytoTab = 'reg';

// Synchronisation VISUELLE seule (pas de re-render du catalogue) — utilisee par renderPhyto.
function _phytoSyncTabs(){
  var reg=document.getElementById('traitements-list-trac');
  var chips=document.getElementById('phyto-type-row-trac');
  var cat=document.getElementById('tab-cat-trac');
  var fer=document.getElementById('tab-fer-trac');
  var isCat=(_phytoTab==='cat'), isFer=(_phytoTab==='fer');
  if(reg) reg.style.display=(isCat||isFer)?'none':'';
  if(chips) chips.style.display=(isCat||isFer)?'none':'';
  if(cat) cat.style.display=isCat?'':'none';
  if(fer) fer.style.display=isFer?'':'none';
  // FERTI-1 : le registre de fertilisation ne se rend que s'il est affiche.
  if(isFer && typeof window._ferRender==='function') window._ferRender();
  ['reg','cat','fer'].forEach(function(t){
    var b=document.getElementById('phyto-ong-'+t);
    if(b) b.classList.toggle('active', t===_phytoTab);
  });
  // FAB « nouveau traitement » : sur le registre uniquement, et seulement si le rôle l'autorise
  // L'export réglementaire ne vit plus au bas du registre : il est dans la roue
  // crantée du module, avec le PDF et la synthèse cuivre (lot NAV-4).
  var fab=document.getElementById('phyto-fab');
  if(fab){
    var canW=true;
    try{ canW=(typeof window.isAdmin==='function'&&window.isAdmin())||(typeof window.isTractoriste==='function'&&window.isTractoriste()); }catch(e){ canW=true; }
    // FERTI-1 : sur l'onglet Fertilisation, le bouton ouvre l'amendement (admin seul).
    var adm=false; try{ adm=(typeof window.isAdmin==='function'&&window.isAdmin()); }catch(e){ adm=false; }
    fab.style.display=(isFer?adm:(!isCat&&canW))?'flex':'none';
  }
}

// Action utilisateur : bascule d'onglet (remplace les 3 boutons du bas de l'ancien panneau Tracteur).
function switchPhytoTab(tab){
  _phytoTab=(tab==='cat'||tab==='fer')?tab:'reg';
  _phytoSyncTabs();
  if(_phytoTab==='cat' && typeof window.catSub==='function') window.catSub(window._catSub||'ephy');
}

function renderPhyto(){
  // Phyto est un module autonome du dock (page-phyto). Les ids du registre et du catalogue
  // sont inchangés : renderPhytoTrac / renderCatalogueTrac / ephyRender fonctionnent tels quels.
  if(window.renderPhytoTrac) window.renderPhytoTrac();
  if(window.renderCatalogueTrac) window.renderCatalogueTrac();
  if(window.applyEphy) window.applyEphy();
  var _b=document.getElementById('phyto-header-badge');
  if(_b){ var _n=(window.TRAITEMENTS||[]).length; _b.textContent=_n+' traitement'+(_n>1?'s':''); }
  _phytoSyncTabs();
}
function openCatDetail(nom){
  const p=CATALOGUE.find(x=>x.nom===nom);
  if(!p)return;
  // Overlay catalogue detail
  const ovId='ovCatDetail';
  let ov=document.getElementById(ovId);
  if(!ov){
    ov=document.createElement('div');ov.id=ovId;ov.className='overlay';
    ov.innerHTML=`<div class="ov-panel"><div class="ov-drag"></div>
      <div class="ov-hd"><div class="ov-title" id="ocd-title"></div><div class="ov-close" onclick="closeOv(null,'${ovId}')">${_mvIcon('croix',18)}</div></div>
      <div id="ocd-body" style="padding:0 20px 20px;overflow-y:auto;max-height:70vh"></div>
      <div style="padding:16px 20px">
        <button class="mbtn" onclick="closeOv(null,'${ovId}')" style="width:100%;font-family:Outfit,sans-serif;font-size:13px;padding:12px;border-radius:12px;border:1.5px solid var(--gris);background:var(--bg-card);color:var(--texte-doux);cursor:pointer">Fermer</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
  }
  const title=document.getElementById('ocd-title');
  title.textContent=p.nom;
  title.dataset.nom=p.nom;
  document.getElementById('ocd-body').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
      <div style="background:var(--gris-clair);border-radius:12px;padding:12px">
        <div style="font-size:9px;text-transform:uppercase;color:var(--texte-doux);font-weight:600">Type</div>
        <div style="margin-top:6px"><span class="cat-db ${TCLS[p.type]||'tfc'}" style="font-size:12px">${p.type}</span></div>
      </div>
      <div style="background:var(--gris-clair);border-radius:12px;padding:12px">
        <div style="font-size:9px;text-transform:uppercase;color:var(--texte-doux);font-weight:600">N° AMM</div>
        <div style="font-size:13px;font-weight:700;margin-top:4px;font-family:monospace">${p.amm}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">
      <div style="background:${p.dar>0?'#FFF3CD':'var(--vert-pale)'};border-radius:12px;padding:12px;text-align:center">
        <div style="font-size:9px;text-transform:uppercase;color:var(--texte-doux);font-weight:600">DAR</div>
        <div style="font-size:22px;font-weight:700;font-family:Cormorant Garamond,serif;color:${p.dar>0?'#856404':'var(--vert)'}">${p.dar>0?p.dar+'j':'Libre'}</div>
        <div style="font-size:9px;color:var(--texte-doux)">avant récolte</div>
      </div>
      <div style="background:${p.drae>0?'#FEF9E7':'var(--vert-pale)'};border-radius:12px;padding:12px;text-align:center">
        <div style="font-size:9px;text-transform:uppercase;color:var(--texte-doux);font-weight:600">DRAE</div>
        <div style="font-size:22px;font-weight:700;font-family:Cormorant Garamond,serif;color:${p.drae>0?'#B85A1A':'var(--vert)'}">${p.drae>0?p.drae+'h':'0h'}</div>
        <div style="font-size:9px;color:var(--texte-doux)">délai rentrée</div>
      </div>
      <div style="background:${p.znt>5?'#FEE8E8':'var(--gris-clair)'};border-radius:12px;padding:12px;text-align:center">
        <div style="font-size:9px;text-transform:uppercase;color:var(--texte-doux);font-weight:600">ZNT</div>
        <div style="font-size:22px;font-weight:700;font-family:Cormorant Garamond,serif;color:${p.znt>5?'var(--rouge)':'var(--texte)'}">${p.znt||5}m</div>
        <div style="font-size:9px;color:var(--texte-doux)">zone tampon</div>
      </div>
    </div>
    <div style="background:var(--gris-clair);border-radius:12px;padding:14px;margin-bottom:12px">
      <div style="font-size:9px;text-transform:uppercase;color:var(--texte-doux);font-weight:600;margin-bottom:6px">Dose indicative</div>
      <div style="font-size:16px;font-weight:700">${p.dose}</div>
    </div>
    ${p.cible?`<div style="background:var(--vert-pale);border-radius:12px;padding:14px;margin-bottom:12px">
      <div style="font-size:9px;text-transform:uppercase;color:var(--texte-doux);font-weight:600;margin-bottom:6px">Cibles</div>
      <div style="font-size:13px;font-weight:600;color:var(--vert)">${p.cible}</div>
    </div>`:''}
    ${p.usage?`<div style="background:var(--tag-amber-bg,#FFF8E8);border:1.5px solid #E8C840;border-radius:12px;padding:14px">
      <div style="font-size:9px;text-transform:uppercase;color:var(--tag-amber-tx,#7A5C10);font-weight:600;margin-bottom:6px">Conditions d'emploi</div>
      <div style="font-size:12px;color:var(--tag-amber-tx,#4A3A08);line-height:1.5">${p.usage}</div>
    </div>`:''}
  `;
  ov.classList.add('open');
}

var _trat={step:1,produits:[],date:'',conducteur:'',parcelles:[],stade:'',heureDebut:'',heureFin:'',dreAnticipe:'',modeAb:false,note:''};

// ════ Phyto : référentiel E-Phy + récents (catalogue local = repli invisible) ════
function _phyNorm(s){
  s=(s==null?'':String(s)).toLowerCase();
  try{ s=s.normalize('NFD'); var o=''; for(var i=0;i<s.length;i++){ var cc=s.charCodeAt(i); if(cc>=768&&cc<=879) continue; o+=s[i]; } s=o; }catch(e){ if(window._mvAvale) window._mvAvale(e,'phyto.js/_phyNorm'); }
  return s.trim();
}
function _phyEphy(){ return (window.EPHY && window.EPHY.length) ? window.EPHY : []; }
function _phyEphyMeta(p){
  var u=(p.usages&&p.usages[0])||{};
  var dar=(u.dar!=null&&u.dar!=='—')?parseInt(u.dar,10):0; if(isNaN(dar))dar=0;
  var znt=(u.znt!=null&&u.znt!=='—')?parseFloat(u.znt):null; if(znt!=null&&isNaN(znt))znt=null;
  return {nom:p.nom,type:p.type||'Fongicide',amm:p.amm||'',dar:dar,drae:p.drae||0,znt:znt,sub:p.sub||'',dose:(u.dose&&u.dose!=='—')?u.dose:'',statut:p.statut||'ok',source:'ephy'};
}
function _phyLookup(nom){
  var n=_phyNorm(nom);
  var e=_phyEphy().find(function(x){return _phyNorm(x.nom)===n;});
  if(e) return _phyEphyMeta(e);
  var c=(window.CATALOGUE||[]).find(function(x){return _phyNorm(x.nom)===n;});
  if(c) return {nom:c.nom,type:c.type||'Fongicide',amm:c.amm||'',dar:(c.dar!=null?c.dar:0),drae:c.drae||0,znt:(c.znt!=null?c.znt:null),sub:c.sub||'',dose:c.dose||'',statut:'ok',source:'mine',stadeOblig:!!c.stadeOblig,heureOblig:!!c.heureOblig};
  return null;
}
// _pMeta(p) : métadonnées d'un produit déjà ajouté au traitement (champs stockés, repli catalogue local pour les anciennes entrées)
function _pMeta(p){
  if(p && p.source) return {nom:p.nom,drae:p.drae||0,dar:(p.dar!=null?p.dar:0),type:p.type||'Fongicide',amm:p.amm||'',stadeOblig:!!p.stadeOblig,heureOblig:!!p.heureOblig,znt:(p.znt!=null?p.znt:null),sub:p.sub||'',dose:p.dose||''};
  var c=(window.CATALOGUE||[]).find(function(x){return x.nom===(p&&p.nom);})||{};
  return {nom:(p&&p.nom)||'',drae:c.drae||0,dar:(c.dar!=null?c.dar:0),type:c.type||'Fongicide',amm:c.amm||'',stadeOblig:!!c.stadeOblig,heureOblig:!!c.heureOblig,znt:(c.znt!=null?c.znt:null),sub:'',dose:c.dose||''};
}
// ── Resolveur meta traitement : lit d'abord les infos stockees sur l'enregistrement
// (renseignees a la saisie via E-Phy ou catalogue), repli sur le catalogue local. ──
function _phResolve(t){
  var c=(window.CATALOGUE||[]).find(function(x){return x.nom===(t&&t.produit);})||{};
  // Repli E-Phy (catalogue complet) : porte dreH/dreHc (délai de rentrée CLP).
  var e=null;
  if(t){ var EP=window.EPHY||[]; e=EP.find(function(x){return x.amm&&t.amm&&x.amm===t.amm;})||EP.find(function(x){return x.nom===t.produit;})||null; }
  var s=e||c;
  return {
    type:(t&&t.type)||s.type||'\u2014',
    amm:(t&&t.amm)||s.amm||'',
    dar:(t&&t.dar!=null)?t.dar:(s.dar!=null?s.dar:null),
    drae:(t&&t.drae!=null)?t.drae:(s.drae||0),
    znt:(t&&t.znt!=null)?t.znt:(s.znt!=null?s.znt:null),
    sub:(t&&t.sub)||s.sub||'',
    dose:(t&&t.dose)||s.dose||'',
    dreH:(e&&e.dreH)||0,
    dreHc:(e&&e.dreHc)||''
  };
}
window._phResolve=_phResolve;
function _phyRecentsKey(){ return 'mavigne_phy_recents_' + (localStorage.getItem('mavigne_tenant')||'default'); }
function _phyReadRecents(){ try{ var r=JSON.parse(localStorage.getItem(_phyRecentsKey())||'[]'); return Array.isArray(r)?r:[]; }catch(e){ return []; } }
function _phyWriteRecents(arr){ try{ localStorage.setItem(_phyRecentsKey(), JSON.stringify(arr.slice(0,10))); }catch(e){ if(window._mvAvale) window._mvAvale(e,'phyto.js/_phyWriteRecents'); } }
function _phySeedRecents(){
  var hist=(window.TRAITEMENTS||[]).slice().sort(function(a,b){return (b.date||'').localeCompare(a.date||'');});
  var seen={}, out=[];
  for(var i=0;i<hist.length && out.length<8;i++){
    var nm=hist[i].produit; if(!nm) continue; var key=_phyNorm(nm); if(seen[key]) continue; seen[key]=1;
    var m=_phyLookup(nm);
    if(!m) m={nom:nm,type:hist[i].type||'Fongicide',amm:hist[i].amm||'',dar:(hist[i].dar!=null?hist[i].dar:0),drae:hist[i].drae||0,znt:(hist[i].znt!=null?hist[i].znt:null),sub:'',dose:hist[i].dose||'',source:'mine'};
    out.push(m);
  }
  return out;
}
function _phyRecents(){
  var r=_phyReadRecents();
  if(!r.length){ r=_phySeedRecents(); if(r.length) _phyWriteRecents(r); }
  return r;
}
window._phyPushRecent=function(m){
  if(!m||!m.nom) return;
  var r=_phyReadRecents(); var n=_phyNorm(m.nom);
  r=r.filter(function(x){return _phyNorm(x.nom)!==n;});
  r.unshift({nom:m.nom,type:m.type||'Fongicide',amm:m.amm||'',dar:(m.dar!=null?m.dar:0),drae:m.drae||0,znt:(m.znt!=null?m.znt:null),sub:m.sub||'',dose:m.dose||'',source:m.source||'mine'});
  _phyWriteRecents(r);
};
// ── Assistant traitement : recherche unifiée (récents + E-Phy, repli catalogue local hors-ligne) ──
function _tratBuildResults(){
  var q=_phyNorm(_trat.q);
  var taken={}; _trat.produits.forEach(function(p){taken[_phyNorm(p.nom)]=1;});
  var res=[];
  var add=function(meta,section){ if(!meta||taken[_phyNorm(meta.nom)]) return; res.push({meta:meta,section:section}); };
  _trat._ephyMore=0; _trat._ephyOffline=false;
  if(!q){ _phyRecents().forEach(function(m){ add(m,'rec'); }); return res; }
  _phyRecents().forEach(function(m){ if(_phyNorm(m.nom).indexOf(q)>=0) add(m,'rec'); });
  var ep=_phyEphy();
  if(ep.length){
    var matches=ep.filter(function(p){ return _phyNorm(p.nom).indexOf(q)>=0 || _phyNorm(p.sub).indexOf(q)>=0 || (p.noms2||[]).some(function(n){return _phyNorm(n).indexOf(q)>=0;}); })
      .sort(function(a,b){ return (a.statut===b.statut)?0:(a.statut==='ok'?-1:1); });
    matches.slice(0,8).forEach(function(p){ add(_phyEphyMeta(p),'ephy'); });
    _trat._ephyMore=Math.max(0, matches.length-8);
  } else {
    _trat._ephyOffline=true;
    (window.CATALOGUE||[]).filter(function(c){return _phyNorm(c.nom).indexOf(q)>=0;}).slice(0,8).forEach(function(c){
      add({nom:c.nom,type:c.type||'Fongicide',amm:c.amm||'',dar:(c.dar!=null?c.dar:0),drae:c.drae||0,znt:(c.znt!=null?c.znt:null),sub:c.sub||'',dose:c.dose||'',source:'mine'},'offline');
    });
  }
  return res;
}
function _tratResultRow(m, section, i){
  var T=(window.TEMJ||{});
  var isE=section==='ephy';
  var ko=isE&&m.statut==='ko';
  var sel=_trat.selMeta&&_phyNorm(_trat.selMeta.nom)===_phyNorm(m.nom);
  var minis='<span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:6px;background:rgba(200,176,32,0.15);color:#C9A84C">DAR '+(m.dar>0?m.dar+'j':'0j')+'</span> ';
  if(m.znt!=null) minis+='<span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:6px;background:rgba(192,57,43,0.15);color:#E07A6E">ZNT '+m.znt+'m</span> ';
  minis+='<span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:6px;background:rgba(184,90,26,0.15);color:#E0934A">DRE '+(m.drae||0)+'h</span>';
  var stat=isE?(m.statut==='ok'
      ?' <span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:6px;background:rgba(61,122,39,0.18);color:#6FBF4F">&#x2713; Autoris&#xe9;</span>'
      :' <span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:6px;background:rgba(192,57,43,0.18);color:#E07A6E">&#x26d4; Retir&#xe9;</span>'):'';
  return '<div onclick="window._tratPick('+i+')" style="display:flex;align-items:center;gap:9px;padding:10px 11px;border-radius:10px;cursor:pointer;margin-bottom:6px;background:'+(sel?'rgba(74,159,200,0.12)':'var(--bg-card)')+';border:1.5px solid '+(sel?'var(--acier-med)':'var(--gris)')+';'+(ko?'opacity:.6':'')+'">'
    +'<div style="flex:1;min-width:0">'
    +'<div style="font-size:13px;font-weight:'+(isE?'600':'700')+';color:var(--texte);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(T[m.type]||'')+' '+_escHtml(m.nom)+'</div>'
    +'<div style="font-size:10px;color:var(--texte-doux);margin-top:1px">'+_escHtml(m.type||'')+(m.sub?' &#x00B7; '+_escHtml(m.sub):'')+'</div>'
    +'<div style="margin-top:4px;line-height:1.8">'+minis+stat+'</div>'
    +'</div><span style="color:var(--acier-med);font-size:var(--pt-sm,17px);font-weight:700">+</span></div>';
}
function _tratSelectedHtml(){
  var m=_trat.selMeta; if(!m) return '';
  var T=(window.TEMJ||{});
  var ph=m.dose?('Dose utilis&#xe9;e (d&#xe9;faut : '+_escHtml(m.dose)+')'):'Dose utilis&#xe9;e (optionnel)';
  var dp=_doseParse(m.dose);
  var dvPre=(dp.val!=null?dp.val:'');
  var duPre=dp.unit||_doseUnitDefault(m.type);
  var uOpts=['l/ha','kg/ha','g/ha'].map(function(u){return '<option value="'+u+'"'+(u===duPre?' selected':'')+'>'+u+'</option>';}).join('');
  return '<div style="background:rgba(74,158,224,0.08);border:1.5px solid rgba(74,158,224,0.3);border-radius:12px;padding:12px 13px;margin-top:10px">'
    +'<div style="font-size:var(--pt-base,14px);font-weight:700;color:var(--texte);margin-bottom:'+(m.sub?'2':'10')+'px">'+(T[m.type]||'')+' '+_escHtml(m.nom)+'</div>'
    +(m.sub?'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-bottom:10px">'+_escHtml(m.sub)+'</div>':'')
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:10px">'
    +'<div style="background:var(--gris-clair);border-radius:8px;padding:7px;text-align:center"><div style="font-size:9px;color:var(--texte-doux);text-transform:uppercase;font-weight:600">DAR</div><div style="font-size:18px;font-weight:700;font-family:&#39;Cormorant Garamond&#39;,serif;color:'+(m.dar>0?'var(--or)':'var(--vert-med)')+'">'+(m.dar>0?m.dar+'j':'Libre')+'</div></div>'
    +'<div style="background:var(--gris-clair);border-radius:8px;padding:7px;text-align:center"><div style="font-size:9px;color:var(--texte-doux);text-transform:uppercase;font-weight:600">DRE</div><div style="font-size:18px;font-weight:700;font-family:&#39;Cormorant Garamond&#39;,serif;color:'+((m.drae||0)>0?'var(--orange)':'var(--vert-med)')+'">'+(m.drae||0)+'h</div></div>'
    +'<div style="background:var(--gris-clair);border-radius:8px;padding:7px;text-align:center"><div style="font-size:9px;color:var(--texte-doux);text-transform:uppercase;font-weight:600">ZNT</div><div style="font-size:18px;font-weight:700;font-family:&#39;Cormorant Garamond&#39;,serif;color:'+(m.znt>5?'var(--rouge)':'var(--texte)')+'">'+(m.znt!=null?m.znt+'m':'&#8212;')+'</div></div>'
    +'</div>'
    +'<input id="trat-dose-input" type="text" placeholder="'+ph+'" value="'+_escHtml(m.dose||'')+'" style="width:100%;padding:11px 12px;border-radius:10px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px;margin-bottom:9px">'
    +'<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px"><span style="font-size:var(--pt-micro,11px);color:var(--texte-doux);white-space:nowrap">Dose/ha</span>'
    +'<input id="trat-doseval-input" type="number" step="0.01" inputmode="decimal" placeholder="ex. 1.5" value="'+dvPre+'" style="flex:1;min-width:0;padding:9px 10px;border-radius:9px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px">'
    +'<select id="trat-doseunit-input" style="padding:9px 8px;border-radius:9px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px">'+uOpts+'</select></div>'
    +'<div style="font-size:10px;color:var(--texte-doux);margin-bottom:9px;line-height:1.4">&#x1F4E6; Quantit&#xe9; r&#xe9;elle appliqu&#xe9;e &#8212; alimente le bilan mati&#xe8;re de La R&#xe9;serve.</div>'
    +'<button onclick="window._tratAddSel()" style="width:100%;padding:12px;border-radius:10px;border:none;background:var(--acier);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:Outfit,sans-serif;min-height:44px"><span>+ Ajouter ce produit</span></button>'
    +'</div>';
}
function _tratAddZoneHtml(){
  var res=_tratBuildResults(); _trat._results=res;
  var q=(_trat.q||'').trim();
  var html='';
  if(!res.length){
    if(!q) html='<div style="font-size:12px;color:var(--texte-doux);padding:6px 2px 4px">Aucun produit r&#xe9;cent &#8212; tapez un nom pour chercher dans E-Phy.</div>';
    else if(_trat._ephyOffline) html='<div style="font-size:12px;color:var(--texte-doux);padding:6px 2px">&#x1F4E1; Catalogue E-Phy non charg&#xe9; (hors-ligne) et aucun produit de secours ne correspond.</div>';
    else html='<div style="font-size:12px;color:var(--texte-doux);padding:6px 2px">Aucun produit ne correspond.</div>';
  } else {
    var groups=[['rec', q?'R&#xe9;cents':'Vos produits r&#xe9;cents'],['ephy','Catalogue E-Phy ANSES'],['offline','Catalogue (secours hors-ligne)']];
    groups.forEach(function(g){
      var items=res.map(function(r,i){return {r:r,i:i};}).filter(function(o){return o.r.section===g[0];});
      if(!items.length) return;
      html+='<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);text-transform:uppercase;font-weight:600;letter-spacing:.03em;margin:6px 0 7px">'+g[1]+' ('+items.length+')</div>';
      html+=items.map(function(o){return _tratResultRow(o.r.meta,o.r.section,o.i);}).join('');
    });
    if(_trat._ephyMore>0) html+='<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);text-align:center;padding:3px">+ '+_trat._ephyMore+' autres &#8212; pr&#xe9;cisez la recherche</div>';
    if(!q) html+='<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);display:flex;gap:6px;align-items:flex-start;margin-top:6px;padding:8px 10px;background:rgba(74,158,224,0.06);border-radius:8px"><span>&#x1F50D;</span><span>Tapez un nom ou une substance pour chercher dans le <strong style="color:#7FC3E6">catalogue officiel E-Phy (ANSES)</strong>.</span></div>';
    else if(!_trat._ephyOffline && res.some(function(r){return r.section==='ephy';})) html+='<div style="font-size:10px;color:var(--texte-doux);font-style:italic;margin-top:6px">&#x2139;&#xfe0f; Donn&#xe9;es E-Phy indicatives, non opposables &#8212; seul le registre officiel fait foi.</div>';
  }
  return html+_tratSelectedHtml();
}
// -- Cuivre metal : referentiel %Cu (pre-suggestion) + saisie dans l'assistant traitement --
var _CU_REF=[
  {re:/bouillie\s*bordelaise|sulfate\s*de\s*cuivre/i, pct:20},
  {re:/hydroxyde/i, pct:30},
  {re:/oxychlorure/i, pct:20},
  {re:/oxyde\s*cuivreux|nordox/i, pct:75}
];
function _cuPct(nom,sub){ var s=((nom||'')+' '+(sub||'')); for(var k=0;k<_CU_REF.length;k++){ if(_CU_REF[k].re.test(s)) return _CU_REF[k].pct; } return null; }
function _cuSuggest(nom,sub,dose){ var pct=_cuPct(nom,sub); if(pct==null) return null; var d; if(typeof dose==='number'){ d=dose; } else { var mn=String(dose==null?'':dose).replace(',','.').match(/\d+(?:\.\d+)?/); d=mn?parseFloat(mn[0]):NaN; } if(!(d>0)) return null; return Math.round(d*pct/100*100)/100; }
// -- Dose structuree (bilan matiere Reserve) : valeur numerique + unite /ha --
function _doseUnitDefault(type){ return (type==='Cuivre'||type==='Soufre')?'kg/ha':'l/ha'; }
// Parse conservateur du champ dose libre : ne pre-remplit QUE si cadence /ha claire (l|kg|g /ha).
// Concentration (g/hL) => {val:null} pour forcer la saisie de la vraie dose/ha (bilan matiere).
function _doseParse(str){
  var s=String(str==null?'':str).toLowerCase().replace(',','.');
  var m=s.match(/(\d+(?:\.\d+)?)\s*(kg|g|l)\s*\/\s*(ha|hl)/);
  if(!m||m[3]!=='ha') return {val:null,unit:null};
  return {val:parseFloat(m[1]),unit:m[2]+'/ha'};
}
function _tratCuFieldHtml(p,i){
  var v=(p.cuMetal!=null?p.cuMetal:'');
  var pct=_cuPct(p.nom,p.sub);
  var hint=(pct!=null?'base ~'+pct+'% Cu, ajustable':'kg de cuivre m&#xe9;tal apport&#xe9;');
  return '<div style="margin-top:7px;display:flex;align-items:center;gap:8px;background:rgba(165,107,58,0.1);border:1px solid rgba(165,107,58,0.28);border-radius:8px;padding:6px 9px">'
    +'<span style="font-size:var(--pt-micro,11px);font-weight:700;color:#A56B3A;white-space:nowrap">&#x1FA99; Cuivre m&#xe9;tal</span>'
    +'<input id="trat-cu-'+i+'" type="number" step="0.05" inputmode="decimal" value="'+v+'" oninput="window._tratSetCu('+i+',this.value)" style="width:74px;padding:5px 7px;border-radius:7px;border:1.5px solid rgba(165,107,58,0.4);background:var(--bg-card);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px;text-align:center">'
    +'<span style="font-size:var(--pt-micro,11px);color:var(--texte-doux);white-space:nowrap">kg/ha</span>'
    +'<span style="font-size:10px;color:var(--texte-doux);flex:1;text-align:right">'+hint+'</span>'
    +'</div>';
}
window._tratSetCu=function(i,val){ if(_trat.produits[i]){ _trat.produits[i].cuMetal=(val===''||val==null)?null:(parseFloat(String(val).replace(',','.'))||0); } };
function _tratSaveInputs(){
  var d=document.getElementById('trat-date');if(d)_trat.date=d.value;
  var hd=document.getElementById('trat-hd');if(hd)_trat.heureDebut=hd.value;
  var hf=document.getElementById('trat-hf');if(hf)_trat.heureFin=hf.value;
  var dr=document.getElementById('trat-dre');if(dr)_trat.dreAnticipe=dr.value;
  var nt=document.getElementById('trat-note');if(nt)_trat.note=nt.value;
  var st=document.getElementById('trat-stade');if(st)_trat.stade=st.value;
  _trat.produits.forEach(function(p,i){ var el=document.getElementById('trat-cu-'+i); if(el){ var raw=el.value; p.cuMetal=(raw==='')?null:(parseFloat(String(raw).replace(',','.'))||0); } });
}

function _conducteursDispo(){
  var out=[],seen={};
  var L=(typeof CONDUCTEURS!=='undefined'&&CONDUCTEURS)?CONDUCTEURS:(window.CONDUCTEURS||[]);
  L.forEach(function(c){
    if(!c||!c.nom)return;
    var k=(''+c.nom).trim().toLowerCase();
    if(seen[k])return; seen[k]=1; out.push(c);
  });
  var M=(window.MEMBRES||(typeof MEMBRES!=='undefined'?MEMBRES:[])||[]);
  M.forEach(function(m){
    if(!m||!m.nom||!Array.isArray(m.roles))return;
    var _st=(''+(m.statut||'')).trim().toLowerCase();
    if(_st==='inactif')return;
    if(m.roles.indexOf('tractoriste')<0&&m.roles.indexOf('admin')<0)return;
    var k=(''+m.nom).trim().toLowerCase();
    if(seen[k])return; seen[k]=1;
    out.push({nom:m.nom,statut:'Formé',_src:'membre'});
  });
  return out;
}
window._conducteursDispo=_conducteursDispo;

// --- Traitement phytosanitaire : sélection parcelles (maj ciblée, préserve le scroll) ---
function _tratParcAll(){return PARCELLES.filter(function(p){return p.statut!=='Arrachee';});}
function _tratSurfSel(){return _trat.parcelles.reduce(function(s,nom){var p=PARCELLES.find(function(x){return x.nom===nom;});return s+(p?parseFloat(p.surface)||0:0);},0);}
function _tratParcCountTxt(){return _trat.parcelles.length+' / '+_tratParcAll().length+' &#x2014; '+_tratSurfSel().toFixed(2)+' ha';}
function _tratParcRowsHtml(){var allParc=_tratParcAll();return allParc.map(function(p){
        var sel=_trat.parcelles.includes(p.nom);
        var abBadge=p.ab?'<span style="font-size:9px;background:rgba(64,192,128,0.15);color:#40C080;border-radius:5px;padding:1px 5px;font-weight:700;margin-left:5px">AB</span>':'';
        var pnEsc=p.nom.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
        return '<div onclick="window._tratToggleParc(\''+pnEsc+'\')" style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;margin-bottom:8px;cursor:pointer;background:'+(sel?'rgba(61,122,39,0.1)':'var(--bg-card)')+';border:1.5px solid '+(sel?'var(--vert)':'var(--gris)')+';min-height:52px">'
          +'<div style="width:22px;height:22px;border-radius:6px;background:'+(sel?'var(--vert)':'transparent')+';border:2px solid '+(sel?'var(--vert)':'var(--gris)')+';display:flex;align-items:center;justify-content:center;flex-shrink:0">'+(sel?'<span style="color:#fff;font-size:13px;font-weight:700">&#x2713;</span>':'')+'</div>'
          +'<div style="flex:1"><div style="font-size:15px;font-family:\'Cormorant Garamond\',serif;font-weight:600;color:'+(sel?'var(--texte)':'var(--texte-doux)')+'">'+_escHtml(p.nom)+abBadge+'</div>'
          +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux)">'+p.surface+' ha</div></div>'
          +'<div style="font-size:13px;font-weight:700;color:'+(getPCls(p).pct===100?'var(--vert)':getPCls(p).pct>=75?'var(--or)':'var(--orange)')+'">'+getPCls(p).pct+'%</div>'
          +'</div>';
      }).join('');}
function _tratRenderParcList(){
  var listEl=document.getElementById('trat-parc-list'); if(!listEl){_tratRender();return;}
  listEl.innerHTML=_tratParcRowsHtml();
  var cntEl=document.getElementById('trat-parc-count'); if(cntEl) cntEl.innerHTML=_tratParcCountTxt();
  var btn=document.getElementById('trat-next-btn');
  if(btn){var canNext2=_trat.parcelles.length>0;var surfSel=_tratSurfSel();
    if(canNext2){btn.removeAttribute('disabled');}else{btn.setAttribute('disabled','');}
    btn.style.background=canNext2?'var(--acier)':'var(--gris)';btn.style.color=canNext2?'#fff':'var(--texte-doux)';
    btn.innerHTML='<span>'+(canNext2?'Continuer ('+_trat.parcelles.length+' parc. &#x00B7; '+surfSel.toFixed(2)+' ha)\u00a0\u2192':'S&#xe9;lectionner au moins 1 parcelle')+'</span>';}
}
window._tratRenderParcList=_tratRenderParcList;
function _tratCuBudgetHtml(){
  var cuProds=_trat.produits.filter(function(p){return p.type==='Cuivre'&&p.cuMetal!=null&&p.cuMetal>0;});
  if(!cuProds.length||!_trat.parcelles.length)return '';
  if(typeof window._cuParcRollSum!=='function')return '';
  var add=cuProds.reduce(function(s,p){return s+(p.cuMetal||0);},0);
  // Le plafond 7 ans DERIVE du plafond annuel de Reglages (_cuPlafond), au lieu
  // d'etre ecrit 28 ici : sinon la vue annuelle suit le reglage et pas celle-ci.
  var CU_MAX=(typeof window._cuPlafond7==='function')?window._cuPlafond7():28;
  var CU_AN =(typeof window._cuPlafond==='function')?window._cuPlafond():4;
  var rows=_trat.parcelles.map(function(nom){var cur=window._cuParcRollSum(nom)||0;return {nom:nom,cur:cur,proj:cur+add};}).sort(function(a,b){return b.proj-a.proj;});
  var over=rows.filter(function(r){return r.proj>CU_MAX;});
  var col=function(v){var r=v/CU_MAX;return r>1?'#C0392B':(r>=0.875?'#B8621A':(r>=0.75?'#C9A84C':'#3D7A27'));};
  var f1=function(v){return v.toFixed(1).replace('.',',');};
  var h='<div style="background:rgba(26,74,122,0.05);border:1.5px solid rgba(26,74,122,0.25);border-radius:12px;padding:14px;margin-bottom:14px">'
    +'<div style="font-size:13px;font-weight:700;color:#1A4A7A;margin-bottom:3px">&#x1F535; Budget cuivre m&#xe9;tal &#x00B7; bio</div>'
    +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-bottom:12px">Plafond '+CU_MAX+'&#x202F;kg Cu/ha sur 7 ans ('+CU_AN+' kg/ha/an en moyenne). Ce traitement apporte <b style="color:#1A4A7A">+'+f1(add)+'&#x202F;kg/ha</b>.</div>';
  rows.forEach(function(r){
    var c=col(r.proj),pct=Math.min(100,r.proj/CU_MAX*100),pctNow=Math.min(100,r.cur/CU_MAX*100);
    h+='<div style="margin-bottom:10px">'
      +'<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px"><span style="font-weight:600">'+_escHtml(r.nom)+'</span><span style="font-weight:700;color:'+c+'">'+f1(r.proj)+'&#x202F;/&#x202F;28</span></div>'
      +'<div style="height:8px;border-radius:6px;background:var(--gris-clair);position:relative;overflow:hidden">'
        +'<div style="position:absolute;left:0;top:0;bottom:0;width:'+pct+'%;background:'+c+';border-radius:6px"></div>'
        +((pctNow>0&&pctNow<100)?'<div style="position:absolute;left:'+pctNow+'%;top:-1px;bottom:-1px;width:2px;background:var(--bg-card)"></div>':'')
      +'</div>'
      +'<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--texte-doux);margin-top:4px"><span>actuel '+f1(r.cur)+'</span><span>+'+f1(add)+' &#x2192; '+f1(r.proj)+'&#x202F;kg/ha</span></div>'
    +'</div>';
  });
  if(over.length){
    h+='<div style="font-size:11.5px;color:var(--rouge);background:rgba(192,57,43,0.08);border:1px solid rgba(192,57,43,0.25);border-radius:8px;padding:9px 11px;margin-top:4px;line-height:1.5">&#x26A0;&#xFE0F; D&#xe9;passement du plafond '+CU_MAX+'&#x202F;kg/ha sur '+over.length+' parcelle'+(over.length>1?'s':'')+' : '+_escHtml(over.map(function(r){return r.nom;}).join(', '))+'. Le traitement <b>reste enregistrable</b> &#x2014; le d&#xe9;passement est consign&#xe9; au registre ; v&#xe9;rifier la d&#xe9;rogation applicable.</div>';
  } else {
    h+='<div style="font-size:11.5px;color:var(--vert);background:rgba(61,122,39,0.08);border:1px solid rgba(61,122,39,0.25);border-radius:8px;padding:9px 11px;margin-top:4px">&#x2705; Conforme &#x2014; toutes les parcelles restent sous '+CU_MAX+'&#x202F;kg/ha sur 7 ans.</div>';
  }
  return h+'</div>';
}

function _tratRender(){
  var ov=document.getElementById('ovTraitement');if(!ov)return;
  var step=_trat.step;
  var needsStade=_trat.produits.some(function(p){return !!_pMeta(p).stadeOblig;});
  var needsHeure=_trat.produits.some(function(p){var m=_pMeta(p);return !!m.heureOblig||m.type==='Insecticide';});
  var maxDrae=_trat.produits.reduce(function(mx,p){return Math.max(mx,_pMeta(p).drae||0);},0);
  var surfSel=_trat.parcelles.reduce(function(s,nom){var p=PARCELLES.find(function(x){return x.nom===nom;});return s+(p?parseFloat(p.surface)||0:0);},0);

  // ── Barre progression ──
  var sLabels=['Produits','Parcelles','Valider'];
  var barHtml='<div style="display:flex;gap:6px;padding:0 20px 10px">'
    +sLabels.map(function(l,i){
      var col=step>i+1?'var(--vert)':step===i+1?'var(--or)':'var(--gris)';
      var tc=step===i+1?'var(--or)':'var(--texte-doux)';
      return '<div style="flex:1"><div style="height:3px;border-radius:2px;background:'+col+';margin-bottom:3px"></div>'
        +'<div style="font-size:10px;color:'+tc+';text-align:center">'+l+'</div></div>';
    }).join('')+'</div>';

  var bodyHtml='';

  // ══ STEP 1 ══
  if(step===1){
    var prodsHtml=_trat.produits.length===0
      ?'<div style="font-size:12px;color:var(--texte-doux);font-style:italic;margin-bottom:8px">Aucun produit — ajoutez-en un ci-dessous</div>'
      :'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:8px">'
        +_trat.produits.length+' produit'+(_trat.produits.length>1?'s':'')+' dans ce traitement</div>'
        +_trat.produits.map(function(p,i){
          var c=_pMeta(p);
          var warns='';
          if(c.stadeOblig)warns+='<span style="font-size:10px;color:var(--phyto-med,#A060E0)">&#x1F4CB; stade requis</span> ';
          if(c.heureOblig||c.type==='Insecticide')warns+='<span style="font-size:10px;color:var(--or)">&#x1F550; horaires conseill&#xe9;s</span> ';
          if(c.drae>0)warns+='<span style="font-size:10px;color:var(--orange)">DRE '+c.drae+'h</span>';
          return '<div style="display:flex;align-items:center;gap:10px;background:var(--gris-clair);border-radius:10px;padding:10px 12px;margin-bottom:6px">'
            +'<div style="flex:1"><div style="font-size:13px;font-weight:700">'+_escHtml(p.nom)+'</div>'
            +(p.dose?'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux)">'+_escHtml(p.dose)+'</div>':'')
            +(p.dose_val!=null?'<div style="font-size:var(--pt-micro,11px);color:#A56B3A;font-weight:600">&#x1F4E6; '+p.dose_val+' '+_escHtml(p.dose_unit||'')+'</div>':'')
            +(warns?'<div style="margin-top:3px">'+warns+'</div>':'')+(c.type==='Cuivre'?_tratCuFieldHtml(p,i):'')+'</div>'
            +'<button onclick="window._tratRemoveProd(\''+p.nom.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\')" style="min-width:44px;min-height:44px;border-radius:8px;border:none;background:rgba(192,57,43,0.2);color:var(--rouge);font-size:var(--pt-base,14px);cursor:pointer"><span>&#x2715;</span></button>'
            +'</div>';
        }).join('');
    if(maxDrae>0){
      prodsHtml+='<div style="font-size:12px;color:var(--orange);background:rgba(184,90,26,0.1);border:1px solid rgba(184,90,26,0.3);border-radius:8px;padding:7px 10px;margin-bottom:10px">'
        +'&#x26A0;&#xFE0F; DRAE cocktail : <strong>'+maxDrae+'h</strong> (d&#xe9;lai le plus long appliqu&#xe9;)</div>';
    }
    var hasInsect=_trat.produits.some(function(p){return _pMeta(p).type==='Insecticide';});
    if(hasInsect){
      prodsHtml+='<div style="font-size:12px;color:#E0934A;background:rgba(184,90,26,0.08);border:1px solid rgba(184,90,26,0.25);border-radius:8px;padding:7px 10px;margin-bottom:10px">&#x1F41D; Insecticide : renseignez les horaires d&#39;application et respectez les pr&#xe9;cautions abeilles (hors floraison, en soir&#xe9;e).</div>';
    }
    var addHtml='<div style="background:var(--gris-clair);border:1.5px dashed var(--gris);border-radius:12px;padding:14px;margin-bottom:14px">'
      +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:8px">+ Ajouter un produit</div>'
      +'<div style="position:relative;margin-bottom:10px">'
      +'<span style="position:absolute;left:11px;top:11px;font-size:var(--pt-base,14px);pointer-events:none">&#x1F50D;</span>'
      +'<input id="trat-q" type="text" oninput="window._tratSearch(this.value)" autocomplete="off" placeholder="Vos produits + catalogue E-Phy ANSES&#x2026;" value="'+_escHtml(_trat.q||'')+'" style="width:100%;padding:11px 12px 11px 34px;border-radius:10px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px">'
      +'<button id="trat-q-clr" onclick="window._tratQClear()" style="position:absolute;right:6px;top:6px;width:30px;height:30px;border:none;background:transparent;color:var(--texte-doux);cursor:pointer;display:'+(_trat.q?'block':'none')+'"><span>&#x2715;</span></button>'
      +'</div>'
      +'<div id="trat-add-zone">'+_tratAddZoneHtml()+'</div>'
      +'</div>';
    var dateHtml='<div style="margin-bottom:14px">'
      +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:6px">Date du traitement</div>'
      +'<input id="trat-date" type="date" style="width:100%;padding:11px 12px;border-radius:10px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px">'
      +'</div>';
    var conds=_conducteursDispo().filter(function(c){return c.statut!=='Archivé';});
    var condHtml='<div style="margin-bottom:14px">'
      +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:6px">Conducteur du tracteur</div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +conds.map(function(c){
        var sel=_trat.conducteur===c.nom;
        return '<div onclick="window._tratSetConducteur(\''+c.nom.replace(/'/g,"\\'")+'\')" style="padding:10px 16px;border-radius:10px;cursor:pointer;background:'+(sel?'var(--acier)':'var(--bg-card)')+';border:1.5px solid '+(sel?'var(--acier-med)':'var(--gris)')+';color:'+(sel?'#fff':'var(--texte-doux)')+';font-size:13px;font-weight:600;min-height:44px;display:flex;align-items:center">'+_escHtml(c.nom)+'</div>';
      }).join('')+'</div></div>';
    /* ★ window.STADES_PHENO : la liste est déclarée dans app.js. Lue au nom nu,
       Rollup la renommait puis le tree-shaking la supprimait — ce bouton ouvrait
       sur une ReferenceError, l'overlay ne s'affichait jamais. */
    var stadeOpts=window.STADES_PHENO.map(function(s){
      return '<option value="'+_escHtml(s)+'"'+(s===_trat.stade?' selected':'')+'>'+_escHtml(s)+'</option>';
    }).join('');
    var reqStadeLabel='Stade ph&#xe9;nologique'+(needsStade?' <span style="color:var(--rouge)">*requis</span>':'');
    var reqHeureLabel='Horaires d&#39;application'+(needsHeure?' <span style="color:var(--rouge)">*requis</span>':'');
    var rglHtml='<div style="background:rgba(74,158,224,0.05);border:1.5px solid rgba(74,158,224,0.2);border-radius:12px;padding:14px;margin-bottom:14px">'
      +'<div style="font-size:12px;font-weight:700;color:var(--ink-info,#4A9EE0);margin-bottom:12px">&#x1F4CB; Champs r&#xe9;glementaires obligatoires</div>'
      +'<div style="margin-bottom:12px"><div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:6px">'+reqStadeLabel+'</div>'
      +'<select id="trat-stade" style="width:100%;padding:11px 12px;border-radius:10px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px;appearance:none">'
      +'<option value="">S&#xe9;lectionner le stade&#x2026;</option>'+stadeOpts+'</select></div>'
      +'<div style="margin-bottom:12px"><div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:6px">'+reqHeureLabel+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
      +'<div><div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-bottom:4px">D&#xe9;but</div>'
      +'<input id="trat-hd" type="time" style="width:100%;padding:11px 12px;border-radius:10px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px"></div>'
      +'<div><div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-bottom:4px">Fin</div>'
      +'<input id="trat-hf" type="time" style="width:100%;padding:11px 12px;border-radius:10px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px"></div>'
      +'</div></div>'
      +'<div style="margin-bottom:12px"><div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:6px">DRE anticip&#xe9; (si rentr&#xe9;e avant d&#xe9;lai standard)</div>'
      +'<input id="trat-dre" type="text" placeholder="Ex : 6h &#x2014; justification agronomique" style="width:100%;padding:11px 12px;border-radius:10px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px"></div>'
      +'<div><div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:6px">Mode de production</div>'
      +'<div style="display:flex;gap:10px">'
      +'<div onclick="window._tratSetModeAb(false)" style="flex:1;padding:10px 12px;border-radius:10px;cursor:pointer;text-align:center;background:'+(!_trat.modeAb?'var(--acier)':'var(--bg-card)')+';border:1.5px solid '+(!_trat.modeAb?'var(--acier-med)':'var(--gris)')+';color:'+(!_trat.modeAb?'#fff':'var(--texte-doux)')+';font-size:12px;font-weight:600;min-height:44px;display:flex;align-items:center;justify-content:center">&#x1F33E; Conventionnel</div>'
      +'<div onclick="window._tratSetModeAb(true)" style="flex:1;padding:10px 12px;border-radius:10px;cursor:pointer;text-align:center;background:'+(_trat.modeAb?'#1A3A1A':'var(--bg-card)')+';border:1.5px solid '+(_trat.modeAb?'#2A6A2A':'var(--gris)')+';color:'+(_trat.modeAb?'#40C080':'var(--texte-doux)')+';font-size:12px;font-weight:600;min-height:44px;display:flex;align-items:center;justify-content:center">&#x1F33F; Bio (AB)</div>'
      +'</div></div></div>';
    var noteHtml='<div style="margin-bottom:14px">'
      +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:6px">Observations (optionnel)</div>'
      +'<input id="trat-note" type="text" placeholder="Conditions m&#xe9;t&#xe9;o, stade v&#xe9;g&#xe9;tatif compl&#xe9;mentaire&#x2026;" style="width:100%;padding:11px 12px;border-radius:10px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px">'
      +'</div>';
    bodyHtml=prodsHtml+addHtml+dateHtml+condHtml+rglHtml+noteHtml;

  // ══ STEP 2 ══
  } else if(step===2){
    var allParc=PARCELLES.filter(function(p){return p.statut!=='Arrachee';});
    bodyHtml='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
      +'<div id="trat-parc-count" style="font-size:13px;color:var(--texte-doux)">'+_tratParcCountTxt()+'</div>'
      +'<div style="display:flex;gap:8px">'
      +'<button onclick="window._tratAllParc()" style="padding:6px 12px;border-radius:8px;border:1.5px solid var(--gris);background:transparent;color:var(--or);font-size:12px;font-weight:600;cursor:pointer;font-family:Outfit,sans-serif;min-height:44px"><span>Tout</span></button>'
      +'<button onclick="window._tratNoneParc()" style="padding:6px 12px;border-radius:8px;border:1.5px solid var(--gris);background:transparent;color:var(--texte-doux);font-size:12px;cursor:pointer;font-family:Outfit,sans-serif;min-height:44px"><span>Aucune</span></button>'
      +'</div></div>'
      +'<div id="trat-parc-list">'+_tratParcRowsHtml()+'</div>';

  // ══ STEP 3 ══
  } else {
    var rcells=[
      {l:'Conducteur',v:_trat.conducteur||'—'},
      {l:'Surface traitée',v:surfSel.toFixed(2)+' ha'},
      {l:'Mode',v:_trat.modeAb?'Agriculture Biologique (AB)':'Conventionnel'},
      {l:'DRAE max',v:maxDrae>0?maxDrae+'h':'Aucun'}
    ];
    if(_trat.stade)rcells.push({l:'Stade',v:_trat.stade.split('(')[0].trim()});
    if(_trat.heureDebut)rcells.push({l:'Horaires',v:_trat.heureDebut+'–'+(_trat.heureFin||'?')});
    if(_trat.dreAnticipe)rcells.push({l:'DRE anticipé',v:_trat.dreAnticipe});
    var parcListHtml=_trat.parcelles.map(function(nom){
      return '<span style="font-size:var(--pt-micro,11px);background:var(--gris-clair);border-radius:6px;padding:3px 8px">'+_escHtml(nom)+'</span>';
    }).join(' ');
    var recapHtml='<div style="background:rgba(61,122,39,0.08);border:1.5px solid rgba(61,122,39,0.3);border-radius:12px;padding:14px;margin-bottom:14px">'
      +'<div style="font-size:13px;font-weight:700;color:var(--vert);margin-bottom:10px">&#x1F33F; Traitement &#x00B7; '+fmtDate(_trat.date)+' &#x00B7; '+_escHtml(_trat.conducteur||'—')+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">'
      +rcells.map(function(f){
        return '<div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:8px 10px">'
          +'<div style="font-size:9px;color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:2px">'+f.l+'</div>'
          +'<div style="font-size:12px;font-weight:600">'+_escHtml(String(f.v))+'</div></div>';
      }).join('')+'</div>'
      +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-bottom:6px">'+_trat.parcelles.length+' parcelle'+(_trat.parcelles.length>1?'s':'')+' :</div>'
      +'<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:'+(maxDrae>0?'10':'0')+'px">'+parcListHtml+'</div>'
      +(maxDrae>0?'<div style="font-size:12px;color:var(--orange);margin-top:4px">&#x26A0;&#xFE0F; DRAE max : <strong>'+maxDrae+'h</strong> &#x2014; parcelles signal&#xe9;es en rouge</div>':'')
      +'</div>';
    var confHtml='<div style="background:rgba(74,158,224,0.05);border:1.5px solid rgba(74,158,224,0.2);border-radius:10px;padding:10px 12px;margin-bottom:14px">'
      +'<div style="font-size:var(--pt-micro,11px);font-weight:700;color:var(--ink-info,#4A9EE0);margin-bottom:3px">&#x2705; Conforme r&#xe9;glementation 2027</div>'
      +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux)">Format num&#xe9;rique structur&#xe9; &#x00B7; Tous champs obligatoires renseign&#xe9;s</div>'
      +'</div>';
    var lignesHtml='<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:10px">'
      +'&#x1F4CB; '+_trat.produits.length+' entr&#xe9;e'+(_trat.produits.length>1?'s':'')+' ajout&#xe9;e'+(_trat.produits.length>1?'s':'')+' au registre'
      +'</div>'
      +_trat.produits.map(function(p){
        var c=_pMeta(p);
        var abBadge=_trat.modeAb?'<span style="font-size:10px;background:rgba(64,192,128,0.15);color:#40C080;border-radius:5px;padding:1px 6px;font-weight:700;margin-left:4px">AB</span>':'';
        var draeBadge=c.drae>0?'<span style="font-size:10px;background:rgba(192,57,43,0.15);color:var(--rouge);border-radius:5px;padding:1px 6px;font-weight:700;margin-left:4px">DRE '+c.drae+'h</span>':'';
        var stRow=_trat.stade?'<div style="font-size:var(--pt-micro,11px);color:var(--phyto-med,#A060E0);margin-top:2px">&#x1F4CB; '+_escHtml(_trat.stade.split('(')[0].trim())+'</div>':'';
        var hRow=_trat.heureDebut?'<div style="font-size:var(--pt-micro,11px);color:var(--or);margin-top:2px">&#x1F550; '+_escHtml(_trat.heureDebut)+'–'+_escHtml(_trat.heureFin||'?')+'</div>':'';
        return '<div style="background:var(--bg-card);border:1.5px solid var(--gris);border-radius:10px;padding:12px 14px;margin-bottom:8px">'
          +'<div style="display:flex;justify-content:space-between;align-items:flex-start">'
          +'<div style="flex:1"><div style="font-size:13px;font-weight:700">'+_escHtml(p.nom)+abBadge+draeBadge+'</div>'
          +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:2px">AMM '+(c.amm?_escHtml(c.amm):'—')+' &#x00B7; Dose : '+_escHtml(p.dose||c.dose||'—')+(p.dose_val!=null?' &#x00B7; <span style="color:#A56B3A;font-weight:600">'+p.dose_val+' '+_escHtml(p.dose_unit||'')+'</span>':'')+'</div>'
          +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux)">'+_trat.parcelles.length+' parc. &#x00B7; '+surfSel.toFixed(2)+' ha &#x00B7; '+_escHtml(_trat.conducteur||'—')+'</div>'
          +stRow+hRow+'</div>'
          +'<div style="font-size:12px;font-weight:700;color:'+(c.dar>0?'var(--or)':'var(--vert)')+'">DAR '+(c.dar>0?c.dar+'j':'libre')+'</div>'
          +'</div></div>';
      }).join('');
    bodyHtml=recapHtml+_tratCuBudgetHtml()+confHtml+lignesHtml;
  }

  // ── Footer ──
  var canNext1=_trat.produits.length>0&&!!_trat.date&&!!_trat.conducteur;
  var canNext2=_trat.parcelles.length>0;
  var backBtn=step>1?'<button onclick="window._tratPrev()" style="flex:1;padding:14px;border-radius:12px;border:1.5px solid var(--gris);background:transparent;color:var(--texte-doux);font-size:var(--pt-base,14px);font-weight:600;cursor:pointer;font-family:Outfit,sans-serif;min-height:44px"><span>&#x2190; Retour</span></button>':'';
  var mainBtn='';
  if(step===1){
    mainBtn='<button onclick="window._tratNext()" '+(canNext1?'':'disabled')+' style="flex:2;padding:14px;border-radius:12px;border:none;background:'+(canNext1?'var(--acier)':'var(--gris)')+';color:'+(canNext1?'#fff':'var(--texte-doux)')+';font-size:var(--pt-base,14px);font-weight:700;cursor:pointer;font-family:Outfit,sans-serif;min-height:44px"><span>'
      +(_trat.produits.length>0?'Continuer ('+_trat.produits.length+' produit'+(_trat.produits.length>1?'s':'')+')\u00a0\u2192':'Ajouter au moins 1 produit')+'</span></button>';
  } else if(step===2){
    mainBtn='<button id="trat-next-btn" onclick="window._tratNext()" '+(canNext2?'':'disabled')+' style="flex:2;padding:14px;border-radius:12px;border:none;background:'+(canNext2?'var(--acier)':'var(--gris)')+';color:'+(canNext2?'#fff':'var(--texte-doux)')+';font-size:var(--pt-base,14px);font-weight:700;cursor:pointer;font-family:Outfit,sans-serif;min-height:44px"><span>'
      +(canNext2?'Continuer ('+_trat.parcelles.length+' parc. &#x00B7; '+surfSel.toFixed(2)+' ha)\u00a0\u2192':'S&#xe9;lectionner au moins 1 parcelle')+'</span></button>';
  } else {
    mainBtn='<button onclick="window._tratSave()" style="flex:2;padding:14px;border-radius:12px;border:none;background:#2C6E29;color:#fff;font-size:var(--pt-base,14px);font-weight:700;cursor:pointer;font-family:Outfit,sans-serif;min-height:44px"><span>&#x2713; Enregistrer</span></button>';
  }
  var footerHtml='<div style="display:flex;gap:10px">'+backBtn+mainBtn+'</div>';

  // ── Maj DOM ──
  var panel=ov.querySelector('.modal');
  if(!panel){panel=document.createElement('div');panel.className='modal';ov.appendChild(panel);}
  panel.onclick=function(e){e.stopPropagation();};
  panel.style.cssText='display:flex;flex-direction:column;max-height:93vh;overflow:hidden;';
  panel.innerHTML='<div class="modal-handle"></div>'
    +'<div class="modal-hd" style="flex-shrink:0"><div class="modal-title">&#x1F33F; Traitement phytosanitaire</div>'
    +'<div style="font-size:12px;color:var(--texte-doux);margin-top:3px">'
    +(step===1?'Produits, op&#xe9;rateur &amp; r&#xe9;glementation':step===2?'Parcelles trait&#xe9;es':'R&#xe9;capitulatif &amp; registre')
    +'</div></div>'
    +barHtml
    +'<div style="flex:1;overflow-y:auto;padding:16px 20px 0">'+bodyHtml+'</div>'
    +'<div style="padding:12px 20px 20px;border-top:1px solid var(--gris);flex-shrink:0">'+footerHtml+'</div>';

  // Post-render : restaurer valeurs inputs
  var dateEl=document.getElementById('trat-date');if(dateEl)dateEl.value=_trat.date||'';
  var hdEl=document.getElementById('trat-hd');if(hdEl)hdEl.value=_trat.heureDebut||'';
  var hfEl=document.getElementById('trat-hf');if(hfEl)hfEl.value=_trat.heureFin||'';
  var dreEl=document.getElementById('trat-dre');if(dreEl)dreEl.value=_trat.dreAnticipe||'';
  var noteEl=document.getElementById('trat-note');if(noteEl)noteEl.value=_trat.note||'';
}

function openOvTraitement(){
  if(!isAdmin()&&!isTractoriste()){showToast('Réservé aux tractoristes et à l’admin','#C0392B');return;}
  var ov=document.getElementById('ovTraitement');
  if(!ov){
    ov=document.createElement('div');ov.id='ovTraitement';ov.className='overlay';
    ov.onclick=function(){window._tratClose();};
    document.body.appendChild(ov);
  }
  var todayStr=_mvToday();
  var _cd=_conducteursDispo();var defCond=(_cd.find(function(c){return c.statut==='Formé';})||_cd[0]||{nom:''}).nom;
  _trat={step:1,produits:[],date:todayStr,conducteur:defCond,parcelles:[],
         stade:'',heureDebut:'',heureFin:'',dreAnticipe:'',modeAb:false,note:'',q:'',selMeta:null};
  _tratRender();
  ov.classList.add('open');
}

window._tratRender=_tratRender;
window._tratClose=function(){var ov=document.getElementById('ovTraitement');if(ov)ov.classList.remove('open');};
window._tratSearch=function(v){
  _trat.q=v; _trat.selMeta=null;
  var z=document.getElementById('trat-add-zone'); if(z) z.innerHTML=_tratAddZoneHtml();
  var clr=document.getElementById('trat-q-clr'); if(clr) clr.style.display=(v?'block':'none');
};
window._tratQClear=function(){
  _trat.q=''; _trat.selMeta=null;
  var i=document.getElementById('trat-q'); if(i) i.value='';
  var z=document.getElementById('trat-add-zone'); if(z) z.innerHTML=_tratAddZoneHtml();
  var clr=document.getElementById('trat-q-clr'); if(clr) clr.style.display='none';
};
window._tratPick=function(i){
  var r=(_trat._results||[])[i]; if(!r) return;
  _trat.selMeta=r.meta;
  var z=document.getElementById('trat-add-zone'); if(z) z.innerHTML=_tratAddZoneHtml();
};
window._tratAddSel=function(){
  var m=_trat.selMeta; if(!m) return;
  if(_trat.produits.find(function(p){return _phyNorm(p.nom)===_phyNorm(m.nom);})) return;
  var dEl=document.getElementById('trat-dose-input');
  var dose=(dEl?dEl.value.trim():'')||m.dose||'';
  var dvEl=document.getElementById('trat-doseval-input');
  var duEl=document.getElementById('trat-doseunit-input');
  var dvRaw=dvEl?String(dvEl.value).replace(',','.').trim():'';
  var dv=(dvRaw===''?null:parseFloat(dvRaw)); if(dv!=null&&isNaN(dv))dv=null;
  var du=(duEl&&duEl.value)?duEl.value:_doseUnitDefault(m.type);
  var cuBasis=(dv!=null?dv:dose);
  _tratSaveInputs();
  _trat.produits.push({nom:m.nom,dose:dose,dose_val:dv,dose_unit:du,cuMetal:_cuSuggest(m.nom,m.sub,cuBasis),source:m.source||'mine',type:m.type,amm:m.amm||'',dar:(m.dar!=null?m.dar:0),drae:m.drae||0,znt:(m.znt!=null?m.znt:null),sub:m.sub||'',stadeOblig:!!m.stadeOblig,heureOblig:!!m.heureOblig});
  _trat.q=''; _trat.selMeta=null;
  _tratRender();
};
window._tratRemoveProd=function(nom){_tratSaveInputs();_trat.produits=_trat.produits.filter(function(p){return p.nom!==nom;});_tratRender();};
window._tratToggleParc=function(nom){
  if(_trat.parcelles.includes(nom)){_trat.parcelles=_trat.parcelles.filter(function(x){return x!==nom;});}
  else{_trat.parcelles.push(nom);}
  _tratRenderParcList();
};
window._tratAllParc=function(){_trat.parcelles=PARCELLES.filter(function(p){return p.statut!=='Arrachee';}).map(function(p){return p.nom;});_tratRenderParcList();};
window._tratNoneParc=function(){_trat.parcelles=[];_tratRenderParcList();};
window._tratSetConducteur=function(nom){_tratSaveInputs();_trat.conducteur=nom;_tratRender();};
window._tratSetModeAb=function(val){_tratSaveInputs();_trat.modeAb=val;_tratRender();};
window._tratNext=function(){
  _tratSaveInputs();
  if(_trat.step===1&&(!_trat.produits.length||!_trat.date||!_trat.conducteur))return;
  if(_trat.step===2&&!_trat.parcelles.length)return;
  if(_trat.step<3){_trat.step++;_tratRender();}
};
window._tratPrev=function(){_tratSaveInputs();if(_trat.step>1){_trat.step--;_tratRender();}};
window._tratSave=function(){
  if(!isAdmin()&&!isTractoriste()){showToast('Réservé aux tractoristes et à l’admin','#C0392B');return;}
  _tratSaveInputs();
  var sid='trat_'+Date.now();
  var surf=_trat.parcelles.reduce(function(s,nom){var p=PARCELLES.find(function(x){return x.nom===nom;});return s+(p?parseFloat(p.surface)||0:0);},0);
  SESSIONS.push({id:sid,saison:(window._saisonForDate?window._saisonForDate(_trat.date):''),type:'traitement',activite:'Traitement',date:_trat.date,
    conducteur:_trat.conducteur,parcelles:_trat.parcelles.slice(),
    produits:_trat.produits.map(function(p){return p.nom;}),
    stade:_trat.stade,heureDebut:_trat.heureDebut,heureFin:_trat.heureFin,
    dreAnticipe:_trat.dreAnticipe,modeAb:_trat.modeAb,note:_trat.note,
    statut:'Terminé',avancement:100,surface:Math.round(surf*100)/100});
  _trat.produits.forEach(function(p){
    var c=_pMeta(p);
    TRAITEMENTS.push({produit:p.nom,type:c.type,amm:c.amm||'',dar:(c.dar!=null?c.dar:0),drae:c.drae||0,znt:(c.znt!=null?c.znt:null),sub:c.sub||'',source:p.source||'mine',cuMetal:(c.type==='Cuivre'&&p.cuMetal!=null?p.cuMetal:null),date:_trat.date,
      conducteur:_trat.conducteur,operateur:_trat.conducteur,
      dose:p.dose||c.dose||'',dose_val:(typeof p.dose_val==='number'&&!isNaN(p.dose_val)?p.dose_val:null),dose_unit:p.dose_unit||'',parcelles:_trat.parcelles.slice(),
      stade:_trat.stade,heureDebut:_trat.heureDebut,heureFin:_trat.heureFin,
      dreAnticipe:_trat.dreAnticipe,modeAb:_trat.modeAb,note:_trat.note,sessionId:sid});
    if(window._phyPushRecent) window._phyPushRecent({nom:p.nom,type:c.type,amm:c.amm,dar:c.dar,drae:c.drae,znt:c.znt,sub:c.sub,dose:p.dose||c.dose,source:p.source||'mine'});
  });
  saveData('sessions');saveData('traitements');
  window._tratClose();
  showToast('Traitement enregistré','#2C6E29');
  if(typeof renderTracteur==='function')renderTracteur();
  if(typeof renderPhyto==='function')renderPhyto();
  if(typeof renderParcelles==='function')renderParcelles();
};


// ── Détail + suppression traitement ──
let _traitDetailIdx=null;
function openTraitDetail(idx){
  _traitDetailIdx=idx;
  const t=TRAITEMENTS[idx];
  if(!t)return;
  const m=window._phResolve?window._phResolve(t):{type:t.type,amm:t.amm,dar:t.dar,drae:t.drae,znt:t.znt,sub:t.sub,dose:t.dose};
  const today=new Date();
  const darBase=(m.dar!=null?m.dar:0);
  const darR=darBase>0?Math.max(0,darBase-Math.floor((today-new Date(t.date))/86400000)):null;
  const _dre=dreEffectif(m.drae,m.type,m.dreH,m.dreHc);
  const draeH=_dre.h;
  const draeR=draeH>0?Math.max(0,draeH-Math.floor((today-new Date(t.date))/3600000)):0;
  const _canEd=isAdmin()||isTractoriste();
  document.getElementById('otd-title').textContent=t.produit;
  document.getElementById('otd-sub').textContent=fmtDate(t.date)+((t.conducteur||t.operateur)?' · '+(t.conducteur||t.operateur):'');
  document.getElementById('otd-body').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div style="background:var(--gris-clair);border-radius:12px;padding:12px">
        <div style="font-size:10px;color:var(--texte-doux);text-transform:uppercase">Dose</div>
        <div style="font-size:16px;font-weight:700;margin-top:4px">${m.dose||'—'}</div>
      </div>
      <div style="background:var(--gris-clair);border-radius:12px;padding:12px">
        <div style="font-size:10px;color:var(--texte-doux);text-transform:uppercase">N° AMM</div>
        <div style="font-size:13px;font-weight:600;margin-top:4px;font-family:monospace">${m.amm||'—'}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div style="background:${darR>0?'var(--rouge-pale)':'var(--vert-pale)'};border-radius:12px;padding:12px">
        <div style="font-size:10px;color:var(--texte-doux);text-transform:uppercase">DAR récolte</div>
        <div style="font-size:16px;font-weight:700;margin-top:4px;color:${darR>0?'var(--rouge)':'var(--vert)'}">${darR!==null?(darR>0?darR+'j restants':'Libre'):'—'}</div>
      </div>
      <div style="background:${_dre.na?'var(--gris-clair)':(draeR>0?'#FFF3CD':'var(--vert-pale)')};border-radius:12px;padding:12px">
        <div style="font-size:10px;color:var(--texte-doux);text-transform:uppercase">Délai de réentrée</div>
        <div style="font-size:16px;font-weight:700;margin-top:4px;color:${_dre.na?'var(--texte-doux)':(draeR>0?'#856404':'var(--vert)')}">${_dre.na?'Non concerné':(draeR>0?draeR+'h restantes':'Libre')}</div>
        ${_dre.defaut&&!_dre.na?'<div style="font-size:9px;color:var(--texte-doux);margin-top:3px">minimum réglementaire</div>':''}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div style="background:var(--gris-clair);border-radius:12px;padding:12px">
        <div style="font-size:10px;color:var(--texte-doux);text-transform:uppercase">Substance active</div>
        <div style="font-size:13px;font-weight:600;margin-top:4px">${_escHtml(m.sub||'—')}</div>
      </div>
      <div style="background:var(--gris-clair);border-radius:12px;padding:12px">
        <div style="font-size:10px;color:var(--texte-doux);text-transform:uppercase">ZNT</div>
        <div style="font-size:16px;font-weight:700;margin-top:4px">${m.znt!=null?m.znt+' m':'—'}</div>
      </div>
    </div>
    ${t.note?`<div style="background:var(--gris-clair);border-radius:12px;padding:12px;font-size:12px;color:var(--texte-doux);font-style:italic">${_escHtml(t.note)}</div>`:''}
    ${(t.parcelles&&t.parcelles.length>0)?`<div style="margin-top:10px"><div style="font-size:10px;color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:5px">Parcelles traitées</div><div style="display:flex;flex-wrap:wrap;gap:5px">${t.parcelles.map(n=>'<span style="font-size:var(--pt-micro,11px);background:var(--gris-clair);border-radius:6px;padding:3px 8px">'+_escHtml(n)+'</span>').join('')}</div></div>`:''}
    ${t.stade?`<div style="background:rgba(160,96,224,0.08);border-radius:10px;padding:9px 12px;margin-top:8px;font-size:12px;color:#A060E0">Stade : ${_escHtml(t.stade)}</div>`:''}
    ${t.heureDebut?`<div style="background:var(--gris-clair);border-radius:10px;padding:9px 12px;margin-top:8px;font-size:12px">Horaires : ${t.heureDebut}–${t.heureFin||'?'}</div>`:''}
    ${t.dreAnticipe?`<div style="background:rgba(184,90,26,0.08);border-radius:10px;padding:9px 12px;margin-top:8px;font-size:12px;color:var(--orange)">DRE anticipé : ${_escHtml(t.dreAnticipe)}</div>`:''}
    ${typeof t.modeAb!=='undefined'?`<div style="margin-top:8px;font-size:12px;color:var(--texte-doux)">Mode : <strong style="color:${t.modeAb?'#40C080':'var(--texte)'}">${t.modeAb?'🌿 Agriculture Biologique (AB)':'🌾 Conventionnel'}</strong></div>`:''}
    ${_canEd?`<button onclick="openTraitEdit(${idx})" style="width:100%;margin-top:16px;padding:13px;border-radius:11px;border:1.5px solid var(--phyto);background:rgba(90,45,142,0.12);color:#9B70D4;font-size:var(--pt-base,14px);font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;min-height:44px"><span>✏️ Modifier ce traitement</span></button>`:''}
  `;
  openOv('ovTraitDetail');
}
function confirmDeleteTraitement(){
  if(!isAdmin()&&!isTractoriste()){showToast('Réservé aux tractoristes et à l’admin','#C0392B');return;}
  if(_traitDetailIdx===null)return;
  const t=TRAITEMENTS[_traitDetailIdx];
  if(!t)return;
  openConfirmDel('Supprimer ce traitement ?',t.produit+' — '+fmtDate(t.date),function(){
    TRAITEMENTS.splice(_traitDetailIdx,1);
    saveData('traitements');
    closeOv(null,'ovTraitDetail');
    _traitDetailIdx=null;
    renderPhyto();
  },'🌿');
}
// ════ MODIFICATION D'UN TRAITEMENT (correction date/dose/parcelles/conducteur/stade…) ════
let _phEdit={idx:null,parc:[]};
function _teRenderParc(){
  var grid=document.getElementById('te-parc-grid'); if(!grid) return;
  var act=(window.PARCELLES||[]).filter(function(p){return p.statut!=='Arrachee';});
  grid.innerHTML=act.map(function(p){
    var sel=_phEdit.parc.indexOf(p.nom)>=0;
    return '<div onclick="window._teToggleParc(\''+p.nom.replace(/'/g,"\\'")+'\')" style="padding:7px 11px;border-radius:9px;cursor:pointer;background:'+(sel?'var(--phyto)':'var(--bg-card)')+';border:1.5px solid '+(sel?'var(--phyto)':'var(--gris)')+';color:'+(sel?'#fff':'var(--texte-doux)')+';font-size:12px;font-weight:600;min-height:36px;display:flex;align-items:center">'+_escHtml(p.nom)+'</div>';
  }).join('');
  var c=document.getElementById('te-parc-count');
  if(c){ var tot=act.length; c.textContent = _phEdit.parc.length===0 ? 'Aucune parcelle sélectionnée' : (_phEdit.parc.length+' / '+tot+' parcelle'+(_phEdit.parc.length>1?'s':'')); }
}
window._teToggleParc=function(nom){ var i=_phEdit.parc.indexOf(nom); if(i>=0)_phEdit.parc.splice(i,1); else _phEdit.parc.push(nom); _teRenderParc(); };
window._teAllParc=function(){ _phEdit.parc=(window.PARCELLES||[]).filter(function(p){return p.statut!=='Arrachee';}).map(function(p){return p.nom;}); _teRenderParc(); };
window._teNoneParc=function(){ _phEdit.parc=[]; _teRenderParc(); };
function openTraitEdit(idx){
  if(!isAdmin()&&!isTractoriste()){showToast('Réservé aux tractoristes et à l’admin','#C0392B');return;}
  var t=TRAITEMENTS[idx]; if(!t) return;
  _phEdit.idx=idx;
  _phEdit.parc = Array.isArray(t.parcelles) ? t.parcelles.slice() : [];
  var curCond=t.conducteur||t.operateur||'';
  var conds=(typeof _conducteursDispo==='function'?_conducteursDispo():(window.CONDUCTEURS||[])).filter(function(c){return c&&c.statut!=='Archivé';});
  if(curCond&&!conds.some(function(c){return c&&c.nom===curCond;})) conds=[{nom:curCond}].concat(conds);
  var condOpts='<option value="">— Aucun —</option>'+conds.map(function(c){return '<option value="'+_escHtml(c.nom)+'"'+(c.nom===curCond?' selected':'')+'>'+_escHtml(c.nom)+'</option>';}).join('');
  var stadeOpts='<option value="">— Aucun —</option>'+(window.STADES_PHENO||[]).map(function(sd){return '<option value="'+_escHtml(sd)+'"'+(sd===(t.stade||'')?' selected':'')+'>'+_escHtml(sd)+'</option>';}).join('');
  var abVal=(t.modeAb===true)?'1':((t.modeAb===false)?'0':'');
  var L='font-size:var(--pt-micro,11px);color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:6px;display:block';
  var BM='padding:6px 12px;border-radius:8px;border:1.5px solid var(--gris);background:var(--bg-card);color:var(--texte-doux);font-size:12px;font-weight:600;cursor:pointer;font-family:Outfit,sans-serif;min-height:36px';
  var _ttCu=(t.type||(window._phResolve?(window._phResolve(t)||{}).type:'')||'');
  var _isCu=(_ttCu==='Cuivre');
  var _cuVal=(t.cuMetal!=null?t.cuMetal:'');
  var _cuPctV=(typeof _cuPct==='function'?_cuPct(t.produit,t.sub):null);
  var _cuHint=(_cuPctV!=null?'base ~'+_cuPctV+'% Cu, ajustable':'kg de cuivre m&#xe9;tal apport&#xe9;');
  var cuHtml=_isCu?('<div style="margin-bottom:14px;display:flex;align-items:center;gap:8px;background:rgba(165,107,58,0.1);border:1px solid rgba(165,107,58,0.28);border-radius:8px;padding:8px 10px">'
    +'<span style="font-size:12px;font-weight:700;color:#A56B3A;white-space:nowrap">&#x1FA99; Cuivre m&#xe9;tal</span>'
    +'<input id="te-cu" type="number" step="0.05" inputmode="decimal" value="'+_cuVal+'" style="width:84px;padding:6px 8px;border-radius:7px;border:1.5px solid rgba(165,107,58,0.4);background:var(--bg-card);color:var(--texte);font-family:Outfit,sans-serif;font-size:var(--pt-base,14px);text-align:center">'
    +'<span style="font-size:var(--pt-micro,11px);color:var(--texte-doux);white-space:nowrap">kg/ha</span>'
    +'<span style="font-size:10px;color:var(--texte-doux);flex:1;text-align:right">'+_cuHint+'</span>'
    +'</div>'):'';
  document.getElementById('te-title').textContent='✏️ '+t.produit;
  document.getElementById('te-body').innerHTML=
     '<div style="margin-bottom:14px"><span style="'+L+'">📅 Date du traitement</span><input type="date" id="te-date" class="fi"></div>'
    +'<div style="margin-bottom:14px"><span style="'+L+'">Conducteur</span><select id="te-cond" class="fsel">'+condOpts+'</select></div>'
    +'<div style="margin-bottom:14px"><span style="'+L+'">Dose</span><input type="text" id="te-dose" class="fi" placeholder="ex. 750 g/hL"></div>'
    +cuHtml
    +'<div style="margin-bottom:14px"><span style="'+L+'">Stade phénologique</span><select id="te-stade" class="fsel">'+stadeOpts+'</select></div>'
    +'<div style="display:flex;gap:10px;margin-bottom:14px"><div style="flex:1"><span style="'+L+'">Heure début</span><input type="time" id="te-hd" class="fi"></div><div style="flex:1"><span style="'+L+'">Heure fin</span><input type="time" id="te-hf" class="fi"></div></div>'
    +'<div style="margin-bottom:14px"><span style="'+L+'">DRE anticipé</span><input type="text" id="te-dre" class="fi" placeholder="ex. Soirée hors butinage"></div>'
    +'<div style="margin-bottom:14px"><span style="'+L+'">Mode</span><select id="te-ab" class="fsel"><option value="">— Non renseigné —</option><option value="0"'+(abVal==='0'?' selected':'')+'>🌾 Conventionnel</option><option value="1"'+(abVal==='1'?' selected':'')+'>🌿 Agriculture Biologique (AB)</option></select></div>'
    +'<div style="margin-bottom:14px"><span style="'+L+'">Note / observations</span><input type="text" id="te-note" class="fi" placeholder="Conditions, cible…"></div>'
    +'<div style="margin-bottom:4px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="'+L+';margin-bottom:0">📍 Parcelles traitées</span><div style="display:flex;gap:6px"><button type="button" onclick="window._teAllParc()" style="'+BM+'">Tout</button><button type="button" onclick="window._teNoneParc()" style="'+BM+'">Aucun</button></div></div><div id="te-parc-count" style="font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-bottom:8px"></div><div id="te-parc-grid" style="display:flex;flex-wrap:wrap;gap:6px"></div></div>';
  var de=document.getElementById('te-date'); if(de) de.value=t.date||'';
  var dse=document.getElementById('te-dose'); if(dse) dse.value=t.dose||'';
  var hd=document.getElementById('te-hd'); if(hd) hd.value=t.heureDebut||'';
  var hf=document.getElementById('te-hf'); if(hf) hf.value=t.heureFin||'';
  var dr=document.getElementById('te-dre'); if(dr) dr.value=t.dreAnticipe||'';
  var nt=document.getElementById('te-note'); if(nt) nt.value=t.note||'';
  _teRenderParc();
  openOv('ovTraitEdit');
  var od=document.getElementById('ovTraitDetail'); if(od) od.classList.remove('open');
}
window.openTraitEdit=openTraitEdit;
window.saveTraitEdit=function(){
  if(!isAdmin()&&!isTractoriste()){showToast('Réservé aux tractoristes et à l’admin','#C0392B');return;}
  var idx=_phEdit.idx; if(idx==null) return;
  var t=TRAITEMENTS[idx]; if(!t){closeOv(null,'ovTraitEdit');return;}
  var de=document.getElementById('te-date'); var date=de?de.value:'';
  if(!date){showToast('La date est obligatoire','#B85A1A');if(de&&de.focus)de.focus();return;}
  var cond=(document.getElementById('te-cond')||{}).value||'';
  var dose=(document.getElementById('te-dose')||{}).value||'';
  var stade=(document.getElementById('te-stade')||{}).value||'';
  var hd=(document.getElementById('te-hd')||{}).value||'';
  var hf=(document.getElementById('te-hf')||{}).value||'';
  var dre=(document.getElementById('te-dre')||{}).value||'';
  var abv=(document.getElementById('te-ab')||{}).value;
  var note=(document.getElementById('te-note')||{}).value||'';
  var cuEl=document.getElementById('te-cu');
  var cuVal=cuEl?((cuEl.value===''||cuEl.value==null)?null:(parseFloat(String(cuEl.value).replace(',','.'))||0)):undefined;
  var parc=_phEdit.parc.slice();
  var surf=parc.reduce(function(s,nom){var p=(window.PARCELLES||[]).find(function(x){return x.nom===nom;});return s+(p?parseFloat(p.surface)||0:0);},0);
  surf=Math.round(surf*100)/100;
  var sf={date:date,conducteur:cond,operateur:cond,stade:stade,heureDebut:hd,heureFin:hf,dreAnticipe:dre,note:note};
  if(abv==='1')sf.modeAb=true; else if(abv==='0')sf.modeAb=false;
  Object.assign(t,sf,{dose:dose,parcelles:parc.slice()});
  if(cuEl){ t.cuMetal=cuVal; }
  var sid=t.sessionId;
  if(sid){
    TRAITEMENTS.forEach(function(o){ if(o!==t&&o.sessionId===sid){ Object.assign(o,sf,{parcelles:parc.slice()}); } });
    (window.SESSIONS||[]).forEach(function(s){ if(s.id===sid){ s.date=date; s.conducteur=cond; s.parcelles=parc.slice(); s.stade=stade; s.heureDebut=hd; s.heureFin=hf; s.dreAnticipe=dre; s.note=note; if(abv==='1')s.modeAb=true; else if(abv==='0')s.modeAb=false; s.surface=surf; } });
    saveData('sessions');
  }
  saveData('traitements');
  closeOv(null,'ovTraitEdit');
  _phEdit.idx=null;
  showToast('✓ Traitement modifié','#2C6E29');
  if(typeof renderPhyto==='function')renderPhyto();
  if(typeof renderTracteur==='function')renderTracteur();
  if(typeof renderParcelles==='function')renderParcelles();
};




// ══════════════════════════════════════════════════════════════════════
// REGISTRE PHYTOSANITAIRE — EXPORT AU FORMAT ÉLECTRONIQUE (CSV, ouvrable dans Excel)
// ──────────────────────────────────────────────────────────────────────
// Base : règlement d'exécution (UE) 2023/564, arrêté du 24 décembre 2025 (annexe I
// pour le contenu, annexe II cas A pour le format d'un traitement de surfaces).
// Le PDF ne suffit pas : le texte exige un fichier STRUCTURÉ, dont un logiciel peut
// extraire chaque donnée. Un PDF imprimé n'en est pas un.
//
// ⚠️ UNE LIGNE PAR PRODUIT ET PAR PARCELLE : la localisation est demandée pour chaque
//    surface traitée, donc un traitement portant quatre parcelles produit quatre lignes.
// ⚠️ Localisation par COORDONNÉES GPS (option prévue par le texte pour une parcelle sans
//    référence au registre parcellaire graphique). L'app ne connaît pas les numéros d'îlot
//    RPG : plutôt que des colonnes vides, on fournit le point GPS, qui est exigible seul.
// ⚠️ « Cible » et « Mode d'application » sont facultatifs au texte et ne sont pas saisis
//    dans l'app : les colonnes existent, vides, pour être complétées si besoin. Les
//    remplir depuis le catalogue reviendrait à déclarer une cible qui n'est pas forcément
//    celle visée ce jour-là.
// ⚠️ « Surface de la parcelle (ha) » — et NON « surface traitée ». L'app ne connaît
//    pas de surface PARTIELLE : elle n'enregistre qu'une parcelle entière. Écrire
//    cette surface sous l'étiquette « traitée » alors que seul un rang l'a été serait
//    une sur-déclaration, dans un registre opposable en contrôle. La colonne dit donc
//    exactement ce qu'elle contient, et le panneau d'export le rappelle avant le
//    téléchargement. Mieux vaut une colonne exacte qu'une colonne réglementaire fausse.
// ⚠️ FENÊTRE DE DATES : le bouton ouvre un choix (exercice en cours / campagne
//    consultée / tout le registre). Remettre l'historique entier pour un contrôle qui
//    porte sur un exercice, c'est remettre une pièce illisible. Le nom du fichier
//    porte la fenêtre, sinon deux exports différents se ressemblent sur le disque.
// ⚠️ Séparateur POINT-VIRGULE + BOM UTF-8 + décimale à la virgule : c'est ce qui fait
//    qu'Excel en français ouvre le fichier en colonnes, et non en une seule.
// ══════════════════════════════════════════════════════════════════════
// Code OEPP de la vigne (Vitis vinifera) — dénomination de culture exigée par l'annexe II.
var MV_OEPP_VIGNE = 'VITVI';

function _phCsvCell(v){
  var s = (v==null) ? '' : String(v);
  return '"' + s.replace(/"/g,'""').replace(/\r?\n/g,' ') + '"';
}
function _phCsvNum(n, dec){
  // ⚠️ Number(null) vaut 0 : sans ce garde, une surface non renseignée sortirait
  // « 0,0000 ha » au registre, c'est-à-dire une déclaration fausse. Vide est honnête.
  if(n===null || n===undefined || n==='') return '';
  var x = Number(n);
  if(!isFinite(x)) return '';
  return x.toFixed(dec==null?2:dec).replace('.', ',');
}
// AAAA-MM-JJ -> JJ/MM/AAAA (format prescrit).
function _phCsvDate(iso){
  var a = String(iso||'').split('-');
  if(a.length!==3) return String(iso||'');
  return a[2]+'/'+a[1]+'/'+a[0];
}
// « 6h », « 6:30 », « 06h30 » -> HH:MM. Le texte libre est rendu tel quel s'il ne parle pas.
function _phCsvHeure(h){
  var s = String(h==null?'':h).trim();
  if(!s) return '';
  var m = /(\d{1,2})\s*[:hH]\s*(\d{2})/.exec(s);
  if(m) return (m[1].length<2?'0':'')+m[1]+':'+m[2];
  var m2 = /^(\d{1,2})\s*[hH]?$/.exec(s);
  if(m2) return (m2[1].length<2?'0':'')+m2[1]+':00';
  return s;
}
// Le stade est saisi « Floraison (BBCH 60–69) » : l'annexe demande les deux chiffres.
function _phCsvBbch(stade){
  var m = /BBCH\s*(\d{1,2})/.exec(String(stade||''));
  if(!m) return '';
  return (m[1].length<2?'0':'')+m[1];
}
// Dose : dose_val/dose_unit quand ils existent, sinon lecture du texte « 8 L/ha ».
function _phCsvDose(t){
  if(t && typeof t.dose_val === 'number' && isFinite(t.dose_val)) return { val:t.dose_val, unit:(t.dose_unit||'') };
  var txt = String((t&&t.dose)||'').trim();
  if(!txt) return { val:null, unit:'' };
  var m = /^(-?\d+(?:[.,]\d+)?)\s*(.*)$/.exec(txt);
  if(!m) return { val:null, unit:txt };
  return { val: parseFloat(m[1].replace(',','.')), unit: (m[2]||'').trim() };
}
// Un traitement porte un TABLEAU de parcelles ; les saisies anciennes peuvent porter
// une chaîne. Sans parcelle, une ligne quand même : le registre reflète la saisie.
function _phCsvParcs(t){
  var a = t && t.parcelles;
  if(typeof a === 'string') return a ? [a] : [''];
  if(Object.prototype.toString.call(a)==='[object Array]' && a.length) return a.slice();
  return [''];
}
// Colonnes, dans l'ordre de l'annexe II. Les quatre dernières sortent du texte : il les
// autorise expressément, « à condition de ne pas porter atteinte à la lisibilité ».
var MV_PHY_CSV_COLS = ['SIRET d\u00e9tenteur','SIRET b\u00e9n\u00e9ficiaire','Produit','Num\u00e9ro d\u2019autorisation (AMM)',
  'Date d\u2019utilisation','Horaire de d\u00e9but','Horaire de fin','D\u00e9lai de rentr\u00e9e anticip\u00e9e',
  'Dose de produit utilis\u00e9e','Unit\u00e9 de dose','Cible','Mode d\u2019application',
  'Latitude (WGS84)','Longitude (WGS84)','Surface de la parcelle (ha)',
  'D\u00e9nomination de la culture (OEPP)','Stade ph\u00e9nologique (BBCH)','Conduite biologique',
  'Parcelle','Substance active','Applicateur','Observations'];

// Jour d'un traitement, normalise en 'AAAA-MM-JJ' ou '' si la date ne parle pas.
// ⚠️ Une chaine vide comparee a des bornes ISO passerait pour une date anterieure a
//    tout : le registre perdrait des lignes en silence. On la traite a part.
function _phCsvJour(t){
  var s = String((t&&t.date)||'').slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

// ── Fenetres de dates proposees avant le telechargement ───────────────────
// Une fenetre = { k, lbl, sub, d0, d1 } ; d0/d1 absents = aucune borne.
// ⚠️ Une option n'est proposee QUE si sa source existe ET porte deux dates : une
//    periode sans debut/fin est invisible pour toute la chaine (bug d'onboarding
//    deja vecu), et un export vide sans explication est pire que pas d'option.
// ⚠️ Repli complet : si utils.js ne fournit pas _mvExercice, l'option disparait et
//    « tout le registre » reste toujours la — le bouton ne peut jamais rester muet.
// \u2605\u2605\u2605 AXE-1 \u2014 LES FENETRES VIENNENT DE utils.js, ELLES NE SONT PLUS DEFINIES ICI.
// Deux defauts corriges d'un coup :
//   \u2460 la ligne « Campagne consultee » nommait CAMPAGNE une PERIODE de travail.
//     Trois sens pour un mot, dans une app ou le bilan et les Archives en ont un
//     quatrieme. Un vigneron qui sortait « la campagne » ici et « la campagne »
//     la-bas obtenait deux perimetres, sans qu'aucun ecran ne le dise.
//   \u2461 la vraie campagne (l'axe des Archives) n'etait pas proposee du tout.
// \u26a0\ufe0f Repli local conserve, comportement de l'ancienne version, si utils.js est
//   anterieur a ce lot : un phyto.js neuf sur un utils.js ancien ne plante pas.
function _phytoFenetres(){
  if(typeof window._mvFenetresAnnee === 'function'){
    try{
      var L = window._mvFenetresAnnee({campagnes:3, exercices:2});
      if(L && L.length) return L;
    }catch(e){ if(window.logError) window.logError({level:'info',cat:'phyto',msg:'liste des fenetres illisible \u2014 repli local'}); }
  }
  var out = [];
  if(typeof window._mvExercice === 'function'){
    var ex = null;
    try{ ex = window._mvExercice(); }catch(e2){ ex = null; }
    if(ex && ex.d0 && ex.d1){
      out.push({ k:'ex', axe:'exercice', lbl:'Exercice en cours',
                 sub:(ex.lbl || (_phCsvDate(ex.d0)+' \u2192 '+_phCsvDate(ex.d1))),
                 d0:ex.d0, d1:ex.d1 });
    }
  }
  var nom = (typeof window._visuSaison === 'function') ? window._visuSaison() : '';
  var s   = (nom && typeof window._saisonObj === 'function') ? window._saisonObj(nom) : null;
  if(s && s.debut && s.fin){
    out.push({ k:'per', axe:'periode', lbl:'P\u00e9riode de travail \u2014 '+nom,
               sub:'du '+_phCsvDate(s.debut)+' au '+_phCsvDate(s.fin),
               d0:s.debut, d1:s.fin });
  }
  out.push({ k:'tout', axe:'tout', lbl:'Tout le registre', sub:'depuis la mise en service', d0:'', d1:'' });
  return out;
}
window._phytoFenetres = _phytoFenetres;
// Nombre de TRAITEMENTS dans une fenetre (pas de lignes : on ne construit rien ici).
// ⚠️ Volontairement leger — un comptage complet a chaque ouverture du panneau
//    ressemblerait a « le bouton ne marche pas ».
function _phytoFenCompte(f){
  var d0=(f&&f.d0)||'', d1=(f&&f.d1)||'', n=0;
  (window.TRAITEMENTS||[]).forEach(function(t){
    if(!d0 || !d1){ n++; return; }
    var j = _phCsvJour(t);
    if(j && j>=d0 && j<=d1) n++;
  });
  return n;
}
// Gardes communes aux DEUX portes d'entree (panneau de choix et telechargement).
// ⚠️ Une seule definition : deux copies divergeraient au premier correctif.
function _phytoExportGarde(){
  var adm=false;
  try{ adm=(typeof window.isAdmin==='function')&&window.isAdmin(); }catch(e){ adm=false; }
  if(!adm){ showToast('R\u00e9serv\u00e9 aux administrateurs','#C0392B'); return false; }
  if(!(window.TRAITEMENTS||[]).length){ showToast('Aucun traitement \u00e0 exporter','#B85A1A'); return false; }
  if(typeof window.dlFile!=='function'){ showToast('T\u00e9l\u00e9chargement indisponible sur cet appareil','#C0392B'); return false; }
  return true;
}

// Construction du tableau de lignes. Séparée du téléchargement pour être exécutable seule.
// ⚠️ `fen` est OPTIONNEL : sans argument, comportement strictement identique a
//    l'origine (tout le registre, aucun filtre). Zero regression sur l'existant.
window._phytoCsvRows = function(fen){
  var fd0=(fen&&fen.d0)||'', fd1=(fen&&fen.d1)||'', borne=!!(fd0&&fd1);
  var sansDate = 0;
  var T = (window.TRAITEMENTS||[]).slice().sort(function(a,b){ return String(a.date||'').localeCompare(String(b.date||'')); });
  if(borne){
    T = T.filter(function(t){
      var j = _phCsvJour(t);
      if(!j){ sansDate++; return false; }
      return (j>=fd0 && j<=fd1);
    });
  }
  var C = window.CONFIG || {};
  var siret = String(C.siret||'').replace(/[^0-9]/g,'');
  var bioDom = !!C.bio;
  var out = [], sansGeo = 0;
  T.forEach(function(t){
    var m = (typeof _phResolve==='function') ? _phResolve(t) : {};
    var d = _phCsvDose(t);
    var bbch = _phCsvBbch(t.stade);
    var bio = (bioDom || t.modeAb) ? 'oui' : 'non';
    _phCsvParcs(t).forEach(function(nom){
      var p = null;
      if(nom){
        var L = window.PARCELLES||[];
        for(var i=0;i<L.length;i++){ if(L[i] && L[i].nom===nom){ p=L[i]; break; } }
      }
      var g = (p && typeof window._mvParcGeo==='function') ? window._mvParcGeo(p) : null;
      if(!g) sansGeo++;
      out.push([
        siret, '', (t.produit||''), (m.amm||t.amm||''),
        _phCsvDate(t.date), _phCsvHeure(t.heureDebut), _phCsvHeure(t.heureFin), (t.dreAnticipe||''),
        (d.val==null?'':_phCsvNum(d.val,3)), (d.unit||''), '', '',
        (g?_phCsvNum(g.lat,5):''), (g?_phCsvNum(g.lng,5):''), (p?_phCsvNum(p.surface,4):''),
        MV_OEPP_VIGNE, bbch, bio,
        (nom||''), (m.sub||t.sub||''), (t.conducteur||t.operateur||''), (t.note||'')
      ]);
    });
  });
  return { rows: out, sansGeo: sansGeo, siret: siret, sansDate: sansDate, d0: fd0, d1: fd1 };
};

// Panneau de choix de la fenetre. Ouvert par le bouton d'export (appel sans argument),
// donc index.html n'a pas a etre touche. Porte aussi l'AIDE : ce que contient la
// colonne de surface, dit au seul moment ou la question se pose.
// \u2605 AXE-1 : `cible` vaut 'csv' (defaut, comportement d'origine) ou 'pdf'.
// Le PDF sortait SANS AUCUNE BORNE en se titrant « Campagne <nom de la periode
// active> » \u2014 un registre reglementaire de cinq ans presente comme une annee.
// Les deux documents passent desormais par la meme question et la meme liste.
function _phytoExportChoix(cible){
  if(!_phytoExportGarde()) return;
  var pdf = (cible === 'pdf');
  var ovId = 'ovPhytoExport';
  var ov = document.getElementById(ovId);
  if(!ov){
    ov = document.createElement('div'); ov.id = ovId; ov.className = 'overlay';
    ov.setAttribute('onclick', "closeOv(event,'"+ovId+"')");
    ov.innerHTML = `<div class="ov-panel"><div class="ov-drag"></div>
      <div class="ov-hd"><div class="ov-title" id="phx-title">Exporter le registre</div><div class="ov-close" onclick="closeOv(null,'${ovId}')">${_mvIcon('croix',18)}</div></div>
      <div id="phx-body" style="padding:0 20px 20px;overflow-y:auto;max-height:70vh"></div>
      <div style="padding:0 20px 16px">
        <button class="mbtn" onclick="closeOv(null,'${ovId}')" style="width:100%;font-family:Outfit,sans-serif;font-size:13px;padding:12px;border-radius:12px;border:1.5px solid var(--gris);background:var(--bg-card);color:var(--texte-doux);cursor:pointer;min-height:44px">Annuler</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
  }
  var F = _phytoFenetres();
  var h = '<div style="font-size:12px;color:var(--texte-doux);line-height:1.5;margin-bottom:14px">Sur quelle p\u00e9riode ?</div>';
  F.forEach(function(f, i){
    var n = _phytoFenCompte(f);
    var acc = (i===0);
    var _k = (typeof _escAttr==='function') ? _escAttr(f.k) : String(f.k);
    var appel = pdf ? ("exportPDFPhyto('"+_k+"')") : ("_phytoExportCsv('"+_k+"')");
    h += `<button onclick="${appel}" style="width:100%;display:block;text-align:left;background:var(--bg-card);border:1.5px solid ${acc?'#5A2D8E':'var(--gris)'};border-radius:12px;padding:14px 16px;margin-bottom:10px;cursor:pointer;font-family:Outfit,sans-serif;min-height:44px">
      <span style="display:block;font-size:var(--pt-base,14px);font-weight:600;color:var(--texte)">${_escHtml(f.lbl)}</span>
      <span style="display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:3px;line-height:1.4">${_escHtml(f.sub)}</span>
      <span style="display:block;font-size:var(--pt-micro,11px);color:${n?'#5A2D8E':'var(--texte-doux)'};font-weight:600;margin-top:5px">${n} traitement${n>1?'s':''}</span>
    </button>`;
  });
  h += `<div style="background:var(--gris-clair);border-radius:12px;padding:12px;margin-top:4px">
      <div style="font-size:9px;text-transform:uppercase;color:var(--texte-doux);font-weight:600;margin-bottom:6px">\u00c0 savoir</div>
      <div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);line-height:1.5">La colonne \u00ab\u00a0Surface de la parcelle (ha)\u00a0\u00bb donne la surface TOTALE de la parcelle. Ma Vigne n\u2019enregistre pas de surface partielle : si un traitement n\u2019a couvert qu\u2019une partie du rang, corrigez la valeur dans le tableur avant de remettre le fichier.</div>
    </div>`;
  var body = ov.querySelector('#phx-body');
  if(body) body.innerHTML = h;
  /* \u26a0\ufe0f L'overlay est cree UNE fois puis reutilise : son titre doit etre reecrit
     a chaque ouverture, sinon le second document herite du libelle du premier. */
  var ttl = ov.querySelector('#phx-title');
  if(ttl) ttl.textContent = pdf ? 'Imprimer le registre' : 'Exporter le registre';
  openOv(ovId);
}
window._phytoExportChoix = _phytoExportChoix;

// Sans argument : ouvre le choix de fenetre (c'est le clic sur le bouton d'export).
// Avec une cle de fenetre : construit et telecharge.
window._phytoExportCsv = function(mode){
  if(!_phytoExportGarde()) return;

  var F = _phytoFenetres(), fen = null;
  for(var i=0;i<F.length;i++){ if(F[i].k===mode){ fen = F[i]; break; } }
  if(!fen){ _phytoExportChoix(); return; }
  closeOv(null, 'ovPhytoExport');

  var R = window._phytoCsvRows(fen);
  if(!R.rows.length){ showToast('Aucun traitement sur cette p\u00e9riode','#B85A1A'); return; }

  var lines = [MV_PHY_CSV_COLS.map(_phCsvCell).join(';')];
  R.rows.forEach(function(r){ lines.push(r.map(_phCsvCell).join(';')); });
  var csv = '\uFEFF' + lines.join('\r\n') + '\r\n';

  var slug = String(window.DOMAINE_NOM||'domaine').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  var jour = _mvToday();
  // ⚠️ La fenetre est DANS le nom : deux exports du meme registre sur deux periodes
  //    differentes ne doivent pas se ressembler une fois poses sur un bureau.
  var fenNom = (R.d0 && R.d1) ? ('du-'+R.d0+'_au-'+R.d1) : 'complet';
  window.dlFile(csv, 'registre-phyto_'+(slug||'domaine')+'_'+fenNom+'_'+jour+'.csv', 'text/csv;charset=utf-8');

  // Un seul toast, du plus grave au plus anodin. Une ligne ABSENTE du fichier
  // (traitement sans date) passe avant une colonne vide (parcelle hors KML).
  if(!R.siret) showToast('Registre export\u00e9 \u2014 SIRET du domaine manquant (R\u00e9glages \u203a Domaine)','#B85A1A');
  else if(R.sansDate) showToast('Registre export\u00e9 \u2014 '+R.sansDate+' traitement(s) sans date, non inclus','#B85A1A');
  else if(R.sansGeo) showToast('Registre export\u00e9 \u2014 '+R.sansGeo+' ligne(s) sans coordonn\u00e9es (parcelle absente du KML)','#B85A1A');
  else showToast(R.rows.length+' ligne(s) export\u00e9es \u2014 '+String(fen.lbl).toLowerCase(),'#3D6B27');
};

// ── Exposition window (points d'entrée onclick + cross-module) ──
// (window._trat*/window._te*/window._phyPushRecent/window.openTraitEdit/window._conducteursDispo
//  sont déjà posés plus haut dans ce module.)
;(function(){
  var _exp = { renderPhyto: renderPhyto, switchPhytoTab: switchPhytoTab, _phytoSyncTabs: _phytoSyncTabs,
               openOvTraitement: openOvTraitement, _tratRender: _tratRender,
    openTraitDetail: openTraitDetail, confirmDeleteTraitement: confirmDeleteTraitement,
    openCatDetail: openCatDetail, _pMeta: _pMeta, _phResolve: _phResolve,
    _phyLookup: _phyLookup, _cuPct: _cuPct, _cuSuggest: _cuSuggest };
  for (var k in _exp) { if (typeof _exp[k] === 'function') window[k] = _exp[k]; }
})();

// Export EXPLICITE des points d'entree onclick d'index.html (page Phyto autonome).
// La boucle _exp ci-dessus les pose deja au runtime, mais le preflight (regle onclick -> window.*)
// ne voit que les assignations litterales : sans ces lignes, un onclick mort passerait inapercu.
window.switchPhytoTab = switchPhytoTab;
window._phytoSyncTabs = _phytoSyncTabs;
// FERTI-1 : un seul bouton rond, deux gestes selon l'onglet.
function _phytoFab(){ if(_phytoTab==='fer') openOvFerti(); else openOvTraitement(); }
window._phytoFab = _phytoFab;

// ==============================================================================
// FERTI-1 — L'AMENDEMENT ET LE REGISTRE DE FERTILISATION (onglet « Fertilisation »)
// ==============================================================================
// Dicté par Nico le 02/10 : le fournisseur passe, on choisit un amendement, on le
// sème au tracteur (semoir arrière) sur CERTAINES parcelles. L'appli doit compter
// les sacs, le temps, poser le travail prévu, et tenir le cahier d'enregistrement
// de la fertilisation — sans que l'admin ait à chercher partout.
//
// * AUCUNE COLLECTION NEUVE (règle §10-11). Les apports vivent dans
//   INTRANTS.fertil — une clé de plus du document `intrants`, admin seul en
//   écriture, comme le reste de La Réserve. ! La clé DOIT figurer dans
//   _rsvApply (reserve.js), sinon elle repart à [] au rechargement et la
//   sauvegarde suivante l'efface (piège vécu avec fut_mouv).
// * LE REGISTRE N'ÉCRIT PAS SES DATES. La date d'épandage d'une parcelle est LUE :
//   la session tracteur de l'activité « Amendement » qui l'a validée, sinon la
//   validation de la tâche « Amendement » au journal, sinon une date posée à la
//   main par l'admin (op.man). Aucune écriture depuis tracteur.js ni app.js.
// * RIEN N'EST INVENTÉ. Une composition absente donne « — », jamais 0 kg N.
//   Le type nitrates par défaut est le II : la règle classe en type II un
//   fertilisant dont on ne connaît pas les indicateurs (PAN, plaquette DRAAF BFC
//   7e programme). Les calendriers d'épandage vigne NE SONT PAS contrôlés : seule
//   la règle du type 0 (15/12 – 15/01) l'est, la seule lue dans le texte.
// * Le calcul de dose réglementaire (référentiel GREN) n'est PAS fait ici : on
//   enregistre la dose choisie.

var FER_TACHE = 'Amendement';
var FER_ACT   = 'Amendement';
var FER_TYP = {
  '0':  { lbl:'Type 0',   long:'Type 0 \u2014 organisation de l\u2019azote',
          aide:'Rare pour un amendement du commerce (compost de d\u00e9chets verts jeune, marc frais). \u00c9pandage interdit du 15 d\u00e9cembre au 15 janvier en zone vuln\u00e9rable.' },
  'Ia': { lbl:'Type I.a', long:'Type I.a \u2014 min\u00e9ralisation tr\u00e8s lente',
          aide:'Compost mature de d\u00e9chets verts ou de marc, fumier compact.' },
  'Ib': { lbl:'Type I.b', long:'Type I.b \u2014 min\u00e9ralisation lente',
          aide:'Fumier non compact, compost de biod\u00e9chets.' },
  'II': { lbl:'Type II',  long:'Type II \u2014 min\u00e9ralisation rapide',
          aide:'Choisi par d\u00e9faut\u00a0: la r\u00e8gle classe en type II un produit dont on ne conna\u00eet ni le C/N ni la part d\u2019azote min\u00e9ral. \u00c0 changer si le fournisseur indique autre chose.' },
  'III':{ lbl:'Type III', long:'Type III \u2014 engrais min\u00e9ral ou ur\u00e9ique',
          aide:'Ammonitrate, ur\u00e9e. Au-del\u00e0 de 60 kg N/ha d\u2019azote min\u00e9ral sur la campagne, l\u2019apport se fractionne en deux au moins.' }
};
var FER_RD = [ {v:65, l:'rangs courts'}, {v:75, l:'moyens'}, {v:85, l:'longs'} ];

function _ferNum(x){ var v=parseFloat(String(x==null?'':x).replace(',','.')); return (isNaN(v)||v<0)?0:v; }
function _ferFr(x,d){ d=d||0; return (Math.round(x*Math.pow(10,d))/Math.pow(10,d)).toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d}); }
function _ferHm(h){ var t=Math.round(h*60), H=Math.floor(t/60), M=t%60; return H+'\u00a0h\u00a0'+(M<10?'0':'')+M; }
function _ferHalf(x){ return Math.ceil(x*2-1e-9)/2; }
function _ferSacs(x){ return _ferFr(_ferHalf(x),1).replace(/,0$/,''); }
function _ferList(){ var I=window.INTRANTS; if(!I) return []; if(!Array.isArray(I.fertil)) I.fertil=[]; return I.fertil; }
function _ferParcs(){ return (window.PARCELLES||[]).filter(function(p){ return p && p.statut!=='Arrachee'; }); }
function _ferParc(nom){ return (window.PARCELLES||[]).find(function(p){ return p && p.nom===nom; }) || null; }
function _ferSurf(p){ return parseFloat(p&&p.surface)||0; }
function _ferIso(d){ var p=function(n){return (n<10?'0':'')+n;}; return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }
function _ferDfr(iso){ if(!iso) return '\u2014'; var a=String(iso).slice(0,10).split('-'); return a.length===3?(a[2]+'/'+a[1]+'/'+a[0]):String(iso); }

// La campagne culturale : du 1er septembre au 31 août (définition par défaut du
// programme d'actions). Une date -> l'année de son 1er septembre.
function _ferCampDe(iso){ if(!iso) return null; var y=parseInt(String(iso).slice(0,4),10), m=parseInt(String(iso).slice(5,7),10); if(isNaN(y)) return null; return (m>=9)?y:(y-1); }
function _ferCampLbl(y){ return y+'-'+(y+1); }

// L'azote d'un apport, par hectare. null = composition inconnue (jamais 0).
function _ferNha(op){ var d=_ferNum(op.dose), n=op.prod?op.prod.N:null; if(!d||n==null||n==='') return null; return d*1000*_ferNum(n)/100; }
function _ferEha(op,k){ var d=_ferNum(op.dose), n=op.prod?op.prod[k]:null; if(!d||n==null||n==='') return null; return d*1000*_ferNum(n)/100; }

// Le barème tracteur, depuis la vitesse : 1 ha / écartement = mètres de rang ;
// à v km/h ça fait un temps de semis pur, divisé par la part de temps utile.
function _ferHha(v,ec,rd){ v=_ferNum(v); ec=_ferNum(ec); rd=_ferNum(rd); if(!v||!ec||!rd) return 0; return (10000/ec)/(v*1000)/(rd/100); }

// -- Les dates d'épandage, LUES (jamais écrites par le registre) -------------
// Pour chaque apport et chaque parcelle : la première validation APRÈS la
// création de l'apport. Une validation ne sert qu'à un seul apport (le plus
// ancien qui l'attend) : deux apports sur la même parcelle ne se volent pas la date.
function _ferFaits(){
  var ops=_ferList().slice().sort(function(a,b){ return String(a.cree||'')<String(b.cree||'')?-1:1; });
  var ev=[];
  (window.SESSIONS||[]).forEach(function(s){
    if(!s||s.activite!==FER_ACT) return;
    (s.parcellesFaites||[]).forEach(function(x){
      var nom=(typeof x==='string')?x:((x&&x.nom)||''); if(!nom) return;
      var d=(x&&typeof x==='object'&&typeof x.t1==='number')?_ferIso(new Date(x.t1)):String(s.date||'').slice(0,10);
      if(d) ev.push({nom:nom, date:d, src:'session'});
    });
  });
  (window.JOURNAL||[]).forEach(function(j){
    if(!j||j.auTracteur||j.tache!==FER_TACHE||j.statut!=='Valid\u00e9'||!j.parcelle) return;   // auTracteur : la session est d\u00e9j\u00e0 lue
    var d=String(j.date||'').slice(0,10); if(d) ev.push({nom:j.parcelle, date:d, src:'journal'});
  });
  ev.sort(function(a,b){ return a.date<b.date?-1:(a.date>b.date?1:0); });
  var pris={}, out={};
  ops.forEach(function(op){
    var r={}; out[op.id]=r;
    (op.parcs||[]).forEach(function(nom){
      var man=op.man&&op.man[nom];
      if(man){ r[nom]={date:man, src:'main'}; return; }
      var c0=String(op.cree||'').slice(0,10);
      for(var i=0;i<ev.length;i++){
        var e=ev[i]; if(e.nom!==nom||pris[i]||e.date<c0) continue;
        pris[i]=1; r[nom]={date:e.date, src:e.src}; break;
      }
    });
  });
  return out;
}

// -- L'assistant ------------------------------------------------------------
// -- FERTI-3 : la session « Amendement » coche la tâche « Amendement » -----------
// Appelée par saveData('sessions') (app.js). Pour chaque parcelle faite dans une
// session de l'activité « Amendement » : si la tâche « Amendement » concerne la
// parcelle et n'y est pas validée, on la valide et on écrit UNE entrée de journal
// marquée auTracteur:true (le Pilotage l'écarte des heures dans les rangs : le temps
// est celui de la session). Idempotent : une entrée existe déjà pour cette session
// et cette parcelle -> rien. Ne défait rien : une parcelle décochée de la session
// garde sa validation (l'annuler reste le geste habituel, depuis la parcelle).
function _ferSyncSessions(){
  if(typeof window._mvOnActiveSaison==='function' && !window._mvOnActiveSaison()) return 0;
  var T=(window.TACHES||[]).find(function(x){ return x && x.nom===FER_TACHE; }); if(!T) return 0;
  var J=window.JOURNAL; if(!Array.isArray(J)) return 0;
  var deja={}; J.forEach(function(j){ if(j&&j.auTracteur&&j.session) deja[j.session+'\u0000'+j.parcelle]=1; });
  var n=0, t0=Date.now();
  (window.SESSIONS||[]).forEach(function(s){
    if(!s||s.activite!==FER_ACT) return;
    (s.parcellesFaites||[]).forEach(function(x){
      var nom=(typeof x==='string')?x:((x&&x.nom)||''); if(!nom) return;
      var sid=String(s.id||s.date||''); if(deja[sid+'\u0000'+nom]) return;
      var p=_ferParc(nom); if(!p||p.statut==='Arrachee') return;
      if((p.tachesExclues||[]).indexOf(FER_TACHE)>=0) return;
      if(!p.taches||typeof p.taches!=='object'||Array.isArray(p.taches)) p.taches={};
      var st=p.taches[FER_TACHE];
      if(st==='Valid\u00e9') { deja[sid+'\u0000'+nom]=1; return; }   // déjà validée à la main : on ne double pas le journal
      var d=(x&&typeof x==='object'&&typeof x.t1==='number')?_ferIso(new Date(x.t1)):String(s.date||'').slice(0,10);
      if(!d) return;
      p.taches[FER_TACHE]='Valid\u00e9';
      J.unshift({ id:(t0+n).toString(16), date:d, parcelle:nom, tache:FER_TACHE, qui:s.conducteur||'', quiHors:true,
                  statut:'Valid\u00e9', equipe:false, membresEquipe:[], auTracteur:true, session:sid,
                  note:'Fait au tracteur \u2014 session \u00ab\u00a0'+FER_ACT+'\u00a0\u00bb' });
      deja[sid+'\u0000'+nom]=1; n++;
    });
  });
  if(n){
    window.JOURNAL=J;
    if(typeof window.recalcTravaux==='function'){ try{ window.recalcTravaux(FER_TACHE); }catch(e){ if(window._mvAvale) window._mvAvale(e,'phyto.js/_ferSyncSessions'); } }
    if(window.saveData){ window.saveData('parcelles'); window.saveData('journal'); }
  }
  return n;
}

var _fer = null;
function _ferNeuf(){
  var vg=(typeof window._mvVigne==='function')?window._mvVigne():null;
  var tr=(window.TRACTEURS_LIST||[])[0]||null;
  var act=(window.ACTIVITES||[]).find(function(a){ return a&&a.nom===FER_ACT; });
  return { q:'', prod:{nom:'', ref:'', origine:'norme', amm:'', four:'', N:'', P:'', K:'', MO:'', CN:'', typ:'II', ab:!!(window.CONFIG&&window.CONFIG.bio)},
           dose:'', kg:'25', prix:'', pu:'t', parcs:{},
           v:'4', ec:vg?String(vg.ec_rang):'', rd:'75', mach:(act&&act.tracteurDefautId)||(tr?tr.id:''),
           sem:'', enf:'non', ouvert:{1:true} };
}
function _ferCalc(){
  var F=_fer, o={dose:_ferNum(F.dose), kg:_ferNum(F.kg), prix:_ferNum(F.prix)};
  o.hha=_ferHha(F.v,F.ec,F.rd);
  var op={dose:F.dose, prod:F.prod};
  o.nha=_ferNha(op); o.pha=_ferEha(op,'P'); o.kha=_ferEha(op,'K');
  o.list=[]; o.surf=0; o.T=0; o.SA=0; o.H=0; o.NT=0; o.nzv=0;
  _ferParcs().forEach(function(p){
    if(!F.parcs[p.nom]) return; var s=_ferSurf(p), t=o.dose*s;
    o.list.push(p); o.surf+=s; o.T+=t; o.SA+=o.kg?t*1000/o.kg:0; o.H+=o.hha*s; if(o.nha!=null) o.NT+=o.nha*s; if(p.zv) o.nzv++;
  });
  o.sacsCmd=(o.dose&&o.kg)?Math.ceil(o.SA-1e-9):0; o.tCmd=o.sacsCmd*o.kg/1000;
  o.cout=o.prix?(F.pu==='t'?(o.kg?o.tCmd:o.T)*o.prix:o.sacsCmd*o.prix):0;
  return o;
}
function _ferCss(){
  if(document.getElementById('fer-css')) return;
  var st=document.createElement('style'); st.id='fer-css';
  st.textContent=''
  +'.fer-c{background:var(--bg-card,#fff);border:1px solid var(--gris-clair,#ECE6DA);border-radius:16px;padding:14px;margin-bottom:12px}'
  +'.fer-st{display:flex;align-items:center;gap:10px;cursor:pointer;min-height:44px}'
  +'.fer-n{width:26px;height:26px;border-radius:50%;flex:none;display:grid;place-items:center;font-size:var(--pt-micro,11px);font-weight:700;background:var(--gris-clair,#ECE6DA);color:var(--texte-med,#4A4A3A)}'
  +'.fer-n.ok{background:var(--vert-pale,#EAF3E2);color:var(--vert-med,#3D6B27)}'
  +'.fer-stt{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:var(--pt-md,20px);font-weight:600;flex:1;color:var(--texte,#1A1A14)}'
  +'.fer-str{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);text-align:right;max-width:50%;line-height:1.45}'
  +'.fer-c.ferme .fer-bd{display:none}.fer-bd{margin-top:10px}'
  +'.fer-h{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);line-height:1.5;margin-top:6px}'
  +'.fer-box{background:var(--acier-pale,#ECF0F4);border-radius:12px;padding:10px 12px;margin-top:10px;font-size:var(--pt-txt,12.5px);line-height:1.55;color:var(--texte-med,#4A4A3A)}'
  +'.fer-box b{color:var(--texte,#1A1A14)}.fer-box.or{background:var(--or-pale,#FAF3E0)}'
  +'.fer-box.al{background:var(--orange-pale,#FBF0E6);border-left:3px solid var(--orange,#B85A1A);color:var(--texte-med,#4A4A3A)}.fer-box.al b{color:var(--texte,#1A1A14)}'
  +'.fer-box.rg{background:var(--rouge-pale,#FAEAE8);border-left:3px solid var(--rouge,#A0291E);color:var(--texte-med,#4A4A3A)}.fer-box.rg b{color:var(--texte,#1A1A14)}'
  +'.fer-ri{display:flex;gap:10px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--gris-clair,#ECE6DA);cursor:pointer;min-height:44px}'
  +'.fer-ri:last-child{border-bottom:0}.fer-ri.on{background:var(--vert-pale,#EAF3E2)}'
  +'.fer-res{border:1px solid var(--gris-clair,#ECE6DA);border-radius:12px;margin-top:8px;overflow:hidden}'
  +'.fer-rt{font-size:var(--pt-base,14px);font-weight:600;color:var(--texte,#1A1A14)}.fer-rs{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F)}'
  +'.fer-pl{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--gris-clair,#ECE6DA);cursor:pointer;min-height:44px}'
  +'.fer-pl:last-child{border-bottom:0}'
  +'.fer-ck{width:22px;height:22px;border-radius:7px;border:1.5px solid var(--gris,#DED7C9);flex:none;display:grid;place-items:center;color:var(--vert-med,#3D6B27);font-size:var(--pt-txt,12.5px)}'
  +'.fer-pl.on .fer-ck{background:var(--vert-pale,#EAF3E2);border-color:var(--vert-med,#3D6B27);color:var(--vert-med,#3D6B27)}'
  +'.fer-pv{text-align:right;font-variant-numeric:tabular-nums;flex:none;font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);line-height:1.45}'
  +'.fer-pv b{font-size:var(--pt-base,14px);color:var(--texte,#1A1A14);display:block}'
  +'.fer-pl:not(.on) .fer-pv{opacity:.35}'
  +'.fer-chip{display:inline-block;font-size:var(--pt-lbl,10.5px);font-weight:600;padding:2px 8px;border-radius:999px;white-space:nowrap;vertical-align:1px}'
  +'.fer-chip.zv{background:var(--phyto-pale,#F0EAF8);color:var(--texte,#1A1A14);box-shadow:inset 0 0 0 1px var(--phyto,#5B2D8E)}.fer-chip.ok{background:var(--vert-pale,#EAF3E2);color:var(--vert-med,#3D6B27)}'
  +'.fer-chip.al{background:var(--orange-pale,#FBF0E6);color:var(--texte,#1A1A14);box-shadow:inset 0 0 0 1px var(--orange,#B85A1A)}.fer-chip.n{background:var(--gris-clair,#ECE6DA);color:var(--texte-med,#4A4A3A)}'
  +'.fer-kp{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}'
  +'.fer-k{background:var(--blanc,#FBFAF6);border:1px solid var(--gris-clair,#ECE6DA);border-radius:12px;padding:10px 12px}'
  +'.fer-kv{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:var(--pt-xl,27px);font-weight:600;line-height:1;font-variant-numeric:tabular-nums;color:var(--texte,#1A1A14)}'
  +'.fer-k.dim .fer-kv{color:var(--texte-doux,#5F5F5F)}.fer-kl{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:4px}'
  +'.fer-wr{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--gris-clair,#ECE6DA)}.fer-wr:last-child{border-bottom:0}.fer-wr.off{opacity:.55}'
  +'.fer-wr b{font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--texte,#1A1A14)}.fer-wr small{display:block;font-size:var(--pt-micro,11px);color:var(--texte-med,#4A4A3A);line-height:1.45;margin-top:2px}'
  +'.fer-seg{display:flex;background:var(--gris-clair,#ECE6DA);border-radius:999px;padding:3px;gap:2px}'
  +'.fer-seg button{flex:1;border:0;background:none;border-radius:999px;padding:8px 6px;font-family:inherit;font-size:var(--pt-micro,11px);font-weight:600;color:var(--texte-med,#4A4A3A);cursor:pointer;min-height:36px}'
  +'.fer-seg button.on{background:var(--bg-card,#fff);color:var(--texte,#1A1A14);box-shadow:0 1px 3px rgba(0,0,0,.12)}'
  +'.fer-tr{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--gris-clair,#ECE6DA);font-size:var(--pt-txt,12.5px)}'
  +'.fer-tr:last-child{border-bottom:0}.fer-tr small{display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F)}'
  +'.fer-trk{height:6px;border-radius:99px;background:var(--gris-clair,#ECE6DA);overflow:hidden;margin:10px 0 4px}.fer-fil{height:100%;background:var(--vert-med,#3D6B27);border-radius:99px}'
  +'.fer-cf{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:1px solid var(--gris-clair,#ECE6DA)}.fer-cf:last-child{border-bottom:0}'
  +'.fer-ic{width:24px;height:24px;border-radius:50%;flex:none;display:grid;place-items:center;font-size:var(--pt-micro,11px);font-weight:700}'
  +'.fer-ic.ok{background:var(--vert-pale,#EAF3E2);color:var(--vert-med,#3D6B27)}.fer-ic.al{background:var(--orange-pale,#FBF0E6);color:var(--texte,#1A1A14);box-shadow:inset 0 0 0 1px var(--orange,#B85A1A)}.fer-ic.n{background:var(--gris-clair,#ECE6DA);color:var(--texte-med,#4A4A3A)}'
  +'.fer-cf b{font-size:var(--pt-txt,12.5px);font-weight:600;display:block;color:var(--texte,#1A1A14)}.fer-cf small{font-size:var(--pt-micro,11px);color:var(--texte-med,#4A4A3A);line-height:1.45}'
  +'.fer-lk{color:var(--phyto,#5B2D8E);font-weight:600;cursor:pointer;text-decoration:underline}';
  document.head.appendChild(st);
}
function _ferEnsureOv(){
  _ferCss();
  if(document.getElementById('ovFerti')) return;
  var w=document.createElement('div'); w.id='fer-overlays';
  w.innerHTML=''
  +'<div class="overlay" id="ovFerti" onclick="closeOv(event,\'ovFerti\')"><div class="modal" onclick="event.stopPropagation()">'
    +'<div class="modal-handle"></div><div class="modal-hd"><div class="modal-title">Amendement</div><div class="modal-sub" id="fer-sub"></div></div>'
    +'<div class="modal-body" id="fer-body"></div></div></div>'
  +'<div class="overlay" id="ovFerParc" onclick="closeOv(event,\'ovFerParc\')"><div class="modal" onclick="event.stopPropagation()">'
    +'<div class="modal-handle"></div><div class="modal-hd"><div class="modal-title" id="fer-pc-t">Parcelle</div><div class="modal-sub">Ce que le cahier de fertilisation demande, une fois pour toutes</div></div>'
    +'<div class="modal-body" id="fer-pc-body"></div></div></div>';
  document.body.appendChild(w);
}
function _ferIn(id, label, val, unit, attrs){
  return '<div class="mvr-fl">'+label+'</div><div style="position:relative">'
    +'<input class="mvr-fi" id="'+id+'" type="text" inputmode="decimal" autocomplete="off" value="'+_escAttr(val==null?'':String(val))+'" '+(attrs||'')
    +' style="text-align:right;padding-right:'+(unit?'64px':'12px')+'">'
    +(unit?'<span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);pointer-events:none">'+unit+'</span>':'')
    +'</div>';
}
function _ferStep(n, titre, corps){
  var ouv=!!(_fer.ouvert&&_fer.ouvert[n]);
  return '<div class="fer-c'+(ouv?'':' ferme')+'" id="fer-s'+n+'">'
    +'<div class="fer-st" onclick="_ferTog('+n+')"><div class="fer-n" id="fer-n'+n+'">'+n+'</div><div class="fer-stt">'+titre+'</div><div class="fer-str" id="fer-r'+n+'"></div></div>'
    +'<div class="fer-bd">'+corps+'</div></div>';
}
function openOvFerti(){
  if(!isAdmin()){ showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#C0392B'); return; }
  _ferEnsureOv();
  _fer=_ferNeuf();
  var F=_fer, P=F.prod;
  var tracs=(window.TRACTEURS_LIST||[]);
  var sa=(typeof window.getSaisonActive==='function')?window.getSaisonActive():null;
  document.getElementById('fer-sub').textContent='Campagne '+_ferCampLbl(_ferCampDe(_mvToday()))+(sa&&sa.nom?' \u00b7 p\u00e9riode '+sa.nom:'');
  var typOpts=Object.keys(FER_TYP).map(function(k){ return '<option value="'+k+'"'+(k===P.typ?' selected':'')+'>'+FER_TYP[k].long+'</option>'; }).join('');
  var b=''
  +'<div class="fer-h" style="margin:0 0 12px">Cinq \u00e9tapes conseill\u00e9es, aucune obligatoire. Ce qui manque reste \u00ab\u00a0\u2014\u00a0\u00bb\u00a0: rien n\u2019est invent\u00e9, et le reste s\u2019enregistre quand m\u00eame.</div>'
  +_ferStep(1,'Le produit',''
    +'<div class="mvr-fl" style="margin-top:0">Chercher dans E-Phy</div>'
    +'<input class="mvr-fi" id="fer-q" type="text" autocomplete="off" placeholder="Nom commercial ou n\u00b0 d\u2019AMM" oninput="_ferSearch(this.value)">'
    +'<div id="fer-res"></div>'
    +'<div class="fer-h">M\u00eame catalogue que pour un traitement, famille <b>MFSC</b> (mati\u00e8res fertilisantes). Un amendement <b>norm\u00e9</b> (NF U 44-051, NF U 42-001\u2026) n\u2019a pas d\u2019AMM\u00a0: tapez son nom ci-dessous et sa norme, \u00e9crite sur le sac.</div>'
    +'<div class="mvr-fl">Nom du produit</div><input class="mvr-fi" id="fer-nom" type="text" autocomplete="off" value="" oninput="_ferSet(\'prod.nom\',this.value)">'
    +'<div class="mvr-f2"><div><div class="mvr-fl">Norme ou AMM</div><input class="mvr-fi" id="fer-ref" type="text" autocomplete="off" placeholder="ex. NF U 44-051" oninput="_ferSet(\'prod.ref\',this.value)"></div>'
    +'<div><div class="mvr-fl">Fournisseur</div><input class="mvr-fi" id="fer-four" type="text" autocomplete="off" oninput="_ferSet(\'prod.four\',this.value)"></div></div>'
    +'<div class="mvr-fl">Composition \u2014 lue sur l\u2019\u00e9tiquette du sac</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">'
      +'<div>'+_ferIn('fer-N','Azote',P.N,'% N','oninput="_ferSet(\'prod.N\',this.value)"')+'</div>'
      +'<div>'+_ferIn('fer-P','Phosphore',P.P,'% P<sub>2</sub>O<sub>5</sub>','oninput="_ferSet(\'prod.P\',this.value)"')+'</div>'
      +'<div>'+_ferIn('fer-K','Potasse',P.K,'% K<sub>2</sub>O','oninput="_ferSet(\'prod.K\',this.value)"')+'</div></div>'
    +'<div class="mvr-f2"><div>'+_ferIn('fer-MO','Mati\u00e8re organique',P.MO,'%','oninput="_ferSet(\'prod.MO\',this.value)"')+'</div>'
      +'<div>'+_ferIn('fer-CN','Rapport C/N',P.CN,'C/N','oninput="_ferSet(\'prod.CN\',this.value)"')+'</div></div>'
    +'<div class="mvr-fl">Type au sens de la directive nitrates</div>'
    +'<select class="mvr-fi" id="fer-typ" onchange="_ferSet(\'prod.typ\',this.value)">'+typOpts+'</select>'
    +'<div class="fer-h" id="fer-typ-h"></div>'
    +'<label class="fer-pl" style="border:0"><input type="checkbox" id="fer-ab" '+(P.ab?'checked':'')+' onchange="_ferSet(\'prod.ab\',this.checked)" style="width:20px;height:20px;accent-color:var(--vert-med,#3D6B27)"><span style="font-size:var(--pt-txt,12.5px)">Utilisable en agriculture biologique</span></label>'
    +'<div class="mvr-f2"><div>'+_ferIn('fer-dose','Dose conseill\u00e9e',F.dose,'t/ha','oninput="_ferSet(\'dose\',this.value)"')+'</div>'
      +'<div>'+_ferIn('fer-kg','Poids d\u2019un sac',F.kg,'kg','oninput="_ferSet(\'kg\',this.value)"')+'</div></div>'
    +'<div class="fer-box" id="fer-calcN"></div>'
    +'<div class="mvr-fl">Prix fournisseur (facultatif)</div>'
    +'<div class="mvr-f2"><div style="position:relative"><input class="mvr-fi" id="fer-prix" type="text" inputmode="decimal" autocomplete="off" placeholder="\u2014" oninput="_ferSet(\'prix\',this.value)" style="text-align:right;padding-right:70px"><span id="fer-pu" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F)">\u20ac HT/t</span></div>'
    +'<div class="fer-seg" id="fer-useg"><button type="button" class="on" onclick="_ferUnit(\'t\')">\u00e0 la tonne</button><button type="button" onclick="_ferUnit(\'s\')">au sac</button></div></div>'
    +'<div class="fer-h">Sans prix, le co\u00fbt reste \u00ab\u00a0\u2014\u00a0\u00bb. Il se pose \u00e0 la facture, depuis l\u2019achat dans La R\u00e9serve.</div>')
  +_ferStep(2,'Les parcelles',''
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">'
      +'<button type="button" class="mvr-btn mvr-btn-o" style="flex:none;padding:8px 12px" onclick="_ferAll(1)">Tout cocher</button>'
      +'<button type="button" class="mvr-btn mvr-btn-o" style="flex:none;padding:8px 12px" onclick="_ferAll(0)">Tout d\u00e9cocher</button>'
      +'<button type="button" class="mvr-btn mvr-btn-o" style="flex:none;padding:8px 12px" onclick="_ferAll(\'zv\')">Zone vuln\u00e9rable</button></div>'
    +'<div id="fer-plist"></div>'
    +'<div class="fer-h">Sacs arrondis au demi-sac par parcelle\u00a0; la commande est arrondie au sac entier sur le total. <span class="fer-chip zv">ZV</span> = zone vuln\u00e9rable, d\u00e9clar\u00e9e dans le registre de fertilisation, parcelle par parcelle.</div>'
    +'<div id="fer-ilot"></div>')
  +_ferStep(3,'Le passage tracteur',''
    +'<div class="mvr-fl" style="margin-top:0">Machine</div>'
    +'<select class="mvr-fi" id="fer-mach" onchange="_ferSet(\'mach\',this.value)">'
      +(tracs.length?tracs.map(function(t){ return '<option value="'+_escAttr(t.id)+'"'+(t.id===F.mach?' selected':'')+'>'+_escHtml(t.nom||'')+(t.modele?' \u2014 '+_escHtml(t.modele):'')+'</option>'; }).join(''):'<option value="">Aucune machine enregistr\u00e9e</option>')
    +'</select>'
    +'<div class="mvr-f2"><div>'+_ferIn('fer-v','Vitesse dans le rang',F.v,'km/h','oninput="_ferSet(\'v\',this.value)"')+'</div>'
      +'<div>'+_ferIn('fer-ec','\u00c9cartement',F.ec,'m','oninput="_ferSet(\'ec\',this.value)"')+'</div></div>'
    +'<div class="fer-h">L\u2019\u00e9cartement est repris des r\u00e9glages du domaine (roue crant\u00e9e de la Vigne). Un passage par rang.</div>'
    +'<div class="mvr-f2" style="align-items:end"><div>'+_ferIn('fer-rd','Temps utile',F.rd,'%','oninput="_ferSet(\'rd\',this.value)"')+'</div>'
      +'<div class="fer-seg" id="fer-rdseg" style="margin-bottom:2px">'+FER_RD.map(function(r){ return '<button type="button" data-v="'+r.v+'" onclick="_ferRd('+r.v+')">'+r.l+'</button>'; }).join('')+'</div></div>'
    +'<div class="fer-box or"><b>Le temps utile, c\u2019est la part du temps o\u00f9 le semoir s\u00e8me vraiment dans le rang.</b><br>'
      +'Le reste, le tracteur tourne en bout de rang, s\u2019arr\u00eate pour recharger des sacs, ou traverse la parcelle.<br>'
      +'<b>75\u00a0%</b> veut dire\u00a0: sur 4 heures pass\u00e9es dans la parcelle, 3 heures \u00e0 semer.<br>'
      +'Plus les rangs sont courts, plus il y a de demi-tours, plus ce chiffre baisse. Les trois boutons sont des rep\u00e8res de d\u00e9part.<br>'
      +'Avec le chrono du Tracteur activ\u00e9, le temps r\u00e9el de chaque parcelle remplace l\u2019estimation dans le Pilotage.</div>'
    +'<div class="fer-box" id="fer-calcH"></div>')
  +_ferStep(4,'Date et conditions',''
    +'<div class="mvr-f2"><div><div class="mvr-fl" style="margin-top:0">Semaine pr\u00e9vue</div><input class="mvr-fi" id="fer-sem" type="date" onchange="_ferSet(\'sem\',this.value)"></div>'
    +'<div><div class="mvr-fl" style="margin-top:0">Enfouissement</div><select class="mvr-fi" id="fer-enf" onchange="_ferSet(\'enf\',this.value)"><option value="non">Non enfoui</option><option value="24h">Enfoui sous 24\u00a0h</option><option value="48h">Enfoui sous 48\u00a0h</option></select></div></div>'
    +'<div class="fer-box">La <b>date d\u2019\u00e9pandage</b> du registre n\u2019est pas celle-ci. C\u2019est le jour o\u00f9 la parcelle est <b>valid\u00e9e</b>\u00a0: dans une session tracteur de l\u2019activit\u00e9 \u00ab\u00a0Amendement\u00a0\u00bb, ou en validant la t\u00e2che \u00ab\u00a0Amendement\u00a0\u00bb sur la parcelle. Ici, on pose seulement la semaine.</div>'
    +'<div id="fer-dtw"></div>')
  +'<div class="fer-c"><div class="fer-st" style="cursor:default"><div class="fer-n" id="fer-n5">5</div><div class="fer-stt">Ce qui s\u2019ajoute dans l\u2019appli</div></div>'
    +'<div class="fer-kp"><div class="fer-k" id="fer-k1"><div class="fer-kv" id="fer-kS">\u2014</div><div class="fer-kl">sacs \u00e0 commander</div></div>'
      +'<div class="fer-k" id="fer-k2"><div class="fer-kv" id="fer-kN">\u2014</div><div class="fer-kl">kg d\u2019azote apport\u00e9s</div></div>'
      +'<div class="fer-k" id="fer-k3"><div class="fer-kv" id="fer-kH">\u2014</div><div class="fer-kl">heures tracteur pr\u00e9vues</div></div>'
      +'<div class="fer-k" id="fer-k4"><div class="fer-kv" id="fer-kE">\u2014</div><div class="fer-kl">co\u00fbt HT pr\u00e9vu</div></div></div>'
    +'<div id="fer-writes" style="margin-top:10px"></div></div>'
  +'<div class="mvr-btnrow" style="margin-top:6px"><button class="mvr-btn mvr-btn-o" onclick="closeOv(null,\'ovFerti\')">Annuler</button><button class="mvr-btn mvr-btn-p" id="fer-go" onclick="_ferSave()">Enregistrer</button></div>';
  document.getElementById('fer-body').innerHTML=b;
  _ferSearch('');
  _ferUp();
  openOv('ovFerti');
}
function _ferTog(n){ _fer.ouvert[n]=!_fer.ouvert[n]; var el=document.getElementById('fer-s'+n); if(el) el.classList.toggle('ferme', !_fer.ouvert[n]); }
function _ferSet(k,v){
  if(!_fer) return;
  if(k.indexOf('prod.')===0) _fer.prod[k.slice(5)]=v; else _fer[k]=v;
  _ferUp();
}
function _ferUnit(u){ _fer.pu=u; var s=document.getElementById('fer-useg'); if(s){ var b=s.querySelectorAll('button'); b[0].classList.toggle('on',u==='t'); b[1].classList.toggle('on',u==='s'); } var pu=document.getElementById('fer-pu'); if(pu) pu.textContent=(u==='t')?'\u20ac HT/t':'\u20ac HT/sac'; _ferUp(); }
function _ferRd(v){ _fer.rd=String(v); var i=document.getElementById('fer-rd'); if(i) i.value=v; _ferUp(); }
function _ferAll(m){ _fer.parcs={}; _ferParcs().forEach(function(p){ if(m===1||(m==='zv'&&p.zv)) _fer.parcs[p.nom]=1; }); _ferUp(); }
function _ferPick(i){ var p=_ferParcs()[i]; if(!p) return; if(_fer.parcs[p.nom]) delete _fer.parcs[p.nom]; else _fer.parcs[p.nom]=1; _ferUp(); }
function _ferSearch(q){
  if(!_fer) return; _fer.q=q||'';
  var el=document.getElementById('fer-res'); if(!el) return;
  var n=_phyNorm(_fer.q);
  if(n.length<2){ el.innerHTML=''; _fer._res=[]; return; }
  var res=_phyEphy().filter(function(p){ return p && p.type==='MFSC' && (_phyNorm(p.nom).indexOf(n)>=0 || String(p.amm||'').indexOf(n)>=0 || (p.noms2||[]).some(function(x){ return _phyNorm(x).indexOf(n)>=0; })); }).slice(0,8);
  _fer._res=res;
  el.innerHTML=res.length
    ? '<div class="fer-res">'+res.map(function(p,i){ return '<div class="fer-ri'+(_fer.prod.amm&&_fer.prod.amm===p.amm?' on':'')+'" onclick="_ferPickEphy('+i+')"><div style="flex:1;min-width:0"><div class="fer-rt">'+_escHtml(p.nom)+'</div><div class="fer-rs">E-Phy MFSC \u00b7 AMM '+_escHtml(p.amm||'\u2014')+(p.sub?' \u00b7 '+_escHtml(p.sub):'')+(p.statut&&p.statut!=='ok'?' \u00b7 retir\u00e9':'')+'</div></div></div>'; }).join('')+'</div>'
    : '<div class="fer-h">Aucune mati\u00e8re fertilisante de ce nom dans E-Phy. S\u2019il est norm\u00e9, saisissez-le ci-dessous avec sa norme.</div>';
}
function _ferPickEphy(i){
  var p=(_fer._res||[])[i]; if(!p) return;
  _fer.prod.nom=p.nom; _fer.prod.amm=p.amm||''; _fer.prod.ref=p.amm?('AMM '+p.amm):''; _fer.prod.origine='ephy';
  var a=document.getElementById('fer-nom'); if(a) a.value=p.nom;
  var r=document.getElementById('fer-ref'); if(r) r.value=_fer.prod.ref;
  _ferSearch(_fer.q); _ferUp();
}
function _ferUp(){
  if(!_fer) return;
  var F=_fer, P=F.prod, o=_ferCalc(), g=function(id){ return document.getElementById(id); };
  var th=g('fer-typ-h'); if(th) th.textContent=(FER_TYP[P.typ]||FER_TYP.II).aide;
  // étape 1
  var ok1=!!(o.dose&&o.kg);
  g('fer-calcN').innerHTML=(o.dose&&o.nha!=null)
    ? _ferFr(o.dose,1)+'\u00a0t/ha \u00d7 '+_ferFr(_ferNum(P.N),1)+'\u00a0% d\u2019azote = <b>'+_ferFr(o.nha)+'\u00a0kg N/ha</b>'
      +((o.pha!=null||o.kha!=null)?'<br>et '+(o.pha!=null?_ferFr(o.pha)+'\u00a0kg P<sub>2</sub>O<sub>5</sub>/ha':'\u2014 P<sub>2</sub>O<sub>5</sub>')+', '+(o.kha!=null?_ferFr(o.kha)+'\u00a0kg K<sub>2</sub>O/ha':'\u2014 K<sub>2</sub>O')+'.':'')+' Ces chiffres vont dans le registre.'
    : 'Renseignez la dose et le pourcentage d\u2019azote pour conna\u00eetre l\u2019azote apport\u00e9 par hectare. Sans eux, le registre \u00e9crira \u00ab\u00a0\u2014\u00a0\u00bb.';
  g('fer-r1').innerHTML=(P.nom?_escHtml(P.nom)+'<br>':'')+(ok1?_ferFr(o.dose,1)+'\u00a0t/ha'+(o.nha!=null?' \u00b7 '+_ferFr(o.nha)+'\u00a0kg N/ha':''):'<span class="fer-chip al">dose ou sac\u00a0?</span>')+(o.prix?'':' <span class="fer-chip n">prix \u00e0 venir</span>');
  g('fer-n1').className='fer-n'+(P.nom&&ok1?' ok':'');
  // étape 2
  g('fer-plist').innerHTML=_ferParcs().map(function(p,i){
    var on=!!F.parcs[p.nom], s=_ferSurf(p), t=o.dose*s, sc=o.kg?t*1000/o.kg:0;
    return '<div class="fer-pl'+(on?' on':'')+'" onclick="_ferPick('+i+')"><div class="fer-ck">'+(on?_mvIcon('check',16):'')+'</div>'
      +'<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:var(--pt-base,14px)">'+_escHtml(p.nom)+(p.zv?' <span class="fer-chip zv">ZV</span>':'')+'</div>'
      +'<div class="fer-rs">'+_ferFr(s,2)+'\u00a0ha'+(p.cepage?' \u00b7 '+_escHtml(p.cepage):'')+(p.ilot?' \u00b7 '+_escHtml(p.ilot):'')+'</div></div>'
      +'<div class="fer-pv"><b>'+(ok1?_ferSacs(sc)+' sacs':'\u2014')+'</b>'+(o.dose?_ferFr(t*1000)+'\u00a0kg':'dose\u00a0?')+(o.nha!=null&&o.dose?' \u00b7 '+_ferFr(o.nha*s,1)+'\u00a0kg N':'')+(o.hha?'<br>'+_ferHm(o.hha*s):'')+'</div></div>';
  }).join('') || '<div class="fer-h">Aucune parcelle en exploitation.</div>';
  var miss=o.list.filter(function(p){ return p.zv && !p.ilot; });
  g('fer-ilot').innerHTML=miss.length?'<div class="fer-box al"><b>'+miss.map(function(p){ return _escHtml(p.nom); }).join(', ')+'\u00a0: \u00eelot PAC non renseign\u00e9.</b><br>L\u2019apport s\u2019enregistre. Le cahier imprimera un tiret \u00e0 cet endroit tant que l\u2019\u00eelot n\u2019est pas pos\u00e9 (registre de fertilisation, carte \u00ab\u00a0Ce qu\u2019un contr\u00f4le va demander\u00a0\u00bb).</div>':'';
  g('fer-r2').innerHTML=o.list.length?o.list.length+' parcelle'+(o.list.length>1?'s':'')+' \u00b7 '+_ferFr(o.surf,2)+'\u00a0ha'+(o.nzv?'<br>dont '+o.nzv+' en ZV':''):'<span class="fer-chip al">aucune</span>';
  g('fer-n2').className='fer-n'+(o.list.length?' ok':'');
  // étape 3
  var rv=_ferNum(F.rd), seg=g('fer-rdseg'); if(seg) seg.querySelectorAll('button').forEach(function(b){ b.classList.toggle('on', Number(b.getAttribute('data-v'))===rv); });
  var ec=_ferNum(F.ec), v=_ferNum(F.v);
  g('fer-calcH').innerHTML=o.hha
    ? '1\u00a0ha \u00e0 '+_ferFr(ec,2)+'\u00a0m d\u2019\u00e9cartement = <b>'+_ferFr(10000/ec)+'\u00a0m de rang</b> \u00e0 parcourir<br>'
      +'\u00e0 '+_ferFr(v,1)+'\u00a0km/h, \u00e7a fait '+_ferHm(10000/ec/(v*1000))+' de semis pur<br>'
      +'divis\u00e9 par '+_ferFr(rv)+'\u00a0% de temps utile = <b>'+_ferFr(o.hha,1)+'\u00a0h par hectare</b>'
    : 'Renseignez la vitesse, l\u2019\u00e9cartement et le temps utile pour estimer le temps.';
  g('fer-r3').innerHTML=o.hha?_ferFr(o.hha,1)+'\u00a0h/ha':'<span class="fer-chip al">vitesse\u00a0?</span>';
  g('fer-n3').className='fer-n'+(o.hha?' ok':'');
  // étape 4
  var md=0; if(F.sem){ var m=parseInt(F.sem.slice(5,7),10), d=parseInt(F.sem.slice(8,10),10); md=m*100+d; }
  g('fer-r4').innerHTML=F.sem?'semaine du '+_ferDfr(F.sem):'\u2014';
  g('fer-n4').className='fer-n'+(F.sem?' ok':'');
  g('fer-dtw').innerHTML=(P.typ==='0'&&o.nzv&&md&&(md>=1215||md<=115))?'<div class="fer-box rg"><b>Type 0 en zone vuln\u00e9rable\u00a0: \u00e9pandage interdit du 15 d\u00e9cembre au 15 janvier inclus.</b> Rien n\u2019est bloqu\u00e9, la date est signal\u00e9e.</div>':'';
  // récap
  var np=o.list.length;
  g('fer-kS').textContent=o.sacsCmd?_ferFr(o.sacsCmd):'\u2014';
  g('fer-kN').textContent=(np&&o.nha!=null)?_ferFr(o.NT):'\u2014';
  g('fer-kH').textContent=(np&&o.H)?_ferHm(o.H):'\u2014';
  g('fer-kE').textContent=o.cout?_ferFr(o.cout)+'\u00a0\u20ac':'\u2014';
  ['fer-k1','fer-k2','fer-k3','fer-k4'].forEach(function(id,i){ var val=[o.sacsCmd,(np&&o.nha!=null),(np&&o.H),o.cout][i]; g(id).className='fer-k'+(val?'':' dim'); });
  var trac=(window.TRACTEURS_LIST||[]).find(function(t){ return t.id===F.mach; });
  var W=[
    [np, 'Registre de fertilisation', np?(np+' ligne'+(np>1?'s':'')+' pr\u00e9vue'+(np>1?'s':'')+(o.nha!=null?', '+_ferFr(o.nha)+'\u00a0kg N/ha':', azote \u00ab\u00a0\u2014\u00a0\u00bb')+'. Chaque ligne se date seule quand la parcelle est valid\u00e9e.'):'Choisissez au moins une parcelle.'],
    [np&&o.hha, 'Travail pr\u00e9vu \u00b7 t\u00e2che \u00ab\u00a0Amendement\u00a0\u00bb', (np&&o.hha)?(_ferHm(o.H)+' pr\u00e9vues sur '+np+' parcelle'+(np>1?'s':'')+', dans la p\u00e9riode active. Elles comptent dans l\u2019avancement, le reste \u00e0 faire et les temps de travaux du Pilotage.'):'Il faut des parcelles et une vitesse pour estimer les heures.'],
    [o.hha, 'Tracteur \u00b7 activit\u00e9 \u00ab\u00a0Amendement\u00a0\u00bb', o.hha?('Bar\u00e8me pos\u00e9 \u00e0 '+_ferFr(o.hha,1)+'\u00a0h/ha'+(trac?', '+_escHtml(trac.nom||''):'')+'. Les sessions de semis comptent dans les heures tracteur.'):'Bar\u00e8me non pos\u00e9\u00a0: l\u2019activit\u00e9 est cr\u00e9\u00e9e sans estimation.'],
    [P.nom, 'R\u00e9serve \u00b7 le produit', P.nom?('\u00ab\u00a0'+_escHtml(P.nom)+'\u00a0\u00bb, fournitures vigne'+(o.sacsCmd?', '+o.sacsCmd+' sacs de '+_ferFr(o.kg)+'\u00a0kg \u00e0 commander':'')+'. L\u2019achat se saisit \u00e0 la livraison, le prix \u00e0 la facture.'):'Donnez un nom au produit.'],
    [o.cout, 'Co\u00fbt pr\u00e9vu', o.cout?(_ferFr(o.cout)+'\u00a0\u20ac HT, gard\u00e9 sur l\u2019apport. Le co\u00fbt r\u00e9el entre dans le Pilotage avec la facture.'):'Co\u00fbt \u00ab\u00a0\u2014\u00a0\u00bb tant que le prix n\u2019est pas saisi.']
  ];
  g('fer-writes').innerHTML=W.map(function(w){ return '<div class="fer-wr'+(w[0]?'':' off')+'"><div><b>'+w[1]+' '+(w[0]?'<span class="fer-chip ok">ajout\u00e9</span>':'<span class="fer-chip n">en attente</span>')+'</b><small>'+w[2]+'</small></div></div>'; }).join('');
  var go=g('fer-go'); if(go) go.disabled=!(np&&P.nom);
}

// L'ENREGISTREMENT — un seul geste, six écritures.
function _ferSave(){
  if(!isAdmin()||!_fer) return;
  var F=_fer, P=F.prod, o=_ferCalc();
  if(!P.nom||!String(P.nom).trim()){ showToast('Donnez un nom au produit','#B85A1A'); return; }
  if(!o.list.length){ showToast('Choisissez au moins une parcelle','#B85A1A'); return; }
  var I=window.INTRANTS; if(!I){ showToast('La R\u00e9serve n\u2019est pas encore charg\u00e9e','#C0392B'); return; }
  var nomP=String(P.nom).trim();
  var num=function(x){ return (x==null||String(x).trim()==='')?null:_ferNum(x); };
  // 1) La Réserve : le produit (jamais en double).
  if(!Array.isArray(I.produits)) I.produits=[];
  var prod=I.produits.find(function(x){ return x && _phyNorm(x.nom)===_phyNorm(nomP); });
  if(!prod){
    prod={ id:'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), nom:nomP, cat:'vigne', unite:'kg',
           contenance:o.kg||25, contLbl:'sac', conso_src:'manual', conso_manuel:0, amm:P.amm||'' };
    I.produits.push(prod);
  }
  if(P.four){ if(!Array.isArray(I.achat_four)) I.achat_four=[]; if(I.achat_four.indexOf(P.four)<0) I.achat_four.push(P.four); }
  // 2) L'apport.
  var hha=o.hha?Math.round(o.hha*100)/100:0;
  var op={ id:'f'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), cree:_mvToday(),
    prodId:prod.id,
    prod:{ nom:nomP, ref:String(P.ref||'').trim(), origine:P.origine||'norme', amm:P.amm||'', four:String(P.four||'').trim(),
           N:num(P.N), P:num(P.P), K:num(P.K), MO:num(P.MO), CN:num(P.CN), typ:P.typ||'II', ab:!!P.ab },
    dose:num(F.dose), kgSac:num(F.kg), prix:num(F.prix), pu:F.pu, cout:o.cout||null, sacs:o.sacsCmd||null,
    parcs:o.list.map(function(p){ return p.nom; }),
    trac:{ v:num(F.v), ec:num(F.ec), rd:num(F.rd), hha:hha||null, mach:F.mach||'' },
    sem:F.sem||'', enf:F.enf||'non', man:{} };
  _ferList().push(op);
  window.saveIntrants();
  // 3) La tâche « Amendement » : barème = celui du calcul, posée dans la période active.
  var T=window.TACHES||[], t=T.find(function(x){ return x && x.nom===FER_TACHE; }), neuve=!t;
  if(!t){ t={nom:FER_TACHE, anytime:true, custom:true, hha:hha}; T.push(t); }
  else if(hha) t.hha=hha;
  window.TACHES=T; if(window.saveData) window.saveData('taches');
  var sa=(typeof window.getSaisonActive==='function')?window.getSaisonActive():null;
  if(sa&&sa.nom&&typeof window._perPoseTache==='function'){ if(window._perPoseTache(FER_TACHE,[sa.nom])&&window.saveData) window.saveData('saisons'); }
  // 4) Les parcelles concernées. Une tâche vaut pour toutes les parcelles sauf
  //    celles qui l'excluent : à la création, on exclut celles qui ne sont pas
  //    cochées ; ensuite, on ne fait qu'inclure les nouvelles.
  var sel={}; o.list.forEach(function(p){ sel[p.nom]=1; });
  _ferParcs().forEach(function(p){
    if(!Array.isArray(p.tachesExclues)) p.tachesExclues=[];
    var k=p.tachesExclues.indexOf(FER_TACHE);
    if(sel[p.nom]){ if(k>=0) p.tachesExclues.splice(k,1); }
    else if(neuve && k<0) p.tachesExclues.push(FER_TACHE);
  });
  if(window.saveData) window.saveData('parcelles');
  if(typeof window.recalcTravaux==='function'){ try{ window.recalcTravaux(FER_TACHE); }catch(e){ if(window._mvAvale) window._mvAvale(e,'phyto.js/_ferSave recalc'); } }
  // 5) L'activité tracteur et son barème.
  var A=window.ACTIVITES||[], a=A.find(function(x){ return x && x.nom===FER_ACT; });
  if(!a){ a={nom:FER_ACT, emoji:'', tracteurDefautId:F.mach||''}; A.push(a); }
  if(F.mach) a.tracteurDefautId=F.mach;
  if(hha) a.h_ha=hha;
  window.ACTIVITES=A; if(window.saveData) window.saveData('activites');
  closeOv(null,'ovFerti');
  showToast('Amendement enregistr\u00e9 \u00b7 '+o.list.length+' parcelle'+(o.list.length>1?'s':''),'#3D6B27');
  _fer=null;
  if(typeof window.renderParcelles==='function'){ try{ window.renderParcelles(); }catch(e){ if(window._mvAvale) window._mvAvale(e,'phyto.js/_ferSave parcelles'); } }
  _ferRender();
}

// -- La fiche « fertilisation » d'une parcelle (îlot, sol, zone vulnérable) --
var _ferPcNom=null;
function openFerParc(nom){
  if(!isAdmin()) return;
  var p=_ferParc(nom); if(!p) return;
  _ferEnsureOv(); _ferPcNom=nom;
  document.getElementById('fer-pc-t').textContent=nom;
  document.getElementById('fer-pc-body').innerHTML=''
    +'<label class="fer-pl" style="border:0;margin-top:0"><input type="checkbox" id="fer-pc-zv" '+(p.zv?'checked':'')+' style="width:20px;height:20px;accent-color:var(--phyto,#5B2D8E)"><span style="font-size:var(--pt-txt,12.5px)">En zone vuln\u00e9rable aux nitrates</span></label>'
    +'<div class="fer-h" style="margin-top:0">Le classement peut ne couvrir qu\u2019une partie d\u2019une commune (par section cadastrale). La carte officielle est sur le site de la DREAL.</div>'
    +'<div class="mvr-fl">\u00celot PAC</div><input class="mvr-fi" id="fer-pc-ilot" type="text" autocomplete="off" placeholder="ex. \u00eelot 12" value="'+_escAttr(p.ilot||'')+'">'
    +'<div class="mvr-fl">Type de sol</div><input class="mvr-fi" id="fer-pc-sol" type="text" autocomplete="off" placeholder="ex. argilo-calcaire" value="'+_escAttr(p.sol||'')+'">'
    +'<div class="mvr-fl">Ann\u00e9e de plantation</div><input class="mvr-fi" id="fer-pc-plant" type="text" inputmode="numeric" autocomplete="off" placeholder="ex. 1987" value="'+_escAttr(p.plantee||'')+'">'
    +'<div class="fer-h">Le cahier demande la date d\u2019implantation de la culture. Pour une vigne, son ann\u00e9e de plantation.</div>'
    +'<div class="mvr-btnrow" style="margin-top:18px"><button class="mvr-btn mvr-btn-o" onclick="closeOv(null,\'ovFerParc\')">Annuler</button><button class="mvr-btn mvr-btn-p" onclick="_ferParcSave()">Enregistrer</button></div>';
  openOv('ovFerParc');
}
function _ferParcSave(){
  if(!isAdmin()) return;
  var p=_ferParc(_ferPcNom); if(!p) return;
  var zv=!!document.getElementById('fer-pc-zv').checked;
  var il=String(document.getElementById('fer-pc-ilot').value||'').trim();
  var so=String(document.getElementById('fer-pc-sol').value||'').trim();
  // FERTI-2 : l'annee de plantation. Quatre chiffres plausibles, sinon rien (jamais devinee).
  var pl=String((document.getElementById('fer-pc-plant')||{}).value||'').trim(), an=new Date().getFullYear();
  if(pl && !(/^\d{4}$/.test(pl) && +pl>=1850 && +pl<=an)){ showToast('Ann\u00e9e de plantation illisible \u2014 quatre chiffres, par ex. 1987','#B85A1A'); return; }
  if(zv) p.zv=true; else delete p.zv;
  if(il) p.ilot=il; else delete p.ilot;
  if(so) p.sol=so; else delete p.sol;
  if(pl) p.plantee=+pl; else delete p.plantee;
  if(window.saveData) window.saveData('parcelles');
  closeOv(null,'ovFerParc'); showToast('Parcelle mise \u00e0 jour','#3D6B27');
  _ferRender();
}

// Date posée à la main (pas de session, pas de tâche validée) — ou retirée.
function _ferMan(opId, nom){
  if(!isAdmin()) return;
  var op=_ferList().find(function(x){ return x && x.id===opId; }); if(!op) return;
  if(typeof window.openPrompt!=='function') return;
  var cur=(op.man&&op.man[nom])||'';
  window.openPrompt({ titre:'Date d\u2019\u00e9pandage \u2014 '+nom, sub:'Format JJ/MM/AAAA. Vide pour retirer la date pos\u00e9e \u00e0 la main.', type:'texte', icone:'calendrier',
    valeur:cur?_ferDfr(cur):'', placeholder:'JJ/MM/AAAA', btnLabel:'Enregistrer',
    cb:function(v){
      v=String(v||'').trim(); if(!op.man||typeof op.man!=='object') op.man={};
      if(!v){ delete op.man[nom]; }
      else { var m=v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if(!m){ showToast('Date illisible \u2014 JJ/MM/AAAA','#B85A1A'); return; }
             var p2=function(x){ return (x.length<2?'0':'')+x; }; op.man[nom]=m[3]+'-'+p2(m[2])+'-'+p2(m[1]); }
      window.saveIntrants(); _ferRender();
    } });
}
function _ferDel(opId){
  if(!isAdmin()) return;
  var L=_ferList(), i=L.findIndex(function(x){ return x && x.id===opId; }); if(i<0) return;
  var go=function(){ L.splice(i,1); window.saveIntrants(); _ferRender(); showToast('Apport retir\u00e9 du registre','#8A8072'); };
  if(typeof window.openConfirmDel==='function') window.openConfirmDel('Retirer cet apport du registre\u00a0?', 'La t\u00e2che, l\u2019activit\u00e9 tracteur et le produit de La R\u00e9serve restent en place.', go, 'corbeille', 'Retirer');
}

// -- L'onglet « Fertilisation » ---------------------------------------------
var _ferCampVue=null;
function _ferCamps(){
  var s={}, today=_ferCampDe(_mvToday()); s[today]=1;
  var Fa=_ferFaits();
  _ferList().forEach(function(op){ var c=_ferCampDe(op.cree); if(c!=null) s[c]=1; var r=Fa[op.id]||{}; Object.keys(r).forEach(function(n){ var y=_ferCampDe(r[n].date); if(y!=null) s[y]=1; }); });
  return Object.keys(s).map(Number).sort(function(a,b){ return b-a; });
}
// Les lignes du cahier, pour une campagne : un apport FAIT par parcelle, daté.
function _ferLignes(camp){
  var Fa=_ferFaits(), out=[];
  _ferList().forEach(function(op){
    var r=Fa[op.id]||{};
    (op.parcs||[]).forEach(function(nom){
      var f=r[nom]; if(!f||_ferCampDe(f.date)!==camp) return;
      var p=_ferParc(nom), s=_ferSurf(p), nha=_ferNha(op);
      out.push({op:op, nom:nom, p:p, date:f.date, src:f.src, surf:s, nha:nha, nTot:(nha!=null?nha*s:null), pha:_ferEha(op,'P'), kha:_ferEha(op,'K')});
    });
  });
  out.sort(function(a,b){ return a.date<b.date?-1:(a.date>b.date?1:0); });
  return out;
}
function _ferRender(){
  var el=document.getElementById('tab-fer-trac'); if(!el) return;
  _ferCss();
  var adm=isAdmin(), camps=_ferCamps();
  if(_ferCampVue==null||camps.indexOf(_ferCampVue)<0) _ferCampVue=camps[0];
  var C=_ferCampVue, Fa=_ferFaits();
  var ops=_ferList().filter(function(op){
    if(_ferCampDe(op.cree)===C) return true;
    var r=Fa[op.id]||{}; return Object.keys(r).some(function(n){ return _ferCampDe(r[n].date)===C; });
  }).slice().reverse();
  var h='';
  if(camps.length>1) h+='<div class="fer-seg" style="margin-bottom:12px">'+camps.slice(0,4).map(function(y){ return '<button type="button" class="'+(y===C?'on':'')+'" onclick="_ferCamp('+y+')">'+_ferCampLbl(y)+'</button>'; }).join('')+'</div>';
  h+='<div class="fer-h" style="margin:0 0 10px">Campagne '+_ferCampLbl(C)+', du 1<sup>er</sup> septembre au 31 ao\u00fbt. '+(adm?'Le bouton rond ajoute un amendement.':'')+'</div>';
  if(!ops.length) h+='<div class="fer-c"><div class="fer-h" style="margin:0">Aucun apport sur cette campagne.'+(adm?' Touchez le bouton rond en bas \u00e0 droite pour enregistrer un amendement\u00a0: sacs, temps tracteur et registre se remplissent seuls.':'')+'</div></div>';
  ops.forEach(function(op){
    var r=Fa[op.id]||{}, nha=_ferNha(op), tot=0, fait=0, nf=0;
    (op.parcs||[]).forEach(function(n){ var s=_ferSurf(_ferParc(n)); tot+=s; if(r[n]){ fait+=s; nf++; } });
    var pct=tot?Math.round(fait/tot*100):0, P=op.prod||{};
    h+='<div class="fer-c">'
      +'<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div style="min-width:0">'
        +'<div class="fer-stt" style="font-size:var(--pt-md,20px)">'+_escHtml(P.nom||'\u2014')+'</div>'
        +'<div class="fer-rs" style="margin-top:3px;line-height:1.5">'+(FER_TYP[P.typ]||FER_TYP.II).lbl+' \u00b7 '+(nha!=null?_ferFr(nha)+'\u00a0kg N/ha':'azote \u2014')+(P.ref?' \u00b7 '+_escHtml(P.ref):'')+(P.ab?' \u00b7 <span class="fer-chip ok">AB</span>':'')
        +'<br>'+(op.dose?_ferFr(op.dose,1)+'\u00a0t/ha':'dose \u2014')+(op.sacs?' \u00b7 '+op.sacs+' sacs de '+_ferFr(op.kgSac||0)+'\u00a0kg':'')+(op.cout?' \u00b7 '+_ferFr(op.cout)+'\u00a0\u20ac HT pr\u00e9vus':'')+'</div></div>'
        +'<span class="fer-chip '+(pct>=100?'ok':'al')+'">'+(pct>=100?'fait':'en cours')+'</span></div>'
      +'<div class="fer-trk"><div class="fer-fil" style="width:'+pct+'%"></div></div>'
      +'<div class="fer-rs">'+nf+' parcelle'+(nf>1?'s':'')+' sur '+(op.parcs||[]).length+' faite'+(nf>1?'s':'')+' \u00b7 '+_ferFr(fait,2)+'\u00a0ha sur '+_ferFr(tot,2)+'\u00a0ha</div>'
      +'<div style="margin-top:6px">'+(op.parcs||[]).map(function(n){
          var p=_ferParc(n), f=r[n], s=_ferSurf(p);
          var src=f?(f.src==='session'?'session tracteur':(f.src==='journal'?'t\u00e2che valid\u00e9e':'pos\u00e9e \u00e0 la main')):'';
          return '<div class="fer-tr"><div style="min-width:0"><b>'+_escHtml(n)+'</b>'+(p&&p.zv?' <span class="fer-chip zv">ZV</span>':'')
            +'<small>'+_ferFr(s,2)+'\u00a0ha \u00b7 '+(f?('sem\u00e9 le '+_ferDfr(f.date)+' ('+src+')'):(op.sem?'pr\u00e9vu semaine du '+_ferDfr(op.sem):'pr\u00e9vu'))
            +(adm?' \u00b7 <span class="fer-lk" onclick="_ferMan(\''+_escAttr(op.id)+'\',\''+_escAttr(n)+'\')">'+(f&&f.src==='main'?'corriger':(f?'':'poser la date'))+'</span>':'')+'</small></div>'
            +'<div style="text-align:right;flex:none;font-variant-numeric:tabular-nums">'+(nha!=null?_ferFr(nha*s,1)+'\u00a0kg N':'\u2014')+'<small>'+(f?'<span class="fer-chip ok">fait</span>':'<span class="fer-chip n">\u00e0 faire</span>')+'</small></div></div>';
        }).join('')+'</div>'
      +(adm?'<div style="text-align:right;margin-top:6px"><span class="fer-lk" style="color:var(--texte-doux,#5F5F5F)" onclick="_ferDel(\''+_escAttr(op.id)+'\')">Retirer du registre</span></div>':'')
      +'</div>';
  });
  // L'azote de la campagne, par parcelle (apports faits seulement).
  var L=_ferLignes(C), parN={};
  L.forEach(function(l){ var k=l.nom; if(!parN[k]) parN[k]={n:0, nInc:false, p:0, k:0, nb:0, s:l.surf}; var o=parN[k]; o.nb++; if(l.nha==null) o.nInc=true; else o.n+=l.nha; if(l.pha!=null) o.p+=l.pha; if(l.kha!=null) o.k+=l.kha; });
  var ks=Object.keys(parN).sort(function(a,b){ return a.localeCompare(b,'fr'); });
  h+='<div class="fer-c"><div class="fer-stt" style="font-size:var(--pt-md,20px)">Azote apport\u00e9 sur la campagne</div>'
    +'<div class="fer-rs" style="margin-top:3px">Tous apports confondus, faits seulement, par hectare</div>'
    +(ks.length?ks.map(function(k){ var o=parN[k]; return '<div class="fer-tr"><div><b>'+_escHtml(k)+'</b><small>'+o.nb+' apport'+(o.nb>1?'s':'')+'</small></div><div style="text-align:right;font-variant-numeric:tabular-nums"><b>'+_ferFr(o.n)+'</b>'+(o.nInc?'\u00a0+\u00a0?':'')+'\u00a0kg N/ha<small>'+_ferFr(o.p)+' P<sub>2</sub>O<sub>5</sub> \u00b7 '+_ferFr(o.k)+' K<sub>2</sub>O</small></div></div>'; }).join('')
      :'<div class="fer-h">Aucun apport fait sur cette campagne.</div>')
    +'</div>';
  // Ce qu'un contrôle va demander.
  var zvP=_ferParcs().filter(function(p){ return p.zv; }), zvS=zvP.reduce(function(s,p){ return s+_ferSurf(p); },0);
  var noIl=zvP.filter(function(p){ return !p.ilot; }), noSol=zvP.filter(function(p){ return !p.sol; });
  var minPar={}; L.forEach(function(l){ if(l.op.prod&&l.op.prod.typ==='III'&&l.nha!=null){ minPar[l.nom]=(minPar[l.nom]||0)+l.nha; } });
  var fracto=Object.keys(minPar).filter(function(k){ return minPar[k]>60; });
  var lk=function(p){ return adm?'<span class="fer-lk" onclick="openFerParc(\''+_escAttr(p.nom)+'\')">'+_escHtml(p.nom)+'</span>':_escHtml(p.nom); };
  h+='<div class="fer-c"><div class="fer-stt" style="font-size:var(--pt-md,20px)">Ce qu\u2019un contr\u00f4le va demander</div>'
    +'<div class="fer-rs" style="margin-top:3px">Zone vuln\u00e9rable\u00a0: '+zvP.length+' parcelle'+(zvP.length>1?'s':'')+', '+_ferFr(zvS,2)+'\u00a0ha</div>';
  h+='<div class="fer-cf"><div class="fer-ic '+(zvP.length?'ok':'n')+'">'+(zvP.length?_mvIcon('check',16):'i')+'</div><div><b>'+(zvP.length?'Parcelles en zone vuln\u00e9rable d\u00e9clar\u00e9es':'Aucune parcelle d\u00e9clar\u00e9e en zone vuln\u00e9rable')+'</b><small>'
    +'Le zonage a \u00e9t\u00e9 revu en 2026 et peut ne couvrir qu\u2019une partie d\u2019une commune. '+(adm?'Touchez une parcelle pour la d\u00e9clarer\u00a0: ':'')+_ferParcs().map(function(p){ return lk(p)+(p.zv?' (ZV)':''); }).join(', ')+'</small></div></div>';
  if(zvP.length) h+='<div class="fer-cf"><div class="fer-ic '+(noIl.length?'al':'ok')+'">'+(noIl.length?'!':_mvIcon('check',16))+'</div><div><b>'+(noIl.length?'\u00celot PAC manquant sur '+noIl.length+' parcelle'+(noIl.length>1?'s':''):'\u00celots PAC renseign\u00e9s')+'</b><small>'+(noIl.length?noIl.map(lk).join(', ')+'. Le cahier exige la r\u00e9f\u00e9rence de l\u2019\u00eelot.':'Ils sortent sur le cahier imprim\u00e9.')+'</small></div></div>';
  if(zvP.length) h+='<div class="fer-cf"><div class="fer-ic '+(noSol.length?'al':'ok')+'">'+(noSol.length?'!':_mvIcon('check',16))+'</div><div><b>'+(noSol.length?'Type de sol manquant sur '+noSol.length+' parcelle'+(noSol.length>1?'s':''):'Types de sol renseign\u00e9s')+'</b><small>'+(noSol.length?noSol.map(lk).join(', ')+'.':'Ils sortent sur le cahier imprim\u00e9.')+'</small></div></div>';
  h+='<div class="fer-cf"><div class="fer-ic ok">'+_mvIcon('check',16)+'</div><div><b>Rendement r\u00e9alis\u00e9 repris de la vendange</b><small>Les hL/ha du Cuvier entrent dans le cahier sans ressaisie.</small></div></div>';
  h+='<div class="fer-cf"><div class="fer-ic '+(zvS>3?'al':'n')+'">'+(zvS>3?'!':'i')+'</div><div><b>Analyse de sol de la campagne</b><small>Au-del\u00e0 de 3\u00a0ha en zone vuln\u00e9rable, une analyse par campagne est exig\u00e9e (mati\u00e8re organique pour la vigne). '+(zvS>3?'Le domaine en a '+_ferFr(zvS,2)+'\u00a0ha\u00a0: concern\u00e9.':'Le domaine en a '+_ferFr(zvS,2)+'\u00a0ha\u00a0: non concern\u00e9 aujourd\u2019hui.')+'</small></div></div>';
  h+='<div class="fer-cf"><div class="fer-ic '+(fracto.length?'al':'ok')+'">'+(fracto.length?'!':_mvIcon('check',16))+'</div><div><b>'+(fracto.length?'Fractionnement \u00e0 v\u00e9rifier':'Pas de fractionnement \u00e0 pr\u00e9voir')+'</b><small>'+(fracto.length?fracto.map(_escHtml).join(', ')+'\u00a0: plus de 60\u00a0kg N/ha d\u2019azote min\u00e9ral sur la campagne. Il doit \u00eatre apport\u00e9 en deux fois au moins.':'Il ne concerne que l\u2019azote min\u00e9ral (type III) au-del\u00e0 de 60\u00a0kg N/ha.')+'</small></div></div>';
  h+='<div class="fer-cf"><div class="fer-ic n">i</div><div><b>Plan pr\u00e9visionnel de fumure</b><small>Le calcul de dose r\u00e9glementaire (r\u00e9f\u00e9rentiel r\u00e9gional) reste celui de votre conseiller. Ma Vigne enregistre la dose choisie.</small></div></div>';
  h+='</div>';
  h+='<div style="display:flex;gap:8px;margin-top:4px"><button class="mvr-btn mvr-btn-p" style="flex:1" onclick="_ferExportPdf()">Imprimer le cahier</button><button class="mvr-btn mvr-btn-o" style="flex:1" onclick="_ferExportCsv()">Fichier tableur</button></div>'
    +'<div class="fer-h" style="text-align:center;margin-top:8px">Les deux sont aussi dans la roue crant\u00e9e du Phyto.</div>';
  el.innerHTML=h;
}
function _ferCamp(y){ _ferCampVue=y; _ferRender(); }

// -- Le cahier imprimé et le fichier tableur --------------------------------
function _ferRdt(camp){
  var out={};
  if(typeof window._mlRendements!=='function') return out;
  try{ (window._mlRendements(String(camp))||[]).forEach(function(o){ if(o&&o.parcelle&&o.parcelle.nom&&o.hlHa!=null&&isFinite(o.hlHa)) out[o.parcelle.nom]=o.hlHa; }); }
  catch(e){ if(window.logError) window.logError({level:'warning',cat:'fertil',msg:'rendements illisibles : '+(e&&e.message)}); }
  return out;
}
function _ferExportPdf(){
  var C=(_ferCampVue!=null)?_ferCampVue:_ferCampDe(_mvToday());
  var L=_ferLignes(C), rdt=_ferRdt(C), e=_escHtml;
  var byP={}; L.forEach(function(l){ (byP[l.nom]=byP[l.nom]||[]).push(l); });
  var noms=_ferParcs().map(function(p){ return p.nom; }).sort(function(a,b){ return a.localeCompare(b,'fr'); });
  var siret=(window.CONFIG&&window.CONFIG.siret)||'';
  var corps='<div class="fer-meta">Campagne culturale du 1<sup>er</sup> septembre '+C+' au 31 ao\u00fbt '+(C+1)+' \u00b7 Exploitation\u00a0: '+e(window.DOMAINE_NOM||'')+' \u00b7 SIRET\u00a0: '+(siret?e(siret):'\u2014')+'</div>';
  noms.forEach(function(nom){
    var p=_ferParc(nom), ls=byP[nom]||[];
    corps+='<div class="fer-blk mvdoc-avoid"><div class="fer-bh"><span>'+e(nom)+'</span><span>'+(p&&p.zv?'Zone vuln\u00e9rable':'Hors zone vuln\u00e9rable')+'</span></div>'
      +'<table class="fer-kv"><tr><td><span>\u00celot PAC</span>'+e((p&&p.ilot)||'\u2014')+'</td><td><span>Surface</span>'+_ferFr(_ferSurf(p),2)+'\u00a0ha</td><td><span>Type de sol</span>'+e((p&&p.sol)||'\u2014')+'</td></tr>'
      +'<tr><td><span>Culture</span>Vigne (VITVI)</td><td><span>Plantation</span>'+e((p&&p.plantee)?String(p.plantee):'\u2014')+/* FERTI-2 : p.plantee, pos\u00e9e depuis la fiche fertilisation */'</td><td><span>Rendement r\u00e9alis\u00e9 '+C+'</span>'+(rdt[nom]!=null?_ferFr(rdt[nom],1)+'\u00a0hL/ha':'\u2014')+'</td></tr></table>'
      +'<table class="fer-t"><tr><th>Date</th><th class="r">Superficie</th><th>Fertilisant</th><th>Type</th><th class="r">% N</th><th class="r">Quantit\u00e9 d\u2019azote</th></tr>'
      +(ls.length?ls.map(function(l){ var P=l.op.prod||{}; return '<tr><td>'+_ferDfr(l.date)+'</td><td class="r">'+_ferFr(l.surf,2)+'\u00a0ha</td><td>'+e(P.nom||'')+'<br><span class="fer-g">'+e(P.ref||'')+(l.op.dose?' \u00b7 '+_ferFr(l.op.dose*1000)+'\u00a0kg/ha':'')+(l.op.enf&&l.op.enf!=='non'?' \u00b7 enfoui sous '+e(l.op.enf):'')+'</span></td><td>'+(FER_TYP[P.typ]||FER_TYP.II).lbl.replace('Type ','')+'</td><td class="r">'+(P.N!=null?_ferFr(P.N,1):'\u2014')+'</td><td class="r"><b>'+(l.nTot!=null?_ferFr(l.nTot,1)+'\u00a0kg':'\u2014')+'</b></td></tr>'; }).join('')
        :'<tr><td colspan="6" class="fer-g">Aucun apport de fertilisant azot\u00e9 enregistr\u00e9 sur la campagne.</td></tr>')
      +'</table></div>';
  });
  corps+='<div class="mvdoc-lim">Document \u00e0 conserver au moins cinq campagnes. Date d\u2019\u00e9pandage = validation de la parcelle (session tracteur ou t\u00e2che), ou date pos\u00e9e par l\u2019administrateur. Quantit\u00e9 d\u2019azote = dose \u00d7 teneur en azote de l\u2019\u00e9tiquette \u00d7 superficie. Un tiret signale une information non renseign\u00e9e dans Ma Vigne.</div>';
  var css='.fer-meta{font-size:var(--pt-nano,9.5px);color:#5F5F5F;margin-bottom:10px}'
    +'.fer-blk{border:1px solid #DED7C9;border-radius:6px;padding:8px 9px;margin-bottom:9px}'
    +'.fer-bh{display:flex;justify-content:space-between;font-weight:700;font-size:var(--pt-lbl,10.5px);margin-bottom:5px}'
    +'.fer-kv{width:100%;border-collapse:collapse;margin-bottom:6px;font-size:var(--pt-nano,9.5px)}.fer-kv td{padding:2px 6px 2px 0;width:33%;vertical-align:top}.fer-kv span{display:block;color:#5F5F5F;font-size:var(--pt-nano,9.5px)}'
    +'.fer-t{width:100%;border-collapse:collapse;font-size:var(--pt-nano,9.5px)}.fer-t th{text-align:left;font-size:var(--pt-nano,9.5px);text-transform:uppercase;letter-spacing:.04em;color:#5F5F5F;border-bottom:1px solid #DED7C9;padding:3px}'
    +'.fer-t td{padding:3px;border-bottom:1px solid #ECE6DA;font-variant-numeric:tabular-nums;vertical-align:top}.fer-t .r{text-align:right}.fer-g{color:#5F5F5F}';
  window._mvDocOpen({ titre:'Cahier d\u2019enregistrement des pratiques de fertilisation', metas:['Campagne '+_ferCampLbl(C), L.length+' apport'+(L.length>1?'s':'')+' enregistr\u00e9'+(L.length>1?'s':'')], corps:corps, css:css, cat:'fertil' });
}
function _ferExportCsv(){
  var C=(_ferCampVue!=null)?_ferCampVue:_ferCampDe(_mvToday());
  var L=_ferLignes(C), rdt=_ferRdt(C);
  if(!L.length){ showToast('Aucun apport fait sur la campagne '+_ferCampLbl(C),'#B85A1A'); return; }
  var cell=function(v){ var s=(v==null?'':String(v)); return /[;"\r\n]/.test(s)?('"'+s.replace(/"/g,'""')+'"'):s; };
  var dec=function(n,d){ return (n==null||!isFinite(n))?'':(Math.round(n*Math.pow(10,d))/Math.pow(10,d)).toString().replace('.',','); };
  var siret=(window.CONFIG&&window.CONFIG.siret)||'';
  var cols=['SIRET','Campagne','Parcelle','Ilot PAC','Zone vulnerable','Type de sol','Culture','Rendement realise (hL/ha)','Date epandage','Superficie (ha)','Fertilisant','Norme ou AMM','Type nitrates','Teneur N (%)','Dose (kg/ha)','Azote par ha (kg N/ha)','Quantite totale azote (kg N)','P2O5 (kg/ha)','K2O (kg/ha)','Utilisable AB','Enfouissement','Origine de la date','Annee de plantation'];
  var lines=[cols.map(cell).join(';')];
  L.forEach(function(l){ var P=l.op.prod||{}, p=l.p||{};
    lines.push([siret,_ferCampLbl(C),l.nom,p.ilot||'',p.zv?'oui':'non',p.sol||'','VITVI',dec(rdt[l.nom],1),_ferDfr(l.date),dec(l.surf,2),P.nom||'',P.ref||'',(FER_TYP[P.typ]||FER_TYP.II).lbl.replace('Type ',''),dec(P.N,2),dec(l.op.dose!=null?l.op.dose*1000:null,0),dec(l.nha,1),dec(l.nTot,1),dec(l.pha,1),dec(l.kha,1),P.ab?'oui':'non',l.op.enf||'non',(l.src==='session'?'session tracteur':(l.src==='journal'?'tache validee':'saisie admin')),p.plantee||''].map(cell).join(';'));
  });
  var csv='\uFEFF'+lines.join('\r\n')+'\r\n';
  var slug=String(window.DOMAINE_NOM||'domaine').toLowerCase().normalize('NFD').split('').filter(function(c){ var k=c.charCodeAt(0); return k<768||k>879; }).join('').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  window.dlFile(csv,'cahier-fertilisation_'+(slug||'domaine')+'_'+_ferCampLbl(C)+'_'+_mvToday()+'.csv','text/csv;charset=utf-8');
  showToast(L.length+' ligne'+(L.length>1?'s':'')+' export\u00e9e'+(L.length>1?'s':'')+(siret?'':' \u2014 SIRET du domaine manquant'),siret?'#3D6B27':'#B85A1A');
}

window.openOvFerti=openOvFerti; window._ferTog=_ferTog; window._ferSet=_ferSet; window._ferUnit=_ferUnit; window._ferRd=_ferRd;
window._ferAll=_ferAll; window._ferPick=_ferPick; window._ferSearch=_ferSearch; window._ferPickEphy=_ferPickEphy; window._ferSave=_ferSave;
window.openFerParc=openFerParc; window._ferParcSave=_ferParcSave; window._ferMan=_ferMan; window._ferDel=_ferDel;
window._ferRender=_ferRender; window._ferCamp=_ferCamp; window._ferExportPdf=_ferExportPdf; window._ferExportCsv=_ferExportCsv;
window._ferFaits=_ferFaits; window._ferSyncSessions=_ferSyncSessions; window._ferLignes=_ferLignes; window._ferHha=_ferHha;
