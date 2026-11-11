// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — LES MODÈLES DANS L'ONGLET ANNÉE : QUI LES SUIT, LEURS FÉRIÉS (planning-modeles.js)
// ★ MODELES-DEC (§558) : sorti de planning-annee.js, qui avait pris 66 → 75 → 83 ko en deux lots (MODSUIVI-1, FERIES-1). Les
//   deux blocs passent tels quels ; seuls les mois de la frise se lisent par window (window.PLAN_MOIS_FR), comme PLAN_MOIS dans
//   la frise depuis ANNEE-DEC (§542). La frontière est la même : les emprunts gardent leur nom (au Planning, à la frise) et lisent
//   window à l'appel ; la frise emprunte ici trois fonctions (_planAnneeSuivi, _planAnneeFerieSem, _planAnneeFeriesBloc) ; les
//   gestes s'exposent en fin de fichier. Rien ne s'exécute au chargement. Chargé par app.js juste après planning-annee.js.
// ════════════════════════════════════════════════════════════════════════════
import { isAdmin, _escHtml, _escAttr } from './utils.js';

// ── Les emprunts : au Planning (planning.js) ──
function _pY(){ return window._pY.apply(null, arguments); }
function _planMbrs(){ return window._planMbrs.apply(null, arguments); }
function _planPlId(){ return window._planPlId.apply(null, arguments); }
function _planPlanned(){ return window._planPlanned.apply(null, arguments); }
function _planInContract(){ return window._planInContract.apply(null, arguments); }
function _planSolidJour(){ return window._planSolidJour.apply(null, arguments); }
function _planBaseActive(){ return window._planBaseActive.apply(null, arguments); }
function _planTplReport(){ return window._planTplReport.apply(null, arguments); }   // ★ PREPAN-2 (§560)
// ── … et à la frise (planning-annee.js) ──
function _paE(){ return window._paE.apply(null, arguments); }
function _paH(){ return window._paH.apply(null, arguments); }
function _planRenderAnnee(){ return window._planRenderAnnee.apply(null, arguments); }
function _planAnneeLire(){ return window._planAnneeLire.apply(null, arguments); }
function _planAnneeBrouillon(){ return window._planAnneeBrouillon.apply(null, arguments); }
function _planAnneePose(){ return window._planAnneePose.apply(null, arguments); }
function _planAnneeCopie(){ return window._planAnneeCopie.apply(null, arguments); }   // ★ PREPAN-2 (§560)
function _planAnneeMetaCopie(){ return window._planAnneeMetaCopie.apply(null, arguments); }

