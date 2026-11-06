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
/* ═══════════════════════════════════════════════════════════════════════════
   RESTE-1 (§535) — LE RESTE À PLANTER PASSE D'UNE CAMPAGNE À L'AUTRE
   ───────────────────────────────────────────────────────────────────────────
   Nico (06/11, après la question d'un client : « si je clôture, mes trous sont-ils effacés ? ») :
   « il reste les trous moins les plantés » — 3 trous, 2 plantés : il en reste 1, et les trous
   de l'an prochain s'ajoutent dessus. Avant ce lot : valider voulait dire « parcelle finie »,
   le nombre de plantés écrasait les trous de la parcelle, et la somme de TOUTES les tarières,
   toutes années confondues, revenait au rechargement (_recalcPlantationTrous).
   Les trous et les plantés ne sont plus un champ de la parcelle : ils se relisent dans ce qui
   s'est passé — les sessions de tarière (trous percés), les validations du journal (pieds
   plantés ; une validation annulée ensuite ne compte plus), les comptes du repérage (un par
   campagne, l'ancien gardé dans p.trous_marques_hist). _cptBilan les déroule campagne par
   campagne (axe du 1er août, _mvCampagneDe) ; ce qui reste passe à la suivante, clôture ou pas.
   p.plantation_trous reste écrit par _recalcPlantationTrous (le total de la tarière), mais
   plus aucune règle ne le lit.
   ═══════════════════════════════════════════════════════════════════════════ */
import { showToast, isAdmin, canWrite, _mvIcon } from './utils.js';

