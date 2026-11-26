// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ★★ ANNEE-3 (§614) — planning-annee-vue.js : LA VUE DE L'ANNÉE ET SON PANNEAU, sortis de planning-annee.js (81 ko après ANNEE-2).
// Chargé par app.js après planning-modeles.js (et planning-frais.js). La même frontière que les deux autres modules de l'année (mv-harnais-anneedec) :
// il n'importe que utils.js, emprunte par window ce qu'il lit ailleurs (planning.js, planning-annee.js, planning-modeles.js),
// expose ses gestes, et rien ne s'exécute au chargement. planning-annee.js garde la lecture de l'année, le brouillon et les gestes
// qui l'écrivent ; ce module dessine (la barre, la vue, la ligne d'état, le panneau) et règle (la grille des jours, ses champs).
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
import { isAdmin, _escHtml, _escAttr, _mvInfoBtn, _mvInfoSet } from './utils.js';

// les emprunts — planning.js
function _pY(){ return window._pY.apply(null, arguments); }
function _planBaseActive(){ return window._planBaseActive.apply(null, arguments); }
function _planCreditFerie(){ return window._planCreditFerie.apply(null, arguments); }
function _planGetTpl(){ return window._planGetTpl.apply(null, arguments); }
function _planLegal(){ return window._planLegal.apply(null, arguments); }
function _planMbrs(){ return window._planMbrs.apply(null, arguments); }
function _planModelBrut(){ return window._planModelBrut.apply(null, arguments); }
function _planModeles(){ return window._planModeles.apply(null, arguments); }
function _planPlId(){ return window._planPlId.apply(null, arguments); }
function _planSolidJour(){ return window._planSolidJour.apply(null, arguments); }
// — planning-annee.js (la lecture, le brouillon, les gestes qui l'écrivent)
function _paE(){ return window._paE.apply(null, arguments); }
function _paNeuf(){ return window._paNeuf.apply(null, arguments); }
function _paH(){ return window._paH.apply(null, arguments); }
function _paHm(){ return window._paHm.apply(null, arguments); }
function _planAnneeLire(){ return window._planAnneeLire.apply(null, arguments); }
function _planAnneeGrille(){ return window._planAnneeGrille.apply(null, arguments); }
function _planAnneeMeta(){ return window._planAnneeMeta.apply(null, arguments); }
function _planAnneeMetaCopie(){ return window._planAnneeMetaCopie.apply(null, arguments); }
function _planAnneeCible(){ return window._planAnneeCible.apply(null, arguments); }
function _planAnneeCleS(){ return window._planAnneeCleS.apply(null, arguments); }
function _planAnneeCodes(){ return window._planAnneeCodes.apply(null, arguments); }
function _planAnneeDate(){ return window._planAnneeDate.apply(null, arguments); }
function _planAnneePlage(){ return window._planAnneePlage.apply(null, arguments); }
function _planAnneeResumeAB(){ return window._planAnneeResumeAB.apply(null, arguments); }
function _planAnneeSemSel(){ return window._planAnneeSemSel.apply(null, arguments); }
function _planAnneeHoraire(){ return window._planAnneeHoraire.apply(null, arguments); }
function _planAnneeHorairesTxt(){ return window._planAnneeHorairesTxt.apply(null, arguments); }
function _planAnneePriseSaison(){ return window._planAnneePriseSaison.apply(null, arguments); }
function _planAnneeSuggestions(){ return window._planAnneeSuggestions.apply(null, arguments); }
function _planAnneeBande(){ return window._planAnneeBande.apply(null, arguments); }
function _planAnneeModeleDefaut(){ return window._planAnneeModeleDefaut.apply(null, arguments); }
function planAnneePas(){ return window.planAnneePas.apply(null, arguments); }
function planAnneeJour(){ return window.planAnneeJour.apply(null, arguments); }
function planAnneeDesIci(){ return window.planAnneeDesIci.apply(null, arguments); }
function planAnneePrise(){ return window.planAnneePrise.apply(null, arguments); }
function planAnneePriseJour(){ return window.planAnneePriseJour.apply(null, arguments); }
function planAnneeCoupe(){ return window.planAnneeCoupe.apply(null, arguments); }
function planAnneeAB(){ return window.planAnneeAB.apply(null, arguments); }
function planAnneeUneSemaine(){ return window.planAnneeUneSemaine.apply(null, arguments); }
function _planAnneeNoms(){ return window._planAnneeNoms.apply(null, arguments); }
function planAnneeNom(){ return window.planAnneeNom.apply(null, arguments); }
// — planning-modeles.js (qui suit un modèle, ses fériés)
function _planAnneeFerieSem(){ return window._planAnneeFerieSem.apply(null, arguments); }
function _planAnneeFeriesBloc(){ return window._planAnneeFeriesBloc.apply(null, arguments); }
function _planAnneeSuivi(){ return window._planAnneeSuivi.apply(null, arguments); }
function _planAnneeManque(){ return window._planAnneeManque.apply(null, arguments); }

// ★★ ANNEE-2 (§613) — LA VUE DE L'ANNÉE, REFAITE (docs/maquettes/maquette-planning-annee-refonte-v3.html, validée le 26/11 :
//   « impeccable »). Nico (25/11) : « grossière… gros, ça prend de la place, c'est pas joli, c'est pas professionnel ». Avant :
//   une carte qui répétait le compte de la bande, la frise, une semaine dépliée sous elle, une carte par saison avec ses − / +,
//   les fériés, les jours à part, le cadre — 3 511 px au téléphone, 74 boutons. Maintenant, comme un planning de projet :
//   · une BARRE D'OUTILS : le modèle (un bouton, son menu), l'année (‹ 2026 ›, sur ordinateur), « Tomber juste », « Annuler » et
//     « Enregistrer » tant qu'un brouillon existe, « … » (exporter, imprimer, le mode d'emploi, qui suit, préparer l'année d'après) ;
//   · UNE VUE de l'année : les mois en colonnes ; en tête les heures de chaque semaine face aux 35 h (toucher une semaine
//     l'ouvre) ; une ligne par saison, sa barre posée sur ses dates (les semaines A et B en bandes) ; les semaines à part et les
//     fermetures dans la même grille ; les fériés en points (plein : travaillé, creux : chômé) ; les congés de l'équipe en
//     traits ; aujourd'hui, un trait. Sur ordinateur (≥ 1 024 px), à gauche le rythme et les dates, à droite deux colonnes
//     alignées : par semaine, et le total de la période — le pied de la colonne fait le compte de la bande (dès 2027, la ligne
//     des fériés y porte les heures des fériés chômés, comptés pour leurs heures prévues) ;
//   · une LIGNE D'ÉTAT : le cadre, les fériés travaillés, les jours à part, « Personne ne suit », le brouillon — et la légende,
//     qui ne montre que ce que le modèle contient ;
//   · LE DÉTAIL DANS UN PANNEAU (#ovAnvPan : une fenêtre, à droite dès 768 px, par le bas au téléphone) : une saison, une
//     semaine, les contrôles (le cadre, les fériés), « Tomber juste », qui suit, les jours à part. Les réglages d'avant y passent
//     tels quels (ANNEE-3 a remplacé leurs − / + par la grille des jours et ses champs) ; « Annuler » et « Enregistrer » au pied du panneau aussi.
//   Rien ne change aux calculs, au brouillon ni à ce qui s'écrit. Les noms des saisons viennent avec ANNEE-4.
var ANV_OV='ovAnvPan',ANV_JL=['L','M','M','J','V','S','D'];
function _anvP(i,N){return (i/N*100).toFixed(3)+'%';}
function _anvSom(v){var t=0;(v||[]).forEach(function(x){t+=x||0;});return t;}
// le rythme d'une semaine type, court : « L–V 7 h », « L–J 8 h, V 7 h »
function _anvRythme(v){var o=[],g=0;while(g<7){if(!(v[g]>0)){g++;continue;}var k=g;while(k+1<7&&v[k+1]===v[g])k++;
    o.push((k>g?ANV_JL[g]+'\u2013'+ANV_JL[k]:ANV_JL[g])+'\u00a0'+_paH(v[g]));g=k+1;}
  return o.length?o.join(', '):'repos';}
