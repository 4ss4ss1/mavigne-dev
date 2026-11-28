// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════
// MA VIGNE — LA CAVE JUSQU'À LA BOUTEILLE, ET LES GESTES CONFIÉS (cave-mise.js) — CAVE-SUITE (§627)
// La mise en masse ; préparer la mise (date, compte à rebours, matières sèches face au stock) ; mettre en bouteille
// (formats, n° de lot, contrôles, mises en plusieurs fois, matières sèches sorties de La Réserve, stock par format) ;
// les rappels du Chai (soutirer après un collage, bâtonner, la suite d'une dégustation, préparer la mise) ; le parcours
// d'une cuvée en haut de sa fiche ; confier un geste à quelqu'un de l'équipe.
// ★ Importé par cave.js (cave.js est à 769 ko pour un barème de 751 : le lot ne pouvait pas y loger). Il lit la Cave par
//   window (le bloc « CAVE-SUITE » de la frontière de cave.js) ; rien ne s'exécute au chargement ; ses gestes
//   s'exposent en fin de fichier. Ses styles s'injectent (styles.css est à 1 014 ko pour un plafond de 1 024).
// Maquette v2 « la suite » validée par Nico le 27/11 (« go », les onze recommandations).
// © 2026 Nicolas GUERET / GUERETTECH
// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════
import { isAdmin, isSaisonnier, canWrite, showToast, _escHtml, _escAttr, _mvIcon } from './utils.js';

