// ═══════════════════════════════════════════════════════════════════════════
// MA VIGNE — src/reserve.js
// Module « La Réserve » : intrants, stock (bilan matière bio) & fûts
// Lot Réserve v1 — inventaire des fûts + entrées/sorties intrants
// © 2026 Nicolas GUERET / GUERETTECH
// ───────────────────────────────────────────────────────────────────────────
// Dépendances (via window.*) :
//   window.fbSave                    ← firebase.js (persiste doc 'intrants')
//   window.INTRANTS                  ← exposé ici, chargé par applyFbData (app.js)
//   window.CAVE_ELEVAGE              ← cave.js (consommé œno = SO₂ des opérations)
//   window.TRAITEMENTS / PARCELLES   ← app.js (consommé phyto = dose_val × surface)
//   window.openOv / closeOv / openConfirmDel / getSaisonActive ← app.js
// ───────────────────────────────────────────────────────────────────────────
// NB : les SORTIES ne sont jamais stockées ici — elles sont DÉRIVÉES.
//   phyto  → registre TRAITEMENTS (dose_val × surface) — actif quand les doses
//            seront structurées (lot suivant) ; repli « saisie manuelle » dispo.
//   œno    → opérations Cave (op.data.so2_total_g) — actif dès aujourd'hui.
// ═══════════════════════════════════════════════════════════════════════════

import { isAdmin, showToast, _escHtml, _escAttr, _mvIcon, _mvIconInline } from './utils.js';

const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// ── État (exposé sur window, chargé par applyFbData('intrants')) ──
var INTRANTS = {
  produits: [],       // [{id,nom,cat,unite,contenance,contLbl,prixU,conso_src,conso_manuel}]
  achats: [],         // [{id,prodId,date,four,q,unites,lot,fact,prix}]
  inventaires: [],    // [{prodId,date,q}]  (dernière valeur = point zéro courant)
  // `prix` : total HT du lot, ABSENT a la livraison et rempli plus tard depuis
  // Pilotage > Economie > Achats. Absent (a chiffrer) et 0 (offert) sont deux
  // etats distincts — d'ou `!=null` partout et jamais `||`.
  futs: [],           // [{id,four,ref,annee,qte,date,prix}]
  fut_mouv: [],       // [{id,date,sens,motif,four,ref,annee,nb,note}] — registre du parc
  fut_four: [],       // fournisseurs mémorisés (fûts)
  fut_ref: [],        // références mémorisées (fûts)
  achat_four: [],     // fournisseurs mémorisés (achats intrants)

};
window.INTRANTS = INTRANTS;

var _rsvTab = 'futs'; // 'futs' | 'intrants' | 'audit'
var _rsvEditFut = null;
var _rsvFutYear = '__all__'; // filtre millesime (section futs)
var _rsvFutOpen = {};        // fournisseur -> bool (deplie/replie explicite)
var _rsvFutRefList = [];     // refs proposees pour le fournisseur courant
var _rsvSaisie = 'u'; // mode saisie quantité achat : 'u' unités | 'q' directe | 'b' les deux
var _rsvEphySel = null;  // produit E-Phy choisi pour un nouvel intrant {nom,amm,sub,type,dose}
var _rsvEphyRes = [];    // résultats de recherche E-Phy courants

// ── Persistance (pattern cave.js : fbSave direct) ──
function saveIntrants(){
  window.INTRANTS = INTRANTS;
  if(window.fbSave) window.fbSave('intrants', INTRANTS);
}window.saveIntrants = saveIntrants;


