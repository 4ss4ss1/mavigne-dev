// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — src/planning-annee.js
// L'année d'un modèle, en frise : la lecture en saisons (FRISE-1, §539), le réglage sur la frise (FRISE-2, §540),
// les coupes et les jours à part (FRISE-3, §541). Sorti de planning.js au lot ANNEE-DEC (§542).
// © 2026 Nicolas GUERET / GUERETTECH
// ════════════════════════════════════════════════════════════════════════════
//
// ⚠️ Chargé JUSTE APRÈS planning.js (app.js). Il lit le Planning par window, et le Planning le lit par window
//   (CLAUDE.md §24 n°6) : « LA FRONTIÈRE » — les emprunts ici en tête, les expositions en fin des deux fichiers —
//   est le seul passage. Un emprunt porte le nom de la fonction du Planning et lit window AU MOMENT DE L'APPEL.
// ⚠️ L'état de la vue (le modèle ouvert, son brouillon, la semaine choisie) vit ICI (_paEtat) depuis ANNEE-TAB (§548) :
//   l'année a son onglet dans le Planning, la roue crantée ne la porte plus.
// ⚠️ Rien ne s'exécute au chargement hors déclarations et expositions (mv-harnais-anneedec).
// ════════════════════════════════════════════════════════════════════════════

import { isAdmin, _escHtml, _escAttr } from './utils.js';

// ── LA FRONTIÈRE : ce que la frise emprunte au Planning ──
function _feriesY(){ return window._feriesY.apply(null, arguments); }
function _pTplStore(){ return window._pTplStore.apply(null, arguments); }
function _pY(){ return window._pY.apply(null, arguments); }
function _planBaseActive(){ return window._planBaseActive.apply(null, arguments); }
function _planBaseAttendue(){ return window._planBaseAttendue.apply(null, arguments); }
function _planCreditFerie(){ return window._planCreditFerie.apply(null, arguments); }
function _planFmt(){ return window._planFmt.apply(null, arguments); }
function _planGetTpl(){ return window._planGetTpl.apply(null, arguments); }
function _planLegal(){ return window._planLegal.apply(null, arguments); }
function _planMbrs(){ return window._planMbrs.apply(null, arguments); }
function _planModelBrut(){ return window._planModelBrut.apply(null, arguments); }
function _planPlId(){ return window._planPlId.apply(null, arguments); }
function _planModeles(){ return window._planModeles.apply(null, arguments); }
function planSaveTpl(){ return window.planSaveTpl.apply(null, arguments); }
function _planBaseAn(){ return window._planBaseAn.apply(null, arguments); }
function _planJoursSem(){ return window._planJoursSem.apply(null, arguments); }
function _planSolid(){ return window._planSolid.apply(null, arguments); }
function _planSolidJour(){ return window._planSolidJour.apply(null, arguments); }
// ★ MODELES-DEC (§558) : ce qui touche les modèles (qui les suit, leurs fériés) vit dans planning-modeles.js — trois emprunts
function _planAnneeSuivi(){ return window._planAnneeSuivi.apply(null, arguments); }
function _planAnneeFerieSem(){ return window._planAnneeFerieSem.apply(null, arguments); }
function _planAnneeFeriesBloc(){ return window._planAnneeFeriesBloc.apply(null, arguments); }
function _planAnneeManque(){ return window._planAnneeManque.apply(null, arguments); }   // ★ PREPAN-2 (§560)
// ★ ANNEE-TAB (§548) — L'ÉTAT DE LA VUE VIT ICI : le modèle ouvert, son brouillon, la semaine choisie, les retouches.
//   L'année a son onglet ; la roue crantée ne la porte plus, et rien dans planning.js ne la remet à zéro.
var _paEtat=null;
function _paE(){ return _paEtat; }
// La notation des heures à l'écran : « 8 h 30 », « 1 827 h » — espaces insécables, chiffres alignés.
function _paH(h){if(h==null||isNaN(h))return '\u2014';var neg=h<0,a=Math.abs(h),hh=Math.floor(a+1e-9),mm=Math.round((a-hh)*60);if(mm===60){hh++;mm=0;}
  return (neg?'\u2212':'')+hh.toLocaleString('fr-FR')+'\u00a0h'+(mm?'\u00a0'+(mm<10?'0':'')+mm:'');}
function _planAnneeResumeTxt(v){var JL=['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'],out=[],g=0;
  while(g<7){if(!(v[g]>0)){g++;continue;}var k=g;while(k+1<7&&v[k+1]===v[g])k++;
    out.push((k>g?JL[g]+(k>g+1?' au ':' et ')+JL[k]:JL[g])+' '+_paH(v[g]));g=k+1;}
  var r=out.length?out.join(' \u00b7 '):'aucun jour travaill\u00e9';return r.charAt(0).toUpperCase()+r.slice(1);}

// ★★ FRISE-1 (§539) — L'ANNÉE D'UN MODÈLE, EN FRISE (LECTURE). Lot 3a du chantier « le planning de l'année » (maquette v2) :
//   la grille de 365 cases relue en saisons. Chaque mois prend, jour de la semaine par jour de la semaine, les heures les plus
//   fréquentes de ses jours (fériés et semaines fermées mis à part ; à égalité, la première rencontrée) : c'est sa semaine type.
//   Les mois voisins de même semaine type font une saison. Une semaine dont 3 jours ou plus s'écartent de leur mois est une
//   « semaine à part » (les vendanges) ; un jour qui s'écarte encore est un « jour à part » (la veille de Noël, un jeudi court
//   devant un vendredi férié) ; une semaine dont les jours ouvrés sont tous à 0 h, une fermeture. RIEN N'EST ÉCRIT : l'édition
//   sur la frise viendra (lot 3b) ; d'ici là, « Modifier » ouvre la grille.
var PLAN_MOIS_FR=['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];   // abrégés de la frise (PLAN_MOIS_C, lui, sert le relevé)
function _planAnneeSaison(S,m){for(var k=0;k<S.length;k++)if(m>=S[k].m0&&m<=S[k].m1)return k;return -1;}
function _planAnneeLire(plId,yr,G){
  var t=G||_planGetTpl(plId,yr)||{},F=_feriesY(yr),J=[],i,d,mm,g;
  function raw(m,dd){return parseFloat(t[m]&&t[m][dd])||0;}
  for(d=new Date(yr,0,1);d.getFullYear()===yr;d.setDate(d.getDate()+1)){
    var m=d.getMonth(),dd=d.getDate();
    J.push({i:J.length,m:m,d:dd,g:(d.getDay()+6)%7,h:raw(m,dd),fer:(F[m]&&F[m][dd])||null,w:0,ferme:false,apart:false});
  }
  var w=0;J.forEach(function(x,k){if(k>0&&x.g===0)w++;x.w=w;});             // les semaines, lundi → dimanche
  var sem=[];for(i=0;i<=w;i++)sem.push({h:0,j:[],ferme:false,apart:false});
  J.forEach(function(x){sem[x.w].h+=x.h;sem[x.w].j.push(x);});
  var totAn=0;J.forEach(function(x){totAn+=x.h;});                           // ★ FRISE-4 : une année vide n'a pas de fermetures — elle n'est pas encore construite
  if(totAn>0)sem.forEach(function(s){var ouv=s.j.filter(function(x){return x.g<5&&!x.fer;});
    if(ouv.length&&ouv.every(function(x){return x.h<=0;})){s.ferme=true;s.j.forEach(function(x){x.ferme=true;});}});
  // la semaine type de chaque mois : les heures les plus fréquentes de chaque jour de la semaine
  function _mode(filtre){var cpt={},ordre=[];
      J.forEach(function(x){if(!filtre(x))return;var k=String(x.h);if(!(k in cpt)){cpt[k]=0;ordre.push(k);}cpt[k]++;});
      var best=null,bn=-1;ordre.forEach(function(k){if(cpt[k]>bn){bn=cpt[k];best=k;}});
      return best==null?0:parseFloat(best);}
  // ★★ FRISE-AB (§551) — DEUX SEMAINES QUI ALTERNENT : un jour de la semaine dont les semaines paires et impaires de l'année
  //   tiennent chacune leur valeur, SANS EXCEPTION, sur au moins deux semaines chacune (un vendredi sur deux libre). Un seul
  //   jour qui s'écarte suffit à refuser l'alternance : une semaine à part, un jour à part ne la font pas naître.
  var type=[],typeB=[],ab=[];
  for(mm=0;mm<12;mm++){var v=[],vB=[],alt=false;
    for(g=0;g<7;g++){(function(mo,gg){
      var base=function(x){return x.m===mo&&x.g===gg&&!x.fer&&!x.ferme;},tous=_mode(base);
      var jP=J.filter(function(x){return base(x)&&x.w%2===0;}),jI=J.filter(function(x){return base(x)&&x.w%2===1;});
      var eP=_mode(function(x){return base(x)&&x.w%2===0;}),eI=_mode(function(x){return base(x)&&x.w%2===1;});
      if(eP!==eI&&jP.length>=2&&jI.length>=2&&jP.every(function(x){return x.h===eP;})&&jI.every(function(x){return x.h===eI;})){alt=true;v.push(eP);vB.push(eI);}
      else{v.push(tous);vB.push(tous);}
    })(mm,g);}
    type.push(v);typeB.push(alt?vB:v);ab.push(alt);}
  function tyM(mo,x){return (ab[mo]&&x.w%2===1)?typeB[mo]:type[mo];}   // la semaine type d'un jour : paire ou impaire
  var saisons=[];
  for(mm=0;mm<12;mm++){var c=type[mm].join('|')+(ab[mm]?'/'+typeB[mm].join('|'):''),last=saisons[saisons.length-1],sm=function(a){return a.reduce(function(p,q){return p+q;},0);};
    if(last&&last.cle===c)last.m1=mm;else saisons.push({cle:c,m0:mm,m1:mm,h:type[mm],hB:typeB[mm],ab:ab[mm],tot:ab[mm]?(sm(type[mm])+sm(typeB[mm]))/2:sm(type[mm])});}
  // ★ FRISE-3 (§541) — UN MOIS COUPÉ EN DEUX : sa fin (ou son début) suit déjà la semaine type du mois voisin, sur au moins deux
  //   jours qui l'en distinguent (la fin d'année dès le 16 novembre 2026 : les vendredis 20 et 27 libres). Ces jours passent à la
  //   saison voisine ; la coupe part du lundi de la semaine où un premier jour se distingue (pas d'un samedi vide, ni d'un vendredi pareil).
  function _coupe(mo,sens){if(!type[mo+sens]||(type[mo].join('|')===type[mo+sens].join('|')&&typeB[mo].join('|')===typeB[mo+sens].join('|')))return;
    var T={},U={};   // pour un jour x : T = la semaine type de son mois, U = celle du mois voisin (paire ou impaire)
    var js=J.filter(function(x){return x.m===mo;}),dist=0,q=[];if(sens>0)js.reverse();
    for(var k=0;k<js.length;k++){var x=js[k];if(x.fer||x.ferme){q.push(x);continue;}T=tyM(mo,x);U=tyM(mo+sens,x);if(x.h!==U[x.g])break;if(T[x.g]!==U[x.g])dist++;q.push(x);}
    if(dist<2)return;
    if(sens>0){q.reverse();var fd=null;for(var z=0;z<q.length;z++){var y=q[z];if(!y.fer&&!y.ferme&&tyM(mo,y)[y.g]!==tyM(mo+sens,y)[y.g]){fd=y;break;}}
      if(fd){var lun=fd.i-fd.g;q=q.filter(function(y){return y.i>=lun;});}}   // la coupe part du lundi de la semaine du premier jour qui distingue
    q.forEach(function(x){x.coupe=mo+sens;});}
  for(mm=0;mm<12;mm++){_coupe(mm,1);_coupe(mm,-1);}
  // les semaines à part, APRÈS les coupes : une fin de mois qui suit déjà le mois suivant est une coupe, pas une semaine à part
  sem.forEach(function(s){if(s.ferme)return;var n=s.j.filter(function(x){return !x.fer&&x.h!==tyM(x.coupe!=null?x.coupe:x.m,x)[x.g];}).length;
    if(n>=3){s.apart=true;s.j.forEach(function(x){x.apart=true;});}});
  J.forEach(function(x){x.s=_planAnneeSaison(saisons,x.coupe!=null?x.coupe:x.m);});
  // la semaine A d'une saison : celle de son premier jour régulier ; chaque jour porte sa lettre ; S.h = la semaine A, S.hB = la B
  saisons.forEach(function(S,si){var x0=J.find(function(x){return x.s===si&&!x.ferme&&!x.apart;});S.pA=x0?x0.w%2:0;
    if(S.ab&&S.pA===1){var tmp=S.h;S.h=S.hB;S.hB=tmp;}});
  J.forEach(function(x){var S=saisons[x.s];x.lettre=(S&&x.w%2!==S.pA)?'B':'A';});
  var jours=J.filter(function(x){var T=tyM(x.coupe!=null?x.coupe:x.m,x);return !x.fer&&!x.ferme&&!x.apart&&x.h!==T[x.g];});
  var plages=[],cur=null;
  J.forEach(function(x){var si=x.s,k=x.ferme?'F'+x.w:x.apart?'A'+x.w:'S'+si;
    if(!cur||cur.k!==k){cur={k:k,i0:x.i,i1:x.i,ferme:x.ferme,apart:x.apart,s:(x.ferme||x.apart)?-1:si,w:x.w,h:0};plages.push(cur);}
    cur.i1=x.i;cur.h+=x.h;});
  var fermetures=[],fr=null;                                                   // les fermetures, semaines voisines réunies
  sem.forEach(function(s){if(!s.ferme){fr=null;return;}var a=s.j[0].i,b=s.j[s.j.length-1].i;if(fr&&fr.i1===a-1)fr.i1=b;else{fr={i0:a,i1:b};fermetures.push(fr);}});
  return {J:J,sem:sem,type:type,saisons:saisons,jours:jours,plages:plages,fermetures:fermetures};
}
function _planAnneeTon(t){
  if(t<30)return {bg:'var(--tag-green-bg)',fg:'var(--tag-green-tx)'};
  if(t<35)return {bg:'var(--or-pale)',fg:'var(--texte)'};
  if(t<37)return {bg:'var(--or-clair)',fg:'var(--texte)'};
  if(t<42)return {bg:'var(--terre)',fg:'var(--sur-accent)'};
  return {bg:'var(--accent)',fg:'var(--sur-accent)'};
}
function _planAnneeDate(J,i,long){var x=J[i];return (x.d===1?'1er':x.d)+'\u00a0'+(long?window.PLAN_MOIS[x.m].toLowerCase():PLAN_MOIS_FR[x.m]);}
function _planAnneePlage(J,a,b){if(a===b)return _planAnneeDate(J,a);return (J[a].m===J[b].m?(J[a].d===1?'1er':J[a].d):_planAnneeDate(J,a))+' \u2192 '+_planAnneeDate(J,b);}
function _planAnneeJours(v){var JN=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
  return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0 16px;margin-top:6px">'+v.map(function(x,g){
    return '<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid var(--gris-clair);font-size:var(--pt-txt,13px)"><span>'+JN[g]+'</span>'
      +'<b style="font-variant-numeric:tabular-nums;color:'+(x>0?'var(--texte)':'var(--texte-doux)')+'">'+(x>0?_paH(x):'repos')+'</b></div>';}).join('')+'</div>';}