/* ═══ Outils ═══════════════════════════════════════════════════════════════════════════════════════════════ */
function _cmCE(){ var E=window.CAVE_ELEVAGE; if(!E) return {cuvees:[], operations:[], analyses:[]}; return E; }
function _cmCuvee(id){ var L=_cmCE().cuvees||[]; for(var i=0;i<L.length;i++){ if(L[i]&&L[i].id===id) return L[i]; } return null; }
function _cmIso(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function _cmD(iso){ var p=String(iso||'').slice(0,10).split('-'); return new Date(+p[0], (+p[1]||1)-1, +p[2]||1, 12); }
function _cmAuj(){ return (typeof window._mlAuj==='function')?window._mlAuj():_cmIso(new Date()); }
function _cmAddJ(iso,n){ var d=_cmD(iso); d.setDate(d.getDate()+n); return _cmIso(d); }
function _cmEcart(a,b){ return Math.round((_cmD(b)-_cmD(a))/86400000); }
var _CM_MOIS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
function _cmFr(iso){ if(!iso) return ''; var d=_cmD(iso); return d.getDate()+' '+_CM_MOIS[d.getMonth()]; }
function _cmNb(n){ return Math.round(Number(n)||0).toLocaleString('fr-FR'); }
function _cmV1(x){ return String(Math.round((Number(x)||0)*10)/10).replace('.',','); }
function _cmHl(l){ return _cmV1((Number(l)||0)/100); }
function _cmNum(id){ var el=document.getElementById(id); if(!el) return null; var v=parseFloat(String(el.value||'').replace(/[\s\u00a0\u202f]/g,'').replace(',','.')); return isFinite(v)?v:null; }
function _cmVal(id){ var el=document.getElementById(id); return el?String(el.value||'').trim():''; }
function _cmNom(c){ return c?((c.nom||'Cuvée')+(c.millesime?' '+c.millesime:'')):'Cuvée'; }
function _cmQui(){ return (window.currentUser&&window.currentUser.nom)||''; }
function _cmGarde(){ if(!canWrite()||isSaisonnier()){ showToast('Accès lecture seule','#B85A1A'); return false; } return true; }
function _cmVolL(c){ return (typeof window._caveVolL==='function')?Math.max(0,Math.round(window._caveVolL(c))):0; }
function _cmNbFuts(c){ return (typeof window._caveNbTonneaux==='function')?window._caveNbTonneaux(c):0; }
function _cmCoul(c){ return (c&&(c.couleur==='b'||c.couleur==='o'||c.couleur==='r'))?c.couleur:''; }
function _cmOps(c){ var id=c&&c.id; return (_cmCE().operations||[]).filter(function(o){ return o&&((o.cuvees_ids&&o.cuvees_ids.indexOf(id)>=0)||o.cuvee_id===id); }); }
function _cmEnreg(msg){
  var E=_cmCE(); window.CAVE_ELEVAGE=E;
  if(typeof window.fbSaveToast==='function') window.fbSaveToast({cave_elevage:E}, msg||'Enregistré', '#C0845A');
  else if(typeof window.fbSave==='function') window.fbSave('cave_elevage', E);
}
function _cmRepeindre(){ if(typeof window.renderCave==='function') window.renderCave(); }
function _cmFermer(){ if(typeof window._vendSheetClose==='function') window._vendSheetClose(); }
function _cmFeuille(h){ _cmCss(); if(typeof window._vendSheet==='function') window._vendSheet(h); }
function _cmTete(t, sub){
  return '<div class="mvv-sheet-hd"><div class="mvv-sheet-t">'+_escHtml(t)+'</div><button class="mv-gh mvv-sheet-x" onclick="_vendSheetClose()" title="Fermer" aria-label="Fermer">'+_mvIcon('croix',18)+'</button></div>'
    +(sub?'<div class="mvv-sheet-sub">'+sub+'</div>':'');
}
/* Les styles du module : injectés une fois (styles.css est au plafond). Les classes reprennent le jeu commun
   (mvv-* des feuilles du Cuvier, mvencadre, mvbtn) ; ne s'ajoute ici que ce qui leur manque. */
function _cmCss(){
  if(document.getElementById('mv-cm-css')) return;
  var s=document.createElement('style'); s.id='mv-cm-css';
  s.textContent=''
  +'.cm-l{display:flex;gap:10px;align-items:center;padding:10px 12px;border-top:1px solid var(--bord,#E7E6E2);font-size:var(--pt-base,14px)}'
  +'.cm-l:first-child{border-top:0}.cm-ls{border:1px solid var(--bord,#E7E6E2);border-radius:12px;overflow:hidden;background:var(--bg-card,#fff)}'
  +'.cm-l .cm-r{margin-left:auto;text-align:right;font-size:var(--pt-lbl,12.5px);color:var(--texte-doux,#686660);white-space:nowrap}'
  +'.cm-l .cm-s{display:block;font-size:var(--pt-lbl,12.5px);color:var(--texte-doux,#686660);font-weight:400}'
  +'.cm-d{width:10px;height:10px;border-radius:50%;flex:none;background:#CFCBC3}.cm-d.ok{background:var(--vert,#3D6B27)}.cm-d.att{background:var(--or,#C2A14D)}.cm-d.ret{background:var(--orange,#B85A1A)}'
  +'button.cm-l{width:100%;text-align:left;background:var(--bg-card,#fff);border:0;border-top:1px solid var(--bord,#E7E6E2);cursor:pointer;font:inherit;color:inherit}button.cm-l:first-child{border-top:0}'
  +'button.cm-l.on{background:var(--or-p,#FAF3E0)}button.cm-l:disabled{opacity:.5;cursor:default}'
  +'.cm-rad{width:20px;height:20px;border-radius:50%;border:2px solid rgba(138,90,56,.3);flex:none}.cm-l.on .cm-rad{border-color:var(--or,#C2A14D);background:radial-gradient(#fff 32%,var(--or,#C2A14D) 36%)}'
  +'.cm-box{width:22px;height:22px;border-radius:6px;border:2px solid rgba(138,90,56,.35);flex:none;display:grid;place-items:center;color:#fff;font-size:var(--pt-txt,13px);font-weight:700}.cm-l.on .cm-box{background:var(--bordeaux,#7A2850);border-color:var(--bordeaux,#7A2850)}'
  +'.cm-res{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.cm-res div{background:var(--bg-doux,#F0EEE9);border-radius:10px;padding:8px 10px}.cm-res b{display:block;font-size:19px}.cm-res span{font-size:var(--pt-lbl,12px);color:var(--texte-doux,#686660)}'
  +'.cm-res b.neg{color:var(--rouge,#A0291E)}'
  +'table.cm-fm{width:100%;border-collapse:collapse;font-size:var(--pt-base,14px)}table.cm-fm td{padding:6px 4px;border-bottom:1px solid var(--bord,#E7E6E2)}table.cm-fm input{width:96px;min-height:40px;border:1px solid #C9C7C1;border-radius:8px;padding:0 8px;font:inherit;text-align:right}'
  +'.cm-ms select{max-width:100%;min-height:36px;font:inherit;font-size:var(--pt-txt,13px);border:1px solid #C9C7C1;border-radius:8px;background:#fff;padding:0 6px}'
  +'.cm-ms .cm-q{width:84px;min-height:36px;border:1px solid #C9C7C1;border-radius:8px;padding:0 8px;font:inherit;text-align:right}'
  +'.cm-manque{color:var(--orange,#B85A1A);font-weight:600}'
  +'.cm-carte{background:var(--bg-card,#fff);border:1px solid var(--bord,#E7E6E2);border-radius:14px;padding:12px 14px;margin:0 0 10px}'
  +'.cm-carte h4{margin:0;font:600 19px/1.2 var(--titre,Georgia,serif)}.cm-carte .cm-m{font-size:var(--pt-lbl,12.5px);color:var(--texte-doux,#686660);margin:3px 0 0}'
  +'.cm-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}'
  +'.cm-tag{display:inline-flex;align-items:center;gap:4px;font-size:var(--pt-lbl,12px);font-weight:600;border-radius:7px;padding:2px 8px;background:var(--bg-doux,#F0EEE9);color:var(--texte-doux,#55534E)}'
  +'.cm-note{min-height:64px;padding:10px 12px}.cm-tag.al{background:#FBF0E6;color:#8F4512}.cm-tag.ok{background:#EAF3E2;color:#2E5220}'
  +'.cm-frise{display:flex;overflow-x:auto;padding:4px 0 2px;margin:6px 0 0}'
  +'.cm-fz{flex:1;min-width:70px;text-align:center;position:relative;font-size:11.5px;color:var(--texte-doux,#686660);padding-top:22px}'
  +'.cm-fz::before{content:"";position:absolute;top:8px;left:0;right:0;height:3px;background:#E1DED8}.cm-fz:first-child::before{left:50%}.cm-fz:last-child::before{right:50%}'
  +'.cm-fz i{position:absolute;top:2px;left:50%;transform:translateX(-50%);width:15px;height:15px;border-radius:50%;background:#fff;border:2px solid #CFCBC3}'
  +'.cm-fz.ok::before{background:var(--vert,#3D6B27)}.cm-fz.ok i{background:var(--vert,#3D6B27);border-color:var(--vert,#3D6B27)}.cm-fz.ok{color:var(--texte,#1B1A18)}'
  +'.cm-fz.now i{border:3px solid var(--bordeaux,#7A2850);width:17px;height:17px;top:1px}.cm-fz.now{color:var(--bordeaux,#7A2850);font-weight:600}.cm-fz b{display:block;font-weight:600;color:inherit}'
  +'.cm-next{display:flex;gap:10px;align-items:center;background:rgba(122,40,80,.08);border-radius:12px;padding:10px 12px;margin:10px 0 4px}'
  +'.cm-next .cm-k{font-size:11.5px;color:var(--bordeaux,#7A2850);font-weight:700;text-transform:uppercase;letter-spacing:.03em}'
  +'.cm-qui{display:inline-flex;align-items:center;gap:5px;font-size:var(--pt-lbl,12px);font-weight:600;margin:4px 6px 0 0;color:#8A5A38;background:#F3EADF;border-radius:7px;padding:2px 8px}'
  +'.cm-qui.ok{color:#2E5220;background:#EAF3E2}.cm-qui.pas,.cm-qui.ret{color:#8F4512;background:#FBF0E6}'
  +'.cm-cons{font-size:var(--pt-txt,13px);color:var(--texte-doux,#55534E);background:var(--bg-doux,#F0EEE9);border-radius:8px;padding:6px 9px;margin-top:6px}'
  +'.cm-tog{display:flex;gap:12px;align-items:center;width:100%;border:1px solid var(--bord,#E7E6E2);background:var(--bg-card,#fff);border-radius:12px;padding:10px 12px;margin-top:12px;cursor:pointer;font:inherit;color:inherit;text-align:left}'
  +'.cm-sw{width:44px;height:26px;border-radius:999px;background:#D6D3CC;position:relative;flex:none}.cm-sw i{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2)}'
  +'.cm-sw.on{background:var(--vert,#3D6B27)}.cm-sw.on i{left:21px}'
  +'.cm-ge{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}'
  +'.cm-ge button{border:1px solid var(--bord,#E7E6E2);background:var(--bg-card,#fff);border-radius:11px;padding:8px 4px;font:inherit;font-size:var(--pt-txt,13px);cursor:pointer;min-height:56px;display:flex;flex-direction:column;align-items:center;gap:3px;color:inherit}'
  +'.cm-ge button.on{border-color:#7A2850;background:#F7EEF2;color:#7A2850;font-weight:600}'
  +'.cm-pt{margin:0 0 12px}.cm-pt h3{margin:0 0 6px;font:600 21px/1.2 var(--titre,Georgia,serif)}'
  +'.cop-gh{font-size:var(--pt-micro,11.5px);font-weight:700;color:var(--texte-doux,#686660);text-transform:uppercase;letter-spacing:.04em;margin:10px 0 5px;width:100%}'
  +'.cave-op-type-btn.cm-dim{opacity:.4}';
  document.head.appendChild(s);
}

/* ═══ ★ MASSE-1 — LA MISE EN MASSE : DES FÛTS VERS UNE CUVE, EN UN GESTE ════════════════════════════════════════
   Tout le vin de la cuvée va dans UNE cuve : une cuve libre du parc, ou l'une des siennes. Le volume MESURÉ dans la
   cuve devient son volume ; l'écart avec ce qu'elle avait se lit en lies et pertes. Les fûts reviennent au parc, vides
   (motif « masse » de La Réserve). Le registre note un soutirage (data.masse). ⚠ Tout se vérifie AVANT d'écrire. */
var _msEt=null;   // {id, vers}
function _msCuves(c){
  var P=(typeof window._caveParc==='function')?window._caveParc():[], miennes=((c&&c.cuves)||[]).map(function(x){ return x&&x.ref; });
  return P.map(function(p){
    var mine=miennes.indexOf(p.id)>=0, occ=mine?null:((typeof window._caveCuveOcc==='function')?window._caveCuveOcc(p.id):null);
    return {p:p, mine:mine, occ:occ, cap:parseFloat(p.litres)||0};
  });
}
function openMasse(id){
  if(!_cmGarde()) return;
  var c=_cmCuvee(id); if(!c){ showToast('Cuvée introuvable','#B85A1A'); return; }
  if(!(_cmNbFuts(c)>0)){ showToast('« '+_cmNom(c)+' » n’est pas en fûts : rien à rassembler','#B85A1A'); return; }
  var V=_cmVolL(c), L=_msCuves(c).filter(function(x){ return !x.occ&&(!x.cap||x.cap>=V); });
  _msEt={id:id, vers:L.length?L[0].p.id:null};
  _msRendre();
}
function _msRendre(){
  var c=_msEt&&_cmCuvee(_msEt.id); if(!c) return;
  var V=_cmVolL(c), nf=_cmNbFuts(c), G=(typeof window._caveGroupesL==='function')?window._caveGroupesL(c):[], C=_msCuves(c);
  var h=_cmTete('Mise en masse', _escHtml(_cmNom(c))+' · '+nf+' fût'+(nf>1?'s':'')+' → une cuve');
  h+='<label class="mvv-flbl">Depuis</label><div class="cm-ls">'+G.map(function(g){
      return '<div class="cm-l">'+_mvIcon('barrique',16)+'<span><b>'+g.nb+' fût'+(g.nb>1?'s':'')+' de '+_cmV1(g.l)+' L</b><span class="cm-s">'+_escHtml(g.rep||'')+'</span></span></div>';
    }).join('')
    +((c.cuves||[]).filter(function(x){ return x&&parseFloat(x.litres)>0; }).map(function(x){ var p=window._caveCuve&&window._caveCuve(x.ref); return '<div class="cm-l">'+_mvIcon('cuve',16)+'<span><b>'+_escHtml((p&&p.nom)||'Cuve')+'</b><span class="cm-s">déjà dans la cuvée</span></span><span class="cm-r">'+_cmNb(x.litres)+' L</span></div>'; }).join(''))
    +'<div class="cm-l"><span style="flex:1"><b>Volume de la cuvée</b><span class="cm-s">d’après ses contenants</span></span><span class="cm-r"><b>'+_cmNb(V)+' L</b></span></div></div>';
  h+='<label class="mvv-flbl">Vers <span class="mvv-fhint">— une cuve libre du parc, ou l’une des siennes</span></label>';
  if(!C.length) h+='<div class="mvv-fnote">Aucune cuve au parc. Ajoutez-en une dans les réglages de la Cave (roue crantée › Le parc à cuves).</div>';
  else h+='<div class="cm-ls">'+C.map(function(x){
      var ko=!!x.occ, petit=!ko&&x.cap>0&&x.cap<V, on=_msEt.vers===x.p.id;
      var r=ko?('prise : '+_escHtml(x.occ.nom||'')):(petit?'trop petite':(x.mine?'la sienne':'tout tient'));
      return '<button type="button" class="cm-l'+(on?' on':'')+'"'+(ko?' disabled':' data-v="'+_escAttr(x.p.id)+'" onclick="_msVers(this.dataset.v)"')+' data-tuto="masse.cuve"><span class="cm-rad"></span><span style="flex:1"><b>'+_escHtml(x.p.nom||'Cuve')+'</b><span class="cm-s">'+_escHtml(((typeof window._caveMat==='function')?window._caveMat(x.p.matiere).lbl:''))+(x.cap?' · '+_cmNb(x.cap)+' L':'')+'</span></span><span class="cm-r'+(petit?' cm-manque':'')+'">'+r+'</span></button>';
    }).join('')+'</div>';
  h+='<div style="display:flex;gap:9px"><div style="flex:1"><label class="mvv-flbl">Date</label><input id="ms-d" class="mvv-tin" type="date" value="'+_escAttr(_cmAuj())+'"></div>'
    +'<div style="flex:1"><label class="mvv-flbl">Mesuré dans la cuve</label><div style="display:flex;gap:6px;align-items:center"><input id="ms-l" class="mvv-tin" type="text" inputmode="decimal" data-tuto="masse.l" data-prop="'+V+'" value="'+V+'"><span class="mvv-step2-u">L</span></div></div></div>'
    +'<div class="mvv-fnote" id="ms-note"></div>'
    +'<div class="mvencadre" style="margin-top:10px">Les <b>'+nf+' fût'+(nf>1?'s':'')+' reviennent au parc</b>, vides, vieillis d’un vin. Le volume mesuré devient celui de la cuvée. Le registre note un soutirage, « mise en masse ».</div>'
    +'<button class="mvv-save" style="margin-top:16px" id="ms-go" data-tuto="masse.ok" onclick="saveMasse()">Rassembler dans la cuve</button>';
  _cmFeuille(h);
  var maj=function(){
    var l=_cmNum('ms-l'), n=document.getElementById('ms-note'), go=document.getElementById('ms-go'), p=window._caveCuve&&window._caveCuve(_msEt.vers);
    var e=_msErreur(c, p, l);
    if(n){ n.classList.toggle('prat-err', !!e); n.textContent=e||((l>0&&V>0)?('Lies et pertes : '+_cmNb(V-l)+' L · '+_cmV1((V-l)*100/V)+' %'):''); }
    if(go){ go.disabled=!!e; go.textContent=p?('Rassembler dans '+(p.nom||'la cuve')):'Rassembler dans la cuve'; }
  };
  var el=document.getElementById('ms-l'); if(el) el.addEventListener('input', maj); maj();
}
function _msErreur(c, p, l){
  if(!p) return 'Choisissez la cuve.';
  if(!(l>0)) return 'Indiquez le volume mesuré dans la cuve.';
  var cap=parseFloat(p.litres)||0;
  if(cap>0&&l>cap) return (p.nom||'La cuve')+' ne contient que '+_cmNb(cap)+' L.';
  var V=_cmVolL(c);
  if(V>0&&l>V*1.05) return 'Plus de 5 % au-dessus du volume de la cuvée ('+_cmNb(V)+' L) : vérifiez la mesure.';
  var x=_msCuves(c).filter(function(y){ return y.p.id===p.id; })[0];
  if(x&&x.occ) return (p.nom||'La cuve')+' est prise : '+(x.occ.nom||'')+'.';
  return null;
}
function _msVers(ref){ if(!_msEt) return; var l=_cmVal('ms-l'), d=_cmVal('ms-d'); _msEt.vers=ref; _msRendre(); var a=document.getElementById('ms-l'); if(a&&l){ a.value=l; a.dispatchEvent(new Event('input')); } var b=document.getElementById('ms-d'); if(b&&d) b.value=d; }
function saveMasse(){
  if(!_msEt||!_cmGarde()) return;
  var c=_cmCuvee(_msEt.id); if(!c) return;
  var p=window._caveCuve&&window._caveCuve(_msEt.vers), l=_cmNum('ms-l'), d=_cmVal('ms-d')||_cmAuj();
  var e=_msErreur(c, p, l); if(e){ showToast(e,'#B85A1A'); return; }   // ⚠ AVANT toute écriture
  var V=_cmVolL(c), nf=_cmNbFuts(c), L=Math.round(l), rendus=0;
  if(typeof window._mvFutLiberer==='function'&&window.INTRANTS){
    rendus=window._mvFutLiberer(c, window.INTRANTS, 'Mise en masse — '+_cmNom(c), 'masse');
    if(rendus&&typeof window.saveIntrants==='function') window.saveIntrants();
  }
  c.tonneaux=[]; c.nb_tonneaux=0; delete c.manque_l;
  c.cuves=[{ref:p.id, litres:L}];
  c.last_masse=d;
  var E=_cmCE(); if(!Array.isArray(E.operations)) E.operations=[];
  E.operations.push({id:'op_'+Date.now(), type:'soutirage', date:d, cuvee_id:c.id, cuvees_ids:[c.id], operateur:_cmQui(), intervenants:[], notes:'',
    data:{note:'Mise en masse', masse:{futs:nf, de_l:V, vers:p.id, vers_nom:p.nom||'', l:L, perte_l:V-L}}});
  _msEt=null; _cmFermer();
  _cmEnreg('« '+_cmNom(c)+' » rassemblée dans '+(p.nom||'la cuve')+(rendus?' — '+rendus+' fût'+(rendus>1?'s':'')+' de retour au parc':''));
  _cmRepeindre();
}

/* ═══ ★ MISE-1 / MISE-2 — PRÉPARER LA MISE, METTRE EN BOUTEILLE ═════════════════════════════════════════════════
   cuvee.mise_prev = { date, par:'dom'|'cam', fmt:{'75','150','37.5'}, ms:{rôle:id produit}, carton:6|12, chk:{k:{par,le}} }
   cuvee.mises     = [{ id, date, lot, par, fmt, l, ctrl:{so2l,co2,o2,tart,prot}, ms:[{role,prod,q}], final, reste_l, op }]
   cuvee.stock_fmt = { '75':n, '150':n, '37.5':n } — en stock, corrigeable ; nb_bouteilles en est l'équivalent 75 cl
   (la chaîne de volume, le bilan et le Pilotage lisent nb_bouteilles en 75 cl depuis toujours). */
var _CM_FMT=[['75',0.75,'Bouteille 75 cl','bouteilles'],['150',1.5,'Magnum 150 cl','magnums'],['37.5',0.375,'Demie 37,5 cl','demies']];
var _CM_ROLES=[['bt75','Bouteilles 75 cl'],['bt150','Magnums'],['bt375','Demies'],['bouchon','Bouchons'],['capsule','Capsules'],['etiq','Étiquettes'],['cetiq','Contre-étiquettes'],['carton','Cartons']];
var _CM_DEVINE={bt150:/magnum|150/i, bt375:/demi|37[,.]?5/i, bouchon:/bouchon/i, capsule:/capsule|coiffe/i, cetiq:/contre/i, carton:/carton|caisse/i};
function _cmDevine(k, nom){
  nom=String(nom||'');
  if(k==='bt75') return /bouteille|bourguignonne|bordelaise|flacon/i.test(nom)&&!/magnum|demi|150|37[,.]?5/i.test(nom);
  if(k==='etiq') return /étiquette|etiquette/i.test(nom)&&!/contre/i.test(nom);
  return !!(_CM_DEVINE[k]&&_CM_DEVINE[k].test(nom));
}
function _cmFmtL(f){ return _CM_FMT.reduce(function(s,x){ return s+(parseInt(f&&f[x[0]],10)||0)*x[1]; },0); }
function _cmFmtN(f){ return _CM_FMT.reduce(function(s,x){ return s+(parseInt(f&&f[x[0]],10)||0); },0); }
function _cmFmtTxt(f){ return _CM_FMT.filter(function(x){ return parseInt(f&&f[x[0]],10)>0; }).map(function(x){ return _cmNb(f[x[0]])+' × '+x[0].replace('.',',')+' cl'; }).join(' · '); }
function _cmProduitsCave(){ return ((window.INTRANTS&&window.INTRANTS.produits)||[]).filter(function(p){ return p&&p.id&&p.cat==='cave'; }); }
function _cmStock(pid){ var s=(typeof window._rsvStockPour==='function')?window._rsvStockPour(pid):null; return s?s.q:null; }
/* Les besoins d'une mise en matières sèches, d'après ses formats : une bouteille = un bouchon, une capsule, une étiquette,
   une contre-étiquette ; un carton pour 6 ou 12 bouteilles de 75 cl. */
function _cmBesoins(f, parCarton){
  var n75=parseInt(f&&f['75'],10)||0, n150=parseInt(f&&f['150'],10)||0, n37=parseInt(f&&f['37.5'],10)||0, n=n75+n150+n37;
  return {bt75:n75, bt150:n150, bt375:n37, bouchon:n, capsule:n, etiq:n, cetiq:n, carton:n75?Math.ceil(n75/(parCarton===12?12:6)):0};
}
/* Le produit d'un rôle : celui choisi pour cette mise, sinon le dernier du domaine, sinon deviné par son nom. */
function _cmMsDefaut(c){
  var P=_cmProduitsCave(), dom=((window.CONFIG||{}).cave||{}).mise_ms||{}, prev=(c&&c.mise_prev&&c.mise_prev.ms)||{}, out={};
  _CM_ROLES.forEach(function(r){
    var k=r[0], id=prev[k]!=null?prev[k]:dom[k];
    if(id&&P.some(function(p){ return p.id===id; })){ out[k]=id; return; }
    if(id==='') { out[k]=''; return; }
    var g=P.filter(function(p){ return _cmDevine(k, p.nom); });
    out[k]=g.length===1?g[0].id:'';
  });
  return out;
}
function _cmMsHtml(f, ms, parCarton, avecQ){
  var P=_cmProduitsCave(), B=_cmBesoins(f, parCarton);
  if(!P.length) return '<div class="mvv-fnote">Aucune fourniture de cave dans La Réserve. Ajoutez bouteilles, bouchons, capsules, étiquettes et cartons (catégorie « Fournitures cave ») pour les voir sortir à la mise.</div>';
  return '<div class="cm-ls cm-ms">'+_CM_ROLES.filter(function(r){ return B[r[0]]>0||(ms[r[0]]&&r[0].indexOf('bt')!==0); }).map(function(r){
    var k=r[0], id=ms[k]||'', b=B[k], st=id?_cmStock(id):null, manque=(id&&st!=null&&st<b)?Math.ceil(b-st):0;
    return '<div class="cm-l" style="flex-wrap:wrap"><span style="flex:1;min-width:130px"><b>'+r[1]+'</b><span class="cm-s'+(manque?' cm-manque':'')+'">'
      +(id?(st==null?'stock inconnu':(manque?('il en manque '+_cmNb(manque)+' (stock '+_cmNb(st)+')'):('stock '+_cmNb(st)+' · reste '+_cmNb(st-b)))):'aucun produit choisi')+'</span></span>'
      +'<select data-role="'+k+'" onchange="_cmMsChoix(this.dataset.role,this.value)" aria-label="'+_escAttr(r[1])+'"><option value="">—</option>'+P.map(function(p){ return '<option value="'+_escAttr(p.id)+'"'+(p.id===id?' selected':'')+'>'+_escHtml(p.nom||'')+'</option>'; }).join('')+'</select>'
      +(avecQ?'<input class="cm-q" type="text" inputmode="numeric" data-q="'+k+'" value="'+b+'" oninput="_cmQMan(this)" aria-label="Quantité">':'<span class="cm-r"><b>'+_cmNb(b)+'</b></span>')+'</div>';
  }).join('')+'</div>'
  +'<div class="mvv-fnote">Cartons de <button type="button" class="mvv-optab'+(parCarton!==12?' on':'')+'" style="display:inline-block;min-height:30px;padding:3px 10px" onclick="_cmCarton(6)">6</button> <button type="button" class="mvv-optab'+(parCarton===12?' on':'')+'" style="display:inline-block;min-height:30px;padding:3px 10px" onclick="_cmCarton(12)">12</button> bouteilles de 75 cl.</div>';
}
/* L'allergène d'un collage, suivi jusqu'à la mise : la mention est due à l'étiquette quand il en reste dans le vin. */
function _cmAllergenes(c){
  var out={};
  _cmOps(c).forEach(function(o){
    if(o.type!=='traitement'||!o.data) return;
    var a=o.data.allergene||((o.data.nature==='col')?_cmAllergeneDe(o.data.produit||''):null);
    if(a) (out[a]=out[a]||[]).push((o.data.produit||'collage')+', '+_cmFr(o.date));
  });
  return out;
}
function _cmAllergeneDe(nom){ nom=String(nom||''); if(/cas[ée]in|lait|lacto/i.test(nom)) return 'lait'; if(/albumin|ovalb|œuf|oeuf|lysozym/i.test(nom)) return 'oeuf'; return null; }
var _CM_ALL={lait:'lait', oeuf:'œuf'};
function _cmAllergenesHtml(c){
  var A=_cmAllergenes(c), k=Object.keys(A);
  if(!k.length) return '';
  return '<div class="mvencadre mvencadre-attention" style="margin-top:10px">À l’étiquette : <b>'+k.map(function(x){ return _CM_ALL[x]; }).join(' et ')+'</b> — '+_escHtml(k.map(function(x){ return A[x].join(' ; '); }).join(' ; '))+'. La mention est due quand il en reste dans le vin.</div>';
}

/* — Le compte à rebours : chaque contrôle avec son repère (J-28, J-21…), coché tout seul par ce que l'appli sait déjà. — */
function _cmChecks(c, date, live){
  var ops=_cmOps(c), A=(_cmCE().analyses||[]).filter(function(a){ return a&&(a.cuvee_ids||[]).indexOf(c.id)>=0; });
  var de=_cmAddJ(date,-60), k=_cmCoul(c), chk=(c.mise_prev&&c.mise_prev.chk)||{};
  function dans(o,a,b){ var d=String(o.date||o.date_analyse||'').slice(0,10); return d&&d>=a&&d<=b; }
  function der(l){ return l.slice().sort(function(a,b){ return String(b.date||b.date_analyse).localeCompare(String(a.date||a.date_analyse)); })[0]; }
  var L=[];
  var an=der(A.filter(function(a){ return dans(a,de,date); }).concat(ops.filter(function(o){ return o.type==='analyse'&&dans(o,de,date); })));
  L.push({k:'ana', t:'Analyse complète', j:28, auto:!!an, info:an?('du '+_cmFr(an.date_analyse||an.date)):'', aide:'TAV, sucres, acidité volatile, acidité totale, pH, SO₂, malique'});
  var col=der(ops.filter(function(o){ return o.type==='traitement'&&o.data&&o.data.nature==='col'; }));
  if(col){
    L.push({k:'coll', t:'Collage', j:null, auto:true, info:(col.data.produit||'fait')+', '+_cmFr(col.date)});
    var so=ops.filter(function(o){ return o.type==='soutirage'&&String(o.date)>=String(col.date)&&o.id!==col.id; });
    L.push({k:'scoll', t:'Soutirer après le collage', j:null, due:col.data.rappel_sout||_cmAddJ(col.date,10), auto:!!so.length, info:so.length?('le '+_cmFr(der(so).date)):''});
  } else L.push({k:'coll', t:'Collage', j:null, auto:false, aide:'selon la dégustation ; cochez s’il n’en faut pas'});
  if(k!=='r'){
    var pr=ops.filter(function(o){ return o.type==='traitement'&&o.data&&((o.data.stab&&o.data.stab.quoi==='prot')||/bento/i.test(o.data.produit||'')); });
    L.push({k:'prot', t:'Stabilité protéique', j:14, auto:!!pr.length, info:pr.length?_cmFr(der(pr).date):'', aide:'test à chaud (80 °C, 30 min)'});
  }
  var ta=ops.filter(function(o){ return o.type==='traitement'&&o.data&&o.data.stab&&o.data.stab.quoi==='tart'; });
  L.push({k:'tart', t:'Stabilité tartrique', j:14, auto:!!ta.length, info:ta.length?_cmFr(der(ta).date):'', aide:'test au froid ou mini-contact'});
  var s2=ops.filter(function(o){ return (o.type==='soufre'||(o.type==='soutirage'&&o.data&&o.data.so2))&&dans(o,_cmAddJ(date,-30),date); });
  L.push({k:'so2', t:'SO₂ ajusté', j:21, auto:!!s2.length, info:s2.length?_cmFr(der(s2).date):'', aide:'environ trois semaines avant la mise'});
  var fi=ops.filter(function(o){ return o.type==='filtration'&&dans(o,_cmAddJ(date,-30),date); });
  L.push({k:'filt', t:'Filtration', j:3, auto:!!fi.length, info:fi.length?_cmFr(der(fi).date):''});
  var fut=_cmNbFuts(c)>0;
  L.push({k:'masse', t:'Mise en masse', j:2, auto:!fut, info:fut?'':'en cuve', aide:fut?'des fûts vers une cuve':''});
  L.push({k:'gaz', t:'CO₂ et oxygène', j:1, auto:false, aide:'CO₂ visé : '+(k==='r'?'450 à 500 mg/L':(k==='b'?'800 à 900 mg/L':'selon le vin'))});
  var P=live||(c.mise_prev||{}), ms=(live&&live.ms)||_cmMsDefaut(c), B=_cmBesoins(P.fmt||{}, P.carton), manque=[];
  Object.keys(B).forEach(function(r){ if(B[r]>0&&ms[r]){ var st=_cmStock(ms[r]); if(st!=null&&st<B[r]) manque.push(r); } });
  var choisi=Object.keys(B).some(function(r){ return B[r]>0&&ms[r]; });
  L.push({k:'ms', t:'Matières sèches', j:7, auto:choisi&&!manque.length, info:choisi?(manque.length?'':'face au stock'):'', aide:manque.length?('il en manque : '+manque.map(function(r){ return _CM_ROLES.filter(function(x){ return x[0]===r; })[0][1].toLowerCase(); }).join(', ')):'formats et produits à choisir', manque:manque.length>0});
  var auj=_cmAuj();
  L.forEach(function(x){
    if(!x.due&&x.j!=null) x.due=_cmAddJ(date,-x.j);
    x.coche=!x.auto&&!x.manque&&!!chk[x.k];
    x.fait=x.auto||x.coche;
    x.retard=!x.fait&&x.due&&x.due<auj;
  });
  return L;
}
function _cmChkHtml(c, L, ed){
  var auj=_cmAuj();
  return '<div class="cm-ls">'+L.map(function(x){
    var cls=x.fait?'ok':(x.retard?'ret':''), quand=x.due?((x.j!=null?'J-'+x.j+' · ':'')+(x.due===auj?'aujourd’hui':'le '+_cmFr(x.due))):'';
    var s=x.fait?(x.auto?(x.info||'fait')+' · vu par l’appli':'coché'+(x.info?' · '+x.info:'')):((x.retard?'en retard · ':'')+[quand,x.aide].filter(Boolean).join(' · '));
    var droite=x.auto?'':(ed&&!x.manque?'<span class="cm-r">'+(x.coche?'✓':'cocher')+'</span>':'');
    var act=(ed&&!x.auto&&!x.manque)?' data-k="'+x.k+'" onclick="_cmCocher(this.dataset.k)" style="cursor:pointer"':'';
    return '<div class="cm-l"'+act+'><span class="cm-d '+cls+'"></span><span style="flex:1"><b style="font-weight:'+(x.fait?500:600)+'">'+_escHtml(x.t)+'</b><span class="cm-s'+(x.manque?' cm-manque':'')+'">'+_escHtml(s)+'</span></span>'+droite+'</div>';
  }).join('')+'</div>';
}

/* — Prévoir la mise — */
var _mpEt=null;   // {id, fmt, ms, carton, date, par}
function openMisePrev(id){
  if(!_cmGarde()) return;
  var c=_cmCuvee(id); if(!c){ showToast('Cuvée introuvable','#B85A1A'); return; }
  var P=c.mise_prev||{}, V=_cmVolL(c);
  _miEt=null;
  _mpEt={id:id, date:P.date||_cmAddJ(_cmAuj(),28), par:P.par||'dom', fmt:Object.assign({'75':Math.floor(V/0.75*0.98),'150':0,'37.5':0}, P.fmt||{}), ms:_cmMsDefaut(c), carton:P.carton===12?12:6};
  _mpRendre();
}
function _mpRendre(){
  var E=_mpEt, c=E&&_cmCuvee(E.id); if(!c) return;
  var V=_cmVolL(c), Lm=_cmFmtL(E.fmt);
  var h=_cmTete('Préparer la mise', _escHtml(_cmNom(c))+' · '+_escHtml((typeof window._caveContenantsStr==='function'?window._caveContenantsStr(c):''))+' · '+_cmHl(V)+' hL');
  h+='<div style="display:flex;gap:9px"><div style="flex:1"><label class="mvv-flbl">Date de mise</label><input id="mp-d" class="mvv-tin" type="date" data-tuto="mise.date" value="'+_escAttr(E.date)+'" onchange="_mpDate(this.value)"></div>'
    +'<div style="flex:1.3"><label class="mvv-flbl">Par</label><div class="mvv-optabs">'+[['dom','Le domaine'],['cam','Camion de mise']].map(function(x){ return '<button type="button" class="mvv-optab'+(E.par===x[0]?' on':'')+'" data-p="'+x[0]+'" onclick="_mpPar(this.dataset.p)">'+x[1]+'</button>'; }).join('')+'</div></div></div>';
  h+='<label class="mvv-flbl">Le compte à rebours</label>'+_cmChkHtml(c, _cmChecks(c, E.date, E), true)
    +'<div class="mvv-fnote">Les repères (J-28, J-21…) sont ceux de la préparation d’une mise. Ce que l’appli sait (labo, opérations) se coche tout seul ; le reste se coche ici.</div>';
  h+='<label class="mvv-flbl">Formats prévus</label><table class="cm-fm">'+_CM_FMT.map(function(x){ return '<tr><td>'+x[2]+'</td><td style="text-align:right"><input data-fmt="'+x[0]+'" type="text" inputmode="numeric" value="'+(parseInt(E.fmt[x[0]],10)||0)+'" oninput="_mpFmt(this.dataset.fmt,this.value)"></td></tr>'; }).join('')+'</table>'
    +'<div class="mvv-fnote" id="mp-vol">'+_cmHl(Lm)+' hL prévus sur '+_cmHl(V)+' hL.</div>';
  h+='<label class="mvv-flbl">Matières sèches <span class="mvv-fhint">— face au stock de La Réserve</span></label>'+_cmMsHtml(E.fmt, E.ms, E.carton, false);
  h+=_cmAllergenesHtml(c);
  h+='<button class="mvv-save" style="margin-top:16px" data-tuto="mise.prev.ok" onclick="saveMisePrev()">Enregistrer la préparation</button>'
    +(c.mise_prev&&c.mise_prev.date?'<button class="mvbtn mvbtn-discret" style="width:100%;margin-top:8px" onclick="_mpRetirer()">Retirer la date de mise</button>':'');
  _cmFeuille(h);
}
function _mpGarder(){ if(!_mpEt) return; var d=_cmVal('mp-d'); if(d) _mpEt.date=d; }
function _mpDate(v){ if(!_mpEt||!v) return; _mpEt.date=v; _mpRendre(); }
function _mpPar(p){ if(!_mpEt) return; _mpGarder(); _mpEt.par=(p==='cam')?'cam':'dom'; _mpRendre(); }
function _mpFmt(k, v){ if(!_mpEt) return; _mpEt.fmt[k]=Math.max(0, parseInt(String(v).replace(/\D/g,''),10)||0); var c=_cmCuvee(_mpEt.id), n=document.getElementById('mp-vol'); if(n&&c) n.textContent=_cmHl(_cmFmtL(_mpEt.fmt))+' hL prévus sur '+_cmHl(_cmVolL(c))+' hL.'; }
function _cmMsChoix(role, v){
  var E=_mpEt||_miEt; if(!E) return;
  if(_miEt) _miGarder(); else _mpGarder();
  E.ms[role]=v||''; if(_miEt) _miRendre(); else _mpRendre();
}
function _cmCarton(n){ var E=_mpEt||_miEt; if(!E) return; if(_miEt) _miGarder(); else _mpGarder(); E.carton=(n===12)?12:6; if(_miEt) _miRendre(); else _mpRendre(); }
function _cmCocher(k){
  var c=_mpEt&&_cmCuvee(_mpEt.id); if(!c||!_cmGarde()) return;
  _mpGarder();
  var P=c.mise_prev=c.mise_prev||{}; P.chk=P.chk||{};
  if(P.chk[k]) delete P.chk[k]; else P.chk[k]={par:_cmQui(), le:_cmAuj()};
  _mpRendre();
}
function _cmMsDomaine(ms){
  if(!isAdmin()) return;   // la configuration du domaine ne s'écrit que par l'administrateur
  var cfg=window.CONFIG=window.CONFIG||{}; cfg.cave=Object.assign({}, cfg.cave||{}, {mise_ms:Object.assign({}, (cfg.cave||{}).mise_ms||{}, ms)});
  if(typeof window.saveData==='function') window.saveData('config');
}
function saveMisePrev(){
  if(!_mpEt||!_cmGarde()) return;
  _mpGarder();
  var c=_cmCuvee(_mpEt.id); if(!c) return;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(_mpEt.date)){ showToast('Indiquez la date de mise','#B85A1A'); return; }
  if(!(_cmFmtN(_mpEt.fmt)>0)){ showToast('Indiquez au moins un format','#B85A1A'); return; }
  var chk=(c.mise_prev&&c.mise_prev.chk)||{};
  c.mise_prev={date:_mpEt.date, par:_mpEt.par, fmt:_mpEt.fmt, ms:_mpEt.ms, carton:_mpEt.carton, chk:chk, par_qui:_cmQui(), le:_cmAuj()};
  _cmMsDomaine(_mpEt.ms);
  _mpEt=null; _cmFermer();
  _cmEnreg('Mise de « '+_cmNom(c)+' » prévue le '+_cmFr(c.mise_prev.date));
  _cmRepeindre();
}
function _mpRetirer(){
  var c=_mpEt&&_cmCuvee(_mpEt.id); if(!c||!_cmGarde()) return;
  delete c.mise_prev; _mpEt=null; _cmFermer();
  _cmEnreg('Date de mise retirée'); _cmRepeindre();
}

