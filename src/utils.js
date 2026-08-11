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
export const APP_VERSION = '5.92';
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
window._mvGraphW = function(el){
  var w = (el && el.clientWidth > 0) ? el.clientWidth : 0;
  if(!(w > 0)) return MV_GRAPH_DEF;
  return Math.round(Math.max(MV_GRAPH_MIN, Math.min(MV_GRAPH_MAX, w)));
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
  var w = window._mvGraphW(box);
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
window._mvGraphSuivre = function(sel, build){
  if(!sel || typeof build !== 'function') return;
  var e = null, i;
  for(i = 0; i < _MV_GRAPHS.length; i++){ if(_MV_GRAPHS[i].sel === sel){ e = _MV_GRAPHS[i]; break; } }
  if(!e){ e = { sel: sel, w: 0, el: null, dit: false }; _MV_GRAPHS.push(e); }
  e.build = build;
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
  { v:'5.92', items:[
    { emoji:'\u23F1', titre:'Le chrono tracteur ne se perd plus',
      desc:"Avant, verrouiller son t\u00e9l\u00e9phone pendant le travail effa\u00e7ait la mesure en cours sans rien dire. Elle est maintenant retrouv\u00e9e \u00e0 la r\u00e9ouverture, m\u00eame plusieurs heures apr\u00e8s." },
    { emoji:'\uD83D\uDC46', titre:'Toucher une parcelle lance la mesure',
      desc:"Plus de bouton D\u00e9marrer. On touche la parcelle o\u00f9 l'on commence, on touche \u00ab\u00a0J'ai fini\u00a0\u00bb en partant. Toucher directement la parcelle suivante ench\u00e2ine sans compter de d\u00e9placement." },
    { emoji:'\uD83D\uDEE3', titre:'Trajets et pause d\u00e9jeuner s\u00e9par\u00e9s du travail',
      desc:"Trois compteurs au lieu d'un\u00a0: le temps dans les parcelles, le temps hors parcelle, la pause d\u00e9jeuner. La cadence ne m\u00e9lange plus la route et le travail." },
    { emoji:'\u26A0', titre:'Un chrono oubli\u00e9 n\'est plus comptabilis\u00e9',
      desc:"Une mesure tr\u00e8s longue ou tr\u00e8s courte par rapport au bar\u00e8me est \u00e9cart\u00e9e\u00a0: la parcelle reste coch\u00e9e au bar\u00e8me, et l'\u00e9cran dit pourquoi." },
    { emoji:'\uD83D\uDCCD', titre:'Les parcelles les plus proches en premier',
      desc:"La liste se range par distance \u00e0 la parcelle en cours au lieu de l'ordre alphab\u00e9tique. Une tourn\u00e9e rang\u00e9e par le chef reste prioritaire." }
  ]},
  { v:'5.91', items:[
    { emoji:'\u{23F1}\u{FE0F}', titre:'La coupure d\u00e9jeuner dit enfin quand elle tombe',
      desc:'Un ouvrier qui lisait \u00ab une heure de pause \u00bb pouvait croire qu\u2019il en choisissait le moment ; la paie et le chef d\u2019exploitation y lisaient autre chose. Le planning parle maintenant de \u00ab coupure \u00bb, et vous pouvez dire \u00e0 quelle heure elle a lieu : Planning, onglet Mod\u00e8les, sous la dur\u00e9e. Une heure fixe, \u00ab selon le chantier \u00bb, ou rien du tout \u2014 tant que vous ne r\u00e9pondez pas, rien ne change chez vous. Les journ\u00e9es s\u2019affichent alors coup\u00e9es en deux : 09:00 \u2192 12:00 puis 13:00 \u2192 16:00.' },
    { emoji:'\u{2696}\u{FE0F}', titre:'Trois nombres qui ne se confondent plus',
      desc:'Pr\u00e9sence, coupure, heures dues : une journ\u00e9e de 09:00 \u00e0 16:00 avec une heure de coupure fait 7 h de pr\u00e9sence et 6 h dues. Chaque dur\u00e9e affich\u00e9e porte d\u00e9sormais son \u00e9tiquette, pour que le chef, l\u2019ouvrier et la paie lisent la m\u00eame ligne sans l\u2019interpr\u00e9ter chacun \u00e0 sa fa\u00e7on.' }
  ] },
  { v:'5.90', items:[
    { emoji:'\u{1F5D3}\u{FE0F}', titre:'Le planning de l\u2019ann\u00e9e s\u2019imprime',
      desc:'Un nouveau document sort le rythme de l\u2019\u00e9quipe sur douze mois : jours travaill\u00e9s, heures de prise et de fin de service, coupure d\u00e9jeuner, fermetures et jours f\u00e9ri\u00e9s. Il se trouve dans R\u00e9glages, onglet App, \u00ab Documents & impressions \u00bb, et vous propose par d\u00e9faut l\u2019ann\u00e9e \u00e0 venir. Une page par mod\u00e8le de semaine : quand toute l\u2019\u00e9quipe suit le m\u00eame rythme, une seule feuille suffit.' }
  ] },
  { v:'5.89', items:[
    { emoji:'\u{1F347}', titre:'La Cave suit le chemin du raisin',
      desc:'Les trois onglets de la Cave changent d\u2019ordre : Le Cuvier passe en premier, Le Chai vient ensuite, Le mill\u00e9sime ferme la marche. C\u2019est le trajet r\u00e9el du raisin, de la benne \u00e0 la bouteille. Rien ne bouge \u00e0 l\u2019int\u00e9rieur des \u00e9crans, aucune saisie n\u2019est d\u00e9plac\u00e9e, et la Cave continue de s\u2019ouvrir sur Le Chai.' }
  ] },
  { v:'5.88', items:[
    { emoji:'\u{1F4C8}', titre:'Les graphiques ne se lisent plus \u00e0 la loupe',
      desc:'Sur t\u00e9l\u00e9phone, les chiffres et les \u00e9tiquettes des graphiques du Pilotage descendaient jusqu\u2019\u00e0 3 pixels, et ne d\u00e9passaient pas 7 sur un ordinateur : ils \u00e9taient dessin\u00e9s dans un cadre fixe que l\u2019\u00e9cran r\u00e9duisait ensuite. Chaque graphique mesure d\u00e9sormais la place dont il dispose et dessine \u00e0 cette taille, si bien que les textes font partout leur taille r\u00e9elle. Sur un \u00e9cran \u00e9troit, un calendrier de douze mois d\u00e9file au lieu de r\u00e9tr\u00e9cir, et les graphiques se recomposent : moins de graduations, et les noms passent au-dessus des barres plut\u00f4t que dans une colonne qui mangeait le tiers de l\u2019\u00e9cran.' },
    { emoji:'\u{1F4AD}', titre:'Un graphique sans donn\u00e9e dit ce qui lui manque',
      desc:'Un titre s\u2019affichait, et sous lui, rien. Impossible de savoir s\u2019il manquait une saisie ou si l\u2019\u00e9cran \u00e9tait cass\u00e9. Les graphiques qui n\u2019ont pas de quoi tracer expliquent maintenant ce qui manque et o\u00f9 le saisir. Ceux qui n\u2019ont vraiment rien \u00e0 dire continuent de s\u2019effacer enti\u00e8rement, sans laisser un titre tout seul.' },
    { emoji:'\u{1F347}', titre:'Le rendement au pressoir que vous avez r\u00e9gl\u00e9 sert partout',
      desc:'Le Cuvier vous laisse fixer votre fourchette de kilos par hectolitre. Deux \u00e9crans s\u2019en servaient, deux autres divisaient par 135 quoi qu\u2019il arrive : la cha\u00eene r\u00e9colte vers bouteilles du Chai, et le rendement du bilan de campagne. Tant que le r\u00e9glage restait \u00e0 sa valeur d\u2019origine, la diff\u00e9rence \u00e9tait invisible ; d\u00e8s qu\u2019on y touchait, deux \u00e9crans donnaient deux chiffres pour la m\u00eame cuv\u00e9e. Ils lisent tous le m\u00eame r\u00e9glage.' },
    { emoji:'\u{1F4CA}', titre:'Les rendements par mill\u00e9sime se lisent dans le m\u00eame sens partout',
      desc:'La fiche parcelle affichait les mill\u00e9simes du plus r\u00e9cent au plus ancien, le Cuvier du plus ancien au plus r\u00e9cent : m\u00eame donn\u00e9e, deux sens de lecture. La fiche parcelle suit d\u00e9sormais celui du Cuvier, le plus ancien en haut, et l\u2019\u00e9cart se compare toujours \u00e0 la ligne du dessus.' }
  ] },
  { v:'5.87', items:[
    { emoji:'\u{1F33F}', titre:'Vos \u00e9cartements de plantation se r\u00e8glent enfin depuis R\u00e9glages',
      desc:'La distance entre vos rangs et entre vos pieds sert \u00e0 ramener les heures conseill\u00e9es \u00e0 votre densit\u00e9 r\u00e9elle : \u00e0 6 000 pieds \u00e0 l\u2019hectare, un bar\u00e8me pens\u00e9 pour 10 000 propose un tiers d\u2019heures de trop. Le r\u00e9glage existait, mais il n\u2019\u00e9tait accessible qu\u2019en ouvrant le bar\u00e8me de la convention par le bouton \u00ab \u002b Nouvelle t\u00e2che \u00bb \u2014 personne n\u2019allait l\u2019y chercher, et la mise en route vous envoyait sur l\u2019onglet Vigne o\u00f9 il ne figurait pas. Il a maintenant sa ligne, dans R\u00e9glages \u203a Vigne, qui affiche vos deux \u00e9cartements et le nombre de pieds \u00e0 l\u2019hectare qui en d\u00e9coule. Tant qu\u2019ils ne sont pas renseign\u00e9s, rien ne change nulle part.' }
  ] },
  { v:'5.86', items:[
    { emoji:'\u{1F9ED}', titre:'Un domaine qui vient d\u2019\u00eatre install\u00e9 sait par o\u00f9 commencer',
      desc:'L\u2019Accueil d\u2019un administrateur affiche d\u00e9sormais une mise en route : le nom du domaine, les parcelles et leurs contours, les p\u00e9riodes de travail, le bar\u00e8me des t\u00e2ches, l\u2019\u00e9quipe, puis la premi\u00e8re validation. Rien n\u2019est \u00e0 cocher \u00e0 la main : chaque \u00e9tape se lit dans ce qui est d\u00e9j\u00e0 enregistr\u00e9, et m\u00e8ne d\u2019un geste au bon \u00e9cran. Le bloc s\u2019efface tout seul quand tout est fait. S\u2019il reste un r\u00e9glage qui rendrait un calcul plus juste \u2014 le SIRET pour le registre phyto en fichier, vos \u00e9cartements de plantation pour le bar\u00e8me \u2014 il ne garde qu\u2019une ligne. Les ouvriers ne le voient pas : ce sont des r\u00e9glages de domaine.' }
  ] },
  { v:'5.85', items:[
    { emoji:'\u{2753}', titre:'L\u2019aide de chaque \u00e9cran dit enfin ce que l\u2019\u00e9cran fait',
      desc:'La pastille « ? Aide » d\u00e9crivait des modules tels qu\u2019ils \u00e9taient il y a plusieurs mois. Celle du Pilotage annon\u00e7ait six onglets quand il y en a sept, et en nommait deux qui n\u2019existent plus. Celles de la Cave et de La R\u00e9serve ignoraient le parc \u00e0 f\u00fbts, la s\u00e9paration des mill\u00e9simes et les documents. Les dix fiches sont refaites, et la liste des onglets est d\u00e9sormais lue dans l\u2019application au moment o\u00f9 vous ouvrez l\u2019aide : elle ne pourra plus vieillir toute seule.' },
    { emoji:'\u{1F4B6}', titre:'\u00c9conomie annon\u00e7ait une fin de p\u00e9riode moins ch\u00e8re que ce que vous aviez d\u00e9j\u00e0 d\u00e9pens\u00e9',
      desc:'L\u2019\u00e9cart de cadence \u2014 « votre \u00e9quipe va-t-elle plus vite ou moins vite que le bar\u00e8me ? » \u2014 comptait les heures de pr\u00e9sence \u00e0 partir des seules journ\u00e9es portant une validation. Or une validation couvre souvent plusieurs jours de travail : sur le printemps, 165 journ\u00e9es sur 559 en portaient une, et l\u2019application concluait que vous alliez deux fois plus vite que pr\u00e9vu. Elle projetait alors une fin de p\u00e9riode \u00e0 37 000 \u20ac sur une p\u00e9riode termin\u00e9e o\u00f9 79 000 \u20ac \u00e9taient d\u00e9j\u00e0 engag\u00e9s, et conseillait en vert de r\u00e9duire un bar\u00e8me qui \u00e9tait juste. La pr\u00e9sence vient maintenant du planning, comme dans Exercice comptable, et la cadence ne s\u2019applique plus qu\u2019\u00e0 ce qui reste \u00e0 faire : une projection ne peut plus contredire ce qui est d\u00e9j\u00e0 d\u00e9pens\u00e9. Le planning dit qui \u00e9tait l\u00e0, jamais ce que la personne a fait \u2014 l\u2019\u00e9cran le rappelle sous l\u2019indicateur.' }
  ] },
  { v:'5.84', items:[
    { emoji:'\u{1F5FA}\u{FE0F}', titre:'Vos parcelles sont bien cartographi\u00e9es d\u00e8s l\u2019installation',
      desc:'L\u2019\u00e9cran d\u2019installation annon\u00e7ait que l\u2019import du fichier KML \u00ab arriverait prochainement \u00bb. C\u2019\u00e9tait inexact : le contour de chaque parcelle est mis en place d\u00e8s l\u2019installation, \u00e0 partir de votre fichier. La phrase le dit maintenant.' },
    { emoji:'\u{1F522}', titre:'Le carnet d\u2019entretien affichait un num\u00e9ro de version faux',
      desc:'Son pied de page indiquait toujours la m\u00eame version, fig\u00e9e depuis longtemps, quelle que soit la version r\u00e9ellement install\u00e9e chez vous. Il affiche d\u00e9sormais la bonne.' }
  ] },
  { v:'5.83', items:[
    { emoji:'\u{1F4DD}', titre:'Tous vos documents sont \u00e0 la police du domaine',
      desc:'Le rapport de saison, le relev\u00e9 mensuel, le registre phyto, la fiche salari\u00e9 et le carnet d\u2019entretien sortaient chacun dans une police diff\u00e9rente \u2014 Georgia, Helvetica, Segoe UI \u2014 selon le navigateur qui les ouvrait. Le rapport de saison demandait m\u00eame la bonne police sans jamais la charger. Ils utilisent maintenant tous celle du domaine, comme les documents de la cave.' }
  ] },
  { v:'5.82', items:[
    { emoji:'\u{1F4C4}', titre:'Vos documents se ressemblent enfin',
      desc:'Chaque document imprimable avait sa propre mise en page : des marges diff\u00e9rentes d\u2019un document \u00e0 l\u2019autre, et la plupart sortaient dans la police par d\u00e9faut du navigateur au lieu de la v\u00f4tre. Ils partagent maintenant le m\u00eame en-t\u00eate au nom de votre domaine, le m\u00eame pied de page et les m\u00eames marges. Le paysage reste r\u00e9serv\u00e9 aux grands tableaux, comme le registre phyto.' },
    { emoji:'\u{1F5A8}\u{FE0F}', titre:'Les documents de la cave s\u2019impriment directement',
      desc:'Le rapport d\u2019op\u00e9rations et l\u2019export des r\u00e9coltes ne s\u2019imprimaient pas : ils t\u00e9l\u00e9chargeaient un fichier qu\u2019il fallait retrouver dans ses t\u00e9l\u00e9chargements puis rouvrir soi-m\u00eame. Ils s\u2019ouvrent d\u00e9sormais dans un onglet, pr\u00eats \u00e0 imprimer ou \u00e0 enregistrer en PDF, comme tous les autres.' }
  ] },
  { v:'5.81', items:[
    { emoji:'\u{1F5A8}\u{FE0F}', titre:'Tous vos documents au m\u00eame endroit',
      desc:'Le registre phyto \u00e9tait dans un \u00e9cran, l\u2019inventaire des f\u00fbts dans un autre, le bilan de campagne dans un troisi\u00e8me, et le reste dans « Exporter / Importer ». Il fallait savoir o\u00f9 chaque document avait \u00e9t\u00e9 rang\u00e9. R\u00e9glages ouvre maintenant « Documents & impressions » : tout ce que Ma Vigne sait imprimer y figure, class\u00e9 par usage. Ce que vous devez pouvoir montrer en contr\u00f4le d\u2019abord, vos \u00e9tats internes ensuite, vos donn\u00e9es brutes pour finir. Chaque ligne dit son format et ce qu\u2019elle va vous demander avant de g\u00e9n\u00e9rer.' },
    { emoji:'\u{1F4CB}', titre:'Le registre phyto en fichier Excel est mis en avant',
      desc:'Il devient obligatoire au 1er janvier 2027 : un registre imprim\u00e9 ne suffira plus, il faudra un fichier lisible par machine. Il \u00e9tait d\u00e9j\u00e0 disponible, mais peu visible. Il est d\u00e9sormais en t\u00eate de la liste, avec sa date limite \u00e9crite \u00e0 c\u00f4t\u00e9.' },
    { emoji:'\u{1F4C5}', titre:'Le relev\u00e9 mensuel se pr\u00e9pare sur son propre \u00e9cran',
      desc:'Le formulaire du relev\u00e9 d\u2019heures occupait le haut de la page \u00e0 chaque ouverture, m\u00eame quand vous veniez chercher autre chose. Il s\u2019ouvre maintenant quand vous cliquez dessus, et le r\u00e9glage des heures de la saison a sa propre ligne.' }
  ] },
  { v:'5.80', items:[
    { emoji:'\u{1F504}', titre:'Le soutirage se lit pareil partout',
      desc:'Le bouton « Soutirer » du Pilotage ouvrait le Cuvier, alors que le soutirage se fait au Chai. Et la fiche de cuv\u00e9e pouvait annoncer un soutirage que le journal du Chai ne connaissait pas. Le r\u00e9glage « sous tirage » de la fiche est retir\u00e9 : une cuv\u00e9e se soutire plusieurs fois pendant l\u2019\u00e9levage, un oui/non ne pouvait pas le dire. On enregistre le soutirage au Chai, avec sa date, et la cuv\u00e9e affiche « Soutir\u00e9e le\u2026 ». \u26a0\u{FE0F} Une cuv\u00e9e que vous aviez seulement coch\u00e9e r\u00e9appara\u00eetra « \u00e0 soutirer » tant que le soutirage n\u2019est pas enregistr\u00e9 : l\u2019application n\u2019en a aucune trace dat\u00e9e.' },
    { emoji:'\u{1F9EA}', titre:'Un soutirage trop ancien ne compte plus',
      desc:'Une cuv\u00e9e soutir\u00e9e avant la fin de sa malo \u00e9tait consid\u00e9r\u00e9e comme faite. Le Pilotage compare maintenant la date du soutirage \u00e0 celle o\u00f9 la malo a \u00e9t\u00e9 constat\u00e9e termin\u00e9e, et vous dit pourquoi la cuv\u00e9e reste \u00e0 soutirer.' },
    { emoji:'\u{23F3}', titre:'La part des anges, mill\u00e9sime par mill\u00e9sime',
      desc:'Un seul taux pour toute la cave donnait une moyenne qui ne d\u00e9crivait aucun vin. Chaque mill\u00e9sime a maintenant sa ligne dans le Pilotage : volume remis, nombre d\u2019ouillages, f\u00fbts concern\u00e9s et taux annuel qui lui est propre. La fen\u00eatre est de douze mois glissants.' },
    { emoji:'\u{1F5D3}\u{FE0F}', titre:'L\u2019ouillage group\u00e9 par mill\u00e9sime',
      desc:'Les cuv\u00e9es \u00e0 ouiller sont regroup\u00e9es par ann\u00e9e, avec le d\u00e9lai propre \u00e0 chacune. Si vous n\u2019avez qu\u2019un mill\u00e9sime en cave, rien ne change \u00e0 l\u2019\u00e9cran.' },
    { emoji:'\u{1F4C4}', titre:'Registre et bilan par mill\u00e9sime',
      desc:'Le registre des manipulations et le bilan de campagne se lisent d\u00e9sormais mill\u00e9sime par mill\u00e9sime. Une campagne contient deux vins \u2014 celui qui rentre et celui qui finit son \u00e9levage \u2014 et les m\u00e9langer produisait des documents illisibles. Le bilan indique lui-m\u00eame ce qui rel\u00e8ve de la campagne et ce qui rel\u00e8ve du mill\u00e9sime.' }
  ]},
  { v:'5.79', items:[
    { emoji:'\u{23F3}', titre:'Un seuil d\u2019ouillage par mill\u00e9sime',
      desc:'Un vin jeune se rattrape plus souvent qu\u2019un vin d\u2019un an. Vous pouvez d\u00e9sormais r\u00e9gler le d\u00e9lai d\u2019alerte mill\u00e9sime par mill\u00e9sime, dans les r\u00e9glages du Chai. Sans r\u00e9glage propre, un mill\u00e9sime suit le seuil g\u00e9n\u00e9ral \u2014 rien ne change pour vous tant que vous n\u2019y touchez pas.' },
    { emoji:'\u{1F50D}', titre:'Les chiffres du Chai suivent le filtre',
      desc:'En filtrant sur un mill\u00e9sime, le bandeau affichait encore les totaux de toute la cave. Cuv\u00e9es, f\u00fbts, hectolitres et cuv\u00e9es \u00e0 ouiller correspondent maintenant \u00e0 ce que vous regardez.' }
  ]},
  { v:'5.78', items:[
    { emoji:'\u{1F5C3}\u{FE0F}', titre:'Un mill\u00e9sime \u00e0 la fois dans la Cave',
      desc:'Une op\u00e9ration porte d\u00e9sormais sur un seul mill\u00e9sime : on choisit l\u2019ann\u00e9e, puis seules ses cuv\u00e9es sont propos\u00e9es. On n\u2019ouille pas les f\u00fbts d\u2019un mill\u00e9sime avec le vin d\u2019un autre.' },
    { emoji:'\u{1F4A7}', titre:'Le volume d\u2019ouillage propos\u00e9 devient juste',
      desc:'Le volume conseill\u00e9 par f\u00fbt \u00e9tait calcul\u00e9 sur la moyenne de tous vos ouillages, tous mill\u00e9simes confondus. Il ne regarde plus que les ouillages de la cuv\u00e9e concern\u00e9e.' }
  ]},
  { v:'5.77', items:[
    { emoji:'\u{1F52C}', titre:'L\u2019acide malique se saisit dans l\u2019analyse',
      desc:'Un champ de plus dans le formulaire d\u2019analyse, \u00e0 recopier depuis le bulletin du labo. \u00c0 partir de trois valeurs, Ma Vigne projette la fin de la malo de chaque cuv\u00e9e \u2014 sur vos mesures, pas sur une moyenne.' },
    { emoji:'\u{1F504}', titre:'Le Pilotage vous dit quelle cuv\u00e9e soutirer',
      desc:'L\u2019onglet Cave signale les cuv\u00e9es dont la malo est finie et qui attendent leur soutirage, et alerte quand le malique cesse de descendre alors qu\u2019il en reste.' },
    { emoji:'\u{1F6E0}\u{FE0F}', titre:'Une analyse modifi\u00e9e ne perd plus ses valeurs',
      desc:'En rouvrant une analyse pour corriger sa date, les SO\u2082 et l\u2019acidit\u00e9 volatile pouvaient \u00eatre remplac\u00e9s par ceux de la saisie pr\u00e9c\u00e9dente. Le formulaire affiche maintenant les vraies valeurs de l\u2019analyse.' },
    { emoji:'\u{1F377}', titre:'La Cave du Pilotage devient un tableau de bord',
      desc:'Trois vues : ce qui presse aujourd\u2019hui, o\u00f9 en est le mill\u00e9sime, et ce que co\u00fbte le parc \u00e0 f\u00fbts. Chaque ligne renvoie vers l\u2019\u00e9cran de saisie correspondant.' }
  ]},
  // 5.76 — Bilan de campagne.
  { v: '5.76', items: [
    { emoji: '\u{1F4D6}', titre: 'Le bilan de votre campagne',
      desc: 'Une année entière sur deux pages imprimables : les travaux de la vigne, la récolte '
          + 'parcelle par parcelle, le chemin du raisin jusqu’à la bouteille, l’état du chai et '
          + 'du parc à fûts, la protection du vignoble. Rien de plus à saisir : tout vient de '
          + 'ce que vous avez noté au fil de l’année.' },
    { emoji: '\u{1F5C3}\u{FE0F}', titre: 'Deux façons de l’ouvrir',
      desc: 'Depuis Pilotage › Archives, l’écran de fin de campagne, ou depuis '
          + 'Réglages › Import / Export à côté de vos autres documents.' },
    { emoji: '\u{1F9ED}', titre: 'Des chiffres qui disent leur assiette',
      desc: 'La surface travaillée additionne les passages : une parcelle relevée deux fois y '
          + 'compte deux fois. Le rendement moyen ne porte que sur les parcelles récoltées. '
          + 'Le document le dit, pour qu’aucun chiffre ne soit lu de travers.' }
  ] },
  // 5.75 — Entonnage depuis le parc + registre des manipulations.
  { v: '5.75', items: [
    { emoji: '\u{1F377}', titre: 'Choisir ses barriques au décuvage',
      desc: 'Au décuvage, vous piochez maintenant dans vos fûts libres : tonnelier par tonnelier, '
          + 'année par année. L’app propose de commencer par les plus vieux et signale si elle doit '
          + 'prendre du bois neuf. Vos cuvées savent enfin d’où viennent leurs fûts, et leur âge '
          + 'est juste — avant, tout fût créé au décuvage passait pour neuf.' },
    { emoji: '\u{1F4CB}', titre: 'Le registre des manipulations',
      desc: 'Toutes vos manipulations œnologiques d’une campagne, mises en forme et imprimables : '
          + 'enrichissement, sulfitage, adjonctions, pratiques de cave. Rien de plus à saisir, tout '
          + 'vient de ce que vous notez déjà au Cuvier et au Chai. Depuis Le Cuvier › Réglages, '
          + 'ou Réglages › Import / Export.' },
    { emoji: '\u{1F9FE}', titre: 'Un état interne, pas une déclaration',
      desc: 'Le registre vous aide à retrouver et présenter vos manipulations. Il ne remplace aucune '
          + 'déclaration officielle : Ma Vigne prépare, vous déclarez.' }
  ] },
  // 5.74 — Le parc a futs : mouvements d'entree et de sortie.
  { v: '5.74', items: [
    { emoji: '\u{1F37E}', titre: 'Vos fûts reviennent au parc',
      desc: 'Quand une cuvée part en bouteille, ses fûts redeviennent disponibles dans '
          + 'La Réserve, vieillis d’un vin. Même chose quand vous retirez des fûts d’une '
          + 'cuvée : le fût vide revient, sauf si vous le jetez.' },
    { emoji: '\u{1F4E4}', titre: 'Se séparer de fûts',
      desc: 'Vente, retour au tonnelier ou destruction : trois motifs, depuis l’onglet Fûts '
          + 'de La Réserve. Le mouvement reste au registre, même pour un fût détruit.' },
    { emoji: '\u{1F4CB}', titre: 'Le registre du parc',
      desc: 'Tout ce qui entre et sort, avec son motif et sa date. Entonner ou embouteiller ne '
          + 'change pas le nombre de fûts du domaine : seuls un achat ou une séparation le font '
          + 'bouger, et le registre explique l’écart entre deux inventaires.' }
  ] },
  // 5.73 — Cave : troisieme ecran « Le millesime ».
  { v: '5.73', items: [
    { emoji: '\u{1F570}\u{FE0F}', titre: 'La cave dit enfin ce qui arrive',
      desc: 'Un nouvel écran « Le millésime », à côté du Chai et du Cuvier. Il montre les quatre '
          + 'prochaines semaines : les fûts à ouiller, les cuves à mesurer, la fin de fermentation '
          + 'estimée, et les fermentations qui ralentissent. Rien de plus à saisir : tout se déduit '
          + 'de ce que vous notez déjà.' },
    { emoji: '\u{1F347}', titre: 'De la vigne à la bouteille, d’un seul regard',
      desc: 'Le second onglet suit le parcours d’un millésime : ce qui est rentré, ce qui fermente, '
          + 'ce qui est en fût, ce qui est en bouteille, avec la perte à chaque étape. On y voit aussi '
          + 'le rendement de chaque parcelle et d’où vient chaque cuvée.' },
    { emoji: '\u{1F4CF}', titre: 'Le rendement de l’appellation',
      desc: 'Posez une fois le maximum autorisé sur une parcelle, en touchant sa ligne : '
          + 'un dépassement se voit immédiatement. Rien n’est bloqué, c’est vous qui décidez.' }
  ] },
  // 5.72 — SEC-GT/2 : second facteur sur le panneau GUERETTECH. Interne.
  { v: '5.72', items: [] },
  // 5.71 — SEC-GT + Business/Leads : panneau GUERETTECH interne, rien de visible
  // côté client. items:[] = sous-lot technique (le modal ne s'ouvre pas).
  { v: '5.71', items: [] },
  { v: '5.70', items: [
    { emoji: '\u{1F4C6}', titre: "Ce que l\u2019exercice a co\u00fbt\u00e9, d\u2019un bilan \u00e0 l\u2019autre", desc: "Pilotage \u203a \u00c9conomie ne savait chiffrer qu\u2019une campagne. Or un comptable ne raisonne pas en campagne, il raisonne du 1\u1D49\u02B3 ao\u00fbt au 31 juillet. Nouvel onglet \u00ab Exercice \u00bb : salaires charg\u00e9s, carburant et achats d\u2019intrants sur la fen\u00eatre exacte de votre bilan, mois par mois, avec la comparaison \u00e0 l\u2019exercice pr\u00e9c\u00e9dent." },
    { emoji: '\u{1F4B6}', titre: "Des salaires compt\u00e9s une seule fois", desc: "Le budget de campagne s\u00e9pare le travail de la vigne et la conduite du tracteur, parce que le bar\u00e8me h/ha ne conna\u00eet pas les heures de tracteur. Le planning, lui, contient d\u00e9j\u00e0 toutes les heures pay\u00e9es. L\u2019exercice compte donc la paie une seule fois, et n\u2019ajoute au tracteur que son carburant." },
    { emoji: '\u2699\uFE0F', titre: "Votre date de bilan", desc: "R\u00e9glable dans l\u2019onglet Exercice si votre cl\u00f4ture ne tombe pas fin juillet. Le mois choisi vaut pour tout le domaine et ne touche ni aux campagnes, ni aux cong\u00e9s, ni \u00e0 aucun chiffre existant." },
    { emoji: '\u{1F9FE}', titre: "Ce que le total ne contient pas, \u00e9crit noir sur blanc", desc: "Fermage, amortissements, assurances, cotisations du chef d\u2019exploitation, embouteillage, frais g\u00e9n\u00e9raux : Ma Vigne ne les conna\u00eet pas. L\u2019\u00e9cran le dit \u00e0 c\u00f4t\u00e9 du total, pour que personne ne le compare \u00e0 un compte de r\u00e9sultat." }
  ] },
  { v: '5.69', items: [
    { emoji: '\u{1F9ED}', titre: "L\u2019ordre de passage arrive enfin sur l\u2019\u00e9cran de l\u2019\u00e9quipe", desc: "Dans Pilotage \u203a D\u00e9cider, ranger les parcelles puis enregistrer affichait \u00ab partag\u00e9 \u00e0 l\u2019\u00e9quipe \u00bb. En r\u00e9alit\u00e9, l\u2019ordre n\u2019\u00e9tait lu nulle part : personne ne le voyait. Il pilote maintenant l\u2019\u00e9cran Vigne \u2014 les parcelles s\u2019affichent dans l\u2019ordre de la tourn\u00e9e, avec leur num\u00e9ro sur la fiche et sur la carte." },
    { emoji: '\u{1F3AF}', titre: "Une tourn\u00e9e par travail", desc: "L\u2019ordre s\u2019enregistre pour le ou les travaux s\u00e9lectionn\u00e9s, pas pour le domaine en bloc. Deux \u00e9quipes qui tournent sur deux travaux diff\u00e9rents voient chacune son propre parcours. Pour reprendre le m\u00eame ordre sur plusieurs travaux, il suffit de les cocher ensemble avant d\u2019enregistrer." },
    { emoji: '\u{1F522}', titre: "Des num\u00e9ros qui restent justes tout seuls", desc: "Le num\u00e9ro se recalcule sur ce qui reste \u00e0 faire : 1, 2, 3\u2026 sans trou, m\u00eame apr\u00e8s trois jours de chantier. Une parcelle termin\u00e9e sort simplement de la tourn\u00e9e. Un bouton \u00ab Tri normal \u00bb permet \u00e0 chacun de revenir \u00e0 l\u2019affichage habituel, et l\u2019administrateur peut retirer une tourn\u00e9e quand elle n\u2019a plus lieu d\u2019\u00eatre." }
  ] },
  { v: '5.68', items: [
    { emoji: '\u{1F4CA}', titre: "Votre registre phyto s\u2019exporte maintenant en Excel", desc: "Le registre existait en PDF. Depuis janvier 2026, la r\u00e9glementation demande qu\u2019il soit tenu sous forme \u00e9lectronique, dans un fichier qu\u2019un logiciel peut lire \u2014 ce qu\u2019un PDF imprim\u00e9 n\u2019est pas. Un nouveau bouton, en bas du registre et dans R\u00e9glages \u203a Export, produit ce fichier : une ligne par produit et par parcelle, avec la date, la dose, les horaires, le stade, la surface trait\u00e9e et les coordonn\u00e9es de la parcelle. Il s\u2019ouvre d\u2019un double-clic dans Excel. L\u2019obligation devient ferme au 1er janvier 2027." },
    { emoji: '\u{1F9FE}', titre: "Le SIRET et le mode de production du domaine", desc: "Le registre export\u00e9 doit porter le num\u00e9ro SIRET de l\u2019exploitation et dire si la production est conduite en bio. Ces deux informations se saisissent une fois pour toutes dans R\u00e9glages \u203a Domaine, et se retrouvent ensuite sur chaque ligne du registre. Tant que le SIRET manque, l\u2019export vous le signale au lieu de sortir un fichier incomplet sans rien dire." },
    { emoji: '\u{1F4C4}', titre: "Les exports CSV s\u2019ouvrent enfin correctement dans Excel", desc: "Les exports du journal et des parcelles s\u00e9paraient leurs colonnes par une virgule. Ouverts en France, ils entassaient tout dans une seule colonne, et les surfaces \u00e0 virgule s\u2019y m\u00e9langeaient aux s\u00e9parateurs. Ils utilisent d\u00e9sormais le point-virgule, comme le reste de l\u2019application." }
  ] },
  { v: '5.67', items: [
    { emoji: '\u{1F4CB}', titre: "Choisissez le barème de votre région", desc: "Les heures conseillées de l'application venaient toutes de l'accord bourguignon. Un domaine girondin y lisait des chiffres qui n'étaient pas les siens. Dans l'écran du barème, vous choisissez maintenant votre région : la Bourgogne ou la Gironde pour commencer, d'autres viendront au fil des installations. Chaque barème indique son texte source et sa date. Rien n'est imposé : c'est une référence, vos heures restent les vôtres, et changer de barème ne modifie aucune de vos valeurs." }
  ] },
  { v: '5.66', items: [
    { emoji: '\u{1F33F}', titre: "Le barème s'adapte à la densité de vos vignes", desc: "Les heures par hectare du barème valent pour une vigne à 10 000 pieds — un mètre entre les rangs, un mètre sur le rang. Une parcelle plantée à trois mètres compte trois fois moins de pieds, donc à peu près trois fois moins de travail à la taille. Dans l'écran du barème, vous pouvez maintenant indiquer vos écartements : les heures conseillées sont recalculées en conséquence, comme le prévoit l'accord collectif. Rien n'est imposé — c'est une proposition, vos valeurs restent les vôtres. Et tant que vous ne renseignez rien, absolument rien ne change." }
  ] },
  { v: '5.65', items: [
    { emoji: '\u{1F5D3}\u{FE0F}', titre: "Modifier les heures d'une tâche changeait sa saison", desc: "Dans Réglages › Tâches, ouvrir une tâche et l'enregistrer — même sans rien changer — effaçait les saisons qu'on lui avait données et remettait celles du barème. Une pioche réglée sur l'automne repassait au printemps, sans un mot. La cause : l'écran des heures réécrivait la tâche entière au lieu de ne toucher qu'aux heures. Il ne modifie plus que ce qu'on lui demande." }
  ] },
  { v: '5.64', items: [
    { emoji: '\u{23F1}\u{FE0F}', titre: "Les passages sautés ne comptent plus comme du travail fait", desc: "Quand le relevage se fait en un seul passage, on valide directement le dernier niveau et les précédents se cochent tout seuls. L'application comptait alors les trois passages : 100 heures par hectare au lieu des 50 réellement passées. Sur un domaine où presque toutes les parcelles sont dans ce cas, cela représentait près de 600 heures de travail qui n'ont jamais eu lieu — de quoi gonfler le coût de main-d'œuvre par parcelle et laisser croire que l'équipe allait plus vite que le barème. Un passage sauté ne compte plus, ni dans le travail fait, ni dans le travail qui reste : une parcelle relevée une fois est terminée, et son reste à faire est bien zéro. L'avancement en surface, lui, ne bouge pas d'un centième." }
  ] },
  { v: '5.63', items: [
    { emoji: '\u{1F4F1}', titre: "Quatre modules dans la barre du bas, au lieu de trois", desc: "Sur téléphone, la barre du bas n'affichait que trois modules : tout le reste était rangé derrière le bouton « ⋯ Plus », y compris des modules ouverts plusieurs fois par jour. Elle en montre maintenant quatre. Et quand un domaine tient en cinq modules — parce que sa formule en donne cinq, ou parce que certains ont été décochés dans la fiche d'un membre — ils sont tous dans la barre : le bouton « Plus » disparaît." }
  ] },
  { v: '5.62', items: [
    { emoji: '\u{1F5D3}\u{FE0F}', titre: "« Ça tient dans la fenêtre » alors que la fenêtre était déjà passée", desc: "Dans Pilotage › Décider, le bandeau de l'ordre de passage comparait le travail restant à la fenêtre entière de la tâche — du premier au dernier jour où elle peut se faire. Consulté le 15 juin sur un relevage prévu du 1er avril au 30 juin, il annonçait 65 jours disponibles alors qu'il n'en restait que 12, et affichait un feu vert sur un chantier qui débordait de deux semaines. Il compte maintenant les jours qui restent à partir d'aujourd'hui." },
    { emoji: '\u{1F465}', titre: "Le nombre de personnes conseillé ne suffisait pas", desc: "Quand le travail débordait, l'écran indiquait combien de personnes il faudrait — sans compter les déplacements entre parcelles, qui sont pourtant les mêmes quel que soit le nombre de bras. Sur vingt parcelles à cinq personnes, il conseillait cinq personnes : exactement l'équipe déjà en place. Il en fallait sept. Les trajets sont désormais dans le calcul." },
    { emoji: '\u{1F33F}', titre: "Chaque tâche est jugée sur sa propre période", desc: "En cochant plusieurs tâches, l'application les évaluait sur une seule période allant du début de la plus précoce à la fin de la plus tardive. Taille en janvier et effeuillage en juillet donnaient ainsi 141 jours de marge quand les deux périodes réelles n'en totalisent que 64 : le verdict était favorable d'avance. Chaque tâche a maintenant sa ligne, sa charge et son verdict." },
    { emoji: '\u{1F39B}\u{FE0F}', titre: "Deux chiffres qui se contredisaient", desc: "Le bandeau pouvait afficher « 0,00 ha » après une journée entière passée sur une grande parcelle : la surface n'était comptée qu'au jour où la parcelle se termine. Elle se répartit désormais sur les journées réellement travaillées. Dans le simulateur « et si ? », la fin de saison ne bougeait pas d'un jour quand on déplaçait l'équipe entre les tâches, et restait affichée même avec deux tâches à l'arrêt. Elle suit maintenant la dernière tâche à finir — et le dit clairement quand une tâche n'a personne." }
  ] },
  { v: '5.61', items: [
    { emoji: '\u{1F465}', titre: "Une seule ligne pour toute une equipe", desc: "Pour la vendange, il fallait creer une fiche par personne : trente fiches qui ne se connecteront jamais, qui n'ont aucun compteur d'annualisation a tenir, et qui rendent la grille illisible le seul mois ou elle sert vraiment. Une fiche peut desormais etre declaree \u00ab\u00a0equipe collective\u00a0\u00bb dans Reglages \u203a Equipe, avec un nombre de personnes. La ligne reste unique dans le planning, mais ses heures comptent pour tout le monde." },
    { emoji: '\u{1F5D3}\u{FE0F}', titre: "L'effectif se change jour par jour", desc: "Une vendange ne se fait pas au meme nombre du premier au dernier jour. Dans la grille Equipe, la selection multiple porte un nouveau bouton Effectif : on touche les jours concernes, on saisit le nombre, c'est applique d'un coup. La saisie du jour prime sur le nombre par defaut de la fiche, et elle ne touche pas aux horaires deja poses." },
    { emoji: '\u{2696}\u{FE0F}', titre: "Ce qui reste strictement individuel", desc: "Une equipe collective n'entre ni dans le compteur des 1607 heures, ni dans les conges payes, ni dans les heures supplementaires, ni dans les alertes de depassement hebdomadaire, ni dans le releve d'heures individuel. Ces compteurs ne veulent rien dire pour trente personnes reunies sous un seul nom, et les laisser tourner aurait declenche une alarme des le premier jour de vendange." },
    { emoji: '\u{1F33F}', titre: "Le partage du travail tient compte du nombre", desc: "Quand une parcelle est faite par le chef de culture et l'equipe de vendange, \u00ab\u00a0Ma part du chantier\u00a0\u00bb ne partage plus la surface en deux parts egales : chacun pese son effectif reel. Le total affiche reste evidemment identique." }
  ] },
  { v: '5.60', items: [
    { emoji: '\u{1F465}', titre: "Les saisonniers disparaissaient de la courbe d'effectif", desc: "Dans Pilotage, la courbe « Personnes nécessaires / semaine » et le calcul d'ETP ne comptaient que les fiches encore marquées Actives. Or on passe une fiche en Inactif quand le contrat se termine — l'application le conseille elle-même. Résultat : dès qu'un saisonnier était rangé en fin de mission, il s'effaçait de toute la campagne, comme s'il n'avait jamais travaillé. Sur un domaine réel, le pic affichait 4 personnes au lieu de 10. Une fiche compte désormais dans une campagne dès que ses dates de contrat la recoupent, quel que soit son statut d'aujourd'hui." },
    { emoji: '\u{1F4B6}', titre: "Le coût de main-d'oeuvre reposait sur une seule personne", desc: "Le taux horaire moyen qui sert au coût par hectare était calculé sur les seules personnes sous contrat le jour de la consultation. Une fois la saison terminée, il ne restait souvent qu'un permanent : tout le budget travail de la campagne se retrouvait chiffré sur son seul taux. La moyenne porte maintenant sur l'équipe qui a réellement fait la campagne." },
    { emoji: '\u{1F4C5}', titre: "Ce qui n'a pas changé", desc: "Les écrans qui répondent à « qui est là aujourd'hui » — carte Équipe, présences du jour, effectif au champ — gardent exactement le même comportement qu'avant. Seuls les calculs de campagne ont été corrigés. Les personnes rattachées au bureau restent hors du calcul de charge des vignes, comme avant." }
  ] },
  { v: '5.59', items: [
    { emoji: '\u{1F4F1}', titre: "Sur iPhone, des messages ne s'affichaient jamais", desc: "Plusieurs écrans passaient par les petites fenêtres du navigateur pour vous avertir : « date obligatoire », « réservé aux tractoristes », « sélectionnez un mois ». Quand l'application est installée sur l'écran d'accueil d'un iPhone, ces fenêtres ne s'affichent pas : le message restait invisible, l'action ne partait pas, et rien n'expliquait pourquoi. Quinze messages étaient concernés, dont sept dans Tracteur. Ils passent tous par les bandeaux habituels de l'application." },
    { emoji: '\u{270F}\u{FE0F}', titre: "Le consommé saisi à la main redevient modifiable", desc: "Dans La Réserve, le crayon à côté du consommé ouvrait une fenêtre de saisie du navigateur. Sur iPhone, cette fenêtre n'apparaît pas du tout : le crayon ne faisait tout simplement rien. Il ouvre maintenant une vraie fiche, avec le nom du produit, son unité et le clavier numérique. La virgule est acceptée." },
    { emoji: '\u{1F3AF}', titre: "Le champ oublié se met en avant tout seul", desc: "Quand il manque une date, un nom ou un mois, l'application ne se contente plus de le signaler : elle place le curseur dans le champ concerné et ouvre le clavier dessus. Une manipulation de moins quand on a les mains prises." }
  ] },
  { v: '5.58', items: [
    { emoji: '\u{1F326}\u{FE0F}', titre: "La météo par secteur affichait un jour qui n'existait pas", desc: "Un secteur montrait un relevé sans rapport avec la journée en cours — 18° et 11°/21° un jour de canicule — pendant que tous les autres restaient bloqués sur un sablier. En cause : la visite de démonstration écrivait sa météo inventée dans la même mémoire que votre domaine et ne la nettoyait jamais, et cette mémoire, une fois présente, empêchait toute nouvelle demande. Le relevé est désormais rattaché à votre domaine, daté, et redemandé dès qu'il vieillit ou qu'il manque un secteur." },
    { emoji: '\u{1F321}\u{FE0F}', titre: "Un seul chiffre pour une seule heure", desc: "La pastille en haut de l'écran et les cartes par secteur interrogeaient deux modèles différents : deux températures pouvaient s'afficher au même moment pour le même endroit. Tout passe maintenant par le modèle Météo-France. Et quand un relevé date de plus de vingt minutes, son âge est écrit à côté du titre." },
    { emoji: '\u{1F4E1}', titre: "Plus de sablier qui tourne dans le vide", desc: "L'application redemandait la météo à chaque rafraîchissement de l'accueil, jusqu'à se faire refuser par le service météo — un refus qu'elle ne savait pas reconnaître, d'où le sablier indéfini et l'absence totale de trace. Les demandes sont désormais espacées, les refus sont détectés et consignés, et si la météo est vraiment indisponible, c'est écrit." }
  ] },
  { v: '5.57', items: [
    { emoji: '\u{1F3C1}', titre: "La fin d'un chantier prend tout l'écran", desc: "Quand la dernière parcelle d'une tâche tombe, le récapitulatif s'affiche en plein écran au lieu d'une fiche en bas : la surface, le nombre de parcelles, les jours passés et les personnes qui y étaient. Cela n'arrive que cinq ou six fois par campagne — c'est ce qui lui donne sa valeur." },
    { emoji: '\u{1F4C6}', titre: "« Est-ce qu'on s'y est pris plus tôt cette année ? »", desc: "La question qu'on se pose vraiment à la fin d'un chantier trouve enfin sa réponse dans l'application. À la fin d'une tâche, et sous la date de fin prévue du bloc « Ma part du chantier », l'écart avec la campagne précédente s'affiche en clair : tant de jours plus tôt, ou plus tard. La comparaison se fait sur le rang du jour dans la campagne, pas sur la date brute — deux campagnes qui ne commencent pas le même jour restent comparables. Elle est lue dans le journal, elle n'a donc besoin d'aucune clôture préalable." },
    { emoji: '\u{1F5C3}', titre: "Consulter une archive ne mélange plus les années", desc: "En consultant une période passée, les surfaces venaient bien de l'archive mais les intervenants étaient relus dans le journal de l'année en cours : votre part et celle de l'équipe pouvaient être fausses sur les écrans d'archive. Tout se lit désormais sur la période que vous consultez, jamais sur celle qui est active." }
  ] },
  { v: '5.56', items: [
    { emoji: '\u{1F4CC}', titre: "Personne ne savait que quelqu'un lisait", desc: "On saisit tous les jours sans jamais voir ce que ça donne à l'échelle du domaine. La nouvelle page « Le domaine cette semaine » montre la surface parcourue par toute l'équipe depuis lundi, puis qui a fait quoi — par ordre alphabétique, jamais par quantité. Aucune heure, aucune rémunération n'apparaît là : uniquement des hectares et des noms de parcelles." },
    { emoji: '\u{1F5E3}', titre: "Un mot à l'équipe, une fois par semaine", desc: "L'administrateur peut écrire deux lignes qui s'affichent pour tout le monde : ce qui a bien tourné, ce qui vient lundi. C'est le seul texte saisi à la main de toute cette série de nouveautés, et probablement le plus utile — un mot d'un humain vaut mieux qu'une jauge." },
    { emoji: '\u{1F441}', titre: "Vous décidez qui voit ce mur", desc: "Un réglage en bas de la page, réservé à l'administrateur : visible par toute l'équipe (par défaut) ou par l'administrateur seul. Les surfaces sont des données d'activité individuelle — le choix vous revient, et il se change à tout moment." }
  ] },
  { v: '5.55', items: [
    { emoji: '\u{1F4D6}', titre: "Une page à vous : « Ma trace »", desc: "Dix modules servent à piloter le domaine et aucun ne vous montrait votre propre travail. Depuis le bloc « Ma part du chantier », le lien « Ma trace » ouvre le bilan de votre campagne : la surface totale que vous avez travaillée, le détail par tâche, les parcelles où vous êtes intervenu et les personnes avec qui vous avez travaillé. Tout est en hectares — aucune heure, aucune rémunération n'apparaît sur cette page." },
    { emoji: '\u{1F91D}', titre: "Rien n'est comparé entre collègues", desc: "La surface d'une parcelle se partage entre les personnes notées sur le chantier : une parcelle faite à trois compte pour un tiers à chacun. « Avec qui » compte des journées passées ensemble, pas des performances — aucun classement, aucun chiffre d'une personne mis en face de celui d'une autre." }
  ] },
  { v: '5.54', items: [
    { emoji: '\u{1F3C5}', titre: "Vous ne vous voyiez nulle part dans l'avancement", desc: "L'accueil affichait l'avancement du domaine — jamais ce que vous y aviez fait, vous. Un nouveau bloc « Ma part du chantier » reprend la même barre et la coupe en deux : votre part en doré, celle du reste de l'équipe en vert, chacune en hectares. Le partage suit les intervenants notés au journal : une parcelle faite à trois compte pour un tiers à chacun. Rien n'est comparé entre collègues, et aucune heure n'apparaît là — ce sont des hectares." },
    { emoji: '\u{1F5D3}\u{FE0F}', titre: "Vous savez quand le chantier se termine", desc: "Sous la barre : les parcelles qui restent, leur surface, leurs noms, et une date de fin calculée sur la cadence des quinze derniers jours. Une date approximative vaut mieux qu'un pourcentage quand il s'agit de décider si on prend du renfort ou si on tient." },
    { emoji: '\u{2699}\u{FE0F}', titre: "Le bloc se range comme les autres", desc: "Il apparaît en haut de l'accueil et suit les mêmes règles que les autres blocs : appui long pour le déplacer, le réduire ou le masquer. Le chantier affiché est celui sur lequel l'équipe a le plus travaillé ces quinze derniers jours ; les chantiers terminés laissent la place au suivant." }
  ] },
  { v: '5.53', items: [
    { emoji: '\u{2705}', titre: "Valider une parcelle ne vous rendait rien", desc: "Vous validiez une parcelle, un bandeau vert passait deux secondes, et c'était tout. Le geste le plus fréquent de l'application — celui qu'on fait entre deux rangs, parfois vingt fois par semaine — était traité comme un simple accusé de réception. Désormais une fiche s'ouvre : la parcelle et sa surface, l'avancement du domaine qui bouge sous vos yeux, et ce qu'il reste. Sur les parcelles validées en un geste depuis la liste, le bandeau et son bouton « Annuler » restent inchangés tant que la parcelle n'est pas terminée : rien ne ralentit la validation à la chaîne." },
    { emoji: '\u{1F33F}', titre: "Vous savez enfin ce qu'il reste sur le chantier", desc: "Un pourcentage ne dit pas grand-chose quand on est dans les vignes. La fiche annonce le nombre de parcelles encore à faire, leur surface et leurs noms — et propose d'enchaîner directement sur la suivante, sans repasser par la liste. Trois parcelles nommées valent mieux que « 74 % »." },
    { emoji: '\u{1F3C1}', titre: "La fin d'un chantier se voit", desc: "Quand la dernière parcelle d'une tâche tombe, le domaine entier vient de passer — et jusqu'ici cela s'affichait exactement comme la première. La fiche devient un récapitulatif : la surface totale, le nombre de parcelles, le nombre de jours depuis le premier travail enregistré, et les personnes qui y ont participé. Cela n'arrive que cinq ou six fois dans une campagne." }
  ] },
  { v: '5.52', items: [
    { emoji: '\u{1F465}', titre: "Les effectifs comptaient des gens partis", desc: "Le Pilotage ne regardait que la case « Actif » d\u2019une fiche, jamais la date de fin de contrat. Un saisonnier dont le contrat s\u2019\u00e9tait termin\u00e9 continuait donc d\u2019\u00eatre compt\u00e9 tant que personne ne le passait « Inactif » \u00e0 la main. Trois contrats finis suffisaient \u00e0 afficher sept personnes au lieu de quatre. Un membre n\u2019est d\u00e9sormais compt\u00e9 que s\u2019il est actif ET sous contrat \u00e0 la date que vous consultez \u2014 en archives, c\u2019est l\u2019\u00e9quipe de l\u2019\u00e9poque qui s\u2019affiche, pas celle d\u2019aujourd\u2019hui." },
    { emoji: '\u{23F3}', titre: "Vos chantiers finissaient trop t\u00f4t sur le papier", desc: "Cette m\u00eame erreur remontait dans tout le module : les pr\u00e9sences du jour, le nombre de personnes au champ, le simulateur de journ\u00e9e, et surtout la cadence \u2014 avec cinq personnes compt\u00e9es au lieu de deux, l\u2019application tablait sur 35 heures par jour quand vous en faisiez 14, et annon\u00e7ait une fin de chantier deux fois et demie trop t\u00f4t. Le co\u00fbt du travail est touch\u00e9 lui aussi : le taux horaire moyen incluait les taux de gens qui ne travaillent plus." },
    { emoji: '\u{1F4CB}', titre: "Les contrats termin\u00e9s se voient enfin", desc: "Dans R\u00e9glages \u203a \u00c9quipe, une fiche encore « Active » dont le contrat est \u00e9chu porte maintenant une mention orange. Et sous la carte \u00c9quipe du Pilotage, le nombre de contrats termin\u00e9s est rappel\u00e9 \u2014 pour que la baisse d\u2019effectif s\u2019explique d\u2019elle-m\u00eame plut\u00f4t que de vous faire chercher o\u00f9 sont pass\u00e9s vos gens." }
  ] },
  { v: '5.51', items: [
    { emoji: '\u{1F465}', titre: "Le simulateur d\u2019effectif conseillait n\u2019importe quoi", desc: "Il pouvait annoncer qu\u2019il vous fallait 15 personnes, tout en affichant juste \u00e0 c\u00f4t\u00e9 une cadence conseill\u00e9e de 4,2 \u2014 et le d\u00e9tail sous le graphique \u00e9tiquetait « le moins cher » quatorze lignes sur vingt et une. Trois causes : il rapportait toute la charge de la p\u00e9riode \u00e0 la fen\u00eatre d\u2019une seule t\u00e2che dat\u00e9e, il facturait les heures de vos permanents comme si vous ne les payiez pas d\u00e9j\u00e0, et il chiffrait le retard en pourcentage du co\u00fbt du travail. Il est remplac\u00e9 par « Renfort : combien, et quand », dans le nouvel onglet D\u00e9cider." },
    { emoji: '\u{1F4C6}', titre: "Le moment o\u00f9 vous prenez du renfort change le prix", desc: "Le nouvel \u00e9cran pose le travail semaine par semaine \u00e0 partir des fen\u00eatres que vous avez saisies. Ce qui n\u2019est pas absorb\u00e9 glisse sur la semaine suivante \u2014 et une t\u00e2che faite en retard devient plus longue, ce qui d\u00e9cale celle d\u2019apr\u00e8s. Vous dessinez votre renfort en cliquant dans les colonnes, et vous voyez trois choses d\u2019un coup : les semaines qui d\u00e9bordent, les gens pay\u00e9s pendant qu\u2019aucun travail n\u2019est ouvert, et ce que chaque strat\u00e9gie co\u00fbte. Les propositions qui ne bouclent pas la campagne ne sont plus pr\u00e9sent\u00e9es comme les moins ch\u00e8res : elles sont \u00e9cart\u00e9es." },
    { emoji: '\u{1F9ED}', titre: "Le Pilotage se lit dans l\u2019ordre o\u00f9 l\u2019on travaille", desc: "Aujourd\u2019hui, Avancement, D\u00e9cider, \u00c9quipe, Cave, \u00c9conomie : o\u00f9 j\u2019en suis, ce qui vient, ce que je d\u00e9cide, avec qui, ce que \u00e7a co\u00fbte. La simulation \u00e9tait enterr\u00e9e dans le menu Outils alors que c\u2019est la seule page o\u00f9 l\u2019on arbitre quelque chose ; les Archives, qu\u2019on ouvre deux fois l\u2019an, y prennent sa place. Et le bouton « ? Aide » manquait \u00e0 ce module : sa fiche existait sans aucun moyen de l\u2019ouvrir." }
  ] },
  { v: '5.50', items: [
    { emoji: '\u{1F9EE}', titre: "Les dur\u00e9es de chantier disaient toutes autre chose", desc: "Pour la m\u00eame charge et la m\u00eame \u00e9quipe, l\u2019ordre de passage annon\u00e7ait 39 jours, le simulateur de co\u00fbt 27 et le tableau de bord 44. Trois calculs s\u00e9par\u00e9s, trois d\u00e9finitions diff\u00e9rentes d\u2019une journ\u00e9e de travail : l\u2019un retirait la pause du temps de travail, l\u2019autre la passait sous silence, le troisi\u00e8me divisait par des jours ouvr\u00e9s. Tout part d\u00e9sormais d\u2019un seul calcul. La journ\u00e9e r\u00e9gl\u00e9e est du travail effectif \u2014 la pause s\u2019ajoute \u00e0 l\u2019amplitude, elle ne se soustrait plus \u00e0 l\u2019ouvrage." },
    { emoji: '\u{1F5D3}\u{FE0F}', titre: "La fen\u00eatre des t\u00e2ches est enfin respect\u00e9e", desc: "Vous pouviez inscrire que la vendange se fait du 26 ao\u00fbt au 6 septembre : le simulateur d\u2019effectif n\u2019en tenait aucun compte et raisonnait sur la campagne enti\u00e8re. Il pouvait donc conseiller un effectif qui vendange jusqu\u2019\u00e0 fin septembre sans jamais signaler le d\u00e9bordement. Les projections se calent maintenant sur vos dates, et sur un chantier comme la vendange elles comptent tous les jours, samedi et dimanche compris." },
    { emoji: '\u{23F1}\u{FE0F}', titre: "Le retard ne cr\u00e9e plus de journ\u00e9es de travail", desc: "Le co\u00fbt de retard \u2014 une estimation de ce que vaut une vigne travaill\u00e9e trop tard \u2014 \u00e9tait ajout\u00e9 aux heures, qui rallongeaient le chantier, qui aggravait le retard. \u00c0 une personne, le simulateur affichait 156 jours l\u00e0 o\u00f9 le travail en demande 105. Les jours affich\u00e9s sont d\u00e9sormais les vrais, et le surco\u00fbt de retard appara\u00eet \u00e0 part : une heure estim\u00e9e et une heure pay\u00e9e ne sont pas de m\u00eame nature." },
    { emoji: '\u{1F4C5}', titre: "La fin pr\u00e9vue ne part plus du jour o\u00f9 vous regardez", desc: "La date de fin se projetait \u00e0 partir du jour de consultation, m\u00eame quand les travaux ne pouvaient pas commencer avant trois semaines : fin juillet, une vendange qui d\u00e9marre le 26 ao\u00fbt s\u2019affichait avec quatre jours d\u2019avance. La projection part maintenant de l\u2019ouverture de la fen\u00eatre." },
    { emoji: '\u{1F343}', titre: "Le Pilotage retrouve les t\u00e2ches des p\u00e9riodes au nom libre", desc: "La charge et l\u2019ETP de la campagne cherchaient encore les t\u00e2ches d\u2019apr\u00e8s le premier mot du nom de la p\u00e9riode \u2014 l\u2019ancien fonctionnement, abandonn\u00e9 partout ailleurs. Une p\u00e9riode appel\u00e9e \u00ab Campagne 2026 \u00bb ne remontait donc aucune t\u00e2che : tableau de bord vide, frise vide, aucun ETP. Le Pilotage lit maintenant la liste de t\u00e2ches que vous avez d\u00e9finie pour la p\u00e9riode." }
  ] },
  { v: '5.49', items: [
    { emoji: '\u{1F5D3}\u{FE0F}', titre: 'La frise de la campagne dit enfin la v\u00e9rit\u00e9', desc: "Les mois \u00e9crits au-dessus de la frise \u00e9taient r\u00e9partis \u00e0 parts \u00e9gales et s\u2019arr\u00eataient au quatorzi\u00e8me. Sur une campagne qui s\u2019\u00e9tale sur dix-huit mois, l\u2019\u00e9chelle ne correspondait plus aux couleurs : une p\u00e9riode ouverte le 1er mars se lisait sous le libell\u00e9 de mai, et les derniers mois manquaient tout simplement. Chaque mois est d\u00e9sormais pos\u00e9 \u00e0 sa vraie place, avec un trait par mois et l\u2019ann\u00e9e rappel\u00e9e sur chaque janvier \u2014 sur une campagne \u00e0 cheval sur deux ann\u00e9es, deux \u00ab oct \u00bb ne se ressemblaient que trop." },
    { emoji: '\u{1F9F9}', titre: 'R\u00e9glages ne garde que les p\u00e9riodes qui servent', desc: "\u00c0 raison de quatre \u00e0 six p\u00e9riodes par an, la liste et la frise devenaient illisibles au bout de deux campagnes \u2014 et vous y cherchiez la p\u00e9riode en cours au milieu de celles d\u2019il y a deux ans. R\u00e9glages \u203a Campagne n\u2019affiche plus que les dix-huit derniers mois, plus tout ce qui est en cours ou \u00e0 venir. Rien n\u2019est supprim\u00e9 : un lien sous la liste emm\u00e8ne vers les archives. La p\u00e9riode active et celle que vous consultez restent visibles quoi qu\u2019il arrive." },
    { emoji: '\u{1F5C3}\u{FE0F}', titre: 'Archives des campagnes', desc: "Le Pilotage gagne un onglet \u00ab Archives \u00bb. Toutes vos campagnes y sont empil\u00e9es sur un m\u00eame axe, du 1er ao\u00fbt au 31 juillet \u2014 de r\u00e9colte \u00e0 r\u00e9colte, pour que l\u2019hiver ne soit pas coup\u00e9 en deux par le 31 d\u00e9cembre. D\u2019une ligne \u00e0 l\u2019autre se lit le d\u00e9calage des travaux : est-ce qu\u2019on s\u2019y est pris plus t\u00f4t cette ann\u00e9e ? Les heures affich\u00e9es viennent des instantan\u00e9s pris \u00e0 la cl\u00f4ture de chaque campagne. La comparaison de deux saisons, jusqu\u2019ici cach\u00e9e derri\u00e8re un bouton des R\u00e9glages, a d\u00e9m\u00e9nag\u00e9 ici \u2014 et elle refonctionne quel que soit le nom de vos p\u00e9riodes : elle les rapproche par leur place dans l\u2019ann\u00e9e, plus par leur intitul\u00e9." }
  ] },
  { v: '5.48', items: [
    { emoji: '\u{1F4CC}', titre: "L\u2019en-t\u00eate de chaque module reste en place", desc: "D\u00e8s qu\u2019on faisait d\u00e9filer un \u00e9cran, le bandeau du module partait vers le haut : le nom de la p\u00e9riode consult\u00e9e, les onglets et l\u2019aide disparaissaient, et il fallait remonter tout en haut rien que pour changer d\u2019onglet. L\u2019en-t\u00eate reste d\u00e9sormais fixe \u2014 seul le contenu d\u00e9file dessous. Deux g\u00eanes du m\u00eame ordre disparaissent avec lui : le bouton \uFF0B ne d\u00e9rive plus avec la liste, et l\u2019\u00e9cran ne peut plus glisser de travers apr\u00e8s un changement de module." }
  ] },
  { v: '5.47', items: [
    { emoji: '\u{1F326}\u{FE0F}', titre: 'La m\u00e9t\u00e9o revient en haut de l\u2019Accueil', desc: "Le temps qu\u2019il fait \u00e9tait calcul\u00e9 et tenu \u00e0 jour, mais plus rien ne l\u2019affichait en haut de l\u2019\u00e9cran : il fallait descendre jusqu\u2019\u00e0 la carte m\u00e9t\u00e9o pour le voir. La pastille est de retour sur la ligne de la p\u00e9riode \u2014 temp\u00e9rature et vent, d\u2019un coup d\u2019\u0153il, d\u00e8s l\u2019ouverture. Hors ligne, elle affiche la derni\u00e8re valeur connue en plus p\u00e2le." },
    { emoji: '\u{1F441}\u{FE0F}', titre: 'La date de l\u2019en-t\u00eate \u00e9tait devenue illisible', desc: "Sur l\u2019Accueil, les Parcelles et le Journal, la date affich\u00e9e \u00e0 c\u00f4t\u00e9 de la p\u00e9riode \u00e9tait rest\u00e9e gris fonc\u00e9 sur le bandeau sombre \u2014 un reliquat d\u2019une ancienne version o\u00f9 ce bandeau \u00e9tait clair. Elle se lisait \u00e0 2,95 contre 4,5 exig\u00e9s. C\u2019est corrig\u00e9 sur les trois \u00e9crans." }
  ] },
  { v: '5.46', items: [
    { emoji: '\u{1F4C5}', titre: 'Votre ann\u00e9e se d\u00e9coupe comme vous la travaillez', desc: "L\u2019application imposait quatre saisons \u2014 Hiver, Printemps, \u00c9t\u00e9, Automne \u2014 et d\u00e9duisait les travaux \u00e0 faire du premier mot du nom de la saison. Un domaine qui parle d\u2019une saison de taille et d\u2019une saison verte, ou qui nomme sa campagne autrement, se retrouvait avec un \u00e9cran vide sans comprendre pourquoi. Ce d\u00e9coupage dispara\u00eet. Vous cr\u00e9ez d\u00e9sormais des p\u00e9riodes : un nom libre, une date de d\u00e9but, une date de fin, et la liste des travaux qui s\u2019y font. Deux p\u00e9riodes, quatre, ou six : c\u2019est le v\u00f4tre. R\u00e9glages \u203a Domaine \u203a Campagne." },
    { emoji: '\u{1F5D3}\u{FE0F}', titre: 'La frise de la campagne', desc: "En haut des R\u00e9glages, une frise montre l\u2019ann\u00e9e enti\u00e8re : vos p\u00e9riodes en couleur, le trait du jour, et surtout ce qui manque. Un intervalle que plus aucune p\u00e9riode ne couvre appara\u00eet hachur\u00e9 avec ses dates \u2014 une saisie tomb\u00e9e l\u00e0 ne se rattache \u00e0 rien. Deux p\u00e9riodes qui se recouvrent sont cercl\u00e9es de rouge, avec la r\u00e8gle appliqu\u00e9e \u00e9crite en clair. Une p\u00e9riode se renomme sans rien perdre : l\u2019avancement d\u00e9j\u00e0 enregistr\u00e9 la suit." },
    { emoji: '\u{1F4D3}', titre: 'Le journal ne masque plus aucune t\u00e2che', desc: "La liste des t\u00e2ches du journal suivait la saison en cours : une taille dat\u00e9e de f\u00e9vrier \u00e9tait tout simplement introuvable pendant la saison verte. Elle suit maintenant la <b>date que vous saisissez</b>. Les travaux de la p\u00e9riode qui contient cette date arrivent en t\u00eate, tous les autres restent accessibles juste en dessous. Plus rien n\u2019est cach\u00e9." }
  ] },
  { v: '5.45', items: [
    { emoji: '\u{1F4A1}', titre: 'Une aide sur chaque \u00e9cran', desc: "L\u2019aide et le signalement d\u2019un probl\u00e8me n\u2019existaient qu\u2019au fond des R\u00e9glages : personne n\u2019allait les y chercher depuis le module o\u00f9 le doute venait de na\u00eetre. Chaque \u00e9cran porte d\u00e9sormais une pastille \u00ab ? Aide \u00bb, \u00e0 droite de la ligne de la saison. Elle ouvre l\u2019essentiel du module en quelques lignes \u2014 ce que font les onglets, ce qui se calcule tout seul, ce qui est r\u00e9serv\u00e9 aux administrateurs \u2014 avec le guide complet \u00e0 un geste, et le signalement d\u2019un probl\u00e8me juste \u00e0 c\u00f4t\u00e9. Le signalement part avec l\u2019\u00e9cran depuis lequel il a \u00e9t\u00e9 envoy\u00e9 : plus besoin de raconter o\u00f9 vous \u00e9tiez." }
  ] },
  { v: '5.44', items: [
    { emoji: '\u{1F4B6}', titre: 'Le co\u00fbt d\u2019une parcelle, en euros comme \u00e0 l\u2019hectare', desc: "Le tableau Pilotage \u203a \u00c9conomie n\u2019affichait qu\u2019un co\u00fbt \u00e0 l\u2019hectare. Comme le budget d\u2019une saison se calcule justement en heures par hectare, ce chiffre \u00e9tait rigoureusement le m\u00eame sur toutes les parcelles : rien \u00e0 y comparer. Chaque ligne porte d\u00e9sormais les deux montants \u2014 ce que co\u00fbte la parcelle enti\u00e8re, et ce qu\u2019elle co\u00fbte \u00e0 l\u2019hectare \u2014 et un bouton choisit lequel s\u2019affiche en grand et sert au tri. Le total dit o\u00f9 part l\u2019argent ; l\u2019hectare dit ce qu\u2019une parcelle a de particulier : des plants \u00e0 remplacer, une t\u00e2che en plus, davantage de r\u00e9parations." },
    { emoji: '\u{1FA9B}', titre: 'La plantation se compte au plant, plus \u00e0 l\u2019hectare', desc: "L\u2019entreplantation se mesure au nombre de trous faits \u00e0 la tari\u00e8re. Le tableau des co\u00fbts, lui, appliquait une estimation de quinze heures par hectare \u00e0 toutes les parcelles, y compris celles o\u00f9 il n\u2019y a rien \u00e0 replanter \u2014 pendant que l\u2019avancement des travaux, au m\u00eame moment, comptait bien z\u00e9ro. C\u2019est corrig\u00e9 : sans trou renseign\u00e9, aucune heure n\u2019est compt\u00e9e. L\u00e0 o\u00f9 il y en a, la ligne de la parcelle affiche le nombre de plants et ce qu\u2019ils co\u00fbtent, avec le prix d\u2019un plant rappel\u00e9 en haut du tableau. Vos co\u00fbts vont baisser : ils sont simplement devenus justes." },
    { emoji: '\u{1F4CB}', titre: 'Ajouter une t\u00e2che : les deux chemins c\u00f4te \u00e0 c\u00f4te', desc: "Le bar\u00e8me de la convention \u00e9tait un bandeau en t\u00eate de la liste des t\u00e2ches, le bouton de cr\u00e9ation tout en bas : deux gestes \u00e9loign\u00e9s pour une m\u00eame intention. Ils sont maintenant r\u00e9unis sous la liste, dans R\u00e9glages \u203a Vigne. \u00ab Nouvelle t\u00e2che selon le bar\u00e8me de la convention \u00bb part des travaux officiels et de leurs heures de r\u00e9f\u00e9rence ; \u00ab Nouvelle t\u00e2che libre \u00bb cr\u00e9e la v\u00f4tre de bout en bout." }
  ] },
  { v: '5.43', items: [
    { emoji: '\u{1F441}\u{FE0F}', titre: 'Chaque personne ne voit que ses modules', desc: "La barre du bas proposait les m\u00eames modules \u00e0 toute l\u2019\u00e9quipe. Vous pouvez d\u00e9sormais masquer, personne par personne, ceux qui ne la concernent pas \u2014 dans R\u00e9glages \u203a \u00c9quipe, en ouvrant sa fiche : un caviste n\u2019a que faire de l\u2019avancement des vignes, un ouvrier n\u2019a rien \u00e0 faire dans la cave. Quatre boutons posent une combinaison courante d\u2019un seul geste, Tout \u00b7 Vigne \u00b7 Tracteur \u00b7 Cave, et vous ajustez ensuite case par case. Le changement s\u2019applique \u00e0 la prochaine ouverture de la personne concern\u00e9e. Il s\u2019agit d\u2019all\u00e9ger l\u2019\u00e9cran, pas de prot\u00e9ger une donn\u00e9e\u202f: ce sont les r\u00f4les qui d\u00e9cident de ce que chacun peut modifier, et les R\u00e9glages restent accessibles \u00e0 tous." }
  ] },
  { v: '5.42', items: [
    { emoji: '\u{1F9EE}', titre: 'Vos heures report\u00e9es comptent enfin dans le compteur', desc: "Le solde de d\u00e9part \u2014 les heures acquises avant Ma Vigne, que vous saisissez une fois par salari\u00e9 \u2014 s\u2019affichait bien dans la fiche, mais le compteur l\u2019ignorait : impossible de payer ou de faire r\u00e9cup\u00e9rer ces heures-l\u00e0. Un salari\u00e9 arriv\u00e9 avec quarante heures en r\u00e9serve, et sans heure suppl\u00e9mentaire depuis, se voyait refuser toute saisie de paiement sans la moindre explication. Ce report est d\u00e9sormais la ligne la plus ancienne du compteur : c\u2019est lui qui part en premier quand une heure est r\u00e9cup\u00e9r\u00e9e ou pay\u00e9e. Cons\u00e9quence visible dans la fiche salari\u00e9 : le \u00ab Compteur \u00bb et le solde net de l\u2019ann\u00e9e affichent maintenant le m\u00eame chiffre." },
    { emoji: '\u{1F4C4}', titre: 'Le nombre de jours travaill\u00e9s sur le relev\u00e9 d\u2019heures', desc: "Le relev\u00e9 PDF d\u2019un salari\u00e9 indique maintenant, \u00e0 c\u00f4t\u00e9 des heures, le nombre de jours r\u00e9ellement travaill\u00e9s dans le mois \u2014 le chiffre que r\u00e9clame la MSA pour les saisonniers. Un jour compte d\u00e8s qu\u2019il a \u00e9t\u00e9 travaill\u00e9, quelle que soit sa dur\u00e9e ; les cong\u00e9s, les r\u00e9cup\u00e9rations et les absences n\u2019en sont pas. Un samedi ou un jour f\u00e9ri\u00e9 r\u00e9ellement travaill\u00e9 compte, lui, normalement." },
    { emoji: '\u{1F4CB}', titre: 'Le bar\u00e8me de la convention, et vos t\u00e2ches rattach\u00e9es', desc: "Les travaux de la vigne et leurs heures \u00e0 l\u2019hectare de r\u00e9f\u00e9rence se consultent d\u00e9sormais depuis R\u00e9glages \u203a Saisons, en haut de la liste des t\u00e2ches : le cycle complet, les travaux compl\u00e9mentaires, et pour chacun les t\u00e2ches de votre domaine qui s\u2019y rattachent. Surtout, une t\u00e2che que vous aviez cr\u00e9\u00e9e vous-m\u00eame portait la mention \u00ab Hors convention \u00bb sans aucun recours. Touchez cette mention : vous choisissez le travail conventionnel auquel elle correspond. Votre t\u00e2che garde son nom, ses saisons et ses heures \u00e0 l\u2019hectare \u2014 le rattachement sert de rep\u00e8re, il ne la remplace pas." }
  ] },
  { v: '5.41', items: [
    { emoji: '\u{23F1}\u{FE0F}', titre: 'Vos heures se comptent maintenant \u00e0 l\u2019ann\u00e9e', desc: "L\u2019onglet \u00ab H. sup \u00bb de la fiche salari\u00e9 devient \u00ab Compteur \u00bb. Il raisonnait mois par mois, avec des heures qui disparaissaient au bout de trois mois. Le d\u00e9compte suit d\u00e9sormais l\u2019ann\u00e9e compl\u00e8te : un plafond annuel \u2014 1607 heures pour un temps plein, proratis\u00e9 pour un contrat plus court \u2014 et le cumul des heures r\u00e9ellement travaill\u00e9es en face. Plus rien ne p\u00e9rime en cours d\u2019ann\u00e9e, le solde se r\u00e8gle \u00e0 la cl\u00f4ture du 31 d\u00e9cembre. Une seconde jauge suit les heures faites au-del\u00e0 de 35 heures dans une semaine, face au plafond de 250 heures par an de l\u2019accord agricole. Le d\u00e9tail mois par mois reste \u00e0 sa place, \u00e0 l\u2019\u00e9cran comme sur le relev\u00e9 PDF." },
    { emoji: '\u{2600}\u{FE0F}', titre: 'Un jour de cong\u00e9 n\u2019est plus une heure travaill\u00e9e', desc: "La journ\u00e9e reste pay\u00e9e exactement comme avant, rien ne change sur la paie. En revanche elle ne compte plus comme du temps de travail dans les compteurs \u2014 c\u2019est la r\u00e8gle. Une semaine avec un jour de cong\u00e9 ne peut donc plus d\u00e9clencher une alerte de d\u00e9passement, et les cong\u00e9s ne remplissent plus le compteur annuel, puisque les 1607 heures sont d\u00e9j\u00e0 calcul\u00e9es cong\u00e9s d\u00e9duits. Vous verrez des totaux plus bas qu\u2019avant sur le cadre l\u00e9gal : ce sont les bons." },
    { emoji: '\u{1FA79}', titre: 'Chaque absence a maintenant son motif', desc: "Une absence se notait par une case et un commentaire libre. Elle se choisit d\u00e9sormais parmi sept motifs, et chacun affiche son effet en clair au moment o\u00f9 vous le s\u00e9lectionnez. Un arr\u00eat de travail abaisse le plafond annuel du salari\u00e9 : ses heures ne sont pas \u00e0 rattraper. Une formation compte comme du travail effectif. Un retard se saisit en heures et non en journ\u00e9e. Vos absences d\u00e9j\u00e0 enregistr\u00e9es gardent leur comportement actuel tant que vous ne leur donnez pas de motif." },
    { emoji: '\u{1F3D6}\u{FE0F}', titre: 'Le solde de cong\u00e9s suit votre p\u00e9riode de r\u00e9f\u00e9rence', desc: "Le compteur de jours pris additionnait tous les cong\u00e9s jamais enregistr\u00e9s, toutes ann\u00e9es confondues : un salari\u00e9 pr\u00e9sent depuis deux ans voyait un solde faux. Il se limite maintenant \u00e0 la p\u00e9riode en cours, du 1er juin au 31 mai. Si la v\u00f4tre suit l\u2019ann\u00e9e civile, cela se r\u00e8gle dans la fiche salari\u00e9, onglet Cong\u00e9s." },
    { emoji: '\u{2699}\u{FE0F}', titre: 'Les r\u00e8gles de votre domaine', desc: "Ce que deviennent les heures faites au-del\u00e0 du planning du mois \u2014 pay\u00e9es en acompte, r\u00e9cup\u00e9r\u00e9es en repos, ou report\u00e9es \u00e0 la cl\u00f4ture \u2014 se choisit dans Planning \u203a Outils, avec la dur\u00e9e annuelle et le plafond de modulation si votre accord en fixe d\u2019autres." }
  ] },
  { v: '5.40', items: [
    { emoji: '\u{1F9ED}', titre: 'Une seule façon de naviguer, partout', desc: "Chaque module était construit à sa manière : les onglets tantôt en haut, tantôt en bas, des en-têtes de hauteurs différentes, des piles de boutons qui variaient d'un écran à l'autre. Tout suit désormais la même anatomie : le nom du module et la saison en haut, les onglets juste en dessous — toujours au même endroit, toujours de la même hauteur — puis les chiffres clés, puis le contenu. Vous n'avez plus à réapprendre chaque écran : ce que vous savez faire dans un module se retrouve à l'identique dans les autres. Rien n'a changé dans vos données ni dans vos réglages." },
    { emoji: '\u{1F9EA}', titre: 'Le phyto a son propre module', desc: "Le registre des traitements et le catalogue E-Phy étaient cachés dans un onglet du module Tracteur, ce qui n'allait pas de soi quand on cherchait simplement à noter une pulvérisation. Le phyto devient un module à part entière, avec son entrée dédiée dans la barre du bas. Registre et catalogue sont maintenant deux onglets en haut de l'écran, et le bouton « nouveau traitement » est le gros bouton rond en bas à droite, comme ailleurs. Le Tracteur, lui, se concentre sur ce qu'il fait de mieux : les sessions et l'entretien." },
    { emoji: '\u{1F377}', titre: 'La Cave va droit au but', desc: "Il fallait d'abord passer par un écran de sélection pour choisir entre « Vendange » et « Élevage » avant d'atteindre quoi que ce soit. Cet écran disparaît : Le Chai et Le Cuvier sont devenus deux onglets, vous arrivez directement dans le chai. Au passage, un défaut d'affichage est corrigé — deux en-têtes se superposaient, affichant deux fois le nom du domaine et deux fois la date." },
    { emoji: '\u{1F4CA}', titre: 'Le Pilotage passe de neuf onglets à cinq', desc: "Neuf onglets, c'était trop pour s'y retrouver. « Personnel » et « Matériel » n'en font plus qu'un, « Économie » et « Conformité » également, et les deux écrans que l'on ouvre rarement — la simulation et le paramétrage — se rangent derrière un bouton « Outils » en bout de barre. L'onglet sur lequel vous étiez resté et les indicateurs que vous aviez décochés sont conservés." }
  ] },
  { v: '5.39', items: [
    { emoji: '\u{1F4B6}', titre: 'Un taux horaire par salari\u00e9', desc: "Le co\u00fbt du travail ne se r\u00e8gle plus par cat\u00e9gorie de contrat mais personne par personne. Ouvrez la fiche d\u2019un salari\u00e9 dans R\u00e9glages \u203a \u00c9quipe : un champ \u00ab Taux horaire charg\u00e9 \u00bb y attend son co\u00fbt employeur r\u00e9el, \u00e0 renseigner \u00e0 l\u2019embauche ou plus tard, et \u00e0 modifier d\u2019un geste en cas d\u2019augmentation \u2014 l\u2019application garde la trace du changement. Le co\u00fbt \u00e0 l\u2019hectare du tableau de bord Pilotage s\u2019appuie d\u00e9sormais sur ces taux r\u00e9els. Ces montants vivent dans un espace \u00e0 part, lisible des seuls administrateurs : aucun salari\u00e9 ne peut voir la r\u00e9mun\u00e9ration d\u2019un coll\u00e8gue." },
    { emoji: '\u{1F6E2}\u{FE0F}', titre: 'Le prix du GNR se note \u00e0 la livraison', desc: "Nouvelle action \u00ab Appoint de cuve \u00bb dans Tracteur \u203a Entretien : \u00e0 chaque remplissage de la cuve du domaine, indiquez les litres livr\u00e9s, le prix au litre, la date et le fournisseur. Le niveau de la cuve remonte automatiquement et le prix du carburant se met \u00e0 jour tout seul \u2014 en moyenne pond\u00e9r\u00e9e sur vos appoints, donc au plus pr\u00e8s de ce que vous payez vraiment. Fini le prix du GNR \u00e0 saisir \u00e0 la main dans les r\u00e9glages : il se note l\u00e0 o\u00f9 vous avez la facture sous les yeux. R\u00e9serv\u00e9 \u00e0 l\u2019administrateur." },
    { emoji: '\u{1F69C}', titre: 'Un onglet Tracteur dans les R\u00e9glages', desc: "Le parc de tracteurs et les activit\u00e9s tracteur \u00e9taient rang\u00e9s dans l\u2019onglet \u00ab \u00c9quipe \u00bb, o\u00f9 personne ne pensait \u00e0 les chercher. Ils ont maintenant leur propre onglet \u00ab Tracteur \u00bb." }
  ] },
  { v: '5.38', items: [
    { emoji: '\u{1F4B6}', titre: 'Le coût de chaque parcelle, en euros', desc: "Le tableau de bord Pilotage gagne un onglet « Économie ». Pour chaque parcelle, il affiche son coût à l’hectare : la main-d’œuvre (heures de vigne au barème + heures de tracteur réalisées, à votre taux horaire), le carburant GNR estimé, et les produits phyto. Les parcelles sont classées de la plus coûteuse à la moins coûteuse — de quoi repérer d’un coup d’œil celles qui pèsent le plus. Pour l’activer, renseignez dans Réglages › Domaine un taux horaire par type de contrat et le prix du litre de GNR. Le coût phyto se calcule tout seul à partir des doses de vos traitements et du prix unitaire des intrants saisi dans La Réserve. En lecture seule, réservé aux profils administrateur et pilotage." },
    { emoji: '\u{1F6E1}\u{FE0F}', titre: 'Votre conformité réglementaire en direct', desc: "Toujours dans Pilotage, un onglet « Conformité » réunit trois suivis longtemps calculés en coulisse, enfin visibles au même endroit. Le cuivre : le cumul de cuivre métal sur 7 ans de chaque parcelle face au plafond bio de 28 kg/ha, avec un code couleur qui signale les dépassements. Les passages phyto : le nombre d’interventions par parcelle sur la saison, comparé à une référence régionale que vous ajustez dans Réglages. Et le délai de rentrée (DRE) : après un traitement, les parcelles où l’entrée reste interdite, avec l’heure exacte à laquelle elles redeviennent accessibles." }
  ] },
  { v: '5.37', items: [
    { emoji: '🔍', titre: 'Lire plus facilement, même en plein soleil', desc: "Deux améliorations pour la lisibilité en extérieur. D'abord, le pincer-pour-zoomer est réactivé partout dans l'application : écartez deux doigts pour agrandir un petit texte, un tableau ou la carte — rien n'est verrouillé, c'est vous qui choisissez la taille. Ensuite, le mode « Plein soleil » (contraste renforcé pour l'extérieur) retrouve son accès dans Réglages › Application, d'un simple appui." },
    { emoji: '⌨️', titre: 'Les fenêtres se ferment au clavier', desc: "Sur ordinateur, la touche Échap referme n'importe quelle fenêtre ouverte ; le focus reste à l'intérieur de la fenêtre (fini le saut inattendu vers l'arrière-plan) puis revient à sa place à la fermeture. Les lecteurs d'écran annoncent désormais correctement l'ouverture d'une fenêtre." },
    { emoji: '⚡', titre: 'Des écrans plus rapides', desc: "L'application démarre plus vite : la carte n'est plus chargée qu'au moment où vous l'ouvrez (Parcelles ou Pilotage), au lieu de peser sur chaque démarrage — y compris l'écran de connexion. Et pendant qu'un module se remplit, une trame de chargement remplace l'écran blanc, pour une attente plus douce." },
    { emoji: '📲', titre: 'Mieux installée sur votre téléphone', desc: "Quelques réglages internes améliorent le comportement de Ma Vigne quand elle est installée sur l'écran d'accueil de votre téléphone, et renforcent la redirection vers le domaine officiel de l'application." }
  ] },
  { v: '5.36', items: [
    { emoji: '🔬', titre: 'Suivre la maturité du raisin, parcelle par parcelle', desc: "Un nouvel onglet « Analyses » ouvre la marche dans Cave › Vendange (Le Cuvier). Avant les vendanges, relevez la maturité de chaque parcelle : saisissez au choix le sucre en g/L ou le degré potentiel en %vol — l'application convertit l'un en l'autre (degré = sucre ÷ 16,83) et affiche l'estimation alcoolique en direct. Chaque parcelle conserve l'historique de ses mesures et trace sa courbe d'évolution, pour choisir le meilleur moment de récolte d'un coup d'œil. Au passage, les onglets du Cuvier suivent désormais l'ordre du travail : Analyses, Récoltes, puis Cuvier." },
    { emoji: '🍾', titre: 'Mettre vos cuvées en bouteille', desc: "Le Chai (Cave › Élevage) gagne un onglet « Bouteilles ». Quand une cuvée est prête, l'application propose un nombre de bouteilles calculé sur le volume élevé — ajustable au chiffre réel —, puis la cuvée quitte le chai et rejoint votre stock. Ce stock s'archive par millésime, avec le nombre exact de bouteilles par cuvée, modifiable à tout moment. Et pour chaque cuvée embouteillée, un graphique retrace la perte de volume tout au long de la chaîne — de la récolte à la cuve, puis à l'élevage et enfin à la bouteille — dès que ces étapes sont renseignées." },
    { emoji: '🗂️', titre: 'Trier vos cuvées par millésime', desc: "Quand plusieurs millésimes cohabitent dans le chai, des filtres apparaissent au-dessus de vos cuvées : d'un geste, n'affichez que le dernier millésime, un plus ancien, ou l'ensemble." }
  ] },
  { v: '5.35', items: [
    { emoji: '📄', titre: 'Votre contrat rempli et signé, à télécharger', desc: "Quand vous acceptez les CGU et le DPA à la première ouverture de votre domaine, vos deux documents se remplissent désormais automatiquement avec les coordonnées de votre exploitation — raison sociale, SIRET, adresse et signataire. L’écran de fin vous propose de télécharger l’exemplaire signé de chacun (date, référence et empreinte de sécurité SHA-256), que vous retrouvez à tout moment dans Réglages › CGU & Mentions légales, avec un bouton « Imprimer / Enregistrer en PDF ». Et avant de signer, les liens « Lire » affichent désormais un aperçu déjà rempli à vos informations." }
  ] },
  { v: '5.34', items: [
    { emoji: '📦', titre: 'La Réserve : vos fûts et vos stocks d’intrants', desc: "Un nouveau module « La Réserve » fait son entrée dans la barre du bas. Il réunit l’inventaire de vos fûts — fournisseur, référence, millésime et quantité, avec des listes déroulantes qui se remplissent au fil de vos saisies — et le suivi du stock de vos intrants (phyto et œno). Enregistrez vos achats et votre inventaire d’ouverture, et l’application calcule toute seule ce qu’il vous reste : entrées − consommé = stock. Pour l’œno, le consommé se déduit directement des opérations de la cave ; pour le phyto, du registre. Nouveauté : les intrants phyto se choisissent directement dans le catalogue officiel E-Phy (ANSES), leur numéro d’AMM conservé pour le contrôle. Un bilan matière prêt à présenter au contrôle bio (règlement UE 2021/771) est exportable en PDF." }
  ] },
  { v: '5.33', items: [] },
  { v: '5.32', items: [
    { emoji: '\u{1F511}', titre: 'Chacun son mot de passe', desc: "Jusqu\u2019ici tous les comptes partageaient le m\u00eame mot de passe, et le bouton \u00ab Changer mon mot de passe \u00bb ne fonctionnait pas \u2014 impossible d\u2019en sortir, m\u00eame en le voulant. C\u2019est corrig\u00e9. Chaque nouveau compte re\u00e7oit d\u00e9sormais un mot de passe unique et facile \u00e0 dire (par exemple \u00ab cave-rouge-427 \u00bb), affich\u00e9 une seule fois \u00e0 l\u2019administrateur au moment de la cr\u00e9ation. La personne le tape \u00e0 sa premi\u00e8re connexion, choisit imm\u00e9diatement le sien, et personne d\u2019autre ne le conna\u00eet \u2014 pas m\u00eame son responsable." },
    { emoji: '\u{1F504}', titre: 'D\u00e9panner quelqu\u2019un qui a oubli\u00e9 le sien', desc: "Sur la fiche d\u2019un membre (R\u00e9glages \u203a Membres), un bouton \u00ab R\u00e9initialiser le mot de passe \u00bb g\u00e9n\u00e8re un nouveau mot de passe provisoire, affich\u00e9 une seule fois. Vous le communiquez \u00e0 la personne, qui choisit le sien \u00e0 la connexion suivante. Aucune adresse e-mail n\u2019est n\u00e9cessaire \u2014 pratique pour les saisonniers, qui n\u2019en ont pas. Les administrateurs, eux, doivent avoir une vraie adresse : c\u2019est leur seul moyen de r\u00e9cup\u00e9rer leur acc\u00e8s, puisque personne n\u2019est au-dessus d\u2019eux pour les d\u00e9panner." }
  ] },
  { v: '5.31', items: [
    { emoji: '\u{1F4D0}', titre: 'Des en-t\u00eates enfin align\u00e9s', desc: "Le bandeau sombre du haut a d\u00e9sormais exactement la m\u00eame hauteur sur tous les modules \u2014 Vigne, Tracteur, Cave, Planning, R\u00e9glages : plus aucun saut en passant de l\u2019un \u00e0 l\u2019autre, et le titre d\u00e9marre toujours au m\u00eame endroit. Le rappel \u00ab Ma Vigne \u00bb, qui n\u2019apparaissait que sur les pages Vigne et cr\u00e9ait le d\u00e9calage, laisse la place au contenu. En \u00e9change, la barre \u00ab saison \u00b7 date \u00bb descend sur tous les modules : vous savez en permanence quelle saison vous consultez, o\u00f9 que vous soyez dans l\u2019application. Cave et Le Chai gagnent leur tuile d\u2019ic\u00f4ne et voient leurs boutons regroup\u00e9s \u00e0 droite, comme partout ailleurs." }
  ] },
  { v: '5.30', items: [
    { emoji: '\u2728', titre: 'Interface repens\u00e9e', desc: "Toute l\u2019application parle d\u00e9sormais le m\u00eame langage visuel. Les en-t\u00eates de chaque module \u2014 Vigne, Parcelles, Journal, Tracteur, Cave, Planning, Pilotage, R\u00e9glages \u2014 ont maintenant exactement la m\u00eame hauteur : plus de d\u00e9calage en passant de l\u2019un \u00e0 l\u2019autre. Chacun est soulign\u00e9 du m\u00eame filet terre \u2192 or \u2192 vert et porte son ic\u00f4ne dans une tuile aux couleurs du module. Les compteurs qui vivaient dans le bandeau sombre sont descendus sur des cartes claires, plus lisibles en plein soleil. Les listes \u2014 parcelles, journal, sessions tracteur \u2014 adoptent la carte \u00ab papier \u00bb : une bande de couleur sur le c\u00f4t\u00e9 donne l\u2019\u00e9tat d\u2019un coup d\u2019\u0153il, vert termin\u00e9, or bien avanc\u00e9, rouge en retard. Les noms de parcelles, de cuv\u00e9es et d\u2019activit\u00e9s passent en Cormorant, et les jauges, plus \u00e9paisses, se remplissent en douceur \u00e0 l\u2019ouverture. Au passage, plusieurs textes trop p\u00e2les pour \u00eatre lus \u2014 badges \u00ab Valid\u00e9 \u00bb, \u00ab S\u00e9lectionner une section \u00bb \u2014 ont retrouv\u00e9 un contraste correct." }
  ] },
  { v: '5.29', items: [] },
  { v: '5.28', items: [] },
  { v: '5.27', items: [] },
  { v: '5.26', items: [] },
  { v: '5.25', items: [
    { emoji: '🏖️', titre: 'Poser des congés sur une période', desc: "Dans Planning › Outils, un nouvel outil « Poser des congés » permet de poser des CP sur toute une période en une fois, pour un ou plusieurs salariés à la fois — pratique quand l’équipe part en même temps. Choisissez les dates de début et de fin, cochez les salariés concernés, et l’aperçu vous montre le nombre de jours décomptés pour chacun (selon votre mode de décompte, jours ouvrables ou ouvrés). Les dimanches et jours fériés ne sont jamais décomptés. Un bouton « Retirer » efface les congés de la période si besoin." }
  ] },
  { v: '5.24', items: [
    { emoji: '⏱️', titre: 'Chronométrer le temps de travail au tracteur', desc: "Dans une session tracteur, vous pouvez désormais mesurer le temps réel passé, parcelle par parcelle. Démarrez le chrono, cochez les parcelles pendant qu’il tourne (elles se partagent le temps, réparti à la surface), mettez en pause au besoin, puis arrêtez : chaque parcelle reçoit son temps mesuré. C’est optionnel — sans chrono, le barème habituel s’applique — et à activer dans Réglages › Activités tracteur. L’avancement d’une session reste calculé en hectares ; le temps mesuré alimente en plus le Rapport de saison et le Pilotage, au plus près du terrain." }
  ] },
  { v: '5.23', items: [
    { emoji: '🍇', titre: 'Le Cuvier : les vendanges de A à Z', desc: "L’onglet Cave › Vendange fait peau neuve. Pesez vos récoltes en caisses (le poids se convertit en kilos et en hectolitres estimés selon votre rendement), suivez chaque cuve de vinification avec sa courbe de fermentation, et enregistrez vos opérations : chaptalisation — le nombre de kilos de sucre est calculé d’après le volume et le degré visé —, refroidissement, saignée, levurage, nutriment… La densité relevée est automatiquement ramenée à 20 °C, pour un degré potentiel juste quelle que soit la température du moût." },
    { emoji: '🍷', titre: 'Vendre en vrac, ou passer la cuvée en élevage', desc: "Une parcelle part chez un client ? Indiquez-le (avec son propre poids de caisse) et la récolte est comptée en vente vrac. Et une fois la cuvaison terminée, le bouton « Décuver » crée directement la cuvée dans Le Chai avec ses barriques — le suivi d’ouillage démarre tout seul." }
  ] },
  { v: '5.22', items: [
    { emoji: '🕐', titre: 'Modifier les heures d’un coup sur plusieurs jours', desc: "Dans la grille d’équipe, la sélection multiple permet maintenant de fixer un horaire (prise et fin de service, avec ou sans pause déjeuner) et de l’appliquer à tous les jours cochés en une seule fois. Pratique pour caler la semaine de toute l’équipe, ou une journée de vendanges un samedi. Les congés, absences et récupérations compris dans la sélection sont préservés." }
  ] },
  { v: '5.21', items: [
    { emoji: '⚖️', titre: 'Rapport de saison : où va le temps de l’équipe', desc: "La section Heures du rapport montre désormais comment se répartit la présence de l’équipe : travaux vigne (au barème), tracteur et autres activités (cave, trajets, entretien…), avec l’ETP nécessaire pour chaque poste. L’avancement vigne et l’« ETP vigne » (nombre d’équivalents temps plein pour les seuls travaux de la vigne) sont mis en avant. Le tracteur reste fondu dans « autres » tant qu’aucun barème d’heures par hectare n’est renseigné." }
  ] },
  { v: '5.20', items: [
    { emoji: '📄', titre: 'Rapport de saison enrichi, au choix de la saison', desc: "Le rapport PDF de saison couvre désormais toute la campagne : avancement par tâche et par parcelle (avec dates de validation), sessions tracteur, parc et fiches d’entretien, incidents et réparations, réparations de palissage, registre phyto, conformité cuivre bio et heures/ETP. Un seul bouton dans Réglages, et vous choisissez la saison à éditer — active ou passée. Les heures de chaque saison sont désormais mémorisées séparément." }
  ] },
  { v: '5.19', items: [
    { emoji: '🩹', titre: 'Reconstruire l’avancement d’une saison passée', desc: "Un travail validé cet hiver figure déjà dans le journal, mais l’avancement de cette saison affiche encore 0 % ? Le bouton « Reconstruire l’avancement d’après le journal » (Réglages › Saisons) reconstitue l’avancement de la saison consultée à partir des validations du journal, sur sa période. Un récapitulatif est proposé avant d’appliquer, et rien n’est jamais supprimé." },
    { emoji: '📅', titre: 'Consultation de saison plus lisible', desc: "Quand vous consultez une autre saison que l’active, l’accueil, la carte d’avancement et les onglets Parcelles et Journal affichent désormais la saison consultée (et non l’active) — seule la pastille conserve la mention « consultée »." }
  ] },
  { v: '5.18', items: [
    { emoji: '🔵', titre: 'Budget cuivre en direct dans le traitement', desc: "Lors d'une saisie de traitement au cuivre, l'assistant affiche pour chaque parcelle traitée le cumul de cuivre métal sur 7 ans face au plafond bio de 28 kg/ha — cumul actuel + apport de ce traitement. Un dépassement est signalé, mais n'empêche jamais l'enregistrement (le registre doit refléter la réalité). Le calcul est exactement celui de votre synthèse cuivre dans Réglages." }
  ] },
  { v: '5.17', items: [
    { emoji: '➕', titre: 'Ajouter : session ou traitement', desc: "Le bouton ＋ de l'onglet Tracteur propose maintenant un choix — démarrer une session mécanique, ou saisir un traitement phytosanitaire (qui ouvre l'assistant réglementaire avec les produits E-Phy). Un seul point d'entrée pour les deux." }
  ] },
  { v: '5.16', items: [
    { emoji: '🚜', titre: 'Module Tracteur repensé', desc: "L'onglet Tracteur fait peau neuve : le chantier en cours s'affiche désormais en grande carte « live » — avancement en hectares et bouton pour enregistrer directement. Le parc devient une bande de cartes où chaque machine indique d'un coup d'œil sa prochaine révision ou son passage au garage (touchez-la pour ouvrir son entretien). L'ensemble adopte le filet doré du domaine et un accent vert sur les sessions terminées." }
  ] },
  { v: '5.15', items: [] },
  { v: '5.14', items: [] },
  { v: '5.13', items: [] },
  { v: '5.12', items: [
    { emoji: '🍷', titre: "Cave › Élevage repensé", desc: "L'onglet Cave › Élevage fait peau neuve. Un en-tête « Le Chai » résume l'état du chai d'un coup d'œil (cuvées, fûts, hectolitres, ouillages en retard), et chaque cuvée affiche sa jauge « part des anges » : le temps écoulé depuis le dernier ouillage face à votre seuil, du vert à l'orange puis au rouge. Les cuvées à ouiller remontent en tête de liste, avec un bouton pour lancer l'ouillage de toutes celles qui le réclament, et les gestes du quotidien (ouiller, soutirer, analyser) sont à portée directe sur chaque carte. Le journal passe en frise chronologique par mois." }
  ] },
  { v: '5.11', items: [
    { emoji: '🏁', titre: "Clôturer la campagne", desc: "Un bouton dans Réglages › Saisons pour terminer officiellement la campagne : bilan de l'équipe, archivage dans l'Historique, puis démarrage de la suivante. Toute l'équipe bascule ensemble et la nouvelle campagne démarre vierge (les travaux tracteur de la campagne finie restent rangés dans leur saison)." }
  ] },
  { v: '5.10', items: [
    { emoji: '🗂️', titre: "Préparer une saison à l'avance", desc: "Consultez une autre saison (l'hiver, la campagne suivante…) pour préparer vos travaux et votre pilotage — sans rien changer pour l'équipe, qui reste sur la saison active. La bascule de tous ne se fait qu'en ACTIVANT la saison. Le choix de la saison consultée est propre à chaque appareil." },
  { emoji: '🗓️', titre: "Dates de travaux estimées", desc: "En modifiant une saison (Réglages › Saisons › ✏️), indiquez une fenêtre de dates estimée par tâche (ex. Taille : 15 janv. → 28 févr.). Elles s'affichent dans le Pilotage de la saison consultée pour anticiper la charge et les échéances." }
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
function _wnRow(item, sep) {
  return '<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;' + sep + '">'
    + '<div style="width:32px;height:32px;background:var(--gris-clair);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px;">' + item.emoji + '</div>'
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
export const TEMOJI = {
  Taille:'🌿',Tirage:'🔄',Brulage:'🔥',Pliage:'🔗',Reparation:'🛠️',
  Plantation:'🌱',Entreplantation:'🕳️',Ebourgeonnage:'🌾',Ebourgeonnage1:'🌾',Ebourgeonnage2:'🌾',
  Pioche:'⛏️',Relevage:'⬆️',Accolage:'🔗',Palissage:'🪵',
  Arrachage:'🪓',Desherbage:'🧹',Effeuillage:'🍃',Vendange:'🍇','Réparation ponctuelle':'🔧'
};
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
export function wmoEmoji(c) {
  if(c===0)return'☀️';if(c<=2)return'🌤️';if(c===3)return'☁️';
  if(c<=48)return'🌫️';if(c<=65)return'🌧️';if(c<=77)return'❄️';
  if(c<=82)return'🌦️';return'⛈️';
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
  if(mode === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if(mode === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    // Auto : retirer l'attribut → la media query OS prend le relais
    root.removeAttribute('data-theme');
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
    ico: '\u{1F33F}', titre: 'Accueil', ancre: 'vigne',
    points: [
      ['La priorité du moment', "reste épinglée en haut : c’est ce que l’équipe attaque aujourd’hui."],
      ['Ma part du chantier', "montre ce que vous avez fait vous-même sur le travail en cours ; « Ma trace » ouvre le détail de votre campagne. Ce sont des hectares, jamais des heures, et rien n’est comparé entre collègues."],
      ['Appui long puis glisser', "déplace un bloc ; l’œil le masque. Chacun règle son Accueil."],
      ['La pastille de saison', "change la vue. Revenir sur une période passée ne touche pas à la période active."],
      ['Actualiser', "force une resynchronisation quand un chiffre semble figé."],
      ['La météo a besoin du réseau.', "Hors ligne, elle affiche la dernière prévision reçue."]
    ]
  },
  parcelles: {
    ico: '\u{1F5FA}\u{FE0F}', titre: 'Mes Parcelles', ancre: 'vigne',
    points: [
      ['Les filtres du haut', "trient par état : finies, en cours, arrachées."],
      ['Le bouton vert', "sur une carte valide la tâche en cours sans ouvrir la parcelle."],
      ['Onglet Carte', ": les contours viennent de votre export PAC ou d’un fichier KML."],
      ['La recherche', "accepte le nom du climat comme le lieu-dit."],
      ['Une parcelle arrachée', "sort des totaux mais reste dans l’historique."]
    ]
  },
  journal: {
    ico: '\u{1F4D3}', titre: 'Journal', ancre: 'vigne',
    points: [
      ['Chaque tâche validée', "écrit une ligne ici, avec la parcelle, la personne et la durée."],
      ['Une équipe au travail', "tient en une seule entrée : tous les noms y figurent, et le travail se partage entre eux."],
      ['Les filtres', "par parcelle et par tâche se cumulent ; la pastille rappelle ce qui est actif."],
      ['Une saisie faite hors réseau', "repart toute seule au retour du signal."],
      ['Le journal en fichier', "se prend dans Réglages, onglet App, « Documents & impressions »."]
    ]
  },
  tracteur: {
    ico: '\u{1F69C}', titre: 'Tracteur', ancre: 'tracteur',
    points: [
      ['Onglet Sessions', ": le travail fait avec la machine. Onglet Entretien : révisions, réparations, appoints de cuve."],
      ['Le parc', "s’affiche en pastilles sous les chiffres — toucher une machine filtre l’écran."],
      ['Une session en cours', "reste signalée en haut tant qu’elle n’est pas fermée."],
      ['L’appoint de cuve GNR', "remonte le niveau et recalcule le prix du litre en moyenne pondérée."],
      ['Le carnet d’entretien', "s’imprime machine par machine depuis Réglages, onglet App, « Documents & impressions »."],
      ['Rôle Tractoriste requis', "pour écrire : sans lui, l’écran passe en consultation seule."]
    ]
  },
  phyto: {
    ico: '\u{1F9EA}', titre: 'Phyto', ancre: 'phyto',
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
    ico: '\u{1F4C5}', titre: 'Planning', ancre: 'planning',
    points: [
      ['Onglet Équipe', ": la grille de tout le monde. Onglet Mon planning : la vue du salarié."],
      ['Toucher un jour', "ouvre l’éditeur, qui enchaîne jour suivant et salarié suivant sans quitter l’écran."],
      ['Sélection multiple', ": congés, absence, récup ou horaires chaleur sur plusieurs jours d’un coup."],
      ['Les heures dues', "se décomptent sur une absence injustifiée ou un retard. Un arrêt de travail est neutre, une formation compte comme du travail."],
      ['Présence, coupure, heures dues', "trois nombres qui se ressemblent et ne disent pas la même chose. La ‹‹ présence ›› va de l’arrivée au départ. La ‹‹ coupure ›› est le temps non travaillé au milieu — sa durée et son heure sont fixées par le domaine, ce n’est pas un moment que chacun choisit. Les ‹‹ heures dues ›› sont ce qui part en paie et alimente le compteur des 1 607 h. Une journée de 09:00 à 16:00 avec une heure de coupure fait 7 h de présence et 6 h dues."],
      ['Le planning de l’année', "s’imprime depuis le même endroit : le rythme sur douze mois, avec les heures de prise et de fin de service et la coupure déjeuner. Une page par modèle de semaine, pas une par salarié — c’est le document qu’on remet à l’équipe pour l’année à venir."],
      ['Le relevé mensuel', "s’imprime depuis Réglages, onglet App, « Documents & impressions ». C’est un relevé d’heures, pas un bulletin de paie."],
      ['Taux horaires et acomptes', ": administrateurs seulement, et jamais enregistrés sur l’appareil."]
    ]
  },
  cave: {
    ico: '\u{1F377}', titre: 'Cave', ancre: 'cave',
    points: [
      function () {
        return _mvAideSections('#cave-sec-tabs .mvu-tab', 'sections',
          "Le Cuvier suit la vendange, Le Chai suit l’élevage, Le millésime raconte le vin.");
      },
      ['Un millésime à la fois', "une opération porte sur une seule année. Changer de millésime en haut du formulaire vide la sélection : on ne mélange pas deux vins dans un même geste."],
      ['Le délai d’ouillage', "se règle pour tout le domaine, et se resserre millésime par millésime — un vin jeune se surveille de plus près."],
      ['La fin de fermentation et la fin de malo', "sont estimées à partir de vos propres relevés : la densité pour l’une, l’acide malique pour l’autre. Sans trois mesures, l’écran dit « démarrage » plutôt qu’une date inventée."],
      ['Le millésime', "annonce ce qui vient dans les quatre prochaines semaines, puis retrace le parcours du vin, de la benne à la bouteille."],
      ['Les analyses labo', "s’attachent en PDF à la cuvée. Les supprimer est réservé à l’administrateur."],
      ['Registre des manipulations et bilan de campagne', "s’impriment depuis Réglages, onglet App, « Documents & impressions ». Ce sont des états internes : Ma Vigne prépare, vous déclarez."]
    ]
  },
  reserve: {
    ico: '\u{1F4E6}', titre: 'La Réserve', ancre: 'reserve',
    points: [
      function () {
        return _mvAideSections('.mvr-tabs .mvu-tab', 'onglets',
          "C’est la comptabilité matière du domaine, pensée pour le contrôle bio.");
      },
      ['L’onglet Fûts porte le parc entier', "les fûts vides du magasin et ceux qui sont en vin au chai, additionnés. Ce ne sont pas deux comptabilités : ce sont deux états du même fût."],
      ['Entonner, embouteiller ou retirer', "ne change pas le nombre de fûts du domaine. Seuls acheter et se séparer le font."],
      ['Le registre des mouvements', "en bas de l’onglet garde chaque entrée et chaque sortie, avec son motif."],
      ['Le bilan se calcule seul', ": inventaire d’ouverture + achats − consommation. Aucun stock à tenir à la main."],
      ['L’inventaire d’ouverture', "est le point zéro. Sans lui, l’écart constaté ne veut rien dire."],
      ['Un stock négatif', "n’est pas un défaut d’affichage : il manque une facture d’achat, ou le consommé est surestimé."],
      ['Créer et modifier', "est réservé à l’administrateur du domaine ; tout le monde peut consulter."]
    ]
  },
  pilotage: {
    ico: '\u{1F4CA}', titre: 'Pilotage', ancre: 'pilotage',
    points: [
      ['Rien ne se saisit ici', ": tout est en lecture seule. Les chiffres viennent du journal, du planning et des sessions tracteur."],
      _mvAideOngletsPil,
      ['Décider', "répond à deux questions : dans quel ordre passer sur les parcelles, et combien de renfort prendre — à quelle date, et pour quel coût."],
      ['Économie', "compare un budget de barème à ce qui est engagé. Quand l’écart est grand, c’est le barème qu’on corrige dans Réglages, jamais le taux horaire."],
      ['Conformité', "suit le cuivre sur sept ans, le nombre de passages et les délais de rentrée en cours."],
      ['Cave', "dit ce qui presse aujourd’hui, où en est le millésime, et ce que coûte le parc à fûts."],
      ['Archives', "empile les campagnes sur un même axe, du 1er août au 31 juillet : le décalage d’une année sur l’autre se lit d’un coup d’œil."],
      ['Conçu pour le grand écran.', "Sur téléphone il fonctionne, mais tout ne tient pas de front."]
    ]
  },
  reglages: {
    ico: '\u{2699}\u{FE0F}', titre: 'Réglages', ancre: 'reglages',
    points: [
      function () {
        return _mvAideSections('#regl-tabs-row .mvu-tab', 'onglets',
          "Chacun regroupe ce qui se règle une fois et ne bouge plus souvent.");
      },
      ['Onglet Vigne', ": vos tâches, leurs heures par hectare, le barème de la convention, vos écartements de plantation et vos périodes de travail."],
      ['Vos écartements', "ramènent les heures conseillées à votre densité réelle. Sans eux, le barème suppose 10 000 pieds à l’hectare — vos heures à vous, elles, ne bougent jamais."],
      ['Le mot de passe initial', "d’un nouveau membre s’affiche une seule fois — notez-le avant de fermer."],
      ['Passer un membre en inactif', "plutôt que le supprimer conserve son historique."],
      ['Documents & impressions', "dans l’onglet App rassemble tout ce que Ma Vigne sait sortir : ce qui est obligatoire en contrôle, vos états internes, et vos données brutes."],
      ['La zone dangereuse', "ne réinitialise que cet appareil : les données du domaine restent sur le serveur."]
    ]
  }
};

var MV_AIDE_DEFAUT = {
  ico: '\u{1F4D6}', titre: 'Aide', ancre: 'contenu',
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
     + '<button type="button" class="mva-fbtn" id="mva-guide">\u{1F4D6} Guide complet</button>'
     + '<button type="button" class="mva-fbtn mva-bug" id="mva-bug">\u{1F41B} Un problème</button>'
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

// ════ EXPOSITION GLOBALE ════
// Nécessaire pour :
//  • firebase.js qui appelle window.showSyncBadge (async, avant que app.js soit prêt)
//  • index.html onclick="setThemeMode(...)"
//  • logError() appelé depuis window.addEventListener('error', ...)
//  • Modules futurs qui n'importent pas encore depuis utils.js
window.GT_ADMIN_EMAIL     = GT_ADMIN_EMAIL;
window.showSyncBadge      = showSyncBadge;
window.showToast          = showToast;
window.setThemeMode       = setThemeMode;
window.applyTheme         = applyTheme;
window.initTheme          = initTheme;
window.tNom               = tNom;
window.wmoDesc            = wmoDesc;
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
  if(!m.debut_contrat && !m.fin_contrat) return true;
  if(!ds) return true;
  if(m.debut_contrat && ds < m.debut_contrat) return false;
  if(m.fin_contrat   && ds > m.fin_contrat)   return false;
  return true;
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

window._mvEnContratSurPeriode = function(m, d0, d1){
  if(!m || m.bureau) return false;
  if(m.debut_contrat || m.fin_contrat){
    if(m.debut_contrat && d1 && m.debut_contrat > d1) return false;
    if(m.fin_contrat   && d0 && m.fin_contrat   < d0) return false;
    return true;
  }
  return m.statut !== 'Inactif';
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
window.TEMOJI             = TEMOJI;
window.TCLS               = TCLS;
window.TEMJ               = TEMJ;
window.COULEURS_MBR       = COULEURS_MBR;
window.APP_VERSION        = APP_VERSION;
window.checkWhatsNew      = checkWhatsNew;
window.dismissWhatsNew    = dismissWhatsNew;