// ★★ FRISE-2 (§540) — L'ANNÉE D'UN MODÈLE, À RÉGLER SUR LA FRISE. Une saison se règle jour par jour (− / + 30 min) : la retouche
//   va à ses jours « réguliers » (ceux qui suivent sa semaine type) ; jours à part, semaines à part et fermetures ne bougent pas.
//   « Tomber juste » propose une ou deux retouches qui posent le total sur la cible (la base de l'année ; avant 2027, le plafond
//   annuel). Tout se fait sur un BROUILLON (_paEtat.brouillon) : « Enregistrer » écrit la grille de l'année du modèle, ses
//   horaires (_timings…) gardés ; « Annuler » la laisse comme elle était.
function _planAnneeCopie(G){var c={};for(var m=0;m<12;m++){var M=G&&G[m],o={};if(M&&typeof M==='object')for(var k in M){var d=parseInt(k,10),v=parseFloat(M[k]);if(!isNaN(d)&&String(d)===String(k)&&v>0)o[d]=v;}c[m]=o;}return c;}
function _planAnneeTotal(plId,yr,G){if(_planBaseActive(yr))return _planModelBrut(plId,yr,G);var t=0;for(var m=0;m<12;m++)for(var k in (G[m]||{}))t+=parseFloat(G[m][k])||0;return t;}
function _planAnneeCible(plId,yr){return _planBaseActive(yr)?_planBaseAttendue(plId,yr):_planLegal().plafAnnuel;}
function _planAnneePose(G,m,d,v){if(!G[m])G[m]={};if(v>0)G[m][d]=v;else delete G[m][d];}
function _planAnneeReguliers(A,si,g,L){var S=A.saisons[si],v=(L==='B'&&S.hB)?S.hB:S.h;return A.J.filter(function(x){return x.s===si&&x.g===g&&!x.fer&&!x.ferme&&!x.apart&&(!L||x.lettre===L)&&x.h===v[g];});}
function _planAnneePasVal(v,d){var n=Math.round((v+d)*2)/2;if(n>0&&n<3.5)n=d>0?3.5:0;return Math.max(0,n);}
function _planAnneeNomS(S){return '\u00ab\u00a0'+window.PLAN_MOIS[S.m0]+(S.m1>S.m0?' \u2192 '+window.PLAN_MOIS[S.m1].toLowerCase():'')+'\u00a0\u00bb';}
function _planAnneeRetouches(plId,yr,G,maxJ){
  var A=_planAnneeLire(plId,yr,G),M=[],JL=['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
  function liste(gs){if(gs.length>2&&gs[gs.length-1]-gs[0]===gs.length-1)return JL[gs[0]]+' au '+JL[gs[gs.length-1]];return gs.map(function(g){return JL[g];}).join(gs.length===2?' et ':', ');}
  A.saisons.forEach(function(S,si){
    if(S.ab)return;   // ★ FRISE-AB : une saison à deux semaines se règle ligne par ligne
    var pos=S.h.filter(function(x){return x>0;});if(!pos.length)return;
    var mx=Math.max.apply(null,pos),mn=Math.min.apply(null,pos),longs=[],courts=[];
    S.h.forEach(function(x,g){if(x===mx)longs.push(g);else if(x>0&&x===mn)courts.push(g);});
    function ajout(gs,v,dd,cout,cle){var nv=_planAnneePasVal(v,dd);if(nv===v||nv>maxJ||nv<3.5)return;
      var jours=[];gs.forEach(function(g){jours=jours.concat(_planAnneeReguliers(A,si,g));});if(!jours.length)return;
      M.push({cle:cle,cout:cout,lib:_planAnneeNomS(S)+'\u00a0: '+liste(gs)+' '+_paH(nv)+' au lieu de '+_paH(v),fn:function(Q){jours.forEach(function(x){_planAnneePose(Q,x.m,x.d,nv);});}});}
    if(courts.length)[0.5,1,-0.5,-1].forEach(function(dd){if(mn+dd<mx)ajout(courts,mn,dd,Math.abs(dd)>0.5?2:1,'c'+si);});
    [0.5,-0.5].forEach(function(dd){ajout(longs,mx,dd,3,'l'+si);});
  });
  [[11,25,'No\u00ebl'],[11,31,'la Saint-Sylvestre']].forEach(function(v){            // la veille des fêtes : un jour à part
    var k=A.J.findIndex(function(x){return x.m===v[0]&&x.d===v[1];});
    for(var i=k-1;i>=0;i--){var x=A.J[i];if(x.fer)continue;if(x.h>0){[-0.5,-1,0.5].forEach(function(dd){var nv=x.h+dd;if(nv<3.5||nv>maxJ)return;
        M.push({cle:'j'+x.m+'-'+x.d,cout:Math.abs(dd)>0.5?2:1,lib:JL[x.g].charAt(0).toUpperCase()+JL[x.g].slice(1)+' '+(x.d===1?'1er':x.d)+' '+window.PLAN_MOIS[x.m].toLowerCase()+', veille de '+v[2]+'\u00a0: '+_paH(nv)+' au lieu de '+_paH(x.h),fn:function(Q){_planAnneePose(Q,x.m,x.d,nv);}});});break;}}
  });
  for(var si=0;si+1<A.saisons.length;si++){(function(a,b,ia){                     // une semaine de plus, prise sur la saison voisine
    var mA=a.m1,mB=b.m0,nbA=new Date(yr,mA+1,0).getDate();
    var debB=A.J.filter(function(x){return x.m===mB&&x.d<=7&&!x.fer&&!x.ferme&&!x.apart&&x.h===A.type[x.m][x.g];});
    var finA=A.J.filter(function(x){return x.m===mA&&x.d>nbA-7&&!x.fer&&!x.ferme&&!x.apart&&x.h===A.type[x.m][x.g];});
    if(debB.length)M.push({cle:'b'+ia,cout:1,lib:_planAnneeNomS(a)+' une semaine de plus, jusqu\u2019au 7 '+window.PLAN_MOIS[mB].toLowerCase(),fn:function(Q){debB.forEach(function(x){_planAnneePose(Q,x.m,x.d,a.h[x.g]);});}});
    if(finA.length)M.push({cle:'b'+ia,cout:1,lib:_planAnneeNomS(b)+' une semaine plus t\u00f4t, d\u00e8s le '+(nbA-6)+' '+window.PLAN_MOIS[mA].toLowerCase(),fn:function(Q){finA.forEach(function(x){_planAnneePose(Q,x.m,x.d,b.h[x.g]);});}});
  })(A.saisons[si],A.saisons[si+1],si);}
  return M;
}
function _planAnneeSuggestions(plId,yr,G,cible,maxJ){
  var t0=_planAnneeTotal(plId,yr,G),ec=cible-t0;if(Math.abs(ec)<0.01)return [];
  var M=_planAnneeRetouches(plId,yr,G,maxJ),C=[],out=[],vus={};
  M.forEach(function(m){var Q=_planAnneeCopie(G);m.fn(Q);m.d=_planAnneeTotal(plId,yr,Q)-t0;});
  M=M.filter(function(m){return ec>0?m.d>0.001:m.d<-0.001;});                       // dans le sens de l'écart
  M.forEach(function(m){if(Math.abs(m.d)<=Math.abs(ec)+0.26)C.push({mv:[m],t:t0+m.d,cout:m.cout});});
  for(var a=0;a<M.length;a++)for(var b=a+1;b<M.length;b++){if(M[a].cle===M[b].cle||Math.abs(M[a].d+M[b].d-ec)>0.26)continue;
    var Q=_planAnneeCopie(G);M[a].fn(Q);M[b].fn(Q);C.push({mv:[M[a],M[b]],t:_planAnneeTotal(plId,yr,Q),cout:M[a].cout+M[b].cout+1});}
  C.forEach(function(c){c.reste=cible-c.t;c.score=Math.abs(c.reste)*20+c.cout;});
  C.sort(function(x,y){return x.score-y.score;});
  for(var k=0;k<C.length&&out.length<3;k++){var sg=C[k].mv.map(function(m){return m.lib;}).join('+');if(vus[sg])continue;vus[sg]=1;out.push(C[k]);}
  return out;
}
function _planAnneeGrille(){var E=_paE();if(!E||!E.annee)return null;return E.brouillon||_planGetTpl(E.annee,_pY())||{};}
function _planAnneeJoursEd(v,si,adm,L){var JN=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
  if(!adm)return _planAnneeJours(v);
  var dl=L?' data-l="'+L+'"':'';
  return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:0 16px;margin-top:6px">'+v.map(function(x,g){
    var tuP=(si===0&&g===4&&L!=='B')?' data-tuto="plan.annee.pas"':'',tuM=(si===0&&g===4&&L==='B')?' data-tuto="plan.annee.abpas"':'';
    return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--gris-clair);font-size:var(--pt-txt,13px)"><span style="flex:1">'+JN[g]+'</span>'
      +'<button class="plan-btn-pdf" data-s="'+si+'" data-g="'+g+'" data-d="-0.5"'+dl+tuM+' aria-label="'+JN[g]+(L?' semaine '+L:'')+' moins 30 min" onclick="planAnneePas(this)">\u2212</button>'
      +'<b style="min-width:4.4em;text-align:center;font-variant-numeric:tabular-nums;color:'+(x>0?'var(--texte)':'var(--texte-doux)')+'">'+(x>0?_paH(x):'repos')+'</b>'
      +'<button class="plan-btn-pdf" data-s="'+si+'" data-g="'+g+'" data-d="0.5"'+dl+tuP+' aria-label="'+JN[g]+(L?' semaine '+L:'')+' plus 30 min" onclick="planAnneePas(this)">+</button></div>';}).join('')+'</div>';}