/* — Mettre en bouteille — */
var _miEt=null;   // {id, fmt, ms, carton, par, fin:'reste'|'vide'}
function _miLotDefaut(c){
  var y=String((c&&c.millesime)||new Date().getFullYear()).slice(-2);
  var ini=String((c&&c.nom)||'').split(/[\s\u0027\u2019-]+/).filter(function(w){ return w&&/^[A-Za-zÀ-ÿ]/.test(w)&&w.length>2; }).map(function(w){ return w.charAt(0).toUpperCase(); }).join('').slice(0,3)||'C';
  return 'L'+y+ini+(((c&&c.mises)||[]).length+1);
}
function openMise(id){
  if(!_cmGarde()) return;
  var c=_cmCuvee(id); if(!c){ showToast('Cuvée introuvable','#B85A1A'); return; }
  if(c.statut==='embouteille'){ showToast('« '+_cmNom(c)+' » est déjà en bouteille','#B85A1A'); return; }
  var P=c.mise_prev||{}, V=_cmVolL(c);
  _mpEt=null;
  _miEt={id:id, par:P.par||'dom', fmt:Object.assign({'75':Math.floor(V/0.75*0.98),'150':0,'37.5':0}, P.fmt||{}), ms:_cmMsDefaut(c), carton:P.carton===12?12:6, fin:null, garde:{}};
  _miEt.prop75=_miEt.fmt['75'];   // la proposition de départ : un tuto ne compte « tapé » qu'un nombre qui en diffère
  _miRendre();
}
function _miGarder(){ if(!_miEt) return; ['mi-d','mi-lot','mi-so2','mi-co2','mi-o2','mi-tart','mi-prot'].forEach(function(id){ var el=document.getElementById(id); if(el) _miEt.garde[id]=el.value; }); }
function _miRemettre(){ if(!_miEt) return; Object.keys(_miEt.garde).forEach(function(id){ var el=document.getElementById(id); if(el&&_miEt.garde[id]!=null) el.value=_miEt.garde[id]; }); }
function _miFin(c, L){
  if(_miEt.fin) return _miEt.fin;
  var V=_cmVolL(c), r=V-L;
  return (_cmNbFuts(c)>0||r<=Math.max(50, V*0.05))?'vide':'reste';
}
function _miRendre(){
  var E=_miEt, c=E&&_cmCuvee(E.id); if(!c) return;
  var V=_cmVolL(c), L=_cmFmtL(E.fmt), N=_cmFmtN(E.fmt), reste=V-L, fut=_cmNbFuts(c)>0, fin=_miFin(c, L);
  var tests=function(id,lbl){ return '<div style="flex:1"><label class="mvv-flbl">'+lbl+'</label><select class="mvv-tin" id="'+id+'"><option value="">Non fait</option><option value="stable">Stable</option><option value="instable">Instable</option></select></div>'; };
  var h=_cmTete('Mettre en bouteille', _escHtml(_cmNom(c))+' · '+_escHtml((typeof window._caveContenantsStr==='function'?window._caveContenantsStr(c):''))+' · '+_cmHl(V)+' hL');
  if(fut) h+='<div class="mvencadre" style="margin-bottom:6px">En fûts, la mise se fait en une fois : les fûts reviennent au parc. Pour mettre en plusieurs fois, faites d’abord la <button type="button" class="mvbtn mvbtn-discret mvbtn-compact" data-id="'+_escAttr(c.id)+'" onclick="openMasse(this.dataset.id)">mise en masse</button>.</div>';
  h+='<div style="display:flex;gap:9px"><div style="flex:1"><label class="mvv-flbl">Date</label><input id="mi-d" class="mvv-tin" type="date" value="'+_escAttr(_cmAuj())+'"></div>'
    +'<div style="flex:1"><label class="mvv-flbl">N° de lot</label><input id="mi-lot" class="mvv-tin" type="text" data-tuto="mise.lot" value="'+_escAttr(_miLotDefaut(c))+'" maxlength="24"></div></div>'
    +'<label class="mvv-flbl">Par</label><div class="mvv-optabs">'+[['dom','Le domaine'],['cam','Camion de mise']].map(function(x){ return '<button type="button" class="mvv-optab'+(E.par===x[0]?' on':'')+'" data-p="'+x[0]+'" onclick="_miPar(this.dataset.p)">'+x[1]+'</button>'; }).join('')+'</div>';
  h+='<label class="mvv-flbl">Formats</label><table class="cm-fm">'+_CM_FMT.map(function(x){ return '<tr><td>'+x[2]+'</td><td style="text-align:right"><input data-fmt="'+x[0]+'" type="text" inputmode="numeric" '+(x[0]==='75'?'data-tuto="mise.n75" data-prop="'+(parseInt(E.prop75,10)||0)+'"':'')+' value="'+(parseInt(E.fmt[x[0]],10)||0)+'" oninput="_miFmtLive(this.dataset.fmt,this.value)" onchange="_miFmt(this.dataset.fmt,this.value)"></td></tr>'; }).join('')+'</table>'
    +'<div class="cm-res"><div><b id="mi-n">'+_cmNb(N)+'</b><span>cols</span></div><div><b id="mi-l">'+_cmHl(L)+' hL</b><span>mis en bouteille</span></div><div><b id="mi-r" class="'+(reste<0?'neg':'')+'">'+_cmNb(reste)+' L</b><span>'+(fin==='reste'?'restent en cuve':'lies, pertes')+'</span></div></div>';
  if(!fut&&reste>0) h+='<label class="mvv-flbl">Ce qui reste</label><div class="mvv-optabs">'
    +'<button type="button" class="mvv-optab'+(fin==='reste'?' on':'')+'" onclick="_miFinSet(\'reste\')">Reste en cuve, pour une autre mise</button>'
    +'<button type="button" class="mvv-optab'+(fin==='vide'?' on':'')+'" onclick="_miFinSet(\'vide\')">Lies et pertes : la cuve est vide</button></div>';
  h+='<label class="mvv-flbl">Contrôles à la mise <span class="mvv-fhint">(facultatifs)</span></label>'
    +'<div style="display:flex;gap:8px">'+[['mi-so2','SO₂ libre'],['mi-co2','CO₂'],['mi-o2','Oxygène']].map(function(x){ return '<div style="flex:1"><div class="mvv-fhint">'+x[1]+'</div><input id="'+x[0]+'" class="mvv-tin" type="text" inputmode="decimal" placeholder="mg/L"></div>'; }).join('')+'</div>'
    +'<div style="display:flex;gap:8px">'+tests('mi-tart','Test tartrique')+tests('mi-prot','Test protéique')+'</div>';
  h+='<label class="mvv-flbl">Matières sèches qui sortent de La Réserve</label>'+_cmMsHtml(E.fmt, E.ms, E.carton, true);
  h+=_cmAllergenesHtml(c);
  h+='<div class="mvv-fnote">'+(fin==='reste'?'Il reste <b>'+_cmNb(reste)+' L</b> en cuve : la cuvée reste au Chai pour une autre mise.':'La cuvée passe en stock ; '+(fut?'ses fûts reviennent au parc.':'sa cuve redevient libre.'))+'</div>'
    +'<button class="mvv-save" style="margin-top:14px" id="mi-go" data-tuto="mise.ok" onclick="saveMise()">Mettre en bouteille · '+_cmNb(N)+' cols</button>';
  _cmFeuille(h); _miRemettre();
}
function _miPar(p){ if(!_miEt) return; _miGarder(); _miEt.par=(p==='cam')?'cam':'dom'; _miRendre(); }
function _miFmt(k, v){ if(!_miEt) return; _miGarder(); _miEt.fmt[k]=Math.max(0, parseInt(String(v).replace(/\D/g,''),10)||0); _miRendre(); }
function _miFmtLive(k, v){
  var E=_miEt, c=E&&_cmCuvee(E.id); if(!c) return;
  E.fmt[k]=Math.max(0, parseInt(String(v).replace(/\D/g,''),10)||0);
  var V=_cmVolL(c), L=_cmFmtL(E.fmt), N=_cmFmtN(E.fmt), B=_cmBesoins(E.fmt, E.carton);
  var t=function(id,x){ var el=document.getElementById(id); if(el) el.textContent=x; };
  t('mi-n', _cmNb(N)); t('mi-l', _cmHl(L)+' hL'); t('mi-r', _cmNb(V-L)+' L'); t('mi-go', 'Mettre en bouteille · '+_cmNb(N)+' cols');
  var r=document.getElementById('mi-r'); if(r) r.classList.toggle('neg', V-L<0);
  document.querySelectorAll('[data-q]').forEach(function(el){ if(!el.dataset.man&&B[el.dataset.q]!=null) el.value=B[el.dataset.q]; });   // les quantités qu'on n'a pas touchées suivent
}
function _cmQMan(el){ if(el) el.dataset.man='1'; }   // une quantité corrigée à la main ne suit plus les formats
function _miFinSet(f){ if(!_miEt) return; _miGarder(); _miEt.fin=(f==='reste')?'reste':'vide'; _miRendre(); }
function saveMise(){
  if(!_miEt||!_cmGarde()) return;
  var c=_cmCuvee(_miEt.id); if(!c) return;
  var V=_cmVolL(c), F=_miEt.fmt, L=_cmFmtL(F), N=_cmFmtN(F), d=_cmVal('mi-d')||_cmAuj(), lot=_cmVal('mi-lot');
  if(!(N>0)){ showToast('Indiquez le nombre de bouteilles','#B85A1A'); return; }   // ⚠ AVANT toute écriture
  if(V>0&&L>V*1.05){ showToast('Plus de vin que la cuvée n’en a ('+_cmNb(V)+' L) : vérifiez les formats','#B85A1A'); return; }
  if(!lot){ showToast('Indiquez le n° de lot','#B85A1A'); return; }
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)){ showToast('Date de mise invalide','#B85A1A'); return; }
  var fut=_cmNbFuts(c)>0, fin=fut?'vide':_miFin(c, L);
  var ms=[];
  _CM_ROLES.forEach(function(r){
    var k=r[0], pid=_miEt.ms[k]; if(!pid) return;
    var el=document.querySelector('[data-q="'+k+'"]'), q=el?parseInt(String(el.value).replace(/\D/g,''),10):_cmBesoins(F,_miEt.carton)[k];
    if(q>0) ms.push({role:k, prod:pid, q:q});
  });
  var ctrl={};
  [['so2l','mi-so2'],['co2','mi-co2'],['o2','mi-o2']].forEach(function(x){ var v=_cmNum(x[1]); if(v!=null&&v>=0) ctrl[x[0]]=v; });
  ['tart','prot'].forEach(function(t){ var v=_cmVal('mi-'+t); if(v==='stable'||v==='instable') ctrl[t]=v; });
  var rec={id:'mis_'+Date.now(), date:d, lot:lot, par:_miEt.par, fmt:{'75':parseInt(F['75'],10)||0,'150':parseInt(F['150'],10)||0,'37.5':parseInt(F['37.5'],10)||0}, l:Math.round(L), ctrl:ctrl, ms:ms, final:fin==='vide', par_qui:_cmQui()};
  var ch=(typeof window._caveBilanChaine==='function')?window._caveBilanChaine(c):null;
  // ── écriture ──
  if(fin==='reste'){
    var r=Math.max(0, Math.round(V-L)), cu=(c.cuves||[]).filter(function(x){ return x&&parseFloat(x.litres)>0; });
    var tot=cu.reduce(function(s,x){ return s+(parseFloat(x.litres)||0); },0);
    cu.forEach(function(x){ x.litres=Math.round((parseFloat(x.litres)||0)*r/(tot||1)); });
    rec.reste_l=r;
  } else {
    var rendus=0;
    if(typeof window._mvFutLiberer==='function'&&window.INTRANTS){ rendus=window._mvFutLiberer(c, window.INTRANTS); if(rendus&&typeof window.saveIntrants==='function') window.saveIntrants(); }
    rec.futs_rendus=rendus;
  }
  if(!Array.isArray(c.mises)) c.mises=[];
  c.mises.push(rec);
  var S=c.stock_fmt=c.stock_fmt||{};
  _CM_FMT.forEach(function(x){ S[x[0]]=(parseInt(S[x[0]],10)||0)+rec.fmt[x[0]]; });
  _cmStockNb(c);
  if(ctrl.o2!=null) c.mise_o2=ctrl.o2; if(ctrl.tart) c.mise_tart=ctrl.tart; if(ctrl.prot) c.mise_prot=ctrl.prot;   // DIAG-5 (§433) : lus par le diagnostic
  if(rec.final){
    c.statut='embouteille'; c.date_embouteillage=d;
    if(ch) c.bilan_perte={recolteKg:ch.recolteKg, estHl:ch.estHl, entonneHl:ch.entonneHl, entonneSrc:ch.entonneSrc, eleveHl:V/100};
  }
  if(c.mise_prev) delete c.mise_prev;   // la préparation est consommée par la mise ; la suivante se prépare à nouveau
  var E=_cmCE(); if(!Array.isArray(E.operations)) E.operations=[];
  var op={id:'op_'+Date.now(), type:'miseenbouteille', date:d, cuvee_id:c.id, cuvees_ids:[c.id], operateur:_cmQui(), intervenants:[], notes:'', data:{mise_id:rec.id, lot:lot, l:rec.l, fmt:rec.fmt, final:rec.final}};
  E.operations.push(op); rec.op=op.id;
  if(isAdmin()) _cmMsDomaine(_miEt.ms);
  _miEt=null; _cmFermer();
  _cmEnreg('« '+_cmNom(c)+' » : '+_cmNb(_cmFmtN(rec.fmt))+' cols, lot '+lot+(rec.final?'':' — '+_cmNb(rec.reste_l)+' L restent en cuve'));
  _cmRepeindre();
}
/* nb_bouteilles : l'équivalent 75 cl du stock par format (la chaîne de volume et le bilan le lisent en 75 cl). */
function _cmStockNb(c){ var S=c.stock_fmt||{}; c.nb_bouteilles=Math.round(_CM_FMT.reduce(function(s,x){ return s+(parseInt(S[x[0]],10)||0)*x[1]; },0)/0.75); }
/* Annuler la DERNIÈRE mise d'une cuvée : son vin revient dans sa cuve (si elle est encore à elle ou libre), le stock
   par format la perd, ses matières sèches reviennent d'elles-mêmes (La Réserve les compte depuis les mises). Une mise
   finale remet la cuvée en élevage et reprend ses fûts au parc s'il les a encore. */
