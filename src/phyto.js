// ════════════════════════════════════
// MA VIGNE — phyto.js
// Assistant de traitement phytosanitaire + référentiel E-Phy + registre + budget cuivre
// Extrait d'app.js (MAINT-1) — iso-comportement, aucune logique modifiée.
// © 2026 Nicolas GUERET / GUERETTECH
// ════════════════════════════════════

// Fonctions pures importées d'utils.js (mêmes exports que tracteur.js)
import { isAdmin, isTractoriste, showToast, _escHtml, _escAttr, dreEffectif } from './utils.js';

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
  var isCat=(_phytoTab==='cat');
  if(reg) reg.style.display=isCat?'none':'';
  if(chips) chips.style.display=isCat?'none':'';
  if(cat) cat.style.display=isCat?'':'none';
  ['reg','cat'].forEach(function(t){
    var b=document.getElementById('phyto-ong-'+t);
    if(b) b.classList.toggle('active', t===_phytoTab);
  });
  // FAB « nouveau traitement » : sur le registre uniquement, et seulement si le rôle l'autorise
  // Export réglementaire : sur le registre seulement, et pour un administrateur seulement.
  var exp=document.getElementById('phyto-export-row');
  if(exp){
    var admE=false;
    try{ admE=(typeof window.isAdmin==='function')&&window.isAdmin(); }catch(e){ admE=false; }
    exp.style.display=(!isCat&&admE)?'':'none';
  }
  var fab=document.getElementById('phyto-fab');
  if(fab){
    var canW=true;
    try{ canW=(typeof window.isAdmin==='function'&&window.isAdmin())||(typeof window.isTractoriste==='function'&&window.isTractoriste()); }catch(e){ canW=true; }
    fab.style.display=(!isCat&&canW)?'flex':'none';
  }
}

// Action utilisateur : bascule d'onglet (remplace les 3 boutons du bas de l'ancien panneau Tracteur).
function switchPhytoTab(tab){
  _phytoTab=(tab==='cat')?'cat':'reg';
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
      <div class="ov-hd"><div class="ov-title" id="ocd-title"></div><div class="ov-close" onclick="closeOv(null,'${ovId}')">✕</div></div>
      <div id="ocd-body" style="padding:0 20px 20px;overflow-y:auto;max-height:70vh"></div>
      <div style="padding:16px 20px">
        <button class="mbtn" onclick="closeOv(null,'${ovId}')" style="width:100%;font-family:Outfit,sans-serif;font-size:13px;padding:12px;border-radius:12px;border:1.5px solid var(--gris);background:var(--bg-card);color:var(--texte-doux);cursor:pointer">Fermer</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
  }
  const title=document.getElementById('ocd-title');
  title.textContent=(TEMJ[p.type]||'🧪')+' '+p.nom;
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
      <div style="font-size:9px;text-transform:uppercase;color:var(--texte-doux);font-weight:600;margin-bottom:6px">🎯 Cibles</div>
      <div style="font-size:13px;font-weight:600;color:var(--vert)">${p.cible}</div>
    </div>`:''}
    ${p.usage?`<div style="background:var(--tag-amber-bg,#FFF8E8);border:1.5px solid #E8C840;border-radius:12px;padding:14px">
      <div style="font-size:9px;text-transform:uppercase;color:var(--tag-amber-tx,#7A5C10);font-weight:600;margin-bottom:6px">⚠️ Conditions d'emploi</div>
      <div style="font-size:12px;color:var(--tag-amber-tx,#4A3A08);line-height:1.5">${p.usage}</div>
    </div>`:''}
  `;
  ov.classList.add('open');
}

var _trat={step:1,produits:[],date:'',conducteur:'',parcelles:[],stade:'',heureDebut:'',heureFin:'',dreAnticipe:'',modeAb:false,note:''};