// ★★ FRISE-AB (§551) — l'éditeur d'une saison : une semaine, ou les semaines A et B qui alternent (« Une semaine sur deux » ouvre la
//   ligne B ; sa première retouche fait naître l'alternance dans la grille, que la frise lit ; « Une seule semaine » la retire).
function _planAnneeCleS(A,si){var x=A.J.find(function(y){return y.s===si&&!y.ferme&&!y.apart;});return x?String(x.i):'';}
function _planAnneeResumeAB(sa){var bas=function(t){return t.charAt(0).toLowerCase()+t.slice(1);};
  return sa.ab?'Semaine A\u00a0: '+bas(_planAnneeResumeTxt(sa.h))+' \u00b7 Semaine B\u00a0: '+bas(_planAnneeResumeTxt(sa.hB)):_planAnneeResumeTxt(sa.h);}
function _planAnneeEditeurSaison(A,sa,si,adm,E){
  var k=_planAnneeCleS(A,si),deux=sa.ab||!!(E&&E.ab&&E.ab[k]);
  if(!deux)return _planAnneeJoursEd(sa.h,si,adm)+(adm?'<div style="margin-top:8px"><button class="plan-btn-pdf"'+(si===0?' data-tuto="plan.annee.ab"':'')+' data-s="'+si+'" onclick="planAnneeAB(this)">Une semaine sur deux</button></div>':'');
  var x0=A.J.find(function(y){return y.s===si&&!y.ferme&&!y.apart;}),lun=x0?_planAnneeDate(A.J,Math.max(0,x0.i-x0.g),true):'';
  var tl='font-size:var(--pt-micro,11px);font-weight:700;margin-top:8px;color:var(--texte-doux)';
  return '<div style="'+tl+'">Semaine A</div>'+_planAnneeJoursEd(sa.h,si,adm,'A')
    +'<div style="'+tl+'">Semaine B</div>'+_planAnneeJoursEd(sa.hB||sa.h,si,adm,'B')
    +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;font-size:var(--pt-micro,11px);color:var(--texte-doux)">'
    +(adm?'<button class="plan-btn-pdf"'+(si===0?' data-tuto="plan.annee.ab1"':'')+' data-s="'+si+'" onclick="planAnneeUneSemaine(this)">Une seule semaine</button>':'')
    +(lun?'<span>La semaine du '+lun+' est une semaine A\u00a0; elles alternent ensuite.</span>':'')+'</div>';}
function planAnneeAB(el){var E=_paE();if(!E||!E.annee||!el)return;var si=parseInt(el.dataset.s,10),A=_planAnneeLire(E.annee,_pY(),_planAnneeGrille());if(!A.saisons[si])return;
  E.ab=E.ab||{};E.ab[_planAnneeCleS(A,si)]=true;_planRenderAnnee();}
function planAnneeUneSemaine(el){
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee||!el)return;
  var si=parseInt(el.dataset.s,10),G=_planAnneeBrouillon(E),A=_planAnneeLire(E.annee,_pY(),G),S=A.saisons[si];if(!S)return;
  A.J.forEach(function(x){if(x.s===si&&x.lettre==='B'&&!x.fer&&!x.ferme&&!x.apart&&x.h===S.hB[x.g])_planAnneePose(G,x.m,x.d,S.h[x.g]);});
  if(E.ab)delete E.ab[_planAnneeCleS(A,si)];E.brouillon=G;E.n=(E.n||0)+1;E.sugg=false;_planRenderAnnee();
}
function _planAnneeSemaineAB(plId,yr){var t=new Date();if(t.getFullYear()!==yr)return null;var A=_planAnneeLire(plId,yr),x=A.J.find(function(y){return y.m===t.getMonth()&&y.d===t.getDate();});
  var S=x&&A.saisons[x.s];return (S&&S.ab&&!x.ferme&&!x.apart)?x.lettre:null;}
function planAnneePas(el){
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee||!el)return;
  var si=parseInt(el.dataset.s,10),g=parseInt(el.dataset.g,10),dd=parseFloat(el.dataset.d)||0,yr=_pY(),L=el.dataset.l||'';   // ★ FRISE-AB : la semaine A ou B
  var G=E.brouillon||_planAnneeCopie(_planGetTpl(E.annee,yr)||{}),A=_planAnneeLire(E.annee,yr,G),S=A.saisons[si];if(!S||isNaN(g))return;
  var v=((L==='B'&&S.hB)?S.hB:S.h)[g],nv=_planAnneePasVal(v,dd);if(nv===v||nv>_planLegal().maxJour)return;
  _planAnneeReguliers(A,si,g,L).forEach(function(x){_planAnneePose(G,x.m,x.d,nv);});
  E.brouillon=G;E.n=(E.n||0)+1;E.sugg=false;_planRenderAnnee();
}
function planAnneeJuste(){var E=_paE();if(!E||!E.annee)return;E.sugg=!E.sugg;_planRenderAnnee();}
function planAnneeAppliquer(el){
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee||!el||!E.sg)return;
  var c=E.sg[parseInt(el.dataset.k,10)];if(!c)return;
  var G=E.brouillon||_planAnneeCopie(_planGetTpl(E.annee,_pY())||{});c.mv.forEach(function(m){m.fn(G);});
  E.brouillon=G;E.n=(E.n||0)+1;E.sugg=false;_planRenderAnnee();
}
function planAnneeEnregistrer(){
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee||!E.brouillon)return;
  var id=E.annee,st=_pTplStore(),old=st[id]||_planGetTpl(id,_pY())||{},neuf={};   // ★ PREPAN-2 (§560) : un modèle neuf sur l'année garde les horaires du modèle qu'il reprend
  Object.keys(old).forEach(function(k){if(isNaN(parseInt(k,10)))neuf[k]=old[k];});     // les horaires (_timings…) restent
  if(E.meta)['_timings','_timings_jour','_horaires_dma'].forEach(function(k){var v=E.meta[k];if(v&&Object.keys(v).length)neuf[k]=v;else delete neuf[k];});   // ★ HOR-1 : les horaires du brouillon
  for(var m=0;m<12;m++)neuf[m]=E.brouillon[m]||{};
  st[id]=neuf;E.brouillon=null;E.meta=null;E.sugg=false;planSaveTpl(id);_planRenderAnnee();
}
function planAnneeAnnuler(){var E=_paE();if(!E||!E.annee)return;E.brouillon=null;E.meta=null;E.jourSel=null;E.sugg=false;_planRenderAnnee();}
// ★ FRISE-3 (§541) — déplacer la coupe entre deux saisons d'une semaine ; régler un jour à part ; remettre un jour ou une semaine à part
//   « comme la saison ». Les mêmes règles : le brouillon, les jours réguliers seulement, rien d'écrit avant « Enregistrer ».
function _planAnneeBrouillon(E){return E.brouillon||_planAnneeCopie(_planGetTpl(E.annee,_pY())||{});}
// ★★ HOR-1 (§550) — LES HORAIRES SUR LA FRISE (lot 5a, maquette v3 validée : « go », coupure unique). La prise de poste se règle
//   par saison — elle s'écrit dans les mois de la saison (_timings[m].d), là où le relevé, les retards et le planning imprimé la
//   lisent déjà ; la coupure reste celle du domaine (PLAN_PAUSE_MIN, roue crantée) ; la fin ne se tape jamais : début + heures +
//   coupure (dès 6 h). Un jour peut avoir sa propre prise (_timings_jour[m][d] = {d:'09:00'}) ; les codes D, M et A d'un modèle
//   importé s'écrivent, une fois, en heures exactes ({d,f}). Tout sur le brouillon (E.meta), écrit par « Enregistrer ».
function _planAnneeMetaCopie(T){var o={};['_timings','_timings_jour','_horaires_dma'].forEach(function(k){o[k]=(T&&T[k]&&typeof T[k]==='object')?JSON.parse(JSON.stringify(T[k])):{};});return o;}
function _planAnneeMeta(E){return (E&&E.meta)||_planAnneeMetaCopie(_planGetTpl(E.annee,_pY())||{});}
function _planAnneeMetaEd(E){if(!E.meta)E.meta=_planAnneeMetaCopie(_planGetTpl(E.annee,_pY())||{});if(!E.brouillon)E.brouillon=_planAnneeBrouillon(E);return E.meta;}
function _paMinT(t){var q=String(t||'').split(':');return (parseInt(q[0],10)||0)*60+(parseInt(q[1],10)||0);}
function _paHHMM(min){min=Math.max(240,Math.min(720,min));return String(Math.floor(min/60)).padStart(2,'0')+':'+String(min%60).padStart(2,'0');}
function _paHm(t){var x=_paMinT(t),h=Math.floor(x/60),m=x%60;return h+'\u00a0h\u00a0'+(m<10?'0':'')+m;}
// l'horaire d'un jour, lu comme _planDefTiming le lit — mais sur le brouillon (mv-harnais-hor1 les compare)
function _planAnneeHoraire(meta,m,d,h){
  if(!(h>0))return null;
  var P=(window.PLAN_PAUSE_MIN!=null?window.PLAN_PAUSE_MIN:60),hm=function(v){return (typeof v==='string'&&/^([01]?\d|2[0-3]):[0-5]\d$/.test(v))?v:'';};
  var fin=function(dbt,cont){var e=_paMinT(dbt)+Math.round(h*60)+((!cont&&h>=6)?P:0);return String(Math.floor(e/60)).padStart(2,'0')+':'+String(e%60).padStart(2,'0');};
  var tj=meta&&meta._timings_jour&&meta._timings_jour[m]&&meta._timings_jour[m][d],mt=meta&&meta._timings&&meta._timings[m];
  if(tj&&typeof tj==='object'&&hm(tj.d))return {d:hm(tj.d),f:hm(tj.f)||fin(hm(tj.d),false),jour:true};
  if(typeof tj==='string'&&tj){var dma=(meta._horaires_dma&&typeof meta._horaires_dma==='object')?meta._horaires_dma:{},bd=(mt&&(mt.d||mt.debut))||'07:00',bf=(mt&&(mt.f||mt.fin))||'16:30',dd=hm(dma.decale)||'09:00',fc=hm(dma.fin)||'16:30';
    if(tj==='M')return {d:dd,f:fc,code:'M'};if(tj==='A')return {d:dd,f:bf,code:'A'};return {d:bd,f:fc,code:'D'};}
  if(mt){var dbt=mt.d||mt.debut||'07:00';return {d:dbt,f:fin(dbt,mt.continu)};}
  var T=window.PLAN_DEF_T&&window.PLAN_DEF_T[h];return T?{d:T.d,f:T.f}:{d:'07:00',f:fin('07:00',false)};
}
function _planAnneePriseSaison(A,si,meta){var x=A.J.find(function(y){return y.s===si&&!y.fer&&!y.ferme&&!y.apart&&y.h>0&&!(meta._timings_jour&&meta._timings_jour[y.m]&&meta._timings_jour[y.m][y.d]);});
  if(!x)return '07:00';var t=_planAnneeHoraire(meta,x.m,x.d,x.h);return t?t.d:'07:00';}