// ── Helpers format ──
function _rid(){ return 'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function _fmt(n){ if(n==null||isNaN(n)) return '—'; return (Math.round(n*10)/10).toString().replace('.',','); }
function _frDate(s){ if(!s) return ''; var m=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']; var d=new Date(s); if(isNaN(d)) return s; return d.getDate()+' '+m[d.getMonth()]+' '+String(d.getFullYear()).slice(2); }
function _today(){ return new Date().toISOString().slice(0,10); }
function _uniqPush(arr, val){ val=(val||'').trim(); if(val && arr.indexOf(val)<0){ arr.push(val); arr.sort(function(a,b){return a.localeCompare(b,'fr');}); } }
function _saisonNom(){ try{ var s=window.getSaisonActive&&window.getSaisonActive(); return s?s.nom:''; }catch(e){ return ''; } }

// ── Bilan matière : entrées ──
function _invOuv(p){
  var invs=INTRANTS.inventaires.filter(function(i){return i.prodId===p.id;});
  if(!invs.length) return 0;
  invs.sort(function(a,b){return a.date>b.date?-1:1;}); // plus récent d'abord
  return invs[0].q||0;
}
function _achatsQ(p){ return INTRANTS.achats.filter(function(a){return a.prodId===p.id;}).reduce(function(s,a){return s+(a.q||0);},0); }

// ── PRIX UNITAIRE : un PRIX MOYEN PONDERE, jamais une saisie ─────────────────
// ⚠️⚠️ DEFAUT CORRIGE ICI, ACTIF DEPUIS LE PREMIER JOUR : `produits[].prixU`
//   n'avait AUCUNE interface d'ecriture — six occurrences dans tout le depot,
//   dont trois dans les donnees de demonstration d'app.js. Il valait donc
//   toujours undefined chez un vrai domaine, et _ecoPhytoByParc rangeait CHAQUE
//   produit dans `unpriced` : le cout phyto par parcelle du Pilotage etait a
//   zero sur les deux domaines en service, sans que rien ne le dise.
// Le prix EST saisi — `achats[].prix`, un TOTAL HT par ligne. Il n'etait
// simplement jamais ramene a l'unite. C'est exactement ce que _mvPaieGnrPMP
// (reglages.js) fait deja pour le carburant : somme des euros / somme des
// litres. Meme calcul, meme repli, zero geste de saisie nouveau.
// ★ Les lignes SANS prix ou SANS quantite sont ECARTEES du quotient au lieu
//   d'etre comptees a zero : une facture non saisie tirerait la moyenne vers le
//   bas et le cout par parcelle serait faux SANS avoir l'air de l'etre.
// Format euros du module. ⚠️ Vivait dans le bloc Dépenses, parti avec lui alors
// que le prix moyen l'utilise encore : l'écran Intrants entier aurait plante au
// premier rendu — pas une ligne fausse, un écran blanc. Une fonction utilitaire
// n'appartient pas à la fonctionnalité qui l'a introduite en premier.
function _eur2(n){ return (Math.round((Number(n)||0)*100)/100).toLocaleString('fr-FR',{minimumFractionDigits:0,maximumFractionDigits:2}); }

function _rsvPrixU(pid){
  var id=(pid&&pid.id)?pid.id:pid;
  var Q=0, E=0;
  (INTRANTS.achats||[]).forEach(function(a){
    if(!a||a.prodId!==id) return;
    var q=Number(a.q)||0, e=Number(a.prix)||0;
    if(q>0&&e>0){ Q+=q; E+=e; }
  });
  if(Q>0) return E/Q;
  // Repli : la valeur portee par la fiche produit, si un jour elle en porte une
  // (donnees de demonstration, import). `!=null` et non `||` — un prix a 0 est
  // une valeur, pas une absence.
  var p=(pid&&pid.id)?pid:(INTRANTS.produits||[]).find(function(x){return x&&x.id===id;});
  var v=(p&&p.prixU!=null)?Number(p.prixU):NaN;
  return (isFinite(v)&&v>0)?v:0;
}
window._rsvPrixU=_rsvPrixU;
// Combien de lignes d'achat de ce produit sont saisies sans prix : le chiffre
// qui permet de DIRE qu'une moyenne est partielle plutot que de la presenter
// comme exacte.
function _rsvPrixUSansPrix(pid){
  var id=(pid&&pid.id)?pid.id:pid, n=0;
  (INTRANTS.achats||[]).forEach(function(a){
    if(a&&a.prodId===id&&!(Number(a.prix)>0)) n++;
  });
  return n;
}
window._rsvPrixUSansPrix=_rsvPrixUSansPrix;

// ── Bilan matière : sorties (DÉRIVÉES, jamais stockées) ──
// Retourne {q, known} : known=false quand la source n'est pas encore exploitable
// (phyto avant structuration des doses) → on n'affiche alors PAS de stock trompeur.
// ── Consomme depuis LE CUVIER : les adjonctions posees sur les cuves ──
// ⚠️⚠️ Cette source est filtree PAR PRODUIT (`o.prod_id===pid`), contrairement
//   a `cave_so2` qui additionne TOUT le SO2 de la cave sans regarder de quel
//   produit il s'agit. Tant qu'un seul produit oeno portait `cave_so2` le
//   raccourci tenait ; avec tanins, enzymes et bentonite au catalogue, il
//   attribuerait a CHACUN la totalite du soufre. C'est pour ca que les
//   nouveaux produits oeno partent en `cuvier` et non en `cave_so2` — les
//   produits deja crees, eux, ne bougent pas : aucune migration.
function _consoCuvier(pid, exclId){
  var CV=window.CAVE_VENDANGE;
  if(!pid||!CV||!CV.cuves_vinif) return 0;
  var t=0;
  CV.cuves_vinif.forEach(function(c){
    ((c&&c.operations)||[]).forEach(function(o){
      if(!o||o.prod_id!==pid) return;
      if(exclId&&o.id===exclId) return;
      var q=parseFloat(o.qte);
      if(isFinite(q)&&q>0) t+=q;
    });
  });
  return t;
}
// Combien de ces adjonctions reposent sur un volume ESTIME. Le chiffre qui
// permet de DIRE qu'un ecart peut venir du volume plutot que d'une facture
// manquante — sans lui, on cherche une facture qui n'existe pas.
function _consoCuvierEstime(pid){
  var CV=window.CAVE_VENDANGE;
  if(!pid||!CV||!CV.cuves_vinif) return 0;
  var n=0;
  CV.cuves_vinif.forEach(function(c){
    ((c&&c.operations)||[]).forEach(function(o){
      if(o&&o.prod_id===pid&&o.vol_src==='estime'&&parseFloat(o.qte)>0) n++;
    });
  });
  return n;
}
function _conso(p){
  var src=p.conso_src||'registre';
  if(src==='manual'){ return {q:(p.conso_manuel||0), known:true}; }
  if(src==='cuvier'){ return {q:_consoCuvier(p.id,null), known:true}; }
  if(src==='cave_so2'){
    var CE=window.CAVE_ELEVAGE;
    if(!CE||!CE.operations) return {q:0, known:true};
    var g=0;
    CE.operations.forEach(function(op){
      if(op&&op.data&&op.data.so2_total_g) g+=parseFloat(op.data.so2_total_g)||0;
      else if(op&&op.data&&op.data.so2&&op.data.so2.total_g) g+=parseFloat(op.data.so2.total_g)||0;
    });
    return {q: g/1000, known:true}; // g → kg
  }
  // 'registre' phyto : dose_val × surface, uniquement pour les entrées structurées
  var T=window.TRAITEMENTS||[];
  var got=false, tot=0;
  T.forEach(function(e){
    if(!e||e.produit!==p.nom) return;
    if(e.dose_val==null||isNaN(e.dose_val)) return; // pas encore structuré
    got=true;
    var surf=_treatSurface(e);
    var base=(e.dose_unit||'').split('/')[0];
    var q=e.dose_val*surf;
    if(base==='g') q/=1000;
    tot+=q;
  });
  return {q:tot, known:got}; // known=false tant qu'aucune entrée n'a de dose_val
}
function _treatSurface(e){
  var P=window.PARCELLES||[];
  if(typeof e.surface==='number') return e.surface;
  if(!Array.isArray(e.parcelles)) return 0;
  var s=0;
  e.parcelles.forEach(function(nom){ var p=P.find(function(x){return x.nom===nom;}); if(p) s+=(p.surface||0); });
  return s;
}
function _stock(p){
  var c=_conso(p);
  return { q:_invOuv(p)+_achatsQ(p)-c.q, known:c.known, conso:c.q, ouv:_invOuv(p), achats:_achatsQ(p) };
}
function _nbUnites(p,q){ return p.contenance?Math.round(q/p.contenance*10)/10:null; }

// Le stock d'un produit vu depuis un AUTRE module (le Cuvier). `suit` dit si
// ce produit se consomme bien depuis les cuves : sinon l'ecran de saisie
// annoncerait une deduction qui n'aura jamais lieu.
window._rsvStockPour=function(pid, exclOpId){
  var p=(INTRANTS.produits||[]).find(function(x){ return x&&x.id===pid; });
  if(!p) return null;
  var suit=(p.conso_src==='cuvier');
  var q=suit ? (_invOuv(p)+_achatsQ(p)-_consoCuvier(p.id,exclOpId)) : _stock(p).q;
  return { nom:p.nom, unite:p.unite||'kg', q:q, suit:suit, srcLbl:_consoSrcLbl(p) };
};

window.INTRANTS = INTRANTS;

// ═══════════════════════════ RENDU PRINCIPAL ═══════════════════════════
function renderReserve(){
  var page=document.getElementById('page-reserve');
  if(!page) return;
  _rsvEnsureOverlays();
  _rsvInjectCss();
  // ★ EN-TÊTE UNIFIÉ (25/07/2026) — même anatomie que les 8 autres modules :
  //     .mod-header > .mod-header-top (bandeau sombre) + .mod-meta-row + .mvu-tabs
  //   L'ancien .mvr-head était le dernier en-tête maison rendu en JS. Il n'héritait
  //   de rien : ni du miroir saison/date (_mvMetaSync + [data-mv-*] — donc aucune
  //   date, et aucun marquage « saison consultée »), ni de la pastille « ? Aide »
  //   (utils.js ne l'injecte que sur « .mod-header .mod-meta-row »), ni du bouton ⌂.
  //   La pastille « 🍷 Élevage » (#mvr-pill) était une chaîne figée, jamais mise à jour.
  //
  // ⚠ LES ONGLETS DOIVENT RESTER DANS .mod-header : c'est le sélecteur
  //   « .mod-header .mvu-tab » du bloc LISIBILITE 2 (styles.css) qui leur donne la
  //   peau papier. Sortis de cet ancêtre, ils reprennent .mvu-tab nu — crème sur fond
  //   clair, soit exactement le 1,09:1 corrigé en v5.40.
  // ⚠ Onglets PRINCIPAUX → .mvu-tabs SANS .mvu-sub. La variante .mvu-sub est celle du
  //   second niveau (Cuvées/Bouteilles du Chai) : actif = var(--bg-card) sur papier,
  //   d'où le « crème sur crème » où l'onglet actif ne se distinguait plus de l'inactif.
  //   .mvr-tabs est conservé sur le conteneur pour la règle de centrage desktop.
  var head=''
    +'<div class="mod-header h-reserve">'
      +'<div class="mod-header-top">'
        +'<span class="mod-header-icon">'+_mvIcon('carton',20)+'</span>'
        +'<div class="mod-header-titles">'
          +'<div class="mod-header-title">La Réserve</div>'
          +'<div class="mod-header-sub">Intrants, stock &amp; fûts</div>'
        +'</div>'
        +'<button class="mod-home-btn" onclick="goHub()">'+_mvIcon('maison',18)+'</button>'
      +'</div>'
      +'<div class="mod-meta-row mvu-meta">'
        +'<div class="hv2-saison-pill" data-mv-pill><span class="hv2-dot"></span>&nbsp;<span data-mv-saison></span></div>'
        +'<div class="hv2-sep"></div>'
        +'<div class="hv2-date" data-mv-date></div>'
      +'</div>'
      +'<div class="mvu-tabs mvr-tabs">'
        +'<button class="mvu-tab'+(_rsvTab==='futs'?' on':'')+'" onclick="_rsvTabTo(\'futs\')"><span class="mvu-tab-em">'+_mvIcon('barrique',18)+'</span>Fûts</button>'
        +'<button class="mvu-tab'+(_rsvTab==='intrants'?' on':'')+'" onclick="_rsvTabTo(\'intrants\')"><span class="mvu-tab-em">'+_mvIcon('fiole',18)+'</span>Intrants</button>'
        +'<button class="mvu-tab'+(_rsvTab==='audit'?' on':'')+'" onclick="_rsvTabTo(\'audit\')"><span class="mvu-tab-em">'+_mvIcon('liste',18)+'</span>Bilan matière</button>'
      +'</div>'
    +'</div>';
  page.innerHTML=head+'<div id="mvr-body" class="mvr-body"></div>';
  // Module rendu en JS → il rappelle lui-même les deux injecteurs globaux, exactement
  // comme le prévoit le commentaire d'utils.js. Appels gardés, PAS de try/catch vide
  // (C14 est un cliquet : un catch{} de plus = erreur nommée au prebuild).
  if(window._mvMetaSync) window._mvMetaSync();
  if(window._mvInjectHelpBtn) window._mvInjectHelpBtn();
  _rsvCssAte();
  _rsvRenderBody();
}
window.renderReserve=renderReserve;

window._rsvTabTo=function(t){ _rsvTab=t; renderReserve(); };

function _rsvCssAte(){
  if(document.getElementById('mvr-ate-css')) return;
  var css=''
  +'.mvr-cat-t{ background:linear-gradient(180deg,#2C3E50,#1F2C39); }'
  +'.mvr-cat-g{ background:linear-gradient(180deg,var(--gris,#DED7C9),var(--gris-clair,#ECE6DA)); }'
  +'.mvr-pcat.mvr-cat-t{ background:#2C3E50; }'
  +'.mvr-pcat.mvr-cat-g{ background:#8A8578; }'
  +'.mvr-ded{margin-top:12px;padding:11px 13px;border-radius:11px;border:1px solid var(--gris-clair);'
  +'background:var(--bg-app);font-size:var(--pt-txt,12.5px);color:var(--texte-med);line-height:1.5}'
  +'.mvr-ded b{color:var(--texte)}'
  +'.mvr-dep-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(148px,1fr));gap:12px;margin-bottom:16px}'
  +'.mvr-dep-k{background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:13px;padding:13px 15px}'
  +'.mvr-dep-k .l{display:flex;align-items:center;gap:6px;font-size:var(--pt-lbl,10.5px);font-weight:700;'
  +'letter-spacing:1.4px;text-transform:uppercase;color:var(--texte-doux)}'
  +'.mvr-dep-k .l em{width:9px;height:9px;border-radius:3px;display:inline-block;font-style:normal;flex:none}'
  +'.mvr-dep-k .v{font-family:\'Cormorant Garamond\',serif;font-size:var(--pt-xl,27px);font-weight:600;'
  +'margin-top:2px;line-height:1.05;color:var(--texte)}'
  +'.mvr-dep-r{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--gris-clair)}'
  +'.mvr-dep-r:last-child{border-bottom:0}'
  +'.mvr-dep-d{font-size:var(--pt-micro,11px);color:var(--texte-doux);width:76px;flex:none}'
  +'.mvr-dep-m{flex:1;min-width:0}'
  +'.mvr-dep-m b{display:block;font-size:var(--pt-txt,12.5px);color:var(--texte);font-weight:600}'
  +'.mvr-dep-m span{font-size:var(--pt-micro,11px);color:var(--texte-doux)}'
  +'.mvr-dep-e{font-weight:700;font-size:var(--pt-base,14px);white-space:nowrap;flex:none;color:var(--texte)}'
  +'.mvr-dep-e.no{color:var(--orange);font-weight:600;font-size:var(--pt-micro,11px)}'
  +'.mvr-dep-b{font-size:var(--pt-lbl,10.5px);font-weight:600;letter-spacing:.2px;border-radius:7px;'
  +'padding:4px 8px;white-space:nowrap;flex:none}';
  var st=document.createElement('style');
  st.id='mvr-ate-css'; st.textContent=css;
  document.head.appendChild(st);
}

function _rsvRenderBody(){
  var b=document.getElementById('mvr-body'); if(!b) return;
  if(!window._dataReady){ b.innerHTML=window._mvSk('reserve'); return; }
  if(_rsvTab==='futs') b.innerHTML=_rsvFutsHtml()+(window._rsvMouvHtml?_rsvMouvHtml():'');
  else if(_rsvTab==='intrants') b.innerHTML=_rsvIntrantsHtml();
  else b.innerHTML=_rsvAuditHtml();
}

// ═══════════════════════════ SECTION FÛTS ═══════════════════════════
function _futTotal(){ return INTRANTS.futs.reduce(function(s,f){return s+(parseInt(f.qte)||0);},0); }
function _futYears(){
  var set={}; INTRANTS.futs.forEach(function(f){ set[f.annee||'__none__']=1; });
  var named=Object.keys(set).filter(function(y){return y!=='__none__';}).sort().reverse();
  if(set['__none__']) named.push('__none__');
  return named;
}
function _futYearCount(y){ return INTRANTS.futs.filter(function(f){return (f.annee||'__none__')===y;}).reduce(function(s,f){return s+(parseInt(f.qte)||0);},0); }
function _futSuppliersCount(){ var s={}; INTRANTS.futs.forEach(function(f){ var k=(f.four||'').trim(); if(k) s[k]=1; }); return Object.keys(s).length; }
function _futsFiltered(){ return _rsvFutYear==='__all__'?INTRANTS.futs.slice():INTRANTS.futs.filter(function(f){return (f.annee||'__none__')===_rsvFutYear;}); }
function _futsBySupplier(list){
  var m={}; list.forEach(function(f){ var k=f.four||'__nofour__'; (m[k]=m[k]||[]).push(f); });
  var keys=Object.keys(m).sort(function(a,b){ if(a==='__nofour__')return 1; if(b==='__nofour__')return -1; return a.localeCompare(b,'fr'); });
  return keys.map(function(k){
    var lots=m[k].slice().sort(function(x,y){ var ay=x.annee||'',by=y.annee||''; if(ay!==by)return ay<by?1:-1; return (x.ref||'').localeCompare(y.ref||'','fr'); });
    var n=lots.reduce(function(s,f){return s+(parseInt(f.qte)||0);},0);
    return {four:k, lots:lots, n:n};
  });
}
function _futIsOpen(four, nGroups){ if(Object.prototype.hasOwnProperty.call(_rsvFutOpen,four)) return _rsvFutOpen[four]; return nGroups<=1; }
function _futAllOpen(groups){ return groups.length>0 && groups.every(function(g){return _futIsOpen(g.four, groups.length);}); }
function _rsvRefsForFour(four){
  four=(four||'').trim().toLowerCase(); if(!four) return [];
  var seen={}, out=[];
  INTRANTS.futs.forEach(function(f){ if((f.four||'').trim().toLowerCase()!==four) return; var r=(f.ref||'').trim(); if(r&&!seen[r.toLowerCase()]){ seen[r.toLowerCase()]=1; out.push(r); } });
  out.sort(function(a,b){return a.localeCompare(b,'fr');});
  return out;
}
function _rsvUpdateToggleAllLink(){
  var link=document.querySelector('#mvr-body .mvr-flink'); if(!link) return;
  var groups=_futsBySupplier(_futsFiltered());
  link.textContent=_futAllOpen(groups)?'Tout replier':'Tout déplier';
}
function _rsvSetFutYear(y){ _rsvFutYear=y; _rsvRenderBody(); }
window._rsvSetFutYear=_rsvSetFutYear;
function _rsvToggleGrp(idx){
  var groups=_futsBySupplier(_futsFiltered());
  var g=groups[idx]; if(!g) return;
  var open=!_futIsOpen(g.four, groups.length);
  _rsvFutOpen[g.four]=open;
  var els=document.querySelectorAll('#mvr-body .mvr-sgrp');
  if(els[idx]) els[idx].classList.toggle('open', open);
  _rsvUpdateToggleAllLink();
}
window._rsvToggleGrp=_rsvToggleGrp;
function _rsvToggleAllGrp(){
  var groups=_futsBySupplier(_futsFiltered());
  var target=!_futAllOpen(groups);
  groups.forEach(function(g){ _rsvFutOpen[g.four]=target; });
  document.querySelectorAll('#mvr-body .mvr-sgrp').forEach(function(el){ el.classList.toggle('open', target); });
  _rsvUpdateToggleAllLink();
}
window._rsvToggleAllGrp=_rsvToggleAllGrp;

function _rsvFutsHtml(){
  _rsvInjectCss();
  var adm=isAdmin();
  var ys=_futYears();
  if(_rsvFutYear!=='__all__' && ys.indexOf(_rsvFutYear)<0) _rsvFutYear='__all__';
  var tot=_futTotal();
  var list=_futsFiltered();
  var groups=_futsBySupplier(list);
  var h='';
  h+=(window._rsvParcHtml?_rsvParcHtml():'');
  h+='<div class="mvr-kpis">'
    +'<div class="mvr-kpi"><div class="mvr-kv">'+tot+'</div><div class="mvr-kl">Fûts libres</div></div>'
    +'<div class="mvr-kpi"><div class="mvr-kv">'+_futSuppliersCount()+'</div><div class="mvr-kl">Fournisseurs</div></div>'
    +'<div class="mvr-kpi"><div class="mvr-kv">'+ys.length+'</div><div class="mvr-kl">Millésimes</div></div>'
    +'</div>';
  if(adm || INTRANTS.futs.length){
    h+='<div class="mvr-btnrow">';
    if(adm) h+='<button class="mvr-btn mvr-btn-p" onclick="_rsvOpenFut()">\uFF0B Ajouter des fûts</button>';
    if(INTRANTS.futs.length) h+='<button class="mvr-btn mvr-btn-o" onclick="_rsvExportFutsPdf()">'+_mvIcon('document',16)+' Inventaire PDF</button>';
    if(adm && INTRANTS.futs.length) h+='<button class="mvr-btn mvr-btn-o" onclick="_rsvOpenSep()">\uD83D\uDCE4 Se séparer de fûts</button>';
    h+='</div>';
  }
  if(!INTRANTS.futs.length){
    h+='<div class="mvr-empty">'+_mvIcon('carton',40)+'<div>Aucun fût enregistré.</div>'+(adm?'<div class="mvr-empty-h">Ajoute ton premier lot pour suivre ton parc de contenants.</div>':'')+'</div>';
    return h;
  }
  h+='<div class="mvr-flabel">Millésime</div><div class="mvr-fbar">';
  h+='<button class="mvr-fchip'+(_rsvFutYear==='__all__'?' on':'')+'" onclick="_rsvSetFutYear(\'__all__\')">Tous <span class="mvr-cnt">'+tot+'</span></button>';
  ys.forEach(function(y){
    var lbl=(y==='__none__')?'Sans millésime':y;
    h+='<button class="mvr-fchip'+(_rsvFutYear===y?' on':'')+'" onclick="_rsvSetFutYear(\''+_escAttr(y)+'\')">'+_escHtml(lbl)+' <span class="mvr-cnt">'+_futYearCount(y)+'</span></button>';
  });
  h+='</div>';
  var shown=list.reduce(function(s,f){return s+(parseInt(f.qte)||0);},0);
  h+='<div class="mvr-ftools"><div class="mvr-fcount"><b>'+shown+'</b> fût'+(shown>1?'s':'')+' \u00b7 <b>'+groups.length+'</b> fournisseur'+(groups.length>1?'s':'')+'</div>';
  if(groups.length>1) h+='<button class="mvr-flink" onclick="_rsvToggleAllGrp()">'+(_futAllOpen(groups)?'Tout replier':'Tout déplier')+'</button>';
  h+='</div>';
  if(!groups.length){
    h+='<div class="mvr-empty">'+_mvIcon('calendrier',40)+'<div>Aucun fût pour ce millésime.</div></div>';
    return h;
  }
  groups.forEach(function(g, gi){
    var name=(g.four==='__nofour__')?'Sans fournisseur':g.four;
    var open=_futIsOpen(g.four, groups.length);
    var refset={}; g.lots.forEach(function(l){ var r=(l.ref||'').trim().toLowerCase(); if(r) refset[r]=1; });
    var nRef=Object.keys(refset).length;
    h+='<div class="mvr-sgrp'+(open?' open':'')+'">'
      +'<div class="mvr-sghd" onclick="_rsvToggleGrp('+gi+')">'
        +'<div class="mvr-sgico">'+_mvIcon('bureau',18)+'</div>'
        +'<div class="mvr-sgtx"><div class="mvr-sgname">'+_escHtml(name)+'</div>'
          +'<div class="mvr-sgline">'+g.lots.length+' lot'+(g.lots.length>1?'s':'')+' \u00b7 '+nRef+' référence'+(nRef>1?'s':'')+'</div></div>'
        +'<div class="mvr-sgbadge">'+g.n+'<span class="mvr-u">fûts</span></div>'
        +'<div class="mvr-sgchev">'+_mvIcon('lecture',16)+'</div>'
      +'</div>'
      +'<div class="mvr-sgbody"><div class="mvr-sgbody-in"><div class="mvr-sgpad">';
    g.lots.forEach(function(f){
      h+='<div class="mvr-fcard">'
        +'<div class="mvr-fband"></div>'
        +'<div class="mvr-fin">'
          +'<div class="mvr-ftop"><div class="mvr-fref">'+_escHtml(f.ref||'Réf. non précisée')+'</div>'
          +_rsvFutQteHtml(f, adm)+'</div>'
          +'<div class="mvr-fmeta"><span>'+_mvIcon('calendrier',16)+' '+_escHtml(f.annee||'—')+'</span></div>'
          +(adm?'<div class="mvr-frow"><button class="mvr-mini" onclick="_rsvOpenFut(\''+_escAttr(f.id)+'\')">\u270F\uFE0F Modifier</button><button class="mvr-mini mvr-mini-d" onclick="_rsvDelFut(\''+_escAttr(f.id)+'\')">\uD83D\uDDD1\uFE0F</button></div>':'')
        +'</div>'
      +'</div>';
    });
    h+='</div></div></div></div>';
  });
  return h;
}

// ── Overlay fût : ajout / édition ──
function _rsvOpenFut(id){
  if(!isAdmin()){ showToast('Réservé à l\'administrateur du domaine','#C0392B'); return; }
  _rsvEditFut=id||null;
  var f=id?INTRANTS.futs.find(function(x){return x.id===id;}):null;
  document.getElementById('mvr-fut-title').textContent=f?'Modifier le lot de fûts':'Ajouter des fûts';
  _rsvFillDatalist('mvr-fut-four-list', INTRANTS.fut_four);
  document.getElementById('mvr-fut-four').value=f?(f.four||''):'';
  document.getElementById('mvr-fut-ref').value=f?(f.ref||''):'';
  document.getElementById('mvr-fut-annee').value=f?(f.annee||''):(new Date().getFullYear());
  document.getElementById('mvr-fut-qte').value=f?(f.qte||''):'';
  _rsvFutFourChange(); // réfs proposées scopées au fournisseur du lot
  if(window.openOv) window.openOv('ovRsvFut');
}
window._rsvOpenFut=_rsvOpenFut;

// deux lots de fûts sont « le même » si fournisseur + référence + millésime
// coïncident (comparaison tolérante). Saisir deux fois le même lot par le
// formulaire doit fusionner les quantités — comme le fait déjà le +/- — au lieu
// de créer une carte en double.
function _futSameLot(x, four, ref, annee){
  var n=function(v){ return String(v==null?'':v).trim().toLowerCase(); };
  return n(x.four)===n(four) && n(x.ref)===n(ref) && n(x.annee)===n(annee);
}

function _rsvSaveFut(){
  if(!isAdmin()){ showToast('Réservé à l\'administrateur','#C0392B'); return; }
  var four=document.getElementById('mvr-fut-four').value.trim();
  var ref=document.getElementById('mvr-fut-ref').value.trim();
  var annee=document.getElementById('mvr-fut-annee').value.trim();
  var qte=parseInt(document.getElementById('mvr-fut-qte').value)||0;
  if(!four && !ref){ showToast('Renseigne au moins le fournisseur ou la référence','#B85A1A'); return; }
  if(qte<=0){ showToast('Indique une quantité de fûts','#B85A1A'); return; }
  _uniqPush(INTRANTS.fut_four, four);
  _uniqPush(INTRANTS.fut_ref, ref);
  var merged=false;
  if(_rsvEditFut){
    var f=INTRANTS.futs.find(function(x){return x.id===_rsvEditFut;});
    if(f){ f.four=four; f.ref=ref; f.annee=annee; f.qte=qte; }
  } else {
    // lot identique déjà présent ? on fusionne (le +/- gère ensuite la quantité)
    var dup=INTRANTS.futs.find(function(x){return _futSameLot(x, four, ref, annee);});
    if(dup){ dup.qte=(parseInt(dup.qte)||0)+qte; merged=true; }
    else INTRANTS.futs.push({id:_rid(), four:four, ref:ref, annee:annee, qte:qte, date:_today()});
  }
  saveIntrants();
  if(window.closeOv) window.closeOv(null,'ovRsvFut');
  _rsvRenderBody();
  showToast(merged?'Fûts ajoutés au lot existant':'Fûts enregistrés','#3D6B27');
}
window._rsvSaveFut=_rsvSaveFut;

function _rsvDelFut(id){
  if(!isAdmin()) return;
  var f=INTRANTS.futs.find(function(x){return x.id===id;});
  if(!f) return;
  var label=(f.ref||f.four||'ce lot')+' — '+(parseInt(f.qte)||0)+' fût'+((parseInt(f.qte)||0)>1?'s':'');
  if(window.openConfirmDel){
    window.openConfirmDel('Supprimer ce lot de fûts ?', label, function(){
      INTRANTS.futs=INTRANTS.futs.filter(function(x){return x.id!==id;});
      saveIntrants(); _rsvRenderBody(); showToast('Lot supprimé','#C0392B');
    }, 'carton');
  }
}
window._rsvDelFut=_rsvDelFut;
// ── +/− : ajuster le nombre de fûts d'un lot déjà saisi (min. 1 ; corbeille = retirer le lot) ──
function _rsvFutQteHtml(f, adm){
  var q=parseInt(f.qte)||0;
  var lbl='fût'+(q>1?'s':'');
  if(!adm) return '<div class="mvr-fqte">'+q+'<span>'+lbl+'</span></div>';
  return '<div class="mvr-fstep">'
    +'<button type="button" class="mvr-fstepb" '+(q<=1?'disabled ':'')+'onclick="_rsvFutStep(\''+_escAttr(f.id)+'\',-1)" aria-label="Retirer un fût">−</button>'
    +'<div class="mvr-fstepc"><span class="mvr-fstepv">'+q+'</span><span class="mvr-fstepl">'+lbl+'</span></div>'
    +'<button type="button" class="mvr-fstepb" onclick="_rsvFutStep(\''+_escAttr(f.id)+'\',1)" aria-label="Ajouter un fût">＋</button>'
    +'</div>';
}
var _rsvSaveT=null;
function _rsvSaveFlush(){ if(_rsvSaveT){ clearTimeout(_rsvSaveT); _rsvSaveT=null; } saveIntrants(); }
function _rsvSaveDebounced(){ if(_rsvSaveT) clearTimeout(_rsvSaveT); _rsvSaveT=setTimeout(_rsvSaveFlush, 500); }
document.addEventListener('visibilitychange', function(){ if(document.hidden && _rsvSaveT) _rsvSaveFlush(); });
function _rsvFutStep(id, d){
  if(!isAdmin()){ showToast('Réservé à l\'administrateur du domaine','#C0392B'); return; }
  var f=INTRANTS.futs.find(function(x){return x.id===id;});
  if(!f) return;
  var q=parseInt(f.qte)||0;
  if(d<0 && q<=1) return;             // le − s'arrête à 1 ; retirer tout le lot = corbeille
  f.qte=Math.max(1, q+d);
  _rsvSaveDebounced();
  _rsvRenderBody();
}
window._rsvFutStep=_rsvFutStep;

// ── CSS du stepper fûts (injecté une fois — reserve.js seul, aucun bump) ──
function _rsvInjectCss(){
  if(document.getElementById('mvr-step-css')) return;
  var st=document.createElement('style');
  st.id='mvr-step-css';
  st.textContent=''
    +'.mvr-fstep{display:flex;align-items:center;gap:9px;flex:none}'
    +'.mvr-fstepb{width:40px;height:40px;border-radius:11px;border:1.5px solid var(--terre,#8A5A38);background:var(--bg-card,#FBFAF6);color:var(--terre,#8A5A38);font-size:22px;font-weight:700;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;transition:transform .07s ease,background .12s ease;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}'
    +'.mvr-fstepb:active{transform:scale(.9);background:var(--terre-pale,#F3EADF)}'
    +'.mvr-fstepb:disabled{opacity:.32;cursor:default}'
    +'.mvr-fstepc{min-width:46px;text-align:center}'
    +'.mvr-fstepv{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:28px;font-weight:700;color:var(--terre,#8A5A38);line-height:1;display:block}'
    +'.mvr-fstepl{font-size:10.5px;color:var(--muted,#7A7060);margin-top:-1px}'
    +'@media(hover:hover){.mvr-fstepb:hover{background:var(--terre-pale,#F3EADF)}}'
    +'@media(hover:hover){.mvr-fchip:hover{border-color:var(--terre,#8A5A38)}.mvr-sghd:hover{background:rgba(138,90,56,.04)}}'
    +'.mvr-flabel{font-size:11px;font-weight:600;color:var(--muted,#7A7060);text-transform:uppercase;letter-spacing:.6px;margin:2px 2px 8px}'
    +'.mvr-fbar{display:flex;gap:8px;overflow-x:auto;padding:1px 2px 10px;-webkit-overflow-scrolling:touch;scrollbar-width:none}'
    +'.mvr-fbar::-webkit-scrollbar{display:none}'
    +'.mvr-fchip{flex:none;border:1.5px solid var(--line,#E7DECF);background:var(--bg-card,#FBFAF6);color:var(--muted,#7A7060);border-radius:999px;padding:7px 13px;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:6px;transition:background .12s,border-color .12s,color .12s}'
    +'.mvr-fchip .mvr-cnt{font-size:11px;opacity:.7;font-weight:500}'
    +'.mvr-fchip.on{background:var(--terre,#8A5A38);border-color:var(--terre,#8A5A38);color:#fff}'
    +'.mvr-fchip.on .mvr-cnt{opacity:.85;color:#F0E2C8}'
    +'.mvr-ftools{display:flex;align-items:center;justify-content:space-between;margin:2px 2px 12px;gap:10px}'
    +'.mvr-fcount{font-size:12px;color:var(--muted,#7A7060)}'
    +'.mvr-fcount b{color:var(--terre,#8A5A38);font-weight:600}'
    +'.mvr-flink{border:none;background:transparent;color:var(--terre,#8A5A38);font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;padding:4px 2px;text-decoration:underline;text-underline-offset:2px;flex:none}'
    +'.mvr-sgrp{background:var(--bg-card,#FBFAF6);border:1px solid var(--line,#E7DECF);border-radius:15px;margin-bottom:11px;overflow:hidden}'
    +'.mvr-sghd{display:flex;align-items:center;gap:11px;padding:14px 15px;cursor:pointer;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}'
    +'.mvr-sgico{width:34px;height:34px;border-radius:10px;background:var(--terre-pale,#F3EADF);border:1px solid #E6D8C4;display:flex;align-items:center;justify-content:center;font-size:17px;flex:none}'
    +'.mvr-sgtx{flex:1;min-width:0}'
    +'.mvr-sgname{font-family:Cormorant Garamond,Georgia,serif;font-size:20px;font-weight:700;color:var(--texte,#2A241C);line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    +'.mvr-sgline{font-size:11px;color:var(--muted,#7A7060);margin-top:1px}'
    +'.mvr-sgbadge{flex:none;background:var(--cave,#14110D);color:#F0E2C8;border-radius:999px;padding:5px 11px;font-size:12.5px;font-weight:600;display:flex;align-items:baseline;gap:4px}'
    +'.mvr-sgbadge .mvr-u{font-size:10px;opacity:.7;font-weight:500}'
    +'.mvr-sgchev{flex:none;color:var(--muted,#7A7060);font-size:12px;transition:transform .25s ease;margin-left:2px}'
    +'.mvr-sgrp.open .mvr-sgchev{transform:rotate(90deg)}'
    +'.mvr-sgbody{display:grid;grid-template-rows:0fr;transition:grid-template-rows .28s ease}'
    +'.mvr-sgrp.open .mvr-sgbody{grid-template-rows:1fr}'
    +'.mvr-sgbody-in{overflow:hidden;min-height:0}'
    +'.mvr-sgpad{padding:0 13px 13px}'
    +'.mvr-sugg{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}'
    +'.mvr-slab{font-size:11px;color:var(--muted,#7A7060);width:100%;margin-bottom:-2px}'
    +'.mvr-schip{border:1px solid var(--terre,#8A5A38);background:var(--terre-pale,#F3EADF);color:var(--terre,#8A5A38);border-radius:999px;padding:6px 11px;font-size:12.5px;cursor:pointer;font-weight:500;font-family:inherit}'
    +'.mvr-schip:active{background:#E9DAC6}'
    +'.mvr-sempty{font-size:11.5px;color:var(--muted,#7A7060);font-style:italic;padding:2px 0}'
    +'@media(prefers-reduced-motion:reduce){.mvr-sgbody{transition:none}.mvr-sgchev{transition:none}}'
    +'.mvr-parc{background:linear-gradient(160deg,var(--cave,#14110D),var(--cave-2,#1C1813));border-radius:16px;padding:17px 15px 15px;margin-bottom:12px;text-align:center;position:relative;overflow:hidden}'
    +'.mvr-parc::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,#8A5A38 0%,#C2871E 50%,#3D6B27 100%)}'
    +'.mvr-parc-n{font-family:Cormorant Garamond,Georgia,serif;font-size:46px;font-weight:700;color:#F0E2C8;line-height:.95}'
    +'.mvr-parc-l{font-size:12.5px;color:#9C9184;margin-top:4px}'
    +'.mvr-parc-s{font-size:12px;color:#C8BCA6;margin-top:7px;line-height:1.5}'
    +'.mvr-parc-mv{display:flex;gap:12px;justify-content:center;align-items:baseline;margin-top:10px;padding-top:9px;border-top:1px solid rgba(216,188,114,.18);font-size:13px}'
    +'.mvr-parc-mv .up{color:#8DC868;font-weight:700}'
    +'.mvr-parc-mv .dn{color:#F0A89C;font-weight:700}'
    +'.mvr-parc-mv .lb{font-size:11px;color:#8F8677}'
    +'.mvr-mv{display:flex;align-items:center;gap:10px;padding:10px 0}'
    +'.mvr-mv+.mvr-mv{border-top:1px solid rgba(138,90,56,.08)}'
    +'.mvr-mv-i{width:31px;height:31px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;background:var(--terre-pale,#F3EADF)}'
    +'.mvr-mv-i.out{background:var(--rouge-pale,#FAEAE8)}'
    +'.mvr-mv-b{flex:1;min-width:0}'
    +'.mvr-mv-n{display:block;font-size:13.5px;font-weight:600;color:var(--texte,#2A241C)}'
    +'.mvr-mv-m{display:block;font-size:11.5px;color:var(--texte-doux,#5F5F5F);margin-top:1px}'
    +'.mvr-mv-q{font-family:Cormorant Garamond,Georgia,serif;font-size:19px;font-weight:700;flex-shrink:0;color:var(--vert-med,#3D6B27)}'
    +'.mvr-mv-q.out{color:var(--rouge,#A0291E)}'
    +'.mvr-mv-more{font-size:11.5px;color:var(--texte-doux,#5F5F5F);font-style:italic;padding:9px 0 4px}'
    +'.mvr-seplots{display:flex;flex-direction:column;gap:6px;margin-bottom:6px}'
    +'.mvr-seplot{text-align:left;background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.22);border-radius:11px;padding:10px 12px;font-family:inherit;cursor:pointer;min-height:48px;color:inherit}'
    +'.mvr-seplot.on{border-color:var(--or,#C2A14D);background:var(--or-pale,#FAF3E0)}'
    +'.mvr-seplot-n{display:block;font-size:14px;font-weight:600;color:var(--texte,#2A241C)}'
    +'.mvr-seplot-m{display:block;font-size:11.5px;color:var(--texte-doux,#5F5F5F);margin-top:2px}'
    +'.mvr-sepstep{display:flex;align-items:center;gap:4px;margin-bottom:6px}'
    +'.mvr-sepstep button{width:42px;height:42px;border-radius:10px;border:1px solid rgba(138,90,56,.28);background:var(--bg-card,#FBFAF6);color:var(--terre,#8A5A38);font-size:18px;font-family:inherit;cursor:pointer}'
    +'.mvr-sepstep button:disabled{opacity:.3;cursor:default}'
    +'.mvr-sepstep>span{min-width:40px;text-align:center;font-size:17px;font-weight:700;color:var(--terre,#8A5A38)}'
    +'.mvr-sepstep-u{font-size:12px;color:var(--texte-doux,#5F5F5F);font-weight:400}'
    +'.mvr-sepmots{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}'
    +'.mvr-sepmot{flex:1;min-width:104px;background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.25);border-radius:11px;padding:11px 8px;font-family:inherit;font-size:12.5px;color:var(--terre,#8A5A38);cursor:pointer;min-height:44px}'
    +'.mvr-sepmot.on{background:var(--cave,#14110D);color:var(--or-clair,#D8BC72);border-color:var(--cave,#14110D)}'
    +'.mvr-sepmot.on.dgr{background:var(--rouge,#A0291E);color:#fff;border-color:var(--rouge,#A0291E)}'
    +'.mvr-sepwarn{background:var(--orange-pale,#FBF0E6);border:1px solid rgba(184,90,26,.35);border-radius:11px;padding:10px 12px;margin-top:8px;font-size:12px;color:var(--texte-med,#4A4A3A);line-height:1.5}'
    +'.mvr-btn-dgr{background:linear-gradient(180deg,#B4402F,#8E2A1C)!important;color:#fff!important}';
  document.head.appendChild(st);
}


function _rsvFillDatalist(id, arr){
  var dl=document.getElementById(id); if(!dl) return;
  dl.innerHTML=(arr||[]).map(function(v){return '<option value="'+_escAttr(v)+'">';}).join('');
}
function _rsvFutFourChange(){
  var el=document.getElementById('mvr-fut-four'); if(!el) return;
  var four=(el.value||'').trim();
  var refs=_rsvRefsForFour(four);
  _rsvFutRefList=refs;
  _rsvFillDatalist('mvr-fut-ref-list', refs);
  var s=document.getElementById('mvr-fut-sugg'); if(!s) return;
  if(!four){ s.innerHTML='<div class="mvr-sempty">Choisis d\'abord un fournisseur pour voir ses références.</div>'; return; }
  if(!refs.length){ s.innerHTML='<div class="mvr-sempty">Aucune référence encore saisie chez ce fournisseur \u2014 tape la première.</div>'; return; }
  var chips=refs.map(function(r,i){ return '<button type="button" class="mvr-schip" onclick="_rsvPickFutRef('+i+')">'+_escHtml(r)+'</button>'; }).join('');
  s.innerHTML='<div class="mvr-slab">Déjà utilisées chez ce fournisseur :</div>'+chips;
}
window._rsvFutFourChange=_rsvFutFourChange;
function _rsvPickFutRef(i){ var r=_rsvFutRefList[i]; if(r==null) return; var el=document.getElementById('mvr-fut-ref'); if(el) el.value=r; }
window._rsvPickFutRef=_rsvPickFutRef;

// ═══════════════════════════ SECTION INTRANTS ═══════════════════════════
// ── LES CATEGORIES D'INTRANT, ET L'ATELIER QUI S'EN DEDUIT ──────────────────
// Le selecteur portait DEUX options. Quatre s'ajoutent : les fournitures de
// vigne (piquet, fil, agrafe), celles de cave (bouchon, capsule, nettoyage),
// les pieces de tracteur (filtre, huile, courroie) et un seau general.
// ★★ L'ATELIER N'EST JAMAIS DEMANDE. Il se DEDUIT de la categorie : un produit
//   phyto part par definition sur la vigne, un produit oeno dans la cave. Poser
//   un second champ « atelier » a cote du premier, ce serait faire ressaisir a
//   la main une information deja donnee — et ouvrir la porte a ce que les deux
//   se contredisent.
// ⚠️ `gen` (non affecte) N'EST PAS OPTIONNEL. Sans seau de sortie, quelqu'un
//   rangera de force un achat dans un atelier faux, et le total mentira avec
//   l'autorite d'un chiffre. Un « non affecte » visible vaut mieux qu'une
//   repartition inventee — meme regle que « source absente => tiret, jamais
//   zero ».
var _CATLBL={phyto:'Phyto',oeno:'Œno',vigne:'Fournitures vigne',cave:'Fournitures cave',trac:'Pièces tracteur',gen:'Général'};
var _CATCLS={phyto:'mvr-cat-p',oeno:'mvr-cat-o',vigne:'mvr-cat-p',cave:'mvr-cat-o',trac:'mvr-cat-t',gen:'mvr-cat-g'};
// Categorie -> atelier. UNE table, lue partout : reserve.js pour l'affichage,
// pilotage.js pour la repartition. Deux tables auraient fini par diverger.
var _CAT2ATE={phyto:'vigne',oeno:'cave',vigne:'vigne',cave:'cave',trac:'trac',gen:'gen'};
// Les quatre ateliers, ensemble FERME — meme discipline que les quatre tons de
// _mvBadge. Un cinquieme et deux ecrans finiraient par dire la meme chose de
// deux couleurs differentes. Un atelier inconnu retombe sur `gen`.
var _ATELBL={vigne:'Vigne',cave:'Cave',trac:'Tracteur',gen:'Non affecté'};
var _ATECOL={vigne:'#3D6B27',cave:'#8A5A38',trac:'#2C3E50',gen:'#DED7C9'};
var _ATEORD=['vigne','cave','trac','gen'];
function _rsvAteDe(cat){ return _CAT2ATE[cat]||'gen'; }
window._rsvAteDe=_rsvAteDe;
window._rsvAteLbl=function(k){ return _ATELBL[k]||_ATELBL.gen; };
window._rsvAteCol=function(k){ return _ATECOL[k]||_ATECOL.gen; };
window._rsvAteOrdre=function(){ return _ATEORD.slice(); };
function _rsvIntrantsHtml(){
  var adm=isAdmin();
  var h='';
  if(adm){
    h+='<div class="mvr-btnrow">'
      +'<button class="mvr-btn mvr-btn-p" onclick="_rsvOpenAchat()">\uFF0B Achat</button>'
      +'<button class="mvr-btn mvr-btn-o" onclick="_rsvOpenInv()">'+_mvIcon('envoyer',16)+' Inventaire d\'ouverture</button>'
      +'</div>';
  }
  // Alerte cohérence
  var neg=INTRANTS.produits.filter(function(p){var s=_stock(p);return s.known&&s.q<0;});
  neg.forEach(function(p){
    var s=_stock(p);
    h+='<div class="mvr-alert"><span class="mvr-ai">'+_mvIcon('alerte',18)+'</span><span class="mvr-at"><b>'+_escHtml(p.nom)+' : stock négatif ('+_fmt(s.q)+' '+p.unite+').</b> Le consommé dépasse les entrées — une facture d\'achat manque ou le consommé est surestimé. Le bilan ne peut pas fermer tant que l\'écart n\'est pas corrigé.'+_rsvNegEstime(p)+'</span></div>';
  });
  if(!INTRANTS.produits.length){
    h+='<div class="mvr-empty">'+_mvIcon('eprouvette',40)+'<div>Aucun intrant suivi.</div>'+(adm?'<div class="mvr-empty-h">Enregistre un achat pour créer ton premier intrant et démarrer le bilan matière.</div>':'')+'</div>';
    return h;
  }
  INTRANTS.produits.forEach(function(p){
    var s=_stock(p);
    var pending=(p.conso_src==='registre'&&!s.known);
    var nu=_nbUnites(p,s.q);
    var stCol=(s.known&&s.q<0)?'var(--rouge)':'var(--terre)';
    h+='<div class="mvr-pcard"><div class="mvr-pband '+(_CATCLS[p.cat]||'')+'"></div><div class="mvr-pin">'
      +'<div class="mvr-ptop"><div class="mvr-pw"><div class="mvr-pnom">'+_escHtml(p.nom)+'</div>'+((p.sub||p.amm)?'<div class="mvr-psub2">'+(p.sub?_escHtml(p.sub):'')+((p.sub&&p.amm)?' \u00b7 ':'')+(p.amm?'AMM '+_escHtml(p.amm):'')+'</div>':'')+'</div><div class="mvr-pcat '+(_CATCLS[p.cat]||'')+'">'+(_CATLBL[p.cat]||p.cat)+'</div></div>';
    if(pending){
      h+='<div class="mvr-pending">'+_mvIcon('rotation',16)+' <b>Consommé à activer.</b> Entrées : '+_fmt(s.ouv+s.achats)+' '+p.unite+'. Le consommé se calculera depuis le registre une fois les doses structurées (lot suivant), ou passe l\'intrant en saisie manuelle.</div>';
    } else {
      h+='<div class="mvr-pstock"><span class="mvr-psv" style="color:'+stCol+'">'+_fmt(s.q)+'</span><span class="mvr-psu">'+p.unite+' en stock</span></div>'
        +(nu!=null&&s.q>=0?'<div class="mvr-punits">\u2248 '+_fmt(nu)+' '+(p.contLbl||'unité')+(nu>1?'s':'')+'</div>':'');
      h+='<div class="mvr-pbilan"><span>Ouv. '+_fmt(s.ouv)+'</span><span class="mvr-pin-v">+ '+_fmt(s.achats)+' achats</span><span class="mvr-pout-v">− '+_fmt(s.conso)+' conso'+(p.conso_src==='manual'?' <button class="mvr-cedit" onclick="_rsvConsoEdit(\''+_escAttr(p.id)+'\')">\u270F\uFE0F</button>':'')+'</span></div>';
    }
    // Le prix unitaire : une MOYENNE PONDEREE des achats, et on dit sur combien
    // de lignes elle porte. Un prix moyen calcule sur une facture parmi six ne
    // vaut pas un prix moyen calcule sur six — le lecteur doit pouvoir trancher.
    var _pu=_rsvPrixU(p), _nsp=_rsvPrixUSansPrix(p);
    if(_pu>0){
      h+='<div class="mvr-pbilan"><span>Prix moyen <b>'+_escHtml(_eur2(_pu))+'\u00a0\u20AC/'+_escHtml(p.unite)+'</b></span>'
        +(_nsp>0?('<span class="mvr-pout-v">'+_nsp+' achat'+(_nsp>1?'s':'')+' sans prix</span>'):'')
        +'</div>';
    }
    h+='<div class="mvr-pfoot"><span class="mvr-pmv">'+_consoSrcLbl(p)+'</span>'
      +(pending?'':'<span class="mvr-badge '+((s.known&&s.q<0)?'mvr-b-ko':'mvr-b-ok')+'">'+((s.known&&s.q<0)?'\u26A0 écart':'\u2713 cohérent')+'</span>')
      +'</div>';
    h+='</div></div>';
  });
  return h;
}
// La TROISIEME cause d'un ecart, et la seule qui soit nouvelle : la dose etait
// juste, mais le volume sur lequel elle a ete appliquee etait estime.
function _rsvNegEstime(p){
  if(!p||p.conso_src!=='cuvier') return '';
  var n=_consoCuvierEstime(p.id);
  if(!n) return '';
  return ' <b>'+n+' adjonction'+(n>1?'s':'')+' du Cuvier repose'+(n>1?'nt':'')
    +' sur un volume estim\u00e9</b> \u2014 l\u2019\u00e9cart peut venir de l\u00e0 avant de venir d\u2019une facture.';
}
function _consoSrcLbl(p){
  if(p.conso_src==='cuvier') return 'Consomm\u00e9 : adjonctions du Cuvier';
  if(p.conso_src==='cave_so2') return 'Consommé : opérations Cave (SO\u2082)';
  if(p.conso_src==='manual') return 'Consommé : saisie manuelle';
  return 'Consommé : registre phyto';
}
// Édition inline du consommé manuel
window._rsvConsoEdit=function(id){
  var p=INTRANTS.produits.find(function(x){return x.id===id;}); if(!p) return;
  if(!window.openPrompt){ showToast('Saisie indisponible','#C0392B'); return; }
  window.openPrompt({
    icone:'✏️',
    titre:'Consommé cette saison',
    sub:p.nom,                       // pose via textContent : pas d'echappement a faire ici
    unite:p.unite||'',
    valeur:(p.conso_manuel||0),
    cb:function(v){
      p.conso_manuel=parseFloat(String(v).replace(',','.'))||0;
      saveIntrants(); _rsvRenderBody();
      showToast('Consommé mis à jour','#3D6B27');
    }
  });
};

// ── Overlay ACHAT ──
function _rsvOpenAchat(){
  if(!isAdmin()){ showToast('Réservé à l\'administrateur','#C0392B'); return; }
  var sel=document.getElementById('mvr-a-prod');
  sel.innerHTML=INTRANTS.produits.map(function(p){return '<option value="'+_escAttr(p.id)+'">'+_escHtml(p.nom)+' ('+(_CATLBL[p.cat]||p.cat)+')</option>';}).join('')
    +'<option value="__new__">\uFF0B Nouvel intrant…</option>';
  if(!INTRANTS.produits.length) sel.value='__new__';
  _rsvFillDatalist('mvr-a-four-list', INTRANTS.achat_four);
  document.getElementById('mvr-a-date').value=_today();
  ['mvr-a-fact','mvr-a-four','mvr-a-unites','mvr-a-qte','mvr-a-lot','mvr-a-prix','mvr-np-nom','mvr-np-cont'].forEach(function(k){var el=document.getElementById(k);if(el)el.value='';});
  _rsvEphySel=null; _rsvEphyRes=[];
  _rsvSetSaisie('u');
  _rsvOnProdChange();
  if(window.openOv) window.openOv('ovRsvAchat');
}
window._rsvOpenAchat=_rsvOpenAchat;

function _rsvOnProdChange(){
  var v=document.getElementById('mvr-a-prod').value;
  var isNew=(v==='__new__');
  document.getElementById('mvr-np-block').style.display=isNew?'':'none';
  if(isNew) _rsvNpCatChange();
  _rsvUpdContHint();
}
window._rsvOnProdChange=_rsvOnProdChange;

// ── Recherche E-Phy pour un nouvel intrant phyto ──
function _rsvNorm(s){ s=(s==null?'':String(s)).toLowerCase(); try{ s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,''); }catch(e){} return s.trim(); }
function _rsvEphyOn(){ return !!(window.EPHY && window.EPHY.length); }
function _rsvNpShow(mode){
  var e=document.getElementById('mvr-np-ephy'), m=document.getElementById('mvr-np-man');
  if(e) e.style.display=(mode==='ephy')?'':'none';
  if(m) m.style.display=(mode==='man')?'':'none';
}
function _rsvEphyReset(){
  _rsvEphySel=null; _rsvEphyRes=[];
  var q=document.getElementById('mvr-np-q'); if(q) q.value='';
  var er=document.getElementById('mvr-np-eres'); if(er) er.innerHTML='';
  var ep=document.getElementById('mvr-np-epick'); if(ep){ ep.style.display='none'; ep.innerHTML=''; }
  var nom=document.getElementById('mvr-np-nom'); if(nom) nom.value='';
}
function _rsvNpCatChange(){
  var cat=document.getElementById('mvr-np-cat').value;
  // ⚠️ LA SOURCE DE CONSOMMATION N'EST PAS UN DETAIL. `registre` va chercher des
  //   doses dans TRAITEMENTS, `cave_so2` des grammes dans les operations de cave.
  //   Un piquet ou un filtre n'a NI l'un NI l'autre : laisser `registre` par
  //   defaut ferait chercher dans un registre phyto qui ne parlera jamais de lui,
  //   et le stock resterait « inconnu » a vie (_conso rend known:false). Les
  //   quatre categories nouvelles partent donc en saisie manuelle.
  var src=document.getElementById('mvr-np-src');
  if(src) src.value=(cat==='oeno')?'cuvier':((cat==='phyto')?'registre':'manual');
  // L'atelier deduit s'affiche : une deduction qu'on ne peut pas verifier est
  // indistinguable d'une invention.
  var ded=document.getElementById('mvr-np-ate');
  if(ded){
    var k=_rsvAteDe(cat);
    ded.innerHTML='Atelier <b>'+_escHtml(_ATELBL[k])+'</b> \u2014 d\u00e9duit du type d\u2019intrant, rien \u00e0 saisir.';
    ded.style.borderColor='color-mix(in srgb,'+_ATECOL[k]+' 38%, transparent)';
    ded.style.background='color-mix(in srgb,'+_ATECOL[k]+' 9%, transparent)';
  }
  if(cat==='phyto' && _rsvEphyOn()){ _rsvNpShow('ephy'); _rsvEphyReset(); }
  else { _rsvNpShow('man'); _rsvEphySel=null; }
  _rsvUpdContHint();
}
window._rsvNpCatChange=_rsvNpCatChange;
function _rsvNpManual(){ _rsvNpShow('man'); _rsvEphySel=null; var nom=document.getElementById('mvr-np-nom'); if(nom){ nom.value=''; nom.focus(); } }
window._rsvNpManual=_rsvNpManual;
function _rsvEphySearch(){
  var raw=document.getElementById('mvr-np-q').value, q=_rsvNorm(raw);
  var box=document.getElementById('mvr-np-eres');
  var pk=document.getElementById('mvr-np-epick'); if(pk) pk.style.display='none';
  if(q.length<2){ box.innerHTML=''; _rsvEphyRes=[]; return; }
  var EP=window.EPHY||[];
  var m=EP.filter(function(p){ return _rsvNorm(p.nom).indexOf(q)>=0 || _rsvNorm(p.sub||'').indexOf(q)>=0 || (p.noms2||[]).some(function(n){return _rsvNorm(n).indexOf(q)>=0;}); })
        .sort(function(a,b){ return (a.statut===b.statut)?0:(a.statut==='ok'?-1:1); });
  _rsvEphyRes=m.slice(0,8);
  var more=Math.max(0,m.length-8);
  if(!_rsvEphyRes.length){ box.innerHTML='<div class="mvr-eempty">Aucun produit E-Phy pour \u00ab '+_escHtml(raw)+' \u00bb. Tu peux le saisir \u00e0 la main.</div>'; return; }
  box.innerHTML=_rsvEphyRes.map(function(p,i){
    var sub=p.sub?('<span class="mvr-esub">'+_escHtml(p.sub)+'</span>'):'';
    var amm=p.amm?('<span class="mvr-eamm">AMM '+_escHtml(p.amm)+'</span>'):'';
    var ko=(p.statut&&p.statut!=='ok')?'<span class="mvr-eko">retir\u00e9</span>':'';
    return '<button type="button" class="mvr-eitem" onclick="_rsvEphyPick('+i+')"><span class="mvr-enom">'+_escHtml(p.nom)+'</span>'+sub+amm+ko+'</button>';
  }).join('')+(more?'<div class="mvr-emore">+ '+more+' autre'+(more>1?'s':'')+' \u2014 pr\u00e9cise ta recherche</div>':'');
}
window._rsvEphySearch=_rsvEphySearch;
function _rsvEphyPick(i){
  var p=_rsvEphyRes[i]; if(!p) return;
  var u=(p.usages&&p.usages[0])||{};
  _rsvEphySel={nom:p.nom, amm:p.amm||'', sub:p.sub||'', type:p.type||'', dose:(u.dose&&u.dose!=='\u2014')?u.dose:''};
  var nom=document.getElementById('mvr-np-nom'); if(nom) nom.value=p.nom;
  document.getElementById('mvr-np-eres').innerHTML='';
  document.getElementById('mvr-np-q').value='';
  var pk=document.getElementById('mvr-np-epick');
  pk.style.display='';
  pk.innerHTML='<div class="mvr-epk-nom">'+_escHtml(p.nom)+'</div>'
    +'<div class="mvr-epk-meta">'+(p.sub?_escHtml(p.sub)+' \u00b7 ':'')+(p.amm?'AMM '+_escHtml(p.amm):'')+'</div>'
    +'<button type="button" class="mvr-elink" onclick="_rsvEphyClear()">Changer de produit</button>';
}
window._rsvEphyPick=_rsvEphyPick;
function _rsvEphyClear(){
  _rsvEphySel=null;
  var pk=document.getElementById('mvr-np-epick'); if(pk){ pk.style.display='none'; pk.innerHTML=''; }
  var nom=document.getElementById('mvr-np-nom'); if(nom) nom.value='';
  var q=document.getElementById('mvr-np-q'); if(q){ q.value=''; q.focus(); }
}
window._rsvEphyClear=_rsvEphyClear;

function _rsvCurProd(){
  var v=document.getElementById('mvr-a-prod').value;
  if(v==='__new__'){
    return { unite:document.getElementById('mvr-np-unite').value||'kg', contenance:parseFloat(document.getElementById('mvr-np-cont').value)||0, contLbl:_rsvContLbl() };
  }
  return INTRANTS.produits.find(function(x){return x.id===v;})||{unite:'kg',contenance:0};
}
function _rsvContLbl(){ var u=document.getElementById('mvr-np-unite').value; return u==='L'?'bidon':'sac'; }
function _rsvUpdContHint(){
  var p=_rsvCurProd();
  document.getElementById('mvr-a-qunit').textContent='en '+(p.unite||'kg');
  var n=parseFloat(document.getElementById('mvr-a-unites').value)||0;
  var ct=p.contenance||0;
  document.getElementById('mvr-a-conthint').textContent=ct?((n||0)+' '+(p.contLbl||'unité')+((n||0)>1?'s':'')+' \u00D7 '+ct+' '+(p.unite||'kg')):'renseigne la contenance ci-dessus';
}
window._rsvUpdContHint=_rsvUpdContHint;

function _rsvSetSaisie(m){
  _rsvSaisie=m;
  ['u','q','b'].forEach(function(k){var el=document.getElementById('mvr-sg-'+k);if(el)el.classList.toggle('on',k===m);});
  document.getElementById('mvr-a-uwrap').style.display=(m==='u'||m==='b')?'':'none';
  document.getElementById('mvr-a-qdwrap').style.display=(m==='q'||m==='b')?'':'none';
  _rsvCalcQ();
}
window._rsvSetSaisie=_rsvSetSaisie;
function _rsvCalcQ(){
  _rsvUpdContHint();
  if(_rsvSaisie==='u'){
    var p=_rsvCurProd(); var n=parseFloat(document.getElementById('mvr-a-unites').value)||0;
    if(p.contenance) document.getElementById('mvr-a-qte').value=n*p.contenance;
  }
}
window._rsvCalcQ=_rsvCalcQ;

function _rsvSaveAchat(){
  if(!isAdmin()){ showToast('Réservé à l\'administrateur','#C0392B'); return; }
  var sel=document.getElementById('mvr-a-prod').value;
  var prodId;
  if(sel==='__new__'){
    var nom=document.getElementById('mvr-np-nom').value.trim();
    if(!nom){ showToast('Donne un nom à l\'intrant','#B85A1A'); return; }
    var cat=document.getElementById('mvr-np-cat').value;
    var src=document.getElementById('mvr-np-src').value;
    var unite=document.getElementById('mvr-np-unite').value;
    var cont=parseFloat(document.getElementById('mvr-np-cont').value)||0;
    var np={id:_rid(), nom:nom, cat:cat, unite:unite, contenance:cont, contLbl:(unite==='L'?'bidon':'sac'), conso_src:src, conso_manuel:0, amm:(_rsvEphySel&&_rsvEphySel.amm)||'', sub:(_rsvEphySel&&_rsvEphySel.sub)||'', ephy_type:(_rsvEphySel&&_rsvEphySel.type)||''};
    INTRANTS.produits.push(np);
    prodId=np.id;
  } else { prodId=sel; }
  var p=INTRANTS.produits.find(function(x){return x.id===prodId;});
  var n=parseFloat(document.getElementById('mvr-a-unites').value)||0;
  var q=parseFloat(document.getElementById('mvr-a-qte').value)|| (n*(p.contenance||0)) ||0;
  if(!q){ showToast('Renseigne une quantité (unités ou directe)','#B85A1A'); return; }
  var four=document.getElementById('mvr-a-four').value.trim();
  _uniqPush(INTRANTS.achat_four, four);
  INTRANTS.achats.push({id:_rid(), prodId:prodId, date:document.getElementById('mvr-a-date').value||_today(),
    four:four, q:q, unites:n||null, lot:document.getElementById('mvr-a-lot').value.trim(),
    fact:document.getElementById('mvr-a-fact').value.trim(), prix:parseFloat(document.getElementById('mvr-a-prix').value)||0});
  saveIntrants();
  if(window.closeOv) window.closeOv(null,'ovRsvAchat');
  _rsvRenderBody();
  showToast('\u2713 Achat enregistré','#3D6B27');
}
window._rsvSaveAchat=_rsvSaveAchat;

// ── Overlay INVENTAIRE d'ouverture ──
function _rsvOpenInv(){
  if(!isAdmin()){ showToast('Réservé à l\'administrateur','#C0392B'); return; }
  if(!INTRANTS.produits.length){ showToast('Crée d\'abord un intrant via un achat','#B85A1A'); return; }
  document.getElementById('mvr-i-date').value=_today();
  var list=INTRANTS.produits.map(function(p){
    var cur=_invOuv(p);
    return '<div class="mvr-irow"><div class="mvr-iname">'+_escHtml(p.nom)+'<span>'+(_CATLBL[p.cat]||p.cat)+'</span></div>'
      +'<input type="number" class="mvr-fi mvr-iq" data-pid="'+_escAttr(p.id)+'" value="'+(cur||'')+'" placeholder="0"><span class="mvr-iu">'+p.unite+'</span></div>';
  }).join('');
  document.getElementById('mvr-i-list').innerHTML=list;
  if(window.openOv) window.openOv('ovRsvInv');
}
window._rsvOpenInv=_rsvOpenInv;
function _rsvSaveInv(){
  if(!isAdmin()) return;
  var date=document.getElementById('mvr-i-date').value||_today();
  var inputs=document.querySelectorAll('#mvr-i-list .mvr-iq');
  Array.prototype.forEach.call(inputs, function(inp){
    var pid=inp.getAttribute('data-pid'); var q=parseFloat(inp.value);
    if(isNaN(q)) return;
    INTRANTS.inventaires=INTRANTS.inventaires.filter(function(i){return !(i.prodId===pid&&i.date===date);});
    INTRANTS.inventaires.push({prodId:pid, date:date, q:q});
  });
  saveIntrants();
  if(window.closeOv) window.closeOv(null,'ovRsvInv');
  _rsvRenderBody();
  showToast('\u2713 Inventaire enregistré','#3D6B27');
}
window._rsvSaveInv=_rsvSaveInv;

// ═══════════════════════════ SECTION BILAN / AUDIT ═══════════════════════════
function _rsvAuditHtml(){
  var h='<div class="mvr-exp-head"><div class="mvr-exp-t">Bilan matière — Intrants</div>'
    +'<div class="mvr-exp-s">'+_escHtml(window.DOMAINE_NOM||'Domaine')+' \u00B7 arrêté au '+_frDate(_today())+'</div></div>';
  if(!INTRANTS.produits.length){
    h+='<div class="mvr-empty" style="border-radius:0 0 14px 14px">'+_mvIconInline('liste',16)+'<div>Rien à restituer pour l\'instant.</div><div class="mvr-empty-h">Le bilan se remplit dès qu\'un intrant est suivi.</div></div>';
  } else {
    h+='<div class="mvr-exp-tbl"><table><thead><tr><th>Intrant</th><th>Ouv.</th><th>Achats</th><th>Conso.</th><th>Stock</th><th>Coh.</th></tr></thead><tbody>';
    INTRANTS.produits.forEach(function(p){
      var s=_stock(p); var pending=(p.conso_src==='registre'&&!s.known);
      h+='<tr><td>'+_escHtml(p.nom)+' <span class="mvr-tag-'+(p.cat==='oeno'?'o':'p')+'">'+(_CATLBL[p.cat]||p.cat)+'</span></td>'
        +'<td>'+_fmt(s.ouv)+'</td><td>+'+_fmt(s.achats)+'</td>'
        +'<td>'+(pending?'<span class="mvr-td-pend">à activer</span>':'\u2212'+_fmt(s.conso))+'</td>'
        +'<td class="'+((s.known&&s.q<0)?'mvr-neg':'')+'">'+(pending?'\u2014':_fmt(s.q)+' '+p.unite)+'</td>'
        +'<td>'+(pending?'\u2014':((s.known&&s.q<0)?_mvIconInline('alerte',16):_mvIconInline('check',16)))+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }
  h+='<div class="mvr-exp-legal"><b>Contrôle bio.</b> Ce tableau restitue l\'équilibre entrées / sorties exigé au contrôle documentaire (règlement délégué <b>UE 2021/771, art. 1</b>). Les sorties sont dérivées automatiquement : opérations Cave pour l\'œno, registre phyto pour les traitements.</div>';
  return h;
}

window._rsvExportPdf=function(){
  var rows='';
  INTRANTS.produits.forEach(function(p){
    var s=_stock(p); var pending=(p.conso_src==='registre'&&!s.known);
    rows+='<tr><td class="l">'+_escHtml(p.nom)+' ('+(_CATLBL[p.cat]||p.cat)+')</td><td>'+_fmt(s.ouv)+'</td><td>+'+_fmt(s.achats)+'</td>'
      +'<td>'+(pending?'à activer':'\u2212'+_fmt(s.conso))+'</td><td><b>'+(pending?'\u2014':_fmt(s.q)+' '+_escHtml(p.unite))+'</b></td>'
      +'<td>'+(pending?'\u2014':((s.known&&s.q<0)?'ecart':'ok'))+'</td></tr>';
  });
  var futRows='';
  INTRANTS.futs.forEach(function(f){ futRows+='<tr><td class="l">'+_escHtml(f.ref||'—')+'</td><td>'+_escHtml(f.four||'—')+'</td><td>'+_escHtml(f.annee||'—')+'</td><td>'+(parseInt(f.qte)||0)+'</td></tr>'; });
  var dom=_escHtml(window.DOMAINE_NOM||'Domaine');
  if(typeof window._mvDocOpen!=='function'){ showToast('Mise \u00e0 jour incompl\u00e8te \u2014 rechargez l\u2019application','#B85A1A'); return; }
  var css='h2{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.1px;color:#8A5A38;'
    +'border-bottom:1px solid #E4DCCB;padding-bottom:4px;margin:18px 0 8px}h2:first-child{margin-top:0}'
    +'table{width:100%;border-collapse:collapse;font-size:9.5px;margin-top:6px}'
    +'th{background:#F6F2E8;text-align:right;padding:6px 8px;border-bottom:1px solid #E4DCCB;color:#6B6355;'
    +'font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px}'
    +'th:first-child,td.l{text-align:left}'
    +'td{padding:6px 8px;text-align:right;border-bottom:1px solid #F0EBE0;color:#2A2A22}';
  var corps='<h2>Intrants \u2014 entr\u00e9es et sorties</h2>'
    +'<table><thead><tr><th>Intrant</th><th>Ouverture</th><th>Achats</th><th>Consomm\u00e9</th><th>Stock</th><th>Coh\u00e9rence</th></tr></thead><tbody>'
    +(rows||'<tr><td class="l" colspan="6">Aucun intrant.</td></tr>')+'</tbody></table>'
    +'<h2>Parc de f\u00fbts</h2>'
    +'<table><thead><tr><th>R\u00e9f\u00e9rence</th><th>Fournisseur</th><th>Mill\u00e9sime</th><th>Quantit\u00e9</th></tr></thead><tbody>'
    +(futRows||'<tr><td class="l" colspan="4">Aucun f\u00fbt.</td></tr>')+'</tbody></table>'
    +'<div class="mvdoc-lim">Bilan mati\u00e8re restituant l\u2019\u00e9quilibre entr\u00e9es / sorties '
    +'(r\u00e8glement d\u00e9l\u00e9gu\u00e9 UE 2021/771, art. 1). Les sorties sont d\u00e9riv\u00e9es automatiquement : '
    +'op\u00e9rations de cave pour l\u2019\u0153nologie, registre phytosanitaire pour les traitements. '
    +'\u00c9tat interne \u2014 ce n\u2019est pas une d\u00e9claration officielle.</div>';
  window._mvDocOpen({
    titre:'Bilan mati\u00e8re \u2014 intrants', domaine:dom, orient:'portrait', cat:'reserve',
    metas:['Arr\u00eat\u00e9 au '+_frDate(_today())],
    corps:corps, css:css
  });
}

// ═══════════════════════════ EXPORT PDF — INVENTAIRE DES FÛTS ═══════════════════════════
function _rsvExportFutsPdf(){
  if(!INTRANTS.futs.length){ showToast('Aucun f\u00fbt \u00e0 exporter','#B85A1A'); return; }
  var groups=_futsBySupplier(INTRANTS.futs);   // fournisseur A->Z, lots ann\u00e9e desc puis r\u00e9f
  var total=_futTotal();
  var nFour=_futSuppliersCount();
  var years=_futYears();
  var refSet={}; INTRANTS.futs.forEach(function(f){ var r=(f.ref||'').trim().toLowerCase(); if(r) refSet[r]=1; });
  var nRef=Object.keys(refSet).length;

  // Sections par fournisseur (tableau R\u00e9f\u00e9rence / Mill\u00e9sime / Nombre + sous-total)
  var sections='';
  groups.forEach(function(g){
    var name=(g.four==='__nofour__')?'Sans fournisseur':g.four;
    var rs={}; g.lots.forEach(function(l){ var r=(l.ref||'').trim().toLowerCase(); if(r) rs[r]=1; });
    var nr=Object.keys(rs).length;
    var rows='';
    g.lots.forEach(function(f){
      var q=parseInt(f.qte)||0;
      rows+='<tr><td class="l">'+_escHtml(f.ref||'R\u00e9f\u00e9rence non pr\u00e9cis\u00e9e')+'</td>'
        +'<td class="c">'+_escHtml(f.annee||'\u2014')+'</td>'
        +'<td class="n">'+q+'</td></tr>';
    });
    sections+='<div class="grp">'
      +'<div class="grp-hd"><div class="grp-name">'+_escHtml(name)+'</div>'
        +'<div class="grp-meta">'+g.lots.length+' lot'+(g.lots.length>1?'s':'')+' \u00b7 '+nr+' r\u00e9f.</div>'
        +'<div class="grp-tot">'+g.n+' <span>f\u00fbts</span></div></div>'
      +'<table class="t"><thead><tr><th class="l">R\u00e9f\u00e9rence</th><th class="c">Mill\u00e9sime</th><th class="n">Nombre</th></tr></thead>'
      +'<tbody>'+rows+'</tbody>'
      +'<tfoot><tr><td class="l" colspan="2">Sous-total '+_escHtml(name)+'</td><td class="n">'+g.n+'</td></tr></tfoot>'
      +'</table></div>';
  });

  // R\u00e9partition par mill\u00e9sime (barres)
  var maxY=0; years.forEach(function(y){ var c=_futYearCount(y); if(c>maxY) maxY=c; });
  var yrows='';
  years.forEach(function(y){
    var c=_futYearCount(y);
    var lbl=(y==='__none__')?'Sans mill\u00e9sime':y;
    var pct=maxY?Math.round(c/maxY*100):0;
    yrows+='<tr><td class="l">'+_escHtml(lbl)+'</td>'
      +'<td class="bar"><div class="bt"><div class="bf" style="width:'+pct+'%"></div></div></td>'
      +'<td class="n">'+c+'</td></tr>';
  });

  var dom=_escHtml(window.DOMAINE_NOM||'Domaine');
  var MOIS=['janvier','f\u00e9vrier','mars','avril','mai','juin','juillet','ao\u00fbt','septembre','octobre','novembre','d\u00e9cembre'];
  var d=new Date();
  var dateStr=d.getDate()+' '+MOIS[d.getMonth()]+' '+d.getFullYear();
  var sais=_saisonNom();
  var metaLine='Arr\u00eat\u00e9 au '+dateStr+(sais?(' \u00b7 Saison '+_escHtml(sais)):'');
  var O=location.origin;

  var css=''
    +'*{box-sizing:border-box;margin:0;padding:0}'
    +'@page{size:A4 portrait;margin:14mm 12mm}'
    +'body{font-family:\'Outfit\',system-ui,-apple-system,\'Segoe UI\',Roboto,Arial,sans-serif;color:#2A241C;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:12px;line-height:1.45}'
    +'.serif{font-family:\'Cormorant Garamond\',Georgia,\'Times New Roman\',serif}'
    +'.hero{background:#14110D;color:#F0E2C8;border-radius:14px;padding:26px 30px 22px;position:relative;overflow:hidden}'
    +'.hero .eye{font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:#C2871E;font-weight:600}'
    +'.hero h1{font-size:34px;font-weight:600;line-height:1.05;margin-top:6px;color:#F7EFDD}'
    +'.hero .meta{margin-top:10px;font-size:12px;color:#C9BCA6}'
    +'.hero .filet{position:absolute;left:0;right:0;bottom:0;height:5px;background:linear-gradient(90deg,#8A5A38,#C2871E,#3D6B27)}'
    +'.kpis{display:flex;gap:10px;margin:16px 0 6px}'
    +'.kpi{flex:1;background:#FBFAF6;border:1px solid #E4DDD0;border-top:3px solid #C2871E;border-radius:10px;padding:12px 10px;text-align:center}'
    +'.kpi .v{font-size:26px;font-weight:600;font-family:\'Cormorant Garamond\',Georgia,serif;color:#14110D;line-height:1}'
    +'.kpi .l{font-size:9.5px;letter-spacing:.05em;text-transform:uppercase;color:#7A7060;margin-top:5px}'
    +'.sec{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:19px;color:#8A5A38;margin:22px 0 8px;padding-bottom:5px;border-bottom:1.5px solid #F3EADF;font-weight:600}'
    +'.grp{border:1px solid #E4DDD0;border-radius:10px;overflow:hidden;margin-bottom:12px;page-break-inside:avoid;break-inside:avoid}'
    +'.grp-hd{display:flex;align-items:center;gap:10px;background:#F3EADF;padding:9px 14px;border-left:4px solid #C2871E}'
    +'.grp-name{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:17px;font-weight:600;color:#14110D;flex:1}'
    +'.grp-meta{font-size:10.5px;color:#7A7060}'
    +'.grp-tot{font-size:15px;font-weight:600;color:#8A5A38;white-space:nowrap}'
    +'.grp-tot span{font-size:10px;color:#7A7060;font-weight:500;margin-left:2px}'
    +'table.t{width:100%;border-collapse:collapse;font-size:12px}'
    +'table.t th{background:#FBF6EE;text-align:left;padding:7px 14px;font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:#7A7060;font-weight:600;border-bottom:1px solid #E4DDD0}'
    +'table.t td{padding:7px 14px;border-bottom:1px solid #F0EBE1}'
    +'table.t tbody tr:nth-child(even) td{background:#FCFAF5}'
    +'table.t .c,table.t th.c{text-align:center}'
    +'table.t .n,table.t th.n{text-align:right}'
    +'table.t .n{font-variant-numeric:tabular-nums;font-weight:600}'
    +'table.t tfoot td{background:#14110D;color:#F0E2C8;font-weight:600;padding:8px 14px;border:0}'
    +'table.t tfoot .n{color:#F7EFDD}'
    +'table.y{width:100%;border-collapse:collapse;font-size:12px}'
    +'table.y td{padding:6px 14px;border-bottom:1px solid #F0EBE1;vertical-align:middle}'
    +'table.y .l{width:150px;font-weight:600;color:#14110D}'
    +'table.y .bt{background:#F3EADF;border-radius:6px;height:14px;overflow:hidden}'
    +'table.y .bf{height:100%;background:linear-gradient(90deg,#8A5A38,#C2871E);border-radius:6px}'
    +'table.y .n{width:64px;text-align:right;font-weight:600;font-variant-numeric:tabular-nums}'
    +'.gt{display:flex;align-items:center;justify-content:space-between;background:#14110D;color:#F0E2C8;border-radius:12px;padding:16px 24px;margin-top:22px;position:relative;overflow:hidden}'
    +'.gt .filet{position:absolute;left:0;top:0;bottom:0;width:5px;background:linear-gradient(180deg,#8A5A38,#C2871E,#3D6B27)}'
    +'.gt .lbl{font-size:20px;padding-left:8px}'
    +'.gt .big{font-size:30px;font-weight:600;color:#F7EFDD}'
    +'.gt .big span{font-size:13px;color:#C9BCA6;font-weight:500;margin-left:4px}'
    +'.foot{margin-top:18px;padding-top:12px;border-top:1px solid #E4DDD0;font-size:10px;color:#7A7060;display:flex;justify-content:space-between}'
    +'@media print{.grp,.kpi,.gt{break-inside:avoid}}';

  var html='<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">'
    +'<meta name="viewport" content="width=device-width,initial-scale=1">'
    +'<title>Inventaire des f\u00fbts \u2014 '+dom+'</title>'
    +'<link rel="stylesheet" href="'+O+'/fonts/fonts.css">'
    +'<style>'+css+'</style></head><body>'
    +'<div class="hero"><div class="eye">Inventaire \u2014 Parc de f\u00fbts</div>'
      +'<h1 class="serif">'+dom+'</h1>'
      +'<div class="meta">'+metaLine+'</div>'
      +'<div class="filet"></div></div>'
    +'<div class="kpis">'
      +'<div class="kpi"><div class="v">'+total+'</div><div class="l">F\u00fbts au total</div></div>'
      +'<div class="kpi"><div class="v">'+nFour+'</div><div class="l">Fournisseurs</div></div>'
      +'<div class="kpi"><div class="v">'+nRef+'</div><div class="l">R\u00e9f\u00e9rences</div></div>'
      +'<div class="kpi"><div class="v">'+years.length+'</div><div class="l">Mill\u00e9simes</div></div>'
    +'</div>'
    +'<div class="sec">D\u00e9tail par fournisseur</div>'
    +sections
    +'<div class="sec">R\u00e9partition par mill\u00e9sime</div>'
    +'<table class="y"><tbody>'+yrows+'</tbody></table>'
    +'<div class="gt"><div class="filet"></div><div class="lbl serif">Total du parc</div>'
      +'<div class="big serif">'+total+'<span>f\u00fbts</span></div></div>'
    +'<div class="foot"><span>\u00c9dit\u00e9 avec Ma Vigne \u00b7 GUERETTECH</span><span>G\u00e9n\u00e9r\u00e9 le '+dateStr+'</span></div>'
    +'<scr'+'ipt>window.onload=function(){setTimeout(function(){window.print();},500);};</scr'+'ipt>'
    +'</body></html>';

  try{
    var blob=new Blob([html],{type:'text/html'});
    var url=URL.createObjectURL(blob);
    var w=window.open(url,'_blank');
    if(!w) showToast('Autorise les pop-ups pour imprimer','#B85A1A');
  }catch(e){ showToast('Export impossible','#C0392B'); }
}
window._rsvExportFutsPdf=_rsvExportFutsPdf;

// ═══════════════════════════ OVERLAYS (injectés dans body une fois) ═══════════════════════════
function _rsvEnsureOverlays(){
  if(document.getElementById('ovRsvFut')) return;
  var wrap=document.createElement('div');
  wrap.id='mvr-overlays';
  wrap.innerHTML=''
  // ── Fût ──
  +'<div class="overlay" id="ovRsvFut" onclick="closeOv(event,\'ovRsvFut\')"><div class="modal" onclick="event.stopPropagation()">'
    +'<div class="modal-handle"></div><div class="modal-hd"><div class="modal-title" id="mvr-fut-title">Ajouter des fûts</div></div>'
    +'<div class="modal-body">'
      +'<div class="mvr-fl">Fournisseur</div><input class="mvr-fi" id="mvr-fut-four" list="mvr-fut-four-list" placeholder="ex. Tonnellerie Rousseau" autocomplete="off" oninput="_rsvFutFourChange()"><datalist id="mvr-fut-four-list"></datalist>'
      +'<div class="mvr-fl">Référence du fût</div><input class="mvr-fi" id="mvr-fut-ref" list="mvr-fut-ref-list" placeholder="ex. Chêne français, chauffe moyenne" autocomplete="off"><datalist id="mvr-fut-ref-list"></datalist>'
      +'<div class="mvr-sugg" id="mvr-fut-sugg"></div>'
      +'<div class="mvr-f2"><div><div class="mvr-fl">Millésime du fût</div><input type="number" class="mvr-fi" id="mvr-fut-annee" placeholder="2026"></div>'
      +'<div><div class="mvr-fl">Quantité</div><input type="number" class="mvr-fi" id="mvr-fut-qte" placeholder="nb de fûts"></div></div>'
      +'<div class="mvr-hint">Les fournisseurs et références saisis réapparaissent ensuite dans les listes déroulantes.</div>'
      +'<div class="mvr-btnrow" style="margin-top:18px"><button class="mvr-btn mvr-btn-o" onclick="closeOv(null,\'ovRsvFut\')">Annuler</button><button class="mvr-btn mvr-btn-p" onclick="_rsvSaveFut()">\u2713 Enregistrer</button></div>'
    +'</div></div></div>'
  // ── Achat ──
  +'<div class="overlay" id="ovRsvAchat" onclick="closeOv(event,\'ovRsvAchat\')"><div class="modal" onclick="event.stopPropagation()">'
    +'<div class="modal-handle"></div><div class="modal-hd"><div class="modal-title">Enregistrer un achat</div><div class="modal-sub">Une entrée = une facture</div></div>'
    +'<div class="modal-body">'
      +'<div class="mvr-fl">Intrant</div><select class="mvr-fi" id="mvr-a-prod" onchange="_rsvOnProdChange()"></select>'
      +'<div id="mvr-np-block" style="display:none">'
        +'<div class="mvr-np-card">'
        +'<div class="mvr-fl">Type d\'intrant</div><select class="mvr-fi" id="mvr-np-cat" onchange="_rsvNpCatChange()"><option value="phyto">Phyto \u2014 depuis le catalogue E-Phy</option><option value="oeno">Œno (SO\u2082, levures\u2026)</option><option value="vigne">Fournitures vigne (piquet, fil, agrafe\u2026)</option><option value="cave">Fournitures cave (bouchon, capsule, nettoyage\u2026)</option><option value="trac">Pi\u00e8ces tracteur (filtre, huile, courroie\u2026)</option><option value="gen">G\u00e9n\u00e9ral / non affect\u00e9</option></select>'
        +'<div id="mvr-np-ephy" style="display:none">'
          +'<div class="mvr-fl">Produit E-Phy (ANSES)</div>'
          +'<input class="mvr-fi" id="mvr-np-q" placeholder="nom commercial ou substance\u2026" oninput="_rsvEphySearch()" autocomplete="off">'
          +'<div id="mvr-np-eres" class="mvr-eres"></div>'
          +'<div id="mvr-np-epick" class="mvr-epick" style="display:none"></div>'
          +'<button type="button" class="mvr-elink" onclick="_rsvNpManual()">Produit absent de la liste \u2192 le saisir \u00e0 la main</button>'
        +'</div>'
        +'<div id="mvr-np-man" style="display:none"><div class="mvr-fl">Nom de l\'intrant</div><input class="mvr-fi" id="mvr-np-nom" placeholder="ex. Bouillie Bordelaise RSR"></div>'
        +'<div class="mvr-f2"><div><div class="mvr-fl">Unité</div><select class="mvr-fi" id="mvr-np-unite" onchange="_rsvUpdContHint()"><option value="kg">kg</option><option value="L">L</option></select></div>'
        +'<div><div class="mvr-fl">Contenance / unité</div><input type="number" class="mvr-fi" id="mvr-np-cont" placeholder="ex. 25" oninput="_rsvUpdContHint()"></div></div>'
        +'<div class="mvr-fl">Consommé calculé via</div><select class="mvr-fi" id="mvr-np-src"><option value="registre">Registre phyto</option><option value="cuvier">Adjonctions du Cuvier</option><option value="cave_so2">Opérations Cave (SO\u2082)</option><option value="manual">Saisie manuelle</option></select>'
        +'<div class="mvr-ded" id="mvr-np-ate"></div>'
        +'</div>'
      +'</div>'
      +'<div class="mvr-f2"><div><div class="mvr-fl">Date</div><input type="date" class="mvr-fi" id="mvr-a-date"></div>'
      +'<div><div class="mvr-fl">N° facture</div><input class="mvr-fi" id="mvr-a-fact" placeholder="FA-2026-…"></div></div>'
      +'<div class="mvr-fl">Fournisseur</div><input class="mvr-fi" id="mvr-a-four" list="mvr-a-four-list" placeholder="ex. Comptoir Viti Beaune" autocomplete="off"><datalist id="mvr-a-four-list"></datalist>'
      +'<div class="mvr-fl">Saisir la quantité</div><div class="mvr-seg"><button class="mvr-segb on" id="mvr-sg-u" onclick="_rsvSetSaisie(\'u\')">Par unités</button><button class="mvr-segb" id="mvr-sg-q" onclick="_rsvSetSaisie(\'q\')">Directe</button><button class="mvr-segb" id="mvr-sg-b" onclick="_rsvSetSaisie(\'b\')">Les deux</button></div>'
      +'<div class="mvr-f2"><div id="mvr-a-uwrap"><div class="mvr-fl">Nb d\'unités</div><input type="number" class="mvr-fi" id="mvr-a-unites" placeholder="ex. 6" oninput="_rsvCalcQ()"><div class="mvr-hint" id="mvr-a-conthint"></div></div>'
      +'<div id="mvr-a-qdwrap"><div class="mvr-fl">Quantité totale</div><input type="number" class="mvr-fi" id="mvr-a-qte" placeholder="kg / L"><div class="mvr-hint" id="mvr-a-qunit">en kg</div></div></div>'
      +'<div class="mvr-f2"><div><div class="mvr-fl">N° de lot</div><input class="mvr-fi" id="mvr-a-lot" placeholder="optionnel"></div>'
      +'<div><div class="mvr-fl">Prix HT (€)</div><input type="number" class="mvr-fi" id="mvr-a-prix" placeholder="optionnel"></div></div>'
      +'<div class="mvr-btnrow" style="margin-top:18px"><button class="mvr-btn mvr-btn-o" onclick="closeOv(null,\'ovRsvAchat\')">Annuler</button><button class="mvr-btn mvr-btn-p" onclick="_rsvSaveAchat()">\u2713 Enregistrer l\'achat</button></div>'
    +'</div></div></div>'
  // ── Inventaire ──
  +'<div class="overlay" id="ovRsvInv" onclick="closeOv(event,\'ovRsvInv\')"><div class="modal" onclick="event.stopPropagation()">'
    +'<div class="modal-handle"></div><div class="modal-hd"><div class="modal-title">Inventaire d\'ouverture</div><div class="modal-sub">Le point zéro du bilan</div></div>'
    +'<div class="modal-body">'
      +'<div class="mvr-note">'+_mvIcon('envoyer',16)+' Ce que tu avais en stock au démarrage du suivi. Saisi une fois, à une date de référence — ensuite tout est calculé.</div>'
      +'<div class="mvr-fl">Date de l\'inventaire</div><input type="date" class="mvr-fi" id="mvr-i-date">'
      +'<div id="mvr-i-list" style="margin-top:8px"></div>'
      +'<div class="mvr-btnrow" style="margin-top:18px"><button class="mvr-btn mvr-btn-o" onclick="closeOv(null,\'ovRsvInv\')">Annuler</button><button class="mvr-btn mvr-btn-p" onclick="_rsvSaveInv()">\u2713 Valider l\'inventaire</button></div>'
    +'</div></div></div>'
  // ── Se séparer de fûts ──
  +'<div class="overlay" id="ovRsvSep" onclick="closeOv(event,\'ovRsvSep\')"><div class="modal" onclick="event.stopPropagation()">'
    +'<div class="mvr-ovh"><div class="mvr-ovt">'+_mvIcon('envoyer',18)+' Se séparer de fûts</div>'
    +'<button class="mvr-ovx" onclick="closeOv(null,\'ovRsvSep\')">'+_mvIcon('croix',16)+'</button></div>'
    +'<div class="mvr-ovs">Sortie définitive du parc. Ne concerne que les fûts <b>libres</b> : '
    +'un fût en vin se retire d\'abord de sa cuvée, depuis Le Chai.</div>'
    +'<div id="mvr-sep-body"></div>'
    +'<label class="mvr-lab">Note</label>'
    +'<input id="mvr-sep-note" class="mvr-in" type="text" placeholder="acheteur, défaut constaté\u2026">'
    +'<div class="mvr-btnrow" style="margin-top:18px">'
    +'<button class="mvr-btn mvr-btn-o" onclick="closeOv(null,\'ovRsvSep\')">Annuler</button>'
    +'<button class="mvr-btn mvr-btn-p" id="mvr-sep-go" onclick="_rsvSaveSep()">\u2713 Valider</button></div>'
  +'</div></div>';
  document.body.appendChild(wrap);
}

// ── applyFbData branché depuis app.js appelle window.INTRANTS via ce setter ──
window._rsvApply=function(value){
  if(!value||typeof value!=='object') return;
  var d={produits:[],achats:[],inventaires:[],futs:[],fut_four:[],fut_ref:[],achat_four:[]};
  Object.keys(d).forEach(function(k){ INTRANTS[k]=Array.isArray(value[k])?value[k]:d[k]; });
  window.INTRANTS=INTRANTS;
  var ap=document.querySelector('.page.active');
  if(ap&&ap.id==='page-reserve') renderReserve();
};

if(DEBUG) console.log('[reserve.js] module La Réserve chargé');

// ════════════════════════════════════════════════════════════════════════════
// LE PARC A FUTS — etat, registre, separation
// Le moteur vit dans utils.js (window._mvFut*) : cave.js s'en sert aussi, et il
// est importe AVANT reserve.js. Ici, seulement l'ecran et les gestes.
// ════════════════════════════════════════════════════════════════════════════

var _rsvSep = {lotId:null, nb:1, motif:'vente'};

function _rsvParc(){
  return window._mvFutParc ? window._mvFutParc(INTRANTS, window.CAVE_ELEVAGE, null) : null;
}

// Bloc pose en tete de l'onglet Futs : le parc entier, pas seulement le stock.
function _rsvParcHtml(){
  var p = _rsvParc(); if(!p) return '';
  var mv = p.mouv, h = '';
  h += '<div class="mvr-parc">'
    +  '<div class="mvr-parc-n">' + p.parc + '</div>'
    +  '<div class="mvr-parc-l">f\u00fbts au domaine</div>'
    +  '<div class="mvr-parc-s">' + p.occupes + ' en vin \u00b7 ' + p.libres + ' libre'
    +  (p.libres > 1 ? 's' : '') + (p.aReformer ? ' \u00b7 ' + p.aReformer + ' au-del\u00e0 de '
    +  p.vie + ' vins' : '') + '</div>';
  if(mv.entrees || mv.sorties){
    h += '<div class="mvr-parc-mv"><span class="up">+' + mv.entrees + '</span>'
      +  '<span class="dn">\u2212' + mv.sorties + '</span>'
      +  '<span class="lb">cette ann\u00e9e</span></div>';
  }
  h += '</div>';
  return h;
}

// Registre : tout ce qui entre et sort, avec son motif. Rien n'est efface.
function _rsvMouvHtml(){
  var p = _rsvParc(); if(!p) return '';
  var l = p.mouv.lignes;
  if(!l.length) return '';
  var M = window.MV_FUT_MOTIFS || {};
  var h = '<div class="mvr-sec" style="margin-top:20px">Registre du parc</div>'
    + '<div class="mvr-card" style="padding:4px 13px">';
  l.slice(0, 40).forEach(function(m){
    var d = M[m.motif] || {lbl:m.motif, ico:'\u2022'};
    var out = (m.sens === 'sortie');
    var ref = (window._mvFutRef ? window._mvFutRef(m) : '') || 'sans r\u00e9f\u00e9rence';
    h += '<div class="mvr-mv"><span class="mvr-mv-i' + (out ? ' out' : '') + '">' + d.ico + '</span>'
      +  '<span class="mvr-mv-b"><span class="mvr-mv-n">' + d.lbl + '</span>'
      +  '<span class="mvr-mv-m">' + _escHtml(ref) + (m.annee ? ' \u00b7 ' + m.annee : '')
      +  ' \u00b7 ' + _rsvDateFr(m.date) + (m.note ? ' \u00b7 ' + _escHtml(m.note) : '') + '</span></span>'
      +  '<span class="mvr-mv-q' + (out ? ' out' : '') + '">' + (out ? '\u2212' : '+') + m.nb + '</span></div>';
  });
  if(l.length > 40) h += '<div class="mvr-mv-more">' + (l.length - 40) + ' mouvements plus anciens</div>';
  return h + '</div>';
}
function _rsvDateFr(iso){
  var p = String(iso||'').split('-');
  return (p.length === 3) ? (p[2] + '/' + p[1] + '/' + p[0]) : (iso || '');
}

// ── SE SEPARER DE FUTS ────────────────────────────────────────────────────
// Sortie definitive du parc, avec motif et trace. Distincte de _rsvDelFut, qui
// efface une ligne saisie par erreur : effacer une erreur n'est pas un mouvement.
function _rsvOpenSep(){
  if(!isAdmin()){ showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur du domaine','#C0392B'); return; }
  var st = window._mvFutStock ? window._mvFutStock(INTRANTS) : {lots:[], total:0};
  if(!st.lots.length){ showToast('Aucun f\u00fbt libre au parc','#B85A1A'); return; }
  _rsvSep = {lotId:st.lots[0].id, nb:1, motif:'vente'};
  _rsvRenderSep();
  if(window.openOv) window.openOv('ovRsvSep');
}
function _rsvRenderSep(){
  var host = document.getElementById('mvr-sep-body'); if(!host) return;
  var st = window._mvFutStock(INTRANTS);
  var lot = st.lots.find(function(l){ return l.id === _rsvSep.lotId; }) || st.lots[0];
  if(!lot){ host.innerHTML = '<div class="mvr-empty">Aucun f\u00fbt libre.</div>'; return; }
  _rsvSep.lotId = lot.id;
  var max = lot.qte;
  if(_rsvSep.nb > max) _rsvSep.nb = max;
  if(_rsvSep.nb < 1) _rsvSep.nb = 1;
  var M = window.MV_FUT_MOTIFS, SEP = window.MV_FUT_SEP;
  var h = '<div class="mvr-lab">Quel lot</div><div class="mvr-seplots">';
  st.lots.forEach(function(l){
    h += '<button type="button" class="mvr-seplot' + (l.id === _rsvSep.lotId ? ' on' : '') + '"'
      +  ' onclick="window._rsvSepLot(\'' + _escAttr(l.id) + '\')">'
      +  '<span class="mvr-seplot-n">' + _escHtml(l.nom) + '</span>'
      +  '<span class="mvr-seplot-m">' + (l.annee || '?') + ' \u00b7 '
      +  window._mvFutAge(l.vins) + ' \u00b7 ' + l.qte + ' libre' + (l.qte > 1 ? 's' : '')
      +  '</span></button>';
  });
  h += '</div><div class="mvr-lab">Combien</div>'
    +  '<div class="mvr-sepstep"><button type="button" onclick="window._rsvSepAdj(-1)"'
    +  (_rsvSep.nb <= 1 ? ' disabled' : '') + '>\u2212</button>'
    +  '<span>' + _rsvSep.nb + '</span>'
    +  '<button type="button" onclick="window._rsvSepAdj(1)"'
    +  (_rsvSep.nb >= max ? ' disabled' : '') + '>\uff0b</button>'
    +  '<span class="mvr-sepstep-u">sur ' + max + '</span></div>'
    +  '<div class="mvr-lab">Motif</div><div class="mvr-sepmots">';
  SEP.forEach(function(k){
    h += '<button type="button" class="mvr-sepmot' + (_rsvSep.motif === k ? ' on' : '')
      +  (_rsvSep.motif === k && k === 'destruction' ? ' dgr' : '') + '"'
      +  ' onclick="window._rsvSepMotif(\'' + k + '\')">' + M[k].ico + ' ' + M[k].lbl + '</button>';
  });
  h += '</div>';
  if(_rsvSep.motif === 'destruction'){
    h += '<div class="mvr-sepwarn">Ces f\u00fbts quittent d\u00e9finitivement le parc. '
      +  'Le mouvement reste au registre : rien n\u2019est effac\u00e9.</div>';
  }
  host.innerHTML = h;
  var btn = document.getElementById('mvr-sep-go');
  if(btn){
    btn.textContent = '\u2713 ' + M[_rsvSep.motif].lbl + ' \u2014 ' + _rsvSep.nb
      + ' f\u00fbt' + (_rsvSep.nb > 1 ? 's' : '');
    btn.classList.toggle('mvr-btn-dgr', _rsvSep.motif === 'destruction');
  }
}
function _rsvSepLot(id){ _rsvSep.lotId = id; _rsvSep.nb = 1; _rsvRenderSep(); }
function _rsvSepAdj(d){
  var lot = window._mvFutStock(INTRANTS).lots.find(function(l){ return l.id === _rsvSep.lotId; });
  if(!lot) return;
  _rsvSep.nb = Math.max(1, Math.min(lot.qte, _rsvSep.nb + d));
  _rsvRenderSep();
}
function _rsvSepMotif(m){ _rsvSep.motif = m; _rsvRenderSep(); }
function _rsvSaveSep(){
  if(!isAdmin()){ showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#C0392B'); return; }
  var note = ((document.getElementById('mvr-sep-note') || {}).value || '').trim();
  var n = window._mvFutSeparer(INTRANTS, _rsvSep.lotId, _rsvSep.nb, _rsvSep.motif, note);
  if(!n){ showToast('Rien n\u2019a chang\u00e9','#B85A1A'); return; }
  saveIntrants();
  if(window.closeOv) window.closeOv(null, 'ovRsvSep');
  var M = window.MV_FUT_MOTIFS[_rsvSep.motif];
  showToast(M.ico + ' ' + n + ' f\u00fbt' + (n > 1 ? 's' : '') + ' \u2014 ' + M.lbl.toLowerCase(), '#3D6B27');
  _rsvRenderBody();
}
window._rsvOpenSep   = _rsvOpenSep;
window._rsvSepLot    = _rsvSepLot;
window._rsvSepAdj    = _rsvSepAdj;
window._rsvSepMotif  = _rsvSepMotif;
window._rsvSaveSep   = _rsvSaveSep;
window._rsvParcHtml  = _rsvParcHtml;
window._rsvMouvHtml  = _rsvMouvHtml;