function _cmMiseAnnuler(id){
  if(!isAdmin()){ showToast('Réservé à l’administrateur','#B85A1A'); return; }
  var c=_cmCuvee(id); if(!c||!(c.mises&&c.mises.length)) return;
  var m=c.mises[c.mises.length-1], cu=(c.cuves||[]).filter(function(x){ return x&&x.ref; });
  if(m.final){   // ⚠ AVANT toute écriture : sa cuve doit être encore libre, ses fûts encore au parc
    for(var i=0;i<cu.length;i++){ var oc=(typeof window._caveCuveOcc==='function')?window._caveCuveOcc(cu[i].ref):null; if(oc){ showToast('Sa cuve est reprise ('+(oc.nom||'')+') : annulation impossible','#B85A1A'); return; } }
    if((c.tonneaux||[]).length&&typeof window._mvFutDispo==='function'&&window.INTRANTS){
      var dsp=window._mvFutDispo(c, window.INTRANTS);
      if(dsp.manque>0){ showToast('Ses fûts sont repartis ailleurs ('+dsp.manque+' manquent) : annulation impossible','#B85A1A'); return; }
    }
  }
  if(!window.confirm('Annuler la mise du '+_cmFr(m.date)+' (lot '+(m.lot||'?')+', '+_cmNb(_cmFmtN(m.fmt))+' cols) ?')) return;
  var S=c.stock_fmt=c.stock_fmt||{};
  _CM_FMT.forEach(function(x){ S[x[0]]=Math.max(0,(parseInt(S[x[0]],10)||0)-(parseInt(m.fmt&&m.fmt[x[0]],10)||0)); });
  _cmStockNb(c);
  if(!m.final&&m.reste_l>0){ var f=(m.reste_l+(m.l||0))/m.reste_l; cu.forEach(function(x){ x.litres=Math.round((parseFloat(x.litres)||0)*f); }); }
  if(m.final){
    if((c.tonneaux||[]).length&&typeof window._mvFutReprendre==='function'&&window.INTRANTS){ window._mvFutReprendre(c, window.INTRANTS, 'mise annulée — '+_cmNom(c)); if(typeof window.saveIntrants==='function') window.saveIntrants(); }
    c.statut='elevage'; delete c.date_embouteillage; delete c.bilan_perte;
  }
  c.mises.pop();
  var E=_cmCE(); E.operations=(E.operations||[]).filter(function(o){ return o&&o.id!==m.op; });
  _cmEnreg('Mise annulée'); _cmRepeindre();
}
function _cmStockCorriger(id, k, v){
  if(!_cmGarde()) return;
  var c=_cmCuvee(id); if(!c) return;
  c.stock_fmt=c.stock_fmt||{}; c.stock_fmt[k]=Math.max(0, parseInt(String(v).replace(/\D/g,''),10)||0);
  _cmStockNb(c); _cmEnreg('Stock corrigé'); _cmBouteilles();
}
/* Les sorties des mises pour un produit de La Réserve (lu par reserve.js/_conso, pour toute source de consommation). */
function _cmConsoMise(pid){
  var t=0;
  (_cmCE().cuvees||[]).forEach(function(c){ ((c&&c.mises)||[]).forEach(function(m){ ((m&&m.ms)||[]).forEach(function(x){ if(x&&x.prod===pid) t+=parseFloat(x.q)||0; }); }); });
  return t;
}