function _planAnneeHorairesTxt(A,si,meta){var S=A.saisons[si],JL=['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'],out=[],g=0;
  while(g<7){if(!(S.h[g]>0)){g++;continue;}var k=g;while(k+1<7&&S.h[k+1]===S.h[g])k++;
    var x=A.J.find(function(y){return y.s===si&&y.g===g&&!y.fer&&!y.ferme&&!y.apart&&y.h===S.h[g];}),t=x?_planAnneeHoraire(meta,x.m,x.d,x.h):null;
    if(t)out.push((k>g?JL[g]+(k>g+1?' au ':' et ')+JL[k]:JL[g])+' '+_paHm(t.d)+' \u2192 '+_paHm(t.f));g=k+1;}
  var r=out.join(' \u00b7 ');return r?r.charAt(0).toUpperCase()+r.slice(1):'';}
function _planAnneeCodes(meta){var n=0,TJ=meta&&meta._timings_jour||{};Object.keys(TJ).forEach(function(m){Object.keys(TJ[m]||{}).forEach(function(d){if(typeof TJ[m][d]==='string'&&TJ[m][d])n++;});});return n;}
function planAnneePrise(el){
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee||!el)return;
  var si=parseInt(el.dataset.s,10),p=parseInt(el.dataset.p,10)||0,meta=_planAnneeMetaEd(E),A=_planAnneeLire(E.annee,_pY(),E.brouillon),S=A.saisons[si];if(!S||!p)return;
  var nv=_paHHMM(_paMinT(_planAnneePriseSaison(A,si,meta))+p);
  for(var m=S.m0;m<=S.m1;m++)meta._timings[m]=Object.assign({},meta._timings[m]||{},{d:nv});
  E.n=(E.n||0)+1;E.sugg=false;_planRenderAnnee();
}
function planAnneeJourSel(el){var E=_paE();if(!E||!E.annee||!el)return;E.jourSel={m:parseInt(el.dataset.m,10),d:parseInt(el.dataset.j,10)};_planRenderAnnee();}
function planAnneePriseJour(el){
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee||!el||!E.jourSel)return;
  var meta=_planAnneeMetaEd(E),m=E.jourSel.m,d=E.jourSel.d,p=parseInt(el.dataset.p,10)||0;
  if(!meta._timings_jour[m])meta._timings_jour[m]={};
  if(!p){delete meta._timings_jour[m][d];}
  else{var h=parseFloat(E.brouillon[m]&&E.brouillon[m][d])||0,t=_planAnneeHoraire(meta,m,d,h)||{d:'07:00'};meta._timings_jour[m][d]={d:_paHHMM(_paMinT(t.d)+p)};}
  E.n=(E.n||0)+1;E.sugg=false;_planRenderAnnee();
}
function planAnneeDma(){
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee)return;
  var meta=_planAnneeMetaEd(E),TJ=meta._timings_jour,n=0;
  Object.keys(TJ).forEach(function(m){Object.keys(TJ[m]||{}).forEach(function(d){var c=TJ[m][d];if(typeof c!=='string'||!c)return;var t=_planAnneeHoraire(meta,+m,+d,1);TJ[m][d]={d:t.d,f:t.f};n++;});});
  E.n=(E.n||0)+1;_planRenderAnnee();if(n&&window.showToast)window.showToast(n+' jour'+(n>1?'s':'')+' en clair \u2014 \u00ab\u00a0Enregistrer\u00a0\u00bb pour garder','#3D6B27');
}
function planAnneeCoupe(el){
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee||!el)return;
  var si=parseInt(el.dataset.s,10),n=parseInt(el.dataset.n,10),G=_planAnneeBrouillon(E),A=_planAnneeLire(E.annee,_pY(),G),S=A.saisons[si],P=A.saisons[si-1];
  if(!S||!P||!n)return;
  var b=-1;for(var i=0;i<A.J.length;i++){var x=A.J[i];if(x.s===si&&!x.ferme&&!x.apart){b=i;break;}}if(b<0)return;
  if(n<0)A.J.slice(Math.max(0,b+n),b).forEach(function(x){if(x.s===si-1&&!x.fer&&!x.ferme&&!x.apart&&x.h===P.h[x.g])_planAnneePose(G,x.m,x.d,S.h[x.g]);});
  else A.J.slice(b,b+n).forEach(function(x){if(x.s===si&&!x.fer&&!x.ferme&&!x.apart&&x.h===S.h[x.g])_planAnneePose(G,x.m,x.d,P.h[x.g]);});
  E.brouillon=G;E.n=(E.n||0)+1;E.sugg=false;_planRenderAnnee();
}
function planAnneeJour(el){
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee||!el)return;
  var m=parseInt(el.dataset.m,10),j=parseInt(el.dataset.j,10),p=parseFloat(el.dataset.p)||0,G=_planAnneeBrouillon(E);
  var v=parseFloat(G[m]&&G[m][j])||0,nv=_planAnneePasVal(v,p);if(nv===v||nv>_planLegal().maxJour)return;
  _planAnneePose(G,m,j,nv);E.brouillon=G;E.n=(E.n||0)+1;E.sugg=false;_planRenderAnnee();
}
function planAnneeRemettre(el){
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee||!el)return;
  var G=_planAnneeBrouillon(E),A=_planAnneeLire(E.annee,_pY(),G),jours;
  if(el.dataset.w!=null){var w=parseInt(el.dataset.w,10);jours=A.J.filter(function(x){return x.w===w&&!x.fer;});}   // une semaine fermée se rouvre ainsi (FRISE-4)
  else{var m=parseInt(el.dataset.m,10),j=parseInt(el.dataset.j,10);jours=A.J.filter(function(x){return x.m===m&&x.d===j&&!x.fer;});}
  jours.forEach(function(x){var S=A.saisons[x.s];if(S)_planAnneePose(G,x.m,x.d,S.h[x.g]);});
  E.brouillon=G;E.n=(E.n||0)+1;E.sugg=false;_planRenderAnnee();
}
// pour les tutos : ce que montre la vue, sans rien exposer d'autre
function _planAnneeEtat(){var E=_paE();return {ouvert:!!(E&&E.annee),modele:(E&&E.annee)||null,brouillon:!!(E&&E.brouillon),n:(E&&E.n)||0,semaine:(E&&E.semaine!=null)?E.semaine:null};}
// ★★ FRISE-4 (§543) — UNE SEMAINE, RÉGLÉE SUR LA FRISE : la frise sait tout faire de la grille de 365 cases. On choisit une semaine
//   (précédente / suivante ; par défaut celle d'aujourd'hui, ou la première qui travaille) ; ses jours se règlent un par un (− / +,
//   n'importe quel jour) ; on la ferme, on la rouvre « comme la saison » ; et « changer le rythme à partir d'ici » règle un jour
//   de la semaine sur tous les jours réguliers de sa saison, de cette semaine jusqu'à sa fin — la frise en fait une nouvelle saison
//   (une coupe). Une année vide n'a pas de fermetures : ses saisons se règlent avec − et +, elle se construit.
function _planAnneeSemDefaut(A,yr){var t=new Date();
  if(t.getFullYear()===yr){var x=A.J.find(function(y){return y.m===t.getMonth()&&y.d===t.getDate();});if(x)return x.w;}
  for(var k=0;k<A.sem.length;k++)if(A.sem[k].h>0)return k;return 0;}
