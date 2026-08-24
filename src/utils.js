// ════════════════════════════════════
// MA VIGNE — utils.js
// Fonctions utilitaires pures + helpers UI
// Phase 1a — extraction depuis app.js
// © 2026 Nicolas GUERET / GUERETTECH
// ════════════════════════════════════
//
// Importer dans app.js AVANT firebase.js :
//   import { isAdmin, showToast, ... } from './utils.js';
//
// Chaque module futur importe ce dont il a besoin :
//   import { showToast, isAdmin, tNom } from '../utils.js';
// ════════════════════════════════════

const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if(DEBUG) console.log('[Ma Vigne] utils.js chargé');

// ════ CONSTANTE ADMIN — source de vérité ════
export const GT_ADMIN_EMAIL = 'ngdevpro@gmail.com';

// ════ WHATS NEW ════
// APP_VERSION : version index.html affichee dans Reglages.
// WHATS_NEW   : tableau vide = modal desactive pour cette version.
// Format item : { emoji:'📅', titre:'Titre court', desc:'Phrase utilisateur.' }
// Regle : seulement les changements visibles par les utilisateurs.
export const APP_VERSION = '6.66';
// ════ Journal des nouveautés (récap cumulatif) ════
// Une entrée par version, la PLUS RÉCENTE EN HAUT : { v:'5.10', items:[ {emoji,titre,desc}, … ] }
// À chaque release visible → AJOUTER un bloc en tête (ne pas remplacer). items:[] = release technique (rien à afficher).
// Le récap agrège toutes les versions strictement > dernière vue (jusqu'à APP_VERSION incluse), groupées par version.
// ═══════════════════════════════════════════════════════════════════════════
// MV_DOC — la charte commune des documents imprimables
// ═══════════════════════════════════════════════════════════════════════════
// Ma Vigne produit une dizaine de documents papier. Ils avaient chacun leur
// mise en page : neuf reglages de marges differents, de 0 a 16 mm, portrait et
// paysage melanges, et trois documents seulement chargeaient les polices du
// domaine — les autres sortaient en Times New Roman. Mis cote a cote, ils ne
// ressemblaient pas a la meme application.
//
// La primitive vit dans utils.js parce que cave.js, reserve.js, reglages.js et
// app.js en ont tous besoin, et que utils.js est importe en premier.
//
// Elle ne compose pas le contenu : chaque document reste maitre de son corps et
// de son CSS propre. Elle impose la GRAMMAIRE — le format de page, les polices,
// l'en-tete a filet d'or, le pied, et les regles de coupure a l'impression.
//
// ⚠️ Deux gabarits, pas un seul. Un registre phytosanitaire a dix colonnes ne
// rentre pas en portrait : le paysage reste legitime, avec le meme en-tete et
// le meme pied. C'est l'orientation qui change, jamais la charte.
//
// ⚠️ Les documents portent le nom du DOMAINE, jamais celui de GUERETTECH. Ce
// sont les documents du vigneron.

var MV_DOC_MARGE   = '14mm 12mm';
var MV_DOC_ENCRE   = '#14110D';
var MV_DOC_OR      = '#C2A14D';

// Le socle commun. Injecte AVANT le CSS propre du document, pour qu'un document
// puisse encore surcharger ce qui le concerne.
window._mvDocCss = function(orient){
  var o = (orient === 'paysage') ? 'A4 landscape' : 'A4 portrait';
  return '@page{size:' + o + ';margin:' + MV_DOC_MARGE + '}'
    + 'html,body{margin:0;padding:0;background:#fff;color:#1A1A14;'
      + 'font-family:\'Outfit\',system-ui,-apple-system,sans-serif;font-size:11px;line-height:1.5;'
      + '-webkit-print-color-adjust:exact;print-color-adjust:exact}'
    + '.mvdoc-serif{font-family:\'Cormorant Garamond\',Georgia,serif}'
    // en-tete : bande sombre + filet d'or. Le filet est la signature du domaine.
    + '.mvdoc-hd{background:' + MV_DOC_ENCRE + ';color:#F3EEE2;padding:16px 18px 14px;position:relative}'
    + '.mvdoc-hd::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;'
      + 'background:linear-gradient(90deg,#8A5A38 0%,' + MV_DOC_OR + ' 48%,#D8BC72 100%)}'
    + '.mvdoc-dom{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:19px;font-weight:600;letter-spacing:.3px;line-height:1.15}'
    + '.mvdoc-tit{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:#D8BC72;margin-top:5px}'
    + '.mvdoc-meta{font-size:9.5px;color:#A79E8E;margin-top:6px;display:flex;gap:14px;flex-wrap:wrap}'
    // corps et pied
    + '.mvdoc-body{padding:16px 18px}'
    + '.mvdoc-ft{border-top:1px solid #E4DCCB;margin:16px 18px 0;padding:9px 0 4px;font-size:8px;color:#8A8272;'
      + 'display:flex;justify-content:space-between;gap:12px;line-height:1.5}'
    // l'encadre de limite : un etat interne se presente comme tel
    + '.mvdoc-lim{background:#FAF3E0;border-left:3px solid ' + MV_DOC_OR + ';padding:8px 10px;'
      + 'font-size:8.5px;color:#5A5244;line-height:1.55;margin-top:14px;border-radius:0 5px 5px 0}'
    // grammaire d'impression commune
    + '@media print{.no-print{display:none!important}'
      + 'table,tr,.mvdoc-avoid{page-break-inside:avoid;break-inside:avoid}'
      + 'h1,h2,h3,h4,.mvdoc-sec{page-break-after:avoid;break-after:avoid}}';
};

// L'en-tete. `metas` est une liste de courtes mentions : campagne, millesime,
// date d'edition. Vide = ligne absente, pas une ligne vide.
window._mvDocHero = function(o){
  o = o || {};
  var e = (typeof window._escHtml === 'function') ? window._escHtml : function(x){ return String(x == null ? '' : x); };
  var m = (o.metas || []).filter(function(x){ return x; })
            .map(function(x){ return '<span>' + e(x) + '</span>'; }).join('');
  return '<div class="mvdoc-hd">'
    + '<div class="mvdoc-dom">' + e(o.domaine || '') + '</div>'
    + '<div class="mvdoc-tit">' + e(o.titre || '') + '</div>'
    + (m ? '<div class="mvdoc-meta">' + m + '</div>' : '')
    + '</div>';
};

// Le pied. Toujours la meme phrase, toujours au meme endroit.
window._mvDocFoot = function(o){
  o = o || {};
  var e = (typeof window._escHtml === 'function') ? window._escHtml : function(x){ return String(x == null ? '' : x); };
  var d = new Date(), p = function(n){ return (n < 10 ? '0' : '') + n; };
  var quand = p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear()
            + ' \u00e0 ' + p(d.getHours()) + ':' + p(d.getMinutes());
  return '<div class="mvdoc-ft"><span>Ma Vigne \u00b7 ' + e(o.domaine || '') + '</span>'
    + '<span>\u00c9dit\u00e9 le ' + quand + '</span></div>';
};

// L'ouverture. Un seul endroit qui sait produire un Blob, ouvrir l'onglet et
// lancer l'impression — les douze documents partageaient dix variantes de ce
// meme geste, avec des delais differents et des messages differents.
// ⚠️ '<scr'+'ipt>' est obligatoire : ecrire la balise en clair dans une chaine
// JS fermerait le script de la page hote.
window._mvDocOpen = function(o){
  o = o || {};
  var e = (typeof window._escHtml === 'function') ? window._escHtml : function(x){ return String(x == null ? '' : x); };
  var dom = o.domaine || (window.DOMAINE_NOM || 'Domaine');
  var hero = (o.hero === false) ? '' : window._mvDocHero({ domaine: dom, titre: o.titre, metas: o.metas });
  var foot = (o.pied === false) ? '' : window._mvDocFoot({ domaine: dom });
  var corps = o.brut ? (o.corps || '')
            : '<div class="mvdoc-body">' + (o.corps || '') + '</div>';
  var html = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + e(o.titre || 'Document') + ' \u2014 ' + e(dom) + '</title>'
    + '<link rel="stylesheet" href="/fonts/fonts.css">'
    + '<style>' + window._mvDocCss(o.orient) + (o.css || '') + '</style></head>'
    + '<body>' + hero + corps + foot
    + '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print();},500);};</scr' + 'ipt>'
    + '</body></html>';
  try{
    var blob = new Blob([html], { type: 'text/html' });
    var w = window.open(URL.createObjectURL(blob), '_blank');
    if(!w && window.showToast) window.showToast('Autorise les pop-ups pour imprimer', '#B85A1A');
    return !!w;
  }catch(err){
    if(window.logError) window.logError({ level:'error', cat:(o.cat || 'doc'), msg:'document impossible \u00e0 ouvrir' });
    if(window.showToast) window.showToast('Document impossible \u00e0 produire', '#C0392B');
    return false;
  }
};

// ═══════════════════════════════════════
// MV_GRAPH — la charte commune des graphiques
// ═══════════════════════════════════════
// Ma Vigne dessine dix-huit graphiques. Seize d'entre eux posaient un repere
// (viewBox) fige a 940 ou 1000 unites de large, puis laissaient le navigateur
// l'etirer dans son conteneur. Comme l'application est bornee a 430 px sur
// telephone et 760 px sur ordinateur — body{max-width:760px} —, ces graphes
// etaient TOUJOURS reduits : une police ecrite 10,5 sortait a 3,3 px sur un
// telephone et a 7,2 px sur un ordinateur. Sept d'entre eux n'etaient lisibles
// a aucune largeur. Le min-width:560px pose sur cinq graphes n'y changeait
// rien : il ajoutait un defilement horizontal sans agrandir le texte.
//
// Le remede existait deja dans l'application, sur un seul graphe : le parcours
// du millesime (_mlFluxSvg, cave.js) MESURE son conteneur, pose cette largeur
// en repere ET en attribut, donc une unite vaut un pixel, puis se repeint au
// redimensionnement. C'est ce patron qui est generalise ici.
//
// La primitive vit dans utils.js parce que cave.js, pilotage.js, planning.js et
// app.js en ont tous besoin, et que utils.js est importe en premier.
//
// Elle ne dessine rien : chaque graphe reste maitre de son contenu. Elle impose
// la GRAMMAIRE — l'enveloppe de largeur, les deux paliers de recomposition,
// l'echelle de texte, les roles de couleur, l'etat vide et l'etiquette
// d'accessibilite.
//
// ⚠️ Deux paliers, pas un reglage continu. Sous 560 px un graphe se RECOMPOSE :
// la gouttiere d'etiquettes tombe de 64 a 34 px, six graduations deviennent
// trois, les libelles s'abregent. Il ne se contente jamais de retrecir.
//
// ⚠️ Rien sous 10 px. Si un libelle ne tient pas, on retire une graduation ; on
// ne diminue pas la police.
//
// ⚠️ --or et --gris-clair TRACENT, ils n'ecrivent jamais : sur le fond papier
// leur contraste tombe a 2,37 et 1,19, tres au-dessous du minimum de 4,5. Tout
// libelle s'ecrit en --texte-doux ou plus fonce.
//
// Recette de conversion d'un graphe existant, en six gestes :
//   1. la fonction prend (w) au lieu de rien, et ne fixe plus var W=1000
//   2. var c = window._mvGraphCadre(w, hauteur)  -> pads, graduations, textes
//   3. les coordonnees se calculent sur c.iw / c.ih au lieu des anciens pads
//   4. les font-size deviennent c.txt.axe / c.txt.val / c.txt.unite
//   5. les couleurs deviennent c.col.mesure / c.col.prevu / …
//   6. le rendu se termine par window._mvGraphSvg(c, 'ce que montre le graphe', corps)
//      et l'appelant enregistre : window._mvGraphSuivre('.mon-conteneur', build)

// Enveloppe de largeur. Le maximum suit l'application, pas l'ecran : un graphe
// ne peut pas etre plus large que la colonne qui le contient.
var MV_GRAPH_MIN = 300, MV_GRAPH_MAX = 760, MV_GRAPH_DEF = 352;
// Sous ce seuil, on recompose au lieu de reduire.
var MV_GRAPH_PALIER = 560;

// Une couleur, un sens, sur toute l'application. Ce sont des variables CSS :
// elles basculent en mode sombre, ce qu'une valeur ecrite en clair ne fait pas.
window.MV_GRAPH_COL = {
  mesure:    'var(--terre)',       // la matiere mesuree : volumes, kilos, euros engages
  prevu:     'var(--or)',          // le prevu : budget, effectif planifie, plafond
  fait:      'var(--vert-med)',    // le fait, l'atteint, le conforme
  alerte:    'var(--rouge)',       // le depassement, le repere du jour
  attention: 'var(--orange)',      // le retard rattrapable
  grille:    'var(--gris-clair)',  // la grille — jamais une donnee
  texte:     'var(--texte-doux)'   // tout texte de graphe
  // (le role ne s'appelle PAS « libelle » : C19 traite ce mot comme un champ
  //  saisi par un utilisateur, et un role de couleur n'en est pas un)
};

// Echelle de texte, en pixels reels puisqu'une unite vaut un pixel.
window.MV_GRAPH_TXT = { val: 13, axe: 11, unite: 10.5, mini: 10 };

// Epaisseurs de trait, en pixels reels.
window.MV_GRAPH_TRAIT = { mesure: 2, prevu: 1.5, seuil: 1.5, grille: 1 };

// La largeur VRAIE du conteneur, bornee. Jamais une constante : c'est la mesure
// qui evite l'etirement.
// ★ PLAFOND PAR GRAPHE (`max`, optionnel — AJOUT PUR, appel sans argument
//   strictement inchange). MV_GRAPH_MAX = 760 est le bon plafond pour un graphe
//   pose dans une colonne : au-dela, les points s'etirent sans rien montrer de
//   plus. Mais une FRISE DE DOUZE MOIS n'est pas dans une colonne — elle occupe
//   toute la carte, et dans un .pil-wrap de 1280 px elle s'arretait a 760, soit
//   60 % de la page, avec cinquante-deux semaines ecrasees dans la moitie de la
//   place disponible. Un plafond global n'a pas a decider pour tous les graphes.
window._mvGraphW = function(el, max){
  var w = (el && el.clientWidth > 0) ? el.clientWidth : 0;
  var hi = (max > 0) ? max : MV_GRAPH_MAX;
  if(hi < MV_GRAPH_MIN) hi = MV_GRAPH_MIN;
  if(!(w > 0)) return Math.min(MV_GRAPH_DEF, hi);
  return Math.round(Math.max(MV_GRAPH_MIN, Math.min(hi, w)));
};

// Le cadre : gouttieres, surface de trace, nombre de graduations, echelles.
// ⚠️ (o.x != null) et jamais (o.x || defaut) : une gouttiere de 0 est legitime,
// et 0 || 64 rend 64.
window._mvGraphCadre = function(w, h, o){
  o = o || {};
  w = (w > 0) ? Math.round(w) : MV_GRAPH_DEF;
  h = (h > 0) ? Math.round(h) : 200;
  var etroit = w < MV_GRAPH_PALIER;
  var padL = (o.padL != null) ? o.padL : (etroit ? 34 : 64);
  var padR = (o.padR != null) ? o.padR : 14;
  var padT = (o.padT != null) ? o.padT : (etroit ? 30 : 26);
  var padB = (o.padB != null) ? o.padB : (etroit ? 30 : 34);
  return {
    w: w, h: h, etroit: etroit,
    padL: padL, padR: padR, padT: padT, padB: padB,
    iw: Math.max(1, w - padL - padR),
    ih: Math.max(1, h - padT - padB),
    grad: (o.grad != null) ? o.grad : (etroit ? 3 : 6),
    txt: window.MV_GRAPH_TXT,
    trait: window.MV_GRAPH_TRAIT,
    col: window.MV_GRAPH_COL
  };
};

// La balise <svg> de la charte. width et height en dur = une unite vaut un
// pixel : c'est ce qui empeche l'etirement, et ce qui rend les font-size vrais.
// ⚠️ `aria` recoit du TEXTE BRUT : l'echappement est fait ici, pas avant, sinon
// une esperluette ressort en &amp;amp;.
window._mvGraphSvg = function(c, aria, corps){
  var e = (typeof window._escHtml === 'function') ? window._escHtml
        : function(x){ return String(x == null ? '' : x); };
  return '<svg viewBox="0 0 ' + c.w + ' ' + c.h + '" width="' + c.w + '" height="' + c.h + '"'
    + ' xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + e(aria || '') + '"'
    + ' style="display:block">' + (corps || '') + '</svg>';
};

// L'etat vide, un seul bloc pour toute l'application : ce qui manque, puis le
// geste qui le remplit. Un graphe non alimente ne trace JAMAIS une ligne plate
// ni un zero — un zero est une mesure.
window._mvGraphVide = function(quoi, geste){
  if(!document.getElementById('mv-graph-css')){
    var st = document.createElement('style');
    st.id = 'mv-graph-css';
    st.textContent =
      '.mv-graph-vide{border:1px dashed var(--gris);border-radius:12px;'
      + 'background:var(--terre-pale);padding:20px 18px;text-align:center}'
      + '.mv-graph-vide .t{font-size:13.5px;font-weight:600;color:var(--terre);line-height:1.4}'
      + '.mv-graph-vide .s{font-size:12.5px;color:var(--texte-med);margin-top:4px;line-height:1.55}';
    document.head.appendChild(st);
  }
  var e = (typeof window._escHtml === 'function') ? window._escHtml
        : function(x){ return String(x == null ? '' : x); };
  return '<div class="mv-graph-vide"><div class="t">'
    + e(quoi || 'Rien a afficher pour le moment') + '</div>'
    + (geste ? '<div class="s">' + e(geste) + '</div>' : '') + '</div>';
};

// ── Le registre : un graphe enregistre se repeint quand la largeur bouge ─────
var _MV_GRAPHS = [], _mvGraphHooked = false, _mvGraphTimer = null;

function _mvGraphDessine(e){
  var box = document.querySelector(e.sel);
  if(!box) return;                       // l'ecran n'est pas affiche : cas normal
  var w = window._mvGraphW(box, e.max);
  // Repeindre aussi quand le conteneur a ete reconstruit (nouvel element) ou
  // qu'il est vide : sinon un ecran rebati garde une case blanche.
  if(w === e.w && box === e.el && box.firstChild) return;
  var html;
  try { html = e.build(w); }
  catch(err){
    // Signale une fois par graphe et par session, jamais a chaque redimensionnement.
    if(!e.dit){
      e.dit = true;
      if(window.logError) window.logError({
        level: 'error', cat: 'graphe',
        msg: 'graphe impossible a dessiner',
        detail: e.sel + ' — ' + ((err && err.message) ? err.message : String(err))
      });
    }
    return;                              // on ne vide pas : l'ancien dessin vaut mieux que rien
  }
  e.w = w; e.el = box;
  box.innerHTML = (html == null) ? '' : html;
}

// Enregistre un graphe et le dessine tout de suite. Le selecteur doit etre
// stable : c'est lui qui identifie l'entree, et le dernier `build` fait foi.
// `opts.max` : plafond de largeur propre a CE graphe (voir _mvGraphW). Il se
// pose AVANT le premier dessin, sinon le graphe naitrait a 760 puis ne se
// redessinerait qu'au prochain redimensionnement.
window._mvGraphSuivre = function(sel, build, opts){
  if(!sel || typeof build !== 'function') return;
  var e = null, i;
  for(i = 0; i < _MV_GRAPHS.length; i++){ if(_MV_GRAPHS[i].sel === sel){ e = _MV_GRAPHS[i]; break; } }
  if(!e){ e = { sel: sel, w: 0, el: null, dit: false, max: 0 }; _MV_GRAPHS.push(e); }
  e.build = build;
  e.max = (opts && opts.max > 0) ? opts.max : 0;
  _mvGraphDessine(e);
  if(!_mvGraphHooked){
    _mvGraphHooked = true;
    window.addEventListener('resize', function(){
      if(_mvGraphTimer) clearTimeout(_mvGraphTimer);
      _mvGraphTimer = setTimeout(window._mvGraphRepeindre, 200);
    });
  }
};

// Oublie les graphes dont le selecteur commence par ce prefixe. Un ecran qui
// liste des elements — cuves, cuvees, parcelles — enregistre un graphe PAR
// element : sans oubli, le registre ne fait que grossir au fil de la session.
// L'ecran oublie sa famille avant de la reconstruire.
window._mvGraphOublier = function(prefixe){
  if(!prefixe) return;
  for(var i=_MV_GRAPHS.length-1; i>=0; i--)
    if(_MV_GRAPHS[i].sel.indexOf(prefixe) === 0) _MV_GRAPHS.splice(i,1);
};

// Repeint tous les graphes enregistres. Appele au redimensionnement, et
// appelable a la main apres un changement d'onglet.
window._mvGraphRepeindre = function(){
  for(var i = 0; i < _MV_GRAPHS.length; i++) _mvGraphDessine(_MV_GRAPHS[i]);
};

export const WHATS_NEW = [
  // 6.65 : correctif de l'ecran de recolte livre en 6.64 (le bloc de repartition
  // disparaissait a la deuxieme ouverture). Rien de NEUF pour l'utilisateur :
  // ce que 6.64 annonce est simplement redevenu vrai.
  { v: '6.66', items: [
    { emoji: 'carte', titre: 'La surface et le poids s\u2019\u00e9crivent \u00e0 la virgule, comme on les dit', desc: "Sur la r\u00e9partition d\u2019une r\u00e9colte, taper <b>0,12</b> ha ne marchait pas\u00a0: le champ n\u2019acceptait que le point, et il effa\u00e7ait la saisie <b>sans rien dire</b>. Pire, la ligne se redessinait \u00e0 chaque frappe et le curseur sautait d\u00e8s le premier chiffre. Surface, poids par caisse, litres de jus et de lie\u00a0: tous ces champs acceptent maintenant la <b>virgule</b> ou le point, et vous laissent taper tranquillement. La surface se lit et se r\u00e9\u00e9crit au <b>centi\u00e8me d\u2019hectare</b>." }
  ] },
  { v: '6.65', items: [] },
  { v: '6.64', items: [
    { emoji: 'carton', titre: 'Une r\u00e9colte peut partir chez plusieurs acheteurs \u00e0 la fois', desc: "Jusqu\u2019ici une r\u00e9colte n\u2019avait qu\u2019un destinataire\u00a0: deux n\u00e9goces sur la m\u00eame parcelle obligeaient \u00e0 saisir <b>deux r\u00e9coltes le m\u00eame jour</b>, et la parcelle \u00e9tait compt\u00e9e deux fois partout o\u00f9 on la compte une. La r\u00e9colte porte maintenant une <b>r\u00e9partition</b>\u00a0: une ligne par destinataire \u2014 le domaine et chaque acheteur \u2014 avec ses caisses. <b>Les hectolitres estim\u00e9s ne comptent que la part du domaine.</b>" },
    { emoji: 'balance', titre: 'Le poids d\u2019une caisse est celui du jour, et il ne bouge plus apr\u00e8s coup', desc: "Chaque ligne porte son propre poids par caisse\u00a0: les caisses d\u2019un n\u00e9goce ne p\u00e8sent pas celles d\u2019un autre, et le m\u00eame client peut changer de caisse d\u2019un jour \u00e0 l\u2019autre. La fiche du client <b>propose</b> son poids habituel, elle ne l\u2019impose plus. Avant, corriger cette fiche d\u00e9pla\u00e7ait <b>tous les kilos d\u00e9j\u00e0 livr\u00e9s</b>, y compris ceux d\u2019un bon d\u00e9j\u00e0 sign\u00e9. Ce n\u2019est plus le cas." },
    { emoji: 'document', titre: 'Le bon de livraison, et les litres que le client renvoie', desc: "Sur l\u2019\u00e9cran R\u00e9coltes, la ligne \u00ab\u00a0kg vendus en raisin\u00a0\u00bb ouvre les <b>ventes en vrac</b>\u00a0: un client, ses livraisons, son <b>bon de livraison</b> et son <b>r\u00e9cap de campagne</b> \u00e0 imprimer. Le bon ne dit que des kilos. Quand l\u2019acheteur renvoie ses <b>litres de jus et de lie</b>, on les saisit sur la livraison\u00a0: le rendement r\u00e9el en kg/hL appara\u00eet. Tant qu\u2019un retour manque, la livraison est marqu\u00e9e \u00ab\u00a0retour attendu\u00a0\u00bb." },
    { emoji: 'graphique', titre: 'Le rendement dit d\u00e9sormais ce qu\u2019il sait et ce qu\u2019il devine', desc: "Le rendement par parcelle \u00e9tait une <b>estimation</b> d\u2019apr\u00e8s les kilos, affich\u00e9e comme un chiffre net et compar\u00e9e au maximum de l\u2019appellation. Il va maintenant chercher le volume l\u00e0 o\u00f9 il a \u00e9t\u00e9 mesur\u00e9\u00a0: les litres rendus par l\u2019acheteur, puis le volume log\u00e9 en cuve. <b>Tant qu\u2019un volume manque, la parcelle affiche une fourchette</b> et la part r\u00e9ellement mesur\u00e9e \u2014 il manque des litres, pas des raisins. Le pourcentage du maximum s\u2019\u00e9crit alors \u00ab\u00a0\u2248\u00a0\u00bb." },
    { emoji: 'carte', titre: 'La surface, quand un acheteur prend une partie de la parcelle', desc: "Chaque destinataire peut porter sa <b>surface r\u00e9colt\u00e9e</b>. Laiss\u00e9e vide, la ligne prend tout le reste\u00a0: 12 ares vendus sur 34, et le domaine se voit attribuer les 22 restants sans rien taper. Le bon porte la surface \u2014 l\u2019acheteur en a besoin pour sa propre d\u00e9claration. <b>Une parcelle vendang\u00e9e en deux passages n\u2019est jamais compt\u00e9e deux fois.</b>" }
  ] },
  { v: '6.63', items: [
    { emoji: 'imprimante', titre: 'Le carnet d\u2019entretien imprim\u00e9 revient \u00e0 la normale', desc: "La derni\u00e8re mise \u00e0 jour avait mis des ic\u00f4nes dans la fiche d\u2019entretien du tracteur \u2014 sauf que ce carnet <b>s\u2019ouvre dans un autre onglet pour \u00eatre imprim\u00e9</b>, et l\u00e0 les ic\u00f4nes sortaient vides. C\u2019est corrig\u00e9\u00a0: le carnet a d\u00e9sormais ses propres dessins, ind\u00e9pendants de l\u2019application. <b>Aucune fiche, aucune case coch\u00e9e n\u2019est touch\u00e9e.</b>" }
  ] },
  { v: '6.62', items: [
    { emoji: 'cercle-pointille', titre: 'Les quatre \u00e9tats d\u2019une t\u00e2che se distinguent enfin', desc: "Dans les ronds de niveau, une t\u00e2che pouvait \u00eatre <b>faite</b>, <b>en cours</b>, <b>pas commenc\u00e9e</b>, ou <b>d\u00e9duite automatiquement</b>. Ce dernier cas s\u2019affichait avec un tilde \u2014 un signe de ponctuation, au milieu de trois ronds. Les quatre sont maintenant une famille\u00a0: coche, lecture, rond vide, et <b>rond en pointill\u00e9</b> pour ce que l\u2019application a d\u00e9duit sans que vous l\u2019ayez saisi. Le pointill\u00e9 dit exactement \u00e7a\u00a0: pas encore confirm\u00e9." },
    { emoji: 'outil', titre: 'La fiche d\u2019entretien du tracteur passe aux ic\u00f4nes', desc: "Plein, huile, filtre \u00e0 air, radiateur, pression des pneus, lavage\u00a0: les six points \u00e0 cocher, plus la m\u00e9t\u00e9o de la semaine et la fiche parcelle. <b>Rien de coch\u00e9 n\u2019a \u00e9t\u00e9 d\u00e9coch\u00e9.</b>" }
  ] },
  { v: '6.61', items: [
    { emoji: 'livre', titre: 'Le guide en ligne passe aux m\u00eames ic\u00f4nes que l\u2019application', desc: "Les <b>234 pictogrammes</b> du guide \u2014 titres de section, puces de conseil, sommaire \u2014 sont devenus les ic\u00f4nes de l\u2019application. C\u2019est la page que vous ouvrez depuis <b>R\u00e9glages \u203a Aide</b>, et celle qu\u2019un visiteur lit avant de vous appeler\u00a0: elle ne pouvait pas rester le dernier endroit avec des dessins d\u2019une autre \u00e9poque. <b>Pas un mot du guide n\u2019a chang\u00e9.</b>" }
  ] },
  { v: '6.60', items: [
    { emoji: 'etincelles', titre: 'L\u2019\u00e9cran des nouveaut\u00e9s passe aux vraies ic\u00f4nes', desc: "Celui que vous \u00eates en train de lire. Chacune des <b>346 nouveaut\u00e9s</b> \u00e9crites depuis le d\u00e9but portait un pictogramme, et c\u2019est l\u2019\u00e9cran que <b>tout le monde voit apr\u00e8s chaque mise \u00e0 jour</b> \u2014 donc le dernier endroit o\u00f9 il aurait fallu laisser des dessins qui changent d\u2019un appareil \u00e0 l\u2019autre. <b>Aucun texte n\u2019a \u00e9t\u00e9 touch\u00e9</b>\u00a0: les titres et les explications sont mot pour mot les m\u00eames qu\u2019\u00e0 leur publication." }
  ] },
  { v: '6.59', items: [
    { emoji: 'eprouvette', titre: 'Le catalogue phyto ne dit plus deux fois la m\u00eame chose', desc: "Chaque produit portait une pastille de couleur devant son nom \u2014 bleu pour le cuivre, jaune pour le soufre, vert pour un fongicide. Sauf que <b>le type est d\u00e9j\u00e0 \u00e9crit en toutes lettres au bout de la m\u00eame ligne</b>, dans une \u00e9tiquette de la m\u00eame couleur. La pastille r\u00e9p\u00e9tait l\u2019information \u00e0 six pixels d\u2019elle. Elle dispara\u00eet, l\u2019\u00e9tiquette reste\u00a0: <b>ni la couleur ni le mot ne sont perdus.</b>" },
    { emoji: 'graphique', titre: 'Le verdict de cadence a une vraie tuile', desc: "Sur l\u2019Exercice, le grand pictogramme en t\u00eate du verdict devient une <b>ic\u00f4ne dans un carr\u00e9 teint\u00e9</b>\u00a0: vert quand la cadence colle au bar\u00e8me, ambre en cas de d\u00e9rive, rouge quand le travail d\u00e9passe. La couleur dit toujours la m\u00eame chose, et le dessin ne change plus d\u2019un t\u00e9l\u00e9phone \u00e0 l\u2019autre." }
  ] },
  { v: '6.58', items: [
    { emoji: 'curseurs', titre: 'Les R\u00e9glages finissent leur passage aux ic\u00f4nes', desc: "Le choix des modules visibles par salari\u00e9, l\u2019historique d\u2019emploi (embauche, renouvellement, changement de taux) et les alertes de campagne gardaient leurs anciens pictogrammes. C\u2019est le dernier \u00e9cran de r\u00e9glage \u00e0 y passer. <b>Aucun param\u00e8tre n\u2019a chang\u00e9 de valeur.</b>" }
  ] },
  { v: '6.57', items: [
    { emoji: 'check', titre: 'Les messages de confirmation s\u2019all\u00e8gent encore', desc: "Vingt-huit bandeaux de plus perdent le petit signe qu\u2019ils affichaient devant leur texte. Le bandeau porte <b>d\u00e9j\u00e0 une pastille de couleur</b> \u2014 verte quand \u00e7a a march\u00e9, rouge sinon \u2014 et le signe disait la m\u00eame chose une deuxi\u00e8me fois. Les boutons qui passent en « V\u00e9rification\u2026 » ou « Cr\u00e9ation\u2026 » aussi." }
  ] },
  { v: '6.56', items: [
    { emoji: 'calendrier', titre: 'Le Planning passe aux vraies ic\u00f4nes', desc: "Les motifs d\u2019absence \u2014 arr\u00eat de travail, cong\u00e9 sans solde, \u00e9v\u00e9nement familial, formation, retard \u2014 avaient chacun leur pictogramme, et ils ne se dessinaient pas pareil d\u2019un t\u00e9l\u00e9phone \u00e0 l\u2019autre. Sur un \u00e9cran o\u00f9 on les compare en colonne, \u00e7a compte. La barre d\u2019actions et les cartes de compteur suivent aussi. <b>Aucune heure, aucun cong\u00e9 pos\u00e9 n\u2019est touch\u00e9.</b>" },
    { emoji: 'chrono', titre: 'La feuille d\u2019heures imprim\u00e9e reste lisible', desc: "Un jour en horaires chaleur s\u2019affichait avec un petit soleil. Le m\u00eame libell\u00e9 sert \u00e0 l\u2019\u00e9cran <b>et</b> \u00e0 la feuille d\u2019heures imprim\u00e9e, o\u00f9 ce genre de dessin peut sortir en carr\u00e9 vide selon l\u2019imprimante. Le jour est d\u00e9sormais \u00e9crit <b>Chaleur</b>, tout simplement \u2014 comme les six autres statuts, qui n\u2019ont jamais eu de dessin." }
  ] },
  { v: '6.55', items: [
    { emoji: 'graphique', titre: 'Le Pilotage passe aux vraies ic\u00f4nes', desc: "Les cartes de la Cave, l\u2019Exercice, la tourn\u00e9e des parcelles et les bandeaux d\u2019avertissement gardaient leurs anciens pictogrammes. Ils suivent maintenant le reste de l\u2019application, et prennent la couleur du texte au lieu de rester des taches vives en mode sombre. <b>Les pastilles de couleur restent des pastilles</b> \u2014 vert, orange, rouge disent quelque chose qu\u2019un dessin ne dirait pas. <b>Aucun chiffre n\u2019a boug\u00e9.</b>" }
  ] },
  { v: '6.54', items: [
    { emoji: 'verre', titre: 'La Cave passe aux vraies ic\u00f4nes, y compris \u00e0 l\u2019impression', desc: "Le Chai, le Cuvier, le journal des op\u00e9rations et les r\u00e9glages de cave gardaient leurs anciens pictogrammes. Surtout, <b>le registre de cave et le bilan de campagne</b> en imprimaient aussi \u2014 et un pictogramme ne se dessine pas pareil selon la machine qui imprime. Ils sortent maintenant avec les m\u00eames ic\u00f4nes que l\u2019\u00e9cran, identiques partout. <b>Aucun chiffre n\u2019a chang\u00e9</b>, et vos op\u00e9rations non plus." }
  ] },
  { v: '6.53', items: [
    { emoji: 'boussole', titre: 'La visite guid\u00e9e et la d\u00e9mo passent aux vraies ic\u00f4nes', desc: "C\u2019est le premier \u00e9cran qu\u2019un visiteur voit en cliquant « Voir la d\u00e9mo » sur le site, et le seul qui tournait encore enti\u00e8rement au pictogramme : le menu des chapitres, les six familles, le bandeau du haut. Il ressemble maintenant au reste de l\u2019application. <b>Rien ne change pour vous</b> si vous ne repassez pas par la visite." },
    { emoji: 'check', titre: 'Les messages de confirmation ne r\u00e9p\u00e8tent plus leur pastille', desc: "« Ordre enregistr\u00e9 », « Commune enregistr\u00e9e » : le bandeau qui appara\u00eet en bas de l\u2019\u00e9cran porte <b>d\u00e9j\u00e0 une pastille verte</b>, et le petit signe en plus disait la m\u00eame chose une deuxi\u00e8me fois. Les boutons « Enregistrement\u2026 » aussi. Un peu moins de bruit \u00e0 chaque geste." }
  ] },
  { v: '6.52', items: [
    { emoji: 'tracteur', titre: 'Les \u00e9crans du Tracteur passent aux vraies ic\u00f4nes', desc: "Le chrono, la cuve GNR, la prochaine r\u00e9vision et le catalogue des produits gardaient leurs anciens pictogrammes. Ils suivent maintenant le reste de l\u2019application \u2014 et, comme partout ailleurs, ils prennent la couleur du texte \u00e0 c\u00f4t\u00e9 d\u2019eux au lieu de rester des taches vives en mode sombre. <b>Aucun bouton n\u2019a chang\u00e9 de place.</b>" },
    { emoji: 'liste', titre: 'La liste des activit\u00e9s n\u2019affiche plus que leur nom', desc: "Dans le menu d\u00e9roulant d\u2019une session tracteur, chaque activit\u00e9 \u00e9tait pr\u00e9c\u00e9d\u00e9e de son pictogramme. Un menu d\u00e9roulant est le seul endroit de l\u2019application o\u00f9 une vraie ic\u00f4ne ne peut pas entrer \u2014 c\u2019est le navigateur qui le dessine, pas nous. Le pictogramme a donc <b>rejoint les puces de filtre</b>, juste au-dessus, o\u00f9 il est lisible partout. <b>Vos activit\u00e9s et vos sessions ne changent pas</b>, et celles d\u00e9j\u00e0 enregistr\u00e9es non plus." }
  ] },
  { v: '6.51', items: [
{ emoji: 'soleil', titre: 'Le mode sombre ne s\u2019arr\u00eate plus \u00e0 la porte des fen\u00eatres', desc: "En th\u00e8me sombre, chaque fen\u00eatre qui s\u2019ouvre par-dessus l\u2019\u00e9cran \u2014 une confirmation, un choix de parcelle, un export, les conditions d\u2019utilisation \u2014 sortait <b>en blanc</b>, en pleine nuit. Le soir au bureau ou t\u00f4t le matin dans la cuve, \u00e7a \u00e9blouissait \u00e0 chaque clic. <b>Trente-sept fen\u00eatres</b> \u00e9taient concern\u00e9es. Elles suivent d\u00e9sormais le th\u00e8me comme le reste de l\u2019application. <b>Rien ne change en th\u00e8me clair</b>, et aucune donn\u00e9e n\u2019est touch\u00e9e." }
  ] },
  { v: '6.50', items: [
    { emoji: 'curseurs', titre: 'Les fen\u00eatres et les titres passent aux m\u00eames ic\u00f4nes que le reste', desc: "Depuis le passage aux vraies ic\u00f4nes, une moiti\u00e9 de l\u2019application avait chang\u00e9 et l\u2019autre non\u00a0: les listes \u00e9taient nettes, mais d\u00e8s qu\u2019une fen\u00eatre s\u2019ouvrait par-dessus \u2014 une confirmation, un choix de c\u00e9page, un export, tout l\u2019\u00e9cran R\u00e9glages \u2014 les vieux pictogrammes revenaient. <b>Deux cent cinquante-deux</b> d\u2019entre eux viennent d\u2019y passer. Un pictogramme ne se dessine pas pareil sur un iPhone, un Android et un PC\u00a0; une ic\u00f4ne, si. <b>Rien n\u2019a boug\u00e9 dans vos donn\u00e9es</b>, et aucun bouton n\u2019a chang\u00e9 de place." },
    { emoji: 'oeil', titre: 'Les ic\u00f4nes suivent enfin le mode sombre partout', desc: "Un pictogramme garde sa couleur quoi qu\u2019on fasse\u00a0: en th\u00e8me sombre, les fen\u00eatres gardaient des taches vives sans rapport avec le reste. Les ic\u00f4nes, elles, prennent la couleur du texte \u00e0 c\u00f4t\u00e9 d\u2019elles \u2014 elles s\u2019\u00e9claircissent la nuit et se foncent au soleil, comme tout le reste de la page." }
  ] },
  { v: '6.48', items: [
    { emoji: 'euro', titre: 'Un \u00e9cran Achats\u00a0: le seul endroit o\u00f9 l\u2019on met les prix', desc: "Chaque module y d\u00e9pose ses lignes tout seul\u00a0: un achat saisi dans La R\u00e9serve, un lot de f\u00fbts, une machine rentr\u00e9e du r\u00e9parateur. Vous les chiffrez quand les factures arrivent, en une fois, dans <b>Pilotage \u203a \u00c9conomie \u203a Achats</b>. Le prix retourne dans la fiche d\u2019origine\u00a0: <b>rien \u00e0 ressaisir nulle part</b>. Un filtre montre ce qui reste \u00e0 chiffrer." },
    { emoji: 'cle', titre: 'Vous notez d\u00e9sormais chez qui part la machine', desc: "Quand un tracteur est signal\u00e9 chez le r\u00e9parateur, un champ demande le garage. Au retour, l\u2019intervention appara\u00eet dans Achats avec sa dur\u00e9e d\u2019immobilisation, en attente de son montant. <b>Aucun montant n\u2019est demand\u00e9 sur le terrain</b> \u2014 la facture arrive des semaines plus tard, et celui qui rend les cl\u00e9s ne l\u2019a pas. Les fiches d\u2019entretien quotidiennes, elles, ne remontent pas\u00a0: un plein de gazole n\u2019est pas un achat." },
    { emoji: 'graphique', titre: 'Ce que co\u00fbtent la vigne, la cave et le tracteur', desc: "L\u2019Exercice r\u00e9partit vos consommables par <b>atelier</b>, en plus de leur nature. Un bouton bascule entre les deux lectures. <b>Rien de plus \u00e0 saisir</b>\u00a0: l\u2019atelier se d\u00e9duit du type d\u2019intrant, et le carburant part au tracteur tout seul. Les salaires ne sont pas r\u00e9partis, et l\u2019\u00e9cran le dit\u00a0: le planning enregistre des heures, jamais l\u2019activit\u00e9 qui va avec." },
    { emoji: 'alerte', titre: 'L\u2019application pr\u00e9vient quand la r\u00e9partition devient bancale', desc: "Si un cinqui\u00e8me de vos consommables n\u2019est rattach\u00e9 \u00e0 aucun atelier, ou si des lignes restent sans montant, le bouton \u00ab\u00a0\u00e0 compl\u00e9ter\u00a0\u00bb du Pilotage le dit et vous emm\u00e8ne au bon endroit. Le total reste juste \u2014 mais <b>comparer les ateliers ne veut plus dire grand-chose</b> tant qu\u2019une part pareille reste de c\u00f4t\u00e9." },
    { emoji: 'balance', titre: 'Le co\u00fbt phyto par parcelle s\u2019affichait \u00e0 z\u00e9ro', desc: "Le Pilotage attendait un prix au kilo que <b>rien ne permettait de saisir</b>\u00a0: le co\u00fbt des traitements par parcelle restait donc vide depuis le d\u00e9but, sans que rien ne le signale. Il se calcule maintenant sur <b>vos factures d\u2019achat</b>, euros divis\u00e9s par quantit\u00e9, et s\u2019affiche sur chaque fiche d\u2019intrant. Les lignes sans prix sont \u00e9cart\u00e9es du calcul plut\u00f4t que compt\u00e9es \u00e0 z\u00e9ro \u2014 sinon la moyenne serait tir\u00e9e vers le bas sans en avoir l\u2019air. <b>Aucune saisie \u00e0 refaire</b>." }
  ] },
  { v: '6.47', items: [
    { emoji: 'calendrier', titre: 'Deux contrats qui se suivent n\u2019en font bien qu\u2019un', desc: "Quand un contrat se termine un 30 juin et que le suivant commence le 1er juillet, l\u2019application doit les traiter comme <b>une seule p\u00e9riode</b> \u2014 un seul compteur d\u2019heures, un seul plafond annuel. Elle ne le faisait plus : une comparaison de dates se trompait d\u2019un jour, et les deux contrats repartaient chacun de z\u00e9ro. Sur une feuille d\u2019heures, le compteur pouvait alors m\u00e9langer les deux. <b>Aucune saisie n\u2019est \u00e0 refaire</b> : le calcul se corrige tout seul \u00e0 la prochaine ouverture." }
  ] },
  { v: '6.46', items: [
    { emoji: 'balance', titre: 'Les chiffres s\u2019alignent enfin en colonne', desc: "Dans un tableau, un \u00ab 1 \u00bb est bien plus \u00e9troit qu\u2019un \u00ab 0 \u00bb : deux lignes l\u2019une sous l\u2019autre ne tombaient jamais en face. Sur les \u00e9crans du Pilotage et du Planning, l\u2019\u0153il devait relire chaque ligne au lieu de balayer la colonne. Tous les chiffres de l\u2019application ont d\u00e9sormais <b>la m\u00eame largeur</b>, d\u2019un bout \u00e0 l\u2019autre \u2014 les tableaux, les totaux et les heures se lisent en descendant. <b>Aucun chiffre n\u2019a chang\u00e9 de valeur</b> : c\u2019est leur alignement qui bouge, pas leur calcul." },
    { emoji: 'cible', titre: 'On voit o\u00f9 l\u2019on est quand on navigue au clavier', desc: "Sur ordinateur, en passant d\u2019un champ \u00e0 l\u2019autre avec la touche Tab, rien ne disait o\u00f9 l\u2019on \u00e9tait : il fallait cliquer pour en \u00eatre s\u00fbr. Un <b>liser\u00e9 dor\u00e9</b> entoure maintenant l\u2019\u00e9l\u00e9ment actif. Il n\u2019appara\u00eet qu\u2019au clavier \u2014 \u00e0 la souris et au doigt, rien ne change, et sur le t\u00e9l\u00e9phone au vignoble l\u2019\u00e9cran est strictement identique." }
  ] },
  { v: '6.45', items: [
    { emoji: 'personne', titre: 'Votre profil vous attend d\u00e9j\u00e0 \u00e0 l\u2019ouverture', desc: "Sur un domaine de dix ou quinze personnes, il fallait retrouver son nom dans la liste \u00e0 chaque ouverture \u2014 t\u00e9l\u00e9phone en main, souvent avec des gants. D\u00e9sormais l\u2019appareil se souvient du dernier profil qui s\u2019y est connect\u00e9 et n\u2019affiche que celui-l\u00e0. <b>La liste compl\u00e8te reste \u00e0 un seul geste</b> : \u00ab Ce n\u2019est pas moi \u00bb, juste en dessous. C\u2019est un confort, pas une protection : les noms n\u2019ont jamais \u00e9t\u00e9 secrets, ils sont \u00e9crits sur les tuiles. Sur une tablette partag\u00e9e, rien ne change vraiment \u2014 et une d\u00e9connexion volontaire efface le souvenir, comme elle efface d\u00e9j\u00e0 les donn\u00e9es du domaine sur l\u2019appareil." }
  ] },
  { v: '6.44', items: [
    { emoji: 'microscope', titre: 'Le Cuvier conna\u00eet vos cuves', desc: "En cr\u00e9ant une cuve de vinification, choisissez-la dans votre parc : son nom et sa contenance se remplissent tout seuls, et elle est marqu\u00e9e occup\u00e9e jusqu\u2019au d\u00e9cuvage. Plus besoin de retaper \u00ab Cuve 3 \u2014 inox 40 hL \u00bb \u00e0 chaque mill\u00e9sime. Surtout, <b>le parc \u00e0 cuves dit enfin la v\u00e9rit\u00e9</b> : jusqu\u2019ici il ne regardait que Le Chai et pouvait annoncer une cuve libre alors qu\u2019elle fermentait. Rien n\u2019est obligatoire \u2014 une cuve saisie \u00e0 la main fonctionne comme avant, et les champs que vous avez d\u00e9j\u00e0 remplis ne sont jamais \u00e9cras\u00e9s." }
  ] },
  { v: '6.43', items: [
    { emoji: 'raisin', titre: 'D\u00e9cuver dans une cuve, pas seulement en barriques', desc: "Au Cuvier, le bouton \u00ab D\u00e9cuver \u00bb demande maintenant o\u00f9 part le vin : <b>en barriques</b> (comme avant, et c\u2019est le choix par d\u00e9faut), <b>en cuve</b>, ou <b>les deux</b>. En mode mixte, ce qui ne tient pas dans la cuve est automatiquement converti en barriques, et un compteur montre en permanence combien d\u2019hectolitres sont log\u00e9s sur le volume d\u00e9cuv\u00e9. La cuve que vous \u00eates en train de vider reste propos\u00e9e \u2014 on \u00e9l\u00e8ve tr\u00e8s bien sur lies dans la cuve o\u00f9 l\u2019on a ferment\u00e9. Si votre parc \u00e0 cuves est vide, l\u2019\u00e9cran ne change pas d\u2019un pixel." }
  ] },
  { v: '6.42', items: [
    { emoji: 'barrique', titre: '\u00c9lever en cuve, pas seulement en f\u00fbt', desc: "Un vin peut vieillir en cuve inox, en b\u00e9ton ou en foudre bois \u2014 Le Chai ne connaissait que la barrique. D\u00e9clarez vos cuves une bonne fois dans <b>Cave \u203a Le Chai \u203a R\u00e9glages \u203a Le parc \u00e0 cuves</b> (un nom, une contenance en litres, la mati\u00e8re), puis logez-y une cuv\u00e9e depuis sa fiche, avec le volume r\u00e9ellement dedans \u2014 on remplit rarement \u00e0 ras. Une cuv\u00e9e peut tenir \u00e0 la fois des f\u00fbts et une cuve : les hectolitres du Chai, la mise en bouteille et le bilan du mill\u00e9sime comptent d\u00e9sormais les deux. Une cuve n\u2019est jamais compt\u00e9e comme un f\u00fbt : votre parc \u00e0 f\u00fbts de La R\u00e9serve ne bouge pas d\u2019une unit\u00e9." },
    { emoji: 'sablier', titre: 'Plus de rappel d\u2019ouillage sur ce qui ne s\u2019\u00e9vapore pas', desc: "L\u2019inox et le b\u00e9ton ne respirent pas : une cuv\u00e9e log\u00e9e uniquement dans ce type de cuve n\u2019a plus de jauge \u00ab part des anges \u00bb, ne passe plus au rouge, et ne compte plus dans les alertes du Chai. Sa fiche l\u2019\u00e9crit noir sur blanc plut\u00f4t que de laisser un blanc. Un foudre en bois, lui, garde son suivi. Et une cuv\u00e9e dont tous les f\u00fbts avaient \u00e9t\u00e9 retir\u00e9s affichait un \u00ab \u00e0 ouiller \u00bb rouge qui ne partait jamais : elle demande maintenant simplement qu\u2019on lui renseigne un contenant." }
  ] },
  { v:'6.41', items:[
    { emoji: 'carte', titre: "La carte des parcelles se bloquait sur \u00ab\u00a0Toutes t\u00e2ches\u00a0\u00bb",
      desc: "Sur l\u2019onglet <b>Parcelles</b>, filtre \u00ab\u00a0Toutes t\u00e2ches\u00a0\u00bb, le bandeau qui propose les tourn\u00e9es du domaine s\u2019interrompait et faisait appara\u00eetre un message d\u2019erreur rouge en bas de l\u2019\u00e9cran. Le pictogramme du travail manquait \u00e0 l\u2019appel devant chaque bouton de tourn\u00e9e\u00a0; il est de retour et le bandeau s\u2019affiche normalement." }
  ] },
  { v:'6.40', items:[
    { emoji: 'chrono', titre: "Le retard fonctionne sur un jour suppl\u00e9mentaire",
      desc: "Une journ\u00e9e <b>hors planning</b> dont vous aviez saisi les horaires \u2014 un renfort, une reprise, un jour \u00e9chang\u00e9 \u2014 refusait le retard avec \u00ab\u00a0aucune heure pr\u00e9vue ce jour-l\u00e0\u00a0\u00bb, et le d\u00e9tail affichait \u00ab\u00a0arriv\u00e9e \u00e0 07:30, pas apr\u00e8s 07:00\u00a0\u00bb alors que 07:30 est bien apr\u00e8s 07:00. Les heures de la journ\u00e9e \u00e9taient lues sur le planning, qui ne conna\u00eet pas ces jours-l\u00e0, au lieu de l\u2019horaire que vous aviez saisi. Le retard s\u2019y pose maintenant normalement, et <b>les horaires de la journ\u00e9e sont conserv\u00e9s</b>." }
  ] },
  { v:'6.39', items:[
    { emoji: 'chrono', titre: "Un retard sur un jour \u00e0 horaire d\u00e9cal\u00e9 n\u2019\u00e9tait pas enregistr\u00e9",
      desc: "Sur une journ\u00e9e dont l\u2019horaire avait \u00e9t\u00e9 saisi \u00e0 la main \u2014 une prise de poste avanc\u00e9e, un jour de vendange \u2014 la feuille affichait bien l\u2019heure de d\u00e9but du jour, mais le calcul, lui, se basait sur l\u2019horaire <b>par d\u00e9faut du planning</b>. R\u00e9sultat\u00a0: une arriv\u00e9e r\u00e9ellement en retard ressortait \u00ab\u00a0arriv\u00e9e \u00e0 l\u2019heure, aucune absence enregistr\u00e9e\u00a0\u00bb, et <b>rien n\u2019\u00e9tait \u00e9crit</b>. Le calcul lit maintenant l\u2019horaire du jour, celui-l\u00e0 m\u00eame qui est affich\u00e9." },
    { emoji: 'info', titre: "Le message dit d\u00e9sormais pourquoi rien n\u2019a \u00e9t\u00e9 enregistr\u00e9",
      desc: "Un jour <b>hors contrat</b> ou <b>sans heures pr\u00e9vues</b> affichait lui aussi \u00ab\u00a0arriv\u00e9e \u00e0 l\u2019heure\u00a0\u00bb, ce qui envoyait chercher l\u2019erreur au mauvais endroit. Chaque cas a maintenant son message." }
  ] },
  { v:'6.38', items:[
    { emoji: 'chrono', titre: "Un retard se note par l\u2019heure d\u2019arriv\u00e9e",
      desc: "Il fallait convertir soi-m\u00eame le retard en heures avant de le saisir. Vous indiquez d\u00e9sormais <b>l\u2019heure \u00e0 laquelle la personne est arriv\u00e9e</b>, et l\u2019\u00e9cran vous dit, avant d\u2019enregistrer, ce qui a \u00e9t\u00e9 travaill\u00e9 et ce qui est d\u00fb. La coupure d\u00e9jeuner est prise en compte : arriver \u00e0 14 h ne doit pas l\u2019heure du repas." },
    { emoji: 'alerte', titre: "Un retard d\u2019une heure effa\u00e7ait la journ\u00e9e enti\u00e8re",
      desc: "C\u2019est le d\u00e9faut le plus co\u00fbteux de ce lot. Noter un retard mettait la journ\u00e9e \u00e0 <b>z\u00e9ro heure</b> et ne comptait <b>aucune heure due</b> \u2014 sauf si le r\u00e9glage \u00ab\u00a0Absences qui doivent des heures\u00a0\u00bb avait \u00e9t\u00e9 pos\u00e9, ce qu\u2019il n\u2019est pas par d\u00e9faut. Une heure de retard co\u00fbtait donc sept heures au salari\u00e9. Le retard ne d\u00e9pend plus de ce r\u00e9glage : il retire ses propres heures, toujours, et la journ\u00e9e est pay\u00e9e \u00e0 hauteur de ce qui a \u00e9t\u00e9 fait. <b>Vos retards d\u00e9j\u00e0 saisis reprennent leurs vraies heures</b>, et les heures manqu\u00e9es apparaissent au compteur." },
    { emoji: 'calendrier', titre: "Le retard ne se confond plus avec une absence dans la grille",
      desc: "Une croix rouge marquait aussi bien un retard d\u2019une heure qu\u2019une journ\u00e9e enti\u00e8re manqu\u00e9e. La case du retard porte maintenant <b>les heures r\u00e9ellement faites</b>, en orange, avec une pastille. La fiche du jour affiche l\u2019horaire\u00a0: arriv\u00e9e \u2192 fin pr\u00e9vue." },
    { emoji: 'check', titre: "Arriver apr\u00e8s la fin de la journ\u00e9e n\u2019est plus un retard",
      desc: "Une arriv\u00e9e post\u00e9rieure \u00e0 l\u2019heure de d\u00e9bauche voulait dire que rien n\u2019avait \u00e9t\u00e9 travaill\u00e9. L\u2019enregistrement bascule seul en <b>absence injustifi\u00e9e</b>, qui dit la m\u00eame chose plus juste sur le relev\u00e9, et le message vous le signale." }
  ] },
  { v:'6.37', items:[
    { emoji: 'equipe', titre: "Les heures d\u2019un salari\u00e9 parti disparaissaient de tout l\u2019historique",
      desc: "Le jour o\u00f9 vous passez une fiche en <b>Inactif</b>, ses heures d\u00e9j\u00e0 faites s\u2019effa\u00e7aient de partout\u00a0: le r\u00e9cap annuel, la grille des mois pass\u00e9s, les totaux du mois, la cadence du Pilotage et le planning de l\u2019ann\u00e9e imprim\u00e9. Sur un domaine r\u00e9el, sept fiches rang\u00e9es en fin de saison ont ramen\u00e9 <b>janvier \u00e0 juillet \u00e0 z\u00e9ro</b>. Un contrat termin\u00e9 n\u2019efface plus le travail qui a \u00e9t\u00e9 fait\u00a0: chaque \u00e9cran regarde d\u00e9sormais <b>qui \u00e9tait l\u00e0 \u00e0 ce moment-l\u00e0</b>, pas qui est l\u00e0 aujourd\u2019hui." },
    { emoji: 'calendrier', titre: "Un ancien salari\u00e9 remonte dans la liste du mois o\u00f9 il travaillait",
      desc: "Dans <b>Les gens</b>, la liste et la grille suivent maintenant le mois affich\u00e9. Reculez en juin\u00a0: la saisonni\u00e8re dont le contrat s\u2019est termin\u00e9 en juillet y reprend sa ligne, avec ses heures. La section <b>Anciens salari\u00e9s</b>, en bas, ne garde que ceux qui n\u2019\u00e9taient pas sous contrat ce mois-l\u00e0 \u2014 plus personne n\u2019appara\u00eet deux fois." },
    { emoji: 'graphique', titre: "Le r\u00e9cap annuel dit enfin ce qu\u2019il mesure",
      desc: "Les douze barres ne sont pas un volume d\u2019heures\u00a0: c\u2019est la <b>part du pr\u00e9vu r\u00e9alis\u00e9e</b>, mois par mois. Une ligne sous les barres le dit, avec le total des heures faites et pr\u00e9vues sur l\u2019ann\u00e9e. Et le \u00ab\u00a0pr\u00e9vu\u00a0\u00bb est maintenant born\u00e9 aux contrats\u00a0: un permanent embauch\u00e9 en ao\u00fbt ne tra\u00eene plus sept mois de pr\u00e9visionnel face \u00e0 z\u00e9ro heure faite." },
    { emoji: 'dossier', titre: "Le relev\u00e9 et le planning d\u2019un ancien salari\u00e9 s\u2019\u00e9ditent encore",
      desc: "Les deux documents nominatifs refusaient de proposer une personne d\u00e8s que sa fiche passait en Inactif \u2014 exactement au moment o\u00f9 elle les demande, son d\u00e9part. Elle est de nouveau dans la liste, marqu\u00e9e \u00ab\u00a0ancien salari\u00e9\u00a0\u00bb." },
    { emoji: 'alerte', titre: "Le PDF mensuel chiffrait la mauvaise ann\u00e9e",
      desc: "Choisir \u00ab\u00a0juin 2025\u00a0\u00bb dans <b>R\u00e9glages \u203a Documents</b> pr\u00e9-remplissait les heures de juin de l\u2019ann\u00e9e ouverte dans le Planning, sans le dire. L\u2019ann\u00e9e du champ est enfin lue." }
  ] },
  { v:'6.36', items:[
    { emoji: 'carte', titre: "Le numéro de tournée n’est plus collé au nom",
      desc: "Quand une tournée est fixée, chaque parcelle porte son rang de passage. Il sortait en <b>chiffre nu, collé au nom</b> : « 1Comble ». Pire, il poussait le nom d’une largeur différente selon le rang, si bien qu’aucun nom ne commençait au même endroit d’une ligne à l’autre. Le numéro reprend sa pastille et une <b>largeur fixe</b> : la colonne des noms se lit d’un trait, même à quarante parcelles." },
    { emoji: 'check', titre: "Les boutons de validation ont de l’air et un nom",
      desc: "La colonne de droite était <b>collée au pourcentage</b>, avec du vide perdu à sa droite. Elle vient désormais au bord de la carte, sur toute la hauteur, et le pourcentage retrouve sa marge. Les deux gestes ne sont plus des pictogrammes à deviner : ils s’appellent <b>Début</b> et <b>Valider</b>." },
    { emoji: 'alerte', titre: "Le sablier et la coche s’affichaient au hasard du téléphone",
      desc: "C’étaient des émoji : chaque système les dessine à sa manière, et aucun ne prenait la couleur voulue — la coche s’affichait en noir sur certains Android alors qu’elle est censée être verte. Elles viennent maintenant du jeu d’icônes de l’application : même trait, même couleur, sur tous les téléphones." },
    { emoji: 'raisin', titre: "Les surfaces s’écrivent en français",
      desc: "La liste affichait « 0.2961 ha », avec un point. C’est une virgule : « 0,2961 ha ». La précision ne bouge pas." }
  ] },
  { v:'6.35', items:[
    { emoji: 'tracteur', titre: "Le carburant compte enfin vos vrais pleins",
      desc: "Vous mettez 30\u202fL dans un tracteur : jusqu\u2019ici, ces 30\u202fL n\u2019entraient nulle part dans le coût. Le carburant était <b>deviné</b> — heures de session × 6\u202fL/h × prix — et une session non notée faisait <b>disparaître</b> du carburant. Désormais le total, c\u2019est la somme de vos pleins. Les heures ne servent plus qu\u2019à le <b>répartir</b> entre les parcelles : une heure oubliée déplace du carburant d\u2019une parcelle à l\u2019autre, elle n\u2019en efface plus. Et chaque plein est valorisé au prix du litre <b>en vigueur à sa date</b>, plus au prix moyen de toute l\u2019année." },
    { emoji: 'goutte', titre: "Un plein se note toujours en litres",
      desc: "Cocher «\u202fPlein fait\u202f» dans une fiche d\u2019entretien ne demandait <b>aucun litre</b> : le plein était enregistré, le chiffre perdu. Le champ apparaît maintenant dès que vous cochez la case, et la cuve en est décomptée comme avec le bouton «\u202fPlein\u202f». Corriger un chiffre trop haut ou décocher la case <b>rend les litres à la cuve</b>. Les litres s\u2019affichent aussi dans le carnet, à côté du point de contrôle." },
    { emoji: 'alerte', titre: "Un poste qui n\u2019est pas mesuré le dit",
      desc: "Tant qu\u2019aucun plein n\u2019est relevé sur la période, le carburant reste calculé à l\u2019ancienne — et la ligne affiche «\u202fL ESTIMÉS\u202f» au lieu de «\u202fL relevés\u202f». Si des pleins ont été cochés sans litres, leur nombre est indiqué : c\u2019est toute la différence entre «\u202fpeu de carburant\u202f» et «\u202fcarburant mal relevé\u202f»." }
  ] },
  { v:'6.34', items:[
    { emoji: 'check', titre: "Les ic\u00f4nes des bandeaux du haut \u00e9taient presque invisibles",
      desc: "\u00c0 c\u00f4t\u00e9 du titre de chaque \u00e9cran, l\u2019ic\u00f4ne se fondait dans le fond sombre du bandeau et devenait tr\u00e8s difficile \u00e0 voir. C\u2019est corrig\u00e9 : elle reprend <b>la m\u00eame couleur cr\u00e8me que le titre</b>." }
  ] },
  { v:'6.33', items:[
    { emoji: 'barrique', titre: "Cinq \u00e9crans gardaient encore les anciens dessins",
      desc: "Le Planning, La R\u00e9serve, Le Chai, Le Cuvier et Le mill\u00e9sime affichaient toujours de vieux pictogrammes en haut de page, l\u00e0 o\u00f9 le reste de l\u2019application avait chang\u00e9. C\u2019est align\u00e9. Au passage, <b>les f\u00fbts ont enfin un dessin de f\u00fbt</b> \u2014 c\u2019\u00e9tait un caddie dans La R\u00e9serve et un bidon dans Le Chai." },
    { emoji: 'plus', titre: "Les modules du bas se voient mieux",
      desc: "Dans la barre du bas, chaque module vit d\u00e9sormais dans un carr\u00e9 en relief : creus\u00e9 quand il est ferm\u00e9, <b>en or quand il est ouvert</b>. Le petit trait dor\u00e9 tout en haut de la barre, qu\u2019on ne remarquait jamais, dispara\u00eet." }
  ] },
  { v:'6.32', items:[
    { emoji: 'nuage', titre: "La m\u00e9t\u00e9o par secteur affichait un mot \u00e0 la place du dessin",
      desc: "Sur l\u2019accueil, chaque commune montrait \u00ab\u202fsoleil\u202f\u00bb ou \u00ab\u202fnuage\u202f\u00bb \u00e9crit en gros par-dessus son nom. C\u2019est corrig\u00e9 : le dessin revient, et <b>vos relev\u00e9s d\u00e9j\u00e0 enregistr\u00e9s restent lisibles</b>." },
    { emoji: 'boussole', titre: "Les bandeaux du haut passent aux m\u00eames ic\u00f4nes",
      desc: "Le titre de chaque \u00e9cran, les sous-onglets (Accueil, Parcelles, Journal\u2026) et les boutons ronds en haut \u00e0 droite \u00e9taient rest\u00e9s en \u00e9mojis. Ils rejoignent le jeu d\u2019ic\u00f4nes du reste de l\u2019application \u2014 <b>trente-neuf pictogrammes remplac\u00e9s</b>." }
  ] },
  { v:'6.31', items:[
    { emoji: 'euro', titre: "L\u2019onglet \u00c9conomie du Pilotage retrouve son ic\u00f4ne",
      desc: "Dernier carr\u00e9 rouge en pointill\u00e9s : l\u2019onglet \u00c9conomie du Pilotage. C\u2019est corrig\u00e9." }
  ] },
  { v:'6.30', items:[
    { emoji: 'boussole', titre: "Les onglets du Pilotage affichaient un carr\u00e9 rouge",
      desc: "Les neuf onglets de l\u2019\u00e9cran Pilotage montraient un carr\u00e9 rouge en pointill\u00e9s \u00e0 la place de leur ic\u00f4ne. C\u2019est corrig\u00e9 : ils ont les m\u00eames ic\u00f4nes que le reste de l\u2019application." }
  ] },
  { v:'6.29', items:[
    { emoji: 'outil', titre: "Pilotage \u00e0 nouveau utilisable",
      desc: "L\u2019\u00e9cran Pilotage ne r\u00e9pondait plus aux clics depuis la derni\u00e8re mise \u00e0 jour. <b>C\u2019est r\u00e9par\u00e9.</b> Au passage, la m\u00e9t\u00e9o de l\u2019en-t\u00eate affichait \u00ab\u202fnuage\u202f\u00bb \u00e9crit en toutes lettres, et la barre d\u2019onglets \u00e9tait la derni\u00e8re \u00e0 garder des \u00e9mojis : les deux sont corrig\u00e9es." },
  ] },
  { v:'6.28', items:[
    { emoji: 'outil', titre: "Deux ic\u00f4nes manquantes r\u00e9par\u00e9es",
      desc: "Sur le tableau de bord, la vignette \u00c9quipe et l\u2019ic\u00f4ne de beau temps affichaient un carr\u00e9 rouge en pointill\u00e9s \u00e0 la place du dessin. C\u2019est corrig\u00e9. <b>Ce carr\u00e9 n\u2019est pas un bogue d\u2019affichage, c\u2019est un signal volontaire</b> : plut\u00f4t qu\u2019un blanc qu\u2019on ne remarque jamais, une ic\u00f4ne absente se voit tout de suite." }
  ] },
  { v:'6.27', items:[
    { emoji: 'balance', titre: "L\u2019accueil et les parcelles ont \u00e9t\u00e9 remis \u00e0 plat",
      desc: "Les informations \u00e9taient empil\u00e9es les unes sous les autres, s\u00e9par\u00e9es par des traits, et tout avait la m\u00eame importance \u00e0 l\u2019\u0153il. D\u00e9sormais <b>chaque parcelle est une carte</b>, avec de l\u2019air autour, et <b>trois niveaux de lecture</b> : le nom, le chiffre qui compte, et le d\u00e9tail en petit. Sur l\u2019accueil, l\u2019avancement de la saison devient le sujet de l\u2019\u00e9cran au lieu d\u2019une vignette parmi d\u2019autres." },
    { emoji: 'valide', titre: "L\u2019\u00e9tat d\u2019une parcelle se lit d\u2019un coup d\u2019\u0153il",
      desc: "Chaque carte porte une <b>\u00e9tiquette de couleur cal\u00e9e \u00e0 droite</b> \u2014 en cours, bient\u00f4t fini, saison termin\u00e9e. Elles sont toujours au m\u00eame endroit : en descendant une liste de quarante parcelles, l\u2019\u0153il suit une colonne au lieu de chercher. Les pourcentages sont align\u00e9s au chiffre pr\u00e8s, \u00ab\u202f62\u202f%\u202f\u00bb et \u00ab\u202f100\u202f%\u202f\u00bb ne se d\u00e9calent plus." },
    { emoji: 'alerte', titre: "Le d\u00e9lai de r\u00e9entr\u00e9e ne se rate plus",
      desc: "Un d\u00e9lai de r\u00e9entr\u00e9e en cours \u00e9tait signal\u00e9 par un fin liser\u00e9 rouge sur le bord de la carte. C\u2019est maintenant une <b>\u00e9tiquette rouge dans la liste</b> et, dans la fiche, <b>un encart \u00e0 part avec le nombre d\u2019heures restantes en gros</b>. C\u2019est une obligation r\u00e9glementaire : elle doit arr\u00eater l\u2019\u0153il, pas se deviner." },
    { emoji: 'raisin', titre: "Le logo GUERETTECH remplace la grappe g\u00e9n\u00e9rique",
      desc: "L\u2019\u00e9cran de connexion et la premi\u00e8re installation affichaient l\u2019\u00e9moji grappe du t\u00e9l\u00e9phone \u2014 diff\u00e9rent sur chaque appareil. Ils affichent maintenant <b>le vrai logo</b>." },
    { emoji: 'balance', titre: "Les espaces suivent enfin une r\u00e8gle",
      desc: "Les marges de l\u2019application \u00e9taient choisies une par une \u2014 vingt valeurs diff\u00e9rentes, de 1 \u00e0 20 pixels. Les nouvelles cartes suivent maintenant <b>une \u00e9chelle unique par multiples de 4</b>, et les tailles de texte aussi. Les \u00e9crans respirent au m\u00eame rythme. Le reste de l\u2019application s\u2019y rangera \u00e9cran par \u00e9cran." },
    { emoji: 'bouclier', titre: "La console d\u2019administration aussi",
      desc: "L\u2019\u00e9cran r\u00e9serv\u00e9 \u00e0 l\u2019\u00e9diteur passe aux m\u00eames ic\u00f4nes. <b>Le journal des acc\u00e8s d\u00e9j\u00e0 enregistr\u00e9 reste lisible tel quel</b> : les lignes anciennes gardent leur pictogramme, on ne r\u00e9\u00e9crit pas un journal." },
    { emoji: 'rotation', titre: "Le bandeau de synchronisation et l\u2019\u00e9quipe du jour",
      desc: "Le bandeau du haut, la bulle de synchronisation, les pastilles d\u2019\u00e9quipe et le filtre du journal sont pass\u00e9s aux m\u00eames ic\u00f4nes. <b>Le bandeau reste color\u00e9</b> \u2014 vert quand tout est \u00e0 jour, orange quand il reste des modifications en attente." },
    { emoji: 'valide', titre: "Les boutons d\u2019une parcelle et les contr\u00f4les tracteur",
      desc: "Les boutons Niveaux, Passages, Annuler et Exclure d\u2019une fiche parcelle ont de vraies ic\u00f4nes. Les <b>six points de contr\u00f4le tracteur</b> (plein, huile, filtre, radiateur, pneus, lavage) n\u2019ont plus de pictogramme : leur nom est \u00e9crit juste \u00e0 c\u00f4t\u00e9, il y en avait six \u00e0 retenir pour rien." },
    { emoji: 'etincelles', titre: "Phyto, synchronisation et premi\u00e8re installation nettoy\u00e9s",
      desc: "Le bandeau de synchronisation en haut d\u2019\u00e9cran, les messages d\u2019erreur de connexion et l\u2019\u00e9cran de premi\u00e8re installation ne portent plus de petits dessins : la <b>couleur du bandeau dit d\u00e9j\u00e0</b> si c\u2019est en cours, r\u00e9ussi ou en attente." },
    { emoji: 'graphique', titre: "Pilotage : un seul jeu d\u2019ic\u00f4nes pour toute l\u2019application",
      desc: "L\u2019\u00e9cran Pilotage avait ses propres dessins, avec un trait un peu plus fin que partout ailleurs \u2014 une diff\u00e9rence qu\u2019on ne voit pas mais qu\u2019on sent. Il utilise maintenant <b>les m\u00eames ic\u00f4nes que le reste de l\u2019application</b>. Les pictogrammes des t\u00e2ches ont \u00e9t\u00e9 retir\u00e9s des listes : le nom du travail suffit." },
    { emoji: 'nuage', titre: "La m\u00e9t\u00e9o et les fiches d\u2019aide en vraies ic\u00f4nes",
      desc: "Le soleil, le nuage et la pluie affich\u00e9s sur l\u2019accueil \u00e9taient des \u00e9mojis : ils sont devenus des ic\u00f4nes nettes, de la m\u00eame famille que le reste. Les onze fiches d\u2019aide (le bouton \u00ab\u202f?\u202f\u00bb de chaque \u00e9cran) aussi. <b>Vos rel\u00e9v\u00e9s m\u00e9t\u00e9o d\u00e9j\u00e0 enregistr\u00e9s continuent de s\u2019afficher normalement</b>." },
    { emoji: 'carte', titre: "Moins de pictogrammes partout ailleurs",
      desc: "Messages de connexion, \u00e9crans d\u2019attente, filtres par t\u00e2che, avancement par t\u00e2che, alerte gel : les petits dessins qui pr\u00e9c\u00e9daient les textes ont \u00e9t\u00e9 retir\u00e9s ou remplac\u00e9s par de vraies ic\u00f4nes. Sur l\u2019ensemble de l\u2019application, on est pass\u00e9 de <b>920 pictogrammes \u00e0 422</b>." },
    { emoji: 'verre', titre: "La Cave se lit comme le reste",
      desc: "R\u00e9coltes, cuves, analyses et clients vrac passent aux m\u00eames \u00e9tiquettes de couleur. Les huit op\u00e9rations de cuve (chaptalisation, saign\u00e9e, levurage\u2026) <b>n\u2019ont plus de pictogramme</b> : le mot les dit mieux \u2014 huit petits dessins \u00e0 retenir, c\u2019\u00e9tait sept de trop." },
    { emoji: 'tracteur', titre: "Les sessions tracteur adoptent les m\u00eames cartes",
      desc: "Sessions, parc de machines, fiches de contr\u00f4le et historique de r\u00e9parations passent \u00e0 la m\u00eame pr\u00e9sentation : l\u2019activit\u00e9 en t\u00eate, <b>l\u2019\u00e9tat en \u00e9tiquette de couleur \u00e0 droite</b>, l\u2019avancement en gros chiffre. <b>La carte sombre d\u2019une session en cours reste sombre</b> \u2014 elle est faite pour se lire en cabine, au soleil." },
    { emoji: 'journal', titre: "Le journal se lit comme les parcelles",
      desc: "Chaque entr\u00e9e du journal devient une carte, avec le travail en t\u00eate, la personne et la parcelle en dessous, et <b>l\u2019\u00e9tat en \u00e9tiquette de couleur cal\u00e9e \u00e0 droite</b>. Le pictogramme qui pr\u00e9c\u00e9dait chaque travail a \u00e9t\u00e9 retir\u00e9. <b>La frise verticale \u00e0 gauche reste</b> : c\u2019est elle qui donne le fil du temps." },
    { emoji: 'boussole', titre: "La barre du bas a de vraies ic\u00f4nes",
      desc: "Les pictogrammes de la barre de navigation \u00e9taient des \u00e9mojis gris\u00e9s par un filtre. Ce sont maintenant <b>de vraies ic\u00f4nes</b>, toutes de la m\u00eame taille, qui <b>prennent la couleur verte de l\u2019onglet actif</b> au lieu d\u2019\u00eatre \u00e9teintes par un voile gris. C\u2019est plus net, et lisible en plein soleil." },
    { emoji: 'engrenage', titre: "Les \u00e9crans de R\u00e9glages passent aux m\u00eames cartes",
      desc: "Vos travaux, vos activit\u00e9s tracteur et les fiches d\u2019\u00e9quipe adoptent la m\u00eame pr\u00e9sentation que les parcelles : <b>une carte par \u00e9l\u00e9ment</b>, le nom en t\u00eate, les \u00e9tiquettes d\u2019\u00e9tat cal\u00e9es \u00e0 droite, et les boutons Modifier et Supprimer regroup\u00e9s en bas. <b>Rien ne change dans ce que font ces \u00e9crans</b> \u2014 ils se lisent simplement plus vite." },
    { emoji: 'loupe', titre: "La fiche d\u2019une parcelle tient sur un regard",
      desc: "Trois chiffres en t\u00eate \u2014 avancement, surface, travaux faits \u2014 puis les travaux de la saison en lignes align\u00e9es. Les pictogrammes qui pr\u00e9c\u00e9daient chaque ligne ont \u00e9t\u00e9 retir\u00e9s : <b>dans une liste, c\u2019est le texte qui porte l\u2019information</b>, et l\u2019\u0153il descend plus vite sans eux." }
  ] },
  { v:'6.26', items:[
    { emoji: 'etincelles', titre: "Les pictogrammes de R\u00e9glages sont devenus de vraies ic\u00f4nes",
      desc: "Les petits dessins color\u00e9s de l\u2019\u00e9cran R\u00e9glages \u00e9taient des \u00e9mojis : chaque t\u00e9l\u00e9phone les dessinait \u00e0 sa fa\u00e7on, ils ne s\u2019alignaient jamais avec le texte et gardaient leur couleur, m\u00eame en mode sombre ou en plein soleil. Ils sont remplac\u00e9s par un <b>jeu d\u2019ic\u00f4nes dessin\u00e9 pour l\u2019application</b>, identique partout, qui prend la couleur du texte \u00e0 c\u00f4t\u00e9 \u2014 et qui reste lisible \u00e0 la taille d\u2019un badge. <b>Rien ne change dans ce que fait l\u2019\u00e9cran</b> \u2014 c\u2019est son aspect qui change. Les autres \u00e9crans suivront." },
    { emoji: 'tracteur', titre: "L\u2019ic\u00f4ne d\u2019un type d\u2019activit\u00e9 se choisit dans une planche, plus dans une liste d\u2019\u00e9mojis",
      desc: "Quand vous cr\u00e9ez ou modifiez un type d\u2019activit\u00e9 tracteur, vous choisissez maintenant parmi <b>dix-huit ic\u00f4nes</b> au lieu de dix-huit \u00e9mojis. <b>Vos activit\u00e9s existantes gardent leur dessin</b> : rien n\u2019a \u00e9t\u00e9 r\u00e9\u00e9crit dans vos donn\u00e9es, l\u2019ancien \u00e9moji est simplement traduit \u00e0 l\u2019affichage." },
    { emoji: 'document', titre: "Le rapport mensuel et le registre phyto n\u2019impriment plus d\u2019\u00e9mojis",
      desc: "Sur un document imprim\u00e9 ou transform\u00e9 en PDF, un \u00e9moji sort en couleur au milieu d\u2019une page en noir \u2014 quand il ne sort pas en carr\u00e9 vide. Les documents produits depuis R\u00e9glages (rapport du mois, registre phytosanitaire, d\u00e9tail tracteur) utilisent d\u00e9sormais <b>les m\u00eames ic\u00f4nes que l\u2019\u00e9cran</b>, en noir, et les titres de section s\u2019appuient sur leur typographie plut\u00f4t que sur un pictogramme." },
    { emoji: 'valide', titre: "Les messages de confirmation ne r\u00e9p\u00e8tent plus leur pastille",
      desc: "\u00ab\u202f\u2705 Lien envoy\u00e9\u202f\u00bb, \u00ab\u202f\u274c Erreur\u202f\u00bb : le bandeau qui appara\u00eet en bas de l\u2019\u00e9cran porte <b>d\u00e9j\u00e0 une pastille de couleur</b> qui dit si \u00e7a a march\u00e9. L\u2019\u00e9moji en t\u00eate du message disait la m\u00eame chose une deuxi\u00e8me fois. Les messages ne gardent que leur phrase." }
  ] },
  { v:'6.25', items:[
    { emoji: 'ouvrier', titre: "La visite guid\u00e9e montre l\u2019\u00e9cran d\u2019un ouvrier \u2014 et qu\u2019un oubli se rattrape",
      desc: "La d\u00e9mo publique (le lien \u00ab\u202fVoir la d\u00e9mo\u202f\u00bb) faisait visiter le domaine depuis votre fauteuil, jamais depuis le t\u00e9l\u00e9phone de vos salari\u00e9s. Elle bascule d\u00e9sormais sur <b>la liste des parcelles telle qu\u2019un ouvrier l\u2019ouvre</b> : la t\u00e2che du jour, ses parcelles, un \u2713 \u00e0 cocher, rien d\u2019autre. Et le moment suivant montre que <b>vous pouvez cocher \u00e0 sa place</b> si personne ne l\u2019a fait \u2014 c\u2019est la premi\u00e8re question que pose tout le monde. <b>Rien ne change dans l\u2019application</b> : c\u2019est la vitrine qui change." },
    { emoji: 'bouclier', titre: "La d\u00e9mo montre une parcelle ferm\u00e9e par un d\u00e9lai de rentr\u00e9e",
      desc: "Elle promettait \u00ab\u202fdemain, la parcelle trait\u00e9e s\u2019affichera ferm\u00e9e\u202f\u00bb sans jamais le montrer. Deux parcelles apparaissent maintenant <b>barr\u00e9es en rouge dans la liste</b>, en accord avec ce que le Pilotage affichait d\u00e9j\u00e0 de son c\u00f4t\u00e9. La liste et le Pilotage se contredisaient." },
    { emoji: 'calendrier', titre: "Le bouton \u00ab\u202fPasser\u202f\u00bb de la visite quittait tout",
      desc: "Il annon\u00e7ait un saut d\u2019\u00e9cran et faisait une sortie : le visiteur perdait tous les moments suivants. Il y a d\u00e9sormais <b>\u00ab\u202fPasser ce moment\u202f\u00bb</b> et <b>\u00ab\u202fQuitter\u202f\u00bb</b>, et quitter m\u00e8ne au r\u00e9capitulatif final." },
    { emoji: 'chrono', titre: "Le r\u00e9capitulatif de fin ne compte plus que ce qu\u2019il a montr\u00e9",
      desc: "La plus grosse ligne du calcul de temps gagn\u00e9 n\u2019\u00e9tait <b>d\u00e9montr\u00e9e par aucun \u00e9cran</b> de la visite. Elle est sortie du total et annonc\u00e9e \u00e0 part. Trois lignes la remplacent \u2014 pointage du soir, carnet tracteur, papiers du contr\u00f4le \u2014 et chacune correspond \u00e0 un \u00e9cran que le visiteur vient de voir. Et <b>le r\u00e9capitulatif ne cite plus aucun tarif</b> : il ne compte qu\u2019en heures et en journ\u00e9es de bureau. Le prix se dit de vive voix." }
  ] },
  { v:'6.24', items:[
    { emoji: 'graphique', titre: "Les chiffres du haut du Pilotage ne vous suivent plus partout",
      desc: "Les quatre chiffres en t\u00eate du Pilotage s\u2019affichaient sur les <b>huit onglets</b>. Sur \u00c9conomie et sur Conformit\u00e9, ils r\u00e9p\u00e9taient mot pour mot l\u2019\u00e9cran juste en dessous. Ils ne restent d\u00e9sormais que sur <b>L\u2019ann\u00e9e</b> et <b>La campagne</b> \u2014 les deux niveaux de zoom, les deux endroits o\u00f9 ils servent \u00e0 choisir o\u00f9 aller. Sur Aujourd\u2019hui, le tableau de bord r\u00e9pondait d\u00e9j\u00e0 aux m\u00eames questions, en mieux." },
    { emoji: 'bouclier', titre: "La conformit\u00e9 quitte les chiffres du haut \u2014 elle ne parlait pas de la m\u00eame chose",
      desc: "Les trois autres chiffres se recadrent quand vous cliquez une campagne. Le cuivre, lui, se compte sur <b>sept ans glissants</b> : il ne bougeait pas, et donnait l\u2019impression d\u2019un chiffre fig\u00e9 ou faux. Il se lit en entier dans l\u2019onglet <b>Conformit\u00e9</b>. Rien n\u2019est perdu : le bouton \u00ab\u202f\u00e0 compl\u00e9ter\u202f\u00bb continue de remonter ses alertes, sur tous les onglets." },
    { emoji: 'goutte', titre: "La fen\u00eatre de traitement \u00e9tait affich\u00e9e \u00e0 deux endroits",
      desc: "La m\u00eame pr\u00e9vision vivait sur <b>Aujourd\u2019hui</b> (\u00ab\u202fTraiter\u202f?\u202f\u00bb) et dans <b>L\u2019\u00e9quipe &amp; le mat\u00e9riel</b> \u2014 deux cartes, une seule source. C\u2019est une d\u00e9cision du jour : elle reste dans Aujourd\u2019hui. Le verdict du moment est en grand, et <b>les cinq jours \u00e0 venir</b> se d\u00e9plient d\u2019un doigt juste en dessous. Rien n\u2019a \u00e9t\u00e9 retir\u00e9 du calcul." },
    { emoji: 'feuille', titre: "Le registre phyto passe dans Conformit\u00e9",
      desc: "Il \u00e9tait rang\u00e9 \u00e0 c\u00f4t\u00e9 du parc de tracteurs, alors qu\u2019il lit <b>exactement les m\u00eames traitements</b> que \u00ab\u202fPassages phyto / parcelle\u202f\u00bb. Il se place maintenant juste en dessous, en d\u00e9tail de ce total. Si vous l\u2019aviez masqu\u00e9, il reste masqu\u00e9 : votre r\u00e9glage a suivi la carte." },
    { emoji: 'curseurs', titre: "\u00ab\u202fSimuler\u202f\u00bb s\u2019appelle maintenant \u00ab\u202fD\u00e9cider\u202f\u00bb",
      desc: "Deux des trois cartes de cet onglet sont bien des simulations \u2014 rien n\u2019y est enregistr\u00e9. Mais la troisi\u00e8me, <b>l\u2019ordre de passage</b>, s\u2019enregistre et part sur l\u2019\u00e9cran de toute l\u2019\u00e9quipe. C\u2019est le seul endroit du Pilotage o\u00f9 vous changez ce que les autres voient, et il \u00e9tait rang\u00e9 sous un mot qui promettait le contraire. Rien ne change dans son fonctionnement." },
    { emoji: 'euro', titre: "Le budget de l\u2019ann\u00e9e se lit enfin mois par mois",
      desc: "Nouveau graphe dans <b>L\u2019ann\u00e9e</b> : votre <b>budget de vigne pr\u00e9vu</b> au bar\u00e8me (en tiret\u00e9) face \u00e0 la <b>d\u00e9pense r\u00e9elle</b> (en trait plein), cumul\u00e9s d\u2019un mois \u00e0 l\u2019autre. Les deux totaux \u00e9taient d\u00e9j\u00e0 sur la carte au-dessus ; la courbe dit <b>\u00e0 quel moment</b> l\u2019\u00e9cart se creuse. \u26a0\ufe0f <b>Cet \u00e9cart n\u2019est pas un d\u00e9passement</b> : le pr\u00e9vu ne chiffre que le travail de vigne, la d\u00e9pense r\u00e9elle porte tout le domaine, cave et atelier compris. L\u2019\u00e9cran l\u2019\u00e9crit sous le graphe." },
  ] },
  { v:'6.23', items:[
    { emoji: 'doigt', titre: "Le Pilotage tient enfin sur un t\u00e9l\u00e9phone",
      desc: "Sur t\u00e9l\u00e9phone, il fallait descendre de <b>728 pixels</b> \u2014 presque un \u00e9cran entier \u2014 avant d\u2019atteindre le premier chiffre. Cinq bandeaux s\u2019empilaient\u202f: le nom du domaine, le fil d\u2019Ariane, les onglets, les quatre chiffres du haut, puis le titre de l\u2019onglet. C\u2019est tomb\u00e9 \u00e0 <b>442 pixels</b>. Le <b>titre de l\u2019onglet</b> a disparu\u202f: la barre d\u2019onglets le disait d\u00e9j\u00e0. Les <b>quatre chiffres du haut</b> se rangent en une ligne qui d\u00e9file, au lieu de deux rang\u00e9es \u2014 ils restent tous les quatre, et tous visibles. Le <b>nom du domaine</b> prend moins de place\u202f: on sait chez qui on est." },
    { emoji: 'engrenage', titre: "\u00ab\u202fChoisir les indicateurs\u202f\u00bb devient une roue crant\u00e9e",
      desc: "Le bouton occupait une ligne enti\u00e8re \u00e0 lui seul. Il est maintenant \u00e0 droite du sous-titre de l\u2019onglet, sous forme de <b>roue crant\u00e9e</b>. Le panneau qu\u2019il ouvre n\u2019a pas boug\u00e9." },
  ] },
  { v:'6.22', items:[
    { emoji: 'curseurs', titre: "Le simulateur\u202f: les notices \u00ab\u202fcomment lire\u202f\u00bb passent derri\u00e8re le \u00ab\u202fi\u202f\u00bb",
      desc: "Chaque \u00e9tape du simulateur portait un pav\u00e9 \u00ab\u202fComment lire\u202f\u00bb entre son titre et son graphique \u2014 six au total. Utile la premi\u00e8re fois\u202f; ensuite on le traversait pour atteindre le dessin. Ils sont maintenant derri\u00e8re le petit \u00ab\u202fi\u202f\u00bb du titre d\u2019\u00e9tape. <b>La l\u00e9gende des couleurs reste affich\u00e9e</b>\u202f: celle-l\u00e0, on ne la lit pas, on la consulte du regard \u00e0 chaque retour sur le graphe." },
    { emoji: 'bouclier', titre: "Conformit\u00e9 et Cave suivent la m\u00eame r\u00e8gle",
      desc: "Cuivre sur sept ans, passages et IFT, d\u00e9lai de rentr\u00e9e, part des anges, soutirage et malo, ouillages, rendements\u202f: chaque carte garde <b>une ligne</b> sous son titre, et son mode de calcul derri\u00e8re le \u00ab\u202fi\u202f\u00bb. <b>Ce qui vous prot\u00e8ge reste affich\u00e9\u202f</b>: \u00ab\u202fne pas p\u00e9n\u00e9trer la parcelle sans \u00e9quipement avant l\u2019heure indiqu\u00e9e\u202f\u00bb ne se replie pas." },
    { emoji: 'valide', titre: "Les huit onglets du Pilotage sont align\u00e9s",
      desc: "C\u2019est la fin de ce chantier. Partout dans le Pilotage\u202f: le <b>chiffre</b> d\u2019abord, une <b>ligne</b> qui dit sur quoi il porte, le <b>d\u00e9tail du calcul</b> derri\u00e8re le \u00ab\u202fi\u202f\u00bb, et un <b>bouton</b> quand il y a quelque chose \u00e0 faire. Rien n\u2019a \u00e9t\u00e9 supprim\u00e9 en chemin\u202f: <b>34 fiches</b> conservent l\u2019int\u00e9gralit\u00e9 des explications." },
  ] },
  { v:'6.21', items:[
    { emoji: 'lien', titre: "\u00c9conomie\u202f: les derniers pav\u00e9s d\u2019explication passent derri\u00e8re le \u00ab\u202fi\u202f\u00bb",
      desc: "Chaque carte d\u2019\u00c9conomie portait sous son titre un paragraphe qui expliquait <b>comment</b> son chiffre est fabriqu\u00e9\u202f: l\u2019hypoth\u00e8se de conversion du prix de revient, le d\u00e9tail des colonnes du tableau des parcelles, la diff\u00e9rence entre heures pay\u00e9es et heures au champ\u2026 Utile la premi\u00e8re fois, relu cent fois ensuite. Ces paragraphes sont maintenant derri\u00e8re le petit \u00ab\u202fi\u202f\u00bb de chaque carte. Sous le titre, il ne reste plus qu\u2019une ligne\u202f: <b>sur quoi porte le chiffre</b>. L\u2019onglet \u00c9conomie est d\u00e9sormais enti\u00e8rement pass\u00e9 \u00e0 cette r\u00e8gle." },
  ] },
  { v:'6.20', items:[
    { emoji: 'graphique', titre: "Le verdict d\u2019\u00c9conomie va droit au but",
      desc: "La carte qui r\u00e9pond \u00e0 \u00ab\u202fo\u00f9 j\u2019en suis\u202f\u00bb m\u00e9langeait trois choses dans un m\u00eame paragraphe\u202f: le constat, la mise en garde sur la fa\u00e7on dont le chiffre est calcul\u00e9, et un chemin \u00e0 retenir. D\u00e9sormais le constat tient en une ou deux phrases, la mise en garde est derri\u00e8re le petit \u00ab\u202fi\u202f\u00bb, et \u00ab\u202fR\u00e9glages \u203a T\u00e2ches\u202f\u00bb ou \u00ab\u202fPostes & travaux\u202f\u00bb sont des <b>boutons</b>. Quand la cadence affich\u00e9e vient de la campagne pr\u00e9c\u00e9dente, une ligne sous le texte le dit, avec le nom de la campagne et l\u2019avancement qu\u2019il reste \u00e0 atteindre." },
  ] },
  { v:'6.19', items:[
    { emoji: 'recu', titre: "L\u2019onglet Exercice s\u2019aligne\u202f: sept avertissements deviennent une carte",
      desc: "M\u00eame changement que la Synth\u00e8se la semaine derni\u00e8re, appliqu\u00e9 au bilan d\u2019un exercice. Vous voyez d\u2019abord <b>combien de postes sortent \u00e0 z\u00e9ro</b> et le bouton pour aller les renseigner\u202f; le reste se replie derri\u00e8re la puce \u00ab\u202fN remarques\u202f\u00bb. Le rappel \u00ab\u202fce total n\u2019est pas un compte de r\u00e9sultat\u202f\u00bb <b>reste affich\u00e9</b> \u2014 c\u2019est lui qui vous \u00e9vite de comparer ce chiffre ligne \u00e0 ligne au bilan de votre comptable. La liste de ce qui n\u2019y est pas (fermage, amortissements, assurances\u2026) est derri\u00e8re son petit \u00ab\u202fi\u202f\u00bb." },
  ] },
  { v:'6.18', items:[
    { emoji: 'carre', titre: "\u00c9conomie\u202f: le mur d\u2019avertissements devient une carte et des boutons",
      desc: "L\u2019onglet \u00c9conomie pouvait afficher <b>douze pav\u00e9s color\u00e9s</b> les uns sous les autres avant le premier chiffre \u2014 et tous de la m\u00eame taille, si bien que \u00ab\u202fla main-d\u2019\u0153uvre compte pour z\u00e9ro\u202f\u00bb pesait autant que \u00ab\u202fle chiffre montera m\u00e9caniquement\u202f\u00bb. \u00c0 la place\u202f: une <b>carte de fiabilit\u00e9</b> qui dit combien de postes de d\u00e9pense sortent \u00e0 z\u00e9ro, lesquels, et pose <b>un bouton par poste</b> pour aller renseigner ce qui manque. Le reste \u2014 les remarques sur la lecture des chiffres \u2014 se replie derri\u00e8re une puce\u202f: touchez-la pour tout lire. <b>Rien n\u2019est supprim\u00e9\u202f</b>: tout est toujours calcul\u00e9 et toujours lisible." },
  ] },
  { v:'6.17', items:[
    { emoji: 'equipe', titre: "\u00ab\u202fL\u2019\u00e9quipe & le mat\u00e9riel\u202f\u00bb\u202f: six cartes remises \u00e0 plat",
      desc: "Chaque carte de cet onglet affiche maintenant, <b>sans qu\u2019on la d\u00e9plie</b>, son chiffre et la ligne qui dit sur quoi il a \u00e9t\u00e9 calcul\u00e9. Le parc tracteur remonte la <b>r\u00e9vision la plus proche</b> \u2014 il fallait ouvrir la carte pour la voir. La cuve GNR affiche les <b>litres</b> plut\u00f4t que le pourcentage, parce que c\u2019est ce qu\u2019on lit pour d\u00e9cider d\u2019un plein. Le d\u00e9tail du calcul de chaque chiffre est derri\u00e8re son petit \u00ab\u202fi\u202f\u00bb." },
    { emoji: 'lien', titre: "Les phrases qui vous envoyaient ailleurs sont devenues des boutons",
      desc: "\u00ab\u202fCuve GNR \u00e0 renseigner (Tracteur \u203a Entretien)\u202f\u00bb, \u00ab\u202ffiches \u00e0 passer en Inactif\u202f\u00bb\u202f: il fallait lire, retenir le chemin, sortir de l\u2019\u00e9cran et retrouver le bon onglet. Ce sont d\u00e9sormais des <b>boutons</b> qui ouvrent l\u2019\u00e9cran directement, au bon endroit, avec un clignotement pour vous dire o\u00f9 regarder." },
  ] },
  { v:'6.16', items:[
    { emoji: 'dossier', titre: "Le Pilotage arrive rang\u00e9 : le chiffre d\u2019abord, le d\u00e9tail au besoin",
      desc: "Les blocs du Pilotage s\u2019ouvraient <b>tous en m\u00eame temps</b> d\u00e8s l\u2019arriv\u00e9e. Comme un bloc ouvert prend toute la largeur, sept indicateurs faisaient sept \u00e9crans \u00e0 faire d\u00e9filer, et l\u2019on cherchait un chiffre au milieu de ses explications. D\u00e9sormais chaque bloc est une <b>carte compacte</b>, et elles se rangent <b>c\u00f4te \u00e0 c\u00f4te</b>\u202f: sur un onglet, vous voyez tous les chiffres d\u2019un coup d\u2019\u0153il. <b>Rien n\u2019est cach\u00e9</b>\u202f: le chiffre et la ligne qui dit sur quoi il a \u00e9t\u00e9 calcul\u00e9 \u2014 sa date, sa source, son p\u00e9rim\u00e8tre \u2014 restent affich\u00e9s carte ferm\u00e9e. Touchez une carte pour voir son d\u00e9tail\u202f; elle s\u2019ouvre en grand, et la pr\u00e9c\u00e9dente se referme." },
    { emoji: 'balance', titre: "Vos blocs d\u00e9pli\u00e9s repartent une fois du r\u00e9glage d\u2019usine",
      desc: "Cette mise \u00e0 jour <b>remet une seule fois</b> les cartes du Pilotage \u00e0 l\u2019\u00e9tat repli\u00e9, y compris celles que vous aviez ouvertes ou ferm\u00e9es vous-m\u00eame\u202f: la disposition ne veut plus dire la m\u00eame chose qu\u2019avant. <b>Vos autres choix ne bougent pas</b> \u2014 les indicateurs coch\u00e9s dans \u00ab\u202fChoisir les indicateurs\u202f\u00bb, l\u2019onglet du graphe, la vue du camembert restent comme vous les aviez laiss\u00e9s." },
  ] },
  { v:'6.15', items:[
    { emoji: 'info', titre: "Les explications de calcul passent derri\u00e8re un petit \u00ab\u202fi\u202f\u00bb",
      desc: "Le Pilotage affichait en permanence <b>neuf pages</b> de texte expliquant comment chaque chiffre est calcul\u00e9. C\u2019est utile la premi\u00e8re fois, encombrant les cent suivantes\u202f: on relisait la m\u00e9thode pour atteindre le nombre. Ces explications se rangent d\u00e9sormais derri\u00e8re un <b>petit rond \u00ab\u202fi\u202f\u00bb</b>, \u00e0 c\u00f4t\u00e9 du chiffre concern\u00e9\u202f: touchez-le et la fiche s\u2019ouvre. <b>Rien n\u2019est perdu</b>, et ce qui <b>cadre</b> un chiffre \u2014 sa date, sa source, son p\u00e9rim\u00e8tre \u2014 reste \u00e0 l\u2019\u00e9cran, en une ligne. Trois endroits l\u2019inaugurent\u202f: la capacit\u00e9 au pic, l\u2019\u00e9cart de cadence, et les deux fa\u00e7ons de compter l\u2019ann\u00e9e. Les autres suivront." },
  ] },
  { v:'6.14', items:[
    { emoji: 'retour', titre: "L\u2019\u00e9cart de cadence se taisait alors que l\u2019an dernier \u00e9tait lisible",
      desc: "En d\u00e9but de p\u00e9riode, l\u2019indicateur \u00ab\u202f\u00e9cart de cadence\u202f\u00bb affichait un tiret\u202f: il attend <b>40\u202f% du bar\u00e8me r\u00e9alis\u00e9</b> avant de se prononcer, parce qu\u2019un travail de janvier ne pr\u00e9dit pas celui de juin. Mais quand la <b>m\u00eame p\u00e9riode de la campagne pr\u00e9c\u00e9dente</b> \u00e9tait archiv\u00e9e, elle \u00e9tait ignor\u00e9e alors qu\u2019elle disait quelque chose. L\u2019\u00e9cran la reprend d\u00e9sormais comme <b>hypoth\u00e8se de projection</b> \u2014 et le dit\u202f: la ligne porte un <b>\u21a9</b> et nomme la campagne d\u2019o\u00f9 vient le chiffre. Elle sera remplac\u00e9e par la vraie mesure d\u00e8s le seuil atteint. Si aucune campagne comparable n\u2019est archiv\u00e9e, l\u2019\u00e9cran continue de le dire plut\u00f4t que d\u2019inventer." },
    { emoji: 'chrono', titre: "Un salari\u00e9 r\u00e9embauch\u00e9 n\u2019avait qu\u2019un compteur d\u2019heures affich\u00e9",
      desc: "Quand quelqu\u2019un finit un contrat puis en resigne un autre dans la <b>m\u00eame ann\u00e9e civile</b>, il a <b>deux compteurs des 1607\u202fh</b>, chacun proratis\u00e9 \u00e0 la dur\u00e9e de son contrat. L\u2019\u00e9cran n\u2019en montrait qu\u2019un\u202f: celui du contrat en cours. Les contrats <b>sold\u00e9s dans l\u2019ann\u00e9e</b> ont maintenant leur propre carte, au-dessus, avec leurs dates, leurs heures faites et leur plafond. Le calcul, lui, \u00e9tait d\u00e9j\u00e0 juste \u2014 c\u2019est l\u2019affichage qui \u00e9tait incomplet." },
    { emoji: 'euro', titre: "Le taux horaire moyen comptait un mi-temps comme un temps plein",
      desc: "Quand une parcelle n\u2019a pas d\u2019\u00e9quipe nomm\u00e9e au journal, son co\u00fbt est valoris\u00e9 au <b>taux moyen du domaine</b>. Ce moyen \u00e9tait une simple moyenne par t\u00eate\u202f: quelqu\u2019un pr\u00e9sent quatre mois pesait autant qu\u2019un permanent. Il est d\u00e9sormais <b>pond\u00e9r\u00e9 par les heures annuelles</b> de chaque grille horaire. Sur un domaine qui m\u00e9lange permanents et saisonniers, attendez-vous \u00e0 un chiffre l\u00e9g\u00e8rement diff\u00e9rent \u2014 plus proche de ce que vous payez r\u00e9ellement." },
  ] },
  { v:'6.13', items:[
    { emoji: 'graphique', titre: "La courbe d\u2019effectif ne bougeait pas quand vous modifiiez un contrat",
      desc: "Vous saisissiez une date de contrat dans R\u00e9glages, vous reveniez sur <b>Pilotage</b>, et la courbe \u00ab\u202fpersonnes n\u00e9cessaires par semaine\u202f\u00bb affichait toujours l\u2019ancien effectif. Idem apr\u00e8s avoir coch\u00e9 \u00ab\u202fBureau\u202f\u00bb, chang\u00e9 l\u2019effectif d\u2019une \u00e9quipe collective, corrig\u00e9 une surface ou des heures par hectare. L\u2019\u00e9cran ne se remettait \u00e0 jour qu\u2019en <b>rechargeant l\u2019application</b>, et rien ne le signalait\u202f: la courbe \u00e9tait parfaitement lisible, simplement p\u00e9rim\u00e9e. Elle suit maintenant vos saisies imm\u00e9diatement." },
    { emoji: 'personne', titre: "Une personne mise en \u00ab\u202finactif\u202f\u00bb disparaissait de vos campagnes pass\u00e9es",
      desc: "Passer quelqu\u2019un en <b>inactif</b> sert \u00e0 ne plus avoir \u00e0 le s\u00e9lectionner tous les jours\u202f; \u00e7a ne devrait rien changer \u00e0 ce qu\u2019il a fait. Pourtant, si sa fiche ne portait <b>aucune date de contrat</b>, il sortait de <b>toutes</b> les p\u00e9riodes \u2014 y compris des <b>campagnes archiv\u00e9es</b>, dont l\u2019effectif et les co\u00fbts se rejouaient alors avec une personne de moins. Une fiche sans dates est un <b>CDI depuis le d\u00e9but</b>\u202f: elle compte partout, quel que soit son statut." },
  ] },
  { v:'6.12', items:[
    { emoji: 'raisin', titre: "Deux documents du Cuvier existaient sans que personne puisse les ouvrir",
      desc: "Le <b>contr\u00f4le de maturit\u00e9</b> et le <b>cahier de cuverie</b> \u00e9taient dans l\u2019application depuis quelques jours, mais aucun bouton n\u2019y menait. Ils sont d\u00e9sormais dans <b>R\u00e9glages \u203a App \u203a Documents</b>. Le premier reprend vos rel\u00e8vements d\u2019avant vendange en un tableau \u2014 une ligne par parcelle, une colonne par jour, <b>dans l\u2019ordre de maturit\u00e9</b>, avec la vitesse de progression. Le second donne <b>une page par cuve</b> : densit\u00e9 corrig\u00e9e \u00e0 20\u00a0\u00b0C, sucre restant estim\u00e9, remontages, pigeages, op\u00e9rations et cuv\u00e9e de sortie." },
    { emoji: 'carte', titre: "Le vignoble ne sortait qu\u2019en tableur",
      desc: "L\u2019<b>\u00e9tat du vignoble</b> tient sur une page\u00a0: une ligne par parcelle avec la surface, le c\u00e9page, la commune, l\u2019avancement, le dernier travail et le dernier rendement, puis la r\u00e9partition par c\u00e9page. Sa derni\u00e8re colonne dit <b>ce qui manque</b> \u2014 c\u00e9page absent, aucune position, aucun contour \u2014 et la fin du document les compte et les nomme. C\u2019est la feuille \u00e0 cocher d\u2019une installation." },
    { emoji: 'personne', titre: "Le relev\u00e9 d\u2019un salari\u00e9 se cachait dans le Planning",
      desc: "C\u2019est le document qu\u2019on vous demande en premier en cas de contr\u00f4le, et il fallait ouvrir le Planning, trouver la fiche de la personne, puis le bouton PDF. Il figure maintenant dans <b>R\u00e9glages \u203a App \u203a Documents</b>, avec le choix du salari\u00e9 et du mois. Il porte en plus <b>la liste dat\u00e9e des contrats</b> \u2014 chacun avec son type, et les <b>coupures</b> signal\u00e9es, puisque c\u2019est la coupure qui d\u00e9cide si le compteur repart de z\u00e9ro \u2014 et <b>les cong\u00e9s pay\u00e9s</b> de la p\u00e9riode." },
    { emoji: 'tracteur', titre: "Votre carnet d\u2019entretien portait le nom de l\u2019\u00e9diteur",
      desc: "Il s\u2019intitulait « Ma Vigne \u2014 Entretien tracteurs » et se signait « \u00a9 GUERETTECH », l\u00e0 o\u00f9 tous vos autres documents portent <b>le nom de votre domaine</b>. C\u2019est votre carnet, pas le n\u00f4tre. Il reprend l\u2019en-t\u00eate commun \u2014 domaine, titre, machines concern\u00e9es, date \u2014 et les m\u00eames polices que le reste. Les marges n\u2019ont pas boug\u00e9\u00a0: rien ne se d\u00e9cale dans les tableaux." },
  ] },
  { v:'6.11', items:[
    { emoji: 'carre', titre: "Le filtre \u00ab\u00a0\u00c0 faire\u00a0\u00bb des parcelles r\u00e9pond enfin",
      desc: "Quand vous filtriez les parcelles par t\u00e2che, la puce <b>\u00ab\u00a0\u{1F532}\u00a0\u00c0 faire\u00a0/\u00a0\u{1F441}\u00a0Toutes\u00a0\u00bb</b> qui appara\u00eet \u00e0 droite ne faisait <b>rien du tout</b>\u00a0: le clic \u00e9chouait en silence, sans message, et la liste restait telle quelle. Elle bascule d\u00e9sormais correctement entre les parcelles qui restent \u00e0 faire et toutes les parcelles." }
  ]},
  { v:'6.10', items:[
    { emoji: 'dossier', titre: "La fiche d\u2019un salari\u00e9 raconte enfin son histoire",
      desc: "Le contrat, les contrats pr\u00e9c\u00e9dents, le renouvellement et le taux horaire \u00e9taient quatre blocs s\u00e9par\u00e9s qui ne se parlaient pas\u00a0: on lisait des cases, jamais une suite. La fiche s\u2019ouvre maintenant sur <b>le contrat en cours</b> \u2014 type, dates, grille, taux, et s\u2019il est annualis\u00e9 ou pay\u00e9 \u00e0 l\u2019heure \u2014 puis sur <b>un historique dat\u00e9</b> o\u00f9 chaque changement a sa ligne. Le bouton <b>\u00ab\u00a0Ajouter un \u00e9v\u00e9nement\u00a0\u00bb</b> ne demande plus une valeur mais <b>ce qui s\u2019est pass\u00e9</b>\u00a0: une embauche, un renouvellement, une fin de contrat, une augmentation. Chacun annonce son effet <b>avant</b> que vous validiez." },
    { emoji: 'secateur', titre: "La coupure entre deux contrats se voit",
      desc: "C\u2019est elle qui d\u00e9cide si le compteur d\u2019heures repart de z\u00e9ro, et elle n\u2019\u00e9tait affich\u00e9e nulle part. L\u2019historique la dessine d\u00e9sormais en clair\u00a0: <i>coupure de 23 jours, le compteur du pr\u00e9c\u00e9dent est sold\u00e9</i>. Prolonger un contrat et en signer un nouveau ne se ressemblent plus \u2014 le premier garde un seul compteur, le second en ouvre un." },
    { emoji: 'cloche', titre: "Le rappel de fin de contrat ne peut plus se taire",
      desc: "L\u2019alerte \u00e0 trente jours lisait un champ facultatif, \u00ab\u00a0date de renouvellement\u00a0\u00bb. Le remplir <b>\u00e9teignait</b> l\u2019alerte de fin de contrat\u00a0: indiquer un renouvellement pr\u00e9vu en janvier faisait taire l\u2019application sur un CDD qui se terminait en ao\u00fbt. Le rappel lit maintenant la <b>fin du contrat</b>, toujours renseign\u00e9e, et propose directement de renouveler ou d\u2019acter l\u2019arr\u00eat. Les deux champs de renouvellement disparaissent." },
    { emoji: 'calendrier', titre: "La grille horaire suit le contrat",
      desc: "Changer quelqu\u2019un de grille recalculait ses heures pr\u00e9vues depuis janvier, donc ses heures suppl\u00e9mentaires, sans rien annoncer. La grille est d\u00e9sormais un attribut du contrat\u00a0: elle se choisit \u00e0 l\u2019embauche, s\u2019affiche dans le bandeau, et un changement ne s\u2019applique qu\u2019\u00e0 partir du contrat qui le porte." }
  ]},
  { v:'6.09', items:[
    { emoji: 'journal', titre: "Prolonger un contrat ne fait plus dispara\u00eetre l\u2019ancienne date",
      desc: "Quand vous repoussiez la date de fin d\u2019un contrat en cours, l\u2019ancienne \u00e9tait <b>\u00e9cras\u00e9e sans un mot</b>\u00a0: plus moyen de savoir jusqu\u2019o\u00f9 courait le contrat avant l\u2019avenant. C\u2019est d\u00e9sormais un <b>renouvellement</b>, qui garde la trace des deux dates. Le contrat reste <b>un seul contrat</b>, avec un seul compteur d\u2019heures\u00a0\u2014 prolonger n\u2019est pas r\u00e9embaucher. Corriger une faute de frappe dans une date, en revanche, r\u00e9\u00e9crit simplement la ligne\u00a0: les deux gestes sont distincts, comme pour les taux horaires. <b>L\u2019\u00e9cran ne change pas</b>, c\u2019est le m\u00eame formulaire." }
  ]},
  { v:'6.08', items:[
    { emoji: 'euro', titre: "Un salari\u00e9 r\u00e9embauch\u00e9 retrouve ses heures et son co\u00fbt",
      desc: "Depuis la version pr\u00e9c\u00e9dente, l\u2019application gardait bien les contrats pass\u00e9s d\u2019un salari\u00e9\u00a0\u2014 mais seulement pour dire qu\u2019il \u00e9tait <b>l\u00e0</b>. Ses heures et son salaire, eux, restaient \u00e0 z\u00e9ro sur toute la p\u00e9riode de l\u2019ancien contrat. Un CDD de mars \u00e0 juillet, archiv\u00e9 puis suivi d\u2019un nouveau contrat en ao\u00fbt, pesait <b>0\u00a0h et 0\u00a0\u20ac</b> dans l\u2019exercice au lieu de 735\u00a0h. Il n\u2019apparaissait m\u00eame pas comme une ligne vide\u00a0: il disparaissait de la liste, et le total \u00e9tait donc faux sans que rien ne le signale. La masse salariale, la capacit\u00e9 de l\u2019\u00e9quipe, la cadence et la pr\u00e9sence r\u00e9elle comptent d\u00e9sormais <b>tous</b> les contrats de la fiche. Attendez-vous \u00e0 voir ces chiffres monter\u00a0: ils \u00e9taient sous-\u00e9valu\u00e9s." },
    { emoji: 'chrono', titre: "Un saisonnier n\u2019a plus de compteur annuel qui n\u2019a pas lieu d\u2019\u00eatre",
      desc: "Les TESA, saisonniers et extras sont pay\u00e9s <b>\u00e0 l\u2019heure</b>\u00a0: l\u2019annualisation ne les concerne pas. L\u2019application leur affichait pourtant un plafond de 1607\u00a0h proratis\u00e9, des heures de modulation et un \u00ab\u00a0reste \u00e0 faire\u00a0\u00bb\u00a0\u2014 des nombres qu\u2019ils ne toucheront jamais, et qu\u2019on ne v\u00e9rifie pas parce qu\u2019ils ont l\u2019air d\u2019une mesure. Leur fiche montre maintenant ce qui les concerne vraiment\u00a0: heures faites et jours travaill\u00e9s. Les CDI, CDD, apprentis et g\u00e9rants ne changent pas." },
    { emoji: 'document', titre: "Le relev\u00e9 PDF d\u2019un mois pass\u00e9 ne sort plus blanc",
      desc: "Quand un contrat \u00e9tait archiv\u00e9, le relev\u00e9 des mois de ce contrat sortait <b>vide</b>\u00a0\u2014 pas une erreur, une page sans lignes. Le relev\u00e9 de mars d\u2019un salari\u00e9 r\u00e9embauch\u00e9 en ao\u00fbt \u00e9tait donc introuvable, alors qu\u2019il en a besoin pour la MSA. Chaque mois sort d\u00e9sormais le relev\u00e9 du contrat qui le couvre, et l\u2019en-t\u00eate indique lequel." }
  ]},
  { v:'6.07', items:[
    { emoji: 'epingle', titre: "La barre du haut dispara\u00eessait d\u00e8s qu\u2019on faisait d\u00e9filer",
      desc: "La ligne qui dit <b>ce que vous regardez</b> \u2014 l\u2019exercice, ou une campagne \u00e9pingl\u00e9e \u2014 passait sous la barre des onglets au premier d\u00e9filement. Vous pouviez donc lire un tableau filtr\u00e9 sur les vendanges en croyant regarder l\u2019ann\u00e9e enti\u00e8re. Les deux barres se rangent d\u00e9sormais l\u2019une sous l\u2019autre, et le fil reste visible du haut en bas de la page." },
    { emoji: 'dossier', titre: "Trois \u00e9crans r\u00e9pondaient sur une autre p\u00e9riode que celle affich\u00e9e",
      desc: "\u00c9conomie chiffre la <b>p\u00e9riode consult\u00e9e</b>, la Cave suit le <b>mill\u00e9sime</b>, la Conformit\u00e9 roule sur <b>sept ans</b>\u202f: aucun des trois ne se recadre sur la campagne \u00e9pingl\u00e9e en haut, et ils ne le disaient pas. Chacun l\u2019annonce maintenant en une ligne, au-dessus de ses chiffres. Rien n\u2019a chang\u00e9 dans les calculs \u2014 seulement dans ce qu\u2019ils avouent." },
    { emoji: 'etiquette', titre: "Le titre de « L\u2019ann\u00e9e » \u00e9tait vide, et deux onglets portaient deux noms",
      desc: "On cliquait « La campagne » et on atterrissait sous « Avancement »\u202f; « Simuler » s\u2019intitulait « D\u00e9cider ». Et le niveau <b>L\u2019ann\u00e9e</b> s\u2019ouvrait carr\u00e9ment <b>sans titre</b>. Les libell\u00e9s sont align\u00e9s. L\u2019onglet « L\u2019\u00e9quipe &amp; les t\u00e2ches » devient <b>« L\u2019\u00e9quipe &amp; le mat\u00e9riel »</b>\u202f: il ne montrait aucune t\u00e2che, elles vivent dans « La campagne »." },
    { emoji: 'check', titre: "Vos cases coch\u00e9es dans « L\u2019ann\u00e9e » ne tenaient pas la nuit",
      desc: "Les deux indicateurs du niveau <b>L\u2019ann\u00e9e</b> \u2014 les deux fa\u00e7ons de compter, et les 52 semaines \u2014 n\u2019\u00e9taient pas connus du r\u00e9glage\u202f: d\u00e9coch\u00e9s, ils se recochaient tout seuls \u00e0 la session suivante. Votre choix est d\u00e9sormais m\u00e9moris\u00e9 comme celui des autres onglets." },
    { emoji: 'lien', titre: "« Renseignez Réglages › Saisons » sans le moindre lien",
      desc: "Sept \u00e9crans vides vous renvoyaient \u00e0 un r\u00e9glage <b>en texte mort</b>, avec un nom de section qui n\u2019existe nulle part\u202f: la carte s\u2019appelle <b>Campagne</b>. Chacun porte maintenant un bouton qui ouvre le bon \u00e9cran, fait d\u00e9filer jusqu\u2019au bon bloc et le fait clignoter \u2014 comme le fait d\u00e9j\u00e0 la liste « \u00e0 compl\u00e9ter ». Le bouton « Voir les deux cadres », lui, ouvrait Réglages au lieu du panneau qu\u2019il annon\u00e7ait." },
    { emoji: 'bouclier', titre: "La conformit\u00e9 affichait 0 kg de cuivre quand le calcul \u00e9chouait",
      desc: "Un z\u00e9ro est une mesure\u202f: \u00e9crire « 0 kg Cu \u00b7 aucun apport enregistr\u00e9 » l\u00e0 o\u00f9 la synth\u00e8se n\u2019avait pas abouti revenait \u00e0 certifier une absence qu\u2019on n\u2019avait pas v\u00e9rifi\u00e9e. C\u2019est un tiret d\u00e9sormais, avec la pastille qui dit o\u00f9 aller voir." },
  ] },
  { v:'6.06', items:[
    { emoji: 'euro', titre: "Augmenter quelqu\u2019un rechiffrait tout son pass\u00e9",
      desc: "Le taux horaire d\u2019un salari\u00e9 \u00e9tait <b>un seul nombre, sans date</b>. Le jour o\u00f9 vous le changiez, l\u2019application recalculait avec le nouveau taux <b>toutes les heures d\u00e9j\u00e0 travaill\u00e9es</b>\u202f: le co\u00fbt de la taille de f\u00e9vrier, celui d\u2019une campagne archiv\u00e9e, et jusqu\u2019au total d\u2019un <b>exercice comptable d\u00e9j\u00e0 clos</b>. Une ligne \u00ab\u202fdernier changement\u202f\u00bb s\u2019affichait bien sous le champ, mais elle n\u2019entrait dans aucun calcul\u202f: elle donnait l\u2019impression que c\u2019\u00e9tait g\u00e9r\u00e9. \u00c0 partir de maintenant, chaque heure est valoris\u00e9e au taux qui valait <b>ce jour-l\u00e0</b>." },
    { emoji: 'calendrier', titre: "Une augmentation porte une date, et ne remonte pas le temps",
      desc: "Dans la fiche d\u2019un salari\u00e9 (R\u00e9glages \u203a \u00c9quipe), sous le taux, un champ <b>\u00ab \u00c0 partir du \u00bb</b> pr\u00e9-rempli \u00e0 aujourd\u2019hui. Vous changez la valeur, vous enregistrez\u202f: le taux pr\u00e9c\u00e9dent reste attach\u00e9 aux heures d\u00e9j\u00e0 faites. La fiche affiche d\u00e9sormais <b>la liste compl\u00e8te</b> de ce que ce taux a valu et depuis quand. Si vous avez simplement <b>tap\u00e9 un chiffre de travers</b>, videz la date\u202f: la derni\u00e8re ligne est corrig\u00e9e sur place, sans inventer d\u2019augmentation qui n\u2019a pas eu lieu." },
    { emoji: 'graphique', titre: "L\u2019exercice coupe le mois \u00e0 la bonne date",
      desc: "Une augmentation au 15 mars ne revalorise plus les quinze premiers jours du mois\u202f: les heures sont d\u00e9coup\u00e9es \u00e0 la date exacte du changement. Dans <b>Pilotage \u203a \u00c9conomie \u203a Exercice</b>, la colonne du taux montre alors les deux valeurs, \u00ab\u202f12,10 puis 13,50\u202f\u00bb, au lieu d\u2019un seul chiffre que personne n\u2019a jamais sign\u00e9." },
    { emoji: 'cadenas', titre: "Un champ de saisie ne peut plus effacer un historique",
      desc: "Vider le champ du taux ne supprime plus rien. Pour retirer une valeur, on retire sa ligne dans la liste \u2014 elle est visible, donc v\u00e9rifiable. Ces montants restent lisibles des <b>seuls administrateurs</b>, comme avant." },
  ] },
  { v:'6.05', items:[
    { emoji: 'equipe', titre: "L\u2019ordre de passage comptait UNE personne pour un chantier \u00e0 quarante",
      desc: "Simuler lisait l\u2019effectif <b>d\u2019aujourd\u2019hui</b>. Un contrat de groupe qui d\u00e9marre dans quinze jours n\u2019existait donc pas, et un cong\u00e9 du jour retirait quelqu\u2019un d\u2019un chantier qui commence en septembre. La tourn\u00e9e envoy\u00e9e aux ouvriers \u00e9tait d\u00e9coup\u00e9e pour une personne. L\u2019effectif se lit maintenant sur la <b>fen\u00eatre du travail</b>\u202f: le jour de la vendange, personne n\u2019est en cong\u00e9 et tous les contrats courent. L\u2019\u00e9cran affiche sur quelles dates il a compt\u00e9, et l\u2019\u00e9cart avec la pr\u00e9sence du jour." },
    { emoji: 'calendrier', titre: "Les dates du Pilotage \u00e9taient d\u00e9cal\u00e9es d\u2019un jour",
      desc: "Une campagne du 1\u1d49\u02b3 avril au 31 juillet s\u2019affichait \u00ab\u202fdu 31 mars au 30 juillet\u202f\u00bb, le pic tombait \u00ab\u202fsemaine du 31 mars\u202f\u00bb pour la semaine du 1\u1d49\u02b3 avril, et les fen\u00eatres de travaux reculaient pareil. Les calculs \u00e9taient bons\u202f: <b>toutes les dates \u00e9crites</b> \u00e9taient fausses. Corrig\u00e9 partout, en une seule fois." },
    { emoji: 'balance', titre: "Un pic \u00e0 46 personnes sur un domaine qui en emploie deux",
      desc: "Quand une fen\u00eatre de travail enregistr\u00e9e ne tombait pas dans la p\u00e9riode consult\u00e9e, <b>toutes ses heures s\u2019\u00e9crasaient sur un seul jour</b> \u2014 d\u2019o\u00f9 un pic \u00e9norme, port\u00e9 par une barre large d\u2019un pixel, qui \u00e9crasait l\u2019\u00e9chelle des 52 semaines. La fen\u00eatre par d\u00e9faut s\u2019applique d\u00e9sormais \u00e0 la place, et le tableau des fen\u00eatres (Outils \u203a Param\u00e9trage) marque la ligne <b>\u26a0 hors p\u00e9riode</b> au lieu de se taire." },
    { emoji: 'balance', titre: "\u00ab\u202fIl manque 44 ETP\u202f\u00bb\u202f: deux chiffres qui n\u2019allaient pas ensemble",
      desc: "Le besoin de la semaine la plus charg\u00e9e \u00e9tait compar\u00e9 \u00e0 la <b>pr\u00e9sence d\u2019aujourd\u2019hui</b>. Deux dates, deux fa\u00e7ons de compter. Le manque se lit maintenant sur la semaine du pic, contre ce qui est pr\u00e9vu au planning <b>cette semaine-l\u00e0</b>\u202f; la pr\u00e9sence du jour est affich\u00e9e \u00e0 part, sous son propre nom." },
    { emoji: 'graphique', titre: "Le graphe du renfort plafonnait le manque \u00e0 quatre",
      desc: "Une semaine \u00e0 qui il manquait quarante personnes se dessinait comme une semaine \u00e0 qui il en manquait quatre \u2014 d\u2019o\u00f9 ces plateaux parfaitement plats qui n\u2019existaient pas dans les donn\u00e9es. Le plafond est retir\u00e9, l\u2019axe monte avec le manque. Et les propositions qui co\u00fbtent plus cher que de tenir toute la campagne ne vous sont plus pr\u00e9sent\u00e9es." },
    { emoji: 'calendrier', titre: "\u00ab\u202fFin le 25 avril\u202f\u00bb s\u2019arr\u00eatait le 24",
      desc: "La derni\u00e8re journ\u00e9e de chaque fen\u00eatre de travail ne recevait aucune heure, y compris le dernier jour de la p\u00e9riode elle-m\u00eame. Elle travaille maintenant\u202f: les dates affich\u00e9es n\u2019ont pas boug\u00e9, c\u2019est le calcul qui a gagn\u00e9 le jour. Au passage, les heures se r\u00e9partissent d\u00e9sormais partout au prorata des jours <b>travaillables</b>\u202f: une semaine de ponts en re\u00e7oit moins, les semaines pleines r\u00e9cup\u00e8rent le reste." },
    { emoji: 'alerte', titre: "Deux p\u00e9riodes qui se recouvrent, deux barres au m\u00eame endroit",
      desc: "Rien n\u2019est compt\u00e9 deux fois \u2014 les heures suivent les t\u00e2ches, et une t\u00e2che n\u2019appartient qu\u2019\u00e0 une seule p\u00e9riode. Mais sur les jours partag\u00e9s, la frise dessinait deux barres l\u2019une sur l\u2019autre sans le dire. Ces jours sont maintenant <b>hachur\u00e9s en violet</b>, avec une trame diff\u00e9rente de celle des trous de calendrier." },
  ] },
  { v:'6.04', items:[
    { emoji: 'chrono', titre: "\u00ab\u202fO\u00f9 va le temps de l\u2019\u00e9quipe\u202f\u00bb est pass\u00e9 dans \u00ab\u202fLa campagne\u202f\u00bb",
      desc: "La r\u00e9partition du temps, la frise pr\u00e9vu/r\u00e9el, la courbe par semaine et l\u2019\u00e9cart parlent tous d\u2019<b>une campagne</b>. Ils \u00e9taient rang\u00e9s dans \u00ab\u202fL\u2019ann\u00e9e\u202f\u00bb, sous un bandeau qui expliquait qu\u2019ils d\u00e9taillaient en fait une campagne. Un bandeau qui explique pourquoi un bloc est au mauvais endroit ne le d\u00e9place pas\u202f: ils sont maintenant dans \u00ab\u202fLa campagne\u202f\u00bb, et le bandeau a disparu avec eux. \u00ab\u202fL\u2019ann\u00e9e\u202f\u00bb garde ce qui la regarde\u202f: les 52 semaines de l\u2019exercice et le pic." },
    { emoji: 'equipe', titre: "Le simulateur de renfort voit enfin vos embauches d\u00e9j\u00e0 sign\u00e9es",
      desc: "Il ne comptait que les <b>permanents</b>\u202f: 34 vendangeurs d\u00e9j\u00e0 sous contrat du 17 ao\u00fbt au 3 septembre n\u2019existaient pas pour lui, et il vous r\u00e9clamait \u00ab\u202f34 personnes de renfort \u00e0 poser\u202f\u00bb pour une \u00e9quipe d\u00e9j\u00e0 recrut\u00e9e \u2014 pendant que la frise de l\u2019ann\u00e9e, elle, montrait la vendange couverte. Le m\u00eame module disait deux choses. Il part maintenant de l\u2019effectif <b>d\u00e9j\u00e0 sous contrat</b>, et le renfort que vous posez s\u2019<b>ajoute</b> \u00e0 cette ligne. Le s\u00e9lecteur \u00ab\u202fOn part de\u202f\u00bb permet de revenir aux permanents seuls\u202f: c\u2019est l\u2019autre question, celle qui sert \u00e0 pr\u00e9parer la campagne suivante." },
    { emoji: 'balance', titre: "Deux p\u00e9riodes qui se chevauchent ne sont plus une alerte",
      desc: "L\u2019\u00e9cran annon\u00e7ait en orange que les jours communs \u00e0 deux p\u00e9riodes \u00e9taient \u00ab\u202fcompt\u00e9s deux fois\u202f\u00bb et que vos heures \u00e9taient gonfl\u00e9es d\u2019autant. C\u2019\u00e9tait <b>faux</b>\u202f: les heures suivent les <b>t\u00e2ches</b>, et chaque t\u00e2che n\u2019appartient qu\u2019\u00e0 une seule p\u00e9riode. Sur les jours communs, ce sont les bandes du calendrier qui se superposent, jamais la charge. Le fait reste \u00e9crit, en gris, sous la frise \u2014 et il n\u2019y a rien \u00e0 corriger." },
    { emoji: 'balance', titre: "\u00ab\u202fT\u00e2che sans bar\u00e8me h/ha\u202f\u00bb ne se d\u00e9clenche plus \u00e0 tort",
      desc: "Le contr\u00f4le cherchait les heures par hectare dans un champ qui n\u2019existe sur aucune t\u00e2che. Il ne trouvait donc jamais rien, et signalait <b>toutes</b> les t\u00e2ches de la p\u00e9riode consult\u00e9e comme d\u00e9pourvues de bar\u00e8me \u2014 y compris celles que vous aviez remplies. Sur une p\u00e9riode \u00e0 une seule t\u00e2che, \u00e7a donnait \u00ab\u202f1 t\u00e2che sans bar\u00e8me\u202f\u00bb\u202f: plausible, et faux. Il lit maintenant le bon champ, et comprend aussi les t\u00e2ches \u00e0 niveaux, \u00e0 passages, et celles pilot\u00e9es \u00e0 la tari\u00e8re, qui n\u2019ont pas d\u2019heures par hectare \u00e0 avoir." },
    { emoji: 'graphique', titre: "Le simulateur ne dessine plus deux fois le m\u00eame graphique",
      desc: "\u00ab\u202fCe qu\u2019il reste \u00e0 faire\u202f\u00bb et \u00ab\u202fle plan de d\u00e9part\u202f\u00bb apparaissaient tous les deux d\u00e8s que la campagne avait commenc\u00e9 \u2014 m\u00eames colonnes, m\u00eame ligne d\u2019effectif, seule la l\u00e9gende changeait. Deux images identiques sous deux titres diff\u00e9rents ne se comparent pas. L\u2019\u00e9cran v\u00e9rifie maintenant qu\u2019elles racontent vraiment deux choses\u202f; sinon il n\u2019en montre qu\u2019une, et dit pourquoi." }
  ]},
  { v:'6.03', items:[
    { emoji: 'loupe', titre: "Cliquer une campagne recadre enfin TOUT l\u2019\u00e9cran",
      desc: "Choisir une campagne dans la frise bougeait la frise, les quatre chiffres du haut\u2026 et laissait trois blocs sur une autre p\u00e9riode\u202f: le chiffre <b>Effectif</b> d\u2019Aujourd\u2019hui, la tuile <b>Charge & ETP</b> et <b>Capacit\u00e9 vs charge</b>. Ils lisaient la p\u00e9riode que vous consultez, pas celle que vous regardez. Sur l\u2019ann\u00e9e enti\u00e8re, la photo r\u00e9pondait donc pour l\u2019ann\u00e9e et la tuile juste en dessous pour une seule campagne\u202f: deux nombres, un seul mot, \u00e0 quinze centim\u00e8tres l\u2019un de l\u2019autre. Tout suit maintenant la m\u00eame barre du haut \u2014 la r\u00e9partition du temps, la frise pr\u00e9vu/r\u00e9el, la courbe par semaine et l\u2019\u00e9cart compris." },
    { emoji: 'etiquette', titre: "Chaque chiffre dit d\u00e9sormais sur quoi il porte",
      desc: "\u00ab\u202f36,6 au pic\u202f\u00bb ne veut rien dire sans savoir si c\u2019est le pic de l\u2019ann\u00e9e ou celui d\u2019une campagne. Le cadre est maintenant \u00e9crit sous le chiffre, partout\u202f: \u00ab\u202fsur l\u2019exercice\u202f\u00bb, \u00ab\u202fsur Vendanges\u202f\u00bb, avec la semaine du pic. Un pic sans cadre n\u2019est pas une mesure, c\u2019est une opinion." },
    { emoji: 'balance', titre: "Les blocs qui ne peuvent pas suivre le zoom le disent",
      desc: "Une frise de t\u00e2ches, une courbe par semaine ou un \u00e9cart pr\u00e9vu/r\u00e9el n\u2019existent qu\u2019\u00e0 la maille d\u2019une campagne\u202f: sur l\u2019ann\u00e9e enti\u00e8re, ils ne peuvent montrer qu\u2019une campagne. Ils l\u2019\u00e9crivent maintenant en clair au lieu de laisser croire qu\u2019ils r\u00e9pondent pour l\u2019ann\u00e9e. Et le <b>Param\u00e9trage</b>, qui \u00e9crit dans vos donn\u00e9es, pr\u00e9vient si vous regardez une campagne alors qu\u2019il porte sur une autre \u2014 une \u00e9criture au mauvais endroit ne se voit qu\u2019\u00e0 la campagne suivante." },
    { emoji: 'valide', titre: "Une t\u00e2che n\u2019est plus d\u00e9clar\u00e9e termin\u00e9e d\u2019apr\u00e8s une autre campagne",
      desc: "La frise pr\u00e9vu/r\u00e9el jugeait \u00ab\u202ftermin\u00e9\u202f\u00bb ou \u00ab\u202fen cours\u202f\u00bb avec l\u2019avancement de la p\u00e9riode consult\u00e9e, quelle que soit la campagne affich\u00e9e. En zoomant sur une campagne pass\u00e9e, vous pouviez voir \u00ab\u202fen cours\u202f\u00bb sur des travaux finis depuis des mois. Elle s\u2019appuie maintenant sur ce que le journal sait vraiment." }
  ]},
  { v:'6.02', items:[
    { emoji: 'doigt', titre: "\u00ab\u202fvoir le d\u00e9tail\u202f\u00bb et \u00ab\u202f\u00e0 compl\u00e9ter\u202f\u00bb r\u00e9pondent enfin",
      desc: "Les quatre chiffres en haut du Pilotage, le bouton \u00ab\u202fN choses \u00e0 compl\u00e9ter\u202f\u00bb et la croix qui revient \u00e0 l\u2019ann\u00e9e enti\u00e8re ne r\u00e9agissaient pas au clic. Pas d\u2019erreur, pas de message\u202f: rien. Ces boutons avaient \u00e9t\u00e9 sortis de la zone qui \u00e9coute les clics lors de la refonte pr\u00e9c\u00e9dente, et personne ne le voyait tant qu\u2019on ne cliquait pas. C\u2019est r\u00e9par\u00e9\u202f: chaque chiffre ouvre l\u2019\u00e9cran qui le d\u00e9taille, chaque pastille rouge ou orange ouvre la liste de ce qui le fausse." },
    { emoji: 'balance', titre: "Vos heures de bar\u00e8me ne s\u2019affichent plus \u00e0 z\u00e9ro",
      desc: "La photo \u00ab\u202fTravaux\u202f\u00bb annon\u00e7ait \u00ab\u202f0 h, aucune t\u00e2che dat\u00e9e\u202f\u00bb et le tableau \u00ab\u202fDeux fa\u00e7ons de compter votre ann\u00e9e\u202f\u00bb sortait toutes ses campagnes \u00e0 0 h \u2014 sur des domaines qui affichaient des milliers d\u2019heures restantes deux centim\u00e8tres plus haut. L\u2019application cherchait le total au mauvais endroit et trouvait \u00ab\u202frien\u202f\u00bb, ce qu\u2019elle affichait comme un z\u00e9ro. Les heures sont l\u00e0. Et le pourcentage \u00ab\u202f% fait\u202f\u00bb ne s\u2019affiche plus que sur la p\u00e9riode que vous consultez, la seule o\u00f9 il a un sens." },
    { emoji: 'euro', titre: "Un exercice comptable qui affiche vraiment l\u2019exercice",
      desc: "La case \u00ab\u202fExercice comptable\u202f\u00bb affichait le co\u00fbt de la <b>campagne en cours</b> sous les dates de l\u2019ann\u00e9e enti\u00e8re\u202f: 45\u202fk\u20ac pour douze mois, alors que c\u2019\u00e9tait le co\u00fbt de dix jours de vendange. Le chiffre \u00e9tait juste, son \u00e9tiquette \u00e9tait fausse \u2014 et c\u2019est pire, parce qu\u2019on ne v\u00e9rifie pas une \u00e9tiquette. La case lit maintenant le m\u00eame moteur que \u00c9conomie \u203a Exercice\u202f: salaires charg\u00e9s, carburant GNR et achats d\u2019intrants, entre vos deux bilans." },
    { emoji: 'equipe', titre: "L\u2019effectif au pic ne va plus chercher hors de votre exercice",
      desc: "Le chiffre \u00ab\u202fEffectif\u202f\u00bb annon\u00e7ait un pic de 60,8 personnes \u00ab\u202fsur l\u2019exercice\u202f\u00bb pendant que l\u2019\u00e9cran Charge & ETP, juste en dessous, en affichait 36,6. Les deux \u00e9taient justes\u202f: le premier allait chercher son pic dans une campagne que l\u2019application affiche elle-m\u00eame comme \u00ab\u202fhors exercice\u202f\u00bb. Deux r\u00e9ponses \u00e0 la m\u00eame question sur le m\u00eame \u00e9cran, et aucune ne disait sur quoi elle portait. Le pic reste d\u00e9sormais dans le cadre annonc\u00e9." },
    { emoji: 'calendrier', titre: "La date de fin compte enfin vos saisonniers",
      desc: "\u00ab\u202f85\u202fj de retard, fin le 27\u202fjanvier\u202f\u00bb sur une vendange de dix jours\u202f: la projection divisait le travail restant par la cadence des <b>quatre derni\u00e8res semaines</b>, mesur\u00e9e en ao\u00fbt avec une personne, et l\u2019appliquait telle quelle jusqu\u2019en janvier. Les trente-six vendangeurs d\u00e9j\u00e0 sous contrat n\u2019entraient nulle part. Elle consomme maintenant la charge sur l\u2019\u00e9quipe <b>r\u00e9ellement planifi\u00e9e</b>, semaine par semaine, dates de d\u00e9but de contrat comprises \u2014 et quand cette \u00e9quipe ne suffit pas, elle vous dit combien d\u2019heures manquent au lieu d\u2019inventer une date. La phrase sous le chiffre dit toujours sur quoi la date est b\u00e2tie." },
    { emoji: 'graphique', titre: "La frise de l\u2019ann\u00e9e prend toute la largeur, et son axe redevient lisible",
      desc: "La frise des douze mois s\u2019arr\u00eatait \u00e0 760\u202fpixels quelle que soit la taille de votre \u00e9cran\u202f: sur un ordinateur, cinquante-deux semaines \u00e9cras\u00e9es dans 60\u202f% de la page. Elle occupe maintenant toute la carte, et grandit en hauteur avec elle. Et la courbe \u00ab\u202fpersonnes n\u00e9cessaires par semaine\u202f\u00bb tra\u00e7ait une graduation par personne\u202f: sur une vendange \u00e0 37\u202fpersonnes, trente-huit \u00e9tiquettes empil\u00e9es sur 24\u202fcentim\u00e8tres carr\u00e9s, soit un p\u00e2t\u00e9 noir \u00e0 la place de l\u2019axe. Elle gradue d\u00e9sormais de 5 en 5 ou de 10 en 10, comme la frise." }
  ]},
  { v:'6.01', items:[
    { emoji: 'livre', titre: "Votre exercice comptable et votre ann\u00e9e vigne, c\u00f4te \u00e0 c\u00f4te",
      desc: "L\u2019\u00e9cran vous disait que votre exercice \u00e9tait \u00ab\u202fmal align\u00e9\u202f\u00bb et vous proposait de le d\u00e9placer. C\u2019\u00e9tait un mauvais conseil\u202f: un exercice comptable est fix\u00e9 par votre comptable, parfois par votre statut, et on ne le d\u00e9cale pas pour qu\u2019un graphique tombe mieux. Le vrai manque \u00e9tait ailleurs\u202f: l\u2019application n\u2019avait <b>qu\u2019un seul cadre</b> pour deux questions diff\u00e9rentes. Le niveau \u00ab\u202fL\u2019ann\u00e9e\u202f\u00bb s\u2019ouvre maintenant sur les deux, nomm\u00e9s\u202f: l\u2019<b>exercice comptable</b>, d\u2019un bilan \u00e0 l\u2019autre, qui r\u00e9pond \u00e0 \u00ab\u202fce que m\u2019a co\u00fbt\u00e9 l\u2019ann\u00e9e fiscale\u202f\u00bb\u202f; et l\u2019<b>ann\u00e9e vigne</b>, d\u2019apr\u00e8s une vendange jusqu\u2019\u00e0 la fin de la suivante, qui r\u00e9pond \u00e0 \u00ab\u202fce que m\u2019a co\u00fbt\u00e9 un cycle\u202f\u00bb. Les deux totaux ne sont pas les m\u00eames, et l\u2019\u00e9cran explique enfin pourquoi\u202f: une campagne \u00e0 cheval sur la cl\u00f4ture est partag\u00e9e entre deux bilans, une campagne enti\u00e8rement hors de l\u2019exercice n\u2019y appara\u00eet pas du tout." },
    { emoji: 'calendrier', titre: "Une vendange \u00e0 cheval sur deux bilans, dite en jours",
      desc: "Quand la cl\u00f4ture de votre exercice traverse la vendange, la r\u00e9colte se lit sur deux bilans. L\u2019application vous dit d\u00e9sormais combien de jours tombent de chaque c\u00f4t\u00e9 \u2014 en jours, compt\u00e9s exactement, plut\u00f4t qu\u2019en euros approxim\u00e9s. Et elle ne pr\u00e9sente plus \u00e7a comme une erreur \u00e0 corriger\u202f: c\u2019est votre calendrier comptable, il n\u2019y a rien \u00e0 changer, il faut seulement le savoir en lisant le bilan. Si votre comptable accepte de d\u00e9placer la cl\u00f4ture, le bouton reste l\u00e0 \u2014 mais c\u2019est propos\u00e9, plus prescrit. Au passage, l\u2019alerte orange qui s\u2019affichait quand la vendange \u00ab\u202fouvrait\u202f\u00bb l\u2019ann\u00e9e a disparu\u202f: il n\u2019y avait rien \u00e0 corriger." }
  ]},
  { v:'6.00', items:[
    { emoji: 'boussole', titre: "Le Pilotage s\u2019ouvre sur l\u2019ann\u00e9e, puis vous zoomez",
      desc: "Les onglets \u00e9taient sept sujets pos\u00e9s c\u00f4te \u00e0 c\u00f4te\u202f: on ne voyait jamais son ann\u00e9e, on tombait dans un sujet. Ils vont maintenant du large au fin \u2014 <b>l\u2019ann\u00e9e</b>, puis <b>la campagne</b>, puis <b>l\u2019\u00e9quipe et les t\u00e2ches</b>, puis <b>la simulation</b> \u2014 avec leur num\u00e9ro devant. Un trait marque o\u00f9 le zoom s\u2019arr\u00eate\u202f: apr\u00e8s lui, la Cave, l\u2019\u00c9conomie et la Conformit\u00e9 sont des \u00e9crans de d\u00e9tail. La frise des douze mois, qui \u00e9tait rang\u00e9e dans une tuile pliable au milieu d\u2019un \u00e9cran parlant d\u2019une campagne, ouvre d\u00e9sormais le niveau \u00ab\u202fL\u2019ann\u00e9e\u202f\u00bb. Si vous aviez d\u00e9coch\u00e9 \u00ab\u202fCharge &amp; ETP\u202f\u00bb, votre choix vous suit\u202f: rien \u00e0 recocher." },
    { emoji: 'lien', titre: "Cliquer une campagne fait bouger tout l\u2019\u00e9cran",
      desc: "Avant, choisir une campagne dans la frise ne changeait <b>qu\u2019un seul panneau</b>. Les chiffres au-dessus restaient sur une autre fen\u00eatre sans le dire, et le m\u00eame \u00e9cran pouvait donner deux r\u00e9ponses justes \u00e0 la m\u00eame question. Une barre en haut affiche maintenant o\u00f9 vous regardez \u2014 l\u2019exercice entier, ou telle campagne \u2014 et tout ce qui est affich\u00e9 s\u2019y cale. La croix revient \u00e0 l\u2019ann\u00e9e. Si vous supprimez une p\u00e9riode, l\u2019\u00e9cran ne reste pas bloqu\u00e9 dessus." },
    { emoji: 'graphique', titre: "Quatre chiffres en t\u00eate, quelle que soit la page",
      desc: "Les travaux, l\u2019effectif, le budget et la conformit\u00e9 sont d\u00e9sormais visibles en haut de tous les \u00e9crans du Pilotage, \u00e0 la maille de ce que vous regardez. Toucher l\u2019un d\u2019eux ouvre l\u2019\u00e9cran qui le d\u00e9taille. L\u2019effectif affiche le <b>pic</b>, pas la moyenne\u202f: une moyenne annuelle n\u2019existe aucun jour de l\u2019ann\u00e9e, et c\u2019est le pic qui d\u00e9cide d\u2019un recrutement. Quand un calcul n\u2019aboutit pas, le chiffre affiche un tiret au lieu d\u2019un z\u00e9ro." },
    { emoji: 'loupe', titre: "L\u2019application dit ce qui manque, et vous y emm\u00e8ne",
      desc: "Un bouton \u00ab\u202f\u00e0 compl\u00e9ter\u202f\u00bb en haut de l\u2019\u00e9cran liste ce qui emp\u00eache vos chiffres d\u2019\u00eatre justes\u202f: p\u00e9riodes sans dates, trous dans le calendrier, p\u00e9riodes qui se chevauchent, salari\u00e9s sans taux horaire, t\u00e2ches sans heures par hectare, parcelles sans surface, cuivre proche du plafond. Chaque ligne dit <b>ce que \u00e7a fausse</b>, pas seulement ce qui manque \u2014 et le bouton ouvre la bonne page, sur le bon onglet, au bon endroit, qui clignote une seconde. Un rond rouge sur un chiffre veut dire qu\u2019il ne se calcule pas\u202f; un rond orange, qu\u2019il sort mais faux." },
    { emoji: 'graphique', titre: "Un trou dans le calendrier ne se dessine plus \u00e0 z\u00e9ro",
      desc: "Quand deux p\u00e9riodes \u00e9taient s\u00e9par\u00e9es de quelques semaines, la courbe d\u2019effectif tra\u00e7ait un trait droit au travers \u2014 elle affirmait un effectif sur une fen\u00eatre o\u00f9 personne n\u2019avait rien compt\u00e9. Elle s\u2019interrompt maintenant, et reprend apr\u00e8s. Un trou n\u2019est pas un z\u00e9ro\u202f: un z\u00e9ro est une mesure. Le trait du jour a aussi chang\u00e9 de couleur, il partageait le rouge des barres de renfort alors qu\u2019il ne signale rien d\u2019inqui\u00e9tant." }
  ]},
  { v:'5.99', items:[
    { emoji: 'dossier', titre: "Un salari\u00e9 r\u00e9embauch\u00e9 ne perd plus son pass\u00e9", desc: "Quand quelqu\u2019un finit un contrat puis en resigne un autre plus tard, il fallait \u00e9craser ses dates par les nouvelles \u2014 et l\u2019application oubliait alors compl\u00e8tement qu\u2019il avait travaill\u00e9 avant. Il dispara\u00eessait des campagnes pass\u00e9es\u202f: plus dans l\u2019effectif, plus dans les heures, plus dans le co\u00fbt. Un domaine a vu dix personnes au pic s\u2019afficher comme quatre. D\u00e9sormais l\u2019ancien contrat est archiv\u00e9 tout seul d\u00e8s que vous saisissez une date de d\u00e9but post\u00e9rieure \u00e0 la fin du pr\u00e9c\u00e9dent, et la fiche affiche la liste des contrats pr\u00e9c\u00e9dents, que vous pouvez corriger ou supprimer. Deux contrats qui se suivent sans un jour de coupure sont trait\u00e9s comme un seul\u202f; d\u00e8s qu\u2019il y a une coupure, ce sont deux contrats, chacun avec son propre compteur d\u2019heures annuelles. Rien ne change pour la paie ni pour les cong\u00e9s, qui continuent de porter sur le contrat en cours." },
    { emoji: 'calendrier', titre: "Le Pilotage compte les personnes \u00e0 la semaine", desc: "L\u2019\u00e9cran Charge & ETP raisonnait au mois. Une vendange de quatre jours en septembre \u00e9tait divis\u00e9e par un mois entier de travail et ressortait \u00e0 six personnes, quand la m\u00eame vendange \u00e0 cheval sur la fin ao\u00fbt en affichait vingt-sept. Et l\u2019effectif en face \u00e9tait une moyenne du mois\u202f: une semaine \u00e0 quarante personnes noy\u00e9e dans trois semaines \u00e0 deux donnait douze, un chiffre qui n\u2019existait aucun jour de l\u2019ann\u00e9e. L\u2019\u00e9cran annon\u00e7ait donc un manque de seize personnes pendant que la courbe, juste, montrait la vendange couverte. Tout se lit maintenant \u00e0 la semaine, la seule maille o\u00f9 le rapport a un sens." },
    { emoji: 'calendrier', titre: "Une frise de toute l\u2019ann\u00e9e, et le clic qui zoome", desc: "Le Pilotage s\u2019ouvre d\u00e9sormais sur une frise de la campagne enti\u00e8re\u202f: vos p\u00e9riodes en couleur, et sous chacune le nombre de personnes n\u00e9cessaires semaine par semaine. Le vert est ce que votre \u00e9quipe absorbe, le rouge ce qu\u2019il reste \u00e0 recruter \u2014 vous lisez le renfort en hauteur de rouge, sans calcul. Cliquez une p\u00e9riode\u202f: l\u2019axe se recale dessus, l\u2019\u00e9chelle verticale suit, et les t\u00e2ches qui la composent apparaissent en bandes. C\u2019est ce qui permet de voir la taille alors que la vendange \u00e9crase tout. Les zones hachur\u00e9es ne sont couvertes par aucune p\u00e9riode." },
    { emoji: 'equipe', titre: "Une \u00e9quipe de vendangeurs compte pour son effectif", desc: "Une fiche d\u2019\u00e9quipe collective r\u00e9gl\u00e9e \u00e0 quarante personnes ne comptait que pour une seule dans le calcul de la pr\u00e9sence de l\u2019\u00e9quipe. Le bandeau \u00ab\u202fO\u00f9 va le temps\u202f\u00bb affichait alors une part de 392\u202f%\u202f\u2014 une r\u00e9partition qui d\u00e9passe cent \u2014 et annon\u00e7ait z\u00e9ro heure de cave et de trajets, ce qui \u00e9tait faux. C\u2019est corrig\u00e9\u202f; et si votre charge d\u00e9passe vraiment votre pr\u00e9sence, la surcharge est d\u00e9sormais \u00e9crite en clair au lieu d\u2019\u00eatre absorb\u00e9e." }
  ]},
  { v:'5.98', items:[
    { emoji: 'cible', titre: "Chaque personne voit les modules de son m\u00e9tier", desc: "Quand on cr\u00e9e plusieurs comptes d\u2019un coup, chacun arrivait avec les sept modules dans sa barre du bas \u2014 y compris la Cave et la R\u00e9serve pour quelqu\u2019un qui ne quitte pas les vignes. Il fallait rouvrir chaque fiche pour d\u00e9cocher. Maintenant le r\u00f4le suffit\u202f: un ouvrier arrive avec la Vigne et le Planning, un tractoriste garde en plus le Tracteur et le Phyto. Le Planning reste visible pour tout le monde, c\u2019est l\u00e0 que chacun lit ses heures et ses cong\u00e9s. Rien n\u2019est fig\u00e9\u202f: la fiche de chaque personne, dans R\u00e9glages, permet de recocher ce qu\u2019on veut, et un nouveau bouton \u00ab Selon le r\u00f4le \u00bb repose la combinaison standard d\u2019un geste. Les personnes d\u00e9j\u00e0 en place ne changent pas." }
  ]},
  { v:'5.97', items:[
    { emoji: 'nuage', titre: "La m\u00e9t\u00e9o enregistr\u00e9e \u00e0 la validation d\u2019une t\u00e2che", desc: "Quand vous validez une t\u00e2che sur une parcelle, l\u2019application enregistre au journal la m\u00e9t\u00e9o moyenne du chantier. Elle la calculait depuis la toute premi\u00e8re fois o\u00f9 cette t\u00e2che avait \u00e9t\u00e9 mise « en cours » sur cette parcelle \u2014 m\u00eame si c\u2019\u00e9tait la campagne d\u2019avant, sur une ligne rest\u00e9e ouverte par oubli. Une taille valid\u00e9e en mars pouvait ainsi porter la moyenne de quatorze mois. Le calcul s\u2019arr\u00eate maintenant au d\u00e9but de la p\u00e9riode en cours. Les m\u00e9t\u00e9os d\u00e9j\u00e0 enregistr\u00e9es ne changent pas." },
    { emoji: 'doigt', titre: "L\u2019accueil du Pilotage sur \u00e9cran \u00e9troit", desc: "Sur les \u00e9crans d\u2019une largeur tr\u00e8s pr\u00e9cise \u2014 certaines tablettes en portrait, une fen\u00eatre de navigateur r\u00e9duite \u00e0 la main \u2014 le bandeau du haut du Pilotage gardait deux colonnes dans un espace pr\u00e9vu pour une seule. Le texte se tassait. C\u2019est corrig\u00e9." }
  ]},
  { v:'5.96', items:[
    { emoji: 'dossier', titre:'Le planning en trois onglets',
      desc:"Le module m\u00e9langeait trois choses qui ne se font ni au m\u00eame rythme ni par la m\u00eame personne. Elles ont chacune leur onglet\u00a0: <b>Le mois</b>, la grille de l\u2019\u00e9quipe\u00a0; <b>Les gens</b>, une ligne par salari\u00e9 avec sa fiche, le r\u00e9cap annuel et les anciens salari\u00e9s\u00a0; <b>Le cadre</b>, les mod\u00e8les de semaine, la coupure, la convention, les cong\u00e9s et les heures sup. Si vous n\u2019\u00eates pas administrateur, vous n\u2019avez plus d\u2019onglets du tout\u00a0: vous arrivez directement sur votre mois." },
    { emoji: 'loupe', titre:'Les salari\u00e9s n\u2019apparaissent plus deux fois',
      desc:"Sous la grille, une deuxi\u00e8me liste r\u00e9p\u00e9tait les m\u00eames noms et les m\u00eames heures, et les deux ouvraient la m\u00eame fiche. Il n\u2019en reste qu\u2019une, dans \u00ab\u00a0Les gens\u00a0\u00bb." },
    { emoji: 'engrenage', titre:'Le menu \u00ab\u00a0Outils\u00a0\u00bb a disparu',
      desc:"Ses quatre entr\u00e9es sont sorties de leur tiroir\u00a0: poser des cong\u00e9s et des horaires chaleur sur une p\u00e9riode sont deux boutons visibles au-dessus de la grille, les mod\u00e8les et le cadre l\u00e9gal ont leur onglet, les anciens salari\u00e9s sont avec les gens." },
    { emoji: 'alerte', titre:'Un r\u00e9glage du domaine \u00e9tait cach\u00e9 dans la fiche d\u2019une personne',
      desc:"La r\u00e8gle de d\u00e9compte des cong\u00e9s (6\u00a0jours ouvrables ou 5\u00a0jours ouvr\u00e9s) et la p\u00e9riode de r\u00e9f\u00e9rence se r\u00e9glaient depuis l\u2019onglet Cong\u00e9s de n\u2019importe quel salari\u00e9 \u2014 alors qu\u2019elles s\u2019appliquent \u00e0 toute l\u2019\u00e9quipe. Elles sont maintenant dans \u00ab\u00a0Le cadre\u00a0\u00bb, avec les autres r\u00e9glages du domaine. Rien ne change dans vos soldes." }
  ]},
  { v:'5.95', items:[
    { emoji: 'chevron', titre:'Le planning : plus de \u00ab\u00a0mode\u00a0\u00bb \u00e0 activer',
      desc:"Avant, toucher une case ouvrait la fiche du jour \u2014 sauf si le bouton \u00ab\u00a0S\u00e9lection multiple\u00a0\u00bb \u00e9tait allum\u00e9, auquel cas la m\u00eame case se cochait. Le bouton a disparu\u00a0: toucher une case la coche, toujours. La barre du bas dit qui est coch\u00e9 et \u00e0 quelles dates, puis propose ce qu\u2019on peut en faire." },
    { emoji: 'calendrier', titre:'Toute une journ\u00e9e, toute une personne, en une touche',
      desc:"Toucher le num\u00e9ro du jour, en haut de la grille, coche toute l\u2019\u00e9quipe ce jour-l\u00e0. Toucher un nom coche sa semaine enti\u00e8re. Toucher \u00ab\u00a0Salari\u00e9\u00a0\u00bb, dans le coin, coche tout ce qui est affich\u00e9. Un deuxi\u00e8me appui d\u00e9coche." },
    { emoji: 'document', titre:'Une seule fiche pour un jour comme pour trente',
      desc:"Les horaires et les absences avaient chacun leur \u00e9cran selon qu\u2019on modifiait un jour ou plusieurs. C\u2019est la m\u00eame fiche d\u00e9sormais\u00a0: elle s\u2019adapte au nombre de cases coch\u00e9es." },
    { emoji: 'bouclier', titre:'Un cong\u00e9 ne s\u2019efface plus en silence',
      desc:"Poser \u00ab\u00a0R\u00e9cup\u00a0\u00bb ou \u00ab\u00a0Chaleur\u00a0\u00bb sur une semaine \u00e9crasait sans le dire les cong\u00e9s d\u00e9j\u00e0 pos\u00e9s dessus. Ils sont maintenant conserv\u00e9s, et le message de confirmation indique combien ont \u00e9t\u00e9 pr\u00e9serv\u00e9s. Sur une seule case, choisie \u00e0 la main, le remplacement reste possible." }
  ]},
  { v:'5.94', items:[
    { emoji: 'info', titre:'L\u2019aide du Tracteur ne parlait ni du chrono ni du mode du jour',
      desc:"Deux changements r\u00e9cents \u2014 la coche qui lance la mesure, et la question \u00ab Tu prends le tracteur aujourd\u2019hui ? \u00bb \u2014 n\u2019\u00e9taient expliqu\u00e9s nulle part. La pastille \u00ab ? Aide \u00bb du Tracteur les d\u00e9crit maintenant : les trois compteurs, ce que le chrono mesure et ce qu\u2019il ne mesure pas, la mesure \u00e9cart\u00e9e, et o\u00f9 le domaine active le chrono. Celle de l\u2019Accueil dit \u00e0 quoi sert la question du matin, et rappelle qu\u2019elle ne change aucun droit." },
    { emoji: 'liste', titre:'Trois r\u00e9glages dont l\u2019aide ne disait pas o\u00f9 ils se trouvaient',
      desc:"L\u2019heure de la coupure d\u00e9jeuner (Planning, Outils), le bar\u00e8me de r\u00e9f\u00e9rence de votre r\u00e9gion et votre rendement au pressoir en kilos par hectolitre (Cave, Le Cuvier, R\u00e9glages) existaient tous les trois, mais rien ne menait \u00e0 eux. Les fiches d\u2019aide du Planning, des R\u00e9glages et de la Cave indiquent d\u00e9sormais le chemin." }
  ]},
  { v:'5.93', items:[
    { emoji: 'tracteur', titre:'\u00ab\u00a0Tu prends le tracteur aujourd\'hui\u00a0?\u00a0\u00bb',
      desc:"Si tu es \u00e0 la fois ouvrier et tractoriste et qu'une session tracteur est ouverte, l'app pose la question \u00e0 la premi\u00e8re ouverture du jour. Ta r\u00e9ponse tient la journ\u00e9e\u00a0; demain elle se repose." },
    { emoji: 'doigt', titre:'Tes \u00e9crans du jour en premier',
      desc:"En mode tracteur, Tracteur, Phyto et Vigne passent en t\u00eate du menu du bas et l'app s'ouvre directement sur le Tracteur. Rien n'est retir\u00e9\u00a0: le reste glisse sous \u00ab\u00a0Plus\u00a0\u00bb, o\u00f9 se trouve aussi le retour au terrain." }
  ]},
  { v:'5.92', items:[
    { emoji: 'chrono', titre:'Le chrono tracteur ne se perd plus',
      desc:"Avant, verrouiller son t\u00e9l\u00e9phone pendant le travail effa\u00e7ait la mesure en cours sans rien dire. Elle est maintenant retrouv\u00e9e \u00e0 la r\u00e9ouverture, m\u00eame plusieurs heures apr\u00e8s." },
    { emoji: 'doigt', titre:'Toucher une parcelle lance la mesure',
      desc:"Plus de bouton D\u00e9marrer. On touche la parcelle o\u00f9 l'on commence, on touche \u00ab\u00a0J'ai fini\u00a0\u00bb en partant. Toucher directement la parcelle suivante ench\u00e2ine sans compter de d\u00e9placement." },
    { emoji: 'route', titre:'Trajets et pause d\u00e9jeuner s\u00e9par\u00e9s du travail',
      desc:"Trois compteurs au lieu d'un\u00a0: le temps dans les parcelles, le temps hors parcelle, la pause d\u00e9jeuner. La cadence ne m\u00e9lange plus la route et le travail." },
    { emoji: 'alerte', titre:'Un chrono oubli\u00e9 n\'est plus comptabilis\u00e9',
      desc:"Une mesure tr\u00e8s longue ou tr\u00e8s courte par rapport au bar\u00e8me est \u00e9cart\u00e9e\u00a0: la parcelle reste coch\u00e9e au bar\u00e8me, et l'\u00e9cran dit pourquoi." },
    { emoji: 'epingle', titre:'Les parcelles les plus proches en premier',
      desc:"La liste se range par distance \u00e0 la parcelle en cours au lieu de l'ordre alphab\u00e9tique. Une tourn\u00e9e rang\u00e9e par le chef reste prioritaire." }
  ]},
  { v:'5.91', items:[
    { emoji: 'chrono', titre:'La coupure d\u00e9jeuner dit enfin quand elle tombe',
      desc:'Un ouvrier qui lisait \u00ab une heure de pause \u00bb pouvait croire qu\u2019il en choisissait le moment ; la paie et le chef d\u2019exploitation y lisaient autre chose. Le planning parle maintenant de \u00ab coupure \u00bb, et vous pouvez dire \u00e0 quelle heure elle a lieu : Planning, onglet Mod\u00e8les, sous la dur\u00e9e. Une heure fixe, \u00ab selon le chantier \u00bb, ou rien du tout \u2014 tant que vous ne r\u00e9pondez pas, rien ne change chez vous. Les journ\u00e9es s\u2019affichent alors coup\u00e9es en deux : 09:00 \u2192 12:00 puis 13:00 \u2192 16:00.' },
    { emoji: 'balance', titre:'Trois nombres qui ne se confondent plus',
      desc:'Pr\u00e9sence, coupure, heures dues : une journ\u00e9e de 09:00 \u00e0 16:00 avec une heure de coupure fait 7 h de pr\u00e9sence et 6 h dues. Chaque dur\u00e9e affich\u00e9e porte d\u00e9sormais son \u00e9tiquette, pour que le chef, l\u2019ouvrier et la paie lisent la m\u00eame ligne sans l\u2019interpr\u00e9ter chacun \u00e0 sa fa\u00e7on.' }
  ] },
  { v:'5.90', items:[
    { emoji: 'calendrier', titre:'Le planning de l\u2019ann\u00e9e s\u2019imprime',
      desc:'Un nouveau document sort le rythme de l\u2019\u00e9quipe sur douze mois : jours travaill\u00e9s, heures de prise et de fin de service, coupure d\u00e9jeuner, fermetures et jours f\u00e9ri\u00e9s. Il se trouve dans R\u00e9glages, onglet App, \u00ab Documents & impressions \u00bb, et vous propose par d\u00e9faut l\u2019ann\u00e9e \u00e0 venir. Une page par mod\u00e8le de semaine : quand toute l\u2019\u00e9quipe suit le m\u00eame rythme, une seule feuille suffit.' }
  ] },
  { v:'5.89', items:[
    { emoji: 'raisin', titre:'La Cave suit le chemin du raisin',
      desc:'Les trois onglets de la Cave changent d\u2019ordre : Le Cuvier passe en premier, Le Chai vient ensuite, Le mill\u00e9sime ferme la marche. C\u2019est le trajet r\u00e9el du raisin, de la benne \u00e0 la bouteille. Rien ne bouge \u00e0 l\u2019int\u00e9rieur des \u00e9crans, aucune saisie n\u2019est d\u00e9plac\u00e9e, et la Cave continue de s\u2019ouvrir sur Le Chai.' }
  ] },
  { v:'5.88', items:[
    { emoji: 'graphique', titre:'Les graphiques ne se lisent plus \u00e0 la loupe',
      desc:'Sur t\u00e9l\u00e9phone, les chiffres et les \u00e9tiquettes des graphiques du Pilotage descendaient jusqu\u2019\u00e0 3 pixels, et ne d\u00e9passaient pas 7 sur un ordinateur : ils \u00e9taient dessin\u00e9s dans un cadre fixe que l\u2019\u00e9cran r\u00e9duisait ensuite. Chaque graphique mesure d\u00e9sormais la place dont il dispose et dessine \u00e0 cette taille, si bien que les textes font partout leur taille r\u00e9elle. Sur un \u00e9cran \u00e9troit, un calendrier de douze mois d\u00e9file au lieu de r\u00e9tr\u00e9cir, et les graphiques se recomposent : moins de graduations, et les noms passent au-dessus des barres plut\u00f4t que dans une colonne qui mangeait le tiers de l\u2019\u00e9cran.' },
    { emoji: 'bulle', titre:'Un graphique sans donn\u00e9e dit ce qui lui manque',
      desc:'Un titre s\u2019affichait, et sous lui, rien. Impossible de savoir s\u2019il manquait une saisie ou si l\u2019\u00e9cran \u00e9tait cass\u00e9. Les graphiques qui n\u2019ont pas de quoi tracer expliquent maintenant ce qui manque et o\u00f9 le saisir. Ceux qui n\u2019ont vraiment rien \u00e0 dire continuent de s\u2019effacer enti\u00e8rement, sans laisser un titre tout seul.' },
    { emoji: 'raisin', titre:'Le rendement au pressoir que vous avez r\u00e9gl\u00e9 sert partout',
      desc:'Le Cuvier vous laisse fixer votre fourchette de kilos par hectolitre. Deux \u00e9crans s\u2019en servaient, deux autres divisaient par 135 quoi qu\u2019il arrive : la cha\u00eene r\u00e9colte vers bouteilles du Chai, et le rendement du bilan de campagne. Tant que le r\u00e9glage restait \u00e0 sa valeur d\u2019origine, la diff\u00e9rence \u00e9tait invisible ; d\u00e8s qu\u2019on y touchait, deux \u00e9crans donnaient deux chiffres pour la m\u00eame cuv\u00e9e. Ils lisent tous le m\u00eame r\u00e9glage.' },
    { emoji: 'graphique', titre:'Les rendements par mill\u00e9sime se lisent dans le m\u00eame sens partout',
      desc:'La fiche parcelle affichait les mill\u00e9simes du plus r\u00e9cent au plus ancien, le Cuvier du plus ancien au plus r\u00e9cent : m\u00eame donn\u00e9e, deux sens de lecture. La fiche parcelle suit d\u00e9sormais celui du Cuvier, le plus ancien en haut, et l\u2019\u00e9cart se compare toujours \u00e0 la ligne du dessus.' }
  ] },
  { v:'5.87', items:[
    { emoji: 'feuille', titre:'Vos \u00e9cartements de plantation se r\u00e8glent enfin depuis R\u00e9glages',
      desc:'La distance entre vos rangs et entre vos pieds sert \u00e0 ramener les heures conseill\u00e9es \u00e0 votre densit\u00e9 r\u00e9elle : \u00e0 6 000 pieds \u00e0 l\u2019hectare, un bar\u00e8me pens\u00e9 pour 10 000 propose un tiers d\u2019heures de trop. Le r\u00e9glage existait, mais il n\u2019\u00e9tait accessible qu\u2019en ouvrant le bar\u00e8me de la convention par le bouton \u00ab \u002b Nouvelle t\u00e2che \u00bb \u2014 personne n\u2019allait l\u2019y chercher, et la mise en route vous envoyait sur l\u2019onglet Vigne o\u00f9 il ne figurait pas. Il a maintenant sa ligne, dans R\u00e9glages \u203a Vigne, qui affiche vos deux \u00e9cartements et le nombre de pieds \u00e0 l\u2019hectare qui en d\u00e9coule. Tant qu\u2019ils ne sont pas renseign\u00e9s, rien ne change nulle part.' }
  ] },
  { v:'5.86', items:[
    { emoji: 'boussole', titre:'Un domaine qui vient d\u2019\u00eatre install\u00e9 sait par o\u00f9 commencer',
      desc:'L\u2019Accueil d\u2019un administrateur affiche d\u00e9sormais une mise en route : le nom du domaine, les parcelles et leurs contours, les p\u00e9riodes de travail, le bar\u00e8me des t\u00e2ches, l\u2019\u00e9quipe, puis la premi\u00e8re validation. Rien n\u2019est \u00e0 cocher \u00e0 la main : chaque \u00e9tape se lit dans ce qui est d\u00e9j\u00e0 enregistr\u00e9, et m\u00e8ne d\u2019un geste au bon \u00e9cran. Le bloc s\u2019efface tout seul quand tout est fait. S\u2019il reste un r\u00e9glage qui rendrait un calcul plus juste \u2014 le SIRET pour le registre phyto en fichier, vos \u00e9cartements de plantation pour le bar\u00e8me \u2014 il ne garde qu\u2019une ligne. Les ouvriers ne le voient pas : ce sont des r\u00e9glages de domaine.' }
  ] },
  { v:'5.85', items:[
    { emoji: 'info', titre:'L\u2019aide de chaque \u00e9cran dit enfin ce que l\u2019\u00e9cran fait',
      desc:'La pastille « ? Aide » d\u00e9crivait des modules tels qu\u2019ils \u00e9taient il y a plusieurs mois. Celle du Pilotage annon\u00e7ait six onglets quand il y en a sept, et en nommait deux qui n\u2019existent plus. Celles de la Cave et de La R\u00e9serve ignoraient le parc \u00e0 f\u00fbts, la s\u00e9paration des mill\u00e9simes et les documents. Les dix fiches sont refaites, et la liste des onglets est d\u00e9sormais lue dans l\u2019application au moment o\u00f9 vous ouvrez l\u2019aide : elle ne pourra plus vieillir toute seule.' },
    { emoji: 'euro', titre:'\u00c9conomie annon\u00e7ait une fin de p\u00e9riode moins ch\u00e8re que ce que vous aviez d\u00e9j\u00e0 d\u00e9pens\u00e9',
      desc:'L\u2019\u00e9cart de cadence \u2014 « votre \u00e9quipe va-t-elle plus vite ou moins vite que le bar\u00e8me ? » \u2014 comptait les heures de pr\u00e9sence \u00e0 partir des seules journ\u00e9es portant une validation. Or une validation couvre souvent plusieurs jours de travail : sur le printemps, 165 journ\u00e9es sur 559 en portaient une, et l\u2019application concluait que vous alliez deux fois plus vite que pr\u00e9vu. Elle projetait alors une fin de p\u00e9riode \u00e0 37 000 \u20ac sur une p\u00e9riode termin\u00e9e o\u00f9 79 000 \u20ac \u00e9taient d\u00e9j\u00e0 engag\u00e9s, et conseillait en vert de r\u00e9duire un bar\u00e8me qui \u00e9tait juste. La pr\u00e9sence vient maintenant du planning, comme dans Exercice comptable, et la cadence ne s\u2019applique plus qu\u2019\u00e0 ce qui reste \u00e0 faire : une projection ne peut plus contredire ce qui est d\u00e9j\u00e0 d\u00e9pens\u00e9. Le planning dit qui \u00e9tait l\u00e0, jamais ce que la personne a fait \u2014 l\u2019\u00e9cran le rappelle sous l\u2019indicateur.' }
  ] },
  { v:'5.84', items:[
    { emoji: 'carte', titre:'Vos parcelles sont bien cartographi\u00e9es d\u00e8s l\u2019installation',
      desc:'L\u2019\u00e9cran d\u2019installation annon\u00e7ait que l\u2019import du fichier KML \u00ab arriverait prochainement \u00bb. C\u2019\u00e9tait inexact : le contour de chaque parcelle est mis en place d\u00e8s l\u2019installation, \u00e0 partir de votre fichier. La phrase le dit maintenant.' },
    { emoji: 'nombre', titre:'Le carnet d\u2019entretien affichait un num\u00e9ro de version faux',
      desc:'Son pied de page indiquait toujours la m\u00eame version, fig\u00e9e depuis longtemps, quelle que soit la version r\u00e9ellement install\u00e9e chez vous. Il affiche d\u00e9sormais la bonne.' }
  ] },
  { v:'5.83', items:[
    { emoji: 'crayon', titre:'Tous vos documents sont \u00e0 la police du domaine',
      desc:'Le rapport de saison, le relev\u00e9 mensuel, le registre phyto, la fiche salari\u00e9 et le carnet d\u2019entretien sortaient chacun dans une police diff\u00e9rente \u2014 Georgia, Helvetica, Segoe UI \u2014 selon le navigateur qui les ouvrait. Le rapport de saison demandait m\u00eame la bonne police sans jamais la charger. Ils utilisent maintenant tous celle du domaine, comme les documents de la cave.' }
  ] },
  { v:'5.82', items:[
    { emoji: 'document', titre:'Vos documents se ressemblent enfin',
      desc:'Chaque document imprimable avait sa propre mise en page : des marges diff\u00e9rentes d\u2019un document \u00e0 l\u2019autre, et la plupart sortaient dans la police par d\u00e9faut du navigateur au lieu de la v\u00f4tre. Ils partagent maintenant le m\u00eame en-t\u00eate au nom de votre domaine, le m\u00eame pied de page et les m\u00eames marges. Le paysage reste r\u00e9serv\u00e9 aux grands tableaux, comme le registre phyto.' },
    { emoji: 'imprimante', titre:'Les documents de la cave s\u2019impriment directement',
      desc:'Le rapport d\u2019op\u00e9rations et l\u2019export des r\u00e9coltes ne s\u2019imprimaient pas : ils t\u00e9l\u00e9chargeaient un fichier qu\u2019il fallait retrouver dans ses t\u00e9l\u00e9chargements puis rouvrir soi-m\u00eame. Ils s\u2019ouvrent d\u00e9sormais dans un onglet, pr\u00eats \u00e0 imprimer ou \u00e0 enregistrer en PDF, comme tous les autres.' }
  ] },
  { v:'5.81', items:[
    { emoji: 'imprimante', titre:'Tous vos documents au m\u00eame endroit',
      desc:'Le registre phyto \u00e9tait dans un \u00e9cran, l\u2019inventaire des f\u00fbts dans un autre, le bilan de campagne dans un troisi\u00e8me, et le reste dans « Exporter / Importer ». Il fallait savoir o\u00f9 chaque document avait \u00e9t\u00e9 rang\u00e9. R\u00e9glages ouvre maintenant « Documents & impressions » : tout ce que Ma Vigne sait imprimer y figure, class\u00e9 par usage. Ce que vous devez pouvoir montrer en contr\u00f4le d\u2019abord, vos \u00e9tats internes ensuite, vos donn\u00e9es brutes pour finir. Chaque ligne dit son format et ce qu\u2019elle va vous demander avant de g\u00e9n\u00e9rer.' },
    { emoji: 'liste', titre:'Le registre phyto en fichier Excel est mis en avant',
      desc:'Il devient obligatoire au 1er janvier 2027 : un registre imprim\u00e9 ne suffira plus, il faudra un fichier lisible par machine. Il \u00e9tait d\u00e9j\u00e0 disponible, mais peu visible. Il est d\u00e9sormais en t\u00eate de la liste, avec sa date limite \u00e9crite \u00e0 c\u00f4t\u00e9.' },
    { emoji: 'calendrier', titre:'Le relev\u00e9 mensuel se pr\u00e9pare sur son propre \u00e9cran',
      desc:'Le formulaire du relev\u00e9 d\u2019heures occupait le haut de la page \u00e0 chaque ouverture, m\u00eame quand vous veniez chercher autre chose. Il s\u2019ouvre maintenant quand vous cliquez dessus, et le r\u00e9glage des heures de la saison a sa propre ligne.' }
  ] },
  { v:'5.80', items:[
    { emoji: 'rotation', titre:'Le soutirage se lit pareil partout',
      desc:'Le bouton « Soutirer » du Pilotage ouvrait le Cuvier, alors que le soutirage se fait au Chai. Et la fiche de cuv\u00e9e pouvait annoncer un soutirage que le journal du Chai ne connaissait pas. Le r\u00e9glage « sous tirage » de la fiche est retir\u00e9 : une cuv\u00e9e se soutire plusieurs fois pendant l\u2019\u00e9levage, un oui/non ne pouvait pas le dire. On enregistre le soutirage au Chai, avec sa date, et la cuv\u00e9e affiche « Soutir\u00e9e le\u2026 ». \u26a0\u{FE0F} Une cuv\u00e9e que vous aviez seulement coch\u00e9e r\u00e9appara\u00eetra « \u00e0 soutirer » tant que le soutirage n\u2019est pas enregistr\u00e9 : l\u2019application n\u2019en a aucune trace dat\u00e9e.' },
    { emoji: 'eprouvette', titre:'Un soutirage trop ancien ne compte plus',
      desc:'Une cuv\u00e9e soutir\u00e9e avant la fin de sa malo \u00e9tait consid\u00e9r\u00e9e comme faite. Le Pilotage compare maintenant la date du soutirage \u00e0 celle o\u00f9 la malo a \u00e9t\u00e9 constat\u00e9e termin\u00e9e, et vous dit pourquoi la cuv\u00e9e reste \u00e0 soutirer.' },
    { emoji: 'sablier', titre:'La part des anges, mill\u00e9sime par mill\u00e9sime',
      desc:'Un seul taux pour toute la cave donnait une moyenne qui ne d\u00e9crivait aucun vin. Chaque mill\u00e9sime a maintenant sa ligne dans le Pilotage : volume remis, nombre d\u2019ouillages, f\u00fbts concern\u00e9s et taux annuel qui lui est propre. La fen\u00eatre est de douze mois glissants.' },
    { emoji: 'calendrier', titre:'L\u2019ouillage group\u00e9 par mill\u00e9sime',
      desc:'Les cuv\u00e9es \u00e0 ouiller sont regroup\u00e9es par ann\u00e9e, avec le d\u00e9lai propre \u00e0 chacune. Si vous n\u2019avez qu\u2019un mill\u00e9sime en cave, rien ne change \u00e0 l\u2019\u00e9cran.' },
    { emoji: 'document', titre:'Registre et bilan par mill\u00e9sime',
      desc:'Le registre des manipulations et le bilan de campagne se lisent d\u00e9sormais mill\u00e9sime par mill\u00e9sime. Une campagne contient deux vins \u2014 celui qui rentre et celui qui finit son \u00e9levage \u2014 et les m\u00e9langer produisait des documents illisibles. Le bilan indique lui-m\u00eame ce qui rel\u00e8ve de la campagne et ce qui rel\u00e8ve du mill\u00e9sime.' }
  ]},
  { v:'5.79', items:[
    { emoji: 'sablier', titre:'Un seuil d\u2019ouillage par mill\u00e9sime',
      desc:'Un vin jeune se rattrape plus souvent qu\u2019un vin d\u2019un an. Vous pouvez d\u00e9sormais r\u00e9gler le d\u00e9lai d\u2019alerte mill\u00e9sime par mill\u00e9sime, dans les r\u00e9glages du Chai. Sans r\u00e9glage propre, un mill\u00e9sime suit le seuil g\u00e9n\u00e9ral \u2014 rien ne change pour vous tant que vous n\u2019y touchez pas.' },
    { emoji: 'loupe', titre:'Les chiffres du Chai suivent le filtre',
      desc:'En filtrant sur un mill\u00e9sime, le bandeau affichait encore les totaux de toute la cave. Cuv\u00e9es, f\u00fbts, hectolitres et cuv\u00e9es \u00e0 ouiller correspondent maintenant \u00e0 ce que vous regardez.' }
  ]},
  { v:'5.78', items:[
    { emoji: 'dossier', titre:'Un mill\u00e9sime \u00e0 la fois dans la Cave',
      desc:'Une op\u00e9ration porte d\u00e9sormais sur un seul mill\u00e9sime : on choisit l\u2019ann\u00e9e, puis seules ses cuv\u00e9es sont propos\u00e9es. On n\u2019ouille pas les f\u00fbts d\u2019un mill\u00e9sime avec le vin d\u2019un autre.' },
    { emoji: 'goutte', titre:'Le volume d\u2019ouillage propos\u00e9 devient juste',
      desc:'Le volume conseill\u00e9 par f\u00fbt \u00e9tait calcul\u00e9 sur la moyenne de tous vos ouillages, tous mill\u00e9simes confondus. Il ne regarde plus que les ouillages de la cuv\u00e9e concern\u00e9e.' }
  ]},
  { v:'5.77', items:[
    { emoji: 'microscope', titre:'L\u2019acide malique se saisit dans l\u2019analyse',
      desc:'Un champ de plus dans le formulaire d\u2019analyse, \u00e0 recopier depuis le bulletin du labo. \u00c0 partir de trois valeurs, Ma Vigne projette la fin de la malo de chaque cuv\u00e9e \u2014 sur vos mesures, pas sur une moyenne.' },
    { emoji: 'rotation', titre:'Le Pilotage vous dit quelle cuv\u00e9e soutirer',
      desc:'L\u2019onglet Cave signale les cuv\u00e9es dont la malo est finie et qui attendent leur soutirage, et alerte quand le malique cesse de descendre alors qu\u2019il en reste.' },
    { emoji: 'outil', titre:'Une analyse modifi\u00e9e ne perd plus ses valeurs',
      desc:'En rouvrant une analyse pour corriger sa date, les SO\u2082 et l\u2019acidit\u00e9 volatile pouvaient \u00eatre remplac\u00e9s par ceux de la saisie pr\u00e9c\u00e9dente. Le formulaire affiche maintenant les vraies valeurs de l\u2019analyse.' },
    { emoji: 'verre', titre:'La Cave du Pilotage devient un tableau de bord',
      desc:'Trois vues : ce qui presse aujourd\u2019hui, o\u00f9 en est le mill\u00e9sime, et ce que co\u00fbte le parc \u00e0 f\u00fbts. Chaque ligne renvoie vers l\u2019\u00e9cran de saisie correspondant.' }
  ]},
  // 5.76 — Bilan de campagne.
  { v: '5.76', items: [
    { emoji: 'livre', titre: 'Le bilan de votre campagne',
      desc: 'Une année entière sur deux pages imprimables : les travaux de la vigne, la récolte '
          + 'parcelle par parcelle, le chemin du raisin jusqu’à la bouteille, l’état du chai et '
          + 'du parc à fûts, la protection du vignoble. Rien de plus à saisir : tout vient de '
          + 'ce que vous avez noté au fil de l’année.' },
    { emoji: 'dossier', titre: 'Deux façons de l’ouvrir',
      desc: 'Depuis Pilotage › Archives, l’écran de fin de campagne, ou depuis '
          + 'Réglages › Import / Export à côté de vos autres documents.' },
    { emoji: 'boussole', titre: 'Des chiffres qui disent leur assiette',
      desc: 'La surface travaillée additionne les passages : une parcelle relevée deux fois y '
          + 'compte deux fois. Le rendement moyen ne porte que sur les parcelles récoltées. '
          + 'Le document le dit, pour qu’aucun chiffre ne soit lu de travers.' }
  ] },
  // 5.75 — Entonnage depuis le parc + registre des manipulations.
  { v: '5.75', items: [
    { emoji: 'verre', titre: 'Choisir ses barriques au décuvage',
      desc: 'Au décuvage, vous piochez maintenant dans vos fûts libres : tonnelier par tonnelier, '
          + 'année par année. L’app propose de commencer par les plus vieux et signale si elle doit '
          + 'prendre du bois neuf. Vos cuvées savent enfin d’où viennent leurs fûts, et leur âge '
          + 'est juste — avant, tout fût créé au décuvage passait pour neuf.' },
    { emoji: 'liste', titre: 'Le registre des manipulations',
      desc: 'Toutes vos manipulations œnologiques d’une campagne, mises en forme et imprimables : '
          + 'enrichissement, sulfitage, adjonctions, pratiques de cave. Rien de plus à saisir, tout '
          + 'vient de ce que vous notez déjà au Cuvier et au Chai. Depuis Le Cuvier › Réglages, '
          + 'ou Réglages › Import / Export.' },
    { emoji: 'recu', titre: 'Un état interne, pas une déclaration',
      desc: 'Le registre vous aide à retrouver et présenter vos manipulations. Il ne remplace aucune '
          + 'déclaration officielle : Ma Vigne prépare, vous déclarez.' }
  ] },
  // 5.74 — Le parc a futs : mouvements d'entree et de sortie.
  { v: '5.74', items: [
    { emoji: 'bouteille', titre: 'Vos fûts reviennent au parc',
      desc: 'Quand une cuvée part en bouteille, ses fûts redeviennent disponibles dans '
          + 'La Réserve, vieillis d’un vin. Même chose quand vous retirez des fûts d’une '
          + 'cuvée : le fût vide revient, sauf si vous le jetez.' },
    { emoji: 'envoyer', titre: 'Se séparer de fûts',
      desc: 'Vente, retour au tonnelier ou destruction : trois motifs, depuis l’onglet Fûts '
          + 'de La Réserve. Le mouvement reste au registre, même pour un fût détruit.' },
    { emoji: 'liste', titre: 'Le registre du parc',
      desc: 'Tout ce qui entre et sort, avec son motif et sa date. Entonner ou embouteiller ne '
          + 'change pas le nombre de fûts du domaine : seuls un achat ou une séparation le font '
          + 'bouger, et le registre explique l’écart entre deux inventaires.' }
  ] },
  // 5.73 — Cave : troisieme ecran « Le millesime ».
  { v: '5.73', items: [
    { emoji: 'chrono', titre: 'La cave dit enfin ce qui arrive',
      desc: 'Un nouvel écran « Le millésime », à côté du Chai et du Cuvier. Il montre les quatre '
          + 'prochaines semaines : les fûts à ouiller, les cuves à mesurer, la fin de fermentation '
          + 'estimée, et les fermentations qui ralentissent. Rien de plus à saisir : tout se déduit '
          + 'de ce que vous notez déjà.' },
    { emoji: 'raisin', titre: 'De la vigne à la bouteille, d’un seul regard',
      desc: 'Le second onglet suit le parcours d’un millésime : ce qui est rentré, ce qui fermente, '
          + 'ce qui est en fût, ce qui est en bouteille, avec la perte à chaque étape. On y voit aussi '
          + 'le rendement de chaque parcelle et d’où vient chaque cuvée.' },
    { emoji: 'balance', titre: 'Le rendement de l’appellation',
      desc: 'Posez une fois le maximum autorisé sur une parcelle, en touchant sa ligne : '
          + 'un dépassement se voit immédiatement. Rien n’est bloqué, c’est vous qui décidez.' }
  ] },
  // 5.72 — SEC-GT/2 : second facteur sur le panneau GUERETTECH. Interne.
  { v: '5.72', items: [] },
  // 5.71 — SEC-GT + Business/Leads : panneau GUERETTECH interne, rien de visible
  // côté client. items:[] = sous-lot technique (le modal ne s'ouvre pas).
  { v: '5.71', items: [] },
  { v: '5.70', items: [
    { emoji: 'calendrier', titre: "Ce que l\u2019exercice a co\u00fbt\u00e9, d\u2019un bilan \u00e0 l\u2019autre", desc: "Pilotage \u203a \u00c9conomie ne savait chiffrer qu\u2019une campagne. Or un comptable ne raisonne pas en campagne, il raisonne du 1\u1D49\u02B3 ao\u00fbt au 31 juillet. Nouvel onglet \u00ab Exercice \u00bb : salaires charg\u00e9s, carburant et achats d\u2019intrants sur la fen\u00eatre exacte de votre bilan, mois par mois, avec la comparaison \u00e0 l\u2019exercice pr\u00e9c\u00e9dent." },
    { emoji: 'euro', titre: "Des salaires compt\u00e9s une seule fois", desc: "Le budget de campagne s\u00e9pare le travail de la vigne et la conduite du tracteur, parce que le bar\u00e8me h/ha ne conna\u00eet pas les heures de tracteur. Le planning, lui, contient d\u00e9j\u00e0 toutes les heures pay\u00e9es. L\u2019exercice compte donc la paie une seule fois, et n\u2019ajoute au tracteur que son carburant." },
    { emoji: 'engrenage', titre: "Votre date de bilan", desc: "R\u00e9glable dans l\u2019onglet Exercice si votre cl\u00f4ture ne tombe pas fin juillet. Le mois choisi vaut pour tout le domaine et ne touche ni aux campagnes, ni aux cong\u00e9s, ni \u00e0 aucun chiffre existant." },
    { emoji: 'recu', titre: "Ce que le total ne contient pas, \u00e9crit noir sur blanc", desc: "Fermage, amortissements, assurances, cotisations du chef d\u2019exploitation, embouteillage, frais g\u00e9n\u00e9raux : Ma Vigne ne les conna\u00eet pas. L\u2019\u00e9cran le dit \u00e0 c\u00f4t\u00e9 du total, pour que personne ne le compare \u00e0 un compte de r\u00e9sultat." }
  ] },
  { v: '5.69', items: [
    { emoji: 'boussole', titre: "L\u2019ordre de passage arrive enfin sur l\u2019\u00e9cran de l\u2019\u00e9quipe", desc: "Dans Pilotage \u203a D\u00e9cider, ranger les parcelles puis enregistrer affichait \u00ab partag\u00e9 \u00e0 l\u2019\u00e9quipe \u00bb. En r\u00e9alit\u00e9, l\u2019ordre n\u2019\u00e9tait lu nulle part : personne ne le voyait. Il pilote maintenant l\u2019\u00e9cran Vigne \u2014 les parcelles s\u2019affichent dans l\u2019ordre de la tourn\u00e9e, avec leur num\u00e9ro sur la fiche et sur la carte." },
    { emoji: 'cible', titre: "Une tourn\u00e9e par travail", desc: "L\u2019ordre s\u2019enregistre pour le ou les travaux s\u00e9lectionn\u00e9s, pas pour le domaine en bloc. Deux \u00e9quipes qui tournent sur deux travaux diff\u00e9rents voient chacune son propre parcours. Pour reprendre le m\u00eame ordre sur plusieurs travaux, il suffit de les cocher ensemble avant d\u2019enregistrer." },
    { emoji: 'nombre', titre: "Des num\u00e9ros qui restent justes tout seuls", desc: "Le num\u00e9ro se recalcule sur ce qui reste \u00e0 faire : 1, 2, 3\u2026 sans trou, m\u00eame apr\u00e8s trois jours de chantier. Une parcelle termin\u00e9e sort simplement de la tourn\u00e9e. Un bouton \u00ab Tri normal \u00bb permet \u00e0 chacun de revenir \u00e0 l\u2019affichage habituel, et l\u2019administrateur peut retirer une tourn\u00e9e quand elle n\u2019a plus lieu d\u2019\u00eatre." }
  ] },
  { v: '5.68', items: [
    { emoji: 'graphique', titre: "Votre registre phyto s\u2019exporte maintenant en Excel", desc: "Le registre existait en PDF. Depuis janvier 2026, la r\u00e9glementation demande qu\u2019il soit tenu sous forme \u00e9lectronique, dans un fichier qu\u2019un logiciel peut lire \u2014 ce qu\u2019un PDF imprim\u00e9 n\u2019est pas. Un nouveau bouton, en bas du registre et dans R\u00e9glages \u203a Export, produit ce fichier : une ligne par produit et par parcelle, avec la date, la dose, les horaires, le stade, la surface trait\u00e9e et les coordonn\u00e9es de la parcelle. Il s\u2019ouvre d\u2019un double-clic dans Excel. L\u2019obligation devient ferme au 1er janvier 2027." },
    { emoji: 'recu', titre: "Le SIRET et le mode de production du domaine", desc: "Le registre export\u00e9 doit porter le num\u00e9ro SIRET de l\u2019exploitation et dire si la production est conduite en bio. Ces deux informations se saisissent une fois pour toutes dans R\u00e9glages \u203a Domaine, et se retrouvent ensuite sur chaque ligne du registre. Tant que le SIRET manque, l\u2019export vous le signale au lieu de sortir un fichier incomplet sans rien dire." },
    { emoji: 'document', titre: "Les exports CSV s\u2019ouvrent enfin correctement dans Excel", desc: "Les exports du journal et des parcelles s\u00e9paraient leurs colonnes par une virgule. Ouverts en France, ils entassaient tout dans une seule colonne, et les surfaces \u00e0 virgule s\u2019y m\u00e9langeaient aux s\u00e9parateurs. Ils utilisent d\u00e9sormais le point-virgule, comme le reste de l\u2019application." }
  ] },
  { v: '5.67', items: [
    { emoji: 'liste', titre: "Choisissez le barème de votre région", desc: "Les heures conseillées de l'application venaient toutes de l'accord bourguignon. Un domaine girondin y lisait des chiffres qui n'étaient pas les siens. Dans l'écran du barème, vous choisissez maintenant votre région : la Bourgogne ou la Gironde pour commencer, d'autres viendront au fil des installations. Chaque barème indique son texte source et sa date. Rien n'est imposé : c'est une référence, vos heures restent les vôtres, et changer de barème ne modifie aucune de vos valeurs." }
  ] },
  { v: '5.66', items: [
    { emoji: 'feuille', titre: "Le barème s'adapte à la densité de vos vignes", desc: "Les heures par hectare du barème valent pour une vigne à 10 000 pieds — un mètre entre les rangs, un mètre sur le rang. Une parcelle plantée à trois mètres compte trois fois moins de pieds, donc à peu près trois fois moins de travail à la taille. Dans l'écran du barème, vous pouvez maintenant indiquer vos écartements : les heures conseillées sont recalculées en conséquence, comme le prévoit l'accord collectif. Rien n'est imposé — c'est une proposition, vos valeurs restent les vôtres. Et tant que vous ne renseignez rien, absolument rien ne change." }
  ] },
  { v: '5.65', items: [
    { emoji: 'calendrier', titre: "Modifier les heures d'une tâche changeait sa saison", desc: "Dans Réglages › Tâches, ouvrir une tâche et l'enregistrer — même sans rien changer — effaçait les saisons qu'on lui avait données et remettait celles du barème. Une pioche réglée sur l'automne repassait au printemps, sans un mot. La cause : l'écran des heures réécrivait la tâche entière au lieu de ne toucher qu'aux heures. Il ne modifie plus que ce qu'on lui demande." }
  ] },
  { v: '5.64', items: [
    { emoji: 'chrono', titre: "Les passages sautés ne comptent plus comme du travail fait", desc: "Quand le relevage se fait en un seul passage, on valide directement le dernier niveau et les précédents se cochent tout seuls. L'application comptait alors les trois passages : 100 heures par hectare au lieu des 50 réellement passées. Sur un domaine où presque toutes les parcelles sont dans ce cas, cela représentait près de 600 heures de travail qui n'ont jamais eu lieu — de quoi gonfler le coût de main-d'œuvre par parcelle et laisser croire que l'équipe allait plus vite que le barème. Un passage sauté ne compte plus, ni dans le travail fait, ni dans le travail qui reste : une parcelle relevée une fois est terminée, et son reste à faire est bien zéro. L'avancement en surface, lui, ne bouge pas d'un centième." }
  ] },
  { v: '5.63', items: [
    { emoji: 'doigt', titre: "Quatre modules dans la barre du bas, au lieu de trois", desc: "Sur téléphone, la barre du bas n'affichait que trois modules : tout le reste était rangé derrière le bouton « ⋯ Plus », y compris des modules ouverts plusieurs fois par jour. Elle en montre maintenant quatre. Et quand un domaine tient en cinq modules — parce que sa formule en donne cinq, ou parce que certains ont été décochés dans la fiche d'un membre — ils sont tous dans la barre : le bouton « Plus » disparaît." }
  ] },
  { v: '5.62', items: [
    { emoji: 'calendrier', titre: "« Ça tient dans la fenêtre » alors que la fenêtre était déjà passée", desc: "Dans Pilotage › Décider, le bandeau de l'ordre de passage comparait le travail restant à la fenêtre entière de la tâche — du premier au dernier jour où elle peut se faire. Consulté le 15 juin sur un relevage prévu du 1er avril au 30 juin, il annonçait 65 jours disponibles alors qu'il n'en restait que 12, et affichait un feu vert sur un chantier qui débordait de deux semaines. Il compte maintenant les jours qui restent à partir d'aujourd'hui." },
    { emoji: 'equipe', titre: "Le nombre de personnes conseillé ne suffisait pas", desc: "Quand le travail débordait, l'écran indiquait combien de personnes il faudrait — sans compter les déplacements entre parcelles, qui sont pourtant les mêmes quel que soit le nombre de bras. Sur vingt parcelles à cinq personnes, il conseillait cinq personnes : exactement l'équipe déjà en place. Il en fallait sept. Les trajets sont désormais dans le calcul." },
    { emoji: 'feuille', titre: "Chaque tâche est jugée sur sa propre période", desc: "En cochant plusieurs tâches, l'application les évaluait sur une seule période allant du début de la plus précoce à la fin de la plus tardive. Taille en janvier et effeuillage en juillet donnaient ainsi 141 jours de marge quand les deux périodes réelles n'en totalisent que 64 : le verdict était favorable d'avance. Chaque tâche a maintenant sa ligne, sa charge et son verdict." },
    { emoji: 'curseurs', titre: "Deux chiffres qui se contredisaient", desc: "Le bandeau pouvait afficher « 0,00 ha » après une journée entière passée sur une grande parcelle : la surface n'était comptée qu'au jour où la parcelle se termine. Elle se répartit désormais sur les journées réellement travaillées. Dans le simulateur « et si ? », la fin de saison ne bougeait pas d'un jour quand on déplaçait l'équipe entre les tâches, et restait affichée même avec deux tâches à l'arrêt. Elle suit maintenant la dernière tâche à finir — et le dit clairement quand une tâche n'a personne." }
  ] },
  { v: '5.61', items: [
    { emoji: 'equipe', titre: "Une seule ligne pour toute une equipe", desc: "Pour la vendange, il fallait creer une fiche par personne : trente fiches qui ne se connecteront jamais, qui n'ont aucun compteur d'annualisation a tenir, et qui rendent la grille illisible le seul mois ou elle sert vraiment. Une fiche peut desormais etre declaree \u00ab\u00a0equipe collective\u00a0\u00bb dans Reglages \u203a Equipe, avec un nombre de personnes. La ligne reste unique dans le planning, mais ses heures comptent pour tout le monde." },
    { emoji: 'calendrier', titre: "L'effectif se change jour par jour", desc: "Une vendange ne se fait pas au meme nombre du premier au dernier jour. Dans la grille Equipe, la selection multiple porte un nouveau bouton Effectif : on touche les jours concernes, on saisit le nombre, c'est applique d'un coup. La saisie du jour prime sur le nombre par defaut de la fiche, et elle ne touche pas aux horaires deja poses." },
    { emoji: 'balance', titre: "Ce qui reste strictement individuel", desc: "Une equipe collective n'entre ni dans le compteur des 1607 heures, ni dans les conges payes, ni dans les heures supplementaires, ni dans les alertes de depassement hebdomadaire, ni dans le releve d'heures individuel. Ces compteurs ne veulent rien dire pour trente personnes reunies sous un seul nom, et les laisser tourner aurait declenche une alarme des le premier jour de vendange." },
    { emoji: 'feuille', titre: "Le partage du travail tient compte du nombre", desc: "Quand une parcelle est faite par le chef de culture et l'equipe de vendange, \u00ab\u00a0Ma part du chantier\u00a0\u00bb ne partage plus la surface en deux parts egales : chacun pese son effectif reel. Le total affiche reste evidemment identique." }
  ] },
  { v: '5.60', items: [
    { emoji: 'equipe', titre: "Les saisonniers disparaissaient de la courbe d'effectif", desc: "Dans Pilotage, la courbe « Personnes nécessaires / semaine » et le calcul d'ETP ne comptaient que les fiches encore marquées Actives. Or on passe une fiche en Inactif quand le contrat se termine — l'application le conseille elle-même. Résultat : dès qu'un saisonnier était rangé en fin de mission, il s'effaçait de toute la campagne, comme s'il n'avait jamais travaillé. Sur un domaine réel, le pic affichait 4 personnes au lieu de 10. Une fiche compte désormais dans une campagne dès que ses dates de contrat la recoupent, quel que soit son statut d'aujourd'hui." },
    { emoji: 'euro', titre: "Le coût de main-d'oeuvre reposait sur une seule personne", desc: "Le taux horaire moyen qui sert au coût par hectare était calculé sur les seules personnes sous contrat le jour de la consultation. Une fois la saison terminée, il ne restait souvent qu'un permanent : tout le budget travail de la campagne se retrouvait chiffré sur son seul taux. La moyenne porte maintenant sur l'équipe qui a réellement fait la campagne." },
    { emoji: 'calendrier', titre: "Ce qui n'a pas changé", desc: "Les écrans qui répondent à « qui est là aujourd'hui » — carte Équipe, présences du jour, effectif au champ — gardent exactement le même comportement qu'avant. Seuls les calculs de campagne ont été corrigés. Les personnes rattachées au bureau restent hors du calcul de charge des vignes, comme avant." }
  ] },
  { v: '5.59', items: [
    { emoji: 'doigt', titre: "Sur iPhone, des messages ne s'affichaient jamais", desc: "Plusieurs écrans passaient par les petites fenêtres du navigateur pour vous avertir : « date obligatoire », « réservé aux tractoristes », « sélectionnez un mois ». Quand l'application est installée sur l'écran d'accueil d'un iPhone, ces fenêtres ne s'affichent pas : le message restait invisible, l'action ne partait pas, et rien n'expliquait pourquoi. Quinze messages étaient concernés, dont sept dans Tracteur. Ils passent tous par les bandeaux habituels de l'application." },
    { emoji: 'crayon', titre: "Le consommé saisi à la main redevient modifiable", desc: "Dans La Réserve, le crayon à côté du consommé ouvrait une fenêtre de saisie du navigateur. Sur iPhone, cette fenêtre n'apparaît pas du tout : le crayon ne faisait tout simplement rien. Il ouvre maintenant une vraie fiche, avec le nom du produit, son unité et le clavier numérique. La virgule est acceptée." },
    { emoji: 'cible', titre: "Le champ oublié se met en avant tout seul", desc: "Quand il manque une date, un nom ou un mois, l'application ne se contente plus de le signaler : elle place le curseur dans le champ concerné et ouvre le clavier dessus. Une manipulation de moins quand on a les mains prises." }
  ] },
  { v: '5.58', items: [
    { emoji: 'nuage', titre: "La météo par secteur affichait un jour qui n'existait pas", desc: "Un secteur montrait un relevé sans rapport avec la journée en cours — 18° et 11°/21° un jour de canicule — pendant que tous les autres restaient bloqués sur un sablier. En cause : la visite de démonstration écrivait sa météo inventée dans la même mémoire que votre domaine et ne la nettoyait jamais, et cette mémoire, une fois présente, empêchait toute nouvelle demande. Le relevé est désormais rattaché à votre domaine, daté, et redemandé dès qu'il vieillit ou qu'il manque un secteur." },
    { emoji: 'thermometre', titre: "Un seul chiffre pour une seule heure", desc: "La pastille en haut de l'écran et les cartes par secteur interrogeaient deux modèles différents : deux températures pouvaient s'afficher au même moment pour le même endroit. Tout passe maintenant par le modèle Météo-France. Et quand un relevé date de plus de vingt minutes, son âge est écrit à côté du titre." },
    { emoji: 'antenne', titre: "Plus de sablier qui tourne dans le vide", desc: "L'application redemandait la météo à chaque rafraîchissement de l'accueil, jusqu'à se faire refuser par le service météo — un refus qu'elle ne savait pas reconnaître, d'où le sablier indéfini et l'absence totale de trace. Les demandes sont désormais espacées, les refus sont détectés et consignés, et si la météo est vraiment indisponible, c'est écrit." }
  ] },
  { v: '5.57', items: [
    { emoji: 'drapeau', titre: "La fin d'un chantier prend tout l'écran", desc: "Quand la dernière parcelle d'une tâche tombe, le récapitulatif s'affiche en plein écran au lieu d'une fiche en bas : la surface, le nombre de parcelles, les jours passés et les personnes qui y étaient. Cela n'arrive que cinq ou six fois par campagne — c'est ce qui lui donne sa valeur." },
    { emoji: 'calendrier', titre: "« Est-ce qu'on s'y est pris plus tôt cette année ? »", desc: "La question qu'on se pose vraiment à la fin d'un chantier trouve enfin sa réponse dans l'application. À la fin d'une tâche, et sous la date de fin prévue du bloc « Ma part du chantier », l'écart avec la campagne précédente s'affiche en clair : tant de jours plus tôt, ou plus tard. La comparaison se fait sur le rang du jour dans la campagne, pas sur la date brute — deux campagnes qui ne commencent pas le même jour restent comparables. Elle est lue dans le journal, elle n'a donc besoin d'aucune clôture préalable." },
    { emoji: 'dossier', titre: "Consulter une archive ne mélange plus les années", desc: "En consultant une période passée, les surfaces venaient bien de l'archive mais les intervenants étaient relus dans le journal de l'année en cours : votre part et celle de l'équipe pouvaient être fausses sur les écrans d'archive. Tout se lit désormais sur la période que vous consultez, jamais sur celle qui est active." }
  ] },
  { v: '5.56', items: [
    { emoji: 'epingle', titre: "Personne ne savait que quelqu'un lisait", desc: "On saisit tous les jours sans jamais voir ce que ça donne à l'échelle du domaine. La nouvelle page « Le domaine cette semaine » montre la surface parcourue par toute l'équipe depuis lundi, puis qui a fait quoi — par ordre alphabétique, jamais par quantité. Aucune heure, aucune rémunération n'apparaît là : uniquement des hectares et des noms de parcelles." },
    { emoji: 'bulle', titre: "Un mot à l'équipe, une fois par semaine", desc: "L'administrateur peut écrire deux lignes qui s'affichent pour tout le monde : ce qui a bien tourné, ce qui vient lundi. C'est le seul texte saisi à la main de toute cette série de nouveautés, et probablement le plus utile — un mot d'un humain vaut mieux qu'une jauge." },
    { emoji: 'oeil', titre: "Vous décidez qui voit ce mur", desc: "Un réglage en bas de la page, réservé à l'administrateur : visible par toute l'équipe (par défaut) ou par l'administrateur seul. Les surfaces sont des données d'activité individuelle — le choix vous revient, et il se change à tout moment." }
  ] },
  { v: '5.55', items: [
    { emoji: 'livre', titre: "Une page à vous : « Ma trace »", desc: "Dix modules servent à piloter le domaine et aucun ne vous montrait votre propre travail. Depuis le bloc « Ma part du chantier », le lien « Ma trace » ouvre le bilan de votre campagne : la surface totale que vous avez travaillée, le détail par tâche, les parcelles où vous êtes intervenu et les personnes avec qui vous avez travaillé. Tout est en hectares — aucune heure, aucune rémunération n'apparaît sur cette page." },
    { emoji: 'lien', titre: "Rien n'est comparé entre collègues", desc: "La surface d'une parcelle se partage entre les personnes notées sur le chantier : une parcelle faite à trois compte pour un tiers à chacun. « Avec qui » compte des journées passées ensemble, pas des performances — aucun classement, aucun chiffre d'une personne mis en face de celui d'une autre." }
  ] },
  { v: '5.54', items: [
    { emoji: 'etoile', titre: "Vous ne vous voyiez nulle part dans l'avancement", desc: "L'accueil affichait l'avancement du domaine — jamais ce que vous y aviez fait, vous. Un nouveau bloc « Ma part du chantier » reprend la même barre et la coupe en deux : votre part en doré, celle du reste de l'équipe en vert, chacune en hectares. Le partage suit les intervenants notés au journal : une parcelle faite à trois compte pour un tiers à chacun. Rien n'est comparé entre collègues, et aucune heure n'apparaît là — ce sont des hectares." },
    { emoji: 'calendrier', titre: "Vous savez quand le chantier se termine", desc: "Sous la barre : les parcelles qui restent, leur surface, leurs noms, et une date de fin calculée sur la cadence des quinze derniers jours. Une date approximative vaut mieux qu'un pourcentage quand il s'agit de décider si on prend du renfort ou si on tient." },
    { emoji: 'engrenage', titre: "Le bloc se range comme les autres", desc: "Il apparaît en haut de l'accueil et suit les mêmes règles que les autres blocs : appui long pour le déplacer, le réduire ou le masquer. Le chantier affiché est celui sur lequel l'équipe a le plus travaillé ces quinze derniers jours ; les chantiers terminés laissent la place au suivant." }
  ] },
  { v: '5.53', items: [
    { emoji: 'valide', titre: "Valider une parcelle ne vous rendait rien", desc: "Vous validiez une parcelle, un bandeau vert passait deux secondes, et c'était tout. Le geste le plus fréquent de l'application — celui qu'on fait entre deux rangs, parfois vingt fois par semaine — était traité comme un simple accusé de réception. Désormais une fiche s'ouvre : la parcelle et sa surface, l'avancement du domaine qui bouge sous vos yeux, et ce qu'il reste. Sur les parcelles validées en un geste depuis la liste, le bandeau et son bouton « Annuler » restent inchangés tant que la parcelle n'est pas terminée : rien ne ralentit la validation à la chaîne." },
    { emoji: 'feuille', titre: "Vous savez enfin ce qu'il reste sur le chantier", desc: "Un pourcentage ne dit pas grand-chose quand on est dans les vignes. La fiche annonce le nombre de parcelles encore à faire, leur surface et leurs noms — et propose d'enchaîner directement sur la suivante, sans repasser par la liste. Trois parcelles nommées valent mieux que « 74 % »." },
    { emoji: 'drapeau', titre: "La fin d'un chantier se voit", desc: "Quand la dernière parcelle d'une tâche tombe, le domaine entier vient de passer — et jusqu'ici cela s'affichait exactement comme la première. La fiche devient un récapitulatif : la surface totale, le nombre de parcelles, le nombre de jours depuis le premier travail enregistré, et les personnes qui y ont participé. Cela n'arrive que cinq ou six fois dans une campagne." }
  ] },
  { v: '5.52', items: [
    { emoji: 'equipe', titre: "Les effectifs comptaient des gens partis", desc: "Le Pilotage ne regardait que la case « Actif » d\u2019une fiche, jamais la date de fin de contrat. Un saisonnier dont le contrat s\u2019\u00e9tait termin\u00e9 continuait donc d\u2019\u00eatre compt\u00e9 tant que personne ne le passait « Inactif » \u00e0 la main. Trois contrats finis suffisaient \u00e0 afficher sept personnes au lieu de quatre. Un membre n\u2019est d\u00e9sormais compt\u00e9 que s\u2019il est actif ET sous contrat \u00e0 la date que vous consultez \u2014 en archives, c\u2019est l\u2019\u00e9quipe de l\u2019\u00e9poque qui s\u2019affiche, pas celle d\u2019aujourd\u2019hui." },
    { emoji: 'sablier', titre: "Vos chantiers finissaient trop t\u00f4t sur le papier", desc: "Cette m\u00eame erreur remontait dans tout le module : les pr\u00e9sences du jour, le nombre de personnes au champ, le simulateur de journ\u00e9e, et surtout la cadence \u2014 avec cinq personnes compt\u00e9es au lieu de deux, l\u2019application tablait sur 35 heures par jour quand vous en faisiez 14, et annon\u00e7ait une fin de chantier deux fois et demie trop t\u00f4t. Le co\u00fbt du travail est touch\u00e9 lui aussi : le taux horaire moyen incluait les taux de gens qui ne travaillent plus." },
    { emoji: 'liste', titre: "Les contrats termin\u00e9s se voient enfin", desc: "Dans R\u00e9glages \u203a \u00c9quipe, une fiche encore « Active » dont le contrat est \u00e9chu porte maintenant une mention orange. Et sous la carte \u00c9quipe du Pilotage, le nombre de contrats termin\u00e9s est rappel\u00e9 \u2014 pour que la baisse d\u2019effectif s\u2019explique d\u2019elle-m\u00eame plut\u00f4t que de vous faire chercher o\u00f9 sont pass\u00e9s vos gens." }
  ] },
  { v: '5.51', items: [
    { emoji: 'equipe', titre: "Le simulateur d\u2019effectif conseillait n\u2019importe quoi", desc: "Il pouvait annoncer qu\u2019il vous fallait 15 personnes, tout en affichant juste \u00e0 c\u00f4t\u00e9 une cadence conseill\u00e9e de 4,2 \u2014 et le d\u00e9tail sous le graphique \u00e9tiquetait « le moins cher » quatorze lignes sur vingt et une. Trois causes : il rapportait toute la charge de la p\u00e9riode \u00e0 la fen\u00eatre d\u2019une seule t\u00e2che dat\u00e9e, il facturait les heures de vos permanents comme si vous ne les payiez pas d\u00e9j\u00e0, et il chiffrait le retard en pourcentage du co\u00fbt du travail. Il est remplac\u00e9 par « Renfort : combien, et quand », dans le nouvel onglet D\u00e9cider." },
    { emoji: 'calendrier', titre: "Le moment o\u00f9 vous prenez du renfort change le prix", desc: "Le nouvel \u00e9cran pose le travail semaine par semaine \u00e0 partir des fen\u00eatres que vous avez saisies. Ce qui n\u2019est pas absorb\u00e9 glisse sur la semaine suivante \u2014 et une t\u00e2che faite en retard devient plus longue, ce qui d\u00e9cale celle d\u2019apr\u00e8s. Vous dessinez votre renfort en cliquant dans les colonnes, et vous voyez trois choses d\u2019un coup : les semaines qui d\u00e9bordent, les gens pay\u00e9s pendant qu\u2019aucun travail n\u2019est ouvert, et ce que chaque strat\u00e9gie co\u00fbte. Les propositions qui ne bouclent pas la campagne ne sont plus pr\u00e9sent\u00e9es comme les moins ch\u00e8res : elles sont \u00e9cart\u00e9es." },
    { emoji: 'boussole', titre: "Le Pilotage se lit dans l\u2019ordre o\u00f9 l\u2019on travaille", desc: "Aujourd\u2019hui, Avancement, D\u00e9cider, \u00c9quipe, Cave, \u00c9conomie : o\u00f9 j\u2019en suis, ce qui vient, ce que je d\u00e9cide, avec qui, ce que \u00e7a co\u00fbte. La simulation \u00e9tait enterr\u00e9e dans le menu Outils alors que c\u2019est la seule page o\u00f9 l\u2019on arbitre quelque chose ; les Archives, qu\u2019on ouvre deux fois l\u2019an, y prennent sa place. Et le bouton « ? Aide » manquait \u00e0 ce module : sa fiche existait sans aucun moyen de l\u2019ouvrir." }
  ] },
  { v: '5.50', items: [
    { emoji: 'calculatrice', titre: "Les dur\u00e9es de chantier disaient toutes autre chose", desc: "Pour la m\u00eame charge et la m\u00eame \u00e9quipe, l\u2019ordre de passage annon\u00e7ait 39 jours, le simulateur de co\u00fbt 27 et le tableau de bord 44. Trois calculs s\u00e9par\u00e9s, trois d\u00e9finitions diff\u00e9rentes d\u2019une journ\u00e9e de travail : l\u2019un retirait la pause du temps de travail, l\u2019autre la passait sous silence, le troisi\u00e8me divisait par des jours ouvr\u00e9s. Tout part d\u00e9sormais d\u2019un seul calcul. La journ\u00e9e r\u00e9gl\u00e9e est du travail effectif \u2014 la pause s\u2019ajoute \u00e0 l\u2019amplitude, elle ne se soustrait plus \u00e0 l\u2019ouvrage." },
    { emoji: 'calendrier', titre: "La fen\u00eatre des t\u00e2ches est enfin respect\u00e9e", desc: "Vous pouviez inscrire que la vendange se fait du 26 ao\u00fbt au 6 septembre : le simulateur d\u2019effectif n\u2019en tenait aucun compte et raisonnait sur la campagne enti\u00e8re. Il pouvait donc conseiller un effectif qui vendange jusqu\u2019\u00e0 fin septembre sans jamais signaler le d\u00e9bordement. Les projections se calent maintenant sur vos dates, et sur un chantier comme la vendange elles comptent tous les jours, samedi et dimanche compris." },
    { emoji: 'chrono', titre: "Le retard ne cr\u00e9e plus de journ\u00e9es de travail", desc: "Le co\u00fbt de retard \u2014 une estimation de ce que vaut une vigne travaill\u00e9e trop tard \u2014 \u00e9tait ajout\u00e9 aux heures, qui rallongeaient le chantier, qui aggravait le retard. \u00c0 une personne, le simulateur affichait 156 jours l\u00e0 o\u00f9 le travail en demande 105. Les jours affich\u00e9s sont d\u00e9sormais les vrais, et le surco\u00fbt de retard appara\u00eet \u00e0 part : une heure estim\u00e9e et une heure pay\u00e9e ne sont pas de m\u00eame nature." },
    { emoji: 'calendrier', titre: "La fin pr\u00e9vue ne part plus du jour o\u00f9 vous regardez", desc: "La date de fin se projetait \u00e0 partir du jour de consultation, m\u00eame quand les travaux ne pouvaient pas commencer avant trois semaines : fin juillet, une vendange qui d\u00e9marre le 26 ao\u00fbt s\u2019affichait avec quatre jours d\u2019avance. La projection part maintenant de l\u2019ouverture de la fen\u00eatre." },
    { emoji: 'feuille', titre: "Le Pilotage retrouve les t\u00e2ches des p\u00e9riodes au nom libre", desc: "La charge et l\u2019ETP de la campagne cherchaient encore les t\u00e2ches d\u2019apr\u00e8s le premier mot du nom de la p\u00e9riode \u2014 l\u2019ancien fonctionnement, abandonn\u00e9 partout ailleurs. Une p\u00e9riode appel\u00e9e \u00ab Campagne 2026 \u00bb ne remontait donc aucune t\u00e2che : tableau de bord vide, frise vide, aucun ETP. Le Pilotage lit maintenant la liste de t\u00e2ches que vous avez d\u00e9finie pour la p\u00e9riode." }
  ] },
  { v: '5.49', items: [
    { emoji: 'calendrier', titre: 'La frise de la campagne dit enfin la v\u00e9rit\u00e9', desc: "Les mois \u00e9crits au-dessus de la frise \u00e9taient r\u00e9partis \u00e0 parts \u00e9gales et s\u2019arr\u00eataient au quatorzi\u00e8me. Sur une campagne qui s\u2019\u00e9tale sur dix-huit mois, l\u2019\u00e9chelle ne correspondait plus aux couleurs : une p\u00e9riode ouverte le 1er mars se lisait sous le libell\u00e9 de mai, et les derniers mois manquaient tout simplement. Chaque mois est d\u00e9sormais pos\u00e9 \u00e0 sa vraie place, avec un trait par mois et l\u2019ann\u00e9e rappel\u00e9e sur chaque janvier \u2014 sur une campagne \u00e0 cheval sur deux ann\u00e9es, deux \u00ab oct \u00bb ne se ressemblaient que trop." },
    { emoji: 'etincelles', titre: 'R\u00e9glages ne garde que les p\u00e9riodes qui servent', desc: "\u00c0 raison de quatre \u00e0 six p\u00e9riodes par an, la liste et la frise devenaient illisibles au bout de deux campagnes \u2014 et vous y cherchiez la p\u00e9riode en cours au milieu de celles d\u2019il y a deux ans. R\u00e9glages \u203a Campagne n\u2019affiche plus que les dix-huit derniers mois, plus tout ce qui est en cours ou \u00e0 venir. Rien n\u2019est supprim\u00e9 : un lien sous la liste emm\u00e8ne vers les archives. La p\u00e9riode active et celle que vous consultez restent visibles quoi qu\u2019il arrive." },
    { emoji: 'dossier', titre: 'Archives des campagnes', desc: "Le Pilotage gagne un onglet \u00ab Archives \u00bb. Toutes vos campagnes y sont empil\u00e9es sur un m\u00eame axe, du 1er ao\u00fbt au 31 juillet \u2014 de r\u00e9colte \u00e0 r\u00e9colte, pour que l\u2019hiver ne soit pas coup\u00e9 en deux par le 31 d\u00e9cembre. D\u2019une ligne \u00e0 l\u2019autre se lit le d\u00e9calage des travaux : est-ce qu\u2019on s\u2019y est pris plus t\u00f4t cette ann\u00e9e ? Les heures affich\u00e9es viennent des instantan\u00e9s pris \u00e0 la cl\u00f4ture de chaque campagne. La comparaison de deux saisons, jusqu\u2019ici cach\u00e9e derri\u00e8re un bouton des R\u00e9glages, a d\u00e9m\u00e9nag\u00e9 ici \u2014 et elle refonctionne quel que soit le nom de vos p\u00e9riodes : elle les rapproche par leur place dans l\u2019ann\u00e9e, plus par leur intitul\u00e9." }
  ] },
  { v: '5.48', items: [
    { emoji: 'epingle', titre: "L\u2019en-t\u00eate de chaque module reste en place", desc: "D\u00e8s qu\u2019on faisait d\u00e9filer un \u00e9cran, le bandeau du module partait vers le haut : le nom de la p\u00e9riode consult\u00e9e, les onglets et l\u2019aide disparaissaient, et il fallait remonter tout en haut rien que pour changer d\u2019onglet. L\u2019en-t\u00eate reste d\u00e9sormais fixe \u2014 seul le contenu d\u00e9file dessous. Deux g\u00eanes du m\u00eame ordre disparaissent avec lui : le bouton \uFF0B ne d\u00e9rive plus avec la liste, et l\u2019\u00e9cran ne peut plus glisser de travers apr\u00e8s un changement de module." }
  ] },
  { v: '5.47', items: [
    { emoji: 'nuage', titre: 'La m\u00e9t\u00e9o revient en haut de l\u2019Accueil', desc: "Le temps qu\u2019il fait \u00e9tait calcul\u00e9 et tenu \u00e0 jour, mais plus rien ne l\u2019affichait en haut de l\u2019\u00e9cran : il fallait descendre jusqu\u2019\u00e0 la carte m\u00e9t\u00e9o pour le voir. La pastille est de retour sur la ligne de la p\u00e9riode \u2014 temp\u00e9rature et vent, d\u2019un coup d\u2019\u0153il, d\u00e8s l\u2019ouverture. Hors ligne, elle affiche la derni\u00e8re valeur connue en plus p\u00e2le." },
    { emoji: 'oeil', titre: 'La date de l\u2019en-t\u00eate \u00e9tait devenue illisible', desc: "Sur l\u2019Accueil, les Parcelles et le Journal, la date affich\u00e9e \u00e0 c\u00f4t\u00e9 de la p\u00e9riode \u00e9tait rest\u00e9e gris fonc\u00e9 sur le bandeau sombre \u2014 un reliquat d\u2019une ancienne version o\u00f9 ce bandeau \u00e9tait clair. Elle se lisait \u00e0 2,95 contre 4,5 exig\u00e9s. C\u2019est corrig\u00e9 sur les trois \u00e9crans." }
  ] },
  { v: '5.46', items: [
    { emoji: 'calendrier', titre: 'Votre ann\u00e9e se d\u00e9coupe comme vous la travaillez', desc: "L\u2019application imposait quatre saisons \u2014 Hiver, Printemps, \u00c9t\u00e9, Automne \u2014 et d\u00e9duisait les travaux \u00e0 faire du premier mot du nom de la saison. Un domaine qui parle d\u2019une saison de taille et d\u2019une saison verte, ou qui nomme sa campagne autrement, se retrouvait avec un \u00e9cran vide sans comprendre pourquoi. Ce d\u00e9coupage dispara\u00eet. Vous cr\u00e9ez d\u00e9sormais des p\u00e9riodes : un nom libre, une date de d\u00e9but, une date de fin, et la liste des travaux qui s\u2019y font. Deux p\u00e9riodes, quatre, ou six : c\u2019est le v\u00f4tre. R\u00e9glages \u203a Domaine \u203a Campagne." },
    { emoji: 'calendrier', titre: 'La frise de la campagne', desc: "En haut des R\u00e9glages, une frise montre l\u2019ann\u00e9e enti\u00e8re : vos p\u00e9riodes en couleur, le trait du jour, et surtout ce qui manque. Un intervalle que plus aucune p\u00e9riode ne couvre appara\u00eet hachur\u00e9 avec ses dates \u2014 une saisie tomb\u00e9e l\u00e0 ne se rattache \u00e0 rien. Deux p\u00e9riodes qui se recouvrent sont cercl\u00e9es de rouge, avec la r\u00e8gle appliqu\u00e9e \u00e9crite en clair. Une p\u00e9riode se renomme sans rien perdre : l\u2019avancement d\u00e9j\u00e0 enregistr\u00e9 la suit." },
    { emoji: 'journal', titre: 'Le journal ne masque plus aucune t\u00e2che', desc: "La liste des t\u00e2ches du journal suivait la saison en cours : une taille dat\u00e9e de f\u00e9vrier \u00e9tait tout simplement introuvable pendant la saison verte. Elle suit maintenant la <b>date que vous saisissez</b>. Les travaux de la p\u00e9riode qui contient cette date arrivent en t\u00eate, tous les autres restent accessibles juste en dessous. Plus rien n\u2019est cach\u00e9." }
  ] },
  { v: '5.45', items: [
    { emoji: 'eclair', titre: 'Une aide sur chaque \u00e9cran', desc: "L\u2019aide et le signalement d\u2019un probl\u00e8me n\u2019existaient qu\u2019au fond des R\u00e9glages : personne n\u2019allait les y chercher depuis le module o\u00f9 le doute venait de na\u00eetre. Chaque \u00e9cran porte d\u00e9sormais une pastille \u00ab ? Aide \u00bb, \u00e0 droite de la ligne de la saison. Elle ouvre l\u2019essentiel du module en quelques lignes \u2014 ce que font les onglets, ce qui se calcule tout seul, ce qui est r\u00e9serv\u00e9 aux administrateurs \u2014 avec le guide complet \u00e0 un geste, et le signalement d\u2019un probl\u00e8me juste \u00e0 c\u00f4t\u00e9. Le signalement part avec l\u2019\u00e9cran depuis lequel il a \u00e9t\u00e9 envoy\u00e9 : plus besoin de raconter o\u00f9 vous \u00e9tiez." }
  ] },
  { v: '5.44', items: [
    { emoji: 'euro', titre: 'Le co\u00fbt d\u2019une parcelle, en euros comme \u00e0 l\u2019hectare', desc: "Le tableau Pilotage \u203a \u00c9conomie n\u2019affichait qu\u2019un co\u00fbt \u00e0 l\u2019hectare. Comme le budget d\u2019une saison se calcule justement en heures par hectare, ce chiffre \u00e9tait rigoureusement le m\u00eame sur toutes les parcelles : rien \u00e0 y comparer. Chaque ligne porte d\u00e9sormais les deux montants \u2014 ce que co\u00fbte la parcelle enti\u00e8re, et ce qu\u2019elle co\u00fbte \u00e0 l\u2019hectare \u2014 et un bouton choisit lequel s\u2019affiche en grand et sert au tri. Le total dit o\u00f9 part l\u2019argent ; l\u2019hectare dit ce qu\u2019une parcelle a de particulier : des plants \u00e0 remplacer, une t\u00e2che en plus, davantage de r\u00e9parations." },
    { emoji: 'outil', titre: 'La plantation se compte au plant, plus \u00e0 l\u2019hectare', desc: "L\u2019entreplantation se mesure au nombre de trous faits \u00e0 la tari\u00e8re. Le tableau des co\u00fbts, lui, appliquait une estimation de quinze heures par hectare \u00e0 toutes les parcelles, y compris celles o\u00f9 il n\u2019y a rien \u00e0 replanter \u2014 pendant que l\u2019avancement des travaux, au m\u00eame moment, comptait bien z\u00e9ro. C\u2019est corrig\u00e9 : sans trou renseign\u00e9, aucune heure n\u2019est compt\u00e9e. L\u00e0 o\u00f9 il y en a, la ligne de la parcelle affiche le nombre de plants et ce qu\u2019ils co\u00fbtent, avec le prix d\u2019un plant rappel\u00e9 en haut du tableau. Vos co\u00fbts vont baisser : ils sont simplement devenus justes." },
    { emoji: 'liste', titre: 'Ajouter une t\u00e2che : les deux chemins c\u00f4te \u00e0 c\u00f4te', desc: "Le bar\u00e8me de la convention \u00e9tait un bandeau en t\u00eate de la liste des t\u00e2ches, le bouton de cr\u00e9ation tout en bas : deux gestes \u00e9loign\u00e9s pour une m\u00eame intention. Ils sont maintenant r\u00e9unis sous la liste, dans R\u00e9glages \u203a Vigne. \u00ab Nouvelle t\u00e2che selon le bar\u00e8me de la convention \u00bb part des travaux officiels et de leurs heures de r\u00e9f\u00e9rence ; \u00ab Nouvelle t\u00e2che libre \u00bb cr\u00e9e la v\u00f4tre de bout en bout." }
  ] },
  { v: '5.43', items: [
    { emoji: 'oeil', titre: 'Chaque personne ne voit que ses modules', desc: "La barre du bas proposait les m\u00eames modules \u00e0 toute l\u2019\u00e9quipe. Vous pouvez d\u00e9sormais masquer, personne par personne, ceux qui ne la concernent pas \u2014 dans R\u00e9glages \u203a \u00c9quipe, en ouvrant sa fiche : un caviste n\u2019a que faire de l\u2019avancement des vignes, un ouvrier n\u2019a rien \u00e0 faire dans la cave. Quatre boutons posent une combinaison courante d\u2019un seul geste, Tout \u00b7 Vigne \u00b7 Tracteur \u00b7 Cave, et vous ajustez ensuite case par case. Le changement s\u2019applique \u00e0 la prochaine ouverture de la personne concern\u00e9e. Il s\u2019agit d\u2019all\u00e9ger l\u2019\u00e9cran, pas de prot\u00e9ger une donn\u00e9e\u202f: ce sont les r\u00f4les qui d\u00e9cident de ce que chacun peut modifier, et les R\u00e9glages restent accessibles \u00e0 tous." }
  ] },
  { v: '5.42', items: [
    { emoji: 'calculatrice', titre: 'Vos heures report\u00e9es comptent enfin dans le compteur', desc: "Le solde de d\u00e9part \u2014 les heures acquises avant Ma Vigne, que vous saisissez une fois par salari\u00e9 \u2014 s\u2019affichait bien dans la fiche, mais le compteur l\u2019ignorait : impossible de payer ou de faire r\u00e9cup\u00e9rer ces heures-l\u00e0. Un salari\u00e9 arriv\u00e9 avec quarante heures en r\u00e9serve, et sans heure suppl\u00e9mentaire depuis, se voyait refuser toute saisie de paiement sans la moindre explication. Ce report est d\u00e9sormais la ligne la plus ancienne du compteur : c\u2019est lui qui part en premier quand une heure est r\u00e9cup\u00e9r\u00e9e ou pay\u00e9e. Cons\u00e9quence visible dans la fiche salari\u00e9 : le \u00ab Compteur \u00bb et le solde net de l\u2019ann\u00e9e affichent maintenant le m\u00eame chiffre." },
    { emoji: 'document', titre: 'Le nombre de jours travaill\u00e9s sur le relev\u00e9 d\u2019heures', desc: "Le relev\u00e9 PDF d\u2019un salari\u00e9 indique maintenant, \u00e0 c\u00f4t\u00e9 des heures, le nombre de jours r\u00e9ellement travaill\u00e9s dans le mois \u2014 le chiffre que r\u00e9clame la MSA pour les saisonniers. Un jour compte d\u00e8s qu\u2019il a \u00e9t\u00e9 travaill\u00e9, quelle que soit sa dur\u00e9e ; les cong\u00e9s, les r\u00e9cup\u00e9rations et les absences n\u2019en sont pas. Un samedi ou un jour f\u00e9ri\u00e9 r\u00e9ellement travaill\u00e9 compte, lui, normalement." },
    { emoji: 'liste', titre: 'Le bar\u00e8me de la convention, et vos t\u00e2ches rattach\u00e9es', desc: "Les travaux de la vigne et leurs heures \u00e0 l\u2019hectare de r\u00e9f\u00e9rence se consultent d\u00e9sormais depuis R\u00e9glages \u203a Saisons, en haut de la liste des t\u00e2ches : le cycle complet, les travaux compl\u00e9mentaires, et pour chacun les t\u00e2ches de votre domaine qui s\u2019y rattachent. Surtout, une t\u00e2che que vous aviez cr\u00e9\u00e9e vous-m\u00eame portait la mention \u00ab Hors convention \u00bb sans aucun recours. Touchez cette mention : vous choisissez le travail conventionnel auquel elle correspond. Votre t\u00e2che garde son nom, ses saisons et ses heures \u00e0 l\u2019hectare \u2014 le rattachement sert de rep\u00e8re, il ne la remplace pas." }
  ] },
  { v: '5.41', items: [
    { emoji: 'chrono', titre: 'Vos heures se comptent maintenant \u00e0 l\u2019ann\u00e9e', desc: "L\u2019onglet \u00ab H. sup \u00bb de la fiche salari\u00e9 devient \u00ab Compteur \u00bb. Il raisonnait mois par mois, avec des heures qui disparaissaient au bout de trois mois. Le d\u00e9compte suit d\u00e9sormais l\u2019ann\u00e9e compl\u00e8te : un plafond annuel \u2014 1607 heures pour un temps plein, proratis\u00e9 pour un contrat plus court \u2014 et le cumul des heures r\u00e9ellement travaill\u00e9es en face. Plus rien ne p\u00e9rime en cours d\u2019ann\u00e9e, le solde se r\u00e8gle \u00e0 la cl\u00f4ture du 31 d\u00e9cembre. Une seconde jauge suit les heures faites au-del\u00e0 de 35 heures dans une semaine, face au plafond de 250 heures par an de l\u2019accord agricole. Le d\u00e9tail mois par mois reste \u00e0 sa place, \u00e0 l\u2019\u00e9cran comme sur le relev\u00e9 PDF." },
    { emoji: 'soleil', titre: 'Un jour de cong\u00e9 n\u2019est plus une heure travaill\u00e9e', desc: "La journ\u00e9e reste pay\u00e9e exactement comme avant, rien ne change sur la paie. En revanche elle ne compte plus comme du temps de travail dans les compteurs \u2014 c\u2019est la r\u00e8gle. Une semaine avec un jour de cong\u00e9 ne peut donc plus d\u00e9clencher une alerte de d\u00e9passement, et les cong\u00e9s ne remplissent plus le compteur annuel, puisque les 1607 heures sont d\u00e9j\u00e0 calcul\u00e9es cong\u00e9s d\u00e9duits. Vous verrez des totaux plus bas qu\u2019avant sur le cadre l\u00e9gal : ce sont les bons." },
    { emoji: 'pansement', titre: 'Chaque absence a maintenant son motif', desc: "Une absence se notait par une case et un commentaire libre. Elle se choisit d\u00e9sormais parmi sept motifs, et chacun affiche son effet en clair au moment o\u00f9 vous le s\u00e9lectionnez. Un arr\u00eat de travail abaisse le plafond annuel du salari\u00e9 : ses heures ne sont pas \u00e0 rattraper. Une formation compte comme du travail effectif. Un retard se saisit en heures et non en journ\u00e9e. Vos absences d\u00e9j\u00e0 enregistr\u00e9es gardent leur comportement actuel tant que vous ne leur donnez pas de motif." },
    { emoji: 'soleil', titre: 'Le solde de cong\u00e9s suit votre p\u00e9riode de r\u00e9f\u00e9rence', desc: "Le compteur de jours pris additionnait tous les cong\u00e9s jamais enregistr\u00e9s, toutes ann\u00e9es confondues : un salari\u00e9 pr\u00e9sent depuis deux ans voyait un solde faux. Il se limite maintenant \u00e0 la p\u00e9riode en cours, du 1er juin au 31 mai. Si la v\u00f4tre suit l\u2019ann\u00e9e civile, cela se r\u00e8gle dans la fiche salari\u00e9, onglet Cong\u00e9s." },
    { emoji: 'engrenage', titre: 'Les r\u00e8gles de votre domaine', desc: "Ce que deviennent les heures faites au-del\u00e0 du planning du mois \u2014 pay\u00e9es en acompte, r\u00e9cup\u00e9r\u00e9es en repos, ou report\u00e9es \u00e0 la cl\u00f4ture \u2014 se choisit dans Planning \u203a Le cadre, avec la dur\u00e9e annuelle et le plafond de modulation si votre accord en fixe d\u2019autres." }
  ] },
  { v: '5.40', items: [
    { emoji: 'boussole', titre: 'Une seule façon de naviguer, partout', desc: "Chaque module était construit à sa manière : les onglets tantôt en haut, tantôt en bas, des en-têtes de hauteurs différentes, des piles de boutons qui variaient d'un écran à l'autre. Tout suit désormais la même anatomie : le nom du module et la saison en haut, les onglets juste en dessous — toujours au même endroit, toujours de la même hauteur — puis les chiffres clés, puis le contenu. Vous n'avez plus à réapprendre chaque écran : ce que vous savez faire dans un module se retrouve à l'identique dans les autres. Rien n'a changé dans vos données ni dans vos réglages." },
    { emoji: 'eprouvette', titre: 'Le phyto a son propre module', desc: "Le registre des traitements et le catalogue E-Phy étaient cachés dans un onglet du module Tracteur, ce qui n'allait pas de soi quand on cherchait simplement à noter une pulvérisation. Le phyto devient un module à part entière, avec son entrée dédiée dans la barre du bas. Registre et catalogue sont maintenant deux onglets en haut de l'écran, et le bouton « nouveau traitement » est le gros bouton rond en bas à droite, comme ailleurs. Le Tracteur, lui, se concentre sur ce qu'il fait de mieux : les sessions et l'entretien." },
    { emoji: 'verre', titre: 'La Cave va droit au but', desc: "Il fallait d'abord passer par un écran de sélection pour choisir entre « Vendange » et « Élevage » avant d'atteindre quoi que ce soit. Cet écran disparaît : Le Chai et Le Cuvier sont devenus deux onglets, vous arrivez directement dans le chai. Au passage, un défaut d'affichage est corrigé — deux en-têtes se superposaient, affichant deux fois le nom du domaine et deux fois la date." },
    { emoji: 'graphique', titre: 'Le Pilotage passe de neuf onglets à cinq', desc: "Neuf onglets, c'était trop pour s'y retrouver. « Personnel » et « Matériel » n'en font plus qu'un, « Économie » et « Conformité » également, et les deux écrans que l'on ouvre rarement — la simulation et le paramétrage — se rangent derrière un bouton « Outils » en bout de barre. L'onglet sur lequel vous étiez resté et les indicateurs que vous aviez décochés sont conservés." }
  ] },
  { v: '5.39', items: [
    { emoji: 'euro', titre: 'Un taux horaire par salari\u00e9', desc: "Le co\u00fbt du travail ne se r\u00e8gle plus par cat\u00e9gorie de contrat mais personne par personne. Ouvrez la fiche d\u2019un salari\u00e9 dans R\u00e9glages \u203a \u00c9quipe : un champ \u00ab Taux horaire charg\u00e9 \u00bb y attend son co\u00fbt employeur r\u00e9el, \u00e0 renseigner \u00e0 l\u2019embauche ou plus tard, et \u00e0 modifier d\u2019un geste en cas d\u2019augmentation \u2014 l\u2019application garde la trace du changement. Le co\u00fbt \u00e0 l\u2019hectare du tableau de bord Pilotage s\u2019appuie d\u00e9sormais sur ces taux r\u00e9els. Ces montants vivent dans un espace \u00e0 part, lisible des seuls administrateurs : aucun salari\u00e9 ne peut voir la r\u00e9mun\u00e9ration d\u2019un coll\u00e8gue." },
    { emoji: 'barrique', titre: 'Le prix du GNR se note \u00e0 la livraison', desc: "Nouvelle action \u00ab Appoint de cuve \u00bb dans Tracteur \u203a Entretien : \u00e0 chaque remplissage de la cuve du domaine, indiquez les litres livr\u00e9s, le prix au litre, la date et le fournisseur. Le niveau de la cuve remonte automatiquement et le prix du carburant se met \u00e0 jour tout seul \u2014 en moyenne pond\u00e9r\u00e9e sur vos appoints, donc au plus pr\u00e8s de ce que vous payez vraiment. Fini le prix du GNR \u00e0 saisir \u00e0 la main dans les r\u00e9glages : il se note l\u00e0 o\u00f9 vous avez la facture sous les yeux. R\u00e9serv\u00e9 \u00e0 l\u2019administrateur." },
    { emoji: 'tracteur', titre: 'Un onglet Tracteur dans les R\u00e9glages', desc: "Le parc de tracteurs et les activit\u00e9s tracteur \u00e9taient rang\u00e9s dans l\u2019onglet \u00ab \u00c9quipe \u00bb, o\u00f9 personne ne pensait \u00e0 les chercher. Ils ont maintenant leur propre onglet \u00ab Tracteur \u00bb." }
  ] },
  { v: '5.38', items: [
    { emoji: 'euro', titre: 'Le coût de chaque parcelle, en euros', desc: "Le tableau de bord Pilotage gagne un onglet « Économie ». Pour chaque parcelle, il affiche son coût à l’hectare : la main-d’œuvre (heures de vigne au barème + heures de tracteur réalisées, à votre taux horaire), le carburant GNR estimé, et les produits phyto. Les parcelles sont classées de la plus coûteuse à la moins coûteuse — de quoi repérer d’un coup d’œil celles qui pèsent le plus. Pour l’activer, renseignez dans Réglages › Domaine un taux horaire par type de contrat et le prix du litre de GNR. Le coût phyto se calcule tout seul à partir des doses de vos traitements et du prix unitaire des intrants saisi dans La Réserve. En lecture seule, réservé aux profils administrateur et pilotage." },
    { emoji: 'bouclier', titre: 'Votre conformité réglementaire en direct', desc: "Toujours dans Pilotage, un onglet « Conformité » réunit trois suivis longtemps calculés en coulisse, enfin visibles au même endroit. Le cuivre : le cumul de cuivre métal sur 7 ans de chaque parcelle face au plafond bio de 28 kg/ha, avec un code couleur qui signale les dépassements. Les passages phyto : le nombre d’interventions par parcelle sur la saison, comparé à une référence régionale que vous ajustez dans Réglages. Et le délai de rentrée (DRE) : après un traitement, les parcelles où l’entrée reste interdite, avec l’heure exacte à laquelle elles redeviennent accessibles." }
  ] },
  { v: '5.37', items: [
    { emoji: 'loupe', titre: 'Lire plus facilement, même en plein soleil', desc: "Deux améliorations pour la lisibilité en extérieur. D'abord, le pincer-pour-zoomer est réactivé partout dans l'application : écartez deux doigts pour agrandir un petit texte, un tableau ou la carte — rien n'est verrouillé, c'est vous qui choisissez la taille. Ensuite, le mode « Plein soleil » (contraste renforcé pour l'extérieur) retrouve son accès dans Réglages › Application, d'un simple appui." },
    { emoji: 'nombre', titre: 'Les fenêtres se ferment au clavier', desc: "Sur ordinateur, la touche Échap referme n'importe quelle fenêtre ouverte ; le focus reste à l'intérieur de la fenêtre (fini le saut inattendu vers l'arrière-plan) puis revient à sa place à la fermeture. Les lecteurs d'écran annoncent désormais correctement l'ouverture d'une fenêtre." },
    { emoji: 'eclair', titre: 'Des écrans plus rapides', desc: "L'application démarre plus vite : la carte n'est plus chargée qu'au moment où vous l'ouvrez (Parcelles ou Pilotage), au lieu de peser sur chaque démarrage — y compris l'écran de connexion. Et pendant qu'un module se remplit, une trame de chargement remplace l'écran blanc, pour une attente plus douce." },
    { emoji: 'doigt', titre: 'Mieux installée sur votre téléphone', desc: "Quelques réglages internes améliorent le comportement de Ma Vigne quand elle est installée sur l'écran d'accueil de votre téléphone, et renforcent la redirection vers le domaine officiel de l'application." }
  ] },
  { v: '5.36', items: [
    { emoji: 'microscope', titre: 'Suivre la maturité du raisin, parcelle par parcelle', desc: "Un nouvel onglet « Analyses » ouvre la marche dans Cave › Vendange (Le Cuvier). Avant les vendanges, relevez la maturité de chaque parcelle : saisissez au choix le sucre en g/L ou le degré potentiel en %vol — l'application convertit l'un en l'autre (degré = sucre ÷ 16,83) et affiche l'estimation alcoolique en direct. Chaque parcelle conserve l'historique de ses mesures et trace sa courbe d'évolution, pour choisir le meilleur moment de récolte d'un coup d'œil. Au passage, les onglets du Cuvier suivent désormais l'ordre du travail : Analyses, Récoltes, puis Cuvier." },
    { emoji: 'bouteille', titre: 'Mettre vos cuvées en bouteille', desc: "Le Chai (Cave › Élevage) gagne un onglet « Bouteilles ». Quand une cuvée est prête, l'application propose un nombre de bouteilles calculé sur le volume élevé — ajustable au chiffre réel —, puis la cuvée quitte le chai et rejoint votre stock. Ce stock s'archive par millésime, avec le nombre exact de bouteilles par cuvée, modifiable à tout moment. Et pour chaque cuvée embouteillée, un graphique retrace la perte de volume tout au long de la chaîne — de la récolte à la cuve, puis à l'élevage et enfin à la bouteille — dès que ces étapes sont renseignées." },
    { emoji: 'dossier', titre: 'Trier vos cuvées par millésime', desc: "Quand plusieurs millésimes cohabitent dans le chai, des filtres apparaissent au-dessus de vos cuvées : d'un geste, n'affichez que le dernier millésime, un plus ancien, ou l'ensemble." }
  ] },
  { v: '5.35', items: [
    { emoji: 'document', titre: 'Votre contrat rempli et signé, à télécharger', desc: "Quand vous acceptez les CGU et le DPA à la première ouverture de votre domaine, vos deux documents se remplissent désormais automatiquement avec les coordonnées de votre exploitation — raison sociale, SIRET, adresse et signataire. L’écran de fin vous propose de télécharger l’exemplaire signé de chacun (date, référence et empreinte de sécurité SHA-256), que vous retrouvez à tout moment dans Réglages › CGU & Mentions légales, avec un bouton « Imprimer / Enregistrer en PDF ». Et avant de signer, les liens « Lire » affichent désormais un aperçu déjà rempli à vos informations." }
  ] },
  { v: '5.34', items: [
    { emoji: 'carton', titre: 'La Réserve : vos fûts et vos stocks d’intrants', desc: "Un nouveau module « La Réserve » fait son entrée dans la barre du bas. Il réunit l’inventaire de vos fûts — fournisseur, référence, millésime et quantité, avec des listes déroulantes qui se remplissent au fil de vos saisies — et le suivi du stock de vos intrants (phyto et œno). Enregistrez vos achats et votre inventaire d’ouverture, et l’application calcule toute seule ce qu’il vous reste : entrées − consommé = stock. Pour l’œno, le consommé se déduit directement des opérations de la cave ; pour le phyto, du registre. Nouveauté : les intrants phyto se choisissent directement dans le catalogue officiel E-Phy (ANSES), leur numéro d’AMM conservé pour le contrôle. Un bilan matière prêt à présenter au contrôle bio (règlement UE 2021/771) est exportable en PDF." }
  ] },
  { v: '5.33', items: [] },
  { v: '5.32', items: [
    { emoji: 'cle', titre: 'Chacun son mot de passe', desc: "Jusqu\u2019ici tous les comptes partageaient le m\u00eame mot de passe, et le bouton \u00ab Changer mon mot de passe \u00bb ne fonctionnait pas \u2014 impossible d\u2019en sortir, m\u00eame en le voulant. C\u2019est corrig\u00e9. Chaque nouveau compte re\u00e7oit d\u00e9sormais un mot de passe unique et facile \u00e0 dire (par exemple \u00ab cave-rouge-427 \u00bb), affich\u00e9 une seule fois \u00e0 l\u2019administrateur au moment de la cr\u00e9ation. La personne le tape \u00e0 sa premi\u00e8re connexion, choisit imm\u00e9diatement le sien, et personne d\u2019autre ne le conna\u00eet \u2014 pas m\u00eame son responsable." },
    { emoji: 'rotation', titre: 'D\u00e9panner quelqu\u2019un qui a oubli\u00e9 le sien', desc: "Sur la fiche d\u2019un membre (R\u00e9glages \u203a Membres), un bouton \u00ab R\u00e9initialiser le mot de passe \u00bb g\u00e9n\u00e8re un nouveau mot de passe provisoire, affich\u00e9 une seule fois. Vous le communiquez \u00e0 la personne, qui choisit le sien \u00e0 la connexion suivante. Aucune adresse e-mail n\u2019est n\u00e9cessaire \u2014 pratique pour les saisonniers, qui n\u2019en ont pas. Les administrateurs, eux, doivent avoir une vraie adresse : c\u2019est leur seul moyen de r\u00e9cup\u00e9rer leur acc\u00e8s, puisque personne n\u2019est au-dessus d\u2019eux pour les d\u00e9panner." }
  ] },
  { v: '5.31', items: [
    { emoji: 'balance', titre: 'Des en-t\u00eates enfin align\u00e9s', desc: "Le bandeau sombre du haut a d\u00e9sormais exactement la m\u00eame hauteur sur tous les modules \u2014 Vigne, Tracteur, Cave, Planning, R\u00e9glages : plus aucun saut en passant de l\u2019un \u00e0 l\u2019autre, et le titre d\u00e9marre toujours au m\u00eame endroit. Le rappel \u00ab Ma Vigne \u00bb, qui n\u2019apparaissait que sur les pages Vigne et cr\u00e9ait le d\u00e9calage, laisse la place au contenu. En \u00e9change, la barre \u00ab saison \u00b7 date \u00bb descend sur tous les modules : vous savez en permanence quelle saison vous consultez, o\u00f9 que vous soyez dans l\u2019application. Cave et Le Chai gagnent leur tuile d\u2019ic\u00f4ne et voient leurs boutons regroup\u00e9s \u00e0 droite, comme partout ailleurs." }
  ] },
  { v: '5.30', items: [
    { emoji: 'etincelles', titre: 'Interface repens\u00e9e', desc: "Toute l\u2019application parle d\u00e9sormais le m\u00eame langage visuel. Les en-t\u00eates de chaque module \u2014 Vigne, Parcelles, Journal, Tracteur, Cave, Planning, Pilotage, R\u00e9glages \u2014 ont maintenant exactement la m\u00eame hauteur : plus de d\u00e9calage en passant de l\u2019un \u00e0 l\u2019autre. Chacun est soulign\u00e9 du m\u00eame filet terre \u2192 or \u2192 vert et porte son ic\u00f4ne dans une tuile aux couleurs du module. Les compteurs qui vivaient dans le bandeau sombre sont descendus sur des cartes claires, plus lisibles en plein soleil. Les listes \u2014 parcelles, journal, sessions tracteur \u2014 adoptent la carte \u00ab papier \u00bb : une bande de couleur sur le c\u00f4t\u00e9 donne l\u2019\u00e9tat d\u2019un coup d\u2019\u0153il, vert termin\u00e9, or bien avanc\u00e9, rouge en retard. Les noms de parcelles, de cuv\u00e9es et d\u2019activit\u00e9s passent en Cormorant, et les jauges, plus \u00e9paisses, se remplissent en douceur \u00e0 l\u2019ouverture. Au passage, plusieurs textes trop p\u00e2les pour \u00eatre lus \u2014 badges \u00ab Valid\u00e9 \u00bb, \u00ab S\u00e9lectionner une section \u00bb \u2014 ont retrouv\u00e9 un contraste correct." }
  ] },
  { v: '5.29', items: [] },
  { v: '5.28', items: [] },
  { v: '5.27', items: [] },
  { v: '5.26', items: [] },
  { v: '5.25', items: [
    { emoji: 'soleil', titre: 'Poser des congés sur une période', desc: "Dans Planning › Outils, un nouvel outil « Poser des congés » permet de poser des CP sur toute une période en une fois, pour un ou plusieurs salariés à la fois — pratique quand l’équipe part en même temps. Choisissez les dates de début et de fin, cochez les salariés concernés, et l’aperçu vous montre le nombre de jours décomptés pour chacun (selon votre mode de décompte, jours ouvrables ou ouvrés). Les dimanches et jours fériés ne sont jamais décomptés. Un bouton « Retirer » efface les congés de la période si besoin." }
  ] },
  { v: '5.24', items: [
    { emoji: 'chrono', titre: 'Chronométrer le temps de travail au tracteur', desc: "Dans une session tracteur, vous pouvez désormais mesurer le temps réel passé, parcelle par parcelle. Démarrez le chrono, cochez les parcelles pendant qu’il tourne (elles se partagent le temps, réparti à la surface), mettez en pause au besoin, puis arrêtez : chaque parcelle reçoit son temps mesuré. C’est optionnel — sans chrono, le barème habituel s’applique — et à activer dans Réglages › Activités tracteur. L’avancement d’une session reste calculé en hectares ; le temps mesuré alimente en plus le Rapport de saison et le Pilotage, au plus près du terrain." }
  ] },
  { v: '5.23', items: [
    { emoji: 'raisin', titre: 'Le Cuvier : les vendanges de A à Z', desc: "L’onglet Cave › Vendange fait peau neuve. Pesez vos récoltes en caisses (le poids se convertit en kilos et en hectolitres estimés selon votre rendement), suivez chaque cuve de vinification avec sa courbe de fermentation, et enregistrez vos opérations : chaptalisation — le nombre de kilos de sucre est calculé d’après le volume et le degré visé —, refroidissement, saignée, levurage, nutriment… La densité relevée est automatiquement ramenée à 20 °C, pour un degré potentiel juste quelle que soit la température du moût." },
    { emoji: 'verre', titre: 'Vendre en vrac, ou passer la cuvée en élevage', desc: "Une parcelle part chez un client ? Indiquez-le (avec son propre poids de caisse) et la récolte est comptée en vente vrac. Et une fois la cuvaison terminée, le bouton « Décuver » crée directement la cuvée dans Le Chai avec ses barriques — le suivi d’ouillage démarre tout seul." }
  ] },
  { v: '5.22', items: [
    { emoji: 'chrono', titre: 'Modifier les heures d’un coup sur plusieurs jours', desc: "Dans la grille d’équipe, la sélection multiple permet maintenant de fixer un horaire (prise et fin de service, avec ou sans pause déjeuner) et de l’appliquer à tous les jours cochés en une seule fois. Pratique pour caler la semaine de toute l’équipe, ou une journée de vendanges un samedi. Les congés, absences et récupérations compris dans la sélection sont préservés." }
  ] },
  { v: '5.21', items: [
    { emoji: 'balance', titre: 'Rapport de saison : où va le temps de l’équipe', desc: "La section Heures du rapport montre désormais comment se répartit la présence de l’équipe : travaux vigne (au barème), tracteur et autres activités (cave, trajets, entretien…), avec l’ETP nécessaire pour chaque poste. L’avancement vigne et l’« ETP vigne » (nombre d’équivalents temps plein pour les seuls travaux de la vigne) sont mis en avant. Le tracteur reste fondu dans « autres » tant qu’aucun barème d’heures par hectare n’est renseigné." }
  ] },
  { v: '5.20', items: [
    { emoji: 'document', titre: 'Rapport de saison enrichi, au choix de la saison', desc: "Le rapport PDF de saison couvre désormais toute la campagne : avancement par tâche et par parcelle (avec dates de validation), sessions tracteur, parc et fiches d’entretien, incidents et réparations, réparations de palissage, registre phyto, conformité cuivre bio et heures/ETP. Un seul bouton dans Réglages, et vous choisissez la saison à éditer — active ou passée. Les heures de chaque saison sont désormais mémorisées séparément." }
  ] },
  { v: '5.19', items: [
    { emoji: 'pansement', titre: 'Reconstruire l’avancement d’une saison passée', desc: "Un travail validé cet hiver figure déjà dans le journal, mais l’avancement de cette saison affiche encore 0 % ? Le bouton « Reconstruire l’avancement d’après le journal » (Réglages › Saisons) reconstitue l’avancement de la saison consultée à partir des validations du journal, sur sa période. Un récapitulatif est proposé avant d’appliquer, et rien n’est jamais supprimé." },
    { emoji: 'calendrier', titre: 'Consultation de saison plus lisible', desc: "Quand vous consultez une autre saison que l’active, l’accueil, la carte d’avancement et les onglets Parcelles et Journal affichent désormais la saison consultée (et non l’active) — seule la pastille conserve la mention « consultée »." }
  ] },
  { v: '5.18', items: [
    { emoji: 'info', titre: 'Budget cuivre en direct dans le traitement', desc: "Lors d'une saisie de traitement au cuivre, l'assistant affiche pour chaque parcelle traitée le cumul de cuivre métal sur 7 ans face au plafond bio de 28 kg/ha — cumul actuel + apport de ce traitement. Un dépassement est signalé, mais n'empêche jamais l'enregistrement (le registre doit refléter la réalité). Le calcul est exactement celui de votre synthèse cuivre dans Réglages." }
  ] },
  { v: '5.17', items: [
    { emoji: 'plus', titre: 'Ajouter : session ou traitement', desc: "Le bouton ＋ de l'onglet Tracteur propose maintenant un choix — démarrer une session mécanique, ou saisir un traitement phytosanitaire (qui ouvre l'assistant réglementaire avec les produits E-Phy). Un seul point d'entrée pour les deux." }
  ] },
  { v: '5.16', items: [
    { emoji: 'tracteur', titre: 'Module Tracteur repensé', desc: "L'onglet Tracteur fait peau neuve : le chantier en cours s'affiche désormais en grande carte « live » — avancement en hectares et bouton pour enregistrer directement. Le parc devient une bande de cartes où chaque machine indique d'un coup d'œil sa prochaine révision ou son passage au garage (touchez-la pour ouvrir son entretien). L'ensemble adopte le filet doré du domaine et un accent vert sur les sessions terminées." }
  ] },
  { v: '5.15', items: [] },
  { v: '5.14', items: [] },
  { v: '5.13', items: [] },
  { v: '5.12', items: [
    { emoji: 'verre', titre: "Cave › Élevage repensé", desc: "L'onglet Cave › Élevage fait peau neuve. Un en-tête « Le Chai » résume l'état du chai d'un coup d'œil (cuvées, fûts, hectolitres, ouillages en retard), et chaque cuvée affiche sa jauge « part des anges » : le temps écoulé depuis le dernier ouillage face à votre seuil, du vert à l'orange puis au rouge. Les cuvées à ouiller remontent en tête de liste, avec un bouton pour lancer l'ouillage de toutes celles qui le réclament, et les gestes du quotidien (ouiller, soutirer, analyser) sont à portée directe sur chaque carte. Le journal passe en frise chronologique par mois." }
  ] },
  { v: '5.11', items: [
    { emoji: 'drapeau', titre: "Clôturer la campagne", desc: "Un bouton dans Réglages › Saisons pour terminer officiellement la campagne : bilan de l'équipe, archivage dans l'Historique, puis démarrage de la suivante. Toute l'équipe bascule ensemble et la nouvelle campagne démarre vierge (les travaux tracteur de la campagne finie restent rangés dans leur saison)." }
  ] },
  { v: '5.10', items: [
    { emoji: 'dossier', titre: "Préparer une saison à l'avance", desc: "Consultez une autre saison (l'hiver, la campagne suivante…) pour préparer vos travaux et votre pilotage — sans rien changer pour l'équipe, qui reste sur la saison active. La bascule de tous ne se fait qu'en ACTIVANT la saison. Le choix de la saison consultée est propre à chaque appareil." },
  { emoji: 'calendrier', titre: "Dates de travaux estimées", desc: "En modifiant une saison (Réglages › Saisons › ✏️), indiquez une fenêtre de dates estimée par tâche (ex. Taille : 15 janv. → 28 févr.). Elles s'affichent dans le Pilotage de la saison consultée pour anticiper la charge et les échéances." }
  ] }
];

// Comparateur de versions NUMÉRIQUE (jamais lexicographique : "5.10" > "5.9").
function _cmpVer(a, b) {
  var pa = String(a).split('.'), pb = String(b).split('.');
  var n = Math.max(pa.length, pb.length);
  for (var i = 0; i < n; i++) {
    var x = parseInt(pa[i], 10) || 0, y = parseInt(pb[i], 10) || 0;
    if (x !== y) return x - y;
  }
  return 0;
}
// Blocs à afficher : versions strictement > seen et ≤ APP_VERSION, items non vides, du plus récent au plus ancien.
function _whatsNewSince(seen) {
  return WHATS_NEW.filter(function(b) {
    return b && b.items && b.items.length && _cmpVer(b.v, seen) > 0 && _cmpVer(b.v, APP_VERSION) <= 0;
  }).sort(function(a, b) { return _cmpVer(b.v, a.v); });
}
// Le pastillon du journal des nouveautes accepte les DEUX ecritures : un EMOJI
// (les trente blocs deja ecrits, qu'on ne reecrit pas) ou un NOM D'ICONE (les
// blocs a venir). Meme regle que `_mvSetIcon`, en version « rend une chaine ».
// ⚠️ Sur : `_wnRow` s'execute a l'OUVERTURE du modal, jamais au chargement du
//   module — le sprite est donc lu et analyse depuis longtemps.
function _wnIco(v) {
  var s = String(v == null ? '' : v);
  var noms = _mvIconNoms();
  return (/^[a-z][a-z0-9-]*$/.test(s) && (!noms || noms[s])) ? _mvIcon(s, 20) : s;
}
function _wnRow(item, sep) {
  return '<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;' + sep + '">'
    + '<div style="width:32px;height:32px;background:var(--gris-clair);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px;">' + _wnIco(item.emoji) + '</div>'
    + '<div><div style="font-size:13px;font-weight:500;color:var(--texte);line-height:1.3;">' + item.titre + '</div>'
    + '<div style="font-size:11px;color:var(--texte-doux);margin-top:3px;line-height:1.5;">' + item.desc + '</div></div>'
    + '</div>';
}

let _whatsNewShown = false;
export function checkWhatsNew() {
  if (_whatsNewShown) return;
  var seen = localStorage.getItem('mavigne_last_seen_version');
  if (!seen) { try{ localStorage.setItem('mavigne_last_seen_version', APP_VERSION); }catch(e){} return; } // 1er install : pas de recap
  if (_cmpVer(seen, APP_VERSION) >= 0) return; // déjà à jour (ou downgrade)
  var blocks = _whatsNewSince(seen);
  if (!blocks.length) return; // que des versions techniques → rien à montrer, curseur inchangé
  _whatsNewShown = true;
  var multi = blocks.length > 1;
  var badge = document.getElementById('wn-version-badge');
  if (badge) badge.textContent = 'v' + APP_VERSION;
  var titleEl = document.getElementById('wn-title');
  if (titleEl) titleEl.textContent = multi ? "Tout ce qui a changé depuis votre dernière visite" : "Nouveautés de cette version";
  var container = document.getElementById('wn-items');
  if (container) {
    var html = '';
    if (multi) {
      blocks.forEach(function(b) {
        html += '<div style="display:flex;align-items:center;gap:8px;margin:14px 0 2px;">'
          + '<span style="font-size:11px;font-weight:600;color:#7A1020;background:rgba(122,16,32,0.08);border:1px solid rgba(122,16,32,0.2);border-radius:6px;padding:2px 8px;">Version ' + b.v + '</span>'
          + '<span style="flex:1;height:1px;background:rgba(0,0,0,0.06);"></span></div>';
        b.items.forEach(function(it, i) { html += _wnRow(it, i < b.items.length - 1 ? 'border-bottom:1px solid rgba(0,0,0,0.06);' : ''); });
      });
    } else {
      blocks[0].items.forEach(function(it, i) { html += _wnRow(it, i < blocks[0].items.length - 1 ? 'border-bottom:1px solid rgba(0,0,0,0.06);' : ''); });
    }
    container.innerHTML = html;
  }
  setTimeout(function() { if (window.openOv) window.openOv('ovWhatsNew'); }, 700);
}
export function dismissWhatsNew() {
  localStorage.setItem('mavigne_last_seen_version', APP_VERSION);
  if (window.closeOv) window.closeOv(null, 'ovWhatsNew');
}

// ==== CONSTANTES TENANT DEMO ====
export const DEMO_TENANT         = 'domaine-dupont';
export const DEMO_FIREBASE_EMAIL = 'demo@mavigneapp.fr';
// Compte demo : READ-ONLY sur tenant domaine-dupont uniquement (règles Firestore).
// Ce mot de passe est intentionnellement exposé dans le bundle — le compte ne peut
// que lire mavigne_domaine-dupont. Ne jamais réutiliser ce mot de passe ailleurs.
export const DEMO_FIREBASE_PWD   = 'MaVigne2026!';

// ════ CONSTANTES DISPLAY ════
// Copies locales — les modules importent depuis ici,
// les fonctions restées dans app.js utilisent leurs propres const.
export const TABREV = {
  Ebourgeonnage:'Ebourg.', Ebourgeonnage1:'Ebourg. 1', Ebourgeonnage2:'Ebourg. 2',
  Reparation:'Répar.', Plantation:'Plant.', Entreplantation:'Entrepl.',
  Arrachage:'Arrach.', Desherbage:'Désherb.', Effeuillage:'Effeuill.', Vendange:'Vend.',
  Accolage:'Accol.', Palissage:'Paliss.', Relevage:'Relev.'
};
// ⚠️ `TEMOJI` A ETE SUPPRIMEE (lot DS-2). Elle associait un emoji a chaque
//   travail et etait lue par app.js, pilotage.js et reglages.js. Partout,
//   l'emoji precedait un NOM DE TACHE deja ecrit a cote : il ne disait rien
//   de plus. `TACHE_ICO` la remplace et rend un NOM D'ICONE, pour les rares
//   endroits ou un pictogramme sert encore a quelque chose.
//   ⚠️ Ne pas la reintroduire « juste pour une liste » : c'est comme ca
//     qu'elle etait arrivee.
export const TCLS = {
  Cuivre:'tcc',Soufre:'tsc',Fongicide:'tfc',
  Insecticide:'tic',Herbicide:'thc','Biocontrôle':'tbc',
  MFSC:'tmf',Adjuvant:'tad',Mixte:'tmx','Mélange':'tml'
};
export const TEMJ = {
  Cuivre:'🔵',Soufre:'🟡',Fongicide:'🟢',
  Insecticide:'🟠',Herbicide:'🟤','Biocontrôle':'🟣',
  MFSC:'🌱',Adjuvant:'💧',Mixte:'⚗️','Mélange':'🧪'
};
export const COULEURS_MBR = {
  Nico:'#3D6B27',Victor:'#1A4A7A',Dessi:'#7A4F2E',
  Etienne:'#5B2D8E',Chloé:'#B8913A',Chloe:'#B8913A',
  Shana:'#C0392B',Alicia:'#1A5276'
};

// ════ HELPERS TÂCHES ════
export function tNom(nom) { return TABREV[nom] || nom; }

// Délai de rentrée (DRE) effectif. Deux sources, on garde le MAX :
//  - délai d'usage E-Phy (`drae`) — rarement renseigné ;
//  - délai dérivé de la classification CLP (`dreH` = 24|48, code `dreHc`),
//    calculé côté serveur (ephy.js) selon l'arrêté du 4 mai 2017.
//  Sans aucune des deux : minimum légal 6 h. MFSC/adjuvants = non soumis.
// -> { h, txt:'48 h', txtLong:'48 h — sensibilisant cutané (H317)', defaut, na, code }
function _dreMotif(code) {
  var c = String(code || '').toUpperCase();
  if (c === 'H317') return 'sensibilisant cutané';
  if (c === 'H334') return 'sensibilisant respiratoire';
  if (c === 'H315') return 'irritant cutané';
  if (c === 'H318') return 'lésions oculaires graves';
  if (c === 'H319') return 'irritation oculaire';
  if (c === 'H340' || c === 'H341') return 'mutagène';
  if (c === 'H350' || c === 'H350I' || c === 'H351') return 'cancérogène';
  if (c.indexOf('H360') === 0 || c.indexOf('H361') === 0 || c === 'H362') return 'reprotoxique';
  return 'classement CLP';
}
export function dreEffectif(drae, type, dreH, dreHc) {
  var nU = Number(drae); nU = (isFinite(nU) && nU > 0) ? nU : 0;
  var nC = Number(dreH); nC = (isFinite(nC) && nC > 0) ? nC : 0;
  var eff = nU > nC ? nU : nC;
  if (eff > 0) {
    var byCLP = (nC >= nU) && nC > 0 && !!dreHc;
    var code = byCLP ? String(dreHc).toUpperCase() : null;
    var motif = byCLP ? (_dreMotif(code) + ' (' + code + ')') : '';
    return { h: eff, txt: eff + ' h', txtLong: motif ? (eff + ' h — ' + motif) : (eff + ' h'), defaut: false, na: false, code: code };
  }
  if (type === 'MFSC' || type === 'Adjuvant') return { h: 0, txt: 'non applicable', txtLong: 'non applicable', defaut: false, na: true, code: null };
  return { h: 6, txt: '6 h (par défaut)', txtLong: '6 h (minimum légal)', defaut: true, na: false, code: null };
}

// ════ MÉTÉO — fonctions pures ════
export function wmoDesc(c) {
  const m = {
    0:'Dégagé',1:'Peu nuageux',2:'Partiellement nuageux',3:'Couvert',
    45:'Brouillard',48:'Brouillard givrant',
    51:'Bruine légère',53:'Bruine modérée',55:'Bruine forte',
    61:'Pluie légère',63:'Pluie modérée',65:'Pluie forte',
    71:'Neige légère',73:'Neige modérée',75:'Neige forte',
    80:'Averses légères',81:'Averses modérées',82:'Averses fortes',
    95:'Orage',96:'Orage avec grêle'
  };
  return m[c] || 'Variable';
}
// ⚠️ La correspondance vit dans une TABLE, pas dans une cascade de `return` :
//   des noms rendus en dur par une fonction sont invisibles au harnais, qui
//   les declarerait « symboles morts ». Une table, il sait la lire.
export const MV_METEO_IC = {
  soleil:'soleil', nuage:'nuage', brouillard:'brouillard', bruine:'bruine',
  pluie:'pluie', neige:'neige', orage:'orage'
};
export function wmoIcone(c) {
  if (c <= 2) return MV_METEO_IC.soleil;
  if (c === 3) return MV_METEO_IC.nuage;
  if (c <= 48) return MV_METEO_IC.brouillard;
  if (c <= 55) return MV_METEO_IC.bruine;
  if (c <= 65) return MV_METEO_IC.pluie;
  if (c <= 77) return MV_METEO_IC.neige;
  if (c <= 82) return MV_METEO_IC.pluie;
  return MV_METEO_IC.orage;
}

// ⚠️ REPLI, le temps que tous les appelants passent a `wmoIcone`. Un module non
//   migre qui appellerait `wmoIcone` afficherait « nuage » en toutes lettres :
//   on garde donc l'ancienne fonction telle quelle plutot que de la rediriger.
export function wmoEmoji(c) {
  if (c === 0) return '\u2600\uFE0F'; if (c <= 2) return '\u{1F324}\uFE0F'; if (c === 3) return '\u2601\uFE0F';
  if (c <= 48) return '\u{1F32B}\uFE0F'; if (c <= 65) return '\u{1F327}\uFE0F'; if (c <= 77) return '\u2744\uFE0F';
  if (c <= 82) return '\u{1F326}\uFE0F'; return '\u26C8\uFE0F';
}


// ════ BADGE DE SYNCHRONISATION ════
export function showSyncBadge(msg, color) {
  var badge = document.getElementById('sync-badge');
  if(!badge) return;
  badge.textContent = msg;
  badge.style.background = color;
  badge.style.opacity = '1';
  clearTimeout(badge._t);
  var isOffline = msg.includes('Hors ligne') || msg.includes('attente') || msg.includes('Mode hors ligne');
  var isLoading = msg.includes('Chargement') || msg.includes('Connexion') || msg.includes('Synchronisation');
  if(isLoading || isOffline) {
    badge.style.fontSize = '13px';
    badge.style.padding = '8px 18px';
  } else {
    badge.style.fontSize = '';
    badge.style.padding = '';
    badge._t = setTimeout(function(){ badge.style.opacity='0'; }, 2500);
  }
}

// ════ TOAST ════
var _toastTimer = null;
export function showToast(msg, color) {
  color = color || '#3D6B27';
  // Capture silencieuse des toasts d'erreur/alerte (accompagne un signalement)
  if (_mvSuppressToastCapture) { _mvSuppressToastCapture = false; }
  else { try { _mvCaptureToastErr(msg, color); } catch(e){} }
  var t = document.getElementById('mv-toast');
  var d = document.getElementById('mv-toast-dot');
  var m = document.getElementById('mv-toast-msg');
  if(!t) return;
  if(navigator.vibrate) navigator.vibrate(60);
  d.style.background = color;
  m.textContent = msg;
  clearTimeout(_toastTimer);
  t.classList.add('show');
  _toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 2200);
}

// ════ DARK MODE ════
export function applyTheme(mode) {
  var root = document.getElementById('app-root');
  if(!root) return;
  // ⚠⚠⚠ LE THÈME SE POSE SUR DEUX ÉLÉMENTS, PAS UN (§59).
  // #app-root est fermé avant la fin d'index.html : les overlays statiques, les
  // 37 .modal qu'ils contiennent et tous ceux posés en JS par
  // document.body.appendChild sont ses FRÈRES. Posé sur #app-root seul,
  // l'attribut ne les atteignait pas et une modale sortait BLANCHE en plein
  // mode sombre. Le poser aussi sur <html> met les 63 variables de thème à la
  // racine du document, d'où elles s'héritent partout.
  // ⚠ Les deux doivent rester D'ACCORD : <html> en sombre et #app-root en clair
  // ferait passer toute l'application en sombre, car aucun bloc ne remet les
  // variables claires sous #app-root[data-theme="light"].
  // ⚠⚠⚠ PERDU DEUX FOIS (§58, §60), et la seconde fois le document a annoncé
  // la restauration sans qu'elle ait eu lieu : app.js avait ses deux poses,
  // utils.js n'en avait qu'une, et `mv-harnais-theme` le disait. Une section
  // qui décrit un correctif n'est pas une preuve que le correctif est là.
  var html = document.documentElement;
  if(mode === 'dark') {
    root.setAttribute('data-theme', 'dark');
    if(html) html.setAttribute('data-theme', 'dark');
  } else if(mode === 'light') {
    root.setAttribute('data-theme', 'light');
    if(html) html.setAttribute('data-theme', 'light');
  } else {
    // Auto : retirer l'attribut → la media query OS prend le relais
    root.removeAttribute('data-theme');
    if(html) html.removeAttribute('data-theme');
  }
  // Mettre à jour les boutons du toggle
  ['light','auto','dark'].forEach(function(m) {
    var btn = document.getElementById('theme-btn-' + m);
    if(!btn) return;
    var isActive = (m === mode);
    btn.style.background = isActive ? 'var(--bg-card)' : 'transparent';
    btn.style.color = isActive ? 'var(--texte)' : 'var(--texte-doux)';
    btn.style.boxShadow = isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none';
  });
}
export function setThemeMode(mode) {
  try { localStorage.setItem('mavigne_theme', mode); } catch(e) {}
  applyTheme(mode);
}
export function initTheme() {
  var saved = 'auto';
  try { saved = localStorage.getItem('mavigne_theme') || 'auto'; } catch(e) {}
  applyTheme(saved);
  // Écouter les changements système en mode Auto
  if(window.matchMedia) {
    window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', function() {
      try {
        var m = localStorage.getItem('mavigne_theme') || 'auto';
        if(m === 'auto') applyTheme('auto');
      } catch(e) {}
    });
  }
}

// ════ AUTH HELPERS ════
// Utilisent window.currentUser (défini par app.js au login/logout)
export function isAdmin() {
  return !!(window.currentUser && window.currentUser.roles && window.currentUser.roles.includes('admin'));
}
export function isTractoriste() {
  return !!(window.currentUser && window.currentUser.roles && window.currentUser.roles.includes('tractoriste'));
}
export function canSeePhyto() {
  if(!window.currentUser || !window.currentUser.roles) return false;
  var r = window.currentUser.roles;
  return r.includes('admin') || r.includes('tractoriste');
}
export function isSaisonnier() {
  if(!window.currentUser || !window.currentUser.roles) return false;
  var r = window.currentUser.roles;
  return r.includes('saisonnier') && !r.includes('admin') && !r.includes('ouvrier') && !r.includes('tractoriste');
}
export function isPilotage() {
  return !!(window.currentUser && window.currentUser.roles && window.currentUser.roles.includes('pilotage'));
}
// canSeePilotage : accès au tableau de bord Pilotage (admin ou rôle pilotage)
export function canSeePilotage() {
  if(!window.currentUser || !window.currentUser.roles) return false;
  var r = window.currentUser.roles;
  return r.includes('admin') || r.includes('pilotage');
}
export function canWrite() {
  if(!window.currentUser || !window.currentUser.roles) return false;
  return isAdmin() || (window.currentUser.roles.includes('ouvrier') && !isSaisonnier());
}
export function getRoleLabel(roles) {
  if(!roles) return 'Membre';
  if(roles.includes('admin')) return 'Admin';
  var labels = [];
  if(roles.includes('tractoriste')) labels.push('Tractoriste');
  if(roles.includes('ouvrier')) labels.push('Ouvrier');
  if(roles.includes('saisonnier')) labels.push('Saisonnier');
  if(roles.includes('pilotage')) labels.push('Pilotage');
  return labels.join(' · ') || 'Membre';
}

// ════ GESTION DES ERREURS ════
// Système centralisé : logError() + intercepteurs globaux + dashboard Admin GT
var _ERR_KEY = 'mavigne_errors_v1';
var _ERR_MAX = 50;
// Expose pour admin-gt.js : la fiche client lisait window._ERR_KEY avec un repli sur
// 'mavigne_erreurs', une cle qui n'a jamais existe — la fusion des erreurs locales ne
// ramenait donc jamais rien.
window._ERR_KEY = _ERR_KEY;

// ── Remontee des erreurs vers le domaine ─────────────────────────────────────
// critical + error + warning montent dans mavigne_{slug}/error_log via
// window.fbAppendError (firebase.js) ; `info` reste strictement local.
// Deux garde-fous, sans quoi une coupure reseau dans les vignes noierait le signal
// sous des « Synchro echouee » identiques — et fbAppendError fait un getDoc + un
// setDoc a chaque appel : anti-doublon glissant, et plafond par session.
var _ERR_SEND_LVL = { critical: 1, error: 1, warning: 1 };
var _ERR_SENT     = {};      // "cat|msg" -> horodatage du dernier envoi
var _ERR_SENT_N   = 0;       // compteur de session
var _ERR_SENT_MAX = 20;
var _ERR_DEDUP_MS = 600000;  // 10 min

function _errShouldSend(entry) {
  if (!_ERR_SEND_LVL[entry.level]) return false;
  if (_ERR_SENT_N >= _ERR_SENT_MAX) return false;
  var k = entry.cat + '|' + entry.msg;
  var now = Date.now();
  if (_ERR_SENT[k] && (now - _ERR_SENT[k]) < _ERR_DEDUP_MS) return false;
  _ERR_SENT[k] = now;
  _ERR_SENT_N++;
  return true;
}

// Suppression ponctuelle de la capture (posée par logError pour éviter un doublon :
// logError écrit déjà l'entrée dans _ERR_KEY avant d'appeler showToast).
var _mvSuppressToastCapture = false;

// Couleurs de toast considérées « erreur / alerte » (rouges, oranges, ambre du code).
var _ERR_TOAST_COLORS = ['#C0392B','#B85A1A','#C09A10','#E07060','#EF4444','#F97316','#7A1020','#E5484D'];

// Capture SILENCIEUSE d'un toast d'erreur dans le journal local (_ERR_KEY), pour qu'il
// accompagne un éventuel signalement même s'il a disparu de l'écran. Aucun envoi réseau.
function _mvCaptureToastErr(msg, color) {
  var c = String(color || '').toUpperCase();
  if (_ERR_TOAST_COLORS.indexOf(c) < 0) return;
  var level = (c === '#C0392B' || c === '#EF4444' || c === '#7A1020' || c === '#E5484D') ? 'error' : 'warning';
  var clean = String(msg || '').replace(/^(?:\u26A0\uFE0F|\u26A0|\u274C|\uD83D\uDEA8|\uD83D\uDD34|\uD83D\uDFE0|\u2139\uFE0F|\u2705)\s*/, '').slice(0, 200);
  var tenant = window.TENANT_ID;
  if (!tenant) { try { tenant = localStorage.getItem('mavigne_tenant') || '?'; } catch(e) { tenant = '?'; } }
  var entry = {
    id: Date.now() + '_' + Math.random().toString(36).slice(2,6),
    ts: new Date().toISOString(),
    level: level, cat: 'ui',
    msg: clean || 'Message d\'erreur',
    detail: '(toast auto-capturé)',
    user: (window.currentUser && window.currentUser.nom) ? window.currentUser.nom : '—',
    tenant: tenant,
    page: _errCurrentPage(),
    resolved: false, _fromToast: true
  };
  try {
    var raw = localStorage.getItem(_ERR_KEY);
    var log = raw ? JSON.parse(raw) : [];
    log.unshift(entry);
    if (log.length > _ERR_MAX) log.length = _ERR_MAX;
    localStorage.setItem(_ERR_KEY, JSON.stringify(log));
  } catch(e) {}
}

function _escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// Échappe une valeur destinée à une chaîne JS simple-quotée DANS un attribut HTML
// double-quoté (ex : onclick="fn('VALEUR')"). Gère apostrophes, backslashes et
// caractères HTML. La fonction appelée reçoit la valeur d'origine intacte.
function _escAttr(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── deepClone — implémentation unique (ex-doublons firebase.js + reglages.js) ──
function deepClone(v) { return JSON.parse(JSON.stringify(v)); }

// ── Notification via SW (mobile-safe) — implémentation unique (ex-doublons reglages.js + tracteur.js) ──
function _swNotify(title, opts) {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(function(reg){ reg.showNotification(title, opts); });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, opts); } catch(e) {}
  }
}
window._swNotify = _swNotify;

function _errCurrentPage() {
  var a = document.querySelector('.page.active');
  return a ? (a.id || '').replace('page-', '') : '—';
}

export function logError(opts) {
  var level = opts.level || 'error';
  var entry = {
    id: Date.now() + '_' + Math.random().toString(36).slice(2,6),
    ts: new Date().toISOString(),
    level: level,
    cat: opts.cat || 'runtime',
    msg: opts.msg || 'Erreur inconnue',
    detail: opts.detail || '',
    user: (window.currentUser && window.currentUser.nom) ? window.currentUser.nom : '—',
    tenant: window.TENANT_ID || '?',
    page: opts.page || _errCurrentPage(),
    resolved: false
  };

  // 1. localStorage — offline-safe, prioritaire
  try {
    var raw = localStorage.getItem(_ERR_KEY);
    var log = raw ? JSON.parse(raw) : [];
    log.unshift(entry);
    if(log.length > _ERR_MAX) log.length = _ERR_MAX;
    localStorage.setItem(_ERR_KEY, JSON.stringify(log));
  } catch(e) {}

  // 2. Firebase — remontee dans le journal du domaine, lu par l'Admin GT.
  //    L'ancien chemin ecrivait dans _guerettech/errors_… : une collection reservee au
  //    compte GT par les rules (allow write: if isGtAdmin()). Toute erreur envoyee
  //    depuis un poste client y etait donc REFUSEE, et le refus tombait dans un catch
  //    vide — aucune erreur client n'est jamais remontee depuis la mise en service.
  //    window.fbAppendError (firebase.js) ecrit dans mavigne_{slug}/error_log, deja
  //    autorise par les rules et deja lu par le tableau de bord GT.
  //    Pas de test navigator.onLine : le SDK Firestore met la file de cote et la vide
  //    au retour du reseau, ce qu'on veut justement pour les erreurs de synchro.
  if(window.fbAppendError && _errShouldSend(entry)) window.fbAppendError(entry);

  // 3. Affichage utilisateur
  if(level === 'critical') {
    _showCriticalOverlay(entry);
  } else if(level === 'error') {
    _mvSuppressToastCapture = true;
    showToast('⚠️ ' + entry.msg, '#B85A1A');
  } else if(level === 'warning') {
    _mvSuppressToastCapture = true;
    showToast('⚠️ ' + entry.msg, '#C09A10');
  }
  // level === 'info' : silencieux pour l'utilisateur

  console.error('[MaVigne Error]', level.toUpperCase(), '[' + entry.cat + ']', entry.msg,
    entry.detail ? '\n' + entry.detail : '');
  return entry;
}

function _showCriticalOverlay(entry) {
  var ov = document.getElementById('mv-critical-overlay');
  if(!ov) return;
  var msgEl = document.getElementById('mce-msg');
  var detEl = document.getElementById('mce-detail');
  if(msgEl) msgEl.textContent = entry.msg;
  if(detEl) detEl.textContent = entry.detail || '';
  ov.style.display = 'flex';
}

export function _closeCriticalOverlay() {
  var ov = document.getElementById('mv-critical-overlay');
  if(ov) ov.style.display = 'none';
}

// ════ EXPORT ERR KEY (journal d'erreurs local — lu par admin-gt.js) ════
export { _ERR_KEY, _escHtml, _escAttr, deepClone, _swNotify };

// ════ SIGNALEMENT DE PROBLÈME (support) ════
// Ordre de gravité du journal local — le plus petit passe devant.
// ⚠️ Doit rester aligné sur ERR_RANK dans functions/claims.js : les deux moitiés du
//    tri (client qui sélectionne, serveur qui affiche) doivent classer pareil.
var _ERR_RANK = { critical: 0, error: 1, warning: 2, info: 3 };

// Seuil de fraîcheur. Le journal local garde 50 entrées et couvre facilement
// plusieurs jours de travail : sans ce seuil, une panne d'avant-hier passe devant
// celle de la minute, alors que le signalement porte sur MAINTENANT.
var _ERR_FRESH_MS = 86400000; // 24 h

// Erreurs jointes au signalement.
// ⚠️ On envoyait les 5 PLUS RÉCENTES. Or une rafale de synchro — les 12 clés temps
//    réel qui tombent dans la même seconde — suffit à chasser du signalement l'unique
//    [error] qui explique la panne : le support ne recevait plus que du bruit, et la
//    cause ne quittait jamais le poste du client. On trie donc par GRAVITÉ puis par
//    date, et on garde 8 entrées (submitReport en accepte 12).
// On ne transmet que les 6 champs réellement lus côté fonction, et `detail` est borné :
//    une pile d'appels ou un JSON d'erreur peut être énorme, la charge utile d'un appel
//    callable ne l'est pas.
function _mvPickReportErrors() {
  var all = [];
  try { all = JSON.parse(localStorage.getItem(_ERR_KEY) || '[]'); } catch(e) {}
  if (!Array.isArray(all)) return [];
  var now = Date.now();

  // ── 1. Repli des rafales ────────────────────────────────────────────────
  // Douze listeners temps réel qui tombent dans la même seconde portent UNE
  // information, pas douze — mais ils occupaient les 8 places et chassaient tout le
  // reste du signalement. On regroupe sur (niveau + catégorie + famille de message +
  // détail), en gardant l'occurrence la plus récente et le nombre de répétitions.
  // La « famille » est le message tronqué au premier « : » : « onSnapshot: parcelles »
  // et « onSnapshot: journal » se replient, deux toasts distincts non (ils n'ont pas
  // de « : » et gardent donc leur message entier comme famille).
  var seen = {}, folded = [];
  all.forEach(function (e) {
    if (!e || typeof e !== 'object') return;
    var fam = String(e.msg || '').split(':')[0].trim().slice(0, 60);
    var k = String(e.level) + '|' + String(e.cat) + '|' + fam + '|' + String(e.detail || '').slice(0, 200);
    var prev = seen[k];
    if (prev) {
      prev.n++;
      if (String(e.ts || '') > String(prev.ts || '')) { prev.ts = e.ts; prev.msg = e.msg; prev.page = e.page; }
      return;
    }
    var copy = {
      level: e.level, cat: e.cat, msg: e.msg, detail: e.detail, page: e.page,
      ts: e.ts, _fromToast: !!e._fromToast, n: 1
    };
    seen[k] = copy;
    folded.push(copy);
  });

  // ── 2. Clé de tri composite, du plus discriminant au moins discriminant ──
  // ⚠️ Le premier critère n'est PAS la gravité mais « panne ou message d'écran ».
  //    _mvCaptureToastErr classe les toasts sur leur COULEUR, or la palette fait
  //    double emploi : l'ambre et le bordeaux servent autant aux échecs qu'aux
  //    confirmations. « 🗑 Cuve supprimée » et « Cuve corrigée · 290 L » arrivaient
  //    donc en warning et en error, et enterraient les vraies pannes. Le marqueur
  //    _fromToast existait déjà sur ces entrées — il n'était simplement pas lu.
  function _key(e) {
    var toast = e._fromToast ? 1 : 0;                       // 100 : une panne d'abord
    var t     = Date.parse(e.ts || '');
    var stale = (t && (now - t) > _ERR_FRESH_MS) ? 1 : 0;   //  10 : puis ce qui est frais
    var r     = _ERR_RANK[e.level];                         //   1 : puis la gravité
    return toast * 100 + stale * 10 + (r === undefined ? 9 : r);
  }

  return folded.sort(function (a, b) {
    var ka = _key(a), kb = _key(b);
    if (ka !== kb) return ka - kb;
    return String(b.ts || '').localeCompare(String(a.ts || '')); // ISO 8601 → tri lexical = chrono
  }).slice(0, 8).map(function (e) {
    return {
      level:  String(e.level  || ''),
      cat:    String(e.cat    || ''),
      msg:    String(e.msg    || ''),
      detail: String(e.detail || '').slice(0, 400),
      page:   String(e.page   || ''),
      ts:     String(e.ts     || ''),
      n:      e.n,
      // Transmis EXPLICITEMENT plutôt que déduit de cat==='ui' côté serveur :
      // deux fichiers qui déduisent la même chose chacun de leur côté finissent
      // toujours par diverger.
      ui:     !!e._fromToast
    };
  });
}

// Instantané diagnostic joint automatiquement au signalement (invisible pour l'utilisateur).
function _mvReportSnapshot() {
  var cu = window.currentUser || {};
  var errs = _mvPickReportErrors();
  var tenant = window.TENANT_ID;
  if (!tenant) { try { tenant = localStorage.getItem('mavigne_tenant') || ''; } catch(e) { tenant = ''; } }
  return {
    user: cu.nom || '—',
    roles: Array.isArray(cu.roles) ? cu.roles : [],
    page: _errCurrentPage(),
    ua: navigator.userAgent || '',
    appVersion: APP_VERSION,
    tenant: tenant || '',
    recentErrors: errs,
    ts: new Date().toISOString()
  };
}
function _mvReportFillPreview(snap, targetId) {
  var el = document.getElementById(targetId);
  if (!el) return;
  var roleTxt = snap.roles.length ? snap.roles.join(' · ') : 'sans rôle';
  var n = snap.recentErrors.length;
  el.innerHTML =
    '<span style="display:block">👤 ' + _escHtml(snap.user) + ' · ' + _escHtml(roleTxt) + '</span>' +
    '<span style="display:block">📄 Page : ' + _escHtml(snap.page) + '</span>' +
    '<span style="display:block">📱 ' + _escHtml((snap.ua || '').slice(0, 54)) + '…</span>' +
    '<span style="display:block">🕐 ' + n + ' erreur' + (n > 1 ? 's' : '') + ' récente' + (n > 1 ? 's' : '') + ' détectée' + (n > 1 ? 's' : '') + '</span>';
}
function _mvReportSend(desc, prelogin) {
  var snap = _mvReportSnapshot();
  if (!window.fbSubmitReport) return Promise.reject(new Error('offline'));
  return window.fbSubmitReport({ desc: desc, snapshot: snap, tenant: snap.tenant, prelogin: !!prelogin });
}
// In-app (connecté)
function openReport() {
  var ta = document.getElementById('report-text'); if (ta) ta.value = '';
  _mvReportFillPreview(_mvReportSnapshot(), 'report-preview');
  if (window.openOv) window.openOv('ovReport');
}
function closeReport() {
  try { if (window.closeOv) { window.closeOv(null, 'ovReport'); return; } } catch(e) {}
  var ov = document.getElementById('ovReport');
  if (ov) { ov.classList.remove('open'); ov.style.zIndex = ''; }
}
function submitReport() {
  var ta = document.getElementById('report-text');
  var desc = ta ? ta.value.trim() : '';
  if (!desc) { showToast('Décrivez le problème avant d\'envoyer', '#C09A10'); return; }
  var btn = document.getElementById('report-send-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Envoi…'; }
  _mvReportSend(desc, false).then(function() {
    closeReport();
    showToast('✅ Signalement envoyé — merci', '#3D6B27');
  }).catch(function() {
    showToast('Envoi impossible — réessayez plus tard', '#B85A1A');
  }).finally(function() {
    if (btn) { btn.disabled = false; btn.textContent = 'Envoyer le signalement'; }
  });
}
// Avant connexion (écran login) — overlay dédié au-dessus du login (z-index > 9999)
function openReportLogin() {
  var ov = document.getElementById('login-report-ov'); if (!ov) return;
  var ta = document.getElementById('login-report-text'); if (ta) ta.value = '';
  var st = document.getElementById('login-report-status'); if (st) { st.style.display = 'none'; st.textContent = ''; }
  ov.style.display = 'block';
}
function closeReportLogin() {
  var ov = document.getElementById('login-report-ov'); if (ov) ov.style.display = 'none';
}
function submitReportLogin() {
  var ta = document.getElementById('login-report-text');
  var desc = ta ? ta.value.trim() : '';
  var st = document.getElementById('login-report-status');
  if (!desc) { if (st) { st.style.display = 'block'; st.style.color = '#C09A10'; st.textContent = 'Décrivez le problème avant d\'envoyer.'; } return; }
  var btn = document.getElementById('login-report-send-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Envoi…'; }
  _mvReportSend(desc, true).then(function() {
    if (st) { st.style.display = 'block'; st.style.color = '#A8E6A3'; st.textContent = '✅ Envoyé — merci. Nous regardons ça au plus vite.'; }
    if (ta) ta.value = '';
    setTimeout(closeReportLogin, 2600);
  }).catch(function() {
    if (st) { st.style.display = 'block'; st.style.color = '#FF8A80'; st.textContent = 'Envoi impossible. Vérifiez votre connexion et réessayez.'; }
  }).finally(function() {
    if (btn) { btn.disabled = false; btn.textContent = 'Envoyer'; }
  });
}

// ════ AIDE CONTEXTUELLE (par module) ════
// Une pastille « ? Aide » est injectée dans la barre méta de chaque en-tête de
// module (.mod-header .mod-meta-row) — un seul point d'intégration pour les 8
// modules, et les futurs sont couverts d'office.
// Placée dans la barre méta et non à côté du ⌂ : l'Accueil porte déjà quatre
// contrôles (avatar, personnaliser, actualiser, hub) et un cinquième réduisait
// le titre à ~18 px sur un écran de 360 px. La barre méta est libre à droite
// sur les 8 modules, et la pastille y garde la peau de .hv2-saison-pill.
//
// ⚠ FORMAT DES POINTS : [amorce, suite] — DEUX CHAÎNES DE TEXTE PUR, jamais de
// balise dans la donnée. Le gras est posé par le RENDU, pas par le contenu.
// Une première version portait du <b> dans les chaînes, donc interpolées telles
// quelles : C19 l'a refusée, à raison — une règle qui tolère « ce HTML-là est de
// confiance » ne protège plus rien. Ici tout passe par _escHtml.
//
// ★ Un point peut aussi être une FONCTION sans argument qui renvoie [amorce, suite].
//   Elle est évaluée à L'OUVERTURE de l'aide, pas au chargement : utils.js est
//   importé en premier, il ne peut rien lire des autres modules au démarrage.
//   C'est ce qui permet à l'aide de LIRE la structure au lieu de la DÉCRIRE — la
//   liste des onglets vient du code, pas d'une phrase recopiée qui vieillit.
//   Vécu : cette fiche a annoncé « Six onglets » au Pilotage pendant que le module
//   en comptait sept, avec deux noms qui n'existaient plus.
//   Une fonction qui échoue ou ne renvoie rien : le point est simplement omis,
//   jamais d'écran vide et jamais de phrase à moitié écrite.

// ── Aide : petits assembleurs de texte ──────────────────────────────────────
// « a, b et c » — une énumération lisible, pas une liste à puces de plus.
function _mvAideEnum(arr) {
  var l = (arr || []).filter(Boolean);
  if (!l.length) return '';
  if (l.length === 1) return l[0];
  return l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1];
}
var _MV_AIDE_NB = ['aucun', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf', 'Dix'];
function _mvAideNb(n) { return _MV_AIDE_NB[n] || String(n); }

// Onglets lus À L'ÉCRAN : l'aide d'un module s'ouvre depuis ce module, donc ses
// onglets sont rendus au moment où on la demande. L'emoji du bouton vit dans un
// <span> en tête — on ne garde que le libellé.
function _mvAideOngletsDom(sel) {
  try {
    var n = document.querySelectorAll(sel);
    if (!n || !n.length) return null;
    var noms = [];
    for (var i = 0; i < n.length; i++) {
      var t = (n[i].textContent || '').replace(/\s+/g, ' ').trim().replace(/^[^A-Za-z\u00C0-\u024F]+/, '').trim();
      if (t) noms.push(t);
    }
    return noms.length ? noms : null;
  } catch (e) { return null; }
}
function _mvAideSections(sel, amorce, suite) {
  var noms = _mvAideOngletsDom(sel);
  if (!noms) return null;
  return [_mvAideNb(noms.length) + ' ' + amorce, ': ' + _mvAideEnum(noms) + '. ' + suite];
}
// Le Pilotage se lit dans le CODE (window._PIL_TABS), pas dans le DOM : sa barre
// épingle en plus l'outil ouvert, elle n'annonce donc pas toujours le même
// nombre. Le code, lui, ne varie pas.
function _mvAideOngletsPil() {
  var t = window._PIL_TABS, o = window._PIL_TOOLS;
  if (!t || !t.length) return null;
  var noms = t.map(function (x) { return x[2]; });
  var outils = (o && o.length)
    ? (' Le bouton Outils ouvre ' + _mvAideEnum(o.map(function (x) { return x[2].toLowerCase(); })) + '.')
    : '';
  return [_mvAideNb(noms.length) + ' onglets',
    ': ' + _mvAideEnum(noms) + '.' + outils + ' Le dernier ouvert revient à la visite suivante.'];
}

var MV_AIDE = {
  home: {
    ico: 'feuille', titre: 'Accueil', ancre: 'vigne',
    points: [
      ['La priorité du moment', "reste épinglée en haut : c’est ce que l’équipe attaque aujourd’hui."],
      ['La mise en route', "n’apparaît que chez l’administrateur d’un domaine neuf : sept étapes qui se cochent en lisant ce qui est déjà enregistré, rien à pointer à la main. Le bloc s’efface tout seul quand tout est fait."],
      ['Ma part du chantier', "montre ce que vous avez fait vous-même sur le travail en cours ; « Ma trace » ouvre le détail de votre campagne. Ce sont des hectares, jamais des heures, et rien n’est comparé entre collègues."],
      ['Appui long puis glisser', "déplace un bloc ; l’œil le masque. Chacun règle son Accueil."],
      ['La pastille de saison', "change la vue. Revenir sur une période passée ne touche pas à la période active."],
      ['Actualiser', "force une resynchronisation quand un chiffre semble figé."],
      ['« Tu prends le tracteur aujourd’hui ? »', "se pose à la première ouverture du jour, à ceux qui sont à la fois ouvriers et tractoristes et seulement si une session tracteur est ouverte. La réponse tient la journée et se repose le lendemain. Elle range le menu du bas et choisit l’écran d’ouverture : elle ne change aucun de vos droits, et rien ne disparaît — le reste passe sous « Plus », où se trouve aussi le retour au terrain."],
      ['La météo a besoin du réseau.', "Hors ligne, elle affiche la dernière prévision reçue."]
    ]
  },
  parcelles: {
    ico: 'carte', titre: 'Mes Parcelles', ancre: 'vigne',
    points: [
      ['Les filtres du haut', "trient par état : finies, en cours, arrachées."],
      ['La colonne de droite', "porte les deux gestes du terrain, sans ouvrir la parcelle : « Début » signale qu’on attaque, « Valider » que c’est fini. Une tâche à passages affiche en plus le passage en cours (P1, P2, N1…)."],
      ['Le numéro devant le nom', "est le rang de la tournée du domaine. Il n’apparaît que si une tournée est fixée, et les parcelles se rangent dans cet ordre."],
      ['Onglet Carte', ": les contours viennent de votre export PAC ou d’un fichier KML."],
      ['La recherche', "accepte le nom du climat comme le lieu-dit."],
      ['Une parcelle arrachée', "sort des totaux mais reste dans l’historique."],
      ['L’état du vignoble', "s’imprime depuis Réglages, onglet App, « Documents & impressions » : toutes vos parcelles sur une page, avec la surface, le cépage, la commune, l’avancement, le dernier travail, le dernier rendement — et la liste de ce qui reste à renseigner."]
    ]
  },
  journal: {
    ico: 'journal', titre: 'Journal', ancre: 'vigne',
    points: [
      ['Chaque tâche validée', "écrit une ligne ici, avec la parcelle, la personne et la durée."],
      ['Une équipe au travail', "tient en une seule entrée : tous les noms y figurent, et le travail se partage entre eux."],
      ['Les filtres', "par parcelle et par tâche se cumulent ; la pastille rappelle ce qui est actif."],
      ['Une saisie faite hors réseau', "repart toute seule au retour du signal."],
      ['Le journal en fichier', "se prend dans Réglages, onglet App, « Documents & impressions »."]
    ]
  },
  tracteur: {
    ico: 'tracteur', titre: 'Tracteur', ancre: 'tracteur',
    points: [
      ['Onglet Sessions', ": le travail fait avec la machine. Onglet Entretien : révisions, réparations, appoints de cuve."],
      ['Le parc', "s’affiche en pastilles sous les chiffres — toucher une machine filtre l’écran."],
      ['Une session en cours', "reste signalée en haut tant qu’elle n’est pas fermée."],
      ['Toucher la parcelle où vous commencez', "démarre la mesure : il n’y a rien à appuyer avant. « J’ai fini » la ferme. Toucher directement la parcelle suivante enchaîne sans compter de déplacement, et un appui long ajoute une parcelle à celle en cours — leur temps se partage à la surface. Verrouiller son téléphone ne perd plus rien : la mesure est retrouvée à la réouverture, même des heures après."],
      ['Trois compteurs, pas un', ": le temps passé dans les parcelles, le temps hors parcelle — trajets, ravitaillement, réglage, qui sont du travail eux aussi — et la pause déjeuner, qui n’en est pas. Le bouton pause interrompt sans refermer la parcelle en cours."],
      ['Ce chrono ne fait pas votre journée de travail', ": il mesure le temps passé dans les parcelles, pour budgéter les travaux. Le lavage, les niveaux et le plein n’y sont pas."],
      ['Une mesure aberrante est écartée', ": très au-dessus ou très en dessous du barème, la parcelle est cochée au barème sans temps constaté, et l’écran dit lequel. Si cela arrive tous les jours, c’est le barème h/ha de l’activité qui est à revoir, pas celui qui conduit."],
      ['Les parcelles se rangent par distance', "à celle où vous êtes ; une tournée fixée par le chef passe devant. Les distances viennent des contours de vos parcelles, jamais d’un suivi de votre position."],
      ['Le chrono s’active par le domaine', ": Réglages, onglet Tracteur, en tête des activités. Sans lui, le barème h/ha prend le relais et rien ne se mesure."],
      ['L’appoint de cuve GNR', "remonte le niveau et recalcule le prix du litre en moyenne pondérée."],
      ['Le carnet d’entretien', "s’imprime machine par machine depuis Réglages, onglet App, « Documents & impressions »."],
      ['Rôle Tractoriste requis', "pour écrire : sans lui, l’écran passe en consultation seule."]
    ]
  },
  phyto: {
    ico: 'eprouvette', titre: 'Phyto', ancre: 'phyto',
    points: [
      ['Le catalogue produits', "vient d’E-Phy (ANSES) et se met à jour tout seul chaque semaine."],
      ['Un traitement', "= des produits, les parcelles cochées et un conducteur. La surface se calcule seule."],
      ['Le bouton rond en bas à droite', "ouvre un nouveau traitement."],
      ['Le délai de rentrée', "se déduit des mentions de danger du produit : la parcelle traitée se ferme d’elle-même jusqu’à son heure de libération."],
      ['Le registre sort sous deux formes', ": le PDF à présenter, et un fichier tableur avec une ligne par produit et par parcelle. Ce second format est celui qui sera attendu en contrôle à partir du 1er janvier 2027."],
      ['Le budget cuivre', "cumule le cuivre métal sur sept ans glissants face au plafond. Il informe, il ne bloque rien."],
      ['Accès', ": rôle Admin ou Tractoriste."]
    ]
  },
  planning: {
    ico: 'calendrier', titre: 'Planning', ancre: 'planning',
    points: [
      ['Trois onglets', ": Le mois, la grille de toute l’équipe. Les gens, une ligne par salarié et sa fiche. Le cadre, ce qui se règle une fois par an. Un salarié qui n’est pas administrateur n’a pas d’onglets : il arrive sur son mois."],
      ['Toucher une case', "la coche. Toucher le numéro du jour, en haut, coche toute l’équipe ce jour-là ; toucher un nom coche sa ligne ; toucher « Salarié », dans le coin, coche tout ce qui est affiché. Un deuxième appui décoche."],
      ['La barre du bas', "dit qui est coché et à quelles dates, puis propose ce qui s’applique vraiment à cette sélection — heures, congé, absence, récup, chaleur, effacer. Une case ou trente, c’est le même geste et la même fiche."],
      ['Sur une période plus longue', "que la vue affichée, deux boutons au-dessus de la grille posent des congés ou des horaires chaleur du jour au jour, pour plusieurs salariés."],
      ['Les heures dues', "se décomptent sur une absence injustifiée ou un retard. Un arrêt de travail est neutre, une formation compte comme du travail."],
      ['Un retard se note par l’heure d’arrivée', ": indiquez l’heure à laquelle la personne est arrivée, l’écran calcule ce qui manque. La journée est payée à hauteur de ce qui a été fait, et les heures manquées tirent sur le compteur d’heures sup, comme une récupération — sans qu’aucun réglage soit nécessaire. Arriver après la fin prévue n’est plus un retard : la saisie bascule seule en absence injustifiée."],
      ['Présence, coupure, heures dues', "trois nombres qui se ressemblent et ne disent pas la même chose. La ‹‹ présence ›› va de l’arrivée au départ. La ‹‹ coupure ›› est le temps non travaillé au milieu : sa durée et son heure sont fixées par le domaine, dans l’onglet Le cadre, ce n’est pas un moment que chacun choisit. Les ‹‹ heures dues ›› sont ce qui part en paie et alimente le compteur des 1 607 h. Une journée de 09:00 à 16:00 avec une heure de coupure fait 7 h de présence et 6 h dues."],
      ['Le planning de l’année', "s’imprime depuis le même endroit : le rythme sur douze mois, avec les heures de prise et de fin de service et la coupure déjeuner. Une page par modèle de semaine — c’est le document qu’on remet à l’équipe pour l’année à venir. Une variante nominative sort la même grille pour une seule personne, bornée à ses contrats, avec ses jours de formation et ses congés déjà posés."],
      ['Le relevé mensuel', "s’imprime depuis Réglages, onglet App, « Documents & impressions ». C’est un relevé d’heures, pas un bulletin de paie."],
      ['Le relevé d’un seul salarié', "s’imprime au même endroit, en choisissant la personne et le mois : son mois jour par jour, ses contrats avec leurs coupures, ses congés payés, son compteur d’heures et son annualisation, avec deux lignes de signature. Le bouton PDF de sa fiche sort exactement le même document. Les anciens salariés y figurent aussi, marqués comme tels : un relevé est un document d’histoire."],
      ['Un ancien salarié', "reste compté dans les mois où il était sous contrat. Reculez d’un mois dans Les gens : il reprend sa ligne dans la liste, avec ses heures, et il disparaît de la section Anciens salariés ce mois-là. Passer une fiche en Inactif ferme son accès à l’application, cela n’efface aucune heure déjà faite."],
      ['Taux horaires et acomptes', ": administrateurs seulement, et jamais enregistrés sur l’appareil."]
    ]
  },
  cave: {
    ico: 'verre', titre: 'Cave', ancre: 'cave',
    points: [
      function () {
        return _mvAideSections('#cave-sec-tabs .mvu-tab', 'sections',
          "Le Cuvier suit la vendange, Le Chai suit l’élevage, Le millésime raconte le vin.");
      },
      ['Un millésime à la fois', "une opération porte sur une seule année. Changer de millésime en haut du formulaire vide la sélection : on ne mélange pas deux vins dans un même geste."],
      ['Le délai d’ouillage', "se règle pour tout le domaine, et se resserre millésime par millésime — un vin jeune se surveille de plus près."],
      ['Le parc à cuves', "se déclare une fois dans les Réglages du Chai : un nom, une contenance en litres, une matière. La même cuve sert à vinifier au Cuvier puis à élever au Chai, et l’application sait laquelle est prise — dans les deux cas."],
      ['Au Cuvier', "une cuve de vinification peut être rattachée à une cuve du parc. C’est ce rattachement qui rend l’occupation juste : sans lui, le parc ne voit que Le Chai et annonce libre une cuve qui fermente. Facultatif — la saisie libre reste possible."],
      ['Au décuvage', "vous choisissez où part le vin : barriques, cuve, ou les deux. Le répartiteur met la cuve d’abord et convertit le reste en barriques. La cuve que vous videz reste choisissable — élever sur lies dans la cuve de fermentation est un usage courant, pas une erreur de saisie."],
      ['Une récolte peut avoir plusieurs destinataires', "sur la même parcelle et le même jour : le domaine, et un ou plusieurs acheteurs de raisin. Une ligne chacun, avec ses caisses, son poids par caisse et, si l’acheteur a pris une partie de la parcelle, sa surface. Laissée vide, la surface prend tout le reste."],
      ['Le poids d’une caisse est un poids du jour', "il est figé sur l’apport au moment où vous le saisissez. La fiche du client ne fait que le proposer : la corriger plus tard ne déplace aucun kilo déjà livré, ni sur un bon déjà signé."],
      ['Le bon de livraison', "s’ouvre depuis la ligne « kg vendus en raisin » de l’écran Récoltes. Une livraison, c’est un chargement : un client, une date, même s’il emporte deux parcelles. Le bon ne dit que des kilos — aucun prix."],
      ['Le retour du client', "les litres de jus et de lie qu’il a obtenus, saisis des semaines plus tard sur la livraison. Corriger les caisses ne touche pas aux litres, et l’inverse non plus : deux mesures, deux personnes, deux moments."],
      ['Le rendement va chercher le mesuré d’abord', "les litres rendus par l’acheteur, puis le volume logé en cuve, et seulement à défaut une estimation d’après les kilos. Tant qu’un volume manque, la parcelle affiche une fourchette et le pourcentage mesuré : il manque des litres, pas des raisins."],
      ['Une cuve n’est pas un fût', "elle ne sort pas de La Réserve, elle n’a pas d’âge, et elle a sa contenance propre. Ajouter une cuve à une cuvée ne change aucun compte de fûts. Le volume que vous inscrivez est celui qui est réellement dedans, pas la contenance de la cuve."],
      ['L’ouillage suit le bois, pas le contenant', "inox et béton ne s’évaporent pas : une cuvée logée seulement là n’a pas de jauge de part des anges et ne déclenche aucune alerte. Un foudre bois, si. Une cuvée mixte garde sa jauge, cadrée sur sa seule part en fût."],
      ['La fin de fermentation et la fin de malo', "sont estimées à partir de vos propres relevés : la densité pour l’une, l’acide malique pour l’autre. Sans trois mesures, l’écran dit « démarrage » plutôt qu’une date inventée."],
      ['Le millésime', "annonce ce qui vient dans les quatre prochaines semaines, puis retrace le parcours du vin, de la benne à la bouteille."],
      ['Votre rendement au pressoir', "se règle au Cuvier, onglet Réglages, en kilos de raisin par hectolitre. Tous les écrans qui transforment des raisins en volume s’en servent — la chaîne de la récolte à la bouteille comme le bilan de campagne."],
      ['Les analyses labo', "s’attachent en PDF à la cuvée. Les supprimer est réservé à l’administrateur."],
      ['Quatre documents sortent de la Cave', "depuis Réglages, onglet App, « Documents & impressions » : le contrôle de maturité avant vendange, le cahier de cuverie pendant la fermentation, le registre des manipulations et le bilan de campagne. Ce sont des états internes : Ma Vigne prépare, vous déclarez."],
      ['Deux autres s’éditent au plus près de la livraison', "le bon de livraison d’un chargement et le récapitulatif de campagne d’un acheteur, depuis les ventes en vrac. Ils portent le nom du domaine, les kilos livrés, et les volumes rendus dès que le client a répondu."]
    ]
  },
  reserve: {
    ico: 'carton', titre: 'La Réserve', ancre: 'reserve',
    points: [
      function () {
        return _mvAideSections('.mvr-tabs .mvu-tab', 'onglets',
          "C’est la comptabilité matière du domaine, pensée pour le contrôle bio.");
      },
      ['L’onglet Fûts porte le parc entier', "les fûts vides du magasin et ceux qui sont en vin au chai, additionnés. Ce ne sont pas deux comptabilités : ce sont deux états du même fût."],
      ['Entonner, embouteiller ou retirer', "ne change pas le nombre de fûts du domaine. Seuls acheter et se séparer le font."],
      ['Le registre des mouvements', "en bas de l’onglet garde chaque entrée et chaque sortie, avec son motif."],
      ['Le prix moyen d’un intrant', "n’est pas saisi ici : il se calcule sur vos factures, euros divisés par quantité, et s’affiche sur la fiche. Les lignes sans prix sont écartées du calcul plutôt que comptées à zéro — sinon la moyenne serait tirée vers le bas sans en avoir l’air."],
      ['Les prix se mettent ailleurs', "dans <b>Pilotage › Économie › Achats</b>, qui rassemble tout ce qui a été acquis — intrants, fûts, passages chez le réparateur. C’est voulu : le prix arrive avec la facture, des semaines après le geste, et on le saisit en une fois plutôt qu’écran par écran."],
      ['Le bilan se calcule seul', ": inventaire d’ouverture + achats − consommation. Aucun stock à tenir à la main."],
      ['L’inventaire d’ouverture', "est le point zéro. Sans lui, l’écart constaté ne veut rien dire."],
      ['Un stock négatif', "n’est pas un défaut d’affichage : il manque une facture d’achat, ou le consommé est surestimé."],
      ['Créer et modifier', "est réservé à l’administrateur du domaine ; tout le monde peut consulter."]
    ]
  },
  pilotage: {
    ico: 'graphique', titre: 'Pilotage', ancre: 'pilotage',
    points: [
      ['Rien ne se saisit ici', ": tout est en lecture seule. Les chiffres viennent du journal, du planning et des sessions tracteur."],
      ['Les cartes arrivent repliées', ": chaque bloc montre son <b>chiffre</b> et la ligne qui dit sur quoi il a été calculé, même fermé — rien n’est caché. Touchez-en une pour voir son détail : elle s’ouvre en grand, et la précédente se referme, pour que les autres restent rangées côte à côte."],
      ['Le petit rond « i » dit d’où vient un chiffre', ": touchez-le, une fiche s’ouvre et explique comment ce chiffre est calculé, sur quelle fenêtre, et ce qu’il ne dit pas. Ce qui <b>cadre</b> un chiffre — sa date, sa source, son périmètre — reste toujours affiché à côté de lui, en une ligne. C’est la méthode qui se range, jamais le cadre."],
      ['Quand il manque quelque chose, un bouton vous y emmène', ": plus de chemin à retenir. « Cuve GNR à renseigner », « fiches à passer en Inactif » — le bouton ouvre l’écran concerné, sur le bon onglet, et fait clignoter l’endroit exact une seconde."],
      _mvAideOngletsPil,
      ['La barre du haut dit où vous regardez', ": l’exercice entier, ou une campagne. Cliquez une campagne dans la frise de l’année et les trois chiffres du haut, la frise et les tableaux de la campagne suivent. La croix revient à l’année. <b>Trois écrans ont leur propre cadre</b> et ne se recadrent pas : Économie chiffre la période consultée, la Cave suit le millésime, la Conformité roule sur sept ans — chacun l’écrit au-dessus de ses chiffres."],
      ['Les trois chiffres du haut', "— les travaux, l’effectif, le budget — ne s’affichent que sur <b>L’année</b> et <b>La campagne</b>, les deux niveaux de zoom. Ils changent avec ce que vous regardez, et chacun mène à l’écran qui le détaille. Ailleurs, ils ne servaient plus à choisir où aller : sur Économie et sur Conformité, ils répétaient l’écran juste en dessous."],
      ['La conformité n’est plus dans cette ligne', "et c’est une question d’échelle : le cuivre roule sur <b>sept ans glissants</b>, il ne bouge pas quand vous cliquez une campagne. Un chiffre qui ignore la portée n’a pas sa place dans une ligne qui se recadre. Il se lit en entier dans l’onglet Conformité, et le bouton « à compléter » remonte toujours ses alertes, sur tous les onglets."],
      ['Le bouton « à compléter »', "liste ce qui manque pour que vos chiffres soient justes, et vous emmène à l’endroit exact où le renseigner. Un rond rouge sur un chiffre veut dire qu’il ne se calcule pas ; un rond orange, qu’il sort mais faux."],
      ['Les onglets vont du large au fin', ": l’année, puis la campagne, puis l’équipe et le matériel, puis la décision. Après le trait, ce sont des écrans de détail — on y arrive aussi en touchant un des trois chiffres."],
      ['La campagne', "montre l’avancement, mais aussi — sous « Où va le temps de l’équipe » — comment la présence se partage entre vigne, tracteur et le reste, avec la frise prévu/réel, la courbe par semaine et l’écart. Ces blocs parlent d’une campagne ; le pic de la semaine la plus chargée, lui, se lit dans « L’année »."],
      ['Deux périodes qui se chevauchent', "ne comptent rien deux fois : les heures suivent les tâches, et une tâche n’appartient qu’à une seule période. Sur les jours communs, la frise hachure le fond en violet — il y a deux barres au même endroit, on lit la plus haute."],
      ['Une fenêtre de tâche s’arrête le jour écrit', " : fin au 25 avril, le 25 travaille. Et les heures se répartissent au prorata des jours <b>travaillables</b> : une semaine de ponts en reçoit moins, les semaines pleines récupèrent le reste."],
      ['Le marqueur « hors période »', "dans Outils › Paramétrage veut dire qu’une fenêtre enregistrée ne tombe pas dans cette période. La fenêtre par défaut s’applique à la place, et l’écran le dit au lieu d’écraser tout le travail sur un seul jour."],
      ['Décider', "— l’onglet s’appelait <b>Simuler</b>, mais l’ordre de passage qu’on y enregistre part sur l’écran de toute l’équipe : c’est le seul endroit du Pilotage qui change ce que les autres voient. On simule, puis on décide de diffuser. Il répond à deux questions : dans quel ordre passer sur les parcelles, et combien de renfort prendre — à quelle date, et pour quel coût. La simulation part de l’effectif <b>déjà sous contrat</b>, vendangeurs compris : le renfort que vous posez s’ajoute à cette ligne. Le sélecteur « On part de » permet de repasser aux permanents seuls pour préparer la campagne suivante."],
      ['Décider compte sur la fenêtre du TRAVAIL', ", pas sur le calendrier d’aujourd’hui. Quarante vendangeurs engagés du 26 août au 4 septembre comptent dès maintenant pour l’ordre de passage et la répartition de la vendange — même si vous êtes seul dans les rangs ce matin. Le jour du travail, personne n’est en congé et tous les contrats courent."],
      ['Un contrat de groupe compte pour son effectif', " : une fiche « équipe de vendange » à 40 vaut 40 personnes, pas une ligne. Inutile de créer quarante fiches. L’écran dit toujours sur quelles dates il a compté, et affiche l’écart avec la présence du jour."],
      ['Le manque d’effectif se lit sur la semaine du pic', ", contre ce qui est prévu au planning <b>cette semaine-là</b> — pas contre la présence d’aujourd’hui. Un pic qui tombe dans onze mois ne se compare pas à qui est là ce matin."],
      ['Le total de l’Exercice n’est pas un compte de résultat', ": Ma Vigne connaît ce qui passe par elle — heures payées, carburant, achats d’intrants. Ni le fermage, ni les amortissements, ni les assurances, ni vos cotisations d’exploitant. Ce total sert à <b>piloter vos charges d’un bilan à l’autre</b>, pas à remplacer votre comptable."],
      ['La carte de fiabilité d’Économie', ": elle dit combien de <b>postes de dépense sortent à zéro</b> faute d’une donnée — un taux horaire, le prix du GNR, une dose. Ce n’est pas « un peu bas » : c’est zéro, et le budget affiché n’est qu’un plancher. Chaque poste manquant porte son bouton. La puce « N remarques » en dessous ouvre tout ce qui n’empêche pas un calcul mais change sa lecture."],
      ['Économie', "compare un budget de barème à ce qui est engagé, sur la <b>période consultée</b> — le coût d’un bilan entier se lit dans sa sous-vue <b>Exercice</b>. Quand l’écart est grand, c’est le barème qu’on corrige dans Réglages, jamais le taux horaire."],
      ['La carte de verdict d’Économie', ": elle dit en une phrase où vous en êtes, et pose les boutons pour agir — voir quel travail dérape, ouvrir le barème. Quand la cadence affichée vient de la campagne précédente, une ligne sous le texte le dit, avec le nom de cette campagne. Le <b>comment</b> du calcul est derrière son petit « i »."],
      ['L’écart de cadence cherche sa source dans un ordre', ", et dit toujours laquelle il a trouvée. D’abord <b>la période en cours</b>, dès 40 % de barème réalisé. Sinon <b>la même période de la campagne précédente</b>, si elle est archivée — la ligne porte alors un <b>↩</b> et nomme la campagne : c’est une hypothèse de projection, pas une mesure du moment. Sinon rien, et l’écran l’écrit plutôt que d’afficher un chiffre inventé."],
      ['Conformité', "suit le cuivre sur sept ans, le nombre de passages, le <b>registre phyto</b> et les délais de rentrée en cours. Le registre était rangé dans « L’équipe &amp; le matériel » alors qu’il lit exactement les mêmes traitements que « Passages phyto » : il est désormais juste en dessous, en détail de ce total."],
      ['« Traiter ? » porte les cinq jours', ": la fenêtre de traitement était affichée à <b>deux endroits</b> — sur Aujourd’hui et dans le matériel — pour une seule source. C’est une décision du jour : elle reste dans Aujourd’hui. Le verdict du moment est en grand, les cinq jours à venir se déplient sous « les 5 prochains jours ». Rien n’a été retiré du calcul."],
      ['Le budget de l’année, mois par mois', ": dans <b>L’année</b>, deux courbes cumulées — le prévu au barème en tireté, la dépense réelle en trait plein. ⚠️ <b>L’écart n’est pas un dépassement</b> : le prévu ne chiffre que la vigne, la dépense porte tout le domaine, cave et atelier compris. L’écran l’écrit sous le graphe, et le « i » en donne le détail."],
      ['Cave', "dit ce qui presse aujourd’hui, où en est le millésime, et ce que coûte le parc à fûts."],
      ['Archives', "empile les campagnes sur un même axe, du 1er août au 31 juillet : le décalage d’une année sur l’autre se lit d’un coup d’œil."],
      ['Le « i » est partout, maintenant', ": les huit onglets suivent la même règle — le chiffre, une ligne qui dit sur quoi il porte, le détail du calcul derrière le « i ». Dans <b>Décider</b>, chaque étape a le sien : il remplace les pavés « comment lire » qui séparaient le titre du graphique. La <b>légende des couleurs</b>, elle, reste affichée : on ne la lit pas, on la consulte."],
      ['Il se lit aussi sur téléphone', ": les chiffres du haut se rangent en une ligne qui défile, et le titre de l’onglet ne prend plus de place — la barre d’onglets le dit déjà. Le grand écran reste plus confortable pour les tableaux et les graphiques, mais vous n’avez plus à faire défiler un écran entier avant d’atteindre un chiffre."]
    ]
  },
  reglages: {
    ico: 'curseurs', titre: 'Réglages', ancre: 'reglages',
    points: [
      function () {
        return _mvAideSections('#regl-tabs-row .mvu-tab', 'onglets',
          "Chacun regroupe ce qui se règle une fois et ne bouge plus souvent.");
      },
      ['Onglet Vigne', ": vos tâches, leurs heures par hectare, le barème de la convention, vos écartements de plantation et vos périodes de travail."],
      ['Vos écartements', "ramènent les heures conseillées à votre densité réelle. Sans eux, le barème suppose 10 000 pieds à l’hectare — vos heures à vous, elles, ne bougent jamais."],
      ['Le barème de référence', "se choisit par région dans l’écran du barème, ouvert par « Nouvelle tâche selon le barème de la convention » : la Bourgogne ou la Gironde pour l’instant, chacune avec son texte source et sa date. C’est une référence, pas une règle : en changer ne modifie aucune de vos valeurs."],
      ['Le taux horaire d’un salarié', "porte une date. Une augmentation s’enregistre « à partir du » jour choisi : les heures déjà travaillées gardent l’ancien taux, et le coût d’un exercice clos ne bouge plus. La fiche liste tout ce que ce taux a valu ; pour corriger une simple faute de frappe sans créer d’augmentation, videz la date. Ces montants sont visibles des seuls administrateurs."],
      ['Le mot de passe initial', "d’un nouveau membre s’affiche une seule fois — notez-le avant de fermer."],
      ['Passer un membre en inactif', "plutôt que le supprimer conserve son historique."],
      ['Documents & impressions', "dans l’onglet App rassemble tout ce que Ma Vigne sait sortir : ce qui est obligatoire en contrôle, vos états internes, et vos données brutes."],
      ['La zone dangereuse', "ne réinitialise que cet appareil : les données du domaine restent sur le serveur."]
    ]
  }
};

var MV_AIDE_DEFAUT = {
  ico: 'livre', titre: 'Aide', ancre: 'contenu',
  points: [
    ['Le guide complet', "couvre tous les modules, écran par écran."],
    ['Un souci ?', "Signalez-le : le contexte technique part avec votre message."]
  ]
};

function _mvAideFiche() {
  var a = document.querySelector('.page.active');
  var k = a ? (a.id || '').replace('page-', '') : '';
  return MV_AIDE[k] || MV_AIDE_DEFAUT;
}

function openAide() {
  var el = document.getElementById('aide-inner');
  if (!el) return;
  var a = _mvAideFiche();
  var h = '<div class="modal-hd mva-hd">'
        + '<span class="mva-hd-ic">' + _escHtml(a.ico) + '</span>'
        + '<div><div class="modal-title">' + _escHtml(a.titre) + '</div>'
        + '<div class="modal-sub">Ce qu’on peut faire sur cet écran</div></div></div>'
        + '<div class="mva-list">';
  for (var i = 0; i < a.points.length; i++) {
    var p = a.points[i];
    // Point dynamique : evalue ici, quand tous les modules sont charges. S'il
    // echoue, on omet la ligne — mieux vaut une aide plus courte qu'une phrase
    // fausse ou un blanc au milieu de la liste.
    if (typeof p === 'function') {
      try { p = p(); }
      catch (e) { p = null; if (window.logError) window.logError({ level: 'info', cat: 'aide', msg: 'point dynamique' }); }
    }
    if (!p || !p[0]) continue;
    h += '<div class="mva-it"><span class="mva-bul"></span><span><b>'
       + _escHtml(p[0]) + '</b> ' + _escHtml(p[1] || '') + '</span></div>';
  }
  h += '</div><div class="mva-foot">'
     + '<button type="button" class="mva-fbtn" id="mva-guide">' + _mvIcon('livre',16) + ' Guide complet</button>'
     + '<button type="button" class="mva-fbtn mva-bug" id="mva-bug">' + _mvIcon('bogue',16) + ' Un problème</button>'
     + '</div>';
  el.innerHTML = h;
  var g = document.getElementById('mva-guide');
  if (g) g.onclick = function () { window.open('https://mavigneapp.fr/guide.html#' + encodeURIComponent(a.ancre), '_blank'); };
  var b = document.getElementById('mva-bug');
  if (b) b.onclick = function () { closeAide(); openReport(); };
  if (window.openOv) window.openOv('ovAide');
}
function closeAide() {
  if (window.closeOv) { window.closeOv(null, 'ovAide'); return; }
  var ov = document.getElementById('ovAide');
  if (ov) { ov.classList.remove('open'); ov.style.zIndex = ''; }
}

// Injection de la pastille — IDEMPOTENTE (un en-tête peut être re-rendu).
// Les 8 en-têtes sont statiques dans index.html : un seul passage suffit.
// Un module rendu en JS (Pilotage, La Réserve) n'a qu'à rappeler
// window._mvInjectHelpBtn() après son rendu, comme il rappelle _mvMetaSync().
function _mvInjectHelpBtn() {
  var rows = document.querySelectorAll('.mod-header .mod-meta-row');
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].querySelector('.mv-help-btn')) continue;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'mv-help-btn';
    b.title = 'Aide sur cet écran';
    b.setAttribute('aria-label', 'Aide sur cet écran');
    // textContent + appendChild : aucun HTML construit ici.
    var q = document.createElement('span');
    q.className = 'mvh-q';
    q.textContent = '?';
    b.appendChild(q);
    b.appendChild(document.createTextNode('Aide'));
    b.onclick = openAide;
    rows[i].appendChild(b);
  }
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _mvInjectHelpBtn);
  else _mvInjectHelpBtn();
}

// ═══════════════════════════════════════════════════════════════════════════
// _PIL_SEM — LA PALETTE SEMANTIQUE DES GRAPHES : un nom, un sens, une couleur.
// ═══════════════════════════════════════════════════════════════════════════
// Elle est nee dans pilotage.js (§34, lot 1) et y est restee pour pouvoir etre
// livree sans changer de numero de version. Une palette n'est pas la propriete
// d'un module : elle remonte ici, ou tout le monde la lit de la meme source.
// Le motif qu'elle corrige : `col.alerte` servait A LA FOIS au renfort a trouver
// (des barres) et au trait d'aujourd'hui (un reperage) dans la MEME image —
// deux choses sans rapport sous une seule encre, donc une image qui se lit de
// travers. « aujourdhui » a desormais la sienne.
export const _PIL_SEM = {
  fait:       '#3D6B27',   // fait, absorbe par l'equipe, couvert
  reste:      '#C2A14D',   // reste a faire — n'alarme pas
  faute:      '#A0291E',   // manque, depassement, sous-effectif
  socle:      '#4A9FC8',   // reference : socle permanent, moyenne
  hors:       '#DED7C9',   // hors portee
  sel:        '#8A5A38',   // la selection en cours
  aujourdhui: '#14110D'    // le trait du jour — un REPERE, pas une alerte
};

// ═══════════════════════════════════════════════════════════════════════════
// MV_INFO — « D'OU VIENT CE CHIFFRE »
// ═══════════════════════════════════════════════════════════════════════════
// LE CONSTAT. Le Pilotage affichait ~25 000 caracteres de prose en permanence :
// 217 phrases, neuf pages A4, reparties dans 60 fonctions de rendu. Et AUCUN
// moyen d'en replier une seule — pas un <details>, pas une infobulle, rien,
// dans tout le projet. Le chiffre etait noye dans sa propre notice.
//
// LA REGLE, en trois familles. Toute phrase affichee tombe dans une seule :
//   ① CE QUI CADRE LE CHIFFRE (sa date, sa source, son perimetre) — RESTE a
//     l'ecran, en UNE ligne, toujours a la meme place. C'est ce qui empeche de
//     lire un chiffre pour un autre. On ne le replie jamais.
//   ② CE QUI EXPLIQUE LE CALCUL (methode, conventions, biais assumes) — vient
//     ICI. Ca se lit une fois, pas a chaque ouverture de l'ecran.
//   ③ CE QUI DIT QUOI FAIRE — devient un BOUTON, pas une phrase a executer de
//     memoire. « Il se saisit dans Reglages › Equipe » est un chemin a retenir ;
//     un bouton est un clic.
//
// ⚠️ CE N'EST PAS « CACHER LE TEXTE ». La moitie de ces phrases est la seule
//   trace ecrite d'une convention du domaine. Les supprimer serait la faute
//   inverse, et plus grave : un chiffre sans son cadre ment (§34, §41).
//
// ⚠️ LES CLES SONT NOMMEES PAR MODULE (`pil.`, plus tard `cave.`, `plan.`) :
//   deux modules peuvent avoir chacun leur « cadence » sans se marcher dessus.
//
// ★ Elle vit a cote de MV_AIDE, et pour la meme raison : la regle
//   d'accompagnement (regle d'or n°4) couvre ce qui vit dans ce fichier. Une
//   fiche posee ailleurs vieillirait sans que personne ne la relise.
export const MV_INFO = {

  'pil.capacite': { t: 'Capacité au pic', p: [
    'Le pic est la <b>semaine la plus chargée</b> de la fenêtre affichée, jamais une moyenne. Une moyenne annuelle n\u2019existe aucun jour de l\u2019année ; c\u2019est le pic qui décide d\u2019un recrutement.',
    'Le <b>nécessaire</b> vient du barème h/ha du domaine, appliqué aux surfaces qui restent à faire. Le <b>prévu</b> vient du planning de cette semaine-là, contrat par contrat : une personne compte si elle est sous contrat ce jour-là, pas si sa fiche est marquée active.',
    'Les personnes comptées <b>aujourd\u2019hui</b> sont celles qui sont <b>au champ</b> : hors bureau, hors absents. Une <b>équipe collective</b> compte pour son effectif réel — une fiche « équipe de vendange » à 40 vaut 40 personnes, pas une ligne.',
    '<b>Deux autres chiffres de cet écran ne se comparent pas à celui-ci.</b> Les personnes présentes aujourd\u2019hui : c\u2019est une autre date, et le pic peut tomber dans onze mois. La moyenne sur la campagne : c\u2019est une autre fenêtre. Les soustraire donne un chiffre faux — c\u2019est le défaut corrigé en août 2026, où « 46,3 personnes au pic » moins « 2 présentes » affichait « il en manque 44,3 » sur un domaine de quatre.'
  ] },

  'pil.cadence': { t: 'L\u2019écart de cadence', p: [
    'Il compare le <b>temps réellement passé</b> — les heures du planning — au <b>barème h/ha</b> du travail déjà fait. Un écart positif veut dire que l\u2019équipe a mis plus de temps que le barème ne le prévoit.',
    'Il cherche sa source dans un ordre, et <b>dit toujours laquelle il a trouvée</b>. D\u2019abord la période en cours, dès <b>40 % du barème réalisé</b> — en dessous, le travail fait ne ressemble pas assez à celui qui reste. Sinon la <b>même période de la campagne précédente</b>, si elle est archivée : la ligne porte alors un <b>\u21a9</b> et nomme la campagne. Sinon rien, et l\u2019écran l\u2019écrit plutôt que d\u2019inventer un chiffre.',
    'La cadence ne s\u2019applique qu\u2019au <b>reste à engager</b>, jamais à ce qui est déjà dépensé : à 100 % d\u2019avancement, la projection retombe exactement sur l\u2019engagé. Sans cette règle, l\u2019écran annonçait une fin à 37 k\u20ac alors que 79 k\u20ac étaient déjà payés — sur la même carte.',
    '<b>Un biais assumé.</b> Une entrée de planning porte des heures, jamais une activité : la cave, l\u2019atelier et le bureau restent donc dans la présence, alors que le barème ne compte que la vigne. La présence est <b>surévaluée</b>, et l\u2019indicateur penche vers « barème un peu serré ». Sur une période où la cave tourne, l\u2019écart parle surtout d\u2019elle.',
    'Quand l\u2019écart est grand, c\u2019est le <b>barème</b> qu\u2019on corrige dans Réglages \u203a Tâches, <b>jamais le taux horaire</b>.'
  ] },

  // ⚠️ FICHE VIVANTE : ses paragraphes sont remplaces a chaque rendu par
  //   _pecAlertes (pilotage.js). Ce qui suit est le repli — il s'affiche si le
  //   module n'a pas encore tourne, et il doit rester vrai dans ce cas-la.
  'pil.eco.remarques': { t: 'Les remarques du moment', p: [
    'Aucune remarque à afficher pour l\u2019instant. Ouvrez l\u2019onglet Économie pour que cette fiche se remplisse.'
  ] },

  'pil.eco.fiabilite': { t: 'Fiabilité des chiffres', p: [
    'Chaque donnée manquante ne rend pas un chiffre <b>approximatif</b> : elle met un poste entier à <b>zéro</b>. Un budget auquel il manque la main-d\u2019\u0153uvre n\u2019est pas « un peu bas », il est faux.',
    '<b>Taux horaire</b> — il vit dans la fiche de chaque salarié, Réglages \u203a Équipe. C\u2019est le taux <b>chargé</b> : le coût employeur, cotisations patronales comprises. Sans lui, la main-d\u2019\u0153uvre — le premier poste du domaine — compte pour zéro partout sur cet écran.',
    '<b>Prix du GNR</b> — il se déduit tout seul des <b>appoints de cuve</b> saisis dans Tracteur \u203a Entretien, en moyenne pondérée arrêtée à la date de chaque plein. Aucun appoint saisi, aucun prix : le carburant reste à zéro.',
    '<b>Les litres</b> — ils viennent des <b>pleins</b> notés sur les fiches d\u2019entretien, pas d\u2019une consommation théorique. Un plein non noté est du carburant absent du coût.',
    '<b>Doses et prix des produits</b> — le coût phyto se calcule à partir d\u2019une dose structurée à la saisie du traitement, et d\u2019un prix unitaire dans La Réserve. Il manque l\u2019un des deux, le traitement compte pour zéro.',
    'Tant qu\u2019un de ces postes manque, lisez le budget affiché comme un <b>plancher</b>, jamais comme un total.'
  ] },

  // ⚠️ FICHE VIVANTE : remplie par _pexEntete (pilotage.js) a chaque rendu.
  // ══ SIMULER ══
  'pil.sim.frise': { t: 'Quand chaque travail peut se faire', p: [
    'Une <b>ligne par travail</b>, une <b>barre par fenêtre</b> : du premier jour où il peut se faire au dernier jour où il devrait être fini.',
    'C\u2019est ce qui explique qu\u2019on ne puisse pas <b>prendre de l\u2019avance</b> : l\u2019effeuillage ne se fait pas en avril, même avec dix personnes disponibles. Le renfort ne sert que s\u2019il tombe <b>dans la fenêtre</b>.',
    'Les fenêtres viennent des <b>dates que vous avez saisies</b> dans Réglages \u203a Campagne. Une fenêtre absente prend la fenêtre par défaut, et l\u2019écran le dit plutôt que d\u2019écraser tout le travail sur un seul jour.'
  ] },

  'pil.sim.fenetres': { t: 'Le tableau des fenêtres', p: [
    '<b>Il faudrait</b> = le monde qu\u2019il faudrait en continu sur cette fenêtre pour ce travail <b>seul</b>.',
    '<b>Déjà là</b> = l\u2019effectif déjà sous contrat sur cette fenêtre, <b>vendangeurs et saisonniers compris</b> — mais <b>partagé avec les autres travaux ouverts</b> en même temps.',
    'C\u2019est pourquoi la dernière colonne <b>n\u2019est pas la différence des deux</b> : elle est <b>vérifiée en simulant</b>, par dichotomie sur la vraie simulation.',
    'Un renfort posé <b>en dehors</b> de la fenêtre ne sert pas ce travail : il est payé sans travail ouvert.'
  ] },

  'pil.sim.semaine': { t: 'Semaine par semaine', p: [
    '<b>Vert</b> : les gens qui travaillent vraiment cette semaine-là. <b>Hachuré</b> : les gens <b>payés sans travail ouvert</b> — présents, mais aucune fenêtre de tâche n\u2019est ouverte pour eux.',
    '<b>Rouge</b> : le travail <b>en retard</b>. Ce n\u2019est pas ce qui reste à faire, c\u2019est ce qui <b>aurait dû être fini</b>. Il n\u2019apparaît qu\u2019après la date de fin d\u2019une tâche, et chaque semaine de plus la rend plus longue — sauf pour un travail <b>sans rattrapage</b> comme la vendange, où ce qui reste est <b>perdu</b>, pas reporté.',
    'La <b>ligne noire</b> est l\u2019équipe déjà sous contrat, <b>vendangeurs et saisonniers compris</b>. C\u2019est la même que la frise des 52 semaines dans « L\u2019année ». Le renfort que vous posez s\u2019<b>ajoute</b> à cette ligne — il ne la remplace pas.',
    'L\u2019écart entre la ligne noire et le vert compte aussi les <b>congés, absences et fermetures déjà saisis au Planning</b> : ces heures sont payées, mais personne n\u2019est dans les rangs.',
    'Quand la campagne a commencé, le graphique démarre <b>aujourd\u2019hui</b> : la zone grisée à gauche est passée, et chaque travail ne compte plus que pour ce qu\u2019il en reste.'
  ] },

  'pil.sim.cout': { t: 'Ce que ce choix coûte', p: [
    'Le coût <b>ne se lit qu\u2019une fois l\u2019échéance tranchée</b>. Les stratégies qui tiennent les fenêtres sont en haut du tableau ; celles qui débordent sont sous le trait rouge.',
    'Ces dernières sont souvent <b>les moins chères sur le papier</b> — elles ne répondent simplement pas à la même question. Comparer leur prix à celui d\u2019une stratégie qui tient, c\u2019est comparer deux choses différentes.',
    'La barre ne montre que <b>ce que vous décidez</b> : le socle des permanents est le même dans tous les scénarios, il ne peut pas les départager.'
  ] },

  'pil.sim.plan': { t: 'Le plan de départ', p: [
    'Le même graphique, mais sur la campagne <b>entière</b> et avec la charge <b>théorique</b> : ce que le barème demandait au départ, sans rien déduire de ce qui est déjà fait.',
    'C\u2019est un <b>repère de dimensionnement</b> — utile en début de campagne, et pour préparer la suivante.',
    '<b>La décision, elle, se prend à l\u2019étape 2</b>, sur ce qu\u2019il reste réellement à faire.'
  ] },

  'pil.sim.modele': { t: 'Ce que le modèle suppose', p: [
    'Le travail <b>finit par se faire</b>, même après la campagne : une stratégie qui déborde mord sur la suivante, et <b>ce report n\u2019est pas chiffré</b>.',
    '<b>Sauf les travaux sans rattrapage</b> — la vendange. Ce qui n\u2019est pas fait dans la fenêtre est <b>perdu</b> : les heures perdues sont comptées, la <b>valeur de la récolte non rentrée ne l\u2019est pas</b>, volontairement. Mettre un prix sur une récolte perdue supposerait un cours et un rendement que Ma Vigne ne connaît pas.',
    'Les <b>heures induites par le retard</b>, elles, sont comptées : chaque semaine hors fenêtre rend le travail plus long.',
    'Les fenêtres viennent des <b>dates que vous avez saisies</b> ; ce qui est déjà fait vient de l\u2019<b>avancement réel des parcelles</b>. Le hachuré ne compte que le travail de vigne : le tracteur est déduit, la cave et l\u2019entretien ne le sont pas encore.',
    'Ces réglages se modifient dans <b>Outils \u203a Paramétrage</b>. <b>Rien n\u2019est enregistré ici</b> : une simulation ne change aucune donnée du domaine.'
  ] },

  // ══ CONFORMITÉ ══
  'pil.cfm.cuivre': { t: 'Le cuivre sur sept ans', p: [
    'Le cumul porte sur le <b>cuivre métal</b> — pas sur le poids de bouillie —, sur <b>sept années glissantes</b>, face au plafond européen de <b>28 kg/ha</b> en bio.',
    'Glissant veut dire que le compteur <b>descend</b> quand une vieille année sort de la fenêtre. Une campagne chargée n\u2019est donc pas définitive.',
    '\u26a0\ufe0f <b>Indicatif.</b> Votre organisme certificateur peut appliquer une règle plus stricte, ou compter autrement. Ce chiffre vous alerte ; c\u2019est lui qui fait foi.'
  ] },

  'pil.cfm.ift': { t: 'Passages et IFT', p: [
    'Un <b>passage</b> compte pour une intervention, quel que soit le nombre de produits mélangés dans la cuve.',
    'L\u2019<b>IFT réel</b> — dose appliquée divisée par dose homologuée — demande une <b>dose structurée</b> à la saisie du traitement. Sans elle, le compteur reste sur les passages seuls.',
    'La <b>référence régionale</b> à laquelle vos passages sont comparés est réglable : ce n\u2019est pas une norme, c\u2019est un repère de comparaison entre domaines voisins.'
  ] },

  'pil.cfm.dre': { t: 'Le délai de rentrée', p: [
    'Le délai est <b>dérivé des phrases de risque CLP</b> du produit : <b>6 h</b> par défaut, <b>24 h</b> ou <b>48 h</b> selon la mention portée par l\u2019étiquette.',
    'Il court à partir de la <b>fin de l\u2019application</b>, pas du début du traitement.',
    'L\u2019heure affichée est celle à partir de laquelle on peut revenir <b>sans équipement de protection</b>. Avant elle, l\u2019accès reste possible équipé — c\u2019est la réglementation qui le dit, pas le logiciel.'
  ] },

  // ══ CAVE ══
  'pil.cav.anges': { t: 'La part des anges', p: [
    'Ce que vous remettez en <b>ouillage</b> est exactement ce qui s\u2019est <b>évaporé</b> : c\u2019est une <b>mesure</b>, pas une valeur théorique tirée d\u2019un abaque.',
    'Chaque millésime a sa ligne — <b>on n\u2019ouille pas les fûts d\u2019une année avec le vin d\u2019une autre</b>.',
    '\u26a0\ufe0f Un <b>soutirage</b> retire aussi du volume sans être une évaporation. Sur un mois où vous avez soutiré, le chiffre est donc surévalué.',
    'Le calcul demande le <b>volume total saisi à chaque ouillage</b>. Sans lui, cet écran reste vide plutôt que d\u2019inventer une moyenne.'
  ] },

  'pil.cav.malo': { t: 'Soutirage et malo', p: [
    'Le soutirage se déclenche à la <b>fin de la malo</b>, pas à une date du calendrier : cet écran ne parle donc <b>jamais de retard</b>.',
    'La projection vient des valeurs d\u2019<b>acide malique mesurées</b> sur chaque cuvée, jamais d\u2019une durée moyenne.',
    '<b>Deux pentes</b> sont calculées : la moyenne sur trois analyses <b>projette la fin</b>, les deux dernières <b>détectent un blocage</b>. Une moyenne seule lisserait le décrochage et ne le verrait pas.',
    'Une remontée de malique entre deux analyses signale une <b>erreur de saisie</b> : le malique ne se recrée pas.'
  ] },

  'pil.cav.ouillage': { t: 'Les ouillages à faire', p: [
    'Chaque millésime a son <b>propre délai d\u2019alerte</b>, réglable dans les réglages du Chai : un vin jeune se rattrape plus souvent qu\u2019un vin d\u2019un an.',
    'Le <b>volume à compléter</b> est déduit des ouillages passés de la cuvée — pas d\u2019une moyenne théorique par fût.',
    'Un fût qui n\u2019a jamais été ouillé n\u2019a pas d\u2019historique : l\u2019écran le signale plutôt que de lui prêter le comportement des autres.'
  ] },

  'pil.cav.rdt': { t: 'Rendement face au plafond', p: [
    'Le <b>trait vertical</b> est le plafond que vous avez renseigné <b>par parcelle</b>, depuis Le millésime. Ce n\u2019est pas une valeur du logiciel.',
    'L\u2019échelle va jusqu\u2019à <b>115 % du plafond</b> : c\u2019est ce qui permet à un dépassement de se voir déborder, au lieu d\u2019être écrasé contre le bord.',
    'Les parcelles <b>sans plafond renseigné</b> n\u2019entrent pas dans la comparaison — elles sont listées à part plutôt que comptées comme conformes.'
  ] },

  // ══ LA CAMPAGNE ══
  'pil.avc.temps': { t: 'Où va le temps de l\u2019équipe', p: [
    'La répartition compte la <b>présence au planning</b>, découpée entre vigne, tracteur et le reste. Elle ne vient pas du journal : le journal dit <b>qui</b> a travaillé, jamais combien d\u2019heures.',
    '<b>Une moyenne n\u2019est pas un pic.</b> Cet écran donne une moyenne sur la campagne ; la <b>frise des 52 semaines</b>, dans « L\u2019année », donne la semaine la plus chargée — et c\u2019est elle qui décide d\u2019un recrutement.',
    'Le poste « Autres » se vide à mesure que vous renseignez un <b>barème h/ha par activité</b> dans Réglages \u203a Tracteur : tant qu\u2019il est vide, le tracteur ne peut pas être détaché du reste.'
  ] },

  'pil.eco.revient': { t: 'Le prix de revient', p: [
    'Ce sont les <b>coûts de culture</b> : ce qu\u2019il a fallu pour amener le raisin jusqu\u2019au bout du rang. <b>Ni vinification, ni sèche, ni foncier, ni amortissement</b> — ces postes-là ne passent pas par Ma Vigne.',
    'Le coût <b>à la bouteille</b> repose sur une <b>hypothèse de conversion</b> : un nombre de kilos de raisin par col. C\u2019est un réglage, pas une mesure — il se change dans <b>Outils \u203a Paramétrage</b>, avec la journée de référence.',
    'Le coût <b>au kilo</b>, lui, ne dépend d\u2019aucune hypothèse : il divise simplement le coût de culture par la récolte pesée.',
    'Quand aucune récolte n\u2019est enregistrée, l\u2019écran le dit plutôt que d\u2019afficher un prix. Les rendements se saisissent au <b>Cuvier</b>.'
  ] },

  'pil.eco.postes': { t: 'Où part l\u2019argent', p: [
    'Les quatre postes ne sont pas connus de la même façon, et c\u2019est ce qui explique leurs écarts de fiabilité.',
    'La <b>main-d\u2019\u0153uvre vigne</b> est un <b>barème complet</b> : surface \u00d7 heures par hectare \u00d7 taux de l\u2019équipe, sur toute la période — y compris le travail qui reste à faire.',
    'Le <b>tracteur</b> et le <b>phyto</b> ne sont connus qu\u2019en <b>réalisé</b> : ils n\u2019existent que là où une session ou un traitement a été saisi. Au-delà de <b>15 % d\u2019avancement</b>, ils sont extrapolés au rythme constaté ; en dessous, ils affichent le réalisé seul, parce qu\u2019extrapoler sur trois sessions ne veut rien dire.',
    'Le <b>GNR</b>, lui, est <b>mesuré</b> : c\u2019est la somme de vos pleins, au litre près. Ce qui reste approché, c\u2019est sa <b>répartition</b> entre parcelles — un plein est rattaché à une machine et à une date, jamais à une parcelle. Le total est juste, sa ventilation est proportionnelle aux heures machine.',
    'Tant qu\u2019<b>aucun plein n\u2019est relevé</b> sur la période, le carburant repasse à l\u2019ancien calcul — heures × consommation × prix — et la ligne affiche «\u202fL ESTIMÉS\u202f». Le mot est là pour être lu.',
    'Un poste extrapolé <b>montera mécaniquement</b> au fil de la période. Ce n\u2019est pas une dérive.'
  ] },

  'pil.eco.travaux': { t: 'Le coût par travail', p: [
    'Le total d\u2019une parcelle dépend surtout de sa <b>taille</b> : une grande parcelle coûte cher parce qu\u2019elle est grande. Le coût d\u2019un <b>travail</b>, lui, se décide — mécaniser, prendre un renfort, changer la conduite. C\u2019est là qu\u2019il y a des choix à faire.',
    'Le calcul est un <b>barème</b> : surface \u00d7 heures par hectare \u00d7 taux moyen de l\u2019équipe qui l\u2019a faite. Il ne lit pas les heures du journal — le journal dit <b>qui</b> a travaillé, jamais combien d\u2019heures.',
    '<b>Main-d\u2019\u0153uvre vigne uniquement.</b> Le tracteur, le GNR et le phyto ne sont pas répartis par travail : ils n\u2019en portent pas la trace.',
    'Quand un travail dépasse durablement son barème, c\u2019est le <b>barème</b> qu\u2019on corrige dans Réglages \u203a Tâches — jamais le taux horaire.'
  ] },

  'pil.eco.parcelles': { t: 'Le tableau des parcelles', p: [
    '<b>Cliquez sur un en-tête</b> pour trier. Recliquer la même colonne inverse le sens.',
    '<b>MO</b> = main-d\u2019\u0153uvre <b>déjà faite</b>. <b>Reste</b> = main-d\u2019\u0153uvre <b>encore à faire</b>. <b>Budget</b> = le total de la période, les deux réunis.',
    '<b>Tracteur et phyto</b> sont du <b>réalisé</b> : seulement ce qui a été saisi, sans projection. Le <b>GNR</b> est l\u2019enveloppe réelle de vos pleins, répartie entre les parcelles au prorata des heures machine — à défaut d\u2019heures saisies, au prorata de la <b>surface</b>.',
    'Le <b>coût à l\u2019hectare</b> neutralise la taille. Ce qui reste, c\u2019est ce qu\u2019une parcelle a de particulier : plants à remplacer, passages en plus, équipe plus chère, tri des tâches.',
    'La répartition d\u2019une journée entre plusieurs parcelles suit une <b>règle 1/N</b> : c\u2019est la seule convention inventée par le logiciel, et elle suppose qu\u2019une parcelle se fait dans la journée.'
  ] },

  'pil.exo.postes': { t: 'Les quatre postes de l\u2019exercice', p: [
    '<b>Quatre postes, et rien d\u2019autre</b> : les salaires, le carburant, les achats d\u2019intrants et les r\u00e9parations (les passages chez le r\u00e9parateur, \u00e0 leur date de retour).',
    'La <b>conduite</b> du tracteur est déjà dans les salaires — c\u2019est du temps de travail payé. La compter une seconde fois au poste tracteur reviendrait à <b>payer deux fois le tractoriste</b>. Seul son <b>carburant</b> s\u2019ajoute.',
    'Le graphique <b>mois par mois</b> montre ce qui est sorti, à la date où c\u2019est sorti. Un exercice viticole n\u2019est pas régulier : la taille en hiver, les vendanges à l\u2019automne, un creux en été. Ces bosses sont normales — c\u2019est justement ce qu\u2019on vient regarder.',
    'Sur un exercice <b>en cours</b>, les mois à venir sont à zéro parce qu\u2019ils n\u2019ont rien à montrer, pas parce qu\u2019ils ne coûteront rien.'
  ] },

  'pil.exo.ateliers': { t: 'Vigne, cave, tracteur — et ce que ça ne dit pas', p: [
    'Cette carte lit <b>les mêmes euros</b> que celle du dessus, autrement. Par <b>nature</b>, elle répond à « qu\u2019ai-je payé » ; par <b>atelier</b>, à « pour quoi ». Deux lectures, jamais deux totaux : la somme des ateliers est exactement celle des sources, et la ligne de contrôle l\u2019affiche sous le tableau.',
    '<b>L\u2019atelier ne se saisit pas</b>, il se déduit. Un produit phyto part sur la vigne, un produit œno dans la cave, le carburant au tracteur. Une intervention passe au tracteur d\u2019office, parce qu\u2019une machine chez le réparateur, c\u2019est le tracteur qui coûte.',
    '<b>Les salaires n\u2019y sont pas, et ce n\u2019est pas un oubli.</b> Une entrée de planning porte des heures, un type de congé, un motif d\u2019absence — jamais une activité. Rien ne dit si une journée est partie à la vigne ou à la cuverie. Seule la conduite du tracteur est mesurée, et elle <b>reste</b> dans la masse salariale : ici on ne compte que son carburant, sinon la même heure serait payée deux fois.',
    '<b>« Non affecté » est affiché exprès.</b> Sans ce seau, un achat qui ne rentre dans aucune case serait rangé de force ailleurs, et le total mentirait avec l\u2019autorité d\u2019un chiffre.',
    'Ce qui <b>n\u2019entre pas</b> : le matériel, les outils portés, les fûts <b>achetés</b>. On ne les rachète pas l\u2019an prochain, et un fût a déjà sa durée de vie et son écran de renouvellement. Une <b>location</b> de fûts, elle, entre : c\u2019est un loyer annuel.'
  ] },

  'pil.exo.salaires': { t: 'Heures payées, heures au champ', p: [
    'Les <b>heures payées</b> incluent les congés payés, les récupérations et les absences rémunérées. Les <b>heures au champ</b> ne comptent que le travail effectif.',
    'L\u2019écart entre les deux, ce sont donc précisément <b>les congés et les absences rémunérées</b>. Il est normal ; c\u2019est son évolution qui parle.',
    'Une <b>ligne d\u2019équipe</b> compte son effectif réel, jour par jour : une équipe de quatre sur trois jours vaut douze journées-personne, pas trois.',
    '\u{1F512} Ce tableau nomme la rémunération de chaque personne : il est réservé aux administrateurs, comme partout ailleurs dans Ma Vigne.'
  ] },

  'pil.exo.remarques': { t: 'Les remarques du moment', p: [
    'Aucune remarque à afficher pour l\u2019instant. Ouvrez l\u2019onglet Économie \u203a Exercice pour que cette fiche se remplisse.'
  ] },

  'pil.exo.fiabilite': { t: 'Fiabilité de l\u2019exercice', p: [
    'Une donnée manquante ne rend pas le total <b>approximatif</b> : elle met un poste entier à <b>zéro</b>. Un exercice auquel il manque les salaires n\u2019est pas « un peu bas », il est faux.',
    '<b>Le planning</b> doit avoir été ouvert au moins une fois dans cette session : c\u2019est lui qui porte les heures payées. Sans lui, les salaires — le premier poste — comptent pour zéro.',
    '<b>Taux horaire</b> — dans la fiche de chaque salarié, Réglages \u203a Équipe. C\u2019est le taux <b>chargé</b> : coût employeur, cotisations patronales comprises. Aucun coefficient n\u2019est ajouté par-dessus.',
    '<b>Prix du GNR</b> — déduit des appoints de cuve saisis dans Tracteur \u203a Entretien, en moyenne pondérée arrêtée à la date de chaque plein.',
    '<b>Les pleins</b> — ce sont eux qui <b>font</b> le poste carburant, chacun à sa date. Un plein coché sans litres ne compte pas : leur nombre est affiché sur la ligne, pour que «\u202fpeu de carburant\u202f» ne se confonde jamais avec «\u202fmal relevé\u202f».',
    '<b>Prix HT des achats</b> — il se complète sur la ligne d\u2019achat, dans La Réserve. Sans lui, l\u2019intrant entre en stock sans entrer dans le total.'
  ] },

  'pil.exo.garde': { t: 'Ce que ce total ne contient pas', p: [
    'Ma Vigne connaît <b>ce qui passe par elle</b> : les heures payées, le carburant, les achats d\u2019intrants. C\u2019est déjà l\u2019essentiel de vos charges d\u2019exploitation, et c\u2019est ce qui se pilote au fil de l\u2019année.',
    'Elle ne connaît <b>ni le fermage, ni les amortissements, ni les assurances, ni vos cotisations d\u2019exploitant, ni l\u2019embouteillage, ni les frais généraux</b> — elle ne les voit jamais passer.',
    'Ce chiffre sert donc à <b>piloter vos charges d\u2019un bilan à l\u2019autre</b> : voir si elles montent, où, et pourquoi. Il ne remplace pas votre comptable, et il ne se compare pas ligne à ligne à son bilan.',
    'Le <b>produit consommé en traitements</b> n\u2019y est pas non plus : c\u2019est une sortie de stock, et l\u2019achat a déjà été compté le jour de la facture. Le compter deux fois gonflerait le total.'
  ] },

  'pil.equipe': { t: 'Équipe', p: [
    'Le compte est un nombre de <b>personnes</b>, pas de fiches. Une <b>équipe collective</b> est une seule fiche mais compte pour son effectif réel — sinon l\u2019écran afficherait « 2 actifs » en pleine vendange.',
    'Une personne compte si elle est <b>sous contrat à la date affichée</b>, pas si sa fiche est marquée active. Un saisonnier dont le CDD s\u2019est terminé sort du compte le lendemain, même si personne n\u2019a touché à sa fiche. Passer quelqu\u2019un en « inactif » sert à ne plus avoir à le sélectionner tous les jours ; ça ne retire rien de ce qu\u2019il a fait.',
    'Une fiche <b>sans aucune date de contrat</b> est traitée comme un CDI depuis le début : elle compte sur toutes les périodes, y compris les campagnes archivées.',
    'Le <b>bureau</b> est compté ici, mais <b>pas</b> dans la capacité à la vigne : il ne travaille pas les rangs. C\u2019est pour ça que les deux chiffres diffèrent.'
  ] },

  'pil.presences': { t: 'Présences du jour', p: [
    'Le compte est celui des personnes <b>au champ aujourd\u2019hui</b> : hors bureau, hors absents. Une équipe collective compte pour son effectif réel.',
    'La source est le <b>planning</b>, jamais le journal. Le journal dit qui a travaillé sur quoi ; il ne dit pas combien d\u2019heures ni qui était là.',
    '<b>Ce chiffre ne se compare ni au pic ni à la moyenne</b> affichés ailleurs sur cet écran : ce sont d\u2019autres fenêtres. Le pic peut tomber dans onze mois.'
  ] },

  'pil.tracteur': { t: 'Parc tracteur', p: [
    'Le compte inclut les machines de traitement, signalées « pulvé ».',
    'Les heures avant révision se décomptent des <b>sessions saisies</b>. Une session non saisie ne fait pas avancer le compteur : l\u2019échéance affichée est donc au plus tôt, jamais au plus tard.',
    'Une machine <b>en réparation</b> reste dans le parc et dans le compte — elle existe toujours, elle n\u2019est simplement pas disponible. Le nombre en orange à côté du total dit combien.'
  ] },

  'pil.gnr': { t: 'Cuve GNR', p: [
    'Le niveau est <b>calculé, pas mesuré</b> : appoints de cuve saisis, moins les <b>pleins</b> faits dans les machines. Il n\u2019y a pas de jauge connectée à la cuve. Un plein oublié le fait dériver — pas une session non saisie, qui ne touche jamais le niveau.',
    'Le <b>seuil bas</b> est celui que vous avez réglé dans Tracteur \u203a Entretien, pas une valeur du logiciel.',
    'Le prix au litre est la <b>moyenne pondérée des appoints</b>, arrêtée <b>à la date de chaque plein</b> : un plein de mars ne se valorise pas au prix moyen incluant les livraisons de septembre. Sans aucun appoint, le carburant reste à <b>zéro</b> dans tous les coûts — pas «\u202fà peu près\u202f», à zéro.',
    'Ces mêmes pleins <b>sont</b> le coût carburant du Pilotage. Un plein non noté n\u2019est pas seulement un niveau de cuve faux : c\u2019est du carburant absent de vos coûts.'
  ] },

  'pil.phyto': { t: 'Registre phyto', p: [
    'Un <b>passage</b> compte pour une intervention, quel que soit le nombre de produits mélangés dans la cuve.',
    'Les produits sont rattachés au <b>catalogue officiel E-Phy</b> (ANSES). C\u2019est lui qui porte les usages autorisés, les doses homologuées et les délais.',
    'L\u2019<b>IFT réel</b> — dose appliquée divisée par dose homologuée — demande une dose structurée à la saisie. Sans elle, ni l\u2019IFT ni le coût des produits ne peuvent être calculés.',
    'Ce compte est celui de la <b>campagne consultée</b>. Le cuivre, lui, se suit sur sept ans glissants : il a son propre écran, dans Conformité.'
  ] },

  'pil.traitement': { t: 'Fenêtre de traitement', p: [
    'Les créneaux sont calculés sur les <b>prévisions horaires AROME</b> de Météo-France, avec trois conditions réunies sur la même heure : <b>sec</b> (moins de 0,1 mm), <b>vent sous 19 km/h</b>, <b>température sous 25 °C</b>.',
    'Au-delà de 25 °C, risque de <b>phytotoxicité</b> — soufre, cuivre, foliaires — et efficacité en baisse. Au-delà de 19 km/h, l\u2019application est <b>interdite</b>.',
    'Le badge « lessivage » signale une <b>pluie annoncée dans les heures qui suivent</b> la fin du créneau : le produit part avant d\u2019avoir agi.',
    '<b>La météo ne dit rien de vos obligations.</b> Vérifiez vous-même le délai avant récolte (DAR), le délai de rentrée (DRE) et la zone non traitée (ZNT) du produit choisi.',
    '⚠️ Ce n\u2019est <b>pas</b> un risque maladie. Ma Vigne ne modélise ni mildiou ni oïdium : un modèle faux serait pire que rien.'
  ] },

  'pil.cadres': { t: 'Pourquoi les deux totaux diffèrent', p: [
    'Une campagne <b>à cheval</b> sur la clôture est partagée entre deux bilans. Une campagne <b>entièrement hors</b> de l\u2019exercice n\u2019y apparaît pas du tout, alors qu\u2019elle appartient bien à un cycle de vigne. À l\u2019inverse, un hiver qui <b>ouvre</b> le cycle suivant tombe dans cet exercice sans appartenir à cette année vigne.',
    'Seules les lignes marquées <b>année vigne</b> entrent dans le total de droite.',
    'Les heures du tableau sont du <b>barème</b> : ce que le travail devrait prendre, pas ce qu\u2019il a pris.',
    'Le coût de l\u2019exercice vient d\u2019<b>Économie \u203a Exercice</b>, qui cadre déjà d\u2019un bilan à l\u2019autre. Il n\u2019est <b>pas recalculé ici</b> : un second calcul donnerait un second chiffre.',
    'Fermage, amortissements, assurances et frais généraux n\u2019y sont pas : <b>ce n\u2019est pas un compte de résultat</b>.'
  ] },

  'pil.an.budget': { t: 'Le budget de l\u2019année, mois par mois', p: [
    '<b>Deux périmètres, et c\u2019est voulu.</b> La courbe en tireté (le <b>prévu</b>) ne chiffre que le <b>travail de vigne</b> : heures/ha \u00d7 surface, étalées sur les mois par la fenêtre de chaque travail, valorisées au taux horaire moyen. La courbe pleine (le <b>dépensé</b>) porte <b>tout le domaine</b> : salaires chargés, carburant, achats d\u2019intrants \u2014 la cave, l\u2019atelier et le bureau compris.',
    '<b>L\u2019écart entre les deux n\u2019est donc pas un dépassement.</b> Pendant la vendange, la cave tourne à plein : la courbe du dépensé monte sans qu\u2019un seul rang coûte plus cher. Les deux totaux se lisent déjà, chacun sous son nom, dans la carte \u00ab Deux façons de compter l\u2019année \u00bb juste au-dessus.',
    'Pourquoi pas \u00ab barème prévu contre barème fait \u00bb, qui serait à périmètre égal ? Parce que <b>l\u2019avancement ne se connaît que sur la campagne consultée</b>. L\u2019étendre à l\u2019exercice entier donnerait un pourcentage sans dénominateur. On ne trace pas une courbe qu\u2019on ne sait pas calculer.',
    'Le dépensé <b>s\u2019arrête au mois en cours</b>. Le prolonger à plat jusqu\u2019à la clôture ferait lire \u00ab plus rien ne sort \u00bb là où il n\u2019y a pas encore de donnée.',
    'Une campagne <b>entièrement hors</b> de l\u2019exercice comptable n\u2019entre pas dans le prévu \u2014 c\u2019est le même bornage que les chiffres du haut. Une campagne <b>sans dates</b> n\u2019y entre pas non plus, et l\u2019écran la compte sous le graphe.',
    'Le taux horaire est une <b>moyenne pondérée</b> : le coût d\u2019une parcelle est un budget de saison, on ne sait pas qui fera quel rang.'
  ] }

};


// La pastille. Posee A COTE du chiffre qu'elle explique, jamais en tete d'ecran :
// une notice generale ne repond a aucune question precise.
// ⚠️ `type="button"` : sans lui, un bouton dans un formulaire le soumet.
export function _mvInfoBtn(cle) {
  return '<button type="button" class="mv-i" data-mvi="' + _escAttr(cle)
       + '" aria-label="D\u2019ou vient ce chiffre"><span aria-hidden="true">i</span></button>';
}

// ═══════════════════════════════════════════════════════════════════════════
// LES ICONES — lot DS-1
// ═══════════════════════════════════════════════════════════════════════════
// Un emoji se dessine autrement sur chaque systeme, ne s'aligne pas sur le
// texte et ne prend pas la couleur qui l'entoure. Il est remplace par un
// sprite de <symbol> pose dans index.html, tire par <use>.
//
// ⚠️ TROIS ECRITURES, TROIS USAGES — ne pas les confondre :
//   · `_mvIcon(nom, taille)`       → dans une chaine HTML DE L'APPLICATION.
//   · `_mvIconInline(nom, taille)` → dans un DOCUMENT IMPRIME. Une page ouverte
//        dans un autre onglet n'a pas le sprite : <use href="#ic-x"> n'y rend
//        RIEN. On y recopie donc la forme, relue dans le sprite du DOM — une
//        seule source, pas deux tables qui divergent.
//   · `_mvSetIcon(el, nom)`        → dans un element dont on posait le
//        `textContent`. Il accepte encore un emoji : les huit modules pas
//        encore migres (DS-M) continuent de fonctionner sans rien changer.
//
// ⚠️⚠️ UN SYMBOLE ABSENT NE REND RIEN, EN SILENCE. C'est exactement le piege
//   du repli CSS. Trois filets : le harnais l'interdit en CI
//   (scripts/mv-harnais-icones.mjs), `_mvIcon` rend un CARRE POINTILLE visible
//   au lieu du vide, et l'incident part au journal. Une faute doit se voir.
var _MV_IC_SET = null;        // noms lus dans le sprite, une fois
var _MV_IC_DIT = {};          // pour ne pas noyer le journal du meme nom

function _mvIconNoms() {
  if (_MV_IC_SET) return _MV_IC_SET;
  if (typeof document === 'undefined') return null;   // Node : pas de DOM
  var sp = document.getElementById('mv-sprite');
  if (!sp) return null;                               // pas encore analyse : on ne bloque pas
  var m = {}, l = sp.querySelectorAll('symbol[id^="ic-"]');
  for (var i = 0; i < l.length; i++) m[l[i].id.slice(3)] = 1;
  _MV_IC_SET = m;
  return m;
}
function _mvIconInconnue(nom) {
  if (_MV_IC_DIT[nom]) return;
  _MV_IC_DIT[nom] = 1;
  if (window.logError) window.logError({ level: 'info', cat: 'icone', msg: 'icone inconnue : ' + nom });
}

export function _mvIcon(nom, taille) {
  var n = String(nom == null ? '' : nom);
  var t = (taille > 0) ? taille : 16;
  var noms = _mvIconNoms();
  if (noms && !noms[n]) {
    _mvIconInconnue(n);
    // ⚠️ Le repli est POINTILLE : un trait plein se confondrait avec une icone,
    //   un pointille ne ressemble a rien d'autre qu'a une faute.
    return '<svg class="mv-ic mv-ic-abs" width="' + t + '" height="' + t + '" viewBox="0 0 24 24"'
         + ' role="img" aria-label="icone manquante"><rect x="3.5" y="3.5" width="17" height="17" rx="3"'
         + ' stroke-dasharray="3 2.5"></rect></svg>';
  }
  return '<svg class="mv-ic" width="' + t + '" height="' + t + '" viewBox="0 0 24 24"'
       + ' aria-hidden="true" focusable="false"><use href="#ic-' + n + '"></use></svg>';
}

// L'ETAT, EN BADGE (charte DS-2). Quatre tons, pas un de plus :
//   'vert' fait / 'ambre' en cours / 'rouge' bloquant / 'neutre' a faire.
// ⚠️ L'ensemble est FERME. Un cinquieme ton, et deux ecrans finissent par
//   dire la meme chose de deux couleurs differentes — c'est exactement ce
//   qu'on vient de corriger. Un ton inconnu retombe sur 'neutre' ET part au
//   journal : il ne disparait pas en silence.
export var MV_TONS = ['vert', 'ambre', 'rouge', 'neutre'];
export function _mvBadge(texte, ton) {
  var t = MV_TONS.indexOf(ton) >= 0 ? ton : 'neutre';
  if (t !== ton && window.logError)
    window.logError({ level: 'info', cat: 'badge', msg: 'ton inconnu : ' + ton });
  return '<span class="mv-bdg mv-bdg-' + t + '">' + _escHtml(String(texte == null ? '' : texte)) + '</span>';
}

// L'icone dans son CARRE TEINTE. A reserver aux LIGNES et aux RUBRIQUES : dans
// une pastille en ligne, un carre de 34 px ecraserait le texte a cote.
// `ton` : '' (neutre) | 'terre' | 'vert' | 'or' | 'rouge'.
// ⚠⚠ L'ENSEMBLE DES TONS EST FERME, ET IL EST DIFFERENT DE MV_TONS.
//   `_mvBadge` parle d'ETAT (vert/ambre/rouge/neutre) ; la tuile parle de
//   FAMILLE (terre/vert/or/rouge) et n'a pas d'ambre. Deux ensembles, deux
//   sens — les confondre ferait dire a une tuile ce qu'elle ne dit pas.
// ★ Un ton inconnu retombe sur la tuile neutre ET part au journal, comme
//   `_mvBadge` et `_mvIcon`. Vecu le jour ou la tuile s'est mise a porter des
//   tons : elle prenait n'importe quelle chaine et rendait une classe CSS
//   inexistante — fond transparent, aucune erreur, aucune trace.
export var MV_TUILE_TONS = ['terre', 'vert', 'or', 'rouge'];
export function _mvIconTuile(nom, ton) {
  var t = ton ? ton : '';
  if (t && MV_TUILE_TONS.indexOf(t) < 0) {
    if (window.logError) window.logError({ level: 'info', cat: 'tuile', msg: 'ton inconnu : ' + t });
    t = '';
  }
  return '<span class="mv-ict' + (t ? ' mv-ict-' + t : '') + '">' + _mvIcon(nom, 18) + '</span>';
}

// La meme icone, autonome, pour un document qui part dans un autre onglet.
// ⚠️ Les attributs de trace sont portes par la balise : le document imprime
//   n'a pas styles.css, donc pas de .mv-ic.
export function _mvIconInline(nom, taille) {
  var n = String(nom == null ? '' : nom);
  var t = (taille > 0) ? taille : 13;
  var sym = (typeof document !== 'undefined') ? document.getElementById('ic-' + n) : null;
  if (!sym) { _mvIconInconnue(n); return ''; }
  return '<svg width="' + t + '" height="' + t + '" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"'
       + ' fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"'
       + ' stroke-linejoin="round" style="vertical-align:-0.15em;flex-shrink:0">' + sym.innerHTML + '</svg>';
}

// Poser une icone la ou le code posait un emoji en `textContent`.
// ⚠️ Un nom d'icone ne contient que des minuscules : c'est ce qui permet de
//   distinguer « corbeille » (une icone) de « 🗑️ » (un emoji d'un module pas
//   encore migre) sans casser ces modules.
export function _mvSetIcon(el, val, taille) {
  if (!el) return;
  var v = String(val == null ? '' : val);
  var noms = _mvIconNoms();
  if (/^[a-z][a-z0-9-]*$/.test(v) && (!noms || noms[v])) el.innerHTML = _mvIcon(v, taille || 26);
  else el.textContent = v;
}

// ── L'icone d'un TRAVAIL ────────────────────────────────────────────────────
// Ce qui reste de TEMOJI : une correspondance travail -> NOM D'ICONE, pour les
// rares endroits ou un pictogramme sert encore. Plus aucun emoji.
export const TACHE_ICO = {
  Taille:'secateur', Tirage:'retour', Brulage:'flamme', Pliage:'lien', Reparation:'outil',
  Plantation:'pousse', Entreplantation:'pousse',
  Ebourgeonnage:'feuille', Ebourgeonnage1:'feuille', Ebourgeonnage2:'feuille',
  Pioche:'beche', Relevage:'rang', Accolage:'lien', Palissage:'rang',
  Arrachage:'beche', Desherbage:'beche', Effeuillage:'feuille', Vendange:'raisin',
  'R\u00e9paration ponctuelle':'outil'
};
export function _mvIconTache(nom, taille) {
  return _mvIcon(TACHE_ICO[nom] || 'feuille', taille);
}

// ── L'icone d'un TYPE D'ACTIVITE tracteur ───────────────────────────────────
// Le choix est une DONNEE : il est enregistre dans `a.emoji`. On n'ecrit donc
// rien en base — les valeurs deja enregistrees (des emojis) sont traduites A
// LA LECTURE, et seules les activites modifiees passent au nom d'icone.
// Meme patron que la serie datee des salaires : migration a zero ecriture.
export const ACT_ICONES = ['tracteur','secateur','pousse','feuille','beche','goutte',
  'flamme','eclair','raisin','outil','rang','eprouvette','epingle','rotation',
  'chrono','carton','liste','lien'];
var ACT_LEGACY = {
  '\u{1F69C}':'tracteur', '\u2702':'secateur', '\u{1F331}':'pousse', '\u{1F33F}':'feuille',
  '\u{1F573}':'pousse',   '\u{1F4A7}':'goutte', '\u{1F525}':'flamme', '\u26A1':'eclair',
  '\u{1F33E}':'pousse',   '\u{1FA9A}':'outil',  '\u{1F529}':'outil',  '\u{1F9EA}':'eprouvette',
  '\u{1F6E4}':'rang',     '\u{1F4CD}':'epingle','\u{1F300}':'rotation','\u{1F504}':'rotation',
  '\u26CF':'beche',       '\u{1F517}':'lien',   '\u{1F347}':'raisin'
};
export function _actIcone(val) {
  var v = String(val == null ? '' : val);
  if (!v) return 'tracteur';
  if (/^[a-z][a-z0-9-]*$/.test(v)) return v;
  return ACT_LEGACY[v.replace(/\uFE0F/g, '')] || 'tracteur';
}

// ═══════════════════════════════════════════════════════════════════════════
// LES FICHES VIVANTES
// ═══════════════════════════════════════════════════════════════════════════
// MV_INFO est un dictionnaire ECRIT : il explique une methode, qui ne change
// pas d'un domaine a l'autre. Mais certaines explications CITENT des chiffres
// du moment — « 2 parcelles depassent de 30 % », « 3 180 € de surcout modelise ».
// Elles ne peuvent pas etre ecrites d'avance.
//
// ⚠️ ON N'OUVRE PAS UNE PORTE A DU CONTENU LIBRE. Chaque cle reste DECLAREE
//   dans MV_INFO, avec son titre et un texte de repli honnete. `_mvInfoSet` ne
//   fait que remplacer les paragraphes a l'execution. Consequences :
//     · le harnais continue de verifier statiquement que toute pastille posee
//       a une fiche — une cle vivante n'echappe pas au controle ;
//     · si le module qui la remplit n'a pas tourne, la fiche s'ouvre quand meme
//       et dit ce qu'elle sait, au lieu d'un blanc.
// ⚠️ Le contenu vient TOUJOURS du code de l'app, jamais d'une saisie : c'est ce
//   qui autorise le HTML dans les paragraphes (C19).
var MV_INFO_LIVE = {};
export function _mvInfoSet(cle, fiche) {
  if (!cle || !fiche || !Array.isArray(fiche.p)) return;
  if (!MV_INFO[cle]) {
    // Une fiche vivante sans declaration echapperait au controle statique.
    if (window.logError) window.logError({ level: 'info', cat: 'info', msg: 'MV_INFO : cle vivante non declaree ' + cle });
    return;
  }
  MV_INFO_LIVE[cle] = { t: fiche.t || MV_INFO[cle].t, p: fiche.p };
}

export function _mvInfoOpen(cle) {
  var el = document.getElementById('info-inner');
  if (!el) return;
  var f = MV_INFO_LIVE[cle] || MV_INFO[cle];
  if (!f) {
    // Une pastille morte est plus deroutante qu'une explication absente : on
    // ouvre quand meme, en le disant. Le harnais interdit ce cas en CI — s'il
    // arrive quand meme, il doit se voir, pas se taire.
    if (window.logError) window.logError({ level: 'info', cat: 'info', msg: 'MV_INFO : cle inconnue ' + cle });
    f = { t: 'Explication manquante', p: ['Cette explication n\u2019a pas encore ete ecrite (' + _escHtml(String(cle)) + ').'] };
  }
  var h = '<div class="modal-hd mva-hd">'
        + '<span class="mva-hd-ic mvi-ic" aria-hidden="true">i</span>'
        + '<div><div class="modal-title">' + _escHtml(f.t) + '</div>'
        + '<div class="modal-sub">D\u2019o\u00f9 vient ce chiffre</div></div></div>'
        + '<div class="mvi-bd">';
  // Le texte des fiches est ECRIT ICI, jamais saisi : il porte ses propres <b>.
  // Aucune donnee utilisateur ne traverse cette fonction (C19).
  for (var i = 0; i < f.p.length; i++) h += '<p>' + f.p[i] + '</p>';
  h += '</div><div class="mva-foot">'
     + '<button type="button" class="mva-fbtn" id="mvi-ok">Compris</button></div>';
  el.innerHTML = h;
  var b = document.getElementById('mvi-ok');
  if (b) b.onclick = function () { if (window.closeOv) window.closeOv(null, 'ovInfo'); };
  if (window.openOv) window.openOv('ovInfo');
}

// UN SEUL ECOUTEUR, pose une fois sur le document. Chaque module qui pose une
// pastille n'a rien a brancher.
// ⚠️⚠️ `stopPropagation` est INDISPENSABLE : la pastille vit dans l'en-tete
//   d'une tuile, et cet en-tete replie la tuile au clic. Sans lui, ouvrir la
//   fiche fermerait l'ecran qu'on cherche a comprendre.
if (typeof document !== 'undefined') {
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-mvi]') : null;
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    _mvInfoOpen(b.getAttribute('data-mvi'));
  }, true);
}

// ════ EXPOSITION GLOBALE ════
// Nécessaire pour :
//  • firebase.js qui appelle window.showSyncBadge (async, avant que app.js soit prêt)
//  • index.html onclick="setThemeMode(...)"
//  • logError() appelé depuis window.addEventListener('error', ...)
//  • Modules futurs qui n'importent pas encore depuis utils.js
window.GT_ADMIN_EMAIL     = GT_ADMIN_EMAIL;
window.MV_INFO            = MV_INFO;
window._mvInfoOpen        = _mvInfoOpen;
window._mvInfoSet         = _mvInfoSet;
window._mvInfoBtn         = _mvInfoBtn;
window._mvIcon            = _mvIcon;
window._mvIconInline      = _mvIconInline;
window._mvSetIcon         = _mvSetIcon;
window._mvIconTache       = _mvIconTache;
window._mvIconTuile       = _mvIconTuile;
window._mvBadge           = _mvBadge;
window.MV_TONS            = MV_TONS;
window.TACHE_ICO              = TACHE_ICO;
window.ACT_ICONES         = ACT_ICONES;
window._actIcone          = _actIcone;
window._PIL_SEM           = _PIL_SEM;
window.showSyncBadge      = showSyncBadge;
window.showToast          = showToast;
window.setThemeMode       = setThemeMode;
window.applyTheme         = applyTheme;
window.initTheme          = initTheme;
window.tNom               = tNom;
window.wmoDesc            = wmoDesc;
window.wmoIcone           = wmoIcone;
window.MV_METEO_IC        = MV_METEO_IC;
window.wmoEmoji           = wmoEmoji;
window.isAdmin            = isAdmin;
window.isTractoriste      = isTractoriste;
window.canSeePhyto        = canSeePhyto;
window.isSaisonnier       = isSaisonnier;
window.canWrite           = canWrite;
window.getRoleLabel       = getRoleLabel;
window.isPilotage         = isPilotage;
window.canSeePilotage     = canSeePilotage;
window.logError           = logError;
window._closeCriticalOverlay = _closeCriticalOverlay;
window.openReport         = openReport;
window.closeReport        = closeReport;
window.submitReport       = submitReport;
window.openReportLogin    = openReportLogin;
window.closeReportLogin   = closeReportLogin;
window.submitReportLogin  = submitReportLogin;
window.openAide           = openAide;
window.closeAide          = closeAide;
window._mvInjectHelpBtn   = _mvInjectHelpBtn;
/* ── UI-4 · Miroir de la barre « saison · date » ─────────────────────────────
   Cette barre n'existait que sur les 3 pages Vigne, où app.js remplit des IDs
   dédiés (#saison-badge-home / #hv2-date / #hv2-saison-pill). Les autres
   modules — Tracteur, Réglages, Planning, Cave, Le Chai — la portent désormais
   aussi, marquée [data-mv-saison] / [data-mv-date] / [data-mv-pill].
   Plutôt que d'élargir les listes d'IDs en dur d'app.js (ce qui dupliquerait la
   logique de saison consultée en autant d'endroits), on RECOPIE la source de
   vérité dès qu'elle change : un seul point d'écriture, les copies suivent —
   y compris le marquage « · consultée » porté par la classe .consult.
   Les vues rendues en JS (Le Chai) rappellent window._mvMetaSync() après
   injection : l'observateur ne surveille que la source, pas les copies.       */
function _mvMetaSync() {
  var src = document.getElementById('saison-badge-home');
  var dat = document.getElementById('hv2-date');
  var pil = document.getElementById('hv2-saison-pill');
  if (src) {
    var t = src.textContent || '';
    document.querySelectorAll('[data-mv-saison]').forEach(function (el) { if (el.textContent !== t) el.textContent = t; });
  }
  if (dat) {
    var d = dat.textContent || '';
    document.querySelectorAll('[data-mv-date]').forEach(function (el) { if (el.textContent !== d) el.textContent = d; });
  }
  var cons = !!(pil && pil.classList.contains('consult'));
  document.querySelectorAll('[data-mv-pill]').forEach(function (el) { el.classList.toggle('consult', cons); });
}
function _mvMetaMirrorInit() {
  var src = document.getElementById('saison-badge-home');
  var dat = document.getElementById('hv2-date');
  var pil = document.getElementById('hv2-saison-pill');
  if (!src && !dat) return;
  var mo = new MutationObserver(function () { _mvMetaSync(); });
  if (src) mo.observe(src, { childList: true, characterData: true, subtree: true });
  if (dat) mo.observe(dat, { childList: true, characterData: true, subtree: true });
  if (pil) mo.observe(pil, { attributes: true, attributeFilter: ['class'] });
  _mvMetaSync();
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _mvMetaMirrorInit);
  else _mvMetaMirrorInit();
}
window._mvMetaSync        = _mvMetaSync;

// ════ CAMPAGNE — périodes datées ════
// Une période = { nom, debut, fin, taches:[noms], active }. Le nom est LIBRE (« Hiver »,
// « Saison verte », « Campagne 2026 ») : il n'est plus interprété. C'est la LISTE portée par la
// période qui dit quelles tâches existent, et la DATE d'une saisie qui dit à quelle période elle
// se rattache. Ces helpers vivent ici parce que getTachesSaison (app.js) et _sessInSaison
// (tracteur.js, chargé 8 modules plus tard) en dépendent tous les deux.

// Objet période par son nom.
function _saisonObj(nom){
  if(!nom) return null;
  var arr = window.SAISONS || [];
  for(var i=0;i<arr.length;i++){ if(arr[i] && arr[i].nom===nom) return arr[i]; }
  return null;
}

// Période dont [debut,fin] contient la date (ISO 'YYYY-MM-DD').
// Chevauchement -> la période ouverte le plus récemment. Trou -> '' (aucune période).
function _saisonForDate(ds){
  if(!ds) return '';
  var best=null;
  (window.SAISONS||[]).forEach(function(s){
    if(!s || !s.debut || !s.fin) return;
    if(ds>=s.debut && ds<=s.fin){ if(!best || s.debut>best.debut) best=s; }
  });
  return best ? best.nom : '';
}

// Noms des tâches d'une période. null = pas encore de liste -> l'appelant retombe sur l'ancien
// filtre par type de saison (repli, cf. _tachesSaisonLegacy dans app.js).
function _saisonTaches(nom){
  var s=_saisonObj(nom);
  return (s && Array.isArray(s.taches)) ? s.taches : null;
}


// ════ EFFECTIF — qui compte dans « combien on est » ════
// Un membre entre dans un effectif s'il est ACTIF *et* sous contrat A LA DATE
// consideree. Le second test n'existait QUE dans planning.js : partout ailleurs
// (Pilotage en particulier) un saisonnier dont le CDD s'etait termine restait
// compte tant que personne ne le passait « Inactif » a la main -> effectif,
// capacite au champ, cadence de secours, date de fin de chantier et taux horaire
// moyen tous surevalues, sans le moindre signal.
// La regle vit ICI, dans le premier module charge, pour qu'il n'en existe qu'UNE
// definition : deux definitions de « est-il la ? » = deux ecrans qui se
// contredisent (cf. head[] vs tetes, 26/07).
// ds = date ISO 'YYYY-MM-DD' ; comparaison lexicographique = chronologique.
// ⚠ Sans NI debut NI fin de contrat -> true (un CDI n'a pas de date de fin).
//   Corollaire assume : un CDD dont les dates ne sont pas saisies compte toujours.
window._mvEnContratLe = function(m, ds){
  if(!m) return false;
  var P = (typeof window._mvContrats === 'function') ? window._mvContrats(m) : [];
  if(!P.length) return true;   // aucune date : on ne peut rien affirmer -> present
  if(!ds) return true;
  for(var i = 0; i < P.length; i++){
    if(P[i].debut && ds < P[i].debut) continue;
    if(P[i].fin   && ds > P[i].fin)   continue;
    return true;
  }
  return false;
};

// Contrat arrive a echeance a la date consideree. Distinct de « pas encore
// commence » : seul le premier cas merite d'etre signale a l'ecran.
window._mvContratFini = function(m, ds){
  return !!(m && m.fin_contrat && ds && ds > m.fin_contrat);
};

// ════ EQUIPE COLLECTIVE — une ligne, plusieurs personnes ════
// Une vendange, c'est 30 personnes pendant 10 jours. Creer 30 fiches n'a aucun
// sens : aucune ne se connectera, aucune n'a de compteur d'annualisation a tenir,
// et la grille deviendrait illisible le seul mois ou elle sert vraiment.
// Un membre COLLECTIF est UNE ligne qui porte un EFFECTIF. Son poids multiplie ce
// qui est collectif (heures du chantier, capacite, cout, part de l'avancement) et
// n'entre JAMAIS dans ce qui est individuel : plafond 1607 h, conges, heures sup,
// maxima legaux hebdomadaires, releve MSA. Ce n'est pas un salarie, c'est une equipe.
// La regle vit ICI, premier module charge, pour qu'il n'en existe qu'UNE definition
// (cf. head[] vs tetes, 26/07 : deux definitions = deux ecrans qui se contredisent).
window._mvEstCollectif = function(m){ return !!(m && m.collectif); };

// Effectif PAR DEFAUT de la fiche. Plancher a 1, plafond a 999 : un collectif a
// zero effacerait silencieusement son propre travail de tous les totaux, et une
// faute de frappe a 3000 fausserait la capacite d'equipe sans le moindre signal.
window._mvEffDef = function(m){
  if(!window._mvEstCollectif(m)) return 1;
  var n = parseInt(m.effectif, 10);
  return (isNaN(n) || n < 1) ? 1 : Math.min(999, n);
};

// Poids d'un NOM dans une repartition, la ou on ne dispose que d'un nom sans
// contexte de jour (repartition de l'avancement) : c'est le defaut de la fiche
// qui tranche, pas la saisie quotidienne du planning.
// Un nom inconnu vaut 1 : une entree de journal peut nommer quelqu'un dont la
// fiche a ete supprimee, et l'ignorer fausserait la somme des parts.
window._mvPoidsNom = function(nom){
  if(!nom) return 1;
  var m = (window.MEMBRES||[]).find(function(x){ return x && x.nom === nom; });
  return window._mvEffDef(m);
};

// ════ EFFECTIF SUR UNE PERIODE — la question historique ════
// _mvEnContratLe repond a « est-il la AUJOURD'HUI ? ». Ce n'est PAS la meme
// question que « a-t-il travaille pendant cette saison ? », et confondre les deux
// EFFACE LE PASSE. Le statut « Inactif » se met a la main a la fin d'un contrat —
// Pilotage le conseille meme en toutes lettres (« fiches a passer en Inactif ») —
// et il faisait alors disparaitre RETROACTIVEMENT la personne de la courbe
// d'effectif, de la capacite de l'equipe et du taux horaire moyen de la saison.
// Mesure du 03/08/2026 sur un domaine reel : 10 personnes au pic affichees comme 4.
// REGLE : hors bureau, des dates de contrat qui RECOUPENT la periode suffisent,
// quel que soit le statut d'aujourd'hui. Sans AUCUNE date on ne peut pas savoir
// quand la personne est partie -> le statut tranche (comptes de service, anciens
// salaries dont le contrat n'a jamais ete saisi).
// d0/d1 = bornes ISO 'YYYY-MM-DD' ; comparaison lexicographique = chronologique.
// ════ Heures d'une tâche à niveaux, sur UNE parcelle ════
// Un niveau marqué 'Auto' a été SAUTÉ : valider directement le dernier relevage coche
// les précédents, mais le travail n'a pas eu lieu. Il ne doit donc compter ni dans ce
// qui est fait, ni dans ce qui reste à faire.
// Règle métier arbitrée : N passages réellement faits = les N PREMIERS niveaux du
// barème. Un relevage unique est le travail d'un premier relevage (50 h), pas d'un
// troisième (25 h) — et cela ne dépend pas du bouton sur lequel on a cliqué.
// Quand plus rien n'est à faire, le prévu tombe au niveau du fait : une parcelle
// terminée en un passage ne laisse AUCUN reste, sinon on remplacerait un travail
// imaginaire par une dette imaginaire.
// Source UNIQUE : appelée par recalcTravaux (app.js) ET par pilotage.js, qui portait
// jusqu'ici sa propre copie du calcul.
// ════ Densité de plantation ════
// Le barème conventionnel est établi pour une densité de RÉFÉRENCE : 10 000 pieds/ha en
// vigne basse (1,0 m entre rangs × 1,0 m sur le rang). L'accord du 2 octobre 2023 prévoit
// expressément qu'en cas de densité différente, les temps de travaux se calculent AU
// PRORATA du nombre de pieds/hectare. Ce n'est donc pas une convention maison : c'est la
// méthode du texte. Une parcelle à 3,0 × 1,0 (3 333 pieds) demande trois fois moins de
// temps de taille qu'une parcelle à 1,0 × 1,0 — le barème brut y serait faux d'un
// facteur trois.
// ⚠️ Ces helpers ne changent AUCUN calcul d'heures. Le barème du domaine (TACHES[].hha)
// reste la seule source des heures ; la densité sert à PROPOSER une valeur ajustée dans
// l'écran du barème. Le vigneron garde la main.
// ⚠️ Neutre par défaut : sans écartements renseignés, le coefficient vaut 1 et rien ne
// bouge nulle part.
window.MV_DENS_REF = 10000;
window._mvPiedsHa = function(ecR, ecP){
  var r = Number(ecR)||0, p = Number(ecP)||0;
  if(r<=0 || p<=0) return 0;
  return Math.round(10000/(r*p));
};
window._mvVigne = function(){
  var v = (window.CONFIG && window.CONFIG.vigne) || {};
  var r = Number(v.ec_rang)||0, p = Number(v.ec_pied)||0;
  if(r<=0 || p<=0) return null;
  var n = window._mvPiedsHa(r,p);
  if(!n) return null;
  return { ec_rang:r, ec_pied:p, pieds:n };
};
window._mvDensCoef = function(){
  var v = window._mvVigne();
  if(!v || !v.pieds) return 1;
  return v.pieds / window.MV_DENS_REF;
};
// h/ha du barème conventionnel, ramenées à la densité réelle du domaine.
window._mvHhaDens = function(hha){
  var n = Number(hha);
  if(!isFinite(n)) return hha;
  var k = window._mvDensCoef();
  if(k === 1) return n;
  return Math.round(n * k);
};

window._mvNivH = function(nivs, s){
  var ref = (nivs||[]).slice().sort(function(a,b){ return (a.num||0)-(b.num||0); });
  var plein = ref.reduce(function(x,n){ return x + (Number(n.hha)||0); }, 0);
  if(!s) return { n:0, done:0, total:plein, fini:false };
  // Ancien format string : 'Validé' = tâche complète, tous les niveaux sont faits.
  if(typeof s === 'string'){
    var okS = (s === 'Validé');
    return { n: okS?ref.length:0, done: okS?plein:0, total: plein, fini: okS };
  }
  var nb=0, auto=0;
  ref.forEach(function(n){
    var v = s['n'+n.num];
    if(v === 'Validé') nb++;
    else if(v === 'Auto') auto++;
  });
  var done = ref.slice(0, nb).reduce(function(x,n){ return x + (Number(n.hha)||0); }, 0);
  var fini = ref.length>0 && (nb+auto) === ref.length;
  return { n:nb, done:done, total: fini?done:plein, fini:fini };
};

// ════ Géolocalisation d'une parcelle — SOURCE UNIQUE ════
// ⚠️ Les parcelles ne portent PAS de coordonnées propres : toute la géographie du
// domaine vit dans les polygones KML. Une fonctionnalité qui a besoin de la position
// d'une parcelle doit donc calculer le CENTROÏDE de son polygone, par correspondance
// de nom. Ce calcul vivait uniquement dans pilotage.js (ordre de passage) ; le registre
// phytosanitaire électronique en a besoin lui aussi — d'où l'extraction ici, pour qu'il
// n'existe jamais deux réponses à « où est cette parcelle ».
// Cache invalidé par référence de source : un import KML en cours de session est donc
// pris en compte immédiatement.
var _mvKmlCtrCache=null, _mvKmlCtrSrc=null;
window._mvKmlCtrs = function(){
  var src=(window.KML_POLYGONS_DYNAMIC&&window.KML_POLYGONS_DYNAMIC.length)?window.KML_POLYGONS_DYNAMIC:(window.KML_DATA||[]);
  if(_mvKmlCtrCache && _mvKmlCtrSrc===src) return _mvKmlCtrCache;
  _mvKmlCtrSrc=src; _mvKmlCtrCache={};
  src.forEach(function(k){
    if(!k||!k.name||!k.pts||!k.pts.length) return;
    var la=0, ln=0;
    k.pts.forEach(function(pt){ la+=pt[0]; ln+=pt[1]; });
    _mvKmlCtrCache[String(k.name).toLowerCase()]={lat:la/k.pts.length, lng:ln/k.pts.length};
  });
  return _mvKmlCtrCache;
};
// Coordonnées d'une parcelle : ses lat/lng propres si elles existent un jour, sinon le
// centroïde de son polygone. Renvoie null quand la parcelle n'est nulle part.
window._mvParcGeo = function(o){
  if(!o) return null;
  var la=parseFloat(o.lat), ln=parseFloat(o.lng);
  if(isFinite(la)&&isFinite(ln)&&(Math.abs(la)>0.001||Math.abs(ln)>0.001)) return {lat:la, lng:ln};
  if(o.nom){ var c=window._mvKmlCtrs()[String(o.nom).toLowerCase()]; if(c) return c; }
  return null;
};

// ══════════════════════════════════════════════════════════════════
// TOURNÉE (ordre de passage) — SOURCE UNIQUE
// ──────────────────────────────────────────────────────────────────
// L'ordre est rangé dans Pilotage › Décider et lu par l'écran Vigne. Il est
// stocké PAR TÂCHE : une équipe qui tourne d'un travail à l'autre doit voir
// le parcours DU TRAVAIL diffusé, pas un ordre global qui ne veut rien dire.
//   CONFIG.ordre_passage_t = { '<tâche>': { ordre:[noms], date:'AAAA-MM-JJ', par:'nom' } }
// L'ancien CONFIG.ordre_passage (tableau global) n'est plus écrit ; pilotage.js
// s'en sert encore comme GRAINE pour ne pas perdre un rangement déjà fait.
// Ces helpers vivent ici parce que deux fichiers en ont besoin (app.js pour le
// tri et les numéros, pilotage.js pour l'édition) : deux copies du calcul =
// deux réponses possibles à « quel est le rang de cette parcelle ».
// ⚠️ `config` est lu au démarrage (FB_STATIC, pas de temps réel) : une tournée
//    enregistrée arrive chez l'équipe à sa PROCHAINE OUVERTURE de l'app.
// ══════════════════════════════════════════════════════════════════
window._mvOrdreMap = function(){
  var m = (window.CONFIG||{}).ordre_passage_t;
  return (m && typeof m === 'object' && !Array.isArray(m)) ? m : {};
};
// Tournée d'une tâche, ou null. Aucun repli sur l'ancien tableau global :
// celui-ci avait été rangé pour un jeu de tâches inconnu, l'appliquer à toutes
// serait afficher un parcours qu'on ne peut pas justifier.
window._mvOrdreFor = function(tache){
  if(!tache) return null;
  var e = window._mvOrdreMap()[tache];
  if(e && Array.isArray(e.ordre) && e.ordre.length){
    return { tache:tache, ordre:e.ordre.slice(), date:e.date||'', par:e.par||'' };
  }
  return null;
};
// Tâches qui ont une tournée diffusée, dans l'ordre du catalogue de saison.
window._mvOrdreTaches = function(){
  var m = window._mvOrdreMap();
  var ok = Object.keys(m).filter(function(k){ var e=m[k]; return e && Array.isArray(e.ordre) && e.ordre.length; });
  var ref = [];
  try{ ref = ((typeof window.getTachesSaison==='function') ? window.getTachesSaison() : (window.TACHES||[])).map(function(t){ return t.nom; }); }catch(e){ ref = []; }
  var rank = {}; ref.forEach(function(n,i){ rank[n]=i; });
  return ok.sort(function(a,b){ var ra=(rank[a]==null?9999:rank[a]), rb=(rank[b]==null?9999:rank[b]); return (ra-rb) || String(a).localeCompare(String(b),'fr'); });
};
// NUMÉROTATION VIVANTE : le rang est recalculé sur les parcelles réellement
// affichées → 1, 2, 3… sans trou quand une parcelle est terminée. C'est déjà ce
// que fait Pilotage (_opParcelles reprojette l'ordre sur ce qui reste à faire).
// Une parcelle absente de la tournée n'a pas de rang : elle passe après.
window._mvOrdreRangs = function(tache, noms){
  var out = { rang:{}, n:0, ok:false, hors:0 };
  var o = window._mvOrdreFor(tache);
  if(!o) return out;
  out.ok = true;
  var vus = {}; (noms||[]).forEach(function(n){ if(n) vus[n]=1; });
  var k = 0;
  o.ordre.forEach(function(n){ if(vus[n] && out.rang[n]==null){ k++; out.rang[n]=k; } });
  out.n = k;
  out.hors = Math.max(0, (noms||[]).length - k);
  return out;
};

// ════ LES PERIODES DE CONTRAT D'UNE FICHE — definition UNIQUE ════════════════
// Un salarie peut avoir eu PLUSIEURS contrats : un CDD de printemps, puis un CDI
// signe quatre semaines plus tard. Le couple debut_contrat/fin_contrat ne tient
// qu'UN contrat : saisir le second ECRASAIT le premier, en silence et sans
// confirmation. Mesure du 11/08/2026 sur un domaine reel : un salarie present de
// mars a juillet puis reembauche en aout n'existait plus DU TOUT sur la campagne
// de printemps — ni dans l'effectif, ni dans la capacite, ni dans le cout.
// La perte avait lieu A LA SAISIE, pas a la lecture : aucun code ne pouvait la
// rattraper apres coup.
//
// REGLE DE TERRAIN (Nico, 12/08/2026) : deux contrats qui SE TOUCHENT — fin + 1
// jour = debut du suivant — n'en font qu'un ; « sans jour de pause entre les
// deux, ca se serait suivi ». UN SEUL jour de coupure = deux contrats distincts,
// chacun avec son propre compteur de 1607 h. Il n'y a de du ni d'un cote ni de
// l'autre : chaque contrat suit le rythme du planning a l'embauche.
//
// ⚠️ CE QUI LIT CETTE FONCTION, ET CE QUI NE LA LIT PAS. Trois questions
// distinctes, qu'un seul couple de dates confondait :
//   1. « est-il la AUJOURD'HUI ? »            -> _mvEnContratLe
//   2. « a-t-il travaille pendant CETTE PERIODE ? » -> _mvEnContratSurPeriode,
//      _inContractDay et _planJourCouvert (planning.js) : ces trois-la voient
//      TOUS les contrats, c'est le sens meme de la question, et c'est ce qui
//      effacait le passe. _planJourCouvert est le portail des MESURES DE
//      FENETRE : masse salariale de l'exercice, capacite, cadence, presence.
//      Il se pose via _planWide(), jamais en dur.
//   3. « combien d'heures lui doit-on sur CE contrat ? » -> _planInContract
//      (planning.js) : plafond des 1607 h, conges, grille. Celui-la ne voit QUE
//      le contrat en cours et NE DOIT PAS changer. Elargir le prorata melangerait
//      deux contrats en un seul compteur. Un contrat qui se termine SOLDE son
//      compteur (paye, donc a zero) ; le suivant repart de sa date de debut,
//      sans du ni indu.
// Le couple debut_contrat/fin_contrat garde donc exactement son sens : le contrat
// EN COURS, celui que lit la paie. m.contrats[] ne porte que les PRECEDENTS.
// ══════════════════════════════════════════════════════════════════════
// QUI EST SOUMIS A L'ANNUALISATION — une seule definition, ici
// ══════════════════════════════════════════════════════════════════════
// TESA, saisonniers et extras sont payes A L'HEURE : pas de plafond annuel,
// pas de modulation, pas de compteur qui se solde au 31 decembre. Leur
// afficher un plafond de 1607 h proratise, c'est afficher un nombre qu'ils
// ne toucheront jamais — et un nombre faux se defend tout seul dans une
// discussion de bulletin, parce qu'il a l'autorite d'une mesure.
// ⚠️ PAS de derogation par fiche : une option que personne ne regle
// correctement est pire que pas d'option.
// ⚠️ La liste enumere ce qu'on RETIRE, pas ce qu'on garde. Une liste d'inclusion
// ferait sortir de l'annualisation tout type absent de la liste — un libelle
// futur, une donnee importee, une faute de frappe — et ferait donc DISPARAITRE
// un compteur en silence. Ici, tout ce qui n'est pas nomme reste annualise :
// un domaine existant garde exactement le compteur qu'il avait.
window.MV_HORS_ANNU = ['TESA', 'Saisonnier', 'Extra'];
window._mvAnnualise = function(m){
  if(!m) return true;
  // Une ligne d'equipe collective n'a deja ni compteur, ni conges, ni releve
  // individuel : ces compteurs sont propres a UN salarie.
  if(window._mvEstCollectif && window._mvEstCollectif(m)) return false;
  return window.MV_HORS_ANNU.indexOf(m.type_contrat || 'CDI') < 0;
};

// ══════════════════════════════════════════════════════════════════════
// LE JOURNAL DU SALARIE — une seule verite datee
// ══════════════════════════════════════════════════════════════════════
// AVANT ce lot, la vie contractuelle d'un salarie vivait a quatre endroits
// qui ne se parlaient pas : le couple debut/fin (contrat en cours),
// m.contrats[] (les precedents), le couple renouvellement_* (une alerte, et
// renouvellement_fin n'etait LU nulle part), et PAIE.taux_serie (le salaire).
// Deux d'entre eux seulement etaient dates ET lus.
//
// Desormais m.hist[] est la SOURCE. Trois evenements :
//   embauche       {d, type, fin?}  ouvre un contrat ; fin = fin PREVUE
//   renouvellement {d, fin}         repousse la fin SANS couper -> meme contrat
//   fin            {d}              clot au jour d (fin reelle, prime sur la prevue)
// Le salaire reste dans PAIE.taux_serie : `membres` est lisible par toute
// l'equipe, `paie` est admin-only (firestore.rules). Le modele DOIT rester en
// deux morceaux ; on les fusionne a la lecture, jamais dans le document.
//
// ★ MIGRATION A ZERO ECRITURE. Journal absent -> il est DERIVE a la lecture
// depuis contrats[] + le couple courant. Rien n'est ecrit tant que la fiche
// n'est pas enregistree. Un domaine qui n'ouvre jamais une fiche calcule
// exactement comme avant, a l'octet pres.
//
// ★★ LES ANCIENS CHAMPS DEVIENNENT DES MIROIRS. _mvHistMirror() les reecrit
// depuis le journal a chaque enregistrement, si bien que les ~40 points de
// lecture existants (paie, compteur 1607 h, conges, MSA, Pilotage) n'ont pas
// bouge d'une ligne. Meme patron que taux[nom] retrograde en miroir de
// taux_serie[nom] (§36).
window.MV_HIST_TYPES = ['embauche', 'renouvellement', 'fin'];

// Journal NORMALISE et trie. Derive si absent. Ne modifie jamais m.
window._mvHist = function(m){
  if(!m) return [];
  var H = [];
  if(Array.isArray(m.hist) && m.hist.length){
    m.hist.forEach(function(e){
      if(!e || !e.d) return;
      if(window.MV_HIST_TYPES.indexOf(e.t) < 0) return;
      var o = { d: String(e.d), t: e.t };
      if(e.type)   o.type   = String(e.type);
      if(e.fin)    o.fin    = String(e.fin);
      if(e.grille) o.grille = String(e.grille);
      H.push(o);
    });
  } else {
    // DERIVATION depuis l'ancien modele. Une periode = une embauche portant sa
    // fin PREVUE : c'est exactement l'information que l'ancien modele contenait,
    // ni plus ni moins. Aucun evenement `fin` n'est invente — on ne sait pas si
    // la fin etait prevue ou subie, et l'affirmer serait ajouter un fait.
    (m.contrats || []).forEach(function(c){
      if(!c || !(c.debut || c.fin)) return;
      var o = { d: c.debut || '', t: 'embauche' };
      if(c.type)   o.type   = String(c.type);
      if(c.fin)    o.fin    = String(c.fin);
      if(c.grille) o.grille = String(c.grille);
      H.push(o);
    });
    if(m.debut_contrat || m.fin_contrat){
      var k = { d: m.debut_contrat || '', t: 'embauche' };
      if(m.type_contrat) k.type = String(m.type_contrat);
      if(m.fin_contrat)  k.fin  = String(m.fin_contrat);
      // La grille du contrat EN COURS vient de m.planning_id, le champ que lit
      // deja _planPlId. Elle n'est pas inventee : absente, elle reste absente.
      if(m.planning_id)  k.grille = String(m.planning_id);
      H.push(k);
    }
  }
  // Tri par date. ⚠️ Tri STABLE (garanti depuis ES2019) : deux evenements du
  // meme jour gardent l'ordre de saisie, sans quoi une fin et une embauche
  // posees le meme jour pourraient s'inverser d'un rendu a l'autre.
  H.sort(function(a, b){ return String(a.d || '0000-00-00').localeCompare(String(b.d || '0000-00-00')); });
  return H;
};

// Periodes CONTRACTUELLES, dans l'ordre, NON fusionnees : chacune garde son
// type. C'est ce que lit _mvSalarieAt ; _mvContrats, lui, fusionne.
window._mvPeriodes = function(m){
  var H = window._mvHist(m), P = [], cur = null;
  for(var i = 0; i < H.length; i++){
    var e = H[i];
    if(e.t === 'embauche'){
      // ⚠️ type '' et non 'CDI' : une fiche ancienne peut porter un contrat
      // archive SANS type. Ecrire 'CDI' par defaut inventerait un fait — et
      // le premier enregistrement transformerait un saisonnier en permanent.
      // L'inconnu reste inconnu ; les lecteurs appliquent leur propre defaut.
      cur = { debut: e.d || '', fin: e.fin || '', type: e.type || '', grille: e.grille || '' };
      P.push(cur);
    } else if(e.t === 'renouvellement'){
      // Repousse la fin du contrat OUVERT. Sans contrat ouvert l'evenement est
      // ignore plutot que d'en inventer un : un renouvellement ne cree pas un
      // emploi, il en prolonge un.
      if(cur) cur.fin = e.fin || '';
    } else if(e.t === 'fin'){
      // La fin REELLE prime sur la fin prevue, dans les deux sens : une rupture
      // anticipee raccourcit, une fin constatee plus tard allonge.
      if(cur){ cur.fin = e.d || ''; cur = null; }
    }
  }
  return P;
};

// « Qu'etait-il ce jour-la ? » — le contrat couvrant iso, ou null.
// Le taux vient de PAIE (_mvPaieTauxEffAt), collection separee : il n'est pas
// joint ici, sinon la fonction ne serait utilisable que par un administrateur.
window._mvSalarieAt = function(m, iso){
  if(!m || !iso) return null;
  var P = window._mvPeriodes(m);
  for(var i = 0; i < P.length; i++){
    var p = P[i];
    if(p.debut && iso < p.debut) continue;
    if(p.fin && iso > p.fin) continue;
    return { debut: p.debut, fin: p.fin, type: p.type, grille: p.grille };
  }
  return null;
};

// Reecrit les MIROIRS depuis le journal. Appele a l'enregistrement, jamais a la
// lecture. La derniere periode est le contrat EN COURS (celui que lisent la paie
// et le compteur des 1607 h) ; les precedentes vont dans contrats[].
// ⚠️ Doit etre l'IDENTITE sur une fiche jamais migree : deriver puis remiroiter
// ne doit rien changer, sinon le premier enregistrement d'une fiche reecrirait
// ses dates en silence. C'est la propriete que le harnais verifie en premier.
window._mvHistMirror = function(m){
  if(!m) return m;
  var P = window._mvPeriodes(m);
  if(!P.length){
    m.debut_contrat = ''; m.fin_contrat = '';
    delete m.contrats;
    return m;
  }
  var last = P[P.length - 1], prev = P.slice(0, -1);
  m.debut_contrat = last.debut || '';
  m.fin_contrat   = last.fin || '';
  // Un type inconnu ne s'ecrit pas : on laisse le champ tel quel plutot que d'y
  // poser 'CDI'. Ecrire un defaut ici, c'est fabriquer une donnee contractuelle.
  if(last.type) m.type_contrat = last.type;
  // ★ LA GRILLE EST PORTEE PAR LE CONTRAT. Mesure du 13/08 : _planPlId est
  // affecte HORS BOUCLE dans 26 fonctions, et les modeles eux-memes sont deja
  // dates a l'annee (PLANNING_TEMPLATES[annee]). Dater l'affectation au JOUR
  // aurait donc melange deux granularites sur le meme calcul — la signature
  // exacte des defauts qu'on vient de corriger. La grille change avec le
  // contrat, ce qui est aussi la realite : passer a temps partiel est un
  // avenant. m.planning_id reste le champ lu, il devient un miroir.
  if(last.grille) m.planning_id = last.grille;
  if(prev.length){
    m.contrats = prev.map(function(p){
      var o = { debut: p.debut || '', fin: p.fin || '' };
      if(p.type)   o.type   = p.type;
      if(p.grille) o.grille = p.grille;
      return o;
    });
  } else delete m.contrats;
  return m;
};

window._mvContrats = function(m){
  if(!m) return [];
  // Meme sortie qu'avant ce lot — la fusion (contiguite/chevauchement) est
  // inchangee. Seule la PROVENANCE des periodes change : le journal au lieu du
  // couple + contrats[]. Sur une fiche non migree les deux donnent la meme liste.
  var out = window._mvPeriodes(m).map(function(p){
    return { debut: p.debut || '', fin: p.fin || '' };
  });
  if(!out.length) return [];
  // Un debut vide = ouvert a gauche (trie en premier) ; une fin vide = ouverte a
  // droite (absorbe tout ce qui suit).
  out.sort(function(a, b){ return String(a.debut || '0000-00-00').localeCompare(String(b.debut || '0000-00-00')); });
  var res = [{ debut: out[0].debut, fin: out[0].fin }];
  for(var i = 1; i < out.length; i++){
    var p = res[res.length - 1], c = out[i], fus;
    if(!p.fin)        fus = true;                                  // p ouvert a droite
    else if(!c.debut) fus = true;                                  // c ouvert a gauche
    else              fus = (c.debut <= window._mvJourApres(p.fin)); // chevauchement OU contiguite
    if(fus){
      if(!p.fin || !c.fin) p.fin = '';
      else if(c.fin > p.fin) p.fin = c.fin;
    } else res.push({ debut: c.debut, fin: c.fin });
  }
  return res;
};

// Le lendemain d'une date ISO. Sert la regle de contiguite ci-dessus : passer par
// Date evite le piege du 31 -> 01 et des fins de mois (un simple +1 sur la chaine
// donnerait '2026-07-32').
// ★★★ LE JOUR SUIVANT, ET RIEN QUE LUI. Tout est en UTC, de bout en bout.
//   ⚠⚠⚠ CE QUI ETAIT ECRIT MELANGEAIT DEUX HORLOGES : `Date.parse('2026-06-30T00:00:00')`
//   — sans suffixe de fuseau — lit MINUIT LOCAL, puis `toISOString()` reserialise en UTC.
//   A Paris (UTC+1 l'hiver, UTC+2 l'ete) minuit local vaut 22 h ou 23 h la VEILLE en UTC :
//   +24 h retombe donc sur le MEME JOUR. _mvJourApres('2026-06-30') rendait '2026-06-30'.
//   ★★ Consequence en production, pour TOUS les clients, TOUTE l'annee : _mvContrats ne
//   fusionnait plus jamais deux contrats contigus (fin 30/06 → debut 01/07). Le releve
//   d'heures perdait alors son contexte de contrat — _planCtrDuMois exige UNE seule
//   periode — et melangeait les compteurs des deux contrats.
//   ⚠ Le bac a sable de Claude tourne en UTC : c'est le SEUL endroit au monde ou ce code
//   etait juste. Trouve le 23/08/2026 par un harnais lance sur la machine de Nico.
//   Voir le harnais mv-harnais-fuseau.mjs, qui rejoue les fonctions de dates sous cinq
//   fuseaux et exige un resultat IDENTIQUE.
window._mvJourApres = function(iso){
  if(!iso) return '';
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  if(!m) return iso;
  var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if(isNaN(d.getTime())) return iso;
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

window._mvEnContratSurPeriode = function(m, d0, d1){
  if(!m || m.bureau) return false;
  var P = window._mvContrats(m);
  // ★★★ SANS AUCUNE DATE = CDI DEPUIS TOUJOURS, PRESENT SUR TOUTE PERIODE.
  //   Convention posee par Nico le 09/07/2026 et jamais revisee : « effectif present
  //   = membres non-bureau dont le contrat est actif a la date ; CDI sans date =
  //   present en permanence ». Le STATUT n'y figure pas, et c'est deliberé.
  //   ⚠⚠ CE QUE FAISAIT LA LIGNE D'AVANT (`return m.statut !== 'Inactif'`) :
  //   une fiche sans aucune date passee en Inactif sortait de TOUTES les periodes,
  //   PASSEES COMPRISES. Une campagne archivee se rejouait donc avec un salarie de
  //   moins, des mois apres sa cloture — un chiffre d'histoire qui bouge parce qu'on
  //   a range une liste. Or « Inactif » est un CONFORT DE SAISIE (ne plus avoir a le
  //   selectionner a l'ouverture), pas un fait d'historique : le contrat est termine,
  //   on ne sait juste pas quand. Sans date, la seule reponse honnete est « present ».
  //   ★ Corollaire assume : un compte de service sans dates compterait comme un CDI.
  //   La reponse n'est pas dans le statut, elle est dans le drapeau `bureau` juste
  //   au-dessus — ou dans la suppression de la fiche.
  if(!P.length) return true;
  for(var i = 0; i < P.length; i++){
    if(P[i].debut && d1 && P[i].debut > d1) continue;
    if(P[i].fin   && d0 && P[i].fin   < d0) continue;
    return true;
  }
  return false;
};


// ══════════════════════════════════════════════════════════════════════
// MOTEUR DE PROJECTION UNIQUE (26/07/2026)
// Une seule definition de « un jour de travail », partagee par l'ordre de
// passage, le simulateur de cout, la marge du tableau de bord et l'ETP.
// AVANT : quatre calculs independants renvoyaient 39 / 27 / 44 jours pour la
// MEME charge et le MEME effectif — l'ordre de passage deduisait la pause du
// temps de travail (25 h-homme/j au lieu de 35), le simulateur codait 7 h en
// dur, la marge divisait par des jours ouvres lundi-vendredi.
// Conventions arretees avec le domaine :
//   - la JOURNEE reglee est du travail EFFECTIF, la pause s'ajoute a l'amplitude
//   - la FENETRE est l'enveloppe des echeances des taches concernees
//   - un CHANTIER (vendange) se projette 7j/7 ; le reste suit les jours ouvres
// Aucune lecture de globale ici : entrees explicites, donc testable seul.
// ══════════════════════════════════════════════════════════════════════
const _MV_CHANTIER_DEF = ['vendange','vendanges'];
function _mvNormTache(s){ return String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
function _mvOrdJ(iso){ var p=String(iso||'').split('-'); if(p.length<3) return NaN; return Math.round(Date.UTC(+p[0],(+p[1]||1)-1,(+p[2]||1))/86400000); }

// Une tache est-elle un CHANTIER (7j/7) ? Reglage explicite par periode d'abord,
// sinon defaut par nom. Un domaine qui vendange en semaine peut le decocher.
function _mvEstChantier(nom, saison){
  var e=(saison && saison.echeances && saison.echeances[nom]) || null;
  if(e && e.chantier!=null) return !!e.chantier;
  return _MV_CHANTIER_DEF.indexOf(_mvNormTache(nom))>=0;
}

// Jours OUVRABLES entre deux dates ISO incluses. Chantier -> tous les jours.
function _mvJoursOuvrables(d1,d2,chantier){
  var a=_mvOrdJ(d1), b=_mvOrdJ(d2);
  if(isNaN(a)||isNaN(b)||b<a) return 0;
  if(chantier) return b-a+1;
  var n=0; for(var o=a;o<=b;o++){ var w=new Date(o*86400000).getUTCDay(); if(w!==0&&w!==6) n++; }
  return n;
}

// Date du jour en ISO, heure LOCALE. toISOString() bascule sur la veille en
// soiree l'ete (UTC+2) : une fenetre serait declaree ouverte un jour trop tot.
function _mvAujIso(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

// Jours ouvrables qui RESTENT vraiment : on ne peut pas travailler avant
// aujourd'hui. Une fenetre du 1er avril au 30 juin n'offre plus 65 jours quand
// on la consulte le 15 juin, mais 12. Confondre les deux faisait afficher
// « tient dans la fenetre » sur un chantier qui deborde de deux semaines.
function _mvJoursRestants(d1,d2,chantier,jour0){
  var j0=jour0||_mvAujIso();
  var a=(String(d1||'')>j0)?d1:j0;
  if(String(d2||'')<a) return 0;
  return _mvJoursOuvrables(a,d2,chantier);
}

// Enveloppe [debut,fin] des taches demandees : min des debuts, max des fins.
// Repli sur les dates de la periode si aucune echeance n'est saisie.
// parTache[] porte la fenetre PROPRE de chaque tache : l'enveloppe ne sert qu'a
// l'affichage, jamais a decider si un travail tient (taille en janvier +
// effeuillage en juillet donnent une enveloppe de 141 j quand les deux fenetres
// reelles n'en totalisent que 64).
function _mvFenetre(saison, noms, depuisIso){
  var s=saison||null; if(!s||!s.debut||!s.fin) return null;
  var ech=(s.echeances&&typeof s.echeances==='object'&&!Array.isArray(s.echeances))?s.echeances:{};
  var j0=depuisIso||_mvAujIso();
  var d1=null,d2=null,chantier=false,custom=false,par=[];
  (noms||[]).forEach(function(n){
    var ch=_mvEstChantier(n,s); if(ch) chantier=true;
    var e=ech[n], propre=!!(e&&(e.d1||e.d2)), a, b;
    if(propre){
      a=e.d1||s.debut; b=e.d2||s.fin;
      if(!d1||a<d1) d1=a;
      if(!d2||b>d2) d2=b;
      custom=true;
    } else { a=s.debut; b=s.fin; }
    par.push({ nom:n, debut:a, fin:b, chantier:ch, propre:propre,
               jours:_mvJoursOuvrables(a,b,ch),
               joursRestants:_mvJoursRestants(a,b,ch,j0) });
  });
  if(!custom){ d1=s.debut; d2=s.fin; }
  var o1=_mvOrdJ(d1), o2=_mvOrdJ(d2);
  if(isNaN(o1)||isNaN(o2)||o2<o1) return null;
  return { debut:d1, fin:d2, chantier:chantier, custom:custom,
           jours:_mvJoursOuvrables(d1,d2,chantier),
           joursRestants:_mvJoursRestants(d1,d2,chantier,j0),
           debutEff:((d1>j0)?d1:j0), close:(d2<j0),
           parTache:par };
}

// LE moteur.
//   resteH   heures-HOMME restantes      eff        personnes
//   journee  heures EFFECTIVES/pers/jour pauseMin   pause (amplitude seulement)
//   sauts / trajetMin  deplacements entre parcelles (temps CALENDAIRE d'equipe)
//   fen      objet _mvFenetre() ou null
function _mvProj(o){
  o=o||{};
  var N=Math.max(1,parseFloat(o.eff)||1);
  var hJ=Math.max(0.5,parseFloat(o.journee)||7);
  var resteH=Math.max(0,parseFloat(o.resteH)||0);
  var trajetH=Math.max(0,(parseFloat(o.sauts)||0)*(parseFloat(o.trajetMin)||0)/60);
  var capJour=N*hJ;                        // heures-HOMME par jour
  var calTot=resteH/N+trajetH;             // duree CALENDAIRE totale
  var jours=Math.ceil(calTot/hJ-1e-9);
  // On compare aux jours QUI RESTENT, pas a la fenetre entiere. Repli sur
  // .jours pour un objet fenetre construit par une version anterieure.
  var fen=o.fen||null, fenTot=fen?(fen.jours||0):0;
  var fenJ=fen?((fen.joursRestants!=null)?fen.joursRestants:fenTot):0;
  if(!(fenJ>0)) fenJ=0;
  // L'effectif requis doit payer le TRAJET lui aussi : il est le meme quel que
  // soit le nombre de bras, donc il ne se divise pas. Sans cette soustraction,
  // l'ecran prescrivait l'effectif deja en place (« deborde de 1 j, il faudrait
  // 5 personnes » a 5 personnes).
  var utile=fenJ*hJ-trajetH;
  return {
    capJour:capJour, jours:jours, calTot:calTot, trajetH:trajetH,
    fenJours:fenJ||null, fenJoursTotal:fenTot||null,
    depassement:fenJ?Math.max(0,jours-fenJ):null,
    tient:fenJ?(jours<=fenJ):null,
    effPourFenetre:(fenJ&&utile>1e-9)?(resteH/utile):null,
    impossible:!!(fenJ&&utile<=1e-9),
    amplitude:hJ+(Math.max(0,parseFloat(o.pauseMin)||0)/60)
  };
}

// ════════════════════════════════════════════════════════════════════════════
// EXERCICE COMPTABLE — la fenêtre « de date de bilan à date de bilan »
// ════════════════════════════════════════════════════════════════════════════
// Une CAMPAGNE (nom libre + dates + liste de travaux) repond a « qu'a-t-on fait
// sur ce cycle ? ». Un EXERCICE repond a « qu'est-ce que ca a coute entre deux
// bilans ? ». Ce sont DEUX QUESTIONS DIFFERENTES, et aucune ne se deduit de
// l'autre : le budget de campagne est STRUCTUREL (surface x bareme x taux, sans
// aucune date — rien ne dit QUAND le travail se fera), l'exercice est CALENDAIRE.
// D'ou cette fenetre, totalement independante des periodes.
//
// Defaut : 1er aout N -> 31 juillet N+1, l'usage viticole dominant (on cloture
// apres la recolte, pas au milieu). Reglable par domaine via
// CONFIG.eco.exercice_mois = mois de DEBUT (0-11) — meme patron que
// CONFIG.cp_periode_debut, qui fait deja courir les conges du 1er juin au 31 mai.
//
// ★ SOURCE UNIQUE : pilotage.js (le moteur et la vue) et reglages.js (le reglage)
//   posent la meme question ICI. Deux definitions de « ou commence l'exercice »
//   donneraient deux ecrans qui se contredisent — le motif exact qui a coute
//   941 heures fantomes sur le filtre de taches.
var MV_EX_MOIS_DEF = 7;                       // aout
var MV_EX_MOIS_LBL = ['janvier','f\u00e9vrier','mars','avril','mai','juin','juillet','ao\u00fbt','septembre','octobre','novembre','d\u00e9cembre'];
function _mvExerciceMois(){
  var v=parseInt(((window.CONFIG&&window.CONFIG.eco)||{}).exercice_mois,10);
  return (isNaN(v)||v<0||v>11)?MV_EX_MOIS_DEF:v;
}
function _mvExIso(y,m,d){ var mm=m+1; return y+'-'+(mm<10?'0':'')+mm+'-'+(d<10?'0':'')+d; }
// Exercice ouvert l'annee `an` : du 1er du mois de debut, au dernier jour du mois
// precedent l'annee suivante. new Date(an+1, md, 0) donne ce dernier jour quel que
// soit md — y compris md=0 (annee civile : 1er janv -> 31 dec de la MEME annee).
function _mvExerciceAn(an){
  an=parseInt(an,10); if(isNaN(an)) an=(new Date()).getFullYear();
  var md=_mvExerciceMois();
  var fin=new Date(an+1, md, 0);
  var d0=_mvExIso(an, md, 1), d1=_mvExIso(fin.getFullYear(), fin.getMonth(), fin.getDate());
  var civil=(md===0);
  return {
    an:an, mois:md, d0:d0, d1:d1, civil:civil,
    court: civil ? String(an) : (an+'\u2013'+(an+1)),
    lbl: civil
      ? ('Ann\u00e9e civile '+an)
      : ('1\u1D49\u02B3 '+MV_EX_MOIS_LBL[md]+' '+an+' \u2192 '+fin.getDate()+' '+MV_EX_MOIS_LBL[fin.getMonth()]+' '+fin.getFullYear())
  };
}
// Exercice CONTENANT une date (Date, 'AAAA-MM-JJ', ou rien = aujourd'hui).
// ⚠ Un NOMBRE est lu comme une annee d'OUVERTURE, pas comme un millesime de fin.
function _mvExercice(ref){
  var d=null;
  if(ref instanceof Date) d=ref;
  else if(typeof ref==='number' && isFinite(ref)) return _mvExerciceAn(ref);
  else if(typeof ref==='string' && /^\d{4}-\d{2}-\d{2}/.test(ref))
    d=new Date(parseInt(ref.slice(0,4),10), parseInt(ref.slice(5,7),10)-1, parseInt(ref.slice(8,10),10));
  else d=new Date();
  if(isNaN(d.getTime())) d=new Date();
  var md=_mvExerciceMois(), y=d.getFullYear(), m=d.getMonth();
  return _mvExerciceAn((m>=md)?y:y-1);
}
// Les n derniers exercices, le plus recent d'abord (celui EN COURS inclus).
function _mvExerciceList(n){
  n=parseInt(n,10); if(isNaN(n)||n<1) n=3;
  var cur=_mvExercice(), out=[];
  for(var i=0;i<n;i++) out.push(_mvExerciceAn(cur.an-i));
  return out;
}

window._mvEstChantier     = _mvEstChantier;
window._mvExerciceMois    = _mvExerciceMois;
window._mvExercice        = _mvExercice;
window._mvExerciceAn      = _mvExerciceAn;
window._mvExerciceList    = _mvExerciceList;
window._mvJoursOuvrables  = _mvJoursOuvrables;
window._mvAujIso          = _mvAujIso;
window._mvJoursRestants   = _mvJoursRestants;
window._mvFenetre         = _mvFenetre;
window._mvProj            = _mvProj;

// ── Axe campagne : du 1er aout au 31 juillet, de recolte a recolte. ──
// Une date appartient a la campagne ouverte le 1er aout qui la precede : au 6 aout on
// est deja sur la campagne de l'annee civile, au 6 juillet on est encore sur la
// precedente. SOURCE UNIQUE : pilotage.js (frise des archives) et cave.js (Le
// millesime) l'appellent tous les deux. Deux definitions = incoherence garantie.
// ════ MODULES PAR DEFAUT SELON LE ROLE ════
// Un membre cree en lot arrivait avec les SEPT modules dans sa barre du bas.
// Chez un domaine de douze permanents, ca fait douze fiches a rouvrir une par
// une pour cocher un profil — et si on oublie, douze personnes decouvrent
// l'application avec quatre modules qui ne les concernent pas. Le cout n'est pas
// le temps de l'installateur : c'est la PREMIERE IMPRESSION de douze gens dont
// la plupart n'ont jamais ouvert d'application metier.
//
// ⚠️ SOURCE UNIQUE. Deux appelants : la creation en lot (admin-gt.js) et le
// preset « Selon le role » de la fiche membre (reglages.js). Deux tables = deux
// verites, et l'ecart ne se verrait que chez un client.
//
// ⚠️ Ce sont des EXCLUSIONS, jamais des autorisations : le champ ne peut que
// retirer ce que la formule du domaine accorde deja (cf. _canModule). Et c'est
// de l'allegement d'interface, PAS du cloisonnement — ce qui est protege l'est
// cote rules (SEC-1).
//
// ★★ CE QUI N'EST JAMAIS MASQUE, et pourquoi :
//   · `vigne`    — c'est l'application. Un membre sans la vigne n'a plus d'accueil.
//   · `reglages` — socle inalienable (mot de passe, theme, deconnexion).
//   · `planning` — ⚠️ ECART ASSUME AVEC LE BACKLOG, qui demandait de le masquer
//     aux ouvriers. C'est l'ecran ou l'ouvrier lit SON mois, ses heures et ses
//     conges — depuis la refonte (v6.46) il y tombe directement, sans onglets.
//     Le masquer serait une regression fonctionnelle deguisee en allegement.
var _MV_MODS_ROLE = {
  admin:       [],                                                  // il a besoin de tout
  ouvrier:     ['tracteur', 'phyto', 'cave', 'reserve', 'pilotage'],
  saisonnier:  ['tracteur', 'phyto', 'cave', 'reserve', 'pilotage'],
  tractoriste: ['cave', 'reserve', 'pilotage'],
  // ⚠️ 5e role, present dans la fiche membre (reglages.js) mais PAS dans la
  // creation en lot (_agtLotRoles n'en detecte que quatre). Il ne masque rien :
  // c'est un role d'observation transverse, on ne sait pas ce que la personne
  // fait par ailleurs. Ecrit explicitement plutot que laisse en « inconnu »,
  // pour que ce soit un arbitrage et pas un oubli.
  pilotage:    []
};
var _MV_MODS_JAMAIS = { vigne: 1, reglages: 1, planning: 1 };

// Rend { cave:false, … } — uniquement les exclusions, comme le champ `mods`.
// Objet VIDE = rien a masquer, l'appelant ne pose alors aucun champ.
//
// ⚠⚠ CUMUL DE ROLES : un module n'est masque que s'il l'est par TOUS les roles
// de la personne. Un polyvalent ouvrier+tractoriste garde le Tracteur — l'union
// des exclusions le lui aurait retire, ce qui est exactement l'inverse du besoin.
// L'intersection est la seule regle sure : dans le doute, on montre.
//
// ⚠️ Un role INCONNU rend l'ensemble vide, donc rien n'est masque a personne
// qui le porte. Zero regression sur l'existant, et un nouveau role invente plus
// tard ne masquera rien tant qu'il n'est pas ecrit ici.
function _mvModsDefaut(roles) {
  var r = Array.isArray(roles) ? roles : [];
  if (!r.length) return {};
  if (r.indexOf('admin') >= 0) return {};
  var inter = null;
  for (var i = 0; i < r.length; i++) {
    var liste = _MV_MODS_ROLE[r[i]];
    if (!liste) return {};                       // role inconnu -> on ne masque rien
    if (inter === null) { inter = liste.slice(); continue; }
    inter = inter.filter(function (k) { return liste.indexOf(k) >= 0; });
  }
  var out = {};
  (inter || []).forEach(function (k) { if (!_MV_MODS_JAMAIS[k]) out[k] = false; });
  return out;
}
window._MV_MODS_ROLE = _MV_MODS_ROLE;
window._mvModsDefaut = _mvModsDefaut;

function _mvCampagneDe(iso){
  var p=String(iso||'').split('-');
  var an=parseInt(p[0],10), mo=parseInt(p[1],10);
  if(!an||!mo) { var d=new Date(); return (d.getMonth()+1>=8)?d.getFullYear():d.getFullYear()-1; }
  return (mo>=8)?an:(an-1);
}
window._mvCampagneDe      = _mvCampagneDe;

// ════════════════════════════════════════════════════════════════════════════
// LE PARC A FUTS — mouvements d'entree et de sortie
//
// Un fut entre et sort du parc. Jusqu'ici rien ne le tracait : l'inventaire
// etait une photo, jamais un film.
//   INTRANTS.futs            = futs VIDES et disponibles (La Reserve)
//   cuvee.tonneaux           = futs EN VIN (Le Chai)
//   PARC = les deux additionnes. Ce ne sont PAS deux comptabilites a
//   reconcilier : ce sont deux etats du meme fut.
//
// ENTREES : achat · mise en bouteille · retrait d'une cuvee
// SORTIES : entonnage · vente · retour au tonnelier · destruction
//
// ⚠️ CES HELPERS VIVENT DANS utils.js ET NON DANS reserve.js, parce que
// cave.js les appelle aussi et qu'il est importe AVANT reserve.js. Une copie
// privee dans chaque module divergerait au premier correctif.
// ════════════════════════════════════════════════════════════════════════════

var MV_FUT_MOTIFS = {
  achat:       {sens:'entree', lbl:'Achat',                     ico:'\u{1F6D2}'},
  embouteille: {sens:'entree', lbl:'Mise en bouteille',         ico:'\u{1F37E}'},
  retrait:     {sens:'entree', lbl:'Retir\u00e9 d\u2019une cuv\u00e9e', ico:'\u{1F513}'},
  entonnage:   {sens:'sortie', lbl:'Entonnage',                 ico:'\u{1F377}'},
  vente:       {sens:'sortie', lbl:'Vente',                     ico:'\u{1F4B6}'},
  retour:      {sens:'sortie', lbl:'Retour au tonnelier',       ico:'\u21A9\u{FE0F}'},
  destruction: {sens:'sortie', lbl:'Destruction',               ico:'\u{1F5D1}\u{FE0F}'}
};
// Se separer d'un fut : les trois seuls motifs proposes a l'ecran. L'entonnage
// n'en est pas un — ce n'est pas s'en separer, c'est l'utiliser.
var MV_FUT_SEP = ['vente','retour','destruction'];

// ⚠️ PIEGE DE TYPE : INTRANTS.futs[].annee est une CHAINE ('2023', saisie par
// .value.trim()) alors que cuvee.tonneaux[].annee est un NOMBRE (parseInt).
// '2023' !== 2023 : tout rapprochement naif renvoie zero, en silence.
function _mvFutAn(a){
  var n = parseInt(String(a==null?'':a).trim(), 10);
  return (isFinite(n) && n > 1900 && n < 2200) ? n : null;
}
// Nombre de vins faits. CONVENTION REPRISE DE _caveTonneauxStr, pas reinventee :
// annee civile courante moins annee d'achat, « neuf » a zero.
// ⚠️ C'est bien l'annee CIVILE et non la campagne : la vendange tombe en
// septembre, donc l'increment du 1er janvier arrive APRES le millesime. Un fut
// de 2023 vaut 3 vins en aout 2026 et 4 en janvier 2027 — juste des deux cotes.
function _mvFutVins(annee, curY){
  var a = _mvFutAn(annee); if(a == null) return null;
  return Math.max(0, (curY || new Date().getFullYear()) - a);
}
function _mvFutAge(v){
  if(v == null) return 'ann\u00e9e inconnue';
  return v === 0 ? 'neuf' : (v + ' vin' + (v > 1 ? 's' : ''));
}
function _mvFutNorm(s){ return String(s==null?'':s).trim().toLowerCase(); }
// Meme regle d'egalite que _futSameLot dans reserve.js : four + ref + annee,
// insensible a la casse et aux espaces. Une seule definition du « meme lot ».
function _mvFutMemeLot(a, b){
  return _mvFutNorm(a && a.four) === _mvFutNorm(b && b.four)
      && _mvFutNorm(a && a.ref)  === _mvFutNorm(b && b.ref)
      && String(_mvFutAn(a && a.annee)) === String(_mvFutAn(b && b.annee));
}
function _mvFutRef(o){
  var p = [];
  if(o && o.four) p.push(o.four);
  if(o && o.ref)  p.push(o.ref);
  return p.length ? p.join(' \u00b7 ') : '';
}
function _mvFutRid(){
  return 'fm_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

// ── Registre ──────────────────────────────────────────────────────────────
function _mvFutTracer(INTRANTS, motif, lot, nb, note){
  if(!INTRANTS) return null;
  if(!INTRANTS.fut_mouv) INTRANTS.fut_mouv = [];
  var m = MV_FUT_MOTIFS[motif];
  if(!m || !(nb > 0)) return null;
  var e = {id:_mvFutRid(), date:new Date().toISOString().slice(0,10), sens:m.sens, motif:motif,
           four:(lot&&lot.four)||'', ref:(lot&&lot.ref)||'', annee:_mvFutAn(lot&&lot.annee),
           nb:nb, note:String(note||'').trim()};
  INTRANTS.fut_mouv.push(e);
  return e;
}
function _mvFutMouv(INTRANTS, an){
  var l = ((INTRANTS && INTRANTS.fut_mouv) || []).slice()
    .sort(function(a,b){ return String(b.date).localeCompare(String(a.date)); });
  var e = 0, s = 0;
  l.forEach(function(m){
    if(an && String(m.date).slice(0,4) !== String(an)) return;
    if(m.sens === 'entree') e += (m.nb||0); else s += (m.nb||0);
  });
  return {lignes:l, entrees:e, sorties:s, solde:e - s};
}

// ── Etat du parc ──────────────────────────────────────────────────────────
function _mvFutStock(INTRANTS, curY){
  curY = curY || new Date().getFullYear();
  var lots = ((INTRANTS && INTRANTS.futs) || []).map(function(f){
    var a = _mvFutAn(f.annee);
    return {id:f.id, four:f.four||'', ref:f.ref||'', annee:a,
            qte:Math.max(0, parseInt(f.qte,10)||0), vins:_mvFutVins(a, curY),
            nom:_mvFutRef(f) || 'Lot sans nom'};
  }).filter(function(l){ return l.qte > 0; })
    .sort(function(a,b){
      if(a.annee == null) return 1;
      if(b.annee == null) return -1;
      if(a.annee !== b.annee) return b.annee - a.annee;
      return a.nom.localeCompare(b.nom, 'fr');
    });
  return {lots:lots, total:lots.reduce(function(s,l){ return s+l.qte; }, 0)};
}
// ⚠️ Les cuvees EMBOUTEILLEES sont ignorees : leurs futs ont ete rendus au
// stock, ils figurent donc deja dans INTRANTS.futs. Les compter les ferait
// apparaitre deux fois.
function _mvFutEnVin(CAVE_ELEVAGE, curY){
  curY = curY || new Date().getFullYear();
  var lignes = [], total = 0, sansRef = 0;
  ((CAVE_ELEVAGE && CAVE_ELEVAGE.cuvees) || []).forEach(function(c){
    if(!c || c.statut === 'embouteille') return;
    ((c.tonneaux) || []).forEach(function(t, i){
      var q = parseInt(t && t.nb, 10) || 0; if(q <= 0) return;
      var a = _mvFutAn(t.annee), nom = _mvFutRef(t);
      total += q; if(!nom) sansRef += q;
      lignes.push({cuveeId:c.id, cuveeNom:c.nom, millesime:c.millesime, idx:i, annee:a,
                   nb:q, four:t.four||'', ref:t.ref||'', nom:nom, vins:_mvFutVins(a, curY)});
    });
  });
  return {lignes:lignes, total:total, sansRef:sansRef,
          tracePct: total>0 ? Math.round((total-sansRef)/total*100) : 100};
}
function _mvFutParc(INTRANTS, CAVE_ELEVAGE, curY){
  curY = curY || new Date().getFullYear();
  var cfg = (window.CONFIG && window.CONFIG.cave) || {};
  var vie = parseInt(cfg.futs_vie, 10) || 5;
  var st = _mvFutStock(INTRANTS, curY), ev = _mvFutEnVin(CAVE_ELEVAGE, curY);
  var parAnnee = {};
  function add(a, n, cle){
    var k = (a == null) ? '?' : a;
    if(!parAnnee[k]) parAnnee[k] = {annee:(a==null?null:a), libres:0, enVin:0};
    parAnnee[k][cle] += n;
  }
  st.lots.forEach(function(l){ add(l.annee, l.qte, 'libres'); });
  ev.lignes.forEach(function(l){ add(l.annee, l.nb, 'enVin'); });
  var lignes = Object.keys(parAnnee).map(function(k){
    var o = parAnnee[k], v = _mvFutVins(o.annee, curY);
    return {annee:o.annee, vins:v, libres:o.libres, enVin:o.enVin,
            total:o.libres + o.enVin, reforme:(v != null && v >= vie)};
  }).sort(function(a,b){
    if(a.annee == null) return 1;
    if(b.annee == null) return -1;
    return b.annee - a.annee;
  });
  var parc = st.total + ev.total;
  return {curY:curY, vie:vie, stock:st, enVin:ev, libres:st.total, occupes:ev.total,
          parc:parc, sansRef:ev.sansRef, tracePct:ev.tracePct, lignes:lignes,
          aReformer:lignes.filter(function(l){ return l.reforme; })
                          .reduce(function(s,l){ return s+l.total; }, 0),
          neufs:lignes.filter(function(l){ return l.vins === 0; })
                      .reduce(function(s,l){ return s+l.total; }, 0),
          mouv:_mvFutMouv(INTRANTS, curY)};
}

// ── ENTREE au parc : fusion sur un lot identique ───────────────────────────
function _mvFutEntrer(INTRANTS, lot, nb, motif, note){
  if(!INTRANTS) return 0;
  if(!INTRANTS.futs) INTRANTS.futs = [];
  nb = parseInt(nb, 10) || 0; if(nb <= 0) return 0;
  var cible = {four:(lot&&lot.four)||'', ref:(lot&&lot.ref)||'', annee:_mvFutAn(lot&&lot.annee)};
  var ex = INTRANTS.futs.find(function(f){ return _mvFutMemeLot(f, cible); });
  if(ex) ex.qte = (parseInt(ex.qte,10)||0) + nb;
  else INTRANTS.futs.push({id:_mvFutRid(), four:cible.four, ref:cible.ref,
        annee:(cible.annee==null?'':String(cible.annee)), qte:nb,
        date:new Date().toISOString().slice(0,10)});
  _mvFutTracer(INTRANTS, motif || 'achat', cible, nb, note);
  return nb;
}

// ── LA MISE EN BOUTEILLE rend tous les futs de la cuvee ───────────────────
function _mvFutLiberer(cuvee, INTRANTS, note){
  var rendus = 0;
  ((cuvee && cuvee.tonneaux) || []).forEach(function(t){
    var q = parseInt(t && t.nb, 10) || 0; if(q <= 0) return;
    rendus += _mvFutEntrer(INTRANTS, t, q, 'embouteille',
      note || ((cuvee.nom||'') + (cuvee.millesime ? ' ' + cuvee.millesime : '')));
  });
  return rendus;
}

// ── RETIRER un fut d'une cuvee : le vin sort, le fut revient ──────────────
// Le fut n'est pas perdu, il est vide. On le remet au parc, sauf si le vigneron
// le jette (fut fendu, vin acetique) : garder === false.
function _mvFutRetirer(cuvee, annee, nb, INTRANTS, garder, note){
  if(!cuvee || !cuvee.tonneaux) return 0;
  var a = _mvFutAn(annee);
  var t = cuvee.tonneaux.find(function(x){ return _mvFutAn(x.annee) === a; });
  if(!t) return 0;
  var pris = Math.min(Math.max(0, parseInt(nb,10)||0), parseInt(t.nb,10)||0);
  if(pris <= 0) return 0;
  if(garder === false){
    _mvFutTracer(INTRANTS, 'destruction', t, pris, note || ('retir\u00e9 de ' + (cuvee.nom||'')));
    return 0;
  }
  return _mvFutEntrer(INTRANTS, t, pris, 'retrait', note || (cuvee.nom||''));
}

// ── SE SEPARER de futs libres : vente, retour, destruction ────────────────
// Sortie DEFINITIVE du parc. Distincte de _rsvDelFut, qui efface une ligne
// saisie par erreur et ne doit rien tracer : effacer une erreur de saisie
// n'est pas un mouvement de futs.
function _mvFutSeparer(INTRANTS, lotId, nb, motif, note){
  if(MV_FUT_SEP.indexOf(motif) < 0) return 0;
  var lot = ((INTRANTS && INTRANTS.futs) || []).find(function(f){ return f.id === lotId; });
  if(!lot) return 0;
  var dispo = Math.max(0, parseInt(lot.qte,10)||0);
  var pris = Math.min(Math.max(0, parseInt(nb,10)||0), dispo);
  if(pris <= 0) return 0;
  lot.qte = dispo - pris;
  _mvFutTracer(INTRANTS, motif, lot, pris, note);
  INTRANTS.futs = INTRANTS.futs.filter(function(f){ return (parseInt(f.qte,10)||0) > 0; });
  return pris;
}

// ── ENTONNER : le fut sort du parc et part en vin ─────────────────────────
// L'identite complete voyage avec lui (four, ref, annee) pour qu'il puisse
// revenir au parc a la mise en bouteille, meme si le lot d'origine a disparu.
function _mvFutEntonner(choix, INTRANTS, note){
  var out = [];
  Object.keys(choix || {}).forEach(function(id){
    var n = parseInt(choix[id], 10) || 0; if(n <= 0) return;
    var lot = ((INTRANTS && INTRANTS.futs) || []).find(function(f){ return f.id === id; });
    if(!lot) return;
    var pris = Math.min(n, Math.max(0, parseInt(lot.qte,10)||0));
    if(pris <= 0) return;
    lot.qte = (parseInt(lot.qte,10)||0) - pris;
    _mvFutTracer(INTRANTS, 'entonnage', lot, pris, note);
    out.push({annee:_mvFutAn(lot.annee), nb:pris, four:lot.four||'', ref:lot.ref||'', lot_id:lot.id});
  });
  if(INTRANTS && INTRANTS.futs){
    INTRANTS.futs = INTRANTS.futs.filter(function(f){ return (parseInt(f.qte,10)||0) > 0; });
  }
  return out;
}
function _mvFutTotal(choix){
  return Object.keys(choix || {}).reduce(function(s,k){ return s + (parseInt(choix[k],10)||0); }, 0);
}
// Proposition : du plus VIEUX au plus neuf. Un fut age doit tourner ou partir a
// la reforme ; le neuf se garde pour les cuvees qui le meritent. Proposition,
// jamais contrainte : le vigneron ajuste lot par lot.
function _mvFutProposer(stock, nb){
  var choix = {}, reste = parseInt(nb,10) || 0;
  ((stock && stock.lots) || []).slice().sort(function(a,b){
    if(a.annee == null) return 1;
    if(b.annee == null) return -1;
    return a.annee - b.annee;
  }).forEach(function(l){
    if(reste <= 0) return;
    var n = Math.min(reste, l.qte);
    if(n > 0){ choix[l.id] = n; reste -= n; }
  });
  return choix;
}

window.MV_FUT_MOTIFS   = MV_FUT_MOTIFS;
window.MV_FUT_SEP      = MV_FUT_SEP;
window._mvFutAn        = _mvFutAn;
window._mvFutVins      = _mvFutVins;
window._mvFutAge       = _mvFutAge;
window._mvFutRef       = _mvFutRef;
window._mvFutMemeLot   = _mvFutMemeLot;
window._mvFutTracer    = _mvFutTracer;
window._mvFutMouv      = _mvFutMouv;
window._mvFutStock     = _mvFutStock;
window._mvFutEnVin     = _mvFutEnVin;
window._mvFutParc      = _mvFutParc;
window._mvFutEntrer    = _mvFutEntrer;
window._mvFutLiberer   = _mvFutLiberer;
window._mvFutRetirer   = _mvFutRetirer;
window._mvFutSeparer   = _mvFutSeparer;
window._mvFutEntonner  = _mvFutEntonner;
window._mvFutTotal     = _mvFutTotal;
window._mvFutProposer  = _mvFutProposer;

window._saisonObj         = _saisonObj;
window._saisonForDate     = _saisonForDate;
window._saisonTaches      = _saisonTaches;

// Constantes sur window pour accès depuis modules non-ES (firebase compat, inline HTML)
window.TABREV             = TABREV;
window.TCLS               = TCLS;
window.TEMJ               = TEMJ;
window.COULEURS_MBR       = COULEURS_MBR;
window.APP_VERSION        = APP_VERSION;
window.checkWhatsNew      = checkWhatsNew;
window.dismissWhatsNew    = dismissWhatsNew;