/* — L'onglet Bouteilles : « Mises à venir » en haut, puis ce qui est prêt, puis « En stock » par millésime. — */
function _cmBouteilles(){
  _cmCss();
  if(typeof window._caveV2InjectCss==='function') window._caveV2InjectCss();
  var el=document.getElementById('mvc-view-bouteille'); if(!el) return;
  var filtre=(typeof window._caveDansFiltre==='function')?window._caveDansFiltre:function(){ return true; };
  var cuvs=(_cmCE().cuvees||[]).filter(function(c){ return c&&filtre(c); });
  var act=cuvs.filter(function(c){ return c.statut!=='embouteille'; }), emb=cuvs.filter(function(c){ return c.statut==='embouteille'; });
  var w=canWrite()&&!isSaisonnier(), auj=_cmAuj();
  var prev=act.filter(function(c){ return c.mise_prev&&c.mise_prev.date; }).sort(function(a,b){ return a.mise_prev.date<b.mise_prev.date?-1:1; });
  var h='<div class="mvb-sec">Mises à venir'+(typeof window._mvInfoBtn==='function'?' '+window._mvInfoBtn('cave.btl'):'')+'</div>';
  if(!prev.length) h+='<div class="mvb-empty">Aucune date de mise. « Préparer la mise » sur une cuvée lance son compte à rebours.</div>';
  prev.forEach(function(c){
    var P=c.mise_prev, j=_cmEcart(auj,P.date), L=_cmChecks(c,P.date), nf=L.filter(function(x){ return x.fait; }).length, nr=L.filter(function(x){ return x.retard; }).length;
    h+='<div class="cm-carte"><div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><h4>'+_escHtml(_cmNom(c))+'</h4><span class="cm-r" style="text-align:right"><b>'+_cmFr(P.date)+'</b><br><span class="cm-s">'+(j>0?'dans '+j+' j':(j===0?'aujourd’hui':'il y a '+(-j)+' j'))+'</span></span></div>'
      +'<div class="cm-m">'+_escHtml((typeof window._caveContenantsStr==='function'?window._caveContenantsStr(c):''))+' · '+_cmHl(_cmVolL(c))+' hL · '+(P.par==='cam'?'camion de mise':'le domaine')+(_cmFmtN(P.fmt)?' · '+_escHtml(_cmFmtTxt(P.fmt)):'')+'</div>'
      +'<div style="margin-top:8px"><span class="cm-tag ok">'+nf+' / '+L.length+' prêts</span>'+(nr?' <span class="cm-tag al">'+nr+' en retard</span>':'')+(Object.keys(_cmAllergenes(c)).length?' <span class="cm-tag al">allergène à l’étiquette</span>':'')+'</div>'
      +(w?'<div class="cm-acts"><button type="button" class="mvbtn mvbtn-secondaire mvbtn-compact" data-id="'+_escAttr(c.id)+'" onclick="openMisePrev(this.dataset.id)">Préparer</button>'
        +'<button type="button" class="mvbtn mvbtn-principal mvbtn-compact" data-id="'+_escAttr(c.id)+'" data-tuto="btl.mettre" onclick="openMise(this.dataset.id)">Mettre en bouteille</button></div>':'')
      +'</div>';
  });
  var sans=act.filter(function(c){ return !(c.mise_prev&&c.mise_prev.date); });
  h+='<div class="mvb-sec sep">En élevage</div>';
  if(!sans.length) h+='<div class="mvb-empty">'+(act.length?'Toutes les cuvées en élevage ont une date de mise.':'Aucune cuvée en élevage.')+'</div>';
  sans.forEach(function(c){
    var hl=_cmVolL(c)/100, pr=_cmPrete(c), part=(c.mises||[]).length;
    h+='<div class="mvb-card"><div class="mvb-badge">’'+String(c.millesime||'').slice(-2)+'</div><div class="mvb-name">'+_escHtml(c.nom||'Cuvée')+'</div>'
      +'<div class="mvb-meta">Millésime '+(c.millesime||'?')+' · '+_escHtml((typeof window._caveContenantsStr==='function'?window._caveContenantsStr(c):'')||'aucun contenant')+' · '+_cmV1(hl)+' hL élevés</div>'
      +(pr?'<div class="mvb-line">'+_cmIcone('verre')+' prête pour la mise d’après la dégustation du '+_cmFr(pr.date)+'</div>':'')
      +(part?'<div class="mvb-line">déjà mise en partie : '+_escHtml(_cmFmtTxt(c.stock_fmt||{}))+'</div>':'<div class="mvb-line">théorique <b>'+_cmNb(Math.round(hl*100/0.75))+'</b> bouteilles</div>')
      +(w?'<div class="cm-acts"><button type="button" class="mvbtn mvbtn-secondaire mvbtn-compact" data-id="'+_escAttr(c.id)+'" data-tuto="btl.prev" onclick="openMisePrev(this.dataset.id)">Préparer la mise</button>'
        +'<button type="button" class="mvbtn mvbtn-secondaire mvbtn-compact" data-id="'+_escAttr(c.id)+'" onclick="openMise(this.dataset.id)">Mettre en bouteille</button>'
        +(_cmNbFuts(c)>0?'<button type="button" class="mvbtn mvbtn-discret mvbtn-compact" data-id="'+_escAttr(c.id)+'" data-tuto="btl.masse" onclick="openMasse(this.dataset.id)">Mise en masse</button>':'')+'</div>':'')
      +'</div>';
  });
  h+='<div class="mvb-sec sep">En stock · archive par millésime</div>';
  if(!emb.length) h+='<div class="mvb-empty">Aucune cuvée embouteillée.</div>';
  else {
    if(typeof window._mvGraphOublier==='function') window._mvGraphOublier('#mvg-btl-');
    var byM={}; emb.forEach(function(c){ var m=c.millesime||'?'; (byM[m]=byM[m]||[]).push(c); });
    Object.keys(byM).sort(function(a,b){ return b-a; }).forEach(function(m){
      var list=byM[m], tot=list.reduce(function(s,c){ return s+(c.nb_bouteilles||0); },0);
      h+='<div class="mvb-grp"><div class="mvb-grphead">Millésime '+_escHtml(m)+' · '+_cmNb(tot)+' bouteilles (éq. 75 cl)</div>';
      list.forEach(function(c){ h+=_cmStockCarte(c, w); });
      h+='</div>';
    });
  }
  el.innerHTML=h;
  emb.forEach(function(c){ var ch=_cmChaine(c); if(ch&&ch.g&&typeof window._mvGraphSuivre==='function'){ (function(ch2,nb,id){ window._mvGraphSuivre('#mvg-btl-'+_cmGid(id), function(lg){ return window._caveBtlGraphSvg(ch2,nb,lg); }); })(ch.ch, c.nb_bouteilles!=null?c.nb_bouteilles:null, c.id); } });
}
function _cmGid(id){ return (typeof window._mvgId==='function')?window._mvgId(id):String(id).replace(/[^A-Za-z0-9_-]/g,'_'); }
function _cmIcone(n){ return _mvIcon(n,14); }
function _cmChaine(c){
  // ★ VOL-1 — le vivant d'abord (une mesure saisie après la mise se voit), le figé en repli.
  var ch=(typeof window._caveBilanChaine==='function')?window._caveBilanChaine(c):null;
  var g=(ch&&typeof window._caveBtlGraphSvg==='function')?window._caveBtlGraphSvg(ch, c.nb_bouteilles!=null?c.nb_bouteilles:null, (typeof window._mvGraphW==='function'?window._mvGraphW(null):600)):'';
  return {ch:ch, g:g};
}
function _cmStockCarte(c, w){
  var x=_cmChaine(c), ch=x.ch, M=c.mises||[], S=c.stock_fmt;
  var perte=(ch&&ch.recolteKg!=null&&c.nb_bouteilles&&typeof window._mlKgHl==='function')?Math.round((1-c.nb_bouteilles/Math.round(ch.recolteKg/window._mlKgHl()*100/0.75))*100):null;
  var h='<div class="mvb-card"><div class="mvb-name">'+_escHtml(c.nom||'Cuvée')+'</div>'
    +'<div class="mvb-meta">Mis en bouteille'+(c.date_embouteillage?' · '+_cmFr(c.date_embouteillage):'')+(M.length?' · lot'+(M.length>1?'s ':' ')+_escHtml(M.map(function(m){ return m.lot; }).filter(Boolean).join(', ')):'')+'</div>'
    +'<button type="button" class="mlc-ret" style="margin:4px 0 6px" data-id="'+_escAttr(String(c.id))+'" onclick="openCuveeDetail(this.getAttribute(\'data-id\'),null,\'vol\')">Fiche de la cuvée ›</button>'
    +'<div class="mvb-split"><div><div class="mvb-tot">'+_cmNb(c.nb_bouteilles||0)+'<small>bouteilles en stock (éq. 75 cl)</small></div></div>'
    +(perte!=null?'<div style="margin-left:auto;text-align:right"><div class="mvb-tot" style="font-size:var(--pt-lg,24px)">−'+perte+'%<small>perte récolte → bouteille</small></div></div>':'')+'</div>';
  if(S&&_cmFmtN(S)>=0&&M.length){
    h+='<table class="cm-fm" style="margin-top:8px">'+_CM_FMT.filter(function(f){ return (parseInt(S[f[0]],10)||0)>0||M.some(function(m){ return (m.fmt&&m.fmt[f[0]])>0; }); }).map(function(f){
      return '<tr><td>'+f[2]+'</td><td style="text-align:right">'+(w?'<input type="text" inputmode="numeric" value="'+(parseInt(S[f[0]],10)||0)+'" data-id="'+_escAttr(c.id)+'" data-k="'+f[0]+'" onchange="_cmStockCorriger(this.dataset.id,this.dataset.k,this.value)" aria-label="Stock '+_escAttr(f[2])+'">':_cmNb(S[f[0]]))+'</td></tr>';
    }).join('')+'</table>';
  }
  if(x.g){ h+='<div class="mvb-sec" style="margin:14px 0 0;border:0">Évolution du volume (équiv. bouteilles)</div><div id="mvg-btl-'+_cmGid(c.id)+'"></div>'; }
  else h+='<div class="mvb-hint" style="margin-top:8px">Chaîne de perte partielle — liez la cuvée à sa cuve de vinification pour l’afficher.</div>';
  if(w&&!M.length) h+='<div class="mvb-frow"><div class="mvb-fld"><label>Corriger bouteilles</label><input type="number" value="'+(c.nb_bouteilles||0)+'" data-id="'+_escAttr(c.id)+'" onchange="_cmNbCorriger(this.dataset.id,this.value)"></div></div>';
  if(isAdmin()&&M.length) h+='<div class="cm-acts"><button type="button" class="mvbtn mvbtn-discret mvbtn-compact" data-id="'+_escAttr(c.id)+'" onclick="_cmMiseAnnuler(this.dataset.id)">Annuler la dernière mise</button></div>';
  return h+'</div>';
}
function _cmNbCorriger(id, v){ if(!_cmGarde()) return; var c=_cmCuvee(id); if(!c) return; c.nb_bouteilles=parseInt(v,10)||0; _cmEnreg('Stock corrigé'); }

/* ═══ ★ GESTES-2 — LA FEUILLE DES GESTES DU CHAI, RANGÉE PAR ÉTAPE ════════════════════════════════════════════════
   Trois gestes neufs à l'écran : Bâtonner (type « batonnage »), Coller et Stabiliser — ces deux-là restent des
   « traitement » (nature « col » / « sta ») : rien ne change pour les opérations déjà notées ni pour La Réserve.
   Ce module garde ce qui leur est propre (allergène, essai, rappel du soutirage ; quoi, méthode, test ; le prochain
   bâtonnage) et cave.js l'appelle à trois endroits : le choix du geste, l'enregistrement, la réouverture. */
var _CM_COLLES=[[/bento/i,'bo',null,'protéines, trouble à chaud'],[/cas[ée]in|lait/i,'bo','lait','oxydation, goûts'],[/poisson|ichty/i,'rbo',null,'brillance'],
  [/pvpp|polyvinyl/i,'bo',null,'brunissement, amertume'],[/v[ée]g[ée]tal|pois|pomme de terre/i,'rbo',null,'clarifier, assouplir'],[/g[ée]latine/i,'r',null,'assouplir les tanins'],
  [/albumin|ovalb|œuf|oeuf/i,'r','oeuf','assouplir les tanins'],[/lysozym/i,'rbo','oeuf','bactéries lactiques'],[/chitosan/i,'rbo',null,'clarifier']];
function _cmColle(nom){ for(var i=0;i<_CM_COLLES.length;i++){ if(_CM_COLLES[i][0].test(String(nom||''))) return {c:_CM_COLLES[i][1], a:_CM_COLLES[i][2], r:_CM_COLLES[i][3]}; } return null; }
var _CM_STAB={prot:{t:'Protéique', c:'bo', m:[['bento','Bentonite'],['aut','Autre']], test:'Test à chaud (80 °C, 30 min)'},
  tart:{t:'Tartrique', c:'rbo', m:[['froid','Froid'],['cmc','CMC'],['manno','Mannoprotéines'],['meta','Acide métatartrique'],['electro','Électrodialyse'],['aut','Autre']], test:'Test au froid ou mini-contact'}};
var _cmOp={vue:'', all:null, essai:false, rappel:10, quoi:'tart', meth:'', test:'', proch:7};
function _cmOpReset(){ _cmOp={vue:'', all:null, essai:false, rappel:10, quoi:'tart', meth:'', test:'', proch:7}; }
function _cmCoulsSel(){ var l=(typeof window._copNouvCuvs==='function')?window._copNouvCuvs():[]; return l.map(_cmCoul).filter(Boolean); }
/* Le geste choisi : rend le type réel (Coller et Stabiliser sont des traitements). */
function _cmOpSel(vue){
  _cmCss();
  if(vue!=='collage'&&vue!=='stab'&&vue!=='batonnage'&&_cmOp.vue!==vue) _cmOpReset();
  _cmOp.vue=vue;
  if(vue==='stab'&&!_cmOp.quoi){ _cmOp.quoi='tart'; }
  if(vue==='stab'){ var C=_cmCoulsSel(); if(C.length&&C.every(function(k){ return k!=='r'; })&&!_cmOp.meth) _cmOp.quoi='prot'; }
  return (vue==='collage'||vue==='stab')?'traitement':vue;
}
/* Les boutons qui ne vont pas avec la couleur des cuvées choisies s'effacent (ils restent possibles). */
function _cmOpDim(){
  var C=_cmCoulsSel(), b=document.getElementById('cot-batonnage');
  if(b) b.classList.toggle('cm-dim', C.length>0&&C.indexOf('b')<0);
}
/* Le bloc propre au geste, sous les champs du traitement (ou seul, pour Bâtonner). */
function _cmOpExtra(){
  var el=document.getElementById('cop-cm-extra'); if(!el) return;
  var v=_cmOp.vue, h='';
  var tog=function(on,lbl,fn){ return '<button type="button" class="cave-toggle-btn'+(on?' cave-toggle-active':'')+'" style="flex:1" onclick="'+fn+'">'+lbl+'</button>'; };
  var chip=function(on,lbl,fn){ return '<button type="button" class="cave-cuvee-chip'+(on?' on':'')+'" aria-pressed="'+(on?'true':'false')+'" onclick="'+fn+'">'+_escHtml(lbl)+'</button>'; };
  if(v==='collage'){
    var p=_cmOpProd(), co=p?_cmColle(p.nom):null, a=_cmOp.all!==null?_cmOp.all:(co?co.a:null), C=_cmCoulsSel();
    if(p&&co&&C.length&&C.some(function(k){ return co.c.indexOf(k)<0; })) h+='<div class="mvencadre mvencadre-attention" style="margin:8px 0">'+_escHtml(p.nom)+' se réserve d’ordinaire '+(co.c==='r'?'aux rouges':(co.c==='bo'?'aux blancs et aux rosés':''))+'. Possible, si c’est voulu.</div>';
    h+='<div class="fl">Allergène <span style="font-weight:500;text-transform:none;letter-spacing:0;">— suivi jusqu’à la mise</span></div><div style="display:flex;gap:6px;margin-bottom:10px">'
      +tog(a===null,'Aucun',"_cmOpSet('all','')")+tog(a==='lait','Lait',"_cmOpSet('all','lait')")+tog(a==='oeuf','Œuf',"_cmOpSet('all','oeuf')")+'</div>'
      +'<div style="display:flex;gap:6px;margin-bottom:10px">'+tog(_cmOp.essai,'Dose retenue après un essai',"_cmOpSet('essai','')")+'</div>'
      +'<div class="fl">Rappel du soutirage</div><div style="display:flex;gap:8px;align-items:center;margin-bottom:4px"><span>Soutirer dans</span><input type="number" class="fi ac" id="cop-cm-rap" min="0" max="60" step="1" value="'+_cmOp.rappel+'" style="width:86px" oninput="_cmOpSet(\'rappel\',this.value)" data-tuto="cop.col.rappel"><span>jours</span></div>'
      +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);line-height:1.45;">Le soutirage arrive dans « À faire » à cette date, quand la colle a déposé. 0 : pas de rappel.</div>';
  } else if(v==='stab'){
    var Q=_CM_STAB[_cmOp.quoi]||_CM_STAB.tart, C2=_cmCoulsSel();
    h+='<div class="fl">Quoi</div><div style="display:flex;gap:6px;margin-bottom:10px">'+Object.keys(_CM_STAB).map(function(k){ return tog(_cmOp.quoi===k,_CM_STAB[k].t,"_cmOpSet('quoi','"+k+"')"); }).join('')+'</div>';
    if(_cmOp.quoi==='prot'&&C2.length&&C2.every(function(k){ return k==='r'; })) h+='<div class="mvencadre mvencadre-attention" style="margin:0 0 8px">Un rouge n’a d’ordinaire pas de casse protéique : ses tanins s’en chargent.</div>';
    h+='<div class="fl">Méthode</div><div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px">'+Q.m.map(function(m){ return chip(_cmOp.meth===m[0],m[1],"_cmOpSet('meth','"+m[0]+"')"); }).join('')+'</div>'
      +'<div class="fl">'+_escHtml(Q.test)+' <span style="font-weight:500;text-transform:none;letter-spacing:0;">— facultatif</span></div><div style="display:flex;gap:6px;margin-bottom:6px">'
      +tog(_cmOp.test==='','Non fait',"_cmOpSet('test','')")+tog(_cmOp.test==='stable','Stable',"_cmOpSet('test','stable')")+tog(_cmOp.test==='instable','Instable',"_cmOpSet('test','instable')")+'</div>'
      +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);line-height:1.45;">Le froid ou l’électrodialyse n’ont pas de produit : laissez « Aucun produit ».</div>';
  } else if(v==='batonnage'){
    h+='<div class="fl">Le prochain</div><div style="display:flex;gap:8px;align-items:center;margin-bottom:4px"><span>Dans</span><input type="number" class="fi ac" id="cop-cm-proch" min="0" max="90" step="1" value="'+_cmOp.proch+'" style="width:86px" oninput="_cmOpSet(\'proch\',this.value)" data-tuto="cop.bat.proch"><span>jours</span></div>'
      +'<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);line-height:1.45;">Il arrive dans « À faire » à cette date. 0 : pas de rappel.</div>';
  }
  el.innerHTML=h; el.style.display=h?'':'none';
  var nat=document.getElementById('cop-tr-nat'); if(nat){ nat.style.display=(v==='collage'||v==='stab')?'none':''; var lb=nat.previousElementSibling; if(lb&&lb.classList.contains('fl')) lb.style.display=nat.style.display; }
}
function _cmOpProd(){ var s=document.getElementById('cop-tr-prod'), id=s?s.value:''; return ((typeof window._vendIntrProds==='function')?window._vendIntrProds():[]).filter(function(p){ return p&&p.id===id; })[0]||null; }
function _cmOpSet(k, v){
  if(k==='all') _cmOp.all=v||null;
  else if(k==='essai') _cmOp.essai=!_cmOp.essai;
  else if(k==='rappel'){ _cmOp.rappel=Math.max(0,Math.min(60,parseInt(v,10)||0)); return; }
  else if(k==='proch'){ _cmOp.proch=Math.max(0,Math.min(90,parseInt(v,10)||0)); return; }
  else if(k==='quoi'){ _cmOp.quoi=(v==='prot')?'prot':'tart'; _cmOp.meth=''; }
  else if(k==='meth') _cmOp.meth=(_cmOp.meth===v)?'':v;
  else if(k==='test') _cmOp.test=v||'';
  _cmOpExtra();
}
/* Les produits du collage : ceux qui vont avec la couleur d'abord, l'allergène dit dans la liste. */
function _cmColleOpts(prods){
  var C=_cmCoulsSel();
  function va(p){ var x=_cmColle(p.nom); return !x||!C.length||C.every(function(k){ return x.c.indexOf(k)>=0; }); }
  return prods.slice().sort(function(a,b){ return (va(a)?0:1)-(va(b)?0:1); }).map(function(p){
    var x=_cmColle(p.nom);
    return {id:p.id, lbl:p.nom+(x?' — '+x.r+(x.a?' · allergène : '+_CM_ALL[x.a]:''):'')+(va(p)?'':' (autre couleur)')};
  });
}
/* À l'enregistrement : ce qui est propre au geste, ajouté à op.data. null = refus (le toast dit pourquoi). */
function _cmOpData(type, d, date){
  var v=_cmOp.vue; d=d||{};
  if(type==='traitement'&&v==='collage'){
    var p=_cmOpProd(), co=p?_cmColle(p.nom):null, a=_cmOp.all!==null?_cmOp.all:(co?co.a:null);
    d.nature='col'; d.allergene=a||null; d.essai=!!_cmOp.essai;
    d.rappel_sout=(_cmOp.rappel>0)?_cmAddJ(date,_cmOp.rappel):null;
  } else if(type==='traitement'&&v==='stab'){
    d.nature='sta'; d.stab={quoi:_cmOp.quoi, meth:_cmOp.meth||'', test:_cmOp.test||''};
    if(!_cmOp.meth&&!d.prod_id){ showToast('Choisissez la méthode ou le produit','#E07060'); return null; }
  } else if(type==='batonnage'){
    d.proch=(_cmOp.proch>0)?_cmAddJ(date,_cmOp.proch):null;
  }
  return d;
}
/* À la réouverture d'une opération : le geste affiché suit sa nature. */
function _cmOpPrefill(op){
  _cmOpReset();
  var d=(op&&op.data)||{};
  if(op&&op.type==='traitement'&&(d.nature==='col'||d.nature==='sta')){
    _cmOp.vue=(d.nature==='col')?'collage':'stab';
    if(d.nature==='col'){ _cmOp.all=d.allergene||null; _cmOp.essai=!!d.essai; _cmOp.rappel=d.rappel_sout?Math.max(0,_cmEcart(op.date,d.rappel_sout)):0; }
    else if(d.stab){ _cmOp.quoi=d.stab.quoi==='prot'?'prot':'tart'; _cmOp.meth=d.stab.meth||''; _cmOp.test=d.stab.test||''; }
    return _cmOp.vue;
  }
  if(op&&op.type==='batonnage'){ _cmOp.vue='batonnage'; _cmOp.proch=d.proch?Math.max(0,_cmEcart(op.date,d.proch)):0; return 'batonnage'; }
  return op?op.type:'';
}
function _cmOpVue(){ return _cmOp.vue; }
/* Les lignes d'une opération dans le journal de la fiche : ce que portent les gestes neufs. */
/* Le titre d'un geste rangé : « Coller » et « Stabiliser » s'enregistrent en traitement, la mise en masse en soutirage —
   le journal, la fiche et l'export disent le geste (null = le libellé du type). */