function _anvParSem(sa){return sa.ab?_paH(_anvSom(sa.h))+' / '+_paH(_anvSom(sa.hB)):_paH(_anvSom(sa.h));}
// tout ce que la vue et le panneau lisent, une fois par rendu
function _anvCtx(E){
  var MT=_planAnneeMeta(E),id=E.annee,yr=_pY(),G=_planAnneeGrille(),A=_planAnneeLire(id,yr,G),J=A.J,L=_planLegal(),nv=_planBaseActive(yr),adm=(typeof isAdmin==='function')&&isAdmin();
  var tot=0;J.forEach(function(x){tot+=x.h;});
  var brut=nv?_planModelBrut(id,yr,G):tot,att=_planAnneeCible(id,yr),ec=Math.round((brut-att)*10)/10;
  var gens=_planMbrs().filter(function(m){return _planPlId(m)===id;});
  var maxJ=0,minJ=99,dim=0,maxW=0,mod=0,max12=0;   // le cadre vérifié (il était en bas de la carte)
  J.forEach(function(x){if(x.h>maxJ)maxJ=x.h;if(x.h>0&&x.h<minJ)minJ=x.h;if(x.g===6&&x.h>0)dim++;});
  A.sem.forEach(function(s){if(s.h>maxW)maxW=s.h;var b=s.h;if(nv)s.j.forEach(function(x){if(x.fer)b+=_planCreditFerie(id,yr,x.m,x.d,G);});if(b>L.hebdoLeg)mod+=b-L.hebdoLeg;});
  for(var k=0;k+12<=A.sem.length;k++){var sm=0;for(var q=k;q<k+12;q++)sm+=A.sem[q].h;if(sm/12>max12)max12=sm/12;}
  var cad=[[maxJ<=L.maxJour,_paH(L.maxJour)+' par jour au plus','la plus longue\u00a0: '+_paH(maxJ)],
    [maxW<=L.maxHebdo,_paH(L.maxHebdo)+' par semaine au plus','la plus charg\u00e9e\u00a0: '+_paH(maxW)],
    [max12<=L.maxMoy,_paH(L.maxMoy)+' en moyenne sur 12 semaines','au plus '+_paH(Math.round(max12*2)/2)],
    [mod<=L.modulMax,'Heures de modulation programm\u00e9es',_paH(mod)+' sur '+_paH(L.modulMax)],
    [minJ>=3.5||minJ===99,'Jour r\u00e9duit','le plus court\u00a0: '+(minJ===99?'\u2013':_paH(minJ))]];
  var sj=_planSolidJour(yr),fp=J.filter(function(x){return x.fer&&x.h>0&&!(sj&&sj.m===x.m&&sj.d===x.d);});
  var cpS=[];A.sem.forEach(function(){cpS.push([]);});   // qui, de ce modèle, a posé des congés cette semaine-là
  gens.forEach(function(mb){var Y=((window.PLANNING_ENTRIES||{})[mb.nom]||{})[yr]||{};J.forEach(function(x){var e=(Y[x.m]||{})[x.d];if(e&&e.type==='cp'&&cpS[x.w].indexOf(mb.nom)<0)cpS[x.w].push(mb.nom);});});
  var t=new Date(),auj=t.getFullYear()===yr?J.find(function(x){return x.m===t.getMonth()&&x.d===t.getDate();}):null;
  return {E:E,MT:MT,id:id,yr:yr,G:G,A:A,J:J,N:J.length,L:L,nv:nv,adm:adm,sel:_planAnneeSemSel(A,E,yr),tot:tot,brut:brut,att:att,ec:ec,gens:gens,
    cad:cad,cadOk:cad.every(function(c){return c[0];}),dim:dim,fp:fp,cpS:cpS,auj:auj||null,sj:sj||null,noms:_planAnneeNoms(A,MT)};
}
// les lignes de la vue : chaque saison (ses morceaux, hors semaines à part et fermetures), chaque semaine à part, chaque fermeture
function _anvRangs(C){var A=C.A,J=C.J,R=[];
  A.saisons.forEach(function(sa,si){var a=-1,b=-1,t=0;J.forEach(function(x){if(x.s===si&&!x.ferme&&!x.apart){if(a<0)a=x.i;b=x.i;t+=x.h;}});if(a<0)return;
    R.push({k:'s',si:si,sa:sa,a:a,b:b,tot:t,seg:A.plages.filter(function(p){return !p.ferme&&!p.apart&&p.s===si;})});});
  A.sem.forEach(function(s,w){if(!s.apart)return;var a=s.j[0].i,b=s.j[s.j.length-1].i;R.push({k:'a',w:w,a:a,b:b,tot:s.h,seg:[{i0:a,i1:b}]});});
  A.fermetures.forEach(function(f){var t=0;for(var i=f.i0;i<=f.i1;i++)t+=J[i].h;R.push({k:'f',w:J[f.i0].w,a:f.i0,b:f.i1,tot:t,seg:[{i0:f.i0,i1:f.i1}]});});
  return R.sort(function(x,y){return x.a-y.a;});}
// la barre d'outils
function _anvBrouillonBtns(tuto){return '<button type="button" class="mvbtn mvbtn-secondaire"'+(tuto?' data-tuto="plan.annee.ann"':'')+' onclick="planAnneeAnnuler()">Annuler</button>'
  +'<button type="button" class="mvbtn mvbtn-principal"'+(tuto?' data-tuto="plan.annee.enr"':'')+' onclick="planAnneeEnregistrer()">Enregistrer</button>';}
function _anvOutils(C){var E=C.E,ids=_planModeles(),M=_planMbrs(),n=function(k){return M.filter(function(m){return _planPlId(m)===k;}).length;},pan=!!E.pan;
  var h='<div class="anv-tool"><span class="anv-voile" aria-hidden="true"></span>'
    +'<div class="anv-dd"><button type="button" class="anv-mod" data-tuto="plan.annee.modele" aria-haspopup="true" aria-expanded="false" onclick="planAnneeMenu(\'mod\')"><b>'+_escHtml(C.id)+'</b><span>\u00b7 '+n(C.id)+'\u00a0pers.</span></button>'
    +'<div class="anv-menu" data-menu="mod" role="menu" aria-label="Le mod\u00e8le">'+ids.map(function(k){
      return '<button type="button" class="anv-menu-l" role="menuitemradio" aria-checked="'+(k===C.id)+'" data-tuto="plan.annee.modele.l" data-pl="'+_escAttr(k)+'" onclick="planAnneeModele(this)"><b>'+_escHtml(k)+'</b><span>'+n(k)+'\u00a0pers.</span></button>';}).join('')+'</div></div>';
  var yl=(typeof window._planYearList==='function'?window._planYearList():[C.yr]).slice().sort(function(a,b){return a-b;}),yi=yl.indexOf(C.yr),yp=yi>0?yl[yi-1]:null,yn=(yi>=0&&yi<yl.length-1)?yl[yi+1]:null;
  h+='<span class="anv-an" role="group" aria-label="L\u2019ann\u00e9e"><button type="button" class="mvbtn mvbtn-secondaire mvbtn-icone"'+(yp==null?' disabled':' data-y="'+yp+'"')+' aria-label="Ann\u00e9e pr\u00e9c\u00e9dente" onclick="planAnneeAn(this)">\u2039</button>'
    +'<b>'+C.yr+'</b><button type="button" class="mvbtn mvbtn-secondaire mvbtn-icone"'+(yn==null?' disabled':' data-y="'+yn+'"')+' aria-label="Ann\u00e9e suivante" onclick="planAnneeAn(this)">\u203a</button></span><span class="anv-sp"></span>';
  if(C.adm){var br=!!E.brouillon,ac='';
    if(Math.abs(C.ec)>=0.05)ac+='<button type="button" class="mvbtn '+(br?'mvbtn-secondaire':'mvbtn-principal')+'" data-tuto="plan.annee.juste" onclick="planAnneeJuste()">Tomber juste</button>';
    if(br)ac+=_anvBrouillonBtns(!pan);   // le panneau ouvert porte les siens (et leurs ancres de tuto)
    if(ac)h+='<span class="anv-acts">'+ac+'</span>';}   // au téléphone, deux boutons et plus passent sur leur ligne
  h+='<div class="anv-dd"><button type="button" class="mvbtn mvbtn-secondaire mvbtn-icone anv-plus" data-tuto="plan.annee.plus" aria-haspopup="true" aria-expanded="false" aria-label="Plus d\u2019actions" onclick="planAnneeMenu(\'plus\')">\u2026</button>'
    +'<div class="anv-menu anv-menu-r" data-menu="plus" role="menu" aria-label="Plus d\u2019actions">'
    +(C.adm?'<button type="button" class="anv-menu-l" role="menuitem" data-pl="'+_escAttr(C.id)+'" onclick="planAnneeMenu();planExportCSV(this.dataset.pl)">Exporter (CSV)</button>':'')
    +'<button type="button" class="anv-menu-l" role="menuitem" data-y="'+C.yr+'" onclick="planAnneeMenu();if(window._paDoc)window._paDoc(+this.dataset.y)">Imprimer le planning de l\u2019ann\u00e9e</button>'
    +'<button type="button" class="anv-menu-l" role="menuitem" data-mvi="plan.frise">R\u00e9gler la frise\u00a0?<span>le mode d\u2019emploi</span></button>'   // MOTS-17 : le mode d'emploi vit dans le « i »
    +'<button type="button" class="anv-menu-l" role="menuitem" data-pan="suivi" data-tuto="plan.annee.suivi.menu" onclick="planAnneeMenu();planAnneePan(this)">Qui suit ce mod\u00e8le<span>'+C.gens.length+'\u00a0pers.</span></button>'
    +(C.adm?'<button type="button" class="anv-menu-l" role="menuitem" data-y="'+(C.yr+1)+'" onclick="planAnneeMenu();if(window.planPrepOuvrir)window.planPrepOuvrir(+this.dataset.y)">Pr\u00e9parer '+(C.yr+1)+'</button>':'')
    +'</div></div></div>';
  return h;}
