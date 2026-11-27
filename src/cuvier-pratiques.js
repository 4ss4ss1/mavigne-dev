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
  'vcuv.coul.r':'data-tuto="vcuv.coul.r"', 'vcuv.coul.b':'data-tuto="vcuv.coul.b"', 'vcuv.coul.o':'data-tuto="vcuv.coul.o"',
  'cuv.coul.r':'data-tuto="cuv.coul.r"', 'cuv.coul.b':'data-tuto="cuv.coul.b"', 'cuv.coul.o':'data-tuto="cuv.coul.o"',   // COULEUR-1 (§625)
  // PRATIQUES-2 (§624) : la feuille « Débourber » et le prochain geste
  'deb.go':'data-tuto="deb.go"', 'deb.ok':'data-tuto="deb.ok"', 'deb.temp':'data-tuto="deb.temp"', 'deb.jus':'data-tuto="deb.jus"',
  'deb.bourbes':'data-tuto="deb.bourbes"', 'deb.suite.cuve':'data-tuto="deb.suite.cuve"', 'deb.suite.fut':'data-tuto="deb.suite.fut"'
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
  // PRATIQUES-2 (§624) : un repère de turbidité à l'envers — le bas au-dessus du haut.
  ['b','o'].forEach(function(k){
    var r=P[k]&&P[k].rep, a=r&&parseFloat(r.ntu_min), b=r&&parseFloat(r.ntu_max);
    if(P.actif[k]&&isFinite(a)&&isFinite(b)&&a>b) l.push({id:'rep-ntu-'+k, niv:'b', c:k, q:'deb', t:'Turbidité visée à l’envers',
      d:'Le bas ('+String(a).replace('.',',')+' NTU) dépasse le haut ('+String(b).replace('.',',')+' NTU). Corrigez l’un des deux.'});
  });
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
    var _rh=P.b&&P.b.rep&&parseFloat(P.b.rep.deb_h);   // PRATIQUES-2 (§624) : le repère de durée
    if(h('deb','stat')) s.push(['Débourbage','statique, au froid'+(_rh>0?' · '+String(_rh).replace('.',',')+'\u00a0h':'')+(h('ntu','oui')?' · turbidité':'')]);
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
        +((q.k==='deb'&&(c==='b'||c==='o')&&!_pratHas(P,c,'deb','non'))?_pratRepHtml(P,c,adm):'')   // PRATIQUES-2 (§624) : vos repères
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
  _pratRepBind(P, c);
}
/* ★ PRATIQUES-2 (§624) — LES REPÈRES DU DOMAINE : la durée d'un débourbage, la turbidité visée. Facultatifs ; aucun
   chiffre n'est imposé par l'appli. Ils se relisent à la frappe, sans redessiner (le curseur reste). */