function _cmOpTitre(op){
  var d=(op&&op.data)||{};
  if(op&&op.type==='traitement'&&d.nature==='col') return 'Collage';
  if(op&&op.type==='traitement'&&d.nature==='sta') return 'Stabilisation';
  if(op&&op.type==='soutirage'&&d.masse) return 'Mise en masse';
  return null;
}
function _cmOpLignes(op){
  var d=(op&&op.data)||{}, l=[];
  if(op.type==='traitement'&&d.nature==='col'){ if(d.allergene) l.push('allergène : '+_CM_ALL[d.allergene]); if(d.essai) l.push('dose après essai'); if(d.rappel_sout) l.push('soutirer le '+_cmFr(d.rappel_sout)); }
  if(op.type==='traitement'&&d.nature==='sta'&&d.stab){ var Q=_CM_STAB[d.stab.quoi]; var m=Q&&Q.m.filter(function(x){ return x[0]===d.stab.meth; })[0]; l.push((Q?Q.t:'')+(m?' · '+m[1]:'')+(d.stab.test?' · test '+d.stab.test:'')); }
  if(op.type==='batonnage'&&d.proch) l.push('le prochain le '+_cmFr(d.proch));
  if(op.type==='soutirage'&&d.masse){ var x=d.masse; l.push('mise en masse : '+x.futs+' fût'+(x.futs>1?'s':'')+' → '+(x.vers_nom||'une cuve')+' · '+_cmNb(x.l)+' L mesurés'+(x.perte_l>0?' · lies '+_cmNb(x.perte_l)+' L':'')); }
  if(op.type==='miseenbouteille'){ l.push('lot '+(d.lot||'?')+' · '+_cmFmtTxt(d.fmt||{})+(d.final?'':' · une partie')); }
  return l;
}
/* Mise en masse depuis la feuille des gestes : une cuvée en fûts, choisie. */
function _cmOpMasse(){
  var l=(typeof window._copNouvCuvs==='function')?window._copNouvCuvs():[];
  if(l.length!==1){ showToast('Choisissez une cuvée, une seule','#E07060'); return; }
  if(!(_cmNbFuts(l[0])>0)){ showToast('« '+_cmNom(l[0])+' » n’est pas en fûts','#E07060'); return; }
  if(typeof window.closeOv==='function') window.closeOv(null,'ovCaveOp');
  openMasse(l[0].id);
}

/* ═══ ★ GESTES-2 — LES RAPPELS DU CHAI DANS « À FAIRE » ═══════════════════════════════════════════════════════
   Lus par cave.js/_mlAgendaComplet (comme le soutirage d'un débourbage) : soutirer après un collage, bâtonner, la suite
   de la DERNIÈRE dégustation d'une cuvée tant qu'un geste ne la solde pas, la préparation d'une mise. Une date passée
   arrive aujourd'hui, « due ». */
var _CM_SIG={fruit:'fruité', ouv:'ouvert', ferm:'fermé', red:'réduit', oxy:'oxydatif', vol:'volatile', ani:'animal', bois:'bois marqué', fleur:'fleur en surface'};
var _CM_SUITE={sout:['soutirage','soutirer'], ana:['analyse','analyser'], asm:['asm','assembler'], retfut:['retfut','retirer le fût']};
function _cmDer(l){ return l.slice().sort(function(a,b){ return String(b.date||'').localeCompare(String(a.date||'')); })[0]||null; }
function _cmTitre(c){ return (typeof window._mlNomCuvee==='function')?window._mlNomCuvee(c):_cmNom(c); }
function _cmSuiteSoldee(c, dg, ops){
  var d=String(dg.date||'').slice(0,10), su=dg.data&&dg.data.suite;
  if(dg.data&&dg.data.suite_faite) return true;
  function apres(t){ return ops.some(function(o){ return o.type===t&&o.id!==dg.id&&String(o.date||'').slice(0,10)>=d; }); }
  if(su==='sout') return apres('soutirage');
  if(su==='ana') return apres('analyse')||(_cmCE().analyses||[]).some(function(a){ return a&&(a.cuvee_ids||[]).indexOf(c.id)>=0&&String(a.date_analyse||'').slice(0,10)>=d; });
  if(su==='asm') return apres('assemblage');
  if(su==='retfut') return apres('retrait_fut');
  if(su==='mise') return !!(c.mise_prev&&c.mise_prev.date)||((c.mises||[]).length>0);
  return true;
}
function _cmPrete(c){ var dg=_cmDer(_cmOps(c).filter(function(o){ return o.type==='degustation'; })); return (dg&&dg.data&&dg.data.suite==='mise')?dg:null; }
function _cmAgenda(from, nSem){
  var out=[], fin=_cmAddJ(from, 7*(nSem||4)), E=_cmCE();
  function push(d, it){ d=String(d||'').slice(0,10); if(!d||d>fin) return; out.push({date:(d<from?from:d), it:it}); }
  (E.cuvees||[]).forEach(function(c){
    if(!c||c.statut==='embouteille') return;
    var ops=_cmOps(c), t=_cmTitre(c);
    var col=_cmDer(ops.filter(function(o){ return o.type==='traitement'&&o.data&&o.data.nature==='col'; }));
    var cp=(col&&col.data.produit)||'';   // du texte : « À faire » l'échappe à l'affichage (_aujRaison)
    if(col&&col.data.rappel_sout&&!ops.some(function(o){ return o.type==='soutirage'&&o.id!==col.id&&String(o.date)>=String(col.date); }))
      push(col.data.rappel_sout, {kind:'soutirage', titre:t, detail:'après le collage du '+_cmFr(col.date)+(cp?' ('+cp+')':''), urgence:col.data.rappel_sout<from?'due':'', ref:c.id});
    var bat=_cmDer(ops.filter(function(o){ return o.type==='batonnage'; }));
    if(bat&&bat.data&&bat.data.proch) push(bat.data.proch, {kind:'batonnage', titre:t, detail:'bâtonner · le dernier le '+_cmFr(bat.date), urgence:bat.data.proch<from?'due':'', ref:c.id});
    var dg=_cmDer(ops.filter(function(o){ return o.type==='degustation'; })), su=dg&&dg.data&&dg.data.suite;
    if(su&&su!=='rien'&&!_cmSuiteSoldee(c, dg, ops)){
      var sig=(dg.data.signaux||[]).map(function(s){ return _CM_SIG[s]; }).filter(Boolean);
      if(su==='mise') push(dg.date, {kind:'mise', titre:t, detail:'prête pour la mise d’après la dégustation du '+_cmFr(dg.date)+' : fixez la date', ref:c.id});
      else if(_CM_SUITE[su]) push(dg.date, {kind:_CM_SUITE[su][0], titre:t, detail:_CM_SUITE[su][1]+' · suite de la dégustation du '+_cmFr(dg.date)+(sig.length?' : « '+sig.join(', ')+' »':''), ref:c.id});
    }
    if(c.mise_prev&&c.mise_prev.date){
      var P=c.mise_prev;
      _cmChecks(c, P.date).forEach(function(x){
        if(x.fait||!x.due) return;
        push(x.due, {kind:'mise', titre:t, detail:'mise du '+_cmFr(P.date)+' : '+x.t.charAt(0).toLowerCase()+x.t.slice(1)+(x.j!=null?' (J-'+x.j+')':''), urgence:x.due<from?'due':'', ref:c.id});
      });
      push(P.date, {kind:'mise', titre:t, detail:P.date<from?'mise prévue le '+_cmFr(P.date)+', pas encore enregistrée':'mise en bouteille'+(P.par==='cam'?' · camion de mise':''), urgence:P.date<from?'due':'', ref:c.id});
    }
  });
  return out;
}
/* Les boutons des gestes neufs dans « À faire » (lu par cave.js/_mlGo avant les siens). true : pris en charge. */
function _cmGo(kind, ref){
  if(['batonnage','analyse','asm','retfut','mise','masse','degustation','collage','consigne'].indexOf(kind)<0) return false;
  if(isSaisonnier()){ showToast('Accès lecture seule','#B85A1A'); return true; }
  if(kind==='consigne'){ _pcFaire(ref); return true; }
  if(kind==='mise'){ var c=_cmCuvee(ref); if(c&&c.mise_prev&&c.mise_prev.date&&c.mise_prev.date<=_cmAuj()) openMise(ref); else openMisePrev(ref); return true; }
  if(kind==='masse'){ openMasse(ref); return true; }
  if(typeof window.selectCaveSection==='function') window.selectCaveSection('elevage');
  if(kind==='asm'||kind==='retfut'){ if(typeof window.openCuveeDetail==='function') window.openCuveeDetail(ref); return true; }
  if(typeof window._caveQuickOp==='function') window._caveQuickOp(null, kind==='collage'?'collage':kind, ref);
  return true;
}

/* ═══ ★ GESTES-2 — LE PARCOURS D'UNE CUVÉE, EN HAUT DE SA FICHE ════════════════════════════════════════════════
   Une ligne : ce qui est fait (vert, daté), où en est le vin, ce qui vient — selon sa couleur. Puis le prochain geste,
   tiré de « À faire » : il se fait d'un appui, ou se confie. */
function _cmEtapes(c){
  var k=_cmCoul(c), ops=_cmOps(c), src=(typeof window._caveCuveSource==='function')?window._caveCuveSource(c):null;
  function der(f){ var o=_cmDer(ops.filter(f)); return o?_cmFr(o.date):''; }
  function n(f){ return ops.filter(f).length; }
  var fml=(typeof window._caveFmlEtat==='function')?window._caveFmlEtat(c):null, futs=_cmNbFuts(c)>0;
  var E=[];
  E.push(['Cuvier', src?((src.decuvage&&src.decuvage.date)?'décuvée le '+_cmFr(src.decuvage.date):(src.nom||'')):'', !!src||!!c.date_entonnage||ops.length>0]);
  if(k!=='o') E.push(['Malo', fml==='ok'?(c.fml_terminee_date?_cmFr(c.fml_terminee_date):'faite'):(fml==='sans'?'pas de malo, voulu':(fml==='cours'?'en cours':'')), fml==='ok'||fml==='sans']);
  if(k==='b'){ var nb=n(function(o){ return o.type==='batonnage'; }); E.push(['Sur lies', nb?nb+' bâtonnage'+(nb>1?'s':''):'', nb>0]); }
  var sou=der(function(o){ return o.type==='soutirage'&&!(o.data&&o.data.masse); }); E.push(['Soutirage', sou, !!sou]);
  if(k==='o'){ var sp=der(function(o){ return o.type==='traitement'&&o.data&&o.data.stab&&o.data.stab.quoi==='prot'; }); E.push(['Stab. protéique', sp, !!sp]); }
  var co=der(function(o){ return o.type==='traitement'&&o.data&&o.data.nature==='col'; }); E.push(['Collage', co, !!co]);
  if(k==='b'||k==='o'){ var st=der(function(o){ return o.type==='traitement'&&o.data&&o.data.nature==='sta'&&!(o.data.stab&&o.data.stab.quoi==='prot'&&k==='o'); }); E.push([k==='o'?'Stab. tartrique':'Stabilisation', st, !!st]); }
  var fi=der(function(o){ return o.type==='filtration'; }); E.push(['Filtration', fi, !!fi]);
  var ma=der(function(o){ return o.type==='soutirage'&&o.data&&o.data.masse; });
  if(ma||futs) E.push(['Mise en masse', ma, !!ma]);
  var M=c.mises||[];
  E.push(['Mise', c.statut==='embouteille'?_cmFr(c.date_embouteillage):(M.length?'en partie':(c.mise_prev&&c.mise_prev.date?'le '+_cmFr(c.mise_prev.date):'')), c.statut==='embouteille']);
  return E;
}
function _cmParcoursHtml(c){
  if(!c) return '';
  _cmCss();
  var E=_cmEtapes(c), now=-1;
  for(var i=0;i<E.length;i++){ if(!E[i][2]){ now=i; break; } }
  var h='<div class="cm-pt"><div class="cm-frise" role="list" aria-label="Le parcours de la cuvée">'+E.map(function(e,i){
    return '<div class="cm-fz '+(e[2]?'ok':(i===now?'now':''))+'" role="listitem"><i></i><b>'+_escHtml(e[0])+'</b>'+(e[1]?_escHtml(e[1]):'&nbsp;')+'</div>';
  }).join('')+'</div>';
  var nx=_cmProchain(c);
  if(nx){
    var verbe=(typeof window._mlVerbe==='function')?window._mlVerbe(nx.kind):'Voir';
    h+='<div class="cm-next"><div style="flex:1;min-width:0"><div class="cm-k">Prochain geste</div><div style="font-weight:600">'+_escHtml(nx.titreG)+'</div><div class="cm-m" style="font-size:12.5px;color:var(--texte-doux,#686660)">'+_escHtml(nx.quand)+'</div></div>'
      +(canWrite()&&!isSaisonnier()?'<div style="display:flex;flex-direction:column;gap:6px"><button type="button" class="mvbtn mvbtn-principal mvbtn-compact" data-k="'+_escAttr(nx.kind)+'" data-r="'+_escAttr(nx.ref)+'" onclick="_mlGo(this.dataset.k,this.dataset.r)">'+_escHtml(verbe)+'</button>'
        +(isAdmin()?'<button type="button" class="mvbtn mvbtn-secondaire mvbtn-compact" data-k="'+_escAttr(nx.kind)+'" data-r="'+_escAttr(nx.ref)+'" data-d="'+_escAttr(nx.date)+'" onclick="_pcDepuis(this.dataset.k,this.dataset.r,this.dataset.d)">Confier</button>':'')+'</div>':'')+'</div>';
  }
  return h+'</div>';
}
function _cmProchain(c){
  if(typeof window._mlAgendaComplet!=='function') return null;
  var from=_cmAuj(), sem=[];
  try{ sem=window._mlAgendaComplet(from, 4)||[]; }catch(e){ if(window._mvAvale) window._mvAvale(e,'cave-mise.js/_cmProchain'); return null; }
  var it=null;
  sem.some(function(s){ return (s.items||[]).some(function(x){ if(x&&x.ref===c.id&&x.kind!=='fa'&&x.kind!=='demarrage'){ it=x; return true; } return false; }); });
  if(!it) return null;
  var j=_cmEcart(from, it.date);
  var lbl=(typeof window._mlLibelle==='function')?window._mlLibelle(it.kind):it.kind;
  var det=String(it.detail||''), p=det.split(' · ');
  if(p.length>1&&p[0].toLowerCase()===String(lbl).toLowerCase()) det=p.slice(1).join(' · ');   // « Bâtonner » ne se redit pas sous « Bâtonner »
  return {kind:it.kind, ref:it.ref, date:it.date, titreG:lbl, quand:(j<=0?(it.urgence==='due'?'dû':'aujourd’hui'):(j===1?'demain':'dans '+j+' jours'))+(det?' · '+det:'')};
}

