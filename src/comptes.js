/* ═══════════════════════════════════════════════════════════════════════════
   COMPTE-1 (§353) — LES PIEDS MARQUÉS : LE COMPTE DU REPÉRAGE CHIFFRE L'ENTREPLANTATION
   ───────────────────────────────────────────────────────────────────────────
   Nico (16/10) : « beaucoup de domaines marquent leurs trous avant de les faire à la
   tarière ; il faudrait pouvoir marquer l'info des comptes dans l'appli ». Avant ce lot,
   les trous n'entraient qu'APRÈS coup — séance Tarière (une fois percés) ou validation de
   l'entreplantation (une fois plantés) : jusque-là l'entreplantation pesait 0 h.
   Maquette validée le 16/10 (« go »). Qui saisit le compte : LES DEUX (choix de Nico) —
     · celui qui marque, en validant une tâche réglée « Demander le nombre de pieds
       marqués » (t.demandeCompte, le crayon de la tâche dans la roue crantée) ;
     · l'admin, sur la feuille de toutes les parcelles (« Saisir les comptes »).
   Données, sur la PARCELLE (comme plantation_trous) :
     p.trous_marques (entier, 0 = aucun pied à remplacer) · p.trous_marques_par ·
     p.trous_marques_le · p.trous_marques_corr (l'admin a corrigé un compte existant).
   Règles (validées sur la maquette) :
     · 1 pied marqué = 1 trou à percer = 1 pied à planter ;
     · trous prévus = le PLUS GRAND des deux : pieds marqués, trous de la parcelle
       (percés à la tarière, ou tapés à la validation) — une tarière à moitié passée ne
       fait pas baisser la charge ;
     · un compte à 0 (et aucun trou) sort la parcelle de l'entreplantation.
   ⚠️ Le bloc exécutable ci-dessous n'a AUCUNE dépendance : le harnais
     (scripts/mv-harnais-compte1.mjs) l'exécute tel quel.
   ═══════════════════════════════════════════════════════════════════════════ */
import { showToast, isAdmin, canWrite, _mvIcon } from './utils.js';