// ★★ FERIES-1 (§556) — LES FÉRIÉS DU MODÈLE (maquette « modèles suivis » v1, point 4 ; D2 validée le 09/11 : un férié qui porte des
//   heures est PROPOSÉ chômé, en un seul geste, rien sans le geste). Un modèle importé pouvait porter des heures un jour férié : la
//   grille du mois les affichait, le relevé et le compte de l'année les comptaient travaillées (majoration comprise), et la frise
//   montrait le nom du férié à la place de ses heures, sans rien pour les régler depuis que la grille de 365 cases est partie
//   (FRISE-5) — seul le CSV les corrigeait. Dans la semaine : le férié dit ses heures, « Chômer » le passe à 0, « Travailler » lui
//   rend les heures de sa saison. Sous la semaine, la section des fériés de l'année : « Chômer les N ». Tout va au brouillon,
//   rien n'est écrit avant « Enregistrer ». La journée de solidarité, quand le domaine la fait un férié, n'y est jamais touchée :
//   ses heures viennent de son réglage (_planPlanned), pas du modèle.
function _planAnneeFeries(A,yr){
  var sj=_planSolidJour(yr),out=[];
  A.J.forEach(function(x){if(!x.fer)return;var S=A.saisons[x.s],sv=S?(((x.lettre==='B'&&S.hB)?S.hB:S.h)[x.g]||0):0;
    out.push({m:x.m,d:x.d,g:x.g,nom:x.fer,h:x.h,we:x.g>=5,sol:!!(sj&&sj.m===x.m&&sj.d===x.d),saison:sv});});
  return out;
}
function _planAnneeFerieDate(f){var JL=['lun.','mar.','mer.','jeu.','ven.','sam.','dim.'];return JL[f.g]+'\u00a0'+(f.d===1?'1er':f.d)+'\u00a0'+window.PLAN_MOIS_FR[f.m];}
// la ligne d'un férié dans la semaine choisie (FRISE-4) : le nom et l'état, puis les gestes
function _planAnneeFerieSem(x,A,yr,jn,adm){
  var f=_planAnneeFeries(A,yr).filter(function(y){return y.m===x.m&&y.d===x.d;})[0]||{nom:x.fer,h:x.h,sol:false,saison:0};
  var nom='<span style="color:var(--texte-doux);font-size:var(--pt-micro,11px)">'+_escHtml(f.nom)+' \u00b7 ';
  if(f.sol)return nom+'journ\u00e9e de solidarit\u00e9</span>';
  if(f.h>0)return nom+'travaill\u00e9 au mod\u00e8le</span>'+(adm?'<button class="plan-btn-pdf" data-m="'+x.m+'" data-j="'+x.d+'" data-p="-0.5" aria-label="'+jn+' '+x.d+' moins 30 min" onclick="planAnneeJour(this)">\u2212</button>':'')
    +'<b style="min-width:4.4em;text-align:center;font-variant-numeric:tabular-nums">'+_paH(f.h)+'</b>'
    +(adm?'<button class="plan-btn-pdf" data-m="'+x.m+'" data-j="'+x.d+'" data-p="0.5" aria-label="'+jn+' '+x.d+' plus 30 min" onclick="planAnneeJour(this)">+</button>'
      +'<button class="plan-btn-pdf" data-m="'+x.m+'" data-j="'+x.d+'" data-a="chomer" onclick="planAnneeFerie(this)">Ch\u00f4mer</button>':'');
  return nom+'ch\u00f4m\u00e9</span>'+((adm&&f.saison>0)?'<button class="plan-btn-pdf" data-m="'+x.m+'" data-j="'+x.d+'" data-a="travailler" onclick="planAnneeFerie(this)">Travailler</button>':'');
}
// la section des fériés de l'année, sous la semaine : combien portent des heures, « Chômer les N », chacun avec son geste
function _planAnneeFeriesBloc(A,id,yr,adm,ouvert){
  var F=_planAnneeFeries(A,yr),P=F.filter(function(f){return f.h>0&&!f.sol;}),L=F.filter(function(f){return !f.we||f.h>0;}),W=F.filter(function(f){return f.we&&!(f.h>0);});
  var h='<div id="pa-feries" data-tuto="plan.annee.feries" style="margin-top:14px;padding-top:10px;border-top:1px solid var(--gris-clair)"><b>Les f\u00e9ri\u00e9s de '+yr+' dans \u00ab\u00a0'+_escHtml(id)+'\u00a0\u00bb</b>';
  if(P.length)h+='<div class="mvencadre mvencadre-attention" style="margin-top:8px"><b>'+P.length+' f\u00e9ri\u00e9'+(P.length>1?'s portent':' porte')+' des heures.</b>'
    +'<div style="font-size:var(--pt-micro,11px);margin-top:2px">'+(_planBaseActive(yr)?'Ch\u00f4m\u00e9, un f\u00e9ri\u00e9 compte quand m\u00eame pour ses heures pr\u00e9vues (la base de l\u2019ann\u00e9e)\u00a0; travaill\u00e9 au mod\u00e8le, le relev\u00e9 le compte fait, majoration comprise.'
      :'Ch\u00f4m\u00e9, un f\u00e9ri\u00e9 vaut 0\u00a0h au mod\u00e8le en '+yr+'\u00a0; travaill\u00e9 au mod\u00e8le, le relev\u00e9 le compte fait, majoration comprise. D\u00e8s 2027, un f\u00e9ri\u00e9 ch\u00f4m\u00e9 comptera pour ses heures pr\u00e9vues.')+'</div>'
    +(adm?'<div style="margin-top:8px"><button class="plan-btn-saisir" data-tuto="plan.annee.feries.tous" onclick="planAnneeFeriesChomer()">Ch\u00f4mer les '+P.length+'</button></div>':'')+'</div>';
  else h+='<div style="font-size:var(--pt-txt,13px);color:var(--texte-doux);margin-top:6px">Aucun f\u00e9ri\u00e9 n\u2019est travaill\u00e9 au mod\u00e8le.</div>';
  var row='display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--gris-clair);font-size:var(--pt-txt,13px)',tr=false;
  h+='<details'+((P.length||ouvert)?' open':'')+' style="margin-top:8px"><summary style="cursor:pointer;font-size:var(--pt-txt,13px);font-weight:600">Les '+L.length+' f\u00e9ri\u00e9s en semaine</summary>'
    +L.map(function(f){var g='';
      if(f.sol)g='<span style="color:var(--texte-doux)">journ\u00e9e de solidarit\u00e9</span>';
      else if(f.h>0)g='<b style="font-variant-numeric:tabular-nums">'+_paH(f.h)+'</b>'+(adm?'<button class="plan-btn-pdf" data-m="'+f.m+'" data-j="'+f.d+'" data-a="chomer" onclick="planAnneeFerie(this)">Ch\u00f4mer</button>':'');
      else{g='<span style="color:var(--texte-doux)">ch\u00f4m\u00e9</span>';if(adm&&f.saison>0){g+='<button class="plan-btn-pdf" data-m="'+f.m+'" data-j="'+f.d+'" data-a="travailler"'+(tr?'':' data-tuto="plan.annee.ferie.travailler"')+' onclick="planAnneeFerie(this)">Travailler</button>';tr=true;}}
      return '<div style="'+row+'"><span style="flex:1;min-width:0">'+_planAnneeFerieDate(f)+'<span style="display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux)">'+_escHtml(f.nom)+'</span></span>'+g+'</div>';}).join('')
    +(W.length?'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:6px">'+W.map(function(f){return (f.d===1?'1er':f.d)+'\u00a0'+window.PLAN_MOIS_FR[f.m];}).join(' et ')+' tomb'+(W.length>1?'ent':'e')+' un week-end en '+yr+'.</div>':'')
    +'</details></div>';
  return h;
}
// « Chômer » / « Travailler » un férié (le brouillon) ; « Travailler » lui rend les heures de sa saison, ce jour de la semaine
function planAnneeFerie(el){
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee||!el)return;
  var m=parseInt(el.dataset.m,10),j=parseInt(el.dataset.j,10),a=el.dataset.a,yr=_pY(),G=_planAnneeBrouillon(E),A=_planAnneeLire(E.annee,yr,G);
  var f=_planAnneeFeries(A,yr).filter(function(y){return y.m===m&&y.d===j;})[0];if(!f||f.sol)return;
  if(a==='chomer'){if(!(f.h>0))return;_planAnneePose(G,m,j,0);}
  else if(a==='travailler'){if(!(f.saison>0)||f.h>0)return;_planAnneePose(G,m,j,f.saison);}
  else return;
  E.brouillon=G;E.n=(E.n||0)+1;E.sugg=false;_planRenderAnnee();
}
// « Chômer les N » : tous les fériés qui portent des heures, sauf la journée de solidarité — un geste, au brouillon
function planAnneeFeriesChomer(){
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee)return;
  var yr=_pY(),G=_planAnneeBrouillon(E),A=_planAnneeLire(E.annee,yr,G),n=0;
  _planAnneeFeries(A,yr).forEach(function(f){if(f.h>0&&!f.sol){_planAnneePose(G,f.m,f.d,0);n++;}});
  if(!n)return;E.brouillon=G;E.n=(E.n||0)+1;E.sugg=false;_planRenderAnnee();
  if(window.showToast)window.showToast(n+' f\u00e9ri\u00e9'+(n>1?'s ch\u00f4m\u00e9s':' ch\u00f4m\u00e9')+' \u2014 \u00ab\u00a0Enregistrer\u00a0\u00bb pour garder','#3D6B27');
}
// ★★ MODSUIVI-1 (§555) — QUI SUIT CE MODÈLE (maquette « modèles suivis » v1, point 3 ; D1 validée le 09/11 : tous les mois, l'effet
//   écrit avant de confirmer). Remonté du terrain : un modèle réglé en vain, suivi par personne, que la frise ne disait qu'en
//   11 px gris en fin de ligne. En tête de la carte : « Suivi par » et ses salariés, ou « Personne ne suit … » ; « Inscrire… » et
//   « Modifier » ouvrent la feuille (ovPlanInscr, index.html) : chaque salarié actif, le modèle qu'il suit aujourd'hui, et avant de
//   confirmer ce que l'inscription change. L'écriture passe par _mvHistGrille (RATTACHE-1, §554) : planning_id et la grille du
//   contrat en cours, ensemble. Décocher quelqu'un le remet sur « standard » ; de « standard » même, on ne sort qu'en s'inscrivant
//   ailleurs. ⚠️ Le modèle d'une personne vaut pour TOUTES ses années (planning_id n'a pas d'année) : l'effet se compte sur les mois
//   finis de l'année en cours, quelle que soit l'année affichée.
var _paInscr=null;   // la feuille ouverte : {modele, coches:{nom:true}}
function _planAnneeSuivi(id,gens,adm){
  if(!gens.length)return '<div class="mvencadre mvencadre-attention" id="pa-suivi" data-tuto="plan.annee.suivi" style="margin-top:10px"><b>Personne ne suit \u00ab\u00a0'+_escHtml(id)+'\u00a0\u00bb.</b>'
    +'<div style="font-size:var(--pt-micro,11px);margin-top:2px">Le r\u00e9gler ne change le planning de personne. Inscrivez ceux qui travaillent \u00e0 ce rythme.</div>'
    +(adm?'<div style="margin-top:8px"><button class="plan-btn-saisir" data-tuto="plan.annee.inscrire" onclick="planAnneeInscrire()">Inscrire\u2026</button></div>':'')+'</div>';
  return '<div id="pa-suivi" data-tuto="plan.annee.suivi" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:10px;font-size:var(--pt-txt,13px)"><span style="color:var(--texte-doux)">Suivi par</span>'
    +gens.map(function(m){return '<span style="display:inline-flex;align-items:center;gap:6px;border:1px solid var(--gris-clair);border-radius:999px;padding:2px 10px 2px 2px;font-weight:600;font-size:var(--pt-micro,11px)">'
      +'<span class="pl2-ava" style="width:22px;height:22px;background:'+_escAttr(m.couleur||'var(--vert-med)')+'">'+_escHtml(String(m.nom||'').charAt(0))+'</span>'+_escHtml(m.nom)+'</span>';}).join('')
    +(adm?'<button class="plan-btn-pdf" data-tuto="plan.annee.inscrire" onclick="planAnneeInscrire()">Modifier</button>':'')+'</div>';
}
function _planAnneeJourTxt(iso){var q=String(iso||'').split('-');if(q.length!==3)return '';var d=parseInt(q[2],10),m=parseInt(q[1],10)-1;return (d===1?'1er':d)+'\u00a0'+(window.PLAN_MOIS_FR[m]||'')+'\u00a0'+q[0];}
// ce que la personne suit aujourd'hui, et depuis quand quand le contrat le dit (journal tenu : une embauche porte sa grille)
function _planAnneeInscrSub(m,id){
  var cur=_planPlId(m),P=(Array.isArray(m.hist)&&m.hist.length&&typeof window._mvPeriodes==='function')?window._mvPeriodes(m):[],last=P.length?P[P.length-1]:null;
  var dep=(last&&(last.grille||'standard')===cur)?(P.length===1?' depuis son embauche':(last.debut?' depuis le '+_planAnneeJourTxt(last.debut):'')):'';
  return (cur===id?'suit d\u00e9j\u00e0 ce mod\u00e8le':'suit \u00ab\u00a0'+_escHtml(cur)+'\u00a0\u00bb')+dep;
}
// L'effet d'un changement sur les heures PRÉVUES de la personne (au modèle, sans les saisies), jours sous contrat, sur les mois finis
//   de l'année en cours : celle des compteurs. Rend {m1, de, vers, figes} — m1 = le dernier mois fini (−1 en janvier).
function _planAnneeInscrEffet(m,de,vers){
  var t=new Date(),cy=t.getFullYear(),m1=t.getMonth()-1;
  var r=window._planSurAnnee(cy,function(){var a=0,b=0;
    for(var mo=0;mo<=m1;mo++){var nb=new Date(cy,mo+1,0).getDate();for(var d=1;d<=nb;d++){if(!_planInContract(m,mo,d))continue;a+=_planPlanned(de,mo,d,cy);b+=_planPlanned(vers,mo,d,cy);}}
    return {a:a,b:b};});
  var H=(window.PLANNING_HSUP||{})[m.nom]||{},fig=[];
  for(var k=0;k<=m1;k++){var x=H[cy+'-'+String(k+1).padStart(2,'0')];if(x&&x.fige)fig.push(window.PLAN_MOIS[k].toLowerCase());}
  return {m1:m1,de:r.a,vers:r.b,figes:fig};
}
function _planAnneeInscrChangements(){
  var I=_paInscr,out=[];if(!I)return out;
  _planMbrs().forEach(function(m){var cur=_planPlId(m),on=!!I.coches[m.nom];
    if(on&&cur!==I.modele)out.push({m:m,de:cur,vers:I.modele});
    else if(!on&&cur===I.modele&&I.modele!=='standard')out.push({m:m,de:cur,vers:'standard'});});
  return out;
}
function _planAnneeInscrEffetTxt(c){
  var e=_planAnneeInscrEffet(c.m,c.de,c.vers),q=function(x){return '\u00ab\u00a0'+_escHtml(x)+'\u00a0\u00bb';},n=_escHtml(c.m.nom),dif=e.vers-e.de,retrait=!!_paInscr&&c.vers!==_paInscr.modele;
  var h='<b>'+n+(retrait?' repasse sur '+q(c.vers):' passe de '+q(c.de)+' \u00e0 '+q(c.vers))+' sur tous ses mois, les mois pass\u00e9s compris.</b> ';
  h+=e.m1<0?'Aucun mois de l\u2019ann\u00e9e n\u2019est encore fini\u00a0: rien de pass\u00e9 ne bouge cette ann\u00e9e. '
    :((e.m1===0?'En janvier':'De janvier \u00e0 '+window.PLAN_MOIS[e.m1].toLowerCase())+', ses heures pr\u00e9vues '+(Math.abs(dif)<0.05?'ne changent pas ('+_paH(e.de)+')':'passent de '+_paH(e.de)+' \u00e0 '+_paH(e.vers)+' ('+(dif>0?'+':'\u2212')+'\u00a0'+_paH(Math.abs(dif))+')\u00a0: son compteur de l\u2019ann\u00e9e suit')+'. ');
  if(e.figes.length)h+=(e.figes.length>1?'Ses mois fig\u00e9s pour la compta ('+e.figes.join(', ')+') gardent':'Son mois fig\u00e9 pour la compta ('+e.figes[0]+') garde')+' ce qui est parti. ';
  return h+'La grille horaire de son contrat devient '+q(c.vers)+'.';
}
function _planAnneeInscrPeindre(){
  var I=_paInscr;if(!I)return;var b=document.getElementById('pins-body');if(!b)return;
  var ok=document.getElementById('pins-ok'),M=_planMbrs(),ch=_planAnneeInscrChangements();
  var h=M.length?'':'<div style="font-size:var(--pt-txt,13px);color:var(--texte-doux);padding:8px 0">Aucun salari\u00e9 actif.</div>';
  M.forEach(function(m){var on=!!I.coches[m.nom],fixe=(I.modele==='standard'&&_planPlId(m)==='standard');
    h+='<button type="button" class="sdeq-ckl" role="checkbox" aria-checked="'+on+'" data-nom="'+_escAttr(m.nom)+'"'+(fixe?' disabled':'')+' data-tuto="plan.annee.inscr.ligne" onclick="planAnneeInscrToggle(this)">'
      +'<span class="sdeq-cb"></span><span style="flex:1;min-width:0"><b>'+_escHtml(m.nom)+'</b><span style="display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux);font-weight:400">'
      +_planAnneeInscrSub(m,I.modele)+(fixe?' \u2014 pour l\u2019en sortir, inscrivez-le sur un autre mod\u00e8le':'')+'</span></span></button>';});
  if(ch.length)h+='<div id="pins-effet" class="mvencadre" style="margin-top:12px;font-size:var(--pt-micro,11px);line-height:1.5;display:grid;gap:8px">'
    +ch.map(function(c){return '<div>'+_planAnneeInscrEffetTxt(c)+'</div>';}).join('')+'</div>';
  b.innerHTML=h;
  if(ok){var nIn=ch.filter(function(c){return c.vers===I.modele;}).length,nOut=ch.length-nIn;
    ok.textContent=!ch.length?'Rien \u00e0 changer':(nOut===0?(nIn===1?'Inscrire '+ch[0].m.nom:'Inscrire '+nIn+' personnes'):'Enregistrer');
    ok.disabled=!ch.length;}
}
function planAnneeInscrire(){
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee)return;
  var id=E.annee,c={};_planMbrs().forEach(function(m){if(_planPlId(m)===id)c[m.nom]=true;});
  _paInscr={modele:id,coches:c};
  var t=document.getElementById('pins-titre');if(t)t.textContent='Inscrire sur \u00ab\u00a0'+id+'\u00a0\u00bb';   // un textContent, posé à l'ouverture
  _planAnneeInscrPeindre();
  if(typeof window.openOv==='function')window.openOv('ovPlanInscr');
}
function planAnneeInscrToggle(el){
  var I=_paInscr;if(!I||!el||el.disabled)return;var nom=el.getAttribute('data-nom');if(!nom)return;
  if(I.coches[nom])delete I.coches[nom];else I.coches[nom]=true;
  _planAnneeInscrPeindre();
}
function planAnneeInscrFermer(){_paInscr=null;if(typeof window.closeOv==='function')window.closeOv(null,'ovPlanInscr');}
function planAnneeInscrOk(){
  if(typeof isAdmin==='function'&&!isAdmin())return;var I=_paInscr;if(!I)return;var ch=_planAnneeInscrChangements();if(!ch.length){planAnneeInscrFermer();return;}
  ch.forEach(function(c){if(typeof window._mvHistGrille==='function')window._mvHistGrille(c.m,c.vers);else c.m.planning_id=c.vers;});
  var nIn=ch.filter(function(c){return c.vers===I.modele;}),q='\u00ab\u00a0'+I.modele+'\u00a0\u00bb';
  var msg=nIn.length===ch.length?(ch.length===1?ch[0].m.nom+' suit '+q:ch.length+' salari\u00e9s suivent '+q)
    :(nIn.length?nIn.length+' inscrit'+(nIn.length>1?'s':'')+' sur '+q+', '+(ch.length-nIn.length)+' sur \u00ab\u00a0standard\u00a0\u00bb':(ch.length===1?ch[0].m.nom+' repasse':ch.length+' salari\u00e9s repassent')+' sur \u00ab\u00a0standard\u00a0\u00bb');
  window.MEMBRES=window.MEMBRES;
  if(typeof window.fbSaveToast==='function')window.fbSaveToast({membres:window.MEMBRES},'\u2705 '+msg,'#3D6B27');
  planAnneeInscrFermer();_planRenderAnnee();
}