// la vue de l'année
function _anvVue(C){
  var A=C.A,J=C.J,N=C.N,L=C.L,pan=C.E.pan||null,h='<div class="anv-gn">';
  h+='<div class="anv-l anv-mois" aria-hidden="true"><span class="anv-c1"><b class="anv-ti anv-ti-d">'+C.yr+'</b></span><span class="anv-t">';
  for(var m=0;m<12;m++){var i0=0;while(i0<N&&J[i0].m!==m)i0++;h+='<span class="anv-mo" style="left:'+_anvP(i0,N)+'"><span class="anv-mo-l">'+window.PLAN_MOIS_FR[m]+'</span><span class="anv-mo-c">'+window.PLAN_MOIS_FR[m].charAt(0).toUpperCase()+'</span></span>';}
  h+='</span><span class="anv-n"><span>par sem.</span><span>total</span></span></div>';
  // les heures de chaque semaine, face aux 35 h ; toucher une semaine l'ouvre dans le panneau
  h+='<div class="anv-l anv-h"><span class="anv-c1"><b class="anv-ti">Heures par semaine</b><span class="anv-tel">face aux '+L.hebdoLeg+'\u00a0h</span></span><span class="anv-t">'
    +'<span class="anv-35" style="bottom:calc(6px + (100% - 12px) * '+(L.hebdoLeg/50).toFixed(3)+')"></span>';   // la ligne seule : son « 35 h » est dans le titre (téléphone) ou la colonne (ordinateur), hors des zones de toucher
  A.sem.forEach(function(s,k){var a=s.j[0].i,b=s.j[s.j.length-1].i,wd=((b-a+1)/N*100).toFixed(3),tip='Semaine du '+_planAnneePlage(J,a,b)+' \u2014 '+(s.ferme?'ferm\u00e9e':(s.h>0?_paH(s.h):'rien de pr\u00e9vu'));
    if(s.ferme)h+='<span class="anv-wk anv-wk-f" style="left:calc('+_anvP(a,N)+' + 1px);width:calc('+wd+'% - 2px)"></span>';
    else if(s.h>0)h+='<span class="anv-wk'+(s.h>L.hebdoLeg+0.001?' anv-wk-p':'')+'" style="left:calc('+_anvP(a,N)+' + 1px);width:calc('+wd+'% - 2px);height:calc((100% - 12px) * '+(Math.min(s.h,50)/50).toFixed(3)+')"></span>';
    h+='<button type="button" class="anv-wh" data-pan="w" data-w="'+k+'"'+(k===C.sel?' data-tuto="plan.annee.semhit"':' tabindex="-1"')+' aria-label="'+_escAttr(tip)+'" title="'+_escAttr(tip)+'" style="left:'+_anvP(a,N)+';width:'+wd+'%" onclick="planAnneePan(this)"></button>';});
  h+='</span><span class="anv-n"><span class="anv-35n">'+L.hebdoLeg+'\u00a0h</span><b data-anv="tan">'+_paH(C.brut)+'</b></span></div>';
  // une ligne par période
  _anvRangs(C).forEach(function(r){var on=!!(pan&&r.k==='s'&&pan.t==='s'&&pan.si===r.si),dates=_planAnneePlage(J,r.a,r.b),nom,ps,cls,tit,att,
      nm=r.k==='s'?C.noms.s[r.si]:r.k==='a'?C.noms.w[r.w]:null,nb=nm?'<b class="anv-nm-n">'+_escHtml(nm)+'</b>':'';   // ★ ANNEE-4 : le nom, à la place du rythme (le rythme reste dans la bulle)
    if(r.k==='s'){nom=(nb||_anvRythme(r.sa.h))+(r.sa.ab?' \u00b7 A/B':'');ps=_anvParSem(r.sa);cls=r.sa.ab?' anv-bar-ab':'';tit=(nm?nm+' \u2014 ':'')+'Saison du '+dates+' \u2014 '+_planAnneeResumeAB(r.sa);
      att=' data-pan="s" data-s="'+r.si+'"'+(r.si===0?' data-tuto="plan.annee.saison"':r.si===1?' data-tuto="plan.annee.saison2"':'');}
    else if(r.k==='a'){nom=nb||'Semaine \u00e0 part';ps=_paH(r.tot);cls=' anv-bar-ap';tit=(nm?nm+' \u2014 ':'')+'Semaine \u00e0 part du '+dates+' \u00b7 '+_paH(r.tot);att=' data-pan="w" data-w="'+r.w+'"';}
    else{nom='Ferm\u00e9';ps='\u2013';cls=' anv-bar-f';tit='Ferm\u00e9 \u2014 '+dates;att=' data-pan="w" data-w="'+r.w+'"';}
    h+='<button type="button" class="anv-l anv-r'+(on?' on':'')+(nm?' anv-r-nom':'')+'"'+att+' title="'+_escAttr(tit)+'" onclick="planAnneePan(this)">'
      +'<span class="anv-c1"><span class="anv-nm">'+nom+'</span><span class="anv-dt">'+dates+'</span><span class="anv-ps">'+(r.k==='f'?_paH(0):ps)+'</span></span><span class="anv-t">'
      +r.seg.map(function(p){return '<span class="anv-bar'+cls+'" style="left:'+_anvP(p.i0,N)+';width:'+((p.i1-p.i0+1)/N*100).toFixed(3)+'%"></span>';}).join('')
      +'</span><span class="anv-n"><span'+(r.k==='f'?' class="z"':'')+'>'+ps+'</span><b'+(r.k==='f'?' class="z"':'')+' data-anv="p">'+_paH(r.tot)+'</b></span></button>';});
  // les fériés (toucher : les contrôles) ; dès 2027, la colonne porte les heures des fériés chômés, comptés pour leurs heures prévues
  var fe=(C.nv&&C.brut-C.tot>0.05)?C.brut-C.tot:0;
  h+='<button type="button" class="anv-l anv-r anv-pt" data-pan="ctl" title="Les f\u00e9ri\u00e9s de '+C.yr+'\u00a0: le cadre et les f\u00e9ri\u00e9s du mod\u00e8le" onclick="planAnneePan(this)"><span class="anv-c1"><b class="anv-ti anv-ti-d">F\u00e9ri\u00e9s</b></span><span class="anv-t">';
  J.forEach(function(x){if(!x.fer)return;h+='<span class="anv-fe'+(x.h>0?'':' c')+'" style="left:'+_anvP(x.i+0.5,N)+'" title="'+_escAttr(x.fer+' \u2014 '+_planAnneeDate(J,x.i,true)+(x.h>0?'\u00a0: '+_paH(x.h):'\u00a0: ch\u00f4m\u00e9'))+'"></span>';});
  h+='</span><span class="anv-n"><span></span><b data-anv="fe"'+(fe?' title="F\u00e9ri\u00e9s ch\u00f4m\u00e9s, compt\u00e9s pour leurs heures pr\u00e9vues"':'')+'>'+(fe?'+'+_paH(fe):'')+'</b></span></button>';
  if(C.cpS.some(function(q){return q.length;})){
    h+='<div class="anv-l anv-cg"><span class="anv-c1"><b class="anv-ti anv-ti-d">Cong\u00e9s pos\u00e9s</b></span><span class="anv-t">';
    A.sem.forEach(function(s,k){var nb=C.cpS[k].length;if(!nb)return;var a=s.j[0].i,b=s.j[s.j.length-1].i;
      h+='<span class="anv-cp" style="left:calc('+_anvP(a,N)+' + 1px);width:calc('+((b-a+1)/N*100).toFixed(3)+'% - 2px)" title="'+_escAttr('En cong\u00e9\u00a0: '+C.cpS[k].join(', '))+'">'+(nb>1?'<b>'+nb+'</b>':'')+'</span>';});
    h+='</span><span class="anv-n"></span></div>';}
  // la semaine ouverte (seulement quand son panneau l'est), aujourd'hui
  var xT=function(f){return 'calc(var(--anv-lab) + 12px + (100% - var(--anv-lab) - var(--anv-num) - 24px) * '+f.toFixed(5)+')';};
  if(pan&&pan.t==='w'&&A.sem[C.sel]){var sw=A.sem[C.sel],a=sw.j[0].i,b=sw.j[sw.j.length-1].i;
    h+='<span class="anv-sel" style="left:'+xT(a/N)+';width:calc((100% - var(--anv-lab) - var(--anv-num) - 24px) * '+((b-a+1)/N).toFixed(5)+')"></span>';}
  if(C.auj)h+='<span class="anv-auj" style="left:'+xT((C.auj.i+0.5)/N)+'" title="Aujourd\u2019hui, '+_planAnneeDate(J,C.auj.i,true)+'"></span>';
  return h+'</div>';
}
function _anvLegende(C){var A=C.A,L=['<i class="anv-lg anv-lg-s"></i>saison'];
  if(A.saisons.some(function(s){return s.ab;}))L.push('<i class="anv-lg anv-lg-ab"></i>une semaine sur deux');
  if(A.sem.some(function(s){return s.apart;}))L.push('<i class="anv-lg anv-lg-ap"></i>semaine \u00e0 part');
  if(A.fermetures.length)L.push('<i class="anv-lg anv-lg-f"></i>ferm\u00e9');
  if(A.sem.some(function(s){return s.h>C.L.hebdoLeg+0.001;}))L.push('<i class="anv-lg anv-lg-p"></i>au-dessus de '+C.L.hebdoLeg+'\u00a0h');
  if(C.J.some(function(x){return x.fer&&x.h>0;}))L.push('<i class="anv-lg anv-lg-fe"></i>f\u00e9ri\u00e9 travaill\u00e9');
  if(C.J.some(function(x){return x.fer&&!(x.h>0);}))L.push('<i class="anv-lg anv-lg-fe c"></i>ch\u00f4m\u00e9');
  if(C.cpS.some(function(q){return q.length;}))L.push('<i class="anv-lg anv-lg-cp"></i>cong\u00e9 pos\u00e9');
  if(C.auj)L.push('<i class="anv-lg anv-lg-au"></i>aujourd\u2019hui');
  return '<span class="anv-leg" aria-label="L\u00e9gende">'+L.map(function(x){return '<span>'+x+'</span>';}).join('')+'</span>';}