function _pratRepHtml(P, c, adm){
  var r=(P[c]&&P[c].rep)||{}, v=function(k){ return (r[k]!=null&&r[k]!=='')?String(r[k]).replace('.',','):''; };
  var inp=function(k, ph){ return '<input type="text" inputmode="decimal" class="prat-rep-i" data-rep="'+k+'" value="'+_escAttr(v(k))+'" placeholder="'+ph+'"'+(adm?'':' disabled')+' aria-label="'+_escAttr(ph)+'">'; };
  return '<div class="prat-rep"><span class="prat-q-a">Vos repères, facultatifs :</span>'
    +'<span class="prat-rep-l">durée '+inp('deb_h','24')+' h</span>'
    +((c==='b'&&_pratHas(P,'b','ntu','oui'))?'<span class="prat-rep-l">turbidité visée '+inp('ntu_min','200')+' à '+inp('ntu_max','300')+' NTU</span>':'')+'</div>';
}
function _pratRepBind(P, c){
  var corps=document.getElementById('prat-corps'); if(!corps) return;
  [].forEach.call(corps.querySelectorAll('[data-rep]'), function(el){
    el.addEventListener('input', function(){
      var k=el.getAttribute('data-rep'), x=parseFloat(String(el.value||'').replace(',','.'));
      if(!P[c].rep) P[c].rep={};
      if(isFinite(x)&&x>=0) P[c].rep[k]=x; else delete P[c].rep[k];
    });
  });
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
  _vcuvFa=(c&&c.fa_lieu)||null; _vcuvMalo=(c&&c.malo_prevue)||null;   // PRATIQUES-2 (§624) : les choix de la cuve
  var inp=document.getElementById('vcuv-parcelles'); if(!inp) return;
  var row=document.getElementById('vcuv-coul-row');
  if(!row){ row=document.createElement('div'); row.id='vcuv-coul-row'; if(inp.parentNode) inp.parentNode.insertBefore(row, inp.nextSibling); }
  inp.oninput=_vcuvCoulRendre;
  _vcuvCoulRendre();
  _vcuvChoixReset(c);   // PRATIQUES-2 (§624) : le pressurage d'arrivée, prérempli à la correction, vide à la création
}
function _vcuvCoulRendre(){
  var row=document.getElementById('vcuv-coul-row'); if(!row) return;
  // PRATIQUES-2 (§624) : la ligne se redessine au choix d'une couleur — le pressurage tapé y revient.
  var _g=(document.getElementById('vcuv-goutte')||{}).value, _p=(document.getElementById('vcuv-presse')||{}).value;
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
  h+=_vcuvChoixHtml(k);   // PRATIQUES-2 (§624) : pressurage d'arrivée, fût ou cuve, malo — pour cette cuve
  row.innerHTML=h;
  var g=document.getElementById('vcuv-goutte'), pp=document.getElementById('vcuv-presse');
  if(g&&_g!=null) g.value=_g; if(pp&&_p!=null) pp.value=_p;
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
  var nx=_debProchainHtml(c);   // PRATIQUES-2 (§624) : le prochain geste d'un blanc ou d'un rosé — avec ou sans réglage
  if(!P||!_PRAT_Q[k]||!P.actif[k]) return nx;
  var conf=c.couleur_conf?'<p class="prat-note">'+_escHtml(c.couleur_conf.t||'Couleur confirmée')+' : confirmé'+(c.couleur_conf.par?' par '+_escHtml(c.couleur_conf.par):'')+(c.couleur_conf.le?' le '+_vendFrDate(c.couleur_conf.le):'')+'.</p>':'';
  var mac=c.macere?'<p class="prat-note">Blanc de macération : pigeages et remontages notés'+(c.macere.par?' (confirmé par '+_escHtml(c.macere.par)+')':'')+'.</p>':'';
  var st=(k==='b'||k==='o')?(_pratParcoursCuve(c)||_pratParcours(P,k)):_pratParcours(P,k);
  return nx+'<details class="prat-parc-f"><summary>Son parcours prévu · d’après vos pratiques du '+_PRAT_NOM[k]+'</summary>'+_pratEtapesHtml(st)+conf+mac+_debRecapHtml(c)+'</details>';
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

/* ══════════════════════════════════════════════════════════════════
   ★★★ PRATIQUES-2 (§624) — LES GESTES DU BLANC AU CUVIER.
   La suite de PRATIQUES-1 (Nico, 27/11 : « suite »), d'après la maquette v2 validée : le pressurage d'arrivée
   (goutte et presse), le DÉBOURBAGE (mettre à débourber, puis soutirer le jus clair), et ce qui suit — ENTONNER
   (la feuille de décuvage d'avant, en mode « entonnage » : la cuvée naît au Chai, sa fermentation y reste suivie,
   fa_finie:false, CUV-10) ou FERMENTER DANS LA CUVE (statut 'fa', daté). Une cuve de blanc ou de rosé suit sa
   frise, celle de son parcours, et sa fiche dit le prochain geste.
   ⚠⚠ LE CYCLE NE CHANGE PAS DE CLÉS : une cuve au débourbage est en 'setup' ; entonnée, elle est décuvée (CUV-10) ;
     fermentée en cuve, elle est en 'fa'. La frise du blanc se LIT de ces faits (_pratAvance), elle n'écrit rien.
   ⚠ Les blocages passent AVANT toute écriture (_debBloque, _debCheckFin) : débourber une cuve qui fermente,
     une fin avant le début, plus de jus clair et de bourbes que de jus.
══════════════════════════════════════════════════════════════════ */
/* Les réglages de la couleur d'une cuve, ou null (pas de réglage, couleur non faite). */
function _pratDe(c){
  var P=_pratCfg(), k=_vendCuveCoul(c);
  return (P&&_PRAT_Q[k]&&P.actif[k])?{P:P, k:k}:null;
}
/* Le jus d'une cuve, en litres : le pressurage s'il est dit. */
function _debJusL(c){
  var p=c&&c.pressurage; if(!p) return null;
  var t=(parseFloat(p.goutte_l)||0)+(parseFloat(p.presse_l)||0);
  return t>0?t:null;
}
/* Le plafond du soutirage : le jus du pressurage, sinon la contenance de la cuve. */
function _debBaseL(c){
  var j=_debJusL(c); if(j) return j;
  var v=parseFloat(c&&c.volume_hl)||0;
  return v>0?Math.round(v*100):null;
}
/* Le débourbage est-il un geste de cette cuve ? Un blanc ou un rosé — sauf « pas de débourbage » au réglage. */
function _debPossible(c){
  var k=_vendCuveCoul(c);
  if(k!=='b'&&k!=='o') return false;
  if(c&&c.fusion) return false;
  var d=_pratDe(c);
  if(d && _pratHas(d.P,k,'deb','non') && !(c.debourbage&&c.debourbage.debut)) return false;
  return true;
}
function _debEtat(c){
  var d=c&&c.debourbage;
  if(!d||!d.debut) return 'aucun';
  return d.fin?'fini':'encours';
}
/* ★ LE BLOCAGE « IMPOSSIBLE » : le débourbage clarifie le jus AVANT qu'il fermente. null, ou la raison. */
function _debBloque(c){
  if(!c) return 'Cuve introuvable.';
  if(_vendDecuvee(c)) return 'Cette cuve est déjà partie au Chai.';
  if(_vendPressee(c)) return 'Cette cuve est déjà pressurée après fermentation.';
  if(c.statut&&c.statut!=='setup'&&c.statut!=='mpf') return 'Cette cuve fermente déjà (étape « '+(typeof _vendStatLbl==='function'?_vendStatLbl(c.statut):c.statut)+' »). Le débourbage clarifie le jus avant qu’il fermente.';
  return null;
}
/* Une heure saisie : 'AAAA-MM-JJTHH:MM', ou ''. */
function _debQuand(date, heure){
  var d=String(date||'').slice(0,10); if(!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
  var h=/^\d{2}:\d{2}$/.test(String(heure||''))?heure:'00:00';
  return d+'T'+h;
}
function _debQuandTxt(q){
  if(!q) return '';
  return _vendFrDate(String(q).slice(0,10))+(String(q).length>10?' à '+String(q).slice(11,16):'');
}
/* ★ LE CONTRÔLE DU SOUTIRAGE, AVANT TOUTE ÉCRITURE. null, ou la raison du refus. */
function _debCheckFin(c, f){
  var d=(c&&c.debourbage)||{};
  if(!f.fin) return 'Indiquez la fin du débourbage.';
  if(d.debut && f.fin<d.debut) return 'La fin ('+_debQuandTxt(f.fin)+') précède le début ('+_debQuandTxt(d.debut)+').';
  if(!(f.jus>0)) return 'Indiquez le jus clair soutiré, en litres.';
  var b=_debBaseL(c), tot=f.jus+(f.bourbes>0?f.bourbes:0);
  if(b && tot>b) return _nbL(f.jus)+(f.bourbes>0?' + '+_nbL(f.bourbes):'')+' = '+_nbL(tot)+' L : plus que les '+_nbL(b)+' L '+(_debJusL(c)?'de jus de la cuve':'que la cuve contient')+'.';
  return null;
}
function _nbL(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' '); }
/* Le repère de turbidité du domaine : 'dedans', 'au-dessus', 'au-dessous', ou null. */
function _debNtuRep(rep, v){
  if(!rep||!(v>=0)) return null;
  var a=parseFloat(rep.ntu_min), b=parseFloat(rep.ntu_max);
  if(!isFinite(a)&&!isFinite(b)) return null;
  if(isFinite(a)&&v<a) return 'au-dessous';
  if(isFinite(b)&&v>b) return 'au-dessus';
  return 'dedans';
}
/* Le parcours d'UNE cuve : celui de sa couleur, avec ses propres choix (fût ou cuve, la malo). */
function _pratParcoursCuve(c){
  var d=_pratDe(c); if(!d) return null;
  var s=_pratParcours(d.P,d.k);
  if(d.k==='b'&&c.fa_lieu){
    var lieu=c.fa_lieu;
    s=s.map(function(x){ return x[0]==='Fermentation'?['Fermentation', lieu==='fut'?'en fût':lieu==='cf'?'démarrée en cuve, puis entonnée':'en cuve']:x; })
       .filter(function(x){ return !(x[0]==='Entonnage'&&lieu==='cuve'); });
    var iF=-1; s.forEach(function(x,i){ if(x[0]==='Fermentation') iF=i; });
    var iE=-1; s.forEach(function(x,i){ if(x[0]==='Entonnage') iE=i; });
    if(lieu==='fut'&&iE===-1) s.splice(iF,0,['Entonnage','fûts du parc']);
    if(lieu==='fut'&&iE>iF){ var e=s.splice(iE,1)[0]; s.splice(iF,0,e); }
    if(lieu==='cf'&&(iE===-1||iE<iF)){ if(iE!==-1) s.splice(iE,1); iF=-1; s.forEach(function(x,i){ if(x[0]==='Fermentation') iF=i; }); s.splice(iF+1,0,['Entonnage','en cours de fermentation']); }
  }
  if(c.malo_prevue) s=s.map(function(x){ return x[0]==='Malo'?['Malo', c.malo_prevue==='fait'?'faite':c.malo_prevue==='bloq'?'bloquée':'partielle']:x; });
  return s;
}
/* ★ OÙ EN EST UNE CUVE DE BLANC OU DE ROSÉ — LU DES FAITS, JAMAIS ÉCRIT. Pour chaque étape : 'fait', 'cours' ou ''.
   La première étape pas faite est en cours si un fait l'ouvre, sinon elle attend. « Au Chai » est fait dès que la
   cuve y est partie. */
function _pratAvance(c, steps){
  var deb=_debEtat(c), dec=_vendDecuvee(c), d=c.decuvage||{};
  var v=(typeof _vendFmlVin==='function')?_vendFmlVin(c):null;
  var faFinie=(dec&&d.fa_finie===true)||c.statut==='fml'||(c.statut==='termine'&&!dec);
  var faCours=c.statut==='fa'||(typeof _vendFaEnCours==='function'&&_vendFaEnCours(c))||_vendPressee(c);
  var maloFaite=!!(v&&(v.etat==='finie'||v.etat==='sans'||v.etat==='bouteille'))||(c.statut==='termine'&&!dec);
  var etat=steps.map(function(x){
    var n=x[0];
    if(n==='Égrappage'||n==='Macération pelliculaire'||n==='Pressurage'||n==='Pressurage direct'||n==='Saignée'||n==='Macération courte') return 'fait';
    if(n==='Débourbage'||n==='Flottation') return deb==='fini'?'fait':(deb==='encours'?'cours':'');
    if(n==='Entonnage') return dec?'fait':'';
    if(n==='Fermentation') return faFinie?'fait':(faCours?'cours':'');
    if(n==='Malo') return maloFaite?'fait':(c.statut==='fml'||(v&&v.etat==='cours')?'cours':'');
    if(n==='Au Chai') return dec?'fait':'';
    return (dec&&maloFaite)?'cours':'';   // Élevage sur lies, Soutirage : au Chai, une fois la malo faite
  });
  // L'ordre du parcours : rien n'est « en cours » au-delà de la première étape pas faite (hors « Au Chai »).
  var vu=false;
  return etat.map(function(e,i){
    if(steps[i][0]==='Au Chai') return e;
    if(vu) return '';
    if(e!=='fait'){ vu=true; return e; }
    return e;
  });
}
/* La frise d'une cuve de blanc ou de rosé (mêmes classes que _vendStepper). '' pour un rouge ou sans réglage. */
function _pratStepperHtml(c){
  var k=_vendCuveCoul(c); if(k!=='b'&&k!=='o') return '';
  var s=_pratParcoursCuve(c); if(!s) return '';
  var e=_pratAvance(c,s), cur=-1;
  e.forEach(function(x,i){ if(x==='cours'&&cur===-1) cur=i; });
  var lbl=function(n){ return n==='Élevage sur lies'?'Élevage':n==='Macération pelliculaire'?'Macér.':n==='Pressurage direct'?'Press.':n==='Pressurage'?'Press.':n==='Fermentation'?'FA':n==='Débourbage'?'Débourb.':n==='Entonnage'?'Enton.':n; };
  var h='<div class="mvv-steps prat-steps">'+s.map(function(x,i){
    return '<div class="mvv-step '+(e[i]==='fait'?'done':e[i]==='cours'?'cur':'')+'"><div class="dot"></div><div class="lb">'+lbl(x[0])+'</div><div class="dt"></div></div>';
  }).join('')+'</div>';
  var l=_pratEtapeLbl(c);
  if(l) h+='<div class="mvv-parc"><b>'+_escHtml(l)+'</b>'+_pratDepuis(c)+'</div>';
  return h;
}
/* Le nom de l'étape en cours d'une cuve de blanc ou de rosé, ou ''. */
function _pratEtapeLbl(c){
  var k=_vendCuveCoul(c); if(k!=='b'&&k!=='o') return '';
  var s=_pratParcoursCuve(c); if(!s) return '';
  var e=_pratAvance(c,s);
  for(var i=0;i<e.length;i++) if(e[i]==='cours') return s[i][0];
  for(var j=0;j<e.length;j++) if(e[j]!=='fait') return s[j][0]==='Débourbage'||s[j][0]==='Flottation'?'Pressé, à débourber':s[j][0]+' à venir';
  return '';
}
function _pratDepuis(c){
  var d=c.debourbage;
  if(_debEtat(c)==='encours') return ' depuis le '+_escHtml(_debQuandTxt(d.debut))+(d.temp!=null?' · '+String(d.temp).replace('.',',')+' °C':'');
  return '';
}
/* Le prochain geste d'une cuve de blanc ou de rosé, ou null. */
function _debProchain(c){
  if(!c||c.fusion||!_debPossible(c)) return null;
  var e=_debEtat(c), dec=_vendDecuvee(c);
  if(e==='aucun'&&!_debBloque(c)) return {k:'debut', t:'Débourber', s:'Le jus est pressé : mettez-le à débourber.'};
  if(e==='encours'){
    var d=_pratDe(c), rep=d&&d.P[d.k]&&d.P[d.k].rep, h=rep&&parseFloat(rep.deb_h);
    return {k:'fin', t:'Soutirer le jus clair', s:'Débourbage depuis le '+_debQuandTxt(c.debourbage.debut)+(h>0?' · repère de '+String(h).replace('.',',')+' h':'')+'.'};
  }
  if(e==='fini'&&!dec&&c.statut==='setup'&&c.debourbage.suite==='fut') return {k:'ent', t:'Entonner', s:'Le jus clair attend d’être entonné : '+_nbL(c.debourbage.jus_l||0)+' L.'};
  return null;
}
function _debProchainHtml(c){
  var p=_debProchain(c); if(!p||!canWrite()) return '';
  return '<div class="mvencadre mvencadre-info prat-next">'+_mvIcon('entonnoir',18)+'<span><b class="mvencadre-t">Prochain geste · '+p.t+'</b>'+_escHtml(p.s)
    +'<button type="button" class="mvbtn mvbtn-principal mvbtn-compact prat-al-b" '+_pratEtq('deb.go')+' data-id="'+_escAttr(c.id)+'" data-k="'+p.k+'" onclick="openDebourber(this.dataset.id,this.dataset.k)">'+p.t+'</button></span></div>';
}

/* Ce que le débourbage a laissé, dans le parcours replié de la fiche. */
function _debRecapHtml(c){
  var d=c.debourbage; if(!d||!d.debut) return '';
  var t='Débourbage '+(d.methode==='flot'?'par flottation':'statique')+' du '+_debQuandTxt(d.debut)+(d.fin?' au '+_debQuandTxt(d.fin):'')
    +(d.temp!=null?' · '+String(d.temp).replace('.',',')+' °C':'')+(d.enz?' · '+d.enz:'')
    +(d.ntu0!=null?' · '+_nbL(d.ntu0)+' NTU au départ':'')
    +(d.jus_l?' · '+_nbL(d.jus_l)+' L de jus clair':'')+(d.bourbes_l?', '+_nbL(d.bourbes_l)+' L de bourbes':'')
    +(d.ntu1!=null?' · '+_nbL(d.ntu1)+' NTU':'')+'.';
  return '<p class="prat-note">'+_escHtml(t)+'</p>';
}
/* —— La feuille « Débourber » (même famille que la feuille de décuvage : _vendSheet) —— */
var _debEt=null;   // { id, mode:'debut'|'fin', meth, suite }
function _debCuve(id){ return ((CAVE_VENDANGE.cuves_vinif)||[]).filter(function(x){ return x&&x.id===id; })[0]||null; }
function openDebourber(id, k){
  if(!canWrite()) return;
  var c=_debCuve(id); if(!c){ showToast('Cuve introuvable','#B85A1A'); return; }
  if(k==='ent'){ _debEntonner(c); return; }
  var d=_pratDe(c), kk=_vendCuveCoul(c);
  var meth=(c.debourbage&&c.debourbage.methode)||(d&&_pratHas(d.P,kk,'deb','flot')&&!_pratHas(d.P,kk,'deb','stat')?'flot':'stat');
  var suite=(c.fa_lieu==='cuve')?'cuve':(c.fa_lieu==='fut'||c.fa_lieu==='cf')?(c.fa_lieu==='fut'?'fut':'cuve')
    :(d&&kk==='b'&&_pratHas(d.P,'b','fa','cuve')&&!_pratHas(d.P,'b','fa','fut'))?'cuve':(kk==='o'?'cuve':'fut');
  _debEt={ id:id, mode:(_debEtat(c)==='encours')?'fin':'debut', meth:meth, suite:suite };
  _debRendre();
}
function _debNtuOn(c){ var d=_pratDe(c); return !d || d.k!=='b' || _pratHas(d.P,'b','ntu','oui'); }
function _debRendre(){
  var E=_debEt, c=E&&_debCuve(E.id); if(!c) return;
  var k=_vendCuveCoul(c), d=_pratDe(c), rep=(d&&d.P[d.k]&&d.P[d.k].rep)||null, jus=_debJusL(c);
  var auj=(typeof _mlAuj==='function')?_mlAuj():'', now=new Date(), hh=('0'+now.getHours()).slice(-2)+':'+('0'+now.getMinutes()).slice(-2);
  var h='<div class="mvv-sheet-hd"><div class="mvv-sheet-t">'+(E.mode==='fin'?'Soutirer le jus clair':'Débourber')+'</div>'
    +'<button class="mv-gh mvv-sheet-x" onclick="_vendSheetClose()" title="Fermer" aria-label="Fermer">'+_mvIcon('croix',18)+'</button></div>'
    +'<div class="mvv-sheet-sub">'+_escHtml(c.nom||'Cuve')+' · '+(k==='o'?'Rosé':'Blanc')+(jus?' · '+_nbL(jus)+' L de jus':'')+'</div>';
  var bl=(E.mode==='debut')?_debBloque(c):null;
  if(bl){
    h+='<div class="mvencadre mvencadre-danger prat-al">'+_mvIcon('interdit',18)+'<span><b class="mvencadre-t">Impossible · Cette cuve ne se débourbe plus</b>'+_escHtml(bl)+'</span></div>'
      +'<button class="mvv-save" style="margin-top:18px" onclick="_vendSheetClose()">Fermer</button>';
    _vendSheet(h); return;
  }
  if(E.mode==='debut'){
    h+='<label class="mvv-flbl">Méthode</label><div class="mvv-optabs">'
      +[['stat','Statique, au froid'],['flot','Flottation']].map(function(m){ return '<button type="button" class="mvv-optab'+(E.meth===m[0]?' on':'')+'" data-m="'+m[0]+'" onclick="_debMeth(this.dataset.m)">'+m[1]+'</button>'; }).join('')+'</div>'
      +(d?'<div class="mvv-fnote">Proposée d’après vos pratiques.</div>':'')
      +'<label class="mvv-flbl">Début</label><div style="display:flex;gap:9px"><input id="deb-d" class="mvv-tin" type="date" value="'+_escAttr(auj)+'"><input id="deb-h" class="mvv-tin" type="time" value="'+_escAttr(hh)+'"></div>'
      +'<label class="mvv-flbl">Température <span class="mvv-fhint">(facultatif)</span></label><div style="display:flex;gap:8px;align-items:center"><input id="deb-t" class="mvv-tin" type="text" inputmode="decimal" '+_pratEtq('deb.temp')+' placeholder="ex. 12"><span class="mvv-step2-u">°C</span></div>'
      +'<label class="mvv-flbl">Enzymage <span class="mvv-fhint">(facultatif — produit et dose)</span></label><input id="deb-e" class="mvv-tin" type="text" placeholder="ex. pectinase, 2 g/hL">'
      +(_debNtuOn(c)?'<label class="mvv-flbl">Turbidité au départ <span class="mvv-fhint">(facultatif)</span></label><div style="display:flex;gap:8px;align-items:center"><input id="deb-n" class="mvv-tin" type="text" inputmode="decimal" placeholder="ex. 1450"><span class="mvv-step2-u">NTU</span></div>':'')
      +((rep&&parseFloat(rep.deb_h)>0)?'<div class="mvv-fnote">Durée prévue : <b>'+String(rep.deb_h).replace('.',',')+' h</b> — votre repère, réglé dans vos pratiques.</div>':'')
      +'<button class="mvv-save" style="margin-top:18px" '+_pratEtq('deb.ok')+' onclick="saveDebourber()">Mettre à débourber</button>';
  } else {
    var db=c.debourbage||{};
    h+='<div class="mvv-fnote">Débourbage '+(db.methode==='flot'?'par flottation':'statique')+' depuis le '+_escHtml(_debQuandTxt(db.debut))+(db.temp!=null?' · '+String(db.temp).replace('.',',')+' °C':'')+'.</div>'
      +'<label class="mvv-flbl">Fin</label><div style="display:flex;gap:9px"><input id="deb-d" class="mvv-tin" type="date" value="'+_escAttr(auj)+'"><input id="deb-h" class="mvv-tin" type="time" value="'+_escAttr(hh)+'"></div>'
      +'<div style="display:flex;gap:9px"><div style="flex:1"><label class="mvv-flbl">Jus clair</label><div style="display:flex;gap:6px;align-items:center"><input id="deb-j" class="mvv-tin" type="text" inputmode="decimal" '+_pratEtq('deb.jus')+' placeholder="litres"><span class="mvv-step2-u">L</span></div></div>'
      +'<div style="flex:1"><label class="mvv-flbl">Bourbes <span class="mvv-fhint">(facultatif)</span></label><div style="display:flex;gap:6px;align-items:center"><input id="deb-b" class="mvv-tin" type="text" inputmode="decimal" '+_pratEtq('deb.bourbes')+' placeholder="litres"><span class="mvv-step2-u">L</span></div></div></div>'
      +'<div class="mvv-fnote" id="deb-vol-note"></div>'
      +(_debNtuOn(c)?'<label class="mvv-flbl">Turbidité du jus clair <span class="mvv-fhint">(facultatif)</span></label><div style="display:flex;gap:8px;align-items:center"><input id="deb-n" class="mvv-tin" type="text" inputmode="decimal" placeholder="ex. 220"><span class="mvv-step2-u">NTU</span></div><div class="mvv-fnote" id="deb-ntu-note"></div>':'')
      +'<label class="mvv-flbl">Et ensuite</label><div class="mvv-optabs">'
      +'<button type="button" class="mvv-optab'+(E.suite==='fut'?' on':'')+'" '+_pratEtq('deb.suite.fut')+' data-s="fut" onclick="_debSuite(this.dataset.s)">Entonner (fûts du parc)</button>'
      +'<button type="button" class="mvv-optab'+(E.suite==='cuve'?' on':'')+'" '+_pratEtq('deb.suite.cuve')+' data-s="cuve" onclick="_debSuite(this.dataset.s)">Fermenter dans cette cuve</button></div>'
      +'<div class="mvv-fnote">'+(E.suite==='fut'?'La feuille d’entonnage suit : les fûts du parc, la cuvée au Chai, sa fermentation suivie.':'La cuve passe en fermentation, datée de la fin du débourbage ; la tournée la suit.')+'</div>'
      +'<button class="mvv-save" style="margin-top:18px" '+_pratEtq('deb.ok')+' id="deb-go" onclick="saveDebourber()">'+(E.suite==='fut'?'Soutirer et entonner':'Soutirer et fermenter en cuve')+'</button>';
  }
  _vendSheet(h);
  if(E.mode==='fin') _debFinBind(c, rep);
}
function _debNum(id){ var v=parseFloat(String(((document.getElementById(id)||{}).value)||'').replace(/[\s\u00a0\u202f]/g,'').replace(',','.')); return isFinite(v)?v:null; }
/* Les volumes et la turbidité se relisent à la frappe, sans redessiner (le curseur reste). */
function _debFinBind(c, rep){
  var maj=function(){
    var j=_debNum('deb-j'), b=_debNum('deb-b'), n=_debNum('deb-n'), note=document.getElementById('deb-vol-note'), go=document.getElementById('deb-go');
    var err=(j>0)?_debCheckFin(c,{fin:'9999', jus:j, bourbes:b}):null;
    if(note){ note.classList.toggle('prat-err', !!err); note.textContent=err||((j>0&&b>0)?'Bourbes : '+String(Math.round(b/(j+b)*1000)/10).replace('.',',')+' % du jus.':''); }
    if(go) go.disabled=!!err;
    var nn=document.getElementById('deb-ntu-note');
    if(nn){ var r=_debNtuRep(rep,n); nn.textContent=r?('Votre repère : '+(rep.ntu_min!=null&&rep.ntu_min!==''?rep.ntu_min:'…')+' à '+(rep.ntu_max!=null&&rep.ntu_max!==''?rep.ntu_max:'…')+' NTU — '+(r==='dedans'?'dedans.':r==='au-dessus'?'au-dessus : le jus est encore trouble.':'au-dessous : le jus est très clair.')):''; }
  };
  ['deb-j','deb-b','deb-n'].forEach(function(id){ var el=document.getElementById(id); if(el) el.addEventListener('input', maj); });
  maj();
}
function _debMeth(m){ if(!_debEt||(m!=='stat'&&m!=='flot')) return; _debEt.meth=m; _debRendre(); }
function _debSuite(s){ if(!_debEt||(s!=='fut'&&s!=='cuve')) return; _debGarder(); _debEt.suite=s; _debRendre(); _debRemettre(); }
/* Un changement de suite redessine la feuille : ce qu'on avait tapé y revient. */
var _debTape=null;
function _debGarder(){ _debTape={}; ['deb-d','deb-h','deb-j','deb-b','deb-n'].forEach(function(id){ var el=document.getElementById(id); if(el) _debTape[id]=el.value; }); }
function _debRemettre(){
  if(!_debTape) return;
  Object.keys(_debTape).forEach(function(id){ var el=document.getElementById(id); if(el&&_debTape[id]!=null){ el.value=_debTape[id]; el.dispatchEvent(new Event('input')); } });
  _debTape=null;
}
function saveDebourber(){
  if(!_debEt||!_vendGarde()) return;
  var c=_debCuve(_debEt.id); if(!c) return;
  var quand=_debQuand((document.getElementById('deb-d')||{}).value,(document.getElementById('deb-h')||{}).value);
  var qui=(window.currentUser&&window.currentUser.nom)||'';
  if(_debEt.mode==='debut'){
    var bl=_debBloque(c); if(bl){ showToast(bl,'#B85A1A'); return; }   // ⚠ AVANT toute écriture
    if(!quand){ showToast('Indiquez le début du débourbage','#B85A1A'); return; }
    var t=_debNum('deb-t'), n=_debNum('deb-n'), e=String(((document.getElementById('deb-e')||{}).value)||'').trim();
    c.debourbage={ methode:_debEt.meth, debut:quand, temp:(t!=null?t:null), enz:e||null, ntu0:(n!=null&&n>=0?n:null), par:qui };
    window.CAVE_VENDANGE=CAVE_VENDANGE;
    _vendSheetClose();
    _vendFbSave((c.nom||'La cuve')+' : mise à débourber','#3D6B27');
    renderVendCuves();
    return;
  }
  var f={ fin:quand, jus:_debNum('deb-j'), bourbes:_debNum('deb-b') };
  var err=_debCheckFin(c,f); if(err){ showToast(err,'#B85A1A'); return; }   // ⚠ AVANT toute écriture
  var n1=_debNum('deb-n');
  Object.assign(c.debourbage, { fin:f.fin, jus_l:Math.round(f.jus), bourbes_l:(f.bourbes>0?Math.round(f.bourbes):null), ntu1:(n1!=null&&n1>=0?n1:null), suite:_debEt.suite, par_fin:qui });
  if(_debEt.suite==='cuve'){
    c.statut='fa';
    _vendHistPose(c,'fa',f.fin.slice(0,10));   // PARC-1 : le passage se date, de la fin du débourbage
  }
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendSheetClose();
  _vendFbSave((c.nom||'La cuve')+' : '+_nbL(f.jus)+' L de jus clair'+(_debEt.suite==='cuve'?', en fermentation':''),'#3D6B27');
  renderVendCuves();
  if(_debEt.suite==='fut'){ var cid=c.id; setTimeout(function(){ var cc=_debCuve(cid); if(cc) _debEntonner(cc); }, 0); }
}
/* Entonner : la feuille de décuvage, en mode entonnage — la fermentation finira au Chai, le volume est le jus clair. */
function _debEntonner(c){
  var j=c.debourbage&&c.debourbage.jus_l;
  if(typeof openVendDecuvage==='function') openVendDecuvage(c.id, { ent:true, vol_hl:(j>0?Math.round(j)/100:null) });
}

/* —— La fenêtre de la cuve : le pressurage d'arrivée et les choix de la cuve —— */
var _vcuvFa=null, _vcuvMalo=null;
function _vcuvChoixReset(c){
  _vcuvFa=(c&&c.fa_lieu)||null; _vcuvMalo=(c&&c.malo_prevue)||null;
  var g=document.getElementById('vcuv-goutte'), p=document.getElementById('vcuv-presse');
  if(g) g.value=(c&&c.pressurage&&c.pressurage.goutte_l!=null)?c.pressurage.goutte_l:'';
  if(p) p.value=(c&&c.pressurage&&c.pressurage.presse_l!=null)?c.pressurage.presse_l:'';
}
function _vcuvChoixHtml(k){
  var P=_pratCfg(), h='';
  if(k==='b'||k==='o') h+='<div id="vcuv-press-row"><div class="fl" style="margin-top:14px">Pressurage <span style="font-weight:400;opacity:.75">— le jus de la cuve, facultatif</span></div>'
    +'<div style="display:flex;gap:8px"><input type="text" inputmode="decimal" class="fi ac" id="vcuv-goutte" placeholder="Goutte (L)"><input type="text" inputmode="decimal" class="fi ac" id="vcuv-presse" placeholder="Presse (L)"></div></div>';
  if(k==='b'&&P&&P.actif.b&&(P.b.fa||[]).length>1){
    if(!_vcuvFa||P.b.fa.indexOf(_vcuvFa)===-1) _vcuvFa=P.b.fa[0];
    h+='<div class="fl" style="margin-top:14px">Fermentation de cette cuve <span style="font-weight:400;opacity:.75">— vos façons</span></div><div class="prat-ch">'
      +P.b.fa.map(function(v){ return '<button type="button" class="prat-o'+(_vcuvFa===v?' on':'')+'" aria-pressed="'+(_vcuvFa===v)+'" data-v="'+v+'" onclick="_vcuvFaLieu(this.dataset.v)">'+(v==='fut'?'En fût':v==='cuve'?'En cuve':'Démarrée en cuve')+'</button>'; }).join('')+'</div>';
  }
  if(k==='b'&&P&&P.actif.b&&(P.b.ml||[]).length>1){
    if(!_vcuvMalo||P.b.ml.indexOf(_vcuvMalo)===-1) _vcuvMalo=P.b.ml[0];
    h+='<div class="fl" style="margin-top:14px">Malo de cette cuve</div><div class="prat-ch">'
      +P.b.ml.map(function(v){ return '<button type="button" class="prat-o'+(_vcuvMalo===v?' on':'')+'" aria-pressed="'+(_vcuvMalo===v)+'" data-v="'+v+'" onclick="_vcuvMaloSet(this.dataset.v)">'+(v==='fait'?'Faite':v==='bloq'?'Bloquée':'Partielle')+'</button>'; }).join('')+'</div>';
  }
  return h;
}
function _vcuvFaLieu(v){ if(v!=='fut'&&v!=='cuve'&&v!=='cf') return; _vcuvFa=v; _vcuvCoulRendre(); }
function _vcuvMaloSet(v){ if(v!=='fait'&&v!=='bloq'&&v!=='part') return; _vcuvMalo=v; _vcuvCoulRendre(); }
/* Lus par saveVendCuve : le pressurage dit, et les choix de la cuve (seulement pour sa couleur). */
function _vcuvChoixPris(k){
  var o={};
  if(k==='b'||k==='o'){
    var g=_debNumV('vcuv-goutte'), p=_debNumV('vcuv-presse');
    if(g!=null||p!=null) o.pressurage={ goutte_l:(g!=null?Math.round(g):null), presse_l:(p!=null?Math.round(p):null) };
  }
  var P=_pratCfg();
  if(k==='b'&&P&&P.actif.b){
    if((P.b.fa||[]).length>1&&_vcuvFa) o.fa_lieu=_vcuvFa; else if((P.b.fa||[]).length===1) o.fa_lieu=P.b.fa[0];
    if((P.b.ml||[]).length>1&&_vcuvMalo) o.malo_prevue=_vcuvMalo; else if((P.b.ml||[]).length===1) o.malo_prevue=P.b.ml[0];
  }
  return o;
}
function _debNumV(id){ var el=document.getElementById(id); if(!el) return null; var v=parseFloat(String(el.value||'').replace(/[\s\u00a0\u202f]/g,'').replace(',','.')); return (isFinite(v)&&v>=0)?v:null; }

/* ═══════════════════════════════════════════════════════════════════════════
   ★★ COULEUR-1 (§625) — LA COULEUR D'UNE CUVÉE AU CHAI, ET LES MÉLANGES QUI NE SE FONT PAS
   Une cuvée prend la couleur de sa cuve au décuvage (`couleur`, écrite par saveVendDecuvage) ; une cuvée créée au
   Chai la reçoit à « Nouvelle cuvée » (facultatif). Les mélanges — l'assemblage du Chai (« Compléter le fût ») et la
   fusion du Cuvier — lisent une seule règle, _coulMelange : le rosé compte comme un rouge (règlement (UE) 2019/934,
   art. 7), et un rosé ne se fait pas en mélangeant un rouge et un blanc (art. 8). Une couleur inconnue ne tranche rien.
   ═══════════════════════════════════════════════════════════════════════════ */
function _coulOk(k){ return k==='r'||k==='b'||k==='o'; }
function _coulMot(k){ return k==='r'?'Rouge':k==='b'?'Blanc':k==='o'?'Rosé':''; }
/* La couleur d'une cuvée : celle qu'on lui a dite, sinon celle de la cuve d'où elle vient, sinon '?'. */
function _cuveeCoul(cu){
  if(cu&&_coulOk(cu.couleur)) return cu.couleur;
  var cv=(cu&&typeof window._caveCuveSource==='function')?window._caveCuveSource(cu):null;
  var k=cv?_vendCuveCoul(cv):'?';
  return _coulOk(k)?k:'?';
}
/* ★ LA SOURCE DES MÉLANGES : verser `kDe` dans `kVers`. null, ou {id, niv:'w' (à vérifier) | 'b' (impossible), t, d}. */
function _coulMelange(kVers, kDe){
  if(!_coulOk(kVers)||!_coulOk(kDe)||kVers===kDe) return null;
  var regle='un rosé ne se fait pas en mélangeant un rouge et un blanc — c’est interdit en Europe (règlement 2019/934, article 8).';
  if(kVers==='b') return {id:'mel-b-'+kDe, niv:'b', t:'Pas de '+_PRAT_NOM[kDe]+' dans un blanc', d:'Le blanc deviendrait un rosé de mélange : '+regle};
  if(kVers==='o'&&kDe==='b') return {id:'mel-o-b', niv:'b', t:'Pas de blanc dans un rosé', d:'U'+regle.slice(1)};
  if(kVers==='r'&&kDe==='b') return {id:'mel-r-b', niv:'w', t:'Du blanc dans un rouge',
    d:'Selon l’appellation, ce mélange peut être refusé. À Gevrey-Chambertin par exemple, un cépage blanc n’entre dans un rouge qu’en mélange de plants dans la vigne. Vérifiez votre cahier des charges.'};
  return null;   // un rouge et un rosé : la même catégorie
}
/* L'encadré d'un mélange (le style des sécurités de PRATIQUES-1) ; `ok` : l'id déjà confirmé ; `ou` : 'fus' (la fusion du
   Cuvier) ou 'asm' (l'assemblage du Chai) — le geste qui confirme, écrit en toutes lettres (le compte des gestes le lit). */
function _coulMelHtml(m, ok, ou){
  if(!m) return '';
  if(m.niv==='w'&&ok===m.id) return '<div class="mvencadre mvencadre-ok prat-al">'+_mvIcon('check',18)+'<span><b class="mvencadre-t">'+m.t+'</b>Confirmé : noté au registre avec le mélange.</span></div>';
  return '<div class="mvencadre mvencadre-'+(m.niv==='b'?'danger':'attention')+' prat-al">'+_mvIcon(m.niv==='b'?'interdit':'alerte',18)
    +'<span><b class="mvencadre-t">'+_PRAT_NIV[m.niv]+' · '+m.t+'</b>'+m.d
    +(m.niv==='w'?'<button type="button" class="mvbtn mvbtn-secondaire mvbtn-compact prat-al-b" data-id="'+m.id+'" '
      +(ou==='fus'?'onclick="_vendFusCoulOkSet(this.dataset.id)"':'onclick="_asmCoulOkSet(this.dataset.id)"')+'>C’est voulu</button>':'')+'</span></div>';
}
/* Au Chai, la couleur ne se dit sur les cartes que si le domaine en a plusieurs (ses pratiques, ou ses cuvées). */
function _chaiMultiCoul(){
  var P=_pratCfg();
  if(P&&['r','b','o'].filter(function(k){ return P.actif[k]; }).length>1) return true;
  var vu={};
  (((window.CAVE_ELEVAGE||{}).cuvees)||[]).forEach(function(c){ if(c&&c.statut!=='embouteille'){ var k=_cuveeCoul(c); if(k!=='?') vu[k]=1; } });
  return Object.keys(vu).length>1;
}
function _chaiCoulHtml(c){
  var k=_cuveeCoul(c); if(k==='?'||!_chaiMultiCoul()) return '';
  return ' <span class="mvc-dot"></span> <span class="coul-mot"><i class="mat-pt '+(k==='o'?'prat-pt-o':k)+'"></i>'+_coulMot(k)+'</span>';
}
/* « Nouvelle cuvée » / « Modifier la cuvée » (cave.js) : la couleur, facultative. */
var _cuvCoul=null, _cuvCoulEx=null;
function _cuvCoulSeule(){ var P=_pratCfg(); if(!P) return null; var a=['r','b','o'].filter(function(k){ return P.actif[k]; }); return a.length===1?a[0]:null; }
function _cuvCoulOuvrir(cu){
  _cuvCoulEx=cu||null;
  var k=cu?_cuveeCoul(cu):'?';
  _cuvCoul=cu?(k!=='?'?k:null):_cuvCoulSeule();
  _cuvCoulRendre();
}
function _cuvCoulRendre(){
  var el=document.getElementById('cuv-coul-body'); if(!el) return;
  var P=_pratCfg(), ro=!!(P&&P.actif.o)||_cuvCoul==='o';
  var herite=!!(_cuvCoulEx&&!_coulOk(_cuvCoulEx.couleur)&&_cuveeCoul(_cuvCoulEx)!=='?');
  el.innerHTML='<div class="fl" style="margin-top:14px">Couleur <span style="font-weight:400;opacity:.75">— '+(herite?'celle de sa cuve au Cuvier':'facultatif')+'</span></div>'
    +'<div class="prat-ch" role="group" aria-label="Couleur de la cuvée">'+['r','b','o'].filter(function(x){ return x!=='o'||ro; }).map(function(x){
      return '<button type="button" class="prat-o'+(_cuvCoul===x?' on':'')+'" aria-pressed="'+(_cuvCoul===x)+'" '+_pratEtq('cuv.coul.'+x)+' data-c="'+x+'" onclick="_cuvCoulSet(this.dataset.c)">'+_coulMot(x)+'</button>';
    }).join('')+'</div>';
}
function _cuvCoulSet(k){ if(!_coulOk(k)) return; _cuvCoul=(_cuvCoul===k)?null:k; _cuvCoulRendre(); }
/* Lu par saveCuvee : la couleur à écrire, ou null (rien de dit). */
function _cuvCoulPrise(){ return _coulOk(_cuvCoul)?_cuvCoul:null; }

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
// PRATIQUES-2 (§624)
window.openDebourber   = openDebourber;
window._debMeth        = _debMeth;
window._debSuite       = _debSuite;
window.saveDebourber   = saveDebourber;
window._vcuvFaLieu     = _vcuvFaLieu;
window._vcuvMaloSet    = _vcuvMaloSet;
// COULEUR-1 (§625) : le geste de la fiche de cuvée, et ce que cave.js lit (cave.js n'importe pas ce module)
window._cuvCoulSet     = _cuvCoulSet;
window._cuveeCoul      = _cuveeCoul;
window._vendCuveCoul   = _vendCuveCoul;
window._coulMelange    = _coulMelange;
window._coulMelHtml    = _coulMelHtml;
window._coulMot        = _coulMot;
window._chaiCoulHtml   = _chaiCoulHtml;
window._cuvCoulOuvrir  = _cuvCoulOuvrir;
window._cuvCoulPrise   = _cuvCoulPrise;
// ── Lus par cuvier.js ──
export { _pratCfg, _pratGeste, _pratBandeauHtml, _pratRegLigne, _vendCuveCoul, _vendChapeau, _vcuvCoulInject, _vcuvCoulRendre,
  _vcuvCoulChoisie, _vcuvCoulPret, _vcuvCoulConf, _vendParcoursHtml, _vmMacInject, _vmMacPris, _vtMontre,
  _pratStepperHtml, _pratEtapeLbl, _vcuvChoixPris, _coulMelange, _coulMelHtml };
