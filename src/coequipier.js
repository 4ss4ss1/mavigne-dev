// =============================================================================
// Ma Vigne — LE COÉQUIPIER DU TRACTEUR, PARCELLE PAR PARCELLE (src/coequipier.js) — COEQ-2 (§523)
// -----------------------------------------------------------------------------
// Nico (03/11) : « pouvoir changer d'équipier en mode tracteur », « le changer après coup aussi », un résultat, un calcul et
// une ergonomie professionnels — maquette docs/maquettes/maquette-coequipier-journal-v1.html, « go » le 03/11 (D1 à D6).
// tracteur.js l'importe en tête et l'appelle par window ; ce fichier emprunte au Tracteur ses outils par window._trPont (§488),
// comme le compteur. Sorti de tracteur.js : 226 Ko, et le cliquet de poids (mv-harnais-typo) tient la croissance à 5 % par lot.
// © 2026 Nicolas GUÉRET / GUERETTECH
// =============================================================================
import { isAdmin, isTractoriste, showToast, _escHtml, _escAttr, _mvBadge, _mvToday } from './utils.js';
const DEBUG = false;
function _P(){ return (typeof window!=='undefined'&&window._trPont)||{}; }
// ★★ COEQ-2 (§523) — LE COÉQUIPIER, PARCELLE PAR PARCELLE (maquette-coequipier-journal-v1, « go » de Nico le 03/11).
//   Chaque parcelle cochée garde son coéquipier (`co`, vide = personne) ; `s.coequipier` = celui du moment, que prendra la
//   prochaine. ★ Avant de changer, toute parcelle faite sans `co` reçoit l'ancien (_trFigerCo) : sinon le passé suivrait.
//   Sans `co` (sessions d'avant), une parcelle lit `s.coequipier`. Le tractoriste change celui de sa session en cours (pour la
//   suite, ou depuis ce matin) et corrige aujourd'hui ; l'admin corrige tout, sessions terminées comprises (D4).
var _trHas=function(o,k){ return !!o&&typeof o==='object'&&Object.prototype.hasOwnProperty.call(o,k); };
function _trCoDe(s,x){ return _trHas(x,'co')?String(x.co||''):String((s&&s.coequipier)||''); }
function _trSessADeux(s){
  if(!s) return false;
  var a=(window.ACTIVITES||[]).find(function(y){ return y&&y.nom===s.activite; });
  return window._mvActCoeq(a)||!!s.coequipier||(s.parcellesFaites||[]).some(function(x){ return _trHas(x,'co')&&!!x.co; });
}
function _trCoeqNoms(s){ var l=[]; ((s&&s.parcellesFaites)||[]).forEach(function(x){ var c=_trCoDe(s,x); if(c&&l.indexOf(c)<0) l.push(c); }); if(s&&s.coequipier&&l.indexOf(s.coequipier)<0) l.push(s.coequipier); return l; }
function _trIso(t){ var d=new Date(t),p=function(n){ return (n<10?'0':'')+n; }; return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }
function _trAuj(){ return (typeof _mvToday==='function')?_mvToday():_trIso(Date.now()); }
// Le jour d'une parcelle faite, règle de FERTI-9 (§499) : début du chrono, sa fin, le jour de la coche, sinon la session.
function _trJourDe(s,x){
  if(x&&typeof x==='object'){
    if(typeof x.t0==='number'&&x.t0>0) return _trIso(x.t0);
    if(typeof x.t1==='number'&&x.t1>0) return _trIso(x.t1);
    if(/^\d{4}-\d{2}-\d{2}$/.test(String(x.d||''))) return x.d;
  }
  return String((s&&s.date)||'').slice(0,10);
}
function _trStampCo(s,e){ if(e&&typeof e==='object'&&!_trHas(e,'co')&&_trSessADeux(s)) e.co=String(s.coequipier||''); }
function _trFigerCo(s){ ((s&&s.parcellesFaites)||[]).forEach(function(x){ if(x&&typeof x==='object'&&!_trHas(x,'co')) x.co=String(s.coequipier||''); }); }
function _trCoSnap(s){ var m={}; ((s&&s.parcellesFaites)||[]).forEach(function(x){ if(x&&typeof x==='object') m[x.nom]={a:_trHas(x,'co'),co:x.co,cc:x.coCorr||null}; }); return m; }
function _trCoRetour(s,m){ ((s&&s.parcellesFaites)||[]).forEach(function(x){ var o=(x&&typeof x==='object')?m[x.nom]:null; if(!o) return; if(o.a) x.co=o.co; else delete x.co; if(o.cc) x.coCorr=o.cc; else delete x.coCorr; }); }
// Les parcelles faites par jour, le plus récent d'abord ; dans un jour, l'ordre des coches.
function _trJoursDe(s){ var m={},o=[]; ((s&&s.parcellesFaites)||[]).forEach(function(x){ if(!x||typeof x!=='object') return; var j=_trJourDe(s,x); if(!m[j]){ m[j]=[]; o.push(j); } m[j].push(x); }); o.sort().reverse(); return o.map(function(j){ return {jour:j,parcs:m[j]}; }); }
function _trEqDuJour(s,parcs){ var l=[]; parcs.forEach(function(x){ var c=_trCoDe(s,x); if(l.indexOf(c)<0) l.push(c); }); return l; }
// « avec Léo », « avec Léo puis Hugo », « seul », « seul puis avec Hugo »
function _trAvecTxt(l){ return l.map(function(n,i){ return n?((i===0||!l[i-1])?'avec '+n:n):'seul'; }).join(' puis '); }
function _trEtListe(l){ return l.length<2?l.join(''):l.slice(0,-1).join(', ')+' et '+l[l.length-1]; }
function _trJourTxt(j){
  var a=_trAuj(); if(j===a) return 'Aujourd\u2019hui';
  var d=new Date(j+'T12:00:00'),h=new Date(a+'T12:00:00'); if(isNaN(d.getTime())) return String(j||'');
  if(Math.round((h-d)/86400000)===1) return 'Hier';
  return ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'][d.getDay()]+' '+d.getDate()+' '+['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'][d.getMonth()];
}
function _trAva(n){
  if(!n) return '<span class="java sdeq-vide" aria-hidden="true">\u2013</span>';
  var m=(window.MEMBRES||[]).find(function(x){ return x&&x.nom===n; });
  return '<span class="java" style="background:'+_escAttr((m&&m.couleur)||'var(--acier)')+'" aria-hidden="true">'+_escHtml(Array.from(String(n))[0])+'</span>';
}
function _trValTxt(s,x){ var a=(window.ACTIVITES||[]).find(function(y){ return y&&y.nom===s.activite; }), lab=a&&a.champCustom&&a.champCustom.label; return (lab&&x&&x.data&&x.data[lab]!=null&&x.data[lab]!=='')?(x.data[lab]+'\u00a0'+String(lab).toLowerCase()):''; }
function _trCoeqCandidats(s){
  var c=(s&&s.conducteur)||'', l=(window.MEMBRES||[]).filter(function(m){ return m&&m.nom&&m.nom!==c&&String(m.statut||'Actif').toLowerCase()==='actif'; }).map(function(m){ return m.nom; });
  _trCoeqNoms(s).forEach(function(n){ if(n!==c&&l.indexOf(n)<0) l.push(n); });   // un ancien coéquipier reste choisissable, pour corriger
  return l;
}
function _trPeutChanger(s){ return !!s&&s.statut==='En cours'&&((typeof isTractoriste==='function'&&isTractoriste())||(typeof isAdmin==='function'&&isAdmin())); }
function _trPeutCorriger(s,j){ return (typeof isAdmin==='function'&&isAdmin())||(_trPeutChanger(s)&&j===_trAuj()); }
function _trSessCour(){ return (window.SESSIONS||[]).find(function(x){ return x.id===window.tracSessionId; })||null; }
// L'encart de l'équipe, sous celui du tracteur.
function renderSDEqEncart(){
  var h=document.getElementById('sd-eq-encart'); if(!h) return;
  var s=_trSessCour();
  if(!s||!_trSessADeux(s)){ h.hidden=true; h.innerHTML=''; return; }
  var enc=s.statut==='En cours', co=String(s.coequipier||'');
  var l=enc?[co]:_trEqDuJour(s,(s.parcellesFaites||[]).filter(function(x){ return x&&typeof x==='object'; })); if(!l.length) l=[co];
  var dp=s.coeqDepuis, a=_trAuj(), jt=dp&&dp.j?_trJourTxt(dp.j):'';
  var dep=!jt?'depuis le d\u00e9but':(dp.j===a?(dp.h?'depuis '+String(dp.h).replace(':','\u00a0h\u00a0'):'depuis ce matin'):(jt==='Hier'?'depuis hier':'depuis le '+jt.toLowerCase()));
  var noms=l.filter(Boolean);
  h.hidden=false;
  h.innerHTML='<span class="java-grp">'+_trAva(s.conducteur)+(noms.length?noms.slice(0,2).map(function(n){ return _trAva(n); }).join(''):_trAva(''))+'</span>'
    +'<span class="sdeq-txt"><span class="sdeq-t">'+_escHtml((s.conducteur||'')+', '+_trAvecTxt(l))+'</span><span class="sdeq-s">'+_escHtml(enc?'Co\u00e9quipier '+dep:'Le d\u00e9tail, jour par jour, plus bas')+'</span></span>'
    +(_trPeutChanger(s)?'<button type="button" class="mvbtn mvbtn-secondaire mvbtn-compact" data-sdeq="changer" data-tuto="trac.eq.changer" aria-label="Changer de co\u00e9quipier">Changer</button>':'');
}
// Les parcelles faites, jour par jour, avec qui était là.
function _sdRenderFaites(){
  var h=document.getElementById('sd-faites'); if(!h) return;
  var s=_trSessCour(), J=s&&_trSessADeux(s)?_trJoursDe(s):[];
  if(!J.length){ h.innerHTML=''; return; }
  h.innerHTML='<div class="sdeq-flbl">Faites, jour par jour</div>'+J.map(function(g){
    var l=_trEqDuJour(s,g.parcs), mx=l.length>1, ha=g.parcs.reduce(function(t,x){ return t+_P().chrSurf(x.nom); },0), cc=g.parcs.filter(function(x){ return x.coCorr; })[0];
    return '<div class="sdeq-jour"><div class="sdeq-jhd"><span class="sdeq-txt"><span class="sdeq-t">'+_escHtml(_trJourTxt(g.jour)+' \u00b7 '+_trAvecTxt(l))+'</span><span class="sdeq-s">'+g.parcs.length+'\u00a0parcelle'+(g.parcs.length>1?'s':'')+' \u00b7 '+_escHtml(window._mvHaT?window._mvHaT(ha):String(ha))+'\u00a0ha</span></span>'
      +(_trPeutCorriger(s,g.jour)?'<button type="button" class="mvbtn mvbtn-secondaire mvbtn-compact" data-sdeq="corriger" data-j="'+g.jour+'" data-tuto="trac.eq.corriger" aria-label="Corriger le co\u00e9quipier \u2014 '+_escAttr(_trJourTxt(g.jour))+'">Corriger</button>':'')+'</div>'
      +g.parcs.map(function(x){ return '<div class="sdeq-ln"><span class="sdeq-on">'+_escHtml(x.nom)+'</span><span class="sdeq-cr">'+_escHtml(_trValTxt(s,x))+(mx?_trAva(_trCoDe(s,x)):'')+'</span></div>'; }).join('')
      +(cc?'<span class="sdeq-trace">Co\u00e9quipier corrig\u00e9 par '+_escHtml(cc.coCorr.par||'?')+' \u2014 '+_escHtml(_trJourTxt(cc.coCorr.le||'').toLowerCase())+'</span>':'')+'</div>';
  }).join('');
}
// La feuille « Changer » / « Corriger », dans la fenêtre de la session.
var _sdEq={mode:'',sel:null,quand:'maint',coches:{},jour:''};
function _sdEqOpt(attr,n,on,sous,badge,dis){
  return '<button type="button" class="mvbtn mvbtn-option sdeq-opt'+(on?' on sel':'')+'" role="radio" aria-checked="'+on+'" '+attr+' data-k="'+_escAttr(attr+n)+'"'+(dis?' disabled':'')+'>'
    +(sous===null?_trAva(n):'')+'<span class="sdeq-ot"><span class="sdeq-on">'+_escHtml(n||'Personne')+'</span>'+(sous?'<span class="sdeq-os">'+_escHtml(sous)+'</span>':'')+'</span>'+(badge||'')+'</button>';
}
function _sdEqQui(s,cle){
  var h='<div class="sdeq-gt" id="sdeq-g-'+cle+'">'+(cle==='cq'?'Qui \u00e9tait l\u00e0\u00a0?':'Avec qui\u00a0?')+'</div><div class="sdeq-choix" role="radiogroup" aria-labelledby="sdeq-g-'+cle+'">';
  [''].concat(_trCoeqCandidats(s)).forEach(function(n){
    var b=n?'':(s.conducteur||'')+(cle==='cq'?' \u00e9tait seul':' continue seul');
    h+=_sdEqOpt('data-sdeq="'+cle+'" data-n="'+_escAttr(n)+'" '+(cle==='cq'?'data-tuto="trac.eq.cq"':'data-tuto="trac.eq.q"'),n,_sdEq.sel===n,n?null:b,(cle==='q'&&n===String(s.coequipier||''))?_mvBadge('en ce moment','neutre'):'');
  });
  return h+'</div>';
}
function _sdEqPied(ok,lab,act){ return '<div class="sdeq-pied"><button type="button" class="mvbtn mvbtn-principal mvbtn-terrain" data-sdeq="'+act+'" data-k="ok" data-tuto="trac.eq.ok"'+(ok?'':' disabled')+'>'+_escHtml(lab)+'</button><button type="button" class="mvbtn mvbtn-discret" data-sdeq="fermer">Annuler</button></div>'; }
function _sdEqChangerHtml(s){
  var a=_trAuj(), pf=(s.parcellesFaites||[]).filter(function(x){ return x&&typeof x==='object'; }), da=pf.filter(function(x){ return _trJourDe(s,x)===a; }), act=String(s.coequipier||''), c=_sdEq, n=pf.length;
  var h='<div class="sdeq-poignee"></div><div class="sdeq-ft" id="sd-eq-t">Changer de co\u00e9quipier</div><div class="sdeq-fs">'+_escHtml((s.activite||'')+' \u00b7 conducteur\u00a0: '+(s.conducteur||''))+'</div>'+_sdEqQui(s,'q');
  h+='<div class="sdeq-gt" id="sdeq-g-w">\u00c0 partir de quand\u00a0?</div><div class="sdeq-choix" role="radiogroup" aria-labelledby="sdeq-g-w">'
    +_sdEqOpt('data-sdeq="quand" data-q="maint"','Maintenant',c.quand==='maint',n?('Les '+n+'\u00a0parcelle'+(n>1?'s d\u00e9j\u00e0 faites gardent':' d\u00e9j\u00e0 faite garde')+' leur co\u00e9quipier.'):'Rien n\u2019est encore coch\u00e9.')
    +_sdEqOpt('data-sdeq="quand" data-q="matin"','Depuis ce matin',c.quand==='matin',da.length?(_trEtListe(da.map(function(x){ return x.nom; }))+(da.length>1?' passent':' passe')+' aussi \u00e0 '+(c.sel||'personne')+'.'):'Aucune parcelle faite aujourd\u2019hui.','',!da.length)+'</div>';
  if(typeof isAdmin==='function'&&isAdmin()&&n) h+='<button type="button" class="mvbtn mvbtn-discret sdeq-lien" data-sdeq="autres" data-k="autres">Corriger d\u2019autres parcelles\u2026</button>';
  var ok=c.sel!==act||(c.quand==='matin'&&da.some(function(x){ return _trCoDe(s,x)!==c.sel; }));
  return h+_sdEqPied(ok,ok?((c.sel||'Sans co\u00e9quipier')+', '+(c.quand==='matin'?'depuis ce matin':'\u00e0 partir de maintenant')):'Choisissez une autre personne','ok-ch');
}
function _sdEqCorrigerHtml(s){
  var c=_sdEq, J=_trJoursDe(s).filter(function(g){ return _trPeutCorriger(s,g.jour); }).sort(function(x,y){ return (y.jour===c.jour)-(x.jour===c.jour); });
  var h='<div class="sdeq-poignee"></div><div class="sdeq-ft" id="sd-eq-t">Corriger le co\u00e9quipier</div><div class="sdeq-fs">'+_escHtml(s.activite||'')+' \u00b7 les parcelles d\u00e9j\u00e0 faites</div>'+_sdEqQui(s,'cq')+'<div class="sdeq-gt">Sur quelles parcelles\u00a0?</div>';
  J.forEach(function(g){
    var k=g.parcs.filter(function(x){ return c.coches[x.nom]; }).length, e=k===0?'false':(k===g.parcs.length?'true':'mixed');
    h+='<button type="button" class="sdeq-ckj" role="checkbox" aria-checked="'+e+'" data-sdeq="cj" data-j="'+g.jour+'" data-k="j'+g.jour+'"><span class="sdeq-cb"></span>'+_escHtml(_trJourTxt(g.jour)+' \u00b7 '+_trAvecTxt(_trEqDuJour(s,g.parcs)))+'</button>'
      +g.parcs.map(function(x){ var on=!!c.coches[x.nom]; return '<button type="button" class="sdeq-ckl" role="checkbox" aria-checked="'+on+'" data-sdeq="cp" data-n="'+_escAttr(x.nom)+'" data-k="'+_escAttr('p'+x.nom)+'"><span class="sdeq-cb"></span><span class="sdeq-on">'+_escHtml(x.nom)+'</span><span class="sdeq-cr">'+_escHtml(_trValTxt(s,x))+_trAva(_trCoDe(s,x))+'</span></button>'; }).join('');
  });
  if(!(typeof isAdmin==='function'&&isAdmin())) h+='<div class="sdeq-note">Les autres jours, c\u2019est l\u2019administrateur.</div>';
  var ch=(s.parcellesFaites||[]).filter(function(x){ return x&&typeof x==='object'&&c.coches[x.nom]; }), ok=c.sel!==null&&ch.some(function(x){ return _trCoDe(s,x)!==c.sel; });
  h+='<div class="sdeq-note">La correction compte aussit\u00f4t dans les jalons, et elle est sign\u00e9e.</div>';
  return h+_sdEqPied(ok,c.sel===null?'Choisissez qui \u00e9tait l\u00e0':(!ch.length?'Choisissez les parcelles':(!ok?'Rien ne change':((c.sel||'Sans co\u00e9quipier')+' sur '+ch.length+'\u00a0parcelle'+(ch.length>1?'s':'')))),'ok-co');
}
function _sdEqRendre(ouvrir){
  var ov=document.getElementById('sd-eq-overlay'), sh=document.getElementById('sd-eq-sheet'), s=_trSessCour(); if(!ov||!sh||!s) return;
  var ae=document.activeElement, k=(!ouvrir&&ae&&ae.getAttribute)?ae.getAttribute('data-k'):'', sc=sh.scrollTop;
  sh.innerHTML=_sdEq.mode==='corriger'?_sdEqCorrigerHtml(s):_sdEqChangerHtml(s);
  ov.hidden=false; sh.scrollTop=ouvrir?0:sc;
  var f=null; if(k) f=Array.prototype.find.call(sh.querySelectorAll('[data-k]'),function(b){ return b.getAttribute('data-k')===k; });
  if(!f&&ouvrir) f=sh.querySelector('[aria-checked="true"],button:not([disabled])');
  if(f) try{ f.focus({preventScroll:true}); }catch(e){ if(window._mvAvale) window._mvAvale(e,'tracteur.js/_sdEqRendre'); }
}
function openSdEqChanger(){ var s=_trSessCour(); if(!_trPeutChanger(s)) return; _sdEq={mode:'changer',sel:String(s.coequipier||''),quand:'maint',coches:{},jour:''}; _sdEqRendre(true); }
function openSdEqCorriger(j){ var s=_trSessCour(); if(!s) return; _sdEq={mode:'corriger',sel:null,quand:'maint',coches:{},jour:j||''}; if(j) _trJoursDe(s).forEach(function(g){ if(g.jour===j&&_trPeutCorriger(s,j)) g.parcs.forEach(function(x){ _sdEq.coches[x.nom]=true; }); }); _sdEqRendre(true); }
function closeSdEq(){ var ov=document.getElementById('sd-eq-overlay'); if(ov&&!ov.hidden){ ov.hidden=true; var b=document.querySelector('#sd-eq-encart [data-sdeq="changer"]'); if(b) try{ b.focus({preventScroll:true}); }catch(e){ if(window._mvAvale) window._mvAvale(e,'tracteur.js/closeSdEq'); } } _sdEq.mode=''; }
function _sdEqApres(s,msg,annuler){
  closeSdEq(); _P().saveData('sessions'); renderSDEqEncart(); _P().renderSDParcelles(); if(_P().renderTracteur) _P().renderTracteur();
  if(typeof window.showToastAnnuler==='function') window.showToastAnnuler(msg,annuler); else showToast(msg,'#3D6B27');
}
function saveSdEqChanger(){
  var s=_trSessCour(); if(!_trPeutChanger(s)) return;
  var c=_sdEq, a=_trAuj(), n=String(c.sel||''), anc=String(s.coequipier||''), dp0=s.coeqDepuis, now=new Date(), p=function(x){ return (x<10?'0':'')+x; };
  _P().sdNorm(s); var snap=_trCoSnap(s);
  _trFigerCo(s);   // ★ le passé garde le coéquipier d'avant
  if(n) s.coequipier=n; else delete s.coequipier;   // jamais `undefined` : Firestore le refuse
  if(c.quand==='matin'){ (s.parcellesFaites||[]).forEach(function(x){ if(x&&typeof x==='object'&&_trJourDe(s,x)===a) x.co=n; }); s.coeqDepuis={j:a,h:''}; }
  else s.coeqDepuis={j:a,h:p(now.getHours())+':'+p(now.getMinutes())};
  _P().chrTrace(s,'coeq','',{a:anc||'personne',b:n||'personne'});
  _sdEqApres(s,'Co\u00e9quipier\u00a0: '+(n||'personne')+', '+(c.quand==='matin'?'depuis ce matin':'\u00e0 partir de maintenant'),function(){
    _trCoRetour(s,snap); if(anc) s.coequipier=anc; else delete s.coequipier; if(dp0) s.coeqDepuis=dp0; else delete s.coeqDepuis;
    _P().saveData('sessions'); if(window.tracSessionId===s.id){ renderSDEqEncart(); _P().renderSDParcelles(); } if(_P().renderTracteur) _P().renderTracteur();
  });
}
function saveSdEqCorriger(){
  var s=_trSessCour(); if(!s) return;
  var c=_sdEq, n=String(c.sel==null?'':c.sel), par=(window.currentUser&&window.currentUser.nom)||'', noms=[];
  _P().sdNorm(s); var snap=_trCoSnap(s);
  (s.parcellesFaites||[]).forEach(function(x){
    if(!x||typeof x!=='object'||!c.coches[x.nom]||!_trPeutCorriger(s,_trJourDe(s,x))||_trCoDe(s,x)===n) return;
    x.co=n; x.coCorr={par:par,le:_trAuj()}; noms.push(x.nom);
  });
  if(!noms.length){ closeSdEq(); return; }
  _P().chrTrace(s,'coeqcorr',noms,{b:n||'personne'});
  _sdEqApres(s,'Co\u00e9quipier corrig\u00e9\u00a0: '+(n||'personne')+' sur '+noms.length+'\u00a0parcelle'+(noms.length>1?'s':''),function(){
    _trCoRetour(s,snap); _P().saveData('sessions'); if(window.tracSessionId===s.id){ renderSDEqEncart(); _P().renderSDParcelles(); } if(_P().renderTracteur) _P().renderTracteur();
  });
}
// Un seul écouteur pour tous ces boutons (le contenu se redessine) ; Échap ferme la feuille avant la fenêtre.
document.addEventListener('click',function(ev){
  var t=ev.target, b=t&&t.closest?t.closest('[data-sdeq]'):null;
  if(!b){ if(t&&t.id==='sd-eq-overlay') closeSdEq(); return; }
  var a=b.getAttribute('data-sdeq');
  if(b.disabled) return;
  if(a==='changer') return openSdEqChanger();
  if(a==='corriger') return openSdEqCorriger(b.getAttribute('data-j'));
  if(a==='fiche-corr'){ _P().openSessionDetail(b.getAttribute('data-sid')); return openSdEqCorriger(b.getAttribute('data-j')); }
  if(a==='autres'){ _sdEq.mode='corriger'; _sdEq.sel=null; _sdEq.coches={}; _sdEq.jour=''; return _sdEqRendre(true); }
  if(a==='fermer') return closeSdEq();
  if(a==='ouvrir') return _P().openSessionDetail(b.getAttribute('data-sid'));   // COEQ-3 (§524) : depuis la fiche du journal
  if(a==='q'||a==='cq'){ _sdEq.sel=b.getAttribute('data-n')||''; return _sdEqRendre(false); }
  if(a==='quand'){ _sdEq.quand=b.getAttribute('data-q'); return _sdEqRendre(false); }
  if(a==='cp'){ var nm=b.getAttribute('data-n'); if(_sdEq.coches[nm]) delete _sdEq.coches[nm]; else _sdEq.coches[nm]=true; return _sdEqRendre(false); }
  if(a==='cj'){ var s=_trSessCour(), j=b.getAttribute('data-j'), ps=[]; _trJoursDe(s).forEach(function(g){ if(g.jour===j) ps=g.parcs; }); var tous=ps.every(function(x){ return _sdEq.coches[x.nom]; }); ps.forEach(function(x){ if(tous) delete _sdEq.coches[x.nom]; else _sdEq.coches[x.nom]=true; }); return _sdEqRendre(false); }
  if(a==='ok-ch') return saveSdEqChanger();
  if(a==='ok-co') return saveSdEqCorriger();
});
document.addEventListener('keydown',function(ev){ var ov=document.getElementById('sd-eq-overlay'); if(ev.key==='Escape'&&ov&&!ov.hidden){ ev.stopPropagation(); ev.preventDefault(); closeSdEq(); } },true);

