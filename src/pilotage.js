// ════════════════════════════════════
// MA VIGNE — pilotage.js
// Écran de pilotage admin (ordinateur) : KPI, graphes natifs (barres + donut SVG),
// panneaux, personnalisation par utilisateur. LECTURE SEULE des données
// (via globals exposés par app.js). Aucune écriture en base.
// Le thème (clair/sombre) suit l'app via les variables CSS (--texte, --or, …).
// © 2026 Nicolas GUERET / GUERETTECH
// ════════════════════════════════════

const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if (DEBUG) console.log('[Ma Vigne] pilotage.js chargé');

// ── Helpers ──────────────────────────────────────────────
function _pilEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function _pilNum(n){ return Math.round(Number(n)||0).toLocaleString('fr-FR'); }
function _pilTnom(n){ return (typeof window.tNom==='function') ? window.tNom(n) : n; }
// pctColor — dégradé terre → ambre → vert vigne (cohérent avec la carte parcelles)
function _pilPctColor(p){ return p>=85?'#5B9B3A':p>=65?'#7FA83A':p>=45?'#D9A441':p>=25?'#C8853A':'#9A5A38'; }
// ════════════════════════════════════════════════════════════════════════════
// LA PALETTE SEMANTIQUE — un nom, un sens, une couleur.
// Chaque graphe du module tire ses couleurs d'ICI, jamais d'un hex ecrit sur
// place. Le motif corrige : `c.col.alerte` servait A LA FOIS au renfort a
// trouver (des barres) et au trait d'aujourd'hui (un reperage) dans la MEME
// image — deux choses sans rapport sous une seule couleur, donc une image qui
// se lit de travers. « aujourdhui » a desormais son encre a lui.
// ⚠️ A DEPLACER dans utils.js au prochain lot qui bumpe (une palette ne
//    devrait pas vivre dans un module). Elle est ici pour rester sans bump.
// ════════════════════════════════════════════════════════════════════════════
var _PIL_SEM = {
  fait:       '#3D6B27',   // fait, absorbe par l'equipe, couvert
  reste:      '#C2A14D',   // reste a faire — n'alarme pas
  faute:      '#A0291E',   // manque, depassement, sous-effectif
  socle:      '#4A9FC8',   // reference : socle permanent, moyenne
  hors:       '#DED7C9',   // hors portee
  sel:        '#8A5A38',   // la selection en cours
  aujourdhui: '#14110D'    // le trait du jour — un REPERE, pas une alerte
};
// ── Une polyligne qui se COUPE sur un trou ─────────────────────────────────
// pts = [{x0,x1,y,gap}] deja projetes. `gap:true` = pas de mesure ici.
// Sans cette rupture, deux periodes separees par trois semaines vides sont
// reliees par un segment droit : le trait AFFIRME un effectif sur une fenetre
// ou personne n'a rien compte. Un trou n'est pas un zero, et ce n'est pas
// davantage une interpolation.
function _pilPolyBreak(pts){
  var d='', ouvert=false, i;
  for(i=0;i<pts.length;i++){
    var q=pts[i];
    if(q.gap){ ouvert=false; continue; }
    d += (ouvert?' L':(d?' M':'M')) + q.x0.toFixed(1) + ' ' + q.y.toFixed(1)
       + ' L' + q.x1.toFixed(1) + ' ' + q.y.toFixed(1);
    ouvert=true;
  }
  return d;
}
var _PIL_PIE_COLORS = ['#7A1020','#C8853A','#5B2D8E','#5B9B3A','#C9A84C','#1A5276','#2E5220','#9A5A38','#B23A52','#3D6B27','#8A5A2E','#1A4A7A'];

// ── État de personnalisation (localStorage par utilisateur) ──────────
function _pilTenant(){ try{ return localStorage.getItem('mavigne_tenant')||'default'; }catch(e){ return 'default'; } }
function _pilUserKey(){ var u=(window.currentUser&&window.currentUser.nom)||'anon'; return 'mavigne_pilote_'+_pilTenant()+'_'+u; }
function _pilDomKey(){ return 'mavigne_pilote_dom_'+_pilTenant(); }
// Refonte : navigation par onglets thématiques. La perso est désormais une visibilité
// d'éléments PAR ONGLET (show), mémorisée par utilisateur. pie/bar/collapsed/sub pilotent
// les comportements internes des panneaux réutilisés.
var _PIL_DEFAULT = {
  show: {
    // Aujourd'hui (cockpit)
    auj_marge:1, auj_charge:1, auj_cadence:1, auj_budget:1, auj_etp:1, auj_jours:1, auj_pres:1, auj_traiter:1, auj_prio:1, auj_alertes:1,
    // Avancement
    avc_gauge:1, avc_bar:1, avc_pie:1, avc_echeances:1, avc_carte:1, avc_etp:1,
    // Personnel
    prs_equipe:1, prs_presences:1, prs_capacite:1,
    // Matériel
    mat_tracteur:1, mat_gnr:1, mat_phyto:1, mat_traitement:1,
    // Simulation
    sim_ordre:1, sim_etsi:1, sim_cout:1,
    // Conformité
    cfm_cuivre:1, cfm_ift:1, cfm_dre:1
  },
  pie:   'reste',
  bar:   'saison',
  collapsed:{echeances:0,carte:0,etp:0,equipe:0,tracteur:0,cave:0,presences:0,gnr:0,capacite:0,traitement:0,simulateur:0,phyto:0,cout:0,couteff:0,cuivre:0,ift:0,dre:0},
  sub:   {trac_revision:1,trac_controle:1,trac_repar:1,trac_intercep:1,cave_fml:1,cave_sout:1,cave_ouillage:1,pres_cp:1,pres_recup:1,pres_mal:1,etp_frise:1,etp_courbe:1,etp_ecart:1,etp_annee:1}
};
function _pilCloneDefault(){ return JSON.parse(JSON.stringify(_PIL_DEFAULT)); }
function _pilNormalize(st){
  if(!st || typeof st!=='object') return null;
  var def=_pilCloneDefault();
  function mergeObj(cur,d){ var o={}; Object.keys(d).forEach(function(k){ o[k]=(cur&&cur[k]!==undefined)?(cur[k]?1:0):d[k]; }); return o; }
  return { show:mergeObj(st.show,def.show), pie:st.pie||def.pie, bar:st.bar||def.bar, collapsed:mergeObj(st.collapsed,def.collapsed), sub:mergeObj(st.sub,def.sub) };
}
function _pilShow(id){ var s=(_PIL_STATE&&_PIL_STATE.show)||{}; return s[id]!==0; }
// Les deux onglets composites portent un intertitre par moitie. Sans ce test,
// masquer tous les indicateurs d'une moitie laisserait son titre orphelin.
function _pilAnyShow(ids){ for(var i=0;i<ids.length;i++){ if(_pilShow(ids[i])) return true; } return false; }
function _pilLoadState(){
  try{ var raw=localStorage.getItem(_pilUserKey()); if(raw){ var n=_pilNormalize(JSON.parse(raw)); if(n) return n; } }catch(e){}
  try{ var rawD=localStorage.getItem(_pilDomKey()); if(rawD){ var nd=_pilNormalize(JSON.parse(rawD)); if(nd) return nd; } }catch(e){}
  return _pilCloneDefault();
}
function _pilSaveState(st){ try{ localStorage.setItem(_pilUserKey(), JSON.stringify(st)); }catch(e){} }
var _PIL_STATE = null;
var _PIL_TAB = 'auj';
var _PIL_CAVSUB = 'urg';
// 5 onglets VISIBLES (regroupement : Personnel+Materiel -> Equipe ; Economie+Conformite -> Eco & conformite).
// Les fonctions de rendu internes (_pilTabPrs/_pilTabMat/_pilTabEco/_pilTabCfm) restent inchangees.
// La barre suit la progression d'une campagne : ou j'en suis -> ce qui vient ->
// ce que je decide -> avec qui -> ce que ca coute. « Decider » etait enterre dans
// le menu Outils au motif qu'il servait peu ; c'est la seule page ou l'on arbitre
// quelque chose. « Archives » prend sa place dans les Outils : deux consultations
// par an, contre un usage hebdomadaire en pleine campagne.
// Libelles de barre COURTS (un mot), titres complets dans _PIL_LABELS.
// L'ECONOMIE et la CONFORMITE partageaient un seul onglet. Deux metiers, deux
// questions, deux rythmes : l'une se consulte le lundi matin, l'autre avant un
// controle. Les melanger obligeait a masquer la moitie de l'ecran pour lire l'autre.
var _PIL_TABS = [['auj','\uD83E\uDDED','Aujourd\'hui'],['avc','\uD83C\uDF47','Avancement'],['sim','\uD83C\uDF9B\uFE0F','Décider'],['equ','\uD83D\uDC65','Équipe'],['cav','\uD83C\uDF77','Cave'],['eco','\uD83D\uDCB6','Économie'],['cfm','\uD83D\uDEE1\uFE0F','Conformité']];
// Outils : accessibles par le bouton dedie, pas dans la barre.
var _PIL_TOOLS = [['arc','\uD83D\uDDC3\uFE0F','Archives'],['param','\u2699\uFE0F','Paramétrage']];
var _PIL_LABELS = {auj:'Aujourd\'hui',avc:'Avancement',equ:'Équipe & matériel',cav:'Cave',eco:'Économie — budget, rythme de dépense et prix de revient',cfm:'Conformité — cuivre, passages phyto et délai de rentrée',arc:'Archives des campagnes',sim:'Décider — effectif, renfort et ordre de passage',param:'Paramétrage'};
var _PIL_VALID_TAB = {auj:1,avc:1,equ:1,cav:1,eco:1,cfm:1,arc:1,sim:1,param:1};
// Migration des onglets memorises avant le regroupement.
// Migration des cles memorisees : `ecf` (l'onglet composite) part sur l'economie.
// `eco` et `cfm` etaient des cles historiques deja vues : elles redeviennent valides.
var _PIL_TAB_MIGR = {prs:'equ',mat:'equ',ecf:'eco'};
function _pilTabKey(){ return 'mavigne_pil_tab_'+_pilTenant(); }
function _pilLoadTab(){ try{ var t=localStorage.getItem(_pilTabKey()); if(_PIL_TAB_MIGR[t]) t=_PIL_TAB_MIGR[t]; if(_PIL_VALID_TAB[t]) return t; }catch(e){} return 'auj'; }
function _pilSaveTab(t){ try{ localStorage.setItem(_pilTabKey(), t); }catch(e){} }
function _pilCavKey(){ return 'mavigne_pil_cav_'+_pilTenant(); }
// Cles refondues (urg/mil/parc). Les anciennes (elv/vin/ven) sont MIGREES
// plutot que rejetees : sans table, l'utilisateur retombait sans explication
// sur le premier onglet. Meme principe que _PIL_TAB_MIGR.
var _PIL_CAV_MIGR = {elv:'urg', vin:'urg', ven:'mil'};
function _pilLoadCav(){ try{ var t=localStorage.getItem(_pilCavKey());
  if(_PIL_CAV_MIGR[t]) t=_PIL_CAV_MIGR[t];
  if(t==='urg'||t==='mil'||t==='parc') return t; }catch(e){} return 'urg'; }
function _pilSaveCav(t){ try{ localStorage.setItem(_pilCavKey(), t); }catch(e){} }
function _pilTabLabel(tab){ return _PIL_LABELS[tab]||''; }
var _PIL_TASK_COL={reparation:'#8A5A38',pliage:'#C8B020',entreplantation:'#7A1020',plantation:'#7A1020',relevage:'#3D6B27',palissage:'#B89A4A',ebourgeonnage:'#5C8A3E',accolage:'#C2871E',pioche:'#A9744B'};
function _taskColor(nom){ return _PIL_TASK_COL[_friseNorm(nom)]||'#8A5A38'; }

// ── Icônes SVG trait fin (remplaçant les emojis des en-têtes) ──
function _pilIco(n){
  var P={
    users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    drop:'<path d="M12 2.7 6.4 9.2a7 7 0 1 0 11.2 0L12 2.7z"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5V5M12 19v3.5M1.5 12H5M19 12h3.5"/>',
    map:'<path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z"/><path d="M9 7v13M15 4v13"/>',
    tractor:'<circle cx="7" cy="17" r="4"/><circle cx="18" cy="18" r="2.5"/><path d="M11 17h4.5M7 13V7h7l3 6"/><path d="M14 7V4h-4"/>',
    wine:'<path d="M8 22h8M12 15v7M8 2h8l-1 8a3.5 3.5 0 0 1-6 0L8 2z"/>',
    leaf:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/>',
    calendar:'<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    scale:'<path d="M12 3v18M3 21h18"/><path d="M5 7l-3 6a3.5 3.5 0 0 0 7 0L6 7M19 7l-3 6a3.5 3.5 0 0 0 7 0l-3-6"/><path d="M4 7h16"/>',
    sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>',
    fuel:'<path d="M5 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18"/><path d="M3 22h14M15 9h3a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
    spray:'<path d="M12 2v7"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v5M8 22h8"/>',
    cloud:'<path d="M20 17.6A5 5 0 0 0 18 8h-1.3A8 8 0 1 0 4 16.3"/>',
    flask:'<path d="M10 2v6L4.5 18a2.5 2.5 0 0 0 2.2 3.7h10.6a2.5 2.5 0 0 0 2.2-3.7L14 8V2"/><path d="M8 2h8M7 15h10"/>',
    chart:'<path d="M3 3v18h18"/><path d="M7 14l4-4 4 3 5-6"/>'
  };
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(P[n]||P.chart)+'</svg>';
}
var _PIL_TILE_ICO={couteff:'scale',carte:'map',equipe:'users',tracteur:'tractor',cave:'wine',presences:'users',phyto:'leaf',echeances:'calendar',etp:'scale',capacite:'scale',simulateur:'sliders',ordrepassage:'target',gnr:'fuel',traitement:'spray',meteo:'cloud',vinif:'flask',cout:'scale',cuivre:'flask',ift:'spray',dre:'drop'};
function _pilIcoFor(id){ return _pilIco(_PIL_TILE_ICO[id]||'chart'); }
function _pilHa(v){ return (Number(v)||0).toLocaleString('fr-FR',{minimumFractionDigits:0,maximumFractionDigits:2}).replace(/\u202f/g,' '); }

// ── EFFECTIF : qui compte, et a quelle date ──────────────────────────
// ⚠⚠ Ce module ne connaissait PAS la notion de contrat : `fin_contrat` n'y
// apparaissait nulle part. Il ne filtrait que sur statut !== 'Inactif', or ce
// statut se met a la main. Un saisonnier dont le CDD s'est termine restait donc
// compte partout : carte Equipe, presences du jour, effectif au champ, cadence de
// secours (7 h x nV), date de fin de saison, simulateur de journee, taux horaire
// moyen. Seul cd.weeks[].head etait juste — il vient de planning.js, qui teste le
// contrat jour par jour. DEUX definitions de « combien on est » dans le meme
// module, c'est la garantie que deux ecrans se contredisent.
// La regle vit desormais dans utils.js (window._mvEnContratLe), une seule fois.

// Date de reference des effectifs = aujourd'hui si aujourd'hui tombe dans la
// periode CONSULTEE, sinon une date interieure a cette periode. Consulter une
// archive doit montrer l'equipe de l'epoque, pas celle d'aujourd'hui.
function _pilRefDate(){
  var t=new Date();
  var ds=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  var s=(typeof window._pilSaison==='function')?window._pilSaison():null;
  if(!s || !s.debut || !s.fin) return ds;
  if(ds>=s.debut && ds<=s.fin) return ds;
  return (ds>s.fin) ? s.fin : s.debut;
}
// Membres qui comptent dans l'effectif a la date ds : actifs ET sous contrat.
// ARBITRAGE ASSUME (03/08/2026) — les EQUIPES COLLECTIVES ne sont PAS depliees ici.
// Cette liste alimente la cadence de secours (7 h x nV), le simulateur d'ordre de
// passage et le pool du simulateur de journee : trois ecrans qui raisonnent sur les
// TRAVAUX DE LA VIGNE, faits par l'equipe permanente. Y injecter 30 vendangeurs
// ferait passer « equipe au complet » de 2 a 32 pendant la fenetre de vendange et
// rendrait ces simulateurs illisibles douze jours par an, pour un gain nul : on ne
// planifie pas un relevage avec des vendangeurs.
// Le poids joue la ou il y a une MESURE reelle : cout par parcelle
// (_ecoEquipeByParc), effectif present hebdomadaire (cd.weeks[].head) et carte
// Equipe. Le socle permanent reste lisible via cd.weeks[].headPerm.
function _pilMembresActifs(ds){
  var d=ds||_pilRefDate();
  return (window.MEMBRES||[]).filter(function(m){
    return m && m.statut!=='Inactif' && window._mvEnContratLe(m,d);
  });
}
// Fiches restees « Actives » alors que le contrat est echu : ce sont elles qui
// gonflaient les compteurs. On les affiche en clair plutot que de laisser un
// effectif baisser sans explication.
function _pilMbrFinis(ds){
  var d=ds||_pilRefDate();
  return (window.MEMBRES||[]).filter(function(m){
    return m && m.statut!=='Inactif' && window._mvContratFini(m,d);
  });
}

// ── Agrégation des données (lecture seule) ───────────────────────────
function _pilData(){
  var ch = (typeof window.calcHeures==='function') ? window.calcHeures() : { data:[], totalReste:0, totalTotal:0 };
  var data = (ch && ch.data) || [];
  var totalReste = Math.round((ch&&ch.totalReste)||0);
  var totalTotal = Math.round((ch&&ch.totalTotal)||0);
  var hDone = Math.max(0, totalTotal - totalReste);
  var gaugePct = totalTotal>0 ? Math.round(hDone/totalTotal*100) : 100;

  var active = data.filter(function(t){ return (t.pct||0) < 100; });
  var done   = data.filter(function(t){ return (t.pct||0) >= 100; });

  var saison = (typeof window._pilSaison==='function' && window._pilSaison()) ? (window._pilSaison().nom||'—') : '—';
  var surfTot = (typeof window._recalcSurfTotale==='function') ? (Number(window._recalcSurfTotale())||0) : ((typeof window.SURF_TOTALE!=='undefined') ? (Number(window.SURF_TOTALE)||0) : 0);
  var parc = (window.PARCELLES||[]);
  var nActives = parc.filter(function(p){ return p && p.statut!=='Arrachee'; }).length;
  // Effectif a la date de reference : actifs ET sous contrat (cf. bloc EFFECTIF ci-dessus).
  var _refDs  = _pilRefDate();
  var membres = _pilMembresActifs(_refDs);
  var nFinis  = _pilMbrFinis(_refDs).length;

  // Tâche prioritaire : tâche en cours avec le plus d'heures restantes
  var prio=null;
  active.forEach(function(t){ if(!prio || (t.h_reste||0) > (prio.h_reste||0)) prio=t; });

  // Sessions tracteur : la plus récente + avancement (surface faite / surface totale)
  var sessions = (window.SESSIONS||[]).slice().filter(window._sessInSaison||function(){return true;});
  sessions.sort(function(a,b){ return String((b&&b.date)||'').localeCompare(String((a&&a.date)||'')); });
  var lastSess = sessions[0]||null;
  var sessAdv = 0, sessDone=0;
  if(lastSess && lastSess.parcellesFaites){
    (lastSess.parcellesFaites||[]).forEach(function(x){
      var nom = typeof x==='string' ? x : (x&&x.nom);
      var p = parc.find(function(pp){ return pp && pp.nom===nom; });
      if(p) sessDone += (p.surface||0);
    });
    sessAdv = surfTot>0 ? Math.round(sessDone/surfTot*100) : 0;
  }

  // Cave — cuvées en élevage
  var cuvees = (window.CAVE_ELEVAGE && window.CAVE_ELEVAGE.cuvees) || [];

  // Phyto — interventions enregistrées (registre réglementaire)
  var traits = (window.TRAITEMENTS||[]).slice();
  traits.sort(function(a,b){ return String((b&&b.date)||'').localeCompare(String((a&&a.date)||'')); });

  var meteo = window.meteoData || null;
  // ── Tracteurs enrichis : révision, dernier contrôle, réparation, session en cours ──
  var REP = window.REPARATEUR || {};
  var ENTS = window.ENTRETIENS || [];
  var tracs = (window.TRACTEURS_LIST || []).map(function(t){
    var rep = REP[t.id] || null;
    var ents = ENTS.filter(function(f){ return f && f.tracteurId===t.id; }).sort(function(a,b){ return String((b&&b.date)||'').localeCompare(String((a&&a.date)||'')); });
    var lastCtrl = ents[0] ? ents[0].date : null;
    var ts = sessions.filter(function(s){ return s && s.tracteurId===t.id; });
    var sess=null, sAdv=0;
    if(ts[0]){
      var sd=0;
      (ts[0].parcellesFaites||[]).forEach(function(x){ var nm=typeof x==='string'?x:(x&&x.nom); var p=parc.find(function(pp){ return pp&&pp.nom===nm; }); if(p) sd+=(p.surface||0); });
      sAdv = surfTot>0 ? Math.round(sd/surfTot*100) : 0; sess=ts[0];
    }
    var hasComp = (t.compteur_h!=null && t.compteur_h!=='' && t.revision_h!=null && t.revision_h!=='');
    var revReste = hasComp ? (Number(t.revision_h)-Number(t.compteur_h)) : null;
    return { id:t.id, nom:t.nom, traitementOnly:t.traitementOnly, rep:rep, lastCtrl:lastCtrl, sess:sess, sAdv:sAdv, revReste:revReste };
  });
  var nRepar = tracs.filter(function(t){ return t.rep; }).length;

  // ── Cuve GNR (lecture seule depuis CONFIG) + seuil d'alerte ouillage ──
  var gnr = (window.CONFIG && window.CONFIG.gnr) || null;
  var ouAlerte = (window.CAVE_ELEVAGE && window.CAVE_ELEVAGE.config && window.CAVE_ELEVAGE.config.ouillage_alerte_j) || 14;

  // ── Présences du jour (CP / maladie / absence / récup) ──
  var _now=new Date(), _yNum=_now.getFullYear(), _mIdx=_now.getMonth(), _dNum=_now.getDate();
  var PE = window.PLANNING_ENTRIES || {};
  var presences = membres.map(function(m){
    var _by = (PE[m.nom] && PE[m.nom][_yNum]) || null;
    var e = (_by && _by[_mIdx] && _by[_mIdx][_dNum]) || null;
    var etat='present', motif='';
    if(e){
      if(e.type==='cp') etat='cp';
      else if(e.type==='recup') etat='recup';
      else if(e.absent){ motif=e.comment||''; etat=/malad/i.test(motif)?'maladie':'absent'; }
    }
    return { nom:m.nom, etat:etat, motif:motif, bureau:!!m.bureau };
  });
  var nPresent = presences.filter(function(p){ return p.etat==='present'; }).length;
  var nCp = presences.filter(function(p){ return p.etat==='cp'; }).length;
  var nAbs = presences.filter(function(p){ return p.etat==='maladie'||p.etat==='absent'; }).length;
  var nRecup = presences.filter(function(p){ return p.etat==='recup'; }).length;
  // Effectif réellement présent au champ aujourd'hui (hors bureau, hors indisponibles)
  var nVchamp = presences.filter(function(p){ return !p.bureau; }).length;
  var nIndispoChamp = presences.filter(function(p){ return !p.bureau && p.etat!=='present'; }).length;
  var presentChamp = Math.max(0, nVchamp - nIndispoChamp);

  var domaine = window.DOMAINE_NOM || 'Domaine';

  return { data:data, active:active, done:done, totalReste:totalReste, totalTotal:totalTotal, hDone:hDone, gaugePct:gaugePct,
           saison:saison, surfTot:surfTot, nActives:nActives, membres:membres, refDate:_refDs, nFinis:nFinis, prio:prio,
           sessions:sessions, lastSess:lastSess, sessAdv:sessAdv, cuvees:cuvees, traits:traits, meteo:meteo, domaine:domaine,
           tracs:tracs, nRepar:nRepar, gnr:gnr, ouAlerte:ouAlerte, presences:presences, nPresent:nPresent, nCp:nCp, nAbs:nAbs, nRecup:nRecup, nVchamp:nVchamp, presentChamp:presentChamp, nIndispoChamp:nIndispoChamp };
}


// ── Données du donut selon la métrique choisie ───────────────────────
function _pilPieData(d){
  var src=[], title='', unit='h';
  if(_PIL_STATE.pie==='fait'){      title='Temps réalisé';     src=d.data.map(function(t){return {n:t.nom,v:Math.round(t.h_done||0)};}); }
  else if(_PIL_STATE.pie==='plan'){ title='Charge planifiée';  src=d.data.map(function(t){return {n:t.nom,v:Math.round(t.h_total||0)};}); }
  else {                            title='Charge restante';   src=d.data.map(function(t){return {n:t.nom,v:Math.round(t.h_reste||0)};}); }
  src = src.filter(function(x){ return x.v>0; }).sort(function(a,b){ return b.v-a.v; });
  src.forEach(function(x,i){ x.c=_PIL_PIE_COLORS[i%_PIL_PIE_COLORS.length]; });
  return { title:title, unit:unit, items:src };
}

// ── Donut SVG ────────────────────────────────────────────────────────
function _pilDonutSVG(items){
  var tot = items.reduce(function(a,b){return a+b.v;},0);
  if(tot<=0) return '<div class="pil-empty">Aucune donnée</div>';
  var cx=92, cy=92, r=80, ri=57, ang=-Math.PI/2, paths='';
  if(items.length===1){
    // un seul segment : anneau complet (2 demi-arcs)
    var c=items[0].c;
    paths = '<circle cx="'+cx+'" cy="'+cy+'" r="'+((r+ri)/2)+'" fill="none" stroke="'+c+'" stroke-width="'+(r-ri)+'" class="pil-slice-ring"></circle>';
  } else {
    items.forEach(function(it){
      var frac=it.v/tot, a2=ang+frac*Math.PI*2, large=frac>0.5?1:0;
      var x1=cx+r*Math.cos(ang), y1=cy+r*Math.sin(ang);
      var x2=cx+r*Math.cos(a2),  y2=cy+r*Math.sin(a2);
      var xi2=cx+ri*Math.cos(a2),yi2=cy+ri*Math.sin(a2);
      var xi1=cx+ri*Math.cos(ang),yi1=cy+ri*Math.sin(ang);
      var dd='M'+x1.toFixed(2)+' '+y1.toFixed(2)+' A'+r+' '+r+' 0 '+large+' 1 '+x2.toFixed(2)+' '+y2.toFixed(2)
           +' L'+xi2.toFixed(2)+' '+yi2.toFixed(2)+' A'+ri+' '+ri+' 0 '+large+' 0 '+xi1.toFixed(2)+' '+yi1.toFixed(2)+' Z';
      paths += '<path d="'+dd+'" fill="'+it.c+'" class="pil-slice"></path>';
      ang=a2;
    });
  }
  return '<svg viewBox="0 0 184 184" class="pil-donut-svg" role="img" aria-label="Répartition">'
       + paths
       + '<text x="92" y="86" text-anchor="middle" class="pil-donut-c1">'+_pilNum(tot)+'</text>'
       + '<text x="92" y="104" text-anchor="middle" class="pil-donut-c2">heures</text>'
       + '</svg>';
}

function _pilRenderGauge(d){
  var g=document.getElementById('pil-gauge'); if(!g) return;
  g.innerHTML =
    '<div class="pil-gauge-top">'
    + '<div><div class="pil-gauge-lab">Avancement de la saison</div><div class="pil-gm" style="margin-top:5px">'+_pilEsc(d.saison)+' · '+d.data.length+' tâches</div></div>'
    + '<div class="pil-gauge-pct">'+d.gaugePct+'<small>%</small></div>'
    + '</div>'
    + '<div class="pil-gauge-track"><div class="pil-gauge-fill" style="width:'+d.gaugePct+'%"></div></div>'
    + '<div class="pil-gauge-meta">'
    + '<span class="pil-gm"><b class="done">'+_pilNum(d.hDone)+' h</b> réalisées</span>'
    + '<span class="pil-gm"><b>'+_pilNum(d.totalReste)+' h</b> restantes</span>'
    + '<span class="pil-gm"><b>'+_pilNum(d.totalTotal)+' h</b> planifiées</span>'
    + '<span class="pil-gm"><b class="done">'+d.done.length+'</b> terminées · <b>'+d.active.length+'</b> en cours</span>'
    + '</div>';
}
function _pilRenderBar(d){
  var host=document.getElementById('pil-bar'); if(!host) return;
  var mode=_PIL_STATE.bar||'saison';
  var seg=document.getElementById('pil-bar-seg');
  if(seg) seg.querySelectorAll('button').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-b')===mode); });
  if(mode==='cmp'){ host.innerHTML=_pilCmpHtml(d); return; }
  var rows = d.data.slice().sort(function(a,b){ return (b.pct||0)-(a.pct||0); });
  if(!rows.length){ host.innerHTML='<div class="pil-empty">Aucune tâche pour la saison active</div>'; return; }
  host.innerHTML = rows.map(function(t){
    var col=_pilPctColor(t.pct||0);
    return '<div class="pil-brow">'
      + '<div class="pil-blab">'+_pilEsc(_pilTnom(t.nom))+'</div>'
      + '<div class="pil-btrack"><div class="pil-bfill" style="width:'+Math.min(t.pct||0,100)+'%;background:'+col+'"></div></div>'
      + '<div class="pil-bpct" style="color:'+col+'">'+(t.pct||0)+'%</div>'
      + '<div class="pil-bh">'+_pilNum(t.h_done)+'/'+_pilNum(t.h_total)+' h</div>'
      + '</div>';
  }).join('');
}
function _pilSaison(){
  var v=(typeof window._visuSaison==='function')?window._visuSaison():'';
  if(v && window.SAISONS){ var f=window.SAISONS.find(function(s){return s&&s.nom===v;}); if(f) return f; }
  return (typeof window.getSaisonActive==='function')?window.getSaisonActive():null;
}
window._pilSaison=_pilSaison;
function _pilCmpActiveNom(){ var sa=(typeof window.getSaisonActive==='function')?window.getSaisonActive():null; return sa?(sa.nom||'Saison active'):'Saison active'; }
// Retrouve la periode (avec ses dates) derriere un nom archive. HISTORIQUE ne stocke que le nom
// et une periode en toutes lettres ; les dates vivent dans SAISONS, qui conserve les periodes.
function _pilCmpPeriode(nom){
  return (window.SAISONS||[]).find(function(s){ return s&&s.nom===nom; })||null;
}
// Position d'une periode sur l'axe campagne : sa campagne, et son rang en jours depuis le 1er aout.
function _pilCmpOffset(deb){
  var an=_arcCampagneDe(deb);
  return {an:an, off:_arcN(deb)-_arcN(an+'-08-01')};
}
// Ecart maximal tolere entre deux periodes homologues d'une campagne a l'autre. 75 jours laissent
// passer un printemps ouvert le 1er mars une annee et le 5 avril la suivante, sans jamais confondre
// un printemps avec un hiver (151 jours d'ecart sur l'axe).
var _PIL_CMP_TOL = 75;
// Appariement de la saison active avec son homologue de la campagne precedente. L'ancienne version
// lisait l'annee DANS LE NOM (regex \d{4} + radical) : un vestige du modele "saison par type", mort
// depuis que les periodes portent un nom libre. Un domaine qui nomme ses periodes "Saison verte" ou
// "Campagne" n'avait plus aucune comparaison, en silence. On apparie desormais par POSITION SUR
// L'AXE CAMPAGNE (1er aout -> 31 juillet), la meme convention que l'onglet Archives : elle ne
// depend d'aucune facon de nommer. Repli sur le nom quand les dates manquent (archives anciennes
// dont la periode a ete supprimee de SAISONS).
// Pas de distance circulaire : une periode de fin juillet et une de debut aout sont aux deux bouts
// de l'axe et se suivent dans le calendrier — ce ne sont pas des homologues.
function _pilCmpSnapshot(){
  var H=window.HISTORIQUE||[]; if(!H.length) return null;
  var sa=(typeof window.getSaisonActive==='function')?window.getSaisonActive():null; if(!sa) return null;
  if(sa.debut){
    var ref=_pilCmpOffset(sa.debut), bestP=null, bestAn=-1, bestEc=0;
    H.forEach(function(h){
      var pe=_pilCmpPeriode(h&&h.saisonNom); if(!pe||!pe.debut) return;
      var o=_pilCmpOffset(pe.debut);
      if(o.an>=ref.an) return;
      var ec=Math.abs(o.off-ref.off);
      if(ec>_PIL_CMP_TOL) return;
      if(o.an>bestAn||(o.an===bestAn&&ec<bestEc)){ bestAn=o.an; bestEc=ec; bestP=h; }
    });
    if(bestP) return bestP;
  }
  var nom=String(sa.nom||'');
  var base=nom.replace(/\s*\d{4}.*$/,'').trim();
  var ym=nom.match(/\d{4}/); var year=ym?parseInt(ym[0],10):null;
  var best=null, bestY=-1;
  H.forEach(function(h){
    var hn=String(h.saisonNom||''); var hb=hn.replace(/\s*\d{4}.*$/,'').trim();
    var hy=hn.match(/\d{4}/); hy=hy?parseInt(hy[0],10):null;
    if(hb && base && hb.toLowerCase()===base.toLowerCase() && hy!=null && (year==null||hy<year) && hy>bestY){ bestY=hy; best=h; }
  });
  return best;
}
function _pilCmpHtml(d){
  var snap=_pilCmpSnapshot();
  if(!snap){ return '<div class="pil-empty">Aucune saison comparable archivée. L\'historique s\'enrichit à chaque campagne clôturée (Pilotage › Archives).</div>'; }
  var prevByName={}; ((snap.stats&&snap.stats.tachesStats)||[]).forEach(function(t){ prevByName[t.nom]=t; });
  var rows=(d.data||[]).slice().sort(function(a,b){ return (b.pct||0)-(a.pct||0); });
  if(!rows.length){ return '<div class="pil-empty">Aucune tâche pour la saison active</div>'; }
  function rail(cls,pct,na){ return '<div class="pil-cmp-track"><span class="pil-cmp-rail">'+(na?'':'<i class="'+cls+'" style="width:'+Math.min(pct,100)+'%"></i>')+'</span><span class="pil-cmp-val"'+(na?' style="opacity:.5"':'')+'>'+(na?'n/a':(pct+' %'))+'</span></div>'; }
  var body=rows.map(function(t){
    var cur=t.pct||0, pv=prevByName[t.nom], prev=pv?(pv.pct||0):null, dHtml='';
    if(prev!=null){ var dl=cur-prev; var dcol=dl>0?'var(--vert-med)':(dl<0?'var(--rouge)':'var(--texte-doux)'); dHtml=' <span class="d" style="color:'+dcol+'">'+(dl>0?('▲ +'+dl):(dl<0?('▼ '+dl):'='))+'</span>'; }
    return '<div class="pil-cmp-row"><div class="pil-cmp-name">'+_pilEsc(_pilTnom(t.nom))+dHtml+'</div><div class="pil-cmp-bars">'+rail('pil-cmp-cur',cur,false)+rail('pil-cmp-prev',prev==null?0:prev,prev==null)+'</div></div>';
  }).join('');
  return body+'<div class="pil-cmp-leg"><span><i class="pil-cmp-cur"></i> '+_pilEsc(_pilCmpActiveNom())+'</span><span><i class="pil-cmp-prev"></i> '+_pilEsc(snap.saisonNom||'Saison précédente')+'</span></div>';
}
function _pilRenderPie(d){
  var pd=_pilPieData(d);
  var tEl=document.getElementById('pil-pie-title'); if(tEl) tEl.textContent=pd.title;
  // segment actif
  document.querySelectorAll('#pil-pie-seg button').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-m')===_PIL_STATE.pie); });
  var svgEl=document.getElementById('pil-donut'); if(svgEl) svgEl.innerHTML=_pilDonutSVG(pd.items);
  var tot=pd.items.reduce(function(a,b){return a+b.v;},0)||1;
  var legEl=document.getElementById('pil-pie-legend');
  if(legEl){
    legEl.innerHTML = pd.items.map(function(it){
      return '<div class="pil-leg"><span class="pil-leg-dot" style="background:'+it.c+'"></span>'
        + '<span class="pil-leg-n">'+_pilEsc(_pilTnom(it.n))+'</span>'
        + '<span class="pil-leg-v">'+_pilNum(it.v)+' '+pd.unit+'</span>'
        + '<span class="pil-leg-p">'+Math.round(it.v/tot*100)+' %</span></div>';
    }).join('') || '<div class="pil-empty">—</div>';
  }
}
function _pilChip(txt,color){ return '<span style="display:inline-block;font-size:10px;font-weight:600;border:1px solid '+color+';color:'+color+';border-radius:10px;padding:2px 8px;margin:4px 4px 0 0">'+txt+'</span>'; }
function _pilDfr(s){ if(!s) return '—'; var p=String(s).split('-'); if(p.length<3) return String(s); var M=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']; return parseInt(p[2],10)+' '+(M[parseInt(p[1],10)-1]||''); }
function _pilDaysSince(s){ if(!s) return 0; var t=new Date(s).getTime(); if(isNaN(t)) return 0; return Math.floor((Date.now()-t)/86400000); }
function _pilLi(av,bg,t,s,r,fg){
  return '<div class="pil-li"><span class="pil-av" style="background:'+bg+(fg?';color:'+fg:'')+'">'+_pilEsc(av)+'</span>'
    + '<div class="pil-li-main"><div class="pil-li-t">'+_pilEsc(t)+'</div>'+(s?'<div class="pil-li-s">'+_pilEsc(s)+'</div>':'')+'</div>'
    + (r!=null?'<div class="pil-li-r">'+r+'</div>':'')+'</div>';
}
var _pilMap=null;
var _pilNamesOn=true;
var _pilMapLabels=[];
function _pilApplyNames(){
  _pilMapLabels.forEach(function(o){ if(!o||!o.mk||!o.tt) return; try{ if(_pilNamesOn){ o.mk.bindTooltip(o.tt); } else { o.mk.unbindTooltip(); } }catch(e){} });
}
function _pilStat(n,u,warn){ return '<span class="pil-th-stat"><b>'+n+'</b>'+(u||'')+(warn?' <b class="warn">'+warn+'</b>':'')+'</span>'; }
function _pilTile(id,ico,dot,title,statHtml,subHtml,gradPct,bodyHtml){
  // Garde defensive : _PIL_STATE n'est pose que par renderPilotage. _pilShow() se
  // protegeait deja du cas null, _pilTile non — un appel hors sequence de rendu
  // levait un TypeError qui vidait tout l'onglet. Meme famille que les gardes
  // mortes du §25.15.e : celle-ci, elle, sert.
  var _st=_PIL_STATE||{};
  var open = !(_st.collapsed && _st.collapsed[id]);
  return '<div class="pil-tile'+(open?' open':'')+'" data-pid="'+id+'">'
    + '<div class="pil-th"><span class="pil-dot" style="background:'+dot+'"></span><span class="pil-th-ico">'+_pilIcoFor(id)+'</span>'
    + '<span class="pil-th-t">'+_pilEsc(title)+'</span>'+(statHtml||'')+'<span class="pil-th-chev">▸</span></div>'
    + (subHtml?'<div class="pil-tsub">'+_pilEsc(subHtml)+'</div>':'')
    + (gradPct!=null?'<div class="pil-tgrad"><i style="left:calc('+Math.min(Math.max(gradPct,0),100)+'% - 1px)"></i></div>':'')
    + '<div class="pil-tbody" id="pil-body-'+id+'">'+(bodyHtml||'')+'</div>'
    + '</div>';
}
function _pilPanelCarte(d){
  var ha=_pilNum(d.surfTot).replace(/\u202f/g,' ');
  var body='<div class="pil-map" id="pil-map"></div>'
    + '<div class="pil-map-leg"><span>0 %</span><span class="pil-map-bar"></span><span>100 %</span>'
    + '<span style="display:flex;align-items:center;gap:6px"><span class="pil-map-sw" style="background:rgba(192,57,43,.5);border-color:#C0392B"></span>Arrachée</span>'
    + '<button type="button" class="pil-names-btn">'+(_pilNamesOn?'\uD83C\uDFF7 Noms \u2713':'\uD83C\uDFF7 Noms')+'</button></div>';
  return _pilTile('carte','🗺️','#7FA83A','Carte du domaine', _pilStat(d.gaugePct,' %',null), d.nActives+' parcelles · '+ha+' ha', d.gaugePct, body);
}
// Detruire une carte Leaflet pendant qu'une animation de zoom est en vol leve
// « Cannot read properties of undefined (reading '_leaflet_pos') » 250 ms plus tard :
// L.Map._animateZoom pose un setTimeout de secours que remove() n'annule PAS, et
// remove() fait delete this._mapPane. _onZoomTransitionEnd sort en no-op si
// _animatingZoom est faux (leaflet 1.9.4, 1re ligne) : on baisse le drapeau AVANT.
function _pilMapKill(m){
  if(!m) return null;
  try{ m._animatingZoom=false; }catch(e){ if(DEBUG) console.warn('[pilotage] carte kill flag', e); }
  try{ m.remove(); }catch(e){ if(DEBUG) console.warn('[pilotage] carte kill rm', e); }
  return null;
}
function _pilBuildMap(d){
  var el=document.getElementById('pil-map'); if(!el || typeof window.L==='undefined') return;
  _pilMap=_pilMapKill(_pilMap);
  _pilMapLabels=[];
  var src=(window.KML_POLYGONS_DYNAMIC&&window.KML_POLYGONS_DYNAMIC.length)?window.KML_POLYGONS_DYNAMIC:(window.KML_DATA||[]);
  var P=window.PARCELLES||[];
  try{
    _pilMap=window.L.map(el,{zoomControl:true,attributionControl:false,zoomSnap:0,zoomDelta:0.5}).setView([47.205,4.972],12);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(_pilMap);
    var bounds=[];
    src.forEach(function(k){
      if(!k||!k.pts||!k.pts.length) return;
      var p=P.find(function(x){ return x.nom && k.name && x.nom.toLowerCase()===k.name.toLowerCase(); });
      var arr = p && /arrach/i.test(p.statut||'');
      var cl = (p && !arr && typeof window.getPCls==='function') ? window.getPCls(p) : null;
      var col = arr ? '#C0392B' : (cl?cl.col:'#888888');
      var op  = arr ? 0.5 : 0.62;
      // remplissage clair + halo de contour coloré épais (visibilité à petit zoom)
      window.L.polygon(k.pts,{color:'#fff',weight:0.5,fillColor:col,fillOpacity:op}).addTo(_pilMap);
      window.L.polygon(k.pts,{color:col,weight:2.4,fill:false,opacity:0.95}).addTo(_pilMap);
      // point + nom au barycentre (comme l'onglet carte de Parcelles)
      var ctr=k.pts.reduce(function(a,b){ return [a[0]+b[0],a[1]+b[1]]; },[0,0]);
      var lc=[ctr[0]/k.pts.length, ctr[1]/k.pts.length];
      var mk=window.L.circleMarker(lc,{radius:3.5,fillColor:col,color:'#fff',weight:1.4,fillOpacity:1})
        .addTo(_pilMap)
        .bindPopup(p?('<b>'+_pilEsc(p.nom)+'</b><br>'+(p.surface||0)+' ha · '+(arr?'arrachée':((cl?cl.pct:0)+' %'))):('<b>'+_pilEsc(k.name)+'</b>'));
      var tt=window.L.tooltip({permanent:true,direction:'right',offset:[5,0],className:'pil-plabel'}).setContent(p?p.nom:k.name).setLatLng(lc);
      if(_pilNamesOn) mk.bindTooltip(tt);
      _pilMapLabels.push({mk:mk,tt:tt});
      k.pts.forEach(function(pt){ bounds.push(pt); });
    });
    // Parcelles non couvertes par un contour KML : epingle a leur centroide,
    // sinon repere au centre de leur commune (regroupe). Couvre les domaines
    // sans KML importe (parcelles dispersees affectees a une commune).
    (function(){
      function _ok(a,b){ return isFinite(a)&&isFinite(b)&&(a!==0||b!==0); }
      var _kn={}; src.forEach(function(k){ if(k&&k.name) _kn[String(k.name).toLowerCase()]=1; });
      var _cg={};
      P.forEach(function(p){
        if(!p||/arrach/i.test(p.statut||'')) return;
        if(p.nom && _kn[String(p.nom).toLowerCase()]) return;
        var la=parseFloat(p.lat), ln=parseFloat(p.lng);
        var cl=(typeof window.getPCls==='function')?window.getPCls(p):null;
        var col=cl?cl.col:'#888888';
        if(_ok(la,ln)){
          window.L.circleMarker([la,ln],{radius:3.5,fillColor:col,color:'#fff',weight:1.4,fillOpacity:1})
            .addTo(_pilMap)
            .bindPopup('<b>'+_pilEsc(p.nom)+'</b><br>'+(p.surface||0)+' ha · '+(cl?cl.pct:0)+' %');
          bounds.push([la,ln]);
        } else if(p.commune && _ok(parseFloat(p.commune.lat),parseFloat(p.commune.lng))){
          var key=String(p.commune.nom||'').toLowerCase().trim();
          if(!_cg[key]) _cg[key]={nom:p.commune.nom,lat:parseFloat(p.commune.lat),lng:parseFloat(p.commune.lng),parc:[]};
          _cg[key].parc.push(p);
        }
      });
      Object.keys(_cg).forEach(function(key){
        var g=_cg[key], n=g.parc.length;
        var liste=g.parc.map(function(pp){var c=(typeof window.getPCls==='function')?window.getPCls(pp):null;return '<b>'+_pilEsc(pp.nom)+'</b> · '+(pp.surface||0)+' ha · '+(c?c.pct:0)+' %';}).join('<br>');
        var ic=window.L.divIcon({className:'',iconSize:[24,24],iconAnchor:[12,12],html:'<div style="width:24px;height:24px;border-radius:50%;background:#C9A84C;color:#1C1813;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font:700 12px/1 system-ui,sans-serif;">'+n+'</div>'});
        window.L.marker([g.lat,g.lng],{icon:ic}).addTo(_pilMap)
          .bindPopup('<b>'+String.fromCodePoint(0x1F4CD)+' '+_pilEsc(g.nom)+'</b><br><span style="color:var(--texte-doux,#888);font-size:12px;">'+n+' parcelle'+(n>1?'s':'')+' · commune</span><br>'+liste);
        bounds.push([g.lat,g.lng]);
      });
    })();
    // _mine : un rAF en retard d'un build cadrerait la carte SUIVANTE avec les bornes
    // de la precedente, en relancant une animation — donc une 2e chance de course.
    var _mine=_pilMap;
    // animate:false : un cadrage d'ouverture n'a aucune raison d'etre anime, et c'est
    // la fenetre de 250 ms pendant laquelle une reconstruction ferait planter Leaflet.
    function _fit(){ if(!_pilMap || _pilMap!==_mine) return; try{ _pilMap.invalidateSize(); }catch(e){} if(bounds.length){ try{ _pilMap.fitBounds(bounds,{padding:[18,18],animate:false}); }catch(e){} } else if(typeof window.getDomaineGeo==='function'){ var _dg=window.getDomaineGeo(); try{ _pilMap.setView([_dg.lat,_dg.lng],13,{animate:false}); }catch(e){} } }
    requestAnimationFrame(function(){ requestAnimationFrame(_fit); });
  }catch(e){ if(DEBUG) console.warn('[pilotage] carte', e); }
}
function _pilPanelEquipe(d){
  var rl = (typeof window.getRoleLabel==='function');
  var nB = (d.membres||[]).filter(function(m){ return m && m.bureau; }).length;
  // Une equipe collective est UNE fiche mais N personnes : compter les fiches
  // afficherait « 2 actifs » en pleine vendange. On compte donc des PERSONNES des
  // qu'une equipe existe, et le sous-titre dit d'ou vient l'ecart avec le nombre
  // de lignes affichees — sinon le chiffre semblerait ne correspondre a rien.
  var _mvEC=(typeof window._mvEstCollectif==='function')?window._mvEstCollectif:function(){return false;};
  var _mvED=(typeof window._mvEffDef==='function')?window._mvEffDef:function(){return 1;};
  var _nColl=(d.membres||[]).filter(_mvEC).length;
  var _nPers=(d.membres||[]).reduce(function(a,m){ return a+_mvED(m); },0);
  var rows = d.membres.map(function(m){
    var c=(window.COULEURS_MBR&&(window.COULEURS_MBR[m.nom]))||'#3D6B27';
    var role = rl ? window.getRoleLabel(m.roles) : (m.roles?m.roles.join(' · '):'');
    if(m.bureau) role = (role?role+' · ':'')+'🏢 bureau';
    if(_mvEC(m)){
      var _n=_mvED(m);
      role = '👥 équipe · '+_n+' personne'+(_n>1?'s':'');
      return _pilLi('👥', '#8A5A38', m.nom||'—', role, null);
    }
    return _pilLi((m.nom||'?').charAt(0).toUpperCase(), c, m.nom||'—', role, null);
  }).join('') || '<div class="pil-empty">Aucun membre actif</div>';
  // Sous-titre : bureau + contrats echus. Sans ce rappel, l'effectif baisse du jour
  // au lendemain sans que rien n'explique pourquoi (cf. bloc EFFECTIF).
  var _sub=[];
  if(nB>0) _sub.push(nB+' au bureau (hors capacité vigne)');
  var _nF=d.nFinis||0;
  if(_nF>0) _sub.push(_nF+' contrat'+(_nF>1?'s terminés':' terminé')+' · fiche'+(_nF>1?'s':'')+' à passer en Inactif');
  if(_nColl>0) _sub.unshift(_nColl+' équipe'+(_nColl>1?'s':'')+' collective'+(_nColl>1?'s':'')+' · '+(d.membres.length-_nColl)+' fiche'+((d.membres.length-_nColl)>1?'s':'')+' individuelle'+((d.membres.length-_nColl)>1?'s':''));
  return _pilTile('equipe','👥','#5B9B3A','Équipe',
    _pilStat(_nColl>0?_nPers:d.membres.length, _nColl>0?' personnes':' actifs', null),
    (_sub.length?_sub.join(' · '):null), null, '<div class="pil-ip-list">'+rows+'</div>');
}
function _pilPanelTracteur(d){
  var s=_PIL_STATE.sub||{};
  var rows = (d.tracs||[]).map(function(t){
    var sub='';
    if(s.trac_revision){
      if(t.revReste!=null){ var col=t.revReste<=50?'var(--rouge)':t.revReste<=120?'var(--orange)':'var(--vert-med)';
        sub += '<div class="pil-li-s" style="color:'+col+';font-weight:600">⚙ Révision dans '+_pilNum(t.revReste)+' h</div>';
      } else { sub += '<div class="pil-li-s" style="opacity:.6">⚙ Révision : à renseigner</div>'; }
    }
    if(s.trac_controle){ sub += '<div class="pil-li-s">📋 Dernier contrôle : '+(t.lastCtrl?_pilDfr(t.lastCtrl):'jamais')+'</div>'; }
    if(s.trac_intercep && t.sess && t.sAdv<100){ var isI=/intercep/i.test(t.sess.activite||''); sub += '<div class="pil-li-s" style="color:var(--acier-med)">'+(isI?'✂️':'🚜')+' '+_pilEsc(t.sess.activite||'Session')+' · '+t.sAdv+' %</div>'; }
    var chips='';
    if(s.trac_repar && t.rep){ chips += _pilChip('🔧 '+_pilEsc(t.rep.motif||'Réparation')+(t.rep.prevu_retour?' · retour '+_pilDfr(t.rep.prevu_retour):''),'var(--rouge)'); }
    return '<div class="pil-li"><span class="pil-av" style="background:#16313F;color:#4A9FC8">🚜</span><div class="pil-li-main"><div class="pil-li-t">'+_pilEsc(t.nom||'Tracteur')+(t.traitementOnly?' <span style="font-size:9px;color:var(--orange)">· pulvé</span>':'')+'</div>'+sub+chips+'</div></div>';
  }).join('') || '<div class="pil-empty">Aucun tracteur</div>';
  var n=(d.tracs||[]).length;
  return _pilTile('tracteur','🚜','#4A9FC8','Parc tracteur', _pilStat(n,' tracteur'+(n>1?'s':''), d.nRepar?('🔧 '+d.nRepar):null), null, null, '<div class="pil-ip-list">'+rows+'</div>');
}
function _pilPanelPresences(d){
  var s=_PIL_STATE.sub||{};
  var list=(d.presences||[]).filter(function(p){ if(p.etat==='cp')return s.pres_cp; if(p.etat==='recup')return s.pres_recup; if(p.etat==='maladie'||p.etat==='absent')return s.pres_mal; return false; });
  var rows=list.map(function(p){
    var c=(window.COULEURS_MBR&&window.COULEURS_MBR[p.nom])||'#3D6B27', lab, col;
    if(p.etat==='cp'){ lab='☀️ Congé payé'; col='var(--orange)'; }
    else if(p.etat==='recup'){ lab='↺ Récup'; col='#7B6DB8'; }
    else if(p.etat==='maladie'){ lab='🤒 Maladie'; col='var(--rouge)'; }
    else { lab='✕ '+(p.motif||'Absent'); col='var(--rouge)'; }
    return '<div class="pil-li"><span class="pil-av" style="background:'+c+'">'+_pilEsc((p.nom||'?').charAt(0).toUpperCase())+'</span><div class="pil-li-main"><div class="pil-li-t">'+_pilEsc(p.nom||'—')+'</div><div class="pil-li-s" style="color:'+col+';font-weight:600">'+_pilEsc(lab)+'</div></div></div>';
  }).join('') || '<div class="pil-empty">Toute l\'équipe est présente aujourd\'hui ✓</div>';
  return _pilTile('presences','🌴','#C9A84C','Présences du jour', _pilStat((d.nPresent||0)+'/'+((d.membres||[]).length),' présents',null), null, null, '<div class="pil-ip-list">'+rows+'</div>');
}
function _pilPanelPhyto(d){
  var rows = d.traits.slice(0,6).map(function(t){
    var nom = t.produit || t.nom || t.produitNom || 'Intervention';
    return _pilLi('🌿','#142838', nom, t.date||'', null, '#5A9FD4');
  }).join('');
  rows += _pilLi('📋','#142838', d.traits.length+' interventions enregistrées', 'Catalogue E-Phy à jour', null, '#5A9FD4');
  return _pilTile('phyto','🌿','#5A9FD4','Registre phyto', _pilStat(d.traits.length,' interv.',null), null, null, '<div class="pil-ip-list">'+rows+'</div>');
}

// ── Échéances par tâche (jours ouvrés de travail + fin de saison) ─────
// Lecture seule. Réutilise calcHeures (h_reste/tâche) + _planTeamCadence (cadence réelle équipe).
function _pilEchCadence(d){
  var cad=null;
  if(typeof window._planTeamCadence==='function'){
    try{ var _t=new Date(), _f=new Date(); _f.setDate(_f.getDate()-28); cad=window._planTeamCadence(_f,_t); }catch(e){ cad=null; }
  }
  var cadH=(cad && cad.cadence>0)?cad.cadence:0, estim=false;
  if(!cadH){ var nV=(d.membres||[]).filter(function(m){ return m && !m.bureau; }).length; if(nV>0){ cadH=7*nV; estim=true; } }
  return { cadH:cadH, estim:estim };
}
function _pilWorkdayDate(n){
  if(n==null) return '—';
  var dt=new Date(), added=0, guard=0;
  while(added<n && guard<3000){ guard++; dt.setDate(dt.getDate()+1); var wd=dt.getDay(); if(wd!==0 && wd!==6) added++; }
  var M=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  var J=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];
  return J[dt.getDay()]+' '+dt.getDate()+' '+M[dt.getMonth()];
}
function _friseNorm(s){ return String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
function _pilTaskReal(cd,d){
  var J=(window.JOURNAL||[]); var out={};
  var dlo=cd.debut, dhi=cd.fin;
  var pct={}; ((d&&d.data)||[]).forEach(function(t){ pct[_friseNorm(t.nom)]=(t.pct||0); });
  (cd.taskWindows||[]).forEach(function(t){
    var k=_friseNorm(t.nom), mn=null, mx=null;
    for(var i=0;i<J.length;i++){ var j=J[i];
      if(!j||j.meteo||j.statut!=='Valid\u00e9')continue;
      if(_friseNorm(j.tache)!==k)continue;
      var dt=j.date; if(!dt||dt<dlo||dt>dhi)continue;
      if(mn==null||dt<mn)mn=dt; if(mx==null||dt>mx)mx=dt;
    }
    if(mn==null){ out[k]={state:'none'}; }
    else { var done=(pct[k]||0)>=99.5; out[k]={start:mn,end:done?mx:null,state:done?'done':'live'}; }
  });
  return out;
}
// ── ECHELLE HORIZONTALE PARTAGEE (frise etape 1 + profil etape 2) ────
// Les deux graphiques se lisent l'un au-dessus de l'autre : ils doivent
// porter le MEME axe. Avant, la frise couvrait cd.debut->cd.fin avec un
// bord gauche de 132 px pendant que le profil dessinait des colonnes de
// semaines a partir de 42 px : une meme date tombait a deux abscisses
// differentes, et la fin d'une tache ne pointait pas la colonne ou le
// travail deborde. Un seul repere, calcule une fois.
// Bornes = UNION de la periode et des semaines : une semaine deborde
// souvent de quelques jours de part et d'autre, et la tronquer ferait
// mentir la derniere colonne.
function _pilEchelle(cd,w){
  function _o(y){ return Math.round((Date.parse(y+'T00:00:00')-Date.parse('2026-01-01T00:00:00'))/86400000); }
  var wk=(cd&&cd.weeks)||[];
  var s=_o(cd.debut), e=_o(cd.fin);
  if(wk.length){ if(wk[0].o0<s) s=wk[0].o0; if(wk[wk.length-1].o1>e) e=wk[wk.length-1].o1; }
  // La largeur de dessin est MESUREE. Un plancher garde le texte lisible :
  // un calendrier de douze mois ne rentre pas dans un telephone, il defile —
  // mais une unite vaut un pixel, donc les etiquettes font leur taille reelle.
  var L=Math.max(1,e-s+1), W=(w>0)?Math.round(Math.max(620,w)):1000;
  var padL=(W<760)?96:132, padR=22, plotW=W-padL-padR;
  function moO0(mo){ if(mo.o0!=null)return mo.o0; var yr=mo.yr||2026; return _o(yr+'-'+String(mo.m+1).padStart(2,'0')+'-01'); }
  function moO1(mo){ if(mo.o1!=null)return mo.o1; var yr=mo.yr||2026; var d2=new Date(Date.UTC(yr,mo.m+1,0)).getUTCDate(); return _o(yr+'-'+String(mo.m+1).padStart(2,'0')+'-'+String(d2).padStart(2,'0')); }
  return { o:_o, s:s, e:e, L:L, W:W, padL:padL, padR:padR, plotW:plotW, moO0:moO0, moO1:moO1,
           todayIso:((typeof window._mvAujIso==='function')?window._mvAujIso():new Date().toISOString().split('T')[0]),
           X:function(ord){ return padL+(ord-s)/L*plotW; } };
}
function _pilFriseSvg(cd,real,w){
  var tw=cd.taskWindows||[];
  if(!tw.length) return window._mvGraphVide('Aucune fen\u00eatre de travail sur la p\u00e9riode',
    'Les fen\u00eatres se posent dans Pilotage \u203a Outils \u203a Param\u00e9trage.');
  var E=_pilEchelle(cd,w), _o=E.o, X=E.X;
  var gc=window._mvGraphCadre(E.W,1);
  var TODAY=E.todayIso;
  var s=E.s, e=E.e, L=E.L;
  var W=E.W,padL=E.padL,padR=E.padR,padT=34,rowH=46,plotW=E.plotW;
  var H=padT+tw.length*rowH+24;
  var MN=['JANV','F\u00c9VR','MARS','AVR','MAI','JUIN','JUIL','AO\u00dbT','SEPT','OCT','NOV','D\u00c9C'];
  // Ordinaux du mois : annee-aware via cd.months (o0/o1), definis UNE fois dans
  // _pilEchelle pour que la frise et le profil posent leurs traits au meme jour.
  var _moO0=E.moO0, _moO1=E.moO1;
  var months=(cd.months||[]);
  var g='';
  g+='<defs><pattern id="pilhatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--texte)" stroke-width="2"/></pattern></defs>';
  months.forEach(function(mo,k){
    var x0=X(Math.max(s,_moO0(mo))), x1=X(Math.min(e,_moO1(mo))+1);
    if(k%2===1) g+='<rect x="'+x0.toFixed(1)+'" y="'+padT+'" width="'+(x1-x0).toFixed(1)+'" height="'+(tw.length*rowH)+'" fill="var(--texte)" opacity="0.04"/>';
    g+='<text x="'+((x0+x1)/2).toFixed(1)+'" y="22" text-anchor="middle" font-size="'+gc.txt.mini+'" font-weight="600" fill="'+gc.col.texte+'" font-family="Outfit">'+MN[mo.m]+'</text>';
    g+='<line x1="'+x0.toFixed(1)+'" y1="'+padT+'" x2="'+x0.toFixed(1)+'" y2="'+(padT+tw.length*rowH)+'" stroke="'+gc.col.grille+'" stroke-width="1"/>';
  });
  g+='<line x1="'+X(e+1).toFixed(1)+'" y1="'+padT+'" x2="'+X(e+1).toFixed(1)+'" y2="'+(padT+tw.length*rowH)+'" stroke="'+gc.col.grille+'"/>';
  tw.forEach(function(t,i){
    var yC=padT+i*rowH, yP=yC+8, hP=16, yR=yC+30, hR=11;
    var px0=X(_o(t.start)), px1=X(_o(t.end)+1), c=_taskColor(t.nom);
    g+='<text x="'+(padL-10)+'" y="'+(yC+rowH/2)+'" text-anchor="end" font-size="'+gc.txt.axe+'" font-weight="600" fill="var(--texte)" font-family="Outfit">'+_pilEsc(t.nom)+'</text>';
    g+='<rect x="'+px0.toFixed(1)+'" y="'+yP+'" width="'+Math.max(2,px1-px0).toFixed(1)+'" height="'+hP+'" rx="5" fill="'+c+'" opacity="0.92"/>';
    g+='<text x="'+(px0+6).toFixed(1)+'" y="'+(yP+12)+'" font-size="'+gc.txt.mini+'" fill="#fff" font-family="Outfit" font-weight="600">'+Math.round(t.h)+' h</text>';
    var r=(real&&real[_friseNorm(t.nom)])||{state:'none'};
    if(r.state==='none'||!r.start){ g+='<text x="'+px0.toFixed(1)+'" y="'+(yR+9)+'" font-size="'+gc.txt.mini+'" fill="'+gc.col.texte+'" font-family="Outfit" font-style="italic">non d\u00e9marr\u00e9</text>'; }
    else {
      var ro0=Math.max(s,Math.min(e,_o(r.start)));
      var ro1=Math.max(s,Math.min(e,_o(r.state==='live'?TODAY:r.end)));
      var rx0=X(ro0), rx1=X(ro1+1);
      var fill=r.state==='live'?gc.col.attention:'url(#pilhatch)';
      var stroke=r.state==='live'?gc.col.attention:'var(--texte)';
      g+='<rect x="'+rx0.toFixed(1)+'" y="'+yR+'" width="'+Math.max(2,rx1-rx0).toFixed(1)+'" height="'+hR+'" rx="3" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1"/>';
      if(r.state==='live') g+='<text x="'+(rx1+4).toFixed(1)+'" y="'+(yR+9)+'" font-size="'+gc.txt.mini+'" fill="'+gc.col.attention+'" font-family="Outfit" font-weight="600">en cours</text>';
    }
  });
  if(_o(TODAY)>=s&&_o(TODAY)<=e){ var tx=X(_o(TODAY)); g+='<line x1="'+tx.toFixed(1)+'" y1="'+padT+'" x2="'+tx.toFixed(1)+'" y2="'+(padT+tw.length*rowH)+'" stroke="'+gc.col.texte+'" stroke-width="1.5" stroke-dasharray="4 3"/>'; }
  return window._mvGraphSvg(window._mvGraphCadre(W,H), 'Frise des travaux : '+tw.length+' t\u00e2ches, pr\u00e9vu contre r\u00e9el sur la campagne.', g);
}
function _pilDemandSvg(cd,w){
  var wk=cd.weeks||[];
  if(!wk.length) return window._mvGraphVide('Aucune semaine \u00e0 comparer sur la p\u00e9riode',
    'La p\u00e9riode consult\u00e9e a besoin d\u2019une date de d\u00e9but et d\u2019une date de fin.');
  // effectif present = cd.weeks[].head (tetes lissees, hebdo) — voir _chargeSaisonData
  // Meme echelle que la frise posee juste au-dessus dans ce panneau.
  var E=_pilEchelle(cd,w), _o=E.o, X=E.X;
  var c=window._mvGraphCadre(E.W,1);
  var s=E.s, e=E.e, L=E.L;
  var W=E.W,padL=E.padL,padR=E.padR,padT=16,padB=46,H=300,plotW=E.plotW,plotH=H-padT-padB;
  var maxNeed=4; wk.forEach(function(w){ if(w.need>maxNeed)maxNeed=w.need; if((w.head||0)>maxNeed)maxNeed=w.head; });
  var yTop=Math.ceil(maxNeed+0.5)||1;
  function Y(v){ return padT+plotH-(v/yTop)*plotH; }
  var MN=['JANV','F\u00c9VR','MARS','AVR','MAI','JUIN','JUIL','AO\u00dbT','SEPT','OCT','NOV','D\u00c9C'];
  var _moO0=E.moO0, _moO1=E.moO1;
  var months=(cd.months||[]);
  var g='';
  for(var v=0;v<=yTop;v++){ g+='<line x1="'+padL+'" y1="'+Y(v).toFixed(1)+'" x2="'+(W-padR)+'" y2="'+Y(v).toFixed(1)+'" stroke="'+c.col.grille+'" stroke-width="1"/><text x="'+(padL-8)+'" y="'+(Y(v)+4).toFixed(1)+'" text-anchor="end" font-size="'+c.txt.mini+'" fill="'+c.col.texte+'" font-family="Outfit">'+v+'</text>'; }
  months.forEach(function(mo){ var x0=X(Math.max(s,_moO0(mo))); g+='<line x1="'+x0.toFixed(1)+'" y1="'+padT+'" x2="'+x0.toFixed(1)+'" y2="'+(padT+plotH)+'" stroke="'+c.col.grille+'" stroke-width="1"/>'; var xc=(X(Math.max(s,_moO0(mo)))+X(Math.min(e,_moO1(mo))+1))/2; g+='<text x="'+xc.toFixed(1)+'" y="'+(H-22)+'" text-anchor="middle" font-size="'+c.txt.mini+'" font-weight="600" fill="'+c.col.texte+'" font-family="Outfit">'+MN[mo.m]+'</text>'; });
  wk.forEach(function(w){ if(w.cap<=0)return; var bx=X(w.o0)+2, bw=X(w.o1+1)-X(w.o0)-4; var over=w.need>((w.head||0)+0.001); g+='<rect x="'+bx.toFixed(1)+'" y="'+Y(w.need).toFixed(1)+'" width="'+Math.max(1,bw).toFixed(1)+'" height="'+(padT+plotH-Y(w.need)).toFixed(1)+'" rx="2" fill="'+(over?_PIL_SEM.faute:_PIL_SEM.fait)+'" opacity="'+(over?0.95:0.8)+'"/>'; });
  // ★ Meme regle que la frise annuelle : une semaine SANS capacite (hors
  //   modele de semaine) n'a pas d'effectif mesure. La ligne s'y coupe. Avant,
  //   elle y tombait a `head||0` — un zero dessine est une mesure, et celle-ci
  //   n'existait pas.
  var _pts=[]; wk.forEach(function(w){
    if(!(w.cap>0)){ _pts.push({gap:true}); return; }
    _pts.push({x0:X(w.o0),x1:X(w.o1+1),y:Y(w.head||0)});
  });
  var path=_pilPolyBreak(_pts);
  g+='<path d="'+path+'" fill="none" stroke="var(--texte)" stroke-width="2.5" stroke-linejoin="round"/>';
  var pk=0,pkw=null; wk.forEach(function(w){ if(w.cap>0&&w.need>pk){pk=w.need;pkw=w;} });
  if(pkw && pkw.need>((pkw.head||0)+0.001)){ var px=(X(pkw.o0)+X(pkw.o1+1))/2; g+='<text x="'+px.toFixed(1)+'" y="'+(Y(pk)-7).toFixed(1)+'" text-anchor="middle" font-size="'+c.txt.mini+'" font-weight="700" fill="'+_PIL_SEM.faute+'" font-family="Outfit">pic '+(Math.round(pk*10)/10).toString().replace('.',',')+'</text>'; }
  var _tj=E.o(E.todayIso);
  if(_tj>=E.s && _tj<=E.e){ var _tx=X(_tj); g+='<line x1="'+_tx.toFixed(1)+'" y1="'+padT+'" x2="'+_tx.toFixed(1)+'" y2="'+(padT+plotH).toFixed(1)+'" stroke="'+c.col.texte+'" stroke-width="1.5" stroke-dasharray="4 3"/>'; }
  return window._mvGraphSvg(window._mvGraphCadre(W,H), 'Personnes n\u00e9cessaires par semaine, face \u00e0 l\u2019effectif pr\u00e9sent.', g);
}
function _pilEcartHtml(cd, real){
  function _o(y){ return Math.round((Date.parse(y+'T00:00:00')-Date.parse('2026-01-01T00:00:00'))/86400000); }
  var MN=['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];
  function fmt(y){ if(!y)return '\u2014'; var dd=new Date(y+'T00:00:00'); return dd.getDate()+' '+MN[dd.getMonth()]; }
  var rows=(cd.taskWindows||[]).map(function(t){
    var r=(real&&real[_friseNorm(t.nom)])||{state:'none'};
    var seg, delta, dcls;
    if(r.state==='none'||!r.start){ seg='r\u00e9el : <b>non d\u00e9marr\u00e9</b>'; delta='\u2014'; dcls='none'; }
    else if(r.state==='live'){ var ds=_o(r.start)-_o(t.start); seg='r\u00e9el : <b>'+fmt(r.start)+'</b> \u2192 <b>en cours</b>'; delta=(ds>=0?'+':'')+ds+' j au d\u00e9part'; dcls='live'; }
    else { var ds2=_o(r.start)-_o(t.start); var dp=_o(t.end)-_o(t.start)+1, dr=_o(r.end)-_o(r.start)+1, du=dr-dp; seg='r\u00e9el : <b>'+fmt(r.start)+'</b> \u2192 <b>'+fmt(r.end)+'</b>'; delta=(ds2>=0?'+':'')+ds2+' j d\u00e9part \u00b7 '+(du>=0?'+':'')+du+' j dur\u00e9e'; dcls=(ds2>1||du>2)?'late':((ds2<-1||du<-2)?'early':'none'); }
    var dCol=dcls==='late'?'#9B2D1F':(dcls==='early'?'#3D6B27':(dcls==='live'?'#9A6A12':'#7C766B'));
    var dBg=dcls==='late'?'#F3D9D4':(dcls==='early'?'#DCEBD0':(dcls==='live'?'#F6E7CC':'#EDE8DC'));
    return '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #F0ECE1;flex-wrap:wrap">'
      +'<span style="font-weight:600;min-width:128px;display:flex;align-items:center;gap:7px"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:'+_taskColor(t.nom)+'"></span>'+_pilEsc(t.nom)+'</span>'
      +'<span style="color:var(--texte-doux);font-size:12px">pr\u00e9vu : <b style="color:var(--texte)">'+fmt(t.start)+'</b> \u2192 <b style="color:var(--texte)">'+fmt(t.end)+'</b> &nbsp;\u00b7&nbsp; '+seg+'</span>'
      +'<span style="margin-left:auto;font-weight:700;font-size:11px;padding:2px 8px;border-radius:20px;white-space:nowrap;background:'+dBg+';color:'+dCol+'">'+delta+'</span>'
      +'</div>';
  }).join('');
  return '<div style="font-size:12.5px">'+rows+'</div>';
}
// ══════════════════════════════════════════════════════════════════════════════
// FRISE ANNUELLE — l'union des periodes, PAS une entite de plus
// ══════════════════════════════════════════════════════════════════════════════
// Une periode joue DEUX roles incompatibles : elle CONTIENT les taches (s.taches,
// donc la charge) et elle sert de DENOMINATEUR a tout ce qui se lit en ETP.
// Le premier role tolere une periode de cinq semaines, le second non : la charge
// ne depend pas de la duree de la periode, capRefTotal si — donc plus la periode
// est courte, plus l'ETP explose. Mesure du 11/08 : une vendange de cinq semaines
// annonçait 10,5 ETP la ou la semaine du pic en demandait 42. D'ou l'annee comme
// maille de LECTURE.
//
// ⚠️ AUCUN OBJET NOUVEAU N'EST CREE. On appelle _chargeSaisonData PERIODE PAR
// PERIODE, chacune AVEC SON PROPRE SPAN, puis on recolle les semaines sur un axe
// commun. C'est ce qui permet de lire l'annee SANS toucher aux fenetres de taches :
// une fenetre par defaut est une FRACTION du span (planning.js, _mvTaskWin) —
// etirer un span a douze mois etalerait la taille sur un tiers d'annee. Periode
// par periode, chaque tache reste chez elle. Zero migration, zero prerequis de
// saisie, et _VISU_SAISON (qui filtre le journal, le phyto, la cave) ne bouge pas.
//
// Le recollage est legitime parce que w.need = wh/wcap se calcule sur la MEME
// semaine des deux cotes : deux periodes produisent des valeurs comparables.
// ════════════════════════════════════════════════════════════════════════════
// LA PORTEE — un seul etat, lu par tout le module.
// Le module portait CINQ selecteurs qui s'ignoraient : _PIL_ETPSEL (frise),
// _PEC_SUB (economie), _PEX_AN (exercice), _PCAV_MIL (millesime) et la periode
// active. Cliquer une campagne ne bougeait qu'UN panneau ; les chiffres au-
// dessus restaient sur une autre fenetre, sans le dire. D'ou deux reponses
// justes a la meme question sur le meme ecran.
// `camp` remplace _PIL_ETPSEL, qui n'en est plus qu'un alias de lecture.
// ⚠️ Toute nouvelle vue lit _PIL_SCOPE. On n'ajoute pas un sixieme selecteur.
// ════════════════════════════════════════════════════════════════════════════
var _PIL_SCOPE = { camp:null };    // nom de la campagne zoomee ; null = l'annee

// Meme patron de cle que _pilTabKey : un module, une facon de nommer.
function _pilScopeKey(){ return 'mavigne_pil_scope_'+_pilTenant(); }
function _pilScopeLoad(){
  try{ var v=localStorage.getItem(_pilScopeKey()); if(v!=null) _PIL_SCOPE.camp=(v==='')?null:v; }
  catch(e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'scope: lecture impossible'}); }
}
function _pilScopeSet(camp){
  _PIL_SCOPE.camp = camp || null;
  try{ localStorage.setItem(_pilScopeKey(), _PIL_SCOPE.camp||''); }
  catch(e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'scope: ecriture impossible'}); }
}
// La campagne portee EXISTE-T-ELLE encore ? Une periode supprimee ou renommee
// laisserait une portee fantome : l'ecran filtrerait sur un nom que plus
// personne ne porte, et n'afficherait rien sans dire pourquoi.
function _pilScopeVerif(ann){
  if(!_PIL_SCOPE.camp || !ann || !ann.pers) return;
  for(var i=0;i<ann.pers.length;i++) if(ann.pers[i].nom===_PIL_SCOPE.camp) return;
  _pilScopeSet(null);
}
Object.defineProperty(window,'_PIL_ETPSEL',{ get:function(){ return _PIL_SCOPE.camp; },
  set:function(v){ _pilScopeSet(v); }, configurable:true });
var _PIL_ETPSEL=null;              // conserve pour la lecture interne ; voir _PIL_SCOPE
var _PIL_ANN=null, _PIL_ANNK='';   // memo : N appels a _chargeSaisonData par rendu
function _pilAnnOrd(y){ return Math.round((Date.parse(y+'T00:00:00')-Date.parse('2026-01-01T00:00:00'))/86400000); }
function _pilAnnuelData(){
  if(typeof window._chargeSaisonData!=='function') return null;
  var brut=(typeof window._cmpVisibles==='function')?window._cmpVisibles():(window.SAISONS||[]);
  var pers=(brut||[]).filter(function(p){ return p&&p.debut&&p.fin&&p.fin>=p.debut; })
    .sort(function(a,b){ return String(a.debut).localeCompare(String(b.debut)); });
  if(!pers.length) return null;
  var key=pers.map(function(p){return p.nom+'|'+p.debut+'|'+p.fin;}).join(';')
    +'#'+((window.MEMBRES||[]).length)+'#'+((window.PARCELLES||[]).length)
    +'#'+((window.TACHES||[]).length)
    // ⚠️ le mois d'exercice entre dans la cle : sans lui, changer l'ouverture
    // laisserait la frise sur l'ancien cadre jusqu'au prochain rechargement.
    +'#'+((typeof window._mvExerciceMois==='function')?window._mvExerciceMois():'-');
  if(_PIL_ANN && _PIL_ANNK===key) return _PIL_ANN;
  var out={pers:[],weeks:[],trous:[],ovl:[],s:0,e:0}, prevFin=null;
  pers.forEach(function(p,i){
    var cd=null; try{ cd=window._chargeSaisonData(p); }catch(err){ cd=null; }
    out.pers.push({nom:p.nom,debut:p.debut,fin:p.fin,idx:i,cd:cd,
      col:(typeof window._cmpCouleur==='function')?window._cmpCouleur(p):'#3D6B27'});
    if(prevFin && p.debut<=prevFin) out.ovl.push(p.nom);
    if(!prevFin || p.fin>prevFin) prevFin=p.fin;
    if(!cd) return;
    (cd.weeks||[]).forEach(function(w){
      out.weeks.push({o0:w.o0,o1:w.o1,m:w.m,cap:w.cap||0,need:w.need||0,
        head:w.head||0,headPerm:w.headPerm||0,per:i});
    });
  });
  out.weeks.sort(function(a,b){ return a.o0-b.o0; });
  // ══ L'ANNEE = L'EXERCICE COMPTABLE ════════════════════════════════════════
  // Un cadre FIXE, regle par l'admin, et le meme que celui de l'ecran Economie :
  // la charge et le cout d'une annee doivent se lire sur la meme fenetre, sinon
  // on compare des heures d'une annee a des euros d'une autre.
  // Repli sur les bornes des periodes si l'exercice n'est pas lisible.
  out.ex=(typeof window._cmpAnneeExercice==='function')?window._cmpAnneeExercice():null;
  if(out.ex){ out.s=_pilAnnOrd(out.ex.d0); out.e=_pilAnnOrd(out.ex.d1); }
  else {
    var F=(typeof window._cmpFenetre==='function')?window._cmpFenetre():null;
    out.s=F?_pilAnnOrd(F.a):_pilAnnOrd(pers[0].debut);
    out.e=F?_pilAnnOrd(F.b):_pilAnnOrd(pers[pers.length-1].fin);
  }
  // Periodes qui sortent du cadre : on ne les etire pas dans la frise (le cadre
  // cesserait d'etre un cadre), on les COMPTE pour le dire a l'ecran. Une periode
  // hors exercice, c'est du travail dont le cout tombe dans une autre annee
  // comptable — ca se decide, ca ne se decouvre pas.
  out.hors=[];
  pers.forEach(function(p){
    if(p.fin<(out.ex?out.ex.d0:'') || p.debut>(out.ex?out.ex.d1:'\uFFFF')) out.hors.push(p.nom);
  });
  // ══ ANNEE VIGNE : la vendange doit CLORE l'annee, pas l'ouvrir ════════════
  // « De apres vendange N jusqu'a fin vendange N+1 » (Nico, 12/08/2026). Le cycle
  // de la vigne commence a la taille, apres la recolte. Si l'exercice ouvre AVANT
  // la vendange, celle-ci tombe au debut de l'annee : on ne lit plus un cycle, on
  // lit deux moities de cycles. Et si une borne TRAVERSE la vendange, la recolte
  // est coupee en deux exercices — la moitie des heures et du cout d'un cote, la
  // moitie de l'autre, sans que rien ne le signale.
  out.vend=null; out.align=null;
  var vd=null, vf=null;
  out.pers.forEach(function(p){
    ((p.cd&&p.cd.taskWindows)||[]).forEach(function(t){
      if(_friseNorm(t.nom).indexOf('vendang')<0) return;
      if(!vd||t.start<vd) vd=t.start;
      if(!vf||t.end>vf)   vf=t.end;
    });
  });
  if(vd&&vf&&out.ex){
    out.vend={debut:vd,fin:vf};
    var coupe=(vd<out.ex.d0&&vf>=out.ex.d0)||(vd<=out.ex.d1&&vf>out.ex.d1);
    var o0=_pilAnnOrd(vd), L=Math.max(1,out.e-out.s+1);
    var pos=(o0-out.s)/L;                         // 0 = ouvre l'annee, 1 = la clot
    // Mois ideal d'ouverture = celui qui SUIT la fin de la vendange.
    var fv=new Date(Date.parse(vf+'T00:00:00'));
    var moisIdeal=(fv.getUTCMonth()+1)%12;
    out.align={coupe:coupe, pos:pos, ok:(!coupe&&pos>=0.72), moisIdeal:moisIdeal};
  }
  // Trous : intervalles que plus AUCUNE periode ne couvre. Un trou n'est pas une
  // absence de travail, c'est une absence de periode — une saisie datee la ne se
  // rattache a rien. Il se dessine hachure, JAMAIS a zero : un zero est une mesure.
  var cur=out.s;
  pers.forEach(function(p){
    var d0=Math.max(_pilAnnOrd(p.debut),out.s), f0=Math.min(_pilAnnOrd(p.fin),out.e);
    if(f0<d0) return;
    if(d0>cur) out.trous.push([cur,d0-1]);
    if(f0+1>cur) cur=f0+1;
  });
  if(cur<=out.e) out.trous.push([cur,out.e]);
  _PIL_ANN=out; _PIL_ANNK=key;
  return out;
}
function _pilAnnPer(nom){
  var a=_PIL_ANN; if(!a||nom==null) return null;
  for(var i=0;i<a.pers.length;i++){ if(a.pers[i].nom===nom) return a.pers[i]; }
  return null;   // periode renommee ou supprimee -> on retombe sur l'annee entiere
}
function _pilAnnTaches(p){
  var tw=(p&&p.cd&&p.cd.taskWindows)||[];
  return tw.slice().sort(function(a,b){ return String(a.start).localeCompare(String(b.start)); }).slice(0,12);
}
// ── Le mot sur l'alignement annee / vendange ────────────────────────────────
// Un cadre annuel mal pose ne fait pas d'erreur visible : il donne des chiffres
// PLAUSIBLES sur un cycle coupe en deux. C'est la pire des pannes — celle qui ne
// se voit pas. On la dit, avec le geste qui la corrige.
function _pilAnneeVigneHtml(ann){
  if(!ann||!ann.ex) return '';
  var A=ann.align, out='';
  var MLB=(window.MV_EX_MOIS_LBL)||['janvier','f\u00e9vrier','mars','avril','mai','juin','juillet','ao\u00fbt','septembre','octobre','novembre','d\u00e9cembre'];
  var admin=!!(typeof window.isAdmin==='function' && window.isAdmin());
  var fr=function(d){ if(!d)return'\u2014'; var p=String(d).split('-'); return p.length===3?(parseInt(p[2],10)+' '+MLB[parseInt(p[1],10)-1]):d; };
  var box=function(bg,col,html){
    return '<div style="margin:0 0 8px;padding:9px 12px;border-radius:9px;background:'+bg+';color:'+col+';font-size:12px;line-height:1.55">'+html+'</div>';
  };
  if(A){
    var bouton=(admin&&A.moisIdeal!=null)
      ? (' <button data-exm="'+A.moisIdeal+'" style="border:1px solid currentColor;background:transparent;color:inherit;border-radius:16px;padding:2px 10px;font-size:11.5px;font-weight:700;cursor:pointer;margin-left:4px">Ouvrir au 1\u1D49\u02B3 '+MLB[A.moisIdeal]+'</button>')
      : '';
    if(A.coupe){
      out+=box('#F3D9D4','var(--rouge)','\u26A0 <b>La vendange est coup\u00e9e par la borne de l\u2019exercice.</b> Elle court du '
        +fr(ann.vend.debut)+' au '+fr(ann.vend.fin)+', \u00e0 cheval sur deux ann\u00e9es comptables : une partie des heures et du co\u00fbt tombe d\u2019un c\u00f4t\u00e9, le reste de l\u2019autre. Aucune lecture annuelle n\u2019est fiable tant que c\u2019est le cas.'+bouton);
    } else if(!A.ok){
      out+=box('#FBF0DC','#8A5A38','\u2139\ufe0f <b>La vendange ouvre l\u2019ann\u00e9e au lieu de la clore.</b> Votre exercice d\u00e9marre le 1\u1D49\u02B3 '
        +MLB[ann.ex.mois]+' et la vendange tombe le '+fr(ann.vend.debut)+'. Une ann\u00e9e vigne va d\u2019<i>apr\u00e8s</i> la vendange \u00e0 la <i>fin</i> de la suivante : la taille et le tirage de ce cycle-l\u00e0 se lisent alors dans la m\u00eame ann\u00e9e que la r\u00e9colte qu\u2019ils pr\u00e9parent.'+bouton);
    } else {
      out+=box('#DCEBD0','var(--vert-med)','\u2713 <b>Ann\u00e9e vigne align\u00e9e.</b> Le cycle va d\u2019apr\u00e8s la vendange pr\u00e9c\u00e9dente \u00e0 la fin de celle du '
        +fr(ann.vend.fin)+'.');
    }
  }
  if(ann.hors&&ann.hors.length){
    out+=box('#FBF0DC','#8A5A38','\u2139\ufe0f <b>'+ann.hors.length+' p\u00e9riode'+(ann.hors.length>1?'s':'')+' hors de cet exercice</b> \u2014 '
      +_pilEsc(ann.hors.join(', '))+'. Leur travail et leur co\u00fbt tombent dans une autre ann\u00e9e comptable.');
  }
  return out;
}
function _pilFriseAnneeSvg(ann,w){
  if(!ann||!ann.weeks.length) return window._mvGraphVide(
    'Aucune p\u00e9riode dat\u00e9e sur la campagne',
    'Renseignez les dates de d\u00e9but et de fin de vos p\u00e9riodes (R\u00e9glages \u203a Saisons).');
  var selP=_pilAnnPer(_PIL_SCOPE.camp), s, e;
  if(selP){ var d0=_pilAnnOrd(selP.debut), d1=_pilAnnOrd(selP.fin);
    var mg=Math.max(2,Math.round((d1-d0)*0.04)); s=d0-mg; e=d1+mg; }
  else { s=ann.s; e=ann.e; }
  var L2=Math.max(1,e-s+1), W=(w>0)?Math.round(Math.max(620,w)):1000;
  var padL=(W<760)?38:52, padR=16, plotW=W-padL-padR;
  function X(o){ return padL+(o-s)/L2*plotW; }
  var tks=selP?_pilAnnTaches(selP):[];
  var bandH=selP?(tks.length*13+2):22;
  var padT=bandH+16, chH=(W<760)?170:206, scH=28, H=padT+chH+scH;
  var c=window._mvGraphCadre(W,H);
  var vis=ann.weeks.filter(function(x){
    return x.o1>=s && x.o0<=e && (selP?(x.per===selP.idx):true);
  });
  // ★ L'ECHELLE VERTICALE SUIT LE ZOOM — c'est tout l'interet du clic. Sur l'annee
  // l'axe monte au pic de vendange (~42) et l'hiver (~3) rampe en bas, illisible.
  // Zoome sur l'hiver l'axe redescend a 5 et le detail apparait.
  var yMax=1;
  vis.forEach(function(x){ if(x.need>yMax)yMax=x.need; if(x.head>yMax)yMax=x.head; });
  var step=yMax>60?20:(yMax>30?10:(yMax>12?5:(yMax>5?2:1)));
  var yTop=Math.ceil(yMax/step)*step; if(!(yTop>0))yTop=step;
  function Y(v){ return padT+chH-(v/yTop)*chH; }
  var MN=['JANV','F\u00c9VR','MARS','AVR','MAI','JUIN','JUIL','AO\u00dbT','SEPT','OCT','NOV','D\u00c9C'];
  var g='<defs><pattern id="pil-ann-h" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">'
    +'<line x1="0" y1="0" x2="0" y2="6" stroke="'+c.col.texte+'" stroke-width="1.4" opacity="0.28"/></pattern></defs>';
  if(!selP) ann.trous.forEach(function(t){
    var x0=X(Math.max(t[0],s)), x1=X(Math.min(t[1]+1,e+1));
    if(x1>x0) g+='<rect x="'+x0.toFixed(1)+'" y="'+padT+'" width="'+(x1-x0).toFixed(1)+'" height="'+chH+'" fill="url(#pil-ann-h)"/>';
  });
  for(var v=0;v<=yTop;v+=step){
    g+='<line x1="'+padL+'" y1="'+Y(v).toFixed(1)+'" x2="'+(W-padR)+'" y2="'+Y(v).toFixed(1)+'" stroke="'+c.col.grille+'" stroke-width="1"/>'
      +'<text x="'+(padL-7)+'" y="'+(Y(v)+4).toFixed(1)+'" text-anchor="end" font-size="'+c.txt.mini+'" fill="'+c.col.texte+'" font-family="Outfit">'+v+'</text>';
  }
  // ★ BARRES EMPILEES : vert = ce que l'equipe absorbe, rouge = le renfort a
  // trouver. L'ancienne barre etait coloriee EN ENTIER (vert OU rouge) : elle
  // disait « ca deborde » sans dire de combien. Ici la hauteur de rouge EST le
  // nombre de personnes a recruter, lisible sans calcul.
  vis.forEach(function(x){
    if(!(x.cap>0)||x.need<=0.01) return;
    var bx=Math.max(padL,X(x.o0))+1, bx2=Math.min(W-padR,X(x.o1+1)), bw=Math.max(1.5,bx2-bx-1);
    var base=Math.min(x.need,x.head), ov=Math.max(0,x.need-x.head);
    g+='<rect x="'+bx.toFixed(1)+'" y="'+Y(base).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+(padT+chH-Y(base)).toFixed(1)+'" rx="2" fill="'+_PIL_SEM.fait+'" opacity="0.85"/>';
    if(ov>0.02) g+='<rect x="'+bx.toFixed(1)+'" y="'+Y(x.need).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+(Y(base)-Y(x.need)).toFixed(1)+'" rx="2" fill="'+_PIL_SEM.faute+'" opacity="0.92"/>';
  });
  // Deux lignes : effectif PRESENT (plein) et SOCLE PERMANENT (pointille, equipes
  // collectives exclues — c'est headPerm, deja calcule par planning.js). Le socle
  // rend l'hiver lisible meme quand l'axe est cale sur le pic : on lit « au-dessus
  // de cette ligne, c'est du renfort a trouver », et non un chiffre absolu perdu.
  // ★ LA LIGNE SE COUPE SUR UN TROU. Elle enchainait en 'L' quelle que soit la
  //   distance : entre deux periodes separees d'un mois, un segment droit
  //   traversait une fenetre ou RIEN n'avait ete mesure. Le trait affirmait un
  //   effectif la ou l'application n'en connait aucun. On insere un point
  //   `gap` des que la semaine suivante ne colle pas a la precedente.
  var ptsH=[], ptsP=[], prevFin=null;
  vis.forEach(function(x){
    if(prevFin!==null && x.o0>prevFin+1){ ptsH.push({gap:true}); ptsP.push({gap:true}); }
    var x0=Math.max(padL,X(x.o0)), x1=Math.min(W-padR,X(x.o1+1));
    ptsH.push({x0:x0,x1:x1,y:Y(x.head)});
    ptsP.push({x0:x0,x1:x1,y:Y(x.headPerm)});
    prevFin=x.o1;
  });
  var qq=_pilPolyBreak(ptsP), pp=_pilPolyBreak(ptsH);
  if(qq) g+='<path d="'+qq+'" fill="none" stroke="'+_PIL_SEM.socle+'" stroke-width="1.8" stroke-dasharray="5 4"/>';
  if(pp) g+='<path d="'+pp+'" fill="none" stroke="var(--texte)" stroke-width="2.4" stroke-linejoin="round"/>';
  var tIso=(typeof window._mvAujIso==='function')?window._mvAujIso():new Date().toISOString().split('T')[0];
  var tj=_pilAnnOrd(tIso);
  // Le trait du jour est un REPERE, pas une alerte : il ne prend plus la
  // couleur des barres de renfort, avec qui il partageait `col.alerte`.
  if(tj>=s&&tj<=e) g+='<line x1="'+X(tj).toFixed(1)+'" y1="'+padT+'" x2="'+X(tj).toFixed(1)+'" y2="'+(padT+chH).toFixed(1)+'" stroke="'+_PIL_SEM.aujourdhui+'" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.55"/>';
  if(!selP){
    ann.pers.forEach(function(p){
      var x0=Math.max(padL,X(_pilAnnOrd(p.debut))), x1=Math.min(W-padR,X(_pilAnnOrd(p.fin)+1)), bw=x1-x0;
      if(!(bw>0)) return;
      g+='<g data-etpc="'+_pilEsc(p.nom)+'" style="cursor:pointer">'
        +'<rect x="'+x0.toFixed(1)+'" y="'+(padT-bandH-8)+'" width="'+bw.toFixed(1)+'" height="'+bandH+'" rx="4" fill="'+p.col+'"/>';
      if(bw>78) g+='<text x="'+(x0+bw/2).toFixed(1)+'" y="'+(padT-bandH+7)+'" text-anchor="middle" font-size="'+c.txt.axe+'" font-weight="600" fill="#fff" font-family="Outfit" pointer-events="none">'+_pilEsc(p.nom)+'</text>';
      g+='</g>';
    });
  } else {
    // Zoome : les bandes du haut deviennent les TACHES de la campagne. C'est la
    // reponse a « laquelle fait le pic ? », impossible a lire sur l'annee entiere.
    var r=0;
    tks.forEach(function(t){
      var x0=Math.max(padL,X(_pilAnnOrd(t.start))), x1=Math.min(W-padR,X(_pilAnnOrd(t.end)+1));
      var yy=padT-bandH-8+r*13;
      g+='<rect x="'+x0.toFixed(1)+'" y="'+yy+'" width="'+Math.max(3,x1-x0).toFixed(1)+'" height="11" rx="3" fill="'+_taskColor(t.nom)+'"/>'
        +'<text x="'+(x0+5).toFixed(1)+'" y="'+(yy+8.5)+'" font-size="'+c.txt.mini+'" font-weight="600" fill="#fff" font-family="Outfit">'+_pilEsc(t.nom)+'</text>';
      r++;
    });
  }
  var dt=new Date(Date.parse('2026-01-01T00:00:00')+s*86400000);
  var cy=dt.getUTCFullYear(), cm=dt.getUTCMonth();
  for(var q=0;q<30;q++){
    var mo0=_pilAnnOrd(cy+'-'+String(cm+1).padStart(2,'0')+'-01');
    if(mo0>e) break;
    var ny=(cm===11)?cy+1:cy, nm=(cm+1)%12;
    var mo1=_pilAnnOrd(ny+'-'+String(nm+1).padStart(2,'0')+'-01');
    if(mo1>=s){
      if(mo0>=s) g+='<line x1="'+X(mo0).toFixed(1)+'" y1="'+padT+'" x2="'+X(mo0).toFixed(1)+'" y2="'+(padT+chH+4).toFixed(1)+'" stroke="'+c.col.grille+'" stroke-width="1"/>';
      var cx=(X(Math.max(mo0,s))+X(Math.min(mo1,e+1)))/2;
      if(cx>padL+14&&cx<W-padR-14) g+='<text x="'+cx.toFixed(1)+'" y="'+(padT+chH+19)+'" text-anchor="middle" font-size="'+c.txt.mini+'" font-weight="600" fill="'+c.col.texte+'" font-family="Outfit">'+MN[cm]+'</text>';
    }
    cy=ny; cm=nm;
  }
  return window._mvGraphSvg(window._mvGraphCadre(W,H),
    (selP?('Personnes n\u00e9cessaires par semaine sur '+selP.nom):'Personnes n\u00e9cessaires par semaine sur la campagne')
    +', face \u00e0 l\u2019effectif pr\u00e9sent.', g);
}

function _pilPanelEtp(d){
  var cd=(window._chargeSaisonData&&window.getSaisonActive)?window._chargeSaisonData(window._pilSaison()):null;
  if(!cd||!cd.months.length){
    return _pilTile('etp','\u2696\uFE0F','#C9A84C','Charge & ETP \u00b7 saison', _pilStat('\u2014',''), 'datez la saison pour estimer la charge', null,
      '<div class="pil-empty">Renseignez les dates de d\u00e9but et de fin de la saison active (R\u00e9glages \u203a Saisons) pour calculer la charge et l\'ETP n\u00e9cessaire.</div>');
  }
  function _e(v){ return (Math.round((v||0)*10)/10).toString().replace('.',','); }
  var s=_PIL_STATE.sub||{};
  var real=_pilTaskReal(cd,d);
  var ann=_pilAnnuelData();
  // ══ LE PIC ET L'EFFECTIF SE LISENT A LA SEMAINE ═══════════════════════════
  // cd.peakReq est desormais le maximum HEBDOMADAIRE et cd.peakPres l'effectif de
  // CETTE semaine-la (planning.js). Avant, deux moyennes mensuelles de grandeurs
  // qui varient d'un facteur 20 dans le mois se comparaient : « 27 ETP requis »
  // (des heures de 5 jours divisees par 5 jours de capacite) contre « 11,2
  // presents » (une semaine a 42 noyee dans trois semaines a 2 — un chiffre qui
  // n'existe AUCUN jour de l'annee). L'ecran annonçait « manque 15,8 ETP » pendant
  // que la courbe hebdo, juste, montrait la vendange couverte. Le meme ecran
  // disait deux choses contraires ; il n'en dit plus qu'une.
  var peak4=cd.peakReq||0, presAtPeak=(cd.peakPres!=null)?cd.peakPres:0;
  var anyShort=!!cd.anyShort, pkw=cd.peakWeek||null;
  var MOA=['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];
  function _semLab(wk){
    if(!wk) return '';
    var dd=new Date(Date.parse('2026-01-01T00:00:00')+wk.o0*86400000);
    return 'semaine du '+dd.getUTCDate()+' '+MOA[dd.getUTCMonth()];
  }
  var synth, sBg, sCol;
  if(anyShort){
    var miss=Math.max(0,peak4-presAtPeak);
    synth='Pic \u00e0 '+_e(peak4)+' personnes'+(pkw?(' \u00b7 '+_semLab(pkw)):'')+' pour '+_e(presAtPeak)+' pr\u00e9sentes \u2192 il en manque ~'+_e(miss);
    sBg='#F3D9D4'; sCol='var(--rouge)';
  } else {
    synth='Aucune semaine en sous-effectif. Pic \u00e0 '+_e(peak4)+' personnes'+(pkw?(' \u00b7 '+_semLab(pkw)):'')+'.';
    sBg='#DCEBD0'; sCol='var(--vert-med)';
  }
  function chip(k,lab){ var on=s[k]!==0; return '<button data-etp="'+k+'" style="border:1px solid '+(on?'#C9A84C':'var(--gris)')+';background:'+(on?'#C9A84C22':'#fff')+';color:'+(on?'#8A5A38':'var(--texte-doux)')+';border-radius:20px;padding:4px 11px;font-size:11.5px;font-weight:600;cursor:pointer;margin:0 6px 6px 0">'+(on?'\u2713 ':'')+lab+'</button>'; }
  var chips='<div style="margin:-2px 0 8px">'+chip('etp_annee','Ann\u00e9e')+chip('etp_frise','Frise')+chip('etp_courbe','Courbe / sem.')+chip('etp_ecart','\u00c9cart pr\u00e9vu/r\u00e9el')+'</div>';
  var friseLeg='<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:11.5px;color:var(--texte-doux);margin:8px 0 2px">'
    +'<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:14px;height:10px;border-radius:3px;background:var(--terre);display:inline-block"></i> pr\u00e9vu</span>'
    +'<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:14px;height:10px;border-radius:3px;border:1px solid #14110D;background:repeating-linear-gradient(45deg,#14110D,#14110D 2px,transparent 2px,transparent 5px);display:inline-block"></i> r\u00e9el (journal)</span>'
    +'<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:14px;height:10px;border-radius:3px;background:var(--orange);display:inline-block"></i> en cours</span>'
    +'<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:16px;height:0;border-top:2px dashed #9B2D1F;display:inline-block"></i> aujourd\'hui</span></div>';
  var curveLeg='<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:11.5px;color:var(--texte-doux);margin:8px 0 2px">'
    +'<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:14px;height:10px;border-radius:3px;background:#5C8A3E;display:inline-block"></i> dans l\'effectif</span>'
    +'<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:14px;height:10px;border-radius:3px;background:#9B2D1F;display:inline-block"></i> pic \u2014 sous-effectif</span>'
    +'<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:16px;height:0;border-top:2px solid #14110D;display:inline-block"></i> effectif pr\u00e9sent</span></div>';
  var annLeg='<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:11.5px;color:var(--texte-doux);margin:8px 0 2px">'
    +'<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:14px;height:10px;border-radius:3px;background:var(--vert-med);display:inline-block"></i> couvert par l\u2019\u00e9quipe</span>'
    +'<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:14px;height:10px;border-radius:3px;background:var(--rouge);display:inline-block"></i> renfort \u00e0 trouver</span>'
    +'<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:16px;height:0;border-top:2px solid var(--texte);display:inline-block"></i> effectif pr\u00e9sent</span>'
    +'<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:16px;height:0;border-top:2px dashed #4A9FC8;display:inline-block"></i> socle permanent</span></div>';
  var secTtl='font-weight:600;font-size:12.5px;color:var(--cave);margin:14px 0 2px';
  // ── Frise annuelle : clic sur une campagne = ZOOM (axe X et axe Y) ───────────
  var annBlock='';
  if(s.etp_annee!==0 && ann){
    var _selP=_pilAnnPer(_PIL_SCOPE.camp);
    annBlock='<div style="display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px;margin:2px 0 2px">'
      +'<div style="'+secTtl+';margin:0">'+(_selP?_pilEsc(_selP.nom):'Toute la campagne')+' \u2014 personnes n\u00e9cessaires / semaine</div>'
      +(_selP?('<button data-etpc="'+_pilEsc(_selP.nom)+'" style="border:1px solid var(--gris);background:#fff;color:var(--texte-doux);border-radius:20px;padding:4px 11px;font-size:11.5px;font-weight:600;cursor:pointer">\u2190 toute la campagne</button>'):'')
      +'</div>'
      +'<div style="font-size:10px;color:var(--texte-doux);margin:0 0 6px">'
      +(_selP?'L\u2019\u00e9chelle verticale suit le zoom \u2014 les bandes du haut sont les t\u00e2ches de la campagne.'
             :((ann.ex?('Ann\u00e9e = exercice comptable \u00b7 '+_pilEsc(ann.ex.lbl)+'. '):'')
               +'Cliquez une campagne pour zoomer dessus. Les zones hachur\u00e9es ne sont couvertes par aucune p\u00e9riode.'))
      +'</div>'
      +(_selP?'':_pilAnneeVigneHtml(ann))
      +'<div style="width:100%;overflow-x:auto" id="pil-g-ann"></div>'+annLeg;
    if(ann.ovl.length) annBlock+='<div style="margin:6px 0 0;padding:8px 11px;border-radius:9px;background:#F3D9D4;color:var(--rouge);font-size:12px;font-weight:600">'
      +'\u26A0 Chevauchement de p\u00e9riodes sur '+_pilEsc(ann.ovl.join(', '))+' \u2014 les heures y sont compt\u00e9es deux fois sur la frise.</div>';
    window._mvGraphSuivre('#pil-g-ann', function(lg){ return _pilFriseAnneeSvg(ann,lg); });
  }
  // ── Bloc répartition « Où va le temps » (présence → vigne / tracteur / autres) ──
  var _tH=(window._tractHoursSeason)?Math.round(window._tractHoursSeason(window._pilSaison())||0):0;
  var _prez=Math.round(cd.capEquipe||0), _vig=Math.round(cd.charge||0), _cr=cd.capRefTotal||0;
  var _etpF=function(h){return _cr>0?(h/_cr).toFixed(1).replace('.',','):'\u2014';};
  // ══ UNE PART NE PEUT PAS DEPASSER 100 % ═══════════════════════════════════
  // _pV=_vig/_prez*100 sortait a 392 % dans une barre qui se PRESENTE comme une
  // repartition, pendant qu'« Autres » tombait a 0 h par le Math.max(0,...) : la
  // barre mentait deux fois — une part impossible, et un reste invente a zero
  // alors qu'il y a bien de la cave et des trajets. Desormais la surcharge se DIT.
  // (La cause premiere du 392 % — l'equipe collective comptee pour 1 — est reglee
  //  dans planning.js, capEquipe/*_mbPoids* ; ce garde-fou reste utile en soi.)
  var _tot=_vig+_tH, _surch=(_prez>0 && _tot>_prez+0.5), _ratio=(_prez>0)?(_tot/_prez):0;
  var _aut=_surch?0:Math.max(0,_prez-_vig-_tH);
  var _base=_surch?_tot:(_prez||1);
  var _wV=_vig/_base*100, _wT=_tH/_base*100, _wA=_surch?0:Math.max(0,100-_wV-_wT);
  var _pV=Math.round(_wV), _pT=Math.round(_wT), _pA=_surch?0:Math.max(0,100-_pV-_pT);
  var _segR=function(wd,gr){return (wd>0.5)?('<div style="width:'+wd+'%;background:'+gr+';display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:700;color:#fff">'+Math.round(wd)+'\u00a0%</div>'):'';};
  var _rowR=function(col,nm,sub,val,pct,etp){return '<div style="display:flex;align-items:center;gap:9px;font-size:12.5px;padding:5px 0;border-top:1px solid var(--gris)"><span style="width:10px;height:10px;border-radius:3px;background:'+col+';flex-shrink:0"></span><span style="flex:1">'+nm+' <span style="font-size:11px;color:var(--texte-doux)">'+sub+'</span></span><span style="font-weight:700">'+_pilNum(val)+' h</span><span style="font-size:11px;color:var(--texte-doux);margin-left:6px">'+pct+'\u00a0% \u00b7 '+etp+' ETP</span></div>';};
  var _footR='Il faut <b style="color:#3D6B27">'+_etpF(_vig)+' ETP</b> pour la vigne'
    +((_tH>0)?(' et <b style="color:#4A9FC8">'+_etpF(_tH)+' ETP</b> au tracteur'):'')
    +' <b>en moyenne sur la p\u00e9riode</b>. ';
  if(_surch){
    _footR+='La pr\u00e9sence de l\u2019\u00e9quipe ('+_pilNum(_prez)+' h) ne couvre pas cette charge : <b style="color:var(--rouge)">surcharge \u00d7'
      +(Math.round(_ratio*10)/10).toString().replace('.',',')+'</b>. Rien ne reste pour la cave, les trajets ou l\u2019entretien.';
  } else {
    _footR+='Le reste ('+_etpF(_aut)+' ETP) part sur cave, trajets, entretien\u2026'
      +((_tH>0)?'':' Renseigne un bar\u00e8me h/ha par activit\u00e9 (R\u00e9glages) pour d\u00e9tacher le tracteur d\u2019\u00ab Autres \u00bb.');
  }
  // ★ Une moyenne n'est pas un pic : le dire ICI, a cote du chiffre moyen, est le
  //   seul endroit ou quelqu'un risque de le confondre avec un besoin reel.
  _footR+=' <b>Une moyenne n\u2019est pas un pic</b> \u2014 la frise ci-dessus donne la semaine la plus charg\u00e9e.';
  var repartBlock='<div style="border:1px solid var(--gris);border-radius:11px;padding:12px 14px;margin-bottom:12px;background:#fff">'
    +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--texte-doux)">O\u00f9 va le temps de l\u2019\u00e9quipe</div>'
    +'<div style="display:flex;align-items:baseline;gap:7px;margin:8px 0 3px"><span style="font-family:\'Cormorant Garamond\',serif;font-size:26px;font-weight:700;color:var(--cave)">'+_pilNum(_prez)+' h</span><span style="font-size:12px;color:var(--texte-doux)">pr\u00e9sence \u00b7 '+_etpF(_prez)+' ETP \u00e9quipe</span></div>'
    +'<div style="display:flex;height:24px;border-radius:7px;overflow:hidden;border:1px solid var(--gris);margin:9px 0">'+_segR(_wV,'linear-gradient(180deg,#5C8A3A,#3D6B27)')+_segR(_wT,'linear-gradient(180deg,#6FB6D6,#4A9FC8)')+_segR(_wA,'linear-gradient(180deg,#B98A5E,#8A5A38)')+'</div>'
    +_rowR('#3D6B27','Travaux vigne','(bar\u00e8me)',_vig,_pV,_etpF(_vig))
    +((_tH>0)?_rowR('#4A9FC8','Tracteur','(estim\u00e9 h/ha)',_tH,_pT,_etpF(_tH)):'')
    +(_surch?'':_rowR('#8A5A38','Autres',((_tH>0)?'(cave, trajet, entretien\u2026)':'(tracteur, cave, trajet\u2026)'),_aut,_pA,_etpF(_aut)))
    +'<div style="font-size:11px;color:var(--texte-doux);margin-top:10px;background:rgba(74,159,200,.08);border-radius:8px;padding:8px 11px">'+_footR+'</div>'
  +'</div>';
  var body=chips+annBlock+repartBlock;
  if(s.etp_frise!==0){ body+='<div style="font-size:10px;color:var(--texte-doux);margin:14px 0 6px">Frise pr\u00e9vu / r\u00e9el \u2014 fen\u00eatres modifiables dans l\'onglet <b>Param\u00e9trage</b></div>'
    +'<div style="width:100%;overflow-x:auto" id="pil-g-frise"></div>'+friseLeg;
    window._mvGraphSuivre('#pil-g-frise', function(lg){ return _pilFriseSvg(cd,real,lg); }); }
  if(s.etp_courbe!==0){ body+='<div style="'+secTtl+'">'+_pilEsc(cd.saison)+' \u2014 personnes n\u00e9cessaires / semaine</div><div style="width:100%;overflow-x:auto" id="pil-g-dem"></div>'+curveLeg;
    window._mvGraphSuivre('#pil-g-dem', function(lg){ return _pilDemandSvg(cd,lg); }); }
  if(s.etp_ecart!==0){ body+='<div style="'+secTtl+'">\u00c9cart pr\u00e9vu / r\u00e9el</div>'+_pilEcartHtml(cd,real); }
  body+='<div style="margin-top:10px;padding:9px 11px;border-radius:9px;background:'+sBg+';color:'+sCol+';font-size:12.5px;font-weight:600">'+synth+'</div>';
  var cov=peak4>0?Math.min(presAtPeak/peak4*100,100):100;
  return _pilTile('etp','\u2696\uFE0F','#C9A84C','Charge & ETP \u00b7 '+cd.saison, _pilStat(_e(peak4),' au pic'),
    _pilNum(cd.charge)+' h \u00b7 '+_e(presAtPeak)+' pr\u00e9sents au pic'+(pkw?(' \u00b7 '+_semLab(pkw)):''), cov, body);
}
function _pilFmtD(iso){ var pp=String(iso||'').split('-'); if(pp.length!==3)return String(iso||''); var mo=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']; var mi=parseInt(pp[1],10)-1; return parseInt(pp[2],10)+' '+(mo[mi]||''); }
function _pilEchWin(e){ if(!e)return ''; var a=e.d1?_pilFmtD(e.d1):'', b=e.d2?_pilFmtD(e.d2):''; if(a&&b)return a+' → '+b; if(a)return 'dès '+a; if(b)return 'jusqu’au '+b; return ''; }
function _pilPanelEcheances(d){
  var c=_pilEchCadence(d), cadH=c.cadH;
  var _echS=((window._pilSaison&&window._pilSaison())||{}).echeances||{};
  var act=(d.active||[]).filter(function(t){ return (t.h_reste||0)>0; });
  var rows=act.map(function(t){
    return { nom:t.nom, pct:t.pct||0, hreste:t.h_reste||0, jours:(cadH>0?Math.ceil((t.h_reste||0)/cadH):null), ech:_echS[t.nom]||null };
  });
  rows.sort(function(a,b){ return (b.jours||0)-(a.jours||0); });
  var maxJ=rows.length?(rows[0].jours||0):0;
  var seasonJ=(cadH>0)?Math.ceil((d.totalReste||0)/cadH):null;
  var statHtml=_pilStat(rows.length, ' tâche'+(rows.length>1?'s':''));
  var subHtml=(cadH>0)
    ? ('fin de saison ~'+_pilWorkdayDate(seasonJ)+' · '+(seasonJ!=null?seasonJ:'—')+' j ouvrés · ~'+Math.round(cadH)+' h/j'+(c.estim?' (estim.)':' (4 sem.)'))
    : 'cadence indisponible — repose sur le planning';
  var body;
  if(!rows.length){ body='<div class="pil-empty">Aucune tâche en cours</div>'; }
  else if(cadH<=0){ body='<div class="pil-empty">Cadence indisponible : les jours ouvrés se calculent sur le planning (4 dernières semaines).</div>'; }
  else {
    body='<div class="pil-ip-list">'+rows.map(function(r){
      var col=_pilPctColor(r.pct), emo=(window.TEMOJI&&window.TEMOJI[r.nom])?window.TEMOJI[r.nom]:'🌿';
      var pole=(rows.length>1 && r.jours===maxJ);
      return '<div class="pil-li">'
        + '<span class="pil-av" style="background:'+col+'26;color:'+col+'">'+emo+'</span>'
        + '<div class="pil-li-main">'
        +   '<div class="pil-li-t">'+_pilEsc(_pilTnom(r.nom))+'</div>'
        +   '<div class="pil-li-s">'+r.pct+'% fait · '+_pilNum(r.hreste)+' h restantes'+((r.ech&&(r.ech.d1||r.ech.d2))?' · '+_pilEchWin(r.ech):'')+(pole?' · <b style="color:var(--or)">pôle long</b>':'')+'</div>'
        + '</div>'
        + '<div class="pil-li-r"><b style="font-size:16px;color:'+(pole?'var(--or)':'var(--texte)')+'">'+(r.jours!=null?r.jours+' j':'—')+'</b></div>'
        + '</div>';
    }).join('')+'</div>';
  }
  return _pilTile('echeances','📅','#C9A84C','Échéances par tâche', statHtml, subHtml, null, body);
}


// ── Fenêtre de traitement sur 5 jours (sec · vent < 19 km/h · sous 25°, plage 0h–24h) ──
// Réglages anti-lessivage / probabilité de pluie (défauts)
var PIL_TREAT_DRY_H=6;     // heures de séchage surveillées APRÈS la fenêtre
var PIL_TREAT_LEACH_MM=1;  // pluie cumulée (mm) déclenchant l'alerte lessivage
var PIL_TREAT_PP_ALERT=40; // proba de pluie (%) sur la plage déclenchant l'alerte
function _pilTreatDays(){
  var mh=window.METEO_HOURLY||null;
  if(!mh){ try{ mh=JSON.parse(localStorage.getItem('mavigne_meteohr_cache')||'null'); }catch(e){ mh=null; } }
  if(!mh||!mh.time||!mh.time.length) return undefined;
  var T=mh.time, TE=mh.temp||[], PR=mh.precip||[], PP=mh.pp||[], WD=mh.wind||[], now=Date.now();
  var JJ=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'], today=new Date().toDateString();
  function dry(i){ return (Number(PR[i])||0)<0.1; }
  function calm(i){ return (Number(WD[i])||0)<19; }
  function cool(i){ return (Number(TE[i])||99)<25; }
  function ok(i){ return dry(i)&&calm(i)&&cool(i); }
  // Regroupe les heures futures par jour (ordre conservé)
  var order=[], map={};
  for(var i=0;i<T.length;i++){
    var dt=new Date(T[i]); if(dt.getTime()<now-3600000) continue;
    var key=dt.getFullYear()+'-'+dt.getMonth()+'-'+dt.getDate();
    if(!map[key]){ map[key]={ date:dt, idx:[] }; order.push(key); }
    map[key].idx.push(i);
  }
  return order.slice(0,5).map(function(key){
    var day=map[key], idx=day.idx, dt=day.date;
    var lab=(dt.toDateString()===today)?'Aujourd\'hui':(JJ[dt.getDay()]+' '+dt.getDate());
    // Meilleure (plus longue) plage continue >= 2 h
    var best=null, st=-1;
    for(var k=0;k<idx.length;k++){
      var gi=idx[k], cont=(k>0 && idx[k]===idx[k-1]+1);
      if(ok(gi)){
        if(st<0||!cont) st=k;
        if(k-st+1>=2 && (!best||(k-st+1)>(best.e-best.s+1))) best={ s:st, e:k };
      } else { st=-1; }
    }
    if(best){
      var wMax=0,tMax=0,ppMax=0;
      for(var m=best.s;m<=best.e;m++){ var g=idx[m]; wMax=Math.max(wMax,Number(WD[g])||0); tMax=Math.max(tMax,Number(TE[g])||0); ppMax=Math.max(ppMax,Number(PP[g])||0); }
      // Lessivage : pluie cumulée sur les heures suivant la fenêtre
      var endG=idx[best.e], leachMm=0, leachH=0;
      for(var lj=endG+1; lj<T.length && lj<=endG+PIL_TREAT_DRY_H; lj++){ leachMm+=Number(PR[lj])||0; leachH++; }
      leachMm=Math.round(leachMm*10)/10;
      var hasPP=PP.length>0;
      return { label:lab, start:new Date(T[idx[best.s]]).getHours(), end:new Date(T[idx[best.e]]).getHours()+1,
               wMax:Math.round(wMax), tMax:Math.round(tMax),
               ppMax:hasPP?Math.round(ppMax):null,
               leach:(PIL_TREAT_DRY_H>0 && leachMm>=PIL_TREAT_LEACH_MM), leachMm:leachMm, leachH:leachH };
    }
    // Aucune fenêtre : motif dominant
    var rRain=0,rWind=0,rHeat=0;
    for(var p=0;p<idx.length;p++){ var g2=idx[p]; if(!dry(g2)) rRain++; else if(!calm(g2)) rWind++; else if(!cool(g2)) rHeat++; }
    var reason='conditions';
    if(rRain>=rWind && rRain>=rHeat && rRain>0) reason='pluie';
    else if(rWind>=rHeat && rWind>0) reason='vent ≥ 19 km/h';
    else if(rHeat>0) reason='≥ 25°';
    return { label:lab, reason:reason };
  });
}
function _pilTBdg(bg,col,txt){ return '<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 8px;border-radius:7px;line-height:1.2;background:'+bg+';color:'+col+'">'+txt+'</span>'; }
function _pilMm(v){ return (v%1===0?String(v):v.toFixed(1)).replace('.',',')+' mm'; }
function _pilPanelTraitement(d){
  var days=_pilTreatDays();
  var sub='sec · vent < 19 km/h · sous 25° · plage 0h–24h', statHtml, body;
  if(days===undefined){ statHtml=_pilStat('—',''); body='<div class="pil-empty">Prévisions horaires indisponibles (rechargez avec une connexion).</div>'; }
  else if(!days.length){ statHtml=_pilStat('—',''); body='<div class="pil-empty">Aucune fenêtre claire sur les prochains jours (pluie, vent ≥ 19 km/h ou ≥ 25°). À surveiller.</div>'; }
  else {
    var nbWin=days.filter(function(x){ return x.start!=null; }).length;
    statHtml=_pilStat(nbWin,' j');
    var rows=days.map(function(x){
      if(x.start!=null){
        var risk=x.leach||(x.ppMax!=null && x.ppMax>=PIL_TREAT_PP_ALERT);
        var bg=risk?'var(--orange-pale)':'var(--vert-pale)', bd=risk?'var(--orange)':'var(--vert-med)';
        var bdgs='';
        if(x.leach) bdgs+=_pilTBdg('var(--orange-pale)','var(--orange)','⚠️ pluie '+_pilMm(x.leachMm)+' dans '+x.leachH+' h → lessivage');
        else bdgs+=_pilTBdg('var(--vert-pale)','var(--vert-med)','✓ '+PIL_TREAT_DRY_H+' h au sec ensuite');
        if(x.ppMax!=null){
          if(x.ppMax>=PIL_TREAT_PP_ALERT) bdgs+=_pilTBdg('var(--orange-pale)','var(--orange)','☔ '+x.ppMax+' % de pluie');
          else bdgs+=_pilTBdg('rgba(127,127,127,.12)','var(--texte-doux)',x.ppMax+' % de pluie');
        }
        return '<div style="padding:8px 11px;border-radius:10px;background:'+bg+';border-left:3px solid '+bd+'">'
          + '<div style="display:flex;align-items:center;gap:9px">'
          + '<span style="width:70px;font-size:12.5px;font-weight:700;color:var(--texte);flex:none">'+_pilEsc(x.label)+'</span>'
          + '<span style="flex:1;font-size:15px;font-weight:800;color:'+bd+'">'+x.start+'h → '+x.end+'h</span>'
          + '<span style="font-size:10.5px;color:var(--texte-doux);white-space:nowrap">'+x.wMax+' km/h · '+x.tMax+'°</span>'
          + '</div>'
          + '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:7px">'+bdgs+'</div>'
          + '</div>';
      }
      return '<div style="display:flex;align-items:center;gap:9px;padding:8px 11px;border-radius:10px;border-left:3px solid var(--gris-clair)">'
        + '<span style="width:70px;font-size:12.5px;font-weight:700;color:var(--texte-doux);flex:none">'+_pilEsc(x.label)+'</span>'
        + '<span style="flex:1;font-size:12px;color:var(--texte-doux);font-style:italic">aucune fenêtre · '+x.reason+'</span>'
        + '</div>';
    }).join('');
    body='<div style="display:flex;flex-direction:column;gap:6px;padding-top:4px">'+rows+'</div>'
      + '<div style="font-size:11px;color:var(--texte-doux);margin-top:11px;line-height:1.5">Au-delà de 25° : phytotoxicité (soufre, cuivre, foliaires) et efficacité en baisse · vent &gt; 19 km/h interdit. Vérifie tes délais DAR / DRE / ZNT.</div>';
  }
  return _pilTile('traitement','💧','#5A9FD4','Fenêtre de traitement', statHtml, sub, null, body);
}

// ── Simulateur « et si ? » (réallocation de l'équipe, recalcul des dates en direct) ──
var _PIL_SIM=null, _PIL_SIM_DATA=null;
function _pilIndispoNoms(d){
  return (d.presences||[]).filter(function(p){ return !p.bureau && p.etat!=='present'; }).map(function(p){
    var t=p.etat==='cp'?'CP':p.etat==='recup'?'récup':p.etat==='maladie'?'maladie':'absent';
    return p.nom+' ('+t+')';
  });
}
function _pilSimClamp(){
  if(!_PIL_SIM) return;
  var a=_PIL_SIM.alloc, pool=_PIL_SIM.pool, assigned=a.reduce(function(x,y){return x+y;},0), g=0;
  while(assigned>pool && g<200){ g++; var mi=0; for(var i=1;i<a.length;i++){ if(a[i]>=a[mi]) mi=i; } if(a[mi]<=0) break; a[mi]--; assigned--; }
}
function _pilSimEven(nT, ppl){ var a=[]; for(var i=0;i<nT;i++)a.push(0); if(nT>0){ for(var k=0;k<ppl;k++)a[k%nT]++; } return a; }
function _pilSimInitData(d){
  var c=_pilEchCadence(d), cadH=c.cadH, nV=(d.membres||[]).filter(function(m){ return m && !m.bureau; }).length;
  var perH=(cadH>0&&nV>0)?(cadH/nV):0;
  var present=(typeof d.presentChamp==='number')?d.presentChamp:nV;
  var tasks=(d.active||[]).filter(function(t){ return (t.h_reste||0)>0; }).sort(function(a,b){ return (b.h_reste||0)-(a.h_reste||0); }).map(function(t){ return {nom:t.nom,hreste:Math.round(t.h_reste||0),pct:t.pct||0}; });
  _PIL_SIM_DATA={ tasks:tasks, cadH:cadH, nV:nV, present:present, perH:perH, indispo:(d.nIndispoChamp||0), indispoNoms:_pilIndispoNoms(d) };
  if(!_PIL_SIM || _PIL_SIM.alloc.length!==tasks.length || _PIL_SIM._present!==present){
    _PIL_SIM={ alloc:_pilSimEven(tasks.length,present).slice(), pool:present, _present:present };
  }
}
function _pilSimReset(){ if(_PIL_SIM_DATA){ _PIL_SIM={ alloc:_pilSimEven(_PIL_SIM_DATA.tasks.length,_PIL_SIM_DATA.present).slice(), pool:_PIL_SIM_DATA.present, _present:_PIL_SIM_DATA.present }; } }
function _pilSimStep(act, ti, sym, on){
  var t=(ti!=null)?(' data-ti="'+ti+'"'):'';
  return '<button data-sim="'+act+'"'+t+' style="width:30px;height:30px;border:1px solid var(--gris-clair);border-radius:7px;background:'+(on?'rgba(127,127,127,.08)':'transparent')+';color:'+(on?'var(--texte)':'var(--texte-doux)')+';font-size:18px;font-weight:700;cursor:'+(on?'pointer':'default')+';line-height:1'+(on?'':';opacity:.4')+'">'+sym+'</button>';
}
function _pilSimStepper(kind, ti, val, canDec, canInc){
  var dec=(kind==='pool')?'pool-dec':'dec', inc=(kind==='pool')?'pool-inc':'inc';
  return '<span style="display:inline-flex;align-items:center;gap:7px">'+_pilSimStep(dec,ti,'−',canDec)+'<b style="min-width:22px;text-align:center;font-size:16px;color:var(--texte);font-variant-numeric:tabular-nums">'+val+'</b>'+_pilSimStep(inc,ti,'+',canInc)+'</span>';
}
function _pilSimBody(){
  var D=_PIL_SIM_DATA, S=_PIL_SIM;
  if(!D || D.cadH<=0 || D.nV<=0 || !D.tasks.length){ return '<div class="pil-empty">Simulateur indisponible : il faut une cadence planning, au moins un membre au champ et une tâche en cours.</div>'; }
  var perH=D.perH, pool=S.pool, assigned=S.alloc.reduce(function(a,b){return a+b;},0), free=pool-assigned;
  function jr(h,pp){ return pp>0?Math.ceil(h/(pp*perH)):null; }
  // réf. par tâche = ton effectif réparti également → isole l'effet de TA répartition
  var evenNow=_pilSimEven(D.tasks.length,assigned);
  var calc=D.tasks.map(function(t,i){ var j=jr(t.hreste,S.alloc[i]), bj=jr(t.hreste,evenNow[i]); return {j:j,delta:(j!=null&&bj!=null)?(j-bj):null}; });
  var totH=D.tasks.reduce(function(a,t){return a+t.hreste;},0);
  // ⚠⚠ LA FIN DE SAISON EST CELLE DE LA DERNIERE TACHE FINIE, pas le total
  //   divise par l'effectif. L'ancien calcul divisait par le POOL : on pouvait
  //   laisser deux taches « a l'arret » et lire quand meme la meme date de fin,
  //   et le curseur de repartition — le seul geste du panneau — ne bougeait
  //   jamais son propre indicateur. Une tache sans personne n'avance pas : la
  //   saison ne finit pas, et l'ecran doit le dire.
  function _finDe(al){ var mx=0; for(var q=0;q<D.tasks.length;q++){ var jq=jr(D.tasks[q].hreste,al[q]); if(jq==null) return null; if(jq>mx) mx=jq; } return D.tasks.length?mx:null; }
  var nArret=0; D.tasks.forEach(function(t,i){ if(!(S.alloc[i]>0)) nArret++; });
  var seasonJ=_finDe(S.alloc);                                 // fin a la repartition affichee
  var fullSeasonJ=_finDe(_pilSimEven(D.tasks.length,D.nV));    // ref. = equipe au complet, repartie egalement
  var sDelta=(seasonJ!=null&&fullSeasonJ!=null)?(seasonJ-fullSeasonJ):null;
  var chargeJH=Math.round(totH/perH);
  var sDate=seasonJ!=null?_pilWorkdayDate(seasonJ):null;
  function stat(lab,val,col){ return '<div style="flex:1;min-width:118px"><div style="font-size:10px;font-weight:700;letter-spacing:1px;color:var(--texte-doux)">'+lab+'</div><div style="font-size:18px;font-weight:800;color:'+(col||'var(--texte)')+'">'+val+'</div></div>'; }
  var h='<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px">';
  h+=stat('CHARGE', chargeJH+' <span style="font-size:12px;color:var(--texte-doux)">j-homme</span>');
  h+=stat('EFFECTIF', assigned+'<span style="font-size:12px;color:var(--texte-doux)"> / '+pool+'</span>');
  var fin=(sDate?'~ '+sDate:'à l\'arrêt')+(sDelta!=null&&sDelta!==0?' <span style="font-size:11px;font-weight:700;color:'+(sDelta<0?'var(--vert-med)':'var(--rouge)')+'">('+(sDelta<0?(-sDelta+' j plus tôt'):('+'+sDelta+' j'))+')</span>':'');
  h+=stat('FIN DE SAISON', fin, 'var(--or)');
  h+='</div>';
  h+='<div style="font-size:10px;color:var(--texte-doux);margin:-6px 0 12px">fin de saison \u00b7 r\u00e9f. \u00e9quipe au complet ('+D.nV+')'
    + (nArret>0?(' \u00b7 <b style="color:var(--rouge)">'+nArret+' t\u00e2che'+(nArret>1?'s':'')+' sans personne : la saison ne se termine pas</b>'):'')
    + (free>0?(' \u00b7 <b style="color:var(--orange)">'+free+' personne'+(free>1?'s':'')+' non affect\u00e9e'+(free>1?'s':'')+'</b>'):'')+'</div>';
  var presLine=D.present+' présent'+(D.present>1?'s':'')+' aujourd\'hui';
  if(D.indispo>0){ presLine+=' <span style="color:var(--rouge)">· −'+D.indispo+' indispo'+((D.indispoNoms&&D.indispoNoms.length)?' ('+_pilEsc(D.indispoNoms.join(', '))+')':'')+'</span>'; }
  var renfortDelta=pool-D.present;
  var rdLab=renfortDelta>0?('+'+renfortDelta+' renfort'):(renfortDelta<0?(renfortDelta+' en moins'):'équipe du jour');
  var rdCol=renfortDelta>0?'var(--vert-med)':(renfortDelta<0?'var(--rouge)':'var(--texte-doux)');
  h+='<div style="border:1px solid var(--gris-clair);border-radius:11px;padding:11px 13px;margin-bottom:10px;background:rgba(201,168,76,.05)">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px">'
    + '<div><div style="font-size:13.5px;font-weight:700;color:var(--texte)">Effectif au champ'+(free>0?' <span style="font-size:11px;color:var(--orange);font-weight:700">· '+free+' libre'+(free>1?'s':'')+'</span>':'')+'</div>'
    + '<div style="font-size:11.5px;color:var(--texte-doux);margin-top:2px">'+presLine+'</div></div>'
    + '<div style="text-align:center">'+_pilSimStepper('pool',null,pool,pool>0,pool<D.nV+6)
    + '<div style="font-size:10.5px;font-weight:700;margin-top:3px;color:'+rdCol+'">'+rdLab+'</div></div>'
    + '</div></div>';
  var maxJ=0; calc.forEach(function(c){ if(c.j!=null&&c.j>maxJ)maxJ=c.j; });
  h+='<div class="pil-ip-list">';
  D.tasks.forEach(function(t,i){
    var c=calc[i], emo=(window.TEMOJI&&window.TEMOJI[t.nom])?window.TEMOJI[t.nom]:'🌿', pole=(D.tasks.length>1&&c.j!=null&&c.j===maxJ);
    var dS=(c.delta==null||c.delta===0)?'':' <b style="color:'+(c.delta<0?'var(--vert-med)':'var(--rouge)')+'">'+(c.delta<0?c.delta:'+'+c.delta)+'j</b>';
    h+='<div class="pil-li"><span class="pil-av" style="background:#16313F;color:#4A9FC8">'+emo+'</span>'
      + '<div class="pil-li-main"><div class="pil-li-t">'+_pilEsc(_pilTnom(t.nom))+(pole?' <span style="font-size:9px;color:var(--or)">· pôle long</span>':'')+'</div>'
      + '<div class="pil-li-s">'+(c.j!=null?(c.j+' j à cet effectif'):'à l\'arrêt')+dS+'</div></div>'
      + '<div class="pil-li-r">'+_pilSimStepper('task',i,S.alloc[i],S.alloc[i]>0,free>0)+'</div></div>';
  });
  h+='</div>';
  h+='<div style="font-size:11px;color:var(--texte-doux);line-height:1.5;margin-top:8px">L\'effectif part de l\'équipe <b>présente aujourd\'hui</b> (CP, maladie, absences et récup déduits). Monte pour un <b>renfort</b>, descends pour un <b>départ</b> · <b>répartir</b> change quelle tâche finit en premier.</div>';
  var even0=_pilSimEven(D.tasks.length,D.present);
  var touched=(pool!==D.present)||D.tasks.some(function(t,i){return S.alloc[i]!==even0[i];});
  h+='<div style="margin-top:10px;display:flex;align-items:center;gap:10px"><button data-sim="reset" style="border:1px solid var(--gris-clair);background:transparent;color:var(--texte);cursor:pointer;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700'+(touched?'':';opacity:.55')+'">↺ Revenir à l\'équipe du jour</button><span style="font-size:11px;color:var(--texte-doux)">simulation — rien n\'est enregistré</span></div>';
  return h;
}
function _pilSimRefresh(){ var el=document.getElementById('pil-sim-body'); if(el) el.innerHTML=_pilSimBody(); }
function _pilSimAction(act, ti){
  if(!_PIL_SIM||!_PIL_SIM_DATA) return;
  var pool=_PIL_SIM.pool, assigned=_PIL_SIM.alloc.reduce(function(a,b){return a+b;},0), free=pool-assigned;
  if(act==='inc'){ ti=+ti; if(free>0 && _PIL_SIM.alloc[ti]!=null) _PIL_SIM.alloc[ti]++; }
  else if(act==='dec'){ ti=+ti; if(_PIL_SIM.alloc[ti]>0) _PIL_SIM.alloc[ti]--; }
  else if(act==='pool-inc'){ if(_PIL_SIM.pool<_PIL_SIM_DATA.nV+6) _PIL_SIM.pool++; }
  else if(act==='pool-dec'){ if(_PIL_SIM.pool>0){ _PIL_SIM.pool--; _pilSimClamp(); } }
  else if(act==='reset'){ _pilSimReset(); }
  _pilSimRefresh();
}
function _pilPanelSimulateur(d){
  _pilSimInitData(d);
  var statHtml=_pilStat(_PIL_SIM_DATA?_PIL_SIM_DATA.present:0,' présents');
  return _pilTile('simulateur','🎛️','#C9A84C','Simulateur — et si ?', statHtml, 'déplace l\'équipe entre les tâches · recalcul en direct', null, '<div id="pil-sim-body">'+_pilSimBody()+'</div>');
}

// ════════════════════════════════════════════════════════════════════
// SIMULATEUR « Ordre de passage » — une tâche, l'effectif présent, dans
// l'ordre choisi ; jusqu'à quelle parcelle l'équipe s'arrête par journée.
// La simulation est locale ; l'ORDRE, lui, est ENREGISTRÉ et DIFFUSÉ à l'équipe :
// il pilote le tri des parcelles et les numéros de la carte dans Vigne (app.js).
// Il est rangé PAR TÂCHE — deux équipes sur deux travaux ont chacune sa tournée.
// Reste par parcelle aligné sur recalcTravaux (passages/niveaux/trous/simple).
// ════════════════════════════════════════════════════════════════════
var _PIL_OP=null, _PIL_OP_DATA=null;

function _opCanEdit(){ return !!(typeof window.isAdmin==='function' && window.isAdmin()); }
function _opTaskDef(nom){ var arr=(typeof window.getTachesSaison==='function')?window.getTachesSaison():(window.TACHES||[]); return arr.find(function(t){ return t && t.nom===nom; }) || null; }
function _opDefs(){ return (_PIL_OP&&_PIL_OP.tasks||[]).map(_opTaskDef).filter(Boolean); }
function _opParcActive(){ return (window.PARCELLES||[]).filter(function(p){ return p && p.statut!=='Arrachee'; }); }
function _opApplic(p,def){ return !(p.tachesExclues && p.tachesExclues.indexOf(def.nom)>=0); }
function _opTm(p){ return (typeof window._tachesFor==='function') ? window._tachesFor(p) : (p&&p.taches?p.taches:{}); }
function _opPassHha(def,i){ return (def.passagesHha && def.passagesHha[i-1]!=null) ? def.passagesHha[i-1] : ((def.hha)||0); }
function _opMinTrou(def){ return (typeof window._plantMinTrou==='function') ? window._plantMinTrou() : ((def&&def.minTrou)||3); }
function _opParcByNom(nom){ return (window.PARCELLES||[]).find(function(p){ return p && p.nom===nom; }) || null; }
function _opEmo(nom){ return (window.TEMOJI&&window.TEMOJI[nom])?window.TEMOJI[nom]:String.fromCodePoint(0x1F33F); }
function _opTNom(nom){ return (typeof window.tNom==='function')?window.tNom(nom):nom; }

// ── Géo ──
// ── GÉO RÉSOLUE ──────────────────────────────────────────────────────
// Une parcelle sans p.lat/p.lng prend le CENTROÏDE de son contour KML (par
// nom). C'est ce qui rend la tournée vivante chez un domaine dont les
// parcelles ne portent pas de GPS propre (MG : KML intégré, jamais recopié
// dans les parcelles). Sans p.lat/lng ET sans contour → « sans GPS », comme
// avant. Cache invalidé par référence de source (un import KML en cours de
// session est donc pris en compte).
// Le résolveur (cache + centroïde) vit désormais dans utils.js : le registre phyto
// réglementaire a besoin des MÊMES coordonnées, et deux copies du calcul = deux
// réponses possibles à la même question. utils.js est importé avant pilotage.js,
// window._mvParcGeo est donc toujours en place quand cet écran se rend.
function _opGeo(o){ return (typeof window._mvParcGeo==='function') ? window._mvParcGeo(o) : null; }
// ── FIN GÉO RÉSOLUE ──────────────────────────────────────────────────
function _opGeoOK(p){ return !!_opGeo(p); }
function _opHav(a,b){ var A=_opGeo(a),B=_opGeo(b); if(!A||!B) return 0; var R=6371000,rad=Math.PI/180; var dLa=(B.lat-A.lat)*rad,dLo=(B.lng-A.lng)*rad,la1=A.lat*rad,la2=B.lat*rad; var x=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(la1)*Math.cos(la2)*Math.sin(dLo/2)*Math.sin(dLo/2); return 2*R*Math.asin(Math.sqrt(x)); }
function _opCentroid(list){ var la=0,lo=0,n=0; list.forEach(function(p){ var g=_opGeo(p); if(g){ la+=g.lat; lo+=g.lng; n++; } }); return n?{lat:la/n,lng:lo/n}:null; }
function _opFmtM(m){ return m>=950?((Math.round(m/100)/10).toLocaleString('fr-FR')+' km'):(Math.round(m/10)*10+' m'); }

// ── Communes / secteurs (p.commune = {nom,lat,lng}, facultatif) ──
function _opNumG(v){ var n=parseFloat(v); return isFinite(n)?n:null; }
function _opCom(p){ return (p && p.commune && p.commune.nom) ? String(p.commune.nom) : ''; }
function _opComList(){ var seen={}, out=[]; _opParcActive().forEach(function(p){ var c=_opCom(p); if(c && !seen[c]){ seen[c]=1; out.push(c); } }); return out; }
function _opHasCom(){ return _opComList().length>=2; }
function _opComPt(c){
  var l=_opParcActive().filter(function(p){ return _opCom(p)===c; });
  var g=_opCentroid(l); if(g) return g;
  var pt=null; l.forEach(function(p){ if(pt||!p.commune) return; var la=_opNumG(p.commune.lat), ln=_opNumG(p.commune.lng); if(la!==null&&ln!==null) pt={lat:la,lng:ln}; });
  return pt;
}

// ── Reste / plein par tâche (mono) — aligné recalcTravaux (Validé/Auto=fait) ──
function _opParcFull(p,def){
  var surf=parseFloat(p.surface)||0, SP=window.SAISON_PASSAGES||{}, nom=def.nom, s=_opTm(p)[nom];
  // Entreplantation : PILOTEE PAR LES TROUS (tariere). Aucun trou renseigne = 0 h,
  // meme regle que calcHeures (app.js) : « rien a entreplanter ». L'ancien repli
  // surf x 15 h/ha facturait une entreplantation fantome sur TOUTES les parcelles
  // (~ +15 h/ha sur le cout de la saison) alors que l'avancement, lui, comptait 0.
  if(def.trous){ var tr=parseInt(p.plantation_trous)||0; return tr>0 ? tr*_opMinTrou(def)/60 : 0; }
  if(def.type==='niveaux'){ var rg=SP[nom]||((def.niveaux&&def.niveaux.length)||3); var pOv=(s&&typeof s==='object'&&s.ov!=null)?Math.min(s.ov,rg):rg; return surf*((def.niveaux||[]).filter(function(n){return n.num<=pOv;}).reduce(function(a,n){return a+n.hha;},0)); }
  if(def.type==='passages'){ var pg=SP[nom]||((def.passagesHha&&def.passagesHha.length)||2); var planNb=(s&&typeof s==='object'&&s.ov!=null)?Math.min(s.ov,pg):pg; var h=0; for(var i=1;i<=planNb;i++) h+=_opPassHha(def,i); return surf*h; }
  return surf*((def.hha)||0);
}
function _opParcReste(p,def){
  var surf=parseFloat(p.surface)||0, SP=window.SAISON_PASSAGES||{}, nom=def.nom, s=_opTm(p)[nom];
  if(def.trous){ if(typeof s==='string' && s==='Validé') return 0; var tr=parseInt(p.plantation_trous)||0; return tr>0 ? tr*_opMinTrou(def)/60 : 0; }
  if(def.type==='niveaux'){ var rg=SP[nom]||((def.niveaux&&def.niveaux.length)||3); var allN=def.niveaux||[{num:1,hha:50},{num:2,hha:20},{num:3,hha:20}]; var pOv=(s&&typeof s==='object'&&s.ov!=null)?Math.min(s.ov,rg):rg; var nivsP=allN.filter(function(n){return n.num<=pOv;}), totP=nivsP.reduce(function(a,n){return a+n.hha;},0); if(typeof s==='string') return (s==='Validé')?0:surf*totP; var _rN=window._mvNivH(nivsP,s); return surf*Math.max(0,_rN.total-_rN.done); }
  if(def.type==='passages'){ var pg=SP[nom]||((def.passagesHha&&def.passagesHha.length)||2); var planNb=(s&&typeof s==='object'&&s.ov!=null)?Math.min(s.ov,pg):pg; var htot=0; for(var i=1;i<=planNb;i++) htot+=_opPassHha(def,i); if(typeof s==='string') return (s==='Validé')?0:surf*htot; var doneH=0; for(var j=1;j<=planNb;j++){ if(s&&s['p'+j]==='Validé') doneH+=_opPassHha(def,j); } return surf*(htot-doneH); }
  return (typeof s==='string' && s==='Validé') ? 0 : surf*((def.hha)||0);
}

// ── Multi-tâches : somme sur les tâches sélectionnées (uniquement celles applicables à la parcelle) ──
function _opParcResteM(p){ var defs=_opDefs(), s=0; defs.forEach(function(d){ if(_opApplic(p,d)) s+=_opParcReste(p,d); }); return s; }
function _opParcFullM(p){ var defs=_opDefs(), s=0; defs.forEach(function(d){ if(_opApplic(p,d)) s+=_opParcFull(p,d); }); return s; }
function _opParcPctM(p){ var full=_opParcFullM(p), r=_opParcResteM(p); return full>0?Math.max(0,Math.min(100,Math.round((full-r)/full*100))):100; }
function _opParcTaskEmos(p){ return _opDefs().filter(function(d){ return _opApplic(p,d) && _opParcReste(p,d)>0.05; }).map(function(d){ return _opEmo(d.nom); }).join(''); }
function _opActTodo(){ return _opParcActive().filter(function(p){ return _opParcResteM(p)>0.05; }); }
function _opDoneGeo(){ return _opParcActive().filter(function(p){ return _opParcResteM(p)<=0.05 && _opGeoOK(p); }); }

// ── Départ : dernière parcelle FAITE (l'une des tâches sélectionnées) > centre du vignoble ──
function _opJournalLast(){ var J=window.JOURNAL||[], tset={}; (_PIL_OP&&_PIL_OP.tasks||[]).forEach(function(t){tset[t]=1;}); var best=null,bestD=''; J.forEach(function(j){ if(j&&tset[j.tache]&&j.statut==='Validé'&&j.parcelle){ var p=_opParcByNom(j.parcelle); if(p&&_opGeoOK(p)){ var d=String(j.date||''); if(d>=bestD){bestD=d;best=p;} } }}); return best?{p:best,date:bestD}:null; }
function _opStartResolve(geoTodo){
  if(_PIL_OP && _PIL_OP._startNom){ var sp=_opParcByNom(_PIL_OP._startNom); if(sp && _opGeoOK(sp)) return {p:sp,auto:false}; }
  var jl=_opJournalLast(); if(jl) return {p:jl.p,auto:true,src:'journal',date:jl.date};
  var c=_opCentroid(geoTodo); if(c && geoTodo.length){ var best=null,bd=Infinity; geoTodo.forEach(function(p){ var d=_opHav(c,p); if(d<bd){bd=d;best=p;} }); return {p:best,auto:true,src:'centre'}; }
  return null;
}
function _opNN(list,startPt){ var rem=list.slice(), seq=[], cur=startPt; while(rem.length){ var bi=0,bd=Infinity; rem.forEach(function(p,i){ var d=_opHav(cur,p); if(d<bd){bd=d;bi=i;} }); var nx=rem.splice(bi,1)[0]; seq.push(nx); cur=nx; } return seq; }
function _opNNNames(actTodo){ var geo=actTodo.filter(_opGeoOK), noGeo=actTodo.filter(function(p){ return !_opGeoOK(p); }); if(!geo.length) return actTodo.map(function(p){return p.nom;}); var sp=_opStartResolve(geo), startPt=sp?sp.p:geo[0]; return _opNN(geo,startPt).map(function(p){return p.nom;}).concat(noGeo.map(function(p){return p.nom;})); }
function _opRouteLen(seq,startPt){ if(!startPt) return 0; var tot=0,cur=startPt; seq.forEach(function(p){ if(_opGeoOK(p)){ tot+=_opHav(cur,p); cur=p; } }); return tot; }

// Tri PAR COMMUNE : au plus proche ENTRE les communes, puis au plus proche DEDANS.
// C'est la façon dont une journée s'organise réellement (« ce matin Ladoix ») et
// le seul tri qui divise le rangement manuel par le nombre de communes.
function _opComNames(actTodo){
  var groups={}, seq=[], sans=[];
  actTodo.forEach(function(p){ var c=_opCom(p); if(!c){ sans.push(p); return; } if(!groups[c]){ groups[c]=[]; seq.push(c); } groups[c].push(p); });
  var pts=[]; seq.forEach(function(c){ var pt=_opComPt(c); if(pt) pts.push({c:c,lat:pt.lat,lng:pt.lng}); });
  var ord=[];
  if(pts.length){ var sp=_opStartResolve(actTodo.filter(_opGeoOK)); ord=_opNN(pts,(sp&&sp.p)?sp.p:pts[0]).map(function(x){ return x.c; }); }
  seq.forEach(function(c){ if(ord.indexOf(c)<0) ord.push(c); });
  var out=[];
  ord.forEach(function(c){
    var g=groups[c]||[], geo=g.filter(_opGeoOK), no=g.filter(function(p){ return !_opGeoOK(p); });
    if(geo.length){ var prev=out.length?_opParcByNom(out[out.length-1]):null;
      out=out.concat(_opNN(geo,(prev&&_opGeoOK(prev))?prev:geo[0]).map(function(p){ return p.nom; })); }
    out=out.concat(no.map(function(p){ return p.nom; }));
  });
  return out.concat(sans.map(function(p){ return p.nom; }));
}
// Blocs de commune CONTIGUS dans l'ordre courant : seule granularité où « déplacer
// le bloc » a un sens (un bloc éclaté ne se recolle pas tout seul).
function _opRuns(rows){
  var r=[], cur=null;
  rows.forEach(function(x,i){ var c=_opCom(x.p);
    if(!cur || cur.com!==c){ cur={com:c,i0:i,names:[x.nom]}; r.push(cur); } else cur.names.push(x.nom); });
  return r;
}

// ── Ordre GLOBAL de parcelles (CONFIG.ordre_passage = tableau) ──
// Une equipe tourne d'un travail a l'autre : « la » tournee du domaine ne veut
// rien dire. C'est la tournee DU TRAVAIL diffuse qui doit piloter l'ecran de
// l'ouvrier. D'ou le rangement par tache :
//   CONFIG.ordre_passage_t = { '<tache>': { ordre:[noms], date:'AAAA-MM-JJ', par:'nom' } }
// L'ancien CONFIG.ordre_passage (tableau global) n'est PLUS ECRIT ; il sert
// encore de GRAINE ici, pour ne pas perdre un rangement deja fait a la main.
function _opOrdMap(){ return (typeof window._mvOrdreMap==='function') ? window._mvOrdreMap() : {}; }
function _opSavedTask(t){ var e=_opOrdMap()[t]; return (e&&Array.isArray(e.ordre)&&e.ordre.length)?e.ordre.slice():null; }
function _opSavedLegacy(){ var a=(window.CONFIG||{}).ordre_passage; return (Array.isArray(a)&&a.length)?a.slice():null; }
function _opSavedSeed(){ var ts=(_PIL_OP&&_PIL_OP.tasks)||[]; for(var i=0;i<ts.length;i++){ var s=_opSavedTask(ts[i]); if(s) return s; } return _opSavedLegacy(); }
function _opDateFr(iso){ var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||'')); return m?(m[3]+'/'+m[2]):''; }
function _opEnsureOrder(actTodo){ if(_PIL_OP.order) return; var saved=_opSavedSeed(); _PIL_OP.order=(saved&&saved.length)?saved.slice():_opNNNames(actTodo); }
function _opParcelles(){
  var act=_opActTodo(), byName={}; act.forEach(function(p){ byName[p.nom]=p; });
  _opEnsureOrder(act);
  var ord=_PIL_OP.order||[], out=[];
  ord.forEach(function(nm){ if(byName[nm]){ out.push(byName[nm]); delete byName[nm]; } });
  act.forEach(function(p){ if(byName[p.nom]) out.push(p); });
  _PIL_OP.order=out.map(function(p){return p.nom;});
  return out.map(function(p){ return { p:p, nom:p.nom, s:parseFloat(p.surface)||0, reste:Math.round(_opParcResteM(p)*10)/10, pct:_opParcPctM(p), geo:_opGeoOK(p), emos:_opParcTaskEmos(p) }; });
}
// « Enregistre » ne vaut que si CHAQUE tache cochee porte exactement cet ordre :
// cocher deux travaux dont l'un seulement est a jour doit se voir.
function _opDirty(){
  var cur=(_PIL_OP&&_PIL_OP.order)||[], ts=(_PIL_OP&&_PIL_OP.tasks)||[];
  var todo={}; _opActTodo().forEach(function(p){ todo[p.nom]=1; });
  var cf=cur.filter(function(n){return todo[n];});
  if(!cf.length) return 'empty';
  if(!ts.length) return 'unsaved';
  var tous=true, aucun=true;
  ts.forEach(function(t){
    var s=_opSavedTask(t);
    if(!s){ tous=false; return; }
    aucun=false;
    if(s.filter(function(n){return todo[n];}).join('|')!==cf.join('|')) tous=false;
  });
  if(tous) return 'saved';
  return aucun?'unsaved':'modified';
}
function _opSaveOrder(){
  if(!_opCanEdit()) return;
  if(!window.PARCELLES || !window.PARCELLES.length){ if(window.showToast) window.showToast('Donn\u00e9es non charg\u00e9es','#B85A1A'); return; }
  var ts=(_PIL_OP&&_PIL_OP.tasks)||[];
  if(!ts.length){ if(window.showToast) window.showToast('Choisissez au moins un travail','#B85A1A'); return; }
  var ordre=_opParcelles().map(function(x){return x.nom;});
  var d=new Date(), iso=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
  var par=(window.currentUser&&window.currentUser.nom)||'';
  // Object.assign : on repart de la carte existante au lieu de la reconstruire,
  // sinon enregistrer une tache effacerait les tournees des autres.
  var m=Object.assign({}, _opOrdMap());
  ts.forEach(function(t){ m[t]={ordre:ordre.slice(), date:iso, par:par}; });
  window.CONFIG=window.CONFIG||{};
  window.CONFIG.ordre_passage_t=m;
  if(typeof window.saveData==='function') window.saveData('config');
  // Message HONNETE : config est lu au demarrage (FB_STATIC, pas de temps reel),
  // la tournee arrive donc a la prochaine ouverture de l'app, pas dans la seconde.
  if(window.showToast) window.showToast('Tourn\u00e9e enregistr\u00e9e \u00b7 '+ts.map(_opTNom).join(', ')+' \u2014 visible par l\u2019\u00e9quipe \u00e0 sa prochaine ouverture','#3D6B27');
  _pilOpRefresh();
}
// Publier sans pouvoir depublier : une tournee d'aout piloterait encore l'ecran
// en octobre. Retire la tournee des SEULES taches cochees.
function _opClearOrder(){
  if(!_opCanEdit()) return;
  var ts=(_PIL_OP&&_PIL_OP.tasks)||[];
  var m=Object.assign({}, _opOrdMap()), n=0;
  ts.forEach(function(t){ if(m[t]){ delete m[t]; n++; } });
  if(!n){ if(window.showToast) window.showToast('Aucune tourn\u00e9e diffus\u00e9e sur ce travail','#B85A1A'); return; }
  window.CONFIG=window.CONFIG||{};
  window.CONFIG.ordre_passage_t=m;
  if(typeof window.saveData==='function') window.saveData('config');
  if(window.showToast) window.showToast('Tourn\u00e9e retir\u00e9e \u00b7 '+ts.map(_opTNom).join(', ')+' \u2014 l\u2019\u00e9quipe revient au tri habituel','#B85A1A');
  _pilOpRefresh();
}
// Bouton « Retirer » : visible seulement si l'une des taches cochees porte
// bien une tournee, pour ne pas proposer d'effacer ce qui n'existe pas.
function _opClearBtn(){
  var ts=(_PIL_OP&&_PIL_OP.tasks)||[], n=0;
  ts.forEach(function(t){ if(_opSavedTask(t)) n++; });
  if(!n) return '';
  return '<button data-op="clear" style="border:1px solid var(--gris-clair);background:transparent;color:var(--texte-doux);border-radius:9px;padding:8px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;margin-left:auto">Retirer</button>';
}
// Ce qui est REELLEMENT diffuse, tout en bas de l'ecran de rangement.
function _opDiffusHtml(){
  var m=_opOrdMap();
  var ks=Object.keys(m).filter(function(k){ var e=m[k]; return e&&Array.isArray(e.ordre)&&e.ordre.length; });
  var box='font-size:11.5px;color:var(--texte-doux);border:1px solid var(--gris-clair);border-radius:9px;padding:7px 11px;margin-bottom:8px;';
  if(!ks.length) return '<div style="'+box+'background:rgba(127,127,127,.05)">Aucune tourn\u00e9e diffus\u00e9e pour l\u2019instant \u2014 l\u2019\u00e9quipe voit ses parcelles dans l\u2019ordre habituel.</div>';
  return '<div style="'+box+'background:rgba(201,168,76,.07)">\uD83E\uDDED Diffus\u00e9 \u00e0 l\u2019\u00e9quipe pour : <b style="color:var(--texte)">'
    +ks.map(function(k){ var e=m[k], dd=_opDateFr(e.date); return _pilEsc(_opTNom(k))+(dd?(' \u00b7 '+dd):''); }).join(' &nbsp;|&nbsp; ')
    +'</b><div style="margin-top:3px">Chacun voit la tourn\u00e9e du travail qu\u2019il a \u00e0 l\u2019\u00e9cran, \u00e0 sa prochaine ouverture de l\u2019application.</div></div>';
}

// ── Sim (frise journalière, ordre-indépendant sur le nb de jours) ──
function _opSimulate(list,N,journeeH,pauseMin,trajetMin){
  // La JOURNEE reglee est du travail EFFECTIF : la pause s'ajoute a l'amplitude
  // de presence, elle ne se soustrait plus a l'ouvrage. Avant, 7 h moins 120 min
  // de pause donnait 5 h x 5 personnes = 25 h-homme/jour au lieu de 35, soit 39
  // jours annonces la ou il en faut 28. pauseMin ne sert plus qu'a l'amplitude.
  var budget=Math.max(0.1,journeeH), trajetH=Math.max(0,trajetMin/60); N=Math.max(1,N||1);
  var days=[{day:1,items:[],surf:0}], day=1, used=0, per=list.map(function(row){ return {row:row,work:row.reste/N,startDay:0,endDay:0}; }), lastIdxByDay={};
  // ⚠⚠ SURFACE DECOUPEE COMME LES HEURES.
  //   La surface entiere d'une parcelle etait portee au jour ou elle SE TERMINE :
  //   une grande parcelle etalee sur quatre jours faisait afficher « 0,00 ha J1 »
  //   apres une journee pleine de travail. Chaque tranche d'heures apporte
  //   desormais sa part de surface au jour ou elle est faite.
  function advance(len,idx){ var rem=len, sHa=(idx!=null && len>1e-9)?(per[idx].row.s/len):0;
    if(rem<=1e-9 && idx!=null){ if(!per[idx].startDay)per[idx].startDay=day; per[idx].endDay=day; lastIdxByDay[day]=idx; days[day-1].surf+=per[idx].row.s; return; }
    while(rem>1e-9){ var free=budget-used; if(free<=1e-9){ day++; used=0; free=budget; days.push({day:day,items:[],surf:0}); } var chunk=Math.min(rem,free); used+=chunk; rem-=chunk; if(idx!=null){ if(!per[idx].startDay)per[idx].startDay=day; per[idx].endDay=day; lastIdxByDay[day]=idx; days[day-1].surf+=chunk*sHa; } } }
  list.forEach(function(row,li){ if(li>0) advance(trajetH,null); advance(per[li].work,li); });
  days.forEach(function(d){ d.lastIdx=lastIdxByDay[d.day]; });
  return {budget:budget,days:days,per:per};
}
// Confrontation a la FENETRE agronomique : c'est le seul chiffre qui dit s'il
// faut renforcer. L'ecran annoncait « 39 j pour finir » sans jamais preciser que
// la fenetre saisie n'en offre que 12.
function _opFenetreHtml(rows,OP){
  var sa=(typeof window._pilSaison==='function')?window._pilSaison():null;
  if(!sa || typeof window._mvFenetre!=='function' || typeof window._mvProj!=='function') return '';
  var fen=window._mvFenetre(sa,(OP.tasks||[]));
  if(!fen) return '';
  // ⚠⚠ UNE FENETRE PAR TACHE, JAMAIS L'ENVELOPPE.
  //   Taille (janvier -> mars) et effeuillage (juillet) coches ensemble
  //   donnaient une enveloppe de 141 jours quand les deux fenetres reelles n'en
  //   totalisent que 64 : le test « ca tient » devenait vrai par construction.
  //   Chaque tache est desormais confrontee A SA fenetre, avec SA charge et SES
  //   parcelles — et aux jours qui RESTENT, pas a la fenetre entiere.
  var defs=_opDefs(), parF={};
  (fen.parTache||[]).forEach(function(t){ parF[t.nom]=t; });
  var L=[], nKo=0;
  defs.forEach(function(def){
    var f=parF[def.nom]; if(!f) return;
    var h=0, nP=0;
    rows.forEach(function(r){
      if(!_opApplic(r.p,def)) return;
      var v=_opParcReste(r.p,def);
      if(v>0.01){ h+=v; nP++; }
    });
    if(!(h>0.01)) return;
    var pr=window._mvProj({resteH:h,eff:OP.eff,journee:OP.jour,pauseMin:OP.pause,sauts:Math.max(0,nP-1),trajetMin:OP.trajet,fen:f});
    var ko=(f.joursRestants<=0)||(pr.tient===false);
    if(ko) nKo++;
    L.push({def:def,f:f,pr:pr,h:h,nP:nP,ko:ko});
  });
  if(!L.length) return '';
  var col=nKo?'var(--rouge)':'var(--vert-med)', bg=nKo?'rgba(155,45,31,.09)':'rgba(111,191,90,.10)';
  var multi=(L.length>1);
  var h1='';
  if(multi){
    h1='<b>'+(nKo?('\u26A0 '+nKo+' t\u00e2che'+(nKo>1?'s':'')+' sur '+L.length+(nKo>1?' ne tiennent pas dans leur fen\u00eatre.':' ne tient pas dans sa fen\u00eatre.'))
                : ('\u2713 Chaque t\u00e2che tient dans sa fen\u00eatre.'))+'</b>';
  }
  var corps=L.map(function(x){
    var f=x.f, pr=x.pr, verdict, besoin='';
    if(f.joursRestants<=0){
      verdict='<b>fen\u00eatre termin\u00e9e</b> \u2014 il reste '+pr.jours+' j de travail \u00e0 caser ailleurs';
    } else if(x.ko){
      verdict='d\u00e9borde de <b>'+pr.depassement+' j</b> \u2014 '+pr.jours+' j n\u00e9cessaires pour <b>'+f.joursRestants+' j</b> restants';
      besoin=pr.impossible
        ? '<br><span style="color:var(--texte-doux)">aucun effectif ne tient : les d\u00e9placements consomment d\u00e9j\u00e0 la fen\u00eatre</span>'
        : '<br><span style="color:var(--texte-doux)">il faudrait <b>'+(Math.ceil(pr.effPourFenetre*10)/10).toLocaleString('fr-FR')+' personnes</b> (trajets compris) au lieu de '+OP.eff+'</span>';
    } else {
      verdict='tient \u2014 '+pr.jours+' j n\u00e9cessaires pour <b>'+f.joursRestants+' j</b> restants';
    }
    return '<div style="margin-top:'+(multi?'6':'0')+'px">'
      + (multi?('<b>'+(x.ko?'\u26A0':'\u2713')+' '+_pilEsc(_opTNom(x.def.nom))+'</b> \u00b7 '):(x.ko?'\u26A0 ':'\u2713 '))
      + verdict + besoin
      + '<br><span style="color:var(--texte-doux)">'+_pilFmtD(f.debut)+' \u2192 '+_pilFmtD(f.fin)
      + (f.joursRestants<=0 ? ' \u00b7 fen\u00eatre pass\u00e9e'
          : (f.joursRestants<f.jours ? (' \u00b7 '+f.joursRestants+' j sur '+f.jours+' '+(f.chantier?'(7j/7)':'ouvr\u00e9s')+', fen\u00eatre entam\u00e9e')
                                     : (' \u00b7 '+f.jours+' j '+(f.chantier?'(chantier, 7j/7)':'ouvr\u00e9s'))))
      + ' \u00b7 '+_opFmtH(x.h)+' sur '+x.nP+' parc.</span></div>';
  }).join('');
  var pied='<div style="color:var(--texte-doux);margin-top:6px">Journ\u00e9e '+_ecoH1(OP.jour)+' h de travail \u00e0 '+OP.eff+''
    + (OP.pause>0?(' \u00b7 amplitude '+_ecoH1(OP.jour+OP.pause/60)+' h'):'')+'</div>';
  return '<div style="margin-top:8px;font-size:11.5px;color:'+col+';background:'+bg+';border-radius:8px;padding:7px 10px;line-height:1.45">'
    + h1 + corps + pied + '</div>';
}

function _opFmtH(h){ return (Math.round(h*10)/10).toLocaleString('fr-FR')+' h'; }
function _opFmtHa(s){ return s.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}).replace(/\u202f/g,' ')+' ha'; }

// ── Mini-carte SVG du trajet ──
function _opMapSvg(seqRows,w){
  var todoGeo=seqRows.filter(function(r){return r.geo;}).map(function(r){return r.p;});
  var doneGeo=_opDoneGeo(), sp=_opStartResolve(todoGeo), startPt=sp?sp.p:null;
  var pool=[]; if(startPt) pool.push(startPt); todoGeo.forEach(function(p){pool.push(p);}); doneGeo.forEach(function(p){pool.push(p);});
  if(pool.length<2) return window._mvGraphVide('Pas assez de parcelles rep\u00e9r\u00e9es pour tracer une tourn\u00e9e',
    'Il en faut au moins deux dont le contour est connu.');
  var lats=pool.map(function(p){return (_opGeo(p)||p).lat;}), lngs=pool.map(function(p){return (_opGeo(p)||p).lng;});
  var minLa=Math.min.apply(0,lats),maxLa=Math.max.apply(0,lats),minLo=Math.min.apply(0,lngs),maxLo=Math.max.apply(0,lngs);
  // Fond sombre assume : ce repli imite la carte. Sa palette ne suit pas la
  // charte des graphes sur papier, elle suit la carte — c'est la meme exception
  // que les trois couleurs de toast.
  var gc=window._mvGraphCadre((w>0?w:440),190,{padL:24,padR:24,padT:24,padB:24});
  var W=gc.w,H=gc.h,pad=gc.padL;
  function X(p){ var g=_opGeo(p)||p; return (maxLo===minLo)?W/2:pad+(g.lng-minLo)/(maxLo-minLo)*(W-2*pad); }
  function Y(p){ var g=_opGeo(p)||p; return (maxLa===minLa)?H/2:pad+(maxLa-g.lat)/(maxLa-minLa)*(H-2*pad); }
  var seqNom={}; todoGeo.forEach(function(p,i){ seqNom[p.nom]=i+1; });
  var svg='';
  if(startPt){ var path='M '+X(startPt).toFixed(1)+' '+Y(startPt).toFixed(1); todoGeo.forEach(function(p){ path+=' L '+X(p).toFixed(1)+' '+Y(p).toFixed(1); }); svg+='<path d="'+path+'" fill="none" stroke="#C9A84C" stroke-width="2" stroke-opacity=".5" stroke-linejoin="round"/>'; }
  doneGeo.forEach(function(p){ if(startPt&&p.nom===startPt.nom) return; svg+='<circle cx="'+X(p).toFixed(1)+'" cy="'+Y(p).toFixed(1)+'" r="4.5" fill="#3a352c" stroke="#5a5248" stroke-width="1"/>'; });
  todoGeo.forEach(function(p){ var x=X(p).toFixed(1),y=Y(p).toFixed(1); svg+='<circle cx="'+x+'" cy="'+y+'" r="9" fill="#14110D" stroke="#C9A84C" stroke-width="1.6"/><text x="'+x+'" y="'+(parseFloat(y)+3.5)+'" text-anchor="middle" font-size="'+gc.txt.mini+'" font-weight="800" fill="#C9A84C" font-family="Outfit,sans-serif">'+seqNom[p.nom]+'</text>'; });
  if(startPt){ var sx=X(startPt).toFixed(1),sy=Y(startPt).toFixed(1); svg+='<circle cx="'+sx+'" cy="'+sy+'" r="6.5" fill="#6FBF5A"/><path d="M'+(parseFloat(sx)+0.5)+' '+(parseFloat(sy)-6.5)+' v-8 h6 l-2 2.5 2 2.5 h-6" fill="#6FBF5A" stroke="#0d1f0b" stroke-width=".5"/>'; }
  var dist=_opRouteLen(todoGeo,startPt);
  return '<div style="position:relative;background:radial-gradient(130% 100% at 30% 0%,#1f2a1c,#161d14);border:1px solid var(--gris-clair);border-radius:12px;overflow:hidden;margin-bottom:11px">'
    +window._mvGraphSvg(gc,'Tourn\u00e9e hors ligne : '+todoGeo.length+' parcelles \u00e0 faire, trajet d\u2019environ '+_opFmtM(dist)+'.',svg)
    +'<div style="position:absolute;right:9px;top:8px;font-size:11px;font-weight:700;color:#C9A84C;background:rgba(20,17,13,.6);padding:3px 8px;border-radius:8px">trajet ~ '+_opFmtM(dist)+'</div>'
    +'<div style="position:absolute;left:9px;bottom:7px;font-size:10px;color:#A79E8C;background:rgba(20,17,13,.55);padding:2px 7px;border-radius:8px">\uD83D\uDFE2 d\u00e9part \u00b7 \uD83D\uDFE1 \u00e0 faire \u00b7 \u26AB fait</div></div>';
}

// ── UI helpers ──
var _OP_FLD='background:rgba(127,127,127,.08);color:var(--texte);border:1px solid var(--gris-clair);border-radius:10px;padding:10px 11px;font-size:13px;font-weight:700;font-family:inherit';
function _opStp(k,d,sym,on){ return '<button data-op="stp" data-k="'+k+'" data-d="'+d+'" style="width:26px;height:26px;border:1px solid var(--gris-clair);border-radius:7px;background:'+(on?'rgba(127,127,127,.10)':'transparent')+';color:'+(on?'var(--texte)':'var(--texte-doux)')+';font-size:16px;font-weight:700;cursor:'+(on?'pointer':'default')+';line-height:1'+(on?'':';opacity:.4')+'">'+sym+'</button>'; }
// ── CARTE ORDRE (Leaflet) — la tournée sur une vraie carte ──────────
// Remplace le schéma SVG quand Leaflet est chargé (le SVG reste le repli hors
// ligne). Les numéros sont ceux de la LISTE (index global, parcelles sans GPS
// comprises) : une parcelle sans GPS fait sauter un numéro plutôt que de créer
// deux numérotations concurrentes. Trait plein = journée 1, pointillé = la
// suite. Anneau doré = la parcelle où la J1 s'arrête. Le zoom est conservé
// entre deux rafraîchissements tant que le jeu de parcelles ne change pas.
var _opMap=null, _OP_MAPDATA=null;
function _opMapHtml(rows,sim,startPt){
  if(typeof window.L==='undefined'){
    _OP_MAPDATA=null;
    window._mvGraphSuivre('#pil-g-opmap', function(lg){ return _opMapSvg(rows,lg); });
    return '<div id="pil-g-opmap"></div>';
  }
  var todoGeo=rows.filter(function(r){return r.geo;}), doneGeo=_opDoneGeo();
  if(((startPt?1:0)+todoGeo.length+doneGeo.length)<2){ _OP_MAPDATA=null; return ''; }
  _OP_MAPDATA={rows:rows,sim:sim,startPt:startPt,doneGeo:doneGeo};
  var dist=_opRouteLen(todoGeo.map(function(r){return r.p;}),startPt);
  return '<div style="position:relative;border:1px solid var(--gris-clair);border-radius:12px;overflow:hidden;margin-bottom:11px">'
    +'<div id="pil-op-map" style="height:230px;background:#E8E4D8"></div>'
    +(todoGeo.length?'<div style="position:absolute;right:9px;top:8px;z-index:1000;pointer-events:none;font-size:11px;font-weight:700;color:#C9A84C;background:rgba(20,17,13,.72);padding:3px 8px;border-radius:8px">trajet ~ '+_opFmtM(dist)+'</div>':'')
    +'<div style="position:absolute;left:9px;bottom:7px;z-index:1000;pointer-events:none;font-size:10px;color:#EFE9DA;background:rgba(20,17,13,.68);padding:2px 7px;border-radius:8px">\u{1F7E2} d\u00e9part \u00b7 \u2460\u2461\u2462 \u00e0 faire \u00b7 \u26AB fait \u00b7 plein = J1 \u00b7 pointill\u00e9 = ensuite</div>'
    +'</div>';
}
function _opBuildMap(){
  var el=document.getElementById('pil-op-map');
  if(!el || typeof window.L==='undefined' || !_OP_MAPDATA) return;
  _opMap=_pilMapKill(_opMap);
  var D=_OP_MAPDATA, rows=D.rows, sim=D.sim, startPt=D.startPt;
  var SG=startPt?_opGeo(startPt):null;
  try{
    _opMap=window.L.map(el,{zoomControl:true,attributionControl:false,zoomSnap:0,zoomDelta:0.5});
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(_opMap);
    var seq=[]; rows.forEach(function(r,i){ if(!r.geo) return; var g=_opGeo(r.p); if(g) seq.push({i:i,r:r,g:g}); });
    // Contours KML des parcelles concernées : à faire = or, déjà fait = sombre.
    var src=(window.KML_POLYGONS_DYNAMIC&&window.KML_POLYGONS_DYNAMIC.length)?window.KML_POLYGONS_DYNAMIC:(window.KML_DATA||[]);
    var st={}; seq.forEach(function(o){ st[String(o.r.nom).toLowerCase()]='todo'; });
    D.doneGeo.forEach(function(p){ var k=String(p.nom||'').toLowerCase(); if(!st[k]) st[k]='done'; });
    src.forEach(function(k){
      if(!k||!k.pts||!k.pts.length||!k.name) return;
      var s=st[String(k.name).toLowerCase()]; if(!s) return;
      if(s==='todo') window.L.polygon(k.pts,{color:'#C9A84C',weight:2,fillColor:'#C9A84C',fillOpacity:.13}).addTo(_opMap);
      else window.L.polygon(k.pts,{color:'#5a5248',weight:1.2,fillColor:'#3a352c',fillOpacity:.28}).addTo(_opMap);
    });
    var bounds=[];
    if(SG) bounds.push([SG.lat,SG.lng]);
    D.doneGeo.forEach(function(p){ if(startPt&&p.nom===startPt.nom) return; var g=_opGeo(p); if(!g) return; window.L.circleMarker([g.lat,g.lng],{radius:4.5,fillColor:'#3a352c',color:'#5a5248',weight:1.2,fillOpacity:1}).addTo(_opMap).bindPopup('<b>'+_pilEsc(p.nom)+'</b><br>fait'); bounds.push([g.lat,g.lng]); });
    // Trajet : plein tant que la parcelle appartient encore à la journée 1
    // (index de LISTE, donc la coupure suit exactement le bandeau au-dessus).
    var li=(sim&&sim.days&&sim.days[0]&&typeof sim.days[0].lastIdx==='number')?sim.days[0].lastIdx:-1;
    var solid=SG?[[SG.lat,SG.lng]]:[], dash=[], sw=false;
    seq.forEach(function(o){
      var pt=[o.g.lat,o.g.lng]; bounds.push(pt);
      if(!sw && o.i<=li){ solid.push(pt); return; }
      if(!sw){ sw=true; if(solid.length) dash.push(solid[solid.length-1]); }
      dash.push(pt);
    });
    if(solid.length>1) window.L.polyline(solid,{color:'#C9A84C',weight:3.5,opacity:.85,lineJoin:'round'}).addTo(_opMap);
    if(dash.length>1) window.L.polyline(dash,{color:'#C9A84C',weight:2.5,opacity:.55,dashArray:'6 7',lineJoin:'round'}).addTo(_opMap);
    if(SG) window.L.marker([SG.lat,SG.lng],{icon:window.L.divIcon({className:'',iconSize:[20,20],iconAnchor:[10,10],html:'<div style="width:20px;height:20px;border-radius:50%;background:#6FBF5A;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)"></div>'})}).addTo(_opMap).bindPopup('<b>\u{1F6A9} D\u00e9part</b><br>'+_pilEsc(startPt.nom));
    seq.forEach(function(o){
      var ring=(o.i===li), pr=(sim&&sim.per)?sim.per[o.i]:null;
      var jour=pr?('Jour '+pr.startDay+(pr.endDay>pr.startDay?'\u2192'+pr.endDay:'')):'';
      window.L.marker([o.g.lat,o.g.lng],{icon:window.L.divIcon({className:'',iconSize:[26,26],iconAnchor:[13,13],html:'<div style="width:26px;height:26px;border-radius:50%;background:#14110D;border:2px solid #C9A84C;color:#C9A84C;display:flex;align-items:center;justify-content:center;font:800 12px/1 Outfit,system-ui,sans-serif;box-shadow:'+(ring?'0 0 0 4px rgba(201,168,76,.45),':'')+'0 1px 4px rgba(0,0,0,.4)">'+(o.i+1)+'</div>'})})
        .addTo(_opMap).bindPopup('<b>'+(o.i+1)+' \u00b7 '+_pilEsc(o.r.nom)+'</b><br>'+_opFmtH(o.r.reste)+' restantes'+(jour?' \u00b7 '+jour:'')+(ring?'<br>\u{1F536} fin de la journ\u00e9e 1':''));
    });
    var sig=seq.map(function(o){return o.r.nom;}).sort().join('|')+'\u00a7'+(startPt?startPt.nom:'');
    var mv=(_PIL_OP&&_PIL_OP._mapView)||null;
    var _mine=_opMap;
    function _fit(){ if(!_opMap || _opMap!==_mine) return;
      try{ _opMap.invalidateSize(); }catch(e){ if(DEBUG) console.warn('[pilotage] carte ordre inv', e); }
      try{ if(mv&&mv.sig===sig) _opMap.setView(mv.c,mv.z,{animate:false}); else if(bounds.length) _opMap.fitBounds(bounds,{padding:[20,20],animate:false}); }catch(e){ if(DEBUG) console.warn('[pilotage] carte ordre fit', e); }
    }
    requestAnimationFrame(function(){ requestAnimationFrame(_fit); });
    _opMap.on('moveend zoomend',function(){ if(_PIL_OP&&_opMap) _PIL_OP._mapView={sig:sig,c:_opMap.getCenter(),z:_opMap.getZoom()}; });
  }catch(e){ if(DEBUG) console.warn('[pilotage] carte ordre', e); }
}
// ── FIN CARTE ORDRE ──────────────────────────────────────────────────

function _opStepper(id,lab,dm,dp,val,unit,canDec,canInc){ return '<div style="background:rgba(127,127,127,.05);border:1px solid var(--gris-clair);border-radius:11px;padding:7px 4px;text-align:center"><div style="font-size:8.5px;font-weight:700;letter-spacing:.3px;color:var(--texte-doux);text-transform:uppercase;min-height:18px;display:flex;align-items:center;justify-content:center">'+lab+'</div><div style="display:flex;align-items:center;justify-content:center;gap:3px;margin-top:1px">'+_opStp(id,dm,'\u2212',canDec)+'<b style="min-width:24px;font-size:15px;font-weight:800;color:var(--texte);font-variant-numeric:tabular-nums">'+val+'</b>'+_opStp(id,dp,'+',canInc)+'</div><div style="font-size:8.5px;color:var(--texte-doux);margin-top:1px">'+unit+'</div></div>'; }

function _opBody(){
  var D=_PIL_OP_DATA, OP=_PIL_OP, edit=_opCanEdit();
  if(!D || !D.tasks.length){ return '<div class="pil-empty">Aucune t\u00e2che de saison \u00e0 planifier.</div>'; }
  if(!OP.tasks.length){ OP.tasks=[D.defaultTask].filter(Boolean); }
  var rows=_opParcelles();
  var sim=_opSimulate(rows, OP.eff, OP.jour, OP.pause, OP.trajet);
  var geoTodo=rows.filter(function(r){return r.geo;}).map(function(r){return r.p;});
  var sp=_opStartResolve(geoTodo), startPt=sp?sp.p:null;
  var multi=OP.tasks.length>1;

  var h='';
  // ── Tâches : multi-sélection (chips) ──
  h+='<div style="font-size:9px;font-weight:700;letter-spacing:.4px;color:var(--texte-doux);text-transform:uppercase;margin:0 0 5px 2px">T\u00e2ches \u2014 plusieurs possibles</div>';
  h+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">'+D.tasks.map(function(x){
    var on=OP.tasks.indexOf(x.nom)>=0;
    return '<button'+(edit?' data-op="task" data-nom="'+_pilEsc(x.nom)+'"':'')+' style="border:1px solid '+(on?'var(--or)':'var(--gris-clair)')+';background:'+(on?'rgba(201,168,76,.14)':'transparent')+';color:'+(on?'var(--or)':'var(--texte-doux)')+';border-radius:20px;padding:6px 12px;font-size:12.5px;font-weight:'+(on?'700':'600')+';cursor:'+(edit?'pointer':'default')+'">'+(on?'\u2713 ':'')+_opEmo(x.nom)+' '+_pilEsc(_opTNom(x.nom))+'</button>';
  }).join('')+'</div>';

  // ── Départ (admin) — cale le tri au plus proche ──
  if(edit){
    var startOpts='<option value="">'+(sp&&sp.auto?('Auto \u2014 '+(sp.src==='journal'?'derni\u00e8re faite : '+_pilEsc(startPt.nom):'centre du vignoble')):'Auto')+'</option>';
    _opParcActive().filter(_opGeoOK).forEach(function(p){ startOpts+='<option value="'+_pilEsc(p.nom)+'"'+((OP._startNom===p.nom)?' selected':'')+'>d\u00e9part : '+_pilEsc(p.nom)+'</option>'; });
    h+='<div style="margin-bottom:11px"><div style="font-size:9px;font-weight:700;letter-spacing:.4px;color:var(--texte-doux);text-transform:uppercase;margin:0 0 4px 2px">D\u00e9part de la tourn\u00e9e</div><select id="pil-op-start" style="width:100%;'+_OP_FLD+'">'+startOpts+'</select></div>';
  }

  // ── Réglages sim ──
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:11px">'
    +_opStepper('eff','Effectif',-1,1,OP.eff,(OP.effAuto?'pr\u00e9sents (auto)':'r\u00e9gl\u00e9'),OP.eff>1,true)
    +_opStepper('jour','Journ\u00e9e',-0.5,0.5,OP.jour,'h/jour',OP.jour>1,OP.jour<12)
    +_opStepper('pause','Pause',-15,15,OP.pause,'min',OP.pause>0,OP.pause<180)
    +_opStepper('trajet','Trajet',-5,5,OP.trajet,'min/saut',OP.trajet>0,OP.trajet<60)+'</div>';

  h+=_opMapHtml(rows,sim,startPt);

  // ── Bandeau ──
  h+='<div style="background:rgba(201,168,76,.06);border:1px solid var(--gris-clair);border-left:3px solid var(--or);border-radius:11px;padding:13px 14px;margin:0 0 12px">';
  if(!rows.length){ h+='<div style="font-size:11px;font-weight:700;letter-spacing:.5px;color:var(--texte-doux);text-transform:uppercase">R\u00e9sultat</div><div style="font-size:17px;font-weight:800;color:var(--vert-med);margin-top:3px">\u2705 Rien \u00e0 faire pour '+(multi?'ces t\u00e2ches':'cette t\u00e2che')+'.</div>'; }
  else{ var d1=sim.days[0], stop=rows[d1.lastIdx], stopPer=sim.per[d1.lastIdx], partiel=stopPer.endDay>1, totR=rows.reduce(function(a,b){return a+b.reste;},0);
    h+='<div style="font-size:11px;font-weight:700;letter-spacing:.5px;color:var(--texte-doux);text-transform:uppercase">En fin de journ\u00e9e 1, l\'\u00e9quipe s\'arr\u00eate \u00e0</div>'
      +'<div style="font-size:21px;font-weight:800;color:var(--texte);margin:2px 0 6px">\uD83D\uDCCD '+_pilEsc(stop.nom)+'</div>'
      +'<div style="display:flex;flex-wrap:wrap;gap:5px 15px;font-size:12.5px;color:var(--texte-doux)">'
      +'<span><b style="color:var(--texte);font-size:14px">'+(Math.round(d1.surf*100)/100).toLocaleString('fr-FR')+'</b> ha J1</span>'
      +'<span><b style=\"color:var(--texte);font-size:14px\">'+sim.days.length+'</b> j pour finir</span>'
      +'<span><b style="color:var(--texte);font-size:14px">'+_opFmtH(totR)+'</b> restantes ('+rows.length+' parc.'+(multi?' \u00d7 '+OP.tasks.length+' t\u00e2ches':'')+')</span></div>'
      +(partiel?'<div style=\"margin-top:8px;font-size:11.5px;color:var(--orange);background:rgba(224,165,86,.1);border-radius:8px;padding:6px 10px\">\u23F8 La J1 se termine <b>en cours</b> de \u00ab '+_pilEsc(stop.nom)+' \u00bb \u2014 cette parcelle demande <b>'+_opFmtH(stop.reste)+'</b> d\'\u00e9quipe, soit '+_opFmtH(stopPer.work)+' \u00e0 '+OP.eff+'.</div>':'')
      +_opFenetreHtml(rows,OP);
  }
  h+='</div>';

  // ── Tris + enregistrement (admin) ──
  if(edit){
    var kmnn=startPt?_opFmtM(_opRouteLen(_opNNNames(_opActTodo()).map(_opParcByNom).filter(Boolean),startPt)):'';
    var _opChip=function(mode,lab,gold){ return '<button data-op="sort" data-mode="'+mode+'" style="border:1px solid '+(gold?'var(--or)':'var(--gris-clair)')+';background:'+(gold?'rgba(201,168,76,.14)':'transparent')+';color:'+(gold?'var(--or)':'var(--texte-doux)')+';border-radius:20px;padding:0 12px;height:34px;font-size:11.5px;font-weight:'+(gold?'700':'600')+';cursor:pointer;font-family:inherit">'+lab+'</button>'; };
    h+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px"><div style="width:100%;font-size:11px;color:var(--texte-doux);margin-bottom:1px">Pr\u00e9-tri (puis ajuste au \u21C5) :</div>'
      +_opChip('nn','\uD83E\uDDED Au plus proche'+(kmnn?'<span style="opacity:.7"> \u00b7 '+kmnn+'</span>':''),true);
    if(_opHasCom()){ var kmc=startPt?_opFmtM(_opRouteLen(_opComNames(_opActTodo()).map(_opParcByNom).filter(Boolean),startPt)):'';
      h+=_opChip('com','\uD83C\uDFD8 Par commune'+(kmc?'<span style="opacity:.7"> \u00b7 '+kmc+'</span>':''),true); }
    h+=_opChip('dom','Ordre du domaine')+_opChip('surfD','Grandes d\'abord')+_opChip('avc','Moins avanc\u00e9es')+_opChip('rev','\u21C5 Inverser')+'</div>';
    var dirty=_opDirty();
    var pill=(dirty==='saved')?'<span style="color:var(--vert-med);font-size:11.5px;font-weight:700">\u2713 Ordre enregistr\u00e9</span>':(dirty==='empty')?'<span style="color:var(--texte-doux);font-size:11.5px">rien \u00e0 ordonner</span>':'<span style="color:var(--orange);font-size:11.5px;font-weight:700">\u25CF '+(dirty==='unsaved'?'non enregistr\u00e9':'modifi\u00e9')+'</span>';
    var canSave=(dirty==='modified'||dirty==='unsaved');
    h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><button data-op="save" style="border:1px solid '+(canSave?'var(--vert-med)':'var(--gris-clair)')+';background:'+(canSave?'rgba(111,191,90,.12)':'transparent')+';color:'+(canSave?'var(--vert-med)':'var(--texte-doux)')+';border-radius:9px;padding:8px 15px;font-size:12.5px;font-weight:700;cursor:'+(canSave?'pointer':'default')+(canSave?'':';opacity:.6')+'">\uD83D\uDCBE Enregistrer la tourn\u00e9e</button>'+pill+_opClearBtn()+'</div>'+_opDiffusHtml();
  } else { h+='<div style="font-size:11.5px;color:var(--texte-doux);background:rgba(127,127,127,.05);border:1px solid var(--gris-clair);border-radius:9px;padding:7px 11px;margin-bottom:8px">\uD83D\uDD12 Tourn\u00e9e d\u00e9finie par l\'administrateur \u2014 lecture seule. Vos parcelles s\'affichent dans cet ordre, avec leur num\u00e9ro, dans Vigne.</div>'; }

  // ── Liste ──
  // Rangement SANS glisser : ⇅ prend en main (une parcelle ou un bloc de commune),
  // puis une fente « insérer ici » la repose. Deux taps, aucun maintien du doigt,
  // aucune lutte avec le défilement. Le glisser-déposer était inutilisable au-delà
  // d'une dizaine de parcelles et les ▲▼ demandaient N appuis pour un seul écart.
  var pk=(edit && OP._pick && OP._pick.names && OP._pick.names.length) ? OP._pick : null;
  var hasCom=_opHasCom();
  var _OP_BOX='display:flex;align-items:center;gap:8px;background:rgba(127,127,127,.05);border:1px solid var(--gris-clair);border-radius:11px;padding:9px 10px;';
  var _OP_DASH='background:repeating-linear-gradient(90deg,var(--or) 0 7px,transparent 7px 13px)';
  function _opRowHtml(x,ri,prevP,badge){
    var hop=(prevP&&x.geo)?('<span style="color:#4A9FC8;font-weight:700">\u21B3 '+_opFmtM(_opHav(prevP,x.p))+'</span> \u00b7 '):(x.geo?'':'<span style="color:var(--texte-doux)">\u25CB sans GPS</span> \u00b7 ');
    var com=(hasCom&&_opCom(x.p))?('\uD83D\uDCCD '+_pilEsc(_opCom(x.p))+' \u00b7 '):'';
    return '<div style="'+_OP_BOX+(pk?'opacity:.45;border-style:dashed;':'')+'">'
      +'<span style="flex:0 0 auto;width:24px;height:24px;border-radius:7px;background:var(--gris-clair);color:var(--texte-doux);font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center">'+(ri+1)+'</span>'
      +'<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:14px;color:var(--texte);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+_pilEsc(x.nom)+(multi&&x.emos?' <span style="font-size:12px">'+x.emos+'</span>':'')+(badge||'')+'</div>'
      +'<div style="font-size:11px;color:var(--texte-doux);margin-top:1px">'+hop+com+'<b>'+_opFmtHa(x.s)+'</b> \u00b7 '+x.pct+'% fait</div></div>'
      +'<div style="text-align:right;flex:0 0 auto"><div style="font-weight:700;font-size:14px;color:var(--texte);font-variant-numeric:tabular-nums">'+_opFmtH(x.reste)+'</div><div style="font-size:9px;color:var(--texte-doux)">restantes</div></div>'
      +((edit&&!pk)?'<button data-op="pick" data-nom="'+_pilEsc(x.nom)+'" title="D\u00e9placer" style="flex:0 0 auto;width:38px;height:44px;border:1px solid var(--gris-clair);background:transparent;color:var(--texte-doux);border-radius:9px;cursor:pointer;font-size:15px;line-height:1;font-family:inherit">\u21C5</button>':'')
      +'</div>';
  }
  function _opSlot(i){ return '<button data-op="drop" data-i="'+i+'" style="display:flex;align-items:center;gap:8px;width:100%;height:44px;border:0;background:transparent;padding:0;cursor:pointer;color:var(--or);font-family:inherit">'
    +'<span style="flex:1;height:2px;border-radius:2px;'+_OP_DASH+'"></span>'
    +'<span style="font-size:11px;font-weight:800;letter-spacing:.3px;white-space:nowrap">\u21B3 INS\u00c9RER ICI</span>'
    +'<span style="flex:1;height:2px;border-radius:2px;'+_OP_DASH+'"></span></button>'; }

  h+='<div id="pil-op-rows" style="display:flex;flex-direction:column;gap:7px">';
  if(!rows.length){ h+='<div class="pil-empty">Tout est \u00e0 jour.</div>'; }
  if(pk){
    // En placement : liste nue (ni badge de jour ni s\u00e9parateur). Les index des
    // fentes sont ceux de la liste PRIV\u00c9E de la prise en main \u2014 m\u00e9langer les deux
    // num\u00e9rotations rendrait la fente choisie impr\u00e9visible.
    var rest=rows.filter(function(x){ return pk.names.indexOf(x.nom)<0; }), pv=startPt;
    rest.forEach(function(x,ri){ h+=_opSlot(ri)+_opRowHtml(x,ri,pv,''); if(x.geo) pv=x.p; });
    h+=_opSlot(rest.length);
  } else {
    var lastOfDay={}; sim.days.forEach(function(dd){ var li=dd.lastIdx, reprise=(sim.per[li]&&sim.per[li].endDay>dd.day); (lastOfDay[li]=lastOfDay[li]||[]).push({day:dd.day,reprise:reprise}); });
    var prev=startPt, ri=0;
    _opRuns(rows).forEach(function(run){
      if(edit && hasCom && run.com && run.names.length>1){
        h+='<div style="display:flex;align-items:center;gap:8px;margin:5px 2px 0"><span style="font-size:10.5px;font-weight:800;letter-spacing:.3px;text-transform:uppercase;color:var(--texte-doux);white-space:nowrap">\uD83D\uDCCD '+_pilEsc(run.com)+' \u00b7 '+run.names.length+'</span><span style="flex:1;height:1px;background:var(--gris-clair)"></span>'
          +'<button data-op="pickr" data-i="'+run.i0+'" style="flex:0 0 auto;border:1px solid var(--gris-clair);background:var(--bg-card);color:var(--texte-doux);border-radius:9px;padding:0 11px;height:34px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">\u21C5 bloc</button></div>';
      }
      run.names.forEach(function(){
        var x=rows[ri], pr=sim.per[ri];
        var badge=(pr.startDay===pr.endDay)?'<span style="font-size:10px;font-weight:700;border-radius:6px;padding:1px 6px;margin-left:6px;background:rgba(201,168,76,.16);color:var(--or)">Jour '+pr.startDay+'</span>':'<span style="font-size:10px;font-weight:700;border-radius:6px;padding:1px 6px;margin-left:6px;background:rgba(74,159,200,.16);color:#4A9FC8">Jours '+pr.startDay+'\u2192'+pr.endDay+'</span>';
        h+=_opRowHtml(x,ri,prev,badge);
        if(x.geo) prev=x.p;
        if(lastOfDay[ri]){ lastOfDay[ri].forEach(function(de){ var j1=(de.day===1); h+='<div style="display:flex;align-items:center;gap:9px;margin:3px 2px"><span style="flex:1;height:1px;background:'+(j1?'linear-gradient(90deg,transparent,var(--or))':'var(--gris-clair)')+'"></span><span style="font-size:10.5px;font-weight:700;white-space:nowrap;border-radius:20px;padding:3px 10px;'+(j1?'color:#14110D;background:var(--or)':'color:var(--texte-doux);background:rgba(127,127,127,.08);border:1px solid var(--gris-clair)')+'">'+(j1?'\u25D7 Fin de la journ\u00e9e 1':'Fin de la journ\u00e9e '+de.day)+(de.reprise?' \u00b7 reprise le lendemain':'')+'</span><span style="flex:1;height:1px;background:'+(j1?'linear-gradient(90deg,var(--or),transparent)':'var(--gris-clair)')+'"></span></div>'; }); }
        ri++;
      });
    });
  }
  h+='</div>';
  // Barre « en main » : flottante au-dessus du dock, à portée de pouce, pour que la
  // pose reste possible sans jamais remonter en haut de la liste.
  if(pk){
    h+='<div style="position:fixed;left:50%;transform:translateX(-50%);width:calc(100% - 24px);max-width:600px;bottom:calc(74px + env(safe-area-inset-bottom,0px));z-index:95;display:flex;align-items:center;gap:9px;background:var(--cave);color:#F2EFE7;border-radius:12px;padding:10px 11px;box-shadow:0 10px 24px rgba(0,0,0,.28)">'
      +'<span style="flex:0 0 auto;font-size:18px">\uD83D\uDD90</span>'
      +'<div style="flex:1;min-width:0;font-size:13px;line-height:1.3"><b style="color:var(--or-clair)">'+_pilEsc(pk.label)+'</b><div style="font-size:10.5px;color:#B9B2A4;margin-top:2px">Touchez une fente dor\u00e9e pour poser</div></div>'
      +'<button data-op="last" style="flex:0 0 auto;border:1px solid var(--or);background:rgba(201,168,76,.22);color:var(--or-clair);border-radius:9px;padding:0 11px;height:44px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">En dernier</button>'
      +'<button data-op="cancel" style="flex:0 0 auto;border:1px solid rgba(255,255,255,.25);background:transparent;color:#F2EFE7;border-radius:9px;padding:0 11px;height:44px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit">Annuler</button></div>';
  }
  if(edit){ h+='<div style="font-size:11px;color:var(--texte-doux);line-height:1.5;margin-top:10px">Coche une ou plusieurs <b>t\u00e2ches</b> (faites sur chaque parcelle avant de passer \u00e0 la suivante). Pour ranger : <b>\u21C5</b> prend la parcelle en main, une <b>fente dor\u00e9e</b> la repose \u2014 <b>\u21C5 bloc</b> d\u00e9place toute une commune d\'un coup. <b>Enregistre</b> pour partager l\'ordre \u00e0 l\'\u00e9quipe.</div>'; }
  return h;
}

function _pilOpRefresh(){ var el=document.getElementById('pil-op-body'); if(el){ el.innerHTML=_opBody(); _opBuildMap(); } }
function _pilOpAction(el){
  if(!_PIL_OP||!el) return;
  var op=el.getAttribute('data-op');
  if(op==='stp'){ var k=el.getAttribute('data-k'), d=parseFloat(el.getAttribute('data-d'));
    if(k==='eff'){ _PIL_OP.eff=Math.max(1,_PIL_OP.eff+d); _PIL_OP.effAuto=false; }
    else if(k==='jour') _PIL_OP.jour=Math.max(1,Math.min(12,Math.round((_PIL_OP.jour+d)*2)/2));
    else if(k==='pause') _PIL_OP.pause=Math.max(0,Math.min(180,_PIL_OP.pause+d));
    else if(k==='trajet') _PIL_OP.trajet=Math.max(0,Math.min(60,_PIL_OP.trajet+d));
  }
  else if(!_opCanEdit()){ return; }
  else if(op==='task'){ var nm=el.getAttribute('data-nom'), i=_PIL_OP.tasks.indexOf(nm);
    if(i>=0){ if(_PIL_OP.tasks.length>1) _PIL_OP.tasks.splice(i,1); } else _PIL_OP.tasks.push(nm);
    _PIL_OP.order=null; _PIL_OP._pick=null; }
  else if(op==='sort'){ var mode=el.getAttribute('data-mode'), act=_opActTodo();
    _PIL_OP._pick=null;
    if(mode==='nn') _PIL_OP.order=_opNNNames(act);
    else if(mode==='com') _PIL_OP.order=_opComNames(act);
    else if(mode==='rev') _PIL_OP.order=_opParcelles().map(function(x){return x.nom;}).reverse();
    else if(mode==='dom') _PIL_OP.order=act.map(function(p){return p.nom;});
    else if(mode==='surfD') _PIL_OP.order=act.slice().sort(function(a,b){return (parseFloat(b.surface)||0)-(parseFloat(a.surface)||0);}).map(function(p){return p.nom;});
    else if(mode==='avc') _PIL_OP.order=act.slice().sort(function(a,b){return _opParcPctM(a)-_opParcPctM(b);}).map(function(p){return p.nom;}); }
  // Prise en main / pose : remplace le glisser-d\u00e9poser (inutilisable au doigt sur
  // une longue liste, et cass\u00e9 : la ligne saisie passait en display:none) ET les
  // fl\u00e8ches \u25B2\u25BC (N appuis par \u00e9cart, cibles de 19 px).
  else if(op==='pick'){ var pn=el.getAttribute('data-nom'); if(pn) _PIL_OP._pick={names:[pn],label:pn}; }
  else if(op==='pickr'){ var i0=parseInt(el.getAttribute('data-i'),10); if(!isFinite(i0)) i0=-1;
    var run=null; _opRuns(_opParcelles()).forEach(function(r){ if(r.i0===i0) run=r; });
    if(run) _PIL_OP._pick={names:run.names.slice(),label:(run.com||'Sans commune')+' \u00b7 '+run.names.length+' parcelles'}; }
  else if(op==='drop'||op==='last'){ var pk2=_PIL_OP._pick;
    if(pk2){ var nms=_opParcelles().map(function(x){return x.nom;});
      var rest2=nms.filter(function(n){ return pk2.names.indexOf(n)<0; });
      var ii=(op==='last')?rest2.length:parseInt(el.getAttribute('data-i'),10);
      if(!isFinite(ii)||ii<0) ii=0; if(ii>rest2.length) ii=rest2.length;
      _PIL_OP.order=rest2.slice(0,ii).concat(pk2.names,rest2.slice(ii)); }
    _PIL_OP._pick=null; }
  else if(op==='cancel'){ _PIL_OP._pick=null; }
  else if(op==='save'){ _PIL_OP._pick=null; _opSaveOrder(); return; }
  else if(op==='clear'){ _PIL_OP._pick=null; _opClearOrder(); return; }
  _pilOpRefresh();
}

function _opInit(d){
  var present=(typeof d.presentChamp==='number')?d.presentChamp:((d.membres||[]).filter(function(m){return m&&!m.bureau;}).length||1);
  var arr=(typeof window.getTachesSaison==='function')?window.getTachesSaison():(window.TACHES||[]);
  var tasks=arr.map(function(def){ var tot=_opParcActive().filter(function(p){return _opApplic(p,def);}).reduce(function(a,p){return a+_opParcReste(p,def);},0); return { def:def, nom:def.nom, tot:tot }; });
  var deflt=null; tasks.forEach(function(x){ if(!deflt||x.tot>deflt.tot) deflt=x; });
  _PIL_OP_DATA={ present:present, tasks:tasks, defaultTask:deflt?deflt.nom:((tasks[0]&&tasks[0].nom)||'') };
  if(!_PIL_OP){ _PIL_OP={ tasks:[_PIL_OP_DATA.defaultTask].filter(Boolean), eff:Math.max(1,present), effAuto:true, jour:7, pause:45, trajet:5, _startNom:null, order:null, _pick:null }; }
  else { if(_PIL_OP.effAuto) _PIL_OP.eff=Math.max(1,present);
    // Un rendu COMPLET de l'onglet (changement d'onglet, rafra\u00eechissement de
    // donn\u00e9es) l\u00e2che ce qu'on tenait : sinon la barre flottante survit \u00e0 une
    // navigation et propose de poser dans une liste qu'on ne voit plus.
    _PIL_OP._pick=null;
    var valid={}; tasks.forEach(function(x){valid[x.nom]=1;});
    _PIL_OP.tasks=(_PIL_OP.tasks||[]).filter(function(n){return valid[n];});
    if(!_PIL_OP.tasks.length) _PIL_OP.tasks=[_PIL_OP_DATA.defaultTask].filter(Boolean); }
}
function _pilPanelOrdrePassage(d){
  _opInit(d);
  var statHtml=_pilStat(_PIL_OP_DATA?_PIL_OP_DATA.present:0,' pr\u00e9sents');
  return _pilTile('ordrepassage', null, '#C9A84C', 'Ordre de passage \u2014 jusqu\'o\u00f9 aujourd\'hui ?', statHtml, 'tourn\u00e9e au plus court \u00b7 diffus\u00e9e \u00e0 l\'\u00e9quipe, par travail', null, '<div id="pil-op-body">'+_opBody()+'</div>');
}

// ── Onglet SIMULATION ──
// ════════════════════════════════════════════════════════════════════
// SIMULATEUR « Renfort : combien, et quand »
// ────────────────────────────────────────────────────────────────────
// REMPLACE « Coût selon l'effectif », dont le modèle était faux sur trois points :
//   1. il facturait TOUTES les heures au taux horaire, alors que les permanents
//      sont payés qu'il y ait du travail ou non — être 5 ou 16 coûtait presque
//      pareil, la courbe était plate et le conseil ininterprétable ;
//   2. il dimensionnait la charge ENTIÈRE de la période sur la fenêtre des
//      seules tâches datées : avec un chantier daté sur 10 jours il conseillait
//      15 personnes, avec plusieurs tâches il tombait à 1 ;
//   3. il chiffrait le retard en pourcentage du coût de main-d'œuvre.
// MODÈLE COURANT : le socle permanent est DONNÉ (il ne se décide pas). Ce qui se
// décide, c'est le renfort — combien, et sur quelles semaines. Le travail est
// posé semaine par semaine par la fenêtre de chaque tâche ; ce qui n'est pas
// absorbé GLISSE, et une tâche en retard devient PLUS LONGUE (+k %/semaine,
// linéaire). Rien n'est jamais abandonné : tout finit par se faire, plus tard et
// plus cher. Lecture seule, rien n'est enregistré.
// ════════════════════════════════════════════════════════════════════
// Ordinal -> ISO. Meme base que planning.js/_pilFriseSvg : 2026-01-01.
function _rfIso(o){ return new Date(Date.parse('2026-01-01T00:00:00')+o*86400000).toISOString().split('T')[0]; }
// Sélection courante : nombre de renforts + fenêtre d'emploi (index de semaine).
// ⚠ Remplace l'ancien profil libre édité au clic dans les colonnes : la zone
// cliquable couvrait tout le graphique, on ne savait plus ce qu'on avait posé.
var _RF_SEL = { R:0, a:0, b:0, dP:0 };   // dP = permanents simules EN PLUS ou EN MOINS
var _RF_D   = null;



function _rfCfg(){
  var e=(window.CONFIG&&window.CONFIG.eco)||{};
  function _n(v,d,min){ var x=Number(v); return (isFinite(x)&&x>=(min==null?0:min))?x:d; }
  var t=(e.taux_horaire&&typeof e.taux_horaire==='object')?e.taux_horaire:{};
  var tr=Number(t['Saisonnier'])||Number(t['TESA'])||Number(t['Extra'])||0;
  return { k:_n(e.k_retard,15,0)/100, rdt:_n(e.rdt_renfort,85,1)/100,
           fixe:_n(e.cout_fixe_renfort,180,0), hs:_n(e.maj_hsup,25,0)/100,
           tauxRenfort:tr, hJour:7, hMax:8 };
}

// ⚠⚠ PLAFOND DU RENFORT — SOURCE UNIQUE. _rfSelHtml et _rfBest en portaient
//   CHACUN leur copie : « Math.min(24, Math.ceil(pic)+3) ». Deux defauts
//   cumules. Le 24 en dur interdisait structurellement de simuler une vendange
//   manuelle, qui demande 30 a 50 personnes sur deux semaines. Et le pic dont
//   il partait etait un pic de campagne, dilue : un domaine qui avait besoin de
//   40 vendangeurs voyait sa liste s'arreter a 20, sans rien pour lui dire
//   pourquoi. Ici le plafond suit le VRAI besoin de pointe (ctx.renfortPic,
//   mesure semaine par semaine), plancher 24 pour ne jamais retrecir la liste,
//   plafond dur 150 pour rester utilisable.
var _RF_RMAX_DUR = 150;
function _rfRMax(ctx){
  var m=Number(ctx&&ctx.renfortPic)||0;
  if(!(m>0)) ((ctx&&ctx.W)||[]).forEach(function(w,i){
    var b=(w.need||0)-(((ctx.dispo)||[])[i]||0); if(b>m) m=b;
  });
  var r=Math.ceil(m)+3;
  return Math.min(_RF_RMAX_DUR, (r<24?24:r));
}

// ⚠⚠ TRAVAIL SANS RATTRAPAGE (« couperet »). Le modele general fait GLISSER ce
//   qui n'est pas absorbe : le travail se fait plus tard, +15 %/semaine plus
//   long, et rien n'est jamais abandonne. C'est juste pour la taille ou le
//   relevage. C'est FAUX pour la vendange : passe la date, la recolte n'est pas
//   en retard, elle est perdue. Le tableau affichait « Vendange +30 sem. »
//   comme une option chiffree.
//   Le drapeau se lit d'abord sur la tache (t.couperet), pour qu'un reglage
//   futur le rende modifiable sans retoucher ce fichier ; le repli par nom
//   normalise ne sert qu'a ne pas attendre ce reglage. Egalite STRICTE : un
//   « prefixe vendange » attraperait « Vendanges vertes », qui est de
//   l'eclaircissage et se rattrape tres bien.
function _rfEstCouperet(nom){
  var k=String(nom||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  return k==='vendange' || k==='vendanges';
}

// Index de la semaine qui contient l'ordinal o. Extraite de _rfSim, qui la
// portait en interne : _rfBesoin doit decouper les fenetres EXACTEMENT comme le
// simulateur, sinon les deux ecrans se contredisent d'une semaine.
function _rfWOf(W,o){
  var n=W.length;
  if(!n) return 0;
  if(o<=W[0].o1) return 0;
  for(var q=1;q<n;q++){ if(o<=W[q].o1) return q; }
  return n-1;
}

// Une tache donnee finit-elle dans sa fenetre, sans rien perdre ?
function _rfOkT(res,nom){
  var ok=true;
  (res.taches||[]).forEach(function(s){
    if(s.nom!==nom) return;
    if(s.dep>0 || s.perdu>0.01 || s.fin===null) ok=false;
  });
  return ok;
}

// ⚠⚠ PLUS PETIT RENFORT QUI SUFFIT, VERIFIE PAR SIMULATION — pas deduit d'une
//   formule. R pose en rectangle sur [a,b]. Critere : la tache nommee tient sa
//   fenetre, ou (nom null) tout tient. Recherche DICHOTOMIQUE : ~8 simulations
//   au lieu de 150 en balayage lineaire, ce qui rend le deplafonnement gratuit.
//   La monotonie est acquise — plus de capacite sur [a,b] ne peut pas faire
//   finir un travail plus tard.
function _rfMinR(ctx,a,b,rMax,nom){
  function ok(R){
    var r=_rfSim(ctx,_rfProf(ctx,{R:R,a:a,b:b}));
    return nom?_rfOkT(r,nom):!r.deborde;
  }
  if(ok(0)) return 0;
  if(!ok(rMax)) return null;
  var lo=0, hi=rMax;
  while(hi-lo>1){ var m=Math.floor((lo+hi)/2); if(ok(m)) hi=m; else lo=m; }
  return hi;
}

// ⚠⚠ « DE COMBIEN DE MONDE CETTE FENETRE A BESOIN » — la question que l'ecran
//   ne posait nulle part. Le seul chiffre affiche, renfortMini, repondait en
//   MOYENNE DE CAMPAGNE : le manque total divise par la capacite totale. Pour
//   une vendange concentree sur deux semaines, ce nombre n'a aucun sens — il
//   annonce 2 personnes la ou il en faut 40, et toutes les strategies proposees
//   en decoulaient. Ici chaque travail est mesure DANS SA FENETRE.
//   brut  = personnes qu'il faudrait en continu sur la fenetre pour cette tache
//           seule (heures / capacite d'une personne sur ces semaines).
//   dispo = permanents presents en moyenne sur la fenetre — PARTAGES avec les
//           autres travaux ouverts au meme moment, d'ou R != brut - dispo.
//   R     = le renfort reellement necessaire, obtenu par simulation.
function _rfBesoin(ctx){
  var W=ctx.W, rMax=_RF_RMAX_DUR, out=[];
  (ctx.tw||[]).forEach(function(t){
    if(!(t.h>0.01)) return;
    var a=_rfWOf(W,t.ws), b=_rfWOf(W,t.we);
    if(b<a) b=a;
    var cap1=0, dispoH=0, i;
    for(i=a;i<=b;i++){ cap1+=(W[i].cap||0); dispoH+=((ctx.dispo[i]||0)*(W[i].cap||0)); }
    out.push({ nom:t.nom, a:a, b:b, sem:(b-a+1), h:t.h, cpt:!!t.cpt,
               brut:(cap1>0?t.h/cap1:0), dispo:(cap1>0?dispoH/cap1:0),
               R:_rfMinR(ctx,a,b,rMax,t.nom),
               d0:_rfIso(W[a].o0), d1:_rfIso(W[b].o1) });
  });
  // Le travail qui commande en premier : celui qui exige le plus de monde.
  out.sort(function(x,y){
    var rx=(x.R===null)?1e9:x.R, ry=(y.R===null)?1e9:y.R;
    return (ry-rx)||(x.a-y.a);
  });
  return out;
}
// Cache par contexte : _rfBody, _rfStrategies et _rfAppliquer lisent le meme
// tableau. ctx est reconstruit a chaque rendu -> aucun risque de peremption.
function _rfBesoinC(ctx){
  if(!ctx._bes) ctx._bes=_rfBesoin(ctx);
  return ctx._bes;
}

// ETP tracteur : MESURE. Heures de sessions de la periode / capacite d'un ETP.
// CONFIG.eco.trac_etp force une hypothese ; une valeur <=0 repasse en mesure.
function _rfTracEtp(capT){
  var e=(window.CONFIG&&window.CONFIG.eco)||{};
  var forc=Number(e.trac_etp);
  if(isFinite(forc)&&forc>0) return { etp:forc, mesure:false };
  if(!(capT>0) || typeof _ecoTracHByParc!=='function') return { etp:0, mesure:true };
  var t=_ecoTracHByParc(), h=0;
  for(var k in t){ if(Object.prototype.hasOwnProperty.call(t,k)) h+=(t[k].h||0); }
  return { etp:Math.min(h/capT,8), mesure:true };
}

// ⚠⚠ DEUX LECTURES DE LA MEME CAMPAGNE, VOLONTAIREMENT DISTINCTES.
//   'plan'  = la campagne ENTIERE : charge theorique totale, depuis sa premiere
//             semaine. Repond a « comment cette campagne etait dimensionnee ».
//             C'est le comportement historique, conserve tel quel.
//   'reste' = ce qu'il RESTE a faire, A PARTIR D'AUJOURD'HUI : semaines ecoulees
//             retirees, semaine en cours proratisee aux jours restants, chaque
//             tache ramenee a son avancement REEL (pct de calcHeures, la meme
//             source que la frise et l'onglet Avancement).
//   AVANT : un seul mode, 'plan'. En pleine campagne le modele rejouait la taille
//   et l'ebourgeonnage DEJA FAITS -> du rouge « en retard » sur toutes les
//   semaines passees, « ca ne boucle pas » en permanence, et un besoin de renfort
//   surestime. C'est 'reste' qui pilote desormais la decision ; 'plan' reste
//   affiche en dessous, comme repere de dimensionnement.
function _rfCd(){
  var sa=(typeof window._pilSaison==='function')?window._pilSaison():null;
  return (window._chargeSaisonData&&window.getSaisonActive)?window._chargeSaisonData(sa):null;
}
// Part des heures d'une tache tombant dans [a,b) — etalement uniforme sur sa
// fenetre. Sert a redonner une ECHELLE juste aux colonnes du graphe du reste.
function _rfHIn(t,a,b){
  var A=Math.max(t.ws,a), B=Math.min(t.we,b);
  if(B<=A) return 0;
  return t.h*(B-A)/Math.max(1,t.we-t.ws);
}
function _rfCtx(d,mode,cdIn){
  var cd=cdIn||_rfCd();
  if(!cd||!(cd.charge>0)||!(cd.weeks&&cd.weeks.length)) return null;
  var rate=_ecoRate(); if(!(rate>0)) return { noRate:true };
  var c=_rfCfg(), WA=cd.weeks, capTfull=0, i;
  for(i=0;i<WA.length;i++) capTfull+=(WA[i].cap||0);
  if(!(capTfull>0)) return null;
  var reste=(mode==='reste');
  var E=_pilEchelle(cd), oT=E.o(E.todayIso);
  var W=WA, nSkip=0, oDep=WA[0].o0, charge=cd.charge;
  var tw=(cd.taskWindows||[]).map(function(t){ return {nom:t.nom,h:t.h,ws:t.ws,we:t.we,cpt:(t.couperet===true)||_rfEstCouperet(t.nom)}; });
  if(reste){
    // 1) chaque tache ramenee a son reste reel. Une tache dont la fenetre est
    //    deja passee reste OUVERTE : elle est en retard, pas disparue — sa
    //    fenetre demarre aujourd'hui, sa limite ne bouge pas.
    var pct={}; ((d&&d.data)||[]).forEach(function(t){ pct[_friseNorm(t.nom)]=(t.pct||0); });
    tw=tw.map(function(t){
      var p=Math.max(0,Math.min(100,pct[_friseNorm(t.nom)]||0));
      return { nom:t.nom, h:t.h*(1-p/100), ws:Math.max(t.ws,oT), we:t.we, cpt:t.cpt };
    }).filter(function(t){ return t.h>0.01; });
    charge=tw.reduce(function(a,t){ return a+t.h; },0);
    // 2) semaines ecoulees retirees, semaine en cours proratisee aux jours restants
    var i0=-1;
    for(i=0;i<WA.length;i++){ if(WA[i].o1>=oT){ i0=i; break; } }
    if(i0<0) return { fini:true, cd:cd };
    nSkip=i0; oDep=Math.max(WA[i0].o0,oT);
    W=WA.slice(i0).map(function(w,k){
      var o0=(k===0)?Math.max(w.o0,oT):w.o0;
      var nd=Math.max(1,w.o1-w.o0+1), ndr=Math.max(0,w.o1-o0+1);
      var fr=(k===0)?(ndr/nd):1, cp=(w.cap||0)*fr;
      // need RECALCULE sur le reste : garder celui du plan ferait mentir la
      // hauteur des colonnes du graphe.
      var wh=0; tw.forEach(function(t){ wh+=_rfHIn(t,o0,w.o1+1); });
      return { o0:o0, o1:w.o1, m:w.m, hours:wh, cap:cp, need:(cp>0?wh/cp:0),
               head:w.head, headPerm:w.headPerm,
               capH:(w.capH!=null?w.capH*fr:null), capPay:(w.capPay!=null?w.capPay*fr:null),
               capHPerm:(w.capHPerm!=null?w.capHPerm*fr:null), capPayPerm:(w.capPayPerm!=null?w.capPayPerm*fr:null) };
    });
  }
  // ★ `pic` (le besoin hebdomadaire maximal) etait calcule ici et renvoye dans le
  //   contexte depuis toujours — AUCUN appelant ne l'a jamais lu. Retire le 11/08
  //   apres verification (`grep '.pic'` = 0 consommateur). Le pic AFFICHE dans le
  //   Pilotage est calcule ailleurs, sur l'echelle des semaines.
  var capT=0;
  W.forEach(function(w){ capT+=(w.cap||0); });
  if(!(capT>0)) return null;
  // ETP tracteur : MESURE sur la campagne ENTIERE dans les deux modes. Le
  // rapporter aux seules semaines restantes ferait exploser le ratio.
  var trac=_rfTracEtp(capTfull);
  // ⚠⚠ EFFECTIF PERMANENT : cd.weeks[].headPerm, l'effectif LISSE au prorata des
  // jours reellement sous contrat (_headWeek), equipes collectives exclues.
  // L'ancienne version comptait les TETES — saisonniers enregistres et CDD hors
  // periode compris — d'ou un « 5 permanents » affiche la ou l'onglet Avancement
  // en montrait 2 a 3. Repli sur head si planning.js n'expose pas headPerm.
  // Le curseur « Permanents » applique un DELTA a l'effectif mesure, il ne le
  // remplace pas : l'escalier des contrats reste visible.
  var dP=(_RF_SEL&&_RF_SEL.dP)||0;
  var head=W.map(function(w){ return Math.max(0, ((w.headPerm!=null?w.headPerm:w.head)||0)+dP); });
  var headMes=W.map(function(w){ return Math.max(0, (w.headPerm!=null?w.headPerm:w.head)||0); });
  // ⚠⚠ LA CAPACITE VIENT DU PLANNING, PLUS D'UN EFFECTIF x UN MODELE MOYEN.
  //   AVANT : (tetes presentes) x (heures du modele « standard »). Deux erreurs
  //   cumulees. Un salarie rattache a un AUTRE modele etait compte aux heures du
  //   standard — son seuil de declenchement des heures sup etait faux toute
  //   l'annee. Et aucun conge, aucune fermeture, aucune absence deja saisie
  //   n'etait deduit : l'hiver, quand les soldes de CP s'ecoulent, le simulateur
  //   comptait tout le monde present.
  //   MAINTENANT : w.capHPerm = la somme, salarie par salarie et jour par jour,
  //   des heures REELLEMENT travaillables (_planWorkH : un CP vaut 0), lue dans
  //   les entrees du planning quand elles existent et dans le modele DE CHACUN
  //   sinon. w.capPayPerm = les heures PAYEES (_planDayH : un CP vaut ses heures).
  //   Payer et pouvoir travailler ne sont pas la meme chose : le socle suit la
  //   paie, la capacite suit la presence. C'etait un seul nombre jusqu'ici.
  //   dispo reste exprime en EQUIVALENT-PERSONNES (heures / cap) : _rfSim et le
  //   graphe le lisent ainsi, et capNorm=(dispo+R*rdt)*cap redonne exactement les
  //   heures reelles — aucune autre fonction n'a eu besoin de changer.
  //   REPLI INTEGRAL sur l'ancien calcul si capHPerm est absent (planning.js
  //   anterieur a ce lot) : jamais d'ecran vide pour une cle manquante.
  var hDisp=W.map(function(w,j){
    var cp=w.cap||0;
    var hp=(w.capHPerm!=null)?(w.capHPerm+dP*cp):(head[j]*cp);
    return Math.max(0, hp-trac.etp*cp);
  });
  var dispo=W.map(function(w,j){ return ((w.cap||0)>0)?(hDisp[j]/w.cap):0; });
  var socle=0, capDispo=0;
  W.forEach(function(w,j){
    var cp=w.cap||0;
    socle+=((w.capPayPerm!=null)?(w.capPayPerm+dP*cp):(head[j]*cp))*rate;
    capDispo+=hDisp[j];
  });
  // ⚠ POINTE DE RENFORT, mesuree SEMAINE PAR SEMAINE. C'est le seul chiffre qui
  //   dimensionne une vendange : renfortMini, lui, moyenne sur toute la
  //   campagne et repond a une autre question (« combien en continu »).
  var rPic=0; W.forEach(function(w,j){ var bs=(w.need||0)-(dispo[j]||0); if(bs>rPic) rPic=bs; });
  var headMoy=capT>0?W.reduce(function(a,w,j){return a+head[j]*(w.cap||0);},0)/capT:0;
  var headMesMoy=capT>0?W.reduce(function(a,w,j){return a+headMes[j]*(w.cap||0);},0)/capT:0;
  return { cd:cd, W:W, tw:tw, capT:capT, c:c, rate:rate,
           head:head, headMes:headMes, dispo:dispo, headMoy:headMoy,
           headMesMoy:headMesMoy, dP:dP, trac:trac,
           mode:(reste?'reste':'plan'), nSkip:nSkip, oDep:oDep, oToday:oT,
           chargePlan:cd.charge, capDispo:capDispo,
           socle:socle, charge:charge,
           manque:Math.max(0, charge-capDispo), renfortPic:rPic,
           renfortMini:(capT>0?Math.max(0,charge-capDispo)/(capT*c.rdt):0) };
}
// SOURCE UNIQUE des deux lectures. _rfBody, la tuile et _rfAppliquer doivent
// raisonner sur EXACTEMENT le meme contexte decisionnel : les index « Du / Au »
// du selecteur designent des semaines de ctx.W, ils n'ont aucun sens dans l'autre.
function _rfPair(d){
  var cd=_rfCd();
  var p=_rfCtx(d,'plan',cd);
  if(!p||p.noRate) return { plan:p, dec:p, fini:false };
  var r=_rfCtx(d,'reste',cd);
  if(r&&r.fini) return { plan:p, dec:p, fini:true };
  return { plan:p, dec:(r&&!r.noRate&&!r.fini)?r:p, fini:false };
}

// Profil de renfort derive de la selection (R personnes des semaines a a b incluses).
function _rfProf(ctx,sel){
  var n=ctx.W.length, r=[], i;
  for(i=0;i<n+200;i++) r[i]=0;
  if(sel && sel.R>0){
    var a=Math.max(0,Math.min(n-1,sel.a)), b=Math.max(a,Math.min(n-1,sel.b));
    for(i=a;i<=b;i++) r[i]=sel.R;
  }
  return r;
}

function _rfSim(ctx,prof){
  var W=ctx.W, nW=W.length, c=ctx.c;
  // Bornes REELLES des semaines. Une division par 7 depuis W[0].o0 decale d'une
  // semaine des que la premiere colonne est tronquee (mode « reste » : elle
  // demarre aujourd'hui, pas forcement un lundi).
  function wOf(o){ return _rfWOf(W,o); }
  var st=ctx.tw.map(function(t){
    return { nom:t.nom, rest:t.h, h0:t.h, ouv:wOf(t.ws), lim:wOf(t.we),
             fin:null, dep:0, cpt:!!t.cpt, perdu:0 };
  });
  var hSup=0, induit=0, capRenf=0, pointe=0, inemploye=0, sem=0, fin0=null, parSem=[];
  for(var w=0; w<nW+200; w++){
    var iw=Math.min(w,nW-1), cap=W[iw].cap||0, R=(prof&&prof[w])||0;
    if(R>pointe) pointe=R;
    if(w<nW) capRenf+=R*cap;
    var dispoP=ctx.dispo[iw]||0;
    var capNorm=(dispoP+R*c.rdt)*cap, capMax=capNorm*(c.hMax/c.hJour);
    // ⚠⚠ REPARTITION, PAS FILE D'ATTENTE. L'ancienne boucle servait la tache la
    //   plus urgente JUSQU'A EPUISEMENT de la capacite avant de passer a la
    //   suivante : une tache en retard gelait tout ce qui venait apres, et les
    //   travaux suivants ne demarraient JAMAIS a leur date. Or on commence
    //   l'ebourgeonnage a sa date meme si le relevage traine.
    //   Chaque tache ouverte recoit une part au prorata de son BESOIN HEBDO
    //   (ce qu'il lui faudrait pour finir dans sa fenetre) ; une tache deja
    //   hors delai demande tout ce qui lui reste, elle est donc servie en
    //   priorite sans pour autant affamer les autres. Le surplus des taches
    //   rassasiees est redistribue en 2e passe.
    var dispo=capMax, used=0;
    // ⚠⚠ LE COUPERET TOMBE ICI, AVANT TOUTE REPARTITION. Passe sa date limite,
    //   un travail sans rattrapage ne recoit plus rien et ce qui restait est
    //   PERDU — pas reporte, pas rallonge de 15 %. Consequence voulue : la
    //   capacite qu'il aurait consommee retourne aux autres travaux, ce qui est
    //   exactement ce qui se passe dans les rangs, et le simulateur cesse de
    //   proposer un renfort de septembre pour rattraper une vendange d'aout.
    st.forEach(function(s){
      if(s.cpt && w>s.lim && s.rest>0.01){ s.perdu+=s.rest; s.rest=0; }
    });
    var ouv=st.filter(function(s){ return s.rest>0 && w>=s.ouv; });
    if(ouv.length){
      var tot=0;
      ouv.forEach(function(s){
        s._f=1+c.k*Math.max(0,w-s.lim);
        var semRest=Math.max(1,s.lim-w+1);
        s._need=(w>s.lim)? s.rest : s.rest/semRest;   // heures NOMINALES/semaine
        s._cout=s._need*s._f;                          // ce qu'elles coutent vraiment
        tot+=s._cout;
      });
      // 1re passe : part proportionnelle, plafonnee au besoin reel de la tache
      ouv.forEach(function(s){
        if(dispo<=0) return;
        var part=(tot>0)?(capMax*s._cout/tot):0;
        var avNom=Math.min(s.rest, part/s._f, dispo/s._f);
        if(avNom<=0) return;
        var coutH=avNom*s._f;
        s.rest-=avNom; dispo-=coutH; used+=coutH; induit+=coutH-avNom;
      });
      // 2e passe : le reliquat va aux taches non finies, les plus urgentes d'abord
      ouv.slice().sort(function(a,b){ return a.lim-b.lim; }).forEach(function(s){
        if(dispo<=0 || s.rest<=0.01) return;
        var avNom=Math.min(s.rest, dispo/s._f), coutH=avNom*s._f;
        s.rest-=avNom; dispo-=coutH; used+=coutH; induit+=coutH-avNom;
      });
      ouv.forEach(function(s){
        if(w>s.lim) s.dep=Math.max(s.dep,w-s.lim);
        if(s.rest<=0.01 && s.fin===null) s.fin=w;
      });
    }
    if(used>capNorm) hSup+=used-capNorm;
    var oisive=Math.max(0,Math.min(capNorm,capMax)-used);
    if(w<nW) inemploye+=oisive;
    // ⚠⚠ CE QUI EST « EN RETARD » N'EST PAS CE QUI RESTE A FAIRE.
    //   resteTot pilote l'arret de la boucle. resteRet est le SEUL qui s'affiche :
    //   une tache n'est en retard qu'AU-DELA de sa date de fin (w > s.lim), pas
    //   parce qu'elle vient d'ouvrir et qu'il reste 90 % a faire.
    //   Deux versions fausses avant celle-ci : (1) somme de TOUTES les taches
    //   -> l'effeuillage de juillet apparaissait « en attente » des la 1re
    //   semaine ; (2) somme des taches OUVERTES -> le rouge s'empilait sur les
    //   premieres semaines de chaque tache et n'en partait jamais, meme avec du
    //   renfort. Desormais le rouge coincide EXACTEMENT avec ce qui declenche
    //   l'inflation des heures : il quitte le debut et s'accumule a la fin.
    var resteTot=0, resteRet=0;
    st.forEach(function(s){ resteTot+=s.rest; if(w>s.lim) resteRet+=s.rest; });
    if(w<nW) parSem.push({w:w,R:R,cap:cap,capNorm:capNorm,used:used,reste:resteRet,dispo:dispoP});
    sem=w;
    // Le compteur « paye sans travail ouvert » doit courir JUSQU'A LA FIN DE LA
    // CAMPAGNE : s'arreter des que le travail est boucle sous-comptait toutes les
    // semaines de permanents oisifs qui suivent. fin0 retient la semaine ou le
    // travail se termine — ce n'est plus l'arret de la boucle qui la definit.
    if(resteTot<=0.01){ if(fin0===null) fin0=w; if(w>=nW-1) break; }
  }
  var tauxR=(c.tauxRenfort>0?c.tauxRenfort:ctx.rate);
  // ⚠ Une heure supplementaire coute l'HEURE + sa majoration. Avant : seule la
  // majoration etait facturee (rate*hs), soit un cinquieme du vrai surcout — le
  // socle ne contient que les heures NORMALES, l'heure sup n'etait comptee nulle part.
  var cRenf=capRenf*tauxR, cHS=hSup*ctx.rate*(1+c.hs), cFixe=pointe*c.fixe;
  return { cSocle:ctx.socle, cRenf:cRenf, cHS:cHS, cFixe:cFixe,
           decide:cRenf+cHS+cFixe, cout:ctx.socle+cRenf+cHS+cFixe,
           induit:induit, hSup:hSup, capRenf:capRenf, pointe:pointe,
           // ⚠⚠ « BOUCLER » = CHAQUE TACHE FINIE DANS SA FENETRE, pas « avant la
           //   fin de campagne ». L'ancien critere (sem>=nW) laissait passer une
           //   tache qui debordait de 2 semaines tant qu'il restait du calendrier
           //   derriere : le modele repondait « aucun renfort necessaire » sur un
           //   chantier manifestement sous-dimensionne. Une echeance agronomique
           //   est une contrainte, pas une preference.
           inemploye:inemploye, finSem:(fin0!=null?fin0:sem),
           // ⚠ Une strategie qui laisse de la recolte au sol NE BOUCLE PAS,
           //   quel que soit son cout et meme si tout le reste finit a l'heure.
           perdu:st.reduce(function(a,s){return a+(s.perdu||0);},0),
           nPerdu:st.filter(function(s){return s.perdu>0.01;}).length,
           deborde:(fin0===null||fin0>=nW)||st.some(function(s){ return s.dep>0 || s.perdu>0.01; }),
           depMax:st.reduce(function(a,s){return Math.max(a,s.dep);},0),
           horsDelai:st.filter(function(s){return s.dep>0;}).length,
           // Le DETAIL par tache, pas seulement le compteur. « Laquelle deborde,
           // de combien, et sur quoi elle pousse » est la seule information qui
           // dit OU mettre le renfort ; un agregat ne le dit pas. s.fin peut
           // depasser nW-1 (la boucle court jusqu'a nW+200) : _rfWkEnd extrapole.
           taches:st.map(function(s){ return {nom:s.nom, lim:s.lim, fin:(s.fin===null?null:s.fin),
                                             dep:s.dep, cpt:!!s.cpt, perdu:(s.perdu||0), h0:s.h0}; }),
           parSem:parSem };
}

// ⚠⚠ RECHERCHE BORNEE. L'ancienne version balayait TOUTES les combinaisons
// nombre x debut x fin : sur une campagne de 40 semaines, ~10 000 simulations
// completes A CHAQUE RENDU **et** a chaque clic — les boutons semblaient inertes
// alors qu'ils mettaient plusieurs secondes. Ici : on cherche le plus petit
// effectif qui boucle sur la campagne entiere, puis on RETRECIT la fenetre tant
// que ca boucle encore, et on teste deux effectifs au-dessus. ~250 simulations.
function _rfBest(ctx){
  // ⚠ Le balayage lineaire de 0 a rMax n'etait tenable que parce que rMax etait
  //   plafonne a 24 — c'est-a-dire au prix de ne jamais trouver la reponse quand
  //   il faut 40 personnes. _rfMinR fait la meme chose par dichotomie, en 8
  //   simulations quel que soit le plafond.
  var n=ctx.W.length, rMax=_rfRMax(ctx);
  var R0=_rfMinR(ctx,0,n-1,rMax,null);
  if(R0===null) return null;                       // rien ne boucle : pas de conseil
  var best=null;
  for(var R=R0; R<=Math.min(rMax,R0+2); R++){
    var a=0, b=n-1;
    if(R>0){
      while(a<b && !_rfSim(ctx,_rfProf(ctx,{R:R,a:a+1,b:b})).deborde) a++;
      while(b>a && !_rfSim(ctx,_rfProf(ctx,{R:R,a:a,b:b-1})).deborde) b--;
    } else { a=0; b=0; }
    var s=_rfSim(ctx,_rfProf(ctx,{R:R,a:a,b:b}));
    if(!s.deborde && (!best || s.decide<best.s.decide)) best={R:R,a:a,b:b,s:s};
  }
  return best;
}

// ⚠⚠ LES PROPOSITIONS PARTENT DES FENETRES, PLUS D'UNE MOYENNE. Les anciennes
//   se calaient toutes sur renfortMini = manque total / capacite totale, puis
//   « x2 sur une moitie de campagne ». Aucune ne pouvait tomber juste des qu'un
//   travail court et lourd existait : on proposait 2 personnes toute l'annee et
//   4 sur six mois pour une vendange qui en demande 40 sur deux semaines. Et
//   comme aucune ne bouclait, l'ecran concluait « il faut plus de monde que ce
//   que le simulateur a teste » sans jamais dire combien.
function _rfStrategies(ctx){
  var n=ctx.W.length, out=[], bes=_rfBesoinC(ctx);
  out.push({nom:'Aucun renfort', sel:{R:0,a:0,b:0}});
  // Les deux travaux qui commandent, chacun avec le nombre exact que SA fenetre
  // reclame. Au-dela de deux, la rangee de boutons devient illisible.
  var k=0;
  bes.forEach(function(x){
    if(k>=2 || !(x.R>0)) return;
    k++;
    out.push({nom:_pilEsc(x.nom)+' \u2014 '+x.R+' pers.', sel:{R:x.R,a:x.a,b:x.b},
      detail:x.R+' personne'+(x.R>1?'s':'')+' du '+_pilFmtD(x.d0)+' au '+_pilFmtD(x.d1)
             +' \u00b7 '+x.sem+' semaine'+(x.sem>1?'s':'')});
  });
  var tout=_rfMinR(ctx,0,n-1,_RF_RMAX_DUR,null);
  if(tout!=null && tout>0) out.push({nom:tout+' sur toute la p\u00e9riode', sel:{R:tout,a:0,b:n-1},
    detail:'le plus petit nombre qui tient sans jamais s\u2019arr\u00eater'});
  var b=_rfBest(ctx);
  if(b) out.push({nom:'Le meilleur placement trouv\u00e9', best:true, sel:{R:b.R,a:b.a,b:b.b},
    detail:b.R+' renfort'+(b.R>1?'s':'')+' \u00b7 '+_pilFmtD(_rfIso(ctx.W[b.a].o0))+' \u2192 '+_pilFmtD(_rfIso(ctx.W[b.b].o1))});
  return out;
}

// ── Étape 2 : le profil. Il dessine le RÉSULTAT de la simulation. Plus aucune
//    zone cliquable : la sélection se fait au sélecteur, au-dessus. ──
// Abscisse en DATES DE JOURS : chaque colonne porte le premier et le dernier
// jour qu'elle couvre (« 23–29 aout »), pas un numero de semaine. On lit le
// graphique avec le calendrier du domaine, pas avec un compteur interne.
function _rfLabJ(W,i){
  var MO=['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];
  var a=String(_rfIso(W[i].o0)).split('-'), b=String(_rfIso(W[i].o1)).split('-');
  var da=parseInt(a[2],10), db=parseInt(b[2],10);
  var ma=MO[parseInt(a[1],10)-1]||'', mb=MO[parseInt(b[1],10)-1]||'';
  return (ma===mb) ? (da+'\u2013'+db+' '+mb) : (da+' '+ma+'\u2013'+db+' '+mb);
}
function _rfProfilSvg(ctx,res,sel,opt,w){
  opt=opt||{};
  var W=ctx.W, n=W.length, PS=res.parSem;
  var E=_pilEchelle(ctx.cd,w), X=E.X;
  var c=window._mvGraphCadre(E.W,1);
  var Wd=E.W,padL=E.padL,padR=E.padR,padT=22,padB=42,Ht=290,pw=E.plotW,ph=Ht-padT-padB;
  // Une colonne n'occupe plus une fraction egale de la largeur : elle occupe
  // les JOURS qu'elle couvre, exactement comme la barre correspondante de la
  // frise. colW ne sert plus qu'a doser la densite des etiquettes.
  function CX0(k){ return X(W[Math.max(0,Math.min(n-1,k))].o0); }
  function CX1(k){ return X(W[Math.max(0,Math.min(n-1,k))].o1+1); }
  var colW=pw/n, top=2, i;
  for(i=0;i<n;i++){
    var q=PS[i]||{}, dt=(ctx.head[i]||0)+((sel&&sel.R&&i>=sel.a&&i<=sel.b)?sel.R:0);
    var att=(q.cap>0)?q.reste/q.cap:0;
    if(dt+Math.min(att,4)>top) top=dt+Math.min(att,4);
    if((W[i].need||0)>top) top=W[i].need;
  }
  top=Math.ceil(top)+1;
  function Y(v){ return padT+ph-(v/top)*ph; }
  var g='<defs><pattern id="rfoisif" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">'
   +'<rect width="6" height="6" fill="var(--bg-card)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--gris)" stroke-width="2"/></pattern></defs>';
  for(var v=0;v<=top;v+=(top>14?2:1)){
    g+='<line x1="'+padL+'" y1="'+Y(v).toFixed(1)+'" x2="'+(Wd-padR)+'" y2="'+Y(v).toFixed(1)+'" stroke="'+c.col.grille+'"/>'
      +'<text x="'+(padL-8)+'" y="'+(Y(v)+4).toFixed(1)+'" text-anchor="end" font-size="'+c.txt.mini+'" fill="'+c.col.texte+'">'+v+'</text>';
  }
  // Memes separations de mois que la frise du dessus : c'est ce qui permet de
  // suivre une date d'un graphique a l'autre sans compter les colonnes.
  ((ctx.cd&&ctx.cd.months)||[]).forEach(function(mo){
    var mx=X(Math.max(E.s,E.moO0(mo)));
    if(mx<padL-0.5||mx>Wd-padR+0.5) return;
    g+='<line x1="'+mx.toFixed(1)+'" y1="'+padT+'" x2="'+mx.toFixed(1)+'" y2="'+(padT+ph).toFixed(1)+'" stroke="'+c.col.grille+'" stroke-width="1"/>';
  });
  g+='<line x1="'+X(E.e+1).toFixed(1)+'" y1="'+padT+'" x2="'+X(E.e+1).toFixed(1)+'" y2="'+(padT+ph).toFixed(1)+'" stroke="'+c.col.grille+'" stroke-width="1"/>';
  // Voile sur la partie deja ecoulee (mode « reste ») : a gauche du trait rouge
  // ce n'est pas vide, c'est derriere nous.
  if(opt.grisJusqu!=null){
    var _gx0=X(E.s), _gx1=X(opt.grisJusqu);
    if(_gx1>_gx0+0.5){
      g+='<rect x="'+_gx0.toFixed(1)+'" y="'+padT+'" width="'+(_gx1-_gx0).toFixed(1)+'" height="'+ph+'" fill="var(--texte)" opacity="0.05"/>'
       +'<text x="'+((_gx0+_gx1)/2).toFixed(1)+'" y="'+(padT+ph/2).toFixed(1)+'" text-anchor="middle" font-size="'+c.txt.mini+'" fill="'+c.col.texte+'">d\u00e9j\u00e0 \u00e9coul\u00e9</text>';
    }
  }
  // bande doree = semaines ou le renfort est employe
  if(sel && sel.R>0){
    var bx0=CX0(sel.a), bx1=CX1(sel.b);
    g+='<rect x="'+bx0.toFixed(1)+'" y="'+padT+'" width="'+(bx1-bx0).toFixed(1)+'" height="'+ph+'" fill="'+c.col.prevu+'" opacity="0.12"/>';
  }
  var b0=ctx.trac.etp;
  for(i=0;i<n;i++){
    var q2=PS[i]||{cap:W[i].cap,used:0,reste:0,capNorm:0};
    var R=(sel&&sel.R&&i>=sel.a&&i<=sel.b)?sel.R:0;
    var dispoV=(ctx.dispo[i]||0)+R, tT=(ctx.head[i]||0)+R;
    var occ=(q2.capNorm>0)?Math.min(dispoV,(q2.used/q2.capNorm)*dispoV):0;
    var att2=(q2.cap>0)?q2.reste/q2.cap:0;
    var cx0=CX0(i), cx1=CX1(i), bx=cx0+2.5, bw=Math.max(1,cx1-cx0-5);
    if(b0>0.01) g+='<rect x="'+bx.toFixed(1)+'" y="'+Y(b0).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+(Y(0)-Y(b0)).toFixed(1)+'" rx="2" fill="var(--acier)" opacity="0.72"/>';
    if(occ>0.01) g+='<rect x="'+bx.toFixed(1)+'" y="'+Y(b0+occ).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+(Y(b0)-Y(b0+occ)).toFixed(1)+'" rx="2" fill="'+c.col.fait+'" opacity="0.85"/>';
    if(dispoV-occ>0.04) g+='<rect x="'+bx.toFixed(1)+'" y="'+Y(b0+dispoV).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+(Y(b0+occ)-Y(b0+dispoV)).toFixed(1)+'" rx="2" fill="url(#rfoisif)" stroke="var(--gris)" stroke-width="1"/>';
    if(att2>0.04) g+='<rect x="'+bx.toFixed(1)+'" y="'+Y(tT+Math.min(att2,4)).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+(Y(tT)-Y(tT+Math.min(att2,4))).toFixed(1)+'" rx="2" fill="'+c.col.alerte+'" opacity="0.55"/>';
  }
  // ligne de l'effectif permanent : EN ESCALIER (elle varie avec les contrats)
  var path='';
  for(i=0;i<n;i++){
    var x0=CX0(i), x1=CX1(i), yy=Y(ctx.head[i]||0);
    path+=(i===0?'M ':' L ')+x0.toFixed(1)+' '+yy.toFixed(1)+' L '+x1.toFixed(1)+' '+yy.toFixed(1);
  }
  g+='<path d="'+path+'" fill="none" stroke="var(--texte)" stroke-width="2.5" stroke-linejoin="round"/>'
    +'<text x="'+(Wd-padR-4)+'" y="'+(Y(ctx.head[n-1]||0)-6).toFixed(1)+'" text-anchor="end" font-size="'+c.txt.mini+'" font-weight="700" fill="var(--texte)">permanents pr\u00e9sents</text>';
  if(opt.note)
    g+='<text x="'+(padL+pw/2).toFixed(1)+'" y="'+(padT+14)+'" text-anchor="middle" font-size="'+c.txt.axe+'" font-weight="700" fill="'+c.col.texte+'">'+_pilEsc(opt.note)+'</text>';
  else if(!sel || !sel.R)
    g+='<text x="'+(padL+pw/2).toFixed(1)+'" y="'+(padT+14)+'" text-anchor="middle" font-size="'+c.txt.axe+'" font-weight="700" fill="'+c.col.texte+'">aucun renfort pos\u00e9 \u2014 voici la campagne avec ton \u00e9quipe seule</text>';
  // Densite adaptative : une etiquette « 23–29 aout » demande ~64 px. On saute
  // des colonnes tant qu'elles n'ont pas cette largeur (72 px de marge, un
  // libelle a cheval sur deux mois est le plus large), plutot que de superposer.
  var stepX=Math.max(1,Math.ceil(72/Math.max(1,colW)));
  for(i=0;i<n;i+=stepX){
    var lx=(CX0(i)+CX1(i))/2;
    g+='<line x1="'+lx.toFixed(1)+'" y1="'+(padT+ph).toFixed(1)+'" x2="'+lx.toFixed(1)+'" y2="'+(padT+ph+4).toFixed(1)+'" stroke="var(--gris)"/>'
      +'<text x="'+lx.toFixed(1)+'" y="'+(Ht-22)+'" text-anchor="middle" font-size="'+c.txt.mini+'" fill="'+c.col.texte+'">'+_rfLabJ(W,i)+'</text>';
  }
  g+='<text x="'+(padL+pw/2).toFixed(1)+'" y="'+(Ht-6)+'" text-anchor="middle" font-size="'+c.txt.mini+'" letter-spacing="1.3" fill="'+c.col.texte+'">'+_pilEsc(opt.axe||'CAMPAGNE')+' \u00b7 '
    +_pilFmtD(_rfIso(W[0].o0))+' \u2192 '+_pilFmtD(_rfIso(W[n-1].o1))+'</text>';
  // Trait « aujourd'hui » : meme date, meme abscisse que sur la frise.
  var _tj=E.o(E.todayIso);
  if(_tj>=E.s && _tj<=E.e){
    var _tx=X(_tj);
    g+='<line x1="'+_tx.toFixed(1)+'" y1="'+padT+'" x2="'+_tx.toFixed(1)+'" y2="'+(padT+ph).toFixed(1)+'" stroke="'+c.col.texte+'" stroke-width="1.5" stroke-dasharray="4 3"/>'
      +'<text x="'+(_tx+4).toFixed(1)+'" y="'+(padT+10)+'" font-size="'+c.txt.mini+'" font-weight="700" fill="'+c.col.texte+'">aujourd\u2019hui</text>';
  }
  return window._mvGraphSvg(window._mvGraphCadre(Wd,Ht),
    'Profil du renfort semaine par semaine : effectif pr\u00e9sent, travail absorb\u00e9 et travail en attente.', g);
}

function _rfCoutSvg(ctx,res,meilleur,w){
  // Ce graphe tient sur un telephone : une barre et quatre lignes de texte.
  var c=window._mvGraphCadre((w>0?Math.max(460,w):940),128,{padL:14,padR:14,padT:14,padB:14});
  var W=c.w,H=c.h,pad=c.padL,barY=50,barH=34,pw=c.iw;
  var parts=[{l:'Renfort',v:res.cRenf,c:'var(--or)'},{l:'Heures sup',v:res.cHS,c:'var(--orange)'},{l:'Recrutement',v:res.cFixe,c:'var(--terre)'}];
  var dec=parts.reduce(function(a,p){return a+p.v;},0);
  var g='<text x="'+pad+'" y="16" font-size="'+c.txt.mini+'" letter-spacing="1.5" fill="'+c.col.texte+'">CE QUE TU D\u00c9CIDES</text>'
   +'<text x="'+pad+'" y="39" font-size="'+(c.etroit?19:23)+'" font-weight="700" fill="var(--texte)" font-family="Cormorant Garamond,serif">'+_ecoEur(dec)+'</text>'
   +'<text x="'+(W-pad)+'" y="16" text-anchor="end" font-size="'+c.txt.mini+'" letter-spacing="1.5" fill="'+c.col.texte+'">TOTAL DE LA CAMPAGNE</text>'
   +'<text x="'+(W-pad)+'" y="38" text-anchor="end" font-size="'+(c.etroit?14:16)+'" font-weight="600" fill="'+c.col.texte+'" font-family="Cormorant Garamond,serif">'+_ecoEur(res.cout)+'</text>'
   +'<text x="'+(W-pad)+'" y="52" text-anchor="end" font-size="'+c.txt.mini+'" fill="'+c.col.texte+'">dont '+_ecoEur(res.cSocle)+' de socle permanent, identique partout</text>';
  if(dec<=0){
    g+='<rect x="'+pad+'" y="'+barY+'" width="'+pw+'" height="'+barH+'" rx="4" fill="var(--gris-clair)" stroke="var(--gris)"/>'
      +'<text x="'+(pad+pw/2)+'" y="'+(barY+barH/2+4)+'" text-anchor="middle" font-size="'+c.txt.axe+'" fill="'+c.col.texte+'">aucun renfort \u2014 rien de plus \u00e0 payer, et le travail glisse</text>';
  } else {
    var x=pad;
    parts.forEach(function(p){
      if(p.v<=0) return;
      var w=p.v/dec*pw;
      g+='<rect x="'+x.toFixed(1)+'" y="'+barY+'" width="'+w.toFixed(1)+'" height="'+barH+'" fill="'+p.c+'" opacity="0.88"/>';
      if(w>92) g+='<text x="'+(x+w/2).toFixed(1)+'" y="'+(barY+barH/2+4)+'" text-anchor="middle" font-size="'+c.txt.axe+'" font-weight="700" fill="#FFFFFF">'+p.l+' \u00b7 '+_ecoEur(p.v)+'</text>';
      else if(w>34) g+='<text x="'+(x+w/2).toFixed(1)+'" y="'+(barY+barH/2+4)+'" text-anchor="middle" font-size="'+c.txt.mini+'" font-weight="700" fill="#FFFFFF">'+_ecoEur(p.v)+'</text>';
      x+=w;
    });
  }
  var msg, col=c.col.fait;
  if(res.deborde){
    msg=(res.horsDelai>0)
      ? ('\u26a0 '+res.horsDelai+' t\u00e2che'+(res.horsDelai>1?'s':'')+' ne tiendra'+(res.horsDelai>1?'ront':'')+' pas son d\u00e9lai \u2014 jusqu\u2019\u00e0 '+res.depMax+' semaine'+(res.depMax>1?'s':'')+' de retard, et chaque semaine ajoute '+_pilNum(ctx.c.k*100)+' % de temps.')
      : ('\u26a0 Le travail finit '+(res.finSem-ctx.W.length+1)+' semaines apr\u00e8s la campagne, et mord sur la suivante.');
    col=c.col.alerte; }
  else if(meilleur && meilleur.decide < res.decide-1) msg='En d\u00e9pla\u00e7ant ce renfort, la m\u00eame campagne se boucle pour '+_ecoEur(meilleur.decide)+' \u2014 soit '+_ecoEur(res.decide-meilleur.decide)+' de moins.';
  else msg='\u2713 Aucune des strat\u00e9gies test\u00e9es ne boucle la campagne pour moins cher.';
  g+='<text x="'+pad+'" y="'+(barY+barH+22)+'" font-size="'+c.txt.axe+'" font-weight="600" fill="'+col+'">'+_pilEsc(msg)+'</text>';
  return window._mvGraphSvg(c, 'Ce que co\u00fbte la strat\u00e9gie de renfort : '+_ecoEur(dec)+' d\u00e9cid\u00e9s sur un total de campagne de '+_ecoEur(res.cout)+'.', g);
}

// Fin REELLE de la semaine w, meme au-dela de la campagne. La boucle de _rfSim
// court jusqu'a nW+200 : une tache peut finir apres la derniere colonne connue.
// On prolonge de 7 jours par semaine plutot que de rendre une date fausse.
function _rfWkEnd(ctx,w){
  var last=ctx.W.length-1;
  if(w<0) w=0;
  return (w<=last) ? ctx.W[w].o1 : (ctx.W[last].o1+(w-last)*7);
}

// « Laquelle deborde, et de combien. » Une ligne par travail hors delai, dans
// l'ordre du calendrier : c'est cet ordre qui montre l'effet domino, le premier
// qui deborde poussant celui d'apres.
function _rfRetardHtml(ctx,res){
  var h='';
  // ⚠ CE QUI EST PERDU SE LIT AVANT CE QUI EST EN RETARD. Un retard se rattrape,
  //   une recolte non rentree ne se rattrape pas : melanger les deux dans une
  //   colonne « +N sem. » faisait lire une impossibilite comme un delai.
  var P=(res.taches||[]).filter(function(s){ return s.perdu>0.01; });
  if(P.length){
    P.sort(function(a,b){ return (a.lim-b.lim)||(b.perdu-a.perdu); });
    h+='<div style="overflow-x:auto"><table class="rf-cmp" style="margin-top:10px"><tr>'
      +'<th>Non rentr\u00e9</th><th class="r">Date limite</th><th class="r">Pas fait</th><th class="r">Part du travail</th></tr>';
    h+=P.map(function(s){
      var pc=(s.h0>0)?(100*s.perdu/s.h0):0;
      return '<tr><td>'+_pilEsc(s.nom)+'</td>'
        +'<td class="r">'+_pilFmtD(_rfIso(_rfWkEnd(ctx,s.lim)))+'</td>'
        +'<td class="r" style="color:#9B2D1F;font-weight:600">'+_pilNum(s.perdu)+' h</td>'
        +'<td class="r" style="color:#9B2D1F;font-weight:600">'+_pilNum(pc)+' %</td></tr>';
    }).join('')+'</table></div>';
  }
  var L=(res.taches||[]).filter(function(s){ return s.dep>0; });
  if(!L.length) return h;
  L.sort(function(a,b){ return (a.lim-b.lim)||(b.dep-a.dep); });
  h+='<div style="overflow-x:auto"><table class="rf-cmp" style="margin-top:10px"><tr>'
    +'<th>Travail</th><th class="r">Devrait finir le</th><th class="r">Finit le</th><th class="r">Retard</th></tr>';
  h+=L.map(function(s){
    var fin=(s.fin===null)?null:s.fin;
    return '<tr><td>'+_pilEsc(s.nom)+'</td>'
      +'<td class="r">'+_pilFmtD(_rfIso(_rfWkEnd(ctx,s.lim)))+'</td>'
      +'<td class="r" style="color:#9B2D1F">'+(fin===null?'pas avant la fin':_pilFmtD(_rfIso(_rfWkEnd(ctx,fin))))+'</td>'
      +'<td class="r" style="color:#9B2D1F;font-weight:600">+'+_pilNum(s.dep)+' sem.</td></tr>';
  }).join('')+'</table></div>';
  return h;
}

// ⚠⚠ CE QUE CHAQUE FENETRE DEMANDE. Le tableau que l'ecran n'avait pas, et qui
//   repond seul a « 20 personnes a la fin ça passe, 20 au debut non » : du
//   renfort pose hors de la fenetre d'un travail ne sert pas ce travail, il est
//   paye et inemploye. Le nombre de la derniere colonne est VERIFIE par
//   simulation, pas calcule en soustrayant deux moyennes.
function _rfBesoinHtml(ctx){
  var bes=_rfBesoinC(ctx).filter(function(x){ return x.R===null || x.R>0; });
  if(!bes.length) return '';
  var h='<div style="overflow-x:auto"><table class="rf-cmp" style="margin-top:10px"><tr>'
    +'<th>Travail</th><th class="r">Sa fen\u00eatre</th><th class="r">Il faudrait</th>'
    +'<th class="r">Permanents</th><th class="r">Renfort \u00e0 poser</th></tr>';
  h+=bes.map(function(x){
    var rr=(x.R===null)
      ? '<span style="color:#9B2D1F;font-weight:600">plus de '+_RF_RMAX_DUR+'</span>'
      : '<b style="color:#B85A1A">'+_pilNum(x.R)+' pers.</b>';
    return '<tr><td>'+_pilEsc(x.nom)
        +(x.cpt?'<div class="rf-sub" style="color:#9B2D1F">sans rattrapage</div>':'')+'</td>'
      +'<td class="r">'+_pilFmtD(x.d0)+' \u2192 '+_pilFmtD(x.d1)
        +'<div class="rf-sub">'+_pilNum(x.sem)+' semaine'+(x.sem>1?'s':'')+'</div></td>'
      +'<td class="r">'+_ecoH1(x.brut)+' pers.</td>'
      +'<td class="r">'+_ecoH1(x.dispo)+' pers.</td>'
      +'<td class="r">'+rr+'</td></tr>';
  }).join('')+'</table></div>'
   +'<div class="rf-how" style="margin-top:8px"><b>Comment lire ce tableau.</b> '
   +'<b>Il faudrait</b> = le monde qu\u2019il faudrait en continu sur cette fen\u00eatre pour ce travail SEUL. '
   +'<b>Permanents</b> = ceux qui sont l\u00e0 pendant cette fen\u00eatre \u2014 mais ils sont partag\u00e9s avec les autres travaux ouverts en m\u00eame temps, '
   +'c\u2019est pourquoi la derni\u00e8re colonne n\u2019est pas la simple diff\u00e9rence des deux : elle est <b>v\u00e9rifi\u00e9e en simulant</b>. '
   +'Un renfort pos\u00e9 en dehors de la fen\u00eatre ne sert pas ce travail : il est pay\u00e9 sans travail ouvert.</div>';
  return h;
}

function _rfTable(ctx,res,strs){
  var rows=[{nom:'Ta s\u00e9lection', moi:true, r:res}];
  strs.forEach(function(s){ rows.push({nom:s.nom, detail:s.detail, r:_rfSim(ctx,_rfProf(ctx,s.sel))}); });
  // DEUX GROUPES, PAS UN CLASSEMENT UNIQUE. Une strategie qui ne boucle pas ne
  // se compare pas au montant : elle repond a une autre question. Melangees, la
  // moins chere de l'ecran est presque toujours celle qui ne finit rien a temps.
  var via=rows.filter(function(x){ return !x.r.deborde; });
  var hors=rows.filter(function(x){ return x.r.deborde; });
  var mn=via.length?via.reduce(function(a,x){ return x.r.decide<a.r.decide?x:a; }):null;
  function tri(L){
    return L.slice().sort(function(a,b){
      if(a.moi!==b.moi) return a.moi?-1:1;
      return a.r.decide-b.r.decide;
    });
  }
  via=tri(via); hors=tri(hors);

  function ligne(x,ok){
    var fin, fc;
    if(ok){ fin='dans les fen\u00eatres'; fc='#3D6B27'; }
    else if(x.r.nPerdu>0){ fin=_pilNum(x.r.perdu)+' h non rentr\u00e9es'; fc='#9B2D1F'; }
    else if(x.r.horsDelai>0){ fin=_pilNum(x.r.horsDelai)+' hors d\u00e9lai \u00b7 +'+_pilNum(x.r.depMax)+' sem.'; fc='#9B2D1F'; }
    else { var dd=x.r.finSem-ctx.W.length+1; fin=(dd>52)?'ne finit jamais':('d\u00e9borde de '+_pilNum(dd)+' sem.'); fc='#9B2D1F'; }
    var ec;
    if(!ok) ec='<span style="color:#9B2D1F">ne boucle pas</span>';
    else if(!mn||x===mn) ec='<span style="color:#3D6B27">le moins cher</span>';
    else ec='<span style="color:#B85A1A">+'+_ecoEur(x.r.decide-mn.r.decide)+'</span>';
    return '<tr'+(x.moi?' class="moi"':'')+'>'
      +'<td'+(ok?'':' style="opacity:.62"')+'>'+(x.moi?'\u25b8 ':'')+_pilEsc(x.nom)
        +(x.detail?('<div class="rf-sub">'+_pilEsc(x.detail)+'</div>'):'')+'</td>'
      +'<td class="r" style="color:'+fc+(ok?'':';font-weight:600')+'">'+fin+'</td>'
      +'<td class="r"'+(ok?'':' style="opacity:.62"')+'>'+_ecoEur(x.r.decide)+'</td>'
      +'<td class="r">'+ec+'</td>'
      +'<td class="r"'+(ok?'':' style="opacity:.62"')+'>'+_pilNum(x.r.capRenf)+' h</td>'
      +'<td class="r"'+(x.r.inemploye>1?' style="color:#B85A1A"':'')+'>'+_pilNum(x.r.inemploye)+' h</td>'
      +'<td class="r"'+(x.r.induit>1?' style="color:#9B2D1F;font-weight:600"':'')+'>'+_pilNum(x.r.induit)+' h</td></tr>';
  }

  var h='<div style="overflow-x:auto"><table class="rf-cmp"><tr>'
    +'<th>Strat\u00e9gie</th><th class="r">\u00c9ch\u00e9ances</th><th class="r">\u00c0 d\u00e9cider</th><th class="r">\u00c9cart</th>'
    +'<th class="r">Renfort</th><th class="r">Pay\u00e9 sans travail</th><th class="r">Ajout\u00e9 par le retard</th></tr>';
  h+=via.map(function(x){ return ligne(x,true); }).join('');
  if(hors.length){
    h+='<tr><td colspan="7" style="padding:14px 8px 6px;border-top:2px solid rgba(155,45,31,.35);'
      +'font-size:12.5px;font-weight:600;color:#9B2D1F;letter-spacing:.02em">'
      +'Ne finit pas dans les fen\u00eatres \u2014 le travail d\u00e9borde sur la suite</td></tr>';
    h+=hors.map(function(x){ return ligne(x,false); }).join('');
  }
  h+='</table></div>';
  // ⚠ « il faut plus de monde que ce que le simulateur a teste » etait un aveu,
  //   pas une reponse. On cherche le nombre, jusqu'au plafond dur.
  if(!via.length){
    var t2=_rfMinR(ctx,0,ctx.W.length-1,_RF_RMAX_DUR,null);
    h+='<div class="rf-how" style="border-color:rgba(155,45,31,.4)"><b>Aucune de ces strat\u00e9gies ne tient les fen\u00eatres.</b> '
      +((t2!=null)
        ? ('Il en faut <b>'+_pilNum(t2)+' de renfort sur toute la p\u00e9riode</b> pour y arriver. Le tableau de l\u2019\u00e9tape 3 dit dans quelle fen\u00eatre les placer \u2014 au bon moment, il en faut souvent bien moins.')
        : ('M\u00eame <b>'+_RF_RMAX_DUR+' personnes</b> n\u2019y suffisent pas : les fen\u00eatres sont trop courtes pour la charge. Il faut d\u00e9caler des dates de fin dans R\u00e9glages \u203a Campagne, ou m\u00e9caniser une partie du travail.'))
      +'</div>';
  }
  return { html:h, meilleur:mn?mn.r:null, mnRow:mn };
}

// Selecteur : nombre + fenetre. Remplace l'edition au clic dans les colonnes.
// Options du champ « Renfort ». PAS VARIABLE : au-dela de 50, une liste de 150
// entrees n'est plus manipulable au pouce — on passe par paliers, et la derniere
// option ouvre la saisie libre pour tout nombre intermediaire.
function _rfROpts(rMax,cur){
  var vals=[], i;
  for(i=0;i<=Math.min(rMax,50);i++) vals.push(i);
  [60,75,100,125,150].forEach(function(v){ if(v<=rMax && vals.indexOf(v)<0) vals.push(v); });
  if(cur>0 && vals.indexOf(cur)<0){ vals.push(cur); vals.sort(function(a,b){ return a-b; }); }
  return vals.map(function(v){
    return '<option value="'+v+'"'+(v===cur?' selected':'')+'>'+(v===0?'aucun':v)+'</option>';
  }).join('')+'<option value="__autre">autre nombre\u2026</option>';
}
function _rfSelHtml(ctx){
  var n=ctx.W.length, rMax=_rfRMax(ctx), i, o;
  var s=_RF_SEL, dPv=(s&&isFinite(s.dP))?s.dP:0;   // dP undefined -> AUCUNE option cochee -> le navigateur affiche la 1re (-2)
  o=_rfROpts(rMax,s.R||0);
  var selR='<label class="rf-f"><span>Renfort</span><select onchange="window._rfSel(\'R\',this.value)">'+o+'</select></label>';
  var oP='';
  for(i=-4;i<=8;i++){
    var v=i/2;                                    // pas de 0,5 : les temps partiels comptent
    oP+='<option value="'+v+'"'+(Math.abs(v-dPv)<0.01?' selected':'')+'>'
       +(v>0?('+'+_ecoH1(v)):(v<0?_ecoH1(v):'mesur\u00e9'))+'</option>';
  }
  var selP='<label class="rf-f"><span>Permanents</span><select onchange="window._rfSel(\'dP\',this.value)">'+oP+'</select></label>';
  function weeks(cur,attr){
    var t='';
    // « Du » montre le premier jour employe, « Au » le DERNIER : afficher o0 des
    // deux cotes faisait lire « du 23 au 30 aout » pour un renfort qui travaille
    // en realite jusqu'au 5 septembre.
    var fin=(attr!=='Du');
    for(var k=0;k<n;k++) t+='<option value="'+k+'"'+(k===cur?' selected':'')+'>'+_pilFmtD(_rfIso(fin?ctx.W[k].o1:ctx.W[k].o0))+'</option>';
    return '<label class="rf-f"><span>'+attr+'</span><select onchange="window._rfSel(\''+(attr==='Du'?'a':'b')+'\',this.value)"'+(s.R>0?'':' disabled')+'>'+t+'</select></label>';
  }
  return '<div class="rf-sel">'+selP+selR+weeks(Math.min(s.a,n-1),'Du')+weeks(Math.min(s.b,n-1),'Au')
    +'<span class="rf-selinfo">'
    +(Math.abs(ctx.dP)>0.01?('socle simul\u00e9 <b>'+_ecoH1(ctx.headMoy)+'</b> au lieu de '+_ecoH1(ctx.headMesMoy)+' \u00b7 '):'')
    +(s.R>0?(_pilNum((Math.min(s.b,n-1)-Math.min(s.a,n-1)+1))+' semaine'+((s.b-s.a)>0?'s':'')+' \u00b7 '+_pilNum(s.R*(Math.min(s.b,n-1)-Math.min(s.a,n-1)+1))+' semaine-renfort'):'\u00e9quipe permanente seule')
    +'</span></div>';
}

function _rfBody(d){
  var P=_rfPair(d), ctxP=P.plan, ctx=P.dec;
  if(!ctxP) return '<div class="pil-empty">Renseignez les dates de d\u00e9but et de fin de la p\u00e9riode (R\u00e9glages \u203a Campagne) : les fen\u00eatres de t\u00e2ches et la charge en d\u00e9coulent.</div>';
  if(ctxP.noRate) return '<div class="pil-empty">Renseignez un <b>taux horaire</b> dans la fiche de chaque salari\u00e9 (R\u00e9glages \u203a \u00c9quipe) pour chiffrer les sc\u00e9narios.</div>';
  // Deux graphes seulement s'ils racontent deux choses differentes : avant le
  // debut de la campagne, « ce qu'il reste » EST « le plan ».
  var deux=(ctx!==ctxP) && (ctx.nSkip>0 || (ctxP.charge-ctx.charge)>0.5);
  var n=ctx.W.length;
  if(_RF_SEL.b>=n) _RF_SEL.b=n-1;
  if(_RF_SEL.a>=n) _RF_SEL.a=0;
  var res=_rfSim(ctx,_rfProf(ctx,_RF_SEL));
  var strs=_rfStrategies(ctx);
  var tab=_rfTable(ctx,res,strs);
  var real=(typeof _pilTaskReal==='function')?_pilTaskReal(ctxP.cd,d):null;
  var fait=Math.max(0,ctxP.charge-ctx.charge);

  var kpi='<div class="pil-ck"><div class="kl">Socle permanent'+(deux?' restant':'')+'</div><div class="kv">'+_ecoEur(ctx.socle)+'</div>'
      +'<div class="ks">\u2248 '+_ecoH1(ctx.headMoy)+' pr\u00e9sents en moyenne'
      +(Math.abs(ctx.dP)>0.01?(' <b style="color:#B85A1A">('+(ctx.dP>0?'+':'')+_ecoH1(ctx.dP)+' simul\u00e9, mesur\u00e9 '+_ecoH1(ctx.headMesMoy)+')</b>'):'')
      +(ctx.trac.etp>0.01?(' \u00b7 '+_ecoH1(ctx.trac.etp)+' au tracteur'+(ctx.trac.mesure?' (mesur\u00e9)':' (forc\u00e9)')):'')+'</div></div>'
    +'<div class="pil-ck"><div class="kl">Ce qui manque</div><div class="kv" style="color:'+(ctx.manque>0?'#9B2D1F':'#3D6B27')+'">'
      +(ctx.manque>0?(_pilNum(ctx.manque)+'<span class="u"> h</span>'):'\u2014')+'</div>'
      +'<div class="ks">'+(ctx.manque>0
          ? ('pointe \u00e0 '+_ecoH1(ctx.renfortPic)+' renfort'+(ctx.renfortPic>1.5?'s':'')+' sur la semaine la plus tendue')
          : 'les permanents suffisent')+'</div></div>'
    +'<div class="pil-ck"><div class="kl">Pay\u00e9 sans travail ouvert</div><div class="kv" style="color:'+(res.inemploye>1?'#B85A1A':'#3D6B27')+'">'+_pilNum(res.inemploye)+'<span class="u"> h</span></div>'
      +'<div class="ks">'+(res.induit>1?(_pilNum(res.induit)+' h ajout\u00e9es par le retard \u00b7 '+res.horsDelai+' t\u00e2che'+(res.horsDelai>1?'s':'')+' hors d\u00e9lai'):'aucune heure ajout\u00e9e par le retard')+'</div></div>'
    +'<div class="pil-ck"><div class="kl">\u00c0 d\u00e9cider</div><div class="kv">'+_ecoEur(res.decide)+'</div>'
      +'<div class="ks">'+(res.pointe>0?(_pilNum(res.pointe)+' renfort'+(res.pointe>1?'s':'')):'aucun renfort')+'</div></div>';

  // Sur QUOI porte l'ecran. Dit en une phrase, en haut, avant tout chiffre.
  var perim;
  if(deux) perim='Cet \u00e9cran d\u00e9cide sur <b>ce qu\u2019il reste \u00e0 faire</b> \u00e0 partir d\u2019aujourd\u2019hui : <b>'+_pilNum(ctx.charge)+' h</b> sur les '+_pilNum(ctxP.charge)+' h de la campagne, '+_pilNum(fait)+' h d\u00e9j\u00e0 faites, <b>'+_pilNum(n)+' semaine'+(n>1?'s':'')+'</b> devant. Le plan complet de la campagne est plus bas, en \u00e9tape 4.';
  else if(P.fini) perim='La campagne est <b>termin\u00e9e</b> : l\u2019\u00e9cran montre le plan complet, pour m\u00e9moire.';
  else perim='La campagne <b>n\u2019a pas encore commenc\u00e9</b> : ce qu\u2019il reste \u00e0 faire, c\u2019est toute la campagne. Un seul graphique suffit.';

  var boutons=strs.map(function(s,i){
    return '<button class="rf-strat'+(s.best?' best':'')+'" onclick="window._rfAppliquer('+i+')">'+_pilEsc(s.nom)+'</button>';
  }).join('');

  var H='<div class="pil-cockpit-card" style="margin-bottom:12px"><div class="pil-cks">'+kpi+'</div></div>'
    +'<div class="rf-how">'+perim+'</div>';

  H+='<div class="rf-step"><div class="rf-n">1</div><div class="rf-t">Quand chaque travail peut se faire</div></div>'
    +'<div class="rf-how"><b>Comment lire.</b> Une ligne par travail, une barre par fen\u00eatre : du premier jour o\u00f9 il peut se faire au dernier jour o\u00f9 il devrait \u00eatre fini. '
    +'C\u2019est ce qui explique qu\u2019on ne puisse pas prendre d\u2019avance \u2014 l\u2019effeuillage ne se fait pas en avril, m\u00eame avec dix personnes disponibles.</div>'
    +'<div style="width:100%;overflow-x:auto" id="rf-g-frise"></div>';
  if(typeof _pilFriseSvg==='function') window._mvGraphSuivre('#rf-g-frise', function(lg){ return _pilFriseSvg(ctxP.cd,real,lg); });

  H+='<div class="rf-step"><div class="rf-n">2</div><div class="rf-t">'+(deux?'Ce qu\u2019il te reste \u00e0 faire, semaine par semaine':'Ton renfort, semaine par semaine')+'</div></div>'
    +'<div class="rf-how"><b>Comment lire.</b> '
    +(deux?'Le graphique d\u00e9marre <b>aujourd\u2019hui</b> : la zone gris\u00e9e \u00e0 gauche est d\u00e9j\u00e0 pass\u00e9e, et chaque travail ne compte plus que pour ce qu\u2019il en reste. ':'')
    +'<span class="rf-k" style="background:#5C8A3E"></span>Vert : les gens qui travaillent vraiment cette semaine-l\u00e0. '
    +'<span class="rf-k" style="background:#DCD6C6"></span>Hachur\u00e9 : les gens <b>pay\u00e9s sans travail ouvert</b>. '
    +'<span class="rf-k" style="background:#9B2D1F"></span>Rouge : le travail <b>en retard</b> \u2014 pas ce qui reste \u00e0 faire, mais ce qui aurait d\u00fb \u00eatre fini. '
    +'Il n\u2019appara\u00eet qu\u2019apr\u00e8s la date de fin d\u2019une t\u00e2che, et chaque semaine de plus la rend <b>'+_pilNum(ctx.c.k*100)+' % plus longue</b> \u2014 '
    +'sauf pour un travail <b>sans rattrapage</b> comme la vendange : pass\u00e9 la date, ce qui reste est perdu, pas report\u00e9. '
    +'<span class="rf-k" style="background:#2C3E50"></span>Bleu ardoise : les permanents partis au tracteur. '
    +'L\u2019\u00e9cart entre la ligne noire et le vert compte aussi les <b>cong\u00e9s, absences et fermetures d\u00e9j\u00e0 saisis au Planning</b> : ces heures sont pay\u00e9es, mais personne n\u2019est dans les rangs. '
    +'<span class="rf-k" style="background:#14110D"></span>La ligne noire, l\u2019effectif permanent <b>r\u00e9ellement pr\u00e9sent</b> \u2014 elle varie avec les contrats, c\u2019est la m\u00eame que la courbe de <b>Charge &amp; ETP</b>.<br>'
    +'<b>Choisis ton renfort dans les listes ci-dessous</b>, ou pars d\u2019une proposition.</div>'
    +_rfSelHtml(ctx)
    +'<div class="rf-strats">'+boutons+'</div>'
    +'<div style="width:100%;overflow-x:auto" id="rf-g-prof"></div>';
  window._mvGraphSuivre('#rf-g-prof', function(lg){ return _rfProfilSvg(ctx,res,_RF_SEL,{grisJusqu:(deux?ctx.oDep:null),axe:(deux?'\u00c0 FAIRE':'CAMPAGNE'),note:(ctx.charge<0.5?'plus rien \u00e0 faire d\u2019ici la fin de la p\u00e9riode':null)},lg); });

  // ETAPE 3 — L'ORDRE DES QUESTIONS EST LE SUJET. « Est-ce que ca tient » vient
  // AVANT « combien ca coute ». Un montant lisible se compare : place en tete,
  // il fait passer « aucun renfort » pour l'option economique alors qu'elle ne
  // finit rien a temps. Le cout ne se lit qu'une fois l'echeance tranchee.
  var nT=(ctx.tw||[]).length;
  var verdict;
  if(!res.deborde){
    verdict='<div style="background:var(--tag-green-bg,#EEF4E7);border-radius:12px;padding:13px 15px;margin:10px 0 4px">'
      +'<div style="font-size:15px;font-weight:600;color:var(--tag-green-tx,#3D6B27)">\u2713 Ta s\u00e9lection finit '
      +(nT>1?('les '+_pilNum(nT)+' travaux dans leur fen\u00eatre'):'le travail dans sa fen\u00eatre')+'.</div>'
      +'<div style="font-size:13px;color:var(--tag-green-tx,#3D6B27);margin-top:4px;line-height:1.5">Aucun d\u00e9bordement, aucun travail pouss\u00e9 sur le suivant.</div></div>';
  } else {
    // ⚠⚠ UNE RECOLTE NON RENTREE N'EST PAS UN RETARD. Elle passait dans la meme
    //   phrase (« rien n'est abandonne, +15 %/semaine ») et dans la meme colonne
    //   « +N sem. » : on lisait une impossibilite comme un delai negociable.
    var tete, corps;
    if(res.nPerdu>0){
      tete=_pilNum(res.nPerdu)+' travail'+(res.nPerdu>1?'x':'')+' ne peut'+(res.nPerdu>1?'vent':'')+' pas \u00eatre rattrap\u00e9'+(res.nPerdu>1?'s':'')+'.';
      corps='Ce qui n\u2019est pas fait avant la date limite est <b>perdu</b>, pas report\u00e9 : '
        +'<b>'+_pilNum(res.perdu)+' h</b> de travail ne se feront jamais. '
        +'Du renfort pos\u00e9 apr\u00e8s cette date n\u2019y change rien \u2014 il faut qu\u2019il tombe <b>dans la fen\u00eatre</b>.';
    } else if(res.horsDelai>0){
      tete=_pilNum(res.horsDelai)+' travail'+(res.horsDelai>1?'x':'')+' ne finit'+(res.horsDelai>1?'ssent':'')+' pas dans sa fen\u00eatre.';
      corps='Rien n\u2019est abandonn\u00e9 : ce qui d\u00e9borde pousse le travail suivant, et chaque semaine de retard le rend <b>'
        +_pilNum(ctx.c.k*100)+' % plus long</b>'+(res.induit>1?(' \u2014 '+_pilNum(res.induit)+' h ajout\u00e9es en tout'):'')+'.';
    } else {
      tete='Le travail d\u00e9borde de '+_pilNum(Math.max(1,res.finSem-ctx.W.length+1))+' semaine'+((res.finSem-ctx.W.length+1)>1?'s':'')+' sur la suite.';
      corps='Rien n\u2019est abandonn\u00e9 : ce qui d\u00e9borde mord sur la campagne suivante.';
    }
    verdict='<div style="background:var(--tag-red-bg,#FBEDEA);border-radius:12px;padding:13px 15px;margin:10px 0 4px">'
      +'<div style="font-size:15px;font-weight:600;color:#9B2D1F">\u26a0 '+tete+'</div>'
      +'<div style="font-size:13px;color:#9B2D1F;margin-top:4px;line-height:1.5">'+corps+'</div></div>'
      +_rfRetardHtml(ctx,res);
  }

  // La reponse a « comment finir dans les fenetres », donnee en clair plutot que
  // laissee a deduire d'une ligne de tableau.
  var conseil='';
  if(tab.mnRow && tab.mnRow.moi){
    conseil='<div class="rf-how" style="border-color:rgba(201,168,76,.55)"><b>Ta s\u00e9lection est d\u00e9j\u00e0 le meilleur placement trouv\u00e9.</b> '
      +'Aucune des autres strat\u00e9gies test\u00e9es ne tient les fen\u00eatres pour moins cher.</div>';
  } else if(tab.mnRow){
    var m=tab.mnRow, ec=(!res.deborde)?(res.decide-m.r.decide):0;
    conseil='<div class="rf-how" style="border-color:rgba(201,168,76,.55)">'
      +'<b>Le plus petit renfort qui y arrive.</b> '+_pilEsc(m.nom)
      +(m.detail?(' \u2014 '+_pilEsc(m.detail)):'')+' : <b>'+_pilNum(m.r.capRenf)+' h</b> de renfort'
      +(ec>1?(', soit <b>'+_ecoEur(ec)+'</b> de moins que ta s\u00e9lection'):'')
      +'. Le bouton est dans la liste des propositions, \u00e9tape 2.</div>';
  }

  H+='<div class="rf-step"><div class="rf-n">3</div><div class="rf-t">Est-ce que \u00e7a tient dans les fen\u00eatres ?</div></div>'
    +_rfBesoinHtml(ctx)+verdict+conseil;

  H+='<div class="rf-step" style="margin-top:18px"><div class="rf-n">4</div><div class="rf-t">Ce que ce choix co\u00fbte</div></div>'
    +'<div class="rf-how"><b>Comment lire.</b> Le co\u00fbt ne se lit qu\u2019une fois l\u2019\u00e9ch\u00e9ance tranch\u00e9e : les strat\u00e9gies qui tiennent les fen\u00eatres sont en haut du tableau, celles qui d\u00e9bordent en dessous du trait rouge. '
    +'Ces derni\u00e8res sont souvent les moins ch\u00e8res sur le papier \u2014 elles ne r\u00e9pondent simplement pas \u00e0 la m\u00eame question. '
    +'La barre ne montre que ce que tu d\u00e9cides : le socle des permanents est le m\u00eame partout, il ne peut pas les d\u00e9partager.</div>'
    +'<div style="width:100%;overflow-x:auto" id="rf-g-cout"></div>'
    +tab.html;
  window._mvGraphSuivre('#rf-g-cout', function(lg){ return _rfCoutSvg(ctx,res,tab.meilleur,lg); });

  // ── Etape 4 : le PLAN. Meme graphique, meme axe, mais la campagne entiere et
  //    la charge theorique. Repere de dimensionnement, jamais la decision — d'ou
  //    sa place APRES le cout, et l'absence de selecteur.
  if(deux){
    var resP=_rfSim(ctxP,_rfProf(ctxP,{R:0,a:0,b:0}));
    window._mvGraphSuivre('#rf-g-prof0', function(lg){ return _rfProfilSvg(ctxP,resP,null,{note:'le plan de d\u00e9part, avec l\u2019\u00e9quipe permanente seule',axe:'CAMPAGNE ENTI\u00c8RE'},lg); });
    H+='<div class="rf-step"><div class="rf-n">5</div><div class="rf-t">Le plan de d\u00e9part \u2014 toute la campagne</div></div>'
      +'<div class="rf-how"><b>Comment lire.</b> Le m\u00eame graphique, mais sur la campagne <b>enti\u00e8re</b> et avec la charge <b>th\u00e9orique</b> : ce que le bar\u00e8me demandait au d\u00e9part, sans rien d\u00e9duire de ce qui est fait. '
      +'C\u2019est un rep\u00e8re de dimensionnement \u2014 utile en d\u00e9but de campagne, et pour pr\u00e9parer la suivante. <b>La d\u00e9cision, elle, se prend en \u00e9tape 2</b>, sur ce qu\u2019il reste.</div>'
      +'<div style="width:100%;overflow-x:auto" id="rf-g-prof0"></div>'
      +'<div class="rf-how">Sur la campagne enti\u00e8re : <b>'+_pilNum(ctxP.charge)+' h</b> de travail pour <b>'+_pilNum(ctxP.capDispo)+' h</b> de capacit\u00e9 disponible (permanents pr\u00e9sents, tracteur d\u00e9duit). '
      +(ctxP.manque>0?('Il en manquait <b style="color:#9B2D1F">'+_pilNum(ctxP.manque)+' h</b>, soit au moins <b>'+_ecoH1(ctxP.renfortMini)+'</b> renfort sur toute la p\u00e9riode.'):'Les permanents suffisaient sur le papier.')
      +' Sans aucun renfort, l\u2019\u00e9quipe seule laissait <b>'+_pilNum(resP.inemploye)+' h</b> pay\u00e9es sans travail ouvert.</div>';
  }

  H+='<div class="rf-lim"><b>Ce que le mod\u00e8le suppose.</b> Le travail finit par se faire, m\u00eame apr\u00e8s la campagne : une strat\u00e9gie qui d\u00e9borde mord sur la suivante, et ce report n\u2019est pas chiffr\u00e9. '
    +'<b>Sauf les travaux sans rattrapage</b> \u2014 la vendange \u2014 o\u00f9 ce qui n\u2019est pas fait dans la fen\u00eatre est perdu : les heures perdues sont compt\u00e9es, la valeur de la r\u00e9colte non rentr\u00e9e ne l\u2019est pas, volontairement. '
    +'Les heures induites par le retard, elles, le sont. '
    +'Les fen\u00eatres viennent des dates que tu as saisies ; ce qui est d\u00e9j\u00e0 fait vient de l\u2019avancement r\u00e9el des parcelles. Le hachur\u00e9 ne compte que le travail de vigne : le tracteur est d\u00e9duit, la cave et l\u2019entretien ne le sont pas encore. '
    +'Ces r\u00e9glages se modifient dans <b>Pilotage \u203a Outils \u203a Param\u00e9trage</b>. Rien n\u2019est enregistr\u00e9 ici.</div>';
  return H;
}

function _pilPanelRenfort(d){
  _RF_D=d;
  var ctx=_rfPair(d).dec, stat=_pilStat('\u2014','');
  if(ctx && !ctx.noRate){
    var r=_rfSim(ctx,_rfProf(ctx,_RF_SEL));
    stat=_pilStat(r.pointe,' renfort'+(r.pointe>1?'s':'')+' \u00b7 '+_ecoEur(r.decide));
  }
  return _pilTile('renfort','\uD83D\uDC65','#C9A84C','Renfort \u2014 combien, et quand', stat,
    'ce qu\u2019il reste \u00e0 faire, et ce que le moment change', null,
    '<div id="pil-rf-body">'+_rfBody(d)+'</div>');
}

// Interactions (onclick/onchange inline -> exposees sur window).
window._rfSel = function(champ,val){
  // ⚠ La saisie libre passe par openPrompt : prompt() natif ne rend RIEN en PWA
  //   iOS, et c'est justement l'appareil du chef de culture pendant la vendange.
  if(champ==='R' && String(val)==='__autre'){ window._rfSelAutre(); return; }
  var v=parseInt(val,10); if(!isFinite(v)) return;
  if(champ==='dP'){ _RF_SEL.dP=parseFloat(val)||0; _rfRefresh(); return; }
  if(champ==='R'){ _RF_SEL.R=Math.max(0,v); }
  else if(champ==='a'){ _RF_SEL.a=v; if(_RF_SEL.b<v) _RF_SEL.b=v; }
  else if(champ==='b'){ _RF_SEL.b=v; if(_RF_SEL.a>v) _RF_SEL.a=v; }
  _rfRefresh();
};
window._rfSelAutre = function(){
  if(typeof window.openPrompt!=='function'){
    if(typeof showToast==='function') showToast('Saisie indisponible','#B85A1A');
    _rfRefresh(); return;
  }
  window.openPrompt({
    titre:'Combien de renforts ?', icone:'\uD83D\uDC65', unite:'pers.', type:'nombre',
    sub:'Jusqu\u2019\u00e0 '+_RF_RMAX_DUR+' personnes \u2014 une vendange manuelle en demande souvent 30 \u00e0 50.',
    valeur:String(_RF_SEL.R||0), btnLabel:'Appliquer',
    cb:function(v){
      var x=Math.round(parseFloat(String(v).replace(',','.'))||0);
      _RF_SEL.R=Math.max(0,Math.min(_RF_RMAX_DUR,x));
      _rfRefresh();
    }
  });
  // Le <select> est reste sur « autre nombre… » : on le remet a sa valeur tout
  // de suite, pour que fermer la saisie sans valider ne laisse pas un champ
  // qui affiche autre chose que ce que le calcul utilise.
  _rfRefresh();
};
window._rfAppliquer = function(i){
  // ⚠ MEME contexte que _rfBody, sinon les index « Du / Au » designent d'autres
  //   semaines. Et dP est CONSERVE : le laisser tomber le remettait a undefined,
  //   ce qui decochait TOUTES les options du selecteur « Permanents » -> le
  //   navigateur affichait la premiere (-2) alors que le calcul, lui, tournait a 0.
  var ctx=_rfPair(_RF_D).dec; if(!ctx||ctx.noRate) return;
  var s=_rfStrategies(ctx)[i];
  if(s&&s.sel) _RF_SEL={R:s.sel.R,a:s.sel.a,b:s.sel.b,dP:(_RF_SEL&&_RF_SEL.dP)||0};
  _rfRefresh();
};
function _rfRefresh(){
  var host=document.getElementById('pil-rf-body');
  if(host && _RF_D){
    host.innerHTML=_rfBody(_RF_D);
    // Le simulateur se reconstruit a chaque interaction, hors du chemin de
    // _pilFillContent : il repeint donc ses graphes lui-meme.
    if(window._mvGraphRepeindre) window._mvGraphRepeindre();
  }
}

function _pilTabSim(d){
  var H='<div class="pil-panels">';
  if(_pilShow('sim_ordre')) H+=_pilPanelOrdrePassage(d);
  if(_pilShow('sim_etsi')) H+=_pilPanelSimulateur(d);
  if(_pilShow('sim_cout')) H+=_pilPanelRenfort(d);

  H+='</div>';
  return H;
}



// ════════════════════════════════════════════════════════════════════
// REFONTE — navigation par onglets + cockpit décisionnel (Aujourd'hui)
// ════════════════════════════════════════════════════════════════════

// ── Date objectif de fin des travaux (PAR SAISON → CONFIG.objectifs_fin) ──
function _pilSaisonNom(){ var sa=(typeof window._pilSaison==='function')?window._pilSaison():null; return sa?(sa.nom||''):''; }
function _pilObjectifGet(){
  var nom=_pilSaisonNom();
  var o=(window.CONFIG&&window.CONFIG.objectifs_fin)||{};
  if(nom && o[nom]) return o[nom];
  var cd=(window._chargeSaisonData&&window.getSaisonActive)?window._chargeSaisonData(window._pilSaison()):null;
  if(cd&&cd.fin) return cd.fin;
  return null;
}
function _pilObjectifSet(iso){
  if(!window.CONFIG) return false;
  if(!(typeof window.isAdmin==='function'&&window.isAdmin())) return false;
  var nom=_pilSaisonNom(); if(!nom) return false;
  if(!window.CONFIG.objectifs_fin) window.CONFIG.objectifs_fin={};
  window.CONFIG.objectifs_fin[nom]=iso;
  try{ if(typeof window.saveData==='function') window.saveData('config'); }catch(e){}
  return true;
}

// ── Jours ouvrés : objet Date + différence signée ──
function _pilWdDateObj(n,from,chantier){
  var dt=from?new Date(from):new Date(); if(n==null) return dt;
  var added=0, guard=0;
  while(added<n && guard<4000){ guard++; dt.setDate(dt.getDate()+1); var wd=dt.getDay(); if(chantier||(wd!==0&&wd!==6)) added++; }
  return dt;
}
function _pilWdBetween(a,b){
  var d=new Date(a), end=new Date(b); d.setHours(0,0,0,0); end.setHours(0,0,0,0);
  if(d.getTime()===end.getTime()) return 0;
  var sign=end>d?1:-1, n=0, guard=0;
  while(d.getTime()!==end.getTime() && guard<4000){ guard++; d.setDate(d.getDate()+sign); var wd=d.getDay(); if(wd!==0&&wd!==6) n+=sign; }
  return n;
}
function _pilDfrObj(dt){ var M=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'], J=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.']; return J[dt.getDay()]+' '+dt.getDate()+' '+M[dt.getMonth()]; }
function _pilEtpFmt(v){ return (Math.round((Number(v)||0)*10)/10).toString().replace('.',','); }

// ── Marge : projection (cadence réelle) vs objectif ──
function _pilMargeCalc(d){
  var c=_pilEchCadence(d), cadH=c.cadH;
  var charge=d.totalReste||0;
  var seasonJ=(cadH>0)?Math.ceil(charge/cadH):null;
  // DEPART DE LA PROJECTION : on ne peut pas commencer avant l'ouverture de la
  // fenetre. Projeter depuis le jour de consultation affichait « +4 j d'avance »
  // un 26 juillet, sur une vendange qui ne demarre pas avant le 26 aout.
  var sa=(typeof window._pilSaison==='function')?window._pilSaison():null;
  var noms=(typeof window.getTachesSaison==='function')?window.getTachesSaison().map(function(t){return t.nom;}):[];
  var fen=(typeof window._mvFenetre==='function')?window._mvFenetre(sa,noms):null;
  var start=new Date(); start.setHours(0,0,0,0);
  if(fen&&fen.debut){ var _fd=new Date(fen.debut+'T00:00:00'); if(_fd>start) start=_fd; }
  var proj=(seasonJ!=null)?_pilWdDateObj(seasonJ,start,!!(fen&&fen.chantier)):null;
  var objIso=_pilObjectifGet();
  var obj=objIso?new Date(objIso+'T00:00:00'):null;
  var marge=(proj&&obj)?_pilWdBetween(proj,obj):null;
  return { cadH:cadH, estim:c.estim, seasonJ:seasonJ, proj:proj, objIso:objIso, obj:obj, marge:marge, fen:fen, start:start };
}

// ── Frise de saison : aujourd'hui → objectif, fin prévue + marge ──
function _pilCockpitTimeline(m){
  if(!m.proj||!m.obj) return '';
  var today=new Date(); today.setHours(0,0,0,0);
  var T0=today.getTime(), endMs=Math.max(m.obj.getTime(),m.proj.getTime());
  var span=endMs-T0; if(span<=0) span=86400000;
  var buf=span*0.08+86400000*2, T1=endMs+buf;
  function fr(t){ return Math.max(0,Math.min(1,(t-T0)/(T1-T0))); }
  var fP=fr(m.proj.getTime()), fO=fr(m.obj.getTime());
  var lo=Math.min(fP,fO)*100, hi=Math.max(fP,fO)*100, over=(m.marge!=null&&m.marge<0);
  return '<div class="pil-tl-wrap"><div class="pil-tl">'
    +'<div class="pil-tl-marge'+(over?' over':'')+'" style="left:'+lo.toFixed(1)+'%;right:'+(100-hi).toFixed(1)+'%"></div>'
    +'<div class="pil-tl-mk pil-tl-today" style="left:0"><span class="cap">Auj.</span><span class="cap bot">'+_pilDfrObj(today)+'</span></div>'
    +'<div class="pil-tl-mk pil-tl-proj" style="left:'+(fP*100).toFixed(1)+'%"><span class="cap">Fin prévue</span></div>'
    +'<div class="pil-tl-mk pil-tl-obj" style="left:'+(fO*100).toFixed(1)+'%"><span class="cap">Objectif</span></div>'
    +'</div></div>';
}

// ── Mini-KPI du cockpit ──
// L'argent manquait a l'ecran qu'on ouvre le matin : le cockpit disait le TEMPS
// (marge, charge, cadence, effectif) et rien du budget. Une seule tuile suffit,
// celle qui porte la DERIVE — l'ecart entre ce qui est depense et ce qui est fait.
// C'est le seul chiffre economique qui appelle une decision le jour meme.
function _pilCkBudget(){
  var E=_pecData();
  if(!E.configured) return '<div class="pil-ck"><div class="kl">Budget consomm\u00e9</div><div class="kv">\u2014</div>'
    +'<div class="ks">taux horaire \u00e0 renseigner (R\u00e9glages \u203A \u00c9quipe)</div></div>';
  var ec=E.cad.ok?E.cad.ecart:null;
  var col = (ec===null)?'var(--texte)' : (ec>15?'var(--rouge)' : (ec>5?'var(--orange)' : 'var(--vert-med)'));
  return '<div class="pil-ck"><div class="kl">Budget consomm\u00e9</div>'
    +'<div class="kv" style="color:'+col+'">'+Math.round(E.cons)+'<span class="u"> %</span></div>'
    +'<div class="ks">'+(ec===null
        ? ('de '+_ecoEur(E.budget)+' \u00b7 '+Math.round(E.avc)+' % du travail fait')
        : ('cadence <b style="color:'+col+'">'+(ec>0?'+':'')+Math.round(ec)+' %</b> vs bar\u00e8me \u00b7 fin \u2248 '+_pecEurK(E.projFin)))+'</div></div>';
}
function _pilCkEtp(d){
  var cd=(window._chargeSaisonData&&window.getSaisonActive)?window._chargeSaisonData(window._pilSaison()):null;
  var present=d.presentChamp!=null?d.presentChamp:0;
  var req=(cd&&cd.peakReq!=null&&cd.peakReq>0)?cd.peakReq:null;
  var low=(req!=null && present<req-0.05);
  var reqTxt=(req!=null)?(' / '+_pilEtpFmt(req)+' ETP'):'';
  return '<div class="pil-ck"><div class="kl">Effectif</div><div class="kv">'+present+'<span class="u">'+reqTxt+'</span></div>'
    +'<div class="ks"'+(low?' style="color:var(--orange);font-weight:600"':'')+'>'+(req==null?'à la vigne aujourd\'hui':(low?'sous-effectif au pic':'capacité suffisante au pic'))+'</div></div>';
}
function _pilCkJours(){
  var days=_pilTreatDays();
  var n=(days&&days.length)?days.filter(function(x){return x.start!=null;}).length:null;
  var tot=(days&&days.length)?days.length:5;
  return '<div class="pil-ck"><div class="kl">Jours favorables</div><div class="kv">'+(n!=null?n:'—')+'<span class="u"> / '+tot+' j</span></div><div class="ks">fenêtres de traitement à venir</div></div>';
}

// ── Tuiles « décision du jour » ──
function _pilCkPres(d){
  var ind=(d.presences||[]).filter(function(p){ return !p.bureau && p.etat!=='present'; });
  var chips=ind.slice(0,4).map(function(p){
    var lab=p.etat==='cp'?'\u2600\uFE0F '+p.nom+' · CP':p.etat==='recup'?'\u21BA '+p.nom+' · récup':p.etat==='maladie'?'\uD83E\uDD12 '+p.nom:'\u2715 '+p.nom;
    var bg=p.etat==='cp'?'var(--orange-pale)':p.etat==='recup'?'rgba(123,109,184,.14)':'var(--rouge-pale)';
    var col=p.etat==='cp'?'var(--orange)':p.etat==='recup'?'#7B6DB8':'var(--rouge)';
    return '<span class="pil-chip2" style="background:'+bg+';color:'+col+'">'+_pilEsc(lab)+'</span>';
  }).join('');
  var tot=(d.presences||[]).filter(function(p){return !p.bureau;}).length, pc=d.presentChamp||0;
  return '<div class="pil-tile2"><div class="pil-t2h"><span class="ic">'+_pilIco('users')+'</span><span class="t">À la vigne aujourd\'hui</span></div>'
    +'<div class="pil-t2b"><div class="pil-big green">'+pc+' présent'+(pc>1?'s':'')+'</div>'
    +'<div class="pil-t2s">sur '+tot+(ind.length?' · '+ind.length+' indisponible'+(ind.length>1?'s':''):' · équipe au complet')+'</div>'
    +(chips?'<div style="margin-top:7px">'+chips+'</div>':'')+'</div></div>';
}
function _pilCkTraiter(){
  var days=_pilTreatDays(), big, bigCol, body;
  if(days===undefined){ big='—'; bigCol='var(--texte-doux)'; body='<div class="pil-t2s">prévisions horaires indisponibles</div>'; }
  else {
    var tj=(days||[]).filter(function(x){ return /aujourd/i.test(x.label); })[0] || (days&&days[0]);
    if(tj&&tj.start!=null){
      big='Oui — '+tj.start+'h \u2192 '+tj.end+'h'; bigCol='var(--vert-med)';
      var risk=tj.leach||(tj.ppMax!=null&&tj.ppMax>=PIL_TREAT_PP_ALERT);
      body='<div class="pil-t2s">sec · '+tj.wMax+' km/h · '+tj.tMax+'° · meilleure fenêtre du jour</div>'
        +(risk?'<div class="pil-t2s" style="color:var(--orange);margin-top:5px">\u26A0 pluie ensuite — risque de lessivage</div>':'');
    } else {
      big='Pas aujourd\'hui'; bigCol='var(--orange)';
      body='<div class="pil-t2s">'+(tj?('aucune fenêtre · '+tj.reason):'aucune fenêtre claire')+'</div>';
      var nxt=(days||[]).filter(function(x){ return x.start!=null; })[0];
      if(nxt) body+='<div class="pil-t2s" style="margin-top:5px;color:var(--vert-med)">prochaine : '+nxt.label+' '+nxt.start+'h\u2192'+nxt.end+'h</div>';
    }
  }
  return '<div class="pil-tile2"><div class="pil-t2h"><span class="ic">'+_pilIco('drop')+'</span><span class="t">Traiter ?</span></div>'
    +'<div class="pil-t2b"><div class="pil-big" style="color:'+bigCol+'">'+big+'</div>'+body+'</div></div>';
}
function _pilCkPrio(d){
  var p=d.prio;
  if(!p) return '<div class="pil-tile2"><div class="pil-t2h"><span class="ic">'+_pilIco('target')+'</span><span class="t">Tâche prioritaire</span></div><div class="pil-t2b"><div class="pil-t2s">aucune tâche en cours</div></div></div>';
  var emo=(window.TEMOJI&&window.TEMOJI[p.nom])?window.TEMOJI[p.nom]+' ':'', col=_pilPctColor(p.pct||0);
  return '<div class="pil-tile2"><div class="pil-t2h"><span class="ic">'+_pilIco('target')+'</span><span class="t">Tâche prioritaire</span></div>'
    +'<div class="pil-t2b"><div class="pil-big">'+emo+_pilEsc(_pilTnom(p.nom))+'</div>'
    +'<div class="pil-t2s">'+_pilNum(p.h_reste)+' h restantes · <b style="color:var(--or)">pôle long</b></div>'
    +'<div class="pil-gbar"><i style="width:'+Math.min(p.pct||0,100)+'%;background:'+col+'"></i></div>'
    +'<div class="pil-t2s" style="margin-top:5px">'+(p.pct||0)+'% fait</div></div></div>';
}
function _pilCkAlertes(d){
  var al=[];
  var minRev=null, minRevNom=null;
  (d.tracs||[]).forEach(function(t){ if(t.revReste!=null && (minRev==null||t.revReste<minRev)){ minRev=t.revReste; minRevNom=t.nom; } });
  if(minRev!=null && minRev<=120) al.push(['amb','Révision <b>'+_pilEsc(minRevNom)+'</b> dans '+_pilNum(minRev)+' h','à planifier']);
  (d.tracs||[]).forEach(function(t){ if(t.rep) al.push(['red','<b>'+_pilEsc(t.nom)+'</b> immobilisé'+(t.rep.motif?' — '+_pilEsc(t.rep.motif):''), t.rep.prevu_retour?('retour '+_pilDfr(t.rep.prevu_retour)):'chez le réparateur']); });
  if(d.gnr&&d.gnr.capacite){ var niv=Number(d.gnr.niveau)||0, pc=Math.round(niv/(Number(d.gnr.capacite)||1)*100); if(niv<=(Number(d.gnr.seuil)||0)) al.push(['red','Cuve GNR à <b>'+pc+' %</b> · '+_pilNum(niv)+' L','plein à prévoir']); }
  var alerteN=d.ouAlerte||14;
  (d.cuvees||[]).forEach(function(c){ if(c.last_ouillage){ var ds=_pilDaysSince(c.last_ouillage); if(ds>alerteN) al.push(['amb','Ouillage <b>'+_pilEsc((c.nom||'Cuvée')+(c.millesime?' '+c.millesime:''))+'</b> en retard','+'+(ds-alerteN)+' j']); } });
  var inner;
  if(!al.length){ inner='<div class="pil-alert"><span class="pt ok"></span><span>Rien à signaler — parc, GNR et cave à jour</span></div>'; }
  else { inner=al.slice(0,8).map(function(a){ return '<div class="pil-alert"><span class="pt '+a[0]+'"></span><span>'+a[1]+'</span>'+(a[2]?'<span class="when">'+_pilEsc(a[2])+'</span>':'')+'</div>'; }).join(''); }
  return '<div class="pil-tile2 pil-alertcard"><div class="pil-alerts">'+inner+'</div></div>';
}

// ── Onglet AUJOURD'HUI (cockpit) ──
function _pilTabAuj(d){
  var m=_pilMargeCalc(d), admin=(typeof window.isAdmin==='function')&&window.isAdmin(), H='';
  var cockpit='';
  if(_pilShow('auj_marge')){
    var ringPc=d.gaugePct, C=2*Math.PI*74, dash=(ringPc/100*C);
    var vBig, vCol, badgeCls, badgeTxt;
    if(m.marge==null){ vBig='—'; vCol='var(--texte-doux)'; badgeCls='b-warn'; badgeTxt='\u25CF cadence indispo'; }
    else if(m.marge>1){ vBig='+'+m.marge+' j d\'avance'; vCol='var(--vert-med)'; badgeCls='b-ok'; badgeTxt='\u25CF dans les temps'; }
    else if(m.marge>=0){ vBig=(m.marge===0?'pile dans les temps':'+'+m.marge+' j'); vCol='var(--vert-med)'; badgeCls='b-warn'; badgeTxt='\u25CF juste'; }
    else { vBig=m.marge+' j de retard'; vCol='var(--rouge)'; badgeCls='b-bad'; badgeTxt='\u25CF à accélérer'; }
    cockpit+='<div class="pil-hero">'
      +'<div class="pil-ring"><svg width="168" height="168" viewBox="0 0 168 168"><circle cx="84" cy="84" r="74" fill="none" stroke="var(--gris-clair)" stroke-width="7"/><circle cx="84" cy="84" r="74" fill="none" stroke="'+_pilPctColor(ringPc)+'" stroke-width="7" stroke-linecap="round" stroke-dasharray="'+dash.toFixed(1)+' '+C.toFixed(1)+'" transform="rotate(-90 84 84)"/></svg>'
      +'<div class="pil-ring-mid"><div class="pc">'+ringPc+'%</div><div class="lb">saison faite</div></div></div>'
      +'<div class="pil-verdict"><div class="vk">Marge sur ton objectif</div>'
      +'<span class="pil-badge '+badgeCls+'">'+badgeTxt+'</span>'
      +'<div class="vbig" style="color:'+vCol+'">'+vBig+'</div>'
      +'<div class="vsub">'+(m.proj?('À la cadence actuelle (~'+Math.round(m.cadH)+' h/j'+(m.estim?' estim.':' · 4 sem.')+'), fin le <b>'+_pilDfrObj(m.proj)+'</b>.'):'Cadence indisponible — renseigne le planning (4 dernières semaines).')+'</div>'
      +'<div class="pil-obj"><span class="ol">Objectif \u00b7 tout fini pour le</span>'
      +'<input type="date" id="pil-obj-date" value="'+(m.objIso||'')+'"'+(admin?'':' disabled')+'>'
      +'<span class="pil-obj-hint">'+(admin?'':'\uD83D\uDD12 admin')+'</span></div>'
      +'</div></div>';
    cockpit+=_pilCockpitTimeline(m);
  }
  var kpis='';
  if(_pilShow('auj_charge')) kpis+='<div class="pil-ck"><div class="kl">Charge restante</div><div class="kv">'+_pilNum(d.totalReste)+'<span class="u"> h</span></div><div class="ks">'+(m.seasonJ!=null?('\u2248 '+m.seasonJ+' j ouvrés à la cadence'):'cadence indisponible')+'</div></div>';
  if(_pilShow('auj_cadence')) kpis+='<div class="pil-ck"><div class="kl">Cadence équipe</div><div class="kv">'+(m.cadH>0?Math.round(m.cadH):'—')+'<span class="u"> h/j</span></div><div class="ks">'+(m.estim?'estimée (effectif)':'réelle · 4 dern. sem.')+'</div></div>';
  if(_pilShow('auj_budget')) kpis+=_pilCkBudget();
  if(_pilShow('auj_etp')) kpis+=_pilCkEtp(d);
  if(_pilShow('auj_jours')) kpis+=_pilCkJours();
  if(kpis) cockpit+='<div class="pil-cks">'+kpis+'</div>';
  if(cockpit) H+='<div class="pil-cockpit-card">'+cockpit+'</div>';
  var dec='';
  if(_pilShow('auj_pres')) dec+=_pilCkPres(d);
  if(_pilShow('auj_traiter')) dec+=_pilCkTraiter();
  if(_pilShow('auj_prio')) dec+=_pilCkPrio(d);
  if(dec) H+='<div class="pil-sec-h">La décision du jour</div><div class="pil-dec">'+dec+'</div>';
  if(_pilShow('auj_alertes')) H+='<div class="pil-sec-h">Alertes matériel &amp; cave</div>'+_pilCkAlertes(d);
  return H || '<div class="pil-empty">Aucun indicateur affiché — active-les via « Choisir les indicateurs ».</div>';
}

// ── Onglet AVANCEMENT ──
function _pilTabAvc(d){
  var H='';
  if(_pilShow('avc_gauge')) H+='<div class="pil-gauge" id="pil-gauge"></div>';
  var charts='';
  if(_pilShow('avc_bar')) charts+='<div class="pil-panel"><div class="pil-panel-h"><div class="pil-panel-t">Avancement par tâche</div><div class="pil-seg" id="pil-bar-seg"><button data-b="saison" class="on">Cette saison</button><button data-b="cmp">Comparatif N-1</button></div></div><div class="pil-bar" id="pil-bar"></div></div>';
  if(_pilShow('avc_pie')) charts+='<div class="pil-panel"><div class="pil-panel-h"><div class="pil-panel-t" id="pil-pie-title">Charge restante</div><div class="pil-seg" id="pil-pie-seg"><button data-m="reste" class="on">Restante</button><button data-m="fait">Réalisé</button><button data-m="plan">Planifié</button></div></div><div class="pil-pie-wrap"><div class="pil-donut" id="pil-donut"></div><div class="pil-pie-legend" id="pil-pie-legend"></div></div></div>';
  if(charts) H+='<div class="pil-charts">'+charts+'</div>';
  var panels='';
  if(_pilShow('avc_echeances')) panels+=_pilPanelEcheances(d);
  if(_pilShow('avc_carte')) panels+=_pilPanelCarte(d);
  // « Charge & ETP » reste ICI. Deplace vers Decider au lot 3, il y faisait
  // DOUBLON : _pilPanelRenfort trace deja la meme frise _pilFriseSvg, et son
  // profil hebdo dit la meme chose que _pilDemandSvg. Chacun sa question :
  // Avancement montre le REEL (suis-je en sous-effectif cette annee ?),
  // Decider montre le PROSPECTIF (et si j'etais N ?).
  if(_pilShow('avc_etp')) panels+=_pilPanelEtp(d);

  if(panels) H+='<div class="pil-panels">'+panels+'</div>';
  return H || '<div class="pil-empty">Aucun indicateur affiché.</div>';
}

// ── Onglet PERSONNEL ──
function _pilPanelCapacite(d){
  var cd=(window._chargeSaisonData&&window.getSaisonActive)?window._chargeSaisonData(window._pilSaison()):null;
  var present=d.presentChamp!=null?d.presentChamp:0;
  if(!cd){ return _pilTile('capacite','\u2696\uFE0F','#C9A84C','Capacité vs charge', _pilStat(present,' à la vigne'), null, null, '<div class="pil-empty">Renseigne les dates de la saison (Réglages \u203A Saisons) pour estimer l\'ETP requis.</div>'); }
  var MN=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  var req=cd.peakReq||0, manque=Math.max(0,req-present), pPres=req>0?Math.min(present/req*100,100):100;
  var body='<div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:3px"><span>Effectif présent à la vigne</span><b>'+present+' ETP</b></div>'
    +'<div class="pil-gbar"><i style="width:'+pPres.toFixed(0)+'%;background:var(--vert-med)"></i></div>'
    +'<div style="display:flex;justify-content:space-between;font-size:12.5px;margin:11px 0 3px"><span>ETP requis au pic'+(cd.peakMonth!=null?' ('+MN[cd.peakMonth]+')':'')+'</span><b style="color:var(--orange)">'+_pilEtpFmt(req)+' ETP</b></div>'
    +'<div class="pil-gbar"><i style="width:100%;background:var(--orange)"></i></div>'
    +'<div class="pil-li-s" style="margin-top:10px">'+(manque>0.1?('Manque \u2248 <b style="color:var(--orange)">'+_pilEtpFmt(manque)+' ETP</b> au pic de charge. Options : renfort saisonnier, décaler une tâche, ou repousser l\'objectif (voir Simulateur).'):'Effectif suffisant pour le pic de charge de la saison.')+'</div>';
  return _pilTile('capacite','\u2696\uFE0F','#C9A84C','Capacité vs charge', _pilStat(_pilEtpFmt(req),' ETP au pic'), 'présent : '+present+' · cible saison : '+_pilEtpFmt(cd.etpCible||0)+' ETP', null, body);
}
function _pilTabPrs(d){
  var H='<div class="pil-panels">';
  if(_pilShow('prs_equipe')) H+=_pilPanelEquipe(d);
  if(_pilShow('prs_presences')) H+=_pilPanelPresences(d);
  if(_pilShow('prs_capacite')) H+=_pilPanelCapacite(d);
  H+='</div>';
  return H;
}

// ── Onglet MATÉRIEL ──
function _pilPanelGnr(d){
  var g=d.gnr;
  if(!g||!g.capacite){ return _pilTile('gnr','\u26FD','#B85A1A','Cuve GNR', _pilStat('—',''), null, null, '<div class="pil-empty">Cuve GNR à renseigner (Tracteur \u203A Entretien).</div>'); }
  var niveau=Number(g.niveau)||0, cap=Number(g.capacite)||1, pc=Math.round(niveau/cap*100), low=niveau<=(Number(g.seuil)||0);
  var col=low?'var(--rouge)':(pc<=40?'var(--orange)':'var(--vert-med)');
  var body='<div style="font-size:32px;font-weight:800;color:'+col+';line-height:1">'+_pilNum(niveau)+'<span style="font-size:15px;color:var(--texte-doux)"> L</span></div>'
    +'<div class="pil-gbar" style="height:14px"><i style="width:'+pc+'%;background:'+col+'"></i></div>'
    +'<div class="pil-li-s" style="margin-top:7px">'+(low?'\u26A0 Niveau bas · ':'')+pc+' % · cuve '+_pilNum(cap)+' L'+(low?'. Prévois un plein avant la prochaine session.':'')+'</div>';
  return _pilTile('gnr','\u26FD','#B85A1A','Cuve GNR', _pilStat(pc,' %', low?'bas':null), null, pc, body);
}
function _pilTabMat(d){
  var H='<div class="pil-panels">';
  if(_pilShow('mat_tracteur')) H+=_pilPanelTracteur(d);
  if(_pilShow('mat_gnr')) H+=_pilPanelGnr(d);
  if(_pilShow('mat_phyto')) H+=_pilPanelPhyto(d);
  if(_pilShow('mat_traitement')) H+=_pilPanelTraitement(d);
  H+='</div>';
  return H;
}

// ── Onglet CAVE (sous-onglets Élevage / Vinification / Vendange) ──
// ════════════════════════════════════════════════════════════
// PILOTAGE › CAVE — cockpit decisionnel.
// Trois sous-onglets, un verbe chacun : ce qui presse · le millesime ·
// le parc & le cout. AUCUN calcul neuf sauf le volume restant a rentrer :
// on consomme _mlAgenda, _mlChaine, _mlRendements, _mlResteARentrer et
// _mvFutParc. Consommer, c'est l'inverse de dupliquer.
// Repli complet : un cave.js ou un utils.js anterieur fait disparaitre le
// bloc concerne, jamais l'onglet entier.
// ════════════════════════════════════════════════════════════

function _pcavF1(n){ if(n==null||isNaN(n)) return '—'; return (Math.round(n*10)/10).toString().replace('.',','); }
function _pcavInt(n){ if(n==null||isNaN(n)) return '—'; return Math.round(n).toLocaleString('fr-FR').replace(/\u202f/g,'\u00a0'); }
function _pcavHas(f){ return typeof window[f]==='function'; }
// Cliquet C14 : aucun catch{} vide. Un repli qui echoue reste un repli,
// mais il laisse une trace en 'info' — c'est ainsi qu'on apprend qu'un
// moteur de la Cave a change de contrat.
function _pcavLog(ou,e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'cave/'+ou,err:e}); }
// Un millesime « a de la matiere » des qu'une seule etape est renseignee.
// Sans ce test, un domaine vierge voit quatre tuiles a zero au lieu d'une
// phrase honnete — et un parcours qui grossit au lieu de retrecir.
function _pcavMatiere(ch){ if(!ch) return false;
  return (ch.kg>0)||(ch.hlDecuve>0)||(ch.hlCuve>0)||(ch.hlFut>0)||(ch.btl>0); }

// Millesime courant = celui de la campagne ouverte le 1er aout precedent.
// _mvCampagneDe est la source unique (utils.js) ; repli local si absent.
function _pcavCampagne(){
  var iso=new Date().toISOString().slice(0,10);
  if(_pcavHas('_mvCampagneDe')){ try{ return window._mvCampagneDe(iso); }catch(e){ _pcavLog('campagne',e); } }
  var y=parseInt(iso.slice(0,4),10), m=parseInt(iso.slice(5,7),10);
  return m>=8?y:y-1;
}

// Phase du calendrier : elle decide de l'ORDRE des blocs, jamais de leur
// presence. Cacher un bloc, c'est le rendre introuvable le jour ou il compte.
function _pcavPhase(){
  var m=new Date().getMonth()+1;
  if(m>=8 && m<=10) return 'vendange';
  if(m>=4 && m<=7) return 'embouteillage';
  return 'elevage';
}

// Contexte : tout ce que les blocs consomment, monte une seule fois.
function _pcavCtx(d){
  var mil=_pcavCampagne(), c={mil:mil, phase:_pcavPhase(), d:d};
  c.alerte=(d&&d.ouAlerte)||14;
  c.cuvees=(window.CAVE_ELEVAGE&&CAVE_ELEVAGE.cuvees)||[];
  c.enElevage=c.cuvees.filter(function(x){ return x&&x.statut!=='embouteille'; });
  try{ c.agenda=_pcavHas('_mlAgenda')?window._mlAgenda(new Date().toISOString().slice(0,10),4):null; }
  catch(e){ c.agenda=null; }
  // Le millesime affiche n'est pas forcement celui de la campagne ouverte.
  // Le 7 aout, la campagne 2026-2027 vient de commencer mais le vin en cave
  // est le 2025 : _mlChaine(2026) est vide et l'ecran serait blanc tout
  // l'automne. On garde la campagne courante DES QU'ELLE A DE LA MATIERE,
  // sinon on recule d'un cran. c.milAff porte le millesime retenu.
  c.chaine=null; c.milAff=mil;
  if(_pcavHas('_mlChaine')){
    for(var _k=0;_k<2;_k++){
      var _m=mil-_k, _ch=null;
      try{ _ch=window._mlChaine(_m); }catch(e){ _pcavLog('chaine',e); }
      if(_ch && _pcavMatiere(_ch)){ c.chaine=_ch; c.milAff=_m; break; }
      if(_k===0 && _ch) c.chaine=_ch;
    }
    if(c.chaine && !_pcavMatiere(c.chaine)) c.chaine=null;
  }
  // ⚠ La famille _mvFut* PREND SES DONNEES EN ARGUMENT : elle vit dans
  // utils.js, importe en PREMIER, elle ne peut donc pas compter sur les
  // globales au chargement. Signature reelle :
  //   _mvFutParc(INTRANTS, CAVE_ELEVAGE, curY)
  // Appelee sans argument, elle renvoyait un parc a ZERO, en silence.
  // Meme appel que reserve.js, qui est le patron de reference.
  try{ c.parc=_pcavHas('_mvFutParc')
        ? window._mvFutParc(window.INTRANTS, window.CAVE_ELEVAGE, null)
        : null; }catch(e){ _pcavLog('futParc',e); c.parc=null; }
  try{ c.rdt=_pcavHas('_mlRendements')?window._mlRendements(mil):[]; }catch(e){ c.rdt=[]; }
  try{ c.reste=_pcavHas('_mlResteARentrer')?window._mlResteARentrer(mil):[]; }catch(e){ c.reste=[]; }
  c.futL=_pcavHas('_caveFutL')?(window._caveFutL()||228):228;
  c.anges=_pcavAnges(c);
  return c;
}

// ── Part des anges : une MESURE, pas une estimation ─────────────────
// Ce qu'on remet en ouillage est exactement ce qui s'est evapore. Les
// operations stockent data.vol_total_L. On lit une collection, on ne
// recopie aucun calcul : _mlVolParFut fait une moyenne PAR FUT, pas une
// somme. Reserve honnete affichee a l'ecran : le soutirage retire aussi
// du volume, cette mesure ne vaut que pour l'ouillage.
// ── La part des anges, UNE LIGNE PAR MILLESIME ───────────────────────
// ⚠ MODELE ARBITRE PAR NICO : on n'ouille pas les futs de 2025 avec du vin
// de 2026. Chaque millesime a sa cave, son rythme, son evaporation. Un
// chiffre unique melangeait un vin qui vient d'etre entonne et un vin en
// fin d'elevage : une moyenne qui ne decrit aucun des deux.
// Fenetre : DOUZE MOIS GLISSANTS. Le 5 aout, une campagne ouverte depuis
// quatre jours ne contient presque aucun ouillage.
function _pcavAnges(c){
  var ops=(window.CAVE_ELEVAGE&&CAVE_ELEVAGE.operations)||[];
  var d1=new Date().toISOString().slice(0,10);
  var _d0=new Date(); _d0.setFullYear(_d0.getFullYear()-1);
  var d0=_d0.toISOString().slice(0,10);
  // Millesime de chaque cuvee, pour ventiler les ouillages.
  var milDe={}, futDe={};
  c.enElevage.forEach(function(x){
    if(!x||!x.id) return;
    milDe[x.id]=_pcavMilKey(x.millesime);
    futDe[x.id]=(x.tonneaux||[]).reduce(function(s,t){ return s+(parseInt(t.nb,10)||0); },0);
  });
  var par={}, total={L:0,ops:0};
  ops.forEach(function(o){
    if(!o||o.type!=='ouillage'||!o.data) return;
    var dt=o.date||''; if(dt<d0||dt>d1) return;
    var v=parseFloat(o.data.vol_total_L); if(!v||isNaN(v)) return;
    var ids=(o.cuvees_ids&&o.cuvees_ids.length)?o.cuvees_ids:(o.cuvee_id?[o.cuvee_id]:[]);
    var mils={};
    ids.forEach(function(id){ if(milDe[id]!=null) mils[milDe[id]]=1; });
    var mk=Object.keys(mils);
    total.L+=v; total.ops++;
    // Depuis le lot A une operation ne porte qu'un millesime. Une operation
    // mixte heritee est comptee dans le total mais PAS ventilee : mieux vaut
    // un millesime sans ligne qu'une ligne fausse.
    if(mk.length!==1) return;
    var k=mk[0];
    if(!par[k]) par[k]={mil:k, L:0, ops:0, futs:0};
    par[k].L+=v; par[k].ops++;
  });
  // Volume loge par millesime = ses futs en vin x contenance.
  c.enElevage.forEach(function(x){
    if(!x||!x.id) return;
    var k=milDe[x.id]; if(!par[k]) return;
    par[k].futs+=futDe[x.id]||0;
  });
  var lignes=Object.keys(par).map(function(k){
    var p=par[k], loge=p.futs*c.futL/100;
    return {mil:k, hlPerdu:p.L/100, ops:p.ops, futs:p.futs, hlLoge:loge,
            pctAn:loge>0?(p.L/100)/(loge+p.L/100)*100:null,
            btl:Math.round(p.L/0.75)};
  }).filter(function(x){ return x.hlPerdu>0; })
    .sort(function(a,b){
      if(a.mil==='?') return 1; if(b.mil==='?') return -1;
      return Number(b.mil)-Number(a.mil);
    });
  if(!lignes.length && !total.ops) return null;
  return {lignes:lignes, hlPerdu:total.L/100, ops:total.ops,
          nonVentile:total.ops-lignes.reduce(function(s,x){ return s+x.ops; },0)};
}
function _pcavMilKey(m){ return (m==null||m==='')?'?':String(m); }

// ── Briques de rendu ────────────────────────────────────────────────
function _pcavRow(pt,html,when,act,kind,ref){
  var b='';
  if(act) b='<button class="pcav-act" onclick="_pcavGo(\''+kind+'\',\''+_pilEsc(String(ref||''))+'\')">'+_pilEsc(act)+'</button>';
  return '<div class="pcav-row"><span class="pcav-pt '+pt+'"></span><div class="pcav-rm">'+html+'</div>'
    +(when?'<span class="pcav-when">'+_pilEsc(when)+'</span>':'')+b+'</div>';
}
function _pcavSub(t){ return '<div class="pcav-sub">'+t+'</div>'; }
function _pcavCard(ico,dot,titre,stat,body,mini){
  return '<div class="pcav-card"><div class="pcav-h"><span class="pcav-dot" style="background:'+dot+'"></span>'
    +'<span class="pcav-ico">'+ico+'</span><span class="pcav-t">'+_pilEsc(titre)+'</span>'
    +(stat?'<span class="pcav-stat">'+stat+'</span>':'')+'</div>'
    +'<div class="pcav-b">'+body+'</div>'
    +(mini?'<div class="pcav-mini">'+mini+'</div>':'')+'</div>';
}
function _pcavK(lab,val,unit,sub,dark,col){
  return '<div class="pcav-k'+(dark?' dark':'')+'"><div class="pcav-kl">'+_pilEsc(lab)+'</div>'
    +'<div class="pcav-kv"'+(col?' style="color:'+col+'"':'')+'>'+val+(unit?' <small>'+_pilEsc(unit)+'</small>':'')+'</div>'
    +(sub?'<div class="pcav-ks">'+sub+'</div>':'')+'</div>';
}

// Depuis le Pilotage il faut d'abord ATTERRIR sur la Cave : _mlGo appelle
// renderCave() mais ne change pas de page. Expression window : appelee
// depuis un onclick, C15 la verrait morte sinon (cf. _arcOpen).
window._pcavGo = function(kind,ref){
  if(typeof goTo==='function') goTo('cave');
  if(typeof window._mlGo==='function'){ try{ window._mlGo(kind,ref); return; }catch(e){ _pcavLog('go',e); } }
  if(typeof showToast==='function') showToast('Ouvre la Cave pour ce geste','#B85A1A');
};

// ── Bloc « ce qui presse » : ouillage ────────────────────────────────
// ── L'ouillage, groupe par millesime, avec le seuil propre a chacun ──
function _pcavOuillage(c){
  var groupes={}, nDue=0;
  var milDe={};
  c.enElevage.forEach(function(x){ if(x&&x.id) milDe[x.id]=_pcavMilKey(x.millesime); });
  if(c.agenda){
    var vus={};
    c.agenda.forEach(function(s){ s.items.forEach(function(it){
      if(it.kind!=='ouillage'||it.urgence!=='due'||vus[it.ref]) return;
      vus[it.ref]=1; nDue++;
      var k=milDe[it.ref]!=null?milDe[it.ref]:'?';
      if(!groupes[k]) groupes[k]=[];
      groupes[k].push(it);
    }); });
  }
  var mils=Object.keys(groupes).sort(function(a,b){
    if(a==='?') return 1; if(b==='?') return -1; return Number(b)-Number(a);
  });
  var multi=_pcavMilsCave(c).length>1;
  var rows='';
  mils.forEach(function(m){
    if(multi) rows+='<div class="pcav-grp">'+_pilEsc(m==='?'?'Sans mill\u00e9sime':m)
      +'<span>ouillage tous les '+_pcavSeuilDe(m,c)+' jours</span></div>';
    groupes[m].forEach(function(it){
      rows+=_pcavRow(it.note&&/jamais/.test(it.note)?'red':'amb',
        '<b>'+_pilEsc(it.titre)+'</b>'+_pcavSub(_pilEsc(it.detail)+(it.note?' \u00b7 '+_pilEsc(it.note):'')),
        '', 'Ouiller','ouillage',it.ref);
    });
  });
  if(!nDue) rows=_pcavRow('ok','<b>Toutes les cuv\u00e9es sont \u00e0 jour</b>'
    +_pcavSub(multi?'chaque mill\u00e9sime \u00e0 son propre rythme':('Seuil de '+_pcavSeuilDe(null,c)+' jours, r\u00e9gl\u00e9 dans la Cave')),'','','','');
  else {
    var reste=c.enElevage.length-nDue;
    if(reste>0) rows+=_pcavRow('ok','<b>'+reste+' cuv\u00e9e'+(reste>1?'s':'')+'</b> \u00e0 jour','','','','');
  }
  return _pcavCard('\uD83E\uDEA3','#B23A52','Ouillage',
    nDue?('<b>'+nDue+'</b> en retard'):'\u00e0 jour', rows,
    multi
      ? 'Chaque mill\u00e9sime a son propre d\u00e9lai d\u2019alerte, r\u00e9glable dans les r\u00e9glages du Chai : un vin jeune se rattrape plus souvent qu\u2019un vin d\u2019un an. Le volume \u00e0 compl\u00e9ter est d\u00e9duit des ouillages pass\u00e9s de la cuv\u00e9e.'
      : 'Le seuil vient de vos r\u00e9glages Cave. Le volume \u00e0 compl\u00e9ter est d\u00e9duit de vos ouillages pass\u00e9s, pas d\u2019une moyenne th\u00e9orique.');
}

// Le seuil affiche vient du Chai (_caveSeuilOu) : une regle recopiee ici
// divergerait des le premier reglage. Repli sur le seuil du contexte, qui
// est deja le reglage global du domaine.
function _pcavSeuilDe(m,c){
  if(_pcavHas('_caveSeuilOu')){
    try{ return window._caveSeuilOu((m==null||m==='?')?null:m); }catch(e){ _pcavLog('seuil',e); }
  }
  return (c&&c.alerte)||14;
}
// Les millesimes reellement en cave, pour savoir s'il faut grouper.
function _pcavMilsCave(c){
  var set={};
  c.enElevage.forEach(function(x){ if(x) set[_pcavMilKey(x.millesime)]=1; });
  return Object.keys(set);
}

// ── Fermentations ────────────────────────────────────────────────────
function _pcavFerment(c){
  if(!c.agenda) return '';
  var rows='', n=0, vus={};
  c.agenda.forEach(function(s){ s.items.forEach(function(it){
    if(it.kind!=='alerte'&&it.kind!=='fa'&&it.kind!=='decuvage'&&it.kind!=='demarrage'&&it.kind!=='mesure') return;
    var k=it.kind+'|'+it.ref; if(vus[k]) return; vus[k]=1; n++;
    var pt=(it.urgence==='due')?'red':(it.urgence==='warn'?'amb':(it.kind==='decuvage'?'ok':'amb'));
    var act=null,kind=it.kind;
    if(it.kind==='decuvage') act='Décuver';
    else if(it.kind==='mesure'){ act='Relever'; kind='mesure'; }
    else if(it.kind==='alerte'){ act='Relever'; kind='mesure'; }
    rows+=_pcavRow(pt,'<b>'+_pilEsc(it.titre)+'</b>'+_pcavSub(_pilEsc(it.detail)+(it.note?' · '+_pilEsc(it.note):'')),
      it.kind==='fa'?_pilDfr(it.date):'', act, kind, it.ref);
  }); });
  if(!n) return '';
  return _pcavCard('\u2697\uFE0F','#7B4DB8','Fermentations','<b>'+n+'</b> à suivre',rows,
    'Deux pentes sont calculées : la moyenne sur trois relevés projette la fin, les deux derniers détectent l’arrêt. Une moyenne seule lisse le décrochage — c’est exactement ce qu’il ne faut pas lisser.');
}

// ── Cuverie face au reste a rentrer ─────────────────────────────────
// SEUL calcul neuf du lot : _mlResteARentrer renvoie des PARCELLES, pas des
// hectolitres. On applique le rendement moyen deja constate sur la campagne
// aux surfaces non recoltees. C'est un ordre de grandeur, l'ecran le dit.
// Statuts de cuve REELS : 'setup' | 'fa' | 'mpf' | 'termine'. Une cuve est
// active en 'fa'/'mpf' (meme critere que _vendIsActive), libre sinon.
// « Prete a decuver » n'est pas un drapeau : c'est _mlProjFA().etat==='sec'.
function _pcavCuverie(c){
  if(!c.reste||!c.reste.length||!c.chaine) return '';
  var ha=0; c.reste.forEach(function(p){ ha+=parseFloat(p.surface)||0; });
  var haFait=c.chaine.ha||0, hlFait=c.chaine.hlDecuve||0;
  if(ha<=0||haFait<=0||hlFait<=0) return '';
  var rdt=hlFait/haFait, hlAttendu=ha*rdt;
  var cuves=(window.CAVE_VENDANGE&&CAVE_VENDANGE.cuves_vinif)||[];
  var libre=0, secs=0, hlSec=0;
  cuves.forEach(function(cv){
    if(!cv) return;
    var v=parseFloat(cv.volume_hl)||0, actif=(cv.statut==='fa'||cv.statut==='mpf');
    if(!actif){ libre+=v; return; }
    if(_pcavHas('_mlProjFA')){
      try{ if(window._mlProjFA(cv,new Date().toISOString().slice(0,10)).etat==='sec'){ secs++; hlSec+=v; } }catch(e){ _pcavLog('projFA',e); }
    }
  });
  var manque=hlAttendu-libre;
  var rows=_pcavRow('amb','<b>'+_pcavF1(ha)+' ha</b> encore sur pied'
      +_pcavSub('≈ '+_pcavInt(hlAttendu)+' hL, à votre rendement moyen de '+_pcavF1(rdt)+' hL/ha'),'','','','')
    +_pcavRow(libre>0?'ok':'amb','<b>'+_pcavInt(libre)+' hL</b> de cuverie libre','','','','');
  if(manque>0){
    rows+=_pcavRow('red','Il manque <b>'+_pcavInt(manque)+' hL</b>','','','','');
    if(hlSec>0) rows+=_pcavRow('ok','<b>'+secs+' cuve'+(secs>1?'s':'')+'</b> sèche'+(secs>1?'s':'')+', décuvage possible'
      +_pcavSub('libère '+_pcavInt(hlSec)+' hL'+(hlSec>=manque?' — l’écart se referme':'')),'','','','');
  } else rows+=_pcavRow('ok','La cuverie couvre ce qui reste','','','','');
  return _pcavCard('\uD83E\uDDFA','#5B9B3A','Cuverie face au reste à rentrer',
    manque>0?('écart <b>'+_pcavInt(manque)+'</b> hL'):'suffisante', rows,
    'Le volume attendu applique votre rendement moyen de la campagne aux surfaces non récoltées. C’est un ordre de grandeur, pas une pesée.');
}

// ── Renouvellement du parc ───────────────────────────────────────────
function _pcavParcPresse(c){
  var p=c.parc; if(!p) return '';
  var rows=_pcavRow(p.aReformer>0?'amb':'ok',
      '<b>'+p.aReformer+' barrique'+(p.aReformer>1?'s':'')+'</b> au-delà de '+p.vie+' vins'
      +(p.aReformer>0?_pcavSub('à renouveler'):''),'','','','')
    +_pcavRow('ok','<b>'+p.libres+' fût'+(p.libres>1?'s':'')+' libre'+(p.libres>1?'s':'')+'</b>'
      +(p.neufs?_pcavSub('dont '+p.neufs+' neuf'+(p.neufs>1?'s':'')):''),'','','','');
  if(p.aReformer>0) rows+=_pcavRow(p.libres>=p.aReformer?'ok':'red',
    p.libres>=p.aReformer?'Le stock libre couvre le renouvellement'
      :('Il manquerait <b>'+(p.aReformer-p.libres)+' fût'+((p.aReformer-p.libres)>1?'s':'')+'</b>'),'','','','');
  return _pcavCard('\uD83D\uDEE2\uFE0F','#8A5A38','Renouvellement du parc',
    '<b>'+p.aReformer+'</b> en fin de vie', rows,
    'Aucun montant n’est affiché : le prix moyen d’une barrique n’est pas renseigné dans vos réglages Cave. Le plan reste exprimé en nombre de fûts.');
}

// ── Elevage en cours ─────────────────────────────────────────────────
// L'app n'a AUCUN drapeau « prete a embouteiller » — ne pas en inventer un.
// On affiche un fait verifiable : la duree d'elevage depuis date_entree, et
// le nombre de futs qui reviendraient au parc a la mise.
function _pcavElevage(c){
  if(!c.enElevage.length) return '';
  var now=Date.now();
  var l=c.enElevage.map(function(x){
    var d=x.date_entree?new Date(x.date_entree).getTime():0;
    var mois=(d&&!isNaN(d))?Math.floor((now-d)/2629800000):null;
    var nb=(x.tonneaux||[]).reduce(function(s,t){ return s+(parseInt(t.nb,10)||0); },0);
    return {nom:(x.nom||'Cuvée')+' '+(x.millesime||''), mois:mois, nb:nb};
  }).sort(function(a,b){ return (b.mois==null?-1:b.mois)-(a.mois==null?-1:a.mois); });
  var rows=l.slice(0,6).map(function(x){
    return _pcavRow(x.mois!=null&&x.mois>=18?'amb':'ok','<b>'+_pilEsc(x.nom)+'</b>'
      +_pcavSub((x.mois==null?'date d’entonnage non renseignée':('en élevage depuis '+x.mois+' mois'))
        +(x.nb?' · '+x.nb+' fût'+(x.nb>1?'s':''):'')),'','','','');
  }).join('');
  var tot=l.reduce(function(s,x){ return s+x.nb; },0);
  return _pcavCard('\uD83C\uDF77','#B23A52','Élevage en cours',
    '<b>'+l.length+'</b> cuvée'+(l.length>1?'s':''), rows,
    'La durée se compte depuis la date d’entonnage. À la mise en bouteille, les '+tot+' barriques concernées reviennent au parc avec leur tonnelier et leur millésime.');
}

// ── Soutirage & malo ─────────────────────────────────────────────────
// ⚠ MODELE : le soutirage se declenche a la fin de la malo, jamais a une
// date. Et la fin se projette sur les valeurs d'acide malique MESUREES sur
// CETTE cuvee — pas sur la duree des malos passees du domaine.
// Le Pilotage consomme _mlProjMalo (cave.js), il ne recalcule rien.
// Les doses de SO2 programmees a la saisie d'un soutirage. so2.dates[] est
// STOCKE, puis plus jamais rappele nulle part. On ne montre que les doses A
// VENIR : rien ne dit qu'une dose passee a ete faite, l'annoncer en retard
// serait une accusation sans preuve.
function _pcavSoutirages(c){
  var ops=(window.CAVE_ELEVAGE&&CAVE_ELEVAGE.operations)||[];
  var nom={}; c.cuvees.forEach(function(x){ if(x&&x.id) nom[x.id]=(x.nom||'Cuvée')+' '+(x.millesime||''); });
  var doses=[], auj=new Date().toISOString().slice(0,10);
  var fin=new Date(); fin.setDate(fin.getDate()+28); fin=fin.toISOString().slice(0,10);
  ops.forEach(function(o){
    if(!o||o.type!=='soutirage'||!o.date||!o.data) return;
    var so2=o.data.so2; if(!so2||!so2.dates||!so2.dates.length) return;
    var ids=(o.cuvees_ids&&o.cuvees_ids.length)?o.cuvees_ids:(o.cuvee_id?[o.cuvee_id]:[]);
    so2.dates.forEach(function(dt,i){
      if(!dt||dt<auj||dt>fin) return;
      doses.push({date:dt, rang:i+1, sur:so2.dates.length, dose:so2.dose,
                  unite:so2.unite||'cL', ids:ids, ref:ids[0]||''});
    });
  });
  doses.sort(function(a,b){ return a.date<b.date?-1:(a.date>b.date?1:0); });
  return {doses:doses, nom:nom};
}
// Le dernier soutirage de chaque cuvee. cave.js en porte la definition
// (_caveLastSout) : on la consomme plutot que d'en garder une copie, sinon
// les deux ecrans divergent au premier changement. Repli local pour un
// cave.js anterieur chez un client pas encore a jour.
function _pcavDernierSout(){
  var d={};
  if(typeof window._caveLastSout==='function'){
    try{
      ((window.CAVE_ELEVAGE&&CAVE_ELEVAGE.cuvees)||[]).forEach(function(c){
        if(!c||!c.id) return;
        var v=window._caveLastSout(c.id); if(v) d[c.id]=v;
      });
      return d;
    }catch(e){ _pcavLog('lastSout',e); d={}; }
  }
  var ops=(window.CAVE_ELEVAGE&&CAVE_ELEVAGE.operations)||[];
  ops.forEach(function(o){
    if(!o||o.type!=='soutirage'||!o.date) return;
    var ids=(o.cuvees_ids&&o.cuvees_ids.length)?o.cuvees_ids:(o.cuvee_id?[o.cuvee_id]:[]);
    ids.forEach(function(id){ if(!d[id]||o.date>d[id]) d[id]=o.date; });
  });
  return d;
}
// Date a laquelle la malo a ete CONSTATEE finie. Elle sert de reference au
// geste : un soutirage anterieur a cette date n'acquitte pas celui-ci.
// Sans elle, un soutirage de mars valait quitus pour une malo finie en mai.
function _pcavFinMalo(){
  var ops=(window.CAVE_ELEVAGE&&CAVE_ELEVAGE.operations)||[], d={};
  ops.forEach(function(o){
    if(!o||o.type!=='analyse'||!o.data||o.data.fml!=='ok') return;
    var dt=o.data.fml_date||o.date; if(!dt) return;
    var ids=(o.cuvees_ids&&o.cuvees_ids.length)?o.cuvees_ids:(o.cuvee_id?[o.cuvee_id]:[]);
    ids.forEach(function(id){ if(!d[id]||dt<d[id]) d[id]=dt; });
  });
  return d;
}

// Etat de chaque cuvee vis-a-vis du soutirage. Tout vient de _mlProjMalo,
// sauf le drapeau declaratif fml_terminee, qui reste une verite du vigneron :
// s'il declare la malo finie, elle est finie, meme sans mesure.
function _pcavMalo(c){
  var ds=_pcavDernierSout(), fm=_pcavFinMalo(), out=[];
  var has=_pcavHas('_mlProjMalo');
  c.enElevage.forEach(function(x){
    if(!x||!x.id) return;
    var p=null;
    if(has){ try{ p=window._mlProjMalo(x); }catch(e){ _pcavLog('projMalo',e); } }
    var etat=p?p.etat:'attente';
    var finie=(etat==='finie')||!!x.fml_terminee;
    var sout=ds[x.id]||null;
    // Reference du geste : la date ou la malo a ete constatee finie.
    var ref=(p&&p.etat==='finie'&&p.dernier)?p.dernier:(fm[x.id]||null);
    // Un soutirage acquitte le geste s'il est POSTERIEUR a cette reference.
    // Sans reference datee (malo declaree a la main, sans analyse), on garde
    // le comportement d'avant : un soutirage suffit.
    var acquitte=!!sout&&(!ref||sout>=ref);
    // ⚠ Une seule verite desormais : l'operation datee. Le drapeau
    // cuvee.sous_tire a ete retire du formulaire — sans date, il ne pouvait
    // que contredire le journal du Chai a l'ecran.
    out.push({id:x.id, nom:(x.nom||'Cuvée')+' '+(x.millesime||''),
              p:p, etat:etat, finie:finie, sout:sout, ref:ref,
              cas: finie ? (acquitte?'fait':'a_soutirer')
                         : (p&&p.n?'suivie':(sout?'fait':'sans_mesure'))});
  });
  return out;
}

// La courbe : decroissance mesuree, en CSS pur. Un SVG a viewBox fixe
// s'etire a ×5 sur grand ecran — piege corrige en aout sur la pyramide.
function _pcavMaloCourbe(l){
  var suivies=l.filter(function(x){ return x.p&&x.p.mesures&&x.p.mesures.length>=3; });
  if(!suivies.length) return '';
  var h='<div class="pcav-mal">';
  suivies.slice(0,4).forEach(function(x){
    var m=x.p.mesures, hi=Math.max.apply(null,m.map(function(v){ return v.val; }));
    if(!(hi>0)) return;
    var pts=m.map(function(v,i){
      var xp=m.length>1?(i/(m.length-1)*100):0;
      return {x:xp, y:Math.max(2,Math.min(100,v.val/hi*100)), v:v};
    });
    var barres=pts.map(function(pt){
      var col=(pt.v.val<=(window._ML_MAL_FIN||0.1))?'var(--vert-med)':'var(--terre)';
      return '<div class="pcav-mbar" style="left:'+pt.x+'%;height:'+pt.y+'%;background:'+col+'"></div>';
    }).join('');
    var seuil=Math.max(1,Math.min(100,(window._ML_MAL_FIN||0.1)/hi*100));
    h+='<div class="pcav-mrow"><div class="pcav-mn">'+_pilEsc(x.nom)
      +'<small>'+_pcavF1(m[0].val)+' → '+_pcavF1(m[m.length-1].val)+' g/L</small></div>'
      +'<div class="pcav-mg"><span class="pcav-msl" style="bottom:'+seuil+'%"></span>'+barres+'</div>'
      +'<div class="pcav-mj">'+(x.p.etat==='normal'?('~'+x.p.jours+' j'):'—')+'</div></div>';
  });
  h+='<div class="pcav-mleg">Chaque barre est une analyse. Le trait vert est le seuil de malo achevée ('
    +_pcavF1(window._ML_MAL_FIN||0.1)+' g/L).</div></div>';
  return h;
}

function _pcavSout(c){
  var l=_pcavMalo(c), s=_pcavSoutirages(c), rows='', n=0;
  var aS=l.filter(function(x){ return x.cas==='a_soutirer'; });

  // 1. Le geste : malo finie, pas encore soutiree.
  aS.forEach(function(x){
    n++;
    var det=(x.p&&x.p.etat==='finie')
      ? ('malique à '+_pcavF1(x.p.mal)+' g/L au '+_pilDfr(x.p.dernier))
      : 'malo déclarée terminée';
    // Une cuvee deja soutiree PLUS TOT reste a soutirer : le geste qui suit la
    // malo n'a pas eu lieu. On le dit, sinon l'ecran a l'air de se tromper.
    if(x.sout) det+=' · dernier soutirage le '+_pilDfr(x.sout)+', avant la fin de malo';
    rows+=_pcavRow('amb','<b>'+_pilEsc(x.nom)+'</b> est à soutirer'+_pcavSub(det),
      '','Soutirer','soutirage',x.id);
  });

  // 2. Les malos suivies, avec leur projection.
  l.filter(function(x){ return x.cas==='suivie'; }).slice(0,5).forEach(function(x){
    n++;
    var p=x.p, det, pt='ok';
    if(p.etat==='normal'){
      det='malique '+_pcavF1(p.mal)+' g/L · −'+_pcavF1(p.pente*100)+' g/L par 100 j'
        +' · fin estimée vers le <b>'+_pilDfr(p.date)+'</b> (± '+p.marge+' j)';
    } else if(p.etat==='bloquee'){
      pt='red';
      det='malique bloqué à '+_pcavF1(p.mal)+' g/L depuis '+p.stableJ+' jours'
        +' · la moyenne donnait pourtant −'+_pcavF1(p.penteMoy*100)+' g/L par 100 j';
    } else if(p.etat==='demarrage'){
      det=p.n+' analyse'+(p.n>1?'s':'')+' · malique '+_pcavF1(p.mal)+' g/L'
        +(p.proche?' — elle touche à sa fin':'')
        +' · il en faut 3 pour projeter une date';
    } else if(p.etat==='irreguliere'){
      pt='amb';
      det = p.monte
        ? ('malique remonté de '+_pcavF1(p.monte)+' g/L entre les deux dernières analyses — vérifiez la saisie, le malique ne se recrée pas')
        : ('malique '+_pcavF1(p.mal)+' g/L · les valeurs ne décroissent pas régulièrement, aucune date n’est projetée');
    } else det='malo en cours';
    rows+=_pcavRow(pt,'<b>'+_pilEsc(x.nom)+'</b>'+_pcavSub(det),'','','','');
  });

  // 3. Celles sans aucune mesure : on le dit, on n'invente pas.
  var sans=l.filter(function(x){ return x.cas==='sans_mesure'; });
  if(sans.length){
    n++;
    rows+=_pcavRow('ok','<b>'+sans.length+' cuvée'+(sans.length>1?'s':'')+'</b> sans mesure de malique'
      +_pcavSub(sans.slice(0,4).map(function(x){ return _pilEsc(x.nom); }).join(' · ')
        +' — saisissez le malique de votre bulletin d’analyse pour obtenir une projection'),'','','','');
  }

  // 4. Les doses de SO2 programmees au soutirage, que personne ne rappelle.
  s.doses.slice(0,4).forEach(function(x){
    n++;
    var qui=x.ids.map(function(i){ return (s.nom[i]||'—'); }).filter(function(v,i,a){ return a.indexOf(v)===i; }).join(', ');
    var j=Math.round((new Date(x.date)-new Date(new Date().toISOString().slice(0,10)))/86400000);
    rows+=_pcavRow(j<=1?'amb':'ok','<b>SO\u2082 — dose '+x.rang+' sur '+x.sur+'</b>'
      +_pcavSub(_pilEsc(qui)+(x.dose?(' · '+_pcavF1(x.dose)+' '+_pilEsc(x.unite)):'')),
      j===0?'aujourd’hui':(j===1?'demain':'dans '+j+' j'),'','','');
  });

  if(!n) return '';
  var suiv=l.filter(function(x){ return x.cas==='suivie'; }).length;
  var stat = aS.length ? ('<b>'+aS.length+'</b> à soutirer')
           : (suiv ? ('<b>'+suiv+'</b> malo'+(suiv>1?'s':'')+' suivie'+(suiv>1?'s':'')) : 'suivi');
  var mini='Le soutirage se déclenche à la fin de la malo, pas à une date : cet écran ne parle jamais de retard.'
    +' La projection vient des valeurs d’acide malique mesurées sur chaque cuvée, jamais d’une durée moyenne.'
    +' Deux pentes sont calculées : la moyenne sur trois analyses projette la fin, les deux dernières détectent un blocage.';
  // _pcavCard applique _pilEsc : passer « &amp; » produirait « &amp;amp; ».
  return _pcavCard('\uD83D\uDD04','#3D6B27','Soutirage & malo', stat,
    rows+_pcavMaloCourbe(l), mini);
}

// ── Verdict : le titre de l'onglet, un CONSTAT, jamais un jugement ───
// Cuvees dont la malo est finie et qui n'ont pas ete soutirees depuis.
// C'est un GESTE en attente, il passe devant un simple rappel de date.
function _pcavASoutirer(c){
  return _pcavMalo(c).filter(function(x){ return x.cas==='a_soutirer'; }).length;
}
// Malos qui stagnent : la pente recente est plate alors qu'il reste du
// malique. C'est le seul etat de cave qui ne peut pas attendre la semaine
// prochaine — une malo arretee redemarre d'autant plus mal qu'on tarde.
function _pcavMaloBloquee(c){
  return _pcavMalo(c).filter(function(x){ return x.p&&x.p.etat==='bloquee'; }).length;
}
// Doses de SO2 tombant dans les 7 jours. Sert au verdict : une date que le
// vigneron a lui-meme programmee et que personne ne lui rappelle.
function _pcavSo2Proche(c){
  var s7=new Date(); s7.setDate(s7.getDate()+7); s7=s7.toISOString().slice(0,10);
  var d=_pcavSoutirages(c).doses.filter(function(x){ return x.date<=s7; });
  return d.length;
}
function _pcavVerdict(c){
  var t=null, s=null, badge='b-neu', lab='Cave';
  var nOu=0;
  if(c.agenda){ var v={}; c.agenda.forEach(function(w){ w.items.forEach(function(it){
    if(it.kind==='ouillage'&&it.urgence==='due'&&!v[it.ref]){ v[it.ref]=1; nOu++; } }); }); }
  var nAl=0;
  if(c.agenda){ c.agenda.forEach(function(w){ w.items.forEach(function(it){
    if(it.kind==='alerte') nAl++; }); }); }
  var haR=0; (c.reste||[]).forEach(function(p){ haR+=parseFloat(p.surface)||0; });

  if(nAl>0){ lab='Vinification'; badge='b-bad';
    t=nAl+' cuve'+(nAl>1?'s demandent':' demande')+' un contrôle';
    s='La fermentation ralentit ou la température est haute. C’est le seul point de cet écran qui ne peut pas attendre demain.';
  } else if(c.phase==='vendange'&&haR>0){ lab='Vendange'; badge='b-warn';
    t=_pcavF1(haR)+' ha restent à rentrer';
    s='Vérifiez que la cuverie suit avant de lancer la prochaine journée de récolte.';
  } else if(nOu>0){ lab='Élevage'; badge='b-warn';
    t=nOu+' cuvée'+(nOu>1?'s':'')+' à ouiller';
    s='Le seuil de '+c.alerte+' jours est dépassé.';
    if(c.anges&&c.anges.hlPerdu>0) s+=' Sur douze mois, la part des anges représente <b>'+_pcavF1(c.anges.hlPerdu)+' hL</b>.';
  } else if(_pcavMaloBloquee(c)){ lab='Malo'; badge='b-bad';
    var _b=_pcavMaloBloquee(c);
    t=_b+' malo'+(_b>1?'s':'')+' ne descend'+(_b>1?'ent':'')+' plus';
    s='L’acide malique stagne alors qu’il en reste. Les deux dernières analyses le montrent, la moyenne le lissait.';
  } else if(_pcavASoutirer(c)){ lab='Soutirage'; badge='b-warn';
    var _s=_pcavASoutirer(c);
    t=_s+' cuvée'+(_s>1?'s ont':' a')+' fini sa malo';
    s='La fermentation malo-lactique est terminée : c’est le moment de soutirer.';
  } else if(_pcavSo2Proche(c)){ lab='Soutirage'; badge='b-warn';
    var _n=_pcavSo2Proche(c);
    t=_n+' dose'+(_n>1?'s':'')+' de SO\u2082 prévue'+(_n>1?'s':'')+' cette semaine';
    s='Vous les aviez programmées en enregistrant le soutirage. Ma Vigne ne sait pas si elles ont été faites — elle rappelle seulement la date.';
  } else if(c.parc&&c.parc.aReformer>0){ lab='Parc à fûts'; badge='b-warn';
    t=c.parc.aReformer+' fût'+(c.parc.aReformer>1?'s arrivent':' arrive')+' en fin de vie';
    s='Après ce millésime, ces barriques auront fait '+c.parc.vie+' vins. Vous avez <b>'+c.parc.libres+'</b> fûts libres.';
  } else { lab='Cave'; badge='b-ok';
    t='Rien ne presse aujourd’hui';
    s='Ouillage à jour, aucune fermentation à surveiller, parc à fûts suffisant.';
  }
  return '<div class="pcav-verdict"><div class="pcav-vk"><span class="pil-badge '+badge+'">'+_pilEsc(lab)+'</span>'
    +'<span>Cave · ce qui presse</span></div><div class="pcav-vbig">'+_pilEsc(t)+'</div>'
    +'<div class="pcav-vsub">'+s+'</div></div>';
}

// ── Onglet 1 : ce qui presse ─────────────────────────────────────────
// L'ORDRE suit le calendrier ; la PRESENCE des blocs ne change jamais.
function _pcavVuePresse(c){
  var ordre = c.phase==='vendange'      ? ['cuverie','ferment','ouillage','sout','parc','elevage']
            : c.phase==='embouteillage' ? ['elevage','sout','parc','ouillage','ferment','cuverie']
            :                             ['ouillage','sout','parc','ferment','elevage','cuverie'];
  var F={cuverie:_pcavCuverie, ferment:_pcavFerment, ouillage:_pcavOuillage,
         sout:_pcavSout, parc:_pcavParcPresse, elevage:_pcavElevage};
  var h=_pcavVerdict(c);
  ordre.forEach(function(k){ var f=F[k]; if(f){ try{ h+=f(c)||''; }catch(e){ _pcavLog('presse',e); } } });
  return h;
}

// ── Onglet 2 : le millesime ──────────────────────────────────────────
function _pcavFlux(c,ch,mil){
  ch=ch||c.chaine; mil=(mil!=null)?mil:c.milAff;
  if(!ch) return '';
  var kgCuve=(ch.kg||0)-(ch.kgVendu||0);
  var etapes=[];
  if(ch.kg>0) etapes.push({n:'Rentré',s:'de la vigne',v:ch.kg/100,lab:_pcavInt(ch.kg)+' kg',cls:'g'});
  if(ch.hlDecuve>0) etapes.push({n:'Encuvé',s:ch.parcelles+' parcelles',v:ch.hlDecuve,lab:_pcavInt(ch.hlDecuve)+' hL',cls:'o'});
  if(ch.hlFut>0) etapes.push({n:'En fût',s:ch.futs+' barriques',v:ch.hlFut,lab:_pcavF1(ch.hlFut)+' hL',cls:''});
  if(ch.btl>0) etapes.push({n:'En bouteille',s:'',v:ch.btl*0.75/100,lab:_pcavInt(ch.btl)+' cols',cls:'g'});
  if(etapes.length<2) return '';
  var max=0; etapes.forEach(function(e){ if(e.v>max) max=e.v; });
  var h='';
  etapes.forEach(function(e,i){
    var w=Math.max(10,Math.min(100,Math.round(e.v/max*100)));
    h+='<div class="pcav-fs"><div class="pcav-fn">'+_pilEsc(e.n)+(e.s?'<small>'+_pilEsc(e.s)+'</small>':'')+'</div>'
      +'<div class="pcav-fw"><div class="pcav-fb '+e.cls+'" style="width:'+w+'%">'+e.lab+'</div></div></div>';
    if(i===0&&ch.kgVendu>0) h+='<div class="pcav-fl"><div></div><div>− '+_pcavInt(ch.kgVendu)+' kg de raisin vendu</div></div>';
    if(i===1&&ch.hlFut>0){ var p=ch.hlDecuve-ch.hlFut;
      if(p>0) h+='<div class="pcav-fl"><div></div><div>− '+_pcavF1(p)+' hL de la benne au fût ('+_pcavF1(p/ch.hlDecuve*100)+' %)</div></div>'; }
  });
  var fin = ch.btl>0 ? '' : (ch.hlCuve>0
    ? '<div class="pcav-fl"><div></div><div style="color:var(--texte-doux)">La perte totale se lira quand tout sera décuvé</div></div>'
    : '<div class="pcav-fl"><div></div><div style="color:var(--texte-doux)">La perte totale se lira quand tout sera embouteillé</div></div>');
  return _pcavCard('\uD83E\uDDEC','#8A5A38','De la benne à la bouteille','millésime '+mil,
    '<div class="pcav-flux">'+h+fin+'</div>',
    'Les étages non renseignés sont retirés plutôt qu’affichés à zéro — un parcours qui grossit dirait l’inverse de ce qui se passe.');
}

// ── Plusieurs millesimes coexistent en cave ──────────────────────────
// ⚠ MODELE CORRIGE PAR NICO : en octobre, le millesime precedent est encore
// en fut pendant que le nouveau entre en cuve. Un domaine qui eleve 24 mois
// en a trois de front. L'ecran ne doit donc jamais supposer l'exclusivite.
// _mlMillesimes() (cave.js) donne deja la liste ; _mlChaine(mil) sait lire
// n'importe lequel. On les consomme, on ne recalcule rien.
function _pcavMils(c){
  var l=[];
  if(!_pcavHas('_mlChaine')) return l;
  var ans=[];
  if(_pcavHas('_mlMillesimes')){ try{ ans=window._mlMillesimes()||[]; }catch(e){ _pcavLog('millesimes',e); } }
  if(!ans.length){ ans=[c.mil, c.mil-1, c.mil-2]; }
  ans.forEach(function(a){
    var ch=null;
    try{ ch=window._mlChaine(a); }catch(e){ _pcavLog('chaine/'+a,e); }
    if(!ch||!_pcavMatiere(ch)) return;
    // La phase la plus avancee ou se trouve encore du vin de ce millesime.
    var phase = (ch.hlCuve>0) ? 'cuve' : (ch.hlFut>0 ? 'fut' : (ch.btl>0 ? 'bouteille' : 'rentre'));
    l.push({mil:a, ch:ch, phase:phase});
  });
  l.sort(function(a,b){ return b.mil-a.mil; });
  return l;
}

// Le bandeau : ce qui est en cave, tous millesimes, avant d'en ouvrir un.
var _PCAV_PHASES={cuve:['En cuve','#7B4DB8'], fut:['En fût','#8A5A38'],
                  bouteille:['En bouteille','#3D6B27'], rentre:['Rentré','#5B9B3A']};
function _pcavBandeau(l, sel){
  if(l.length<2) return '';
  var cell=l.map(function(x){
    var ph=_PCAV_PHASES[x.phase]||['—','#999'];
    var vol = (x.phase==='cuve') ? (_pcavF1(x.ch.hlCuve)+' hL en cuve')
            : (x.phase==='fut')  ? (_pcavF1(x.ch.hlFut)+' hL · '+x.ch.futs+' fûts')
            : (x.phase==='bouteille') ? (_pcavInt(x.ch.btl)+' bouteilles')
            : (_pcavInt(x.ch.kg)+' kg rentrés');
    return '<button class="pcav-mil'+(x.mil===sel?' on':'')+'" data-mil="'+x.mil+'">'
      +'<span class="pcav-milp" style="background:'+ph[1]+'"></span>'
      +'<span class="pcav-mila">'+x.mil+'</span>'
      +'<span class="pcav-milf">'+_pilEsc(ph[0])+'</span>'
      +'<span class="pcav-milv">'+vol+'</span></button>';
  }).join('');
  return _pcavCard('\uD83C\uDF47','#8A5A38','En cave en ce moment',
    '<b>'+l.length+'</b> millésimes','<div class="pcav-milg">'+cell+'</div>',
    'Plusieurs millésimes cohabitent : le précédent finit son élevage pendant que le nouveau entre en cuve. Touchez-en un pour voir son parcours en détail.');
}

// ── Rendement face au plafond de l'appellation ───────────────────────
// _mlRendements renvoie {parcelle, kg, hlHa, max, depasse, pct, vendu}.
// max vient de p.rdt_max, saisi par parcelle : sans lui, pas de comparaison.
function _pcavRdt(c,mil){
  // Les rendements ne valent que pour le millesime ouvert : c.rdt est monte
  // pour le millesime du contexte, on le recalcule si l'on en ouvre un autre.
  var src=c.rdt||[];
  if(mil!=null&&mil!==c.milAff&&_pcavHas('_mlRendements')){
    try{ src=window._mlRendements(mil)||[]; }catch(e){ _pcavLog('rdt/'+mil,e); src=[]; }
  }
  var l=src.filter(function(r){ return r&&r.hlHa!=null; });
  if(!l.length) return '';
  var avecMax=l.filter(function(r){ return r.pct!=null; });
  var over=avecMax.filter(function(r){ return r.depasse; }).length;
  var rows=l.slice(0,10).map(function(r){
    var nom=(r.parcelle&&r.parcelle.nom)||'—';
    if(r.pct==null){
      return '<div class="pcav-pl"><div class="pcav-py">'+_pilEsc(nom)+'<small>plafond non renseigné</small></div>'
        +'<div class="pcav-pt2"><div class="pcav-ps" style="width:0"></div></div>'
        +'<div class="pcav-pn">'+_pcavF1(r.hlHa)+' hL/ha</div></div>';
    }
    var norm=Math.max(0,Math.min(100,r.pct/115*100));
    var col=r.depasse?'var(--rouge)':(r.pct>92?'var(--orange)':'var(--vert-med)');
    return '<div class="pcav-pl"><div class="pcav-py">'+_pilEsc(nom)+'<small>max '+_pcavF1(r.max)+'</small></div>'
      +'<div class="pcav-pt2"><div class="pcav-ps" style="width:'+norm+'%;background:'+col+'"></div>'
      +'<span class="pcav-pmax"></span></div>'
      +'<div class="pcav-pn" style="color:'+col+'">'+_pcavF1(r.hlHa)+' hL/ha</div></div>';
  }).join('');
  var leg='<div class="pcav-leg"><span><i style="background:var(--vert-med)"></i>sous 92 %</span>'
    +'<span><i style="background:var(--orange)"></i>92 à 100 %</span>'
    +'<span><i style="background:var(--rouge)"></i>au-dessus du plafond</span>'
    +'<span><i style="background:var(--texte)"></i>le plafond</span></div>';
  return _pcavCard('\uD83D\uDCD0','#A0291E','Rendement face au plafond de l’appellation',
    over?('<b>'+over+'</b> au-dessus'):(avecMax.length?'dans les clous':'plafonds non renseignés'),
    '<div class="pcav-pyr">'+rows+leg+'</div>',
    avecMax.length
      ? 'Le trait vertical est le plafond que vous avez renseigné par parcelle. L’échelle va jusqu’à 115 % du plafond pour qu’un dépassement se voie déborder.'
      : 'Aucun plafond n’est renseigné. Posez-le une fois par parcelle depuis Le millésime pour obtenir la comparaison.');
}

// ── Face a l'an dernier ──────────────────────────────────────────────
// Meme axe que les Archives : campagne du 1er aout au 31 juillet.
function _pcavN1(c,mil){
  if(!_pcavHas('_mlChaine')) return '';
  var _m=(mil!=null)?mil:(c.milAff!=null?c.milAff:c.mil);
  var cur=null; try{ cur=window._mlChaine(_m); }catch(e){ _pcavLog('n1cur',e); return ''; }
  if(!cur) return '';
  var p=null; try{ p=window._mlChaine(_m-1); }catch(e){ _pcavLog('n1',e); return ''; }
  if(!p||(!p.hlDecuve&&!p.kg&&!p.futs)) return '';
  var rows='';
  function ligne(lab,now,old,unit,hautEstBon){
    if(now==null||old==null||!old) return;
    var d=now-old, pct=Math.round(d/old*100), bon=hautEstBon?(d>=0):(d<=0);
    rows+='<div class="pcav-cmp"><div><div class="pcav-cl">'+_pilEsc(lab)+'</div>'
      +'<div class="pcav-cnow">'+_pcavF1(now)+' <small>'+_pilEsc(unit)+'</small></div></div>'
      +'<div><span class="pcav-dl '+(bon?'ok':'wa')+'">'+(d>=0?'+':'')+pct+' %</span></div>'
      +'<div class="pcav-cold">l’an dernier<br><b>'+_pcavF1(old)+' '+_pilEsc(unit)+'</b></div></div>';
  }
  var rNow=(cur.ha>0)?cur.hlDecuve/cur.ha:null;
  var rOld=(p.ha>0)?p.hlDecuve/p.ha:null;
  ligne('Rendement moyen',rNow,rOld,'hL/ha',true);
  var pNow=(cur.hlDecuve>0&&cur.hlFut>0)?(cur.hlDecuve-cur.hlFut)/cur.hlDecuve*100:null;
  var pOld=(p.hlDecuve>0&&p.hlFut>0)?(p.hlDecuve-p.hlFut)/p.hlDecuve*100:null;
  ligne('Perte benne → fût',pNow,pOld,'%',false);
  ligne('Raisin rentré',cur.kg/1000,p.kg/1000,'t',true);
  if(!rows) return '';
  return _pcavCard('\uD83D\uDD70\uFE0F','#8A5A38','Face à l’an dernier',
    'campagne '+(_m-1)+'-'+_m, rows,
    'Comparaison par campagne, du 1<sup>er</sup> août au 31 juillet — le même axe que les Archives. Le rendement moyen ne porte que sur les parcelles réellement récoltées.');
}

// ── Onglet 2 : assemblage ────────────────────────────────────────────
function _pcavVueMillesime(c){
  var l=_pcavMils(c);
  // Le millesime ouvert : celui choisi s'il a encore de la matiere, sinon le
  // plus recent qui en a. On ne se fige jamais sur un millesime disparu.
  var sel=null;
  if(_PCAV_MIL!=null) l.forEach(function(x){ if(x.mil===_PCAV_MIL) sel=x; });
  if(!sel&&l.length) sel=l[0];
  var ch=sel?sel.ch:(_pcavMatiere(c.chaine)?c.chaine:null);
  var mil=sel?sel.mil:c.milAff;
  var h=_pcavBandeau(l, mil);
  if(ch){
    h+='<div class="pcav-card"><div class="pcav-kg">'
      +_pcavK('Surface récoltée',_pcavF1(ch.ha),'ha',(ch.parcelles||0)+' parcelles',1)
      +_pcavK('Raisin rentré',_pcavF1((ch.kg||0)/1000),'t',ch.kgVendu?('dont '+_pcavInt(ch.kgVendu)+' kg vendus'):'')
      +_pcavK('Rendement moyen',(ch.ha>0?_pcavF1(ch.hlDecuve/ch.ha):'—'),'hL/ha','sur les parcelles récoltées')
      +_pcavK('Au chai',_pcavF1(ch.hlFut),'hL',(ch.futs||0)+' barriques')
      +'</div></div>';
  }
  try{ h+=_pcavFlux(c,ch,mil)||''; }catch(e){ _pcavLog('flux',e); }
  try{ h+=_pcavRdt(c,mil)||''; }catch(e){ _pcavLog('rdt',e); }
  try{ h+=_pcavN1(c,mil)||''; }catch(e){ _pcavLog('n1',e); }
  if(!h) h='<div class="pcav-vide">Aucune donnée de millésime pour la campagne '+c.mil+'-'+(c.mil+1)+'.<br>Le Cuvier alimente cet écran dès la première récolte saisie.</div>';
  else if(l.length===1&&l[0].mil!==c.mil) h+='<div class="pcav-note"><span>\uD83D\uDD52</span><div>Le millésime <b>'+c.mil+'</b> n’est pas encore rentré. Cet écran montre le <b>'+l[0].mil+'</b>, celui qui est en cave.</div></div>';
  return h;
}

// ── Onglet 3 : le parc & le cout ─────────────────────────────────────
function _pcavEtat(c){
  var p=c.parc; if(!p) return '';
  var hl=p.occupes*c.futL/100;
  var k='<div class="pcav-kg">'
    +_pcavK('Parc total',p.parc,'','barriques du domaine',1)
    +_pcavK('En vin',p.occupes,'',_pcavF1(hl)+' hL logés')
    +_pcavK('Libres',p.libres,'',p.neufs?('dont '+p.neufs+' neuve'+(p.neufs>1?'s':'')):'')
    +_pcavK('Au-delà de '+p.vie+' vins',p.aReformer,'','à renouveler',0,p.aReformer?'var(--orange)':null)
    +'</div>';
  var mv=p.mouv||{entrees:0,sorties:0};
  return _pcavCard('\uD83D\uDEE2\uFE0F','#8A5A38','État du parc',
    '+'+(mv.entrees||0)+' / −'+(mv.sorties||0)+' cette année', k,
    'Le parc additionne les fûts libres de La Réserve et les fûts en vin du Chai. Entonner, embouteiller ou retirer d’une cuvée ne change pas ce total : seuls acheter et se séparer le font varier.');
}

function _pcavPyramide(c){
  var p=c.parc; if(!p||!p.lignes||!p.lignes.length) return '';
  var max=0; p.lignes.forEach(function(l){ if(l.total>max) max=l.total; });
  if(max<=0) return '';
  var rows=p.lignes.map(function(l){
    var w=Math.max(6,Math.min(100,Math.round(l.total/max*100)));
    var col=(l.vins===0)?'#5B9B3A':(l.reforme?'#A0291E':'#8A5A38');
    var wv=l.total?Math.round(l.enVin/l.total*100):0;
    var age=(l.annee==null)?'origine inconnue':(l.vins===0?'neuf':l.vins+' vin'+(l.vins>1?'s':''));
    return '<div class="pcav-pl"><div class="pcav-py">'+(l.annee==null?'—':l.annee)+'<small>'+age+'</small></div>'
      +'<div class="pcav-pt2" style="width:'+w+'%"><div class="pcav-ps" style="width:'+wv+'%;background:'+col+'"></div>'
      +'<div class="pcav-ps" style="width:'+(100-wv)+'%;background:'+col+';opacity:.28"></div></div>'
      +'<div class="pcav-pn">'+l.enVin+' en vin · '+l.libres+' libre'+(l.libres>1?'s':'')+'</div></div>';
  }).join('');
  var leg='<div class="pcav-leg"><span><i style="background:#5B9B3A"></i>neuf</span>'
    +'<span><i style="background:#8A5A38"></i>en cours de vie</span>'
    +'<span><i style="background:#A0291E"></i>au-delà de '+p.vie+' vins</span>'
    +'<span><i style="background:#8A5A38;opacity:.28"></i>partie libre, quel que soit l’âge</span></div>';
  return _pcavCard('\uD83D\uDCCA','#B85A1A','Pyramide des âges','<b>'+p.parc+'</b> barriques',
    '<div class="pcav-pyr">'+rows+leg+'</div>',
    'L’âge se compte en année civile moins année d’achat : la vendange tombe en septembre, donc l’incrément du 1<sup>er</sup> janvier arrive après le millésime.');
}

// ── Part des anges : une mesure, avec sa reserve ecrite a l'ecran ────
function _pcavAngesCard(c){
  var a=c.anges;
  if(!a) return _pcavCard('\u23F3','#A0291E','Part des anges','\u2014',
    '<div class="pcav-vide">Aucun volume d\u2019ouillage saisi sur les douze derniers mois.<br>Renseignez le volume total \u00e0 chaque ouillage : cet \u00e9cran mesurera alors ce que l\u2019\u00e9levage vous co\u00fbte r\u00e9ellement.</div>','');
  var rows='';
  a.lignes.forEach(function(x){
    var lbl=(x.mil==='?')?'Sans mill\u00e9sime':x.mil;
    var pct=(x.pctAn==null)?'\u2014':(_pcavF1(x.pctAn)+' %/an');
    rows+='<div class="pcav-agr">'
      +'<div class="pcav-agm">'+_pilEsc(lbl)+'<small>'+x.ops+' ouillage'+(x.ops>1?'s':'')+' \u00b7 '+x.futs+' f\u00fbts</small></div>'
      +'<div class="pcav-agv">'+_pcavF1(x.hlPerdu)+' <small>hL remis</small></div>'
      +'<div class="pcav-agp">'+pct+'</div></div>';
  });
  if(a.nonVentile>0){
    rows+='<div class="pcav-agr"><div class="pcav-agm" style="color:var(--texte-doux)">Non ventil\u00e9<small>'
      +a.nonVentile+' op\u00e9ration'+(a.nonVentile>1?'s':'')+' couvrant plusieurs mill\u00e9simes</small></div>'
      +'<div class="pcav-agv" style="color:var(--texte-doux)">\u2014</div><div class="pcav-agp">\u2014</div></div>';
  }
  if(!rows) rows='<div class="pcav-vide">Les ouillages des douze derniers mois ne se rattachent \u00e0 aucune cuv\u00e9e encore en \u00e9levage.</div>';
  var stat=a.lignes.length?('<b>'+_pcavF1(a.hlPerdu)+'</b> hL sur douze mois'):'\u2014';
  return _pcavCard('\u23F3','#A0291E','Part des anges', stat, '<div class="pcav-agt">'+rows+'</div>',
    'Ce que vous remettez en ouillage est exactement ce qui s\u2019est \u00e9vapor\u00e9 : c\u2019est une mesure, pas une valeur th\u00e9orique. Chaque mill\u00e9sime a sa ligne \u2014 on n\u2019ouille pas les f\u00fbts d\u2019une ann\u00e9e avec le vin d\u2019une autre. \u26a0\ufe0f Un soutirage retire aussi du volume, sans \u00eatre une \u00e9vaporation.');
}

function _pcavMouv(c){
  var p=c.parc; if(!p||!p.mouv||!p.mouv.lignes||!p.mouv.lignes.length) return '';
  var M=(typeof MV_FUT_MOTIFS!=='undefined')?MV_FUT_MOTIFS:(window.MV_FUT_MOTIFS||{});
  var rows=p.mouv.lignes.slice(0,8).map(function(m){
    var d=M[m.motif]||{lbl:m.motif,sens:m.sens,ico:''};
    var pt=(m.sens==='entree')?'ok':(m.motif==='destruction'?'red':'amb');
    var quoi=[m.four,m.ref,m.annee].filter(function(x){ return x; }).join(' · ');
    return _pcavRow(pt,'<b>'+(m.sens==='entree'?'+':'−')+m.nb+' barrique'+(m.nb>1?'s':'')+'</b> — '+_pilEsc(d.lbl)
      +(quoi?_pcavSub(_pilEsc(quoi)):''), _pilDfr(m.date),'','','');
  }).join('');
  var n=p.mouv.lignes.length;
  return _pcavCard('\uD83D\uDDC3\uFE0F','#3D5166','Mouvements',
    '+'+(p.mouv.entrees||0)+' / −'+(p.mouv.sorties||0), rows,
    (n>8?('8 mouvements affichés sur '+n+'. '):'')+'Le registre explique exactement l’écart entre deux inventaires. Il ne se purge jamais.');
}

function _pcavVueParc(c){
  var h='';
  // ⚠ La part des anges se calcule sur les FUTS DES CUVEES, pas sur le parc :
  // elle reste disponible meme si l'inventaire de La Reserve est vide. La
  // sortir de la garde evite de la perdre pour une raison sans rapport.
  if(!c.parc){
    try{ h+=_pcavAngesCard(c)||''; }catch(e){ _pcavLog('anges',e); }
    return h+'<div class="pcav-vide">Le parc à fûts n’est pas disponible.<br>Il se construit à partir de l’inventaire de La Réserve et des barriques en vin du Chai.</div>';
  }
  try{ h+=_pcavEtat(c)||''; }catch(e){ _pcavLog('etat',e); }
  try{ h+=_pcavPyramide(c)||''; }catch(e){ _pcavLog('pyramide',e); }
  try{ h+=_pcavAngesCard(c)||''; }catch(e){ _pcavLog('angescard',e); }
  try{ h+=_pcavMouv(c)||''; }catch(e){ _pcavLog('mouv',e); }
  h+='<div class="pcav-note"><span>\uD83D\uDCB6</span><div><b>Aucun euro n’est affiché.</b> Le prix moyen d’une barrique n’est pas renseigné dans vos réglages Cave. Renseignez-le et cet écran chiffrera le renouvellement ; sinon le plan reste exprimé en nombre de fûts.</div></div>';
  return h;
}

// ── CSS du module. Injecte ici, comme le fait deja le bloc `pec-` : ──
// styles.css n'est pas touche, donc AUCUN bump (pilotage.js seul).
function _pcavInjectCss(){
  if(document.getElementById('pcav-css')) return;
  var css=''
  +'.pcav-verdict{background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:15px;box-shadow:var(--shadow-sm);padding:22px 24px 20px;margin-bottom:16px}'
  +'.pcav-vk{display:flex;align-items:center;gap:10px;font-size:10.5px;font-weight:600;letter-spacing:2.2px;text-transform:uppercase;color:var(--texte-doux);flex-wrap:wrap}'
  +'.pcav-vbig{font-family:\'Cormorant Garamond\',Georgia,serif;font-weight:600;font-size:40px;line-height:1.04;margin:6px 0 5px;color:var(--texte)}'
  +'.pcav-vsub{font-size:13.5px;color:var(--texte-med);line-height:1.55;max-width:620px}'
  +'.pcav-vsub b{color:var(--texte);font-weight:600}'
  +'.pcav-card{background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:15px;box-shadow:var(--shadow-sm);overflow:hidden;margin-bottom:16px}'
  +'.pcav-h{display:flex;align-items:center;gap:10px;padding:13px 16px;min-height:44px;border-bottom:1px solid var(--gris-clair)}'
  +'.pcav-dot{width:7px;height:7px;border-radius:50%;flex:none}'
  +'.pcav-ico{width:28px;height:28px;border-radius:9px;background:var(--or-pale);display:flex;align-items:center;justify-content:center;flex:none;font-size:14px}'
  +'.pcav-t{font-size:11px;letter-spacing:1.4px;text-transform:uppercase;font-weight:600;color:var(--texte-doux);flex:1}'
  +'.pcav-stat{font-size:11.5px;color:var(--texte-doux);font-weight:600;white-space:nowrap}'
  +'.pcav-stat b{color:var(--texte)}'
  +'.pcav-b{padding:2px 0}'
  +'.pcav-mini{font-size:11.5px;color:var(--texte-doux);padding:2px 17px 14px;line-height:1.55}'
  +'.pcav-row{display:flex;align-items:center;gap:13px;padding:12px 17px;border-top:1px solid var(--gris-clair);font-size:13px;color:var(--texte-med)}'
  +'.pcav-row:first-child{border-top:none}'
  +'.pcav-row b{color:var(--texte);font-weight:600}'
  +'.pcav-rm{flex:1;min-width:0}'
  +'.pcav-sub{font-size:11.5px;color:var(--texte-doux);margin-top:2px;line-height:1.45}'
  +'.pcav-pt{width:8px;height:8px;border-radius:50%;flex:none}'
  +'.pcav-pt.red{background:var(--rouge);box-shadow:0 0 0 3px var(--rouge-pale)}'
  +'.pcav-pt.amb{background:var(--orange);box-shadow:0 0 0 3px var(--orange-pale)}'
  +'.pcav-pt.ok{background:var(--vert-med);box-shadow:0 0 0 3px var(--vert-pale)}'
  +'.pcav-when{font-size:11px;color:var(--texte-doux);white-space:nowrap}'
  +'.pcav-act{border:1px solid var(--gris);background:var(--bg-card);border-radius:9px;padding:7px 12px;font-family:inherit;font-size:11.5px;font-weight:600;color:var(--terre);cursor:pointer;white-space:nowrap;min-height:38px}'
  +'.pcav-act:hover{background:var(--or-pale);border-color:var(--or)}'
  +'.pcav-kg{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;padding:16px}'
  +'.pcav-k{background:var(--or-pale);border:1px solid rgba(194,161,77,.28);border-radius:12px;padding:12px 14px}'
  +'.pcav-kl{font-size:10px;letter-spacing:1.3px;text-transform:uppercase;color:var(--texte-doux);font-weight:600}'
  +'.pcav-kv{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:28px;font-weight:600;color:var(--texte);line-height:1.05;margin-top:3px}'
  +'.pcav-kv small{font-size:14px;color:var(--texte-doux);font-weight:500}'
  +'.pcav-ks{font-size:11px;color:var(--texte-doux);margin-top:2px;line-height:1.4}'
  +'.pcav-k.dark{background:var(--cave);border-color:var(--cave)}'
  +'.pcav-k.dark .pcav-kl,.pcav-k.dark .pcav-ks{color:rgba(240,226,200,.55)}'
  +'.pcav-k.dark .pcav-kv{color:#F0E2C8}'
  +'.pcav-k.dark .pcav-kv small{color:rgba(240,226,200,.55)}'
  +'.pcav-flux{padding:18px 20px}'
  +'.pcav-fs{display:grid;grid-template-columns:118px 1fr;gap:14px;align-items:center;margin-bottom:4px}'
  +'.pcav-fn{font-size:11.5px;font-weight:600;color:var(--texte-med);text-align:right}'
  +'.pcav-fn small{display:block;font-size:10px;color:var(--texte-doux);font-weight:500}'
  +'.pcav-fw{height:38px;display:flex;align-items:center}'
  +'.pcav-fb{height:32px;border-radius:8px;background:linear-gradient(90deg,#7A1020,#B23A52);display:flex;align-items:center;padding-left:12px;color:#F0E2C8;font-size:12.5px;font-weight:600;min-width:74px;box-sizing:border-box}'
  +'.pcav-fb.g{background:linear-gradient(90deg,#2D5016,#5B9B3A)}'
  +'.pcav-fb.o{background:linear-gradient(90deg,#8A5A38,#C2871E)}'
  +'.pcav-fl{display:grid;grid-template-columns:118px 1fr;gap:14px;margin:1px 0 5px}'
  +'.pcav-fl div:last-child{font-size:11px;color:var(--orange);font-weight:600}'
  +'.pcav-pyr{padding:14px 18px 16px}'
  +'.pcav-pl{display:grid;grid-template-columns:82px 1fr 104px;gap:10px;align-items:center;margin-bottom:7px;font-size:12px}'
  +'.pcav-py{color:var(--texte-med);font-weight:600;line-height:1.2}'
  +'.pcav-py small{color:var(--texte-doux);font-weight:500;display:block;font-size:10px}'
  +'.pcav-pt2{height:22px;background:var(--gris-clair);border-radius:6px;overflow:hidden;display:flex;position:relative}'
  +'.pcav-ps{height:100%}'
  +'.pcav-pmax{position:absolute;left:86.96%;top:0;bottom:0;width:2px;background:var(--texte);opacity:.5}'
  +'.pcav-pn{font-size:11.5px;color:var(--texte-doux);text-align:right;font-weight:600}'
  +'.pcav-leg{display:flex;gap:14px;flex-wrap:wrap;font-size:11px;color:var(--texte-doux);margin-top:12px;padding-top:12px;border-top:1px solid var(--gris-clair)}'
  +'.pcav-leg span{display:inline-flex;align-items:center;gap:6px}'
  +'.pcav-leg i{width:11px;height:11px;border-radius:3px;display:inline-block}'
  +'.pcav-cmp{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;padding:13px 17px;border-top:1px solid var(--gris-clair);font-size:12.5px}'
  +'.pcav-cmp:first-child{border-top:none}'
  +'.pcav-cl{font-size:10.5px;letter-spacing:1.4px;text-transform:uppercase;color:var(--texte-doux);font-weight:600}'
  +'.pcav-cnow{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:24px;font-weight:600;color:var(--texte);line-height:1.1}'
  +'.pcav-cnow small{font-size:13px;color:var(--texte-doux)}'
  +'.pcav-cold{color:var(--texte-doux);text-align:right;font-size:11px;line-height:1.5}'
  +'.pcav-cold b{color:var(--texte-med)}'
  +'.pcav-dl{font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;white-space:nowrap}'
  +'.pcav-dl.ok{background:var(--vert-pale);color:var(--vert-med)}'
  +'.pcav-dl.wa{background:var(--orange-pale);color:var(--orange)}'
  +'.pcav-note{background:var(--or-pale);border:1px solid rgba(194,161,77,.4);border-radius:12px;padding:12px 15px;font-size:12.5px;color:var(--texte-med);display:flex;gap:10px;align-items:flex-start;line-height:1.5;margin-bottom:16px}'
  +'.pcav-note b{color:var(--texte)}'
  +'.pcav-vide{padding:26px 20px;text-align:center;font-size:13px;color:var(--texte-doux);line-height:1.6}'
  +'.pcav-milg{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;padding:16px}'
  +'.pcav-mil{position:relative;text-align:left;border:1px solid var(--gris-clair);background:var(--bg-card);border-radius:12px;padding:12px 14px 12px 16px;cursor:pointer;font-family:inherit;min-height:44px;transition:.15s;display:block;width:100%}'
  +'.pcav-mil:hover{border-color:var(--or);background:var(--or-pale)}'
  +'.pcav-mil.on{background:var(--cave);border-color:var(--cave)}'
  +'.pcav-milp{position:absolute;left:0;top:10px;bottom:10px;width:4px;border-radius:0 3px 3px 0}'
  +'.pcav-mila{display:block;font-family:\'Cormorant Garamond\',Georgia,serif;font-size:26px;font-weight:600;color:var(--texte);line-height:1.05}'
  +'.pcav-mil.on .pcav-mila{color:#F0E2C8}'
  +'.pcav-milf{display:block;font-size:10px;letter-spacing:1.3px;text-transform:uppercase;font-weight:600;color:var(--texte-doux);margin-top:2px}'
  +'.pcav-mil.on .pcav-milf{color:var(--or)}'
  +'.pcav-milv{display:block;font-size:11.5px;color:var(--texte-doux);margin-top:3px}'
  +'.pcav-mil.on .pcav-milv{color:rgba(240,226,200,.6)}'
  +'.pcav-agt{padding:4px 0}'
  +'.pcav-agr{display:grid;grid-template-columns:1fr auto 78px;gap:12px;align-items:center;padding:11px 17px;border-top:1px solid var(--gris-clair)}'
  +'.pcav-agr:first-child{border-top:none}'
  +'.pcav-agm{font-size:13px;font-weight:600;color:var(--texte);line-height:1.25}'
  +'.pcav-agm small{display:block;font-size:11px;color:var(--texte-doux);font-weight:500;margin-top:1px}'
  +'.pcav-agv{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:22px;font-weight:600;color:var(--texte);white-space:nowrap}'
  +'.pcav-agv small{font-family:inherit;font-size:11px;color:var(--texte-doux);font-weight:500}'
  +'.pcav-agp{font-size:12.5px;font-weight:600;color:var(--orange);text-align:right;white-space:nowrap}'
  +'.pcav-grp{display:flex;align-items:baseline;gap:9px;padding:10px 17px 5px;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;font-weight:600;color:var(--terre);border-top:1px solid var(--gris-clair)}'
  +'.pcav-grp:first-child{border-top:none}'
  +'.pcav-grp span{font-size:10.5px;letter-spacing:0;text-transform:none;color:var(--texte-doux);font-weight:500}'
  +'.pcav-mal{padding:14px 18px 16px;border-top:1px solid var(--gris-clair)}'
  +'.pcav-mrow{display:grid;grid-template-columns:126px 1fr 52px;gap:12px;align-items:end;margin-bottom:14px}'
  +'.pcav-mn{font-size:11.5px;font-weight:600;color:var(--texte-med);line-height:1.25;padding-bottom:2px}'
  +'.pcav-mn small{display:block;font-size:10px;color:var(--texte-doux);font-weight:500}'
  +'.pcav-mg{position:relative;height:56px;border-bottom:1px solid var(--gris);background:linear-gradient(180deg,rgba(0,0,0,.012),transparent)}'
  +'.pcav-mbar{position:absolute;bottom:0;width:9px;margin-left:-4px;border-radius:3px 3px 0 0;min-height:3px}'
  +'.pcav-msl{position:absolute;left:0;right:0;height:1px;background:var(--vert-med);opacity:.65}'
  +'.pcav-mj{font-size:11px;color:var(--texte-doux);text-align:right;font-weight:600;padding-bottom:2px}'
  +'.pcav-mleg{font-size:11px;color:var(--texte-doux);line-height:1.5;padding-top:10px;border-top:1px solid var(--gris-clair)}'
  +'@media(max-width:600px){'
  +'.pcav-vbig{font-size:31px}'
  +'.pcav-fs,.pcav-fl{grid-template-columns:80px 1fr;gap:10px}'
  +'.pcav-pl{grid-template-columns:64px 1fr 86px;gap:8px}'
  +'.pcav-act{padding:7px 9px;font-size:11px}'
  +'.pcav-cmp{grid-template-columns:1fr auto;row-gap:6px}'
  +'.pcav-cold{grid-column:1/-1;text-align:left}'
  +'.pcav-mrow{grid-template-columns:92px 1fr 44px;gap:8px}'
  +'.pcav-agr{grid-template-columns:1fr auto;row-gap:4px}'
  +'.pcav-agp{grid-column:1/-1;text-align:left}'
  +'}';
  var st=document.createElement('style');
  st.id='pcav-css'; st.textContent=css;
  document.head.appendChild(st);
}

// ── L'onglet ─────────────────────────────────────────────────────────
// Millesime ouvert dans l'onglet. null = celui que le contexte a retenu.
var _PCAV_MIL=null;
var _PCAV_SUBS=[['urg','\u23F1\uFE0F','Ce qui presse'],['mil','\uD83C\uDF47','Le millésime'],['parc','\uD83D\uDEE2\uFE0F','Le parc']];
function _pilTabCav(d){
  _pcavInjectCss();
  var sub=_PIL_CAVSUB;
  var nav='<div class="pil-subnav" id="pil-cavnav">'+_PCAV_SUBS.map(function(s){
    return '<button data-s="'+s[0]+'"'+(sub===s[0]?' class="on"':'')+'>'+s[1]+' '+_pilEsc(s[2])+'</button>';
  }).join('')+'</div>';
  var c, body;
  try{ c=_pcavCtx(d); }catch(e){ c=null; }
  if(!c) return nav+'<div class="pcav-vide">La Cave n’est pas disponible sur cet appareil.<br>Rechargez l’application.</div>';
  try{
    if(sub==='mil') body=_pcavVueMillesime(c);
    else if(sub==='parc') body=_pcavVueParc(c);
    else body=_pcavVuePresse(c);
  }catch(e){
    window.logError&&window.logError({level:'error',cat:'pilotage',msg:'onglet cave',err:e});
    body='<div class="pcav-vide">Cet écran n’a pas pu se construire.<br>L’incident a été enregistré.</div>';
  }
  return nav+body;
}

// ════════════════════════════════════
// Économie (coût/ha par parcelle) + Conformité (cuivre · passages/IFT · DRE)
// Lecture seule. Aucune écriture en base. Taux/prix/référence saisis dans
// Réglages › Domaine (CONFIG.eco / CONFIG.conformite).
// ════════════════════════════════════

// ── Économie : config (lecture) ──
function _ecoCfg(){
  var e=(window.CONFIG&&window.CONFIG.eco)||{};
  return {
    // Barème par type de contrat : conservé en REPLI seulement. Le taux de référence
    // est désormais individuel (fiche membre → collection `paie`).
    taux:(e.taux_horaire&&typeof e.taux_horaire==='object')?e.taux_horaire:{},
    // Prix du litre = moyenne PONDÉRÉE des appoints de cuve (Tracteur › Entretien),
    // avec repli sur l'ancien champ manuel de Réglages. 0 = non renseigné.
    // ⚠️ `paie` est admin-only en LECTURE : un profil `pilotage` non-admin lit 0 ici
    //    et voit le coût GNR à zéro — c'est voulu (prix d'achat = donnée de gestion).
    gnrL:(window._mvPaieGnrPMP?Number(window._mvPaieGnrPMP()):0)||Number(e.prix_gnr_litre)||0,
    conso:(e.conso_gnr_lh!=null?Number(e.conso_gnr_lh):6)||0
    // ⚠️⚠️ DEFINITION DU TAUX HORAIRE — UNE SEULE, VALABLE PARTOUT.
    //   Le taux d'une fiche membre (collection `paie`, saisi dans Reglages > Equipe) est
    //   un TAUX CHARGE : le COUT EMPLOYEUR a l'heure, cotisations patronales comprises.
    //   C'est ce que le champ demande mot pour mot : « Taux horaire chargé (coût
    //   employeur, € par heure) ».
    //   => AUCUN coefficient de charges ne doit etre applique par-dessus. Il en a existe
    //   un (CONFIG.eco.coef_charges) qui multipliait ce taux dans l'exercice comptable en
    //   le presentant comme un brut : sur un domaine ayant saisi ses taux comme demande,
    //   il comptait les cotisations DEUX FOIS (~+45 % de masse salariale fantome), et un
    //   bandeau invitait meme a le renseigner. Lecteur, ecriture et libelles supprimes.
    //   Une valeur `coef_charges` restee en base est desormais INERTE : plus personne ne
    //   la lit. Ne pas la reintroduire — si un jour un domaine saisit des taux BRUTS, ce
    //   qu'il faut ajouter est un interrupteur explicite « mes taux sont bruts / charges »,
    //   pas un multiplicateur qui devine ce qu'il y a dans le nombre.
  };
}
var _ECO_CONTRATS=['G\u00e9rant','CDI','CDD','TESA','Apprenti','Saisonnier','Extra'];
function _ecoEur(n){ return (Math.round(Number(n)||0)).toLocaleString('fr-FR')+' \u20AC'; }
function _ecoEur2(n){ return (Math.round((Number(n)||0)*100)/100).toLocaleString('fr-FR',{minimumFractionDigits:0,maximumFractionDigits:2}); }
function _ecoH1(h){ return (Math.round((Number(h)||0)*10)/10).toLocaleString('fr-FR'); }
// Taux horaire moyen de l'équipe de terrain (hors bureau) : moyenne des taux
// configurés des membres actifs. Repli : moyenne des taux saisis. 0 = non configuré.
function _ecoRate(){
  var taux=_ecoCfg().taux;
  // Taux INDIVIDUEL (fiche membre → collection `paie`) en priorité, barème par type
  // de contrat en repli. La moyenne reste nécessaire : le coût MO d'une parcelle est
  // un budget de saison (heures théoriques), on ne sait pas QUI fera QUELLE parcelle.
  var P=(window._mvPaie?window._mvPaie():(window.PAIE||{}));
  var indiv=(P&&P.taux&&typeof P.taux==='object')?P.taux:{};
  // ⚠ La bonne question ici est « qui fait la CAMPAGNE ? », pas « qui est la aujourd'hui ? » :
  // le cout MO d'une parcelle est un budget de saison. Filtrer a la date du jour ecartait
  // les contrats deja termines — le 03/08/2026 sur un domaine reel il ne restait qu'UNE
  // personne, et tout le cout du travail etait chiffre sur son seul taux.
  // ⚠ REPLI OBLIGATOIRE : periode non datee ou liste vide -> on retombe sur l'ancien
  // calcul (tous les actifs hors bureau), sinon le cout du travail s'afficherait a ZERO.
  var _tousActifs=(window.MEMBRES||[]).filter(function(m){ return m && m.statut!=='Inactif' && !m.bureau; });
  var _saR=(typeof window._pilSaison==='function')?window._pilSaison():null;
  var _d0R=(_saR&&_saR.debut)||'', _d1R=(_saR&&_saR.fin)||'';
  var membres=(_d0R && _d1R && typeof window._mvEnContratSurPeriode==='function')
    ? (window.MEMBRES||[]).filter(function(m){ return window._mvEnContratSurPeriode(m,_d0R,_d1R); })
    : [];
  if(!membres.length) membres=_tousActifs;
  var sum=0,n=0;
  membres.forEach(function(m){
    var r=Number(indiv[m.nom])||0;
    if(!(r>0)) r=Number(taux[m.type_contrat||'CDI'])||0;
    if(r>0){ sum+=r; n++; }
  });
  if(n>0) return sum/n;
  var vals=_ECO_CONTRATS.map(function(k){ return Number(taux[k])||0; }).filter(function(v){ return v>0; });
  return vals.length ? vals.reduce(function(a,b){return a+b;},0)/vals.length : 0;
}
function _ecoAllDefs(){ var a=(typeof window.getTachesSaison==='function')?window.getTachesSaison():(window.TACHES||[]); return (a||[]).slice(); }
// Heures MO vigne (budget de la saison consultée) pour une parcelle : somme des
// tâches applicables via _opParcFull (surface × h/ha, passages/niveaux, tarière).
function _ecoParcMOh(p){
  var s=0; _ecoAllDefs().forEach(function(def){ if(def && _opApplic(p,def)) s+=_opParcFull(p,def); });
  return s;
}
// Entreplantation par parcelle : trous renseignés (tarière ou saisie) → heures → €.
// SOUS-ENSEMBLE de _ecoParcMOh (mêmes défs, même formule) : ces heures sont déjà
// comptées dans moh, on les isole pour les afficher et donner un coût au plant.
// Aucun double compte : jamais additionné au total.
function _ecoParcPlant(p){
  // BUG CORRIGE : le nombre de trous est une propriete de la PARCELLE, pas de la
  // tache. Des que deux taches sont pilotees par les trous (complantation ET
  // plantation), l'ancienne boucle additionnait `plantation_trous` une fois par
  // tache et affichait le DOUBLE de plants reellement mis en terre. Les HEURES,
  // elles, restent la somme par tache : c'est ce que fait _opParcFull, et les deux
  // doivent rester d'accord sous peine de faire diverger le budget et son detail.
  var n=parseInt(p.plantation_trous)||0, h=0, nT=0;
  if(n>0) _ecoAllDefs().forEach(function(def){
    if(!def || !def.trous || !_opApplic(p,def)) return;
    nT++; h+=n*_opMinTrou(def)/60;
  });
  return { trous:(nT>0?n:0), h:h, nTaches:nT };
}
// Minutes par plant du domaine (CONFIG.plantation_min_trou, défaut 3).
function _ecoMinTrou(){ return _opMinTrou(null); }


// Heures tracteur RÉALISÉES par parcelle (saison consultée), depuis les sessions.
// Miroir de _tractHoursSeason ventilé par parcelle (préfère dmin/60 si chrono).
// ── Équipe RÉELLE par parcelle (journal) ─────────────────────────
// Le coût MO d'une parcelle était « heures de barème × taux MOYEN du domaine » :
// deux parcelles faites par des équipes très différentes coûtaient pareil. Le journal
// sait qui était où : `qui` (le validateur) + `membresEquipe`. On en tire un effectif
// et un taux PON DÉRÉ par les personnes réellement venues. Repli explicite sur le taux
// moyen (_ecoRate) quand la parcelle n'a aucune entrée — le badge le dit à l'écran.
// ⚠️ Le journal dit QUI et QUAND, jamais COMBIEN D'HEURES. Une personne présente sur
//    3 parcelles le même jour compte 1/3 de journée sur chacune : c'est la seule
//    convention inventée ici, elle est assumée et annoncée sous le tableau.
function _ecoEquipeByParc(){
  var out={};
  var s=(typeof window._pilSaison==='function')?window._pilSaison():null;
  var seasonNom=(s&&s.nom)?s.nom:'';
  function _in(j){
    var sn=(window._saisonForDate&&j.date)?window._saisonForDate(j.date):null; sn=sn||j.saison||'';
    if(sn) return sn===seasonNom;
    return seasonNom===(((window.getSaisonActive&&window.getSaisonActive())||{}).nom||'');
  }
  var byNom={}; (window.MEMBRES||[]).forEach(function(m){ if(m&&m.nom) byNom[m.nom]=m; });
  var per={}, spread={};
  (window.JOURNAL||[]).forEach(function(j){
    if(!j||j.meteo||j.statut!=='Valid\u00e9'||!j.parcelle||!j.date) return;
    if(!_in(j)) return;
    var noms=[]; if(j.qui) noms.push(j.qui);
    (j.membresEquipe||[]).forEach(function(n){ if(n && noms.indexOf(n)<0) noms.push(n); });
    if(!noms.length) return;
    var k=j.parcelle;
    if(!per[k]) per[k]={jours:{}, noms:{}};
    if(!per[k].jours[j.date]) per[k].jours[j.date]=[];
    noms.forEach(function(n){
      if(per[k].jours[j.date].indexOf(n)<0) per[k].jours[j.date].push(n);
      per[k].noms[n]=1;
      var sk=n+'\u0000'+j.date;
      if(!spread[sk]) spread[sk]={};
      spread[sk][k]=1;
    });
  });
  Object.keys(per).forEach(function(k){
    var e=per[k], dates=Object.keys(e.jours), jh=0, sum=0, wt=0;
    dates.forEach(function(dt){
      e.jours[dt].forEach(function(n){
        var nb=Object.keys(spread[n+'\u0000'+dt]||{}).length||1;
        // POIDS : une equipe collective (vendange) vaut son effectif, pas 1. Sans lui,
        // une parcelle vendangee par 30 personnes comptait UNE journee-homme — l'ecart
        // « cadence reelle vs bareme » etait donc faux d'un facteur 30 sur ces
        // parcelles — et son taux etait la moyenne simple du chef et de l'equipe au
        // lieu d'etre, a juste titre, celui de l'equipe.
        var pw=(typeof window._mvPoidsNom==='function')?window._mvPoidsNom(n):1;
        var w=pw/nb;
        jh+=w;
        var m=byNom[n], r=(m&&window._mvPaieTauxEff)?Number(window._mvPaieTauxEff(m)):0;
        if(r>0){ sum+=r*w; wt+=w; }
      });
    });
    out[k]={ etp:dates.length?jh/dates.length:0, jh:jh, nj:dates.length,
             taux:(wt>0?sum/wt:0), noms:Object.keys(e.noms) };
  });
  return out;
}

// ── Surcoût de retard par parcelle ───────────────────────────────
// Une tâche finie hors de sa fenêtre coûte plus d'heures : la vigne a poussé, on
// démêle au lieu de relever. Barème CONFIG.eco.pen_retard_sem % par semaine de
// dépassement, plafonné à CONFIG.eco.pen_plafond %. Fenêtre = cd.taskWindows
// (paramétrable dans Pilotage › Paramétrage), fin réelle = dernière validation.
// ⚠️ Ce surcoût est MODÉLISÉ, pas payé. Il est calculé et affiché À PART, jamais
//    fondu dans le coût MO : une heure payée et une heure supposée ne se mélangent pas.
function _ecoRetardCfg(){
  var e=(window.CONFIG&&window.CONFIG.eco)||{};
  var p=Number(e.pen_retard_sem); if(!(isFinite(p)&&p>=0)) p=5;
  var c=Number(e.pen_plafond);    if(!(isFinite(c)&&c>0))  c=50;
  return { sem:p/100, cap:c/100, pct:p, capPct:c };
}
function _ecoRetardByParc(){
  var out={}, cfg=_ecoRetardCfg();
  if(!(cfg.sem>0)) return out;
  var cd=(window._chargeSaisonData&&window.getSaisonActive)?window._chargeSaisonData(window._pilSaison()):null;
  if(!cd||!cd.taskWindows||!cd.taskWindows.length) return out;
  var winBy={}; cd.taskWindows.forEach(function(t){ if(t&&t.nom) winBy[_friseNorm(t.nom)]=t; });
  // Appartenance a la saison : MEME filtre que _ecoEquipeByParc / _ecoTracHByParc /
  // _ecoPhytoByParc, c.-a-d. _saisonForDate et non les bornes cd.debut/cd.fin.
  // Une tache finie en retard peut deborder la date de fin de saison : la borner
  // ici reviendrait a effacer precisement le cas qu'on cherche a mesurer.
  var seasonNom=(cd&&cd.saison)?cd.saison:'';
  function _inR(j){
    var sn=(window._saisonForDate&&j.date)?window._saisonForDate(j.date):null; sn=sn||j.saison||'';
    if(sn) return sn===seasonNom;
    return seasonNom===(((window.getSaisonActive&&window.getSaisonActive())||{}).nom||'');
  }
  var last={};
  (window.JOURNAL||[]).forEach(function(j){
    if(!j||j.meteo||j.statut!=='Valid\u00e9'||!j.parcelle||!j.tache||!j.date) return;
    if(!_inR(j)) return;
    var k=j.parcelle+'\u0000'+_friseNorm(j.tache);
    if(!last[k]||j.date>last[k]) last[k]=j.date;
  });
  var defs=_ecoAllDefs();
  (window.PARCELLES||[]).forEach(function(p){
    if(!p||p.statut==='Arrachee') return;
    var h=0, wkMax=0, nb=0;
    defs.forEach(function(def){
      if(!def||!_opApplic(p,def)) return;
      var w=winBy[_friseNorm(def.nom)]; if(!w||!w.end) return;
      var fin=last[p.nom+'\u0000'+_friseNorm(def.nom)]; if(!fin||fin<=w.end) return;
      var wk=(Date.parse(fin+'T00:00:00')-Date.parse(w.end+'T00:00:00'))/86400000/7;
      if(!(wk>0)) return;
      if(wk>wkMax) wkMax=wk;
      nb++;
      h+=_opParcFull(p,def)*Math.min(cfg.cap,cfg.sem*wk);
    });
    if(h>0) out[p.nom]={ h:h, sem:wkMax, nb:nb };
  });
  return out;
}

// Heures tracteur par parcelle + COÛT au taux du conducteur de chaque session.
// Le tractoriste est un ouvrier du domaine la plupart du temps : son taux est connu
// (fiche membre → `paie`). Le valoriser à la moyenne d'équipe sous-évaluait le poste
// dès qu'un apprenti tirait la moyenne vers le bas sans jamais conduire.
// Repli par session : conducteur inconnu ou sans taux → taux moyen (_ecoRate).
// ★ FENETRE OPTIONNELLE `win` = {d0,d1} en ISO : filtre les sessions PAR DATES au
//   lieu de la periode consultee. Sert a Pilotage > Economie > Exercice, qui raisonne
//   entre deux bilans et non par campagne. APPELEE SANS ARGUMENT, LA FONCTION EST
//   STRICTEMENT INCHANGEE — une seule definition de « ce que coute une session ».
function _ecoTracHByParc(win){
  var out={h:{},cost:{},qui:{},nAnon:0,nSess:0,byDate:{},gnrByDate:{},hByDate:{}};
  var _rate0=_ecoRate(), _cfgT=_ecoCfg();
  var _mBy={}; (window.MEMBRES||[]).forEach(function(m){ if(m&&m.nom) _mBy[m.nom]=m; });
  function _tauxCond(nom){
    var m=nom?_mBy[nom]:null;
    var r=(m&&window._mvPaieTauxEff)?Number(window._mvPaieTauxEff(m)):0;
    return (isFinite(r)&&r>0)?r:0;
  }
  var s=(typeof window._pilSaison==='function')?window._pilSaison():null;
  var seasonNom=(s&&s.nom)?s.nom:'';
  var sess=window.SESSIONS||[], acts=window.ACTIVITES||[], parcs=window.PARCELLES||[];
  function _in(se){
    if(win&&win.d0&&win.d1){ var _d=String(se.date||'').slice(0,10); return !!_d && _d>=win.d0 && _d<=win.d1; }
    var sn=(window._saisonForDate&&se.date)?window._saisonForDate(se.date):null; sn=sn||se.saison||'';
    if(sn) return sn===seasonNom;
    return seasonNom===(((window.getSaisonActive&&window.getSaisonActive())||{}).nom||'');
  }
  sess.forEach(function(se){
    if(!se||!_in(se)) return;
    var act=acts.find(function(a){return a&&a.nom===se.activite;});
    var hha=act?(parseFloat(act.h_ha)||0):0;
    var _tc=_tauxCond(se.conducteur), _tu=(_tc>0?_tc:_rate0);
    out.nSess++; if(!(_tc>0)) out.nAnon++;
    (se.parcellesFaites||[]).forEach(function(x){
      var nom=(typeof x==='string')?x:((x&&x.nom)||''); if(!nom) return;
      var d=(x&&typeof x==='object'&&typeof x.dmin==='number')?x.dmin:null, h;
      if(d!=null){ h=d/60; }
      else { if(hha<=0) return; var p=parcs.find(function(pp){return pp&&pp.nom===nom;}); h=(p?(parseFloat(p.surface)||0):0)*hha; }
      out.h[nom]=(out.h[nom]||0)+h;
      out.cost[nom]=(out.cost[nom]||0)+h*_tu;
      // Source DATEE de la courbe d'engagement : conduite + carburant de CETTE session.
      // Une seule definition de « ce que coute une session » — celle-ci.
      if(se.date){
        out.byDate[se.date]=(out.byDate[se.date]||0)+h*_tu+h*_cfgT.conso*_cfgT.gnrL;
        // ★ AJOUT PUR : la courbe d'engagement de la campagne veut le total (conduite +
        //   carburant) ; l'exercice comptable veut le CARBURANT SEUL, parce que la conduite
        //   est deja dans la masse salariale du planning. Deux besoins, un seul parcours.
        out.gnrByDate[se.date]=(out.gnrByDate[se.date]||0)+h*_cfgT.conso*_cfgT.gnrL;
        out.hByDate[se.date]=(out.hByDate[se.date]||0)+h;
      }
      if(se.conducteur){ if(!out.qui[nom]) out.qui[nom]={}; out.qui[nom][se.conducteur]=(out.qui[nom][se.conducteur]||0)+h; }
    });
  });
  return out;
}
// Données économiques par parcelle (triées par coût/ha décroissant).
function _ecoPhNorm(s){ return String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }
// Coût phyto par parcelle : dose_val × surface × prix unitaire de l'intrant (La Réserve).
// Doses depuis TRAITEMENTS (structurées par l'assistant de traitement) ; prix depuis
// INTRANTS.produits[].prixU. Conversion g→kg alignée sur reserve.js._conso. Honnête :
// entrée sans dose_val = ignorée ; produit sans intrant/prix = non chiffré (signalé).
// ★ Meme fenetre optionnelle que _ecoTracHByParc, meme raison, meme garantie :
//   sans argument, comportement identique a la version precedente.
function _ecoPhytoByParc(win){
  var INT=(window.INTRANTS&&Array.isArray(window.INTRANTS.produits))?window.INTRANTS.produits:[];
  var priceBy={};
  INT.forEach(function(pr){ if(pr&&pr.nom!=null){ var k=_ecoPhNorm(pr.nom); if(!(k in priceBy)) priceBy[k]=(Number(pr.prixU)>0?Number(pr.prixU):null); } });
  var s=(typeof window._pilSaison==='function')?window._pilSaison():null;
  var seasonNom=(s&&s.nom)?s.nom:'';
  function _in(t){
    if(win&&win.d0&&win.d1){ var _d=String(t.date||'').slice(0,10); return !!_d && _d>=win.d0 && _d<=win.d1; }
    var sn=(window._saisonForDate&&t.date)?window._saisonForDate(t.date):null; sn=sn||t.saison||'';
    if(sn) return sn===seasonNom;
    return seasonNom===(((window.getSaisonActive&&window.getSaisonActive())||{}).nom||'');
  }
  var cost={}, unpriced={}, anyDose=false, byDate={};
  (window.TRAITEMENTS||[]).forEach(function(e){
    if(!e||!_in(e)) return;
    if(e.dose_val==null||isNaN(e.dose_val)) return; // pas structuré → exclu du calcul
    anyDose=true;
    var base=String(e.dose_unit||'').toLowerCase().split('/')[0];
    var pu=priceBy[_ecoPhNorm(e.produit)];
    if(pu==null){ unpriced[e.produit||'?']=1; return; }
    (e.parcelles||[]).forEach(function(nom){
      var p=(window.PARCELLES||[]).find(function(x){ return x&&x.nom===nom; });
      var surf=p?(parseFloat(p.surface)||0):0; if(surf<=0) return;
      var qty=e.dose_val*surf*(base==='g'?0.001:1), eur=qty*pu;
      cost[nom]=(cost[nom]||0)+eur;
      if(e.date) byDate[e.date]=(byDate[e.date]||0)+eur;
    });
  });
  return { cost:cost, unpriced:Object.keys(unpriced), anyDose:anyDose, hasIntrants:INT.length>0, byDate:byDate };
}

// ════════════════════════════════════════════════════════════════════════════════
// ÉCONOMIE — refonte « outil de pilotage économique »
// ════════════════════════════════════════════════════════════════════════════════
// Ce que le module faisait avant : un seul chiffre, « Coût projeté saison », qui
// additionnait un BUDGET de main-d'oeuvre (barème h/ha sur toute la période) et du
// RÉALISÉ (tracteur, GNR, phyto à ce jour). Ni un budget, ni une dépense : rien
// qu'on puisse piloter. Aucun graphique, aucune notion de rythme, aucun coût par
// travail, aucun prix de revient.
//
// Le modèle retenu tient en quatre mots, et ce sont les seuls :
//   BUDGET   — ce que la période coûtera si tout se fait au barème
//   ENGAGÉ   — ce qui est déjà consommé à date (travail fait × taux, + réalisé)
//   RESTE    — budget − engagé
//   DÉRIVE   — % de budget consommé MOINS % de travail fait, en points
// La dérive est le seul indicateur qui dise quelque chose : à 62 % de budget pour
// 48 % de travail, la période finira 29 % au-dessus. Tout le reste en découle.
//
// Trois règles de méthode, tenues partout :
//  1. Rien n'est inventé. Les heures viennent de _opParcFull / _opParcReste (les
//     MÊMES fonctions que l'ordre de passage et le simulateur), les taux de `paie`,
//     les heures tracteur des sessions, les doses du registre, les prix de La Réserve.
//  2. Ce qui est projeté est dit projeté. Le tracteur, le GNR et le phyto ne sont
//     connus qu'en réalisé : leur part de budget est une extrapolation au rythme
//     constaté, affichée comme telle, et neutralisée sous 15 % d'avancement.
//  3. Le surcoût de retard reste modélisé et tenu à part. Une heure supposée
//     n'entre dans aucun total payé.
// ════════════════════════════════════════════════════════════════════════════════

// Palette des postes — une couleur, un poste, partout (KPI, donut, barres, tableau).
var _PEC_COL = { mo:'#8A5A38', trac:'#2C3E50', gnr:'#C2871E', phy:'#5B2D8E', ret:'#B85A1A' };

// ── Formats ──────────────────────────────────────────────────────────
// Un tableau de chiffres se lit mal en euros pleins : au-dela de 10 000 EUR on
// passe en milliers, avec UNE decimale. Les totaux, eux, restent en euros exacts.
function _pecEurK(n){
  var v=Number(n)||0, a=Math.abs(v);
  if(a>=10000) return (Math.round(v/100)/10).toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1})+' k\u20AC';
  return _ecoEur(v);
}
function _pecPct(n){ return (Math.round((Number(n)||0)*10)/10).toLocaleString('fr-FR',{minimumFractionDigits:0,maximumFractionDigits:1})+' %'; }
function _pecMoisCourt(m){ return ['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'][m]||''; }
function _pecIsoToMs(iso){ var t=Date.parse(String(iso||'')+'T00:00:00'); return isNaN(t)?null:t; }
function _pecMsToIso(ms){ var d=new Date(ms); var m=d.getMonth()+1, j=d.getDate(); return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(j<10?'0':'')+j; }
function _pecDfrMs(ms){ var d=new Date(ms); return d.getDate()+' '+_pecMoisCourt(d.getMonth())+' '+d.getFullYear(); }

// ── État de la vue (par utilisateur, par domaine) ────────────────────
// Trois choix memorises : la sous-vue ouverte, le tri du tableau parcelles et son
// sens. L'ancienne version repartait a zero a chaque ouverture « volontairement » ;
// sur un outil qu'on consulte deux fois par jour, c'est une friction, pas une regle.
var _PEC_SUB='syn', _PEC_PSORT='budget', _PEC_PDIR=-1;
function _pecStKey(){ return 'mavigne_pec_'+_pilTenant(); }
function _pecLoadSt(){
  try{
    var raw=localStorage.getItem(_pecStKey()); if(!raw) return;
    var o=JSON.parse(raw); if(!o||typeof o!=='object') return;
    if(o.sub==='syn'||o.sub==='pos'||o.sub==='par'||o.sub==='exe') _PEC_SUB=o.sub;
    // Exercice consulte : une annee d'OUVERTURE, ou null = celui d'aujourd'hui.
    _PEX_AN=(typeof o.exan==='number'&&isFinite(o.exan))?o.exan:null;
    if(typeof o.psort==='string') _PEC_PSORT=o.psort;
    if(o.pdir===1||o.pdir===-1) _PEC_PDIR=o.pdir;
  }catch(e){ _PEC_SUB='syn'; }
}
function _pecSaveSt(){
  try{ localStorage.setItem(_pecStKey(), JSON.stringify({sub:_PEC_SUB,psort:_PEC_PSORT,pdir:_PEC_PDIR,exan:_PEX_AN})); }
  catch(e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'pec state'}); }
}

// ── Feuille de style, injectee une fois ──────────────────────────────
// Le module vit dans src/styles.css comme tout le reste, MAIS ce lot ne devait
// toucher qu'un seul fichier : toucher styles.css impose un bump APP + SW et un
// re-deploiement de l'app entiere pour un onglet. Le bloc est donc porte par le
// module qui l'utilise, sous un prefixe verifie sans collision (.pec-), et pose
// une seule fois (idempotent). Rien n'empeche de le remonter dans styles.css plus
// tard : les selecteurs sont deja ecrits pour.
function _pecCss(){
  if(document.getElementById('pec-css')) return;
  var css=''
  +'.pec-wrap{display:flex;flex-direction:column;gap:16px}'
  +'.pec-subnav{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}'
  +'.pec-sub{display:inline-flex;border:1px solid var(--gris-clair);border-radius:12px;padding:3px;gap:3px;background:var(--bg-app);flex-wrap:wrap}'
  +'.pec-sub button{border:0;background:transparent;color:var(--texte-doux);font-family:inherit;font-size:12.5px;font-weight:600;padding:9px 15px;border-radius:9px;cursor:pointer;min-height:40px;white-space:nowrap}'
  +'.pec-sub button.on{background:var(--bg-card);color:var(--texte);box-shadow:var(--shadow-sm)}'
  +'.pec-card{background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:15px;box-shadow:var(--shadow-sm);overflow:hidden;position:relative}'
  +'.pec-ch{display:flex;align-items:baseline;justify-content:space-between;gap:10px 18px;padding:15px 18px 8px;flex-wrap:wrap}'
  +'.pec-ct{font-family:\'Cormorant Garamond\',serif;font-size:21px;font-weight:600;color:var(--texte);line-height:1.15}'
  +'.pec-cs{font-size:11.5px;color:var(--texte-doux);line-height:1.5;flex:1;min-width:180px}'
  +'.pec-cb{padding:2px 18px 18px}'
  +'.pec-svg{max-width:100%;height:auto;display:block}'
  +'.pec-lg i{width:16px;height:0;display:inline-block;flex:none}'
  +'.pec-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(196px,1fr));border-top:1px solid var(--gris-clair)}'
  +'.pec-k{padding:15px 20px;border-right:1px solid var(--gris-clair);border-bottom:1px solid var(--gris-clair);margin-bottom:-1px}'
  +'.pec-k .l{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:var(--texte-doux)}'
  +'.pec-k .v{font-family:\'Cormorant Garamond\',serif;font-size:31px;font-weight:600;margin-top:3px;line-height:1.05;color:var(--texte);font-variant-numeric:tabular-nums}'
  +'.pec-k .v small{font-size:13px;font-weight:600;color:var(--texte-doux)}'
  +'.pec-k .s{font-size:11px;color:var(--texte-doux);margin-top:4px;line-height:1.45}'
  +'.pec-bar{height:11px;border-radius:6px;background:var(--gris-clair);overflow:hidden;display:flex}'
  +'.pec-bar i{display:block;height:100%}'
  +'.pec-leg{display:flex;flex-wrap:wrap;gap:7px 18px;margin-top:11px}'
  +'.pec-lg{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;color:var(--texte-med)}'
  +'.pec-lg em{width:11px;height:11px;border-radius:3px;display:inline-block;font-style:normal;flex:none}'
  +'.pec-lg b{color:var(--texte);font-variant-numeric:tabular-nums}'
  +'.pec-scroll{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}'
  +'.pec-tbl{width:100%;border-collapse:collapse;font-size:12.5px;min-width:620px}'
  +'.pec-tbl th{text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--texte-doux);padding:9px 10px;border-bottom:1px solid var(--gris-clair);white-space:nowrap;font-weight:700}'
  +'.pec-tbl th.s{cursor:pointer;user-select:none}'
  +'.pec-tbl th.s:hover{color:var(--texte)}'
  +'.pec-tbl th.on{color:var(--texte)}'
  +'.pec-tbl td{padding:10px;border-bottom:1px solid var(--gris-clair);vertical-align:middle;color:var(--texte-med)}'
  +'.pec-tbl td.r,.pec-tbl th.r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}'
  +'.pec-tbl td.n{color:var(--texte);font-weight:600}'
  +'.pec-tbl tbody tr:last-child td{border-bottom:0}'
  +'.pec-tbl tfoot td{border-top:2px solid var(--gris);border-bottom:0;font-weight:700;color:var(--texte);padding-top:12px}'
  +'.pec-a{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:12px;border:1px solid;font-size:12.5px;line-height:1.55;color:var(--texte-med)}'
  +'.pec-a+.pec-a{margin-top:9px}'
  +'.pec-a .e{font-size:15px;line-height:1.3;flex:none}'
  +'.pec-a b{color:var(--texte)}'
  +'.pec-a.bad{background:var(--rouge-pale);border-color:rgba(160,41,30,.35)}'
  +'.pec-a.warn{background:var(--orange-pale);border-color:rgba(184,90,26,.35)}'
  +'.pec-a.info{background:var(--or-pale);border-color:rgba(194,161,77,.42)}'
  +'.pec-a.ok{background:var(--vert-pale);border-color:rgba(61,107,39,.32)}'
  +'.pec-btn{border:1px solid var(--gris-clair);background:var(--bg-card);color:var(--texte-med);border-radius:10px;padding:10px 14px;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;min-height:42px;display:inline-flex;align-items:center;gap:7px}'
  +'.pec-btn:hover{background:var(--bg-app);color:var(--texte)}'
  +'.pec-acts{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}'
  +'.pec-note{font-size:11.5px;color:var(--texte-doux);line-height:1.6;margin-top:12px}'
  +'.pec-note b{color:var(--texte-med)}'
  +'.pec-verdict{display:flex;gap:15px;align-items:flex-start;padding:17px 20px}'
  +'.pec-verdict .em{font-size:27px;line-height:1;flex:none}'
  +'.pec-verdict .t{font-family:\'Cormorant Garamond\',serif;font-size:23px;font-weight:600;color:var(--texte);line-height:1.22}'
  +'.pec-verdict .d{font-size:12.5px;color:var(--texte-doux);margin-top:5px;line-height:1.6}'
  +'.pec-verdict .d b{color:var(--texte-med)}'
  +'.pec-pill{display:inline-block;font-size:10.5px;font-weight:700;border-radius:9px;padding:3px 9px;line-height:1.5}'
  +'.pec-mini{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1px;background:var(--gris-clair);border-radius:12px;overflow:hidden;border:1px solid var(--gris-clair)}'
  +'.pec-mini>div{background:var(--bg-card);padding:12px 14px}'
  +'.pec-mini .l{font-size:9.5px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:var(--texte-doux)}'
  +'.pec-mini .v{font-family:\'Cormorant Garamond\',serif;font-size:24px;font-weight:600;color:var(--texte);margin-top:2px;line-height:1.1;font-variant-numeric:tabular-nums}'
  +'.pec-mini .v small{font-size:12px;color:var(--texte-doux);font-weight:600}'
  +'.pec-mini .s{font-size:10.5px;color:var(--texte-doux);margin-top:2px;line-height:1.4}'
  +'.pec-empty{font-size:12.5px;color:var(--texte-doux);font-style:italic;padding:14px 2px}'
  +'.pec-grid2{display:grid;grid-template-columns:220px 1fr;gap:22px;align-items:center}'
  +'@media(max-width:880px){.pec-grid2{grid-template-columns:1fr;gap:14px}}'
  +'.pex-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}'
  +'.pex-win{font-size:12px;color:var(--texte-doux);font-weight:600}'
  +'.pex-win b{color:var(--texte)}'
  +'.pex-set{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}'
  +'.pex-setl{font-size:13.5px;font-weight:600;color:var(--texte)}'
  +'.pex-sets{font-size:11.5px;color:var(--texte-doux);line-height:1.55;margin-top:3px;max-width:640px}'
  +'.pex-selm{padding:9px 11px;border:1.5px solid var(--gris-clair);border-radius:10px;font-family:inherit;font-size:14px;background:var(--bg-app);color:var(--texte);min-height:42px;box-sizing:border-box}'
  +'.pex-warn{border-left:3px solid var(--or);padding-left:13px}'
  +'.pex-warn .t{font-family:\'Cormorant Garamond\',serif;font-size:19px;font-weight:600;color:var(--texte);line-height:1.25}'
  +'.pex-warn .d{font-size:12.5px;color:var(--texte-doux);margin-top:5px;line-height:1.6}'
  +'.pex-warn .d b{color:var(--texte-med)}'
  +'@media(max-width:640px){.pex-set{flex-direction:column}.pex-selm{width:100%}.pec-k{padding:13px 15px}.pec-k .v{font-size:26px}.pec-ct{font-size:19px}.pec-verdict .t{font-size:20px}.pec-subnav{align-items:flex-start}}';
  var st=document.createElement('style');
  st.id='pec-css'; st.textContent=css;
  document.head.appendChild(st);
}

// ── Récolte de la période (kg) : la seule voie vers un prix de revient ──
// rendement_hist est écrit par le Cuvier (_vendRecordRendement) : {millesime, kg,
// kg_ha, date, …}. On prend d'abord les entrées DATÉES dans la période consultée —
// exact, sans deviner de millésime. À défaut, le millésime le plus récent, annoncé
// comme tel : un prix de revient calculé sur la récolte de l'an dernier reste utile,
// à condition de ne jamais faire croire que c'est celle de l'année.
function _pecRecolte(){
  var s=(typeof window._pilSaison==='function')?window._pilSaison():null;
  var d1=(s&&s.debut)?s.debut:null, d2=(s&&s.fin)?s.fin:null;
  var P=(window.PARCELLES||[]).filter(function(p){ return p && p.statut!=='Arrachee'; });
  function kgOf(p,r){
    var v=Number(r&&r.kg)||0;
    if(!(v>0)){ var kh=Number(r&&r.kg_ha)||0; if(kh>0) v=kh*(parseFloat(p.surface)||0); }
    return v>0?v:0;
  }
  var kg=0, ha=0, n=0, mil=null;
  if(d1&&d2){
    P.forEach(function(p){
      var sk=0, got=false;
      (Array.isArray(p.rendement_hist)?p.rendement_hist:[]).forEach(function(r){
        if(!r||!r.date||r.date<d1||r.date>d2) return;
        var v=kgOf(p,r); if(v>0){ sk+=v; got=true; if(r.millesime!=null) mil=r.millesime; }
      });
      if(got){ kg+=sk; ha+=(parseFloat(p.surface)||0); n++; }
    });
    if(kg>0) return { kg:kg, ha:ha, n:n, mil:mil, src:'saison' };
  }
  var best=null;
  P.forEach(function(p){ (Array.isArray(p.rendement_hist)?p.rendement_hist:[]).forEach(function(r){
    var m=Number(r&&r.millesime)||0; if(m>0 && (best===null||m>best)) best=m; }); });
  if(best===null) return { kg:0, ha:0, n:0, mil:null, src:'' };
  kg=0; ha=0; n=0;
  P.forEach(function(p){
    var sk=0, got=false;
    (Array.isArray(p.rendement_hist)?p.rendement_hist:[]).forEach(function(r){
      if(!r||Number(r.millesime)!==best) return;
      var v=kgOf(p,r); if(v>0){ sk+=v; got=true; }
    });
    if(got){ kg+=sk; ha+=(parseFloat(p.surface)||0); n++; }
  });
  return { kg:kg, ha:ha, n:n, mil:best, src:(kg>0?'hist':'') };
}
// Kilos de raisin par bouteille — hypothèse de conversion, JAMAIS une mesure.
// Réglable dans Pilotage › Outils › Paramétrage. 1,3 kg/col est l'ordre de grandeur
// bourguignon usuel (≈ 130 kg pour 1 hL) ; chaque domaine a le sien.
function _pecKgB(){ var v=Number(((window.CONFIG&&window.CONFIG.eco)||{}).kg_bouteille); return (isFinite(v)&&v>0)?v:1.3; }
// Journee de reference : convertit les journees-personnes du journal en heures, base
// de l'ecart de cadence. Defaut 7 h, aligne sur le simulateur de renfort (_rfCfg.hJour).
// UN SEUL lecteur : le defaut vivait en dur dans _pecData, il y aurait diverge du jour
// ou le champ est devenu reglable.
function _pecHJour(){ var v=Number(((window.CONFIG&&window.CONFIG.eco)||{}).h_jour); return (isFinite(v)&&v>0)?v:7; }

// ── Moteur : budget / engagé / reste, par parcelle ET par travail ────
// Les heures viennent de _opParcFull (budget) et _opParcReste (restant), c.-à-d.
// EXACTEMENT le même moteur que l'ordre de passage et le simulateur de renfort.
// Aucune troisième définition de « combien d'heures » dans ce fichier.
// ── Presence reelle du domaine sur la periode consultee ──────────────
// Source unique : _planWorkPersRange (planning.js), la MEME que Economie > Exercice.
// On ne redefinit pas « combien d'heures a-t-on travaille » une seconde fois.
//
// ⚠ FENETRE : bornee a aujourd'hui, mais on verifie d'ABORD que la periode a
// commence. Sans ce test, une periode a venir (debut 10/08 alors qu'on est le 09)
// donne une fenetre a l'envers : la boucle ne tourne pas une seule fois et tout
// sort a zero, sans erreur et sans trace. Meme famille que _mvFutParc() appelee
// sans arguments. Vecu pendant la mesure qui a mene a ce lot.
var _PEC_CAD_AVC = 0.40;   // avancement minimum pour afficher la cadence
function _pecCadPresence(){
  var s=(typeof window._pilSaison==='function')?window._pilSaison():null;
  if(!s||!s.debut||!s.fin) return null;
  if(typeof window._planWorkPersRange!=='function') return null;
  var now=new Date(), t=_pexIso(now.getFullYear(), now.getMonth(), now.getDate());
  var d0=String(s.debut).slice(0,10), d1=String(s.fin).slice(0,10);
  if(d1>t) d1=t;
  if(d1<d0) return null;                       // periode pas encore commencee
  var okPer=(typeof window._mvEnContratSurPeriode==='function');
  var mbrs=(window.MEMBRES||[]).filter(function(m){
    if(!m||!m.nom) return false;
    return okPer ? window._mvEnContratSurPeriode(m,d0,d1) : (m.statut!=='Inactif');
  });
  if(!mbrs.length) return null;
  var D0=_pexD(d0), D1=_pexD(d1), h=0, n=0;
  mbrs.forEach(function(m){
    var v=0;
    try{ v=Number(window._planWorkPersRange(m,D0,D1))||0; }
    catch(e){ if(window.logError) window.logError({level:'info',cat:'eco',msg:'cadence presence '+(m.nom||'')}); }
    if(v>0){ h+=v; n++; }
  });
  if(!(h>0)) return null;
  return { h:h, n:n, d0:d0, d1:d1 };
}

function _pecData(){
  var cfg=_ecoCfg(), rate=_ecoRate();
  var tracH=_ecoTracHByParc(), phy=_ecoPhytoByParc();
  var eqp=_ecoEquipeByParc(), ret=_ecoRetardByParc(), rcfg=_ecoRetardCfg();
  var defs=_ecoAllDefs();
  var parc=(window.PARCELLES||[]).filter(function(p){ return p && p.statut!=='Arrachee'; });
  var rows=[], tasks={}, tOrder=[], pairs=[];
  var T={ bH:0,fH:0,rH:0, moB:0,moF:0,moR:0, tracF:0,tracH:0, gnrF:0, litres:0, phyF:0,
          surf:0, retH:0, retE:0, nRet:0, nReel:0, trous:0, plantH:0, plantE:0, nSansTaux:0 };
  parc.forEach(function(p){
    var surf=parseFloat(p.surface)||0;
    var eq=eqp[p.nom]||null;
    var tx=(eq&&eq.taux>0)?eq.taux:rate;
    var src=(eq&&eq.taux>0)?'reel':'moyen';
    var bH=0, fH=0, rH=0, tks=[];
    defs.forEach(function(def){
      if(!def || !_opApplic(p,def)) return;
      var full=Number(_opParcFull(p,def))||0;
      if(!(full>0)) return;
      var rst=Number(_opParcReste(p,def))||0;
      if(!(rst>0)) rst=0; if(rst>full) rst=full;
      var fait=full-rst;
      bH+=full; rH+=rst; fH+=fait;
      var t=tasks[def.nom];
      if(!t){ t=tasks[def.nom]={ nom:def.nom, bH:0,fH:0,rH:0, bE:0,fE:0,rE:0, nP:0, surf:0 }; tOrder.push(def.nom); }
      t.bH+=full; t.fH+=fait; t.rH+=rst;
      t.bE+=full*tx; t.fE+=fait*tx; t.rE+=rst*tx;
      t.nP++; t.surf+=surf;
      if(fait>0) pairs.push({ parc:p.nom, norm:_friseNorm(def.nom), eur:fait*tx });
      if(rst>0.01) tks.push(def.nom);
    });
    var thH=tracH.h[p.nom]||0, tracF=tracH.cost[p.nom]||0;
    var litres=thH*cfg.conso, gnrF=litres*cfg.gnrL, phyF=phy.cost[p.nom]||0;
    var reel=tracF+gnrF+phyF;
    var rr=ret[p.nom]||null, retH=rr?rr.h:0, retE=retH*tx;
    var pl=_ecoParcPlant(p);
    var budget=bH*tx+reel, engage=fH*tx+reel, resteE=rH*tx;
    rows.push({ nom:p.nom, surf:surf, tx:tx, src:src,
      bH:bH, fH:fH, rH:rH, pct:(bH>0?fH/bH*100:100),
      moB:bH*tx, moF:fH*tx, moR:resteE,
      thH:thH, tracF:tracF, litres:litres, gnrF:gnrF, phyF:phyF,
      condu:(tracH.qui[p.nom]||null),
      budget:budget, engage:engage, reste:resteE,
      coutHa:(surf>0?budget/surf:0), engHa:(surf>0?engage/surf:0),
      retH:retH, retE:retE, retSem:(rr?rr.sem:0),
      trous:pl.trous, plantH:pl.h, plantE:pl.h*tx,
      etp:(eq?eq.etp:0), nj:(eq?eq.nj:0), noms:(eq?eq.noms:[]), reste_taches:tks });
    T.bH+=bH; T.fH+=fH; T.rH+=rH;
    T.moB+=bH*tx; T.moF+=fH*tx; T.moR+=resteE;
    T.tracF+=tracF; T.tracH+=thH; T.gnrF+=gnrF; T.litres+=litres; T.phyF+=phyF;
    T.surf+=surf; T.retH+=retH; T.retE+=retE; if(retE>0) T.nRet++;
    if(src==='reel') T.nReel++;
    T.trous+=pl.trous; T.plantH+=pl.h; T.plantE+=pl.h*tx;
  });
  // Sources DATÉES pour la courbe d'engagement — reprises telles quelles des deux
  // agrégateurs existants (une seule définition de « combien coûte une session »).
  T.byDateTrac = tracH.byDate || {};
  T.byDatePhy  = phy.byDate  || {};

  // Avancement de référence = heures de barème réalisées / heures de barème totales.
  // C'est la MÊME grandeur que la jauge de l'onglet Avancement : deux écrans qui
  // parlent d'« avancement » doivent afficher le même nombre.
  var avc = T.bH>0 ? (T.fH/T.bH) : 1;
  // Tracteur, GNR et phyto ne sont connus qu'en réalisé. Leur part de budget est
  // extrapolée au rythme constaté (réalisé ÷ avancement) — et neutralisée sous
  // 15 % d'avancement, où le rapport n'a plus aucune valeur prédictive.
  var projOn = avc>=0.15;
  var kProj = projOn ? (1/avc) : 1;
  var tracB = T.tracF*kProj, gnrB = T.gnrF*kProj, phyB = T.phyF*kProj;
  var budget = T.moB + tracB + gnrB + phyB;
  var engage = T.moF + T.tracF + T.gnrF + T.phyF;
  var resteE = Math.max(0, budget-engage);
  var consPct = budget>0 ? (engage/budget*100) : 0;
  var avcPct  = avc*100;

  // ⚠⚠ PIEGE EVITE, trouve au harnais : un premier jet definissait la derive
  // comme « % de budget consomme moins % de travail fait ». Or le budget du tracteur,
  // du GNR et du phyto est extrapole PAR l'avancement (realise / avancement) : les
  // deux pourcentages sont alors egaux PAR CONSTRUCTION, et l'indicateur affichait
  // toujours zero. Un chiffre qui ne peut pas varier n'est pas un indicateur.
  //
  // La vraie derive est ailleurs, et elle se MESURE. MAIS PAS AU JOURNAL.
  //
  // ⚠⚠ DEFAUT CORRIGE LE 09/08, MESURE CHEZ MARCHAND-GRILLOT. La presence etait
  // deduite des VALIDATIONS : une journee-personne portant une validation valait
  // la journee de reference (7 h), une journee sans validation valait ZERO. Or une
  // validation couvre plusieurs jours de travail. Mesure sur les periodes reelles :
  // 12 journees sur 247 portaient une validation en hiver, 165 sur 559 au printemps.
  // L'ecart de cadence sortait a -90 % puis -52,8 %, et l'ecran conseillait de
  // REDUIRE un bareme qui, mesure au planning, est juste a quelques pour cent pres.
  // Un mauvais conseil avec l'autorite d'une mesure.
  //
  // La presence vient donc du PLANNING (_planWorkPersRange, meme source que
  // Economie > Exercice), moins les heures de sessions tracteur — et T.tracH est
  // deja agregee ci-dessus, on ne recompte pas les sessions une seconde fois.
  // 100 % des jours travailles : le probleme de couverture disparait.
  //
  // ⚠ CE QUE CE CHIFFRE CONTIENT ET QU'ON NE SAIT PAS RETIRER : le planning dit que
  // la personne etait la, jamais CE QU'ELLE A FAIT (verifie : une entree porte des
  // heures, un type cp/recup, un motif d'absence — aucune activite). Cave, atelier,
  // entretien et bureau restent dedans. La presence est donc SUREVALUEE et l'ecart
  // penche vers « bareme un peu serre » plutot que « large » : biais inverse de
  // l'ancien, beaucoup plus petit, et ECRIT A L'ECRAN.
  //
  // ⚠ PERIMETRE — piege du §11c : la presence porte sur TOUT le domaine, le bareme
  // doit donc porter sur TOUT le travail fait (T.fH), plus sur les seules parcelles
  // connues du journal. Comparer un numerateur global a un denominateur partiel
  // serait exactement le meme decalage, dans l'autre sens.
  //
  // GARDE-FOU : l'ancien seuil portait sur la COUVERTURE (30 % de surface nommee au
  // journal) ; il n'a plus d'objet. Le risque restant est la REPRESENTATIVITE — la
  // taille et le relevage n'ont pas la meme cadence, et le rapport de janvier ne
  // predit pas juin. D'ou un seuil d'AVANCEMENT, _PEC_CAD_AVC.
  var hJour=_pecHJour();
  var cadP=_pecCadPresence();
  var hBarC=T.fH;
  var hReelC=cadP ? Math.max(0, cadP.h - T.tracH) : 0;
  var cadOk = (hBarC>0 && hReelC>0 && avc>=_PEC_CAD_AVC);
  var ecart = cadOk ? ((hReelC-hBarC)/hBarC) : 0;
  // ⚠ La cadence ne s'applique qu'au RESTE A ENGAGER. Appliquee au budget entier
  // elle reecrivait le passe : a 100 % d'avancement, avec 79 358 € deja engages et
  // 0 € restant, l'ecran projetait une fin a 37,4 k€ — une projection ne peut pas
  // contredire ce qui est deja depense, sur la meme carte. A 0 % d'avancement le
  // resultat est identique a l'ancien ; a 100 % elle retombe exactement sur l'engage.
  var projFin = cadOk ? (engage + resteE*(1+ecart)) : budget;

  var postes = [
    { k:'mo',   lab:'Main-d\u2019\u0153uvre vigne', col:_PEC_COL.mo,   fait:T.moF,   budget:T.moB, proj:false, det:_ecoH1(T.fH)+' h faites sur '+_ecoH1(T.bH)+' h de bar\u00e8me' },
    { k:'trac', lab:'Conduite tracteur',            col:_PEC_COL.trac, fait:T.tracF, budget:tracB, proj:projOn, det:_ecoH1(T.tracH)+' h de sessions' },
    { k:'gnr',  lab:'Carburant GNR',                col:_PEC_COL.gnr,  fait:T.gnrF,  budget:gnrB,  proj:projOn, det:_pilNum(T.litres)+' L \u00e0 '+_ecoEur2(cfg.gnrL)+' \u20AC/L' },
    { k:'phy',  lab:'Produits phyto',               col:_PEC_COL.phy,  fait:T.phyF,  budget:phyB,  proj:projOn, det:'doses \u00d7 surface \u00d7 prix R\u00e9serve' }
  ];

  var tlist = tOrder.map(function(n){ var t=tasks[n];
    t.euHa = t.surf>0 ? t.bE/t.surf : 0;
    t.pct  = t.bH>0 ? t.fH/t.bH*100 : 100;
    t.part = budget>0 ? t.bE/budget*100 : 0;
    return t; }).sort(function(a,b){ return b.bE-a.bE; });

  var rec=_pecRecolte(), kgB=_pecKgB();
  var bouteilles = (rec.kg>0) ? (rec.kg/kgB) : 0;

  return {
    rows:rows, tasks:tlist, pairs:pairs, tot:T, postes:postes,
    rate:rate, cfg:cfg, phy:phy, rcfg:rcfg, minTrou:_ecoMinTrou(),
    tracAnon:tracH.nAnon, tracSess:tracH.nSess,
    avc:avcPct, cons:consPct, projOn:projOn,
    cad:{ hReel:hReelC, hBar:hBarC, ok:cadOk, ecart:ecart*100, hJour:hJour,
          src:(cadP?'planning':null), hTrac:T.tracH, seuil:_PEC_CAD_AVC*100,
          d0:(cadP?cadP.d0:''), d1:(cadP?cadP.d1:''), nMbr:(cadP?cadP.n:0) },
    projFin:projFin,
    budget:budget, engage:engage, resteE:resteE,
    coutHaB:(T.surf>0?budget/T.surf:0), coutHaE:(T.surf>0?engage/T.surf:0),
    rec:rec, kgB:kgB, bouteilles:bouteilles,
    eurKg:(rec.kg>0?budget/rec.kg:0), eurBt:(bouteilles>0?budget/bouteilles:0),
    eurPlant:(T.plantH>0?T.plantE/Math.max(1,T.trous):0),
    hasRate:(rate>0), hasGnr:(cfg.gnrL>0), hasPhyto:(T.phyF>0),
    hasPlant:(T.trous>0), hasTrac:(T.tracH>0),
    configured:(rate>0 || cfg.gnrL>0)
  };
}

// ── Courbe d'engagement : à quel rythme l'argent part-il ? ───────────
// Chaque euro engagé est posé à SA date :
//   · main-d'oeuvre → réparti à parts égales sur les validations datées du couple
//     (parcelle, tâche) au journal — même convention 1/N que le coût par parcelle ;
//   · tracteur + GNR → date de la session ;
//   · phyto → date du traitement.
// Les heures faites sans aucune trace au journal (import, reconstruction 🩹) ne
// sont pas inventables : elles forment un socle daté au premier jour, annoncé.
function _pecTimeline(E){
  var s=(typeof window._pilSaison==='function')?window._pilSaison():null;
  var seasonNom=(s&&s.nom)?s.nom:'';
  var d1=(s&&s.debut)?s.debut:null, d2=(s&&s.fin)?s.fin:null;
  function inS(dt){
    if(!dt) return false;
    var sn=(window._saisonForDate)?window._saisonForDate(dt):null;
    if(sn) return sn===seasonNom;
    return !!(d1&&d2&&dt>=d1&&dt<=d2);
  }
  var day={}, socle=0, minIso=null, maxIso=null;
  function add(iso,v){
    if(!(v>0)) return;
    if(!iso){ socle+=v; return; }
    day[iso]=(day[iso]||0)+v;
    if(minIso===null||iso<minIso) minIso=iso;
    if(maxIso===null||iso>maxIso) maxIso=iso;
  }
  var jp={};
  (window.JOURNAL||[]).forEach(function(j){
    if(!j || j.meteo || j.statut!=='Valid\u00e9' || !j.parcelle || !j.tache || !j.date) return;
    if(!inS(j.date)) return;
    var k=j.parcelle+'\u0000'+_friseNorm(j.tache);
    if(!jp[k]) jp[k]={};
    jp[k][j.date]=1;
  });
  E.pairs.forEach(function(pr){
    var ds=Object.keys(jp[pr.parc+'\u0000'+pr.norm]||{}).sort();
    if(!ds.length){ socle+=pr.eur; return; }
    var q=pr.eur/ds.length;
    ds.forEach(function(dt){ add(dt,q); });
  });
  Object.keys(E.tot.byDateTrac||{}).forEach(function(iso){ add(iso, E.tot.byDateTrac[iso]); });
  Object.keys(E.tot.byDatePhy||{}).forEach(function(iso){ add(iso, E.tot.byDatePhy[iso]); });

  var startIso = d1 || minIso;
  if(!startIso) return { ok:false };
  if(minIso && minIso<startIso) startIso=minIso;
  var todayIso=_pecMsToIso(Date.now());
  var lastIso = maxIso || startIso;
  var endIso = d2 || lastIso;
  var t0=_pecIsoToMs(startIso), tEnd=_pecIsoToMs(endIso), tToday=_pecIsoToMs(todayIso);
  if(t0===null) return { ok:false };
  if(tEnd===null || tEnd<t0) tEnd=t0+86400000*30;

  // Cumul jour par jour (pas hebdomadaire à l'affichage, mais cumul exact au jour).
  var keys=Object.keys(day).sort();
  var cum=socle, pts=[{ t:t0, v:socle }];
  keys.forEach(function(iso){
    var t=_pecIsoToMs(iso); if(t===null||t<t0) { cum+=day[iso]; pts[0].v=cum; return; }
    cum+=day[iso];
    pts.push({ t:t, v:cum });
  });
  var engageDate=cum;

  // Rythme des 28 derniers jours PRÉSENTS dans la période (pas du calendrier) :
  // une équipe qui n'a rien saisi depuis trois semaines n'a pas un rythme nul,
  // elle a un trou de saisie. On borne donc la fenêtre au dernier jour saisi.
  var refMs = Math.min(tToday!==null?tToday:tEnd, tEnd);
  var lastMs = pts.length>1 ? pts[pts.length-1].t : t0;
  var winEnd = Math.min(refMs, Math.max(lastMs, t0));
  var winStart = winEnd-28*86400000;
  var vStart=socle;
  pts.forEach(function(p){ if(p.t<=winStart) vStart=p.v; });
  var days=Math.max(1,(winEnd-winStart)/86400000);
  var pace=Math.max(0,(cum-vStart)/days);

  var budget=E.budget||0;
  var projMs=null;
  if(pace>0 && budget>cum) projMs = winEnd + Math.ceil((budget-cum)/pace)*86400000;
  var projEndV = null;
  if(pace>0){
    var toEnd=Math.max(0,(tEnd-winEnd)/86400000);
    projEndV = cum + pace*toEnd;
  }
  var objIso=_pilObjectifGet(), objMs=objIso?_pecIsoToMs(objIso):null;
  return { ok:pts.length>1 || socle>0, pts:pts, t0:t0, tEnd:tEnd, tToday:tToday, tLast:lastMs,
           socle:socle, cum:cum, engageDate:engageDate, pace:pace, projMs:projMs, projEndV:projEndV,
           budget:budget, objMs:objMs, objIso:objIso, nDays:days };
}

// ════════════════════════════════════════════════════════════════════════════════
// GRAPHIQUES — SVG natif, zéro dépendance, couleurs par variables CSS
// Les axes et les libellés utilisent var(--texte…) : les quatre graphes basculent
// donc en thème sombre sans une ligne de plus.
// ════════════════════════════════════════════════════════════════════════════════
function _pecNiceMax(v){
  v=Number(v)||0; if(!(v>0)) return 100;
  var e=Math.pow(10,Math.floor(Math.log(v)/Math.LN10)), n=v/e;
  var m = n<=1?1 : n<=1.5?1.5 : n<=2?2 : n<=2.5?2.5 : n<=3?3 : n<=4?4 : n<=5?5 : n<=7.5?7.5 : 10;
  return m*e;
}
function _pecTrunc(s,n){ s=String(s==null?'':s); return s.length>n ? (s.slice(0,n-1)+'\u2026') : s; }
function _pecAxeEur(v){
  var a=Math.abs(v);
  if(a>=1000) return (Math.round(v/100)/10).toLocaleString('fr-FR',{maximumFractionDigits:1})+' k';
  return String(Math.round(v));
}

// ── 1. Courbe d'engagement (le graphe de pilotage) ───────────────────
// Cumul réel des euros engagés, ligne de budget, et projection au rythme des
// 28 derniers jours. Trois objets sur un seul axe : c'est tout ce qu'il faut pour
// répondre à « est-ce que ça tient ? » sans lire une seule ligne de tableau.
function _pecBurnSvg(E,TL,w){
  if(!TL || !TL.ok || !TL.pts || TL.pts.length<1)
    return window._mvGraphVide('Pas encore assez de travaux datés au journal',
      'Le rythme de dépense se trace dès que des travaux sont validés depuis Parcelles.');
  var c0=window._mvGraphCadre(w,300), et=c0.etroit;
  var c=window._mvGraphCadre(w, et?244:320, { padL:et?46:64, padR:et?12:26, padT:26, padB:et?34:40 });
  var W=c.w, pL=c.padL, pR=c.padR, pT=c.padT, iw=c.iw, ih=c.ih;
  var tMax=Math.max(TL.tEnd, TL.tToday||0, TL.projMs||0, TL.tLast||0);
  if(tMax<=TL.t0) tMax=TL.t0+86400000*30;
  tMax=TL.t0+(tMax-TL.t0)*1.02;
  var pFin=(E && E.cad && E.cad.ok && Math.abs(E.cad.ecart)>5) ? E.projFin : 0;
  var yTop=_pecNiceMax(Math.max(TL.budget, TL.cum, TL.projEndV||0, pFin)*1.05);
  function X(t){ return pL+(Math.max(TL.t0,Math.min(tMax,t))-TL.t0)/(tMax-TL.t0)*iw; }
  function Y(v){ return pT+ih-(Math.max(0,Math.min(yTop,v))/yTop)*ih; }
  var g='';
  // Grille + axe des euros. L'unite est ecrite UNE fois, en tete d'axe.
  for(var i=0;i<=c.grad;i++){
    var v=yTop*i/c.grad, y=Y(v);
    g+='<line x1="'+pL+'" y1="'+y.toFixed(1)+'" x2="'+(W-pR)+'" y2="'+y.toFixed(1)+'" stroke="'+c.col.grille+'" stroke-width="'+c.trait.grille+'"/>'
      +'<text x="'+(pL-8)+'" y="'+(y+4).toFixed(1)+'" text-anchor="end" font-size="'+c.txt.axe+'" fill="'+c.col.texte+'">'+_pecAxeEur(v)+'</text>';
  }
  g+='<text x="'+(pL-8)+'" y="'+(pT-9)+'" text-anchor="end" font-size="'+c.txt.unite+'" fill="'+c.col.texte+'">\u20AC</text>';
  // Axe des mois. Sur ecran etroit on double le pas : on retire des graduations,
  // on ne reduit pas la police.
  var d0=new Date(TL.t0), cur=new Date(d0.getFullYear(),d0.getMonth(),1), guard=0;
  var spanD=(tMax-TL.t0)/86400000, stepM=spanD>460?3:(spanD>210?2:1);
  if(et) stepM=stepM*2;
  while(cur.getTime()<=tMax && guard<80){
    guard++;
    var tm=cur.getTime();
    if(tm>=TL.t0){
      var xm=X(tm);
      g+='<line x1="'+xm.toFixed(1)+'" y1="'+pT+'" x2="'+xm.toFixed(1)+'" y2="'+(pT+ih)+'" stroke="'+c.col.grille+'" stroke-width="'+c.trait.grille+'" stroke-dasharray="2 5"/>'
        +'<text x="'+xm.toFixed(1)+'" y="'+(pT+ih+18)+'" text-anchor="middle" font-size="'+(et?c.txt.mini:c.txt.axe)+'" fill="'+c.col.texte+'">'+_pecMoisCourt(cur.getMonth())+'</text>';
    }
    cur.setMonth(cur.getMonth()+stepM);
  }
  // Aire + courbe du cumul : la mesure.
  var pts=TL.pts.filter(function(p){ return p.t<=tMax; });
  if(!pts.length) pts=[TL.pts[0]];
  var dLine='', dArea='M'+X(pts[0].t).toFixed(1)+' '+Y(0).toFixed(1);
  pts.forEach(function(p,ix){
    var x=X(p.t).toFixed(1), y=Y(p.v).toFixed(1);
    dLine+=(ix?' L':'M')+x+' '+y;
    dArea+=' L'+x+' '+y;
  });
  var lastP=pts[pts.length-1];
  dArea+=' L'+X(lastP.t).toFixed(1)+' '+Y(0).toFixed(1)+' Z';
  g+='<path d="'+dArea+'" fill="'+c.col.mesure+'" opacity="0.13"/>';
  g+='<path d="'+dLine+'" fill="none" stroke="'+c.col.mesure+'" stroke-width="'+c.trait.mesure+'" stroke-linejoin="round" stroke-linecap="round"/>';
  // Projection : le prolongement de la MEME mesure, donc la meme couleur, en
  // pointille — ce n'est pas encore mesure.
  if(TL.pace>0 && TL.projEndV!=null && TL.tEnd>lastP.t){
    g+='<path d="M'+X(lastP.t).toFixed(1)+' '+Y(lastP.v).toFixed(1)+' L'+X(TL.tEnd).toFixed(1)+' '+Y(TL.projEndV).toFixed(1)+'" fill="none" stroke="'+c.col.mesure+'" stroke-width="'+c.trait.prevu+'" stroke-dasharray="7 5" stroke-opacity=".55" stroke-linecap="round"/>'
      +'<circle cx="'+X(TL.tEnd).toFixed(1)+'" cy="'+Y(TL.projEndV).toFixed(1)+'" r="3.5" fill="none" stroke="'+c.col.mesure+'" stroke-width="1.5"/>';
  }
  g+='<circle cx="'+X(lastP.t).toFixed(1)+'" cy="'+Y(lastP.v).toFixed(1)+'" r="4" fill="'+c.col.mesure+'"/>';
  // Budget : une reference decidee. Le trait est en --or ; l'etiquette ne l'est
  // PAS — sur fond papier son contraste tombe a 2,37.
  if(TL.budget>0){
    var yb=Y(TL.budget);
    g+='<line x1="'+pL+'" y1="'+yb.toFixed(1)+'" x2="'+(W-pR)+'" y2="'+yb.toFixed(1)+'" stroke="'+c.col.prevu+'" stroke-width="'+c.trait.prevu+'" stroke-dasharray="9 6"/>'
      +'<text x="'+(W-pR)+'" y="'+(yb-7).toFixed(1)+'" text-anchor="end" font-size="'+c.txt.axe+'" font-weight="700" fill="'+c.col.texte+'">Budget '+_pilEsc(_pecEurK(TL.budget))+'</text>';
  }
  // Cout final projete par la CADENCE mesuree (temps passe / bareme). Trace seulement
  // quand il s'ecarte vraiment du budget : deux lignes qui se superposent ne disent rien.
  if(pFin>0){
    var yf=Y(pFin), au=(pFin>TL.budget), cf=au?c.col.alerte:c.col.fait;
    g+='<line x1="'+pL+'" y1="'+yf.toFixed(1)+'" x2="'+(W-pR)+'" y2="'+yf.toFixed(1)+'" stroke="'+cf+'" stroke-width="'+c.trait.seuil+'" stroke-dasharray="3 5"/>'
      +'<text x="'+(W-pR)+'" y="'+(yf+(au?-7:15)).toFixed(1)+'" text-anchor="end" font-size="'+(et?c.txt.mini:c.txt.unite)+'" font-weight="700" fill="'+cf+'">'+(et?'\u00c0 la cadence \u00b7 ':'Fin projet\u00e9e \u00e0 la cadence \u00b7 ')+_pilEsc(_pecEurK(pFin))+'</text>';
  }
  // Aujourd'hui : un repere, pas une alerte. Le rouge reste au depassement.
  if(TL.tToday!=null && TL.tToday>=TL.t0 && TL.tToday<=tMax){
    var xt=X(TL.tToday);
    g+='<line x1="'+xt.toFixed(1)+'" y1="'+(pT-4)+'" x2="'+xt.toFixed(1)+'" y2="'+(pT+ih)+'" stroke="'+c.col.texte+'" stroke-width="1.4" stroke-dasharray="4 3"/>'
      +'<text x="'+xt.toFixed(1)+'" y="'+(pT-8)+'" text-anchor="middle" font-size="'+c.txt.mini+'" font-weight="700" fill="'+c.col.texte+'">auj.</text>';
  }
  // Objectif de fin des travaux : une date decidee, donc --or comme le budget.
  if(TL.objMs!=null && TL.objMs>=TL.t0 && TL.objMs<=tMax){
    var xo=X(TL.objMs);
    g+='<line x1="'+xo.toFixed(1)+'" y1="'+pT+'" x2="'+xo.toFixed(1)+'" y2="'+(pT+ih)+'" stroke="'+c.col.prevu+'" stroke-width="'+c.trait.prevu+'" stroke-dasharray="3 4"/>'
      +'<text x="'+xo.toFixed(1)+'" y="'+(pT+ih+(et?32:34))+'" text-anchor="middle" font-size="'+c.txt.mini+'" font-weight="700" fill="'+c.col.texte+'">objectif</text>';
  }
  var aria='Rythme d\u2019engagement des d\u00e9penses : '+_pecEurK(TL.cum)+' engag\u00e9s'
    +(TL.budget>0?(' sur un budget de '+_pecEurK(TL.budget)):'')
    +(TL.projEndV!=null?(', projection de fin de p\u00e9riode '+_pecEurK(TL.projEndV)):'')+'.';
  return window._mvGraphSvg(c, aria, g);
}

// ── 2. Donut des postes ──────────────────────────────────────────────
function _pecDonutSvg(items,c1,c2){
  var tot=items.reduce(function(a,b){ return a+(b.v||0); },0);
  if(!(tot>0)) return window._mvGraphVide('Aucun co\u00fbt chiffr\u00e9 sur la p\u00e9riode',
    'Les co\u00fbts arrivent d\u00e8s qu\u2019un taux horaire est saisi dans R\u00e9glages \u203A \u00c9quipe.');
  var cx=100,cy=100,r=88,ri=61,ang=-Math.PI/2,paths='';
  var vis=items.filter(function(x){ return x.v>0; });
  if(vis.length===1){
    paths='<circle cx="'+cx+'" cy="'+cy+'" r="'+((r+ri)/2)+'" fill="none" stroke="'+vis[0].c+'" stroke-width="'+(r-ri)+'"/>';
  } else {
    vis.forEach(function(it){
      var f=it.v/tot, a2=ang+f*Math.PI*2, lg=f>0.5?1:0;
      var x1=cx+r*Math.cos(ang), y1=cy+r*Math.sin(ang);
      var x2=cx+r*Math.cos(a2),  y2=cy+r*Math.sin(a2);
      var xi2=cx+ri*Math.cos(a2),yi2=cy+ri*Math.sin(a2);
      var xi1=cx+ri*Math.cos(ang),yi1=cy+ri*Math.sin(ang);
      paths+='<path d="M'+x1.toFixed(2)+' '+y1.toFixed(2)+' A'+r+' '+r+' 0 '+lg+' 1 '+x2.toFixed(2)+' '+y2.toFixed(2)
           +' L'+xi2.toFixed(2)+' '+yi2.toFixed(2)+' A'+ri+' '+ri+' 0 '+lg+' 0 '+xi1.toFixed(2)+' '+yi1.toFixed(2)+' Z" fill="'+it.c+'"/>';
      ang=a2;
    });
  }
  // Seul graphe de l'ecran a garder une taille fixe : un anneau ne gagne rien a
  // s'elargir. width et height en dur, plafonnes par max-width — jamais etire.
  return '<svg class="pec-svg" viewBox="0 0 200 200" width="200" height="200" style="max-width:210px;margin:0 auto" role="img" aria-label="R\u00e9partition du budget par poste, total '+_pilEsc(c1)+'">'
    +paths
    +'<text x="100" y="97" text-anchor="middle" font-size="24" font-weight="600" font-family="Cormorant Garamond,serif" fill="var(--texte)">'+_pilEsc(c1)+'</text>'
    +'<text x="100" y="116" text-anchor="middle" font-size="11" fill="var(--texte-doux)">'+_pilEsc(c2)+'</text></svg>';
}

// ── 3. Coût par travail ──────────────────────────────────────────────
// La vue qui manquait : ce n'est pas « quelle parcelle coûte cher », c'est « quel
// TRAVAIL coûte cher ». C'est celle-là qui se traduit en décision — mécaniser,
// prendre un renfort, changer la conduite.
function _pecTaskSvg(E,w){
  var ts=(E.tasks||[]).filter(function(t){ return t.bE>0; });
  if(!ts.length) return window._mvGraphVide('Aucun travail chiffr\u00e9 sur la p\u00e9riode',
    'Un travail est chiffr\u00e9 d\u00e8s qu\u2019il a des heures au bar\u00e8me et un taux horaire.');
  var c0=window._mvGraphCadre(w,100), et=c0.etroit;
  // Etroit : le nom passe AU-DESSUS de la barre, la gouttiere de 200 px
  // disparait. Large : les trois colonnes habituelles.
  var pL=et?0:200, pR=et?0:132, rowH=et?48:34, pT=et?24:26, pB=12;
  var c=window._mvGraphCadre(w, pT+ts.length*rowH+pB, { padL:pL, padR:pR, padT:pT, padB:pB });
  var W=c.w, iw=c.iw;
  var mx=_pecNiceMax(ts[0].bE);
  var lx=et?0:pL;
  var g='<rect x="'+lx+'" y="7" width="11" height="9" rx="2" fill="'+_PEC_COL.mo+'"/>'
       +'<text x="'+(lx+16)+'" y="15" font-size="'+c.txt.mini+'" fill="'+c.col.texte+'">Engag\u00e9</text>'
       +'<rect x="'+(lx+78)+'" y="7" width="11" height="9" rx="2" fill="'+_PEC_COL.mo+'" opacity=".28"/>'
       +'<text x="'+(lx+94)+'" y="15" font-size="'+c.txt.mini+'" fill="'+c.col.texte+'">Reste \u00e0 engager</text>';
  ts.forEach(function(t,i){
    var y=pT+i*rowH;
    var wTot=t.bE/mx*iw, wDone=t.fE/mx*iw;
    if(et){
      var by=y+17, bh=14;
      g+='<text x="0" y="'+(y+11)+'" font-size="'+c.txt.axe+'" font-weight="600" fill="var(--texte)">'+_pilEsc(_pecTrunc(_pilTnom(t.nom),22))+'</text>'
        +'<text x="'+W+'" y="'+(y+11)+'" text-anchor="end" font-size="'+c.txt.axe+'" font-weight="700" fill="var(--texte)">'+_pilEsc(_pecEurK(t.bE))+'</text>'
        +'<rect x="0" y="'+by+'" width="'+Math.max(1,wTot).toFixed(1)+'" height="'+bh+'" rx="4" fill="'+_PEC_COL.mo+'" opacity=".22"/>'
        +'<rect x="0" y="'+by+'" width="'+Math.max(0,wDone).toFixed(1)+'" height="'+bh+'" rx="4" fill="'+_PEC_COL.mo+'"/>'
        +'<text x="'+W+'" y="'+(by+bh+11)+'" text-anchor="end" font-size="'+c.txt.mini+'" fill="'+c.col.texte+'">'+_pilEsc(_ecoEur(t.euHa))+'/ha \u00b7 '+Math.round(t.pct)+' %</text>';
    } else {
      var by2=y+5, bh2=17;
      g+='<text x="'+(pL-12)+'" y="'+(by2+13)+'" text-anchor="end" font-size="'+c.txt.val+'" font-weight="600" fill="var(--texte)">'+_pilEsc(_pecTrunc(_pilTnom(t.nom),24))+'</text>'
        +'<rect x="'+pL+'" y="'+by2+'" width="'+Math.max(1,wTot).toFixed(1)+'" height="'+bh2+'" rx="4" fill="'+_PEC_COL.mo+'" opacity=".22"/>'
        +'<rect x="'+pL+'" y="'+by2+'" width="'+Math.max(0,wDone).toFixed(1)+'" height="'+bh2+'" rx="4" fill="'+_PEC_COL.mo+'"/>'
        +'<text x="'+(pL+wTot+10).toFixed(1)+'" y="'+(by2+13)+'" font-size="'+c.txt.val+'" font-weight="700" fill="var(--texte)">'+_pilEsc(_pecEurK(t.bE))+'</text>'
        +'<text x="'+(W-4)+'" y="'+(by2+13)+'" text-anchor="end" font-size="'+c.txt.axe+'" fill="'+c.col.texte+'">'+_pilEsc(_ecoEur(t.euHa))+'/ha \u00b7 '+Math.round(t.pct)+' %</text>';
    }
  });
  return window._mvGraphSvg(c, 'Co\u00fbt par travail : '+ts.length+' travaux chiffr\u00e9s, du plus cher au moins cher.', g);
}

// ── 4. Écart au coût moyen à l'hectare ───────────────────────────────
// Le total d'une parcelle dépend surtout de sa taille : il ne dit rien. L'écart au
// €/ha moyen, lui, isole ce qu'une parcelle a de particulier — plants, tâches en
// plus, équipe plus chère, passages tracteur.
function _pecEcartSvg(E,w){
  var avg=E.coutHaB||0;
  var rs=(E.rows||[]).filter(function(r){ return r.surf>0 && r.coutHa>0; })
    .map(function(r){ return { nom:r.nom, ec:(avg>0?(r.coutHa-avg)/avg*100:0), ha:r.coutHa }; })
    .sort(function(a,b){ return b.ec-a.ec; });
  if(rs.length<2 || !(avg>0)) return window._mvGraphVide('Il faut au moins deux parcelles chiffr\u00e9es pour comparer',
    'Une parcelle est chiffr\u00e9e quand elle a une surface et des travaux valid\u00e9s.');
  var trunc=false;
  if(rs.length>28){ rs=rs.slice(0,14).concat(rs.slice(-14)); trunc=true; }
  var c0=window._mvGraphCadre(w,100), et=c0.etroit;
  var rowH=et?26:24, pT=30, pB=14;
  var c=window._mvGraphCadre(w, pT+rs.length*rowH+pB, { padL:0, padR:0, padT:pT, padB:pB });
  var W=c.w, cx=Math.round(W/2), lab=et?92:150;
  var half=Math.max(28, cx-lab-10);
  var mx=Math.max(12, rs.reduce(function(a,b){ return Math.max(a,Math.abs(b.ec)); },0));
  var g='<line x1="'+cx+'" y1="'+(pT-10)+'" x2="'+cx+'" y2="'+(pT+rs.length*rowH)+'" stroke="'+c.col.texte+'" stroke-width="1.4" opacity=".55"/>'
       +'<text x="'+cx+'" y="'+(pT-16)+'" text-anchor="middle" font-size="'+c.txt.axe+'" font-weight="700" fill="'+c.col.texte+'">moyenne du domaine \u00b7 '+_pilEsc(_ecoEur(avg))+'/ha</text>';
  rs.forEach(function(r,i){
    var y=pT+i*rowH, by=y+4, bh=et?16:15;
    var bw=Math.abs(r.ec)/mx*half, up=r.ec>=0;
    var col=up?(r.ec>25?c.col.alerte:c.col.attention):c.col.fait;
    g+='<rect x="'+(up?cx:cx-bw).toFixed(1)+'" y="'+by+'" width="'+Math.max(1,bw).toFixed(1)+'" height="'+bh+'" rx="3" fill="'+col+'" opacity=".85"/>'
      +'<text x="'+(up?(cx-8):(cx+8))+'" y="'+(by+12)+'" text-anchor="'+(up?'end':'start')+'" font-size="'+c.txt.axe+'" fill="var(--texte)">'+_pilEsc(_pecTrunc(r.nom,et?13:20))+'</text>'
      +'<text x="'+(up?(cx+bw+9):(cx-bw-9)).toFixed(1)+'" y="'+(by+12)+'" text-anchor="'+(up?'start':'end')+'" font-size="'+(et?c.txt.mini:c.txt.unite)+'" font-weight="700" fill="'+col+'">'+(up?'+':'\u2212')+Math.round(Math.abs(r.ec))+' %</text>';
  });
  var svg=window._mvGraphSvg(c, '\u00c9cart au co\u00fbt moyen \u00e0 l\u2019hectare, '+rs.length+' parcelles compar\u00e9es \u00e0 '+_ecoEur(avg)+' par hectare.', g);
  if(trunc) svg+='<div class="pec-note">Les 14 parcelles les plus ch\u00e8res et les 14 les moins ch\u00e8res \u00e0 l\u2019hectare. Le tableau de l\u2019onglet <b>Parcelles</b> les porte toutes.</div>';
  return svg;
}

// ── Verdict : une phrase, celle qu'on dirait à voix haute ────────────
function _pecVerdict(E,TL){
  var em='\uD83D\uDCCA', t='', d='';
  var ec=E.cad.ok?E.cad.ecart:null;
  var sup=(ec!=null)?Math.max(0,E.projFin-E.budget):0;
  if(!E.hasRate){
    em='\uD83D\uDD0C'; t='Le chiffrage n\u2019est pas branch\u00e9';
    d='Sans <b>taux horaire</b> dans les fiches salari\u00e9s, la main-d\u2019\u0153uvre \u2014 le premier poste du domaine \u2014 compte pour z\u00e9ro. Tout le reste de cet onglet reste faux tant que ce n\u2019est pas fait.';
  } else if(E.avc<3){
    em='\uD83C\uDF31'; t='La p\u00e9riode d\u00e9marre';
    d='Budget de r\u00e9f\u00e9rence : <b>'+_pilEsc(_ecoEur(E.budget))+'</b>, soit <b>'+_pilEsc(_ecoEur(E.coutHaB))+' \u00e0 l\u2019hectare</b> sur '+_pilHa(E.tot.surf)+' ha. L\u2019\u00e9cart de cadence devient lisible d\u00e8s qu\u2019un tiers du travail fait porte une \u00e9quipe nomm\u00e9e au journal.';
  } else if(ec===null){
    em='\uD83D\uDCD3'; t='Le budget tient, la cadence reste \u00e0 mesurer';
    d='<b>'+_pilEsc(_ecoEur(E.engage))+'</b> engag\u00e9s sur <b>'+_pilEsc(_ecoEur(E.budget))+'</b> ('+_pilEsc(_pecPct(E.cons))+'), pour '+_pilEsc(_pecPct(E.avc))+' du travail fait. '
      +(E.cad.src
         ? ('L\u2019\u00e9cart de cadence n\u2019est pas encore affich\u00e9 : il compare les heures du planning au bar\u00e8me du travail fait, et sous <b>'+Math.round(E.cad.seuil)+' %</b> d\u2019avancement le travail d\u00e9j\u00e0 r\u00e9alis\u00e9 ne ressemble pas assez \u00e0 celui de toute la p\u00e9riode. Il appara\u00eetra seul.')
         : 'L\u2019\u00e9cart de cadence est indisponible : aucune heure de planning sur cette p\u00e9riode.');
  } else if(ec>15){
    em='\uD83D\uDD34'; t='Le travail prend plus de temps que le bar\u00e8me';
    d='Sur ce qui est fait, l\u2019\u00e9quipe a pass\u00e9 <b>'+_pilEsc(_pecPct(ec))+' de temps en plus</b> que le bar\u00e8me h/ha ne le pr\u00e9voit \u2014 '+_ecoH1(E.cad.hReel)+' h de pr\u00e9sence contre '+_ecoH1(E.cad.hBar)+' h pr\u00e9vues. \u00c0 cette cadence, le reste \u00e0 engager porte la p\u00e9riode autour de <b>'+_pilEsc(_pecEurK(E.projFin))+'</b>, soit <b>'+_pilEsc(_pecEurK(sup))+'</b> au-dessus du budget. \u26a0 La pr\u00e9sence vient du planning : elle contient aussi la cave et l\u2019atelier, une partie de cet \u00e9cart peut ne pas \u00eatre du travail de vigne.';
  } else if(ec>5){
    em='\uD83D\uDFE0'; t='L\u00e9g\u00e8re d\u00e9rive de cadence';
    d='<b>'+_pilEsc(_pecPct(ec))+'</b> de temps en plus que le bar\u00e8me sur le travail fait. Rien d\u2019alarmant \u2014 mais si cela tient jusqu\u2019au bout, la p\u00e9riode co\u00fbtera <b>'+_pilEsc(_pecEurK(E.projFin))+'</b> au lieu de '+_pilEsc(_pecEurK(E.budget))+'. Le d\u00e9tail travail par travail est dans <b>Postes &amp; travaux</b>.';
  } else if(ec<-8){
    em='\uD83D\uDFE2'; t='L\u2019\u00e9quipe va plus vite que le bar\u00e8me';
    d='<b>'+_pilEsc(_pecPct(Math.abs(ec)))+' de temps en moins</b> que pr\u00e9vu sur le travail fait. Deux lectures, qui ne s\u2019excluent pas : le bar\u00e8me h/ha est large, ou l\u2019\u00e9quipe est rod\u00e9e. La pr\u00e9sence est mesur\u00e9e au <b>planning</b> et inclut la cave et l\u2019atelier, donc elle est plut\u00f4t g\u00e9n\u00e9reuse : un \u00e9cart n\u00e9gatif en est d\u2019autant plus significatif. Un bar\u00e8me trop large fausse aussi la planification \u2014 il se r\u00e8gle dans <b>R\u00e9glages \u203A T\u00e2ches</b>.';
  } else {
    em='\uD83D\uDFE2'; t='La cadence colle au bar\u00e8me';
    d='\u00c9cart de <b>'+_pilEsc(_pecPct(Math.abs(ec)))+'</b> entre le temps pass\u00e9 et le bar\u00e8me : le budget de <b>'+_pilEsc(_ecoEur(E.budget))+'</b> est cr\u00e9dible. Engag\u00e9 \u00e0 ce jour <b>'+_pilEsc(_ecoEur(E.engage))+'</b>, reste \u00e0 engager <b>'+_pilEsc(_ecoEur(E.resteE))+'</b>.';
  }
  if(TL && TL.ok && TL.pace>0 && TL.projMs && TL.objMs && TL.projMs>TL.objMs){
    d+=' \u23F1 Au rythme de d\u00e9pense actuel, le budget serait \u00e9puis\u00e9 le <b>'+_pilEsc(_pecDfrMs(TL.projMs))+'</b>, apr\u00e8s l\u2019objectif de fin des travaux.';
  }
  return '<div class="pec-card"><div class="pec-verdict"><div class="em">'+em+'</div><div><div class="t">'+t+'</div><div class="d">'+d+'</div></div></div></div>';
}

// ── Alertes : ce qui manque, ce qui dérape, ce qu'on peut corriger ───
// Chaque alerte dit QUOI, POURQUOI ça compte, et OÙ le régler. Une alerte sans
// point d'atterrissage n'est qu'un reproche.
function _pecAlertes(E,TL){
  var A=[];
  function push(cls,em,html){ A.push('<div class="pec-a '+cls+'"><span class="e">'+em+'</span><div>'+html+'</div></div>'); }
  if(!E.hasRate) push('bad','\u26A0\uFE0F','Aucun <b>taux horaire</b> renseign\u00e9 \u2014 la main-d\u2019\u0153uvre compte pour z\u00e9ro dans tous les chiffres de cet onglet. Il se saisit dans la fiche de chaque salari\u00e9, <b>R\u00e9glages \u203A \u00c9quipe</b>.');
  if(!E.hasGnr) push('warn','\u26FD','Le <b>prix du GNR</b> n\u2019est pas connu : le carburant reste \u00e0 z\u00e9ro. Il se renseigne au prochain <b>appoint de cuve</b> (Tracteur \u203A Entretien) \u2014 la moyenne pond\u00e9r\u00e9e des appoints sert de prix.');
  if(E.phy && !E.phy.anyDose) push('info','\uD83C\uDF3F','Aucune <b>dose structur\u00e9e</b> sur la p\u00e9riode : le co\u00fbt des produits ne peut pas \u00eatre calcul\u00e9. Renseignez dose + unit\u00e9 dans l\u2019assistant de traitement.');
  else if(E.phy && E.phy.unpriced && E.phy.unpriced.length) push('warn','\uD83D\uDCB6','<b>'+E.phy.unpriced.length+' produit'+(E.phy.unpriced.length>1?'s':'')+'</b> sans prix unitaire dans La R\u00e9serve ('+_pilEsc(E.phy.unpriced.slice(0,3).join(', '))+(E.phy.unpriced.length>3?'\u2026':'')+') \u2014 leurs traitements sont compt\u00e9s pour z\u00e9ro.');
  if(E.tracSess>0 && E.tracAnon>0) push('warn','\uD83D\uDE9C','<b>'+E.tracAnon+' session'+(E.tracAnon>1?'s':'')+'</b> sur '+E.tracSess+' sans conducteur identifi\u00e9 (ou sans taux) : ces heures sont valoris\u00e9es au <b>taux moyen du domaine</b>, pas au taux r\u00e9el.');
  if(!E.projOn && E.avc>0) push('info','\uD83D\uDD0D','Sous <b>15 % d\u2019avancement</b>, la projection du tracteur, du GNR et du phyto est neutralis\u00e9e : leur budget affiche le r\u00e9alis\u00e9 seul. Le chiffre montera m\u00e9caniquement.');
  if(TL && TL.ok && TL.socle>0 && E.engage>0 && TL.socle/E.engage>0.10)
    push('info','\uD83E\uDE79','<b>'+_pilEsc(_pecEurK(TL.socle))+'</b> de travail fait n\u2019a <b>aucune trace dat\u00e9e</b> au journal (import ou reconstruction) : ces euros sont pos\u00e9s au premier jour de la p\u00e9riode sur la courbe, faute de mieux. Le total, lui, est juste.');
  var chers=(E.rows||[]).filter(function(r){ return r.surf>0 && E.coutHaB>0 && r.coutHa>E.coutHaB*1.3; })
                        .sort(function(a,b){ return b.coutHa-a.coutHa; });
  if(chers.length) push('warn','\uD83D\uDCC8','<b>'+chers.length+' parcelle'+(chers.length>1?'s':'')+'</b> d\u00e9passe'+(chers.length>1?'nt':'')+' de plus de 30 % le co\u00fbt moyen \u00e0 l\u2019hectare : '
    +_pilEsc(chers.slice(0,3).map(function(r){ return r.nom+' ('+_ecoEur(r.coutHa)+'/ha)'; }).join(', '))+(chers.length>3?'\u2026':'')+'. \u00c0 regarder : plants, passages en plus, ou tri des t\u00e2ches.');
  if(E.cad.ok && E.cad.ecart>15) push('bad','\u23F3','Sur le travail d\u00e9j\u00e0 fait, l\u2019\u00e9quipe a pass\u00e9 <b>'+_pilEsc(_pecPct(E.cad.ecart))+' de temps en plus</b> que le bar\u00e8me h/ha. Si cela tient jusqu\u2019au bout, la p\u00e9riode co\u00fbtera <b>'+_pilEsc(_pecEurK(E.projFin))+'</b> au lieu de '+_pilEsc(_pecEurK(E.budget))+'. Deux causes possibles, et elles se distinguent dans <b>Postes &amp; travaux</b> : un bar\u00e8me trop serr\u00e9 (<b>R\u00e9glages \u203A T\u00e2ches</b>), ou un travail pr\u00e9cis qui d\u00e9rape.');
  else if(!E.cad.ok && E.avc>10) push('info','\uD83D\uDCD3',(E.cad.src
      ? ('L\u2019\u00e9cart de cadence n\u2019est pas encore affich\u00e9 : il demande <b>'+Math.round(E.cad.seuil)+' %</b> du bar\u00e8me r\u00e9alis\u00e9, la p\u00e9riode en est \u00e0 <b>'+Math.round(E.avc)+' %</b>. Rien \u00e0 faire, il appara\u00eetra seul.')
      : 'L\u2019\u00e9cart de cadence est indisponible : aucune heure de planning sur cette p\u00e9riode. C\u2019est le planning qui mesure le temps pass\u00e9, plus les validations du journal.'));
  if(E.tot.retE>0) push('warn','\u23F1','<b>'+_pilEsc(_ecoEur(E.tot.retE))+'</b> de surco\u00fbt de retard mod\u00e9lis\u00e9 sur '+E.tot.nRet+' parcelle'+(E.tot.nRet>1?'s':'')+' ('+E.rcfg.pct+' %/semaine hors fen\u00eatre, plafond '+E.rcfg.capPct+' %). <b>Mod\u00e9lis\u00e9, jamais pay\u00e9</b> : il n\u2019entre dans aucun total.');
  if(!A.length) push('ok','\u2705','Toutes les donn\u00e9es de chiffrage sont en place : taux horaires, prix du GNR, doses et prix des produits. Les chiffres de cet onglet sont complets.');
  return A.join('');
}

// ── Vue 1 : Synthèse ─────────────────────────────────────────────────
function _pecViewSynthese(E,TL){
  var H=_pecVerdict(E,TL);
  var ec=E.cad.ok?E.cad.ecart:null;
  var dCol = (ec===null)?'var(--texte-doux)' : (ec>15?'var(--rouge)' : (ec>5?'var(--orange)' : 'var(--vert-med)'));
  var pE=E.budget>0?Math.min(100,E.engage/E.budget*100):0;
  H+='<div class="pec-card"><div class="pec-kpis">'
    +'<div class="pec-k"><div class="l">Budget de la p\u00e9riode</div><div class="v">'+_pilEsc(_ecoEur(E.budget))+'</div>'
      +'<div class="s">'+_pilEsc(_ecoEur(E.coutHaB))+' \u00e0 l\u2019hectare sur '+_pilHa(E.tot.surf)+' ha'+(E.projOn?' \u00b7 m\u00e9canique et phyto projet\u00e9s':'')+'</div></div>'
    +'<div class="pec-k"><div class="l">Engag\u00e9 \u00e0 ce jour</div><div class="v">'+_pilEsc(_ecoEur(E.engage))+'</div>'
      +'<div class="s">'+_pilEsc(_pecPct(E.cons))+' du budget \u00b7 '+_pilEsc(_ecoEur(E.coutHaE))+'/ha</div></div>'
    +'<div class="pec-k"><div class="l">Reste \u00e0 engager</div><div class="v">'+_pilEsc(_ecoEur(E.resteE))+'</div>'
      +'<div class="s">'+_ecoH1(E.tot.rH)+' h de travail encore \u00e0 faire</div></div>'
    +'<div class="pec-k"><div class="l">\u00c9cart de cadence</div>'
      +'<div class="v" style="color:'+dCol+'">'+(ec===null?'\u2014':((ec>0?'+':'')+_pecPct(ec)))+'</div>'
      +'<div class="s">'+(ec===null
          ? (E.cad.src?('mesurable d\u00e8s '+Math.round(E.cad.seuil)+' % du bar\u00e8me r\u00e9alis\u00e9 \u00b7 '+Math.round(E.avc)+' % \u00e0 ce jour'):'aucune heure de planning sur la p\u00e9riode')
          : ('temps pass\u00e9 contre bar\u00e8me \u00b7 fin projet\u00e9e \u00e0 <b>'+_pilEsc(_pecEurK(E.projFin))+'</b>'))+'</div></div>'
    +'</div>'
    +'<div class="pec-cb" style="padding-top:16px">'
    +'<div class="pec-bar"><i style="width:'+pE.toFixed(1)+'%;background:'+_PEC_COL.mo+'"></i></div>'
    +'<div class="pec-leg"><span class="pec-lg"><em style="background:'+_PEC_COL.mo+'"></em>Engag\u00e9 <b>'+_pilEsc(_ecoEur(E.engage))+'</b></span>'
    +'<span class="pec-lg"><em style="background:var(--gris-clair)"></em>Reste <b>'+_pilEsc(_ecoEur(E.resteE))+'</b></span>'
    +'<span class="pec-lg" style="color:var(--texte-doux)">Travail fait <b>'+_pilEsc(_pecPct(E.avc))+'</b></span></div>'
    +'</div></div>';

  // Courbe d'engagement
  var sub='';
  if(TL && TL.ok){
    var pj = (TL.pace>0 && TL.projEndV!=null) ? ('fin de p\u00e9riode projet\u00e9e \u00e0 '+_pecEurK(TL.projEndV)) : 'rythme non mesurable';
    sub='Rythme des 28 derniers jours : <b>'+_pilEsc(_ecoEur(TL.pace))+' par jour</b> \u00b7 '+_pilEsc(pj)
      + (TL.projMs?(' \u00b7 budget \u00e9puis\u00e9 le <b>'+_pilEsc(_pecDfrMs(TL.projMs))+'</b>'):'');
  } else sub='Le trac\u00e9 se remplit \u00e0 mesure que les travaux sont valid\u00e9s au journal.';
  window._mvGraphSuivre('#pec-g-burn', function(w){ return _pecBurnSvg(E,TL,w); });
  H+='<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Rythme de d\u00e9pense</div><div class="pec-cs">'+sub+'</div></div>'
    +'<div class="pec-cb"><div id="pec-g-burn"></div>'
    +'<div class="pec-leg"><span class="pec-lg"><em style="background:var(--terre)"></em>Engag\u00e9 cumul\u00e9</span>'
    +'<span class="pec-lg"><i style="border-top:2px dashed var(--terre);opacity:.6"></i>Projection au rythme constat\u00e9</span>'
    +'<span class="pec-lg"><i style="border-top:2px dashed var(--or)"></i>Budget</span>'
    +(E.cad.ok&&Math.abs(E.cad.ecart)>5?'<span class="pec-lg"><em style="background:'+(E.projFin>E.budget?'var(--rouge)':'var(--vert-med)')+'"></em>Fin projet\u00e9e \u00e0 la cadence mesur\u00e9e</span>':'')
    +(TL&&TL.objMs?'<span class="pec-lg"><i style="border-top:2px dashed var(--or)"></i>Objectif de fin des travaux</span>':'')+'</div>'
    +'<div class="pec-note">Chaque euro est pos\u00e9 \u00e0 <b>sa</b> date : la main-d\u2019\u0153uvre sur les validations du journal, le tracteur et le GNR sur la date de session, le phyto sur la date de traitement. Une personne pr\u00e9sente sur plusieurs parcelles le m\u00eame jour est r\u00e9partie \u00e0 parts \u00e9gales \u2014 le journal dit qui et quand, jamais combien d\u2019heures.<br>'
      +'L\u2019<b>\u00e9cart de cadence</b> vient de l\u00e0 : les heures <b>r\u00e9ellement travaill\u00e9es au planning</b> sur la p\u00e9riode, moins les heures de sessions tracteur, compar\u00e9es aux heures de bar\u00e8me du travail fait. '
      +(E.cad.ok
         ? ('<b>'+_ecoH1(E.cad.hReel)+' h</b> de pr\u00e9sence contre <b>'+_ecoH1(E.cad.hBar)+' h</b> pr\u00e9vues'+(E.cad.hTrac>0?(', apr\u00e8s d\u00e9duction de '+_ecoH1(E.cad.hTrac)+' h de tracteur'):'')+'. \u26a0 Le planning dit que la personne \u00e9tait l\u00e0, jamais ce qu\u2019elle a fait : la cave, l\u2019atelier et le bureau restent dans ce total. La pr\u00e9sence est donc plut\u00f4t sur\u00e9valu\u00e9e.')
         : ('Neutralis\u00e9 sous '+Math.round(E.cad.seuil)+' % du bar\u00e8me r\u00e9alis\u00e9 \u2014 '+Math.round(E.avc)+' % \u00e0 ce jour.'))+'</div>'
    +'</div></div>';

  // Prix de revient
  var rec=E.rec, recTxt;
  if(rec.src==='saison') recTxt='r\u00e9colte de la p\u00e9riode \u00b7 '+_pilNum(rec.kg)+' kg sur '+rec.n+' parcelle'+(rec.n>1?'s':'');
  else if(rec.src==='hist') recTxt='derni\u00e8re r\u00e9colte connue \u2014 mill\u00e9sime <b>'+_pilEsc(String(rec.mil))+'</b> \u00b7 '+_pilNum(rec.kg)+' kg';
  else recTxt='aucune r\u00e9colte enregistr\u00e9e \u2014 les rendements se saisissent au <b>Cuvier</b>';
  var mini='<div><div class="l">Co\u00fbt \u00e0 l\u2019hectare</div><div class="v">'+_pilEsc(_ecoEur(E.coutHaB))+'</div><div class="s">budget \u00b7 engag\u00e9 '+_pilEsc(_ecoEur(E.coutHaE))+'</div></div>';
  if(rec.kg>0){
    mini+='<div><div class="l">Co\u00fbt du kilo</div><div class="v">'+_pilEsc(_ecoEur2(E.eurKg))+'<small> \u20AC/kg</small></div><div class="s">sur '+_pilNum(rec.kg)+' kg de raisin</div></div>'
        +'<div><div class="l">Co\u00fbt de la bouteille</div><div class="v">'+_pilEsc(_ecoEur2(E.eurBt))+'<small> \u20AC</small></div><div class="s">\u2248 '+_pilNum(E.bouteilles)+' cols \u00e0 '+_pilEsc(_ecoEur2(E.kgB))+' kg/col</div></div>';
  } else {
    mini+='<div><div class="l">Co\u00fbt du kilo</div><div class="v">\u2014</div><div class="s">saisir la r\u00e9colte au Cuvier</div></div>';
  }
  if(E.hasPlant) mini+='<div><div class="l">Co\u00fbt du plant</div><div class="v">'+_pilEsc(_ecoEur2(E.eurPlant))+'<small> \u20AC</small></div><div class="s">'+_pilNum(E.tot.trous)+' plants \u00e0 '+E.minTrou+' min</div></div>';
  mini+='<div><div class="l">Co\u00fbt de l\u2019heure</div><div class="v">'+_pilEsc(_ecoEur2(E.rate))+'<small> \u20AC/h</small></div><div class="s">taux moyen de l\u2019\u00e9quipe de terrain</div></div>';
  H+='<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Prix de revient</div><div class="pec-cs">'+recTxt+'. Le co\u00fbt \u00e0 la bouteille repose sur une <b>hypoth\u00e8se de conversion</b> ('+_pilEsc(_ecoEur2(E.kgB))+' kg de raisin par col), r\u00e9glable dans <b>Outils \u203A Param\u00e9trage</b> avec la journ\u00e9e de r\u00e9f\u00e9rence. Ce sont les co\u00fbts de <b>culture</b> : ni vinification, ni s\u00e8che, ni foncier, ni amortissement.</div></div>'
    +'<div class="pec-cb"><div class="pec-mini">'+mini+'</div>'
    +'<div class="pec-acts"><button class="pec-btn" data-pec="param"><span>\u2699\uFE0F</span> R\u00e9gler les hypoth\u00e8ses</button>'
    +'<button class="pec-btn" data-pec="sub" data-v="pos"><span>\uD83E\uDDED</span> Voir o\u00f9 part l\u2019argent</button></div></div></div>';

  H+='<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Ce qu\u2019il faut regarder</div></div><div class="pec-cb">'+_pecAlertes(E,TL)+'</div></div>';
  return H;
}

// ── Vue 2 : Postes & travaux ─────────────────────────────────────────
function _pecViewPostes(E){
  var items=E.postes.filter(function(p){ return p.budget>0; }).map(function(p){ return { n:p.lab, v:p.budget, c:p.col }; });
  var legs=E.postes.map(function(p){
    var pc=E.budget>0?(p.budget/E.budget*100):0;
    return '<tr><td class="n"><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:'+p.col+';margin-right:8px;vertical-align:-1px"></span>'+_pilEsc(p.lab)
      +(p.proj?' <span class="pec-pill" style="background:var(--or-pale);color:var(--or-tx,#7A5E12)">projet\u00e9</span>':'')+'</td>'
      +'<td class="r">'+_pilEsc(_ecoEur(p.fait))+'</td>'
      +'<td class="r">'+_pilEsc(_ecoEur(p.budget))+'</td>'
      +'<td class="r">'+_pilEsc(_pecPct(pc))+'</td>'
      +'<td class="r">'+(E.tot.surf>0?_pilEsc(_ecoEur(p.budget/E.tot.surf)):'\u2014')+'</td>'
      +'<td style="color:var(--texte-doux)">'+_pilEsc(p.det)+'</td></tr>';
  }).join('');
  var retRow = E.tot.retE>0
    ? '<tr><td class="n" style="color:'+_PEC_COL.ret+'"><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:'+_PEC_COL.ret+';opacity:.5;margin-right:8px;vertical-align:-1px"></span>Surco\u00fbt de retard <span class="pec-pill" style="background:var(--orange-pale);color:var(--orange)">hors total</span></td>'
      +'<td class="r">\u2014</td><td class="r" style="color:'+_PEC_COL.ret+'">+'+_pilEsc(_ecoEur(E.tot.retE))+'</td><td class="r">\u2014</td><td class="r">\u2014</td>'
      +'<td style="color:var(--texte-doux)">'+_ecoH1(E.tot.retH)+' h mod\u00e9lis\u00e9es, jamais pay\u00e9es</td></tr>'
    : '';
  var H='<div class="pec-card"><div class="pec-ch"><div class="pec-ct">O\u00f9 part l\u2019argent</div>'
    +'<div class="pec-cs">R\u00e9partition du <b>budget</b> de la p\u00e9riode. La main-d\u2019\u0153uvre vigne est un bar\u00e8me complet ; tracteur, GNR et phyto ne sont connus qu\u2019en r\u00e9alis\u00e9 et sont '+(E.projOn?'extrapol\u00e9s au rythme constat\u00e9':'affich\u00e9s en r\u00e9alis\u00e9 seul (avancement trop faible pour projeter)')+'.</div></div>'
    +'<div class="pec-cb"><div class="pec-grid2">'
    +'<div>'+_pecDonutSvg(items,_pecEurK(E.budget),'budget')+'</div>'
    +'<div class="pec-scroll"><table class="pec-tbl" style="min-width:520px"><thead><tr><th>Poste</th><th class="r">Engag\u00e9</th><th class="r">Budget</th><th class="r">Part</th><th class="r">\u20AC/ha</th><th>Base de calcul</th></tr></thead>'
    +'<tbody>'+legs+retRow+'</tbody>'
    +'<tfoot><tr><td>Total</td><td class="r">'+_pilEsc(_ecoEur(E.engage))+'</td><td class="r">'+_pilEsc(_ecoEur(E.budget))+'</td><td class="r">100 %</td><td class="r">'+_pilEsc(_ecoEur(E.coutHaB))+'</td><td></td></tr></tfoot>'
    +'</table></div></div></div></div>';

  var trows=(E.tasks||[]).map(function(t){
    return '<tr><td class="n">'+_pilEsc(_pilTnom(t.nom))+'</td>'
      +'<td class="r">'+_ecoH1(t.bH)+' h</td>'
      +'<td class="r">'+Math.round(t.pct)+' %</td>'
      +'<td class="r">'+_pilEsc(_ecoEur(t.fE))+'</td>'
      +'<td class="r">'+_pilEsc(_ecoEur(t.rE))+'</td>'
      +'<td class="r n">'+_pilEsc(_ecoEur(t.bE))+'</td>'
      +'<td class="r">'+_pilEsc(_ecoEur(t.euHa))+'</td>'
      +'<td class="r">'+_pilEsc(_pecPct(t.part))+'</td></tr>';
  }).join('');
  window._mvGraphSuivre('#pec-g-task', function(w){ return _pecTaskSvg(E,w); });
  H+='<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Co\u00fbt par travail</div>'
    +'<div class="pec-cs">Le total d\u2019une parcelle d\u00e9pend surtout de sa taille. Le co\u00fbt d\u2019un <b>travail</b>, lui, se d\u00e9cide : m\u00e9caniser, prendre un renfort, changer la conduite. Main-d\u2019\u0153uvre vigne uniquement (bar\u00e8me h/ha \u00d7 surface \u00d7 taux de l\u2019\u00e9quipe).</div></div>'
    +'<div class="pec-cb"><div id="pec-g-task"></div>'
    +'<div class="pec-scroll" style="margin-top:14px"><table class="pec-tbl"><thead><tr><th>Travail</th><th class="r">Heures</th><th class="r">Fait</th><th class="r">Engag\u00e9</th><th class="r">Reste</th><th class="r">Budget</th><th class="r">\u20AC/ha</th><th class="r">Part</th></tr></thead>'
    +'<tbody>'+(trows||'<tr><td colspan="8" class="pec-empty">Aucun travail chiffr\u00e9.</td></tr>')+'</tbody></table></div>'
    +'<div class="pec-acts"><button class="pec-btn" data-pec="sub" data-v="par"><span>\uD83C\uDF47</span> Voir parcelle par parcelle</button></div>'
    +'</div></div>';
  return H;
}

// ── Vue 3 : Parcelles ────────────────────────────────────────────────
var _PEC_COLS=[
  ['nom',   'Parcelle',  0],
  ['surf',  'ha',        1],
  ['pct',   'Fait',      1],
  ['moF',   'MO',        1],
  ['tracF', 'Tracteur',  1],
  ['gnrF',  'GNR',       1],
  ['phyF',  'Phyto',     1],
  ['engage','Engag\u00e9',1],
  ['reste', 'Reste',     1],
  ['budget','Budget',    1],
  ['coutHa','\u20AC/ha', 1]
];
function _pecSortRows(E){
  var k=_PEC_PSORT, dir=_PEC_PDIR;
  return (E.rows||[]).slice().sort(function(a,b){
    var x=a[k], y=b[k];
    if(typeof x==='string'||typeof y==='string') return String(x).localeCompare(String(y),'fr')*(dir<0?-1:1);
    return ((Number(y)||0)-(Number(x)||0))*(dir<0?1:-1);
  });
}
function _pecViewParcelles(E){
  var rows=_pecSortRows(E);
  var head=_PEC_COLS.map(function(c){
    var on=(c[0]===_PEC_PSORT);
    return '<th class="s'+(c[2]?' r':'')+(on?' on':'')+'" data-pec="ps" data-k="'+c[0]+'">'+_pilEsc(c[1])+(on?(_PEC_PDIR<0?' \u25BC':' \u25B2'):'')+'</th>';
  }).join('');
  var body=rows.map(function(r){
    var badge = (r.src==='reel')
      ? '<span class="pec-pill" style="background:var(--vert-pale);color:var(--vert-tx,#31601C)" title="taux pond\u00e9r\u00e9 par l\u2019\u00e9quipe r\u00e9ellement pr\u00e9sente">\u00e9quipe r\u00e9elle</span>'
      : '<span class="pec-pill" style="background:var(--gris-clair);color:var(--texte-doux)" title="aucune \u00e9quipe identifi\u00e9e au journal">taux moyen</span>';
    var ret = r.retE>0 ? ' <span class="pec-pill" style="background:var(--orange-pale);color:var(--orange)" title="surco\u00fbt de retard mod\u00e9lis\u00e9, hors total">+'+_ecoEur(r.retE)+' retard</span>' : '';
    var plants = r.trous>0 ? ' <span class="pec-pill" style="background:var(--tag-purple-bg);color:var(--tag-purple-tx)">'+_pilNum(r.trous)+' plants</span>' : '';
    var pcol=_pilPctColor(r.pct);
    return '<tr><td class="n">'+_pilEsc(r.nom)+'<div style="margin-top:4px;display:flex;gap:5px;flex-wrap:wrap">'+badge+plants+ret+'</div></td>'
      +'<td class="r">'+_pilHa(r.surf)+'</td>'
      +'<td class="r" style="color:'+pcol+';font-weight:700">'+Math.round(r.pct)+' %</td>'
      +'<td class="r">'+_pilEsc(_ecoEur(r.moF))+'</td>'
      +'<td class="r">'+(r.tracF>0?_pilEsc(_ecoEur(r.tracF)):'\u2014')+'</td>'
      +'<td class="r">'+(r.gnrF>0?_pilEsc(_ecoEur(r.gnrF)):'\u2014')+'</td>'
      +'<td class="r">'+(r.phyF>0?_pilEsc(_ecoEur(r.phyF)):'\u2014')+'</td>'
      +'<td class="r">'+_pilEsc(_ecoEur(r.engage))+'</td>'
      +'<td class="r">'+_pilEsc(_ecoEur(r.reste))+'</td>'
      +'<td class="r n">'+_pilEsc(_ecoEur(r.budget))+'</td>'
      +'<td class="r">'+_pilEsc(_ecoEur(r.coutHa))+'</td></tr>';
  }).join('') || '<tr><td colspan="11" class="pec-empty">Aucune parcelle active.</td></tr>';
  var foot='<tr><td>'+rows.length+' parcelle'+(rows.length>1?'s':'')+'</td>'
    +'<td class="r">'+_pilHa(E.tot.surf)+'</td><td class="r">'+Math.round(E.avc)+' %</td>'
    +'<td class="r">'+_pilEsc(_ecoEur(E.tot.moF))+'</td><td class="r">'+_pilEsc(_ecoEur(E.tot.tracF))+'</td>'
    +'<td class="r">'+_pilEsc(_ecoEur(E.tot.gnrF))+'</td><td class="r">'+_pilEsc(_ecoEur(E.tot.phyF))+'</td>'
    +'<td class="r">'+_pilEsc(_ecoEur(E.engage))+'</td><td class="r">'+_pilEsc(_ecoEur(E.tot.moR))+'</td>'
    +'<td class="r">'+_pilEsc(_ecoEur(E.budget))+'</td><td class="r">'+_pilEsc(_ecoEur(E.coutHaB))+'</td></tr>';
  var H='<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Co\u00fbt parcelle par parcelle</div>'
    +'<div class="pec-cs">Cliquez sur un en-t\u00eate pour trier. <b>MO</b> = main-d\u2019\u0153uvre d\u00e9j\u00e0 faite ; <b>Reste</b> = main-d\u2019\u0153uvre encore \u00e0 faire ; <b>Budget</b> = total de la p\u00e9riode. Tracteur, GNR et phyto sont du r\u00e9alis\u00e9.</div></div>'
    +'<div class="pec-cb"><div class="pec-scroll"><table class="pec-tbl" style="min-width:900px"><thead><tr>'+head+'</tr></thead><tbody>'+body+'</tbody><tfoot>'+foot+'</tfoot></table></div>'
    +'<div class="pec-acts"><button class="pec-btn" data-pec="csv"><span>\u2B07\uFE0F</span> T\u00e9l\u00e9charger le tableau (CSV)</button>'
    +'<button class="pec-btn" data-pec="copy"><span>\uD83D\uDCCB</span> Copier pour un tableur</button></div>'
    +'<div class="pec-note">Le co\u00fbt d\u2019une parcelle est un <b>co\u00fbt de culture</b> : ni vinification, ni foncier, ni amortissement du mat\u00e9riel. Les heures viennent du bar\u00e8me h/ha du domaine, le taux de la fiche de paie de chaque salari\u00e9, et le tracteur du taux de son conducteur.</div>'
    +'</div></div>';
  window._mvGraphSuivre('#pec-g-ecart', function(w){ return _pecEcartSvg(E,w); });
  H+='<div class="pec-card"><div class="pec-ch"><div class="pec-ct">\u00c9cart au co\u00fbt moyen \u00e0 l\u2019hectare</div>'
    +'<div class="pec-cs">Ce qu\u2019une parcelle a de particulier, une fois la surface neutralis\u00e9e : plants \u00e0 remplacer, passages en plus, \u00e9quipe plus ch\u00e8re, tri des t\u00e2ches.</div></div>'
    +'<div class="pec-cb"><div id="pec-g-ecart"></div></div></div>';
  return H;
}

// ── Export : le tableau, tel qu'il est trié à l'écran ────────────────
function _pecTableTxt(E,sep){
  var rows=_pecSortRows(E);
  var L=[['Parcelle','Surface ha','Avancement %','MO engagee EUR','Tracteur EUR','GNR EUR','Phyto EUR','Engage EUR','Reste EUR','Budget EUR','EUR par ha','Heures budget','Heures restantes','Taux EUR/h','Source taux','Plants','Retard modelise EUR'].join(sep)];
  function n2(v){ return String(Math.round((Number(v)||0)*100)/100).replace('.',','); }
  rows.forEach(function(r){
    L.push([String(r.nom).replace(/[\t\r\n;]/g,' '), n2(r.surf), Math.round(r.pct), n2(r.moF), n2(r.tracF), n2(r.gnrF), n2(r.phyF),
            n2(r.engage), n2(r.reste), n2(r.budget), n2(r.coutHa), n2(r.bH), n2(r.rH), n2(r.tx),
            (r.src==='reel'?'equipe reelle':'taux moyen'), r.trous||0, n2(r.retE)].join(sep));
  });
  L.push(['TOTAL', n2(E.tot.surf), Math.round(E.avc), n2(E.tot.moF), n2(E.tot.tracF), n2(E.tot.gnrF), n2(E.tot.phyF),
          n2(E.engage), n2(E.tot.moR), n2(E.budget), n2(E.coutHaB), n2(E.tot.bH), n2(E.tot.rH), n2(E.rate), '', E.tot.trous, n2(E.tot.retE)].join(sep));
  return L.join('\r\n');
}
function _pecExport(kind,E){
  var per=(typeof window._pilSaison==='function'&&window._pilSaison())?(window._pilSaison().nom||'periode'):'periode';
  var safe=String(per).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9_-]+/g,'-');
  if(kind==='copy'){
    var txt=_pecTableTxt(E,'\t');
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(function(){
        if(window.showToast) window.showToast('Tableau copi\u00e9 \u2014 collez-le dans votre tableur','#3D6B27');
      }, function(){
        if(window.showToast) window.showToast('Copie refus\u00e9e par le navigateur','#B85A1A');
      });
    } else if(window.showToast) window.showToast('Copie indisponible sur ce navigateur','#B85A1A');
    return;
  }
  var csv=_pecTableTxt(E,';'), done=false;
  try{
    var b=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    var u=URL.createObjectURL(b);
    var a=document.createElement('a');
    a.href=u; a.download='mavigne-couts-'+safe+'.csv'; a.style.display='none';
    document.body.appendChild(a); a.click();
    setTimeout(function(){ if(a.parentNode) a.parentNode.removeChild(a); URL.revokeObjectURL(u); },600);
    done=true;
  }catch(e){
    if(window.logError) window.logError({level:'warning',cat:'pilotage',msg:'export CSV impossible'});
  }
  if(done){ if(window.showToast) window.showToast('Tableau export\u00e9','#3D6B27'); }
  else _pecExport('copy',E);
}

// ── Barre de sous-vues ───────────────────────────────────────────────
var _PEC_SUBS=[['syn','\uD83D\uDCC8','Synth\u00e8se'],['pos','\uD83E\uDDED','Postes & travaux'],['par','\uD83C\uDF47','Parcelles'],['exe','\uD83D\uDCC6','Exercice']];
function _pecSubNav(E){
  var b=_PEC_SUBS.map(function(s){
    return '<button data-pec="sub" data-v="'+s[0]+'"'+(s[0]===_PEC_SUB?' class="on"':'')+'><span style="margin-right:6px">'+s[1]+'</span>'+s[2]+'</button>';
  }).join('');
  var ctx='<div class="pec-cs" style="text-align:right;min-width:0">'+_pilEsc(_pilSaisonNom()||'\u2014')+' \u00b7 '
    +_pilHa(E.tot.surf)+' ha \u00b7 taux moyen '+_pilEsc(_ecoEur2(E.rate))+' \u20AC/h</div>';
  return '<div class="pec-subnav"><div class="pec-sub">'+b+'</div>'+ctx+'</div>';
}

// ── Onglet ÉCONOMIE ──────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════
// EXERCICE COMPTABLE — « d'une date de bilan à l'autre »
// ════════════════════════════════════════════════════════════════════════════════
// POURQUOI CE N'EST PAS LE BUDGET DE CAMPAGNE FILTRE PAR DATES.
// Le budget de campagne (_pecData) est STRUCTUREL : surface x bareme h/ha x taux.
// Il ne porte AUCUNE date, et il ne peut pas en porter — rien dans le modele ne dit
// QUAND une tache se fera. Un exercice, lui, est une pure fenetre de dates. On ne
// peut donc pas decouper l'un pour obtenir l'autre : il faut repartir des faits
// DATES. C'est ce que fait ce moteur, et c'est pour cela qu'il vit a cote et non
// dedans.
//
// ⚠⚠ LE PIEGE CENTRAL, EVITE : LE DOUBLE COMPTAGE DE LA CONDUITE.
// Le budget de campagne separe « main-d'oeuvre vigne » (bareme h/ha) et « conduite
// tracteur » (heures de session x taux du conducteur) parce que le bareme vigne ne
// contient pas les heures passees sur le tracteur. Le PLANNING, lui, contient DEJA
// toutes les heures payees — vigne, tracteur, cave, entretien, bureau. Additionner
// la masse salariale du planning ET le cout de conduite compterait donc DEUX FOIS
// les heures de tractoriste. L'exercice compte la paie UNE fois, et n'ajoute au
// tracteur que son CARBURANT.
//
// LES TROIS POSTES, ET RIEN D'AUTRE :
//   SALAIRES CHARGES  planning (_planPaidRange) x taux individuel (paie) — tout le
//                     travail humain, effectif des equipes collectives compris.
//   CARBURANT GNR     heures de session x conso x prix du litre, sessions DATEES.
//   ACHATS D'INTRANTS le prix HT porte par chaque achat de La Reserve, a sa date.
//                     C'est la FACTURE, pas la valorisation de stock : c'est elle
//                     qui entre dans un compte de resultat.
// La consommation phyto valorisee est affichee A PART, hors total : c'est une
// mesure de stock, la mettre dans le total ferait compter le produit deux fois.
//
// ⚠ CE QUE MA VIGNE NE CONNAIT PAS, ET QUI EST DIT A L'ECRAN : fermage, amortissements,
//   assurances, cotisations du chef d'exploitation, embouteillage, frais generaux.
//   Le total n'est donc PAS un compte de resultat, et l'ecran ne laisse personne le
//   croire. Un chiffre qu'on compare a autre chose que ce qu'il mesure est pire
//   qu'un chiffre absent.
// ════════════════════════════════════════════════════════════════════════════════

// Exercice consulte (annee d'OUVERTURE). null = celui d'aujourd'hui. Memorise par
// utilisateur et par domaine, comme la sous-vue et le tri du tableau parcelles.
var _PEX_AN = null;
function _pexEx(){
  if(typeof window._mvExerciceAn!=='function') return null;
  return (_PEX_AN==null) ? window._mvExercice() : window._mvExerciceAn(_PEX_AN);
}
// ISO -> Date LOCALE. Jamais new Date('AAAA-MM-JJ') : cette forme est lue en UTC et
// decale d'un jour a l'ouest de Greenwich comme a l'est selon l'heure.
function _pexD(iso){
  var s=String(iso||'').slice(0,10);
  return new Date(parseInt(s.slice(0,4),10), parseInt(s.slice(5,7),10)-1, parseInt(s.slice(8,10),10));
}
function _pexIso(y,m,d){ var mm=m+1; return y+'-'+(mm<10?'0':'')+mm+'-'+(d<10?'0':'')+d; }
// Les mois de l'exercice, bornes par la fenetre (le premier et le dernier peuvent
// etre partiels si la cloture ne tombe pas en fin de mois).
function _pexMoisWin(ex){
  var out=[], d=_pexD(ex.d0), end=_pexD(ex.d1), guard=0;
  while(guard<24){
    guard++;
    var y=d.getFullYear(), m=d.getMonth();
    var last=new Date(y,m+1,0);
    var a=_pexIso(y,m,1), b=_pexIso(y,m,last.getDate());
    if(a<ex.d0) a=ex.d0;
    if(b>ex.d1) b=ex.d1;
    out.push({k:y+'-'+m, y:y, m:m, d0:a, d1:b, lbl:_pecMoisCourt(m)});
    if(b>=ex.d1) break;
    d=new Date(y,m+1,1);
    if(d>end) break;
  }
  return out;
}

// Source UNIQUE du libelle : le tableau des postes et la legende du graphe lisent la
// meme fonction. Le poste s'appelle « chargés » parce qu'il L'EST — le taux de chaque
// fiche est un cout employeur (cf. la definition posee dans _ecoCfg).
function _pexSalLab(){ return 'Salaires charg\u00e9s'; }

// ── Moteur ──────────────────────────────────────────────────────────
// `noCmp` coupe la comparaison a l'exercice precedent : c'est le garde-fou contre
// la recursion infinie, l'appel N-1 se faisant avec noCmp=true.
function _pexData(ex, noCmp){
  ex = ex || _pexEx();
  if(!ex) return null;
  var cfg=_ecoCfg();
  var mois=_pexMoisWin(ex);
  var byM={}; mois.forEach(function(mo){ byM[mo.k]={sal:0, gnr:0, ach:0}; });
  var _n=new Date();
  var auj=(typeof window._mvAujIso==='function')?window._mvAujIso():_pexIso(_n.getFullYear(),_n.getMonth(),_n.getDate());
  var enCours=(auj>=ex.d0 && auj<=ex.d1);

  // ── 1) SALAIRES CHARGES ────────────────────────────────────────────
  // Qui ? Toute personne SOUS CONTRAT sur la fenetre — la meme question que partout
  // ailleurs depuis le correctif des saisonniers disparus de l'historique. Le
  // « bureau » N'EST PAS exclu : c'est un salaire, et on chiffre une masse salariale.
  // Combien ? heures payees x taux CHARGE de la fiche. Le taux est deja le cout
  // employeur : rien ne se multiplie par-dessus (definition unique dans _ecoCfg).
  var okPer=(typeof window._mvEnContratSurPeriode==='function');
  var mbrs=(window.MEMBRES||[]).filter(function(m){
    if(!m||!m.nom) return false;
    return okPer ? window._mvEnContratSurPeriode(m,ex.d0,ex.d1) : (m.statut!=='Inactif');
  });
  var canPaid=(typeof window._planPaidRange==='function');
  var canWork=(typeof window._planWorkPersRange==='function');
  var gens=[], salT=0, hPaid=0, hWork=0, nSansTaux=0, hSansTaux=0;
  mbrs.forEach(function(mb){
    if(!canPaid) return;
    var tx=(typeof window._mvPaieTauxEff==='function')?(Number(window._mvPaieTauxEff(mb))||0):0;
    var hp=0;
    mois.forEach(function(mo){
      var h=Number(window._planPaidRange(mb,_pexD(mo.d0),_pexD(mo.d1)))||0;
      if(h>0){ hp+=h; byM[mo.k].sal+=h*tx; }
    });
    var hw=canWork?(Number(window._planWorkPersRange(mb,_pexD(ex.d0),_pexD(ex.d1)))||0):0;
    if(hp<=0 && hw<=0) return;
    // On compte les personnes SANS taux, et on retient leurs heures : c'est l'ampleur
    // du trou, pas son nombre de lignes, qui interesse celui qui lit un exercice.
    if(!(tx>0)){ nSansTaux++; hSansTaux+=hp; }
    gens.push({ nom:mb.nom, tx:tx, hp:hp, hw:hw, eur:hp*tx,
                coll:!!(window._mvEstCollectif&&window._mvEstCollectif(mb)),
                bureau:!!mb.bureau });
    salT+=hp*tx; hPaid+=hp; hWork+=hw;
  });
  gens.sort(function(a,b){ return b.eur-a.eur || (a.nom<b.nom?-1:1); });

  // ── 2) CARBURANT GNR ───────────────────────────────────────────────
  // Fenetre passee a _ecoTracHByParc : MEME fonction que la campagne, filtree par
  // dates au lieu de la periode. Aucune copie privee de « ce que coute une session ».
  var trac=_ecoTracHByParc({d0:ex.d0,d1:ex.d1});
  var gnrT=0, tracH=0;
  Object.keys(trac.gnrByDate||{}).forEach(function(iso){
    var v=trac.gnrByDate[iso]||0; gnrT+=v;
    var k=parseInt(iso.slice(0,4),10)+'-'+(parseInt(iso.slice(5,7),10)-1);
    if(byM[k]) byM[k].gnr+=v;
  });
  Object.keys(trac.hByDate||{}).forEach(function(iso){ tracH+=trac.hByDate[iso]||0; });
  var litres=(cfg.conso>0)?tracH*cfg.conso:0;

  // ── 3) ACHATS D'INTRANTS (La Reserve) ──────────────────────────────
  // Le prix HT est OPTIONNEL a la saisie : on compte les lignes sans prix et on le
  // DIT, plutot que de laisser un total silencieusement sous-evalue.
  var ach=(window.INTRANTS&&Array.isArray(window.INTRANTS.achats))?window.INTRANTS.achats:[];
  var prodBy={};
  ((window.INTRANTS&&window.INTRANTS.produits)||[]).forEach(function(pr){ if(pr&&pr.id) prodBy[pr.id]=pr; });
  var achT=0, nAch=0, nAchSansPrix=0, achRows=[];
  ach.forEach(function(a){
    if(!a||!a.date) return;
    var iso=String(a.date).slice(0,10);
    if(iso<ex.d0||iso>ex.d1) return;
    nAch++;
    var eur=Number(a.prix)||0;
    if(!(eur>0)) nAchSansPrix++;
    achT+=eur;
    var k=parseInt(iso.slice(0,4),10)+'-'+(parseInt(iso.slice(5,7),10)-1);
    if(byM[k]) byM[k].ach+=eur;
    var pr=prodBy[a.prodId]||null;
    achRows.push({ date:iso, nom:(pr&&pr.nom)||'\u2014', four:a.four||'',
                   q:Number(a.q)||0, unite:(pr&&pr.unite)||'', eur:eur });
  });
  achRows.sort(function(a,b){ return a.date<b.date?1:-1; });

  // ── 4) INFO hors total : consommation phyto valorisee ──────────────
  var phy=_ecoPhytoByParc({d0:ex.d0,d1:ex.d1});
  var phyConso=0; Object.keys(phy.cost||{}).forEach(function(k){ phyConso+=phy.cost[k]||0; });

  // ── Totaux ─────────────────────────────────────────────────────────
  var total=salT+gnrT+achT;
  var surf=0;
  (window.PARCELLES||[]).forEach(function(p){ if(p&&p.statut!=='Arrachee') surf+=parseFloat(p.surface)||0; });
  var postes=[
    { k:'sal', lab:_pexSalLab(), col:_PEC_COL.mo,  eur:salT,
      det:_ecoH1(hPaid)+' h pay\u00e9es \u00b7 '+gens.length+' personne'+(gens.length>1?'s':'')
          +' \u00b7 co\u00fbt employeur (taux charg\u00e9 des fiches)' },
    { k:'gnr', lab:'Carburant GNR',         col:_PEC_COL.gnr, eur:gnrT, det:_pilNum(litres)+' L \u00e0 '+_ecoEur2(cfg.gnrL)+' \u20AC/L' },
    { k:'ach', lab:'Achats d\u2019intrants', col:_PEC_COL.phy, eur:achT, det:nAch+' achat'+(nAch>1?'s':'')+' de La R\u00e9serve' }
  ];
  postes.forEach(function(p){ p.part = total>0 ? (p.eur/total*100) : 0; });

  var cmp=null;
  if(!noCmp && typeof window._mvExerciceAn==='function'){
    var prev=_pexData(window._mvExerciceAn(ex.an-1), true);
    if(prev && prev.total>0) cmp=prev;
  }
  return { ex:ex, mois:mois, byM:byM, gens:gens, postes:postes, achRows:achRows,
           salT:salT, gnrT:gnrT, achT:achT, total:total,
           hPaid:hPaid, hWork:hWork, tracH:tracH, litres:litres, phyConso:phyConso,
           surf:surf, coutHa:(surf>0?total/surf:0),
           nSansTaux:nSansTaux, hSansTaux:hSansTaux,
           nAch:nAch, nAchSansPrix:nAchSansPrix,
           hasPlan:canPaid, hasGnr:(cfg.gnrL>0), enCours:enCours, auj:auj, cmp:cmp };
}

// ── Reglage : mois d'ouverture de l'exercice ────────────────────────
// L'ECRITURE PASSE PAR window._ecoCfgSet (reglages.js), comme toute autre hypothese.
// ⚠ Mais _ecoCfgSet applique une LISTE BLANCHE : une cle absente est un no-op
//   SILENCIEUX. C'est exactement le motif qui a fait dormir le journal des erreurs
//   pendant des mois. On relit donc apres l'appel, et si rien n'a bouge on le DIT.
//   Cas concret : pilotage.js deploye sans reglages.js -> la cle n'est pas connue.
function _pexSetMois(v){
  if(!(typeof window.isAdmin==='function' && window.isAdmin())){
    if(window.showToast) window.showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#C0392B');
    return;
  }
  var m=parseInt(v,10); if(isNaN(m)||m<0||m>11) return;
  var cur=(typeof window._mvExerciceMois==='function')?window._mvExerciceMois():7;
  if(m===cur) return;
  if(typeof window._ecoCfgSet==='function') window._ecoCfgSet('eco','exercice_mois',m);
  var after=(typeof window._mvExerciceMois==='function')?window._mvExerciceMois():7;
  if(after!==m){
    if(window.showToast) window.showToast('R\u00e9glage non enregistr\u00e9 \u2014 mise \u00e0 jour de R\u00e9glages requise','#B85A1A');
    return;
  }
  _PEX_AN=null;
  _pecSaveSt();
  if(window.showToast) window.showToast('\u2705 Exercice comptable mis \u00e0 jour','#3D6B27');
  _pilFillContent(_pilData());
}
window._pexSetMois=_pexSetMois;

// ── Vue « Exercice » ────────────────────────────────────────────────
function _pexBarreEx(E){
  var list=(typeof window._mvExerciceList==='function')?window._mvExerciceList(4):[];
  var chips=list.map(function(x){
    return '<button data-pec="exy" data-v="'+x.an+'"'+(x.an===E.ex.an?' class="on"':'')+'>'+_pilEsc(x.court)+'</button>';
  }).join('');
  return '<div class="pex-bar"><div class="pec-sub">'+chips+'</div>'
    +'<div class="pex-win">'+_pilEsc(E.ex.lbl)+(E.enCours?' \u00b7 <b>en cours</b>':'')+'</div></div>';
}
function _pexMoisChoix(){
  var cur=(typeof window._mvExerciceMois==='function')?window._mvExerciceMois():7;
  var lbl=window.MV_EX_MOIS_LBL||['janvier','f\u00e9vrier','mars','avril','mai','juin','juillet','ao\u00fbt','septembre','octobre','novembre','d\u00e9cembre'];
  var admin=!!(typeof window.isAdmin==='function' && window.isAdmin());
  var opts=lbl.map(function(nm,i){ return '<option value="'+i+'"'+(i===cur?' selected':'')+'>1er '+nm+'</option>'; }).join('');
  return '<div class="pec-card"><div class="pec-cb">'
    +'<div class="pex-set"><div><div class="pex-setl">\u2699\uFE0F Ouverture de l\u2019exercice</div>'
    +'<div class="pex-sets">'+(admin
      ? 'Le mois o\u00f9 votre exercice s\u2019ouvre. Par d\u00e9faut le 1<sup>er</sup> ao\u00fbt, l\u2019usage viticole\u00a0: on cl\u00f4ture apr\u00e8s la r\u00e9colte, pas au milieu. Ce choix vaut pour tout le domaine et ne touche ni aux campagnes, ni aux cong\u00e9s, ni \u00e0 aucun chiffre existant.'
      : '\uD83D\uDD12 Lecture seule \u2014 seul un administrateur peut changer la date de bilan.')+'</div></div>'
    +'<select class="pex-selm"'+(admin?'':' disabled')+' onchange="window._pexSetMois&&window._pexSetMois(this.value)">'+opts+'</select>'
    +'</div></div></div>';
}
// Barres empilees mois par mois. Un exercice se lit dans son rythme : deux mois de
// vendange pesent plus que six mois d'hiver, et c'est ca qu'on veut voir.
function _pexGraph(E,w){
  var M=E.mois;
  if(!M.length) return window._mvGraphVide('Aucun mois dans cet exercice',
    'Choisis un autre exercice dans la barre au-dessus.');
  var maxV=0; M.forEach(function(mo){ var b=E.byM[mo.k]; var t=b.sal+b.gnr+b.ach; if(t>maxV) maxV=t; });
  if(!(maxV>0)) return window._mvGraphVide('Aucune d\u00e9pense dat\u00e9e sur cet exercice',
    'Les d\u00e9penses se posent \u00e0 la date de leur travail, de leur plein ou de leur achat.');
  var top=_pecNiceMax(maxV*1.08);
  var c0=window._mvGraphCadre(w,100), et=c0.etroit;
  var c=window._mvGraphCadre(w, et?208:250, { padL:et?44:58, padR:14, padT:16, padB:et?30:34 });
  var W=c.w, pL=c.padL, pR=c.padR, pT=c.padT, iw=c.iw, ih=c.ih;
  var step=iw/M.length, bw=Math.min(46, step*0.66);
  function Y(v){ return pT+ih-(v/top)*ih; }
  var g='';
  for(var i=0;i<=c.grad;i++){
    var v=top*i/c.grad, y=Y(v);
    g+='<line x1="'+pL+'" y1="'+y.toFixed(1)+'" x2="'+(W-pR)+'" y2="'+y.toFixed(1)+'" stroke="'+c.col.grille+'" stroke-width="'+c.trait.grille+'"/>'
      +'<text x="'+(pL-7)+'" y="'+(y+4).toFixed(1)+'" text-anchor="end" font-size="'+(et?c.txt.mini:c.txt.axe)+'" fill="'+c.col.texte+'">'+_pilEsc(_pecAxeEur(v))+'</text>';
  }
  g+='<text x="'+(pL-7)+'" y="'+(pT-4)+'" text-anchor="end" font-size="'+c.txt.unite+'" fill="'+c.col.texte+'">\u20AC</text>';
  var pas=et?(M.length>8?3:2):(M.length<=13?1:2);
  M.forEach(function(mo,i){
    var b=E.byM[mo.k], x=pL+step*i+(step-bw)/2, acc=0;
    [['sal',_PEC_COL.mo],['gnr',_PEC_COL.gnr],['ach',_PEC_COL.phy]].forEach(function(pr){
      var v=b[pr[0]]||0; if(!(v>0)) return;
      var y0=Y(acc+v), y1=Y(acc), hh=Math.max(1,y1-y0);
      g+='<rect x="'+x.toFixed(1)+'" y="'+y0.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+hh.toFixed(1)+'" fill="'+pr[1]+'" opacity="0.92"/>';
      acc+=v;
    });
    if(i%pas===0)
      g+='<text x="'+(x+bw/2).toFixed(1)+'" y="'+(c.h-11)+'" text-anchor="middle" font-size="'+(et?c.txt.mini:c.txt.axe)+'" fill="'+c.col.texte+'">'+_pilEsc(mo.lbl)+'</text>';
  });
  return window._mvGraphSvg(c, 'D\u00e9penses mois par mois sur l\u2019exercice, salaires charg\u00e9s, carburant et achats.', g)
    +'<div class="pec-leg">'
    +'<span class="pec-lg"><em style="background:'+_PEC_COL.mo+'"></em>'+_pexSalLab()+'</span>'
    +'<span class="pec-lg"><em style="background:'+_PEC_COL.gnr+'"></em>Carburant GNR</span>'
    +'<span class="pec-lg"><em style="background:'+_PEC_COL.phy+'"></em>Achats d\u2019intrants</span>'
    +'</div>';
}

// Alertes, KPI et le garde-fou « ce n'est pas un compte de resultat ».
function _pexEntete(E){
  var A=[];
  function push(cls,em,html){ A.push('<div class="pec-a '+cls+'"><span class="e">'+em+'</span><div>'+html+'</div></div>'); }
  if(!E.hasPlan) push('bad','\u26A0\uFE0F','Le <b>planning</b> n\u2019est pas charg\u00e9\u00a0: les salaires comptent pour z\u00e9ro. Ouvrez une fois le module <b>Planning</b>, puis revenez.');
  if(E.nSansTaux>0) push('warn','\uD83D\uDCB6','<b>'+E.nSansTaux+' personne'+(E.nSansTaux>1?'s':'')+'</b> sans <b>taux horaire</b>'
    +(E.hSansTaux>0?(', soit <b>'+_ecoH1(E.hSansTaux)+' h</b> pay\u00e9es compt\u00e9es \u00e0 z\u00e9ro'):'\u00a0: leurs heures comptent pour z\u00e9ro')
    +' dans la masse salariale\u00a0: le total ci-dessus est sous-\u00e9valu\u00e9 d\u2019autant. Le taux se saisit dans la fiche de chaque salari\u00e9 (<b>R\u00e9glages \u203A \u00c9quipe</b>).');
  // Ce que contient exactement le poste << salaires >>, dit UNE fois. Deux bandeaux
  // vivaient ici, qui presentaient le taux des fiches comme un BRUT et invitaient a le
  // majorer d'un coefficient : c'etait faux, et cela conduisait a compter les
  // cotisations deux fois. Le taux de la fiche EST le cout employeur.
  if(E.salT>0) push('info','\uD83E\uDDFE','Les salaires sont compt\u00e9s au <b>taux horaire charg\u00e9</b> de chaque fiche\u00a0: le co\u00fbt employeur, cotisations patronales comprises, tel qu\u2019il a \u00e9t\u00e9 saisi dans <b>R\u00e9glages \u203A \u00c9quipe</b>. Aucun coefficient n\u2019est ajout\u00e9 par-dessus\u00a0: ce total vaut ce que valent vos taux. Le montant exact des cotisations reste celui de votre journal de paie.');
  if(!E.hasGnr && E.tracH>0) push('warn','\u26FD','Le <b>prix du GNR</b> n\u2019est pas connu\u00a0: le carburant reste \u00e0 z\u00e9ro malgr\u00e9 '+_ecoH1(E.tracH)+' h de tracteur. Il se renseigne au prochain <b>appoint de cuve</b> (Tracteur \u203A Entretien).');
  if(E.nAchSansPrix>0) push('warn','\uD83E\uDDFE','<b>'+E.nAchSansPrix+' achat'+(E.nAchSansPrix>1?'s':'')+'</b> sans prix HT dans La R\u00e9serve\u00a0: le total des intrants est sous-\u00e9valu\u00e9 d\u2019autant. Le prix se compl\u00e8te sur la ligne d\u2019achat.');
  if(E.enCours) push('info','\uD83D\uDD53','Exercice <b>en cours</b>\u00a0: ce total est arr\u00eat\u00e9 aux d\u00e9penses d\u00e9j\u00e0 saisies, ce n\u2019est pas une pr\u00e9vision de cl\u00f4ture. Les mois \u00e0 venir sont \u00e0 z\u00e9ro parce qu\u2019ils n\u2019ont rien \u00e0 montrer, pas parce qu\u2019ils ne co\u00fbteront rien.');
  if(E.phyConso>0) push('info','\uD83C\uDF3F','Les traitements de l\u2019exercice repr\u00e9sentent <b>'+_pilEsc(_ecoEur(E.phyConso))+'</b> de produit consomm\u00e9. Ce montant n\u2019est <b>pas</b> dans le total\u00a0: c\u2019est une sortie de stock, l\u2019achat a d\u00e9j\u00e0 \u00e9t\u00e9 compt\u00e9 le jour de la facture. L\u2019\u00e9cart entre les deux, c\u2019est votre stock.');

  var cmp=E.cmp, dPct=(cmp&&cmp.total>0)?((E.total-cmp.total)/cmp.total*100):null;
  var kpis='<div class="pec-kpis">'
    +'<div class="pec-k"><div class="l">D\u00e9penses de l\u2019exercice</div><div class="v">'+_pilEsc(_ecoEur(E.total))+'</div>'
      +'<div class="s">'+_pilEsc(E.ex.lbl)+'</div></div>'
    +'<div class="pec-k"><div class="l">\u00c0 l\u2019hectare</div><div class="v">'+_pilEsc(_ecoEur(E.coutHa))+'</div>'
      +'<div class="s">sur '+_pilHa(E.surf)+' ha en production</div></div>'
    +'<div class="pec-k"><div class="l">Part des salaires</div><div class="v">'+_pilEsc(_pecPct(E.total>0?E.salT/E.total*100:0))+'</div>'
      +'<div class="s">'+_ecoH1(E.hPaid)+' h pay\u00e9es \u00b7 '+E.gens.length+' personne'+(E.gens.length>1?'s':'')+'</div></div>'
    +(dPct!=null
      ? '<div class="pec-k"><div class="l">Contre '+_pilEsc(cmp.ex.court)+'</div><div class="v">'+(dPct>0?'+':'')+_pilEsc(_pecPct(dPct))+'</div>'
        +'<div class="s">'+_pilEsc(_pecEurK(cmp.total))+' l\u2019exercice pr\u00e9c\u00e9dent</div></div>'
      : '<div class="pec-k"><div class="l">Contre l\u2019an dernier</div><div class="v">\u2014</div><div class="s">pas de donn\u00e9es sur l\u2019exercice pr\u00e9c\u00e9dent</div></div>')
    +'</div>';

  var garde='<div class="pec-card"><div class="pec-cb"><div class="pex-warn">'
    +'<div class="t">\uD83E\uDDFE Ce total n\u2019est pas un compte de r\u00e9sultat</div>'
    +'<div class="d">Ma Vigne conna\u00eet ce qui passe par elle\u00a0: les heures pay\u00e9es, le carburant, les achats d\u2019intrants. '
    +'Elle ne conna\u00eet <b>ni le fermage, ni les amortissements, ni les assurances, ni vos cotisations d\u2019exploitant, ni l\u2019embouteillage, ni les frais g\u00e9n\u00e9raux</b>. '
    +'Ce chiffre sert \u00e0 piloter vos charges d\u2019exploitation d\u2019un bilan \u00e0 l\u2019autre \u2014 il ne remplace pas votre comptable, et il ne se compare pas ligne \u00e0 ligne \u00e0 son bilan.</div>'
    +'</div></div></div>';

  var pr=E.postes.map(function(p){
    var av=cmp?((cmp.postes.filter(function(q){return q.k===p.k;})[0]||{}).eur||0):null;
    var dv=(av!=null&&av>0)?((p.eur-av)/av*100):null;
    return '<tr><td class="n"><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:'+p.col+';margin-right:8px;vertical-align:-1px"></span>'+_pilEsc(p.lab)+'</td>'
      +'<td class="r">'+_pilEsc(_ecoEur(p.eur))+'</td>'
      +'<td class="r">'+_pilEsc(_pecPct(p.part))+'</td>'
      +'<td class="r">'+(E.surf>0?_pilEsc(_ecoEur(p.eur/E.surf)):'\u2014')+'</td>'
      +'<td class="r">'+(dv!=null?((dv>0?'+':'')+_pilEsc(_pecPct(dv))):'\u2014')+'</td>'
      +'<td style="color:var(--texte-doux)">'+_pilEsc(p.det)+'</td></tr>';
  }).join('');
  var tPostes='<div class="pec-card"><div class="pec-ch"><div class="pec-ct">O\u00f9 est parti l\u2019argent</div>'
    +'<div class="pec-cs">Trois postes, et rien d\u2019autre. La <b>conduite</b> du tracteur est dans les salaires \u2014 la compter aussi en tracteur reviendrait \u00e0 payer deux fois le tractoriste\u00a0; seul son <b>carburant</b> s\u2019ajoute.</div></div>'
    +'<div class="pec-cb"><div class="pec-scroll"><table class="pec-tbl" style="min-width:560px">'
    +'<thead><tr><th>Poste</th><th class="r">Montant</th><th class="r">Part</th><th class="r">\u20AC/ha</th><th class="r">vs '+_pilEsc(cmp?cmp.ex.court:'N-1')+'</th><th>Base de calcul</th></tr></thead>'
    +'<tbody>'+pr+'</tbody>'
    +'<tfoot><tr><td>Total</td><td class="r">'+_pilEsc(_ecoEur(E.total))+'</td><td class="r">100 %</td><td class="r">'+_pilEsc(_ecoEur(E.coutHa))+'</td><td class="r">'+(dPct!=null?((dPct>0?'+':'')+_pilEsc(_pecPct(dPct))):'\u2014')+'</td><td></td></tr></tfoot>'
    +'</table></div></div></div>';
  return { alertes:A.join(''), kpis:kpis, garde:garde, tPostes:tPostes };
}

// Detail des salaires — ADMIN uniquement : ce tableau expose la remuneration de
// chaque personne. Meme regle que partout ailleurs (paie est admin-only en LECTURE).
function _pexTableSal(E){
  if(!(typeof window.isAdmin==='function' && window.isAdmin()))
    return '<div class="pec-card"><div class="pec-cb"><div class="pec-empty">\uD83D\uDD12 Le d\u00e9tail par personne est r\u00e9serv\u00e9 aux administrateurs.</div></div></div>';
  if(!E.gens.length)
    return '<div class="pec-card"><div class="pec-cb"><div class="pec-empty">Aucune heure pos\u00e9e au planning sur cet exercice.</div></div></div>';
  var rows=E.gens.map(function(g){
    var cp=Math.max(0,g.hp-g.hw);
    return '<tr><td class="n">'+_pilEsc(g.nom)
      +(g.coll?' <span class="pec-pill" style="background:var(--or-pale);color:var(--or-tx,#7A5E12)">\u00e9quipe</span>':'')
      +(g.bureau?' <span class="pec-pill" style="background:var(--gris-clair);color:var(--texte-doux)">bureau</span>':'')+'</td>'
      +'<td class="r">'+_ecoH1(g.hp)+' h</td>'
      +'<td class="r">'+_ecoH1(g.hw)+' h</td>'
      +'<td class="r">'+(cp>0.05?(_ecoH1(cp)+' h'):'\u2014')+'</td>'
      +'<td class="r">'+(g.tx>0?(_ecoEur2(g.tx)+' \u20AC'):'<span style="color:'+_PEC_COL.ret+'">\u2014</span>')+'</td>'
      +'<td class="r">'+_pilEsc(_ecoEur(g.eur))+'</td></tr>';
  }).join('');
  var cpT=Math.max(0,E.hPaid-E.hWork);
  return '<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Les salaires, personne par personne</div>'
    +'<div class="pec-cs">Heures <b>pay\u00e9es</b> (un cong\u00e9 pay\u00e9 en fait partie) et heures <b>au champ</b>\u00a0: l\u2019\u00e9cart entre les deux, ce sont les cong\u00e9s et les absences r\u00e9mun\u00e9r\u00e9es. Une ligne d\u2019\u00e9quipe compte son effectif r\u00e9el, jour par jour.'
    +' Le taux affich\u00e9 est le <b>taux horaire charg\u00e9</b> de la fiche \u2014 le co\u00fbt employeur\u00a0: heures pay\u00e9es \u00d7 taux = co\u00fbt.'
    +'</div></div>'
    +'<div class="pec-cb"><div class="pec-scroll"><table class="pec-tbl" style="min-width:560px">'
    +'<thead><tr><th>Personne</th><th class="r">Pay\u00e9es</th><th class="r">Au champ</th><th class="r">CP &amp; abs.</th><th class="r">Taux charg\u00e9</th><th class="r">Co\u00fbt</th></tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +'<tfoot><tr><td>Total</td><td class="r">'+_ecoH1(E.hPaid)+' h</td><td class="r">'+_ecoH1(E.hWork)+' h</td><td class="r">'+(cpT>0.05?(_ecoH1(cpT)+' h'):'\u2014')+'</td><td class="r"></td><td class="r">'+_pilEsc(_ecoEur(E.salT))+'</td></tr></tfoot>'
    +'</table></div></div></div>';
}
// Achats de La Reserve tombant dans la fenetre — la piece comptable, a sa date.
function _pexTableAch(E){
  if(!E.achRows.length)
    return '<div class="pec-card"><div class="pec-cb"><div class="pec-empty">Aucun achat d\u2019intrant enregistr\u00e9 sur cet exercice (La R\u00e9serve).</div></div></div>';
  var rows=E.achRows.slice(0,60).map(function(a){
    return '<tr><td class="n">'+_pilEsc(_pecDfrMs(_pexD(a.date).getTime()))+'</td>'
      +'<td>'+_pilEsc(a.nom)+'</td>'
      +'<td>'+_pilEsc(a.four||'\u2014')+'</td>'
      +'<td class="r">'+(a.q>0?(_pilEsc(_ecoEur2(a.q))+' '+_pilEsc(a.unite||'')):'\u2014')+'</td>'
      +'<td class="r">'+(a.eur>0?_pilEsc(_ecoEur(a.eur)):'<span style="color:'+_PEC_COL.ret+'">sans prix</span>')+'</td></tr>';
  }).join('');
  return '<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Les achats d\u2019intrants</div>'
    +'<div class="pec-cs">Le <b>prix HT port\u00e9 par la ligne d\u2019achat</b>, \u00e0 sa date \u2014 la facture, pas la sortie de stock.'
    +(E.achRows.length>60?(' Les 60 plus r\u00e9cents sont affich\u00e9s\u00a0; le total porte sur les '+E.achRows.length+'.'):'')+'</div></div>'
    +'<div class="pec-cb"><div class="pec-scroll"><table class="pec-tbl" style="min-width:520px">'
    +'<thead><tr><th>Date</th><th>Produit</th><th>Fournisseur</th><th class="r">Quantit\u00e9</th><th class="r">Prix HT</th></tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +'<tfoot><tr><td>Total</td><td></td><td></td><td></td><td class="r">'+_pilEsc(_ecoEur(E.achT))+'</td></tr></tfoot>'
    +'</table></div></div></div>';
}
// Assemblage de la sous-vue.
function _pexView(){
  var E=_pexData();
  if(!E) return '<div class="pec-empty">Exercice indisponible \u2014 rechargez l\u2019application.</div>';
  var V=_pexEntete(E);
  window._mvGraphSuivre('#pec-g-pex', function(w){ return _pexGraph(E,w); });
  return _pexBarreEx(E)
    + V.kpis
    + (V.alertes?('<div class="pec-card"><div class="pec-cb">'+V.alertes+'</div></div>'):'')
    + '<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Le rythme de l\u2019exercice</div>'
      + '<div class="pec-cs">Mois par mois, ce qui est sorti. Un exercice viticole n\u2019est pas r\u00e9gulier \u2014 c\u2019est justement ce qu\u2019on veut voir.</div></div>'
      + '<div class="pec-cb"><div id="pec-g-pex"></div></div></div>'
    + V.tPostes
    + V.garde
    + _pexTableSal(E)
    + _pexTableAch(E)
    + _pexMoisChoix();
}

function _pilTabEco(d){
  _pecCss();
  var E=_pecData();
  if(!E.configured){
    return '<div class="pec-card"><div class="pec-verdict"><div class="em">\uD83D\uDCB6</div><div>'
      +'<div class="t">Le pilotage \u00e9conomique n\u2019est pas encore branch\u00e9</div>'
      +'<div class="d">Deux donn\u00e9es suffisent \u00e0 tout d\u00e9clencher :<br>'
      +'\u2022 un <b>taux horaire</b> dans la fiche de chaque salari\u00e9 (<b>R\u00e9glages \u203A \u00c9quipe</b>) ;<br>'
      +'\u2022 le <b>prix du GNR</b>, saisi au prochain <b>appoint de cuve</b> (<b>Tracteur \u203A Entretien</b>).<br>'
      +'Le budget, le rythme de d\u00e9pense, le co\u00fbt par travail et le prix de revient en d\u00e9coulent tout seuls \u2014 rien d\u2019autre \u00e0 saisir. Ces deux donn\u00e9es sont r\u00e9serv\u00e9es aux administrateurs.</div>'
      +'<div class="pec-acts"><button class="pec-btn" data-pec="param"><span>\u2699\uFE0F</span> Param\u00e9trage du module</button></div>'
      +'</div></div></div>';
  }
  var TL=_pecTimeline(E);
  var body;
  if(_PEC_SUB==='pos') body=_pecViewPostes(E);
  else if(_PEC_SUB==='par') body=_pecViewParcelles(E);
  else if(_PEC_SUB==='exe') body=_pexView();
  else body=_pecViewSynthese(E,TL);
  return '<div class="pec-wrap">'+_pecSubNav(E)+body+'</div>';
}

// ── Conformité : délai de rentrée (heures) — même logique que utils.dreEffectif ──
function _pilDreHours(drae,type,dreH,dreHc){
  var nU=Number(drae); nU=(isFinite(nU)&&nU>0)?nU:0;
  var nC=Number(dreH); nC=(isFinite(nC)&&nC>0)?nC:0;
  var eff=nU>nC?nU:nC;
  if(eff>0) return eff;
  if(type==='MFSC'||type==='Adjuvant') return 0;
  return 6;
}
function _cfmCuCol(r){ return r>1?'--rouge':r>=0.875?'--orange':r>=0.75?'--or':'--vert-med'; }
// Cuivre : cumul métal 7 ans / 28 kg·ha (source unique _cuParcRollSum).
function _cfmCuivre(){
  if(typeof window._cuParcRollSum!=='function') return { avail:false };
  var PLAF=28;
  var parc=(window.PARCELLES||[]).filter(function(p){ return p && p.statut!=='Arrachee'; });
  var rows=parc.map(function(p){ var cu=window._cuParcRollSum(p.nom)||0; return { nom:p.nom, surf:parseFloat(p.surface)||0, cu:cu, ratio:cu/PLAF }; })
    .filter(function(r){ return r.cu>0; })
    .sort(function(a,b){ return b.cu-a.cu; });
  return { avail:true, plaf:PLAF, rows:rows,
           over:rows.filter(function(r){ return r.ratio>1; }).length,
           warn:rows.filter(function(r){ return r.ratio>=0.875 && r.ratio<=1; }).length };
}
// Passages phyto par parcelle (saison consultée). Un passage = une intervention
// (sessionId distinct), quel que soit le nombre de produits mélangés.
function _cfmPassages(){
  var s=(typeof window._pilSaison==='function')?window._pilSaison():null;
  var seasonNom=(s&&s.nom)?s.nom:'';
  function _in(t){
    var sn=(window._saisonForDate&&t.date)?window._saisonForDate(t.date):null; sn=sn||t.saison||'';
    if(sn) return sn===seasonNom;
    return seasonNom===(((window.getSaisonActive&&window.getSaisonActive())||{}).nom||'');
  }
  var per={};
  (window.TRAITEMENTS||[]).forEach(function(t){
    if(!t||!_in(t)) return;
    var sid=t.sessionId||('__'+(t.date||''));
    (t.parcelles||[]).forEach(function(nom){ if(!nom) return; if(!per[nom]) per[nom]={sids:{},prod:0}; per[nom].sids[sid]=1; per[nom].prod++; });
  });
  return (window.PARCELLES||[]).filter(function(p){ return p && p.statut!=='Arrachee'; })
    .map(function(p){ var e=per[p.nom]; return { nom:p.nom, pass:e?Object.keys(e.sids).length:0, prod:e?e.prod:0 }; })
    .filter(function(r){ return r.pass>0; })
    .sort(function(a,b){ return b.pass-a.pass; });
}
function _cfmIftRef(){ var c=(window.CONFIG&&window.CONFIG.conformite)||{}; var v=Number(c.ift_ref); return (isFinite(v)&&v>0)?{v:v,def:false}:{v:12,def:true}; }
// DRE actif : dernier traitement par parcelle + fenêtre de rentrée encore ouverte.
function _cfmDre(){
  var traits=(window.TRAITEMENTS||[]).slice();
  if(!traits.length) return { none:true };
  traits.sort(function(a,b){ return String((b&&b.date)||'').localeCompare(String((a&&a.date)||'')); });
  var now=Date.now(), active=[], seen={};
  traits.forEach(function(t){
    if(!t||!t.date) return;
    var m=(window._phResolve?window._phResolve(t):{drae:t.drae,type:t.type,dreH:0,dreHc:''});
    var dreH=_pilDreHours(m.drae,m.type,m.dreH,m.dreHc);
    var hstr=t.heureFin||t.heureDebut||'08:00';
    var startMs=new Date(t.date+'T'+hstr).getTime(); if(isNaN(startMs)) startMs=new Date(t.date).getTime();
    var endMs=startMs+dreH*3600000;
    (t.parcelles||[]).forEach(function(nom){
      if(seen[nom]) return; seen[nom]=1; // ce traitement est le plus récent pour cette parcelle
      if(dreH>0 && endMs>now) active.push({ nom:nom, produit:t.produit||'', dreH:dreH, endMs:endMs, remainH:Math.ceil((endMs-now)/3600000), date:t.date });
    });
  });
  active.sort(function(a,b){ return b.endMs-a.endMs; });
  return { none:false, active:active };
}
function _cfmDreEnd(ms){
  var e=new Date(ms), now=new Date();
  var hh=e.getHours(), mm=e.getMinutes();
  var t=(hh<10?'0'+hh:hh)+' h'+(mm?(' '+(mm<10?'0'+mm:mm)):'');
  function _sd(a,b){ return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
  var tom=new Date(now); tom.setDate(tom.getDate()+1);
  if(_sd(e,now)) return t;
  if(_sd(e,tom)) return 'demain '+t;
  var mo=e.getMonth()+1, dj=e.getDate();
  return _pilDfr(e.getFullYear()+'-'+(mo<10?'0'+mo:mo)+'-'+(dj<10?'0'+dj:dj))+' '+t;
}

// ── Onglet CONFORMITÉ ──
function _pilTabCfm(d){
  var H='<div class="pil-panels">', any=false;
  // Cuivre
  if(_pilShow('cfm_cuivre')){
    any=true;
    var cu=_cfmCuivre();
    if(!cu.avail){
      H+=_pilTile('cuivre','\uD83D\uDD35','#5B8DBF','Cuivre \u00b7 bio', _pilStat('\u2014',''), null, null, '<div class="pil-empty">Synth\u00e8se cuivre indisponible.</div>');
    } else if(!cu.rows.length){
      H+=_pilTile('cuivre','\uD83D\uDD35','#5B8DBF','Cuivre \u00b7 bio (7 ans)', _pilStat('0',' apport'), null, null, '<div class="pil-empty">Aucun apport de cuivre enregistr\u00e9. Le suivi se remplit avec les traitements \u00e0 base de cuivre.</div>');
    } else {
      var crows=cu.rows.map(function(r){
        var col=_cfmCuCol(r.ratio), pct=Math.min(r.ratio*100,100);
        var st=r.ratio>1?'D\u00e9passement':r.ratio>=0.875?'Vigilance':'Conforme';
        return '<div class="pil-li"><span class="pil-av" style="background:var('+col+');color:#fff;font-size:11px">Cu</span>'
          +'<div class="pil-li-main"><div class="pil-li-t">'+_pilEsc(r.nom)+' <span style="color:var(--texte-doux);font-weight:500">\u00b7 '+_pilHa(r.surf)+' ha</span></div>'
          +'<div class="pil-gbar" style="margin-top:6px"><i style="width:'+pct.toFixed(0)+'%;background:var('+col+')"></i></div>'
          +'<div class="pil-li-s" style="color:var('+col+');font-weight:600;margin-top:3px">'+st+' \u00b7 '+(r.ratio*100).toFixed(0)+' % du plafond</div></div>'
          +'<div class="pil-li-r" style="color:var('+col+')">'+(Math.round(r.cu*10)/10).toLocaleString('fr-FR')+'<span style="font-size:10px;font-weight:500;color:var(--texte-doux)"> kg/ha</span></div></div>';
      }).join('');
      var body='<div class="pil-ip-list">'+crows+'</div>'
        +'<div class="pil-li-s" style="margin-top:10px;line-height:1.5">Cumul de <b>cuivre m\u00e9tal</b> sur 7 ans face au plafond UE de <b>28 kg/ha</b> (bio). Indicatif \u2014 ajuste selon ton organisme certificateur.</div>';
      var sw=cu.over?('\u26A0 '+cu.over):(cu.warn?('\u2191 '+cu.warn):null);
      H+=_pilTile('cuivre','\uD83D\uDD35','#5B8DBF','Cuivre \u00b7 bio (7 ans)', _pilStat(cu.rows.length,' parcelle'+(cu.rows.length>1?'s':''), sw), null, null, body);
    }
  }
  // Passages / IFT
  if(_pilShow('cfm_ift')){
    any=true;
    var ref=_cfmIftRef(), pass=_cfmPassages();
    if(!pass.length){
      H+=_pilTile('ift','\uD83C\uDF3F','#3D6B27','Passages phyto', _pilStat('0',' passage'), null, null, '<div class="pil-empty">Aucun traitement enregistr\u00e9 cette saison.</div>');
    } else {
      var maxP=pass.reduce(function(a,b){return Math.max(a,b.pass);},0)||1;
      var prows=pass.map(function(r){
        var overRef=r.pass>ref.v, col=overRef?'--orange':'--vert-med';
        return '<div class="pil-li"><span class="pil-av" style="background:#1E3418;color:#8FD07A">\uD83C\uDF3F</span>'
          +'<div class="pil-li-main"><div class="pil-li-t">'+_pilEsc(r.nom)+'</div>'
          +'<div class="pil-gbar" style="margin-top:6px"><i style="width:'+Math.min(r.pass/Math.max(ref.v,maxP)*100,100).toFixed(0)+'%;background:var('+col+')"></i></div>'
          +'<div class="pil-li-s" style="margin-top:3px">'+r.prod+' application'+(r.prod>1?'s':'')+' de produit'+(overRef?' \u00b7 <b style="color:var(--orange)">au-dessus de la r\u00e9f.</b>':'')+'</div></div>'
          +'<div class="pil-li-r" style="color:var('+col+')">'+r.pass+'<span style="font-size:10px;font-weight:500;color:var(--texte-doux)"> passages</span></div></div>';
      }).join('');
      var body2='<div class="pil-ip-list">'+prows+'</div>'
        +'<div class="pil-note" style="margin-top:12px"><span>\u2139\uFE0F</span><div><b>Passages compt\u00e9s</b> (un passage = une intervention, quel que soit le nombre de produits m\u00e9lang\u00e9s). L\u2019<b>IFT r\u00e9el</b> (dose appliqu\u00e9e / dose homologu\u00e9e) n\u00e9cessite des doses structur\u00e9es \u2014 <b>\u00e0 activer</b>. R\u00e9f. indicative : <b>'+ref.v+' passages</b>'+(ref.def?' (d\u00e9faut Bourgogne \u2014 \u00e0 ajuster dans R\u00e9glages)':'')+'.</div></div>';
      var nOver=pass.filter(function(r){return r.pass>ref.v;}).length;
      H+=_pilTile('ift','\uD83C\uDF3F','#3D6B27','Passages phyto / parcelle', _pilStat(pass.length,' parcelle'+(pass.length>1?'s':''), nOver?('\u2191 '+nOver):null), 'r\u00e9f. '+ref.v+' passages', null, body2);
    }
  }
  // DRE
  if(_pilShow('cfm_dre')){
    any=true;
    var dre=_cfmDre();
    if(dre.none){
      H+=_pilTile('dre','\u23F1\uFE0F','#B85A1A','D\u00e9lai de rentr\u00e9e (DRE)', _pilStat('\u2014',''), null, null, '<div class="pil-empty">Aucun traitement enregistr\u00e9.</div>');
    } else if(!dre.active.length){
      H+=_pilTile('dre','\u23F1\uFE0F','#5B9B3A','D\u00e9lai de rentr\u00e9e (DRE)', _pilStat('0',' actif'), 'aucune parcelle en d\u00e9lai', null, '<div class="pil-empty" style="color:var(--vert-med);font-style:normal">\u2705 Aucun d\u00e9lai de rentr\u00e9e en cours \u2014 toutes les parcelles sont accessibles.</div>');
    } else {
      var drows=dre.active.map(function(a){
        var urg=a.remainH<=2, col=urg?'--rouge':'--orange';
        return '<div class="pil-li"><span class="pil-av" style="background:var('+col+');color:#fff">\u26D4</span>'
          +'<div class="pil-li-main"><div class="pil-li-t">'+_pilEsc(a.nom)+'</div>'
          +'<div class="pil-li-s" style="color:var('+col+');font-weight:600">Rentr\u00e9e interdite encore '+a.remainH+' h \u00b7 jusqu\u2019\u00e0 '+_cfmDreEnd(a.endMs)+'</div>'
          +'<div class="pil-li-s">'+_pilEsc(a.produit||'traitement')+' \u00b7 DRE '+a.dreH+' h ('+_pilDfr(a.date)+')</div></div></div>';
      }).join('');
      var body3='<div class="pil-ip-list">'+drows+'</div>'
        +'<div class="pil-li-s" style="margin-top:10px;line-height:1.5">D\u00e9lai de r\u00e9entr\u00e9e apr\u00e8s traitement (d\u00e9riv\u00e9 des phrases de risque CLP : 6 h par d\u00e9faut, 24\u201348 h selon la mention). Ne pas p\u00e9n\u00e9trer la parcelle sans \u00e9quipement avant l\u2019heure indiqu\u00e9e.</div>';
      H+=_pilTile('dre','\u23F1\uFE0F','#B85A1A','D\u00e9lai de rentr\u00e9e (DRE)', _pilStat(dre.active.length,' parcelle'+(dre.active.length>1?'s':''),'actif'), null, null, body3);
    }
  }
  H+='</div>';
  return any ? H : '<div class="pil-empty">Aucun indicateur affich\u00e9 \u2014 active-les via \u00ab Choisir les indicateurs \u00bb.</div>';
}


// ── Personnalisation PAR ONGLET (visibilité des tuiles) ──
var _PIL_PERSO_DEFS={
  auj:[['auj_marge','Marge sur objectif'],['auj_charge','Charge restante'],['auj_cadence','Cadence équipe'],['auj_budget','Budget consommé & dérive'],['auj_etp','ETP présents / requis'],['auj_jours','Jours favorables'],['auj_pres','À la vigne aujourd\'hui'],['auj_traiter','Traiter ?'],['auj_prio','Tâche prioritaire'],['auj_alertes','Alertes matériel & cave']],
  avc:[['avc_gauge','Jauge de saison'],['avc_bar','Avancement par tâche'],['avc_pie','Charge (donut)'],['avc_echeances','Échéances par tâche'],['avc_carte','Carte du domaine'],['avc_etp','Charge & ETP']],
  equ:[['prs_equipe','Équipe'],['prs_presences','Présences du jour'],['prs_capacite','Capacité vs charge'],['mat_tracteur','Parc tracteur'],['mat_gnr','Cuve GNR'],['mat_phyto','Registre phyto'],['mat_traitement','Fenêtre de traitement']],
  sim:[['sim_ordre','Ordre de passage'],['sim_etsi','Répartition « et si ? »'],['sim_cout','Renfort : combien et quand']],
  cfm:[['cfm_cuivre','Cuivre (bio · 7 ans)'],['cfm_ift','Passages phyto / IFT'],['cfm_dre','Délai de rentrée (DRE)']]
};
function _pilPersoHtml(tab){
  var defs=_PIL_PERSO_DEFS[tab]; if(!defs) return '';
  return '<h3>Afficher dans cet onglet — réglage propre à chaque onglet, mémorisé pour vous</h3><div class="pil-opts">'
    +defs.map(function(o){ return '<label><input type="checkbox" class="pil-sw" data-show="'+o[0]+'"'+(_pilShow(o[0])?' checked':'')+'> '+_pilEsc(o[1])+'</label>'; }).join('')
    +'</div><div class="pil-perso-note">Décoche pour retirer une tuile. \uD83D\uDD12 Lecture seule — n\'affecte que ton affichage.</div>';
}
function _pilPersoChange(e){
  var id=e.target.getAttribute&&e.target.getAttribute('data-show'); if(!id) return;
  if(!_PIL_STATE.show) _PIL_STATE.show={};
  _PIL_STATE.show[id]=e.target.checked?1:0;
  _pilSaveState(_PIL_STATE);
  _pilFillContent(_pilData());
}

// ── Header + barre d'onglets + squelette ──
// ════════════════════════════════════════════════════════════════════════════════
// ARCHIVES DES CAMPAGNES
// Toutes les campagnes sur le MEME axe, 1er aout -> 31 juillet : de recolte a recolte, l'hiver
// n'est pas coupe en deux par le 31 decembre. Empilees, elles repondent d'un coup d'oeil a la
// seule question qui compte l'annee suivante : est-ce qu'on s'y est pris plus tot ?
// L'echelle et la couleur viennent de reglages.js (charge AVANT pilotage) : une seule
// implementation, sinon les deux frises divergeraient au premier correctif.
// ════════════════════════════════════════════════════════════════════════════════
function _arcN(s){ var p=String(s).split('-'); return Date.UTC(+p[0],+p[1]-1,+p[2])/864e5; }
function _arcISO(n){ return new Date(n*864e5).toISOString().slice(0,10); }
// Une periode appartient a la campagne ouverte le 1er aout qui precede son DEBUT.
// L'axe campagne vit desormais dans utils.js (window._mvCampagneDe) : cave.js s'en
// sert aussi pour « Le millesime ». Repli local conserve si utils.js est anterieur.
function _arcCampagneDe(iso){
  if(typeof window._mvCampagneDe==='function') return window._mvCampagneDe(iso);
  var p=String(iso).split('-'); return (+p[1]>=8)?(+p[0]):(+p[0]-1);
}
// Heures d'une periode = celles figees dans l'instantane pris a la cloture. Une periode jamais
// cloturee n'en a pas : elle se voit sur la frise, elle ne compte pas d'heures.
function _arcHeures(nom){
  var h=(window.HISTORIQUE||[]).find(function(x){ return x&&x.saisonNom===nom; });
  return (h&&h.stats&&h.stats.hFaites)||0;
}
function _arcLigne(an,list,cur){
  var a=_arcN(an+'-08-01'), b=_arcN((an+1)+'-07-31');
  var pc=function(d){ return Math.max(0,Math.min(100,(_arcN(d)-a)/(b-a)*100)); };
  var col=window._cmpCouleur||function(){ return '#8A5A38'; };
  var segs=list.slice().sort(function(x,y){ return String(x.debut).localeCompare(String(y.debut)); })
    .map(function(s){
      var x=pc(s.debut), w=pc(s.fin)-x; if(w<=0) w=1;
      return '<div class="arc-seg" style="left:'+x+'%;width:'+w+'%;background:'+col(s)+'">'
        +'<b>'+_pilEsc(s.nom)+'</b></div>';
    }).join('');
  var today=new Date().toISOString().slice(0,10);
  if(today>=_arcISO(a)&&today<=_arcISO(b)) segs+='<div class="arc-today" style="left:'+pc(today)+'%"></div>';
  var h=list.reduce(function(n,s){ return n+_arcHeures(s.nom); },0);
  var meta=list.length+' période'+(list.length>1?'s':'');
  meta+=h>0 ? (' · '+_pilHa(h)+' h') : ' · pas d’instantané';
  return '<div class="arc-row"><div class="arc-lab"><span class="y">Campagne '+an+'–'+(an+1)
    +(cur?' <em>en cours</em>':'')+'</span><span class="m">'+meta+'</span></div>'
    +'<div class="arc-fr'+(cur?' cur':' old')+'">'+segs+'</div></div>';
}
function _pilTabArc(d){
  var S=(window.SAISONS||[]).filter(function(s){ return s&&s.debut&&s.fin&&s.fin>=s.debut; });
  if(!S.length) return '<div class="arc-empty">Aucune période datée. Les campagnes apparaissent ici '
    +'dès qu’une période porte un début et une fin (Réglages › Campagne).</div>';
  var par={};
  S.forEach(function(s){ var k=_arcCampagneDe(s.debut); (par[k]=par[k]||[]).push(s); });
  var keys=Object.keys(par).map(Number).sort(function(x,y){ return y-x; });
  var anCur=_arcCampagneDe(new Date().toISOString().slice(0,10));
  var hTot=S.reduce(function(n,s){ return n+_arcHeures(s.nom); },0);
  var h='<div class="arc-intro">Toutes les campagnes sur le même axe, <b>1ᵉʳ août → 31 juillet</b> : '
    +'de récolte à récolte, l’hiver n’est pas coupé en deux. D’une ligne à l’autre, on lit le '
    +'décalage des travaux.</div>';
  h+=(window._cmpEchelle?window._cmpEchelle(_arcN(anCur+'-08-01'),_arcN((anCur+1)+'-07-31')):'');
  h+=keys.map(function(k){ return _arcLigne(k,par[k],k===anCur); }).join('');
  h+='<div class="arc-kpi">'
    +'<div><div class="v">'+keys.length+'</div><div class="l">campagne'+(keys.length>1?'s':'')+'</div></div>'
    +'<div><div class="v">'+S.length+'</div><div class="l">périodes</div></div>'
    +'<div><div class="v">'+(hTot>0?_pilHa(hTot):'—')+'</div><div class="l">heures archivées</div></div>'
    +'</div>';
  h+='<button class="arc-cmp" onclick="window._arcOpenCmp&&window._arcOpenCmp()">'
    +'\uD83D\uDCCA Comparer deux saisons</button>';
  // Le bilan de campagne vit dans cave.js (importe AVANT pilotage.js) : on ne
  // duplique pas le moteur, on ouvre la porte depuis l'ecran de fin d'annee.
  h+='<button class="arc-cmp" onclick="window._bcExportChoix&&window._bcExportChoix()">'
    +'\uD83D\uDCD6 \u00c9diter le bilan de campagne</button>';
  h+='<div class="arc-note">Les heures viennent des instantanés pris à la clôture de chaque '
    +'campagne : parcelles, journal, sessions et avancement y sont figés.</div>';
  return h;
}
// Appele depuis Reglages > Campagne : bascule sur Pilotage et ouvre directement l'onglet.
// Expression assignee a window et non fonction declaree : son seul appelant vit dans un onclick
// d'un AUTRE fichier, et le cliquet C15 (fonction sans appelant) raisonne fichier par fichier.
window._pilOpenArchives = function(){
  _PIL_TAB='arc'; _pilSaveTab('arc');
  if(window.goTo) window.goTo('pilotage'); else renderPilotage();
};
// Appele depuis Reglages > Domaine (carte Economie & conformite) : bascule sur Pilotage
// et ouvre directement l'outil Parametrage, qui porte desormais les parametres de simulation.
// Expression assignee a window et non fonction declaree : son seul appelant vit dans un onclick
// d'un AUTRE fichier, et le cliquet C15 (fonction sans appelant) raisonne fichier par fichier.
window._pilOpenParam = function(){
  _PIL_TAB='param'; _pilSaveTab('param');
  if(window.goTo) window.goTo('pilotage'); else renderPilotage();
};
// Le comparateur multi-saisons vivait derriere un bouton de Reglages : sa place est ici.
window._arcOpenCmp = function(){
  if(window.openOv) window.openOv('ovHistorique');
  if(window.renderHistorique) window.renderHistorique();
};

function _pilTabsHtml(tab){
  var cur=_PIL_TOOLS.find(function(t){return t[0]===tab;});
  var h='<div class="mvu-tabs mvu-pil" id="pil-tabs">'+_PIL_TABS.map(function(t){
    return '<button class="mvu-tab'+(t[0]===tab?' active':'')+'" data-tab="'+t[0]+'"><span class="mvu-tab-em">'+t[1]+'</span>'+t[2]+'</button>';
  }).join('');
  // Outil actif : epingle en fin de barre pour que l'utilisateur voie ou il se trouve.
  if(cur) h+='<button class="mvu-tab active" data-tab="'+cur[0]+'"><span class="mvu-tab-em">'+cur[1]+'</span>'+cur[2]+'</button>';
  h+='<button class="mvu-tab pil-outils-btn" id="pil-outils-btn" aria-label="Outils du pilotage" title="Outils"><span class="mvu-tab-em">\u2699\uFE0F</span>Outils</button></div>';
  h+='<div class="pil-outils-menu" id="pil-outils-menu">'+_PIL_TOOLS.map(function(t){
    return '<button data-tool="'+t[0]+'"><span class="pom-ic">'+t[1]+'</span><span class="pom-t">'+t[2]+'</span><span class="pom-c">\u203A</span></button>';
  }).join('')+'</div>';
  return h;
}
function _pilHdrHtml(d){
  return '<header class="pil-mast"><div class="pil-mast-orb"></div><div class="pil-mast-in">'
    +'<button class="pil-icon" id="pil-back" title="Accueil">\u2302</button>'
    +'<div class="pil-mast-id"><div class="pil-eyebrow"><span class="pil-syncdot"></span>Pilotage \u00b7 temps r\u00e9el</div>'
    +'<div class="pil-dom" id="pil-dom-nom">'+_pilEsc(d.domaine)+'</div></div>'
    +'<div class="pil-mast-right">'
    +'<div class="pil-cell pil-saison"><div class="s1">P\u00e9riode</div><div class="s2" id="pil-saison">'+_pilEsc(d.saison)+'</div></div>'
    +'<div class="pil-msep"></div>'
    +'<div class="pil-cell"><div class="s1">Vignoble</div><div class="s2 alt">'+d.nActives+' parcelles \u00b7 '+_pilHa(d.surfTot)+' ha</div></div>'
    +'<div class="pil-msep"></div>'
    +'<div class="pil-meteo" id="pil-meteo" style="'+(d.meteo?'':'display:none')+'"></div>'
    +'</div></div>'
    // Hote de la pastille « ? Aide » : _mvInjectHelpBtn() cible strictement
    // « .mod-header .mod-meta-row ». Pilotage est le SEUL module dont la page
    // est un conteneur vide rempli en JS -> il n'en avait aucune, et sa fiche
    // MV_AIDE.pilotage etait donc ecrite mais inatteignable. On pose un hote
    // DEDIE plutot que la classe .mod-header sur .pil-mast : le bloc UI-4
    // (styles.css) impose background/border/padding/box-shadow en !important
    // sur .mod-header et masque ses pseudo-elements — le masthead serait
    // repeint en clair sous son texte creme et perdrait son filet horizon.
    +'<div class="mod-header pil-metahost"><div class="mod-meta-row"></div></div>'
    +'</header>';
}
function _pilSkeleton(d,tab){
  // L'onglet Économie n'a pas de roue crantée : ses trois sous-vues remplacent la
  // liste de cases à cocher, et l'on ne masque pas un poste de dépense à la carte.
  var perso=(tab==='auj'||tab==='avc'||tab==='equ'||tab==='sim'||tab==='cfm')?'<button class="pil-gear2" id="pil-gear"><span>\u2699</span> Choisir les indicateurs</button>':'';
  _pilCssV2(); _pilScopeLoad();
  // La barre de portee se pose ENTRE le masthead et les onglets : elle dit ou
  // l'on regarde avant de dire ce que l'on regarde. Les photos ouvrent le
  // contenu, quel que soit l'onglet — on voit l'ensemble avant le detail.
  return _pilHdrHtml(d)
    +'<div class="pil-portee"><div class="pil-portee-in">'
    +'<div class="pil-crumb" id="pil-crumb">'+_pilCrumbHtml()+'</div>'
    +'</div></div>'
    +'<div class="pil-tabsbar">'+_pilTabsHtml(tab)+'</div>'
    +'<div class="pil-wrap">'
    +'<div id="pil-photos-host">'+_pilPhotosHtml()+'</div>'
    +'<div class="pil-tabhead"><h2 class="pil-h2">'+_pilEsc(_pilTabLabel(tab))+'</h2>'+perso+'</div>'
    +'<div class="pil-perso" id="pil-perso"></div>'
    +'<div class="pil-content" id="pil-content"></div>'
    +'</div>';
}


// ════════════════════════════════════════════════════════════════════════════
// LA BARRE DE PORTEE ET LES QUATRE PHOTOS
// Le module s'ouvrait sur sept onglets a plat — sept SUJETS, aucun niveau de
// zoom. On ne voyait donc jamais l'annee : on tombait dans un sujet.
// Ici : une ligne qui dit OU l'on regarde (le fil d'Ariane), et quatre photos
// qui repondent aux quatre questions d'un domaine — travaux, effectif, budget,
// conformite — a la maille de la portee. Cliquer une photo descend au detail.
// ⚠️ Les quatre photos lisent _PIL_SCOPE. Aucune ne garde d'etat a elle.
// ════════════════════════════════════════════════════════════════════════════
function _pilCssV2(){
  if(document.getElementById('pil-css-v2')) return;
  var css=''
  +'.pil-portee{position:sticky;top:0;z-index:34;background:var(--bg-card);border-bottom:1px solid var(--gris);}'
  +'.pil-portee-in{max-width:1180px;margin:0 auto;padding:9px 16px;display:flex;align-items:center;gap:9px;flex-wrap:wrap}'
  +'.pil-crumb{display:flex;align-items:center;gap:5px;flex-wrap:wrap;flex:1;min-width:0}'
  +'.pil-cr{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--gris);background:var(--bg-app);border-radius:9px;padding:5px 10px;font-size:12.5px;font-weight:600;color:var(--texte);white-space:nowrap;min-height:34px;font-family:inherit;cursor:pointer}'
  +'.pil-cr.root{background:var(--cave);border-color:var(--cave);color:var(--or-clair)}'
  +'.pil-cr.sel{background:var(--terre-pale);border-color:var(--terre);color:var(--terre)}'
  +'.pil-cr .x{border:0;background:none;color:inherit;opacity:.55;font-size:16px;line-height:1;padding:0 0 0 3px;font-family:inherit;cursor:pointer;min-width:20px}'
  +'.pil-cr .x:hover{opacity:1}'
  +'.pil-cr-sep{color:var(--gris);font-size:13px}'
  +'.pil-cr-note{font-size:11.5px;color:var(--texte-doux);white-space:nowrap}'
  +'.pil-photos{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin:0 0 18px}'
  +'.pil-photo{background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:14px;padding:13px 14px 12px;box-shadow:var(--shadow-sm);text-align:left;width:100%;font-family:inherit;cursor:pointer;transition:border-color .12s;min-height:112px;display:block}'
  +'.pil-photo:hover{border-color:var(--or)}'
  +'.pil-photo .k{display:flex;align-items:center;gap:6px;font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--texte-doux);font-weight:700}'
  +'.pil-photo .v{display:block;font-family:\'Cormorant Garamond\',serif;font-size:32px;font-weight:700;line-height:1.05;margin:5px 0 0;color:var(--cave);font-variant-numeric:tabular-nums}'
  +'.pil-photo .u{display:inline;font-family:Outfit,sans-serif;font-size:13.5px;font-weight:600;color:var(--texte-doux)}'
  +'.pil-photo .s{display:block;font-size:11.5px;color:var(--texte-doux);margin-top:2px;line-height:1.35}'
  +'.pil-photo .go{display:block;font-size:10.5px;color:var(--terre);font-weight:700;margin-top:7px}'
  +'.pil-flag{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;font-size:10px;font-weight:800;color:#fff;flex-shrink:0}'
  +'@media(max-width:880px){.pil-photos{grid-template-columns:1fr 1fr}}'
  +'@media(max-width:430px){.pil-photo .v{font-size:27px}.pil-portee-in{padding:8px 11px}}';
  var el=document.createElement('style'); el.id='pil-css-v2'; el.textContent=css;
  document.head.appendChild(el);
}

// ── Le fil d'Ariane ─────────────────────────────────────────────────────────
// Une portee active se lit sur la MEME ligne que le reste, jamais repliee dans
// un panneau : un filtre qu'on oublie qu'il tourne est pire que pas de filtre.
function _pilCrumbHtml(){
  // _mvExercice() rend {an,debut,fin} — il n'existe pas de fonction de libelle,
  // on le compose ici plutot que d'appeler un helper imaginaire.
  var ex='Exercice', X=null;
  try{ X=(typeof window._mvExercice==='function')?window._mvExercice():null; }catch(e){ X=null; }
  if(X && X.debut && X.fin){
    var a0=String(X.debut).slice(0,4), a1=String(X.fin).slice(0,4);
    ex='Exercice '+(a0===a1?a0:(a0+'-'+a1.slice(2)));
  }
  var h='<button class="pil-cr root" id="pil-cr-root" title="Revenir \u00e0 l\u2019ann\u00e9e enti\u00e8re">\u2302 '+_pilEsc(ex)+'</button>';
  if(_PIL_SCOPE.camp){
    h+='<span class="pil-cr-sep">\u203A</span><span class="pil-cr sel">\uD83C\uDF47 '+_pilEsc(_PIL_SCOPE.camp)
      +'<button class="x" id="pil-cr-x" title="Revenir \u00e0 l\u2019ann\u00e9e">\u00d7</button></span>';
  } else {
    h+='<span class="pil-cr-note">l\u2019ann\u00e9e enti\u00e8re \u2014 cliquez une campagne dans la frise pour zoomer</span>';
  }
  return h;
}

// ── Les quatre photos ───────────────────────────────────────────────────────
// Chacune repond a UNE question et emmene a l'ecran qui la detaille. Un chiffre
// dont les entrees sont incompletes porte un drapeau : il ne se tait pas et il
// ne ment pas non plus, il dit qu'il est partiel.
function _pilPhotosData(){
  var ann=null; try{ ann=_pilAnnuelData(); }catch(e){ ann=null; }
  if(ann) _pilScopeVerif(ann);
  var camp=_PIL_SCOPE.camp, selP=ann?_pilAnnPer(camp):null;
  var wk=(ann&&ann.weeks)?ann.weeks.filter(function(x){ return selP?(x.per===selP.idx):true; }):[];

  // TRAVAUX — heures de bareme de la portee.
  var hTot=0, hFait=0;
  try{
    if(selP&&selP.cd){ hTot=Math.round(selP.cd.totalTotal||0); hFait=Math.max(0,hTot-Math.round(selP.cd.totalReste||0)); }
    else if(ann){ ann.pers.forEach(function(p){ if(p.cd){ hTot+=Math.round(p.cd.totalTotal||0); hFait+=Math.max(0,Math.round(p.cd.totalTotal||0)-Math.round(p.cd.totalReste||0)); } }); }
  }
  catch(e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'photos: charge illisible'}); }
  var pct=hTot>0?Math.round(hFait/hTot*100):0;

  // EFFECTIF — le PIC, jamais la moyenne : une moyenne annuelle n'existe aucun
  // jour de l'annee, et c'est le pic qui decide d'un recrutement.
  var pic=0, picW=null, som=0, n=0;
  wk.forEach(function(x){ if(!(x.cap>0)) return; som+=x.need; n++; if(x.need>pic){ pic=x.need; picW=x; } });
  var moy=n>0?(som/n):0;
  var head=picW?(picW.head||0):0, manque=Math.max(0,pic-head);

  // BUDGET — la source est celle de l'ecran Economie, pas un second calcul.
  var eur=0, sansTaux=0, ecoOk=false;
  // ⚠️ _pecData() rend le total sous la cle `tot`, pas `T` — verifie dans le
  //    fichier, pas deduit du nom de la variable interne.
  try{ var _P=_pecData(); if(_P&&_P.tot){ eur=(_P.tot.moB||0)+(_P.tot.tracF||0)+(_P.tot.phyF||0); sansTaux=_P.tot.nSansTaux||0; ecoOk=true; } }catch(e){ ecoOk=false; }

  // CONFORMITE — le cuivre roule sur sept ans : c'est un chiffre d'ANNEE.
  var cu=null; try{ cu=_cfmCuivre(); }catch(e){ cu=null; }

  return { ann:ann, selP:selP, hTot:hTot, hFait:hFait, pct:pct, pic:pic, picW:picW,
           moy:moy, head:head, manque:manque, eur:eur, sansTaux:sansTaux, ecoOk:ecoOk, cu:cu, trous:(ann&&ann.trous)?ann.trous.length:0, ovl:(ann&&ann.ovl)?ann.ovl.length:0 };
}


// ── Le rendu des quatre photos ──────────────────────────────────────────────
function _pilPhotoHtml(k,ico,val,unite,sous,cible,drapeau){
  // \u26A0\uFE0F Des <span display:block>, pas des <div> : le contenu d'un <button>
  //    est du « phrasing content » en HTML5. Le clic marcherait quand meme,
  //    mais §24 l'interdit \u2014 et un balisage invalide se paie plus tard, pas
  //    tout de suite.
  return '<button class="pil-photo" data-pgo="'+cible+'">'
    +'<span class="k">'+ico+' '+k+(drapeau||'')+'</span>'
    +'<span class="v">'+val+'<span class="u">'+unite+'</span></span>'
    +'<span class="s">'+sous+'</span>'
    +'<span class="go">voir le d\u00e9tail \u203A</span></button>';
}
function _pilFlag(g,titre){
  var c=(g==='r')?'var(--rouge)':(g==='o'?'var(--orange)':'#4A9FC8');
  return '<span class="pil-flag" style="background:'+c+'" title="'+_pilEsc(titre)+'">!</span>';
}
function _pilPhotosHtml(){
  var D;
  try{ D=_pilPhotosData(); }catch(e){ return ''; }
  var camp=_PIL_SCOPE.camp, cadre=camp?('sur '+_pilEsc(camp)):'sur l\u2019exercice';

  // TRAVAUX
  var fT='';
  if(D.trous>0) fT=_pilFlag('r',D.trous+' trou(s) dans le calendrier \u2014 ce travail n\u2019est compt\u00e9 nulle part');
  else if(D.ovl>0) fT=_pilFlag('o','Des p\u00e9riodes se chevauchent \u2014 des heures comptent deux fois');
  var pTrav=_pilPhotoHtml('Travaux','\uD83C\uDF3F',_pilNb(D.hTot),' h',
    D.hTot>0?(D.pct+' % fait '+cadre):('aucune t\u00e2che dat\u00e9e '+cadre),'avc',fT);

  // EFFECTIF — le pic, et le manque en clair s'il y en a un.
  var sE = D.pic>0
    ? ('au pic'+(D.picW?(' \u00b7 '+_pilNb(D.head)+' pr\u00e9sents cette semaine-l\u00e0'):''))
    : 'aucune semaine mesur\u00e9e '+cadre;
  var fE = (D.manque>0.05) ? _pilFlag('o','Il manque '+_pilUn(D.manque)+' personne(s) au pic') : '';
  var pEff=_pilPhotoHtml('Effectif','\uD83D\uDC65',D.pic>0?_pilUn(D.pic):'\u2014',D.pic>0?' pers.':'', sE,'equ',fE);

  // BUDGET
  var fB=D.sansTaux>0?_pilFlag('o',D.sansTaux+' fiche(s) sans taux horaire \u2014 le co\u00fbt est sous-\u00e9valu\u00e9'):'';
  var pBud = D.ecoOk
    ? _pilPhotoHtml('Budget','\uD83D\uDCB6',_pilNb(Math.round(D.eur/1000)),' k\u20ac','main-d\u2019\u0153uvre, carburant et phyto','eco',fB)
    : _pilPhotoHtml('Budget','\uD83D\uDCB6','\u2014','','le calcul du co\u00fbt n\u2019a pas abouti','eco',_pilFlag('r','Ouvrez \u00c9conomie pour voir ce qui bloque'));

  // CONFORMITE — le cuivre roule sur 7 ans : c'est un chiffre d'ANNEE, il ne
  // se recadre pas sur une campagne, et l'ecran le dit au lieu de faire semblant.
  var pCfm;
  if(D.cu && D.cu.avail && D.cu.rows.length){
    var mx=D.cu.rows[0];
    var fC=D.cu.over>0?_pilFlag('r',D.cu.over+' parcelle(s) au-dessus du plafond')
          :(D.cu.warn>0?_pilFlag('o',D.cu.warn+' parcelle(s) proche(s) du plafond'):'');
    pCfm=_pilPhotoHtml('Conformit\u00e9','\uD83D\uDEE1\uFE0F',_pilUn(mx.cu),' kg Cu',
      'la plus charg\u00e9e \u00b7 plafond '+D.cu.plaf+' kg/ha sur 7 ans','cfm',fC);
  } else {
    pCfm=_pilPhotoHtml('Conformit\u00e9','\uD83D\uDEE1\uFE0F','0',' kg Cu','aucun apport de cuivre enregistr\u00e9','cfm','');
  }
  return '<div class="pil-photos">'+pTrav+pEff+pBud+pCfm+'</div>';
}
function _pilNb(v){ v=Math.round(Number(v)||0); return String(v).replace(/\B(?=(\d{3})+(?!\d))/g,'\u00a0'); }
function _pilUn(v){ return (Math.round((Number(v)||0)*10)/10).toString().replace('.',','); }

// Repeint la barre de portee sans reconstruire la page. Appelee au clic sur une
// campagne : la portee change, le fil et les photos suivent — c'est tout l'objet.
function _pilPortee(){
  var c=document.getElementById('pil-crumb'); if(c) c.innerHTML=_pilCrumbHtml();
  var p=document.getElementById('pil-photos-host'); if(p) p.innerHTML=_pilPhotosHtml();
}
window._pilPortee = _pilPortee;

// ── Paramétrage : carte « objectif » + fenêtres de tâches ──
function _pilObjCard(cd,admin){
  var objIso=_pilObjectifGet();
  var cardCss='background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:16px;padding:16px 18px;margin-bottom:16px';
  var ttlCss='font-family:\'Cormorant Garamond\',serif;font-weight:700;font-size:20px;color:var(--cave)';
  var inCss='border:1px solid var(--gris);border-radius:7px;padding:5px 8px;font-family:Outfit;font-size:13.5px;font-weight:700;background:#fff;color:var(--texte)';
  var nom=cd?cd.saison:_pilSaisonNom();
  return '<div style="'+cardCss+'">'
    +'<div style="'+ttlCss+';margin-bottom:4px">\uD83C\uDFAF Objectif de fin des travaux</div>'
    +'<div style="font-size:12.5px;color:var(--texte-doux);margin-bottom:12px">Date à laquelle tu veux que toutes les tâches de la saison soient terminées. La marge du tableau de bord compare la projection (cadence réelle) à cette date — indépendante de la fin de saison.</div>'
    +'<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span style="font-size:13px;font-weight:700">Saison '+_pilEsc(nom||'—')+' — terminer pour le</span>'
    +'<input type="date" id="pil-obj-param" value="'+(objIso||'')+'"'+(admin?'':' disabled')+' style="'+inCss+'">'
    +(admin?'':'<span style="font-size:11px;color:var(--texte-doux)">\uD83D\uDD12 admin</span>')+'</div></div>';
}
// ── Parametres du simulateur economique ─────────────────────────────
// Rapatries de Reglages > Domaine > Economie : ces 5 valeurs pilotent DEUX onglets
// (le surcout de retard par parcelle dans << Eco & conformite >>, et la courbe
// << Cout selon l'effectif >> dans << Simulation >>). Leur place est donc ici, dans le
// parametrage du module, et non dans un onglet de lecture.
// L'ECRITURE EST DELEGUEE a window._ecoCfgSet (reglages.js, charge AVANT pilotage.js) :
// liste blanche des cles + saveData('config'). Aucune copie privee de la logique.
function _pilSimEcoCard(admin){
  var e=(window.CONFIG&&window.CONFIG.eco)||{};
  var cardCss='background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:16px;padding:16px 18px;margin-bottom:16px';
  var ttlCss='font-family:\'Cormorant Garamond\',serif;font-weight:700;font-size:20px;color:var(--cave)';
  var inCss='width:78px;padding:7px 8px;border:1.5px solid var(--gris-clair);border-radius:9px;font-family:inherit;font-size:14px;text-align:right;background:var(--bg-app);color:var(--texte);box-sizing:border-box';
  var dis=admin?'':' disabled';
  // Vide = valeur par defaut : on n'ecrit jamais le defaut en base, il reste dans le lecteur
  // (_ceCfg / _ecoRetardCfg). Le placeholder montre donc la valeur reellement appliquee.
  function row(ico,titre,sous,key,def,unite,step,min,noTop){
    var v=(e[key]!=null&&Number(e[key])>0)?e[key]:'';
    var sep=noTop?'':';margin-top:12px;padding-top:12px;border-top:1px solid var(--gris-clair)';
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap'+sep+'">'
      +'<div style="flex:1;min-width:190px"><div style="font-size:13.5px;color:var(--texte);font-weight:600">'+ico+' '+titre+'</div>'
      +'<div style="font-size:11.5px;color:var(--texte-doux)">'+sous+'</div></div>'
      +'<span style="display:inline-flex;align-items:center;gap:5px">'
      +'<input type="number" min="'+min+'" step="'+step+'" value="'+v+'" placeholder="'+def+'"'+dis
      +' onchange="window._ecoCfgSet&&window._ecoCfgSet(\'eco\',\''+key+'\',this.value)" style="'+inCss+'">'
      +'<span style="font-size:12px;color:var(--texte-doux)">'+unite+'</span></span></div>';
  }
  var note = admin
    ? 'Ces valeurs chiffrent le <b style="color:var(--texte)">surco\u00fbt de retard</b> par parcelle (onglet \u00c9co &amp; conformit\u00e9) et la courbe <b style="color:var(--texte)">\u00ab Renfort : combien, et quand \u00bb</b> (onglet D\u00e9cider). Elles ne touchent \u00e0 aucune paie : le retard est <b style="color:var(--texte)">mod\u00e9lis\u00e9, jamais pay\u00e9</b>. Vide = valeur par d\u00e9faut.'
    : '\uD83D\uDD12 Lecture seule \u2014 seul un administrateur peut modifier ces valeurs. Elles chiffrent le surco\u00fbt de retard par parcelle et le simulateur de renfort. Elles ne touchent \u00e0 aucune paie.';
  return '<div style="'+cardCss+'">'
    +'<div style="'+ttlCss+';margin-bottom:4px">\uD83C\uDF9B\uFE0F Simulation \u00e9conomique</div>'
    +'<div style="font-size:12.5px;color:var(--texte-doux);margin-bottom:10px;line-height:1.55">'+note+'</div>'
    +'<div style="height:3px;border-radius:3px;background:linear-gradient(90deg,#8A5A38,#C2871E,#3D6B27);margin:0 0 14px"></div>'
    +row('\u23F3','Le retard rallonge le travail','une t\u00e2che faite hors de sa fen\u00eatre prend ce temps en plus, par semaine de retard','k_retard','15','% / sem.','1','0',1)
    +row('\uD83D\uDE9C','ETP au tracteur','laisser vide : mesur\u00e9 sur les sessions de la p\u00e9riode. Une valeur force l\u2019hypoth\u00e8se','trac_etp','mesur\u00e9','ETP','0.1','0')
    +row('\u23F1','P\u00e9nalit\u00e9 de retard','surco\u00fbt par parcelle dans \u00c9co &amp; conformit\u00e9 (distinct du r\u00e9glage ci-dessus)','pen_retard_sem','5','% / sem.','1','0')
    +row('\u26D4','Plafond de la p\u00e9nalit\u00e9','au-del\u00e0, la vigne est ce qu\u2019elle est','pen_plafond','50','%','5','0')
    +row('\u23F0','Majoration des heures sup','au-del\u00e0 de la journ\u00e9e de r\u00e9f\u00e9rence','maj_hsup','25','%','5','0')
    +row('\uD83D\uDC65','Cadence d\u2019un renfort','face \u00e0 un permanent, sa premi\u00e8re saison','rdt_renfort','85','%','5','1')
    +row('\uD83D\uDCB6','Frais fixes par renfort','recrutement, \u00e9quipement, encadrement, trajets','cout_fixe_renfort','180','\u20AC','10','0')
    +_pecHypoRows(admin)
    +'</div>';
}
// Les DEUX hypotheses du pilotage economique. Ce ne sont pas des mesures : le kg par
// col est une conversion d'usage, la journee de reference une convention. Toutes deux
// changent des chiffres affiches en gros — elles doivent donc etre visibles et reglables,
// pas cachees dans une constante.
//
// L'ECRITURE PASSE PAR window._ecoCfgSet, comme tout le reste de cette carte : aucune
// copie privee du chemin d'ecriture. Mais _ecoCfgSet applique une LISTE BLANCHE de
// cles ; une cle absente donne un no-op SILENCIEUX — exactement le motif qui avait fait
// dormir le journal des erreurs pendant des mois. On relit donc la valeur apres l'appel,
// et si rien n'a bouge on le DIT, plutot que de laisser croire que c'est enregistre.
var _PEC_HYPO = {
  kg_bouteille:{ ico:'\uD83C\uDF77', tit:'Raisin par bouteille',
                 sub:'base du <b>co\u00fbt \u00e0 la bouteille</b> \u2014 hypoth\u00e8se de conversion, jamais une mesure',
                 def:'1.3', unite:'kg / col', step:'0.1', min:'0.1' },
  h_jour:      { ico:'\u23F1\uFE0F', tit:'Journ\u00e9e de r\u00e9f\u00e9rence',
                 sub:'convertit les journ\u00e9es de pr\u00e9sence du journal en heures, base de l\u2019<b>\u00e9cart de cadence</b>',
                 def:'7', unite:'h / jour', step:'0.5', min:'1' }
};
function _pecHypoVal(key){ return (key==='h_jour') ? _pecHJour() : _pecKgB(); }
function _pecHypoSet(key,v){
  if(!_PEC_HYPO[key]) return;
  if(!(typeof window.isAdmin==='function' && window.isAdmin())) return;
  var before=((window.CONFIG&&window.CONFIG.eco)||{})[key];
  if(typeof window._ecoCfgSet==='function') window._ecoCfgSet('eco',key,v);
  var after=((window.CONFIG&&window.CONFIG.eco)||{})[key];
  if(String(after)===String(before)){
    if(window.showToast) window.showToast('R\u00e9glage non enregistr\u00e9 \u2014 mise \u00e0 jour de R\u00e9glages requise','#B85A1A');
    return;
  }
  if(window.showToast) window.showToast('Hypoth\u00e8se mise \u00e0 jour','#3D6B27');
}
window._pecHypoSet=_pecHypoSet;
function _pecHypoRows(admin){
  var inCss='width:78px;padding:7px 8px;border:1.5px solid var(--gris-clair);border-radius:9px;font-family:inherit;font-size:14px;text-align:right;background:var(--bg-app);color:var(--texte);box-sizing:border-box';
  return Object.keys(_PEC_HYPO).map(function(k){
    var o=_PEC_HYPO[k];
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid var(--gris-clair)">'
      +'<div style="flex:1;min-width:190px"><div style="font-size:13.5px;color:var(--texte);font-weight:600">'+o.ico+' '+o.tit+'</div>'
      +'<div style="font-size:11.5px;color:var(--texte-doux)">'+o.sub+'</div></div>'
      +'<span style="display:inline-flex;align-items:center;gap:5px">'
      +'<input type="number" min="'+o.min+'" step="'+o.step+'" value="'+_pecHypoVal(k)+'" placeholder="'+o.def+'"'+(admin?'':' disabled')
      +' onchange="window._pecHypoSet&&window._pecHypoSet(\''+k+'\',this.value)" style="'+inCss+'">'
      +'<span style="font-size:12px;color:var(--texte-doux)">'+o.unite+'</span></span></div>';
  }).join('');
}
function _pilParamBody(d){
  var cd=(window._chargeSaisonData&&window.getSaisonActive)?window._chargeSaisonData(window._pilSaison()):null;
  var admin=(typeof window.isAdmin==='function')&&window.isAdmin();
  var cardCss='background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:16px;padding:16px 18px;margin-bottom:16px';
  var ttlCss='font-family:\'Cormorant Garamond\',serif;font-weight:700;font-size:20px;color:var(--cave)';
  var thCss='text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--texte-doux);padding:6px 8px;border-bottom:1px solid var(--gris-clair)';
  var tdCss='padding:7px 8px;border-bottom:1px solid #F0ECE1';
  if(!cd||!cd.taskWindows||!cd.taskWindows.length){
    return '<div id="pil-param-host">'+_pilObjCard(cd,admin)
      +'<div style="'+cardCss+'"><div style="'+ttlCss+';margin-bottom:8px">Paramétrage · fenêtres des tâches</div>'
      +'<div class="pil-empty">Renseigne les dates de la saison active (Réglages \u203A Saisons) pour paramétrer les fenêtres de tâches.</div></div>'
      +_pilSimEcoCard(admin)+'</div>';
  }
  function _o(y){ return Math.round((Date.parse(y+'T00:00:00')-Date.parse('2026-01-01T00:00:00'))/86400000); }
  function durOf(a,b){ return _o(b)-_o(a)+1; }
  var note = admin
    ? 'Définis la fenêtre de chaque tâche (début, fin, durée). Elles pilotent la frise et la charge par mois. « auto » = calé sur l\'enchaînement par défaut.'
    : '\uD83D\uDD12 Lecture seule — seul un administrateur peut modifier ces fenêtres.';
  var rows=cd.taskWindows.map(function(t){
    var dis=admin?'':' disabled';
    var key=_friseNorm(t.nom);
    var tag=t.custom?'<span style="font-size:10px;color:var(--orange);font-weight:700">\u2022 perso</span>':'<span style="font-size:10px;color:var(--texte-doux)">auto</span>';
    var inCss='border:1px solid var(--gris);border-radius:7px;padding:3px 5px;font-family:Outfit;font-size:12.5px;background:#fff';
    var nCss='width:58px;text-align:center;border:1px solid var(--gris);border-radius:7px;padding:3px 0;font-family:Outfit;font-size:13px;background:#fff';
    return '<tr>'
      +'<td style="'+tdCss+';white-space:nowrap"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:'+_taskColor(t.nom)+';margin-right:7px;vertical-align:-1px"></span><b>'+_pilEsc(t.nom)+'</b> '+tag+'</td>'
      +'<td style="'+tdCss+';color:var(--texte-doux);white-space:nowrap">'+_pilNum(t.h)+' h</td>'
      +'<td style="'+tdCss+'"><input type="date" data-pw="start" data-k="'+key+'" value="'+t.start+'" min="'+cd.debut+'" max="'+cd.fin+'"'+dis+' style="'+inCss+'"></td>'
      +'<td style="'+tdCss+'"><input type="date" data-pw="end" data-k="'+key+'" value="'+t.end+'" min="'+cd.debut+'" max="'+cd.fin+'"'+dis+' style="'+inCss+'"></td>'
      +'<td style="'+tdCss+'"><input type="number" min="1" data-pw="dur" data-k="'+key+'" value="'+durOf(t.start,t.end)+'"'+dis+' style="'+nCss+'"></td>'
      +'<td style="'+tdCss+'">'+((admin&&t.custom)?'<button data-pw="reset" data-k="'+key+'" style="border:1px solid var(--gris);background:#fff;border-radius:7px;padding:3px 9px;font-size:11px;color:var(--texte-doux);cursor:pointer">\u21BA auto</button>':'')+'</td>'
      +'</tr>';
  }).join('');
  var MN=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  var dd=new Date(cd.debut+'T00:00:00'), df=new Date(cd.fin+'T00:00:00');
  var seasonTxt=dd.getDate()+' '+MN[dd.getMonth()]+' \u2192 '+df.getDate()+' '+MN[df.getMonth()]+' '+df.getFullYear();
  var resetAll=admin?'<button id="pil-pw-resetall" style="border:1px solid var(--gris);background:#fff;border-radius:9px;padding:7px 12px;font-size:12px;color:var(--texte-doux);cursor:pointer">Tout remettre en auto</button>':'';
  return '<div id="pil-param-host">'+_pilObjCard(cd,admin)
    +'<div style="'+cardCss+'">'
    +'<div style="'+ttlCss+';margin-bottom:4px">Paramétrage · fenêtres des tâches</div>'
    +'<div style="font-size:12.5px;color:var(--texte-doux);margin-bottom:10px">'+note+'</div>'
    +'<div style="height:3px;border-radius:3px;background:linear-gradient(90deg,#9B2D1F,#C2871E,#C8B020,#5C8A3E,#3D6B27);margin:0 0 14px"></div>'
    +'<div style="font-size:12.5px;color:var(--texte-doux);margin-bottom:12px">Saison active · <b style="color:var(--texte)">'+_pilEsc(cd.saison)+'</b> &nbsp;·&nbsp; '+seasonTxt+' <span style="color:var(--texte-doux)">(modifiable dans Réglages \u203A Saisons)</span></div>'
    +'<div style="width:100%;overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px;min-width:560px">'
    +'<thead><tr><th style="'+thCss+'">Tâche</th><th style="'+thCss+'">Heures</th><th style="'+thCss+'">Début</th><th style="'+thCss+'">Fin</th><th style="'+thCss+'">Durée (j)</th><th style="padding:6px 8px;border-bottom:1px solid var(--gris-clair)"></th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div>'
    +(resetAll?('<div style="margin-top:14px">'+resetAll+'</div>'):'')
    +'</div>'
    +_pilSimEcoCard(admin)
    +'<div style="'+cardCss+';font-size:12px;color:var(--texte-doux);line-height:1.55">Le <b style="color:var(--texte)">réel</b> de la frise (onglet Avancement) vient du <b style="color:var(--texte)">journal</b> : 1\u02B3\u1D49 validation de la tâche \u2192 date du 100 %. Rien à saisir ici pour le réel.</div>'
    +'</div>';
}
function _pilBindParam(d){
  var host=document.getElementById('pil-param-host'); if(!host) return;
  var admin=(typeof window.isAdmin==='function')&&window.isAdmin();
  function ord(y){ var p=String(y||'').split('-'); return Math.round((Date.UTC(+p[0],(+p[1]||1)-1,(+p[2]||1))-Date.UTC(2026,0,1))/86400000); }
  function ford(n){ var dd=new Date(Date.UTC(2026,0,1)+n*86400000); var mm=dd.getUTCMonth()+1, dj=dd.getUTCDate(); return dd.getUTCFullYear()+'-'+(mm<10?'0'+mm:mm)+'-'+(dj<10?'0'+dj:dj); }
  function getCd(){ return (window._chargeSaisonData&&window.getSaisonActive)?window._chargeSaisonData(window._pilSaison()):null; }
  function clampO(o,cd){ var a=ord(cd.debut),b=ord(cd.fin); return Math.max(a,Math.min(b,o)); }
  function cfg(){ if(!window.CONFIG) return null; if(!window.CONFIG.task_windows) window.CONFIG.task_windows={}; return window.CONFIG.task_windows; }
  function ech(){ var s=(typeof window._pilSaison==='function')?window._pilSaison():null; if(!s) return null; if(!s.echeances||typeof s.echeances!=='object'||Array.isArray(s.echeances)) s.echeances={}; return s.echeances; }
  function commit(msg){ try{ if(typeof window.saveData==='function'){ window.saveData('saisons'); window.saveData('config'); } }catch(e){} if(msg&&window.showToast) window.showToast(msg,'#3D6B27'); _pilFillContent(_pilData()); }
  function winOf(k,cd){ var f=null; (cd.taskWindows||[]).forEach(function(t){ if(_friseNorm(t.nom)===k)f=t; }); return f; }
  // Saisie de date : on ne valide JAMAIS a chaque 'change' (un input[type=date] en emet un
  // par segment pendant la frappe -> commit + re-render intempestifs + valeur intermediaire).
  // On lit la valeur FINALE au flush (focusout, ou debounce 800ms en filet pour le picker mobile).
  var _pwTimer=null, _pwEl=null;
  function _pwWatch(el){ if(!el) return false; if(el.id==='pil-obj-param') return true; var a=el.getAttribute&&el.getAttribute('data-pw'); return !!(a&&a!=='reset'); }
  function _pwApply(){
    if(_pwTimer){ clearTimeout(_pwTimer); _pwTimer=null; }
    var el=_pwEl; _pwEl=null; if(!el || !document.body.contains(el)) return;
    if(el.id==='pil-obj-param'){ if(admin && el.value){ _pilObjectifSet(el.value); if(window.showToast) window.showToast('Objectif mis à jour','#3D6B27'); } return; }
    var pw=el.getAttribute&&el.getAttribute('data-pw'); if(!pw||pw==='reset') return;
    if(!admin) return;
    var k=el.getAttribute('data-k'); var cd=getCd(); if(!cd) return;
    var w=winOf(k,cd); if(!w) return;
    // Store unifie = echeances de la saison consultee (meme source que Reglages > Modifier la periode,
    // lue en priorite par la charge/frise). On ecrit ICI, plus dans CONFIG.task_windows : sinon les
    // echeances existantes masquaient la modif au re-render (impression de « ca revient a l'origine »).
    var E=ech(); if(!E) return;
    var ex=E[w.nom]; var cur=ex?{start:ex.d1||w.start,end:ex.d2||w.end}:{start:w.start,end:w.end};
    if(pw==='start'){ if(!el.value) return; var nv=ford(clampO(ord(el.value),cd)); if(ord(nv)>ord(cur.end))cur.end=nv; cur.start=nv; }
    else if(pw==='end'){ if(!el.value) return; var ne=ford(clampO(ord(el.value),cd)); if(ord(ne)<ord(cur.start))ne=cur.start; cur.end=ne; }
    else if(pw==='dur'){ var dd2=Math.max(1,Math.round(parseFloat(el.value)||1)); cur.end=ford(clampO(ord(cur.start)+dd2-1,cd)); }
    E[w.nom]={d1:cur.start,d2:cur.end};
    commit('Fenêtre mise à jour');
  }
  function _pwSched(el){ _pwEl=el; if(_pwTimer) clearTimeout(_pwTimer); _pwTimer=setTimeout(_pwApply,800); }
  host.addEventListener('change', function(e){ if(_pwWatch(e.target)) _pwSched(e.target); });
  host.addEventListener('focusout', function(e){ if(_pwEl===e.target) _pwApply(); });
  if(!admin) return;
  host.addEventListener('click', function(e){
    var pw=e.target.getAttribute&&e.target.getAttribute('data-pw');
    if(pw==='reset'){ var k=e.target.getAttribute('data-k'); var cd=getCd(); var w=cd?winOf(k,cd):null; var E=ech(); if(E&&w) delete E[w.nom]; if(window.CONFIG&&window.CONFIG.task_windows) delete window.CONFIG.task_windows[k]; commit('Fenêtre remise en auto'); return; }
    if(e.target.id==='pil-pw-resetall'){ var cd2=getCd(); var E2=ech(); if(cd2&&E2){ (cd2.taskWindows||[]).forEach(function(t){ delete E2[t.nom]; if(window.CONFIG&&window.CONFIG.task_windows) delete window.CONFIG.task_windows[_friseNorm(t.nom)]; }); } commit('Fenêtres remises en auto'); return; }
  });
}

// ── Météo (chip header) ──
function _pilRenderMeteo(d){
  var el=document.getElementById('pil-meteo'); if(!el) return;
  if(!d.meteo){ el.style.display='none'; return; }
  el.style.display='';
  var jrs=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  var now=new Date(); var dateStr=jrs[now.getDay()]+' '+now.getDate()+' '+['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'][now.getMonth()];
  el.innerHTML='<span class="ico">'+(d.meteo.emoji||'⛅')+'</span><span class="t">'+(d.meteo.temp!=null?d.meteo.temp+'°':'—')+'</span>'
    + '<span class="sub">'+(d.meteo.wind!=null?('vent '+d.meteo.wind+' km/h'):'')+'<br>'+dateStr+'</span>';
}

// ── Remplissage du contenu de l'onglet courant ──
function _pilFillContent(d){
  var host=document.getElementById('pil-content'); if(!host) return;
  var tab=_PIL_TAB;
  if(tab==='param'){ host.innerHTML=_pilParamBody(d); _pilBindParam(d); return; }
  if(tab==='auj') host.innerHTML=_pilTabAuj(d);
  else if(tab==='avc') host.innerHTML=_pilTabAvc(d);
  else if(tab==='equ') host.innerHTML=
      (_pilAnyShow(['prs_equipe','prs_presences','prs_capacite'])?'<div class="pil-sec-h">Personnel</div>'+_pilTabPrs(d):'')
    + (_pilAnyShow(['mat_tracteur','mat_gnr','mat_phyto','mat_traitement'])?'<div class="pil-sec-h">Matériel</div>'+_pilTabMat(d):'');
  else if(tab==='cav') host.innerHTML=_pilTabCav(d);
  else if(tab==='sim') host.innerHTML=_pilTabSim(d);
  else if(tab==='eco') host.innerHTML=_pilTabEco(d);
  else if(tab==='cfm') host.innerHTML=_pilTabCfm(d);
  else if(tab==='arc') host.innerHTML=_pilTabArc(d);
  // Les graphes enregistres se dessinent APRES la pose du HTML : c'est la que
  // leur conteneur existe, donc que sa largeur est mesurable.
  if(window._mvGraphRepeindre) window._mvGraphRepeindre();
  _pilAfterFill(tab,d);
}
function _pilAfterFill(tab,d){
  if(tab==='avc'){
    if(_pilShow('avc_gauge')) _pilRenderGauge(d);
    if(_pilShow('avc_bar')) _pilRenderBar(d);
    if(_pilShow('avc_pie')) _pilRenderPie(d);
    var carteOpen=_pilShow('avc_carte') && !(_PIL_STATE.collapsed&&_PIL_STATE.collapsed.carte);
    if(carteOpen) _pilBuildMap(d);
  }
  if(tab==='sim' && _pilShow('sim_ordre') && !(_PIL_STATE.collapsed&&_PIL_STATE.collapsed.ordrepassage)) _opBuildMap();
}

// ── Délégation des interactions internes du contenu ──
function _pilBindContent(content){
  content.addEventListener('click', function(e){
    var _cm=e.target.closest('.pcav-mil[data-mil]');
    if(_cm){ e.stopPropagation(); _PCAV_MIL=parseInt(_cm.getAttribute('data-mil'),10); _pilFillContent(_pilData()); return; }
    var cn=e.target.closest('#pil-cavnav button');
    if(cn){ var s=cn.getAttribute('data-s'); if(s&&s!==_PIL_CAVSUB){ _PIL_CAVSUB=s; _pilSaveCav(s); _pilFillContent(_pilData()); } return; }
    var _sb=e.target.closest('[data-sim]'); if(_sb){ e.stopPropagation(); _pilSimAction(_sb.getAttribute('data-sim'), _sb.getAttribute('data-ti')); return; }
    var _ob=e.target.closest('[data-op]'); if(_ob){ e.stopPropagation(); _pilOpAction(_ob); return; }
    var nb=e.target.closest('.pil-names-btn'); if(nb){ e.stopPropagation(); _pilNamesOn=!_pilNamesOn; _pilApplyNames(); nb.textContent=_pilNamesOn?'\uD83C\uDFF7 Noms \u2713':'\uD83C\uDFF7 Noms'; return; }
    // Clic sur une campagne de la frise annuelle : zoom / retour. Re-cliquer la
    // meme campagne (ou le bouton de retour, qui porte son nom) revient a l'annee.
    // Reglage de l'ouverture d'exercice depuis la frise annuelle. _pexSetMois
    // verifie lui-meme le droit admin et RELIT la valeur apres ecriture : si
    // reglages.js n'est pas a jour, il le dit au lieu de faire semblant.
    var _ex=e.target.closest('[data-exm]');
    if(_ex){ e.stopPropagation(); var _em=parseInt(_ex.getAttribute('data-exm'),10);
      _PIL_ANN=null; _PIL_ANNK='';
      if(typeof window._pexSetMois==='function') window._pexSetMois(_em);
      return; }
    // Une photo emmene a l'ecran qui detaille sa question : on voit l'ensemble,
    // puis on descend. C'est le zoom demande, avec les onglets pour destinations.
    var _pg=e.target.closest('[data-pgo]');
    // ⚠️ Il n'existe PAS de _pilSetTab : le module ecrit _PIL_TAB, memorise, et
    //    re-rend. On suit le meme chemin que le clic sur un onglet (l.7035)
    //    plutot que d'inventer une seconde facon de changer d'onglet.
    if(_pg){ e.stopPropagation(); var _pt=_pg.getAttribute('data-pgo');
      // Une cible que le module ne connait pas ne doit pas ecrire une cle morte
      // dans localStorage : _pilLoadTab retomberait sur 'auj' au rechargement
      // sans que personne comprenne pourquoi.
      if(_pt && _PIL_VALID_TAB[_pt] && _pt!==_PIL_TAB){ _PIL_TAB=_pt; _pilSaveTab(_pt); renderPilotage();
        if(window.scrollTo) window.scrollTo(0,0); }
      return; }
    // Le fil d'Ariane : la croix et la racine ramenent a l'annee entiere.
    var _cx=e.target.closest('#pil-cr-x, #pil-cr-root');
    if(_cx){ e.stopPropagation();
      if(_PIL_SCOPE.camp){ _pilScopeSet(null); _pilPortee(); _pilFillContent(_pilData()); }
      return; }
    var _ea=e.target.closest('[data-etpc]');
    if(_ea){ e.stopPropagation(); var _en=_ea.getAttribute('data-etpc');
      // ★ Le clic ne change plus un panneau : il change LA PORTEE. Le fil
      //   d'Ariane et les quatre photos suivent, parce qu'ils lisent la meme
      //   chose. C'est ce qui manquait : une selection sans effet ailleurs.
      _pilScopeSet(_PIL_SCOPE.camp===_en?null:_en); _pilPortee(); _pilFillContent(_pilData()); return; }
    var _ec=e.target.closest('[data-etp]'); if(_ec){ e.stopPropagation(); var _ek=_ec.getAttribute('data-etp'); if(!_PIL_STATE.sub)_PIL_STATE.sub={}; _PIL_STATE.sub[_ek]=(_PIL_STATE.sub[_ek]===0)?1:0; _pilSaveState(_PIL_STATE); _pilFillContent(_pilData()); return; }
    // Économie : sous-vues, tri du tableau, export, raccourci Paramétrage.
    var _pe=e.target.closest('[data-pec]');
    if(_pe){
      e.stopPropagation();
      var _pa=_pe.getAttribute('data-pec');
      if(_pa==='sub'){ var _pv=_pe.getAttribute('data-v'); if(_pv&&_pv!==_PEC_SUB){ _PEC_SUB=_pv; _pecSaveSt(); _pilFillContent(_pilData()); } return; }
      if(_pa==='ps'){
        var _pk=_pe.getAttribute('data-k');
        // Re-cliquer la même colonne inverse le sens ; changer de colonne repart du
        // plus grand (ou de A → Z pour un nom), ce que tout le monde attend d'un tableau.
        if(_pk){ if(_pk===_PEC_PSORT) _PEC_PDIR=-_PEC_PDIR; else { _PEC_PSORT=_pk; _PEC_PDIR=(_pk==='nom')?1:-1; } _pecSaveSt(); _pilFillContent(_pilData()); }
        return;
      }
      if(_pa==='exy'){ var _xv=parseInt(_pe.getAttribute('data-v'),10); if(!isNaN(_xv)){ _PEX_AN=_xv; _pecSaveSt(); _pilFillContent(_pilData()); } return; }
      if(_pa==='param'){ _PIL_TAB='param'; _pilSaveTab('param'); renderPilotage(); if(window.scrollTo) window.scrollTo(0,0); return; }
      if(_pa==='csv'||_pa==='copy'){ _pecExport(_pa,_pecData()); return; }
      return;
    }
    var bs=e.target.closest('#pil-bar-seg button'); if(bs){ var b=bs.getAttribute('data-b'); if(b){ _PIL_STATE.bar=b; _pilSaveState(_PIL_STATE); _pilRenderBar(_pilData()); } return; }
    var ps=e.target.closest('#pil-pie-seg button'); if(ps){ var pm=ps.getAttribute('data-m'); if(pm){ _PIL_STATE.pie=pm; _pilSaveState(_PIL_STATE); _pilRenderPie(_pilData()); } return; }
    var head=e.target.closest('.pil-th');
    if(head){ var tile=head.closest('.pil-tile'); if(!tile) return; var id=tile.getAttribute('data-pid'); if(!id) return; if(!_PIL_STATE.collapsed)_PIL_STATE.collapsed={}; _PIL_STATE.collapsed[id]=_PIL_STATE.collapsed[id]?0:1; _pilSaveState(_PIL_STATE); tile.classList.toggle('open',!_PIL_STATE.collapsed[id]);
        // La barre \u00ab en main \u00bb est en position:fixed : replier le volet doit la
        // l\u00e2cher, sinon elle flotterait au-dessus d'un contenu invisible.
        if(id==='ordrepassage'){ if(_PIL_STATE.collapsed[id]){ if(_PIL_OP) _PIL_OP._pick=null; } else _opBuildMap(); } if(id==='carte'&&!_PIL_STATE.collapsed[id]) _pilBuildMap(_pilData()); return; }
  });
  var _odTimer=null, _odEl=null;
  function _odApply(){
    if(_odTimer){ clearTimeout(_odTimer); _odTimer=null; }
    var el=_odEl; _odEl=null; if(!el || !el.value) return;
    if(_pilObjectifSet(el.value)){ _pilFillContent(_pilData()); if(window.showToast) window.showToast('Objectif mis à jour','#3D6B27'); }
  }
  content.addEventListener('change', function(e){ if(e.target&&e.target.id==='pil-obj-date'){ _odEl=e.target; if(_odTimer) clearTimeout(_odTimer); _odTimer=setTimeout(_odApply,800); } });
  content.addEventListener('change', function(e){ if(!e.target||!_PIL_OP) return; if(e.target.id==='pil-op-start'){ if(typeof window.isAdmin==='function'&&window.isAdmin()){ _PIL_OP._startNom=e.target.value||null; _PIL_OP.order=_opNNNames(_opActTodo()); _pilOpRefresh(); } } });
  content.addEventListener('focusout', function(e){ if(e.target&&e.target.id==='pil-obj-date'&&_odEl===e.target) _odApply(); });
  // Le glisser-d\u00e9poser de l'ordre de passage a \u00e9t\u00e9 retir\u00e9 : il \u00e9tait cass\u00e9
  // (la ligne saisie recevait .dragging, donc son className n'\u00e9tait plus
  // exactement 'pil-op-row', et la boucle qui masquait les s\u00e9parateurs de
  // journ\u00e9e la passait elle aussi en display:none \u2014 elle dispara\u00eessait au
  // moment o\u00f9 on la prenait) et, m\u00eame r\u00e9par\u00e9, il obligeait \u00e0 tenir le doigt
  // en faisant d\u00e9filer une liste de 45 lignes. Remplac\u00e9 par \u00ab prise en main
  // puis fente d'insertion \u00bb (data-op pick/pickr/drop/last/cancel), qui passe
  // par la d\u00e9l\u00e9gation de clic ci-dessus \u2014 donc plus aucun \u00e9couteur ici.
}

// ── Branchement (une fois par render) ──
function _pilBind(){
  var back=document.getElementById('pil-back'); if(back) back.onclick=function(){ if(window.goHub) window.goHub(); };
  var tabs=document.getElementById('pil-tabs');
  var omenu=document.getElementById('pil-outils-menu');
  function _pilOutilsClose(){ if(omenu) omenu.classList.remove('show'); }
  if(tabs) tabs.addEventListener('click', function(e){
    if(e.target.closest('#pil-outils-btn')){ if(omenu) omenu.classList.toggle('show'); return; }
    var b=e.target.closest('[data-tab]'); if(!b) return;
    _pilOutilsClose();
    var t=b.getAttribute('data-tab'); if(!t||t===_PIL_TAB) return;
    _PIL_TAB=t; _pilSaveTab(t); renderPilotage();
    try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(e2){}
  });
  if(omenu) omenu.addEventListener('click', function(e){
    var b=e.target.closest('[data-tool]'); if(!b) return;
    _pilOutilsClose();
    var t=b.getAttribute('data-tool'); if(!t||t===_PIL_TAB) return;
    _PIL_TAB=t; _pilSaveTab(t); renderPilotage();
    try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(e2){}
  });
  document.addEventListener('click', function(e){
    if(!omenu||!omenu.classList.contains('show')) return;
    if(e.target.closest('#pil-outils-menu')||e.target.closest('#pil-outils-btn')) return;
    _pilOutilsClose();
  });
  var gear=document.getElementById('pil-gear');
  if(gear) gear.onclick=function(){
    var pz=document.getElementById('pil-perso'); if(!pz) return;
    if(pz.classList.contains('show')){ pz.classList.remove('show'); pz.innerHTML=''; }
    else { pz.innerHTML=_pilPersoHtml(_PIL_TAB); pz.classList.add('show'); }
  };
  var perso=document.getElementById('pil-perso'); if(perso) perso.addEventListener('change', _pilPersoChange);
  var content=document.getElementById('pil-content'); if(content) _pilBindContent(content);
}

// ── Rendu principal (appelé par goTo('pilotage')) ──
function renderPilotage(){
  var page=document.getElementById('page-pilotage'); if(!page) return;
  _PIL_STATE=_pilLoadState(); _PIL_TAB=_pilLoadTab(); _PIL_CAVSUB=_pilLoadCav(); _pecLoadSt();
  _pecCss();
  var d=_pilData();
  page.innerHTML=_pilSkeleton(d,_PIL_TAB);
  _pilRenderMeteo(d);
  _pilFillContent(d);
  _pilBind();
  // Idempotent : ne fait rien si la pastille est deja posee.
  if(typeof window._mvInjectHelpBtn==='function') window._mvInjectHelpBtn();
  if(!window._dataReady){ setTimeout(function(){ var p=document.querySelector('.page.active'); if(p&&p.id==='page-pilotage'){ try{ _pilFillContent(_pilData()); }catch(e){} } }, 800); }
}

// (_pilUpdateCard + carte hub « Pilotage » supprimées — hub purgé, plus aucun appelant · MAINT-2)

// ── Exposition ──
// _PIL_TABS / _PIL_TOOLS sont exposes pour l'AIDE (utils.js) : la fiche du
// module liste les onglets en les LISANT ici, au lieu de les decrire dans une
// phrase qui vieillit. Elle a annonce « Six onglets » pendant que le module en
// comptait sept, avec deux noms qui n'existaient plus.
window._PIL_SEM       = _PIL_SEM;
window._pilPolyBreak  = _pilPolyBreak;
window._PIL_TABS      = _PIL_TABS;
window._PIL_TOOLS     = _PIL_TOOLS;
window.renderPilotage = renderPilotage;
window.openPilotage   = function(){ if(window.goTo) window.goTo('pilotage'); else renderPilotage(); };

export { renderPilotage };
