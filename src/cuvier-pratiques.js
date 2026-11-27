// ═════════════════════════════════════════════════════════════════════════════════════════════════════════
// MA VIGNE — LES PRATIQUES DE CAVE DU DOMAINE (cuvier-pratiques.js) — PRATIQUES-1 (§622)
// Le réglage « Vos pratiques » (roue crantée › Le Cuvier, et le bandeau de la première ouverture), la couleur d'une
// cuve et ses contrôles, le chapeau d'un blanc ou d'un rosé, le parcours prévu d'une cuve.
// ★ Importé par cuvier.js (sorti de lui : cuvier.js aurait pris 5 % en un lot — la question du découpage, posée).
//   Il lit le Cuvier et la Cave par window (le bloc « PRATIQUES-1 » de la frontière de cuvier.js) ; rien ne s'exécute
//   au chargement ; les gestes s'exposent en fin de fichier, les fonctions lues par cuvier.js s'exportent.
// © 2026 Nicolas GUERET / GUERETTECH
// ═════════════════════════════════════════════════════════════════════════════════════════════════════════
import { isAdmin, canWrite, showToast, _escHtml, _escAttr, _mvIcon } from './utils.js';

/* ══════════════════════════════════════════════════════════════════
   ★★★ PRATIQUES-1 (§622) — LES PRATIQUES DE CAVE DU DOMAINE.
   Nico, 27/11 : « peut-être que chez moi, les blancs rentrent d'une certaine façon, et dans un autre
   domaine d'une autre » — qu'un domaine qui adopte l'appli puisse choisir ses pratiques en amont.
   Maquette v1 validée (« c'est ok »), v2 : « rajouter une sécurité quand 2 pratiques ou plusieurs ne
   sont pas compatibles ».
   ★ Le réglage vit dans CAVE_VENDANGE.config.pratiques :
       { actif:{r,b,o}, r:{…}, b:{…}, o:{…}, conf:{id:{par,le}}, par, le }
     Chaque réponse est un TABLEAU (une ou plusieurs). Absent = « pas encore réglées » : l'appli fait
     comme avant (P/R proposés, aucun rosé), à une règle près, valable sans réglage : une cuve de blanc
     ou de rosé n'a pas de chapeau.
   ⚠⚠ CE LOT NE TOUCHE PAS AU CYCLE D'UNE CUVE (_VEND_STEPS, statut, statut_hist) : le parcours PRÉVU
     s'affiche dans la fiche ; les gestes du blanc (pressurage d'arrivée, débourbage, entonnage) sont
     PRATIQUES-2.
   ★ Quatre niveaux de sécurité, une seule source (_pratAlertes, _vcuvCoulCheck) :
       caché          — la question n'a plus de sens (la turbidité sans débourbage) ;
       à vérifier 'w' — possible mais rare : on confirme une fois, la confirmation est notée (qui, quand) ;
       à mettre d'accord 'fix' — deux réponses se contredisent : un appui corrige ;
       impossible 'b' — bloqué, avec la raison. L'appli n'interdit que l'impossible.
══════════════════════════════════════════════════════════════════ */
var _PRAT_Q = {
  r: [
    {k:'egr', t:'À l’arrivée de la vendange', a:'Partiel : le pourcentage se dit à chaque cuve.', m:1, o:[['egr','Égrappé',''],['ent','Vendange entière',''],['part','Partiel','en %']]},
    {k:'mpf', t:'Macération à froid', a:'', m:0, o:[['oui','Oui','avant fermentation'],['non','Non','']]},
    {k:'ext', t:'Pour extraire', a:'Seuls les gestes cochés se proposent à la mesure et dans la tournée.', m:1, o:[['pig','Pigeages',''],['rem','Remontages',''],['del','Délestages','']]},
    {k:'sai', t:'Saignée', a:'', m:0, o:[['oui','Oui','parfois'],['non','Non','']]},
    {k:'pre', t:'Le pressurage se fait', a:'', m:1, o:[['apres','Après la fermentation',''],['avant','Avant la fin','le jus finit hors du marc']]},
    {k:'ml',  t:'La malo se fait', a:'', m:1, o:[['fut','En fût',''],['cuve','En cuve','']]}
  ],
  b: [
    {k:'arr', t:'À l’arrivée de la vendange', a:'Ce qui se passe avant la presse.', m:0, o:[['direct','Pressurage direct','grappes entières'],['egr','Égrappé, puis pressé','foulé ou non'],['pel','Macération pelliculaire','à froid, puis pressé']]},
    {k:'deb', t:'Le jus est clarifié par', a:'', m:0, o:[['stat','Débourbage statique','au froid'],['flot','Flottation',''],['non','Pas de débourbage','']]},
    {k:'ntu', t:'Vous mesurez la turbidité', a:'', m:0, o:[['oui','Oui','turbidimètre'],['non','Non','à l’œil']]},
    {k:'fa',  t:'La fermentation se fait', a:'Plusieurs réponses : chaque cuve choisira.', m:1, o:[['fut','En fût',''],['cuve','En cuve',''],['cf','Démarrée en cuve','puis entonnée']]},
    {k:'ml',  t:'La malo', a:'', m:1, o:[['fait','Faite',''],['bloq','Bloquée','vin vif'],['part','Partielle','par assemblage']]},
    {k:'lies',t:'Pendant l’élevage', a:'', m:0, o:[['bat','Sur lies, bâtonné',''],['lies','Sur lies, sans bâtonnage',''],['sout','Soutiré de ses lies','']]}
  ],
  o: [
    {k:'met', t:'La couleur se fait par', a:'', m:1, o:[['direct','Pressurage direct','le plus pâle'],['sai','Saignée','d’une cuve de rouge'],['mac','Macération courte','puis pressurage']]},
    {k:'deb', t:'Le jus est clarifié par', a:'', m:0, o:[['stat','Débourbage statique','au froid'],['flot','Flottation',''],['non','Pas de débourbage','']]},
    {k:'ml',  t:'La malo', a:'', m:1, o:[['bloq','Bloquée',''],['fait','Faite','']]}
  ]
};
var _PRAT_NOM = {r:'rouge', b:'blanc', o:'rosé'};
/* Les étiquettes des tutos, écrites EN TOUTES LETTRES : le harnais des tutos les cherche telles quelles dans le code
   (une étiquette composée par concaténation lui est invisible). Les autres se composent. */