// la ligne d'état : chacune ouvre son panneau
function _anvEtat(C){var E=C.E,n=C.fp.length,nj=C.A.jours.length,h='<div class="anv-etat">';
  h+='<button type="button" class="anv-et" data-pan="ctl" data-tuto="plan.annee.cadre" onclick="planAnneePan(this)"><span class="anv-d '+(C.cadOk?'ok':'at')+'"></span>'+(C.cadOk?'Cadre respect\u00e9':'Cadre \u00e0 revoir')+'</button>';
  h+='<button type="button" class="anv-et" data-pan="ctl" data-tuto="plan.annee.feries.ouvrir" onclick="planAnneePan(this)"><span class="anv-d '+(n?'at':'ok')+'"></span>'
    +(n?n+' f\u00e9ri\u00e9'+(n>1?'s':'')+' travaill\u00e9'+(n>1?'s':'')+'<span class="anv-pc">au mod\u00e8le</span>':'Aucun f\u00e9ri\u00e9 travaill\u00e9')+'</button>';
  if(nj)h+='<button type="button" class="anv-et" data-pan="jours" data-tuto="plan.annee.jours.ouvrir" onclick="planAnneePan(this)"><span class="anv-d"></span>'+nj+' jour'+(nj>1?'s':'')+' \u00e0 part</button>';
  if(!C.gens.length)h+='<button type="button" class="anv-et" data-pan="suivi" data-tuto="plan.annee.suivi.ouvrir" onclick="planAnneePan(this)"><span class="anv-d at"></span>Personne ne suit \u00ab\u00a0'+_escHtml(C.id)+'\u00a0\u00bb</button>';
  if(C.adm&&E.brouillon)h+='<span class="anv-et anv-et-b"><span class="anv-d at"></span>Pas encore enregistr\u00e9</span>';
  return h+_anvLegende(C)+'</div>';}
function _planRenderAnnee(){
  if(_anvTenir)return;   // ★ ANNEE-3 : un champ quitté enregistre d'abord ; son rendu attend la fin du geste en cours (_anvApres)
  var body=document.getElementById('plan-body'),E=_paE();if(!body)return;   // ★ ANNEE-TAB : l'onglet L'année
  if(!E||!E.annee)E=_paNeuf(_planAnneeModeleDefaut());
  var yr=_pY();
  // ★ ANNEE-2 : un brouillon appartient à son année — l'année changée ailleurs (le Mois) ne le pose pas sur une autre
  if(E.brouillon&&E.an!=null&&E.an!==yr){body.innerHTML='<div class="mvencadre mvencadre-attention" data-anv="autre-an"><b>Les modifications de \u00ab\u00a0'+_escHtml(E.annee)+'\u00a0\u00bb '+E.an+' ne sont pas enregistr\u00e9es.</b>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="mvbtn mvbtn-principal" data-y="'+E.an+'" onclick="if(window.planSetYear)window.planSetYear(+this.dataset.y)">Revenir en '+E.an+'</button>'
      +'<button type="button" class="mvbtn mvbtn-secondaire" onclick="planAnneeAnnuler()">Les abandonner</button></div></div>';
    if(E.pan)planAnneePanFermer();return;}
  if(!E.brouillon)E.an=yr;
  var C=_anvCtx(E),_nc=C.adm?_planAnneeCodes(C.MT):0;
  var sb=document.getElementById('plan-stats-band');if(sb&&C.adm)sb.innerHTML=_planAnneeBande();   // la bande suit le brouillon : la carte ne répète plus le compte
  body.innerHTML='<div class="anv">'+(_nc?'<div class="plan-card" style="margin-bottom:10px"><div style="font-size:var(--pt-txt,13px)">Ce mod\u00e8le porte '+_nc+' code'+(_nc>1?'s':'')+' D, M ou A (horaires d\u00e9cal\u00e9s)\u00a0: les \u00e9crire en heures, une fois, sans rien changer aux heures ni \u00e0 la paie.</div><button class="plan-btn-saisir" style="margin-top:8px" onclick="planAnneeDma()">\u00c9crire les horaires en clair</button></div>':'')
    +_anvOutils(C)+_planAnneeManque(C.id,C.yr,C.adm,E)   // ★ PREPAN-2 (§560) : le modèle absent de l'année le dit
    +'<div class="mvcarte-fond anv-carte" data-tuto="plan.annee.frise">'+_anvVue(C)+_anvEtat(C)+'</div></div>';   // un seul bloc : #plan-body est une rangée flexible qui répartirait sa hauteur entre les lignes
  if(E.pan&&document.getElementById(ANV_OV))_anvPanPeindre(C);
}
// ── le panneau ──
function _anvOv(){var o=document.getElementById(ANV_OV);if(o)return o;
  o=document.createElement('div');o.id=ANV_OV;o.className='overlay anv-ov';o.setAttribute('onclick','planAnneePanFermer(event)');
  o.innerHTML='<div class="modal anv-pan" role="dialog" aria-modal="true" aria-labelledby="anv-pan-t"><div class="modal-handle"></div><div class="modal-hd anv-pan-h" id="anv-pan-h"></div><div class="modal-body anv-pan-c" id="anv-pan-c"></div><div class="anv-pied" id="anv-pied"></div></div>';
  document.body.appendChild(o);return o;}
function _anvOuvert(){var o=document.getElementById(ANV_OV);return !!(o&&o.classList.contains('open'));}
function _anvOuvrir(p){var E=_paE();if(!E||!E.annee)return;
  E.pan=p;E.jourSel=null;E.cel=null;_anvOv();_anvAppuiEcoute();_planRenderAnnee();   // ANNEE-3 : le panneau ouvert, on suit les appuis (_anvApres)
 
  if(!_anvOuvert()&&typeof window.openOv==='function')window.openOv(ANV_OV);
  var c=document.getElementById('anv-pan-c');if(c)c.scrollTop=0;}
function planAnneePan(el){var E=_paE();if(!E||!E.annee||!el||!el.dataset)return;var t=el.dataset.pan,p={t:t};
  if(t==='s'){p.si=parseInt(el.dataset.s,10);if(isNaN(p.si))return;}
  else if(t==='w'){var w=parseInt(el.dataset.w,10);if(isNaN(w))return;E.semaine=w;}
  else if(['ctl','jours','suivi'].indexOf(t)<0)return;
  _anvOuvrir(p);}
function planAnneePanFermer(e){var o=document.getElementById(ANV_OV);if(e&&e.target&&o&&e.target!==o)return;
  var E=_paE();if(E){E.pan=null;E.jourSel=null;E.cel=null;}
  if(o){if(typeof window.closeOv==='function')window.closeOv(null,ANV_OV);else o.classList.remove('open');
    ['anv-pan-h','anv-pan-c','anv-pied'].forEach(function(i){var x=document.getElementById(i);if(x){x.innerHTML='';x._anv='';}});}   // fermé, il ne garde ni boutons ni ancres de tuto
  _planRenderAnnee();}