function _planAnneeSemSel(A,E,yr){return (E&&E.semaine!=null&&A.sem[E.semaine])?E.semaine:_planAnneeSemDefaut(A,yr);}
function planAnneeSemaine(el){
  var E=_paE();if(!E||!E.annee||!el)return;var yr=_pY(),A=_planAnneeLire(E.annee,yr,_planAnneeGrille());
  E.semaine=Math.max(0,Math.min(A.sem.length-1,_planAnneeSemSel(A,E,yr)+(parseInt(el.dataset.d,10)||0)));_planRenderAnnee();
}
function planAnneeFermeSem(el){
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee||!el)return;
  var w=parseInt(el.dataset.w,10),G=_planAnneeBrouillon(E),A=_planAnneeLire(E.annee,_pY(),G);if(!A.sem[w])return;
  A.J.forEach(function(x){if(x.w===w&&!x.fer)_planAnneePose(G,x.m,x.d,0);});
  E.brouillon=G;E.n=(E.n||0)+1;E.sugg=false;_planRenderAnnee();
}
function planAnneeDesIci(el){
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee||!el)return;
  var w=parseInt(el.dataset.w,10),g=parseInt(el.dataset.g,10),p=parseFloat(el.dataset.p)||0,G=_planAnneeBrouillon(E),A=_planAnneeLire(E.annee,_pY(),G),Sm=A.sem[w];
  if(!Sm||isNaN(g))return;var si=-1;Sm.j.forEach(function(x){if(si<0&&!x.fer)si=x.s;});var S=A.saisons[si];if(!S)return;
  var v=S.h[g],nv=_planAnneePasVal(v,p),debut=Sm.j[0].i;if(nv===v||nv>_planLegal().maxJour)return;
  A.J.forEach(function(x){if(x.i>=debut&&x.s===si&&x.g===g&&!x.fer&&!x.ferme&&!x.apart&&x.h===v)_planAnneePose(G,x.m,x.d,nv);});
  E.brouillon=G;E.n=(E.n||0)+1;E.sugg=false;_planRenderAnnee();
}
function _planRenderAnnee(){
  var body=document.getElementById('plan-body'),E=_paE();if(!body)return;   // ★ ANNEE-TAB : l'onglet L'année
  if(!E||!E.annee)E=_paEtat={annee:_planAnneeModeleDefaut()};
  var MT=_planAnneeMeta(E);   // ★ HOR-1 : les horaires (brouillon ou modèle)
  var id=E.annee,yr=_pY(),G=_planAnneeGrille(),A=_planAnneeLire(id,yr,G),J=A.J,N=J.length,L=_planLegal(),nv=_planBaseActive(yr),adm=(typeof isAdmin==='function')&&isAdmin(),sel=_planAnneeSemSel(A,E,yr);
  var tot=0;J.forEach(function(x){tot+=x.h;});
  var fer=0,nf=0;if(nv)J.forEach(function(x){if(x.fer){var c=_planCreditFerie(id,yr,x.m,x.d,G);if(c>0){fer+=c;nf++;}}});
  var brut=nv?_planModelBrut(id,yr,G):tot,att=_planAnneeCible(id,yr),ec=Math.round((brut-att)*10)/10;
  var gens=_planMbrs().filter(function(m){return _planPlId(m)===id;});
  var _nc=adm?_planAnneeCodes(MT):0;
  var h=_planAnneeChoix(id,E)+(_nc?'<div class="plan-card" style="margin-bottom:10px"><div style="font-size:var(--pt-txt,13px)">Ce mod\u00e8le porte '+_nc+' code'+(_nc>1?'s':'')+' D, M ou A (horaires d\u00e9cal\u00e9s)\u00a0: les \u00e9crire en heures, une fois, sans rien changer aux heures ni \u00e0 la paie.</div><button class="plan-btn-saisir" style="margin-top:8px" onclick="planAnneeDma()">\u00c9crire les horaires en clair</button></div>':'')+'<div class="plan-card"><div class="plan-card-lbl">L\u2019ann\u00e9e du mod\u00e8le \u00ab\u00a0'+_escHtml(id)+'\u00a0\u00bb \u00b7 '+yr+'</div>'+_planAnneeSuivi(id,gens,adm)+_planAnneeManque(id,yr,adm,E);   // ★ MODSUIVI-1 (§555) ; ★ PREPAN-2 (§560) : le modèle absent de l'année le dit
  h+='<div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-top:8px"><b style="font-size:var(--pt-xl,24px);font-variant-numeric:tabular-nums">'+_paH(brut)+'</b>'
    +'<span style="color:var(--texte-doux)">sur '+_paH(att)+(nv?', la base de l\u2019ann\u00e9e':', le plafond annuel')+'</span>'
    +(Math.abs(ec)<0.05?'<span class="mvpas mvpas-statut mvpas-fait">juste</span>':'<span class="mvpas mvpas-statut mvpas-surveiller">'+(ec<0?'il manque '+_paH(-ec):_paH(ec)+' de trop')+'</span>')+'</div>'
    +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);line-height:1.5;margin-top:4px">'
    +(nv?_paH(tot)+' de travail + '+_paH(fer)+' de f\u00e9ri\u00e9s ch\u00f4m\u00e9s ('+nf+' jours), compt\u00e9s pour leurs heures pr\u00e9vues':_paH(tot)+' de travail pr\u00e9vu')
    +'</div>';   // ★ MODSUIVI-1 (§555) : qui suit le modèle se dit en tête de la carte, plus en fin de ligne
  if(adm){                                                     // ★ FRISE-2 : tomber juste, enregistrer, annuler
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">';
    if(Math.abs(ec)>=0.05)h+='<button class="plan-btn-saisir" data-tuto="plan.annee.juste" onclick="planAnneeJuste()">'+(E.sugg?'Masquer les retouches':'Tomber juste')+'</button>';
    h+='<button class="plan-btn-pdf" data-pl="'+_escAttr(id)+'" onclick="planExportCSV(this.dataset.pl)">Exporter (CSV)</button>';
    if(E.brouillon)h+='<button class="plan-btn-saisir" data-tuto="plan.annee.enr" onclick="planAnneeEnregistrer()">Enregistrer</button><button class="plan-btn-pdf" data-tuto="plan.annee.ann" onclick="planAnneeAnnuler()">Annuler</button>';
    h+='</div>';
    if(E.brouillon)h+='<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:6px">Modifications pas encore enregistr\u00e9es.</div>';
    if(E.sugg){E.sg=_planAnneeSuggestions(id,yr,G,att,L.maxJour);
      h+='<div style="display:grid;gap:8px;margin-top:10px">'+(E.sg.length?'':'<div style="font-size:var(--pt-txt,13px);color:var(--texte-doux)">Aucune retouche simple ne tombe juste\u00a0: r\u00e8gle une saison avec \u2212 et +.</div>');
      E.sg.forEach(function(c,k){h+='<div style="border:1px solid var(--gris-clair);border-radius:10px;padding:10px;display:grid;gap:6px">'
          +c.mv.map(function(m){return '<div style="font-size:var(--pt-txt,13px)">'+_escHtml(m.lib)+' <span style="color:var(--texte-doux)">('+(m.d>0?'+':'')+_paH(m.d)+')</span></div>';}).join('')
          +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:var(--pt-micro,11px);color:var(--texte-doux)"><span>= <b>'+_paH(c.t)+'</b>'+(Math.abs(c.reste)<0.05?' \u00b7 juste':(c.reste>0?' \u00b7 il manque '+_paH(c.reste):' \u00b7 '+_paH(-c.reste)+' de trop'))+'</span>'
          +'<button class="plan-btn-pdf"'+(k===0?' data-tuto="plan.annee.appl"':'')+' data-k="'+k+'" onclick="planAnneeAppliquer(this)">Appliquer</button></div></div>';});
      h+='</div>';}
  }
  // la frise : une couleur par saison, les semaines à part, les fermetures hachurées, les fériés, une barre par semaine
  var ferme='repeating-linear-gradient(135deg,var(--gris-clair) 0 4px,transparent 4px 8px)';
  h+='<div data-tuto="plan.annee.frise" style="position:relative;margin-top:14px;padding-top:16px">';
  for(var m=0;m<12;m++){var i0=0;while(i0<N&&J[i0].m!==m)i0++;
    h+='<span style="position:absolute;top:0;left:'+(i0/N*100)+'%;font-size:var(--pt-micro,11px);color:var(--texte-doux);padding-left:3px;border-left:1px solid var(--gris-clair)">'+PLAN_MOIS_FR[m]+'</span>';}
  h+='<div style="position:relative;height:38px;border-radius:8px;overflow:hidden;background:var(--fond-doux,var(--gris-clair))">';
  A.plages.forEach(function(p){var l=p.i0/N*100,wd=(p.i1-p.i0+1)/N*100,st='position:absolute;top:0;bottom:0;left:'+l+'%;width:'+wd+'%;display:flex;align-items:center;justify-content:center;font-size:var(--pt-micro,11px);font-weight:700;overflow:hidden;white-space:nowrap;border-right:1px solid var(--carte,#fff)';
    if(p.ferme){h+='<div style="'+st+';background:'+ferme+';color:var(--texte-doux)" title="'+_escAttr('Ferm\u00e9 \u2014 '+_planAnneePlage(J,p.i0,p.i1))+'"></div>';return;}
    var sh=p.apart?A.sem[p.w].h:A.saisons[p.s].tot,tn=_planAnneeTon(sh);
    var tip=(p.apart?'Semaine \u00e0 part':'Saison')+' \u2014 '+_planAnneePlage(J,p.i0,p.i1)+' \u00b7 '+_paH(sh)+' par semaine';
    h+='<div style="'+st+';background:'+tn.bg+';color:'+tn.fg+(p.apart?';box-shadow:inset 0 0 0 2px var(--texte)':'')+'" title="'+_escAttr(tip)+'">'+(wd>3.2?_paH(sh):'')+'</div>';});
  h+='</div><div style="position:relative;height:12px;margin-top:2px">';
  J.forEach(function(x){if(!x.fer)return;h+='<span style="position:absolute;top:2px;left:'+((x.i+0.5)/N*100)+'%;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:var(--texte-doux)" title="'+_escAttr(x.fer+' \u2014 '+_planAnneeDate(J,x.i,true))+'"></span>';});
  h+='</div><div style="position:relative;height:84px;border-bottom:1px solid var(--gris-clair)">';
  A.sem.forEach(function(s,k){var a=s.j[0].i,b=s.j[s.j.length-1].i,l=a/N*100,wd=(b-a+1)/N*100,vu=(adm&&k===sel)?';outline:2px solid var(--texte);outline-offset:1px':'',tip='Semaine du '+_planAnneePlage(J,a,b)+' \u2014 '+(s.h>0?_paH(s.h):'rien de pr\u00e9vu');
    if(s.ferme){h+='<div style="position:absolute;bottom:0;height:5px;left:calc('+l+'% + 1px);width:calc('+wd+'% - 2px);background:'+ferme+vu+'" title="'+_escAttr(tip+' \u00b7 ferm\u00e9')+'"></div>';return;}
    if(s.h<=0)return;var tn=_planAnneeTon(s.apart?s.h:(A.saisons[_planAnneeSaison(A.saisons,s.j[0].m)]||{tot:s.h}).tot);
    h+='<div style="position:absolute;bottom:0;left:calc('+l+'% + 1px);width:calc('+wd+'% - 2px);height:'+(Math.min(s.h,50)/50*100)+'%;background:'+tn.bg+';border-radius:2px 2px 0 0'+vu+'" title="'+_escAttr(tip)+'"></div>';});
  h+='<div style="position:absolute;left:0;right:0;bottom:'+(L.hebdoLeg/50*100)+'%;border-top:1.5px dashed var(--texte-doux)"></div></div>';
  // la bande des congés : qui, de ce modèle, a posé des congés cette semaine-là
  var cpS=[];A.sem.forEach(function(){cpS.push([]);});
  gens.forEach(function(mb){var Y=(window.PLANNING_ENTRIES[mb.nom]||{})[yr]||{};J.forEach(function(x){var e=(Y[x.m]||{})[x.d];if(e&&e.type==='cp'&&cpS[x.w].indexOf(mb.nom)<0)cpS[x.w].push(mb.nom);});});
  if(cpS.some(function(q){return q.length;})){h+='<div style="position:relative;height:8px;margin-top:3px">';
    A.sem.forEach(function(s,k){if(!cpS[k].length)return;var a=s.j[0].i,b=s.j[s.j.length-1].i;
      h+='<div style="position:absolute;top:0;height:6px;left:calc('+(a/N*100)+'% + 1px);width:calc('+((b-a+1)/N*100)+'% - 2px);background:var(--accent);opacity:'+Math.min(1,0.35+0.2*cpS[k].length)+';border-radius:2px" title="'+_escAttr('En cong\u00e9\u00a0: '+cpS[k].join(', '))+'"></div>';});
    h+='</div>';}
  h+='</div>';
  // les saisons, les semaines à part, les fermetures, les jours à part
  if(adm&&A.sem[sel]){                                         // ★ FRISE-4 · ANNEE-TAB : la semaine choisie, réglée jour par jour, en lignes
    var Sw=A.sem[sel],a0=Sw.j[0].i,b0=Sw.j[Sw.j.length-1].i,JN=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'],JC=['lun.','mar.','mer.','jeu.','ven.','sam.','dim.'],si0=-1;
    Sw.j.forEach(function(x){if(si0<0&&!x.fer)si0=x.s;});var Ssw=A.saisons[si0];
    var diff=!!Ssw&&Sw.j.some(function(x){return !x.fer&&x.h!==Ssw.h[x.g];}),finS=-1;J.forEach(function(x){if(x.s===si0&&!x.ferme&&!x.apart)finS=x.i;});
    var row='display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--gris-clair);font-size:var(--pt-txt,13px)';
    var hv=function(v){return '<b style="min-width:4.4em;text-align:center;font-variant-numeric:tabular-nums;color:'+(v>0?'var(--texte)':'var(--texte-doux)')+'">'+(v>0?_paH(v):'repos')+'</b>';};
    h+='<div data-tuto="plan.annee.semp" style="margin-top:14px;border:1px solid var(--gris-clair);border-radius:10px;padding:12px;display:grid;gap:8px">'
      +'<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><button class="plan-btn-pdf" data-d="-1" onclick="planAnneeSemaine(this)">Pr\u00e9c\u00e9dente</button>'
      +'<b style="flex:1;text-align:center">Semaine du '+_planAnneePlage(J,a0,b0)+' \u00b7 '+_paH(Sw.h)+(Sw.ferme?' \u00b7 ferm\u00e9e':'')+'</b>'
      +'<button class="plan-btn-pdf" data-tuto="plan.annee.sem" data-d="1" onclick="planAnneeSemaine(this)">Suivante</button></div>'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:0 16px">'+Sw.j.map(function(x){
          return '<div style="'+row+'"><span style="flex:1">'+JC[x.g]+' '+(x.d===1?'1er':x.d)+' '+PLAN_MOIS_FR[x.m]+'</span>'
            +(x.fer?_planAnneeFerieSem(x,A,yr,JN[x.g],adm)   // ★ FERIES-1 (§556) : le férié montre ses heures, se chôme, se travaille
              :'<button class="plan-btn-pdf" data-m="'+x.m+'" data-j="'+x.d+'" data-p="-0.5" aria-label="'+JN[x.g]+' '+x.d+' moins 30 min" onclick="planAnneeJour(this)">\u2212</button>'+hv(x.h)
              +'<button class="plan-btn-pdf" data-m="'+x.m+'" data-j="'+x.d+'" data-p="0.5" aria-label="'+JN[x.g]+' '+x.d+' plus 30 min" onclick="planAnneeJour(this)">+</button>'
              +(function(){var t=_planAnneeHoraire(MT,x.m,x.d,x.h);return t?'<button class="plan-btn-pdf"'+(x===Sw.j.find(function(y){return !y.fer&&y.h>0;})?' data-tuto="plan.annee.heure"':'')+' data-m="'+x.m+'" data-j="'+x.d+'" aria-label="Horaire du '+JN[x.g].toLowerCase()+' '+x.d+'" onclick="planAnneeJourSel(this)">'+_paHm(t.d)+' \u2192 '+_paHm(t.f)+(t.jour?' \u00b7 d\u00e9cal\u00e9':'')+'</button>':'';})())+'</div>';}).join('')+'</div>'
      +(function(){var js=E.jourSel;if(!js)return '';var x=Sw.j.find(function(y){return y.m===js.m&&y.d===js.d;});if(!x||x.fer||!(x.h>0))return '';var t=_planAnneeHoraire(MT,x.m,x.d,x.h);return '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:var(--pt-txt,13px);padding:6px 0"><span style="flex:1;min-width:12em">Prise le '+JN[x.g].toLowerCase()+' '+(x.d===1?'1er':x.d)+' '+window.PLAN_MOIS[x.m].toLowerCase()+'</span>'+'<button class="plan-btn-pdf" data-p="-15" aria-label="Prise 15 minutes plus t\u00f4t ce jour-l\u00e0" onclick="planAnneePriseJour(this)">\u2212</button><b style="font-variant-numeric:tabular-nums">'+_paHm(t.d)+'</b>'+'<button class="plan-btn-pdf" data-tuto="plan.annee.prisej" data-p="15" aria-label="Prise 15 minutes plus tard ce jour-l\u00e0" onclick="planAnneePriseJour(this)">+</button>'+(t.jour?'<button class="plan-btn-pdf" data-p="0" onclick="planAnneePriseJour(this)">Comme la saison</button>':'')+'<span style="color:var(--texte-doux);font-size:var(--pt-micro,11px)">fin \u00e0 '+_paHm(t.f)+'</span></div>';})()
      +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
      +(Sw.ferme?'<button class="plan-btn-pdf" data-tuto="plan.annee.rsem" data-w="'+sel+'" onclick="planAnneeRemettre(this)">Rouvrir comme la saison</button>'
               :'<button class="plan-btn-pdf" data-tuto="plan.annee.fsem" data-w="'+sel+'" onclick="planAnneeFermeSem(this)">Fermer la semaine</button>'
                +(diff?'<button class="plan-btn-pdf" data-w="'+sel+'" onclick="planAnneeRemettre(this)">Comme la saison</button>':''))+'</div>';
    if(!Sw.ferme&&Ssw)h+='<details open><summary style="cursor:pointer;font-size:var(--pt-txt,13px);font-weight:600">Changer le rythme \u00e0 partir d\u2019ici</summary>'
      +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);line-height:1.5;margin:4px 0">Les jours r\u00e9guliers de la saison, de cette semaine'+(finS>=0?' jusqu\u2019au '+_planAnneeDate(J,finS,true):'')+'\u00a0; la frise en fera une nouvelle saison.</div>'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:0 16px">'+Ssw.h.map(function(v,g){
          return '<div style="'+row+'"><span style="flex:1">'+JN[g]+'</span>'
            +'<button class="plan-btn-pdf" data-w="'+sel+'" data-g="'+g+'" data-p="-0.5" aria-label="'+JN[g]+' moins 30 min d\u00e8s cette semaine" onclick="planAnneeDesIci(this)">\u2212</button>'+hv(v)
            +'<button class="plan-btn-pdf"'+(g===4?' data-tuto="plan.annee.desici"':'')+' data-w="'+sel+'" data-g="'+g+'" data-p="0.5" aria-label="'+JN[g]+' plus 30 min d\u00e8s cette semaine" onclick="planAnneeDesIci(this)">+</button></div>';}).join('')+'</div></details>';
    h+='</div>';
  }
  h+=_planAnneeFeriesBloc(A,id,yr,adm,!!E.brouillon);   // ★ FERIES-1 (§556) : ouverte tant qu'un brouillon est en cours
  h+='<div style="display:grid;gap:8px;margin-top:14px">';
  A.saisons.forEach(function(sa,si){var tn=_planAnneeTon(sa.tot),a=-1,b=-1;
    J.forEach(function(x){if(x.s===si&&!x.ferme&&!x.apart){if(a<0)a=x.i;b=x.i;}});
    h+='<div style="border:1px solid var(--gris-clair);border-radius:10px;padding:10px">'
      +'<div style="display:flex;align-items:center;gap:8px"><span style="flex:none;width:12px;height:12px;border-radius:3px;background:'+tn.bg+';border:1px solid var(--gris-clair)"></span>'
      +'<b>'+(a>=0?_planAnneePlage(J,a,b):window.PLAN_MOIS[sa.m0])+'</b><span style="margin-left:auto;color:var(--texte-doux)">'+_paH(sa.tot)+' par semaine'+(sa.ab?' en moyenne':'')+'</span></div>'
      +(adm&&si>0&&a>=0?'<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px;font-size:var(--pt-micro,11px);color:var(--texte-doux)">D\u00e8s le '+_planAnneeDate(J,a,true)
        +'<button class="plan-btn-pdf"'+(si===1?' data-tuto="plan.annee.coupe"':'')+' data-s="'+si+'" data-n="-7" onclick="planAnneeCoupe(this)">1 sem. plus t\u00f4t</button>'
        +'<button class="plan-btn-pdf" data-s="'+si+'" data-n="7" onclick="planAnneeCoupe(this)">1 sem. plus tard</button></div>':'')
      +'<div style="font-size:var(--pt-txt,13px);color:var(--texte-doux);margin-top:6px">'+_planAnneeResumeAB(sa)+'</div>'
      +(a>=0?'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px;font-size:var(--pt-txt,13px)"><span>Prise de poste</span>'+(adm?'<button class="plan-btn-pdf" data-s="'+si+'" data-p="-15" aria-label="Prise 15 minutes plus t\u00f4t" onclick="planAnneePrise(this)">\u2212</button>':'')+'<b style="font-variant-numeric:tabular-nums">'+_paHm(_planAnneePriseSaison(A,si,MT))+'</b>'+(adm?'<button class="plan-btn-pdf"'+(si===0?' data-tuto="plan.annee.prise"':'')+' data-s="'+si+'" data-p="15" aria-label="Prise 15 minutes plus tard" onclick="planAnneePrise(this)">+</button>':'')+'<span style="color:var(--texte-doux);font-size:var(--pt-micro,11px)">'+_planAnneeHorairesTxt(A,si,MT)+'</span></div>':'')
      +(adm?'<details'+(si===0?' open':'')+' style="margin-top:6px"><summary style="cursor:pointer;font-size:var(--pt-txt,13px);font-weight:600">R\u00e9gler les jours</summary>'+_planAnneeEditeurSaison(A,sa,si,adm,E)+'</details>':_planAnneeJours(sa.h))+'</div>';});
  var ap=A.sem.filter(function(s){return s.apart;});
  if(ap.length)h+='<div style="font-size:var(--pt-txt,13px)"><b>Semaines \u00e0 part</b>'+ap.map(function(s){var a=s.j[0].i,b=s.j[s.j.length-1].i;
      return '<div style="color:var(--texte-doux);margin-top:3px">'+_planAnneePlage(J,a,b)+' \u00b7 '+_paH(s.h)+(adm?' <button class="plan-btn-pdf" data-w="'+s.j[0].w+'" onclick="planAnneeRemettre(this)">comme la saison</button>':'')+'</div>';}).join('')+'</div>';
  if(A.fermetures.length)h+='<div style="font-size:var(--pt-txt,13px)"><b>Fermetures</b><div style="color:var(--texte-doux);margin-top:3px">'
    +A.fermetures.map(function(f){return _planAnneePlage(J,f.i0,f.i1);}).join(' \u00b7 ')+'</div></div>';
  if(A.jours.length){var JL=['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
    h+='<div style="font-size:var(--pt-txt,13px)"><b>Jours \u00e0 part</b>'+A.jours.slice(0,12).map(function(x){
        var ty=(A.saisons[x.s]||{h:A.type[x.m]}).h[x.g],k=A.jours.indexOf(x);
        return '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:5px 0;border-bottom:1px solid var(--gris-clair)"><span style="flex:1;min-width:12em">'+JL[x.g]+' '+_planAnneeDate(J,x.i,true)+'\u00a0: <b>'+(x.h>0?_paH(x.h):'repos')+'</b> <span style="color:var(--texte-doux)">au lieu de '+(ty>0?_paH(ty):'repos')+'</span></span>'
          +(adm?' <button class="plan-btn-pdf" data-m="'+x.m+'" data-j="'+x.d+'" data-p="-0.5" aria-label="moins 30 min" onclick="planAnneeJour(this)">\u2212</button>'
            +'<button class="plan-btn-pdf"'+(k===0?' data-tuto="plan.annee.jour"':'')+' data-m="'+x.m+'" data-j="'+x.d+'" data-p="0.5" aria-label="plus 30 min" onclick="planAnneeJour(this)">+</button>'
            +'<button class="plan-btn-pdf"'+(k===0?' data-tuto="plan.annee.remettre"':'')+' data-m="'+x.m+'" data-j="'+x.d+'" onclick="planAnneeRemettre(this)">comme la saison</button>':'')+'</div>';}).join('')
      +(A.jours.length>12?'<div style="color:var(--texte-doux);margin-top:3px">et '+(A.jours.length-12)+' autres</div>':'')+'</div>';}
  h+='</div>';
  // le cadre vérifié
  var maxJ=0,minJ=99,dim=0,maxW=0,mod=0,max12=0;
  J.forEach(function(x){if(x.h>maxJ)maxJ=x.h;if(x.h>0&&x.h<minJ)minJ=x.h;if(x.g===6&&x.h>0)dim++;});
  A.sem.forEach(function(s,k){if(s.h>maxW)maxW=s.h;var b=s.h;if(nv)s.j.forEach(function(x){if(x.fer)b+=_planCreditFerie(id,yr,x.m,x.d,G);});if(b>L.hebdoLeg)mod+=b-L.hebdoLeg;});
  for(var k=0;k+12<=A.sem.length;k++){var sm=0;for(var q=k;q<k+12;q++)sm+=A.sem[q].h;if(sm/12>max12)max12=sm/12;}
  function ln(ok,t){return '<div style="display:flex;gap:8px;align-items:baseline;font-size:var(--pt-txt,13px);margin-top:5px"><span class="mvpas mvpas-statut '+(ok?'mvpas-fait':'mvpas-surveiller')+'">'+(ok?'ok':'\u00e0 voir')+'</span><span>'+t+'</span></div>';}
  h+='<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--gris-clair)"><b>Le cadre</b>'
    +ln(maxJ<=L.maxJour,_paH(L.maxJour)+' par jour au plus \u2014 la plus longue\u00a0: '+_paH(maxJ))
    +ln(maxW<=L.maxHebdo,_paH(L.maxHebdo)+' par semaine au plus \u2014 la plus charg\u00e9e\u00a0: '+_paH(maxW))
    +ln(max12<=L.maxMoy,_paH(L.maxMoy)+' en moyenne sur 12 semaines \u2014 au plus '+_paH(Math.round(max12*2)/2))
    +ln(mod<=L.modulMax,'Heures de modulation programm\u00e9es\u00a0: '+_paH(mod)+' sur '+_paH(L.modulMax))
    +ln(minJ>=3.5||minJ===99,'Jour r\u00e9duit \u2014 le plus court\u00a0: '+(minJ===99?'\u2013':_paH(minJ)))
    +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:8px;line-height:1.5">Dimanches travaill\u00e9s\u00a0: '+(dim||'aucun')+'. R\u00e8gle une saison avec \u2212 et + (ses jours r\u00e9guliers), d\u00e9place sa coupe d\u2019une semaine, r\u00e8gle un jour \u00e0 part ou remets-le comme la saison. Une semaine se r\u00e8gle jour par jour plus haut\u00a0: la fermer, la rouvrir, ou changer le rythme \u00e0 partir d\u2019elle.</div></div>';
  h+='</div>';
  body.innerHTML=h;
}
function planAnneeOuvrir(id){if(!id)return;
  if(!(_paEtat&&_paEtat.annee===String(id)))_paEtat={annee:String(id)};
  try{var R=window._MV_REGL&&window._MV_REGL.planning;if(R&&typeof window.closeOv==='function')window.closeOv(null,R.ov);}catch(e){if(window.logError)window.logError({level:'info',cat:'nav',msg:'roue: '+e});}
  if(typeof window.planSwitchTab==='function')window.planSwitchTab('annee');}