// ── COMPTE-1 : début du bloc exécutable
function _cptN(v){ if(v===null||v===undefined||v==='') return null; var n=parseInt(v,10); return (isNaN(n)||n<0)?null:n; }
function _cptMarques(p){ return p?_cptN(p.trous_marques):null; }
function _cptPerces(p){ return (p&&p.plantation_trous_src==='tariere')?(_cptN(p.plantation_trous)||0):0; }
// Trous prévus : le plus grand des deux — pieds marqués, trous de la parcelle.
function _cptPrevus(p){ return Math.max(_cptMarques(p)||0, (p?_cptN(p.plantation_trous):0)||0); }
// Une tâche « simple » réglée pour demander le compte. Jamais une tâche à trous, à niveaux ou à passages.
function _cptDemande(t){ return !!(t&&t.demandeCompte&&!t.trous&&t.type!=='niveaux'&&t.type!=='passages'); }
function _cptPiloteTrous(t){ return !!(t&&(t.trous||t.nom==='Entreplantation')); }
// Compté à zéro, sans aucun trou : rien à planter — la parcelle sort de l'entreplantation.
function _cptRienAPlanter(p){ return _cptMarques(p)===0 && !(((p?_cptN(p.plantation_trous):0)||0)>0); }
// La chaîne d'une parcelle : marqués → percés → plantés (plantés = la dernière validation du journal qui dit combien).
function _cptChaine(p, journal, tache){
  var nom=tache||'Entreplantation', pl=null, valide=false;
  var j=(journal||[]).find(function(e){ return e&&p&&e.parcelle===p.nom&&e.tache===nom&&e.statut==='Validé'; });
  if(j){ valide=true; pl=_cptN(j.plantation_trous); }
  return { marques:_cptMarques(p), perces:_cptPerces(p), plantes:pl, valide:valide, prevus:_cptPrevus(p) };
}
// Le résumé de la roue crantée et de la barre : pieds marqués, parcelles comptées, parcelles en place.
function _cptResume(parcelles){
  var actives=(parcelles||[]).filter(function(p){ return p&&p.statut!=='Arrachee'; });
  var c=actives.filter(function(p){ return _cptMarques(p)!==null; });
  return { pieds:c.reduce(function(s,p){ return s+_cptMarques(p); },0), comptees:c.length, total:actives.length,
           prevus:actives.reduce(function(s,p){ return s+_cptPrevus(p); },0) };
}
// Pose le compte d'une parcelle et rend ce qu'il remplace (pour « Annuler »). n === null efface.
function _cptPoser(p, n, qui, date, corr){
  var m=_cptMarques(p);
  var avant=(m===null)?null:{ n:m, par:p.trous_marques_par||'', le:p.trous_marques_le||'', corr:!!p.trous_marques_corr };
  if(n===null){ delete p.trous_marques; delete p.trous_marques_par; delete p.trous_marques_le; delete p.trous_marques_corr; }
  else { p.trous_marques=n; p.trous_marques_par=qui||''; p.trous_marques_le=date||''; if(corr) p.trous_marques_corr=true; else delete p.trous_marques_corr; }
  return avant;
}
function _cptRemettre(p, avant){
  if(!avant){ delete p.trous_marques; delete p.trous_marques_par; delete p.trous_marques_le; delete p.trous_marques_corr; return; }
  p.trous_marques=avant.n; p.trous_marques_par=avant.par||''; p.trous_marques_le=avant.le||'';
  if(avant.corr) p.trous_marques_corr=true; else delete p.trous_marques_corr;
}
// Le pavé : une touche transforme la saisie. « frais » = valeur préremplie, remplacée au premier chiffre tapé.
function _cptPas(etat, k, d){
  var v=etat.val, frais=etat.frais;
  if(k==='d'){ if(frais){ v=''; frais=false; } if(v==='0') v=''; if(v.length<4) v+=String(d); }
  else if(k==='retour'){ frais=false; v=v.slice(0,-1); }
  else if(k==='vider'){ frais=false; v=''; }
  else if(k==='plus'){ frais=false; v=String(Math.min(9999,(parseInt(v,10)||0)+1)); }
  else if(k==='moins'){ frais=false; v=String(Math.max(0,(parseInt(v,10)||0)-1)); }
  else if(k==='zero'){ frais=false; v='0'; }
  return { val:v, frais:frais };
}
// ── COMPTE-1 : fin du bloc exécutable

var _NB='\u00a0';
function _e(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function _fN(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,_NB); }
function _pl(n, s, p){ return _fN(n)+_NB+(n>1?(p||s+'s'):s); }
function _auj(){ return (typeof window._mvToday==='function')?window._mvToday():new Date().toISOString().slice(0,10); }
function _qui(){ return (window.currentUser&&window.currentUser.nom)||''; }
function _tDef(nom){ return (window.TACHES||[]).find(function(x){ return x&&x.nom===nom; })||null; }
function _parc(nom){ return (window.PARCELLES||[]).find(function(x){ return x&&x.nom===nom; })||null; }
function _dateCourte(iso){
  var M=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  var a=String(iso||'').split('-').map(Number); if(a.length<3||!a[1]) return '';
  return (a[2]===1?'1er':a[2])+_NB+M[a[1]-1];
}
// « Compté par Lucas, 12 oct. » — ou « Corrigé par … ».
function _cptSource(p){
  var m=_cptMarques(p); if(m===null) return 'Pas encore compté';
  var d=_dateCourte(p.trous_marques_le);
  return (p.trous_marques_corr?'Corrigé par ':'Compté par ')+(p.trous_marques_par||'?')+(d?', '+d:'');
}
function _cptPiedsTxt(n){ return n?_pl(n,'pied marqué','pieds marqués'):'aucun pied à remplacer'; }
// Hors entreplantation : une tâche pilotée par les trous, sur une parcelle comptée à zéro et sans trou.
function _cptHors(p, nomTache){
  if(!p) return false;
  if(!_cptPiloteTrous(_tDef(nomTache)||{nom:nomTache})) return false;
  return _cptRienAPlanter(p);
}