function _anvSec(t){return '<div class="anv-sec">'+t+'</div>';}
function _anvPanSaison(C,si){var A=C.A,J=C.J,E=C.E,sa=A.saisons[si];if(!sa)return null;
  var a=-1,b=-1,t=0;J.forEach(function(x){if(x.s===si&&!x.ferme&&!x.apart){if(a<0)a=x.i;b=x.i;t+=x.h;}});if(a<0)return null;
  var adm=C.adm,deux=sa.ab||!!(E.ab&&E.ab[_planAnneeCleS(A,si)]),cs=E.cel,pr=_planAnneePriseSaison(A,si,C.MT);
  var lig=deux?[{l:'A',v:sa.h},{l:'B',v:sa.hB||sa.h}]:[{l:'',v:sa.h}];   // une semaine sur deux : la B sous la A (pareille tant qu'on ne l'a pas réglée)
  var c='<div class="anv-sec anv-sec-f"><span>Les jours</span>'+(adm?'<button type="button" class="ephy-tgl anv-tog'+(deux?' on':'')+'" role="switch" aria-checked="'+deux+'" data-s="'+si+'"'+(deux?' data-on="1"':'')
      +(si===0?(deux?' data-tuto="plan.annee.ab1"':' data-tuto="plan.annee.ab"'):'')+' onclick="planAnneeBascule(this)"><span>une semaine sur deux</span><span class="sw"></span></button>'
      :(deux?'<span class="anv-ln-s">une semaine sur deux</span>':''))+'</div>'
    +_anvGrille(C,lig,{k:'s',s:si},si===0?{'':' data-tuto="plan.annee.cel"',A:' data-tuto="plan.annee.cel"',B:' data-tuto="plan.annee.abcel"'}:null);
  if(adm&&cs&&cs.k==='s'&&+cs.s===si){var vv=((cs.l==='B')?(sa.hB||sa.h):sa.h)[+cs.g];c+=_anvChoix(C,ANV_JN[+cs.g]+(cs.l?', semaine '+cs.l:''),vv);}
  if(deux){var x0=J[a];c+='<div class="anv-note">La semaine du '+_planAnneeDate(J,Math.max(0,x0.i-x0.g),true)+' est une semaine A\u00a0; elles alternent ensuite.</div>';}
  c+=_anvSec('L\u2019horaire et les dates')
    +'<div class="anv-ln"><span class="anv-ln-n">Prise de poste</span>'+(adm?_anvHeure('prise',pr,' data-s="'+si+'"',si===0?' data-tuto="plan.annee.prise"':'','Prise de poste'):'<b class="anv-ln-v">'+_paHm(pr)+'</b>')+'</div>'
    +'<div class="anv-ln"><span class="anv-ln-n">Dates</span>'+((adm&&si>0)?_anvDebut(C,si,a):'<span class="anv-ln-s">'+_planAnneeDate(J,a,true)+'</span>')+'<span class="anv-ln-s">\u2192 '+_planAnneeDate(J,b,true)+'</span></div>'
    +'<div class="anv-note">'+_planAnneeHorairesTxt(A,si,C.MT)+'</div>';
  return {t:_planAnneePlage(J,a,b),s:_anvParSem(sa)+' par semaine \u00b7 '+_paH(t)+' sur la saison',c:c,nom:{k:'s',s:si,v:C.noms.s[si]||'',ph:'Nom de la saison (facultatif)'}};}
function _anvPanSemaine(C){var A=C.A,J=C.J,E=C.E,MT=C.MT,adm=C.adm,sel=C.sel,Sw=A.sem[sel];if(!Sw)return null;
  var a0=Sw.j[0].i,b0=Sw.j[Sw.j.length-1].i,si0=-1,cs=E.cel;Sw.j.forEach(function(x){if(si0<0&&!x.fer)si0=x.s;});var Ssw=A.saisons[si0];
  var diff=!!Ssw&&Sw.j.some(function(x){return !x.fer&&x.h!==Ssw.h[x.g];}),finS=-1;J.forEach(function(x){if(x.s===si0&&!x.ferme&&!x.apart)finS=x.i;});
  var prem=Sw.j.find(function(y){return !y.fer&&y.h>0;});
  var c=_anvSec('Les jours')+'<div data-tuto="plan.annee.semp">'+Sw.j.map(function(x){   // FRISE-4 : la semaine, jour par jour ; ANNEE-3 : ses heures ouvrent le choix et sa prise de poste
      var sol=!!(C.sj&&C.sj.m===x.m&&C.sj.d===x.d),t=x.fer?null:_planAnneeHoraire(MT,x.m,x.d,x.h),on=!!(cs&&cs.k==='j'&&+cs.m===x.m&&+cs.j===x.d);
      var sub=x.fer?_planAnneeFerieSem(x,A,C.yr,ANV_JN[x.g],adm)   // ★ FERIES-1 (§556) : le férié dit son état, se chôme, se travaille
        :(t?_paHm(t.d)+' \u2192 '+_paHm(t.f)+(t.jour?' \u00b7 d\u00e9cal\u00e9':''):'repos');
      var cel=(x.fer&&(sol||!(x.h>0)))?'':_anvCel(C,{k:'j',m:x.m,j:x.d},x.h,ANV_JN[x.g]+' '+_planAnneeDate(J,x.i,true),x===prem?' data-tuto="plan.annee.heure"':'',true);
      return '<div class="anv-jr'+(on?' on':'')+'"><span class="anv-jr-n">'+ANV_JC[x.g]+' '+_planAnneeDate(J,x.i)+'</span><span class="anv-jr-s">'+sub+'</span>'+cel+'</div>'+((on&&adm)?_anvJourEd(C,x,t):'');}).join('')+'</div>';
  if(adm){c+='<div class="anv-act">'+(Sw.ferme?'<button type="button" class="mvbtn mvbtn-secondaire" data-tuto="plan.annee.rsem" data-w="'+sel+'" onclick="planAnneeRemettre(this)">Rouvrir comme la saison</button>'
        :'<button type="button" class="mvbtn mvbtn-secondaire" data-tuto="plan.annee.fsem" data-w="'+sel+'" onclick="planAnneeFermeSem(this)">Fermer la semaine</button>'
        +(diff?'<button type="button" class="mvbtn mvbtn-secondaire" data-w="'+sel+'" onclick="planAnneeRemettre(this)">Comme la saison</button>':''))+'</div>';
    if(!Sw.ferme&&Ssw){ _mvInfoSet('plan.rythme',{ p:['Les jours r\u00e9guliers de la saison, de cette semaine'+(finS>=0?' jusqu\u2019au <b>'+_planAnneeDate(J,finS,true)+'</b>':'')+'\u00a0; la frise en fera une nouvelle saison.'] });   // MOTS-17 : la note vit dans le « i »
      c+='<div class="anv-sec anv-sec-f"><span>Changer le rythme \u00e0 partir d\u2019ici</span>'+_mvInfoBtn('plan.rythme')+'</div>'
        +_anvGrille(C,[{l:'',v:Ssw.h}],{k:'r',w:sel},{'':' data-tuto="plan.annee.desici"'});
      if(cs&&cs.k==='r'&&+cs.w===sel)c+=_anvChoix(C,ANV_JN[+cs.g]+', d\u00e8s cette semaine',Ssw.h[+cs.g]);}}
  var nav='<button type="button" class="mvbtn mvbtn-secondaire mvbtn-icone" data-d="-1" aria-label="Semaine pr\u00e9c\u00e9dente" onclick="planAnneeSemaine(this)">\u2039</button>'
    +'<button type="button" class="mvbtn mvbtn-secondaire mvbtn-icone" data-tuto="plan.annee.sem" data-d="1" aria-label="Semaine suivante" onclick="planAnneeSemaine(this)">\u203a</button>';
  var nmS=(!Sw.apart&&!Sw.ferme&&si0>=0)?C.noms.s[si0]:null;   // ★ ANNEE-4
  return {nav:nav,t:'Semaine du '+_planAnneePlage(J,a0,b0),s:_paH(Sw.h)+(Sw.ferme?' \u00b7 ferm\u00e9e':Sw.apart?' \u00b7 semaine \u00e0 part':nmS?' \u00b7 '+_escHtml(nmS):''),c:c,
    nom:Sw.apart?{k:'w',w:sel,v:C.noms.w[sel]||'',ph:'Nom de la semaine (facultatif)'}:null};}