function planAnneeModele(el){var id=el&&el.dataset?el.dataset.pl:'';if(!id)return;var E=_paE();
  if(E&&E.brouillon&&E.annee!==id){if(window.showToast)window.showToast('Enregistrez ou annulez d\u2019abord les modifications de \u00ab\u00a0'+E.annee+'\u00a0\u00bb','#B85A1A');return;}
  if(!(E&&E.annee===id))_paEtat={annee:String(id)};
  if(typeof window.renderPlanning==='function')window.renderPlanning();else _planRenderAnnee();}
function _planAnneeModeleDefaut(){var ids=_planModeles(),n={},best=null;
  _planMbrs().forEach(function(m){var k=_planPlId(m);if(ids.indexOf(k)>=0)n[k]=(n[k]||0)+1;});
  ids.forEach(function(k){if(best==null||(n[k]||0)>(n[best]||0))best=k;});
  return best||ids[0]||'standard';}
function _planAnneeChoix(id,E){var ids=_planModeles();   // toujours là, même avec un seul modèle : on sait lequel on règle
  // le motif « choix » de la charte : un cadre .mvbtn-choix, des .mvbtn-option, l'état par aria-pressed — aucun style sur place
  return '<div style="margin-bottom:10px;overflow-x:auto"><div class="mvbtn-choix" role="group" aria-label="Le mod\u00e8le" data-tuto="plan.annee.modele">'+ids.map(function(k){
    return '<button class="mvbtn mvbtn-option" aria-pressed="'+(k===id)+'" data-pl="'+_escAttr(k)+'" onclick="planAnneeModele(this)">'+_escHtml(k)+'</button>';}).join('')+'</div></div>';}