/* ══════════════════════════════════════════════════════════════════════════
   LE PAVÉ — une feuille, trois usages : « rep » (le repérage, compte demandé),
   « ent » (l'entreplantation d'une parcelle sans compte), « adm » (l'admin corrige).
   ══════════════════════════════════════════════════════════════════════════ */
var _CPT=null;
var _CPT_MODES={
  rep:{ q:'Combien de pieds as-tu marqués\u00a0?', u:['pied marqué','pieds marqués'], nm:['pied','pieds'], ok:'Valider', zero:true },
  ent:{ q:'Combien de pieds as-tu plantés\u00a0?', u:['pied planté','pieds plantés'], nm:['pied','pieds'], ok:'Valider', zero:false },
  adm:{ q:'Combien de pieds sont marqués\u00a0?', u:['pied marqué','pieds marqués'], nm:['pied','pieds'], ok:'Enregistrer', zero:true }
};
function _cptOuvrir(o){
  var p=o&&o.p; if(!p) return;
  var M=_CPT_MODES[o.mode]; if(!M) return;
  var init='', hint='';
  if(o.mode==='rep'){
    var m0=_cptMarques(p); init=(m0===null)?'':String(m0);
    hint='Ce nombre prépare l’entreplantation : les trous à percer, puis les pieds à planter.';
  } else if(o.mode==='ent'){
    hint='Cette parcelle n’a pas été comptée au repérage. Le nombre sert au temps passé.';
  } else {
    var m1=_cptMarques(p); init=(m1===null)?'':String(m1);
    hint=(m1===null?'':_cptSource(p)+'. ')+'Ton chiffre remplace celui de l’équipe. L’appli garde qui l’a saisi.';
  }
  _CPT={ mode:o.mode, nom:p.nom, tache:o.tache||'', suite:(typeof o.suite==='function')?o.suite:null, val:init, frais:init!=='' };
  var set=function(id, txt){ var el=document.getElementById(id); if(el) el.textContent=txt; };
  set('cpt-titre', p.nom);
  set('cpt-sub', (o.mode==='adm'?'Le compte du repérage':(o.tache||''))+' · '+String(parseFloat(p.surface)||0).replace('.',',')+_NB+'ha');
  set('cpt-q', M.q);
  set('cpt-hint', hint);
  var zw=document.getElementById('cpt-zero-w'); if(zw) zw.hidden=!M.zero;
  _cptMaj();
  if(typeof window.openOv==='function') window.openOv('ovCompte');
}
function _cptMaj(){
  if(!_CPT) return;
  var M=_CPT_MODES[_CPT.mode], vide=_CPT.val==='', n=vide?0:parseInt(_CPT.val,10);
  var d=document.getElementById('cpt-disp'), u=document.getElementById('cpt-u'), ok=document.getElementById('cpt-ok'), z=document.getElementById('cpt-zero');
  if(d){ d.textContent=vide?'\u2014':_fN(n); d.classList.toggle('vide',vide); d.classList.toggle('frais',_CPT.frais&&!vide); }
  if(u) u.textContent=vide?'Tape le nombre':((n>1?M.u[1]:M.u[0])+(_CPT.frais?' · tape pour remplacer':''));
  if(ok){ ok.disabled=vide; ok.innerHTML=_mvIcon('check',16)+' '+M.ok+(vide?'':' · '+(n===0?'aucun '+M.nm[0]:_pl(n,M.nm[0],M.nm[1]))); }
  if(z) z.setAttribute('aria-pressed', String(!vide&&n===0));
}
function _cptTouche(k, d){
  if(!_CPT) return;
  var r=_cptPas({val:_CPT.val, frais:_CPT.frais}, k, d);
  _CPT.val=r.val; _CPT.frais=r.frais; _cptMaj();
}
function _cptOk(){
  if(!_CPT||_CPT.val==='') return;
  var c=_CPT, n=parseInt(c.val,10); _CPT=null;
  if(typeof window.closeOv==='function') window.closeOv(null,'ovCompte');
  if(c.mode==='adm'){ _cptCorriger(c.nom, n); return; }
  if(c.suite) c.suite(n);
}
// Le clavier d'un ordinateur sur le pavé : chiffres, retour arrière, Entrée.
document.addEventListener('keydown', function(e){
  if(!_CPT) return;
  var ov=document.getElementById('ovCompte'); if(!ov||!ov.classList.contains('open')) return;
  var t=e.target; if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA')) return;
  if(/^[0-9]$/.test(e.key)){ e.preventDefault(); _cptTouche('d',e.key); }
  else if(e.key==='Backspace'){ e.preventDefault(); _cptTouche('retour'); }
  else if(e.key==='Enter'&&!(t&&t.tagName==='BUTTON')){ e.preventDefault(); _cptOk(); }
});