function _anvPanCtl(C){
  var c=_anvSec('Le cadre')+C.cad.map(function(l){return '<div class="anv-ln"><span class="mvpas mvpas-statut '+(l[0]?'mvpas-fait':'mvpas-surveiller')+'">'+(l[0]?'ok':'\u00e0 voir')+'</span><span class="anv-ln-n">'+l[1]+'</span><span class="anv-ln-s">'+l[2]+'</span></div>';}).join('')
    +'<div class="anv-ln"><span class="mvpas mvpas-statut mvpas-fait">ok</span><span class="anv-ln-n">Dimanches travaill\u00e9s</span><span class="anv-ln-s">'+(C.dim||'aucun')+'</span></div>'
    +_planAnneeFeriesBloc(C.A,C.id,C.yr,C.adm,true);   // ★ FERIES-1 (§556) : la liste ouverte, dans le panneau
  return {t:'Les contr\u00f4les',s:'le cadre l\u00e9gal et les f\u00e9ri\u00e9s de \u00ab\u00a0'+_escHtml(C.id)+'\u00a0\u00bb',c:c};}
function _anvPanJuste(C){var E=C.E,ec=C.ec;E.sg=_planAnneeSuggestions(C.id,C.yr,C.G,C.att,C.L.maxJour);
  var c=E.sg.length?'':'<div class="anv-note">Aucune retouche simple ne tombe juste\u00a0: r\u00e8gle une saison dans sa grille.</div>';
  E.sg.forEach(function(s,k){c+='<div class="anv-sg">'+s.mv.map(function(m){return '<div>'+_escHtml(m.lib)+' <span class="anv-ln-s">('+(m.d>0?'+':'')+_paH(m.d)+')</span></div>';}).join('')
    +'<div class="anv-sg-p"><span>= <b>'+_paH(s.t)+'</b>'+(Math.abs(s.reste)<0.05?' \u00b7 juste':(s.reste>0?' \u00b7 il manque '+_paH(s.reste):' \u00b7 '+_paH(-s.reste)+' de trop'))+'</span>'
    +'<button type="button" class="mvbtn mvbtn-secondaire"'+(k===0?' data-tuto="plan.annee.appl"':'')+' data-k="'+k+'" onclick="planAnneeAppliquer(this)">Appliquer</button></div></div>';});
  return {t:'Tomber juste',s:(Math.abs(ec)<0.05?'juste':(ec<0?'il manque '+_paH(-ec):_paH(ec)+' de trop'))+' \u00b7 cible '+_paH(C.att),c:c};}
function _anvPanSuivi(C){return {t:'Qui suit \u00ab\u00a0'+_escHtml(C.id)+'\u00a0\u00bb',s:C.gens.length?C.gens.length+' salari\u00e9'+(C.gens.length>1?'s':''):'personne',c:_planAnneeSuivi(C.id,C.gens,C.adm)};}   // ★ MODSUIVI-1 (§555)
function _anvPanJours(C){var A=C.A,J=C.J,E=C.E,adm=C.adm,cs=E.cel;if(!A.jours.length)return null;
  var c=A.jours.map(function(x,k){var S=A.saisons[x.s],ty=S?(((S.ab&&x.lettre==='B')?S.hB:S.h)[x.g]):A.type[x.m][x.g],on=!!(cs&&cs.k==='j'&&+cs.m===x.m&&+cs.j===x.d),q=ANV_JN[x.g]+' '+_planAnneeDate(J,x.i,true);
    return '<div class="anv-jr'+(on?' on':'')+'"><span class="anv-jr-n">'+ANV_JC[x.g]+' '+_planAnneeDate(J,x.i)+'</span><span class="anv-jr-s">au lieu de '+(ty>0?_paH(ty):'repos')+'</span>'
      +_anvCel(C,{k:'j',m:x.m,j:x.d},x.h,q,k===0?' data-tuto="plan.annee.jour"':'',true)+'</div>'
      +((on&&adm)?'<div class="anv-jr-ed">'+_anvChoix(C,q,x.h)+'<div class="anv-act"><button type="button" class="mvbtn mvbtn-secondaire"'+(k===0?' data-tuto="plan.annee.remettre"':'')+' data-m="'+x.m+'" data-j="'+x.d+'" onclick="planAnneeRemettre(this)">Comme la saison</button></div></div>':'');}).join('');
  return {t:'Les jours \u00e0 part',s:A.jours.length+' jour'+(A.jours.length>1?'s':'')+' qui s\u2019\u00e9carte'+(A.jours.length>1?'nt':'')+' de leur saison',c:c};}
// ★ ANNEE-4 (§615) — le titre du panneau : une saison, une semaine à part ont un nom (facultatif). L'admin le tape en tête, à la
//   place du titre (les dates passent dessous, et nomment la fenêtre pour les lecteurs d'écran) ; les autres le lisent.
function _anvPanTitre(C,r){var n=r.nom,st=r.s?'<span>'+r.s+'</span>':'';
  if(!n)return '<div class="anv-pan-tt"><b id="anv-pan-t">'+r.t+'</b>'+st+'</div>';
  if(!C.adm)return '<div class="anv-pan-tt"><b>'+(n.v?_escHtml(n.v):r.t)+'</b><span id="anv-pan-t">'+(n.v?r.t+' \u00b7 ':'')+(r.s||'')+'</span></div>';
  return '<div class="anv-pan-tt"><input class="mvchamp mvchamp-compact anv-nom" type="text" maxlength="40" autocomplete="off" enterkeyhint="done" value="'+_escAttr(n.v)+'" placeholder="'+n.ph+'"'
    +' aria-label="'+n.ph+'" data-f="nom" data-k="'+n.k+'"'+(n.k==='s'?' data-s="'+n.s+'"':' data-w="'+n.w+'"')
    +' onchange="planAnneeChamp(this,event)" onkeydown="planAnneeChamp(this,event)"><span id="anv-pan-t">'+r.t+(r.s?' \u00b7 '+r.s:'')+'</span></div>';}
function _anvPanPeindre(C){var E=C.E,p=E.pan,o=_anvOv(),hd=document.getElementById('anv-pan-h'),c=document.getElementById('anv-pan-c'),pd=document.getElementById('anv-pied');if(!p||!hd||!c)return;
  var r=p.t==='s'?_anvPanSaison(C,p.si):p.t==='w'?_anvPanSemaine(C):p.t==='ctl'?_anvPanCtl(C):p.t==='juste'?_anvPanJuste(C):p.t==='suivi'?_anvPanSuivi(C):p.t==='jours'?_anvPanJours(C):null;
  if(!r){planAnneePanFermer();return;}   // la saison a disparu (une coupe), plus de jour à part : le panneau se ferme
  // ★ ANNEE-3 : chaque partie n'est réécrite que si elle change — un bouton visé ne disparaît pas sous le doigt ; le champ qu'on
  //   vient de régler (la liste des lundis) garde le focus
  var H=(r.nav||'')+_anvPanTitre(C,r)
    +'<button type="button" class="mvbtn mvbtn-secondaire mvbtn-icone" data-tuto="plan.annee.pan.x" aria-label="Fermer" onclick="planAnneePanFermer()">\u2715</button>';
  if(hd._anv!==H){hd.innerHTML=H;hd._anv=H;}
  if(c._anv!==r.c){var st=c.scrollTop,ae=document.activeElement,gk=(ae&&ae.tagName==='SELECT'&&c.contains(ae))?ae.getAttribute('data-garde'):null;   // une liste seulement : rendre le focus à un champ heure le ferait repartir de zéro
    c.innerHTML=r.c;c._anv=r.c;c.scrollTop=st;
    if(gk){var nw=c.querySelector('[data-garde="'+gk+'"]');if(nw&&nw.focus){try{nw.focus({preventScroll:true});}catch(e){nw.focus();}}}}
  var P=(C.adm&&E.brouillon)?'<span>Pas encore enregistr\u00e9</span>'+_anvBrouillonBtns(true):'';
  if(pd&&pd._anv!==P){pd.innerHTML=P;pd._anv=P;}
  var m=o.querySelector('.anv-pan');if(m)m.setAttribute('data-pan',p.t);}