// ════ Phyto : référentiel E-Phy + récents (catalogue local = repli invisible) ════
function _phyNorm(s){
  s=(s==null?'':String(s)).toLowerCase();
  try{ s=s.normalize('NFD'); var o=''; for(var i=0;i<s.length;i++){ var cc=s.charCodeAt(i); if(cc>=768&&cc<=879) continue; o+=s[i]; } s=o; }catch(e){}
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
function _phyWriteRecents(arr){ try{ localStorage.setItem(_phyRecentsKey(), JSON.stringify(arr.slice(0,10))); }catch(e){} }
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
    +'</div><span style="color:var(--acier-med);font-size:17px;font-weight:700">+</span></div>';
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
    +'<div style="font-size:14px;font-weight:700;color:var(--texte);margin-bottom:'+(m.sub?'2':'10')+'px">'+(T[m.type]||'')+' '+_escHtml(m.nom)+'</div>'
    +(m.sub?'<div style="font-size:11px;color:var(--texte-doux);margin-bottom:10px">'+_escHtml(m.sub)+'</div>':'')
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:10px">'
    +'<div style="background:var(--gris-clair);border-radius:8px;padding:7px;text-align:center"><div style="font-size:9px;color:var(--texte-doux);text-transform:uppercase;font-weight:600">DAR</div><div style="font-size:18px;font-weight:700;font-family:&#39;Cormorant Garamond&#39;,serif;color:'+(m.dar>0?'var(--or)':'var(--vert-med)')+'">'+(m.dar>0?m.dar+'j':'Libre')+'</div></div>'
    +'<div style="background:var(--gris-clair);border-radius:8px;padding:7px;text-align:center"><div style="font-size:9px;color:var(--texte-doux);text-transform:uppercase;font-weight:600">DRE</div><div style="font-size:18px;font-weight:700;font-family:&#39;Cormorant Garamond&#39;,serif;color:'+((m.drae||0)>0?'var(--orange)':'var(--vert-med)')+'">'+(m.drae||0)+'h</div></div>'
    +'<div style="background:var(--gris-clair);border-radius:8px;padding:7px;text-align:center"><div style="font-size:9px;color:var(--texte-doux);text-transform:uppercase;font-weight:600">ZNT</div><div style="font-size:18px;font-weight:700;font-family:&#39;Cormorant Garamond&#39;,serif;color:'+(m.znt>5?'var(--rouge)':'var(--texte)')+'">'+(m.znt!=null?m.znt+'m':'&#8212;')+'</div></div>'
    +'</div>'
    +'<input id="trat-dose-input" type="text" placeholder="'+ph+'" value="'+_escHtml(m.dose||'')+'" style="width:100%;padding:11px 12px;border-radius:10px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px;margin-bottom:9px">'
    +'<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px"><span style="font-size:11px;color:var(--texte-doux);white-space:nowrap">Dose/ha</span>'
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
      html+='<div style="font-size:11px;color:var(--texte-doux);text-transform:uppercase;font-weight:600;letter-spacing:.03em;margin:6px 0 7px">'+g[1]+' ('+items.length+')</div>';
      html+=items.map(function(o){return _tratResultRow(o.r.meta,o.r.section,o.i);}).join('');
    });
    if(_trat._ephyMore>0) html+='<div style="font-size:11px;color:var(--texte-doux);text-align:center;padding:3px">+ '+_trat._ephyMore+' autres &#8212; pr&#xe9;cisez la recherche</div>';
    if(!q) html+='<div style="font-size:11px;color:var(--texte-doux);display:flex;gap:6px;align-items:flex-start;margin-top:6px;padding:8px 10px;background:rgba(74,158,224,0.06);border-radius:8px"><span>&#x1F50D;</span><span>Tapez un nom ou une substance pour chercher dans le <strong style="color:#7FC3E6">catalogue officiel E-Phy (ANSES)</strong>.</span></div>';
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
    +'<span style="font-size:11px;font-weight:700;color:#A56B3A;white-space:nowrap">&#x1FA99; Cuivre m&#xe9;tal</span>'
    +'<input id="trat-cu-'+i+'" type="number" step="0.05" inputmode="decimal" value="'+v+'" oninput="window._tratSetCu('+i+',this.value)" style="width:74px;padding:5px 7px;border-radius:7px;border:1.5px solid rgba(165,107,58,0.4);background:var(--bg-card);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px;text-align:center">'
    +'<span style="font-size:11px;color:var(--texte-doux);white-space:nowrap">kg/ha</span>'
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
          +'<div style="font-size:11px;color:var(--texte-doux)">'+p.surface+' ha</div></div>'
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
  var CU_MAX=28;
  var rows=_trat.parcelles.map(function(nom){var cur=window._cuParcRollSum(nom)||0;return {nom:nom,cur:cur,proj:cur+add};}).sort(function(a,b){return b.proj-a.proj;});
  var over=rows.filter(function(r){return r.proj>CU_MAX;});
  var col=function(v){var r=v/CU_MAX;return r>1?'#C0392B':(r>=0.875?'#B8621A':(r>=0.75?'#C9A84C':'#3D7A27'));};
  var f1=function(v){return v.toFixed(1).replace('.',',');};
  var h='<div style="background:rgba(26,74,122,0.05);border:1.5px solid rgba(26,74,122,0.25);border-radius:12px;padding:14px;margin-bottom:14px">'
    +'<div style="font-size:13px;font-weight:700;color:#1A4A7A;margin-bottom:3px">&#x1F535; Budget cuivre m&#xe9;tal &#x00B7; bio</div>'
    +'<div style="font-size:11px;color:var(--texte-doux);margin-bottom:12px">Plafond 28&#x202F;kg Cu/ha sur 7 ans (4 kg/ha/an en moyenne). Ce traitement apporte <b style="color:#1A4A7A">+'+f1(add)+'&#x202F;kg/ha</b>.</div>';
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
    h+='<div style="font-size:11.5px;color:var(--rouge);background:rgba(192,57,43,0.08);border:1px solid rgba(192,57,43,0.25);border-radius:8px;padding:9px 11px;margin-top:4px;line-height:1.5">&#x26A0;&#xFE0F; D&#xe9;passement du plafond 28&#x202F;kg/ha sur '+over.length+' parcelle'+(over.length>1?'s':'')+' : '+_escHtml(over.map(function(r){return r.nom;}).join(', '))+'. Le traitement <b>reste enregistrable</b> &#x2014; le d&#xe9;passement est consign&#xe9; au registre ; v&#xe9;rifier la d&#xe9;rogation applicable.</div>';
  } else {
    h+='<div style="font-size:11.5px;color:var(--vert);background:rgba(61,122,39,0.08);border:1px solid rgba(61,122,39,0.25);border-radius:8px;padding:9px 11px;margin-top:4px">&#x2705; Conforme &#x2014; toutes les parcelles restent sous 28&#x202F;kg/ha sur 7 ans.</div>';
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
      :'<div style="font-size:11px;color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:8px">'
        +_trat.produits.length+' produit'+(_trat.produits.length>1?'s':'')+' dans ce traitement</div>'
        +_trat.produits.map(function(p,i){
          var c=_pMeta(p);
          var warns='';
          if(c.stadeOblig)warns+='<span style="font-size:10px;color:var(--phyto-med,#A060E0)">&#x1F4CB; stade requis</span> ';
          if(c.heureOblig||c.type==='Insecticide')warns+='<span style="font-size:10px;color:var(--or)">&#x1F550; horaires conseill&#xe9;s</span> ';
          if(c.drae>0)warns+='<span style="font-size:10px;color:var(--orange)">DRE '+c.drae+'h</span>';
          return '<div style="display:flex;align-items:center;gap:10px;background:var(--gris-clair);border-radius:10px;padding:10px 12px;margin-bottom:6px">'
            +'<div style="flex:1"><div style="font-size:13px;font-weight:700">'+_escHtml(p.nom)+'</div>'
            +(p.dose?'<div style="font-size:11px;color:var(--texte-doux)">'+_escHtml(p.dose)+'</div>':'')
            +(p.dose_val!=null?'<div style="font-size:11px;color:#A56B3A;font-weight:600">&#x1F4E6; '+p.dose_val+' '+_escHtml(p.dose_unit||'')+'</div>':'')
            +(warns?'<div style="margin-top:3px">'+warns+'</div>':'')+(c.type==='Cuivre'?_tratCuFieldHtml(p,i):'')+'</div>'
            +'<button onclick="window._tratRemoveProd(\''+p.nom.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\')" style="min-width:44px;min-height:44px;border-radius:8px;border:none;background:rgba(192,57,43,0.2);color:var(--rouge);font-size:14px;cursor:pointer"><span>&#x2715;</span></button>'
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
      +'<div style="font-size:11px;color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:8px">+ Ajouter un produit</div>'
      +'<div style="position:relative;margin-bottom:10px">'
      +'<span style="position:absolute;left:11px;top:11px;font-size:14px;pointer-events:none">&#x1F50D;</span>'
      +'<input id="trat-q" type="text" oninput="window._tratSearch(this.value)" autocomplete="off" placeholder="Vos produits + catalogue E-Phy ANSES&#x2026;" value="'+_escHtml(_trat.q||'')+'" style="width:100%;padding:11px 12px 11px 34px;border-radius:10px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px">'
      +'<button id="trat-q-clr" onclick="window._tratQClear()" style="position:absolute;right:6px;top:6px;width:30px;height:30px;border:none;background:transparent;color:var(--texte-doux);cursor:pointer;display:'+(_trat.q?'block':'none')+'"><span>&#x2715;</span></button>'
      +'</div>'
      +'<div id="trat-add-zone">'+_tratAddZoneHtml()+'</div>'
      +'</div>';
    var dateHtml='<div style="margin-bottom:14px">'
      +'<div style="font-size:11px;color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:6px">Date du traitement</div>'
      +'<input id="trat-date" type="date" style="width:100%;padding:11px 12px;border-radius:10px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px">'
      +'</div>';
    var conds=_conducteursDispo().filter(function(c){return c.statut!=='Archivé';});
    var condHtml='<div style="margin-bottom:14px">'
      +'<div style="font-size:11px;color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:6px">Conducteur du tracteur</div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +conds.map(function(c){
        var sel=_trat.conducteur===c.nom;
        return '<div onclick="window._tratSetConducteur(\''+c.nom.replace(/'/g,"\\'")+'\')" style="padding:10px 16px;border-radius:10px;cursor:pointer;background:'+(sel?'var(--acier)':'var(--bg-card)')+';border:1.5px solid '+(sel?'var(--acier-med)':'var(--gris)')+';color:'+(sel?'#fff':'var(--texte-doux)')+';font-size:13px;font-weight:600;min-height:44px;display:flex;align-items:center">'+_escHtml(c.nom)+'</div>';
      }).join('')+'</div></div>';
    var stadeOpts=STADES_PHENO.map(function(s){
      return '<option value="'+_escHtml(s)+'"'+(s===_trat.stade?' selected':'')+'>'+_escHtml(s)+'</option>';
    }).join('');
    var reqStadeLabel='Stade ph&#xe9;nologique'+(needsStade?' <span style="color:var(--rouge)">*requis</span>':'');
    var reqHeureLabel='Horaires d&#39;application'+(needsHeure?' <span style="color:var(--rouge)">*requis</span>':'');
    var rglHtml='<div style="background:rgba(74,158,224,0.05);border:1.5px solid rgba(74,158,224,0.2);border-radius:12px;padding:14px;margin-bottom:14px">'
      +'<div style="font-size:12px;font-weight:700;color:var(--ink-info,#4A9EE0);margin-bottom:12px">&#x1F4CB; Champs r&#xe9;glementaires obligatoires</div>'
      +'<div style="margin-bottom:12px"><div style="font-size:11px;color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:6px">'+reqStadeLabel+'</div>'
      +'<select id="trat-stade" style="width:100%;padding:11px 12px;border-radius:10px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px;appearance:none">'
      +'<option value="">S&#xe9;lectionner le stade&#x2026;</option>'+stadeOpts+'</select></div>'
      +'<div style="margin-bottom:12px"><div style="font-size:11px;color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:6px">'+reqHeureLabel+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
      +'<div><div style="font-size:11px;color:var(--texte-doux);margin-bottom:4px">D&#xe9;but</div>'
      +'<input id="trat-hd" type="time" style="width:100%;padding:11px 12px;border-radius:10px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px"></div>'
      +'<div><div style="font-size:11px;color:var(--texte-doux);margin-bottom:4px">Fin</div>'
      +'<input id="trat-hf" type="time" style="width:100%;padding:11px 12px;border-radius:10px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px"></div>'
      +'</div></div>'
      +'<div style="margin-bottom:12px"><div style="font-size:11px;color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:6px">DRE anticip&#xe9; (si rentr&#xe9;e avant d&#xe9;lai standard)</div>'
      +'<input id="trat-dre" type="text" placeholder="Ex : 6h &#x2014; justification agronomique" style="width:100%;padding:11px 12px;border-radius:10px;background:var(--bg-card);border:1.5px solid var(--gris);color:var(--texte);font-family:Outfit,sans-serif;font-size:13px"></div>'
      +'<div><div style="font-size:11px;color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:6px">Mode de production</div>'
      +'<div style="display:flex;gap:10px">'
      +'<div onclick="window._tratSetModeAb(false)" style="flex:1;padding:10px 12px;border-radius:10px;cursor:pointer;text-align:center;background:'+(!_trat.modeAb?'var(--acier)':'var(--bg-card)')+';border:1.5px solid '+(!_trat.modeAb?'var(--acier-med)':'var(--gris)')+';color:'+(!_trat.modeAb?'#fff':'var(--texte-doux)')+';font-size:12px;font-weight:600;min-height:44px;display:flex;align-items:center;justify-content:center">&#x1F33E; Conventionnel</div>'
      +'<div onclick="window._tratSetModeAb(true)" style="flex:1;padding:10px 12px;border-radius:10px;cursor:pointer;text-align:center;background:'+(_trat.modeAb?'#1A3A1A':'var(--bg-card)')+';border:1.5px solid '+(_trat.modeAb?'#2A6A2A':'var(--gris)')+';color:'+(_trat.modeAb?'#40C080':'var(--texte-doux)')+';font-size:12px;font-weight:600;min-height:44px;display:flex;align-items:center;justify-content:center">&#x1F33F; Bio (AB)</div>'
      +'</div></div></div>';
    var noteHtml='<div style="margin-bottom:14px">'
      +'<div style="font-size:11px;color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:6px">Observations (optionnel)</div>'
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
      return '<span style="font-size:11px;background:var(--gris-clair);border-radius:6px;padding:3px 8px">'+_escHtml(nom)+'</span>';
    }).join(' ');
    var recapHtml='<div style="background:rgba(61,122,39,0.08);border:1.5px solid rgba(61,122,39,0.3);border-radius:12px;padding:14px;margin-bottom:14px">'
      +'<div style="font-size:13px;font-weight:700;color:var(--vert);margin-bottom:10px">&#x1F33F; Traitement &#x00B7; '+fmtDate(_trat.date)+' &#x00B7; '+_escHtml(_trat.conducteur||'—')+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">'
      +rcells.map(function(f){
        return '<div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:8px 10px">'
          +'<div style="font-size:9px;color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:2px">'+f.l+'</div>'
          +'<div style="font-size:12px;font-weight:600">'+_escHtml(String(f.v))+'</div></div>';
      }).join('')+'</div>'
      +'<div style="font-size:11px;color:var(--texte-doux);margin-bottom:6px">'+_trat.parcelles.length+' parcelle'+(_trat.parcelles.length>1?'s':'')+' :</div>'
      +'<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:'+(maxDrae>0?'10':'0')+'px">'+parcListHtml+'</div>'
      +(maxDrae>0?'<div style="font-size:12px;color:var(--orange);margin-top:4px">&#x26A0;&#xFE0F; DRAE max : <strong>'+maxDrae+'h</strong> &#x2014; parcelles signal&#xe9;es en rouge</div>':'')
      +'</div>';
    var confHtml='<div style="background:rgba(74,158,224,0.05);border:1.5px solid rgba(74,158,224,0.2);border-radius:10px;padding:10px 12px;margin-bottom:14px">'
      +'<div style="font-size:11px;font-weight:700;color:var(--ink-info,#4A9EE0);margin-bottom:3px">&#x2705; Conforme r&#xe9;glementation 2027</div>'
      +'<div style="font-size:11px;color:var(--texte-doux)">Format num&#xe9;rique structur&#xe9; &#x00B7; Tous champs obligatoires renseign&#xe9;s</div>'
      +'</div>';
    var lignesHtml='<div style="font-size:11px;color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:10px">'
      +'&#x1F4CB; '+_trat.produits.length+' entr&#xe9;e'+(_trat.produits.length>1?'s':'')+' ajout&#xe9;e'+(_trat.produits.length>1?'s':'')+' au registre'
      +'</div>'
      +_trat.produits.map(function(p){
        var c=_pMeta(p);
        var abBadge=_trat.modeAb?'<span style="font-size:10px;background:rgba(64,192,128,0.15);color:#40C080;border-radius:5px;padding:1px 6px;font-weight:700;margin-left:4px">AB</span>':'';
        var draeBadge=c.drae>0?'<span style="font-size:10px;background:rgba(192,57,43,0.15);color:var(--rouge);border-radius:5px;padding:1px 6px;font-weight:700;margin-left:4px">DRE '+c.drae+'h</span>':'';
        var stRow=_trat.stade?'<div style="font-size:11px;color:var(--phyto-med,#A060E0);margin-top:2px">&#x1F4CB; '+_escHtml(_trat.stade.split('(')[0].trim())+'</div>':'';
        var hRow=_trat.heureDebut?'<div style="font-size:11px;color:var(--or);margin-top:2px">&#x1F550; '+_escHtml(_trat.heureDebut)+'–'+_escHtml(_trat.heureFin||'?')+'</div>':'';
        return '<div style="background:var(--bg-card);border:1.5px solid var(--gris);border-radius:10px;padding:12px 14px;margin-bottom:8px">'
          +'<div style="display:flex;justify-content:space-between;align-items:flex-start">'
          +'<div style="flex:1"><div style="font-size:13px;font-weight:700">'+_escHtml(p.nom)+abBadge+draeBadge+'</div>'
          +'<div style="font-size:11px;color:var(--texte-doux);margin-top:2px">AMM '+(c.amm?_escHtml(c.amm):'—')+' &#x00B7; Dose : '+_escHtml(p.dose||c.dose||'—')+(p.dose_val!=null?' &#x00B7; <span style="color:#A56B3A;font-weight:600">'+p.dose_val+' '+_escHtml(p.dose_unit||'')+'</span>':'')+'</div>'
          +'<div style="font-size:11px;color:var(--texte-doux)">'+_trat.parcelles.length+' parc. &#x00B7; '+surfSel.toFixed(2)+' ha &#x00B7; '+_escHtml(_trat.conducteur||'—')+'</div>'
          +stRow+hRow+'</div>'
          +'<div style="font-size:12px;font-weight:700;color:'+(c.dar>0?'var(--or)':'var(--vert)')+'">DAR '+(c.dar>0?c.dar+'j':'libre')+'</div>'
          +'</div></div>';
      }).join('');
    bodyHtml=recapHtml+_tratCuBudgetHtml()+confHtml+lignesHtml;
  }

  // ── Footer ──
  var canNext1=_trat.produits.length>0&&!!_trat.date&&!!_trat.conducteur;
  var canNext2=_trat.parcelles.length>0;
  var backBtn=step>1?'<button onclick="window._tratPrev()" style="flex:1;padding:14px;border-radius:12px;border:1.5px solid var(--gris);background:transparent;color:var(--texte-doux);font-size:14px;font-weight:600;cursor:pointer;font-family:Outfit,sans-serif;min-height:44px"><span>&#x2190; Retour</span></button>':'';
  var mainBtn='';
  if(step===1){
    mainBtn='<button onclick="window._tratNext()" '+(canNext1?'':'disabled')+' style="flex:2;padding:14px;border-radius:12px;border:none;background:'+(canNext1?'var(--acier)':'var(--gris)')+';color:'+(canNext1?'#fff':'var(--texte-doux)')+';font-size:14px;font-weight:700;cursor:pointer;font-family:Outfit,sans-serif;min-height:44px"><span>'
      +(_trat.produits.length>0?'Continuer ('+_trat.produits.length+' produit'+(_trat.produits.length>1?'s':'')+')\u00a0\u2192':'Ajouter au moins 1 produit')+'</span></button>';
  } else if(step===2){
    mainBtn='<button id="trat-next-btn" onclick="window._tratNext()" '+(canNext2?'':'disabled')+' style="flex:2;padding:14px;border-radius:12px;border:none;background:'+(canNext2?'var(--acier)':'var(--gris)')+';color:'+(canNext2?'#fff':'var(--texte-doux)')+';font-size:14px;font-weight:700;cursor:pointer;font-family:Outfit,sans-serif;min-height:44px"><span>'
      +(canNext2?'Continuer ('+_trat.parcelles.length+' parc. &#x00B7; '+surfSel.toFixed(2)+' ha)\u00a0\u2192':'S&#xe9;lectionner au moins 1 parcelle')+'</span></button>';
  } else {
    mainBtn='<button onclick="window._tratSave()" style="flex:2;padding:14px;border-radius:12px;border:none;background:#2C6E29;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:Outfit,sans-serif;min-height:44px"><span>&#x2713; Enregistrer</span></button>';
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
  var todayStr=new Date().toISOString().split('T')[0];
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
  showToast('🌿 Traitement enregistré','#2C6E29');
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
  document.getElementById('otd-title').textContent=(TEMJ[m.type]||'🧪')+' '+t.produit;
  document.getElementById('otd-sub').textContent=fmtDate(t.date)+((t.conducteur||t.operateur)?' · 👤 '+(t.conducteur||t.operateur):'');
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
        <div style="font-size:16px;font-weight:700;margin-top:4px;color:${darR>0?'var(--rouge)':'var(--vert)'}">${darR!==null?(darR>0?darR+'j restants':'✅ Libre'):'—'}</div>
      </div>
      <div style="background:${_dre.na?'var(--gris-clair)':(draeR>0?'#FFF3CD':'var(--vert-pale)')};border-radius:12px;padding:12px">
        <div style="font-size:10px;color:var(--texte-doux);text-transform:uppercase">Délai de réentrée</div>
        <div style="font-size:16px;font-weight:700;margin-top:4px;color:${_dre.na?'var(--texte-doux)':(draeR>0?'#856404':'var(--vert)')}">${_dre.na?'Non concerné':(draeR>0?draeR+'h restantes':'✅ Libre')}</div>
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
    ${t.note?`<div style="background:var(--gris-clair);border-radius:12px;padding:12px;font-size:12px;color:var(--texte-doux);font-style:italic">💬 ${_escHtml(t.note)}</div>`:''}
    ${(t.parcelles&&t.parcelles.length>0)?`<div style="margin-top:10px"><div style="font-size:10px;color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:5px">Parcelles traitées</div><div style="display:flex;flex-wrap:wrap;gap:5px">${t.parcelles.map(n=>'<span style="font-size:11px;background:var(--gris-clair);border-radius:6px;padding:3px 8px">'+_escHtml(n)+'</span>').join('')}</div></div>`:''}
    ${t.stade?`<div style="background:rgba(160,96,224,0.08);border-radius:10px;padding:9px 12px;margin-top:8px;font-size:12px;color:#A060E0">📋 Stade : ${_escHtml(t.stade)}</div>`:''}
    ${t.heureDebut?`<div style="background:var(--gris-clair);border-radius:10px;padding:9px 12px;margin-top:8px;font-size:12px">🕐 Horaires : ${t.heureDebut}–${t.heureFin||'?'}</div>`:''}
    ${t.dreAnticipe?`<div style="background:rgba(184,90,26,0.08);border-radius:10px;padding:9px 12px;margin-top:8px;font-size:12px;color:var(--orange)">⚠️ DRE anticipé : ${_escHtml(t.dreAnticipe)}</div>`:''}
    ${typeof t.modeAb!=='undefined'?`<div style="margin-top:8px;font-size:12px;color:var(--texte-doux)">Mode : <strong style="color:${t.modeAb?'#40C080':'var(--texte)'}">${t.modeAb?'🌿 Agriculture Biologique (AB)':'🌾 Conventionnel'}</strong></div>`:''}
    ${_canEd?`<button onclick="openTraitEdit(${idx})" style="width:100%;margin-top:16px;padding:13px;border-radius:11px;border:1.5px solid var(--phyto);background:rgba(90,45,142,0.12);color:#9B70D4;font-size:14px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;min-height:44px"><span>✏️ Modifier ce traitement</span></button>`:''}
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
  var stadeOpts='<option value="">— Aucun —</option>'+(STADES_PHENO||[]).map(function(sd){return '<option value="'+_escHtml(sd)+'"'+(sd===(t.stade||'')?' selected':'')+'>'+_escHtml(sd)+'</option>';}).join('');
  var abVal=(t.modeAb===true)?'1':((t.modeAb===false)?'0':'');
  var L='font-size:11px;color:var(--texte-doux);text-transform:uppercase;font-weight:600;margin-bottom:6px;display:block';
  var BM='padding:6px 12px;border-radius:8px;border:1.5px solid var(--gris);background:var(--bg-card);color:var(--texte-doux);font-size:12px;font-weight:600;cursor:pointer;font-family:Outfit,sans-serif;min-height:36px';
  var _ttCu=(t.type||(window._phResolve?(window._phResolve(t)||{}).type:'')||'');
  var _isCu=(_ttCu==='Cuivre');
  var _cuVal=(t.cuMetal!=null?t.cuMetal:'');
  var _cuPctV=(typeof _cuPct==='function'?_cuPct(t.produit,t.sub):null);
  var _cuHint=(_cuPctV!=null?'base ~'+_cuPctV+'% Cu, ajustable':'kg de cuivre m&#xe9;tal apport&#xe9;');
  var cuHtml=_isCu?('<div style="margin-bottom:14px;display:flex;align-items:center;gap:8px;background:rgba(165,107,58,0.1);border:1px solid rgba(165,107,58,0.28);border-radius:8px;padding:8px 10px">'
    +'<span style="font-size:12px;font-weight:700;color:#A56B3A;white-space:nowrap">&#x1FA99; Cuivre m&#xe9;tal</span>'
    +'<input id="te-cu" type="number" step="0.05" inputmode="decimal" value="'+_cuVal+'" style="width:84px;padding:6px 8px;border-radius:7px;border:1.5px solid rgba(165,107,58,0.4);background:var(--bg-card);color:var(--texte);font-family:Outfit,sans-serif;font-size:14px;text-align:center">'
    +'<span style="font-size:11px;color:var(--texte-doux);white-space:nowrap">kg/ha</span>'
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
    +'<div style="margin-bottom:4px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="'+L+';margin-bottom:0">📍 Parcelles traitées</span><div style="display:flex;gap:6px"><button type="button" onclick="window._teAllParc()" style="'+BM+'">Tout</button><button type="button" onclick="window._teNoneParc()" style="'+BM+'">Aucun</button></div></div><div id="te-parc-count" style="font-size:11px;color:var(--texte-doux);margin-bottom:8px"></div><div id="te-parc-grid" style="display:flex;flex-wrap:wrap;gap:6px"></div></div>';
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
function _phytoFenetres(){
  var out = [];
  if(typeof window._mvExercice === 'function'){
    var ex = null;
    try{ ex = window._mvExercice(); }catch(e){ ex = null; }
    if(ex && ex.d0 && ex.d1){
      out.push({ k:'ex', lbl:'Exercice en cours',
                 sub:(ex.lbl || (_phCsvDate(ex.d0)+' \u2192 '+_phCsvDate(ex.d1))),
                 d0:ex.d0, d1:ex.d1 });
    }
  }
  var nom = (typeof window._visuSaison === 'function') ? window._visuSaison() : '';
  var s   = (nom && typeof window._saisonObj === 'function') ? window._saisonObj(nom) : null;
  if(s && s.debut && s.fin){
    out.push({ k:'camp', lbl:'Campagne consult\u00e9e',
               sub:nom+' \u2014 du '+_phCsvDate(s.debut)+' au '+_phCsvDate(s.fin),
               d0:s.debut, d1:s.fin });
  }
  out.push({ k:'tout', lbl:'Tout le registre', sub:'depuis la mise en service', d0:'', d1:'' });
  return out;
}
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
function _phytoExportChoix(){
  if(!_phytoExportGarde()) return;
  var ovId = 'ovPhytoExport';
  var ov = document.getElementById(ovId);
  if(!ov){
    ov = document.createElement('div'); ov.id = ovId; ov.className = 'overlay';
    ov.setAttribute('onclick', "closeOv(event,'"+ovId+"')");
    ov.innerHTML = `<div class="ov-panel"><div class="ov-drag"></div>
      <div class="ov-hd"><div class="ov-title">📊 Exporter le registre</div><div class="ov-close" onclick="closeOv(null,'${ovId}')">✕</div></div>
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
    h += `<button onclick="_phytoExportCsv('${f.k}')" style="width:100%;display:block;text-align:left;background:var(--bg-card);border:1.5px solid ${acc?'#5A2D8E':'var(--gris)'};border-radius:12px;padding:14px 16px;margin-bottom:10px;cursor:pointer;font-family:Outfit,sans-serif;min-height:44px">
      <span style="display:block;font-size:14px;font-weight:600;color:var(--texte)">${_escHtml(f.lbl)}</span>
      <span style="display:block;font-size:11px;color:var(--texte-doux);margin-top:3px;line-height:1.4">${_escHtml(f.sub)}</span>
      <span style="display:block;font-size:11px;color:${n?'#5A2D8E':'var(--texte-doux)'};font-weight:600;margin-top:5px">${n} traitement${n>1?'s':''}</span>
    </button>`;
  });
  h += `<div style="background:var(--gris-clair);border-radius:12px;padding:12px;margin-top:4px">
      <div style="font-size:9px;text-transform:uppercase;color:var(--texte-doux);font-weight:600;margin-bottom:6px">\u00c0 savoir</div>
      <div style="font-size:11px;color:var(--texte-doux);line-height:1.5">La colonne \u00ab\u00a0Surface de la parcelle (ha)\u00a0\u00bb donne la surface TOTALE de la parcelle. Ma Vigne n\u2019enregistre pas de surface partielle : si un traitement n\u2019a couvert qu\u2019une partie du rang, corrigez la valeur dans le tableur avant de remettre le fichier.</div>
    </div>`;
  var body = ov.querySelector('#phx-body');
  if(body) body.innerHTML = h;
  openOv(ovId);
}

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
  var jour = new Date().toISOString().slice(0,10);
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