// ── COMPTE-1 : début du bloc exécutable
function _cptN(v){ if(v===null||v===undefined||v==='') return null; var n=parseInt(v,10); return (isNaN(n)||n<0)?null:n; }
// Une tâche « simple » réglée pour demander le compte. Jamais une tâche à trous, à niveaux ou à passages.
function _cptDemande(t){ return !!(t&&t.demandeCompte&&!t.trous&&t.type!=='niveaux'&&t.type!=='passages'); }
function _cptPiloteTrous(t){ return !!(t&&(t.trous||t.nom==='Entreplantation')); }
// ★ RESTE-1 (§535) : les comptes du repérage d'une parcelle, du plus ancien au plus récent — l'historique (un par
//   campagne passée, gardé par _cptPoser), puis le compte en cours. Un compte sans date est celui de la campagne du jour.
function _cptComptes(p){
  var L=[];
  (Array.isArray(p&&p.trous_marques_hist)?p.trous_marques_hist:[]).forEach(function(h){ var n=_cptN(h&&h.n); if(n!==null) L.push({ n:n, le:String((h&&h.le)||'') }); });
  var m=_cptN(p&&p.trous_marques); if(m!==null) L.push({ n:m, le:String((p&&p.trous_marques_le)||'') });
  return L;
}
// Le compte d'une campagne : le dernier posé dans cette campagne (au plus tard le jour `jusqua`) ; null : pas compté.
function _cptCompteCamp(p, camp, campDe, jusqua){
  var r=null;
  _cptComptes(p).forEach(function(c){
    if(jusqua&&c.le&&c.le>jusqua) return;
    if(String(campDe(c.le))===String(camp)) r=c.n;
  });
  return r;
}
// ★★ RESTE-1 (§535) — LE RESTE À PLANTER : LES TROUS MOINS LES PLANTÉS, ET IL PASSE D'UNE CAMPAGNE À L'AUTRE.
//   ev : [{ d:'AAAA-MM-JJ', k:'perce'|'plante', n:entier — ou null pour « tout ce qui restait » —, id }]
//   Campagne par campagne (campDe : l'axe de la campagne), jusqu'au jour `jusqua` compris :
//     · le compte des pieds marqués de la campagne vaut pour toute la campagne et s'ajoute aux marqués pas encore
//       percés — c'est le « plus grand des deux » de COMPTE-1 (marqués 120, percés 60 : 120 ; percés 90 sur 80 : 90) ;
//     · un trou percé consomme un pied marqué ;
//     · un pied planté bouche un trou, sinon un pied marqué (trou fait à la main) ; jamais en dessous de zéro.
//   Ce qui reste — les trous ouverts et les marqués pas encore percés — passe à la campagne suivante.
function _cptBilan(p, ev, campDe, jusqua){
  var E=(ev||[]).filter(function(e){ return e&&e.d&&(!jusqua||e.d<=jusqua); }).slice();
  E.sort(function(a,b){ return a.d<b.d?-1:(a.d>b.d?1:((a.k==='perce'?0:1)-(b.k==='perce'?0:1))); });
  var cur=Number(campDe(jusqua||'')), vus={};
  vus[cur]=1;
  E.forEach(function(e){ vus[Number(campDe(e.d))]=1; });
  _cptComptes(p).forEach(function(c){ if(!jusqua||!c.le||c.le<=jusqua) vus[Number(campDe(c.le))]=1; });
  var camps=Object.keys(vus).map(Number).filter(function(c){ return c<=cur; }).sort(function(a,b){ return a-b; });
  var H=0, M=0, plantes=[], perces=[], parCamp={};
  camps.forEach(function(c){
    var report={ h:H, m:M }, mc=_cptCompteCamp(p, c, campDe, jusqua), pc=0, pl=0;
    M+=(mc||0);
    E.forEach(function(e){
      if(Number(campDe(e.d))!==c) return;
      if(e.k==='perce'){ var np=_cptN(e.n)||0; if(!np) return; H+=np; M=Math.max(0,M-np); pc+=np; perces.push({ d:e.d, n:np }); return; }
      var q=(e.n===null||e.n===undefined)?(H+M):(_cptN(e.n)||0);
      if(q<=H) H-=q; else { M=Math.max(0,M-(q-H)); H=0; }
      pl+=q; plantes.push({ d:e.d, n:q, id:e.id });
    });
    parCamp[c]={ report:report, marques:mc, perces:pc, plantes:pl, reste:H+M };
  });
  return { reste:H+M, trous:H, marques:M, camp:cur, plantes:plantes, perces:perces, parCamp:parCamp };
}
// Pose le compte d'une parcelle et rend ce qu'il remplace (pour « Annuler »). n === null efface.
// ★ RESTE-1 (§535) : un compte d'une AUTRE campagne n'est pas écrasé, il part dans l'historique (p.trous_marques_hist) :
//   le reste de l'an dernier ne bouge pas quand le repérage de cette année arrive.
function _cptPoser(p, n, qui, date, corr, campDe){
  var m=_cptN(p.trous_marques);
  var avant=(m===null)?null:{ n:m, par:p.trous_marques_par||'', le:p.trous_marques_le||'', corr:!!p.trous_marques_corr };
  if(avant&&typeof campDe==='function'&&String(campDe(avant.le))!==String(campDe(date||''))){
    p.trous_marques_hist=(Array.isArray(p.trous_marques_hist)?p.trous_marques_hist:[]).concat([{ n:m, le:avant.le, par:avant.par }]);
    avant.arch=true;
  }
  if(n===null){ delete p.trous_marques; delete p.trous_marques_par; delete p.trous_marques_le; delete p.trous_marques_corr; }
  else { p.trous_marques=n; p.trous_marques_par=qui||''; p.trous_marques_le=date||''; if(corr) p.trous_marques_corr=true; else delete p.trous_marques_corr; }
  return avant;
}
function _cptRemettre(p, avant){
  if(avant&&avant.arch&&Array.isArray(p.trous_marques_hist)){ p.trous_marques_hist=p.trous_marques_hist.slice(0,-1); if(!p.trous_marques_hist.length) delete p.trous_marques_hist; }
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

/* ══════════════════════════════════════════════════════════════════════════
   RESTE-1 (§535) — LES LECTURES, BRANCHÉES SUR L'APPLI (tout passe par _cptEtat)
   ══════════════════════════════════════════════════════════════════════════ */
// L'axe de la campagne (utils.js, _mvCampagneDe : le 1er août par défaut) ; repli au 1er août si utils manque.
function _cptCamp(iso){
  if(typeof window._mvCampagneDe==='function') return window._mvCampagneDe(iso);
  var p=String(iso||'').split('-'), an=parseInt(p[0],10), mo=parseInt(p[1],10);
  if(!an||!mo){ var d=new Date(); an=d.getFullYear(); mo=d.getMonth()+1; }
  return mo>=8?an:an-1;
}
// Le jour d'une parcelle cochée dans une session : sa marque du jour (FERTI-9, _trCocheJour), son chrono, sinon la session.
function _cptJourCoche(s, x){
  if(x&&/^\d{4}-\d{2}-\d{2}/.test(String(x.d||''))) return String(x.d).slice(0,10);
  if(x&&typeof x.t0==='number'&&x.t0>0){ var t=new Date(x.t0); return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0'); }
  return String((s&&s.date)||'').slice(0,10);
}
// Ce qui s'est passé, parcelle par parcelle. Relu seulement quand le journal, les sessions ou un compte changent : même
// empreinte que _mvAnnulIdx (utils.js), plus un compteur que les écrivains font avancer (_cptInvalider).
var _CPT_IDX=null, _CPT_GEN=0;
function _cptInvalider(){ _CPT_GEN++; _CPT_IDX=null; }
function _cptIdx(){
  var J=window.JOURNAL||[], S=window.SESSIONS||[];
  var k=J.length+'|'+((J[0]&&J[0].id)||'')+'|'+((J[J.length-1]&&J[J.length-1].id)||'')+'|'+S.length+'|'+((S[0]&&S[0].id)||'')
    +'|'+((S[S.length-1]&&S[S.length-1].id)||'')+'|'+_CPT_GEN+'|'+_auj();
  if(_CPT_IDX&&_CPT_IDX.k===k&&_CPT_IDX.P===window.PARCELLES&&_CPT_IDX.A===window.ACTIVITES&&_CPT_IDX.T===window.TACHES) return _CPT_IDX;
  var ev={}, A=window.ACTIVITES||[];
  function ajoute(nom, e){ (ev[nom]=ev[nom]||[]).push(e); }
  // Les trous percés : une activité qui alimente les trous (la tarière), parcelle par parcelle.
  S.forEach(function(s){
    if(!s) return;
    var act=A.find(function(a){ return a&&a.nom===s.activite; });
    if(!act||!act.champCustom||!act.champCustom.feedsPlantation) return;
    var lab=act.champCustom.label;
    (Array.isArray(s.parcellesFaites)?s.parcellesFaites:[]).forEach(function(x){
      if(!x||typeof x!=='object'||!x.nom) return;
      var n=parseInt(x.data&&x.data[lab],10)||0;
      if(n>0) ajoute(String(x.nom), { d:_cptJourCoche(s,x), k:'perce', n:n });
    });
  });
  // Les pieds plantés : chaque validation d'une tâche à trous ; sans nombre, « tout ce qui restait ».
  J.forEach(function(j){
    if(!j||j.meteo||!j.parcelle||j.parcelle==='Domaine'||!j.date||j.etape||String(j.statut||'')!=='Validé') return;
    if(!_cptPiloteTrous(_tDef(j.tache)||{nom:j.tache})) return;
    if(typeof window._mvAnnulee==='function'&&window._mvAnnulee(j)) return;   // annulée ensuite (ARRACH-8, utils.js)
    ajoute(String(j.parcelle), { d:String(j.date).slice(0,10), k:'plante', n:_cptN(j.plantation_trous), id:j.id });
  });
  _CPT_IDX={ k:k, P:window.PARCELLES, A:window.ACTIVITES, T:window.TACHES, ev:ev, etat:{} };
  return _CPT_IDX;
}
function _cptEtat(p, jusqua){
  var j=jusqua||_auj();
  if(!p) return _cptBilan({}, [], _cptCamp, j);
  // Les comptes vivent sur la parcelle (une autre personne peut les changer, la parcelle peut être rechargée) : ils entrent
  // dans la clé — un état gardé pour un autre compte ne resservirait pas (vu par MANQUE-1 : un compte posé, le constat restait).
  var I=_cptIdx(), h=p.trous_marques_hist, hn=Array.isArray(h)?h.length:0;
  var cle=String(p.nom)+'|'+j+'|'+p.trous_marques+'|'+(p.trous_marques_le||'')+'|'+hn+'|'+(hn?String((h[hn-1]||{}).le||''):'');
  return I.etat[cle]||(I.etat[cle]=_cptBilan(p, I.ev[String(p.nom)]||[], _cptCamp, j));
}
// La période regardée — consultée, sinon active : la même que _tachesFor (app.js) et _pilSaison (Pilotage).
function _cptPerObj(){
  var v=(typeof window._visuSaison==='function')?window._visuSaison():'';
  var f=v?(window.SAISONS||[]).find(function(s){ return s&&s.nom===v; }):null;
  return f||((typeof window.getSaisonActive==='function')?window.getSaisonActive():null);
}
function _cptPerFin(per){ var a=_auj(), f=(per&&per.fin)?String(per.fin).slice(0,10):''; return (f&&f<a)?f:a; }
// Les pieds plantés pendant une période (une date s'y rattache par _saisonForDate, comme partout au journal).
function _cptPlantesPer(p, per){
  per=per||_cptPerObj(); if(!p||!per) return 0;
  var f=window._saisonForDate, s=0;
  _cptEtat(p).plantes.forEach(function(x){
    var dans=(typeof f==='function')?(f(x.d)===per.nom):(!!per.debut&&!!per.fin&&x.d>=String(per.debut)&&x.d<=String(per.fin));
    if(dans) s+=x.n;
  });
  return s;
}
function _cptReste(p){ return _cptEtat(p).reste; }
// Ce qui reste à planter à la fin de la période regardée (aujourd'hui si elle court encore).
function _cptResteA(p, per){ return _cptEtat(p, _cptPerFin(per||_cptPerObj())).reste; }
// Les trous prévus de la période regardée : les pieds plantés pendant la période, plus ce qui reste à planter à sa fin.
function _cptPrevus(p, per){ per=per||_cptPerObj(); return _cptPlantesPer(p, per)+_cptResteA(p, per); }
// Le compte de la campagne en cours ; null : pas encore compté cette campagne (le compte repart à chaque campagne).
function _cptMarques(p){ var a=_auj(); return p?_cptCompteCamp(p, _cptCamp(a), _cptCamp, a):null; }
// Les trous percés à la tarière pendant la campagne en cours.
function _cptPerces(p){ var e=_cptEtat(p), c=e.parCamp[e.camp]; return (c&&c.perces)||0; }
// Les pieds marqués qui restent à percer (la tarière arrive préremplie avec ce nombre).
function _cptAPercer(p){ return _cptEtat(p).marques; }
// Les pieds d'une validation du journal, tels que les comptes les lisent (sans nombre : ce qu'elle a planté).
function _cptPlantesEntree(p, id){ var x=_cptEtat(p).plantes.find(function(e){ return e.id===id; }); return x?x.n:0; }
// Comptée à zéro cette campagne, rien qui reste, rien planté pendant la période : la parcelle sort de l'entreplantation.
function _cptRienAPlanter(p){ return _cptMarques(p)===0&&_cptReste(p)===0&&_cptPlantesPer(p)===0; }
// La chaîne de la campagne en cours : reportés (d'avant), marqués, percés, plantés, et ce qui reste.
function _cptChaine(p){
  var e=_cptEtat(p), c=e.parCamp[e.camp]||{ report:{ h:0, m:0 }, perces:0, plantes:0 };
  return { report:c.report.h+c.report.m, marques:_cptMarques(p), perces:c.perces, plantes:c.plantes, reste:e.reste,
           valide:(e.reste===0&&c.plantes>0), prevus:_cptPrevus(p) };
}
// Le résumé de la roue crantée : pieds marqués (campagne en cours), parcelles comptées, trous prévus, reste à planter.
function _cptResume(parcelles){
  var actives=(parcelles||[]).filter(function(p){ return p&&p.statut!=='Arrachee'; });
  var c=actives.filter(function(p){ return _cptMarques(p)!==null; });
  return { pieds:c.reduce(function(s,p){ return s+_cptMarques(p); },0), comptees:c.length, total:actives.length,
           prevus:actives.reduce(function(s,p){ return s+_cptPrevus(p); },0),
           reste:actives.reduce(function(s,p){ return s+_cptReste(p); },0) };
}
// Après l'écriture d'une plantation (période active) : s'il reste des pieds à planter, la parcelle reste « En cours ».
function _cptStatutApres(p, task){
  if(!p||!_cptPiloteTrous(_tDef(task)||{nom:task})) return '';
  _cptInvalider();
  if(_cptReste(p)>0){ if(!p.taches||typeof p.taches!=='object') p.taches={}; p.taches[task]='En cours'; return 'En cours'; }
  return 'Validé';
}

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
    hint=(_cptMarques(p)===null&&!_cptChaine(p).plantes)?'Cette parcelle n’a pas été comptée au repérage. Le nombre sert au temps passé.':'Il ne reste rien à planter d’après les comptes. Le nombre sert au temps passé.';
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
  if(_cptPiloteTrous(t||{nom:task})&&!(_cptReste(p)>0)){ _cptOuvrir({ mode:'ent', p:p, tache:task, suite:suite }); return true; }
  return false;
}
// Au moment d'écrire l'entrée du journal. n = le nombre du pavé, ou null (validation d'un seul appui).
function _cptAuValider(p, task, jEntry, n){
  var t=_tDef(task);
  if(_cptDemande(t)){
    if(n===null||n===undefined) return;
    jEntry.trous_marques=n;
    jEntry.trous_marques_avant=_cptPoser(p, n, _qui(), jEntry.date||_auj(), false, _cptCamp);
    _cptInvalider();
    return;
  }
  if(!_cptPiloteTrous(t||{nom:task})) return;
  // ★ RESTE-1 (§535) : les pieds plantés vont au journal, et seulement là — ils n'écrasent plus les trous de la parcelle
  //   (au rechargement, la somme de toutes les tarières revenait). D'un appui : tout ce qui restait à planter.
  if(n!==null&&n!==undefined) jEntry.plantation_trous=n;
  else if(jEntry.plantation_trous==null){ var r=_cptReste(p); if(r>0) jEntry.plantation_trous=r; }
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
  _cptInvalider();
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
  var avant=_cptPoser(p, n, _qui(), _auj(), _cptMarques(p)!==null, _cptCamp); _cptInvalider();
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
// ★ RESTE-1 (§535) : ce qui resterait à planter si le compte de la campagne valait v (la feuille, avant d'enregistrer).
function _cptsResteSi(p, v){
  var q={ nom:p.nom, trous_marques:p.trous_marques, trous_marques_le:p.trous_marques_le, trous_marques_par:p.trous_marques_par,
          trous_marques_hist:Array.isArray(p.trous_marques_hist)?p.trous_marques_hist.slice():undefined };
  if(v!==_cptsOrig(p)) _cptPoser(q, v===''?null:parseInt(v,10), '', _auj(), false, _cptCamp);
  return _cptBilan(q, _cptIdx().ev[String(p.nom)]||[], _cptCamp, _auj()).reste;
}
function _cptsMaj(){
  if(!_CPTS) return;
  var ps=_cptsActives(), pieds=0, compt=0, mods=0, prev=0;
  ps.forEach(function(p, i){
    var v=_CPTS[p.nom], mod=(v!==_cptsOrig(p));
    if(v!==''){ pieds+=parseInt(v,10)||0; compt++; }
    if(mod) mods++;
    prev+=_cptsResteSi(p, v);   // ★ RESTE-1 (§535) : ce qui resterait à planter avec ce compte
    var row=document.querySelector('.cpts-row[data-i="'+i+'"]'); if(row) row.classList.toggle('mod',mod);
    var st=document.getElementById('cpts-st-'+i);
    if(st) st.innerHTML=(mod?'<span class="cpts-b acc">modifié</span>'
      :(_cptMarques(p)!==null?'<span class="cpts-b ok">'+_e(_cptSource(p))+'</span>':'<span class="cpts-b att">Pas encore compté</span>'))
      +(_cptPerces(p)?'<span class="cpts-b">'+_pl(_cptPerces(p),'trou percé','trous percés')+'</span>':'')
      +(_cptChaine(p).report?'<span class="cpts-b">'+_pl(_cptChaine(p).report,'pied reporté','pieds reportés')+'</span>':'');
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
    n++; _cptPoser(p, v===''?null:parseInt(v,10), qui, d, _cptMarques(p)!==null, _cptCamp);
  });
  _CPTS=null; _cptInvalider();
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
    +(r.pieds?' · '+_fN(r.pieds)+_NB+'pieds':'')+(r.reste?' · reste '+_fN(r.reste)+' à planter':'')+' \u2014 Saisir les comptes</div>';
}
// Fiche parcelle : le texte sous le nom de la tâche (heures comprises), et le lien de l'admin.
function _cptFicheTexte(p, t, hEstim){
  if(_cptPiloteTrous(t)){
    if(_cptRienAPlanter(p)) return 'Aucun pied à remplacer';
    var c=_cptChaine(p), bouts=[];
    if(c.report) bouts.push(_pl(c.report,'reporté','reportés'));
    if(c.marques!==null) bouts.push(_fN(c.marques)+' marqués');
    if(c.perces) bouts.push(_fN(c.perces)+' percés');
    if(c.plantes) bouts.push(_fN(c.plantes)+' plantés');
    if(!bouts.length&&!c.reste) return 'Pas encore compté';
    if(c.reste>0) bouts.push('reste '+_fN(c.reste)+' à planter'+(hEstim?' · ~'+hEstim+'h':''));
    return bouts.join(' · ');
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
window._cptReste=_cptReste; window._cptResteA=_cptResteA; window._cptPlantesPer=_cptPlantesPer; window._cptAPercer=_cptAPercer; window._cptEtat=_cptEtat;   // RESTE-1 (§535)
window._cptPlantesEntree=_cptPlantesEntree; window._cptStatutApres=_cptStatutApres; window._cptInvalider=_cptInvalider; window._cptPerObj=_cptPerObj;