var _PRAT_ETQ = {
  'prat.r':'data-tuto="prat.r"', 'prat.b':'data-tuto="prat.b"', 'prat.o':'data-tuto="prat.o"',
  'prat.o.met.direct':'data-tuto="prat.o.met.direct"', 'prat.b.ml.bloq':'data-tuto="prat.b.ml.bloq"', 'prat.b.lies.bat':'data-tuto="prat.b.lies.bat"',
  'vcuv.coul.r':'data-tuto="vcuv.coul.r"', 'vcuv.coul.b':'data-tuto="vcuv.coul.b"', 'vcuv.coul.o':'data-tuto="vcuv.coul.o"'
};
function _pratEtq(k){ return _PRAT_ETQ[k] || ('data-tuto="'+k+'"'); }
var _PRAT_NIV = {w:'À vérifier', fix:'À mettre d’accord', b:'Impossible'};
/* Les réponses proposées la première fois. Les couleurs faites : celles des parcelles du domaine. */
function _pratDefaut(){
  var vu={r:0,b:0};
  (window.PARCELLES||[]).forEach(function(p){
    if(!p||!p.nom||p.statut==='Arrachee') return;
    var c=(typeof _parcCoul==='function')?_parcCoul(String(p.nom).trim()):'?';
    if(c==='r'||c==='b') vu[c]++;
  });
  var aucune=!vu.r&&!vu.b;
  return { actif:{r:aucune||vu.r>0, b:aucune||vu.b>0, o:false},
    r:{egr:['egr'], mpf:['non'], ext:['pig','rem'], sai:['non'], pre:['apres'], ml:['fut']},
    b:{arr:['direct'], deb:['stat'], ntu:['non'], fa:['fut'], ml:['fait'], lies:['lies']},
    o:{met:['direct'], deb:['stat'], ml:['bloq']}, conf:{} };
}
/* Les pratiques enregistrées, ou null (« pas encore réglées »). */
function _pratCfg(){
  var p=(CAVE_VENDANGE.config||{}).pratiques;
  return (p&&p.actif&&p.r&&p.b&&p.o)?p:null;
}
function _pratHas(P, c, k, v){ return !!(P&&P[c]&&Array.isArray(P[c][k])&&P[c][k].indexOf(v)!==-1); }
/* Une question n'a plus de sens : la turbidité, sans débourbage. */
function _pratCachee(P, c, k){ return c==='b' && k==='ntu' && _pratHas(P,'b','deb','non'); }
/* ★ LA SOURCE DES SÉCURITÉS DU RÉGLAGE. Chaque règle a sa raison (§622 : sources). */
function _pratAlertes(P){
  var l=[];
  if(!P) return l;
  if(P.actif.b && _pratHas(P,'b','ml','bloq') && _pratHas(P,'b','lies','bat'))
    l.push({id:'lies', niv:'w', c:'b', q:'lies', t:'Malo bloquée et bâtonnage',
      d:'Possible, mais rare : les lies nourrissent les bactéries de la malo. Pour la bloquer, le vin reste sous 15 °C ou reçoit du SO₂, et l’acide malique se suit.'});
  if(P.actif.o && _pratHas(P,'o','met','sai') && !P.actif.r)
    l.push({id:'sai-r', niv:'b', c:'o', q:'met', t:'Une saignée sans rouge',
      d:'La saignée se tire d’une cuve de rouge, et le domaine ne fait pas de rouge. Choisissez une autre méthode, puis retirez la saignée.'});
  else if(P.actif.o && P.actif.r && _pratHas(P,'o','met','sai') && _pratHas(P,'r','sai','non'))
    l.push({id:'sai-fix', niv:'fix', c:'o', q:'met', t:'Deux réponses se contredisent',
      d:'Vos rosés naissent d’une saignée, mais vos pratiques du rouge disent « pas de saignée ».', fix:'Rouge : saignée « parfois »'});
  return l;
}
/* Ce qui reste à régler avant d'enregistrer : tout, sauf « à vérifier » déjà confirmé. */
function _pratOuvertes(P){
  var conf=(P&&P.conf)||{};
  return _pratAlertes(P).filter(function(a){ return !(a.niv==='w'&&conf[a.id]); });
}
/* Le parcours prévu d'une cuve de cette couleur : [[étape, précision], …]. */
function _pratParcours(P, c){
  var s=[], h=function(k,v){ return _pratHas(P,c,k,v); };
  var ou=function(l){ return l.length>1?l.slice(0,-1).join(', ')+' ou '+l[l.length-1]:(l[0]||''); };
  if(c==='b'){
    if(h('arr','egr')) s.push(['Égrappage','']);
    if(h('arr','pel')) s.push(['Égrappage',''],['Macération pelliculaire','à froid']);
    s.push(['Pressurage','goutte et presse']);
    if(h('deb','stat')) s.push(['Débourbage','statique, au froid'+(h('ntu','oui')?' · turbidité':'')]);
    if(h('deb','flot')) s.push(['Flottation',h('ntu','oui')?'turbidité':'']);
    var fa=[]; if(h('fa','fut')) fa.push('en fût'); if(h('fa','cuve')) fa.push('en cuve'); if(h('fa','cf')) fa.push('démarrée en cuve');
    if(h('fa','fut')&&!h('fa','cuve')&&!h('fa','cf')) s.push(['Entonnage',h('deb','non')?'au sortir du pressoir':'fûts du parc']);
    s.push(['Fermentation', ou(fa)+(fa.length>1?' — au choix par cuve':'')]);
    if(h('fa','cf')) s.push(['Entonnage', fa.length>1?'si démarrée en cuve':'en cours de fermentation']);
    var ml=[]; if(h('ml','fait')) ml.push('faite'); if(h('ml','bloq')) ml.push('bloquée'); if(h('ml','part')) ml.push('partielle');
    s.push(['Malo', ou(ml)+(ml.length>1?' — au choix par cuve':'')]);
    if(h('lies','bat')) s.push(['Élevage sur lies','bâtonnages']); else if(h('lies','lies')) s.push(['Élevage sur lies','']); else s.push(['Soutirage','puis élevage']);
  } else if(c==='r'){
    var e=[]; if(h('egr','egr')) e.push('égrappé'); if(h('egr','ent')) e.push('vendange entière'); if(h('egr','part')) e.push('partiel en %');
    s.push(['Encuvage', ou(e)]);
    if(h('mpf','oui')) s.push(['Macération à froid','']);
    if(h('sai','oui')) s.push(['Saignée','début de cuvaison, si besoin']);
    var x=[]; if(h('ext','pig')) x.push('pigeages'); if(h('ext','rem')) x.push('remontages'); if(h('ext','del')) x.push('délestages');
    s.push(['Fermentation', x.join(', ')]);
    if(h('pre','avant')&&h('pre','apres')) s.push(['Pressurage','après la fermentation ou avant la fin — au choix par cuve']);
    else if(h('pre','avant')) s.push(['Pressurage','avant la fin : le jus finit hors du marc']);
    else s.push(['Pressurage','après la fermentation']);
    if(h('ml','fut')&&!h('ml','cuve')) s.push(['Entonnage',''],['Malo','en fût']);
    else if(h('ml','cuve')&&!h('ml','fut')) s.push(['Malo','en cuve'],['Entonnage','']);
    else s.push(['Malo','en fût ou en cuve — au choix par cuve']);
  } else {
    if(h('met','sai')) s.push(['Saignée','d’une cuve de rouge']);
    if(h('met','direct')) s.push(['Pressurage direct','']);
    if(h('met','mac')) s.push(['Macération courte','puis pressurage']);
    if(h('deb','stat')) s.push(['Débourbage','statique, au froid']); else if(h('deb','flot')) s.push(['Flottation','']);
    s.push(['Fermentation','en cuve, au frais']);
    var mo=[]; if(h('ml','bloq')) mo.push('bloquée'); if(h('ml','fait')) mo.push('faite');
    s.push(['Malo', ou(mo)]);
  }
  s.push(['Au Chai','']);
  return s;
}
/* Ce que le réglage change DÈS CE LOT — rien de promis. */
function _pratChange(P, c){
  if(c==='r'){
    var x=[]; if(_pratHas(P,'r','ext','pig')) x.push('les pigeages'); if(_pratHas(P,'r','ext','rem')) x.push('les remontages');
    return [x.length?'La mesure et la tournée proposent '+x.join(' et ')+'.':'La mesure et la tournée ne proposent ni pigeage ni remontage.',
      'La fiche de chaque cuve montre son parcours prévu.'];
  }
  if(c==='b') return ['Une cuve de blanc n’a pas de chapeau : ni pigeage ni remontage à la mesure ou dans la tournée.','La fiche de chaque cuve montre son parcours prévu.'];
  return ['Le rosé devient une couleur de cuve, sans chapeau.','La fiche de chaque cuve montre son parcours prévu.'];
}