/* ═══ ★ PROG-CAVE — CONFIER UN GESTE À QUELQU'UN ════════════════════════════════════════════════════════════════
   CAVE_ELEVAGE.consignes = [{ id, g, ref, refT:'cuvee'|'cuve', nom, date, mom:'m'|'a'|'j', qui:[noms], note, par, cree,
                               pas:{motif,txt,par,le}, fait:{par,le} }]
   ★ Seul l'administrateur confie (comme les suppressions). Une consigne se SOLDE par l'opération enregistrée — même geste,
     même cuvée, datée du jour où elle a été confiée ou après (_pcSolde, lu à chaque affichage : rien à tenir à jour) ;
     « Autre » (laver une cuve) se coche. « Pas fait » demande pourquoi ; la consigne reste dans « À faire ».
   ★ La personne la voit dans son message du matin (reglages.js/_mvNotifLignes), sur son Accueil (jalons.js) et dans
     « Pour toi » en tête de la Cave. La case « Ça lui prend la matinée » pose sa demi-journée de cave (JCAVE-1). */
var _PC_G=[['ouillage','seau','Ouiller'],['soutirage','hautbas','Soutirer'],['so2','eprouvette','Sulfiter'],['batonnage','rotation','Bâtonner'],
  ['degustation','verre','Déguster'],['collage','goutte','Coller'],['masse','cuve','Mise en masse'],['autre','crayon','Autre']];
var _PC_VERBE={ouillage:'ouiller', soutirage:'soutirer', so2:'sulfiter', batonnage:'bâtonner', degustation:'déguster', collage:'coller', masse:'rassembler en cuve',
  autre:'', analyse:'analyser', asm:'assembler', retfut:'retirer le fût', mise:'préparer la mise', mesure:'relever', debourbage:'soutirer le jus clair', decuvage:'décuver', alerte:'relever'};
var _PC_OP={ouillage:'ouillage', soutirage:'soutirage', so2:'soufre', batonnage:'batonnage', degustation:'degustation', collage:'traitement', analyse:'analyse', asm:'assemblage', retfut:'retrait_fut', masse:'soutirage', mise:'miseenbouteille'};
var _PC_CUVE={mesure:1, debourbage:1, decuvage:1, alerte:1, labo:1};
var _PC_MOM={m:'le matin', a:'l’après-midi', j:'dans la journée'};
function _pcListe(){ var E=_cmCE(); return Array.isArray(E.consignes)?E.consignes:[]; }
function _pcCuve(id){ var V=(window.CAVE_VENDANGE&&window.CAVE_VENDANGE.cuves_vinif)||[]; for(var i=0;i<V.length;i++){ if(V[i]&&V[i].id===id) return V[i]; } return null; }
function _pcSolde(cs){
  if(!cs) return null;
  if(cs.fait) return {par:cs.fait.par||'', le:cs.fait.le||''};
  var d0=String(cs.cree||cs.date||'').slice(0,10);
  if(cs.refT==='cuve'){
    var v=_pcCuve(cs.ref); if(!v) return null;
    if(cs.g==='mesure'||cs.g==='alerte'){ var m=(typeof window._vendLastMes==='function')?window._vendLastMes(v):null; return (m&&String(m.date||'').slice(0,10)>=d0)?{par:m.par||'', le:String(m.date).slice(0,10)}:null; }
    if(cs.g==='debourbage'){ var db=v.debourbage; return (db&&db.fin&&String(db.fin).slice(0,10)>=d0)?{par:db.par_fin||db.par||'', le:String(db.fin).slice(0,10)}:null; }
    if(cs.g==='decuvage'){ var dc=v.decuvage; return (dc&&dc.date&&String(dc.date).slice(0,10)>=d0)?{par:'', le:String(dc.date).slice(0,10)}:null; }
    return null;
  }
  var t=_PC_OP[cs.g]; if(!t) return null;
  var ops=(_cmCE().operations||[]).filter(function(o){
    if(!o||o.type!==t||String(o.date||'').slice(0,10)<d0) return false;
    if(!((o.cuvees_ids&&o.cuvees_ids.indexOf(cs.ref)>=0)||o.cuvee_id===cs.ref)) return false;
    if(cs.g==='collage') return !!(o.data&&o.data.nature==='col');
    if(cs.g==='masse') return !!(o.data&&o.data.masse);
    return true;
  }).sort(function(a,b){ return String(a.date).localeCompare(String(b.date)); });
  var o=ops[0];
  return o?{par:(o.intervenants&&o.intervenants.length?o.intervenants.join(', '):(o.operateur||'')), le:String(o.date).slice(0,10), op:o.id}:null;
}
function _pcOuvertes(){ return _pcListe().filter(function(cs){ return cs&&!_pcSolde(cs); }); }
function _pcNomCible(g, ref, refT){
  if(!ref) return '';
  if(refT==='cuve'){ var v=_pcCuve(ref); return v?(v.nom||'Cuve'):''; }
  var c=_cmCuvee(ref); return c?_cmNom(c):'';
}
function _pcTexte(cs){ var v=_PC_VERBE[cs.g]; return (v?v.charAt(0).toUpperCase()+v.slice(1):'')+(cs.nom?(v?' · ':'')+cs.nom:'')+((!v&&cs.note)?(cs.nom?' · ':'')+cs.note:''); }
/* L'équipe d'un jour : qui travaille (le planning de l'écran, _planPrisesDePoste), et sa demi-journée de cave déjà posée. */
function _pcEquipe(iso){
  var pr=null;
  try{ if(typeof window._planPrisesDePoste==='function') pr=(window._planPrisesDePoste(1, iso)||{})[iso]||{}; }catch(e){ if(window._mvAvale) window._mvAvale(e,'cave-mise.js/_pcEquipe'); pr=null; }
  if(pr&&!Object.keys(pr).length) pr=null;   // personne au planning ce jour-là (planning pas tenu, jour non travaillé) : on ne trie pas, on propose tout le monde
  return (window.MEMBRES||[]).filter(function(m){ return m&&m.nom&&m.statut!=='Inactif'; }).map(function(m){
    var h=pr?pr[m.nom]:'', ok=!pr||(h!=null&&h!==undefined), cv=(typeof window._mvCaveJour==='function')?window._mvCaveJour(m.nom, iso):'';
    var info=!ok?'ne travaille pas ce jour-là (Planning)':(cv==='j'?'en cave toute la journée':(cv==='m'?'en cave le matin':(cv==='a'?'en cave l’après-midi':(h?'prise de poste à '+String(h).replace(':',' h '):''))));
    return {nom:m.nom, ok:ok, info:info};
  }).sort(function(a,b){ return (a.ok?0:1)-(b.ok?0:1)||String(a.nom).localeCompare(String(b.nom)); });
}
var _pcEt=null;   // {id (édition), g, ref, refT, date, mom, qui:{}, note, mj}
function _pcOuvrir(o){
  if(!isAdmin()){ showToast('Seul l’administrateur confie un geste','#B85A1A'); return; }
  o=o||{};
  var g=o.g||'ouillage', refT=_PC_CUVE[g]?'cuve':'cuvee';
  _pcEt={id:o.id||null, g:g, ref:o.ref||'', refT:o.refT||refT, date:o.date||_cmAuj(), mom:o.mom||'j', qui:{}, note:o.note||'', mj:false};
  (o.qui||[]).forEach(function(n){ _pcEt.qui[n]=true; });
  if(!_pcEt.ref&&_pcEt.refT==='cuvee'){ var a=(_cmCE().cuvees||[]).filter(function(c){ return c&&c.statut!=='embouteille'; }); if(a.length===1) _pcEt.ref=a[0].id; }
  _pcRendre();
}
function _pcDepuis(kind, ref, date){
  var g=(kind==='so2'||kind==='ouillage'||kind==='soutirage'||kind==='batonnage'||kind==='masse'||kind==='degustation'||kind==='collage'||_PC_CUVE[kind]||kind==='analyse'||kind==='mise'||kind==='asm'||kind==='retfut')?kind:'autre';
  var d=String(date||'').slice(0,10), auj=_cmAuj();
  _pcOuvrir({g:g, ref:ref, refT:_PC_CUVE[g]?'cuve':'cuvee', date:(d&&d>auj)?d:auj});
}
function _pcGarder(){ if(!_pcEt) return; var d=_cmVal('pc-d'), n=document.getElementById('pc-note'), r=document.getElementById('pc-ref'); if(d) _pcEt.date=d; if(n) _pcEt.note=n.value; if(r) _pcEt.ref=r.value; }
function _pcRendre(){
  var E=_pcEt; if(!E) return;
  var Q=_pcEquipe(E.date), noms=Object.keys(E.qui).filter(function(n){ return E.qui[n]&&Q.some(function(q){ return q.nom===n&&q.ok; }); });
  var G=_PC_G.slice(); if(!G.some(function(x){ return x[0]===E.g; })) G.unshift([E.g,'liste',(_PC_VERBE[E.g]||E.g).replace(/^./,function(x){ return x.toUpperCase(); })]);
  var h=_cmTete(E.id?'Changer le geste confié':'Confier un geste', '');
  h+='<label class="mvv-flbl">Quoi</label><div class="cm-ge">'+G.map(function(x){ return '<button type="button" class="'+(E.g===x[0]?'on':'')+'" data-g="'+x[0]+'" data-tuto="pc.g.'+x[0]+'" onclick="_pcSet(\'g\',this.dataset.g)">'+_mvIcon(x[1],20)+_escHtml(x[2])+'</button>'; }).join('')+'</div>';
  if(E.refT==='cuve'){
    var V=((window.CAVE_VENDANGE&&window.CAVE_VENDANGE.cuves_vinif)||[]).filter(function(v){ return v&&v.statut!=='termine'; });
    h+='<label class="mvv-flbl">Cuve</label><select id="pc-ref" class="mvv-tin">'+V.map(function(v){ return '<option value="'+_escAttr(v.id)+'"'+(v.id===E.ref?' selected':'')+'>'+_escHtml(v.nom||'Cuve')+'</option>'; }).join('')+'</select>';
  } else {
    var C=(_cmCE().cuvees||[]).filter(function(c){ return c&&c.statut!=='embouteille'; });
    h+='<label class="mvv-flbl">Cuvée'+(E.g==='autre'?' <span class="mvv-fhint">(facultatif)</span>':'')+'</label><select id="pc-ref" class="mvv-tin" data-tuto="pc.ref">'+(E.g==='autre'||!E.ref?'<option value="">'+(E.g==='autre'?'—':'Choisir…')+'</option>':'')+C.map(function(c){ return '<option value="'+_escAttr(c.id)+'"'+(c.id===E.ref?' selected':'')+'>'+_escHtml(_cmNom(c))+'</option>'; }).join('')+'</select>';
  }
  h+='<label class="mvv-flbl">Quand</label><div style="display:flex;gap:9px;flex-wrap:wrap"><input id="pc-d" class="mvv-tin" type="date" style="flex:1;min-width:140px" value="'+_escAttr(E.date)+'" onchange="_pcSet(\'date\',this.value)"><div class="mvv-optabs" style="flex:1.6;min-width:220px">'
    +[['m','Matin'],['a','Après-midi'],['j','Dans la journée']].map(function(x){ return '<button type="button" class="mvv-optab'+(E.mom===x[0]?' on':'')+'" data-m="'+x[0]+'" onclick="_pcSet(\'mom\',this.dataset.m)">'+x[1]+'</button>'; }).join('')+'</div></div>';
  h+='<label class="mvv-flbl">À qui <span class="mvv-fhint">— l’équipe en contrat ce jour-là</span></label><div class="cm-ls">'+(Q.length?Q.map(function(q){
      var on=!!E.qui[q.nom]&&q.ok;
      return '<button type="button" class="cm-l'+(on?' on':'')+'"'+(q.ok?' data-n="'+_escAttr(q.nom)+'" onclick="_pcSet(\'qui\',this.dataset.n)"':' disabled')+' data-tuto="pc.qui"><span class="cm-box">'+(on?'✓':'')+'</span><span style="flex:1"><b>'+_escHtml(q.nom)+'</b><span class="cm-s">'+_escHtml(q.info)+'</span></span></button>';
    }).join(''):'<div class="cm-l">Aucun membre dans l’équipe (Planning › Équipe).</div>')+'</div>';
  h+='<label class="mvv-flbl">Consigne <span class="mvv-fhint">'+(E.g==='autre'?'— ce qu’il y a à faire':'(facultatif)')+'</span></label><textarea id="pc-note" class="mvv-tin cm-note" rows="2" maxlength="240" data-tuto="pc.note">'+_escHtml(E.note)+'</textarea>';
  var duree=E.mom==='a'?'l’après-midi':(E.mom==='m'?'la matinée':'la journée');
  h+='<button type="button" class="cm-tog" onclick="_pcSet(\'mj\',\'\')"><span style="flex:1"><b>Ça '+(noms.length>1?'leur':'lui')+' prend '+duree+'</b><span class="cm-s" style="display:block;font-size:12.5px;color:var(--texte-doux,#686660)">marque '+(E.mom==='j'?'la journée':'la demi-journée')+' de cave au Planning : ces heures ne comptent plus dans la vigne</span></span><span class="cm-sw'+(E.mj?' on':'')+'"><i></i></span></button>';
  if(noms.length) h+='<div class="mvv-fnote">'+_escHtml(noms.join(' et '))+' '+(noms.length>1?'le verront':'le verra')+' à l’ouverture de l’appli et dans '+(noms.length>1?'leur':'son')+' message du matin, à la prise de poste.</div>';
  h+='<button class="mvv-save" style="margin-top:14px" data-tuto="pc.ok" onclick="savePc()"'+(noms.length?'':' disabled')+'>'+(noms.length?('Confier à '+_escHtml(noms.join(' et '))+' · '+_PC_MOM[E.mom]):'Choisissez une personne')+'</button>';
  if(E.id) h+='<button class="mvbtn mvbtn-discret" style="width:100%;margin-top:8px" onclick="_pcRetirer()">Retirer ce geste confié</button>';
  _cmFeuille(h);
}
function _pcSet(k, v){
  if(!_pcEt) return;
  _pcGarder();
  if(k==='g'){ _pcEt.g=v; var t=_PC_CUVE[v]?'cuve':'cuvee'; if(t!==_pcEt.refT){ _pcEt.refT=t; _pcEt.ref=''; } }
  else if(k==='date'){ if(/^\d{4}-\d{2}-\d{2}$/.test(v)) _pcEt.date=v; }
  else if(k==='mom') _pcEt.mom=(v==='m'||v==='a')?v:'j';
  else if(k==='qui') _pcEt.qui[v]=!_pcEt.qui[v];
  else if(k==='mj') _pcEt.mj=!_pcEt.mj;
  _pcRendre();
}
function savePc(){
  if(!_pcEt) return;
  if(!isAdmin()){ showToast('Seul l’administrateur confie un geste','#B85A1A'); return; }
  _pcGarder();
  var E=_pcEt, Q=_pcEquipe(E.date), qui=Object.keys(E.qui).filter(function(n){ return E.qui[n]&&Q.some(function(q){ return q.nom===n&&q.ok; }); });
  var note=String(E.note||'').trim().slice(0,240);
  if(!qui.length){ showToast('Choisissez au moins une personne','#B85A1A'); return; }   // ⚠ AVANT toute écriture
  if(!/^\d{4}-\d{2}-\d{2}$/.test(E.date)){ showToast('Indiquez le jour','#B85A1A'); return; }
  if(E.g!=='autre'&&!E.ref){ showToast(E.refT==='cuve'?'Choisissez la cuve':'Choisissez la cuvée','#B85A1A'); return; }
  if(E.g==='autre'&&!note){ showToast('Écrivez ce qu’il y a à faire','#B85A1A'); return; }
  var X=_cmCE(); if(!Array.isArray(X.consignes)) X.consignes=[];
  var cs=E.id?X.consignes.filter(function(x){ return x&&x.id===E.id; })[0]:null;
  var champs={g:E.g, ref:E.ref||'', refT:E.refT, nom:_pcNomCible(E.g, E.ref, E.refT), date:E.date, mom:E.mom, qui:qui, note:note};
  if(cs){ Object.assign(cs, champs); delete cs.pas; cs.modif={par:_cmQui(), le:_cmAuj()}; }
  else X.consignes.push(Object.assign({id:'cs_'+Date.now(), par:_cmQui(), cree:new Date().toISOString()}, champs));
  if(E.mj&&typeof window._mvCaveEcrire==='function') window._mvCaveEcrire(qui.map(function(n){ return {iso:E.date, nom:n}; }), E.mom);
  /* Un an de consignes soldées suffit : au-delà, elles ne disent plus rien qu'un registre ne garde déjà. */
  var lim=_cmAddJ(_cmAuj(),-365); X.consignes=X.consignes.filter(function(x){ return x&&(String(x.date||'')>=lim||!_pcSolde(x)); });
  _pcEt=null; _cmFermer();
  _cmEnreg((cs?'Changé : ':'Confié à ')+qui.join(' et ')+' · '+_PC_MOM[champs.mom]+(champs.date===_cmAuj()?'':' le '+_cmFr(champs.date)));
  _cmRepeindre();
}
function _pcRetirer(){
  if(!_pcEt||!_pcEt.id||!isAdmin()) return;
  var X=_cmCE(); X.consignes=(X.consignes||[]).filter(function(x){ return x&&x.id!==_pcEt.id; });
  _pcEt=null; _cmFermer(); _cmEnreg('Geste confié retiré'); _cmRepeindre();
}
function _pcReconfier(id){ var cs=_pcListe().filter(function(x){ return x&&x.id===id; })[0]; if(!cs) return; _pcOuvrir({id:cs.id, g:cs.g, ref:cs.ref, refT:cs.refT, date:(cs.date<_cmAuj()?_cmAuj():cs.date), mom:cs.mom, qui:cs.qui, note:cs.note}); }
/* « Faire » : le geste s'ouvre déjà rempli ; « Autre » se coche. */
function _pcFaire(id){
  var cs=_pcListe().filter(function(x){ return x&&x.id===id; })[0]; if(!cs) return;
  if(cs.g==='autre'){ if(!_cmGarde()) return; cs.fait={par:_cmQui(), le:_cmAuj()}; delete cs.pas; _cmEnreg('Fait : '+(cs.note||'geste confié')); _cmRepeindre(); return; }
  var k=(cs.g==='so2')?'so2':cs.g;
  if(typeof window._mlGo==='function') window._mlGo(k, cs.ref);
}
var _PC_MOTIFS=[['tps','Pas eu le temps'],['prod','Il manque du vin ou un produit'],['aut','Autre']];
var _pcPasEt=null;
function _pcPas(id){
  if(!_cmGarde()) return;
  var cs=_pcListe().filter(function(x){ return x&&x.id===id; })[0]; if(!cs) return;
  _pcPasEt={id:id, motif:(cs.pas&&cs.pas.motif)||''};
  _pcPasRendre();
}
function _pcPasRendre(){
  var cs=_pcPasEt&&_pcListe().filter(function(x){ return x&&x.id===_pcPasEt.id; })[0]; if(!cs) return;
  var h=_cmTete('Pas fait', _escHtml(_pcTexte(cs)));
  h+='<label class="mvv-flbl">Pourquoi ? <span class="mvv-fhint">'+_escHtml(cs.par||'L’administrateur')+' le verra</span></label><div class="mvv-optabs" style="flex-wrap:wrap">'
    +_PC_MOTIFS.map(function(m){ return '<button type="button" class="mvv-optab'+(_pcPasEt.motif===m[0]?' on':'')+'" data-m="'+m[0]+'" onclick="_pcPasMotif(this.dataset.m)">'+m[1]+'</button>'; }).join('')+'</div>'
    +'<label class="mvv-flbl">Un mot <span class="mvv-fhint">(facultatif)</span></label><input id="pc-pas-t" class="mvv-tin" type="text" maxlength="160" placeholder="ex. plus de bentonite">'
    +'<button class="mvv-save" style="margin-top:14px" onclick="savePcPas()"'+(_pcPasEt.motif?'':' disabled')+'>Le dire · le geste reste dans « À faire »</button>';
  _cmFeuille(h);
}
function _pcPasMotif(m){ if(!_pcPasEt) return; var t=_cmVal('pc-pas-t'); _pcPasEt.motif=m; _pcPasRendre(); var el=document.getElementById('pc-pas-t'); if(el) el.value=t; }
function savePcPas(){
  if(!_pcPasEt||!_cmGarde()) return;
  var cs=_pcListe().filter(function(x){ return x&&x.id===_pcPasEt.id; })[0]; if(!cs) return;
  if(!_pcPasEt.motif){ showToast('Dites pourquoi','#B85A1A'); return; }
  cs.pas={motif:_pcPasEt.motif, txt:_cmVal('pc-pas-t').slice(0,160), par:_cmQui(), le:_cmAuj()};
  _pcPasEt=null; _cmFermer(); _cmEnreg('C’est noté'); _cmRepeindre();
}
/* Dans « À faire » (lu par cave.js/_mlAgendaComplet) : une consigne s'accroche à la ligne déduite du même geste sur
   le même contenant le même jour ; sinon elle fait sa ligne. Une consigne passée arrive aujourd'hui, en retard. */