// ★★ PREPAN-2 (§560) — L'ANNÉE SUIVANTE, AU GESTE (maquette « modèles suivis » v1, point 5 ; le calcul est PREPAN-1, §559 : une
//   année sans modèle sert le modèle du domaine de l'année d'avant, replacé). Deux portes, rien d'écrit sans le geste :
//   · dans l'onglet Année, un modèle absent de l'année affichée le dit en tête de sa carte (_planAnneeManque) : d'où part la frise,
//     ce que le report a coûté (jours à poser, fériés travaillés), et deux départs — « Partir de 2026 » (le brouillon du report,
//     ses horaires compris) ou « Partir d'une année vide » — puis « Enregistrer » ;
//   · « Préparer 2027 » (menu « … », bandeau du mois) : les modèles du domaine des années d'avant, replacés d'un coup sur 2027 —
//     cochés s'ils servent à quelqu'un ; un modèle déjà là n'est remplacé que coché ; deux options : rouvrir les semaines fermées
//     comme leur saison (cochée quand la base de l'année est active : les congés se posent sur la fiche de chacun), chômer les
//     fériés qui tombent sur un jour travaillé (la journée de solidarité jamais touchée).
function _planAnneeManque(id,yr,adm,E){
  var st=(window.PLANNING_TEMPLATES||{})[yr]||{};if(st[id]||(E&&E.brouillon))return '';
  var rep=_planTplReport(id,yr),q=function(x){return '\u00ab\u00a0'+_escHtml(x)+'\u00a0\u00bb';},trous=(rep.perdus||[]).length+(rep.vides||[]).length;
  var nf=_planAnneeFeries(_planAnneeLire(id,yr,rep.g||{}),yr).filter(function(f){return f.h>0&&!f.sol;}).length;
  var dep=rep.src!=null?'Point de d\u00e9part\u00a0: votre '+q(id)+' de '+rep.src+', replac\u00e9 sur les jours de '+yr+'\u00a0: un lundi reste un lundi.'
    :'Point de d\u00e9part\u00a0: le mod\u00e8le int\u00e9gr\u00e9 de l\u2019appli \u2014 le domaine n\u2019a '+q(id)+' sur aucune ann\u00e9e d\u2019avant.';
  var cout=[];
  if(trous)cout.push(trous+' jour'+(trous>1?'s restent':' reste')+' \u00e0 poser (un mois n\u2019a pas les m\u00eames semaines d\u2019une ann\u00e9e \u00e0 l\u2019autre)');
  if(nf)cout.push(nf+' f\u00e9ri\u00e9'+(nf>1?'s tombent':' tombe')+' sur des jours travaill\u00e9s, propos\u00e9'+(nf>1?'s':'')+' ch\u00f4m\u00e9'+(nf>1?'s':''));
  return '<div class="mvencadre mvencadre-attention" id="pa-manque" data-tuto="plan.annee.manque" style="margin-top:10px"><b>'+q(id)+' n\u2019existe pas encore en '+yr+'</b>'
    +'<div style="font-size:var(--pt-micro,11px);margin-top:2px;line-height:1.5">'+dep+(cout.length?' '+cout.join('\u00a0; ')+'.':'')+'</div>'
    +(adm?'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="plan-btn-saisir" data-a="report" data-tuto="plan.annee.partir" onclick="planAnneePartir(this)">'+(rep.src!=null?'Partir de '+rep.src:'Partir du mod\u00e8le int\u00e9gr\u00e9')+'</button>'
      +'<button class="plan-btn-pdf" data-a="vide" data-tuto="plan.annee.partir.vide" onclick="planAnneePartir(this)">Partir d\u2019une ann\u00e9e vide</button></div>':'')
    +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:6px">Aper\u00e7u\u00a0: rien n\u2019est \u00e9crit avant votre choix, puis \u00ab\u00a0Enregistrer\u00a0\u00bb.</div></div>';
}
// « Partir de 2026 » : le brouillon du report et ses horaires ; « Partir d'une année vide » : douze mois sans heures, sans horaires
function planAnneePartir(el){
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee||!el)return;
  var rep=_planTplReport(E.annee,_pY());
  if(el.dataset.a==='vide'){var G={};for(var m=0;m<12;m++)G[m]={};E.brouillon=G;E.meta={};}
  else if(el.dataset.a==='report'){E.brouillon=_planAnneeCopie(rep.g||{});E.meta=_planAnneeMetaCopie(rep.g||{});}
  else return;
  E.n=(E.n||0)+1;E.sugg=false;_planRenderAnnee();
}
var _paPrep=null;   // la feuille « Préparer » ouverte : {cible, coches:{id:true}, rouvrir, chomer}
// les modèles du domaine des années d'avant la cible : ce que la cible sert déjà (PREPAN-1), à écrire pour de bon
function _planPrepModeles(T){
  var P=window.PLANNING_TEMPLATES||{},ids={};
  Object.keys(P).forEach(function(k){var y=parseInt(k,10);if(y<T&&P[k])Object.keys(P[k]).forEach(function(i){ids[i]=1;});});
  return Object.keys(ids).sort().map(function(id){var rep=_planTplReport(id,T);
    return {id:id,src:rep.src,rep:rep,trous:(rep.perdus||[]).length+(rep.vides||[]).length,existe:!!((P[T]||{})[id]),gens:_planMbrs().filter(function(m){return _planPlId(m)===id;})};});
}
// la grille à écrire : le report, les semaines fermées rouvertes comme leur saison, les fériés travaillés chômés (au choix)
function _planPrepGrille(M,T,o){
  return window._planSurAnnee(T,function(){
    var G=_planAnneeCopie(M.rep.g||{}),A=_planAnneeLire(M.id,T,G);
    if(o.rouvrir)A.sem.forEach(function(s){if(!s.ferme)return;s.j.forEach(function(x){if(x.fer)return;var S=A.saisons[x.s];if(!S)return;var v=((x.lettre==='B'&&S.hB)?S.hB:S.h)[x.g];if(v>0)_planAnneePose(G,x.m,x.d,v);});});
    if(o.chomer){A=_planAnneeLire(M.id,T,G);_planAnneeFeries(A,T).forEach(function(f){if(f.h>0&&!f.sol)_planAnneePose(G,f.m,f.d,0);});}
    return G;});
}
function _planPrepFeriesN(M,T){return window._planSurAnnee(T,function(){return _planAnneeFeries(_planAnneeLire(M.id,T,M.rep.g||{}),T).filter(function(f){return f.h>0&&!f.sol;}).length;});}
function _planPrepPeindre(){
  var P=_paPrep;if(!P)return;var b=document.getElementById('prep-body'),s=document.getElementById('prep-sous'),ok=document.getElementById('prep-ok');if(!b)return;
  var T=P.cible,L=_planPrepModeles(T),ans={};L.forEach(function(M){if(M.src!=null)ans[M.src]=1;});var An=Object.keys(ans).sort();
  if(s)s.textContent=L.length?('Depuis vos mod\u00e8les '+An.join(' et ')+'. Chaque mod\u00e8le est replac\u00e9 sur les jours de '+T+'\u00a0; rien n\u2019est \u00e9crit sur '+An.join(' ni ')+'.'):'';
  if(!L.length){b.innerHTML='<div style="font-size:var(--pt-txt,13px);color:var(--texte-doux);padding:8px 0">Le domaine n\u2019a aucun mod\u00e8le enregistr\u00e9 avant '+T+'\u00a0: l\u2019ann\u00e9e suit le mod\u00e8le int\u00e9gr\u00e9 de l\u2019appli.</div>';if(ok){ok.textContent='Pr\u00e9parer '+T;ok.disabled=true;}return;}
  var h='',n=0,trous=0,fer=0,rempl=[];
  L.forEach(function(M){var on=!!P.coches[M.id];if(on){n++;trous+=M.trous;fer+=_planPrepFeriesN(M,T);if(M.existe)rempl.push(M.id);}
    var sub=(M.gens.length?_escHtml(M.gens.map(function(g){return g.nom;}).join(', ')):'personne ne le suit')+(M.trous?' \u00b7 '+M.trous+' jour'+(M.trous>1?'s':'')+' \u00e0 poser':'')+(M.existe?' \u00b7 existe d\u00e9j\u00e0 en '+T+'\u00a0: coch\u00e9, il est remplac\u00e9':'');
    h+='<button type="button" class="sdeq-ckl" role="checkbox" aria-checked="'+on+'" data-id="'+_escAttr(M.id)+'" data-tuto="plan.prep.ligne" onclick="planPrepToggle(this)"><span class="sdeq-cb"></span><span style="flex:1;min-width:0"><b>'+_escHtml(M.id)+'</b><span style="display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux);font-weight:400">'+sub+'</span></span></button>';});
  h+='<div style="margin-top:10px">'
    +'<button type="button" class="sdeq-ckl" role="checkbox" aria-checked="'+!!P.rouvrir+'" data-k="rouvrir" onclick="planPrepToggle(this)"><span class="sdeq-cb"></span><span style="flex:1;min-width:0">Rouvrir les semaines ferm\u00e9es comme leur saison<span style="display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux);font-weight:400">'+(_planBaseActive(T)?'En '+T+', les cong\u00e9s se posent sur la fiche de chacun (la base de l\u2019ann\u00e9e).':'D\u00e9coch\u00e9e, une fermeture du domaine reste ferm\u00e9e.')+'</span></span></button>'
    +'<button type="button" class="sdeq-ckl" role="checkbox" aria-checked="'+!!P.chomer+'" data-k="chomer" onclick="planPrepToggle(this)"><span class="sdeq-cb"></span><span style="flex:1;min-width:0">Ch\u00f4mer les f\u00e9ri\u00e9s qui tombent sur un jour travaill\u00e9<span style="display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux);font-weight:400">'+fer+' en tout dans les mod\u00e8les coch\u00e9s\u00a0; la journ\u00e9e de solidarit\u00e9 n\u2019est jamais touch\u00e9e.</span></span></button></div>';
  h+='<div id="prep-bilan" class="mvencadre" style="margin-top:10px;font-size:var(--pt-micro,11px)">'+(n?n+' mod\u00e8le'+(n>1?'s':'')+' pr\u00e9par\u00e9'+(n>1?'s':'')+' \u00b7 '+trous+' jour'+(trous>1?'s':'')+' \u00e0 poser'+(rempl.length?' \u00b7 '+rempl.map(function(i){return '\u00ab\u00a0'+_escHtml(i)+'\u00a0\u00bb';}).join(', ')+' '+T+' remplac\u00e9'+(rempl.length>1?'s':''):'')+'.':'Aucun mod\u00e8le coch\u00e9.')+' Un mod\u00e8le '+T+' d\u00e9j\u00e0 l\u00e0 n\u2019est remplac\u00e9 que coch\u00e9.</div>';
  b.innerHTML=h;if(ok){ok.textContent='Pr\u00e9parer '+T;ok.disabled=!n;}
}
function planPrepOuvrir(T){
  if(typeof isAdmin==='function'&&!isAdmin())return;T=parseInt(T,10);if(!(T>2000))return;
  var c={};_planPrepModeles(T).forEach(function(M){if(!M.existe&&M.gens.length)c[M.id]=true;});
  _paPrep={cible:T,coches:c,rouvrir:!!_planBaseActive(T),chomer:true};
  var t=document.getElementById('prep-titre');if(t)t.textContent='Pr\u00e9parer '+T;
  _planPrepPeindre();if(typeof window.openOv==='function')window.openOv('ovPlanPrep');
}
function planPrepToggle(el){
  var P=_paPrep;if(!P||!el)return;var k=el.getAttribute('data-k'),id=el.getAttribute('data-id');
  if(k==='rouvrir'||k==='chomer')P[k]=!P[k];else if(id){if(P.coches[id])delete P.coches[id];else P.coches[id]=true;}else return;
  _planPrepPeindre();
}
function planPrepFermer(){_paPrep=null;if(typeof window.closeOv==='function')window.closeOv(null,'ovPlanPrep');}
function planPrepOk(){
  if(typeof isAdmin==='function'&&!isAdmin())return;var P=_paPrep;if(!P)return;var T=P.cible;
  var L=_planPrepModeles(T).filter(function(M){return P.coches[M.id];});if(!L.length)return;
  var TT=window.PLANNING_TEMPLATES;if(!TT[T])TT[T]={};var rempl=0;
  L.forEach(function(M){var G=_planPrepGrille(M,T,P),neuf={};
    Object.keys(M.rep.g||{}).forEach(function(k){if(isNaN(parseInt(k,10)))neuf[k]=M.rep.g[k];});   // les horaires du modèle repris
    for(var m=0;m<12;m++)neuf[m]=G[m]||{};if(M.existe)rempl++;TT[T][M.id]=neuf;});
  if(typeof window.fbSaveToast==='function')window.fbSaveToast({planning_templates:TT},'\u2705 '+T+' pr\u00e9par\u00e9\u00a0: '+L.length+' mod\u00e8le'+(L.length>1?'s':'')+(rempl?' ('+rempl+' remplac\u00e9'+(rempl>1?'s':'')+')':''),'#3D6B27');
  planPrepFermer();if(typeof window.planSetYear==='function')window.planSetYear(T);
}

// ── Les expositions : ce que la frise emprunte, et les gestes ──
window._planAnneeSuivi       = _planAnneeSuivi;
window._planAnneeFerieSem    = _planAnneeFerieSem;
window._planAnneeFeriesBloc  = _planAnneeFeriesBloc;
window.planAnneeInscrire     = planAnneeInscrire;     // ★ MODSUIVI-1 (§555) : qui suit ce modèle
window.planAnneeInscrToggle  = planAnneeInscrToggle;
window.planAnneeInscrFermer  = planAnneeInscrFermer;
window.planAnneeInscrOk      = planAnneeInscrOk;
window.planAnneeFerie        = planAnneeFerie;        // ★ FERIES-1 (§556) : les fériés du modèle
window.planAnneeFeriesChomer = planAnneeFeriesChomer;
window._planAnneeManque      = _planAnneeManque;      // ★ PREPAN-2 (§560) : l'année suivante, au geste
window.planAnneePartir       = planAnneePartir;
window.planPrepOuvrir        = planPrepOuvrir;
window.planPrepToggle        = planPrepToggle;
window.planPrepFermer        = planPrepFermer;
window.planPrepOk            = planPrepOk;