/* —— La fenêtre « Vos pratiques » —— */
var _pratEt = null;   // { P: la copie qu'on modifie, coul }
function _pratCopie(P){ return JSON.parse(JSON.stringify(P)); }
function openPratiques(coul){
  var P=_pratCfg();
  _pratEt={ P:_pratCopie(P||_pratDefaut()), neuf:!P, coul:(coul==='r'||coul==='b'||coul==='o')?coul:'r' };
  if(!_pratEt.P.conf) _pratEt.P.conf={};
  if(!_pratEt.P.actif[_pratEt.coul]) _pratEt.coul=_pratEt.P.actif.r?'r':(_pratEt.P.actif.b?'b':'r');
  _pratRendre();
  if(typeof window.openOv==='function') window.openOv('ovPratiques');
}
function _pratAdm(){ return typeof isAdmin==='function' && isAdmin() && canWrite(); }
function _pratRendre(){
  var corps=document.getElementById('prat-corps'), E=_pratEt; if(!corps||!E) return;
  var P=E.P, c=E.coul, adm=_pratAdm(), al=_pratAlertes(P), ouv=_pratOuvertes(P);
  var h='<div class="prat-tete"><h3 class="creg-ed-t">Vos pratiques de cave</h3>'
    +'<p class="prat-sous">Une fois par couleur. Chaque cuve peut s’en écarter. Modifiable à tout moment'+(adm?'.':' par l’administrateur.')+'</p></div>'
    +'<div class="mvbtn-choix prat-coul" role="group" aria-label="Couleur">'+['r','b','o'].map(function(k){
      var on=(k===c), pt=ouv.some(function(a){ return a.c===k; });
      return '<button type="button" class="mvbtn mvbtn-option'+(on?' on':'')+(P.actif[k]?'':' prat-off')+'" aria-pressed="'+on+'" '+_pratEtq('prat.'+k)+' data-c="'+k+'" onclick="_pratCoul(this.dataset.c)">'
        +'<i class="mat-pt '+(k==='o'?'prat-pt-o':_matVin(k))+'"></i>'+(k==='r'?'Rouge':k==='b'?'Blanc':'Rosé')+(pt?'<span class="prat-pt" aria-label="un point à voir"></span>':'')+'</button>';
    }).join('')+'</div>';
  if(!P.actif[c]){
    h+='<div class="mvencadre prat-vide">Le domaine ne fait pas de '+_PRAT_NOM[c]+' : la couleur n’apparaît nulle part.</div>'
      +(adm?'<button type="button" class="mvbtn mvbtn-secondaire prat-plein" data-c="'+c+'" onclick="_pratActif(this.dataset.c)">Nous en faisons</button>':'');
  } else {
    var cachees=[];
    _PRAT_Q[c].forEach(function(q){
      if(_pratCachee(P,c,q.k)){ cachees.push('la turbidité'); return; }
      h+='<div class="prat-q"><div class="prat-q-t">'+q.t+(q.m?'<span class="prat-m">une ou plusieurs</span>':'')+'</div>'+(q.a?'<p class="prat-q-a">'+q.a+'</p>':'')
        +'<div class="prat-ch" role="group" aria-label="'+_escAttr(q.t)+'">'+q.o.map(function(o){
          var v=o[0], sub=o[2], dis=false, on=_pratHas(P,c,q.k,v);
          if(c==='b'&&q.k==='fa'&&v==='fut') sub=_pratHas(P,'b','deb','non')?'au sortir du pressoir':'après débourbage';
          if(c==='o'&&q.k==='met'&&v==='sai'&&!P.actif.r){ dis=true; sub=on?'pas de rouge — touchez pour la retirer':'pas de rouge au domaine'; }
          return '<button type="button" class="prat-o'+(on?' on':'')+(dis?' prat-dis':'')+'" aria-pressed="'+on+'"'+(adm?'':' disabled')
            +' '+_pratEtq('prat.'+c+'.'+q.k+'.'+v)+' data-k="'+q.k+'" data-v="'+v+'" onclick="_pratSet(this.dataset.k,this.dataset.v)">'
            +o[1]+(sub?'<small>'+sub+'</small>':'')+'</button>';
        }).join('')+'</div>'
        +al.filter(function(a){ return a.c===c&&a.q===q.k; }).map(function(a){ return _pratAlHtml(P,a,adm); }).join('')+'</div>';
    });
    if(cachees.length) h+='<p class="prat-cache">Question cachée : '+cachees.join(', ')+' — sans débourbage, il n’y a rien à mesurer.</p>';
    if(adm) h+='<button type="button" class="mvbtn mvbtn-discret mvbtn-compact" data-c="'+c+'" onclick="_pratActif(this.dataset.c)">Le domaine ne fait pas de '+_PRAT_NOM[c]+'</button>';
    h+='<div class="prat-parc"><div class="prat-q-t">Le parcours d’une cuve de '+_PRAT_NOM[c]+'</div>'+_pratEtapesHtml(_pratParcours(P,c))
      +'<ul class="prat-chg">'+_pratChange(P,c).map(function(x){ return '<li>'+x+'</li>'; }).join('')+'</ul></div>';
  }
  h+=_pratBilanHtml(P);
  if(adm) h+='<div class="prat-pied"><button type="button" class="mvbtn mvbtn-principal" data-tuto="prat.ok" onclick="savePratiques()"'+(ouv.length?' disabled':'')+'>Enregistrer</button>'
    +'<button type="button" class="mvbtn mvbtn-discret" onclick="closeOv(null,\'ovPratiques\')">Annuler</button></div>';
  corps.innerHTML=h;
}
function _pratEtapesHtml(l){
  return '<ol class="prat-et">'+l.map(function(x){ return '<li><b>'+x[0]+'</b>'+(x[1]?'<small>'+x[1]+'</small>':'')+'</li>'; }).join('')+'</ol>';
}
function _pratAlHtml(P, a, adm){
  var conf=(P.conf||{})[a.id];
  if(a.niv==='w'&&conf) return '<div class="mvencadre mvencadre-ok prat-al">'+_mvIcon('check',18)+'<span><b class="mvencadre-t">'+a.t+'</b>Confirmé par '+_escHtml(conf.par||'l’administrateur')+', le '+_vendFrDate(conf.le)+'.</span></div>';
  var ton=a.niv==='b'?'danger':(a.niv==='w'?'attention':'info');
  return '<div class="mvencadre mvencadre-'+ton+' prat-al">'+_mvIcon(a.niv==='b'?'interdit':'alerte',18)+'<span><b class="mvencadre-t">'+_PRAT_NIV[a.niv]+' · '+a.t+'</b>'+a.d
    +(adm&&a.niv==='w'?'<button type="button" class="mvbtn mvbtn-secondaire mvbtn-compact prat-al-b" data-tuto="prat.conf" data-id="'+a.id+'" onclick="_pratConf(this.dataset.id)">C’est notre pratique</button>':'')
    +(adm&&a.niv==='fix'?'<button type="button" class="mvbtn mvbtn-secondaire mvbtn-compact prat-al-b" data-id="'+a.id+'" onclick="_pratFix(this.dataset.id)">'+a.fix+'</button>':'')
    +'</span></div>';
}
function _pratBilanHtml(P){
  var l=_pratOuvertes(P);
  if(!l.length) return '<div class="mvencadre mvencadre-ok prat-bil">'+_mvIcon('check',18)+'<span>Vos réponses vont ensemble.</span></div>';
  return '<div class="prat-bil"><div class="prat-q-t">'+_matPlur(l.length,'point')+' avant d’enregistrer</div>'+l.map(function(a){
    return '<button type="button" class="prat-bil-l" data-c="'+a.c+'" onclick="_pratCoul(this.dataset.c)"><i class="mat-pt '+(a.c==='o'?'prat-pt-o':_matVin(a.c))+'"></i><span>'
      +(a.c==='r'?'Rouge':a.c==='b'?'Blanc':'Rosé')+' · '+a.t+'</span><span class="mvpas mvpas-etiquette">'+_PRAT_NIV[a.niv]+'</span></button>';
  }).join('')+'</div>';
}
function _pratCoul(c){ if(!_pratEt||!_PRAT_Q[c]) return; _pratEt.coul=c; _pratRendre(); }
function _pratSet(k, v){
  if(!_pratEt||!_pratAdm()) return;
  var P=_pratEt.P, c=_pratEt.coul, q=(_PRAT_Q[c]||[]).filter(function(x){ return x.k===k; })[0];
  if(!q||!q.o.some(function(o){ return o[0]===v; })) return;
  var cur=Array.isArray(P[c][k])?P[c][k]:[];
  // Une réponse impossible ne se coche pas ; cochée avant, elle se décoche.
  if(c==='o'&&k==='met'&&v==='sai'&&!P.actif.r&&cur.indexOf(v)===-1) return;
  if(q.m){ var n=cur.indexOf(v)!==-1?cur.filter(function(x){ return x!==v; }):cur.concat([v]); if(!n.length){ showToast('Gardez au moins une réponse','var(--attention)'); return; } P[c][k]=n; }
  else P[c][k]=[v];
  // Une confirmation vaut pour les réponses confirmées : on la reprend si elles changent.
  _pratAlertesSuivre(P);
  _pratRendre();
}
/* Une confirmation « à vérifier » ne survit pas à la disparition de la situation confirmée. */
function _pratAlertesSuivre(P){
  var vus={}; _pratAlertes(P).forEach(function(a){ vus[a.id]=1; });
  Object.keys(P.conf||{}).forEach(function(id){ if(!vus[id]) delete P.conf[id]; });
}
function _pratActif(c){
  if(!_pratEt||!_pratAdm()||!_PRAT_Q[c]) return;
  var P=_pratEt.P;
  if(P.actif[c] && ['r','b','o'].filter(function(k){ return P.actif[k]; }).length===1){ showToast('Le domaine fait au moins une couleur','var(--attention)'); return; }
  P.actif[c]=!P.actif[c];
  _pratAlertesSuivre(P);
  _pratRendre();
}
function _pratConf(id){
  if(!_pratEt||!_pratAdm()) return;
  var a=_pratAlertes(_pratEt.P).filter(function(x){ return x.id===id&&x.niv==='w'; })[0]; if(!a) return;
  _pratEt.P.conf[id]={ par:(window.currentUser&&window.currentUser.nom)||'', le:_mlAuj() };
  _pratRendre();
}
function _pratFix(id){
  if(!_pratEt||!_pratAdm()) return;
  if(id==='sai-fix') _pratEt.P.r.sai=['oui'];
  _pratAlertesSuivre(_pratEt.P);
  _pratRendre();
}
function savePratiques(){
  if(!_pratEt||!_pratAdm()){ showToast('Réservé à l’administrateur','var(--attention)'); return; }
  if(!_vendGarde()) return;
  var P=_pratEt.P, ouv=_pratOuvertes(P);
  // ⚠ Vérifié AVANT toute écriture : un refus laisse le réglage d'avant intact.
  if(ouv.length){ _pratEt.coul=ouv[0].c; _pratRendre(); showToast(ouv[0].t+' : à régler avant d’enregistrer','#B85A1A'); return; }
  var o=_pratCopie(P);
  o.par=(window.currentUser&&window.currentUser.nom)||''; o.le=_mlAuj();
  if(!CAVE_VENDANGE.config) CAVE_VENDANGE.config={};
  CAVE_VENDANGE.config.pratiques=o;
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendFbSave('Vos pratiques de cave sont enregistrées','var(--ok)');
  if(window.closeOv) window.closeOv(null,'ovPratiques');
  _pratEt=null;
  renderVendParam(); renderVendCuves();
}
/* Le bandeau de la première ouverture : « Plus tard » ne le remontre plus — la roue crantée reste. */
function _pratPlusTard(){
  if(!_pratAdm()||!_vendGarde()) return;   // VD-GARDE : la garde de rôle, écrite dans l'écrivain
  if(!CAVE_VENDANGE.config) CAVE_VENDANGE.config={};
  CAVE_VENDANGE.config.pratiques_plus_tard=_mlAuj();
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendFbSave('Vos pratiques se règlent quand vous voulez : roue crantée, Le Cuvier','var(--texte-med)');
  renderVendCuves();
}
function _pratBandeauHtml(){
  var cfg=CAVE_VENDANGE.config||{};
  if(_pratCfg()||cfg.pratiques_plus_tard||!_pratAdm()) return '';
  return '<div class="mvencadre mvencadre-info prat-band">'+_mvIcon('raisin',18)+'<span><b class="mvencadre-t">Vos pratiques de cave</b>'
    +'Comment vos rouges, vos blancs et vos rosés passent au cuvier : quelques questions, une fois. Chaque cuve suit ensuite son parcours.'
    +'<span class="prat-band-b"><button type="button" class="mvbtn mvbtn-principal mvbtn-compact" data-tuto="prat.band" onclick="openPratiques()">Régler</button>'
    +'<button type="button" class="mvbtn mvbtn-discret mvbtn-compact" onclick="_pratPlusTard()">Plus tard</button></span></span></div>';
}
/* La ligne des réglages du Cuvier (roue crantée). */
function _pratRegLigne(){
  var P=_pratCfg(), adm=(typeof isAdmin==='function'&&isAdmin());
  var v=P?['r','b','o'].filter(function(k){ return P.actif[k]; }).map(function(k){ return k==='r'?'Rouge':k==='b'?'Blanc':'Rosé'; }).join(' · '):'pas encore réglées';
  return _vendRegLigne('Vos pratiques', v, P?'réglées le '+_vendFrDate(P.le)+(P.par?' par '+_escHtml(P.par):''):'comment chaque couleur passe au cuvier', adm?(P?'Modifier':'Régler'):(P?'Voir':''), 'openPratiques()', !P);
}