// ★★ ANNEE-3 (§614) — PLUS DE « − / + » (maquette v3, validée le 26/11 : « impeccable » ; le lot : « go », 26/11). Une saison
//   se règle dans sa GRILLE : lundi à dimanche en colonnes, la semaine A (et la B, « une semaine sur deux ») en lignes, le total de
//   la semaine au bout. On touche un jour, on choisit une durée — repos, 4, 7, 7,5, 8, 8,5 — ou on la tape (« Autre durée », au
//   quart d'heure) : elle va à tous les jours réguliers de ce jour-là dans la saison, comme le « + » d'avant (jours à part,
//   semaines à part et fermetures ne bougent pas). Le même choix sert pour un jour de la semaine ouverte, un jour à part et
//   « Changer le rythme à partir d'ici ». La prise de poste (d'une saison, d'un jour) est un champ heure ; le début d'une saison,
//   la liste de ses lundis possibles (une coupe se fait par semaines entières). Les gestes de planning-annee.js lisent la valeur
//   (data-v, data-t, data-iso) en plus du pas d'avant : un seul chemin écrit le brouillon, rien n'est écrit avant « Enregistrer ».
var ANV_CHOIX=[0,4,7,7.5,8,8.5],ANV_JN=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'],ANV_JC=['lun.','mar.','mer.','jeu.','ven.','sam.','dim.'];
function _anvDec(v){return v>0?String(Math.round(v*100)/100).replace('.',','):'\u2013';}   // dans la grille : « 7,5 » ; repos, un tiret
function _anvHHMM(t){var q=String(t||'').split(':');return String(parseInt(q[0],10)||0).padStart(2,'0')+':'+String(parseInt(q[1],10)||0).padStart(2,'0');}
function _anvIso(yr,x){return yr+'-'+String(x.m+1).padStart(2,'0')+'-'+String(x.d).padStart(2,'0');}
function _anvMemeCel(a,b){if(!a||!b||a.k!==b.k)return false;for(var k in b)if(String(a[k])!==String(b[k]))return false;return true;}
// une case : un bouton pour l'admin, la valeur seule sinon. o dit ce qu'elle règle : {k:'s',s,l,g} un jour de la semaine d'une
// saison (l : A, B, ou rien), {k:'r',w,g} un jour de la semaine dès la semaine w (« Changer le rythme »), {k:'j',m,j} un jour.
// tu : l'attribut de l'ancre d'un tuto, écrit en entier (les tutos et leurs harnais cherchent data-tuto="…" dans le code).
function _anvCel(C,o,v,lab,tu,large){var tx=large?(v>0?_paH(v):'repos'):_anvDec(v),cl='anv-cel'+(large?' anv-cel-v':'')+(v>0?'':' z');
  if(!C.adm)return '<span class="'+cl+'">'+tx+'</span>';
  var on=_anvMemeCel(C.E.cel,o),att='';for(var k in o)att+=' data-'+k+'="'+_escAttr(String(o[k]))+'"';
  return '<button type="button" class="'+cl+(on?' on':'')+'"'+att+(tu||'')+' aria-pressed="'+on+'" aria-label="'+_escAttr(lab+'\u00a0: '+(v>0?_paH(v):'repos'))+'" onclick="planAnneeCel(this)">'+tx+'</button>';}
// la grille : lundi à dimanche en colonnes, une ligne par semaine (A, B), le total de la semaine au bout ; tu : l'ancre du
// vendredi de chaque ligne (du lundi pour « Changer le rythme » : la semaine d'après le garde presque toujours dans sa saison)
function _anvGrille(C,lignes,o0,tu){var ab=lignes.length>1;
  var h='<div class="anv-gr'+(ab?' anv-gr-ab':'')+'"><span></span>'+ANV_JL.map(function(l){return '<span class="anv-gr-hd" aria-hidden="true">'+l+'</span>';}).join('')+'<span class="anv-gr-hd anv-gr-r">sem.</span>';
  lignes.forEach(function(r){h+='<span class="anv-gr-rl">'+r.l+'</span>'+r.v.map(function(v,g){var o={},k;for(k in o0)o[k]=o0[k];if(o0.k==='s')o.l=r.l;o.g=g;
      return _anvCel(C,o,v,ANV_JN[g]+(r.l?', semaine '+r.l:''),(tu&&g===(o0.k==='r'?0:4)&&tu[r.l])||'');}).join('')+'<span class="anv-gr-tt">'+_paH(_anvSom(r.v))+'</span>';});
  return h+'</div>';}
// le choix d'une durée, sous la case touchée : les durées courantes, ou une autre (au quart d'heure). L'ancre des tutos va à la
// durée voisine (la suivante ; au bout de la liste, la précédente) : le geste d'exemple change toujours quelque chose.
function _anvChoix(C,q,v){var L=C.L,nx=-1,i;
  for(i=0;i<ANV_CHOIX.length;i++)if(ANV_CHOIX[i]>v+0.001){nx=i;break;}
  if(nx<0)for(i=ANV_CHOIX.length-1;i>=0;i--)if(ANV_CHOIX[i]<v-0.001){nx=i;break;}
  return '<div class="anv-choix" data-tuto="plan.annee.choix"><span class="anv-choix-q">'+q+'</span><div class="anv-choix-l" role="group" aria-label="'+_escAttr(q)+'">'
    +ANV_CHOIX.map(function(c,k){var on=Math.abs(c-v)<0.001;
      return '<button type="button" class="anv-chip'+(on?' on':'')+'" data-v="'+c+'"'+(k===nx?' data-tuto="plan.annee.val"':'')+' aria-pressed="'+on+'"'+(c>L.maxJour?' disabled':'')+' onclick="planAnneeVal(this)">'+(c>0?_anvDec(c):'Repos')+'</button>';}).join('')
    +'</div><label class="anv-choix-au"><span>Autre dur\u00e9e</span><input class="mvchamp mvchamp-compact anv-in anv-in-h" type="number" inputmode="decimal" min="0" max="'+L.maxJour+'" step="0.25" value="'+(Math.round(v*100)/100)+'" data-f="autre" data-garde="autre" aria-label="Autre dur\u00e9e, en heures" onchange="planAnneeChamp(this,event)" onkeydown="planAnneeChamp(this,event)"><em>h</em></label></div>';}
// un champ heure (une prise de poste) : il s'enregistre en le quittant (Entrée, un toucher ailleurs) ou quand une roue le pose
function _anvHeure(f,val,att,tu,lab){return '<input class="mvchamp mvchamp-compact anv-in anv-in-t" type="time" step="900" min="04:00" max="12:00" value="'+_anvHHMM(val)+'" data-f="'+f+'" data-garde="'+f+'"'+att+(tu||'')+' aria-label="'+lab+'"'
  +' oninput="planAnneeChamp(this,event)" onchange="planAnneeChamp(this,event)" onblur="planAnneeChamp(this,event)" onkeydown="planAnneeChamp(this,event)">';}
// le début d'une saison : un lundi (une coupe se fait par semaines entières), une semaine au moins après le début de la saison
// d'avant, une semaine au moins avant sa propre fin. Le début d'aujourd'hui reste dans la liste, même s'il tombe un autre jour.
function _anvDebut(C,si,a){var J=C.J,P=-1,fin=-1,o='';
  J.forEach(function(x){if(x.ferme||x.apart)return;if(x.s===si-1&&P<0)P=x.i;if(x.s===si)fin=x.i;});
  J.forEach(function(x){if(x.i!==a&&(x.g!==0||P<0||x.i<P+7||x.i>fin-6))return;
    o+='<option value="'+_anvIso(C.yr,x)+'"'+(x.i===a?' selected':'')+'>'+ANV_JC[x.g]+' '+_planAnneeDate(J,x.i)+'</option>';});
  return '<select class="mvchamp mvchamp-compact anv-in anv-in-d" data-f="debut" data-garde="debut" data-s="'+si+'"'+(si===1?' data-tuto="plan.annee.coupe"':'')+' aria-label="D\u00e9but de la saison, un lundi" oninput="planAnneeChamp(this,event)" onchange="planAnneeChamp(this,event)">'+o+'</select>';}
// un jour choisi dans la semaine : sa durée, et sa prise de poste (« Comme la saison » la retire)
function _anvJourEd(C,x,t){var J=C.J,q=ANV_JN[x.g]+' '+_planAnneeDate(J,x.i,true)+(x.fer?' \u00b7 '+_escHtml(x.fer):''),h='<div class="anv-jr-ed">'+_anvChoix(C,q,x.h);
  if(!x.fer&&x.h>0&&t)h+='<div class="anv-ln"><span class="anv-ln-n">Prise de poste ce jour-l\u00e0</span>'+_anvHeure('prisej',t.d,' data-m="'+x.m+'" data-j="'+x.d+'"',' data-tuto="plan.annee.prisej"','Prise de poste ce jour-l\u00e0')
    +'<span class="anv-ln-s">fin \u00e0 '+_paHm(t.f)+'</span>'+(t.jour?'<button type="button" class="mvbtn mvbtn-secondaire" data-m="'+x.m+'" data-j="'+x.d+'" data-p="0" onclick="planAnneePriseJour(this)">Comme la saison</button>':'')+'</div>';
  return h+'</div>';}
// ── les gestes ──
function planAnneeCel(el){var E=_paE();if(!E||!E.annee||!el||!el.dataset)return;var d=el.dataset,o={k:d.k};
  ['s','l','g','w','m','j'].forEach(function(k){if(d[k]!=null)o[k]=d[k];});
  E.cel=_anvMemeCel(E.cel,o)?null:o;   // la case choisie, touchée à nouveau, referme son choix
  E.jourSel=(E.cel&&E.cel.k==='j')?{m:parseInt(o.m,10),d:parseInt(o.j,10)}:null;
  _planRenderAnnee();}