function _pcAgenda(sem, from, pousse){
  _pcOuvertes().forEach(function(cs){
    var d=String(cs.date||'').slice(0,10); if(!d) return;
    var dd=d<from?from:d, kind=(cs.g==='autre')?'consigne':cs.g, ref=cs.ref||cs.id, trouve=null;
    (sem||[]).some(function(s){ return (s.items||[]).some(function(it){ if(it&&it.date===dd&&it.kind===kind&&it.ref===ref&&!it.cs){ trouve=it; return true; } return false; }); });
    var etat=cs.pas?'pas':(d<from?'ret':'conf');
    var info={cs:cs.id, qui:cs.qui||[], pcEtat:etat, pcMom:cs.mom, pcNote:cs.note||'', pcPas:cs.pas||null};
    if(trouve){ Object.assign(trouve, info); if(etat!=='conf') trouve.urgence='due'; return; }
    pousse(dd, Object.assign({kind:kind, titre:cs.g==='autre'?(cs.nom||'Geste confié'):(cs.nom||_pcNomCible(cs.g, cs.ref, cs.refT)),
      detail:(_PC_VERBE[cs.g]||(cs.note||'geste confié'))+(d<from?' · prévu le '+_cmFr(d):''), urgence:etat==='conf'?'':'due', ref:ref}, info));
  });
}
/* La pastille « qui » d'un geste, sous sa raison (lu par cave.js/_aujLigne). */
function _pcPill(it){
  if(!it||!it.cs) return '';
  var pas='';
  if(it.pcEtat==='pas'&&it.pcPas){ var mo=_PC_MOTIFS.filter(function(m){ return m[0]===it.pcPas.motif; })[0]; pas=' : « '+(mo?mo[1].toLowerCase():'')+(it.pcPas.txt?', '+it.pcPas.txt:'')+' »'; }
  var etat=(it.pcEtat==='pas')?'pas fait'+pas:((it.pcEtat==='ret')?'en retard':'confié · '+_PC_MOM[it.pcMom||'j']);
  var t=(it.qui||[]).join(', ')+' — '+etat;
  return '<span class="cm-qui '+it.pcEtat+'">'+_mvIcon('personne',12)+' '+_escHtml(t)+'</span>';
}
/* Le bouton de la ligne : « Confier » (administrateur) pour un geste qui n'a personne, « Reconfier » pour un geste pas
   fait ou en retard ; pour un « Autre » confié, « Fait ». */
function _pcBoutons(x){
  var h='', it=(x.G||[]).filter(function(i){ return i.cs; })[0], libre=(x.G||[]).filter(function(i){ return !i.cs; })[0];
  if(it&&it.kind==='consigne'&&canWrite()&&!isSaisonnier()) h+='<button type="button" class="mvbtn mvbtn-secondaire mvbtn-compact caj-b" data-c="'+_escAttr(it.cs)+'" onclick="event.stopPropagation();_pcFaire(this.dataset.c)">Fait</button>';
  if(!isAdmin()) return h;
  if(it&&(it.pcEtat==='pas'||it.pcEtat==='ret')) h+='<button type="button" class="mvbtn mvbtn-discret mvbtn-compact caj-b" data-c="'+_escAttr(it.cs)+'" onclick="event.stopPropagation();_pcReconfier(this.dataset.c)">Reconfier</button>';
  else if(libre) h+='<button type="button" class="mvbtn mvbtn-discret mvbtn-compact caj-b" data-tuto="auj.confier" data-k="'+_escAttr(libre.kind)+'" data-r="'+_escAttr(libre.ref)+'" data-d="'+_escAttr(libre.date||'')+'" onclick="event.stopPropagation();_pcDepuis(this.dataset.k,this.dataset.r,this.dataset.d)">Confier</button>';
  return h;
}
/* « Pour toi » : en tête de « Aujourd'hui » dans la Cave, les gestes confiés à la personne connectée, du jour et en retard. */
function _pcMiens(nom, iso){
  return _pcOuvertes().filter(function(cs){ return cs&&(cs.qui||[]).indexOf(nom)>=0&&String(cs.date||'')<=iso; })
    .sort(function(a,b){ return String(a.date).localeCompare(String(b.date))||(({m:0,j:1,a:2})[a.mom]-({m:0,j:1,a:2})[b.mom]); });
}
function _pcPourToiHtml(){
  var nom=_cmQui(); if(!nom) return '';
  _cmCss();
  var auj=_cmAuj(), L=_pcMiens(nom, auj);
  var faits=_pcListe().filter(function(cs){ if(!cs||(cs.qui||[]).indexOf(nom)<0||cs.date!==auj) return false; var s=_pcSolde(cs); return !!s; });
  var dem=_pcOuvertes().filter(function(cs){ return cs&&(cs.qui||[]).indexOf(nom)>=0&&cs.date===_cmAddJ(auj,1); });
  if(!L.length&&!faits.length&&!dem.length) return '';
  var w=canWrite()&&!isSaisonnier();
  var h='<section class="mvcarte caj-c" aria-labelledby="pc-pt-t" style="margin-bottom:12px"><div class="caj-h"><span class="caj-vif" aria-hidden="true"></span><h3 class="caj-t" id="pc-pt-t">Pour toi aujourd’hui</h3></div><div class="cm-ls">';
  L.forEach(function(cs){
    var ret=cs.date<auj;
    h+='<div class="cm-l" style="align-items:flex-start"><span class="cm-d '+(ret||cs.pas?'ret':'att')+'" style="margin-top:6px"></span><span style="flex:1;min-width:0"><b>'+_escHtml(_pcTexte(cs))+'</b>'
      +'<span class="cm-s">'+(ret?'prévu le '+_cmFr(cs.date)+' · ':'')+_PC_MOM[cs.mom||'j']+' · confié par '+_escHtml(cs.par||'l’administrateur')+(cs.pas?' · pas fait':'')+'</span>'
      +((cs.note&&cs.g!=='autre')?'<div class="cm-cons">« '+_escHtml(cs.note)+' »</div>':'')
      +(w?'<div class="cm-acts" style="margin-top:8px"><button type="button" class="mvbtn mvbtn-principal mvbtn-compact" data-c="'+_escAttr(cs.id)+'" data-tuto="pt.faire" onclick="_pcFaire(this.dataset.c)">'+(cs.g==='autre'?'C’est fait':'Faire')+'</button>'
        +'<button type="button" class="mvbtn mvbtn-secondaire mvbtn-compact" data-c="'+_escAttr(cs.id)+'" onclick="_pcPas(this.dataset.c)">Pas fait</button></div>':'')+'</span></div>';
  });
  faits.forEach(function(cs){ var s=_pcSolde(cs); h+='<div class="cm-l"><span class="cm-d ok"></span><span style="flex:1"><b style="font-weight:500">'+_escHtml(_pcTexte(cs))+'</b><span class="cm-s">fait'+(s&&s.par?' par '+_escHtml(s.par):'')+'</span></span><span class="cm-r" style="color:var(--vert,#3D6B27);font-weight:700">✓</span></div>'; });
  dem.forEach(function(cs){ h+='<div class="cm-l"><span class="cm-d"></span><span style="flex:1"><b style="font-weight:500">'+_escHtml(_pcTexte(cs))+'</b><span class="cm-s">demain · '+_PC_MOM[cs.mom||'j']+'</span></span></div>'; });
  return h+'</div></section>';
}
/* La carte de l'Accueil de la Vigne (lue par jalons.js/_mvCaveNoteRender). */
function _pcAccueilHtml(nom){
  if(!nom) return '';
  var auj=_cmAuj(), L=_pcMiens(nom, auj); if(!L.length) return '';
  return '<div class="hcn" role="status"><div class="hcn-k">En cave aujourd’hui</div><div class="hcn-t">'+L.length+' geste'+(L.length>1?'s':'')+' pour toi : <b>'+_escHtml(L.slice(0,3).map(_pcTexte).join(' · '))+'</b>'+(L.length>3?'…':'')+'.</div>'
    +'<button type="button" class="hcn-vu" onclick="_pcAllerCave()">Voir</button></div>';
}
function _pcAllerCave(){ if(typeof window.goTo==='function') window.goTo('cave'); if(typeof window.selectCaveSection==='function') window.selectCaveSection('aujourdhui'); }
/* Les lignes du message du matin d'une personne pour un jour (lu par reglages.js/_mvNotifLignes). */
function _pcNotifLignes(nom, iso){
  var L=_pcOuvertes().filter(function(cs){ return cs&&cs.date===iso&&(cs.qui||[]).indexOf(nom)>=0; }), out=[];
  [['m','En cave ce matin'],['a','En cave cet après-midi'],['j','En cave aujourd’hui']].forEach(function(x){
    var l=L.filter(function(cs){ return (cs.mom||'j')===x[0]; }); if(!l.length) return;
    out.push(x[1]+' : '+l.map(function(cs){ return _pcTexte(cs).charAt(0).toLowerCase()+_pcTexte(cs).slice(1); }).join(' ; '));
  });
  return out;
}

/* ═══ La frontière : les gestes (onclick) et ce que lisent cave.js, reserve.js, jalons.js, reglages.js ═══════════ */
window.openMasse=openMasse; window._msVers=_msVers; window.saveMasse=saveMasse;
window.openMisePrev=openMisePrev; window._mpDate=_mpDate; window._mpPar=_mpPar; window._mpFmt=_mpFmt; window.saveMisePrev=saveMisePrev; window._mpRetirer=_mpRetirer;
window.openMise=openMise; window._miPar=_miPar; window._miFmt=_miFmt; window._miFmtLive=_miFmtLive; window._cmQMan=_cmQMan; window._miFinSet=_miFinSet; window.saveMise=saveMise;
window._cmMsChoix=_cmMsChoix; window._cmCarton=_cmCarton; window._cmCocher=_cmCocher;
window._cmMiseAnnuler=_cmMiseAnnuler; window._cmStockCorriger=_cmStockCorriger; window._cmNbCorriger=_cmNbCorriger;
window._cmBouteilles=_cmBouteilles; window._cmConsoMise=_cmConsoMise;
window._cmOpSel=_cmOpSel; window._cmOpDim=_cmOpDim; window._cmOpExtra=_cmOpExtra; window._cmOpSet=_cmOpSet; window._cmOpData=_cmOpData;
window._cmOpPrefill=_cmOpPrefill; window._cmOpVue=_cmOpVue; window._cmOpLignes=_cmOpLignes; window._cmOpTitre=_cmOpTitre; window._cmOpMasse=_cmOpMasse; window._cmColleOpts=_cmColleOpts;
window._cmAgenda=_cmAgenda; window._cmGo=_cmGo; window._cmParcoursHtml=_cmParcoursHtml;
window._pcOuvrir=_pcOuvrir; window._pcDepuis=_pcDepuis; window._pcSet=_pcSet; window.savePc=savePc; window._pcRetirer=_pcRetirer;
window._pcReconfier=_pcReconfier; window._pcFaire=_pcFaire; window._pcPas=_pcPas; window._pcPasMotif=_pcPasMotif; window.savePcPas=savePcPas;
window._pcAgenda=_pcAgenda; window._pcPill=_pcPill; window._pcBoutons=_pcBoutons; window._pcPourToiHtml=_pcPourToiHtml;
window._pcAccueilHtml=_pcAccueilHtml; window._pcAllerCave=_pcAllerCave; window._pcNotifLignes=_pcNotifLignes;

export { _cmFmtL, _cmFmtN, _cmBesoins, _cmChecks, _cmAllergeneDe, _cmColle, _cmAgenda, _cmEtapes, _pcSolde, _pcAgenda, _pcNotifLignes, _cmConsoMise, _miLotDefaut };