function _planAnneeOnglet(){if(!_paEtat||!_paEtat.annee)_paEtat={annee:_planAnneeModeleDefaut()};_planRenderAnnee();}
function _planAnneeBande(){var yr=_pY(),E=_paE(),id=(E&&E.annee)||_planAnneeModeleDefaut(),G=(E&&E.brouillon)||_planGetTpl(id,yr)||{},nv=_planBaseActive(yr);
  var tot=_planAnneeTotal(id,yr,G),att=_planAnneeCible(id,yr),ec=Math.round((tot-att)*10)/10;
  return '<div class="mvu-kpi"><div class="mvu-kpi-v">'+_paH(tot)+'</div><div class="mvu-kpi-l">Le mod\u00e8le</div></div>'
    +'<div class="mvu-kpi"><div class="mvu-kpi-v">'+_paH(att)+'</div><div class="mvu-kpi-l">'+(nv?'Base ':'Plafond ')+yr+'</div></div>'
    +'<div class="mvu-kpi"><div class="mvu-kpi-v" style="color:'+(Math.abs(ec)<0.05?'var(--vert-med)':'var(--orange)')+'">'+(Math.abs(ec)<0.05?'juste':(ec>0?'+':'\u2212')+_paH(Math.abs(ec)))+'</div><div class="mvu-kpi-l">\u00c9cart</div></div>';}