function planAnneeVal(el){if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee||!el||!E.cel)return;
  var raw=(el.tagName==='INPUT')?el.value:(el.dataset&&el.dataset.v),v=parseFloat(String(raw==null?'':raw).replace(',','.')),L=_planLegal(),c=E.cel;
  var non=function(m){if(window.showToast)window.showToast(m,'#B85A1A');};
  if(isNaN(v)||v<0)return non('Une dur\u00e9e en heures\u00a0: repos, ou de 3\u00a0h\u00a030 \u00e0 '+_paH(L.maxJour));
  v=Math.round(v*4)/4;
  if(v>L.maxJour)return non('Au plus '+_paH(L.maxJour)+' par jour');
  if(v>0&&v<3.5)return non('Un jour travaill\u00e9 compte au moins 3\u00a0h\u00a030');   // le jour réduit du cadre
  var s=String(v);
  if(c.k==='s')planAnneePas({dataset:{s:c.s,g:c.g,l:c.l||'',v:s}});
  else if(c.k==='r')planAnneeDesIci({dataset:{w:c.w,g:c.g,v:s}});
  else if(c.k==='j')planAnneeJour({dataset:{m:c.m,j:c.j,v:s}});}
function planAnneeBascule(el){if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee||!el||!el.dataset)return;
  var si=parseInt(el.dataset.s,10),A=_planAnneeLire(E.annee,_pY(),_planAnneeGrille()),S=A.saisons[si];if(!S)return;E.cel=null;
  if(el.dataset.on!=='1'){planAnneeAB(el);return;}
  if(!S.ab){if(E.ab)delete E.ab[_planAnneeCleS(A,si)];_planRenderAnnee();return;}   // la semaine B montrée, jamais réglée : rien à remettre
  planAnneeUneSemaine(el);}
// les champs : une heure tapée au clavier change à chaque morceau (l'heure, puis les minutes) — elle s'enregistre en quittant le
// champ ; « Autre durée », à sa validation ; la liste des lundis, au choix. Le rendu qui suit attend la fin du geste en cours.
var _anvTenir=false,_anvAppui=false,_anvAppuiPose=false;
function planAnneeChamp(el,ev){if(!el||!el.dataset)return;var t=ev&&ev.type,f=el.dataset.f,foc=typeof document!=='undefined'&&document.activeElement===el;
  if(t==='keydown'){el._clavier=true;if(ev.key==='Enter'&&f!=='debut'){if(ev.preventDefault)ev.preventDefault();if(el.blur)el.blur();}return;}   // Entrée : on quitte le champ, le quitter l'enregistre
  if(el.type==='time'&&(t==='input'||t==='change')&&(foc||el._clavier))return;   // au clavier, Chrome change l'heure à chaque morceau (et pas toujours champ actif) : on attend la sortie
  if((f==='autre'||f==='nom')&&t&&t!=='change')return;   // ★ ANNEE-4 : un nom, comme « Autre durée », à sa validation
  if(typeof isAdmin==='function'&&!isAdmin())return;var E=_paE();if(!E||!E.annee)return;
  var x=String(el.value||''),n0=E.n||0,ok=true;
  _anvTenir=true;
  try{
    if(f==='autre')planAnneeVal(el);
    else if(f==='prise'&&/^\d{1,2}:\d{2}/.test(x))planAnneePrise({dataset:{s:el.dataset.s,t:x}});
    else if(f==='prisej'&&/^\d{1,2}:\d{2}/.test(x))planAnneePriseJour({dataset:{m:el.dataset.m,j:el.dataset.j,t:x}});
    else if(f==='debut'&&/^\d{4}-\d{2}-\d{2}$/.test(x))planAnneeCoupe({dataset:{s:el.dataset.s,iso:x}});
    else if(f==='nom')planAnneeNom({dataset:{k:el.dataset.k,s:el.dataset.s,w:el.dataset.w},value:x});
    else ok=false;
  }finally{_anvTenir=false;}
  if(!ok)return;if((E.n||0)!==n0){_anvAppuiEcoute();_anvApres();return;}
  if(el.tagName==='SELECT'){for(var i=0;i<el.options.length;i++)if(el.options[i].defaultSelected)el.selectedIndex=i;}else el.value=el.defaultValue;}   // refusée, ou rien à changer : le champ revient à sa valeur
function _anvAppuiEcoute(){if(_anvAppuiPose||typeof document==='undefined')return;_anvAppuiPose=true;
  document.addEventListener('pointerdown',function(){_anvAppui=true;},true);
  ['pointerup','pointercancel'].forEach(function(k){document.addEventListener(k,function(){_anvAppui=false;},true);});}
// le rendu après un champ : un doigt (une souris) qui appuie déjà ailleurs a visé un bouton — on attend son clic, sinon le rendu
// remplacerait ce bouton entre l'appui et le relâché, et le geste serait perdu
function _anvApres(){var fait=false,go=function(){if(fait)return;fait=true;if(typeof document!=='undefined')document.removeEventListener('click',go);_planRenderAnnee();};
  if(!_anvAppui||typeof document==='undefined'){setTimeout(go,0);return;}
  document.addEventListener('click',go);setTimeout(go,1500);}
// pour les tutos : la valeur ENREGISTRÉE d'un champ (une saisie qui en diffère est faite, même avant l'enregistrement du brouillon)
function _planAnneeTuto(k){var E=_paE();if(!E||!E.annee)return null;var yr=_pY(),T=_planGetTpl(E.annee,yr)||{},A=_planAnneeLire(E.annee,yr,T),M=_planAnneeMetaCopie(T),si=(E.pan&&E.pan.t==='s')?E.pan.si:0;
  if(k==='pr')return _anvHHMM(_planAnneePriseSaison(A,si,M));
  if(k==='prj'){var c=E.cel;if(!c||c.k!=='j')return null;var h=parseFloat((T[+c.m]||{})[+c.j])||0,t=_planAnneeHoraire(M,+c.m,+c.j,h);return t?_anvHHMM(t.d):null;}
  if(k==='deb'){var x=A.J.find(function(y){return y.s===si&&!y.ferme&&!y.apart;});return x?_anvIso(yr,x):null;}
  return null;}
function planAnneeJuste(){var E=_paE();if(!E||!E.annee)return;if(typeof isAdmin==='function'&&!isAdmin())return;_anvOuvrir({t:'juste'});}   // ★ ANNEE-2 : les retouches, dans le panneau
// les menus de la barre (le modèle, « … ») : un seul ouvert ; un toucher ailleurs ou Échap le ferme
function planAnneeMenu(k){var b=document.body;if(!b)return;
  if(k&&b.getAttribute('data-anv-menu')!==k)b.setAttribute('data-anv-menu',k);else b.removeAttribute('data-anv-menu');
  var o=b.getAttribute('data-anv-menu')||'';document.querySelectorAll('#page-planning .anv-dd > button').forEach(function(x){var mk=x.parentNode.querySelector('.anv-menu');x.setAttribute('aria-expanded',String(!!mk&&mk.getAttribute('data-menu')===o));});
  _anvMenuEcoute();}
var _anvMenuPose=false;
function _anvMenuEcoute(){if(_anvMenuPose||typeof document==='undefined')return;_anvMenuPose=true;
  document.addEventListener('click',function(e){var b=document.body;if(!b||!b.getAttribute('data-anv-menu'))return;var t=e.target;if(t&&t.closest&&t.closest('.anv-dd'))return;planAnneeMenu();},true);
  document.addEventListener('keydown',function(e){if((e.key==='Escape'||e.key==='Esc')&&document.body&&document.body.getAttribute('data-anv-menu')){e.preventDefault();e.stopPropagation();planAnneeMenu();}},true);}
// l'année, depuis la barre : refusée tant qu'un brouillon n'est ni enregistré ni annulé
function planAnneeAn(el){var y=el&&el.dataset?parseInt(el.dataset.y,10):NaN;if(isNaN(y))return;var E=_paE();
  if(E&&E.brouillon){if(window.showToast)window.showToast('Enregistrez ou annulez d\u2019abord les modifications de \u00ab\u00a0'+E.annee+'\u00a0\u00bb','#B85A1A');return;}
  if(typeof window.planSetYear==='function')window.planSetYear(y);}

window._planRenderAnnee     = _planRenderAnnee;
window.planAnneePan         = planAnneePan;      // ★ ANNEE-2 (§613) : le panneau, les menus de la barre, l'année
window.planAnneePanFermer   = planAnneePanFermer;
window.planAnneeMenu        = planAnneeMenu;
window.planAnneeAn          = planAnneeAn;
window.planAnneeJuste       = planAnneeJuste;
window.planAnneeCel         = planAnneeCel;      // ★ ANNEE-3 (§614) : la grille des jours, son choix, ses champs
window.planAnneeVal         = planAnneeVal;
window.planAnneeChamp       = planAnneeChamp;
window.planAnneeBascule     = planAnneeBascule;
window._planAnneeTuto       = _planAnneeTuto;