/* —— La couleur d'une cuve —— */
/* Les couleurs des parcelles d'une cuve : {r, b, x} (x = à classer, inconnue). */
function _vendParcCouls(noms){
  var n={r:0,b:0,x:0};
  (noms||[]).forEach(function(nm){ var c=(typeof _parcCoul==='function')?_parcCoul(nm):'?'; if(c==='r'||c==='b') n[c]++; else n.x++; });
  return n;
}
/* La couleur proposée d'après les parcelles : 'r', 'b' ou '?'. Un mélange se propose rouge. */
function _vendCoulAuto(noms){
  var n=_vendParcCouls(noms);
  return n.r?'r':(n.b?'b':'?');
}
/* La couleur d'une cuve : celle qu'on a dite, sinon celle des parcelles. */
function _vendCuveCoul(c){
  if(c&&(c.couleur==='r'||c.couleur==='b'||c.couleur==='o')) return c.couleur;
  return _vendCoulAuto(c&&Array.isArray(c.parcelles)?c.parcelles:[]);
}
/* Le chapeau : un rouge en a un ; un blanc ou un rosé, non — sauf un blanc de macération confirmé. */
function _vendChapeau(c){
  var k=_vendCuveCoul(c);
  if(k==='b'||k==='o') return !!(c&&c.macere);
  return true;
}
/* Un geste d'extraction se propose-t-il ? Sans réglage, oui (comme avant). */
function _pratGeste(g){
  var P=_pratCfg();
  return !P || _pratHas(P,'r','ext',g);
}
/* ★ LA SOURCE DES SÉCURITÉS DE LA COULEUR. null, ou {id, niv, t, d}. */
function _vcuvCoulCheck(noms, k){
  var n=_vendParcCouls(noms);
  if(k!=='r'&&k!=='b'&&k!=='o') return null;
  if(n.b&&!n.r&&k!=='b') return {id:'blanc-'+k, niv:'b', t:'Pas de '+_PRAT_NOM[k]+' avec des raisins blancs',
    d:'Un '+_PRAT_NOM[k]+' se fait avec des raisins à peau colorée, noirs ou gris. Ces parcelles sont plantées en cépage blanc.'};
  if(n.r&&n.b) return {id:'mix', niv:'w', t:'Raisins rouges et blancs dans la même cuve',
    d:'Selon l’appellation, ce mélange peut être refusé. À Gevrey-Chambertin par exemple, un cépage blanc n’entre dans un rouge qu’en mélange de plants dans la vigne, 15 % au plus. Vérifiez votre cahier des charges.'};
  if(n.r&&!n.b&&k==='b') return {id:'bdn', niv:'w', t:'Un blanc de raisins noirs',
    d:'Possible : pressurage direct, sans macération — un blanc de noirs. Vérifiez que votre appellation l’admet.'};
  return null;
}
var _vcuvCoul=null;     // la couleur choisie à la main, null = celle des parcelles
var _vcuvCoulOk=null;   // la confirmation posée dans cette fenêtre : l'id de la vérification
var _vcuvCoulEx=null;   // la cuve modifiée (sa confirmation d'avant)
function _vcuvNoms(){
  return String(((document.getElementById('vcuv-parcelles')||{}).value)||'').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
}
function _vcuvCoulInject(c){
  _vcuvCoulEx=c||null; _vcuvCoul=(c&&(c.couleur==='r'||c.couleur==='b'||c.couleur==='o'))?c.couleur:null; _vcuvCoulOk=null;
  var inp=document.getElementById('vcuv-parcelles'); if(!inp) return;
  var row=document.getElementById('vcuv-coul-row');
  if(!row){ row=document.createElement('div'); row.id='vcuv-coul-row'; if(inp.parentNode) inp.parentNode.insertBefore(row, inp.nextSibling); }
  inp.oninput=_vcuvCoulRendre;
  _vcuvCoulRendre();
}
function _vcuvCoulRendre(){
  var row=document.getElementById('vcuv-coul-row'); if(!row) return;
  var noms=_vcuvNoms(), auto=_vendCoulAuto(noms), k=_vcuvCoul||auto, P=_pratCfg();
  var ro=!!(P&&P.actif.o)||k==='o';
  var h='<div class="fl">Couleur de la cuve <span style="font-weight:400;opacity:.75">— '+(auto!=='?'?'proposée d’après les parcelles':'les parcelles ne la disent pas')+'</span></div>'
    +'<div class="prat-ch" role="group" aria-label="Couleur de la cuve">'+['r','b','o'].filter(function(x){ return x!=='o'||ro; }).map(function(x){
      return '<button type="button" class="prat-o'+(k===x?' on':'')+'" aria-pressed="'+(k===x)+'" '+_pratEtq('vcuv.coul.'+x)+' data-c="'+x+'" onclick="_vcuvCoulSet(this.dataset.c)">'
        +(x==='r'?'Rouge':x==='b'?'Blanc':'Rosé')+(x===auto?'<small>d’après les parcelles</small>':'')+'</button>';
    }).join('')+'</div>';
  var a=_vcuvCoulCheck(noms,k);
  if(a){
    var dejaOk=(a.niv==='w')&&(_vcuvCoulOk===a.id||(_vcuvCoulEx&&_vcuvCoulEx.couleur_conf&&_vcuvCoulEx.couleur_conf.k===a.id));
    if(dejaOk) h+='<div class="mvencadre mvencadre-ok prat-al">'+_mvIcon('check',18)+'<span><b class="mvencadre-t">'+a.t+'</b>Confirmé : noté dans la fiche de la cuve.</span></div>';
    else h+='<div class="mvencadre mvencadre-'+(a.niv==='b'?'danger':'attention')+' prat-al">'+_mvIcon(a.niv==='b'?'interdit':'alerte',18)+'<span><b class="mvencadre-t">'+_PRAT_NIV[a.niv]+' · '+a.t+'</b>'+a.d
      +(a.niv==='w'?'<button type="button" class="mvbtn mvbtn-secondaire mvbtn-compact prat-al-b" data-id="'+a.id+'" onclick="_vcuvCoulOkSet(this.dataset.id)">C’est voulu</button>':'')+'</span></div>';
  }
  row.innerHTML=h;
}
function _vcuvCoulSet(k){ if(k!=='r'&&k!=='b'&&k!=='o') return; _vcuvCoul=k; _vcuvCoulOk=null; _vcuvCoulRendre(); }
function _vcuvCoulOkSet(id){ _vcuvCoulOk=id; _vcuvCoulRendre(); }
/* Lus par saveVendCuve : la couleur retenue, et la confirmation à écrire sur la cuve. */
function _vcuvCoulChoisie(noms){ var k=_vcuvCoul||_vendCoulAuto(noms); return (k==='r'||k==='b'||k==='o')?k:null; }
function _vcuvCoulConf(noms, k, existing){
  var a=_vcuvCoulCheck(noms,k);
  if(!a||a.niv!=='w') return undefined;
  if(existing&&existing.couleur_conf&&existing.couleur_conf.k===a.id) return existing.couleur_conf;
  return (_vcuvCoulOk===a.id)?{ k:a.id, t:a.t, par:(window.currentUser&&window.currentUser.nom)||'', le:_mlAuj() }:undefined;
}
/* Le contrôle d'avant l'écriture de saveVendCuve : null si tout va, sinon le message du refus. */
function _vcuvCoulPret(noms, k, existing){
  var a=_vcuvCoulCheck(noms,k);
  if(!a) return null;
  if(a.niv==='b') return a.t;
  var ok=(_vcuvCoulOk===a.id)||(existing&&existing.couleur_conf&&existing.couleur_conf.k===a.id);
  return ok?null:(a.t+' : confirmez « C’est voulu »');
}
/* Le parcours prévu, dans la fiche d'une cuve (replié). */
function _vendParcoursHtml(c){
  var P=_pratCfg(), k=_vendCuveCoul(c);
  if(!P||!_PRAT_Q[k]||!P.actif[k]) return '';
  var conf=c.couleur_conf?'<p class="prat-note">'+_escHtml(c.couleur_conf.t||'Couleur confirmée')+' : confirmé'+(c.couleur_conf.par?' par '+_escHtml(c.couleur_conf.par):'')+(c.couleur_conf.le?' le '+_vendFrDate(c.couleur_conf.le):'')+'.</p>':'';
  var mac=c.macere?'<p class="prat-note">Blanc de macération : pigeages et remontages notés'+(c.macere.par?' (confirmé par '+_escHtml(c.macere.par)+')':'')+'.</p>':'';
  return '<details class="prat-parc-f"><summary>Son parcours prévu · d’après vos pratiques du '+_PRAT_NOM[k]+'</summary>'+_pratEtapesHtml(_pratParcours(P,k))+conf+mac+'</details>';
}
/* —— La mesure d'un blanc ou d'un rosé : pas de chapeau, sauf blanc de macération confirmé —— */
var _vmMacOk=false;
function _vmMacInject(c, chap){
  var blk=document.getElementById('vm-chap'); if(!blk||!blk.parentNode) return;
  var el=document.getElementById('vm-mac');
  if(!el){ el=document.createElement('div'); el.id='vm-mac'; blk.parentNode.insertBefore(el, blk); }
  _vmMacOk=false;
  var k=_vendCuveCoul(c);
  if(chap||!(k==='b'||k==='o')||!c||_vendPressee(c)||_vendDecuvee(c)){ el.innerHTML=''; return; }
  el.innerHTML='<p class="prat-note">'+(k==='b'?'Un blanc':'Un rosé')+' n’a pas de chapeau : ni pigeage ni remontage. '
    +'<button type="button" class="mvbtn mvbtn-discret mvbtn-compact" onclick="_vmMacOuvrir()">Ce vin macère sur ses peaux</button></p>';
}
function _vmMacOuvrir(){
  var el=document.getElementById('vm-mac'); if(!el) return;
  el.innerHTML='<div class="mvencadre mvencadre-attention prat-al">'+_mvIcon('alerte',18)+'<span><b class="mvencadre-t">À vérifier · Un blanc qui macère</b>'
    +'Un blanc ne macère pas, sauf les vins de macération longue, qui se pigent légèrement. Confirmé, la cuve garde ses pigeages et remontages, ici et dans la tournée.'
    +'<button type="button" class="mvbtn mvbtn-secondaire mvbtn-compact prat-al-b" onclick="_vmMacConfirmer()">C’est un vin de macération</button></span></div>';
}
function _vmMacPris(){ return _vmMacOk; }
function _vmMacConfirmer(){
  _vmMacOk=true;
  var el=document.getElementById('vm-mac'); if(el) el.innerHTML='<p class="prat-note">Noté à l’enregistrement : cette cuve macère.</p>';
  var b=document.getElementById('vm-chap'); if(b) b.style.display='';
}
/* La tournée montre P et R là où ils ont un sens — et toujours un chiffre déjà posé. */
function _vtMontre(c, k){
  var b=_vtB(c.id);
  if(b[k]>0) return true;
  return _vendChapeau(c) && (_vendCuveCoul(c)!=='r' || _pratGeste(k==='p'?'pig':'rem'));
}

// ── Les gestes (onclick) ──
window.openPratiques   = openPratiques;
window._pratCoul       = _pratCoul;
window._pratSet        = _pratSet;
window._pratActif      = _pratActif;
window._pratConf       = _pratConf;
window._pratFix        = _pratFix;
window.savePratiques   = savePratiques;
window._pratPlusTard   = _pratPlusTard;
window._vcuvCoulSet    = _vcuvCoulSet;
window._vcuvCoulOkSet  = _vcuvCoulOkSet;
window._vmMacOuvrir    = _vmMacOuvrir;
window._vmMacConfirmer = _vmMacConfirmer;
// ── Lus par cuvier.js ──
export { _pratCfg, _pratGeste, _pratBandeauHtml, _pratRegLigne, _vendCuveCoul, _vendChapeau, _vcuvCoulInject, _vcuvCoulRendre,
  _vcuvCoulChoisie, _vcuvCoulPret, _vcuvCoulConf, _vendParcoursHtml, _vmMacInject, _vmMacPris, _vtMontre };