// ★★ PROG-1 (§545) — LE PROGRAMME INDICATIF (accord national du 23/12/1981, art. 10.4). Avant le début de la période de
//   modulation, l'employeur établit pour l'équipe un programme indicatif : la formule (jusqu'à 200 h de modulation, contingent
//   d'heures supplémentaires hors modulation de 150 h ; au-delà, 100 h ; jamais plus de 250 h), les salariés concernés, les
//   périodes de forte, de faible et de nulle activité, l'horaire indicatif de chacune ; il s'affiche au moins une semaine
//   avant le début de la période, et toute modification aussi (sauf force majeure). Le tout se LIT de la frise : saisons,
//   semaines à part, fermetures, la modulation au-delà de 35 h par semaine (fériés chômés comptés pour leurs heures prévues).
//   Une page par modèle, à la suite de sa grille, dans le planning de l'année ; rien ne s'écrit.
function _planAnneeHoraireTxt(v){
  var JL=['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'],out=[],g=0;
  while(g<7){if(!(v[g]>0)){g++;continue;}var k=g;while(k+1<7&&v[k+1]===v[g])k++;
    out.push((k>g?JL[g]+(k>g+1?' au ':' et ')+JL[k]:JL[g])+' '+_planFmt(v[g]));g=k+1;}
  return out.length?out.join(' \u00b7 '):'aucun jour travaill\u00e9';
}
function _planAnneeNature(t,ref){return t<=0?'Activit\u00e9 nulle':(t>ref?'Forte activit\u00e9':(t<ref?'Activit\u00e9 r\u00e9duite':'Activit\u00e9 normale'));}
function _planAnneeModulation(plId,yr,A){
  var L=_planLegal(),nv=_planBaseActive(yr),mod=0;
  A.sem.forEach(function(s){var b=s.h;if(nv)s.j.forEach(function(x){if(x.fer)b+=_planCreditFerie(plId,yr,x.m,x.d);});if(b>L.hebdoLeg)mod+=b-L.hebdoLeg;});
  return Math.round(mod*2)/2;
}
function _planAnneeProgramme(plId,yr){
  var A=_planAnneeLire(plId,yr),J=A.J,L=_planLegal(),nv=_planBaseActive(yr),e=_escHtml,ref=L.hebdoLeg;
  var mod=_planAnneeModulation(plId,yr,A);
  var formule=mod<=200?'jusqu\u2019\u00e0 200 h de modulation \u2014 contingent d\u2019heures suppl\u00e9mentaires hors modulation de 150 h'
    :(mod<=L.modulMax?'de 200 \u00e0 '+L.modulMax+' h de modulation \u2014 contingent d\u2019heures suppl\u00e9mentaires hors modulation de 100 h'
    :'au-del\u00e0 de '+L.modulMax+' h \u2014 le programme d\u00e9passe le plafond de l\u2019accord : \u00e0 revoir avant de l\u2019afficher');
  var lignes=[];
  A.saisons.forEach(function(sa,si){var a=-1,b=-1;J.forEach(function(x){if(x.s===si&&!x.ferme&&!x.apart){if(a<0)a=x.i;b=x.i;}});if(a<0)return;
    lignes.push({i:a,quand:_planAnneePlage(J,a,b)+(sa.ab?' (semaines A et B)':''),nat:_planAnneeNature(sa.tot,ref),h:sa.tot,hor:sa.ab?'Semaine A\u00a0: '+_planAnneeHoraireTxt(sa.h)+' \u00b7 Semaine B\u00a0: '+_planAnneeHoraireTxt(sa.hB):_planAnneeHoraireTxt(sa.h)});});
  A.sem.forEach(function(s){if(!s.apart)return;var a=s.j[0].i,b=s.j[s.j.length-1].i,v=[0,0,0,0,0,0,0];s.j.forEach(function(x){v[x.g]=x.h;});
    lignes.push({i:a,quand:_planAnneePlage(J,a,b)+' (semaine \u00e0 part)',nat:_planAnneeNature(s.h,ref),h:s.h,hor:_planAnneeHoraireTxt(v)});});
  A.fermetures.forEach(function(f){lignes.push({i:f.i0,quand:_planAnneePlage(J,f.i0,f.i1),nat:'Activit\u00e9 nulle \u2014 fermeture',h:0,hor:'domaine ferm\u00e9'});});
  lignes.sort(function(x,y){return x.i-y.i;});
  var gens=_planMbrs().filter(function(m){return _planPlId(m)===plId;}).map(function(m){return m.nom;});
  var base;
  if(nv){var sl=_planSolid(yr),sj=_planSolidJour(yr),MO=window.PLAN_SOLID_MODES||{};
    base='Base de l\u2019ann\u00e9e\u00a0: '+_planJoursSem(yr)+' jours du lundi au vendredi \u00d7 7 h = '+_planFmt(_planBaseAn(yr))+', soit 35 h par semaine en moyenne. '
      +'Journ\u00e9e de solidarit\u00e9\u00a0: '+(sl?e((MO[sl.mode]||sl.mode).toLowerCase())+(sj?' (le '+(sj.d===1?'1er':sj.d)+' '+window.PLAN_MOIS[sj.m].toLowerCase()+')':'')+', 7 h':'\u00e0 r\u00e9gler')+'. '
      +'Les cong\u00e9s pay\u00e9s et les jours f\u00e9ri\u00e9s ch\u00f4m\u00e9s comptent pour les heures pr\u00e9vues ce jour-l\u00e0\u00a0: ils ne se r\u00e9cup\u00e8rent pas (art. 4.3) et se paient sur le temps qui aurait \u00e9t\u00e9 travaill\u00e9 (art. 10.4).';}
  else base='Dur\u00e9e annuelle de r\u00e9f\u00e9rence\u00a0: '+_planFmt(L.plafAnnuel)+' de travail effectif.';
  var aff=(yr-1)+'-12-25',affTxt='25 d\u00e9cembre '+(yr-1);
  return '<div class="pa-grp pa-prog">'
    +'<div class="pa-prog-t"><b>Programme indicatif de modulation '+yr+'</b><span>Accord national du 23 d\u00e9cembre 1981 sur la dur\u00e9e du travail dans les exploitations agricoles, art. 10.4</span></div>'
    +'<table class="pa-prog-id"><tr><th>P\u00e9riode</th><td>du 1er janvier au 31 d\u00e9cembre '+yr+'</td></tr>'
    +'<tr><th>Salari\u00e9s concern\u00e9s</th><td>'+(gens.length?e(gens.join(' \u00b7 ')):'\u2014')+'</td></tr>'
    +'<tr><th>Formule</th><td>'+_planFmt(mod)+' de modulation programm\u00e9es (au-del\u00e0 de 35 h par semaine)\u00a0: '+formule+'.</td></tr>'
    +'<tr><th>D\u00e9compte</th><td>'+base+'</td></tr></table>'
    +'<table class="pa-prog-per"><tr><th>P\u00e9riode</th><th>Nature</th><th>Par semaine</th><th>Horaire indicatif</th></tr>'
    +lignes.map(function(l){return '<tr><td>'+l.quand+'</td><td>'+l.nat+'</td><td>'+(l.h>0?_planFmt(l.h):'\u2014')+'</td><td>'+l.hor+'</td></tr>';}).join('')+'</table>'
    +'<div class="pa-prog-n">Horaires de prise et de fin de service\u00a0: voir la grille de ce mod\u00e8le. Programme \u00e9tabli le '+new Date().toLocaleDateString('fr-FR')
    +'. \u00c0 afficher au moins une semaine avant le d\u00e9but de la p\u00e9riode, soit au plus tard le <b data-aff="'+aff+'">'+affTxt+'</b>\u00a0; toute modification se communique dans le m\u00eame d\u00e9lai, sauf cas de force majeure.</div>'
    +'</div>';
}

// ★★ MONAN-1 (§546) — « MON ANNÉE » : la frise d'un salarié, en petit et en lecture, dans sa vue du Planning. Les couleurs
//   des saisons, les fermetures hachurées, la semaine à part ; un trait pour aujourd'hui ; dessous, chaque période en clair
//   (ses dates, ses heures par semaine). Rien ne s'y règle : c'est la feuille qu'on regarde, pas celle qu'on écrit.
function _planAnneeMini(plId,yr){
  var A=_planAnneeLire(plId,yr),J=A.J,N=J.length,ferme='repeating-linear-gradient(135deg,var(--gris-clair) 0 4px,transparent 4px 8px)';
  var h='<div style="position:relative;height:26px;border-radius:7px;overflow:hidden;background:var(--fond-doux,var(--gris-clair));margin-top:8px">';
  A.plages.forEach(function(p){var l=p.i0/N*100,wd=(p.i1-p.i0+1)/N*100,st='position:absolute;top:0;bottom:0;left:'+l+'%;width:'+wd+'%;border-right:1px solid var(--carte,#fff)';
    if(p.ferme){h+='<div style="'+st+';background:'+ferme+'" title="'+_escAttr('Ferm\u00e9 \u2014 '+_planAnneePlage(J,p.i0,p.i1))+'"></div>';return;}
    var sh=p.apart?A.sem[p.w].h:A.saisons[p.s].tot,tn=_planAnneeTon(sh);
    h+='<div style="'+st+';background:'+tn.bg+'" title="'+_escAttr(_planAnneePlage(J,p.i0,p.i1)+' \u00b7 '+_paH(sh)+' par semaine')+'"></div>';});
  var t=new Date();if(t.getFullYear()===yr){var x=J.find(function(y){return y.m===t.getMonth()&&y.d===t.getDate();});
    if(x)h+='<div style="position:absolute;top:0;bottom:0;left:'+(x.i/N*100)+'%;width:2px;background:var(--texte)" title="Aujourd\u2019hui"></div>';}
  h+='</div><div style="display:flex;justify-content:space-between;font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:2px"><span>janv.</span><span>avr.</span><span>juil.</span><span>oct.</span><span>d\u00e9c.</span></div>';
  var P=[];
  A.saisons.forEach(function(sa,si){var a=-1,b=-1;J.forEach(function(x){if(x.s===si&&!x.ferme&&!x.apart){if(a<0)a=x.i;b=x.i;}});
    if(a>=0)P.push({i:a,t:_planAnneePlage(J,a,b)+' \u00b7 '+_paH(sa.tot)+' par semaine'+(sa.ab?' en moyenne (semaines A et B)':''),bg:_planAnneeTon(sa.tot).bg});});
  A.sem.forEach(function(s){if(s.apart)P.push({i:s.j[0].i,t:_planAnneePlage(J,s.j[0].i,s.j[s.j.length-1].i)+' \u00b7 '+_paH(s.h)+' (semaine \u00e0 part)',bg:_planAnneeTon(s.h).bg});});
  A.fermetures.forEach(function(f){P.push({i:f.i0,t:_planAnneePlage(J,f.i0,f.i1)+' \u00b7 ferm\u00e9',bg:ferme});});
  P.sort(function(a,b){return a.i-b.i;});
  return h+'<div style="display:grid;gap:3px;margin-top:8px;font-size:var(--pt-micro,11px);color:var(--texte-doux)">'+P.map(function(q){
    return '<div style="display:flex;align-items:center;gap:6px"><span style="flex:none;width:10px;height:10px;border-radius:3px;background:'+q.bg+';border:1px solid var(--gris-clair)"></span>'+q.t+'</div>';}).join('')+'</div>';
}


// ── LA FRONTIÈRE : ce que la frise expose (les gestes, et le rendu que la roue du Planning appelle) ──
window._planRenderAnnee     = _planRenderAnnee;
window.planAnneeOuvrir      = planAnneeOuvrir;
window.planAnneeModele      = planAnneeModele;   // ★ ANNEE-TAB
window.planAnneePrise       = planAnneePrise;    // ★ HOR-1
window.planAnneeJourSel     = planAnneeJourSel;
window.planAnneePriseJour   = planAnneePriseJour;
window.planAnneeDma         = planAnneeDma;
window.planAnneeAB          = planAnneeAB;   // ★ FRISE-AB
window.planAnneeUneSemaine  = planAnneeUneSemaine;
window._planAnneeSemaineAB  = _planAnneeSemaineAB;
window._planAnneeOnglet     = _planAnneeOnglet;
window._planAnneeBande      = _planAnneeBande;
window.planAnneePas         = planAnneePas;
window.planAnneeJuste       = planAnneeJuste;
window.planAnneeAppliquer   = planAnneeAppliquer;
window.planAnneeEnregistrer = planAnneeEnregistrer;
window.planAnneeAnnuler     = planAnneeAnnuler;
window.planAnneeCoupe       = planAnneeCoupe;
window.planAnneeJour        = planAnneeJour;
window.planAnneeRemettre    = planAnneeRemettre;
window._planAnneeEtat       = _planAnneeEtat;
window.planAnneeSemaine     = planAnneeSemaine;   // ★ FRISE-4
window.planAnneeFermeSem    = planAnneeFermeSem;
window.planAnneeDesIci      = planAnneeDesIci;
window._planAnneeProgramme  = _planAnneeProgramme;
window._planAnneeMini       = _planAnneeMini;
// ★ MODELES-DEC (§558) : ce que planning-modeles.js emprunte à la frise
window._paE                 = _paE;
window._paH                 = _paH;
window._planAnneeLire       = _planAnneeLire;
window._planAnneeBrouillon  = _planAnneeBrouillon;
window._planAnneePose       = _planAnneePose;
window._planAnneeCopie      = _planAnneeCopie;      // ★ PREPAN-2 (§560)
window._planAnneeMetaCopie  = _planAnneeMetaCopie;
window.PLAN_MOIS_FR         = PLAN_MOIS_FR;   // ★ MONAN-1 : la frise en petit, dans « Mon année »   // ★ PROG-1 : la page du programme indicatif, lue par le planning de l'année
