// ════════════════════════════════════
// MA VIGNE — pilotage.js
// Écran de pilotage admin (ordinateur) : KPI, graphes natifs (barres + donut SVG),
// panneaux, personnalisation par utilisateur. LECTURE SEULE des données
// (via globals exposés par app.js). Aucune écriture en base.
// Le thème (clair/sombre) suit l'app via les variables CSS (--texte, --or, …).
// © 2026 Nicolas GUERET / GUERETTECH
// ════════════════════════════════════

// ⚠️ CE MODULE N'AVAIT AUCUN IMPORT : il lisait tout depuis `window`. Ca marche
//   parce que l'ordre de chargement met utils.js en premier — et « un appel qui
//   marche par ordre de chargement n'est pas un appel correct ». La palette
//   semantique arrive par un VRAI import, resolu au build : elle ne peut plus
//   etre absente au moment ou un graphe la lit.
import { _PIL_SEM, _mvInfoBtn, _mvIcon, _mvIconTuile, _mvBadge, _escAttr } from './utils.js';

const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if (DEBUG) console.log('[Ma Vigne] pilotage.js chargé');

// ── Helpers ──────────────────────────────────────────────
function _pilEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function _pilNum(n){ return Math.round(Number(n)||0).toLocaleString('fr-FR'); }
function _pilTnom(n){ return (typeof window.tNom==='function') ? window.tNom(n) : n; }
// pctColor — dégradé terre → ambre → vert vigne (cohérent avec la carte parcelles)
function _pilPctColor(p){ return p>=85?'#5B9B3A':p>=65?'#7FA83A':p>=45?'#D9A441':p>=25?'#C8853A':'#9A5A38'; }
// ════════════════════════════════════════════════════════════════════════════
// LA PALETTE SEMANTIQUE vit desormais dans utils.js (dette §34i soldee) : une
// palette n'est pas la propriete d'un module. Chaque graphe tire ses couleurs
// de _PIL_SEM, jamais d'un hex ecrit sur place. Elle est IMPORTEE en tete de
// fichier, plus lue sur window : le build garantit sa presence.
// ════════════════════════════════════════════════════════════════════════════
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
// ★ VERSION DE L'ETAT MEMORISE CHEZ LE CLIENT.
//   _pilSaveState ecrit l'etat COMPLET des qu'on touche une tuile, un onglet de
//   graphe ou une case. Les deux domaines en service ont donc, depuis des mois, un
//   `collapsed:{...tout a 0}` grave dans leur navigateur — et au chargement,
//   ce qui est memorise gagne sur le defaut. Changer le defaut sans marqueur
//   ne leur aurait STRICTEMENT RIEN fait : ils auraient installe la mise a jour
//   et vu le meme ecran. C'est le piege deja vecu avec `avc_etp` / `an_frise`.
//   A chaque fois qu'un defaut de disposition change, ce numero monte d'un cran
//   et _pilMigrEtat repose la disposition neuve — UNE seule fois.
// 4 (DZ-1, §162) : le Renfort arrive REPLIÉ — seule la tournée est ouverte à l'arrivée.
var _PIL_ST_V = 4;
var _PIL_DEFAULT = {
  show: {
    // Aujourd'hui (cockpit)
    // PIL-RANGE-4a (§446) : seules les clés lues restent (la vue Cave et ses points ; la tension, réglée dans Équipe ; la protection, dans Conformité).
    auj_cave:1, auj_cave_sv:1, auj_traiter:1, auj_tension:1,
    // Avancement
    // L'annee (niveau ①)
    // ⚠️⚠️ CES DEUX CLES MANQUAIENT AUX DEFAUTS. _pilNormalize ne garde que les
    //   cles listees ici : `an_frise` et `an_cadres` etaient PURGEES a chaque
    //   chargement, tandis qu'`avc_etp` — reste des defauts alors que l'indicateur
    //   avait demenage — ressuscitait a 1, valeur que _pilMigrShow recopiait
    //   aussitot dans `an_frise`. Une case decochee se recochait donc TOUTE SEULE a
    //   la session suivante, et la migration du lot 3 rejouait indefiniment.
    // ANNEE-1 (§234) : `an_cadres` a QUITTE la liste — le cadre de l'annee est une
    //   navigation, toujours affichee ; `an_frise` porte « Le renfort a prevoir ».
    an_budget:1, an_frise:1,
    // Avancement (`avc_etp` RETIRE : deplace vers `an_frise`, cf. _PIL_SHOW_MIGR)
    avc_bar:1, avc_pie:1, avc_temps:1, avc_echeances:1, avc_carte:1,   // avc_gauge parti : la jauge ouvre « Avancement par tâche » (PIL-RANGE-3)
    // Personnel
    prs_equipe:1, prs_presences:1, prs_capacite:1,
    // Matériel
    mat_tracteur:1, mat_gnr:1, mat_conso:1, mat_travaux:1,   // mat_travaux : PIL-RANGE-4a — absente des défauts, la case décochée se recochait au chargement
    // Simulation
    sim_ordre:1, sim_etsi:1, sim_cout:1,
    // Conformité (`mat_phyto` garde son NOM et change d'onglet — cf. _pilTabCfm)
    cfm_cuivre:1, cfm_ift:1, cfm_dre:1, mat_phyto:1
  },
  pie:   'reste',
  bar:   'saison',
  // ★★★ LE DEFAUT S'INVERSE : LES CARTES ARRIVENT REPLIEES.
  //   Avant, les dix-huit tuiles etaient ouvertes des l'arrivee. Or une tuile
  //   ouverte prend TOUTE la ligne (.pil-tile.open{grid-column:1/-1}) : la
  //   grille est reglee sur 2 a 4 colonnes et ne se remplissait JAMAIS. Sept
  //   indicateurs, sept pleines largeurs empilees, ~4 500 px de defilement.
  //   ⚠️ Replier NE CACHE AUCUN CHIFFRE : depuis ce lot le chiffre et sa ligne
  //     de cadre vivent dans l'EN-TETE. On replie le detail, jamais le nombre.
  // ★ MOTS-10 (§594) : la tournée du jour arrive REPLIÉE elle aussi (DZ-1 §162 la laissait seule ouverte) — la phrase du haut et son
  //   en-tête disent jusqu'où et quand ; on l'ouvre pour essayer. Clé jamais gravée chez les clients (_pilNormalize ne garde que
  //   les clés des défauts) : le défaut s'applique à tous dès le chargement, sans monter _PIL_ST_V.
  collapsed:{tension:1,conso:1,trx:1,echeances:1,carte:1,anrenfort:1,anbudget:1,ecofin:1,ecorev:1,ecotemps:1,ecoecart:1,ecotab:1,temps:1,equipe:1,tracteur:1,cave:1,presences:1,gnr:1,capacite:1,simulateur:1,renfort:1,phyto:1,cout:1,couteff:1,cuivre:1,ift:1,dre:1,ordrepassage:1},
  v: _PIL_ST_V,
  sub:   {trac_revision:1,trac_controle:1,trac_repar:1,trac_intercep:1,cave_fml:1,cave_sout:1,cave_ouillage:1,pres_cp:1,pres_recup:1,pres_mal:1,etp_frise:1,etp_courbe:1,etp_ecart:1}
};
function _pilCloneDefault(){ return JSON.parse(JSON.stringify(_PIL_DEFAULT)); }
function _pilNormalize(st){
  if(!st || typeof st!=='object') return null;
  var def=_pilCloneDefault();
  function mergeObj(cur,d){ var o={}; Object.keys(d).forEach(function(k){ o[k]=(cur&&cur[k]!==undefined)?(cur[k]?1:0):d[k]; }); return o; }
  // `v` traverse la normalisation : sans lui, _pilMigrEtat ne saurait jamais
  // que la migration a deja eu lieu.
  return { show:mergeObj(st.show,def.show), pie:st.pie||def.pie, bar:st.bar||def.bar, collapsed:mergeObj(st.collapsed,def.collapsed), sub:mergeObj(st.sub,def.sub), v:(st.v|0) };
}
function _pilShow(id){ var s=(_PIL_STATE&&_PIL_STATE.show)||{}; return s[id]!==0; }
// Cles d'indicateurs deplacees d'un onglet a l'autre : le choix memorise suit.
// Sans ca, « Charge & ETP » decoche dans Avancement laisserait le niveau
// « L'annee » vide chez ce client, et la case pour le rallumer serait ailleurs.
var _PIL_SHOW_MIGR = { avc_etp:'an_frise' };
function _pilMigrShow(st){
  if(!st||!st.show) return st;
  for(var k in _PIL_SHOW_MIGR){
    if(!Object.prototype.hasOwnProperty.call(_PIL_SHOW_MIGR,k)) continue;
    if(st.show[k]!=null && st.show[_PIL_SHOW_MIGR[k]]==null) st.show[_PIL_SHOW_MIGR[k]]=st.show[k];
    delete st.show[k];
  }
  return st;
}
// MOTS-9 (§592) : _pilAnyShow (l'intertitre d'une moitié sans carte) est parti — _pilTabEqu ne pose « Personnel » ou
//   « Matériel » que si l'une de ses cartes est rendue.
// ⚠️ ON NE REPOSE QUE LA DISPOSITION. `show` (les indicateurs choisis), `pie`,
//   `bar` et `sub` sont des choix de CONTENU : ils survivent. Seul `collapsed`,
//   dont la signification a change, repart du defaut.
function _pilMigrEtat(st){
  if(!st || typeof st!=='object') return st;
  if((st.v|0) >= _PIL_ST_V) return st;
  st.collapsed = _pilCloneDefault().collapsed;
  st.v = _PIL_ST_V;
  st._migre = true;                       // signal a _pilLoadState : a graver
  return st;
}
function _pilLoadState(){
  // ⚠️⚠️ L'ORDRE COMPTE : ON MIGRE AVANT DE NORMALISER.
  //   _pilNormalize ne conserve que les cles connues des defauts. Place en premier,
  //   il jetait `avc_etp` AVANT que _pilMigrShow ait pu en lire la valeur : le
  //   choix du client etait perdu au lieu d'etre reporte sur le nouveau nom.
  // ⚠️ La migration de disposition passe APRES _pilNormalize : celui-ci
  //   reconstruit l'objet a partir des cles connues et emporterait `v` avec lui,
  //   donc la migration se rejouerait a chaque chargement.
  //   ★ On GRAVE tout de suite. Sans ca, tant que le client ne touche a rien,
  //     rien n'est ecrit et la migration recommence a chaque ouverture — sans
  //     consequence visible, mais c'est un travail qui ne se termine jamais.
  try{ var raw=localStorage.getItem(_pilUserKey()); if(raw){ var n=_pilMigrEtat(_pilNormalize(_pilMigrShow(JSON.parse(raw)))); if(n){ if(n._migre){ delete n._migre; _pilSaveState(n); } return n; } } }catch(e){}
  try{ var rawD=localStorage.getItem(_pilDomKey()); if(rawD){ var nd=_pilMigrEtat(_pilNormalize(_pilMigrShow(JSON.parse(rawD)))); if(nd){ if(nd._migre){ delete nd._migre; _pilSaveState(nd); } return nd; } } }catch(e){}
  return _pilCloneDefault();
}
function _pilSaveState(st){ try{ localStorage.setItem(_pilUserKey(), JSON.stringify(st)); }catch(e){} }
var _PIL_STATE = null;
var _PIL_TAB = 'auj';
// 5 onglets VISIBLES (regroupement : Personnel+Materiel -> Equipe ; Economie+Conformite -> Eco & conformite).
// Les fonctions de rendu internes (_pilTabEqu/_pilTabEco/_pilTabCfm) restent inchangees.   (MOTS-9 : _pilTabEqu remplace _pilTabPrs et _pilTabMat)
// La barre suit la progression d'une campagne : ou j'en suis -> ce qui vient ->
// ce que je decide -> avec qui -> ce que ca coute. « Decider » etait enterre dans
// le menu Outils au motif qu'il servait peu ; c'est la seule page ou l'on arbitre
// quelque chose. « Archives » prend sa place dans les Outils : deux consultations
// par an, contre un usage hebdomadaire en pleine campagne.
// Libelles de barre COURTS (un mot), titres complets dans _PIL_LABELS.
// L'ECONOMIE et la CONFORMITE partageaient un seul onglet. Deux metiers, deux
// questions, deux rythmes : l'une se consulte le lundi matin, l'autre avant un
// controle. Les melanger obligeait a masquer la moitie de l'ecran pour lire l'autre.
// ════════════════════════════════════════════════════════════════════════════
// LA BARRE EST UN AXE DE ZOOM, PLUS UNE LISTE DE SUJETS.
// Sept onglets a plat, c'etaient sept SUJETS : on ne voyait donc jamais
// l'annee, on tombait dans un sujet. L'ordre va desormais du large au fin —
// l'annee, la campagne, les gens et les taches, la simulation — et les trois
// derniers sont des ECRANS DE DETAIL, ou l'on arrive en cliquant une photo.
// ⚠️ Les cles ne changent PAS (`avc`, `equ`, `sim`…) : elles sont memorisees
//    chez les clients, citees par app.js et verifiees par C22. On renomme et
//    on reordonne ; on ne renumerote rien en base.
// ════════════════════════════════════════════════════════════════════════════
// ★★ GABARIT-2 (§456) — LA BARRE DE GRAPHIQUE, UNE MESURE POUR TOUS LES GRAPHIQUES. Un attribut SVG ne lit pas var() : ces valeurs
//   recopient la charte (--barre-graph-h, --jauge-h, --r-xs ; colonnes à 2 px d'arrondi) et mv-harnais-gabarit2 vérifie qu'elles collent.
//   h : la barre d'un graphique (prévu, poste, écart) · h2 : la barre secondaire (le réel sous le prévu) · r : son arrondi · rv : celui d'une colonne.
var _PIL_GB = { h:16, h2:10, r:4, rv:2 };
var _PIL_TABS = [
  ['auj','chrono','Aujourd\'hui'],
  ['avc','raisin','Travaux'],   // PIL-RANGE-3 (§445) : « La campagne » devient « Travaux » — la barre « Vous regardez » dit déjà « La campagne »
  // ★★ « L'equipe & les taches » ne montrait AUCUNE tache : son contenu est
  //   Personnel + Materiel. Les taches vivent au niveau ② (avancement par tache,
  //   echeances) et dans Economie › Postes. Les descendre ici les DUPLIQUERAIT —
  //   la faute que la refonte venait de corriger sur « Charge & ETP ». On corrige
  //   donc le mot, pas la place : l'axe se lit « l'annee › la campagne et ses
  //   taches › les gens et les machines › simuler ».
  ['equ','equipe','L\'équipe & le matériel'],
  // \u2605\u2605\u2605 \u00ab SIMULER \u00bb NOMMAIT MAL LE SEUL ONGLET QUI AGISSE.
  //   Deux de ses trois cartes sont en lecture seule et le disent — \u00ab rien n'est
  //   enregistre \u00bb. La troisieme, l'ordre de passage, ECRIT
  //   CONFIG.ordre_passage_t, appelle saveData('config') et pilote l'ecran Vigne
  //   de l'equipe. C'est la seule carte de tout le module qui touche une donnee
  //   partagee — rangee sous un verbe qui promet qu'il ne se passe rien.
  //   \u26a0\ufe0f RETOUR EN ARRIERE ASSUME : le lot 5 de \u00a734 avait declare \u00ab Decider \u00bb
  //     mort. Il l'avait tue quand la barre etait une liste de SUJETS ; depuis,
  //     c'est un axe de ZOOM, et un verbe d'action en bout d'axe se tient — on
  //     descend du large au fin, puis on tranche.
  //   \u26a0\ufe0f La cle reste `sim` : memorisee chez les clients, citee par app.js,
  //     verifiee par C22. On renomme, on ne renumerote pas.
  ['sim','curseurs','D\u00e9cider'],
  ['eco','euro','Économie'],
  ['cfm','alerte','Conformité'],
  // ★ Lot NAV-3 : Archives se LIT, c'est un écran de détail comme Économie et
  //   Conformité — un onglet après le filet. Le bouton « Outils » qui le cachait
  //   avec Paramétrage n'existe plus : ce qui se RÈGLE (objectifs, fenêtres,
  //   hypothèses, IFT de référence) vit dans la roue crantée de l'en-tête.
  ['arc','carton','Archives']
];
// Ou s'arrete le zoom et ou commencent les ecrans de detail. La barre pose un
// filet entre les deux : sans lui, « Cave » se lit comme un cinquieme niveau.
var _PIL_ZOOM_FIN = 'sim';
// ★★ LA BARRE ET LE TITRE DISENT ENFIN LA MEME CHOSE. La refonte avait renomme
// _PIL_TABS sans toucher a _PIL_LABELS : on cliquait « La campagne » et on
// atterrissait sous « Avancement », « Simuler » sous « Decider » — le libelle que
// le lot 5 declarait mort. Et `an` n'avait AUCUNE entree : le titre du niveau ①
// sortait VIDE, la roue crantee flottant seule dans l'en-tete.
// ⚠️ Les cles ne bougent pas ; seuls les mots changent.
var _PIL_LABELS = {auj:'Aujourd\'hui',avc:'Travaux — où en est-on, et quand aura-t-on fini',equ:'L\'équipe & le matériel',cav:'Cave',eco:'Économie',cfm:'Conformité — cuivre, IFT et délai de rentrée',arc:'Archives',sim:'Décider — la tournée du jour, qui fait quoi, et le renfort'};
var _PIL_VALID_TAB = {auj:1,avc:1,equ:1,cav:1,eco:1,cfm:1,arc:1,sim:1};
// Migration des onglets memorises avant le regroupement.
// Migration des cles memorisees : `ecf` (l'onglet composite) part sur l'economie.
// `eco` et `cfm` etaient des cles historiques deja vues : elles redeviennent valides.
var _PIL_TAB_MIGR = {prs:'equ',mat:'equ',ecf:'eco',cav:'auj',an:'eco'};   // an : PIL-RANGE-2b (§444), L'annee est rangee dans Economie et Equipe   // cav : l'onglet Cave est rentre dans la Cave (lot CAVE-3)
// ★ 'param' (le Parametrage, lot NAV-3) ne passe PAS par _PIL_TAB_MIGR : C22 lit
//   cette table comme la liste des cles mortes et rougirait sur le 'param' du
//   Cuvier (cave.js, cle homonyme, tolerance CAVE-2). Il est traite a part :
//   memorise -> on rouvre sur Aujourd'hui ; demande -> on ouvre la roue.
var _PIL_TAB_ROUE = 'param';
function _pilTabKey(){ return 'mavigne_pil_tab_'+_pilTenant(); }
function _pilLoadTab(){ try{ var t=localStorage.getItem(_pilTabKey()); if(t===_PIL_TAB_ROUE) t='auj'; if(_PIL_TAB_MIGR[t]) t=_PIL_TAB_MIGR[t]; if(_PIL_VALID_TAB[t]) return t; }catch(e){} return 'auj'; }
function _pilSaveTab(t){ try{ localStorage.setItem(_pilTabKey(), t); }catch(e){} }
// AUJ-5 (§307) : à l'ouverture de l'appli (app.js/goHub), le Pilotage repart sur Aujourd'hui.
window._pilOuvrirAujourdhui=function(){ _PIL_TAB='auj'; _pilSaveTab('auj'); };
// ── LE seul chemin pour changer d'onglet. Le clic sur #pil-tabs le traverse,
//   et un appelant exterieur aussi. Options :
//     silencieux : ne remonte pas la page (rendre au visiteur l'onglet qu'il
//                  avait avant une demo ne doit pas lui faire sauter l'ecran).
//   Rend false quand rien n'a change — cle inconnue, ou onglet deja actif.
function _pilSetTab(t, opts){
  if(t===_PIL_TAB_ROUE){ if(window._mvReglOpen) window._mvReglOpen('pilotage'); return false; }
  if(!t || !_PIL_VALID_TAB[t]){
    if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'_pilSetTab : cle inconnue '+t});
    return false;
  }
  if(t===_PIL_TAB) return false;
  _PIL_TAB=t; _pilSaveTab(t); renderPilotage();
  if(!(opts&&opts.silencieux)){ try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(e){} }
  return true;
}
// Cles refondues (urg/mil/parc). Les anciennes (elv/vin/ven) sont MIGREES
// plutot que rejetees : sans table, l'utilisateur retombait sans explication
// sur le premier onglet. Meme principe que _PIL_TAB_MIGR.
var _PIL_CAV_MIGR = {elv:'urg', vin:'urg', ven:'mil'};
function _pilTabLabel(tab){ return _PIL_LABELS[tab]||''; }
// ★★★ MOTS-8 (§590) — UNE COULEUR PAR TÂCHE, LA MÊME PARTOUT DANS L'ONGLET TRAVAUX. Trois couleurs vivaient côte à côte : le
//   donut prenait la sienne au RANG de la part (une tâche changeait de couleur entre « Reste », « Fait » et « Prévu ») ; la frise,
//   l'écart et les fenêtres de la roue lisaient une table de neuf tâches connues (les autres toutes brunes : Taille et Tirage
//   confondus) ; le Palissage était doré d'un côté, violet de l'autre. Désormais : la place de la tâche dans la période consultée
//   (s.taches), dans la palette du donut. Une tâche absente de la liste prend une place fixe, tirée de son nom.
function _pilTCol(nom){
  var k=_friseNorm(nom), sa=null; try{ sa=_pilSaison(); }catch(e){ sa=null; }
  var L=((sa&&sa.taches)||[]).map(function(n){ return _friseNorm(n&&n.nom!=null?n.nom:n); }), i=L.indexOf(k);
  if(i<0){ var h=0; for(var c=0;c<k.length;c++) h=(h*31+k.charCodeAt(c))>>>0; i=L.length+(h%_PIL_PIE_COLORS.length); }
  return _PIL_PIE_COLORS[i%_PIL_PIE_COLORS.length];
}
function _taskColor(nom){ return _pilTCol(nom); }

// ── Icônes SVG trait fin (remplaçant les emojis des en-têtes) ──
// ⚠️ DEUX TABLES POUR UNE SEULE IDEE, C'ETAIT UNE DE TROP. `_PIL_TILE_ICO`
//   donnait une cle de `_PIL_IC`, qui donnait un nom du sprite : deux sauts
//   pour rien. Et surtout, une table dont les VALEURS ne sont pas des noms
//   d'icones est indistinguable, pour un controle automatique, d'une table
//   dont elles le sont. Une seule table desormais, toutes valeurs = sprite.
var _PIL_TILE_ICO={couteff:'balance',carte:'carte',temps:'balance',equipe:'equipe',
  tracteur:'tracteur',cave:'verre',presences:'equipe',phyto:'feuille',echeances:'calendrier',
  etp:'balance',capacite:'balance',simulateur:'equipe',ordrepassage:'cible',gnr:'carburant',
  traitement:'pulverisateur',meteo:'nuage',conso:'carburant',vinif:'fiole',cout:'balance',cuivre:'fiole',
  ift:'pulverisateur',dre:'goutte',anbudget:'euro',anrenfort:'equipe',ecofin:'graphique',ecorev:'bouteille',ecotemps:'balance',ecoecart:'graphique',ecotab:'liste'};
function _pilIco(n){ return _mvIcon(n,16); }
function _pilIcoFor(id){ return _pilIco(_PIL_TILE_ICO[id]||'graphique'); }
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
// AUJ-2 (§261) : l'état d'une journée de planning, écrit UNE fois — les présences du jour (_pilData) et les
//   absences à venir de « À savoir » (cockpit.js) le lisent ici.
function _pilEtatEntree(e){
  var etat='present', motif='';
  if(e){
    if(e.type==='cp') etat='cp';
    else if(e.type==='recup') etat='recup';
    else if(e.absent){ motif=e.comment||''; etat=/malad/i.test(motif)?'maladie':'absent'; }
  }
  return { etat:etat, motif:motif };
}
window._pilEtatEntree=_pilEtatEntree;
// ★★ AUJ-5 (§307) — LE PLANNING FAIT FOI (Nico, 10/10 : « il faut toujours se baser sur le planning »).
//   Un jour où le planning ne prévoit pas quelqu'un (week-end, jour sans heures au modèle), il n'est ni présent ni absent :
//   il est AU REPOS. Avant, un jour sans saisie valait « présent » — un samedi, l'Effectif annonçait toute l'équipe, et
//   « À savoir » faisait revenir les absents un samedi. La question est posée au planning lui-même : _planPrevuPersRange
//   (la grille du modèle, contrat compris) et _planWorkPersRange (la saisie du jour : un samedi travaillé compte).
//   Sans planning chargé : du lundi au vendredi.
function _pilPrevuLe(m, dt){
  if(!m || !dt) return false;
  var d0=new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()), w=d0.getDay();
  // ★ PIL-FIX-1 (§440) : un jour FÉRIÉ n'est « prévu » que si la personne y est SAISIE au travail — comme l'écran du
  //   planning, qui l'affiche « férié » sans saisie (_planDayStatus). Le modèle annualisé recalé d'une année sur l'autre
  //   peut poser des heures sur un férié (le 11 novembre 2027 tombe sur le 2ᵉ jeudi, travaillé en 2026) : elles ne font
  //   ni une présence ni un jour ouvré. Sans planning chargé, un férié n'est pas prévu non plus.
  if(_pilFerieLe(d0)) return _pilSaisiAuTravail(m, d0);
  if(typeof window._planPrevuPersRange!=='function' || typeof window._planWorkPersRange!=='function') return w!==0 && w!==6;
  try{ return (Number(window._planPrevuPersRange(m, d0, d0))||0)>0 || (Number(window._planWorkPersRange(m, d0, d0))||0)>0; }
  catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilPrevuLe'); return w!==0 && w!==6; }
}
window._pilPrevuLe=_pilPrevuLe;
// Le domaine travaille-t-il ce jour-là ? Oui dès qu'une personne hors bureau, sous contrat, y est prévue au planning.
function _pilJourDomaine(dt){
  if(!dt) return false;
  var L=_pilMembresActifs(_pilPhotoIso(dt)).filter(function(m){ return m && !m.bureau; });
  if(!L.length) return _pilJourCalendrier(dt);   // PIL-FIX-1 (§440) : sans équipe, lundi→vendredi, fériés retirés
  return L.some(function(m){ return _pilPrevuLe(m, dt); });
}
// ★ PIL-FIX-1 (§440) — les fériés, lus à la source du planning (_feriesY : fixes et mobiles, la même table que l'écran).
function _pilFerieLe(dt){
  if(!dt || typeof window._feriesY!=='function') return false;
  try{ var F=window._feriesY(dt.getFullYear()); return !!(F && F[dt.getMonth()] && F[dt.getMonth()][dt.getDate()]); }
  catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilFerieLe'); return false; }
}
// Le repli quand le planning ne dit rien : du lundi au vendredi, sans les fériés.
function _pilJourCalendrier(dt){ var w=dt.getDay(); return w!==0 && w!==6 && !_pilFerieLe(dt); }
// Une personne est-elle SAISIE au travail ce jour-là : une entrée du planning, et des heures de travail effectif ?
function _pilSaisiAuTravail(m, d0){
  var PE=window.PLANNING_ENTRIES||{}, an=(PE[m.nom]||{})[d0.getFullYear()], mo=an&&an[d0.getMonth()], e=mo&&mo[d0.getDate()];
  if(!e || typeof window._planWorkPersRange!=='function') return false;
  try{ return (Number(window._planWorkPersRange(m, d0, d0))||0)>0; }
  catch(err){ if(window._mvAvale) window._mvAvale(err,'pilotage.js/_pilSaisiAuTravail'); return false; }
}
window._pilJourDomaine=_pilJourDomaine;
function _pilData(){
  var ch = (typeof window.calcHeures==='function') ? window.calcHeures() : { data:[], totalReste:0, totalTotal:0 };
  var data = (ch && ch.data) || [];
  var totalReste = Math.round((ch&&ch.totalReste)||0);
  var totalTotal = Math.round((ch&&ch.totalTotal)||0);
  var hDone = Math.max(0, totalTotal - totalReste);
  // ★ REVUE-8 (§408) : 0 h prévues, ce n'est pas « 100 % fait » — la jauge dit « — » (gaugeVide), sa valeur tombe à 0.
  var gaugeVide = !(totalTotal>0);
  var gaugePct = totalTotal>0 ? Math.round(hDone/totalTotal*100) : 0;

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

  // PRIO-1 (§235) : la tâche prioritaire n'est plus « la plus d'heures restantes » ; _pilCkPrio lit
  //   la règle commune (window._mvTacheDuMoment, app.js).

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
    var _kp = (typeof window!=='undefined' && window._trCompteur) ? window._trCompteur(t) : null;   // ★ COMPT-1 (§483) : le compteur estimé de tracteur.js, sinon le dernier relevé
    var hasComp = ((_kp || (t.compteur_h!=null && t.compteur_h!=='')) && t.revision_h!=null && t.revision_h!=='');
    var revReste = hasComp ? Math.round((Number(t.revision_h)-(_kp?_kp.h:Number(t.compteur_h)))*10)/10 : null;
    var _ep = (typeof window!=='undefined' && window._trRevEtat) ? window._trRevEtat(t) : null;   // ★ COMPT-4 (§486) : la date de l'intervalle
    var _ents = (typeof window!=='undefined' && window._trEntEtat && Array.isArray(t.entretiens_prog)) ? t.entretiens_prog.map(function(e){ var s=window._trEntEtat(t,e); return (s&&s.connu)?{ nom:e.nom, reste:s.reste, pd:s.pd, jours:s.jours, depasse:s.depasse, rouge:s.rouge, orange:s.orange }:null; }).filter(Boolean) : [];   // ★ COMPT-7 (§489) : les autres entretiens
    return { id:t.id, nom:t.nom, traitementOnly:t.traitementOnly, rep:rep, lastCtrl:lastCtrl, sess:sess, sAdv:sAdv, revReste:revReste, revDate:(_ep&&_ep.date)||null, revJours:_ep?_ep.jours:null, ents:_ents };
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
    var _ee=_pilEtatEntree(e), etat=_ee.etat, motif=_ee.motif;   // AUJ-2 : une seule écriture de l'état du jour
    if(!_pilPrevuLe(m,_now)){ etat='repos'; motif=''; }   // AUJ-5 (§307) : pas prévu au planning ce jour-là — ni présent, ni absent
    // \u2605\u2605\u2605 LE POIDS DE LA FICHE VOYAGE AVEC ELLE.
    //   Une equipe COLLECTIVE (m.collectif, m.effectif = 26) est UNE fiche et
    //   VINGT-SIX personnes. _headWeek et capEquipe le savent depuis le 11/08
    //   (\u00a733), le simulateur de renfort depuis le 12/08 (\u00a735) — pas ces
    //   presences-la. Sans ce poids, l'onglet D\u00e9cider propose de repartir
    //   \u00ab 2 personnes \u00bb entre les taches un jour ou 28 sont sous contrat.
    return { nom:m.nom, etat:etat, motif:motif, bureau:!!m.bureau,
             eff:((typeof window._mvEffDef==='function')?window._mvEffDef(m):1),
             coll:!!(typeof window._mvEstCollectif==='function'&&window._mvEstCollectif(m)) };
  });
  var nPresent = presences.filter(function(p){ return p.etat==='present'; }).length;
  var nCp = presences.filter(function(p){ return p.etat==='cp'; }).length;
  var nAbs = presences.filter(function(p){ return p.etat==='maladie'||p.etat==='absent'; }).length;
  var nRecup = presences.filter(function(p){ return p.etat==='recup'; }).length;
  // Effectif au champ aujourd'hui. DEUX nombres, volontairement distincts :
  //   presentFiches = combien de FICHES sont la (\u00ab 3 pr\u00e9sents sur 4 \u00bb) ;
  //   presentChamp  = combien de PERSONNES, equipes collectives a leur effectif.
  // Les deux sont deja bornes aux gens SOUS CONTRAT ce jour-la : `membres` vient
  // de _pilMembresActifs, qui filtre sur _mvEnContratLe. Confondre les deux, c'est
  // soit annoncer \u00ab 28 pr\u00e9sents sur 4 \u00bb, soit repartir une equipe de 26 comme
  // une seule paire de bras.
  var nVchamp = presences.filter(function(p){ return !p.bureau && p.etat!=='repos'; }).length;   // AUJ-5 : les gens prévus ce jour-là
  var nIndispoChamp = presences.filter(function(p){ return !p.bureau && p.etat!=='present' && p.etat!=='repos'; }).length;
  var presentFiches = Math.max(0, nVchamp - nIndispoChamp);
  var presentChamp = presences.reduce(function(a,p){
    return a + ((!p.bureau && p.etat==='present') ? (p.eff||1) : 0);
  },0);

  var domaine = window.DOMAINE_NOM || 'Domaine';

  return { data:data, active:active, done:done, totalReste:totalReste, totalTotal:totalTotal, hDone:hDone, gaugePct:gaugePct, gaugeVide:gaugeVide,
           saison:saison, surfTot:surfTot, nActives:nActives, membres:membres, refDate:_refDs, nFinis:nFinis,
           sessions:sessions, lastSess:lastSess, sessAdv:sessAdv, cuvees:cuvees, traits:traits, meteo:meteo, domaine:domaine,
           tracs:tracs, nRepar:nRepar, gnr:gnr, ouAlerte:ouAlerte, presences:presences, nPresent:nPresent, nCp:nCp, nAbs:nAbs, nRecup:nRecup, nVchamp:nVchamp, presentChamp:presentChamp, presentFiches:presentFiches, nIndispoChamp:nIndispoChamp,
           jourTravaille:(nVchamp>0 || !presences.some(function(p){ return !p.bureau; })), nRepos:presences.filter(function(p){ return !p.bureau && p.etat==='repos'; }).length };
}
window._pilData=_pilData;   // AUJ-5 (§307) : lu par mv-harnais-auj5


// ── Données du donut selon la métrique choisie ───────────────────────
function _pilPieData(d){
  // ★ MOTS-8 (§590) : un titre qui ne change plus avec le bouton (« Reste · Fait · Prévu » le dit), et la couleur de la TÂCHE
  //   (_pilTCol), plus celle de son rang : la plus grosse part changeait de couleur d'un bouton à l'autre.
  var src=[], title='La charge par tâche', unit='h';
  if(_PIL_STATE.pie==='fait'){      src=d.data.map(function(t){return {n:t.nom,v:Math.round(t.h_done||0)};}); }
  else if(_PIL_STATE.pie==='plan'){ src=d.data.map(function(t){return {n:t.nom,v:Math.round(t.h_total||0)};}); }
  else {                            src=d.data.map(function(t){return {n:t.nom,v:Math.round(t.h_reste||0)};}); }
  src = src.filter(function(x){ return x.v>0; }).sort(function(a,b){ return b.v-a.v; });
  src.forEach(function(x){ x.c=_pilTCol(x.n); });
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
  // ★★ MOTS-8 (§590) — la barre de la campagne, trois chiffres, une ou deux pastilles. Le pourcentage est en tête de l'onglet
  //   (« 16 % fait, fin prévue… ») : il ne se répète plus ici. La campagne est dans « Vous regardez », ses tâches juste dessous.
  var nC=d.active.length, nF=d.done.length;
  g.innerHTML =
    '<div class="pil-gauge-track" role="img" aria-label="'+(d.gaugeVide?'Rien au barème':(d.gaugePct+' % fait sur la campagne'))+'"><div class="pil-gauge-fill" style="width:'+d.gaugePct+'%"></div></div>'
    + '<div class="pil-gauge-meta pil-tv-3">'
    + '<span class="pil-gm"><b class="done">'+_pilNum(d.hDone)+'\u00a0h</b> fait</span>'
    + '<span class="pil-gm"><b>'+_pilNum(d.totalReste)+'\u00a0h</b> reste</span>'
    + '<span class="pil-gm"><b>'+_pilNum(d.totalTotal)+'\u00a0h</b> prévu</span>'
    + (nC?'<span class="pil-tv-pl">'+nC+' en cours</span>':'')
    + (nF?'<span class="pil-tv-pl ok">'+nF+' fini'+(nF>1?'es':'e')+'</span>':'')
    + '</div>';
}
function _pilRenderBar(d){
  var host=document.getElementById('pil-bar'); if(!host) return;
  var mode=_PIL_STATE.bar||'saison';
  var seg=document.getElementById('pil-bar-seg');
  if(seg) seg.querySelectorAll('button').forEach(function(b){ var on=b.getAttribute('data-b')===mode; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on?'true':'false'); });
  if(mode==='cmp'){ host.innerHTML=_pilCmpHtml(d); return; }
  // KIT-1 (§226) : le MÊME dessin que la carte de l'Accueil (_mvkAvancement) — ordre de la saison, noms entiers,
  //   couleur d'état, détail en heures ou en surface. Avant : trié par pourcentage, dégradé terre (_pilPctColor).
  // ★ MOTS-8 (§590) : la pastille de la tâche (sa couleur, la même que dans « La charge par tâche » et la frise), et ses dates
  //   au toucher. La barre garde la couleur d'état.
  if(!(d.data||[]).length){ host.innerHTML='<div class="pil-empty">Aucune t\u00e2che sur la campagne</div>'; return; }
  host.innerHTML='<div class="mvk-liste">'+window._mvkAvancement(d.data,_pilRetards(),{ col:_pilTCol, dates:_pilTvDatesFn(d) })+'</div>';
}
// ★ DATES-1 (§323) : l'arrachage a désormais ses dates. Fini pour l'équipe (la suite au prestataire), il n'est pas « en retard » :
//   sa ligne est verte (CHANT-1), « À savoir » ne doit pas le dire en retard.
function _pilRetards(){
  var r=(typeof window._mvkRetards==='function')?window._mvkRetards(_rfCd()):{};
  if(r.Arrachage&&typeof window._arrEquipeFiniePartout==='function'&&window._arrEquipeFiniePartout()) delete r.Arrachage;
  return r;
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
  return {an:an, off:_arcN(deb)-_arcN(_arcBornes(an).d0)};   /* ★ AXE-1 */
}
// Ecart maximal tolere entre deux periodes homologues d'une campagne a l'autre. 75 jours laissent
// passer un printemps ouvert le 1er mars une annee et le 5 avril la suivante, sans jamais confondre
// un printemps avec un hiver (151 jours d'ecart sur l'axe).
var _PIL_CMP_TOL = 75;
// \u2605\u2605\u2605 LA TOLERANCE SEULE NE SUFFIT PAS (15/08/2026). Elle a ete calibree sur UNE
// paire — printemps/hiver, 151 jours — et jamais verifiee sur les autres. Or la
// campagne s'ouvre le 1er aout : une periode de vendange demarrant ce jour-la est
// a l'offset 0, et un hiver ouvert le 1er octobre est a 61. 61 < 75 : le code
// appariait donc UN HIVER A UNE VENDANGE, en silence, chez le domaine de reference.
// Le ratio qui en sortait (x2,93) a fait afficher « -202 j de retard » a un domaine
// qui avait un jour d'avance.
// Deux periodes homologues SE RECOUVRENT sur l'axe. C'est le critere, pas la
// distance entre leurs debuts. On garde la tolerance en premier filtre (elle ecarte
// vite), le recouvrement tranche.
var _PIL_CMP_RECOUV = 0.50;
// Part minimale de la periode la plus courte qui doit tomber dans l'autre.
function _pilCmpSegment(p){
  if(!p||!p.debut||!p.fin) return null;
  var o=_pilCmpOffset(p.debut), dur=_arcN(p.fin)-_arcN(p.debut);
  if(!(dur>0)) return null;
  return [o.off, o.off+dur];
}
function _pilCmpRecouvre(a,b){
  var sa=_pilCmpSegment(a), sb=_pilCmpSegment(b);
  if(!sa||!sb) return 1;            // dates manquantes : on ne bloque pas, le repli par nom tranchera
  var inter=Math.max(0, Math.min(sa[1],sb[1])-Math.max(sa[0],sb[0]));
  var court=Math.min(sa[1]-sa[0], sb[1]-sb[0]);
  return court>0 ? (inter/court) : 0;
}
// \u26a0 UN INSTANTANE INCOMPLET N'EST PAS UNE REFERENCE. « Hiver 2025-2026 » a ete
// archive a 32 % : son hFaites (787 h) ne couvre pas la periode, il couvre le tiers
// qui a ete valide. Tout rapport bati dessus mesure un trou de saisie, pas une
// cadence — c'est exactement ce que le commentaire de la borne annoncait, et la
// borne [0,5 ; 3] l'a laisse passer a 0,07 pres.
var _PIL_CMP_ACHEVE = 0.80;
function _pilCmpAcheve(h){
  var ts=(h&&h.stats&&h.stats.tachesStats)||[];
  var hT=0,hD=0;
  ts.forEach(function(t){ hT+=(t.h_total||0); hD+=(t.h_done||0); });
  return hT>0 ? (hD/hT) : 0;
}
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
      if(_pilCmpRecouvre(sa,pe)<_PIL_CMP_RECOUV) return;
      if(_pilCmpAcheve(h)<_PIL_CMP_ACHEVE) return;
      if(o.an>bestAn||(o.an===bestAn&&ec<bestEc)){ bestAn=o.an; bestEc=ec; bestP=h; }
    });
    if(bestP) return bestP;
  }
  // \u26a0 CMP-NOM (26/09/2026, §182) : le repli par nom est un repli pour les archives
  //   NON DATABLES (periode supprimee de SAISONS), rien d'autre. Il reprenait avant tout
  //   ce que le chemin par dates venait d'ecarter : « Hiver 2026 - 2027 » rejetait
  //   « Hiver 2025–2026 » (clos a 32 %, hFaites 787 h), puis le repli le rendait par
  //   son nom — et le verdict d'Economie affichait « +190,9 % de temps en plus » en
  //   rouge, soit 2 289 h de presence sur le tiers du travail qui avait ete valide.
  //   Donc : une archive datable a deja ete jugee (recouvrement + achevement) et ne
  //   repasse pas par ici ; et l'achevement vaut aussi pour une archive sans dates.
  var nom=String(sa.nom||'');
  var base=nom.replace(/\s*\d{4}.*$/,'').trim();
  var ym=nom.match(/\d{4}/); var year=ym?parseInt(ym[0],10):null;
  var best=null, bestY=-1;
  H.forEach(function(h){
    if(sa.debut){ var peN=_pilCmpPeriode(h&&h.saisonNom); if(peN && peN.debut) return; }
    if(_pilCmpAcheve(h)<_PIL_CMP_ACHEVE) return;
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
  // ★ MOTS-8 (§590) : le titre ne suit plus le bouton (il portait « · restante », « · réalisée »…) ; il garde son « i ».
  document.querySelectorAll('#pil-pie-seg button').forEach(function(b){ var on=b.getAttribute('data-m')===_PIL_STATE.pie; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on?'true':'false'); });
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
function _pilChip(txt,color){ return '<span style="display:inline-block;font-size:var(--pt-lbl,12px);font-weight:600;border:1px solid '+color+';color:'+color+';border-radius:10px;padding:2px 8px;margin:4px 4px 0 0">'+txt+'</span>'; }
function _pilDfr(s){ if(!s) return '—'; var p=String(s).split('-'); if(p.length<3) return String(s); var M=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']; return parseInt(p[2],10)+' '+(M[parseInt(p[1],10)-1]||''); }
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
// ── UNE IMPASSE QUI NE DIT PAS OU ALLER N'AIDE PERSONNE ─────────────────────
// Les impasses `pil-empty` ecrivaient « Réglages › Saisons » en TEXTE MORT : il
// fallait deviner l'ecran, le trouver, et se souvenir de ce qu'on venait y faire.
// Le moteur de diagnostic a deja une porte — _pilGo, avec defilement et
// clignotement. Ces messages passent par LA MEME, pas par une seconde.
// ⚠️ Le libelle nomme la section telle qu'elle s'appelle A L'ECRAN : la carte
//    s'intitule « Campagne » dans Réglages › Domaine, jamais « Saisons » — un nom
//    de code interne que l'utilisateur n'a jamais vu affiche nulle part.
function _pilEmptyGo(txt,cible,lib){
  return '<div class="pil-empty">'+txt
    +'<div style="margin-top:9px"><button class="pil-diag-go ghost" data-diag="'+_pilEsc(cible)
    +'">'+_pilEsc(lib)+' \u203A</button></div></div>';
}
// ════════════════════════════════════════════════════════════════════════════
// LA CARTE A TROIS ETAGES
// ════════════════════════════════════════════════════════════════════════════
// AVANT, la tuile mettait sur UNE ligne : la pastille de couleur, l'icone,
// l'etiquette, le chiffre et le chevron. Le chiffre — la seule chose qu'on
// vient chercher — tenait en 21 px au bout d'une ligne saturee, pendant que
// trois paragraphes d'explication en occupaient dix dans le corps.
//
// DESORMAIS, trois etages, toujours dans le meme ordre :
//   ① l'ETIQUETTE, en petites capitales, avec la pastille « i » et le chevron
//   ② LE CHIFFRE, en gros, seul sur sa ligne — une seule taille, une seule place
//   ③ LA LIGNE DE CADRE, un filet dore devant : la date, la source, le
//     perimetre. « semaine du 12 mai », « cuve de 2 000 L ».
//
// ⚠️⚠️ LES TROIS ETAGES SONT DANS `.pil-th`, DONC TOUJOURS VISIBLES.
//   C'est ce qui autorise a replier par defaut : on lit les sept chiffres d'un
//   onglet sans rien deplier. Le chevron ne cache que le DETAIL.
//   La ligne de cadre etait posee APRES l'en-tete : visible, mais decrochee du
//   chiffre et indentee de 54 px — on ne la rattachait pas a lui.
//
// ⚠️ CE QUI NE BOUGE PAS, ET POURQUOI : `.pil-tile`, `data-pid`, `.pil-th`,
//   `.pil-th-t`, `.pil-th-stat`, `.pil-tsub`, `.pil-tbody`, `#pil-body-<id>`.
//   La visite guidee vise `.pil-tile[data-pid="traitement"]` et C22 le verifie.
//   On change la GRAMMAIRE de l'en-tete, jamais les noms.
//
// ★ `infoCle` est un 9e argument OPTIONNEL : les 27 appels existants restent
//   valides tels quels et posent leur pastille au fur et a mesure que leur
//   fiche est ecrite.
// ⚠️ Le 2e argument `ico` a ete RETIRE : il n'etait plus lu depuis que
//   l'en-tete passe par `_pilIcoFor(id)`, et ne transportait que des emojis
//   morts. Un parametre qu'on ne lit plus finit par mentir.
function _pilTile(id,dot,title,statHtml,subHtml,gradPct,bodyHtml,infoCle){
  // Garde defensive : _PIL_STATE n'est pose que par renderPilotage. _pilShow() se
  // protegeait deja du cas null, _pilTile non — un appel hors sequence de rendu
  // levait un TypeError qui vidait tout l'onglet. Meme famille que les gardes
  // mortes du §25.15.e : celle-ci, elle, sert.
  var _st=_PIL_STATE||{};
  var open = !(_st.collapsed && _st.collapsed[id]);
  // La pastille « i » arrete le clic (ecouteur d'utils.js) : sans ca, ouvrir la
  // fiche replierait la carte qu'on cherche justement a comprendre.
  var info = infoCle ? _mvInfoBtn(infoCle) : '';
  return '<div class="pil-tile'+(open?' open':'')+'" data-pid="'+id+'">'
    + '<div class="pil-th">'
    +   '<div class="pil-th-l1"><span class="pil-dot" style="background:'+dot+'"></span>'
    +     '<span class="pil-th-ico">'+_pilIcoFor(id)+'</span>'
    +     '<span class="pil-th-t">'+_pilEsc(title)+'</span>'
    +     info+'<span class="pil-th-chev">▸</span></div>'
    +   (statHtml?('<div class="pil-th-l2">'+statHtml+'</div>'):'')
    +   (subHtml?('<div class="pil-tsub">'+_pilEsc(subHtml)+'</div>'):'')
    + '</div>'
    + (gradPct!=null?'<div class="pil-tgrad"><i style="left:calc('+Math.min(Math.max(gradPct,0),100)+'% - 1px)"></i></div>':'')
    + '<div class="pil-tbody" id="pil-body-'+id+'">'+(bodyHtml||'')+'</div>'
    + '</div>';
}
// ════════════════════════════════════════════════════════════════════════
// CARTE-1 (§217) — LES VUES DE LA CARTE
// La même carte, cinq lectures. Chaque vue prend ses chiffres là où ils vivent
// déjà, jamais dans un calcul de plus :
//   avc  : l'avancement (getPCls, la couleur d'avant) ;
//   phy  : jours depuis le dernier traitement du registre (TRAITEMENTS, toutes
//          campagnes : la protection ne s'arrête pas au 1er novembre) ;
//   cep  : le cépage de la fiche parcelle (p.cepage), une couleur par cépage ;
//   ift  : l'IFT de l'année, hors biocontrôle, par parcelle (_iftCalc, la règle de la
//          Conformité) face à la référence (_cfmIftRef) — IFT-1 (§571) ; c'étaient des passages ;
//   cout : le coût engagé à l'hectare (_pecData, la vue Parcelles de l'Économie).
// Une parcelle sans donnée reste grise : un vide n'est pas un zéro. Un IFT nul (aucun
// traitement de l'année), lui, est une mesure : il a sa couleur.
// ════════════════════════════════════════════════════════════════════════
var _PIL_LENT='avc';
var _PIL_LENTS=[['avc','Avancement'],['phy','Dernier traitement'],['cep','Cépage'],['ift','IFT'],['cout','Coût / ha']];
var _PIL_LENT_GRIS='#BDB6A8';
var _PIL_CEP_COL={'pinot noir':'#7A1020','chardonnay':'#D8BC72','aligote':'#A8B86A','gamay':'#7B4DB8','pinot gris':'#B07A8A','pinot blanc':'#E3D9A6'};
var _PIL_CEP_PAL=['#4A80C4','#C8853A','#3D8A8A','#8A5A38','#9C6BB0','#5B9B3A'];
// Normalisation : _friseNorm (la meme que la frise), sans accents ni casse.
function _pilLentMix(a,b,t){
  var A=a.match(/\w\w/g).map(function(h){ return parseInt(h,16); }), B=b.match(/\w\w/g).map(function(h){ return parseInt(h,16); });
  return '#'+A.map(function(v,i){ return Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0'); }).join('').toUpperCase();
}
function _pilLentRamp(t,stops){ t=Math.max(0,Math.min(1,t)); var n=stops.length-1, i=Math.min(n-1,Math.floor(t*n)); return _pilLentMix(stops[i],stops[i+1],t*n-i); }
// Tout ce qu'une vue lit, calculé UNE fois par rendu de la carte.
function _pilLentPrep(){
  var L=_PIL_LENT, o={lent:L};
  if(L==='phy'){
    var der={}; (window.TRAITEMENTS||[]).forEach(function(t){ var dd=String((t&&t.date)||'').slice(0,10); if(!dd) return;
      ((t&&t.parcelles)||[]).forEach(function(nom){ if(nom&&(!der[nom]||dd>der[nom])) der[nom]=dd; }); });
    var n=new Date(), auj=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(), j={};
    Object.keys(der).forEach(function(nom){ var t0=new Date(der[nom]+'T00:00:00').getTime(); if(isFinite(t0)) j[nom]=Math.max(0,Math.round((auj-t0)/86400000)); });
    o.j=j;
  } else if(L==='ift'){
    var R=_iftCalc(_iftAnnee()), ift={}; R.rows.forEach(function(q){ ift[q.nom]=q; });
    o.ift=ift; o.refIft=R.ref.v; o.an=R.an; o.ok=R.ok;
  } else if(L==='cep'){
    var cep={}, k=0;
    (window.PARCELLES||[]).forEach(function(p){ if(!p||p.statut==='Arrachee') return; var c=_friseNorm(p.cepage); if(!c||cep[c]) return; cep[c]={col:_PIL_CEP_COL[c]||_PIL_CEP_PAL[(k++)%_PIL_CEP_PAL.length], nom:String(p.cepage).trim()}; });
    o.cep=cep;
  } else if(L==='cout'){
    var E=_pecData(), c2={}, mn=null, mx=null;
    if(E&&E.configured){ (E.rows||[]).forEach(function(r){ if(!r||r.arr||!(r.surf>0)) return; var v=Number(r.engHa)||0; c2[r.nom]=v; mn=(mn==null||v<mn)?v:mn; mx=(mx==null||v>mx)?v:mx; }); }
    o.cout=c2; o.mn=mn; o.mx=mx; o.configured=!!(E&&E.configured);
  }
  return o;
}
// La couleur et le texte d'une parcelle dans la vue courante ; null = pas de donnée (gris).
function _pilLentCol(p,o){
  if(!p) return null;
  if(o.lent==='phy'){ var j=o.j[p.nom]; if(j==null) return null; return {col:_pilLentRamp(j/14,['3D6B27','C2A14D','A0291E']), txt:(j===0?'traitée aujourd’hui':('dernier traitement il y a '+j+' j'))}; }
  if(o.lent==='ift'){
    var q=o.ok?o.ift[p.nom]:null; if(!q) return null;   // catalogue E-Phy absent, ou vigne arrachée : pas de donnée
    var r=o.refIft>0?q.hb/o.refIft:0;
    var col=r>1.25?'#A0291E':(r>1?'#B85A1A':_pilLentRamp(r,['DDEBD2','3D6B27']));
    return {col:col, txt:'IFT '+o.an+' : '+_iftF(q.hb)+' hors biocontrôle'+(q.bio>0?' (+ '+_iftF(q.bio)+' en biocontrôle)':'')+' · référence '+_iftF(o.refIft)};
  }
  if(o.lent==='cep'){ var c=o.cep[_friseNorm(p.cepage)]; return c?{col:c.col, txt:c.nom}:null; }
  if(o.lent==='cout'){
    var v=o.cout[p.nom]; if(v==null) return null;
    var t=(o.mx>o.mn)?(v-o.mn)/(o.mx-o.mn):0;
    return {col:_pilLentRamp(t,['EAF3E2','C2A14D','8A5A38']), txt:_ecoEur(v)+' engagés à l’hectare'};
  }
  var cl=(typeof window.getPCls==='function')?window.getPCls(p):null;
  return cl?{col:cl.col, txt:(cl.pct||0)+' %'}:null;
}
function _pilLentBtns(){
  return '<div class="pil-lent" role="group" aria-label="Vue de la carte">'+_PIL_LENTS.map(function(l){
    return '<button type="button" class="pil-lent-b'+(_PIL_LENT===l[0]?' on':'')+'" data-lent="'+l[0]+'" aria-pressed="'+(_PIL_LENT===l[0]?'true':'false')+'">'+_pilEsc(l[1])+'</button>';
  }).join('')+'</div>';
}
function _pilLentLeg(o){
  var sw=function(c,t){ return '<span class="pil-lent-sw"><i style="background:'+c+'"></i>'+t+'</span>'; };
  var gr=function(stops,a,b,c){ return '<span>'+a+'</span><span class="pil-map-bar" style="background:linear-gradient(90deg,'+stops.map(function(s){ return '#'+s; }).join(',')+')"></span><span>'+b+'</span>'+(c?('<span>'+c+'</span>'):''); };
  var H='';
  if(o.lent==='phy') H=gr(['3D6B27','C2A14D','A0291E'],'0 j','14 j et plus','· jours depuis le dernier traitement');
  else if(o.lent==='ift') H=o.ok?(sw('#DDEBD2','0')+sw('#3D6B27','jusqu’à la référence ('+_iftF(o.refIft)+')')+sw('#B85A1A','au-dessus')+sw('#A0291E','plus de 25 % au-dessus')+'<span>· IFT '+o.an+', hors biocontrôle</span>'):'<span>catalogue E-Phy pas chargé : l’IFT attend les doses homologuées</span>';
  else if(o.lent==='cep'){ var ks=Object.keys(o.cep); H=ks.length?ks.map(function(k){ return sw(o.cep[k].col,_pilEsc(o.cep[k].nom)); }).join(''):'<span>aucun cépage renseigné sur les fiches</span>'; }
  else if(o.lent==='cout') H=(o.mn!=null)?gr(['EAF3E2','C2A14D','8A5A38'],_ecoEur(o.mn),_ecoEur(o.mx),'· engagé à l’hectare'):('<span>'+(o.configured?'aucun coût engagé sur la période':'taux horaires à renseigner (Réglages › Équipe)')+'</span>');
  else H='<span>0 %</span><span class="pil-map-bar"></span><span>100 %</span>';
  if(o.lent!=='avc') H+=sw(_PIL_LENT_GRIS,'sans donnée');
  return H;
}
var _PIL_LENT_PREP=null;
function _pilPanelCarte(d){
  var ha=(Math.round((Number(d.surfTot)||0)*100)/100).toFixed(2).replace('.',',');   // SURF-1 (03/10) : un total au centième, jamais arrondi à l'hectare
  // CARTE-1 (§217) : le choix de la vue au-dessus, sa legende en dessous ; la carte lit la meme preparation.
  _PIL_LENT_PREP=_pilLentPrep();
  // ★★ MOTS-8 (§590) — replié : le nombre de parcelles, la surface et la vue choisie (l'avancement était le troisième « 16 % »
  //   de l'écran). Ouvert : les cinq vues, la carte, sa légende, « Ouvrir la carte » (la carte de la Vigne).
  var _lent=(_PIL_LENTS.filter(function(l){ return l[0]===_PIL_LENT; })[0]||_PIL_LENTS[0])[1];
  var _lentM=(_PIL_LENT==='ift')?'l\u2019IFT':(_PIL_LENT==='cout'?'co\u00fbt \u00e0 l\u2019hectare':_lent.toLowerCase());
  var body='<div class="pil-tv-fh"><span>Colorer par</span>'+_mvInfoBtn('pil.carte')+'</div>'
    +_pilLentBtns()+'<div class="pil-map" id="pil-map"></div>'
    + '<div class="pil-map-leg">'+_pilLentLeg(_PIL_LENT_PREP)
    + '<span style="display:flex;align-items:center;gap:6px"><span class="pil-map-sw" style="background:rgba(192,57,43,.5);border-color:#C0392B"></span>Arrach\u00e9e</span>'
    + '<button type="button" class="pil-names-btn">'+(_pilNamesOn?(_mvIcon('etiquette',16)+' Noms '+_mvIcon('check',16)):(_mvIcon('etiquette',16)+' Noms'))+'</button></div>'
    + '<div class="pil-tv-act">'+_pilTvBtn('carte','Ouvrir la carte')+'</div>';
  var nP=d.nActives||0;
  return _pilTile('carte','#7FA83A','Carte du domaine', _pilStat(nP,' parcelle'+(nP>1?'s':''),null), ha+' ha \u00b7 color\u00e9es par '+_lentM, null, body);
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
  var _lo=(_PIL_LENT_PREP&&_PIL_LENT_PREP.lent===_PIL_LENT)?_PIL_LENT_PREP:_pilLentPrep();   // CARTE-1 (§217)
  var _gris=(_lo.lent==='avc')?'#888888':_PIL_LENT_GRIS;
  try{
    _pilMap=window.L.map(el,{zoomControl:true,attributionControl:false,zoomSnap:0,zoomDelta:0.5}).setView([47.205,4.972],12);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(_pilMap);
    var bounds=[];
    src.forEach(function(k){
      if(!k||!k.pts||!k.pts.length) return;
      var p=P.find(function(x){ return x.nom && k.name && x.nom.toLowerCase()===k.name.toLowerCase(); });
      var arr = p && /arrach/i.test(p.statut||'');
      var lc = (p && !arr) ? _pilLentCol(p,_lo) : null;
      var col = arr ? '#C0392B' : (lc?lc.col:_gris);
      var op  = arr ? 0.5 : 0.62;
      // remplissage clair + halo de contour coloré épais (visibilité à petit zoom)
      window.L.polygon(k.pts,{color:'#fff',weight:0.5,fillColor:col,fillOpacity:op}).addTo(_pilMap);
      window.L.polygon(k.pts,{color:col,weight:2.4,fill:false,opacity:0.95}).addTo(_pilMap);
      // point + nom au barycentre (comme l'onglet carte de Parcelles)
      var ctr=k.pts.reduce(function(a,b){ return [a[0]+b[0],a[1]+b[1]]; },[0,0]);
      var ctrLL=[ctr[0]/k.pts.length, ctr[1]/k.pts.length];
      var mk=window.L.circleMarker(ctrLL,{radius:3.5,fillColor:col,color:'#fff',weight:1.4,fillOpacity:1})
        .addTo(_pilMap)
        .bindPopup(p?('<b>'+_pilEsc(p.nom)+'</b><br>'+(p.surface||0)+' ha · '+(arr?'arrachée':(lc?_pilEsc(lc.txt):'sans donnée'))):('<b>'+_pilEsc(k.name)+'</b>'));
      var tt=window.L.tooltip({permanent:true,direction:'right',offset:[5,0],className:'pil-plabel'}).setContent(p?p.nom:k.name).setLatLng(ctrLL);
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
        var lc=_pilLentCol(p,_lo);
        var col=lc?lc.col:_gris;
        if(_ok(la,ln)){
          window.L.circleMarker([la,ln],{radius:3.5,fillColor:col,color:'#fff',weight:1.4,fillOpacity:1})
            .addTo(_pilMap)
            .bindPopup('<b>'+_pilEsc(p.nom)+'</b><br>'+(p.surface||0)+' ha · '+(lc?_pilEsc(lc.txt):'sans donnée'));
          bounds.push([la,ln]);
        } else if(p.commune && _ok(parseFloat(p.commune.lat),parseFloat(p.commune.lng))){
          var key=String(p.commune.nom||'').toLowerCase().trim();
          if(!_cg[key]) _cg[key]={nom:p.commune.nom,lat:parseFloat(p.commune.lat),lng:parseFloat(p.commune.lng),parc:[]};
          _cg[key].parc.push(p);
        }
      });
      Object.keys(_cg).forEach(function(key){
        var g=_cg[key], n=g.parc.length;
        var liste=g.parc.map(function(pp){var c=_pilLentCol(pp,_lo);return '<b>'+_pilEsc(pp.nom)+'</b> · '+(pp.surface||0)+' ha · '+(c?_pilEsc(c.txt):'sans donnée');}).join('<br>');
        var ic=window.L.divIcon({className:'',iconSize:[24,24],iconAnchor:[12,12],html:'<div style="width:24px;height:24px;border-radius:50%;background:#C9A84C;color:#1C1813;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font:600 12px/1 system-ui,sans-serif;">'+n+'</div>'});
        window.L.marker([g.lat,g.lng],{icon:ic}).addTo(_pilMap)
          .bindPopup('<b>'+String.fromCodePoint(0x1F4CD)+' '+_pilEsc(g.nom)+'</b><br><span style="color:var(--texte-doux,#888);font-size:var(--pt-txt,13px);">'+n+' parcelle'+(n>1?'s':'')+' · commune</span><br>'+liste);
        bounds.push([g.lat,g.lng]);
      });
    })();
    // ★ CIBLE-1 (§163) — l'anneau sur la priorité du moment : commencée, sinon la prochaine.
    var _cib=window._mvCibleCarte(window._mvTachePrio());
    if(_cib) _cib.ps.forEach(function(_cp){ var _cg=window._mvParcGeo(_cp); if(_cg) window._mvCibleAnneau(_pilMap,_cg); });
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
    if(m.bureau) role = (role?role+' · ':'')+'bureau';
    if(_mvEC(m)){
      var _n=_mvED(m);
      role = 'équipe · '+_n+' personne'+(_n>1?'s':'');
      return _pilLi('', '#8A5A38', m.nom||'—', role, null);
    }
    return _pilLi((m.nom||'?').charAt(0).toUpperCase(), c, m.nom||'—', role, null);
  }).join('') || '<div class="pil-empty">Aucun membre actif</div>';
  // ★ LE SOUS-TITRE PORTAIT TROIS CHOSES DE NATURES DIFFERENTES, a la file :
  //   la composition (cadre), « hors capacite vigne » (methode), et « fiches a
  //   passer en Inactif » (une action a executer de memoire). Chacune part ou
  //   elle doit : la ligne de cadre, la fiche « i », un bouton.
  var _sub=[];
  if(_nColl>0) _sub.push(_nColl+' équipe'+(_nColl>1?'s':'')+' collective'+(_nColl>1?'s':'')+' de '+(_nPers-(d.membres.length-_nColl))+' pers.');
  if(nB>0) _sub.push(nB+' au bureau');
  var _nF=d.nFinis||0;
  // ③ « a passer en Inactif » n'est plus une phrase a retenir : c'est un bouton.
  if(_nF>0) rows+=_pilEmptyGo(_nF+' contrat'+(_nF>1?'s terminés':' terminé')+' : '+(_nF>1?'ces fiches restent':'cette fiche reste')+' à passer en Inactif.','equipe','Réglages \u203a Équipe');
  return _pilTile('equipe','#5B9B3A','Équipe',
    _pilStat(_nColl>0?_nPers:d.membres.length, '', null),   // MOTS-9 (§592) : « Équipe 4 » — « actifs » est hors du lexique
    _sub.join(' \u00b7 '),   // MOTS-9 (§592) : « au 27 oct. » partait chaque jour — c'est aujourd'hui
    null, '<div class="pil-ip-list">'+rows+'</div><div class="pil-tv-act">'+_pilTvBtn('equipe','Ouvrir l\u2019\u00e9quipe')+'</div>', 'pil.equipe');
}
function _pilPanelTracteur(d){
  var s=_PIL_STATE.sub||{};
  var rows = (d.tracs||[]).map(function(t){
    var sub='';
    if(s.trac_revision){
      if(t.revReste!=null){ var col=t.revReste<=50?'var(--rouge)':t.revReste<=120?'var(--orange)':'var(--vert-med)';
        sub += '<div class="pil-li-s" style="color:'+col+';font-weight:600">'+(t.revReste<0?'Révision dépassée de '+_pilNum(-t.revReste):'Révision dans '+_pilNum(t.revReste))+' h'+(t.revDate?(t.revJours<0?' \u00b7 date dépassée':' \u00b7 ou le '+((typeof window!=='undefined'&&window._trDateAn)?window._trDateAn(t.revDate):t.revDate)):'')+'</div>';   // ★ COMPT-1 (§483) : plus de « dans −n h »
      } else if(t.revDate){ sub += '<div class="pil-li-s" style="color:'+(t.revJours<0?'var(--rouge)':t.revJours<=30?'var(--orange)':'var(--vert-med)')+';font-weight:600">'+(t.revJours<0?'Révision : date dépassée':'Révision le '+((typeof window!=='undefined'&&window._trDateAn)?window._trDateAn(t.revDate):t.revDate))+'</div>'; } else { sub += '<div class="pil-li-s" style="opacity:.6">Révision : à renseigner</div>'; }
    }
    if(s.trac_controle){ sub += '<div class="pil-li-s">Dernier contrôle : '+(t.lastCtrl?_pilDfr(t.lastCtrl):'jamais')+'</div>'; }
    if(s.trac_intercep && t.sess && t.sAdv<100){ var isI=/intercep/i.test(t.sess.activite||''); sub += '<div class="pil-li-s" style="color:var(--acier-med)">'+(isI?'✂️':'🚜')+' '+_pilEsc(t.sess.activite||'Session')+' · '+t.sAdv+' %</div>'; }
    var chips='';
    if(s.trac_repar && t.rep){ chips += _pilChip(_pilEsc(t.rep.motif||'Réparation')+(t.rep.prevu_retour?' · retour '+_pilDfr(t.rep.prevu_retour):''),'var(--rouge)'); }
    return '<div class="pil-li"><span class="pil-av" style="background:#16313F;color:#4A9FC8">'+_mvIcon('tracteur',16)+'</span><div class="pil-li-main"><div class="pil-li-t">'+_pilEsc(t.nom||'Tracteur')+(t.traitementOnly?' <span style="font-size:var(--pt-nano,11px);color:var(--orange)">· pulvé</span>':'')+'</div>'+sub+chips+'</div></div>';
  }).join('') || '<div class="pil-empty">Aucun tracteur</div>';
  var n=(d.tracs||[]).length;
  // ① Le cadre remonte l'echeance la plus proche : c'est la seule chose qu'on
  //   vient verifier sans deplier. Il fallait ouvrir la carte pour la voir.
  var _pr=null;
  (d.tracs||[]).forEach(function(t){ if(t.revReste!=null && (_pr===null || t.revReste<_pr.revReste)) _pr=t; });
  var _cad = _pr ? ((_pr.revReste<0?'révision dépassée de '+_pilNum(-_pr.revReste):'révision dans '+_pilNum(_pr.revReste))+' h \u00b7 '+_pilEsc(_pilTnom(_pr.nom||'')))
                 : 'aucune échéance de révision renseignée';
  // ★ MOTS-9 (§592) : « Tracteurs », et un bouton vers l'entretien (Tracteur › Entretien), là où l'on agit.
  return _pilTile('tracteur','#4A9FC8','Tracteurs', _pilStat(n,'', d.nRepar?('🔧 '+d.nRepar):null), _cad, null,
    '<div class="pil-ip-list">'+rows+'</div><div class="pil-tv-act">'+_pilTvBtn('entretien','Ouvrir l\u2019entretien')+'</div>', 'pil.tracteur');
}
function _pilPanelPresences(d){
  var s=_PIL_STATE.sub||{};
  // ★ « au champ » compte hors bureau — les MEMES nombres que la carte « A la vigne
  //   aujourd'hui » du cockpit (presentFiches / nVchamp). La tuile disait « 5/6
  //   presents au champ » avec deux administratifs dedans, pendant que le cockpit
  //   disait 3 sur 4 : deux comptages du meme matin, a un onglet d'ecart.
  var list=(d.presences||[]).filter(function(p){ if(p.bureau) return false; if(p.etat==='cp')return s.pres_cp; if(p.etat==='recup')return s.pres_recup; if(p.etat==='maladie'||p.etat==='absent')return s.pres_mal; return false; });
  var rows=list.map(function(p){
    var c=(window.COULEURS_MBR&&window.COULEURS_MBR[p.nom])||'#3D6B27', lab, col;
    if(p.etat==='cp'){ lab='Congé payé'; col='var(--orange)'; }
    else if(p.etat==='recup'){ lab='Récup'; col='#7B6DB8'; }
    else if(p.etat==='maladie'){ lab='Maladie'; col='var(--rouge)'; }
    else { lab=(p.motif||'Absent'); col='var(--rouge)'; }
    return '<div class="pil-li"><span class="pil-av" style="background:'+c+'">'+_pilEsc((p.nom||'?').charAt(0).toUpperCase())+'</span><div class="pil-li-main"><div class="pil-li-t">'+_pilEsc(p.nom||'—')+'</div><div class="pil-li-s" style="color:'+col+';font-weight:600">'+_pilEsc(lab)+'</div></div></div>';
  }).join('');   // MOTS-9 (§592) : personne d'absent — la pastille « au complet » le dit ; « Toute l'équipe est présente » partait en double
  // ① Le cadre dit CE QUI EST COMPTE et QUAND — sans ca, « 6/12 » se compare a
  //   tort au pic ou a la moyenne, qui portent sur d'autres fenetres.
  // ★ MOTS-9 (§592) : « 4/4 présents » et une pastille (au complet, ou combien manquent) ; « au champ, aujourd'hui · hors bureau »
  //   dit ce qui est compté : c'est dans le « i » (pil.presences), pas sous chaque chiffre.
  var _pN=(d.presentFiches!=null?d.presentFiches:(d.nPresent||0)), _vN=(d.nVchamp!=null?d.nVchamp:((d.membres||[]).length)), _man=Math.max(0,_vN-_pN);
  return _pilTile('presences','#C9A84C','Présents',   // MOTS-9 (§592) : le mot du lexique (§580c)
    (d.jourTravaille===false)?_pilStat('\u2014','',null):(_pilStat(_pN+'/'+_vN,'',null)+(_man?_pilPhPl(_man+' absent'+(_man>1?'s':''),'or'):_pilPhPl('au complet','ok'))),
    (d.jourTravaille===false)?'pas de travail prévu aujourd\u2019hui au planning':'',
    null, (rows?'<div class="pil-ip-list">'+rows+'</div>':'')+'<div class="pil-tv-act">'+_pilTvBtn('planning','Ouvrir le planning')+'</div>', 'pil.presences');
}
function _pilPanelPhyto(d){
  var rows = d.traits.slice(0,6).map(function(t){
    var nom = t.produit || t.nom || t.produitNom || 'Intervention';
    return _pilLi('','#142838', nom, t.date||'', null, '#5A9FD4');
  }).join('');
  // ★ LA DERNIERE LIGNE REDISAIT LE CHIFFRE DE L'EN-TETE. « 18 interventions
  //   enregistrees » sous un en-tete qui affiche deja « 18 interv. » n'apprend
  //   rien ; « Catalogue E-Phy a jour » n'est pas une donnee de cette carte.
  //   Elles disparaissent, le cadre prend le relais.
  var _der=(d.traits[0]&&d.traits[0].date)||null;
  // ★★ REG27-1B (§573) — « LE REGISTRE <ANNÉE> » : LE CONTRÔLE AVANT LE CONTRÔLEUR (maquette « niveau au-dessus », partie 5).
  //   La carte ne liste plus seulement les derniers passages : elle relit le registre de l'année civile ligne par ligne
  //   (registre.js, window._regCarte — les lignes mêmes du fichier d'export) et dit ce qui manque avant d'exporter. Les
  //   derniers passages restent, derrière un dépliant. Même case (`mat_phyto`), même fiche « i ». Sans registre.js : l'ancienne.
  var G=(typeof window._regCarte==='function')?window._regCarte():null;
  if(G){
    var V=G.V, _av=_cfmRegPoint(V);   // COHER-1 (§581) : la mention que compte la tuile d'Aujourd'hui
    var _liste=d.traits.length?('<details style="margin-top:12px"><summary style="cursor:pointer;font-size:var(--pt-micro,12px);color:var(--texte-doux)">Les derni\u00e8res interventions</summary><div class="pil-ip-list" style="margin-top:8px">'+rows+'</div></details>'):'';
    return _pilTile('phyto','#5A9FD4','Le registre '+G.an, _pilStat(V.nLignes,' ligne'+(V.nLignes>1?'s':''),_av),
      V.nLignes?(V.nTrait+' traitement'+(V.nTrait>1?'s':'')+' \u00b7 au format du registre \u00e9lectronique'):('aucun traitement en '+G.an),
      null, G.corps+_liste, 'pil.phyto');
  }
  return _pilTile('phyto','#5A9FD4','Registre phyto', _pilStat(d.traits.length,' interv.',null),
    _der?('dernière le '+_pilDfr(_der)+' \u00b7 catalogue E-Phy'):'aucune intervention enregistrée',
    null, '<div class="pil-ip-list">'+rows+'</div>', 'pil.phyto');
}

// ── Échéances par tâche (jours ouvrés de travail + fin de saison) ─────
// Lecture seule. Réutilise calcHeures (h_reste/tâche) + _planTeamCadence (cadence réelle équipe).
// KIT-3 (§228) : la journée d'une personne selon le MODÈLE du planning — moyenne des jours travaillés (capacité > 0)
//   sur les 28 prochains jours de la période consultée (ou ses 28 premiers, si elle n'a pas commencé). 0 si rien.
function _pilJourModele(){
  try{
    var cd=(typeof _rfCd==='function')?_rfCd():null; if(!cd||!cd.capCum||cd.spanS==null) return 0;
    var t=new Date(), o=Math.round((Date.UTC(t.getFullYear(),t.getMonth(),t.getDate())-Date.UTC(2026,0,1))/86400000);
    var C=cd.capCum, i0=Math.max(0,o-cd.spanS), s=0, n=0;
    for(var k=i0;k<Math.min(C.length-1,i0+28);k++){ var h=C[k+1]-C[k]; if(h>0){ s+=h; n++; } }
    return n?(s/n):0;
  }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilJourModele'); return 0; }
}
function _pilEchCadence(d){
  var cad=null;
  if(typeof window._planTeamCadence==='function'){
    try{ var _t=new Date(), _f=new Date(); _f.setDate(_f.getDate()-28); cad=window._planTeamCadence(_f,_t); }catch(e){ cad=null; }
  }
  var cadH=(cad && cad.cadence>0)?cad.cadence:0, estim=false;
  // ★ Le repli pese l'effectif collectif (une equipe de 30 n'est pas une fiche) et
  //   lit la journee reglee du domaine, pas 7 ecrit en dur.
  // KIT-3 (§228) — Nico : « compter les heures prévues au planning ». Le repli lit d'abord la journée du MODÈLE
  //   (moyenne des 28 prochains jours travaillés d'une personne, capCum de _chargeSaisonData) ; la journée réglée
  //   (h_jour, 7 h par défaut) ne sert plus que si le planning ne dit rien.
  var hJ=((typeof _pilJourModele==='function')?_pilJourModele():0)||_pecHJour();
  var nV=(d.membres||[]).reduce(function(a,m){
    return a + ((m&&!m.bureau)?((typeof window._mvEffDef==='function')?window._mvEffDef(m):1):0);
  },0);
  if(!cadH){ if(nV>0){ cadH=hJ*nV; estim=true; } }
  // hPers : heures de travail par PERSONNE et par jour, MESUREES au planning (28 j).
  // C'est la seule « journee » que le simulateur a le droit de diviser : cadH/nV
  // melangeait 28 jours de presence avec l'effectif d'aujourd'hui.
  var hPers=(cad && cad.hPers>0)?cad.hPers:hJ;
  return { cadH:cadH, estim:estim, hPers:hPers, nPers:nV };
}
// ════════════════════════════════════════════════════════════════════════
// PHOTO-1 (§219) — LA PHOTO QUOTIDIENNE DES CHIFFRES DU COCKPIT
// Le Pilotage recalcule la charge restante et le budget consomme a chaque
// ouverture, et ne garde pas la veille : aucune petite courbe possible (§214a).
// Decide avec Nico (03/10) : chaque jour, a la premiere ouverture d'Aujourd'hui par
// un ADMINISTRATEUR, sur la PERIODE ACTIVE, une ligne {d, reste, cons, avc} est
// ecrite dans CONFIG.photo (la configuration du domaine : deja ecrite par
// l'admin, aucune regle Firestore nouvelle), 60 lignes au plus. Jamais reecrite
// le meme jour, jamais retroactive : les courbes se remplissent en 14 jours.
// Un jour sans ouverture est un trou (null), pas un zero. Le point du jour est
// toujours la valeur en direct, photo ou pas.
// ════════════════════════════════════════════════════════════════════════
var _PIL_PHOTO_MAX=60;
function _pilPhotoListe(){ var c=window.CONFIG; return (c&&Array.isArray(c.photo))?c.photo:[]; }
function _pilPhotoIso(dt){ return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0'); }
// Ecrit la photo du jour si elle manque. Rend true si une ecriture est partie.
function _pilPhotoEcrire(d){
  if(!d||typeof window.isAdmin!=='function'||!window.isAdmin()||typeof window.saveData!=='function') return false;
  // ★★ AUJ-6 (§308) : JAMAIS avant l'arrivée des données. L'admin atterrit sur Aujourd'hui AVANT la fin de la lecture (goHub
  //   passe avant _fbLoadAfterAuth) : la photo notait la copie incomplète du téléphone — souvent 0 h, les traits verticaux de
  //   la courbe (Nico, 10/10) — et ENREGISTRAIT toute la configuration du domaine avant d'avoir lu celle du serveur : un
  //   réglage changé depuis un autre appareil pouvait être écrasé. Rien de prévu dans la période : rien à photographier.
  if(!window._dataReady||!(Number(d.totalTotal)>0)||!isFinite(Number(d.totalReste))) return false;
  var sa=(typeof window.getSaisonActive==='function')?window.getSaisonActive():null, sp=_pilSaison();
  if(!sa||!sp||sa.nom!==sp.nom) return false;   // une archive consultee ne photographie rien
  var auj=_pilPhotoIso(new Date()), L=_pilPhotoListe();
  if(L.some(function(x){ return x&&x.d===auj; })) return false;
  var ph={d:auj, reste:Math.round(Number(d.totalReste)||0), p:String(sp.nom||'')};   // AUJ-5 (§307) : la période de la photo
  var E=_pecData();
  if(E&&E.configured){ ph.cons=Math.round((Number(E.cons)||0)*10)/10; ph.avc=Math.round((Number(E.avc)||0)*10)/10; }
  var N=L.filter(function(x){ return x&&typeof x.d==='string'&&x.d<auj; }).concat([ph]);
  N.sort(function(a,b){ return a.d<b.d?-1:(a.d>b.d?1:0); });
  if(N.length>_PIL_PHOTO_MAX) N=N.slice(N.length-_PIL_PHOTO_MAX);
  window.CONFIG=window.CONFIG||{}; window.CONFIG.photo=N;
  window.saveData('config');
  return true;
}
function _friseNorm(s){ return String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
// ⚠️ `memeSaison` : d.data (calcHeures) ne connait que la periode CONSULTEE. Sur
//    une campagne zoomee qui n'est pas elle, un pourcentage emprunte declarerait
//    « termine » une tache d'apres l'avancement d'une AUTRE campagne. Sans lui, on
//    tranche sur ce que le journal sait vraiment : une campagne dont la fin est
//    passee est close, une campagne en cours ne l'est pas.
//    Appel sans 3e argument = comportement strictement inchange.
function _pilTaskReal(cd,d,memeSaison){
  var J=(window.JOURNAL||[]); var out={};
  var dlo=cd.debut, dhi=cd.fin;
  var _ok=(memeSaison===undefined)?true:!!memeSaison;
  var _auj=(typeof window._mvAujIso==='function')?window._mvAujIso():'';
  var _close=(!!_auj && dhi<_auj);
  var pct={}; if(_ok) ((d&&d.data)||[]).forEach(function(t){ pct[_friseNorm(t.nom)]=(t.pct||0); });
  (cd.taskWindows||[]).forEach(function(t){
    var k=_friseNorm(t.nom), mn=null, mx=null;
    for(var i=0;i<J.length;i++){ var j=J[i];
      if(!j||j.meteo||j.statut!=='Valid\u00e9')continue;
      if(_friseNorm(j.tache)!==k)continue;
      var dt=j.date; if(!dt||dt<dlo||dt>dhi)continue;
      if(mn==null||dt<mn)mn=dt; if(mx==null||dt>mx)mx=dt;
    }
    if(mn==null){ out[k]={state:'none'}; }
    else { var done=_ok?((pct[k]||0)>=99.5):_close; out[k]={start:mn,end:done?mx:null,state:done?'done':'live'}; }
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
           todayIso:((typeof window._mvAujIso==='function')?window._mvAujIso():_mvToday()),
           X:function(ord){ return padL+(ord-s)/L*plotW; } };
}
function _pilFriseSvg(cd,real,w){
  var tw=cd.taskWindows||[];
  if(!tw.length) return window._mvGraphVide('Aucune fen\u00eatre de travail sur la p\u00e9riode',
    'Les fen\u00eatres se posent dans la roue crant\u00e9e du Pilotage.');
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
    g+='<text x="'+((x0+x1)/2).toFixed(1)+'" y="22" text-anchor="middle" font-size="'+gc.txt.mini+'" font-weight="600" fill="'+gc.col.texte+'" font-family="var(--font-ui,Outfit)">'+MN[mo.m]+'</text>';
    g+='<line x1="'+x0.toFixed(1)+'" y1="'+padT+'" x2="'+x0.toFixed(1)+'" y2="'+(padT+tw.length*rowH)+'" stroke="'+gc.col.grille+'" stroke-width="1"/>';
  });
  g+='<line x1="'+X(e+1).toFixed(1)+'" y1="'+padT+'" x2="'+X(e+1).toFixed(1)+'" y2="'+(padT+tw.length*rowH)+'" stroke="'+gc.col.grille+'"/>';
  tw.forEach(function(t,i){
    var yC=padT+i*rowH, yP=yC+8, hP=_PIL_GB.h, yR=yC+30, hR=_PIL_GB.h2;
    var px0=X(_o(t.start)), px1=X(_o(t.end)+1), c=_taskColor(t.nom);
    g+='<text x="'+(padL-10)+'" y="'+(yC+rowH/2)+'" text-anchor="end" font-size="'+gc.txt.axe+'" font-weight="600" fill="var(--texte)" font-family="var(--font-ui,Outfit)">'+_pilEsc(t.nom)+'</text>';
    g+='<rect x="'+px0.toFixed(1)+'" y="'+yP+'" width="'+Math.max(2,px1-px0).toFixed(1)+'" height="'+hP+'" rx="'+_PIL_GB.r+'" fill="'+c+'" opacity="0.92"/>';
    g+='<text x="'+(px0+6).toFixed(1)+'" y="'+(yP+12)+'" font-size="'+gc.txt.mini+'" fill="#fff" font-family="var(--font-ui,Outfit)" font-weight="600">'+Math.round(t.h)+' h</text>';
    var r=(real&&real[_friseNorm(t.nom)])||{state:'none'};
    if(r.state==='none'||!r.start){ g+='<text x="'+px0.toFixed(1)+'" y="'+(yR+9)+'" font-size="'+gc.txt.mini+'" fill="'+gc.col.texte+'" font-family="var(--font-ui,Outfit)" font-style="italic">non d\u00e9marr\u00e9</text>'; }
    else {
      var ro0=Math.max(s,Math.min(e,_o(r.start)));
      var ro1=Math.max(s,Math.min(e,_o(r.state==='live'?TODAY:r.end)));
      var rx0=X(ro0), rx1=X(ro1+1);
      var fill=r.state==='live'?gc.col.attention:'url(#pilhatch)';
      var stroke=r.state==='live'?gc.col.attention:'var(--texte)';
      g+='<rect x="'+rx0.toFixed(1)+'" y="'+yR+'" width="'+Math.max(2,rx1-rx0).toFixed(1)+'" height="'+hR+'" rx="'+_PIL_GB.r+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1"/>';
      if(r.state==='live') g+='<text x="'+(rx1+4).toFixed(1)+'" y="'+(yR+9)+'" font-size="'+gc.txt.mini+'" fill="'+gc.col.attention+'" font-family="var(--font-ui,Outfit)" font-weight="600">en cours</text>';
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
  var W=E.W,padL=E.padL,padR=E.padR,padT=16,padB=46;
  var H=(W<760)?300:(W<1000?330:370), plotW=E.plotW, plotH=H-padT-padB;
  var maxNeed=4; wk.forEach(function(w){ if(w.need>maxNeed)maxNeed=w.need; if((w.head||0)>maxNeed)maxNeed=w.head; });
  // ⚠️⚠️ L'AXE AVANÇAIT DE 1 EN 1, QUEL QUE SOIT LE PIC.
  //   yTop=Math.ceil(maxNeed+0.5) puis une graduation par unite : sur une
  //   vendange a 36,6 personnes, 38 lignes et 38 etiquettes dans 238 px de haut,
  //   soit une etiquette tous les 6 px. L'axe devenait un pate noir et le
  //   graphe illisible — le defaut etait deja regle sur la frise annuelle, qui
  //   porte un pas adaptatif depuis la v6.00, mais pas ici.
  //   Meme echelle de pas que la frise : un module, une façon de graduer.
  var step=maxNeed>60?20:(maxNeed>30?10:(maxNeed>12?5:(maxNeed>5?2:1)));
  var yTop=Math.ceil(maxNeed/step)*step;
  if(yTop<=maxNeed+0.001) yTop+=step;          // le pic ne touche jamais le plafond
  if(!(yTop>0)) yTop=step;
  function Y(v){ return padT+plotH-(v/yTop)*plotH; }
  var MN=['JANV','F\u00c9VR','MARS','AVR','MAI','JUIN','JUIL','AO\u00dbT','SEPT','OCT','NOV','D\u00c9C'];
  var _moO0=E.moO0, _moO1=E.moO1;
  var months=(cd.months||[]);
  var g='';
  for(var v=0;v<=yTop;v+=step){ g+='<line x1="'+padL+'" y1="'+Y(v).toFixed(1)+'" x2="'+(W-padR)+'" y2="'+Y(v).toFixed(1)+'" stroke="'+c.col.grille+'" stroke-width="1"/><text x="'+(padL-8)+'" y="'+(Y(v)+4).toFixed(1)+'" text-anchor="end" font-size="'+c.txt.mini+'" fill="'+c.col.texte+'" font-family="var(--font-ui,Outfit)">'+v+'</text>'; }
  months.forEach(function(mo){ var x0=X(Math.max(s,_moO0(mo))); g+='<line x1="'+x0.toFixed(1)+'" y1="'+padT+'" x2="'+x0.toFixed(1)+'" y2="'+(padT+plotH)+'" stroke="'+c.col.grille+'" stroke-width="1"/>'; var xc=(X(Math.max(s,_moO0(mo)))+X(Math.min(e,_moO1(mo))+1))/2; g+='<text x="'+xc.toFixed(1)+'" y="'+(H-22)+'" text-anchor="middle" font-size="'+c.txt.mini+'" font-weight="600" fill="'+c.col.texte+'" font-family="var(--font-ui,Outfit)">'+MN[mo.m]+'</text>'; });
  wk.forEach(function(w){ if(w.cap<=0)return; var bx=X(w.o0)+2, bw=X(w.o1+1)-X(w.o0)-4; var over=w.need>((w.head||0)+0.001); g+='<rect x="'+bx.toFixed(1)+'" y="'+Y(w.need).toFixed(1)+'" width="'+Math.max(1,bw).toFixed(1)+'" height="'+(padT+plotH-Y(w.need)).toFixed(1)+'" rx="'+_PIL_GB.rv+'" fill="'+(over?_PIL_SEM.faute:_PIL_SEM.fait)+'" opacity="'+(over?0.95:0.8)+'"/>'; });
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
  if(pkw && pkw.need>((pkw.head||0)+0.001)){ var px=(X(pkw.o0)+X(pkw.o1+1))/2; g+='<text x="'+px.toFixed(1)+'" y="'+(Y(pk)-7).toFixed(1)+'" text-anchor="middle" font-size="'+c.txt.mini+'" font-weight="600" fill="'+_PIL_SEM.faute+'" font-family="var(--font-ui,Outfit)">pic '+(Math.round(pk*10)/10).toString().replace('.',',')+'</text>'; }
  var _tj=E.o(E.todayIso);
  if(_tj>=E.s && _tj<=E.e){ var _tx=X(_tj); g+='<line x1="'+_tx.toFixed(1)+'" y1="'+padT+'" x2="'+_tx.toFixed(1)+'" y2="'+(padT+plotH).toFixed(1)+'" stroke="'+c.col.texte+'" stroke-width="1.5" stroke-dasharray="4 3"/>'; }
  return window._mvGraphSvg(window._mvGraphCadre(W,H), 'Personnes n\u00e9cessaires par semaine, face \u00e0 l\u2019effectif pr\u00e9sent.', g);
}
function _pilEcartHtml(cd, real){
  function _o(y){ return Math.round((Date.parse(y+'T00:00:00')-Date.parse('2026-01-01T00:00:00'))/86400000); }
  var MN=['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];
  function fmt(y){ if(!y)return '\u2014'; var dd=new Date(y+'T00:00:00'); return dd.getDate()+' '+MN[dd.getMonth()]; }
  function dep(ds){ return (ds<-1)?((-ds)+'\u00a0j plus t\u00f4t'):((ds>1)?(ds+'\u00a0j plus tard'):'\u00e0 la date'); }
  // ★ MOTS-8 (§590) — une ligne par tâche : sa couleur, son nom, le verdict (« départ 31 j plus tôt »). Les dates prévues et
  //   faites se déplient au toucher. Les mêmes calculs qu'avant (départ, durée), au mot près.
  var rows=(cd.taskWindows||[]).map(function(t){
    var r=(real&&real[_friseNorm(t.nom)])||{state:'none'};
    var v, cls, det='pr\u00e9vu <b>'+fmt(t.start)+' \u2192 '+fmt(t.end)+'</b>';
    if(r.state==='none'||!r.start){ v='\u00e0 venir'; cls='dx'; det+=' \u00b7 fait <b>rien encore</b>'; }
    else if(r.state==='live'){ var ds=_o(r.start)-_o(t.start); v='d\u00e9part '+dep(ds); cls=(ds>1)?'ko':((ds<-1)?'ok':''); det+=' \u00b7 fait <b>'+fmt(r.start)+' \u2192 en cours</b>'; }
    else {
      var ds2=_o(r.start)-_o(t.start), dp=_o(t.end)-_o(t.start)+1, dr=_o(r.end)-_o(r.start)+1, du=dr-dp;
      v='fini \u00b7 d\u00e9part '+dep(ds2); cls=(ds2>1||du>2)?'ko':((ds2<-1||du<-2)?'ok':'');
      det+=' \u00b7 fait <b>'+fmt(r.start)+' \u2192 '+fmt(r.end)+'</b> \u00b7 dur\u00e9e '+(du>=0?'+':'')+du+'\u00a0j';
    }
    return '<details class="pil-tv-e"><summary><span class="n"><i class="mvk-pt" style="background:'+_taskColor(t.nom)+'" aria-hidden="true"></i>'+_pilEsc(t.nom)+'</span>'
      +'<span class="v'+(cls?' '+cls:'')+'">'+v+'</span></summary><p class="pil-tv-dt">'+det+'</p></details>';
  }).join('');
  return rows;
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
// _PEC_SUB (economie), _PEX_AN (exercice) et la periode
// active. Cliquer une campagne ne bougeait qu'UN panneau ; les chiffres au-
// dessus restaient sur une autre fenetre, sans le dire. D'ou deux reponses
// justes a la meme question sur le meme ecran.
// `camp` remplaçait _PIL_ETPSEL. ★ PORTEE-1 (§591) : `camp` ne se pose PLUS — la campagne lue est celle de toute
//   l'appli (la pastille du haut, son menu, _switchSaison), et le zoom par campagne est retiré avec ses puces et son
//   alias _PIL_ETPSEL (personne d'autre ne le lisait : mesuré dans le paquet construit). Les lectures de `camp` qui
//   restent valent null : elles retombent sur le cadre de l'année, comme avant le premier zoom.
// ⚠️ Toute nouvelle vue lit _PIL_SCOPE. On n'ajoute pas un sixieme selecteur.
// ════════════════════════════════════════════════════════════════════════════
// ANNEE-1 (§234) : la portee porte aussi le CADRE de l'annee ('exo' | 'vig') et le
// RECUL (0 = l'annee en cours, -1 = la precedente…). Une seule portee, jamais un
// sixieme selecteur : l'onglet L'annee, les photos et le fil d'Ariane la lisent.
var _PIL_SCOPE = { camp:null, cadre:'exo', recul:0 };

// Meme patron de cle que _pilTabKey : un module, une facon de nommer.
function _pilScopeKey(){ return 'mavigne_pil_scope_'+_pilTenant(); }
function _pilScopeLoad(){
  // ★ PORTEE-1 (§591) : la portée ne pose plus de campagne — elle se choisit à la pastille du haut, pour tout le Pilotage (la
  //   campagne consultée de l'appli). Une campagne mémorisée par une version d'avant est oubliée ici, sans bruit.
  _PIL_SCOPE.camp=null;
  try{ if(localStorage.getItem(_pilScopeKey())) localStorage.removeItem(_pilScopeKey()); }
  catch(e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'scope: lecture impossible'}); }
  try{ var c=localStorage.getItem(_pilCadreKey()); if(c==='vig'||c==='exo') _PIL_SCOPE.cadre=c; }
  catch(e2){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'cadre: lecture impossible'}); }
}
function _pilScopeSet(camp){
  _PIL_SCOPE.camp = camp || null;
  try{ localStorage.setItem(_pilScopeKey(), _PIL_SCOPE.camp||''); }
  catch(e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'scope: ecriture impossible'}); }
}
// ANNEE-1 (§234) — le cadre de l'annee : exercice comptable ou annee vigne.
function _pilCadreKey(){ return 'mavigne_pil_cadre_'+_pilTenant(); }
function _pilCadreSet(c){
  _PIL_SCOPE.cadre=(c==='vig')?'vig':'exo';
  try{ localStorage.setItem(_pilCadreKey(), _PIL_SCOPE.cadre); }
  catch(e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'cadre: ecriture impossible'}); }
}
// ⚠️ LE RECUL N'EST PAS MEMORISE — expres. Une annee consultee la veille et reprise
//   au rechargement afficherait un cadre clos la ou l'on attend l'annee en cours :
//   le mensonge silencieux que la bande d'Economie evite deja (_PEX_AN, §113).
function _pilReculSet(r){ r=parseInt(r,10); _PIL_SCOPE.recul=(isNaN(r)||r>0)?0:r; }
// La campagne portee EXISTE-T-ELLE encore ? Une periode supprimee ou renommee
// laisserait une portee fantome : l'ecran filtrerait sur un nom que plus
// personne ne porte, et n'afficherait rien sans dire pourquoi.
function _pilScopeVerif(ann){
  if(!_PIL_SCOPE.camp || !ann || !ann.pers) return;
  for(var i=0;i<ann.pers.length;i++) if(ann.pers[i].nom===_PIL_SCOPE.camp) return;
  _pilScopeSet(null);
}
var _PIL_ANN=null, _PIL_ANNK='';   // memo : N appels a _chargeSaisonData par rendu
function _pilAnnOrd(y){ return Math.round((Date.parse(y+'T00:00:00')-Date.parse('2026-01-01T00:00:00'))/86400000); }
// ★★★ L'INVERSE DE _pilAnnOrd — UNE SEULE FOIS, SUR L'EPOQUE UTC.
//   Trois sites reconstruisaient une date depuis un ordinal en melangeant DEUX
//   conventions dans la meme expression : une epoque LOCALE
//   (Date.parse('2026-01-01T00:00:00')) relue avec des accesseurs UTC
//   (getUTCDate / toISOString). A l'est de Greenwich, minuit local vaut 23:00 UTC
//   la VEILLE : toutes les dates du Pilotage sortaient UN JOUR TROP TOT.
//   Mesure du 12/08 sur l'ecran de Nico : une campagne 1 avr. -> 31 juil. 2027
//   s'affichait « 31 mars -> 30 juil. », le pic « semaine du 31 mars » pour la
//   semaine du 1er avril, et la fenetre d'accolage 18 juin -> 18 juil. devenait
//   « 16 juin -> 20 juil. ». Aucun calcul n'etait faux : TOUTES les etiquettes
//   l'etaient. Un chiffre juste sous une date fausse ne se verifie pas.
//   Meme base et memes accesseurs que _ford (planning.js) : UTC des deux cotes.
function _pilOrdD(o){ return new Date(Date.UTC(2026,0,1)+o*86400000); }
function _pilOrdIso(o){ var d=_pilOrdD(o), m=d.getUTCMonth()+1, j=d.getUTCDate();
  return d.getUTCFullYear()+'-'+(m<10?'0':'')+m+'-'+(j<10?'0':'')+j; }
function _pilAnnuelData(){
  if(typeof window._chargeSaisonData!=='function') return null;
  var brut=(typeof window._cmpVisibles==='function')?window._cmpVisibles():(window.SAISONS||[]);
  var pers=(brut||[]).filter(function(p){ return p&&p.debut&&p.fin&&p.fin>=p.debut; })
    .sort(function(a,b){ return String(a.debut).localeCompare(String(b.debut)); });
  if(!pers.length) return null;
  // ★★★ LA CLE DOIT DERIVER DE CE QUI ENTRE DANS LE CALCUL, PAS DE SON COMPTAGE.
  //   Elle ne portait que des LONGUEURS : MEMBRES.length, PARCELLES.length,
  //   TACHES.length. Modifier une date de contrat, cocher Bureau, changer
  //   l'effectif d'une equipe collective, corriger une surface ou des heures/ha
  //   ne fait varier AUCUNE longueur : la frise servait l'ancien calcul jusqu'au
  //   prochain F5, sans rien signaler. Un cache dont la cle ne derive pas de ses
  //   entrees n'est pas un cache, c'est un GEL.
  //   ⚠⚠ MESURE DU 13/08/2026, domaine reel, periode Hiver 01/10/2026 -> 31/03/2027.
  //   Quatre fiches sous contrat en octobre, la quatrieme sortant le 17/11. La ligne
  //   « effectif present » devait valoir 4, puis 3,857 la semaine du 12 nov., puis 3.
  //   Elle etait PLATE A 3 sur les six mois. Les memes fonctions (_headWeek,
  //   _inContractDay, _mvEnContratSurPeriode), rejouees sur les memes donnees,
  //   rendent bien 4 / 3,857 / 3 : le calcul etait juste, le memo servait un
  //   resultat perime. C'est le pire genre de faute — aucune erreur, aucun trou,
  //   une courbe parfaitement lisible qui dit le contraire de la base.
  //   ★ Tout ce que lit _chargeSaisonData entre desormais dans la cle : contrats
  //   et drapeaux de chaque fiche, surface et statut de chaque parcelle, heures/ha
  //   et fenetres de chaque tache, passages, overrides CONFIG, liste de taches de
  //   chaque periode. Le cout est de quelques centaines de concatenations par
  //   rendu — trois ordres de grandeur sous le calcul qu'il evite.
  function _annSigM(m){
    if(!m) return '';
    var Q=(typeof window._mvContrats==='function')?window._mvContrats(m):[];
    return (m.nom||'')+(m.bureau?'|B':'')+(m.collectif?('|C'+(m.effectif||1)):'')+'|'+(m.statut||'')
      +'|'+Q.map(function(q){return (q.debut||'')+'>'+(q.fin||'');}).join(',');
  }
  function _annSigP(p){
    if(!p) return '';
    return (p.statut||'')+':'+(p.surface||0)+':'+JSON.stringify(p.tachesExclues||[])+':'+JSON.stringify(p.selCamp||'')+':'+JSON.stringify(p.horsPer||'');   // SEL-1 · RETRAIT-1 (§325) : le contenu des désactivations, celles de chaque période comprises
  }
  function _annSigT(t){
    if(!t) return '';
    return (t.nom||'')+':'+(t.hha||0)+':'+(t.type||'')+(t.trous?'T':'')+(t.anytime?'A':'')
      +':'+((t.saisons||[]).join('.')||(t.saison||''));
  }
  var _cfgTW=(window.CONFIG&&window.CONFIG.task_windows)||{};
  // ★ DATES-1 (§323) : les DATES DE TRAVAUX de chaque période (échéances : Réglages ou roue crantée du Pilotage) entrent dans la clé.
  //   Sans elles, L'année et les photos gardaient les anciennes dates jusqu'au rechargement — le gel que ce bloc décrit.
  var key=pers.map(function(p){return p.nom+'|'+p.debut+'|'+p.fin+'|'+((p.taches||[]).join('.'))+'|'+JSON.stringify(p.echeances||{});}).join(';')
    +'#'+(window.MEMBRES||[]).map(_annSigM).join(';')
    +'#'+(window.PARCELLES||[]).map(_annSigP).join(';')
    +'#'+(window.TACHES||[]).map(_annSigT).join(';')
    +'#'+JSON.stringify(window.SAISON_PASSAGES||{})+'#'+JSON.stringify(_cfgTW)
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
      // ★ capH = heures REELLEMENT TRAVAILLABLES de l'equipe cette semaine-la
      //   (_capWeekReal, planning.js) : modele horaire de CHACUN, entrees du
      //   planning, contrats et effectif collectif compris. Elle etait calculee
      //   puis JETEE ici. C'est pourtant la seule mesure qui sache qu'une
      //   embauche commence le 26 aout — la projection de fin la lit desormais.
      out.weeks.push({o0:w.o0,o1:w.o1,m:w.m,cap:w.cap||0,need:w.need||0,
        head:w.head||0,headPerm:w.headPerm||0,headMax:(w.headMax!=null?w.headMax:(w.head||0)),
        capH:(w.capH!=null?w.capH:null),per:i});
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
    // \u26a0 Meme piege que les etiquettes de semaine : minuit LOCAL relu en UTC.
    //   Une vendange finissant un 1er octobre proposait \u00ab septembre \u00bb.
    var fv=new Date(vf+'T00:00:00Z');
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
window._pilAnnuelData=_pilAnnuelData;   // DATES-1 (§323) : lue par mv-harnais-dates1 (la mémoire suit les dates de travaux)
function _pilAnnPer(nom){
  var a=_PIL_ANN; if(!a||nom==null) return null;
  for(var i=0;i<a.pers.length;i++){ if(a.pers[i].nom===nom) return a.pers[i]; }
  return null;   // periode renommee ou supprimee -> on retombe sur l'annee entiere
}

// ══ LA PORTEE COMMANDE AUSSI LA CHARGE ET L'EFFECTIF ═══════════════════
// ⚠️⚠️ LE SIXIEME SELECTEUR, NON RECENSE (trouve le 12/08).
//   La v6.00 avait fondu cinq selecteurs dans _PIL_SCOPE en ecrivant « toute
//   nouvelle vue lit _PIL_SCOPE ». Il en restait un, invisible parce qu'il ne
//   ressemble pas a un selecteur : _pilSaison(), la periode CONSULTEE.
//   Les quatre photos et la frise lisaient _PIL_SCOPE ; le KPI Effectif, la
//   tuile Charge & ETP et Capacite vs charge lisaient _pilSaison(). Deux
//   consequences, toutes deux vues a l'ecran le meme jour :
//     · cliquer une campagne dans la frise ne bougeait PAS ces trois-la ;
//     · sur l'annee entiere, la photo annonçait le pic de l'ANNEE et la tuile
//       juste en dessous celui d'UNE campagne. Deux nombres, un seul mot.
//
// _pilPeriodeVue() rend la periode que la portee designe. Sur l'annee, elle
// retombe sur la periode consultee : un panneau qui a besoin d'un `cd` complet
// (frise des taches, courbe hebdo, ecart prevu/reel, repartition du temps) ne
// peut pas travailler sur « l'annee », qui n'est pas une periode. Il NOMME
// alors ce qu'il montre, au lieu de le laisser croire.
function _pilPeriodeVue(){
  var c=_PIL_SCOPE.camp;
  if(c){
    var l=(window.SAISONS||[]);
    for(var i=0;i<l.length;i++) if(l[i]&&l[i].nom===c) return l[i];
  }
  return (typeof _pilSaison==='function')?_pilSaison():null;
}
// Memo par rendu. _chargeSaisonData est le calcul le plus cher du module
// (capacite reelle jour par jour x effectif x contrats) et CINQ lecteurs
// l'appellent. On l'oublie a chaque repeinte, comme le cout d'exercice : un
// chiffre fige apres une saisie de planning serait le defaut qu'on corrige.
var _PIL_CDV=null, _PIL_CDVK='';
function _pilCdVueOublier(){ _PIL_CDV=null; _PIL_CDVK=''; }
function _pilCdVue(){
  if(typeof window._chargeSaisonData!=='function') return null;
  var p=_pilPeriodeVue(); if(!p||!p.debut||!p.fin) return null;
  var k=(p.nom||'')+'|'+p.debut+'|'+p.fin;
  if(_PIL_CDV!==null && _PIL_CDVK===k) return _PIL_CDV||null;
  var cd=null; try{ cd=window._chargeSaisonData(p); }catch(e){ cd=null; }
  _PIL_CDV=cd||false; _PIL_CDVK=k;
  return cd;
}
// La periode vue est-elle celle que le reste de l'application consulte ?
// calcHeures(), CONFIG.objectifs_fin et d.data ne connaissent QUE celle-la :
// les leur appliquer sur une autre campagne serait un chiffre sans assiette.
function _pilVueEstConsultee(){
  var p=_pilPeriodeVue(), n=_pilSaisonNom();
  return !!(p && n && p.nom===n);
}

// ══ LE PIC DE LA PORTEE — UNE SEULE DEFINITION ══════════════════════
// Lue par la photo Effectif, le KPI Effectif d'Aujourd'hui, la tuile Charge &
// ETP et Capacite vs charge. Sur une campagne : ses semaines. Sur l'annee : les
// semaines de l'EXERCICE, bornees — jamais celles d'une campagne que l'ecran
// declare lui-meme hors exercice.
// ⚠️ w.cap<=0 : semaine hors modele (feries, fermeture) — `need` n'y veut rien
//    dire, elle ne peut pas porter un pic.
// \u2605\u2605\u2605 CE QUI SE COMPARE A `need` N'EST PAS UN COMPTAGE DE TETES.
//   `need` = heures de la semaine / capacite d'UN ETP la meme semaine. Son
//   pendant EXACT est `capH / cap` : les heures reellement TRAVAILLABLES de
//   l'equipe cette semaine-la (modele horaire de chacun, entrees du planning,
//   conges, contrats, effectif collectif), ramenees au meme denominateur.
//   planning.js la calcule deja (_capWeekReal) et _pilAnnuelData la transporte
//   dans chaque semaine : on la LIT. Un second calcul donnerait un second
//   chiffre, et c'est la faute que ce module repare depuis aout.
//   \u26a0 POURQUOI PAS `head`. head est un prorata de jours de CALENDRIER. Une
//   equipe sous contrat du samedi au mercredi y pese 5/7 \u2014 alors que la semaine
//   n'offre du travail que du lundi au vendredi, dont elle ne couvre que trois.
//   Mesure du 06/09/2026, capture de Nico a l'appui : semaine du 29 aout,
//   40 saisonniers + le socle permanent, head = 34,4. Cet effectif n'a existe
//   AUCUN jour de cette semaine-la. Il gonfle la capacite d'un cote et sert de
//   base au manque de l'autre.
//   \u26a0 POURQUOI PAS `headMax` NON PLUS \u2014 et c'est le piege inverse. headMax
//   repond \u00ab combien de corps au plus fort de la semaine \u00bb : c'est le bon
//   chiffre pour un ordre de passage, et un FAUX NEGATIF pour un manque. Une
//   equipe de 40 sous contrat le jeudi et le vendredi seulement affiche
//   headMax = 45 face a un besoin de 38,6 : \u00ab couvert \u00bb, alors qu'elle ne
//   delivre que deux cinquiemes des heures de la semaine. Un manque qu'on
//   eteint coute plus cher qu'un manque qu'on exagere.
//   \u2605 headMax reste affiche, mais SOUS SON PROPRE NOM : les corps dans les
//   rangs. Deux questions, deux mots, jamais une seule barre de fraction.
function _pilDispoSem(x){
  if(!x) return 0;
  return (x.capH!=null && x.cap>0) ? (x.capH/x.cap) : (x.head||0);
}
// \u2605\u2605\u2605 LE PIC DE L'ANNEE ET LE PIC QUI RESTE A FAIRE SONT DEUX CHIFFRES.
//   Sur l'exercice, le pic est presque toujours la vendange. Consulte le
//   6 septembre, il designe une semaine DEJA FAITE \u2014 et l'ecran \u00ab Aujourd'hui \u00bb
//   affichait dessus \u00ab il manque 4,1 personnes \u00bb en orange, sans un mot pour
//   dire que c'est derriere. On ne demande pas un renfort pour une semaine
//   terminee.
//   Les deux se calculent ICI, en une seule passe, avec la meme balance : le pic
//   de la FENETRE (passe compris \u2014 c'est lui que \u00ab L'annee \u00bb doit montrer) et le
//   pic des semaines qui ne sont pas encore finies (`av`), le seul qui appelle
//   une decision. Aucun ecran ne refait le tri de son cote : ce serait le
//   sixieme selecteur non recense de §33, une deuxieme fois.
// ★ PORTEE-1 (§591) : `nom` (facultatif) — une campagne nommée ; sans lui, la portée (l'exercice ou l'année vigne).
function _pilPicPortee(nom){
  var ann=null; try{ ann=_pilAnnuelData(); }catch(e){ ann=null; }
  if(ann) _pilScopeVerif(ann);
  var selP=ann?_pilAnnPer(nom!==undefined?nom:_PIL_SCOPE.camp):null;
  var wk=(ann&&ann.weeks)?ann.weeks.filter(function(x){
    if(selP) return x.per===selP.idx;
    return x.o1>=ann.s && x.o0<=ann.e;
  }):[];
  function _bal(list){
    var pic=0, picW=null, som=0, n=0, court=false;
    list.forEach(function(x){
      if(!(x.cap>0)) return;
      som+=x.need; n++;
      if(x.need>pic){ pic=x.need; picW=x; }
      if(x.need>_pilDispoSem(x)+0.05) court=true;
    });
    var dispo=picW?_pilDispoSem(picW):0;
    return { ok:(pic>0), pic:pic, picW:picW,
             head:(picW?(picW.head||0):0),
             corps:(picW?((picW.headMax!=null)?picW.headMax:(picW.head||0)):0),
             dispo:dispo, manque:Math.max(0,pic-dispo),
             moy:(n>0?som/n:0), court:court, nSem:n };
  }
  // \u26a0 La date du jour passe par _mvAujIso (heure LOCALE) comme partout
  //    ailleurs dans le module : `new Date().toISOString()` decalerait d'un jour
  //    a l'est de Greenwich, et un pic \u00ab passe \u00bb la veille de sa semaine est
  //    exactement le genre d'ecart d'un jour qui fait douter de tout le reste.
  var _aj=(typeof window._mvAujIso==='function')?window._mvAujIso():null;
  var oAuj=_aj?_pilAnnOrd(_aj):null;
  if(oAuj!=null && isNaN(oAuj)) oAuj=null;
  var T=_bal(wk);
  var av=(oAuj==null)?null:_bal(wk.filter(function(x){ return x.o1>=oAuj; }));
  if(av && !av.ok) av=null;
  var passe=!!(T.ok && oAuj!=null && T.picW && T.picW.o1<oAuj);
  return { ok:T.ok, pic:T.pic, picW:T.picW, head:T.head, corps:T.corps,
           dispo:T.dispo, manque:T.manque, moy:T.moy, court:T.court, nSem:T.nSem,
           passe:passe, av:av, oAuj:oAuj, annee:!selP,
           nom:(selP?selP.nom:null), ann:ann, selP:selP };
}
// \u2605\u2605\u2605 CE QUI EST DEJA SIGNE, POUR LA SEMAINE EN COURS.
//   Les simulateurs du jour repondent \u00ab avec qui est la CE MATIN \u00bb. C'est utile
//   et incomplet : un CDD signe qui demarre lundi, une equipe d'accolage engagee
//   pour trois semaines, ne se voient nulle part tant qu'ils ne sont pas devant
//   la porte. On affiche donc, a cote de la presence du jour, l'effectif SOUS
//   CONTRAT de la semaine — celui que la frise annuelle et le simulateur de
//   renfort lisent deja (w.head, contrats lus par _mvContrats, collectifs
//   ponderes par _mvEffDef). \u26a0 AUCUN NOUVEAU CALCUL : un second calcul donnerait
//   un second chiffre, et c'est exactement la faute que ce module repare.
//   null quand aujourd'hui ne tombe dans aucune periode : un trou n'est pas un
//   zero, et un zero est une mesure.
// \u2605\u2605\u2605 SUR QUELLE FENETRE ? CELLE DU TRAVAIL.
//   \u26a0\u26a0 CORRECTION DE FOND (12/08/2026, retour de Nico, capture a l'appui).
//   Le lot precedent ponderait bien les equipes collectives \u2014 et ne changeait
//   RIEN a l'ecran, parce qu'il lisait AUJOURD'HUI. Or `d.membres` vient de
//   _pilMembresActifs, qui filtre sur _mvEnContratLe(m, AUJOURD'HUI) : une
//   equipe de 40 vendangeurs sous CONTRAT DE GROUPE du 26 aout au 4 septembre
//   n'existe pas le 12 aout. La fiche n'arrivait meme pas jusqu'a la ponderation.
//   Resultat a l'ecran : \u00ab EFFECTIF 1 \u00bb sur un ordre de passage de vendange que
//   Nico envoie ensuite aux ouvriers, et une repartition qui partage 154 j-homme
//   entre une seule paire de bras.
//   \u2605 LA VRAIE QUESTION N'EST PAS \u00ab qui est la ce matin \u00bb MAIS \u00ab qui sera la
//   QUAND LE TRAVAIL SE FERA \u00bb. Le jour de la vendange, personne n'est en conge
//   et tous les contrats courent. Un ordre de passage calcule sur l'effectif du
//   12 aout est faux le 26.
//   Source : w.head des semaines couvertes \u2014 la MEME que la frise annuelle et le
//   simulateur de renfort. _chargeSaisonData retient les fiches dont un contrat
//   RECOUPE la periode (_mvEnContratSurPeriode), puis _headWeek compte jour par
//   jour avec le poids _mvEffDef. Aucun calcul neuf : un second calcul donnerait
//   un second chiffre.
//   \u26a0 On retient le MAXIMUM des semaines couvertes, pas la moyenne : une
//   vendange de 40 personnes sur deux semaines noyee dans un mois de calme
//   rendrait 12, un chiffre qui n'existe aucun jour de l'annee (\u00a733).
// Fenetre COMMUNE d'une liste de taches, lue dans cd.taskWindows (les memes
// dates que le tableau Outils \u203a Param\u00e9trage). null si aucune tache reconnue :
// une fenetre inventee vaudrait moins que pas de fenetre.
// Effectif sous contrat PENDANT ces taches. Rend aussi la fenetre, pour que
// l'ecran puisse dire SUR QUOI il a compte — un nombre sans ses dates est une
// opinion.
// Le libelle du cadre, ecrit SOUS le chiffre. Un pic sans cadre est une opinion.
function _pilCadreLbl(PP){
  if(!PP.annee) return PP.nom||'la campagne';
  return 'l\u2019exercice';
}
// La semaine d'un pic, en clair. Meme convention de date que la frise (UTC sur
// l'axe ordinal), pas l'horloge locale : un decalage d'un jour sur une etiquette
// de semaine se voit et fait douter de tout le reste.
// \u2605 L'ANNEE FAIT PARTIE DE L'ETIQUETTE. Un exercice traverse deux annees
//   civiles : \u00ab semaine du 29 aout \u00bb ne dit pas si c'est la vendange qu'on
//   vient de faire ou celle de l'an prochain. Le meme mot sur deux ecrans, deux
//   annees \u2014 c'est exactement ce qui a fait passer un pic passe pour une alerte
//   du jour (06/09/2026).
function _pilSemLabO(o0){
  if(o0==null) return '';
  var MOA=['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];
  var dd=_pilOrdD(o0);
  return 'semaine du '+dd.getUTCDate()+' '+MOA[dd.getUTCMonth()]+' '+dd.getUTCFullYear();
}

// Combien de jours de vendange tombent de chaque cote de la borne. En JOURS,
// pas en euros : les jours se comptent exactement, le cout se prorate — et une
// fausse precision sur un chiffre comptable est pire qu'un ordre de grandeur
// annonce comme tel.
function _pilAnnSplitVend(ann){
  var v=ann.vend, ex=ann.ex;
  var a=_pilAnnOrd(v.debut), b=_pilAnnOrd(v.fin);
  var d0=_pilAnnOrd(ex.d0), d1=_pilAnnOrd(ex.d1);
  var tot=Math.max(1,b-a+1);
  var dedans=Math.max(0, Math.min(b,d1)-Math.max(a,d0)+1);
  return { total:tot, dedans:dedans, dehors:Math.max(0,tot-dedans) };
}



// ── NIVEAU ① — L'ANNEE : la frise des 52 semaines et le pic ─────────────────
// ⚠️⚠️ CE QUI A QUITTE CETTE TUILE (12/08/2026, retour Nico). La repartition
//   « Ou va le temps de l'equipe », la frise prevu/reel, la courbe par semaine
//   et l'ecart prevu/reel parlent d'UNE campagne, pas de l'annee. Ils etaient
//   ici, et la tuile s'en excusait par un bandeau : « les blocs ci-dessous
//   detaillent la campagne X ».
//   ★★ UN BANDEAU QUI EXPLIQUE POURQUOI UN BLOC EST AU MAUVAIS ENDROIT NE LE
//   DEPLACE PAS : IL DOCUMENTE LA FAUTE. Les quatre blocs vivent desormais dans
//   « La campagne » (_pilPanelTemps), au niveau de zoom qui repond a leur
//   question. Le bandeau a disparu avec eux — il n'y a plus rien a excuser.

// ── NIVEAU ② — LA CAMPAGNE : ou part le temps de l'equipe ───────────────────
// Les quatre blocs qui detaillent UNE campagne : la repartition de la presence,
// la frise prevu/reel, la courbe par semaine et l'ecart. Ils repondent tous a
// « comment se passe CE chantier », jamais a « ce que m'a coute l'annee ». Le
// titre nomme la campagne : aucun bandeau n'est necessaire pour dire de quoi on
// parle quand le titre le dit deja.
function _pilPanelTemps(d){
  var cd=_pilCdVue();
  if(!cd||!cd.months.length){
    return _pilTile('temps','#4A9FC8','Le temps de l\u2019\u00e9quipe', _pilStat('\u2014',''), 'datez la campagne', null,
      _pilEmptyGo('Renseignez les dates de d\u00e9but et de fin de la campagne : la r\u00e9partition du temps, la frise et la courbe en d\u00e9coulent.','saisons','R\u00e9glages \u203a Campagne'));
  }
  var s=_PIL_STATE.sub||{};
  // ⚠ d.data porte les pourcentages de la periode CONSULTEE (calcHeures). Sur une
  //   campagne zoomee qui n'est pas elle, les appliquer declarerait « termine » ou
  //   « en cours » d'apres l'avancement d'une AUTRE campagne. On passe le drapeau.
  var real=_pilTaskReal(cd,d,_pilVueEstConsultee());
  // ★★ MOTS-8 (§590) — replié : les heures de présence et la part dans les rangs. Ouvert : la barre du temps et trois lignes,
  //   une ligne orange quand le tracteur n'a pas de barème (avec « Régler ») ou quand la présence ne couvre pas la charge,
  //   la frise, la courbe, l'écart en une ligne par tâche, « Ouvrir le planning ». La phrase « Il faut N ETP… en moyenne »
  //   et « Une moyenne n'est pas un pic » passent dans le « i » (fiche vivante, mêmes chiffres).
  // ── Où va le temps (présence → vigne / tracteur / autres) ──
  // ★ Meme periode que `cd` : additionner les heures de tracteur d'une campagne
  //   a la charge d'une autre donnerait une repartition dont les deux parts ne
  //   parlent pas de la meme fenetre.
  var _tH=(window._tractHoursSeason)?Math.round(window._tractHoursSeason(_pilPeriodeVue())||0):0;
  var _prez=Math.round(cd.capEquipe||0), _vig=Math.round(cd.charge||0), _cr=cd.capRefTotal||0;
  var _etpF=function(h){return _cr>0?(h/_cr).toFixed(1).replace('.',','):'\u2014';};
  // ══ UNE PART NE PEUT PAS DEPASSER 100 % ═══════════════════════════════════
  // _pV=_vig/_prez*100 sortait a 392 % dans une barre qui se PRESENTE comme une
  // repartition, pendant qu'« Autres » tombait a 0 h par le Math.max(0,...) : la
  // barre mentait deux fois — une part impossible, et un reste invente a zero
  // alors qu'il y a bien de la cave et des trajets. Desormais la surcharge se DIT.
  var _tot=_vig+_tH, _surch=(_prez>0 && _tot>_prez+0.5), _ratio=(_prez>0)?(_tot/_prez):0;
  var _aut=_surch?0:Math.max(0,_prez-_vig-_tH);
  var _base=_surch?_tot:(_prez||1);
  var _wV=_vig/_base*100, _wT=_tH/_base*100, _wA=_surch?0:Math.max(0,100-_wV-_wT);
  var _pV=Math.round(_wV), _pT=Math.round(_wT), _pA=_surch?0:Math.max(0,100-_pV-_pT);
  var _xR=(Math.round(_ratio*10)/10).toString().replace('.',',');
  var C_V='#3D6B27', C_T='#4A9FC8', C_A='#B98A5E';
  var seg=function(w,col){ return (w>0.5)?('<i style="flex:'+w.toFixed(2)+';background:'+col+'"></i>'):''; };
  // COH-1 : quelques heures de tracteur sortaient « 0,0 ETP » — sous 0,05 personne, la part en personnes ne s'écrit pas.
  var row=function(col,nm,val,pct,etp,h){ var pers=(_cr>0&&h/_cr>=0.05)?(' \u00b7 '+etp+'\u00a0pers.'):''; return '<div><span><i style="background:'+col+'"></i>'+nm+'</span><b>'+_pilNum(val)+'\u00a0h</b><small>'+pct+'\u00a0%'+pers+'</small></div>'; };
  // La fiche « i » dit les chiffres du jour (fiche vivante) avant la méthode.
  try{
    var _base0=(window.MV_INFO&&window.MV_INFO['pil.avc.temps'])?window.MV_INFO['pil.avc.temps'].p:[];
    var _vif='Il faut <b>'+_etpF(_vig)+' personne'+(_cr>0&&_vig/_cr>=1.95?'s':'')+' \u00e0 temps plein</b> pour la vigne'
      +((_tH>0)?(' et <b>'+_etpF(_tH)+'</b> au tracteur'):'')+', <b>en moyenne sur la campagne</b>'
      +(_surch?(' : la pr\u00e9sence de l\u2019\u00e9quipe ('+_pilNum(_prez)+' h) ne couvre pas cette charge, <b>surcharge \u00d7'+_xR+'</b>, et rien ne reste pour la cave, les trajets ou l\u2019entretien.')
        :('. Le reste ('+_etpF(_aut)+') part sur la cave, les trajets, l\u2019entretien\u2026'));
    if(window._mvInfoSet) window._mvInfoSet('pil.avc.temps',{ p:[_vif].concat(_base0) });
  }catch(eI){ if(window._mvAvale) window._mvAvale(eI,'pilotage.js/_pilPanelTemps#info'); }
  var body='<div class="pil-tv-fh"><span>O\u00f9 va le temps <small>'+_pilEsc(cd.saison)+'</small></span>'+_mvInfoBtn('pil.avc.temps')+'</div>'
    +'<div class="pil-tv-sp" aria-hidden="true">'+seg(_wV,C_V)+seg(_wT,C_T)+seg(_wA,C_A)+'</div>'
    +'<div class="pil-tv-sl">'+row(C_V,'dans les rangs',_vig,_pV,_etpF(_vig),_vig)
    +((_tH>0)?row(C_T,'au tracteur',_tH,_pT,_etpF(_tH),_tH):'')
    +(_surch?'':row(C_A,((_tH>0)?'cave, trajets, entretien\u2026':'tracteur, cave, trajets\u2026'),_aut,_pA,_etpF(_aut),_aut))+'</div>'
    +(_surch?('<div class="pil-tv-al"><span>Surcharge \u00d7'+_xR+' : la pr\u00e9sence ne couvre pas la charge</span>'+_pilTvBtn('planning','Planning')+'</div>'):'')
    +((_tH>0)?'':('<div class="pil-tv-al"><span>Le tracteur n\u2019a pas de bar\u00e8me</span>'+_pilTvBtn('tracbar','R\u00e9gler')+'</div>'));
  var sw='display:inline-block;width:14px;height:8px;border-radius:2px';
  if(s.etp_frise!==0){
    var _tc=(cd.taskWindows||[]).slice(0,3).map(function(t){ return _taskColor(t.nom); });
    var _pvG=_tc.length>1?('linear-gradient(90deg,'+_tc.map(function(c,i){ return c+' '+Math.round(i/_tc.length*100)+'% '+Math.round((i+1)/_tc.length*100)+'%'; }).join(',')+')'):(_tc[0]||'var(--terre)');
    body+='<div class="pil-tv-fh"><span>Pr\u00e9vu et fait</span>'+_mvInfoBtn('pil.avc.frise')+'</div>'
      +'<div class="pil-tv-gx" id="pil-g-frise"></div>'
      +'<div class="pil-tv-lgx"><span><i style="'+sw+';background:'+_pvG+'"></i>pr\u00e9vu</span>'
      +'<span><i style="'+sw+';border:1px solid var(--texte);background:repeating-linear-gradient(45deg,var(--texte),var(--texte) 2px,transparent 2px,transparent 5px)"></i>fait</span>'
      +'<span><i style="'+sw+';background:var(--orange)"></i>en cours</span>'
      +'<span><i style="width:16px;height:0;border-top:2px dashed var(--texte)"></i>aujourd\u2019hui</span></div>';
    window._mvGraphSuivre('#pil-g-frise', function(lg){ return _pilFriseSvg(cd,real,lg); }, {max:1800});
  }
  if(s.etp_courbe!==0){
    var _SM=window._PIL_SEM||{};
    body+='<div class="pil-tv-fh"><span>Personnes n\u00e9cessaires par semaine</span>'+_mvInfoBtn('pil.avc.courbe')+'</div>'
      +'<div class="pil-tv-gx" id="pil-g-dem"></div>'
      +'<div class="pil-tv-lgx"><span><i style="'+sw+';background:'+(_SM.fait||'#5C8A3E')+'"></i>couvert par l\u2019\u00e9quipe</span>'
      +'<span><i style="'+sw+';background:'+(_SM.faute||'#9B2D1F')+'"></i>il manque du monde</span>'
      +'<span><i style="width:16px;height:0;border-top:2px solid var(--texte)"></i>\u00e9quipe pr\u00e9sente</span></div>';
    window._mvGraphSuivre('#pil-g-dem', function(lg){ return _pilDemandSvg(cd,lg); }, {max:1800});
  }
  if(s.etp_ecart!==0){ body+='<div class="pil-tv-fh"><span>\u00c9cart au pr\u00e9vu</span></div>'+_pilEcartHtml(cd,real); }
  // Les trois graphes se montrent ou se cachent (préférence gardée, _PIL_STATE.sub) : la ligne du bas, discrète.
  function chip(k,lab){ var on=s[k]!==0; return '<button type="button" class="pil-tv-chip'+(on?' on':'')+'" data-etp="'+k+'" aria-pressed="'+(on?'true':'false')+'">'+lab+'</button>'; }
  body+='<div class="pil-tv-act">'+_pilTvBtn('planning','Ouvrir le planning')
    +'<span class="pil-tv-chips" role="group" aria-label="Montrer">'+chip('etp_frise','Frise')+chip('etp_courbe','Semaines')+chip('etp_ecart','\u00c9cart')+'</span></div>';
  var _subT='de pr\u00e9sence \u00b7 '+(_surch?('surcharge \u00d7'+_xR):(_pV+' % dans les rangs'));
  return _pilTile('temps','#4A9FC8','Le temps de l\u2019\u00e9quipe', _pilStat(_pilNum(_prez),' h'), _subT, null, body);
}
function _pilFmtD(iso){ var pp=String(iso||'').split('-'); if(pp.length!==3)return String(iso||''); var mo=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']; var mi=parseInt(pp[1],10)-1; return parseInt(pp[2],10)+' '+(mo[mi]||''); }
function _pilEchWin(e){ if(!e)return ''; var a=e.d1?_pilFmtD(e.d1):'', b=e.d2?_pilFmtD(e.d2):''; if(a&&b)return a+' → '+b; if(a)return 'dès '+a; if(b)return 'jusqu’au '+b; return ''; }
// ★★★ UNE SEULE DATE DE FIN PAR MODULE (10/09/2026).
//   Cette carte projetait la fin de saison toute seule : charge restante divisee
//   par la presence des quatre dernieres semaines. Le cockpit, lui, lit la
//   CAPACITE PLANIFIEE (contrats et dates de debut compris) et ne retombe sur la
//   cadence que s'il n'a rien d'autre. Mesure au bac, le meme jour, sur les memes
//   donnees : « fin le ven. 11 sept. » sur Aujourd'hui, « fin de saison ~mar. 29
//   sept. » ici — dix-huit jours d'ecart entre deux onglets voisins. La carte lit
//   desormais _pilMargeCalc, la definition du cockpit, et dit sa source.
// ★ 10/09 (soir) : chaque tache lit SA fin dans la MEME simulation que le
//   cockpit (_pilFinPlan → m.capa.taches) : sa fenetre, l'equipe partagee avec
//   les taches ouvertes en meme temps, le tracteur deduit. Avant, chaque ligne
//   etait projetee « comme si toute l'equipe ne faisait que cette tache »,
//   depuis le 1er jour de la periode — une taille du 26 novembre recevait
//   l'equipe d'octobre. « N j » = jours ouvres d'ici la, depuis aujourd'hui.
function _pilPanelEcheances(d,m0){
  var m=m0||_pilMargeCalc(d), cadH=m.cadH;
  var _echS=((window._pilSaison&&window._pilSaison())||{}).echeances||{};
  var act=(d.active||[]).filter(function(t){ return (t.h_reste||0)>0; });
  var plan=(m.src==='planning');
  var parT={}; if(plan&&m.capa&&m.capa.taches) m.capa.taches.forEach(function(s){ parT[_friseNorm(s.nom)]=s; });
  var rows=act.map(function(t){
    var h=t.h_reste||0, j=null, s=null;
    if(plan){ s=parT[_friseNorm(t.nom)]||null; if(s&&s.fin) j=Math.max(1,_pilWdBetween(m.today,s.fin)); }
    else if(cadH>0) j=Math.ceil(h/cadH);
    return { nom:t.nom, pct:t.pct||0, hreste:h, jours:j, ech:_echS[t.nom]||null, sim:s };
  });
  rows.sort(function(a,b){ return (b.jours||0)-(a.jours||0); });
  var maxJ=rows.length?(rows[0].jours||0):0;
  var seasonJ=m.seasonJ;
  var statHtml=_pilStat(rows.length, ' t\u00e2che'+(rows.length>1?'s':''));
  // ★★ MOTS-8 (§590) — replié : le nombre de tâches et la fin de la dernière. Ouvert : la fin de toute la campagne, puis une
  //   ligne par tâche (sa fin ; « la plus longue » en pastille ; le détail au toucher). La méthode (« même calcul
  //   qu'Aujourd'hui… ») passe derrière le « i ».
  var pole=(rows.length && rows[0].jours!=null)?rows[0]:null;
  var subHtml;
  if(m.proj){
    var _fin=(plan&&pole&&pole.sim&&pole.sim.lbl)?pole.sim.lbl:_pilJourC(m.proj);
    subHtml=(rows.length>1?'fin de la derni\u00e8re : ':'fin : ')+_fin+(plan?'':' \u00b7 au rythme des 4 derni\u00e8res semaines');
  }
  else if(m.capa&&!m.capa.ok) subHtml='l\u2019\u00e9quipe pr\u00e9vue ne suffit pas';
  else subHtml='pas de rythme mesur\u00e9';
  var body;
  if(!rows.length){ body='<div class="pil-empty">Aucune t\u00e2che en cours</div>'; }
  else if(!plan && cadH<=0){ body='<div class="pil-empty">Pas de rythme mesur\u00e9 : les jours travaill\u00e9s se comptent sur le planning (4 derni\u00e8res semaines).</div>'; }
  else {
    body='<div class="pil-tv-fh"><span>La fin de chaque t\u00e2che</span>'+_mvInfoBtn('pil.avc.echeances')+'</div>'
      +(m.proj?('<p class="pil-tv-tot">Fin pr\u00e9vue : <b>'+_pilDfrObj(m.proj)+'</b>'+(seasonJ!=null?(', dans '+seasonJ+' jours travaill\u00e9s'):'')+'</p>'):'')
      +((m.capa&&m.capa.ok===false)?('<div class="pil-tv-al"><span>Il resterait environ '+_pilNum(Math.round(m.capa.manque||0))+' h le '+_pilDfrObj(m.capa.finCamp)+' : l\u2019\u00e9quipe pr\u00e9vue ne suffit pas</span></div>'):'')
      +rows.map(function(r){
        var long=(rows.length>1 && r.jours===maxJ);
        var ko=(r.sim&&r.sim.perdu>0.01)?'perdu':((r.sim&&r.sim.dep>0)?('d\u00e9borde de '+r.sim.dep+' sem.'):'');
        var droite=ko?('<b class="ko">'+ko+'</b>'):((r.sim&&r.sim.lbl)?('fin '+_pilEsc(r.sim.lbl)):(r.jours!=null?(r.jours+'\u00a0j'):'\u2014'));
        var det=[r.pct+' % fait', _pilNum(r.hreste)+' h reste'];
        if(r.ech&&(r.ech.d1||r.ech.d2)) det.push('pr\u00e9vu '+_pilEchWin(r.ech));
        if(r.jours!=null) det.push(r.jours+' jours travaill\u00e9s');
        if(r.sim&&r.sim.hors) det.push('apr\u00e8s la campagne');
        return '<details class="pil-tv-e"><summary><span class="n"><i class="mvk-pt" style="background:'+_pilTCol(r.nom)+'" aria-hidden="true"></i>'+_pilEsc(_pilTnom(r.nom))
          +(long?'<span class="pil-tv-pl or">la plus longue</span>':'')+'</span><span class="v">'+droite+'</span></summary>'
          +'<p class="pil-tv-dt">'+det.join(' \u00b7 ')+'</p></details>';
      }).join('');
  }
  return _pilTile('echeances','#C9A84C','\u00c9ch\u00e9ances', statHtml, subHtml, null, body);
}
// ── Fenêtre de traitement sur 5 jours (sec · vent < 19 km/h · sous 25°, plage 0h–24h) ──
// Réglages anti-lessivage / probabilité de pluie (défauts)
// Horizon de la prevision affichee. Il etait en dur dans un slice(0,5) et cite
// nulle part ailleurs : la ligne de cadre l'annonce desormais, donc il se nomme.
var PIL_TREAT_DAYS = 5;
var PIL_TREAT_DRY_H=6;     // heures de séchage surveillées APRÈS la fenêtre
var PIL_TREAT_LEACH_MM=1;  // pluie cumulée (mm) déclenchant l'alerte lessivage
var PIL_TREAT_PP_ALERT=40; // proba de pluie (%) sur la plage déclenchant l'alerte
// ★ FENETRE-2 (§567) — la règle du créneau (maquette-niveau-au-dessus-v1, partie 3) : sec, vent sous 19 km/h, sous 25 °C, ET
//   l'hygrométrie à 50 % au moins, ET le jour (du lever au coucher du soleil, NOAA). Les parcelles en fleur ont le créneau du soir
//   (2 h avant, 3 h après le coucher : l'arrêté abeilles). La pluie des 72 h qui suivent le créneau se lit face au seuil de lessivage.
var PIL_TREAT_HR_MIN=50, PIL_TREAT_APRES_H=72;
function _pilTreatDays(){
  var mh=window.METEO_HOURLY||null;
  if(!mh){ try{ mh=JSON.parse(localStorage.getItem('mavigne_meteohr_cache')||'null'); }catch(e){ mh=null; } }
  if(!mh||!mh.time||!mh.time.length) return undefined;
  var T=mh.time, TE=mh.temp||[], PR=mh.precip||[], PP=mh.pp||[], WD=mh.wind||[], HU=mh.hum||[], now=Date.now();
  var geo=(typeof getDomaineGeo==='function')?getDomaineGeo():null, soirF=(typeof _pilSoirFleurs==='function')?_pilSoirFleurs(_pilPhotoIso(new Date())):null, _sol={};
  function soleil(i){ var k=String(T[i]).slice(0,10); if(!(k in _sol)){ _sol[k]=(geo&&geo.lat!=null)?{ l:_pilCoucher(k,geo.lat,geo.lng,true), c:_pilCoucher(k,geo.lat,geo.lng) }:null; } return _sol[k]; }
  function minute(i){ var d=new Date(T[i]); return d.getHours()*60+d.getMinutes(); }
  function humid(i){ return !HU.length||HU[i]==null||(Number(HU[i])>=PIL_TREAT_HR_MIN); }
  function jour(i){ var S=soleil(i); if(!S||S.l==null||S.c==null) return true; var m=minute(i); return m>=S.l&&m+60<=S.c+59; }
  function soir(i){ var S=soleil(i); if(!soirF||!S||S.c==null) return false; var m=minute(i); return m>=S.c-120&&m<S.c+180; }
  var JJ=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'], today=new Date().toDateString();
  function dry(i){ return (Number(PR[i])||0)<0.1; }
  function calm(i){ return (Number(WD[i])||0)<19; }
  function cool(i){ return (Number(TE[i])||99)<25; }
  function ok(i){ return dry(i)&&calm(i)&&cool(i)&&humid(i)&&jour(i); }
  function classe(i){ return !dry(i)?'pluie':!calm(i)?'vent':!cool(i)?'chaud':soir(i)?'soir':!jour(i)?'nuit':!humid(i)?'sec':'ok'; }
  // Regroupe les heures futures par jour (ordre conservé)
  var order=[], map={};
  for(var i=0;i<T.length;i++){
    var dt=new Date(T[i]); if(dt.getTime()<now-3600000) continue;
    var key=dt.getFullYear()+'-'+dt.getMonth()+'-'+dt.getDate();
    if(!map[key]){ map[key]={ date:dt, idx:[] }; order.push(key); }
    map[key].idx.push(i);
  }
  return order.slice(0,PIL_TREAT_DAYS).map(function(key){
    var day=map[key], idx=day.idx, dt=day.date;
    var lab=(dt.toDateString()===today)?'Aujourd\'hui':(JJ[dt.getDay()]+' '+dt.getDate());
    var heures=idx.map(function(gi){ return { h:new Date(T[gi]).getHours(), cl:classe(gi) }; });   // FENETRE-2 : la frise
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
      // FENETRE-2 (§567) : la pluie des 72 h qui suivent, et le jour où il en tombe le plus.
      var apMm=0, parJ={}; for(var aj=endG+1; aj<T.length && aj<=endG+PIL_TREAT_APRES_H; aj++){ var v=Number(PR[aj])||0; apMm+=v; var dk=new Date(T[aj]); var jl=JJ[dk.getDay()]+' '+dk.getDate(); parJ[jl]=(parJ[jl]||0)+v; }
      var apJour=Object.keys(parJ).sort(function(a,b){ return parJ[b]-parJ[a]; })[0]||'';
      return { label:lab, heures:heures, apresMm:Math.round(apMm*10)/10, apresJour:(apMm>=0.1?apJour:''), start:new Date(T[idx[best.s]]).getHours(), end:new Date(T[idx[best.e]]).getHours()+1,
               wMax:Math.round(wMax), tMax:Math.round(tMax),
               ppMax:hasPP?Math.round(ppMax):null,
               leach:(PIL_TREAT_DRY_H>0 && leachMm>=PIL_TREAT_LEACH_MM), leachMm:leachMm, leachH:leachH };
    }
    // Aucune fenêtre : motif dominant
    var rRain=0,rWind=0,rHeat=0,rHum=0;
    for(var p=0;p<idx.length;p++){ var g2=idx[p]; if(!dry(g2)) rRain++; else if(!calm(g2)) rWind++; else if(!cool(g2)) rHeat++; else if(jour(g2)&&!humid(g2)) rHum++; }
    var reason='conditions';
    if(rRain>=rWind && rRain>=rHeat && rRain>=rHum && rRain>0) reason='pluie';
    else if(rWind>=rHeat && rWind>=rHum && rWind>0) reason='vent ≥ 19 km/h';
    else if(rHeat>=rHum && rHeat>0) reason='≥ 25°';
    else if(rHum>0) reason='hygrométrie sous 50 %';
    return { label:lab, reason:reason, heures:heures };
  });
}
function _pilTBdg(bg,col,txt){ return '<span style="display:inline-flex;align-items:center;gap:4px;font-size:var(--pt-micro,12px);font-weight:600;padding:3px 8px;border-radius:7px;line-height:1.2;background:'+bg+';color:'+col+'">'+txt+'</span>'; }
function _pilMm(v){ return (v%1===0?String(v):v.toFixed(1)).replace('.',',')+' mm'; }
// \u2605\u2605\u2605 UNE SEULE FENETRE DE TRAITEMENT, ET ELLE EST DANS LA JOURNEE.
//   Deux cartes lisaient le MEME _pilTreatDays() : \u00ab Traiter ? \u00bb sur Aujourd'hui
//   et \u00ab Fen\u00eatre de traitement \u00bb dans L'\u00e9quipe & le mat\u00e9riel. Une source, deux
//   ecrans, deux onglets — la faute de \u00a734, en plus petit et restee en place.
//   Le guide tranchait deja la question de la place sans qu'on l'ecoute :
//   \u00ab c'est l'indicateur qu'on regarde le soir en se demandant s'il faut sortir
//   le pulverisateur \u00bb. C'est une decision DU JOUR. Elle ne se range pas a cote
//   d'un parc de tracteurs, dont l'echelle est l'annee.
//   \u26a0\ufe0f Le dessin des cinq jours n'est pas RECOPIE dans la carte survivante : il
//     est EXTRAIT ici. Recopier, c'est garantir que les deux divergeront.
// ★ FENETRE-2 (§567) — LA FRISE DES CINQ JOURS, HEURE PAR HEURE : une ligne par jour, une case par heure (les heures passées vides),
//   la couleur dit pourquoi : bon créneau, créneau du soir (parcelles en fleur), pluie, vent, chaleur, hygrométrie sous 50 % ou nuit.
var _PIL_FR_LEG=[['ok','bon cr\u00e9neau'],['soir','cr\u00e9neau du soir, parcelles en fleur'],['pluie','pluie'],['vent','vent \u2265 19 km/h'],['chaud','plus de 25 \u00b0C'],['sec','hygrom\u00e9trie sous 50 % ou nuit']];
function _pilFrise5(days){
  if(!days||!days.length) return '';
  var tete='<div class="pil-fr-r pil-fr-ax"><span class="pil-fr-j"></span>'+[0,3,6,9,12,15,18,21].map(function(h){ return '<span style="grid-column:'+(h+2)+' / span 3">'+h+'</span>'; }).join('')+'</div>';
  var lig=days.map(function(d){
    var par={}; (d.heures||[]).forEach(function(x){ par[x.h]=x.cl; });
    var c=''; for(var h=0;h<24;h++){ var cl=par[h]; c+='<i class="pil-fr-c'+(cl?' '+(cl==='nuit'?'sec':cl):'')+'"></i>'; }
    return '<div class="pil-fr-r"><span class="pil-fr-j">'+_pilEsc(d.label)+'</span>'+c+'</div>';
  }).join('');
  var leg='<div class="pil-fr-leg">'+_PIL_FR_LEG.map(function(x){ return '<span><i class="pil-fr-c '+x[0]+'"></i>'+x[1]+'</span>'; }).join('')+'</div>';
  return '<div class="pil-fr" role="img" aria-label="Les cinq prochains jours, heure par heure">'+tete+lig+leg+'</div>';
}
function _pilTreatRows(days){
  return (days||[]).map(function(x){
    if(x.start!=null){
      var risk=x.leach||(x.ppMax!=null && x.ppMax>=PIL_TREAT_PP_ALERT);
      var bg=risk?'var(--orange-pale)':'var(--vert-pale)', bd=risk?'var(--orange)':'var(--vert-med)';
      var bdgs='';
      if(x.leach) bdgs+=_pilTBdg('var(--orange-pale)','var(--orange)',''+_mvIcon('alerte',16)+' pluie '+_pilMm(x.leachMm)+' dans '+x.leachH+' h \u2192 lessivage');
      else bdgs+=_pilTBdg('var(--vert-pale)','var(--vert-med)',''+_mvIcon('check',16)+' '+PIL_TREAT_DRY_H+' h au sec ensuite');
      if(x.ppMax!=null){
        if(x.ppMax>=PIL_TREAT_PP_ALERT) bdgs+=_pilTBdg('var(--orange-pale)','var(--orange)',''+_mvIcon('pluie',16)+' '+x.ppMax+' % de pluie');
        else bdgs+=_pilTBdg('rgba(127,127,127,.12)','var(--texte-doux)',x.ppMax+' % de pluie');
      }
      return '<div style="padding:8px 11px;border-radius:10px;background:'+bg+';border-left:3px solid '+bd+'">'
        + '<div style="display:flex;align-items:center;gap:9px">'
        + '<span style="width:70px;font-size:var(--pt-txt,13px);font-weight:600;color:var(--texte);flex:none">'+_pilEsc(x.label)+'</span>'
        + '<span style="flex:1;font-size:var(--pt-base,14px);font-weight:600;color:'+bd+'">'+x.start+'h \u2192 '+x.end+'h</span>'
        + '<span style="font-size:var(--pt-lbl,12px);color:var(--texte-doux);white-space:nowrap">'+x.wMax+' km/h \u00b7 '+x.tMax+'\u00b0</span>'
        + '</div>'
        + '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:7px">'+bdgs+'</div>'
        + '</div>';
    }
    return '<div style="display:flex;align-items:center;gap:9px;padding:8px 11px;border-radius:10px;border-left:3px solid var(--gris-clair)">'
      + '<span style="width:70px;font-size:var(--pt-txt,13px);font-weight:600;color:var(--texte-doux);flex:none">'+_pilEsc(x.label)+'</span>'
      + '<span style="flex:1;font-size:var(--pt-txt,13px);color:var(--texte-doux);font-style:italic">aucune fen\u00eatre \u00b7 '+x.reason+'</span>'
      + '</div>';
  }).join('');
}

// ════════════════════════════════════════════════════════════════════
// « QUI FAIT QUOI » — remplace « Simulateur — et si ? » (DZ-1, §162).
// ⚰️ L'ancien panneau divisait par une cadence MOYENNE sur 28 jours (c.hPers)
//   et répartissait « l'effectif sous contrat pendant ces travaux » à parts
//   égales. Ici chaque priorité part de SON équipe affectée, au planning jour
//   par jour, avec la tournée de ce travail (enregistrée, sinon au plus proche)
//   et le moteur de la tournée : les deux cartes donnent la même date.
// ════════════════════════════════════════════════════════════════════
var _PIL_SIM=null;
// ★ CIBLE-1 (§163) — DZ-1 avait écrit ici une SECONDE copie de « dernière faite », avec le
//   même défaut que `_opJournalLast` : `>=` sur la date seule, journal rangé du plus récent
//   au plus ancien, donc la PREMIÈRE validée du jour. Elle sert de départ quand aucune
//   tournée n'est enregistrée : l'ordre proposé partait du matin. Une définition, un appel.
function _dzDernierFait(t){ var d=window._mvDerniereValidee([t], _opGeoOK); return d?d.p:null; }
function _dzRowsTache(t){
  var def=_opTaskDef(t); if(!def) return [];
  var act=_opParcActive().filter(function(p){ return _opApplic(p,def)&&_opParcReste(p,def)>0.05&&!(typeof window._mvAuPrestataire==='function'&&window._mvAuPrestataire(p,t)); }), ord=[], saved=_opSavedTask(t);
  if(saved){ var by={}; act.forEach(function(p){ by[p.nom]=p; }); saved.forEach(function(n){ if(by[n]){ ord.push(by[n]); delete by[n]; } }); act.forEach(function(p){ if(by[p.nom]) ord.push(p); }); }
  else {
    var geo=act.filter(_opGeoOK), no=act.filter(function(p){ return !_opGeoOK(p); }), st=_dzDernierFait(t);
    if(geo.length&&!st){ var c=_opCentroid(geo), bdist=Infinity; geo.forEach(function(p){ var dd=_opHav(c,p); if(dd<bdist){ bdist=dd; st=p; } }); }
    ord=(geo.length?_opNN(geo,st||geo[0]):[]).concat(no);
  }
  return ord.map(function(p){ return {p:p,nom:p.nom,s:parseFloat(p.surface)||0,reste:Math.round(_opParcReste(p,def)*10)/10,geo:_opGeoOK(p)}; });
}
function _dzRepTache(t,noms,o,refIso,H,equipe,delta,nbAnon){
  var f=_dzFen(t,refIso), start=(f&&f.debut>refIso)?f.debut:refIso;
  var ctx=_dzCtx(noms,{R:o.R||0,anon:(o.anon!=null?o.anon:null)});
  var rows=_dzRowsTache(t), e0=_dzEquipeJour(start,ctx);
  var sim=rows.length?_dzSimuler(rows,start,ctx,H):{days:[],bloque:false};
  var arret=rows.length>0&&(sim.bloque||!sim.days.length||!(sim.days[0].n>0));
  var fin=(!arret&&sim.days.length)?sim.days[sim.days.length-1].iso:null;
  return {t:t,e0:e0,n:(nbAnon!=null?nbAnon:e0.n),delta:delta,equipe:equipe,fin:fin,arret:arret,rien:!rows.length,ok:!!fin&&(!f||fin<=f.fin),f:f};
}
function _dzRep(){
  var C=_DZ_LAST||_dzCalc(), refIso=C.ref.iso, H=C.H, S=_PIL_SIM||(_PIL_SIM={rep:{}});
  var mbs=_dzMbs(), tous=Object.keys(mbs);
  var trav=tous.filter(function(n){ return _dzJourMbr(mbs[n],refIso).pH>0.01; });
  var nJour=trav.reduce(function(a,n){ return a+_dzJourMbr(mbs[n],refIso).n; },0);
  var its=_dzPrios(), out={mode:null,taches:[],libres:[],nLib:0,nJour:nJour,ref:refIso,vide:false};
  if(its.length){
    out.mode='prio';
    var pris={};
    its.forEach(function(it){ var eq=(it.equipe||[]).filter(function(n){ return mbs[n]; }); if(!eq.length) out.vide=true; eq.forEach(function(n){ pris[n]=1; }); });
    if(!out.vide){ out.libres=trav.filter(function(n){ return !pris[n]; }); out.nLib=out.libres.reduce(function(a,n){ return a+_dzJourMbr(mbs[n],refIso).n; },0); }
    its.forEach(function(it){ var eq=(it.equipe||[]).filter(function(n){ return mbs[n]; }), dl=S.rep[it.t]||0;
      out.taches.push(_dzRepTache(it.t,eq.length?eq:tous,{R:dl},refIso,H,eq.length?eq:null,dl)); });
  } else {
    // Sans priorité : l'équipe du jour, répartie également entre les travaux
    // ouverts (ou qui s'ouvrent dans le mois), les plus chargés d'abord.
    out.mode='egal';
    var ts=_PIL_OP_DATA.tasks.filter(function(x){ return x.tot>0.05&&_dzOuvrable(x.nom,refIso); }).sort(function(a,b){ return b.tot-a.tot; }).slice(0,4).map(function(x){ return x.nom; });
    var base=ts.map(function(){ return 0; }); for(var k=0;k<Math.round(nJour)&&ts.length;k++) base[k%ts.length]++;
    ts.forEach(function(t,i){ var nb=Math.max(0,base[i]+(S.rep[t]||0)); out.taches.push(_dzRepTache(t,tous,{anon:nb},refIso,H,null,S.rep[t]||0,nb)); });
  }
  _DZ_REP_LAST=out; return out;
}
function _dzRepFin(R){ var f=R.taches.filter(function(x){ return !x.arret&&x.fin; }).map(function(x){ return x.fin; }).sort(); return f.length?f[f.length-1]:null; }
function _dzRepSim(){ var S=_PIL_SIM||{rep:{}}; return Object.keys(S.rep).some(function(k){ return S.rep[k]; }); }
// MOTS-10 (§594) : « 3 nov. fin prévue » et la même pastille que la tournée ; « au champ » (hors lexique) → « présents ».
function _dzStatRep(R){
  if(!R.taches.length) return _pilStat('\u2014',' rien \u00e0 r\u00e9partir');
  if(R.taches.some(function(x){ return x.arret; })) return _pilStat('\u2014','')+_pilPhPl('un travail ne finit pas','ko');
  var fin=_dzRepFin(R), ko=R.taches.some(function(x){ return !x.rien&&!x.ok; });
  return _pilStat(fin?_dzJc(fin):'\u2014',' fin pr\u00e9vue'+(R.taches.length>1?' des '+R.taches.length+' travaux':''))+(fin?_pilPhPl(ko?'d\u00e9borde':'tient',ko?'ko':'ok'):'');
}
function _dzSubRep(R){ return (R.mode==='prio'?_dzPl(R.taches.length,'priorit\u00e9'):'aucune priorit\u00e9')+' \u00b7 '+_dzPers(R.nJour)+' pr\u00e9sents le '+_dzJc(R.ref)+(_dzRepSim()?' \u00b7 simulation':''); }
function _dzRepHtml(R){
  if(!R.taches.length) return '<div class="pil-empty">Aucun travail ouvert \u00e0 r\u00e9partir.</div>';
  var voir=_pilShow('sim_ordre'), prio=(R.mode==='prio');
  // MOTS-10 (§594) : « À partir du … — même jour, même planning, mêmes trajets que la tournée » : le jour est dans l'en-tête, la
  //   méthode dans le « i » (pil.quifait).
  var h='<div class="pil-dz-rep">';
  R.taches.forEach(function(x,i){
    var sub, d=x.delta||0;
    if(x.equipe){ var ab=x.e0.abs.filter(function(a){ return a.motif!=='hors contrat'&&a.motif!=='pas au planning'; }).map(function(a){ return [a.nom,' (',a.motif,')'].join(''); });
      sub=x.e0.pers.map(function(p){ return p.nom; }).join(', ')+(ab.length?' \u00b7 '+ab.join(', '):''); }
    else sub=prio?'toute l\u2019\u00e9quipe':'part \u00e9gale';
    var tag=x.rien?'<span class="pil-dz-tag ok">rien \u00e0 faire</span>':(x.arret?'<span class="pil-dz-tag gr">\u00e0 l\u2019arr\u00eat</span>'
      :(x.ok?'<span class="pil-dz-tag ok">tient'+(x.f?' \u00b7 '+_dzJc(x.f.fin):'')+'</span>':'<span class="pil-dz-tag ko">d\u00e9borde'+(x.f?' \u00b7 fen\u00eatre '+_dzJc(x.f.fin):'')+'</span>'));
    h+='<div class="pil-dz-rt"><div class="l1"><div class="nm">'+(prio?'<span class="st">'+_mvIcon('etoile',16)+'</span> ':'')+_pilEsc(_opTNom(x.t))
      +'<small>'+_pilEsc(sub+(d?' \u00b7 '+(d>0?'+':'')+d+' simul\u00e9'+(Math.abs(d)>1?'s':''):''))+'</small></div>'
      +'<span class="pil-dz-stp"><button data-sim="dec" data-ti="'+i+'" aria-label="Une personne de moins"'+(x.n>0?'':' disabled')+'>\u2212</button><span class="val">'+_dzPers(x.n)+'</span><button data-sim="inc" data-ti="'+i+'" aria-label="Une personne de plus">+</button></span></div>'
      +'<div class="l2"><span class="fin">'+(x.arret?'ne se termine pas':(x.fin?'fin '+_dzJ(x.fin):''))+'</span>'+tag
      +((voir&&!x.rien)?'<button class="pil-dz-lk" data-sim="voir" data-ti="'+i+'">Voir la tourn\u00e9e \u203a</button>':'')+'</div></div>';
  });
  h+='</div>';
  if(prio){
    var place=R.taches.reduce(function(a,x){ return a+Math.max(0,x.delta||0); },0);
    h+='<div class="pil-dz-lib">'+(R.vide?'Une priorit\u00e9 sans \u00e9quipe affect\u00e9e prend toute l\u2019\u00e9quipe du jour.'
      :(R.libres.length?'Sans priorit\u00e9 ce jour-l\u00e0\u00a0: <b>'+_pilEsc(R.libres.join(', '))+'</b>':'Toute l\u2019\u00e9quipe du jour est affect\u00e9e.'))
      +((!R.vide&&place>R.nLib)?' \u00b7 <b>+'+_dzPl(Math.round(place-R.nLib),'renfort')+'</b> au-del\u00e0':'')+'</div>';
  } else h+='<div class="pil-dz-lib">Sans priorit\u00e9\u00a0: les <b>'+_dzPers(R.nJour)+' pr\u00e9sents</b>, \u00e0 parts \u00e9gales.</div>';
  // MOTS-10 (§594) : le bilan « 3 nov. travail fini » redisait l'en-tête et la ligne du travail : il ne reste que pour plusieurs
  //   travaux (la fin du dernier) ou un travail sans personne. « + ajoute une personne… » (19 mots) est dans le « i ».
  var bloq=R.taches.some(function(x){ return x.arret; }), fin=_dzRepFin(R);
  if(bloq||R.taches.length>1) h+='<div class="pil-dz-bil"><b>'+((bloq||!fin)?'\u2014':_dzJ(fin))+'</b><span>'+(bloq?'un travail sans personne ne finit pas':'les '+R.taches.length+' travaux finis')+'</span></div>';
  if(_dzRepSim()) h+='<div class="pil-dz-reset"><span>Simulation \u2014 rien n\u2019est enregistr\u00e9.</span><button data-sim="reset">\u21ba '+(prio?'Affectation diffus\u00e9e':'R\u00e9partition \u00e9gale')+'</button></div>';
  // Règle ① : qui fait quoi se fixe dans la Vigne (la priorité du moment, administrateur) — un bouton, sous la carte.
  if(_opCanEdit()) h+='<div class="pil-tv-act">'+_pilTvBtn('priorite','Ouvrir la priorit\u00e9 du moment')+'</div>';
  return h;
}
function _pilSimRefresh(){
  var el=document.getElementById('pil-sim-body'); if(!el||!_PIL_OP_DATA) return;
  var R=_dzRep(); el.innerHTML=_dzRepHtml(R);
  _dzMajEntete('simulateur',_dzStatRep(R),_dzSubRep(R));
  _pilDcPhraseMaj();   // MOTS-10 (§594) : la phrase du haut suit la tournée et « Qui fait quoi » (_pilOpRefresh finit ici)
}
function _pilSimAction(act,ti){
  if(!_PIL_SIM) _PIL_SIM={rep:{}};
  var R=_DZ_REP_LAST, x=(R&&R.taches[parseInt(ti,10)])||null;
  if(act==='inc'&&x) _PIL_SIM.rep[x.t]=(_PIL_SIM.rep[x.t]||0)+1;
  else if(act==='dec'&&x){ if(x.n>0) _PIL_SIM.rep[x.t]=(_PIL_SIM.rep[x.t]||0)-1; }
  else if(act==='reset') _PIL_SIM.rep={};
  else if(act==='voir'&&x&&_PIL_OP){
    _PIL_OP.tasks=[x.t]; _PIL_OP.tSrc='main'; _PIL_OP.order=null; _PIL_OP._pick=null; _PIL_OP.ref=null; _PIL_OP.refManuel=false; _PIL_OP.excl={}; _PIL_OP.add={}; _PIL_OP.R=0;
    _pilOpRefresh(); _dzOuvrirCarte('ordrepassage'); return;
  }
  _pilSimRefresh();
}
function _pilPanelSimulateur(d){
  // La tournée a posé le jour et l'équipe ; masquée, on les calcule ici.
  if(!_pilShow('sim_ordre')||!_DZ_LAST){ _opInit(d); _dzCalc(); }
  var R=_dzRep();
  return _pilTile('simulateur','#C9A84C','Qui fait quoi',_dzStatRep(R),_dzSubRep(R),null,'<div id="pil-sim-body">'+_dzRepHtml(R)+'</div>','pil.quifait');
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
function _opApplic(p,def){
  // SEL-1 : Arrachage, Désherbage manuel, Effeuillage suivent la sélection de la campagne (utils.js).
  if(typeof window._mvTacheConcerne==='function') return window._mvTacheConcerne(p,def.nom);
  return !(p.tachesExclues && p.tachesExclues.indexOf(def.nom)>=0);
}
function _opTm(p){ return (typeof window._tachesFor==='function') ? window._tachesFor(p) : (p&&p.taches?p.taches:{}); }
function _opPassHha(def,i){ return (def.passagesHha && def.passagesHha[i-1]!=null) ? def.passagesHha[i-1] : ((def.hha)||0); }
function _opMinTrou(def){ return (typeof window._plantMinTrou==='function') ? window._plantMinTrou() : ((def&&def.minTrou)||3); }
function _opParcByNom(nom){ return (window.PARCELLES||[]).find(function(p){ return p && p.nom===nom; }) || null; }
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
// ★ COMPTE-1 (§353), RESTE-1 (§535) : les trous PRÉVUS de la période — plantés pendant, plus ce qui reste à planter (app.js, _plantParcTrous).
function _opTrousPrevus(p){ return (typeof window._plantParcTrous==='function')?window._plantParcTrous(p):(parseInt(p&&p.plantation_trous)||0); }
function _opParcFull(p,def){
  var surf=parseFloat(p.surface)||0, SP=window.SAISON_PASSAGES||{}, nom=def.nom, s=_opTm(p)[nom];
  // Entreplantation : PILOTEE PAR LES TROUS (tariere). Aucun trou renseigne = 0 h,
  // meme regle que calcHeures (app.js) : « rien a entreplanter ». L'ancien repli
  // surf x 15 h/ha facturait une entreplantation fantome sur TOUTES les parcelles
  // (~ +15 h/ha sur le cout de la saison) alors que l'avancement, lui, comptait 0.
  if(def.trous){ var tr=_opTrousPrevus(p); return tr>0 ? tr*_opMinTrou(def)/60 : 0; }
  if(def.type==='niveaux'){ var rg=SP[nom]||((def.niveaux&&def.niveaux.length)||3); var pOv=(s&&typeof s==='object'&&s.ov!=null)?Math.min(s.ov,rg):rg; return surf*((def.niveaux||[]).filter(function(n){return n.num<=pOv;}).reduce(function(a,n){return a+n.hha;},0)); }
  if(def.type==='passages'){ var pg=SP[nom]||((def.passagesHha&&def.passagesHha.length)||2); var planNb=(s&&typeof s==='object'&&s.ov!=null)?Math.min(s.ov,pg):pg; var h=0; for(var i=1;i<=planNb;i++) h+=_opPassHha(def,i); return surf*h; }
  return surf*((def.hha)||0);
}
function _opParcReste(p,def){
  var surf=parseFloat(p.surface)||0, SP=window.SAISON_PASSAGES||{}, nom=def.nom, s=_opTm(p)[nom];
  if(def.trous){ var tr=(typeof window._plantParcReste==='function')?window._plantParcReste(p):((typeof s==='string' && s==='Validé')?0:_opTrousPrevus(p)); return tr>0 ? tr*_opMinTrou(def)/60 : 0; }   // ★ RESTE-1 (§535) : ce qui reste à planter, parcelle validée ou en cours
  if(def.type==='niveaux'){ var rg=SP[nom]||((def.niveaux&&def.niveaux.length)||3); var allN=def.niveaux||[{num:1,hha:50},{num:2,hha:20},{num:3,hha:20}]; var pOv=(s&&typeof s==='object'&&s.ov!=null)?Math.min(s.ov,rg):rg; var nivsP=allN.filter(function(n){return n.num<=pOv;}), totP=nivsP.reduce(function(a,n){return a+n.hha;},0); if(typeof s==='string') return (s==='Validé')?0:surf*totP; var _rN=window._mvNivH(nivsP,s); return surf*Math.max(0,_rN.total-_rN.done); }
  if(def.type==='passages'){ var pg=SP[nom]||((def.passagesHha&&def.passagesHha.length)||2); var planNb=(s&&typeof s==='object'&&s.ov!=null)?Math.min(s.ov,pg):pg; var htot=0; for(var i=1;i<=planNb;i++) htot+=_opPassHha(def,i); if(typeof s==='string') return (s==='Validé')?0:surf*htot; var doneH=0; for(var j=1;j<=planNb;j++){ if(s&&s['p'+j]==='Validé') doneH+=_opPassHha(def,j); } return surf*(htot-doneH); }
  return (typeof s==='string' && s==='Validé') ? 0 : surf*((def.hha)||0);
}

// ── Multi-tâches : somme sur les tâches sélectionnées (uniquement celles applicables à la parcelle) ──
function _opParcResteM(p){ var defs=_opDefs(), s=0; defs.forEach(function(d){ if(_opApplic(p,d)) s+=_opParcReste(p,d); }); return s; }
function _opParcFullM(p){ var defs=_opDefs(), s=0; defs.forEach(function(d){ if(_opApplic(p,d)) s+=_opParcFull(p,d); }); return s; }
function _opParcPctM(p){ var full=_opParcFullM(p), r=_opParcResteM(p); return full>0?Math.max(0,Math.min(100,Math.round((full-r)/full*100))):100; }
function _opParcTaskNb(p){ return _opDefs().filter(function(d){ return _opApplic(p,d) && _opParcReste(p,d)>0.05; }).length; }
function _opActTodo(){ return _opParcActive().filter(function(p){ return _opParcResteM(p)>0.05; }); }
function _opDoneGeo(){ return _opParcActive().filter(function(p){ return _opParcResteM(p)<=0.05 && _opGeoOK(p); }); }

// ── Départ : dernière parcelle FAITE (l'une des tâches sélectionnées) > centre du vignoble ──
// ★ CIBLE-1 (§163) — « dernière faite » lit la définition unique (`_mvDerniereValidee`, utils.js).
//   La copie privée qui vivait ici départageait un même jour par l'ordre du tableau (le
//   plus récent en tête) avec `>=` : elle retenait la PREMIÈRE parcelle validée du jour.
//   Elle ignorait aussi les annulations. Sans travail coché : pas de départ (inchangé).
function _opDern(garde){ var T=(_PIL_OP&&_PIL_OP.tasks)||[]; return T.length?window._mvDerniereValidee(T,garde):null; }
// ★ CIBLE-1 (§163) — ce que la carte de la tournée entoure : les parcelles COMMENCÉES et pas
//   finies sur un travail coché, sinon la PROCHAINE — le n°1 de la tournée affichée, celle-là
//   même que la carte numérote. Rien sur une période archivée.
function _opCibles(rows){
  var T=(_PIL_OP&&_PIL_OP.tasks)||[];
  if(!rows||!rows.length||!T.length||!window._mvVueActive()) return [];
  var comm=rows.filter(function(r){ return r.geo && T.some(function(t){ return window._mvTacheEtat(r.p,t)==='commencee'&&!(typeof window._mvAuPrestataire==='function'&&window._mvAuPrestataire(r.p,t)); }); });
  if(comm.length) return comm.map(function(r){ return r.p; });
  for(var i=0;i<rows.length;i++){ if(rows[i].geo) return [rows[i].p]; }
  return [];
}
function _opJournalLast(){ var d=_opDern(_opGeoOK); return d?{p:d.p,date:d.date}:null; }
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
function _opEnsureOrder(actTodo){ if(_PIL_OP.order) return; var saved=_opSavedSeed(); _PIL_OP.order=(saved&&saved.length)?saved.slice():_opNNNames(actTodo); }
function _opParcelles(){
  var act=_opActTodo(), byName={}; act.forEach(function(p){ byName[p.nom]=p; });
  _opEnsureOrder(act);
  var ord=_PIL_OP.order||[], out=[];
  ord.forEach(function(nm){ if(byName[nm]){ out.push(byName[nm]); delete byName[nm]; } });
  act.forEach(function(p){ if(byName[p.nom]) out.push(p); });
  _PIL_OP.order=out.map(function(p){return p.nom;});
  return out.map(function(p){ return { p:p, nom:p.nom, s:parseFloat(p.surface)||0, reste:Math.round(_opParcResteM(p)*10)/10, pct:_opParcPctM(p), geo:_opGeoOK(p), emos:_opParcTaskNb(p) }; });
}
// MOTS-10 (§594) : _opDiffusHtml (« Aucune tournée diffusée pour l'instant… », « Diffusé à l'équipe pour : … ») est partie — elle
//   redisait la ligne de la tournée de l'équipe (_dzTriHtml, lue sur _mvTourneeDe), qui seule fait foi depuis TRN-1 (§330).

// ════════════════════════════════════════════════════════════════════
// ★★★ DZ-1 (§162) — DÉCIDER : LA TOURNÉE DU JOUR ET « QUI FAIT QUOI »,
//     LUES AU PLANNING, JOUR PAR JOUR.
// Nico, 20/09/2026 : « par défaut l'effectif réel, le nombre d'heures de la
// journée, le temps de pause et le temps de trajet entre les vignes, et la
// tâche en priorité du moment [...] je veux un outil puissant. » Maquette
// validée (« c'est parfait »), constantes de trajet comprises.
// AVANT : journée 7 h, pause 45 min et trajet 5 min par saut ÉCRITS EN DUR ;
//   effectif lu sur la fenêtre du travail, même passée (« 12 mai → 11 août »
//   affiché un 20 septembre) ; la même équipe supposée chaque jour ; « Et si »
//   divisait par une cadence moyenne sur 28 jours — deux définitions de la
//   journée dans le même onglet. Sur téléphone, la carte prenait le doigt
//   (touch-action:none, mesuré : 405 → 405 px) et la case Trajet sortait de
//   l'écran (x = 430 px sur 390).
// MAINTENANT, UNE lecture pour les deux cartes :
//   travail = la priorité du moment (sinon le plus chargé, et l'écran le dit)
//   jour    = aujourd'hui s'il est travaillé, sinon le prochain ; le premier
//             jour de la fenêtre si elle n'est pas ouverte (on compte les 40
//             du 31 août, pas les 6 du 24)
//   équipe  = les affectés à la priorité, AU PLANNING DE CHAQUE JOUR
//             (_planChampPersRange : congés, récup, arrêts, absences,
//             formation, contrats, collectifs — CHAMP-1)
//   coupure = PLAN_PAUSE_MIN : elle allonge la présence, jamais le travail
//   trajets = calculés parcelle à parcelle (_dzHop), règle du domaine
//             CONFIG.eco.trajet (défaut : à pied ≤ 300 m à 4 km/h, au-delà
//             camion 5 min + 25 km/h, 5 min pour une parcelle sans position)
// Toucher une valeur = simulation ; « ↺ Valeurs réelles » revient au planning.
// ════════════════════════════════════════════════════════════════════
var _DZ_LAST=null, _DZ_REP_LAST=null, _DZ_CACHE={}, _DZ_MBS=null, _dzFmMap=null;
var _DZ_JS=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];
var _DZ_JL=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
var _DZ_MS=['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];
function _dzIso(dt){ return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0'); }
function _dzAuj(){ return _dzIso(new Date()); }
// Midi, pas minuit : un passage a l'heure d'ete ne fait pas sauter un jour.
function _dzDt(iso){ var p=String(iso||'').split('-'); return new Date(+p[0],(+p[1]||1)-1,(+p[2]||1),12,0,0); }
function _dzAdd(iso,n){ var d=_dzDt(iso); d.setDate(d.getDate()+n); return _dzIso(d); }
function _dzEcart(a,b){ return Math.round((_dzDt(b)-_dzDt(a))/86400000); }
function _dzJ(iso){ var d=_dzDt(iso), n=d.getDate(); return _DZ_JS[d.getDay()]+' '+(n===1?'1er':n)+' '+_DZ_MS[d.getMonth()]; }
function _dzJc(iso){ var d=_dzDt(iso), n=d.getDate(); return (n===1?'1er':n)+' '+_DZ_MS[d.getMonth()]; }
function _dzHj(h){ var r=Math.round((h||0)*2)/2; return (r%1===0?String(r):r.toLocaleString('fr-FR'))+'\u00a0h'; }
function _dzMin(m){ m=Math.round(m||0); if(m<60) return m+'\u00a0min'; var h=Math.floor(m/60), r=m%60; return h+'\u00a0h'+(r?('\u00a0'+String(r).padStart(2,'0')):''); }
function _dzPers(n){ return (Math.round((n||0)*10)/10).toLocaleString('fr-FR'); }
function _dzPl(n,s,p){ return n+'\u00a0'+(Math.abs(n)>1?(p||s+'s'):s); }
function _dzPt(s){ s=String(s); return /\.$/.test(s)?s:s+'.'; }
function _dzHm(deb,plus){ var p=String(deb||'').split(':'); if(p.length<2) return ''; var m=(+p[0])*60+(+p[1])+Math.round(plus||0); return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); }
function _dzDoigt(){ try{ return !!(window.matchMedia&&window.matchMedia('(pointer: coarse)').matches); }catch(e){ if(DEBUG) console.warn('[pilotage] pointeur', e); return false; } }

// ── L'équipe au planning, personne par personne, jour par jour ──
// ★★ CHAMP-1 (23/09/2026) — Nico : « une personne en formation, en arrêt, en cp,
//   absente ne doit pas être comptée dans l'effectif du jour pour l'organisation
//   des travaux ». La journée venait de _planWorkPersRange, le TRAVAIL EFFECTIF de
//   la loi : une formation ou un événement familial y valent la journée entière
//   (assimilés, et c'est juste pour la paie et l'annualisation). La tournée comptait
//   donc un salarié en CFA dans l'équipe du jour. Elle lit désormais
//   _planChampPersRange (planning.js) : même parcours, mêmes contrats, même effectif
//   collectif, mais la formation et l'événement familial valent 0 ; une absence sur
//   une partie de la journée n'ampute que ses heures. Congé, récup, arrêt et absence
//   valaient déjà 0. La masse salariale et la cadence restent sur le travail effectif.
function _dzMbs(){
  if(_DZ_MBS) return _DZ_MBS;
  var o={}; (window.MEMBRES||[]).forEach(function(m){ if(m&&m.nom&&!m.bureau&&m.statut!=='Inactif') o[m.nom]=m; });
  _DZ_MBS=o; return o;
}
function _dzOublier(){ _DZ_CACHE={}; _DZ_MBS=null; }
function _dzColl(m){ return !!(typeof window._mvEstCollectif==='function'&&window._mvEstCollectif(m)); }
function _dzJourMbr(m,iso){
  var k=m.nom+'|'+iso; if(_DZ_CACHE[k]) return _DZ_CACHE[k];
  var out={h:0,n:0,pH:0};
  try{
    var dt=_dzDt(iso), pH=(typeof window._planChampPersRange==='function')?(window._planChampPersRange(m,dt,dt)||0):0;
    if(pH>0.01){
      var n=1;
      if(_dzColl(m)){
        var y=dt.getFullYear(), mi=dt.getMonth(), dd=dt.getDate();
        n=(typeof window._planSurAnnee==='function'&&typeof window._planEffN==='function')
          ? window._planSurAnnee(y,function(){ return window._planEffN(m,mi,dd); })
          : ((typeof window._mvEffDef==='function')?window._mvEffDef(m):1);
        if(!(n>=1)) n=1;
      }
      out={h:pH/n,n:n,pH:pH};
    }
  }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_dzJourMbr'); }
  _DZ_CACHE[k]=out; return out;
}
function _dzEnt(m,iso){ var dt=_dzDt(iso); return (((((window.PLANNING_ENTRIES||{})[m.nom]||{})[dt.getFullYear()]||{})[dt.getMonth()]||{})[dt.getDate()])||null; }
function _dzMotif(m,iso){
  var e=_dzEnt(m,iso);
  if(e){
    if(e.type==='cp') return 'en cong\u00e9'; if(e.type==='recup') return 'en r\u00e9cup';
    // CHAMP-1 : le motif dit POURQUOI la personne manque — formation et arrêt en clair.
    if(e.absent){ var mo=(e.motif||''); return mo==='formation'?'en formation':mo==='arret'?'en arr\u00eat':mo==='famille'?'absent \u00b7 \u00e9v\u00e9nement familial':'absent'; }
  }
  if(typeof window._mvEnContratLe==='function'&&!window._mvEnContratLe(m,iso)) return 'hors contrat';
  return 'pas au planning';
}
// L'heure de prise, pour dire « sur place 08:00 → 16:00 ». Lue, jamais inventée :
// sans horaire au planning, l'écran donne la durée de présence seule.
function _dzHoraire(m,iso){
  var r={deb:null,continu:false};
  try{
    var e=_dzEnt(m,iso);
    if(e&&e.timing&&e.timing.debut){ r.deb=e.timing.debut; r.continu=!!e.timing.continu; return r; }
    var dt=_dzDt(iso), T=((window.PLANNING_TEMPLATES||{})[dt.getFullYear()]||{})[m.planning_id||'standard'];
    var mt=T&&T._timings&&T._timings[dt.getMonth()];
    if(mt){ r.deb=mt.d||mt.debut||null; r.continu=!!mt.continu; }
  }catch(e2){ if(window._mvAvale) window._mvAvale(e2,'pilotage.js/_dzHoraire'); }
  return r;
}
function _dzCtx(noms,o){ o=o||{}; return {noms:noms||[],R:o.R||0,J:(o.J!=null?o.J:null),coup:(o.coup!=null?o.coup:null),anon:(o.anon!=null?o.anon:null)}; }
// Une journée d'équipe : n personnes, C heures-personnes, J la journée la plus
// longue (le temps de calendrier de l'équipe), la coupure, les absents.
function _dzEquipeJour(iso,ctx){
  var mbs=_dzMbs(), out={iso:iso,n:0,C:0,J:0,pers:[],abs:[],coup:0,deb:null,continu:false}, jm=0;
  ctx.noms.forEach(function(nm){
    var m=mbs[nm]; if(!m) return;
    var j=_dzJourMbr(m,iso);
    if(j.pH>0.01){
      var h=(ctx.J!=null)?ctx.J:j.h;
      out.n+=j.n; out.C+=h*j.n; if(h>jm) jm=h;
      out.pers.push({nom:nm,h:h,n:j.n});
      if(out.deb==null){ var t=_dzHoraire(m,iso); out.deb=t.deb; out.continu=t.continu; }
    } else out.abs.push({nom:nm,motif:_dzMotif(m,iso)});
  });
  if(!(jm>0)){ out.n=0; out.C=0; return out; }
  out.J=jm;
  if(ctx.anon!=null){ out.n=ctx.anon; out.C=ctx.anon*jm; }
  if(ctx.R){ out.n=Math.max(0,out.n+ctx.R); out.C=Math.max(0,out.C+ctx.R*jm); }
  var P=(window.PLAN_PAUSE_MIN!=null)?window.PLAN_PAUSE_MIN:60;
  out.coup=(ctx.coup!=null)?ctx.coup:((!out.continu&&jm>=6)?P:0);
  return out;
}
function _dzSuivant(iso,ctx,sens){ var g=0; do{ iso=_dzAdd(iso,sens||1); g++; }while(g<400&&!(_dzEquipeJour(iso,ctx).n>0)); return (g<400)?iso:null; }

// ── Le travail, sa fenêtre, la priorité ──
function _dzFen(t,depuis){
  var sa=(typeof window._pilSaison==='function')?window._pilSaison():null;
  if(!sa||typeof window._mvFenetre!=='function') return null;
  var f=window._mvFenetre(sa,[t],depuis||_dzAuj());
  return (f&&f.parTache&&f.parTache[0])||null;
}
function _dzOuvrable(t,iso){ var f=_dzFen(t,iso); return !f||(f.fin>=iso&&f.debut<=_dzAdd(iso,30)); }
function _dzPrioItems(){ return (typeof window._prioItems==='function')?(window._prioItems()||[]):[]; }
function _dzPrios(){ var D=_PIL_OP_DATA; return _dzPrioItems().filter(function(it){ return D&&D.byNom[it.t]&&D.byNom[it.t].tot>0.05; }); }
function _dzTachesDefaut(){
  var D=_PIL_OP_DATA, its=_dzPrios();
  if(its.length) return {t:[its[0].t],src:'prio'};
  // PRIO-1 (§235) : sans priorité fixée, LA règle commune (window._mvTacheDuMoment, app.js), la même que
  //   la carte d'Aujourd'hui et Ma part du chantier. Plusieurs tâches dans leurs dates en même temps :
  //   toutes cochées — l'appli ne choisit pas à la place de l'admin. Avant : le travail ouvert qui avait
  //   le plus d'heures restantes.
  var M=(typeof window._mvTacheDuMoment==='function')
    ? window._mvTacheDuMoment({ saison:(typeof window._pilSaison==='function')?window._pilSaison():null,
        noms:D.tasks.map(function(x){ return x.nom; }),
        fini:function(n){ return !(D.byNom[n]&&D.byNom[n].tot>0.05); } })
    : null;
  var ok=M?M.taches.filter(function(n){ return D.byNom[n]&&D.byNom[n].tot>0.05; }):[];
  if(ok.length&&M.mode!=='admin') return {t:(M.mode==='choix')?ok:[ok[0]],src:M.mode};
  // Repli, si la règle ne rend rien de lisible : l'ancien choix.
  var best=null;
  D.tasks.forEach(function(x){ if(x.tot>0.05&&(!best||x.tot>best.tot)) best=x; });
  if(!best) best=D.tasks[0]||null;
  return {t:best?[best.nom]:[],src:'charge'};
}
// L'équipe de départ : les affectés à la priorité des travaux cochés ; sans
// équipe affectée, toute l'équipe au champ (bureau et fiches inactives exclus).
function _dzBase(tasks){
  var mbs=_dzMbs(), noms=[], vu={}, nP=0;
  _dzPrioItems().forEach(function(it){ if(tasks.indexOf(it.t)<0) return; nP++; (it.equipe||[]).forEach(function(n){ if(mbs[n]&&!vu[n]){ vu[n]=1; noms.push(n); } }); });
  if(noms.length) return {noms:noms,src:'prio'};
  return {noms:Object.keys(mbs),src:(nP?'prio-vide':'tous')};
}
function _dzTourCtx(){
  var OP=_PIL_OP, b=_dzBase(OP.tasks||[]);
  var noms=b.noms.filter(function(n){ return !OP.excl[n]; });
  Object.keys(OP.add).forEach(function(n){ if(OP.add[n]&&noms.indexOf(n)<0) noms.push(n); });
  var c=_dzCtx(noms,{R:OP.R,J:OP.J,coup:OP.coup}); c.base=b; return c;
}
function _dzRefAuto(tasks,ctx){
  var auj=_dzAuj(), f0=null;
  tasks.forEach(function(t){ var f=_dzFen(t,auj); if(f&&f.debut&&(!f0||f.debut<f0)) f0=f.debut; });
  var fut=!!(f0&&f0>auj), from=fut?f0:auj;
  for(var i=0;i<120;i++){ var iso=_dzAdd(from,i); if(_dzEquipeJour(iso,ctx).n>0) return {iso:iso,why:(iso===auj?'auj':(fut?'fen':'suiv'))}; }
  return {iso:from,why:'aucun'};
}
function _dzRef(ctx){ var a=_dzRefAuto(_PIL_OP.tasks||[],ctx); if(_PIL_OP.refManuel&&_PIL_OP.ref) return {iso:_PIL_OP.ref,why:'main',auto:a}; return a; }
function _dzPourquoi(ref){
  var auj=_dzAuj(), w=_dzDt(auj).getDay();
  if(ref.why==='auj') return 'aujourd\u2019hui';
  if(ref.why==='main') return 'choisi \u00e0 la main';
  if(ref.why==='fen') return 'd\u00e9but de la fen\u00eatre \u00b7 dans '+_dzPl(_dzEcart(auj,ref.iso),'jour');
  if(ref.why==='suiv') return 'prochain jour travaill\u00e9 \u00b7 '+((w===0||w===6)?'aujourd\u2019hui '+_DZ_JL[w]:'personne de l\u2019\u00e9quipe au planning aujourd\u2019hui');
  return 'aucun jour travaill\u00e9 trouv\u00e9 au planning';
}

// ── Les trajets : une règle, réglable, appliquée à chaque déplacement ──
var _DZ_H0={pied_m:300,pied_kmh:4,fixe_min:5,camion_kmh:25,sans_min:5};
var _DZ_HB={pied_m:[0,1500,50],pied_kmh:[1,8,0.5],fixe_min:[0,30,1],camion_kmh:[5,60,5],sans_min:[0,60,1]};
function _dzHDom(){ var c=(window.CONFIG&&window.CONFIG.eco&&window.CONFIG.eco.trajet)||null, o={}; Object.keys(_DZ_H0).forEach(function(k){ var v=c?parseFloat(c[k]):NaN; o[k]=isFinite(v)?v:_DZ_H0[k]; }); return o; }
function _dzH(){ return (_PIL_OP&&_PIL_OP.H)?_PIL_OP.H:_dzHDom(); }
function _dzHMod(){ if(!_PIL_OP||!_PIL_OP.H) return false; var d=_dzHDom(); return Object.keys(_DZ_H0).some(function(k){ return _PIL_OP.H[k]!==d[k]; }); }
function _dzHop(a,b,H){
  if(!_opGeoOK(a)||!_opGeoOK(b)) return {m:null,min:H.sans_min,mode:'gps'};
  var d=_opHav(a,b);
  if(d<=H.pied_m) return {m:d,min:d/1000/Math.max(0.5,H.pied_kmh)*60,mode:'pied'};
  return {m:d,min:H.fixe_min+d/1000/Math.max(1,H.camion_kmh)*60,mode:'camion'};
}
function _dzHSave(){
  if(!_opCanEdit()||!_PIL_OP||!_PIL_OP.H) return;
  window.CONFIG=window.CONFIG||{}; window.CONFIG.eco=window.CONFIG.eco||{};
  var o={}; Object.keys(_DZ_H0).forEach(function(k){ o[k]=_PIL_OP.H[k]; });
  window.CONFIG.eco.trajet=o;
  if(typeof window.saveData==='function') window.saveData('config');
  _PIL_OP.H=null;
  if(window.showToast) window.showToast('R\u00e8gle des trajets gard\u00e9e pour le domaine','#3D6B27');
  _pilOpRefresh();
}

// ── LA SIMULATION : jour après jour, avec l'équipe du planning de chaque jour ──
// Le trajet est du temps de CALENDRIER d'équipe (tout le monde se déplace) ;
// le travail se partage entre les présents : C/J personnes équivalentes.
function _dzSimuler(rows,refIso,ctx,H){
  var days=[], iso=refIso, bloque=false;
  if(!(_dzEquipeJour(iso,ctx).n>0)){ iso=_dzSuivant(iso,ctx,1); if(!iso) return {days:[],per:[],bloque:true}; }
  function mk(i){ var e=_dzEquipeJour(i,ctx); return {iso:i,n:e.n,C:e.C,J:e.J,coup:e.coup,deb:e.deb,pers:e.pers,abs:e.abs,used:0,work:0,traj:0,surf:0,parcs:[],done:{},reprise:null}; }
  var d=mk(iso), guard=0;
  function next(){ days.push(d); if(days.length>=400){ bloque=true; return false; } var n=_dzSuivant(d.iso,ctx,1); if(!n){ bloque=true; return false; } d=mk(n); return true; }
  var per=rows.map(function(r){ return {h0:r.reste,rem:r.reste,d0:null,d1:null}; });
  for(var i=0;i<rows.length&&!bloque;i++){
    var r=rows[i];
    if(i>0){ var t=_dzHop(rows[i-1].p,r.p,H).min/60;
      while(t>1e-9&&!bloque){ var fr=d.J-d.used; if(fr<=1e-9){ if(!next()) break; continue; } var c=Math.min(t,fr); d.used+=c; d.traj+=c*60; t-=c; } }
    while(per[i].rem>1e-9&&!bloque&&guard<50000){
      guard++;
      var free=d.J-d.used;
      if(free<=1e-9||!(d.C>0)){ if(!next()) break; if(per[i].d0!=null&&d.reprise==null) d.reprise=i; continue; }
      var neff=d.C/d.J, done=Math.min(per[i].rem,free*neff);
      d.used+=done/neff; d.work+=done; per[i].rem-=done; d.surf+=(per[i].h0>0?done/per[i].h0:0)*r.s;
      d.done[i]=(d.done[i]||0)+done;
      if(per[i].d0==null) per[i].d0=days.length;
      per[i].d1=days.length;
      if(d.parcs[d.parcs.length-1]!==i) d.parcs.push(i);
    }
  }
  days.push(d);
  return {days:days,per:per,bloque:bloque};
}
// La fenêtre de CHAQUE travail coché, jamais l'enveloppe. « Il faudrait N
// personnes » sort de la MÊME simulation, relancée avec N de plus.
function _dzVerdict(rows,sim,refIso,ctx,H){
  var fin=sim.days.length?sim.days[sim.days.length-1].iso:null, out=[];
  (_PIL_OP.tasks||[]).forEach(function(t){
    var f=_dzFen(t,refIso); if(!f) return;
    var passee=f.fin<refIso, ok=!sim.bloque&&!!fin&&fin<=f.fin;
    var jr=0, x=refIso; for(var g=0;g<400&&x<=f.fin;g++){ if(_dzEquipeJour(x,ctx).n>0) jr++; x=_dzAdd(x,1); }
    var over=ok?0:sim.days.filter(function(dd){ return dd.iso>f.fin; }).length, besoin=null;
    if(!ok&&!passee&&!sim.bloque){
      for(var k=1;k<=40;k++){
        var s2=_dzSimuler(rows,refIso,Object.assign({},ctx,{R:(ctx.R||0)+k}),H), f2=s2.days.length?s2.days[s2.days.length-1].iso:null;
        if(!s2.bloque&&f2&&f2<=f.fin){ besoin=k; break; }
      }
    }
    out.push({t:t,ok:ok,fin:fin,f:f,jr:jr,over:over,besoin:besoin,passee:passee});
  });
  return out;
}
function _dzEqMod(){ var OP=_PIL_OP; return Object.keys(OP.excl).some(function(k){ return OP.excl[k]; })||Object.keys(OP.add).some(function(k){ return OP.add[k]; })||!!OP.R; }
function _dzMod(){ var OP=_PIL_OP; return _dzEqMod()||OP.J!=null||OP.coup!=null||!!OP.refManuel||_dzHMod(); }
// Un seul calcul par rendu : l'en-tête, le résultat, la carte et la liste
// lisent le même objet — deux calculs finissent toujours par se contredire.
function _dzCalc(){
  var ctx=_dzTourCtx(), ref=_dzRef(ctx), H=_dzH(), rows=_opParcelles();
  var hops=rows.map(function(r,i){ return i?_dzHop(rows[i-1].p,r.p,H):null; });
  var sim=rows.length?_dzSimuler(rows,ref.iso,ctx,H):{days:[],per:[],bloque:false};
  var e0=_dzEquipeJour(ref.iso,ctx), eP=_dzEquipeJour(ref.iso,_dzCtx(ctx.noms,{R:ctx.R}));
  var ver=(rows.length&&sim.days.length)?_dzVerdict(rows,sim,ref.iso,ctx,H):[];
  var sp=_opStartResolve(rows.filter(function(r){ return r.geo; }).map(function(r){ return r.p; }));
  var traj=0, km=0; hops.forEach(function(h){ if(h){ traj+=h.min; km+=(h.m||0); } });
  _DZ_LAST={ctx:ctx,ref:ref,H:H,rows:rows,hops:hops,sim:sim,e0:e0,jPlan:eP.J,coupPlan:eP.coup,ver:ver,sp:sp,startPt:sp?sp.p:null,traj:traj,km:km};
  return _DZ_LAST;
}
// MOTS-10 (§594) : « 6 jours · fin prévue 3 nov. » et la pastille du verdict (tient, déborde, ne finit pas) — « pour finir » est
//   hors du lexique (§580c). Aucune pastille quand aucun travail coché n'a de fenêtre : rien à quoi se comparer.
function _dzStatTour(C){
  if(!C.rows.length) return _pilStat('\u2713',' rien \u00e0 faire');
  if(!C.sim.days.length) return _pilStat('\u2014',' personne au planning');
  var n=C.sim.days.length, fin=C.sim.days[n-1].iso;
  return _pilStat(n,(n>1?' jours':' jour')+' \u00b7 fin pr\u00e9vue '+_dzJc(fin))+_dzPlTour(C);
}
function _dzPlTour(C){
  if(C.sim.bloque) return _pilPhPl('ne finit pas','ko');
  if(!C.ver.length) return '';
  return C.ver.some(function(v){ return !v.ok; })?_pilPhPl('d\u00e9borde','ko'):_pilPhPl('tient','ok');
}
function _dzSubTour(C){
  return (_PIL_OP.tasks||[]).map(_opTNom).join(' + ')+' \u00b7 d\u00e8s le '+_dzJc(C.ref.iso)+' \u00b7 '+_dzPers(C.e0.n)+' pers. \u00d7 '+_dzHj(C.e0.J)+(_dzMod()?' \u00b7 simulation':'');
}
function _dzMajEntete(id,stat,sub){
  var t=document.querySelector('.pil-tile[data-pid="'+id+'"]'); if(!t) return;
  var l2=t.querySelector('.pil-th-l2'); if(l2) l2.innerHTML=stat;
  var s=t.querySelector('.pil-tsub'); if(s) s.textContent=sub;
}

// ── LE RENDU DE LA TOURNÉE ──
function _opBodyC(C){
  var D=_PIL_OP_DATA, OP=_PIL_OP, edit=_opCanEdit();
  if(!D||!D.tasks.length) return '<div class="pil-empty">Aucune t\u00e2che de saison \u00e0 planifier.</div>';
  var h='<div class="pil-dz-wrap"><div class="pil-dz-a">'+_dzJourHtml(C)+_dzTravauxHtml(edit);
  if(!C.rows.length) return h+'<div class="pil-dz-hero"><div class="k">R\u00e9sultat</div><div class="stop">'+_mvIcon('check',20)+'Rien \u00e0 faire pour '+((OP.tasks||[]).length>1?'ces travaux':'ce travail')+'</div></div></div></div>'+_dzOverlays(C);
  h+=_dzReglagesHtml(C)+_dzResultatHtml(C)+'</div><div class="pil-dz-b">'+_opMapHtml(C)+_dzTriHtml(C,edit)+_dzListeHtml(C,edit)+'</div></div>';
  return h+_dzOverlays(C);
}
function _dzJourHtml(C){
  var prev=_dzSuivant(C.ref.iso,C.ctx,-1), canPrev=!!(prev&&prev>=_dzAuj());
  return '<div class="pil-dz-lbl">Pour quel jour</div><div class="pil-dz-day">'
    +'<button class="nav" data-op="day" data-d="-1" aria-label="Jour travaill\u00e9 pr\u00e9c\u00e9dent"'+(canPrev?'':' disabled')+'>\u2039</button>'
    +'<div class="mid"><b>'+_dzJ(C.ref.iso)+'</b><span>'+_pilEsc(_dzPourquoi(C.ref))+'</span></div>'
    +'<button class="nav" data-op="day" data-d="1" aria-label="Jour travaill\u00e9 suivant">\u203a</button></div>';
}
function _dzTravauxHtml(edit){
  var D=_PIL_OP_DATA, OP=_PIL_OP, its=_dzPrios(), pn={}, mbs=_dzMbs(), auj=_dzAuj();
  its.forEach(function(it){ pn[it.t]=1; });
  var autres=D.tasks.filter(function(x){ return !pn[x.nom]&&x.tot>0.05; });
  var autresOn=autres.filter(function(x){ return OP.tasks.indexOf(x.nom)>=0; });
  function chip(nom,prio,small){
    var on=OP.tasks.indexOf(nom)>=0, tag=edit?'button':'span';
    return '<'+tag+' class="pil-dz-chip'+(on?' on':'')+'"'+(edit?' data-op="task" data-nom="'+_pilEsc(nom)+'"':'')+'>'
      +(prio?'<span class="st">'+_mvIcon('etoile',16)+'</span>':(on?_mvIcon('check',16):''))
      +_pilEsc(_opTNom(nom))+(small?' <small>\u00b7 '+small+'</small>':'')+'</'+tag+'>';
  }
  var h='<div class="pil-dz-lbl">Le travail'+(its.length?'<span class="r">priorit\u00e9 du moment</span>':'')+'</div><div class="pil-dz-chips">';
  its.forEach(function(it){ var n=(it.equipe||[]).filter(function(x){ return mbs[x]; }).length; h+=chip(it.t,true,n?String(n):''); });
  (OP._autres?autres:autresOn).forEach(function(x){ var f=_dzFen(x.nom,auj); h+=chip(x.nom,false,(f&&f.debut>auj)?'d\u00e8s le '+_dzJc(f.debut):''); });
  var nA=autres.length-(OP._autres?0:autresOn.length);
  if(autres.length&&(OP._autres||nA>0)) h+='<button class="pil-dz-more" data-op="autres">'+(OP._autres?'moins':'autres travaux ('+nA+')')+'</button>';
  h+='</div>';
  // MOTS-10 (§594) : pourquoi ce travail est coché, en une ligne ; le chemin de la priorité est dans le « i » (pil.tournee) et sous
  //   « Qui fait quoi » (« Ouvrir la priorité du moment »). « restantes » était hors du lexique.
  if(!its.length&&OP.tSrc==='charge') h+='<div class="pil-dz-note">Sans priorit\u00e9\u00a0: le travail qui a le plus d\u2019heures \u00e0 faire.</div>';
  if(!its.length&&OP.tSrc==='dates') h+='<div class="pil-dz-note">Sans priorit\u00e9\u00a0: la seule t\u00e2che dans ses dates.</div>';
  if(!its.length&&OP.tSrc==='choix') h+='<div class="pil-dz-note">'+OP.tasks.length+' t\u00e2ches dans leurs dates\u00a0: toutes coch\u00e9es.</div>';
  if(!its.length&&OP.tSrc==='prochaine') h+='<div class="pil-dz-note">Aucune t\u00e2che dans ses dates\u00a0: la prochaine.</div>';
  if((OP.tasks||[]).length>1) h+='<div class="pil-dz-note">'+OP.tasks.length+' travaux\u00a0: tous faits sur une parcelle avant la suivante.</div>';
  return h;
}
// MOTS-10 (§594) : « toute l'équipe au champ » (hors lexique) ne disait rien de plus que le chiffre ; restent l'équipe affectée à la
//   priorité, une équipe collective, les absents — ce qui explique le chiffre.
function _dzEqSrc(C){
  var b=C.ctx.base, e=C.e0, out=[];
  if(b.src==='prio') out.push('affect\u00e9e \u00e0 la priorit\u00e9');
  var coll=e.pers.filter(function(p){ return p.n>1; }).map(function(p){ return ['dont',p.nom,'\u00d7'+p.n].join(' '); });
  var abs=e.abs.filter(function(a){ return a.motif!=='hors contrat'&&a.motif!=='pas au planning'; }).map(function(a){ return [a.nom,a.motif].join(' '); });
  if(abs.length>2) abs=abs.slice(0,2).concat(['+'+(abs.length-2)]);
  if(coll.length) out.push(coll.join(', '));
  if(abs.length) out.push(abs.join(', '));
  return out.join(' \u00b7 ');
}
function _dzReglagesHtml(C){
  var OP=_PIL_OP, e=C.e0, mod=_dzMod(), eqMod=_dzEqMod(), jMod=OP.J!=null, cMod=OP.coup!=null, hMod=_dzHMod();
  var nH=C.hops.filter(Boolean).length, moy=nH?C.traj/nH:0, sansG=C.hops.filter(function(x){ return x&&x.mode==='gps'; }).length;
  var h='<div class="pil-dz-lbl">La journ\u00e9e de l\u2019\u00e9quipe<span class="r">'+(mod?'valeurs modifi\u00e9es':'lues au planning')+'</span></div><div class="pil-dz-grid">';
  h+='<button class="pil-dz-set'+(eqMod?' mod':'')+'" data-op="sheet" data-k="equipe"><span class="k">'+_mvIcon('equipe',16)+'\u00c9quipe</span>'
    +'<span class="v"><b>'+_dzPers(e.n)+'<small>pers.</small></b><span class="pil-dz-go">\u203a</span></span>'
    +'<span class="src'+(eqMod?' mod':'')+'">'+_pilEsc(eqMod?'modifi\u00e9e \u2014 simulation':_dzEqSrc(C))+'</span></button>';
  h+='<div class="pil-dz-set'+(jMod?' mod':'')+'"><span class="k">'+_mvIcon('chrono',16)+'Travail</span>'
    +'<span class="v"><b>'+_dzHj(e.J)+'</b><span class="pil-dz-stp"><button data-op="stp" data-k="jour" data-d="-0.5" aria-label="Journ\u00e9e plus courte"'+(e.J<=1?' disabled':'')+'>\u2212</button><button data-op="stp" data-k="jour" data-d="0.5" aria-label="Journ\u00e9e plus longue"'+(e.J>=12?' disabled':'')+'>+</button></span></span>'
    +'<span class="src'+(jMod?' mod':'')+'">'+(jMod?'modifi\u00e9 \u2014 planning\u00a0: '+_dzHj(C.jPlan):'')+'</span></div>';
  h+='<div class="pil-dz-set'+(cMod?' mod':'')+'"><span class="k">'+_mvIcon('repas',16)+'Coupure</span>'
    +'<span class="v"><b>'+_dzMin(e.coup)+'</b><span class="pil-dz-stp"><button data-op="stp" data-k="coup" data-d="-15" aria-label="Coupure plus courte"'+(e.coup<=0?' disabled':'')+'>\u2212</button><button data-op="stp" data-k="coup" data-d="15" aria-label="Coupure plus longue"'+(e.coup>=180?' disabled':'')+'>+</button></span></span>'
    +'<span class="src'+(cMod?' mod':'')+'">'+(cMod?'modifi\u00e9e \u2014 planning\u00a0: '+_dzMin(C.coupPlan):'')+'</span></div>';
  h+='<button class="pil-dz-set'+(hMod?' mod':'')+'" data-op="sheet" data-k="trajet"><span class="k">'+_mvIcon('route',16)+'Trajets</span>'
    +'<span class="v"><b>'+(nH?'environ\u00a0'+_dzMin(moy):'\u2014')+'</b><span class="pil-dz-go">\u203a</span></span>'
    +'<span class="src'+(hMod?' mod':'')+'">'+(hMod?'r\u00e8gle modifi\u00e9e \u2014 simulation':(nH?(sansG?sansG+' sans position':''):'une seule parcelle'))+'</span></button>';
  h+='</div>';
  if(mod) h+='<div class="pil-dz-reset"><span>Simulation \u2014 rien n\u2019est enregistr\u00e9.</span><button data-op="reset">\u21ba Valeurs r\u00e9elles</button></div>';
  return h;
}
function _dzSuiteTxt(sim){
  var d=sim.days; if(d.length<2) return '';
  var n0=d[0].n, au=d.slice(1).map(function(x){ return x.n; });
  if(!au.some(function(v){ return Math.abs(v-n0)>0.05; })) return '';
  var mx=Math.max.apply(0,au), mn=Math.min.apply(0,au);
  return _dzPers(n0)+' pers. le 1er jour, '+((Math.abs(mx-mn)<0.05)?_dzPers(mx)+' ensuite':'de '+_dzPers(mn)+' \u00e0 '+_dzPers(mx)+' ensuite');
}
function _dzHoraireTxt(d){
  if(d.deb) return 'Sur place '+d.deb+' \u2192 '+_dzHm(d.deb,d.J*60+(d.coup||0))+(d.coup?' \u00b7 coupure '+_dzMin(d.coup):' \u00b7 sans coupure');
  return 'Pr\u00e9sence '+_dzHj(d.J+(d.coup||0)/60)+' \u00b7 '+_dzHj(d.J)+' de travail'+(d.coup?' + '+_dzMin(d.coup)+' de coupure':'');
}
// ════════════════════════════════════════════════════════════════════════
// TOUR-RDT (§216) — LE RENDEMENT DE LA TOURNÉE
// Lu sur la MÊME simulation que le reste de la carte (_dzSimuler), jamais un
// second calcul : le temps de l'équipe sur les parcelles face au temps de trajet
// (heures de CALENDRIER de l'équipe : tout le monde se déplace), le coût de
// l'équipe pour la tournée, et le revient à l'hectare. Puis la même tournée dans
// l'ordre « au plus proche » (_opNNNames, le tri déjà proposé au-dessus), pour
// comparer.
// Coût d'un jour = Σ heures × effectif × taux de chacun à cette date
// (_mvPaieTauxEffAt), taux moyen (_ecoRate) pour qui n'a pas de taux et pour les
// personnes ajoutées sans nom (renfort simulé). La tournée ne paie que la part du
// jour qu'elle occupe (used ÷ J) : le dernier jour, l'équipe passe à autre chose.
// Sans aucun taux lisible (profil non admin), le coût est un tiret, jamais zéro.
// ════════════════════════════════════════════════════════════════════════
function _dzCoutJour(d,ctx){
  var r0=_ecoRate(), mbs=_dzMbs(), eur=0, nSans=0, nNom=0;
  if(ctx&&ctx.anon!=null){
    if(!(r0>0)) return {eur:null, nSans:0};
    return {eur:ctx.anon*d.J*r0, nSans:ctx.anon};
  }
  for(var i=0;i<(d.pers||[]).length;i++){
    var p=d.pers[i], m=mbs[p.nom], n=(p.n>0?p.n:1);
    var tx=(m&&typeof window._mvPaieTauxEffAt==='function')?Number(window._mvPaieTauxEffAt(m,d.iso)):0;
    if(!(isFinite(tx)&&tx>0)){ if(!(r0>0)) return {eur:null, nSans:0}; tx=r0; nSans+=n; }
    eur+=p.h*n*tx; nNom+=n;
  }
  var extra=Math.max(0,(d.n||0)-nNom);   // renfort simulé : sans nom, au taux moyen
  if(extra>0){ if(!(r0>0)) return {eur:null, nSans:0}; eur+=extra*d.J*r0; nSans+=extra; }
  return {eur:eur, nSans:nSans};
}
function _dzRdtSim(rows,sim,H,ctx){
  var o={jours:sim.days.length, used:0, traj:0, surf:0, cout:0, nSans:0, pied:0, cam:0, gps:0, bloque:!!sim.bloque}, ok=true;
  sim.days.forEach(function(d){
    o.used+=d.used; o.traj+=d.traj; o.surf+=d.surf;
    var c=_dzCoutJour(d,ctx);
    if(c.eur==null){ ok=false; return; }
    o.cout+=c.eur*(d.J>0?Math.min(1,d.used/d.J):0); o.nSans=Math.max(o.nSans,c.nSans);
  });
  rows.forEach(function(r,i){ if(!i) return; var hp=_dzHop(rows[i-1].p,r.p,H);
    if(hp.mode==='pied') o.pied+=hp.min; else if(hp.mode==='camion') o.cam+=hp.min; else o.gps+=hp.min; });
  o.utile=(o.used>0)?Math.max(0,o.used-o.traj/60)/o.used:null;
  if(!ok) o.cout=null;
  o.eurHa=(o.cout!=null&&o.surf>0)?o.cout/o.surf:null;
  return o;
}
function _dzRendement(C){
  if(C.rdt!==undefined) return C.rdt;
  var r=null;
  if(C.rows.length&&C.sim.days.length){
    var A=_dzRdtSim(C.rows,C.sim,C.H,C.ctx), B=null, same=true;
    var nn=_opNNNames(_opActTodo()), cur=C.rows.map(function(x){ return x.nom; });
    if(nn.join('|')!==cur.join('|')){
      var by={}; C.rows.forEach(function(x){ by[x.nom]=x; });
      var rowsB=nn.map(function(n){ return by[n]; }).filter(Boolean);
      if(rowsB.length===C.rows.length){ same=false; B=_dzRdtSim(rowsB,_dzSimuler(rowsB,C.ref.iso,C.ctx,C.H),C.H,C.ctx); }
    }
    r={A:A, B:B, same:same};
  }
  C.rdt=r;
  return r;
}
function _dzRdtPc(x){ return x==null?'—':Math.round(x*100)+' %'; }
function _dzRendementHtml(C){
  var R=_dzRendement(C); if(!R) return '';
  var A=R.A, U=A.used>0?A.used:1;
  var w=function(h){ return Math.max(0,Math.min(100,h/U*100)).toFixed(2)+'%'; };
  var uH=Math.max(0,A.used-A.traj/60);
  var tr=[]; if(A.pied>0) tr.push(_dzMin(A.pied)+' à pied'); if(A.cam>0) tr.push(_dzMin(A.cam)+' en camion'); if(A.gps>0) tr.push(_dzMin(A.gps)+' estimées sans GPS');
  // MOTS-10 (§594) : « L’ordre actuel est déjà celui « au plus proche ». » (9 mots) → la pastille du titre.
  var h='<div class="pil-dz-rdt"><div class="pil-dz-lbl">Rendement'+_mvInfoBtn('pil.dzrdt')+(R.same?'<span class="r">'+_pilPhPl('déjà au plus proche','ok')+'</span>':'')+'</div>'
    +'<div class="pil-dz-rdt-bar" aria-hidden="true"><i class="u" style="width:'+w(uH)+'"></i><i class="p" style="width:'+w(A.pied/60)+'"></i><i class="c" style="width:'+w(A.cam/60)+'"></i><i class="g" style="width:'+w(A.gps/60)+'"></i></div>'
    +'<div class="pil-dz-note"><b>'+_dzRdtPc(A.utile)+'</b> du temps sur les parcelles'+(tr.length?(' \u00b7 trajets : '+tr.join(', ')):' \u00b7 aucun trajet')+'</div>'
    +'<div class="pil-dz-kpis"><div class="pil-dz-kpi"><b>'+(A.cout!=null?_ecoEur(A.cout):'—')+'</b><span>coût de la tournée</span></div>'
    +'<div class="pil-dz-kpi"><b>'+(A.eurHa!=null?_ecoEur(A.eurHa):'—')+'</b><span>à l’hectare</span></div>'
    +'<div class="pil-dz-kpi"><b>'+_opFmtHa(A.surf)+'</b><span>sur la tournée</span></div></div>'
    +((A.cout==null)?'<div class="pil-dz-note">Le coût demande les taux horaires de l’équipe, réservés à l’administrateur.</div>':(A.nSans?('<div class="pil-dz-note">Taux moyen pour '+_dzPl(A.nSans,'personne')+' sans taux propre.</div>'):''));
  if(R.B){
    var B=R.B, best=function(a,b,low){ return (a!=null&&b!=null&&(low?a<b-1e-9:a>b+1e-9)); };
    var row=function(lib,X,Y){ return '<tr><td>'+lib+'</td><td'+(best(X.jours,Y.jours,true)?' class="mieux"':'')+'>'+X.jours+'</td>'
      +'<td'+(best(X.traj,Y.traj,true)?' class="mieux"':'')+'>'+_dzMin(X.traj)+'</td>'
      +'<td'+(best(X.utile,Y.utile,false)?' class="mieux"':'')+'>'+_dzRdtPc(X.utile)+'</td>'
      +'<td'+(best(X.eurHa,Y.eurHa,true)?' class="mieux"':'')+'>'+(X.eurHa!=null?_ecoEur(X.eurHa):'—')+'</td></tr>'; };
    h+='<div class="pil-dz-rdt-sc"><table class="pil-dz-rdt-t"><thead><tr><th>Ordre</th><th>Jours</th><th>Trajets</th><th>Utile</th><th>€/ha</th></tr></thead><tbody>'
      +row('Ordre actuel',A,B)+row('Au plus proche',B,A)+'</tbody></table></div>'
      +(_opCanEdit()?'<div class="pil-dz-rdt-go"><button class="pil-dz-sort" data-op="sort" data-mode="nn">Prendre l’ordre au plus proche</button></div>':'');
  }
  return h+'</div>';
}
function _dzResultatHtml(C){
  var sim=C.sim, rows=C.rows;
  if(!sim.days.length) return '<div class="pil-dz-verd ko">'+_mvIcon('alerte',16)+'<div>Personne de cette \u00e9quipe au planning\u00a0: ajoutez quelqu\u2019un dans la case \u00c9quipe.</div></div>';
  var d1=sim.days[0], si=d1.parcs.length?d1.parcs[d1.parcs.length-1]:0, st=rows[si], n=sim.days.length, last=sim.days[n-1];
  var reste=Math.max(0,sim.per[si].h0-(d1.done[si]||0));
  // MOTS-10 (§594) : « mar. 27 oct. — le soir, l'équipe est à » → « Ce soir » (ou « mer. 28 oct., le soir ») ; les trois chiffres
  //   du jour gardent leur place, en deux mots chacun. La fin reste ICI, sous les réglages : au téléphone, l'en-tête de la carte est
  //   loin quand on touche − ou +, et c'est elle qui répond.
  var sub=(n<2)?'<b>tout est fini</b>':((reste<0.05)?'<b>finie</b> \u00b7 suite le '+_dzJc(sim.days[1].iso):'reste <b>'+_opFmtH(reste)+'</b> \u00b7 reprise le '+_dzJc(sim.days[1].iso));
  var h='<div class="pil-dz-hero"><div class="k">'+(d1.iso===_dzAuj()?'Ce soir':_dzJ(d1.iso)+', le soir')+'</div>'
    +'<div class="stop">'+_mvIcon('epingle',20)+_pilEsc(st.nom)+'</div><div class="sub">'+sub+'</div>'
    +'<div class="pil-dz-kpis"><div class="pil-dz-kpi"><b>'+_opFmtHa(d1.surf)+'</b><span>faits</span></div>'
    +'<div class="pil-dz-kpi"><b>'+_opFmtH(d1.work)+'</b><span>de travail</span></div>'
    +'<div class="pil-dz-kpi"><b>'+_dzMin(d1.traj)+'</b><span>de trajet</span></div></div>'
    +'<div class="pil-dz-fin"><div class="l1"><b>'+_dzPl(n,'jour')+'</b><span>fin pr\u00e9vue <b>'+_dzJ(last.iso)+'</b></span></div>';
  var tot=rows.reduce(function(a,r){ return a+r.reste; },0), suite=_dzSuiteTxt(sim);
  h+='<div class="pil-dz-note">reste '+_opFmtH(tot)+' sur '+_dzPl(rows.length,'parcelle')+(suite?' \u00b7 '+suite:'')+'</div>';
  if(sim.bloque) h+='<div class="pil-dz-verd ko">'+_mvIcon('alerte',16)+'<div><b>La tourn\u00e9e ne se termine pas</b> \u2014 '+_dzPt('l\u2019\u00e9quipe n\u2019est plus au planning apr\u00e8s le '+_dzJc(last.iso))+'</div></div>';
  else {
    var multi=C.ver.length>1, renf=_pilShow('sim_cout');
    C.ver.forEach(function(v){
      var nom=multi?'<b>'+_pilEsc(_opTNom(v.t))+'</b> \u00b7 ':'';
      if(v.passee) h+='<div class="pil-dz-verd ko">'+_mvIcon('alerte',16)+'<div>'+nom+_dzPt('la fen\u00eatre s\u2019est ferm\u00e9e le '+_dzJc(v.f.fin))+'</div></div>';
      // MOTS-10 (§594) : « tient dans la fenêtre — fini le 3 nov., fenêtre jusqu'au 28 févr. (89 jours travaillés d'ici là) » : la
      //   fin est juste au-dessus ; reste la pastille et la limite de la fenêtre.
      else if(v.ok) h+='<div class="pil-dz-vl">'+nom+_pilPhPl('tient \u00b7 fen\u00eatre jusqu\u2019au '+_dzJc(v.f.fin),'ok')+'</div>';
      else h+='<div class="pil-dz-verd ko">'+_mvIcon('alerte',16)+'<div>'+nom+'<b>d\u00e9borde de '+_dzPl(v.over,'jour')+'</b> \u2014 '+_dzPt('fen\u00eatre jusqu\u2019au '+_dzJc(v.f.fin))
        +(v.besoin?'<br>Il faudrait <b>+'+_dzPl(v.besoin,'personne')+'</b> chaque jour.':'<br>M\u00eame avec quarante personnes de plus, \u00e7a ne tient pas.')
        +'<div class="act">'+(v.besoin?'<button data-op="essai" data-r="'+v.besoin+'">Essayer +'+v.besoin+'</button>':'')+(renf?'<button data-op="renfort">Voir le renfort \u203a</button>':'')+'</div></div></div>';
    });
  }
  h+='<div class="pil-dz-hor">'+_dzHoraireTxt(d1)+'</div></div></div>';
  // TOUR-RDT (§216) : le rendement se lit sur la MEME simulation, juste sous le resultat.
  return h+_dzRendementHtml(C);
}
function _dzTriHtml(C,edit){
  if(!edit) return '<div class="pil-dz-note pil-dz-ro">'+_mvIcon('cadenas',16)+' Lecture seule\u00a0: l\u2019administrateur r\u00e8gle la tourn\u00e9e.</div>';
  var act=_opActTodo(), st=C.startPt, cur=C.rows.map(function(r){ return r.nom; }).join('|');
  function chip(mode,lab,on){ return '<button class="pil-dz-sort'+(on?' on':'')+'" data-op="sort" data-mode="'+mode+'">'+lab+'</button>'; }
  var nnO=_opNNNames(act), kmN=st?_opFmtM(_opRouteLen(nnO.map(_opParcByNom).filter(Boolean),st)):'';
  var h='<div class="pil-dz-lbl">L\u2019ordre de passage</div><div class="pil-dz-sorts">';
  h+=chip('nn',_mvIcon('boussole',16)+'Au plus proche'+(kmN?' <small>\u00b7 '+kmN+'</small>':''),nnO.join('|')===cur);
  if(_opHasCom()){ var co=_opComNames(act), kmC=st?_opFmtM(_opRouteLen(co.map(_opParcByNom).filter(Boolean),st)):''; h+=chip('com',_mvIcon('bureau',16)+'Par commune'+(kmC?' <small>\u00b7 '+kmC+'</small>':''),co.join('|')===cur); }
  h+=chip('dom','Ordre du domaine')+chip('surfD','Grandes d\u2019abord')+chip('avc','Moins avanc\u00e9es')+chip('rev','\u21c5 Inverser')+'</div>';
  var sp=C.sp, opts='<option value="">D\u00e9part\u00a0: '+((sp&&sp.auto)?('auto \u2014 '+(sp.src==='journal'?'derni\u00e8re faite\u00a0: '+_pilEsc(sp.p.nom):'centre du vignoble')):'auto')+'</option>';
  _opParcActive().filter(_opGeoOK).forEach(function(p){ opts+='<option value="'+_pilEsc(p.nom)+'"'+((_PIL_OP._startNom===p.nom)?' selected':'')+'>D\u00e9part\u00a0: '+_pilEsc(p.nom)+'</option>'; });
  h+='<select id="pil-op-start" class="pil-dz-sel" aria-label="D\u00e9part de la tourn\u00e9e">'+opts+'</select>';
  // ★ TRN-1 (§330) — la tournée se règle dans la roue crantée de la Vigne (Nico, 14/10) : Décider la SUIT et ne l'écrit
  //   plus. Les tris ci-dessus restent un essai à l'écran ; rien ne part chez l'équipe d'ici.
  var trn=null; (_PIL_OP.tasks||[]).some(function(t){ trn=(typeof window._mvTourneeDe==='function')?window._mvTourneeDe(t):null; return !!trn; });
  // MOTS-10 (§594) : « Aucune tournée pour ce travail », puis « Aucune tournée diffusée pour l'instant — l'équipe voit ses parcelles
  //   dans l'ordre habituel » disaient deux fois la même chose : une ligne, celle de la tournée que l'équipe suit (_mvTourneeDe),
  //   avec le bouton qui l'ouvre dans la Vigne. « Les tris ci-dessus sont un essai… roue crantée de la Vigne » (21 mots) → le « i ».
  var trnD=(trn&&/^\d{4}-\d{2}-\d{2}$/.test(String(trn.date||'')))?_dzJc(trn.date):'';
  h+='<div class="pil-dz-save"><span class="pil-dz-trn">'+_mvIcon('route',16)+'Tourn\u00e9e de l\u2019\u00e9quipe\u00a0: '+(trn?('<b>\u00ab\u00a0'+_pilEsc(trn.nom)+'\u00a0\u00bb</b>'+(trnD?(' \u00b7 '+trnD):'')):'aucune')+'</span>'
    +(_opCanEdit()?'<button class="go" data-op="trn">'+_mvIcon('crayon',16)+(trn?'Modifier la tourn\u00e9e':'Cr\u00e9er une tourn\u00e9e')+'</button>':'')+'</div>'
    +'<p class="pil-dz-essai">Ici, un essai\u00a0: rien n\u2019est enregistr\u00e9.</p>';
  return h;
}
function _dzSlot(i){ return '<button class="pil-dz-slot" data-op="drop" data-i="'+i+'"><i></i><span>\u21b3 INS\u00c9RER ICI</span><i></i></button>'; }
// DEBORD-1 (§593) : le nom dans son <span class="nmt"> (c'est lui qui finit en « … ») ; « J3→J4 » et « · N travaux » restent entiers à côté.
//   Avant, le nom, le badge et le nombre partageaient la même ellipse : au téléphone, le badge était coupé en un rectangle gris vide.
function _dzRowHtml(x,i,pr,pk,edit,hasCom){
  var multi=(_PIL_OP.tasks||[]).length>1, span=(pr&&pr.d0!=null&&pr.d1>pr.d0)?'<span class="bd">J'+(pr.d0+1)+'\u2192J'+(pr.d1+1)+'</span>':'';
  return '<div class="pil-dz-row'+(pk?' pk':'')+'"><span class="n">'+(i+1)+'</span><div class="c"><div class="nm"><span class="nmt">'+_pilEsc(x.nom)+'</span>'+span+((multi&&x.emos>1)?' <small>\u00b7 '+x.emos+' travaux</small>':'')+'</div>'
    +'<div class="ds">'+(x.geo?'':'\u25cb sans position \u00b7 ')+((hasCom&&_opCom(x.p))?_pilEsc(_opCom(x.p))+' \u00b7 ':'')+'<b>'+_opFmtHa(x.s)+'</b> \u00b7 '+x.pct+'\u00a0% fait</div></div>'
    +'<div class="r"><b>'+_opFmtH(x.reste)+'</b><span>\u00e0 faire</span></div>'
    +((edit&&!pk)?'<button class="mv" data-op="pick" data-nom="'+_pilEsc(x.nom)+'" aria-label="D\u00e9placer '+_pilEsc(x.nom)+'">'+_mvIcon('hautbas',16)+'</button>':'')+'</div>';
}
// La liste RANGÉE PAR JOUR : un en-tête par jour travaillé. Avant, une parcelle
// de quatre jours empilait « Fin de la journée 4 · 5 · 6 » sous elle.
function _dzListeHtml(C,edit){
  var rows=C.rows, sim=C.sim, OP=_PIL_OP, hasCom=_opHasCom();
  var pk=(edit&&OP._pick&&OP._pick.names&&OP._pick.names.length)?OP._pick:null;
  var h='<div class="pil-dz-days" id="pil-op-rows">';
  if(pk){
    // En placement : liste nue, les index des fentes sont ceux de la liste privée
    // de la prise en main — mélanger deux numérotations rendrait la pose imprévisible.
    var rest=rows.filter(function(x){ return pk.names.indexOf(x.nom)<0; });
    rest.forEach(function(x,ri){ h+=_dzSlot(ri)+_dzRowHtml(x,rows.indexOf(x),null,true,edit,hasCom); });
    return h+_dzSlot(rest.length)+'</div>';
  }
  var runs={}; if(edit&&hasCom) _opRuns(rows).forEach(function(r){ if(r.com&&r.names.length>1) runs[r.i0]=r; });
  sim.days.forEach(function(d,k){
    h+='<div class="pil-dz-dh'+(k?' nx':'')+'"><span class="j">J'+(k+1)+'</span><span class="t">'+_dzJ(d.iso)+' <small>\u00b7 '+_dzPers(d.n)+' pers. \u00b7 '+_dzHj(d.J)+'</small></span><span class="m">'+_opFmtHa(d.surf)+'</span></div>';
    if(d.reprise!=null){ var rp=rows[d.reprise]; h+='<div class="pil-dz-cont">reprise\u00a0: '+_pilEsc(rp.nom)+' \u00b7 '+_opFmtH(d.done[d.reprise]||0)+(sim.per[d.reprise].d1===k?' \u00b7 termin\u00e9e':'')+'</div>'; }
    rows.forEach(function(r,i){
      if(!sim.per[i]||sim.per[i].d0!==k) return;
      if(runs[i]) h+='<div class="pil-dz-run"><span>'+_pilEsc(runs[i].com)+' \u00b7 '+runs[i].names.length+'</span><i></i><button data-op="pickr" data-i="'+i+'">\u21c5 bloc</button></div>';
      var hp=C.hops[i];
      if(hp) h+='<div class="pil-dz-hop">'+(hp.mode==='gps'?'sans position \u00b7 '+_dzMin(hp.min):('<b>'+_opFmtM(hp.m)+'</b> \u00b7 '+_dzMin(hp.min)+' <span'+(hp.mode==='camion'?' class="cam"':'')+'>'+(hp.mode==='pied'?'\u00e0 pied':'en camion')+'</span>'))+'</div>';
      h+=_dzRowHtml(r,i,sim.per[i],false,edit,hasCom);
    });
  });
  var jamais=[]; rows.forEach(function(r,i){ if(!sim.per[i]||sim.per[i].d0==null) jamais.push(i); });
  if(jamais.length){
    h+='<div class="pil-dz-dh nx"><span class="j">\u2014</span><span class="t">Pas atteintes <small>\u00b7 l\u2019\u00e9quipe n\u2019est plus au planning</small></span></div>';
    jamais.forEach(function(i){ h+=_dzRowHtml(rows[i],i,null,false,edit,hasCom); });
  }
  h+='</div>';
  // MOTS-10 (§594) : « Enregistrer la diffuse à l'équipe » parlait d'un bouton parti avec TRN-1 (§330) : ici, rien ne s'enregistre.
  if(edit) h+='<div class="pil-dz-note"><b>\u21c5</b> prend une parcelle, une <b>fente dor\u00e9e</b> la repose'+(hasCom?'\u00a0; <b>\u21c5 bloc</b>\u00a0: toute une commune':'')+'.</div>';
  return h;
}

// ── Repli SVG de la carte (hors ligne) ──
function _opMapSvg(seqRows,w){
  var todoGeo=seqRows.filter(function(r){return r.geo;}).map(function(r){return r.p;});
  var doneGeo=_opDoneGeo(), sp=_opStartResolve(todoGeo), startPt=sp?sp.p:null;
  var pool=[]; if(startPt) pool.push(startPt); todoGeo.forEach(function(p){pool.push(p);}); doneGeo.forEach(function(p){pool.push(p);});
  if(pool.length<2) return window._mvGraphVide('Pas assez de parcelles rep\u00e9r\u00e9es pour tracer une tourn\u00e9e',
    'Il en faut au moins deux dont le contour est connu.');
  // ★ CIBLE-1 (§163) — les anneaux (commencée, sinon prochaine), gardés dans le cadre du dessin.
  var cib=_opCibles(seqRows); cib.forEach(function(cp){ if(pool.indexOf(cp)<0) pool.push(cp); });
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
  cib.forEach(function(cp){ svg+='<circle class="mv-cible-svg" cx="'+X(cp).toFixed(1)+'" cy="'+Y(cp).toFixed(1)+'" r="13" fill="none" stroke="#C9A84C" stroke-width="2"/>'; });
  doneGeo.forEach(function(p){ if(startPt&&p.nom===startPt.nom) return; svg+='<circle cx="'+X(p).toFixed(1)+'" cy="'+Y(p).toFixed(1)+'" r="4.5" fill="#3a352c" stroke="#5a5248" stroke-width="1"/>'; });
  todoGeo.forEach(function(p){ var x=X(p).toFixed(1),y=Y(p).toFixed(1); svg+='<circle cx="'+x+'" cy="'+y+'" r="9" fill="#14110D" stroke="#C9A84C" stroke-width="1.6"/><text x="'+x+'" y="'+(parseFloat(y)+3.5)+'" text-anchor="middle" font-size="'+gc.txt.mini+'" font-weight="600" fill="#C9A84C" font-family="var(--font-ui,Outfit,sans-serif)">'+seqNom[p.nom]+'</text>'; });
  if(startPt){ var sx=X(startPt).toFixed(1),sy=Y(startPt).toFixed(1); svg+='<circle cx="'+sx+'" cy="'+sy+'" r="6.5" fill="#6FBF5A"/><path d="M'+(parseFloat(sx)+0.5)+' '+(parseFloat(sy)-6.5)+' v-8 h6 l-2 2.5 2 2.5 h-6" fill="#6FBF5A" stroke="#0d1f0b" stroke-width=".5"/>'; }
  var dist=_opRouteLen(todoGeo,startPt);
  return '<div style="position:relative;background:radial-gradient(130% 100% at 30% 0%,#1f2a1c,#161d14);border:1px solid var(--gris-clair);border-radius:12px;overflow:hidden;margin-bottom:11px">'
    +window._mvGraphSvg(gc,'Tourn\u00e9e hors ligne : '+todoGeo.length+' parcelles \u00e0 faire, trajet d\u2019environ '+_opFmtM(dist)+'.',svg)
    +'<div style="position:absolute;right:9px;top:8px;font-size:var(--pt-micro,12px);font-weight:600;color:#C9A84C;background:rgba(20,17,13,.6);padding:3px 8px;border-radius:8px">trajet environ '+_opFmtM(dist)+'</div>'
    +'<div style="position:absolute;left:9px;bottom:7px;font-size:var(--pt-lbl,12px);color:#A79E8C;background:rgba(20,17,13,.55);padding:2px 7px;border-radius:8px">\uD83D\uDFE2 d\u00e9part \u00b7 \uD83D\uDFE1 \u00e0 faire \u00b7 \u26AB fait</div></div>';
}

function _opFmtH(h){ return (Math.round(h*10)/10).toLocaleString('fr-FR')+' h'; }
function _opFmtHa(s){ return s.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}).replace(/\u202f/g,' ')+' ha'; }

// ── Ce qui se pose PAR-DESSUS la liste : la barre « en main », les deux
//    feuilles (l'équipe, les trajets) et la carte agrandie. Tout vit dans le
//    corps de la carte : la délégation de clics du Pilotage les couvre déjà.
// ⚠️ Le Pilotage vit sous le dock (#mv-dock, fixe, z 90, hors du contexte
//   d'empilement de la page) : une feuille posée jusqu'au bas de l'écran passait
//   SOUS lui — mesuré, le dock interceptait le bouton « Voir le résultat ». Les
//   couches s'arrêtent donc au-dessus du dock quand il est affiché, comme la
//   barre « en main ».
function _dzDockH(){ var d=document.getElementById('mv-dock'); try{ if(d&&getComputedStyle(d).display!=='none') return Math.round(d.getBoundingClientRect().height); }catch(e){ if(DEBUG) console.warn('[pilotage] dock', e); } return 0; }
function _dzOverlays(C){
  var OP=_PIL_OP, h='', bas=(OP._sheet||OP._fm)?_dzDockH():0, st=bas?' style="bottom:'+bas+'px"':'';
  var pk=(_opCanEdit()&&OP._pick&&OP._pick.names&&OP._pick.names.length)?OP._pick:null;
  if(pk) h+='<div class="pil-dz-pk"><span>'+_mvIcon('doigt',18)+'</span><div class="t"><b>'+_pilEsc(pk.label)+'</b><div>Touchez une fente dor\u00e9e pour poser</div></div>'
    +'<button class="go" data-op="last">En dernier</button><button data-op="cancel">Annuler</button></div>';
  if(OP._sheet) h+='<div class="pil-dz-shw"'+st+'><div class="pil-dz-shbg" data-op="shut"></div><div class="pil-dz-sh" role="dialog" aria-modal="true">'
    +(OP._sheet==='trajet'?_dzSheetTrajet(C):_dzSheetEquipe(C))+'</div></div>';
  if(OP._fm) h+='<div class="pil-dz-fm"'+st+'><div class="top"><b>'+_pilEsc((OP.tasks||[]).map(_opTNom).join(' + ')+' \u00b7 '+_dzPl(C.rows.length,'parcelle')+(C.km>0?' \u00b7 '+_opFmtM(C.km)+' \u00b7 '+_dzMin(C.traj):''))+'</b>'
    +'<button data-op="fmx">Fermer</button></div><div id="pil-op-fm" class="lf"></div></div>';
  return h;
}
function _dzSuiteNoms(C){
  var d=C.sim.days, out=[];
  for(var k=1;k<d.length&&out.length<3;k++){
    var a=d[k-1].pers.map(function(p){ return p.nom; }), b=d[k].pers.map(function(p){ return p.nom; });
    b.forEach(function(n){ if(a.indexOf(n)<0&&out.length<3) out.push(n+' revient le '+_dzJ(d[k].iso)); });
    a.forEach(function(n){ if(b.indexOf(n)<0&&out.length<3) out.push(n+' pas l\u00e0 le '+_dzJ(d[k].iso)); });
  }
  return 'Les jours suivants suivent le planning de chacun\u00a0: '+(out.length?_dzPt(out.join(' \u00b7 ')):'la m\u00eame \u00e9quipe chaque jour.');
}
function _dzSheetEquipe(C){
  var OP=_PIL_OP, ref=C.ref.iso, b=C.ctx.base, mbs=_dzMbs(), prios=_dzPrioItems();
  var h='<div class="hdl"></div><h3>L\u2019\u00e9quipe \u2014 '+_pilEsc((OP.tasks||[]).map(_opTNom).join(' + '))+'</h3><div class="sub">'
    +(b.src==='prio'?'Les personnes affect\u00e9es \u00e0 la priorit\u00e9, et leur journ\u00e9e du <b>'+_dzJ(ref)+'</b> au planning.'
      :'Pas d\u2019\u00e9quipe affect\u00e9e \u00e0 ce travail\u00a0: toute l\u2019\u00e9quipe au champ, et sa journ\u00e9e du <b>'+_dzJ(ref)+'</b> au planning.')
    +' Toucher un nom l\u2019enl\u00e8ve ou le remet, pour essayer.</div>';
  function ligne(nm,dansBase){
    var m=mbs[nm]; if(!m) return '';
    var j=_dzJourMbr(m,ref), dispo=j.pH>0.01, inc=dansBase?!OP.excl[nm]:!!OP.add[nm], autre=null;
    prios.forEach(function(it){ if((OP.tasks||[]).indexOf(it.t)<0&&(it.equipe||[]).indexOf(nm)>=0) autre=it.t; });
    var sub=_dzColl(m)?'\u00e9quipe collective':(autre?'d\u00e9j\u00e0 sur '+_opTNom(autre):'');
    var info=dispo?(_dzHj(OP.J!=null?OP.J:j.h)+(j.n>1?' \u00d7 '+j.n:'')):_dzMotif(m,ref);
    return '<button class="pil-dz-pp'+((inc&&dispo)?' on':'')+'"'+(dispo?' data-op="pp" data-nom="'+_pilEsc(nm)+'" data-b="'+(dansBase?1:0)+'"':' disabled')+'>'
      +'<span class="ck">'+_mvIcon('check',16)+'</span><span class="nm">'+_pilEsc(nm)+(sub?'<small>'+_pilEsc(sub)+'</small>':'')+'</span><span class="h">'+_pilEsc(info)+'</span></button>';
  }
  var liste=b.noms.filter(function(nm){ var m=mbs[nm]; if(!m) return false; if(b.src==='prio'||_dzJourMbr(m,ref).pH>0.01) return true; var mo=_dzMotif(m,ref); return mo!=='hors contrat'&&mo!=='pas au planning'; });
  h+='<div class="sec">'+(b.src==='prio'?'Affect\u00e9s \u00e0 la priorit\u00e9':'Au champ')+'</div>'+liste.map(function(nm){ return ligne(nm,true); }).join('');
  var autres=Object.keys(mbs).filter(function(nm){ return b.noms.indexOf(nm)<0&&_dzJourMbr(mbs[nm],ref).pH>0.01; });
  if(autres.length) h+='<div class="sec">Ajouter quelqu\u2019un du jour</div>'+autres.map(function(nm){ return ligne(nm,false); }).join('');
  h+='<div class="sec">Renfort simul\u00e9</div><div class="pil-dz-hy"><div class="t">Personnes en plus, chaque jour<small>au temps de travail de la journ\u00e9e</small></div>'
    +'<span class="pil-dz-stp"><button data-op="R" data-d="-1" aria-label="Une personne de moins"'+((OP.R||0)>0?'':' disabled')+'>\u2212</button><span class="val">'+(OP.R||0)+'</span><button data-op="R" data-d="1" aria-label="Une personne de plus">+</button></span></div>';
  h+='<div class="pil-dz-ex">'+_pilEsc(_dzSuiteNoms(C))+'</div>';
  h+='<div class="pil-dz-ex">Rien n\u2019est enregistr\u00e9 ici\u00a0: l\u2019affectation se diffuse dans <b>Vigne \u203a Priorit\u00e9 du moment</b>.</div>';
  return h+'<button class="pil-dz-close" data-op="shut">Voir le r\u00e9sultat</button>';
}
function _dzSheetTrajet(C){
  var H=_dzH(), hMod=_dzHMod(), edit=_opCanEdit();
  function hy(k,lab,sub,val){ var bb=_DZ_HB[k];
    return '<div class="pil-dz-hy"><div class="t">'+lab+(sub?'<small>'+sub+'</small>':'')+'</div><span class="pil-dz-stp">'
      +'<button data-op="hy" data-k="'+k+'" data-d="-1" aria-label="Moins"'+(H[k]<=bb[0]?' disabled':'')+'>\u2212</button><span class="val">'+val+'</span>'
      +'<button data-op="hy" data-k="'+k+'" data-d="1" aria-label="Plus"'+(H[k]>=bb[1]?' disabled':'')+'>+</button></span></div>'; }
  var h='<div class="hdl"></div><h3>Les trajets entre parcelles</h3><div class="sub">Calcul\u00e9s entre chaque parcelle et la suivante, sur la distance \u00e0 vol d\u2019oiseau. L\u2019\u00e9quipe se d\u00e9place ensemble\u00a0: ce temps se retire de sa journ\u00e9e.</div>';
  h+=hy('pied_m','\u00c0 pied jusqu\u2019\u00e0','au-del\u00e0, on prend le camion',H.pied_m+'\u00a0m')
    +hy('pied_kmh','Vitesse \u00e0 pied','',String(H.pied_kmh).replace('.',',')+'\u00a0km/h')
    +hy('fixe_min','Camion\u00a0: temps fixe','se garer, charger, d\u00e9charger',H.fixe_min+'\u00a0min')
    +hy('camion_kmh','Vitesse en camion','dans les vignes et les villages',H.camion_kmh+'\u00a0km/h')
    +hy('sans_min','Parcelle sans position','ni GPS ni contour connus',H.sans_min+'\u00a0min');
  h+='<div class="sec">Sur cette tourn\u00e9e \u2014 '+_dzMin(C.traj)+' en tout</div>';
  C.rows.forEach(function(x,i){ var hp=C.hops[i]; if(!hp) return;
    h+='<div class="pil-dz-hl"><span class="nm">'+_pilEsc(C.rows[i-1].nom)+' \u2192 '+_pilEsc(x.nom)+'<small>'+(hp.mode==='gps'?'sans position':(_opFmtM(hp.m)+' \u00b7 '+(hp.mode==='pied'?'\u00e0 pied':'en camion')))+'</small></span><span class="h">'+_dzMin(hp.min)+'</span></div>'; });
  h+='<div class="pil-dz-ex">Ces cinq valeurs sont un <b>r\u00e9glage du domaine</b>. Les changer ici sert \u00e0 essayer'+(edit?'\u00a0; \u00ab\u00a0Garder pour le domaine\u00a0\u00bb les enregistre pour tout le monde.':'.')+'</div>';
  if(hMod) h+='<div class="pil-dz-reset"><span>R\u00e8gle modifi\u00e9e</span><button data-op="hyreset">\u21ba R\u00e9glage du domaine</button></div>'+(edit?'<button class="pil-dz-close alt" data-op="hysave">Garder pour le domaine</button>':'');
  return h+'<button class="pil-dz-close" data-op="shut">Voir le r\u00e9sultat</button>';
}

// ── La carte : la tournée sur une vraie carte, repli SVG hors ligne ──
// ⚠️ DANS LA CARTE, UN DOIGT FAIT DÉFILER LA PAGE. Sur un écran tactile
//   (pointeur « coarse »), dragging:false : Leaflet ne pose plus que
//   `leaflet-touch-zoom`, soit touch-action:pan-x pan-y — le navigateur garde le
//   glissement à un doigt, et deux doigts déplacent et zooment (TouchZoom suit
//   le milieu des doigts). « Agrandir » ouvre la carte plein écran, où le doigt
//   la déplace. Avant : touch-action:none sur 220 px d'écran, mesuré 405 → 405.
var _opMap=null, _OP_MAPDATA=null;
function _opMapHtml(C){
  var rows=C.rows, startPt=C.startPt;
  if(typeof window.L==='undefined'){
    _OP_MAPDATA=null;
    // DEBORD-1 (§593) : la carte a déjà son bouton « Agrandir » (en bas, pil-dz-big) ; celui des graphes (KIT-1) se posait en haut à
    //   droite, SUR « trajet ~ 4,1 km » — deux « Agrandir » sur la même carte, l'un cachant le trajet.
    window._mvGraphSuivre('#pil-g-opmap', function(lg){ return _opMapSvg(rows,lg); }, { agrandir:false });
    return '<div class="pil-dz-svg"><div id="pil-g-opmap"></div><button class="pil-dz-big" data-op="fm">'+_mvIcon('carte',16)+'Agrandir</button></div>';
  }
  var todoGeo=rows.filter(function(r){ return r.geo; }), doneGeo=_opDoneGeo();
  if(((startPt?1:0)+todoGeo.length+doneGeo.length)<2){ _OP_MAPDATA=null; return ''; }
  _OP_MAPDATA={rows:rows,sim:C.sim,startPt:startPt,doneGeo:doneGeo};
  return '<div class="pil-dz-map"><div id="pil-op-map" class="pil-dz-lf"></div>'
    +(C.km>0?'<span class="tag">'+_mvIcon('route',16)+_opFmtM(C.km)+' \u00b7 '+_dzMin(C.traj)+'</span>':'')
    +(_dzDoigt()?'<span class="hint">un doigt fait d\u00e9filer \u00b7 deux doigts d\u00e9placent</span>':'')
    +'<button class="pil-dz-big" data-op="fm">'+_mvIcon('carte',16)+'Agrandir</button></div>';
}
function _dzLayers(map,D,noms){
  var L=window.L, rows=D.rows, sim=D.sim, startPt=D.startPt, SG=startPt?_opGeo(startPt):null, bounds=[], seq=[];
  rows.forEach(function(r,i){ if(!r.geo) return; var g=_opGeo(r.p); if(g) seq.push({i:i,r:r,g:g}); });
  // Contours KML des parcelles concernées : à faire = or, déjà fait = sombre.
  var src=(window.KML_POLYGONS_DYNAMIC&&window.KML_POLYGONS_DYNAMIC.length)?window.KML_POLYGONS_DYNAMIC:(window.KML_DATA||[]), st={};
  seq.forEach(function(o){ st[String(o.r.nom).toLowerCase()]='todo'; });
  D.doneGeo.forEach(function(p){ var k=String(p.nom||'').toLowerCase(); if(!st[k]) st[k]='done'; });
  src.forEach(function(k){
    if(!k||!k.pts||!k.pts.length||!k.name) return;
    var s=st[String(k.name).toLowerCase()]; if(!s) return;
    if(s==='todo') L.polygon(k.pts,{color:'#C9A84C',weight:2,fillColor:'#C9A84C',fillOpacity:.13}).addTo(map);
    else L.polygon(k.pts,{color:'#5a5248',weight:1.2,fillColor:'#3a352c',fillOpacity:.28}).addTo(map);
  });
  if(SG) bounds.push([SG.lat,SG.lng]);
  D.doneGeo.forEach(function(p){ if(startPt&&p.nom===startPt.nom) return; var g=_opGeo(p); if(!g) return;
    L.circleMarker([g.lat,g.lng],{radius:4.5,fillColor:'#3a352c',color:'#5a5248',weight:1.2,fillOpacity:1}).addTo(map).bindPopup('<b>'+_pilEsc(p.nom)+'</b><br>fait'); bounds.push([g.lat,g.lng]); });
  // Trait plein tant que la parcelle appartient au 1er jour, pointillé ensuite.
  var d1=sim&&sim.days&&sim.days[0], li=(d1&&d1.parcs.length)?d1.parcs[d1.parcs.length-1]:-1;
  var solid=SG?[[SG.lat,SG.lng]]:[], dash=[], sw=false;
  seq.forEach(function(o){ var pt=[o.g.lat,o.g.lng]; bounds.push(pt);
    if(!sw&&o.i<=li){ solid.push(pt); return; }
    if(!sw){ sw=true; if(solid.length) dash.push(solid[solid.length-1]); }
    dash.push(pt); });
  if(solid.length>1) L.polyline(solid,{color:'#C9A84C',weight:3.5,opacity:.85,lineJoin:'round'}).addTo(map);
  if(dash.length>1) L.polyline(dash,{color:'#C9A84C',weight:2.5,opacity:.55,dashArray:'6 7',lineJoin:'round'}).addTo(map);
  if(SG) L.marker([SG.lat,SG.lng],{icon:L.divIcon({className:'',iconSize:[20,20],iconAnchor:[10,10],html:'<div style="width:20px;height:20px;border-radius:50%;background:#6FBF5A;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)"></div>'})}).addTo(map).bindPopup('<b>D\u00e9part</b><br>'+_pilEsc(startPt.nom));
  // ★ CIBLE-1 (§163) — l'anneau : commencée et pas finie, sinon la prochaine de la tournée.
  _opCibles(rows).forEach(function(cp){ var cg=_opGeo(cp); if(cg){ window._mvCibleAnneau(map,cg); bounds.push([cg.lat,cg.lng]); } });
  seq.forEach(function(o){
    var ring=(o.i===li), pr=(sim&&sim.per)?sim.per[o.i]:null;
    var jour=(pr&&pr.d0!=null)?('jour '+(pr.d0+1)+(pr.d1>pr.d0?'\u2192'+(pr.d1+1):'')):'';
    var mk=L.marker([o.g.lat,o.g.lng],{icon:L.divIcon({className:'',iconSize:[26,26],iconAnchor:[13,13],html:'<div style="width:26px;height:26px;border-radius:50%;background:#14110D;border:2px solid #C9A84C;color:#C9A84C;display:flex;align-items:center;justify-content:center;font:600 12px/1 var(--font-ui,Outfit,system-ui,sans-serif);box-shadow:'+(ring?'0 0 0 4px rgba(201,168,76,.45),':'')+'0 1px 4px rgba(0,0,0,.4)">'+(o.i+1)+'</div>'})}).addTo(map)
      .bindPopup('<b>'+(o.i+1)+' \u00b7 '+_pilEsc(o.r.nom)+'</b><br>'+_opFmtH(o.r.reste)+' \u00e0 faire'+(jour?' \u00b7 '+jour:'')+(ring?'<br>le soir du 1er jour':''));
    if(noms) mk.bindTooltip(_pilEsc(o.r.nom),{permanent:true,direction:'right',offset:[12,0],className:'pil-plabel'});
  });
  return bounds;
}
function _opBuildMap(){
  var el=document.getElementById('pil-op-map');
  if(!el||typeof window.L==='undefined'||!_OP_MAPDATA) return;
  _opMap=_pilMapKill(_opMap);
  var D=_OP_MAPDATA;
  try{
    _opMap=window.L.map(el,{zoomControl:true,attributionControl:false,zoomSnap:0,zoomDelta:0.5,dragging:!_dzDoigt(),touchZoom:true,scrollWheelZoom:false});
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(_opMap);
    var bounds=_dzLayers(_opMap,D,false);
    var sig=D.rows.filter(function(r){ return r.geo; }).map(function(r){ return r.nom; }).sort().join('|')+'\u00a7'+(D.startPt?D.startPt.nom:'');
    var mv=(_PIL_OP&&_PIL_OP._mapView)||null, _mine=_opMap;
    var _fit=function(){ if(!_opMap||_opMap!==_mine) return;
      try{ _opMap.invalidateSize(); }catch(e){ if(DEBUG) console.warn('[pilotage] carte tourn\u00e9e inv', e); }
      try{ if(mv&&mv.sig===sig) _opMap.setView(mv.c,mv.z,{animate:false}); else if(bounds.length) _opMap.fitBounds(bounds,{padding:[20,20],animate:false}); }catch(e){ if(DEBUG) console.warn('[pilotage] carte tourn\u00e9e fit', e); } };
    requestAnimationFrame(function(){ requestAnimationFrame(_fit); });
    _opMap.on('moveend zoomend',function(){ if(_PIL_OP&&_opMap) _PIL_OP._mapView={sig:sig,c:_opMap.getCenter(),z:_opMap.getZoom()}; });
  }catch(e){ if(DEBUG) console.warn('[pilotage] carte tourn\u00e9e', e); }
}
function _dzBuildFm(){
  var el=document.getElementById('pil-op-fm'); if(!el) return;
  _dzFmMap=_pilMapKill(_dzFmMap);
  var D=_OP_MAPDATA;
  if(typeof window.L==='undefined'||!D){ el.innerHTML=_opMapSvg((_DZ_LAST&&_DZ_LAST.rows)||[],el.clientWidth||360); return; }
  try{
    var m=window.L.map(el,{zoomControl:true,attributionControl:false,zoomSnap:0,zoomDelta:0.5});
    _dzFmMap=m;
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m);
    var b=_dzLayers(m,D,true);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ if(_dzFmMap!==m) return;
      try{ m.invalidateSize(); if(b.length) m.fitBounds(b,{padding:[36,36],animate:false}); }catch(e){ if(DEBUG) console.warn('[pilotage] carte agrandie fit', e); } }); });
  }catch(e){ if(DEBUG) console.warn('[pilotage] carte agrandie', e); }
}

// ── LES GESTES ──
function _pilOpRefresh(){
  var el=document.getElementById('pil-op-body');
  if(el){
    var sh=el.querySelector('.pil-dz-sh'), shTop=sh?sh.scrollTop:0;
    var C=_dzCalc();
    el.innerHTML=_opBodyC(C);
    _dzMajEntete('ordrepassage',_dzStatTour(C),_dzSubTour(C));
    var sh2=el.querySelector('.pil-dz-sh'); if(sh2&&shTop) sh2.scrollTop=shTop;
    _opBuildMap();
    if(_PIL_OP&&_PIL_OP._fm) _dzBuildFm(); else _dzFmMap=_pilMapKill(_dzFmMap);
  }
  _pilSimRefresh();
}
function _dzOuvrirCarte(id){
  var t=document.querySelector('.pil-tile[data-pid="'+id+'"]'); if(!t) return;
  if(!t.classList.contains('open')){ var th=t.querySelector('.pil-th'); if(th) th.click(); }
  setTimeout(function(){ try{ t.scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){ if(DEBUG) console.warn('[pilotage] ouvrir carte', e); } },60);
}
function _pilOpAction(el){
  if(!_PIL_OP||!el) return;
  var OP=_PIL_OP, op=el.getAttribute('data-op'), C=_DZ_LAST||_dzCalc();
  // Tout le monde peut SIMULER (le jour, l'équipe, la journée, la coupure, les
  // trajets, la carte). Seul l'administrateur choisit les travaux, range et diffuse.
  if(op==='day'){ var sens=parseInt(el.getAttribute('data-d'),10)||1, n=_dzSuivant(C.ref.iso,C.ctx,sens);
    if(n&&n>=_dzAuj()){ var a=_dzRefAuto(OP.tasks||[],C.ctx); if(n===a.iso){ OP.ref=null; OP.refManuel=false; } else { OP.ref=n; OP.refManuel=true; } } }
  else if(op==='stp'){ var k=el.getAttribute('data-k'), dv=parseFloat(el.getAttribute('data-d'))||0;
    if(k==='jour'){ OP.J=Math.max(1,Math.min(12,Math.round(((C.e0.J||7)+dv)*2)/2)); if(OP.J===C.jPlan) OP.J=null; }
    else if(k==='coup'){ OP.coup=Math.max(0,Math.min(180,(C.e0.coup||0)+dv)); if(OP.coup===C.coupPlan) OP.coup=null; } }
  else if(op==='sheet'){ if(!OP._sheet&&window._mvHistPush) window._mvHistPush(); OP._sheet=el.getAttribute('data-k'); }
  else if(op==='shut'){ OP._sheet=null; }
  else if(op==='pp'){ var nm=el.getAttribute('data-nom'); if(el.getAttribute('data-b')==='1') OP.excl[nm]=!OP.excl[nm]; else OP.add[nm]=!OP.add[nm]; }
  else if(op==='R'){ OP.R=Math.max(0,(OP.R||0)+(parseInt(el.getAttribute('data-d'),10)||0)); }
  else if(op==='hy'){ var hk=el.getAttribute('data-k'), bb=_DZ_HB[hk]; if(bb){ var H=Object.assign({},_dzH());
      H[hk]=Math.max(bb[0],Math.min(bb[1],Math.round((H[hk]+(parseInt(el.getAttribute('data-d'),10)||0)*bb[2])*10)/10)); OP.H=H; if(!_dzHMod()) OP.H=null; } }
  else if(op==='hyreset'){ OP.H=null; }
  else if(op==='reset'){ OP.excl={}; OP.add={}; OP.R=0; OP.J=null; OP.coup=null; OP.ref=null; OP.refManuel=false; OP.H=null; }
  else if(op==='essai'){ OP.R=(OP.R||0)+(parseInt(el.getAttribute('data-r'),10)||0); }
  else if(op==='renfort'){ _dzOuvrirCarte('renfort'); return; }
  else if(op==='fm'){ if(!OP._fm&&window._mvHistPush) window._mvHistPush(); OP._fm=true; }
  else if(op==='fmx'){ OP._fm=false; }
  else if(op==='autres'){ OP._autres=!OP._autres; }
  else if(!_opCanEdit()){ return; }
  else if(op==='hysave'){ _dzHSave(); return; }
  else if(op==='task'){ var tn=el.getAttribute('data-nom'), i=OP.tasks.indexOf(tn);
    if(i>=0){ if(OP.tasks.length>1) OP.tasks.splice(i,1); } else OP.tasks.push(tn);
    // Changer de travail change l'équipe, le jour et la fenêtre : on repart du réel.
    OP.tSrc='main'; OP.order=null; OP._pick=null; OP.ref=null; OP.refManuel=false; OP.excl={}; OP.add={}; }
  else if(op==='sort'){ var mode=el.getAttribute('data-mode'), act=_opActTodo();
    OP._pick=null;
    if(mode==='nn') OP.order=_opNNNames(act);
    else if(mode==='com') OP.order=_opComNames(act);
    else if(mode==='rev') OP.order=_opParcelles().map(function(x){ return x.nom; }).reverse();
    else if(mode==='dom') OP.order=act.map(function(p){ return p.nom; });
    else if(mode==='surfD') OP.order=act.slice().sort(function(a,b){ return (parseFloat(b.surface)||0)-(parseFloat(a.surface)||0); }).map(function(p){ return p.nom; });
    else if(mode==='avc') OP.order=act.slice().sort(function(a,b){ return _opParcPctM(a)-_opParcPctM(b); }).map(function(p){ return p.nom; }); }
  // Prise en main / pose : deux taps, aucun maintien du doigt (inchangé).
  else if(op==='pick'){ var pn=el.getAttribute('data-nom'); if(pn) OP._pick={names:[pn],label:pn}; }
  else if(op==='pickr'){ var i0=parseInt(el.getAttribute('data-i'),10); if(!isFinite(i0)) i0=-1;
    var run=null; _opRuns(_opParcelles()).forEach(function(r){ if(r.i0===i0) run=r; });
    if(run) OP._pick={names:run.names.slice(),label:(run.com||'Sans commune')+' \u00b7 '+run.names.length+' parcelles'}; }
  else if(op==='drop'||op==='last'){ var pk2=OP._pick;
    if(pk2){ var nms=_opParcelles().map(function(x){ return x.nom; });
      var rest2=nms.filter(function(x){ return pk2.names.indexOf(x)<0; });
      var ii=(op==='last')?rest2.length:parseInt(el.getAttribute('data-i'),10);
      if(!isFinite(ii)||ii<0) ii=0; if(ii>rest2.length) ii=rest2.length;
      OP.order=rest2.slice(0,ii).concat(pk2.names,rest2.slice(ii)); }
    OP._pick=null; }
  else if(op==='cancel'){ OP._pick=null; }
  else if(op==='trn'){ OP._pick=null; var t0=''; (OP.tasks||[]).some(function(t){ if(typeof window._mvTourneeDe==='function'&&window._mvTourneeDe(t)){ t0=t; return true; } return false; }); if(!t0) t0=(OP.tasks||[])[0]||''; if(typeof window._trnOuvrirPourTache==='function') window._trnOuvrirPourTache(t0,'decider'); return; }
  
  _pilOpRefresh();
}
function _opInit(d){
  _dzOublier(); _DZ_LAST=null;
  var arr=(typeof window.getTachesSaison==='function')?window.getTachesSaison():(window.TACHES||[]);
  var tasks=arr.map(function(def){ var tot=_opParcActive().filter(function(p){ return _opApplic(p,def); }).reduce(function(a,p){ return a+_opParcReste(p,def); },0); return {def:def,nom:def.nom,tot:tot}; });
  var byNom={}; tasks.forEach(function(x){ byNom[x.nom]=x; });
  _PIL_OP_DATA={tasks:tasks,byNom:byNom};
  if(!_PIL_OP) _PIL_OP={tasks:[],tSrc:null,ref:null,refManuel:false,excl:{},add:{},R:0,J:null,coup:null,H:null,_startNom:null,order:null,_pick:null,_sheet:null,_fm:false,_autres:false};
  else {
    // Un rendu COMPLET de l'onglet lâche ce qu'on tenait (barre « en main »,
    // feuille, carte agrandie) : sinon ils survivent à une navigation.
    _PIL_OP._pick=null; _PIL_OP._sheet=null; _PIL_OP._fm=false;
    _PIL_OP.tasks=(_PIL_OP.tasks||[]).filter(function(n){ return byNom[n]; });
  }
  // Tant que l'utilisateur n'a pas choisi, le travail SUIT la priorité : une
  // priorité diffusée pendant la session est reprise au rendu suivant.
  if(!_PIL_OP.tasks.length||_PIL_OP.tSrc!=='main'){ var df=_dzTachesDefaut(); if(df.t.join('|')!==_PIL_OP.tasks.join('|')) _PIL_OP.order=null; _PIL_OP.tasks=df.t; _PIL_OP.tSrc=df.src; }
}
function _pilPanelOrdrePassage(d){
  _opInit(d);
  var C=_dzCalc();
  return _pilTile('ordrepassage','#C9A84C','La tourn\u00e9e du jour',_dzStatTour(C),_dzSubTour(C),null,'<div id="pil-op-body">'+_opBodyC(C)+'</div>','pil.tournee');
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
function _rfIso(o){ return _pilOrdIso(o); }
// Sélection courante : nombre de renforts + fenêtre d'emploi (index de semaine).
// ⚠ Remplace l'ancien profil libre édité au clic dans les colonnes : la zone
// cliquable couvrait tout le graphique, on ne savait plus ce qu'on avait posé.
// base = SUR QUOI la simulation s'appuie avant tout renfort :
//   'eng'  = tout ce qui est DEJA SOUS CONTRAT cette semaine-la, equipes
//            collectives comprises. C'est le defaut, et c'est ce que le domaine
//            SAIT deja.
//   'perm' = les permanents seuls. Repond a une autre question : « de quoi
//            aurais-je besoin si je n'avais embauche personne ? »
var _RF_SEL = { R:0, a:0, b:0, dP:0, base:'eng' };   // dP = effectif simule EN PLUS ou EN MOINS
var _RF_D   = null;
var _RF_RES = null;   // RENF-2 : le résumé du dernier calendrier (tuile)



function _rfCfg(){
  var e=(window.CONFIG&&window.CONFIG.eco)||{};
  function _n(v,d,min){ var x=Number(v); return (isFinite(x)&&x>=(min==null?0:min))?x:d; }
  var t=(e.taux_horaire&&typeof e.taux_horaire==='object')?e.taux_horaire:{};
  var tr=Number(t['Saisonnier'])||Number(t['TESA'])||Number(t['Extra'])||0;
  return { k:_n(e.k_retard,15,0)/100, rdt:_n(e.rdt_renfort,85,1)/100,
           fixe:_n(e.cout_fixe_renfort,180,0), hs:_n(e.maj_hsup,25,0)/100,
           // RENF-2 (§224) : hMax = hJour — la capacité est celle du PLANNING, rien de plus. Avant, 8 h au lieu de 7
           //   (+14 %) : le simulateur comptait sur des heures sup avant de réclamer du monde. Une heure sup n'existe
           //   plus que dans un scénario qui la nomme (c.plaf, « Et sans renfort ? »). hCdd : un CDD à horaire fixe.
           tauxRenfort:tr, hJour:7, hMax:7, hCdd:35 };
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
function _rfMinR(ctx,a,b,rMax,nom,base){
  // RENF-2 (§224) : `base` = un profil déjà posé (le calendrier) ; R s'y AJOUTE sur [a,b], semaines fermées exclues
  //   (le domaine fermé ne paie personne, et la période se coupe là). Sans base : le rectangle d'avant.
  function ok(R){
    var p;
    if(base){ p=base.slice(); for(var i=a;i<=b;i++){ if((ctx.W[i]||{}).cap>0) p[i]+=R; } }
    else p=_rfProf(ctx,{R:R,a:a,b:b});
    var r=_rfSim(ctx,p);
    return nom?_rfOkT(r,nom):!r.deborde;
  }
  if(ok(0)) return 0;
  if(!ok(rMax)) return null;
  var lo=0, hi=rMax;
  while(hi-lo>1){ var m=Math.floor((lo+hi)/2); if(ok(m)) hi=m; else lo=m; }
  return hi;
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
// \u2605\u2605\u2605 UNE SEULE REGLE D'ETALEMENT DANS TOUT LE MODULE \u2014 LA REGLE A.
//   Les heures d'une tache se repartissent au prorata des jours TRAVAILLABLES de
//   sa fenetre, jamais des jours du calendrier. Une semaine amputee par le 1er mai
//   et l'Ascension n'a que trois jours pour absorber du travail : elle en recoit
//   trois cinquiemes, pas sept septiemes.
//   AVANT : _taskHoursIn (planning.js) appliquait la regle A, _rfHIn appliquait
//   un etalement a plat. Les deux lectures du simulateur \u2014 \u00ab le plan \u00bb et \u00ab ce
//   qu'il reste \u00bb \u2014 se dessinaient donc sous DEUX regles, cote a cote, et
//   _rfMemeImage les comparait l'une a l'autre.
//   La capacite ne se recalcule pas ici : elle est LUE dans cd.capCum, le cumul
//   jour par jour rendu par _chargeSaisonData. Un second calcul donnerait un
//   second chiffre.
//   \u26a0 Repli integral sur l'ancien etalement si capCum est absent (planning.js
//   anterieur a ce lot) : jamais d'ecran vide pour une cle manquante.
function _rfCapIn(cd,a,b){
  var C=cd&&cd.capCum; if(!C||cd.spanS==null) return null;
  var i=Math.round(a)-cd.spanS, j=Math.round(b)-cd.spanS, L=C.length-1;
  if(i<0)i=0; if(i>L)i=L; if(j<0)j=0; if(j>L)j=L;
  return (j>i)?(C[j]-C[i]):0;
}
function _rfHIn(cd,t,a,b){
  var A=Math.max(t.ws,a), B=Math.min(t.we,b);
  if(B<=A) return 0;
  var den=_rfCapIn(cd,t.ws,t.we);
  if(den!=null&&den>0){ var num=_rfCapIn(cd,A,B); return t.h*(num||0)/den; }
  return t.h*(B-A)/Math.max(1,t.we-t.ws);
}
function _rfCtx(d,mode,cdIn,opts){
  var cd=cdIn||_rfCd();
  if(!cd||!(cd.charge>0)||!(cd.weeks&&cd.weeks.length)) return null;
  // \u2605 opts.sansTaux : la date de fin du cockpit (_pilFinPlan) lit ce contexte
  //   pour ses semaines, ses fenetres et sa capacite \u2014 pas pour ses euros. Sans
  //   taux horaire le simulateur de renfort n'a rien a chiffrer et s'arrete ;
  //   une date de fin, elle, ne coute rien : rate=0, socle=0, meme calendrier.
  var rate=_ecoRate(); if(!(rate>0)){ if(opts&&opts.sansTaux) rate=0; else return { noRate:true }; }
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
      var fr=(k===0)?(ndr/nd):1;
      // \u2605 LA SEMAINE EN COURS SE COUPE AU JOUR (12/08/2026). Le prorata
      //   `fr` supposait les heures etalees a plat sur les sept jours : un
      //   mercredi, il gardait 5/7 d'une semaine dont le week-end vaut 0 et dont
      //   une equipe collective peut porter la totalite sur deux jours. Meme
      //   defaut, meme correction que l'ex-_pilCapaProj (aujourd'hui _pilFinJour) — et meme source : capCum via
      //   _rfCapIn pour la capacite 1 ETP, capRCum via _mvCapReelIn pour les
      //   heures reelles. `fr` ne sert plus que de repli quand la donnee manque.
      var cpX=_rfCapIn(cd,o0,w.o1+1), cp=(cpX!=null)?cpX:(w.cap||0)*fr;
      var CR=(typeof window._mvCapReelIn==='function')?window._mvCapReelIn(cd,o0,w.o1+1):null;
      // need RECALCULE sur le reste : garder celui du plan ferait mentir la
      // hauteur des colonnes du graphe.
      var wh=0; tw.forEach(function(t){ wh+=_rfHIn(cd,t,o0,w.o1+1); });
      return { o0:o0, o1:w.o1, m:w.m, hours:wh, cap:cp, capRatio:fr, need:(cp>0?wh/cp:0),
               head:w.head, headPerm:w.headPerm,
               capH:CR?CR.work:(w.capH!=null?w.capH*fr:null),
               capPay:CR?CR.pay:(w.capPay!=null?w.capPay*fr:null),
               capHPerm:CR?CR.workPerm:(w.capHPerm!=null?w.capHPerm*fr:null),
               capPayPerm:CR?CR.payPerm:(w.capPayPerm!=null?w.capPayPerm*fr:null) };
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
  // \u2605 opts.sansSel : le cockpit lit l'equipe DEJA SOUS CONTRAT, jamais la
  //   simulation en cours dans La campagne. Sans ce drapeau, « +2 permanents »
  //   pose dans le simulateur aurait avance la date d'Aujourd'hui.
  var sansSel=!!(opts&&opts.sansSel);
  var dP=sansSel?0:((_RF_SEL&&_RF_SEL.dP)||0);
  // ★★★ LA SIMULATION PART DE CE QU'ON SAIT DEJA — LES CONTRATS SIGNES.
  // ⚠⚠ AVANT : le socle lisait TOUJOURS headPerm, l'effectif permanent, equipes
  //   collectives EXCLUES. L'intention etait bonne (« on ne raisonne pas un
  //   recrutement sur des vendangeurs ») et le resultat faux des que l'embauche
  //   est FAITE : 34 vendangeurs deja sous contrat du 17 aout au 3 septembre
  //   n'existaient pas pour le simulateur, qui reclamait « 34 personnes de
  //   renfort a poser » pour une equipe deja embauchee. Pendant ce temps la
  //   frise annuelle, elle, lit `head` : elle montrait la vendange couverte.
  //   LE MEME MODULE DISAIT DEUX CHOSES — la faute exacte de §33 et §34.
  //   ★ Ce qui separe le socle du renfort n'est pas « permanent / saisonnier »,
  //   c'est « DEJA ENGAGE / ENCORE A DECIDER ». Un contrat signe ne se decide
  //   plus. Il se subit — et il se compte.
  //   'perm' reste accessible au selecteur : il repond a l'autre question,
  //   « de quoi aurais-je besoin si je n'avais embauche personne », utile pour
  //   preparer la campagne suivante. Ce n'est simplement plus le defaut.
  var eng=sansSel||!(_RF_SEL && _RF_SEL.base==='perm');
  function _hdW(w){ var v=eng?w.head:(w.headPerm!=null?w.headPerm:w.head); return (v!=null?v:(w.head||0))||0; }
  function _chW(w){ var v=eng?w.capH:w.capHPerm; return (v!=null)?v:null; }
  function _cpW(w){ var v=eng?w.capPay:w.capPayPerm; return (v!=null)?v:null; }
  var head=W.map(function(w){ return Math.max(0, _hdW(w)+dP); });
  var headMes=W.map(function(w){ return Math.max(0, _hdW(w)); });
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
    var cp=w.cap||0, ch=_chW(w);
    var hp=(ch!=null)?(ch+dP*cp):(head[j]*cp);
    return Math.max(0, hp-trac.etp*cp);
  });
  var dispo=W.map(function(w,j){ return ((w.cap||0)>0)?(hDisp[j]/w.cap):0; });
  var socle=0, capDispo=0;
  W.forEach(function(w,j){
    var cp=w.cap||0;
    var _cy=_cpW(w);
    socle+=((_cy!=null)?(_cy+dP*cp):(head[j]*cp))*rate;
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
           // ★ SOURCE UNIQUE DU MOT. Six ecrans nomment ce socle (ligne du
           //   graphe, colonne du tableau, KPI, selecteur, verdict, note de
           //   l'etape 5). Six libelles ecrits a la main auraient diverge des
           //   la premiere retouche — c'est ainsi qu'un ecran finit par
           //   contredire son voisin.
           base:(eng?'eng':'perm'),
           baseLbl:(eng?'d\u00e9j\u00e0 sous contrat':'permanents seuls'),
           baseCourt:(eng?'sous contrat':'permanents'),
           mode:(reste?'reste':'plan'), nSkip:nSkip, oDep:oDep, oToday:oT,
           chargePlan:cd.charge, capDispo:capDispo,
           socle:socle, charge:charge,
           manque:Math.max(0, charge-capDispo), renfortPic:rPic,
           renfortMini:(capT>0?Math.max(0,charge-capDispo)/(capT*c.rdt):0) };
}
// ★★★ « DEUX GRAPHES » N'EST PAS « DEUX SEMAINES DE MOINS ».
// ⚠⚠ Le test qui decidait d'afficher le second graphe portait sur `nSkip>0` :
//   des que la campagne avait commence, l'ecran dessinait DEUX FOIS le meme
//   profil — memes colonnes, meme ligne d'effectif, meme hauteur. Seuls le
//   voile gris et la legende de l'axe changeaient. Deux images identiques sous
//   deux titres differents (« ce qu'il reste » / « le plan de depart ») ne se
//   comparent pas : elles se contredisent en apparence, et le lecteur cherche
//   une difference qui n'existe pas.
// Ici on compare ce que l'œil verra, pas le compteur de semaines :
//   1. du travail a-t-il ete fait ? (les volumes diffreraient)
//   2. les semaines ecartees portaient-elles du travail ? (des colonnes
//      auraient disparu du dessin)
//   3. une fenetre de tache a-t-elle bouge ? (mode « reste » : la fenetre d'une
//      tache non commencee demarre aujourd'hui, ce qui DECALE ses colonnes)
// ⚠ HONNETETE SUR CE QUE MESURENT CES TROIS TESTS : sur les donnees d'AUJOURD'HUI,
//   `charge` est la somme des `tw` et les heures d'une semaine viennent des memes
//   fenetres — la comparaison (3) attraperait donc deja (1) et (2). Les deux
//   premieres sont des SORTIES ANTICIPEES, gardees parce qu'elles disent la
//   question en clair et coutent O(1). Elles sont eprouvees sur le contrat de la
//   fonction, pas sur un cas de production : une garde qu'aucun test ne peut
//   faire rougir rassure sans proteger (§34d).
// Si les trois reponses sont non, les deux contextes dessinent la meme image :
// on n'en garde qu'UN, et c'est le plan — son selecteur couvre toute la
// campagne, donc il permet de poser du renfort la ou l'autre l'interdisait.
function _rfMemeImage(P,R){
  if(!P||!R||!P.W||!R.W) return false;
  if(Math.abs((P.charge||0)-(R.charge||0))>0.5) return false;
  var i, av=0;
  for(i=0;i<(R.nSkip||0);i++) av+=((P.W[i]&&P.W[i].hours)||0);
  if(av>0.5) return false;
  var pw=P.tw||[], rw=R.tw||[];
  if(pw.length!==rw.length) return false;
  var map={};
  pw.forEach(function(t){ map[t.nom]=t; });
  for(i=0;i<rw.length;i++){
    var r=rw[i], p=map[r.nom];
    if(!p) return false;
    if(Math.abs((p.h||0)-(r.h||0))>0.5 || p.ws!==r.ws || p.we!==r.we) return false;
  }
  return true;
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
  var dec=(r&&!r.noRate&&!r.fini)?r:p;
  // Meme image des deux cotes : un seul contexte, donc un seul graphe. `meme`
  // dit a l'ecran POURQUOI il n'y en a qu'un, plutot que de le laisser croire
  // que la campagne n'a pas commence.
  if(dec!==p && _rfMemeImage(p,dec)) return { plan:p, dec:p, fini:false, meme:true };
  return { plan:p, dec:dec, fini:false };
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
    return { nom:t.nom, rest:t.h, h0:t.h, ouv:wOf(t.ws), lim:wOf(t.we-1),
             fin:null, dep:0, cpt:!!t.cpt, perdu:0 };
  });
  var hSup=0, induit=0, capRenf=0, pointe=0, inemploye=0, sem=0, fin0=null, parSem=[], apres=[];
  for(var w=0; w<nW+200; w++){
    var iw=Math.min(w,nW-1), cap=W[iw].cap||0, R=(prof&&prof[w])||0;
    if(R>pointe) pointe=R;
    var capS=(c.capS?c.capS(iw):cap);              // RENF-2 : heures PAYÉES d'un saisonnier (TESA = modèle de la semaine, CDD = fixe)
    if(w<nW) capRenf+=R*capS;
    var dispoP=ctx.dispo[iw]||0;
    var capNorm=dispoP*cap+R*c.rdt*capS;
    // RENF-2 : c.plaf = plafond hebdomadaire PAR PERSONNE, heures sup comprises, pour l'équipe seule (« Et sans
    //   renfort ? »). Proratisé sur la semaine entamée (capRatio). Sans plaf, capMax = capNorm (hMax = hJour).
    var capMax=(c.plaf>0)?Math.max(capNorm, dispoP*c.plaf*(W[iw].capRatio!=null?W[iw].capRatio:1)+R*c.rdt*capS)
                         :capNorm*(c.hMax/c.hJour);
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
    // \u2605 resteTot (nominal, toutes taches) voyage avec chaque semaine : c'est ce
    //   que la date de fin d'Aujourd'hui lit au dernier jour de la campagne.
    //   `apres` garde les semaines PROLONGEES (w >= nW, meme capacite que la
    //   derniere) : c'est la qu'une fin hors campagne se descend au jour
    //   (_pilFinJour). Le graphe de renfort ne lit que parSem[i<nW] : inchange.
    if(w<nW) parSem.push({w:w,R:R,cap:cap,capNorm:capNorm,used:used,reste:resteRet,resteTot:resteTot,dispo:dispoP});
    else apres.push({w:w,cap:cap,capNorm:capNorm,used:used,resteTot:resteTot});
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
           parSem:parSem, apres:apres };
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


// Fin REELLE de la semaine w, meme au-dela de la campagne. La boucle de _rfSim
// court jusqu'a nW+200 : une tache peut finir apres la derniere colonne connue.
// On prolonge de 7 jours par semaine plutot que de rendre une date fausse.
function _rfWkEnd(ctx,w){
  var last=ctx.W.length-1;
  if(w<0) w=0;
  return (w<=last) ? ctx.W[w].o1 : (ctx.W[last].o1+(w-last)*7);
}





// ══ RENF-2 (§224) — LE RENFORT, COMBIEN ET QUAND : SANS HEURES SUP ══════════════════════════════════
// Nico (03/10) : « il faut indiquer combien de saisonniers il faut à une période donnée, pour justement éviter
//   que l'équipe ait à faire des heures sup ». Maquette v2 validée le 03/10. La réponse arrive d'office :
//   tant qu'un travail déborde de sa fenêtre, on pose sur SA fenêtre (de son ouverture — ou d'aujourd'hui — à sa
//   limite) le plus petit nombre CONSTANT de saisonniers qui le fait tenir (_rfMinR, en plus de ce qui est
//   posé), puis on regroupe les semaines de même effectif. Un saisonnier en TESA suit l'horaire de l'équipe
//   (Nico : « ça suit l'horaire de l'équipe ») ; en CDD, c.hCdd heures fixes. Aucune heure sup nulle part :
//   elles n'existent que dans « Et sans renfort ? », qui les nomme et les chiffre aux taux du relevé.
var _RF_MOIS=['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];
function _rfCtxRenf(ctx){
  var contrat=(_RF_SEL&&_RF_SEL.contrat==='cdd')?'cdd':'tesa', W=ctx.W, hC=(ctx.c&&ctx.c.hCdd)||35;
  var c=Object.assign({}, ctx.c, { hMax:ctx.c.hJour, plaf:0, contrat:contrat,
    capS:function(i){ var w=W[i]||{}; if(!(w.cap>0)) return 0; return (contrat==='cdd')?hC*(w.capRatio!=null?w.capRatio:1):w.cap; } });
  return Object.assign({}, ctx, { c:c });
}
function _rfCalendrier(ctx){
  var x=_rfCtxRenf(ctx), n=x.W.length, prof=_rfProf(x,null), blocs=[], rMax=_rfRMax(x), garde=0;
  var res=_rfSim(x,prof);
  while(res.deborde && garde++<12){
    var late=(res.taches||[]).filter(function(s){ return s.dep>0||s.perdu>0.01||s.fin===null; })
      .sort(function(p,q){ return p.lim-q.lim; });
    if(!late.length) break;
    var s=late[0], tw=null;
    (x.tw||[]).forEach(function(t){ if(t.nom===s.nom) tw=t; });
    var a=tw?_rfWOf(x.W,tw.ws):0, b=Math.min(n-1,s.lim);
    if(b<a) b=a;
    var R=_rfMinR(x,a,b,rMax,s.nom,prof);
    if(!(R>0)){ blocs.push({nom:s.nom,a:a,b:b,R:null}); break; }
    for(var i=a;i<=b;i++){ if(x.W[i].cap>0) prof[i]+=R; }
    blocs.push({nom:s.nom,a:a,b:b,R:R});
    res=_rfSim(x,prof);
  }
  return { x:x, prof:prof, blocs:blocs, res:res, ok:!res.deborde };
}
function _rfPeriodes(cal){
  var x=cal.x, W=x.W, n=W.length, out=[], i=0;
  while(i<n){
    var r=cal.prof[i]||0;
    if(!(r>0)||!(W[i].cap>0)){ i++; continue; }
    var j=i, h=0, k;
    while(j+1<n && (cal.prof[j+1]||0)===r && W[j+1].cap>0) j++;
    for(k=i;k<=j;k++) h+=r*x.c.capS(k);
    var pour=[];
    cal.blocs.forEach(function(b){ if(b.R>0 && !(b.b<i||b.a>j) && pour.indexOf(b.nom)<0) pour.push(b.nom); });
    out.push({a:i,b:j,R:r,h:h,pour:pour});
    i=j+1;
  }
  return out;
}
// L'équipe SEULE, jusqu'à `plaf` heures par personne et par semaine (0 = aucune heure sup). Heures sup comme
// le relevé : au-delà du planning de la semaine, 25 % jusqu'à la 43e heure, 50 % au-delà, au taux de l'équipe.
function _rfSansRenfort(ctx,plaf){
  var c=Object.assign({}, ctx.c, { hMax:ctx.c.hJour, plaf:(plaf>0?plaf:0), capS:null });
  var x=Object.assign({}, ctx, { c:c }), r=_rfSim(x,_rfProf(x,null)), h25=0, h50=0;
  (r.parSem||[]).forEach(function(s){
    var p=s.dispo||0;
    if(!(p>0) || !(s.used>s.capNorm+1e-6)) return;
    var pp=s.used/p;
    h25+=p*Math.max(0,Math.min(pp,43)-s.cap);
    h50+=p*Math.max(0,pp-Math.max(43,s.cap));
  });
  return { r:r, h25:h25, h50:h50, hs:h25+h50, cout:(h25*1.25+h50*1.5)*(ctx.rate||0) };
}
// Le plafond proposé d'office : la semaine la plus longue du modèle du planning (Nico : 39 h l'été).
function _rfPlafDef(ctx){
  var m=(typeof window._planSemaineMax==='function')?(Number(window._planSemaineMax())||0):0, cm=0;
  (ctx.W||[]).forEach(function(w){ if((w.cap||0)>cm) cm=w.cap; });
  return Math.min(48, Math.max(Math.round(m>0?m:39), Math.ceil(cm)));
}
function _rfRetards(r){
  return (r.taches||[]).filter(function(s){ return s.dep>0||s.perdu>0.01||s.fin===null; })
    .map(function(s){ return _pilEsc(_pilTnom(s.nom).toLowerCase())+(s.perdu>0.01?' en partie perdue':(' +'+_pilNum(Math.max(1,s.dep))+' sem.')); });
}
function _rfCalSvg(cal,lg){
  var x=cal.x, W=x.W, n=W.length, par=cal.res.parSem||[], c=window._mvGraphCadre(lg,(lg<480?210:240),{padT:30});
  var mx=0;
  par.forEach(function(s){ var eq=(s.dispo||0)*(s.cap||0); if(s.used>mx) mx=s.used; if(eq>mx) mx=eq; });
  var pas=(mx>200?50:(mx>100?25:10)); mx=Math.max(pas,Math.ceil(mx/pas)*pas);
  var iw=c.iw/Math.max(1,n), bw=Math.max(2,iw*0.68), v, k;
  function X(i){ return c.padL+i*iw; }
  function Y(q){ return c.padT+c.ih*(1-q/mx); }
  var g='<defs><pattern id="rf2-h" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="5" fill="var(--gris)"/></pattern></defs>';
  for(v=0;v<=mx;v+=pas) g+='<line x1="'+c.padL+'" x2="'+(c.padL+c.iw)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="'+c.col.grille+'" stroke-width="'+c.trait.grille+'"/>'
    +'<text x="'+(c.padL-6)+'" y="'+(Y(v)+3.5)+'" text-anchor="end" font-size="'+c.txt.axe+'" fill="var(--texte-doux)">'+v+'</text>';
  par.forEach(function(s,i){
    if(!(W[i]&&W[i].cap>0)){ g+='<rect x="'+X(i)+'" y="'+c.padT+'" width="'+iw+'" height="'+c.ih+'" fill="url(#rf2-h)"/>'; return; }
    var eq=Math.min(s.used,(s.dispo||0)*s.cap), rf=Math.max(0,s.used-eq), cx=X(i)+(iw-bw)/2;
    if(eq>0) g+='<rect x="'+cx+'" y="'+Y(eq)+'" width="'+bw+'" height="'+(Y(0)-Y(eq))+'" fill="'+c.col.fait+'" rx="'+_PIL_GB.rv+'"/>';
    if(rf>0) g+='<rect x="'+cx+'" y="'+Y(eq+rf)+'" width="'+bw+'" height="'+(Y(eq)-Y(eq+rf))+'" fill="'+c.col.prevu+'" rx="'+_PIL_GB.rv+'"/>';
  });
  var d='';
  par.forEach(function(s,i){ var yy=Y((s.dispo||0)*s.cap); d+=(i?'L':'M')+X(i)+' '+yy+' L'+(X(i)+iw)+' '+yy+' '; });
  g+='<path d="'+d+'" fill="none" stroke="var(--texte)" stroke-width="'+c.trait.prevu+'" stroke-dasharray="4 3"/>';
  _rfPeriodes(cal).forEach(function(p){
    var x0=X(p.a)+1, w0=Math.max(4,X(p.b+1)-X(p.a)-2);
    g+='<rect x="'+x0+'" y="6" width="'+w0+'" height="15" rx="7.5" fill="var(--or-pale)" stroke="var(--or)"/>';
    if(w0>58) g+='<text x="'+(x0+w0/2)+'" y="17" text-anchor="middle" font-size="'+c.txt.mini+'" font-weight="600" fill="var(--texte)">'+p.R+' saisonnier'+(p.R>1?'s':'')+'</text>';
  });
  var last=-1;
  for(k=0;k<n;k++){ var m=W[k].m; if(m!=null && m!==last){ last=m; g+='<text x="'+(X(k)+2)+'" y="'+(c.h-8)+'" font-size="'+c.txt.axe+'" fill="var(--texte-doux)">'+_RF_MOIS[m]+'</text>'; } }
  return window._mvGraphSvg(c,'Heures faites par semaine : l\u2019\u00e9quipe et le renfort',g);
}
function _rfBody(d){
  _RF_RES=null;
  var P=_rfPair(d), ctxP=P.plan, ctx=P.dec;
  if(!ctxP) return _pilEmptyGo('Renseignez les dates de d\u00e9but et de fin de la p\u00e9riode : les fen\u00eatres de t\u00e2ches et la charge en d\u00e9coulent.','saisons','R\u00e9glages \u203a Saisons');
  if(ctxP.noRate) return _pilEmptyGo('Renseignez un <b>taux horaire</b> dans la fiche de chaque salari\u00e9 pour chiffrer le renfort.','equipe','R\u00e9glages \u203a \u00c9quipe');
  if(P.fini||!ctx||!ctx.W||!ctx.W.length) return '<div class="rf-how">La campagne est <b>termin\u00e9e</b> : il ne reste rien \u00e0 renforcer.</div>';
  var cal=_rfCalendrier(ctx), x=cal.x, W=x.W, n=W.length, per=_rfPeriodes(cal);
  var tauxR=(x.c.tauxRenfort>0?x.c.tauxRenfort:x.rate), pointe=0, hTot=0;
  per.forEach(function(p){ if(p.R>pointe) pointe=p.R; hTot+=p.h; });
  var cTot=hTot*tauxR+pointe*(x.c.fixe||0);
  _RF_RES={ ok:cal.ok, pointe:pointe, cout:cTot };
  function jr(o){ return _pilDfr(_rfIso(o)); }
  var cdd=(x.c.contrat==='cdd'), H='';
  // Le verdict
  if(!cal.ok){
    var bl=cal.blocs[cal.blocs.length-1]||{};
    H+='<div class="rf2-v"><span class="pil-big">\u2014</span><span class="rf2-vu">'+_mvIcon('alerte',16)+' '
      +_pilEsc(_pilTnom(bl.nom||'').toLowerCase()||'le travail')+' ne tient pas dans sa fen\u00eatre, m\u00eame avec du renfort</span></div>'
      +'<div class="rf-how">La fen\u00eatre est trop courte pour ce qui reste. \u00c9largissez-la (roue crant\u00e9e, fen\u00eatres des t\u00e2ches) ou acceptez le retard.</div>';
  } else if(!pointe){
    H+='<div class="rf2-v"><span class="pil-big green">0</span><span class="rf2-vu">renfort : l\u2019\u00e9quipe suffit</span></div>'
      +'<div class="rf2-ok">\u2713 Tout tient dans les fen\u00eatres, aux heures du planning \u00b7 0 heure sup</div>';
  } else {
    var gap=per.length>1;
    H+='<div class="rf2-v"><span class="pil-big">'+pointe+'</span><span class="rf2-vu">saisonnier'+(pointe>1?'s':'')+'</span>'
      +'<span class="rf2-vq">du '+jr(W[per[0].a].o0)+' au '+jr(W[per[per.length-1].b].o1)+(gap?', avec des pauses':'')+'</span></div>'
      +'<div class="rf2-ok">\u2713 Tout tient dans les fen\u00eatres \u00b7 0 heure sup</div>';
  }
  // Le calendrier
  if(pointe){
    H+='<div class="rf-step"><div class="rf-t">Le calendrier '+_mvInfoBtn('pil.sim.frise')+'</div></div><div class="rf2-cal">';
    per.forEach(function(p,k){
      if(k>0){
        var prv=per[k-1], ferme=true;
        for(var q=prv.b+1;q<p.a;q++){ if(W[q].cap>0) ferme=false; }
        if(p.a>prv.b+1) H+='<div class="rf2-row gap"><div class="per">'+(ferme?'Domaine ferm\u00e9':'Pas de renfort')+'<small>du '+jr(W[prv.b+1].o0)+' au '+jr(W[p.a-1].o1)+'</small></div><div class="nb">\u2014</div></div>';
      }
      var l=(p.a/n*100).toFixed(2), w=((p.b-p.a+1)/n*100).toFixed(2);
      H+='<div class="rf2-row"><div class="per">Du '+jr(W[p.a].o0)+' au '+jr(W[p.b].o1)
        +'<small>pour '+p.pour.map(function(t){ return _pilEsc(_pilTnom(t).toLowerCase()); }).join(', ')+' \u00b7 '+_pilNum(p.h)+' h \u00b7 '+_ecoEur(p.h*tauxR)+'</small></div>'
        +'<div class="nb">'+p.R+'<small>saisonnier'+(p.R>1?'s':'')+'</small></div>'
        +'<div class="rf2-fr"><i style="left:'+l+'%;width:'+w+'%"></i></div></div>';
    });
    var fins=(cal.res.taches||[]).filter(function(s){ return s.fin!==null; }).map(function(s){
      return _pilEsc(_pilTnom(s.nom).toLowerCase())+' fini vers le '+jr(_rfWkEnd(x,s.fin)); });
    H+='<div class="rf2-row fin"><div class="per">Ensuite : l\u2019\u00e9quipe suffit<small>'+fins.join(' \u00b7 ')+'</small></div><div class="nb">0</div></div></div>'
      +'<div class="rf2-tot"><span>Renfort : <b>'+_pilNum(hTot)+' h pay\u00e9es</b> \u00b7 <b>'+_ecoEur(cTot)+'</b>'
      +((x.c.fixe>0)?(' <small>(dont '+_ecoEur(pointe*x.c.fixe)+' d\u2019embauche)</small>'):'')+'</span><span>Heures sup : <b>0</b></span></div>';
  }
  // Et sans renfort ?
  if(pointe && cal.ok){
    var pd=_rfPlafDef(x), opts=[pd,43,48].filter(function(v,i,a){ return a.indexOf(v)===i; }).sort(function(p,q){ return p-q; });
    var pl=(_RF_SEL.plaf>0&&opts.indexOf(_RF_SEL.plaf)>=0)?_RF_SEL.plaf:pd;
    var S=_rfSansRenfort(x,pl), S0=_rfSansRenfort(x,0), r1=_rfRetards(S.r), r0=_rfRetards(S0.r);
    var cm=0; W.forEach(function(w){ if((w.cap||0)>cm) cm=w.cap; });
    var plMin=null;
    for(var C=Math.max(1,Math.ceil(cm));C<=48;C++){ if(!_rfSansRenfort(x,C).r.deborde){ plMin=C; break; } }
    var Smin=plMin?_rfSansRenfort(x,plMin):null;
    H+='<div class="rf-step"><div class="rf-t">Et sans renfort ? '+_mvInfoBtn('pil.sim.cout')+'</div></div>'
      +'<div class="rf2-seg"><span>L\u2019\u00e9quipe monte jusqu\u2019\u00e0</span><div class="pil-seg">'
      +opts.map(function(v){ return '<button type="button" data-p="'+Number(v)+'"'+(v===pl?' class="on"':'')+' onclick="window._rfPlaf(this.dataset.p)">'+Number(v)+' h</button>'; }).join('')
      +'</div><span>par semaine</span></div>'
      +'<div class="rf2-cmp">'
      +'<div class="rf2-l reco"><div class="a">Avec le renfort propos\u00e9</div><div class="e">'+_ecoEur(cTot)+'</div>'
      +'<div class="d">'+pointe+' saisonnier'+(pointe>1?'s':'')+' \u00b7 0 heure sup \u00b7 <b>tout tient</b> dans les fen\u00eatres</div></div>'
      +'<div class="rf2-l"><div class="a">Sans renfort, l\u2019\u00e9quipe \u00e0 '+pl+' h</div><div class="e">'+_ecoEur(S.cout)+'</div>'
      +'<div class="d">'+_pilNum(S.hs)+' h sup'+(S.h50>0.5?(' ('+_pilNum(S.h25)+' h \u00e0 25 %, '+_pilNum(S.h50)+' h \u00e0 50 %)'):' \u00e0 25 %')+' \u00b7 '
      +(r1.length?('<b>en retard</b> : '+r1.join(' \u00b7 ')):'<b class="v">tout tient</b> dans les fen\u00eatres')+'</div></div>'
      +'<div class="rf2-l"><div class="a">Sans renfort ni heures sup</div><div class="e">0 \u20ac</div>'
      +'<div class="d">'+(r0.length?('<b>en retard</b> : '+r0.join(' \u00b7 ')):'<b class="v">tout tient</b> dans les fen\u00eatres')+'</div></div></div>'
      +'<div class="rf2-pied">'+(Smin?('Pour tout tenir sans renfort, il faudrait des semaines de <b>'+plMin+' h</b> : '+_pilNum(Smin.hs)+' h sup, '+_ecoEur(Smin.cout)+'. ')
         :'M\u00eame \u00e0 48 h par semaine, l\u2019\u00e9quipe seule ne tient pas les fen\u00eatres. ')
      +'Heures sup compt\u00e9es comme le relev\u00e9, au taux de l\u2019\u00e9quipe ; le co\u00fbt du retard lui-m\u00eame n\u2019est pas chiffr\u00e9.</div>';
  }
  // Semaine par semaine
  H+='<div class="rf-step"><div class="rf-t">Semaine par semaine '+_mvInfoBtn('pil.sim.semaine')+'</div></div>'
    +'<div style="width:100%;overflow-x:auto" id="rf-g-cal"></div>'
    +'<div class="rf2-leg"><span><span class="rf-k" style="background:var(--vert-med)"></span>fait par l\u2019\u00e9quipe</span>'
    +'<span><span class="rf-k" style="background:var(--or)"></span>fait par le renfort</span>'
    +'<span><span class="rf-k rf2-tir"></span>l\u2019\u00e9quipe aux heures du planning</span>'
    +'<span><span class="rf-k rf2-ferme"></span>domaine ferm\u00e9</span></div>';
  window._mvGraphSuivre('#rf-g-cal', function(lg){ return _rfCalSvg(cal,lg); });
  // Ce que le calcul suppose
  var hyp=(cdd?'CDD \u00e0 '+(x.c.hCdd||35)+' h fixes':'TESA \u00e0 l\u2019horaire de l\u2019\u00e9quipe')+' \u00b7 cadence '+_pilNum(x.c.rdt*100)+' % \u00b7 '+_ecoEur(tauxR)+'/h \u00b7 heures du planning \u00b7 aucune heure sup';
  H+='<div class="rf-lim">'+hyp+' '+_mvInfoBtn('pil.sim.modele')+'</div>'
    +'<div class="rf2-seg"><span>Contrat du renfort :</span><div class="pil-seg">'
    +'<button type="button"'+(cdd?'':' class="on"')+' onclick="window._rfContrat(\'tesa\')">TESA</button>'
    +'<button type="button"'+(cdd?' class="on"':'')+' onclick="window._rfContrat(\'cdd\')">CDD '+(x.c.hCdd||35)+' h</button></div></div>';
  // Choisir moi-même la période
  var a=(_RF_SEL.choix?_RF_SEL.a:(per[0]?per[0].a:0)), b=(_RF_SEL.choix?_RF_SEL.b:(per.length?per[per.length-1].b:n-1));
  a=Math.max(0,Math.min(n-1,a||0)); b=Math.max(a,Math.min(n-1,(b==null?n-1:b)));
  var rc=_rfMinR(x,a,b,_rfRMax(x),null), so=function(cle,sel){
    var h='<select data-cle="'+_pilEsc(cle)+'" onchange="window._rfChoix(this.dataset.cle,this.value)">';
    for(var i=0;i<n;i++){ if(W[i].cap>0) h+='<option value="'+i+'"'+(i===sel?' selected':'')+'>'+_rfLabJ(W,i)+'</option>'; }
    return h+'</select>';
  };
  H+='<details class="rf2-choix"'+(_RF_SEL.ouvert?' open':'')+'><summary>Choisir moi-m\u00eame la p\u00e9riode '+_mvInfoBtn('pil.sim.plan')+'</summary>'
    +'<div class="rf2-seg"><span>Du</span>'+so('a',a)+'<span>au</span>'+so('b',b)+'</div>'
    +'<div class="rf2-pied">'+((rc==null)?'Sur cette p\u00e9riode, m\u00eame beaucoup de monde ne suffit pas : un travail d\u00e9borde avant ou apr\u00e8s.'
       :(rc===0)?'Personne : l\u2019\u00e9quipe suffit sur cette p\u00e9riode.'
       :('\u2192 <b>'+rc+' saisonnier'+(rc>1?'s':'')+'</b> sur cette p\u00e9riode pour que tout tienne. M\u00eame r\u00e8gle : heures du planning, aucune heure sup.'))+'</div></details>';
  return H;
}
window._rfContrat=function(v){ _RF_SEL.contrat=(v==='cdd')?'cdd':'tesa'; _rfRefresh(); };
window._rfPlaf=function(v){ var q=Number(v); _RF_SEL.plaf=(q>0)?q:0; _rfRefresh(); };
window._rfChoix=function(cle,v){
  var q=parseInt(v,10); if(!isFinite(q)) return;
  if(!_RF_SEL.choix){ _RF_SEL.choix=true; }
  if(cle==='a') _RF_SEL.a=q; else _RF_SEL.b=q;
  if(_RF_SEL.b<_RF_SEL.a){ var t=_RF_SEL.a; _RF_SEL.a=_RF_SEL.b; _RF_SEL.b=t; }
  _RF_SEL.ouvert=true; _rfRefresh();
};

function _pilPanelRenfort(d){
  _RF_D=d;
  // RENF-2 (§224) : la tuile redit le calendrier — l'effectif le plus haut et son coût, ou « l'équipe suffit ».
  // MOTS-10 (§594) : la pastille de L'équipe & le matériel (« à prévoir », « l'équipe suffit ») ; l'intérieur suit le lot du renfort.
  var corps=_rfBody(d), stat=_pilStat('\u2014',''), Q=_RF_RES;
  if(Q && Q.ok) stat=Q.pointe ? _pilStat(Q.pointe,' saisonnier'+(Q.pointe>1?'s':'')+' \u00b7 '+_ecoEur(Q.cout))+_pilPhPl('\u00e0 pr\u00e9voir','or') : _pilStat('0','')+_pilPhPl('l\u2019\u00e9quipe suffit','ok');
  return _pilTile('renfort','#C9A84C','Renfort', stat,
    'aux heures du planning, sans heures sup', null,
    '<div id="pil-rf-body">'+corps+'</div>');
}

function _rfRefresh(){
  var host=document.getElementById('pil-rf-body');
  if(host && _RF_D){
    host.innerHTML=_rfBody(_RF_D);
    // Le simulateur se reconstruit a chaque interaction, hors du chemin de
    // _pilFillContent : il repeint donc ses graphes lui-meme.
    if(window._mvGraphRepeindre) window._mvGraphRepeindre();
  }
}

// ★ MOTS-10 (§594) : Décider allégé SUR PLACE — la règle de Travaux (§590) : une phrase en haut (_pilDcPhrase), les trois cartes
//   repliées (un titre, un chiffre, une pastille), le détail au toucher, un bouton vers le module où l'on agit. Les simulateurs
//   et leurs calculs ne bougent pas : seuls leurs mots, et ce qui se redisait d'un bloc à l'autre.
function _pilTabSim(d){
  var H='';
  if(_pilShow('sim_ordre')) H+=_pilPanelOrdrePassage(d);
  if(_pilShow('sim_etsi')) H+=_pilPanelSimulateur(d);
  if(_pilShow('sim_cout')) H+=_pilPanelRenfort(d);
  if(!H) return '<div class="pil-empty">Aucun indicateur affich\u00e9 \u2014 activez-les via \u00ab Choisir les indicateurs \u00bb.</div>';
  return '<div class="pil-tv pil-dc"><div class="pil-panels">'+H+'</div></div>';
}
// La phrase du haut : le travail, jusqu'où ce soir, la fin prévue, le renfort. Les nombres des trois cartes, lus sur LEURS calculs
//   (_DZ_LAST pour la tournée, _DZ_REP_LAST pour « Qui fait quoi », _RF_RES pour le renfort) : aucun calcul de plus. Elle suit les
//   essais (le jour choisi, une personne de plus) et le dit : « simulation ».
function _pilDcPhrase(){
  var p=[], C=_pilShow('sim_ordre')?_DZ_LAST:null, R=_pilShow('sim_etsi')?_DZ_REP_LAST:null, Q=_pilShow('sim_cout')?_RF_RES:null;
  var nom=(_PIL_OP&&_PIL_OP.tasks||[]).map(_opTNom).join(' + ');
  if(C&&C.rows&&C.rows.length&&C.sim&&C.sim.days.length){
    var d1=C.sim.days[0], si=d1.parcs.length?d1.parcs[d1.parcs.length-1]:0, st=C.rows[si], fin=C.sim.days[C.sim.days.length-1].iso;
    var ko=C.ver.some(function(v){ return !v.ok; });
    p.push('<b>'+_pilEsc(nom)+'</b> : '+(C.ref.iso===_dzAuj()?'ce soir':'le '+_dzJc(C.ref.iso))+' \u00e0 <b>'+_pilEsc(st.nom)+'</b>');
    if(C.sim.bloque) p.push('<b class="ko">ne finit pas</b>');
    else p.push('fin pr\u00e9vue <b'+(ko?' class="ko"':'')+'>'+_dzJc(fin)+'</b>'+(ko?' \u00b7 <b class="ko">d\u00e9borde</b>':''));
  } else if(C&&C.rows&&!C.rows.length&&nom) p.push('<b>'+_pilEsc(nom)+'</b> : rien \u00e0 faire');
  else if(R&&R.taches.length){
    var fR=_dzRepFin(R), kR=R.taches.some(function(x){ return !x.rien&&!x.ok; });
    if(fR) p.push('fin pr\u00e9vue <b'+(kR?' class="ko"':'')+'>'+_dzJc(fR)+'</b>');
  }
  if(Q&&Q.ok) p.push(Q.pointe?'<b class="or">'+_dzPl(Q.pointe,'saisonnier')+' \u00e0 pr\u00e9voir</b>':'l\u2019\u00e9quipe suffit');
  if((_PIL_OP&&_dzMod())||_dzRepSim()) p.push('simulation');
  return p.length?'<span class="pil-tv-ph">'+p.join(', ')+'</span>':_pilEsc(_pilTabLabel('sim'));
}
function _pilDcPhraseMaj(){ if(_PIL_TAB!=='sim') return; var el=document.getElementById('pil-souslig-t'); if(el) el.innerHTML=_pilDcPhrase(); }



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
  try{ if(typeof window.saveData==='function') window.saveData('config'); }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilObjectifSet'); }
  return true;
}
// PRO-1 (§269) : le bouton « Objectif » du cockpit (il affichait un message de démonstration au lieu de régler la date).
window._pilObjectifRegler=function(iso){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||''))) return false;
  if(!_pilObjectifSet(iso)) return false;
  _pilFillContent(_pilData());
  if(window.showToast) window.showToast('Objectif mis à jour','#3D6B27');
  return true;
};

// ── Jours ouvrés : objet Date + différence signée ──
// ★★★ PIL-FIX-1 (§440) — UN JOUR OUVRÉ EST UN JOUR OÙ LE DOMAINE TRAVAILLE AU PLANNING (Nico, 10/10 : « toujours se baser
//   sur le planning »). Avant : lundi→vendredi du calendrier, rien d'autre — le 11 novembre et le 25 décembre comptaient,
//   et les vendredis chômés de l'annualisation aussi (modèle standard 2026 : deux vendredis travaillés sur quatre en
//   novembre, aucun en décembre). La marge d'Aujourd'hui, la fin à la cadence et les « N j » des Échéances se trompaient
//   d'autant (audit du 23/10, 23 oct → 15 nov : 15 jours comptés). Chaque jour est désormais demandé à _pilJourDomaine —
//   la MÊME règle que l'Effectif et les Présences (AUJ-5), fériés compris (_pilPrevuLe).
//   ⚠️ Garde : un planning muet _PIL_MUET_J jours de suite (des membres sous contrat, personne de prévu) n'est plus lu
//   comme une fermeture : le compte repasse au calendrier. Sans elle, _pilWdDateObj pouvait courir 4 000 jours.
//   ⚠️ `chantier` (fenêtre de chantier) reste ce qu'il était : tous les jours comptent.
var _PIL_MUET_J=45;
function _pilCompteurOuvre(chantier){
  var C={}, vide=0, muet=false;
  return function(dt){
    if(chantier) return true;
    if(muet) return _pilJourCalendrier(dt);
    var k=_pilPhotoIso(dt), v=(k in C)?C[k]:(C[k]=_pilJourDomaine(dt));
    if(v){ vide=0; return true; }
    if(++vide>=_PIL_MUET_J){ muet=true; if(window.logError) window.logError({ level:'info', cat:'pilotage', msg:'jours ouvrés : planning muet '+_PIL_MUET_J+' j, repli sur le calendrier' }); }
    return false;
  };
}
function _pilWdDateObj(n,from,chantier){
  var dt=from?new Date(from):new Date(); if(n==null) return dt;
  var ouv=_pilCompteurOuvre(!!chantier), added=0, guard=0;
  while(added<n && guard<4000){ guard++; dt.setDate(dt.getDate()+1); if(ouv(dt)) added++; }
  return dt;
}
function _pilWdBetween(a,b){
  var d=new Date(a), end=new Date(b); d.setHours(0,0,0,0); end.setHours(0,0,0,0);
  if(d.getTime()===end.getTime()) return 0;
  // ★ PIL-FIX-1 (§440) : les deux sens comptent la MÊME chose — les jours travaillés APRÈS la date la plus tôt, jusqu'à
  //   la plus tardive comprise. Avant, le sens « retard » marchait à reculons et comptait [objectif, fin) : un objectif
  //   posé un dimanche (le 15 novembre 2026) et une fin un mardi donnaient 1 jour de retard au lieu de 2.
  var sign=end>d?1:-1; if(sign<0){ var x=d; d=end; end=x; }
  var ouv=_pilCompteurOuvre(false), n=0, guard=0;
  while(d.getTime()!==end.getTime() && guard<4000){ guard++; d.setDate(d.getDate()+1); if(ouv(d)) n++; }
  return n*sign;
}
function _pilDfrObj(dt){ var M=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'], J=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.']; return J[dt.getDay()]+' '+dt.getDate()+' '+M[dt.getMonth()]; }
function _pilEtpFmt(v){ return (Math.round((Number(v)||0)*10)/10).toString().replace('.',','); }

// ══ LA DATE DE FIN VIENT DU SIMULATEUR DE LA CAMPAGNE ═══════════════════
// ⚠️⚠️ DEFAUT MESURE LE 10/09/2026, CAPTURE DE NICO A L'APPUI.
//   « +32 j d'avance, fin le 15 fevr. » sur Aujourd'hui ; sur La campagne, les
//   memes donnees dessinaient du ROUGE fin mars (travail en retard) et le
//   tableau des fenetres disait 4,9 personnes necessaires pour 2,8 la.
//   Le cockpit avait SON moteur (_pilCapaProj, supprime ici) : il cumulait
//   toute la capacite de l'equipe contre toute la charge a partir du 1er
//   octobre, comme si la taille pouvait se faire en octobre — huit semaines
//   d'equipe comptees pour un travail dont la fenetre ouvre le 26 novembre.
//   Il ne retirait pas les heures tracteur, et ignorait que les fenetres se
//   chevauchent. Chaque chiffre etait defendable seul ; leur voisinage mentait
//   (§103, la meme lecon, un onglet plus loin). Mesure au bac, fonctions
//   reelles, domaine synthetique cale sur la capture : +51 j d'avance ici,
//   409 h en retard au 31 mars la, fin le 19 mai.
// ★ UN SEUL MOTEUR. La date lit _rfCtx(d,'reste') + _rfSim, exactement ce que
//   La campagne dessine avec « aucun renfort » : chaque travail dans SA
//   fenetre, les taches ouvertes en meme temps se partagent l'equipe, le
//   tracteur est deduit, contrats et planning (CP, fermeture) lus jour par
//   jour. Trois ecarts VOULUS avec La campagne, ecrits a l'ecran et dans MV_INFO :
//   - la capacite NORMALE (hMax = hJour). Nico, 10/09 : « si je ne touche rien
//     a mon planning et mes embauches aujourd'hui, a quelle date les travaux
//     seront termines ». Pas d'heures sup dans une date « si je ne touche
//     rien » ; La campagne, elle, cherche ce qu'il FAUDRAIT, et s'en autorise.
//   - PAS de rallongement du retard (c.k = 0). Le simulateur suppose qu'un
//     travail hors fenetre coute +15 %/semaine : juste pour dimensionner un
//     renfort, absurde pour une date — mesure au bac, 644 h restantes le
//     31 mars finissaient le 20 JUILLET, le facteur ayant atteint x4. Une date
//     « si je ne touche rien » lit les heures du planning, sans penalite.
//   - le facteur de cadence mesure (_pilFacteurK), applique aux heures des
//     taches quand _pecData le juge applicable. La campagne raisonne au bareme.
//   Au-dela de la derniere semaine planifiee, _rfSim reconduit l'equipe de
//   cette semaine-la (memes heures, meme tracteur) : la date sort quand meme,
//   marquee « vers le », et la phrase dit ce qu'il restait a la fin du cadre.
function _pilFacteurK(){
  var k=1, kOk=false, kHors=false, kEcart=null;
  try{
    var E=_pecData();
    // ★ LA BORNE [0,5 ; 3] VIT DANS _pecData (10/09/2026) : E.cad.applic est
    //   faux hors bornes ou en source historique, E.cad.horsBornes dit pourquoi.
    //   Un facteur qui mesure un trou de saisie ne vaut pas plus pour des
    //   jours que pour des euros.
    if(E&&E.cad&&E.cad.ok){
      kEcart=E.cad.ecart; kHors=!!E.cad.horsBornes;
      if(E.cad.applic){ k=1+((E.cad.ecart||0)/100); if(k>0) kOk=true; else k=1; }
    }
  }catch(e){ k=1; kOk=false; }
  return { k:k, kOk:kOk, kHors:kHors, kEcart:kEcart };
}
// Le jour ou la semaine w finit son travail : les heures consommees cette
// semaine-la, posees sur les heures REELLES de l'equipe jour par jour
// (_mvCapReelIn : le planning de chacun), a la part du tracteur pres. Une
// semaine prolongee (w au-dela de la campagne) reprend le profil de la
// derniere semaine, decale de sept jours par semaine — la convention de
// _rfWkEnd. Une semaine de 300 h ne fait pas « finir dimanche » un travail
// termine le mardi (lecon du 12/08, conservee).
function _pilFinJour(ctx, w, usedH, capNormH){
  var W=ctx.W, last=W.length-1, wk=W[Math.min(Math.max(0,w),last)];
  var shift=(w>last)?7*(w-last):0, o0=wk.o0, o1=wk.o1, jours=[], tot=0;
  for(var o=o0;o<=o1;o++){
    var R=(typeof window._mvCapReelIn==='function')?window._mvCapReelIn(ctx.cd,o,o+1):null;
    var h=(R&&R.work>0)?R.work:0; jours.push(h); tot+=h;
  }
  if(!(tot>0)||!(capNormH>0)) return o1+shift;
  var ratio=capNormH/tot, cum=0, need=usedH-1e-6;
  for(var i=0;i<jours.length;i++){ if(!(jours[i]>0)) continue; cum+=jours[i]*ratio; if(cum>=need) return o0+i+shift; }
  return o1+shift;
}
// La projection du cockpit. null = le simulateur n'a pas de quoi raisonner
// (pas de periode, planning vide, campagne finie) : _pilMargeCalc retombe
// alors sur la cadence, et le dit.
function _pilFinPlan(d){
  var ctx=null; try{ ctx=_rfCtx(d,'reste',null,{sansTaux:true,sansSel:true}); }catch(e){ ctx=null; }
  if(!ctx||ctx.noRate||ctx.fini||!ctx.W||!ctx.W.length) return null;
  var K=_pilFacteurK(), k=K.k;
  var today=new Date(); today.setHours(0,0,0,0);
  var nW=ctx.W.length, finCamp=_pilOrdDate(ctx.W[nW-1].o1);
  var base={ k:k, kOk:K.kOk, kHors:K.kHors, kEcart:K.kEcart, finCamp:finCamp, nW:nW, ctx:ctx };
  if(!(ctx.charge>0.5)||!ctx.tw.length) return Object.assign(base,{ ok:true, fin:today, fini:true, hors:false, approx:false, besoin:0, resteFin:0, nDep:0, taches:[] });
  // Heures des taches x facteur de cadence ; capacite NORMALE (pas d'heures
  // sup) ; aucun rallongement du retard (k=0). Le couperet des taches sans
  // rattrapage (vendange) reste : ce qui n'est pas fait dans la fenetre est perdu.
  var tw=ctx.tw.map(function(t){ return { nom:t.nom, h:t.h*k, ws:t.ws, we:t.we, cpt:t.cpt }; });
  var c=Object.assign({}, ctx.c, { hMax: ctx.c.hJour, k: 0 });
  var C=Object.assign({}, ctx, { tw:tw, c:c, charge:ctx.charge*k });
  var r=_rfSim(C,null);
  var finW=null, inachev=false;
  (r.taches||[]).forEach(function(s){ if(s.fin==null) inachev=true; else if(finW==null||s.fin>finW) finW=s.fin; });
  var taches=(r.taches||[]).map(function(s){
    var fw=s.fin, o1=(fw==null)?null:_rfWkEnd(ctx,fw), lo=(o1==null)?null:((fw<nW)?ctx.W[fw].o0:(o1-6));
    return { nom:s.nom, sem:fw, fin:(o1==null)?null:_pilOrdDate(o1), lbl:(o1==null)?'':_rfLabJ([{o0:lo,o1:o1}],0),
             hors:(fw!=null&&fw>=nW), dep:s.dep||0, perdu:s.perdu||0, lim:_pilOrdDate(_rfWkEnd(ctx,s.lim)) };
  });
  var resteFin=(r.parSem&&r.parSem.length)?(r.parSem[r.parSem.length-1].resteTot||0):0;
  var nDep=(r.taches||[]).filter(function(s){ return s.dep>0; }).length;
  if(inachev||finW==null){
    // Plus aucune heure planifiee ne fait avancer le travail : la derniere
    // semaine, reconduite, ne delivre rien. C'est une REPONSE, chiffree.
    return Object.assign(base,{ ok:false, fin:null, fini:false, hors:true, approx:false, besoin:C.charge,
                                manque:resteFin, resteFin:resteFin, nDep:nDep, taches:taches });
  }
  var hors=(finW>=nW);
  var ps=hors?(((r.apres||[])[finW-nW])||null):(r.parSem[finW]||null);
  var jour=ps?_pilFinJour(ctx,finW,ps.used,ps.capNorm):_rfWkEnd(ctx,finW);
  return Object.assign(base,{ ok:true, fin:_pilOrdDate(jour), finOrd:jour, fini:false, hors:hors, approx:hors,
                              besoin:C.charge, resteFin:(hors?resteFin:0), deborde:!!r.deborde, nDep:nDep,
                              taches:taches });
}
// ★ L'inverse LOCAL de _pilAnnOrd (qui parse en heure locale). Le constructeur
//   Date(an, mois, 1+o) deborde proprement de jour en jour : pas de +86400000
//   qui, a cheval sur un changement d'heure, tomberait a 23 h la veille. _pilOrdD
//   reste l'inverse UTC (pour les ISO et les accesseurs getUTC*) — deux inverses,
//   un par horloge, jamais l'une lue avec les accesseurs de l'autre.
function _pilOrdDate(o){ return new Date(2026,0,1+o); }

// ── Marge : projection vs objectif ──
function _pilMargeCalc(d){
  var c=_pilEchCadence(d), cadH=c.cadH;
  var charge=d.totalReste||0;
  var sa=(typeof window._pilSaison==='function')?window._pilSaison():null;
  var noms=(typeof window.getTachesSaison==='function')?window.getTachesSaison().map(function(t){return t.nom;}):[];
  var fen=(typeof window._mvFenetre==='function')?window._mvFenetre(sa,noms):null;
  var today=new Date(); today.setHours(0,0,0,0);
  // DEPART DU REPLI cadence : jamais avant l'ouverture de la fenetre. Projeter
  // depuis le jour de consultation affichait « +4 j d'avance » un 26 juillet,
  // sur une vendange qui ne demarre pas avant le 26 aout. Le simulateur, lui,
  // ouvre chaque tache a SA date : il n'a pas besoin de ce depart.
  var start=new Date(today.getTime());
  if(fen&&fen.debut){ var _fd=new Date(fen.debut+'T00:00:00'); if(_fd>start) start=_fd; }

  // 1) Le simulateur de La campagne, quand le planning en connait une.
  //    ★ Les jours ouvres se comptent depuis AUJOURD'HUI : « d'ici la » disait
  //    97 j ouvres comptes depuis le 1er octobre, un 10 septembre.
  var P=null; try{ P=_pilFinPlan(d); }catch(e){ P=null; }
  var proj=null, seasonJ=null, src=null;
  if(P&&P.ok&&P.fin){ proj=P.fin; seasonJ=Math.max(0,_pilWdBetween(today,P.fin)); src='planning'; }
  // 2) Repli ANNONCE sur la cadence des 4 dernieres semaines : elle ne connait
  //    pas les embauches a venir, l'ecran le dit au lieu de laisser croire.
  if(!proj && cadH>0){
    seasonJ=Math.ceil(charge/cadH);
    proj=_pilWdDateObj(seasonJ,start,!!(fen&&fen.chantier));
    src='cadence';
  }
  var objIso=_pilObjectifGet();
  var obj=objIso?new Date(objIso+'T00:00:00'):null;
  var marge=(proj&&obj)?_pilWdBetween(proj,obj):null;
  return { cadH:cadH, estim:c.estim, seasonJ:seasonJ, proj:proj, objIso:objIso, obj:obj,
           marge:marge, fen:fen, start:start, today:today, src:src, capa:P };
}

// ── Frise de saison : aujourd'hui → objectif, fin prévue + marge ──
var _PIL_TL_ECART = 0.22;   // TOUR-6 : sous cet ecart (part de la frise), deux etiquettes ne tiennent pas cote a cote

// ── Mini-KPI du cockpit ──
// ── La Cave, en une photo et un bouton (lot CAVE-3). L'onglet Pilotage › Cave
window._pilOuvrirCave=function(sec){
  // REV-1 : la section est un argument (défaut : Aujourd'hui) — le Revient ouvre Le millésime ou Le Cuvier.
  var _s=(typeof sec==='string'&&sec)?sec:'aujourdhui';
  if(typeof window.selectCaveSection==='function'){ try{ window.selectCaveSection(_s); }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilOuvrirCave'); } }
  if(typeof goTo==='function') goTo('cave');
  if(typeof window.selectCaveSection==='function'){ try{ window.selectCaveSection(_s); }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilOuvrirCave#2'); } }
};

// ── Tuiles « décision du jour » ──
// ════════════════════════════════════════════════════════════════════════
// PROT-1 (§218) — LA PROTECTION RESTANTE, PARCELLE PAR PARCELLE
// Le registre (TRAITEMENTS) dit QUAND et AVEC QUOI chaque parcelle a été traitée ;
// il ne dit pas combien de temps ça protège. Trois rémanences, par MODE D'ACTION,
// réglées dans Réglages › Pilotage › Conformité (défauts sourcés, §218a) :
//   contact 10 j · pénétrant 12 j · systémique 14 j.
// Le mode d'action d'un produit se DÉDUIT de sa substance active (p.sub), sinon de
// son nom ; inconnu → contact, la rémanence la plus courte (prudent), et c'est dit.
// Un traitement protège aussi longtemps que son produit le plus rémanent.
// ⚠️ Pas de lessivage ici : l'appli n'enregistre pas la pluie tombée depuis le
// traitement (lot PLUIE-1). Pas de pousse non plus. Les jours seuls.
// ════════════════════════════════════════════════════════════════════════
var _PIL_PROT_DEF={contact:10, penetrant:12, systemique:14};
var _PIL_PROT_RX=[
  ['systemique', /phosphon|fos[eé]tyl|m[eé]talaxyl|m[eé]f[eé]noxam|benalaxyl|oxathiapiprolin|myclobutanil|t[eé]buconazole|difenoconazole|penconazole|tetraconazole|spiroxamine|fluopyram/i],
  ['penetrant',  /cymoxanil|dim[eé]thomorph|mandipropamid|iprovalicarb|benthiavalicarb|valifenalate|famoxadone|fenamidone|ametoctradin|cyazofamid|azoxystrobin|pyraclostrobin|trifloxystrobin|kr[eé]soxim|quinoxyfen|proquinazid|m[eé]trafenone|boscalid|cyflufenamid|fluxapyroxad|zoxamide/i],
  ['contact',    /cuivre|copper|bouillie|oxychlorure|hydroxyde|soufre|sulfur|folpel|mancoz|m[eé]tirame|dithianon|fluazinam|amisulbrom|bacillus|cos-oga|cerevisane|huile/i]
];
var _PIL_PROT_LESS_DEF=20;   // PLUIE-1 (§220) : mm de pluie cumulee qui lessivent un CONTACT
// ★ PHENO-2B (§564) — la pousse raccourcit un CONTACT (maquette-niveau-au-dessus-v1, partie 3 : « stade entre 16 et 79 : un contact couvre
//   7 jours, pas 10 ») : les feuilles neuves ne sont pas couvertes. Coefficient réglé par l'administrateur (Réglages › Économie et conformité).
var _PIL_PROT_POUSSE_DEF=0.7;
// ★ PHENO-2B (§564) — le coucher du soleil, formule NOAA (« General Solar Position Calculations ») : minutes depuis minuit, à l'heure de
//   l'appareil. Le créneau du soir des parcelles en fleur en découle (l'arrêté abeilles : 2 h avant, 3 h après le coucher).
function _pilCoucher(dateIso,lat,lng,lever){   // FENETRE-2 (§567) : lever=true donne le lever du soleil (le même calcul, l'angle horaire retranché)
  // L'algorithme du « Solar Calculator » de la NOAA (siècle julien, équation du temps, réfraction : 90,833°), itéré sur l'heure du
  //   coucher — la formule courte, évaluée à midi, tombait deux minutes trop tôt en mai (vérifié : 21 h 22 à Gevrey le 26 mai 2026).
  var p=String(dateIso||'').split('-').map(Number); lat=Number(lat); lng=Number(lng); if(p.length<3||!isFinite(lat)||!isFinite(lng)) return null;
  var y=p[0], m=p[1], d=p[2]; if(m<=2){ y-=1; m+=12; }
  var A=Math.floor(y/100), J=Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+2-A+Math.floor(A/4)-1524.5, R=Math.PI/180, t=720;
  for(var it=0;it<3;it++){
    var T=(J+t/1440-2451545)/36525, L0=(280.46646+T*(36000.76983+T*0.0003032))%360, M=357.52911+T*(35999.05029-0.0001537*T), e=0.016708634-T*(0.000042037+0.0000001267*T);
    var C=Math.sin(M*R)*(1.914602-T*(0.004817+0.000014*T))+Math.sin(2*M*R)*(0.019993-0.000101*T)+Math.sin(3*M*R)*0.000289;
    var om=125.04-1934.136*T, lam=L0+C-0.00569-0.00478*Math.sin(om*R);
    var eps=23+(26+(21.448-T*(46.815+T*(0.00059-T*0.001813)))/60)/60+0.00256*Math.cos(om*R);
    var dec=Math.asin(Math.sin(eps*R)*Math.sin(lam*R)), yv=Math.pow(Math.tan(eps/2*R),2);
    var eq=4/R*(yv*Math.sin(2*L0*R)-2*e*Math.sin(M*R)+4*e*yv*Math.sin(M*R)*Math.cos(2*L0*R)-0.5*yv*yv*Math.sin(4*L0*R)-1.25*e*e*Math.sin(2*M*R));
    var x=Math.cos(90.833*R)/(Math.cos(lat*R)*Math.cos(dec))-Math.tan(lat*R)*Math.tan(dec); if(x<-1||x>1) return null;
    t=720-4*lng-eq+(lever?-4:4)*Math.acos(x)/R;
  }
  var dt=new Date(Date.UTC(p[0],p[1]-1,p[2])+Math.round(t)*60000);
  return dt.getHours()*60+dt.getMinutes();   // à l'heure de l'appareil (l'heure d'été suit)
}
function _pilHm(min){ min=((Math.round(min)%1440)+1440)%1440; return Math.floor(min/60)+'\u00a0h\u00a0'+('0'+(min%60)).slice(-2); }
function _pilSoirFleurs(aujIso){
  var f=(window.PARCELLES||[]).filter(function(p){ if(!p||p.statut==='Arrachee'||typeof window._phenoStadeAu!=='function') return false; var b=window._phenoStadeAu(p,aujIso); return b!=null&&b>=61&&b<=69; });
  if(!f.length) return null;
  var g=(typeof getDomaineGeo==='function')?getDomaineGeo():null, c=g?_pilCoucher(aujIso,g.lat,g.lng):null;
  return { n:f.length, noms:f.map(function(p){ return p.nom; }), coucher:c==null?null:_pilHm(c), debut:c==null?null:_pilHm(c-120), fin:c==null?null:_pilHm(c+180) };
}
function _pilProtCfg(){
  var c=(window.CONFIG&&window.CONFIG.conformite)||{}, o={}, k;
  for(k in _PIL_PROT_DEF){ if(!Object.prototype.hasOwnProperty.call(_PIL_PROT_DEF,k)) continue;
    var v=Number(c['prot_'+k+'_j']); o[k]=(isFinite(v)&&v>0)?v:_PIL_PROT_DEF[k]; }
  var L=Number(c.prot_lessivage_mm); o.lessivage=(isFinite(L)&&L>0)?L:_PIL_PROT_LESS_DEF;
  var Pc=Number(c.prot_pousse_coef); o.pousse=(isFinite(Pc)&&Pc>=0.3&&Pc<=1)?Pc:_PIL_PROT_POUSSE_DEF;   // PHENO-2B (§564)
  return o;
}
// PLUIE-1 (§220) : la pluie tombee APRES le jour du traitement, jusqu'a aujourd'hui (heures passees).
// null = inconnue (pas de releve, ou un jour manque) — jamais zero.
function _pilProtPluie(dateIso, pl, aujIso){
  if(!pl||!pl.jours||!dateIso) return null;
  var d=new Date(dateIso+'T12:00:00'); if(!isFinite(d.getTime())) return null;
  var mm=0, g=0;
  for(;;){ d.setDate(d.getDate()+1); var iso=_pilPhotoIso(d); if(iso>aujIso||g++>40) break;
    var v=pl.jours[iso]; if(v==null||!isFinite(Number(v))) return null; mm+=Number(v); }
  return Math.round(mm*10)/10;
}
// Mode d'action d'un produit du registre : {mode, deduit}. `deduit` = aucun mot connu.
function _pilProtType(prod){
  var s=String((prod&&(prod.sub||''))||'')+' '+String((prod&&prod.nom)||'');
  for(var i=0;i<_PIL_PROT_RX.length;i++){ if(_PIL_PROT_RX[i][1].test(s)) return {mode:_PIL_PROT_RX[i][0], deduit:false}; }
  return {mode:'contact', deduit:true};
}
// Par parcelle active : le dernier traitement et ce qu'il lui reste de protection.
// ★ OBS-1B (§566) — les parcelles sans protection en cours (jamais traitées, lessivées, rémanence épuisée), lues par « À savoir » :
//   une maladie signalée sur l'une d'elles passe en tête.
window._pilANu=function(){ try{ var P=_pilProtData(); return (P&&P.rows||[]).filter(function(r){ return r.jamais||r.lessive||(r.reste!=null&&r.reste<=0); }).map(function(r){ return r.nom; }); }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilANu'); return null; } };
function _pilProtData(){
  var cfg=_pilProtCfg(), der={};
  (window.TRAITEMENTS||[]).forEach(function(t){
    var dd=String((t&&t.date)||'').slice(0,10); if(!dd||!Array.isArray(t.parcelles)) return;
    var rem=0, mode='contact', ded=true;
    (Array.isArray(t.produits)?t.produits:[]).forEach(function(p){ var ty=_pilProtType(p); if(cfg[ty.mode]>rem){ rem=cfg[ty.mode]; mode=ty.mode; ded=ty.deduit; } });
    if(!(rem>0)){ rem=cfg.contact; mode='contact'; ded=true; }
    t.parcelles.forEach(function(nom){ if(nom&&(!der[nom]||dd>der[nom].date)) der[nom]={date:dd, rem:rem, mode:mode, deduit:ded}; });
  });
  var n=new Date(), auj=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(), aujIso=_pilPhotoIso(n), rows=[];
  var pl=window.METEO_PLUIE||null, pluieOk=!!(pl&&pl.jours);
  (window.PARCELLES||[]).forEach(function(p){
    if(!p||p.statut==='Arrachee') return;
    var b=(typeof window._phenoStadeAu==='function')?window._phenoStadeAu(p,aujIso):null, fleur=(b!=null&&b>=61&&b<=69);   // PHENO-2B (§564)
    var e=der[p.nom]; if(!e){ rows.push({nom:p.nom, s:parseFloat(p.surface)||0, jamais:true, fleur:fleur}); return; }
    var pousse=(e.mode==='contact'&&b!=null&&b>=16&&b<=79), rem=pousse?Math.round(e.rem*cfg.pousse):e.rem;
    var t0=new Date(e.date+'T00:00:00').getTime(), j=isFinite(t0)?Math.max(0,Math.round((auj-t0)/86400000)):null;
    var reste=(j==null?null:rem-j), pluie=null, lessive=false;
    // PLUIE-1 : un CONTACT lessive par la pluie cumulee depuis le traitement est a nu, quels que soient les jours.
    if(e.mode==='contact'&&reste!=null&&reste>0){ pluie=_pilProtPluie(e.date,pl,aujIso); if(pluie!=null&&pluie>=cfg.lessivage){ lessive=true; reste=0; } }
    else if(e.mode==='contact'){ pluie=_pilProtPluie(e.date,pl,aujIso); }
    rows.push({nom:p.nom, s:parseFloat(p.surface)||0, date:e.date, j:j, rem:rem, mode:e.mode, deduit:e.deduit, reste:reste, pluie:pluie, lessive:lessive, pousse:pousse, fleur:fleur});
  });
  rows.sort(function(a,b){ var ra=(a.jamais?-1e9:a.reste), rb=(b.jamais?-1e9:b.reste); return ra-rb; });
  var nu=rows.filter(function(r){ return r.jamais||r.reste<=0; }), bientot=rows.filter(function(r){ return !r.jamais&&r.reste>0&&r.reste<=2; });
  return {rows:rows, cfg:cfg, nu:nu, bientot:bientot, nDed:rows.filter(function(r){ return !r.jamais&&r.deduit; }).length,
          haNu:nu.reduce(function(a,r){ return a+r.s; },0), n:rows.length,
          nLess:rows.filter(function(r){ return r.lessive; }).length, nPousse:rows.filter(function(r){ return r.pousse; }).length, pluieOk:pluieOk, pluieAuj:(pl&&pl.auj&&pl.auj.mm!=null)?pl.auj.mm:null};
}
function _pilProtLib(m){ return m==='systemique'?'systémique':(m==='penetrant'?'pénétrant':'contact'); }
// Le bloc, posé dans la carte « Traiter ? ».
var _PIL_PLUIE_ATTENTE=false;
// PLUIE-1 : la pluie se charge a part (app.js), une fois par heure ; la carte se repeint quand elle arrive.
function _pilPluieDemander(){
  var pl=window.METEO_PLUIE, frais=!!(pl&&pl.ts&&(Date.now()-pl.ts)<3600000);
  if(frais||_PIL_PLUIE_ATTENTE||typeof window._pluieCharger!=='function') return;
  _PIL_PLUIE_ATTENTE=true;
  window._pluieCharger().then(function(ok){ _PIL_PLUIE_ATTENTE=false; if(ok&&_PIL_TAB==='auj'&&typeof renderPilotage==='function') renderPilotage(); })
    .catch(function(e){ _PIL_PLUIE_ATTENTE=false; if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilPluieDemander'); });
}
// ALIGN-1 (§236) — LA PROTECTION A SA PROPRE CARTE, sous la décision du jour (rangée .pil-dec2). Elle
// vivait dans « Traiter ? » et étirait la rangée des quatre tuiles. Les 5 parcelles les plus urgentes ;
// le bouton montre les autres (_PIL_PROT_TOUT, cible interne `prot_tout` de _pilGo).
var _PIL_PROT_TOUT=false;
function _pilProtCarte(){
  var h=_pilProtHtml(); if(!h) return '';
  return '<div class="pil-tile2 pil-det"><div class="pil-t2h"><span class="ic">'+_pilIco('goutte')+'</span><span class="t">Protection restante</span>'+_mvInfoBtn('pil.prot')+'</div>'
    +'<div class="pil-t2b">'+h+'</div></div>';
}
function _pilProtHtml(){
  _pilPluieDemander();
  var P=_pilProtData(); if(!P.n) return '';
  var tot=P.rows.length, nNu=P.nu.length, nB=P.bientot.length;
  var big=nNu?(nNu+' parcelle'+(nNu>1?'s':'')+' à nu'):(nB?(nB+' parcelle'+(nB>1?'s':'')+' à nu d’ici 2 jours'):'tout le domaine est protégé');
  var col=nNu?'var(--rouge)':(nB?'var(--orange)':'var(--vert-med)');
  var h='<div class="pil-prot">'
    +'<div class="pil-prot-big" style="color:'+col+'">'+big+'</div>'
    +'<div class="pil-t2s">'+(nNu?(_pilHa(P.haNu)+' ha sans protection'+(nB?(' · '+nB+' de plus d’ici 2 jours'):'')):(nB?'sur '+tot+' parcelles':tot+' parcelles'))
    +' · rémanences '+P.cfg.contact+' / '+P.cfg.penetrant+' / '+P.cfg.systemique+' j'+(P.nDed?(' · mode déduit pour '+P.nDed):'')
    +(P.nPousse?(' · la pousse (stade 16 à 79) : un contact couvre '+Math.round(P.cfg.contact*P.cfg.pousse)+' j, pas '+P.cfg.contact):'')
    +(P.pluieOk?(' · lessivage à '+P.cfg.lessivage+' mm'+(P.nLess?(' : '+P.nLess+' lessivée'+(P.nLess>1?'s':'')):'')+(P.pluieAuj!=null?(' · aujourd’hui '+String(P.pluieAuj).replace('.',',')+' mm'):'')):' · pluie inconnue, les jours seuls')+'</div>';
  var lim=_PIL_PROT_TOUT?tot:5, urg=P.rows.slice(0,lim);
  h+='<div class="pil-prot-l">'+urg.map(function(r){
    var c=r.jamais||r.reste<=0?'b':(r.reste<=2?'o':'v');
    var txt=r.jamais?'jamais traitée':(r.lessive?('lessivée · '+String(r.pluie).replace('.',',')+' mm'):(r.reste<=0?('à nu depuis '+(-r.reste)+' j'):('encore '+r.reste+' j')));
    var sub=(r.jamais?'':(' · '+_pilDfr(r.date)+' · '+_pilProtLib(r.mode)+(r.deduit?' ?':'')+(r.pousse?' · lu par la pousse':'')+((!r.lessive&&r.pluie!=null)?(' · '+String(r.pluie).replace('.',',')+' mm de pluie'):'')))+(r.fleur?' · en fleur \u2192 le soir':'');
    return '<div class="pil-prot-r"><span class="pil-prot-pt '+c+'"></span><span class="n">'+_pilEsc(r.nom)+'</span><span class="v">'+txt+'<span>'+sub+'</span></span></div>';
  }).join('')+'</div>'+(tot>5?'<div class="pil-trx-go"><button class="pil-diag-go ghost" data-diag="prot_tout">'+(_PIL_PROT_TOUT?'Ne garder que les 5 plus urgentes':('Et '+(tot-5)+' autre'+(tot-5>1?'s':'')+', mieux protégée'+(tot-5>1?'s':'')))+' \u203A</button></div>':'')+'</div>';
  return h;
}
// ════════════════════════════════════════════════════════════════════════
// INACTION-1 (§218) — LE COÛT DE L'INACTION, SUR LE COCKPIT
// Ce que le simulateur de renfort (Décider) répond quand personne n'est ajouté :
// _rfSim sur un profil vide. `induit` = les heures que le retard AJOUTE (le modèle
// M3 : une tâche faite hors de sa fenêtre prend k_retard % de plus par semaine).
// Converti au taux de l'équipe (ctx.rate). C'est le modèle qui parle, pas une
// mesure : affiché à part, avec son hypothèse. Lecture seule — un seul calcul,
// celui de Décider, qu'on ne refait pas ici (même _rfPair, même _rfSim).
// ════════════════════════════════════════════════════════════════════════
// PROL-1 (§265) : ce qu'une prolongation d'UN MOIS ferait gagner, pour chaque contrat qui finit dans les 30 jours.
//   Même simulateur que le coût de l'inaction et Décider › Renfort (_rfPair → _rfSim) : prolonger, c'est une personne
//   de plus, À RENDEMENT PLEIN (elle connaît le travail : c.rdt = 1, sur une COPIE du contexte), des semaines qui
//   suivent la fin du contrat jusqu'à un mois après. Le gain se dit dans les mesures du coût de l'inaction : les heures
//   de rattrapage évitées et les tâches ramenées dans leur fenêtre. Sans taux, sans campagne en cours : rien.
function _pilGainsProlong(d){
  var out={};
  try{
    if(typeof _rfPair!=='function') return out;
    // (ordre des conditions distinct de _pilCkInaction : la contre-épreuve de protection vise CELLE-LÀ, sans ambiguïté)
    var P=_rfPair(d); if(!P||!P.dec||P.dec.noRate||P.fini) return out;
    var ctx=P.dec, base=_rfSim(ctx,_rfProf(ctx,null)); if(!base) return out;
    var ctx2=Object.assign({},ctx,{c:Object.assign({},ctx.c,{rdt:1})});
    var t=new Date(), auj=_pilIsoJ(t,0), lim=_pilIsoJ(t,30), t0=Date.UTC(2026,0,1);
    (window.MEMBRES||[]).forEach(function(m){
      if(!m||m.statut==='Inactif'||typeof m.fin_contrat!=='string'||m.fin_contrat<auj||m.fin_contrat>lim) return;
      var p=m.fin_contrat.split('-'), o=Math.round((Date.UTC(+p[0],+p[1]-1,+p[2])-t0)/86400000);
      var r=_rfSim(ctx2,_rfProf(ctx2,{R:1,a:_rfWOf(ctx.W,o+1),b:_rfWOf(ctx.W,o+30)})); if(!r) return;
      var h=Math.max(0,Math.round((base.induit||0)-(r.induit||0)));
      out[m.nom]={ h:h, taches:Math.max(0,(base.horsDelai||0)-(r.horsDelai||0)), eur:(h&&ctx.rate)?_ecoEur(h*ctx.rate):'' };
    });
  }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilGainsProlong'); }
  return out;
}
function _pilIsoJ(t,k){ var x=new Date(t.getFullYear(),t.getMonth(),t.getDate()+k); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0'); }
function _pilTraiterCalc(){
  // ALIGN-1 (§236) : quatre étages (verdict, raison, bande, pied) comme les trois autres tuiles. La
  //   bande montre la fenêtre sur les 24 heures ; le pied porte le dépliant des jours suivants. La
  //   protection restante a QUITTÉ cette tuile pour sa propre carte (_pilProtCarte, rangée .pil-dec2) :
  //   ses six lignes étiraient toute la rangée des quatre tuiles (Nico, capture du 04/10).
  var days=_pilTreatDays(), big, bigCol, rai='', ban='', pied='', fen=null, risque=false, prochaine='';
  if(days===undefined){ big='\u2014'; bigCol='var(--texte-doux)'; rai='pr\u00e9visions horaires indisponibles'; }
  else {
    var tj=(days||[]).filter(function(x){ return /aujourd/i.test(x.label); })[0] || (days&&days[0]);
    if(tj&&tj.start!=null){
      big='Oui \u2014 '+tj.start+'h \u2192 '+tj.end+'h'; bigCol='var(--vert-med)';
      var risk=tj.leach||(tj.ppMax!=null&&tj.ppMax>=PIL_TREAT_PP_ALERT);
      rai='sec \u00b7 '+tj.wMax+' km/h \u00b7 '+tj.tMax+'\u00b0 \u00b7 meilleure fen\u00eatre du jour';
      var g0=Math.max(0,Math.min(24,+tj.start||0)), g1=Math.max(g0,Math.min(24,+tj.end||0));
      fen={g0:g0, g1:g1}; risque=!!risk;   // PRO-1 (§269) : le cockpit dessine sa propre frise des 24 h
      ban='<div class="pil-tz-strip"><i style="left:'+(g0/24*100).toFixed(1)+'%;width:'+((g1-g0)/24*100).toFixed(1)+'%"></i></div>'
        +'<div class="pil-tz-ax pil-t2s"><span>0 h</span><span>12 h</span><span>24 h</span></div>'
        +(risk?'<div class="pil-t2s" style="color:var(--orange)">\u26A0 pluie ensuite \u2014 risque de lessivage</div>':'');
    } else {
      big='Pas aujourd\u2019hui'; bigCol='var(--orange)';
      rai=(tj?('aucune fen\u00eatre \u00b7 '+tj.reason):'aucune fen\u00eatre claire');
      var nxt=(days||[]).filter(function(x){ return x.start!=null; })[0];
      if(nxt) prochaine=nxt.label+' '+nxt.start+' h \u2192 '+nxt.end+' h';
      if(nxt) ban='<div class="pil-t2s" style="color:var(--vert-med)">prochaine : '+nxt.label+' '+nxt.start+'h\u2192'+nxt.end+'h</div>';
    }
    // \u2605 LES CINQ JOURS ARRIVENT ICI, DERRIERE UN DEPLIANT : fermé, il ne coûte qu'une ligne dans le
    //   pied ; ouvert, la tuile grandit et ses voisines la suivent, leurs pieds restent alignés en bas.
    //   \u26a0\ufe0f Ce n'est PAS \u00ab cacher un chiffre \u00bb : le verdict du jour reste en gros au-dessus.
    if(days && days.length){
      pied='<details class="pil-t5"><summary>les '+days.length+' prochains jours</summary>'
        +'<div class="pil-t5b">'+_pilFrise5(days)+_pilTreatRows(days)+'</div></details>';   // FENETRE-2 : la frise d'abord
    }
  }
  // La pastille suit la carte : la fiche `pil.traitement` etait posee sur celle
  // qui disparait. Une fiche ecrite et posee nulle part est un rouge de harnais.
  var _i=(typeof _mvInfoBtn==='function')?_mvInfoBtn('pil.traitement'):'';
  // ⚠️ `data-mvt="traiter"` EST UN POINT D'ACCROCHE DE LA VISITE GUIDEE, au
  //   meme titre que `.pil-dec` et `.pil-cockpit-card` (§20b). Ne pas renommer.
  // ★ PHENO-2B (§564) : les parcelles en fleur n'ont que le créneau du soir (l'arrêté abeilles : 2 h avant, 3 h après le coucher du soleil).
  var soir=_pilSoirFleurs(_pilPhotoIso(new Date()));
  if(soir&&soir.debut) ban+='<div class="pil-t2s">'+soir.n+' en fleur\u00a0: le soir seulement, '+soir.debut+' \u2013 '+soir.fin+'</div>';
  // ★ FENETRE-2 (§567) — la lecture croisée : le prochain créneau face aux parcelles à nu, et la pluie qui le suivra face au lessivage.
  var nu=(typeof window._pilANu==='function')?(window._pilANu()||[]):[], cr=(days||[]).filter(function(x){ return x&&x.start!=null; })[0]||null;
  if(cr&&nu.length) ban+='<div class="pil-t2s"><b>'+_pilEsc(cr.label+' '+cr.start+' h \u2013 '+cr.end+' h')+'</b>, '+nu.length+' parcelle'+(nu.length>1?'s':'')+' \u00e0 nu'+(soir&&soir.n?' \u00b7 le soir pour les '+soir.n+' en fleur':'')+'</div>';
  if(cr&&cr.apresMm!=null){ var lss=_pilProtCfg().lessivage; ban+='<div class="pil-t2s"'+(cr.apresMm>=lss?' style="color:var(--orange)"':'')+'>apr\u00e8s le cr\u00e9neau\u00a0: '+(cr.apresMm>=0.1?_pilMm(cr.apresMm)+(cr.apresJour?' '+_pilEsc(cr.apresJour):''):'pas de pluie')+(cr.apresMm>=lss?', au-dessus des '+lss+' mm\u00a0: le contact sera lessiv\u00e9':(cr.apresMm>=0.1?', sous les '+lss+' mm':''))+'</div>'; }
  return { big:big, bigCol:bigCol, rai:rai, ban:ban, pied:pied, _i:_i, fen:fen, risque:risque, prochaine:prochaine, soir:soir };
}
// ════════════════════════════════════════════════════════════════════════════
// PRIO-1 (§235) — LA TÂCHE PRIORITAIRE SUIT LA RÈGLE COMMUNE (window._mvTacheDuMoment, app.js)
// Avant : la tâche pas finie qui avait le plus d'heures restantes (« pôle long ») — la taille tout
// l'hiver, quoi que l'admin ait fixé (Nico, 04/10). Maintenant : la priorité fixée par l'admin ; sinon
// la seule tâche dans ses dates de travaux ; plusieurs en même temps → la carte NE CHOISIT PAS et
// propose de fixer la priorité ; aucune → la prochaine, avec sa date. Les heures ne décident jamais.
// ⚠️ `id="pil-prio"` est la cible de la pastille « Nouveau » (WHATS_NEW 8.13) : ne pas renommer.
// ════════════════════════════════════════════════════════════════════════════
// PRO-1 (§269) : la tâche du moment, lue UNE fois pour la tuile et pour le cockpit — avec la période, les tâches de
//   l'écran et leur « finie ». Le cockpit appelait _mvTacheDuMoment() sans rien et lisait .nom/.tache/.t sur un moteur
//   qui rend {mode, taches:[noms]} : la case « Tâche prioritaire » affichait toujours « — ».
function _pilPrioDuJour(d){
  var data=(d&&d.data)||[], byNom={};
  data.forEach(function(t){ if(t&&t.nom) byNom[t.nom]=t; });
  var M=(typeof window._mvTacheDuMoment==='function')
    ? window._mvTacheDuMoment({ saison:(typeof window._pilSaison==='function')?window._pilSaison():null,
        noms:data.map(function(t){ return t&&t.nom; }),
        fini:function(n){ return !byNom[n]||(byNom[n].pct||0)>=100; } })
    : null;
  return { M:M, byNom:byNom, data:data };
}
// ════════════════════════════════════════════════════════════════════════
// TENS-1 (§215) — LA TENSION DE L'ÉQUIPE
// Pour chaque personne de l'équipe (ni bureau, ni équipe collective) : le TRAVAIL
// EFFECTIF des 14 derniers jours (_planWorkPersRange — saisie comprise, la base des
// durées maximales) face au PRÉVU du modèle sur la même fenêtre (_planPrevuPersRange —
// la grille d'annualisation, sans la saisie). ★ Jamais face au contrat : en modulation,
// une semaine haute est PRÉVUE, ce n'est pas de la fatigue.
// Et la semaine la plus chargée des deux dernières (lundi-dimanche, la semaine en cours
// jusqu'à aujourd'hui) face au cadre légal du Planning (_planLegal) : au-delà de la
// moyenne autorisée (44 h par défaut) = à surveiller, la même règle que la fiche du
// salarié ; au-delà du maximum absolu (48 h) = rouge.
// Seuil d'une personne : plus de 10 % au-dessus du prévu, ou une semaine au-delà de la
// moyenne. Le planning ne dit pas l'activité : la cave et l'atelier y comptent aussi.
// ════════════════════════════════════════════════════════════════════════
var _PIL_TENS_SEUIL = 10;   // % au-dessus du prévu, sur 14 jours
function _pilTensJour(t,k){ return new Date(t.getFullYear(),t.getMonth(),t.getDate()-k); }
function _pilTensData(d){
  if(d&&d._tens!==undefined) return d._tens;
  var out=null;
  if(typeof window._planWorkPersRange==='function'&&typeof window._planPrevuPersRange==='function'&&typeof window._planLegal==='function'){
    var L=window._planLegal(), t=new Date(), auj=_pilTensJour(t,0), deb=_pilTensJour(t,13);
    var lun=_pilTensJour(t,(t.getDay()+6)%7), lunP=_pilTensJour(lun,7), dimP=_pilTensJour(lun,1);
    var mb=((d&&d.membres)||[]).filter(function(m){ return m&&!m.bureau&&!(typeof window._mvEstCollectif==='function'&&window._mvEstCollectif(m)); });
    var rows=[], F=0, P=0;
    mb.forEach(function(m){
      var f=window._planWorkPersRange(m,deb,auj), p=window._planPrevuPersRange(m,deb,auj);
      var s1=window._planWorkPersRange(m,lunP,dimP), s2=window._planWorkPersRange(m,lun,auj), sm=Math.max(s1,s2);
      if(!(f>0)&&!(p>0)) return;   // personne n'était là ni prévu : pas une ligne
      var ec=(p>0)?(f-p)/p*100:null;
      var niv=(sm>L.maxHebdo+1e-4)?'rouge':((sm>L.maxMoy+1e-4||(ec!=null&&ec>_PIL_TENS_SEUIL))?'orange':'ok');
      rows.push({nom:m.nom, f:f, p:p, ec:ec, s1:s1, s2:s2, sm:sm, niv:niv});
      F+=f; P+=p;
    });
    rows.sort(function(a,b){ var r={rouge:0,orange:1,ok:2}; return (r[a.niv]-r[b.niv])||((b.ec||0)-(a.ec||0)); });
    // La petite courbe : l'écart de l'équipe sur 7 jours glissants, chaque jour des 14 derniers.
    var serie=[];
    for(var k=13;k>=0;k--){
      var fin=_pilTensJour(t,k), d7=_pilTensJour(fin,6), f7=0, p7=0;
      mb.forEach(function(m){ f7+=window._planWorkPersRange(m,d7,fin); p7+=window._planPrevuPersRange(m,d7,fin); });
      serie.push(p7>0?(f7-p7)/p7*100:null);
    }
    out={ rows:rows, F:F, P:P, ec:(P>0?(F-P)/P*100:null), L:L, serie:serie,
          nSeuil:rows.filter(function(r){ return r.niv!=='ok'; }).length,
          nRouge:rows.filter(function(r){ return r.niv==='rouge'; }).length };
  }
  if(d) d._tens=out;
  return out;
}
function _pilTensFmtEc(ec){ return ec==null?'—':((ec>0?'+':'')+Math.round(ec)+' %'); }
// ── Le chiffre du bandeau ──
// ── La tension : ★ MOTS-9 (§592) — carte repliée de L'équipe & le matériel, _pilPanelTension (l'ancien « détail »,
//   _pilCardTension, ouvert en grand sous trois titres, est parti).

// ════════════════════════════════════════════════════════════════════════
// GNR-M (§213) — LE TRACTEUR SE PROJETTE SUR LES TRAVAUX EN COURS
// La regle est celle de Nico : un travail tracteur LANCE (session « En cours »)
// doit couvrir TOUT le domaine. Ce qui reste = les parcelles non arrachees, hors
// celles desactivees dans la session, moins celles deja cochees — EXACTEMENT la
// regle de la barre d'avancement de la session (renderSessionProgress). Une seule
// definition du « reste ».
// Exception, l'AMENDEMENT : les parcelles sont choisies dans l'apport (Phyto ›
// Fertilisation). Le reste = les parcelles de l'apport qui attendent encore dans
// _ferFaits — il compte des la creation de l'apport, session lancee ou non. Une
// session « Amendement » ouverte affiche tout le domaine : on ne la lit pas
// comme perimetre, seulement pour savoir quel tracteur la fait.
// Un travail fini SORT : session passee « Terminé » (seule ou a la main) ou plus
// rien a faire. On lit le STATUT, on ne recalcule pas le reste des vieilles
// sessions : une parcelle plantee depuis les ferait revenir (§168 ⑦).
// Les litres = heures restantes × la conso MESUREE du tracteur (pleins ÷ heures
// notees entre eux), repli sur le reglage du Tracteur quand la mesure manque.
// ⚠️ Il n'existe AUCUNE heure tracteur « au planning » : une entree de planning
// porte des heures par personne, jamais une machine. D'ou cette regle-ci.
// ════════════════════════════════════════════════════════════════════════
var _PIL_GM_FER = 'Amendement';   // = FER_ACT de phyto.js (epingle par mv-harnais-gnr-mesure)
var _PIL_GM_DORMANT_J = 21;       // jours sans coche avant de signaler une session oubliee
var _PIL_GM_MIN_IV = 2;           // intervalles plein → plein valides, au minimum
var _PIL_GM_MIN_H = 10;           // heures notees, au minimum, pour croire la mesure
function _pilGmNom(x){ return (typeof x==='string')?x:((x&&x.nom)||''); }
function _pilGmIso(dt){ return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0'); }
function _pilGmFr(n,dec){ return (Number(n)||0).toFixed(dec==null?1:dec).replace('.',','); }
// Meme appartenance a la campagne que _ecoGnrReel / _ecoTracHByParc.
function _pilGmInCamp(iso){
  if(!iso) return false;
  var s=(typeof window._pilSaison==='function')?window._pilSaison():null;
  var seasonNom=(s&&s.nom)?s.nom:'';
  var sn=(window._saisonForDate)?window._saisonForDate(iso):null; sn=sn||'';
  if(sn) return sn===seasonNom;
  return seasonNom===(((window.getSaisonActive&&window.getSaisonActive())||{}).nom||'');
}
function _pilGmTid(se, acts){
  if(se&&se.tracteurId) return se.tracteurId;
  var a=(acts||[]).find(function(x){ return x&&se&&x.nom===se.activite; });
  return (a&&a.tracteurDefautId)||'';
}
// Heures NOTEES d'une session, parcelle par parcelle — la regle de _ecoTracHByParc :
// duree chronometree (dmin) quand elle existe, sinon surface × bareme h/ha.
// Datees a l'heure de fin de la parcelle (t1) quand elle existe, sinon a la session.
function _pilGmHeuresSession(se, acts, parcs){
  var out=[]; if(!se) return out;
  var act=(acts||[]).find(function(a){ return a&&a.nom===se.activite; });
  var hha=act?(parseFloat(act.h_ha)||0):0;
  (Array.isArray(se.parcellesFaites)?se.parcellesFaites:[]).forEach(function(x){
    var nom=_pilGmNom(x); if(!nom) return;
    var dmin=(x&&typeof x==='object'&&typeof x.dmin==='number')?x.dmin:null, h, chrono=false;
    if(dmin!=null){ h=dmin/60; chrono=true; }
    else {
      if(hha<=0) return;
      var p=(parcs||[]).find(function(pp){ return pp&&pp.nom===nom; });
      h=(p?(parseFloat(p.surface)||0):0)*hha;
    }
    if(!(h>0)) return;
    var iso=(x&&typeof x==='object'&&typeof x.t1==='number')?_pilGmIso(new Date(x.t1)):String(se.date||'').slice(0,10);
    if(iso) out.push({iso:iso, h:h, chrono:chrono});
  });
  return out;
}
// Heures notees d'un tracteur, par jour, sur la campagne : {h:{iso:h}, c:{iso:h chrono}}.
function _pilGmHeuresTrac(tid){
  var acts=window.ACTIVITES||[], parcs=window.PARCELLES||[], h={}, c={};
  (window.SESSIONS||[]).forEach(function(se){
    if(!se||_pilGmTid(se,acts)!==tid) return;
    _pilGmHeuresSession(se,acts,parcs).forEach(function(r){
      if(!_pilGmInCamp(r.iso)) return;
      h[r.iso]=(h[r.iso]||0)+r.h; if(r.chrono) c[r.iso]=(c[r.iso]||0)+r.h;
    });
  });
  return {h:h, c:c};
}
// ★ CONSO MESUREE d'un tracteur : le plein n°2 rembourse ce qui a brule depuis le
// plein n°1. Ses litres se comptent face aux heures notees entre les deux : jours
// APRES le plein precedent, jusqu'au jour du plein INCLUS (un plein n'a qu'une date,
// pas d'heure : ce choix ne joue qu'aux deux bouts de la campagne). Le premier plein
// sert de depart, ses litres ne comptent pas. Deux pleins le meme jour = un seul.
// Moyenne PONDEREE (Σ litres ÷ Σ heures). Un intervalle sans aucune heure notee
// (session oubliee) est ECARTE, et compte comme tel.
function _pilGmConso(tid){
  var out={tid:tid, iv:[], L:0, H:0, Hc:0, nOk:0, nEc:0, nSans:0, lh:null, ok:false};
  if(!tid) return out;
  var byDay={};
  (window.ENTRETIENS||[]).forEach(function(f){
    if(!f||!f.plein||f.tracteurId!==tid) return;
    var iso=String(f.date||'').slice(0,10);
    if(!_pilGmInCamp(iso)) return;
    var L=Number(f.litres_plein)||0;
    if(!(L>0)){ out.nSans++; return; }
    byDay[iso]=(byDay[iso]||0)+L;
  });
  var days=Object.keys(byDay).sort();
  if(days.length<2) return out;
  var HT=_pilGmHeuresTrac(tid), hd=Object.keys(HT.h);
  for(var i=1;i<days.length;i++){
    var a=days[i-1], b=days[i], h=0, hc=0;
    hd.forEach(function(dd){ if(dd>a&&dd<=b){ h+=HT.h[dd]; hc+=(HT.c[dd]||0); } });
    var l=byDay[b];
    if(!(h>0)){ out.iv.push({d:b, l:l, h:0, ecarte:true}); out.nEc++; continue; }
    out.iv.push({d:b, l:l, h:h, hc:hc, lh:l/h});
    out.L+=l; out.H+=h; out.Hc+=hc; out.nOk++;
  }
  out.ok = out.nOk>=_PIL_GM_MIN_IV && out.H>=_PIL_GM_MIN_H;
  out.lh = out.ok ? out.L/out.H : null;
  return out;
}
// Rythme d'un tracteur : heures notees sur les 28 derniers jours ÷ jours ouvres
// (lundi-vendredi) de la meme fenetre. Un REPERE de date, jamais une projection.
function _pilGmRythme(tid, refIso){
  var HT=_pilGmHeuresTrac(tid), ref=refIso?new Date(refIso+'T12:00:00'):new Date();
  var h=0, jo=0;
  for(var k=0;k<28;k++){
    var dt=new Date(ref.getTime()-k*86400000), iso=_pilGmIso(dt), wd=dt.getDay();
    if(wd>=1&&wd<=5) jo++;
    h+=(HT.h[iso]||0);
  }
  return (jo>0&&h>0)?h/jo:null;
}
// ★ LES TRAVAUX EN COURS. Rend {jobs, conso, domaine, cfgLh}.
function _pilGmTravaux(){
  var acts=window.ACTIVITES||[], parcs=window.PARCELLES||[];
  var sessF=window._sessInSaison||function(){ return true; };
  var sess=(window.SESSIONS||[]).filter(function(se){ return se&&sessF(se); });
  var actives=parcs.filter(function(p){ return p&&p.statut!=='Arrachee'; });
  var surfBy={}; actives.forEach(function(p){ surfBy[p.nom]=parseFloat(p.surface)||0; });
  function somme(noms){ return noms.reduce(function(a,n){ return a+(surfBy[n]||0); },0); }
  var now=Date.now(), jobs=[];
  sess.forEach(function(se){
    if(se.statut!=='En cours'||se.activite===_PIL_GM_FER) return;
    var act=acts.find(function(a){ return a&&a.nom===se.activite; });
    var hha=act?(parseFloat(act.h_ha)||0):0;
    var skip=Array.isArray(se.parcellesSkip)?se.parcellesSkip:[];
    var faits=(Array.isArray(se.parcellesFaites)?se.parcellesFaites:[]).map(_pilGmNom);
    var per=actives.filter(function(p){ return skip.indexOf(p.nom)<0; }).map(function(p){ return p.nom; });
    var reste=per.filter(function(n){ return faits.indexOf(n)<0; });
    if(!reste.length) return;   // fini : il sort, meme si le statut n'a pas encore suivi
    var last=null;
    (Array.isArray(se.parcellesFaites)?se.parcellesFaites:[]).forEach(function(x){ if(x&&typeof x==='object'&&typeof x.t1==='number'&&(last==null||x.t1>last)) last=x.t1; });
    if(last==null){ var t0=Date.parse(String(se.date||'').slice(0,10)+'T12:00:00'); if(isFinite(t0)) last=t0; }
    var perHa=somme(per), resteHa=somme(reste);
    jobs.push({ kind:'session', id:se.id, nom:se.activite||'Session', tid:_pilGmTid(se,acts),
      debut:String(se.date||'').slice(0,10), perHa:perHa, faitHa:Math.max(0,perHa-resteHa), resteHa:resteHa,
      nReste:reste.length, nSkip:skip.length, hha:hha, h:(hha>0?resteHa*hha:null),
      dormJ:(last!=null?Math.floor((now-last)/86400000):null) });
  });
  if(typeof window._ferFaits==='function'&&window.INTRANTS&&Array.isArray(window.INTRANTS.fertil)){
    var faitsF=window._ferFaits()||{};
    var actF=acts.find(function(a){ return a&&a.nom===_PIL_GM_FER; });
    var hhaF=actF?(parseFloat(actF.h_ha)||0):0;
    var ouv=sess.filter(function(se){ return se.activite===_PIL_GM_FER&&se.statut==='En cours'; })
      .sort(function(a,b){ return String(b.date||'').localeCompare(String(a.date||'')); })[0]||null;
    var tidF=ouv?_pilGmTid(ouv,acts):((actF&&actF.tracteurDefautId)||'');
    window.INTRANTS.fertil.forEach(function(op){
      if(!op||!Array.isArray(op.parcs)||!op.parcs.length) return;
      var c0=String(op.cree||'').slice(0,10);
      if(!_pilGmInCamp(c0)) return;   // un apport d'une autre campagne ne se projette pas
      var r=faitsF[op.id]||{};
      var noms=op.parcs.filter(function(n){ return surfBy[n]!=null; });
      var att=noms.filter(function(n){ return !r[n]; });
      if(!att.length) return;
      var perHa=somme(noms), resteHa=somme(att);
      jobs.push({ kind:'amendement', id:op.id, nom:_PIL_GM_FER, sel:true, lance:!!ouv, tid:tidF,
        debut:c0, perHa:perHa, faitHa:Math.max(0,perHa-resteHa), resteHa:resteHa, nReste:att.length,
        nSel:noms.length, hha:hhaF, h:(hhaF>0?resteHa*hhaF:null), dormJ:null });
    });
  }
  jobs.sort(function(a,b){ return String(a.debut).localeCompare(String(b.debut)); });
  var cfgLh=_ecoCfg().conso, conso={};
  jobs.forEach(function(j){
    if(!j.tid){ j.l=null; j.src=null; return; }
    var c=conso[j.tid]||(conso[j.tid]=_pilGmConso(j.tid));
    var lh=c.ok?c.lh:cfgLh;
    j.src=c.ok?'mesure':'reglage';
    j.l=(j.h!=null&&lh>0)?j.h*lh:null;
  });
  return { jobs:jobs, conso:conso, domaine:somme(actives.map(function(p){ return p.nom; })), cfgLh:cfgLh };
}
// ★ LA REVISION LA PLUS PROCHE, PLACEE DANS LES TRAVAUX EN COURS. Les travaux d'un
// tracteur se mettent bout a bout dans l'ordre ou ils ont ete lances.
function _pilGmRevision(d, T){
  // ★ COMPT-7 (§489) : l'entretien le plus pressant, plus seulement la révision aux heures. Pour chaque tracteur : la révision
  //   (ses heures, et la date de son intervalle, §484) et les autres entretiens (§487, avec leurs propres seuils). Rang 0 :
  //   dépassé, aux heures ou à la date ; rang 1 : atteint pendant les travaux en cours, ou dû dans les 14 jours ; rang 2 :
  //   proche (révision à 120 h ou 30 jours, entretien orange) — sinon rien, comme avant. Les autres en vue : « aussi ».
  var c=[];
  (d.tracs||[]).forEach(function(t){
    var seq=T.jobs.filter(function(j){ return j.tid===t.id&&j.h!=null; });
    var tot=0; seq.forEach(function(j){ tot+=j.h; });
    var items=[];
    if(t.revReste!=null||t.revDate) items.push({ nom:'R\u00e9vision', rev:true, reste:t.revReste, pd:t.revDate||null, jours:t.revDate?t.revJours:null,
      proche:(t.revReste!=null&&t.revReste<=120)||(!!t.revDate&&t.revJours!=null&&t.revJours<=30) });
    (t.ents||[]).forEach(function(e){ items.push({ nom:e.nom, rev:false, reste:e.reste, pd:e.pd||null, jours:e.pd?e.jours:null, proche:!!(e.rouge||e.orange||e.depasse) }); });
    items.forEach(function(it){
      var acc=0, dans=null;
      if(it.reste!=null&&it.reste>0) seq.forEach(function(j){ if(dans==null&&acc+j.h>=it.reste) dans={job:j, pc:(it.reste-acc)/j.h}; acc+=j.h; });
      it.dans=dans;
      it.rang=((it.reste!=null&&it.reste<=0)||(it.jours!=null&&it.jours<0))?0:((dans||(it.jours!=null&&it.jours<=14))?1:2);
    });
    var vus=items.filter(function(it){ return it.rang<2||it.proche; }).sort(_pilGmRevOrdre);
    if(!vus.length) return;
    c.push({ t:t, seq:seq, tot:tot, dans:vus[0].dans, it:vus[0], aussi:vus.slice(1),
      sansBareme:T.jobs.filter(function(j){ return j.tid===t.id&&j.h==null; }).length });
  });
  c.sort(function(a,b){ return _pilGmRevOrdre(a.it,b.it); });
  return c[0]||null;
}
function _pilGmRevOrdre(a,b){
  if(a.rang!==b.rang) return a.rang-b.rang;
  if(a.reste!=null&&b.reste!=null) return a.reste-b.reste;
  if(a.jours!=null&&b.jours!=null) return a.jours-b.jours;
  return (a.reste!=null?0:1)-(b.reste!=null?0:1);
}
function _pilGmDateAn(iso){ return (typeof window!=='undefined'&&typeof window._trDateAn==='function')?window._trDateAn(iso):String(iso||''); }
function _pilGmRevTxt(it){
  var p=[];
  if(it.reste!=null) p.push(it.reste<=0?('d\u00e9pass\u00e9'+(it.rev?'e':'')+' de '+_pilNum(-it.reste)+' h'):('dans '+_pilNum(it.reste)+' h'));
  if(it.pd) p.push(it.jours<0?'date d\u00e9pass\u00e9e':('le '+_pilGmDateAn(it.pd)));
  return (it.rev?'r\u00e9vision':_pilEsc(it.nom))+' '+p.join(' ou ');
}
function _pilGmLibJob(j){ return _pilEsc(_pilTnom(j.nom)); }
// ★ TRAIT-CUVE (§221) — LE TRAITEMENT CONSEILLÉ, EN POINTILLÉ DANS LA CUVE.
// Trois cartes se croisent : la protection restante dit qu'il y a des parcelles à nu
// (ou qui le seront d'ici 2 jours), la fenêtre de traitement dit qu'un créneau existe
// dans les 5 jours, et le tracteur dit ce que coûterait ce traitement en carburant :
// tout le domaine (un travail lancé couvre le domaine, §213) × le barème h/ha de
// l'activité de pulvérisation × la conso de son tracteur. Rien n'est lancé, rien n'est
// compté : c'est une ligne « et si », en pointillé. Déjà une session de ce travail en
// cours → rien (elle est dans les travaux). Pas d'activité de pulvérisation → rien.
function _pilGmActPulve(){
  var acts=window.ACTIVITES||[], tr={}; (window.TRACTEURS_LIST||[]).forEach(function(t){ if(t&&t.id) tr[t.id]=t; });
  var a=acts.find(function(x){ return x&&/trait|pulv/i.test(String(x.nom||'')); })
       ||acts.find(function(x){ return x&&x.tracteurDefautId&&tr[x.tracteurDefautId]&&tr[x.tracteurDefautId].traitementOnly; });
  return a||null;
}
// ★ Le temps d'un traitement depend de la facon dont le pulve avance (4, 6 ou 8 rangs
//   par passage, demi-tours) : un bareme h/ha ne le sait pas. On prend donc d'abord la
//   CADENCE MESUREE de l'activite sur la campagne — minutes chronometrees ÷ hectares
//   chronometres de ses sessions —, qui porte la vraie facon de faire du domaine ; le
//   bareme sert de repli (moins de 0,5 ha chronometre). Nico, 03/10 : « ca depend si
//   les traitements se font sur 4 rangs, 6 rangs, 8 rangs ».
function _pilGmHhaMesure(nomAct){
  var sessF=window._sessInSaison||function(){ return true; }, parcs=window.PARCELLES||[], surf={}, h=0, ha=0, n=0;
  parcs.forEach(function(p){ if(p&&p.nom) surf[p.nom]=parseFloat(p.surface)||0; });
  (window.SESSIONS||[]).forEach(function(se){
    if(!se||se.activite!==nomAct||!sessF(se)) return;
    var vu=false;
    (Array.isArray(se.parcellesFaites)?se.parcellesFaites:[]).forEach(function(x){
      if(!x||typeof x!=='object'||typeof x.dmin!=='number'||!(x.dmin>0)) return;
      var s=surf[x.nom]||0; if(!(s>0)) return;
      h+=x.dmin/60; ha+=s; vu=true;
    });
    if(vu) n++;
  });
  return (ha>=0.5&&h>0)?{hha:h/ha, n:n, ha:ha, mesure:true}:null;
}
// Interrupteur : CONFIG.features.trait_cuve. Eteint par defaut (03/10) — Nico veut laisser
// l'equipe s'approprier le nouveau Pilotage avant d'annoncer cette ligne, a l'ete.
function _pilGmTraitementOption(T){
  var F=(window.CONFIG&&window.CONFIG.features)||{}; if(F.trait_cuve!==true) return null;
  var act=_pilGmActPulve(); if(!act) return null;
  var M=_pilGmHhaMesure(act.nom), hha=M?M.hha:(parseFloat(act.h_ha)||0); if(!(hha>0)) return null;
  if(T.jobs.some(function(j){ return j.kind==='session'&&j.nom===act.nom; })) return null;   // deja lance : dans les travaux
  var P=(typeof _pilProtData==='function')?_pilProtData():null; if(!P||!P.n) return null;
  var nNu=P.nu.length+P.bientot.length; if(!nNu) return null;
  var days=(typeof _pilTreatDays==='function')?_pilTreatDays():null; if(!days||!days.length) return null;
  var fen=days.filter(function(x){ return x&&x.start!=null; })[0]; if(!fen) return null;
  var tid=act.tracteurDefautId||'', c=tid?(T.conso[tid]||(T.conso[tid]=_pilGmConso(tid))):null;
  var lh=(c&&c.ok)?c.lh:T.cfgLh; if(!(lh>0)) return null;
  var h=T.domaine*hha;
  return {nom:act.nom, h:h, l:h*lh, fen:String(fen.label||'')+' '+fen.start+'h\u2192'+fen.end+'h', nNu:nNu, src:(c&&c.ok)?'mesure':'reglage', hhaSrc:(M?('cadence mesurée sur '+M.n+' traitement'+(M.n>1?'s':'')):'barème')};
}
// ── Les cartes du tracteur : ★ MOTS-9 (§592) — l'ancienne section « Pour finir les travaux tracteur en cours » (trois
//   grandes cartes, _pilCkTracteur) se lit désormais dans _pilTrxParts / _pilPanelTrx et la carte de la cuve.
// ── ③ Matériel : la consommation mesurée, tracteur par tracteur ──
// ★ PRO-1 (§269) — Nico, capture du 08/10 : « ne fait pas pro du tout ». Trois lignes identiques « pas assez de pleins :
//   réglage 6,0 L/h utilisé », chacune sur trois lignes de texte sous un tiret seul, et des graduations 0-3-6-9-12
//   réparties à la largeur de leur texte — le « 6 » ne tombait pas sous le trait du réglage. Désormais : une phrase quand
//   aucun tracteur n'est encore mesuré (ce qu'il faut, et ce qui sert en attendant) ; une ligne par tracteur (nom et ce
//   qui est noté · la piste · la valeur sur une ligne) ; l'échelle posée en pourcentages, comme les points et les traits.
//   Sans aucun intervalle noté nulle part, ni piste ni échelle : il n'y aurait rien à y lire.
function _pilPanelConso(d){
  var tr=(d.tracs||[]); if(!tr.length) return '';
  var cfgLh=_ecoCfg().conso, L=0, H=0, Hc=0, mx=12, nIv=0;
  var C=tr.map(function(t){ var c=_pilGmConso(t.id); c.nom=t.nom; c.iv.forEach(function(v){ if(!v.ecarte&&v.lh>mx) mx=v.lh; }); return c; });
  if(cfgLh>mx) mx=cfgLh;
  mx=Math.ceil(mx/3)*3;
  var pc=function(v){ return (Math.max(0,Math.min(v,mx))/mx*100).toFixed(1)+'%'; };
  var pl=function(n,s){ return n+' '+s+(n>1?'s':''); };
  C.forEach(function(c){ if(c.ok){ L+=c.L; H+=c.H; Hc+=c.Hc; } nIv+=c.iv.length; });
  var regl=cfgLh>0?'<line x1="'+pc(cfgLh)+'" x2="'+pc(cfgLh)+'" y1="1" y2="23" class="g"/>':'';
  var rows=C.map(function(c){
    var dots=c.iv.map(function(v){
      if(v.ecarte) return '<circle cx="99%" cy="12" r="4.5" class="e"><title>'+_pilNum(v.l)+' L sans aucune heure notée : écarté</title></circle>';
      return '<circle cx="'+pc(v.lh)+'" cy="12" r="'+Math.min(8,2.5+v.h/6).toFixed(1)+'" class="d"><title>'+_pilNum(v.l)+' L \u00f7 '+_pilGmFr(v.h)+' h = '+_pilGmFr(v.lh)+' L/h</title></circle>';
    }).join('');
    var moy=c.ok?'<line x1="'+pc(c.lh)+'" x2="'+pc(c.lh)+'" y1="3" y2="21" class="m"/>':'';
    var note=[]; if(c.nOk) note.push(pl(c.nOk,'intervalle')); if(c.nEc) note.push(pl(c.nEc,'écarté')); if(c.nSans) note.push(pl(c.nSans,'plein')+' sans litres');
    var val=c.ok?('<b>'+_pilGmFr(c.lh)+'</b>\u00a0L/h<small>'+Math.round(c.Hc/c.H*100)+'\u00a0% chronométré</small>')
      :('<span>réglage '+_pilGmFr(cfgLh)+'\u00a0L/h</span><small>pas encore mesuré</small>');
    return '<li class="pil-cso-r'+(c.ok?'':' sans')+'"><span class="pil-cso-n">'+_pilEsc(c.nom||'Tracteur')+'<small>'+(note.length?note.join(' \u00b7 '):'aucun plein noté avec ses litres')+'</small></span>'
      +'<span class="pil-cso-s"><svg width="100%" height="24" aria-hidden="true"><line x1="0" x2="100%" y1="12" y2="12" class="t"/>'+regl+dots+moy+'</svg></span>'
      +'<span class="pil-cso-v">'+val+'</span></li>';
  }).join('');
  var ax=''; for(var k=0;k<=mx+1e-9;k+=mx/4) ax+='<span style="left:'+pc(k)+'">'+_pilGmFr(k,k%1?1:0)+(k>=mx-1e-9?'\u00a0L/h':'')+'</span>';
  // ★ MOTS-9 (§592) : le paragraphe de 36 mots (« Aucun tracteur n'a encore assez de pleins… », .pil-cso-msg) est dans le « i »
  //   (pil.conso) ; sans mesure, le chiffre de la carte est le réglage, et sa pastille le dit.
  var body='<div class="pil-cso'+(nIv?'':' compact')+'"><ul class="pil-cso-l">'+rows+'</ul>'
    +'<div class="pil-cso-axr" aria-hidden="true"><span></span><span class="pil-cso-ax">'+ax+'</span><span></span></div>'
    +'<div class="pil-trx-leg"><span><i class="d"></i>un intervalle plein \u2192 plein</span><span><i class="m"></i>moyenne pondérée</span><span><i class="g"></i>réglage actuel</span></div></div>';
  var flotte=H>0?L/H:null;
  // ★ MOTS-9 (§592) : sans mesure, le chiffre est le réglage — celui que prennent tous les calculs de carburant — et il le dit.
  return _pilTile('conso','#B85A1A','Consommation',
    _pilStat(_pilGmFr(flotte!=null?flotte:cfgLh), ' L/h', null)+(flotte!=null?_pilPhPl('mesur\u00e9e','ok'):_pilPhPl('r\u00e9glage','')),
    flotte!=null?(Math.round(Hc/H*100)+' % des heures chronométrées'):'pas encore mesurée',
    null, body+'<div class="pil-tv-act">'+_pilTvBtn('entretien','Ouvrir l\u2019entretien')+'</div>', 'pil.conso');
}

// ── Onglet AUJOURD'HUI (cockpit) ──
// ★★★ REF-1 (§266) — LE MODÈLE DU COCKPIT, LU DANS LES MOTEURS DU PILOTAGE
//   La maquette validée (07/10) tourne telle quelle dans src/cockpit-vue.js et lit un modèle V. Ce modèle se construit
//   ICI, avec les mêmes moteurs que le reste du Pilotage : fin prévue (_pilMargeCalc), présences et tension de l'équipe,
//   fenêtres des tâches (_rfCd), photos du jour, journal, parcelles, météo de l'Accueil, sources de « À savoir »
//   (cockpit.js). Rien n'est recalculé à côté ; ce qu'on ne sait pas reste vide (jamais un chiffre inventé).
function _pilCk2Modele(d, m){
  var t0=new Date(), auj=_mvToday();
  var isoD=function(x){ return x ? x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0') : null; };
  var oIso=function(n){ var x=new Date(Date.UTC(2026,0,1)+n*86400000); return x.getUTCFullYear()+'-'+String(x.getUTCMonth()+1).padStart(2,'0')+'-'+String(x.getUTCDate()).padStart(2,'0'); };
  var nomT=function(n){ return (typeof window.tNom==='function')?window.tNom(n):n; };
  // (lettres accentuées ramenées une à une : pas de plage de diacritiques, hors du jeu de glyphes des polices)
  var slug=function(n){ return String(n).toLowerCase().replace(/[àâä]/g,'a').replace(/[éèêë]/g,'e').replace(/[îï]/g,'i').replace(/[ôö]/g,'o').replace(/[ùûü]/g,'u').replace(/ç/g,'c').replace(/[^a-z0-9]+/g,''); };
  var art=function(n){ var l=String(n).toLowerCase(); return /^[aeiouyhéèêâîô]/.test(l)?'l\u2019'+l:(/age\b/.test(l)?'le '+l:'la '+l); };   // HORS-1 (§322) : « le désherbage manuel » — un mot en -age suivi d'un autre reste masculin
  // ★ DATES-1 (§323) : les dates des lignes, du plan et d'« À savoir » = celles de TOUTES les tâches de la période (taskDates) : une
  //   tâche sans barème (arrachage, entreplantation sans trou compté…) prend enfin les dates réglées dans la période, au lieu du premier
  //   chantier et de l'objectif. Repli sur taskWindows (planning.js d'avant ce lot).
  var cd=(typeof _rfCd==='function'&&_rfCd())||{}, fen=(Array.isArray(cd.taskDates)?cd.taskDates:cd.taskWindows)||[], retards=_pilRetards();
  var rows=(typeof window._ckPlanTaches==='function')?window._ckPlanTaches(d.data):(d.data||[]);
  // ★ CHANT-1 (§316) : les chantiers dans l'ordre commun (utils.js, _mvOrdreChantiers), les dates lues dans la même période
  //   que les fenêtres affichées (_pilSaison, comme _rfCd) ; l'arrachage fini pour l'équipe porte eqFini (vert, en tête des terminés).
  var OC=(typeof window._mvChantiersCtx==='function')?window._mvChantiersCtx(_pilSaison()):null, EQF=(OC&&OC.equipeFinie)||{};
  if(typeof window._mvOrdreChantiers==='function') rows=window._mvOrdreChantiers(rows, OC);
  var debH=[];   // DATES-1 : le début de la campagne (courbe, frise de la fin prévue) reste celui des tâches AU BARÈME, comme avant
  var taches=rows.map(function(r){
    var w=fen.filter(function(x){ return x&&x.nom===r.nom; })[0], nom=nomT(r.nom);
    if(w&&w.ws!=null&&w.h!==0) debH.push(oIso(w.ws));
    return { id:slug(r.nom), cle:r.nom, nom:nom, art:art(nom), f:false, pct:Number(r.pct)||0, eqFini:!!EQF[r.nom]&&(Number(r.pct)||0)<100, sel:(typeof window._mvTacheSel==='function')&&!!window._mvTacheSel(r.nom),
      hha:(r.surf_total>0&&r.h_total>0)?r.h_total/r.surf_total:0, hDone:(r.h_total>0)?(Number(r.h_done)||0):null, hTotal:(r.h_total>0)?Number(r.h_total):null,
      debut:(w&&w.ws!=null)?oIso(w.ws):null, fin:(w&&w.we!=null)?oIso(w.we-1):null };
  });
  var PARC=(window.PARCELLES||[]).filter(function(p){ return p&&p.nom; });
  // ★ FORME-1 (§301) : la commune est rangée { nom, lat, lng } (météo par secteur) — le plan écrivait l'objet lui-même
  //   (« [object Object] ») et fondait toutes les communes en une. Le contour part avec la parcelle (utils.js, _mvParcContours).
  var parcs=PARC.map(function(p){ return { nom:p.nom, ha:Number(p.surface)||0, appellation:p.appellation||'',
    commune:(p.commune&&typeof p.commune==='object')?String(p.commune.nom||''):String(p.commune||''),
    arr:/arrach/i.test(String(p.statut||'')), cepage:p.cepage||'', geo:(typeof window._mvParcContours==='function')?window._mvParcContours(p.nom):[] }; });
  // ★★ ETAT-1 (§320) : l'état d'une parcelle = son statut dans la période, celui de sa fiche (cockpit.js/_ckPlanLire) ; le journal ne
  //   dit plus que qui l'a commencée, cherché dans toute la période. Avant : t.debut, l'ouverture de la fenêtre de la tâche — null pour
  //   une tâche sans fenêtre (entreplantation sans trou, travaux sans barème) : tout le journal, toutes saisons, comptait.
  var SA=(typeof _pilSaison==='function')?_pilSaison():null, perD=(SA&&SA.debut)?String(SA.debut).slice(0,10):null, perO={ fin:(SA&&SA.fin)?String(SA.fin).slice(0,10):'' };
  var J=window.JOURNAL||[], etats={}, presta={};
  taches.forEach(function(t){
    etats[t.id]=(typeof window._ckPlanEtats==='function')?window._ckPlanEtats(PARC, J, t.cle, perD, !!retards[t.cle], perO):{};
    // ETAT-1 : un arrachage fini pour l'équipe est « fait » sur le plan ; la loupe ajoute que la suite revient au prestataire.
    var pr=(typeof window._mvAuPrestataire==='function')?PARC.filter(function(p){ return etats[t.id][p.nom]==='faite'&&window._mvAuPrestataire(p,t.cle); }).map(function(p){ return p.nom; }):[];
    if(pr.length) presta[t.id]=pr;
  });
  // Présences du jour (les mêmes que la tuile « Présences ») et tension de chacun (moteur de la tuile « Tension »).
  // ★ ANTICIPE-1 (§420) : « absent » ne s'accordait pas (« Sophie absent ») — la fiche ne porte pas le genre (VIF-1, §414). Une
  //   absence sans motif ne prend plus d'adjectif : un motif connu reste derrière le nom (« Marion en congé », comme avant) ; dès qu'un
  //   nom n'en a pas, le mot vient en tête de la liste (« Absences : Inès, Sophie », plus bas).
  var LIB={ cp:'en congé', recup:'en récupération', maladie:'en arrêt', absent:'' };
  var gens=(d.presences||[]).filter(function(p){ return p&&!p.bureau&&p.etat!=='repos'; }).map(function(p){ return { nom:p.nom, absent:p.etat!=='present', motif:LIB[p.etat]||'' }; });
  // ★★ AUJ-5 (§307) : un jour sans travail au planning (week-end, jour chômé), l'Effectif et les Présences montrent le
  //   PROCHAIN jour travaillé, et le disent. Les jours travaillés se lisent au planning (_pilJourDomaine), gardés ici.
  var SEMJ=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'], ouvC={};
  var ouv=function(x){ var k=_pilPhotoIso(x); if(!(k in ouvC)) ouvC[k]=_pilJourDomaine(x); return ouvC[k]; };
  var repos=(d.jourTravaille===false), jEff=null;
  if(repos){
    for(var kj=1; kj<=14 && !jEff; kj++){ var xj=new Date(t0.getFullYear(), t0.getMonth(), t0.getDate()+kj); if(ouv(xj)) jEff=xj; }
    if(jEff){
      var PEj=window.PLANNING_ENTRIES||{};
      gens=_pilMembresActifs(_pilPhotoIso(jEff)).filter(function(mb){ return mb && !mb.bureau && _pilPrevuLe(mb, jEff); }).map(function(mb){
        var by=PEj[mb.nom]&&PEj[mb.nom][jEff.getFullYear()], e=(by&&by[jEff.getMonth()]&&by[jEff.getMonth()][jEff.getDate()])||null, ee=_pilEtatEntree(e);
        return { nom:mb.nom, absent:ee.etat!=='present', motif:LIB[ee.etat]||'' };
      });
    } else gens=[];
  }
  var jNom=jEff?SEMJ[jEff.getDay()]:'';
  var TS=null; try{ TS=_pilTensData(d); }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilCk2Modele#tens'); }
  ((TS&&TS.rows)||[]).forEach(function(r){ var g=gens.filter(function(x){ return x.nom===r.nom; })[0]; if(g&&r.p>0) g.tens=Math.round((r.f||0)/r.p*100); });
  var nPres=gens.filter(function(g){ return !g.absent; }).length, abs=gens.filter(function(g){ return g.absent; });
  var absVus=abs.slice(0,2), absPref=absVus.some(function(g){ return !g.motif; });
  var absNoms=absVus.map(function(g){ return g.nom+(g.motif?' '+g.motif:''); }).join(', ')+(abs.length>2?' et '+(abs.length-2)+' autre'+(abs.length>3?'s':''):'');
  var absListe=!abs.length?'':(absPref?(abs.length>1?'Absences':'Absence')+'\u00a0: '+absNoms:absNoms);
  var absTxt=repos?(jEff?('Repos aujourd\u2019hui \u00b7 '+jNom+(absPref?', '+absListe.charAt(0).toLowerCase()+absListe.slice(1):' : '+(absListe||'toute l\u2019équipe'))):'Pas de travail prévu au planning ces deux semaines'):(absListe||'Toute l\u2019équipe est là');
  // Le fil : le journal du jour (fonctions de cockpit.js). Les équipes : plus bas (FORME-1, §301).
  var fil=(typeof window._ckFilDonnees==='function')?window._ckFilDonnees(J, auj):[];
  // ★ DIRECT-1 (§318) : qui travaille = cockpit.js/_ckQui (l'équipe d'abord, l'auteur s'il était dans les rangs — « sans moi »
  //   le retire). Le repli applique la même règle (mv-harnais-direct1) ; les noms s'écrivent « A, B et C ».
  var qui=function(e, vu){
    if(typeof window._ckQui==='function') return vu?window._ckQui(e, vu):window._ckQui(e);
    var q=String((e&&e.qui)||'').trim(), r=[];
    ((e&&Array.isArray(e.membresEquipe))?e.membresEquipe:[]).forEach(function(x){ var n=String(x||'').trim(); if(n&&r.indexOf(n)<0) r.push(n); });
    if(q&&r.indexOf(q)<0&&!(e.quiHors&&r.length)) r.push(q);
    if(typeof window._mvJRangs==='function'){ try{ r=window._mvJRangs(e, r, vu).dans; }catch(x){ if(window._mvAvale) window._mvAvale(x,'pilotage.js/_pilCk2Modele#qui'); } }   // RANGS-1 (§528) : la règle de _ckQui
    return r;
  };
  var etN=function(l){ return (typeof window._ckEt==='function')?window._ckEt(l):l.join(' et '); };
  var tDe=function(n){ return taches.filter(function(x){ return x.cle===n; })[0]; };
  var haDe=function(n){ var p=parcs.filter(function(x){ return x.nom===n; })[0]; return p?p.ha:0; };
  var evts=[];
  fil.slice().reverse().forEach(function(x){
    var e=x.e, t=tDe(e.tache); if(!t) return; var n=qui(e);
    var ev={ type:e.statut==='Validé'?'valide':'commence', noms:etN(n)||'Quelqu\u2019un', ini:n.slice(0,2).map(function(c){ return c.charAt(0).toUpperCase(); }),
      tache:t.id, parcelle:e.parcelle, ts:x.ts||t0.getTime(), h:e.statut==='Validé'?Math.round(haDe(e.parcelle)*t.hha*10)/10:0 };
    evts.unshift(ev);
  });
  // ★ FORME-1 (§301) : l'équipe d'une parcelle en cours = ceux du « Début » qui la met en cours (le même journal, la même
  //   période que l'état « en cours » — ETAT-1, §320 : cockpit.js/_ckPlanDebuts), QUEL QUE SOIT LE JOUR. Avant : le journal du jour seul
  //   — une parcelle commencée la veille restait « en cours » sans personne dessus, et le plan écrivait « aucune équipe ».
  // ★★ RANGS-1 (§528) : « En ce moment » dit qui est sur la parcelle MAINTENANT — l'équipe du « Début », moins ceux que le planning
  //   ne fait pas travailler aujourd'hui, ceux en cave et ceux au tracteur (utils.js, _mvJRangs, jugé à l'instant). Nico (04/11) :
  //   « Pauline… est en formation… aujourd'hui je suis en repos… il ne faut pas qu'elles soient considérées dans une tâche de vigne
  //   alors qu'elles sont sur le tracteur ». Plus personne de l'équipe dans les rangs : la parcelle reste en cours, « personne en ce
  //   moment » (`vide`), pastille « – ». Le plan lit la même équipe.
  var maintenant=t0.getTime(), vuNow={ iso:auj, ts:maintenant };
  var equipes=[];
  taches.forEach(function(t){
    var deb=(typeof window._ckPlanDebuts==='function')?window._ckPlanDebuts(PARC, J, t.cle, perD, perO):{};
    Object.keys(deb).forEach(function(n){ var e=deb[n], q0=qui(e), q=qui(e, vuNow), vide=!!(q0.length&&!q.length);
      equipes.push({ noms:etN(q)||(vide?'personne en ce moment':'Personne d\u2019indiqu\u00e9'), ini:q.length?q.slice(0,2).map(function(c){ return c.charAt(0).toUpperCase(); }):[vide?'\u2013':'?'], tache:t.id, parcelle:n, depuis:String(e.date||auj), vide:vide }); });
  });
  // ★ DIRECT-2 (§328) : le jour du début d'une parcelle EN COURS SANS ligne « Début » dans la période. C'est l'arrachage en étapes :
  //   une étape validée met la parcelle en cours (app.js/_arrSyncTache) sans écrire de « Début » ; son jour est celui de la première
  //   étape de la campagne (app.js/_arrDebut, même avant la période — ARRACH-8). Nico (14/10) : « En direct » écrivait « commencée
  //   aujourd'hui » — sans date, le cockpit prenait celle du jour (cockpit-vue.js, le filet « Personne d'indiqué »). Jour inconnu
  //   (« remis » sans début, ligne effacée) : absent, et le cockpit n'écrit aucune date. Les équipes ne changent pas : pas de « qui » ici.
  var depuis={};
  taches.forEach(function(t){
    var ec=etats[t.id]||{}, D={}, n=0;
    PARC.forEach(function(p){
      if(ec[p.nom]!=='cours'||equipes.some(function(e){ return e.tache===t.id&&e.parcelle===p.nom; })) return;
      var d0=(t.cle==='Arrachage'&&typeof window._arrDebut==='function')?String(window._arrDebut(p)||''):'';
      if(/^\d{4}-\d{2}-\d{2}$/.test(d0)&&d0<=auj){ D[p.nom]=d0; n++; }
    });
    if(n) depuis[t.id]=D;
  });
  // ★★ DIRECT-1 (§318) : le tracteur du jour (cockpit.js/_ckTracJour : la session et sa boîte noire). Ses événements se mêlent au
  //   fil, à leur heure ; le conducteur en marche ou en pause va dans « En ce moment », au-dessus. Nico (12/10) : « aujourd'hui
  //   j'étais sur le tracteur, j'aimerais bien que ça apparaisse ».
  var TJ={ evts:[], cours:[] };
  try{ if(typeof window._ckTracJour==='function') TJ=window._ckTracJour(window.SESSIONS||[], auj, { tracs:window.TRACTEURS_LIST||[], maint:maintenant }); }   // RANGS-1 (§528) : maint — entre deux parcelles
  catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilCk2Modele#trac'); }
  var ini2=function(l){ return l.length?l.slice(0,2).map(function(c){ return c.charAt(0).toUpperCase(); }):['?']; };
  TJ.evts.forEach(function(x){ var n=x.qui?[x.qui].concat(Array.isArray(x.avec)?x.avec:[]):[];   /* COEQ-5 (§526) : et ses coéquipiers */
    evts.push({ type:x.k, noms:(n.length>1?n.slice(0,-1).join(', ')+' et '+n[n.length-1]:(n[0]||'Quelqu\u2019un')), ini:ini2(n), act:x.act||'', parcs:x.parcs||[], m:(typeof x.m==='number')?x.m:null, trac:x.trac||'', ts:(typeof x.ts==='number')?x.ts:null }); });
  evts.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
  var tracCours=TJ.cours.map(function(x){ var n=x.qui?[x.qui].concat(Array.isArray(x.avec)?x.avec:[]):[];   /* COEQ-5 (§526) : et ses coéquipiers */
    return { noms:(n.length>1?n.slice(0,-1).join(', ')+' et '+n[n.length-1]:(n[0]||'Quelqu\u2019un')), ini:ini2(n), act:x.act||'', parcs:x.parcs||[], ts:(typeof x.ts==='number')?x.ts:null, pause:!!x.pause, entre:!!x.entre }; });   // RANGS-1 (§528) : entre deux parcelles
  // La courbe : les photos du jour (PHOTO-1) et aujourd'hui en direct.
  var ph=((typeof window._ckChargeSerie==='function')?window._ckChargeSerie(_pilPhotoListe(), d, auj, (typeof _pilSaison==='function'&&_pilSaison()&&_pilSaison().nom)||''):[]).map(function(x){ return { d:x.iso, reste:x.v }; });
  var hT=d.totalTotal||0;
  // La météo des cinq jours (Accueil) : pictogramme, températures, risque de pluie, cumul, vent le plus fort.
  // ★ AUJ-8 (§312) : des FAITS, plus de « brûlage possible » — Nico (11/10) : « ce n'est pas à l'appli de décider si oui ou
  //   non il est possible de faire une tâche ». Cumul et vent : _ckMeteoJour (cockpit.js), le calcul des lignes d'« À savoir » ;
  //   le risque est le plus haut de la journée (precipitation_probability_max). Une valeur absente reste absente (null), jamais
  //   0. Un jour non travaillé n'est pas grisé (Nico, 11/10) : la bande dit le temps, le planning dit le travail.
  var MD=window.METEO_DAILY||null, MH=window.METEO_HOURLY||null, meteo=[];
  var ICW=function(c){ c=Number(c); return c<=1?'soleil':c===2?'eclaircie':(c>=71&&c<=77)?'gel':(c>=51)?'pluie':'nuage'; };
  var TXT={ soleil:'Ensoleillé', eclaircie:'Éclaircies', nuage:'Couvert', pluie:'Pluie', gel:'Gel ou neige' };
  var MJ=(MH&&Array.isArray(MH.time)&&Array.isArray(MH.precip)&&typeof window._ckMeteoJour==='function')?window._ckMeteoJour:null;
  if(MD&&Array.isArray(MD.time)){
    MD.time.slice(0,5).forEach(function(iso,k){
      var jr=MJ?MJ(MH,String(iso)):null, mm=(jr&&jr.vu)?jr.mm:0, vent=(jr&&jr.vu)?jr.vent:null, ppB=MD.pp?MD.pp[k]:null;
      var pp=(ppB!=null&&ppB!==''&&isFinite(Number(ppB)))?Math.max(0,Math.min(100,Math.round(Number(ppB)))):null;
      var dt=new Date(iso+'T12:00:00'), ic=ICW(MD.code&&MD.code[k]);
      meteo.push({ j:k===0?'Auj.':dt.toLocaleDateString('fr-FR',{weekday:'short'}).replace(/^./,function(c){ return c.toUpperCase(); }),
        ic:ic, tmax:Math.round(MD.tmax&&MD.tmax[k]), tmin:Math.round(MD.tmin&&MD.tmin[k]), mm:mm, pp:pp, vent:vent,
        txt:TXT[ic]+(pp!=null?', risque de pluie '+pp+'\u00a0%':'')+(mm>=0.5?', '+String(mm).replace('.',',')+'\u202fmm':'')+(vent!=null?', vent jusqu\u2019à '+vent+'\u202fkm/h':'') });
    });
  }
  // « À savoir » : les sources testées de cockpit.js, au format des lignes de la maquette.
  var plan={ parcs:PARC, journal:J, fen:fen };
  var sv=[];
  try{
    sv=[].concat(window._ckSvMeteo(MH, d.data, t0, (typeof window._wxSecteurs==='function'?window._wxSecteurs():null), plan),
      window._ckSvAbsences(window.MEMBRES, window.PLANNING_ENTRIES, _pilEtatEntree, t0, _pilPrevuLe),
      window._ckSvContrats(window.MEMBRES, t0, _pilGainsProlong(d)), window._ckSvRetards(d.data, retards));
  }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilCk2Modele#savoir'); }
  (d.tracs||[]).forEach(function(t){ if(t&&t.rep) sv.push({ cat:'materiel', prio:2, quand:'En réparation', titre:(t.nom||'Un tracteur')+' immobilisé', sous:(t.rep.motif||'Chez le réparateur.') }); });
  var ACT={ contrat:{ action:'Simuler un renfort', onglet:'sim' }, retard:{ action:'Voir sur le plan', fn:'voirRetard' }, equipe:{ action:'Ouvrir le planning', module:'planning' } };
  sv=sv.map(function(x){ var a=ACT[x.cat]||{}; return { cat:x.cat, prio:x.prio, quand:x.quand, titre:x.titre, sous:x.sous, action:a.action, onglet:a.onglet, fn:a.fn, module:a.module }; });
  // La décision du jour : les mêmes moteurs que les quatre tuiles.
  var tx=function(h){ return String(h==null?'':h).replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim(); };
  var TR=null; try{ TR=_pilTraiterCalc(); }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilCk2Modele#traiter'); }
  var admin=(typeof window.isAdmin==='function')&&window.isAdmin();
  var PP=null; try{ PP=_pilPrioDuJour(d).M; }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilCk2Modele#prio'); }
  var pMode=(PP&&PP.mode)||'aucune', pNom=(PP&&PP.taches&&PP.taches[0])||'', pT=(pMode==='choix'||pMode==='aucune')?null:tDe(pNom);
  var pDt=(PP&&PP.dates&&PP.dates[pNom])||{}, pEq=(PP&&PP.items&&PP.items[0]&&Array.isArray(PP.items[0].equipe))?PP.items[0].equipe.filter(Boolean):[];
  var pRaison=pMode==='admin'?('Fixée par l\u2019administrateur'+(pEq.length?(', équipe : '+pEq.join(', ')):'')+'.')
    :pMode==='dates'?((PP.retard&&PP.retard[pNom])?('En retard'+(pDt.fin?', sa fenêtre finissait le '+_pilFmtD(pDt.fin):'')+'.'):('Seule tâche dans ses dates'+(pDt.fin?', jusqu\u2019au '+_pilFmtD(pDt.fin):'')+'.'))
    :pMode==='prochaine'?('Aucune tâche dans ses dates aujourd\u2019hui : elle commence le '+_pilFmtD(pDt.debut)+'.')
    :pMode==='choix'?(PP.taches.length+' tâches dans leurs dates en même temps : '+(admin?'à vous de fixer la priorité.':'l\u2019administrateur fixe la priorité.'))
    :'Aucune tâche en cours sur la période.';
  pRaison=pRaison.replace(/\.\.$/, '.');   // « jusqu’au 30 nov.. » : la date abrégée porte déjà son point
  var tensV=TS&&TS.rows&&TS.rows.length?(TS.nRouge?(TS.nRouge+' au-delà du maximum'):(TS.nSeuil?(TS.nSeuil+' personne'+(TS.nSeuil>1?'s':'')+' au seuil'):'Personne au seuil')):'';
  var sem=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'], dd=new Date(t0.getFullYear(),t0.getMonth(),t0.getDate());
  var jeudi=new Date(dd); jeudi.setDate(dd.getDate()+3-((dd.getDay()+6)%7)); var s1=new Date(jeudi.getFullYear(),0,4);
  var nSem=1+Math.round(((jeudi-s1)/86400000-3+((s1.getDay()+6)%7))/7);
  var sais=(typeof d.saison==='string')?(d.saison==='\u2014'?'':d.saison):((d.saison&&d.saison.nom)?String(d.saison.nom):'');   // AUJ-5 : d.saison est le NOM de la période — « de la saison » s'affichait toujours
  var saisonDe=/hiver/i.test(sais)?'d\u2019hiver':/printemps/i.test(sais)?'de printemps':/(été|ete)\b/i.test(sais)?'d\u2019été':/automne|vendange/i.test(sais)?'d\u2019automne':'de la saison';
  // AUJ-5 : les jours travaillés du planning, d'aujourd'hui jusqu'à l'objectif ou la fin prévue (120 jours au plus) —
  //   le besoin d'heures par jour se compte sur ces jours-là, et la courbe dit « non travaillé » d'après eux.
  var borneJ=new Date(t0.getFullYear(), t0.getMonth(), t0.getDate()+120);
  var jusq=[(m&&m.obj instanceof Date)?m.obj:null, (m&&m.proj instanceof Date)?m.proj:null].filter(Boolean).reduce(function(a,b){ return b>a?b:a; }, new Date(t0.getFullYear(), t0.getMonth(), t0.getDate()+7));
  if(jusq>borneJ) jusq=borneJ;
  var OUVL=[], xo=new Date(t0.getFullYear(), t0.getMonth(), t0.getDate());
  while(xo<=jusq){ if(ouv(xo)) OUVL.push(_pilPhotoIso(xo)); xo.setDate(xo.getDate()+1); }
  // ★★★ COHER-1 (§581) : la tuile « Conformité » comptait les lignes de _pilDiag() marquées 'cfm' — aucune ne l'est : elle ne pouvait
  //   dire que « 0 point à régler », sous un onglet qui signalait un SIRET manquant. Elle lit la liste de l'onglet (_pilCfmPoints).
  var diag=[]; try{ diag=_pilCfmPoints(); }catch(e){ diag=[]; if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilCk2Modele#cfm'); }
  window._ckSavoirFort=(sv||[]).filter(function(x){ return x&&x.prio===1; }).length;   // VIF-1 : la pastille du Pilotage dans la barre
  if(typeof window._railAlertesMaj==='function') setTimeout(window._railAlertesMaj,0);
  var _ckV={
    auj:auj, debut:(debH.sort()[0])||(ph[0]&&ph[0].d)||auj,
    objectif:isoD(m&&m.obj), fin:isoD(m&&m.proj), marge:(m&&m.marge!=null)?m.marge:null,
    dateTxt:sem[t0.getDay()].replace(/^./,function(c){ return c.toUpperCase(); })+' '+t0.getDate()+' '+t0.toLocaleDateString('fr-FR',{month:'long'})+', semaine '+nSem,
    saisonDe:saisonDe, taches:taches, parcs:parcs, etats:etats, presta:presta, gens:gens, presents:nPres, effectifTotal:gens.length,
    presTxt:nPres+' présent'+(nPres>1?'s':'')+(abs.length?', '+(absPref&&!repos?absTxt.charAt(0).toLowerCase()+absTxt.slice(1):absTxt):''), absTxt:absTxt,
    confN:diag.length, confTxt:diag.length?(tx(diag[0].t||'Un point à régler')+(diag.length>1?(' · +'+(diag.length-1)):'')):'Rien à régler',   // « Registre : SIRET manquant · +1 » : le repère d'un chiffre reste court (§580c, règle 2)
    equipes:equipes, depuis:depuis, evts:evts, tracCours:tracCours, photos:ph, reste:d.totalReste||0, total:hT, hFait:d.hDone||0, hTotal:hT, pct:Number(d.gaugePct)||0,
    capMoy:(m&&m.cadH)||0, besoin:(function(){ if(!(m&&m.obj)) return 0; var n=0, x=new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()+1); while(x<=m.obj&&n<400){ if(ouv(x)) n++; x.setDate(x.getDate()+1); } return n?Math.round((d.totalReste||0)/n):0; })(),
    meteo:meteo, savoir:sv,
    decision:{ pres:{ v:(jEff?(jNom.charAt(0).toUpperCase()+jNom.slice(1)+' : '):'')+nPres+' sur '+gens.length,
        raison:repos?(jEff?('Pas de travail aujourd\u2019hui au planning. '+(absListe?absListe+'.':'Toute l\u2019équipe sera là.')):'Pas de travail prévu au planning ces deux semaines.'):absTxt },
      traiter:TR?{ v:tx(TR.big), raison:tx(TR.rai), fen:TR.fen||null, risque:!!TR.risque, prochaine:TR.prochaine||'' }:{ v:'—', raison:'' },
      prio:{ v:pMode==='choix'?'À choisir':(pT?pT.nom:(pNom?nomT(pNom):'—')), raison:pRaison, mode:pMode, choix:pMode==='choix'?PP.taches.map(nomT):null },
      tension:{ v:tensV||'—', raison:tensV?'Travail effectif face au prévu, sur 14 jours.':'' } },
    jourTravaille:!repos, jourEff:jEff?_pilPhotoIso(jEff):null, ouvres:OUVL, ouvresDe:_pilPhotoIso(t0), ouvresA:_pilPhotoIso(jusq),
    prio:pT?pT.id:null, admin:admin, sparkTrav:ph.slice(-14).map(function(x){ return hT?Math.round((hT-x.reste)/hT*1000)/10:0; }), eco:null
  };
  // ★ CAVEPIL-1 (§436) : la vue Cave, lue dans la Cave — dans le modèle, pour les deux montages (REF-1 et la mise à jour en
  //   direct de VIF-1) ; ses points s'ajoutent à « À savoir » de Terrain.
  _ckV.cave=(typeof _pilCk2Cave==='function')?_pilCk2Cave(_ckV):null;   // typeof : les harnais qui extraient le modèle seul ne l'ont pas
  _ckV.per=(typeof _pilCk2Per==='function')?_pilCk2Per():null;   // AUJ-TETE-1 (§454) : la campagne que lisent ces chiffres — typeof, pour la même raison
  return _ckV;
}
// ★★ AUJ-TETE-1 (§454) — LA CAMPAGNE QUE LISENT LES CHIFFRES D'AUJOURD'HUI, pour la ligne de repère sous la date.
//   Aujourd'hui ne suit pas la barre « Vous regardez » : il lit _pilSaison (la période consultée, sinon l'active). C'est la
//   confusion relevée par Nico le 23/10 — « 45 jours de retard par rapport à quoi ? depuis quand ? » — la barre disant
//   « l'exercice » pendant que la phrase chiffrait la campagne. Les mots et le décompte sont ceux de la barre
//   (_pilPorteeBornes, jours du calendrier) : deux façons de compter les jours sur le même écran feraient douter des deux.
//   « meme » : la barre montre déjà cette campagne — la ligne garde alors le nom seul sur ordinateur (styles.css).
//   « pct » : la part écoulée de la campagne, seulement quand on est dedans (à venir ou terminée : pas de piste).
function _pilCk2Per(){
  var sa=(typeof window._pilSaison==='function')?window._pilSaison():null;
  if(!sa || !sa.nom) return null;
  var d0=String(sa.debut||'').slice(0,10), d1=String(sa.fin||'').slice(0,10), iso=/^\d{4}-\d{2}-\d{2}$/;
  var r={ nom:String(sa.nom), bornesHtml:'', pct:null, meme:false, fin:null, finie:false };
  if(iso.test(d0) && iso.test(d1)){
    r.bornesHtml=_pilPorteeBornes(d0,d1,1);
    var a=_pilAnnOrd(d0), b=_pilAnnOrd(d1), o=_pilAnnOrd(_pilAnAuj());
    if(!isNaN(a) && !isNaN(b) && !isNaN(o) && b>=a && o>=a && o<=b) r.pct=Math.round((o-a+1)/(b-a+1)*1000)/10;
    // ★ PORTEE-1 (§591) : une campagne FINIE (sa fin est passée — pas l'objectif, que l'admin déplace) se lit en bilan dans le
    //   cockpit : la phrase du haut et la carte « Fin prévue » (cockpit-vue.js/majResume, majVerdict).
    r.fin=d1; r.finie=(!isNaN(b) && !isNaN(o) && o>b);
  }
  return r;
}
window._pilCk2Modele=_pilCk2Modele;
// ★★ REF-2 (§267) — LA PHOTO ÉCONOMIQUE DU JOUR (la vue Économie de la maquette), lue dans _pecData : le MÊME moteur que
//   l'onglet Économie, donc les mêmes chiffres et la même période. Pas de taux horaire (E.configured faux) : pas de photo,
//   la bascule ne s'affiche pas. Le coût de l'inaction vient du simulateur de renfort (_rfPair → _rfSim), comme sa tuile.
// ★★ CAVEPIL-1 (§436) — LA VUE CAVE DU COCKPIT (bascule Terrain · Cave · Économie), fidèle à la maquette validée le 23/10.
//   Nico (22/10) : « l'introduction du module Cave dans le module de pilotage ». Le Pilotage, écran d'arrivée de l'admin, ne
//   montrait plus rien de la cave depuis CAVE-3 (§96). La vue répond aux questions du gérant : la cave est-elle sous contrôle,
//   combien de temps prend-elle à l'équipe, où en est le vin, qu'est-ce qui arrive, qui a fait quoi.
//   ★ UNE SEULE DÉFINITION (CAVE-3) : tout est LU — _caveSynthese (cave.js : verdict, agenda, cuves, cuvées, derniers gestes),
//     _mlChaine (le millésime), _dgnSynthese (le Diagnostic du Chai), CONFIG.cave_jours (les journées de cave du Planning).
//     Ici, rien que de la mise en forme. ★ AUCUN BOUTON DE GESTE : chaque ligne ouvre l'écran de la Cave (_pilCaveAller).
//   Rend null quand la vue n'a pas lieu d'être : module Cave masqué, vue décochée (« Choisir les indicateurs »), Cave absente.
function _pilCk2Cave(V){
  if(typeof window._caveSynthese!=='function'||!window.CAVE_ELEVAGE||!window.CAVE_VENDANGE) return null;
  if((typeof window._mvModOff==='function'&&window._mvModOff('cave'))||(typeof window._canModule==='function'&&!window._canModule('cave'))) return null;
  if(!_pilShow('auj_cave')) return null;
  var Y=null; try{ Y=window._caveSynthese(); }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilCk2Cave'); }
  if(!Y||!Y.sem||!Y.sem.length) return null;
  var MC=['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'], JC=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];
  var dI=function(x){ var p=String(x||'').slice(0,10).split('-'); return new Date(+p[0],(+p[1])-1,+p[2]); };
  var isoL=function(d){ return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); };
  var add=function(x,n){ var d=dI(x); d.setDate(d.getDate()+n); return isoL(d); };
  var dC=function(x){ if(!x) return ''; var d=dI(x); return (d.getDate()===1?'1er':String(d.getDate()))+'\u00a0'+MC[d.getMonth()]; };
  var jC=function(x){ var d=dI(x); return JC[d.getDay()]+'\u00a0'+d.getDate(); };
  var ecart=function(a,b){ return Math.round((dI(b)-dI(a))/864e5); };
  var nb=function(v){ return String(v).replace('.',','); };
  var point=function(x){ x=String(x||''); return /\.$/.test(x)?x:x+'.'; };   // « le 4 oct. » : l'abréviation porte déjà son point
  var pl=function(n,a,b){ return n+'\u00a0'+(n>1?(b||a+'s'):a); };
  var auj=Y.auj, sem=Y.sem, s0=sem[0].items||[], gestes=function(L){ return (typeof window._mlGestes==='function')?window._mlGestes(L||[]):(L||[]); };
  var v=Y.verdict||{cls:'ok', t:'Rien ne presse aujourd\u2019hui', s:''}, dg=Y.diag||[];
  var alerte=dg.length>0||s0.some(function(i){ return i&&(i.kind==='alerte'||i.kind==='malo'); });
  var CJ=(window.CONFIG&&window.CONFIG.cave_jours&&typeof window.CONFIG.cave_jours==='object')?window.CONFIG.cave_jours:{};
  var gensDu=function(x){ var J=CJ[x]; return (J&&typeof J==='object')?Object.keys(J).filter(function(n){ return J[n]==='j'||J[n]==='m'||J[n]==='a'; }).map(function(n){ return [n,J[n]]; }):[]; };
  var joursDe=function(a,b){ var n=0, x=a, g=0; while(x<=b&&g++<40){ gensDu(x).forEach(function(p){ n+=p[1]==='j'?1:0.5; }); x=add(x,1); } return n; };
  // — le verdict : celui de la Cave, mot pour mot (Prioritaire / À faire / À jour, comme sa pastille) —
  var PL={due:['ko','Prioritaire'], warn:['juste','\u00c0 faire'], ok:['ok','\u00c0 jour']}[v.cls]||['ok','\u00c0 jour'];
  var duDiag=dg.length>0&&/Chai/.test(v.t||'');
  var phrase=String(v.t||'')+((v.cls==='due'&&!duDiag&&!/aujourd/.test(v.t||''))?' aujourd\u2019hui':'')+(/[?.!]$/.test(v.t||'')?'':'.');
  var unite=function(L){ var g=gestes(L); if(!g.length) return ['\u2014','rien de pr\u00e9vu']; var tousOu=g.every(function(i){ return i.kind==='ouillage'; }); return [String(g.length), tousOu?(g.length>1?'ouillages':'ouillage'):(g.length>1?'gestes':'geste')]; };
  var L34=[]; sem.slice(2).forEach(function(w){ L34=L34.concat(w.items||[]); });
  var nCv=Y.cuvees.length, nCu=Y.suivies||0;
  // ★★ MOTS-6 (§588) — LA VUE CAVE ALLÉGÉE : les mêmes faits, en pièces courtes (le chiffre, son mot, ce qui suit en pastilles).
  //   Rien n'est recalculé : chaque pièce est un morceau de ce que la Cave dit déjà. Le pourquoi et la méthode vont derrière le « i ».
  var vPuis=(Array.isArray(v.puis)?v.puis:[]).map(function(x){ var mm=/^(\d+)\s+cuv\u00e9es?\s+(?:ont fini leur|a fini sa) malo$/.exec(String(x)); return mm?(mm[1]+'\u00a0'+(+mm[1]>1?'malos finies':'malo finie')):String(x); });
  var vQuand=(v.cls==='due'&&!duDiag&&!/aujourd/.test(v.t||''))?'aujourd\u2019hui':'';
  var verdict={etat:PL[0], etatTxt:PL[1], phrase:phrase, sous:v.s||'', t:String(v.t||''), quand:vQuand, puis:vPuis, pourquoi:String(v.why||(vPuis.length?'':(v.s||''))),
    sem:[['Cette semaine'].concat(unite(s0)), ['Semaine prochaine'].concat(unite(sem[1]&&sem[1].items)), ['Dans 2 \u00e0 4 semaines'].concat(unite(L34))],
    cadre:duDiag?'Le Diagnostic du Chai croise le labo, les gestes et les d\u00e9gustations. Un statut d\u00e9crit des indices, pas une certitude.'
      :('Calcul\u00e9 par la Cave sur '+(nCu?pl(nCu,'cuve suivie','cuves suivies')+' au Cuvier et ':'')+pl(nCv,'cuv\u00e9e')+' en \u00e9levage, avec le seuil d\u2019ouillage de chaque mill\u00e9sime.'),
    act:duDiag?[['Ouvrir le diagnostic','diag'],['Ouvrir la Cave','auj']]:[['Ouvrir la Cave','auj'],['Le Chai','elevage']]};
  // — la cave en direct : les cuves suivies, les cuvées et leurs fûts, les bouteilles —
  var kindsDe=function(ref){ return s0.filter(function(i){ return i&&String(i.ref)===String(ref); }).map(function(i){ return i.kind; }); };
  var cuves=Y.cuves.map(function(c){
    var mat=/bois|foudre|ch[e\u00ea]ne/i.test(c.nom)?'bois':'inox', dec=!!(c.decuvage&&c.decuvage.date), k=kindsDe(c.id), e=c.e;
    if(dec&&e==='ok') e='vide';
    var puce=e==='alerte'?'\u00c0 contr\u00f4ler':(e==='faire'?(k.indexOf('mesure')>=0?'\u00c0 mesurer':(k.indexOf('decuvage')>=0?'\u00c0 d\u00e9cuver':'\u00c0 faire'))
      :(dec?'D\u00e9cuv\u00e9e':(c.statut==='mpf'?'Mac\u00e9ration'+(c.jEntree!=null?' \u00b7 J'+c.jEntree:''):('FA'+(c.faPct!=null?' \u00b7 '+c.faPct+'\u00a0%':'')))));
    var lect=c.d20!=null?(c.d20+(c.temp!=null?' \u00b7 '+nb(c.temp)+'\u00a0\u00b0C':'')):'\u2014';
    var p=c.proj||{}, suite=dec?('D\u00e9cuv\u00e9e le '+dC(c.decuvage.date)):(c.statut==='mpf'?'Mac\u00e9ration \u00e0 froid':(p.etat==='normal'&&p.date?'Fin de FA pr\u00e9vue '+jC(p.date):(p.etat==='sec'?'Vin sec, d\u00e9cuvage possible':(p.etat==='ralentit'?'Ralentit, \u00e0 contr\u00f4ler':''))));
    var rows=[];
    if(c.parcelles.length) rows.push(['Parcelles',c.parcelles.join(', ')]);
    if(c.kg) rows.push(['Raisin',Math.round(c.kg).toLocaleString('fr-FR')+'\u00a0kg']);
    if(!dec&&c.hl) rows.push(['En cuve','environ '+nb(Math.round(c.hl))+'\u00a0hL, d\u2019apr\u00e8s les caisses']);
    if(dec) rows.push(['D\u00e9cuvage',dC(c.decuvage.date)+(c.decuvage.hl?' \u00b7 '+nb(c.decuvage.hl)+'\u00a0hL':'')+(c.decuvage.cuvee?' \u00b7 '+c.decuvage.cuvee:'')]);
    if(c.jRel!=null) rows.push(['Dernier relev\u00e9',(c.jRel<=0?'aujourd\u2019hui':(c.jRel===1?'hier':'il y a '+c.jRel+'\u00a0j'))+(c.d20!=null?' \u00b7 '+lect:'')]);
    if(c.note) rows.push(['Note','\u00ab\u00a0'+c.note+'\u00a0\u00bb']);
    if(p.etat==='normal'&&p.date) rows.push(['Fin de FA pr\u00e9vue',jC(p.date)+(p.marge!=null?', \u00e0 '+pl(p.marge,'jour')+' pr\u00e8s':'')]);
    return {id:c.id, nom:c.nom.split(/\s+[\u2014-]\s+/)[0], mat:mat, cap:c.cap, hl:c.hl, e:e, puce:puce, v:lect,
      s:suite+(dec&&c.decuvage.cuvee?' \u00b7 '+c.decuvage.cuvee:''), bulles:c.statut==='fa'&&!dec&&c.hl>0, froid:c.statut==='mpf'&&!dec,
      go:'cuve:'+c.id, tip:{t:c.nom, rows:rows}};
  });
  var fortsId={}; dg.forEach(function(d){ fortsId[String(d.id)]=d; });
  // ★ CAVEPIL-2 (§437) : les signes de la dernière dégustation, fût par fût (_caveSignesFuts, cave.js) — mis en forme ici.
  var SGL={pique:'piqu\u00e9', oxyde:'oxyd\u00e9', fleur:'fleur'}, SGN={pique:'Piqu\u00e9 (volatile)', oxyde:'Oxyd\u00e9', fleur:'Fleur en surface'};
  var cuvees=Y.cuvees.map(function(c){
    var k=c.kinds||[], o=c.ouillage, m=c.malo||{}, f=fortsId[String(c.id)], e=f?'alerte':c.e, parts=[];
    var retard=(o&&o.cls==='due'&&/^\+(\d+)/.test(o.d||''))?parseInt((o.d||'').slice(1),10):0;
    if(f) parts.push(String(f.txt||'Signes forts'));
    if(retard) parts.push('<span class="rt">En retard de '+pl(retard,'jour')+'</span>');
    if(m.t==='Finie') parts.push(c.soutirer?'malo finie, \u00e0 soutirer':'malo finie');
    else if(m.t==='Apr\u00e8s la FA') parts.push('fermentation \u00e0 finir en f\u00fbts');
    else if(/^Bloqu/.test(m.t||'')) parts.push('malo bloqu\u00e9e');
    else if(/^En cours/.test(m.t||'')) parts.push('malo en cours'+(m.s?' \u00b7 '+m.s:''));
    if(c.sout) parts.push('soutir\u00e9 le '+dC(c.sout));
    if(o&&o.last&&!retard) parts.push('ouill\u00e9 le '+dC(o.last));
    var puce=f?'Signes forts':(e==='alerte'?'Malo bloqu\u00e9e':(e==='faire'?(k.indexOf('ouillage')>=0&&o&&o.cls==='due'?'\u00c0 ouiller':(k.indexOf('soutirage')>=0?'\u00c0 soutirer':(k.indexOf('so2')>=0?'\u00c0 doser':'\u00c0 faire')))
      :(e==='cours'?(m.t==='Apr\u00e8s la FA'?'Fermentation':(m.t||'En cours')):'\u00c0 jour')));
    var parAn={}; (c.tonneaux||[]).forEach(function(t){ var a=t.annee||'?'; parAn[a]=(parAn[a]||0)+(t.nb||0); });
    var futsTxt=Object.keys(parAn).sort().reverse().map(function(a){ return parAn[a]+' de '+a+(String(a)===String(c.mil)?' (neufs)':''); }).join(', ');
    var rows=[];
    if(futsTxt) rows.push(['F\u00fbts',futsTxt]);
    if(c.hl) rows.push(['Volume',nb(c.hl)+'\u00a0hL']);
    if(o&&o.last) rows.push(['Dernier ouillage',dC(o.last)]);
    if(m.t) rows.push(['Malo',m.t+(m.s?', '+m.s:'')]);
    if(c.sout) rows.push(['Dernier soutirage',dC(c.sout)]);
    if(c.analyse) rows.push(['Derni\u00e8re analyse',dC(c.analyse)]);
    if(f) rows.unshift(['Diagnostic','signes forts\u00a0: '+String(f.txt||'').toLowerCase()]);
    var sgF=(c.signes&&Array.isArray(c.signes.futs))?c.signes.futs:[];
    var futsD=(sgF.length&&sgF.length===(c.futs||0))?sgF.map(function(x){ return {t:'F\u00fbt'+(x.four?' '+x.four:'')+(x.annee!=null?' \u00b7 '+x.annee:''),
      ref:(x.ref||'sans r\u00e9f\u00e9rence')+(x.nb>1?', lot de '+x.nb+' f\u00fbts':''), lot:x.nb>1?(x.ref||String(x.annee!=null?x.annee:'')):'', sg:x.sg||'',
      sgs:(x.sgs||[]).map(function(k){ return SGN[k]; }), d:x.d?dC(x.d):'', qui:x.qui||'', rep:x.rep||''}; }):null;
    var parSg={}; (futsD||[]).forEach(function(x){ if(x.sg) (parSg[x.sg]=parSg[x.sg]||[]).push(x.lot?'un f\u00fbt du lot '+x.lot+(x.rep?' ('+x.rep+')':''):String(x.ref).split(',')[0]); });
    var sgRes=['pique','oxyde','fleur'].filter(function(k){ return parSg[k]; }).map(function(k){ return [k, SGL[k], parSg[k]]; });
    var sgCv=(c.signes&&c.signes.cuvee)?{sgs:c.signes.cuvee.sgs, t:c.signes.cuvee.sgs.map(function(k){ return SGL[k]; }).join(', '), d:dC(c.signes.cuvee.d), qui:c.signes.cuvee.qui||''}:null;
    if(sgRes.length||sgCv) rows.push(['D\u00e9gustation', sgRes.map(function(r){ return r[1]+'\u00a0: '+r[2].join(', '); }).concat(sgCv?[sgCv.t+' sur la cuv\u00e9e, le '+sgCv.d]:[]).join(' \u00b7 ')]);
    return {id:c.id, nom:c.nom, futs:c.futs||0, hl:c.hl?nb(c.hl)+'\u00a0hL':'', e:e, puce:puce, s:parts.join(' \u00b7 '), go:f?'diag':'cuvee:'+c.id, tip:{t:c.nom, rows:rows},
      rt:retard, d:parts.filter(function(x){ return !/^<span class="rt">/.test(x); }).join(' \u00b7 '),   // MOTS-6 : le retard à part, le reste pour le détail
      futsD:futsD, sgRes:sgRes, sgCv:sgCv,   // CAVEPIL-2
      pro:c.pro||'', proTxt:c.pro?JC[dI(c.pro).getDay()]+'\u00a0'+dC(c.pro):'', cours:e==='cours'?(m.t==='Apr\u00e8s la FA'?'fa':'malo'):'',   // ★ CAVEPIL-3 (§457) : la ligne « À jour » (prochain ouillage) et la ligne « En cours » (FA ou malo)
      r:e==='alerte'?0:(e==='faire'?(retard?1:2):(e==='cours'?3:4))};
  }).sort(function(a,b){ return a.r-b.r; });
  var tf=cuvees.reduce(function(a,c){ return a+c.futs; },0), th=Y.cuvees.reduce(function(a,c){ return a+(c.hl||0); },0);
  var hlCu=cuves.reduce(function(a,c){ return a+(c.e==='vide'?0:(c.hl||0)); },0), capCu=cuves.reduce(function(a,c){ return a+(c.cap||0); },0);
  var nBtl=Y.btl.reduce(function(a,b){ return a+b.n; },0);
  // — la semaine : les journées de cave du Planning face aux gestes —
  var lu=sem[0].lundi, LIBK={mesure:['relev\u00e9'], ouillage:['ouillage'], soutirage:['soutirage'], so2:['dose'], decuvage:['d\u00e9cuvage'], alerte:['contr\u00f4le'], malo:['contr\u00f4le de malo','contr\u00f4les de malo'], labo:['fin de FA \u00e0 d\u00e9clarer','fins de FA \u00e0 d\u00e9clarer']};
  var jours=[0,1,2,3,4].map(function(n){
    var x=add(lu,n), ev=[], cpt={};
    gestes(s0.filter(function(i){ return i&&i.date===x; })).forEach(function(i){ cpt[i.kind]=(cpt[i.kind]||0)+1; });
    Object.keys(cpt).forEach(function(kd){ var l=LIBK[kd]||['geste']; ev.push([cpt[kd]+'\u00a0'+(cpt[kd]>1?(l[1]||l[0]+'s'):l[0])]); });
    if(x<auj){ var rf={}; (Y.recents||[]).forEach(function(r){ if(r.d===x&&r.t!=='Relev\u00e9') rf[r.t+(r.t==='D\u00e9cuvage'?' '+String(r.q||'').split(/\s+[\u2014\u2192-]\s+/)[0].replace(/^Cuve\s+/,'Cuve\u00a0'):'')]=1; });
      Object.keys(rf).slice(0,3).forEach(function(t){ ev.push([t,1]); }); }
    return {j:JC[dI(x).getDay()], d:String(dI(x).getDate()), auj:x===auj, passe:x<auj, gens:gensDu(x), ev:ev.slice(0,3)};
  });
  var jSem=joursDe(lu,add(lu,4)), lourds=gestes(s0).filter(function(i){ return i&&i.date>=auj&&(i.kind==='soutirage'||i.kind==='ouillage'); });
  var manque='', manqueC='';   // MOTS-6 : manqueC, le même compte sans la phrase (« 2 soutirages, 1 ouillage »)
  if(lourds.length&&!joursDe(auj,add(lu,4))){
    var nS=lourds.filter(function(i){ return i.kind==='soutirage'; }).length, nO=lourds.length-nS;
    manque=([nS?pl(nS,'soutirage'):'', nO?pl(nO,'ouillage'):''].filter(Boolean).join(' et '));
    manqueC=manque.replace(' et ',', '); manque=(lourds.length>1?'Les ':'Le ')+manque+(lourds.length>1?' n\u2019ont':' n\u2019a')+' pas encore de journ\u00e9e de cave au planning.';
  }
  var resumeS=function(W, a, b){
    var g=gestes(W), r={futs:0,litres:0};
    g.forEach(function(i){ if(i.kind==='ouillage'){ r.futs+=(i.futs||0); var mm=/~(\d+)\s*L/.exec(i.detail||''); if(mm) r.litres+=parseInt(mm[1],10); } });
    var nO=g.filter(function(i){ return i.kind==='ouillage'; }).length, nA=g.length-nO;
    var txt=!g.length?'Rien de pr\u00e9vu par la Cave':([nO?pl(nO,'ouillage'):'', nA?pl(nA,'autre geste','autres gestes'):''].filter(Boolean).join(' \u00b7 ')+(r.futs?' \u00b7 '+pl(r.futs,'f\u00fbt')+(r.litres?' \u00b7 environ '+r.litres+'\u00a0L':''):''));
    var jp=joursDe(a,b);
    return {txt:txt, plan:g.length?(jp?nb(jp)+' '+(jp>1?'journ\u00e9es':'journ\u00e9e')+' de cave au planning':'Aucune journ\u00e9e de cave au planning'):'', vide:!!(g.length&&!jp),
      court:txt.replace(' \u00b7 environ ',' \u00b7 ').replace(/^Rien de pr\u00e9vu par la Cave$/,'rien de pr\u00e9vu'), jours:(g.length&&jp)?nb(jp)+'\u00a0'+(jp>1?'journ\u00e9es':'journ\u00e9e'):''};   // MOTS-6
  };
  var w1=sem[1]||{items:[],lundi:add(lu,7)}, r1=resumeS(w1.items||[], w1.lundi, add(w1.lundi,4));
  var d3=add(lu,14), f4=add(lu,25), r34=resumeS(L34, d3, f4);
  var semaine={jours:jours, tot:jSem?nb(jSem)+' '+(jSem>1?'jours':'jour'):'Aucune journ\u00e9e', totTxt:jSem?'de l\u2019\u00e9quipe en cave cette semaine, d\u2019apr\u00e8s le Planning. Ils ne comptent pas pour la vigne\u00a0: la fin pr\u00e9vue des travaux en tient compte.':'de cave au planning cette semaine.',
    manque:manque, manqueC:manqueC, totC:jSem?nb(jSem)+'\u00a0'+(jSem>1?'jours':'jour')+' de cave':'',
    suite:[['Semaine prochaine', dC(w1.lundi)+' \u2013 '+dC(add(w1.lundi,4)), r1.txt, r1.plan, r1.vide, r1.court, r1.jours], ['Dans 2 \u00e0 4 semaines', dC(d3)+' \u2013 '+dC(f4), r34.txt, r34.plan, r34.vide, r34.court, r34.jours]], vide:!jSem&&!lourds.length};
  // — le millésime : la chaîne de la Cave —
  var ch=null; try{ ch=(typeof window._mlChaine==='function')?window._mlChaine(Y.mil):null; }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilCk2Cave#chaine'); }
  var mil=null;
  if(ch){
    var kgHl=ch.kgHl||135, hlVendu=ch.kgVendu?Math.round(ch.kgVendu/kgHl*10)/10:0, hlBtl=ch.btl?Math.round(ch.btl*0.0075*10)/10:0, rdt=null;
    try{ rdt=(typeof window._mlRdtMoyen==='function')?window._mlRdtMoyen(ch):null; }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilCk2Cave#rdt'); }
    var t=Math.round((ch.kg||0)/100)/10, aussi=[];
    try{ ((typeof window._mlMillesimes==='function')?window._mlMillesimes():[]).forEach(function(mm){ if(String(mm)===String(Y.mil)) return; var c2=window._mlChaine(mm);
      if(c2&&c2.hlFut>0) aussi.push([String(mm), nb(c2.hlFut)+'\u00a0hL au chai \u00b7 '+pl(c2.futs||0,'f\u00fbt')]); else if(c2&&c2.btl>0) aussi.push([String(mm), Number(c2.btl).toLocaleString('fr-FR')+' bouteilles']); }); }
    catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilCk2Cave#aussi'); }
    mil={titre:'Le mill\u00e9sime '+Y.mil, cadre:'De la vigne \u00e0 la bouteille', vide:!(ch.kg>0||ch.hlFut>0||ch.btl>0),
      tete:'<b>'+nb(t)+'\u00a0t</b> rentr\u00e9es'+(ch.parcelles?' de '+pl(ch.parcelles,'parcelle'):'')+', soit environ '+Math.round((ch.kg||0)/kgHl)+'\u00a0hL \u00e0 '+kgHl+'\u00a0kg/hL',
      barre:[['vendu',hlVendu],['cuve',ch.hlCuve||0],['chai',ch.hlFut||0],['btl',hlBtl]],
      etapes:[['vendu','Vendu en raisin',ch.kgVendu?nb(Math.round(ch.kgVendu/100)/10)+'\u00a0t':'0\u00a0t',hlVendu?'environ '+nb(Math.round(hlVendu))+'\u00a0hL':''],
        ['cuve','En cuve',(ch.hlCuve?'environ ':'')+nb(ch.hlCuve||0)+'\u00a0hL',ch.hlCuve?pl((ch.cuves||[]).filter(function(x){ return x&&x.statut!=='termine'; }).length,'cuve')+', d\u2019apr\u00e8s les caisses':'tout est d\u00e9cuv\u00e9'],
        ['chai','Au chai',nb(ch.hlFut||0)+'\u00a0hL',ch.futs?pl(ch.futs,'f\u00fbt'):''],
        ['btl','En bouteille',ch.btl?Number(ch.btl).toLocaleString('fr-FR'):'\u00e0 venir',ch.btl?'bouteilles':'',ch.btl?0:1]],
      rdt:(rdt&&rdt.hlHa)?'Rendement du domaine\u00a0: <b>'+nb(Math.round(rdt.hlHa))+'\u00a0hL/ha</b>'+(rdt.ha?', sur '+nb(rdt.ha)+'\u00a0ha r\u00e9colt\u00e9s pour la cave':'')+'.':'Rendement du domaine\u00a0: il se lira au d\u00e9cuvage.',
      aussi:aussi, note:'Les kilos sont convertis \u00e0 '+kgHl+'\u00a0kg/hL, la r\u00e8gle du Cuvier. Le volume au chai est mesur\u00e9.',
      // MOTS-6 : le tonnage en grand, une ligne de légende par étape (en hL, comme la barre), le rendement en chiffre
      t:nb(t)+'\u00a0t', sousT:'environ '+Math.round((ch.kg||0)/kgHl)+'\u00a0hL'+(ch.parcelles?' \u00b7 '+pl(ch.parcelles,'parcelle'):''),
      leg:[['vendu','raisin vendu',nb(Math.round(hlVendu))+'\u00a0hL',ch.kgVendu?nb(Math.round(ch.kgVendu/100)/10)+'\u00a0t':''],
        ['cuve','en cuve',nb(ch.hlCuve||0)+'\u00a0hL',ch.hlCuve?pl((ch.cuves||[]).filter(function(x){ return x&&x.statut!=='termine'; }).length,'cuve')+', d\u2019apr\u00e8s les caisses':'tout est d\u00e9cuv\u00e9'],
        ['chai','au chai',nb(ch.hlFut||0)+'\u00a0hL',ch.futs?pl(ch.futs,'f\u00fbt'):''],
        ['btl','en bouteille',ch.btl?Number(ch.btl).toLocaleString('fr-FR'):'\u00e0 venir',ch.btl?'bouteilles, soit '+nb(hlBtl)+'\u00a0hL':'rien n\u2019est encore tir\u00e9',ch.btl?0:1]],
      rdtV:(rdt&&rdt.hlHa)?nb(Math.round(rdt.hlHa))+'\u00a0hL/ha':'', rdtS:(rdt&&rdt.hlHa&&rdt.ha)?'Le rendement se compte sur les '+nb(rdt.ha)+'\u00a0ha r\u00e9colt\u00e9s pour la cave.':'Le rendement du domaine se lira au d\u00e9cuvage.'};
  }
  // — En direct : les derniers gestes de la cave —
  var rel=function(x){ var j=ecart(x,auj); return j<=0?'aujourd\u2019hui':(j===1?'hier':(j<7?JC[dI(x).getDay()]+'\u00a0'+dI(x).getDate():dC(x))); };
  var moi=gensDu(auj).map(function(p){ return [p[0].charAt(0).toUpperCase(), p[0]+' est en cave '+(p[1]==='j'?'aujourd\u2019hui':(p[1]==='m'?'ce matin':'cet apr\u00e8s-midi')), '', 'en cave']; });
  // MOTS-6 : le geste et son contenant (« Relevé · Cuve 3 », sans la matière ni la contenance), la mesure dessous, le moment en court.
  var qCourt=function(q){ return String(q||'').replace(/\s+[\u2014-]\s+[^\u2192]*?(?=\s+\u2192|$)/,''); };
  var fil={enCe:moi, items:(Y.recents||[]).slice(0,12).map(function(r){ return [r.ic||'journal', r.t+(r.q?' \u00b7 '+qCourt(r.q):''), String(r.s||'').replace(/^(\d+) \u00e0 /,'$1 \u00b7 '), rel(r.d).replace(/^aujourd\u2019hui$/,'auj.')]; })};
  // — À savoir, en cave —
  var sv=[], dgAll=[];
  var enElev={}; Y.cuvees.forEach(function(c){ enElev[String(c.id)]=1; });   // les cuvées en élevage selon la Cave (une mise mal datée n'y est pas)
  try{ dgAll=(typeof window._dgnSynthese==='function')?window._dgnSynthese().filter(function(x){ return x&&!x.mise&&enElev[String(x.id)]; }):[]; }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilCk2Cave#diag'); }
  var nomCv={}; Y.cuvees.forEach(function(c){ nomCv[String(c.id)]=c.nom; });
  dg.forEach(function(d,k){ sv.push({c:'alerte', fort:1, alerte:1, k:k?'':'Signes forts', ic:'microscope', t:d.nom+'\u00a0: '+String(d.txt||'').replace(/^./,function(x){ return x.toLowerCase(); }), q:'Diagnostic',
    s:'Le Diagnostic du Chai rel\u00e8ve des indices qui vont ensemble. Un statut d\u00e9crit des indices, pas une certitude.', a:'Ouvrir le diagnostic', ac:'Diagnostic', go:'diag'}); });
  s0.forEach(function(i){ if(i&&(i.kind==='alerte'||i.kind==='malo')) sv.push({c:'alerte', fort:1, alerte:1, k:sv.length?'':'Alerte', ic:'alerte', t:i.titre+'\u00a0: '+(i.note||'\u00e0 contr\u00f4ler'), q:'Aujourd\u2019hui', s:i.detail||'', a:i.kind==='malo'?'Ouvrir la cuv\u00e9e':'Ouvrir le Cuvier', ac:i.kind==='malo'?'Cuv\u00e9e':'Cuvier', go:i.kind==='malo'?'cuvee:'+i.ref:'cuve:'+i.ref}); });
  s0.forEach(function(i){ if(i&&i.kind==='ouillage'&&i.urgence==='due'){ var cv=Y.cuvees.filter(function(c){ return String(c.id)===String(i.ref); })[0], o=cv&&cv.ouillage, rt=(o&&/^\+(\d+)/.test(o.d||''))?parseInt(o.d.slice(1),10):0;
    sv.push({c:'faire', fort:1, k:sv.length?'':'\u00c0 anticiper', ic:'goutte', t:i.titre+' \u00e0 ouiller', q:rt?'En retard de '+rt+'\u00a0j':'Aujourd\u2019hui', s:String(i.detail||'').replace('~','environ ')+(o&&o.last?'. Dernier ouillage le '+point(dC(o.last)):''), a:'Ouvrir la cuv\u00e9e', ac:'Cuv\u00e9e', go:'cuvee:'+i.ref}); } });
  var aSout=s0.filter(function(i){ return i&&i.kind==='soutirage'; });
  if(aSout.length) sv.push({c:'faire', fort:1, k:sv.length?'':'\u00c0 anticiper', ic:'barrique', t:(aSout.length>1?aSout.length+' cuv\u00e9es ont fini leur malo':'1 cuv\u00e9e a fini sa malo'), q:'\u00c0 soutirer',
    s:aSout.map(function(i){ return i.titre; }).join(' et ')+'.'+(manque&&/soutirage/.test(manque)?' Aucune journ\u00e9e de cave n\u2019est pr\u00e9vue au planning pour '+(aSout.length>1?'les':'la')+' soutirer.':''), a:'Pr\u00e9voir au planning', ac:'Pr\u00e9voir', go:'planning'});
  sem.slice(0,1).forEach(function(w){ (w.items||[]).forEach(function(i){ if(i&&i.kind==='fa') sv.push({c:'cours', ic:'sablier', t:'Fin de fermentation, '+String(i.titre||'').split(/\s+[\u2014-]\s+/)[0], q:jC(i.date),
    s:'Estim\u00e9e '+String(i.detail||'').replace(/^fin de fermentation estim\u00e9e\s*\u00b7\s*/,'').replace('\u00b1 ','\u00e0 ').replace(/ j$/,'\u00a0jour pr\u00e8s')+(i.note?'\u00a0: '+i.note:'')+'. Le d\u00e9cuvage suivra.'}); }); });
  if(!dg.length){
    var att=dgAll.filter(function(x){ return x.g==='att'; }), sansA=dgAll.filter(function(x){ return !x.nAna; }).length, der=null;
    // la dernière analyse, seulement si le Diagnostic en lit une chiffrée (sinon « aucune analyse » et « la dernière le … » se contrediraient)
    if(sansA<dgAll.length) try{ ((typeof window._laboLignes==='function')?window._laboLignes():[]).forEach(function(l){ var x=String((l&&l.date)||'').slice(0,10); if(x&&x<=auj&&(!der||x>der)) der=x; }); }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilCk2Cave#labo'); }
    if(att.length) sv.push({c:'faire', ic:'microscope', t:(att.length>1?att.length+' cuv\u00e9es \u00e0 surveiller':(nomCv[att[0].id]||att[0].nom)+'\u00a0: '+String(att[0].txt||'').toLowerCase()), q:'Diagnostic', s:'Des indices au Diagnostic du Chai, sans aller jusqu\u2019aux signes forts.', a:'Ouvrir le diagnostic', ac:'Diagnostic', go:'diag'});
    else if(dgAll.length) sv.push({c:'ok', ic:'microscope', t:'Diagnostic du Chai\u00a0: aucun signe', q:pl(dgAll.length,'cuv\u00e9e'),
      s:(sansA?pl(sansA,'cuv\u00e9e n\u2019a','cuv\u00e9es n\u2019ont')+' encore aucune analyse chiffr\u00e9e au labo\u00a0: une partie des risques n\u2019est pas \u00e9valuable.':'Toutes ont une analyse au labo.')+(der?' Derni\u00e8re analyse le '+point(dC(der)):''), a:'Ouvrir le diagnostic', ac:'Diagnostic', go:'diag'});
  }
  // — le lien avec Terrain : la phrase du haut, le point de la bascule, la ligne d'« À savoir » —
  var presse=v.cls!=='ok', lien=!presse?'':(duDiag?'un signe fort au Chai':String(v.t||'').replace(/^./,function(x){ return x.toLowerCase(); })+' en cave');
  if(presse&&_pilShow('auj_cave_sv')&&Array.isArray(V.savoir)) V.savoir.push({cat:'cave', prio:2, titre:'Cave\u00a0: '+(duDiag?'signe fort au Chai':v.t), quand:'Aujourd\u2019hui',
    sous:String(v.s||'').split(/\.\s/)[0].replace(/\.$/,'')+'.', action:'Voir la cave', fn:'cave'});
  return {pt:presse?(alerte?'alerte':'attention'):'', lien:lien, lienAlerte:alerte, verdict:verdict,
    cuvier:{resume:cuves.length?(pl(cuves.length,'cuve')+(hlCu?' \u00b7 environ '+nb(Math.round(hlCu))+'\u00a0hL en cuve':'')):'Cuverie vide', cuves:cuves, vide:!cuves.length, cap:capCu, court:cuves.length?(pl(cuves.length,'cuve')+(hlCu?' \u00b7 '+nb(Math.round(hlCu))+'\u00a0hL':'')):'vide'},
    chai:{resume:pl(cuvees.length,'cuv\u00e9e')+' \u00b7 '+pl(tf,'f\u00fbt')+(th?' \u00b7 environ '+nb(Math.round(th))+'\u00a0hL':''), cuvees:cuvees, court:pl(cuvees.length,'cuv\u00e9e')+' \u00b7 '+pl(tf,'f\u00fbt')+(th?' \u00b7 '+nb(Math.round(th))+'\u00a0hL':'')},
    btl:{resume:nBtl?Number(nBtl).toLocaleString('fr-FR')+' bouteilles':'', l:Y.btl.map(function(b){ return {nom:b.nom, n:Number(b.n).toLocaleString('fr-FR')+' bouteilles', s:b.date?'mises le '+dC(b.date):'', go:'elevage'}; })},
    semaine:semaine, mil:mil, fil:fil, savoir:sv};
}
// La porte vers la Cave : chaque ligne de la vue Cave ouvre l'écran où se fait le geste — jamais le geste lui-même.
window._pilCaveAller=function(go){
  var g=String(go||'auj'), p=g.indexOf(':'), k=p>0?g.slice(0,p):g, id=p>0?g.slice(p+1):'';
  try{
    if(k==='planning'){ if(typeof goTo==='function') goTo('planning'); return; }
    if(k==='revient'){ _PEC_SUB='rev'; if(typeof window._pilSetTab==='function') window._pilSetTab('eco'); return; }
    if(k==='cuvee'||k==='diag'){ window._pilOuvrirCave('elevage');
      setTimeout(function(){ try{ if(k==='diag'){ if(typeof window.switchCaveOng==='function') window.switchCaveOng('diag'); } else if(typeof window.openCuveeDetail==='function') window.openCuveeDetail(id); }
        catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilCaveAller#fiche'); } },80); return; }
    window._pilOuvrirCave(k==='cuve'?'vendange':(k==='auj'?'aujourdhui':k));
  }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilCaveAller'); }
};
function _pilCk2Eco(d, V){
  var E=null; try{ E=_pecData(); }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilCk2Eco'); }
  if(!E||!E.configured) return null;
  var T=E.tot||{}, num=function(x){ x=Number(x); return isFinite(x)?x:0; };
  var tx=function(h){ return String(h==null?'':h).replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim(); };
  var budget=num(E.budget), dep=num(E.engage);
  // ★★★ AUJ-7 (§309) — L'ATTERRISSAGE EST LA FIN PROJETÉE DU MOTEUR (celle de l'onglet Économie) : ce qui est dépensé, plus le
  //   travail qui reste au barème, corrigé de la cadence mesurée quand elle s'applique. REF-2 additionnait le dépensé et le
  //   « reste à engager » (budget − dépensé) : tant qu'on était sous le budget, l'atterrissage VALAIT le budget — « Dans le
  //   budget », « 0 € » et « −0 € » partout, par construction. Nico (10/10) : « ça ne veut rien dire ».
  var cadAppl=!!(E.cad&&E.cad.applic), k=cadAppl?(1+num(E.cad.ecart)/100):1;
  var att=num(E.projFin);
  // La main-d'œuvre : ce qui a été PAYÉ (heures du planning dans les rangs, ENG-2), hors travaux à l'heure — plus le barème du
  //   fait (REF-2 montrait le barème du fait : « dépensé » et « fait » égaux par construction). Son atterrissage : le payé, plus
  //   le travail qui reste, à la cadence mesurée.
  var Pk={}; (E.postes||[]).forEach(function(p){ if(p&&p.k) Pk[p.k]=p; });
  var moDep=num(Pk.mo?Pk.mo.fait:T.moF), moBudget=num(T.moB), moAtt=moDep+num(T.moR)*k;
  var tv=E.tv||null, moH=tv?Math.max(0, num(tv.hVigne)-num(E.hbH)):num(T.fH);
  // Les autres postes : une RÉFÉRENCE seulement là où elle existe. Tracteur, GNR, phyto : extrapolés à l'avancement (« proj »),
  //   ou rien encore (« reel », sous 15 % du travail fait) ; prestations et travaux à l'heure : leur coût (« cout »). Un poste
  //   sans dépense ni référence ne s'affiche pas. Leur atterrissage est leur prévu (la cadence ne touche que la main-d'œuvre) :
  //   la somme des lignes tombe sur la fin projetée, l'écart de la campagne sur celui de la main-d'œuvre.
  var postes=(E.postes||[]).filter(function(p){ return p&&p.k!=='mo'; }).map(function(p){
    var f=num(p.fait), b=num(p.budget), ref=(p.k==='pre'||p.k==='hb')?'cout':((p.proj&&b>f+0.5)?'proj':'reel');
    return { id:p.k, nom:p.lab, note:tx(p.det), budget:b, dep:f, ref:ref, att:Math.max(f,b) };   // la cadence ne touche que la main-d'œuvre
  }).filter(function(p){ return p.dep>0.5 || p.budget>0.5; });
  // Par appellation : la main-d'œuvre ENGAGÉE à ce jour (paires parcelle × tâche du moteur), à l'hectare en production.
  var parApp={}, haApp={};
  (window.PARCELLES||[]).forEach(function(p){ if(!p||/arrach/i.test(String(p.statut||''))) return; var a=p.appellation||'Sans appellation'; haApp[a]=(haApp[a]||0)+(Number(p.surface)||0); });
  var appDe={}; (window.PARCELLES||[]).forEach(function(p){ if(p&&!/arrach/i.test(String(p.statut||''))) appDe[p.nom]=p.appellation||'Sans appellation'; });   // les parcelles EN PRODUCTION, comme les hectares
  (E.pairs||[]).forEach(function(x){ var a=appDe[x.parc]; if(a) parApp[a]=(parApp[a]||0)+(Number(x.eur)||0); });
  var coutHaApp={}; Object.keys(haApp).forEach(function(a){ coutHaApp[a]=haApp[a]>0?Math.round((parApp[a]||0)/haApp[a]):0; });
  // ★★ ECART-1 (§460) — L'ÉCART AU BARÈME SE LIT EN HEURES, ET LA TUILE EST LE TOTAL DE LA CARTE. Nico (25/10, capture) : la tuile
  //   « Écart au barème » à 0,0 %, juste à côté de la Réparation à +620 % et du Dégraffage à +13 %. Trois défauts sous un même nom :
  //   · la tuile lisait l'écart de CADENCE (toute la présence du planning face à tout le barème fait), qui ne se calcule qu'à 40 %
  //     du travail validé (_PEC_CAD_AVC) : en dessous, 0 envoyé, et l'écran l'écrivait « 0,0 % » comme une mesure ;
  //   · la carte annonçait « heures réelles face au barème » et calculait en EUROS (réalisé sur fait, RÉAL-1), sous des heures de
  //     barème venues d'un troisième calcul (calcHeures) : « 322 h de barème, 374 h réelles » (+16 %) à côté de « +13,1 % ».
  //   MAINTENANT : par tâche au barème, les heures versées par le temps réel (TV-1 ; cave, tracteur retirés) face au barème des
  //   MÊMES validations (t.reB) — la carte « Temps réel contre barème » de l'onglet Économie, au chiffre près. Une ligne seulement
  //   quand les deux côtés existent : sans heure versée, pas de « −100 % » ; un travail à l'heure n'a pas de barème en face. La
  //   tuile = la somme des heures sur la somme des barèmes de ces lignes ; rien à comparer → null, un tiret à l'écran.
  //   La cadence garde sa place : la projection de l'atterrissage (E.cad, inchangé — consigne du 23/09).
  var ecTache={}, hReelTache={}, hBarTache={}, hReel=0, sH=0, sB=0;
  (E.tasks||[]).forEach(function(t){
    if(!t||!t.nom) return;
    var h=num(t.reH), b=num(t.reB);
    if(h>0){ hReelTache[t.nom]=Math.round(h*10)/10; hReel+=h; }
    if(h>0 && b>0 && !t.reHb){ ecTache[t.nom]=(h-b)/b; hBarTache[t.nom]=Math.round(b*10)/10; sH+=h; sB+=b; }
  });
  var ecartMoy=sB>0?(sH-sB)/sB:null;
  var inac=null;
  try{ if(typeof _rfPair==='function'){ var P2=_rfPair(d); if(P2&&P2.dec&&!P2.fini&&!P2.dec.noRate){ var r2=_rfSim(P2.dec,_rfProf(P2.dec,null)); if(r2) inac={ h:Math.round(r2.induit||0), eur:Math.round((r2.induit||0)*(P2.dec.rate||0)), horsDelai:r2.horsDelai||0 }; } } }
  catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilCk2Eco#inaction'); }
  // ★★ AUJ-7 — LE GRAPHE « DÉPENSÉ FACE AU FAIT », DATÉ PAR LE MOTEUR. Il lisait les photos du jour : la part de TOUT le budget
  //   (pas de la main-d'œuvre), quelques jours seulement, un point du jour égal au fait par construction, et une aire verte entre
  //   les deux. Désormais, du début de la période à aujourd'hui, deux courbes qui ne font que monter :
  //   · le dépensé : les heures payées dans les rangs, au jour où elles ont été faites, moins celles des travaux à l'heure, en %
  //     du budget main-d'œuvre — il finit sur le dépensé de « Par poste » ;
  //   · le fait : le barème des clôtures du journal, cumulé à leur date, ramené à l'avancement du jour — il finit sur « Travaux ».
  var serie=[], auj=_mvToday();
  if(tv && moBudget>0){
    var byD=tv.byD||{}, byH=tv.byDHb||{}, barD=tv.barD||{}, avcP=num(E.avc), totB=0;
    Object.keys(barD).forEach(function(x){ if(x<=auj) totB+=num(barD[x]); });
    var jours={}; [byD, barD].forEach(function(o){ Object.keys(o).forEach(function(x){ if(x>=String(tv.d0||'')&&x<=auj) jours[x]=1; }); });
    jours[auj]=1; if(tv.d0) jours[String(tv.d0)]=1;
    var cD=0, cB=0;
    Object.keys(jours).sort().forEach(function(x){
      cD+=Math.max(0, num(byD[x])-num(byH[x])); cB+=num(barD[x]);
      serie.push({ d:x, dep:Math.round(cD/moBudget*1000)/10, fait:totB>0?Math.round(avcP*cB/totB*10)/10:(x===auj?Math.round(avcP*10)/10:0) });
    });
    if(serie.length){ var z=serie[serie.length-1]; z.dep=Math.round(moDep/moBudget*1000)/10; z.fait=Math.round(avcP*10)/10; }   // le point du jour = les chiffres du jour, au dixième
  }
  return { taux:num(E.rate), moBudget:moBudget, moDep:moDep, moAtt:moAtt, moH:moH, cadAppl:cadAppl,
    budget:budget, dep:dep, att:att, ecartMoy:ecartMoy,
    postes:postes, coutHaApp:coutHaApp, ecTache:ecTache, hReelTache:hReelTache, hBarTache:hBarTache, hReel:Math.round(hReel), inaction:inac,
    serie:serie, sparkBud:serie.slice(-14).map(function(x){ return x.dep; }) };
}
window._pilCk2Eco=_pilCk2Eco;
// ★★ VIF-1 (§414) — AUJOURD'HUI SE MET À JOUR EN DIRECT. Quand les données changent (une validation de l'équipe, une priorité)
//   et qu'Aujourd'hui est à l'écran, on ne redessine plus la page : le modèle est recalculé par les MÊMES fonctions que
//   _pilTabAuj, et la maquette met à jour ce qui change (_ck2Maj → majTout : la date qui roule, les barres qui avancent,
//   le fil, l'onde sur les parcelles qui viennent d'être faites ou commencées). Rend vrai si la mise à jour a eu lieu ;
//   sinon l'appelant redessine comme avant.
window._pilRafraichirVif=function(){
  try{
    if(_PIL_TAB!=='auj'||!document.getElementById('ck-page')||typeof window._ck2Maj!=='function') return false;
    var d=_pilData(), m=_pilMargeCalc(d), V=_pilCk2Modele(d,m); V.eco=_pilCk2Eco(d,V);
    window._ck2Maj(V);
    _pilStickyH();
    return true;
  }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilRafraichirVif'); return false; }
};
// L'export comptable du cockpit est celui de l'onglet Économie (même tableau CSV, même moteur).
window._pilEcoExport=function(){ if(typeof _pecExport==='function') _pecExport('csv', _pecData()); };
function _pilTabAuj(d){
  var m=_pilMargeCalc(d);
  // PHOTO-1 (§219) : la photo du jour, une fois, par l'admin, sur la periode active.
  try{ _pilPhotoEcrire(d); }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilPhotoEcrire'); }
  // ★★★ PIL-RANGE-1 (§438) — LE COCKPIT D'ABORD, ET RIEN D'AUTRE N'EST CALCULÉ.
  //   Avant : les tuiles d'avant (marge, inaction, KPIs, décision du jour, alertes) se construisaient EN ENTIER
  //   à chaque affichage de l'écran d'arrivée, puis le `return` du cockpit v2 les jetait — trois générations
  //   calculées, une seule montrée (audit du 23/10). Le cockpit v2 passe en premier ; l'ancien ordre ne se
  //   construit QUE s'il manque (_pilTabAujAncien) : l'écran ne reste jamais blanc, et il ne calcule plus deux fois.
  //   ⚠️ Rien ne change à l'écran : même squelette, même modèle (_pilCk2Modele), même montage.
  // ★★ PIL-RANGE-1b (§441) : l'ancien ordre est RETIRÉ (il n'était plus affiché depuis REF-1, 07/10), avec le rendu de
  //   secours de cockpit.js (_ckAuj et ses aides) — la moitié de cockpit.js qui nourrit le cockpit v2 reste. Sa carte du
  //   tracteur (GNR-M §213, GNR-2 §256) est relogée dans Équipe & matériel › Matériel (_pilTabMat, puis MOTS-9 : _pilPanelTrx), choix de Nico (« A »).
  //   Si le cockpit v2 manque ou lève : un message, jamais un écran blanc (règle AUJ-1).
  if(typeof window._ck2Squelette==='function'&&typeof window._ck2Monter==='function'){
    try{ var _V=_pilCk2Modele(d,m); _V.eco=_pilCk2Eco(d,_V); setTimeout(function(){ try{ window._ck2Monter(_V); _pilStickyH(); }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilTabAuj#ck2m'); } },0);   // VIF-1 : la hauteur du fil de portée posée aussi sur Aujourd'hui
      return window._ck2Squelette(); }
    catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilTabAuj#ck2'); }
  }
  return '<div class="pil-empty">Le tableau de bord n\u2019a pas pu s\u2019afficher. Rechargez la page.</div>';
}

// ════════════════════════════════════════════════════════════════════════════
// ★★★ ANNEE-1 (§234, 04/10/2026) — L'ANNEE, UN CADRE A LA FOIS
// ────────────────────────────────────────────────────────────────────────────
// Nico (04/10, capture a l'appui) : l'onglet ne mettait en avant que le pic des
// vendanges — connu de tous, et passe en octobre —, affichait cinq chiffres pour
// le meme exercice (engage, cloture, « prevu » au bareme, heures de bareme, heures
// payees) et posait un exercice en EUROS a cote d'une annee vigne en HEURES DE
// BAREME — pas meme la meme annee : la case « annee vigne » comptait le cycle FINI
// le 6 septembre. Maquette (canevas) validee le 04/10 : « on go de cette facon ».
// LES REGLES :
//  · UN SEUL CADRE A LA FOIS, choisi en tete d'onglet : exercice comptable OU
//    annee vigne, et l'annee avec les fleches. Il vit dans _PIL_SCOPE (cadre,
//    recul) : pas de sixieme selecteur. L'onglet, les photos et le fil le lisent.
//  · L'ANNEE VIGNE = _mvCampagneBornes (mois d'ouverture de la campagne, roue
//    crantee d'Economie › Exercice) — la definition des Archives. Pas de troisieme
//    definition « du lendemain des vendanges » (Nico, 04/10 : « continuer »).
//  · LE BUDGET = _pexData sur les dates du cadre : le meme moteur, le meme calcul
//    dans les deux cadres, en euros — engage, reste prevu, total. Plus de « prevu
//    au bareme » face a la depense de tout le domaine : deux perimetres.
//  · LE RENFORT REGARDE DEVANT : avec l'equipe prevue au planning, combien de
//    personnes manqueront, et quand (Nico : « une photo d'aujourd'hui »). Le
//    combien-recruter se chiffre dans Decider › Le renfort : un BOUTON y mene.
//  · L'ECHELLE SUIT CE QUI VIENT : un mois ou une semaine passes qui la depassent
//    (la vendange) sont coupes net, leur valeur ecrite au-dessus.
// ════════════════════════════════════════════════════════════════════════════
var _PIL_ANB=null, _PIL_ANR=null;
var _PIL_AN_MOIS=['janvier','f\u00e9vrier','mars','avril','mai','juin','juillet','ao\u00fbt','septembre','octobre','novembre','d\u00e9cembre'];
function _pilAnAuj(){
  var a=(typeof window._mvAujIso==='function')?window._mvAujIso():'';
  if(a) return String(a).slice(0,10);
  var n=new Date(); return _pexIso(n.getFullYear(),n.getMonth(),n.getDate());
}
// « 14 decembre », « 1er aout 2026 » : le jour et le mois en toutes lettres.
function _pilAnDfrJM(iso){
  var p=String(iso||'').split('-'); if(p.length<3) return String(iso||'');
  var j=parseInt(p[2],10);
  return (j===1?'1er':String(j))+' '+(_PIL_AN_MOIS[parseInt(p[1],10)-1]||'');
}

// Le cadre consulte : { cadre, an, d0, d1, court, titre, enCours, clos, prevOk, recul, F }.
// null si utils.js ne sait pas borner l'exercice — l'onglet le dit, sans inventer.
function _pilAnCadre(){
  var cadre=(_PIL_SCOPE.cadre==='vig')?'vig':'exo', auj=_pilAnAuj();
  var okV=(typeof window._mvCampagneBornes==='function' && typeof window._mvCampagneDe==='function');
  var okE=(typeof window._mvExercice==='function' && typeof window._mvExerciceAn==='function');
  if(cadre==='vig' && !okV) cadre='exo';
  if(cadre==='exo' && !okE) return null;
  function borne(an){ return (cadre==='vig')?window._mvCampagneBornes(an):window._mvExerciceAn(an); }
  function anDe(iso){ return (cadre==='vig')?window._mvCampagneDe(iso):window._mvExercice(iso).an; }
  var F0=null, F=null;
  try{ F0=borne(anDe(auj)); }catch(e){ F0=null; if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'annee: bornes du cadre'}); }
  if(!F0 || !F0.d0) return null;
  var rec=parseInt(_PIL_SCOPE.recul,10); if(isNaN(rec)||rec>0) rec=0;
  // Le cadre le plus ancien qui contient une periode datee : en deca, rien a lire.
  var minAn=F0.an, deb='';
  var _pers=(typeof window._cmpVisibles==='function')?(window._cmpVisibles()||[]):(window.SAISONS||[]);
  _pers.forEach(function(p){ if(p && p.debut && (!deb || String(p.debut).slice(0,10)<deb)) deb=String(p.debut).slice(0,10); });
  if(deb){ try{ minAn=Math.min(F0.an, anDe(deb)); }catch(e2){ minAn=F0.an; } }
  if(F0.an+rec<minAn){ rec=minAn-F0.an; _PIL_SCOPE.recul=rec; }
  try{ F=borne(F0.an+rec); }catch(e3){ F=null; }
  if(!F || !F.d0) return null;
  var memes=false;
  try{ memes=(typeof window._mvCampagneMois==='function' && typeof window._mvExerciceMois==='function'
               && window._mvCampagneMois()===window._mvExerciceMois()); }catch(e4){ memes=false; }
  var court=F.court||String(F.an);
  return { cadre:cadre, an:F.an, recul:rec, d0:F.d0, d1:F.d1, court:court, F:F, auj:auj,
           enCours:(auj>=F.d0 && auj<=F.d1), clos:(auj>F.d1), prevOk:(F.an-1>=minAn), memes:memes,
           titre:((cadre==='vig')?'Ann\u00e9e vigne ':'Exercice comptable ')+court };
}

// ── LE BUDGET DU CADRE ───────────────────────────────────────────────────────
// Les mois, lus dans le moteur : DEPENSE = tout ce que _pexData engage (salaires,
// GNR, achats, reparations, futs, prestations — le graphe d'avant oubliait les
// deux derniers, et la somme des mois ne retombait pas sur le total) ; PREVU =
// salaires de la grille + amendements chiffres (byM.achP). Fonction PURE (harnais).
function _pilAnBudgetMois(X, auj){
  return ((X && X.mois) ? X.mois : []).map(function(mo){
    var b=(X.byM && X.byM[mo.k]) || {};
    var dep=(b.sal||0)+(b.gnr||0)+(b.ach||0)+(b.dep||0)+(b.fut||0)+(b.pre||0);
    var prev=(b.salP||0)+(b.achP||0);
    return { k:mo.k, lbl:mo.lbl, d0:mo.d0, d1:mo.d1, dep:dep, prev:prev,
             etat:(mo.d1<auj)?'p':((mo.d0>auj)?'f':'c') };
  });
}
function _pilAnBudgetData(){
  var C=_pilAnCadre(); if(!C) return null;
  var k=C.cadre+'|'+C.d0+'|'+C.d1+'|'+C.auj;
  if(_PIL_ANB && _PIL_ANB.k===k) return _PIL_ANB.v;
  var X=null;
  try{ X=_pexData(C.F,true); }
  catch(e){ X=null; if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'annee: budget illisible'}); }
  var v=null;
  if(X){
    // Reste prevu = ce que la grille et les amendements annoncent APRES la coupe.
    var reste=X.enCoursC ? (Number(X.totalP)||0) : 0, dep=Number(X.total)||0;
    v={ C:C, X:X, mois:_pilAnBudgetMois(X,C.auj), dep:dep, reste:reste, tot:dep+reste, enCours:!!X.enCoursC,
        coupe:X.coupe||C.auj,
        postes:(X.postes||[]).filter(function(p){ return p && (p.k==='sal' || (Number(p.eur)||0)>0 || (Number(p.eurP)||0)>0); }) };
  }
  _PIL_ANB={k:k, v:v};
  return v;
}

// ── LE RENFORT DU CADRE ──────────────────────────────────────────────────────
// Les fenetres de manque. Une journee compte si l'equipe prevue la laisse court
// d'au moins une DEMI-personne (seuil : en dessous, l'arrondi dirait « 0 »). Les
// jours qui se suivent font UNE fenetre ; une semaine sous le seuil la coupe. Le
// passe ne compte pas : on ne recrute pas pour une semaine finie. Deux periodes qui
// se recouvrent : le jour garde le manque le plus fort. Fonction PURE (harnais).
function _pilAnFenetres(sem, oAuj){
  var jours={}, lo=null, hi=null;
  (sem||[]).forEach(function(w){
    if(!w || w.o1<oAuj) return;
    for(var o=Math.max(w.o0,oAuj); o<=w.o1; o++){
      var j=jours[o];
      if(!j || w.manque>j.m) jours[o]={m:w.manque, per:w.per};
      if(lo==null || o<lo) lo=o;
      if(hi==null || o>hi) hi=o;
    }
  });
  var out=[], cur=null;
  if(lo==null) return out;
  for(var d=lo; d<=hi; d++){
    var q=jours[d];
    if(q && q.m>=0.5){
      if(!cur){ cur={o0:d, o1:d, max:q.m, min:q.m, oMax:d, per:{}}; out.push(cur); }
      cur.o1=d;
      if(q.m>cur.max){ cur.max=q.m; cur.oMax=d; }
      if(q.m<cur.min) cur.min=q.m;
      if(q.per!=null) cur.per[q.per]=1;
    } else cur=null;
  }
  return out;
}
// Les semaines du cadre : besoin (need) et ce que l'equipe peut faire
// (_pilDispoSem, la definition unique), bornees aux dates du cadre.
function _pilAnRenfortData(){
  var C=_pilAnCadre(); if(!C) return null;
  var ann=null;
  try{ ann=_pilAnnuelData(); }catch(e){ ann=null; if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'annee: semaines illisibles'}); }
  var k=C.cadre+'|'+C.d0+'|'+C.d1+'|'+C.auj+'|'+(ann?String(_PIL_ANNK):'-');
  if(_PIL_ANR && _PIL_ANR.k===k) return _PIL_ANR.v;
  var s=_pilAnnOrd(C.d0), e=_pilAnnOrd(C.d1), oA=_pilAnnOrd(C.auj), sem=[], couv=[];
  ((ann && ann.weeks) || []).forEach(function(x){
    if(!x || !(x.cap>0) || x.o1<s || x.o0>e) return;
    var need=Number(x.need), dispo=Number(_pilDispoSem(x));
    if(!isFinite(need) || need<0) need=0;
    if(!isFinite(dispo) || dispo<0) dispo=0;
    sem.push({ o0:Math.max(x.o0,s), o1:Math.min(x.o1,e), need:need, dispo:dispo,
               manque:Math.max(0,need-dispo), passe:(x.o1<oA), per:x.per });
  });
  sem.sort(function(a,b){ return a.o0-b.o0; });
  // Ce que les periodes couvrent : au-dela, ni besoin ni equipe — un trou, pas un zero.
  ((ann && ann.pers) || []).forEach(function(p){
    if(!p || !p.debut || !p.fin) return;
    var a=Math.max(_pilAnnOrd(p.debut),s), b=Math.min(_pilAnnOrd(p.fin),e);
    if(!isNaN(a) && !isNaN(b) && b>=a) couv.push([a,b]);
  });
  couv.sort(function(x,y){ return x[0]-y[0]; });
  var finCouv=null;
  couv.forEach(function(iv){ if(finCouv==null || iv[1]>finCouv) finCouv=iv[1]; });
  var fen=_pilAnFenetres(sem,oA).map(function(r){
    var noms=[];
    Object.keys(r.per).forEach(function(i){ var p=ann && ann.pers && ann.pers[i]; if(p && p.nom && noms.indexOf(p.nom)<0) noms.push(p.nom); });
    var nMax=Math.max(1,Math.round(r.max)), nMin=Math.max(1,Math.round(r.min));
    return { a:_pilOrdIso(r.o0), b:_pilOrdIso(r.o1), oMax:r.oMax, n:nMax, plat:(nMin===nMax), noms:noms,
             sem:Math.max(1,Math.round((r.o1-r.o0+1)/7)) };
  });
  var vend=false;
  ((ann && ann.pers) || []).forEach(function(p){
    ((p && p.cd && p.cd.taskWindows) || []).forEach(function(t){
      if(t && _friseNorm(t.nom).indexOf('vendang')>=0 && String(t.end)>=C.d0 && String(t.start)<=C.d1) vend=true;
    });
  });
  var v={ C:C, s:s, e:e, oAuj:oA, sem:sem, couv:couv, fen:fen, vend:vend, ok:(sem.length>0),
          finCouv:(finCouv!=null ? _pilOrdIso(finCouv) : null),
          trouFin:(finCouv!=null && finCouv<e && C.enCours) };
  _PIL_ANR={k:k, v:v};
  return v;
}

// ── LE BLOC DU CADRE (en tete d'onglet) ──────────────────────────────────────
// ⚠️ L'id `pil-an-cadres` RESTE : le constat « vendange a cheval » (_pilDiag,
//   cible interne `an_cadres`) y fait clignoter le bloc.
function _pilAnAvisHtml(){
  // ★ PIL-RANGE-2a (§442) : le choix du cadre, l'année et la frise des campagnes sont montés dans la barre
  //   « Vous regardez » (_pilCrumbHtml). L'année ne garde ici que ce qui la concerne : l'exercice qui ne se borne
  //   pas, l'année vigne aux mêmes dates que l'exercice, la vendange à cheval sur deux exercices.
  var C=_pilAnCadre();
  if(!C) return '<div id="pil-an-cadres" class="pil-anc">'
    +_pilEmptyGo('L\u2019exercice comptable ne se borne pas : fixez son mois d\u2019ouverture.','exercice','\u00c9conomie \u203a Exercice')+'</div>';
  var ann=null; try{ ann=_pilAnnuelData(); }catch(e){ ann=null; }
  var h='';
  if(C.memes){
    var mo=(typeof window._mvCampagneMois==='function')?_PIL_AN_MOIS[window._mvCampagneMois()]:'';
    h+='<div class="pil-anc-av">'+_mvIcon('info',16)+'<span>Votre ann\u00e9e vigne a les <b>m\u00eames dates</b> que votre exercice'
      +(mo?(' : les deux s\u2019ouvrent en '+mo):'')+'. Pour que la vendange cl\u00f4ture l\u2019ann\u00e9e vigne, choisissez le mois qui suit vos vendanges. '
      +'<button type="button" class="pil-diag-go ghost" data-diag="exercice">R\u00e9gler le mois de la campagne \u203a</button></span></div>';
  }
  if(C.cadre==='exo') h+=_pilAnCoupeHtml(C, ann);
  return h ? '<div id="pil-an-cadres" class="pil-anc">'+h+'</div>' : '';
}
// La seule chose utile a signaler sur un exercice : une borne qui TRAVERSE la
// vendange (la recolte se lit sur deux bilans). En jours, exactement (§34, lot 6).
// ann.align se mesure sur l'exercice de la periode active : ailleurs, on se tait.
function _pilAnCoupeHtml(C, ann){
  if(!ann || !ann.ex || !ann.align || !ann.align.coupe || !ann.vend || ann.ex.d0!==C.d0) return '';
  var J=_pilAnnSplitVend(ann);
  var admin=!!(typeof window.isAdmin==='function' && window.isAdmin());
  var bt=(admin && ann.align.moisIdeal!=null)
    ? (' <button type="button" class="pil-diag-go ghost" data-exm="'+ann.align.moisIdeal+'">D\u00e9caler au 1\u1D49\u02B3 '+_PIL_AN_MOIS[ann.align.moisIdeal]+' \u203a</button>') : '';
  return '<div class="pil-anc-av">'+_mvIcon('info',16)+'<span><b>Votre vendange est \u00e0 cheval sur deux exercices.</b> Sur ses '
    +J.total+' jours, '+J.dedans+' tombent dans cet exercice et '+J.dehors+' dans le suivant : son co\u00fbt se lit sur deux bilans. '
    +'Ce n\u2019est pas une erreur, c\u2019est votre calendrier comptable.'
    +(bt ? ('<br>Si votre comptable accepte de d\u00e9placer la cl\u00f4ture, la r\u00e9colte tiendrait dans un seul exercice :'+bt) : '')+'</span></div>';
}

// ── LA CARTE « LE BUDGET DE L'ANNEE » ────────────────────────────────────────
function _pilAnFig(t, s, v, cl){
  return '<div class="pil-anf-c '+cl+'"><div class="l">'+t+'</div><div class="v">'+v+'<span>\u00a0k\u20ac</span></div><div class="s">'+_pilEsc(s)+'</div></div>';
}
function _pilAnPostesHtml(B){
  var P=(B && B.postes) || []; if(!P.length) return '';
  function K(v){ return _pilNb(Math.round((Number(v)||0)/1000))+'\u00a0k\u20ac'; }
  var en=!!B.enCours, sD=0, sP=0;
  var h='<div class="pil-anp'+(en?'':' clos')+'" role="table" aria-label="Le budget par poste">'
    +'<div class="hd" role="row"><span role="columnheader">Poste</span><span role="columnheader">Sorti</span>'
    +(en?'<span role="columnheader">Reste pr\u00e9vu</span><span role="columnheader">Total</span>':'')+'</div>';
  P.forEach(function(p){
    var e=Number(p.eur)||0, pr=(p.eurP!=null) ? (Number(p.eurP)||0) : null;
    sD+=e; sP+=(pr||0);
    h+='<div role="row"><span role="cell">'+_pilEsc(p.lab||'')+'</span><span role="cell">'+K(e)+'</span>'
      +(en ? ('<span role="cell">'+(pr==null?'\u2014':K(pr))+'</span><span role="cell">'+K(e+(pr||0))+'</span>') : '')+'</div>';
  });
  h+='<div class="tt" role="row"><span role="cell">Total</span><span role="cell">'+K(sD)+'</span>'
    +(en ? ('<span role="cell">'+K(sP)+'</span><span role="cell">'+K(sD+sP)+'</span>') : '')+'</div>';
  return h+'</div>';
}
function _pilPanelAnBudget(avis){   // MOTS-1 (§582) : l'avis de réglage de l'année s'ouvre AVEC la tuile, plus en tête d'écran
  var B=null;
  try{ B=_pilAnBudgetData(); }catch(e){ B=null; if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'annee: carte budget'}); }
  var C=(B && B.C) || _pilAnCadre();
  // MOTS-1 (§582) : le titre dit le cadre (la barre « Vous regardez ») ; « salaires chargés, carburant… tout le domaine » est dans la fiche.
  var titre=(C&&C.cadre==='vig')?'L\u2019ann\u00e9e vigne':'L\u2019exercice', sub=C?C.court:'';   // « L'exercice » · « 2026–2027 » dessous : le titre long était coupé sur ordinateur
  if(!B || !C || !(B.tot>0)){
    return _pilTile('anbudget','#8A5A38',titre, _pilStat('\u2014',''), sub, null,
      (avis||'')+_pilEmptyGo('Rien ne se chiffre encore sur ce cadre : ni salaire au planning, ni plein, ni achat dat\u00e9. \u00c9conomie \u203a Exercice dit ce qui manque.','exercice','\u00c9conomie \u203a Exercice'),
      'pil.an.budget');
  }
  function K(v){ return _pilNb(Math.round((Number(v)||0)/1000)); }
  var stat=B.enCours
    ? _pilStat(K(B.dep)+'\u00a0k\u20ac',' sur '+K(B.tot)+'\u00a0k\u20ac')
    : _pilStat(K(B.dep)+'\u00a0k\u20ac',' sortis');
  var body;
  if(B.enCours){
    var pc=Math.max(0, Math.min(100, B.dep/B.tot*100));
    body='<div class="pil-anf">'
      +_pilAnFig('Sorti','au '+_pilDfr(B.coupe),K(B.dep),'m')
      +_pilAnFig('Reste pr\u00e9vu','d\u2019ici le '+_pilDfr(C.d1),K(B.reste),'p')
      +_pilAnFig('Total pr\u00e9vu','\u00e0 la fin '+(C.cadre==='vig'?'du cycle':'de l\u2019exercice'),K(B.tot),'t')
      +'</div><div class="pil-anbar" aria-hidden="true"><i style="width:'+pc.toFixed(1)+'%"></i></div>';
  } else {
    body='<div class="pil-anf">'+_pilAnFig('Sorti','du '+_pilDfr(C.d0)+' au '+_pilDfr(C.d1),K(B.dep),'m')+'</div>';
  }
  body+='<div class="pil-anh">Mois par mois</div><div style="width:100%;overflow-x:auto" id="pil-g-anb"></div>';
  window._mvGraphSuivre('#pil-g-anb', function(lg){ return _pilAnBudgetSvg(B,lg); }, {max:1400});
  body+=_pilAnPostesHtml(B);
  body+='<div class="pil-ann">'+(B.enCours
    ? 'Le reste pr\u00e9vu, c\u2019est ce que l\u2019appli conna\u00eet d\u00e9j\u00e0 : les salaires que le planning annonce pour les personnes sous contrat, et les amendements chiffr\u00e9s pas encore factur\u00e9s. Une embauche ou un achat pas encore saisi n\u2019y est pas ; le carburant compte au plein, il n\u2019a pas de pr\u00e9vu.'
    : 'Ce cadre est clos : tout est engag\u00e9, plus rien n\u2019est pr\u00e9vu.')+'</div>';
  body=(avis||'')+body+'<div class="pec-acts"><button class="pec-btn" data-pec="sub" data-v="exe"><span>'+_mvIcon('calendrier',16)+'</span> Ouvrir le d\u00e9tail</button></div>';
  return _pilTile('anbudget','#8A5A38',titre, stat, sub, null, body, 'pil.an.budget');
}
// Mois par mois. L'echelle suit les mois A VENIR (annee en cours) : un mois passe
// qui la depasse — la vendange — est coupe net, son montant ecrit au-dessus.
// Graduations par 5 : _pecNiceMax rend m×10^n, m dans un jeu que 5 divise rond.
function _pilAnBudgetSvg(B, w){
  if(!B || !B.mois || !B.mois.length) return window._mvGraphVide('Aucun mois dans ce cadre','Fixez le mois d\u2019ouverture de l\u2019exercice (\u00c9conomie \u203a Exercice).');
  var M=B.mois, enC=!!(B.C && B.C.enCours), ref=0, coupe=false;
  M.forEach(function(m){ if(!enC || m.etat!=='p') ref=Math.max(ref, m.dep+m.prev); });
  if(!(ref>0)) M.forEach(function(m){ ref=Math.max(ref, m.dep+m.prev); });
  if(!(ref>0)) return window._mvGraphVide('Rien de d\u00e9pens\u00e9 ni de pr\u00e9vu sur ce cadre','Le planning, les pleins et les achats dat\u00e9s alimentent ce graphe.');
  var top=_pecNiceMax(ref*1.08);
  var c0=window._mvGraphCadre(w,100), et=c0.etroit;
  var c=window._mvGraphCadre(w, et?212:252, { padL:et?44:58, padR:et?10:16, padT:30, padB:et?28:32, grad:(et?2:5) });
  var W=c.w, pL=c.padL, pR=c.padR, pT=c.padT, ih=c.ih, base=pT+ih;
  var slot=c.iw/M.length, bw=Math.max(5, Math.min(40, slot*0.62));
  var g='';
  for(var k=0; k<=c.grad; k++){
    var v=top*k/c.grad, y=base-(v/top)*ih;
    g+='<line x1="'+pL+'" y1="'+y.toFixed(1)+'" x2="'+(W-pR)+'" y2="'+y.toFixed(1)+'" stroke="'+c.col.grille+'" stroke-width="'+c.trait.grille+'"/>'
      +'<text x="'+(pL-7)+'" y="'+(y+4).toFixed(1)+'" text-anchor="end" font-size="'+(et?c.txt.mini:c.txt.axe)+'" fill="'+c.col.texte+'">'+_pilEsc(_pecAxeEur(v))+'</text>';
  }
  g+='<text x="'+(pL-7)+'" y="'+(pT-14)+'" text-anchor="end" font-size="'+c.txt.unite+'" fill="'+c.col.texte+'">\u20AC</text>';
  var pas=(et && M.length>8)?2:1;
  M.forEach(function(m, i){
    var x=pL+slot*i+(slot-bw)/2, cx=x+bw/2;
    var hd=Math.min(m.dep,top)/top*ih, hp=Math.min(m.prev, Math.max(0,top-m.dep))/top*ih;
    if(hd>0.2) g+='<rect x="'+x.toFixed(1)+'" y="'+(base-hd).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+hd.toFixed(1)+'" rx="'+_PIL_GB.rv+'" fill="'+c.col.mesure+'"/>';
    if(hp>0.2) g+='<rect x="'+x.toFixed(1)+'" y="'+(base-hd-hp).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+hp.toFixed(1)+'" rx="'+_PIL_GB.rv+'" fill="'+c.col.prevu+'" opacity="0.8"/>';
    if(m.dep+m.prev>top){
      coupe=true;
      g+='<path d="M'+(x-1).toFixed(1)+' '+(pT+12)+' l'+(bw+2).toFixed(1)+' -5 M'+(x-1).toFixed(1)+' '+(pT+17)+' l'+(bw+2).toFixed(1)+' -5" stroke="var(--bg-card)" stroke-width="2.4" fill="none"/>'
        +'<text x="'+cx.toFixed(1)+'" y="'+(pT-6)+'" text-anchor="middle" font-size="'+c.txt.mini+'" font-weight="600" fill="'+c.col.mesure+'">'+_pilEsc(_pecEurK(m.dep+m.prev))+'</text>';
    }
    if(i%pas===0) g+='<text x="'+cx.toFixed(1)+'" y="'+(c.h-10)+'" text-anchor="middle" font-size="'+(et?c.txt.mini:c.txt.axe)+'" fill="'+(m.etat==='c'?c.col.alerte:c.col.texte)+'"'
      +(m.etat==='c'?' font-weight="600"':'')+'>'+_pilEsc(m.lbl)+'</text>';
  });
  return window._mvGraphSvg(c, 'Le budget du cadre, mois par mois : d\u00e9pens\u00e9 et pr\u00e9vu.', g)
    +'<div class="pil-anb-leg"><span><em style="background:'+c.col.mesure+'"></em>sorti</span>'
    +(enC?('<span><em style="background:'+c.col.prevu+'"></em>pr\u00e9vu</span>'):'')
    +'<span><em style="background:transparent;border-top:2px solid '+c.col.alerte+';height:0;border-radius:0"></em>le mois en cours</span>'
    +(coupe?'<span>un mois coup\u00e9 : son montant est \u00e9crit au-dessus</span>':'')+'</div>';
}

// ── LA CARTE « LE RENFORT A PREVOIR » ────────────────────────────────────────
function _pilPanelAnRenfort(){
  var R=null;
  try{ R=_pilAnRenfortData(); }catch(e){ R=null; if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'annee: carte renfort'}); }
  var C=(R && R.C) || _pilAnCadre();
  if(!C) return '';
  if(!C.enCours){
    return _pilTile('anrenfort','#C9A84C','Le renfort \u00e0 pr\u00e9voir', _pilStat('\u2014',''),
      (C.cadre==='vig'?'ann\u00e9e close':'exercice clos')+' \u00b7 plus de renfort \u00e0 d\u00e9cider', null,
      '<div class="pil-empty">Ce cadre est termin\u00e9 : il n\u2019y a plus de renfort \u00e0 d\u00e9cider. L\u2019\u00e9quipe de l\u2019\u00e9poque reste dans les Archives.'
      +'<div class="pil-anr-go"><button type="button" class="pil-diag-go ghost" data-pgo="arc">Archives \u203a</button></div></div>', 'pil.an.renfort');
  }
  if(!R || !R.ok){
    return _pilTile('anrenfort','#C9A84C','Le renfort \u00e0 pr\u00e9voir', _pilStat('\u2014',''), 'aucune semaine dat\u00e9e dans ce cadre', null,
      _pilEmptyGo('Datez vos p\u00e9riodes : les besoins en personnes, semaine par semaine, en d\u00e9coulent.','saisons','R\u00e9glages \u203a Campagne'), 'pil.an.renfort');
  }
  var F=R.fen, stat, sub;   // MOTS-9 (§592) : « d'après le barème et le planning des personnes sous contrat » — dans le « i »
  // ★ MOTS-9 (§592) : la ligne d'écran dit « La campagne » ; ce renfort compte L'ANNÉE (le cadre d'Économie › Le détail) — il l'écrit.
  var _cadL=(C&&C.court)?((C.cadre==='vig'?'ann\u00e9e vigne ':'exercice ')+C.court+' \u00b7 '):'';
  if(F.length){
    var f0=F[0];
    // ★ MOTS-9 (§592) : « +2 pers. » et la pastille orange de Travaux ; dès quand, puis jusqu'à quand, sous le chiffre ; la source dans le « i ».
    stat=_pilStat('+'+f0.n, ' pers.')+_pilPhPl('\u00e0 pr\u00e9voir','or');
    sub=_cadL+(f0.a<=C.auj?'d\u00e8s cette semaine':('d\u00e8s le '+_pilAnDfrJM(f0.a)))+(F[1] ? (' \u00b7 puis '+(F[1].plat?'':'jusqu\u2019\u00e0 ')+F[1].n+' en '+_PIL_AN_MOIS[_pilOrdD(F[1].oMax).getUTCMonth()]) : (' \u00b7 jusqu\u2019au '+_pilDfr(f0.b)));
  } else {
    stat=_pilStat('0','')+_pilPhPl('l\u2019\u00e9quipe suffit','ok');
    sub=_cadL+(R.finCouv?('jusqu\u2019au '+_pilDfr(R.finCouv)):'');
  }
  var body='';
  if(F.length){
    body+='<div class="pil-anr">';
    F.forEach(function(f){
      body+='<div class="pil-anr-l"><i></i><b>'+_pilEsc(_pilDfr(f.a))+' \u2192 '+_pilEsc(_pilDfr(f.b))+'</b>'
        +'<span class="n">'+(f.plat?'':'jusqu\u2019\u00e0 ')+f.n+' personne'+(f.n>1?'s':'')+'</span>'
        +'<span class="s">'+_pilEsc(f.noms.join(', '))+(f.noms.length?' \u00b7 ':'')+f.sem+' semaine'+(f.sem>1?'s':'')+'</span></div>';
    });
    body+='</div>';
  }   // MOTS-9 (§592) : sans semaine courte, la pastille « l'équipe suffit » le dit — la phrase de 15 mots partait en double
  if(R.trouFin){
    body+='<div class="pil-anc-av">'+_mvIcon('info',16)+'<span>Rien n\u2019est dat\u00e9 apr\u00e8s le '+_pilEsc(_pilDfr(R.finCouv))
      +((C.cadre==='vig' && !R.vend)?' \u2014 les vendanges de ce cycle non plus':'')
      +' : ce qui suit n\u2019entre ni dans le renfort ni dans le budget. '
      +'<button type="button" class="pil-diag-go ghost" data-diag="saisons">R\u00e9glages \u203a Campagne \u203a</button></span></div>';
  }
  body+='<div class="pil-anh">Personnes n\u00e9cessaires, semaine par semaine</div><div style="width:100%;overflow-x:auto" id="pil-g-anr"></div>';
  window._mvGraphSuivre('#pil-g-anr', function(lg){ return _pilAnRenfortSvg(R,lg); }, {max:1800});
  body+='<div class="pil-anb-leg"><span><em style="background:var(--vert-med)"></em>couvert par l\u2019\u00e9quipe</span>'
    +'<span><em class="pil-anr-h"></em>renfort \u00e0 pr\u00e9voir</span>'
    +'<span><em style="background:transparent;border-top:2px solid var(--texte);height:0;border-radius:0"></em>ce que l\u2019\u00e9quipe peut faire, d\u2019apr\u00e8s le planning</span>'
    +'<span><em style="background:var(--gris)"></em>semaines pass\u00e9es</span></div>';
  body+='<div class="pil-tv-act">'+_pilTvBtn('renfort','Simuler un renfort')+'</div>';
  return _pilTile('anrenfort','#C9A84C','Renfort', stat, sub, null, body, 'pil.an.renfort');
}
// Semaine par semaine, sur tout le cadre. L'echelle suit les semaines A VENIR ;
// une semaine passee qui la depasse (la vendange) est coupee, son chiffre au-dessus.
// Vert = couvert par l'equipe · hachure rouge = renfort a trouver · trait = ce
// que l'equipe peut faire (_pilDispoSem) : le rouge commence PILE au-dessus du
// trait. L'ancien trait (head, un comptage de tetes) passait au-dessus du vert
// alors qu'il manquait du monde.
function _pilAnRenfortSvg(R, w){
  if(!R || !R.sem || !R.sem.length) return window._mvGraphVide('Aucune semaine dat\u00e9e dans ce cadre','Datez vos p\u00e9riodes (R\u00e9glages \u203a Campagne) : les besoins en personnes en d\u00e9coulent.');
  var s=R.s, e=R.e, L=Math.max(1,e-s+1), oA=R.oAuj;
  var c0=window._mvGraphCadre(w,100), et=c0.etroit;
  var c=window._mvGraphCadre(w, et?204:244, { padL:et?36:48, padR:et?10:16, padT:30, padB:et?28:32, grad:4 });
  var pL=c.padL, pT=c.padT, ih=c.ih, base=pT+ih;
  function X(o){ return pL+(o-s)/L*c.iw; }
  var fut=R.sem.filter(function(x){ return !x.passe; }), lst=fut.length?fut:R.sem, yMax=2;
  lst.forEach(function(x){ if(x.need>yMax) yMax=x.need; if(x.dispo>yMax) yMax=x.dispo; });
  var step=yMax>60?20:(yMax>30?10:(yMax>12?5:(yMax>5?2:1)));
  var yTop=Math.ceil((yMax*1.05)/step)*step; if(!(yTop>0)) yTop=step;
  function H(v){ return Math.min(Math.max(v,0),yTop)/yTop*ih; }
  var g='<defs><pattern id="pil-anr-hp" width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">'
    +'<rect width="5" height="5" fill="var(--rouge-pale)"/><line x1="0" y1="0" x2="0" y2="5" stroke="'+c.col.alerte+'" stroke-width="2.6"/></pattern></defs>';
  for(var v=0; v<=yTop+1e-9; v+=step){
    var y=base-H(v);
    g+='<line x1="'+pL+'" y1="'+y.toFixed(1)+'" x2="'+(c.w-c.padR)+'" y2="'+y.toFixed(1)+'" stroke="'+c.col.grille+'" stroke-width="'+c.trait.grille+'"/>'
      +'<text x="'+(pL-6)+'" y="'+(y+4).toFixed(1)+'" text-anchor="end" font-size="'+(et?c.txt.mini:c.txt.axe)+'" fill="'+c.col.texte+'">'+v+'</text>';
  }
  g+='<text x="'+(pL-6)+'" y="'+(pT-16)+'" text-anchor="end" font-size="'+c.txt.unite+'" fill="'+c.col.texte+'">pers.</text>';
  // Ce qu'aucune periode ne couvre : grise, jamais a zero.
  var cur=s;
  function trou(a,b){
    var xa=X(a), xb=X(b+1);
    if(xb-xa<1) return;
    g+='<rect x="'+xa.toFixed(1)+'" y="'+pT+'" width="'+(xb-xa).toFixed(1)+'" height="'+ih.toFixed(1)+'" fill="var(--gris-clair)" opacity="0.55"/>';
    if(xb-xa>78) g+='<text x="'+((xa+xb)/2).toFixed(1)+'" y="'+(pT+ih/2).toFixed(1)+'" text-anchor="middle" font-size="'+c.txt.mini+'" fill="'+c.col.texte+'">aucune p\u00e9riode</text>';
  }
  (R.couv||[]).forEach(function(iv){ if(iv[0]>cur) trou(cur, iv[0]-1); if(iv[1]+1>cur) cur=iv[1]+1; });
  if(cur<=e) trou(cur, e);
  R.sem.forEach(function(x){
    var x0=X(x.o0), x1=X(x.o1+1), bw=Math.max(1, x1-x0-1.2), xa=x0+0.6;
    if(x.passe){
      var hp=H(x.need);
      if(hp>0.2) g+='<rect x="'+xa.toFixed(1)+'" y="'+(base-hp).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+hp.toFixed(1)+'" rx="'+_PIL_GB.rv+'" fill="var(--gris)"/>';
      if(x.need>yTop) g+='<path d="M'+(xa-1).toFixed(1)+' '+(pT+10)+' l'+(bw+2).toFixed(1)+' -4" stroke="var(--bg-card)" stroke-width="2.2" fill="none"/>'
        +'<text x="'+(xa+bw/2).toFixed(1)+'" y="'+(pT-6)+'" text-anchor="middle" font-size="'+c.txt.mini+'" font-weight="600" fill="'+c.col.texte+'">'+_pilUn(x.need)+'</text>';
      return;
    }
    var hc=H(Math.min(x.need, x.dispo)), hr=H(x.need)-hc, yc=base-H(x.dispo);
    if(hc>0.2) g+='<rect x="'+xa.toFixed(1)+'" y="'+(base-hc).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+hc.toFixed(1)+'" rx="'+_PIL_GB.rv+'" fill="'+c.col.fait+'"/>';
    if(hr>0.2) g+='<rect x="'+xa.toFixed(1)+'" y="'+(base-hc-hr).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+hr.toFixed(1)+'" rx="'+_PIL_GB.rv+'" fill="url(#pil-anr-hp)" stroke="'+c.col.alerte+'" stroke-width="0.8"/>';
    g+='<line x1="'+(xa-0.6).toFixed(1)+'" y1="'+yc.toFixed(1)+'" x2="'+(xa+bw+0.6).toFixed(1)+'" y2="'+yc.toFixed(1)+'" stroke="var(--texte)" stroke-width="2"/>';
  });
  if(!isNaN(oA) && oA>=s && oA<=e){
    var xt=X(oA);
    g+='<line x1="'+xt.toFixed(1)+'" y1="'+(pT-4)+'" x2="'+xt.toFixed(1)+'" y2="'+base.toFixed(1)+'" stroke="'+c.col.alerte+'" stroke-width="1.5" stroke-dasharray="4 3"/>'
      +'<text x="'+(xt+4).toFixed(1)+'" y="'+(pT-16)+'" font-size="'+c.txt.mini+'" font-weight="600" fill="'+c.col.alerte+'">aujourd\u2019hui</text>';
  }
  var MN=['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];
  var d0=_pilOrdD(s), y0=d0.getUTCFullYear(), m0=d0.getUTCMonth(), k2=0;
  for(var i=0; i<14; i++){
    var mo=(m0+i)%12, an=y0+Math.floor((m0+i)/12);
    var o=_pilAnnOrd(an+'-'+(mo<9?'0':'')+(mo+1)+'-01');
    if(isNaN(o) || o>e) break;
    if(o<s) continue;
    g+='<line x1="'+X(o).toFixed(1)+'" y1="'+base.toFixed(1)+'" x2="'+X(o).toFixed(1)+'" y2="'+(base+4).toFixed(1)+'" stroke="'+c.col.grille+'" stroke-width="1"/>';
    if(!et || k2%2===0) g+='<text x="'+(X(o)+3).toFixed(1)+'" y="'+(c.h-10)+'" font-size="'+(et?c.txt.mini:c.txt.axe)+'" fill="'+c.col.texte+'">'+MN[mo]+'</text>';
    k2++;
  }
  return window._mvGraphSvg(c, 'Personnes n\u00e9cessaires par semaine sur le cadre, et ce que l\u2019\u00e9quipe pr\u00e9vue peut faire.', g);
}


// ── Onglet TRAVAUX (clé 'avc') ──
// ★★★ MOTS-8 (§590) — L'ONGLET RESTE DANS LE PILOTAGE, IL S'ALLÈGE SUR PLACE. Nico (17/11) : le Pilotage doit pouvoir se
//   visiter seul, sans ouvrir les autres modules — l'onglet garde toutes ses cartes. Trois règles, prises le même jour :
//   ① le Pilotage MONTRE et DÉCIDE, les modules FONT : chaque carte a son bouton « Ouvrir » vers le module où l'on agit ;
//   ② les MÊMES chiffres : rien n'est recalculé ici, tout est lu là où il l'était déjà (calcHeures, _pilMargeCalc, la frise) ;
//   ③ un RÉSUMÉ, pas une copie : la liste entière vit dans le module.
//   Dans chaque carte : un titre, un chiffre, une barre ou une couleur ; la méthode derrière le « i » ; le détail au toucher.
function _pilTabAvc(d,m){
  var H='';
  // ★ PIL-RANGE-3 (§445) : la jauge de la campagne n'est plus une carte à part ; elle ouvre « Avancement ».
  var charts='';
  if(_pilShow('avc_bar')) charts+='<div class="pil-panel pil-tv-av"><div class="pil-panel-h"><div class="pil-panel-t">Avancement'+_mvInfoBtn('pil.avc.avancement')+'</div>'
    +'<div class="pil-seg" id="pil-bar-seg" role="group" aria-label="Comparer"><button type="button" data-b="saison" class="on" aria-pressed="true">Cette campagne</button><button type="button" data-b="cmp" aria-pressed="false">N-1</button></div></div>'
    +'<div class="pil-gauge pil-gauge-in" id="pil-gauge"></div><div class="pil-bar" id="pil-bar"></div>'
    +'<div class="pil-tv-act">'+_pilTvBtn('parcelles','Ouvrir les parcelles')+'</div></div>';
  if(_pilShow('avc_pie')) charts+='<div class="pil-panel pil-tv-cg"><div class="pil-panel-h"><div class="pil-panel-t" id="pil-pie-title">La charge par t\u00e2che'+_mvInfoBtn('pil.avc.charge')+'</div>'
    +'<div class="pil-seg" id="pil-pie-seg" role="group" aria-label="Montrer"><button type="button" data-m="reste" class="on" aria-pressed="true">Reste</button><button type="button" data-m="fait" aria-pressed="false">Fait</button><button type="button" data-m="plan" aria-pressed="false">Pr\u00e9vu</button></div></div>'
    +'<div class="pil-pie-wrap"><div class="pil-donut" id="pil-donut"></div><div class="pil-pie-legend" id="pil-pie-legend"></div></div></div>';
  if(charts) H+='<div class="pil-charts">'+charts+'</div>';
  var panels='';
  // « Charge & ETP » vit dans « L'année » (une frise de douze mois) ; la répartition du temps, la frise prévu/fait, la courbe par
  // semaine et l'écart détaillent une campagne : ils sont ici (PIL-RANGE, 13/10).
  if(_pilShow('avc_temps')) panels+=_pilPanelTemps(d);
  if(_pilShow('avc_echeances')) panels+=_pilPanelEcheances(d,m);
  if(_pilShow('avc_carte')) panels+=_pilPanelCarte(d);
  if(panels) H+='<div class="pil-panels">'+panels+'</div>';
  return H ? '<div class="pil-tv">'+H+'</div>' : '<div class="pil-empty">Aucun indicateur affich\u00e9.</div>';
}
// La phrase du haut de l'onglet : le pourcentage fait de la campagne, et la fin prévue — la MÊME date qu'Aujourd'hui
//   (_pilMargeCalc, lu par le cockpit). Verte avant l'objectif, rouge après. Elle remplace le sous-titre
//   « Travaux — où en est-on, et quand aura-t-on fini » : la réponse à la place de la question.
function _pilJourC(dt){ var M=['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.']; return (dt.getDate()===1?'1er':dt.getDate())+'\u00a0'+M[dt.getMonth()]; }
function _pilTvPhrase(d,m){
  if(d.gaugeVide) return '<span class="pil-tv-ph"><b>Rien au bar\u00e8me</b> sur la campagne</span>';
  var h='<b>'+d.gaugePct+'\u00a0% fait</b>';
  // ★ PORTEE-1 (§591) : une campagne consultée qui est FINIE ne se projette pas — « fin prévue 14 déc. » pour une campagne close le
  //   23 oct. était une date sans objet (la pastille rend la consultation d'une campagne passée facile depuis le Pilotage).
  var _sa=null; try{ _sa=_pilSaison(); }catch(eS){ _sa=null; }
  if(_sa && _sa.fin && String(_sa.fin).slice(0,10)<_pilAnAuj()) return '<span class="pil-tv-ph">'+h+', <b>campagne termin\u00e9e le '+_pilDfr(String(_sa.fin).slice(0,10))+'</b></span>';
  if(d.gaugePct<100){
    if(m && m.proj instanceof Date){
      var cl=(m.marge==null)?'':(m.marge<0?' ko':(m.marge>0?' ok':''));
      h+=', fin pr\u00e9vue <b class="pil-tv-d'+cl+'">'+_pilJourC(m.proj)+'</b>';
    } else if(m && m.capa && m.capa.ok===false) h+=', <b class="pil-tv-d ko">l\u2019\u00e9quipe pr\u00e9vue ne suffit pas</b>';
  }
  return '<span class="pil-tv-ph">'+h+'</span>';
}
// « Ouvrir » : le module où l'on agit (règle ①). Un seul bouton par carte, sous elle.
function _pilTvBtn(cible,lab){ return '<button type="button" class="pil-tv-btn" data-tvgo="'+cible+'">'+_pilEsc(lab)+'</button>'; }
function _pilTvGo(cible){
  try{
    if(cible==='planning'){ if(window.goTo) window.goTo('planning'); return; }
    // La Vigne garde son dernier onglet : « Ouvrir les parcelles » ouvre la liste, « Ouvrir la carte » la carte (switchPTab, app.js).
    if(cible==='parcelles'||cible==='carte'){
      if(window.goTo) window.goTo('parcelles');
      var _vo=(cible==='carte')?'carte':'liste';
      setTimeout(function(){ try{ if(typeof window.switchPTab==='function') window.switchPTab(_vo); }catch(e2){ if(window._mvAvale) window._mvAvale(e2,'pilotage.js/_pilTvGo#'+_vo); } }, 240);
      return;
    }
    if(cible==='tracbar'){ window._pilGo('tracact'); return; }
    // ★ MOTS-9 (§592) : L'équipe & le matériel — Réglages › Équipe, Tracteur › Entretien, Décider › le renfort (les chemins de _pilGo).
    // ★ MOTS-10 (§594) : Décider › Qui fait quoi — la priorité du moment (l'éditeur de la Vigne, PRIO-1 §235).
    if(cible==='equipe'||cible==='entretien'||cible==='renfort'||cible==='priorite'){ window._pilGo(cible); return; }
    if(cible==='tracteur'){ if(window.goTo) window.goTo('tracteur'); return; }
  }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilTvGo'); }
}
// Le détail d'une ligne d'avancement, au toucher : la fenêtre prévue (celle de la frise), ce que dit le journal, l'écart au
//   départ. Rien quand la portée regarde une autre campagne que celle des pourcentages : ses dates ne seraient pas les siennes.
function _pilTvDatesFn(d){
  var cd=null; try{ cd=_pilVueEstConsultee()?_pilCdVue():null; }catch(e){ cd=null; }
  if(!cd) return null;
  var real={}; try{ real=_pilTaskReal(cd,d,true)||{}; }catch(e){ real={}; }
  var W={}; (cd.taskWindows||[]).forEach(function(w){ if(w&&w.nom) W[_friseNorm(w.nom)]=w; });
  function o(y){ return Math.round((Date.parse(y+'T00:00:00')-Date.parse('2026-01-01T00:00:00'))/86400000); }
  return function(t,late){
    var k=_friseNorm(t.nom), w=W[k], r=real[k]||{state:'none'}, out=[];
    if(w&&w.start&&w.end) out.push('pr\u00e9vu <b>'+_pilFmtD(w.start)+' \u2192 '+_pilFmtD(w.end)+'</b>');
    if(r.start && r.state!=='none'){
      var f=(r.state==='live')?('depuis le '+_pilFmtD(r.start)):('du '+_pilFmtD(r.start)+' au '+_pilFmtD(r.end));
      var ec='';
      if(w&&w.start){ var ds=o(r.start)-o(w.start); ec=(ds<-1)?(' \u00b7 d\u00e9part '+(-ds)+'\u00a0j plus t\u00f4t'):((ds>1)?(' \u00b7 d\u00e9part '+ds+'\u00a0j plus tard'):' \u00b7 d\u00e9part \u00e0 la date'); }
      out.push('fait <b>'+f+'</b>'+ec);
    } else if(!(t.pct>0)) out.push('fait <b>rien encore</b>');
    if(late) out.push('<b class="ko">sa fen\u00eatre est pass\u00e9e</b>');
    return out.join(' \u00b7 ');
  };
}

// ── Onglet PERSONNEL ──
function _pilPanelCapacite(d){
  // PORTEE-1 (§591) : le pic de la CAMPAGNE lue — celui de la tuile « Équipe au pic » de Travaux (le renfort de l'année est la carte d'en dessous).
  var PP=_pilPicPortee(_pilSaisonNom()), cd=_pilCdVue();
  var present=d.presentChamp!=null?d.presentChamp:0;
  // ⚠️ CE SECOND APPEL ETAIT MUET : ni ligne de cadre, ni pastille. Le client
  //   qui n'a pas encore date ses periodes tombait sur la seule carte de
  //   l'onglet incapable de dire ce qu'elle montre. Trouve par le harnais, qui
  //   exige les trois etages sur CHAQUE appel, pas seulement sur le plus frequent.
  if(!PP.ok && !cd){ return _pilTile('capacite','#C9A84C','\u00c9quipe au pic', _pilStat(present,' à la vigne'),   // MOTS-9 (§592) : le même nom dans tous les cas
    'présence du jour \u00b7 le pic ne peut pas être calculé', null,
    _pilEmptyGo('Sans dates de campagne, l\'équipe nécessaire la semaine du pic ne se calcule pas : il n\'y a aucune fenêtre sur laquelle chercher ce pic.','saisons','Réglages \u203A Campagne'), 'pil.capacite'); }
  // ★★★ ON NE SOUSTRAIT PLUS DEUX GRANDEURS QUI N'ONT NI LA MEME DATE NI LA
  //   MEME UNITE. AVANT : `manque = PP.pic - d.presentChamp`.
  //     · PP.pic  = le besoin de la SEMAINE DU PIC, quelque part dans l'exercice,
  //                 en equivalents-personnes, equipes collectives PONDEREES.
  //     · present = un COMPTAGE DE TETES d'AUJOURD'HUI, hors bureau, hors
  //                 absents, ou une equipe de 40 vendangeurs pese 1.
  //   Deux dates, deux unites, une soustraction — affichee en gros, en orange,
  //   avec le mot ETP colle aux deux. Mesure du 12/08 : « 46,3 ETP au pic » moins
  //   « 2 ETP presents » = « manque 44,3 ETP » sur un domaine de 4 personnes.
  //   Le manque se lit desormais SUR LA SEMAINE DU PIC, contre l'effectif prevu
  //   CETTE SEMAINE-LA (PP.manque, deja calcule par _pilPicPortee, source unique).
  //   La presence du jour reste affichee — sous son propre nom, sans unite ETP.
  // ★★★ LA TUILE QUI PROPOSE « renfort saisonnier » DOIT REGARDER DEVANT.
  //   Elle lisait le pic de la FENETRE, vendange d'aout comprise : le 6 septembre
  //   elle conseillait d'embaucher pour une semaine faite. On dimensionne
  //   desormais sur PP.av — le pic des semaines qui restent. Le pic de la
  //   fenetre, quand il est derriere, descend en fin de carte comme ce qu'il
  //   est : un fait d'histoire, pas un arbitrage.
  var A=PP.av||null, fini=(!A && !!PP.ok);
  var S=A||PP;
  // ★ `dispo`, pas `head` : voir _pilDispoSem. `corps` (headMax) s'affiche a
  //   cote, SOUS SON PROPRE NOM — personne ne travaille a 34,4 ; ce jour-la il y
  //   a 45 personnes dans les rangs, ou il n'y en a aucune.
  var req=S.pic||0, prevu=S.dispo||0, manque=fini?0:(S.manque||0);
  var cadre=_pilCadreLbl(PP), sem=S.picW?_pilSemLabO(S.picW.o0):'';
  // ★ MOTS-9 (§592) — LE CORPS : deux barres SUR LA MÊME ÉCHELLE. Avant, chacune était pleine (le disponible plafonné au besoin,
  //   le besoin toujours à 100 %) : on ne voyait pas l'écart. « soit N personnes dans les rangs », « Aujourd'hui… autre date »,
  //   « Moyenne… autre fenêtre », « Effectif suffisant… » : le « i » (pil.capacite) et la pastille du titre les disent.
  var mxC=Math.max(prevu,req,0.1);
  var barre=function(lib,v,c){ return '<div class="pil-eq-cap"><span>'+lib+'</span><span class="pil-tv-br"><i style="width:'+Math.min(100,v/mxC*100).toFixed(1)+'%;background:'+c+'"></i></span><b>'+_pilEtpFmt(v)+' pers.</b></div>'; };
  var body=barre('Disponible',prevu,'var(--vert-med)')+barre('N\u00e9cessaire',req,'var(--orange)')
    +(fini?('<div class="pil-li-s" style="margin-top:8px">Toutes les semaines de '+_pilEsc(cadre)+' sont derri\u00e8re : le chiffre est celui du pic <b>d\u00e9j\u00e0 pass\u00e9</b>.</div>')
      :(manque>0.1?('<div class="pil-li-s" style="margin-top:8px">Il manque environ <b style="color:var(--orange)">'+_pilEtpFmt(manque)+' personne'+(manque>1.05?'s':'')+'</b> cette semaine-l\u00e0.</div>'):''))
    +((PP.passe&&A&&PP.picW&&A.picW&&PP.picW.o0!==A.picW.o0)?('<div class="pil-li-s" style="margin-top:9px;color:var(--texte-doux)">Pic de '+_pilEsc(cadre)+' : <b>'+_pilEtpFmt(PP.pic||0)+'</b> pers., '+_pilEsc(_pilSemLabO(PP.picW.o0))+' \u2014 <b>déjà passé</b>.</div>'):'');
  // ★ La pastille quitte le corps pour l'EN-TETE : elle doit etre joignable
  //   sans deplier, comme le chiffre qu'elle explique. Et le cadre quitte le
  //   TITRE pour la ligne de cadre — un titre n'est pas l'endroit ou l'on ecrit
  //   sur quelle fenetre un chiffre a ete calcule.
  // ★ MOTS-9 (§592) : le nom, le chiffre et la pastille de la tuile « Équipe au pic » de Travaux (les mêmes : _pilPicPortee) ; la
  //   campagne est sur la ligne d'écran, la semaine du pic reste sous le chiffre.
  var sub=sem||(cadre?('pic sur '+cadre):'');
  var pl=fini?_pilPhPl('pic pass\u00e9',''):(manque>0.05?_pilPhPl('+'+_pilUn(manque)+' \u00e0 pr\u00e9voir','or'):_pilPhPl('l\u2019\u00e9quipe suffit','ok'));
  body+='<div class="pil-tv-act">'+(manque>0.05&&!fini?_pilTvBtn('renfort','Simuler un renfort'):_pilTvBtn('planning','Ouvrir le planning'))+'</div>';
  return _pilTile('capacite','#C9A84C','\u00c9quipe au pic', _pilStat(_pilEtpFmt(req),' pers.')+pl, sub, null, body, 'pil.capacite');
}
// ════════════════════════════════════════════════════════════════════════════
// ★★★ MOTS-9 (§592) — L'ÉQUIPE & LE MATÉRIEL ALLÉGÉS SUR PLACE. Même règle que Travaux (§590) : toutes les cartes restent, à
//   leur place, repliées ; chacune tient en un titre, un chiffre, une barre ou une couleur ; la méthode derrière le « i », le
//   détail au toucher, un bouton « Ouvrir » vers le module où l'on agit (règle ①). Rien ne se recalcule (règle ②) : les
//   mêmes fonctions qu'avant, les mots et les nombres du cockpit pour la phrase. Maquette validée :
//   docs/maquettes/maquette-equipe-materiel-v1.html.
//   ★ La section « Pour finir les travaux tracteur en cours » (trois grandes cartes, chacune son grand titre-phrase) devient
//   UNE carte repliée, « Travaux tracteur en cours » ; le gasoil après les travaux rejoint la carte de la cuve : « 255 L »
//   s'écrivait trois fois (la tuile, « Gasoil après les travaux », son graphique).
function _pilTabEqu(d){
  var P='', M='', X=null;
  if(_pilShow('prs_equipe')) P+=_pilPanelEquipe(d);
  if(_pilShow('prs_presences')) P+=_pilPanelPresences(d);
  if(_pilShow('prs_capacite')) P+=_pilPanelCapacite(d);
  if(_pilShow('auj_tension')) P+=_pilPanelTension(d);
  if(_pilShow('an_frise')) P+=_pilPanelAnRenfort();   // PIL-RANGE-2b : le renfort de l'année, venu de L'année
  try{ X=_pilTrxParts(d); }catch(e){ X=null; if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilTabEqu#trx'); }
  if(_pilShow('mat_tracteur')) M+=_pilPanelTracteur(d);
  if(_pilShow('mat_gnr')) M+=_pilPanelGnr(d,X);
  if(_pilShow('mat_conso')) M+=_pilPanelConso(d);
  if(_pilShow('mat_travaux')) M+=_pilPanelTrx(d,X);
  // Les six autres onglets ont leur repli ; celui-ci sortait un ECRAN BLANC, sans même la phrase qui dit comment rallumer les tuiles.
  if(!P && !M) return '<div class="pil-empty">Aucun indicateur affich\u00e9 \u2014 activez-les via \u00ab Choisir les indicateurs \u00bb.</div>';
  return '<div class="pil-tv pil-eq">'
    +(P?'<div class="pil-sec-h">Personnel</div><div class="pil-panels">'+P+'</div>':'')
    +(M?'<div class="pil-sec-h">Mat\u00e9riel</div><div class="pil-panels">'+M+'</div>':'')
    +'</div>';
}
// La phrase du haut : l'équipe du jour, puis ce qui presse. Les mots et les nombres du cockpit (la tuile Équipe et sa tension,
//   _pilCk2Modele) : « 4/4 présents », « 2 personnes au seuil », « 1 au-delà du maximum » ; la cuve sous le seuil ; une révision
//   dépassée. Rien qui presse : la phrase s'arrête à l'équipe.
function _pilEqPhrase(d){
  var p=[];
  if(d.jourTravaille===false) p.push('<b>pas de travail pr\u00e9vu aujourd\u2019hui</b>');
  else {
    var pN=(d.presentFiches!=null?d.presentFiches:(d.nPresent||0)), vN=(d.nVchamp!=null?d.nVchamp:((d.membres||[]).length));
    p.push('<b>'+pN+'/'+vN+' pr\u00e9sents</b>');
  }
  var TS=null; try{ TS=_pilTensData(d); }catch(eT){ TS=null; if(window._mvAvale) window._mvAvale(eT,'pilotage.js/_pilEqPhrase#tension'); }
  if(TS && TS.rows && TS.rows.length){
    if(TS.nRouge) p.push('<b class="ko">'+TS.nRouge+' au-del\u00e0 du maximum</b>');
    else if(TS.nSeuil) p.push('<b class="or">'+TS.nSeuil+' personne'+(TS.nSeuil>1?'s':'')+' au seuil</b>');
    else p.push('personne au seuil');
  }
  var g=d.gnr;
  if(g && g.capacite && (Number(g.niveau)||0)<=(Number(g.seuil)||0)) p.push('<b class="or">cuve GNR sous le seuil</b>');
  if((d.tracs||[]).some(function(t){ return t.revReste!=null && t.revReste<0; })) p.push('<b class="ko">r\u00e9vision d\u00e9pass\u00e9e</b>');
  return '<span class="pil-tv-ph">'+p.join(', ')+'</span>';
}
// La tension, en carte repliée : combien au seuil (le chiffre du cockpit), et la ligne de chacun au toucher. « Tension de l'équipe
//   — détail / Les 14 derniers jours / 14 derniers jours · … » : trois titres pour un, et une phrase de méthode — dans le « i ».
function _pilPanelTension(d){
  var T=_pilTensData(d);
  if(!T||!T.rows.length) return '';
  var mx=0; T.rows.forEach(function(r){ mx=Math.max(mx,r.f,r.p); });
  mx=Math.max(10,Math.ceil(mx/10)*10);
  var w=function(v){ return Math.max(0,Math.min(100,v/mx*100)).toFixed(2)+'%'; };
  var rows=T.rows.map(function(r){
    var cls=r.niv==='rouge'?'b':(r.niv==='orange'?'o':'v');
    var sem=(r.sm>T.L.maxMoy+1e-4)?('<span class="pil-tens-sem">semaine \u00e0 '+_pilNum(r.sm)+' h'+(r.niv==='rouge'?' \u2014 au-del\u00e0 de '+T.L.maxHebdo+' h':'')+'</span>'):'';
    return '<div class="pil-tens-r"><span class="n">'+_pilEsc(r.nom)+sem+'</span>'
      +'<span class="k"><i class="'+cls+'" style="width:'+w(r.f)+'"></i>'+(r.p>0?'<u style="left:'+w(r.p)+'"></u>':'')+'</span>'
      +'<span class="v"><b>'+_pilNum(r.f)+'</b> h<span>'+_pilTensFmtEc(r.ec)+'</span></span></div>';
  }).join('');
  var body='<div class="pil-tens">'+rows+'</div>'
    +'<div class="pil-tens-r pil-tens-ax"><span></span><span class="pil-trx-ax"><span>0</span><span>'+(mx/2)+'</span><span>'+mx+' h</span></span><span></span></div>'
    +'<div class="pil-trx-leg"><span><i class="f"></i>fait</span><span><i class="m"></i>pr\u00e9vu au planning</span></div>'
    +'<div class="pil-tv-act">'+_pilTvBtn('planning','Ouvrir le planning')+'</div>';
  return _pilTile('tension','#C9A84C','Tension', _pilStat(String(T.nSeuil),' au seuil',null)+(T.nRouge?_pilPhPl(T.nRouge+' au-del\u00e0 du maximum','or'):''),
    '14 derniers jours, face au planning', null, body, 'pil.tens');   // MOTS-9 : « pil.tens » — l'ancienne fiche « pil.tension » de l'ancien Aujourd'hui est retirée (PIL-RANGE-1b, épinglé)
}
// Les morceaux de l'ancienne section « Pour finir les travaux tracteur en cours » (GNR-M §213, GNR-2 §256, PIL-RANGE-1b §441).
//   Calculs inchangés : les travaux en cours (_pilGmTravaux), l'entretien le plus pressant dans ces travaux (_pilGmRevision), la
//   cascade de la cuve. La carte « Travaux tracteur en cours » prend les deux premiers ; la carte de la cuve, le troisième — et
//   seulement quand un travail a des litres à compter (sinon la cascade redisait le niveau du jour).
function _pilTrxParts(d){
  var T=_pilGmTravaux(), out={ jobs:null, rev:null, cuve:null };
  var trNom={}; (d.tracs||[]).forEach(function(t){ trNom[t.id]=t.nom; });
  // ① Les travaux en cours
  if(T.jobs.length){
    var dom=T.domaine>0?T.domaine:1, hT=0, lT=0, nSansH=0, nSess=0, nAm=0;
    var rows=T.jobs.map(function(j){
      if(j.h!=null) hT+=j.h; else nSansH++;
      if(j.l!=null) lT+=j.l;
      if(j.kind==='session') nSess++; else nAm++;
      var w=function(v){ return Math.max(0,Math.min(100,v/dom*100)).toFixed(2)+'%'; };
      var sub=_pilEsc(trNom[j.tid]||'tracteur non choisi')+' \u00b7 ';
      if(j.kind==='amendement') sub+='apport du '+_pilDfr(j.debut)+' \u00b7 '+j.nSel+' parcelle'+(j.nSel>1?'s':'')+' choisie'+(j.nSel>1?'s':'')+(j.lance?'':' \u00b7 session pas encore lanc\u00e9e');
      else sub+='lanc\u00e9 le '+_pilDfr(j.debut)+(j.nSkip?(' \u00b7 '+j.nSkip+' d\u00e9sactiv\u00e9e'+(j.nSkip>1?'s':'')):'');
      var dorm=(j.dormJ!=null&&j.dormJ>_PIL_GM_DORMANT_J)?'<span class="pil-trx-dorm">aucune parcelle coch\u00e9e depuis '+j.dormJ+' j</span>':'';
      return '<div class="pil-trx-job"><span class="pil-trx-nm"><b>'+_pilGmLibJob(j)+(j.sel?' <span class="pil-trx-tag">s\u00e9lection</span>':'')+'</b><span>'+sub+'</span>'+dorm+'</span>'
        +'<span class="pil-trx-trkc"><span class="pil-trx-trk"><i style="left:0;width:'+w(j.faitHa)+'" class="f"></i><i style="left:'+w(j.faitHa)+';width:'+w(j.resteHa)+'" class="r"></i></span>'
        +'<span class="pil-trx-ha">'+_pilGmFr(j.resteHa,2)+' ha \u00e0 faire sur '+_pilGmFr(j.perHa,2)+' ha</span></span>'
        +'<span class="pil-trx-num">'+(j.h!=null?'<b>'+_pilGmFr(j.h)+'</b> h':'\u2014')+'</span>'
        +'<span class="pil-trx-num">'+(j.l!=null?'<b>'+_pilNum(j.l)+'</b> L':'\u2014')+'</span></div>';
    }).join('');
    out.jobs={ n:T.jobs.length, hT:hT, lT:lT, nSansH:nSansH, nSess:nSess, nAm:nAm,
      html:'<div class="pil-trx-job pil-trx-hd"><span>Travail</span><span class="pil-trx-trkc">Reste \u00e0 faire</span><span class="pil-trx-num">Heures</span><span class="pil-trx-num">Litres</span></div>'
        +rows
        +'<div class="pil-trx-leg"><span><i class="f"></i>fait</span><span><i class="r"></i>reste</span></div>' };
  }
  // ② L'entretien le plus pressant, dans ces travaux (COMPT-7, §489)
  var R=_pilGmRevision(d,T);
  if(R){
    var t=R.t, it=R.it, rs=it.reste, etat, cls, etatDate=false;   // etatDate : la pastille dit déjà la date
    var nomIt=it.rev?'R\u00e9vision':_pilEsc(it.nom), dIt=it.pd?_pilEsc(_pilGmDateAn(it.pd)):'';
    if(rs!=null&&rs<=0){ etat='d\u00e9pass\u00e9e de '+_pilNum(-rs)+' h'; cls='ko'; }
    else if(it.jours!=null&&it.jours<0){ etat='date d\u00e9pass\u00e9e'; cls='ko'; }
    else if(R.dans){ etat='atteinte pendant : '+_pilGmLibJob(R.dans.job); cls='or'; }
    else if(it.jours!=null&&it.jours<=14){ etat='le '+dIt; cls='or'; etatDate=true; }
    else { etat='pas atteinte'; cls='ok'; }
    var axMax=Math.max(10, Math.ceil(Math.max(rs>0?rs:0, R.tot)*1.15/10)*10);
    var cols=['var(--terre)','var(--or)','var(--vert-med)'], seg='';
    R.seq.forEach(function(j,k){ seg+='<i style="width:'+(j.h/axMax*100).toFixed(2)+'%;background:'+cols[k%3]+'" title="'+_pilEsc(_pilTnom(j.nom))+' \u00b7 '+_pilGmFr(j.h)+' h"></i>'; });
    if(rs>0) seg+='<u style="left:'+Math.min(100,rs/axMax*100).toFixed(2)+'%"></u>';
    // Le repère en jours (le rythme mesuré du tracteur, 4 semaines) tient dans la ligne ; la légende des travaux, quand il y en a plusieurs.
    var ry=_pilGmRythme(t.id,d.refDate), nJ=(ry&&rs>0)?Math.ceil(rs/ry):0;
    var leg=R.seq.length>1?R.seq.map(function(j,k){ return '<span><i style="background:'+cols[k%3]+'"></i>'+_pilGmLibJob(j)+' \u00b7 '+_pilGmFr(j.h)+' h</span>'; }).join(''):'';
    out.rev={ titre:nomIt+' \u00b7 '+_pilEsc(t.nom||'Tracteur'), etat:etat, cls:cls,
      // Un travail sans barème n'a pas d'heures à compter : il se dit à part, jamais « 0,0 h en cours » seul.
      html:'<div class="pil-t2s">'+(rs>0?_pilNum(rs)+' h avant '+(it.rev?'la r\u00e9vision':'cet entretien')+' \u00b7 ':'')
          +((R.tot>0||!R.sansBareme)?(_pilGmFr(R.tot)+' h en cours sur ce tracteur'+(R.sansBareme?' \u00b7 ':'')):'')+(R.sansBareme?(R.sansBareme+' sans bar\u00e8me'):'')+(R.dans?(' \u00b7 \u00e0 '+Math.round(R.dans.pc*100)+' % de ce travail'):'')
          +(nJ?(' \u00b7 environ '+nJ+' jour'+(nJ>1?'s':'')+' ouvr\u00e9'+(nJ>1?'s':'')):'')+'</div>'
        +'<div class="pil-trx-carnet">'+seg+'</div>'
        +'<div class="pil-trx-ax"><span>0</span><span>'+(axMax/2)+'</span><span>'+axMax+' h</span></div>'
        +(leg?'<div class="pil-trx-leg">'+leg+'</div>':'')
        +((dIt&&!etatDate)?'<div class="pil-t2s">\u00c0 la date\u00a0: le '+dIt+'</div>':'')
        +((R.aussi&&R.aussi.length)?'<div class="pil-t2s">Aussi\u00a0: '+R.aussi.map(_pilGmRevTxt).join(' \u00b7 ')+'</div>':'') };
  }
  // ③ La cuve après les travaux
  var g=d.gnr;
  if(g&&g.capacite){
    var cap=Number(g.capacite)||0, niv=Number(g.niveau)||0, seuil=Number(g.seuil)||0;
    var avecL=T.jobs.filter(function(j){ return j.l!=null; });
    if(avecL.length){
      // ★ L'ECHELLE (GNR-2) : elle part de zéro et va un peu au-dessus du niveau du jour (ou du seuil), arrondie.
      var m=Math.max(niv,seuil,1)*1.1, pas=m<=200?50:(m<=600?100:(m<=1500?250:500));
      var axG=Math.min(cap>0?cap:Infinity, Math.ceil(m/pas)*pas);
      var x=function(v){ return (Math.max(0,Math.min(axG,v))/axG*100).toFixed(2)+'%'; };
      var w2=function(a,b){ return (Math.abs(Math.max(0,Math.min(axG,a))-Math.max(0,Math.min(axG,b)))/axG*100).toFixed(2)+'%'; };
      var u='<u style="left:'+x(seuil)+'"></u>', lignes='', n=niv;
      var ligne=function(lib,de,a,cl,val,tot){ lignes+='<div class="pil-trx-cs'+(tot?' tot':'')+'"><span class="l">'+lib+'</span><span class="k"><i class="'+cl+'" style="left:'+x(Math.min(de,a))+';width:'+w2(de,a)+'"></i>'+u+'</span><span class="v">'+val+'</span></div>'; };
      avecL.forEach(function(j){ ligne('\u2212 '+_pilGmLibJob(j),n,n-j.l,'m','\u2212'+_pilNum(j.l)); n-=j.l; });
      var apres=n, bas=apres<seuil;
      ligne('Apr\u00e8s les travaux',0,Math.max(0,apres),bas?'b':'o',_pilNum(apres)+' L',true);
      // TRAIT-CUVE (§221) : la ligne « et si » du traitement conseillé, en pointillé.
      var opt=_pilGmTraitementOption(T);
      if(opt){ var apresT=apres-opt.l; lignes+='<div class="pil-trx-cs option"><span class="l">\u2212 '+_pilEsc(_pilTnom(opt.nom))+' (conseill\u00e9)</span><span class="k"><i class="m" style="left:'+x(Math.min(apres,apresT))+';width:'+w2(apres,apresT)+'"></i>'+u+'</span><span class="v">\u2212'+_pilNum(opt.l)+'</span></div>'
        +'<div class="pil-trx-cs tot option"><span class="l">Avec ce traitement</span><span class="k"><i class="'+(apresT<seuil?'b':'o')+'" style="left:0;width:'+w2(0,Math.max(0,apresT))+'"></i>'+u+'</span><span class="v">'+_pilNum(apresT)+' L</span></div>'; }
      var mes=avecL.some(function(j){ return j.src==='mesure'; }), reg=avecL.some(function(j){ return j.src==='reglage'; });
      // Le pointillé dit pourquoi il est là (TRAIT-CUVE §221) : les parcelles à nu, la fenêtre, les heures et leur source.
      out.cuve={ apres:apres, bas:bas, src:mes&&reg?'conso mesur\u00e9e, r\u00e9glage sans mesure':(mes?'conso mesur\u00e9e':'conso du r\u00e9glage'),
        html:'<div class="pil-trx-casc">'+lignes+'</div>'
          +'<div class="pil-trx-cs"><span></span><span class="pil-trx-ax"><span>0</span><span>'+_pilNum(axG/2)+'</span><span>'+_pilNum(axG)+' L</span></span><span></span></div>'
          +(opt?('<div class="pil-t2s">En pointill\u00e9\u00a0: '+opt.nNu+' parcelle'+(opt.nNu>1?'s':'')+' \u00e0 nu ou presque, fen\u00eatre '+_pilEsc(opt.fen)+', '+_pilGmFr(opt.h)+' h sur le domaine ('+opt.hhaSrc+')</div>'):'') };
    }
  }
  return out;
}
// Les travaux du tracteur en cours, en carte repliée : combien, et ce qu'il faut pour les finir ; au toucher, chaque travail et
//   l'entretien qui tombe dedans (sa pastille monte sur le chiffre quand elle n'est pas verte).
function _pilPanelTrx(d,X){
  if(!X || (!X.jobs && !X.rev)) return '';
  var Jb=X.jobs, Rv=X.rev, stat, sub;
  if(Jb){
    stat=_pilStat(Jb.n, ' en cours', null);
    // Les heures et les litres de ce qui a un barème ; « N sans barème » à part — jamais « reste 0,0 h · 0 L » pour un travail qu'on ne sait pas compter.
    sub=((Jb.n>Jb.nSansH)?('reste '+_pilGmFr(Jb.hT)+' h \u00b7 '+_pilNum(Jb.lT)+' L'):'')+(Jb.nSansH?(((Jb.n>Jb.nSansH)?' \u00b7 ':'')+Jb.nSansH+' sans bar\u00e8me'):'');
  } else { stat=_pilStat('0', ' en cours', null); sub='aucune session lanc\u00e9e'; }
  if(Rv && Rv.cls!=='ok') stat+=_pilPhPl(Rv.titre.split(' \u00b7 ')[0]+' '+Rv.etat, Rv.cls==='ko'?'ko':'or');
  var body=(Jb?Jb.html:'')
    +(Rv?('<div class="pil-tv-fh">'+Rv.titre+_pilPhPl(Rv.etat,Rv.cls)+'</div>'+Rv.html):'')
    +'<div class="pil-tv-act">'+_pilTvBtn('tracteur','Ouvrir le tracteur')+'</div>';
  return _pilTile('trx','#4A9FC8','Travaux tracteur en cours', stat, sub, null, body, 'pil.trx');
}

// ── Onglet MATÉRIEL ──
function _pilPanelGnr(d,X){
  var g=d.gnr;
  // ③ « Cuve GNR a renseigner (Tracteur › Entretien) » etait du TEXTE MORT : il
  //   fallait lire, retenir, sortir du module et retrouver l'onglet. C'est un
  //   bouton, et il ouvre l'ecran directement.
  if(!g||!g.capacite){ return _pilTile('gnr','#B85A1A','Cuve GNR', _pilStat('\u2014',''), 'aucune cuve renseignée',
    null, _pilEmptyGo('Sans capacité de cuve, le niveau ne se calcule pas et le carburant reste à zéro dans tous les budgets.','entretien','Tracteur \u203a Entretien'), 'pil.gnr'); }
  var niveau=Number(g.niveau)||0, cap=Number(g.capacite)||1, seuil=Number(g.seuil)||0, pc=Math.round(niveau/cap*100), low=niveau<=seuil;
  var col=low?'var(--rouge)':(pc<=40?'var(--orange)':'var(--vert-med)');
  // ★★ MOTS-9 (§592) — « 255 L » S'ÉCRIVAIT TROIS FOIS : cette tuile, « Gasoil après les travaux » et son graphique. Il s'écrit
  //   une fois, ici, avec « sous le seuil » en pastille et le seuil posé sur la barre. Ce que les travaux en cours prendront à
  //   la cuve (la cascade de _pilTrxParts) se lit dans le corps, seulement quand un travail a des litres à compter.
  //   « soit 26 % · niveau calculé, pas mesuré » : le « i » (pil.gnr).
  var body='<div class="pil-gbar pil-eq-gb" style="height:14px"><i style="width:'+pc+'%;background:'+col+'"></i>'
    +(seuil>0?'<u style="left:'+Math.min(100,seuil/cap*100).toFixed(1)+'%" title="seuil '+_pilNum(seuil)+' L"></u>':'')+'</div>'
    +((X&&X.cuve)?('<div class="pil-tv-fh">Après les travaux en cours<small>'+X.cuve.src+'</small></div>'+X.cuve.html):'')
    +'<div class="pil-tv-act">'+_pilTvBtn('entretien','Ouvrir l\u2019entretien')+'</div>';
  return _pilTile('gnr','#B85A1A','Cuve GNR', _pilStat(_pilNum(niveau),' L',null)+(low?_pilPhPl('sous le seuil','or'):''),
    'seuil '+_pilNum(seuil)+' L \u00b7 cuve de '+_pilNum(cap)+' L', null, body, 'pil.gnr');
}
// ── L'onglet Pilotage › Cave a ete RAMENE dans la Cave (lot CAVE-3, §96) :
//   Aujourd'hui (verdict + agenda), Le millesime › La ligne de vie (tuiles,
//   face a N-1) et › Les courbes, La Reserve › Futs (le parc). Ici ne reste
//   qu'une carte dans Aujourd'hui, qui LIT window._mlVerdict / _mlAgendaComplet.
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
var _ECO_RATE_CACHE={k:null,v:0};   // oublie a chaque repeinte (_pilExoOublier)
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
  // ★★★ TAUX A LA DATE. Le cout MO d'une parcelle est un budget de SAISON : le taux
  // qui compte est celui qui valait AU DEBUT DE LA PERIODE CONSULTEE, pas celui
  // d'aujourd'hui. Sans ca, une augmentation signee en aout rechiffrait le budget de
  // la taille de fevrier — et le budget d'une campagne archivee bougeait tout seul.
  // ⚠️ REPLI : periode non datee -> `_mvPaieTauxAt` sans date rend le taux courant,
  // soit exactement l'ancien comportement. Aucune regression possible sur ce chemin.
  var _atR=(typeof window._mvPaieTauxAt==='function')
    ? function(nm){ return Number(window._mvPaieTauxAt(nm,_d0R))||0; }
    : function(nm){ return Number(indiv[nm])||0; };
  // ★ Pondéré par les heures annuelles du gabarit (backlog 9).
  // Un temps plein a 12 €/h pese plus qu'un mi-temps a 14 €/h dans le budget global :
  // la moyenne par tete surestime le taux quand le domaine melange durees inegales.
  // Repli sur h=1 (= par tete, meme resultat qu'avant) si window._planGetRefH absent
  // ou gabarit vide — aucune regression sur un domaine sans donnees de planning.
  // ★★ LE POIDS D'UN TAUX, C'EST CE QUE LA PERSONNE TRAVAILLE SUR LA PERIODE
  //   (10/09/2026). Avant : les heures de reference de sa grille sur DOUZE mois,
  //   une fiche = une personne. Une equipe de vendange de 30 a 16 €/h pesait donc
  //   autant qu'un permanent a 22 €/h sur l'annee entiere : 18,75 €/h affiche, 16,3
  //   reel — et le budget de la vendange, qui en decoule, faux de 15 %.
  //   _planWorkPersRange : les heures REELLEMENT travaillees sur [d0,d1], contrats
  //   et effectif collectif compris — la meme source que l'exercice (la cadence, elle, lit les heures dans les rangs depuis CHAMP-2).
  //   Repli (planning absent) : grille annuelle x effectif de la fiche.
  var ck=_d0R+'|'+_d1R+'|'+membres.length;
  if(_ECO_RATE_CACHE.k===ck) return _ECO_RATE_CACHE.v;
  var sum=0, wsum=0;
  var canW=(_d0R && _d1R && typeof window._planWorkPersRange==='function');
  var dA=canW?new Date(_d0R+'T00:00:00'):null, dB=canW?new Date(_d1R+'T00:00:00'):null;
  membres.forEach(function(m){
    var r=_atR(m.nom);
    if(!(r>0)) r=Number(taux[m.type_contrat||'CDI'])||0;
    if(r>0){
      var eff=(typeof window._mvEffDef==='function')?window._mvEffDef(m):1;
      var h=0;
      if(canW){ try{ h=Number(window._planWorkPersRange(m,dA,dB))||0; }catch(e){ h=0; } }
      if(!(h>0)){
        var plId=(typeof window._planPlId==='function')?window._planPlId(m):'standard';
        if(typeof window._planGetRefH==='function'){
          for(var mi=0;mi<12;mi++) h+=(window._planGetRefH(plId,mi)||0);
        }
        h=h*eff;
      }
      if(!(h>0)) h=eff;
      sum+=r*h; wsum+=h;
    }
  });
  if(wsum>0){ _ECO_RATE_CACHE={k:ck,v:sum/wsum}; return sum/wsum; }
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
  var n=_opTrousPrevus(p), h=0, nT=0;
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
    if(!j||j.meteo||j.auTracteur||j.statut!=='Valid\u00e9'||!j.parcelle||!j.date) return;   // auTracteur : FERTI-3
    if(j.presta) return;   // ARRACH-3 : une étape faite par un prestataire n'est le travail de personne de l'équipe
    if(!_in(j)) return;
    var noms=[]; if(j.qui && !j.quiHors) noms.push(j.qui);   // TV-2 : le validateur hors des rangs ne compte pas
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
        // ★ TAUX A LA DATE DU TRAVAIL : `dt` est la date du journal. Une augmentation
        // de juillet ne doit pas rechiffrer la taille de fevrier.
        var m=byNom[n], r=(m&&window._mvPaieTauxEffAt)?Number(window._mvPaieTauxEffAt(m,dt)):0;
        if(r>0){ sum+=r*w; wt+=w; }
      });
    });
    out[k]={ etp:dates.length?jh/dates.length:0, jh:jh, nj:dates.length,
             taux:(wt>0?sum/wt:0), noms:Object.keys(e.noms) };
  });
  return out;
}

// ════════════════════════════════════════════════════════════════════════════════
// ★★★ TV-1 (23/09/2026) — LE TEMPS REELLEMENT PASSE DANS CHAQUE PARCELLE
// ════════════════════════════════════════════════════════════════════════════════
// Nico : « il faudrait que le moteur calcule le nombre de vignes validees en une
// journee pour faire un prorata du temps passe dans chaque parcelle en fonction du
// nombre d'heures comptees sur le planning des salaries qui travaillent dans les
// vignes » — puis, precise : une validation vaut pour TOUT le groupe nomme (Victor,
// Shana et Alicia 1 h sur un are = 3 h sur la tache) ; plusieurs parcelles le meme
// jour se partagent AU PRORATA DE LA SURFACE (3 personnes x 8 h sur 1 ha + 0,5 + 0,5
// = 24 h pour 2 ha, soit 12 h/ha contre 15 au bareme : c'est ce qui dit si le travail
// va plus vite ou plus lent que la convention).
//
// LA REGLE, PAR SALARIE :
//   heures du jour = heures DANS LES RANGS du planning (_planChampPersRange : conge,
//     recup, arret, absence, formation, evenement familial a 0) MOINS ses heures de
//     conduite tracteur ce jour-la (deja mesurees par les sessions) ;
//   elles S'ACCUMULENT jusqu'au jour ou il figure sur une validation (qui ou
//     membresEquipe), puis se versent sur les travaux clos ce jour-la, au prorata de
//     la surface des parcelles.
// ⚠️ POURQUOI ACCUMULER : une validation marque la FIN d'un travail, pas une journee.
//   Mesure chez MG (§20b) : 12 journees-personne sur 247 portaient une validation en
//   hiver. « Le jour meme seulement » laisserait ~95 % des heures d'hiver sur aucune
//   parcelle. Les jours sans validation vont donc au travail que la personne clot
//   ensuite — ce qu'elle faisait, par construction.
// ⚠️ PROPRIETE QUI REND LE MODELE SUR : une heure n'est versee QU'UNE FOIS. Une
//   validation en trop ne cree pas d'heures, elle redistribue celles d'avant elle.
//   Ce qui n'est pas encore verse (depuis la derniere validation de la personne) est
//   « en attente », affiche a part, jamais perdu en silence.
// ⚠️ UN EVENEMENT DE CLOTURE, c'est :
//   · une entree « Valide » d'une tache simple ;
//   · pour une tache a niveaux ou a passages, une entree qui AJOUTE un niveau / un
//     passage fait — la liste est CUMULATIVE (confirmNiveaux ecrit tous les niveaux
//     faits a ce jour), et le statut peut rester « En cours » alors que du travail
//     vient d'etre clos. On compare donc a l'entree precedente du meme couple ;
//   · « Annule » retire la derniere cloture du couple (une validation par erreur).
//   La validation groupee « Domaine » n'a pas de surface : elle n'entre pas.
// ⚠️ LE VALIDATEUR (`qui`) compte dans le groupe, SAUF si l'entree porte `quiHors:true`
//   (TV-2 : un administrateur qui valide pour l'equipe peut se decocher a la saisie). Les
//   entrees d'avant TV-2 n'ont pas ce champ : l'auteur y compte, comme avant.
var _ECO_TV=null;
function _ecoTvNivs(j, cle){
  var a=Array.isArray(j[cle])?j[cle]:[], out=[];
  a.forEach(function(x){ var n=parseInt(String(x).replace(/\D/g,''),10); if(n>0 && out.indexOf(n)<0) out.push(n); });
  return out;
}
function _ecoTvDef(nom){
  var T=window.TACHES||[];
  for(var i=0;i<T.length;i++) if(T[i] && T[i].nom===nom) return T[i];
  return null;
}
// ★★ AUJ-7 (§309) — UN TRAVAIL SANS BARÈME EST UN TRAVAIL À L'HEURE. Arrachage, désherbage manuel, effeuillage, vendange :
//   le catalogue les dit « temps réel, hors barème », et l'accord du 2 octobre 2023 (travail à la tâche en viticulture, Côte-d'Or
//   et départements voisins) les laisse hors de la tâche — ils se paient à l'heure. Une tâche disparue du catalogue aussi.
function _ecoTvAvecBareme(def){
  if(!def) return false;
  if(def.trous || def.type==='passages' || def.type==='niveaux') return true;
  if(Array.isArray(def.niveaux) && def.niveaux.length) return true;
  if(Array.isArray(def.passagesHha) && def.passagesHha.length) return true;
  return Number(def.hha)>0;
}
// Heures de BAREME du travail clos par un evenement (surface x h/ha du niveau, du
// passage ou de la tache) — la reference contre laquelle on lit le temps reel.
function _ecoTvBar(p, def, ev){
  var surf=parseFloat(p.surface)||0;
  if(!def) return 0;
  if(def.trous){ var tr=parseInt(ev.trous,10)||((ev.jid&&typeof window._cptPlantesEntree==='function')?window._cptPlantesEntree(p,ev.jid):0); return tr>0 ? tr*_opMinTrou(def)/60 : 0; }   // ★ RESTE-1 (§535) : les pieds de CETTE validation
  if(ev.niv && ev.niv.length){
    var N=def.niveaux||[], h=0;
    ev.niv.forEach(function(k){ N.forEach(function(n){ if(n && n.num===k) h+=Number(n.hha)||0; }); });
    return surf*h;
  }
  if(ev.pass && ev.pass.length){ var hp=0; ev.pass.forEach(function(k){ hp+=_opPassHha(def,k); }); return surf*hp; }
  return surf*((def.hha)||0);
}
// Les evenements de cloture de la fenetre, tries par date. Rend aussi le nombre
// d'entrees ecartees et pourquoi (le harnais les compte).
function _ecoTvEvents(d0, d1){
  var byNom={}; (window.PARCELLES||[]).forEach(function(p){ if(p && p.nom!=null) byNom[String(p.nom)]=p; });
  var J=(window.JOURNAL||[]).filter(function(j){
    // FERTI-3 : une validation « faite au tracteur » (auTracteur) n'est pas une journée dans les rangs.
    //   Son temps est celui de la session tracteur ; la compter ici ferait partager les heures de l'équipe
    //   sur la parcelle semée, et compter le travail deux fois.
    // ARRACH-3 : une étape d'arrachage faite par un PRESTATAIRE (presta) n'est pas une journée de
    //   l'équipe : elle n'absorbe aucune heure du planning (même patron que auTracteur).
    return j && !j.meteo && !j.auTracteur && j.date && !j.presta && j.parcelle && j.tache && String(j.date).slice(0,10)<=d1;
  }).slice();
  // Ordre chronologique : la date, puis l'ordre de saisie (id = horodatage hex quand il l'est).
  function _ts(j){ var n=parseInt(String(j.id||''),16); return isFinite(n)?n:0; }
  J.sort(function(a,b){ var da=String(a.date).slice(0,10), db=String(b.date).slice(0,10);
    return da<db?-1:(da>db?1:(_ts(a)-_ts(b))); });
  var prev={}, ev=[], byPair={}, nHorsParc=0;
  J.forEach(function(j){
    var dt=String(j.date).slice(0,10), nom=String(j.parcelle), p=byNom[nom];
    if(!p){ if(nom!=='Domaine') nHorsParc++; return; }
    // ARRACH-3 : une étape d'arrachage est son propre couple — l'annulation d'une étape ne vise qu'elle,
    //   et deux étapes différentes ne sont pas une « revalidation » (RÉAL-1).
    var k=nom+'\u0000'+j.tache+(j.etape?('\u0000'+j.etape):''), st=String(j.statut||'');
    if(st==='Annul\u00e9'){
      var L=byPair[k]||[];
      for(var i=L.length-1;i>=0;i--){ if(!L[i].annule){ L[i].annule=true; break; } }
      prev[k]={niv:[],pass:[]};
      return;
    }
    var P=prev[k]||{niv:[],pass:[]};
    var niv=_ecoTvNivs(j,'niveaux'), pass=_ecoTvNivs(j,'passages');
    var nNiv=niv.filter(function(x){ return P.niv.indexOf(x)<0; });
    var nPass=pass.filter(function(x){ return P.pass.indexOf(x)<0; });
    // ★ UNION, pas remplacement (TV-2) : la validation d'un appui (pQuickValidate) écrit le SEUL
    //   passage du jour ([2]), les panneaux écrivent la liste ENTIÈRE ([1,2]). Remplacer ferait
    //   recompter le passage 1 à la liste entière suivante. « Annulé » remet à zéro, plus haut.
    if(niv.length||pass.length) prev[k]={
      niv:P.niv.concat(nNiv), pass:P.pass.concat(nPass) };
    var clot = nNiv.length>0 || nPass.length>0 || (st==='Valid\u00e9' && !niv.length && !pass.length);
    // ★★ RÉAL-1 (27/09/2026) — UNE TÂCHE SIMPLE SE VALIDE UNE FOIS. Une parcelle revalidée
    //   (deux « Validé » sans « Annulé » entre les deux) reste une clôture — les heures du
    //   groupe y vont —, mais son BARÈME n'est plus recompté : le travail n'a pas été fait deux
    //   fois. Constaté à l'écran : 52 validations de dégrafage pour une quarantaine de
    //   parcelles, barème 31,2 h/ha contre 28 au budget — l'écart annonçait +2 % au lieu de
    //   +14 %. Borné à la période (dt>=d0) : la même tâche revient chaque campagne.
    var dup=false;
    if(clot && dt>=d0 && st==='Valid\u00e9' && !niv.length && !pass.length){
      dup=!!P.val&&!(window.TACHES||[]).some(function(t){ return t&&t.nom===j.tache&&t.trous; }); prev[k]={ niv:(prev[k]||P).niv, pass:(prev[k]||P).pass, val:true };   // ★ RESTE-1 (§535) : une entreplantation se plante en plusieurs fois — chaque fois ses pieds
    }
    if(!clot || dt<d0) return;
    var noms=[]; if(j.qui && !j.quiHors) noms.push(j.qui);   // TV-2 : le validateur hors des rangs ne compte pas
    (j.membresEquipe||[]).forEach(function(n){ if(n && noms.indexOf(n)<0) noms.push(n); });
    // ★★ ÉQUIPES-1 : un jour où l'admin a posé des équipes, une validation SANS groupe (faite hors réseau,
    //   avant que le téléphone ait reçu le réglage, ou d'avant la saisie forcée) prend l'équipe du jour de
    //   son auteur. Un groupe écrit l'emporte : c'est ce que la saisie a forcé, ou ce que l'admin a corrigé.
    var EQd=(typeof window._mvEqJour==='function') ? window._mvEqJour(dt) : null;
    if(EQd && !((j.membresEquipe||[]).length) && j.qui){
      EQd.forEach(function(t){ if(t.indexOf(String(j.qui))<0) return;
        t.forEach(function(n){ if(n && n!==j.qui && noms.indexOf(n)<0) noms.push(n); }); });
    }
    var e={ date:dt, parc:nom, tache:j.tache, surf:parseFloat(p.surface)||0, noms:noms, eqj:!!EQd,
            niv:nNiv, pass:nPass, trous:j.plantation_trous||null, jid:j.id||'', p:p, dup:dup,
            etape:j.etape?String(j.etape):'', etapeLbl:j.etapeLbl?String(j.etapeLbl):'',
            hors:(j.qui && j.quiHors) ? String(j.qui) : '' };   // PAR-1 : décoché ce jour-là, il ne rejoint pas la journée du domaine
    // ★ ARRACH-8 (§306) : un passage d'une AUTRE tâche saisi après l'arrachage de la parcelle est une erreur de saisie
    //   (utils.js, _mvApresArrachage). Il reste un événement — une « Annulé » qui le vise doit le trouver —, mais il ne
    //   prend aucune heure : la journée revient aux parcelles réellement travaillées.
    if(typeof window._mvApresArrachage==='function' && window._mvApresArrachage(p,j)) e.horsArr=true;
    (byPair[k]=byPair[k]||[]).push(e);
    ev.push(e);
  });
  return { ev:ev.filter(function(e){ return !e.annule && !e.horsArr; }), nHorsParc:nHorsParc };
}
// ★★ ENG-2 (24/09/2026) — LES JOURNÉES DE CAVE SORTENT DE LA VIGNE.
//   Le planning dit combien d'heures, jamais où (vérifié : ni poste ni activité sur une
//   entrée). Nico : « il n'y a pas de planning cave, c'est au jour le jour » — mais les
//   opérations de cave sont saisies « presque toujours avec les noms » (intervenants[]).
//   Un jour où un salarié figure sur une opération de cave, sa JOURNÉE entière sort des
//   heures vigne : l'opération ne porte aucune durée, on ne sait pas mieux faire.
//   ⚠️ `intervenants` SEULEMENT, jamais `operateur` : operateur est la personne qui a
//      SAISI (currentUser), pas celle qui a travaillé — le repli de _caveWho ferait sortir
//      de la vigne chaque journée où Nico a noté un soutirage depuis son téléphone.
//   ⚠️ Pas les analyses : un prélèvement ne vide pas une journée.
//   ⚠️ La cuverie des vendanges (relevés de tournée, CAVE_VENDANGE…mesures_fa[].qui) n'est
//      PAS lue : son « qui » vaut par défaut celui qui ouvre la tournée. À trancher avec Nico.
function _ecoCaveJours(d0, d1){
  var out={}, ops=(window.CAVE_ELEVAGE&&window.CAVE_ELEVAGE.operations)||[];
  ops.forEach(function(op){
    if(!op || op.type==='analyse' || !op.date) return;
    var iso=String(op.date).slice(0,10);
    if(iso<d0 || iso>d1) return;
    (Array.isArray(op.intervenants)?op.intervenants:[]).forEach(function(n){
      if(!n) return; (out[n]=out[n]||{})[iso]=1;
    });
  });
  // ★★ JCAVE-1 (§428) — LA CAVE MARQUÉE AU PLANNING (CONFIG.cave_jours, utils.js/_mvCaveJour) : la journée (1), le matin (« m »)
  //   ou l'après-midi (« a »). Le Cuvier, l'entonnage et un ouillage sans nom n'écrivaient rien que cette fonction sache lire :
  //   ces journées restaient en attente et tombaient sur la prochaine parcelle validée (Réparation à +900 %, Nico, 22/10).
  //   Une opération du Chai le même jour vide déjà toute la journée : elle l'emporte sur une moitié.
  var C=(window.CONFIG&&window.CONFIG.cave_jours&&typeof window.CONFIG.cave_jours==='object')?window.CONFIG.cave_jours:{};
  Object.keys(C).forEach(function(iso){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(iso) || iso<d0 || iso>d1) return;
    var J=C[iso]||{};
    Object.keys(J).forEach(function(n){
      var v=J[n]; if(v!=='j'&&v!=='m'&&v!=='a') return;
      var o=(out[n]=out[n]||{}); if(o[iso]!==1) o[iso]=(v==='j')?1:v;
    });
  });
  return out;
}
function _ecoTempsVigne(win){
  // ★ REV-1 : fenêtre OPTIONNELLE {d0,d1} — même patron que _ecoTracHByParc(win). Sans
  //   elle, la période consultée, comme avant. Le Revient la rejoue sur le cycle du
  //   millésime : une seule définition de l'heure vigne.
  var _w=!!(win&&win.d0&&win.d1);
  var s=_w?null:((typeof window._pilSaison==='function')?window._pilSaison():null);
  var d0=_w?String(win.d0).slice(0,10):(s&&s.debut?String(s.debut).slice(0,10):''), d1=_w?String(win.d1).slice(0,10):(s&&s.fin?String(s.fin).slice(0,10):'');
  var _n=new Date(), auj=_pexIso(_n.getFullYear(),_n.getMonth(),_n.getDate());
  var vide={ ok:false, pairs:{}, taches:[], parcs:{}, gens:[], hChamp:0, hTrac:0, hAff:0, hAtt:0, hCave:0, hVigne:0, eur:0, eAff:0, eAtt:0, byD:{}, byDHb:{}, barD:{}, hHb:0, eHb:0, nSansTaux:0, nEv:0, d0:d0, d1:d1 };
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d0) || !/^\d{4}-\d{2}-\d{2}$/.test(d1) || d1<d0) return vide;
  // ★ La periode doit avoir COMMENCE (piege de _pecCadPresence, §20b) : sinon la
  //   fenetre part a l'envers et tout sort a zero en silence.
  if(auj<d0) return vide;
  var fin=(d1<auj)?d1:auj;
  var key=d0+'|'+fin;
  if(_ECO_TV && _ECO_TV.key===key) return _ECO_TV.v;
  if(typeof window._planChampPersRange!=='function'){ _ECO_TV={key:key,v:vide}; return vide; }

  var E=_ecoTvEvents(d0, fin);
  // ★★★ PAR-1 (30/09/2026) — LA JOURNÉE SE PARTAGE ENTRE LES PARCELLES VALIDÉES CE JOUR-LÀ, AU PRORATA DU BARÈME.
  // Nico, capture du tableau Parcelles à l'appui (dégrafage : des séries de parcelles à −90 %, d'autres à +297 %) :
  //   « si je valide quatre parcelles aujourd'hui, les quatre on les étale sur la journée au prorata du barème ».
  // AVANT : les heures d'un salarié n'allaient qu'aux validations où il était NOMMÉ. Nico valide souvent pour
  //   l'équipe : quand le groupe n'était pas coché, seules SES heures allaient aux parcelles du jour (−90 %), et
  //   celles de l'équipe s'accumulaient jusqu'à sa prochaine validation nommée, qui ramassait tout (+297 %).
  //   Le total d'un travail restait juste ; la parcelle, non.
  // MAINTENANT, par salarié et par jour :
  //   · nommé sur des validations du jour → ses heures (et son report) vont à CES validations (règle du groupe, TV-1) ;
  //   · pas nommé, mais le domaine a validé ce jour-là → ses heures vont à TOUTES les validations du jour ;
  //   · décoché ce jour-là (quiHors, TV-2) ou aucune validation ce jour-là → report, comme avant.
  //   Le partage se fait au prorata du BARÈME de chaque clôture (surface × h/ha du travail, du niveau, du passage,
  //   ou trous) : même travail = même chose que la surface ; travaux mêlés = chacun selon ce qu'il demande.
  //   Une revalidation (barème 0) ne prend rien si une vraie clôture est là ; seule ce jour-là, elle retombe sur la surface.
  // ★★ ÉQUIPES-1 : un jour avec des équipes posées par l'admin, la journée du domaine n'existe pas —
  //   chaque équipe garde ses parcelles, et quelqu'un hors de toute équipe garde ses heures pour SES
  //   validations (le cas « seul trois jours sur sa parcelle pendant que les autres valident »).
  var evBy={}, evJour={}, horsJour={}, eqJour={}, barD={};   // … · date -> 1 quand des équipes étaient posées ; barD (AUJ-7) : barème clos par jour
  E.ev.forEach(function(e){
    e.b = e.dup ? 0 : _ecoTvBar(e.p, _ecoTvDef(e.tache), e);
    e.hb = !_ecoTvAvecBareme(_ecoTvDef(e.tache));   // AUJ-7 : travail à l'heure
    if(!e.hb && e.b>0) barD[e.date]=(barD[e.date]||0)+e.b;   // AUJ-7 : le « fait » daté du graphe Économie d'Aujourd'hui
    if(e.eqj) eqJour[e.date]=1;
    (evJour[e.date]=evJour[e.date]||[]).push(e);
    if(e.hors) (horsJour[e.date]=horsJour[e.date]||{})[e.hors]=1;
    e.noms.forEach(function(n){
      (evBy[n]=evBy[n]||{}); (evBy[n][e.date]=evBy[n][e.date]||[]).push(e);
    });
  });
  var tr={condH:{}};
  try{ tr=_ecoTracHByParc({d0:d0,d1:fin}); }catch(e){ tr={condH:{}}; }
  var cave=_ecoCaveJours(d0, fin);
  // Taux de repli pour une fiche sans taux : le taux moyen du domaine (celui du barème).
  var rate0=0; try{ rate0=Number(_ecoRate())||0; }catch(e){ rate0=0; }
  var byD={}, byDHb={}, eurT=0, nSansTaux=0, hHb=0, eHb=0;   // byDHb, hHb, eHb (AUJ-7) : ce qui est allé aux travaux à l'heure
  var okPer=(typeof window._mvEnContratSurPeriode==='function');
  var mbrs=(window.MEMBRES||[]).filter(function(m){
    if(!m||!m.nom) return false;
    return okPer ? window._mvEnContratSurPeriode(m,d0,fin) : (m.statut!=='Inactif' && !m.bureau);
  });
  var pairs={}, gens=[], T={hChamp:0,hTrac:0,hAff:0,hAtt:0,hCave:0,hVigne:0,eAff:0,eAtt:0};
  // ARRACH-3 : les heures de l'arrachage, étape par étape (en plus du couple parcelle × Arrachage).
  var etp={};
  function _etp(e){ return etp[e.etape]||(etp[e.etape]={id:e.etape, lbl:e.etapeLbl||e.etape, h:0, eur:0, surf:0, ps:{}}); }
  mbrs.forEach(function(m){
    // RÉAL-1 : accE suit acc — les euros de ces heures, chacune à SON taux du jour, versés
    //   avec elles. Le réalisé d'un travail est donc ce que ses heures ont coûté, pas un taux moyen.
    var acc=0, accE=0, accL=[], g={nom:m.nom, hChamp:0, hTrac:0, hAff:0, hAtt:0, hCave:0, hVigne:0, eur:0, eAff:0, eAtt:0, nEv:0, dAtt:'', sansTaux:false};
    var cd=(tr.condH&&tr.condH[m.nom])||{}, cj=cave[m.nom]||{};
    for(var d=d0, guard=0; d<=fin && guard<800; d=_pexJourApres(d), guard++){
      var h=0;
      try{ h=Number(window._planChampPersRange(m,_pexD(d),_pexD(d)))||0; }catch(e){ h=0; }
      var ht=Math.min(h, Number(cd[d])||0);
      g.hChamp+=h; g.hTrac+=ht;
      var hv=h-ht;
      if(hv>0 && cj[d]){                                 // ENG-2 : journée de cave, hors vigne
        // ★ JCAVE-1 (§428) : une demi-journée marquée au Planning n'enlève que sa moitié, d'après l'horaire du jour
        //   (planning.js/_planCaveH) — sans lui, la moitié des heures. Le reste de la journée reste à la vigne.
        var hc=(cj[d]===1)?hv:((typeof window._planCaveH==='function')?(Number(window._planCaveH(m,d,cj[d],hv))||0):hv/2);
        if(hc>hv) hc=hv;
        g.hCave+=hc; hv-=hc;
      }
      if(hv>0){
        if(!(acc>0)) g.dAtt=d; acc+=hv; g.hVigne+=hv;
        // ENG-2 : l'euro engagé, au taux chargé de CE jour (une augmentation ne réécrit pas mars).
        var tx=0; try{ tx=(typeof window._mvPaieTauxEffAt==='function')?Number(window._mvPaieTauxEffAt(m,d))||0:0; }catch(e){ tx=0; }
        if(!(tx>0)){ tx=rate0; g.sansTaux=true; }
        if(tx>0){ var eu=hv*tx; g.eur+=eu; eurT+=eu; byD[d]=(byD[d]||0)+eu; accE+=eu; accL.push([d,eu]); }
      }
      var L=(evBy[m.nom]||{})[d];
      if(!(L && L.length) && evJour[d] && !eqJour[d] && !(horsJour[d] && horsJour[d][m.nom])) L=evJour[d];   // PAR-1 : la journée du domaine (pas un jour d'équipes)
      if(L && L.length && acc>0){
        // PAR-1 : prorata du BARÈME (règle de Nico). Barèmes tous nuls (revalidations seules) :
        // la surface ; surfaces nulles aussi : parts égales, plutôt que de perdre les heures.
        // ★★ AUJ-7 (§309) — UN TRAVAIL À L'HEURE NE PERD PLUS SA JOURNÉE. Sans barème, sa part au prorata du barème valait 0 :
        //   le jour où une clôture au barème partageait la liste (Nico valide l'étape d'arrachage ET la réparation de l'équipe),
        //   elle ramassait tout — les jours d'arrachage accumulés compris. La journée se partage d'abord à la SURFACE entre
        //   travaux à l'heure et travaux au barème, puis au barème entre ces derniers (PAR-1), à la surface entre les premiers.
        //   Une liste d'un seul genre se partage exactement comme avant.
        var S=0, Sb=0, SH=0, SB=0, nH=0, nB=0;
        L.forEach(function(e){ S+=e.surf; if(e.hb){ SH+=e.surf; nH++; } else { SB+=e.surf; Sb+=(e.b||0); nB++; } });
        var qH=(nH&&nB)?((S>0)?(SH/S):(nH/L.length)):(nH?1:0);
        L.forEach(function(e){
          var part=e.hb ? qH*((SH>0)?(e.surf/SH):(1/nH)) : (1-qH)*((Sb>0)?((e.b||0)/Sb):((SB>0)?(e.surf/SB):(1/nB))), v=acc*part;
          var k=e.parc+'\u0000'+e.tache;
          var P=pairs[k]||(pairs[k]={parc:e.parc, tache:e.tache, h:0, eur:0, bar:0, surf:0, n:0, noms:{}, hb:!!e.hb});
          P.h+=v; P.eur+=accE*part; P.noms[m.nom]=1;
          if(e.etape){ var X=_etp(e); X.h+=v; X.eur+=accE*part; }
          if(e.hb){ hHb+=v; eHb+=accE*part; accL.forEach(function(x){ byDHb[x[0]]=(byDHb[x[0]]||0)+x[1]*part; }); }   // AUJ-7 : au jour où l'heure a été faite
        });
        g.hAff+=acc; g.eAff+=accE; g.nEv+=L.length; acc=0; accE=0; accL=[]; g.dAtt='';
      }
    }
    g.hAtt=acc; g.eAtt=accE;
    if(g.hChamp>0 || g.hAff>0){
      gens.push(g);
      T.hChamp+=g.hChamp; T.hTrac+=g.hTrac; T.hAff+=g.hAff; T.hAtt+=g.hAtt; T.hCave+=g.hCave; T.hVigne+=g.hVigne;
      T.eAff+=g.eAff; T.eAtt+=g.eAtt;
      if(g.sansTaux && g.hVigne>0) nSansTaux++;
    }
  });
  // Le bareme et la surface de chaque couple, UNE fois par evenement (et non par
  // personne) : le bareme mesure le travail, pas le nombre de gens qui l'ont fait.
  var vus={};
  E.ev.forEach(function(e){
    var k=e.parc+'\u0000'+e.tache, P=pairs[k];
    var b=e.dup ? 0 : _ecoTvBar(e.p, _ecoTvDef(e.tache), e);   // RÉAL-1 : une revalidation ne recompte pas le barème
    if(!P){ P=pairs[k]={parc:e.parc, tache:e.tache, h:0, eur:0, bar:0, surf:0, n:0, noms:{}, sansH:true, hb:!!e.hb}; }
    P.bar+=b; P.n++;
    if(!vus[k]){ P.surf=e.surf; vus[k]=1; }
    if(e.etape){ var X=_etp(e); if(!X.ps[e.parc]){ X.ps[e.parc]=1; X.surf+=e.surf; } }
  });
  var byT={}, parcs={};
  Object.keys(pairs).forEach(function(k){
    var P=pairs[k];
    var t=byT[P.tache]||(byT[P.tache]={nom:P.tache, h:0, eur:0, bar:0, surf:0, nP:0, nSansH:0, hb:!!P.hb});
    t.h+=P.h; t.eur+=P.eur; t.bar+=P.bar; t.surf+=P.surf; t.nP++; if(!(P.h>0)) t.nSansH++;
    var q=parcs[P.parc]||(parcs[P.parc]={h:0,eur:0,bar:0});
    q.h+=P.h; q.eur+=P.eur; q.bar+=P.bar;
  });
  var taches=Object.keys(byT).map(function(n){ var t=byT[n];
    t.hhaR=t.surf>0?t.h/t.surf:0; t.hhaB=t.surf>0?t.bar/t.surf:0;
    // Ecart lu seulement quand les deux cotes existent : un couple sans heure versee
    // (personne du groupe au planning) ne fait pas « -100 % ».
    t.ecart=(t.bar>0 && t.h>0)?((t.h-t.bar)/t.bar*100):null;
    return t; }).sort(function(a,b){ return b.h-a.h || (a.nom<b.nom?-1:1); });
  gens.sort(function(a,b){ return b.hAtt-a.hAtt || (a.nom<b.nom?-1:1); });
  var _ordE=((window.CONFIG&&window.CONFIG.arrachage&&window.CONFIG.arrachage.etapes)||[]).map(function(x){ return x&&x.id; });
  var etapes=Object.keys(etp).map(function(id){ var x=etp[id]; x.hhaR=x.surf>0?x.h/x.surf:0; delete x.ps; return x; })
    .sort(function(a,b){ var ia=_ordE.indexOf(a.id), ib=_ordE.indexOf(b.id); return (ia<0?99:ia)-(ib<0?99:ib); });
  var v={ ok:true, pairs:pairs, taches:taches, parcs:parcs, gens:gens, etapes:etapes, byDHb:byDHb, barD:barD, hHb:hHb, eHb:eHb,   // AUJ-7
          hChamp:T.hChamp, hTrac:T.hTrac, hAff:T.hAff, hAtt:T.hAtt, hCave:T.hCave, hVigne:T.hVigne,
          eur:eurT, eAff:T.eAff, eAtt:T.eAtt, byD:byD, nSansTaux:nSansTaux,
          nEv:E.ev.length, nHorsParc:E.nHorsParc, d0:d0, d1:d1, fin:fin };
  _ECO_TV={key:key, v:v};
  return v;
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

// ════════ CARBURANT REEL : LES LITRES DES PLEINS, PAS UN MODELE ════════
// AVANT : le carburant etait ESTIME — heures de session x conso L/h x prix du litre.
//   Le total n'etait donc que la somme d'estimations, et une session non notee
//   faisait DISPARAITRE du carburant.
// POURQUOI CA NE TENAIT PAS : les heures de session ne sont pas systematiquement
//   saisies. Elles servent d'abord a etablir les moyennes h/ha par travail, pas a
//   mesurer un volume consomme. Batir un cout dessus, c'est batir sur une base
//   volontairement partielle.
// APRES : le total EST la somme des pleins reellement faits — fiches d'entretien
//   portant `litres_plein`. Les heures ne servent plus qu'a REPARTIR cette enveloppe
//   entre les parcelles. Une heure oubliee DEPLACE desormais du carburant d'une
//   parcelle vers une autre ; elle n'en fait plus disparaitre.
// ⚠️ CE QUI RESTE APPROCHE, ET QUI EST DIT A L'ECRAN : la CLE de repartition. Un plein
//   est date et rattache a un TRACTEUR, jamais a une parcelle — aucune donnee ne dit
//   quels litres ont brule sur quelle parcelle. L'enveloppe est juste, sa ventilation
//   est proportionnelle. C'est l'inverse exact d'avant, ou la ventilation etait
//   coherente et l'enveloppe fausse.
// ⚠️ REPLI ASSUME : aucun plein releve sur la fenetre => l'ancien modele reprend la
//   main, ET L'ECRAN LE DIT. Un chiffre estime annonce comme mesure serait pire que
//   l'estime annonce comme tel.
// Libelle du poste carburant. UNE seule formulation pour la campagne et pour
// l'exercice : deux ecrans qui affichent le meme poste doivent le decrire pareil.
function _pecGnrDet(src,litres,n,nSans,cle,pu){
  if(src!=='reel'){
    return _pilNum(litres)+' L ESTIM\u00c9S \u00e0 '+_ecoEur2(pu)+' \u20AC/L \u2014 aucun plein relev\u00e9'
      +(nSans>0?(' ('+nSans+' plein'+(nSans>1?'s':'')+' sans litres)'):'');
  }
  return _pilNum(litres)+' L relev\u00e9s \u00b7 '+n+' plein'+(n>1?'s':'')
    +(cle==='surface'?' \u00b7 r\u00e9parti \u00e0 la surface':'')
    +(nSans>0?(' \u00b7 '+nSans+' plein'+(nSans>1?'s':'')+' sans litres, non compt\u00e9'+(nSans>1?'s':'')):'');
}
function _ecoGnrPuAt(iso){
  var pu=(window._mvPaieGnrPuAt)?Number(window._mvPaieGnrPuAt(iso)):0;
  if(isFinite(pu)&&pu>0) return pu;
  return _ecoCfg().gnrL;
}
// `win` = {d0,d1} en ISO, sinon la campagne consultee. MEME regle d'appartenance que
// _ecoTracHByParc / _ecoPhytoByParc (_saisonForDate), pour que les trois ecrans
// parlent de la meme periode.
function _ecoGnrReel(win){
  var out={ L:0, eur:0, n:0, nSansLitres:0, nSansPrix:0, byDate:{}, litresByDate:{}, ok:false };
  var s=(typeof window._pilSaison==='function')?window._pilSaison():null;
  var seasonNom=(s&&s.nom)?s.nom:'';
  function _in(iso){
    if(win&&win.d0&&win.d1) return !!iso && iso>=win.d0 && iso<=win.d1;
    var sn=(window._saisonForDate&&iso)?window._saisonForDate(iso):null; sn=sn||'';
    if(sn) return sn===seasonNom;
    return seasonNom===(((window.getSaisonActive&&window.getSaisonActive())||{}).nom||'');
  }
  (window.ENTRETIENS||[]).forEach(function(f){
    if(!f||!f.plein) return;
    var iso=String(f.date||'').slice(0,10);
    if(!iso||!_in(iso)) return;
    var L=Number(f.litres_plein)||0;
    // ⚠️ Un plein coche SANS litres est compte a part, jamais ignore en silence : c'est
    //   la seule facon de distinguer « peu de carburant » de « carburant mal releve ».
    //   Les fiches anterieures a la saisie obligatoire tombent toutes ici.
    if(!(L>0)){ out.nSansLitres++; return; }
    var pu=_ecoGnrPuAt(iso);
    if(!(pu>0)) out.nSansPrix++;
    var e=L*(pu>0?pu:0);
    out.n++; out.L+=L; out.eur+=e;
    out.byDate[iso]=(out.byDate[iso]||0)+e;
    out.litresByDate[iso]=(out.litresByDate[iso]||0)+L;
  });
  out.ok = out.n>0;
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
  var out={h:{},cost:{},qui:{},nAnon:0,nSess:0,byDate:{},gnrByDate:{},hByDate:{},condByDate:{},condH:{},hCo:{}};   // hCo : COEQ-4 (§525), les heures du coéquipier par parcelle
  var _rate0=_ecoRate(), _cfgT=_ecoCfg();
  var _mBy={}; (window.MEMBRES||[]).forEach(function(m){ if(m&&m.nom) _mBy[m.nom]=m; });
  // ★ TAUX A LA DATE DE LA SESSION. Une session de mars se valorise au taux de mars,
  // meme si le conducteur a ete augmente depuis.
  function _tauxCond(nom, iso){
    var m=nom?_mBy[nom]:null;
    var r=(m&&window._mvPaieTauxEffAt)?Number(window._mvPaieTauxEffAt(m,iso)):0;
    return (isFinite(r)&&r>0)?r:0;
  }
  var s=(typeof window._pilSaison==='function')?window._pilSaison():null;
  var seasonNom=(s&&s.nom)?s.nom:'';
  var sess=window.SESSIONS||[], acts=window.ACTIVITES||[], parcs=window.PARCELLES||[];
  function _in(se){
    if(win&&win.d0&&win.d1){ var _d=String(se.date||'').slice(0,10); return !!_d && _d<=win.d1; }   // COEQ-4 (§525) : la fenêtre se juge parcelle par parcelle, plus bas
    var sn=(window._saisonForDate&&se.date)?window._saisonForDate(se.date):null; sn=sn||se.saison||'';
    if(sn) return sn===seasonNom;
    return seasonNom===(((window.getSaisonActive&&window.getSaisonActive())||{}).nom||'');
  }
  sess.forEach(function(se){
    if(!se||!_in(se)) return;
    var act=acts.find(function(a){return a&&a.nom===se.activite;});
    var hha=act?(parseFloat(act.h_ha)||0):0;
    var _tc=_tauxCond(se.conducteur, se.date), _tu=(_tc>0?_tc:_rate0);
    out.nSess++; if(!(_tc>0)) out.nAnon++;
    (se.parcellesFaites||[]).forEach(function(x){
      var nom=(typeof x==='string')?x:((x&&x.nom)||''); if(!nom) return;
      // ★★ COEQ-4 (§525) : chaque parcelle porte SON jour (_trJourDe, règle de FERTI-9) et SON coéquipier (_trCoDe, COEQ-2).
      //   Avant : toutes les heures d'une session de plusieurs jours tombaient sur son premier jour, au conducteur seul.
      var _j=(typeof window._trJourDe==='function')?window._trJourDe(se,x):String(se.date||'').slice(0,10);
      if(win&&win.d0&&win.d1&&(!_j||_j<win.d0||_j>win.d1)) return;
      var _co=(typeof window._trCoDe==='function')?window._trCoDe(se,x):'';
      var _tcP=_tauxCond(se.conducteur,_j||se.date), _tuP=(_tcP>0?_tcP:_rate0), _tcC=_co?_tauxCond(_co,_j||se.date):0, _tuC=_co?(_tcC>0?_tcC:_rate0):0;
      var d=(x&&typeof x==='object'&&typeof x.dmin==='number')?x.dmin:null, h;
      if(d!=null){ h=d/60; }
      else { if(hha<=0) return; var p=parcs.find(function(pp){return pp&&pp.nom===nom;}); h=(p?(parseFloat(p.surface)||0):0)*hha; }
      var mo=h*_tuP+(_co?h*_tuC:0);   // la main-d'œuvre : le conducteur ET le coéquipier, chacun à son taux du jour
      out.h[nom]=(out.h[nom]||0)+h;   // les heures du TRACTEUR (GNR, compteur) : elles ne doublent pas
      if(_co) out.hCo[nom]=(out.hCo[nom]||0)+h;
      out.cost[nom]=(out.cost[nom]||0)+mo;
      // Source DATEE de la courbe d'engagement : conduite + coéquipier + carburant, au jour de la parcelle.
      // Une seule definition de « ce que coute une session » — celle-ci.
      if(_j){
        out.byDate[_j]=(out.byDate[_j]||0)+mo+h*_cfgT.conso*_cfgT.gnrL;
        // la main-d'œuvre seule (repli : `byDate` mêle les deux tant qu'aucun plein n'est relevé)
        out.condByDate[_j]=(out.condByDate[_j]||0)+mo;
        // l'exercice comptable veut le CARBURANT SEUL (la main-d'œuvre est déjà dans la masse salariale)
        out.gnrByDate[_j]=(out.gnrByDate[_j]||0)+h*_cfgT.conso*_cfgT.gnrL;
        out.hByDate[_j]=(out.hByDate[_j]||0)+h;
      }
      if(se.conducteur){ if(!out.qui[nom]) out.qui[nom]={}; out.qui[nom][se.conducteur]=(out.qui[nom][se.conducteur]||0)+h; }
      if(_co){ if(!out.qui[nom]) out.qui[nom]={}; out.qui[nom][_co]=(out.qui[nom][_co]||0)+h; }
      // TV-1 : les heures au tracteur d'UNE personne UN jour — le temps vigne (_ecoTempsVigne) les retire de ses heures
      //   dans les rangs. COEQ-4 : le coéquipier aussi, et au jour de la parcelle.
      if(se.conducteur && _j){ if(!out.condH[se.conducteur]) out.condH[se.conducteur]={}; out.condH[se.conducteur][_j]=(out.condH[se.conducteur][_j]||0)+h; }
      if(_co && _j){ if(!out.condH[_co]) out.condH[_co]={}; out.condH[_co][_j]=(out.condH[_co][_j]||0)+h; }
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
  // ★ Le prix unitaire vient du PMP des achats (window._rsvPrixU, La Reserve),
  //   plus de `pr.prixU` — ce champ n'a jamais eu d'interface d'ecriture et
  //   valait undefined chez tous les domaines reels. L'appel est GARDE : sans
  //   reserve.js (module charge en DERNIER dans l'ordre d'import), on retombe
  //   sur l'ancien champ au lieu de planter.
  INT.forEach(function(pr){
    if(!pr||pr.nom==null) return;
    var k=_ecoPhNorm(pr.nom); if(k in priceBy) return;
    var u=(typeof window._rsvPrixU==='function')?(Number(window._rsvPrixU(pr))||0):0;
    if(!(u>0)) u=(Number(pr.prixU)>0)?Number(pr.prixU):0;
    priceBy[k]=(u>0)?u:null;
  });
  var s=(typeof window._pilSaison==='function')?window._pilSaison():null;
  var seasonNom=(s&&s.nom)?s.nom:'';
  function _in(t){
    if(win&&win.d0&&win.d1){ var _d=String(t.date||'').slice(0,10); return !!_d && _d>=win.d0 && _d<=win.d1; }
    var sn=(window._saisonForDate&&t.date)?window._saisonForDate(t.date):null; sn=sn||t.saison||'';
    if(sn) return sn===seasonNom;
    return seasonNom===(((window.getSaisonActive&&window.getSaisonActive())||{}).nom||'');
  }
  // ★ MANQUE-1 (§357) : nLignes compte les lignes du registre dans la fenêtre, dose ou pas. Le diagnostic ne lisait que
  //   anyDose (« aucune ligne dosée »), vrai aussi quand il n'y a AUCUN traitement — tout l'hiver : il annonçait alors
  //   « les produits comptent pour zéro » sur un zéro juste. nLignes sépare les deux cas.
  var cost={}, unpriced={}, anyDose=false, byDate={}, nLignes=0;
  (window.TRAITEMENTS||[]).forEach(function(e){
    if(!e||!_in(e)) return;
    nLignes++;
    if(e.dose_val==null||isNaN(e.dose_val)) return; // pas structuré → exclu du calcul
    anyDose=true;
    var base=String(e.dose_unit||'').toLowerCase().split('/')[0];
    var pu=priceBy[_ecoPhNorm(e.produit)];
    if(pu==null){ unpriced[e.produit||'?']=1; return; }
    (e.parcelles||[]).forEach(function(nom){
      var p=(window.PARCELLES||[]).find(function(x){ return x&&x.nom===nom; });
      var surf=p?(parseFloat(String(p.surface==null?'':p.surface).replace(',','.'))||0):0;
      if(surf>0&&typeof window._mvSurfT==='function') surf=window._mvSurfT(e,nom,surf);   // ★ REG27-1A (§572) : la surface traitée
      if(surf<=0) return;
      var qty=e.dose_val*surf*(base==='g'?0.001:1), eur=qty*pu;
      cost[nom]=(cost[nom]||0)+eur;
      if(e.date) byDate[e.date]=(byDate[e.date]||0)+eur;
    });
  });
  return { cost:cost, unpriced:Object.keys(unpriced), anyDose:anyDose, nLignes:nLignes, hasIntrants:INT.length>0, byDate:byDate };
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
var _PEC_COL = { mo:'#8A5A38', trac:'#2C3E50', gnr:'#C2871E', phy:'#5B2D8E', ret:'#B85A1A', dep:'#1A4A7A',
                 loc:'#1D6F8C', fut:'#6B4226', pre:'#4A6B3A', hb:'#7A6A3A' };   // pre : prestations (ARRACH-4) · hb : travaux à l'heure (AUJ-7)
// ── LES ATELIERS — la DESTINATION de l'euro, pas sa nature ──────────────────
// Economie trie par NATURE (salaire / carburant / achat / depense). L'atelier
// est un SECOND AXE sur les MEMES euros : ou est parti l'argent, pas ce qu'on a
// paye. Deux lectures, jamais deux totaux.
// ⚠️ Le mot est « atelier » et pas « poste » : `poste` designe deja la nature
//   (_PEC_COL, sous-vue `pos`). Deux sens pour un mot dans le meme ecran, c'est
//   la confusion garantie a la premiere relecture.
// ⚠️ La table vit dans reserve.js (module proprietaire d'INTRANTS) et n'est
//   RECOPIEE nulle part : ces replis ne servent que si reserve.js est en retard
//   chez un client, jamais comme seconde verite.
var _PEX_ATE_ORD=['vigne','cave','trac','gen'];
var _PEX_ATE_LBL={vigne:'Vigne',cave:'Cave',trac:'Tracteur',gen:'Non affect\u00e9'};
var _PEX_ATE_COL={vigne:'#3D6B27',cave:'#8A5A38',trac:'#2C3E50',gen:'#DED7C9'};
function _pexAteOrd(){ return (typeof window._rsvAteOrdre==='function')?window._rsvAteOrdre():_PEX_ATE_ORD.slice(); }
function _pexAteLbl(k){ return (typeof window._rsvAteLbl==='function')?window._rsvAteLbl(k):(_PEX_ATE_LBL[k]||_PEX_ATE_LBL.gen); }
// ⚠️ Meme couleur que reserve.js, y compris pour le seau. J'avais fonce le gris
//   « pour qu'il se voie mieux » — la maquette dit #DED7C9 et elle a ete validee.
//   Une maquette validee est une decision prise : la rouvrir a l'integration,
//   c'est decider a la place de Nico sans le lui dire.
function _pexAteCol(k){ return _PEX_ATE_COL[k]||_PEX_ATE_COL.gen; }
function _pexAteDe(cat){
  if(typeof window._rsvAteDe==='function') return window._rsvAteDe(cat);
  var T={phyto:'vigne',oeno:'cave',vigne:'vigne',cave:'cave',trac:'trac',gen:'gen'};
  return T[cat]||'gen';
}

// ── Formats ──────────────────────────────────────────────────────────
// Un tableau de chiffres se lit mal en euros pleins : au-dela de 10 000 EUR on
// passe en milliers, avec UNE decimale. Les totaux, eux, restent en euros exacts.
function _pecEurK(n){
  var v=Number(n)||0, a=Math.abs(v);
  if(a>=10000) return (Math.round(v/100)/10).toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1})+' k\u20AC';
  return _ecoEur(v);
}
function _pecPct(n){ return (Math.round((Number(n)||0)*10)/10).toLocaleString('fr-FR',{minimumFractionDigits:0,maximumFractionDigits:1})+' %'; }
// RÉAL-1 — l'écart réalisé − barème du fait. Plus = le travail a coûté PLUS que prévu.
//   Mêmes seuils que la carte « Temps réel contre barème » (>15 rouge, >5 orange, <−8 vert),
//   lus en % du barème du fait : les deux cartes colorent le même écart de la même façon.
function _pecEcPct(ec, base){ return (ec===null || ec===undefined || !(Number(base)>0)) ? null : (ec/base*100); }
function _pecEcCol(pc){ return (pc===null) ? 'var(--texte)' : (pc>15?'var(--rouge)':(pc>5?'var(--orange)':(pc<-8?'var(--vert-med)':'var(--texte)'))); }
function _pecEcEur(ec){ if(ec===null || ec===undefined) return '\u2014'; var r=Math.round(ec); return (r>0?'+':(r<0?'\u2212':''))+_ecoEur(Math.abs(r)); }
function _pecEcTd(ec, base){
  if(ec===null || ec===undefined) return '<td class="r" style="color:var(--texte-doux)">\u2014</td>';
  var pc=_pecEcPct(ec, base);
  return '<td class="r" style="color:'+_pecEcCol(pc)+';font-weight:600">'+_pilEsc(_pecEcEur(ec))
    +(pc!==null?('<div style="font-weight:400;font-size:var(--pt-micro,12px)">'+(pc>0?'+':(pc<0?'\u2212':''))+_pilEsc(_pecPct(Math.abs(pc)))+'</div>'):'')+'</td>';
}
function _pecMoisCourt(m){ return ['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'][m]||''; }
function _pecIsoToMs(iso){ var t=Date.parse(String(iso||'')+'T00:00:00'); return isNaN(t)?null:t; }
function _pecMsToIso(ms){ var d=new Date(ms); var m=d.getMonth()+1, j=d.getDate(); return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(j<10?'0':'')+j; }
function _pecDfrMs(ms){ var d=new Date(ms); return d.getDate()+' '+_pecMoisCourt(d.getMonth())+' '+d.getFullYear(); }
function _pecJourCourt(ms){ var d=new Date(ms); return d.getDate()+' '+_pecMoisCourt(d.getMonth()); }   // COHER-1 (§581) : « 25 nov. », l'écriture du lexique (§580c)

// ── État de la vue (par utilisateur, par domaine) ────────────────────
// Trois choix memorises : la sous-vue ouverte, le tri du tableau parcelles et son
// sens. L'ancienne version repartait a zero a chaque ouverture « volontairement » ;
// sur un outil qu'on consulte deux fois par jour, c'est une friction, pas une regle.
var _PEC_SUB='syn', _PEC_PSORT='budget', _PEC_PDIR=-1;
// Axe de lecture des consommables : 'nat' (par nature, l'axe historique) ou
// 'ate' (par atelier). Memorise comme le reste de l'etat de la vue.
var _PEC_AXE='ate';
function _pecStKey(){ return 'mavigne_pec_'+_pilTenant(); }
function _pecLoadSt(){
  try{
    var raw=localStorage.getItem(_pecStKey()); if(!raw) return;
    var o=JSON.parse(raw); if(!o||typeof o!=='object') return;
    if(o.sub==='syn'||o.sub==='pos'||o.sub==='par'||o.sub==='rev'||o.sub==='ach'||o.sub==='exe') _PEC_SUB=o.sub;
    if(o.axe==='nat'||o.axe==='ate') _PEC_AXE=o.axe;
    // Exercice consulte : une annee d'OUVERTURE, ou null = celui d'aujourd'hui.
    if(typeof o.psort==='string') _PEC_PSORT=o.psort;
    if(o.pdir===1||o.pdir===-1) _PEC_PDIR=o.pdir;
  }catch(e){ _PEC_SUB='syn'; }
}
function _pecSaveSt(){
  try{ localStorage.setItem(_pecStKey(), JSON.stringify({sub:_PEC_SUB,psort:_PEC_PSORT,pdir:_PEC_PDIR,axe:_PEC_AXE})); }
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
  +'.pec-sub button{border:0;background:transparent;color:var(--texte-doux);font-family:inherit;font-size:var(--pt-txt,13px);font-weight:600;padding:9px 15px;border-radius:9px;cursor:pointer;min-height:40px;white-space:nowrap}'
  +'.pec-sub button.on{background:var(--bg-card);color:var(--texte);box-shadow:var(--shadow-sm)}'
  +'.pec-card{background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:15px;box-shadow:var(--shadow-sm);overflow:hidden;position:relative}'
  +'.pec-ch{display:flex;align-items:baseline;justify-content:space-between;gap:10px 18px;padding:15px 18px 8px;flex-wrap:wrap}'
  +'.pec-ct{font-size:var(--pt-md,20px);font-weight:600;color:var(--texte);line-height:1.15}'
  +'.pec-cs{font-size:var(--pt-micro,12px);color:var(--texte-doux);line-height:1.5;flex:1;min-width:180px}'
  +'.pec-cb{padding:2px 18px 18px}'
  +'.pec-svg{max-width:100%;height:auto;display:block}'
  +'.pec-lg i{width:16px;height:0;display:inline-block;flex:none}'
  +'.pec-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(196px,1fr));border-top:1px solid var(--gris-clair)}'
  +'.pec-k{padding:15px 20px;border-right:1px solid var(--gris-clair);border-bottom:1px solid var(--gris-clair);margin-bottom:-1px}'
  +'.pec-k.pex-prevu{background:repeating-linear-gradient(135deg,transparent 0 7px,rgba(138,90,56,.07) 7px 9px)}'
  +'.pec-k.pex-prevu .v{color:var(--texte-med)}'
  +'.pex-prevu-c{color:var(--texte-doux)}'
  +'.pec-k .l{display:flex;align-items:center;gap:6px;font-size:var(--pt-lbl,12px);font-weight:600;letter-spacing:0;text-transform:none;color:var(--texte-doux)}'
  +'.pec-k .v{font-size:var(--pt-xxl,32px);font-weight:600;margin-top:3px;line-height:1.05;color:var(--texte);font-variant-numeric:lining-nums tabular-nums}'
  +'.pec-k .v small{font-size:var(--pt-txt,13px);font-weight:600;color:var(--texte-doux)}'
  +'.pec-k .s{font-size:var(--pt-micro,12px);color:var(--texte-doux);margin-top:4px;line-height:1.45}'
  +'.pec-bar{height:11px;border-radius:6px;background:var(--gris-clair);overflow:hidden;display:flex}'
  +'.pec-bar i{display:block;height:100%}'
  +'.pec-leg{display:flex;flex-wrap:wrap;gap:7px 18px;margin-top:11px}'
  +'.pec-lg{display:inline-flex;align-items:center;gap:7px;font-size:var(--pt-micro,12px);color:var(--texte-med)}'
  +'.pec-lg em{width:11px;height:11px;border-radius:3px;display:inline-block;font-style:normal;flex:none}'
  +'.pec-lg b{color:var(--texte);font-variant-numeric:lining-nums tabular-nums}'
  +'.pec-scroll{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}'
  +'.pec-tbl{width:100%;border-collapse:collapse;font-size:var(--pt-txt,13px);min-width:620px}'
  +'.pec-tbl th{text-align:left;font-size:var(--pt-nano,11px);text-transform:none;letter-spacing:0;color:var(--texte-doux);padding:9px 10px;border-bottom:1px solid var(--gris-clair);white-space:nowrap;font-weight:600}'
  +'.pec-tbl th.s{cursor:pointer;user-select:none}'
  +'.pec-tbl th.s:hover{color:var(--texte)}'
  +'.pec-tbl th.on{color:var(--texte)}'
  +'.pec-tbl td{padding:10px;border-bottom:1px solid var(--gris-clair);vertical-align:middle;color:var(--texte-med)}'
  +'.pec-tbl td.r,.pec-tbl th.r{text-align:right;font-variant-numeric:lining-nums tabular-nums;white-space:nowrap}'
  +'.pec-tbl td.n{color:var(--texte);font-weight:600}'
  +'.pec-tbl tbody tr:last-child td{border-bottom:0}'
  +'.pec-tbl tfoot td{border-top:2px solid var(--gris);border-bottom:0;font-weight:600;color:var(--texte);padding-top:12px}'
  // ══ LA CARTE DE FIABILITE ══
  //   .pec-a (le pave colore) n'est plus produit par _pecAlertes ; ses regles
  //   restent en place, d'autres vues peuvent encore s'en servir.
  //   La puce des remarques : le mur, replie en une ligne cliquable.
  +'.pec-remq{display:flex;align-items:center;gap:9px;width:100%;margin-top:10px;padding:10px 13px;'
  +'border:1px solid var(--gris);background:var(--bg-card);border-radius:11px;cursor:pointer;'
  +'font-family:inherit;font-size:var(--pt-txt,13px);font-weight:600;color:var(--texte-med);text-align:left}'
  +'.pec-remq:hover{border-color:var(--or);background:var(--or-pale)}'
  +'.pec-remq-n{flex:none;min-width:21px;height:21px;border-radius:7px;background:var(--or);color:#1C1813;'
  +'display:flex;align-items:center;justify-content:center;font-size:var(--pt-micro,12px);font-weight:600}'
  +'.pec-remq-c{margin-left:auto;color:var(--texte-doux)}'
  +'.pec-a{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:12px;border:1px solid;font-size:var(--pt-txt,13px);line-height:1.55;color:var(--texte-med)}'
  +'.pec-a+.pec-a{margin-top:9px}'
  +'.pec-a .e{font-size:var(--pt-base,14px);line-height:1.3;flex:none}'
  +'.pec-a b{color:var(--texte)}'
  +'.pec-a.bad{background:var(--rouge-pale);border-color:rgba(160,41,30,.35)}'
  +'.pec-a.warn{background:var(--orange-pale);border-color:rgba(184,90,26,.35)}'
  +'.pec-a.info{background:var(--or-pale);border-color:rgba(194,161,77,.42)}'
  +'.pec-a.ok{background:var(--vert-pale);border-color:rgba(61,107,39,.32)}'
  +'.pec-btn{border:1px solid var(--gris-clair);background:var(--bg-card);color:var(--texte-med);border-radius:10px;padding:10px 14px;font-family:inherit;font-size:var(--pt-txt,13px);font-weight:600;cursor:pointer;min-height:42px;display:inline-flex;align-items:center;gap:7px}'
  +'.pec-btn:hover{background:var(--bg-app);color:var(--texte)}'
  +'.pec-acts{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}'
  +'.pec-tbl tr.pex-ag td{background:var(--bg-app);font-weight:600;color:var(--texte);font-size:var(--pt-micro,12px);text-transform:none;letter-spacing:0;padding:7px 10px}'
  +'.pec-tbl tr.pex-ag td em{width:9px;height:9px;border-radius:3px;display:inline-block;font-style:normal;margin-right:7px}'
  +'.pach-p{border:1px dashed var(--gris);background:transparent;color:var(--texte);border-radius:8px;padding:5px 10px;font:inherit;font-size:var(--pt-txt,13px);font-weight:600;cursor:pointer;white-space:nowrap}'
  +'.pach-p:hover{border-style:solid;border-color:var(--or);background:var(--or-pale)}'
  +'.pach-p.vide{color:var(--orange);border-style:dotted}'
  +'.pach-p.ok{color:var(--vert-med)}'
  +'.pec-btn.on{background:var(--bg-app);color:var(--texte);border-color:var(--gris)}'
  +'.pex-apill{display:inline-block;font-size:var(--pt-lbl,12px);font-weight:600;border-radius:7px;padding:3px 8px;line-height:1.4;white-space:nowrap}'
  +'.pex-ctrl{margin-top:14px;border:1px dashed var(--gris);border-radius:13px;padding:12px 15px;background:var(--bg-app);font-size:var(--pt-micro,12px);color:var(--texte-doux);line-height:1.7}'
  +'.pex-ctrl .l{font-size:var(--pt-lbl,12px);letter-spacing:0;text-transform:none;font-weight:600;color:var(--texte-med);margin-bottom:2px}'
  +'.pex-ctrl b{color:var(--texte)}'
  +'.pex-ctrl b.ok{color:var(--vert-med)}'
  +'.pex-ctrl.bad{border-color:rgba(160,41,30,.45);background:var(--rouge-pale)}'
  +'.pex-ctrl b.ko{color:var(--rouge)}'
  +'.pec-note{font-size:var(--pt-micro,12px);color:var(--texte-doux);line-height:1.6;margin-top:12px}'
  +'.pec-note b{color:var(--texte-med)}'
  +'.pec-verdict{display:flex;gap:15px;align-items:flex-start;padding:17px 20px}'
  // MOTS-1 (§582) : la phrase (un titre, son repère), la ligne de la campagne au-dessus, la bande de ce qui demande un geste, le trait du travail fait
  +'.pec-verdict.pec-ph>div:last-child{flex:1;min-width:0}'
  +'.pec-verdict.pec-ph>div:first-child:not(.em){flex:1;min-width:0}.pec-phi{flex:none}'   // MOTS-2 (§583) : l'en-tête des sous-vues, sa pastille « i » à droite
  //   (la taille et la graisse de la phrase sont celles du verdict de tout le Pilotage : styles.css, l'échelle unique)
  +'.pec-verdict.pec-ph .t b{font-variant-numeric:lining-nums tabular-nums;white-space:nowrap}'
  +'.pec-cs.pec-ci{flex:none;min-width:0}'   // MOTS-2 (§583) : un sous-titre réduit à sa pastille « i » (MOTS-3 : ou à un mot et sa pastille) reste sur la ligne du titre
  // MOTS-3 (§584) : les listes de Postes & travaux et de Parcelles — deux colonnes sur ordinateur, une au téléphone
  +'.pec-g2{display:grid;gap:16px;align-items:start}.pec-g2>*{min-width:0}'
  +'@media(min-width:881px){.pec-g2{grid-template-columns:1fr 1fr}.pec-g2.pec-g21{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)}}'
  +'.pil-panels.pec-p1{grid-template-columns:1fr}'
  +'.pec-kpis.pec-k2{grid-template-columns:1fr 1fr}'
  +'.pec-kpis.pec-k3{grid-template-columns:repeat(3,1fr)}'   // MOTS-4 (§585) : Archives
  +'.pec-rg{border-top:1px solid var(--gris-clair)}'
  +'.pec-rg>summary{list-style:none;cursor:pointer;display:block;padding:11px 18px}'
  +'.pec-rg>summary::-webkit-details-marker{display:none}'
  +'.pec-rg[open],.pec-rg>summary:hover{background:var(--bg-app)}'
  +'.pec-rg .l1{display:flex;justify-content:space-between;align-items:baseline;gap:10px}'
  +'.pec-rg .nm{font-size:var(--pt-base,14px);font-weight:500;color:var(--texte);min-width:0}'
  +'.pec-rg .nm small{font-size:var(--pt-micro,12px);font-weight:normal;color:var(--texte-doux);margin-left:7px;white-space:nowrap}'
  +'.pec-rg .vl{font-size:var(--pt-base,14px);font-weight:600;color:var(--texte);white-space:nowrap;font-variant-numeric:lining-nums tabular-nums}'
  +'.pec-rg .l2{display:flex;align-items:center;gap:8px;margin-top:6px;font-size:var(--pt-micro,12px);color:var(--texte-doux)}'
  +'.pec-rg .l2 .pec-bar{flex:1;min-width:36px;height:6px;border-radius:3px}'
  +'.pec-rg .rp{white-space:nowrap;font-variant-numeric:lining-nums tabular-nums}'
  +'.pec-rg .dt{padding:0 18px 12px;font-size:var(--pt-micro,12px);color:var(--texte-doux);line-height:1.5}'
  +'.pec-per{display:flex;align-items:center;justify-content:space-between;gap:6px 12px;flex-wrap:wrap;font-size:var(--pt-micro,12px);color:var(--texte-doux);margin-bottom:6px;line-height:1.4}'
  +'.pec-per b{color:var(--texte-med);font-weight:600}'
  +'.pec-ok{display:inline-flex;align-items:center;gap:5px;color:var(--vert-med);font-weight:600}'
  +'.pec-al{display:flex;align-items:center;gap:8px 11px;flex-wrap:wrap;padding:11px 14px;border-radius:13px;border:1px solid rgba(160,41,30,.35);background:var(--rouge-pale);font-size:var(--pt-txt,13px);color:var(--texte);line-height:1.35}'
  +'.pec-al .ic{display:inline-flex;color:var(--rouge);flex:none}'
  +'.pec-al .tx{flex:1;min-width:150px}'
  +'.pec-al.or{border-color:rgba(184,118,20,.4);background:var(--or-pale)}'
  +'.pec-al.or .ic{color:var(--orange)}'
  +'.pec-kpis.pec-k4{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}'
  +'.pec-k4 .pec-k{padding:13px 16px}'
  +'.pec-k4 .pec-k .v{font-size:var(--pt-lg,24px)}'
  +'.pec-jr{position:relative}'
  +'.pec-rep{position:absolute;top:-3px;bottom:-3px;width:2px;margin-left:-1px;border-radius:1px;background:var(--texte)}'
  +'.pec-lgr{display:inline-block;width:2px;height:13px;border-radius:1px;background:var(--texte);margin:0 4px;flex:none;text-decoration:none}'
  +'.pec-verdict .em{line-height:1;flex:none}'
  +'.pec-verdict .t{font-size:var(--pt-lg,24px);font-weight:600;color:var(--texte);line-height:1.22}'
  +'.pec-verdict .d{font-size:var(--pt-txt,13px);color:var(--texte-doux);margin-top:5px;line-height:1.6}'
  +'.pec-verdict .d b{color:var(--texte-med)}'
  // ★ MEME GRAMMAIRE QUE LA CARTE A TROIS ETAGES : filet dore devant, meme
  //   taille, meme encre. Partout ou ce filet apparait, la phrase qui suit dit
  //   SUR QUOI le chiffre au-dessus a ete calcule.
  //   ⚠️ Le texte est enveloppe dans un <span> : dans un conteneur flex, CHAQUE
  //     element enfant devient un item a part. Sans le span, le <b> du nom de
  //     campagne formait sa propre colonne et la phrase se coupait en morceaux.
  //     Vu a la capture, pas au preflight — aucun controle ne lit une mise en page.
  +'.pec-vcadre{display:flex;align-items:flex-start;gap:7px;margin-top:9px;font-size:var(--pt-micro,12px);line-height:1.45;color:var(--texte-doux)}'
  +'.pec-vcadre::before{content:"";width:2px;align-self:stretch;min-height:13px;border-radius:2px;background:var(--or);opacity:.85;flex:none;margin-top:1px}'
  +'.pec-vcadre>span{flex:1;min-width:0}'
  +'.pec-vcadre b{color:var(--texte-med)}'
  +'.pec-vgo{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}'
  +'.pec-pill{display:inline-block;font-size:var(--pt-lbl,12px);font-weight:600;border-radius:9px;padding:3px 9px;line-height:1.5}'
  +'.pec-mini{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1px;background:var(--gris-clair);border-radius:12px;overflow:hidden;border:1px solid var(--gris-clair)}'
  +'.pec-mini>div{background:var(--bg-card);padding:12px 14px}'
  +'.pec-mini .l{font-size:var(--pt-nano,11px);font-weight:600;letter-spacing:0;text-transform:none;color:var(--texte-doux)}'
  +'.pec-mini .v{font-size:var(--pt-lg,24px);font-weight:600;color:var(--texte);margin-top:2px;line-height:1.1;font-variant-numeric:lining-nums tabular-nums}'
  +'.pec-mini .v small{font-size:var(--pt-txt,13px);color:var(--texte-doux);font-weight:600}'
  +'.pec-mini .s{font-size:var(--pt-lbl,12px);color:var(--texte-doux);margin-top:2px;line-height:1.4}'
  +'.pec-empty{font-size:var(--pt-txt,13px);color:var(--texte-doux);font-style:italic;padding:14px 2px}'
  +'.pex-win{font-size:var(--pt-txt,13px);color:var(--texte-doux);font-weight:600}'
  +'.pex-win b{color:var(--texte)}'
  +'.pex-set{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}'
  +'.pex-setl{font-size:var(--pt-base,14px);font-weight:600;color:var(--texte)}'
  +'.pex-sets{font-size:var(--pt-micro,12px);color:var(--texte-doux);line-height:1.55;margin-top:3px;max-width:640px}'
  +'.pex-selm{padding:9px 11px;border:1.5px solid var(--gris-clair);border-radius:10px;font-family:inherit;font-size:var(--pt-base,14px);background:var(--bg-app);color:var(--texte);min-height:42px;box-sizing:border-box}'
  +'.pex-fopts{display:flex;flex-direction:column;gap:8px}'
  +'.pex-fopt{display:block;width:100%;text-align:left;border:1.5px solid var(--gris-clair);background:var(--bg-card);border-radius:12px;padding:11px 13px;cursor:pointer;font-family:inherit;color:var(--texte)}'
  +'.pex-fopt .t{display:block;font-size:var(--pt-base,14px);font-weight:600}'
  +'.pex-fopt .d{display:block;font-size:var(--pt-micro,12px);color:var(--texte-doux);line-height:1.5;margin-top:4px}'
  +'.pex-fopt.on{border-color:#3D6B27;background:#EAF3E2}'
  +'.pex-fopt.on .d{color:#3D6B27}'
  +'.pex-fopt:disabled{opacity:.62;cursor:default}'
  +'.pex-warn{border-left:3px solid var(--or);padding-left:13px}'
  +'.pex-warn .t{font-size:var(--pt-md,20px);font-weight:600;color:var(--texte);line-height:1.25}'
  +'.pex-warn .d{font-size:var(--pt-txt,13px);color:var(--texte-doux);margin-top:5px;line-height:1.6}'
  +'.pex-warn .d b{color:var(--texte-med)}'
  /* REV-1 — la sous-vue Revient (préfixe prv-, vérifié libre) */
  +'.prv-mils{display:flex;gap:6px;flex-wrap:wrap;margin:2px 0 12px}'
  +'.prv-mils button{border:1px solid var(--gris-clair);background:var(--bg-app);color:var(--texte-doux);border-radius:16px;padding:6px 13px;font-family:inherit;font-size:var(--pt-txt,13px);font-weight:600;cursor:pointer;min-height:36px}'
  +'.prv-mils button.on{background:var(--bg-card);color:var(--texte);border-color:var(--gris)}'
  +'.prv-e{display:inline-block;font-size:var(--pt-nano,11px);font-weight:600;letter-spacing:0;text-transform:none;border-radius:8px;padding:2px 7px;margin-left:6px}'
  +'.prv-e-p{background:var(--tag-amber-bg);color:var(--tag-amber-tx)}'
  +'.prv-e-c{background:var(--vert-pale);color:var(--vert-med)}'
  +'.prv-e-j{background:var(--tag-blue-bg);color:var(--tag-blue-tx)}'
  +'.prv-row{cursor:pointer}'
  +'.prv-row:hover td{background:var(--bg-app)}'
  +'.prv-chev{display:inline-block;width:14px;color:var(--texte-doux);transition:transform .15s}'
  +'.prv-row.open .prv-chev{transform:rotate(90deg)}'
  +'.prv-det td{background:var(--bg-app);font-size:var(--pt-micro,12px)}'
  +'.prv-det td:first-child{padding-left:28px}'
  +'.prv-hid{display:none}'
  +'.prv-tot td{font-weight:600;border-bottom:0}'
  +'.prv-tbl td:first-child{min-width:0}'
  +'.prv-jg{height:5px;background:var(--gris-clair);border-radius:3px;margin-top:4px;overflow:hidden;min-width:56px}'
  +'.prv-jg i{display:block;height:100%;background:var(--vert-med)}'
  +'.prv-jg i.est{background:repeating-linear-gradient(90deg,var(--orange) 0 4px,transparent 4px 7px)}'
  +'.prv-src{font-size:var(--pt-nano,11px);font-weight:600;border-radius:6px;padding:1px 6px;margin-left:4px;white-space:nowrap}'
  +'.prv-src.r{background:var(--vert-pale);color:var(--vert-med)}'
  +'.prv-src.h,.prv-src.m{background:var(--tag-amber-bg);color:var(--tag-amber-tx)}'
  +'.prv-src.n{background:var(--gris-clair);color:var(--texte-doux)}'
  +'.prv-src.x{background:var(--tag-orange-bg);color:var(--orange-tx)}'   /* SANSREC-1 : pas de récolte cette année */
  +'.prv-rep{color:var(--texte-doux)}'
  +'.prv-flux{display:flex;flex-wrap:wrap;align-items:stretch}'
  +'.prv-fx{flex:1;min-width:120px;padding:10px 12px;border:1px solid var(--gris-clair);border-radius:12px}'
  +'.prv-fx .l{font-size:var(--pt-nano,11px);font-weight:600;letter-spacing:0;text-transform:none;color:var(--texte-doux)}'
  +'.prv-fx .v{font-size:var(--pt-lg,24px);font-weight:600;color:var(--texte);font-variant-numeric:lining-nums tabular-nums}'
  +'.prv-fx .s{font-size:var(--pt-lbl,12px);color:var(--texte-doux);line-height:1.4}'
  +'.prv-ar{align-self:center;padding:0 6px;color:var(--or);font-size:var(--pt-sm,16px)}'
  +'.prv-complet{margin-top:12px;display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;padding:10px 12px;border:1px dashed var(--or);border-radius:10px;background:var(--or-pale)}'
  +'.prv-cl{font-size:var(--pt-lbl,12px);font-weight:600;letter-spacing:0;text-transform:none;color:var(--texte-doux)}'
  +'.prv-cv{font-size:var(--pt-xl,28px);font-weight:600;color:var(--texte)}'
  +'@media(max-width:640px){.prv-tbl{min-width:0;font-size:var(--pt-micro,12px)}.prv-tbl .prv-hs{display:none}.prv-tbl th,.prv-tbl td{padding:8px 4px;white-space:normal;letter-spacing:0}.prv-det td:first-child{padding-left:12px}.prv-tbl td:last-child{white-space:nowrap}.prv-jg{min-width:40px}}'
  +'@media(max-width:700px){.prv-ar{width:100%;text-align:center;transform:rotate(90deg);padding:2px 0}.prv-fx{min-width:100%}}'
  +'@media(max-width:640px){.pex-set{flex-direction:column}.pex-selm{width:100%}.pec-k{padding:13px 15px}.pec-k .v{font-size:var(--pt-xl,28px)}.pec-ct{font-size:var(--pt-md,20px)}.pec-verdict .t{font-size:var(--pt-md,20px)}.pec-subnav{align-items:flex-start}}';
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
// ════════════════════════════════════════════════════════════════════════════════
// ★★★ REV-1 (§194, 28/09/2026) — LE REVIENT : rendement, bouteilles et coût vigne
// ════════════════════════════════════════════════════════════════════════════════
// Nico : « mettre les rendements et bouteilles probables dans Économie, avec un coût
// de revient probable (on n'a que le coût vigne, pas la structure) ». Maquette v1
// validée (« go avec les recommandations »).
// Remplace la carte « Prix de revient » de la Synthèse, qui avait TROIS défauts :
//  ① elle divisait le coût de la PÉRIODE consultée par TOUTE la récolte — zoomée sur
//    « Vendanges », dix jours de coût pour un millésime entier (même faute que celle
//    corrigée le 12/08 sur « Deux façons de compter ») ;
//  ② elle convertissait à 1,3 kg/col (_pecKgB) quand la Cave compte au kg/hL du
//    Cuvier (135 kg/hL ≈ 1,01 kg/col) : ~28 % de bouteilles en moins. Son commentaire
//    disait « 1,3 kg/col ≈ 130 kg pour 1 hL » : c'était faux (130 kg/hL = 0,98 kg/col) ;
//  ③ avant vendange, elle prenait la récolte de l'an passé avec les coûts de cette année.
// LES RÈGLES :
//  · UN SEUL CADRE : le CYCLE du millésime, du lendemain de la dernière récolte M-1 à la
//    fin de la vendange M. ⚠️ Aucun moteur « euros de l'année vigne » n'existait (le
//    panneau des deux cadres ne compte que des HEURES de barème) : on rejoue donc
//    l'ENGAGÉ de la campagne — les moteurs DATÉS _ecoTempsVigne, _ecoTracHByParc,
//    _ecoGnrReel, _ecoPhytoByParc — sur la fenêtre du cycle. Consommer, pas dupliquer.
//  · UNE SEULE CONVERSION : celle de la Cave (_mlKgHl, 133 cols/hL).
//  · L'ESCALIER DU RENDEMENT, parcelle par parcelle : ① récolté cette année ② moyenne de
//    ses millésimes connus ③ moyenne constatée cette année dans son appellation ④ rien.
//    JAMAIS le plafond : c'est un maximum réglementaire, pas une prévision.
//  · LE RAISIN VENDU sort des bouteilles ET de leur coût, au prorata des kilos.
//  · Tout ce qui est calculé ici se lit dans une fonction PURE (_pecRevCalc) : c'est ce
//    qui rend le harnais possible (mv-harnais-revient).
var _PEC_REV_MIL = null;           // millésime consulté ; null = l'année en cours
function _pecRevPertesCfg(){ var v=Number(((window.CONFIG&&window.CONFIG.eco)||{}).pertes_elevage); return (isFinite(v)&&v>=0&&v<60)?v:5; }
function _pecRevAutres(){ var v=Number(((window.CONFIG&&window.CONFIG.eco)||{}).autres_charges); return (isFinite(v)&&v>0)?v:0; }
function _pecRevAuj(){
  var _n=new Date();
  return ((typeof window._mvAujIso==='function')&&window._mvAujIso())||_pexIso(_n.getFullYear(),_n.getMonth(),_n.getDate());
}
function _pecRevKgHl(){ var v=(typeof window._mlKgHl==='function')?Number(window._mlKgHl()):0; return (isFinite(v)&&v>0)?v:135; }
// Les dates de récolte d'un millésime, triées. La récolte datée est le seul signal
// SÛR d'une fin de vendange : un planning peut dire ce qui était prévu, pas ce qui
// a eu lieu.
function _pecRevRecDates(mil){
  var a=String(mil), out=[];
  ((window.CAVE_VENDANGE&&window.CAVE_VENDANGE.recoltes)||[]).forEach(function(r){
    var d=String((r&&r.date)||'').slice(0,10); if(d.slice(0,4)===a) out.push(d);
  });
  return out.sort();
}
// Les millésimes proposés : l'année en cours (le « probable »), puis les trois
// précédentes QUI ONT une récolte — en janvier, c'est l'an passé qu'on veut lire.
function _pecRevMils(){
  var y=parseInt(_pecRevAuj().slice(0,4),10), out=[y];
  for(var m=y-1;m>=y-3;m--) if(_pecRevRecDates(m).length) out.push(m);
  return out;
}
function _pecRevMil(){ var L=_pecRevMils(); return (_PEC_REV_MIL!=null && L.indexOf(_PEC_REV_MIL)>=0)?_PEC_REV_MIL:L[0]; }
// Le cycle du millésime : ses deux bornes, et D'OÙ vient chacune — l'écran le dit.
//   fin   : 'rec'  dernière récolte (vendange finie, ou millésime passé)
//           'plan' fin de vendange prévue par les fenêtres des tâches (à venir)
//           'auj'  ni l'un ni l'autre : le coût s'arrête à aujourd'hui
//   début : 'rec'  lendemain de la dernière récolte M-1
//           'an'   aucune récolte M-1 saisie : un an avant la fin
function _pecRevCycle(mil, auj){
  var y=parseInt(auj.slice(0,4),10);
  var rec=_pecRevRecDates(mil), prev=_pecRevRecDates(mil-1);
  var last=rec.length?rec[rec.length-1]:'';
  var reste=null;
  try{ reste=(typeof window._vendResteARentrer==='function')?window._vendResteARentrer(mil):null; }catch(e){ reste=null; }
  var nReste=(reste&&reste.lignes)?reste.lignes.length:null;
  var complet=!!(last && nReste===0);
  var plan=null;
  try{ var A=_pilAnnuelData(); if(A&&A.vend&&String(A.vend.fin).slice(0,4)===String(mil)) plan=A.vend; }catch(e){ plan=null; }
  var d1, src1;
  if(last && (complet || mil<y)){ d1=last; src1='rec'; }
  else if(plan && String(plan.fin).slice(0,10)>=auj){ d1=String(plan.fin).slice(0,10); src1='plan'; }
  else { d1=auj; src1='auj'; }
  var d0, src0;
  if(prev.length){ d0=_pexJourApres(prev[prev.length-1]); src0='rec'; }
  else { d0=_pexJourApres((parseInt(d1.slice(0,4),10)-1)+d1.slice(4)); src0='an'; }
  return { d0:d0, d1:d1, src0:src0, src1:src1, complet:complet, nReste:nReste, last:last };
}
// Main-d'œuvre PRÉVUE entre deux dates : les heures au champ que le planning annonce,
// au taux chargé du jour. Même population que _ecoTempsVigne (bureau exclu). ⚠️ Le
// futur ne sait ni le tracteur ni la cave : ce prévu est un peu haut, la fiche le dit.
function _pecRevPrevuMO(d0, d1){
  if(typeof window._planChampPersRange!=='function' || !(d1>=d0)) return 0;
  var rate0=0; try{ rate0=Number(_ecoRate())||0; }catch(e){ rate0=0; }
  var okPer=(typeof window._mvEnContratSurPeriode==='function'), eur=0;
  (window.MEMBRES||[]).forEach(function(m){
    if(!m||!m.nom) return;
    if(okPer ? !window._mvEnContratSurPeriode(m,d0,d1) : (m.statut==='Inactif'||m.bureau)) return;
    for(var d=d0, g=0; d<=d1 && g<800; d=_pexJourApres(d), g++){
      var h=0; try{ h=Number(window._planChampPersRange(m,_pexD(d),_pexD(d)))||0; }catch(e){ h=0; }
      if(!(h>0)) continue;
      // (NaN comme 0 retombent sur le taux moyen : le test ci-dessous couvre les deux)
      var tx=0; try{ tx=(typeof window._mvPaieTauxEffAt==='function')?Number(window._mvPaieTauxEffAt(m,d)):0; }catch(e){ tx=0; }
      if(!(tx>0)) tx=rate0;
      eur+=h*tx;
    }
  });
  return eur;
}
// Le coût du cycle, parcelle par parcelle. C'est l'ENGAGÉ de la campagne (moReel +
// tracteur + GNR + phyto, _pecData) rejoué sur les dates du cycle, plus le prévu de
// main-d'œuvre jusqu'à la fin de vendange quand elle est à venir.
//   · MO : les euros versés aux parcelles par _ecoTempsVigne ; ce qui attend une
//     validation est réparti comme ce qui est versé (à défaut, à la surface) — la
//     vigne entière a coûté ces heures, elles ne se perdent pas ;
//   · tracteur : le coût des sessions, parcelle par parcelle ;
//   · GNR : les pleins (sinon le modèle), répartis aux heures machine — même clé que
//     _pecData ; à la surface sans aucune heure ;
//   · phyto : doses × surface × prix, parcelle par parcelle.
function _pecRevCouts(cy, auj, parc){
  var out={ by:{}, tot:{mo:0, prevu:0, trac:0, gnr:0, phy:0, pre:0}, fin:'', ok:false, tvOk:false, nSansTaux:0, gnrSrc:'', arrEur:0, nArr:0 };
  parc.forEach(function(p){ out.by[p.nom]={mo:0, trac:0, gnr:0, phy:0, pre:0}; });
  var surfT=0; parc.forEach(function(p){ surfT+=parseFloat(p.surface)||0; });
  function partSurf(p){ return surfT>0?((parseFloat(p.surface)||0)/surfT):0; }
  if(auj>=cy.d0){
    var fin=(cy.d1<auj)?cy.d1:auj, win={d0:cy.d0, d1:fin};
    out.fin=fin; out.ok=true;
    var TV=null; try{ TV=_ecoTempsVigne(win); }catch(e){ TV=null; }
    if(TV&&TV.ok){
      out.tvOk=true; out.nSansTaux=TV.nSansTaux||0;
      var att=0; parc.forEach(function(p){ var q=TV.parcs[p.nom]; att+=(q&&q.eur)||0; });
      parc.forEach(function(p){
        var q=TV.parcs[p.nom], sh=(att>0)?(((q&&q.eur)||0)/att):partSurf(p);
        out.by[p.nom].mo=TV.eur*sh;
      });
      out.tot.mo=TV.eur;
    }
    var tr=null; try{ tr=_ecoTracHByParc(win); }catch(e){ tr=null; }
    var hT=0;
    if(tr) parc.forEach(function(p){ var c=(tr.cost&&tr.cost[p.nom])||0; out.by[p.nom].trac=c; out.tot.trac+=c; hT+=(tr.h&&tr.h[p.nom])||0; });
    var g=null; try{ g=_ecoGnrReel(win); }catch(e){ g=null; }
    var gT=0;
    if(g&&g.ok) gT=g.eur||0;
    else if(tr) Object.keys(tr.gnrByDate||{}).forEach(function(k){ gT+=tr.gnrByDate[k]||0; });
    out.gnrSrc=(g&&g.ok)?'reel':'modele';
    parc.forEach(function(p){ var sh=(hT>0)?(((tr.h&&tr.h[p.nom])||0)/hT):partSurf(p); out.by[p.nom].gnr=gT*sh; });
    out.tot.gnr=gT;
    var ph=null; try{ ph=_ecoPhytoByParc(win); }catch(e){ ph=null; }
    if(ph) parc.forEach(function(p){ var c=(ph.cost&&ph.cost[p.nom])||0; out.by[p.nom].phy=c; out.tot.phy+=c; });
    // ★★ ARRACH-5 — L'ARRACHAGE ET LES PRESTATIONS PÈSENT SUR LA BOUTEILLE. Nico : « le coût
    //   d'arrachage et des travaux effectués sur l'année doit peser sur le prix de la bouteille ».
    //   · La main-d'œuvre d'arrachage y était déjà : TV.eur entier est réparti sur les vignes en
    //     place (les heures versées à une arrachée ne sortent pas du total, elles changent de clé).
    //   · Ce qui manquait : le tracteur et le phyto posés sur une parcelle ARRACHÉE (elle n'est pas
    //     dans `parc`), et toute PRESTATION (_ecoPrestaByParc). Une prestation sur une vigne en place
    //     va à cette vigne ; ce qu'a coûté une vigne arrachée se répartit à la SURFACE sur les vignes
    //     en place — elle ne donne pas de vin, le domaine en porte la charge.
    var prs=null; try{ prs=_ecoPrestaByParc(win); }catch(e){ prs=null; }
    var dansParc={}; parc.forEach(function(p){ dansParc[p.nom]=1; });
    var arrE=0, nA={};
    (window.PARCELLES||[]).forEach(function(p){
      if(!p || p.nom==null || dansParc[p.nom] || p.statut!=='Arrachee') return;
      var e=((tr&&tr.cost&&tr.cost[p.nom])||0)+((ph&&ph.cost&&ph.cost[p.nom])||0)+((prs&&prs.cost&&prs.cost[p.nom])||0);
      if(e>0){ arrE+=e; nA[p.nom]=1; }
    });
    parc.forEach(function(p){
      var c=((prs&&prs.cost&&prs.cost[p.nom])||0)+arrE*partSurf(p);
      out.by[p.nom].pre=c; out.tot.pre+=c;
    });
    out.arrEur=arrE; out.nArr=Object.keys(nA).length;
  }
  if(cy.d1>auj){
    var d0p=(auj>=cy.d0)?_pexJourApres(auj):cy.d0;
    var pv=_pecRevPrevuMO(d0p, cy.d1);
    out.tot.prevu=pv;
    parc.forEach(function(p){ out.by[p.nom].mo+=pv*partSurf(p); });
  }
  return out;
}
// ★ SANSREC-1 (§332) — LE COÛT D'UNE VIGNE NON RÉCOLTÉE SE REPORTE SUR LES AUTRES. Une parcelle en place que l'on ne vendange pas
//   cette année (sans récolte saisie, la Vendange désactivée pour chaque période de l'année qui la porte : _vendResteARentrer().sans)
//   ne donne pas de vin ; ce qu'elle a coûté sur le cycle, poste par poste, se répartit à la SURFACE sur les autres vignes en place —
//   même règle qu'une arrachée (ARRACH-5), sauf que les postes restent les leurs (c'est de la culture, pas de l'arrachage).
//   C.by est modifié en place ; rend { eur, n, ha, noms }. Aucune autre vigne : rien n'est déplacé (et rien n'est compté).
function _pecRevReport(C, parc, SR){
  var out={ eur:0, n:0, ha:0, noms:[] }, POST=['mo','trac','gnr','phy','pre'], surfA=0;
  parc.forEach(function(p){ if(!SR[p.nom]&&C.by[p.nom]) surfA+=parseFloat(p.surface)||0; });
  if(!(surfA>0)) return out;
  parc.forEach(function(p){
    var b=SR[p.nom]?C.by[p.nom]:null; if(!b) return;
    out.n++; out.noms.push(p.nom); out.ha+=parseFloat(p.surface)||0;
    POST.forEach(function(x){
      var v=Number(b[x])||0; b[x]=0; if(!v) return;
      out.eur+=v;
      parc.forEach(function(q){ if(!SR[q.nom]&&C.by[q.nom]) C.by[q.nom][x]=(Number(C.by[q.nom][x])||0)+v*((parseFloat(q.surface)||0)/surfA); });
    });
  });
  return out;
}
// Les rendements d'un millésime, par nom de parcelle — _mlRendements, la source de
// la Cave (escalier des volumes VD-3). On la lit, on ne la refait pas.
function _pecRevRdtMap(m){
  var out={}; if(typeof window._mlRendements!=='function') return out;
  var L=[]; try{ L=window._mlRendements(m)||[]; }catch(e){ L=[]; }
  L.forEach(function(o){ if(o&&o.parcelle&&o.parcelle.nom) out[o.parcelle.nom]=o; });
  return out;
}
// Le rendement d'une parcelle sur un millésime PASSÉ : la Cave s'il est suivi au
// Cuvier, sinon l'historique de la parcelle (rendement_hist, saisies anciennes).
function _pecRevHistHa(p, m, RD, kgHl){
  var o=RD[m]&&RD[m][p.nom]; if(o&&o.hlHa>0) return o.hlHa;
  var s=parseFloat(p.surface)||0; if(!(s>0)) return null;
  var hl=0, vu=false;
  (Array.isArray(p.rendement_hist)?p.rendement_hist:[]).forEach(function(e){
    if(!e||Number(e.millesime)!==m) return;
    var v=e.vol||null, x=0;
    if(v&&Number(v.hl)>0) x=Number(v.hl)+Math.max(0,Number(v.kg_manquants)||0)/kgHl;
    else { var kg=Number(e.kg)||0; if(!(kg>0)&&Number(e.kg_ha)>0) kg=Number(e.kg_ha)*s; x=kg/kgHl; }
    if(x>0){ hl+=x; vu=true; }
  });
  return vu?(hl/s):null;
}
// La récolte d'une parcelle : volume de la parcelle entière (le hL/ha réglementaire),
// et la PART DU DOMAINE — ce qui deviendra des bouteilles, et la part du coût
// qu'elles portent (prorata des kilos). Le reste est du raisin vendu.
function _pecRevRec(o, p, kgHl){
  var s=parseFloat(p.surface)||0, kg=Number(o.kg)||0;
  var hlTot=(o.hlHa!=null&&s>0)?(o.hlHa*s):(kg/kgHl);
  var parts=(o.rdt&&o.rdt.parts)||[], dp=null;
  parts.forEach(function(x){ if(x&&x.dom) dp=x; });
  if(!o.vendu || !parts.length) return { hlTot:hlTot, domHl:hlTot, domShare:1, kg:kg, kgVendu:0 };
  if(!dp || !(dp.kg>0)) return { hlTot:hlTot, domHl:0, domShare:0, kg:kg, kgVendu:kg };
  var domHl=(Number(dp.hl)||0)+Math.max(0,dp.kg-(Number(dp.connu)||0))/kgHl;
  return { hlTot:hlTot, domHl:domHl, domShare:(kg>0?Math.min(1,dp.kg/kg):1), kg:kg, kgVendu:Math.max(0,kg-dp.kg) };
}
function _pecRevAoc(p){
  var a=null; try{ a=(typeof window._vendAocDe==='function')?window._vendAocDe(p):null; }catch(e){ a=null; }
  return (a&&a.nom)||String((p&&p.appellation)||'').trim()||'Sans appellation';
}
// La part des anges MESURÉE : le dernier millésime entièrement mis en bouteille,
// bouteilles × 0,75 L contre le volume décuvé. Une valeur hors de [0 ; 40 %] est une
// saisie incomplète, pas une perte : on l'écarte et le réglage sert.
function _pecRevPertesMes(mil){
  if(typeof window._mlChaine!=='function') return null;
  for(var m=mil-1;m>=mil-3;m--){
    var ch=null; try{ ch=window._mlChaine(m); }catch(e){ ch=null; }
    if(!ch||!(ch.hlDecuve>0)||!(ch.btl>0)||ch.hlCuve>0||ch.hlFut>0) continue;
    var q=1-ch.btl*0.0075/ch.hlDecuve;
    if(q>=0&&q<=0.4) return { pct:Math.round(q*1000)/10, mil:m };
  }
  return null;
}
// ★ LE CALCUL, PUR : ni DOM ni globale. P = [{nom, surf, aoc, max, cout:{mo,trac,gnr,phy},
//   rec:null|{hlTot, domHl, domShare, kg, kgVendu}, hist:[hL/ha…]}], pertes en %.
function _pecRevCalc(P, pertes){
  var k=Math.max(0,1-(Number(pertes)||0)/100)*100/0.75;      // cols de 75 cl par hL logé
  var POST=['mo','trac','gnr','phy','pre'];   // pre : arrachage et prestations (ARRACH-5)
  var moy={};
  P.forEach(function(p){
    if(p.rec&&p.surf>0&&p.rec.hlTot>0){ var q=moy[p.aoc]||(moy[p.aoc]={hl:0,ha:0}); q.hl+=p.rec.hlTot; q.ha+=p.surf; }
  });
  var T={ ha:0, haAvec:0, haSans:0, nSans:0, hl:0, domHl:0, cols:0, cout:0, coutDom:0, coutSans:0,
          coutVendu:0, kgVendu:0, kgPese:0, nR:0, n:0, haX:0, nX:0, po:{mo:0, trac:0, gnr:0, phy:0, pre:0} };
  var G={}, ordre=[];
  function grp(a){ var g=G[a]; if(!g){ g=G[a]={ aoc:a, ha:0, haAvec:0, hl:0, domHl:0, cols:0, coutDom:0, est:false, nR:0, n:0, maxs:[], rows:[] }; ordre.push(a); } return g; }
  var rows=P.map(function(p){
    if(p.sansRec){   // ★ SANSREC-1 (§332) : pas de récolte cette année — ni rendement, ni bouteilles, hors « constaté » ; son coût est déjà reporté
      var rx={ nom:p.nom, aoc:p.aoc, surf:p.surf, max:p.max, src:'x', hlha:null, hl:0, domHl:0, share:1, cols:0, cout:0, coutDom:0, eurCol:null };
      var gx=grp(p.aoc); gx.ha+=p.surf; gx.rows.push(rx);
      if(p.max!=null && gx.maxs.indexOf(p.max)<0) gx.maxs.push(p.max);
      T.ha+=p.surf; T.haX+=p.surf; T.nX++;
      return rx;
    }
    var src='n', hlha=null, hlTot=0, domHl=0, share=1;
    if(p.rec && ((p.rec.hlTot>0)||(p.rec.kg>0))){
      src='r'; hlTot=p.rec.hlTot||0; hlha=(p.surf>0)?(hlTot/p.surf):null;
      domHl=p.rec.domHl||0; share=(p.rec.domShare!=null)?p.rec.domShare:1;
    } else if(p.hist&&p.hist.length){
      src='h'; var sh=0; p.hist.forEach(function(x){ sh+=x; }); hlha=sh/p.hist.length;
    } else if(moy[p.aoc]&&moy[p.aoc].ha>0){
      src='m'; hlha=moy[p.aoc].hl/moy[p.aoc].ha;
    }
    if(src==='h'||src==='m'){ hlTot=hlha*p.surf; domHl=hlTot; }
    var c=p.cout||{}, cout=0, po={};
    POST.forEach(function(x){ var v=Number(c[x])||0; po[x]=v; cout+=v; });
    var avec=(src!=='n');
    var r={ nom:p.nom, aoc:p.aoc, surf:p.surf, max:p.max, src:src, hlha:hlha, hl:hlTot, domHl:domHl, share:share,
            cols:avec?domHl*k:0, cout:cout, coutDom:avec?cout*share:0 };
    r.eurCol=(r.cols>0)?(r.coutDom/r.cols):null;
    var g=grp(p.aoc);
    g.ha+=p.surf; g.n++; g.rows.push(r);
    if(p.max!=null && g.maxs.indexOf(p.max)<0) g.maxs.push(p.max);
    T.ha+=p.surf; T.n++; T.cout+=cout;
    if(avec){
      g.haAvec+=p.surf; g.hl+=hlTot; g.domHl+=domHl; g.cols+=r.cols; g.coutDom+=r.coutDom;
      if(src==='r'){ g.nR++; T.nR++; } else g.est=true;
      T.haAvec+=p.surf; T.hl+=hlTot; T.domHl+=domHl; T.cols+=r.cols; T.coutDom+=r.coutDom;
      POST.forEach(function(x){ T.po[x]+=po[x]*share; });
      if(src==='r'){ T.coutVendu+=cout*(1-share); T.kgVendu+=(p.rec.kgVendu||0); T.kgPese+=(p.rec.kg||0); }
    } else { T.haSans+=p.surf; T.nSans++; T.coutSans+=cout; }
    return r;
  });
  var aoc=ordre.map(function(n){
    var g=G[n];
    g.hlha=(g.haAvec>0)?(g.hl/g.haAvec):null;
    g.eurCol=(g.cols>0)?(g.coutDom/g.cols):null;
    g.maxs.sort(function(a,b){ return a-b; });
    return g;
  }).sort(function(a,b){ return (b.ha-a.ha) || (a.aoc<b.aoc?-1:1); });
  T.hlha=(T.haAvec>0)?(T.hl/T.haAvec):null;
  T.eurCol=(T.cols>0)?(T.coutDom/T.cols):null;
  var etat=(T.n>0 && T.nR===T.n)?'cons':((T.haAvec>0)?'prob':'vide');
  return { rows:rows, aoc:aoc, tot:T, etat:etat, k:k };
}
// Tout ce que l'écran lit, rassemblé. Aucune règle ici : elles sont au-dessus.
function _pecRevData(mil){
  var auj=_pecRevAuj(), M=(mil!=null)?mil:_pecRevMil(), kgHl=_pecRevKgHl();
  var parc=(window.PARCELLES||[]).filter(function(p){ return p && p.nom && p.statut!=='Arrachee'; });
  var cy=_pecRevCycle(M, auj);
  var C=_pecRevCouts(cy, auj, parc);
  var RD={};
  for(var m=M;m>=M-3;m--) RD[m]=_pecRevRdtMap(m);
  // ★ SANSREC-1 (§332) : les parcelles « pas de récolte cette année » — la liste du Cuvier, une seule source (une récolte saisie
  //   l'en sort d'elle-même) ; leur coût se reporte sur les autres vignes avant le calcul.
  var SR={}, RR=null;
  try{ RR=(typeof window._vendResteARentrer==='function')?window._vendResteARentrer(M):null; }catch(e){ RR=null; }
  ((RR&&RR.sans)||[]).forEach(function(e){ if(e&&e.p&&e.p.nom!=null) SR[e.p.nom]=1; });
  var REP=_pecRevReport(C, parc, SR);
  var P=parc.map(function(p){
    var o=RD[M][p.nom]||null, hist=[];
    for(var m2=M-1;m2>=M-3;m2--){ var h=_pecRevHistHa(p,m2,RD,kgHl); if(h!=null&&h>0) hist.push(h); }
    var mx=null; try{ mx=(typeof window._vendRdtMax==='function')?window._vendRdtMax(p,M).max:null; }catch(e){ mx=null; }
    return { nom:p.nom, surf:parseFloat(p.surface)||0, aoc:_pecRevAoc(p), max:mx,
             cout:C.by[p.nom], rec:o?_pecRevRec(o,p,kgHl):null, hist:hist, sansRec:!!SR[p.nom] };
  });
  var pm=_pecRevPertesMes(M), pertes=pm?pm.pct:_pecRevPertesCfg();
  var R=_pecRevCalc(P, pertes);
  R.mil=M; R.cy=cy; R.couts=C; R.kgHl=kgHl; R.pertes=pertes; R.pertesMes=pm; R.auj=auj; R.rep=REP;
  R.autres=_pecRevAutres(); R.mils=_pecRevMils();
  return R;
}
// Journee de reference : REPLI de _pilEchCadence (Echeances par tache) quand le planning ne donne
// aucune presence mesuree sur 28 jours (et hPers quand il ne la mesure pas). COH-1 (03/10) : son
// texte disait « base de l'ecart de cadence » — faux depuis que la cadence lit le planning
// (_pecCadPresence). Defaut 7 h. _pecData la recopie encore dans `cad`, sans lecteur.
// UN SEUL lecteur : le defaut vivait en dur dans _pecData, il y aurait diverge du jour
// ou le champ est devenu reglable.
function _pecHJour(){ var v=Number(((window.CONFIG&&window.CONFIG.eco)||{}).h_jour); return (isFinite(v)&&v>0)?v:7; }

// ── Moteur : budget / engagé / reste, par parcelle ET par travail ────
// Les heures viennent de _opParcFull (budget) et _opParcReste (restant), c.-à-d.
// EXACTEMENT le même moteur que l'ordre de passage et le simulateur de renfort.
// Aucune troisième définition de « combien d'heures » dans ce fichier.
// ── Presence reelle du domaine sur la periode consultee ──────────────
// Source unique : _planChampPersRange (planning.js) — les heures DANS LES RANGS.
// ★★ CHAMP-2 (23/09/2026) — Nico : « on la passe sur la meme lecture » que Decider.
//   Avant : _planWorkPersRange, le travail effectif de la loi — une formation ou un
//   evenement familial y valaient la journee, et gonflaient la presence face au bareme
//   (le biais « bareme un peu serre » s'en trouvait accru). Economie > Exercice et le
//   taux horaire, qui parlent d'heures PAYEES, restent sur 'work'/'paid'.
//
// ⚠ FENETRE : bornee a aujourd'hui, mais on verifie d'ABORD que la periode a
// commence. Sans ce test, une periode a venir (debut 10/08 alors qu'on est le 09)
// donne une fenetre a l'envers : la boucle ne tourne pas une seule fois et tout
// sort a zero, sans erreur et sans trace. Meme famille que _mvFutParc() appelee
// sans arguments. Vecu pendant la mesure qui a mene a ce lot.
var _PEC_CAD_AVC = 0.40;   // avancement minimum pour afficher la cadence
// ★ Bornes de bon sens sur le facteur de cadence (1 + ecart). Hors de [0,5 ; 3] on
//   ne mesure plus une cadence, on mesure un trou de saisie : l'ecart reste LU
//   (verdict, tuiles) mais n'est APPLIQUE ni au budget projete ni a la date de
//   fin. Une seule borne pour les euros et pour les jours — elle ne vivait que
//   dans l'ex-_pilCapaProj, cote date (10/09/2026) ; _pilFacteurK la lit ici.
var _PEC_CAD_KMIN = 0.5, _PEC_CAD_KMAX = 3;
function _pecCadPresence(){
  var s=(typeof window._pilSaison==='function')?window._pilSaison():null;
  if(!s||!s.debut||!s.fin) return null;
  if(typeof window._planChampPersRange!=='function') return null;
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
    try{ v=Number(window._planChampPersRange(m,D0,D1))||0; }
    catch(e){ if(window.logError) window.logError({level:'info',cat:'eco',msg:'cadence presence '+(m.nom||'')}); }
    if(v>0){ h+=v; n++; }
  });
  if(!(h>0)) return null;
  return { h:h, n:n, d0:d0, d1:d1 };
}

// ★★★ MARCHE 2 DE L'ESCALIER — la meme periode, la campagne d'avant (backlog 7, §20b).
// Rend {hReel,hBar,ecart,nom,d0,d1,nMbr} ou null. Chaque garde renvoie null plutot que
// d'inventer : une marche vide se lit deja correctement a l'ecran (marche 3).
//
// ⚠️ hBar vient du SNAPSHOT (`stats.hFaites`, ecrit par _calcHistoStats a l'archivage) :
//   c'est la seule grandeur de la periode passee qu'on ne peut pas recalculer, TRAVAUX
//   ayant ete remis a zero au changement de campagne.
// ⚠️ hReel se RECALCULE, lui, sur le planning : PLANNING_ENTRIES est cle par annee et
//   n'est jamais purge. _planWorkPersRange est annee-aware (_planCtxYear), une fenetre
//   d'aout a juillet traverse donc deux annees civiles sans se tromper.
// ⚠️ Les membres sont filtres sur LEUR contrat de l'epoque, pas sur l'effectif du jour :
//   sinon un saisonnier parti l'an dernier disparaitrait de sa propre periode.
function _pecCadHisto(hBarCourant){
  if(typeof _pilCmpSnapshot!=='function') return null;
  var snap=null;
  try{ snap=_pilCmpSnapshot(); }catch(e){ return null; }
  if(!snap || !snap.stats) return null;
  var hBar=Number(snap.stats.hFaites)||0;
  if(!(hBar>0)) return null;
  // Les dates viennent de SAISONS, pas du snapshot : une periode supprimee de SAISONS
  // n'est plus datable, et on ne devine pas une fenetre.
  var per=(typeof _pilCmpPeriode==='function')?_pilCmpPeriode(snap.saisonNom):null;
  if(!per || !per.debut || !per.fin) return null;
  var d0=String(per.debut).slice(0,10), d1=String(per.fin).slice(0,10);
  if(d1<d0) return null;
  if(typeof window._planChampPersRange!=='function') return null;
  var okPer=(typeof window._mvEnContratSurPeriode==='function');
  var mbrs=(window.MEMBRES||[]).filter(function(m){
    if(!m||!m.nom) return false;
    return okPer ? window._mvEnContratSurPeriode(m,d0,d1) : (m.statut!=='Inactif');
  });
  if(!mbrs.length) return null;
  var D0=_pexD(d0), D1=_pexD(d1), pres=0, n=0;
  mbrs.forEach(function(m){
    var v=0;
    try{ v=Number(window._planChampPersRange(m,D0,D1))||0; }
    catch(e){ if(window.logError) window.logError({level:'info',cat:'eco',msg:'cadence histo '+(m.nom||'')}); }
    if(v>0){ pres+=v; n++; }
  });
  if(!(pres>0)) return null;
  // Tracteur de CETTE fenetre : _ecoTracHByParc accepte deja une fenetre de dates, et
  // SESSIONS n'est pas purge au changement de campagne. Somme des heures, tous parcs.
  var hTrac=0;
  try{
    var tw=_ecoTracHByParc({d0:d0,d1:d1});
    Object.keys(tw.h||{}).forEach(function(k){ hTrac+=(tw.h[k]||0); });
  }catch(e){ hTrac=0; }
  var hReel=Math.max(0, pres-hTrac);
  if(!(hReel>0)) return null;
  return { hReel:hReel, hBar:hBar, ecart:((hReel-hBar)/hBar),
           nom:String(snap.saisonNom||''), d0:d0, d1:d1, nMbr:n, hTrac:hTrac };
}

// ★★ ARRACH-4 (02/10/2026) — LES PRESTATIONS : ce qu'un prestataire a facturé pour une étape
//   d'arrachage (ARRACH-3 : j.presta, j.prestaMontant). Source : le JOURNAL, la seule trace datée.
//   · Une étape se rejoue dans l'ordre (date, puis ordre de saisie) : « Annulé » l'efface, une
//     revalidation remplace la précédente — jamais deux factures pour une étape.
//   · Posée à la DATE DE L'ÉTAPE, sur SA parcelle.
//   · Un montant absent n'est pas zéro : il est compté à part (nSansPrix) et l'écran le dit.
function _ecoPrestaByParc(win){
  var out={ cost:{}, byDate:{}, tot:0, n:0, nSansPrix:0 };
  var d0='', d1='';
  if(win && win.d0 && win.d1){ d0=String(win.d0).slice(0,10); d1=String(win.d1).slice(0,10); }
  else { var s=(typeof window._pilSaison==='function')?window._pilSaison():null;
         d0=(s&&s.debut)?String(s.debut).slice(0,10):''; d1=(s&&s.fin)?String(s.fin).slice(0,10):''; }
  if(!d0 || !d1 || d1<d0) return out;
  function _ts(j){ var n=parseInt(String(j.id||''),16); return isFinite(n)?n:0; }
  var J=(window.JOURNAL||[]).filter(function(j){ return j && !j.meteo && j.parcelle && j.date && j.etape; }).slice();
  J.sort(function(a,b){ var da=String(a.date).slice(0,10), db=String(b.date).slice(0,10);
    return da<db?-1:(da>db?1:(_ts(a)-_ts(b))); });
  var last={};
  J.forEach(function(j){
    var k=String(j.parcelle)+'\u0000'+String(j.tache||'')+'\u0000'+String(j.etape);
    var st=String(j.statut||'');
    if(st==='Annul\u00e9') { delete last[k]; return; }   // (forme distincte : ancre d'injection de mv-harnais-temps-vigne)
    if(st!=='Valid\u00e9') return;
    if(j.presta) last[k]=j; else delete last[k];
  });
  Object.keys(last).forEach(function(k){
    var j=last[k], iso=String(j.date).slice(0,10);
    if(iso<d0 || iso>d1) return;
    out.n++;
    var e=Number(j.prestaMontant);
    if(!(e>0)){ out.nSansPrix++; return; }
    out.cost[j.parcelle]=(out.cost[j.parcelle]||0)+e;
    out.byDate[iso]=(out.byDate[iso]||0)+e;
    out.tot+=e;
  });
  return out;
}
function _pecData(){
  var cfg=_ecoCfg(), rate=_ecoRate();
  var tracH=_ecoTracHByParc(), phy=_ecoPhytoByParc();
  var eqp=_ecoEquipeByParc(), ret=_ecoRetardByParc(), rcfg=_ecoRetardCfg();
  var defs=_ecoAllDefs();
  var prs=_ecoPrestaByParc();
  // ★★ ARRACH-4 — UNE PARCELLE ARRACHÉE QUI A COÛTÉ ENTRE AU TABLEAU. Elle en sortait toujours :
  //   les heures d'arrachage versées sur elle (temps réel), son tracteur, ses prestations restaient
  //   hors des lignes, alors que l'argent était dépensé. Elle n'entre que si elle a coûté sur la
  //   période, SANS barème (le barème des travaux de la saison ne s'applique plus à une vigne
  //   arrachée) et SANS surface au total (les €/ha du domaine restent ceux des vignes en place).
  var TV0=null; try{ TV0=_ecoTempsVigne(); }catch(e){ TV0=null; }
  var parc=(window.PARCELLES||[]).filter(function(p){
    if(!p) return false;
    if(p.statut!=='Arrachee') return true;
    var q=(TV0&&TV0.ok&&TV0.parcs)?TV0.parcs[p.nom]:null;
    return !!((q&&q.eur>0) || (tracH.h[p.nom]||0)>0 || (tracH.cost[p.nom]||0)>0 || (phy.cost[p.nom]||0)>0 || (prs.cost[p.nom]||0)>0);
  });
  // ── Carburant : enveloppe reelle + cle de repartition ────────────────
  var gnrR=_ecoGnrReel();
  // Cle = heures machine par parcelle. Repli SURFACE si aucune heure n'a ete saisie
  // sur la campagne : sans lui, une enveloppe reelle de 900 L n'irait nulle part et
  // le carburant retomberait a zero alors qu'on le connait au litre pres.
  var _kBy={}, _kSum=0, _kSurf=false;
  parc.forEach(function(p){ var k=tracH.h[p.nom]||0; _kBy[p.nom]=k; _kSum+=k; });
  if(!(_kSum>0)){
    _kSurf=true; _kSum=0;
    parc.forEach(function(p){ var k=(p.statut==='Arrachee')?0:(parseFloat(p.surface)||0); _kBy[p.nom]=k; _kSum+=k; });   // ARRACH-4 : pas de carburant « à la surface » sur une vigne arrachée
  }
  var _gnrOn = gnrR.ok && _kSum>0;
  var rows=[], tasks={}, tOrder=[], pairs=[];
  var T={ bH:0,fH:0,rH:0, moB:0,moF:0,moR:0, tracF:0,tracH:0, gnrF:0, litres:0, phyF:0,
          surf:0, retH:0, retE:0, nRet:0, nReel:0, trous:0, plantH:0, plantE:0, nSansTaux:0, prestF:0, nArr:0 };
  parc.forEach(function(p){
    var surf=parseFloat(p.surface)||0;
    var eq=eqp[p.nom]||null;
    var tx=(eq&&eq.taux>0)?eq.taux:rate;
    var src=(eq&&eq.taux>0)?'reel':'moyen';
    var bH=0, fH=0, rH=0, tks=[];
    var arr=(p.statut==='Arrachee');   // ARRACH-4
    defs.forEach(function(def){
      if(arr || !def || !_opApplic(p,def)) return;
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
    var thH=tracH.h[p.nom]||0, tracF=tracH.cost[p.nom]||0, thCo=(tracH.hCo&&tracH.hCo[p.nom])||0;   // COEQ-4 (§525)
    var litres, gnrF;
    if(_gnrOn){ var _q=(_kBy[p.nom]||0)/_kSum; litres=gnrR.L*_q; gnrF=gnrR.eur*_q; }
    else { litres=thH*cfg.conso; gnrF=litres*cfg.gnrL; }
    var phyF=phy.cost[p.nom]||0;
    var prestF=prs.cost[p.nom]||0;   // ARRACH-4
    var reel=tracF+gnrF+phyF+prestF;
    var rr=ret[p.nom]||null, retH=rr?rr.h:0, retE=retH*tx;
    var pl=_ecoParcPlant(p);
    var budget=bH*tx+reel, engage=fH*tx+reel, resteE=rH*tx;
    rows.push({ nom:p.nom, surf:surf, tx:tx, src:src,
      bH:bH, fH:fH, rH:rH, pct:(bH>0?fH/bH*100:100),
      moB:bH*tx, moF:fH*tx, moR:resteE,
      thH:thH, tracF:tracF, litres:litres, gnrF:gnrF, phyF:phyF, prestF:prestF, arr:arr,
      condu:(tracH.qui[p.nom]||null),
      budget:budget, engage:engage, reste:resteE,
      coutHa:(surf>0?budget/surf:0), engHa:(surf>0?engage/surf:0),
      retH:retH, retE:retE, retSem:(rr?rr.sem:0),
      trous:pl.trous, plantH:pl.h, plantE:pl.h*tx,
      etp:(eq?eq.etp:0), nj:(eq?eq.nj:0), noms:(eq?eq.noms:[]), reste_taches:tks });
    T.bH+=bH; T.fH+=fH; T.rH+=rH;
    T.moB+=bH*tx; T.moF+=fH*tx; T.moR+=resteE;
    T.tracF+=tracF; T.tracH+=thH; T.tracHCo=(T.tracHCo||0)+thCo; T.gnrF+=gnrF; T.litres+=litres; T.phyF+=phyF;
    if(!arr) T.surf+=surf; else T.nArr++;
    T.prestF+=prestF;
    T.retH+=retH; T.retE+=retE; if(retE>0) T.nRet++;
    if(src==='reel') T.nReel++;
    T.trous+=pl.trous; T.plantH+=pl.h; T.plantE+=pl.h*tx;
  });
  // Sources DATÉES pour la courbe d'engagement — reprises telles quelles des deux
  // agrégateurs existants (une seule définition de « combien coûte une session »).
  if(_gnrOn){
    var _bd={};
    Object.keys(tracH.condByDate||{}).forEach(function(iso){ _bd[iso]=(_bd[iso]||0)+(tracH.condByDate[iso]||0); });
    Object.keys(gnrR.byDate||{}).forEach(function(iso){ _bd[iso]=(_bd[iso]||0)+(gnrR.byDate[iso]||0); });
    T.byDateTrac=_bd;
  } else {
    T.byDateTrac = tracH.byDate || {};
  }
  // Tracabilite de la source, lue par le poste GNR et la carte de fiabilite.
  T.gnrSrc = _gnrOn?'reel':'modele';
  T.gnrN = gnrR.n; T.gnrNSansLitres = gnrR.nSansLitres; T.gnrCle = _kSurf?'surface':'heures';
  T.byDatePhy  = phy.byDate  || {};
  T.byDatePresta = prs.byDate || {};   // ARRACH-4
  T.prestN = prs.n; T.prestSansPrix = prs.nSansPrix;

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
  var budget = T.moB + tracB + gnrB + phyB + T.prestF;   // ARRACH-4 : une prestation n'a pas de prévu, son budget est ce qu'elle a coûté
  // ★★★ ENG-2 (24/09/2026) — LA MAIN-D'ŒUVRE ENGAGÉE EST CELLE QUI A ÉTÉ PAYÉE.
  // Nico : « une semaine à 3 ou 4 à dégrafer, à 17-19 € chargés, 8 h, 5 jours : je ne suis
  // pas sûr que ça fasse 1 400 € ». AVANT : T.moF = heures de BARÈME des travaux VALIDÉS ×
  // taux. Une parcelle dégrafée pas encore validée valait 0 €, une parcelle validée valait
  // son h/ha de barème même si l'équipe y avait passé le double : l'engagé suivait
  // l'avancement PAR CONSTRUCTION, et « en avance / en retard » ne pouvait rien dire.
  // MAINTENANT : les heures DANS LES RANGS du planning, du début de la période à aujourd'hui,
  //   par salarié vigne (bureau exclu), MOINS sa conduite tracteur (comptée à part, poste
  //   « Conduite tracteur »), MOINS ses journées de cave (_ecoCaveJours), × SON taux chargé
  //   du jour — validées ou non : une heure en attente de validation est payée.
  //   C'est _ecoTempsVigne (TV-1) : une seule définition de l'heure vigne.
  // Tracteur, GNR, phyto : inchangés. Le BUDGET reste le barème. L'écart entre « % du budget
  //   engagé » et « % du travail fait » est désormais UNE MESURE (voir le piège ci-dessous,
  //   qui ne vaut plus que pour tracteur, GNR et phyto).
  // `engageBar` garde l'ancienne valorisation : c'est la somme des lignes « Réalisé » des
  //   tableaux Parcelles et Coût par travail, qui restent au barème (ils sont par parcelle et
  //   par tâche ; une heure en attente n'a pas encore de parcelle).
  // Repli : période sans dates, pas commencée, planning absent → l'ancien calcul (moSrc).
  var TVe=null; try{ TVe=_ecoTempsVigne(); }catch(e){ TVe=null; }
  var moReel = (TVe && TVe.ok) ? TVe.eur : T.moF;
  var moSrc  = (TVe && TVe.ok) ? 'planning' : 'bareme';
  // ★★ AUJ-7 (§309) — LES TRAVAUX À L'HEURE ONT LEUR LIGNE, ET LEUR BUDGET EST CE QU'ILS ONT COÛTÉ. Arrachage, désherbage
  //   manuel… (sans barème, payés à l'heure hors de la tâche — accord du 2 octobre 2023) : même règle que les prestations
  //   (ARRACH-4). Avant, payés dans la main-d'œuvre mais absents du budget, ils mangeaient le « reste à engager », poussaient la
  //   main-d'œuvre au-dessus du barème et la cadence vers « l'équipe est lente ».
  var hbE=(TVe && TVe.ok) ? (Number(TVe.eHb)||0) : 0, hbH=(TVe && TVe.ok) ? (Number(TVe.hHb)||0) : 0;
  budget += hbE;
  var engageBar = T.moF + T.tracF + T.gnrF + T.phyF;
  var engage = moReel + T.tracF + T.gnrF + T.phyF;
  engageBar += T.prestF; engage += T.prestF;   // ARRACH-4 : les prestations
  engageBar += hbE;   // AUJ-7 : le « barème » d'un travail à l'heure est ce qu'il a coûté (déjà dans l'engagé, par moReel)
  var resteE = Math.max(0, budget-engage);
  // Le reste de TRAVAIL, lui, se lit au barème : c'est ce qu'il reste à faire, pas ce
  // qu'il reste d'argent. La projection l'utilise (ci-dessous).
  var resteBar = Math.max(0, budget-engageBar);
  var consPct = budget>0 ? (engage/budget*100) : 0;

  // ★★★ RÉAL-1 (27/09/2026) — LE RÉALISÉ DES TABLEAUX EST CE QUI A ÉTÉ PAYÉ.
  // Nico, capture à l'appui : dégrafage à 100 %, « Réalisé 6 494 € = Budget 6 494 € », et juste
  // en dessous 374 h réelles pour 329 h au barème. « Ça sert à ça un outil de pilotage. »
  // AVANT : Réalisé = heures de BARÈME du fait × taux — égal au budget du fait PAR CONSTRUCTION,
  //   il ne pouvait montrer aucune différence.
  // MAINTENANT : Réalisé = les euros des heures du planning VERSÉES au travail (ou à la parcelle)
  //   par _ecoTempsVigne, chaque heure à son taux du jour. Écart = réalisé − barème du fait
  //   (moF / fE) : les deux côtés portent sur le même travail, celui qui est validé.
  //   Les heures EN ATTENTE d'une validation sont payées (dans l'engagé) mais n'ont pas encore
  //   de travail : elles sont dites sous le tableau, jamais réparties au hasard.
  // Repli (période sans dates, pas commencée, planning absent) : réalisé = barème, écart « — ».
  var tvOk = !!(TVe && TVe.ok);
  var tvByT = {};
  if(tvOk) (TVe.taches||[]).forEach(function(x){ tvByT[_friseNorm(x.nom)]=x; });
  var T_moRe=0;
  // AUJ-7 : ce qu'une parcelle a reçu en travaux à l'heure (arrachage…) reste dans son réalisé, jamais dans son écart au barème.
  var hbParc={};
  if(tvOk) Object.keys(TVe.pairs||{}).forEach(function(k){ var Pq=TVe.pairs[k]; if(Pq&&Pq.hb) hbParc[Pq.parc]=(hbParc[Pq.parc]||0)+(Number(Pq.eur)||0); });
  rows.forEach(function(r){
    var q = tvOk ? (TVe.parcs[r.nom]||null) : null;
    r.moRe  = tvOk ? (q ? q.eur : 0) : r.moF;
    r.hRe   = q ? q.h : 0;
    r.engRe = r.moRe + r.tracF + r.gnrF + r.phyF;
    r.engRe += (r.prestF||0);   // ARRACH-4
    var _reB = r.moRe - (hbParc[r.nom]||0);   // AUJ-7
    r.ecE   = (tvOk && (r.moF>0 || _reB>0.5)) ? (_reB - r.moF) : null;
    T_moRe += r.moRe;
  });
  T.moRe = T_moRe;
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
  // La presence vient donc du PLANNING (_planChampPersRange : heures dans les rangs,
  // formation et evenement familial a 0 — CHAMP-2), moins les heures de sessions tracteur — et T.tracH est
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
  var hReelC=cadP ? Math.max(0, cadP.h - T.tracH - (T.tracHCo||0) - hbH) : 0;   // COEQ-4 (§525) : le coéquipier n'est pas dans les rangs non plus   // AUJ-7 : ni le tracteur, ni les travaux à l'heure (sans barème en face)
  var cadOk = (hBarC>0 && hReelC>0 && avc>=_PEC_CAD_AVC);
  var ecart = cadOk ? ((hReelC-hBarC)/hBarC) : 0;
  // ★★★ ESCALIER DE SOURCES — MARCHE 2 (backlog 7, §20b).
  // Marche 1 : la periode EN COURS des qu'elle a passe le seuil d'avancement (ci-dessus).
  // Marche 2 : sous le seuil, la MEME PERIODE DE LA CAMPAGNE PRECEDENTE, si elle est
  //   archivee. Meme arithmetique, meme discipline de perimetre : numerateur global
  //   (presence planning de la fenetre, moins le tracteur de la fenetre) sur denominateur
  //   global (heures de bareme faites, lues dans le snapshot).
  // Marche 3 : rien — et l'ecran le dit deja.
  // ⚠️ Le seuil ne s'applique PAS a la marche 2 : une campagne archivee est terminee,
  //   son avancement est ce qu'il est. C'est la representativite qui justifiait le seuil,
  //   et une periode close est representative d'elle-meme par construction.
  // ⚠️ La source DOIT etre annoncee a l'ecran : un chiffre de l'an dernier presente comme
  //   une mesure du moment serait exactement la faute de §34 — deux choses sous un mot.
  var cadSrc = cadOk ? 'planning' : null;
  var cadHist = null;
  if(!cadOk){
    cadHist = _pecCadHisto(hBarC);
    if(cadHist){
      cadOk   = true;
      cadSrc  = 'histo';
      hReelC  = cadHist.hReel;
      hBarC   = cadHist.hBar;
      ecart   = cadHist.ecart;
    }
  }
  // ⚠ La cadence ne s'applique qu'au RESTE A ENGAGER. Appliquee au budget entier
  // elle reecrivait le passe : a 100 % d'avancement, avec 79 358 € deja engages et
  // 0 € restant, l'ecran projetait une fin a 37,4 k€ — une projection ne peut pas
  // contredire ce qui est deja depense, sur la meme carte. A 0 % d'avancement le
  // resultat est identique a l'ancien ; a 100 % elle retombe exactement sur l'engage.
  // \u26a0 MEME REGLE QUE LA DATE (14/08/2026, soir) : un budget projete est une
  //   PREVISION. La marche 2 ne prevoit rien, elle RAPPELLE. Sous le seuil, la
  //   projection retombe sur le budget de bareme - exactement le comportement
  //   d'avant le branchement de la marche 2. L'ecart histo reste LU a l'ecran,
  //   il n'est plus MULTIPLIE par une charge.
  var kCad=1+ecart;
  var cadHors=(cadOk && cadSrc==='planning' && (kCad<_PEC_CAD_KMIN || kCad>_PEC_CAD_KMAX));
  var cadAppl = (cadSrc==='planning' && !cadHors);
  // ENG-2 : ce qui est engagé (réel) + ce qu'il reste à faire (barème), corrigé de la
  //   cadence quand elle s'applique. Tant que l'engagé valait le barème du fait, la
  //   formule sans cadence retombait sur le budget — elle y retombe encore dans ce cas.
  // ★ AUJ-7 (§309) : la cadence de l'ÉQUIPE ne s'applique qu'au reste de MAIN-D'ŒUVRE. Le reste du tracteur, du GNR et du phyto
  //   est déjà extrapolé à l'avancement ; le multiplier aussi par le rythme des travaux à la main le comptait deux fois, et
  //   « Par poste » ne tombait plus juste : l'écart de la campagne n'était pas la somme des écarts de ses lignes.
  var projFin = cadAppl ? (engage + resteBar + T.moR*ecart) : (engage + resteBar);

  var postes = [
    { k:'mo',   lab:'Main-d\u2019\u0153uvre vigne', col:_PEC_COL.mo,   fait:moReel-hbE,  budget:T.moB, proj:false,
      det:(moSrc==='planning'
        ? (_ecoH1(TVe.hVigne-hbH)+' h dans les rangs \u00b7 '+_ecoH1(T.fH)+' h de bar\u00e8me faites sur '+_ecoH1(T.bH))
        : (_ecoH1(T.fH)+' h faites sur '+_ecoH1(T.bH)+' h de bar\u00e8me')) },
    { k:'trac', lab:'Conduite tracteur',            col:_PEC_COL.trac, fait:T.tracF, budget:tracB, proj:projOn, det:_ecoH1(T.tracH)+' h de sessions' },
    { k:'gnr',  lab:'Carburant GNR',                col:_PEC_COL.gnr,  fait:T.gnrF,  budget:gnrB,  proj:projOn, det:_pecGnrDet(T.gnrSrc,T.litres,T.gnrN,T.gnrNSansLitres,T.gnrCle,cfg.gnrL) },
    { k:'phy',  lab:'Produits phyto',               col:_PEC_COL.phy,  fait:T.phyF,  budget:phyB,  proj:projOn, det:'doses \u00d7 surface \u00d7 prix R\u00e9serve' }
  ];
  // ARRACH-4 : le poste n'apparaît que s'il existe — un domaine sans prestataire ne voit rien bouger.
  if(T.prestF>0 || T.prestN>0) postes.push({ k:'pre', lab:'Prestations', col:_PEC_COL.pre, fait:T.prestF, budget:T.prestF, proj:false,
    det:T.prestN+' \u00e9tape'+(T.prestN>1?'s':'')+' faite'+(T.prestN>1?'s':'')+' par un prestataire'
      +(T.prestSansPrix?(' \u00b7 '+T.prestSansPrix+' sans montant'):'') });
  // AUJ-7 : les travaux à l'heure de la période (arrachage, désherbage manuel…), heures versées par le temps réel. Le poste
  //   n'apparaît que s'il existe ; son budget est ce qu'il a coûté — il ne peut ni dépasser, ni « rester ».
  if(hbE>0){
    var _hbT=((TVe&&TVe.taches)||[]).filter(function(x){ return x&&x.hb&&x.h>0; });
    postes.push({ k:'hb', lab:'Travaux \u00e0 l\u2019heure', col:_PEC_COL.hb, fait:hbE, budget:hbE, proj:false,
      det:_hbT.map(function(x){ return ((typeof window.tNom==='function')?window.tNom(x.nom):x.nom)+' '+_ecoH1(x.h)+' h'; }).join(' \u00b7 ') });
  }

  var tvVus = {};
  var tlist = tOrder.map(function(n){ var t=tasks[n];
    t.euHa = t.surf>0 ? t.bE/t.surf : 0;
    t.pct  = t.bH>0 ? t.fH/t.bH*100 : 100;
    t.part = budget>0 ? t.bE/budget*100 : 0;
    // RÉAL-1 : le réalisé du travail = les euros de ses heures versées ; écart au barème du fait.
    var nk=_friseNorm(t.nom), x=tvOk ? (tvByT[nk]||null) : null;
    if(x) tvVus[nk]=1;
    t.reE = tvOk ? (x ? x.eur : 0) : t.fE;
    t.reH = x ? x.h : 0;
    // ★ ECART-1 (§460) : le barème des MÊMES validations que ces heures (temps réel ; une revalidation ne le recompte pas, RÉAL-1)
    //   — l'écart en heures de la carte « Temps réel contre barème », que lit aussi la carte par tâche d'Aujourd'hui. Un travail à
    //   l'heure (arrachage…) n'a pas de barème en face.
    t.reB = x ? (Number(x.bar)||0) : 0;
    t.reHb = !!(x && x.hb);
    t.ecE = (tvOk && (t.fE>0 || t.reE>0)) ? (t.reE - t.fE) : null;
    return t; }).sort(function(a,b){ return b.bE-a.bE; });
  // Heures versées à un travail absent de la liste de la période (tâche retirée de la saison) :
  //   comptées dans l'engagé, montrées sous le tableau plutôt que perdues.
  var tvHorsE = 0;
  if(tvOk) (TVe.taches||[]).forEach(function(x){ if(!tvVus[_friseNorm(x.nom)] && !x.hb) tvHorsE += x.eur; });   // AUJ-7 : un travail à l'heure a son poste

  return {
    rows:rows, tasks:tlist, pairs:pairs, tot:T, postes:postes,
    rate:rate, cfg:cfg, phy:phy, rcfg:rcfg, minTrou:_ecoMinTrou(),
    tracAnon:tracH.nAnon, tracSess:tracH.nSess,
    avc:avcPct, cons:consPct, projOn:projOn,
    cad:{ hReel:hReelC, hBar:hBarC, ok:cadOk, applic:cadAppl, ecart:ecart*100, hJour:hJour,
          horsBornes:cadHors, kmin:_PEC_CAD_KMIN, kmax:_PEC_CAD_KMAX,
          src:(cadSrc || (cadP?'planning':null)), hTrac:(cadHist?cadHist.hTrac:T.tracH), hHb:(cadHist?0:hbH), seuil:_PEC_CAD_AVC*100,
          d0:(cadHist?cadHist.d0:(cadP?cadP.d0:'')), d1:(cadHist?cadHist.d1:(cadP?cadP.d1:'')),
          nMbr:(cadHist?cadHist.nMbr:(cadP?cadP.n:0)),
          histoNom:(cadHist?cadHist.nom:'') },
    projFin:projFin,
    budget:budget, engage:engage, resteE:resteE, engageBar:engageBar, resteBar:resteBar,
    moReel:moReel, moSrc:moSrc, tv:((TVe&&TVe.ok)?TVe:null),
    reOk:tvOk, engRe:(T.moRe + T.tracF + T.gnrF + T.phyF + T.prestF), ecRe:(tvOk ? (T.moRe - hbE - T.moF) : null), hbE:hbE, hbH:hbH,
    reAttE:(tvOk ? (TVe.eAtt||0) : 0), reAttH:(tvOk ? (TVe.hAtt||0) : 0), reHorsE:tvHorsE,
    coutHaB:(T.surf>0?budget/T.surf:0), coutHaE:(T.surf>0?engage/T.surf:0),
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
function _pecTimeline(E, finIso){
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
  // ★ ENG-2 : la main-d'œuvre se pose au JOUR PAYÉ du planning — les mêmes euros que
  //   « Engagé à ce jour », au centime. Le barème daté au journal ne sert plus que de repli.
  if(E.moSrc==='planning' && E.tv && E.tv.byD){
    Object.keys(E.tv.byD).forEach(function(iso){ add(iso, E.tv.byD[iso]); });
  } else {
  var jp={};
  (window.JOURNAL||[]).forEach(function(j){
    if(!j || j.meteo || j.auTracteur || j.statut!=='Valid\u00e9' || !j.parcelle || !j.tache || !j.date) return;   // auTracteur : FERTI-3
    if(j.presta) return;   // ARRACH-3 : pas d'heures d'équipe sur une étape prestataire
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
  }
  Object.keys(E.tot.byDateTrac||{}).forEach(function(iso){ add(iso, E.tot.byDateTrac[iso]); });
  Object.keys(E.tot.byDatePhy||{}).forEach(function(iso){ add(iso, E.tot.byDatePhy[iso]); });
  Object.keys(E.tot.byDatePresta||{}).forEach(function(iso){ add(iso, E.tot.byDatePresta[iso]); });   // ARRACH-4

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
  // ★ La fenetre ne remonte pas AVANT le debut de la periode : dix jours de
  //   vendange etales sur vingt-huit donnaient « 362 € par jour » quand la caisse
  //   sortait 1 000 € par jour — et une fin de periode projetee SOUS le budget
  //   pendant que la cadence, a cote, annoncait le double. nDays dit la vraie
  //   longueur de la fenetre, et l'ecran l'affiche.
  var winStart = Math.max(t0, winEnd-28*86400000);
  if(winStart>winEnd) winStart=winEnd;
  var vStart=socle;
  pts.forEach(function(p){ if(p.t<=winStart) vStart=p.v; });
  var days=Math.max(1,(winEnd-winStart)/86400000);
  var pace=Math.max(0,(cum-vStart)/days);

  var budget=E.budget||0;
  // ★★★ COHER-1 (§581) — LA PROJECTION REJOINT LE « COÛT À LA FIN » ; ELLE NE PROLONGE PLUS LE RYTHME.
  //   Avant : projEndV = cum + rythme × jours jusqu'à la fin de la PÉRIODE. Sur la démo, trois jours à 638 € prolongés sur 124
  //   jours donnaient « fin de période projetée à 81,0 k€ · budget épuisé le 18 nov. » — sous un verdict « Le budget tient », et
  //   face au « Coût à la fin 15 317 € » d'Aujourd'hui. Les euros s'arrêtent quand le travail s'arrête : la projection va
  //   à E.projFin (l'engagé, plus le reste au barème, corrigé de la cadence quand elle s'applique — LE chiffre d'Aujourd'hui,
  //   _pilCk2Eco le lit au même endroit), à la FIN PRÉVUE des travaux (celle d'Aujourd'hui : _pilMargeCalc(d).proj, passée
  //   par _pilTabEco), à défaut à la fin de la période. Elle part d'aujourd'hui : rien ne s'engage entre la dernière saisie
  //   et ce matin. « Budget épuisé le » n'existe que si le coût à la fin dépasse le budget — le jour où la projection le croise.
  //   Le rythme (pace, nDays) reste une MESURE affichée ; il ne prévoit plus rien.
  var finV=(isFinite(E.projFin) && E.projFin>0) ? Math.max(cum, E.projFin) : null;
  var projT0=(tToday!==null) ? Math.max(lastMs, tToday) : lastMs;
  var finMs=finIso ? _pecIsoToMs(finIso) : null, finPrevue=(finMs!==null && finMs>projT0);
  if(!finPrevue) finMs=(tEnd>projT0) ? tEnd : null;
  if(finMs===null) finV=null;
  var projMs=null;
  if(finV!==null && budget>cum && finV>budget) projMs = projT0 + (budget-cum)/(finV-cum)*(finMs-projT0);
  var objIso=_pilObjectifGet(), objMs=objIso?_pecIsoToMs(objIso):null;
  return { ok:pts.length>1 || socle>0, pts:pts, t0:t0, tEnd:tEnd, tToday:tToday, tLast:lastMs,
           socle:socle, cum:cum, engageDate:engageDate, pace:pace, projMs:projMs, finV:finV, finMs:finMs, finPrevue:finPrevue, projT0:projT0,
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
  var tMax=Math.max(TL.tEnd, TL.tToday||0, TL.finMs||0, TL.tLast||0);   // COHER-1 (§581) : la fin prévue peut dépasser la période
  if(tMax<=TL.t0) tMax=TL.t0+86400000*30;
  tMax=TL.t0+(tMax-TL.t0)*1.02;
  var pFin=(E && E.cad && E.cad.ok && E.cad.applic && Math.abs(E.cad.ecart)>5) ? E.projFin : 0;
  var yTop=_pecNiceMax(Math.max(TL.budget, TL.cum, TL.finV||0, pFin)*1.05);
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
  //   ★ COHER-1 (§581) : elle va au coût à la fin, à la fin prévue des travaux — à plat de la dernière saisie à aujourd'hui.
  if(TL.finV!=null && TL.finMs!=null && TL.finMs>lastP.t){
    g+='<path d="M'+X(lastP.t).toFixed(1)+' '+Y(lastP.v).toFixed(1)+' L'+X(TL.projT0).toFixed(1)+' '+Y(lastP.v).toFixed(1)+' L'+X(TL.finMs).toFixed(1)+' '+Y(TL.finV).toFixed(1)+'" fill="none" stroke="'+c.col.mesure+'" stroke-width="'+c.trait.prevu+'" stroke-dasharray="7 5" stroke-opacity=".55" stroke-linecap="round" stroke-linejoin="round"/>'
      +'<circle cx="'+X(TL.finMs).toFixed(1)+'" cy="'+Y(TL.finV).toFixed(1)+'" r="3.5" fill="none" stroke="'+c.col.mesure+'" stroke-width="1.5"/>';
  }
  g+='<circle cx="'+X(lastP.t).toFixed(1)+'" cy="'+Y(lastP.v).toFixed(1)+'" r="4" fill="'+c.col.mesure+'"/>';
  // Budget : une reference decidee. Le trait est en --or ; l'etiquette ne l'est
  // PAS — sur fond papier son contraste tombe a 2,37.
  if(TL.budget>0){
    var yb=Y(TL.budget);
    g+='<line x1="'+pL+'" y1="'+yb.toFixed(1)+'" x2="'+(W-pR)+'" y2="'+yb.toFixed(1)+'" stroke="'+c.col.prevu+'" stroke-width="'+c.trait.prevu+'" stroke-dasharray="9 6"/>'
      +'<text x="'+(W-pR)+'" y="'+(yb-7).toFixed(1)+'" text-anchor="end" font-size="'+c.txt.axe+'" font-weight="600" fill="'+c.col.texte+'">Budget '+_pilEsc(_pecEurK(TL.budget))+'</text>';
  }
  // Cout final projete par la CADENCE mesuree (temps passe / bareme). Trace seulement
  // quand il s'ecarte vraiment du budget : deux lignes qui se superposent ne disent rien.
  if(pFin>0){
    var yf=Y(pFin), au=(pFin>TL.budget), cf=au?c.col.alerte:c.col.fait;
    g+='<line x1="'+pL+'" y1="'+yf.toFixed(1)+'" x2="'+(W-pR)+'" y2="'+yf.toFixed(1)+'" stroke="'+cf+'" stroke-width="'+c.trait.seuil+'" stroke-dasharray="3 5"/>'
      +'<text x="'+(W-pR)+'" y="'+(yf+(au?-7:15)).toFixed(1)+'" text-anchor="end" font-size="'+(et?c.txt.mini:c.txt.unite)+'" font-weight="600" fill="'+cf+'">'+(et?'\u00c0 la cadence \u00b7 ':'Fin projet\u00e9e \u00e0 la cadence \u00b7 ')+_pilEsc(_pecEurK(pFin))+'</text>';
  }
  // Aujourd'hui : un repere, pas une alerte. Le rouge reste au depassement.
  if(TL.tToday!=null && TL.tToday>=TL.t0 && TL.tToday<=tMax){
    var xt=X(TL.tToday);
    g+='<line x1="'+xt.toFixed(1)+'" y1="'+(pT-4)+'" x2="'+xt.toFixed(1)+'" y2="'+(pT+ih)+'" stroke="'+c.col.texte+'" stroke-width="1.4" stroke-dasharray="4 3"/>'
      +'<text x="'+xt.toFixed(1)+'" y="'+(pT-8)+'" text-anchor="middle" font-size="'+c.txt.mini+'" font-weight="600" fill="'+c.col.texte+'">auj.</text>';
  }
  // Objectif de fin des travaux : une date decidee, donc --or comme le budget.
  if(TL.objMs!=null && TL.objMs>=TL.t0 && TL.objMs<=tMax){
    var xo=X(TL.objMs);
    g+='<line x1="'+xo.toFixed(1)+'" y1="'+pT+'" x2="'+xo.toFixed(1)+'" y2="'+(pT+ih)+'" stroke="'+c.col.prevu+'" stroke-width="'+c.trait.prevu+'" stroke-dasharray="3 4"/>'
      +'<text x="'+xo.toFixed(1)+'" y="'+(pT+ih+(et?32:34))+'" text-anchor="middle" font-size="'+c.txt.mini+'" font-weight="600" fill="'+c.col.texte+'">objectif</text>';
  }
  var aria='Rythme d\u2019engagement des d\u00e9penses : '+_pecEurK(TL.cum)+' engag\u00e9s'
    +(TL.budget>0?(' sur un budget de '+_pecEurK(TL.budget)):'')
    +(TL.finV!=null?(', co\u00fbt \u00e0 la fin '+_ecoEur(TL.finV)):'')+'.';
  return window._mvGraphSvg(c, aria, g);
}

// MOTS-3 (§584) : l'anneau des postes et les barres des travaux (deux graphiques) sont partis avec les deux tableaux de
//   Postes & travaux : chaque ligne de liste porte sa jauge.

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
       +'<text x="'+cx+'" y="'+(pT-16)+'" text-anchor="middle" font-size="'+c.txt.axe+'" font-weight="600" fill="'+c.col.texte+'">moyenne du domaine \u00b7 '+_pilEsc(_ecoEur(avg))+'/ha</text>';
  rs.forEach(function(r,i){
    var y=pT+i*rowH, by=y+4, bh=_PIL_GB.h;
    var bw=Math.abs(r.ec)/mx*half, up=r.ec>=0;
    var col=up?(r.ec>25?c.col.alerte:c.col.attention):c.col.fait;
    g+='<rect x="'+(up?cx:cx-bw).toFixed(1)+'" y="'+by+'" width="'+Math.max(1,bw).toFixed(1)+'" height="'+bh+'" rx="'+_PIL_GB.r+'" fill="'+col+'" opacity=".85"/>'
      +'<text x="'+(up?(cx-8):(cx+8))+'" y="'+(by+12)+'" text-anchor="'+(up?'end':'start')+'" font-size="'+c.txt.axe+'" fill="var(--texte)">'+_pilEsc(_pecTrunc(r.nom,et?13:20))+'</text>'
      +'<text x="'+(up?(cx+bw+9):(cx-bw-9)).toFixed(1)+'" y="'+(by+12)+'" text-anchor="'+(up?'start':'end')+'" font-size="'+(et?c.txt.mini:c.txt.unite)+'" font-weight="600" fill="'+col+'">'+(up?'+':'\u2212')+Math.round(Math.abs(r.ec))+' %</text>';
  });
  var svg=window._mvGraphSvg(c, '\u00c9cart au co\u00fbt moyen \u00e0 l\u2019hectare, '+rs.length+' parcelles compar\u00e9es \u00e0 '+_ecoEur(avg)+' par hectare.', g);
  if(trunc) svg+='<div class="pec-note">Les 14 parcelles les plus ch\u00e8res et les 14 les moins ch\u00e8res \u00e0 l\u2019hectare. Le tableau de l\u2019onglet <b>Parcelles</b> les porte toutes.</div>';
  return svg;
}

// ── Verdict : une phrase, celle qu'on dirait à voix haute ────────────
// ════════════════════════════════════════════════════════════════════════════
// LE VERDICT — CE QUI SE PASSE, PAS COMMENT ON LE CALCULE
// ════════════════════════════════════════════════════════════════════════════
// C'est la premiere chose qu'on lit en ouvrant Economie, et la seule qui reponde
// a « ou j'en suis ». Une seule branche s'affiche a la fois : ce n'etait donc
// pas un mur. Le defaut etait ailleurs — CHAQUE branche melangeait trois choses
// dans un meme paragraphe de 200 a 500 caracteres :
//   ① le verdict lui-meme (l'ecart, la projection, l'engage) ;
//   ② la mise en garde sur la METHODE — « la presence vient du planning, elle
//     contient aussi la cave et l'atelier » — deja ecrite mot pour mot dans la
//     fiche `pil.cadence` depuis le lot du 15/08. Elle etait donc dite DEUX fois,
//     et la version du verdict vieillira separement de l'autre ;
//   ③ un chemin a retenir : « Reglages › Taches », « Postes & travaux ».
// Desormais : le verdict tient en une ou deux phrases, la methode est derriere
// la pastille (une seule source), et les chemins sont des boutons.
// ⚠️ La pastille est celle de `pil.cadence` — on n'ecrit pas une deuxieme fiche
//   qui dirait la meme chose sous un autre nom.
// La phrase qui dit qu'un ecart est LU sans etre APPLIQUE. Avant, le verdict
// gardait « la periode irait vers X » avec X = le budget : « +23 % de temps en
// plus… soit 0 € au-dessus du budget ». Un ecart qui ne multiplie rien ne doit
// pas produire une projection qui contredit sa propre phrase.
function _pecNonRetenu(E){
  if(E.cad.horsBornes) return 'Cet \u00e9cart sort des bornes de bon sens (facteur hors ['+String(E.cad.kmin).replace('.',',')+'\u00a0; '+E.cad.kmax+'])\u00a0: il mesure sans doute un trou de saisie, <b>il n\u2019est pas appliqu\u00e9 au budget</b>. Le reste \u00e0 engager est compt\u00e9 au bar\u00e8me.';
  if(E.cad.src==='histo') return 'Mesur\u00e9 sur la campagne pr\u00e9c\u00e9dente, cet \u00e9cart se lit, <b>il n\u2019est pas appliqu\u00e9 au budget</b> de celle-ci\u00a0: le reste \u00e0 engager est compt\u00e9 au bar\u00e8me.';
  return 'Cet \u00e9cart <b>n\u2019est pas appliqu\u00e9 au budget</b>\u00a0: le reste \u00e0 engager est compt\u00e9 au bar\u00e8me.';
}
// ★★★ MOTS-1 (§582) — LA SYNTHÈSE SE LIT D'UN COUP D'ŒIL : UNE PHRASE, CE QUI DEMANDE UN GESTE, QUATRE CHIFFRES, LE RESTE REPLIÉ.
//   Nico (16/11) : « trop d'écriture, de texte à lire », l'information est à chercher. Mesuré (§580) : 445 mots au
//   téléphone, 85 à passer avant le premier grand chiffre. Les huit règles et le lexique sont au §580c ; la maquette
//   validée est docs/maquettes/maquette-moins-de-texte-v3.html.
//   ⚠️ AUCUN CALCUL NE CHANGE ICI : _pecData, _pecTimeline, _pecRevData, _pilAnBudgetData restent les sources. Ce qui
//   quitte l'écran va derrière un « i » (les fiches pil.cadence, pil.eco.fin, pil.eco.revient, pil.an.budget) — la
//   fiche pil.eco.fin se remplit au rendu (_mvInfoSet) avec les heures du moment.
//   LE VERDICT TIENT EN UNE PHRASE (règle 1) : un titre, deux points, son repère. Les pour-cent y sont entiers ; la
//   décimale reste dans le détail. Les sept états d'avant sont là, plus un : « Le budget serait dépassé » quand le
//   coût à la fin passe le budget sans qu'une cadence se mesure — l'écran disait « Le budget tient » pendant
//   qu'Aujourd'hui annonçait un dépassement (le même E.projFin, COHER-1, §581).
function _pecPct0(v){ return Math.round(Number(v)||0)+' %'; }
function _pecVerdictM(E,TL){
  var ic=['graphique',''], t='', r='', act=[];
  var ec=E.cad.ok?E.cad.ecart:null;
  var sup=(isFinite(E.projFin) && E.budget>0) ? (E.projFin-E.budget) : 0;
  var parts='<b>'+_pecPct0(E.cons)+'</b> engagé pour <b>'+_pecPct0(E.avc)+'</b> du travail fait';
  if(!E.hasRate){
    ic=['eclair','']; t='Le chiffrage n’est pas branché'; r='sans taux horaire, la main-d’œuvre compte pour zéro';
    act.push(['diag','equipe','Réglages › Équipe']);
  } else if(E.avc<3){
    ic=['pousse','']; t='La campagne démarre';
    r=(E.moSrc==='planning' && E.engage>0)
      ? ('<b>'+_pilEsc(_ecoEur(E.engage))+'</b> engagés sur <b>'+_pilEsc(_ecoEur(E.budget))+'</b>')
      : ('budget <b>'+_pilEsc(_ecoEur(E.budget))+'</b>');
  } else if(ec===null){
    if(sup>0.5){ ic=['alerte','or']; t='Le budget serait dépassé'; r='<b>+'+_pilEsc(_ecoEur(sup))+'</b> à la fin, pour <b>'+_pecPct0(E.avc)+'</b> du travail fait'; }
    else { ic=['journal','']; t='Le budget tient'; r=parts; }
  } else if(ec>15){
    ic=['alerte','rouge']; t='Le travail prend plus de temps que le barème';
    r='<b>+'+_pecPct0(ec)+'</b>'+(E.cad.applic ? (sup>0.5?(', soit <b>'+_pilEsc(_pecEurK(sup))+'</b> au-dessus du budget à la fin'):'') : ', non appliqué au budget');
    act.push(['sub','pos','Voir quel travail dérape']);
    act.push(['diag','taches','Réglages › Tâches']);
  } else if(ec>5){
    ic=['alerte','or']; t='Légère dérive de cadence';
    r='<b>+'+_pecPct0(ec)+'</b> de temps sur le travail fait'+(E.cad.applic?'':', non appliqué au budget');
    act.push(['sub','pos','Voir travail par travail']);
  } else if(ec<-8){
    ic=['graphique','vert']; t='L’équipe va plus vite que le barème';
    r='<b>'+_pecPct0(Math.abs(ec))+'</b> de temps en moins';
    act.push(['diag','taches','Réglages › Tâches']);
  } else {
    ic=['graphique','vert']; t='La cadence colle au barème'; r=parts;
  }
  // ★ MARCHE 2 : la cadence ne vient PAS de la campagne en cours. Le dire avant tout le reste, et remplacer le titre :
  //   les branches ci-dessus sont écrites au présent et décriraient une campagne qui n'est pas celle affichée (§34).
  //   Ce qui reste ici est le CADRE — d'où vient le chiffre. Le « pourquoi un seuil » est dans la fiche.
  var cadre=null;
  if(ec!=null && E.cad.src==='histo'){
    t=t.replace(/^La cadence colle au barème$/,'La cadence de l’an dernier collait au barème');
    t='↩︎ '+t+' — mesuré sur la campagne précédente';
    cadre='mesuré sur <b>'+_pilEsc(E.cad.histoNom||'la campagne précédente')+'</b> — cette campagne en est à '+Math.round(E.avc)+' % sur '+Math.round(E.cad.seuil)+' %';
  }
  return { ic:ic, t:t, r:r, act:act, cadre:cadre };
}
// La campagne que l'écran chiffre, et ses dates : la ligne remplace l'avis « Cet écran chiffre… » (24 mots) ET la ligne
//   « … · 7,02 ha · taux moyen » de la sous-barre. À droite, ce qui manque au chiffrage : rien = une coche (règle 3).
function _pecPerLigne(droite){
  var nom=_pilSaisonNom(), sa=(typeof window._pilSaison==='function')?window._pilSaison():null;
  var a=(sa&&sa.debut)?_pecIsoToMs(String(sa.debut).slice(0,10)):null, b=(sa&&sa.fin)?_pecIsoToMs(String(sa.fin).slice(0,10)):null;
  return '<div class="pec-per"><span><b>'+_pilEsc(nom||'—')+'</b>'
    +((a!==null&&b!==null)?(' · '+_pilEsc(_pecJourCourt(a))+' → '+_pilEsc(_pecJourCourt(b))):'')+'</span>'+(droite||'')+'</div>';
}
// ★★★ MOTS-2 (§583) — LES CINQ AUTRES SOUS-VUES D'ÉCONOMIE PRENNENT L'EN-TÊTE DE LA SYNTHÈSE.
//   Ce que l'écran chiffre (une ligne : la campagne et ses dates, le millésime et son cycle, l'exercice), puis UNE phrase.
//   L'avis « Cet écran chiffre…, pas l'exercice comptable affiché en haut » (24 mots, _pilAvertEco) et la ligne
//   « … · 7,02 ha · taux moyen » de la sous-barre n'existent plus : chaque sous-vue nomme son cadre elle-même.
//   Les sous-titres de carte, les modes d'emploi et les notes de méthode passent derrière les « i » (règles 4 et 7, §580c).
//   ⚠️ Aucun calcul ne change, aucun tableau non plus.
function _pecEnteteVue(per, phrase, cle){
  // La pastille « i » se pose à droite de la carte, pas au bout de la phrase : au téléphone elle tombait seule sur une ligne.
  return '<div class="pec-card"><div class="pec-verdict pec-ph"><div>'+(per||'')
    +'<div class="t">'+phrase+'</div></div>'
    +((cle && typeof _mvInfoBtn==='function')?('<span class="pec-phi">'+_mvInfoBtn(cle)+'</span>'):'')
    +'</div></div>';
}
// Ce qui mérite un regard sans être un poste à zéro : une bande orange, sous la phrase (la palette du §580c).
function _pecBandeAvis(txt, bouton){
  return '<div class="pec-al or" role="status"><span class="ic">'+_mvIcon('alerte',18)+'</span><span class="tx">'+txt+'</span>'+(bouton||'')+'</div>';
}
// Des heures payées que personne n'a encore validées : dans l'engagé, sur aucun travail ni aucune parcelle. Dit en tête
//   de Postes & travaux et de Parcelles — c'était la dernière phrase d'une note de quarante mots, sous chaque tableau.
function _pecBandeAttente(E){
  if(!(E && E.reOk && E.reAttE>=1)) return '';
  return _pecBandeAvis('<b>'+_ecoH1(E.reAttH)+' h payées sans validation</b> <span style="white-space:nowrap">· '+_pilEsc(_ecoEur(E.reAttE))+'</span>', '<button class="pil-diag-go ghost" data-diag="journal">Journal ›</button>');   // MOTS-3 (§584) : la porte, comme sur la maquette
}
function _pecDfrIso(iso){ var m=_pecIsoToMs(String(iso||'').slice(0,10)); return (m===null)?'—':_pecDfrMs(m); }
function _pecVerdict(E,TL,Z){
  var M=_pecVerdictM(E,TL);
  var boutons=M.act.map(function(a){
    return a[0]==='diag'
      ? '<button class="pil-diag-go ghost" data-diag="'+_pilEsc(a[1])+'">'+_pilEsc(a[2])+' ›</button>'
      : '<button class="pil-diag-go ghost" data-pec="sub" data-v="'+_pilEsc(a[1])+'">'+_pilEsc(a[2])+' ›</button>';
  }).join('');
  // Rien ne manque au chiffrage : une coche, sans phrase — et la fiche reste à portée (elle dit ce qui est vérifié).
  var complet=(Z && !Z.length) ? _pecFiabOk('pil.eco.fiabilite') : '';
  return '<div class="pec-card"><div class="pec-verdict pec-ph"><div class="em">'+_mvIconTuile(M.ic[0],M.ic[1])+'</div><div>'
    +_pecPerLigne(complet)
    +'<div class="t">'+M.t+(M.r?(' : '+M.r):'')+'.'+(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.cadence')):'')+'</div>'
    +(M.cadre?('<div class="pec-vcadre"><span>'+M.cadre+'</span></div>'):'')
    +(boutons?('<div class="pec-vgo">'+boutons+'</div>'):'')
    +'</div></div></div>';
}

// ── Alertes : ce qui manque, ce qui dérape, ce qu'on peut corriger ───
// Chaque alerte dit QUOI, POURQUOI ça compte, et OÙ le régler. Une alerte sans
// point d'atterrissage n'est qu'un reproche.
// ════════════════════════════════════════════════════════════════════════════
// « CE QU'IL FAUT REGARDER » — DOUZE PARAGRAPHES DEVIENNENT UNE CARTE
// ════════════════════════════════════════════════════════════════════════════
// AVANT : jusqu'a douze pavés colorés empilés, de 100 à 350 caractères chacun,
// tous au meme poids visuel. On ouvrait Économie et on lisait un mur avant
// d'atteindre un chiffre. Le pire y cotoyait le details : « la main-d'oeuvre
// compte pour zero » avait la meme taille que « le chiffre montera mecaniquement ».
//
// LA REGLE DES TROIS FAMILLES, appliquee :
//   ① CE QUI CADRE — combien de postes sont a zero. Un chiffre, en gros.
//   ② CE QUI EXPLIQUE — pourquoi un poste manquant met a zero, et le detail des
//     remarques du moment : deux fiches « i », dont une VIVANTE.
//   ③ CE QUI DIT QUOI FAIRE — un bouton par poste manquant, qui ouvre l'ecran.
//
// ⚠️ RIEN N'EST SUPPRIME. Les douze constats sont tous calcules, tous lisibles.
//   Ce qui change, c'est ce qu'on voit SANS RIEN OUVRIR : le nombre de postes
//   faussés et le geste pour les combler.
//
// ⚠️⚠️ DOUBLON CONNU, NON RESOLU ICI. `_pilDiag` (le bouton « à compléter » en
//   tête de module) porte deja un constat « N fiches sans taux horaire ». Celui
//   d'ici teste `!E.hasRate` — AUCUN taux, nulle part. Deux constats voisins sur
//   la meme donnee, a deux endroits de la meme page. C'est la faute de §34 (trois
//   endroits repondaient a « combien d'ETP ? ») en plus petit. La fusion est un
//   chantier de moteur, pas d'ergonomie : elle est notee au backlog.

// Un poste de depense qu'une donnee manquante met a ZERO — pas « a peu pres ».
// ★★ Ne calcule plus rien : la liste vient de _pilDiag() (une seule définition),
//   filtrée sur les constats qui touchent le budget et mettent un poste À ZÉRO.
//   `nBudget` compte tout ce qui touche le budget — c'est le « N des M » de la
//   carte. `E` reste en argument pour le harnais et les appelants existants.
function _pecZeros(E){
  var L=[]; try{ L=_pilDiag(); }catch(e){ L=[]; }
  var B=L.filter(function(d){ return d && d.touche && d.touche.indexOf('budget')>=0; });
  var Z=B.filter(function(d){ return d.zero; }).map(function(d){
    return { nom:d.k, poste:d.poste||d.k, quoi:d.k, cible:d.cible||null, ou:d.ou||null, g:d.g };
  });
  Z.nBudget=B.length;
  return Z;
}

// Les constats qui ne mettent rien a zero : le chiffre sort, il faut seulement
// savoir comment il est fait. Ils vont dans la fiche vivante.
function _pecRemarques(E,TL){
  var R=[];
  if(E.tracSess>0 && E.tracAnon>0)
    R.push('<b>'+E.tracAnon+' session'+(E.tracAnon>1?'s':'')+'</b> de tracteur sur '+E.tracSess+' n\u2019'+(E.tracAnon>1?'ont':'a')+' pas de conducteur identifi\u00e9 (ou pas de taux) : ces heures sont valoris\u00e9es au <b>taux moyen du domaine</b>, pas au taux r\u00e9el.');
  if(!E.projOn && E.avc>0)
    R.push('Sous <b>15 % d\u2019avancement</b>, la projection du tracteur, du GNR et du phyto est neutralis\u00e9e : leur budget affiche le r\u00e9alis\u00e9 seul. Le chiffre montera m\u00e9caniquement.');
  if(TL && TL.ok && TL.socle>0 && E.engage>0 && TL.socle/E.engage>0.10)
    R.push('<b>'+_pilEsc(_pecEurK(TL.socle))+'</b> de travail fait n\u2019a <b>aucune trace dat\u00e9e</b> au journal (import ou reconstruction) : ces euros sont pos\u00e9s au premier jour de la p\u00e9riode sur la courbe, faute de mieux. Le total, lui, est juste.');
  var chers=(E.rows||[]).filter(function(r){ return r.surf>0 && E.coutHaB>0 && r.coutHa>E.coutHaB*1.3; })
                        .sort(function(a,b){ return b.coutHa-a.coutHa; });
  if(chers.length)
    R.push('<b>'+chers.length+' parcelle'+(chers.length>1?'s':'')+'</b> d\u00e9passe'+(chers.length>1?'nt':'')+' de plus de 30 % le co\u00fbt moyen \u00e0 l\u2019hectare : '
      +_pilEsc(chers.slice(0,3).map(function(r){ return r.nom+' ('+_ecoEur(r.coutHa)+'/ha)'; }).join(', '))+(chers.length>3?'\u2026':'')
      +'. \u00c0 regarder : plants, passages en plus, ou tri des t\u00e2ches.');
  if(E.cad.ok && E.cad.ecart>15){
    // ★ GARDE EXPLICITE, PAS STRUCTURELLE. La branche basse cite E.projFin : elle
    //   n'a de sens que si la projection applique vraiment l'ecart. Le if/else le
    //   garantissait par construction — et c'est le genre de garantie qu'un
    //   refactor efface sans bruit. On l'ecrit.
    if(E.cad.src==='histo' || !E.cad.applic)
      R.push('L\u2019an dernier, sur la p\u00e9riode homologue (<b>'+_pilEsc(E.cad.histoNom||'campagne pr\u00e9c\u00e9dente')+'</b>), l\u2019\u00e9quipe avait pass\u00e9 <b>'+_pilEsc(_pecPct(E.cad.ecart))+' de temps en plus</b> que le bar\u00e8me h/ha. Cette p\u00e9riode-ci n\u2019est pas encore assez avanc\u00e9e pour se mesurer elle-m\u00eame ('+Math.round(E.avc)+' % sur '+Math.round(E.cad.seuil)+' % requis) : c\u2019est un <b>rep\u00e8re</b>, pas une pr\u00e9vision.');
    else
      R.push('Sur le travail d\u00e9j\u00e0 fait, l\u2019\u00e9quipe a pass\u00e9 <b>'+_pilEsc(_pecPct(E.cad.ecart))+' de temps en plus</b> que le bar\u00e8me h/ha. Si cela tient jusqu\u2019au bout, la p\u00e9riode co\u00fbtera <b>'+_pilEsc(_pecEurK(E.projFin))+'</b> au lieu de '+_pilEsc(_pecEurK(E.budget))+'. Deux causes possibles, et elles se distinguent dans <b>Postes &amp; travaux</b> : un bar\u00e8me trop serr\u00e9, ou un travail pr\u00e9cis qui d\u00e9rape.');
  }
  else if(!E.cad.ok && E.avc>10)
    R.push(E.cad.src
      ? ('L\u2019\u00e9cart de cadence n\u2019est pas encore affich\u00e9 : il demande <b>'+Math.round(E.cad.seuil)+' %</b> du bar\u00e8me r\u00e9alis\u00e9, la p\u00e9riode en est \u00e0 <b>'+Math.round(E.avc)+' %</b>. Rien \u00e0 faire, il appara\u00eetra seul.')
      : 'L\u2019\u00e9cart de cadence est indisponible : aucune heure de planning sur cette p\u00e9riode, et aucune campagne comparable archiv\u00e9e. C\u2019est le planning qui mesure le temps pass\u00e9.');
  if(E.tot.retE>0)
    R.push('<b>'+_pilEsc(_ecoEur(E.tot.retE))+'</b> de surco\u00fbt de retard mod\u00e9lis\u00e9 sur '+E.tot.nRet+' parcelle'+(E.tot.nRet>1?'s':'')+' ('+E.rcfg.pct+' %/semaine hors fen\u00eatre, plafond '+E.rcfg.capPct+' %). <b>Mod\u00e9lis\u00e9, jamais pay\u00e9</b> : il n\u2019entre dans aucun total.');
  return R;
}

// ════════════════════════════════════════════════════════════════════════════
// LA CARTE DE FIABILITE — UN SEUL RENDU, DEUX ECRANS
// ════════════════════════════════════════════════════════════════════════════
// Ecrite pour la Synthese, elle sert a l'identique a l'Exercice : meme question
// (« combien de postes sortent a zero, et comment les combler »), donc meme
// carte. Deux implementations de la meme chose, c'est la garantie qu'elles
// divergeront — et la faute que ce chantier passe son temps a corriger.
//   Z = [{nom, quoi, cible, ou}]  les postes qu'une donnee manquante met a ZERO
//   R = [html]                    ce qui change la lecture sans rien mettre a zero
// ⚠️ La fiche des remarques est VIVANTE : ses paragraphes sont poses ici, juste
//   avant que la pastille soit rendue. Si R est vide, MV_INFO garde son repli.
// ★★ MOTS-1 (§582) — LA FIABILITÉ, EN TROIS PIÈCES, UN SEUL RENDU POUR LES DEUX ÉCRANS (la Synthèse et Le détail de l'exercice).
//   Avant : une carte (« N postes comptés pour zéro — … des 3 choses à compléter qui touchent ce budget », ou « Le chiffrage
//   est complet · taux horaires, prix du GNR… »), puis « N remarques sur la lecture de ces chiffres ». Maintenant : ce qui
//   demande un geste est une BANDE (le compte, les noms, le bouton qui y mène, la fiche) ; rien ne manque = une COCHE, sans
//   phrase (règle 3) ; les remarques sont un bouton court. La Synthèse pose la bande sous sa phrase et les remarques en bas ;
//   l'exercice garde les deux ensemble (_pecFiabCard). ⚠️ Deux rendus de la même carte divergeraient : il n'y en a qu'un.
function _pecFiabOk(cleFia){
  return '<span class="pec-ok">'+_mvIcon('check',16)+' complet'+(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn(cleFia)):'')+'</span>';
}
function _pecFiabBande(Z, cleFia){
  if(!Z || !Z.length) return '';
  var nB=Z.nBudget||Z.length;   // « 1 des 3 à compléter » : les autres choses du bandeau « à compléter » touchent ce budget sans mettre un poste à zéro
  return '<div class="pec-al" role="status"><span class="ic">'+_mvIcon('alerte',18)+'</span>'
    +'<span class="tx"><b>'+Z.length+' poste'+(Z.length>1?'s':'')+' à zéro</b> · '+_pilEsc(Z.map(function(z){ return z.nom; }).join(' · '))+(nB>Z.length?(' · '+Z.length+' des '+nB+' à compléter'):'')+'</span>'
    +Z.map(function(z){
       return z.cible ? '<button class="pil-diag-go ghost" data-diag="'+_pilEsc(z.cible)+'">'+_pilEsc(z.ou)+' ›</button>' : '';
     }).join('')
    +(typeof _mvInfoBtn==='function'?_mvInfoBtn(cleFia):'')+'</div>';
}
function _pecFiabRemq(R, cleRem){
  if(!R || !R.length) return '';
  if(typeof window._mvInfoSet==='function') window._mvInfoSet(cleRem, { p:R });
  return '<button class="pec-remq" data-mvi="'+_pilEsc(cleRem)+'">'
    +'<span class="pec-remq-n">'+R.length+'</span>remarque'+(R.length>1?'s':'')+' sur ces chiffres'
    +'<span class="pec-remq-c">›</span></button>';
}
function _pecFiabCard(Z, R, cleFia, cleRem){
  return ((Z && Z.length) ? _pecFiabBande(Z, cleFia) : ('<div class="pec-per">'+_pecFiabOk(cleFia)+'</div>'))+_pecFiabRemq(R, cleRem);
}


// ★★★ MOTS-1 (§582) — LA SYNTHÈSE : la phrase · ce qui demande un geste · quatre chiffres · le reste replié, son chiffre sur le titre.
//   Trois tuiles repliées (_pilTile, le dépliant de tout le Pilotage ; repliées par défaut : _PIL_DEFAULT.collapsed) :
//   « Coût à la fin » (le graphique, le rythme), l'exercice ou l'année vigne (_pilPanelAnBudget, qui suit la barre « Vous
//   regardez »), « Prix de revient ». La bande « L'exercice en cours » (_pecBandeExo) est partie : elle redisait, en clair,
//   les deux chiffres de la tuile de l'année posée au-dessus d'elle (58 k€ sur 159 k€, deux fois à l'écran).
function _pecTuileFin(E,TL){
  var ok=!!(TL && TL.ok), stat;
  // Le chiffre du titre est celui d'Aujourd'hui (E.projFin, par _pecTimeline : COHER-1, §581), à la même date.
  stat=(ok && TL.finV!=null)
    ? _pilStat(_pilEsc(_ecoEur(TL.finV)), TL.finPrevue?(' \u00b7 '+_pilEsc(_pecJourCourt(TL.finMs))):'', TL.projMs?('budget épuisé le '+_pilEsc(_pecJourCourt(TL.projMs))):null)
    : _pilStat('\u2014','');
  window._mvGraphSuivre('#pec-g-burn', function(w){ return _pecBurnSvg(E,TL,w); });
  var _nd=ok?Math.max(1,Math.round(TL.nDays||28)):0;
  var body='<div id="pec-g-burn"></div>'
    +'<div class="pec-leg"><span class="pec-lg"><em style="background:var(--terre)"></em>Engagé cumulé</span>'
    +'<span class="pec-lg"><i style="border-top:2px dashed var(--terre);opacity:.6"></i>Projection</span>'
    +'<span class="pec-lg"><i style="border-top:2px dashed var(--or)"></i>Budget</span>'
    +(E.cad.ok&&E.cad.applic&&Math.abs(E.cad.ecart)>5?'<span class="pec-lg"><em style="background:'+(E.projFin>E.budget?'var(--rouge)':'var(--vert-med)')+'"></em>Fin à la cadence mesurée</span>':'')
    +(TL&&TL.objMs?'<span class="pec-lg"><i style="border-top:2px dashed var(--or)"></i>Objectif de fin</span>':'')+'</div>'
    +(ok
       ? ('<div class="pec-mini" style="margin-top:14px"><div><div class="l">Rythme</div><div class="v">'+(TL.pace>0?(_pilEsc(_ecoEur(TL.pace))+'<small> par jour</small>'):'\u2014')+'</div>'
          +'<div class="s">'+(TL.pace>0?('les '+_nd+' dernier'+(_nd>1?'s':'')+' jour'+(_nd>1?'s':'')):'non mesurable')+'</div></div></div>')
       : '<div class="pec-empty">Le tracé se remplit à mesure que les travaux sont validés au journal.</div>');
  // La méthode passe derrière le « i » (règle 4) : le texte fixe est dans MV_INFO, les heures du moment se posent ici.
  if(typeof window._mvInfoSet==='function'){
    var cad=E.cad.ok
      ? ((E.cad.src==='histo'
           ? ('\u21a9\ufe0e <b>Mesuré sur la campagne précédente</b> ('+_pilEsc(E.cad.histoNom||'période homologue')+') : cette campagne n’a pas encore atteint les '+Math.round(E.cad.seuil)+' % de barème fait qu’il faut pour se mesurer elle-même. ')
           : '')
         +'<b>'+_ecoH1(E.cad.hReel)+' h</b> de présence contre <b>'+_ecoH1(E.cad.hBar)+' h</b> prévues'+(E.cad.hTrac>0?(', après déduction de '+_ecoH1(E.cad.hTrac)+' h de tracteur'):'')+'.'
         +((!E.cad.applic && typeof _pecNonRetenu==='function')?(' '+_pecNonRetenu(E)):''))
      : ('Écart de cadence neutralisé sous '+Math.round(E.cad.seuil)+' % du barème fait — '+Math.round(E.avc)+' % à ce jour, et aucune campagne comparable archivée.');
    var base=(window.MV_INFO && window.MV_INFO['pil.eco.fin'] && window.MV_INFO['pil.eco.fin'].p) || [];
    window._mvInfoSet('pil.eco.fin', { p: base.concat([cad, (E.moSrc==='planning' ? ('<b>'+_pilEsc(_ecoH1(E.tv.hVigne))+' h</b> payées dans les rangs à ce jour. ') : '')+(E.projOn?'Le tracteur, le GNR et le phyto du budget sont projetés à l’avancement.':'')]).filter(function(x){ return !!x; }) });
  }
  return _pilTile('ecofin','#8A5A38','Coût à la fin', stat, '', null, body, 'pil.eco.fin');
}
// REV-1 (§194) : la bouteille se lit sur le CYCLE du millésime (sous-vue Revient) ; l'hectare, le plant et l'heure sur la campagne.
function _pecTuileRevient(E){
  var RV=null; try{ RV=_pecRevData(); }catch(e){ RV=null; }
  var stat=_pilStat((RV&&RV.tot.eurCol!=null)?(_pecRevE2(RV.tot.eurCol)+'\u00a0\u20AC'):'\u2014',' la bouteille');
  var sub=RV?('millésime '+RV.mil+' \u00b7 '+(RV.etat==='cons'?'constaté':'probable')):'calcul indisponible';
  var mini='<div><div class="l">Engagé à l’hectare</div><div class="v">'+_pilEsc(_ecoEur(E.coutHaE))+'</div></div>';
  if(E.hasPlant) mini+='<div><div class="l">Coût du plant</div><div class="v">'+_pilEsc(_ecoEur2(E.eurPlant))+'<small> \u20AC</small></div><div class="s">'+_pilNum(E.tot.trous)+' plants à '+E.minTrou+' min</div></div>';
  mini+='<div><div class="l">Coût de l’heure</div><div class="v">'+_pilEsc(_ecoEur2(E.rate))+'<small> \u20AC/h</small></div><div class="s">taux moyen de l’équipe</div></div>';
  var body='<div class="pec-mini">'+mini+'</div>'
    +'<div class="pec-acts"><button class="pec-btn" data-pec="sub" data-v="rev"><span>'+_mvIcon('bouteille',16)+'</span> Revient du millésime</button>'
    +'<button class="pec-btn" data-pec="sub" data-v="pos"><span>'+_mvIcon('boussole',16)+'</span> Coût de la campagne</button></div>';
  return _pilTile('ecorev','#8A5A38','Prix de revient', stat, sub, null, body, 'pil.eco.revient');
}
function _pecViewSynthese(E,TL){
  var Z=_pecZeros(E);
  var H=_pecVerdict(E,TL,Z)+_pecFiabBande(Z,'pil.eco.fiabilite');
  var ec=E.cad.ok?E.cad.ecart:null;
  var dCol = (ec===null)?'var(--texte-doux)' : (ec>15?'var(--rouge)' : (ec>5?'var(--orange)' : 'var(--vert-med)'));
  var pE=E.budget>0?Math.min(100,E.engage/E.budget*100):0, pA=Math.max(0,Math.min(100,Number(E.avc)||0));
  // Un chiffre = une étiquette courte et un repère (règle 2). Les étiquettes sont celles du lexique (§580c) : budget, engagé, reste.
  H+='<div class="pec-card"><div class="pec-kpis pec-k4">'
    +'<div class="pec-k"><div class="l">Budget</div><div class="v">'+_pilEsc(_ecoEur(E.budget))+'</div>'
      +'<div class="s">'+_pilEsc(_ecoEur(E.coutHaB))+'/ha</div></div>'
    // ★ ENG-2 : les heures payées, plus un barème ; la fiche dit d'où elles viennent.
    +'<div class="pec-k"><div class="l">Engagé'+(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.eco.engage')):'')+'</div><div class="v">'+_pilEsc(_ecoEur(E.engage))+'</div>'
      +'<div class="s">'+_pecPct0(E.cons)+' du budget</div></div>'
    +'<div class="pec-k"><div class="l">Reste</div><div class="v">'+_pilEsc(_ecoEur(E.resteE))+'</div>'
      +'<div class="s">'+_pilNum(Math.round(E.tot.rH))+' h à faire</div></div>'
    // ★ LA PASTILLE VIT À CÔTÉ DU CHIFFRE QU'ELLE EXPLIQUE : la fiche pil.cadence (le seuil, le biais cave/atelier/bureau,
    //   la règle du reste à engager) se pose ici. Trouvé par le harnais, qui exige que toute fiche écrite soit posée.
    +'<div class="pec-k"><div class="l">Écart de cadence'+(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.cadence')):'')+'</div>'
      +'<div class="v" style="color:'+dCol+'">'+(ec===null?'\u2014':((ec>0?'+':'')+_pecPct(ec)))+'</div>'
      +'<div class="s">'+(ec===null
          ? (E.cad.src?('mesuré à '+Math.round(E.cad.seuil)+'\u00a0%'):'pas d’heures au planning')
          : (E.cad.src==='histo'
              ? '\u21a9\ufe0e campagne précédente \u00b7 <b>non appliqué</b>'
              : (E.cad.horsBornes ? 'hors bornes \u00b7 <b>non appliqué</b>' : 'temps passé contre barème')))+'</div></div>'
    +'</div>'
    // La barre : l'engagé, et un trait où en est le travail. Le trait à droite du plein : on engage moins vite qu'on n'avance.
    +'<div class="pec-cb" style="padding-top:16px">'
    +'<div class="pec-jr"><div class="pec-bar"><i style="width:'+pE.toFixed(1)+'%;background:'+_PEC_COL.mo+'"></i></div><span class="pec-rep" style="left:'+pA.toFixed(1)+'%"></span></div>'
    +'<div class="pec-leg"><span class="pec-lg"><em style="background:'+_PEC_COL.mo+'"></em>engagé</span>'
    +'<span class="pec-lg"><u class="pec-lgr"></u>travail fait <b>'+_pecPct0(E.avc)+'</b></span></div>'
    +'</div></div>';

  // Le reste, replié, son chiffre sur le titre (règle 5). L'avis de réglage de l'année s'ouvre avec la tuile de l'année.
  var avis=''; try{ avis=_pilAnAvisHtml(); }catch(e){ avis=''; if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pecViewSynthese#avis'); }
  var an=_pilShow('an_budget');
  H+='<div class="pil-panels">'+_pecTuileFin(E,TL)+(an?_pilPanelAnBudget(avis):'')+_pecTuileRevient(E)+'</div>';
  if(!an && avis) H+=avis;

  H+=_pecFiabRemq(_pecRemarques(E,TL),'pil.eco.remarques');
  return H;
}

// ── Vue 2 : Postes & travaux ─────────────────────────────────────────
// MOTS-3 (§584) : deux LISTES à la place des deux tableaux, comme sur la maquette validée (Nico, 16/11 : « comme la maquette »).
//   Une ligne = un nom, un montant, une jauge et son repère, une pastille quand il y a quelque chose à dire ; les autres
//   colonnes du tableau s'ouvrent d'un toucher sur la ligne (<details> : rien à écouter, rien à mémoriser).
function _pecLigne(nom, val, pct, col, rep, pst, det){
  var p=Math.max(0,Math.min(100,Number(pct)||0));
  return '<details class="pec-rg"><summary><span class="l1"><span class="nm">'+nom+'</span><span class="vl">'+val+'</span></span>'
    +'<span class="l2"><span class="pec-bar"><i style="width:'+p.toFixed(1)+'%;background:'+col+'"></i></span>'
    +(rep?('<span class="rp">'+rep+'</span>'):'')+(pst||'')+'</span></summary>'
    +'<div class="dt">'+det+'</div></details>';
}
// L'écart en pastille : orange quand le réalisé dépasse le barème du travail fait, gris quand il est en dessous. Rien sous un euro.
//   Le texte est sombre sur les deux fonds : l'orange sur orange pâle et le gris doux sur gris clair passent sous 4,5 de contraste (mv-harnais-contraste).
function _pecEcPst(ec){
  if(ec===null || ec===undefined || Math.abs(ec)<0.5) return '';
  return '<span class="pec-pill" style="'+(ec>0?'background:var(--orange-pale);color:var(--texte)':'background:var(--gris-clair);color:var(--texte-med)')+'">'+_pilEsc(_pecEcEur(ec))+'</span>';
}
function _pecViewPostes(E){
  var PROJ='<span class="pec-pill" style="background:var(--or-pale);color:var(--or-tx,#7A5E12)">projeté</span>';
  // Par poste : l'engagé, sa jauge sur le budget du poste. La base de calcul, l'euro à l'hectare et la part du budget : dans la ligne ouverte.
  var lp=E.postes.map(function(p){
    var pc=E.budget>0?(p.budget/E.budget*100):0;
    var det=[_pilEsc(p.det), (E.tot.surf>0?(_pilEsc(_ecoEur(p.budget/E.tot.surf))+'/ha'):''), _pilEsc(_pecPct(pc))+' du budget'].filter(function(x){ return !!x; }).join(' · ');
    return _pecLigne(_pilEsc(p.lab), _pilEsc(_ecoEur(p.fait)), (p.budget>0?p.fait/p.budget*100:0), p.col, 'sur '+_pilEsc(_ecoEur(p.budget)), (p.proj?PROJ:''), det);
  }).join('');
  if(E.tot.retE>0) lp+=_pecLigne('Surcoût de retard', '+'+_pilEsc(_ecoEur(E.tot.retE)), 0, _PEC_COL.ret, '',
    '<span class="pec-pill" style="background:var(--orange-pale);color:var(--orange)">hors total</span>', _ecoH1(E.tot.retH)+' h modélisées, jamais payées');
  // ★★★ DEUX CARTES S'APPELAIENT PRESQUE PAREIL. « Ou part l'argent » (ici, la CAMPAGNE) et « Ou est parti l'argent »
  //   (l'EXERCICE, _pexPostes) : un BAREME sans date (surface x h/ha x taux) contre une fenetre de DATES qui compte les achats,
  //   les reparations et les futs. La fiche pil.eco.postes dit ce que cette liste n'est pas ; le bouton du bas mene a l'exercice.
  var H=_pecEnteteVue(_pecPerLigne(''), '<b>'+_pilEsc(_ecoEur(E.engage))+'</b> engagés sur <b>'+_pilEsc(_ecoEur(E.budget))+'</b>.')+_pecBandeAttente(E);
  var cP='<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Par poste</div>'
    +'<div class="pec-cs pec-ci">'
    +(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.eco.postes')):'')+'</div></div>'+lp+'</div>';

  // RÉAL-1 : Réalisé = ce que les heures versées au travail ont coûté (planning × taux du jour) ;
  //   Écart = réalisé − barème du travail fait. Repli sans planning : réalisé = barème, pas d'écart.
  var lt=(E.tasks||[]).map(function(t){
    var det=[_ecoH1(t.bH)+' h au barème', ((E.reOk&&t.reH>0)?(_ecoH1(t.reH)+' h passées'):''), 'reste '+_ecoEur(t.rE), _ecoEur(t.euHa)+'/ha', _pecPct(t.part)+' du budget']
      .filter(function(x){ return !!x; }).map(function(x){ return _pilEsc(x); }).join(' · ');
    return _pecLigne(_pilEsc(_pilTnom(t.nom)), _pilEsc(_ecoEur(t.reE)), t.pct, 'var(--vert-med)',
      'fait '+Math.round(t.pct)+' % · budget '+_pilEsc(_ecoEur(t.bE)), _pecEcPst(t.ecE), det);
  }).join('') || '<div class="pec-empty" style="padding:14px 18px">Aucun travail chiffré.</div>';
  // MOTS-2 (§583) : « Réalisé = …, Écart = … » est dans la fiche pil.eco.travaux ; les heures sans validation, en tête (_pecBandeAttente).
  var tNote='';
  if(E.reOk){ if(E.reHorsE>=1) tNote='<b>'+_pilEsc(_ecoEur(E.reHorsE))+'</b> versés à des travaux hors de la liste de la campagne.'; }
  else tNote='Planning pas encore ouvert : le réalisé est au barème.';
  var cT='<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Par travail</div>'
    +'<div class="pec-cs pec-ci">main-d’œuvre'
    +(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.eco.travaux')):'')+'</div></div>'+lt
    +(tNote?('<div class="pec-cb"><div class="pec-vcadre"><span>'+tNote+'</span></div></div>'):'')+'</div>';
  H+='<div class="pec-g2">'+cP+'<div>'+cT+'<div class="pil-panels pec-p1">'+_pecTuileTemps()+'</div></div></div>'
    +'<div class="pec-acts"><button class="pec-btn" data-pec="sub" data-v="exe"><span>'+_mvIcon('calendrier',16)+'</span> '+_pilEsc(_pecDetailLib())+'</button>'
    +'<button class="pec-btn" data-pec="sub" data-v="par"><span>'+_mvIcon('raisin',16)+'</span> Parcelle par parcelle</button></div>';
  return H;
}

// ── TV-1 : le temps réel contre le barème, travail par travail ───────
// Lit _ecoTempsVigne, ne calcule rien. Le chiffre qui compte est le h/ha RÉEL à
// côté du h/ha du BARÈME : « plus vite ou plus lent que la convention ».
// MOTS-3 (§584) : une tuile REPLIÉE, son chiffre sur le titre (règle 5) — un seul travail mesuré : son h/ha réel et son barème ;
//   plusieurs : l'écart de toutes les heures validées au barème des mêmes surfaces.
function _pecTuileTemps(){
  var V=null; try{ V=_ecoTempsVigne(); }catch(e){ V=null; if(window.logError) window.logError({level:'info',cat:'eco',msg:'temps vigne illisible'}); }
  var stat=_pilStat('—',''), sub='', body='';
  if(!V || !V.ok){
    body='<div class="pec-empty">Période sans dates, pas encore commencée, ou planning pas encore ouvert : rien à verser.</div>';
  } else if(!V.taches.length){
    body='<div class="pec-empty">Aucune validation sur la période pour l’instant. Les heures du planning attendent la première : <b>'
      +_ecoH1(V.hAtt)+' h</b> en attente.</div>';
  } else {
    var mes=V.taches.filter(function(t){ return t.h>0 && t.surf>0; });
    if(mes.length===1){ stat=_pilStat(_ecoH1(mes[0].hhaR),' h/ha · barème '+_ecoH1(mes[0].hhaB)); sub=_pilTnom(mes[0].nom); }
    else if(mes.length>1){
      var hR=0, hB=0; mes.forEach(function(t){ hR+=t.h; hB+=(Number(t.bar)||0); });
      var g=hB>0?((hR-hB)/hB*100):null;
      if(g!==null) stat=_pilStat((g>0?'+':(g<0?'−':''))+Math.round(Math.abs(g))+' %',' contre barème');
      sub=mes.length+' travaux mesurés';
    }
    var rows=V.taches.map(function(t){
      var ec=t.ecart, col=(ec===null)?'var(--texte-doux)':(ec>15?'var(--rouge)':(ec>5?'var(--orange)':(ec<-8?'var(--vert-med)':'var(--texte)')));
      return '<tr><td class="n">'+_pilEsc(_pilTnom(t.nom))+'</td>'
        +'<td class="r">'+_pilHa(Math.round(t.surf*100)/100)+'</td>'
        +'<td class="r">'+_ecoH1(t.h)+'</td>'
        +'<td class="r"><b>'+(t.h>0?_ecoH1(t.hhaR):'—')+'</b></td>'
        +'<td class="r">'+_ecoH1(t.hhaB)+'</td>'
        +'<td class="r" style="color:'+col+'">'+(ec===null?'—':((ec>0?'+':'')+Math.round(ec)+' %'))+'</td></tr>'
        // ARRACH-3 : sous la ligne Arrachage, une ligne par étape faite par l'équipe (pas les prestataires).
        +((t.nom==='Arrachage')?(V.etapes||[]).map(function(x){
          return '<tr><td class="n" style="padding-left:16px">· '+_pilEsc(x.lbl)+'</td>'
            +'<td class="r">'+_pilHa(Math.round(x.surf*100)/100)+'</td>'
            +'<td class="r">'+_ecoH1(x.h)+'</td>'
            +'<td class="r"><b>'+(x.h>0?_ecoH1(x.hhaR):'—')+'</b></td>'
            +'<td class="r">—</td><td class="r">—</td></tr>';
        }).join(''):'');
    }).join('');
    var att=V.gens.filter(function(g2){ return g2.hAtt>=0.5; });
    var attTxt=att.length
      ? (' · <b>'+_ecoH1(V.hAtt)+' h en attente</b> ('+_pilEsc(att.slice(0,3).map(function(g2){ return g2.nom+' '+_ecoH1(g2.hAtt)+' h'; }).join(', '))+(att.length>3?'…':'')+')')
      : '';
    body='<div class="pec-scroll"><table class="pec-tbl" style="min-width:480px"><thead><tr><th>Travail</th><th class="r">ha</th><th class="r">Heures</th><th class="r">h/ha réel</th><th class="r">h/ha barème</th><th class="r">Écart</th></tr></thead>'
      +'<tbody>'+rows+'</tbody></table></div>'
      +'<div class="pec-vcadre"><span><b>'+_ecoH1(V.hAff)+' h</b> sur '+V.nEv+' validation'+(V.nEv>1?'s':'')
      +(V.hTrac>0?(' · '+_ecoH1(V.hTrac)+' h de conduite tracteur retirées'):'')
      +(V.hCave>0?(' · '+_ecoH1(V.hCave)+' h de journées de cave retirées'):'')+attTxt+'.</span></div>';
  }
  return _pilTile('ecotemps','#8A5A38','Temps réel contre barème', stat, sub, null, body, 'pil.eco.temps');
}

// ── Vue 3 : Parcelles ────────────────────────────────────────────────
var _PEC_COLS=[
  ['nom',   'Parcelle',  0],
  ['surf',  'ha',        1],
  ['pct',   'Fait',      1],
  ['moRe',  'MO',        1],
  ['tracF', 'Tracteur',  1],
  ['gnrF',  'GNR',       1],
  ['phyF',  'Phyto',     1],
  ['prestF','Presta.',   1],
  ['engRe', 'R\u00e9alis\u00e9',1],
  ['ecE',   '\u00c9cart',  1],
  ['reste', 'Reste',     1],
  ['budget','Budget',    1],
  ['coutHa','\u20AC/ha', 1]
];
function _pecSortRows(E){
  var k=_PEC_PSORT, dir=_PEC_PDIR;
  if(k==='moF') k='moRe'; else if(k==='engage') k='engRe';   // RÉAL-1 : anciens tris mémorisés
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
    if(r.arr) badge='<span class="pec-pill" style="background:var(--rouge-pale);color:var(--rouge-tx,#A0291E)" title="vigne arrach\u00e9e : ce qu\u2019elle a co\u00fbt\u00e9 sur la p\u00e9riode, sans bar\u00e8me ni surface au total">arrach\u00e9e</span>';   // ARRACH-4
    var ret = r.retE>0 ? ' <span class="pec-pill" style="background:var(--orange-pale);color:var(--orange)" title="surco\u00fbt de retard mod\u00e9lis\u00e9, hors total">+'+_ecoEur(r.retE)+' retard</span>' : '';
    var plants = r.trous>0 ? ' <span class="pec-pill" style="background:var(--tag-purple-bg);color:var(--tag-purple-tx)">'+_pilNum(r.trous)+' plants</span>' : '';
    var pcol=_pilPctColor(r.pct);
    return '<tr><td class="n">'+_pilEsc(r.nom)+'<div style="margin-top:4px;display:flex;gap:5px;flex-wrap:wrap">'+badge+plants+ret+'</div></td>'
      +'<td class="r">'+_pilHa(r.surf)+'</td>'
      +(r.arr?'<td class="r">\u2014</td>':('<td class="r" style="color:'+pcol+';font-weight:600">'+Math.round(r.pct)+' %</td>'))
      +'<td class="r">'+_pilEsc(_ecoEur(r.moRe))+'</td>'
      +'<td class="r">'+(r.tracF>0?_pilEsc(_ecoEur(r.tracF)):'\u2014')+'</td>'
      +'<td class="r">'+(r.gnrF>0?_pilEsc(_ecoEur(r.gnrF)):'\u2014')+'</td>'
      +'<td class="r">'+(r.phyF>0?_pilEsc(_ecoEur(r.phyF)):'\u2014')+'</td>'
      +'<td class="r">'+(r.prestF>0?_pilEsc(_ecoEur(r.prestF)):'\u2014')+'</td>'
      +'<td class="r">'+_pilEsc(_ecoEur(r.engRe))+'</td>'
      +_pecEcTd(r.ecE, r.moF)
      +'<td class="r">'+_pilEsc(_ecoEur(r.reste))+'</td>'
      +'<td class="r n">'+_pilEsc(_ecoEur(r.budget))+'</td>'
      +'<td class="r">'+_pilEsc(_ecoEur(r.coutHa))+'</td></tr>';
  }).join('') || '<tr><td colspan="13" class="pec-empty">Aucune parcelle active.</td></tr>';
  var foot='<tr><td>'+rows.length+' parcelle'+(rows.length>1?'s':'')+'</td>'
    +'<td class="r">'+_pilHa(E.tot.surf)+'</td><td class="r">'+Math.round(E.avc)+' %</td>'
    +'<td class="r">'+_pilEsc(_ecoEur(E.tot.moRe))+'</td><td class="r">'+_pilEsc(_ecoEur(E.tot.tracF))+'</td>'
    +'<td class="r">'+_pilEsc(_ecoEur(E.tot.gnrF))+'</td><td class="r">'+_pilEsc(_ecoEur(E.tot.phyF))+'</td>'
    +'<td class="r">'+_pilEsc(_ecoEur(E.tot.prestF||0))+'</td>'
    +'<td class="r">'+_pilEsc(_ecoEur(E.engRe))+'</td>'+_pecEcTd(E.ecRe, E.tot.moF)+'<td class="r">'+_pilEsc(_ecoEur(E.tot.moR))+'</td>'
    +'<td class="r">'+_pilEsc(_ecoEur(E.budget))+'</td><td class="r">'+_pilEsc(_ecoEur(E.coutHaB))+'</td></tr>';
  var H=_pecEnteteVue(_pecPerLigne(''), '<b>'+_pilEsc(_ecoEur(E.engRe))+'</b> réalisés sur <b>'+E.rows.length+' parcelle'+(E.rows.length>1?'s':'')+'</b>.')+_pecBandeAttente(E);
  // MOTS-3 (§584) : la LISTE d'abord — une ligne par parcelle, dans l'ordre du tri mémorisé : le réalisé, sa jauge sur le budget
  //   de la parcelle, l'écart en pastille ; le reste des treize colonnes dans la ligne ouverte. Le tableau complet reste, replié.
  var lst=rows.map(function(r){
    var src=r.arr?'arrachée':(r.src==='reel'?'équipe réelle':'taux moyen');
    var det=[(r.arr?'':('fait '+Math.round(r.pct)+' %')), ((r.moRe>0||r.src==='reel')?('main-d’œuvre '+_ecoEur(r.moRe)):''),
      (r.tracF>0?('tracteur '+_ecoEur(r.tracF)):''), (r.gnrF>0?('GNR '+_ecoEur(r.gnrF)):''), (r.phyF>0?('phyto '+_ecoEur(r.phyF)):''),
      (r.prestF>0?('prestations '+_ecoEur(r.prestF)):''), 'reste '+_ecoEur(r.reste), _ecoEur(r.coutHa)+'/ha',
      (r.trous>0?(_pilNum(r.trous)+' plants'):''), (r.retE>0?('+'+_ecoEur(r.retE)+' de retard, hors total'):''), src]
      .filter(function(x){ return !!x; }).map(function(x){ return _pilEsc(x); }).join(' · ');
    return _pecLigne(_pilEsc(r.nom)+'<small>'+_pilHa(r.surf)+' ha</small>', _pilEsc(_ecoEur(r.engRe)), (r.budget>0?r.engRe/r.budget*100:0), _PEC_COL.mo,
      'sur '+_pilEsc(_ecoEur(r.budget)), _pecEcPst(r.ecE), det);
  }).join('') || '<div class="pec-empty" style="padding:14px 18px">Aucune parcelle active.</div>';
  var cL='<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Parcelle par parcelle</div>'
    // ★ LA LEGENDE DES COLONNES N'EST PAS UN CADRE : c'est un mode d'emploi. Il est dans la fiche.
    +'<div class="pec-cs pec-ci">réalisé'
    +(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.eco.parcelles')):'')+'</div></div>'+lst+'</div>';
  // Quatre chiffres, chacun son repère (règle 2). « Reste » est ici la main-d'œuvre qui reste à faire, au barème — le total de la
  //   colonne du tableau —, pas le « Reste » de la Synthèse (budget moins engagé) : le repère le dit.
  var kp='<div class="pec-card"><div class="pec-kpis pec-k2">'
    +'<div class="pec-k"><div class="l">Budget</div><div class="v">'+_pilEsc(_ecoEur(E.budget))+'</div><div class="s">'+_pilHa(E.tot.surf)+' ha</div></div>'
    +'<div class="pec-k"><div class="l">Reste</div><div class="v">'+_pilEsc(_ecoEur(E.tot.moR))+'</div><div class="s">de main-d’œuvre</div></div>'
    +'<div class="pec-k"><div class="l">Écart</div><div class="v">'+_pilEsc(_pecEcEur(E.ecRe))+'</div><div class="s">contre le barème</div></div>'
    +'<div class="pec-k"><div class="l">À l’hectare</div><div class="v">'+_pilEsc(_ecoEur(E.coutHaB))+'</div><div class="s">de budget</div></div>'
    +'</div></div>';
  window._mvGraphSuivre('#pec-g-ecart', function(w){ return _pecEcartSvg(E,w); });
  var tE=_pilTile('ecoecart','#8A5A38','Écart au coût moyen à l’hectare', _pilStat(_pilEsc(_ecoEur(E.coutHaB)),' par ha'), 'à surface égale', null,
    '<div id="pec-g-ecart"></div>', 'pil.eco.parcelles');
  var tT=_pilTile('ecotab','#8A5A38','Le tableau complet', _pilStat(String(rows.length),' parcelle'+(rows.length>1?'s':'')), 'treize colonnes, à trier', null,
    '<div class="pec-scroll"><table class="pec-tbl" style="min-width:1040px"><thead><tr>'+head+'</tr></thead><tbody>'+body+'</tbody><tfoot>'+foot+'</tfoot></table></div>');
  H+='<div class="pec-g2 pec-g21">'+cL+'<div>'+kp+'<div class="pil-panels pec-p1">'+tE+'</div></div></div>'
    +'<div class="pil-panels pec-p1">'+tT+'</div>'
    +'<div class="pec-acts"><button class="pec-btn" data-pec="csv"><span>'+_mvIcon('chevron',16)+'</span> Tableau (CSV)</button>'
    +'<button class="pec-btn" data-pec="copy"><span>'+_mvIcon('liste',16)+'</span> Copier</button></div>';
  return H;
}

// ── Export : le tableau, tel qu'il est trié à l'écran ────────────────
function _pecTableTxt(E,sep){
  var rows=_pecSortRows(E);
  var L=[['Parcelle','Surface ha','Avancement %','MO realisee EUR','Tracteur EUR','GNR EUR','Phyto EUR','Prestations EUR','Realise EUR','Ecart EUR','MO bareme du fait EUR','Heures realisees','Reste EUR','Budget EUR','EUR par ha','Heures budget','Heures restantes','Taux EUR/h','Source taux','Plants','Retard modelise EUR'].join(sep)];
  function n2(v){ return String(Math.round((Number(v)||0)*100)/100).replace('.',','); }
  rows.forEach(function(r){
    L.push([String(r.nom).replace(/[\t\r\n;]/g,' '), n2(r.surf), Math.round(r.pct), n2(r.moRe), n2(r.tracF), n2(r.gnrF), n2(r.phyF), n2(r.prestF||0),
            n2(r.engRe), (r.ecE===null?'':n2(r.ecE)), n2(r.moF), n2(r.hRe), n2(r.reste), n2(r.budget), n2(r.coutHa), n2(r.bH), n2(r.rH), n2(r.tx),
            (r.src==='reel'?'equipe reelle':'taux moyen'), r.trous||0, n2(r.retE)].join(sep));
  });
  L.push(['TOTAL', n2(E.tot.surf), Math.round(E.avc), n2(E.tot.moRe), n2(E.tot.tracF), n2(E.tot.gnrF), n2(E.tot.phyF), n2(E.tot.prestF||0),
          n2(E.engRe), (E.ecRe===null?'':n2(E.ecRe)), n2(E.tot.moF), '', n2(E.tot.moR), n2(E.budget), n2(E.coutHaB), n2(E.tot.bH), n2(E.tot.rH), n2(E.rate), '', E.tot.trous, n2(E.tot.retE)].join(sep));
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
var _PEC_SUBS=[['syn','graphique','Synth\u00e8se'],['pos','cible','Postes & travaux'],['par','raisin','Parcelles'],['rev','bouteille','Revient'],['ach','euro','Achats'],['exe','calendrier','Le d\u00e9tail']];
// Le nom de la sous-vue détaillée dit ce qu'elle montre : le cadre de la barre (PIL-RANGE-4b, §447).
function _pecDetailLib(){ return (_PIL_SCOPE && _PIL_SCOPE.cadre==='vig') ? 'Le d\u00e9tail de l\u2019ann\u00e9e vigne' : 'Le d\u00e9tail de l\u2019exercice'; }
function _pecSubNav(E){
  var b=_PEC_SUBS.map(function(s){
    var ic=(typeof _mvIcon==='function')?_mvIcon(s[1],16):'';
    var lib=s[2]; if(s[0]==='exe') lib=_pecDetailLib();   // PIL-RANGE-4b : « Le détail de l'exercice » ou « … de l'année vigne », selon la barre
    return '<button data-pec="sub" data-v="'+s[0]+'"'+(s[0]===_PEC_SUB?' class="on"':'')+'><span style="margin-right:6px;display:inline-flex;vertical-align:-3px">'+ic+'</span>'+lib+'</button>';
  }).join('');
  return '<div class="pec-subnav"><div class="pec-sub">'+b+'</div></div>';   // MOTS-2 (§583) : plus de ligne « … · ha · taux moyen » — chaque sous-vue ouvre sur son cadre
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
//   CARBURANT GNR     les LITRES DES PLEINS releves sur l'exercice, chacun a SA date,
//                     au prix du litre en vigueur A CETTE DATE (moyenne ponderee des
//                     appoints livres jusque-la). Aucun plein releve : repli sur
//                     l'ancien modele heures x conso x prix, et l'ecran le dit.
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
function _pexEx(){
  // ★★ PIL-RANGE-4b (§447) — « LE DÉTAIL » SUIT LA BARRE « VOUS REGARDEZ ». Avant, la sous-vue gardait son propre choix
  //   d'année (_PEX_AN, ses puces 2026-27 / 2025-26…) : la barre pouvait dire 2026-27 et le détail montrer 2025-26.
  //   Elle lit maintenant le cadre de la barre (_pilAnCadre().F : l'exercice ou l'année vigne, avec les flèches) — la
  //   même fenêtre que « Le budget de l'année ». Sans cadre lisible : l'exercice en cours.
  var C=null; try{ C=_pilAnCadre(); }catch(e){ C=null; }
  if(C && C.F) return C.F;
  return (typeof window._mvExercice==='function') ? window._mvExercice() : null;
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

// ── Decoupage d'un mois aux dates de changement de taux ─────────────────────
// Rend les sous-fenetres [d0,d1] sur lesquelles le taux d'une personne est CONSTANT.
// Serie absente ou sans changement dans le mois -> UNE seule fenetre, identique au
// mois : le chemin nominal ne coute rien et ne change aucun total.
// Le lendemain / le décalage en jours d'une date ISO, en UTC de bout en bout
// (la règle de _mvJourApres : jamais minuit local relu en UTC).
function _pexJourApres(iso){ return _pexIsoPlus(iso,1); }
function _pexIsoToMs2(iso){ var p=String(iso||'').split('-'); return Date.UTC(+p[0],(+p[1]||1)-1,(+p[2]||1)); }
function _pexIsoPlus(iso,n){ var d=new Date(_pexIsoToMs2(iso)+n*86400000); return d.toISOString().slice(0,10); }
function _pexJourAvant(iso){
  var p=String(iso||'').split('-');
  if(p.length!==3) return iso;
  var d=new Date(Number(p[0]),Number(p[1])-1,Number(p[2]));
  d.setDate(d.getDate()-1);
  return _pexIso(d.getFullYear(),d.getMonth(),d.getDate());
}
function _pexSegsTaux(nom, d0, d1){
  var S=(typeof window._mvPaieSerie==='function')?(window._mvPaieSerie(nom)||[]):[];
  var cuts=[d0];
  S.forEach(function(e){
    if(e && e.d>d0 && e.d<=d1 && cuts.indexOf(e.d)<0) cuts.push(e.d);
  });
  if(cuts.length===1) return [{d0:d0,d1:d1}];
  cuts.sort();
  var out=[];
  for(var i=0;i<cuts.length;i++){
    var a=cuts[i], b=(i+1<cuts.length)?_pexJourAvant(cuts[i+1]):d1;
    if(b>=a) out.push({d0:a,d1:b});
  }
  return out;
}

// ── Moteur ──────────────────────────────────────────────────────────
// `noCmp` coupe la comparaison a l'exercice precedent : c'est le garde-fou contre
// la recursion infinie, l'appel N-1 se faisant avec noCmp=true.
// ★★★ LA COUPE — ENGAGÉ / PRÉVU (lot PIL-EXO, 10/09/2026).
//   L'exercice affichait « Dépenses de l'exercice 216 k€ · 10 113 h payées » un
//   10 septembre : deux mois sortis et dix mois LUS DANS LA GRILLE du planning,
//   sous les mots « payées » et « sorti ». `enCours` existait et ne servait qu'au
//   mot « en cours ». L'exercice est désormais coupé AU JOUR :
//     engagé = tout ce qui est daté jusqu'à la coupe (salaires payés, pleins,
//              achats, réparations) ;
//     prévu  = les salaires que la grille annonce APRÈS la coupe, jusqu'à la
//              clôture — et les amendements chiffrés pas encore facturés (FERTI-2) : un plein n'a pas de prévu.
//   La coupe vaut aujourd'hui (exercice en cours), la clôture (exercice clos :
//   tout est engagé), la veille de l'ouverture (exercice futur : tout est prévu),
//   ou la date passée en 3e argument — c'est ce qui permet de comparer l'an
//   dernier « à date comparable », aux mêmes jours.
//   ⚠️ Les lecteurs existants (photos, cadres, budget de l'année, diagnostic)
//   lisent `total` et `byM[].sal` : ils voient l'ENGAGÉ, ce qui est réel.
//   `totalP` / `salP` / `byM[].salP` portent le prévu, `totalClot` la somme.
function _pexData(ex, noCmp, coupeIso){
  ex = ex || _pexEx();
  if(!ex) return null;
  var cfg=_ecoCfg();
  var mois=_pexMoisWin(ex);
  var byM={}; mois.forEach(function(mo){ byM[mo.k]={sal:0, salP:0, gnr:0, ach:0, dep:0, fut:0, pre:0, achP:0}; });
  var _n=new Date();
  var auj=(typeof window._mvAujIso==='function')?window._mvAujIso():_pexIso(_n.getFullYear(),_n.getMonth(),_n.getDate());
  var enCours=(auj>=ex.d0 && auj<=ex.d1);
  var coupe=(typeof coupeIso==='string'&&coupeIso)?coupeIso:(enCours?auj:((auj>ex.d1)?ex.d1:_pexJourAvant(ex.d0)));
  if(coupe>ex.d1) coupe=ex.d1;
  var dFin=(coupe<ex.d1)?coupe:ex.d1;           // borne des faits DATÉS (engagé)
  var enCoursC=(coupe>=ex.d0 && coupe<ex.d1);   // il reste du prévu après la coupe

  // ── 1) SALAIRES CHARGES ────────────────────────────────────────────
  // Qui ? Toute personne SOUS CONTRAT sur la fenetre — la meme question que partout
  // ailleurs depuis le correctif des saisonniers disparus de l'historique. Le
  // « bureau » N'EST PAS exclu : c'est un salaire, et on chiffre une masse salariale.
  // Combien ? heures payees x taux CHARGE de la fiche. Le taux est deja le cout
  // employeur : rien ne se multiplie par-dessus (definition unique dans _ecoCfg).
  var okPer=(typeof window._mvEnContratSurPeriode==='function');
  var mbrs=(window.MEMBRES||[]).filter(function(m){
    if(!m||!m.nom) return false;
    // ★ 4e argument true (10/09/2026) : SANS lui, _mvEnContratSurPeriode ecartait le
    //   bureau des sa premiere ligne — et le commentaire ci-dessus etait faux depuis
    //   le 14/08 (defaut 0a-quater). Les salaires administratifs entrent enfin dans
    //   la masse salariale ; la pastille « bureau » du tableau peut s'afficher.
    return okPer ? window._mvEnContratSurPeriode(m,ex.d0,ex.d1,true) : (m.statut!=='Inactif');
  });
  var canPaid=(typeof window._planPaidRange==='function');
  var canWork=(typeof window._planWorkPersRange==='function');
  var gens=[], salT=0, salP=0, hPaid=0, hPaidP=0, hWork=0, nSansTaux=0, hSansTaux=0;
  mbrs.forEach(function(mb){
    if(!canPaid) return;
    // ★★★ TAUX A LA DATE, SEGMENT PAR SEGMENT. Un mois est DECOUPE aux dates de
    // changement de taux : une augmentation au 15 mars ne revalorise pas les quinze
    // premiers jours. C'est tout l'objet du lot — un exercice DEJA CLOS ne doit plus
    // bouger parce qu'on augmente quelqu'un aujourd'hui. Resoudre au mois entier
    // aurait suffi a 95 %, et menti sur les 5 % restants avec l'autorite d'un total.
    var hp=0, hpP=0, eur=0, eurP=0, hNoTx=0, txs=[];
    mois.forEach(function(mo){
      _pexSegsTaux(mb.nom, mo.d0, mo.d1).forEach(function(sg){
        var tx=(typeof window._mvPaieTauxEffAt==='function')?(Number(window._mvPaieTauxEffAt(mb,sg.d0))||0):0;
        // ★ Le segment est coupé à la coupe : jusqu'à elle, ENGAGÉ ; après, PRÉVU.
        //   Un mois entamé est donc coupé au jour, pas compté en entier d'un côté.
        var parts=[];
        if(sg.d0<=coupe) parts.push({d0:sg.d0, d1:(sg.d1<=coupe?sg.d1:coupe), prevu:false});
        if(sg.d1>coupe)  parts.push({d0:(sg.d0>coupe?sg.d0:_pexJourApres(coupe)), d1:sg.d1, prevu:true});
        parts.forEach(function(pt){
          if(pt.d1<pt.d0) return;
          var h=Number(window._planPaidRange(mb,_pexD(pt.d0),_pexD(pt.d1)))||0;
          if(!(h>0)) return;
          if(pt.prevu){ hpP+=h; if(tx>0){ eurP+=h*tx; byM[mo.k].salP+=h*tx; } else hNoTx+=h; return; }
          hp+=h;
          if(tx>0){
            eur+=h*tx; byM[mo.k].sal+=h*tx;
            var L=txs[txs.length-1];
            if(L && Math.abs(L.v-tx)<0.001) L.h+=h; else txs.push({v:tx,h:h});
          } else hNoTx+=h;
        });
      });
    });
    var hw=(canWork && dFin>=ex.d0)?(Number(window._planWorkPersRange(mb,_pexD(ex.d0),_pexD(dFin)))||0):0;
    if(hp<=0 && hw<=0 && hpP<=0) return;
    // Taux moyen PONDERE par les heures de chaque segment — le seul nombre unique
    // qui ait un sens quand le taux a bouge en cours d'exercice.
    var txMoy=((hp-hNoTx)>0)?(eur/(hp-hNoTx)):0;
    // On compte les personnes SANS taux, et on retient leurs heures : c'est l'ampleur
    // du trou, pas son nombre de lignes, qui interesse celui qui lit un exercice.
    // ⚠️ On ne compte plus que les heures REELLEMENT non valorisees : quelqu'un dont
    // le taux ne commence qu'en cours d'exercice n'a plus tout son exercice compte
    // comme un trou.
    if(hNoTx>0.05){ nSansTaux++; hSansTaux+=hNoTx; }
    gens.push({ nom:mb.nom, tx:txMoy, txs:txs, hNoTx:hNoTx, hp:hp, hpP:hpP, hw:hw, eur:eur, eurP:eurP,
                coll:!!(window._mvEstCollectif&&window._mvEstCollectif(mb)),
                bureau:!!mb.bureau });
    salT+=eur; salP+=eurP; hPaid+=hp; hPaidP+=hpP; hWork+=hw;
  });
  gens.sort(function(a,b){ return b.eur-a.eur || (a.nom<b.nom?-1:1); });

  // ── 2) CARBURANT GNR ───────────────────────────────────────────────
  // Fenetre passee a _ecoTracHByParc : MEME fonction que la campagne, filtree par
  // dates au lieu de la periode. Aucune copie privee de « ce que coute une session ».
  var trac=_ecoTracHByParc({d0:ex.d0,d1:dFin});
  var gnrT=0, tracH=0;
  Object.keys(trac.hByDate||{}).forEach(function(iso){ tracH+=trac.hByDate[iso]||0; });
  // ★ Ici, AUCUNE repartition a faire : l'exercice raisonne par mois, et un plein porte
  //   deja sa date. Les litres tombent dans leur mois, exactement.
  var gnrR=_ecoGnrReel({d0:ex.d0,d1:dFin});
  var gnrSrc=gnrR.ok?'reel':'modele', litres=0;
  function _gnrMois(iso,v){
    gnrT+=v;
    var k=parseInt(iso.slice(0,4),10)+'-'+(parseInt(iso.slice(5,7),10)-1);
    if(byM[k]) byM[k].gnr+=v;
  }
  if(gnrR.ok){
    litres=gnrR.L;
    Object.keys(gnrR.byDate).forEach(function(iso){ _gnrMois(iso, gnrR.byDate[iso]||0); });
  } else {
    Object.keys(trac.gnrByDate||{}).forEach(function(iso){ _gnrMois(iso, trac.gnrByDate[iso]||0); });
    litres=(cfg.conso>0)?tracH*cfg.conso:0;
  }

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
    if(iso<ex.d0||iso>dFin) return;
    nAch++;
    var eur=Number(a.prix)||0;
    if(!(eur>0)) nAchSansPrix++;
    achT+=eur;
    var k=parseInt(iso.slice(0,4),10)+'-'+(parseInt(iso.slice(5,7),10)-1);
    if(byM[k]) byM[k].ach+=eur;
    var pr=prodBy[a.prodId]||null;
    achRows.push({ date:iso, nom:(pr&&pr.nom)||'\u2014', four:a.four||'',
                   q:Number(a.q)||0, unite:(pr&&pr.unite)?((typeof window._rsvUnite==='function')?window._rsvUnite(pr.unite,Number(a.q)||0):pr.unite):'', eur:eur });   // INTRANT-1 (§553) : « 500 pièces », l'unité s'accorde (reserve.js)
  });
  achRows.sort(function(a,b){ return a.date<b.date?1:-1; });
  // ── 3 bis) ACHATS PRÉVUS — FERTI-2 (02/10) ─────────────────────────
  // Un amendement enregistré avec un prix (INTRANTS.fertil[].cout) est une
  // dépense ANNONCÉE : il entre au prévu de l'exercice en cours, à la date de sa
  // semaine prévue (sinon de sa création), et en SORT dès qu'un achat CHIFFRÉ du
  // même produit, daté après l'amendement, est saisi dans La Réserve — c'est alors
  // la facture qui compte, à l'engagé. Jamais les deux à la fois.
  // ⚠️ Un apport sans prix ne prévoit rien (jamais un montant inventé).
  var achP=0, nAchP=0;
  if(enCoursC){
    ((window.INTRANTS&&Array.isArray(window.INTRANTS.fertil))?window.INTRANTS.fertil:[]).forEach(function(op){
      if(!op||!(Number(op.cout)>0)) return;
      var dp=String(op.sem||op.cree||'').slice(0,10);
      if(!dp||dp<ex.d0||dp>ex.d1) return;
      var c0=String(op.cree||'').slice(0,10);
      var facture=ach.some(function(a){ return a&&a.prodId===op.prodId&&Number(a.prix)>0&&String(a.date||'').slice(0,10)>=c0&&String(a.date||'').slice(0,10)<=dFin; });
      if(facture) return;
      achP+=Number(op.cout); nAchP++;
      // ANNEE-1 (§234) : le prevu d'un amendement trouve son MOIS (la semaine prevue) —
      //   sans lui, le graphe mensuel de L'annee ne retombait pas sur le total prevu.
      var _kp=parseInt(dp.slice(0,4),10)+'-'+(parseInt(dp.slice(5,7),10)-1); if(byM[_kp]) byM[_kp].achP+=Number(op.cout);
    });
  }

  // ── 4) REPARATIONS : ce qui est passe chez le reparateur ───────────
  // ⚠️ La source est REPARATEUR_HIST, pas les fiches d'entretien. Le cycle
  //   « emmene chez le reparateur -> rentre » EST le signal d'une intervention
  //   payante, et il existait deja : date de depart, date de retour, motif. Une
  //   fiche d'entretien, elle, est une checklist quotidienne — plein, huile,
  //   pression — qui n'a rien d'un achat.
  // ⚠️⚠️ `eur != null` et NON `eur > 0` : un montant a ZERO est une VALEUR
  //   (garantie, geste commercial), pas une absence. Le confondre avec un vide
  //   ferait repasser une reparation sous garantie en « a chiffrer » a vie.
  var RH=(window.REPARATEUR_HIST&&typeof window.REPARATEUR_HIST==='object')?window.REPARATEUR_HIST:{};
  var repT=0, nRep=0, nRepSansPrix=0, repRows=[];
  Object.keys(RH).forEach(function(tid){
    var arr=RH[tid]; if(!Array.isArray(arr)) return;
    arr.forEach(function(r){
      if(!r||!r.retour) return;               // ventile a la date de RETOUR
      var iso=String(r.retour).slice(0,10);
      if(iso<ex.d0||iso>dFin) return;
      nRep++;
      var e=(r.eur!=null&&isFinite(Number(r.eur)))?Number(r.eur):null;
      if(e==null) nRepSansPrix++; else repT+=e;
      var k=parseInt(iso.slice(0,4),10)+'-'+(parseInt(iso.slice(5,7),10)-1);
      if(byM[k]&&e!=null) byM[k].dep+=e;
      repRows.push({ date:iso, depuis:r.depuis||'', lib:r.motif||'Intervention',
                     four:r.four||'', eur:e, tid:tid });
    });
  });
  repRows.sort(function(a,b){ return a.date<b.date?1:-1; });

  // ── 4b) LES FUTS — LOUES ET ACHETES ────────────────────────────────
  // ⚠️ CE BLOC MANQUAIT DEPUIS LE PREMIER JOUR. `_pexData` ne lisait pas une seule
  //   fois INTRANTS.futs, pendant que DEUX textes de l'application promettaient le
  //   contraire : la carte « Ce qui n'entre pas dans ce total » et la fiche d'aide
  //   `pil.exo.postes`, toutes deux ecrivant « une location de futs, elle, entre ».
  //   Une promesse ecrite deux fois, tenue zero fois.
  // ⚠️ LE MOIS SE CALCULE EN REJOUANT LE MOTEUR SUR LA FENETRE DU MOIS, jamais en
  //   divisant l'annee par douze : un contrat qui demarre en septembre ne coute
  //   rien en aout. L'integration est additive, la somme des mois vaut l'annee.
  var _CE=window.CAVE_ELEVAGE||null;
  var _okLoy=(typeof window._mvFutLoyer==='function');
  var locR=_okLoy ? window._mvFutLoyer(window.INTRANTS,_CE,ex.d0,dFin,ex.an)
                  : {eur:0, lignes:[], n:0, nSansLoyer:0, nAmbigu:0};
  var locT=locR.eur||0;
  if(locT>0){
    mois.forEach(function(mo){
      var f1=(mo.d1<dFin)?mo.d1:dFin;
      if(f1<mo.d0) return;
      var r=window._mvFutLoyer(window.INTRANTS,_CE,mo.d0,f1,ex.an);
      if(byM[mo.k] && r && r.eur>0) byM[mo.k].fut+=r.eur;
    });
  }

  // Les futs ACHETES : comptes a la date de leur facture, et seulement si le
  // domaine l'a demande. Le prix ABSENT n'est pas zero — il se chiffre dans Achats.
  var futTrait=_ecoFutTrait();
  var okDate=(typeof window._mvFutDateAchat==='function');
  var okLoc=(typeof window._mvFutEstLoc==='function');
  var futT=0, nFutAch=0, nFutSansPrix=0, futRows=[];
  ((window.INTRANTS&&window.INTRANTS.futs)||[]).forEach(function(f){
    if(!f) return;
    if(okLoc ? window._mvFutEstLoc(f) : (f.mode==='loc')) return;
    var iso=okDate ? window._mvFutDateAchat(f) : String(f.dfact||f.date||'').slice(0,10);
    if(!iso || iso<ex.d0 || iso>dFin) return;
    nFutAch++;
    var e=(f.prix!=null&&isFinite(Number(f.prix)))?Number(f.prix):null;
    if(e==null) nFutSansPrix++;
    var v=(futTrait==='achat'&&e!=null)?e:0;
    futT+=v;
    if(v>0){
      var k=parseInt(iso.slice(0,4),10)+'-'+(parseInt(iso.slice(5,7),10)-1);
      if(byM[k]) byM[k].fut+=v;
    }
    futRows.push({date:iso, nom:((typeof window._mvFutRef==='function'&&window._mvFutRef(f))||'Lot sans nom'),
                  four:f.four||'', qte:Math.max(0,parseInt(f.qte,10)||0), eur:e, compte:v});
  });
  futRows.sort(function(a,b){ return a.date<b.date?1:-1; });

  // ── 4c) PRESTATIONS — ARRACH-4 (02/10) ─────────────────────────────
  // Ce qu'un prestataire a facturé pour une étape d'arrachage, à la date de l'étape. Une
  // prestation n'est ni un intrant (La Réserve) ni une réparation : poste à part, atelier vigne.
  var preR=_ecoPrestaByParc({d0:ex.d0, d1:dFin}), preT=preR.tot||0;
  Object.keys(preR.byDate||{}).forEach(function(iso){
    var k=parseInt(iso.slice(0,4),10)+'-'+(parseInt(iso.slice(5,7),10)-1);
    if(byM[k]) byM[k].pre+=preR.byDate[iso];
  });

  // ── 5) LA REPARTITION PAR ATELIER ──────────────────────────────────
  // ★★★ ELLE NE RECALCULE RIEN. Elle REVENTILE des euros deja comptes plus haut,
  //   ce qui donne l'invariant : la somme des ateliers vaut exactement
  //   achT + gnrT + repT. Un second calcul aurait donne un second chiffre — la
  //   faute que ce module passe son temps a corriger.
  // ⚠️ LES SALAIRES N'Y SONT PAS, et ce n'est pas un oubli : une entree de
  //   planning porte des heures, un type de conge, un motif d'absence — JAMAIS
  //   une activite. Rien ne dit si une journee est partie a la vigne ou a la
  //   cuverie. Seule la conduite du tracteur est mesuree (sessions), et elle
  //   reste dans la masse salariale : ici on ne compte que le carburant, sinon
  //   la meme heure serait payee deux fois.
  var ateEur={}, ateSrc={};
  _pexAteOrd().forEach(function(k){ ateEur[k]=0; ateSrc[k]=[]; });
  function _ateAdd(k,lib,src,eur){
    if(!(eur>0)) return;
    if(!(k in ateEur)) k='gen';
    ateEur[k]+=eur; ateSrc[k].push({lib:lib, src:src, eur:eur});
  }
  // a) le carburant part au tracteur, toujours, sans un geste de saisie neuf
  _ateAdd('trac','Carburant GNR', _pecGnrDet(gnrSrc,litres,gnrR.n,gnrR.nSansLitres,'',cfg.gnrL), gnrT);
  // b) les achats : l'atelier se DEDUIT de la categorie du produit
  var achByCat={}, achNByCat={};
  ach.forEach(function(a){
    if(!a||!a.date) return;
    var iso=String(a.date).slice(0,10);
    if(iso<ex.d0||iso>dFin) return;
    var pr=prodBy[a.prodId]||null;
    var cat=(pr&&pr.cat)||'gen';
    achByCat[cat]=(achByCat[cat]||0)+(Number(a.prix)||0);
    achNByCat[cat]=(achNByCat[cat]||0)+1;
  });
  var _CATNOM={phyto:'Phyto',oeno:'\u0152no (SO\u2082, levures)',vigne:'Fournitures vigne',
               cave:'Fournitures cave',trac:'Pi\u00e8ces tracteur',gen:'G\u00e9n\u00e9ral'};
  Object.keys(achByCat).forEach(function(cat){
    var n=achNByCat[cat];
    _ateAdd(_pexAteDe(cat), (_CATNOM[cat]||cat),
            'La R\u00e9serve \u00b7 '+n+' achat'+(n>1?'s':''), achByCat[cat]);
  });
  // c) les reparations partent au tracteur : une machine chez le reparateur,
  //    c'est le tracteur qui coute, jamais la vigne ni la cave. L'atelier ne se
  //    demande donc pas ici non plus.
  var repFam={};
  repRows.forEach(function(r){
    if(r.eur==null) return;
    var fam=/r\u00e9vision|revision|entretien/i.test(r.lib)?'R\u00e9visions':'R\u00e9parations';
    if(!repFam[fam]) repFam[fam]={eur:0,n:0};
    repFam[fam].eur+=r.eur; repFam[fam].n++;
  });
  Object.keys(repFam).forEach(function(f){
    _ateAdd('trac', f, 'R\u00e9parateur \u00b7 '+repFam[f].n+' passage'+(repFam[f].n>1?'s':''), repFam[f].eur);
  });
  // d) les futs vont a la cave, et nulle part ailleurs : un fut ne travaille ni
  //    dans les rangs ni a l'atelier. L'atelier ne se demande donc pas ici.
  if(locT>0) _ateAdd('cave','Location de f\u00fbts',
    'La R\u00e9serve \u00b7 '+locR.n+' contrat'+(locR.n>1?'s':''), locT);
  if(futT>0) _ateAdd('cave',_pexFutLbl(),
    'La R\u00e9serve \u00b7 '+nFutAch+' lot'+(nFutAch>1?'s':'')+' factur\u00e9'+(nFutAch>1?'s':''), futT);
  if(preT>0) _ateAdd('vigne','Prestations', 'Arrachage \u00b7 '+preR.n+' \u00e9tape'+(preR.n>1?'s':''), preT);   // ARRACH-4
  var ateT=0; _pexAteOrd().forEach(function(k){ ateT+=ateEur[k]; });
  _pexAteOrd().forEach(function(k){ ateSrc[k].sort(function(a,b){ return b.eur-a.eur; }); });

  // ── 6) INFO hors total : consommation phyto valorisee ──────────────
  var phy=_ecoPhytoByParc({d0:ex.d0,d1:dFin});
  var phyConso=0; Object.keys(phy.cost||{}).forEach(function(k){ phyConso+=phy.cost[k]||0; });

  // ── Totaux ─────────────────────────────────────────────────────────
  var total=salT+gnrT+achT+repT+locT+futT;   // ENGAGÉ à la coupe
  total+=preT;   // ARRACH-4 : les prestations
  var totalP=salP+achP, totalClot=total+totalP;  // prévu (grille + amendements chiffrés, FERTI-2) · à la clôture
  var surf=0;
  (window.PARCELLES||[]).forEach(function(p){ if(p&&p.statut!=='Arrachee') surf+=parseFloat(p.surface)||0; });
  var postes=[
    { k:'sal', lab:_pexSalLab(), col:_PEC_COL.mo,  eur:salT, eurP:salP,
      det:_ecoH1(hPaid)+' h pay\u00e9es \u00b7 '+gens.length+' personne'+(gens.length>1?'s':'')
          +' \u00b7 co\u00fbt employeur (taux charg\u00e9 des fiches)' },
    { k:'gnr', lab:'Carburant GNR',         col:_PEC_COL.gnr, eur:gnrT, det:_pecGnrDet(gnrSrc,litres,gnrR.n,gnrR.nSansLitres,'',cfg.gnrL) },
    { k:'ach', lab:'Achats d\u2019intrants', col:_PEC_COL.phy, eur:achT, eurP:(enCoursC?achP:null),
      det:nAch+' achat'+(nAch>1?'s':'')+' de La R\u00e9serve'+(nAchP?' \u00b7 '+nAchP+' amendement'+(nAchP>1?'s':'')+' pr\u00e9vu'+(nAchP>1?'s':''):'') },
    { k:'dep', lab:'R\u00e9parations',        col:_PEC_COL.dep, eur:repT,
      det:nRep+' passage'+(nRep>1?'s':'')+' chez le r\u00e9parateur' }
  ];
  if(locT>0) postes.push({ k:'loc', lab:'Location de f\u00fbts', col:_PEC_COL.loc, eur:locT,
    det:locR.n+' contrat'+(locR.n>1?'s':'')+' \u00b7 loyer au prorata des jours' });
  if(futT>0) postes.push({ k:'fut', lab:_pexFutLbl(), col:_PEC_COL.fut, eur:futT,
    det:nFutAch+' lot'+(nFutAch>1?'s':'')+' factur\u00e9'+(nFutAch>1?'s':'')+' dans l\u2019exercice' });
  if(preT>0) postes.push({ k:'pre', lab:'Prestations', col:_PEC_COL.pre, eur:preT,
    det:preR.n+' \u00e9tape'+(preR.n>1?'s':'')+' d\u2019arrachage par un prestataire'+(preR.nSansPrix?(' \u00b7 '+preR.nSansPrix+' sans montant'):'') });
  postes.forEach(function(p){ var _b=enCoursC?totalClot:total, _e=p.eur+(enCoursC?(p.eurP||0):0); p.part = _b>0 ? (_e/_b*100) : 0; });

  var cmp=null, cmpDate=null;
  if(!noCmp && typeof window._mvExerciceAn==='function'){
    var exP=window._mvExerciceAn(ex.an-1);
    var prev=_pexData(exP, true);
    if(prev && prev.total>0) cmp=prev;
    // ★ À DATE COMPARABLE : l'an dernier rejoué jusqu'aux MÊMES JOURS après
    //   l'ouverture. Sans ça, « +20,8 % » comparait dix mois de grille à douze
    //   mois payés — deux exercices qui n'ont pas la même longueur.
    if(enCoursC && exP && exP.d0){
      var _dj=Math.round((_pexIsoToMs2(coupe)-_pexIsoToMs2(ex.d0))/86400000);
      var _cp=_pexIsoPlus(exP.d0,_dj);
      if(_cp>exP.d1) _cp=exP.d1;
      var prevD=_pexData(exP, true, _cp);
      if(prevD && prevD.total>0) cmpDate=prevD;
    }
  }
  return { ex:ex, mois:mois, byM:byM, gens:gens, postes:postes, achRows:achRows,
           salT:salT, gnrT:gnrT, achT:achT, repT:repT, total:total,
           preT:preT, preN:preR.n, locT:locT, locR:locR, futT:futT, futTrait:futTrait, futRows:futRows,
           nFutAch:nFutAch, nFutSansPrix:nFutSansPrix,
           repRows:repRows, nRep:nRep, nRepSansPrix:nRepSansPrix,
           ateEur:ateEur, ateSrc:ateSrc, ateT:ateT,
           gnrSrc:gnrSrc, gnrN:gnrR.n, gnrNSansLitres:gnrR.nSansLitres,
           hPaid:hPaid, hWork:hWork, tracH:tracH, litres:litres, phyConso:phyConso,
           surf:surf, coutHa:(surf>0?total/surf:0),
           nSansTaux:nSansTaux, hSansTaux:hSansTaux,
           nAch:nAch, nAchSansPrix:nAchSansPrix,
           hasPlan:canPaid, hasGnr:(cfg.gnrL>0), enCours:enCours, auj:auj, cmp:cmp,
           coupe:coupe, dFin:dFin, enCoursC:enCoursC,
           salP:salP, hPaidP:hPaidP, totalP:totalP, totalClot:totalClot, achP:achP, nAchP:nAchP,
           coutHaClot:(surf>0?totalClot/surf:0), cmpDate:cmpDate };
}

// ── UN FUT ACHETE, COMMENT LE COMPTER ? (lot FUT-LOC, 10/09/2026) ───────────
// Deux valeurs, et une seule question : est-ce que le fut achete sort de la
// caisse cette annee-la, oui ou non.
//   'hors'  (DEFAUT) — il ne compte pas. C'est le comportement d'avant ce lot :
//                      aucun chiffre ne bouge chez un domaine qui ne touche rien.
//   'achat'          — il compte en entier a la date de sa facture.
// ⚠️ IL N'Y A PAS DE TROISIEME VALEUR, ET C'EST UNE DECISION. Etaler un fut sur
//   cinq ans, c'est un amortissement : le travail du bilan, pas celui d'une appli
//   de vigne. Un amortissement approximatif affiche a cote d'une masse salariale
//   exacte donnerait a l'ensemble l'autorite d'un compte de resultat qu'il n'est
//   pas. Ne pas le reintroduire sans rouvrir cette question-la.
// ⚠️ La LOCATION, elle, n'a pas de reglage : un loyer est une charge de l'annee
//   ou il est du. Il n'y a rien a choisir.
var _PEX_FUT_TRAIT = {hors:1, achat:1};
function _ecoFutTrait(){
  var e=(window.CONFIG&&window.CONFIG.eco)||{};
  var v=String(e.futs_trait||'').trim();
  return _PEX_FUT_TRAIT[v] ? v : 'hors';
}
function _pexFutLbl(){ return 'F\u00fbts achet\u00e9s'; }

// Ecriture du traitement des futs achetes. Meme prudence que _pexSetMois : on
// relit apres l'appel, parce qu'_ecoCfgSet applique une LISTE BLANCHE et qu'une
// cle inconnue y est un no-op SILENCIEUX.
function _pexSetFutTrait(v){
  if(!(typeof window.isAdmin==='function' && window.isAdmin())){
    if(window.showToast) window.showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#C0392B');
    return;
  }
  var t=String(v||'').trim();
  if(!_PEX_FUT_TRAIT[t]) return;
  if(t===_ecoFutTrait()) return;
  if(typeof window._ecoCfgSet==='function') window._ecoCfgSet('eco','futs_trait',t);
  if(_ecoFutTrait()!==t){
    if(window.showToast) window.showToast('R\u00e9glage non enregistr\u00e9 \u2014 mise \u00e0 jour de R\u00e9glages requise','#B85A1A');
    return;
  }
  if(window.showToast) window.showToast(t==='achat'
    ? 'Les f\u00fbts achet\u00e9s comptent d\u00e9sormais dans l\u2019exercice'
    : 'Les f\u00fbts achet\u00e9s sortent de l\u2019exercice','#3D6B27');
  _pilFillContent(_pilData());
}
window._pexSetFutTrait=_pexSetFutTrait;

// La carte du reglage. Elle dit ce que CHAQUE choix ferait, pas seulement lequel
// est coche : un reglage dont on ne voit pas l'effet ne se choisit pas, il se subit.
function _pexFutChoix(){
  var cur=_ecoFutTrait();
  var admin=!!(typeof window.isAdmin==='function' && window.isAdmin());
  var O=[['hors','Hors exercice',
          'Le f\u00fbt achet\u00e9 est un bien qui dure : il ne compte que dans le parc. C\u2019est le r\u00e9glage par d\u00e9faut.'],
         ['achat','Compt\u00e9 en entier \u00e0 l\u2019achat',
          'Le lot tombe dans l\u2019exercice de sa facture. Une grosse commande fait une bosse \u2014 et c\u2019est vrai, elle a bien \u00e9t\u00e9 pay\u00e9e cette ann\u00e9e-l\u00e0.']];
  var opts=O.map(function(o){
    return '<button class="pex-fopt'+(cur===o[0]?' on':'')+'"'+(admin?'':' disabled')
      +' data-pec="futtr" data-v="'+o[0]+'">'
      +'<span class="t">'+_pilEsc(o[1])+'</span>'
      +'<span class="d">'+o[2]+'</span></button>';
  }).join('');
  return '<div class="pec-card"><div class="pec-ch">'
    +'<div class="pec-ct">Un f\u00fbt achet\u00e9, comment le compter\u00a0?</div>'
    +'<div class="pec-cs">'+(admin
      ? 'Un f\u00fbt sert plusieurs vins. Le compter en entier l\u2019ann\u00e9e de l\u2019achat fait une bosse\u00a0; ne pas le compter du tout fait un trou. \u00c0 vous de dire.'
      : ''+(typeof _mvIcon==='function'?_mvIcon('cadenas',16):'')+' Lecture seule \u2014 seul un administrateur peut changer ce r\u00e9glage.')
    +'</div></div>'
    +'<div class="pec-cb"><div class="pex-fopts">'+opts+'</div>'
    +'<div class="pec-a warn" style="margin-top:10px"><span class="e">'
      +(typeof _mvIcon==='function'?_mvIcon('alerte',16):'')+'</span><div>'
    +'Changer ce r\u00e9glage <b>r\u00e9\u00e9crit les exercices d\u00e9j\u00e0 clos</b>\u00a0: le m\u00eame lot y entrera ou en sortira. '
    +'On le choisit \u00e0 l\u2019installation, pas en cours d\u2019ann\u00e9e.</div></div>'
    +'<div class="pec-a ok" style="margin-top:9px"><span class="e">'
      +(typeof _mvIcon==='function'?_mvIcon('check',16):'')+'</span><div>'
    +'<b>La location n\u2019a pas de r\u00e9glage.</b> Un loyer est une charge de l\u2019ann\u00e9e o\u00f9 il est d\u00fb '
    +'\u2014 il n\u2019y a rien \u00e0 choisir. Il entre au prorata des jours de contrat.</div></div>'
    +'<div class="pec-note"><b>Pas d\u2019amortissement, et c\u2019est voulu.</b> \u00c9taler un f\u00fbt sur cinq ans, '
    +'c\u2019est le travail du bilan. Un amortissement approximatif affich\u00e9 \u00e0 c\u00f4t\u00e9 d\u2019une masse salariale '
    +'exacte donnerait \u00e0 l\u2019ensemble l\u2019autorit\u00e9 d\u2019un compte de r\u00e9sultat qu\u2019il n\u2019est pas.</div>'
    +'</div></div>';
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
  _pecSaveSt();
  if(window.showToast) window.showToast('Exercice comptable mis \u00e0 jour','#3D6B27');
  _pilFillContent(_pilData());   // repeint aussi la roue ouverte (_pilFillContent → _pilParamRefresh) : le réglage y vit (PIL-RANGE-4b)
}
window._pexSetMois=_pexSetMois;

// ── Reglage : mois d'ouverture de la CAMPAGNE (l'annee vigne) ────────
// ★★★ AXE-1. Meme patron que _pexSetMois, et il vit a cote de lui A DESSEIN :
// les deux cadres annuels du domaine se reglent au meme endroit, sinon on en
// deplace un en oubliant l'autre — c'est exactement ce qui produit deux
// chiffres plausibles pour la meme annee.
// ⚠️ Contrairement a l'exercice, celui-ci CHANGE des chiffres deja affiches :
//   les Archives, le bilan de campagne, le millesime en cours pres d'une
//   bascule. On le dit dans le toast, on ne le laisse pas decouvrir.
function _pilSetCampMois(v){
  if(!(typeof window.isAdmin==='function' && window.isAdmin())){
    if(window.showToast) window.showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#C0392B');
    return;
  }
  var m=parseInt(v,10); if(isNaN(m)||m<0||m>11) return;
  var cur=(typeof window._mvCampagneMois==='function')?window._mvCampagneMois():7;
  if(m===cur) return;
  if(typeof window._ecoCfgSet==='function') window._ecoCfgSet('eco','campagne_mois',m);
  var after=(typeof window._mvCampagneMois==='function')?window._mvCampagneMois():7;
  if(after!==m){
    if(window.showToast) window.showToast('R\u00e9glage non enregistr\u00e9 \u2014 mise \u00e0 jour de R\u00e9glages requise','#B85A1A');
    return;
  }
  _pilExoOublier();
  _pecSaveSt();
  if(window.showToast) window.showToast('Ann\u00e9e vigne mise \u00e0 jour \u2014 Archives et bilan recadr\u00e9s','#3D6B27');
  _pilFillContent(_pilData());   // repeint aussi la roue ouverte (_pilFillContent → _pilParamRefresh) : le réglage y vit (PIL-RANGE-4b)
}
window._pilSetCampMois=_pilSetCampMois;

// \u2605\u2605\u2605 OU TOMBE LA VENDANGE DANS UNE CAMPAGNE OUVERTE AU MOIS `md`.
// Ce n'est pas un reglage de MOIS, c'est un reglage de CAMPAGNE : une campagne
// est un cycle de production, et ce qui le borne est la vendange. Le mois n'est
// que la traduction de ce choix en calendrier.
// \u26a0\ufe0f Ne PAS confondre avec `ann.align`, qui mesure la meme chose contre
//   l'EXERCICE COMPTABLE. Les deux questions sont differentes, et la reponse ne
//   se lit pas pareil : un exercice est une DONNEE du comptable, on constate ou
//   tombe la vendange dedans (\u00a734). Une campagne, elle, n'appartient qu'au
//   domaine \u2014 rien d'exterieur n'impose qu'elle coupe sa propre recolte en deux.
function _pilCampVend(md){
  var ann=null; try{ ann=_pilAnnuelData(); }catch(e){ ann=null; }
  if(!ann || !ann.vend || !ann.vend.debut || !ann.vend.fin) return null;
  var vd=ann.vend.debut, vf=ann.vend.fin;
  function bornes(an){
    var fin=new Date(an+1, md, 0), mm=md+1, fm=fin.getMonth()+1, fj=fin.getDate();
    return {d0:an+'-'+(mm<10?'0':'')+mm+'-01',
            d1:fin.getFullYear()+'-'+(fm<10?'0':'')+fm+'-'+(fj<10?'0':'')+fj};
  }
  /* \u2605\u2605 LA CAMPAGNE CANDIDATE SE DEDUIT DE `md`, JAMAIS DE L'AXE EN VIGUEUR.
     \u26a0\ufe0f DEFAUT VECU, trouve par le banc de documents : on prenait
     _arcCampagneDe(aujourd'hui) \u2014 qui lit le reglage COURANT \u2014 puis on bornait
     avec le mois CANDIDAT. Des que les deux different, c'est-a-dire des qu'on
     deroule le selecteur (l'usage meme de l'ecran), la vendange tombait hors
     des bornes : `pos` montait au-dessus de 1 et `clot` (pos>=0.72) passait a
     vrai. L'ecran annonçait qu'une vendange CLOTURAIT la campagne qu'elle
     OUVRE, et le bouton de calage disparaissait. La question posee est \u00ab si
     j'ouvre en <md>, ou tombe ma recolte ? \u00bb : la reponse ne peut pas dependre
     du reglage actuel.
     \u26a0 Les 33 assertions du harnais AXE-1 lisaient ce code sans l'executer et
       le trouvaient bon. */
  var mdp=md+1, pv=String(vd).split('-'), pan=parseInt(pv[0],10), pmo=parseInt(pv[1],10);
  var c=(pmo>=mdp)?pan:(pan-1);
  var b=bornes(c);
  var coupe=(vf>b.d1);          /* le debut est dans la fenetre par construction */
  var s=_arcN(b.d0), e=_arcN(b.d1), pos=(_arcN(vd)-s)/Math.max(1,(e-s));
  return {debut:vd, fin:vf, coupe:coupe, pos:pos,
          clot:(!coupe && pos>=0.72), ouvre:(!coupe && pos<0.28),
          moisIdeal:(ann.align&&ann.align.moisIdeal!=null)?ann.align.moisIdeal:null};
}

// Le bloc de reglage, rendu sous celui de l'exercice.
function _pilCampMoisChoix(){
  var cur=(typeof window._mvCampagneMois==='function')?window._mvCampagneMois():7;
  var lbl=window.MV_EX_MOIS_LBL||['janvier','f\u00e9vrier','mars','avril','mai','juin','juillet','ao\u00fbt','septembre','octobre','novembre','d\u00e9cembre'];
  var admin=!!(typeof window.isAdmin==='function' && window.isAdmin());
  var opts=lbl.map(function(nm,i){ return '<option value="'+i+'"'+(i===cur?' selected':'')+'>1er '+nm+'</option>'; }).join('');
  var b=_arcBornes(_arcCampagneDe(_mvToday()));
  var V=_pilCampVend(cur);

  /* \u2605 CE QUE LE CADRE FAIT DE LA VENDANGE \u2014 constate, jamais prescrit.
     Sans vendange datee on ne devine pas : la ligne dit qu'elle ne sait pas,
     plutot que de laisser croire que le cadre est bon. */
  var etat='';
  if(!V){
    etat='<div class="pex-sets" style="margin-top:9px">Aucune vendange dat\u00e9e\u00a0: impossible de dire '
        +'o\u00f9 elle tombe dans ce cadre. Datez la fen\u00eatre de la t\u00e2che Vendange (roue crant\u00e9e, '
        +'fen\u00eatres des t\u00e2ches).</div>';
  } else {
    var dit = V.coupe
      ? '<b>votre vendange est coup\u00e9e en deux</b> par cette borne\u00a0: une partie de la r\u00e9colte '
        +'compte dans une campagne, le reste dans la suivante'
      : (V.clot
          ? 'votre vendange <b>cl\u00f4ture</b> cette campagne\u00a0: le cycle se ferme sur la r\u00e9colte qu\u2019il a produite'
          : (V.ouvre
              ? 'votre vendange <b>ouvre</b> cette campagne\u00a0: elle compte avec les travaux qui feront la '
                +'r\u00e9colte <em>suivante</em>'
              : 'votre vendange tombe <b>au milieu</b> de cette campagne'));
    etat='<div class="pex-sets" style="margin-top:9px">Vendange du <b>'+_pilEsc(_pilDfr(V.debut))
        +'</b> au <b>'+_pilEsc(_pilDfr(V.fin))+'</b>\u00a0: '+dit+'.</div>';
    /* Le geste, seulement quand il y a quelque chose a faire, et seulement pour
       un admin. Il porte le mois DEDUIT de la vendange du domaine \u2014 jamais un
       mois choisi d'avance : c'est la difference entre un reglage de campagne et
       un conseil generique. */
    if(admin && V.moisIdeal!=null && V.moisIdeal!==cur && (V.coupe || !V.clot)){
      etat+='<button class="arc-cmp" style="margin-top:9px" '
          +'onclick="window._pilSetCampMois&&window._pilSetCampMois('+Number(V.moisIdeal)+')">'
          +_mvIcon('raisin',16)+' Caler la campagne sur ma vendange (1<sup>er</sup> '
          +_pilEsc(lbl[V.moisIdeal])+')</button>';
    }
  }

  return '<div class="pec-card"><div class="pec-cb">'
    +'<div class="pex-set"><div><div class="pex-setl">'+_mvIcon('raisin',16)+' Le cadre de votre campagne'
    +(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.camp.mois')):'')+'</div>'
    +'<div class="pex-sets">'+(admin
      ? 'Une campagne est un <b>cycle de production</b>, et ce qui le borne est la <b>vendange</b>\u00a0: '
        +'le mois n\u2019est que la traduction de ce choix en calendrier. C\u2019est l\u2019axe des Archives et du '
        +'bilan de campagne. Contrairement \u00e0 l\u2019exercice comptable ci-dessus, <b>rien d\u2019ext\u00e9rieur ne '
        +'vous l\u2019impose</b>. Le changer <b>recadre des chiffres d\u00e9j\u00e0 affich\u00e9s</b>\u00a0; il ne touche '
        +'ni au mill\u00e9sime d\u2019un vin, ni \u00e0 vos p\u00e9riodes de travail.'
      : ''+_mvIcon('cadenas',16)+' Lecture seule \u2014 seul un administrateur peut changer le cadre des campagnes.')+'</div></div>'
    +'<select class="pex-selm"'+(admin?'':' disabled')+' onchange="window._pilSetCampMois&&window._pilSetCampMois(this.value)">'+opts+'</select>'
    +'</div>'
    +'<div class="pex-sets" style="margin-top:9px">Campagne en cours\u00a0: <b>'+_pilEsc(b.lbl||'')+'</b></div>'
    +etat
    +'</div></div>';
}

// ── Vue « Exercice » ────────────────────────────────────────────────
function _pexBarreEx(E){
  // MOTS-2 (§583) : l'en-tête des sous-vues — l'exercice (ou l'année vigne, selon la barre « Vous regardez ») et ses dates,
  //   puis UNE phrase : ce qui est sorti, et la part de l'année que cela fait. « L'année se choisit dans la barre… » est parti.
  var vig=!!(_PIL_SCOPE && _PIL_SCOPE.cadre==='vig'), pc=Math.round(E.totalClot>0?E.total/E.totalClot*100:0);
  var d0=_pecIsoToMs(String(E.ex.d0||'').slice(0,10)), d1=_pecIsoToMs(String(E.ex.d1||'').slice(0,10));
  var dates=(d0!==null && d1!==null) ? (_pecJourCourt(d0)+' → '+_pecJourCourt(d1)) : String(E.ex.lbl||'');   // « 1 août → 31 juil. » : l'écriture courte du lexique (§580c)
  return _pecEnteteVue('<div class="pec-per"><span><b>'+(vig?'Année vigne ':'Exercice ')+_pilEsc(E.ex.court||'')+'</b> · '+_pilEsc(dates)+'</span></div>',   // « en cours » ne s'écrit pas : la part de l'exercice, dans la phrase, le dit
    '<b>'+_pilEsc(_ecoEur(E.total))+'</b> sortis'+(E.enCoursC?(' : <b>'+pc+' %</b> de '+(vig?'l’année':'l’exercice')):'')+'.');
}
function _pexMoisChoix(){
  var cur=(typeof window._mvExerciceMois==='function')?window._mvExerciceMois():7;
  var lbl=window.MV_EX_MOIS_LBL||['janvier','f\u00e9vrier','mars','avril','mai','juin','juillet','ao\u00fbt','septembre','octobre','novembre','d\u00e9cembre'];
  var admin=!!(typeof window.isAdmin==='function' && window.isAdmin());
  var opts=lbl.map(function(nm,i){ return '<option value="'+i+'"'+(i===cur?' selected':'')+'>1er '+nm+'</option>'; }).join('');
  return '<div class="pec-card"><div class="pec-cb">'
    +'<div class="pex-set"><div><div class="pex-setl">'+_mvIcon('engrenage',16)+' Ouverture de l\u2019exercice</div>'
    +'<div class="pex-sets">'+(admin
      ? 'Le mois o\u00f9 votre exercice s\u2019ouvre. Par d\u00e9faut le 1<sup>er</sup> ao\u00fbt, l\u2019usage viticole\u00a0: on cl\u00f4ture apr\u00e8s la r\u00e9colte, pas au milieu. Ce choix vaut pour tout le domaine et ne touche ni aux campagnes, ni aux cong\u00e9s, ni \u00e0 aucun chiffre existant.'
      : ''+_mvIcon('cadenas',16)+' Lecture seule \u2014 seul un administrateur peut changer la date de bilan.')+'</div></div>'
    +'<select class="pex-selm"'+(admin?'':' disabled')+' onchange="window._pexSetMois&&window._pexSetMois(this.value)">'+opts+'</select>'
    +'</div></div></div>';
}
// Barres empilees mois par mois. Un exercice se lit dans son rythme : deux mois de
// vendange pesent plus que six mois d'hiver, et c'est ca qu'on veut voir.
function _pexGraph(E,w){
  var M=E.mois;
  if(!M.length) return window._mvGraphVide('Aucun mois dans cet exercice',
    'Choisissez un autre exercice dans la barre au-dessus.');
  // ⚠️ TOUTE CLE COMPTEE DANS LE TOTAL DOIT ETRE EMPILEE ICI. Un poste ajoute au
  //   moteur sans etre ajoute a cette somme rabaisse l'echelle : la derniere barre
  //   deborde du cadre, en silence.
  var maxV=0; M.forEach(function(mo){ var b=E.byM[mo.k]; var t=b.sal+b.gnr+b.ach+(b.dep||0)+(b.fut||0)+(b.salP||0)+(b.pre||0); if(t>maxV) maxV=t; });
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
  // ★ Le PRÉVU (salaires lus dans la grille après la coupe) est hachuré, et la
  //   coupe est marquée : douze barres pleines de la même couleur laissaient lire
  //   « sorti » sur dix mois de grille.
  g+='<defs><pattern id="pex-hach" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
    +'<rect width="6" height="6" fill="var(--bg-card)"/><line x1="0" y1="0" x2="0" y2="6" stroke="'+_PEC_COL.mo+'" stroke-width="1.6" stroke-opacity=".6"/></pattern></defs>';
  var xCoupe=null;
  M.forEach(function(mo,i){
    var b=E.byM[mo.k], x=pL+step*i+(step-bw)/2, acc=0;
    [['sal',_PEC_COL.mo],['gnr',_PEC_COL.gnr],['ach',_PEC_COL.phy],['dep',_PEC_COL.dep],['fut',_PEC_COL.loc],['pre',_PEC_COL.pre],['salP','url(#pex-hach)']].forEach(function(pr){
      var v=b[pr[0]]||0; if(!(v>0)) return;
      var y0=Y(acc+v), y1=Y(acc), hh=Math.max(1,y1-y0);
      g+='<rect x="'+x.toFixed(1)+'" y="'+y0.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+hh.toFixed(1)+'" rx="'+_PIL_GB.rv+'" fill="'+pr[1]+'" opacity="0.92"'+(pr[0]==='salP'?(' stroke="'+_PEC_COL.mo+'" stroke-width=".8" stroke-opacity=".7"'):'')+'/>';
      acc+=v;
    });
    if(E.enCoursC && E.coupe>=mo.d0 && E.coupe<=mo.d1){
      var nj=Math.max(1,Math.round((_pexIsoToMs2(mo.d1)-_pexIsoToMs2(mo.d0))/86400000)+1);
      var fr=(Math.round((_pexIsoToMs2(E.coupe)-_pexIsoToMs2(mo.d0))/86400000)+1)/nj;
      xCoupe=x+bw*Math.max(0,Math.min(1,fr));
    }
    if(i%pas===0)
      g+='<text x="'+(x+bw/2).toFixed(1)+'" y="'+(c.h-11)+'" text-anchor="middle" font-size="'+(et?c.txt.mini:c.txt.axe)+'" fill="'+c.col.texte+'">'+_pilEsc(mo.lbl)+'</text>';
  });
  if(xCoupe!=null){
    g+='<line x1="'+xCoupe.toFixed(1)+'" y1="'+(pT-6)+'" x2="'+xCoupe.toFixed(1)+'" y2="'+(pT+ih)+'" stroke="'+_PIL_SEM.aujourdhui+'" stroke-width="2"/>'
      +'<text x="'+xCoupe.toFixed(1)+'" y="'+(pT-9)+'" text-anchor="'+(xCoupe>W-70?'end':'middle')+'" font-size="'+c.txt.mini+'" font-weight="600" fill="'+_PIL_SEM.aujourdhui+'">aujourd\u2019hui</text>';
  }
  return window._mvGraphSvg(c, 'D\u00e9penses mois par mois sur l\u2019exercice\u00a0: sorti \u00e0 gauche d\u2019aujourd\u2019hui, lu dans la grille du planning \u00e0 droite.', g)
    +'<div class="pec-leg">'
    +'<span class="pec-lg"><em style="background:'+_PEC_COL.mo+'"></em>'+_pexSalLab()+'</span>'
    +(E.enCoursC?'<span class="pec-lg"><em style="background:repeating-linear-gradient(135deg,'+_PEC_COL.mo+'99 0 2px,transparent 2px 5px);border:1px solid '+_PEC_COL.mo+'"></em>pr\u00e9vu (grille du planning)</span>':'')
    +'<span class="pec-lg"><em style="background:'+_PEC_COL.gnr+'"></em>Carburant GNR</span>'
    +'<span class="pec-lg"><em style="background:'+_PEC_COL.phy+'"></em>Achats d\u2019intrants</span>'
    +'<span class="pec-lg"><em style="background:'+_PEC_COL.dep+'"></em>D\u00e9penses</span>'
    +(((E.locT||0)+(E.futT||0))>0?'<span class="pec-lg"><em style="background:'+_PEC_COL.loc+'"></em>F\u00fbts</span>':'')
    +'</div>';
}

// Alertes, KPI et le garde-fou « ce n'est pas un compte de resultat ».
// Les postes de l'EXERCICE qu'une donnee manquante met a ZERO.
// ⚠️ Ce n'est pas la meme liste que la Synthese : ici on chiffre un bilan
//   entier, donc les achats d'intrants comptent, et le planning doit avoir ete
//   charge une fois pour que les heures payees existent.
function _pexZeros(E){
  var Z=[];
  if(!E.hasPlan) Z.push({ nom:'Salaires', quoi:'planning charg\u00e9', cible:null, ou:null });
  else if(E.nSansTaux>0) Z.push({ nom:E.nSansTaux+' personne'+(E.nSansTaux>1?'s':'')+' sans taux',
    quoi:'taux horaire', cible:'equipe', ou:'R\u00e9glages \u203a \u00c9quipe' });
  if(!E.hasGnr && E.tracH>0) Z.push({ nom:'Carburant', quoi:'prix du GNR', cible:'entretien', ou:'Tracteur \u203a Entretien' });
  if(E.nAchSansPrix>0) Z.push({ nom:E.nAchSansPrix+' achat'+(E.nAchSansPrix>1?'s':'')+' sans prix',
    quoi:'prix HT dans La R\u00e9serve', cible:null, ou:null });
  // ★ Les reparations a chiffrer etaient COMPTEES (nRepSansPrix) et AFFICHEES deux
  //   fois plus bas, mais absentes de la seule liste qu'on lit pour savoir quoi
  //   completer. Un trou qu'on mesure et qu'on ne dit pas au bon endroit.
  if(E.nRepSansPrix>0) Z.push({ nom:E.nRepSansPrix+' r\u00e9paration'+(E.nRepSansPrix>1?'s':'')+' \u00e0 chiffrer',
    quoi:'montant HT dans \u00c9conomie \u203a Achats', cible:null, ou:null });
  if(E.futTrait==='achat' && E.nFutSansPrix>0) Z.push({ nom:E.nFutSansPrix+' lot'+(E.nFutSansPrix>1?'s':'')+' de f\u00fbts sans prix',
    quoi:'prix HT dans \u00c9conomie \u203a Achats', cible:null, ou:null });
  if(E.locR && E.locR.nSansLoyer>0) Z.push({ nom:E.locR.nSansLoyer+' contrat'+(E.locR.nSansLoyer>1?'s':'')+' sans loyer',
    quoi:'loyer HT par f\u00fbt et par an', cible:null, ou:null });
  return Z;
}

// Ce qui ne met rien a zero mais change la lecture du total.
function _pexRemarques(E){
  var R=[];
  if(E.hasPlan && E.nSansTaux>0 && E.hSansTaux>0)
    R.push('<b>'+_ecoH1(E.hSansTaux)+' h</b> pay\u00e9es sont compt\u00e9es \u00e0 z\u00e9ro faute de taux horaire : la masse salariale est sous-\u00e9valu\u00e9e d\u2019autant.');
  if(E.salT>0)
    R.push('Les salaires sont compt\u00e9s au <b>taux horaire charg\u00e9</b> de chaque fiche : le co\u00fbt employeur, cotisations patronales comprises, tel qu\u2019il a \u00e9t\u00e9 saisi. <b>Aucun coefficient n\u2019est ajout\u00e9 par-dessus</b> : ce total vaut ce que valent vos taux. Le montant exact des cotisations reste celui de votre journal de paie.');
  if(E.enCours)
    R.push('Exercice <b>en cours</b> : ce total est arr\u00eat\u00e9 aux d\u00e9penses d\u00e9j\u00e0 saisies, ce n\u2019est pas une pr\u00e9vision de cl\u00f4ture. Les mois \u00e0 venir sont \u00e0 z\u00e9ro parce qu\u2019ils n\u2019ont rien \u00e0 montrer, pas parce qu\u2019ils ne co\u00fbteront rien.');
  if(E.phyConso>0)
    R.push('Les traitements de l\u2019exercice repr\u00e9sentent <b>'+_pilEsc(_ecoEur(E.phyConso))+'</b> de produit consomm\u00e9. Ce montant n\u2019est <b>pas</b> dans le total : c\u2019est une sortie de stock, l\u2019achat a d\u00e9j\u00e0 \u00e9t\u00e9 compt\u00e9 le jour de la facture. L\u2019\u00e9cart entre les deux, c\u2019est votre stock.');
  return R;
}

// ⚠️⚠️ MEME REFONTE QUE LA SYNTHESE, MEME CARTE. Sept paves colores empiles
//   avant le premier chiffre, tous au meme poids : « le planning n'est pas
//   charge, les salaires comptent pour zero » pesait autant que « l'ecart entre
//   les deux, c'est votre stock ». Le rendu est celui de _pecFiabCard — un seul
//   pour les deux ecrans.
function _pexEntete(E){
  var A=[_pecFiabCard(_pexZeros(E), _pexRemarques(E),
    'pil.exo.fiabilite', 'pil.exo.remarques')];   // MOTS-1 (§582) : rien ne manque = une coche, plus une phrase

  var cmp=E.cmp, dPct=(cmp&&cmp.total>0)?((E.total-cmp.total)/cmp.total*100):null;
  var kpis;
  if(E.enCoursC){
    // ★ EXERCICE EN COURS : trois nombres, pas un. Engagé (sorti), prévu (grille),
    //   à la clôture. Le « contre N-1 » compare l'engagé aux MÊMES JOURS de l'an
    //   dernier ; l'exercice complet, prévu compris, est dit en dessous et dit qu'il
    //   contient du prévu. Avant : « Dépenses de l'exercice 216 k€ · en cours » et
    //   « +20,8 % » — dix mois de grille comparés à douze mois payés.
    var cd=E.cmpDate, dDate=(cd&&cd.total>0)?((E.total-cd.total)/cd.total*100):null;
    var dClot=(cmp&&cmp.total>0)?((E.totalClot-cmp.total)/cmp.total*100):null;
    kpis='<div class="pec-kpis">'
      +'<div class="pec-k"><div class="l">Sorti</div><div class="v">'+_pilEsc(_ecoEur(E.total))+'</div>'
        +'<div class="s">'+_ecoH1(E.hPaid)+' h payées</div></div>'
      +'<div class="pec-k pex-prevu"><div class="l">Prévu</div><div class="v">'+_pilEsc(_ecoEur(E.totalP))+'</div>'
        +'<div class="s">'+_ecoH1(E.hPaidP)+' h au planning</div></div>'
      +'<div class="pec-k"><div class="l">À la clôture</div><div class="v">'+_pilEsc(_ecoEur(E.totalClot))+'</div>'
        +'<div class="s">'+_pilEsc(_ecoEur(E.coutHaClot))+'/ha</div></div>'
      +(dDate!=null
        ? '<div class="pec-k"><div class="l">Contre '+_pilEsc(cd.ex.court)+'</div><div class="v">'+(dDate>0?'+':'')+_pilEsc(_pecPct(dDate))+'</div>'
          +'<div class="s">à date comparable'+(dClot!=null?(' · exercice complet '+(dClot>0?'+':'')+_pilEsc(_pecPct(dClot))):'')+'</div></div>'
        : (dClot!=null
            ? '<div class="pec-k"><div class="l">Contre '+_pilEsc(cmp.ex.court)+'</div><div class="v">'+(dClot>0?'+':'')+_pilEsc(_pecPct(dClot))+'</div>'
              +'<div class="s">'+_pilEsc(_pecEurK(cmp.total))+' l\u2019exercice pr\u00e9c\u00e9dent \u00b7 <b>pr\u00e9vu compris</b></div></div>'
            : '<div class="pec-k"><div class="l">Contre l\u2019an dernier</div><div class="v">\u2014</div><div class="s">pas de donn\u00e9es sur l\u2019exercice pr\u00e9c\u00e9dent</div></div>'))
      +'</div>'
      ;   // MOTS-2 (§583) : « 37 % de l’exercice est sorti » est la phrase du haut ; le reste est dans la fiche pil.exo.postes
  } else {
  kpis='<div class="pec-kpis">'
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
  }

  // ★ CE QUI CADRE RESTE, LA LISTE PART. « Ce n'est pas un compte de resultat »
  //   change la lecture du chiffre : sans cette phrase, on le compare au bilan
  //   du comptable et on conclut de travers. Elle reste, en une ligne.
  //   L'inventaire de ce qui n'y est pas — fermage, amortissements, assurances,
  //   cotisations d'exploitant, embouteillage, frais generaux — se lit une fois :
  //   il passe dans MV_INFO['pil.exo.garde'].
  var garde='<div class="pec-card"><div class="pec-cb"><div class="pex-warn">'
    +'<div class="t">'+_mvIcon('recu',16)+' Ce total n\u2019est pas un compte de r\u00e9sultat'
    +(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.exo.garde')):'')+'</div>'
    +'</div></div></div>';

  var PV=!!E.enCoursC;
  var pr=E.postes.map(function(p){
    var av=cmp?((cmp.postes.filter(function(q){return q.k===p.k;})[0]||{}).eur||0):null;
    var pClot=p.eur+(p.eurP||0);
    var dv=(av!=null&&av>0)?(((PV?pClot:p.eur)-av)/av*100):null;
    return '<tr><td class="n"><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:'+p.col+';margin-right:8px;vertical-align:-1px"></span>'+_pilEsc(p.lab)+'</td>'
      +'<td class="r">'+_pilEsc(_ecoEur(p.eur))+'</td>'
      +(PV?('<td class="r pex-prevu-c">'+((p.eurP!=null)?_pilEsc(_ecoEur(p.eurP)):'\u2014')+'</td><td class="r">'+_pilEsc(_ecoEur(pClot))+'</td>'):'')
      +'<td class="r">'+_pilEsc(_pecPct(p.part))+'</td>'
      +'<td class="r">'+(E.surf>0?_pilEsc(_ecoEur((PV?pClot:p.eur)/E.surf)):'\u2014')+'</td>'
      +'<td class="r">'+(dv!=null?((dv>0?'+':'')+_pilEsc(_pecPct(dv))):'\u2014')+'</td>'
      +'<td style="color:var(--texte-doux)">'+_pilEsc(p.det)+'</td></tr>';
  }).join('');
  var dClotT=(cmp&&cmp.total>0)?(((PV?E.totalClot:E.total)-cmp.total)/cmp.total*100):null;
  var tPostes='<div class="pec-card"><div class="pec-ch"><div class="pec-ct">O\u00f9 est parti l\u2019argent</div>'
    // ★ Le POURQUOI de « trois postes » — la conduite deja comptee dans les
    //   salaires — explique le calcul. Il part dans la fiche de l'exercice.
    +'<div class="pec-cs pec-ci">'
    +(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.exo.postes')):'')+'</div></div>'
    +'<div class="pec-cb"><div class="pec-scroll"><table class="pec-tbl" style="min-width:560px">'
    +'<thead><tr><th>Poste</th><th class="r">'+(PV?'Sorti':'Montant')+'</th>'+(PV?'<th class="r">Pr\u00e9vu</th><th class="r">\u00c0 la cl\u00f4ture</th>':'')+'<th class="r">Part</th><th class="r">\u20AC/ha</th><th class="r">vs '+_pilEsc(cmp?cmp.ex.court:'N-1')+(PV?' (cl\u00f4ture)':'')+'</th><th>Base de calcul</th></tr></thead>'
    +'<tbody>'+pr+'</tbody>'
    +'<tfoot><tr><td>Total</td><td class="r">'+_pilEsc(_ecoEur(E.total))+'</td>'+(PV?('<td class="r pex-prevu-c">'+_pilEsc(_ecoEur(E.totalP))+'</td><td class="r">'+_pilEsc(_ecoEur(E.totalClot))+'</td>'):'')+'<td class="r">100 %</td><td class="r">'+_pilEsc(_ecoEur(PV?E.coutHaClot:E.coutHa))+'</td><td class="r">'+(dClotT!=null?((dClotT>0?'+':'')+_pilEsc(_pecPct(dClotT))):'\u2014')+'</td><td></td></tr></tfoot>'
    +'</table></div>'
    +'</div></div>';
  return { alertes:A.join(''), kpis:kpis, garde:garde, tPostes:tPostes };
}

// Detail des salaires — ADMIN uniquement : ce tableau expose la remuneration de
// chaque personne. Meme regle que partout ailleurs (paie est admin-only en LECTURE).
function _pexTableSal(E){
  if(!(typeof window.isAdmin==='function' && window.isAdmin()))
    return '<div class="pec-card"><div class="pec-cb"><div class="pec-empty">'+_mvIcon('cadenas',16)+' Le d\u00e9tail par personne est r\u00e9serv\u00e9 aux administrateurs.</div></div></div>';
  if(!E.gens.length)
    return '<div class="pec-card"><div class="pec-cb"><div class="pec-empty">Aucune heure pos\u00e9e au planning sur cet exercice.</div></div></div>';
  var rows=E.gens.map(function(g){
    var cp=Math.max(0,g.hp-g.hw);
    // ★ Le taux n'est plus forcement UN nombre : quand il a change dans l'exercice,
    // la colonne dit la SUITE des taux. Afficher la seule moyenne ponderee aurait
    // rendu une valeur que personne n'a jamais signee sur un contrat.
    var txCell;
    if(g.txs && g.txs.length>1)
      txCell=g.txs.map(function(t){ return _ecoEur2(t.v); }).join(' puis ')+' \u20AC';
    else if(g.tx>0) txCell=_ecoEur2(g.tx)+' \u20AC';
    else txCell='<span style="color:'+_PEC_COL.ret+'">\u2014</span>';
    if(g.hNoTx>0.05 && g.txs && g.txs.length)
      txCell+='<div style="font-size:var(--pt-lbl,12px);color:'+_PEC_COL.ret+'">'+_ecoH1(g.hNoTx)+' h sans taux</div>';
    return '<tr><td class="n">'+_pilEsc(g.nom)
      +(g.coll?' <span class="pec-pill" style="background:var(--or-pale);color:var(--or-tx,#7A5E12)">\u00e9quipe</span>':'')
      +(g.bureau?' <span class="pec-pill" style="background:var(--gris-clair);color:var(--texte-doux)">bureau</span>':'')+'</td>'
      +'<td class="r">'+_ecoH1(g.hp)+' h</td>'
      +'<td class="r">'+_ecoH1(g.hw)+' h</td>'
      +(E.enCoursC?('<td class="r pex-prevu-c">'+((g.hpP>0.05)?(_ecoH1(g.hpP)+' h'):'\u2014')+'</td>'):'')
      +'<td class="r">'+(cp>0.05?(_ecoH1(cp)+' h'):'\u2014')+'</td>'
      +'<td class="r">'+txCell+'</td>'
      +'<td class="r">'+_pilEsc(_ecoEur(g.eur))+'</td></tr>';
  }).join('');
  var cpT=Math.max(0,E.hPaid-E.hWork);
  return '<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Les salaires, personne par personne</div>'
    +'<div class="pec-cs pec-ci">'+(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.exo.salaires')):'')+''
    +'</div></div>'
    +'<div class="pec-cb"><div class="pec-scroll"><table class="pec-tbl" style="min-width:560px">'
    +'<thead><tr><th>Personne</th><th class="r">Pay\u00e9es</th><th class="r">Travaill\u00e9es</th>'+(E.enCoursC?'<th class="r">Pr\u00e9vues</th>':'')+'<th class="r">CP &amp; abs.</th><th class="r">Taux charg\u00e9</th><th class="r">Co\u00fbt</th></tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +'<tfoot><tr><td>Total</td><td class="r">'+_ecoH1(E.hPaid)+' h</td><td class="r">'+_ecoH1(E.hWork)+' h</td>'+(E.enCoursC?('<td class="r pex-prevu-c">'+_ecoH1(E.hPaidP)+' h</td>'):'')+'<td class="r">'+(cpT>0.05?(_ecoH1(cpT)+' h'):'\u2014')+'</td><td class="r"></td><td class="r">'+_pilEsc(_ecoEur(E.salT))+'</td></tr></tfoot>'
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
    +'<div class="pec-cs">'
    +(E.achRows.length>60?(' Les 60 plus r\u00e9cents sont affich\u00e9s\u00a0; le total porte sur les '+E.achRows.length+'.'):'')+'</div></div>'
    +'<div class="pec-cb"><div class="pec-scroll"><table class="pec-tbl" style="min-width:520px">'
    +'<thead><tr><th>Date</th><th>Produit</th><th>Fournisseur</th><th class="r">Quantit\u00e9</th><th class="r">Prix HT</th></tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +'<tfoot><tr><td>Total</td><td></td><td></td><td></td><td class="r">'+_pilEsc(_ecoEur(E.achT))+'</td></tr></tfoot>'
    +'</table></div></div></div>';
}
// Le detail des depenses, jumeau du tableau des achats : meme grammaire, meme
// facon de dire l'absence de prix. Rendu seulement s'il y a quelque chose a
// montrer — un tableau vide sur un domaine qui n'en saisit pas serait du bruit.
function _pexTableDep(E){
  if(!E.repRows||!E.repRows.length) return '';
  var rows=E.repRows.slice(0,60).map(function(r){
    // ⚠️ Trois etats, pas deux : un montant SAISI a zero veut dire « sans frais »
    //   (garantie, geste commercial). Le confondre avec l'absence de montant
    //   ferait figurer une reparation deja reglee dans la liste des choses a
    //   chiffrer, indefiniment.
    var val = (r.eur==null) ? '<span style="color:'+_PEC_COL.ret+'">\u00e0 chiffrer</span>'
            : (r.eur>0 ? _pilEsc(_ecoEur(r.eur))
                       : '<span style="color:'+_PEC_COL.mo+'">sans frais</span>');
    var jours='';
    if(r.depuis&&r.date){
      var d0=_pexD(r.depuis).getTime(), d1=_pexD(r.date).getTime();
      var nj=Math.round((d1-d0)/86400000);
      if(nj>=0) jours=(nj+1)+'\u00a0j';
    }
    return '<tr><td class="n">'+_pilEsc(_pecDfrMs(_pexD(r.date).getTime()))+'</td>'
      +'<td>'+_pilEsc(r.lib)+'</td>'
      +'<td>'+_pilEsc(jours||'\u2014')+'</td>'
      +'<td>'+_pilEsc(r.four||'\u2014')+'</td>'
      +'<td class="r">'+val+'</td></tr>';
  }).join('');
  return '<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Les passages chez le r\u00e9parateur</div>'
    +'<div class="pec-cs">'
    +(E.repRows.length>60?(' Les 60 plus r\u00e9centes sont affich\u00e9es\u00a0; le total porte sur les '+E.repRows.length+'.'):'')
    +'</div></div>'
    +'<div class="pec-cb"><div class="pec-scroll"><table class="pec-tbl" style="min-width:520px">'
    +'<thead><tr><th>Retour</th><th>Motif</th><th>Immobilis\u00e9</th><th>R\u00e9parateur</th><th class="r">Montant HT</th></tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +'<tfoot><tr><td>Total chiffr\u00e9</td><td></td><td></td><td></td><td class="r">'+_pilEsc(_ecoEur(E.repT))+'</td></tr></tfoot>'
    +'</table></div>'
    +(E.nRepSansPrix>0?('<div class="pec-note"><b>'+E.nRepSansPrix+' passage'+(E.nRepSansPrix>1?'s':'')
      +' sans montant</b> : \u00e0 chiffrer dans <b>\u00c9conomie \u203a Achats</b> quand la facture arrive.</div>'):'')
    +'</div></div>';
}

// ══ LA CARTE DES CONSOMMABLES — DEUX AXES, UN SEUL TOTAL ═══════════════════
// Ce qui se rachete chaque annee : achats de La Reserve, carburant, depenses.
// La bascule ne change PAS le total, seulement la facon de le decouper.
// ⚠️ Aucune font-size ecrite en dur dans ce fichier : le harnais d'echelle en
//   refuse une seule. Tout passe par var(--pt-X,valeur), repli exact.
function _pexConso(E){
  var T=E.achT+E.gnrT+E.repT;
  var ate=(_PEC_AXE==='ate');
  var head='<div class="pec-ch"><div class="pec-ct">Les consommables</div>'
    +'<div class="pec-cs pec-ci">'
    +(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.exo.ateliers')):'')+'</div>'
    +'<div class="pec-sub" role="group" aria-label="Axe de lecture">'
      +'<button data-pec="axe" data-v="nat"'+(ate?'':' class="on"')+'>par nature</button>'
      +'<button data-pec="axe" data-v="ate"'+(ate?' class="on"':'')+'>par atelier</button>'
    +'</div></div>';
  if(!(T>0)){
    return '<div class="pec-card">'+head+'<div class="pec-cb">'
      +'<div class="pec-empty">Aucun consommable chiffr\u00e9 sur cet exercice.</div>'
      +'<div class="pec-note">Les achats se saisissent dans <b>La R\u00e9serve \u203a Intrants</b>, '
      +'les r\u00e9visions et r\u00e9parations dans <b>La R\u00e9serve \u203a D\u00e9penses</b>. '
      +'Le carburant vient tout seul des appoints de cuve.</div>'
      +'<div class="pec-acts"><button class="pec-btn" data-pec="rsv" data-v="intrants">'
      +'<span>+</span> Saisir un achat</button>'
      +'<button class="pec-btn" data-pec="pachgo">Chiffrer dans Achats</button></div>'
      +'</div></div>';
  }
  var body;
  if(ate) body=_pexAxeAtelier(E,T); else body=_pexAxeNature(E,T);
  return '<div class="pec-card">'+head+body+'</div>';   // MOTS-2 (§583) : « Ce qui n'entre pas dans ce total » est la fiche pil.exo.garde, posée sur « Ce total n'est pas un compte de résultat »
}


// ── Axe NATURE : l'axe historique, inchange dans son sens ───────────────────
function _pexAxeNature(E,T){
  var L=[['ach',E.achT,'Achats d\u2019intrants',_PEC_COL.phy, E.nAch+' achat'+(E.nAch>1?'s':'')+' de La R\u00e9serve'],
         ['gnr',E.gnrT,'Carburant GNR',_PEC_COL.gnr, _ecoH1(E.litres)+' L \u00b7 '+E.gnrN+' appoint'+(E.gnrN>1?'s':'')],
         ['dep',E.repT,'R\u00e9parations',_PEC_COL.dep, E.nRep+' passage'+(E.nRep>1?'s':'')+' chez le r\u00e9parateur'],
         ['loc',E.locT||0,'Location de f\u00fbts',_PEC_COL.loc, ((E.locR&&E.locR.n)||0)+' contrat'+(((E.locR&&E.locR.n)||0)>1?'s':'')+' \u00b7 au prorata des jours'],
         ['fut',E.futT||0,_pexFutLbl(),_PEC_COL.fut, (E.nFutAch||0)+' lot'+((E.nFutAch||0)>1?'s':'')+' factur\u00e9'+((E.nFutAch||0)>1?'s':'')]];
  var k='<div class="pec-kpis">';
  L.forEach(function(x){
    if(!(x[1]>0)) return;
    k+='<div class="pec-k"><div class="l"><em style="background:'+x[3]+'"></em>'+_pilEsc(x[2])+'</div>'
      +'<div class="v">'+_pilEsc(_ecoEur(x[1]).replace(' \u20AC',''))+' <small>\u20AC</small></div>'
      +'<div class="s">'+_pilEsc(x[4])+'</div></div>';
  });
  k+='</div>';
  var bar='', leg='';
  L.forEach(function(x){
    if(!(x[1]>0)) return;
    bar+='<i style="background:'+x[3]+';width:'+(x[1]/T*100).toFixed(2)+'%"></i>';
    leg+='<span class="pec-lg"><em style="background:'+x[3]+'"></em>'+_pilEsc(x[2])
        +' <b>'+_pilEsc(_ecoEur(x[1]))+'</b></span>';
  });
  return k+'<div class="pec-cb" style="padding-top:16px">'
    +'<div class="pec-bar">'+bar+'</div><div class="pec-leg">'+leg+'</div>'
    +'</div>';
}

// ── Axe ATELIER : la destination ────────────────────────────────────────────
function _pexAxeAtelier(E,T){
  var ORD=_pexAteOrd(), A=E.ateEur||{}, S=E.ateSrc||{};
  var k='<div class="pec-kpis">';
  ORD.forEach(function(a){
    var v=A[a]||0; if(!(v>0)) return;
    k+='<div class="pec-k"><div class="l"><em style="background:'+_pexAteCol(a)+'"></em>'+_pilEsc(_pexAteLbl(a))+'</div>'
      +'<div class="v">'+_pilEsc(_ecoEur(v).replace(' \u20AC',''))+' <small>\u20AC</small></div>'
      +'<div class="s">'+_pilEsc(_ecoEur2(v/T*100))+' % '
      +(E.surf>0?('\u00b7 '+_pilEsc(_ecoEur(v/E.surf))+'/ha'):'')+'</div></div>';
  });
  k+='</div>';
  var bar='', leg='';
  ORD.forEach(function(a){
    var v=A[a]||0; if(!(v>0)) return;
    bar+='<i style="background:'+_pexAteCol(a)+';width:'+(v/T*100).toFixed(2)+'%"></i>';
    leg+='<span class="pec-lg"><em style="background:'+_pexAteCol(a)+'"></em>'+_pilEsc(_pexAteLbl(a))
        +' <b>'+_pilEsc(_ecoEur(v))+'</b></span>';
  });
  // Le detail : d'ou vient chaque euro. C'est ce qui rend la repartition
  // verifiable au lieu d'etre a croire.
  var rows='';
  ORD.forEach(function(a){
    var v=A[a]||0; if(!(v>0)) return;
    rows+='<tr class="pex-ag"><td colspan="2"><em style="background:'+_pexAteCol(a)+'"></em>'
      +_pilEsc(_pexAteLbl(a))+'</td><td class="r">'+_pilEsc(_ecoEur(v))+'</td>'
      +'<td class="r">'+(E.surf>0?_pilEsc(_ecoEur(v/E.surf)):'\u2014')+'</td></tr>';
    (S[a]||[]).forEach(function(l){
      rows+='<tr><td class="n">'+_pilEsc(l.lib)+'</td><td>'+_pilEsc(l.src)+'</td>'
        +'<td class="r">'+_pilEsc(_ecoEur(l.eur))+'</td>'
        +'<td class="r">'+(E.surf>0?_pilEsc(_ecoEur(l.eur/E.surf)):'\u2014')+'</td></tr>';
    });
  });
  // ★★★ LE CONTROLE EST AFFICHE, PAS SEULEMENT TESTE. Un lecteur qui voit
  //   l'egalite tomber juste n'a pas besoin qu'on lui promette qu'elle l'est.
  //   Un ecart signifie qu'un euro a ete compte deux fois, ou pas du tout.
  var somme=E.achT+E.gnrT+E.repT, ok=Math.abs(E.ateT-somme)<0.005;
  var ctrl='<div class="pex-ctrl'+(ok?'':' bad')+'">'
    +'<div class="l">Contr\u00f4le</div><div>'
    +ORD.filter(function(a){return (A[a]||0)>0;}).map(function(a){ return _pilEsc(_ecoEur(A[a]).replace(' \u20AC','')); }).join(' + ')
    +' = <b>'+_pilEsc(_ecoEur(E.ateT))+'</b> &nbsp;=&nbsp; achats '+_pilEsc(_ecoEur(E.achT))
    +' + GNR '+_pilEsc(_ecoEur(E.gnrT))+' + r\u00e9parations '+_pilEsc(_ecoEur(E.repT))
    +' &nbsp;'+(ok?'<b class="ok">l\u2019\u00e9galit\u00e9 tombe juste</b>':'<b class="ko">\u00c9CART \u2014 un euro est compt\u00e9 deux fois, ou pas du tout</b>')
    +'<br>Les salaires ('+_pilEsc(_ecoEur(E.salT))+') restent hors de ce d\u00e9compte.</div></div>';

  var nsp='';
  if(E.nAchSansPrix>0||E.nRepSansPrix>0){
    var b=[];
    if(E.nAchSansPrix>0) b.push('<b>'+E.nAchSansPrix+' achat'+(E.nAchSansPrix>1?'s':'')+'</b>');
    if(E.nRepSansPrix>0) b.push('<b>'+E.nRepSansPrix+' r\u00e9paration'+(E.nRepSansPrix>1?'s':'')+'</b>');
    nsp=b.join(' et ')+' sans prix : le total est <b>sous-\u00e9valu\u00e9 de ce que valent ces lignes</b>, '
       +'jamais arrondi en silence.<br>';
  }
  return k+'<div class="pec-cb" style="padding-top:16px">'
    +'<div class="pec-bar">'+bar+'</div><div class="pec-leg">'+leg+'</div>'
    +'<div class="pec-scroll" style="margin-top:16px"><table class="pec-tbl" style="min-width:520px">'
    +'<thead><tr><th>Poste</th><th>D\u2019o\u00f9 vient le chiffre</th><th class="r">Montant</th><th class="r">\u20AC/ha</th></tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +'<tfoot><tr><td colspan="2">Total consommables</td><td class="r">'+_pilEsc(_ecoEur(E.ateT))+'</td>'
    +'<td class="r">'+(E.surf>0?_pilEsc(_ecoEur(E.ateT/E.surf)):'\u2014')+'</td></tr></tfoot>'
    +'</table></div>'
    +ctrl
    +(nsp?('<div class="pec-note">'+nsp+'</div>'):'')
    +'<div class="pec-acts">'
    +'<button class="pec-btn" data-pec="rsv" data-v="intrants"><span>+</span> Saisir un achat</button>'
    +'<button class="pec-btn" data-pec="pachgo">Chiffrer dans Achats</button>'
    +'</div>'
    +'</div>';
}

// ══════════════════════ ACHATS — LE SEUL ENDROIT OU L'ON MET LES PRIX ═══════
// ★★★ CE N'EST PAS UN SECOND FORMULAIRE DE SAISIE, c'est un ecran de
//   VALORISATION. Le FAIT reste dans son module — le fut au parc, la reparation
//   au tracteur, l'intrant a La Reserve — et cet ecran ne fait que deux choses :
//   les lister toutes, et porter le PRIX.
// ⚠️ La raison d'etre : le prix arrive PLUS TARD, souvent en lot (les factures
//   du mois), et il n'interesse pas celui qui fait le geste sur le terrain.
//   Le fait et le prix sont deux gestes, a deux moments, souvent par deux
//   personnes. Les demander ensemble, c'est demander a un tractoriste qui rend
//   les cles un chiffre qu'il n'a pas.
// ⚠️⚠️ TROIS ETATS, JAMAIS DEUX :
//     prix == null  -> a chiffrer (on ne sait pas encore)
//     prix === 0    -> sans frais (garantie, geste commercial) — une VALEUR
//     prix > 0      -> chiffre
//   Un test `if(prix)` confondrait les deux premiers et laisserait une
//   reparation sous garantie « a chiffrer » a vie, en faisant mentir le
//   compteur d'en-tete tous les mois.
// ⚠️ Le prix retourne DANS L'OBJET, pas dans une table de prix a part : un fut
//   coute X, ce n'est pas une ligne comptable separee. Une table liee par
//   identifiant laisserait des orphelins le jour ou l'objet est supprime.
var _PACH_FILT='tout';   // 'tout' | 'sans'
// ★ L'ECRAN N'ETAIT BORNE PAR AUCUNE DATE : son « Total chiffre » couvrait tout
//   l'historique du domaine, pose a cote d'un total d'exercice. Deux nombres
//   voisins qui ne pouvaient QUE diverger, sans que rien ne dise pourquoi.
var _PACH_PER='exe';     // 'exe' | 'tout'
var _PACH_SRC={
  rsv:   { lbl:'La R\u00e9serve',  col:'#5B2D8E', ecr:'La R\u00e9serve \u203a Intrants' },
  fut:   { lbl:'Parc \u00e0 f\u00fbts', col:'#8A5A38', ecr:'La R\u00e9serve \u203a F\u00fbts' },
  futloc:{ lbl:'Location',     col:'#1D6F8C', ecr:'La R\u00e9serve \u203a F\u00fbts (contrat)' },
  trac:  { lbl:'R\u00e9parateur',  col:'#2C3E50', ecr:'Tracteur \u203a Retour du r\u00e9parateur' }
};

// Rassemble les trois sources. AUCUNE ne se recalcule : on lit les objets la ou
// ils vivent, et l'identifiant sert a y reecrire le prix.
function _pachLignes(){
  var out=[];
  var I=(window.INTRANTS&&typeof window.INTRANTS==='object')?window.INTRANTS:{};
  var prodBy={}; (I.produits||[]).forEach(function(p){ if(p&&p.id) prodBy[p.id]=p; });

  (I.achats||[]).forEach(function(a){
    if(!a||!a.id) return;
    var pr=prodBy[a.prodId]||null;
    out.push({ src:'rsv', id:a.id, date:String(a.date||'').slice(0,10),
      quoi:((pr&&pr.nom)||'Intrant')+(a.q?(' \u00b7 '+_pilHa(a.q)+' '+((pr&&pr.unite)?((typeof window._rsvUnite==='function')?window._rsvUnite(pr.unite,a.q):pr.unite):'')):''),   // INTRANT-1 : l'unité s'accorde
      four:a.four||'', ate:_pexAteDe((pr&&pr.cat)||'gen'),
      prix:(a.prix!=null&&isFinite(Number(a.prix)))?Number(a.prix):null, fact:a.fact||'' });
  });

  // ★ Un lot LOUE n'a pas de prix d'achat : il a un loyer, connu le jour de la
  //   signature. Il ne se chiffre donc PAS ici — il s'affiche en lecture seule,
  //   pour que cet ecran reste le seul ou l'on voit tout l'argent, et le montant
  //   affiche est celui de l'EXERCICE COURANT, au prorata des jours.
  var _exC=(typeof _pexEx==='function')?_pexEx():null;
  (I.futs||[]).forEach(function(f){
    if(!f||!f.id) return;
    var estLoc=(typeof window._mvFutEstLoc==='function')?window._mvFutEstLoc(f):(f.mode==='loc');
    if(estLoc){
      var lr=null;
      if(_exC && typeof window._mvFutLoyerLot==='function')
        lr=window._mvFutLoyerLot(I, window.CAVE_ELEVAGE||null, f, _exC.d0, _exC.d1, _exC.an);
      out.push({ src:'futloc', id:f.id, date:String(f.debut||f.date||'').slice(0,10), ro:true,
        quoi:(f.qte||0)+' f\u00fbt'+((f.qte||0)>1?'s':'')+(f.ref?(' '+f.ref):'')+' \u00b7 location'
             +((lr&&lr.jours>0)?(' \u00b7 '+lr.jours+'\u00a0j sur l\u2019exercice'):''),
        four:f.four||'', ate:'cave',
        prix:(lr&&!lr.sansLoyer)?lr.eur:null, fact:f.fact||'' });
      return;
    }
    var dt=(typeof window._mvFutDateAchat==='function')?window._mvFutDateAchat(f):String(f.dfact||f.date||'').slice(0,10);
    out.push({ src:'fut', id:f.id, date:dt,
      quoi:(f.qte||0)+' f\u00fbt'+((f.qte||0)>1?'s':'')+(f.ref?(' '+f.ref):'')+(f.annee?(' \u00b7 mill\u00e9sime '+f.annee):''),
      four:f.four||'', ate:'cave',
      prix:(f.prix!=null&&isFinite(Number(f.prix)))?Number(f.prix):null, fact:f.fact||'' });
  });

  var RH=(window.REPARATEUR_HIST&&typeof window.REPARATEUR_HIST==='object')?window.REPARATEUR_HIST:{};
  Object.keys(RH).forEach(function(tid){
    var arr=RH[tid]; if(!Array.isArray(arr)) return;
    arr.forEach(function(r,i){
      if(!r||!r.retour) return;
      var j='';
      if(r.depuis){
        var nj=Math.round((_pexD(r.retour).getTime()-_pexD(r.depuis).getTime())/86400000);
        if(nj>=0) j=' \u00b7 '+(nj+1)+'\u00a0j chez le r\u00e9parateur';
      }
      out.push({ src:'trac', id:tid+'|'+i, date:String(r.retour).slice(0,10),
        quoi:(r.motif||'Intervention')+j, four:r.four||'', ate:'trac',
        prix:(r.eur!=null&&isFinite(Number(r.eur)))?Number(r.eur):null, fact:r.fact||'' });
    });
  });

  out.sort(function(a,b){ return a.date<b.date?1:(a.date>b.date?-1:0); });
  // ⚠️ Le bornage se fait ICI, en sortie, et nulle part ailleurs : _pachOpen relit
  //   la meme liste pour retrouver une ligne, et une ligne filtree d'un cote mais
  //   pas de l'autre rendrait « ligne introuvable » sur un bouton visible.
  if(_PACH_PER==='exe'){
    var ex=(typeof _pexEx==='function')?_pexEx():null;
    if(ex && ex.d0 && ex.d1)
      out=out.filter(function(x){ return x.date && x.date>=ex.d0 && x.date<=ex.d1; });
  }
  return out;
}

// ★ Ecrit le prix DANS L'OBJET D'ORIGINE, puis sauvegarde le document qui le
//   porte — jamais une copie locale. Rend le nom du document sauve, ou null.
function _pachEcrit(src,id,prix,fact){
  var I=window.INTRANTS||{};
  if(src==='rsv'){
    var a=(I.achats||[]).find(function(x){ return x&&x.id===id; });
    if(!a) return null;
    a.prix=prix; if(fact!=null) a.fact=fact;
    return 'intrants';
  }
  if(src==='fut'){
    var f=(I.futs||[]).find(function(x){ return x&&x.id===id; });
    if(!f) return null;
    f.prix=prix; if(fact!=null) f.fact=fact;
    return 'intrants';
  }
  if(src==='trac'){
    var p=String(id).split('|'), tid=p[0], k=parseInt(p[1],10);
    var arr=(window.REPARATEUR_HIST||{})[tid];
    if(!Array.isArray(arr)||!arr[k]) return null;
    arr[k].eur=prix; if(fact!=null) arr[k].fact=fact;
    return 'reparateur_hist';
  }
  return null;
}

function _pachView(){
  var L=_pachLignes();
  var chif=L.filter(function(x){ return x.prix!=null; });   // 0 EUR compte comme chiffre
  var sans=L.filter(function(x){ return x.prix==null; });
  var tot=chif.reduce(function(a,x){ return a+x.prix; },0);
  var adm=(typeof isAdmin==='function')?isAdmin():false;

  var h='';   // la sous-nav est posee par l'appelant

  // MOTS-2 (§583) : une phrase, la bande de ce qui reste à chiffrer, puis les chiffres. Le « pourquoi » de l'écran est dans la fiche pil.eco.achats.
  h+=_pecEnteteVue('', (sans.length?'Au moins ':'')+'<b>'+_pilEsc(_ecoEur(tot))+'</b> d’achats'+(sans.length?'':' chiffrés')+'.', 'pil.eco.achats')
   +(sans.length?_pecBandeAvis('<b>'+sans.length+' achat'+(sans.length>1?'s':'')+' sans prix</b> · le total est un plancher', '<button class="pil-diag-go ghost" data-pec="pachf" data-v="sans">Chiffrer ›</button>'):'')
   +'<div class="pec-card">'
   +'<div class="pec-kpis">'
   +'<div class="pec-k"><div class="l">Chiffr\u00e9</div><div class="v">'
     +_pilEsc(_ecoEur(tot).replace(' \u20AC',''))+' <small>\u20AC</small></div>'
     +'<div class="s">'+chif.length+' ligne'+(chif.length>1?'s':'')+' sur '+L.length+'</div></div>'
   +'<div class="pec-k"><div class="l">\u00c0 chiffrer</div><div class="v"'
     +(sans.length?(' style="color:'+_PEC_COL.ret+'"'):'')+'>'+sans.length+'</div>'
     +'<div class="s">'+(sans.length?'sans prix':'rien en attente')+'</div></div>'
   +'<div class="pec-k"><div class="l">Sources</div><div class="v">'
     +Object.keys(_PACH_SRC).filter(function(k){ return L.some(function(x){return x.src===k;}); }).length
     +' <small>/ 4</small></div><div class="s">R\u00e9serve, f\u00fbts, location, r\u00e9parateur</div></div>'
   +'</div></div>';

  if(!L.length){
    return h+'<div class="pec-card"><div class="pec-cb" style="padding-top:16px">'
      +'<div class="pec-empty">Rien d\u2019acquis pour l\u2019instant.</div>'
      +'<div class="pec-note">Les lignes arrivent d\u2019elles-m\u00eames\u00a0: un achat saisi dans La R\u00e9serve, '
      +'un lot de f\u00fbts, une machine rentr\u00e9e du r\u00e9parateur. <b>Rien ne se cr\u00e9e ici.</b></div>'
      +'</div></div>';
  }

  var V=(_PACH_FILT==='sans')?sans:L;
  var rows=V.slice(0,120).map(function(x){
    var S=_PACH_SRC[x.src]||_PACH_SRC.rsv;
    // ⚠️ Trois etats. `x.prix>0` seul confondrait « sans frais » et « a chiffrer ».
    var cell;
    if(x.prix==null){
      cell=adm?('<button class="pach-p vide" data-pec="pach" data-v="'+_escAttr(x.src+'::'+x.id)+'">\u00e0 chiffrer</button>')
              :('<span style="color:'+_PEC_COL.ret+'">\u00e0 chiffrer</span>');
    } else if(x.prix>0){
      cell=adm?('<button class="pach-p" data-pec="pach" data-v="'+_escAttr(x.src+'::'+x.id)+'">'+_pilEsc(_ecoEur(x.prix))+'</button>')
              :_pilEsc(_ecoEur(x.prix));
    } else {
      cell=adm?('<button class="pach-p ok" data-pec="pach" data-v="'+_escAttr(x.src+'::'+x.id)+'">sans frais</button>')
              :'<span style="color:'+_PEC_COL.mo+'">sans frais</span>';
    }
    var A=_pexAteLbl(x.ate), AC=_pexAteCol(x.ate);
    return '<tr><td>'+_pilEsc(x.date?_pecDfrMs(_pexD(x.date).getTime()):'\u2014')+'</td>'
      +'<td class="n">'+_pilEsc(x.quoi)+'</td>'
      +'<td><span class="pex-apill" style="background:color-mix(in srgb,'+S.col+' 13%,transparent);color:'+S.col+'">'
        +_pilEsc(S.lbl)+'</span></td>'
      +'<td><span class="pex-apill" style="background:color-mix(in srgb,'+AC+' 14%,transparent);color:'
        +(x.ate==='gen'?'var(--texte-doux)':AC)+'">'+_pilEsc(A)+'</span></td>'
      +'<td>'+_pilEsc(x.four||'\u2014')+'</td>'
      +'<td class="r">'+cell+'</td></tr>';
  }).join('');

  h+='<div class="pec-card"><div class="pec-cb" style="padding-top:16px">'
   +'<div class="pec-acts" style="margin-top:0;margin-bottom:14px">'
     +(adm?'<button class="pec-btn pec-btn-p" data-pec="pachadd"><span>+</span> Achat</button>':'')
     +'<button class="pec-btn'+(_PACH_FILT==='tout'?' on':'')+'" data-pec="pachf" data-v="tout">Tout</button>'
     +'<button class="pec-btn'+(_PACH_FILT==='sans'?' on':'')+'" data-pec="pachf" data-v="sans">\u00c0 chiffrer</button>'
     +'<button class="pec-btn'+(_PACH_PER==='exe'?' on':'')+'" data-pec="pachper" data-v="exe">Exercice</button>'
     +'<button class="pec-btn'+(_PACH_PER==='tout'?' on':'')+'" data-pec="pachper" data-v="tout">Tout l\u2019historique</button>'
   +'</div>'
   +'<div class="pec-scroll"><table class="pec-tbl" style="min-width:640px">'
   +'<thead><tr><th>Date</th><th>Ce qui a \u00e9t\u00e9 acquis</th><th>Cr\u00e9\u00e9 dans</th><th>Atelier</th>'
   +'<th>Fournisseur</th><th class="r">Prix HT</th></tr></thead><tbody>'
   +(rows||'<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--texte-doux)">Rien dans ce filtre.</td></tr>')
   +'</tbody><tfoot><tr><td colspan="5">Total chiffr\u00e9</td><td class="r">'+_pilEsc(_ecoEur(tot))+'</td></tr></tfoot>'
   +'</table></div>'
   +(V.length>120?('<div class="pec-note">Les 120 lignes les plus récentes sont affichées ; le total porte sur les '+V.length+'.</div>'):'')
   +'</div></div>';
  return h;
}

// ★★★ CHAQUE DOCUMENT A SON ECRIVAIN, ET `intrants` N'EST PAS UNE CLE DE
//   saveData. app.js ne connait pas INTRANTS (ni dans sa table `W`, ni dans le
//   snapshot localStorage) : il est charge par `_rsvApply` et sauve par
//   `saveIntrants()`, dans reserve.js. Passer 'intrants' a saveData faisait
//   tomber l'appel dans la branche MULTI-CLES -- les 23 AUTRES documents
//   reecrits, et jamais celui qu'on voulait ecrire. Le prix restait en memoire,
//   le toast disait vert, le rechargement effacait tout.
//   ⚠️ Ne jamais deviner l'ecrivain : si le module n'est pas la, on le DIT.
function _pachSave(doc){
  if(doc==='intrants'){
    if(typeof window.saveIntrants!=='function') return false;
    window.saveIntrants(); return true;
  }
  if(typeof window.saveData!=='function') return false;
  window.saveData(doc); return true;
}

// Saisie du prix. ⚠️ Le prompt natif est volontaire ici : la valeur est UN
// nombre, et un overlay maison pour un champ unique serait plus de code a tenir
// que de service rendu. Le detail de la ligne est rappele dans l'invite, sinon
// on chiffre a l'aveugle.
function _pachOpen(ref){
  if(typeof isAdmin!=='function'||!isAdmin()){ if(window.showToast) window.showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#C0392B'); return; }
  var p=String(ref).split('::'); if(p.length<2) return;
  var src=p[0], id=p.slice(1).join('::');
  var L=_pachLignes();
  var x=L.find(function(o){ return o.src===src && o.id===id; });
  if(!x){ if(window.showToast) window.showToast('Ligne introuvable \u2014 rechargez l\u2019\u00e9cran','#B85A1A'); return; }
  // ★ Une ligne en lecture seule porte un montant CALCULE (le loyer au prorata).
  //   L'ecrire ici en ferait une saisie qui contredirait le contrat des le
  //   lendemain — on renvoie a l'endroit ou la donnee vit vraiment.
  if(x.ro){
    if(window.showToast) window.showToast('Loyer du contrat \u2014 il se modifie dans La R\u00e9serve \u203a F\u00fbts','#1D6F8C');
    return;
  }
  var S=_PACH_SRC[src]||_PACH_SRC.rsv;
  var act=(x.prix!=null)?String(x.prix).replace('.',','):'';
  var v=window.prompt(x.quoi+'\n'+(x.four||'sans fournisseur')+' \u00b7 '+S.ecr
    +'\n\nMontant HT en euros. Laissez vide pour « \u00e0 chiffrer », 0 pour « sans frais ».', act);
  if(v===null) return;                       // annule : on ne touche a rien
  var t=String(v).trim().replace(',','.');
  var prix;
  if(t===''){ prix=null; }
  else {
    var n=parseFloat(t);
    // ⚠️ `n>=0` et non `n>0` : saisir 0 est un ACTE (garantie), pas un vide.
    if(!isFinite(n)||n<0){ if(window.showToast) window.showToast('Montant illisible','#B85A1A'); return; }
    prix=n;
  }
  var doc=_pachEcrit(src,id,prix,null);
  if(!doc){ if(window.showToast) window.showToast('Ligne introuvable \u2014 rien enregistr\u00e9','#B85A1A'); return; }
  // ⚠️ L'ecriture memoire est DEJA faite par _pachEcrit. Si la persistance ne
  //   part pas, ne pas annoncer « Enregistre » : on repeint et on le dit.
  var _ok=_pachSave(doc);
  _pilFillContent(_pilData());
  if(!_ok){ if(window.showToast) window.showToast('Non enregistr\u00e9 \u2014 module indisponible, rechargez l\u2019application','#C0392B'); return; }
  if(window.showToast) window.showToast(
    prix==null ? 'Laiss\u00e9 \u00e0 chiffrer' : (prix>0 ? ('Enregistr\u00e9 dans '+S.ecr) : 'Not\u00e9 sans frais'),
    prix==null ? '#B85A1A' : '#3D6B27');
}

// ★ « Achat » n'ouvre PAS un formulaire maison : il ouvre celui du module qui
//   possede la donnee. C'est ce qui distingue cet ecran d'un second point de
//   saisie — un intrant phyto demande le catalogue E-Phy, le refaire ici serait
//   deux formulaires qui divergent.
function _pachAdd(){
  if(typeof isAdmin!=='function'||!isAdmin()){ if(window.showToast) window.showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#C0392B'); return; }
  var q='Qu\u2019est-ce qui a \u00e9t\u00e9 acquis ?\n\n'
    +'1 \u2014 un intrant (SO\u2082, levures, phyto, piquets, pi\u00e8ces\u2026)\n'
    +'2 \u2014 des f\u00fbts\n'
    +'3 \u2014 une machine partie chez le r\u00e9parateur\n\n'
    +'Le formulaire du module concern\u00e9 s\u2019ouvrira.';
  var c=window.prompt(q,'1');
  if(c===null) return;
  c=String(c).trim();
  if(c==='3'){
    if(!window.goTo){ if(window.showToast) window.showToast('Module Tracteur indisponible','#B85A1A'); return; }
    window.goTo('tracteur');
    if(window.showToast) window.showToast('Tracteur \u203a « Chez le r\u00e9parateur » \u2014 la ligne na\u00eetra au retour','#C2871E');
    return;
  }
  if(c!=='1'&&c!=='2'){ if(window.showToast) window.showToast('Choix non reconnu','#B85A1A'); return; }
  if(!window.goTo){ if(window.showToast) window.showToast('La R\u00e9serve est indisponible','#B85A1A'); return; }
  var onglet=(c==='2')?'futs':'intrants';
  window.goTo('reserve');
  // Le delai : goTo declenche renderReserve, qui reconstruit la page. Ouvrir
  // l'overlay dans la meme pile le ferait fermer aussitot.
  setTimeout(function(){
    try{
      if(window._rsvTabTo) window._rsvTabTo(onglet);
      var f=(c==='2')?window._rsvOpenFut:window._rsvOpenAchat;
      if(typeof f==='function') setTimeout(f,180);
    }catch(e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'pachAdd '+onglet}); }
  },240);
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
      + '<div class="pec-cs">Mois par mois, ce qui est sorti'
      +(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.exo.postes')):'')+'</div></div>'
      + '<div class="pec-cb"><div id="pec-g-pex"></div></div></div>'
    + V.tPostes
    + V.garde
    + _pexConso(E)
    + _pexTableSal(E)
    + _pexTableAch(E)
    + _pexTableDep(E);
  // PIL-RANGE-4b (§447) : les trois réglages (ouverture de l'exercice, ouverture de l'année vigne, compte des fûts) sont
  //   des réglages, pas des chiffres à lire : ils vivent dans la roue crantée du Pilotage (_pilParamBody), côte à côte.
}

// ── La vue « Revient » (REV-1) ──────────────────────────────────────────────
// Un entonnoir : combien de vin → combien de bouteilles → combien coûte chacune.
// Les trois règles du module (§42b) : le CADRE en une ligne sous chaque titre, la
// MÉTHODE derrière un « i », ce qui dit quoi faire est un BOUTON.
function _pecRevE2(n){ return (Math.round((Number(n)||0)*100)/100).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function _pecRevF1(n){ return (Math.round((Number(n)||0)*10)/10).toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1}); }
function _pecRevDt(iso){ var s=String(iso||''); return (s.length>=10)?(s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4)):'\u2014'; }
function _pecRevEtat(R){
  return (R.etat==='cons')?'<span class="prv-e prv-e-c">constat\u00e9</span>':'<span class="prv-e prv-e-p">probable</span>';
}
function _pecRevMax(g){
  if(!g.maxs.length) return '\u2014';
  var a=g.maxs[0], b=g.maxs[g.maxs.length-1];
  return (a===b)?_pilNum(a):(_pilNum(a)+'\u2013'+_pilNum(b));
}
var _PEC_REV_SRC={ r:'r\u00e9colt\u00e9e', h:'moy. de ses mill\u00e9simes', m:'moy. de l\u2019appellation', n:'sans estimation', x:'pas de r\u00e9colte' };   // x : SANSREC-1
function _pecViewRevient(){
  var R=null;
  try{ R=_pecRevData(); }catch(e){ R=null; if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'revient',err:e}); }
  if(!R) return '<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Revient</div>'
    +'<div class="pec-cs">le calcul n\u2019a pas abouti '+_mvInfoBtn('pil.eco.revient')+'</div></div></div>';
  var T=R.tot, C=R.couts, cy=R.cy, H='';
  var haR=0; R.rows.forEach(function(r){ if(r.src==='r') haR+=r.surf; });
  var haP=T.ha-(T.haX||0), pctR=(haP>0)?Math.round(haR/haP*100):0;   // SANSREC-1 : une vigne sans récolte n'est pas « à récolter »
  var projete=(C.tot.prevu>0);

  // ① Le millésime, son cycle, et les trois chiffres
  var chips='';
  if(R.mils.length>1){
    chips='<div class="prv-mils">'+R.mils.map(function(m){
      return '<button data-pec="revmil" data-v="'+m+'"'+(m===R.mil?' class="on"':'')+'>'+m+'</button>';
    }).join('')+'</div>';
  }
  // MOTS-2 (§583) : le cycle ouvre l'écran (une ligne) ; « coûts de culture seulement » est dans la fiche pil.eco.revient.
  var cadre=_pilEsc(_pecDfrIso(cy.d0))+' → '+_pilEsc(_pecDfrIso(cy.d1))+(R.etat==='cons'?'':(' · '+pctR+' % récolté'))   /* tout récolté : la pastille « constaté » le dit déjà */
    +(T.nX?(' · '+T.nX+' parcelle'+(T.nX>1?'s':'')+' sans récolte'):'');
  var sR=(T.hlha!=null)?(_pilNum(T.hl)+' hL sur '+_pilHa(T.haAvec)+' ha'):'aucun rendement connu';
  var cols=(R.etat==='cons')?T.cols:(Math.round(T.cols/100)*100);
  var sB='75 cl \u00b7 pertes '+_pecRevF1(R.pertes)+' % '+(R.pertesMes?('mesur\u00e9es sur '+R.pertesMes.mil):'(r\u00e9glage)')
    +(T.kgVendu>0?(' \u00b7 raisin vendu retir\u00e9'):'');
  var sC=(T.eurCol!=null) ? ('÷ '+_pilNum(T.cols)+' cols') : 'il faut un rendement pour diviser';
  var phrase=(T.eurCol!=null) ? ('<b>'+_pecRevE2(T.eurCol)+' €</b> la bouteille, à la vigne'+(projete?', main-d’œuvre prévue comprise':'')+'.') : 'Pas encore de coût à la bouteille : il manque un rendement.';
  H+=_pecEnteteVue('<div class="pec-per"><span><b>Millésime '+R.mil+'</b> · '+cadre+'</span></div>', phrase, 'pil.eco.revient')
    +'<div class="pec-card">'
    +'<div class="pec-cb" style="padding-bottom:0">'+chips+'</div>'
    +'<div class="pec-kpis">'
    +'<div class="pec-k"><div class="l">Rendement'+_pecRevEtat(R)+'</div><div class="v">'
      +(T.hlha!=null?_pecRevF1(T.hlha):'\u2014')+'<small> hL/ha</small></div><div class="s">'+sR
      +(T.haX>0?('<br>'+_pilHa(T.haX)+' ha sans r\u00e9colte cette ann\u00e9e, hors rendement'):'')
      +(T.haSans>0?('<br>'+_pilHa(T.haSans)+' ha sans estimation, compt\u00e9s \u00e0 part'):'')+'</div></div>'
    +'<div class="pec-k"><div class="l">Bouteilles'+_pecRevEtat(R)+'</div><div class="v">'
      +(T.cols>0?_pilNum(cols):'\u2014')   /* ★ PORTEE-1 (§591) : plus de « ≈ » (hors de la police) — l'étiquette dit déjà « probable » */+'</div><div class="s">'+sB+'</div></div>'
    +'<div class="pec-k"><div class="l">Coût du cycle'+(projete?'<span class="prv-e prv-e-j">projeté</span>':'')+'</div><div class="v">'
      +((T.coutDom>0)?_pilEsc(_pecEurK(T.coutDom)):'—')+'</div><div class="s">'+sC+'</div></div>'
    +'</div>';
  // Ce qui borne ou affaiblit le chiffre : dit, jamais deviné.
  var notes=[];
  if(cy.src0==='an') notes.push('D\u00e9but du cycle\u00a0: aucune r\u00e9colte '+(R.mil-1)+' saisie, il part un an avant sa fin.');
  if(cy.src1==='plan') notes.push('Fin de vendange pr\u00e9vue le '+_pecRevDt(cy.d1)+'\u00a0: la main-d\u2019\u0153uvre jusque-l\u00e0 vient du planning.');
  if(cy.src1==='auj') notes.push('Fin de vendange non dat\u00e9e\u00a0: le co\u00fbt s\u2019arr\u00eate \u00e0 aujourd\u2019hui.');
  if(!C.tvOk) notes.push('Main-d\u2019\u0153uvre non chiffr\u00e9e\u00a0: le planning ne dit encore rien de ce cycle.');
  if(C.arrEur>0) notes.push('Vignes arrach\u00e9es\u00a0: '+_pecEurK(C.arrEur)+' de tracteur, phyto et prestations sur '+C.nArr+' parcelle'+(C.nArr>1?'s':'')+', r\u00e9partis \u00e0 la surface sur les vignes en place.');
  if(R.rep&&R.rep.n>0) notes.push('Pas de r\u00e9colte cette ann\u00e9e\u00a0: '+(R.rep.n<=3?R.rep.noms.map(function(n){ return _pilEsc(n); }).join(', '):(R.rep.n+' parcelles'))
    +', '+_pilHa(R.rep.ha)+' ha.'+(R.rep.eur>0?(' '+(R.rep.n>1?'Leurs ':'Ses ')+_pecEurK(R.rep.eur)+' de culture sont r\u00e9partis \u00e0 la surface sur les autres vignes.'):''));   // SANSREC-1
  if(C.nSansTaux>0) notes.push(C.nSansTaux+' salari\u00e9'+(C.nSansTaux>1?'s':'')+' sans taux horaire, compt\u00e9'+(C.nSansTaux>1?'s':'')+' au taux moyen.');
  if(notes.length) H+='<div class="pec-cb">'+_pecFiabRemq(notes,'pil.eco.revremq')+'</div>';   // MOTS-2 (§583) : ce qui borne le chiffre s'ouvre d'un toucher (le rendu des remarques, §582)
  if(R.etat==='vide') H+='<div class="pec-cb"><div class="pec-acts" style="margin-top:0"><button class="pec-btn" data-pec="cave" data-v="vendange"><span>'+_mvIcon('raisin',16)+'</span> Saisir les r\u00e9coltes au Cuvier</button></div></div>';
  H+='</div>';

  // ② Par appellation — la ligne se déplie en parcelles
  var tb='<div class="pec-scroll"><table class="pec-tbl prv-tbl"><thead><tr><th>Appellation</th><th class="prv-hs" style="text-align:right">Surface</th>'
    +'<th style="text-align:right">hL/ha</th><th class="prv-hs" style="text-align:right">Plafond</th><th style="text-align:right">Bouteilles</th>'
    +'<th style="text-align:right">\u20AC / col</th></tr></thead><tbody>';
  R.aoc.forEach(function(g,i){
    var ref=(g.maxs.length?g.maxs[g.maxs.length-1]:0);
    var w=(g.hlha!=null&&ref>0)?Math.min(100,g.hlha/ref*100):0;
    tb+='<tr class="prv-row" data-pec="revrow" data-v="'+i+'"><td><span class="prv-chev">\u203A</span><b>'+_pilEsc(g.aoc)+'</b></td>'
      +'<td class="prv-hs" style="text-align:right">'+_pilHa(g.ha)+' ha</td>'
      +'<td style="text-align:right">'+(g.hlha!=null?_pecRevF1(g.hlha):'\u2014')+(g.est?'<span class="prv-src h">est.</span>':'')
        +(ref>0?('<div class="prv-jg"><i'+(g.est?' class="est"':'')+' style="width:'+Math.round(w)+'%"></i></div>'):'')+'</td>'
      +'<td class="prv-hs" style="text-align:right;color:var(--texte-doux)">'+_pecRevMax(g)+'</td>'
      +'<td style="text-align:right">'+(g.cols>0?_pilNum(g.cols):'\u2014')+'</td>'
      +'<td style="text-align:right;font-weight:600">'+(g.eurCol!=null?(_pecRevE2(g.eurCol)+' \u20AC'):'\u2014')+'</td></tr>';
    g.rows.forEach(function(r){
      tb+='<tr class="prv-det prv-hid" data-prv="'+i+'"><td>'+_pilEsc(r.nom)+' <span class="prv-src '+r.src+'">'+_PEC_REV_SRC[r.src]+'</span>'
        +(r.src==='r'&&r.share<1?(' <span class="prv-src n">'+(r.share>0?('domaine '+Math.round(r.share*100)+' %'):'tout vendu')+'</span>'):'')+'</td>'
        +'<td class="prv-hs" style="text-align:right">'+_pilHa(r.surf)+' ha</td>'
        +'<td style="text-align:right">'+(r.hlha!=null?_pecRevF1(r.hlha):'\u2014')+'</td>'
        +'<td class="prv-hs" style="text-align:right;color:var(--texte-doux)">'+(r.max!=null?_pilNum(r.max):'\u2014')+'</td>'
        +'<td style="text-align:right">'+(r.cols>0?_pilNum(r.cols):'\u2014')+'</td>'
        +'<td style="text-align:right">'+(r.src==='x'?'<span class="prv-rep">co\u00fbt r\u00e9parti</span>':(r.eurCol!=null?(_pecRevE2(r.eurCol)+' \u20AC'):'\u2014'))+'</td></tr>';
    });
  });
  tb+='<tr class="prv-tot"><td>Domaine</td><td class="prv-hs" style="text-align:right">'+_pilHa(T.ha)+' ha</td>'
    +'<td style="text-align:right">'+(T.hlha!=null?_pecRevF1(T.hlha):'\u2014')+'</td><td class="prv-hs"></td>'
    +'<td style="text-align:right">'+(T.cols>0?_pilNum(T.cols):'\u2014')+'</td>'
    +'<td style="text-align:right">'+(T.eurCol!=null?(_pecRevE2(T.eurCol)+' \u20AC'):'\u2014')+'</td></tr></tbody></table></div>';
  H+='<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Par appellation</div>'
    +'<div class="pec-cs pec-ci">'+_mvInfoBtn('pil.eco.revrdt')+'</div></div>'
    +'<div class="pec-cb">'+tb+'</div></div>';

  // ③ Du raisin à la bouteille — les conversions de la Cave
  var kgT=T.hl*R.kgHl, hlVendu=Math.max(0,T.hl-T.domHl), hlEl=T.domHl*Math.max(0,1-R.pertes/100);
  var fx=function(l,v,s){ return '<div class="prv-fx"><div class="l">'+l+'</div><div class="v">'+v+'</div><div class="s">'+s+'</div></div>'; };
  var ar='<div class="prv-ar" aria-hidden="true">\u2192</div>';
  H+='<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Du raisin \u00e0 la bouteille</div>'
    +'<div class="pec-cs pec-ci">'+_mvInfoBtn('pil.eco.revconv')+'</div></div>'
    +'<div class="pec-cb"><div class="prv-flux">'
    +fx('Raisin', _pecRevF1(kgT/1000)+' t', (R.etat==='cons'?'pes\u00e9':('dont '+_pecRevF1(T.kgPese/1000)+' t pes\u00e9es')))+ar
    +fx('Vin du domaine', _pilNum(T.domHl)+' hL', (hlVendu>0.5?(_pilNum(hlVendu)+' hL de raisin vendu retir\u00e9s'):('\u00e0 '+_pilNum(R.kgHl)+' kg/hL')))+ar
    +fx('Apr\u00e8s \u00e9levage', _pilNum(hlEl)+' hL', '\u2212 '+_pecRevF1(R.pertes)+' %'+(R.pertesMes?' (mesur\u00e9es)':' (r\u00e9glage)'))+ar
    +fx('Bouteilles', (T.cols>0?_pilNum(T.cols):'\u2014'), '133 cols par hL')
    +'</div></div></div>';

  // ④ Ce que coûte une bouteille à la vigne
  var POS=[['mo','Main-d\u2019\u0153uvre vigne',_PEC_COL.mo],['trac','Conduite tracteur',_PEC_COL.trac],['gnr','Carburant GNR',_PEC_COL.gnr],['phy','Produits phyto',_PEC_COL.phy],['pre','Arrachage & prestations',_PEC_COL.pre]];
  var poT=0; POS.forEach(function(x){ poT+=T.po[x[0]]||0; });
  var bar='<div class="pec-bar" style="height:16px">'+POS.map(function(x){
    var v=T.po[x[0]]||0; return (poT>0&&v>0)?('<i style="width:'+(v/poT*100).toFixed(2)+'%;background:'+x[2]+'"></i>'):''; }).join('')+'</div>';
  var leg='<div class="pec-leg">'+POS.map(function(x){
    var v=(T.cols>0)?((T.po[x[0]]||0)/T.cols):null;
    return '<span class="pec-lg"><em style="background:'+x[2]+'"></em>'+x[1]+' <b>'+(v!=null?(_pecRevE2(v)+' \u20AC'):'\u2014')+'</b></span>'; }).join('')+'</div>';
  var comp='';
  if(R.autres>0 && T.cols>0 && T.eurCol!=null){
    comp='<div class="prv-complet"><div><div class="prv-cl">Co\u00fbt complet indicatif</div>'
      +'<div class="pec-cs">vigne '+_pecRevE2(T.eurCol)+' \u20AC + autres charges '+_ecoEur(R.autres)+' \u00f7 '+_pilNum(T.cols)+' cols</div></div>'
      +'<div class="prv-cv">'+_pecRevE2(T.eurCol+R.autres/T.cols)+' \u20AC</div></div>';
  }
  H+='<div class="pec-card"><div class="pec-ch"><div class="pec-ct">Ce que co\u00fbte une bouteille \u00e0 la vigne</div>'
    +'<div class="pec-cs pec-ci">'+_mvInfoBtn('pil.eco.revcout')+'</div></div>'
    +'<div class="pec-cb">'+bar+leg+comp
    +'<div class="pec-acts"><button class="pec-btn" data-pec="param"><span>'+_mvIcon('engrenage',16)+'</span> Hypothèses</button>'
    +'<button class="pec-btn" data-pec="cave" data-v="millesime"><span>'+_mvIcon('raisin',16)+'</span> Millésime en cave</button>'
    +'<button class="pec-btn" data-pec="sub" data-v="pos"><span>'+_mvIcon('boussole',16)+'</span> Coût de la campagne</button></div>'
    +'</div></div>';
  return H;
}

// AUJ-4 (§263) : la vue Économie du cockpit affiche CE contenu, tel quel (un seul moteur : _pecData).
window._pilTabEco=function(d){ return _pilTabEco(d); };
function _pilTabEco(d){
  _pecCss();
  var E=_pecData();
  if(!E.configured){
    return '<div class="pec-card"><div class="pec-verdict"><div class="em">'+_mvIcon('euro',24)+'</div><div>'
      +'<div class="t">Le pilotage \u00e9conomique n\u2019est pas encore branch\u00e9</div>'
      +'<div class="d">Deux donn\u00e9es suffisent \u00e0 tout d\u00e9clencher :<br>'
      +'\u2022 un <b>taux horaire</b> dans la fiche de chaque salari\u00e9 (<b>R\u00e9glages \u203A \u00c9quipe</b>) ;<br>'
      +'\u2022 le <b>prix du GNR</b>, saisi au prochain <b>appoint de cuve</b> (<b>Tracteur \u203A Entretien</b>).<br>'
      +'Le budget, le rythme de d\u00e9pense, le co\u00fbt par travail et le prix de revient en d\u00e9coulent tout seuls \u2014 rien d\u2019autre \u00e0 saisir. Ces deux donn\u00e9es sont r\u00e9serv\u00e9es aux administrateurs.</div>'
      +'<div class="pec-acts"><button class="pec-btn" data-pec="param"><span>'+_mvIcon('engrenage',16)+'</span> R\u00e9glages du module</button></div>'
      +'</div></div></div>';
  }
  // COHER-1 (§581) : la fin prévue des travaux, celle d'Aujourd'hui (_pilCk2Modele lit le même m.proj) — la projection s'y arrête.
  var _finIso=null; try{ var _mg=_pilMargeCalc(d); if(_mg && _mg.proj instanceof Date) _finIso=_pilPhotoIso(_mg.proj); }catch(e){ _finIso=null; if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilTabEco#fin'); }
  var TL=_pecTimeline(E, _finIso);
  var body;
  if(_PEC_SUB==='pos') body=_pecViewPostes(E);
  else if(_PEC_SUB==='par') body=_pecViewParcelles(E);
  else if(_PEC_SUB==='ach') body=_pachView();
  else if(_PEC_SUB==='exe') body=_pexView();
  else if(_PEC_SUB==='rev') body=_pecViewRevient();
  else body=_pecViewSynthese(E,TL);   // MOTS-1 (§582) : l'année (PIL-RANGE-2b, §444) est une des trois tuiles repliées de la Synthèse
  return '<div class="pec-wrap">'+_pecSubNav(E)+body+'</div>';   // MOTS-2 (§583) : plus d'avis de périmètre — chaque sous-vue nomme son cadre
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
// ★★★ COHER-1 (§581) — LES POINTS À RÉGLER DE LA CONFORMITÉ : UNE LISTE, DEUX LECTEURS.
//   La tuile « Conformité » d'Aujourd'hui et les tuiles de l'onglet lisent les MÊMES mentions, par les mêmes calculs
//   (_cfmCuivre, _regCarte, _iftCalc) : elles ne peuvent plus se contredire. Un point = ce qui manque avant un contrôle et
//   que l'onglet écrit sur une tuile : un plafond de cuivre dépassé, un registre qui n'est pas prêt (SIRET, lignes à
//   compléter, traitements sans date), un IFT qui ne se calcule pas faute de catalogue. N'en sont PAS : la vigilance cuivre
//   (sous le plafond), un délai de rentrée en cours (« À savoir » le dit), la protection restante (une lecture de saison).
//   Une tuile éteinte dans « Choisir les indicateurs » ne compte pas : la tuile d'Aujourd'hui ne dit que ce que l'onglet montre.
//   ⚠️ Les deux petites fonctions ci-dessous sont lues par les tuiles de l'onglet ET par la liste : changer la mention
//     d'une tuile, c'est changer le point. mv-harnais-coher1 joue les deux sur les mêmes données.
function _cfmRegPoint(V){
  if(!V||!V.nLignes) return null;
  if(!V.siretOk) return 'SIRET manquant';
  if(V.nManque) return V.nManque+' à compléter';
  if(V.sansDate) return V.sansDate+' sans date';
  return null;
}
function _cfmIftPoint(R){ return (R&&R.lignes&&!R.ok)?'catalogue E-Phy absent':null; }
function _pilCfmPoints(){
  var P=[], pt;
  if(_pilShow('cfm_cuivre')){
    var cu=_cfmCuivre();
    if(cu&&cu.avail&&cu.over) P.push({ id:'cuivre', court:String(cu.over), t:'Cuivre : plafond dépassé ('+cu.over+' parcelle'+(cu.over>1?'s':'')+')' });
  }
  if(_pilShow('mat_phyto') && typeof window._regCarte==='function'){
    var G=window._regCarte(); pt=G?_cfmRegPoint(G.V):null;
    if(pt) P.push({ id:'phyto', court:pt, t:'Registre : '+pt });
  }
  if(_pilShow('cfm_ift')){
    pt=_cfmIftPoint(_iftCalc(_iftAnnee()));
    if(pt) P.push({ id:'ift', court:pt, t:'IFT : catalogue E-Phy à charger' });
  }
  return P;
}
function _cfmIftRef(){ var c=(window.CONFIG&&window.CONFIG.conformite)||{}; var v=Number(c.ift_ref); return (isFinite(v)&&v>0)?{v:v,def:false}:{v:12,def:true}; }
// ════════════════════════════════════════════════════════════════════════
// ★★ IFT-1 (§571) — L'IFT RÉEL (plan IFT-1 ; maquette « niveau au-dessus », partie 5). Il remplace le compte des passages
//   (_cfmPassages, retirée) dans Conformité et sur la carte du domaine. La méthode est celle du guide du ministère (IFT, 2016) :
//   · un produit d'un traitement = dose appliquée ÷ dose de référence × part de la parcelle traitée — la surface traitée
//     saisie au traitement sur la surface de la parcelle (REG27-1A, §572, _iftPart). Deux produits dans la même cuve comptent chacun (« un mélange de deux produits
//     appliqués lors d'un même passage compte pour deux traitements »).
//   · dose de référence « à la culture » : la plus petite des doses homologuées de la vigne pour ce produit (usages E-Phy ;
//     la synchro en garde quatre au plus par produit — §571e). « À la cible » quand le traitement porte sa cible (`t.cible`,
//     que REG27-1 saisira) : la plus grande des doses de cette cible. Une dose à l'hectolitre se ramène à l'hectare sur
//     1 000 L de bouillie, comme le guide.
//   · sans dose de référence (produit hors du catalogue, retiré, unités qui ne se comparent pas) ou sans dose appliquée
//     lisible, le produit COMPTE 1 — la règle du guide — et l'écran dit combien.
//   · les adjuvants et les matières fertilisantes ne sont pas des produits phytopharmaceutiques : ils ne comptent pas.
//   · le biocontrôle se compte à part, reconnu à la SUBSTANCE (le type E-Phy range le soufre sous « Soufre », qui en est,
//     et le spinosad sous « Biocontrôle », qui n'en est pas — fiche biocontrôle vigne de l'IFV). La référence régionale se
//     compare à l'IFT HORS biocontrôle : c'est ainsi qu'elle est publiée.
//   · une parcelle additionne ses traitements de l'année ; le domaine, la moyenne de ses parcelles pondérée par leur surface
//     (vignes en place) — « surface traitée ÷ surface du domaine ».
//   L'ANNÉE est l'année civile, celle de la récolte que les traitements protègent — ni la période de travail (une « saison »
//   de printemps ferait un IFT de printemps), ni la campagne d'août à juillet (elle couperait les traitements d'août).
//   Tant que l'année neuve n'a aucun traitement, l'écran montre la précédente : en janvier, on cherche l'IFT de l'an passé.
// ════════════════════════════════════════════════════════════════════════
var IFT_BIO_RE=/(soufre|paraffine|carbonate de potassium|bicarbonate|phosphonate|kaolin|silicate d.?aluminium|laminarine|cos.?oga|cerevisane|orange|eugenol|geraniol|thymol|bacillus|trichoderma|beauveria|metschnikowia|aureobasidium|pythium|ampelomyces|coniothyrium|pseudomonas|metarhizium|dodecadien|dodecenyl|pheromon|equisetum|prele|maltodextrine|huile essentielle)/;
var IFT_PAS_BIO_RE=/(cuivr|bouillie bordelaise|spinosad|pyrethr|prohexadione)/;
var IFT_REDUITE=0.95, IFT_DOUTE=2;   // « à dose réduite » : 5 % sous la référence au moins ; « à vérifier » : plus du double
// Minuscules, sans accent, en ASCII : la décomposition NFD sépare l'accent de sa lettre, et tout ce qui n'est pas ASCII part
// (accents, apostrophe typographique, µ ; les espaces restent) ; le tiret demi-cadratin d'une fourchette devient un trait d'union d'abord.
function _iftNorm(s){ return String(s==null?'':s).toLowerCase().replace(/\u2013/g,'-').normalize('NFD').replace(/[^\s!-~]/g,''); }
function _iftCle(s){ return _iftNorm(s).replace(/[^a-z0-9]+/g,' ').trim(); }
// « 2,5 kg/ha », « 200 g/hL », « 0.16 L/ha » → { q: la quantité par hectare (kg, L, ou l'unité écrite), dim } ; null sinon.
// `max` : d'une fourchette « 3–5 kg/ha », la borne haute (une dose de référence) ; sans lui, une fourchette ne se lit pas
// (une dose appliquée est UNE dose).
function _iftQte(txt,max){
  var s=_iftNorm(txt).replace(/,/g,'.');
  var m=/(\d+(?:\.\d+)?)(?:\s*(?:-|a)\s*(\d+(?:\.\d+)?))?\s*([a-z]+)\s*\/\s*(ha|hl)\b/.exec(s);
  if(!m) return null;
  var v=parseFloat(m[1]);
  if(m[2]){ if(!max) return null; v=Math.max(v,parseFloat(m[2])); }
  if(!(v>0)) return null;
  var u=m[3], M={mg:1e-6,g:1e-3,kg:1,t:1000}, V={ml:1e-3,cl:1e-2,l:1,hl:100}, q, dim;
  if(M[u]!=null){ q=v*M[u]; dim='m'; } else if(V[u]!=null){ q=v*V[u]; dim='v'; } else { q=v; dim='u:'+u; }
  if(m[4]==='hl') q*=10;   // 1 000 L de bouillie à l'hectare
  return { q:q, dim:dim };
}
// La dose appliquée : la dose/ha saisie (structurée), sinon la dose écrite du registre.
function _iftDa(t){
  if(t && typeof t.dose_val==='number' && isFinite(t.dose_val) && t.dose_val>0){ var a=_iftQte(t.dose_val+' '+(t.dose_unit||'')); if(a) return a; }
  return _iftQte(t&&t.dose);
}
// La dose de référence, dans la dimension de la dose appliquée (une masse ne se compare pas à un volume).
function _iftDr(t,e,da){
  var us=(e&&e.usages)||[], cib=_iftCle(t&&t.cible), best=null;
  if(cib){
    us.forEach(function(u){ if(_iftCle(u&&u.cible).indexOf(cib)<0) return; var r=_iftQte(u.dose,true); if(r&&r.dim===da.dim&&(!best||r.q>best.q)) best=r; });
    if(best) return { q:best.q, cible:true };
  }
  us.forEach(function(u){ var r=_iftQte(u&&u.dose,true); if(r&&r.dim===da.dim&&(!best||r.q<best.q)) best=r; });
  return best?{ q:best.q, cible:false }:null;
}
// Le catalogue E-Phy indexé une fois par calcul : par AMM, puis par nom.
function _iftIdx(){
  var E=window.EPHY||[], a={}, n={};
  E.forEach(function(e){ if(!e) return; var am=String(e.amm||'').trim(), k=_iftCle(e.nom); if(am&&!a[am]) a[am]=e; if(k&&!n[k]) n[k]=e; });
  return { ok:E.length>0, amm:a, nom:n };
}
// Une ligne du registre (un produit d'un traitement) → { compte:false } (adjuvant, engrais) ou
// { compte, r : dose appliquée ÷ dose de référence (1 si l'une manque), un : compté 1, bio, cible, doute }.
function _iftLigne(t,X){
  var am=String((t&&t.amm)||'').trim(), e=(am&&X.amm[am])||X.nom[_iftCle(t&&t.produit)]||null;
  var type=_iftNorm((t&&t.type)||(e&&e.type)||'');
  if(type==='adjuvant'||type==='mfsc') return { compte:false };
  var c=(window.CATALOGUE||[]).find(function(x){ return x&&t&&x.nom===t.produit; })||null;
  var sub=_iftNorm([(t&&t.sub)||'',(e&&e.sub)||'',(c&&c.usage)||''].join(' '));
  var bio=IFT_PAS_BIO_RE.test(sub)?false:(IFT_BIO_RE.test(sub)||type==='soufre'||type==='biocontrole');
  var da=_iftDa(t), dr=(da&&e)?_iftDr(t,e,da):null;
  if(!da||!dr) return { compte:true, r:1, un:true, bio:bio, cible:false, doute:false };
  var r=da.q/dr.q;
  return { compte:true, r:r, un:false, bio:bio, cible:dr.cible, doute:r>IFT_DOUTE };
}
function _iftAnDe(t){ var s=String((t&&t.date)||'').slice(0,4); return /^\d{4}$/.test(s)?parseInt(s,10):null; }
function _iftAnnee(){
  var y=new Date().getFullYear(), a={};
  (window.TRAITEMENTS||[]).forEach(function(t){ var k=_iftAnDe(t); if(k) a[k]=1; });
  return (a[y]||!a[y-1])?y:y-1;
}
function _iftParcs(t){ var a=t&&t.parcelles; if(typeof a==='string') return a?[a]:[]; return Object.prototype.toString.call(a)==='[object Array]'?a:[]; }
// La part traitée d'une parcelle (REG27-1A, §572) : la surface traitée (window._mvSurfT, utils.js) sur sa surface ; 1 sans
// surface connue, ou sans utils.js de ce lot — la parcelle entière, comme avant.
function _iftPart(t,q){ if(!(q.surf>0)||typeof window._mvSurfT!=='function') return 1; var v=window._mvSurfT(t,q.nom,q.surf); return (v>=0&&v<q.surf)?v/q.surf:1; }
// L'IFT d'une année : le domaine (hors biocontrôle, biocontrôle, total), les passages, et chaque parcelle en place.
function _iftCalc(an){
  var X=_iftIdx(), par={}, surfTot=0;
  (window.PARCELLES||[]).forEach(function(p){
    if(!p||p.statut==='Arrachee'||par[p.nom]) return;
    var s=parseFloat(String(p.surface==null?'':p.surface).replace(',','.'))||0; if(s>0) surfTot+=s;
    par[p.nom]={ nom:p.nom, surf:s, hb:0, bio:0, pass:{}, un:0, n:0 };
  });
  var R={ an:an, ok:X.ok, ref:_cfmIftRef(), lignes:0, un:0, doute:0, cible:0, horsParc:0, pass:{}, red:{}, surfTot:surfTot };
  (window.TRAITEMENTS||[]).forEach(function(t){
    if(!t||_iftAnDe(t)!==an) return;
    var L=_iftLigne(t,X); if(!L.compte) return;
    R.lignes++; if(L.un) R.un++; if(L.doute) R.doute++; if(L.cible) R.cible++;
    var sid=t.sessionId||('__'+(t.date||'')), vu=false;
    R.pass[sid]=1; if(!L.un&&L.r<IFT_REDUITE) R.red[sid]=1;
    // ★ REG27-1A (§572) : une parcelle traitée en partie compte pour sa part (surface traitée ÷ surface de la parcelle).
    _iftParcs(t).forEach(function(nom){ var q=par[nom]; if(!q) return; vu=true; var w=_iftPart(t,q); if(L.bio) q.bio+=L.r*w; else q.hb+=L.r*w; q.pass[sid]=1; if(L.un) q.un++; });
    if(!vu) R.horsParc++;
  });
  var sHb=0, sBio=0;
  R.rows=Object.keys(par).map(function(k){ var q=par[k]; q.n=Object.keys(q.pass).length; if(q.surf>0){ sHb+=q.hb*q.surf; sBio+=q.bio*q.surf; } return q; })
    .sort(function(a,b){ return (b.hb-a.hb)||(b.bio-a.bio)||String(a.nom).localeCompare(String(b.nom)); });
  R.hb=surfTot>0?sHb/surfTot:null; R.bio=surfTot>0?sBio/surfTot:null; R.tot=(R.hb!=null)?R.hb+R.bio:null;
  R.nPass=Object.keys(R.pass).length; R.nRed=Object.keys(R.red).length;
  return R;
}
function _iftF(v){ return (Math.round((Number(v)||0)*10)/10).toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1}); }
function _iftCol(v,ref){ var r=ref>0?v/ref:0; return r>1.25?'--rouge':(r>1?'--orange':'--vert-med'); }
// Une parcelle : son IFT hors biocontrôle face à la référence, ses passages, son biocontrôle, ses produits comptés 1, et les
// maladies signalées cette année (OBS-1 : la maquette lit « les trois premières sont celles où l'oïdium a été signalé »).
function _pilIftLigne(q,ref,mal){
  var col=_iftCol(q.hb,ref), pct=ref>0?Math.min(q.hb/ref*100,100):0;
  var s=q.n?(q.n+' passage'+(q.n>1?'s':'')):'aucun traitement';
  if(q.bio>0) s+=' · + '+_iftF(q.bio)+' en biocontrôle';
  if(q.un) s+=' · '+q.un+' produit'+(q.un>1?'s':'')+' compté'+(q.un>1?'s':'')+' 1';
  if(mal&&mal.length) s+=' · '+mal.join(', ')+' signalé'+(mal.length>1?'s':'');
  return '<div class="pil-li"><span class="pil-av" style="background:#1E3418;color:#8FD07A">🌿</span>'
    +'<div class="pil-li-main"><div class="pil-li-t">'+_pilEsc(q.nom)+(q.surf>0?' <span style="color:var(--texte-doux);font-weight:500">· '+_pilHa(q.surf)+' ha</span>':'')+'</div>'
    +'<div class="pil-gbar" style="margin-top:6px"><i style="width:'+pct.toFixed(0)+'%;background:var('+col+')"></i></div>'
    +'<div class="pil-li-s" style="margin-top:3px;white-space:normal">'+_pilEsc(s)+'</div></div>'
    +'<div class="pil-li-r" style="color:var('+col+')">'+_iftF(q.hb)+'</div></div>';
}
// La carte « IFT <année> » : le domaine (hors biocontrôle en tête, face à la référence), les passages, l'année d'avant,
// ce qui est compté 1 ou à vérifier, puis les cinq parcelles les plus hautes (les autres derrière un dépliant).
function _pilIftTuile(){
  var an=_iftAnnee(), R=_iftCalc(an), ref=R.ref, rv=ref.v;
  var methode='<div class="pil-li-s" style="margin-top:12px;white-space:normal;line-height:1.5">Dose appliquée ÷ dose homologuée × surface traitée ÷ surface du domaine · le biocontrôle à part</div>';
  if(!R.lignes){
    return _pilTile('ift','#3D6B27','IFT '+an, _pilStat('0',''), 'aucun traitement en '+an, null,
      '<div class="pil-empty">Aucun traitement enregistré en '+an+'. L’IFT se calcule dès le premier, avec la dose du registre et la dose homologuée du catalogue E-Phy.</div>'+methode, 'pil.cfm.ift');
  }
  if(!R.ok){
    return _pilTile('ift','#3D6B27','IFT '+an, _pilStat('—',''), R.nPass+' passage'+(R.nPass>1?'s':'')+' en '+an+' · '+_cfmIftPoint(R), null,   // COHER-1 (§581)
      '<div class="pil-empty">Le catalogue E-Phy n’est pas chargé sur cet appareil\u00a0: sans les doses homologuées, l’IFT ne se calcule pas. Il se charge à la connexion — rouvrez cet onglet une fois en ligne.</div>'+methode, 'pil.cfm.ift');
  }
  // Le chiffre hors biocontrôle est celui de l'en-tête, toujours visible : le détail donne les trois autres.
  //   ⚠️ La mise en page est écrite ici : styles.css est à quelques octets du plafond de 1 024 ko (mv-harnais-typo) ; seuls les
  //   rôles du chiffre et de son étiquette (`.pil-ift-k .v`, `.pil-ift-k .l`) entrent au gabarit (GABARIT-1).
  var hb=R.hb, k=function(v,l){ return '<div class="pil-ift-k"><div class="v">'+v+'</div><div class="l" style="color:var(--texte-doux);margin-top:2px">'+l+'</div></div>'; };
  var B='<div style="display:flex;flex-wrap:wrap;gap:12px 20px;align-items:flex-end;margin-bottom:12px">'+k(R.bio!=null?_iftF(R.bio):'—','biocontrôle')+k(R.tot!=null?_iftF(R.tot):'—','total')
    +k(_iftF(rv),ref.def?'référence, à régler':'référence régionale')+'</div>';
  var l1=[];
  if(hb!=null){
    B+='<div class="pil-gbar"><i style="width:'+Math.min(rv>0?hb/rv*100:0,100).toFixed(0)+'%;background:var('+_iftCol(hb,rv)+')"></i></div>';
    var ec=Math.round((hb/rv-1)*100);
    l1.push('hors biocontrôle\u00a0: '+(ec<0?((-ec)+' % sous la référence'):(ec>0?(ec+' % au-dessus de la référence'):'à la référence')));
  } else l1.push('surfaces des parcelles à renseigner\u00a0: l’IFT du domaine se pondère par elles');
  l1.push(R.nPass+' passage'+(R.nPass>1?'s':'')+(R.nRed?(', dont '+R.nRed+' à dose réduite'):''));
  var Pv=_iftCalc(an-1); if(Pv.lignes&&Pv.hb!=null) l1.push((an-1)+'\u00a0: '+_iftF(Pv.hb));
  B+='<div class="pil-li-s" style="margin-top:8px;white-space:normal;line-height:1.5">'+_pilEsc(l1.join(' · '))+'</div>';
  var w=[];
  if(R.un) w.push(R.un+' produit'+(R.un>1?'s':'')+' compté'+(R.un>1?'s':'')+' 1\u00a0: dose appliquée ou homologuée inconnue');
  if(R.doute) w.push(R.doute+' dose'+(R.doute>1?'s':'')+' à vérifier\u00a0: plus du double de l’homologuée');
  if(R.horsParc) w.push(R.horsParc+' ligne'+(R.horsParc>1?'s':'')+' sur une parcelle absente de la liste, hors du calcul');
  if(w.length) B+='<div class="pil-li-s" style="margin-top:4px;white-space:normal;line-height:1.5;color:var(--orange)">'+_mvIcon('alerte',16)+' '+_pilEsc(w.join(' · '))+'</div>';
  var mal=(typeof window._obsMaladies==='function'&&an===new Date().getFullYear())?window._obsMaladies:null;
  var lig=function(q){ return _pilIftLigne(q,rv,mal?mal(q.nom):null); }, top=R.rows.slice(0,5), rest=R.rows.slice(5);
  B+='<div class="pil-li-t" style="margin-top:16px">Par parcelle</div>'
    +'<div class="pil-li-s" style="margin-bottom:8px;white-space:normal">hors biocontrôle'+(rest.length?' — les cinq IFT les plus hauts':'')+'</div>'
    +'<div class="pil-ip-list">'+top.map(lig).join('')+'</div>';
  if(rest.length) B+='<details class="pil-ift-plus" style="margin-top:4px"><summary style="cursor:pointer;padding:12px 0;font-size:var(--t-texte);font-weight:600;color:var(--texte)">'
    +(rest.length>1?('Les '+rest.length+' autres parcelles'):'L’autre parcelle')+'</summary><div class="pil-ip-list">'+rest.map(lig).join('')+'</div></details>';
  var warn=(hb!=null&&hb>rv)?('↑ '+Math.round((hb/rv-1)*100)+' %'):null;
  return _pilTile('ift','#3D6B27','IFT '+an, _pilStat(hb!=null?_iftF(hb):'—',' hors biocontrôle',warn),
    'biocontrôle '+(R.bio!=null?_iftF(R.bio):'—')+' · référence '+_iftF(rv)+(ref.def?' (par défaut)':''), null, B+methode, 'pil.cfm.ift');
}
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
  // PRO-1 (§269) : la protection restante des parcelles vivait dans l'ancien Aujourd'hui ; REF-1 l'avait fait
  //   disparaître de tout l'écran. Elle rejoint la Conformité, avec le cuivre et le délai de rentrée.
  if(_pilShow('auj_traiter')){ var _pcar=_pilProtCarte(); if(_pcar){ H+=_pcar; any=true; } }
  // Cuivre
  if(_pilShow('cfm_cuivre')){
    any=true;
    var cu=_cfmCuivre();
    if(!cu.avail){
      H+=_pilTile('cuivre','#5B8DBF','Cuivre \u00b7 bio', _pilStat('\u2014',''), null, null, '<div class="pil-empty">Synth\u00e8se cuivre indisponible.</div>');
    } else if(!cu.rows.length){
      H+=_pilTile('cuivre','#5B8DBF','Cuivre \u00b7 bio (7 ans)', _pilStat('0',' apport'), null, null, '<div class="pil-empty">Aucun apport de cuivre enregistr\u00e9. Le suivi se remplit avec les traitements \u00e0 base de cuivre.</div>');
    } else {
      var crows=cu.rows.map(function(r){
        var col=_cfmCuCol(r.ratio), pct=Math.min(r.ratio*100,100);
        var st=r.ratio>1?'D\u00e9passement':r.ratio>=0.875?'Vigilance':'Conforme';
        return '<div class="pil-li"><span class="pil-av" style="background:var('+col+');color:#fff;font-size:var(--pt-micro,12px)">Cu</span>'
          +'<div class="pil-li-main"><div class="pil-li-t">'+_pilEsc(r.nom)+' <span style="color:var(--texte-doux);font-weight:500">\u00b7 '+_pilHa(r.surf)+' ha</span></div>'
          +'<div class="pil-gbar" style="margin-top:6px"><i style="width:'+pct.toFixed(0)+'%;background:var('+col+')"></i></div>'
          +'<div class="pil-li-s" style="color:var('+col+');font-weight:600;margin-top:3px">'+st+' \u00b7 '+(r.ratio*100).toFixed(0)+' % du plafond</div></div>'
          +'<div class="pil-li-r" style="color:var('+col+')">'+(Math.round(r.cu*10)/10).toLocaleString('fr-FR')+'<span style="font-size:var(--pt-lbl,12px);font-weight:500;color:var(--texte-doux)"> kg/ha</span></div></div>';
      }).join('');
      var body='<div class="pil-ip-list">'+crows+'</div>'
        +'<div class="pil-li-s" style="margin-top:10px;line-height:1.5"><b>Cuivre m\u00e9tal</b> sur 7 ans glissants \u00b7 plafond UE <b>28 kg/ha</b>'+(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.cfm.cuivre')):'')+'</div>';
      var sw=cu.over?(_mvIcon('alerte',16)+' '+cu.over):(cu.warn?('\u2191 '+cu.warn):null);
      H+=_pilTile('cuivre','#5B8DBF','Cuivre \u00b7 bio (7 ans)', _pilStat(cu.rows.length,' parcelle'+(cu.rows.length>1?'s':''), sw), null, null, body);
    }
  }
  // \u2605\u2605 IFT-1 (\u00a7571) : l'IFT r\u00e9el de l'ann\u00e9e remplace le compte des passages \u2014 m\u00eame case \u00e0 cocher (`cfm_ift`), m\u00eame pastille \u00ab i \u00bb.
  if(_pilShow('cfm_ift')){ any=true; H+=_pilIftTuile(); }
  // \u2605\u2605 LE REGISTRE PHYTO EST UNE PIECE DE CONFORMITE, PAS DE MATERIEL.
  //   Il vivait sous \u00ab L'equipe & le materiel \u00bb, a cote du parc de tracteurs. Or
  //   il lit LES MEMES traitements que la carte de l'IFT juste
  //   au-dessus : l'une les agrege par parcelle, l'autre en montre les derniers.
  //   Une source, deux onglets. Il se range ici, en detail de son propre agregat.
  //   \u26a0\ufe0f LA CLE `mat_phyto` NE CHANGE PAS. Elle est gravee dans le localStorage
  //     des clients : la renommer rallumerait la carte chez qui l'avait eteinte.
  //     On deplace un rendu et une etiquette ; on ne renumerote rien en base.
  if(_pilShow('mat_phyto')){ any=true; H+=_pilPanelPhyto(d); }
  // DRE
  if(_pilShow('cfm_dre')){
    any=true;
    var dre=_cfmDre();
    if(dre.none){
      H+=_pilTile('dre','#B85A1A','D\u00e9lai de rentr\u00e9e (DRE)', _pilStat('\u2014',''), null, null, '<div class="pil-empty">Aucun traitement enregistr\u00e9.</div>');
    } else if(!dre.active.length){
      H+=_pilTile('dre','#5B9B3A','D\u00e9lai de rentr\u00e9e (DRE)', _pilStat('0',' actif'), 'aucune parcelle en d\u00e9lai', null, '<div class="pil-empty" style="color:var(--vert-med);font-style:normal">\u2705 Aucun d\u00e9lai de rentr\u00e9e en cours \u2014 toutes les parcelles sont accessibles.</div>');
    } else {
      var drows=dre.active.map(function(a){
        var urg=a.remainH<=2, col=urg?'--rouge':'--orange';
        return '<div class="pil-li"><span class="pil-av" style="background:var('+col+');color:#fff">\u26D4</span>'
          +'<div class="pil-li-main"><div class="pil-li-t">'+_pilEsc(a.nom)+'</div>'
          +'<div class="pil-li-s" style="color:var('+col+');font-weight:600">Rentr\u00e9e interdite encore '+a.remainH+' h \u00b7 jusqu\u2019\u00e0 '+_cfmDreEnd(a.endMs)+'</div>'
          +'<div class="pil-li-s">'+_pilEsc(a.produit||'traitement')+' \u00b7 DRE '+a.dreH+' h ('+_pilDfr(a.date)+')</div></div></div>';
      }).join('');
      var body3='<div class="pil-ip-list">'+drows+'</div>'
        +'<div class="pil-li-s" style="margin-top:10px;line-height:1.5"><b>Ne pas p\u00e9n\u00e9trer la parcelle sans \u00e9quipement avant l\u2019heure indiqu\u00e9e.</b>'+(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.cfm.dre')):'')+'</div>';
      H+=_pilTile('dre','#B85A1A','D\u00e9lai de rentr\u00e9e (DRE)', _pilStat(dre.active.length,' parcelle'+(dre.active.length>1?'s':''),'actif'), null, null, body3);
    }
  }
  H+='</div>';
  return any ? H : '<div class="pil-empty">Aucun indicateur affich\u00e9 \u2014 activez-les via \u00ab Choisir les indicateurs \u00bb.</div>';
}


// ── Personnalisation PAR ONGLET (visibilité des tuiles) ──
// ★ PIL-RANGE-4a (§446) : une case = un lecteur. Aujourd'hui ne propose plus que ce que le cockpit v2 lit (la vue Cave,
//   ses points dans « À savoir ») ; la tension par personne se règle dans Équipe, la protection dans Conformité (là où elles
//   s'affichent, mêmes clés : les choix mémorisés restent). Toute case doit aussi figurer aux défauts (_pilNormalize purge le reste).
var _PIL_PERSO_DEFS={
  auj:[['auj_cave','La Cave \u2014 la vue de la bascule Terrain / Cave / Économie'],['auj_cave_sv','Les points de cave dans « À savoir »']],
  // MOTS-8 (§590) : les noms des cartes de Travaux
  avc:[['avc_bar','Avancement'],['avc_pie','La charge par tâche'],['avc_temps','Le temps de l\'équipe'],['avc_echeances','Échéances'],['avc_carte','Carte du domaine']],
  // MOTS-9 (§592) : les noms des cartes de L'équipe & le matériel (en commentaire au-dessus : la ligne doit finir par « ]], »)
  equ:[['prs_equipe','Équipe'],['prs_presences','Présents'],['prs_capacite','Équipe au pic'],['auj_tension','Tension'],['an_frise','Renfort'],['mat_tracteur','Tracteurs'],['mat_gnr','Cuve GNR'],['mat_conso','Consommation'],['mat_travaux','Travaux tracteur en cours']],
  eco:[['an_budget','Le budget de l\'ann\u00e9e']],
  sim:[['sim_ordre','La tournée du jour'],['sim_etsi','Qui fait quoi'],['sim_cout','Renfort : combien et quand']],
  cfm:[['auj_traiter','Protection restante (fenêtre de traitement)'],['cfm_cuivre','Cuivre (bio · 7 ans)'],['cfm_ift','IFT de l’année (fréquence de traitement)'],['mat_phyto','Le registre de l’année (vérifié avant l’export)'],['cfm_dre','Délai de rentrée (DRE)']]
};
function _pilPersoHtml(tab){
  var defs=_PIL_PERSO_DEFS[tab]; if(!defs) return '';
  return '<h3>Afficher dans cet onglet — réglage propre à chaque onglet, mémorisé pour vous</h3><div class="pil-opts">'
    +defs.map(function(o){ return '<label><input type="checkbox" class="pil-sw" data-show="'+o[0]+'"'+(_pilShow(o[0])?' checked':'')+'> '+_pilEsc(o[1])+'</label>'; }).join('')
    +'</div><div class="pil-perso-note">Décochez pour retirer une tuile. \uD83D\uDD12 Lecture seule — n\'affecte que votre affichage.</div>';
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
  /* ★ AXE-1 : le repli lit le meme reglage que la source, jamais 8 en dur. */
  var md=_arcCampMois()+1;
  var p=String(iso).split('-'); return (+p[1]>=md)?(+p[0]):(+p[0]-1);
}
// ★★ AXE-1 — LES BORNES D'UNE CAMPAGNE, EN UN SEUL ENDROIT DANS CE FICHIER.
// Elles etaient recopiees en dur trois fois ('-08-01' / '-07-31') : l'offset de
// _pilCmpOffset, la frise d'_arcLigne et l'echelle de _pilTabArc. Le jour ou le
// mois d'ouverture devient un reglage, trois copies en dur, c'est trois ecrans
// qui se contredisent — et une frise decalee ne LEVE AUCUNE ALARME.
function _arcCampMois(){
  if(typeof window._mvCampagneMois==='function'){ try{ return window._mvCampagneMois(); }
    catch(e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'axe campagne illisible \u2014 repli sur le defaut'}); } }
  var v=parseInt(((window.CONFIG&&window.CONFIG.eco)||{}).campagne_mois,10);
  return (isNaN(v)||v<0||v>11)?7:v;
}
function _arcBornes(an){
  if(typeof window._mvCampagneBornes==='function'){
    try{ var b=window._mvCampagneBornes(an); if(b&&b.d0&&b.d1) return b; }
    catch(e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'bornes de campagne illisibles \u2014 repli 1er aout'}); }
  }
  return {an:an, d0:an+'-08-01', d1:(an+1)+'-07-31', court:an+'\u2013'+(an+1),
          lbl:'1\u1D49\u02B3 ao\u00fbt '+an+' \u2192 31 juillet '+(an+1)};
}
// Heures d'une periode = celles figees dans l'instantane pris a la cloture. Une periode jamais
// cloturee n'en a pas : elle se voit sur la frise, elle ne compte pas d'heures.
function _arcHeures(nom){
  var h=(window.HISTORIQUE||[]).find(function(x){ return x&&x.saisonNom===nom; });
  return (h&&h.stats&&h.stats.hFaites)||0;
}
// MOTS-4 (§585) : la ligne ne porte plus que ses années et ses barres. Le nom d'une campagne, ses dates et ses heures sont dans
//   la bulle (_arcBulle) : au survol sur ordinateur, au toucher sur téléphone — demandé par Nico sur la maquette (16/11).
//   Une barre est un BOUTON (clavier, lecteur d'écran : son nom est dans aria-label) de 36 px de haut ; le trait coloré est dedans.
function _arcJour(iso){ var m=_pecIsoToMs(String(iso||'').slice(0,10)); return (m===null)?'':_pecJourCourt(m); }
function _arcLigne(an,list,cur){
  var _b=_arcBornes(an), a=_arcN(_b.d0), b=_arcN(_b.d1);   /* ★ AXE-1 */
  var pc=function(d){ return Math.max(0,Math.min(100,(_arcN(d)-a)/(b-a)*100)); };
  var col=window._cmpCouleur||function(){ return '#8A5A38'; };
  var today=_mvToday();
  var segs=list.slice().sort(function(x,y){ return String(x.debut).localeCompare(String(y.debut)); })
    .map(function(s){
      var x=pc(s.debut), w=pc(s.fin)-x; if(w<=0) w=1;
      var hh=_arcHeures(s.nom), enc=(today>=s.debut && today<=s.fin);
      var dd=_arcJour(s.debut)+' → '+_arcJour(s.fin)+(enc?' · en cours':(hh>0?(' · '+_pilHa(hh)+' h'):''));
      return '<button type="button" class="arc-seg" data-n="'+_pilEsc(s.nom)+'" data-d="'+_pilEsc(dd)+'" aria-label="'+_pilEsc(s.nom+', '+dd)+'"'
        +' style="left:'+x+'%;width:'+w+'%"><i style="background:'+col(s)+'"></i></button>';
    }).join('');
  if(today>=_arcISO(a)&&today<=_arcISO(b)) segs+='<span class="arc-today" style="left:'+pc(today)+'%"></span>';
  return '<div class="arc-row'+(cur?' cur':' old')+'"><span class="y">'+_pilEsc(_b.court||(an+'–'+(an+1)))+'</span>'   /* ★ AXE-1 */
    +'<span class="arc-trk">'+segs+'</span></div>';
}
// La bulle de la frise : le nom et les dates de la barre visée, posée au-dessus d'elle et tenue dans la carte.
var _ARC_FIXE=null;   // la barre touchée : sa bulle reste jusqu'au toucher suivant
function _arcBulle(seg){
  var fr=document.getElementById('arc-frise'), bul=document.getElementById('arc-bul'); if(!fr||!bul) return;
  [].forEach.call(fr.querySelectorAll('.arc-seg.sel'), function(x){ x.classList.remove('sel'); });
  if(!seg || !fr.contains(seg)){ bul.hidden=true; return; }
  seg.classList.add('sel');
  bul.innerHTML='<b></b><span></span>';
  bul.firstChild.textContent=seg.getAttribute('data-n')||''; bul.lastChild.textContent=seg.getAttribute('data-d')||'';
  bul.hidden=false;
  var rf=fr.getBoundingClientRect(), rb=seg.getBoundingClientRect(), w=bul.offsetWidth;
  var cx=rb.left+rb.width/2-rf.left, x=Math.max(w/2+4, Math.min(rf.width-w/2-4, cx));
  bul.style.left=x+'px'; bul.style.top=(rb.top-rf.top+10)+'px';
  bul.style.setProperty('--fl', Math.max(8,Math.min(92,50+(cx-x)/Math.max(1,w)*100))+'%');
}
// ═════════════════════════════════════════════════════════════════
// ★★ ARCH-2 (26/09/2026) — LE BILAN PAR ANNÉE, CALCULÉ À PARTIR DES ARCHIVES DE CAMPAGNE
// Décision de Nico : une archive par campagne (la photo, ARCH-1) + une archive
// annuelle qui regroupe les campagnes de l'année — année vigne OU exercice
// comptable, au choix du domaine. L'annuel n'est JAMAIS recopié : une seconde
// copie ferait revenir la duplication que ARCH-1 a supprimée (§178).
//   · Cadre : CONFIG.eco.archive_cadre ('vigne' par défaut | 'exercice'), réglé
//     par l'admin. Bornes lues aux sources uniques : _mvCampagneBornes
//     (campagne_mois) et _mvExerciceAn (exercice_mois) — utils.js.
//   · Interventions et sessions : datées une à une -> rangées dans leur année.
//   · Heures : totalisées par tâche pour la campagne entière, SANS date dans
//     l'archive. Campagne dans une seule année -> tout va à cette année. Campagne
//     à cheval (possible seulement si le cadre ne suit pas les campagnes, ex.
//     exercice janvier -> décembre) -> réparties au prorata de ses interventions
//     datées dans chaque année ; à défaut d'intervention, au prorata des jours.
//     La carte le dit (« dont X h réparties »).
//   · Archives d'avant ARCH-1 : chacune portait TOUT le journal. On ne garde que
//     les entrées de SA campagne (_saisonForDate) et on dédoublonne par id : une
//     intervention n'est jamais comptée deux fois.
// ═════════════════════════════════════════════════════════════════
function _arcCadre(){
  var v=((window.CONFIG&&window.CONFIG.eco)||{}).archive_cadre;
  return v==='exercice'?'exercice':'vigne';
}
function _arcAnDe(cadre, iso){
  if(cadre==='exercice' && typeof window._mvExercice==='function'){
    try{ return window._mvExercice(String(iso).slice(0,10)).an; }
    catch(e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'exercice illisible \u2014 repli sur l\u2019ann\u00e9e vigne'}); }
  }
  return _arcCampagneDe(String(iso).slice(0,10));
}
function _arcAnBornes(cadre, an){
  if(cadre==='exercice' && typeof window._mvExerciceAn==='function'){
    try{ var b=window._mvExerciceAn(an); if(b&&b.d0&&b.d1) return b; }
    catch(e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'bornes d\u2019exercice illisibles'}); }
  }
  return _arcBornes(an);
}
function _arcAnnees(cadre){
  var H=window.HISTORIQUE||[], S=window.SAISONS||[], par={}, vus={};
  var sfd=(typeof window._saisonForDate==='function')?window._saisonForDate:null;
  function an(k){ return par[k]||(par[k]={an:k, campagnes:[], h:0, hRep:0, inter:0, parc:{}, sess:0, taches:{}}); }
  function camp(A,nom){ if(A.campagnes.indexOf(nom)<0) A.campagnes.push(nom); }
  H.forEach(function(h){
    if(!h||!h.saisonNom) return;
    var sa=S.find(function(x){ return x&&x.nom===h.saisonNom; });
    var datee=!!(sa&&sa.debut&&sa.fin);
    var J=(h.journal||[]).filter(function(j){
      if(!j||j.meteo||!j.date) return false;
      if(datee && sfd && sfd(String(j.date).slice(0,10))!==h.saisonNom) return false;
      if(j.id){ if(vus['j'+j.id]) return false; vus['j'+j.id]=1; }
      return true;
    });
    var Ss=(h.sessions||[]).filter(function(x){
      if(!x) return false;
      var d=x.date?String(x.date).slice(0,10):'';
      if(datee && sfd && d && sfd(d)!==h.saisonNom) return false;
      if(datee && !d && x.saison && x.saison!==h.saisonNom) return false;
      if(x.id){ if(vus['s'+x.id]) return false; vus['s'+x.id]=1; }
      return true;
    });
    var dates=J.map(function(j){ return String(j.date).slice(0,10); }).sort();
    var d0=datee?sa.debut:(dates[0]||String(h.archivedAt||'').slice(0,10));
    var d1=datee?sa.fin:(dates[dates.length-1]||d0);
    if(!d0) return;
    var a0=_arcAnDe(cadre,d0), a1=_arcAnDe(cadre,d1), parts={};
    if(a0===a1) parts[a0]=1;
    else {
      J.forEach(function(j){ var k=_arcAnDe(cadre,j.date); parts[k]=(parts[k]||0)+1; });
      if(!J.length){
        for(var k=a0;k<=a1;k++){
          var b=_arcAnBornes(cadre,k);
          var x0=(d0>b.d0)?d0:b.d0, x1=(d1<b.d1)?d1:b.d1;
          var dj=_arcN(x1)-_arcN(x0)+1; if(dj>0) parts[k]=dj;
        }
      }
      var tot=Object.keys(parts).reduce(function(n,k){ return n+parts[k]; },0)||1;
      Object.keys(parts).forEach(function(k){ parts[k]=parts[k]/tot; });
    }
    var hT=Number(h.stats&&h.stats.hFaites)||0, TS=(h.stats&&h.stats.tachesStats)||[];
    Object.keys(parts).forEach(function(k){
      var A=an(+k), w=parts[k];
      camp(A,h.saisonNom);
      A.h+=hT*w; if(w<1) A.hRep+=hT*w;
      TS.forEach(function(t){ if(t&&t.nom&&Number(t.h_done)) A.taches[t.nom]=(A.taches[t.nom]||0)+Number(t.h_done)*w; });
    });
    J.forEach(function(j){
      var A=an(_arcAnDe(cadre,j.date)); A.inter++; camp(A,h.saisonNom);
      if(j.parcelle && j.parcelle!=='Domaine') A.parc[j.parcelle]=1;
    });
    Ss.forEach(function(x){ var A=an(_arcAnDe(cadre, x.date?String(x.date).slice(0,10):d1)); A.sess++; });
  });
  var cur=_arcAnDe(cadre,_mvToday()); an(cur);
  return Object.keys(par).map(Number).sort(function(a,b){ return b-a; }).map(function(k){
    var A=par[k];
    A.bornes=_arcAnBornes(cadre,k); A.enCours=(k===cur); A.nParc=Object.keys(A.parc).length;
    A.top=Object.keys(A.taches).map(function(n){ return {nom:n,h:A.taches[n]}; }).sort(function(a,b){ return b.h-a.h; });
    return A;
  });
}
function _arcBlocAnnuel(){
  var cadre=_arcCadre(), L=_arcAnnees(cadre);
  var adm=(typeof window.isAdmin==='function' && window.isAdmin());
  var opt=function(v,lbl){
    var on=(v===cadre)?' on':'';
    /* data-v + lecture dans le gestionnaire : aucune valeur interpolee dans le JS (C24b). */
    return adm ? '<button class="'+on.trim()+'" data-v="'+v+'" onclick="window._arcSetCadre&&window._arcSetCadre(this.getAttribute(\'data-v\'))">'+lbl+'</button>'
               : '<span class="'+on.trim()+'">'+lbl+'</span>';
  };
  // MOTS-4 (§585) : « Calculé à partir des archives de campagne… », « Le cadre est choisi par l'administrateur » et
  //   « Aucune campagne close cette année. Le bilan se remplit à chaque clôture. » sont dans la fiche pil.arc.bilan.
  //   Une année sans clôture n'affiche que son nom ; les dates d'une année ne s'écrivent que si le cadre n'est pas celui de la frise.
  var EC='<span class="pec-pill" style="background:var(--gris-clair);color:var(--texte-med)">en cours</span>';
  var h='<div class="pec-card arcan"><div class="pec-ch"><div class="pec-ct">Bilan par année</div>'
    +'<div class="pec-cs pec-ci">'+(typeof _mvInfoBtn==='function'?_mvInfoBtn('pil.arc.bilan'):'')+'</div>'
    +'<div class="arcan-seg">'+opt('vigne','Année vigne')+opt('exercice','Exercice')+'</div></div>';
  h+=L.map(function(A){
    var r='<div class="arcan-y"><div class="arcan-yh"><b>'+_pilEsc(A.bornes.court||String(A.an))+'</b>'+(A.enCours?EC:'')
      +(cadre==='exercice'?('<span class="d">'+_pilEsc(_arcJour(A.bornes.d0)+' → '+_arcJour(A.bornes.d1))+'</span>'):'')+'</div>';
    if(!A.campagnes.length) return r+'</div>';
    r+='<div class="arcan-camp">'+A.campagnes.map(function(n){ return '<span>'+_pilEsc(n)+'</span>'; }).join('')+'</div>';
    r+='<div class="arcan-g">'
      +'<div><div class="l">Heures archivées</div><div class="v">'+(A.h>0?_pilHa(Math.round(A.h))+' h':'—')+'</div></div>'
      +'<div><div class="l">Interventions</div><div class="v">'+A.inter+'</div></div>'
      +'<div><div class="l">Parcelles touchées</div><div class="v">'+A.nParc+'</div></div>'
      +'<div><div class="l">Sessions tracteur</div><div class="v">'+A.sess+'</div></div></div>';
    var tk=A.top.filter(function(t){ return t.h>=0.5; });
    if(tk.length){
      var aff=tk.slice(0,3), reste=tk.slice(3).reduce(function(n,t){ return n+t.h; },0);
      r+='<div class="arcan-tk">'+aff.map(function(t){ return _pilEsc(t.nom)+' '+_pilHa(Math.round(t.h))+' h'; }).join(' · ')
        +(reste>=0.5?' · autres '+_pilHa(Math.round(reste))+' h':'')+'</div>';
    }
    if(A.hRep>=0.5) r+='<div class="arcan-tk">dont '+_pilHa(Math.round(A.hRep))+' h réparties</div>';
    return r+'</div>';
  }).join('');
  return h+'</div>';
}
// Réglage du cadre annuel — admin seul, même patron que _pexSetMois.
function _arcSetCadre(v){
  if(!(typeof window.isAdmin==='function' && window.isAdmin())){
    if(window.showToast) window.showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#C0392B');
    return;
  }
  if(v!=='vigne' && v!=='exercice') return;
  if(v===_arcCadre()) return;
  if(typeof window._ecoCfgSet==='function') window._ecoCfgSet('eco','archive_cadre',v);
  if(_arcCadre()!==v){
    if(window.showToast) window.showToast('R\u00e9glage non enregistr\u00e9 \u2014 mise \u00e0 jour de R\u00e9glages requise','#B85A1A');
    return;
  }
  _pilFillContent(_pilData());
}
window._arcSetCadre=_arcSetCadre;

function _pilTabArc(d){
  var S=(window.SAISONS||[]).filter(function(s){ return s&&s.debut&&s.fin&&s.fin>=s.debut; });
  // ★★ COHER-1 (§581) — « CAMPAGNE » N'A PLUS QU'UN SENS SUR CET ÉCRAN. La frise appelait « Campagne 2026–2027 » l'année
  //   du 1er août au 31 juillet et « période » ce qu'elle contient, quand la barre « Vous regardez », le bilan par année
  //   juste dessous et « Clôturer la campagne » appellent campagne la période de travail. Une ligne = une ANNÉE VIGNE (le mot
  //   de la barre, le même cadre : _mvCampagneBornes) ; ses barres = les CAMPAGNES. Les noms du code (_arcCampagneDe…) restent.
  //   La ligne ne porte que ses années (« 2026–2027 », comme le bilan par année dessous) : « Année vigne 2026–2027 en cours »
  //   passait à la ligne au téléphone ; la phrase du haut et le compteur disent ce qu'est une ligne.
  // MOTS-4 (§585) — L'ÉCRAN, COMME LA MAQUETTE (docs/maquettes/maquette-archives-frise-v2.html) : une phrase, trois chiffres,
  //   la frise (les barres seules, leur nom dans la bulle), le bilan par année, deux boutons. L'échelle des mois, le paragraphe
  //   du haut et la note du bas sont partis : « août → juil. » est sur le titre de la frise, le reste dans les fiches.
  if(!S.length) return '<div class="arc-empty">Aucune campagne datée. '
    +'<button type="button" class="pil-diag-go ghost" data-diag="saisons">Réglages › Campagne ›</button></div>';
  var par={};
  S.forEach(function(s){ var k=_arcCampagneDe(s.debut); (par[k]=par[k]||[]).push(s); });
  var keys=Object.keys(par).map(Number).sort(function(x,y){ return y-x; });
  var auj=_mvToday(), anCur=_arcCampagneDe(auj);
  var hTot=S.reduce(function(n,s){ return n+_arcHeures(s.nom); },0);
  // Une clôture = un instantané au nom de la campagne (HISTORIQUE). « Cette année » : l'année vigne en cours.
  var H0=window.HISTORIQUE||[];
  var nClos=(par[anCur]||[]).filter(function(s){ return H0.some(function(x){ return x&&x.saisonNom===s.nom; }); }).length;
  var enc=S.filter(function(s){ return auj>=s.debut && auj<=s.fin; })[0]||null;
  /* ★ AXE-1 : l'axe est un reglage, le titre de la frise le LIT (« août → juil. », ou « oct. → sept. » chez qui l'a regle ainsi). */
  var _bc=_arcBornes(anCur), m0=_pecIsoToMs(_bc.d0), m1=_pecIsoToMs(_bc.d1);
  var axe=(m0!==null&&m1!==null)?(_pecMoisCourt(new Date(m0).getMonth())+' → '+_pecMoisCourt(new Date(m1).getMonth())):'';
  var h='<div class="pec-wrap">'
    +_pecEnteteVue('', '<b>'+keys.length+' année'+(keys.length>1?'s':'')+' vigne</b>, '+S.length+' campagne'+(S.length>1?'s':'')+'. '
      +(nClos?(nClos+' clôture'+(nClos>1?'s':'')+' cette année.'):'Aucune clôture cette année.'))
    +'<div class="pec-card"><div class="pec-kpis pec-k3">'
    +'<div class="pec-k"><div class="l">Années vigne</div><div class="v">'+keys.length+'</div></div>'
    +'<div class="pec-k"><div class="l">Campagnes</div><div class="v">'+S.length+'</div></div>'
    +'<div class="pec-k"><div class="l">Heures archivées</div><div class="v">'+(hTot>0?(_pilHa(hTot)+'<small> h</small>'):'—')+'</div>'
      +(hTot>0?'':'<div class="s">à la première clôture</div>')+'</div>'
    +'</div></div>';
  var frise='<div class="pec-card arc-card"><div class="pec-ch"><div class="pec-ct">La frise</div>'
    +'<div class="pec-cs pec-ci">'+_pilEsc(axe)+(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.arc.frise')):'')+'</div></div>'
    +'<div class="arc-frise" id="arc-frise"><div class="arc-bul" id="arc-bul" role="status" hidden></div>'
    +keys.map(function(k){ return _arcLigne(k,par[k],k===anCur); }).join('')+'</div>'
    +(enc?('<div class="arc-fait"><span class="pec-pill" style="background:var(--gris-clair);color:var(--texte-med)">en cours</span><span>'+_pilEsc(enc.nom)+'</span></div>'):'')
    +'</div>';
  // Le bilan de campagne vit dans cave.js (importe AVANT pilotage.js) : on ne duplique pas le moteur, on ouvre la porte.
  var acts='<div class="pec-acts"><button class="pec-btn" onclick="window._arcOpenCmp&&window._arcOpenCmp()"><span>'+_mvIcon('graphique',16)+'</span> Comparer deux campagnes</button>'
    +'<button class="pec-btn" onclick="window._bcExportChoix&&window._bcExportChoix()"><span>'+_mvIcon('livre',16)+'</span> Éditer le bilan</button></div>';
  h+='<div class="pec-g2 pec-g21">'+frise+'<div>'+_arcBlocAnnuel()+acts+'</div></div></div>';   /* ★ ARCH-2 */
  return h;
}
// Appele depuis Reglages > Campagne : bascule sur Pilotage et ouvre directement l'onglet.
// Expression assignee a window et non fonction declaree : son seul appelant vit dans un onclick
// d'un AUTRE fichier, et le cliquet C15 (fonction sans appelant) raisonne fichier par fichier.
window._pilOpenArchives = function(){
  _PIL_TAB='arc'; _pilSaveTab('arc');
  if(window.goTo) window.goTo('pilotage'); else renderPilotage();
};
// Le comparateur multi-saisons vivait derriere un bouton de Reglages : sa place est ici.
window._arcOpenCmp = function(){
  if(window.openOv) window.openOv('ovHistorique');
  if(window.renderHistorique) window.renderHistorique();
};

function _pilTabsHtml(tab){
  // Le numero de niveau se lit AVANT le nom : c'est lui qui dit que la barre
  // se parcourt de gauche a droite, du large au fin. « Aujourd'hui » n'en
  // porte pas : ce n'est pas un niveau de zoom, c'est le present. Et les
  // ecrans de detail non plus — les numeroter ferait croire a huit niveaux.
  var niv=0, apres=false, poseSep=false;
  var h='<div class="mvu-tabs mvu-pil" id="pil-tabs">'+_PIL_TABS.map(function(t){
    var sep=poseSep?'<span class="pil-tabsep" aria-hidden="true"></span>':'';
    poseSep=false;
    var n='';
    if(!apres && t[0]!=='auj') n='<span class="pil-lvn">'+(++niv)+'</span>';
    if(t[0]===_PIL_ZOOM_FIN){ apres=true; poseSep=true; }
    return sep+'<button class="mvu-tab'+(t[0]===tab?' active':'')+'" data-tab="'+t[0]+'">'
      +n+'<span class="mvu-tab-em">'+_mvIcon(t[1],18)+'</span>'+_pilEsc(t[2])+'</button>';
  }).join('')+'</div>';
  return h;
}
function _pilHdrHtml(d,tab){
  // ★ TETE-2 (§329) — LE PILOTAGE PREND LE MODÈLE COMMUN DES EN-TÊTES. Le bandeau brun (« .pil-mast », texte crème) avait
  //   été repeint en clair par TETE-1 sans sa météo ni son aide : crème sur blanc. Il devient un vrai .mod-header — icône,
  //   « Pilotage », le domaine en sous-titre (le vignoble à côté, caché au téléphone), la roue — puis la ligne du jour des
  //   autres modules : la période, la date ou la météo (qui porte alors la date courte), « ? Aide » au bout.
  //   Plus d'hôte dédié pour l'aide : _mvInjectHelpBtn trouve cette .mod-meta-row comme partout (renderPilotage la rappelle).
  //   Les ids lus ailleurs restent : #pil-dom-nom, #pil-saison, #pil-meteo (_pilRenderMeteo), #pil-regl-gear (_pilBind).
  return '<div class="mod-header h-pilotage">'
    +'<div class="mod-header-top"><span class="mod-header-icon">'+_mvIcon('graphique',20)+'</span>'
    +'<div class="mod-header-titles"><div class="mod-header-title">Pilotage</div>'
    +'<div class="mod-header-sub" id="pil-dom-nom">'+_pilEsc(d.domaine)+'<span class="pil-vgn"> \u00b7 '+d.nActives+' parcelles \u00b7 '+_pilHa(d.surfTot)+' ha</span></div></div>'
    // La roue crantée du module (lot NAV-3) : ce qui se règle, et le bilan de campagne.
    // ★★ TETE-4C (§579) — LE PILOTAGE PREND LE BANDEAU COMMUN (TETE-4A, §577). Il empilait quatre bandes : l'en-tête, la campagne et
    //   la météo, « Vous regardez », les onglets (218 px ; 286 au téléphone). Trois lignes, comme partout : la campagne, la date ou la
    //   météo montent dans la ligne du module (« ? Aide » se pose après elles, _mvInjectHelpBtn) ; les onglets entrent DANS l'en-tête ;
    //   « Vous regardez » devient la ligne d'écran (_pilSkeleton). La barre .pil-tabsbar n'existe plus.
    +'<div class="mod-meta-row mvu-meta'+(d.meteo?' mvu-avec-meteo':'')+'">'
    // ★ PORTEE-1 (§591) : la pastille de la campagne est un BOUTON, comme dans la Vigne — elle ouvre le même menu (_seasonMenuToggle,
    //   app.js) : choisir une campagne la fait lire par tout le Pilotage. Ambrée quand la campagne lue n'est pas l'active.
    +(function(){ var act=((typeof window.getSaisonActive==='function'?window.getSaisonActive():null)||{}).nom||'', cons=!!(act && d.saison && d.saison!==act);
      return '<button type="button" class="hv2-saison-pill pil-saison-btn'+(cons?' consult':'')+'" data-pilsaison="1" aria-haspopup="true" aria-expanded="false" title="Choisir la campagne">'
        +'<span class="hv2-dot"></span><span id="pil-saison">'+_pilEsc(d.saison)+(cons?'<span class="pil-cons-t"> \u00b7 consult\u00e9e</span>':'')+'</span><span class="hv2-sc-chev" aria-hidden="true">'+_mvIcon('chevron',16)+'</span></button>'; })()
    +'<div class="hv2-sep"></div><div class="hv2-date" data-mv-date></div>'
    +'<div class="hv2-meteo-mini" id="pil-meteo" style="'+(d.meteo?'':'display:none')+'"></div>'
    +'</div>'
    +(((typeof window.isAdmin==='function')&&window.isAdmin())?'<button class="mod-home-btn mv-regl-gear" id="pil-regl-gear" title="R\u00e9glages" aria-label="R\u00e9glages et documents du Pilotage">'+_mvIcon('engrenage',18)+'</button>':'')
    +'</div>'
    +_pilTabsHtml(tab)
    +'</div>';
}
function _pilSkeleton(d,tab){
  // L'onglet Économie n'a pas de roue crantée : ses trois sous-vues remplacent la
  // liste de cases à cocher, et l'on ne masque pas un poste de dépense à la carte.
  // ★★★ LE BANDEAU DE TITRE DISPARAIT.
  //   `<h2 class="pil-h2">` repetait mot pour mot l'onglet actif, en 26 px, sur
  //   une ligne a lui — et sur telephone, sur DEUX lignes. La barre d'onglets le
  //   dit deja, en surbrillance. Ce que le titre apportait en plus, c'est le
  //   SOUS-TITRE des libelles longs (« L'annee — les douze mois, d'un cadre a
  //   l'autre ») : il descend en une ligne fine sous les onglets.
  //   ⚠️ `_pilTabLabel` reste utilise : c'est lui qui porte ce sous-titre.
  //   ★ « Choisir les indicateurs » occupait le reste de la ligne. Il rejoint le
  //     menu ⚙ Outils, ou vivent deja Archives et Parametrage — c'est le meme
  //     genre de geste, rare et volontaire. `#pil-gear` ne bouge pas de nom :
  //     _pilBind le retrouve, et le panneau s'ouvre au meme endroit.
  var avecPerso=(tab==='auj'||tab==='avc'||tab==='equ'||tab==='sim'||tab==='eco'||tab==='cfm');
  _pilCssV2(); _pilScopeLoad();
  // La barre de portee se pose ENTRE le masthead et les onglets : elle dit ou
  // l'on regarde avant de dire ce que l'on regarde. Les photos ouvrent le
  // contenu, quel que soit l'onglet — on voit l'ensemble avant le detail.
  // ★ TETE-4C (§579) : la ligne d'écran suit l'en-tête — à gauche « Vous regardez » (au téléphone : un bouton, qui déplie le choix
  //   dessous), à droite « N choses à compléter ». Un rendu neuf la rend repliée.
  _pilPtOuvert=false;
  return _pilHdrHtml(d,tab)
    +'<div class="mv-ecran pil-portee" id="pil-portee"><div class="mv-ecran-g pil-crumb" id="pil-crumb">'+_pilCrumbHtml()+'</div>'
    +'<div class="mv-ecran-d"><span id="pil-diagbtn-host">'+_pilDiagBtnHtml()+'</span></div></div>'
    +'<div class="pil-diagwrap" id="pil-diagwrap"><div class="pil-diagsheet" id="pil-diagsheet"></div></div>'
    // ★ MOTS-8 (§590) : sur Travaux, la sous-ligne porte la phrase du jour (_pilTvPhrase), posée par _pilFillContent.
    +'<div class="pil-souslig'+((tab==='avc'||tab==='equ'||tab==='sim')?' pil-tv-souslig':'')+'"><span id="pil-souslig-t">'+((tab==='avc'||tab==='equ'||tab==='sim')?'':_pilEsc(_pilTabLabel(tab)))+'</span>'
    +(avecPerso?'<button class="pil-gear2" id="pil-gear" title="Choisir les indicateurs" aria-label="Choisir les indicateurs"><span>\u2699</span></button>':'')+'</div>'
    +'<div class="pil-wrap">'
    +(_pilPhotosIci(tab)?('<div id="pil-photos-host">'+_pilPhotosHtml()+'</div>'):'')
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
// ⚠️ Les photos lisent _PIL_SCOPE. Aucune ne garde d'etat a elle.
// ★★★ ELLES NE SONT PLUS UN BANDEAU : CE SONT LES CHIFFRES D'UN NIVEAU.
//   Le bandeau sortait sur les HUIT onglets. Sur Économie et sur Conformite, la
//   photo repetait mot pour mot l'ecran juste en dessous — et le code l'admettait
//   deja : cliquer une photo depuis son propre onglet ne navigue pas, elle DEFILE.
//   Un bouton « voir le detail » qui ne peut que descendre dans la page est
//   l'aveu qu'il n'avait rien a faire la.
//   Elles vivent desormais sur les DEUX niveaux de zoom — l'annee et la campagne
//   — et nulle part ailleurs. Sur « Aujourd'hui », le cockpit repond deja aux
//   memes questions avec de meilleurs instruments (l'anneau, la marge, la charge
//   restante, la cadence, le budget consomme) : les photos y faisaient un
//   troisieme emploi. Sur les cinq ecrans de detail, on y ARRIVE par une photo.
// ════════════════════════════════════════════════════════════════════════════
function _pilPhotosIci(tab){ return tab==='avc'; }   // PIL-RANGE-2b (§444) : L'annee rangee, les photos restent sur La campagne
function _pilCssV2(){
  if(document.getElementById('pil-css-v2')) return;
  // ═══ L'ECHELLE DE TEXTE — ONZE PAS NOMMES ═══
  //   Declaree dans styles.css (:root) depuis ce lot : une echelle n'est pas la
  //   propriete d'un module. Les 259 appels du fichier gardent leur REPLI —
  //   var(--pt-txt,13px) — pour que le module reste juste meme si styles.css
  //   est en retard chez un client. Une variable inconnue rend la declaration
  //   invalide et fait retomber TOUT le texte a la taille heritee, en silence.
  var css=''
  // ★ TETE-4C (§579) : « Vous regardez » est la ligne d'écran (.mv-ecran, bandeau.css) — plus une bande collante à elle, et les
  //   onglets sont dans l'en-tête : les trois règles qui les empilaient (.pil-portee collante, .pil-tabsbar calée sous elle,
  //   .pil-portee-in) sont parties d'ici. Le récit qui suit reste : c'est pourquoi la hauteur de la barre se mesurait.
  // ⚠️⚠️ DEUX BARRES COLLANTES AU MEME `top` SE RECOUVRENT.
  //   .pil-tabsbar est sticky top:0 z-index:60 (styles.css) et .pil-portee sticky
  //   top:0 z-index:34 : des le premier scroll, la barre d'onglets passait
  //   PAR-DESSUS le fil d'Ariane et le bouton « a completer ». La portee active
  //   redevenait invisible en cours de lecture — le defaut meme que la refonte
  //   corrigeait : un filtre qu'on oublie qu'il tourne est pire que pas de filtre.
  //   La hauteur du fil se MESURE (deux lignes sur telephone, une puce de plus
  //   quand une campagne est epinglee) et devient le `top` des onglets.
  //   ★ `body .pil-tabsbar` : une classe de plus que styles.css, donc il gagne
  //   SANS !important, meme si l'ordre des feuilles change un jour.
  +'.pil-crumb{display:flex;align-items:center;gap:5px;flex-wrap:wrap;flex:1;min-width:0}'
  // PIL-RANGE-2a (§442) : la barre « Vous regardez ».
  +'.pil-crumb{gap:8px}'
  +'.pil-ptlab{font-size:var(--pt-micro,12px);color:var(--texte-doux);white-space:nowrap}'
  +'.pil-ptseg button{white-space:nowrap}'
  +'.pil-ptbornes{font-size:var(--pt-micro,12px);color:var(--texte-doux);white-space:nowrap}'
  // PIL-RANGE-3 (§445) : la jauge de saison dans la carte « Avancement par tâche » — plus une carte dans la carte.
  +'.pil-panel .pil-gauge-in{background:none;border:0;border-bottom:1px solid var(--gris-clair);border-radius:0;box-shadow:none;padding:0 0 12px;margin:0 0 12px}'
  +'.pil-panel .pil-gauge-in::before{display:none}'
  +'.pil-crumb .pil-annav-b{min-width:32px;min-height:32px}'
  +'.pil-crumb .pil-annav-l{font-size:var(--pt-base,14px)}'
  +'.pil-photos{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;margin:0 0 18px}'
  +'.pil-photo{background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:14px;padding:13px 14px 12px;box-shadow:var(--shadow-sm);text-align:left;width:100%;font-family:inherit;cursor:pointer;transition:border-color .12s;min-height:112px;display:block}'
  +'.pil-photo:hover{border-color:var(--or)}'
  +'.pil-photo .k{display:flex;align-items:center;gap:6px;font-size:var(--pt-nano,11px);letter-spacing:0;text-transform:none;color:var(--texte-doux);font-weight:600}'
  +'.pil-photo .v{display:block;font-size:var(--pt-xxl,32px);font-weight:600;line-height:1.05;margin:5px 0 0;color:var(--texte);font-variant-numeric:lining-nums tabular-nums}'
  +'.pil-photo .u{display:inline;font-family:var(--font-ui,Outfit,sans-serif);font-size:var(--pt-base,14px);font-weight:600;color:var(--texte-doux)}'
  +'.pil-photo .s{display:block;font-size:var(--pt-micro,12px);color:var(--texte-doux);margin-top:2px;line-height:1.35}'
  +'.pil-flag{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;font-size:var(--pt-lbl,12px);font-weight:600;color:#fff;flex-shrink:0}'
  +'.pil-lvn{display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;border-radius:50%;background:var(--gris-clair);color:var(--texte-doux);font-size:var(--pt-lbl,12px);font-weight:600;margin-right:6px;flex-shrink:0;font-family:var(--font-ui,Outfit,sans-serif)}'
  +'.mvu-tab.active .pil-lvn{background:var(--cave);color:var(--or-clair)}'
  // Le filet dit ou s'arrete le zoom. Sans lui, « Cave » se lit comme un
  // cinquieme niveau, et la barre redevient une liste de sujets.
  +'.pil-tabsep{display:inline-block;width:1px;align-self:stretch;min-height:22px;margin:0 9px;background:var(--gris);flex-shrink:0}'
  +'.pil-diagbtn{border:1px solid var(--orange);background:var(--orange-pale);color:var(--orange);border-radius:9px;padding:6px 11px;font-size:var(--pt-txt,13px);font-weight:600;white-space:nowrap;min-height:34px;font-family:inherit;cursor:pointer}'
  +'.pil-diagbtn.grave{border-color:var(--rouge);background:var(--rouge-pale);color:var(--rouge-tx,#A0291E)}'
  +'.pil-diagbtn.clean{border-color:var(--vert-med);background:var(--vert-pale);color:var(--vert-med)}'
  +'.pil-diagwrap{position:fixed;inset:0;background:rgba(20,17,13,.45);z-index:8905;display:none;align-items:flex-end;justify-content:center}'
  +'.pil-diagwrap.show{display:flex}'
  +'.pil-diagsheet{background:var(--bg-app);width:100%;max-width:640px;max-height:86vh;overflow:auto;border-radius:18px 18px 0 0;padding:17px 17px calc(34px + env(safe-area-inset-bottom,0px))}'
  +'.pil-diag-h{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:4px}'
  +'.pil-diag-t{font-size:var(--pt-lg,24px);font-weight:600;color:var(--texte);line-height:1.15}'
  +'.pil-diag-s{font-size:var(--pt-txt,13px);color:var(--texte-doux);margin-top:2px}'
  +'.pil-diag-x{border:1px solid var(--gris);background:var(--bg-card);border-radius:8px;width:32px;height:32px;font-size:var(--pt-sm,16px);color:var(--texte-doux);flex-shrink:0;font-family:inherit;cursor:pointer}'
  +'.pil-diag-ok{background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:13px;padding:16px;text-align:center;color:var(--vert-med);font-weight:600;margin-top:11px}'
  +'.pil-cov{display:flex;align-items:center;gap:12px;background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:13px;padding:11px 13px;margin:11px 0 13px}'
  +'.pil-cov-v{font-size:var(--pt-xxl,32px);font-weight:600;line-height:1;color:var(--orange);white-space:nowrap;flex-shrink:0}'
  +'.pil-cov-t{font-size:var(--pt-txt,13px);line-height:1.45}'
  +'.pil-cov-t span{color:var(--texte-doux)}'
  +'.pil-dl{background:var(--bg-card);border:1px solid var(--gris-clair);border-left-width:4px;border-radius:11px;padding:11px 13px;margin-bottom:9px}'
  +'.pil-dl.r{border-left-color:var(--rouge)}.pil-dl.o{border-left-color:var(--orange)}.pil-dl.b{border-left-color:#4A9FC8}'
  +'.pil-dl-t{font-weight:600;font-size:var(--pt-base,14px);display:flex;align-items:center;gap:7px;margin-bottom:2px}'
  +'.pil-dl-g{font-size:var(--pt-lbl,12px);letter-spacing:0;text-transform:none;color:var(--texte-doux);font-weight:600;margin-bottom:5px}'
  +'.pil-dl-f{font-size:var(--pt-txt,13px);color:var(--texte-doux);line-height:1.5}'
  +'.pil-dl-f b{color:var(--texte)}'
  +'.pil-diag-go{margin-top:9px;border:1px solid var(--cave);background:var(--cave);color:var(--or-clair);border-radius:8px;padding:7px 13px;font-size:var(--pt-txt,13px);font-weight:600;font-family:inherit;cursor:pointer;min-height:34px}'
  +'.pil-diag-go.ghost{background:var(--bg-card);color:var(--texte)}'
  +'.pil-flag{cursor:pointer}'
  // ══ LA SOUS-LIGNE — ce qui reste du bandeau de titre ══
  +'.pil-souslig{max-width:1280px;margin:0 auto;padding:7px 24px 0;display:flex;align-items:center;gap:10px;'
  +'font-size:var(--pt-micro,12px);color:var(--texte-doux);line-height:1.35}'
  +'.pil-souslig>span{flex:1;min-width:0}'
  +'.pil-souslig .pil-gear2{flex:none;padding:5px 9px;font-size:var(--pt-txt,13px);line-height:1}'
  // ══ LES QUATRE PHOTOS ══
  //   ⚠️⚠️ SUR TELEPHONE, ELLES PRENAIENT 259 px — MESURE, PAS ESTIME. Deux
  //     rangees de deux, chacune avec son etiquette, son chiffre, son sous-titre
  //     et son « voir le detail ». A elles seules, un tiers de l'ecran avant le
  //     premier chiffre du contenu.
  //   En frise d'une seule ligne, qui defile : le chiffre passe A COTE de
  //     l'etiquette au lieu d'etre dessous, et « voir le detail » disparait — la
  //     carte reste cliquable en entier, la fleche ne servait qu'a le dire.
  //   ★ Les quatre restent VISIBLES d'un coup d'oeil : c'est leur raison d'etre.
  //     On ne remplace pas quatre chiffres par un bouton « voir les chiffres ».
    +'@media(max-width:700px){'
  +'.pil-photos{display:flex;grid-template-columns:none;gap:8px;overflow-x:auto;scroll-snap-type:x proximity;'
  +'-webkit-overflow-scrolling:touch;margin:0 -16px 12px;padding:0 16px 2px}'
  +'.pil-photos::-webkit-scrollbar{display:none}'
  +'.pil-photo{flex:0 0 auto;width:auto;min-width:142px;max-width:220px;padding:9px 12px;scroll-snap-align:start}'
  +'.pil-photo .v{display:inline;font-size:var(--pt-lg,24px);margin:0}'
  +'.pil-photo .s{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:190px}'
  +'.pil-souslig{padding:6px 16px 0}'
  +'.pil-ptlab,.pil-ptbornes{display:none}'
  +'}'
  +'@media(max-width:520px){.pil-tabsep{margin:0 5px}.pil-lvn{margin-right:4px}}'
  // Le depliant des cinq jours dans \u00ab Traiter ? \u00bb. Il vit ici et non dans
  // styles.css : c'est une regle de composant, propre a une seule carte.
  +'.pil-t5{margin-top:10px;border-top:1px solid var(--gris-clair);padding-top:8px}'
  +'.pil-t5>summary{cursor:pointer;list-style:none;font-size:var(--pt-micro,12px);font-weight:600;letter-spacing:0;text-transform:none;color:var(--terre)}'
  +'.pil-t5>summary::-webkit-details-marker{display:none}'
  +'.pil-t5>summary::after{content:\" \u25b8\";display:inline-block;transition:transform .15s}'
  +'.pil-t5[open]>summary::after{transform:rotate(90deg)}'
  +'.pil-t5b{display:flex;flex-direction:column;gap:6px;margin-top:9px}'
  // FENETRE-2 (§567) : la frise des cinq jours, heure par heure.
  +'.pil-fr{display:flex;flex-direction:column;gap:2px;margin-bottom:8px}'
  +'.pil-fr-r{display:grid;grid-template-columns:64px repeat(24,minmax(0,1fr));gap:2px;align-items:center}'
  +'.pil-fr-ax span{font-size:var(--pt-lbl,12px);color:var(--texte-doux);font-variant-numeric:tabular-nums}'
  +'.pil-fr-j{font-size:var(--pt-lbl,12px);color:var(--texte-med);white-space:nowrap}'
  +'.pil-fr-c{display:block;height:14px;border-radius:2px;background:var(--bg-app)}'
  +'.pil-fr-c.ok{background:var(--vert-med)}.pil-fr-c.soir{background:var(--tag-purple-tx,#5A2D8E)}.pil-fr-c.pluie{background:var(--info,#2F6FB0)}'
  +'.pil-fr-c.vent{background:var(--orange)}.pil-fr-c.chaud{background:var(--rouge)}.pil-fr-c.sec{background:var(--gris-clair)}'
  +'.pil-fr-leg{display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:6px;font-size:var(--pt-lbl,12px);color:var(--texte-doux)}'
  +'.pil-fr-leg span{display:inline-flex;align-items:center;gap:4px}.pil-fr-leg .pil-fr-c{width:12px;height:12px}'
  // Le graphe du budget annuel : legende sur une ligne, comme celle d'\u00c9conomie.
  +'.pil-anc{background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:16px;padding:12px 16px 16px;margin:0 0 16px;box-shadow:var(--shadow-sm,0 1px 2px rgba(40,30,15,0.05),0 2px 8px rgba(40,30,15,0.07))}'
  +'.pil-anc-l1{display:flex;align-items:center;gap:8px 12px;flex-wrap:wrap}'
  +'.pil-anseg button{min-height:40px;padding:0 16px;font-size:var(--pt-txt,13px)}'
  +'.pil-annav{display:inline-flex;align-items:center;gap:4px}'
  +'.pil-annav-b{min-width:40px;min-height:40px;border:1px solid var(--gris-clair);background:var(--bg-card);color:var(--texte);border-radius:12px;font-size:var(--pt-sm,16px);line-height:1;cursor:pointer}'
  +'.pil-annav-b[disabled]{opacity:.35;cursor:default}'
  +'.pil-annav-l{font-size:var(--pt-md,20px);font-weight:600;min-width:96px;text-align:center;font-variant-numeric:lining-nums tabular-nums}'
  +'.pil-anbadge{font-size:var(--pt-lbl,12px);font-weight:600;letter-spacing:0;text-transform:none;padding:4px 8px;border-radius:999px;background:var(--tag-grey-bg);color:var(--tag-grey-tx)}'
  +'.pil-anbadge.on{background:var(--vert-pale);color:var(--vert-med)}'
  +'.pil-anc-sp{flex:1}'
  +'.pil-anc-t{font-size:var(--pt-lg,24px);font-weight:600;color:var(--texte);margin:12px 0 4px}'
  +'.pil-anc-d{font-size:var(--pt-txt,13px);line-height:1.55;color:var(--texte-med)}'
  +'.pil-anc-d b{color:var(--texte);font-weight:600}'
  +'.pil-anc-av{display:flex;gap:8px;align-items:flex-start;margin-top:12px;padding:8px 12px;border-radius:12px;background:var(--orange-pale);color:var(--orange);font-size:var(--pt-txt,13px);line-height:1.5}'
  +'.pil-anc-av svg{flex:none;margin-top:2px}'
  +'.pil-anc-av .pil-diag-go{margin-top:4px}'
  +'.pil-anf{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin:12px 0 8px}'
  +'.pil-anf-c{background:var(--bg-app);border-radius:12px;padding:8px 12px}'
  +'.pil-anf-c .l{font-size:var(--pt-nano,11px);letter-spacing:0;text-transform:none;color:var(--texte-doux);font-weight:600}'
  +'.pil-anf-c .v{font-size:var(--pt-xl,28px);font-weight:600;line-height:1.1;margin-top:4px;font-variant-numeric:lining-nums tabular-nums;color:var(--texte)}'
  +'.pil-anf-c .v span{font-family:var(--font-ui,Outfit,sans-serif);font-size:var(--pt-txt,13px);font-weight:600;color:var(--texte-doux)}'
  +'.pil-anf-c.m .v{color:var(--terre)}'
  +'.pil-anf-c .s{font-size:var(--pt-micro,12px);color:var(--texte-doux);margin-top:2px}'
  +'.pil-anbar{display:flex;height:8px;border-radius:999px;overflow:hidden;background:var(--or-clair);margin:0 0 12px}'
  +'.pil-anbar i{display:block;height:100%;background:var(--terre)}'
  +'.pil-anh{font-weight:600;font-size:var(--pt-txt,13px);color:var(--texte);margin:16px 0 4px}'
  +'.pil-anp{display:grid;grid-template-columns:minmax(0,1.7fr) repeat(3,minmax(0,1fr));font-size:var(--pt-txt,13px);margin-top:12px}'
  +'.pil-anp.clos{grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);max-width:420px}'
  +'.pil-anp>div{display:contents}'
  +'.pil-anp span{padding:8px;border-top:1px solid var(--gris-clair);text-align:right;font-variant-numeric:lining-nums tabular-nums}'
  +'.pil-anp span:first-child{text-align:left}'
  +'.pil-anp .hd span{border-top:0;font-size:var(--pt-nano,11px);letter-spacing:0;text-transform:none;color:var(--texte-doux);font-weight:600}'
  +'.pil-anp .tt span{font-weight:600;border-top:1px solid var(--gris)}'
  +'.pil-ann{font-size:var(--pt-micro,12px);line-height:1.5;color:var(--texte-doux);margin-top:8px}'
  +'.pil-anr-l{display:flex;align-items:center;gap:4px 12px;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid var(--gris-clair)}'
  +'.pil-anr-l i,.pil-anb-leg em.pil-anr-h{width:16px;height:12px;border-radius:4px;flex:none;background:repeating-linear-gradient(135deg,var(--rouge) 0 2px,var(--rouge-pale) 2px 4px)}'
  +'.pil-anr-l b{font-weight:600;font-size:var(--pt-txt,13px);min-width:150px}'
  +'.pil-anr-l .n{font-weight:600;font-size:var(--pt-base,14px);color:var(--rouge);min-width:110px}'
  +'.pil-anr-l .s{font-size:var(--pt-micro,12px);color:var(--texte-doux)}'
  +'.pil-anr-go{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px;font-size:var(--pt-txt,13px);color:var(--texte-med)}'
  +'.pil-anb-leg{display:flex;gap:15px;flex-wrap:wrap;font-size:var(--pt-micro,12px);color:var(--texte-doux);margin-top:9px}'
  +'.pil-anb-leg span{display:inline-flex;align-items:center;gap:6px}'
  +'.pil-anb-leg em{width:15px;height:10px;border-radius:3px;display:inline-block;font-style:normal}'
  // ══ LE MASTHEAD ══
  //   200 px sur telephone : le nom du domaine passait a la ligne en 26 px, et
  //   Periode / Vignoble s'empilaient dessous. On sait chez qui on est — ce nom
  //   se lit une fois, pas a chaque ouverture. Il reste, plus petit, et les deux
  //   cellules tiennent sur une ligne.
  +'@media(max-width:700px){'
  +'.pil-mast-in{padding:calc(env(safe-area-inset-top,0px) + 12px) 16px 12px;gap:11px;align-items:center}'
  +'.pil-dom{font-size:var(--pt-lg,24px);margin-top:2px}'
  +'.pil-mast-right{gap:14px;width:100%}'
  +'.pil-cell .s2{font-size:var(--pt-base,14px)}'
  +'.pil-icon{width:32px;height:32px;font-size:var(--pt-sm,16px)}'
  +'}';
  var el=document.createElement('style'); el.id='pil-css-v2'; el.textContent=css;
  document.head.appendChild(el);
}

// ── Le fil d'Ariane ─────────────────────────────────────────────────────────
// Une portee active se lit sur la MEME ligne que le reste, jamais repliee dans
// un panneau : un filtre qu'on oublie qu'il tourne est pire que pas de filtre.

function _pilCrumbHtml(){
  // ★★★ PORTEE-1 (§591) — « VOUS REGARDEZ » NE RESTE QUE LÀ OÙ IL CHANGE L'ÉCRAN. Mesuré sur la démo (17/11) : la barre était sur
  //   les sept onglets ; quatre l'ignoraient (Aujourd'hui, Décider, Conformité, Archives) ; Économie n'en lisait que l'année (Le
  //   détail) ; Travaux n'en lisait que le bandeau et « Le temps de l'équipe », pas ses quatre autres cartes — deux échelles sur un
  //   écran. Et « La campagne » doublait le choix de la campagne de toute l'appli (la pastille du haut, comme dans la Vigne).
  //   Désormais : la campagne se choisit à la pastille du haut, pour tout le Pilotage ; la ligne d'écran dit la campagne lue sur
  //   Travaux, L'équipe & le matériel et Décider (qui ne la disent pas eux-mêmes) ; le choix de l'ANNÉE (exercice ou année vigne,
  //   et laquelle) n'est montré que sur Économie › Le détail, le seul écran qui la lit. Ailleurs, rien : l'écran dit son cadre.
  //   ⚠️ AUCUN ÉTAT NOUVEAU : _PIL_SCOPE garde le cadre et le recul ; `camp` ne se pose plus (_pilScopeLoad).
  var tab=_PIL_TAB;
  if(tab==='eco' && _PEC_SUB==='exe') return _pilCrumbAnnee();
  if(tab==='avc' || tab==='equ' || tab==='sim') return _pilCrumbCampagne();
  return '';
}
// La campagne lue : ses dates et le jour où l'on est. Son nom est dans la pastille du haut (qui la change).
function _pilCrumbCampagne(){
  var sa=null; try{ sa=_pilSaison(); }catch(e){ sa=null; }
  if(!sa || !sa.debut || !sa.fin) return '<span class="pil-ptcamp-t"><span class="pil-ptlab">La campagne</span><span>sans dates</span></span>';
  var vn=_pilSaisonNom(), act=((typeof window.getSaisonActive==='function'?window.getSaisonActive():null)||{}).nom||'', cons=!!(vn&&act&&vn!==act);
  return '<span class="pil-ptcamp-t"><span class="pil-ptlab">'+(cons?'La campagne consult\u00e9e':'La campagne')+'</span>'
    +'<span class="pil-ptbornes">'+_pilPorteeBornes(sa.debut,sa.fin,1)+'</span>'
    // au téléphone, la ligne garde le jour où l'on est (les dates sont dans le menu de la pastille)
    +'<span class="pil-ptcourt">'+(cons?'consult\u00e9e \u00b7 ':'')+_pilEsc(_pilPorteeJour(sa.debut,sa.fin))+'</span></span>';
}
function _pilPorteeJour(d0,d1){
  var a=_pilAnnOrd(String(d0).slice(0,10)), b=_pilAnnOrd(String(d1).slice(0,10)), o=_pilAnnOrd(_pilAnAuj());
  if(isNaN(a)||isNaN(b)||isNaN(o)||b<a) return '';
  if(o<a) return '\u00e0 venir'; if(o>b) return 'termin\u00e9e le '+_pilDfr(String(d1).slice(0,10));
  return (o-a+1)+'\u1d49 jour sur '+(b-a+1);
}
// Le choix de l'année : l'exercice ou l'année vigne, et laquelle (‹ ›). Au téléphone, un bouton qui le déplie (TETE-4C).
function _pilCrumbAnnee(){
  var CA=null; try{ CA=_pilAnCadre(); }catch(eA){ CA=null; if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'portee: cadre illisible'}); }
  var mode=_pilPorteeMode();
  function B(m,lib){ return '<button type="button" data-portee="'+m+'" class="'+(mode===m?'on':'')+'" aria-pressed="'+(mode===m)+'">'+lib+'</button>'; }
  var resume=(mode==='vig'?'Ann\u00e9e vigne':'Exercice')+(CA?' '+CA.court:'');
  var h='<span class="pil-ptlab">Vous regardez</span>'
    +'<div class="pil-seg pil-ptseg" role="group" aria-label="L\u2019ann\u00e9e que lit cet \u00e9cran">'
    +B('exo','L\u2019exercice')+B('vig','L\u2019ann\u00e9e vigne')+'</div>';
  if(CA){
    h+='<div class="pil-annav">'
      +'<button type="button" class="pil-annav-b" data-anrecul="-1" aria-label="Ann\u00e9e pr\u00e9c\u00e9dente"'+(CA.prevOk?'':' disabled')+'>\u2039</button>'
      +'<span class="pil-annav-l">'+_pilEsc(CA.court)+'</span>'
      +'<button type="button" class="pil-annav-b" data-anrecul="1" aria-label="Ann\u00e9e suivante"'+(CA.recul<0?'':' disabled')+'>\u203a</button></div>'
      +'<span class="pil-ptbornes">'+_pilPorteeBornes(CA.d0,CA.d1)+'</span>';
  } else {
    h+='<button type="button" class="pil-diag-go ghost" data-diag="exercice">R\u00e9gler l\u2019exercice \u203a</button>';
  }
  return '<button type="button" class="pil-ptres" data-ptres="1" aria-expanded="'+(_pilPtOuvert?'true':'false')+'" aria-controls="pil-ptchoix" aria-label="Vous regardez\u00a0: '+_pilEsc(resume)+'. Changer">'
    +'<span class="pil-ptres-t">'+_pilEsc(resume)+'</span><span class="pil-ptres-c" aria-hidden="true"></span></button>'
    +'<div class="pil-ptchoix" id="pil-ptchoix">'+h+_mvInfoBtn('pil.cadres')+'</div>';
}
// ★ TETE-4C (§579) : le choix de « Vous regardez », déplié ou non au téléphone. Il reste ouvert pendant qu'on choisit (la barre se
//   repeint sans toucher à la ligne) ; un toucher ailleurs dans la page, ou un rendu neuf, le referme.
var _pilPtOuvert=false;
function _pilPtOuvrir(on){
  _pilPtOuvert=!!on;
  var p=document.getElementById('pil-portee'); if(p) p.classList.toggle('pt-ouvert',_pilPtOuvert);
  var b=document.querySelector('#pil-portee [data-ptres]'); if(b) b.setAttribute('aria-expanded',String(_pilPtOuvert));
}
// L'année que lit Économie › Le détail : l'exercice ou l'année vigne. ★ PORTEE-1 (§591) : plus de « campagne » ici —
//   elle se choisit à la pastille du haut, pour tout le Pilotage.
function _pilPorteeMode(){ return (_PIL_SCOPE.cadre==='vig')?'vig':'exo'; }
// Le geste de la barre : il écrit le cadre de l'année par son chemin de toujours, rien d'autre.
function _pilPorteeChoisir(m){ _pilCadreSet(m==='vig'?'vig':'exo'); }
// Les dates de ce qu'on regarde, et le jour où l'on est (jours du calendrier, comme la maquette).
function _pilPorteeBornes(d0,d1,fem){
  if(!d0 || !d1) return '';
  d0=String(d0).slice(0,10); d1=String(d1).slice(0,10);
  var t='du '+_pilEsc(_pilDfr(d0))+' au '+_pilEsc(_pilDfr(d1)), a=_pilAnnOrd(d0), b=_pilAnnOrd(d1), o=_pilAnnOrd(_pilAnAuj());
  if(!isNaN(a) && !isNaN(b) && !isNaN(o) && b>=a){
    if(o<a) t+=' \u00b7 \u00e0 venir';
    else if(o>b) t+=' \u00b7 termin\u00e9'+(fem?'e':'');
    else t+=' \u00b7 '+(o-a+1)+'\u1d49 jour sur '+(b-a+1);
  }
  return t;
}

// ── Le bandeau de Travaux (deux photos de la campagne : _pilPhotosHtml) ──
// Chacune repond a UNE question et emmene a l'ecran qui la detaille. Un chiffre
// dont les entrees sont incompletes porte un drapeau : il ne se tait pas et il
// ne ment pas non plus, il dit qu'il est partiel.
// ★ PORTEE-1 (§591) : _pilExoData (le coût de l'exercice que lisait la photo Budget de l'année) est parti avec elle — le budget
//   de l'année se lit dans Économie (_pilAnBudgetData, _pexData). _pilExoOublier garde son nom : il vide les mémos d'un rendu.
function _pilExoOublier(){ _ECO_RATE_CACHE={k:null,v:0}; _PIL_DIAGC=null; _ECO_TV=null; _PIL_ANB=null; _PIL_ANR=null; }


// ── Le rendu des trois photos ───────────────────────────────────────────────
// ★★ MOTS-8 (§590) — LES PHOTOS PRENNENT LA FORME DES TUILES D'AUJOURD'HUI : le nom (et son point quand le chiffre attend une
//   donnée), le chevron, le chiffre, une barre ou une pastille, deux ou trois mots. La phrase complète d'avant (la méthode, les
//   campagnes à cheval, la date de coupe) reste au survol, dans le titre de la tuile. « voir le détail ›» part : toute la tuile
//   est le bouton, le chevron le dit. Au téléphone, les trois tiennent sur la largeur (elles défilaient, coupées).
// ⚠️ Des <span>, pas des <div> : le contenu d'un <button> est du « phrasing content » en HTML5 (§24).
function _pilPhotoHtml(k,val,unite,vis,sous,cible,drapeau,quest,titre){
  var tt=titre?String(titre).replace(/<[^>]+>/g,''):'';
  return '<button type="button" class="pil-photo" data-pgo="'+cible+'" data-pq="'+quest+'"'+(tt?' title="'+_pilEsc(tt)+'"':'')+'>'
    +'<span class="k"><span class="kn">'+k+(drapeau||'')+'</span>'+_mvIcon('chevron',16)+'</span>'
    +'<span class="v">'+val+(unite?'<span class="u">'+unite+'</span>':'')+'</span>'
    +(vis?'<span class="x">'+vis+'</span>':'')
    +'<span class="s">'+sous+'</span></button>';
}
function _pilPhBar(p){ p=Math.max(0,Math.min(100,Math.round(Number(p)||0))); return '<span class="pil-tv-br" role="img" aria-label="'+p+' %"><i style="width:'+p+'%"></i></span>'; }
function _pilPhPl(txt,cls){ return '<span class="pil-tv-pl'+(cls?' '+cls:'')+'">'+txt+'</span>'; }
function _pilFlag(g,titre){
  var c=(g==='r')?'var(--rouge)':(g==='o'?'var(--orange)':'#4A9FC8');
  // MOTS-8 (§590) : un point, plus un « ! » — le mot est dans l'étiquette (lu par les lecteurs d'écran) et au survol.
  return '<span class="pil-flag" role="img" style="background:'+c+'" title="'+_pilEsc(titre)+'" aria-label="'+_pilEsc(titre)+'"></span>';
}
function _pilPhotosHtml(){
  // ★★★ PORTEE-1 (§591) — LE BANDEAU DE TRAVAUX LIT LA CAMPAGNE, COMME LES CARTES DESSOUS. Il lisait « Vous regardez » (l'exercice
  //   par défaut : 1 869 h, le renfort de l'année, 58 k€ sortis) pendant que l'Avancement, la charge et les échéances comptaient la
  //   campagne (1 123 h) : deux échelles sur un écran (§590e). Ses chiffres de l'ANNÉE vivent là où l'année est le sujet : le
  //   renfort à prévoir dans L'équipe & le matériel, le budget de l'année dans Économie › Le détail.
  //   La tuile « Travaux » part : ses heures et son pourcentage sont dans la phrase du haut et dans « Avancement », juste dessous
  //   (un chiffre une fois par écran). Restent l'équipe au pic et le budget de la campagne — les mêmes chiffres qu'Aujourd'hui.
  var DG=_pilDiag();
  function drap(quoi){
    var l=DG.filter(function(d){ return d.touche && d.touche.indexOf(quoi)>=0; });
    if(!l.length) return '';
    var g=l.some(function(d){return d.g==='r';})?'r':(l.some(function(d){return d.g==='o';})?'o':'b');
    return _pilFlag(g, l.length+' chose'+(l.length>1?'s':'')+' \u00e0 compl\u00e9ter \u2014 touchez pour voir');
  }
  // ÉQUIPE AU PIC — le pic de la campagne lue (_pilPicPortee, la définition unique) : celui des semaines qui restent d'abord
  //   (on ne renforce pas pour une semaine faite), le pic passé s'il n'en reste aucune. La carte « Équipe au pic » de L'équipe & le matériel lit le même.
  var PP=null; try{ PP=_pilPicPortee(_pilSaisonNom()); }catch(eP){ PP=null; if(window._mvAvale) window._mvAvale(eP,'pilotage.js/_pilPhotosHtml#pic'); }
  var fE=drap('effectif'), pEff;
  if(PP && PP.ok){
    var A=PP.av||null, S=A||PP, man=A?(A.manque||0):0, sem=S.picW?_pilSemLabO(S.picW.o0):'';
    if(man>0.05 && !fE) fE=_pilFlag('o','Il manquera '+_pilUn(man)+' personne(s) au pic');
    pEff=_pilPhotoHtml('\u00c9quipe au pic',_pilUn(S.pic),' pers.',
      _pilPhPl(man>0.05?('+'+_pilUn(man)+' \u00e0 pr\u00e9voir'):(A?'l\u2019\u00e9quipe suffit':'pic pass\u00e9'), man>0.05?'or':(A?'ok':'')),
      sem,'equ',fE,'effectif','Personnes n\u00e9cessaires la semaine la plus charg\u00e9e de la campagne'+(A?' (parmi celles qui restent)':'')+', face \u00e0 l\u2019\u00e9quipe pr\u00e9vue au planning cette semaine-l\u00e0');
  } else pEff=_pilPhotoHtml('\u00c9quipe au pic','\u2014','','','aucune semaine mesur\u00e9e','equ',fE,'effectif','');
  // BUDGET — l'engagé de la campagne face à son budget : _pecData, les chiffres de la tuile Budget d'Aujourd'hui.
  var E=null; try{ E=_pecData(); }catch(eE){ E=null; if(window._mvAvale) window._mvAvale(eE,'pilotage.js/_pilPhotosHtml#budget'); }
  var fB=drap('budget'), pBud;
  var bud=E?(Number(E.budget)||0):0, dep=E?(Number(E.engage)||0):0;
  if(E && E.configured && bud>0){
    pBud=_pilPhotoHtml('Budget',_pilNb(dep),'\u00a0\u20ac',_pilPhBar(dep/bud*100),'engag\u00e9 \u00b7 budget '+_pilNb(bud)+'\u00a0\u20ac','eco',fB,'budget',
      'Engag\u00e9 sur la campagne (main-d\u2019\u0153uvre, tracteur, carburant, phyto) face \u00e0 son budget \u2014 les chiffres de la tuile Budget d\u2019Aujourd\u2019hui');
  } else pBud=_pilPhotoHtml('Budget','\u2014','','','ne se calcule pas','eco',fB||_pilFlag('r','Ouvrez \u00c9conomie pour voir ce qui bloque'),'budget','');
  return '<div class="pil-photos pil-tv-tu pil-tv-tu2">'+pEff+pBud+'</div>';
}
function _pilNb(v){ v=Math.round(Number(v)||0); return String(v).replace(/\B(?=(\d{3})+(?!\d))/g,'\u00a0'); }
function _pilUn(v){ return (Math.round((Number(v)||0)*10)/10).toString().replace('.',','); }

// Repeint la barre de portee sans reconstruire la page. Appelee au clic sur une
// campagne : la portee change, le fil et les photos suivent — c'est tout l'objet.
function _pilPortee(){
  _pilExoOublier(); _pilCdVueOublier();
  var c=document.getElementById('pil-crumb'); if(c) c.innerHTML=_pilCrumbHtml();
  var p=document.getElementById('pil-photos-host'); if(p) p.innerHTML=_pilPhotosHtml();
  // Le compte des manques se repeint AUSSI : un bouton fige sur l'ancien
  // nombre apres une correction, c'est un ecran qui se contredit.
  var b=document.getElementById('pil-diagbtn-host'); if(b) b.innerHTML=_pilDiagBtnHtml();
  _pilStickyH();
}
// La hauteur du fil d'Ariane est une DONNEE DE MISE EN PAGE, pas une constante.
// Mesuree a chaque rendu et a chaque redimensionnement ; les onglets s'y calent.
function _pilStickyH(){
  var p=document.getElementById('pil-portee'); if(!p) return;
  var h=Math.round(p.getBoundingClientRect().height)||0;
  try{ document.documentElement.style.setProperty('--pil-portee-h', h+'px'); }
  catch(e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'sticky: hauteur du fil'}); }
}
// ★ COLLE-1 (§412) — le bas du bandeau du Pilotage, MESURÉ. TETE-2 (§329) en a fait un vrai .mod-header, collant à top:0
//   au-dessus de tout (z-index 80) : la barre d'onglets, collante elle aussi à top:0, passait dessous. Elle se cale désormais
//   sous lui (styles.css, sur ordinateur et tablette), et le cockpit y cale sa colonne de droite (cockpit-vue.js, colleHaut).
//   Reposé à chaque affichage et dès que le bandeau change de taille ; une page cachée (hauteur 0) ne l'écrase pas.
var _pilEnteteObs=null;
function _pilEnteteBas(){
  var hd=document.querySelector('#page-pilotage .mod-header'); if(!hd) return;
  try{
    var h=hd.getBoundingClientRect().height; if(!h) return;
    var b=Math.round((parseFloat(getComputedStyle(hd).top)||0)+h);
    document.documentElement.style.setProperty('--pil-entete-bas', b+'px');
  }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilEnteteBas'); }
}
// L'observateur se branche ici seulement, jamais depuis son propre rappel (observe() relance un premier rappel : la boucle).
function _pilEnteteSuivre(){
  _pilEnteteBas();
  var hd=document.querySelector('#page-pilotage .mod-header'); if(!hd || !('ResizeObserver' in window)) return;
  if(!_pilEnteteObs) _pilEnteteObs=new ResizeObserver(function(){ _pilEnteteBas(); });
  _pilEnteteObs.disconnect(); _pilEnteteObs.observe(hd);
}
window._pilPortee = _pilPortee;


// ════════════════════════════════════════════════════════════════════════════
// LE MOTEUR DE DIAGNOSTIC
// Le module comptait vingt-neuf impasses : du texte qui disait « Reglages ›
// Saisons » sans AUCUN lien, et qu'on ne decouvrait qu'en ouvrant l'onglet qui
// le contenait. Ici, une seule liste, trois gravites, et un bouton qui emmene
// a l'endroit exact.
//
//   'r' BLOQUANT   le chiffre ne se calcule pas. Il affiche un tiret.
//   'o' FAUSSANT   le chiffre SORT, mais faux ou partiel. Le plus dangereux :
//                  un indicateur bati sur un signal partiel ment avec
//                  l'autorite d'une mesure.
//   'b' AMELIORABLE le chiffre est juste, il serait plus fin.
//
// ⚠️ Chaque constat porte : ce qui manque, CE QUE CA FAUSSE, et ou aller.
//    Un diagnostic qui dit seulement « il manque X » laisse le lecteur juger
//    de l'urgence sans les elements.
// ⚠️ `touche` relie le constat aux photos. Un chiffre dont les entrees sont
//    incompletes porte un drapeau — il ne se tait pas, et il ne ment pas.
// ════════════════════════════════════════════════════════════════════════════
// ★★ UNE CIBLE INTERNE AU MODULE. Le constat « vendange a cheval » portait
//   `cible:'saisons'` : son bouton « Voir les deux cadres » ouvrait Reglages ›
//   Campagne et faisait clignoter la liste des periodes. Le libelle promettait un
//   ecran, le doigt en obtenait un autre. Le panneau vit ICI, au niveau ①.
var _PIL_DIAG_CIBLES = {
  saisons:   ['reglages','domaine','set-sec-saisons'],
  // ★ Les réglages de la Vigne et du Tracteur vivent dans la roue crantée de leur
  //   module (lot NAV-1) : on ouvre le module, puis sa roue, puis on fait
  //   clignoter le bloc — qui a gardé son id en changeant d'hôte.
  taches:    ['home',    'vigne',  'set-sec-taches',   '_mvReglOpen'],
  dens:      ['home',    'vigne',  'set-sec-dens',     '_mvReglOpen'],
  secteurs:  ['home',    'vigne',  'set-sec-secteurs', '_mvReglOpen'],
  equipe:    ['reglages','equipe', 'set-sec-equipe'],
  planning:  ['planning', null, null],   // TENS-1 (§215) : la carte « Tension de l’équipe »
  tracteurs: ['tracteur','tracteur','set-sec-tracteurs','_mvReglOpen'],
  tracact:   ['tracteur','tracteur','set-sec-act-trac','_mvReglOpen'],   // MOTS-8 (§590) : « Régler » du tracteur sans barème — ses activités
  parcelles: ['parcelles',null,null],
  journal:   ['journal',null,null],     // MOTS-3 (§584) : les heures payées sans validation se valident au Journal
  // ★ PREMIERE CIBLE HORS DES REGLAGES. « Cuve GNR a renseigner (Tracteur ›
  //   Entretien) » etait du TEXTE MORT : il fallait lire, retenir, sortir du
  //   module, retrouver l'onglet. Le 4e element nomme le commutateur du module
  //   vise ; absent, on garde switchReglTab et les sept cibles au-dessus ne
  //   changent pas d'un iota.
  entretien: ['tracteur','entretiens',null,'switchTracOnglet'],
  phyto:     ['phyto',null,null],
  // La Reserve utilise son propre commutateur, _rsvTabTo, qui prend la CLE de
  // l'onglet ('futs' | 'intrants' | 'depenses' | 'audit').
  reserve:   ['reserve','intrants',null,'_rsvTabTo']
};

// Defile jusqu'au bloc et le fait clignoter une seconde. Sans le clignotement, on
// arrive sur un ecran dense sans savoir ce qu'on venait y faire. Extrait de _pilGo :
// la cible interne « les deux cadres » en a besoin aussi.
function _pilFlash(el){
  if(!el) return;
  try{
    el.scrollIntoView({behavior:'smooth',block:'center'});
    el.style.transition='box-shadow .25s';
    el.style.boxShadow='0 0 0 3px var(--or)';
    setTimeout(function(){ el.style.boxShadow=''; }, 1400);
  }catch(e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'flash'}); }
}
// Ouvre la page, bascule sur le bon onglet, fait defiler jusqu'au bloc, et le
// fait clignoter une seconde. Sans le clignotement, on arrive sur un ecran
// dense sans savoir ce qu'on venait y faire.
// Une carte qu'un raccourci vient montrer : ouverte, et ENREGISTRÉE ouverte (le geste du toucher, _pilBindContent) — renderPilotage
//   relit l'état mémorisé, un simple `collapsed[id]=0` ne survivait pas au changement d'onglet. Avant le premier rendu du module
//   (un lien qui arrive pendant que le Pilotage se charge), l'état n'est pas encore lu : on le lit ici.
// Montre une carte qu'on vient d'ouvrir : son haut JUSTE SOUS les barres collantes (l'en-tête, la ligne d'écran, les onglets — la
//   mesure de cockpit-vue.js/colleHaut, sans .pil-tabsbar : les onglets vivent dans l'en-tête depuis TETE-4C), puis un clignotement. _pilFlash centre : la carte du renfort ouverte est plus
//   haute que l'écran, son titre passait sous les barres (vu sur la capture de la démo, ordinateur).
function _pilVersCarte(t){
  if(!t) return;
  try{
    var bas=0;
    document.querySelectorAll('#page-pilotage .mod-header, #page-pilotage .pil-portee').forEach(function(el){
      var cs=getComputedStyle(el), h=el.getBoundingClientRect().height;
      if(h&&(cs.position==='sticky'||cs.position==='fixed')) bas=Math.max(bas,(parseFloat(cs.top)||0)+h);
    });
    t.style.scrollMarginTop=(Math.round(bas)+12)+'px';
    t.scrollIntoView({behavior:'smooth',block:'start'});
    t.style.transition='box-shadow .25s'; t.style.boxShadow='0 0 0 3px var(--or)';
    setTimeout(function(){ t.style.boxShadow=''; }, 1400);
  }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilVersCarte'); }
}
function _pilDeplier(id){ if(!_PIL_STATE) _PIL_STATE=_pilLoadState(); if(!_PIL_STATE) return; if(!_PIL_STATE.collapsed) _PIL_STATE.collapsed={}; if(_PIL_STATE.collapsed[id]){ _PIL_STATE.collapsed[id]=0; _pilSaveState(_PIL_STATE); } }
window._pilGo = function(cible){
  try{
    // Cible INTERNE : on ne quitte pas le module, on change de niveau.
    if(cible==='an_cadres'){
      // PIL-RANGE-2b (§444) : les avis du cadre sont en tête de la Synthèse d'Économie ; sans avis, la barre qui choisit le cadre.
      if(_PIL_TAB!=='eco' || _PEC_SUB!=='syn'){ _PIL_TAB='eco'; _pilSaveTab('eco'); _PEC_SUB='syn'; _pecSaveSt(); renderPilotage(); }
      setTimeout(function(){ _pilFlash(document.getElementById('pil-an-cadres')||document.getElementById('pil-crumb')); }, 240);
      return;
    }
    // Cible INTERNE (ALIGN-1, §236) : la carte « Protection restante » montre les 5 parcelles les plus
    //   urgentes ; son bouton déplie les autres, ou les replie.
    if(cible==='prot_tout'){ _PIL_PROT_TOUT=!_PIL_PROT_TOUT; renderPilotage(); return; }
    // Cible INTERNE (PRIO-1, §235) : l'éditeur de la priorité du moment (administrateur), depuis la carte
    //   « Tâche prioritaire » — quand plusieurs tâches sont dans leurs dates en même temps, ou pour la changer.
    if(cible==='priorite'){
      if(typeof window.openPriorityEdit==='function') window.openPriorityEdit();
      else if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'diag: openPriorityEdit absent'});
      return;
    }
    // Cible INTERNE (MANQUE-1, §357) : la feuille des comptes (COMPTE-1, §353 — comptes.js), le geste qui chiffre
    //   l'entreplantation. Elle s'ouvre par-dessus le Pilotage, sans quitter le module ; à l'enregistrement,
    //   _cptRafraichir redessine le Pilotage s'il est la page affichée, et le constat se recompte.
    if(cible==='comptes'){
      if(typeof window.openComptes==='function') window.openComptes();
      else if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'diag: openComptes absent'});
      return;
    }
    // Cible INTERNE (PRO-1, §269) : « Voir le détail » de la tension du cockpit — la carte par personne, dans L'équipe.
    // ★ MOTS-9 (§592) : la tension est une carte repliée (« Tension ») — on la déplie, puis on la montre.
    // ★ MOTS-10 (§594) : _pilDeplier ENREGISTRE la carte ouverte — renderPilotage relit l'état mémorisé : venant d'un autre onglet
    //   (« Voir le détail » d'Aujourd'hui), la carte repartait repliée (mesuré : ouverte = false).
    if(cible==='tension'){
      _pilDeplier('tension');
      if(_PIL_TAB!=='equ'){ _PIL_TAB='equ'; _pilSaveTab('equ'); renderPilotage(); } else _pilFillContent(_pilData());
      setTimeout(function(){ _pilFlash(document.querySelector('#pil-content .pil-tile[data-pid="tension"]')); }, 260);
      return;
    }
    // Cible INTERNE (INACTION-1, §218) : Décider, ou vit le simulateur de renfort.
    // ★ MOTS-10 (§594) : la carte arrive repliée — « Simuler un renfort » ne la dépliait pas : on atterrissait sur la tournée.
    if(cible==='renfort'){
      _pilDeplier('renfort');
      if(_PIL_TAB!=='sim'){ _PIL_TAB='sim'; _pilSaveTab('sim'); renderPilotage(); } else _pilFillContent(_pilData());
      setTimeout(function(){ _pilVersCarte(document.querySelector('#pil-content .pil-tile[data-pid="renfort"]')); }, 260);
      return;
    }
    // Cible INTERNE : l'Exercice de l'Economie, sur l'axe atelier.
    if(cible==='exercice'){
      var _ch=false;
      if(_PIL_TAB!=='eco'){ _PIL_TAB='eco'; _pilSaveTab('eco'); _ch=true; }
      if(_PEC_SUB!=='exe'){ _PEC_SUB='exe'; _ch=true; }
      if(_PEC_AXE!=='ate'){ _PEC_AXE='ate'; _ch=true; }
      if(_ch){ _pecSaveSt(); renderPilotage(); }
      return;
    }
    var C=_PIL_DIAG_CIBLES[cible]; if(!C) return;
    if(window.goTo) window.goTo(C[0]);
    setTimeout(function(){
      try{
        var _sw = C[3] || 'switchReglTab';
        if(C[1] && typeof window[_sw]==='function') window[_sw](C[1]);
        if(!C[2]) return;
        _pilFlash(document.getElementById(C[2]));
      }catch(e2){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'diag: ancre '+cible}); }
    }, 240);
  }catch(e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'diag: navigation '+cible}); }
};

function _pilDiagJours(t){ return Math.max(1,(t[1]-t[0])+1); }

// ★★★ LE BAREME D'UNE TACHE VIT DANS `t.hha`, PAS DANS `t.h_ha`.
// ⚠️⚠️ Le constat « N taches sans bareme h/ha » testait `parseFloat(t.h_ha)`.
//   Ce champ n'existe sur AUCUNE tache : `h_ha` ne vit que sur TRAVAUX[] (la
//   table calculee, ecrite par calcHeures) et sur les ACTIVITES tracteur
//   (a.h_ha). Sur une tache, il rend `undefined` — donc le test etait vrai pour
//   TOUT LE MONDE, et le constat se declenchait sur 100 % des taches de la
//   periode consultee, y compris celles dont le bareme etait rempli. Sur une
//   periode a une seule tache, il annonce « 1 tache sans bareme » : plausible,
//   et faux. MEME FAMILLE QUE CONFIG.ecartRang (§34d) : un champ suppose,
//   jamais verifie contre le code qui l'ecrit.
// Les quatre formes de bareme, dans l'ordre ou calcHeures les lit :
//   simple / niveaux : t.hha porte deja le total (Relevage : somme des niveaux)
//   passages         : t.passagesHha[] quand chaque passage a son propre taux
//   trous (tariere)  : pas de h/ha du tout — le poids vient des trous plantes
function _pilTacheHha(t){
  if(!t) return 0;
  var h=parseFloat(t.hha); if(h>0) return h;
  if(t.niveaux && t.niveaux.length){
    var sN=0; t.niveaux.forEach(function(n){ sN+=parseFloat(n&&n.hha)||0; });
    if(sN>0) return sN;
  }
  if(t.passagesHha && t.passagesHha.length){
    var sP=0; t.passagesHha.forEach(function(v){ sP+=parseFloat(v)||0; });
    if(sP>0) return sP;
  }
  // Pilotee par la tariere : elle pese ses trous x minutes/trou. Pas de bareme
  // h/ha a reclamer — en exiger un serait demander une donnee qui n'existe pas.
  if(t.trous || t.nom==='Entreplantation'){
    var np=(typeof window._plantPlanTrous==='function')?(window._plantPlanTrous(t.nom)||0):0;
    if(np>0) return 1;
  }
  return 0;
}

// La liste des constats. Chacun est calcule sur les donnees reelles ; aucun
// n'est ecrit en dur, et aucun n'apparait quand il n'a pas lieu d'etre.
// ★ Mémoïsé le temps d'un rendu : la liste est lue par le bandeau, les photos,
//   la feuille et désormais la carte d'Économie. _pilExoOublier l'oublie.
var _PIL_DIAGC=null;
function _pilDiag(){
  if(_PIL_DIAGC) return _PIL_DIAGC;
  var out=[], i;
  var ann=null; try{ ann=_pilAnnuelData(); }catch(e){ ann=null; }

  // ── Les periodes ─────────────────────────────────────────────────────────
  var sais=(window.SAISONS||[]);
  var sansDates=sais.filter(function(p){ return p && (!p.debut||!p.fin); });
  if(sansDates.length) out.push({ g:'r', cible:'saisons', touche:['travaux','effectif','budget'],
    k:sansDates.length+' p\u00e9riode'+(sansDates.length>1?'s':'')+' sans dates',
    f:'<b>'+_pilEsc(sansDates.map(function(p){return p.nom;}).join(', '))+'</b> n\u2019a pas de date de d\u00e9but ou de fin. '
     +'Sans fen\u00eatre, la charge ne se calcule pas : ces travaux ne p\u00e8sent <b>rien</b>.',
    ou:'R\u00e9glages \u203a Campagne' });

  if(ann && ann.trous && ann.trous.length){
    var j=0; ann.trous.forEach(function(t){ j+=_pilDiagJours(t); });
    out.push({ g:'r', cible:'saisons', touche:['travaux','budget'],
      k:'Trou de '+j+' jour'+(j>1?'s':'')+' dans le calendrier',
      f:ann.trous.length+' fen\u00eatre'+(ann.trous.length>1?'s':'')+' de l\u2019exercice n\u2019'+(ann.trous.length>1?'ont':'a')+' aucune p\u00e9riode. '
       +'Le travail de ces jours n\u2019est compt\u00e9 <b>nulle part</b> : ni dans la charge, ni dans le budget, ni dans l\u2019avancement.',
      ou:'R\u00e9glages \u203a Campagne' });
  }

  // ⚠️⚠️ CONSTAT SUPPRIME (12/08/2026) : « N periodes se chevauchent — les
  //   jours communs sont comptes deux fois, les heures et le cout sont gonfles
  //   d'autant ». C'ETAIT FAUX. _chargeSaisonData (planning.js) calcule la
  //   charge d'une periode sur les taches de SA liste (s.taches), jamais sur
  //   ses jours : deux periodes qui partagent des dates ne partagent aucune
  //   heure. Le constat accusait le calendrier du domaine d'une faute que le
  //   calcul ne commet pas, en orange « le chiffre sort, mais faux » — et il
  //   poussait a redecouper des periodes justes pour faire taire une alerte.
  //   ★★★ ON COMPTE LES TACHES, PAS LES JOURS. Le chevauchement de calendrier
  //   reste DIT, en gris, sous la frise annuelle (_pilPanelEtp) : c'est une
  //   information de lecture, pas un defaut a corriger.
  //   ⚠️ Ne pas le reintroduire sous une autre forme sans avoir d'abord
  //   mesure un double comptage reel sur les donnees.

  // ── Le cadre de l'annee ──────────────────────────────────────────────────
  // ⚠️ CE CONSTAT A CHANGE DE NATURE (12/08/2026). Il disait « exercice mal
  //    aligne » en orange, c'est-a-dire « votre chiffre est faux, corrigez ».
  //    Faux conseil : un exercice comptable est fixe par le comptable. Une
  //    vendange qui ouvre l'annee n'est PAS un defaut, c'est un calendrier —
  //    et ce constat-la disparait completement.
  //    Reste le seul fait utile : quand la borne TRAVERSE la vendange, la
  //    recolte est repartie sur deux bilans. Ca ne se corrige pas, ca se sait.
  //    Gravite 'b' : le chiffre est juste, on aide seulement a le lire.
  if(ann && ann.align && ann.align.coupe && ann.vend && ann.ex){
    var J=_pilAnnSplitVend(ann);
    out.push({ g:'b', cible:'an_cadres', touche:['budget'],
      k:'Votre vendange est \u00e0 cheval sur deux exercices',
      f:'Sur ses <b>'+J.total+' jours</b>, <b>'+J.dedans+'</b> tombent dans cet exercice et <b>'+J.dehors+'</b> dans le suivant. '
       +'Le co\u00fbt de la r\u00e9colte se lit donc sur <b>deux bilans</b>. Ce n\u2019est pas une erreur\u00a0: '
       +'c\u2019est votre calendrier comptable, et il n\u2019y a rien \u00e0 corriger \u2014 seulement \u00e0 le savoir.',
      ou:'Voir le cadre de l\u2019ann\u00e9e' });
  }

  // ── Le cout ──────────────────────────────────────────────────────────────
  var P=null; try{ P=_pecData(); }catch(e){ P=null; }
  // ★★ UNE SEULE LISTE (lot PIL-DIAG, 10/09/2026). La carte « Ce qu'il faut regarder »
  //   d'Économie tenait sa propre liste (_pecZeros) : « poste compté pour zéro »
  //   ici, « chose à compléter » là, deux moteurs, deux vocabulaires, le même taux
  //   horaire manquant nommé de deux façons. Les postes à zéro sont désormais des
  //   constats de CE moteur, marqués `zero:true` ; la carte d'Économie relit
  //   _pilDiag() filtré sur `budget` — mêmes mots, mêmes boutons, même compte.
  if(P && !P.hasRate) out.push({ g:'r', cible:'equipe', touche:['budget'], zero:true, poste:'Main-d\u2019\u0153uvre',
    k:'Aucun taux horaire',
    f:'Sans taux dans les fiches salari\u00e9s, la <b>main-d\u2019\u0153uvre compte pour z\u00e9ro</b> \u2014 le premier poste du domaine. Le budget affich\u00e9 est un plancher.',
    ou:'R\u00e9glages \u203a \u00c9quipe' });
  else if(P && P.tot && P.tot.nSansTaux>0) out.push({ g:'o', cible:'equipe', touche:['budget'],
    k:P.tot.nSansTaux+' fiche'+(P.tot.nSansTaux>1?'s':'')+' sans taux horaire',
    f:'Leurs heures comptent dans l\u2019effectif mais <b>pas dans le co\u00fbt</b>. La masse salariale affich\u00e9e est un plancher, pas une mesure.',
    ou:'R\u00e9glages \u203a \u00c9quipe' });
  // ── Les dates de contrat (PRES-1, 26/09/2026) ─────────────────────────────
  //   Tout salarie a des dates de contrat. Sans elles, la regle de presence
  //   (utils.js, _mvCompteSansDate) ne peut que deviner : une fiche ACTIVE compte
  //   toute l'annee, une fiche INACTIVE ne compte plus (sauf les annees ou elle a
  //   des heures au planning). Le constat dit lesquelles, et ou les completer.
  var sansDate=(window.MEMBRES||[]).filter(function(m){
    return m && m.nom && typeof window._mvSansDateContrat==='function' && window._mvSansDateContrat(m);
  });
  if(sansDate.length) out.push({ g:'o', cible:'equipe', touche:['effectif','budget'],
    k:sansDate.length+' fiche'+(sansDate.length>1?'s':'')+' sans date de contrat',
    f:'<b>'+_pilEsc(sansDate.slice(0,4).map(function(m){return m.nom;}).join(', '))
     +(sansDate.length>4?(' et '+(sansDate.length-4)+' autre'+(sansDate.length-4>1?'s':'')):'')
     +'</b> n\u2019'+(sansDate.length>1?'ont':'a')+' aucune date de contrat. '
     +'Une fiche active sans date compte comme pr\u00e9sente <b>toute l\u2019ann\u00e9e</b>\u00a0; une fiche inactive sans date '
     +'<b>ne compte plus</b>, sauf les ann\u00e9es o\u00f9 elle a des heures au planning. '
     +'L\u2019effectif et la masse salariale en d\u00e9pendent\u00a0: posez la date de d\u00e9but, et la date de fin s\u2019il y a lieu.',
    ou:'R\u00e9glages \u203a \u00c9quipe' });
  if(P && !P.hasGnr) out.push({ g:'o', cible:'entretien', touche:['budget'], zero:true, poste:'Carburant',
    k:'Prix du GNR inconnu',
    f:'Aucun appoint de cuve saisi\u00a0: le <b>carburant compte pour z\u00e9ro</b>, sur la campagne comme sur l\u2019exercice. Le prix se d\u00e9duit des pleins not\u00e9s dans Tracteur \u203a Entretien.',
    ou:'Tracteur \u203a Entretien' });
  // ★ MANQUE-1 (§357) : « aucune ligne dosée » ne veut rien dire sans ligne du tout. Une période sans traitement (tout
  //   l'hiver) met les produits à zéro parce qu'on n'en a pas mis : un zéro JUSTE, pas un trou — aucun constat. Il ne
  //   parle que si la période a des traitements et qu'aucun n'a de dose chiffrée. Remonté du terrain : « pour le
  //   traitement phyto tout est ok, je ne comprends pas la phrase » — il s'affichait en plein hiver.
  if(P && P.phy && P.phy.nLignes>0 && !P.phy.anyDose) out.push({ g:'o', cible:'phyto', touche:['budget'], zero:true, poste:'Produits phyto',
    k:'Traitements sans dose chiffr\u00e9e',
    f:'Les traitements de cette p\u00e9riode n\u2019ont <b>aucune dose chiffr\u00e9e</b>\u00a0: les <b>produits comptent pour z\u00e9ro</b> dans le co\u00fbt. La dose se saisit avec le traitement, le prix dans La R\u00e9serve.',
    ou:'Phyto \u203a Registre' });
  else if(P && P.phy && P.phy.unpriced && P.phy.unpriced.length) out.push({ g:'o', cible:'reserve', touche:['budget'], zero:true, poste:'Produits phyto',
    k:P.phy.unpriced.length+' produit'+(P.phy.unpriced.length>1?'s':'')+' sans prix unitaire',
    f:'Leur dose est connue, pas leur prix\u00a0: ces traitements <b>comptent pour z\u00e9ro</b>. Le prix se pose dans La R\u00e9serve, sur l\u2019achat.',
    ou:'La R\u00e9serve \u203a Intrants' });

  // ── Les consommables : quand la repartition cesse de vouloir dire ────────
  // ⚠️⚠️ LECON DU CONSTAT SUPPRIME LE 12/08 (« N periodes se chevauchent ») : il
  //   accusait le calendrier d'une faute que le calcul ne commettait pas, et il
  //   poussait a defaire des periodes justes pour faire taire une alerte. Ces
  //   trois constats-ci ne decrivent QUE des faits mesures sur les donnees, et
  //   chacun dit ce qu'il faut faire — jamais « votre chiffre est bizarre ».
  var X=null; try{ X=_pexData(_pexEx(), true); }catch(e){ X=null; }
  if(X && X.ateT>0){
    // 1) Le seau « non affecte ». Le total reste JUSTE ; c'est la comparaison
    //    entre ateliers qui devient hasardeuse quand un cinquieme des euros
    //    n'est range nulle part. Gravite 'o' : le chiffre sort, mais il ne dit
    //    pas ce qu'on croit qu'il dit.
    // ⚠️ Le seuil est a 20 %, pas a 10 : les achats d'un domaine qui demarre
    //   portent tous les categories historiques (phyto, oeno) et tombent donc
    //   d'eux-memes dans un atelier. Un seuil bavard aurait appris a ignorer la
    //   liste — le defaut le plus couteux qu'un diagnostic puisse avoir.
    var _naPct=(X.ateEur&&X.ateEur.gen>0)?(X.ateEur.gen/X.ateT*100):0;
    if(_naPct>=20) out.push({ g:'o', cible:'reserve', touche:['budget'],
      k:Math.round(_naPct)+'\u00a0% des consommables sans atelier',
      f:'<b>'+_pilEsc(_ecoEur(X.ateEur.gen))+'</b> ne sont rattach\u00e9s ni \u00e0 la vigne, ni \u00e0 la cave, '
       +'ni au tracteur. Le total reste juste, mais <b>comparer les ateliers entre eux ne veut plus dire '
       +'grand-chose</b> tant qu\u2019une part pareille reste de c\u00f4t\u00e9. Ces achats portent la cat\u00e9gorie '
       +'\u00ab\u00a0G\u00e9n\u00e9ral\u00a0\u00bb\u00a0: en changer la range dans le bon atelier, sans rien resaisir.',
      ou:'La R\u00e9serve \u203a Intrants' });

    // 2) Les lignes muettes. Elles ne faussent pas la repartition : elles la
    //    RETRECISSENT. Un poste peut sembler petit parce que ses factures ne
    //    sont pas chiffrees, pas parce qu'il coute peu.
    var _mu=(X.nAchSansPrix||0)+(X.nRepSansPrix||0);
    if(_mu>0) out.push({ g:'o', cible:'reserve', touche:['budget'],
      k:_mu+' ligne'+(_mu>1?'s':'')+' d\u2019achat sans prix',
      f:'Elles comptent pour <b>z\u00e9ro euro</b> dans la r\u00e9partition. Un atelier peut donc para\u00eetre '
       +'bon march\u00e9 simplement parce que ses factures ne sont pas chiffr\u00e9es. Le prix est facultatif '
       +'\u2014 mais tant qu\u2019il manque, <b>le total est un plancher, pas une mesure</b>.',
      ou:'La R\u00e9serve \u203a Intrants' });

    // 3) L'invariant. Il ne doit JAMAIS casser — et s'il casse, il doit se voir
    //    a l'ecran plutot que de se taire, comme la pastille « i » sans fiche.
    //    Un ecart signifie qu'un euro est compte deux fois, ou pas du tout.
    var _sm=(X.achT||0)+(X.gnrT||0)+(X.repT||0);
    if(Math.abs(X.ateT-_sm)>=0.005) out.push({ g:'r', cible:'exercice', touche:['budget'],
      k:'La r\u00e9partition par atelier ne tombe pas juste',
      f:'La somme des ateliers (<b>'+_pilEsc(_ecoEur(X.ateT))+'</b>) devrait valoir exactement '
       +'celle des sources (<b>'+_pilEsc(_ecoEur(_sm))+'</b>). L\u2019\u00e9cart signifie qu\u2019un euro est '
       +'compt\u00e9 <b>deux fois, ou pas du tout</b>. C\u2019est un d\u00e9faut de l\u2019application, pas de vos '
       +'donn\u00e9es\u00a0: signalez-le, ne corrigez rien.',
      ou:'\u00c9conomie \u203a Exercice' });
  }

  // ── Les baremes ──────────────────────────────────────────────────────────
  // ★ MANQUE-1 (§357) : trois sortes de tâches, et une seule réclame des heures par hectare.
  //   · Au temps passé (t.tempsReel : arrachage, désherbage manuel, effeuillage, vendange, tâches libres) : PAS de
  //     barème, par nature — le catalogue les dit « hors barème », l'aide « sans barème à l'hectare », et l'écart de
  //     cadence les retire déjà ; leurs heures comptent quand elles sont faites. Les réclamer poussait à taper une
  //     estimation pour faire taire l'alerte — la faute du constat des périodes qui se chevauchent, retiré le 12/08.
  //     Plus de constat. Une estimation saisie quand même (champ facultatif) compte, comme avant (_pilTacheHha).
  //   · Pilotée par les pieds (t.trous / Entreplantation) : AUCUN champ h/ha (roue crantée : « Pas d'h/ha à la
  //     surface ») — le bouton menait à un écran sans rien à corriger. Le geste qui la chiffre est le COMPTE des pieds
  //     marqués (COMPTE-1, §353) : constat à part, bouton vers la feuille des comptes. Rien à dire quand aucune parcelle
  //     n'est concernée — désactivée partout, ou toutes comptées à zéro sans trou : _parcConcern les sort.
  //   · Les autres : un vrai champ resté vide — la roue crantée, comme avant.
  var tks=(typeof window.getTachesSaison==='function')?window.getTachesSaison():(window.TACHES||[]);
  var _parPieds=function(t){ return !!(t&&(t.trous||t.nom==='Entreplantation')); };
  var sansBar=(tks||[]).filter(function(t){ return t && !t.tempsReel && !_parPieds(t) && !(_pilTacheHha(t)>0); });
  if(sansBar.length) out.push({ g:'o', cible:'taches', touche:['travaux','effectif'],
    k:sansBar.length+' t\u00e2che'+(sansBar.length>1?'s':'')+' sans bar\u00e8me h/ha',
    f:'<b>'+_pilEsc(sansBar.slice(0,4).map(function(t){return t.nom;}).join(', '))
     +(sansBar.length>4?(' et '+(sansBar.length-4)+' autre'+(sansBar.length-4>1?'s':'')):'')
     +'</b> n\u2019'+(sansBar.length>1?'ont':'a')+' pas d\u2019heures par hectare. '
     +(sansBar.length>1?'Elles ne p\u00e8sent':'Elle ne p\u00e8se')+' <b>rien</b> dans la charge : le total affich\u00e9 est un plancher.',
    ou:'Roue crant\u00e9e de la Vigne \u203a T\u00e2ches' });
  var sansPieds=(tks||[]).filter(function(t){
    if(!_parPieds(t) || _pilTacheHha(t)>0) return false;
    return (typeof window._parcConcern==='function') ? window._parcConcern(t.nom).length>0 : true;
  });
  if(sansPieds.length){
    var _mt=(typeof window._plantMinTrou==='function')?window._plantMinTrou():3, _np=sansPieds.length>1;
    out.push({ g:'o', cible:'comptes', touche:['travaux','effectif'],
      k:sansPieds.map(function(t){return t.nom;}).join(', ')+'\u00a0: aucun pied compt\u00e9',
      f:(_np?'Elles n\u2019ont':'Elle n\u2019a')+' pas d\u2019heures par hectare\u00a0: '+(_np?'leur':'son')+' temps vient des <b>pieds marqu\u00e9s</b> (ou des trous perc\u00e9s), '
       +String(_mt).replace('.',',')+'\u00a0min par trou. Tant qu\u2019aucun pied n\u2019est compt\u00e9, '+(_np?'elles ne p\u00e8sent':'elle ne p\u00e8se')
       +' <b>rien</b> dans la charge\u00a0: le total affich\u00e9 est un plancher. Une parcelle sans pied \u00e0 remplacer se compte \u00e0 z\u00e9ro.',
      ou:'Saisir les comptes' });
  }

  // ── Les parcelles ────────────────────────────────────────────────────────
  var parc=(window.PARCELLES||[]).filter(function(x){ return x && x.statut!=='Arrachee'; });
  var sansSurf=parc.filter(function(x){ return !(parseFloat(x.surface)>0); });
  if(sansSurf.length) out.push({ g:'r', cible:'parcelles', touche:['travaux','budget'],
    k:sansSurf.length+' parcelle'+(sansSurf.length>1?'s':'')+' sans surface',
    f:'Toute la charge se calcule en heures par hectare. Une parcelle sans surface p\u00e8se <b>z\u00e9ro heure</b>, quel que soit le travail qu\u2019elle demande.',
    ou:'Ouvrir les parcelles' });

  // ── Les ecartements ──────────────────────────────────────────────────────
  // ⚠️ Les ecartements ne sont PAS a la racine de CONFIG : ils vivent dans
  //    CONFIG.vigne.{ec_rang, ec_pied}, ecrits par _tcvSetDens et lus par
  //    _mvVigne(). Ma premiere version testait cfg.ecartRang — un champ qui
  //    n'existe nulle part, donc un constat qui ne se serait JAMAIS declenche.
  //    Un test qui ne peut pas rougir est pire qu'aucun test : il rassure.
  var vg=null; try{ vg=(typeof window._mvVigne==='function')?window._mvVigne():null; }
  catch(e){ vg=null; }
  if(!vg || !(parseFloat(vg.ec_rang)>0) || !(parseFloat(vg.ec_pied)>0))
    out.push({ g:'b', cible:'dens', touche:[],
      k:'\u00c9cartements de plantation absents',
      f:'Sans eux, le bar\u00e8me conseill\u00e9 suppose <b>10 000 pieds/ha</b>. \u00c0 6 000 pieds, il propose environ un tiers d\u2019heures de trop.',
      ou:'Roue crant\u00e9e de la Vigne \u203a Vos plantations' });

  // ── La conformite ────────────────────────────────────────────────────────
  // Sans ce constat, la photo Conformite pourrait porter un drapeau qui ouvre
  // une feuille vide : la question `conf` n'existerait dans aucun `touche`.
  var cu=null; try{ cu=_cfmCuivre(); }catch(e){ cu=null; }
  if(cu && cu.avail && cu.over>0) out.push({ g:'r', cible:'parcelles', touche:['conf'],
    k:cu.over+' parcelle'+(cu.over>1?'s':'')+' au-dessus du plafond de cuivre',
    f:'Le plafond bio est de <b>'+cu.plaf+' kg/ha lisses sur 7 ans</b>. '
     +(cu.over>1?'Ces parcelles le dépassent':'Cette parcelle le dépasse')+' : '
     +'c’est un écart <b>opposable en contrôle</b>, pas un simple indicateur.',
    ou:'Voir les parcelles' });
  else if(cu && cu.avail && cu.warn>0) out.push({ g:'o', cible:'parcelles', touche:['conf'],
    k:cu.warn+' parcelle'+(cu.warn>1?'s':'')+' proche'+(cu.warn>1?'s':'')+' du plafond de cuivre',
    f:(cu.warn>1?'Elles ont':'Elle a')+' dépassé <b>87,5 %</b> des '+cu.plaf+' kg/ha autorisés sur 7 ans. '
     +'Il reste de la marge, mais elle se compte maintenant en un ou deux passages.',
    ou:'Voir les parcelles' });

  // Rangees par ce que ca coute a la justesse : bloquant, puis faussant.
  var R={r:0,o:1,b:2};
  out.sort(function(a,b){ return R[a.g]-R[b.g]; });
  _PIL_DIAGC=out;
  return out;
}

// Le taux de couverture : un seul chiffre honnete plutot que douze avertis-
// sements. Il pese chaque constat par sa gravite, pas par son nombre — dix
// remarques ameliorables ne valent pas un trou dans le calendrier.
function _pilDiagCouverture(L){
  var pen=0, POIDS={r:9,o:5,b:2};
  L.forEach(function(d){ pen+=POIDS[d.g]||0; });
  return Math.max(35, 100-pen);
}


// ── La feuille de diagnostic ────────────────────────────────────────────────
var _PIL_DIAG_GN = { r:['\uD83D\uDD34','Le chiffre ne se calcule pas'],
                     o:['\uD83D\uDFE0','Le chiffre sort, mais faux'],
                     b:['\uD83D\uDD35','Le chiffre est juste, il serait plus fin'] };

function _pilDiagBtnHtml(){
  var L=_pilDiag(), n=L.length;
  if(!n) return '<button class="pil-diagbtn clean" id="pil-diagbtn">\u2713 rien \u00e0 compl\u00e9ter</button>';
  return '<button class="pil-diagbtn'+(L[0].g==='r'?' grave':'')+'" id="pil-diagbtn">\u26A0 '
    +n+' chose'+(n>1?'s':'')+' \u00e0 compl\u00e9ter</button>';
}

// `quoi` restreint aux constats qui touchent UN chiffre : ouvrir la liste
// depuis la photo Budget ne doit pas noyer le lecteur sous les manques qui
// n'entrent pas dans ce calcul-la.
function _pilDiagSheetHtml(quoi){
  var L=_pilDiag();
  if(quoi) L=L.filter(function(d){ return d.touche && d.touche.indexOf(quoi)>=0; });
  var LB={travaux:'les travaux',effectif:'l\u2019effectif',budget:'le budget',conf:'la conformit\u00e9'};
  var h='<div class="pil-diag-h"><div><div class="pil-diag-t">'
    +(quoi?('Ce qui affecte '+(LB[quoi]||'ce chiffre')):'Ce qu\u2019il manque')+'</div>'
    +'<div class="pil-diag-s">'+(quoi
      ? 'Les autres manques n\u2019entrent pas dans ce calcul.'
      : 'Rang\u00e9 par ce que \u00e7a co\u00fbte \u00e0 la justesse de vos chiffres.')+'</div></div>'
    +'<button class="pil-diag-x" id="pil-diag-x" aria-label="Fermer">\u00d7</button></div>';

  if(!quoi){
    var cv=_pilDiagCouverture(_pilDiag());
    h+='<div class="pil-cov"><div class="pil-cov-v">'+cv+' %</div><div class="pil-cov-t">'
      +'<b>Vos chiffres reposent sur '+cv+' % des donn\u00e9es attendues.</b><br>'
      +'<span>Ce qui manque n\u2019est pas un z\u00e9ro, c\u2019est un trou. Un indicateur b\u00e2ti sur un signal '
      +'partiel ment avec l\u2019autorit\u00e9 d\u2019une mesure.</span></div></div>';
  }
  if(!L.length) return h+'<div class="pil-diag-ok">\u2713 Rien ne manque'+(quoi?' pour ce chiffre.':'.')+'</div>';

  h+=L.map(function(d){
    var G=_PIL_DIAG_GN[d.g]||_PIL_DIAG_GN.b;
    // ⚠️ LA BRANCHE `d.exm` A ETE RETIREE. Plus aucun constat ne pose ce champ
    //   depuis que le lot 6 a cesse de prescrire un deplacement de cloture : le
    //   bouton « Décaler l'ouverture » ne pouvait plus s'afficher. Un chemin mort
    //   dans un moteur se remet a mentir des qu'on le relit.
    var act='<button class="pil-diag-go ghost" data-diag="'+_pilEsc(d.cible)+'">'+_pilEsc(d.ou)+' \u203A</button>';
    return '<div class="pil-dl '+d.g+'"><div class="pil-dl-t">'+G[0]+' '+_pilEsc(d.k)+'</div>'
      +'<div class="pil-dl-g">'+G[1]+'</div>'
      +'<div class="pil-dl-f">'+d.f+'</div>'+act+'</div>';
  }).join('');
  return h;
}

function _pilDiagOpen(quoi){
  var w=document.getElementById('pil-diagwrap'); if(!w) return;
  var b=document.getElementById('pil-diagsheet'); if(b) b.innerHTML=_pilDiagSheetHtml(quoi||null);
  var _deja=w.classList.contains('show');
  w.classList.add('show');
  if(!_deja){ if(window._mvHistPush) window._mvHistPush();  /* TOUR-2 : le retour Android ferme cette surface (app.js, _MV_SURFACES) */ }
}
function _pilDiagClose(){
  var w=document.getElementById('pil-diagwrap'); if(w) w.classList.remove('show');
}
window._pilDiagClose=_pilDiagClose;   // TOUR-2 : appelee par le retour Android (app.js)

// ── Paramétrage : carte « objectif » + fenêtres de tâches ──
function _pilObjCard(cd,admin){
  var objIso=_pilObjectifGet();
  var cardCss='background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:16px;padding:16px 18px;margin-bottom:16px';
  var ttlCss='font-weight:600;font-size:var(--pt-md,20px);color:var(--texte)';
  var inCss='border:1px solid var(--gris);border-radius:7px;padding:5px 8px;font-family:var(--font-ui,Outfit);font-size:var(--pt-base,14px);font-weight:600;background:#fff;color:var(--texte)';
  var nom=cd?cd.saison:_pilSaisonNom();
  return '<div style="'+cardCss+'">'
    +'<div style="'+ttlCss+';margin-bottom:4px">\uD83C\uDFAF Objectif de fin des travaux</div>'
    +'<div style="font-size:var(--pt-txt,13px);color:var(--texte-doux);margin-bottom:12px">Date à laquelle vous voulez que toutes les tâches de la saison soient terminées. La marge du tableau de bord compare la projection (cadence réelle) à cette date — indépendante de la fin de saison.</div>'
    +'<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span style="font-size:var(--pt-txt,13px);font-weight:600">Saison '+_pilEsc(nom||'—')+' — terminer pour le</span>'
    +'<input type="date" id="pil-obj-param" value="'+(objIso||'')+'"'+(admin?'':' disabled')+' style="'+inCss+'">'
    +(admin?'':'<span style="font-size:var(--pt-micro,12px);color:var(--texte-doux)">\uD83D\uDD12 admin</span>')+'</div></div>';
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
  var ttlCss='font-weight:600;font-size:var(--pt-md,20px);color:var(--texte)';
  var inCss='width:78px;padding:7px 8px;border:1.5px solid var(--gris-clair);border-radius:9px;font-family:inherit;font-size:var(--pt-base,14px);text-align:right;background:var(--bg-app);color:var(--texte);box-sizing:border-box';
  var dis=admin?'':' disabled';
  // Vide = valeur par defaut : on n'ecrit jamais le defaut en base, il reste dans le lecteur
  // (_ceCfg / _ecoRetardCfg). Le placeholder montre donc la valeur reellement appliquee.
  function row(ico,titre,sous,key,def,unite,step,min,noTop){
    var v=(e[key]!=null&&Number(e[key])>0)?e[key]:'';
    var sep=noTop?'':';margin-top:12px;padding-top:12px;border-top:1px solid var(--gris-clair)';
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap'+sep+'">'
      +'<div style="flex:1;min-width:190px"><div style="font-size:var(--pt-base,14px);color:var(--texte);font-weight:600">'+ico+' '+titre+'</div>'
      +'<div style="font-size:var(--pt-micro,12px);color:var(--texte-doux)">'+sous+'</div></div>'
      +'<span style="display:inline-flex;align-items:center;gap:5px">'
      +'<input type="number" min="'+min+'" step="'+step+'" value="'+v+'" placeholder="'+def+'"'+dis
      +' onchange="window._ecoCfgSet&&window._ecoCfgSet(\'eco\',\''+key+'\',this.value)" style="'+inCss+'">'
      +'<span style="font-size:var(--pt-txt,13px);color:var(--texte-doux)">'+unite+'</span></span></div>';
  }
  var note = admin
    ? 'Ces valeurs chiffrent le <b style="color:var(--texte)">surco\u00fbt de retard</b> par parcelle (onglet \u00c9co &amp; conformit\u00e9) et la carte <b style="color:var(--texte)">\u00ab Renfort \u00bb</b> (onglet D\u00e9cider). Elles ne touchent \u00e0 aucune paie : le retard est <b style="color:var(--texte)">mod\u00e9lis\u00e9, jamais pay\u00e9</b>. Vide = valeur par d\u00e9faut.'
    : ''+_mvIcon('cadenas',16)+' Lecture seule \u2014 seul un administrateur peut modifier ces valeurs. Elles chiffrent le surco\u00fbt de retard par parcelle et le simulateur de renfort. Elles ne touchent \u00e0 aucune paie.';
  return '<div style="'+cardCss+'">'
    +'<div style="'+ttlCss+';margin-bottom:4px">\uD83C\uDF9B\uFE0F Simulation \u00e9conomique</div>'
    +'<div style="font-size:var(--pt-txt,13px);color:var(--texte-doux);margin-bottom:10px;line-height:1.55">'+note+'</div>'
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
  // REV-1 : « Raisin par bouteille » (1,3 kg/col) est retiré — la conversion est celle de
  //   la Cave (kg/hL du Cuvier). Restent deux hypothèses du Revient, dites comme telles.
  pertes_elevage:{ ico:'\uD83C\uDF77', tit:'Pertes d\u2019\u00e9levage',
                 sub:'base des <b>bouteilles probables</b> \u2014 servi tant qu\u2019aucune part des anges n\u2019est mesur\u00e9e',
                 def:'5', unite:'%', step:'0.5', min:'0' },
  autres_charges:{ ic:'euro', tit:'Autres charges de l\u2019ann\u00e9e',
                 sub:'facultatif \u2014 fermage, cave, amortissements, structure\u00a0: donne un <b>co\u00fbt complet indicatif</b>',
                 def:'aucune', unite:'\u20AC', step:'100', min:'0' },
  h_jour:      { ico:'\u23F1\uFE0F', tit:'Journ\u00e9e de r\u00e9f\u00e9rence',
                 sub:'dernier repli des <b>\u00e9ch\u00e9ances par t\u00e2che</b> : sert seulement si le planning ne donne ni pr\u00e9sence mesur\u00e9e ni heures pr\u00e9vues',
                 def:'7', unite:'h / jour', step:'0.5', min:'1' }
};
function _pecHypoVal(key){
  if(key==='h_jour') return _pecHJour();
  if(key==='pertes_elevage') return _pecRevPertesCfg();
  if(key==='autres_charges'){ var a=_pecRevAutres(); return a>0?a:''; }
  return '';
}
function _pecHypoSet(key,v){
  if(!_PEC_HYPO[key]) return;
  if(!(typeof window.isAdmin==='function' && window.isAdmin())) return;
  // Un champ vidé : la perte retombe sur son défaut, les autres charges sur « aucune ».
  if(String(v==null?'':v).trim()===''){ v=(key==='pertes_elevage')?5:(key==='autres_charges'?0:v); }
  var before=((window.CONFIG&&window.CONFIG.eco)||{})[key];
  if(typeof window._ecoCfgSet==='function') window._ecoCfgSet('eco',key,v);
  var after=((window.CONFIG&&window.CONFIG.eco)||{})[key];
  if(String(after)===String(before) && Number(after)!==Number(v)){
    if(window.showToast) window.showToast('R\u00e9glage non enregistr\u00e9 \u2014 mise \u00e0 jour de R\u00e9glages requise','#B85A1A');
    return;
  }
  if(window.showToast) window.showToast('Hypoth\u00e8se mise \u00e0 jour','#3D6B27');
}
window._pecHypoSet=_pecHypoSet;
function _pecHypoRows(admin){
  var inCss='width:78px;padding:7px 8px;border:1.5px solid var(--gris-clair);border-radius:9px;font-family:inherit;font-size:var(--pt-base,14px);text-align:right;background:var(--bg-app);color:var(--texte);box-sizing:border-box';
  return Object.keys(_PEC_HYPO).map(function(k){
    var o=_PEC_HYPO[k];
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid var(--gris-clair)">'
      +'<div style="flex:1;min-width:190px"><div style="font-size:var(--pt-base,14px);color:var(--texte);font-weight:600">'+((o.ic&&typeof _mvIcon==='function')?_mvIcon(o.ic,16):(o.ico||''))+' '+o.tit+'</div>'
      +'<div style="font-size:var(--pt-micro,12px);color:var(--texte-doux)">'+o.sub+'</div></div>'
      +'<span style="display:inline-flex;align-items:center;gap:5px">'
      +'<input type="number" min="'+o.min+'" step="'+o.step+'" value="'+_pecHypoVal(k)+'" placeholder="'+o.def+'"'+(admin?'':' disabled')
      +' onchange="window._pecHypoSet&&window._pecHypoSet(\''+k+'\',this.value)" style="'+inCss+'">'
      +'<span style="font-size:var(--pt-txt,13px);color:var(--texte-doux)">'+o.unite+'</span></span></div>';
  }).join('');
}
function _pilParamBody(d){
  var cd=(window._chargeSaisonData&&window.getSaisonActive)?window._chargeSaisonData(window._pilSaison()):null;
  var admin=(typeof window.isAdmin==='function')&&window.isAdmin();
  var cardCss='background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:16px;padding:16px 18px;margin-bottom:16px';
  var ttlCss='font-weight:600;font-size:var(--pt-md,20px);color:var(--texte)';
  var thCss='text-align:left;font-size:var(--pt-micro,12px);text-transform:uppercase;letter-spacing:.04em;color:var(--texte-doux);padding:6px 8px;border-bottom:1px solid var(--gris-clair)';
  var tdCss='padding:7px 8px;border-bottom:1px solid #F0ECE1';
  if(!cd||!cd.taskWindows||!cd.taskWindows.length){
    return '<div id="pil-param-host">'+_pilObjCard(cd,admin)
      +'<div style="'+cardCss+'"><div style="'+ttlCss+';margin-bottom:8px">Fenêtres des tâches</div>'
      +_pilEmptyGo('Renseignez les dates de la campagne active pour paramétrer les fenêtres de tâches.','saisons','Réglages \u203A Campagne')+'</div>'
      +_pilSimEcoCard(admin)+'</div>';
  }
  function _o(y){ return Math.round((Date.parse(y+'T00:00:00')-Date.parse('2026-01-01T00:00:00'))/86400000); }
  function durOf(a,b){ return _o(b)-_o(a)+1; }
  var note = admin
    ? 'Définis la fenêtre de chaque tâche (début, fin, durée). Elles pilotent la frise et la charge par mois. « auto » = calé sur l\'enchaînement par défaut.'
    : '\uD83D\uDD12 Lecture seule — seul un administrateur peut modifier ces fenêtres.';
  // ⚠️⚠️ LE PARAMETRAGE ECRIT, IL NE REGARDE PAS.
  //   Depuis que la portee recadre les tuiles de lecture, on peut arriver ici en
  //   ayant zoome sur une AUTRE campagne que celle qu'on consulte. Or les
  //   echeances se rangent dans s.echeances de la periode CONSULTEE : suivre le
  //   zoom ferait ecrire dans la mauvaise fiche. Le module ne suit donc pas le
  //   zoom ici — et il le DIT, parce qu'une ecriture silencieuse au mauvais
  //   endroit est le pire des defauts : elle ne se voit qu'a la campagne suivante.
  var _zoomAilleurs = !!(_PIL_SCOPE.camp && cd && cd.saison && _PIL_SCOPE.camp!==cd.saison);
  var _avert = _zoomAilleurs
    ? ('<div class="mvencadre" style="margin:0 0 10px">'
       +'\u26A0 Vous regardez <b>'+_pilEsc(_PIL_SCOPE.camp)+'</b> dans le reste du Pilotage, mais ce param\u00e9trage porte sur '
       +'<b>'+_pilEsc(cd.saison)+'</b>, la p\u00e9riode consult\u00e9e. Pour param\u00e9trer '+_pilEsc(_PIL_SCOPE.camp)+', '
       +'changez de p\u00e9riode consult\u00e9e (R\u00e9glages \u203a Campagne).</div>')
    : '';
  var rows=cd.taskWindows.map(function(t){
    var dis=admin?'':' disabled';
    var key=_friseNorm(t.nom);
    // ★ TROISIEME ETAT, ET IL COMPTE : une consigne de fenetre a bien ete
    //   enregistree pour cette tache, mais ses dates ne rencontrent PAS cette
    //   periode (echeance d'une autre campagne, ou override global a dates
    //   absolues applique a toutes les periodes). Le calcul retombe sur la
    //   fenetre par defaut — et il le DIT, au lieu de laisser croire que la
    //   consigne s'applique.
    var tag=t.horsPeriode
      ? '<span style="font-size:var(--pt-lbl,12px);color:#9B2D1F;font-weight:600" title="Une fen\u00eatre est enregistr\u00e9e pour cette t\u00e2che, mais ses dates sont hors de cette p\u00e9riode. La fen\u00eatre par d\u00e9faut est appliqu\u00e9e.">\u26a0 hors p\u00e9riode</span>'
      : (t.custom?'<span style="font-size:var(--pt-lbl,12px);color:var(--orange);font-weight:600">\u2022 perso</span>':'<span style="font-size:var(--pt-lbl,12px);color:var(--texte-doux)">auto</span>');
    var inCss='border:1px solid var(--gris);border-radius:7px;padding:3px 5px;font-family:var(--font-ui,Outfit);font-size:var(--pt-txt,13px);background:var(--bg-card,#fff);color:var(--texte)';
    var nCss='width:58px;text-align:center;border:1px solid var(--gris);border-radius:7px;padding:3px 0;font-family:var(--font-ui,Outfit);font-size:var(--pt-txt,13px);background:var(--bg-card,#fff);color:var(--texte)';
    return '<tr>'
      +'<td style="'+tdCss+';white-space:nowrap"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:'+_taskColor(t.nom)+';margin-right:7px;vertical-align:-1px"></span><b>'+_pilEsc(t.nom)+'</b> '+tag+'</td>'
      +'<td style="'+tdCss+';color:var(--texte-doux);white-space:nowrap">'+_pilNum(t.h)+' h</td>'
      +'<td style="'+tdCss+'"><input type="date" data-pw="start" data-k="'+key+'" value="'+t.start+'" min="'+cd.debut+'" max="'+cd.fin+'"'+dis+' style="'+inCss+'"></td>'
      +'<td style="'+tdCss+'"><input type="date" data-pw="end" data-k="'+key+'" value="'+t.end+'" min="'+cd.debut+'" max="'+cd.fin+'"'+dis+' style="'+inCss+'"></td>'
      +'<td style="'+tdCss+'"><input type="number" min="1" data-pw="dur" data-k="'+key+'" value="'+durOf(t.start,t.end)+'"'+dis+' style="'+nCss+'"></td>'
      +'<td style="'+tdCss+'">'+((admin&&t.custom)?'<button data-pw="reset" data-k="'+key+'" style="border:1px solid var(--gris);background:#fff;border-radius:7px;padding:3px 9px;font-size:var(--pt-micro,12px);color:var(--texte-doux);cursor:pointer">\u21BA auto</button>':'')+'</td>'
      +'</tr>';
  }).join('');
  var MN=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  var dd=new Date(cd.debut+'T00:00:00'), df=new Date(cd.fin+'T00:00:00');
  var seasonTxt=dd.getDate()+' '+MN[dd.getMonth()]+' \u2192 '+df.getDate()+' '+MN[df.getMonth()]+' '+df.getFullYear();
  var resetAll=admin?'<button id="pil-pw-resetall" style="border:1px solid var(--gris);background:#fff;border-radius:9px;padding:7px 12px;font-size:var(--pt-txt,13px);color:var(--texte-doux);cursor:pointer">Tout remettre en auto</button>':'';
  return '<div id="pil-param-host">'+_pilObjCard(cd,admin)
    +'<div style="'+cardCss+'">'
    +_avert
    +'<div style="'+ttlCss+';margin-bottom:4px">Fenêtres des tâches</div>'
    +'<div style="font-size:var(--pt-txt,13px);color:var(--texte-doux);margin-bottom:10px">'+note+'</div>'
    +'<div style="height:3px;border-radius:3px;background:linear-gradient(90deg,#9B2D1F,#C2871E,#C8B020,#5C8A3E,#3D6B27);margin:0 0 14px"></div>'
    +'<div style="font-size:var(--pt-txt,13px);color:var(--texte-doux);margin-bottom:12px">Saison active · <b style="color:var(--texte)">'+_pilEsc(cd.saison)+'</b> &nbsp;·&nbsp; '+seasonTxt+' <span style="color:var(--texte-doux)">(modifiable dans Réglages \u203A Saisons)</span></div>'
    +'<div style="width:100%;overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:var(--pt-txt,13px);min-width:560px">'
    +'<thead><tr><th style="'+thCss+'">Tâche</th><th style="'+thCss+'">Heures</th><th style="'+thCss+'">Début</th><th style="'+thCss+'">Fin</th><th style="'+thCss+'">Durée (j)</th><th style="padding:6px 8px;border-bottom:1px solid var(--gris-clair)"></th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div>'
    +(resetAll?('<div style="margin-top:14px">'+resetAll+'</div>'):'')
    +'</div>'
    +_pilSimEcoCard(admin)
    +'<div style="'+cardCss+';font-size:var(--pt-txt,13px);color:var(--texte-doux);line-height:1.55">Le <b style="color:var(--texte)">réel</b> de la frise (onglet Avancement) vient du <b style="color:var(--texte)">journal</b> : 1\u02B3\u1D49 validation de la tâche \u2192 date du 100 %. Rien à saisir ici pour le réel.</div>'
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
  function commit(msg){ try{ if(typeof window.saveData==='function'){ window.saveData('saisons'); window.saveData('config'); } }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/commit'); } if(msg&&window.showToast) window.showToast(msg,'#3D6B27'); _pilFillContent(_pilData()); }
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
  // ★ TETE-2 (§329) : la pastille partagée avec l'Accueil (classes .hv2-meteo-mini-*) ; quand la météo est là, elle porte
  //   la date courte et la ligne du jour masque la date longue (classe mvu-avec-meteo).
  var el=document.getElementById('pil-meteo'); if(!el) return;
  var row=el.parentElement;
  if(!d.meteo){ el.style.display='none'; if(row) row.classList.remove('mvu-avec-meteo'); return; }
  el.style.display='';
  if(row) row.classList.add('mvu-avec-meteo');
// ⚠️ Le cache meteo d'AVANT ce lot contient un emoji, celui d'apres un nom
//   d'icone. On tranche sur la forme, sinon l'en-tete affiche « nuage » en
//   toutes lettres — ce qui est exactement ce qui est arrive en production.
  function _pilMeteoIco(v){
    var x=String(v==null?'':v);
    return /^[a-z][a-z0-9-]*$/.test(x) ? _mvIcon(x,20) : (x||_mvIcon('nuage',20));
  }
  var jour=(typeof window._mvDateCourte==='function')?window._mvDateCourte(new Date()):'';
  el.innerHTML='<span class="hv2-meteo-mini-ico">'+_pilMeteoIco(d.meteo.emoji)+'</span>'
    +'<span class="hv2-meteo-mini-temp">'+(d.meteo.temp!=null?d.meteo.temp+'\u00b0':'\u2014')+'</span>'
    +'<span class="hv2-meteo-mini-txt"><span class="hv2-meteo-mini-desc">'+(d.meteo.wind!=null?('vent '+d.meteo.wind+' km/h'):'')+'</span>'
    +'<span class="hv2-meteo-mini-jour">'+_pilEsc(jour)+'</span></span>';
}

// ── Remplissage du contenu de l'onglet courant ──
function _pilFillContent(d){
  var host=document.getElementById('pil-content'); if(!host) return;
  // Le cout d'exercice est memoise le temps d'UN rendu (deux lecteurs : la photo
  // Budget et le panneau « Deux façons de compter »). On l'oublie a chaque
  // repeinte : un chiffre fige apres une saisie de planning serait un ecran qui
  // se contredit lui-meme, exactement ce qu'on vient de corriger.
  _pilExoOublier(); _pilCdVueOublier();
  var tab=_PIL_TAB;
  if(tab==='auj') host.innerHTML=_pilTabAuj(d);
  else if(tab==='avc'){
    // MOTS-8 (§590) : la fin prévue se calcule UNE fois par rendu, pour la phrase du haut et pour « Échéances ».
    var _mAvc=null; try{ _mAvc=_pilMargeCalc(d); }catch(eM){ _mAvc=null; if(window._mvAvale) window._mvAvale(eM,'pilotage.js/_pilFillContent#avc'); }
    host.innerHTML=_pilTabAvc(d,_mAvc);
    var _ph=document.getElementById('pil-souslig-t'); if(_ph) _ph.innerHTML=_pilTvPhrase(d,_mAvc);
  }
  else if(tab==='equ'){
    // ★ MOTS-9 (§592) : l'onglet tient dans _pilTabEqu ; la phrase du haut (l'équipe du jour, ce qui presse) prend la sous-ligne.
    host.innerHTML=_pilTabEqu(d);
    var _phE=document.getElementById('pil-souslig-t'); if(_phE) _phE.innerHTML=_pilEqPhrase(d);
  }
  else if(tab==='sim'){
    // ★ MOTS-10 (§594) : la phrase du haut se lit APRÈS les trois cartes — elle reprend leurs calculs, elle n'en refait aucun.
    host.innerHTML=_pilTabSim(d);
    _pilDcPhraseMaj();
  }
  else if(tab==='eco') host.innerHTML=_pilTabEco(d);
  else if(tab==='cfm') host.innerHTML=_pilTabCfm(d);
  else if(tab==='arc') host.innerHTML=_pilTabArc(d);
  // Les graphes enregistres se dessinent APRES la pose du HTML : c'est la que
  // leur conteneur existe, donc que sa largeur est mesurable.
  if(window._mvGraphRepeindre) window._mvGraphRepeindre();
  // PORTEE-1 (§591) : la ligne d'écran dépend de l'onglet et de la sous-vue d'Économie (le choix de l'année sur Le détail seul).
  var _cr=document.getElementById('pil-crumb'); if(_cr) _cr.innerHTML=_pilCrumbHtml();
  _pilAfterFill(tab,d);
  // La feuille de la roue, si elle est ouverte, se repeint avec le contenu : un
  // commit du Paramétrage rappelle _pilFillContent, et sa carte doit suivre.
  _pilParamRefresh(d);
}
// ── LA ROUE CRANTÉE DU PILOTAGE (lot NAV-3) ──
// Le Paramétrage (objectifs de fin, fenêtres des tâches, hypothèses de calcul)
// se rend dans #pil-regl-host, dans la feuille #ovReglPilotage — même corps,
// mêmes écrivains (_pilParamBody / _pilBindParam) qu'à l'époque de l'onglet.
// ⚠️ La feuille est HORS de #pil-content : la délégation de clic du contenu ne
//   la voit pas. On y pose la seule délégation dont le corps a besoin, celle des
//   boutons « à compléter » (data-diag) — qui ferment la feuille avant d'aller.
function _pilParamRender(d){
  var host=document.getElementById('pil-regl-host'); if(!host) return false;
  if(window._mvFicheFraiche) window._mvFicheFraiche('ovReglPilotage');   // ★ AJOUR-2 (§562) : la roue du Pilotage est peinte ici
  if(typeof _pecCss==='function') _pecCss();   // PIL-RANGE-4b : les réglages des années portent le style d'Économie
  host.innerHTML=_pilParamBody(d)+_pilParamAnnees();
  _pilBindParam(d);
  if(window._ecoRenderIftCard) window._ecoRenderIftCard();
  return true;
}
// ★ PIL-RANGE-4b (§447) — LES TROIS RÉGLAGES DES ANNÉES, DANS LA ROUE. Ils vivaient au bas de la sous-vue Exercice ;
//   ce sont des réglages, pas des chiffres à lire. Côte à côte comme avant (AXE-1 : les deux cadres annuels se règlent
//   au même endroit), mêmes écrivains (_pexSetMois, _pilSetCampMois, _pexSetFutTrait).
function _pilParamAnnees(){
  var h='';
  try{ h=_pexMoisChoix()+_pilCampMoisChoix()+_pexFutChoix(); }
  catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilParamAnnees'); return ''; }
  return '<div class="pec-wrap" id="pil-param-annees" style="margin-top:4px"><div class="pil-sec-h">Les ann\u00e9es et les comptes</div>'+h+'</div>';
}
function _pilParamRefresh(d){
  var ov=document.getElementById('ovReglPilotage');
  if(!ov||!ov.classList.contains('open')) return;
  _pilParamRender(d);
}
window._pilParamOpen=function(){
  var ok=_pilParamRender(_pilData());
  var host=document.getElementById('pil-regl-host');
  if(host&&!host._mvDiagBound){
    host._mvDiagBound=true;
    host.addEventListener('click', function(e){
      // PIL-RANGE-4b (§447) : « Un fût acheté, comment le compter ? » se règle ici désormais.
      var fu=e.target.closest('[data-pec="futtr"]');
      if(fu){ e.stopPropagation(); if(typeof window._pexSetFutTrait==='function') window._pexSetFutTrait(fu.getAttribute('data-v')); return; }   // _pexSetFutTrait → _pilFillContent → la roue se repeint
      var dg=e.target.closest('[data-diag]'); if(!dg) return;
      e.stopPropagation();
      if(window.closeOv) window.closeOv(null,'ovReglPilotage');
      window._pilGo(dg.getAttribute('data-diag'));
    });
  }
  return ok;
};
function _pilAfterFill(tab,d){
  if(tab==='avc'){
    if(_pilShow('avc_bar')) _pilRenderGauge(d);   // PIL-RANGE-3 : la jauge vit dans « Avancement par tâche »
    if(_pilShow('avc_bar')) _pilRenderBar(d);
    if(_pilShow('avc_pie')) _pilRenderPie(d);
    var carteOpen=_pilShow('avc_carte') && !(_PIL_STATE.collapsed&&_PIL_STATE.collapsed.carte);
    if(carteOpen) _pilBuildMap(d);
  }
  if(tab==='sim' && _pilShow('sim_ordre') && !(_PIL_STATE.collapsed&&_PIL_STATE.collapsed.ordrepassage)) _opBuildMap();
}

// ── Délégation des interactions internes du contenu ──
function _pilBindContent(content){
  // MOTS-4 (§585) : la bulle de la frise des Archives — au survol et au clavier ; au toucher, elle reste jusqu'au toucher suivant.
  content.addEventListener('mouseover', function(e){ var s=e.target.closest&&e.target.closest('.arc-seg'); if(s) _arcBulle(s); });
  content.addEventListener('mouseout', function(e){ if(e.target.closest&&e.target.closest('.arc-seg')) _arcBulle((_ARC_FIXE&&document.body.contains(_ARC_FIXE))?_ARC_FIXE:null); });
  content.addEventListener('focusin', function(e){ var s=e.target.closest&&e.target.closest('.arc-seg'); if(s) _arcBulle(s); });
  content.addEventListener('click', function(e){
    var _as=e.target.closest('.arc-seg');
    if(_as){ e.stopPropagation(); _ARC_FIXE=(_ARC_FIXE===_as)?null:_as; _arcBulle(_ARC_FIXE); return; }
    if(_ARC_FIXE){ _ARC_FIXE=null; _arcBulle(null); }
    var _sb=e.target.closest('[data-sim]'); if(_sb){ e.stopPropagation(); _pilSimAction(_sb.getAttribute('data-sim'), _sb.getAttribute('data-ti')); return; }
    var _ob=e.target.closest('[data-op]'); if(_ob){ e.stopPropagation(); _pilOpAction(_ob); return; }
    var _lb=e.target.closest('.pil-lent-b'); if(_lb){ e.stopPropagation(); var _lv=_lb.getAttribute('data-lent'); if(_lv&&_lv!==_PIL_LENT){ _PIL_LENT=_lv; _PIL_LENT_PREP=null; renderPilotage(); } return; }   // CARTE-1 (§217)
    var nb=e.target.closest('.pil-names-btn'); if(nb){ e.stopPropagation(); _pilNamesOn=!_pilNamesOn; _pilApplyNames(); nb.textContent=_pilNamesOn?'\uD83C\uDFF7 Noms \u2713':'\uD83C\uDFF7 Noms'; return; }
    // ANNEE-1 (§234) : le cadre et l'annee consultes. Meme chemin que le zoom sur une
    // campagne : la portee change, le fil d'Ariane et les photos suivent.
    // PIL-RANGE-2a (§442) : la barre « Vous regardez ». Un toucher hors de la liste des campagnes la referme.
    // TETE-4C (§579) : au téléphone, le bouton de la ligne d'écran déplie le choix ; un toucher hors de la ligne le referme.
    var _pr=e.target.closest('[data-ptres]');
    if(_pr){ e.stopPropagation(); _pilPtOuvrir(!_pilPtOuvert); return; }
    if(_pilPtOuvert && !e.target.closest('#pil-portee')) _pilPtOuvrir(false);
    var _ptV=e.target.closest('[data-portee]');
    if(_ptV){ e.stopPropagation(); _pilPorteeChoisir(_ptV.getAttribute('data-portee')); _pilPortee(); _pilFillContent(_pilData()); return; }
    var _ar=e.target.closest('[data-anrecul]');
    if(_ar){ e.stopPropagation(); if(_ar.disabled) return;
      _pilReculSet((parseInt(_PIL_SCOPE.recul,10)||0)+(parseInt(_ar.getAttribute('data-anrecul'),10)||0)); _pilPortee(); _pilFillContent(_pilData()); return; }
    // Clic sur une campagne (puces de L'annee) : zoom / retour. Re-cliquer la
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
    // PORTEE-1 (§591) : la pastille de la campagne ouvre le menu des campagnes de l'appli, sous elle.
    var _ps=e.target.closest('[data-pilsaison]');
    if(_ps){ e.stopPropagation(); if(typeof window._seasonMenuToggle==='function') window._seasonMenuToggle(e,_ps); return; }
    // MOTS-8 (§590) : « Ouvrir … » d'une carte de Travaux — le module où l'on agit.
    var _tg=e.target.closest('[data-tvgo]');
    if(_tg){ e.stopPropagation(); _pilTvGo(_tg.getAttribute('data-tvgo')); return; }
    var _pg=e.target.closest('[data-pgo]');
    // Changer d'onglet passe par _pilSetTab() — le clic sur #pil-tabs aussi.
    //    Une seule facon de le faire, donc un seul endroit ou la corriger.
    // Une photo drapeautee ouvre d'abord CE QUI LA FAUSSE : descendre au
    // detail d'un chiffre faux, c'est lire un faux chiffre en plus grand.
    var _pf=e.target.closest('.pil-flag');
    if(_pf){ e.stopPropagation();
      var _ph=_pf.closest('[data-pq]');
      _pilDiagOpen(_ph?_ph.getAttribute('data-pq'):null); return; }
    var _dg=e.target.closest('[data-diag]');
    if(_dg){ e.stopPropagation(); _pilDiagClose(); window._pilGo(_dg.getAttribute('data-diag')); return; }
    if(e.target.closest('#pil-diagbtn')){ e.stopPropagation(); _pilDiagOpen(null); return; }
    if(e.target.closest('#pil-diag-x')){ e.stopPropagation(); _pilDiagClose(); return; }
    if(e.target.id==='pil-diagwrap'){ e.stopPropagation(); _pilDiagClose(); return; }
    if(_pg){ e.stopPropagation(); var _pt=_pg.getAttribute('data-pgo');
      // Une cible que le module ne connait pas ne doit pas ecrire une cle morte
      // dans localStorage : _pilLoadTab retomberait sur 'auj' au rechargement
      // sans que personne comprenne pourquoi.
      if(_pt && _PIL_VALID_TAB[_pt] && _pt!==_PIL_TAB){ _PIL_TAB=_pt; _pilSaveTab(_pt); renderPilotage();
        if(window.scrollTo) window.scrollTo(0,0); }
      // Deja sur l'ecran vise : le clic tombait dans le vide. « voir le detail »
      // doit toujours faire quelque chose — ici, descendre au detail annonce.
      else if(_pt===_PIL_TAB){ var _pc=document.getElementById('pil-content');
        if(_pc){ try{ _pc.scrollIntoView({behavior:'smooth',block:'start'}); }
          catch(e4){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'photo: defilement'}); } } }
      return; }
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
      if(_pa==='pachgo'){ if(_PEC_SUB!=='ach'){ _PEC_SUB='ach'; _pecSaveSt(); _pilFillContent(_pilData()); } return; }
      if(_pa==='pachf'){ var _fv=_pe.getAttribute('data-v');
        if((_fv==='tout'||_fv==='sans')&&_fv!==_PACH_FILT){ _PACH_FILT=_fv; _pilFillContent(_pilData()); } return; }
      if(_pa==='futtr'){ var _tv=_pe.getAttribute('data-v');
        if(typeof window._pexSetFutTrait==='function') window._pexSetFutTrait(_tv); return; }
      // ⚠️ `const` ET NON `var` : cette delegation est UNE SEULE fonction de plusieurs
      //   centaines de lignes, ou chaque lot ajoute son `if(_pa===…)`. Un `var _pv`
      //   de plus y retombe dans la MEME portee que celui du bloc 'sub' plus haut ->
      //   no-redeclare. Un `const` reste dans son bloc `{}` : deux lots peuvent
      //   choisir le meme nom sans jamais se marcher dessus.
      if(_pa==='pachper'){ const _pv=_pe.getAttribute('data-v');
        if((_pv==='exe'||_pv==='tout')&&_pv!==_PACH_PER){ _PACH_PER=_pv; _pilFillContent(_pilData()); } return; }
      // REV-1 : déplier une appellation (sans re-rendre : rien d'autre ne bouge),
      //   changer de millésime, ouvrir la Cave sur la bonne section.
      if(_pa==='revrow'){ const _ri=_pe.getAttribute('data-v'); const _op=!_pe.classList.contains('open');
        _pe.classList.toggle('open',_op);
        const _dl=document.querySelectorAll('.prv-det[data-prv="'+_ri+'"]');
        for(let _k=0;_k<_dl.length;_k++) _dl[_k].classList.toggle('prv-hid',!_op);
        return; }
      if(_pa==='revmil'){ const _mv=parseInt(_pe.getAttribute('data-v'),10);
        if(!isNaN(_mv)&&_mv!==_PEC_REV_MIL){ _PEC_REV_MIL=_mv; _pilFillContent(_pilData()); } return; }
      if(_pa==='cave'){ if(typeof window._pilOuvrirCave==='function') window._pilOuvrirCave(_pe.getAttribute('data-v')||''); return; }
      if(_pa==='pach'){ _pachOpen(_pe.getAttribute('data-v')||''); return; }
      if(_pa==='pachadd'){ _pachAdd(); return; }
      if(_pa==='axe'){ var _av=_pe.getAttribute('data-v'); if((_av==='nat'||_av==='ate')&&_av!==_PEC_AXE){ _PEC_AXE=_av; _pecSaveSt(); _pilFillContent(_pilData()); } return; }
      // Raccourci vers La Reserve : Pilotage LIT, il n'ecrit aucun fait
      // d'exploitation. Un second formulaire de saisie ici serait une deuxieme
      // porte vers le meme document — et deux sources d'un meme chiffre finissent
      // toujours par se contredire. On ouvre donc l'ecran qui possede la donnee.
      if(_pa==='rsv'){
        var _rt=_pe.getAttribute('data-v')||'intrants';
        if(!window.goTo){ if(window.showToast) window.showToast('La R\u00e9serve n\u2019est pas disponible','#B85A1A'); return; }
        window.goTo('reserve');
        setTimeout(function(){
          try{ if(window._rsvTabTo) window._rsvTabTo(_rt); }
          catch(e){ if(window.logError) window.logError({level:'info',cat:'pilotage',msg:'rsv tab '+_rt}); }
        },240);
        if(window.scrollTo) window.scrollTo(0,0);
        return;
      }
      if(_pa==='param'){ if(window._mvReglOpen) window._mvReglOpen('pilotage'); return; }
      if(_pa==='csv'||_pa==='copy'){ _pecExport(_pa,_pecData()); return; }
      return;
    }
    var bs=e.target.closest('#pil-bar-seg button'); if(bs){ var b=bs.getAttribute('data-b'); if(b){ _PIL_STATE.bar=b; _pilSaveState(_PIL_STATE); _pilRenderBar(_pilData()); } return; }
    var ps=e.target.closest('#pil-pie-seg button'); if(ps){ var pm=ps.getAttribute('data-m'); if(pm){ _PIL_STATE.pie=pm; _pilSaveState(_PIL_STATE); _pilRenderPie(_pilData()); } return; }
    var head=e.target.closest('.pil-th');
    if(head){ var tile=head.closest('.pil-tile'); if(!tile) return; var id=tile.getAttribute('data-pid'); if(!id) return; if(!_PIL_STATE.collapsed)_PIL_STATE.collapsed={}; _PIL_STATE.collapsed[id]=_PIL_STATE.collapsed[id]?0:1; var _ouvre=!_PIL_STATE.collapsed[id];
        // ★ UNE SEULE CARTE DEPLIEE A LA FOIS, sur toute la page.
        //   Une carte depliee prend toute la ligne — c'est necessaire (une carte,
        //   une frise de douze mois), et c'est exactement ce qui empechait la
        //   grille de se remplir quand tout etait ouvert par defaut. En refermer
        //   une pour en ouvrir une autre coute le meme geste que de l'ouvrir, et
        //   rend au reste de l'onglet ses deux a quatre colonnes.
        //   ⚠️ On passe par le MEME chemin d'etat : rien n'est ferme a l'ecran
        //     sans etre ecrit dans `collapsed`, sinon le prochain rendu rouvrirait.
        if(_ouvre){
          var _autres=document.querySelectorAll('.pil-tile.open');
          for(var _i=0;_i<_autres.length;_i++){
            var _t=_autres[_i]; if(_t===tile) continue;
            var _id=_t.getAttribute('data-pid'); if(!_id) continue;
            _PIL_STATE.collapsed[_id]=1; _t.classList.remove('open');
            if(_id==='ordrepassage'&&_PIL_OP){ _PIL_OP._pick=null; _PIL_OP._sheet=null; _PIL_OP._fm=false; }
          }
        }
        _pilSaveState(_PIL_STATE); tile.classList.toggle('open',_ouvre);
        // \u2605 UN GRAPHE DESSINE DANS UNE CARTE FERMEE L'A ETE A LA LARGEUR PAR
        //   DEFAUT : .pil-tbody est en display:none, donc clientWidth vaut 0 et
        //   _mvGraphW retombe sur MV_GRAPH_DEF. En ouvrant, la largeur reelle
        //   existe enfin. _mvGraphRepeindre ne redessine que ce qui a change de
        //   largeur : sur une carte sans graphe, il ne fait rien.
        if(_ouvre && window._mvGraphRepeindre) window._mvGraphRepeindre();
        // La barre \u00ab en main \u00bb est en position:fixed : replier le volet doit la
        // l\u00e2cher, sinon elle flotterait au-dessus d'un contenu invisible.
        if(id==='ordrepassage'){ if(_PIL_STATE.collapsed[id]){ if(_PIL_OP){ _PIL_OP._pick=null; _PIL_OP._sheet=null; _PIL_OP._fm=false; } } else _opBuildMap(); } if(id==='carte'&&!_PIL_STATE.collapsed[id]) _pilBuildMap(_pilData()); return; }
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
  var tabs=document.getElementById('pil-tabs');
  if(tabs) tabs.addEventListener('click', function(e){
    var b=e.target.closest('[data-tab]'); if(!b) return;
    var t=b.getAttribute('data-tab'); if(!_pilSetTab(t)) return;
  });
  var gearR=document.getElementById('pil-regl-gear');
  if(gearR) gearR.onclick=function(){ if(window._mvReglOpen) window._mvReglOpen('pilotage'); };
  var gear=document.getElementById('pil-gear');
  if(gear) gear.onclick=function(){
    var pz=document.getElementById('pil-perso'); if(!pz) return;
    if(pz.classList.contains('show')){ pz.classList.remove('show'); pz.innerHTML=''; }
    else { pz.innerHTML=_pilPersoHtml(_PIL_TAB); pz.classList.add('show'); }
  };
  var perso=document.getElementById('pil-perso'); if(perso) perso.addEventListener('change', _pilPersoChange);
  // ⚠️⚠️ LA DELEGATION SE POSE SUR LA PAGE, PAS SUR #pil-content.
  //   Defaut trouve le 12/08. Depuis la v6.50, les quatre photos
  //   (#pil-photos-host), le fil d'Ariane (.pil-portee), le bouton
  //   « N choses a completer » (#pil-diagbtn) et le panneau de diagnostic
  //   (#pil-diagwrap) sont des FRERES de #pil-content, pas des descendants.
  //   L'ecouteur etant pose sur #pil-content, aucun de leurs clics ne
  //   l'atteignait : data-pgo (« voir le detail » sur les 4 photos), .pil-flag,
  //   #pil-diagbtn, #pil-diag-x, #pil-cr-root et #pil-cr-x etaient MORTS.
  //   Aucune erreur, aucune trace : le clic tombait dans le vide. C'est la
  //   signature d'une delegation posee trop bas apres un deplacement de balise.
  //   La page, elle, contient tout. Elle SURVIT aux rendus (renderPilotage
  //   ecrase son innerHTML, pas ses ecouteurs) : on ne branche donc QU'UNE FOIS.
  //   Sans ce verrou, chaque rendu empilerait un ecouteur de plus et un clic
  //   ferait N fois son effet — un repli deviendrait un depli au 2e rendu.
  var page=document.getElementById('page-pilotage');
  if(page && !page._pilDeleg){ page._pilDeleg=1; _pilBindContent(page); }
}

// ── Rendu principal (appelé par goTo('pilotage')) ──
function renderPilotage(){
  var page=document.getElementById('page-pilotage'); if(!page) return;
  if(window._mvAjourPage) window._mvAjourPage('page-pilotage');   // ★★ AJOUR-1 (§552) : la page est à jour de ce qui précède (utils.js)
  _PIL_STATE=_pilLoadState(); _PIL_TAB=_pilLoadTab(); _pecLoadSt();
  _pilExoOublier(); _pilCdVueOublier();
  _pecCss();
  var d=_pilData();
  page.innerHTML=_pilSkeleton(d,_PIL_TAB);
  _pilRenderMeteo(d);
  _pilFillContent(d);
  _pilBind();
  // Idempotent : ne fait rien si la pastille est deja posee.
  if(typeof window._mvInjectHelpBtn==='function') window._mvInjectHelpBtn();
  // ★ TETE-2 : la ligne du jour reçoit la date (data-mv-date) et l'en-tête son voyant de synchro, comme les autres modules.
  if(typeof window._mvMetaSync==='function') window._mvMetaSync();
  if(typeof window._syncEnsureDots==='function'){ window._syncEnsureDots(); if(typeof window._syncRefresh==='function') window._syncRefresh(); }
  _pilEnteteSuivre();   // ★ COLLE-1 : le bandeau fini, sa hauteur pour les onglets et la colonne de droite
  if(!window._dataReady){ setTimeout(function(){ var p=document.querySelector('.page.active'); if(p&&p.id==='page-pilotage'){ try{ _pilFillContent(_pilData()); }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/renderPilotage'); } } }, 800); }
}

// (_pilUpdateCard + carte hub « Pilotage » supprimées — hub purgé, plus aucun appelant · MAINT-2)

// ── Exposition ──
// _PIL_TABS est expose pour l'AIDE (utils.js) : la fiche du
// module liste les onglets en les LISANT ici, au lieu de les decrire dans une
// phrase qui vieillit. Elle a annonce « Six onglets » pendant que le module en
// comptait sept, avec deux noms qui n'existaient plus.
// _PIL_SEM n'est plus expose ici : utils.js le fait, une seule fois, a la
// source. Deux expositions du meme objet, c'est deux verites en puissance.
window._pilPolyBreak  = _pilPolyBreak;
window._PIL_TABS      = _PIL_TABS;
window.renderPilotage = renderPilotage;
window._pilGetTab     = function(){ return _pilLoadTab(); };
window._pilSetTab     = function(t, silencieux){ return _pilSetTab(t, {silencieux:!!silencieux}); };
window.openPilotage   = function(){ if(window.goTo) window.goTo('pilotage'); else renderPilotage(); };

export { renderPilotage };
// TRN-1 (§330) : une tournée enregistrée dans la roue crantée redessine Décider s'il est à l'écran.
window.addEventListener('mv-tournees', function(){ if(document.getElementById('pil-op-start')) _pilOpRefresh(); });