/* ══════════════════════════════════════════════════════════════════════════
   LA VALIDATION — appelé par pQuickValidate (cartes, carte du domaine) et
   confirmValidation (feuille de la fiche).
   ══════════════════════════════════════════════════════════════════════════ */
// Avant de valider : faut-il le pavé ? Rend true s'il est ouvert (la validation reprendra par `suite(n)`).
function _cptAvantValider(p, task, suite){
  var t=_tDef(task);
  if(_cptDemande(t)){ _cptOuvrir({ mode:'rep', p:p, tache:task, suite:suite }); return true; }
  if(_cptPiloteTrous(t||{nom:task})&&!(_cptPrevus(p)>0)){ _cptOuvrir({ mode:'ent', p:p, tache:task, suite:suite }); return true; }
  return false;
}
// Au moment d'écrire l'entrée du journal. n = le nombre du pavé, ou null (validation d'un seul appui).
function _cptAuValider(p, task, jEntry, n){
  var t=_tDef(task);
  if(_cptDemande(t)){
    if(n===null||n===undefined) return;
    jEntry.trous_marques=n;
    jEntry.trous_marques_avant=_cptPoser(p, n, _qui(), jEntry.date||_auj(), false);
    return;
  }
  if(!_cptPiloteTrous(t||{nom:task})) return;
  if(n!==null&&n!==undefined){
    // Les pieds plantés, tapés : ils deviennent les trous de la parcelle, comme dans la feuille de la fiche.
    jEntry.plantation_trous_avant={ v:(p.plantation_trous==null?null:p.plantation_trous), src:p.plantation_trous_src||null };
    p.plantation_trous=n; delete p.plantation_trous_src;
    jEntry.plantation_trous=n;
  } else if(jEntry.plantation_trous==null){
    var pv=_cptPrevus(p); if(pv>0) jEntry.plantation_trous=pv;   // le temps réalisé se lit au journal (Pilotage)
  }
}
// « Annuler » d'une validation : remet le compte et les trous d'avant.
function _cptDefaire(p, je){
  if(!p||!je) return;
  if(Object.prototype.hasOwnProperty.call(je,'trous_marques')) _cptRemettre(p, je.trous_marques_avant||null);
  if(je.plantation_trous_avant){
    var a=je.plantation_trous_avant;
    if(a.v==null) delete p.plantation_trous; else p.plantation_trous=a.v;
    if(a.src) p.plantation_trous_src=a.src; else delete p.plantation_trous_src;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   L'ADMIN CORRIGE UNE PARCELLE (fiche) — et LA FEUILLE DES COMPTES (toutes)
   ══════════════════════════════════════════════════════════════════════════ */
function _cptRafraichir(nomFiche){
  try{ if(typeof window.renderParcelles==='function') window.renderParcelles(); if(typeof window.computePStats==='function') window.computePStats(); }
  catch(e){ if(window._mvAvale) window._mvAvale(e,'comptes.js/_cptRafraichir#liste'); }
  try{
    var dp=document.getElementById('ovParcelle');
    if(nomFiche&&dp&&dp.classList.contains('open')&&typeof window.openDP==='function') window.openDP(nomFiche);
  }catch(e){ if(window._mvAvale) window._mvAvale(e,'comptes.js/_cptRafraichir#fiche'); }
  try{ var pr=document.querySelector('.page.active'); if(pr&&pr.id==='page-reglages'&&typeof window.renderReglages==='function') window.renderReglages(); }
  catch(e){ if(window._mvAvale) window._mvAvale(e,'comptes.js/_cptRafraichir#reglages'); }
  // ★ MANQUE-1 (§357) : la feuille s'ouvre aussi depuis « Ce qu'il manque » du Pilotage ; sans ce rendu, « N choses à
  //   compléter » gardait l'entreplantation jusqu'au prochain passage par le module.
  try{ var pp=document.querySelector('.page.active'); if(pp&&pp.id==='page-pilotage'&&typeof window.renderPilotage==='function') window.renderPilotage(); }
  catch(e){ if(window._mvAvale) window._mvAvale(e,'comptes.js/_cptRafraichir#pilotage'); }
}
function _cptCorriger(nom, n){
  if(!isAdmin()||!canWrite()){ showToast('Réservé à l’administrateur','#B85A1A'); return; }
  var p=_parc(nom); if(!p) return;
  var avant=_cptPoser(p, n, _qui(), _auj(), _cptMarques(p)!==null);
  if(typeof window.saveData==='function') window.saveData('parcelles');
  _cptRafraichir(nom);
  showToast('Compte enregistré · '+nom+' · '+_cptPiedsTxt(n),'#3D6B27');
  return avant;
}
function _cptCorrigerOuvrir(nom){
  if(!isAdmin()) return;
  var p=_parc(nom); if(p) _cptOuvrir({ mode:'adm', p:p });
}

var _CPTS=null;   // brouillon de la feuille : { nom: 'valeur' }
function _cptsActives(){ return (window.PARCELLES||[]).filter(function(p){ return p&&p.statut!=='Arrachee'; }); }
function openComptes(){
  if(!isAdmin()){ showToast('Réservé à l’administrateur','#B85A1A'); return; }
  _CPTS={};
  _cptsActives().forEach(function(p){ var m=_cptMarques(p); _CPTS[p.nom]=(m===null)?'':String(m); });
  var q=document.getElementById('cpts-q'); if(q) q.value='';
  var rows=document.getElementById('cpts-rows');
  if(rows) rows.innerHTML=_cptsActives().map(function(p, i){
    var n=_e(p.nom), cep=p.cepage||p.cep||'';
    return '<div class="cpts-row" data-i="'+i+'" data-q="'+_e(String(p.nom).toLowerCase())+'">'
      +'<div class="cpts-tx"><b>'+n+'</b><span class="cpts-meta">'+String(parseFloat(p.surface)||0).replace('.',',')+_NB+'ha'+(cep?' · '+_e(cep):'')+'</span>'
      +'<span class="cpts-st" id="cpts-st-'+i+'"></span></div>'
      +'<div class="cpts-pas"><button type="button" onclick="_cptsPas('+i+',-1)" aria-label="Un de moins, '+n+'">'+_mvIcon('moins',16)+'</button>'
      +'<input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" id="cpts-in-'+i+'" value="'+_e(_CPTS[p.nom])+'" placeholder="\u2014" oninput="_cptsSaisie('+i+',this)" aria-label="Pieds marqués, '+n+'">'
      +'<button type="button" onclick="_cptsPas('+i+',1)" aria-label="Un de plus, '+n+'">'+_mvIcon('ajout',16)+'</button></div></div>';
  }).join('');
  var vide=document.getElementById('cpts-vide'); if(vide) vide.hidden=true;
  _cptsMaj();
  if(typeof window.openOv==='function') window.openOv('ovComptes');
}
function _cptsOrig(p){ var m=_cptMarques(p); return (m===null)?'':String(m); }
function _cptsMaj(){
  if(!_CPTS) return;
  var ps=_cptsActives(), pieds=0, compt=0, mods=0, prev=0;
  ps.forEach(function(p, i){
    var v=_CPTS[p.nom], mod=(v!==_cptsOrig(p));
    if(v!==''){ pieds+=parseInt(v,10)||0; compt++; }
    if(mod) mods++;
    prev+=Math.max(v===''?0:(parseInt(v,10)||0), _cptN(p.plantation_trous)||0);
    var row=document.querySelector('.cpts-row[data-i="'+i+'"]'); if(row) row.classList.toggle('mod',mod);
    var st=document.getElementById('cpts-st-'+i);
    if(st) st.innerHTML=(mod?'<span class="cpts-b acc">modifié</span>'
      :(_cptMarques(p)!==null?'<span class="cpts-b ok">'+_e(_cptSource(p))+'</span>':'<span class="cpts-b att">Pas encore compté</span>'))
      +(_cptPerces(p)?'<span class="cpts-b">'+_pl(_cptPerces(p),'trou percé','trous percés')+'</span>':'');
  });
  var min=(typeof window._plantMinTrou==='function')?window._plantMinTrou():3, tm=Math.round(prev*min), h=Math.floor(tm/60), mm=tm-h*60;
  var k=document.getElementById('cpts-kpis');
  if(k) k.innerHTML='<div class="cpt-kpi"><b>'+_fN(pieds)+'</b><span>pieds marqués</span></div>'
    +'<div class="cpt-kpi"><b>'+compt+_NB+'sur'+_NB+ps.length+'</b><span>parcelles comptées</span></div>'
    +'<div class="cpt-kpi"><b>'+(h?h+_NB+'h'+(mm?_NB+String(mm).padStart(2,'0'):''):mm+_NB+'min')+'</b><span>à prévoir pour planter</span></div>';
  var ok=document.getElementById('cpts-ok');
  if(ok){ ok.disabled=!mods; ok.innerHTML=_mvIcon('check',16)+' '+(mods?'Enregistrer · '+_pl(mods,'parcelle'):'Enregistrer'); }
}
function _cptsSaisie(i, el){
  if(!_CPTS||!el) return;
  var p=_cptsActives()[i]; if(!p) return;
  var v=String(el.value||'').replace(/\D/g,'').slice(0,4); if(v.length>1) v=String(parseInt(v,10));
  if(el.value!==v) el.value=v;
  _CPTS[p.nom]=v; _cptsMaj();
}
function _cptsPas(i, dlt){
  if(!_CPTS) return;
  var p=_cptsActives()[i]; if(!p) return;
  var cur=_CPTS[p.nom]; if(cur===''&&dlt<0) return;
  _CPTS[p.nom]=String(Math.max(0,Math.min(9999,(parseInt(cur,10)||0)+dlt)));
  var el=document.getElementById('cpts-in-'+i); if(el) el.value=_CPTS[p.nom];
  _cptsMaj();
}
function _cptsFiltre(){
  var q=String((document.getElementById('cpts-q')||{}).value||'').trim().toLowerCase(), vus=0;
  document.querySelectorAll('.cpts-row').forEach(function(r){ var ok=!q||r.getAttribute('data-q').indexOf(q)>=0; r.hidden=!ok; if(ok) vus++; });
  var vide=document.getElementById('cpts-vide'); if(vide) vide.hidden=vus>0;
}
function _cptsEnregistrer(){
  if(!_CPTS||!isAdmin()||!canWrite()) return;
  var n=0, qui=_qui(), d=_auj();
  _cptsActives().forEach(function(p){
    var v=_CPTS[p.nom]; if(v===_cptsOrig(p)) return;
    n++; _cptPoser(p, v===''?null:parseInt(v,10), qui, d, _cptMarques(p)!==null);
  });
  _CPTS=null;
  if(typeof window.closeOv==='function') window.closeOv(null,'ovComptes');
  if(!n) return;
  if(typeof window.saveData==='function') window.saveData('parcelles');
  _cptRafraichir(null);
  showToast('Comptes enregistrés · '+_pl(n,'parcelle'),'#3D6B27');
}

/* ══════════════════════════════════════════════════════════════════════════
   CE QUE LES AUTRES ÉCRANS AFFICHENT
   ══════════════════════════════════════════════════════════════════════════ */
// Roue crantée de la Vigne › Tâches : la ligne sous l'entreplantation.
function _cptLigneReglages(){
  if(!isAdmin()) return '';
  var r=_cptResume(window.PARCELLES);
  return '<div class="tcv-lnk" onclick="event.stopPropagation();window.openComptes()" style="color:var(--vert-med)">'
    +'Pieds marqués\u00a0: '+r.comptees+' parcelle'+(r.comptees>1?'s':'')+' comptée'+(r.comptees>1?'s':'')+' sur '+r.total
    +(r.pieds?' · '+_fN(r.pieds)+_NB+'pieds':'')+' \u2014 Saisir les comptes</div>';
}
// Fiche parcelle : le texte sous le nom de la tâche (heures comprises), et le lien de l'admin.
function _cptFicheTexte(p, t, hEstim){
  if(_cptPiloteTrous(t)){
    var c=_cptChaine(p, window.JOURNAL, t&&t.nom), bouts=[];
    if(_cptRienAPlanter(p)) return 'Aucun pied à remplacer';
    if(c.marques!==null) bouts.push(_fN(c.marques)+' marqués');
    if(c.perces) bouts.push(_fN(c.perces)+' percés');
    if(c.plantes!==null) bouts.push(_fN(c.plantes)+' plantés');
    if(!bouts.length) return 'Pas encore compté';
    return bouts.join(' · ')+(c.prevus>0&&!c.valide?' · ~'+hEstim+'h':'');
  }
  return '';
}
// Fiche : pour une tâche qui demande le compte, le compte lui-même (texte brut, l'appelant échappe).
function _cptFicheCompte(p, t){
  if(!_cptDemande(t)) return '';
  var m=_cptMarques(p); return (m===null)?'compte à donner en validant':_cptPiedsTxt(m);
}
// Fiche : l'admin peut-il corriger le compte d'ici ? (entreplantation, ou tâche qui demande le compte)
function _cptFicheAdmin(p, t){ return !!(p&&isAdmin()&&(_cptPiloteTrous(t)||_cptDemande(t))); }

window._cptMarques=_cptMarques; window._cptPerces=_cptPerces; window._cptPrevus=_cptPrevus;
window._cptDemande=_cptDemande; window._cptPiloteTrous=_cptPiloteTrous; window._cptRienAPlanter=_cptRienAPlanter;
window._cptChaine=_cptChaine; window._cptResume=_cptResume; window._cptHors=_cptHors; window._cptSource=_cptSource;
window._cptOuvrir=_cptOuvrir; window._cptTouche=_cptTouche; window._cptOk=_cptOk;
window._cptAvantValider=_cptAvantValider; window._cptAuValider=_cptAuValider; window._cptDefaire=_cptDefaire;
window._cptCorrigerOuvrir=_cptCorrigerOuvrir;
window.openComptes=openComptes; window._cptsPas=_cptsPas; window._cptsSaisie=_cptsSaisie; window._cptsFiltre=_cptsFiltre; window._cptsEnregistrer=_cptsEnregistrer;
window._cptLigneReglages=_cptLigneReglages; window._cptFicheTexte=_cptFicheTexte; window._cptFicheCompte=_cptFicheCompte; window._cptFicheAdmin=_cptFicheAdmin;
