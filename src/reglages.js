// ════════════════════════════════════════════════════════════════════
// MA VIGNE — src/reglages.js
// Module Réglages (config domaine, membres, tâches, historique, export)
// Phase 3b — extrait depuis app.js
// © 2026 Nicolas GUERET / GUERETTECH
// ════════════════════════════════════════════════════════════════════
//
// Dépendances (via window.*) :
//   window.saveData          ← app.js
//   window.MEMBRES/TACHES/SAISONS/PARCELLES/JOURNAL/SESSIONS
//   window.TRAITEMENTS/TRAVAUX/ACTIVITES/CATALOGUE/HISTORIQUE
//   window.TRACTEURS_LIST/SAISON_PASSAGES/CONFIG/DOMAINE_NOM
//   window.DANGER_CFG/TACHES_CATALOGUE/SURF_TOTALE/rolesTemp
//   window.getSaisonActive/getTachesSaison/getPCls/recalcTravaux
//   window.renderHome/renderParcelles/renderTracteur/computePStats
//   window.openOv/closeOv/openOvDanger/openConfirmDel/pickVal
//   window.couleurTracType/firebase
//   window.TENANT_ID        ← firebase.js
//   window.createAuthAccount ← firebase.js
//
// ════════════════════════════════════════════════════════════════════

import { isAdmin, showToast, _escHtml, _escAttr, deepClone, _swNotify, tNom, TEMOJI, TABREV, getRoleLabel } from './utils.js';

const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if(DEBUG) console.log('[Ma Vigne] reglages.js chargé — ' + new Date().toISOString());

var reglTab = 'domaine';

// deepClone — centralisé dans utils.js (Patch 3)

function calcEtpLive(){
  const d=parseFloat(document.getElementById('etp-h-dues')?.value)||0;
  const f=parseFloat(document.getElementById('etp-h-faites')?.value)||0;
  const resEl=document.getElementById('etp-result-val');
  const lblEl=document.getElementById('etp-calc-label');
  if(!resEl)return;
  if(d>0&&f>0){
    const etp=(f/d).toFixed(2);
    resEl.textContent=etp;
    resEl.style.color=parseFloat(etp)>=1?'var(--vert)':'var(--orange,#C8913A)';
    if(lblEl)lblEl.textContent=f+'h ÷ '+d+'h';
  } else {
    resEl.textContent='—';
    resEl.style.color='var(--acier)';
    if(lblEl)lblEl.textContent='—';
  }
}
// ── Liaison Planning → PDF mensuel ──
function planFillPDFFromMonth(moisVal){
  if(!moisVal)return;
  var m=parseInt(moisVal.split('-')[1])-1; // 0-based
  var mbrs=(typeof window._planMbrs==='function')?window._planMbrs():[];
  var hEl=document.getElementById('pdf-heures');
  var dEl=document.getElementById('pdf-heures-dues');
  var bH=document.getElementById('pdf-badge-h');
  var bD=document.getElementById('pdf-badge-d');
  if(mbrs.length&&typeof window._planCalcMonth==='function'&&typeof window._planGetRefH==='function'){
    var tw=mbrs.reduce(function(s,mbr){return s+window._planCalcMonth(mbr,m);},0);
    var tr=mbrs.reduce(function(s,mbr){return s+window._planGetRefH(window._planPlId(mbr),m);},0);
    // Compter les membres ayant des heures planifiées ou travaillées ce mois
    var nbMbres=mbrs.filter(function(mbr){return window._planCalcMonth(mbr,m)>0||window._planGetRefH(window._planPlId(mbr),m)>0;}).length;
    var nbEl=document.getElementById('pdf-nb-membres');
    if(nbEl)nbEl.value=nbMbres||1;
    if(hEl&&tw>0){hEl.value=Math.round(tw*10)/10;hEl.style.borderColor='#4A9FC8';hEl.style.background='rgba(74,159,200,0.07)';}
    if(dEl&&tr>0){dEl.value=Math.round(tr*10)/10;dEl.style.borderColor='#4A9FC8';dEl.style.background='rgba(74,159,200,0.07)';}
    if(bH&&tw>0){bH.textContent='\uD83D\uDD17 planning';bH.style.color='#4A9FC8';bH.style.background='rgba(74,159,200,0.12)';}
    if(bD&&tr>0){bD.textContent='\uD83D\uDD17 planning';bD.style.color='#4A9FC8';bD.style.background='rgba(74,159,200,0.12)';}
    // Détail par salarié
    var detEl=document.getElementById('pdf-detail-rows');
    if(detEl){
      var rows='';
      mbrs.forEach(function(mbr){
        var w=window._planCalcMonth(mbr,m);
        var r=window._planGetRefH(window._planPlId(mbr),m);
        if(!w&&!r)return;
        var etp=r>0?(w/r*100).toFixed(0):'—';
        var etpColor=r>0?(w/r>=0.98?'#3D6B27':w/r>=0.90?'#C8913A':'#C0392B'):'var(--texte-doux)';
        rows+='<div style="display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid var(--gris)">'
          +'<div style="font-size:12px;color:var(--texte-doux);flex:1">'+_escHtml(mbr.nom)+'</div>'
          +'<div style="font-size:12px;font-weight:700;color:var(--texte);min-width:36px;text-align:right">'+window._planFmt(w)+'</div>'
          +'<div style="font-size:11px;color:var(--texte-doux);min-width:36px;text-align:right">/ '+window._planFmt(r)+'</div>'
          +'<div style="font-size:11px;font-weight:700;color:'+etpColor+';min-width:30px;text-align:right">'+etp+'%</div>'
          +'</div>';
      });
      detEl.innerHTML=rows||'<div style="font-size:12px;color:var(--texte-doux);padding:6px 0">Aucune donn\u00e9e planning pour ce mois</div>';
    }
  }
  calcEtpLivePdf();
}
function calcEtpLivePdf(){
  var h=parseFloat(document.getElementById('pdf-heures')?.value)||0;
  var d=parseFloat(document.getElementById('pdf-heures-dues')?.value)||0;
  var nb=parseInt(document.getElementById('pdf-nb-membres')?.value)||1;
  var ratio=d>0?h/d:0;
  var etp=ratio*nb;
  var hEl=document.getElementById('pdf-prev-h');
  var dEl=document.getElementById('pdf-prev-ref');
  var eEl=document.getElementById('pdf-prev-etp');
  if(hEl)hEl.textContent=h>0?(Math.round(h*10)/10)+'h':'—';
  if(dEl)dEl.textContent=d>0?(Math.round(d*10)/10)+'h':'—';
  if(eEl){eEl.textContent=d>0?etp.toFixed(2):'—';eEl.style.color=d>0?(ratio>=0.98?'#3D6B27':ratio>=0.90?'#C8913A':'#C0392B'):'var(--texte-doux)';}
}
function onPdfManualEdit(fieldId,badgeId){
  var el=document.getElementById(fieldId);
  var badge=document.getElementById(badgeId);
  if(el){el.style.borderColor='#C8913A';el.style.background='rgba(200,145,58,0.07)';}
  if(badge){badge.textContent='\u270F\uFE0F modifi\u00e9';badge.style.color='#C8913A';badge.style.background='rgba(200,145,58,0.12)';}
  calcEtpLivePdf();
}
function pdfDetailToggle(){
  var p=document.getElementById('pdf-detail-panel');
  var t=document.getElementById('pdf-detail-toggle');
  if(!p||!t)return;
  var open=p.style.display!=='none';
  p.style.display=open?'none':'block';
  t.textContent=open?'\u25BE D\u00e9tail par salari\u00e9':'\u25B4 Masquer le d\u00e9tail';
}

function saveEtpSaison(){
  const d=parseFloat(document.getElementById('etp-h-dues')?.value)||0;
  const f=parseFloat(document.getElementById('etp-h-faites')?.value)||0;
  if(!window.CONFIG)window.CONFIG={};
  const _sel=document.getElementById('etp-season-sel');
  const _act=((window.getSaisonActive&&window.getSaisonActive())||{}).nom||'';
  const _nom=(_sel&&_sel.value)||_act;
  if(!window.CONFIG.etp_saisons||typeof window.CONFIG.etp_saisons!=='object')window.CONFIG.etp_saisons={};
  window.CONFIG.etp_saisons[_nom]={h_dues:d,h_faites:f};
  if(_nom===_act)window.CONFIG.etp_saison={h_dues:d,h_faites:f};
  window.saveData('config','\u23F1 Heures \u00ab '+_nom+' \u00bb enregistr\u00e9es');
}
// Charge les heures de la saison choisie (par saison : CONFIG.etp_saisons[nom] ; repli legacy si active).
function _etpLoadSeason(){
  const sel=document.getElementById('etp-season-sel');
  const act=((window.getSaisonActive&&window.getSaisonActive())||{}).nom||'';
  const nom=(sel&&sel.value)||act;
  const map=(window.CONFIG&&window.CONFIG.etp_saisons)||{};
  const dd=map[nom]||(nom===act?((window.CONFIG&&window.CONFIG.etp_saison)||{}):{});
  const inDues=document.getElementById('etp-h-dues');
  const inFaites=document.getElementById('etp-h-faites');
  if(inDues)inDues.value=dd.h_dues||'';
  if(inFaites)inFaites.value=dd.h_faites||'';
  const lbl=document.getElementById('etp-season-lbl');
  if(lbl)lbl.textContent='Heures de \u00ab '+nom+' \u00bb';
  if(typeof calcEtpLive==='function')calcEtpLive();
}
window._etpLoadSeason=_etpLoadSeason;
function switchReglTab(tab){
  reglTab=tab;
  ['domaine','vigne','equipe','tracteur','app'].forEach(function(t){
    var btn=document.getElementById('regl-tbtn-'+t);
    var view=document.getElementById('regl-view-'+t);
    if(btn)btn.classList.toggle('active',t===tab);
    if(view)view.style.display=t===tab?'block':'none';
  });
}

function renderReglages(){
  if(!window._dataReady){ var _rml=document.getElementById('membres-list'); if(_rml)_rml.innerHTML=window._mvSk('reglages'); return; }
  // Stats band en-tête
  const smb=document.getElementById('regl-stat-membres');
  const stk=document.getElementById('regl-stat-taches');
  const str=document.getElementById('regl-stat-tracteurs');
  if(smb)smb.textContent=window.MEMBRES.length;
  if(stk)stk.textContent=window.TACHES.length;
  if(str)str.textContent=window.TRACTEURS_LIST.length;

  // Badge rôle dans l'en-tête
  const roleB=document.getElementById('regl-role-badge');
  if(roleB){
    const rLabel=getRoleLabel(window.currentUser?window.currentUser.roles:[]);
    roleB.textContent=rLabel;
    const isA=isAdmin();
    roleB.style.background=isA?'rgba(61,107,39,0.2)':'rgba(74,159,200,0.2)';
    roleB.style.color=isA?'#7CB95A':'#4A9FC8';
    roleB.style.border='1px solid '+(isA?'rgba(61,107,39,0.3)':'rgba(74,159,200,0.3)');
  }
  // Masquer export/import pour non-admins
  var _expRow=document.getElementById('regl-export-row');
  if(_expRow) _expRow.style.display=isAdmin()?'':'none';

  // Aperçu domaine — avancement global saison + window.DOMAINE_NOM
  const tachesSaison=window.getTachesSaison();
  const parcActives=window.PARCELLES.filter(p=>p.statut!=='Arrachee');
  const totalCases=tachesSaison.length*parcActives.length;
  const totalVal=parcActives.reduce((sum,p)=>sum+tachesSaison.filter(t=>p.taches&&p.taches[t.nom]==='Validé').length,0);
  const pctGlobal=totalCases>0?Math.round(totalVal/totalCases*100):0;
  const saison=window.getSaisonActive();
  const sub=document.getElementById('dom-badge-sub');
  if(sub)sub.textContent=`${saison.nom} · ${pctGlobal}% accompli · ${parcActives.length} parcelles · ${parcActives.reduce((s,p)=>s+(parseFloat(p.surface)||0),0).toLocaleString('fr-FR',{minimumFractionDigits:0,maximumFractionDigits:2})} ha`;
  // Appliquer window.DOMAINE_NOM dans le badge
  const domNomEl=document.getElementById('dom-badge-nom');
  if(domNomEl)domNomEl.textContent=window.DOMAINE_NOM;
  // Ligne édition du nom (admin uniquement)
  const domEditRow=document.getElementById('set-row-domaine-nom');
  if(domEditRow){
    const domValEl=document.getElementById('dom-nom-val');
    if(domValEl)domValEl.textContent=window.DOMAINE_NOM;
  }

  // Onglets : admin = 5 onglets (Domaine · Vigne · Équipe · Tracteur · App) ; non-admin = App seul
  const _tabsRow=document.getElementById('regl-tabs-row');
  const _pDomaine=document.getElementById('regl-view-domaine');
  const _pVigne=document.getElementById('regl-view-vigne');
  const _pEquipe=document.getElementById('regl-view-equipe');
  const _pTrac=document.getElementById('regl-view-tracteur');
  const _pApp=document.getElementById('regl-view-app');
  const secDanger=document.getElementById('set-sec-danger');
  if(isAdmin()){
    if(_tabsRow)_tabsRow.style.display='';
    if(secDanger)secDanger.style.display='';
    switchReglTab(reglTab);
  } else {
    if(_tabsRow)_tabsRow.style.display='none';
    if(_pDomaine)_pDomaine.style.display='none';
    if(_pVigne)_pVigne.style.display='none';
    if(_pEquipe)_pEquipe.style.display='none';
    if(_pTrac)_pTrac.style.display='none';
    if(_pApp)_pApp.style.display='block';
    if(secDanger)secDanger.style.display='none';
  }
  // Bloc ETP — admin uniquement, pré-remplir depuis window.CONFIG
  const secEtp=document.getElementById('set-sec-etp');
  if(secEtp){
    secEtp.style.display=isAdmin()?'':'none';
    if(isAdmin()){
      if(!window.CONFIG)window.CONFIG={};
      const _actE=((window.getSaisonActive&&window.getSaisonActive())||{}).nom||'';
      if(!window.CONFIG.etp_saisons||typeof window.CONFIG.etp_saisons!=='object')window.CONFIG.etp_saisons={};
      if(window.CONFIG.etp_saison&&_actE&&!window.CONFIG.etp_saisons[_actE])window.CONFIG.etp_saisons[_actE]={h_dues:window.CONFIG.etp_saison.h_dues||0,h_faites:window.CONFIG.etp_saison.h_faites||0};
      const _selE=document.getElementById('etp-season-sel');
      if(_selE){
        const _arrE=(window.SAISONS||[]).slice().sort(function(a,b){return (b.debut||'').localeCompare(a.debut||'');});
        _selE.innerHTML=(_arrE.length?_arrE:[{nom:_actE}]).map(function(s){var e=window._escAttr?window._escAttr(s.nom):s.nom;var h=window._escHtml?window._escHtml(s.nom):s.nom;return '<option value="'+e+'"'+(s.nom===_actE?' selected':'')+'>'+h+(s.nom===_actE?' (active)':'')+'</option>';}).join('');
        _selE.onchange=window._etpLoadSeason;
      }
      if(window._etpLoadSeason)window._etpLoadSeason();
    }
  }

  if(isAdmin()){
    // Saisons
    const sl=document.getElementById('saisons-list');
    if(sl){
      // On filtre l'AFFICHAGE, jamais le tableau : data-idx doit rester l'index reel dans
      // window.SAISONS, sinon editer une periode en modifierait une autre.
      var _visSet=_cmpVisibles();
      sl.innerHTML=_cmpFrise()+window.SAISONS.map(function(s,i){return {s:s,i:i};})
        .filter(function(o){return _visSet.indexOf(o.s)>=0;})
        .map(function(o){
        var s=o.s, i=o.i;
        var nbT=Array.isArray(s.taches)?s.taches.length:0;
        var meta=(s.debut&&s.fin)?(_cmpFr(s.debut)+' \u2192 '+_cmpFr(s.fin))
                                 :'\u26A0 Dates manquantes';
        meta+=' \u00b7 '+nbT+' t\u00e2che'+(nbT>1?'s':'');
        return '<div class="per-card'+(s.active?' on':'')+'">'
          +'<span class="per-dot" style="background:'+_CMP_COLS[i%_CMP_COLS.length]+'"></span>'
          +'<div class="per-id sc-info" data-idx="'+i+'">'
            +'<div class="per-nom">'+_escHtml(s.nom)+(s.active?'<span class="per-badge">Active</span>':'')+'</div>'
            +'<div class="per-meta">'+_escHtml(meta)+'</div>'
          +'</div>'
          +'<div class="per-act">'
            +'<button class="sc-edit-saison" data-idx="'+i+'" title="Modifier">\u270f\ufe0f</button>'
            +'<button class="sc-del-saison dgr" data-idx="'+i+'" title="Supprimer">\ud83d\uddd1</button>'
          +'</div>'
        +'</div>';
      }).join('')+_cmpLienArchives()+'<button onclick="window._repairSessSaisons&&window._repairSessSaisons()" style="width:100%;margin-top:10px;padding:11px;border:1.5px solid var(--gris-clair);border-radius:11px;background:var(--bg-app);color:var(--texte-doux);font-family:inherit;font-size:13px;font-weight:600;cursor:pointer">🔧 Recaler les sessions tracteur sur leur saison</button>'+'<button onclick="window._mvRepairSaisonProg&&window._mvRepairSaisonProg()" style="width:100%;margin-top:8px;padding:11px;border:1.5px solid var(--gris-clair);border-radius:11px;background:var(--bg-app);color:var(--texte-doux);font-family:inherit;font-size:13px;font-weight:600;cursor:pointer">🩹 Reconstruire l’avancement d’après le journal</button>';
      sl.querySelectorAll('.sc-info').forEach(function(el){
        el.addEventListener('click',function(){activateSaison(window.SAISONS[+el.dataset.idx].nom);});
      });
      sl.querySelectorAll('.sc-edit-saison').forEach(function(el){
        el.addEventListener('click',function(e){e.stopPropagation();openEditSaison(window.SAISONS[+el.dataset.idx].nom);});
      });
      sl.querySelectorAll('.sc-del-saison').forEach(function(el){
        el.addEventListener('click',function(e){e.stopPropagation();deleteSaison(window.SAISONS[+el.dataset.idx].nom);});
      });
    }
    // Ecartements de plantation (onglet Vigne). La saisie reste _tcvSetDens(), qui
    // rappelle renderReglages() : cette ligne se remet a jour toute seule. textContent,
    // donc aucune interpolation HTML (C19).
    var _densSub=document.getElementById('regl-dens-sub');
    if(_densSub){
      var _dvR=(window._mvVigne?window._mvVigne():null);
      _densSub.textContent=_dvR
        ? (String(_dvR.ec_rang).replace('.',',')+' \u00d7 '+String(_dvR.ec_pied).replace('.',',')
           +' m \u00b7 '+_dvR.pieds.toLocaleString('fr-FR')+' pieds/ha')
        : 'Non renseign\u00e9s \u2014 le bar\u00e8me suppose 10 000 pieds/ha';
    }
    _ecoRenderConfigCard();
    // Tâches
    // Source unique : la liste portée par la période consultée (et non plus le 1er mot de son nom).
    document.getElementById('taches-saison-label').textContent=(window._visuSaison?window._visuSaison():window.getSaisonActive().nom);
    const tachesList=document.getElementById('taches-config-list');
    const tachesFiltrees=window.getTachesSaison();
    _tcvInjectCss();
    // Le barème n'est plus un bandeau en tête de liste : il est devenu le PREMIER des
    // deux boutons d'ajout, sous la liste (index.html) — « ＋ Nouvelle tâche selon le
    // barème de la convention » à côté de « ＋ Nouvelle tâche libre ». Même cible :
    // window.openTacheConv(''). Le compteur de travaux vit désormais dans le modal.
    tachesList.innerHTML=tachesFiltrees.map(t=>{
      var catRef=window._tacheConvRef?window._tacheConvRef(t):window.TACHES_CATALOGUE.find(function(c){return c.nom===t.nom;});
      // Vue a travers le bareme regional du domaine : un girondin ne doit pas etre
      // compare aux heures de la Cote de Nuits.
      if(catRef&&window._mvBaremeRef) catRef=window._mvBaremeRef(catRef);
      var _horsBar=!!(catRef&&catRef._horsBareme);
      var lbl=(catRef&&catRef.label)||t.nom;
      var typeBadge=t.type==='niveaux'?'<span style="font-size:10px;background:rgba(74,159,200,0.15);color:#4A9FC8;border-radius:4px;padding:1px 6px;margin-left:4px;font-weight:600">niveaux</span>':
        t.type==='passages'?'<span style="font-size:10px;background:rgba(90,156,74,0.15);color:#6AB855;border-radius:4px;padding:1px 6px;margin-left:4px;font-weight:600">passages</span>':'';
      var srcBadge=t.trous?'<span style="font-size:10px;background:rgba(74,159,200,0.16);color:#4A9FC8;border-radius:4px;padding:1px 6px;margin-left:4px;font-weight:600">🪛 tarière</span>':
        t.tempsReel?'<span style="font-size:10px;background:rgba(138,90,56,0.15);color:#8A5A38;border-radius:4px;padding:1px 6px;margin-left:4px;font-weight:600">⏱️ temps réel</span>':'';
      var isMod=false;
      if(catRef&&!catRef.trous&&!catRef.tempsReel&&!_horsBar){
        // Comparaison contre le bareme RAMENE a la densite : un domaine correctement
        // cale sur ses ecartements ne doit porter aucun marqueur.
        var _refH=(window._mvHhaDens?window._mvHhaDens(catRef.hha):catRef.hha);
        var isModHha=t.hha!==_refH;
        var isModPass=catRef.passagesHha&&t.passagesHha&&JSON.stringify(t.passagesHha)!==JSON.stringify(catRef.passagesHha);
        var isModNiv=catRef.niveaux&&t.niveaux&&JSON.stringify(t.niveaux.map(function(n){return n.hha;}))!==JSON.stringify(catRef.niveaux.map(function(n){return n.hha;}));
        isMod=isModHha||isModPass||isModNiv;
      }
      // Le barème de la convention est une RÉFÉRENCE, pas une règle : un vigneron ajuste
      // ses heures selon l'état de ses vignes, et l'accord lui-même prévoit qu'employeur
      // et salarié s'entendent sur les vignes en mauvais état. Le badge « ✎ modifié »,
      // en brun d'alerte, présentait donc un choix légitime comme une anomalie — chez un
      // domaine client, trois tâches le portaient sans que personne n'y ait touché : ce
      // sont des valeurs posées à l'installation.
      var modBadge=isMod?'<span style="font-size:9px;font-weight:700;background:rgba(61,107,39,0.14);color:var(--vert-med);border-radius:3px;padding:1px 5px;margin-left:5px">votre valeur</span>':'';
      // Les deux chiffres côte à côte valent mieux qu'un jugement : on montre la valeur
      // conventionnelle ET celle du domaine, sur la même ligne.
      var vosTxt='';
      if(isMod){
        if(t.type==='niveaux'&&t.niveaux&&t.niveaux.length) vosTxt=' · chez vous : '+t.niveaux.reduce(function(s,n){return s+(Number(n.hha)||0);},0);
        else if(t.type==='passages'&&t.passagesHha&&t.passagesHha.length) vosTxt=' · chez vous : '+t.passagesHha.join('/');
        else if(t.hha!=null) vosTxt=' · chez vous : '+t.hha;
      }
      var hhaInfo;
      if(t.trous){ var _mtv=(window.CONFIG&&parseFloat(CONFIG.plantation_min_trou))||3; hhaInfo='🪛 Piloté par tarière · '+_mtv+' min/trou'; }
      else if(t.tempsReel){ hhaInfo=t.hha?('~'+t.hha+'h/ha estimé · temps réel'):'Temps réel · pas d&#39;h/ha conventionnel'; }
      else if(t.type==='niveaux'&&t.niveaux){ hhaInfo=t.niveaux.map(n=>'N'+n.num+':'+n.hha+'h').join('/')+' · Total: '+Math.round(t.hha*window.SURF_TOTALE)+'h'; }
      else { hhaInfo=t.hha+'h/ha · Total: '+Math.round(t.hha*window.SURF_TOTALE)+'h'; }
      var convTxt;
      if(!catRef){ convTxt='Hors convention'; }
      else if(catRef.trous){ convTxt='Convention : temps réel (tarière)'; }
      else if(catRef.tempsReel){ convTxt='Convention : temps réel'; }
      else if(catRef.type==='niveaux'&&catRef.niveaux){ convTxt='Convention : '+catRef.niveaux.reduce(function(s,n){return s+n.hha;},0)+' h/ha'; }
      else if(catRef.type==='passages'&&catRef.passagesHha){ convTxt='Convention : '+catRef.passagesHha.join('/')+' h/ha'; }
      else if(_horsBar){ convTxt='Ce barème ne prévoit pas ce travail'; }
      else { convTxt='Convention : '+catRef.hha+' h/ha'+((window._mvHhaDens&&window._mvHhaDens(catRef.hha)!==catRef.hha)?(' · à votre densité : '+window._mvHhaDens(catRef.hha)):''); }
      var _chip=function(txt,yr){return '<span style="font-size:9px;font-weight:700;border-radius:10px;padding:1px 7px;margin-right:3px;background:'+(yr?'rgba(61,107,39,0.14)':'var(--gris-clair)')+';color:'+(yr?'var(--vert-med)':'var(--texte-med)')+'">'+txt+'</span>';};
      var sChips=t.anytime?_chip('🗓️ Toute l&#39;année',true):(t.saisons||[]).map(function(st){return _chip(_escHtml(st),false);}).join('');
      var nomEsc=_escAttr(t.nom);
      var isStd=(window.TACHES_CATALOGUE||[]).some(function(c){return c.nom===t.nom;});
      var convCol=catRef?'var(--vert-med)':'var(--bordeaux,#7A1020)';
      var convHtml;
      if(isStd){
        convHtml='<div style="font-size:10px;color:'+convCol+';font-weight:600;margin-top:2px">📋 '+convTxt+vosTxt+'</div>';
      } else {
        var convLbl=t.conv
          ? ('📋 Rattachée à « '+_escHtml((catRef&&catRef.label)||t.conv)+' » · '+convTxt.replace('Convention : ','')+vosTxt)
          : '📋 Hors convention · 🔗 Rattacher';
        convHtml='<div class="tcv-lnk" onclick="event.stopPropagation();window.openTacheConv(\''+nomEsc+'\')" style="color:'+convCol+'">'+convLbl+'</div>';
      }
      return `<div class="tache-config-row"><div class="tcr-info"><div class="tcr-nom">${TEMOJI[t.nom]||'🌿'} ${_escHtml(lbl)}${typeBadge}${srcBadge}${modBadge}</div><div class="tcr-hha">${hhaInfo}</div>${convHtml}<div style="margin-top:3px">${sChips}</div></div><div style="display:flex;gap:6px;align-items:center;flex-shrink:0"><button onclick="openEditHha('${nomEsc}')" style="background:rgba(74,159,200,0.1);border:1px solid rgba(74,159,200,0.28);border-radius:8px;padding:5px 8px;font-size:13px;cursor:pointer;color:#4A9FC8;min-height:44px;min-width:44px">✏️</button><div class="tcr-del" onclick="removeTacheFromSaison('${nomEsc}')" title="Retirer de cette saison">🗑</div></div></div>`;
    }).join('');
    // Config passages + niveaux (multi-opérations)
    var passConfigEl=document.getElementById('passages-config-list');
    if(passConfigEl&&isAdmin()){
      var passHtml='';
      var _multiTasks=[
        {nom:'Ebourgeonnage',type:'passages'},
        {nom:'Pioche',type:'passages'},
        {nom:'Relevage',type:'niveaux'}
      ];
      _multiTasks.forEach(function(taskCfg){
        var nom=taskCfg.nom;
        var tDef=window.TACHES.find(function(t){return t.nom===nom;});
        if(!tDef)return;
        var defaultNb=taskCfg.type==='niveaux'?3:2;
        var n=window.SAISON_PASSAGES[nom]||defaultNb;
        var btnsSP=[1,2,3].map(function(nb){
          var sel=(n===nb);
          return '<button onclick="saveSaisonPassages(\''+nom+'\','+nb+')" style="padding:5px 10px;border-radius:8px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid '+(sel?'rgba(192,132,90,0.5)':'rgba(255,255,255,0.1)')+';background:'+(sel?'rgba(192,132,90,0.18)':'rgba(255,255,255,0.04)')+';color:'+(sel?'var(--accent)':'var(--texte-doux)')+'">'+nb+'</button>';
        }).join('');
        var subRows='';
        if(taskCfg.type==='passages'){
          var phha=(tDef.passagesHha)||[];
          for(var pp=1;pp<=n;pp++){
            var curHha=phha[pp-1]!=null?phha[pp-1]:tDef.hha;
            subRows+='<div style="display:inline-flex;align-items:center;gap:4px;margin-right:6px">'
              +'<span style="font-size:11px;color:var(--texte-doux)">P'+pp+'</span>'
              +'<input type="number" min="0" max="200" value="'+curHha+'" data-tache="'+nom+'" data-pass="'+pp+'" class="pp-hha-input"'
              +' style="width:44px;padding:3px 5px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:var(--texte);font-size:12px;text-align:center">'
              +'<span style="font-size:10px;color:var(--texte-doux)">h</span>'
              +'</div>';
          }
        } else {
          // Niveaux : afficher les h/ha par niveau (lecture seule pour l'instant)
          var nivsRef=tDef.niveaux||[{num:1,hha:50},{num:2,hha:25},{num:3,hha:25}];
          for(var nn=1;nn<=n;nn++){
            var nivRef=nivsRef.find(function(x){return x.num===nn;})||{hha:50};
            subRows+='<span style="display:inline-flex;align-items:center;gap:4px;margin-right:8px;font-size:11px;color:var(--texte-doux)">N'+nn+' · '+nivRef.hha+'h/ha</span>';
          }
        }
        passHtml+='<div style="padding:10px 0;border-bottom:1px solid var(--gris-clair)">'
          +'<div style="display:flex;align-items:center;justify-content:space-between">'
            +'<div style="font-size:13px;font-weight:600;color:var(--texte)">'+(TEMOJI[nom]||'🔄')+' '+nom+'</div>'
            +'<div style="display:flex;align-items:center;gap:3px"><span style="font-size:10px;color:var(--texte-doux);margin-right:2px">'+(taskCfg.type==='niveaux'?'niveaux':'passages')+' :</span>'+btnsSP+'</div>'
          +'</div>'
          +(subRows?'<div style="display:flex;flex-wrap:wrap;margin-top:5px">'+subRows+'</div>':'')

          +'</div>';
      });
      var passSecEl=document.getElementById('passages-config-section');
      if(passSecEl)passSecEl.style.display=isAdmin()&&passHtml?'block':'none';
      passConfigEl.innerHTML=passHtml||'';
      passConfigEl.querySelectorAll('.pp-hha-input').forEach(function(el){
        el.addEventListener('change',function(){savePassageHha(el.dataset.tache,+el.dataset.pass,+el.value);});
      });
    }
    // Membres
    const ml=document.getElementById('membres-list');
    if(ml){
      var _toDay=new Date();_toDay.setHours(0,0,0,0);
      var _toDayIso=_toDay.getFullYear()+'-'+String(_toDay.getMonth()+1).padStart(2,'0')+'-'+String(_toDay.getDate()).padStart(2,'0');
      var _in30=new Date(_toDay);_in30.setDate(_in30.getDate()+30);
      var _dsP=function(d){if(!d)return null;var p=d.split('-');return new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));}
      var _RENOUV=['CDD','TESA','Saisonnier','Extra'];
      // ★ UNE SEULE SOURCE : la fin du contrat. Avant, remplir le champ facultatif
      // `renouvellement_date` ETEIGNAIT cette alerte (`if(!m.renouvellement_date
      // && fin...)`) : annoncer un renouvellement pour janvier faisait taire
      // l'application sur un CDD qui se terminait en aout. La fin de contrat est
      // toujours renseignee sur un CDD, l'alerte ne peut donc plus se taire.
      var _alertes=window.MEMBRES.filter(function(m){
        var tc=m.type_contrat||'CDI';if(_RENOUV.indexOf(tc)<0)return false;
        var fd=_dsP(m.fin_contrat);
        return !!(fd&&fd>=_toDay&&fd<=_in30);
      });
      var _ab=document.getElementById('contrats-alertes');
      if(!_ab){_ab=document.createElement('div');_ab.id='contrats-alertes';ml.parentNode.insertBefore(_ab,ml);}
      if(_alertes.length>0){
        _ab.innerHTML='<div style="background:var(--tag-amber-bg,#fef3c7);border:1.5px solid #f59e0b;border-radius:12px;padding:12px 14px;margin-bottom:12px">'
          +'<div style="font-size:13px;font-weight:600;color:var(--tag-amber-tx,#92400e);margin-bottom:8px">⚠️ Contrats \u00e0 renouveler ('+_alertes.length+')</div>'
          +_alertes.map(function(m){
            var dateRef=_dsP(m.fin_contrat);
            var j=Math.round((dateRef-_toDay)/86400000);
            var label='Fin de contrat';
            var dateStr=dateRef?dateRef.toLocaleDateString('fr-FR',{day:'numeric',month:'short'}):''
            var urgent=j<=7;
            return'<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-top:1px solid #fcd34d;cursor:pointer" onclick="editMembre(\''+_escAttr(m.nom)+'\')">'  
              +'<span style="font-size:13px;color:var(--tag-amber-tx,#78350f)">'+(m.couleur?'<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+m.couleur+';margin-right:6px"></span>':'')+_escHtml(m.nom)+'</span>'
              +'<span style="font-size:12px;font-weight:'+(urgent?'700':'500')+';color:'+(urgent?'#dc2626':'#92400e')+'">'+label+' '+dateStr+(j===0?' aujourd\'hui':j===1?' demain':' dans '+j+' j')+'</span>'
              +'</div>';
          }).join('')
          +'</div>';
      } else {_ab.innerHTML='';}
      ml.innerHTML=window.MEMBRES.map(function(m){
        var tc=m.type_contrat||'CDI';
        var fd=_dsP(m.fin_contrat);
        var hasAlert=_RENOUV.indexOf(tc)>=0&&!!(fd&&fd>=_toDay&&fd<=_in30);
        var badge=hasAlert?'<span style="font-size:10px;background:#f59e0b;color:#fff;border-radius:8px;padding:1px 6px;margin-left:6px;vertical-align:middle">🔄</span>':'';
        var bBureau=m.bureau?'<span style="font-size:10px;background:#475569;color:#fff;border-radius:8px;padding:1px 6px;margin-left:6px;vertical-align:middle">🏢</span>':'';
        // Fiche encore « Active » alors que le contrat est échu. C'est ce cas précis qui
        // gonflait les effectifs du Pilotage tant que personne ne la passait Inactif :
        // le statut se met à la main, la date de fin de contrat non.
        var _fini=(m.statut!=='Inactif' && typeof window._mvContratFini==='function' && window._mvContratFini(m,_toDayIso));
        var bFini=_fini?'<span style="font-size:10px;background:#b45309;color:#fff;border-radius:8px;padding:1px 6px;margin-left:6px;vertical-align:middle;white-space:nowrap">contrat terminé</span>':'';
        var cInfo=(tc!=='CDI'&&tc!=='G\u00e9rant'&&m.fin_contrat)?' \u00b7 '+tc+' fin '+(_dsP(m.fin_contrat)?_dsP(m.fin_contrat).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}):''):'';
        return'<div class="membre-card" onclick="editMembre(\''+_escAttr(m.nom)+'\')">'  
          +'<div class="m-ava" style="background:'+(m.couleur||'#888')+'">'+_escHtml(m.nom[0])+'</div>'
          +'<div class="m-info">'
          +'<div class="m-nom">'+_escHtml(m.nom)+badge+bBureau+bFini+'</div>'
          +'<div class="m-roles">'+m.roles.map(function(r){return'<span class="m-role-badge rb-'+r+'">'+r+'</span>';}).join('')+'</div>'
          +'<div class="m-statut">'+_escHtml(m.email||'')+_mvEmailPencil(m)+' \u00b7 '+_escHtml(m.statut)+cInfo+'</div>'
          +'</div></div>';
      }).join('');
    }
    // Parc tracteurs (voir / renommer / modifier — admin uniquement)
    if(typeof window.renderTracteurSet==='function')window.renderTracteurSet();
    // Activités tracteur
    renderActTracList();
    }
}
// ── Rendu de la liste des activités tracteur (Réglages) ──
function renderActTracList(){
  var el=document.getElementById('act-trac-list');
  if(!el)return;
  if(!window.ACTIVITES.length){
    el.innerHTML='<div style="padding:16px;text-align:center;color:var(--texte-doux);font-size:13px">Aucune activité</div>';
    return;
  }
  var _rows=window.ACTIVITES.map(function(a,i){
    var trac=window.TRACTEURS_LIST.find(function(t){return t.id===a.tracteurDefautId;});
    var champInfo=(a.champCustom&&a.champCustom.label)
      ?'<span style="font-size:10px;background:rgba(74,159,200,0.15);color:#4A9FC8;border-radius:4px;padding:1px 6px;margin-left:6px">📋 '+_escHtml(a.champCustom.label)+'</span>'
      :'';
    var sep=i>0?'border-top:1px solid var(--gris-clair);':'';
    var hhaV=(a.h_ha!=null&&a.h_ha!=='')?a.h_ha:'';
    var nomA=_escAttr(a.nom);
    return '<div style="display:flex;align-items:center;gap:10px;padding:12px 0;'+sep+'">'
      +'<div style="flex:1;min-width:0;cursor:pointer" onclick="openEditActTrac(\''+nomA+'\')">'
        +'<div style="font-size:14px;font-weight:600;color:var(--texte)">'+(a.emoji||'🚜')+' '+_escHtml(a.nom)+champInfo+'</div>'
        +'<div style="font-size:12px;color:var(--texte-doux);margin-top:3px">🚜 '+(trac?_escHtml(trac.nom)+(trac.modele?' — '+_escHtml(trac.modele):''):'—')+'</div>'
      +'</div>'
      +'<div onclick="event.stopPropagation()" style="display:flex;align-items:center;gap:5px;flex-shrink:0" title="Barème : heures machine par hectare">'
        +'<input type="number" inputmode="decimal" step="0.1" min="0" value="'+hhaV+'" placeholder="—" onchange="setActHha(\''+nomA+'\',this.value)" style="width:56px;text-align:right;border:1px solid var(--gris);border-radius:8px;padding:6px 7px;font-family:\'Outfit\',sans-serif;font-size:13px;font-weight:700;color:#4A9FC8;background:#fff">'
        +'<span style="font-size:11px;color:var(--texte-doux)">h/ha</span>'
      +'</div>'
      +'<span onclick="openEditActTrac(\''+nomA+'\')" style="color:var(--texte-doux);font-size:20px;flex-shrink:0;cursor:pointer">›</span>'
    +'</div>';
  }).join('');
  el.innerHTML=_chrToggleHtml()+'<div style="font-size:11px;color:var(--texte-doux);margin-bottom:8px;line-height:1.55">Le <b>barème h/ha</b> (heures machine par hectare) estime le temps tracteur par passage dans le <b>Rapport de saison</b> et le <b>Pilotage</b>. Laissez vide pour ne pas comptabiliser l\'activité (elle reste dans « Autres »).</div>'+_rows;
}
function _chrToggleHtml(){
  var o=!!(window.CONFIG&&window.CONFIG.chrono_mode==='on');
  return '<div style="display:flex;align-items:center;gap:12px;background:var(--gris-clair);border-radius:11px;padding:11px 13px;margin-bottom:10px">'
    +'<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--texte)">⏱ Chronometrer le temps reel</div>'
    +'<div style="font-size:11px;color:var(--texte-doux);margin-top:2px;line-height:1.4">Optionnel - dans une session, mesure le travail parcelle par parcelle. Sinon, le bareme ci-dessous prend le relais.</div></div>'
    +'<button onclick="_chronoSetMode('+(o?'false':'true')+')" style="flex-shrink:0;border:none;cursor:pointer;font-family:Outfit,sans-serif;font-weight:700;font-size:12px;padding:8px 15px;border-radius:20px;min-height:40px;'+(o?'background:var(--vert);color:#fff':'background:var(--gris);color:var(--texte-doux)')+'">'+(o?'ON':'OFF')+'</button>'
  +'</div>';
}
window._chronoSetMode=function(on){
  window.CONFIG=window.CONFIG||{};
  window.CONFIG.chrono_mode=on?'on':'off';
  if(window.saveData)window.saveData('config');
  if(typeof renderActTracList==='function')renderActTracList();
  if(window.showToast)window.showToast(on?'Chrono active - mesure par parcelle':'Chrono desactive - bareme seul',on?'#3D6B27':'#8A8072');
};

function setActHha(nom,val){
  if(!isAdmin())return;
  var a=(window.ACTIVITES||[]).find(function(x){return x.nom===nom;});
  if(!a)return;
  var v=parseFloat(String(val).replace(',','.'));
  if(isNaN(v)||v<0)v=0;
  if(v>0)a.h_ha=v; else delete a.h_ha;
  window.ACTIVITES=window.ACTIVITES;
  window.saveData('activites');
  if(window.showToast)showToast(v>0?('Barème « '+nom+' » : '+v+' h/ha'):('Barème « '+nom+' » retiré'),'#4A9FC8');
}
window.setActHha=setActHha;

function openEditActTrac(actNom){
  if(!isAdmin())return;
  var act=window.ACTIVITES.find(function(a){return a.nom===actNom;});
  if(!act)return;
  document.getElementById('eat-act-nom').value=actNom;
  document.getElementById('eat-title').textContent='✏️ '+actNom;
  // Tracteurs éligibles
  var eligible=actNom==='Traitement'
    ?window.TRACTEURS_LIST.filter(function(t){return t.traitementOnly;})
    :window.TRACTEURS_LIST.filter(function(t){return !t.traitementOnly;});
  if(!eligible.length)eligible=window.TRACTEURS_LIST.slice();
  document.getElementById('eat-trac-pick').innerHTML=eligible.map(function(t){
    var sel=t.id===act.tracteurDefautId;
    var col=window.couleurTracType(t.type);
    return '<div class="pchk'+(sel?' sel acre':'')+'" data-val="'+t.id+'" style="'+(sel?'border-color:'+col:'')+'">'
      +(t.traitementOnly?'🌿':'🚜')+' '+_escHtml(t.nom)+(t.modele?' — '+_escHtml(t.modele):'')
    +'</div>';
  }).join('');
  document.getElementById('eat-trac-pick').querySelectorAll('.pchk').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('#eat-trac-pick .pchk').forEach(function(b){b.classList.remove('sel','acre');});
      this.classList.add('sel','acre');
      document.getElementById('eat-trac').value=this.dataset.val;
    });
  });
  document.getElementById('eat-trac').value=act.tracteurDefautId||'';
  // Pré-remplir champ custom
  var hasChamp=!!(act.champCustom&&act.champCustom.label);
  document.getElementById('eat-champ-actif').value=hasChamp?'1':'0';
  document.getElementById('eat-champ-fields').style.display=hasChamp?'':'none';
  var toggle=document.getElementById('eat-champ-toggle');
  var knob=document.getElementById('eat-champ-knob');
  if(toggle)toggle.style.background=hasChamp?'var(--vert)':'rgba(0,0,0,0.1)';
  if(knob)knob.style.transform=hasChamp?'translateX(20px)':'translateX(0)';
  var _feedsEl=document.getElementById('eat-champ-feeds'); if(_feedsEl)_feedsEl.checked=!!(act.champCustom&&act.champCustom.feedsPlantation);
  if(hasChamp){
    document.getElementById('eat-champ-label').value=act.champCustom.label;
    var t=act.champCustom.type||'nombre';
    document.getElementById('eat-champ-type-val').value=t;
    document.getElementById('eat-champ-type-nb').classList.toggle('sel',t==='nombre');
    document.getElementById('eat-champ-type-nb').classList.toggle('acre',t==='nombre');
    document.getElementById('eat-champ-type-txt').classList.toggle('sel',t==='texte');
    document.getElementById('eat-champ-type-txt').classList.toggle('acre',t==='texte');
  } else {
    document.getElementById('eat-champ-label').value='';
    document.getElementById('eat-champ-type-val').value='nombre';
    document.getElementById('eat-champ-type-nb').classList.add('sel','acre');
    document.getElementById('eat-champ-type-txt').classList.remove('sel','acre');
  }
  window.openOv('ovEditActTrac');
}
function saveEditActTrac(){
  var actNom=document.getElementById('eat-act-nom').value;
  var tracId=document.getElementById('eat-trac').value;
  var act=window.ACTIVITES.find(function(a){return a.nom===actNom;});
  if(!act||!tracId)return;
  act.tracteurDefautId=tracId;
  var champActif=document.getElementById('eat-champ-actif').value==='1';
  var champLabel=(document.getElementById('eat-champ-label').value||'').trim();
  var champType=document.getElementById('eat-champ-type-val').value||'nombre';
  var _feeds=!!((document.getElementById('eat-champ-feeds')||{}).checked) && champType==='nombre';
  act.champCustom=(champActif&&champLabel)?{label:champLabel,type:champType,feedsPlantation:_feeds}:null;
  window.ACTIVITES=window.ACTIVITES;
  window.saveData('activites');
  window.closeOv(null,'ovEditActTrac');
  renderActTracList();
  showToast('Activité mise à jour ✓','#3D6B27');
}
function deleteActivite(){
  var actNom=document.getElementById('eat-act-nom').value;
  if(!actNom)return;
  window.openConfirmDel('Supprimer "'+actNom+'" ?','Les sessions existantes ne seront pas affectées.',function(){
    window.ACTIVITES=window.ACTIVITES.filter(function(a){return a.nom!==actNom;});
    window.ACTIVITES=window.ACTIVITES;
    if(navigator.vibrate)navigator.vibrate([80,60,80]);
    window.saveData('activites');
    window.closeOv(null,'ovEditActTrac');
    renderActTracList();
    window.renderTracteur();
    showToast('"'+actNom+'" supprimée','#C0392B');
  },'🚜');
}

// ── Ouvrir overlay nouvelle activité (reset + pré-remplissage) ──
function openOvNouvelleActivite(){
  if(!isAdmin()){showToast('Admin requis','#C0392B');return;}
  document.getElementById('new-act').value='';
  // Emoji
  var emojiBtn=document.getElementById('new-act-emoji-btn');
  if(emojiBtn)emojiBtn.textContent='🚜';
  // Tracteurs
  var tracPick=document.getElementById('new-act-trac-pick');
  if(tracPick){
    var eligible=window.TRACTEURS_LIST.filter(function(t){return !t.traitementOnly;});
    if(!eligible.length)eligible=window.TRACTEURS_LIST.slice();
    tracPick.innerHTML=eligible.map(function(t,i){
      var col=window.couleurTracType(t.type);
      return '<div class="pchk'+(i===0?' sel acre':'')+'" data-val="'+t.id+'" style="'+(i===0?'border-color:'+col:'')+'" onclick="_pickNewActTrac(this)">'
        +'🚜 '+_escHtml(t.nom)+(t.modele?' — '+_escHtml(t.modele):'')
      +'</div>';
    }).join('');
    var defId=eligible.length?eligible[0].id:'';
    document.getElementById('new-act-trac').value=defId;
  }
  // Reset champ custom
  _toggleActChampReset('new-act');
  // Fermer emoji picker
  var ep=document.getElementById('new-act-emoji-pick');
  if(ep)ep.style.display='none';
  window.openOv('ovActivite');
}

function _pickNewActTrac(el){
  var parent=el.closest('.ppicker')||el.parentElement;
  parent.querySelectorAll('.pchk').forEach(function(b){b.classList.remove('sel','acre');});
  el.classList.add('sel','acre');
  document.getElementById('new-act-trac').value=el.dataset.val;
}

var _ACT_EMOJIS=['🚜','✂️','🌱','🌿','🕳️','💧','🔥','⚡','🌾','🪚','🔩','🧪','🛤️','📍','🌀','🔄','⛏️','🔗'];

function _toggleActEmojiPick(pfx){
  var ep=document.getElementById(pfx+'-act-emoji-pick');
  if(!ep)return;
  var showing=ep.style.display!=='none';
  if(showing){ep.style.display='none';return;}
  // Peupler
  ep.innerHTML=_ACT_EMOJIS.map(function(e){
    return '<div class="pchk" style="font-size:20px;padding:6px 10px" onclick="_pickActEmoji(\''+pfx+'\',\''+e+'\')">'+e+'</div>';
  }).join('');
  ep.style.display='flex';
}

function _pickActEmoji(pfx,emoji){
  var btn=document.getElementById(pfx+'-act-emoji-btn');
  if(btn)btn.textContent=emoji;
  var ep=document.getElementById(pfx+'-act-emoji-pick');
  if(ep)ep.style.display='none';
}

function _toggleActChamp(pfx){
  var actif=document.getElementById(pfx+'-champ-actif').value==='1';
  var nouveau=!actif;
  document.getElementById(pfx+'-champ-actif').value=nouveau?'1':'0';
  document.getElementById(pfx+'-champ-fields').style.display=nouveau?'':'none';
  var toggle=document.getElementById(pfx+'-champ-toggle');
  var knob=document.getElementById(pfx+'-champ-knob');
  if(toggle)toggle.style.background=nouveau?'var(--vert)':'rgba(0,0,0,0.1)';
  if(knob)knob.style.transform=nouveau?'translateX(20px)':'translateX(0)';
}

function _toggleActChampReset(pfx){
  document.getElementById(pfx+'-champ-actif').value='0';
  var fields=document.getElementById(pfx+'-champ-fields');
  if(fields)fields.style.display='none';
  var lbl=document.getElementById(pfx+'-champ-label');
  if(lbl)lbl.value='';
  var toggle=document.getElementById(pfx+'-champ-toggle');
  var knob=document.getElementById(pfx+'-champ-knob');
  if(toggle)toggle.style.background='rgba(0,0,0,0.1)';
  if(knob)knob.style.transform='translateX(0)';
  document.getElementById(pfx+'-champ-type-val').value='nombre';
  var nb=document.getElementById(pfx+'-champ-type-nb');
  var txt=document.getElementById(pfx+'-champ-type-txt');
  if(nb){nb.classList.add('sel','acre');}
  if(txt){txt.classList.remove('sel','acre');}
}

function _setActChampType(pfx,type){
  document.getElementById(pfx+'-champ-type-val').value=type;
  var nb=document.getElementById(pfx+'-champ-type-nb');
  var txt=document.getElementById(pfx+'-champ-type-txt');
  if(nb){nb.classList.toggle('sel',type==='nombre');nb.classList.toggle('acre',type==='nombre');}
  if(txt){txt.classList.toggle('sel',type==='texte');txt.classList.toggle('acre',type==='texte');}
}

// Période consultée (objet). La liste des tâches y est portée : toute création / suppression de
// tâche doit la mettre à jour, sinon l'ajout est un geste sans effet visible.
// ═════════════════════════════════════════════════════════════════════
// L'HISTORIQUE DU SALARIE — quatre blocs deviennent une suite datee (§39)
// ═════════════════════════════════════════════════════════════════════
// Avant : type + debut + fin + liste des contrats precedents + renouvellement
// + taux + serie de taux. Sept champs qui ne se parlaient pas ; on lisait des
// cases, jamais une suite. Et deux d'entre eux ne servaient a rien :
// renouvellement_fin n'etait LU nulle part, et remplir renouvellement_date
// ETEIGNAIT l'alerte de fin de contrat.
//
// ★ UN EVENEMENT EST ECRIT DES QU'IL EST VALIDE, pas a l'enregistrement de la
// fiche. Un fait se consigne quand on le consigne ; et le « × » de chaque
// ligne permet de revenir en arriere. C'est aussi ce qui evite qu'un contrat
// saisi soit perdu parce qu'on a ferme la fiche sans enregistrer.
var _EMH_GRILLES_DEF=['standard'];
function _emhFmt(iso){ if(!iso) return '\u2014'; var p=String(iso).split('-'); return p.length===3?(p[2]+'/'+p[1]+'/'+p[0]):iso; }
function _emhJours(a,b){ var x=Date.parse(a+'T00:00:00'), y=Date.parse(b+'T00:00:00');
  return (isFinite(x)&&isFinite(y))?Math.round((y-x)/86400000):0; }
function _emhGrilles(){
  var out=[], T=(window.PLANNING_TEMPLATES&&window.PLANNING_TEMPLATES[new Date().getFullYear()])||null;
  if(T) Object.keys(T).forEach(function(k){ if(out.indexOf(k)<0) out.push(k); });
  if(window.PLAN_DEF) Object.keys(window.PLAN_DEF).forEach(function(k){ if(out.indexOf(k)<0) out.push(k); });
  return out.length?out:_EMH_GRILLES_DEF;
}
// Ecrit le journal, reconstruit les miroirs, enregistre. Un seul chemin.
function _emhCommit(m,H,msg){
  m.hist=window._mvHist({hist:H});
  window._mvHistMirror(m);
  window.saveData('membres',msg||'\u{1F4C7} Historique mis \u00e0 jour');
}
var _EMH_LBL={ embauche:{i:'\u{1F4C4}',n:'Embauche'}, renouvellement:{i:'\u{1F504}',n:'Renouvellement'},
               fin:{i:'\u23F9',n:'Fin de contrat'}, taux:{i:'\u{1F4B6}',n:'Changement de taux'} };

// Le bloc complet : rappel + contrat en cours + historique + bouton.
function _emhRender(nom){
  var box=document.getElementById('em-hist-wrap'); if(!box) return;
  var m=(window.MEMBRES||[]).find(function(x){return x.nom===nom;}); if(!m) return;
  var adm=!!(window.isAdmin&&window.isAdmin());
  var P=(window._mvPeriodes?window._mvPeriodes(m):[]);
  var last=P.length?P[P.length-1]:null;
  var auj=_paieAuj();
  box.innerHTML=_emhRapHtml(m,last,auj)+'<div class="fl">Contrat en cours</div>'+_emhNowHtml(m,last,adm,auj)
    +_emhHistHtml(m,P,adm)
    +'<button type="button" class="emh-add" onclick="_emhPick(\''+_escAttr(nom)+'\')">\uFF0B Ajouter un \u00e9v\u00e9nement</button>';
}
// ── LE RAPPEL. Sa seule source est la FIN DU CONTRAT, toujours renseignee sur
// un CDD — contrairement a l'ancien champ facultatif, qui pouvait l'eteindre.
function _emhRapHtml(m,last,auj){
  if(!last||!last.fin) return '';
  var j=_emhJours(auj,last.fin);
  if(j<0||j>30) return '';
  var urg=(j<=7), nomA=_escAttr(m.nom);
  return '<div class="emh-rap'+(urg?' urg':'')+'">'
    +'<div class="emh-rap-t">\u26A0\uFE0F Contrat \u00e0 renouveler</div>'
    +'<div class="emh-rap-s">Le '+_escHtml(last.type||'contrat')+' se termine le <b>'+_emhFmt(last.fin)+'</b>\u00a0\u2014 '
    +(j===0?'aujourd\u2019hui':j===1?'demain':'dans '+j+' jours')+'.</div>'
    +'<button type="button" class="emh-rap-b" onclick="_emhForm(\''+nomA+'\',\'renouvellement\')">\u{1F504} Renouveler</button>'
    +'<button type="button" class="emh-rap-b alt" onclick="_emhForm(\''+nomA+'\',\'fin\')">\u23F9 Il s\u2019arr\u00eate</button>'
    +'</div>';
}
function _emhNowHtml(m,last,adm,auj){
  if(!last) return '<div class="emh-now"><div class="emh-vide">Aucun contrat en cours.<br>'
    +'Ajoutez une <b>embauche</b> pour en ouvrir un.</div></div>';
  // ⚠️ Le badge doit lire LE TYPE AFFICHE JUSTE A COTE, pas le miroir
  // m.type_contrat. Les deux coincident aujourd'hui parce que le miroir est
  // derive de last — mais deux definitions du meme fait sur la meme ligne
  // finissent toujours par diverger, et l'ecran dirait alors « CDD » avec le
  // badge d'un annualise. Repli sur le miroir si la periode n'a pas de type
  // (fiche ancienne). Le drapeau collectif, lui, appartient bien a la fiche.
  var annu=(typeof window._mvAnnualise==='function')
    ? window._mvAnnualise({type_contrat:(last.type||m.type_contrat||''), collectif:m.collectif})
    : true;
  var tx=(typeof window._mvPaieTauxEffAt==='function')?window._mvPaieTauxEffAt(m,auj):null;
  return '<div class="emh-now">'
   +'<div class="emh-top"><span class="emh-type">'+_escHtml(last.type||'\u2014')+'</span>'
     +'<span class="emh-pill '+(annu?'ok':'hr')+'">'
     +(annu?'Annualis\u00e9 \u00b7 plafond proratis\u00e9':'Pay\u00e9 \u00e0 l\u2019heure \u00b7 pas d\u2019annualisation')+'</span></div>'
   +'<div class="emh-dates">depuis le <b>'+_emhFmt(last.debut)+'</b>\u00a0\u00b7 '
     +(last.fin?('jusqu\u2019au <b>'+_emhFmt(last.fin)+'</b>'):'<b>sans terme</b>')+'</div>'
   +'<div class="emh-row"><span>Grille horaire</span><b style="font-size:13px">'+_escHtml(last.grille||'standard')+'</b></div>'
   +(adm?('<div class="emh-row"><span>Taux horaire charg\u00e9</span><b>'
     +((tx!=null&&tx>0)?(String(Math.round(tx*100)/100).replace('.',',')+'\u00a0\u20AC'):'\u2014')+'</b></div>'):'')
   +'</div>';
}
// ── LA FRISE. Le rail est PLEIN pendant un contrat, POINTILLE dans le vide.
// La coupure decide si le compteur repart de zero : elle est ecrite en clair.
function _emhHistHtml(m,P,adm){
  var HC=(window._mvHist?window._mvHist(m):[]).slice();
  var HT=[];
  if(adm && typeof _paieSerie==='function'){
    _paieSerie(m.nom).forEach(function(e){
      if(e && e.d && e.d!==_PAIE_ANCRE) HT.push({d:e.d,t:'taux',v:e.v});
    });
  }
  var L=HC.concat(HT).sort(function(a,b){return String(a.d).localeCompare(String(b.d));}).reverse();
  var head='<div class="fl">Historique <span style="font-weight:600;letter-spacing:0;text-transform:none;color:var(--texte-doux)">\u00b7 '
    +L.length+' \u00e9v\u00e9nement'+(L.length>1?'s':'')+'</span></div>';
  if(!L.length) return head+'<div class="emh-gap"><div class="emh-gap-t">Rien d\u2019enregistr\u00e9</div>'
    +'<div class="emh-gap-s">Le premier \u00e9v\u00e9nement est une embauche.</div></div>';
  function inP(iso){ for(var i=0;i<P.length;i++){ if(iso>=P[i].debut&&(!P[i].fin||iso<=P[i].fin)) return i; } return -1; }
  var nomA=_escAttr(m.nom), h=head+'<div class="emh-rail">', prev=null;
  L.forEach(function(e,k){
    var pi=inP(e.d);
    if(prev!==null&&pi>=0&&prev>=0&&pi<prev){
      var n=_emhJours(P[pi].fin,P[prev].debut)-1;
      h+='<div class="emh-gap"><div class="emh-gap-t">\u2702\uFE0F Coupure de '+n+' jour'+(n>1?'s':'')
        +'\u00a0\u2014 du '+_emhFmt(P[pi].fin)+' au '+_emhFmt(P[prev].debut)+'</div>'
        +'<div class="emh-gap-s">Le compteur du contrat pr\u00e9c\u00e9dent est <b>sold\u00e9</b>\u00a0: pay\u00e9, donc \u00e0 z\u00e9ro. '
        +'Le nouveau repart de sa date de d\u00e9but, sans d\u00fb ni indu.</div></div>';
    }
    var cls='emh-ev'+(e.t==='taux'?' pay':'')+(e.t==='fin'?' stop':'')+(pi<0?' out':'')
      +(k===0?' first':'')+(k===L.length-1?' last':'');
    var sub='';
    if(e.t==='embauche')            sub=(e.type?_escHtml(e.type):'type non renseign\u00e9')+'\u00a0\u00b7 '
                                       +(e.fin?('fin pr\u00e9vue le '+_emhFmt(e.fin)):'sans terme')
                                       +'\u00a0\u00b7 grille '+_escHtml(e.grille||'standard');
    else if(e.t==='renouvellement') sub='fin repouss\u00e9e au '+_emhFmt(e.fin)+'\u00a0\u2014 toujours le m\u00eame contrat';
    else if(e.t==='fin')            sub='fin r\u00e9elle\u00a0\u00b7 le compteur est sold\u00e9';
    else                            sub=String(Math.round(e.v*100)/100).replace('.',',')+'\u00a0\u20AC/h\u00a0\u00b7 visible des seuls administrateurs';
    h+='<div class="'+cls+'"><span class="emh-dot"></span>'
      +'<span class="emh-d">'+String(e.d).slice(8,10)+'/'+String(e.d).slice(5,7)+'<br>'
        +'<span style="font-weight:500;opacity:.7">'+String(e.d).slice(0,4)+'</span></span>'
      +'<span class="emh-m"><span class="emh-t">'+_EMH_LBL[e.t].i+' '+_EMH_LBL[e.t].n+'</span>'
        +'<span class="emh-s">'+sub+'</span></span>'
      +'<button type="button" class="emh-x" aria-label="Retirer cet \u00e9v\u00e9nement" '
        +'onclick="_emhDel(\''+nomA+'\',\''+_escAttr(e.t)+'\',\''+_escAttr(e.d)+'\')">\u00d7</button></div>';
    prev=pi;
  });
  return h+'</div>';
}
function _emhDel(nom,t,d){
  var m=(window.MEMBRES||[]).find(function(x){return x.nom===nom;}); if(!m) return;
  if(t==='taux'){
    var S=_paieSerie(nom).filter(function(e){ return e.d!==d; });
    window._mvPaieApply(nom,'','',S.map(function(e){return {d:e.d,v:String(e.v)};}));
    showToast('\u{1F4B6} Ligne de taux retir\u00e9e','#8A5A38');
  } else {
    var H=window._mvHist(m).filter(function(e){ return !(e.t===t&&e.d===d); });
    _emhCommit(m,H,'\u{1F4C7} \u00c9v\u00e9nement retir\u00e9');
  }
  _emhRender(nom); renderReglages();
}

// Frise de campagne : les périodes en couleur sur l'axe du temps, le trait du jour, les trous en
// hachuré et les chevauchements cerclés de rouge. C'est le seul endroit où « on raisonne par date »
// devient visible d'un coup d'œil.
function _cmpFrise(){
  var W=_cmpFenetre(), a=_cmpN(W.a), b=_cmpN(W.b);
  if(b<=a) return '';
  var pc=function(d){ return Math.max(0,Math.min(100,(_cmpN(d)-a)/(b-a)*100)); };
  var ord=_cmpVisibles().filter(function(s){return s&&s.debut&&s.fin&&s.fin>=s.debut;})
    .sort(function(x,y){return String(x.debut).localeCompare(String(y.debut));});
  var lab=_cmpEchelle(a,b);
  var segs='',prevFin=null,ovl=[];
  ord.forEach(function(s){
    var x=pc(s.debut), w=pc(s.fin)-x;
    if(w<=0) w=0.6;
    var chev=(prevFin&&s.debut<=prevFin);
    if(chev) ovl.push(s.nom);
    var col=_cmpCouleur(s);
    segs+='<div class="cmp-seg'+(chev?' ovl':'')+'" style="left:'+x+'%;width:'+w+'%;background:'+col+'">'
      +'<b>'+_escHtml(s.nom)+'</b></div>';
    if(!prevFin||s.fin>prevFin) prevFin=s.fin;
  });
  var today=new Date().toISOString().split('T')[0];
  if(today>=W.a&&today<=W.b) segs+='<div class="cmp-today" style="left:'+pc(today)+'%"></div>';
  // Trous : intervalles de la fenêtre que plus aucune période ne couvre.
  var trous=[],curN=a;
  ord.forEach(function(s){
    var d=Math.max(_cmpN(s.debut),a), f=Math.min(_cmpN(s.fin),b);
    if(f<d) return;
    if(d>curN) trous.push({a:curN,b:d-1});
    if(f+1>curN) curN=f+1;
  });
  if(curN<=b) trous.push({a:curN,b:b});
  var couv=Math.round((b-a+1-trous.reduce(function(n,g){return n+(g.b-g.a+1);},0))/(b-a+1)*100);
  var al='';
  if(ovl.length) al+='<div class="cmp-alert bad"><span class="ic">\u26A0</span><div><b>Chevauchement</b> sur '
    +_escHtml(ovl.join(', '))+'. Une date couverte deux fois est rattach\u00e9e \u00e0 la p\u00e9riode ouverte '
    +'le plus r\u00e9cemment \u2014 l\u2019autre ne verra jamais ces heures.</div></div>';
  if(trous.length) al+='<div class="cmp-alert warn"><span class="ic">\u26A0</span><div><b>Trou dans la campagne</b> : '
    +_escHtml(trous.map(function(g){return _cmpFr(_cmpISO(g.a))+' \u2192 '+_cmpFr(_cmpISO(g.b));}).join(' \u00b7 '))
    +'. Une saisie dat\u00e9e l\u00e0 ne se rattache \u00e0 aucune p\u00e9riode.</div></div>';
  if(!ovl.length&&!trous.length) al+='<div class="cmp-alert ok"><span class="ic">\u2713</span><div>'
    +'La campagne est couverte sans trou ni chevauchement.</div></div>';
  return '<div class="cmp-head"><span class="t">Campagne '+_escHtml(_cmpFr(W.a)+' \u2192 '+_cmpFr(W.b))+'</span>'
    +'<span class="n">'+couv+'% couvert</span></div>'
    +lab
    +'<div class="cmp-frise">'+segs+'</div>'+al
    +'<div style="height:14px"></div>';
}

function _regPeriode(){
  var n=(window._visuSaison?window._visuSaison():(((window.getSaisonActive&&window.getSaisonActive())||{}).nom||''));
  return (window._saisonObj?window._saisonObj(n):null);
}

function activateSaison(nom){
  var oldAct=((window.getSaisonActive&&window.getSaisonActive())||{}).nom||'';
  window.SAISONS.forEach(function(s){s.active=s.nom===nom;});
  // BASCULE tenant-wide (unique point de swap) : archiver p.taches (ancienne active) sous son nom,
  // promouvoir la saison cible dans p.taches. Total progression inchange -> garde anti-ecrasement OK.
  (window.PARCELLES||[]).forEach(function(p){
    if(!p.tachesAll||typeof p.tachesAll!=='object'||Array.isArray(p.tachesAll)) p.tachesAll={};
    if(!p.taches||typeof p.taches!=='object'||Array.isArray(p.taches)) p.taches={};
    var real=p._tachesSaison||oldAct||'';
    if(real===nom){ p._tachesSaison=nom; return; }
    if(real) p.tachesAll[real]=p.taches;
    p.taches=p.tachesAll[nom]||{};
    delete p.tachesAll[nom];
    p._tachesSaison=nom;
  });
  window.saveData('saisons');
  window.saveData('parcelles');
  if(typeof window._switchSaison==='function') window._switchSaison(nom); // local : pointeur + recalc TRAVAUX + rendu
  renderReglages();window.renderParcelles();window.computePStats();
}
function saveSaison(){
  var nom=document.getElementById('ns-nom').value.trim();if(!nom){showToast('Nom requis','#B85A1A');return;}
  var _d0=(document.getElementById('ns-debut')||{}).value||'',_f0=(document.getElementById('ns-fin')||{}).value||'';
  if(!_d0||!_f0){showToast('Début et fin obligatoires — c\'est la date qui rattache une saisie','#B85A1A');return;}
  if(_f0<_d0){showToast('La fin précède le début','#B85A1A');return;}
  if((window.SAISONS||[]).some(function(s){return (s.nom||'').trim().toLowerCase()===nom.toLowerCase();})){ showToast('⚠️ La saison « '+nom+' » existe déjà — choisis un autre nom','#B85A1A'); return; }
  var _deb=(document.getElementById('ns-debut')||{}).value||'',_fin=(document.getElementById('ns-fin')||{}).value||'';
  // La période porte sa liste de tâches (et non plus TACHES[].saisons, qui n'est plus lu).
  var _selNoms=(_nsTachesSel&&_nsTachesSel.size)?Array.from(_nsTachesSel):[];
  window.SAISONS.push({nom:nom,periode:_nsPeriode(_deb,_fin),debut:_deb,fin:_fin,active:false,taches:_selNoms});
  // Les tâches choisies doivent exister dans le référentiel du domaine.
  var touched=false;
  _selNoms.forEach(function(tnom){
    if((window.TACHES||[]).some(function(x){return x.nom===tnom;})) return;
    var cat=(window.TACHES_CATALOGUE||[]).find(function(c){return c.nom===tnom;});
    if(cat){ window.TACHES.push(_seedFromCat(cat)); touched=true; }
  });
  if(touched) window.TACHES=window.TACHES;
  window.saveData('saisons');
  if(touched) window.saveData('taches');
  document.getElementById('ovSaison').classList.remove('open');
  renderReglages();showToast('✅ Période '+nom+' créée'+(_nsTachesSel.size?(' · '+_nsTachesSel.size+' tâche'+(_nsTachesSel.size>1?'s':'')):''),'#3D6B27');
}
function openOvTache(){
  var cat=document.getElementById('ovt-catalog');
  var frm=document.getElementById('ovt-form');
  if(cat)cat.style.display='block';
  if(frm)frm.style.display='none';
  var grid=document.getElementById('ovt-presets-grid');
  if(grid){
    var dejaLa=(window.TACHES||[]).map(function(t){return t.nom;});
    function itemHtml(c){
      var deja=dejaLa.indexOf(c.nom)>=0;
      var info;
      if(c.trous)info='🪛 Piloté par tarière';
      else if(c.tempsReel)info='⏱️ Temps réel';
      else if(c.type==='niveaux')info='Conseillé '+c.niveaux.reduce(function(s,n){return s+n.hha;},0)+' h/ha';
      else if(c.type==='passages')info='Conseillé '+c.passagesHha.join('/')+' h/ha';
      else info='Conseillé '+c.hha+' h/ha';
      var saisLbl=c.anytime?'Toute l&#39;année':(c.saisons||[]).join(', ');
      return '<div class="ovt-cat-item" data-nom="'+_escAttr(c.nom)+'" style="display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:10px;margin-bottom:7px;cursor:pointer;background:'+(deja?'rgba(90,156,74,0.08)':'var(--bg-card)')+';border:1px solid '+(deja?'rgba(90,156,74,0.3)':'var(--gris)')+'">'
        +'<span style="font-size:20px;flex-shrink:0">'+(TEMOJI[c.nom]||'🌿')+'</span>'
        +'<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600;color:var(--texte)">'+c.label+'</div><div style="font-size:11px;color:var(--texte-doux);margin-top:1px">'+info+' · '+saisLbl+'</div></div>'
        +(deja?'<span style="font-size:13px;color:var(--vert);font-weight:700">✓</span>':'<span style="font-size:18px;color:var(--vert)">+</span>')
        +'</div>';
    }
    var oblig=(window.TACHES_CATALOGUE||[]).filter(function(c){return c.obligatoire;});
    var compl=(window.TACHES_CATALOGUE||[]).filter(function(c){return !c.obligatoire;});
    var grpStyle='font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--terre);margin:14px 0 8px';
    grid.innerHTML='<div style="'+grpStyle+'">📋 Travaux obligatoires</div>'+oblig.map(itemHtml).join('')
      +'<div style="'+grpStyle+'">⏱️ Travaux complémentaires</div>'+compl.map(itemHtml).join('');
    grid.querySelectorAll('.ovt-cat-item').forEach(function(el){el.addEventListener('click',function(){openTacheCfg(el.dataset.nom);});});
  }
  window.openOv('ovTache');
}
function addTacheFromCatalogue(nom){ openTacheCfg(nom); }
function showOvTacheForm(){
  var cat=document.getElementById('ovt-catalog');
  var frm=document.getElementById('ovt-form');
  if(cat)cat.style.display='none';
  if(frm)frm.style.display='block';
}
function showOvTacheCatalog(){
  var cat=document.getElementById('ovt-catalog');
  var frm=document.getElementById('ovt-form');
  if(cat)cat.style.display='block';
  if(frm)frm.style.display='none';
}
function saveTache(){
  var nom=document.getElementById('nt-nom').value.trim();
  if(!nom){showToast('Nom requis','#B85A1A');return;}
  if((window.TACHES||[]).find(function(t){return t.nom===nom;})||(window.TACHES_CATALOGUE||[]).find(function(c){return c.nom===nom;})){showToast('⚠️ « '+nom+' » existe déjà','#B85A1A');return;}
  var hRaw=document.getElementById('nt-hha').value;var hha=parseFloat(hRaw);
  var t={nom:nom,anytime:true,tempsReel:true,complementaire:true,custom:true};
  if(!isNaN(hha)&&hha>0)t.hha=hha;
  window.TACHES.push(t);window.TACHES=window.TACHES;
  window.saveData('taches','📋 Travail ajouté');
  document.getElementById('ovTache').classList.remove('open');
  document.getElementById('nt-nom').value='';document.getElementById('nt-hha').value='';
  showToast('✅ '+nom+' ajouté (temps réel)','#3D6B27');
  renderReglages();
}
// ════════ SAISONS AGRICOLES (création) ════════
// Les quatre types de saison (Hiver/Printemps/Été/Automne) ont été retirés : un domaine découpe
// son année comme il la travaille — deux périodes ici, quatre ailleurs, « saison de taille » et
// « saison verte » plus loin. Une période = un nom LIBRE, deux dates, une liste de tâches.
var _CMP_COLS=['#3D6B27','#C2A14D','#8A5A38','#2C3E50','#7B4DB8'];
// Fenetre de travail : Reglages ne montre que les periodes encore operantes, c'est-a-dire celles
// qui se terminent dans les 18 derniers mois glissants, plus tout ce qui est en cours ou a venir.
// Au-dela, une periode n'est plus qu'une archive : elle vit dans Pilotage > Archives.
// INVARIANT : la periode ACTIVE et celle qu'on CONSULTE ne sont jamais masquees, sinon on ne
// pourrait plus en sortir. Une periode sans date de fin reste visible : c'est une anomalie a
// corriger, pas une archive.
var _CMP_RETENTION_M = 18;
function _cmpSeuil(){
  var d=new Date();
  return new Date(Date.UTC(d.getFullYear(),d.getMonth()-_CMP_RETENTION_M,d.getDate())).toISOString().slice(0,10);
}
function _cmpVisibles(){
  var seuil=_cmpSeuil();
  var act=((window.getSaisonActive&&window.getSaisonActive())||{}).nom||'';
  var vis=(window._visuSaison&&window._visuSaison())||'';
  return (window.SAISONS||[]).filter(function(s){
    if(!s) return false;
    if(s.nom===act||s.nom===vis) return true;
    if(!s.fin) return true;
    return String(s.fin)>=seuil;
  });
}
function _cmpArchivees(){ return Math.max(0,(window.SAISONS||[]).length-_cmpVisibles().length); }
// Couleur d'une periode = son rang dans SAISONS. Une seule source, pour que la meme periode ait
// la meme couleur dans Reglages et dans les Archives.
function _cmpCouleur(s){ return _CMP_COLS[Math.max(0,(window.SAISONS||[]).indexOf(s))%_CMP_COLS.length]; }
// Echelle des mois, posee au MEME barreme que les segments (prorata des jours). L'ancienne version
// repartissait les libelles a parts egales (flex:1) et s'arretait a 14 : sur une fenetre de 18 mois,
// mars tombait a 39 % quand le 1er mars etait a 27,7 %. Pas adaptatif : a 360 px un libelle demande
// environ 7 % de la largeur, donc un mois sur deux au-dela de 13, sur trois au-dela de 26. Les
// traits restent mensuels ; l'annee n'est ecrite qu'en janvier (deux "oct" sur 18 mois sont ambigus).
function _cmpEchelle(a,b){
  var pc=function(n){ return Math.max(0,Math.min(100,(n-a)/(b-a)*100)); };
  var dA=new Date(a*864e5), ms=[];
  var cur=new Date(Date.UTC(dA.getUTCFullYear(),dA.getUTCMonth(),1));
  while(_cmpN(cur.toISOString().slice(0,10))<=b){
    ms.push({m:cur.getUTCMonth(),y:cur.getUTCFullYear(),x:pc(_cmpN(cur.toISOString().slice(0,10)))});
    cur=new Date(Date.UTC(cur.getUTCFullYear(),cur.getUTCMonth()+1,1));
  }
  var pas=ms.length<=13?1:(ms.length<=26?2:3), out='';
  // Le pas est ANCRE SUR JANVIER. Sans cela, sur 18 mois demarrant en octobre, un pas de 2 n'ecrit
  // que les rangs pairs : janvier n'apparait jamais, donc l'annee non plus — alors que la fenetre
  // contient justement deux "oct" indistinguables. Le repere d'annee prime sur le premier mois.
  var off=0;
  for(var q=0;q<ms.length;q++){ if(ms[q].m===0){ off=q%pas; break; } }
  ms.forEach(function(o,i){
    out+='<i class="'+(o.m===0?'y':'')+'" style="left:'+o.x+'%"></i>';
    if(((i-off)%pas+pas)%pas||o.x>96) return;
    var cls=o.x<4?'a0':(o.x>92?'a1':'');
    var an=(i===0||o.m===0)?'<em>'+String(o.y).slice(2)+'</em>':'';
    out+='<span class="'+cls+'" style="left:'+o.x+'%">'+_CMP_MOIS[o.m].replace('.','')+an+'</span>';
  });
  return '<div class="cmp-scale">'+out+'</div>';
}
// Passerelle vers l'onglet Archives : c'est la que partent les periodes sorties de la fenetre de
// travail. Sans ce lien, elles seraient invisibles, donc perdues de vue.
function _cmpLienArchives(){
  var n=_cmpArchivees(); if(!n) return '';
  return '<div class="cmp-arc-lien" onclick="window._pilOpenArchives&&window._pilOpenArchives()">'
    +'<span class="ic">\uD83D\uDDC3\uFE0F</span><div><b>'+n+' p\u00e9riode'+(n>1?'s':'')+' archiv\u00e9e'+(n>1?'s':'')+'</b><br>'
    +'Pilotage \u203A Archives \u2014 frises, heures et co\u00fbts des campagnes pass\u00e9es.</div>'
    +'<span class="ch">\u203A</span></div>';
}
window._cmpVisibles=_cmpVisibles;
window._cmpArchivees=_cmpArchivees;
window._cmpCouleur=_cmpCouleur;
window._cmpEchelle=_cmpEchelle;
var _CMP_MOIS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
function _cmpN(s){var p=String(s).split('-');return Date.UTC(+p[0],+p[1]-1,+p[2])/864e5;}
function _cmpISO(n){return new Date(n*864e5).toISOString().slice(0,10);}
function _cmpFr(s){var p=String(s||'').split('-');if(p.length!==3)return '—';return parseInt(p[2],10)+' '+_CMP_MOIS[parseInt(p[1],10)-1]+' '+p[0];}
// Fenêtre de la frise = de la première à la dernière borne saisie. Sans dates : campagne
// conventionnelle 1ᵉʳ nov. → 31 oct.
function _cmpFenetre(){
  var ds=[],fs=[];
  _cmpVisibles().forEach(function(s){ if(s&&s.debut)ds.push(s.debut); if(s&&s.fin)fs.push(s.fin); });
  if(!ds.length||!fs.length){ var y=new Date().getFullYear(); return {a:(y-1)+'-11-01',b:y+'-10-31'}; }
  ds.sort(); fs.sort();
  return {a:ds[0], b:fs[fs.length-1]};
}
// ★ LES BORNES DE L'ANNEE — celles de l'EXERCICE, pas une fenetre deduite.
// _cmpFenetre ci-dessus garde son role : encadrer les periodes TELLES QUE SAISIES,
// pour la frise d'edition de Reglages ; elle doit continuer de tout montrer, y
// compris ce qui deborde. Mais « l'annee » au sens du Pilotage est autre chose :
// un CADRE fixe, pas un resultat qui bouge a chaque periode ajoutee ou renommee.
// _mvExercice (utils.js) est deja la source unique de « ou commence l'annee », et
// l'admin la regle dans Pilotage > Economie > Exercice. On la CONSOMME. En
// fabriquer une seconde ici donnerait deux ecrans qui racontent deux annees — le
// motif exact qui a coute 941 heures fantomes sur le filtre de taches.
// L'ancre est la periode ACTIVE : on regarde l'exercice de ce qu'on consulte, pas
// celui d'aujourd'hui — sinon consulter Hiver 2025 en aout 2026 afficherait
// l'exercice 2026-2027, qui ne le contient pas.
function _cmpAnneeExercice(){
  if(typeof window._mvExercice!=='function') return null;
  var act=(window.SAISONS||[]).filter(function(s){ return s&&s.active&&s.debut; })[0];
  var ex=window._mvExercice(act?act.debut:undefined);
  return ex||null;
}
window._cmpAnneeExercice=_cmpAnneeExercice;
// Expose : Pilotage y lit la fenetre de la campagne pour sa frise annuelle. Une
// SEULE definition de « ou commence et ou finit l'annee » — Reglages et Pilotage
// doivent cadrer sur la meme, sinon deux ecrans dessinent deux annees.
window._cmpFenetre=_cmpFenetre;
var _MV_MOISA=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];

var _nsTachesSel=new Set(), _nsTachesTouched=false;

function _nsPeriode(deb,fin){var dp=String(deb).split('-'),fp=String(fin).split('-');if(dp.length!==3||fp.length!==3)return '';return _MV_MOISA[parseInt(dp[1])-1]+' '+dp[0]+' – '+_MV_MOISA[parseInt(fp[1])-1]+' '+fp[0];}
// Nouvelle période : la fin de la dernière période est le début naturel de la suivante.
function openSaison(){
  _nsTachesSel=new Set(); _nsTachesTouched=false;
  var deb='',fin='';
  var ord=(window.SAISONS||[]).filter(function(s){return s&&s.fin;}).slice()
    .sort(function(a,b){return String(a.fin).localeCompare(String(b.fin));});
  if(ord.length){ deb=_cmpISO(_cmpN(ord[ord.length-1].fin)+1); fin=_cmpISO(_cmpN(deb)+120); }
  var n=document.getElementById('ns-nom'); if(n)n.value='';
  var d=document.getElementById('ns-debut'); if(d)d.value=deb;
  var f=document.getElementById('ns-fin');   if(f)f.value=fin;
  _nsNote(); _nsBuildTaches(); window.openOv('ovSaison');
}

function _nsDateEdit(){_nsNote();}
function _nsNote(){
  var deb=(document.getElementById('ns-debut')||{}).value||'',fin=(document.getElementById('ns-fin')||{}).value||'';
  var n=document.getElementById('ns-note'); if(!n)return;
  var msg='📌 Période : <b>'+(_nsPeriode(deb,fin)||'—')+'</b>';
  if(deb&&fin&&fin<deb) msg+='<br><span style="color:var(--rouge)">La fin précède le début.</span>';
  else if(deb&&fin){
    var chev=(window.SAISONS||[]).filter(function(s){return s&&s.debut&&s.fin&&deb<=s.fin&&fin>=s.debut;})
      .map(function(s){return s.nom;});
    if(chev.length) msg+='<br><span style="color:var(--rouge)">Chevauche : '+_escHtml(chev.join(', '))+'.</span>';
  }
  msg+='<br><span style="opacity:0.75">Une saisie se rattache à la période qui contient sa date.</span>';
  n.innerHTML=msg;
}

// ════════ PICKER : configuration d'une tâche (saisons + heures) ════════
var _tcfg=null;
function openTacheCfg(nom){
  var c=(window.TACHES_CATALOGUE||[]).find(function(x){return x.nom===nom;});if(!c)return;
  var ex=(window.TACHES||[]).find(function(x){return x.nom===nom;});
  _tcfg={nom:nom,type:c.type||null,trous:!!c.trous,tempsReel:!!c.tempsReel,isEdit:!!ex};
  _tcfg.anytime=ex?!!ex.anytime:!!c.anytime;
  _tcfg.saisons=(ex&&ex.saisons?ex.saisons.slice():(c.saisons?c.saisons.slice():[]));
  if(c.trous){_tcfg.minTrou=(ex&&ex.minTrou)||c.minTrou||3;}
  else if(c.tempsReel){_tcfg.estimate=(ex&&ex.hha!=null)?ex.hha:'';}
  else if(c.type==='passages'){_tcfg.count=(ex&&ex.passagesHha&&ex.passagesHha.length)||(c.passagesHha?c.passagesHha.length:2);_tcfg.hours=(ex&&ex.passagesHha?ex.passagesHha.slice():(c.passagesHha?c.passagesHha.slice():[]));}
  else if(c.type==='niveaux'){_tcfg.count=(ex&&ex.niveaux&&ex.niveaux.length)||(c.niveaux?c.niveaux.length:3);_tcfg.hours=(ex&&ex.niveaux?ex.niveaux.map(function(n){return n.hha;}):(c.niveaux?c.niveaux.map(function(n){return n.hha;}):[]));}
  else {_tcfg.simple=ex?ex.hha:c.hha;}
  var ovt=document.getElementById('ovTache');if(ovt)ovt.classList.remove('open');
  _tcfgRender();window.openOv('ovTacheCfg');
}
// Valeur conseillee pour un passage / niveau : le bareme conventionnel RAMENE a la
// densite du domaine (window._mvHhaDens, utils.js). Point unique : le « Conseille »
// affiche, le bouton \u21BA et le marqueur de modification en decoulent tous.
// « Conseille 23 (bareme 70) » : on montre TOUJOURS d'ou vient le chiffre ajuste.
function _tcfgDensNote(brut,aff){
  if(brut==null||aff==null||Number(brut)===Number(aff)) return '';
  return ' (barème '+brut+')';
}
// Le bareme REGIONAL d'abord (window._mvBaremeRef), la densite ensuite (_mvHhaDens).
// Les deux reglages se composent et restent independants.
function _tcfgCatBar(c){ return (window._mvBaremeRef?window._mvBaremeRef(c):c)||c; }
function _tcfgCatRefBrut(c0,i){var c=_tcfgCatBar(c0);if(c._horsBareme)return null;if(c.type==='passages')return (c.passagesHha&&c.passagesHha[i]!=null)?c.passagesHha[i]:c.hha;if(c.type==='niveaux')return (c.niveaux&&c.niveaux[i])?c.niveaux[i].hha:[50,20,20][i]||0;return c.hha;}
function _tcfgCatRef(c,i){var b=_tcfgCatRefBrut(c,i);if(b==null)return null;return (window._mvHhaDens?window._mvHhaDens(b):b);}
function _tcfgRender(){
  var c=(window.TACHES_CATALOGUE||[]).find(function(x){return x.nom===_tcfg.nom;});
  var ttl=document.getElementById('tcfg-title');if(ttl)ttl.textContent=(TEMOJI[_tcfg.nom]||'🌿')+' '+((c&&c.label)||_tcfg.nom);
  var h='';
  // L'appartenance d'une tâche à une période se règle dans la période elle-même (Réglages ›
  // Campagne), plus ici : ces chips écrivaient dans TACHES[].saisons, qui n'est plus lu.
  var _perT=(window._visuSaison?window._visuSaison():'');
  if(_perT) h+='<div class="tcfg-lbl">Enregistrée dans la période « '+_escHtml(_perT)+' »</div>';
  if(_tcfg.trous){
    h+='<div class="tcfg-tar">🪛 <b>Piloté par la tarière</b> — temps = trous saisis en session Tarière × le délai ci-dessous. Pas d\'h/ha à la surface.</div>';
    h+='<div class="tcfg-lbl">Temps par trou</div><div class="tcfg-hrow"><input class="tcfg-in" type="number" min="0.5" max="60" step="0.5" value="'+_tcfg.minTrou+'" oninput="_tcfgMinTrou(this.value)"><span class="tcfg-u">min/trou</span></div>';
  } else if(_tcfg.tempsReel){
    h+='<div class="tcfg-tr">⏱️ <b>Temps réel</b> — pas d\'heures conventionnelles. Estimation optionnelle pour la charge / l\'ETP.</div>';
    h+='<div class="tcfg-lbl">Estimation h/ha <span style="font-weight:400">(optionnel)</span></div><div class="tcfg-hrow"><input class="tcfg-in" type="number" min="0" max="500" value="'+_tcfg.estimate+'" placeholder="—" oninput="_tcfgEstimate(this.value)"><span class="tcfg-u">h/ha</span></div>';
  } else if(_tcfg.type==='passages'||_tcfg.type==='niveaux'){
    var kind=_tcfg.type==='passages'?'passage':'niveau',K=_tcfg.type==='passages'?'P':'N';
    h+='<div class="tcfg-lbl">Nombre de '+kind+'s</div><div class="tcfg-cnt">'+[1,2,3].map(function(n){return '<button class="tcfg-cc'+(_tcfg.count===n?' on':'')+'" onclick="_tcfgSetCount('+n+')">'+n+'</button>';}).join('')+'</div>';
    h+='<div class="tcfg-lbl">Heures par '+kind+'</div>';
    for(var i=0;i<_tcfg.count;i++){var ref=_tcfgCatRef(c,i);var cur=_tcfg.hours[i]!=null?_tcfg.hours[i]:ref;var mod=Number(cur)!==Number(ref);h+='<div class="tcfg-hrow"><span class="tcfg-k">'+K+(i+1)+'</span><input class="tcfg-in" type="number" min="0" max="500" value="'+cur+'" oninput="_tcfgHour('+i+',this.value)" id="tcfg-h-'+i+'"><span class="tcfg-u">h/ha</span><span class="tcfg-co">Conseillé '+ref+_tcfgDensNote(_tcfgCatRefBrut(c,i),ref)+'</span><button class="tcfg-rst" onclick="_tcfgReset('+i+','+ref+')">↺</button><span class="tcfg-mf'+(mod?' on':'')+'" id="tcfg-mf-'+i+'">✎</span></div>';}
  } else {
    var ref0=c.hha,cur0=_tcfg.simple!=null?_tcfg.simple:ref0,mod0=Number(cur0)!==Number(ref0);
    h+='<div class="tcfg-lbl">Heures par hectare</div><div class="tcfg-hrow"><input class="tcfg-in" type="number" min="0" max="500" value="'+cur0+'" oninput="_tcfgHour(-1,this.value)" id="tcfg-h-s"><span class="tcfg-u">h/ha</span><span class="tcfg-co">Conseillé '+ref0+_tcfgDensNote(c.hha,ref0)+'</span><button class="tcfg-rst" onclick="_tcfgReset(-1,'+ref0+')">↺</button><span class="tcfg-mf'+(mod0?' on':'')+'" id="tcfg-mf-s">✎</span></div>';
  }
  var body=document.getElementById('tcfg-body');if(body)body.innerHTML=h;
  var btn=document.getElementById('tcfg-save');if(btn)btn.textContent=_tcfg.isEdit?'✓ Enregistrer':'＋ Ajouter à la saison';
}
function _tcfgSetCount(n){_tcfg.count=n;var c=(window.TACHES_CATALOGUE||[]).find(function(x){return x.nom===_tcfg.nom;});while(_tcfg.hours.length<n)_tcfg.hours.push(_tcfgCatRef(c,_tcfg.hours.length));_tcfg.hours=_tcfg.hours.slice(0,n);_tcfgRender();}
function _tcfgHour(i,v){var num=parseFloat(v);var c=(window.TACHES_CATALOGUE||[]).find(function(x){return x.nom===_tcfg.nom;});if(i<0){_tcfg.simple=isNaN(num)?0:num;var mf=document.getElementById('tcfg-mf-s');if(mf)mf.className='tcfg-mf'+(Number(_tcfg.simple)!==Number(c.hha)?' on':'');}else{_tcfg.hours[i]=isNaN(num)?0:num;var mf2=document.getElementById('tcfg-mf-'+i);if(mf2)mf2.className='tcfg-mf'+(Number(_tcfg.hours[i])!==Number(_tcfgCatRef(c,i))?' on':'');}}
function _tcfgEstimate(v){var num=parseFloat(v);_tcfg.estimate=isNaN(num)?'':num;}
function _tcfgMinTrou(v){var num=parseFloat(v);_tcfg.minTrou=isNaN(num)?3:num;}
function _tcfgReset(i,ref){if(i<0){_tcfg.simple=ref;}else{_tcfg.hours[i]=ref;}_tcfgRender();}
function tcfgSave(){
  var c=(window.TACHES_CATALOGUE||[]).find(function(x){return x.nom===_tcfg.nom;});
  var t={nom:_tcfg.nom};
  // Cet écran édite les HEURES. Il ne doit rien effacer d'autre. L'entrée était
  // reconstruite de zéro : les saisons de la tâche et son rattachement conventionnel
  // disparaissaient, et _normalizeTaches reposait au rechargement celles du CATALOGUE.
  // Ouvrir « Pioche » et enregistrer sans rien changer la faisait passer d'« Automne »
  // à « Printemps », en silence. On repart donc de ce qui existe.
  var _ex=(window.TACHES||[]).find(function(x){return x.nom===_tcfg.nom;});
  if(_ex){
    if(_ex.saisons&&_ex.saisons.length) t.saisons=_ex.saisons.slice();
    else if(_ex.anytime) t.anytime=true;
    if(_ex.conv) t.conv=_ex.conv;
  } else if(c){
    // Tâche ajoutée depuis le barème : saisons du catalogue, ce que l'écran montrait déjà.
    if(c.anytime) t.anytime=true;
    else if(c.saisons) t.saisons=c.saisons.slice();
  }
  var saveCfg=false;
  if(_tcfg.trous){t.trous=true;if(_tcfg.minTrou){window.CONFIG=window.CONFIG||{};CONFIG.plantation_min_trou=_tcfg.minTrou;saveCfg=true;}}
  else if(_tcfg.tempsReel){t.tempsReel=true;t.complementaire=true;if(_tcfg.estimate!==''&&_tcfg.estimate>0)t.hha=_tcfg.estimate;}
  else if(_tcfg.type==='passages'){t.type='passages';t.passagesHha=_tcfg.hours.slice(0,_tcfg.count);t.hha=t.passagesHha[0];window.SAISON_PASSAGES=window.SAISON_PASSAGES||{};window.SAISON_PASSAGES[_tcfg.nom]=_tcfg.count;window.CONFIG=window.CONFIG||{};window.CONFIG.saison_passages=window.SAISON_PASSAGES;saveCfg=true;}
  else if(_tcfg.type==='niveaux'){t.type='niveaux';t.niveaux=_tcfg.hours.slice(0,_tcfg.count).map(function(hh,i){return {num:i+1,hha:hh};});t.hha=t.niveaux.reduce(function(s,n){return s+n.hha;},0);if(c.skipRule)t.skipRule=true;window.SAISON_PASSAGES=window.SAISON_PASSAGES||{};window.SAISON_PASSAGES[_tcfg.nom]=_tcfg.count;window.CONFIG=window.CONFIG||{};window.CONFIG.saison_passages=window.SAISON_PASSAGES;saveCfg=true;}
  else {t.hha=_tcfg.simple;}
  var idx=(window.TACHES||[]).findIndex(function(x){return x.nom===_tcfg.nom;});
  if(idx>=0)window.TACHES[idx]=t;else window.TACHES.push(t);
  window.TACHES=window.TACHES;
  // La tâche doit figurer dans la liste de la période consultée, sinon elle n'apparaît nulle part.
  var _per=_regPeriode(), saveSais=false;
  if(_per){
    if(!Array.isArray(_per.taches))_per.taches=[];
    if(_per.taches.indexOf(_tcfg.nom)<0){ _per.taches.push(_tcfg.nom); window.SAISONS=window.SAISONS; saveSais=true; }
  }
  if(window.TRAVAUX){delete window.TRAVAUX[_tcfg.nom];if(window.recalcTravaux)window.recalcTravaux(_tcfg.nom);window.TRAVAUX=window.TRAVAUX;}
  window.saveData('taches');if(saveCfg)window.saveData('config');if(saveSais)window.saveData('saisons');window.saveData('travaux');
  window.closeOv(null,'ovTacheCfg');
  showToast('✅ '+((c&&c.label)||_tcfg.nom)+' enregistrée','#3D6B27');
  _tcfg=null;renderReglages();
}

// ════════ Création de saison : choix des tâches + suppression ════════
function _seedFromCat(c){
  var r={nom:c.nom};
  if(c.anytime)r.anytime=true; else if(c.saisons)r.saisons=c.saisons.slice();
  if(c.trous){r.trous=true; if(c.minTrou)r.minTrou=c.minTrou;} else r.hha=c.hha;
  if(c.tempsReel)r.tempsReel=true;
  if(c.complementaire)r.complementaire=true;
  if(c.type)r.type=c.type;
  if(c.niveaux)r.niveaux=c.niveaux.map(function(n){return {num:n.num,hha:n.hha};});
  if(c.passagesHha)r.passagesHha=c.passagesHha.slice();
  if(c.skipRule)r.skipRule=true;
  return r;
}
// Référentiel complet : catalogue de la convention + tâches propres au domaine. Une période
// pouvant contenir n'importe quel travail, restreindre aux « obligatoires » n'a plus de sens.
function _nsRefTaches(){
  var out=[],vus={};
  (window.TACHES_CATALOGUE||[]).forEach(function(c){ if(c&&c.nom&&!vus[c.nom]){vus[c.nom]=1;out.push(c);} });
  (window.TACHES||[]).forEach(function(t){
    if(!t||!t.nom||vus[t.nom])return; vus[t.nom]=1;
    out.push({nom:t.nom,label:t.nom,hha:t.hha,type:t.type,niveaux:t.niveaux,passagesHha:t.passagesHha,trous:t.trous});
  });
  return out;
}
function _nsBuildTaches(){
  var host=document.getElementById('ns-taches-pick'); if(!host)return;
  var oblig=_nsRefTaches();
  if(!_nsTachesTouched && !_nsTachesSel.size){ _nsTachesSel=new Set(); }
  host.innerHTML=oblig.map(function(c){
    var on=_nsTachesSel.has(c.nom);
    var info = c.trous?'tarière'
      : c.type==='niveaux'?(c.niveaux.reduce(function(s,n){return s+n.hha;},0)+' h/ha')
      : c.type==='passages'?(c.passagesHha.join('/')+' h/ha')
      : (c.hha+' h/ha');
    return '<div class="ns-tpick'+(on?' on':'')+'" onclick="_nsToggleTache(\''+_escAttr(c.nom)+'\')">'
      +'<span class="e">'+(TEMOJI[c.nom]||'🌿')+'</span>'
      +'<span class="n">'+c.label+'</span>'
      +'<span class="h">'+info+'</span>'
      +'<span class="ck">'+(on?'✓':'')+'</span></div>';
  }).join('');
  var cnt=document.getElementById('ns-taches-count'); if(cnt)cnt.textContent=_nsTachesSel.size+' sélectionnée'+(_nsTachesSel.size>1?'s':'');
}
function _nsToggleTache(nom){ _nsTachesTouched=true; if(_nsTachesSel.has(nom))_nsTachesSel.delete(nom); else _nsTachesSel.add(nom); _nsBuildTaches(); }

function deleteSaison(nom){
  if((window.SAISONS||[]).length<=1){ showToast('Impossible : il faut au moins une saison','#B85A1A'); return; }
  var s=(window.SAISONS||[]).find(function(x){return x.nom===nom;}); if(!s)return;
  window.DANGER_CFG.deleteSaison={
    icon:'📅', title:'Supprimer la saison « '+nom+' » ?',
    sub:'La saison et son repérage de dates seront retirés.',
    word:'SUPPRIMER', btn:'🗑️ Supprimer la saison', successSub:'Saison supprimée.',
    items:['Les parcelles et le journal ne sont pas effacés','L\'avancement enregistré pour cette saison reste dans les parcelles','Les sessions conservent leur date'],
    exec:function(){
      var wasActive=s.active;
      window.SAISONS=(window.SAISONS||[]).filter(function(x){return x.nom!==nom;});
      if(wasActive && window.SAISONS.length){ window.SAISONS[window.SAISONS.length-1].active=true; }
      window.SAISONS=window.SAISONS;
      window.saveData('saisons','🗑️ Saison supprimée'); renderReglages();
      if(window.renderParcelles)window.renderParcelles(); if(window.computePStats)window.computePStats();
    }
  };
  window.openOvDanger('deleteSaison');
}

// Retire une tâche de LA période consultée. Si c'est sa dernière période, elle sort du référentiel.
function removeTacheFromSaison(nom){
  var t=(window.TACHES||[]).find(function(x){return x.nom===nom;}); if(!t)return;
  var per=_regPeriode(), perN=(per&&per.nom)||'';
  function delAll(){
    window.TACHES=(window.TACHES||[]).filter(function(x){return x.nom!==nom;}); window.TACHES=window.TACHES;
    (window.SAISONS||[]).forEach(function(s){
      if(s&&Array.isArray(s.taches)){ var k=s.taches.indexOf(nom); if(k>=0)s.taches.splice(k,1); }
    });
    window.SAISONS=window.SAISONS;
    window.saveData('taches','🗑️ Tâche supprimée'); window.saveData('saisons'); renderReglages();
  }
  if(!per){
    window.openConfirmDel('Supprimer « '+nom+' » ?','Aucune période n\'est consultée : la tâche sera retirée du domaine.',
      delAll,'🌿','🗑️ Supprimer la tâche','#C0392B');
    return;
  }
  var autres=(window.SAISONS||[]).filter(function(s){
    return s && s.nom!==perN && Array.isArray(s.taches) && s.taches.indexOf(nom)>=0;
  }).map(function(s){return s.nom;});
  if(autres.length){
    window.openConfirmDel('Retirer « '+nom+' » de '+perN+' ?','La tâche reste sur : '+autres.join(', ')+'.',
      function(){
        if(!Array.isArray(per.taches))per.taches=[];
        var k=per.taches.indexOf(nom); if(k>=0)per.taches.splice(k,1);
        window.SAISONS=window.SAISONS;
        window.saveData('saisons','↩︎ '+nom+' retirée de '+perN); renderReglages();
      },'🌿','↩︎ Retirer de cette période','#8A5A38');
  } else {
    window.openConfirmDel('Supprimer « '+nom+' » ?',perN+' est la seule période de cette tâche → elle sera retirée du domaine.',
      delAll,'🌿','🗑️ Supprimer la tâche','#C0392B');
  }
}

function deleteTache(nom){
  window.DANGER_CFG.deleteTache={
    icon:'🌿',title:'Supprimer "'+nom+'" ?',
    sub:'Cette tâche sera retirée de toutes les saisons.',
    word:'SUPPRIMER',btn:'🗑️ Supprimer la tâche',successSub:'Tâche supprimée.',
    items:['L\'historique journal n\'est pas affecté','Les stats de cette tâche disparaîtront'],
    exec:function(){window.TACHES=window.TACHES.filter(t=>t.nom!==nom);window.TACHES=window.TACHES;window.saveData('taches','🗑️ Tâche supprimée');renderReglages();}
  };
  window.openOvDanger('deleteTache');
}

function openEditHha(nom){
  var t=window.TACHES.find(function(x){return x.nom===nom;});
  if(!t)return;
  var titleEl=document.getElementById('ehha-title');
  var subEl=document.getElementById('ehha-sub');
  var bodyEl=document.getElementById('ehha-body');
  if(titleEl)titleEl.textContent=(TEMOJI[t.nom]||'🌿')+' '+(((window.TACHES_CATALOGUE||[]).find(function(c){return c.nom===t.nom;})||{}).label||t.nom);
  var bodyHtml='';
  var nomEsc=_escAttr(nom);
  if(t.type==='passages'){
    var planNb=window.SAISON_PASSAGES[t.nom]||2;
    var phha=t.passagesHha||[];
    for(var pp=1;pp<=planNb;pp++){
      bodyHtml+='<div class="fl">Passage '+pp+'</div>'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'
        +'<input class="fi ac" type="number" min="0" max="500" step="1" id="ehha-pass-'+pp+'">'
        +'<span style="font-size:14px;color:var(--texte-doux)">h/ha</span></div>';
    }
    if(subEl)subEl.textContent='h/ha par passage · '+planNb+' passage'+(planNb>1?'s':'')+' configuré'+(planNb>1?'s':'');
  } else if(t.type==='niveaux'){
    var nivsRef=t.niveaux||[{num:1,hha:50},{num:2,hha:25},{num:3,hha:25}];
    var planNbN=window.SAISON_PASSAGES[t.nom]||3;
    var nivsActive=nivsRef.filter(function(n){return n.num<=planNbN;});
    nivsActive.forEach(function(niv){
      bodyHtml+='<div class="fl">Niveau '+niv.num+'</div>'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'
        +'<input class="fi ac" type="number" min="0" max="500" step="1" id="ehha-niv-'+niv.num+'">'
        +'<span style="font-size:14px;color:var(--texte-doux)">h/ha</span></div>';
    });
    if(subEl)subEl.textContent='h/ha par niveau · '+planNbN+' niveau'+(planNbN>1?'x':'')+' configuré'+(planNbN>1?'s':'');
  } else if(t.trous){
    var _mtCur=(window.CONFIG&&parseFloat(CONFIG.plantation_min_trou))||3;
    bodyHtml+='<div class="fl">🪛 Temps par trou (tarière)</div>'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
      +'<input class="fi ac" type="number" min="0.5" max="60" step="0.5" id="ehha-mintrou" value="'+_mtCur+'">'
      +'<span style="font-size:14px;color:var(--texte-doux)">min/trou</span></div>'
      +'<div style="font-size:11px;color:var(--texte-doux);margin:4px 0 14px">Pas d\'h/ha : le temps = trous saisis en session Tarière × ce délai.</div>';
    if(subEl)subEl.textContent='Travail piloté par les trous de tarière';
  } else {
    bodyHtml+='<div class="fl">Heures par hectare</div>'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
      +'<input class="fi ac" type="number" min="0" max="500" step="1" id="ehha-val">'
      +'<span style="font-size:14px;color:var(--texte-doux)">h/ha</span></div>'
      +'<div style="font-size:11px;color:var(--vert);background:rgba(61,107,39,0.1);border-radius:6px;padding:5px 9px;margin:6px 0 14px" id="ehha-est"></div>';
    if(subEl)subEl.textContent=t.tempsReel?'Estimation d\'heures par hectare (temps réel)':'Référentiel d\'heures estimées par hectare';
  }
  bodyHtml+='<button class="mbtn verte" onclick="saveEditHha(\''+nomEsc+'\')" style="margin-top:4px">✓ Enregistrer</button>'
    +'<button class="mbtn" style="background:transparent;border:1.5px solid var(--gris);color:var(--texte-doux);margin-top:6px" onclick="window.closeOv(null,\'ovEditHha\')">Annuler</button>';
  if(bodyEl)bodyEl.innerHTML=bodyHtml;
  // iOS : setter .value explicitement après innerHTML
  if(t.type==='passages'){
    var planNb2=window.SAISON_PASSAGES[t.nom]||2;
    var phha2=t.passagesHha||[];
    for(var pp2=1;pp2<=planNb2;pp2++){
      var elP=document.getElementById('ehha-pass-'+pp2);
      if(elP)elP.value=phha2[pp2-1]!=null?phha2[pp2-1]:t.hha;
    }
  } else if(t.type==='niveaux'){
    var nivsRef2=t.niveaux||[{num:1,hha:50},{num:2,hha:25},{num:3,hha:25}];
    nivsRef2.forEach(function(niv){
      var elN=document.getElementById('ehha-niv-'+niv.num);
      if(elN)elN.value=niv.hha;
    });
  } else {
    var elV=document.getElementById('ehha-val');
    var surf=(typeof window._recalcSurfTotale==='function'?Number(window._recalcSurfTotale()):Number(window.SURF_TOTALE))||0;
    if(elV){
      elV.value=t.hha;
      var hintEl=document.getElementById('ehha-est');
      if(hintEl)hintEl.textContent='~'+Math.round(t.hha*surf)+'h estimées sur '+surf.toFixed(2)+'ha';
      elV.oninput=function(){
        var h=document.getElementById('ehha-est');
        if(h)h.textContent='~'+Math.round((parseFloat(elV.value)||0)*surf)+'h estimées sur '+surf.toFixed(2)+'ha';
      };
    }
  }
  window.openOv('ovEditHha');
}

function saveEditHha(nom){
  var t=window.TACHES.find(function(x){return x.nom===nom;});
  if(!t)return;
  if(t.type==='passages'){
    var planNb=window.SAISON_PASSAGES[t.nom]||2;
    if(!t.passagesHha)t.passagesHha=Array.from({length:planNb},function(){return t.hha;});
    while(t.passagesHha.length<planNb)t.passagesHha.push(t.hha);
    for(var pp=1;pp<=planNb;pp++){
      var elP=document.getElementById('ehha-pass-'+pp);
      if(elP){var v=parseFloat(elP.value);if(!isNaN(v)&&v>=0)t.passagesHha[pp-1]=v;}
    }
    if(t.passagesHha[0]!=null)t.hha=t.passagesHha[0];
  } else if(t.type==='niveaux'){
    var nivsRef=t.niveaux||[{num:1,hha:50},{num:2,hha:25},{num:3,hha:25}];
    nivsRef.forEach(function(niv){
      var elN=document.getElementById('ehha-niv-'+niv.num);
      if(elN){var vN=parseFloat(elN.value);if(!isNaN(vN)&&vN>=0)niv.hha=vN;}
    });
    t.niveaux=nivsRef;
    t.hha=nivsRef.reduce(function(s,n){return s+n.hha;},0);
  } else if(t.trous){
    var _elMT=document.getElementById('ehha-mintrou');if(_elMT){var _mt=parseFloat(_elMT.value);if(!isNaN(_mt)&&_mt>0){window.CONFIG=window.CONFIG||{};CONFIG.plantation_min_trou=_mt;if(window.saveData)window.saveData('config');}}
  } else {
    var elV=document.getElementById('ehha-val');
    if(elV){var vV=parseFloat(elV.value);if(!isNaN(vV)&&vV>=0)t.hha=vV;}
  }
  window.TACHES=window.TACHES;
  delete window.TRAVAUX[nom];window.recalcTravaux(nom);window.TRAVAUX=window.TRAVAUX;
  window.saveData('taches');window.saveData('travaux');
  window.closeOv(null,'ovEditHha');
  showToast('✅ '+tNom(nom)+' : h/ha mis à jour','#3D6B27');
  renderReglages();
}

// Membres
function _mvEmailPencil(m){
  try{
    if(!(window._mvCanEditEmail&&window._mvCanEditEmail())) return '';
    if(!m||!m.email) return '';
    return ' <span class="m-email-edit" title="Modifier l\'e-mail" onclick="event.stopPropagation();window._openEmailModal&&window._openEmailModal(\''+_escAttr(m.email)+'\',\''+_escAttr(m.nom)+'\')" style="cursor:pointer;color:var(--terre,#8A5A38);margin-left:5px;font-size:12px">\u270E</span>';
  }catch(e){ return ''; }
}
function toggleRole(r){window.rolesTemp[r]=!window.rolesTemp[r];const el=document.getElementById('rc-'+r);el.classList.toggle('on',window.rolesTemp[r]);el.textContent=window.rolesTemp[r]?'✓':'';}
// ── SEC-2 : affichage UNIQUE du mot de passe initial ─────────────────
// Le mot de passe généré par le serveur transite par la réponse de createMemberAccount
// et n'est écrit NULLE PART : ni Firestore, ni claims, ni logs, ni localStorage. Cet
// overlay est la seule et unique occasion de le lire. Une fois fermé il est perdu — y
// compris pour l'admin, y compris pour GUERETTECH. C'est le principe, pas une limite :
// le seul recours est de le régénérer (bouton « Réinitialiser » sur la fiche du membre).
function _mvShowNewPwd(nom, email, pwd, isReset){
  window._mvNewPwdVal = pwd;
  document.getElementById('npw-sub').textContent = isReset ? ('Nouveau mot de passe · '+nom) : ('Compte créé · '+nom);
  document.getElementById('npw-who').textContent = '👤 '+nom+' · '+email;
  document.getElementById('npw-val').textContent = pwd;
  const cb = document.getElementById('npw-copy');
  if(cb){ cb.textContent='📋 Copier'; cb.disabled=false; }
  window.openOv('ovNewPwd');
}
function _mvCopyNewPwd(){
  const btn = document.getElementById('npw-copy');
  const val = window._mvNewPwdVal || '';
  const done = function(){ if(btn){ btn.textContent='✅ Copié'; btn.disabled=true; } };
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(val).then(done).catch(function(){ _mvCopyFallback(val, done); });
    } else { _mvCopyFallback(val, done); }
  }catch(e){ _mvCopyFallback(val, done); }
}
// Repli : le presse-papier moderne exige un contexte sécurisé et peut être refusé en PWA
// iOS. execCommand est obsolète mais reste la seule voie fiable dans ce cas.
function _mvCopyFallback(val, done){
  try{
    const ta = document.createElement('textarea');
    ta.value = val; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta); done();
  }catch(e){ showToast('Copie impossible — notez-le à la main','#B85A1A'); }
}

// Miroir CLIENT de assertRealEmailForAdmin (claims.js). Le verrou réel est serveur ;
// celui-ci n'existe que pour dire POURQUOI avant de partir en aller-retour réseau.
function _mvAdminNeedsRealMail(email, roles){
  return (roles||[]).indexOf('admin')>=0 && /@(mavigne\.app|mavigneapp\.fr)$/i.test(String(email||'').trim());
}

async function saveMembre(){
  const nom   = document.getElementById('nm-nom').value.trim();
  const email = document.getElementById('nm-email').value.trim();
  // SEC-2 : champ vide = le SERVEUR génère un mot de passe prononçable unique.
  // Plus de `vigne21` en repli : un mot de passe partagé par tous n'en est pas un.
  const mdp   = (document.getElementById('nm-mdp').value || '').trim();
  if(!nom || !email){ showToast('Prénom et email obligatoires','#A0291E'); return; }
  const roles = Object.entries(window.rolesTemp).filter(([,v])=>v).map(([k])=>k);
  if(roles.length===0) roles.push('ouvrier');
  if(_mvAdminNeedsRealMail(email, roles)){
    showToast('❌ Un administrateur doit avoir une vraie adresse e-mail (secours)','#A0291E'); return;
  }
  // Désactiver le bouton pendant la création Auth
  const btn = document.querySelector('#ovMembre .mbtn.verte');
  if(btn){ btn.disabled=true; btn.textContent='⏳ Création…'; }
  let _res = null;
  try {
    // Compte Auth + claims posés atomiquement par la Cloud Function createMemberAccount.
    _res = await window.createAuthAccount(email, mdp, { roles: roles });
  } catch(e) {
    const reason = (e && e.details && e.details.reason) || '';
    const msg = reason==='admin_needs_real_email'
      ? '❌ Un administrateur doit avoir une vraie adresse e-mail (secours).'
      : e.code==='auth/email-already-in-use'
      ? '❌ Cet email est déjà utilisé sur Firebase.'
      : e.code==='auth/weak-password'
      ? '❌ Mot de passe trop faible (8 caractères min.).'
      : e.code==='auth/invalid-email'
      ? '❌ Adresse email invalide.'
      : '❌ Erreur : '+(e.message||e.code);
    showToast(msg,'#A0291E');
    if(btn){ btn.disabled=false; btn.textContent='Ajouter'; }
    return;
  }
  const couleurs = ['#B85A1A','#C0392B','#1A5276','#7D3C98','#2C3E50'];
  window.MEMBRES.push({nom, email, roles, statut:'Actif', couleur:couleurs[window.MEMBRES.length%couleurs.length]});
  window.saveData('membres');
  document.getElementById('ovMembre').classList.remove('open');
  // L'overlay du mot de passe s'ouvre APRÈS la fermeture de la fiche : il doit être la
  // dernière chose à l'écran, pas une couche sous une autre.
  if(_res && _res.password){ _mvShowNewPwd(nom, email, _res.password, false); }
  else { showToast('👤 '+nom+' ajouté','#3D6B27'); }
  document.getElementById('nm-nom').value='';
  document.getElementById('nm-email').value='';
  document.getElementById('nm-mdp').value='';
  window.rolesTemp={ouvrier:true,tractoriste:false,saisonnier:false,pilotage:false};
  ['ouvrier','tractoriste','saisonnier','pilotage'].forEach(r=>{const el=document.getElementById('rc-'+r);el.classList.toggle('on',window.rolesTemp[r]);el.textContent=window.rolesTemp[r]?'✓':'';});
  if(btn){ btn.disabled=false; btn.textContent='Ajouter'; }
  renderReglages();
}
// ══════════════════════════════════════════════════════════════════════════
// MODULES VISIBLES PAR MEMBRE  (m.mods = { cave:false, vigne:false, … })
// --------------------------------------------------------------------------
// Un caviste n'a que faire de l'avancement des parcelles ; un ouvrier n'a rien
// a faire dans la Cave. Chaque membre porte donc la liste des modules qu'on lui
// masque — SES exclusions seulement, jamais des autorisations : le champ ne peut
// que RETIRER ce que la formule du domaine accorde deja (cf. _canModule dans
// firebase.js). Un membre sans le champ voit exactement ce qu'il voyait avant.
//
// ⚠️ C'est de l'allegement d'interface, PAS du cloisonnement. Le doc `membres`
// est lisible par toute l'equipe et le masquage se force depuis la console. Ce
// qui est reellement protege l'est cote rules (SEC-1 : `paie`, `planning_*`).
// Ne jamais repondre a un client que ca « interdit l'acces » a une donnee.
var _EM_MODS=[
  {k:'vigne',    ic:'\uD83C\uDF3F', l:'Vigne',    d:'Accueil, parcelles, avancement, journal'},
  {k:'tracteur', ic:'\uD83D\uDE9C', l:'Tracteur', d:'Sessions, entretien, carburant'},
  {k:'phyto',    ic:'\uD83E\uDDEA', l:'Phyto',    d:'Registre des traitements, catalogue E-Phy'},
  {k:'cave',     ic:'\uD83C\uDF77', l:'Cave',     d:'Le Cuvier, Le Chai, Le mill\u00e9sime'},
  {k:'reserve',  ic:'\uD83D\uDCE6', l:'R\u00e9serve',  d:'Intrants, f\u00fbts, bilan mati\u00e8re'},
  {k:'planning', ic:'\uD83D\uDCC5', l:'Planning', d:'Heures, cong\u00e9s, compteur'},
  {k:'pilotage', ic:'\uD83D\uDCCA', l:'Pilotage', d:'Tableau de bord'}
];
// Profils rapides : un domaine de 4 permanents + 7 saisonniers, c'est 7 cases a
// cocher par personne. Ces boutons posent une combinaison d'un geste, qu'on
// ajuste ensuite a la main.
var _EM_PRESETS={
  tout:     [],
  cave:     ['vigne','tracteur','phyto','planning','pilotage'],
  vigne:    ['tracteur','phyto','cave','reserve','planning','pilotage'],
  tracteur: ['cave','reserve','planning','pilotage']
};
// Modules proposes : ceux de la FORMULE du domaine (_planModule, jamais
// _canModule — sinon un admin qui s'est masque la Cave ne pourrait plus la
// re-cocher pour son caviste). Pilotage n'apparait que pour qui a le role, sans
// quoi la case serait un leurre. Reglages n'y figure pas : socle inalienable.
function _emModsFor(roles){
  var r=roles||[];
  var canPil=(r.indexOf('admin')>=0||r.indexOf('pilotage')>=0);
  return _EM_MODS.filter(function(x){
    if(x.k==='pilotage'&&!canPil) return false;
    try{ return window._planModule?window._planModule(x.k):true; }catch(e){ return true; }
  });
}
function _emModsHtml(m){
  var mods=(m.mods&&typeof m.mods==='object')?m.mods:{};
  var list=_emModsFor(m.roles);
  if(!list.length) return '';
  var off=list.filter(function(x){return mods[x.k]===false;}).length;
  return '<div class="fl" style="margin-top:14px">\uD83D\uDC41\uFE0F Modules visibles '
      +'<span style="font-size:11px;color:var(--texte-doux,#6b7280);font-weight:400">('
      +(off?(off+' masqu\u00e9'+(off>1?'s':'')):'tous visibles')+')</span></div>'
    +'<div style="font-size:11px;color:var(--texte-doux,#6b7280);margin:-2px 2px 8px;line-height:1.5">'
      +'All\u00e8ge la barre du bas de cette personne. \u00c0 d\u00e9cocher pour un poste sp\u00e9cialis\u00e9 \u2014 un caviste n\u2019a pas besoin de l\u2019avancement des vignes. '
      +'Ce n\u2019est pas une s\u00e9curit\u00e9\u202f: les droits d\u2019\u00e9criture restent ceux des r\u00f4les, et R\u00e9glages reste toujours accessible.</div>'
    +'<div class="emod-presets">'
      +'<button type="button" class="emod-preset" onclick="_emModPreset(\'tout\')">\u2728 Tout</button>'
      +'<button type="button" class="emod-preset" onclick="_emModPreset(\'vigne\')">\uD83C\uDF3F Vigne</button>'
      +'<button type="button" class="emod-preset" onclick="_emModPreset(\'tracteur\')">\uD83D\uDE9C Tracteur</button>'
      +'<button type="button" class="emod-preset" onclick="_emModPreset(\'cave\')">\uD83C\uDF77 Cave</button>'
      +'<button type="button" class="emod-preset" onclick="_emModPresetRole()">\uD83C\uDFAF Selon le r\u00f4le</button>'
    +'</div>'
    +'<div id="em-mods-list">'
      +list.map(function(x){
        var on=(mods[x.k]!==false);
        return '<div class="emod-row">'
          +'<span class="emod-ic" aria-hidden="true">'+x.ic+'</span>'
          +'<span class="emod-txt"><b>'+_escHtml(x.l)+'</b><span>'+_escHtml(x.d)+'</span></span>'
          +'<div class="role-chk emod-chk'+(on?' on':'')+'" data-mod="'+x.k+'" role="checkbox" aria-checked="'+(on?'true':'false')+'" aria-label="'+_escAttr(x.l)+'" onclick="_emModToggle(this)">'+(on?'\u2713':'')+'</div>'
          +'</div>';
      }).join('')
    +'</div>';
}
function _emModToggle(el){
  var on=el.classList.toggle('on');
  el.textContent=on?'\u2713':'';
  el.setAttribute('aria-checked',on?'true':'false');
}
// ★ 5e preset : la combinaison que la CREATION EN LOT pose deja d'elle-meme
// (table _MV_MODS_ROLE dans utils.js, source unique). Deux usages : remettre une
// fiche bricolee dans l'etat standard, et voir ce qu'un role donne avant de
// creer les comptes.
// ⚠️ Les roles lus sont ceux COCHES A L'ECRAN, pas ceux enregistres : on vient
// peut-etre de passer quelqu'un tractoriste, et le bouton doit repondre a ce
// qu'on voit, pas a ce qui est en base.
function _emModPresetRole(){
  // ⚠️ Les cases a cocher sont la SEULE source : l'etat des roles ne vit nulle
  // part ailleurs (toggleEmRole ne touche que la classe du DOM).
  // ⚠️ Array.prototype.forEach.call et non NodeList.forEach : c'est la forme
  // employee partout dans ce fichier, et elle ne depend pas du moteur.
  var roles=[];
  try{
    Array.prototype.forEach.call(document.querySelectorAll('[id^="erc-"].role-chk.on'),function(el){
      var r=String(el.id||'').slice(4); if(r) roles.push(r);
    });
  }catch(e){ roles=[]; }
  var md=(typeof window._mvModsDefaut==='function')?window._mvModsDefaut(roles):{};
  var off=Object.keys(md||{});
  if(!roles.length){ if(window.showToast) showToast('Cochez d\u2019abord un r\u00f4le','#B85A1A'); return; }
  var box=document.getElementById('em-mods-list'); if(!box) return;
  Array.prototype.forEach.call(box.querySelectorAll('.emod-chk'),function(el){
    var on=(off.indexOf(el.getAttribute('data-mod'))<0);
    el.classList.toggle('on',on);
    el.textContent=on?'\u2713':'';
    el.setAttribute('aria-checked',on?'true':'false');
  });
  if(window.showToast) showToast(off.length?('\u2713 '+off.length+' module'+(off.length>1?'s':'')+' masqu\u00e9'+(off.length>1?'s':'')):'\u2713 Tous les modules visibles','#3D6B27');
}

function _emModPreset(key){
  var off=_EM_PRESETS[key]||[];
  var box=document.getElementById('em-mods-list'); if(!box) return;
  Array.prototype.forEach.call(box.querySelectorAll('.emod-chk'),function(el){
    var on=(off.indexOf(el.getAttribute('data-mod'))<0);
    el.classList.toggle('on',on);
    el.textContent=on?'\u2713':'';
    el.setAttribute('aria-checked',on?'true':'false');
  });
}

function editMembre(nom){
  const m=window.MEMBRES.find(x=>x.nom===nom);
  if(!m)return;
  document.getElementById('em-title').textContent='\u270f\ufe0f '+nom;
  document.getElementById('em-nom').value=nom;
  document.getElementById('em-statut').value=m.statut;
  const er=document.getElementById('em-roles');
  const allRoles=['admin','ouvrier','tractoriste','saisonnier','pilotage'];
  er.innerHTML=allRoles.map(r=>`<div class="role-check-row"><span class="role-check-name">${r}</span><div class="role-chk ${m.roles.includes(r)?'on':''}" id="erc-${r}" onclick="toggleEmRole('${r}',this)">${m.roles.includes(r)?'\u2713':''}</div></div>`).join('');
  // Section contrat — injectée dynamiquement avant le bouton Enregistrer
  var cs=document.getElementById('em-contract-section');
  if(!cs){
    cs=document.createElement('div');
    cs.id='em-contract-section';
    var saveBtn=document.querySelector('#ovEditMembre .mbtn.verte');
    if(saveBtn)saveBtn.parentNode.insertBefore(cs,saveBtn);
  }
  cs.innerHTML=_emModsHtml(m)
    +'<div id="em-hist-wrap"></div>'
    +'<div class="fl" style="margin-top:14px">☀️ Solde CP initial <span style="font-size:11px;color:var(--texte-doux,#6b7280);font-weight:400">('+(((window.CONFIG&&window.CONFIG.cp_mode)==='ouvres')?'jours ouvrés':'jours ouvrables')+', au début de la période de référence)</span></div>'
    +'<input type="number" id="em-cp-initial-j" min="0" max="100" step="0.5" value="'+(m.cp_initial_j||0)+'" style="width:100%;padding:10px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;outline:none;box-sizing:border-box;margin-bottom:8px;font-family:inherit">'
    // Le taux horaire a quitté ce bloc : il est devenu un ÉVÉNEMENT de
    // l'historique ci-dessus (§39). Il vit toujours dans la collection `paie`,
    // PAS dans le doc `membres` (lisible par toute l'équipe) — l'historique ne
    // fusionne les deux qu'à l'affichage, et seulement pour un administrateur.
    +'<div class="fl" style="margin-top:14px">🏢 Rattachement</div>'
    +'<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:#f8fafc;border:1.5px solid #e5e7eb;border-radius:10px;padding:11px 12px">'
    +'<div style="font-size:13px;color:var(--texte,#374151);font-weight:600">Bureau<div style="font-size:11px;color:var(--texte-doux,#6b7280);font-weight:400;margin-top:1px;max-width:300px">Non compté dans la capacité de travail des vignes (calcul de charge).</div></div>'
    +'<div class="role-chk '+(m.bureau?'on':'')+'" id="em-bureau" onclick="toggleEmBureau(this)">'+(m.bureau?'✓':'')+'</div>'
    +'</div>'
    // ── EQUIPE COLLECTIVE ──────────────────────────────────────────────
    // Une ligne de planning qui vaut N personnes (vendange, prestataire). Le
    // nombre par defaut vit ICI ; il se change jour par jour dans le Planning.
    // Volontairement SOUS le rattachement : c'est le meme genre de drapeau, il
    // dit ce que cette fiche EST, pas ce qu'elle fait.
    +'<div class="fl" style="margin-top:14px">\u{1F465} \u00c9quipe collective</div>'
    +'<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:#f8fafc;border:1.5px solid #e5e7eb;border-radius:10px;padding:11px 12px">'
    +'<div style="font-size:13px;color:var(--texte,#374151);font-weight:600">Une ligne, plusieurs personnes<div style="font-size:11px;color:var(--texte-doux,#6b7280);font-weight:400;margin-top:1px;max-width:300px">Pour la vendange ou un prestataire. Ni compteur des 1607\u00a0h, ni cong\u00e9s, ni heures sup, ni compte de connexion\u00a0: ce n\u2019est pas un salari\u00e9, c\u2019est une \u00e9quipe.</div></div>'
    +'<div class="role-chk '+(m.collectif?'on':'')+'" id="em-collectif" onclick="toggleEmCollectif(this)">'+(m.collectif?'\u2713':'')+'</div>'
    +'</div>'
    +'<div id="em-eff-wrap" style="display:'+(m.collectif?'block':'none')+'">'
      +'<div class="fl" style="margin-top:10px">Nombre de personnes par d\u00e9faut</div>'
      +'<input type="number" id="em-effectif" min="1" max="999" step="1" inputmode="numeric" value="'+(m.effectif||1)+'" style="width:100%;padding:10px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:16px;outline:none;box-sizing:border-box;font-family:inherit">'
      +'<div style="font-size:11px;color:var(--texte-doux,#6b7280);margin:5px 2px 0;line-height:1.5">Se change jour par jour dans le Planning\u00a0: onglet <b>Le mois</b>, cocher les jours, puis \u{1F465}\u00a0Effectif. Pensez \u00e0 renseigner les dates de contrat pour que la ligne n\u2019apparaisse que pendant le chantier.</div>'
    +'</div>'
    // ── SEC-2 : l'admin du domaine dépanne son équipe lui-même ──────────
    // Remplacement du « mot de passe oublié » pour les membres sans vraie boîte mail
    // (saisonniers en @mavigne.app). Masqué aux non-admins par confort : la Cloud
    // Function refuse de toute façon un appelant sans claim `adm`.
    +((window.isAdmin&&window.isAdmin()&&m.email)?(
       '<div class="fl" style="margin-top:14px">🔑 Accès</div>'
      +'<div style="background:#f8fafc;border:1.5px solid #e5e7eb;border-radius:10px;padding:11px 12px">'
      +'<div style="font-size:11px;color:var(--texte-doux,#6b7280);line-height:1.5;margin-bottom:9px">Génère un nouveau mot de passe, affiché <b>une seule fois</b>. '+_escHtml(nom)+' devra le remplacer à sa prochaine connexion.</div>'
      +'<button type="button" class="mbtn" id="em-reset-pwd" onclick="_mvResetMemberPwd(\''+_escAttr(m.nom)+'\')" style="width:100%;margin:0;background:var(--terre-pale,#F3EADF);color:var(--terre,#8A5A38);border:1.5px solid var(--terre,#8A5A38)">🔑 Réinitialiser le mot de passe</button>'
      +'</div>'):'');
  window.openOv('ovEditMembre');
  _emhRender(nom);
}

// ── SEC-2 : réinitialisation d'un membre par l'admin du domaine ───────
// Double appui de confirmation (même patron que deleteMembre) : confirm() natif peut ne
// PAS s'afficher en PWA iOS standalone → l'action échouerait silencieusement.
async function _mvResetMemberPwd(nom){
  const m = (window.MEMBRES||[]).find(x=>x.nom===nom);
  if(!m || !m.email) return;
  const btn = document.getElementById('em-reset-pwd');
  if(!btn) return;
  if(btn.dataset.confirming!=='1'){
    btn.dataset.confirming='1';
    btn.textContent='⚠️ Confirmer — l\'ancien sera invalide';
    btn.style.background='var(--terre,#8A5A38)'; btn.style.color='white';
    setTimeout(()=>{ if(btn.dataset.confirming==='1'){ btn.dataset.confirming='';
      btn.textContent='🔑 Réinitialiser le mot de passe';
      btn.style.background='var(--terre-pale,#F3EADF)'; btn.style.color='var(--terre,#8A5A38)'; } },3500);
    return;
  }
  btn.dataset.confirming=''; btn.disabled=true; btn.textContent='⏳ Génération…';
  try{
    const r = await window._fbResetMemberPassword(m.email);
    document.getElementById('ovEditMembre').classList.remove('open');
    _mvShowNewPwd(m.nom, m.email, r.password, true);
  }catch(e){
    const reason=(e&&e.details&&e.details.reason)||'';
    showToast(reason==='no_account' ? ('❌ '+nom+' n\'a pas de compte') : ('❌ '+((e&&e.message)||'Erreur')),'#A0291E');
  }finally{
    btn.disabled=false; btn.textContent='🔑 Réinitialiser le mot de passe';
    btn.style.background='var(--terre-pale,#F3EADF)'; btn.style.color='var(--terre,#8A5A38)';
  }
}
function toggleEmRole(r,el){el.classList.toggle('on');el.textContent=el.classList.contains('on')?'✓':'';}
function toggleEmBureau(el){el.classList.toggle('on');el.textContent=el.classList.contains('on')?'✓':'';}
function toggleEmCollectif(el){
  el.classList.toggle('on');
  var on=el.classList.contains('on');
  el.textContent=on?'\u2713':'';
  var w=document.getElementById('em-eff-wrap');
  if(w)w.style.display=on?'block':'none';
}
// ══ LE « + » : d'abord QUOI, jamais « quelle valeur » ══════════════════
// Chaque option annonce son effet AVANT d'etre choisie — meme patron que les
// motifs d'absence du Planning (_planAbsEffet). Prolonger et reembaucher ne se
// ressemblent plus : l'un garde un compteur, l'autre en ouvre un.
// ⚠⚠ L'ETAT DOIT VIVRE SUR window, PAS DANS LA PORTEE DU MODULE.
// Un gestionnaire inline (onclick=, oninput=) s'execute dans la portee GLOBALE.
// Un `var` de haut niveau d'un module ES n'y est PAS : `window._EMH.d=this.value`
// levait « window._EMH is not defined » au premier caractere tape. C'est C15 applique
// a une VARIABLE et non a une fonction — exporter les fonctions ne suffit pas,
// il faut exporter tout ce qu'un attribut HTML nomme.
window._EMH={nom:'',t:'',d:'',type:'',fin:'',grille:'',v:0};
function _emhSheet(html){
  var b=document.getElementById('emevt-body'); if(!b) return;
  b.innerHTML=html;
  var ov=document.getElementById('ovEmEvt');
  if(ov&&!ov.classList.contains('open')) window.openOv('ovEmEvt');
}
function _emhClose(){ window.closeOv(null,'ovEmEvt'); }
function _emhPick(nom){
  var m=(window.MEMBRES||[]).find(function(x){return x.nom===nom;}); if(!m) return;
  var P=window._mvPeriodes(m), last=P.length?P[P.length-1]:null, auj=_paieAuj();
  var ouvert=!!last&&(!last.fin||last.fin>=auj);
  var nomA=_escAttr(nom);
  var O=[
    ['embauche','\u{1F4C4}','Embauche', ouvert
      ?'Cl\u00f4t le contrat en cours et en ouvre un nouveau, avec son propre compteur.'
      :'Ouvre un contrat. Son compteur d\u2019heures d\u00e9marre \u00e0 sa date de d\u00e9but.','var(--terre)',true],
    ['renouvellement','\u{1F504}','Renouvellement', ouvert
      ?'Repousse la fin sans couper\u00a0: <b>un seul contrat, un seul compteur</b>.'
      :'Indisponible \u2014 aucun contrat ouvert \u00e0 prolonger.','var(--vert-med)',ouvert],
    ['fin','\u23F9','Fin de contrat', ouvert
      ?'Cl\u00f4t au jour choisi. Le compteur est sold\u00e9, donc pay\u00e9.'
      :'Indisponible \u2014 aucun contrat ouvert \u00e0 clore.','var(--rouge)',ouvert]
  ];
  if(window.isAdmin&&window.isAdmin()) O.push(['taux','\u{1F4B6}','Changement de taux',
    'Les heures d\u00e9j\u00e0 travaill\u00e9es gardent l\u2019ancien taux.','var(--vert-med)',true]);
  var h='<div class="modal-hd"><div class="modal-title">Qu\u2019est-ce qui s\u2019est pass\u00e9\u00a0?</div></div>'
   +'<div class="modal-body"><div style="font-size:11.5px;color:var(--texte-doux);line-height:1.45;margin-bottom:13px">'
   +'Chaque \u00e9v\u00e9nement est dat\u00e9. L\u2019historique garde les deux versions, avant et apr\u00e8s.</div>';
  O.forEach(function(x){
    h+='<button type="button" class="emh-opt"'+(x[5]?(' onclick="_emhForm(\''+nomA+'\',\''+x[0]+'\')"'):' disabled')+'>'
      +'<span class="emh-opt-i">'+x[1]+'</span><span style="flex:1">'
      +'<span class="emh-opt-n">'+x[2]+'</span>'
      +'<span class="emh-opt-e" style="color:'+(x[5]?x[4]:'var(--texte-doux)')+'">'+x[3]+'</span></span></button>';
  });
  h+='<button type="button" class="mbtn" onclick="_emhClose()" style="width:100%;margin-top:8px">Annuler</button></div>';
  _emhSheet(h);
}
// ── puis QUAND, avec l'effet calcule EN DIRECT sur les vraies regles ─────
function _emhForm(nom,t){
  var m=(window.MEMBRES||[]).find(function(x){return x.nom===nom;}); if(!m) return;
  var P=window._mvPeriodes(m), last=P.length?P[P.length-1]:null, auj=_paieAuj();
  window._EMH={nom:nom,t:t,d:auj,type:(last&&last.type)||'CDI',fin:'',
        grille:(last&&last.grille)||'standard',
        v:((typeof window._mvPaieTauxEffAt==='function')?(window._mvPaieTauxEffAt(m,auj)||0):0)};
  if(t==='embauche'){ window._EMH.d=''; window._EMH.type='CDD'; }
  var h='<div class="modal-hd"><div class="modal-title">'+_EMH_LBL[t].i+' '+_EMH_LBL[t].n+'</div></div><div class="modal-body">';
  if(t==='embauche'){
    h+='<div class="emh-s" style="margin-bottom:6px">Un nouveau contrat. Le pr\u00e9c\u00e9dent, s\u2019il existe, sera archiv\u00e9\u00a0\u2014 il reste lisible et imprimable.</div>'
     +'<div class="fl">Date de d\u00e9but</div><input type="date" class="emh-in" id="emh-d" oninput="window._EMH.d=this.value;_emhEff()">'
     +'<div class="fl" style="margin-top:10px">Type de contrat</div><div class="ppicker" id="emh-ty"></div>'
     +'<div class="fl" style="margin-top:10px">Grille horaire</div><div class="ppicker" id="emh-gr"></div>'
     +'<div class="fl" style="margin-top:10px">Fin pr\u00e9vue <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--texte-doux)">\u2014 vide si sans terme</span></div>'
     +'<input type="date" class="emh-in" id="emh-f" oninput="window._EMH.fin=this.value;_emhEff()">';
  } else if(t==='renouvellement'){
    h+='<div class="emh-s" style="margin-bottom:6px">Le contrat continue. Seule sa date de fin bouge.</div>'
     +'<div class="fl">Date de signature</div><input type="date" class="emh-in" id="emh-d" value="'+_escAttr(auj)+'" oninput="window._EMH.d=this.value;_emhEff()">'
     +'<div class="fl" style="margin-top:10px">Nouvelle date de fin</div><input type="date" class="emh-in" id="emh-f" oninput="window._EMH.fin=this.value;_emhEff()">';
  } else if(t==='fin'){
    h+='<div class="emh-s" style="margin-bottom:6px">La fin r\u00e9elle. Elle prime sur la fin pr\u00e9vue, dans les deux sens.</div>'
     +'<div class="fl">Dernier jour travaill\u00e9</div><input type="date" class="emh-in" id="emh-d" value="'+_escAttr(auj)+'" oninput="window._EMH.d=this.value;_emhEff()">';
  } else {
    h+='<div class="emh-s" style="margin-bottom:6px">Une augmentation ouvre une p\u00e9riode et laisse le pass\u00e9 intact.</div>'
     +'<div class="fl">Taux horaire charg\u00e9 (\u20AC/h)</div>'
     +'<input type="number" step="0.10" min="0" inputmode="decimal" class="emh-in" id="emh-v" value="'+_escAttr(String(window._EMH.v||''))+'" oninput="window._EMH.v=parseFloat(this.value)||0;_emhEff()">'
     +'<div class="fl" style="margin-top:10px">\u00c0 partir du</div><input type="date" class="emh-in" id="emh-d" value="'+_escAttr(auj)+'" oninput="window._EMH.d=this.value;_emhEff()">';
  }
  h+='<div class="emh-eff" id="emh-eff"></div>'
   +'<div style="display:flex;gap:8px;margin-top:15px">'
   +'<button type="button" class="mbtn" onclick="_emhPick(\''+_escAttr(nom)+'\')" style="flex:1;margin:0">Retour</button>'
   +'<button type="button" class="mbtn verte" onclick="_emhOk()" style="flex:1;margin:0">Enregistrer</button></div></div>';
  _emhSheet(h);
  if(t==='embauche'){ _emhTyPick(); _emhGrPick(); }
  _emhEff();
}
function _emhTyPick(){
  var el=document.getElementById('emh-ty'); if(!el) return;
  el.innerHTML=['G\u00e9rant','CDI','CDD','TESA','Apprenti','Saisonnier','Extra'].map(function(t){
    return '<div class="pchk'+(window._EMH.type===t?' sel vert':'')+'" onclick="window._EMH.type=\''+t+'\';_emhTyPick();_emhEff()">'+t+'</div>';
  }).join('');
}
function _emhGrPick(){
  var el=document.getElementById('emh-gr'); if(!el) return;
  el.innerHTML=_emhGrilles().map(function(g){
    return '<div class="pchk'+(window._EMH.grille===g?' sel vert':'')+'" onclick="window._EMH.grille=\''+_escAttr(g)+'\';_emhGrPick();_emhEff()">'+_escHtml(g)+'</div>';
  }).join('');
}
function _emhEvt(){
  var E=window._EMH;
  if(E.t==='taux')           return (E.d&&E.v>0)?{d:E.d,t:'taux',v:E.v}:null;
  if(E.t==='embauche')       return E.d?{d:E.d,t:'embauche',type:E.type,fin:E.fin||'',grille:E.grille||'standard'}:null;
  if(E.t==='renouvellement') return (E.d&&E.fin)?{d:E.d,t:'renouvellement',fin:E.fin}:null;
  if(E.t==='fin')            return E.d?{d:E.d,t:'fin'}:null;
  return null;
}
// L'effet est calcule en SIMULANT l'ajout sur _mvPeriodes, jamais decrit en dur :
// un texte fige finirait par mentir le jour ou la regle change.
function _emhEff(){
  var box=document.getElementById('emh-eff'); if(!box) return;
  var e=_emhEvt();
  if(!e){ box.className='emh-eff'; box.textContent='Renseignez les dates pour voir ce que \u00e7a va changer.'; return; }
  if(window._EMH.t==='taux'){
    box.className='emh-eff good';
    box.innerHTML='\u00c0 partir du <b>'+_emhFmt(window._EMH.d)+'</b>, le co\u00fbt du travail passe \u00e0 <b>'
      +String(Math.round(window._EMH.v*100)/100).replace('.',',')+'\u00a0\u20AC/h</b>. Les heures d\u2019avant gardent leur taux.';
    return;
  }
  var m=(window.MEMBRES||[]).find(function(x){return x.nom===window._EMH.nom;});
  var H=window._mvHist(m);
  var avant=window._mvPeriodes({hist:H}), apres=window._mvPeriodes({hist:H.concat([e])});
  var la=apres.length?apres[apres.length-1]:null;
  if(apres.length>avant.length){
    var lav=avant.length?avant[avant.length-1]:null;
    var chg=lav&&la&&(lav.grille||'standard')!==(la.grille||'standard');
    box.className='emh-eff warn';
    box.innerHTML='\u26A0\uFE0F <b>Nouveau contrat.</b> Vous en aurez '+apres.length+'. Le compteur du pr\u00e9c\u00e9dent est '
      +'<b>sold\u00e9</b> \u00e0 sa date de fin\u00a0; celui-ci d\u00e9marre le <b>'+_emhFmt(la.debut)+'</b>, sans d\u00fb ni indu. '
      +'Le pr\u00e9c\u00e9dent reste lisible, et son relev\u00e9 reste imprimable.'
      +(chg?('<br><br>La grille passe de <b>'+_escHtml(lav.grille||'standard')+'</b> \u00e0 <b>'+_escHtml(la.grille||'standard')
        +'</b>. Elle ne s\u2019applique qu\u2019\u00e0 partir du '+_emhFmt(la.debut)+'\u00a0\u2014 les mois d\u00e9j\u00e0 \u00e9coul\u00e9s gardent l\u2019ancienne.'):'');
  } else if(window._EMH.t==='renouvellement'){
    box.className='emh-eff good';
    box.innerHTML='<b>Toujours un seul contrat</b>, donc un seul compteur. Il court d\u00e9sormais jusqu\u2019au <b>'
      +_emhFmt(window._EMH.fin)+'</b>. L\u2019ancienne date de fin reste dans l\u2019historique.';
  } else if(window._EMH.t==='fin'){
    box.className='emh-eff';
    box.innerHTML='Le contrat s\u2019arr\u00eate le <b>'+_emhFmt(window._EMH.d)+'</b>. Son compteur est sold\u00e9. '
      +'La fiche reste consultable, avec ses heures et son relev\u00e9.';
  } else {
    box.className='emh-eff';
    box.innerHTML='Aucune coupure\u00a0: cette date tombe dans le contrat en cours, elle le <b>corrige</b> '
      +'plut\u00f4t que d\u2019en cr\u00e9er un nouveau.';
  }
}
function _emhOk(){
  var e=_emhEvt();
  if(!e){ showToast('Il manque une date','#B85A1A'); return; }
  var nom=window._EMH.nom, m=(window.MEMBRES||[]).find(function(x){return x.nom===nom;});
  if(!m) return;
  if(e.t==='taux'){
    var r=window._mvPaieApply(nom,String(e.v),e.d,null);
    showToast((r&&r.geste==='correction')
      ?'\u270E Taux corrig\u00e9 sur place \u2014 aucune augmentation cr\u00e9\u00e9e'
      :'\u{1F4B6} Augmentation enregistr\u00e9e \u2014 le taux pr\u00e9c\u00e9dent reste sur les heures d\u00e9j\u00e0 travaill\u00e9es','#3D6B27');
  } else {
    _emhCommit(m,window._mvHist(m).concat([e]),_EMH_LBL[e.t].n+' enregistr\u00e9'+(e.t==='fin'?'e':''));
  }
  _emhClose(); _emhRender(nom); renderReglages();
}

function saveEditMembre(){
  const nom=document.getElementById('em-nom').value;
  const m=window.MEMBRES.find(x=>x.nom===nom);
  if(!m)return;
  m.statut=document.getElementById('em-statut').value;
  const allRoles=['admin','ouvrier','tractoriste','saisonnier','pilotage'];
  const _rolesAvant=(m.roles||[]).slice().sort().join(',');   // SEC-1 : detecter un vrai changement
  const _rolesNew=allRoles.filter(r=>document.getElementById('erc-'+r)?.classList.contains('on'));
  // SEC-2 : promouvoir admin quelqu'un sans vraie adresse le rendrait indépannable
  // (personne au-dessus de lui, et aucun mail ne part vers @mavigne.app). Le serveur
  // refuserait de toute façon — on le dit avant, et on n'enregistre pas les rôles.
  if(_mvAdminNeedsRealMail(m.email, _rolesNew)){
    showToast('❌ '+nom+' doit avoir une vraie adresse e-mail pour être administrateur','#A0291E');
    return;
  }
  m.roles=_rolesNew;
  // ── SEC-1 : les droits d'ecriture viennent du claim serveur `adm`, pas du doc membres.
  // Changer les roles ici doit reposer le claim, sinon promouvoir quelqu'un
  // administrateur ne lui donne aucun droit tant que gtBackfillClaims n'est pas relance.
  // Appel best-effort : l'enregistrement du membre n'en depend pas.
  if(m.email && m.roles.slice().sort().join(',')!==_rolesAvant && window._fbUpdateMemberRoles){
    window._fbUpdateMemberRoles(m.email, m.roles)
      .then(function(){ showToast('\ud83d\udd11 Droits mis \u00e0 jour pour '+nom,'#3D6B27'); })
      .catch(function(e){
        var reason=(e&&e.details&&e.details.reason)||'';
        if(reason==='no_account'){ showToast('\u26a0\ufe0f '+nom+' n\'a pas de compte \u2014 r\u00f4les enregistr\u00e9s, droits non pos\u00e9s','#B85A1A'); return; }
        if(reason==='admin_needs_real_email'){ showToast('\u274c Un administrateur doit avoir une vraie adresse e-mail (secours)','#A0291E'); return; }
        showToast('\u26a0\ufe0f R\u00f4les enregistr\u00e9s, mais droits non appliqu\u00e9s : '+((e&&e.message)||''),'#B85A1A');
      });
  }
  // Le contrat, la grille et le taux ne s'ecrivent plus ICI : chaque evenement
  // est enregistre au moment ou il est valide (_emhOk). Un fait se consigne
  // quand on le consigne, et fermer la fiche sans enregistrer ne perd plus un
  // contrat saisi. renouvellement_date / renouvellement_fin ont disparu : le
  // second n'etait lu nulle part, et le premier ETEIGNAIT l'alerte de fin de
  // contrat (l'ancien test `if(!m.renouvellement_date && fin...)`).
  delete m.renouvellement_date; delete m.renouvellement_fin;
  m.cp_initial_j=parseFloat(document.getElementById('em-cp-initial-j')?.value||'0')||0;
  m.bureau=document.getElementById('em-bureau')?.classList.contains('on')||false;
  m.collectif=document.getElementById('em-collectif')?.classList.contains('on')||false;
  if(m.collectif){
    var _eff=parseInt(document.getElementById('em-effectif')?.value||'1',10);
    m.effectif=(isNaN(_eff)||_eff<1)?1:Math.min(999,_eff);
  }else{
    // On RETIRE le champ plutot que de le laisser a 1 : un effectif residuel sur
    // une fiche redevenue individuelle reapparaitrait au premier reclic du drapeau.
    delete m.effectif;
  }
  // ── Modules visibles : on ne stocke QUE les exclusions ──────────────────
  // Le point de depart est l'etat DEJA enregistre, pas un objet vide : la fiche
  // n'affiche pas les modules hors formule du domaine, ni Pilotage pour qui n'a
  // pas le role. Repartir de zero effacerait ces exclusions-la en silence, et
  // un module reapparaitrait chez quelqu'un le jour d'un simple changement de
  // date de contrat.
  var _modsPrev=(m.mods&&typeof m.mods==='object')?m.mods:{};
  var _modsNew={};
  Object.keys(_modsPrev).forEach(function(k){ if(_modsPrev[k]===false) _modsNew[k]=false; });
  document.querySelectorAll('#em-mods-list .emod-chk').forEach(function(el){
    var k=el.getAttribute('data-mod');
    if(el.classList.contains('on')) delete _modsNew[k]; else _modsNew[k]=false;
  });
  // Aucune exclusion -> on retire le champ : un membre sans restriction ne porte
  // rien, et « absent » reste le defaut lisible cote _canModule.
  if(Object.keys(_modsNew).length) m.mods=_modsNew; else delete m.mods;
  // Taux horaire → collection `paie` (doc séparé, admin-only en lecture ET écriture).
  // Volontairement HORS de `m` : le doc membres est lisible par toute l'équipe.
  // Relecture de la serie affichee : une ligne supprimee a l'ecran disparait ici.
  // Meme mecanique que la liste des contrats precedents — lire le DOM plutot que
  // de tenir un etat global. La liste n'existe QUE chez l'administrateur : chez un
  // non-admin `_tsEl` est null, `rows` reste null, et la serie en base est intacte.
  window.saveData('membres','\ud83d\udc64 Membre mis \u00e0 jour');
  // Si l'admin vient de se restreindre lui-meme, appliquer sans attendre l'aller-
  // retour Firestore : reconstruit le dock et quitte la page si elle est masquee.
  try{ if(window._mvRefreshCurrentUserRoles) window._mvRefreshCurrentUserRoles(); }
  catch(e){ if(window.logError)window.logError({level:'info',cat:'membres',msg:'rafraichissement session apres edition membre',detail:(e&&e.message)||String(e)}); }
  document.getElementById('ovEditMembre').classList.remove('open');
  renderReglages();
}
function deleteMembre(){
  const nom=document.getElementById('em-nom').value;
  if(nom==='Nico'){showToast('Le compte principal ne peut pas être supprimé','#C0392B');return;}
  // Remplacer confirm() (bloqué en PWA) par un bouton de confirmation inline
  const btn=document.querySelector('#ovEditMembre .mbtn-del');
  if(!btn)return;
  if(btn.dataset.confirming!=='1'){
    btn.dataset.confirming='1';
    btn.textContent='⚠️ Confirmer la suppression ?';
    btn.style.background='var(--rouge)';
    btn.style.color='white';
    setTimeout(()=>{btn.dataset.confirming='';btn.textContent='Supprimer';btn.style.background='';btn.style.color='';},3000);
    return;
  }
  // 2e appui = confirmation
  btn.dataset.confirming='';
  if(navigator.vibrate)navigator.vibrate([80,60,80]);
  const idx=window.MEMBRES.findIndex(m=>m.nom===nom);
  if(idx>=0) window.MEMBRES.splice(idx,1);
  window.MEMBRES=window.MEMBRES;
  window.saveData('membres','🗑 Membre supprimé');
  window.closeOv(null,'ovEditMembre');
  renderReglages();
}
// ════ MOT DE PASSE — Firebase Authentication ════
// sha256(), isHashed(), checkMdp() supprimés — Firebase Auth gère le hachage côté serveur.

// Ouvrir overlay changement de MDP
function openChangePwd() {
  if(!window.currentUser) return;
  document.getElementById('cpwd-sub').textContent = `Compte : ${window.currentUser.nom}`;
  document.getElementById('cpwd-old').value = '';
  document.getElementById('cpwd-new').value = '';
  document.getElementById('cpwd-confirm').value = '';
  document.getElementById('cpwd-error').style.display = 'none';
  document.getElementById('cpwd-ok').style.display = 'none';
  window.openOv('ovChangePwd');
}

async function confirmChangePwd() {
  const oldVal = document.getElementById('cpwd-old').value;
  const newVal = document.getElementById('cpwd-new').value;
  const confirmVal = document.getElementById('cpwd-confirm').value;
  const errEl = document.getElementById('cpwd-error');
  const okEl = document.getElementById('cpwd-ok');
  errEl.style.display = 'none'; okEl.style.display = 'none';

  if(!oldVal || !newVal || !confirmVal) {
    errEl.textContent = '❌ Tous les champs sont obligatoires.';
    errEl.style.display = 'block'; return;
  }
  if(newVal.length < 8) {
    errEl.textContent = '❌ Le nouveau mot de passe doit faire au moins 8 caractères.';
    errEl.style.display = 'block'; return;
  }
  if(newVal !== confirmVal) {
    errEl.textContent = '❌ Les deux nouveaux mots de passe ne correspondent pas.';
    errEl.style.display = 'block'; return;
  }
  // ⚠️ NE JAMAIS réécrire en `.window.currentUser` : _authCompat (firebase.js) expose un
  // getter `currentUser` qui greffe reauthenticateWithCredential/updatePassword sur le
  // user. Un `.window` intercalé renvoie undefined → « Session expirée » systématique.
  // C'est LE bug qui a maintenu tout le monde sur vigne21 : le bouton « Changer mon mot
  // de passe » n'a jamais fonctionné, personne n'a donc jamais PU en sortir. (SEC-2)
  const firebaseUser = window.firebase.auth().currentUser;
  if(!firebaseUser) {
    errEl.textContent = '❌ Session expirée, reconnectez-vous.';
    errEl.style.display = 'block'; return;
  }
  try {
    // Réauthentification obligatoire avant updatePassword
    const credential = window.firebase.auth.EmailAuthProvider.credential(firebaseUser.email, oldVal);
    await firebaseUser.reauthenticateWithCredential(credential);
    await firebaseUser.updatePassword(newVal);
    okEl.textContent = '✅ Mot de passe modifié avec succès !';
    okEl.style.display = 'block';
    document.getElementById('cpwd-old').value = '';
    document.getElementById('cpwd-new').value = '';
    document.getElementById('cpwd-confirm').value = '';
    setTimeout(() => { document.getElementById('ovChangePwd').classList.remove('open'); }, 1800);
  } catch(e) {
    if(e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
      errEl.textContent = '❌ Mot de passe actuel incorrect.';
    } else {
      errEl.textContent = '❌ Erreur : ' + (e.message || e.code);
    }
    errEl.style.display = 'block';
  }
}

// ── Mot de passe oublié via Firebase Auth ──

// ── SEC-2 — deux chemins de récupération, selon qui vous êtes ─────────
// ADMIN (vraie adresse, obligatoire — cf. assertRealEmailForAdmin) : personne n'est
//   au-dessus de lui pour le dépanner → lien de réinitialisation Firebase, il s'en sort
//   seul. C'est la raison d'être de la règle « un admin doit avoir un vrai e-mail ».
// ÉQUIPE (adresse fictive prenom.slug@mavigne.app) : aucun mail n'arrivera JAMAIS. Lui
//   proposer un formulaire d'envoi serait un piège — il attendrait un message qui part
//   dans le vide. Son secours est HUMAIN : l'admin clique « Réinitialiser » sur sa fiche.
//   On le lui dit, au lieu de lui montrer un bouton inutile.
//
// ⚠️ Ce flux envoie un LIEN (sendPasswordResetEmail) — il n'a JAMAIS envoyé de mot de
// passe en clair, contrairement à ce que promettaient les libellés. Corrigés ici.
// Deux conventions d'adresses fictives en usage : @mavigne.app (premiers domaines) et
// @mavigneapp.fr (suivants). Aucune des deux ne reçoit de courrier.
const _MV_FAKE_MAIL = /@(mavigne\.app|mavigneapp\.fr)$/i;
function _mvIsFakeMail(e){ return _MV_FAKE_MAIL.test(String(e||'').trim()); }

function showForgotPanel() {
  if(loginPendingIdx < 0) return;
  const m = window.MEMBRES[loginPendingIdx];
  document.getElementById('login-forgot-for').textContent = '👤 ' + m.nom;
  document.getElementById('login-forgot-email').value = m.email || '';
  document.getElementById('login-forgot-error').style.display = 'none';
  document.getElementById('login-forgot-ok').style.display = 'none';

  const fake   = !m.email || _mvIsFakeMail(m.email);
  const form   = document.getElementById('login-forgot-form');
  const noMail = document.getElementById('login-forgot-nomail');
  if(form)   form.style.display   = fake ? 'none'  : 'block';
  if(noMail) noMail.style.display = fake ? 'block' : 'none';

  const btn = document.getElementById('login-forgot-btn');
  if(btn){ btn.disabled = false; btn.textContent = '📧 Recevoir un lien de réinitialisation'; }
  document.getElementById('login-pwd-panel').style.display = 'none';
  document.getElementById('login-forgot-panel').style.display = 'block';
  // Scroll en haut pour que le panneau soit visible sur mobile
  setTimeout(() => { document.getElementById('login-screen').scrollTop = 0; }, 50);
}

function openMentionsLogin(){
  document.getElementById('login-mentions-ov').style.display='block';
  document.getElementById('login-screen').scrollTop=0;
}

function hideForgotPanel() {
  document.getElementById('login-forgot-panel').style.display = 'none';
  document.getElementById('login-pwd-panel').style.display = 'block';
  document.getElementById('login-screen').scrollTop = 0;
}

async function submitForgotLogin() {
  const emailSaisi = document.getElementById('login-forgot-email').value.trim().toLowerCase();
  const errEl = document.getElementById('login-forgot-error');
  const okEl  = document.getElementById('login-forgot-ok');
  const btn   = document.getElementById('login-forgot-btn');
  errEl.style.display = 'none'; okEl.style.display = 'none';

  if(loginPendingIdx < 0) return;
  const m = window.MEMBRES[loginPendingIdx];

  if(!m.email || m.email.trim().toLowerCase() !== emailSaisi) {
    errEl.textContent = '❌ Cet email ne correspond pas au compte.';
    errEl.style.display = 'block'; return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Envoi en cours…';

  if(_mvIsFakeMail(m.email)){
    errEl.textContent = '❌ Ce compte n\'a pas d\'adresse réelle — demandez à votre responsable de réinitialiser votre mot de passe.';
    errEl.style.display = 'block'; return;
  }

  try {
    await window.firebase.auth().sendPasswordResetEmail(m.email);
    okEl.textContent = '✅ Lien de réinitialisation envoyé à ' + m.email + ' — pensez aux indésirables.';
    okEl.style.display = 'block';
    btn.textContent = '✅ Lien envoyé';
  } catch(e) {
    errEl.textContent = '❌ Erreur : ' + (e.message || e.code);
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = '📧 Réessayer';
  }
}


async function sendForgotPwd() {
  const emailSaisi = document.getElementById('fpwd-email').value.trim().toLowerCase();
  const errEl = document.getElementById('fpwd-error');
  const okEl  = document.getElementById('fpwd-ok');
  const btn   = document.getElementById('fpwd-send-btn');
  errEl.style.display = 'none'; okEl.style.display = 'none';

  if(loginPendingIdx < 0) return;
  const m = window.MEMBRES[loginPendingIdx];

  if(!m.email || m.email.trim().toLowerCase() !== emailSaisi) {
    errEl.textContent = '❌ Cet email ne correspond pas au compte sélectionné.';
    errEl.style.display = 'block'; return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Envoi en cours…';

  if(_mvIsFakeMail(m.email)){
    errEl.textContent = '❌ Ce compte n\'a pas d\'adresse réelle — demandez à votre responsable.';
    errEl.style.display = 'block'; return;
  }

  try {
    await window.firebase.auth().sendPasswordResetEmail(m.email);
    okEl.textContent = '✅ Lien de réinitialisation envoyé à ' + m.email;
    okEl.style.display = 'block';
    btn.textContent = '✅ Lien envoyé';
  } catch(e) {
    errEl.textContent = '❌ Erreur : ' + (e.message || e.code);
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = '📧 Réessayer';
  }
}
// ════ NOTIFICATIONS ════
function requestNotifications(){
  if(!('Notification' in window)){
    showToast('Notifications non supportées par ce navigateur','#B85A1A');return;
  }
  if(Notification.permission==='granted'){
    updateNotifUI('granted');
    sendTestNotif();
    return;
  }
  if(Notification.permission==='denied'){
    showToast('Notifications bloquées · à réactiver dans les réglages du navigateur','#B85A1A');
    updateNotifUI('denied');return;
  }
  Notification.requestPermission().then(perm=>{
    updateNotifUI(perm);
    if(perm==='granted'){
      sendTestNotif();
      scheduleNotifCheck();
    }
  });
}
function updateNotifUI(perm){
  const sub=document.getElementById('notif-status');
  const arr=document.getElementById('notif-arr');
  if(!sub)return;
  if(perm==='granted'){sub.textContent='✅ Activées — alertes gel, DAR et priorités';if(arr)arr.textContent='✓';}
  else if(perm==='denied'){sub.textContent='🚫 Bloquées par le navigateur';if(arr)arr.textContent='✗';}
  else{sub.textContent='Alertes gel, DAR, validations';}
}
// _swNotify — centralisé dans utils.js (Patch 3)
function sendTestNotif(){
  _swNotify('🍇 Ma Vigne',{body:'Notifications activées ! Vous recevrez les alertes gel, DAR et priorités.',icon:'icon-192.png'});
}
function scheduleNotifCheck(){
  setInterval(checkNotifAlerts,3600000);
  checkNotifAlerts();
}
function checkNotifAlerts(){
  if(Notification.permission!=='granted')return;
  const today=new Date();
  // Alertes DAR
  window.TRAITEMENTS.forEach(t=>{
    const prod=window.CATALOGUE.find(p=>p.nom===t.produit);
    if(!prod||prod.dar===0)return;
    const darR=Math.max(0,prod.dar-Math.floor((today-new Date(t.date))/86400000));
    if(darR>0&&darR<=3){
      _swNotify('⚠️ DAR Ma Vigne',{body:`${t.produit} : ${darR}j avant récolte possible`,icon:'icon-192.png'});
    }
  });
  // Alerte priorité du moment (si définie)
  if(window.priorityMessage&&window.priorityMessage.trim()){
    _swNotify('⚡ Priorité Ma Vigne',{body:window.priorityMessage,icon:'icon-192.png'});
  }
}
// Appelé après savePriority() pour notifier si activé
function notifyPriorityChange(){
  if(Notification.permission!=='granted'||!window.priorityMessage)return;
  _swNotify('⚡ Nouvelle priorité',{body:window.priorityMessage,icon:'icon-192.png'});
}
// ════ window.HISTORIQUE MULTI-window.SAISONS ════

// Crée un snapshot de la saison active et l'archive dans window.HISTORIQUE
function archiveSaisonActive(){
  const saison = window.getSaisonActive();
  const existing = window.HISTORIQUE.findIndex(h=>h.saisonNom===saison.nom);
  // Préparer la config DANGER selon contexte
  window.DANGER_CFG.archiveSaison = {
    icon: existing>=0 ? '🔄' : '📦',
    title: existing>=0 ? 'Écraser le snapshot ?' : 'Archiver la saison ?',
    sub: existing>=0 ? 'Le snapshot existant de "'+saison.nom+'" sera remplacé par l\'état actuel.' : 'Sauvegarde l\'état actuel des parcelles, du journal et des sessions.',
    word: 'ARCHIVER',
    btn: existing>=0 ? '🔄 Écraser le snapshot' : '📦 Archiver la saison',
    successSub: 'Snapshot enregistré.',
    items: existing>=0
      ? ['Le snapshot précédent sera écrasé','L\'opération est réversible en réarchivant']
      : ['État des parcelles', 'Entrées journal', 'Sessions tracteur'],
    exec: function(){
      const snapshot = {
        saisonNom: saison.nom,
        periode: saison.periode,
        archivedAt: new Date().toISOString(),
        parcelles: deepClone(window.PARCELLES),
        journal: deepClone(window.JOURNAL.filter(j=>!j.meteo)),
        sessions: deepClone(window.SESSIONS),
        taches: deepClone(window.getTachesSaison()),
        travaux: deepClone(window.TRAVAUX),
        stats: _calcHistoStats(window.PARCELLES, window.JOURNAL.filter(j=>!j.meteo), window.getTachesSaison(), window.TRAVAUX)
      };
      if(existing>=0) window.HISTORIQUE[existing] = snapshot;
      else window.HISTORIQUE.unshift(snapshot);
      window.HISTORIQUE = window.HISTORIQUE;
      window.saveData('historique');
      renderHistorique();
    }
  };
  window.openOvDanger('archiveSaison');
}

// ══════════════════════════════════════════════════════════════════════════
// CLÔTURE DE CAMPAGNE — parcours guidé (Bilan → Nouvelle campagne → Confirmation)
// Orchestre les briques existantes : snapshot HISTORIQUE + activateSaison (swap
// tenant-wide, qui appelle _switchSaison). Overlay auto-porté (styles inline).
// ══════════════════════════════════════════════════════════════════════════
var _CLOT = { step:1, mode:'create', type:'', endNom:'', endPct:0, _sugYear:0 };
var _CLOT_WARN_PCT = 90; // seuil « peu avancée » → avertissement (ajustable)

function _clotEsc(s){ return (window._escHtml ? window._escHtml(s) : String(s==null?'':s)); }

// Type de saison suivant dans le cycle Hiver→Printemps→Été→Automne + année cible
// La campagne suivante reprend la période qu'on ferme, décalée d'un an, nom incrémenté.
// Tout reste éditable dans l'écran — c'est une suggestion, pas une règle.
function _clotSuggestNext(){
  var sa = (window.getSaisonActive && window.getSaisonActive()) || {};
  var yr = (sa.debut ? parseInt(String(sa.debut).slice(0,4),10) : 0) || new Date().getFullYear();
  return { type:'', year: yr+1, from: sa };
}

// Décale d'un an la période qu'on clôture. Un millésime dans le nom est incrémenté ; sinon on
// suffixe l'année d'arrivée. Aucune date « conventionnelle » n'est imposée : ce sont les tiennes.
function _clotDatesFor(type, yr){
  var sa=(window.getSaisonActive && window.getSaisonActive())||{};
  if(!sa.debut||!sa.fin) return { nom:'', deb:'', fin:'' };
  var bump=function(iso){ var p=String(iso).split('-'); return (parseInt(p[0],10)+1)+'-'+p[1]+'-'+p[2]; };
  var nom=String(sa.nom||'');
  nom=/\d{4}/.test(nom) ? nom.replace(/\d{4}/g,function(y){return String(parseInt(y,10)+1);})
                         : (nom+' '+(yr||new Date().getFullYear()));
  return { nom:nom, deb:bump(sa.debut), fin:bump(sa.fin) };
}


function _clotOverlayHTML(ctx){
  var esc = _clotEsc(ctx.endNom);
  var reste = Math.max(0, 100 - (ctx.pct||0));
  var stat = function(v,l){ return '<div style="background:#FBFAF6;border:1px solid #E7E3DA;border-radius:12px;padding:12px 6px;text-align:center">'
    + '<div style="font-family:\'Cormorant Garamond\',serif;font-weight:700;font-size:24px;color:#1C1813">'+v+'</div>'
    + '<div style="font-size:9px;letter-spacing:.4px;text-transform:uppercase;color:#6B655C;margin-top:3px">'+l+'</div></div>'; };
  var prepOpts = (ctx.prepared||[]).map(function(s){ return '<option value="'+_clotEsc(s.nom)+'">'+_clotEsc(s.nom)+'</option>'; }).join('');
  var activateInner = (ctx.prepared && ctx.prepared.length)
    ? '<div style="margin-bottom:13px"><label style="display:block;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#6B655C;font-weight:600;margin-bottom:6px">Campagne déjà préparée</label>'
      + '<select id="clot-prep" onchange="window._clotSyncConfirm&&window._clotSyncConfirm()" style="width:100%;font-family:inherit;font-size:15px;padding:11px 12px;border:1px solid #E7E3DA;border-radius:10px;background:#fff;color:#1C1813">'+prepOpts+'</select></div>'
      + '<div style="display:flex;gap:9px;align-items:flex-start;background:#eef4ea;border:1px solid rgba(61,107,39,.3);border-radius:12px;padding:12px 13px;font-size:12.5px;line-height:1.45;color:#3f5233"><span>✓</span><div>Cette campagne a déjà ses dates. Elle deviendra simplement la <b>campagne active</b> de l\'équipe.</div></div>'
    : '<div style="display:flex;gap:9px;align-items:flex-start;background:#fbeede;border:1px solid rgba(184,90,26,.4);border-radius:12px;padding:12px 13px;font-size:12.5px;line-height:1.45;color:#8a4516"><span>ℹ️</span><div>Aucune campagne préparée à l\'avance. Utilise <b>« Créer la prochaine »</b> ci-dessus.</div></div>';
  var garde = ctx.warn
    ? '<div style="display:flex;gap:9px;align-items:flex-start;background:#fbeede;border:1px solid rgba(184,90,26,.4);border-radius:12px;padding:12px 13px;margin-top:6px;font-size:12.5px;line-height:1.45;color:#8a4516"><span>⚠️</span><div><b>Il reste '+reste+'% de travail</b> sur '+esc+'. Tu peux clôturer quand même — l\'avancement restera consultable — mais vérifie que la campagne est bien terminée.</div></div>'
    : '';

  return ''
  + '<div id="ovCloture" style="position:fixed;inset:0;z-index:4000;background:#F2EFE7;display:flex;flex-direction:column;font-family:\'Outfit\',system-ui,sans-serif;color:#1C1813">'
    + '<div style="background:#14110D;color:#F0E2C8;padding:16px 16px 14px;position:relative;flex:none">'
      + '<div style="display:flex;align-items:center;gap:12px">'
        + '<button onclick="window._clotClose&&window._clotClose()" style="background:rgba(255,255,255,.08);border:none;color:#F0E2C8;width:32px;height:32px;border-radius:9px;font-size:16px;cursor:pointer">✕</button>'
        + '<div id="clot-ttl" style="font-family:\'Cormorant Garamond\',serif;font-weight:600;font-size:20px">Bilan de la campagne</div>'
      + '</div>'
      + '<div style="display:flex;gap:6px;margin-top:13px">'
        + '<div id="clot-d1" style="height:4px;flex:1;border-radius:3px;background:#C9A84C"></div>'
        + '<div id="clot-d2" style="height:4px;flex:1;border-radius:3px;background:rgba(240,226,200,.22)"></div>'
        + '<div id="clot-d3" style="height:4px;flex:1;border-radius:3px;background:rgba(240,226,200,.22)"></div>'
      + '</div>'
      + '<div style="height:2px;position:absolute;left:0;right:0;bottom:0;background:linear-gradient(90deg,#8A5A38,#C2871E,#3D6B27)"></div>'
    + '</div>'
    + '<div id="clot-scroll" style="flex:1;overflow-y:auto;padding:18px 16px 16px">'
      + '<div id="clot-s1">'
        + '<div style="background:linear-gradient(165deg,#14110D,#1C1813);border-radius:18px;padding:26px 20px 22px;color:#F0E2C8;text-align:center">'
          + '<div style="font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:#C9A84C">Campagne qui se termine</div>'
          + '<div style="font-family:\'Cormorant Garamond\',serif;font-weight:700;font-size:66px;line-height:1;margin:6px 0 2px">'+(ctx.pct||0)+'%</div>'
          + '<div style="font-family:\'Cormorant Garamond\',serif;font-size:22px">'+esc+'</div>'
          + '<div style="font-size:14px;color:#e9dcc0;margin-top:10px">🍇 Bravo à l\'équipe — belle campagne.</div>'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:15px">'
          + stat((ctx.surfTot||0).toFixed(2), 'ha travaillés')
          + stat(ctx.nTaches||0, 'Tâches suivies')
          + stat(ctx.nSess||0, 'Sessions tracteur')
          + stat(ctx.nTrait||0, 'Traitements phyto')
        + '</div>'
        + '<div style="display:flex;gap:9px;align-items:flex-start;background:#F6EDD8;border:1px solid rgba(201,168,76,.35);border-radius:12px;padding:12px 13px;margin-top:15px;font-size:12.5px;line-height:1.45;color:#5c4a1f"><span>📦</span><div>Cette campagne sera <b>archivée dans l\'Historique</b> (parcelles, journal, sessions tracteur, phyto) — consultable ensuite pour le comparatif N-1.</div></div>'
      + '</div>'
      + '<div id="clot-s2" style="display:none">'
        + '<div style="font-family:\'Cormorant Garamond\',serif;font-weight:700;font-size:22px;margin-bottom:4px">La prochaine campagne</div>'
        + '<div style="font-size:13px;color:#6B655C;margin-bottom:16px;line-height:1.4">Crée la suivante, ou active une campagne déjà préparée à l\'avance.</div>'
        + '<div style="display:flex;gap:8px;margin-bottom:16px">'
          + '<button id="clot-seg-create" onclick="window._clotSeg&&window._clotSeg(\'create\')" style="flex:1;background:#14110D;color:#F0E2C8;border:1px solid #14110D;border-radius:11px;padding:11px 8px;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer">✨ Créer la prochaine</button>'
          + '<button id="clot-seg-activate" onclick="window._clotSeg&&window._clotSeg(\'activate\')" style="flex:1;background:#FBFAF6;color:#6B655C;border:1px solid #E7E3DA;border-radius:11px;padding:11px 8px;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer">📂 Activer une préparée</button>'
        + '</div>'
        + '<div id="clot-create" style="display:block">'
          + '<div style="margin-bottom:13px"><label style="display:block;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#6B655C;font-weight:600;margin-bottom:6px">Type de saison</label>'
            + '<div style="font-size:12px;color:#6B655C;line-height:1.45">La p\u00e9riode ci-dessous reprend « '+_clotEsc(ctx.endNom)+' » d\u00e9cal\u00e9e d\u2019un an, avec la m\u00eame liste de travaux. Ajustez ce qui doit l\u2019\u00eatre.</div></div>'
          + '<div style="margin-bottom:13px"><label style="display:block;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#6B655C;font-weight:600;margin-bottom:6px">Nom de la campagne</label>'
            + '<input id="clot-name" value="'+_clotEsc(ctx.sug.nom)+'" oninput="window._clotSyncConfirm&&window._clotSyncConfirm()" style="width:100%;font-family:inherit;font-size:15px;padding:11px 12px;border:1px solid #E7E3DA;border-radius:10px;background:#fff;color:#1C1813"></div>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
            + '<div><label style="display:block;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#6B655C;font-weight:600;margin-bottom:6px">Début</label><input id="clot-deb" type="date" value="'+ctx.sug.deb+'" oninput="window._clotSyncConfirm&&window._clotSyncConfirm()" style="width:100%;font-family:inherit;font-size:15px;padding:11px 12px;border:1px solid #E7E3DA;border-radius:10px;background:#fff;color:#1C1813"></div>'
            + '<div><label style="display:block;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#6B655C;font-weight:600;margin-bottom:6px">Fin</label><input id="clot-fin" type="date" value="'+ctx.sug.fin+'" oninput="window._clotSyncConfirm&&window._clotSyncConfirm()" style="width:100%;font-family:inherit;font-size:15px;padding:11px 12px;border:1px solid #E7E3DA;border-radius:10px;background:#fff;color:#1C1813"></div>'
          + '</div>'
          + garde
        + '</div>'
        + '<div id="clot-activate" style="display:none">'+activateInner+'</div>'
      + '</div>'
      + '<div id="clot-s3" style="display:none">'
        + '<div style="font-family:\'Cormorant Garamond\',serif;font-weight:700;font-size:22px;margin-bottom:4px">Confirmer la clôture</div>'
        + '<div style="font-size:13px;color:#6B655C;margin-bottom:16px;line-height:1.4">Voici ce qui va se passer quand tu valides.</div>'
        + '<div style="display:flex;align-items:stretch;margin-bottom:16px;border-radius:16px;overflow:hidden;border:1px solid #E7E3DA">'
          + '<div style="flex:1;padding:18px 12px;text-align:center;background:#eef4ea"><div style="font-family:\'Cormorant Garamond\',serif;font-weight:600;font-size:16px;line-height:1.15">'+esc+'</div><div style="font-family:\'Cormorant Garamond\',serif;font-weight:700;font-size:32px;color:#3D6B27;margin-top:6px">'+(ctx.pct||0)+'%</div><div style="font-size:10px;letter-spacing:.6px;text-transform:uppercase;margin-top:4px;color:#3f5233">✓ archivée</div></div>'
          + '<div style="width:40px;display:grid;place-items:center;background:linear-gradient(90deg,#8A5A38,#C2871E,#3D6B27);color:#fff;font-size:20px;font-weight:700">→</div>'
          + '<div style="flex:1;padding:18px 12px;text-align:center;background:#14110D;color:#F0E2C8"><div id="clot-cf-new" style="font-family:\'Cormorant Garamond\',serif;font-weight:600;font-size:16px;line-height:1.15">'+_clotEsc(ctx.sug.nom)+'</div><div style="font-family:\'Cormorant Garamond\',serif;font-weight:700;font-size:32px;color:#C9A84C;margin-top:6px">0%</div><div style="font-size:10px;letter-spacing:.6px;text-transform:uppercase;margin-top:4px;opacity:.85">démarre</div></div>'
        + '</div>'
        + '<div style="background:linear-gradient(180deg,#f3f7ef,#eef4ea);border:1px solid rgba(61,107,39,.28);border-radius:13px;padding:14px 15px;margin-bottom:15px"><div style="font-weight:600;font-size:13.5px;color:#3D6B27;margin-bottom:5px">🌱 Rien n\'est perdu</div><div style="font-size:12.5px;line-height:1.5;color:#3f5233">Le 0% est un nouveau départ, pas une régression. L\'avancement de '+esc+' reste consultable via le sélecteur de saison et l\'Historique.</div></div>'
        + '<div>'
          + '<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 2px;font-size:13px;line-height:1.4;border-bottom:1px solid #E7E3DA"><span style="color:#3D6B27;font-weight:700">✓</span><div><b>'+esc+'</b> archivée — snapshot complet (parcelles, journal, sessions, phyto).</div></div>'
          + '<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 2px;font-size:13px;line-height:1.4;border-bottom:1px solid #E7E3DA"><span style="color:#3D6B27;font-weight:700">✓</span><div><b id="clot-cf-new2">'+_clotEsc(ctx.sug.nom)+'</b> devient la campagne active de <b>toute l\'équipe</b>.</div></div>'
          + '<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 2px;font-size:13px;line-height:1.4;border-bottom:1px solid #E7E3DA"><span style="color:#3D6B27;font-weight:700">✓</span><div>Les <b>travaux tracteur</b> de la campagne finie restent rangés dans leur saison — l\'accueil de la nouvelle démarre vierge.</div></div>'
          + '<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 2px;font-size:13px;line-height:1.4"><span style="color:#3D6B27;font-weight:700">✓</span><div>Chaque membre bascule ensemble au prochain chargement de l\'app.</div></div>'
        + '</div>'
      + '</div>'
    + '</div>'
    + '<div style="flex:none;padding:12px 16px calc(16px + env(safe-area-inset-bottom));border-top:1px solid #E7E3DA;background:#F2EFE7;display:flex;gap:10px">'
      + '<button id="clot-back" onclick="window._clotBack&&window._clotBack()" style="display:none;flex:0 0 auto;padding:14px 18px;border-radius:12px;border:1px solid #E7E3DA;background:#fff;color:#6B655C;font-family:inherit;font-size:14.5px;font-weight:600;cursor:pointer">Retour</button>'
      + '<button id="clot-next" onclick="window._clotNext&&window._clotNext()" style="flex:1;padding:14px;border-radius:12px;border:1px solid #14110D;background:#14110D;color:#F0E2C8;font-family:inherit;font-size:14.5px;font-weight:600;cursor:pointer">Continuer</button>'
    + '</div>'
  + '</div>';
}

function openClotureFlow(){
  if(window.isAdmin && !window.isAdmin()){ if(window.showToast)showToast('Réservé à l\'admin','#B85A1A'); return; }
  var sa = (window.getSaisonActive && window.getSaisonActive()) || null;
  if(!sa){ if(window.showToast)showToast('Aucune saison active','#B85A1A'); return; }
  var actNom = sa.nom || '';
  if(window._visuSaison && window._visuSaison()!==actNom && window._switchSaison){ try{ window._switchSaison(actNom); }catch(e){} }
  var hcd = (window.getHomeCardData) ? window.getHomeCardData() : {pctGlobal:0};
  var pct = (hcd && typeof hcd.pctGlobal==='number') ? hcd.pctGlobal : 0;
  var parcActives = (window.PARCELLES||[]).filter(function(p){ return p && p.statut!=='Arrachee'; });
  var surfTot = parcActives.reduce(function(s,p){ return s + parseFloat(p.surface||0); }, 0);
  var _sfd = window._saisonForDate;
  var nSess = (window.SESSIONS||[]).filter(function(s){ if(!s)return false; var n=(_sfd&&_sfd(s.date))||s.saison||''; return n===actNom; }).length;
  var nTrait = (window.TRAITEMENTS||[]).filter(function(t){ if(!t)return false; var n=(_sfd&&_sfd(t.date))||''; return n===actNom; }).length;
  var nTaches = (window.getTachesSaison?window.getTachesSaison():[]).length;
  var sug = _clotSuggestNext();
  var dd = _clotDatesFor(sug.type, sug.year);
  _CLOT = { step:1, mode:'create', type:sug.type, endNom:actNom, endPct:pct, _sugYear:sug.year };
  var prepared = (window.SAISONS||[]).filter(function(s){ return s && !s.active; });
  var html = _clotOverlayHTML({ pct:pct, endNom:actNom, surfTot:surfTot, nSess:nSess, nTrait:nTrait, nTaches:nTaches, sug:dd, prepared:prepared, warn:(pct<_CLOT_WARN_PCT) });
  var old = document.getElementById('ovCloture'); if(old && old.parentNode) old.parentNode.removeChild(old);
  var wrap = document.createElement('div'); wrap.innerHTML = html;
  if(wrap.firstElementChild) document.body.appendChild(wrap.firstElementChild);
  document.body.style.overflow = 'hidden';
  _clotStep(1);
}

function _clotStep(n){
  if(n<1)n=1; if(n>3)n=3; _CLOT.step=n;
  ['1','2','3'].forEach(function(i){
    var s=document.getElementById('clot-s'+i); if(s)s.style.display=(i===String(n))?'block':'none';
    var d=document.getElementById('clot-d'+i); if(d)d.style.background=(parseInt(i,10)<=n)?'#C9A84C':'rgba(240,226,200,.22)';
  });
  var ttl=document.getElementById('clot-ttl'); if(ttl)ttl.textContent=['','Bilan de la campagne','La prochaine campagne','Confirmer la clôture'][n];
  var back=document.getElementById('clot-back'); if(back)back.style.display=n>1?'block':'none';
  var nx=document.getElementById('clot-next');
  if(nx){
    if(n<3){ nx.textContent='Continuer'; nx.style.background='#14110D'; nx.style.color='#F0E2C8'; nx.style.borderColor='#14110D'; nx.onclick=function(){ if(window._clotNext)window._clotNext(); }; }
    else { nx.textContent='🏁 Clôturer la campagne'; nx.style.background='#7A1020'; nx.style.color='#fff'; nx.style.borderColor='#7A1020'; nx.onclick=function(){ if(window._clotExec)window._clotExec(); }; }
  }
  var sc=document.getElementById('clot-scroll'); if(sc)sc.scrollTop=0;
  if(n===3) _clotSyncConfirm();
}
function _clotNext(){ _clotStep((_CLOT.step||1)+1); }
function _clotBack(){ _clotStep((_CLOT.step||1)-1); }
function _clotClose(){ var o=document.getElementById('ovCloture'); if(o&&o.parentNode)o.parentNode.removeChild(o); document.body.style.overflow=''; }

function _clotSeg(mode){
  _CLOT.mode=mode;
  var bC=document.getElementById('clot-seg-create'), bA=document.getElementById('clot-seg-activate');
  var blC=document.getElementById('clot-create'), blA=document.getElementById('clot-activate');
  if(bC){ var on=mode==='create'; bC.style.background=on?'#14110D':'#FBFAF6'; bC.style.color=on?'#F0E2C8':'#6B655C'; bC.style.borderColor=on?'#14110D':'#E7E3DA'; }
  if(bA){ var o2=mode==='activate'; bA.style.background=o2?'#14110D':'#FBFAF6'; bA.style.color=o2?'#F0E2C8':'#6B655C'; bA.style.borderColor=o2?'#14110D':'#E7E3DA'; }
  if(blC)blC.style.display=mode==='create'?'block':'none';
  if(blA)blA.style.display=mode==='activate'?'block':'none';
  _clotSyncConfirm();
}


function _clotSyncConfirm(){
  var name;
  if(_CLOT.mode==='create'){ name=(((document.getElementById('clot-name')||{}).value)||'').trim()||'Nouvelle campagne'; }
  else { name=(((document.getElementById('clot-prep')||{}).value)||'')||'Nouvelle campagne'; }
  var t1=document.getElementById('clot-cf-new'); if(t1)t1.textContent=name;
  var t2=document.getElementById('clot-cf-new2'); if(t2)t2.textContent=name;
}

function _clotExec(){
  var saison=(window.getSaisonActive && window.getSaisonActive())||{};
  try{
    var jNoMeteo=(window.JOURNAL||[]).filter(function(j){ return j && !j.meteo; });
    var snap={
      saisonNom:saison.nom, periode:saison.periode, archivedAt:new Date().toISOString(),
      parcelles:deepClone(window.PARCELLES),
      journal:deepClone(jNoMeteo),
      sessions:deepClone(window.SESSIONS),
      taches:deepClone(window.getTachesSaison()),
      travaux:deepClone(window.TRAVAUX),
      stats:_calcHistoStats(window.PARCELLES, jNoMeteo, window.getTachesSaison(), window.TRAVAUX)
    };
    var ex=(window.HISTORIQUE||[]).findIndex(function(h){ return h.saisonNom===saison.nom; });
    if(ex>=0) window.HISTORIQUE[ex]=snap; else window.HISTORIQUE.unshift(snap);
    window.HISTORIQUE=window.HISTORIQUE;
    window.saveData('historique');
  }catch(e){ if(window.showToast)showToast('Archivage impossible — clôture annulée','#B85A1A'); return; }
  var newNom='';
  if(_CLOT.mode==='create'){
    var nm=(((document.getElementById('clot-name')||{}).value)||'').trim();
    var deb=((document.getElementById('clot-deb')||{}).value)||'';
    var fin=((document.getElementById('clot-fin')||{}).value)||'';
    if(!nm){ if(window.showToast)showToast('Nom de campagne requis','#B85A1A'); return; }
    if((window.SAISONS||[]).some(function(s){ return (s.nom||'').trim().toLowerCase()===nm.toLowerCase(); })){ if(window.showToast)showToast('« '+nm+' » existe déjà','#B85A1A'); return; }
    // La nouvelle campagne hérite de la liste de tâches de celle qu'on clôture (le flux force
    // d'abord la vue sur la période active). Modifiable ensuite dans Réglages.
    var _herit=(window.getTachesSaison?window.getTachesSaison():[]).map(function(x){return x.nom;});
    window.SAISONS.push({ nom:nm, periode:_nsPeriode(deb,fin), debut:deb, fin:fin, active:false, taches:_herit });
    newNom=nm;
  } else {
    newNom=((document.getElementById('clot-prep')||{}).value)||'';
    if(!newNom){ if(window.showToast)showToast('Choisis une campagne préparée','#B85A1A'); return; }
  }
  try{ activateSaison(newNom); }catch(e){ if(window.showToast)showToast('Activation impossible','#B85A1A'); return; }
  _clotClose();
  if(window.showToast)showToast('🏁 Campagne clôturée — '+newNom+' est active','#3D6B27');
}

window.openClotureFlow = openClotureFlow;
window._clotStep       = _clotStep;
window._clotNext       = _clotNext;
window._clotBack       = _clotBack;
window._clotClose      = _clotClose;
window._clotSeg        = _clotSeg;
window._clotSyncConfirm= _clotSyncConfirm;
window._clotExec       = _clotExec;


// Calcule les stats d'un snapshot
function _calcHistoStats(parcelles, journal, taches, travaux){
  const parcActives = parcelles.filter(p=>p.statut!=='Arrachee');
  const totalCases = taches.length * parcActives.length;
  const totalVal = parcActives.reduce((s,p)=>s+taches.filter(t=>p.taches&&p.taches[t.nom]==='Validé').length,0);
  const pctGlobal = totalCases>0 ? Math.round(totalVal/totalCases*100) : 0;
  const nbEntries = journal.length;
  const nbParcellesTouchees = [...new Set(journal.map(j=>j.parcelle))].length;
  // Heures totales faites
  const hFaites = Object.values(travaux||{}).reduce((s,t)=>s+(t.h_done||0),0);
  // Tâches par avancement
  const tachesStats = taches.map(t=>{
    const tw = travaux[t.nom];
    return {nom:t.nom, pct:tw?tw.pct:0, h_done:tw?tw.h_done:0, h_total:tw?tw.h_total:0};
  });
  return {pctGlobal, nbEntries, nbParcellesTouchees, hFaites:Math.round(hFaites), tachesStats};
}

// Récupère les stats de la saison active courante (sans snapshot)
function _getCurrentStats(){
  const taches = window.getTachesSaison();
  return {
    saisonNom: window.getSaisonActive().nom,
    periode: window.getSaisonActive().periode,
    stats: _calcHistoStats(window.PARCELLES, window.JOURNAL.filter(j=>!j.meteo), taches, window.TRAVAUX),
    taches
  };
}

// Rend le panneau historique
let histoSelA=null, histoSelB=null; // Saisons sélectionnées pour comparaison

function renderHistorique(){
  const body = document.getElementById('histo-body');
  if(!body) return;

  const cur = _getCurrentStats();
  // Liste des snapshots + saison courante
  const allSaisons = [
    {saisonNom:cur.saisonNom+' (actuelle)', saisonKey:cur.saisonNom, periode:cur.periode, stats:cur.stats, isCurrent:true},
    ...window.HISTORIQUE.map(h=>({...h, saisonKey:h.saisonNom, isCurrent:false}))
  ];

  // Init sélection par défaut : 2 premières
  if(!histoSelA || !allSaisons.find(s=>s.saisonKey===histoSelA)) histoSelA = allSaisons[0]?.saisonKey||null;
  if(!histoSelB || !allSaisons.find(s=>s.saisonKey===histoSelB)) histoSelB = allSaisons[1]?.saisonKey||null;

  const sA = allSaisons.find(s=>s.saisonKey===histoSelA);
  const sB = allSaisons.find(s=>s.saisonKey===histoSelB);

  const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}) : '—';

  let html = '';

  // ── En-tête ──
  html += `<div class="histo-header" style="margin:16px 16px 12px">
    <div class="histo-header-title">📊 Comparaison multi-saisons</div>
    <div class="histo-header-sub">${allSaisons.length} saison${allSaisons.length>1?'s':''} disponible${allSaisons.length>1?'s':''}</div>
  </div>`;

  // ── Bouton archiver saison active ──
  html += `<div class="histo-archive-btn" onclick="archiveSaisonActive()">
    <div class="hab-ico">📦</div>
    <div class="hab-txt">
      <div class="hab-lbl">Archiver ${_escHtml(cur.saisonNom)}</div>
      <div class="hab-sub">Créer un snapshot de l'état actuel</div>
    </div>
    <div style="font-size:20px;color:var(--texte-doux)">›</div>
  </div>
  <div id="histo-archive-feedback" style="display:none;margin:0 16px 12px;background:var(--vert-pale);color:var(--vert);border-radius:10px;padding:8px 14px;font-size:12px;font-weight:600"></div>`;

  if(allSaisons.length < 2){
    html += `<div class="empty-state"><div class="ei">🗂️</div><div class="et">Aucune saison archivée</div><div class="ed">L'historique s'enrichira au fil des saisons clôturées. La saison active n'apparaît pas ici.</div></div>`;
    body.innerHTML = html;
    return;
  }

  // ── Sélecteurs de saisons ──
  html += `<div style="padding:0 16px;margin-bottom:8px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--texte-doux);margin-bottom:8px">Saison A — référence</div>
    <div class="histo-sel-row" style="padding:0;margin-bottom:12px">
      ${allSaisons.map(s=>`<button class="histo-sel-btn ${s.saisonKey===histoSelA?'actif':''}" onclick="histoSelectA('${_escAttr(s.saisonKey)}')">${_escHtml(s.saisonNom.replace(' (actuelle)',''))}</button>`).join('')}
    </div>
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--texte-doux);margin-bottom:8px">Saison B — comparaison</div>
    <div class="histo-sel-row" style="padding:0;margin-bottom:4px">
      ${allSaisons.map(s=>`<button class="histo-sel-btn ${s.saisonKey===histoSelB?'actif2':''}" onclick="histoSelectB('${_escAttr(s.saisonKey)}')">${_escHtml(s.saisonNom.replace(' (actuelle)',''))}</button>`).join('')}
    </div>
  </div>`;

  if(!sA || !sB){
    html += `<div style="padding:20px;text-align:center;color:var(--texte-doux);font-size:13px">Sélectionnez 2 saisons pour comparer</div>`;
    body.innerHTML = html;
    return;
  }

  const stA = sA.stats, stB = sB.stats;

  // ── Comparaison avancement global ──
  const diffPct = stA.pctGlobal - stB.pctGlobal;
  const diffSign = diffPct>0?'▲':diffPct<0?'▼':'=';
  const diffCol = diffPct>0?'var(--vert-med)':diffPct<0?'var(--rouge)':'var(--texte-doux)';

  html += `<div style="padding:0 16px;margin-bottom:6px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--texte-doux)">Avancement global</div>
      <div style="font-size:11px;font-weight:700;color:${diffCol}">${diffSign} ${Math.abs(diffPct)}% d'écart</div>
    </div>
    <div class="histo-compare-grid" style="padding:0">
      <div class="histo-col col-a">
        <div class="histo-col-title">${sA.saisonNom.replace(' (actuelle)','')}</div>
        <div class="histo-col-pct">${stA.pctGlobal}%</div>
        <div class="histo-col-sub">${stA.nbEntries} entrées · ${stA.nbParcellesTouchees} parcelles</div>
        <div class="histo-col-bar"><div class="histo-col-bar-fill" style="width:${stA.pctGlobal}%"></div></div>
      </div>
      <div class="histo-col col-b">
        <div class="histo-col-title">${sB.saisonNom.replace(' (actuelle)','')}</div>
        <div class="histo-col-pct">${stB.pctGlobal}%</div>
        <div class="histo-col-sub">${stB.nbEntries} entrées · ${stB.nbParcellesTouchees} parcelles</div>
        <div class="histo-col-bar"><div class="histo-col-bar-fill" style="width:${stB.pctGlobal}%"></div></div>
      </div>
    </div>
  </div>`;

  // ── Stats en bande ──
  const diffH = stA.hFaites - stB.hFaites;
  const diffHSign = diffH>0?'+':'';
  html += `<div class="histo-stat-band" style="margin-bottom:14px">
    <div class="hsb-item">
      <div class="hsb-val" style="color:${diffH>0?'var(--vert-med)':diffH<0?'var(--rouge)':'var(--texte)'}">${diffHSign}${diffH}h</div>
      <div class="hsb-lbl">Diff. heures</div>
    </div>
    <div class="hsb-item">
      <div class="hsb-val" style="color:var(--vert)">${stA.hFaites}h</div>
      <div class="hsb-lbl">${sA.saisonNom.replace(' (actuelle)','').split(' ').slice(0,1).join('')}</div>
    </div>
    <div class="hsb-item">
      <div class="hsb-val" style="color:var(--acier)">${stB.hFaites}h</div>
      <div class="hsb-lbl">${sB.saisonNom.replace(' (actuelle)','').split(' ').slice(0,1).join('')}</div>
    </div>
  </div>`;

  // ── Comparaison tâche par tâche ──
  // Fusionner tâches A et B
  const toutesLesTaches = [...new Set([
    ...(stA.tachesStats||[]).map(t=>t.nom),
    ...(stB.tachesStats||[]).map(t=>t.nom)
  ])];

  if(toutesLesTaches.length>0){
    html += `<div style="padding:0 16px;margin-bottom:8px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--texte-doux);margin-bottom:10px">Détail par tâche</div></div>
    <div class="histo-tache-compare">`;
    toutesLesTaches.forEach(nom=>{
      const tA = (stA.tachesStats||[]).find(t=>t.nom===nom)||{pct:0,h_done:0};
      const tB = (stB.tachesStats||[]).find(t=>t.nom===nom)||{pct:0,h_done:0};
      const emoji = (window.TEMOJI&&TEMOJI[nom])||'🌿';
      const dPct = tA.pct-tB.pct;
      const dSign = dPct>0?'+':'';
      const dCol = dPct>0?'var(--vert-med)':dPct<0?'var(--rouge)':'var(--texte-doux)';
      html += `<div class="htc-row">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div class="htc-nom">${emoji} ${nom}</div>
          <div style="font-size:10px;font-weight:700;color:${dCol}">${dSign}${dPct}%</div>
        </div>
        <div class="htc-bars">
          <div class="htc-bar-row">
            <div class="htc-bar-label la">${sA.saisonNom.replace(' (actuelle)','').split(' ').slice(0,2).join(' ')}</div>
            <div class="htc-bar-track" aria-hidden="true"><div class="htc-bar-fill-a" style="width:${tA.pct}%"></div></div>
            <div class="htc-pct la">${tA.pct}%</div>
          </div>
          <div class="htc-bar-row">
            <div class="htc-bar-label lb">${sB.saisonNom.replace(' (actuelle)','').split(' ').slice(0,2).join(' ')}</div>
            <div class="htc-bar-track" aria-hidden="true"><div class="htc-bar-fill-b" style="width:${tB.pct}%"></div></div>
            <div class="htc-pct lb">${tB.pct}%</div>
          </div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  // ── Dernier snapshot ──
  if(!sA.isCurrent){
    html += `<div style="padding:0 16px;margin-bottom:8px;font-size:10px;color:var(--texte-doux)">📸 Snapshot A : ${fmtDate(sA.archivedAt)}</div>`;
  }
  if(!sB.isCurrent){
    html += `<div style="padding:0 16px;margin-bottom:16px;font-size:10px;color:var(--texte-doux)">📸 Snapshot B : ${fmtDate(sB.archivedAt)}</div>`;
  }

  // ── Supprimer snapshot ──
  const archivesDeleteables = window.HISTORIQUE.filter(h=>h.saisonNom===histoSelA||h.saisonNom===histoSelB);
  if(archivesDeleteables.length>0){
    html += `<div style="padding:0 16px">`;
    archivesDeleteables.forEach(h=>{
      html += `<button onclick="deleteHistoSnapshot('${_escAttr(h.saisonNom)}')" style="width:100%;padding:10px;border-radius:10px;border:1.5px solid var(--rouge);background:transparent;color:var(--rouge);font-size:12px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;margin-bottom:8px">🗑 Supprimer le snapshot « ${_escHtml(h.saisonNom)} »</button>`;
    });
    html += `</div>`;
  }

  body.innerHTML = html;
}

function histoSelectA(key){ histoSelA=key; renderHistorique(); }
function histoSelectB(key){ histoSelB=key; renderHistorique(); }

function deleteHistoSnapshot(nomSaison){
  window.DANGER_CFG.deleteHisto = {
    icon:'🗑️',
    title:'Supprimer ce snapshot ?',
    sub:'Snapshot de "'+nomSaison+'" — action irréversible.',
    word:'SUPPRIMER',
    btn:'🗑️ Supprimer le snapshot',
    successSub:'Snapshot supprimé.',
    items:['Toutes les données de ce snapshot seront perdues','Cette action est irréversible'],
    exec:function(){
      window.HISTORIQUE = window.HISTORIQUE.filter(h=>h.saisonNom!==nomSaison);
      window.HISTORIQUE = window.HISTORIQUE;
      if(histoSelA===nomSaison) histoSelA=null;
      if(histoSelB===nomSaison) histoSelB=null;
      window.saveData('historique', '🗑️ Snapshot supprimé');
      renderHistorique();
    }
  };
  window.openOvDanger('deleteHisto');
}
// ════ EXPORT ════
// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTS & IMPRESSIONS — le hub unique (remplace la section Import/Export)
// ═══════════════════════════════════════════════════════════════════════════
// Avant ce lot, les documents de Ma Vigne se declenchaient depuis quatre points
// d'entree repartis sur six modules : un bouton dans le Cuvier, un autre dans le
// menu Outils du Tracteur, deux dans La Reserve, la section Import/Export de
// Reglages... Un vigneron qui cherchait son registre phyto devait savoir dans
// quel ecran il avait ete range.
//
// Le hub rassemble tout ce que l'app sait sortir, classe par USAGE et non par
// module : ce qu'il faut pouvoir montrer en controle, les etats internes, les
// donnees brutes. Il ne genere rien lui-meme — il appelle les fonctions qui
// existaient deja. Aucune n'a ete modifiee par ce lot.
//
// ⚠️ Deux documents restent VOLONTAIREMENT dans leur module : la fiche salarie
// et le CSV du planning dependent du mois et du modele affiches a l'ecran
// (`planMonth`, le template en cours d'edition). Sortis de leur contexte, ils
// produiraient un document du mauvais mois, en silence. Meme raison pour le CSV
// des couts du Pilotage, qui suit la periode CONSULTEE.
//
// Reserve aux admins, comme l'etait la section Import/Export qu'il remplace.

var MV_DOCS = [
  // --- Obligatoire : ce qu'il faut pouvoir sortir en controle ---
  { f:'oblig', act:'phytoPdf',  mod:'phyto',    ico:'\u{1F9EA}', bg:'var(--phyto-pale)', fm:'pdf',
    t:'Registre phytosanitaire', ask:'Toute la campagne',
    s:'Tous les traitements avec AMM, dose, d\u00e9lai avant r\u00e9colte et d\u00e9lai de rentr\u00e9e.' },
  { f:'oblig', act:'phytoCsv',  mod:'phyto',    ico:'\u{1F4CA}', bg:'var(--vert-pale)',  fm:'csv',
    t:'Registre phyto \u2014 fichier Excel', ask:'', urgent:true,
    s:'Le m\u00eame registre en format lisible par machine : une ligne par produit et par parcelle, avec les coordonn\u00e9es GPS.' },
  { f:'oblig', act:'cuivre',    mod:'phyto',    ico:'\u{1FA99}', bg:'var(--terre-pale)', fm:'pdf',
    t:'Synth\u00e8se cuivre', ask:'',
    s:'Cuivre m\u00e9tal par parcelle sur sept ans, face au plafond de 28 kg/ha.' },
  { f:'oblig', act:'mois',      mod:'planning', ico:'\u23F1\u{FE0F}', bg:'var(--bleu-pale)', fm:'pdf',
    t:'Relev\u00e9 mensuel d\u2019heures', ask:'Choix du mois',
    s:'Heures travaill\u00e9es, jours travaill\u00e9s et absences du mois \u2014 le format attendu par la MSA.' },
  { f:'oblig', act:'releve',    mod:'planning', ico:'\u{1F464}', bg:'var(--phyto-pale)', fm:'pdf',
    t:'Relev\u00e9 individuel d\u2019un salari\u00e9', ask:'Salari\u00e9 puis mois',
    s:'Le mois jour par jour d\u2019une seule personne, ses contrats, ses cong\u00e9s, son compteur d\u2019heures et son annualisation. \u00c0 signer des deux c\u00f4t\u00e9s.' },

  // --- Suivi du domaine : des etats internes, jamais des declarations ---
  { f:'suivi', act:'vignoble',  mod:'',         ico:'\u{1F5FA}\u{FE0F}', bg:'var(--vert-pale)', fm:'pdf',
    t:'\u00c9tat du vignoble', ask:'',
    s:'Toutes vos parcelles sur une page : surface, c\u00e9page, commune, avancement, dernier travail, dernier rendement \u2014 et ce qui reste \u00e0 renseigner.' },
  { f:'suivi', act:'saison',    mod:'',         ico:'\u{1F4C4}', bg:'var(--or-pale)',    fm:'pdf', ov:true,
    t:'Rapport de saison', ask:'Choix de la p\u00e9riode',
    s:'Avancement, tracteur, entretiens, incidents, phyto, cuivre et ETP sur une p\u00e9riode.' },
  { f:'suivi', act:'annuel',    mod:'planning', ico:'\u{1F5D3}\u{FE0F}', bg:'var(--bleu-pale)', fm:'pdf',
    t:'Planning de l\u2019ann\u00e9e', ask:'Choix de l\u2019ann\u00e9e',
    s:'Le rythme de l\u2019\u00e9quipe sur douze mois : jours travaill\u00e9s, heures de prise et de fin de service, '
     +'fermetures et jours f\u00e9ri\u00e9s. Une page par mod\u00e8le de semaine.' },
  { f:'suivi', act:'bilan',     mod:'pilotage', ico:'\u{1F4D6}', bg:'var(--vert-pale)',  fm:'pdf', ov:true,
    t:'Bilan de campagne', ask:'Campagne puis mill\u00e9sime',
    s:'La vigne, la r\u00e9colte, le chai et le parc \u00e0 f\u00fbts sur une ann\u00e9e. La vigne suit la campagne, le vin suit son mill\u00e9sime.' },
  { f:'suivi', act:'manip',     mod:'cave',     ico:'\u{1F4CB}', bg:'var(--terre-pale)', fm:'pdf', ov:true,
    t:'Registre des manipulations', ask:'Choix du mill\u00e9sime',
    s:'Enrichissement, sulfitage, adjonctions et pratiques de cave, mill\u00e9sime par mill\u00e9sime.' },
  { f:'suivi', act:'futs',      mod:'reserve',  ico:'\u{1F6E2}\u{FE0F}', bg:'var(--or-pale)', fm:'pdf',
    t:'Inventaire des f\u00fbts', ask:'',
    s:'Le parc entier : f\u00fbts libres, f\u00fbts en vin, pyramide des \u00e2ges et mouvements.' },
  { f:'suivi', act:'intrants',  mod:'reserve',  ico:'\u{1F4E6}', bg:'var(--acier-pale)', fm:'pdf',
    t:'Inventaire des intrants', ask:'',
    s:'Stocks, achats et consommations du magasin.' },
  { f:'suivi', act:'matur',     mod:'cave',     ico:'\u{1F347}', bg:'var(--vert-pale)',  fm:'pdf', ov:true,
    t:'Contr\u00f4le de maturit\u00e9', ask:'Choix de l\u2019ann\u00e9e',
    s:'Vos rel\u00e8vements avant vendange, parcelle par parcelle et jour par jour, dans l\u2019ordre de maturit\u00e9.' },
  { f:'suivi', act:'recoltes',  mod:'cave',     ico:'\u{1F347}', bg:'var(--rouge-pale)', fm:'pdf',
    t:'R\u00e9coltes de la vendange', ask:'',
    s:'Caisses, kilos et hectolitres par parcelle et par cuve.' },
  { f:'suivi', act:'cuverie',   mod:'cave',     ico:'\u{1FAA3}', bg:'var(--terre-pale)', fm:'pdf', ov:true,
    t:'Cahier de cuverie', ask:'Choix de l\u2019ann\u00e9e',
    s:'Une page par cuve : densit\u00e9s, temp\u00e9ratures, remontages, pigeages et op\u00e9rations de la fermentation.' },
  { f:'suivi', act:'elevage',   mod:'cave',     ico:'\u{1F377}', bg:'var(--rouge-pale)', fm:'pdf', ov:true,
    t:'Suivi d\u2019\u00e9levage', ask:'',
    s:'Les op\u00e9rations du chai, cuv\u00e9e par cuv\u00e9e, avec les analyses.' },
  { f:'suivi', act:'entretien', mod:'tracteur', ico:'\u{1F69C}', bg:'var(--acier-pale)', fm:'pdf', ov:true,
    t:'Carnet d\u2019entretien', ask:'Choix de la machine',
    s:'Entretiens r\u00e9alis\u00e9s et \u00e0 venir, par machine, avec les heures et le GNR.' },
  { f:'suivi', act:'etp',       mod:'',         ico:'\u2699\u{FE0F}', bg:'var(--gris-clair)', fm:'reg',
    t:'Heures & ETP de la saison', ask:'',
    s:'Un r\u00e9glage, pas un document : ces heures alimentent le rapport de saison.' },

  // --- Donnees brutes ---
  { f:'brut',  act:'csvJournal',   mod:'', ico:'\u{1F4CB}', bg:'var(--vert-pale)',  fm:'csv',
    t:'Journal des travaux', ask:'',
    s:'Toutes les entr\u00e9es avec date, parcelle, t\u00e2che, ouvrier et statut.' },
  { f:'brut',  act:'csvParcelles', mod:'', ico:'\u{1F5FA}\u{FE0F}', bg:'var(--or-pale)', fm:'csv',
    t:'Avancement par parcelle', ask:'',
    s:'Une ligne par parcelle, une colonne par t\u00e2che.' },
  { f:'brut',  act:'json',         mod:'', ico:'\u{1F4BE}', bg:'var(--gris-clair)', fm:'json',
    t:'Sauvegarde compl\u00e8te', ask:'',
    s:'Toutes les donn\u00e9es du domaine dans un seul fichier. \u00c0 garder au chaud.' },
  { f:'brut',  act:'restore',      mod:'', ico:'\u21A9\u{FE0F}', bg:'var(--rouge-pale)', fm:'imp',
    t:'Restaurer depuis un fichier', ask:'',
    s:'Remet en place une sauvegarde. Remplace les donn\u00e9es actuelles.' }
];

var MV_DOCS_FAM = [
  { k:'oblig', ico:'\u{1F4CB}', lbl:'Obligatoire',
    intro:'<b>Ce que vous devez pouvoir sortir en contr\u00f4le.</b> Gardez-les au format demand\u00e9, pas seulement \u00e0 l\u2019\u00e9cran.' },
  { k:'suivi', ico:'\u{1F4CA}', lbl:'Suivi du domaine',
    intro:'<b>Vos \u00e9tats internes.</b> Ils pr\u00e9sentent ce que vous avez saisi. Ils ne tiennent lieu d\u2019aucune d\u00e9claration officielle.' },
  { k:'brut',  ico:'\u{1F4BE}', lbl:'Donn\u00e9es brutes',
    intro:'<b>Vos donn\u00e9es, telles quelles.</b> Pour votre tableur, votre comptable, ou pour garder une copie \u00e0 vous.' }
];

var _docsFam = 'oblig';

// Gate module : meme regle que le dock. Un document dont le module est masque
// pour ce membre, ou hors formule, reste VISIBLE mais grise — cacher une ligne
// laisse croire que le document n'existe pas.
function _docsCan(mod){
  if(!mod) return true;
  try{ return (typeof window._canModule==='function') ? window._canModule(mod) : true; }
  catch(e){ return true; }
}
function _docsEsc(s){ return (typeof window._escHtml==='function') ? window._escHtml(String(s==null?'':s)) : String(s==null?'':s); }
function _docsFmTag(fm){
  if(fm==='pdf')  return '<span style="font-size:9.5px;font-weight:600;padding:2.5px 7px;border-radius:20px;background:var(--rouge-pale);color:var(--rouge)">PDF</span>';
  if(fm==='csv')  return '<span style="font-size:9.5px;font-weight:600;padding:2.5px 7px;border-radius:20px;background:var(--vert-pale);color:var(--vert)">Excel / CSV</span>';
  if(fm==='json') return '<span style="font-size:9.5px;font-weight:600;padding:2.5px 7px;border-radius:20px;background:var(--acier-pale);color:var(--acier)">JSON</span>';
  if(fm==='imp')  return '<span style="font-size:9.5px;font-weight:600;padding:2.5px 7px;border-radius:20px;background:var(--bleu-pale);color:var(--bleu)">Fichier \u00e0 choisir</span>';
  return '<span style="font-size:9.5px;font-weight:600;padding:2.5px 7px;border-radius:20px;background:var(--gris-clair);color:var(--texte-doux)">R\u00e9glage</span>';
}
function _docsChip(txt,bg,col){
  return '<span style="font-size:9.5px;font-weight:600;padding:2.5px 7px;border-radius:20px;background:'+bg+';color:'+col+'">'+_docsEsc(txt)+'</span>';
}
function _docsRow(d,i,ok){
  return '<div onclick="'+(ok?'docsGo('+i+')':'')+'" style="display:flex;gap:11px;align-items:flex-start;background:var(--fond-module);border:1px solid var(--gris);border-radius:13px;padding:12px 13px;margin-bottom:9px;min-height:44px;'
    +(ok?'cursor:pointer':'opacity:.45')+'">'
    +'<span style="width:38px;height:38px;flex:none;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;background:'+d.bg+'">'+d.ico+'</span>'
    +'<span style="flex:1;min-width:0;display:block">'
      +'<span style="display:block;font-size:13.5px;font-weight:700;color:var(--texte);line-height:1.25">'+_docsEsc(d.t)+'</span>'
      +'<span style="display:block;font-size:11px;color:var(--texte-doux);line-height:1.45;margin-top:3px">'+_docsEsc(d.s)+'</span>'
      +'<span style="display:flex;flex-wrap:wrap;gap:5px;margin-top:7px">'
        +_docsFmTag(d.fm)
        +(d.ask?_docsChip(d.ask,'var(--gris-clair)','var(--texte-doux)'):'')
        +(ok?'':_docsChip('\u{1F512} formule sup\u00e9rieure','var(--gris-clair)','var(--texte-doux)'))
      +'</span>'
    +'</span>'
    +(ok?'<span style="align-self:center;font-size:17px;color:var(--texte-doux);opacity:.5;flex:none">\u203a</span>':'')
    +'</div>';
}
function _docsRender(){
  var nav=document.getElementById('docs-nav');
  var intro=document.getElementById('docs-intro');
  var list=document.getElementById('docs-list');
  if(!nav||!list||!intro) return;
  nav.innerHTML=MV_DOCS_FAM.map(function(f){
    var n=MV_DOCS.filter(function(d){return d.f===f.k&&_docsCan(d.mod);}).length;
    return '<button class="mvu-tab'+(_docsFam===f.k?' active':'')+'" onclick="docsFam(\''+f.k+'\')">'+f.ico+' '+f.lbl
      +' <span style="opacity:.55;font-weight:500">'+n+'</span></button>';
  }).join('');
  var fam=MV_DOCS_FAM.filter(function(f){return f.k===_docsFam;})[0]||MV_DOCS_FAM[0];
  var bord=_docsFam==='oblig'?'var(--rouge)':(_docsFam==='suivi'?'var(--or)':'var(--acier)');
  var fond=_docsFam==='oblig'?'var(--rouge-pale)':(_docsFam==='suivi'?'var(--or-pale)':'var(--acier-pale)');
  intro.innerHTML='<div style="background:'+fond+';border-left:3px solid '+bord+';border-radius:12px;padding:11px 13px;font-size:11.5px;line-height:1.55;color:var(--texte);margin-bottom:12px">'
    +fam.intro
    +(_docsFam==='oblig'?' <span style="display:inline-block;background:var(--rouge);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;margin-top:4px">Fichier obligatoire au 01/01/2027</span>':'')
    +'</div>';
  var arr=[];
  MV_DOCS.forEach(function(d,i){ if(d.f===_docsFam) arr.push({d:d,i:i,ok:_docsCan(d.mod)}); });
  arr.sort(function(a,b){ return (a.ok===b.ok)?0:(a.ok?-1:1); });
  list.innerHTML=arr.map(function(x){ return _docsRow(x.d,x.i,x.ok); }).join('');
}
window.docsFam=function(k){ _docsFam=k; _docsRender(); };

// Panneaux de preparation : le releve mensuel et le reglage des heures de saison
// ne se declenchent pas d'un clic, ils se preparent. Ils remplacent la liste
// plutot que de s'empiler — un overlay de plus rendrait le retour confus.
function _docsPane(id){
  var home=document.getElementById('docs-home'), pane=document.getElementById('docs-pane');
  if(!home||!pane) return;
  ['docs-pane-mois','docs-pane-etp','docs-pane-releve'].forEach(function(p){
    var el=document.getElementById(p); if(el) el.style.display=(p===id)?'':'none';
  });
  home.style.display='none'; pane.style.display='';
}
window.docsBack=function(){
  var home=document.getElementById('docs-home'), pane=document.getElementById('docs-pane');
  if(pane) pane.style.display='none';
  if(home) home.style.display='';
};

// Une action = un nom, jamais du code stocke en donnee. Si la fonction cible
// manque (module pas encore charge, fichier plus ancien chez un client), on le
// dit au lieu de laisser un clic sans effet.
window.docsGo=function(i){
  var d=MV_DOCS[i]; if(!d) return;
  if(!_docsCan(d.mod)) return;
  if(d.act==='mois'){
    _docsPane('docs-pane-mois');
    var pm=document.getElementById('pdf-mois');
    if(pm&&pm.value&&typeof window.planFillPDFFromMonth==='function') window.planFillPDFFromMonth(pm.value);
    return;
  }
  if(d.act==='releve'){ _docsReleveOpen(); return; }
  if(d.act==='etp'){ _docsPane('docs-pane-etp'); return; }
  if(d.act==='restore'){
    var inp=document.getElementById('import-json-input');
    if(inp) inp.click();
    else if(window.showToast) window.showToast('Import indisponible','#B85A1A');
    return;
  }
  // ⚠️ Les fonctions sont nommees EN CLAIR, jamais atteintes par window[chaine].
  // L'app n'a aucun appel dynamique : c'est ce qui rend une purge guidee par grep
  // sure, et ce qui permet au preflight de voir qui appelle quoi. Une table
  // { cle: 'nomDeFonction' } aurait casse les deux.
  var fn=null;
  switch(d.act){
    case 'phytoPdf':     fn=window.exportPDFPhyto;         break;
    case 'phytoCsv':     fn=window._phytoExportCsv;        break;
    case 'cuivre':       fn=window.openSyntheseCuivre;     break;
    case 'vignoble':     fn=window._vgnExportVignoble;     break;
    case 'saison':       fn=window.openRapportSaison;      break;
    case 'annuel':       fn=window.planAnnuelPdf;        break;
    case 'bilan':        fn=window._bcExportChoix;         break;
    case 'manip':        fn=window._rmExportChoix;         break;
    case 'futs':         fn=window._rsvExportFutsPdf;      break;
    case 'intrants':     fn=window._rsvExportPdf;          break;
    case 'matur':        fn=window._matExportChoix;        break;
    case 'recoltes':     fn=window.exportVendRecoltesPdf;  break;
    case 'cuverie':      fn=window._cuvExportChoix;        break;
    case 'elevage':      fn=window.openOvCaveExport;       break;
    case 'entretien':    fn=window.ouvrirExportEntretien;  break;
    case 'csvJournal':   fn=window.exportCSVJournal;       break;
    case 'csvParcelles': fn=window.exportCSVParcelles;     break;
    case 'json':         fn=window.exportJSON;             break;
  }
  if(typeof fn!=='function'){
    if(window.showToast) window.showToast('Document indisponible sur cette version','#B85A1A');
    if(window.logError) window.logError({level:'warning',cat:'docs',msg:'document sans fonction : '+d.act});
    return;
  }
  // Les documents qui ouvrent un autre ecran ferment le hub : deux feuilles
  // empilees sur un telephone ne laissent plus voir ou l'on est.
  if(d.ov && typeof window.closeOv==='function') window.closeOv(null,'ovDocs');
  fn();
};

window.openDocs=function(){
  if(typeof isAdmin==='function' && !isAdmin()){
    if(window.showToast) window.showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#C0392B');
    return;
  }
  window.docsBack();
  _docsRender();
  window.openOv('ovDocs');
};

// Conserve pour compatibilite : d'anciens raccourcis et la visite guidee peuvent
// encore appeler openExport(). Tout converge desormais vers le hub.
function openExport(){ window.openDocs(); }
function dlFile(content,filename,mime){
  const blob=new Blob([content],{type:mime});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(url);document.body.removeChild(a);},1000);
}
function showExportFeedback(msg){
  const el=document.getElementById('export-feedback');
  if(!el)return;
  el.textContent=msg;el.style.display='block';
  setTimeout(()=>{el.style.display='none';},3000);
}
function exportJSON(){
  if(!isAdmin())return;
  const data={exportDate:new Date().toISOString(),version:'4.7',domaine:(window.DOMAINE_NOM||'Mon domaine'),parcelles:window.PARCELLES,journal:window.JOURNAL.filter(j=>!j.meteo),sessions:window.SESSIONS,traitements:window.TRAITEMENTS,membres:window.MEMBRES.map(m=>({nom:m.nom,roles:m.roles,statut:m.statut})),saisons:window.SAISONS,taches:window.TACHES,historique:window.HISTORIQUE};
  const date=new Date().toISOString().split('T')[0];
  dlFile(JSON.stringify(data,null,2),`mavigne_export_${date}.json`,'application/json');
  showExportFeedback('✅ Export JSON téléchargé !');
}
function importJSON(input){
  if(!isAdmin())return;
  const file=input.files[0];
  if(!file){return;}
  // Réinitialiser l'input pour permettre de recharger le même fichier
  input.value='';
  const reader=new FileReader();
  reader.onload=function(e){
    let data;
    try{data=JSON.parse(e.target.result);}
    catch(err){
      showImportFeedback('❌ Fichier JSON invalide — vérifiez le fichier.','var(--rouge-pale)','var(--rouge)');
      return;
    }
    // Validation minimale
    if(!data.parcelles||!Array.isArray(data.parcelles)){
      showImportFeedback('❌ Format non reconnu — ce fichier n\'est pas un export Ma Vigne.','var(--rouge-pale)','var(--rouge)');
      return;
    }
    const nb=data.parcelles.length;
    const date=data.exportDate?new Date(data.exportDate).toLocaleDateString('fr-FR'):'inconnue';
    window.openConfirmDel('Charger cet export ?',''+nb+' parcelles · Export du '+date+'\nLes données actuelles seront remplacées.',function(){
      // Appliquer les données
      if(data.parcelles){window.PARCELLES.length=0;data.parcelles.forEach(p=>window.PARCELLES.push(p));}
      if(data.journal){window.JOURNAL=data.journal;window.JOURNAL=window.JOURNAL;}
      if(data.sessions){window.SESSIONS=data.sessions;window.SESSIONS=window.SESSIONS;}
      if(data.traitements){window.TRAITEMENTS=data.traitements;window.TRAITEMENTS=window.TRAITEMENTS;}
      if(data.membres){
        var _importedMbr = data.membres;
        var _cu = window.currentUser;
        if(_cu && _cu.email && !_cu._isGTAdmin) {
          var _cuInList = _importedMbr.some(function(m){ return m.email === _cu.email; });
          if(!_cuInList) {
            _importedMbr = [{nom:_cu.nom, email:_cu.email, roles:_cu.roles||['admin'], couleur:_cu.couleur||'#3D6B27', statut:'actif'}].concat(_importedMbr);
          }
        }
        window.MEMBRES = _importedMbr;
      }
      if(data.saisons){window.SAISONS=data.saisons;window.SAISONS=window.SAISONS;}
      if(data.taches){window.TACHES=data.taches;window.TACHES=window.TACHES;}
      if(data.historique){window.HISTORIQUE=data.historique;window.HISTORIQUE=window.HISTORIQUE;}
      if(typeof recalcAllTravaux==='function')recalcAllTravaux();
      if(typeof window.saveData==='function'){
        ['parcelles','journal','sessions','traitements','membres','saisons','taches','historique'].forEach(k=>window.saveData(k));
      }
      if(typeof window.renderHome==='function')window.renderHome();
      if(typeof window.renderParcelles==='function')window.renderParcelles();
      if(typeof window.computePStats==='function')window.computePStats();
      if(typeof renderReglages==='function')renderReglages();
      window.closeOv(null,'ovDocs');
      showImportFeedback(`✅ Import réussi — ${nb} parcelles chargées depuis l'export du ${date}.`,'var(--vert-pale)','var(--vert)');
    },'📂','Charger l\'export');
  };
  reader.onerror=function(){
    showImportFeedback('❌ Erreur de lecture du fichier.','var(--rouge-pale)','var(--rouge)');
  };
  reader.readAsText(file);
}
function showImportFeedback(msg,bg,color){
  // Afficher dans l'overlay s'il est ouvert, sinon en toast en bas
  const el=document.getElementById('export-feedback');
  if(el&&document.getElementById('ovDocs').classList.contains('open')){
    el.textContent=msg;el.style.background=bg;el.style.color=color;el.style.display='block';
    setTimeout(()=>{el.style.display='none';el.style.background='var(--vert-pale)';el.style.color='var(--vert)';},4000);
  } else {
    // Toast flottant si l'overlay est fermé
    let toast=document.createElement('div');
    toast.textContent=msg;
    toast.style.cssText=`position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:${bg};color:${color};border-radius:12px;padding:12px 20px;font-size:13px;font-weight:600;font-family:'Outfit',sans-serif;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.15);max-width:340px;text-align:center;`;
    document.body.appendChild(toast);
    setTimeout(()=>toast.remove(),4000);
  }
}
function recalcAllTravaux(){
  if(!window.TRAVAUX||!window.PARCELLES)return;
  Object.keys(window.TRAVAUX).forEach(nomTache=>{
    const t=window.TRAVAUX[nomTache];if(!t)return;
    const validees=window.PARCELLES.filter(p=>p.taches&&p.taches[nomTache]==='Validé');
    const surfDone=validees.reduce((s,p)=>s+(p.surface||0),0);
    t.surf_done=Math.round(surfDone*100)/100;
    t.h_done=Math.round(t.h_ha*surfDone*10)/10;
    t.h_reste=Math.round((t.h_total-t.h_done)*10)/10;
    t.pct=t.surf_total>0?Math.round(surfDone/t.surf_total*100):0;
  });
}
// ⚠️ Séparateur POINT-VIRGULE : avec la virgule, Excel en français entasse tout dans
// une seule colonne — et les nombres à virgule décimale s'y mélangent au séparateur.
function exportCSVJournal(){
  if(!isAdmin())return;
  const travaux=window.JOURNAL.filter(j=>!j.meteo);
  const cols=['Date','Parcelle','Tâche','Ouvrier','Statut','Équipe'];
  const q=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const rows=travaux.map(j=>[j.date,j.parcelle,j.tache,j.qui||'',j.statut,j.equipe?'Oui':'Non'].map(q).join(';'));
  const csv=[cols.map(q).join(';'),...rows].join('\r\n');
  const date=new Date().toISOString().split('T')[0];
  dlFile('\uFEFF'+csv,`mavigne_journal_${date}.csv`,'text/csv;charset=utf-8');
  showExportFeedback(`✅ ${travaux.length} entrées exportées en CSV !`);
}
function exportCSVParcelles(){
  if(!isAdmin())return;
  const tachesSaison=window.getTachesSaison();
  const colsTaches=tachesSaison.map(t=>t.nom);
  const cols=['Parcelle','Surface (ha)','Statut','Avancement (%)',...colsTaches];
  const q=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const dec=v=>String(v==null?'':v).replace('.',',');
  const rows=window.PARCELLES.map(p=>{
    const cl=window.getPCls(p);
    const tacheVals=colsTaches.map(t=>p.taches[t]||'Non démarré');
    return [q(p.nom),q(dec(p.surface)),q(p.statut),q(cl.pct),...tacheVals.map(q)].join(';');
  });
  const csv=[cols.map(q).join(';'),...rows].join('\r\n');
  const date=new Date().toISOString().split('T')[0];
  dlFile('\uFEFF'+csv,`mavigne_parcelles_${date}.csv`,'text/csv;charset=utf-8');
  showExportFeedback(`✅ ${window.PARCELLES.length} parcelles exportées en CSV !`);
}

function exportPDFMois(){
  if(!isAdmin())return;
  const moisVal=document.getElementById('pdf-mois').value;
  if(!moisVal){showToast('Sélectionnez un mois','#B85A1A');var _mEl=document.getElementById('pdf-mois');if(_mEl&&_mEl.focus)_mEl.focus();return;}
  const [annee,mois]=moisVal.split('-');
  const moisNoms=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const moisNom=moisNoms[parseInt(mois)-1]+' '+annee;
  const domaine=(window.DOMAINE_NOM||'Mon domaine');

  // Champs saisis manuellement
  const heuresTotales=(document.getElementById('pdf-heures').value||'').trim();
  const heuresDues=(document.getElementById('pdf-heures-dues').value||'').trim();
  const commentaire=(document.getElementById('pdf-commentaire').value||'').trim();
  const nbMbresPdf=parseInt(document.getElementById('pdf-nb-membres')?.value)||1;
  const etpVal=(heuresTotales&&heuresDues&&parseFloat(heuresDues)>0)
    ?(parseFloat(heuresTotales)/parseFloat(heuresDues)*nbMbresPdf).toFixed(2):null;

  // Filtrer le journal pour ce mois
  const travaux=window.JOURNAL.filter(j=>!j.meteo&&j.date&&j.date.startsWith(moisVal));
  const meteoMois=window.JOURNAL.filter(j=>j.meteo&&j.date&&j.date.startsWith(moisVal));

  // Grouper par date pour le détail
  const grouped={};
  [...travaux,...meteoMois].forEach(r=>{if(!grouped[r.date])grouped[r.date]=[];grouped[r.date].push(r);});
  const datesTri=Object.keys(grouped).sort((a,b)=>a.localeCompare(b));

  // Stats du mois
  const nbTravaux=travaux.length;
  const nbVal=travaux.filter(j=>j.statut==='Validé').length;
  const parcellesTouchees=[...new Set(travaux.map(j=>j.parcelle))];
  const ouvrierStats={};
  travaux.forEach(j=>{const n=j.equipe?'Équipe':(j.qui||'—');ouvrierStats[n]=(ouvrierStats[n]||0)+1;});

  const fmtD=d=>{if(!d)return'—';const[y,m,j]=d.split('-');return`${parseInt(j)} ${moisNoms[parseInt(m)-1].slice(0,3)} ${y}`;};

  // ── TÂCHES MULTI-JOURS ── (grouper tout le journal par tache+parcelle)
  const _mjKey=j=>j.tache+'||'+j.parcelle;
  const _mjGroups={};
  window.JOURNAL.filter(j=>!j.meteo&&j.tache&&j.parcelle).forEach(j=>{
    const k=_mjKey(j);
    if(!_mjGroups[k])_mjGroups[k]={tache:j.tache,parcelle:j.parcelle,dates:new Set(),entries:[]};
    _mjGroups[k].dates.add(j.date);
    _mjGroups[k].entries.push(j);
  });
  // Conserver uniquement ceux : >1 date ET au moins une entrée dans le mois courant
  const tachesMultiJours=Object.values(_mjGroups).filter(g=>
    g.dates.size>1&&[...g.dates].some(d=>d.startsWith(moisVal))
  ).map(g=>{
    const ds=[...g.dates].sort();
    const last=g.entries.filter(e=>e.date===ds[ds.length-1]).slice(-1)[0];
    return{tache:g.tache,parcelle:g.parcelle,dateDebut:ds[0],dateFin:ds[ds.length-1],nbJours:g.dates.size,statut:last?.statut||'—'};
  }).sort((a,b)=>a.parcelle.localeCompare(b.parcelle,'fr')||a.tache.localeCompare(b.tache,'fr'));
  // Map clé → dates triées pour badges J1/N dans le détail journées
  const _mjDateMap={};
  tachesMultiJours.forEach(t=>{const k=t.tache+'||'+t.parcelle;_mjDateMap[k]=[..._mjGroups[k].dates].sort();});

  // ── 1. MÉTÉO ──
  const meteoValides=meteoMois.filter(m=>m.temp!==undefined&&m.temp!==null);
  let meteoResume='';
  if(meteoValides.length>0){
    const temps=meteoValides.map(m=>parseFloat(m.temp));
    const tMoy=(temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1);
    const tMin=Math.min(...temps).toFixed(1);
    const tMax=Math.max(...temps).toFixed(1);
    const condCount={};
    meteoValides.forEach(m=>{const d=m.desc||'—';condCount[d]=(condCount[d]||0)+1;});
    const condTop=Object.entries(condCount).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([d,n])=>`${d} (${n}j)`).join(', ');
    const vents=meteoValides.filter(m=>m.wind).map(m=>parseFloat(m.wind));
    const ventMoy=vents.length>0?(vents.reduce((a,b)=>a+b,0)/vents.length).toFixed(0):'—';
    meteoResume=`<div class="meteo-resume">
      <div class="meteo-cols">
        <div class="meteo-col"><div class="mc-val">${tMoy}°C</div><div class="mc-lbl">Temp. moy.</div></div>
        <div class="meteo-col"><div class="mc-val" style="color:var(--bleu,#1A4A7A)">${tMin}°C</div><div class="mc-lbl">Min.</div></div>
        <div class="meteo-col"><div class="mc-val" style="color:var(--rouge,#A0291E)">${tMax}°C</div><div class="mc-lbl">Max.</div></div>
        <div class="meteo-col"><div class="mc-val">${ventMoy} km/h</div><div class="mc-lbl">Vent moy.</div></div>
        <div class="meteo-col"><div class="mc-val">${meteoValides.length}j</div><div class="mc-lbl">Jours relevés</div></div>
      </div>
      <div class="mc-cond">Conditions : ${condTop||'—'}</div>
    </div>`;
  } else {
    meteoResume='<p style="color:var(--texte-doux,#7A7A6A);font-style:italic">Aucune donnée météo enregistrée ce mois.</p>';
  }

  // ── 2. HEURES ──
  let heuresSection='<p style="color:var(--texte-doux,#7A7A6A);font-style:italic">Aucune saisie d\'heures pour ce mois.</p>';
  if(heuresTotales){
    heuresSection=`<div class="heures-box">
      <div class="h-item"><div class="h-val">${heuresTotales} h</div><div class="h-lbl">Travaillées</div></div>
      ${heuresDues?`<div class="h-sep"></div><div class="h-item"><div class="h-val" style="opacity:0.6">${heuresDues} h</div><div class="h-lbl">Dues (conv.)</div></div>`:''}
      ${etpVal?`<div class="h-sep"></div><div class="h-item"><div class="h-val" style="color:${parseFloat(etpVal)>=1?'#3D6B27':'#B85A1A'}">${etpVal}</div><div class="h-lbl">ETP ce mois</div></div>`:''}
    </div>`;
  }
  if(commentaire){
    heuresSection+=`<div class="commentaire-box" style="margin-top:10px">${commentaire}</div>`;
  }

  // ── 3. TRAVAUX RÉALISÉS DANS LE MOIS ──
  // ⚠ Ce bloc lisait AVANT `getTachesSaison()` + `p.taches[]` : les tâches de la période
  // ACTIVE et l'état COURANT des parcelles. Il ne regardait jamais le mois choisi -> un
  // rapport de mai sortait l'avancement d'août (« Vendange 0/45 »). Vécu le 09/08.
  // `p.taches` est une photo de MAINTENANT : il n'existe aucun historique d'état. La seule
  // trace datée est le JOURNAL. On mesure donc ce qui a été FAIT dans le mois, jamais un
  // état d'avancement reconstitué : les niveaux marqués 'Auto' et les statuts posés hors
  // validation n'écrivent rien au journal, les rejouer sous-compterait en silence.
  const _surfDe=(function(){var m={};(window.PARCELLES||[]).forEach(function(p){if(p&&p.nom)m[p.nom]=Number(p.surface)||0;});return m;})();
  const _surfExplo=(window.PARCELLES||[]).filter(function(p){return p.statut!=='Arrachee';})
    .reduce(function(s,p){return s+(Number(p.surface)||0);},0);
  const _fmtHa=function(v){return (Math.round((Number(v)||0)*100)/100).toFixed(2).replace('.',',');};
  // Périodes qui couvrent réellement ce mois (un mois peut être à cheval sur deux).
  // Repli si `_saisonForDate` manque ou si aucune période n'a de dates : période active.
  const _perMois=(function(){
    var out=[],f=window._saisonForDate;
    if(typeof f!=='function')return out;
    var y=parseInt(annee,10),mm=parseInt(mois,10);
    if(!y||!mm)return out;
    var nb=new Date(y,mm,0).getDate();
    for(var d=1;d<=nb;d++){
      var iso=moisVal+'-'+(d<10?'0'+d:''+d);
      var n='';
      try{ n=f(iso)||''; }catch(e){ n=''; }
      if(n&&out.indexOf(n)<0)out.push(n);
    }
    return out;
  })();
  const periodeTxt=_perMois.length?_perMois.join(' · '):(((typeof window.getSaisonActive==='function'?window.getSaisonActive():null)||{}).nom||'—');
  // Validations groupées : `bulkValidateP1` écrit UNE seule entrée parcelle='Domaine' pour N
  // parcelles, sans aucune trace individuelle -> hors tableau, mais signalées en note.
  // Mieux vaut une ligne absente qu'une ligne fausse à 1 parcelle et 0 ha.
  const _grpMois=travaux.filter(function(j){return j&&j.parcelle==='Domaine';}).map(function(j){
    var mm=/(\d+)\s*parcelle/.exec(j.note||'');
    return {tache:j.tache||'—',n:mm?parseInt(mm[1],10):null};
  });
  // Dernier statut ATTEINT DANS LE MOIS, par tâche+parcelle : une parcelle peut passer
  // 'En cours' puis 'Validé' (ou 'Annulé') dans le même mois. JOURNAL est en `unshift`
  // (le plus récent en tête) -> à date égale la première occurrence vue gagne, et on ne
  // remplace que sur une date STRICTEMENT supérieure.
  const _etatFin={};
  travaux.filter(function(j){return j&&j.tache&&j.parcelle&&j.parcelle!=='Domaine';}).forEach(function(j){
    var k=j.tache+'||'+j.parcelle,cur=_etatFin[k];
    if(!cur){cur=_etatFin[k]={tache:j.tache,parcelle:j.parcelle,date:j.date||'',statut:j.statut||'',nivs:[]};}
    else if((j.date||'')>cur.date){cur.date=j.date||'';cur.statut=j.statut||'';}
    (Array.isArray(j.niveaux)?j.niveaux:[]).forEach(function(n){if(n&&cur.nivs.indexOf(n)<0)cur.nivs.push(n);});
  });
  const _parTache={};
  const _parcVues={};
  Object.keys(_etatFin).forEach(function(k){
    var e=_etatFin[k];
    var t=_parTache[e.tache]||(_parTache[e.tache]={nom:e.tache,val:0,enc:0,surf:0,nivs:[]});
    var sf=(_surfDe[e.parcelle]!=null)?_surfDe[e.parcelle]:0;
    if(e.statut==='Validé'){t.val++;t.surf+=sf;_parcVues[e.parcelle]=1;}
    else if(e.statut==='En cours'){t.enc++;_parcVues[e.parcelle]=1;}
    // Une entrée 'Annulé' n'est ni un travail fait ni un travail en cours : elle n'ajoute
    // ni parcelle touchée ni ligne de tâche (sinon une tâche uniquement annulée sortirait
    // une ligne vide à 0 / 0 / 0,00 ha).
    e.nivs.forEach(function(n){if(t.nivs.indexOf(n)<0)t.nivs.push(n);});
  });
  const lignesTaches=Object.keys(_parTache).map(function(k){return _parTache[k];})
    .filter(function(t){return t.val>0||t.enc>0;})
    .sort(function(a,b){return (b.surf-a.surf)||(b.val-a.val)||a.nom.localeCompare(b.nom,'fr');});
  const surfMois=lignesTaches.reduce(function(s,t){return s+t.surf;},0);
  const nbParcMois=Object.keys(_parcVues).length;
  let tachesAvancement='<p style="color:var(--texte-doux,#7A7A6A);font-style:italic">Aucun travail enregistré au journal ce mois-ci.</p>';
  if(lignesTaches.length>0){
    const nivTxt=function(t){return t.nivs.length?' <span style="font-size:9px;color:#7A7A6A;font-weight:600">'+t.nivs.map(function(n){return String(n).toUpperCase();}).sort().join(' ')+'</span>':'';};
    tachesAvancement=`
    <div class="heures-box">
      <div class="h-item"><div class="h-val">${_fmtHa(surfMois)} ha</div><div class="h-lbl">Surface travaillée</div></div>
      <div class="h-sep"></div>
      <div class="h-item"><div class="h-val">${nbParcMois}</div><div class="h-lbl">Parcelles touchées</div></div>
      <div class="h-sep"></div>
      <div class="h-item"><div class="h-val">${lignesTaches.length}</div><div class="h-lbl">Tâches menées</div></div>
    </div>
    <table class="taches-table" style="margin-top:10px">
      <thead><tr><th>Tâche</th><th>Validées</th><th>En cours</th><th>Surface</th><th>Part du domaine</th></tr></thead>
      <tbody>
        ${lignesTaches.map(t=>{
          const pct=_surfExplo>0?Math.min(100,Math.round(t.surf/_surfExplo*100)):0;
          return `<tr>
          <td>${TEMOJI&&TEMOJI[t.nom]?TEMOJI[t.nom]+' ':''}<strong>${t.nom}</strong>${nivTxt(t)}</td>
          <td class="tc-val cv">${t.val}</td>
          <td class="tc-val co">${t.enc}</td>
          <td class="tc-val cr">${_fmtHa(t.surf)} ha</td>
          <td><div class="mini-bar"><div class="mini-fill" style="width:${pct}%"></div></div><span class="mini-pct cv">${pct}%</span></td>
        </tr>`;}).join('')}
      </tbody>
    </table>
    <p style="margin-top:8px;font-size:10px;color:#7A7A6A;font-style:italic">Ce tableau montre ce qui a été fait en ${moisNom} d'après le journal, pas l'état d'avancement du domaine aujourd'hui. La surface additionne les passages : une parcelle travaillée deux fois compte deux fois. « Part du domaine » rapporte cette surface aux ${_fmtHa(_surfExplo)} ha exploités.</p>`;
  }
  if(_grpMois.length>0){
    tachesAvancement+=`<p style="margin-top:6px;font-size:10px;color:#B85A1A">⚠ ${_grpMois.length} validation${_grpMois.length>1?'s':''} groupée${_grpMois.length>1?'s':''} ce mois (${_grpMois.map(g=>g.tache+(g.n?' — '+g.n+' parcelles':'')).join(' · ')}) : enregistrée${_grpMois.length>1?'s':''} en une seule ligne « Domaine », sans détail par parcelle. Non comptée${_grpMois.length>1?'s':''} dans le tableau.</p>`;
  }

  // ── 4. TRACTEUR RÉSUMÉ (sans détail parcelles) ──
  const sessionsMois=window.SESSIONS.filter(s=>s.date&&s.date.startsWith(moisVal)).sort((a,b)=>a.date.localeCompare(b.date));
  const amapPdf=window.ACTIVITES.reduce((m,a)=>{m[a.nom]=a;return m},{});
  const parcActives=window.PARCELLES.filter(p=>p.statut!=='Arrachee');
  let tracResume='<p style="color:var(--texte-doux,#7A7A6A);font-style:italic">Aucune session tracteur ce mois.</p>';
  if(sessionsMois.length>0){
    const lignes=sessionsMois.map(s=>{
      const _isTrait=s.type==='traitement';
      const em=_isTrait?'🧪':(amapPdf[s.activite]?.emoji||'🚜');
      const pct=s.avancement!=null?s.avancement:0;
      const statCls=s.statut==='En cours'?'trac-enc':'trac-ter';
      const fillCls=s.statut==='En cours'?'trac-fill-enc':'trac-fill';
      const skip=s.parcellesSkip||[];
      const faites=_isTrait?(s.parcelles||[]):(s.parcellesFaites||[]);
      const total=_isTrait?(s.parcelles||[]).length:parcActives.filter(p=>!skip.includes(p.nom)).length;
      return `<tr>
        <td>${em} <strong>${s.activite}</strong></td>
        <td>${fmtD(s.date)}</td>
        <td>${s.conducteur||'—'}</td>
        <td><div class="trac-bar-wrap"><div class="trac-bar" aria-hidden="true"><div class="${fillCls}" style="width:${pct}%"></div></div><span style="font-size:10px;font-weight:700;color:${s.statut==='En cours'?'#B85A1A':'#2C3E50'}">${pct}%</span></div></td>
        <td style="font-size:10px;color:var(--texte-doux,#7A7A6A)">${faites.length}/${total} parc.</td>
        <td><span class="trac-badge ${statCls}">${s.statut}</span></td>
      </tr>`;
    }).join('');
    tracResume=`<table class="trac-table">
      <thead><tr><th>Activité</th><th>Date</th><th>Conducteur</th><th>Avancement</th><th>Parcelles</th><th>Statut</th></tr></thead>
      <tbody>${lignes}</tbody>
    </table>`;
  }

  // ── 5. ANOMALIES TRACTEUR (scopé au mois : en cours + historique + fiches datées) ──
  let anomaliesHTML='';
  const anomBlocs=[];
  const _debutMois=moisVal+'-01', _finMois=moisVal+'-31';
  const _nomTrac=function(id){var t=(window.TRACTEURS_LIST||[]).find(function(x){return x.id===id||x.nom===id;});return t?t.nom:(id||'Tracteur inconnu');};
  const _overlapMois=function(depuis,retour){
    if(!depuis)return false;
    if(depuis>_finMois)return false;            // commencé après le mois
    if(retour&&retour<_debutMois)return false;  // terminé avant le mois
    return true;
  };
  // 5a. Réparations EN COURS (REPARATEUR) chevauchant le mois
  const repData=window.REPARATEUR||{};
  Object.keys(repData).forEach(function(tid){
    const rep=repData[tid];
    if(!rep||!rep.depuis||!_overlapMois(rep.depuis,null))return;
    anomBlocs.push(`<div class="anomalie-item anomalie-rep">
      <div class="an-icon">🔧</div>
      <div>
        <div class="an-title">${_nomTrac(tid)} — chez le réparateur</div>
        ${rep.motif?`<div class="an-detail">${rep.motif}</div>`:''}
        <div class="an-date">Depuis le ${fmtD(rep.depuis)}${rep.prevu_retour?' · Retour prévu : '+fmtD(rep.prevu_retour):' · Date de retour inconnue'}</div>
      </div>
    </div>`);
  });
  // 5b. Réparations TERMINÉES (REPARATEUR_HIST) chevauchant le mois
  const repHist=window.REPARATEUR_HIST||{};
  Object.keys(repHist).forEach(function(tid){
    (repHist[tid]||[]).forEach(function(r){
      if(!r||!_overlapMois(r.depuis,r.retour))return;
      anomBlocs.push(`<div class="anomalie-item anomalie-rep" style="border-left-color:#7A9A6A;background:#F2F6EE">
        <div class="an-icon">✅</div>
        <div>
          <div class="an-title">${_nomTrac(tid)} — réparation terminée</div>
          ${r.motif?`<div class="an-detail">${r.motif}</div>`:''}
          <div class="an-date">${fmtD(r.depuis)} → rentré le ${fmtD(r.retour)}</div>
        </div>
      </div>`);
    });
  });
  // 5c. Anomalies signalées dans les fiches d'entretien CE MOIS (traitées ou non)
  const entData=window.ENTRETIENS||[];
  entData.filter(function(f){return f.anomalie&&f.date&&f.date.startsWith(moisVal);}).forEach(function(f){
    const _ok=!!f.anomalie_traitee;
    anomBlocs.push(`<div class="anomalie-item ${_ok?'anomalie-rep':'anomalie-ent'}"${_ok?' style="border-left-color:#7A9A6A;background:#F2F6EE"':''}>
      <div class="an-icon">${_ok?'✅':'⚠️'}</div>
      <div>
        <div class="an-title">${_nomTrac(f.tracteurId)} — anomalie ${_ok?'traitée':'non traitée'}</div>
        <div class="an-detail">${f.anomalie}</div>
        <div class="an-date">Signalé le ${fmtD(f.date)}</div>
      </div>
    </div>`);
  });
  if(anomBlocs.length>0){
    anomaliesHTML=anomBlocs.join('');
  } else {
    anomaliesHTML='<p style="color:var(--texte-doux,#7A7A6A);font-style:italic">Aucune anomalie tracteur ce mois.</p>';
  }

  // ── PAGE 2 : DÉTAIL TRACTEUR (parcelles) ──
  let tracDetailHTML='<p style="color:var(--texte-doux,#7A7A6A);font-style:italic">Aucune session tracteur ce mois.</p>';
  if(sessionsMois.length>0){
    const mkPillList=(noms,cls)=>noms.length===0
      ?'<span style="color:var(--texte-doux,#aaa);font-style:italic;font-size:10px">—</span>'
      :noms.map(n=>`<span class="parc-pill ${cls}">${n}</span>`).join('');
    tracDetailHTML=sessionsMois.map(s=>{
      const _isTrait=s.type==='traitement';
      const em=_isTrait?'🧪':(amapPdf[s.activite]?.emoji||'🚜');
      const pct=s.avancement!=null?s.avancement:0;
      const skip=s.parcellesSkip||[];
      const faites=_isTrait?(s.parcelles||[]):(s.parcellesFaites||[]);
      const faitesNoms=faites.map(function(x){return typeof x==='string'?x:(x&&x.nom)||'';}).filter(Boolean);
      const parcRestantes=_isTrait?[]:parcActives.filter(p=>!faitesNoms.includes(p.nom)&&!skip.includes(p.nom)).map(p=>p.nom).sort((a,b)=>a.localeCompare(b,'fr'));
      const faitesTri=[...faitesNoms].sort((a,b)=>a.localeCompare(b,'fr'));
      const skipTri=[...skip].sort((a,b)=>a.localeCompare(b,'fr'));
      const total=_isTrait?faitesTri.length:parcActives.filter(p=>!skip.includes(p.nom)).length;
      return `<div class="trac-session-block">
        <div class="trac-session-head">${em} ${s.activite} — ${fmtD(s.date)} · ${s.conducteur||'—'} · ${pct}%</div>
        <div class="trac-detail-block">
          <div class="trac-detail-col">
            <div class="trac-detail-label trac-det-ok">${_isTrait?`🧪 Parcelles traitées (${faitesTri.length})`:`✓ Travaillées (${faitesTri.length}/${total})`}</div>
            <div class="trac-pills">${mkPillList(faitesTri,'pill-ok')}</div>
          </div>
          ${parcRestantes.length>0?`<div class="trac-detail-col">
            <div class="trac-detail-label trac-det-rest">⏳ Restantes (${parcRestantes.length})</div>
            <div class="trac-pills">${mkPillList(parcRestantes,'pill-rest')}</div>
          </div>`:''}
          ${skipTri.length>0?`<div class="trac-detail-col">
            <div class="trac-detail-label trac-det-skip">⊘ Désactivées (${skipTri.length})</div>
            <div class="trac-pills">${mkPillList(skipTri,'pill-skip')}</div>
          </div>`:''}
        </div>
        ${s.note?`<div style="margin-top:8px;font-size:10px;color:var(--texte-doux,#7A7A6A);font-style:italic">📝 ${s.note}</div>`:''}
      </div>`;
    }).join('');
  }

  const html=`<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Rapport Ma Vigne — ${moisNom}</title>
<link rel="stylesheet" href="/fonts/fonts.css">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Outfit',system-ui,-apple-system,sans-serif;color:#1A1A14;background:white;font-size:12px;}
  /* ── COVER ── */
  .cover{background:#1E3A12;color:white;padding:32px 40px;display:flex;justify-content:space-between;align-items:flex-end;}
  .cover-left{}
  .cover-brand{font-size:9px;letter-spacing:3px;text-transform:uppercase;opacity:0.5;margin-bottom:6px;}
  .cover-title{font-size:28px;font-weight:700;margin-bottom:2px;}
  .cover-sub{opacity:0.5;font-size:11px;}
  .cover-right{text-align:right;}
  .cover-date{opacity:0.5;font-size:10px;}
  .cover-domaine{opacity:0.7;font-size:11px;font-weight:600;margin-top:2px;}
  /* ── STATS ── */
  .stats-row{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:2px solid #EAF3E2;}
  .stat{padding:14px 20px;border-right:1px solid #EAF3E2;}
  .stat:last-child{border-right:none;}
  .stat-val{font-size:26px;font-weight:700;color:#1E3A12;}
  .stat-lbl{font-size:9px;color:#7A7A6A;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;}
  /* ── SECTIONS ── */
  .section{padding:18px 24px;border-bottom:1px solid #EFEDE8;}
  .section:last-of-type{border-bottom:none;}
  .section-title{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#7A7A6A;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #EFEDE8;}
  /* ── MÉTÉO ── */
  .meteo-resume{background:#E8F0FA;border-radius:10px;padding:14px 16px;}
  .meteo-cols{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:8px;}
  .meteo-col{text-align:center;}
  .mc-val{font-size:15px;font-weight:700;color:#1A4A7A;}
  .mc-lbl{font-size:9px;color:#7A7A6A;margin-top:2px;text-transform:uppercase;}
  .mc-cond{font-size:10px;color:#4A4A3A;font-style:italic;}
  /* ── HEURES ── */
  .heures-box{display:flex;border:1px solid #EFEDE8;border-radius:10px;overflow:hidden;}
  .h-item{flex:1;padding:12px 16px;text-align:center;background:white;}
  .h-sep{width:1px;background:#EFEDE8;flex-shrink:0;}
  .h-val{font-size:22px;font-weight:700;color:#1A1A14;line-height:1;}
  .h-lbl{font-size:9px;color:#7A7A6A;margin-top:3px;text-transform:uppercase;letter-spacing:0.4px;}
  .commentaire-box{background:#F8F7F3;border-left:3px solid #3D6B27;border-radius:0 8px 8px 0;padding:12px 14px;font-size:11px;line-height:1.6;color:#1A1A14;font-style:italic;white-space:pre-wrap;}
  /* ── AVANCEMENT ── */
  .avancement-global{display:flex;align-items:center;gap:14px;background:#F5F5F0;border-radius:10px;padding:12px 16px;margin-bottom:12px;}
  .ag-left,.ag-right{text-align:center;min-width:48px;}
  .ag-pct{font-size:20px;font-weight:700;color:#1E3A12;}
  .ag-lbl{font-size:9px;color:#7A7A6A;text-transform:uppercase;margin-top:2px;}
  .ag-bar-wrap{flex:1;display:flex;flex-direction:column;gap:4px;}
  .ag-bar{height:8px;background:#EFEDE8;border-radius:4px;overflow:hidden;}
  .ag-fill{height:100%;background:#3D6B27;border-radius:4px;}
  .ag-fill-reste{height:100%;background:#D4A56A;border-radius:4px;}
  .taches-table{width:100%;border-collapse:collapse;}
  .taches-table th{font-size:9px;font-weight:700;text-transform:uppercase;color:#7A7A6A;padding:5px 8px;text-align:left;border-bottom:2px solid #EFEDE8;}
  .taches-table td{padding:6px 8px;border-bottom:1px solid #F5F5F0;font-size:11px;vertical-align:middle;}
  .tc-val{text-align:center;font-weight:600;}
  .cv{color:#1E3A12;}.co{color:#B85A1A;}.cr{color:#A0291E;}
  .mini-bar{display:inline-block;width:56px;height:5px;background:#EFEDE8;border-radius:3px;overflow:hidden;vertical-align:middle;margin-right:4px;}
  .mini-fill{height:100%;background:#3D6B27;border-radius:3px;}
  .mini-pct{font-size:10px;font-weight:700;vertical-align:middle;}
  /* ── TRACTEUR RÉSUMÉ ── */
  .trac-table{width:100%;border-collapse:collapse;}
  .trac-table th{font-size:9px;font-weight:700;text-transform:uppercase;color:#7A7A6A;padding:5px 8px;text-align:left;border-bottom:2px solid #ECF0F4;}
  .trac-table td{padding:7px 8px;border-bottom:1px solid #F5F5F0;font-size:11px;vertical-align:middle;}
  .trac-badge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:9px;font-weight:700;}
  .trac-ter{background:#ECF0F4;color:#2C3E50;}.trac-enc{background:#FBF0E6;color:#B85A1A;}
  .trac-bar-wrap{display:flex;align-items:center;gap:5px;}
  .trac-bar{width:70px;height:5px;background:#EFEDE8;border-radius:3px;overflow:hidden;}
  .trac-fill{height:100%;background:#2C3E50;}.trac-fill-enc{height:100%;background:#B85A1A;}
  /* ── ANOMALIES ── */
  .anomalie-item{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:8px;margin-bottom:8px;}
  .anomalie-item:last-child{margin-bottom:0;}
  .anomalie-rep{background:#FEF4F2;border-left:3px solid #C0392B;}
  .anomalie-ent{background:#FEF8ED;border-left:3px solid #E67E22;}
  .an-icon{font-size:15px;flex-shrink:0;margin-top:1px;}
  .an-title{font-size:12px;font-weight:700;color:#1A1A14;}
  .an-detail{font-size:10px;color:#555;margin-top:2px;}
  .an-date{font-size:9px;color:#999;margin-top:3px;}
  /* ── PAGE 2 ── */
  .page2{page-break-before:always;}
  .page2-header{background:#1E3A12;color:white;padding:14px 24px;font-size:9px;letter-spacing:2px;text-transform:uppercase;opacity:1;}
  .page2-header span{opacity:0.6;}
  /* Détail journées */
  .day-block{margin-bottom:14px;}
  .day-head{font-size:10px;font-weight:700;color:#1E3A12;background:#EAF3E2;padding:4px 10px;border-radius:5px;margin-bottom:5px;}
  table{width:100%;border-collapse:collapse;}
  td{padding:5px 8px;border-bottom:1px solid #EFEDE8;font-size:10px;}
  td:first-child{width:28%;font-weight:600;}
  .badge{display:inline-block;padding:2px 6px;border-radius:5px;font-size:9px;font-weight:700;}
  .bv{background:#EAF3E2;color:#1E3A12;}.be{background:#FBF0E6;color:#B85A1A;}
  .meteo-row td{color:#9A9A8A!important;font-style:italic;font-size:9px!important;}
  /* Détail tracteur page 2 */
  .trac-session-block{background:#F8F8F5;border-radius:8px;padding:12px 14px;margin-bottom:10px;}
  .trac-session-block:last-child{margin-bottom:0;}
  .trac-session-head{font-size:11px;font-weight:700;color:#1A1A14;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #EBEBEB;}
  .trac-detail-block{display:flex;flex-wrap:wrap;gap:12px;}
  .trac-detail-col{flex:1;min-width:150px;}
  .trac-detail-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;padding:2px 6px;border-radius:4px;display:inline-block;}
  .trac-det-ok{background:#EAF3E2;color:#1E3A12;}
  .trac-det-rest{background:#FBF0E6;color:#8B4A1A;}
  .trac-det-skip{background:#F5E8E5;color:#7A2A1A;}
  .trac-pills{display:flex;flex-wrap:wrap;gap:3px;}
  .parc-pill{display:inline-block;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:600;}
  .pill-ok{background:#EAF3E2;color:#1E3A12;}
  .pill-rest{background:#FBF0E6;color:#8B4A1A;}
  .pill-skip{background:#F5E8E5;color:#7A2A1A;text-decoration:line-through;opacity:0.8;}
  /* ── FOOTER ── */
  .footer{border-top:1px solid #EFEDE8;padding:10px 24px;font-size:9px;color:#7A7A6A;display:flex;justify-content:space-between;}
  /* ── BADGE MULTI-JOURS ── */
  .mj-badge{display:inline-block;padding:1px 5px;border-radius:4px;font-size:8px;font-weight:700;background:#E8EFF8;color:#1A4A7A;margin-left:5px;vertical-align:middle;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.page2{page-break-before:always;}}
</style></head><body>

<div class="cover">
  <div class="cover-left">
    <div class="cover-brand">Ma Vigne · Rapport mensuel</div>
    <div class="cover-title">${moisNom}</div>
    <div class="cover-sub">${periodeTxt} · ${domaine}</div>
  </div>
  <div class="cover-right">
    <div class="cover-date">Généré le ${new Date().toLocaleDateString('fr-FR')}</div>
    <div class="cover-domaine">Confidentiel — usage interne</div>
  </div>
</div>

<div class="stats-row">
  <div class="stat"><div class="stat-val">${nbTravaux}</div><div class="stat-lbl">Travaux</div></div>
  <div class="stat"><div class="stat-val">${nbVal}</div><div class="stat-lbl">Validés</div></div>
  <div class="stat"><div class="stat-val">${parcellesTouchees.length}</div><div class="stat-lbl">Parcelles</div></div>
  <div class="stat"><div class="stat-val">${heuresTotales?heuresTotales+'h':'—'}</div><div class="stat-lbl">Heures</div></div>
</div>

<!-- ── 1. MÉTÉO ── -->
<div class="section">
  <div class="section-title">🌤 Météo du mois — ${moisNom}</div>
  ${meteoResume}
</div>

<!-- ── 2. HEURES (juste après météo) ── -->
<div class="section">
  <div class="section-title">⏱ Heures de travail — ${moisNom}</div>
  ${heuresSection}
</div>

<!-- ── 3. AVANCEMENT DES TÂCHES ── -->
<div class="section">
  <div class="section-title">📊 Travaux réalisés — ${moisNom}</div>
  ${tachesAvancement}
</div>

<!-- ── 4. TRACTEUR RÉSUMÉ (sans détail parcelles) ── -->
<div class="section">
  <div class="section-title">🚜 Activité tracteur — ${moisNom}</div>
  ${tracResume}
</div>

<!-- ── 5. ANOMALIES TRACTEUR ── -->
<div class="section">
  <div class="section-title">⚠️ Anomalies tracteur</div>
  ${anomaliesHTML}
</div>

<div class="footer">
  <span>${domaine} · ${moisNom}</span>
  <span>Page 1 / 2</span>
</div>

<!-- ══════════════════ PAGE 2 ══════════════════ -->
<div class="page2">

<div class="page2-header">${domaine} · ${moisNom} <span>— Détails</span></div>

<!-- ── DÉTAIL DES window.TRAVAUX PAR JOURNÉE ── -->
<div class="section">
  <div class="section-title">📅 Détail des travaux par journée</div>
  ${datesTri.length===0?'<p style="color:var(--texte-doux,#7A7A6A);font-style:italic">Aucun travail enregistré ce mois.</p>':
    datesTri.map(date=>{
      const items=grouped[date].sort((a,b)=>(a.meteo?1:-1));
      return `<div class="day-block">
        <div class="day-head">${fmtD(date)}</div>
        <table>${items.map(r=>{
          if(r.meteo)return`<tr class="meteo-row"><td colspan="4">🌤 ${r.emoji||''} ${r.temp}°C · ${r.desc} · Vent ${r.wind} km/h</td></tr>`;
          const sb=r.statut==='Validé'?'bv':'be';
          const affQui=r.equipe?'Équipe 👥':(r.qui||'—');
          const _mjK=r.tache+'||'+r.parcelle;const _mjDts=_mjDateMap[_mjK];
          const _mjBadge=_mjDts?`<span class="mj-badge">J${_mjDts.indexOf(r.date)+1}/${_mjDts.length}</span>`:'';
          return`<tr><td>${TEMOJI[r.tache]||'📋'} ${r.tache}${_mjBadge}</td><td>${r.parcelle}</td><td>${affQui}</td><td><span class="badge ${sb}">${r.statut}</span></td></tr>`;
        }).join('')}</table>
      </div>`;
    }).join('')
  }
</div>

<!-- ── TÂCHES ÉTALÉES SUR PLUSIEURS JOURS ── -->
<div class="section">
  <div class="section-title">🗓 Tâches étalées sur plusieurs jours</div>
  ${tachesMultiJours.length===0
    ?'<p style="color:var(--texte-doux,#7A7A6A);font-style:italic">Toutes les tâches de ce mois ont été réalisées en une seule journée.</p>'
    :`<table class="taches-table">
      <thead><tr><th>Tâche</th><th>Parcelle</th><th>Début</th><th>Fin</th><th style="text-align:center">Jours</th><th>Dernier statut</th></tr></thead>
      <tbody>${tachesMultiJours.map(t=>`<tr>
        <td>${TEMOJI&&TEMOJI[t.tache]?TEMOJI[t.tache]+' ':''}<strong>${t.tache}</strong></td>
        <td>${t.parcelle}</td>
        <td>${fmtD(t.dateDebut)}</td>
        <td>${fmtD(t.dateFin)}</td>
        <td style="text-align:center;font-weight:700;color:var(--bleu,#1A4A7A)">${t.nbJours}</td>
        <td><span class="badge ${t.statut==='Validé'?'bv':'be'}">${t.statut}</span></td>
      </tr>`).join('')}</tbody>
    </table>`
  }
</div>

<!-- ── DÉTAIL TRACTEUR (parcelles session par session) ── -->
<div class="section">
  <div class="section-title">🚜 Détail tracteur — parcelles par session</div>
  ${tracDetailHTML}
</div>

<div class="footer">
  <span>${domaine} · ${moisNom}</span>
  <span>Page 2 / 2</span>
</div>

</div>
</body></html>`;

  const win=window.open('','_blank','width=900,height=700');
  win.document.write(html);
  win.document.close();
  win.onload=()=>{win.focus();win.print();};
  showExportFeedback(`✅ Rapport ${moisNom} généré !`);
}


// ════ EXPORT PDF REGISTRE PHYTO ════
function exportPDFPhyto(){
  if(!isAdmin())return;
  const saison=window.getSaisonActive();
  const annee=saison.nom||new Date().getFullYear();
  const today=new Date();
  const moisNoms=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const fmtD=d=>{if(!d)return'—';const a=d.split('-');return`${parseInt(a[2])} ${moisNoms[parseInt(a[1])-1]} ${a[0]}`;};
  const R=t=>window._phResolve?window._phResolve(t):{type:t.type||'—',amm:t.amm||'',dar:(t.dar!=null?t.dar:null),drae:t.drae||0,znt:(t.znt!=null?t.znt:null),sub:t.sub||'',dose:t.dose||''};
  const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const actives=(window.PARCELLES||[]).filter(p=>p.statut!=='Arrachee');
  const totAct=actives.length;
  const haTot=actives.reduce((s,p)=>s+(p.surface||0),0);
  const parcTxt=t=>{const a=t.parcelles;if(typeof a==='string')return a||'Domaine entier';if(!a||!a.length)return 'Domaine entier';if(totAct&&a.length>=totAct)return `Domaine entier (${a.length})`;if(a.length<=3)return a.join(', ');return a.slice(0,3).join(', ')+` +${a.length-3}`;};

  const data=[...(window.TRAITEMENTS||[])].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const nbTotal=data.length;
  const cuivreItems=data.filter(t=>R(t).type==='Cuivre');
  const soufreItems=data.filter(t=>R(t).type==='Soufre');
  const nbCuivre=cuivreItems.length, nbSoufre=soufreItems.length;
  const darActifs=data.filter(t=>{const m=R(t);if(m.dar==null||m.dar<=0)return false;return (m.dar-Math.floor((today-new Date(t.date))/86400000))>0;}).length;

  const TYPECOL={'Cuivre':'#1A4A7A','Soufre':'#7D6608','Fongicide':'#4A2060','Insecticide':'#A0291E','Herbicide':'#1E3A12','Biocontrôle':'#2C6E49','—':'#7A7A6A'};
  const TYPEBG ={'Cuivre':'#e6eef7','Soufre':'#f7f1d9','Fongicide':'#efe6f7','Insecticide':'#f7e2e0','Herbicide':'#e3eddd','Biocontrôle':'#dff0e6','—':'#eee'};

  const lignes=data.map((t,i)=>{
    const m=R(t);
    const darR=(m.dar!=null&&m.dar>0)?Math.max(0,m.dar-Math.floor((today-new Date(t.date))/86400000)):null;
    const darCell=(m.dar!=null&&m.dar>0)?(darR>0?`<span class="dar-enc">${darR}j restants</span>`:'<span class="dar-ok">✓ Libre</span>'):'<span class="muted">—</span>';
    const tc=TYPECOL[m.type]||'#4A4A3A', tb=TYPEBG[m.type]||'#eee';
    const bits=[];
    if(t.heureDebut)bits.push(`🕐 ${esc(t.heureDebut)}–${esc(t.heureFin||'?')}`);
    if(m.drae>0)bits.push(`DRE ${m.drae}h`);
    if(m.znt!=null)bits.push(`ZNT ${m.znt}m`);
    if(t.modeAb===true)bits.push('🌿 AB');
    if(t.dreAnticipe)bits.push(`<b>${esc(t.dreAnticipe)}</b>`);
    const subLine=bits.length?`<div class="sub-line">${bits.join(' · ')}</div>`:'';
    return `<tr>
      <td class="c-num">${i+1}</td>
      <td>${fmtD(t.date)}</td>
      <td><div class="pname">${esc(t.produit||'—')}</div>${m.amm?`<div class="pamm">AMM ${esc(m.amm)}</div>`:''}${subLine}</td>
      <td>${m.sub?esc(m.sub):'<span class="muted">—</span>'}</td>
      <td><span class="badge" style="background:${tb};color:${tc}">${esc(m.type)}</span></td>
      <td>${m.dose?esc(m.dose):'<span class="muted">—</span>'}</td>
      <td>${esc(parcTxt(t))}</td>
      <td>${t.stade?esc(t.stade):'<span class="muted">—</span>'}</td>
      <td style="text-align:center">${m.dar!=null?m.dar:'<span class="muted">—</span>'}</td>
      <td>${darCell}</td>
      <td>${esc(t.conducteur||t.operateur||'—')}</td>
      <td class="muted">${esc(t.note||'')}</td>
    </tr>`;
  }).join('');

  const recapItems=items=>items.length?(items.map(t=>`<div class="rb-item"><span>${fmtD(t.date)} · ${esc(t.produit)}</span><span class="rb-val">${esc(R(t).dose||'—')}</span></div>`).join('')):'<div class="rb-item"><span class="muted" style="font-style:italic">Aucun traitement</span></div>';

  const html=`<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Registre Phytosanitaire — ${annee}</title>
<link rel="stylesheet" href="/fonts/fonts.css">
<style>
  @page{size:A4 landscape;margin:9mm;}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Outfit',system-ui,-apple-system,sans-serif;color:#1A1A14;background:white;font-size:11px;}
  .cover{background:#2D0B45;color:white;padding:24px 30px 20px;position:relative;display:flex;align-items:flex-end;justify-content:space-between;}
  .cover-l{padding-top:30px;}
  .cover-pic{font-size:28px;position:absolute;left:30px;top:20px;opacity:.9;}
  .cover-brand{font-size:9px;letter-spacing:3px;text-transform:uppercase;opacity:0.45;margin-bottom:5px;}
  .cover-title{font-size:25px;font-weight:700;letter-spacing:-0.5px;}
  .cover-sub{opacity:0.6;font-size:12px;margin-top:3px;}
  .cover-meta{text-align:right;opacity:0.5;font-size:10px;line-height:1.6;}
  .mention{background:#F3EEF8;border-left:3px solid #4A2060;padding:9px 16px;font-size:10px;color:#4A2060;line-height:1.55;}
  .stats-row{display:grid;grid-template-columns:repeat(6,1fr);border-bottom:2px solid #F0EAF8;}
  .stat{padding:11px 16px;border-right:1px solid #F0EAF8;}
  .stat:last-child{border-right:none;}
  .stat-val{font-size:22px;font-weight:700;color:#2D0B45;}
  .stat-lbl{font-size:8.5px;color:#7A7A6A;text-transform:uppercase;letter-spacing:0.4px;margin-top:1px;}
  .section{padding:14px 22px 18px;}
  .section-title{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#7A7A6A;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #F0EAF8;}
  table.reg{width:100%;border-collapse:collapse;table-layout:fixed;}
  table.reg thead tr{background:#2D0B45;color:white;}
  table.reg th{padding:6px 7px;font-size:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;text-align:left;vertical-align:bottom;}
  table.reg td{padding:6px 7px;border-bottom:1px solid #F5F0FA;vertical-align:top;font-size:9.5px;word-wrap:break-word;}
  table.reg tr:nth-child(even) td{background:#FAF7FC;}
  .c-num{color:#C0B0D0;font-size:8.5px;text-align:center;}
  .pname{font-weight:700;font-size:10px;}
  .pamm{font-family:monospace;font-size:8.5px;color:#6A6A7A;margin-top:1px;}
  .sub-line{font-size:8.5px;color:#7A6A8A;margin-top:3px;line-height:1.4;}
  .sub-line b{color:#4A2060;}
  .badge{display:inline-block;padding:1px 6px;border-radius:5px;font-size:8px;font-weight:700;white-space:nowrap;}
  .muted{color:#9A9AAa;}
  .dar-enc{background:#FBF0E6;color:#B85A1A;padding:2px 6px;border-radius:5px;font-size:8.5px;font-weight:700;white-space:nowrap;}
  .dar-ok{background:#EAF3E2;color:#1E3A12;padding:2px 6px;border-radius:5px;font-size:8.5px;font-weight:700;white-space:nowrap;}
  .recap-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
  .recap-box{background:#F5F0FA;border-radius:10px;padding:12px 14px;}
  .rb-titre{font-size:10px;font-weight:700;color:#4A2060;margin-bottom:7px;}
  .rb-item{display:flex;justify-content:space-between;padding:3px 0;font-size:10px;border-bottom:1px solid #EAE4F0;}
  .rb-item:last-child{border-bottom:none;font-weight:700;}
  .rb-val{font-weight:600;color:#2D0B45;}
  .signature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:10px;}
  .sig-box{border:1px solid #E0D8EC;border-radius:8px;padding:12px;height:72px;display:flex;flex-direction:column;justify-content:flex-end;}
  .sig-lbl{font-size:8.5px;color:#7A7A6A;text-transform:uppercase;letter-spacing:0.4px;}
  .footer{border-top:1px solid #F0EAF8;padding:9px 22px;font-size:8px;color:#7A7A6A;display:flex;justify-content:space-between;margin-top:8px;}
  @media print{
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .section{page-break-inside:avoid;}
    table.reg tr{page-break-inside:avoid;}
  }
</style></head><body>

<div class="cover">
  <div class="cover-l"><div class="cover-pic">🧪</div><div class="cover-brand">Ma Vigne · Registre réglementaire</div><div class="cover-title">Registre Phytosanitaire</div><div class="cover-sub">${annee} · ${esc(window.DOMAINE_NOM||'Domaine')} · ${haTot.toFixed(2)} ha</div></div>
  <div class="cover-meta">Généré le ${today.toLocaleDateString('fr-FR')}<br>Document confidentiel</div>
</div>

<div class="mention">
  📋 <strong>Obligation réglementaire</strong> — Registre établi conformément à l'article L.254-3-1 du Code rural et de la pêche maritime. Il consigne l'ensemble des utilisations de produits phytopharmaceutiques sur le domaine pour la campagne ${annee}. À conserver 5 ans minimum.
</div>

<div class="stats-row">
  <div class="stat"><div class="stat-val">${nbTotal}</div><div class="stat-lbl">Traitements</div></div>
  <div class="stat"><div class="stat-val" style="color:var(--bleu,#1A4A7A)">${nbCuivre}</div><div class="stat-lbl">Cuivre</div></div>
  <div class="stat"><div class="stat-val" style="color:var(--tag-amber-tx,#7D6608)">${nbSoufre}</div><div class="stat-lbl">Soufre</div></div>
  <div class="stat"><div class="stat-val" style="color:${darActifs>0?'#A0291E':'#1E3A12'}">${darActifs}</div><div class="stat-lbl">DAR actifs</div></div>
  <div class="stat"><div class="stat-val">${totAct}</div><div class="stat-lbl">Parcelles</div></div>
  <div class="stat"><div class="stat-val">5 ans</div><div class="stat-lbl">Conservation</div></div>
</div>

<div class="section">
  <div class="section-title">🌿 Ensemble des traitements — Campagne ${annee}</div>
  ${data.length===0?'<p style="color:var(--texte-doux,#7A7A6A);font-style:italic;padding:12px 0">Aucun traitement enregistré pour cette saison.</p>':`
  <table class="reg">
    <colgroup><col style="width:3%"><col style="width:7%"><col style="width:17%"><col style="width:12%"><col style="width:7%"><col style="width:8%"><col style="width:12%"><col style="width:11%"><col style="width:5%"><col style="width:7%"><col style="width:7%"><col style="width:11%"></colgroup>
    <thead><tr>
      <th>#</th><th>Date</th><th>Produit · AMM</th><th>Substance active</th><th>Type</th><th>Dose</th><th>Parcelles</th><th>Stade / cible</th><th>DAR j</th><th>Délai récolte</th><th>Conducteur</th><th>Observations</th>
    </tr></thead>
    <tbody>${lignes}</tbody>
  </table>`}
</div>

<div class="section">
  <div class="section-title">📊 Récapitulatif par type de produit</div>
  <div class="recap-grid">
    <div class="recap-box"><div class="rb-titre">🔵 Cuivre</div>${recapItems(cuivreItems)}<div class="rb-item"><span>Total</span><span class="rb-val">${nbCuivre} application${nbCuivre>1?'s':''}</span></div></div>
    <div class="recap-box"><div class="rb-titre">🟡 Soufre</div>${recapItems(soufreItems)}<div class="rb-item"><span>Total</span><span class="rb-val">${nbSoufre} application${nbSoufre>1?'s':''}</span></div></div>
  </div>
</div>

${_cuivrePdfSection()}

<div class="section">
  <div class="section-title">✍️ Certification et signatures</div>
  <p style="font-size:10px;color:#4A4A3A;margin-bottom:10px;line-height:1.55">Je soussigné(e), certifie l'exactitude des informations portées dans ce registre phytosanitaire pour la campagne ${annee}.</p>
  <div class="signature-grid">
    <div class="sig-box"><div class="sig-lbl">Responsable du domaine · Date</div></div>
    <div class="sig-box"><div class="sig-lbl">Cachet du domaine</div></div>
    <div class="sig-box"><div class="sig-lbl">Conseiller phyto (si applicable)</div></div>
  </div>
</div>

<div class="footer">
  <span>Ma Vigne · Registre Phytosanitaire · Campagne ${annee}</span>
  <span>Données E-Phy indicatives, non opposables — Conservation obligatoire 5 ans</span>
</div>

</body></html>`;

  const win=window.open('','_blank','width=1100,height=750');
  win.document.write(html);
  win.document.close();
  win.onload=()=>{win.focus();win.print();};
  showExportFeedback(`✅ Registre phyto ${annee} généré — ${nbTotal} traitement${nbTotal>1?'s':''} !`);
}

// ════ PDF RAPPORT DE SAISON ════
function exportPDFRapportSaison(){ if(window.openRapportSaison){window.openRapportSaison();} }

function openEditDomNom(){
  if(!isAdmin()){showToast('Réservé aux administrateurs','#C0392B');return;}
  document.getElementById('edn-input').value=window.DOMAINE_NOM;
  // Identité de l'exploitation — portée sur le registre phyto électronique.
  var sirEl0=document.getElementById('edn-siret'), bioEl0=document.getElementById('edn-bio');
  if(sirEl0) sirEl0.value=((window.CONFIG||{}).siret||'');
  if(bioEl0) bioEl0.checked=!!((window.CONFIG||{}).bio);
  var c=window.CONFIG||{};
  var latEl=document.getElementById('edn-lat'), lonEl=document.getElementById('edn-lon');
  if(latEl&&lonEl){
    var cLat=parseFloat(c.lat), cLon=parseFloat(c.lon);
    if(c.geo_manual && isFinite(cLat) && isFinite(cLon)){ latEl.value=cLat; lonEl.value=cLon; }
    else { latEl.value=''; lonEl.value=''; }
    var used = window.getDomaineGeo ? window.getDomaineGeo() : null;
    if(used){ latEl.placeholder='Auto : '+used.lat.toFixed(4); lonEl.placeholder='Auto : '+used.lng.toFixed(4); }
  }
  window.openOv('ovEditDomNom');
  setTimeout(function(){document.getElementById('edn-input').focus();},300);
}
function saveEditDomNom(){
  var val=document.getElementById('edn-input').value.trim();
  if(!val){showToast('Le nom ne peut pas être vide','#C0392B');return;}
  if(!window.CONFIG)window.CONFIG={};
  // Coordonnées domaine (optionnelles) — override manuel de la météo
  var latEl=document.getElementById('edn-lat'), lonEl=document.getElementById('edn-lon');
  var latRaw=latEl?latEl.value.trim():'', lonRaw=lonEl?lonEl.value.trim():'';
  if(latRaw==='' && lonRaw===''){
    // Champs vidés → retour au mode automatique (centroïde des parcelles)
    window.CONFIG.geo_manual=false;
  } else {
    var la=parseFloat(latRaw.replace(',','.')), ln=parseFloat(lonRaw.replace(',','.'));
    if(!isFinite(la) || !isFinite(ln) || la < -90 || la > 90 || ln < -180 || ln > 180){
      showToast('Coordonnées invalides (lat -90..90, lon -180..180)','#C0392B');return;
    }
    window.CONFIG.lat=la; window.CONFIG.lon=ln; window.CONFIG.geo_manual=true;
  }
  // SIRET de l'exploitation + conduite biologique : exigés sur chaque ligne du registre
  // phytosanitaire électronique (arrêté du 24 décembre 2025, annexe II).
  var sirEl=document.getElementById('edn-siret');
  if(sirEl){
    var sir=String(sirEl.value||'').replace(/[^0-9]/g,'');
    if(sir && sir.length!==14){ showToast('Le SIRET doit compter 14 chiffres','#C0392B'); if(sirEl.focus)sirEl.focus(); return; }
    window.CONFIG.siret=sir;
  }
  var bioEl=document.getElementById('edn-bio');
  if(bioEl) window.CONFIG.bio=!!bioEl.checked;
  window.DOMAINE_NOM=val;
  window.CONFIG.domaine_nom=val;
  window.saveData('config');
  applyDomNom();
  window.closeOv(null,'ovEditDomNom');
  renderReglages();
  showToast('Domaine mis à jour ✓','#3D6B27');
}
function ednUseCentroide(){
  var ctr = window.getCentroideParcelles ? window.getCentroideParcelles() : null;
  if(!ctr){ showToast('Aucune parcelle géolocalisée (importez un KML)','#C0392B'); return; }
  var latEl=document.getElementById('edn-lat'), lonEl=document.getElementById('edn-lon');
  if(latEl) latEl.value=ctr.lat.toFixed(5);
  if(lonEl) lonEl.value=ctr.lng.toFixed(5);
  showToast('Centré sur vos parcelles ✓','#3D6B27');
}
function copyInviteLink() {
  var tenant = localStorage.getItem('mavigne_tenant') || window.TENANT_ID;
  if(!tenant) { showToast('Identifiant domaine introuvable','#A0291E'); return; }
  var base = window.location.origin + window.location.pathname;
  var link = base + '?tenant=' + tenant;
  if(navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(function(){
      showToast('Lien copié ✓','#3D6B27');
      var sub = document.getElementById('invite-link-sub');
      if(sub){ sub.textContent=link; setTimeout(function(){ sub.textContent='Partager avec un nouveau membre'; },4000); }
    }).catch(function(){ _fallbackCopyInvite(link); });
  } else { _fallbackCopyInvite(link); }
}
function _fallbackCopyInvite(link) {
  var ta=document.createElement('textarea');
  ta.value=link;ta.style.position='fixed';ta.style.opacity='0';
  document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');showToast('Lien copié ✓','#3D6B27');}
  catch(e){showToast(link,'#1A4A7A');}
  document.body.removeChild(ta);
}
function applyDomNom(){
  // Badge Réglages
  var dnEl=document.getElementById('dom-badge-nom');
  if(dnEl)dnEl.textContent=window.DOMAINE_NOM;
  // Ligne édition Réglages
  var dvEl=document.getElementById('dom-nom-val');
  if(dvEl)dvEl.textContent=window.DOMAINE_NOM;
}
var _esEchTasks=[];
var _esTachesSel=new Set();
function _esBuildTaches(){
  var host=document.getElementById('es-taches-pick'); if(!host)return;
  host.innerHTML=_nsRefTaches().map(function(c){
    var on=_esTachesSel.has(c.nom);
    var info = c.trous?'tarière'
      : (c.type==='niveaux'&&c.niveaux)?(c.niveaux.reduce(function(s,n){return s+n.hha;},0)+' h/ha')
      : (c.type==='passages'&&c.passagesHha)?(c.passagesHha.join('/')+' h/ha')
      : (c.hha?(c.hha+' h/ha'):'temps réel');
    return '<div class="ns-tpick'+(on?' on':'')+'" onclick="_esToggleTache(\''+_escAttr(c.nom)+'\')">'
      +'<span class="e">'+(TEMOJI[c.nom]||'🌿')+'</span>'
      +'<span class="n">'+_escHtml(c.label||c.nom)+'</span>'
      +'<span class="h">'+info+'</span>'
      +'<span class="ck">'+(on?'✓':'')+'</span></div>';
  }).join('');
  var cnt=document.getElementById('es-taches-count');
  if(cnt)cnt.textContent=_esTachesSel.size+' sélectionnée'+(_esTachesSel.size>1?'s':'');
}
function _esToggleTache(nom){
  if(_esTachesSel.has(nom))_esTachesSel.delete(nom); else _esTachesSel.add(nom);
  _esBuildTaches();
}

function openEditSaison(nom){
  if(!isAdmin())return;
  var s=window.SAISONS.find(function(x){return x.nom===nom;});
  if(!s)return;
  document.getElementById('es-saison-nom').value=nom;
  var _nl=document.getElementById('es-saison-nomlibre'); if(_nl)_nl.value=nom;
  document.getElementById('es-saison-periode').value=s.periode||'';
  if(document.getElementById('es-saison-debut'))document.getElementById('es-saison-debut').value=s.debut||'';
  if(document.getElementById('es-saison-fin'))document.getElementById('es-saison-fin').value=s.fin||'';
  _esTachesSel=new Set(Array.isArray(s.taches)?s.taches:[]);
  _esBuildTaches();
  // Dates de travaux estimees par tache (par INSTANCE de periode) -> preparation du pilotage.
  var ech=(s.echeances&&typeof s.echeances==='object'&&!Array.isArray(s.echeances))?s.echeances:{};
  _esEchTasks=Array.from(_esTachesSel);
  var host=document.getElementById('es-echeances');
  if(host){
    if(!_esEchTasks.length){ host.innerHTML='<div style="font-size:12.5px;color:var(--texte-doux);padding:4px 0">Aucune t\u00e2che pour cette saison \u2014 assignez-en dans R\u00e9glages \u203a T\u00e2ches.</div>'; }
    else host.innerHTML=_esEchTasks.map(function(tn,i){
      var e=ech[tn]||{}; var emo=(window.TEMOJI&&window.TEMOJI[tn])?window.TEMOJI[tn]:String.fromCodePoint(0x1F33F);
      return '<div class="es-ech-row"><div class="es-ech-nom">'+emo+' '+_escHtml(tn)+'</div>'
        +'<div class="es-ech-dts"><input type="date" class="fi es-ech-d" id="es-ech-'+i+'-d1" value="'+_escAttr(e.d1||'')+'"><span class="es-ech-arrow">\u2192</span><input type="date" class="fi es-ech-d" id="es-ech-'+i+'-d2" value="'+_escAttr(e.d2||'')+'"></div></div>';
    }).join('');
  }
  window.openOv('ovEditSaison');
}
// Renommer une période : le nom sert de CLÉ de rangement de l'avancement (p.tachesAll[nom],
// p._tachesSaison), des sessions et de l'historique. Le renommer sans migrer ces clés
// orphelinerait tout l'avancement de la période, en silence. Un seul endroit, un seul passage.
function _renamePeriode(oldN,newN){
  if(!oldN||!newN||oldN===newN) return false;
  (window.PARCELLES||[]).forEach(function(p){
    if(!p) return;
    if(p.tachesAll&&typeof p.tachesAll==='object'&&Object.prototype.hasOwnProperty.call(p.tachesAll,oldN)){
      p.tachesAll[newN]=p.tachesAll[oldN]; delete p.tachesAll[oldN];
    }
    if(p._tachesSaison===oldN) p._tachesSaison=newN;
  });
  (window.SESSIONS||[]).forEach(function(x){ if(x&&x.saison===oldN) x.saison=newN; });
  (window.HISTORIQUE||[]).forEach(function(x){ if(x&&x.saisonNom===oldN) x.saisonNom=newN; });
  if(window.CONFIG&&window.CONFIG.tachesPrio&&window.CONFIG.tachesPrio.saison===oldN)
    window.CONFIG.tachesPrio.saison=newN;
  return true;
}

function saveEditSaison(){
  if(!isAdmin())return;
  var nom=document.getElementById('es-saison-nom').value;
  var s=window.SAISONS.find(function(x){return x.nom===nom;});
  if(!s)return;
  var _new=(((document.getElementById('es-saison-nomlibre')||{}).value)||'').trim();
  var _renomme=false;
  if(_new && _new!==nom){
    if((window.SAISONS||[]).some(function(x){return x!==s && (x.nom||'').trim().toLowerCase()===_new.toLowerCase();})){
      showToast('⚠️ « '+_new+' » existe déjà','#B85A1A'); return;
    }
    _renamePeriode(nom,_new); s.nom=_new; _renomme=true;
  }
  s.taches=Array.from(_esTachesSel||[]);
  s.periode=document.getElementById('es-saison-periode').value.trim();
  if(document.getElementById('es-saison-debut'))s.debut=document.getElementById('es-saison-debut').value||'';
  if(document.getElementById('es-saison-fin'))s.fin=document.getElementById('es-saison-fin').value||'';
  // Dates de travaux estimees (objet {tache:{d1,d2}} -> Firestore-safe, sur le doc saisons).
  var ech={};
  (_esEchTasks||[]).forEach(function(tn,i){
    var d1=(document.getElementById('es-ech-'+i+'-d1')||{}).value||'';
    var d2=(document.getElementById('es-ech-'+i+'-d2')||{}).value||'';
    if(d1||d2) ech[tn]={d1:d1,d2:d2};
  });
  if(Object.keys(ech).length) s.echeances=ech; else if(s.echeances) delete s.echeances;
  window.saveData('saisons','\U0001F4C5 Saison mise \u00e0 jour');
  window.closeOv(null,'ovEditSaison');
  renderReglages();
  showToast('\U0001F4C5 Saison mise \u00e0 jour','#3D6B27');
}

// ════════════════════════════════════════════════════════════════════
// EXPOSITIONS WINDOW — toutes les fonctions réglages
// ════════════════════════════════════════════════════════════════════
window.switchReglTab         = switchReglTab;
window.renderReglages        = renderReglages;
window.renderActTracList     = renderActTracList;
window.openEditActTrac       = openEditActTrac;
window.saveEditActTrac       = saveEditActTrac;
window.deleteActivite        = deleteActivite;
window.openOvNouvelleActivite = openOvNouvelleActivite;
window._pickNewActTrac       = _pickNewActTrac;
window._toggleActEmojiPick   = _toggleActEmojiPick;
window._pickActEmoji         = _pickActEmoji;
window._toggleActChamp       = _toggleActChamp;
window._toggleActChampReset  = _toggleActChampReset;
window._setActChampType      = _setActChampType;
window.activateSaison        = activateSaison;
window.saveSaison            = saveSaison;
window.openOvTache           = openOvTache;
window.addTacheFromCatalogue = addTacheFromCatalogue;
window.showOvTacheForm       = showOvTacheForm;
window.showOvTacheCatalog    = showOvTacheCatalog;
window.saveTache             = saveTache;
window.deleteTache           = deleteTache;
window.openEditHha           = openEditHha;
window.openSaison            = openSaison;
window._esToggleTache        = _esToggleTache;
window._nsDateEdit           = _nsDateEdit;
window.openTacheCfg          = openTacheCfg;
window.tcfgSave              = tcfgSave;
window._tcfgSetCount         = _tcfgSetCount;
window._tcfgHour             = _tcfgHour;
window._tcfgEstimate         = _tcfgEstimate;
window._tcfgMinTrou          = _tcfgMinTrou;
window._tcfgReset            = _tcfgReset;
window._nsToggleTache        = _nsToggleTache;
window.deleteSaison          = deleteSaison;
window.removeTacheFromSaison = removeTacheFromSaison;
window.saveEditHha           = saveEditHha;
window.toggleRole            = toggleRole;
window.saveMembre            = saveMembre;
window.editMembre            = editMembre;
window.toggleEmRole          = toggleEmRole;
window.toggleEmBureau        = toggleEmBureau;
window.toggleEmCollectif     = toggleEmCollectif;
window.saveEditMembre        = saveEditMembre;
window._emModToggle          = _emModToggle;
window._emModPreset          = _emModPreset;
window._emhRender            = _emhRender;
window._emhPick              = _emhPick;
window._emhForm              = _emhForm;
window._emhOk                = _emhOk;
window._emhDel               = _emhDel;
window._emhEff               = _emhEff;
window._emhClose             = _emhClose;
window._emhTyPick            = _emhTyPick;
window._emhGrPick            = _emhGrPick;
window._emModPresetRole      = _emModPresetRole;
window.deleteMembre          = deleteMembre;
window.openChangePwd         = openChangePwd;
// ── SEC-2 ──
window._mvShowNewPwd         = _mvShowNewPwd;
window._mvCopyNewPwd         = _mvCopyNewPwd;
window._mvResetMemberPwd     = _mvResetMemberPwd;
window._mvAdminNeedsRealMail = _mvAdminNeedsRealMail;
window._mvIsFakeMail         = _mvIsFakeMail;
window.confirmChangePwd      = confirmChangePwd;
window.showForgotPanel       = showForgotPanel;
window.hideForgotPanel       = hideForgotPanel;
window.submitForgotLogin     = submitForgotLogin;
window.sendForgotPwd         = sendForgotPwd;
window.openMentionsLogin     = openMentionsLogin;
window.requestNotifications  = requestNotifications;
window.updateNotifUI         = updateNotifUI;
window.sendTestNotif         = sendTestNotif;
window.scheduleNotifCheck    = scheduleNotifCheck;
window.checkNotifAlerts      = checkNotifAlerts;
window.notifyPriorityChange  = notifyPriorityChange;
window.archiveSaisonActive   = archiveSaisonActive;
window.renderHistorique      = renderHistorique;
window.histoSelectA          = histoSelectA;
window.histoSelectB          = histoSelectB;
window.deleteHistoSnapshot   = deleteHistoSnapshot;
// ═══════════════ Collection `paie` — rémunérations & prix du GNR ═══════════════
// Document mavigne_{slug}/paie — ADMIN-ONLY EN LECTURE COMME EN ÉCRITURE
// (firestore.rules) : c'est le SEUL document du modèle dans ce cas. Les autres docs
// sensibles (membres, planning_*) sont admin-only en écriture mais restent lisibles
// par toute l'équipe ; un salaire nominatif ne peut pas vivre là.
//   taux         : { "Nom du membre": nombre }        → €/h chargé, fiche membre
//   taux_hist    : { "Nom": [{d, de, a}] }            → trace des changements (promotion)
//   gnr_appoints : [{id, d, l, pu, f, par}]           → appoints de cuve (Tracteur)
// Écriture par fbSave DIRECT (pattern reserve.js/saveIntrants) : la clé n'est pas
// dans la map W de saveData → jamais recopiée dans le localStorage de l'appareil.
function _paie(){
  var P=window.PAIE;
  if(!P||typeof P!=='object'||Array.isArray(P)){ P={}; window.PAIE=P; }
  if(!P.taux||typeof P.taux!=='object') P.taux={};
  if(!P.taux_hist||typeof P.taux_hist!=='object') P.taux_hist={};
  if(!P.taux_serie||typeof P.taux_serie!=='object') P.taux_serie={};
  if(!Array.isArray(P.gnr_appoints)) P.gnr_appoints=[];
  return P;
}
function _paieSave(){
  var P=_paie(); window.PAIE=P;
  _pSerCache={ref:null,map:{}};          // le cache de series est derive de P : il meurt avec l'ecriture
  if(window.fbSave) window.fbSave('paie',P);
}
function _paieNum(v){ var n=parseFloat(String(v==null?'':v).replace(',','.')); return (isFinite(n)&&n>=0)?n:0; }
function _paieTaux(nom){ var v=Number(_paie().taux[nom]); return (isFinite(v)&&v>0)?v:null; }
// Repli legacy : barème par type de contrat (CONFIG.eco.taux_horaire), conservé en
// lecture pour ne pas casser le calcul des domaines qui l'avaient rempli.
function _paieTauxContrat(tc){
  var e=(window.CONFIG&&window.CONFIG.eco)||{}, t=(e.taux_horaire&&typeof e.taux_horaire==='object')?e.taux_horaire:{};
  var v=Number(t[tc||'CDI']); return (isFinite(v)&&v>0)?v:null;
}
// Taux effectif d'un membre : individuel d'abord, barème de contrat en repli.
function _paieTauxEff(m){
  if(!m) return null;
  var v=_paieTaux(m.nom); if(v!=null) return v;
  return _paieTauxContrat(m.type_contrat);
}

// ═══════════ LE TAUX EST UNE SERIE DATEE, PAS UN NOMBRE ═══════════════════════
// ⚠️⚠️⚠️ UN TAUX CHANGE AUJOURD'HUI NE DOIT RIEN CHANGER A CE QU'A COUTE HIER.
// Avant ce lot, `taux[nom]` etait un scalaire lu SANS DATE par les trois calculs de
// cout (cout par parcelle, sessions tracteur, exercice comptable) : augmenter
// quelqu'un revalorisait retroactivement TOUT l'historique, jusqu'a un exercice
// deja clos. `taux_hist` existait — mais il n'etait lu par AUCUN calcul, seulement
// affiche en une phrase sous le champ. ★ La trace donnait l'illusion que le
// probleme etait traite pendant que les totaux bougeaient en silence.
//
//   taux_serie[nom] = [{d:'YYYY-MM-DD', v:12.10}, ...]  croissante — SOURCE DE VERITE
//   taux[nom]       = MIROIR du taux EN VIGUEUR AUJOURD'HUI. Conserve parce que la
//                     fiche, le compteur de la carte Economie et le garde anti-perte
//                     le lisent. Reecrit a chaque enregistrement, jamais saisi seul.
//
// ⚠️ MIGRATION : AUCUNE ECRITURE. Serie absente -> elle est DERIVEE a la lecture
// depuis `taux` + `taux_hist`, selon la regle dictee par Nico : « les salaires
// indiques sont ok jusqu'a leur date de modification inscrite » — donc `de` vaut
// JUSQU'A `d`, et `a` vaut A PARTIR DE `d`. Un domaine qui n'ouvre jamais la fiche
// continue de calculer exactement comme avant : la derivation d'un domaine sans
// aucun historique rend [{depuis toujours, taux courant}], soit le comportement
// actuel a l'identique. La serie n'est materialisee qu'au premier enregistrement.
var _PAIE_ANCRE='0000-01-01';        // « depuis toujours » — borne basse d'une serie derivee
var _pSerCache={ref:null,map:{}};    // invalide par _paieSave et par tout remplacement de window.PAIE
function _paieAuj(){
  if(typeof window._mvAujIso==='function'){
    var v=window._mvAujIso();
    if(_paieIsoOk(v)) return v;      // on VERIFIE la valeur au lieu de la supposer
  }
  var n=new Date(), p=function(x){ return (x<10?'0':'')+x; };
  return n.getFullYear()+'-'+p(n.getMonth()+1)+'-'+p(n.getDate());
}
function _paieIsoOk(d){ return /^\d{4}-\d{2}-\d{2}$/.test(String(d||'')); }
// Normalise : valeurs > 0 seulement, dates valides, tri croissant, une seule ligne
// par date (la derniere gagne), 60 lignes au maximum.
function _paieSerNorm(A){
  var seen={}, out=[];
  (Array.isArray(A)?A:[]).forEach(function(e){
    if(!e) return;
    var d=String(e.d||'').slice(0,10), v=_paieNum(e.v);
    if(!(v>0)) return;
    if(!d) d=_PAIE_ANCRE;
    if(!_paieIsoOk(d)) return;
    seen[d]={d:d,v:v};
  });
  Object.keys(seen).sort().forEach(function(k){ out.push(seen[k]); });
  return (out.length>60)?out.slice(-60):out;
}
// Resolution : derniere ligne dont la date est <= d. Sortie NULL si la serie est vide.
function _paieResolve(S,d){
  if(!S||!S.length) return null;
  var v=null;
  for(var i=0;i<S.length;i++){ if(S[i].d<=d) v=S[i].v; else break; }
  // Date anterieure a la premiere ligne : n'arrive que sur une serie SAISIE dont la
  // premiere ligne porte une date (une serie derivee est ancree « depuis toujours »).
  // On retombe sur la plus ancienne valeur connue plutot que sur zero : afficher une
  // masse salariale nulle sur un mois travaille serait un mensonge plus grave que
  // d'etendre vers l'arriere le plus ancien taux connu.
  if(v==null) v=S[0].v;
  return (v>0)?v:null;
}
function _paieSerieRaw(nom,P){
  var S=_paieSerNorm(P.taux_serie[nom]);
  if(S.length) return S;
  var cur=_paieNum(P.taux[nom]);
  var H=Array.isArray(P.taux_hist[nom])?P.taux_hist[nom]:[], D=[];
  for(var i=0;i<H.length;i++){
    var h=H[i]; if(!h) continue;
    if(!D.length && h.de!=null && _paieNum(h.de)>0) D.push({d:_PAIE_ANCRE, v:_paieNum(h.de)});
    var a=_paieNum(h.a), d=String(h.d||'').slice(0,10);
    if(a>0 && _paieIsoOk(d)) D.push({d:d, v:a});
  }
  D=_paieSerNorm(D);
  if(!D.length) return (cur>0)?[{d:_PAIE_ANCRE, v:cur}]:[];
  // Divergence entre le miroir et la fin de l'historique : `taux` a ete ecrit sans
  // passer par l'historisation (import, console, ancienne version). On ne REECRIT PAS
  // le passe pour le faire coller — on ajoute ce qu'on sait, a la seule date qu'on
  // puisse honnetement lui donner : aujourd'hui.
  if(cur>0 && Math.abs(D[D.length-1].v-cur)>0.001) D.push({d:_paieAuj(), v:cur});
  return _paieSerNorm(D);
}
function _paieSerie(nom){
  var P=_paie();
  if(_pSerCache.ref!==P) _pSerCache={ref:P,map:{}};
  if(!_pSerCache.map[nom]) _pSerCache.map[nom]=_paieSerieRaw(nom,P);
  return _pSerCache.map[nom];
}
// ★★★ LA fonction : taux d'une personne A UNE DATE. Sans date -> taux courant, ce
// qui reproduit exactement l'ancien comportement pour tout appelant non converti.
function _paieTauxAt(nom,iso){
  var d=String(iso||'').slice(0,10);
  if(!d) return _paieTaux(nom);
  return _paieResolve(_paieSerie(nom),d);
}
// Taux effectif A UNE DATE : individuel d'abord, bareme de contrat en repli.
function _paieTauxEffAt(m,iso){
  if(!m) return null;
  var v=_paieTauxAt(m.nom,iso); if(v!=null) return v;
  return _paieTauxContrat(m.type_contrat);
}
window._mvPaie         = _paie;
window._mvPaieTaux     = _paieTaux;
window._mvPaieSerie    = _paieSerie;
window._mvPaieTauxAt   = _paieTauxAt;
window._mvPaieTauxEffAt= _paieTauxEffAt;
// ⚠️ SANS DATE : renvoie le taux d'AUJOURD'HUI. Ne JAMAIS s'en servir pour valoriser
// des heures passees — c'est precisement le bug corrige par ce lot. Pour toute heure
// qui porte une date, c'est `_mvPaieTauxEffAt(membre, date)` qu'il faut appeler.
window._mvPaieTauxEff = _paieTauxEff;
// ★★★ Enregistre le taux depuis la fiche membre. TROIS gestes distincts, et un seul
// d'entre eux fabrique une periode :
//   · valeur changee + date d'effet -> AUGMENTATION : une ligne de plus, a cette date
//   · valeur changee, date VIDEE    -> CORRECTION  : la derniere ligne est reecrite
//                                      SUR PLACE. Aucune periode fabriquee.
//   · lignes retirees a l'ecran     -> la serie relue du DOM les a deja perdues
// ⚠️⚠️ C'est mot pour mot la lecon du lot « historique des contrats » (§33) : corriger
// une faute de frappe ne doit JAMAIS fabriquer un passe qui n'a pas eu lieu. Le champ
// de date est donc PRE-REMPLI a aujourd'hui — le geste par defaut est le geste sur, il
// faut vider le champ a la main pour ecraser une ligne existante.
// ⚠️ Le champ de valeur vide ne supprime plus rien : pour retirer un taux, on retire
// ses lignes. Un champ de saisie ne doit pas pouvoir detruire un historique.
// `rows` = lignes relues du DOM (null = on repart de la serie en base).
window._mvPaieApply = function(nom, val, dEffet, rows){
  if(!nom) return null;
  if(typeof isAdmin==='function' && !isAdmin()) return null;  // défense en profondeur (rules = verrou réel)
  var P=_paie();
  var S=(rows!=null)?_paieSerNorm(rows):_paieSerie(nom).slice();
  var n=_paieNum(val);
  var d=String(dEffet||'').slice(0,10); if(!_paieIsoOk(d)) d='';
  var avant=S.length?S[S.length-1].v:null, geste=null;
  if(n>0){
    if(!S.length){ S=[{d:(d||_PAIE_ANCRE), v:n}]; geste='depart'; }
    else if(Math.abs(avant-n)>0.001){
      if(d){ S=S.concat([{d:d, v:n}]); geste='augmentation'; }
      else { S[S.length-1]={d:S[S.length-1].d, v:n}; geste='correction'; }
    }
  }
  S=_paieSerNorm(S);
  if(S.length){
    P.taux_serie[nom]=S;
    // Le miroir est le taux EN VIGUEUR AUJOURD'HUI, pas la derniere ligne : une
    // augmentation datee du mois prochain ne doit pas se presenter comme le taux
    // actuel dans la fiche ni dans le compteur de la carte Economie.
    var mir=_paieResolve(S,_paieAuj());
    if(mir>0) P.taux[nom]=mir; else delete P.taux[nom];
  } else {
    delete P.taux_serie[nom]; delete P.taux[nom];
  }
  _paieSave();
  return { geste:geste, de:avant, a:n, d:d, n:S.length };
};
// Signature historique conservee (aucune date = correction sur place). Appelants
// hors fiche membre : voir _mvPaieApply, qui est le point d'entree complet.
window._mvPaieSetTaux = function(nom, val){ return window._mvPaieApply(nom, val, '', null); };
// Prix du litre de GNR = moyenne PONDÉRÉE des appoints de cuve (PMP). Repli sur
// l'ancien champ Réglages CONFIG.eco.prix_gnr_litre tant qu'aucun appoint n'est saisi.
window._mvPaieGnrPMP = function(){
  var ap=_paie().gnr_appoints, L=0, E=0;
  ap.forEach(function(a){ var l=Number(a&&a.l)||0, pu=Number(a&&a.pu)||0; if(l>0&&pu>0){ L+=l; E+=l*pu; } });
  if(L>0) return E/L;
  var e=(window.CONFIG&&window.CONFIG.eco)||{}, v=Number(e.prix_gnr_litre);
  return (isFinite(v)&&v>0)?v:0;
};
// ═══════════════ Économie & conformité (taux, GNR, IFT réf.) ═══════════════
// Carte de saisie (admin, onglet Domaine). Alimente le tableau de bord Pilotage
// (coût/ha, IFT, DRE) en lecture seule. Écrit CONFIG.eco / CONFIG.conformite en
// PRÉSERVANT le reste de CONFIG (mutation en place + saveData('config')).
function _ecoNum(v){ var n=parseFloat(String(v==null?'':v).replace(',','.')); return (isFinite(n)&&n>=0)?n:0; }
window._ecoCfgSet=function(group,key,val){
  if(!window.CONFIG) window.CONFIG={};
  var C=window.CONFIG;
  if(group==='taux'){
    if(!C.eco||typeof C.eco!=='object') C.eco={};
    if(!C.eco.taux_horaire||typeof C.eco.taux_horaire!=='object') C.eco.taux_horaire={};
    C.eco.taux_horaire[key]=_ecoNum(val);
  } else if(group==='gnr'){
    if(!C.eco||typeof C.eco!=='object') C.eco={};
    C.eco.prix_gnr_litre=_ecoNum(val);
  } else if(group==='conso'){
    if(!C.eco||typeof C.eco!=='object') C.eco={};
    C.eco.conso_gnr_lh=_ecoNum(val);
  } else if(group==='ift'){
    if(!C.conformite||typeof C.conformite!=='object') C.conformite={};
    C.conformite.ift_ref=_ecoNum(val);
  } else if(group==='eco'){
    // Parametres du simulateur << Cout selon l'effectif >>, du surcout de retard, et
    // des DEUX hypotheses du pilotage economique (Pilotage > Outils > Parametrage) :
    //   kg_bouteille : kilos de raisin par col, base du cout a la bouteille.
    //   h_jour       : journee de reference, base de l'ecart de cadence (temps passe
    //                  au journal, en journees-personnes, contre les heures de bareme).
    // Liste blanche : aucune ecriture arbitraire possible dans CONFIG.eco. Une cle
    // absente d'ici est un no-op SILENCIEUX cote appelant — d'ou le controle de
    // relecture pose dans pilotage.js (_pecHypoSet), qui le dit au lieu de l'avaler.
    // ⚠️ `coef_charges` A ETE RETIRE de cette liste, et son champ de saisie avec.
    //   Le taux d'une fiche membre est deja un TAUX CHARGE (« coût employeur, € par
    //   heure », cf. le champ de la fiche) : le majorer d'un coefficient comptait les
    //   cotisations DEUX FOIS. Ne pas le remettre — s'il faut un jour accueillir un
    //   domaine qui saisit des taux BRUTS, c'est un interrupteur explicite qu'il faut,
    //   pas un multiplicateur qui suppose ce que contient le nombre.
    //   exercice_mois : mois d'OUVERTURE de l'exercice comptable (0-11, defaut 7 = aout).
    //                  Lu par window._mvExercice (utils.js), source unique de la fenetre
    //                  << de date de bilan a date de bilan >>. 0 est une valeur LEGITIME
    //                  (annee civile) : ne jamais traiter 0 comme << non renseigne >> ici.
    if(['pen_retard_sem','pen_plafond','rdt_renfort','cout_fixe_renfort','maj_hsup','k_retard','trac_etp','kg_bouteille','h_jour','exercice_mois'].indexOf(key)<0) return;
    if(!C.eco||typeof C.eco!=='object') C.eco={};
    C.eco[key]=_ecoNum(val);
  } else { return; }
  if(window.saveData) window.saveData('config');
};
function _ecoRenderConfigCard(){
  if(typeof isAdmin==='function' && !isAdmin()) return;
  var host=document.getElementById('saisons-list'); if(!host||!host.parentNode) return;
  var card=document.getElementById('eco-conf-card');
  if(!card){ card=document.createElement('div'); card.id='eco-conf-card'; host.parentNode.insertBefore(card, host.nextSibling); }
  var e=(window.CONFIG&&window.CONFIG.eco)||{};
  var conso=(e.conso_gnr_lh!=null?e.conso_gnr_lh:6);
  var cf=(window.CONFIG&&window.CONFIG.conformite)||{};
  var iftRef=(cf.ift_ref!=null&&Number(cf.ift_ref)>0)?cf.ift_ref:'';
  var inCss='width:78px;padding:7px 8px;border:1.5px solid var(--gris-clair);border-radius:9px;font-family:inherit;font-size:14px;text-align:right;background:var(--bg-app);color:var(--texte);box-sizing:border-box';
  var lblCss='font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte-doux);margin-bottom:6px';
  var rowCss='display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap';
  // Les deux valeurs qui étaient saisies ici se renseignent désormais là où l'information
  // existe vraiment : le taux dans la fiche de chaque membre, le prix du GNR au moment
  // de l'appoint de cuve. La carte ne garde que les paramètres sans porte d'entrée métier.
  var nTaux=0, nMbr=0;
  (window.MEMBRES||[]).forEach(function(m){
    if(!m||m.statut==='Inactif'||m.bureau) return;
    nMbr++; if(_paieTaux(m.nom)!=null) nTaux++;
  });
  var pmp=(window._mvPaieGnrPMP?window._mvPaieGnrPMP():0);
  var nApp=_paie().gnr_appoints.length;
  var goCss='padding:7px 12px;border:1.5px solid var(--gris-clair);border-radius:9px;background:var(--bg-app);color:var(--texte);font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;min-height:44px;white-space:nowrap';
  var okCss='font-size:11.5px;font-weight:600;color:var(--vert,#3D6B27)';
  var todoCss='font-size:11.5px;font-weight:600;color:var(--orange,#B85A1A)';
  var tauxEtat = nTaux>0
    ? ('<span style="'+okCss+'">'+nTaux+' / '+nMbr+' renseigné'+(nTaux>1?'s':'')+'</span>')
    : ('<span style="'+todoCss+'">à renseigner</span>');
  var gnrEtat = pmp>0
    ? ('<span style="'+okCss+'">'+(Math.round(pmp*100)/100).toLocaleString('fr-FR',{minimumFractionDigits:0,maximumFractionDigits:2})+' €/L</span>'
       +'<div style="font-size:11px;color:var(--texte-doux)">'+(nApp>0?('moyenne pondérée sur '+nApp+' appoint'+(nApp>1?'s':'')):'ancienne saisie manuelle')+'</div>')
    : ('<span style="'+todoCss+'">à renseigner</span>');
  card.innerHTML=''
    +'<div style="background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:16px;padding:16px 18px;margin:14px 0">'
    +'<div style="font-family:\'Cormorant Garamond\',serif;font-weight:700;font-size:20px;color:var(--cave,#14110D);margin-bottom:3px">💶 Économie & conformité</div>'
    +'<div style="font-size:12.5px;color:var(--texte-doux);margin-bottom:12px">Alimente le tableau de bord <b>Pilotage</b> (coût/ha par parcelle, passages/IFT, DRE).</div>'
    +'<div style="height:3px;border-radius:3px;background:linear-gradient(90deg,#8A5A38,#C2871E,#3D6B27);margin-bottom:14px"></div>'
    +'<div style="'+lblCss+'">Se renseigne ailleurs</div>'
    +'<div style="'+rowCss+';padding:9px 0;border-bottom:1px solid var(--gris-clair)"><div style="flex:1;min-width:170px">'
      +'<div style="font-size:13.5px;color:var(--texte);font-weight:600">👤 Taux horaire chargé</div>'
      +'<div style="font-size:11.5px;color:var(--texte-doux)">un taux par personne, dans sa fiche</div>'
      +'<div style="margin-top:3px">'+tauxEtat+'</div></div>'
      +'<button type="button" onclick="window.switchReglTab(\'equipe\')" style="'+goCss+'">Ouvrir Équipe ›</button></div>'
    +'<div style="'+rowCss+';padding:9px 0;border-bottom:1px solid var(--gris-clair)"><div style="flex:1;min-width:170px">'
      +'<div style="font-size:13.5px;color:var(--texte);font-weight:600">⛽ Prix du litre de GNR</div>'
      +'<div style="font-size:11.5px;color:var(--texte-doux)">saisi à chaque appoint de la cuve</div>'
      +'<div style="margin-top:3px">'+gnrEtat+'</div></div>'
      +'<button type="button" onclick="window.goTo&&window.goTo(\'tracteur\')" style="'+goCss+'">Ouvrir Tracteur ›</button></div>'
    // Les parametres de simulation (penalite de retard, heures sup, renfort) ont rejoint
    // Pilotage > Outils > Parametrage : ils pilotent DEUX onglets de Pilotage et aucun
    // ecran de Reglages. On garde ici le panneau indicateur, dans l'idiome des deux lignes
    // ci-dessus, pour que l'admin qui les cherche ici ne se retrouve pas devant du vide.
    +'<div style="'+rowCss+';padding:9px 0"><div style="flex:1;min-width:170px">'
      +'<div style="font-size:13.5px;color:var(--texte);font-weight:600">🎛️ Paramètres de simulation</div>'
      +'<div style="font-size:11.5px;color:var(--texte-doux)">pénalité de retard, heures sup, renfort</div>'
      +'<div style="margin-top:3px"><span style="font-size:11.5px;font-weight:600;color:var(--texte-doux)">chiffrent le surcoût de retard et la courbe « Coût selon l’effectif »</span></div></div>'
      +'<button type="button" onclick="window._pilOpenParam&&window._pilOpenParam()" style="'+goCss+'">Ouvrir Paramétrage ›</button></div>'
    +'<div style="'+lblCss+';margin-top:18px">Paramètres du domaine</div>'
    +'<div style="'+rowCss+'"><div style="flex:1;min-width:180px"><div style="font-size:13.5px;color:var(--texte);font-weight:600">Consommation GNR moyenne</div><div style="font-size:11.5px;color:var(--texte-doux)">estime le GNR par parcelle (≈ 6 L/h)</div></div>'
      +'<span style="display:inline-flex;align-items:center;gap:5px"><input type="number" min="0" step="0.5" value="'+conso+'" placeholder="6" onchange="window._ecoCfgSet(\'conso\',null,this.value)" style="'+inCss+'"><span style="font-size:12px;color:var(--texte-doux)">L/h</span></span></div>'
    +'<div style="'+rowCss+';margin-top:12px;padding-top:12px;border-top:1px solid var(--gris-clair)"><div style="flex:1;min-width:180px"><div style="font-size:13.5px;color:var(--texte);font-weight:600">🌿 Passages phyto de référence</div><div style="font-size:11.5px;color:var(--texte-doux)">indicatif régional (Bourgogne ≈ 12) — vide = défaut</div></div>'
      +'<span style="display:inline-flex;align-items:center;gap:5px"><input type="number" min="0" step="1" value="'+iftRef+'" placeholder="12" onchange="window._ecoCfgSet(\'ift\',null,this.value)" style="'+inCss+'"><span style="font-size:12px;color:var(--texte-doux)">passages</span></span></div>'
    +'<div style="font-size:11.5px;color:var(--texte-doux);margin-top:12px;line-height:1.5">Le coût phyto par parcelle est calculé dans Pilotage depuis les <b>doses</b> (assistant de traitement) × le <b>prix unitaire des intrants</b> de La Réserve.</div>'
    +'</div>';
}

// ═══════════════ Synthèse cuivre métal (bio) ═══════════════
var _cuState={mode:'an'};
function _cuPlafond(){ return (window.CONFIG&&window.CONFIG.cuivre_plafond>0)?window.CONFIG.cuivre_plafond:4; }
function _cuActiveParc(){ return (window.PARCELLES||[]).filter(function(p){return p.statut!=='Arrachee';}); }
function _cuIsCu(t){ return !!(t&&t.type==='Cuivre'&&t.cuMetal!=null&&t.cuMetal>0); }
function _cuYear(d){ return (d||'').slice(0,4); }
function _cuTreatParc(t){ var a=t.parcelles; if(typeof a==='string')a=(a?[a]:[]); if(!a||!a.length)return _cuActiveParc().map(function(p){return p.nom;}); return a; }
function _cuCampagneYear(){ var sa=(typeof window.getSaisonActive==='function')?window.getSaisonActive():null; if(sa&&sa.debut)return _cuYear(sa.debut); var ys=(window.TRAITEMENTS||[]).filter(_cuIsCu).map(function(t){return _cuYear(t.date);}).filter(Boolean).sort(); return ys.length?ys[ys.length-1]:String(new Date().getFullYear()); }
function _cuTreatments(year){ return (window.TRAITEMENTS||[]).filter(function(t){return _cuIsCu(t)&&(!year||_cuYear(t.date)===year);}); }
function _cuParcYear(nom,year){ return _cuTreatments(year).filter(function(t){return _cuTreatParc(t).indexOf(nom)>=0;}).reduce(function(s,t){return s+(t.cuMetal||0);},0); }
function _cuParcApps(nom,year){ return _cuTreatments(year).filter(function(t){return _cuTreatParc(t).indexOf(nom)>=0;}).sort(function(a,b){return (a.date||'').localeCompare(b.date||'');}); }
function _cuRollingYears(){ var y=parseInt(_cuCampagneYear(),10)||new Date().getFullYear(); var a=[]; for(var k=6;k>=0;k--)a.push(String(y-k)); return a; }
function _cuParcRolling(nom){ var ys=_cuRollingYears(),vals=[]; ys.forEach(function(yr){var v=_cuParcYear(nom,yr); if(v>0)vals.push(v);}); if(!vals.length)return _cuParcYear(nom,_cuCampagneYear()); return vals.reduce(function(a,b){return a+b;},0)/vals.length; }
function _cuParcRollSum(nom){ var ys=_cuRollingYears(),s=0; ys.forEach(function(yr){s+=_cuParcYear(nom,yr);}); return s; }
window._cuParcRollSum = _cuParcRollSum;
function _cuColor(r){ return r>1?'--rouge':r>=0.875?'--orange':r>=0.75?'--or':'--vert'; }
function _cuStatus(r){ return r>1?['D\u00e9passement','--rouge']:r>=0.875?['Vigilance','--orange']:['Conforme','--vert']; }
function _cuFmt(d){ if(!d)return '\u2014'; var pp=d.split('-'); return pp.length>=3?pp[2]+'/'+pp[1]+'/'+pp[0]:d; }
function _cuKpi(v,u,l,warn){ return '<div style="background:rgba(255,255,255,0.05);border:1px solid '+(warn?'rgba(192,57,43,0.5)':'rgba(201,168,76,0.18)')+';border-radius:12px;padding:11px 12px"><div style="font-size:22px;font-weight:700;font-family:\'Cormorant Garamond\',serif;line-height:1.1;color:'+(warn?'#E8846F':'#EFE7D3')+'">'+v+'<span style="font-size:11px;font-weight:500;color:#B7AE98;font-family:Outfit"> '+u+'</span></div><div style="font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:#A79E88;margin-top:4px;font-weight:600">'+l+'</div></div>'; }

window._cuToggleRow=function(el){ var d=el.querySelector('.cu-det'); if(d) d.style.display=(d.style.display==='none'?'block':'none'); };
window._cuClose=function(){ var o=document.getElementById('ovSyntheseCuivre'); if(o) o.classList.remove('open'); };
window._cuSetMode=function(m){ _cuState.mode=m; _renderCuivre(); };
window._cuSetPlafond=function(v){ var n=parseFloat(String(v).replace(',','.'))||4; if(window.CONFIG){ window.CONFIG.cuivre_plafond=n; if(window.saveData)window.saveData('config'); } _renderCuivre(); };

function openSyntheseCuivre(){
  var ov=document.getElementById('ovSyntheseCuivre');
  if(!ov){ ov=document.createElement('div'); ov.id='ovSyntheseCuivre'; ov.className='overlay'; ov.onclick=function(){window._cuClose();}; document.body.appendChild(ov); }
  _cuState.mode='an';
  _renderCuivre();
  if(window.openOv){ window.openOv('ovSyntheseCuivre'); } else { ov.classList.add('open'); }
}
window.openSyntheseCuivre=openSyntheseCuivre;

function _renderCuivre(){
  var ov=document.getElementById('ovSyntheseCuivre'); if(!ov)return;
  var year=_cuCampagneYear(), ceil=_cuPlafond(), mode=_cuState.mode;
  var parc=_cuActiveParc();
  var treats=_cuTreatments(year);
  var esc=(window._escHtml||function(x){return x;});
  var dom=(window.DOMAINE_NOM||'Domaine');

  var rows=parc.map(function(p){
    var an=_cuParcYear(p.nom,year), roll=_cuParcRolling(p.nom);
    var shown=(mode==='an'?an:roll), ratio=ceil>0?shown/ceil:0;
    return {p:p, an:an, roll:roll, shown:shown, ratio:ratio};
  }).sort(function(a,b){return b.shown-a.shown;});
  var vals=rows.map(function(r){return r.shown;});
  var maxV=vals.length?Math.max.apply(null,vals):0;
  var haTot=parc.reduce(function(s,p){return s+(parseFloat(p.surface)||0);},0);
  var wAvg=haTot>0?rows.reduce(function(s,r){return s+r.shown*(parseFloat(r.p.surface)||0);},0)/haTot:0;
  var nOver=vals.filter(function(v){return v>ceil;}).length;

  var body;
  if(!treats.length){
    body='<div style="text-align:center;padding:40px 16px;color:var(--texte-doux)">'
      +'<div style="font-size:34px;margin-bottom:10px">&#x1FA99;</div>'
      +'<div style="font-family:\'Cormorant Garamond\',serif;font-size:19px;color:var(--texte);margin-bottom:6px">Aucun traitement cuivre chiffr\u00e9 pour '+year+'</div>'
      +'<div style="font-size:13px;max-width:340px;margin:0 auto;line-height:1.6">Le cuivre m\u00e9tal (kg/ha) se renseigne sur chaque traitement cuivre dans l\'assistant (Tracteur &#x203A; Phyto &#x203A; nouveau traitement). La synth\u00e8se se remplit automatiquement au fil de la campagne.</div>'
      +'</div>';
  } else {
    var kpis='<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:9px">'
      +_cuKpi(maxV.toFixed(2),'kg/ha',mode==='an'?'Max parcelle '+year:'Max liss\u00e9 7 ans',maxV>ceil)
      +_cuKpi(wAvg.toFixed(2),'kg/ha','Moyenne pond\u00e9r\u00e9e',false)
      +_cuKpi(String(treats.length),'',mode==='an'?'Applications '+year:'Applications cuivre',false)
      +_cuKpi(String(nOver),'','Parcelles > plafond',nOver>0)
      +'</div>';
    var listHtml=rows.map(function(r){
      var col=_cuColor(r.ratio),st=_cuStatus(r.ratio),pct=Math.min(100,r.ratio*100);
      var apps=_cuParcApps(r.p.nom,year);
      var det=apps.map(function(a){return '<div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-bottom:1px solid var(--gris-clair)"><span>'+_cuFmt(a.date)+' &#x00B7; '+esc(a.produit||'\u2014')+'</span><span style="font-weight:600;color:#A56B3A">+'+(a.cuMetal||0).toFixed(2)+' kg/ha</span></div>';}).join('')
        +'<div style="display:flex;justify-content:space-between;font-size:12px;padding:6px 0 0;font-weight:700"><span>Cumul '+year+'</span><span>'+r.an.toFixed(2)+' kg Cu/ha</span></div>'
        +(mode==='roll'?'<div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 0 0"><span style="color:var(--texte-doux)">Budget 7 ans ('+_cuRollingYears()[0]+'\u2013'+year+')</span><span style="font-weight:700;color:var(--vert)">'+_cuParcRollSum(r.p.nom).toFixed(1)+' / 28 kg/ha</span></div>':'');
      return '<div onclick="window._cuToggleRow(this)" style="border:1px solid var(--gris);border-radius:13px;padding:12px 14px;background:var(--bg-card);cursor:pointer;margin-bottom:9px">'
        +'<div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px">'
        +'<div><div style="font-family:\'Cormorant Garamond\',serif;font-size:17px;font-weight:600">'+esc(r.p.nom)+'</div>'
        +'<div style="font-size:11px;color:var(--texte-doux)">'+((r.p.commune&&r.p.commune.nom)?'&#x1F4CD; '+esc(r.p.commune.nom)+' &#x00B7; ':'')+(parseFloat(r.p.surface)||0).toFixed(2)+' ha</div></div>'
        +'<div style="font-size:16px;font-weight:700;white-space:nowrap;color:var('+col+')">'+r.shown.toFixed(2)+'<span style="font-size:11px;font-weight:500;color:var(--texte-doux)"> kg Cu/ha</span></div>'
        +'</div>'
        +'<div style="position:relative;height:9px;border-radius:6px;background:var(--gris-clair);margin:10px 0 4px;overflow:hidden"><div style="position:absolute;left:0;top:0;bottom:0;border-radius:6px;width:'+pct+'%;background:var('+col+')"></div></div>'
        +'<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--texte-doux)"><span><b style="color:var('+st[1]+')">'+st[0]+'</b> &#x00B7; '+apps.length+' apport'+(apps.length>1?'s':'')+'</span><span>'+(r.ratio*100).toFixed(0)+'% du plafond</span></div>'
        +'<div class="cu-det" style="margin-top:11px;padding-top:11px;border-top:1px dashed var(--gris);display:none">'+det+'</div>'
        +'</div>';
    }).join('');
    var domHint=(mode==='an')
      ?'UE : 28 kg/ha sur 7 ans &#x21D2; 4 kg/ha/an en moyenne (ancien bar\u00e8me FR : 6). Ajuste selon ton organisme certificateur.'
      :'Moyenne annuelle sur les ann\u00e9es enregistr\u00e9es. Doit rester &#x2264; plafond en contr\u00f4le.';
    body='<div style="background:linear-gradient(155deg,#14110D,#1C1813);color:#EFE7D3;border:1px solid #2A241C;border-radius:16px;padding:16px;margin-bottom:16px">'
      +'<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:13px"><div style="font-family:\'Cormorant Garamond\',serif;font-size:18px;font-weight:600">Bilan du domaine</div>'
      +'<div style="display:inline-flex;border:1px solid rgba(201,168,76,0.3);border-radius:9px;overflow:hidden">'
      +'<button onclick="window._cuSetMode(\'an\')" style="background:'+(mode==='an'?'#C9A84C':'transparent')+';border:none;color:'+(mode==='an'?'#1B1710':'#B7AE98')+';font-family:Outfit;font-size:12px;font-weight:600;padding:6px 11px;cursor:pointer">Campagne '+year+'</button>'
      +'<button onclick="window._cuSetMode(\'roll\')" style="background:'+(mode==='roll'?'#C9A84C':'transparent')+';border:none;color:'+(mode==='roll'?'#1B1710':'#B7AE98')+';font-family:Outfit;font-size:12px;font-weight:600;padding:6px 11px;cursor:pointer">Liss\u00e9 7 ans</button>'
      +'</div></div>'
      +kpis
      +'<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:13px;padding-top:13px;border-top:1px solid rgba(201,168,76,0.16)">'
      +'<span style="font-size:12px;color:#C9C0AC">Plafond&#xA0;:</span>'
      +'<input type="number" step="0.5" value="'+ceil+'" onchange="window._cuSetPlafond(this.value)" style="width:60px;padding:6px 8px;border-radius:8px;border:1.5px solid rgba(201,168,76,0.35);background:rgba(0,0,0,0.25);color:#F3ECD8;font-family:Outfit;font-size:14px;text-align:center">'
      +'<span style="font-size:12px;color:#C9C0AC">kg&#xA0;Cu/ha/an</span>'
      +'<span style="font-size:11px;color:#8C8470;flex:1;min-width:180px">'+domHint+'</span>'
      +'</div></div>'
      +'<div style="font-size:12.5px;color:var(--texte-doux);margin:-4px 0 12px">Le plafond s\'applique <b>par hectare</b>. Touche une parcelle pour le d\u00e9tail des apports.</div>'
      +'<div>'+listHtml+'</div>'
      +'<div style="font-size:12px;color:var(--texte-doux);background:var(--gris-clair);border-radius:10px;padding:10px 12px;margin-top:14px;line-height:1.55"><b>Lissage 7 ans.</b> La r\u00e8gle UE autorise 28&#x202F;kg&#x202F;Cu/ha sur 7 ans (4 kg/ha/an en moyenne) : une ann\u00e9e peut d\u00e9passer 4 tant que la moyenne glissante reste sous le plafond. Bascule \u00ab Liss\u00e9 7 ans \u00bb pour la moyenne r\u00e9elle par parcelle.</div>';
  }

  var panel=ov.querySelector('.modal');
  if(!panel){ panel=document.createElement('div'); panel.className='modal'; ov.appendChild(panel); }
  panel.onclick=function(e){e.stopPropagation();};
  panel.style.cssText='display:flex;flex-direction:column;max-height:93vh;overflow:hidden;';
  panel.innerHTML='<div class="modal-handle"></div>'
    +'<div class="modal-hd" style="flex-shrink:0"><div class="modal-title">&#x1FA99; Synth\u00e8se cuivre m\u00e9tal</div>'
    +'<div style="font-size:12px;color:var(--texte-doux);margin-top:3px">'+esc(dom)+' &#x00B7; Campagne '+year+' &#x00B7; '+parc.length+' parcelles</div></div>'
    +'<div style="flex:1;overflow-y:auto;padding:16px 20px 0">'+body+'</div>'
    +'<div style="padding:12px 20px 20px;border-top:1px solid var(--gris);flex-shrink:0;display:flex;gap:10px">'
    +(treats.length?'<button onclick="if(window.exportPDFPhyto)window.exportPDFPhyto()" style="flex:1;padding:13px;border-radius:12px;border:none;background:var(--vert);color:#fff;font-family:Outfit;font-size:14px;font-weight:700;cursor:pointer"><span>&#x1F4C4; Registre PDF</span></button>':'')
    +'<button onclick="window._cuClose()" style="flex:1;padding:13px;border-radius:12px;border:1.5px solid var(--gris);background:transparent;color:var(--texte);font-family:Outfit;font-size:14px;font-weight:600;cursor:pointer"><span>Fermer</span></button>'
    +'</div>';
}
window._renderCuivre=_renderCuivre;

// Section cuivre du registre PDF (injectée dans exportPDFPhyto ; '' si aucun cuivre chiffré)
function _cuivrePdfSection(){
  var year=_cuCampagneYear(), ceil=_cuPlafond();
  var treats=_cuTreatments(year); if(!treats.length) return '';
  var esc=(window._escHtml||function(x){return x;});
  var parc=_cuActiveParc().map(function(p){ return {nom:p.nom, ha:parseFloat(p.surface)||0, cu:_cuParcYear(p.nom,year), n:_cuParcApps(p.nom,year).length}; })
       .filter(function(r){return r.cu>0;}).sort(function(a,b){return b.cu-a.cu;});
  if(!parc.length) return '';
  var maxV=Math.max.apply(null,parc.map(function(r){return r.cu;}));
  var th='style="border:1px solid #CFC9BC;padding:5px 7px;background:#efe7d8;font-size:10px;text-align:center;font-weight:700"';
  var td='style="border:1px solid #E0DACD;padding:5px 7px;font-size:11px"';
  var tdc='style="border:1px solid #E0DACD;padding:5px 7px;font-size:11px;text-align:center"';
  var rows=parc.map(function(r){
    var ratio=ceil>0?r.cu/ceil:0;
    var col=ratio>1?'#C0392B':ratio>=0.875?'#B5621A':'#2C6E49';
    var lab=ratio>1?'D\u00e9passement':ratio>=0.875?'Vigilance':'Conforme';
    return '<tr><td '+td+'>'+esc(r.nom)+'</td><td '+tdc+'>'+r.ha.toFixed(2)+'</td><td '+tdc+'>'+r.n+'</td><td '+tdc.slice(0,-1)+';font-weight:700;color:'+col+'">'+r.cu.toFixed(2)+'</td><td '+tdc+'>'+ceil.toFixed(1)+'</td><td '+tdc.slice(0,-1)+';color:'+col+'">'+lab+'</td></tr>';
  }).join('');
  return '<div class="section"><div class="section-title">&#x1FA99; Synth\u00e8se cuivre m\u00e9tal '+year+' (contr\u00f4le bio)</div>'
    +'<div style="font-size:11px;color:#555;margin-bottom:8px">Plafond de r\u00e9f\u00e9rence : <b>'+ceil.toFixed(1)+' kg Cu m\u00e9tal/ha/an</b> (UE : 28 kg/ha sur 7 ans, moyenne 4 kg/ha/an). Cumul du cuivre m\u00e9tal apport\u00e9 par parcelle sur la campagne. Max parcelle : <b>'+maxV.toFixed(2)+' kg/ha</b>.</div>'
    +'<table style="width:100%;border-collapse:collapse"><thead><tr><th '+th+'>Parcelle</th><th '+th+'>ha</th><th '+th+'>Applic.</th><th '+th+'>Cu m\u00e9tal (kg/ha)</th><th '+th+'>Plafond</th><th '+th+'>Statut</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}


window.openExport            = openExport;
window.dlFile                = dlFile;
window.showExportFeedback    = showExportFeedback;
window.exportJSON            = exportJSON;
window.importJSON            = importJSON;
window.showImportFeedback    = showImportFeedback;
window.recalcAllTravaux      = recalcAllTravaux;
window.exportCSVJournal      = exportCSVJournal;
window.exportCSVParcelles    = exportCSVParcelles;
window.exportPDFMois         = exportPDFMois;
window.exportPDFPhyto        = exportPDFPhyto;
window.exportPDFRapportSaison = exportPDFRapportSaison;
window.calcEtpLive           = calcEtpLive;
window.calcEtpLivePdf        = calcEtpLivePdf;
window.planFillPDFFromMonth  = planFillPDFFromMonth;
window.onPdfManualEdit       = onPdfManualEdit;
window.pdfDetailToggle       = pdfDetailToggle;
window.saveEtpSaison         = saveEtpSaison;
window.openEditDomNom        = openEditDomNom;
window.saveEditDomNom        = saveEditDomNom;
window.ednUseCentroide       = ednUseCentroide;
window.copyInviteLink        = copyInviteLink;
window._fallbackCopyInvite   = _fallbackCopyInvite;
window.applyDomNom           = applyDomNom;

// ════════════════════════════════════════════════════════════════════
// CONVENTION COLLECTIVE — barème consultable & rattachement manuel
// ────────────────────────────────────────────────────────────────────
// TACHES_CATALOGUE (app.js) EST le référentiel conventionnel. Le lien entre une tâche du
// domaine et un travail de la convention se faisait UNIQUEMENT par le nom : une tâche
// créée avant cette option n'avait donc aucune référence, et son bandeau affichait
// « Hors convention » sans recours. On pose désormais un champ explicite t.conv, résolu
// par window._tacheConvRef (app.js) et préservé par _normalizeTaches.
// Rattacher est une RÉFÉRENCE, pas une fusion : la tâche garde nom, saisons et h/ha.
// Overlay créé en JS (patron d'ovSyntheseCuivre) → ni index.html ni styles.css touchés.
// ════════════════════════════════════════════════════════════════════
var _tcvTache=null;

// isAdmin() est appelee nue partout dans ce module ; window.isAdmin n'est pas garanti.
// Fail-closed : en cas de doute on refuse l'ecriture, jamais l'inverse.
function _tcvAdmin(){
  try{ return (typeof isAdmin==='function')?!!isAdmin():!!(window.isAdmin&&window.isAdmin()); }
  catch(e){ return false; }
}

function _tcvInjectCss(){
  if(document.getElementById('tcv-css'))return;
  var s=document.createElement('style');s.id='tcv-css';
  // .tcv-banner / .tcv-chev retirées : le bandeau est devenu un bouton (index.html).
  s.textContent=''
   +'.tcv-lnk{display:inline-block;font-size:10px;font-weight:600;margin-top:2px;cursor:pointer;'
   +'border-bottom:1px dashed currentColor;padding:2px 0}'
   +'.tcv-row{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:10px;'
   +'border:1px solid var(--gris-clair);background:var(--bg-card);margin-bottom:7px;min-height:44px}'
   +'.tcv-row.pick{cursor:pointer}'
   +'.tcv-row.on{border-color:var(--vert-med);background:rgba(61,107,39,0.08)}'
   +'.tcv-nom{font-weight:700;font-size:13.5px;color:var(--texte)}'
   +'.tcv-sub{font-size:11px;color:var(--texte-doux);margin-top:2px}'
   +'.tcv-h{font-size:13px;font-weight:800;color:var(--terre,#8A5A38);white-space:nowrap}'
   +'.tcv-tag{display:inline-block;font-size:9px;font-weight:700;border-radius:10px;padding:1px 7px;'
   +'margin-right:4px;background:rgba(61,107,39,0.14);color:var(--vert-med)}'
   +'.tcv-act{flex-shrink:0;width:30px;height:30px;border-radius:9px;display:flex;align-items:center;'
   +'justify-content:center;font-size:17px;font-weight:700;color:var(--vert-med);'
   +'background:rgba(61,107,39,0.10);border:1px solid rgba(61,107,39,0.22)}'
   +'.tcv-act.ok{background:transparent;border-color:transparent}'
   +'.tcv-sec{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;'
   +'color:var(--terre,#8A5A38);margin:14px 0 8px}';
  document.head.appendChild(s);
}

// Libellé h/ha d'un travail conventionnel (mêmes règles que la ligne de tâche)
// Saisie des ecartements : deux etapes, la primitive openPrompt (jamais prompt() natif,
// qui ne rend RIEN en PWA iOS). Ecrit CONFIG.vigne puis re-rend le panneau.
// Bascule de barème régional. Écrit CONFIG.bareme (clé courte, jamais le libellé) et
// re-rend. Aucune donnée du domaine n'est touchée : seules les valeurs CONSEILLÉES
// changent — le barème du domaine, lui, reste ce qu'il est.
window._tcvSetBareme = function(k){
  if(!_tcvAdmin()){ if(window.showToast)showToast('Réservé à l\u2019administrateur','#C0392B'); return; }
  var B=(window.MV_BAREMES||{});
  if(!B[k]){ if(window.showToast)showToast('Barème inconnu','#B85A1A'); return; }
  window.CONFIG=window.CONFIG||{};
  if(window.CONFIG.bareme===k){ return; }
  window.CONFIG.bareme=k;
  window.saveData('config');
  if(window.showToast)showToast('\u{1F4CB} Barème : '+(B[k].court||k),'#3D6B27');
  _tcvRender();
  if(typeof renderReglages==='function')renderReglages();
};

window._tcvSetDens = function(){
  if(!_tcvAdmin()){ if(window.showToast)showToast('Réservé à l\u2019administrateur','#C0392B'); return; }
  var v=(window._mvVigne?window._mvVigne():null);
  var num=function(x){ var n=parseFloat(String(x).replace(',','.')); return (isFinite(n)&&n>0&&n<10)?n:0; };
  if(!window.openPrompt){ if(window.showToast)showToast('Saisie indisponible','#C0392B'); return; }
  window.openPrompt({
    icone:'\u{1F33F}', titre:'Écartement entre les rangs', unite:'m',
    sub:'La distance d\u2019un rang au suivant. En Côte de Nuits, 1 m.',
    valeur:(v?String(v.ec_rang).replace('.',','):''), placeholder:'1,0',
    cb:function(a){
      var R=num(a);
      if(!R){ if(window.showToast)showToast('Écartement invalide','#B85A1A'); return; }
      window.openPrompt({
        icone:'\u{1F33F}', titre:'Écartement sur le rang', unite:'m',
        sub:'La distance d\u2019un pied au suivant, dans le rang.',
        valeur:(v?String(v.ec_pied).replace('.',','):''), placeholder:'1,0',
        cb:function(b){
          var P=num(b);
          if(!P){ if(window.showToast)showToast('Écartement invalide','#B85A1A'); return; }
          window.CONFIG=window.CONFIG||{};
          window.CONFIG.vigne=Object.assign({},window.CONFIG.vigne||{},{ec_rang:R,ec_pied:P});
          window.saveData('config');
          var n=window._mvPiedsHa(R,P);
          if(window.showToast)showToast('\u2705 '+n+' pieds/ha enregistrés','#3D6B27');
          _tcvRender();
          if(typeof renderReglages==='function')renderReglages();
        }
      });
    }
  });
};

function _tcvHha(c){
  if(!c)return '—';
  if(c.trous)return 'temps réel';
  if(c.tempsReel)return 'temps réel';
  // Affichage RAMENE a la densite du domaine (identique au bareme si 10 000 pieds/ha).
  var d=function(x){ return (window._mvHhaDens?window._mvHhaDens(x):x); };
  // Barème régional appliqué AVANT la densité (voir MV_BAREMES, app.js).
  var b=(window._mvBaremeRef?window._mvBaremeRef(c):c)||c;
  if(b._horsBareme) return '\u2014';
  c=b;
  if(c.type==='niveaux'&&c.niveaux)return d(c.niveaux.reduce(function(s,n){return s+n.hha;},0))+' h/ha';
  if(c.type==='passages'&&c.passagesHha)return c.passagesHha.map(d).join('/')+' h/ha';
  return d(c.hha||0)+' h/ha';
}

window.openTacheConv=function(nom){
  _tcvTache=nom||null;
  _tcvInjectCss();
  var ov=document.getElementById('ovTacheConv');
  if(!ov){ ov=document.createElement('div'); ov.id='ovTacheConv'; ov.className='overlay';
           ov.onclick=function(){window._tcvClose();}; document.body.appendChild(ov); }
  _tcvRender();
  if(window.openOv){ window.openOv('ovTacheConv'); } else { ov.classList.add('open'); }
};
window._tcvClose=function(){
  var o=document.getElementById('ovTacheConv');
  // closeOv a la signature (event, id) — l'appeler avec le seul id le range dans `event`
  // et le test e.target===overlay echoue : l'overlay ne se ferme jamais.
  if(o){ if(window.closeOv)window.closeOv(null,'ovTacheConv'); else o.classList.remove('open'); }
  _tcvTache=null;
};

// Rattachement / détachement — ADMIN SEUL (défense en profondeur : le garde est DANS la
// fonction, pas seulement sur le bouton ; la consultation du barème reste ouverte à tous).
window._tcvPick=function(convNom){
  if(!_tcvAdmin()){ if(window.showToast)showToast('Réservé à l\'administrateur','#C0392B'); return; }
  var t=(window.TACHES||[]).find(function(x){return x.nom===_tcvTache;});
  if(!t){ if(window.showToast)showToast('Tâche introuvable','#C0392B'); return; }
  if(convNom){ t.conv=convNom; } else { delete t.conv; }
  window.TACHES=window.TACHES;
  window.saveData('taches',convNom?('🔗 « '+t.nom+' » rattachée à « '+convNom+' »'):('↩︎ « '+t.nom+' » détachée de la convention'));
  window._tcvClose();
  renderReglages();
};

// Ajout / reconfiguration d'un travail de la convention depuis le barème (ADMIN).
// openTacheCfg gère déjà le cas « déjà présent » (isEdit) et tcfgSave fait push ou remplace.
window._tcvAdd=function(nom){
  if(!_tcvAdmin()){ if(window.showToast)showToast('Réservé à l\'administrateur','#C0392B'); return; }
  window._tcvClose();
  if(typeof openTacheCfg==='function')openTacheCfg(nom);
  else if(window.openTacheCfg)window.openTacheCfg(nom);
};

function _tcvRender(){
  var ov=document.getElementById('ovTacheConv'); if(!ov)return;
  var esc=(window._escHtml||function(x){return x;});
  var cat=(window.TACHES_CATALOGUE||[]);
  var t=_tcvTache?(window.TACHES||[]).find(function(x){return x.nom===_tcvTache;}):null;
  var cur=t?(t.conv||''):'';
  var mode=!!t;
  var admin=_tcvAdmin();

  // Tâches du domaine rattachées à chaque travail conventionnel (nom OU t.conv)
  function usedBy(c){
    return (window.TACHES||[]).filter(function(x){
      var r=window._tacheConvRef?window._tacheConvRef(x):null; return r&&r.nom===c.nom;
    }).map(function(x){return x.nom;});
  }
  function row(c){
    var on=(cur===c.nom);
    var u=usedBy(c);
    var inDom=(window.TACHES||[]).some(function(x){return x.nom===c.nom;});
    // Consultation : le travail s'ajoute (ou se reconfigure) via le flux existant
    // openTacheCfg -> « ＋ Ajouter à la saison ». Rattachement : on pose t.conv.
    var act='';
    if(admin) act=mode?("window._tcvPick('"+_escAttr(c.nom)+"')"):("window._tcvAdd('"+_escAttr(c.nom)+"')");
    var cls='tcv-row'+(on?' on':'')+(act?' pick':'');
    var sub=(c.obligatoire?'Cycle de la vigne':'Travail complémentaire');
    if(mode){ if(u.length)sub+=' · déjà utilisé par : '+esc(u.join(', ')); }
    else { sub+=inDom?(' · dans vos tâches'+(u.length>1?' ('+esc(u.join(', '))+')':'')):(admin?' · pas encore ajouté':''); }
    return '<div class="'+cls+'"'+(act?(' onclick="'+act+'"'):'')+'>'
      +'<div style="flex:1;min-width:0">'
        +'<div class="tcv-nom">'+((window.TEMOJI&&window.TEMOJI[c.nom])||'🌿')+' '+esc(c.label||c.nom)+(on?' <span class="tcv-tag">rattachée</span>':'')+'</div>'
        +'<div class="tcv-sub">'+sub+'</div>'
      +'</div>'
      +'<div class="tcv-h">'+_tcvHha(c)+'</div>'
      +(mode?'':'<div class="tcv-act'+(inDom?' ok':'')+'">'+(inDom?'✓':(admin?'＋':''))+'</div>')
    +'</div>';
  }
  var oblig=cat.filter(function(c){return c.obligatoire;});
  var compl=cat.filter(function(c){return !c.obligatoire;});
  var totalH=oblig.reduce(function(s,c0){
    var c=(window._mvBaremeRef?window._mvBaremeRef(c0):c0)||c0;
    if(c._horsBareme)return s;
    if(c.trous||c.tempsReel)return s;
    if(c.type==='niveaux'&&c.niveaux)return s+c.niveaux.reduce(function(a,n){return a+n.hha;},0);
    if(c.type==='passages'&&c.passagesHha)return s+c.passagesHha.reduce(function(a,n){return a+n;},0);
    return s+(c.hha||0);
  },0);

  var head=mode
    ? '<div style="font-size:12.5px;color:var(--texte-doux);margin-bottom:12px;line-height:1.5">Choisis le travail de la convention qui correspond à <b>'+esc(_tcvTache)+'</b>. La tâche garde son nom, ses saisons et ses h/ha — le rattachement sert de <b>référence</b>.</div>'
    : '<div style="font-size:12.5px;color:var(--texte-doux);margin-bottom:12px;line-height:1.5">Les travaux du cycle de la vigne et leurs h/ha de référence.'+(admin?' Touche un travail pour l\'ajouter à la saison (ou revoir ses heures s\'il y est déjà).':'')+' Une tâche créée hors convention peut être rattachée depuis sa ligne dans Réglages.</div>';
  if(mode&&!admin) head+='<div style="font-size:12px;color:var(--bordeaux,#7A1020);margin-bottom:10px">Le rattachement est réservé à l\'administrateur.</div>';

  // Bandeau densite : le bareme vaut pour 10 000 pieds/ha. On dit d'ou vient le chiffre,
  // et on laisse l'admin poser ses ecartements ici meme — c'est le seul ecran ou la
  // question se pose vraiment.
  var _dv=(window._mvVigne?window._mvVigne():null);
  var _dk=(window._mvDensCoef?window._mvDensCoef():1);
  // Sélecteur de barème régional. Le barème est INFORMATIF : on nomme la source et sa
  // date, et le vigneron reste libre de ses valeurs. Ajouter une région = une entrée
  // dans MV_BAREMES (app.js), rien à toucher ici.
  var _BS=(window.MV_BAREMES||{}), _bk=(window._mvBaremeActif?window._mvBaremeActif():'cote-nuits');
  var _bar=_BS[_bk]||null;
  var _chip=function(k,o){
    var on=(k===_bk);
    return '<span'+(admin?(' onclick="window._tcvSetBareme(\''+k+'\')"'):'')
      +' style="display:inline-block;font-size:11px;font-weight:700;border-radius:12px;padding:3px 10px;'
      +'margin:0 5px 5px 0;cursor:'+(admin?'pointer':'default')+';border:1px solid '
      +(on?'var(--vert-med)':'var(--gris-clair)')+';background:'+(on?'rgba(61,107,39,0.12)':'transparent')
      +';color:'+(on?'var(--vert-med)':'var(--texte-doux)')+'">'+esc(o.court||k)+'</span>';
  };
  var barHtml='<div style="font-size:11.5px;line-height:1.5;border:1px solid var(--gris-clair);border-radius:10px;padding:9px 11px;margin-bottom:9px;background:var(--bg-card)">'
    +'<b>Barème de référence</b><div style="margin-top:5px">'
    +Object.keys(_BS).map(function(k){return _chip(k,_BS[k]);}).join('')+'</div>'
    +(_bar?('<div style="color:var(--texte-doux);margin-top:2px">'+esc(_bar.label)+'<br>'
      +'<span style="opacity:0.85">'+esc(_bar.source)+'</span>'
      +(_bar.note?('<br><span style="opacity:0.85">'+esc(_bar.note)+'</span>'):'')+'</div>'):'')
    +'<div style="color:var(--texte-doux);margin-top:4px;opacity:0.85">Référence indicative : vos heures restent les vôtres.</div>'
    +'</div>';

  var densHtml='<div style="font-size:11.5px;line-height:1.5;border:1px solid var(--gris-clair);border-radius:10px;padding:9px 11px;margin-bottom:12px;background:var(--bg-card)">'
    +'<b>Vos plantations</b> — '
    +(_dv ? (esc(String(_dv.ec_rang).replace('.',','))+' × '+esc(String(_dv.ec_pied).replace('.',','))+' m · <b>'+_dv.pieds+' pieds/ha</b>')
          : '<span style="color:var(--texte-doux)">non renseignées</span>')
    +(admin?(' <span class="tcv-lnk" style="color:var(--vert-med)" onclick="window._tcvSetDens()">'+(_dv?'modifier':'renseigner')+'</span>'):'')
    +'<div style="color:var(--texte-doux);margin-top:3px">Le barème est établi pour <b>10 000 pieds/ha</b> (1 × 1 m). '
    +(_dk!==1?('Vos heures conseillées sont ramenées à votre densité, soit <b>'+Math.round(_dk*100)+' %</b> du barème.')
             :'À densité différente, l\u2019accord prévoit un calcul au prorata du nombre de pieds.')
    +'</div></div>';

  var body=head+(mode?'':(barHtml+densHtml))
    +'<div class="tcv-sec">Cycle de la vigne · '+oblig.length+' travaux · '+totalH+' h/ha</div>'
    +oblig.map(row).join('')
    +'<div class="tcv-sec">Travaux complémentaires · '+compl.length+'</div>'
    +compl.map(row).join('');

  var panel=ov.querySelector('.modal');
  if(!panel){ panel=document.createElement('div'); panel.className='modal'; ov.appendChild(panel); }
  panel.onclick=function(e){e.stopPropagation();};
  panel.style.cssText='display:flex;flex-direction:column;max-height:93vh;overflow:hidden;';
  panel.innerHTML='<div class="modal-handle"></div>'
    +'<div class="modal-hd" style="flex-shrink:0"><div class="modal-title">📋 '+(mode?'Rattacher à la convention':'Barème de la convention')+'</div>'
    +'<div style="font-size:12px;color:var(--texte-doux);margin-top:3px">'+(mode?esc(_tcvTache):'Travaux de la vigne · h/ha de référence')+'</div></div>'
    +'<div style="flex:1;overflow-y:auto;padding:16px 20px 0">'+body+'</div>'
    +'<div style="padding:12px 20px 20px;border-top:1px solid var(--gris);flex-shrink:0;display:flex;gap:10px">'
    +((mode&&cur&&admin)?'<button onclick="window._tcvPick(\'\')" style="flex:1;padding:13px;border-radius:12px;border:1.5px solid var(--gris);background:transparent;color:var(--bordeaux,#7A1020);font-family:Outfit;font-size:14px;font-weight:700;cursor:pointer"><span>↩︎ Détacher</span></button>':'')
    +'<button onclick="window._tcvClose()" style="flex:1;padding:13px;border-radius:12px;border:1.5px solid var(--gris);background:transparent;color:var(--texte);font-family:Outfit;font-size:14px;font-weight:600;cursor:pointer"><span>Fermer</span></button>'
    +'</div>';
}

window.openEditSaison        = openEditSaison;
window.saveEditSaison        = saveEditSaison;

/* ══════════════════════════════════════════════════════════════════════════
   MA VIGNE — L'ÉTAT DU VIGNOBLE
   ══════════════════════════════════════════════════════════════════════════
   Le vignoble ne sortait qu'en CSV : une ligne par parcelle, une colonne par
   tache. Utile a un tableur, illisible sur une table de cuisine, et muet sur
   tout ce qui n'est pas une tache — la surface, le cepage, la commune, le
   rendement, et surtout CE QUI MANQUE.

   Ce document est l'etat civil du domaine. Il sert deux moments precis :
     · l'installation d'un nouveau client, ou l'on verifie parcelle par
       parcelle ce qui a ete repris et ce qui reste a renseigner ;
     · le debut de campagne, ou l'on veut la liste complete sous les yeux.

   ⚠️ AUCUN CALCUL NEUF. Les moteurs sont ceux des ecrans :
     getPCls          l'avancement d'une parcelle (taches exclues comprises)
     getTachesSaison  les taches de la saison CONSULTEE
     _mvParcGeo       ou est une parcelle : ses coordonnees, sinon le centroide
     _mvKmlCtrs       les contours cartographies, par nom
     _dpRendHistRows  l'historique de rendement d'une parcelle, par millesime
   Le document LIT ces moteurs. Il ne les refait pas.

   ⚠️ CE DOCUMENT NE PARLE PAS D'HEURES. Le calcul des heures restantes d'une
   parcelle vit dans le detail parcelle (openDP) et tient compte des trous de
   plantation, de l'entreplantation et des exclusions ; le recopier ici en
   ferait une seconde definition, donc une divergence a terme. Les heures se
   lisent au Pilotage et dans le rapport de saison, qui ont leur moteur.

   ⚠️ Le bloc CSS ci-dessous est le JUMEAU de MV_CUVDOC_CSS (cave.js) : memes
   classes, memes valeurs, pour que les documents se ressemblent. Les deux sont
   a remonter dans utils.js — la ou vit deja la charte MV_DOC — au prochain lot
   qui bumpe. Ecrit ici pour ne pas retoucher un fichier deja livre.
   ══════════════════════════════════════════════════════════════════════════ */

var MV_VGNDOC_CSS = ''
  + '.cd-kpis{display:flex;gap:16px;flex-wrap:wrap;background:#FAF6EC;border:1px solid #E8DCC0;'
    + 'border-radius:7px;padding:9px 13px;margin-bottom:13px}'
  + '.cd-k{min-width:96px}'
  + '.cd-k b{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.6px;color:#8B6020;margin-bottom:2px}'
  + '.cd-k span{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:20px;font-weight:700;color:#2D1B09;line-height:1.05}'
  + '.cd-k span small{font-family:\'Outfit\',sans-serif;font-size:9px;font-weight:600;color:#7A6A4A}'
  + '.cd-k i{display:block;font-style:normal;font-size:8px;color:#7A7263;margin-top:2px;line-height:1.4}'
  + 'h2{font-size:11px;color:#2D1B09;margin:15px 0 6px;text-transform:uppercase;letter-spacing:.9px}'
  + 'table{width:100%;border-collapse:collapse;font-size:9.5px;margin-bottom:4px}'
  + 'th{text-align:left;padding:5px 6px;background:#2D1B09;color:#F3E7CE;font-size:8px;'
    + 'text-transform:uppercase;letter-spacing:.4px;font-weight:700}'
  + 'td{border-bottom:1px solid #EDE7DA;padding:4px 6px;vertical-align:top}'
  + 'td.n,th.n{text-align:right;white-space:nowrap}'
  + 'tr:nth-child(even) td{background:#FBFAF6}'
  + 'tr.tot td{background:#F4EEE2;font-weight:700;border-top:1.5px solid #C8A060;border-bottom:none}'
  + '.cd-note{font-size:8.5px;color:#7A7263;margin:2px 0 11px;line-height:1.5}'
  + '.cd-vide{font-size:9.5px;color:#7A7263;margin:0 0 11px}'
  // propre a ce document : les reperes manquants, et la barre d'avancement
  + '.vg-m{display:inline-block;font-size:7.5px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;'
    + 'padding:1px 5px;border-radius:8px;background:#F6E4D2;color:#A2521A;margin-right:3px}'
  + '.vg-ok{color:#6E8A52;font-weight:700}'
  + '.vg-bar{display:block;height:4px;background:#EDE7DA;border-radius:3px;overflow:hidden;margin-top:2px}'
  + '.vg-bar i{display:block;height:100%;background:#8A5A38}'
  + '.vg-ar td{color:#8A8272;font-style:italic}';

/* ── Lecture : une passe sur le domaine, aucune ecriture ──────────────────
   Tout ce qui est calcule ici est une AGREGATION de moteurs existants, jamais
   une seconde version d'un moteur. */
function _vgnEsc(s){
  return (typeof window._escHtml === 'function') ? window._escHtml(String(s == null ? '' : s))
                                                 : String(s == null ? '' : s);
}
function _vgnNum(n, d){
  var f = Math.pow(10, d == null ? 2 : d);
  return String(Math.round((n || 0) * f) / f).replace('.', ',');
}
function _vgnDateFr(iso){
  if(!iso) return '';
  var p = String(iso).slice(0, 10).split('-');
  return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0].slice(2)) : String(iso);
}
function _vgnCommune(p){
  if(!p) return '';
  if(p.commune && typeof p.commune === 'object') return String(p.commune.nom || '');
  return String(p.commune || '');
}
function _vgnCepages(p){
  if(!p) return [];
  if(Array.isArray(p.cepages) && p.cepages.length) return p.cepages.filter(Boolean);
  return p.cepage ? [p.cepage] : [];
}

/* Le dernier travail enregistre sur une parcelle.
   ⚠️ Le journal porte AUSSI les releves meteo (j.meteo) : sans ce filtre, la
   « derniere intervention » d'une parcelle serait une note de pluie. C'est le
   meme filtre que l'export JSON. */
function _vgnDernierTravail(){
  var out = {};
  (window.JOURNAL || []).forEach(function(j){
    if(!j || j.meteo || !j.parcelle || !j.date) return;
    var k = String(j.parcelle);
    if(!out[k] || String(j.date) > String(out[k].date)) out[k] = j;
  });
  return out;
}

function _vgnLignes(){
  var parcs   = window.PARCELLES || [];
  var taches  = (typeof window.getTachesSaison === 'function') ? (window.getTachesSaison() || []) : [];
  var ctrs    = (typeof window._mvKmlCtrs === 'function') ? (window._mvKmlCtrs() || {}) : {};
  var dernier = _vgnDernierTravail();
  var out = [];
  parcs.forEach(function(p){
    if(!p || !p.nom) return;
    var cl = (typeof window.getPCls === 'function') ? window.getPCls(p) : { pct:0, nbDone:0, nbTotal:0 };
    var rh = (typeof window._dpRendHistRows === 'function') ? (window._dpRendHistRows(p) || []) : [];
    var geo = (typeof window._mvParcGeo === 'function') ? window._mvParcGeo(p) : null;
    var j = dernier[String(p.nom)] || null;
    out.push({
      nom: String(p.nom),
      arrachee: p.statut === 'Arrachee',
      statut: String(p.statut || ''),
      ha: parseFloat(p.surface) || 0,
      commune: _vgnCommune(p),
      cepages: _vgnCepages(p),
      complantee: !!p.entreplantation,
      pct: cl.pct || 0, nbDone: cl.nbDone || 0, nbTotal: cl.nbTotal || 0,
      exclues: (p.tachesExclues || []).filter(function(t){
        return taches.some(function(x){ return x.nom === t; });
      }),
      trous: parseInt(p.plantation_trous, 10) || 0,
      dernier: j ? { date:j.date, tache:String(j.tache || j.activite || '') } : null,
      rend: rh.length ? rh[0] : null,
      geo: !!geo,
      contour: !!ctrs[String(p.nom).toLowerCase()]
    });
  });
  // Tri de tournee : par commune, puis par nom. ⚠️ Une commune VIDE trierait en
  // premier ; les parcelles sans commune passent donc en fin de liste, pas en
  // tete du document.
  out.sort(function(a, b){
    var ca = a.commune.toLowerCase(), cb = b.commune.toLowerCase();
    if(!ca !== !cb) return ca ? -1 : 1;
    if(ca !== cb) return ca < cb ? -1 : 1;
    return a.nom.localeCompare(b.nom, 'fr');
  });
  return out;
}

/* Repartition par cepage. ⚠️ Une parcelle complantee compte sa surface pour
   CHAQUE cepage present : la somme de cette colonne depasse alors la surface
   du domaine. Le document l'ecrit, plutot que de partager une surface qu'on
   n'a jamais mesuree rang par rang. */
function _vgnParCepage(lignes){
  var m = {};
  lignes.forEach(function(l){
    if(l.arrachee) return;
    var cs = l.cepages.length ? l.cepages : ['\u2014 non renseign\u00e9'];
    cs.forEach(function(c){
      if(!m[c]) m[c] = { cepage:c, n:0, ha:0 };
      m[c].n++; m[c].ha += l.ha;
    });
  });
  return Object.keys(m).map(function(k){ return m[k]; })
    .sort(function(a, b){ return b.ha - a.ha; });
}

function _vgnDoc(){
  var lignes = _vgnLignes();
  if(!lignes.length){ showToast('Aucune parcelle enregistr\u00e9e', '#B85A1A'); return; }
  var act = lignes.filter(function(l){ return !l.arrachee; });
  var arr = lignes.filter(function(l){ return l.arrachee; });
  if(!act.length){ showToast('Aucune parcelle active', '#B85A1A'); return; }

  var haAct = act.reduce(function(s, l){ return s + l.ha; }, 0);
  // La surface affichee est celle que l'application affiche partout ailleurs.
  var haRef = parseFloat(window.SURF_TOTALE);
  if(!isFinite(haRef) || haRef <= 0) haRef = haAct;

  // Avancement du domaine : PONDERE PAR LA SURFACE. Une moyenne simple ferait
  // peser une demi-ouvree autant qu'un hectare et demi.
  var pondere = haAct > 0
    ? Math.round(act.reduce(function(s, l){ return s + l.pct * l.ha; }, 0) / haAct)
    : 0;
  var finies = act.filter(function(l){ return l.pct === 100; }).length;

  var comms  = {}; act.forEach(function(l){ if(l.commune) comms[l.commune] = (comms[l.commune] || 0) + l.ha; });
  var nComm  = Object.keys(comms).length;
  var parCep = _vgnParCepage(lignes);
  var nCep   = parCep.filter(function(c){ return c.cepage.indexOf('non renseign') === -1; }).length;
  var cepTop = parCep.length ? parCep[0] : null;
  var saison = (typeof window._visuSaison === 'function') ? (window._visuSaison() || '') : '';

  var sansCep = act.filter(function(l){ return !l.cepages.length; });
  var sansGeo = act.filter(function(l){ return !l.geo; });
  var sansCtr = act.filter(function(l){ return !l.contour; });

  function tuile(lab, gros, unite, sous){
    return '<div class="cd-k"><b>' + lab + '</b><span>' + gros
      + (unite ? ' <small>' + unite + '</small>' : '') + '</span>'
      + (sous ? '<i>' + sous + '</i>' : '') + '</div>';
  }

  var corps = '<div class="cd-kpis">'
    + tuile('Parcelles', act.length, '', arr.length ? (arr.length + ' arrach\u00e9e' + (arr.length > 1 ? 's' : '') + ' en plus') : 'aucune arrach\u00e9e')
    + tuile('Surface', _vgnNum(haRef), 'ha', 'soit ' + _vgnNum(haAct / act.length) + ' ha en moyenne')
    + tuile('Communes', nComm || '\u2014', '', nComm ? Object.keys(comms).sort().join(', ') : 'aucune commune renseign\u00e9e')
    + tuile('C\u00e9pages', nCep || '\u2014', '', cepTop ? (_vgnEsc(cepTop.cepage) + ' en t\u00eate, ' + _vgnNum(cepTop.ha) + ' ha') : 'aucun c\u00e9page renseign\u00e9')
    + tuile('Avancement', pondere, '%', 'pond\u00e9r\u00e9 par la surface \u00b7 ' + finies + ' parcelle'
        + (finies > 1 ? 's' : '') + ' termin\u00e9e' + (finies > 1 ? 's' : '') + ' sur ' + act.length)
    + '</div>';

  function reperes(l){
    var m = '';
    if(!l.cepages.length) m += '<span class="vg-m">c\u00e9page</span>';
    if(!l.geo)            m += '<span class="vg-m">GPS</span>';
    if(!l.contour)        m += '<span class="vg-m">contour</span>';
    return m || '<span class="vg-ok">\u2713</span>';
  }
  function rendCell(l){
    if(!l.rend) return '\u2014';
    if(l.rend.kg_ha != null) return l.rend.millesime + ' \u00b7 ' + l.rend.kg_ha.toLocaleString('fr-FR') + ' kg/ha';
    return l.rend.millesime + ' \u00b7 ' + Math.round(l.rend.kg || 0).toLocaleString('fr-FR') + ' kg';
  }

  corps += '<h2>Les parcelles en production \u2014 ' + act.length + ' sur ' + _vgnNum(haRef) + ' ha</h2>'
    + '<table><thead><tr><th>Parcelle</th><th>Commune</th><th class="n">ha</th><th>C\u00e9page(s)</th>'
    + '<th class="n">Avanc.</th><th class="n">T\u00e2ches</th><th>Dernier travail</th>'
    + '<th>Dernier rendement</th><th>\u00c0 renseigner</th></tr></thead><tbody>'
    + act.map(function(l){
        var cep = l.cepages.length
          ? _vgnEsc(l.cepages.join(' \u00b7 ')) + (l.complantee ? ' <i style="color:#8A8272">complant\u00e9e</i>' : '')
          : '<span style="color:#A89E8C">\u2014</span>';
        return '<tr><td>' + _vgnEsc(l.nom) + (l.trous > 0 ? ' <i style="color:#8A8272">' + l.trous + ' trous</i>' : '') + '</td>'
          + '<td>' + (l.commune ? _vgnEsc(l.commune) : '<span style="color:#A89E8C">\u2014</span>') + '</td>'
          + '<td class="n">' + _vgnNum(l.ha) + '</td>'
          + '<td>' + cep + '</td>'
          + '<td class="n">' + l.pct + ' %<span class="vg-bar"><i style="width:' + l.pct + '%"></i></span></td>'
          + '<td class="n">' + l.nbDone + '/' + l.nbTotal
            + (l.exclues.length ? '<i style="display:block;color:#8A8272;font-style:normal">'
                + l.exclues.length + ' hors sujet</i>' : '') + '</td>'
          + '<td>' + (l.dernier ? (_vgnEsc(l.dernier.tache) + ' \u00b7 ' + _vgnDateFr(l.dernier.date))
                                : '<span style="color:#A89E8C">aucun</span>') + '</td>'
          + '<td>' + rendCell(l) + '</td>'
          + '<td>' + reperes(l) + '</td></tr>';
      }).join('')
    + '<tr class="tot"><td colspan="2">Total \u2014 ' + act.length + ' parcelles</td>'
    + '<td class="n">' + _vgnNum(haAct) + '</td><td></td>'
    + '<td class="n">' + pondere + ' %</td><td colspan="4"></td></tr>'
    + '</tbody></table>'
    + '<div class="cd-note">L\u2019avancement d\u2019une parcelle est le nombre de t\u00e2ches valid\u00e9es sur le '
    + 'nombre de t\u00e2ches qui la concernent : les t\u00e2ches marqu\u00e9es <b>hors sujet</b> sur cette parcelle '
    + 'ne comptent ni au num\u00e9rateur ni au d\u00e9nominateur. Le total, lui, est <b>pond\u00e9r\u00e9 par la '
    + 'surface</b>. Le dernier travail vient du journal, hors rel\u00e9v\u00e9s m\u00e9t\u00e9o.</div>';

  corps += '<h2>Par c\u00e9page</h2>'
    + '<table><thead><tr><th>C\u00e9page</th><th class="n">Parcelles</th><th class="n">ha</th>'
    + '<th class="n">Part du domaine</th></tr></thead><tbody>'
    + parCep.map(function(c){
        return '<tr><td>' + _vgnEsc(c.cepage) + '</td><td class="n">' + c.n + '</td>'
          + '<td class="n">' + _vgnNum(c.ha) + '</td>'
          + '<td class="n">' + (haAct > 0 ? Math.round(c.ha / haAct * 100) : 0) + ' %</td></tr>';
      }).join('')
    + '</tbody></table>'
    + '<div class="cd-note">Une parcelle <b>complant\u00e9e</b> compte sa surface enti\u00e8re pour chacun de '
    + 'ses c\u00e9pages : la somme de cette colonne peut donc d\u00e9passer la surface du domaine. Rien ne '
    + 'permet de partager une surface rang par rang, et un partage invent\u00e9 serait pire qu\u2019un '
    + 'double compte annonc\u00e9.</div>';

  if(sansCep.length || sansGeo.length || sansCtr.length){
    corps += '<h2>Ce qu\u2019il reste \u00e0 renseigner</h2><div class="cd-vide">';
    if(sansCep.length) corps += '<b>C\u00e9page absent</b> (' + sansCep.length + ') : '
      + sansCep.map(function(l){ return _vgnEsc(l.nom); }).join(', ') + '.<br>';
    if(sansGeo.length) corps += '<b>Aucune position</b> (' + sansGeo.length + ') : '
      + sansGeo.map(function(l){ return _vgnEsc(l.nom); }).join(', ')
      + ' \u2014 sans position, pas de m\u00e9t\u00e9o de secteur ni de tri par proximit\u00e9.<br>';
    if(sansCtr.length) corps += '<b>Aucun contour sur la carte</b> (' + sansCtr.length + ') : '
      + sansCtr.map(function(l){ return _vgnEsc(l.nom); }).join(', ') + '.';
    corps += '</div>';
  }

  if(arr.length){
    corps += '<h2>Parcelles arrach\u00e9es \u2014 ' + arr.length + '</h2>'
      + '<table><thead><tr><th>Parcelle</th><th>Commune</th><th class="n">ha</th>'
      + '<th>C\u00e9page(s)</th><th>Dernier rendement connu</th></tr></thead><tbody>'
      + arr.map(function(l){
          return '<tr class="vg-ar"><td>' + _vgnEsc(l.nom) + '</td>'
            + '<td>' + _vgnEsc(l.commune) + '</td><td class="n">' + _vgnNum(l.ha) + '</td>'
            + '<td>' + _vgnEsc(l.cepages.join(' \u00b7 ')) + '</td>'
            + '<td>' + rendCell(l) + '</td></tr>';
        }).join('')
      + '</tbody></table>'
      + '<div class="cd-note">Elles sortent de la surface du domaine et de tous les avancements, '
      + 'mais leur historique reste : c\u2019est pourquoi elles figurent ici.</div>';
  }

  corps += '<div class="mvdoc-lim"><b>Ce document pr\u00e9sente ce que vous avez enregistr\u00e9.</b> '
    + 'C\u2019est un \u00e9tat interne : il ne tient lieu ni de d\u00e9claration de surface, ni de casier '
    + 'viticole. L\u2019avancement porte sur la p\u00e9riode consult\u00e9e'
    + (saison ? ' \u2014 <b>' + _vgnEsc(saison) + '</b>' : '')
    + ' : changez de p\u00e9riode dans la Vigne et le document suivra. '
    + '<b>Aucune heure ne figure ici</b> : les heures restantes se lisent au Pilotage et dans le '
    + 'rapport de saison, qui les calculent \u00e0 partir du bar\u00e8me. Les rendements viennent de vos '
    + 'saisies de vendange, ramen\u00e9es \u00e0 la surface de la parcelle.</div>';

  if(typeof window._mvDocOpen !== 'function'){
    showToast('Mise \u00e0 jour incompl\u00e8te \u2014 rechargez l\u2019application', '#B85A1A'); return;
  }
  window._mvDocOpen({
    titre: '\u00c9tat du vignoble',
    orient: 'paysage', cat: 'parcelles', css: MV_VGNDOC_CSS, corps: corps,
    metas: [act.length + ' parcelle' + (act.length > 1 ? 's' : '') + ' \u00b7 ' + _vgnNum(haRef) + ' ha',
            saison, '\u00c9dit\u00e9 le ' + new Date().toLocaleDateString('fr-FR')]
  });
  showToast('\u{1F5FA} \u00c9tat du vignoble \u00b7 ' + act.length + ' parcelles', '#3D6B27');
}

window._vgnExportVignoble = function(){ _vgnDoc(); };
window._vgnLignes         = _vgnLignes;
window._vgnParCepage      = _vgnParCepage;
window._vgnDoc            = _vgnDoc;

/* ══════════════════════════════════════════════════════════════════════════
   HUB DOCUMENTS — le panneau du relevé individuel
   ══════════════════════════════════════════════════════════════════════════
   Le relevé individuel demande DEUX choses avant de sortir : qui, et quel
   mois. Une saisie libre (openPrompt) ne convient pas pour un nom — on ne tape
   pas « Victor » sans risque de faute de frappe. Il lui faut donc un panneau,
   comme en ont deja le releve mensuel et le reglage des heures de saison.

   ⚠️ Le panneau est CONSTRUIT EN JS, pas ecrit dans index.html : injection
   idempotente dans #docs-pane. C'est le patron deja employe par le Cuvier pour
   ses feuilles — il evite de faire grossir un index.html de 268 ko pour trois
   champs, et il garde le panneau a cote du code qui le lit.

   ⚠️ Le mois et l'annee proposes sont CEUX DU PLANNING, pas la date du jour :
   on edite un releve en regardant l'ecran qu'on vient de quitter. Le document,
   lui, ne deplace jamais le mois du Planning (cf. _planReleveIndiv).
   ══════════════════════════════════════════════════════════════════════════ */

var MV_DOCS_MOIS = ['Janvier','F\u00e9vrier','Mars','Avril','Mai','Juin',
                    'Juillet','Ao\u00fbt','Septembre','Octobre','Novembre','D\u00e9cembre'];

function _docsReleveOpen(){
  var pane = document.getElementById('docs-pane');
  if(!pane){ if(window.showToast) window.showToast('\u00c9cran indisponible', '#B85A1A'); return; }
  var mbrs = (typeof window._planReleveMbrs === 'function') ? (window._planReleveMbrs() || []) : [];
  if(!mbrs.length){
    if(window.showToast) window.showToast('Aucun salari\u00e9 actif', '#B85A1A');
    return;
  }
  var host = document.getElementById('docs-pane-releve');
  if(!host){
    host = document.createElement('div');
    host.id = 'docs-pane-releve';
    host.style.display = 'none';
    pane.appendChild(host);
  }
  var mSel = (typeof window._planReleveMois === 'function') ? window._planReleveMois() : 0;
  var an   = (typeof window._planReleveAn   === 'function') ? window._planReleveAn()   : new Date().getFullYear();
  host.innerHTML = '<div style="background:var(--phyto-pale);border-radius:14px;padding:14px 16px">'
    + '<div style="font-size:13px;font-weight:700;color:var(--phyto-med,#7B6DB8);margin-bottom:12px">'
      + '\u{1F464} Relev\u00e9 individuel d\u2019un salari\u00e9</div>'
    + '<div class="fl" style="margin-top:0">Salari\u00e9</div>'
    + '<select class="fi" id="docs-rlv-nom" style="width:100%;margin-bottom:10px">'
      + mbrs.map(function(m){
          return '<option value="' + _docsEsc(m.nom) + '">' + _docsEsc(m.nom)
            + (m.coll ? ' \u2014 \u00e9quipe' : '') + '</option>';
        }).join('')
    + '</select>'
    + '<div class="fl" style="margin-top:0">Mois \u00b7 ' + an + '</div>'
    + '<select class="fi" id="docs-rlv-mois" style="width:100%;margin-bottom:12px">'
      + MV_DOCS_MOIS.map(function(nm, i){
          return '<option value="' + i + '"' + (i === mSel ? ' selected' : '') + '>' + nm + '</option>';
        }).join('')
    + '</select>'
    + '<div style="font-size:10px;color:var(--texte-doux);background:var(--fond-module);border-radius:8px;'
      + 'padding:6px 10px;margin-bottom:10px;line-height:1.45">'
      + 'Le mois jour par jour, les contrats et leurs dates, les cong\u00e9s pay\u00e9s, le compteur d\u2019heures '
      + 'et l\u2019annualisation de l\u2019ann\u00e9e ' + an + '. Deux lignes de signature en bas de page. '
      + 'L\u2019ann\u00e9e est celle consult\u00e9e au Planning.</div>'
    + '<button onclick="_docsReleveGo()" style="background:var(--phyto-med,#7B6DB8);color:white;border:none;'
      + 'border-radius:10px;padding:11px 18px;font-size:13px;font-weight:600;font-family:\'Outfit\',sans-serif;'
      + 'width:100%;cursor:pointer">\u{1F5A8}\u{FE0F} \u00c9diter le relev\u00e9</button>'
    + '</div>';
  _docsPane('docs-pane-releve');
}

window._docsReleveGo = function(){
  var n = document.getElementById('docs-rlv-nom');
  var m = document.getElementById('docs-rlv-mois');
  if(!n || !m){ if(window.showToast) window.showToast('\u00c9cran indisponible', '#B85A1A'); return; }
  if(typeof window._planReleveIndiv !== 'function'){
    if(window.showToast) window.showToast('Mise \u00e0 jour incompl\u00e8te \u2014 rechargez l\u2019application', '#B85A1A');
    return;
  }
  // ⚠️ On relit les DEUX champs dans le DOM au moment du clic — jamais une
  // valeur memorisee a l'ouverture du panneau (§30i).
  window._planReleveIndiv(n.value, parseInt(m.value, 10));
};

window._docsReleveOpen = _docsReleveOpen;