// ★★ COEQ-3 (§524) — LE TRACTEUR AU JOURNAL (D2, D3). Une ligne par session et par jour, LUE dans la session à l'affichage :
//   une correction s'y voit aussitôt, rien n'est recopié. Le traitement (D3) y passe en lecture. Les lignes d'amendement écrites
//   par FERTI-3 (`auTracteur`) restent dans la donnée (elles valident la tâche) ; le journal ne les montre plus : doublon.
var _trJRows={};
function _trSessDe(r){ return (window.SESSIONS||[]).find(function(s){ return s&&s.id===r.sid; })||{}; }
function _trParcHa(n){ var p=(window.PARCELLES||[]).find(function(x){ return x&&x.nom===n; }); return p?(parseFloat(p.surface)||0):0; }
function _trJournalLignes(f){
  f=f||{}; var P=_P(), out=[], qui=(f.qui&&f.qui!=='tous')?f.qui:'', pa=(f.parcelle&&f.parcelle!=='toutes')?f.parcelle:'', q=String(f.q||'').toLowerCase();
  (window.SESSIONS||[]).forEach(function(s){
    if(!s||(P.sessInSaison&&!P.sessInSaison(s))) return;
    var tr=s.type==='traitement';
    var G=tr?[{jour:String(s.date||'').slice(0,10),parcs:(s.parcelles||[]).map(function(n){ return {nom:String(n)}; })}]:_trJoursDe(s);
    G.forEach(function(g){
      var ps=g.parcs.filter(function(x){ return (!pa||x.nom===pa)&&(!qui||s.conducteur===qui||(!tr&&_trCoDe(s,x)===qui)); });
      var r={id:'trac:'+s.id+':'+g.jour,trac:true,trait:tr,sid:s.id,date:g.jour,tache:s.activite||(tr?'Traitement':''),cond:s.conducteur||'',parcs:ps,
             coeqs:tr?[]:_trEqDuJour(s,ps),produits:tr?(s.produits||[]):[],statut:'Valid\u00e9'};
      if(!ps.length||(f.tache&&f.tache!=='toutes'&&r.tache!==f.tache)||(f.deb&&r.date<f.deb)||(f.fin&&r.date>f.fin)) return;
      if(q&&[r.tache,r.cond].concat(r.coeqs,r.produits,ps.map(function(x){ return x.nom; })).join(' ').toLowerCase().indexOf(q)<0) return;
      out.push(r);
    });
  });
  _trJRows={}; out.forEach(function(r){ _trJRows[r.id]=r; });
  return out;
}
function _trJournalRow(id){ return _trJRows[id]||null; }
function _trEqTxt(r){ if(r.trait) return r.cond||'?'; var l=r.coeqs; return (r.cond||'?')+(l.length===1&&l[0]?' et '+l[0]:', '+_trAvecTxt(l)); }
function _trHaTxt(ps){ var h=ps.reduce(function(t,x){ return t+_trParcHa(x.nom); },0); return (window._mvHaT?window._mvHaT(h):String(h))+'\u00a0ha'; }
function _trJournalCarte(r,suite){
  var s=_trSessDe(r), mx=r.coeqs.length>1, noms=[r.cond].concat(r.coeqs.filter(Boolean));
  var sous=r.parcs.length+'\u00a0parcelle'+(r.parcs.length>1?'s':'')+' \u00b7 '+_trHaTxt(r.parcs)+(r.produits.length?' \u00b7 '+r.produits.join(', '):'');
  return '<div class="jitem" data-jid="'+_escAttr(r.id)+'" onclick="_jSel(this.dataset.jid)"><div class="jdotcol"><div class="jdot jdv"></div>'+(suite?'<div class="jlinev"></div>':'')+'</div>'
    +'<div class="jcard mv-c jtr"><div class="jcard-bar jtr-bar"></div><div class="jcard-col"><div class="jcard-inner"><div class="jtr-hd"><span class="jtr-t">'+_escHtml(r.tache)+'</span><span class="jtr-etq">'+(r.trait?'traitement':'au tracteur')+'</span></div>'
    +'<div class="jmeta"><span class="java-grp">'+noms.slice(0,3).map(function(n){ return _trAva(n); }).join('')+'</span><span class="jtr-qui">'+_escHtml(_trEqTxt(r))+'</span></div>'
    +'<details class="jtr-det"><summary onclick="event.stopPropagation()">'+_escHtml(sous)+'</summary>'
    +r.parcs.map(function(x){ return '<div class="jtr-pl"><span class="sdeq-on">'+_escHtml(x.nom)+'</span><span class="sdeq-cr">'+_escHtml(r.trait?'':_trValTxt(s,x))+(mx?_trAva(_trCoDe(s,x)):'')+'</span></div>'; }).join('')
    +'</details></div></div></div></div>';
}
function _trJournalFiche(r){
  var s=_trSessDe(r), ad=(typeof isAdmin==='function'&&isAdmin()), cc=r.parcs.filter(function(x){ return x.coCorr; })[0];
  var co=r.trait?'':_trEqDuJour(s,r.parcs).map(function(n){ var k=r.parcs.filter(function(x){ return _trCoDe(s,x)===n; }).length; return (n||'personne')+' \u2014 '+k+'\u00a0parcelle'+(k>1?'s':''); }).join(' \u00b7 ');
  return '<div class="jfx-d">'+_escHtml(_trJourTxt(r.date))+'</div><div class="jfx-t">'+_escHtml(r.tache+(r.trait?' \u00b7 traitement':' \u00b7 au tracteur'))+'</div>'
    +'<div class="jfx-s">'+_mvBadge(r.parcs.length+' parcelle'+(r.parcs.length>1?'s':''),'neutre')+'<span>'+_escHtml(_trHaTxt(r.parcs))+'</span></div>'
    +'<dl class="jfx-dl"><dt>'+(r.trait?'Applicateur':'Conducteur')+'</dt><dd>'+_escHtml(r.cond||'?')+'</dd>'+(r.trait?'<dt>Produits</dt><dd>'+_escHtml(r.produits.join(', ')||'\u2014')+'</dd>':'<dt>Co\u00e9quipier</dt><dd>'+_escHtml(co||'personne')+'</dd>')+'</dl>'
    +'<div class="sdeq-tab-w"><table class="sdeq-tab"><thead><tr><th>Parcelle</th>'+(r.trait?'':'<th>Co\u00e9quipier</th>')+'<th class="r">Surface</th></tr></thead><tbody>'
    +r.parcs.map(function(x){ return '<tr><td>'+_escHtml(x.nom)+(r.trait?'':'<span class="sdeq-trace">'+_escHtml(_trValTxt(s,x))+'</span>')+'</td>'+(r.trait?'':'<td>'+_escHtml(_trCoDe(s,x)||'personne')+'</td>')+'<td class="r">'+_escHtml(_trHaTxt([x]))+'</td></tr>'; }).join('')+'</tbody></table></div>'
    +(cc?'<div class="sdeq-trace">Co\u00e9quipier corrig\u00e9 par '+_escHtml(cc.coCorr.par||'?')+' \u2014 '+_escHtml(_trJourTxt(cc.coCorr.le||'').toLowerCase())+'</div>':'')
    +(r.trait?'<div class="jfx-act"><span class="sdeq-note">Le d\u00e9tail l\u00e9gal est au registre, dans Phyto.</span></div>'
      :'<div class="jfx-act">'+(ad?'<button type="button" class="mvbtn mvbtn-secondaire mvbtn-bureau" data-sdeq="fiche-corr" data-sid="'+_escAttr(r.sid)+'" data-j="'+r.date+'">\u00c9quipe</button>':'')+'<button type="button" class="mvbtn mvbtn-secondaire mvbtn-bureau" data-sdeq="ouvrir" data-sid="'+_escAttr(r.sid)+'">Ouvrir la session</button></div>');
}
// Les passages du tracteur sur UNE parcelle (fiche de la parcelle, « Derniers passages »).
function _trPassagesParc(nom){
  var out=[];
  (window.SESSIONS||[]).forEach(function(s){
    if(!s) return;
    if(s.type==='traitement'){ if((s.parcelles||[]).indexOf(nom)>=0) out.push({date:String(s.date||'').slice(0,10),tache:'Traitement',qui:s.conducteur||'',statut:'traitement',trac:true}); return; }
    (s.parcellesFaites||[]).forEach(function(x){ if(x&&typeof x==='object'&&x.nom===nom){ var c=_trCoDe(s,x); out.push({date:_trJourDe(s,x),tache:s.activite||'',qui:(s.conducteur||'')+(c?' et '+c:''),statut:'au tracteur',trac:true}); } });
  });
  return out;
}

if(typeof window!=='undefined') Object.assign(window,{ _trJournalLignes:_trJournalLignes, _trJournalRow:_trJournalRow, _trJournalCarte:_trJournalCarte, _trJournalFiche:_trJournalFiche, _trPassagesParc:_trPassagesParc,
  _trCoDe:_trCoDe, _trCoeqNoms:_trCoeqNoms, _trJourDe:_trJourDe, _trSessADeux:_trSessADeux,
  _trStampCo:_trStampCo, _trJoursDe:_trJoursDe, _trEqDuJour:_trEqDuJour, _trAvecTxt:_trAvecTxt, _trJourTxt:_trJourTxt,
  renderSDEqEncart:renderSDEqEncart, _sdRenderFaites:_sdRenderFaites, openSdEqChanger:openSdEqChanger, openSdEqCorriger:openSdEqCorriger,
  closeSdEq:closeSdEq, saveSdEqChanger:saveSdEqChanger, saveSdEqCorriger:saveSdEqCorriger });
if(DEBUG) console.log('[coequipier] chargé');
