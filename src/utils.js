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
// WHATS_NEW   : journal versionne, un bloc par version APP, toujours prefixe en tete.
// Format bloc : { v:'8.04', d:'AAAA-MM-JJ', items:[…] } — `d` obligatoire depuis 8.04 (ANN-1, §225).
// Format item : { niv:0|1|2|3, pour:['tous'|'admin'|'salaries'|'tractoriste'|<module>],
//                 cible:'#selecteur' (niveau 1 seulement), emoji:'nom-d-icone',
//                 titre:'Texte pur', desc:'Phrase utilisateur, <b> permis.' }
//   niv 0 = le Journal seul · 1 = pastille « Nouveau » sur la cible · 2 = carte « À vérifier »
//   de l'Accueil jusqu'a « Vu » · 3 = la grande fenetre (au plus une fois tous les 30 jours).
// Regle : seulement les changements visibles par les utilisateurs ; items:[] = version technique.
export const APP_VERSION = '10.45';
// ★★ VER-1 (27/09/2026) — FORMAT DES DONNÉES. À monter de 1, DANS LE LOT, chaque fois qu'un lot change
//   la FORME de ce qui est écrit en base (nouvelle structure, champ renommé, sens d'un champ modifié) —
//   pas pour un changement d'écran ou de calcul. Le build le publie dans /version.json ; un appareil
//   dont le format est plus bas arrête d'écrire et demande la mise à jour (app.js, _mvVerifierVersion).
//   Nico n'a rien à faire : la publication et le blocage sont automatiques (décision du 27/09).
//   2 = TRN-1 (§330, 14/10) : CONFIG.tournees (une tournée = nom, travaux, ordre en pid).
//   3 = TRN-2 (§331, 14/10) : CONFIG.equipes_jour[jour][i].t (la tournée de l'équipe du jour).
//   4 = EQDEF-2 (§493, 30/10) : CONFIG.equipes_jour change de sens — un enregistrement reste en place les jours suivants
//       (depuis MV_EQ_SUITE_DEPUIS), et [] veut dire « tout le monde en Équipe 1 ». Un téléphone d'avant ne verrait pas les
//       équipes gardées et validerait avec l'ancienne règle : il doit se mettre à jour.
export const MV_FORMAT = 4;
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
      + 'font-family:var(--font-ui,\'Outfit\',system-ui,-apple-system,sans-serif);font-size:var(--pt-micro,11px);line-height:1.5;'
      + '-webkit-print-color-adjust:exact;print-color-adjust:exact}'
    + '.mvdoc-serif{font-family:var(--font-titre,\'Cormorant Garamond\',Georgia,serif)}'
    // en-tete : bande sombre + filet d'or. Le filet est la signature du domaine.
    + '.mvdoc-hd{background:' + MV_DOC_ENCRE + ';color:#F3EEE2;padding:16px 18px 14px;position:relative}'
    + '.mvdoc-hd::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;'
      + 'background:linear-gradient(90deg,#8A5A38 0%,' + MV_DOC_OR + ' 48%,#D8BC72 100%)}'
    + '.mvdoc-dom{font-family:var(--font-titre,\'Cormorant Garamond\',Georgia,serif);font-size:19px;font-weight:600;letter-spacing:.3px;line-height:1.15}'
    + '.mvdoc-tit{font-size:var(--pt-micro,11px);font-weight:700;text-transform:none;letter-spacing:0;color:#D8BC72;margin-top:5px}'
    + '.mvdoc-meta{font-size:var(--pt-nano,9.5px);color:#A79E8E;margin-top:6px;display:flex;gap:14px;flex-wrap:wrap}'
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
  // \u2605 RDT-XLS (02/10) : L'APERCU A LA LARGEUR DE LA FEUILLE, PAS DU TELEPHONE.
  //   Avec width=device-width, un document A4 paysage s'ouvrait sur ~410 px : le
  //   planning tronquait ses horaires (« LUND… »), les recoltes debordaient et
  //   l'en-tete s'arretait a mi-tableau. La feuille imprimee etait juste, l'apercu
  //   mentait. La fenetre prend la largeur utile de la page (A4 moins les marges),
  //   le telephone la reduit pour la montrer entiere ; @page regit l'impression.
  var _pays = (o.orient === 'paysage');
  var html = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=' + (_pays ? 1060 : 760) + '">'
    + '<title>' + e(o.titre || 'Document') + ' \u2014 ' + e(dom) + '</title>'
    + '<link rel="stylesheet" href="/fonts/fonts.css">'
    + '<style>' + window._mvDocCss(o.orient) + (o.css || '')
    + '@media screen{body{width:' + (_pays ? '273mm' : '186mm') + ';margin:0 auto}}</style></head>'
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


// ═══════════════════════════════════════════════════════════════════════════
// MV_TRI — l'ordre des lignes d'un document imprime
// ═══════════════════════════════════════════════════════════════════════════
// Onze documents sortent d'un tableau. Six d'entre eux le sortaient dans
// l'ordre du tableau SOURCE : l'ordre de saisie des recoltes, l'ordre de
// PARCELLES, l'ordre de INTRANTS.produits. Ce n'est pas un ordre, c'est
// l'absence d'ordre — sur le papier, personne ne peut y chercher une ligne.
//
// La primitive vit ici, a cote de MV_DOC, parce que le tri appartient a la
// GRAMMAIRE du document, pas a un module : cave.js, reglages.js, reserve.js et
// phyto.js en auront tous besoin, et utils.js est importe en premier.
//
// Elle ne trie RIEN. Le document seul sait ce que valent ses lignes ; elle
// pose la question, retient la reponse et rend la phrase a imprimer.
//
// ⚠️ TROIS CHOSES SONT DEMANDEES ENSEMBLE, jamais trois feuilles a la suite :
//   · l'annee ou le millesime, quand le document en couvre plusieurs
//   · ce que compte une ligne (le groupement), quand il y a un choix
//   · la cle de tri et son sens
// Une cle peut n'avoir de sens que dans un groupement (`grp:['apport']`) : elle
// est alors montree BARREE, jamais retiree — une option qui disparait laisse
// croire qu'elle n'existe pas.
//
// ⚠️ L'ANNEE N'EST PAS MEMORISEE, et c'est deliberé. Retenir « 2025 » ferait
// sortir l'an prochain un document de l'an dernier, avec le bon titre et les
// mauvaises lignes — exactement le defaut que ce lot corrige. La cle, le sens
// et le groupement, eux, sont des habitudes : ils se retiennent.
//
// ⚠️ Le choix est retenu dans localStorage, PAS dans CONFIG. C'est une
// preference d'affichage de la personne qui tient le telephone, pas une regle
// du domaine : le tri choisi par le chef de culture n'a pas a changer le
// document du salarie. Stockage refuse (navigation privee) : la feuille cesse
// de promettre qu'elle retient, plutot que de le promettre en vain.
//
// ⚠️ Le document DOIT ecrire l'ordre dans son en-tete (_mvTriPhrase). Deux
// tirages du meme document, tries differemment, se ressemblent sans l'etre :
// une feuille posee sur un bureau doit dire comment elle est rangee.

var MV_TRI_ETAT = null;   // { o:options, e:{an,groupe,cle,sens} } tant que la feuille est ouverte
var MV_TRI_MEMO_KO = false;

function _mvTriCss(){
  if(document.getElementById('mv-tri-css')) return;
  var s=document.createElement('style'); s.id='mv-tri-css';
  s.textContent=''
   /* ⚠️ 9200 EST LE PLANCHER MODAL (MV_Z_MODAL_PLANCHER) : une feuille posee
      dessus se met au niveau des dialogues qu'elle ouvre elle-meme. Le defaut
      etait invisible tant que la classe s'appelait `.mvt-ov` — le harnais des
      couches croyait lire la porte CGU, qui est legitimement au-dessus. On se
      range avec la feuille du Cuvier (`.mvv-ov`, 9000) : une surface d'accueil. */
   +'.mvz-ov{position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.58);display:flex;'
     +'align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .22s}'
   +'.mvz-ov.open{opacity:1;pointer-events:auto}'
   +'.mvz-sh{width:100%;max-width:560px;max-height:88vh;overflow-y:auto;background:var(--bg-card,#FBFAF6);'
     +'border:1px solid rgba(138,90,56,.12);border-bottom:none;border-radius:24px 24px 0 0;'
     +'padding:18px 17px calc(20px + env(safe-area-inset-bottom,0px));color:var(--texte,#1A1A14);'
     +'transform:translateY(100%);transition:transform .26s cubic-bezier(.4,0,.2,1);'
     +'font-family:inherit;box-shadow:0 -12px 40px rgba(20,17,13,.22)}'
   +'.mvz-ov.open .mvz-sh{transform:translateY(0)}'
   +'.mvz-sh *{box-sizing:border-box}'
   +'.mvz-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}'
   +'.mvz-t{font-family:var(--font-titre,\'Cormorant Garamond\',Georgia,serif);font-weight:600;font-size:var(--pt-lg,24px);'
     +'line-height:1.15;display:flex;align-items:center;gap:8px}'
   +'.mvz-x{background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.18);'
     +'color:var(--texte-doux,#5F5F5F);width:38px;height:38px;border-radius:10px;cursor:pointer;'
     +'flex-shrink:0;display:flex;align-items:center;justify-content:center}'
   +'.mvz-sub{font-size:var(--pt-txt,13px);color:var(--texte-doux,#5F5F5F);line-height:1.5;margin-top:5px}'
   +'.mvz-l{display:block;font-size:var(--pt-micro,11px);letter-spacing:.8px;text-transform:uppercase;'
     +'color:var(--texte-doux,#5F5F5F);font-weight:700;margin:15px 0 7px}'
   +'.mvz-l i{font-style:normal;font-weight:400;text-transform:none;letter-spacing:0}'
   +'.mvz-row{display:flex;flex-wrap:wrap;gap:6px}'
   +'.mvz-seg{display:flex;gap:6px}.mvz-seg .mvz-b{flex:1;text-align:center}'
   +'.mvz-b{border:1px solid rgba(138,90,56,.2);background:transparent;color:var(--texte-med,#4A4A3A);'
     +'border-radius:10px;padding:9px 12px;font-size:var(--pt-txt,13px);font-weight:600;'
     +'cursor:pointer;font-family:inherit;min-height:40px}'
   +'.mvz-b.on{background:var(--cave,#14110D);border-color:var(--cave,#14110D);color:#F0E2C8}'
   +'.mvz-b[disabled]{opacity:.4;cursor:not-allowed;text-decoration:line-through}'
   +'.mvz-note{background:var(--or-pale,#FAF3E0);border-left:3px solid var(--or,#C2A14D);'
     +'border-radius:0 6px 6px 0;padding:9px 11px;font-size:var(--pt-micro,11px);'
     +'color:var(--texte-med,#4A4A3A);line-height:1.55;margin-top:13px}'
   +'.mvz-go{width:100%;margin-top:16px;padding:14px;border:0;border-radius:13px;cursor:pointer;'
     +'background:var(--cave,#14110D);color:#F3EEE2;font-family:inherit;font-size:var(--pt-base,14px);'
     +'font-weight:600}'
   +'.mvz-mem{text-align:center;font-size:var(--pt-lbl,10.5px);color:var(--texte-doux,#5F5F5F);margin-top:9px}';
  document.head.appendChild(s);
}

// Les cles utilisables dans un groupement donne. `grp` absent = partout.
function _mvTriDispo(o, groupe){
  return (o.cles||[]).filter(function(k){ return !k.grp || !groupe || k.grp.indexOf(groupe)!==-1; });
}
function _mvTriCle(o, v){
  var l=o.cles||[];
  for(var i=0;i<l.length;i++){ if(l[i].v===v) return l[i]; }
  return null;
}

// La phrase a imprimer dans l'en-tete. Elle est ECRITE POUR L'OEIL : « A -> Z »
// se lit, « croissant » se traduit.
window._mvTriPhrase = function(o, c){
  if(!o||!c) return '';
  var k=_mvTriCle(o, c.cle); if(!k) return '';
  return String(k.lbl).toLowerCase()+' \u2014 '+(c.sens==='desc'?k.z:k.a);
};

// Le choix retenu de la derniere fois, complete par les defauts du document.
window._mvTriLu = function(memo, def){
  def=def||{};
  var d={ cle:def.cle||'', sens:(def.sens==='desc')?'desc':'asc', groupe:def.groupe||'' };
  if(!memo) return d;
  var raw=null;
  try{ raw=window.localStorage.getItem('mv.tri.'+memo); }
  catch(e){ MV_TRI_MEMO_KO=true; return d; }
  if(!raw) return d;
  try{
    var j=JSON.parse(raw);
    if(j&&j.cle)    d.cle=String(j.cle);
    if(j&&j.sens)   d.sens=(j.sens==='desc')?'desc':'asc';
    if(j&&j.groupe) d.groupe=String(j.groupe);
  }catch(e){
    if(window.logError) window.logError({level:'info',cat:'tri',msg:'choix de tri illisible : '+memo});
  }
  return d;
};
function _mvTriEcrire(memo, c){
  if(!memo) return;
  try{ window.localStorage.setItem('mv.tri.'+memo,
        JSON.stringify({cle:c.cle,sens:c.sens,groupe:c.groupe})); }
  catch(e){ MV_TRI_MEMO_KO=true; }
}

// Un comparateur a partir d'une fonction de valeur : le sens s'applique ICI,
// une fois, au lieu d'etre redit dans chaque document. `bris` departage les
// egalites — sans lui, l'ordre final depend de la stabilite du tri.
window._mvTriCmp = function(c, val, bris){
  var sg=(c&&c.sens==='desc')?-1:1;
  return function(a,b){
    var x=val(a), y=val(b), d;
    if(typeof x==='string'||typeof y==='string') d=String(x).localeCompare(String(y),'fr');
    else d=(x||0)-(y||0);
    if(d) return sg*d;
    return bris?bris(a,b):0;
  };
};

function _mvTriRendre(){
  var S=MV_TRI_ETAT; if(!S) return;
  var ov=document.getElementById('mv-tri-ov'); if(!ov) return;
  var o=S.o, e=S.e;
  var esc=(typeof window._escHtml==='function')?window._escHtml:function(x){return String(x==null?'':x);};
  var ico=(typeof window._mvIcon==='function')?window._mvIcon(o.icone||'imprimante',20):'';
  var b=function(on,act,txt,off){
    return '<button type="button" class="mvz-b'+(on?' on':'')+'"'+(off?' disabled':'')
      +' aria-pressed="'+(on?'true':'false')+'" onclick="'+act+'">'+txt+'</button>';
  };
  var h='<div class="mvz-hd"><div class="mvz-t">'+ico+esc(o.titre||'Trier le document')+'</div>'
    +'<button type="button" class="mvz-x" onclick="window._mvTriFermer()" aria-label="Fermer">'
    +((typeof window._mvIcon==='function')?window._mvIcon('croix',18):'\u00d7')+'</button></div>';
  if(o.sub) h+='<div class="mvz-sub">'+esc(o.sub)+'</div>';

  if(o.annees&&o.annees.length>1){
    h+='<span class="mvz-l">'+esc(o.anLbl||'Ann\u00e9e')+'</span><div class="mvz-row">'
      +o.annees.map(function(a){ return b(String(a)===String(e.an),
          'window._mvTriSet(\'an\',\''+esc(a)+'\')', esc(a)); }).join('')+'</div>';
  }
  if(o.groupes&&o.groupes.length>1){
    h+='<span class="mvz-l">'+esc(o.grpLbl||'Une ligne par')
      +(o.grpHint?' <i>'+esc(o.grpHint)+'</i>':'')+'</span><div class="mvz-seg">'
      +o.groupes.map(function(g){ return b(g.v===e.groupe,
          'window._mvTriSet(\'groupe\',\''+esc(g.v)+'\')', esc(g.lbl)); }).join('')+'</div>';
  }
  var dispo=_mvTriDispo(o, e.groupe);
  h+='<span class="mvz-l">Trier par</span><div class="mvz-row">'
    +(o.cles||[]).map(function(k){
        var off=!dispo.some(function(d){return d.v===k.v;});
        return b(k.v===e.cle, 'window._mvTriSet(\'cle\',\''+esc(k.v)+'\')', esc(k.lbl), off);
      }).join('')+'</div>';

  var kc=_mvTriCle(o,e.cle)||{a:'croissant',z:'d\u00e9croissant'};
  // ⚠️ PAS DE FLECHE HAUT/BAS ICI. Le libelle dit deja le sens (« A \u2192 Z »,
  // « la plus grande d'abord ») ; une fleche collee devant serait un PICTOGRAMME
  // brut dans une surface qui n'en veut plus (harnais des icones), et elle ne
  // dirait rien que le mot ne dise mieux.
  h+='<span class="mvz-l">Sens</span><div class="mvz-seg">'
    +b(e.sens==='asc','window._mvTriSet(\'sens\',\'asc\')',esc(kc.a))
    +b(e.sens==='desc','window._mvTriSet(\'sens\',\'desc\')',esc(kc.z))+'</div>';

  var c={an:e.an,cle:e.cle,sens:e.sens,groupe:e.groupe};
  if(typeof o.note==='function'){ var n=o.note(c); if(n) h+='<div class="mvz-note">'+n+'</div>'; }
  var cpt=(typeof o.compte==='function')?o.compte(c):'';
  h+='<button type="button" class="mvz-go" onclick="window._mvTriValider()">'
    +esc(o.btn||'\u00c9diter le document')+(cpt?' \u00b7 '+esc(cpt):'')+'</button>';
  if(o.memo && !MV_TRI_MEMO_KO)
    h+='<div class="mvz-mem">Ce choix est retenu pour la prochaine fois.</div>';
  ov.innerHTML='<div class="mvz-sh" onclick="event.stopPropagation()">'+h+'</div>';
}

window._mvTriSet = function(champ, val){
  var S=MV_TRI_ETAT; if(!S) return;
  S.e[champ]=val;
  // Changer de groupement peut retirer le sol sous la cle choisie : on retombe
  // sur la premiere cle valable plutot que de trier sur une cle sans effet.
  if(champ==='groupe'){
    var d=_mvTriDispo(S.o, S.e.groupe);
    if(d.length && !d.some(function(k){return k.v===S.e.cle;})) S.e.cle=d[0].v;
  }
  _mvTriRendre();
};
window._mvTriFermer = function(){
  var ov=document.getElementById('mv-tri-ov'); if(ov) ov.classList.remove('open');
  MV_TRI_ETAT=null;
};
window._mvTriValider = function(){
  var S=MV_TRI_ETAT; if(!S) return;
  var o=S.o, c={an:S.e.an, cle:S.e.cle, sens:S.e.sens, groupe:S.e.groupe};
  _mvTriEcrire(o.memo, c);
  window._mvTriFermer();
  // Le document s'ouvre APRES la fermeture, comme openPrompt : deux surfaces
  // empilees pendant que le navigateur ouvre un onglet donnent l'impression
  // que rien ne s'est passe.
  setTimeout(function(){ if(typeof o.cb==='function') o.cb(c); }, 80);
};

// Ouvre la feuille. Renvoie false si le document n'a rien a demander : l'appelant
// edite alors directement, sans poser une question a une seule reponse.
window._mvTriOuvrir = function(o){
  o=o||{};
  var cles=o.cles||[]; if(!cles.length) return false;
  var m=window._mvTriLu(o.memo, o.defaut);
  var grps=o.groupes||[];
  var e={
    an: (o.annees&&o.annees.length)?String((o.defaut&&o.defaut.an)||o.annees[0]):'',
    groupe: grps.length ? (grps.some(function(g){return g.v===m.groupe;})?m.groupe:grps[0].v) : '',
    cle: m.cle, sens: m.sens
  };
  var dispo=_mvTriDispo(o, e.groupe);
  if(!dispo.length) return false;
  if(!dispo.some(function(k){return k.v===e.cle;})) e.cle=dispo[0].v;
  MV_TRI_ETAT={o:o, e:e};
  _mvTriCss();
  var ov=document.getElementById('mv-tri-ov');
  if(!ov){
    ov=document.createElement('div'); ov.id='mv-tri-ov'; ov.className='mvz-ov';
    ov.addEventListener('click',function(ev){ if(ev.target===ov) window._mvTriFermer(); });
    document.addEventListener('keydown',function(ev){
      if(ev.key==='Escape' && MV_TRI_ETAT) window._mvTriFermer();
    });
    document.body.appendChild(ov);
  }
  _mvTriRendre();
  requestAnimationFrame(function(){ ov.classList.add('open'); });
  if(window._mvHistPush) window._mvHistPush();  /* TOUR-2 : le retour Android ferme cette surface (app.js, _MV_SURFACES) */
  return true;
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

// L'echappeur du socle. ⚠️⚠️ AVANT CUVGR-3, ces fonctions lisaient
// `window._escHtml` derriere un `typeof === 'function'` — et ce global N'EST
// DEFINI NULLE PART dans l'application. Le repli `String(x)` etait donc pris a
// TOUS LES COUPS : l'`aria-label` d'un graphe n'a jamais ete echappe, alors que
// le commentaire d'a cote affirmait le contraire. Une cuve nommee
// `Cuve "Haute"` refermait l'attribut. Un garde qui ne garde rien est pire
// qu'une absence de garde : il se lit comme une protection.
function _mvEsc(x){
  return String(x == null ? '' : x)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// La balise <svg> de la charte. width et height en dur = une unite vaut un
// pixel : c'est ce qui empeche l'etirement, et ce qui rend les font-size vrais.
// ⚠️ `aria` recoit du TEXTE BRUT : l'echappement est fait ici, pas avant, sinon
// une esperluette ressort en &amp;amp;.
window._mvGraphSvg = function(c, aria, corps){
  return '<svg viewBox="0 0 ' + c.w + ' ' + c.h + '" width="' + c.w + '" height="' + c.h + '"'
    + ' xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + _mvEsc(aria || '') + '"'
    + ' style="display:block">' + (corps || '') + '</svg>';
};

// ★ SPARK-1 (§214) — LA PETITE COURBE D'UN CHIFFRE. Un ECART en %, jamais une valeur
// brute : chaque point dit de combien le chiffre s'eloigne de SA reference (le
// pointille, au milieu). La bande est la MEME pour toutes les petites courbes
// (±30 % par defaut) : deux courbes cote a cote se comparent a l'oeil. Au-dela,
// le point se colle au bord — il ne sort pas du cadre.
// `vals` : tableau d'ecarts en %, `null` = jour sans mesure (la courbe se coupe :
// un trou n'est pas un zero). `o.mauvais` : 'haut' (au-dessus = defavorable) ou
// 'bas'. Couleur du dernier point : vert si favorable ou a moins de 3 %, orange
// sinon. Aucun texte dans le SVG : le chiffre et son cadre restent dans la carte.
// Rend '' si moins de deux points mesures — jamais une ligne inventee.
window.MV_SPARK_BANDE = 30;
window._mvGraphSpark = function(vals, o){
  o = o || {};
  var v = Array.isArray(vals) ? vals : [];
  var n = v.length, nOk = 0, last = null, i;
  for(i = 0; i < n; i++){ if(typeof v[i] === 'number' && isFinite(v[i])){ nOk++; last = i; } }
  if(nOk < 2 || n < 2) return '';
  var B = (o.bande > 0) ? o.bande : window.MV_SPARK_BANDE;
  var c = window._mvGraphCadre((o.w > 0) ? o.w : 96, (o.h > 0) ? o.h : 34, { padL: 2, padR: 5, padT: 4, padB: 4, grad: 0 });
  var y = function(e){ var k = Math.max(-B, Math.min(B, e)); return c.padT + c.ih / 2 - (k / B) * (c.ih / 2); };
  var x = function(k){ return c.padL + (k / (n - 1)) * c.iw; };
  var d = '', ouvert = false;
  for(i = 0; i < n; i++){
    var e = v[i];
    if(!(typeof e === 'number' && isFinite(e))){ ouvert = false; continue; }
    d += (ouvert ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(e).toFixed(1);
    ouvert = true;
  }
  var eL = v[last], mauvais = (o.mauvais === 'bas') ? (eL < 0) : (eL > 0);
  var col = (Math.abs(eL) < 3 || !mauvais) ? c.col.fait : c.col.attention;
  var ym = (c.padT + c.ih / 2).toFixed(1);
  var corps = '<line x1="' + c.padL + '" x2="' + (c.w - c.padR) + '" y1="' + ym + '" y2="' + ym + '" stroke="' + c.col.prevu + '" stroke-width="' + c.trait.grille + '" stroke-dasharray="2 2"/>'
    + '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + c.trait.prevu + '" stroke-linejoin="round" stroke-linecap="round"/>'
    + '<circle cx="' + x(last).toFixed(1) + '" cy="' + y(eL).toFixed(1) + '" r="2.6" fill="' + col + '"/>';
  return window._mvGraphSvg(c, o.aria || '', corps);
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
      + '.mv-graph-vide .s{font-size:var(--pt-txt,13px);color:var(--texte-med);margin-top:4px;line-height:1.55}';
    document.head.appendChild(st);
  }
  return '<div class="mv-graph-vide"><div class="t">'
    + _mvEsc(quoi || 'Rien a afficher pour le moment') + '</div>'
    + (geste ? '<div class="s">' + _mvEsc(geste) + '</div>' : '') + '</div>';
};

// ═══════════ CUVGR-3 — L'INFOBULLE TACTILE, DANS LE SOCLE ═══════════
// Un graphe rend une image : sur un telephone, la valeur exacte d'un point
// n'est lisible nulle part. On la donne au DOIGT.
//
// ⚠️⚠️ CE QUE CA NE FAIT PAS, ET C'EST VOULU : le <svg> garde `role="img"` et
// son `aria-label`. Les zones de touche sont `aria-hidden` — elles n'entrent
// PAS dans l'arbre d'accessibilite. Rendre chaque point focalisable ajouterait
// vingt arrets de tabulation par graphe et quinze graphes par ecran : un
// lecteur d'ecran y perdrait plus qu'il n'y gagnerait. L'`aria-label` porte
// deja le resume (bornes, nombre de releves, operations). Le detail point par
// point reste une commodite au pointeur, et la LISTE des releves, sous le
// graphe, reste la source accessible.
//
// ★ UN GRAPHE S'Y INSCRIT SEUL : il lui suffit d'emettre des <rect
// class="mvg-hit" data-tt="..."> ; `_mvGraphDessine` cable le reste apres
// chaque peinture. Les graphes qui n'en emettent pas ne changent pas d'un
// octet — c'est ce qui rend ce lot sur pour les quinze autres.
function _mvGraphTtCss(){
  if(document.getElementById('mv-graph-tt-css')) return;
  var st = document.createElement('style');
  st.id = 'mv-graph-tt-css';
  st.textContent =
    '.mvg-box{position:relative;touch-action:pan-y pinch-zoom}'
    + '.mvg-hit{fill:transparent;cursor:pointer}'
    + '.mvg-tt{position:absolute;z-index:6;min-width:140px;max-width:230px;pointer-events:none;'
    + 'background:#241C16;color:#F5F1E8;border-radius:10px;padding:8px 10px;'
    + 'font-size:var(--pt-micro,11.5px);line-height:1.45;box-shadow:0 6px 20px rgba(0,0,0,.28);'
    + 'opacity:0;transform:translateY(4px);transition:opacity .12s,transform .12s}'
    + '.mvg-tt.on{opacity:1;transform:translateY(0)}'
    + '.mvg-tt .t{font-weight:700;color:var(--or-clair,#D8BC72);margin-bottom:3px}'
    + '.mvg-tt .r{display:flex;justify-content:space-between;gap:12px}'
    + '.mvg-tt .r i{font-style:normal;opacity:.72}'
    + '.mvg-tt .o{margin-top:5px;padding-top:5px;border-top:1px solid rgba(255,255,255,.18);opacity:.9}'
    + '.mvg-guide{position:absolute;z-index:5;top:0;width:1px;margin-left:-.5px;background:var(--texte-doux,#8a8a80);'
    + 'opacity:0;pointer-events:none;transition:opacity var(--mv-d1,.14s)}'
    + '.mvg-guide.on{opacity:.55}'
    + '@media print{.mvg-tt,.mvg-guide{display:none}}';
  document.head.appendChild(st);
}

var _mvTtGlobal = false;
window._mvGraphTouch = function(box){
  if(!box || !box.querySelector('.mvg-hit')) return;
  _mvGraphTtCss();
  box.classList.add('mvg-box');
  // L'infobulle est recreee a chaque peinture : `innerHTML` vient d'effacer
  // les enfants. L'ECOUTEUR, lui, est pose une seule fois sur la boite, qui
  // survit — sinon on en empilerait un par redimensionnement.
  var tt = document.createElement('div');
  tt.className = 'mvg-tt';
  box.appendChild(tt);
  box._mvTt = tt;
  // MOUV-1 (§259) : le trait qui marque le point montré, recréé avec l'infobulle.
  var gd = document.createElement('i');
  gd.className = 'mvg-guide';
  gd.setAttribute('aria-hidden', 'true');
  box.appendChild(gd);
  box._mvGd = gd;
  box._mvHit = null;
  if(box._mvTtCable) return;
  box._mvTtCable = true;
  box.addEventListener('pointerdown', function(ev){
    var h = ev.target && ev.target.closest ? ev.target.closest('.mvg-hit') : null;
    // MOUV-1 : au doigt, l'infobulle suit tant que le doigt glisse (pointermove, plus bas).
    box._mvTtDoigt = !!h && ev.pointerType !== 'mouse';
    if(!h){ _mvGraphCache(box); return; }
    _mvGraphMontre(box, h);
  });
  // MOUV-1 (§259) — L'INFOBULLE SUIT : à la souris au survol, au doigt en glissant le long du graphe.
  //   Le doigt garde la main sur la page : `touch-action:pan-y pinch-zoom` (style de la boîte) laisse
  //   défiler à la verticale et zoomer à deux doigts ; seul le glissé horizontal promène l'infobulle.
  //   Au doigt, la cible d'un pointermove reste l'élément du premier appui : on lit donc ce qui est
  //   SOUS le doigt (elementFromPoint), pas ev.target.
  box.addEventListener('pointermove', function(ev){
    if(ev.pointerType !== 'mouse' && !box._mvTtDoigt) return;
    var sous = document.elementFromPoint ? document.elementFromPoint(ev.clientX, ev.clientY) : ev.target;
    var h = (sous && sous.closest) ? sous.closest('.mvg-hit') : null;
    if(h && box.contains(h)){ if(h !== box._mvHit) _mvGraphMontre(box, h); }
    else if(ev.pointerType === 'mouse') _mvGraphCache(box);
  });
  box.addEventListener('pointerup', function(){ box._mvTtDoigt = false; });
  box.addEventListener('pointercancel', function(){ box._mvTtDoigt = false; });
  box.addEventListener('pointerleave', function(ev){ if(ev.pointerType === 'mouse') _mvGraphCache(box); });
  if(!_mvTtGlobal){
    _mvTtGlobal = true;
    document.addEventListener('pointerdown', function(ev){
      for(var i = 0; i < _MV_GRAPHS.length; i++){
        var b = document.querySelector(_MV_GRAPHS[i].sel);
        if(b && b._mvTt && !b.contains(ev.target)) _mvGraphCache(b);
      }
    });
  }
};

// MOUV-1 (§259) : montrer / cacher — une seule écriture pour l'appui, le survol et le glissé.
function _mvGraphMontre(box, h){
  var t = box._mvTt; if(!t) return;
  var html = h.getAttribute('data-tt'); if(!html) return;
  box._mvHit = h;
  t.innerHTML = html;
  t.classList.add('on');
  // Le SVG est dessine en unites de viewBox ; la boite peut etre plus
  // etroite. On ramene les coordonnees a l'echelle reelle, sinon l'infobulle
  // se pose a cote du point sur un ecran qui a retreci.
  var svg = box.querySelector('svg');
  var k = (svg && svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width > 0)
    ? (svg.clientWidth / svg.viewBox.baseVal.width) : 1;
  if(!(k > 0)) k = 1;
  var x = (parseFloat(h.getAttribute('data-x')) || 0) * k;
  var y = (parseFloat(h.getAttribute('data-y')) || 0) * k;
  t.style.left = '0px'; t.style.top = '0px';
  var bw = box.clientWidth, tw = t.offsetWidth, th = t.offsetHeight;
  var lx = Math.max(4, Math.min(Math.max(4, bw - tw - 4), x - tw / 2));
  var ly = y - th - 12; if(ly < 2) ly = y + 14;   // jamais hors du cadre
  t.style.left = lx + 'px'; t.style.top = ly + 'px';
  var g = box._mvGd;
  if(g){
    // Le trait couvre la hauteur du dessin : le <svg> peut suivre le bouton « Agrandir » (KIT-1).
    g.style.left = x + 'px';
    g.style.top = ((svg && svg.offsetTop) || 0) + 'px';
    g.style.height = ((svg && svg.clientHeight) || box.clientHeight || 0) + 'px';
    g.classList.add('on');
  }
}
function _mvGraphCache(box){
  if(box._mvTt) box._mvTt.classList.remove('on');
  if(box._mvGd) box._mvGd.classList.remove('on');
  box._mvHit = null;
}

// Une zone de touche : une colonne pleine hauteur, centree sur le point.
// `x`/`y` sont les coordonnees du POINT (pour poser l'infobulle), `xa`/`xb`
// les bornes de la colonne. `tt` est du HTML deja echappe par l'appelant.
window._mvGraphHit = function(c, x, y, xa, xb, tt){
  var lg = Math.max(1, xb - xa);
  return '<rect class="mvg-hit" aria-hidden="true" x="' + xa.toFixed(1) + '" y="0" width="'
    + lg.toFixed(1) + '" height="' + c.h + '" data-x="' + x.toFixed(1) + '" data-y="' + y.toFixed(1)
    + '" data-tt="' + _mvEsc(tt) + '"/>';
};

// ── Le registre : un graphe enregistre se repeint quand la largeur bouge ─────
var _MV_GRAPHS = [], _mvGraphHooked = false, _mvGraphTimer = null;
// MOUV-1 (§259) : les graphes déjà dessinés « en direct » dans la session. Contrairement à _MV_GRAPHS,
//   ce registre n'oublie jamais (_mvGraphOublier ne le touche pas) : un écran redessiné ne rejoue pas le tracé.
var _MV_TRACES = {};

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
  // KIT-1 (§226) : le bouton « Agrandir » fait partie du dessin (redessiné avec lui). Pas pour un graphe vide,
  //   ni pour un graphe qui l'a refusé (opts.agrandir === false).
  var agr = (html && e.agr !== false)
    ? '<button type="button" class="mvk-agr" data-mvk-agr="' + _MV_GRAPHS.indexOf(e) + '" aria-label="Agrandir le graphique">Agrandir</button>' : '';
  if(agr && box.style && !box.style.position) box.style.position = 'relative';
  box.innerHTML = (html == null) ? '' : (agr + html);
  // CUVGR-3 : un graphe qui a emis des zones de touche recoit son infobulle.
  // Les autres ne passent meme pas la premiere ligne de _mvGraphTouch.
  if(window._mvGraphTouch) window._mvGraphTouch(box);
  // MOUV-1 (§259) : la PREMIÈRE peinture d'un graphe dans la session dessine ses courbes mesurées (trait
  //   de 2, plein : MV_GRAPH_TRAIT.mesure). Jamais au redimensionnement, jamais quand l'écran se redessine,
  //   jamais sur un graphe caché — il se dessinera quand on le verra.
  if(html && window._mvAnim && !_MV_TRACES[e.sel] && box.offsetParent !== null){
    _MV_TRACES[e.sel] = 1;
    window._mvAnim.tracer(box);
  }
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
  e.agr = !(opts && opts.agrandir === false);   // KIT-1 (§226)
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

// ══ MOUV-1 (§259) — LA COUCHE D'ANIMATION COMMUNE ═════════════════════════════════════════════════
//   Nico (06/10) : un Pilotage « dynamique, professionnel et qui en jette » ; la maquette du cockpit est
//   validée le 07/10. Tout ce qui bouge passe par ici, et c'est ici, une seule fois, que le mouvement se
//   coupe quand le téléphone demande « moins d'animations ». Rien ne bouge sans raison : un chiffre
//   défile parce qu'il a changé, une barre avance parce que le travail a avancé.
//   Les durées viennent des jetons de styles.css (--mv-d1…d4) ; les fonctions ci-dessous prennent la
//   même échelle en millisecondes. Chaque fonction accepte un élément absent (écran pas affiché) et ne
//   lève jamais : une animation ratée ne doit pas casser l'écran qu'elle décore.
window._mvAnim = (function(){
  function reduit(){
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch(e){ return false; }
  }
  function maintenant(){ return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
  function image(f){ return (typeof requestAnimationFrame === 'function') ? requestAnimationFrame(f) : setTimeout(f, 16); }
  function sortie(k){ return 1 - Math.pow(1 - k, 3); }
  // tween : fn(k) reçoit l'avancement adouci, de 0 à 1, une fois par image. Fin immédiate (fn(1)) quand
  //   le téléphone demande moins d'animations ou quand la durée est nulle.
  function tween(dur, fn, ease){
    if(typeof fn !== 'function') return;
    var e = (typeof ease === 'function') ? ease : sortie;
    if(reduit() || !(dur > 0)){ fn(1); return; }
    var t0 = maintenant();
    (function pas(){
      var k = Math.min(1, (maintenant() - t0) / dur);
      fn(e(k));
      if(k < 1) image(pas);
    })();
  }
  // compter : un chiffre défile de la valeur AFFICHÉE vers la nouvelle. La valeur affichée vit dans
  //   data-v : un écran redessiné repart de ce qu'il montrait, pas de zéro. Un nouvel appel sur le même
  //   élément prend la main (le défilement précédent s'arrête). `fmt` met en forme (défaut : entier fr-FR).
  function compter(el, vers, fmt, dur){
    if(!el || !isFinite(vers)) return;
    var f = (typeof fmt === 'function') ? fmt : function(v){ return Math.round(v).toLocaleString('fr-FR'); };
    var lu = el.getAttribute ? el.getAttribute('data-v') : null;
    var de = (lu != null && isFinite(parseFloat(lu))) ? parseFloat(lu) : vers;
    if(el.setAttribute) el.setAttribute('data-v', String(vers));
    var jeton = el._mvCpt = (el._mvCpt || 0) + 1;
    if(reduit() || de === vers || dur === 0){ el.textContent = f(vers); return; }
    tween(dur > 0 ? dur : 900, function(k){ if(el._mvCpt === jeton) el.textContent = f(de + (vers - de) * k); });
  }
  // rouler : un texte qui change en roulant — l'ancien monte et s'efface, le nouveau arrive d'en dessous.
  //   L'élément doit être une petite grille (display:inline-grid ; overflow:hidden) : les deux textes
  //   partagent la même case le temps du roulement.
  function rouler(el, txt){
    if(!el) return;
    txt = String(txt);
    var cur = el.lastElementChild;
    if(cur && cur.textContent === txt) return;
    if(reduit() || !cur || typeof cur.animate !== 'function'){
      el.textContent = '';
      var s = document.createElement('span'); s.textContent = txt; el.appendChild(s);
      return;
    }
    var n = document.createElement('span');
    n.textContent = txt;
    el.appendChild(n);
    var vieux = cur.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-75%)', opacity: 0 }],
      { duration: 560, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    vieux.onfinish = function(){ if(cur.parentNode) cur.parentNode.removeChild(cur); };
    n.animate([{ transform: 'translateY(75%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
      { duration: 560, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  // noter / glisser : les deux temps d'une liste qui change (FLIP). noter() relève où sont les éléments ;
  //   on change la liste ; glisser() fait partir chacun de son ancienne place vers la nouvelle.
  function noter(els){
    var r = [];
    for(var i = 0; els && i < els.length; i++){
      var el = els[i];
      if(el && el.getBoundingClientRect) r.push([el, el.getBoundingClientRect().top]);
    }
    return r;
  }
  function glisser(places){
    if(reduit() || !places) return;
    for(var i = 0; i < places.length; i++){
      var el = places[i][0];
      if(!el || !el.isConnected || typeof el.animate !== 'function') continue;
      var dy = places[i][1] - el.getBoundingClientRect().top;
      if(Math.abs(dy) > 0.5) el.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }],
        { duration: 460, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
  }
  // reflet : un reflet passe une fois sur une barre qui vient d'avancer (classe .mv-reflet, styles.css).
  function reflet(el){
    if(!el || !el.classList || reduit()) return;
    el.classList.remove('mv-reflet');
    void el.offsetWidth;
    el.classList.add('mv-reflet');
    setTimeout(function(){ el.classList.remove('mv-reflet'); }, 1600);
  }
  // tracer : les courbes MESURÉES d'un dessin se tracent de gauche à droite. Une courbe mesurée, dans la
  //   grammaire du kit (MV_GRAPH_TRAIT), c'est un trait d'au moins 1,8 (mesure = 2), plein (pas de
  //   pointillé : le prévu et les seuils en ont un), sans remplissage (une aire n'est pas un trait), qui a
  //   une couleur. La grille, le prévu, les seuils, les aires et les points ne bougent pas.
  //   Rend le nombre de courbes animées (0 si rien à tracer, ou moins d'animations).
  function estMesure(p){
    var g = function(n){ return p.getAttribute ? p.getAttribute(n) : null; };
    var fill = String(g('fill') || '').toLowerCase(), sw = parseFloat(g('stroke-width')), da = g('stroke-dasharray');
    return fill === 'none' && sw >= 1.8 && (!da || da === 'none' || da === '0') && !!g('stroke');
  }
  function tracer(racine){
    if(!racine || !racine.querySelectorAll || reduit()) return 0;
    var els = racine.querySelectorAll('svg path, svg polyline'), n = 0;
    for(var i = 0; i < els.length; i++){
      var p = els[i];
      if(!estMesure(p) || typeof p.animate !== 'function') continue;
      var L = 0;
      try { L = p.getTotalLength ? p.getTotalLength() : 0; } catch(e){ L = 0; }
      if(!(L > 0)) continue;
      p.style.strokeDasharray = L;
      p.style.strokeDashoffset = L;
      var a = p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }],
        { duration: 1100, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
      a.onfinish = (function(q, anim){ return function(){
        q.style.strokeDasharray = ''; q.style.strokeDashoffset = '';
        if(anim && anim.cancel) anim.cancel();
      }; })(p, a);
      n++;
    }
    return n;
  }
  return { reduit: reduit, tween: tween, compter: compter, rouler: rouler, noter: noter, glisser: glisser,
    reflet: reflet, tracer: tracer, estMesure: estMesure };
})();

// ══ KIT-1 (§226) — LE KIT GRAPHIQUE COMMUN : LA LIGNE D'AVANCEMENT ═════════════════════════════════
//   Une barre (fine dans une liste), une ligne (nom entier · barre · % · détail), un code de couleur : l'ÉTAT,
//   jamais le pourcentage — fait = fini, cours = en cours, retard = sa fenêtre est passée sans qu'il soit fini.
//   Nico (03/10) : « une appli homogène ». L'Accueil et Pilotage › La campagne dessinaient le même avancement de
//   deux façons : l'un au pourcentage (orange sous 50 % — une tâche à 10 % en novembre paraissait en faute), avec
//   des noms abrégés ; l'autre en dégradé terre, trié par pourcentage. Une seule source désormais.
function _mvkNb(n){ return Math.round(Number(n)||0).toLocaleString('fr-FR'); }
function _mvkHa(v){ return (Math.round((Number(v)||0)*100)/100).toFixed(2).replace('.',','); }
function _mvkEtat(pct,enRetard){ return (pct>=100)?'fait':(enRetard?'retard':'cours'); }
// Le détail : les heures quand la tâche a un barème, sinon la surface faite sur concernée (COH-1), sinon un tiret.
function _mvkDet(t){
  if((t.h_total||0)>0) return _mvkNb(t.h_done)+' / '+_mvkNb(t.h_total)+' h';
  if((t.surf_total||0)>0) return _mvkHa(t.surf_done)+' / '+_mvkHa(t.surf_total)+' ha';
  return '\u2014';
}
function _mvkLigne(nom,pct,etat,det,sous){
  var p=Math.max(0,Math.min(100,Math.round(Number(pct)||0)));
  return '<div class="mvk-ligne'+(sous?' sous':'')+'"><span class="nom">'+nom+'</span>'
    +'<span class="mvk-barre"><i class="mvk-'+etat+'" style="width:'+p+'%"></i></span>'
    +'<span class="pct mvk-t-'+etat+'">'+p+'\u00a0%</span><span class="det">'+det+'</span></div>';
}
// ★ CHANT-1 (§316) — L'ORDRE DES CHANTIERS, UNE SEULE RÈGLE. Nico (12/10) : « ils doivent apparaître dans l'ordre de leur
//   date de commencement […] peu importe la date de fin », puis les terminés en bas ; l'arrachage fini pour l'équipe, lui,
//   « doit être la première des terminées ». Trois groupes : 0 = à faire ou en cours (en retard compris), 1 = fini pour
//   l'équipe (equipeFinie, pas à 100 %), 2 = terminé (100 %). Dans un groupe : la date de début, puis l'ordre reçu (celui du
//   catalogue des Réglages). La règle ne lit rien de global : ctx = { debut:{nom:'AAAA-MM-JJ'}, defaut, equipeFinie:{nom:1} },
//   rassemblé par app.js (_mvChantiersCtx). Lue par _mvkAvancement (Accueil, Pilotage › La campagne) et par le cockpit
//   (pilotage.js, _pilCk2Modele) : les trois listes ne peuvent plus se contredire.
function _mvOrdreChantiers(rows,ctx){
  var c=ctx||{}, deb=c.debut||{}, eq=c.equipeFinie||{}, def=String(c.defaut||'');
  var groupe=function(t){ var p=Number(t&&t.pct)||0; return p>=100?2:((t&&eq[t.nom])?1:0); };
  return (Array.isArray(rows)?rows:[]).map(function(t,i){ return { t:t, i:i, g:groupe(t), d:String((t&&deb[t.nom])||def) }; })
    .sort(function(a,b){ return (a.g-b.g)||(a.d<b.d?-1:(a.d>b.d?1:0))||(a.i-b.i); })
    .map(function(x){ return x.t; });
}
// CHANT-1 : les lignes dans l'ordre commun ; l'arrachage fini pour l'équipe en vert, son vrai %, et une mention dessous.
function _mvkAvancement(rows,retards){
  var R=retards||{};
  var C=(typeof window!=='undefined'&&typeof window._mvChantiersCtx==='function')?window._mvChantiersCtx():null;
  var EQ=(C&&C.equipeFinie)||{};
  var L=(typeof _mvOrdreChantiers==='function')?_mvOrdreChantiers(rows,C):(Array.isArray(rows)?rows:[]);
  return L.map(function(t){
    var eqf=!!EQ[t.nom]&&(Number(t.pct)||0)<100, late=!eqf&&!!R[t.nom];
    var h=_mvkLigne(_escHtml(tNom(t.nom)), t.pct||0, eqf?'fait':_mvkEtat(t.pct||0,late), _mvkDet(t), false);
    if(eqf) h+='<div class="mvk-note">Fini pour l’équipe, la suite au prestataire</div>';
    var niv=(t.type==='niveaux'||t.nom==='Relevage'), pas=(t.type==='passages'||t.nom==='Ebourgeonnage'||t.nom==='Pioche');
    if(t.detail && t.detail.length>1 && (niv||pas)){
      h+=t.detail.map(function(s){ return _mvkLigne((niv?'N':'P')+_mvkNb(s.num), s.pct||0, _mvkEtat(s.pct||0,late), _mvkDet(s), true); }).join('');
    }
    return h;
  }).join('');
}
// Les tâches EN RETARD : leur fenêtre est passée (fin EXCLUSIVE `we`). ★ DATES-1 (§323) : les dates de TOUTES les tâches de la
//   période (taskDates de _chargeSaisonData : une tâche sans barème a aussi les siennes) ; repli sur taskWindows (planning.js d'avant).
function _mvkRetards(cd){
  var out={}, W=cd?(Array.isArray(cd.taskDates)?cd.taskDates:cd.taskWindows):null; if(!W) return out;
  var t=new Date(), o=Math.round((Date.UTC(t.getFullYear(),t.getMonth(),t.getDate())-Date.UTC(2026,0,1))/86400000);
  W.forEach(function(w){ if(w && w.we!=null && o>=w.we) out[w.nom]=true; });
  return out;
}
// KIT-4 (§229) : UNE SURFACE S'ÉCRIT DE DEUX FAÇONS, DANS TOUS LES MODULES — une PARCELLE au centiare (4 décimales,
//   la précision du cadastre), un TOTAL au centième (2), toujours avec la virgule. COH-1 l'avait fait pour la Vigne
//   (_pvSurfFr) ; le Traitement, le Tracteur, les Réglages et le Cuvier écrivaient encore « 1.25 ha » au point.
function _mvHaNum(x){ var v=parseFloat(String(x==null?'':x).replace(',','.')); return isFinite(v)?v:null; }
window._mvHaP=function(x){ var v=_mvHaNum(x); return v==null?'':v.toFixed(4).replace('.',','); };
window._mvHaT=function(x){ var v=_mvHaNum(x); return v==null?'':v.toFixed(2).replace('.',','); };
window._mvkEtat=_mvkEtat; window._mvkDet=_mvkDet; window._mvkLigne=_mvkLigne;
window._mvkAvancement=_mvkAvancement; window._mvkRetards=_mvkRetards; window._mvOrdreChantiers=_mvOrdreChantiers;

// ══ KIT-1 (§226) — « AGRANDIR » : chaque graphe suivi (_mvGraphSuivre) porte ce bouton ; le même dessin
//   s'ouvre dans #ovGraph (openOv : Échap, retour arrière, empilement), redessiné à la largeur de la feuille.
window._mvGraphAgrandir = function(i){
  var e=_MV_GRAPHS[i]; if(!e || typeof e.build!=='function') return;
  var host=document.getElementById('graph-inner'), tt=document.getElementById('graph-titre');
  if(!host || typeof window.openOv!=='function') return;
  var svg=e.el && e.el.querySelector ? e.el.querySelector('svg') : null;
  if(tt) tt.textContent=(svg && svg.getAttribute('aria-label')) || 'Graphique';
  window.openOv('ovGraph');
  var w=Math.max(280, Math.min(1100, host.clientWidth || Math.round(Math.min(window.innerWidth*0.9, 1060))));
  try { host.innerHTML=e.build(w) || ''; if(window._mvGraphTouch) window._mvGraphTouch(host); }
  catch(err){
    host.innerHTML='';
    if(window.logError) window.logError({ level:'error', cat:'graphe', msg:'graphe agrandi impossible',
      detail:e.sel+' — '+((err && err.message) ? err.message : String(err)) });
  }
};
if(typeof document!=='undefined' && document.addEventListener){
  document.addEventListener('click', function(ev){
    var b=(ev.target && ev.target.closest) ? ev.target.closest('.mvk-agr') : null;
    if(!b) return;
    ev.stopPropagation();
    window._mvGraphAgrandir(parseInt(b.getAttribute('data-mvk-agr'),10));
  });
}

// WN-COUPE-1 (§469) — WHATS_NEW vit dans src/whats-new.js (utils.js touchait le plafond de 1024 ko) ;
// importé et réexporté ici pour que rien ne change pour le code qui le lit.
import { WHATS_NEW } from './whats-new.js';
export { WHATS_NEW };

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
    + '<div><div style="font-size:var(--pt-txt,13px);font-weight:500;color:var(--texte);line-height:1.3;">' + item.titre + '</div>'
    + '<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:3px;line-height:1.5;">' + item.desc + '</div></div>'
    + '</div>';
}

// ════════════════════════════════════════════════════════════════════════════
// ★★ ANN-1 (§225) — LES QUATRE NIVEAUX DES NOUVEAUTÉS
// ════════════════════════════════════════════════════════════════════════════
// Nico, 03/10 : « le What's New est beaucoup trop présent parfois ». Mesuré : 50 versions
// annoncées du 19/09 au 02/10 (247 changements en septembre), et une fenêtre qui s'ouvrait
// d'office chez tout le monde, ouvriers compris, presque chaque jour. À ce rythme on la
// ferme sans la lire — y compris le jour où elle annonce une correction qui touche la paie :
// l'attention baisse dès la 2e ou 3e exposition à un message qui se ressemble.
// Chaque item de WHATS_NEW porte désormais :
//   · niv   — 0 discret : le Journal seul ;
//             1 nouveau : une pastille « Nouveau » sur l'élément (cible), 15 jours au plus
//               ou jusqu'au premier usage ;
//             2 à vérifier : une carte d'une ligne sur l'Accueil, jusqu'à « Vu » ;
//             3 grande nouveauté : la fenêtre, au plus une fois tous les 30 jours, trois au plus ;
//   · pour  — 'tous', 'admin', 'salaries', 'tractoriste' ou une clé de module ;
//   · cible — niveau 1 seulement : le sélecteur de l'élément qui porte la pastille.
//   Le bloc porte sa date `d` (AAAA-MM-JJ) : le Journal range par mois.
// ⚠️ Les blocs d'avant 8.04 n'ont ni niv ni d : on ne réécrit pas l'histoire. Ils ne
//   déclenchent plus rien et se relisent dans le Journal, sous « Versions précédentes ».
// ⚠️ Le texte vient TOUJOURS du code (WHATS_NEW), jamais d'une saisie : la description porte
//   ses <b>, comme MV_INFO. Le titre d'un item classé est du texte pur, échappé à l'affichage
//   (mv-whatsnew-check refuse un < ou un & dans un titre classé).
// ⚠️ « Vu » et la base vivent dans le navigateur, par domaine et par personne (même forme de
//   clé que la disposition de l'Accueil) : un « Vu » donné sur le téléphone ne suit pas sur
//   l'ordinateur. Assumé pour ce lot (§225).
var _MV_ANN_MAJ_JOURS = 30;   // la grande fenêtre : au plus une fois tous les 30 jours
var _MV_ANN_MAJ_MAX   = 3;    // ... et trois grandes nouveautés au plus
var _MV_ANN_MAJ_AGE   = 60;   // une grande nouveauté plus vieille ne s'ouvre plus (Journal seul)
var _MV_ANN_IMP_AGE   = 90;   // un « à vérifier » jamais vu quitte l'Accueil au bout de 90 jours
var _MV_ANN_NOUV_AGE  = 15;   // une pastille « Nouveau » : 15 jours au plus
var _MV_ANN_MODS = { vigne: 1, tracteur: 1, phyto: 1, cave: 1, reserve: 1, planning: 1, pilotage: 1 };
var _MV_ANN_MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
  'septembre', 'octobre', 'novembre', 'décembre'];

function _mvAnnCle(suffixe) {
  var u = window.currentUser;
  return 'mavigne_ann_' + suffixe + '_' + (window.TENANT_ID || 'default') + '_' + ((u && u.nom) || 'anon');
}
function _mvAnnLire(suffixe, defaut) {
  try { var v = localStorage.getItem(_mvAnnCle(suffixe)); return v == null ? defaut : JSON.parse(v); }
  catch (e) { if (window._mvAvale) window._mvAvale(e, 'utils.js/_mvAnnLire'); return defaut; }
}
function _mvAnnEcrire(suffixe, v) {
  try { localStorage.setItem(_mvAnnCle(suffixe), JSON.stringify(v)); }
  catch (e) { if (window._mvAvale) window._mvAvale(e, 'utils.js/_mvAnnEcrire'); }
}
function _mvAnnVus() { var v = _mvAnnLire('vus', []); return Array.isArray(v) ? v : []; }
function _mvAnnMarquer(id) {
  if (!id) return;
  var v = _mvAnnVus();
  if (v.indexOf(id) < 0) { v.push(id); _mvAnnEcrire('vus', v.slice(-300)); }
}

// Chaque item reçoit son identité : la version et son rang dans le bloc. Un bloc publié ne
// se réécrit pas : l'identité est stable d'une version à l'autre.
function _mvAnnItems() {
  var out = [];
  for (var i = 0; i < WHATS_NEW.length; i++) {
    var b = WHATS_NEW[i];
    if (!b || !Array.isArray(b.items)) continue;
    for (var k = 0; k < b.items.length; k++) {
      var it = b.items[k];
      if (it) out.push({ id: b.v + '#' + k, v: b.v, d: b.d || '', niv: typeof it.niv === 'number' ? it.niv : -1, it: it });
    }
  }
  return out;
}

// « pour » : à qui l'item parle. Absent = tout le monde (les blocs d'avant 8.04).
// ⚠️ Une clé de module suit la VISIBILITÉ du module (formule et masquage, _canModule) ;
//   le Pilotage exige en plus le droit de le voir (admin ou rôle pilotage).
function _mvAnnPourMoi(it) {
  var p = it && it.pour;
  if (!Array.isArray(p) || !p.length) return true;
  var r = (window.currentUser && window.currentUser.roles) || [];
  for (var i = 0; i < p.length; i++) {
    var t = p[i];
    if (t === 'tous') return true;
    if (t === 'admin' && r.indexOf('admin') >= 0) return true;
    if (t === 'salaries' && (r.indexOf('ouvrier') >= 0 || r.indexOf('tractoriste') >= 0)) return true;
    if (t === 'tractoriste' && r.indexOf('tractoriste') >= 0) return true;
    if (_MV_ANN_MODS[t] === 1) {
      var vis = true;
      try { if (typeof window._canModule === 'function') vis = !!window._canModule(t); }
      catch (e) { if (window._mvAvale) window._mvAvale(e, 'utils.js/_mvAnnPourMoi'); }
      if (t === 'pilotage' && !canSeePilotage()) vis = false;
      if (vis) return true;
    }
  }
  return false;
}

function _mvAnnJours(depuis, auj) {
  if (!depuis || !auj) return 0;
  return Math.round((new Date(auj + 'T12:00:00') - new Date(depuis + 'T12:00:00')) / 86400000);
}

// Ce qui attend la personne à un niveau : paru après sa base et pas après la version
// installée, pour elle, ni vu, ni trop vieux. Le plus récent d'abord.
function _mvAnnAttente(niv, base, vus, auj) {
  var age = niv === 3 ? _MV_ANN_MAJ_AGE : niv === 2 ? _MV_ANN_IMP_AGE : _MV_ANN_NOUV_AGE;
  return _mvAnnItems().filter(function (a) {
    if (a.niv !== niv || vus.indexOf(a.id) >= 0) return false;
    if (_cmpVer(a.v, base) <= 0 || _cmpVer(a.v, APP_VERSION) > 0) return false;
    if (niv === 1 && !a.it.cible) return false;
    if (a.d && _mvAnnJours(a.d, auj) > age) return false;
    return _mvAnnPourMoi(a.it);
  }).sort(function (x, y) { return _cmpVer(y.v, x.v); });
}

// ── Niveau 2 : la carte « À vérifier » de l'Accueil. Une ligne, pas un bloc : l'étiquette,
//    le titre, et « Vu ». Le détail s'ouvre au toucher, dans la feuille des nouveautés (#ovInfo).
function _mvAnnCarte(base, vus, auj) {
  var el = document.getElementById('home-annonce');
  if (!el) return;
  var L = (base == null) ? [] : _mvAnnAttente(2, base, vus, auj);
  if (!L.length) { el.innerHTML = ''; el.style.display = 'none'; return; }
  var a = L[0];
  el.style.display = '';
  el.innerHTML = '<div class="mvn-carte">'
    + '<span class="mvn-carte-ic" aria-hidden="true">' + _mvIcon('alerte', 18) + '</span>'
    + '<button type="button" class="mvn-carte-txt" data-ann-lire="' + _escAttr(a.id) + '">'
    + '<span class="mvn-carte-lb">À vérifier' + (L.length > 1 ? ', 1 sur ' + L.length : '') + '</span>'
    + '<span class="mvn-carte-ti">' + _escHtml(a.it.titre) + '</span></button>'
    + '<button type="button" class="mvn-carte-vu" data-ann-vu="' + _escAttr(a.id) + '">Vu</button>'
    + '</div>';
}
function _mvAnnCarteMaj() {
  _mvAnnCarte(_mvAnnLire('base', null), _mvAnnVus(), _mvAujIso());
}

// ── Niveau 1 : la pastille « Nouveau », posée sur l'élément que vise `cible`.
//    Les écrans se redessinent sans cesse (innerHTML) : un observateur la repose après
//    chaque rendu. Il ne tourne QUE s'il y a une pastille à poser, et se débranche ensuite.
// ⚠️ La pastille déborde le haut de sa cible : une cible logée dans un conteneur qui défile
//   (une barre d'onglets) la couperait — viser la ligne ou le bouton, pas l'onglet.
var _MVN_OBS = null, _MVN_RAF = 0, _MVN_ACTIFS = [];
function _mvNouvPoser() {
  _MVN_RAF = 0;
  var ids = _MVN_ACTIFS.map(function (a) { return a.id; });
  var poses = document.querySelectorAll('.mvn-nouv[data-nouv]');
  for (var i = 0; i < poses.length; i++)
    if (ids.indexOf(poses[i].getAttribute('data-nouv')) < 0) poses[i].remove();
  for (var k = 0; k < _MVN_ACTIFS.length; k++) {
    var el = null;
    try { el = document.querySelector(_MVN_ACTIFS[k].it.cible); }
    catch (e) { if (window._mvAvale) window._mvAvale(e, 'utils.js/_mvNouvPoser'); }
    if (!el || el.querySelector('.mvn-nouv')) continue;
    var b = document.createElement('span');
    b.className = 'mvn-nouv';
    b.setAttribute('data-nouv', _MVN_ACTIFS[k].id);
    b.textContent = 'Nouveau';
    if (window.getComputedStyle && window.getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(b);
  }
  if (!_MVN_ACTIFS.length && _MVN_OBS) { _MVN_OBS.disconnect(); _MVN_OBS = null; }
}
function _mvNouvVeille() {
  var base = _mvAnnLire('base', null);
  _MVN_ACTIFS = (base == null) ? [] : _mvAnnAttente(1, base, _mvAnnVus(), _mvAujIso());
  if (_MVN_ACTIFS.length && !_MVN_OBS && typeof MutationObserver === 'function' && document.body) {
    _MVN_OBS = new MutationObserver(function () { if (!_MVN_RAF) _MVN_RAF = requestAnimationFrame(_mvNouvPoser); });
    _MVN_OBS.observe(document.body, { childList: true, subtree: true });
  }
  _mvNouvPoser();
}
// Le premier usage de l'élément vaut « vu » : la pastille s'en va.
function _mvNouvUsage(t) {
  for (var k = 0; k < _MVN_ACTIFS.length; k++) {
    var hit = null;
    try { hit = t.closest(_MVN_ACTIFS[k].it.cible); }
    catch (e) { if (window._mvAvale) window._mvAvale(e, 'utils.js/_mvNouvUsage'); }
    if (hit) { _mvAnnMarquer(_MVN_ACTIFS[k].id); _mvNouvVeille(); return; }
  }
}

// La fiche d'un item, dans la feuille des nouveautés (#ovInfo — les « i » l'ont quittée, BULLE-1) : ouverte depuis la carte de
// l'Accueil ou depuis une pastille.
function _mvAnnFiche(id) {
  var el = document.getElementById('info-inner');
  var a = _mvAnnItems().filter(function (x) { return x.id === id; })[0];
  if (!el || !a) return;
  var imp = a.niv === 2;
  el.innerHTML = '<div class="modal-hd mva-hd"><span class="mvi-ic" aria-hidden="true">'
    + _mvIcon(imp ? 'alerte' : 'etincelles', 18) + '</span>'
    + '<div><div class="modal-title">' + _escHtml(a.it.titre) + '</div>'
    + '<div class="modal-sub">' + (imp ? 'À vérifier' : a.niv === 3 ? 'Grande nouveauté' : 'Nouveau')
    + ', version ' + _escHtml(a.v) + '</div></div></div>'
    + '<div class="mvi-bd"><p>' + a.it.desc + '</p></div>'
    + '<div class="mva-foot">'
    + (imp ? '<button type="button" class="mva-fbtn" data-ann-vu="' + _escAttr(a.id) + '">Vu</button>'
           : '<button type="button" class="mva-fbtn" data-ann-fermer="1">Compris</button>')
    + '<button type="button" class="mva-fbtn" data-ann-journal="1">Journal des nouveautés</button></div>';
  if (window.openOv) window.openOv('ovInfo');
}

// ── Le Journal des nouveautés (Réglages › Moi) : tout, mois par mois. Dans un mois : les
//    grandes nouveautés, puis « À vérifier », puis « Nouveau » (quatre, le reste replié), et
//    les corrections repliées en bas. Les blocs d'avant 8.04 (ni date ni niveau) se
//    relisent sous « Versions précédentes ».
var _MV_ANN_PLIS = {};
function _mvAnnMoisNom(m) {
  var n = _MV_ANN_MOIS[parseInt(m.slice(5, 7), 10) - 1] || '';
  return n.charAt(0).toUpperCase() + n.slice(1) + ' ' + m.slice(0, 4);
}
function _mvAnnLigne(a, genre, vus) {
  var vu = vus.indexOf(a.id) >= 0, tag = '';
  if (genre === 'maj') tag = '<span class="mvn-tag mvn-tag-maj">Grande nouveauté</span>';
  if (genre === 'imp') tag = vu ? '<span class="mvn-tag mvn-tag-vu">Vu</span>' : '<span class="mvn-tag mvn-tag-imp">À vérifier</span>';
  return '<div class="mvn-l mvn-l-' + genre + '">'
    + (tag ? '<div class="mvn-l-hd">' + tag + '</div>' : '')
    + '<div class="mvn-l-ti">' + _escHtml(a.it.titre) + '</div>'
    + '<div class="mvn-l-tx">' + a.it.desc + '</div>'
    + (genre === 'imp' && !vu ? '<button type="button" class="mvn-l-vu" data-ann-vu="' + _escAttr(a.id) + '">Vu</button>' : '')
    + '</div>';
}
function _mvAnnPlier(cle, libelle, classe) {
  return '<button type="button" class="mvn-plier' + classe + (_MV_ANN_PLIS[cle] ? ' on' : '')
    + '" data-ann-plier="' + _escAttr(cle) + '"><span class="mvn-plier-lb">' + libelle + '</span>'
    + _mvIcon('chevron', 16) + '</button>';
}
function _mvAnnMoisHtml(m, L, vus) {
  var S = { 3: [], 2: [], 1: [], 0: [] };
  L.forEach(function (a) { (S[a.niv] || S[0]).push(a); });
  var h = '<div class="mvn-mois"><div class="mvn-mois-t">' + _mvAnnMoisNom(m) + '</div>';
  if (S[3].length) h += '<div class="mvn-sec">' + S[3].map(function (a) { return _mvAnnLigne(a, 'maj', vus); }).join('') + '</div>';
  if (S[2].length) h += '<div class="mvn-sec">' + S[2].map(function (a) { return _mvAnnLigne(a, 'imp', vus); }).join('') + '</div>';
  if (S[1].length) {
    var ouvert = !!_MV_ANN_PLIS[m + '-n'];
    h += '<div class="mvn-liste"><div class="mvn-liste-hd">' + _mvIcon('etiquette', 16) + 'Nouveau</div>'
      + (ouvert ? S[1] : S[1].slice(0, 4)).map(function (a) { return _mvAnnLigne(a, 'nouv', vus); }).join('')
      + (S[1].length > 4 ? _mvAnnPlier(m + '-n', ouvert ? 'Réduire la liste' : (S[1].length === 5 ? 'Voir l’autre' : 'Voir les ' + (S[1].length - 4) + ' autres'), '') : '')
      + '</div>';
  }
  if (S[0].length) {
    var co = !!_MV_ANN_PLIS[m + '-c'];
    h += _mvAnnPlier(m + '-c', co ? 'Masquer les corrections'
      : S[0].length + (S[0].length > 1 ? ' corrections' : ' correction'), ' mvn-plier-c');
    if (co) h += '<ul class="mvn-corr">' + S[0].map(function (a) { return '<li>' + _escHtml(a.it.titre) + '</li>'; }).join('') + '</ul>';
  }
  return h + '</div>';
}
function _mvAnnAnciensHtml(L) {
  var ouvert = !!_MV_ANN_PLIS.anciens, vers = [], parV = {};
  L.forEach(function (a) { if (!parV[a.v]) { parV[a.v] = []; vers.push(a.v); } parV[a.v].push(a.it); });
  var h = '<div class="mvn-mois">' + _mvAnnPlier('anciens', ouvert ? 'Masquer les versions précédentes'
    : 'Versions précédentes (' + vers.length + ')', ' mvn-plier-c');
  if (ouvert) vers.forEach(function (v) {
    h += '<div class="mvn-anc-v">Version ' + _escHtml(v) + '</div>';
    parV[v].forEach(function (it, i) { h += _wnRow(it, i < parV[v].length - 1 ? 'border-bottom:1px solid rgba(0,0,0,0.06);' : ''); });
  });
  return h + '</div>';
}
function _mvAnnJournalHtml() {
  var vus = _mvAnnVus(), mois = {}, ordre = [], anciens = [];
  _mvAnnItems().forEach(function (a) {
    if (!_mvAnnPourMoi(a.it) || _cmpVer(a.v, APP_VERSION) > 0) return;
    if (a.niv < 0 || !a.d) { anciens.push(a); return; }
    var m = a.d.slice(0, 7);
    if (!mois[m]) { mois[m] = []; ordre.push(m); }
    mois[m].push(a);
  });
  var h = '<div class="modal-hd mva-hd"><span class="mvi-ic" aria-hidden="true">' + _mvIcon('etincelles', 18) + '</span>'
    + '<div><div class="modal-title">Journal des nouveautés</div>'
    + '<div class="modal-sub">Tout ce qui a changé, mois par mois. Ma Vigne v' + APP_VERSION + '</div></div></div>'
    + '<div class="mvn-j">';
  ordre.forEach(function (m) { h += _mvAnnMoisHtml(m, mois[m], vus); });
  if (anciens.length) h += _mvAnnAnciensHtml(anciens);
  return h + '</div><div class="mva-foot"><button type="button" class="mva-fbtn" data-ann-fermer="1">Fermer</button></div>';
}
function _mvAnnJournalOuvert() {
  var el = document.getElementById('info-inner');
  return !!(el && el.querySelector('.mvn-j'));
}
window.openNouvJournal = function () {
  var el = document.getElementById('info-inner');
  if (!el) return;
  var ov = document.getElementById('ovWhatsNew');
  if (ov && ov.classList.contains('open')) dismissWhatsNew();   // la grande fenêtre se range, comme « Compris »
  el.innerHTML = _mvAnnJournalHtml();
  if (window.openOv) window.openOv('ovInfo');
};

// UN SEUL ÉCOUTEUR, posé une fois, comme celui des pastilles « i » : les boutons des
// annonces portent des data-ann-*, jamais un onclick écrit dans le HTML (C24).
// ⚠️ stopPropagation : la pastille vit DANS sa cible — sans lui, la toucher ouvrirait aussi
//   l'écran visé au lieu de dire ce qui est nouveau.
if (typeof document !== 'undefined') {
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var b = t.closest('[data-ann-vu],[data-ann-lire],[data-ann-journal],[data-ann-plier],[data-ann-fermer],.mvn-nouv');
    if (!b) { _mvNouvUsage(t); return; }
    e.preventDefault();
    e.stopPropagation();
    var j = document.getElementById('info-inner');
    if (b.hasAttribute('data-ann-vu')) {
      _mvAnnMarquer(b.getAttribute('data-ann-vu'));
      _mvAnnCarteMaj();
      if (_mvAnnJournalOuvert()) j.innerHTML = _mvAnnJournalHtml();
      else if (b.closest('#info-inner') && window.closeOv) window.closeOv(null, 'ovInfo');
    } else if (b.hasAttribute('data-ann-lire')) {
      _mvAnnFiche(b.getAttribute('data-ann-lire'));
    } else if (b.hasAttribute('data-ann-journal')) {
      window.openNouvJournal();
    } else if (b.hasAttribute('data-ann-plier')) {
      var k = b.getAttribute('data-ann-plier');
      _MV_ANN_PLIS[k] = !_MV_ANN_PLIS[k];
      if (j) j.innerHTML = _mvAnnJournalHtml();
    } else if (b.hasAttribute('data-ann-fermer')) {
      if (window.closeOv) window.closeOv(null, 'ovInfo');
    } else {
      var id = b.getAttribute('data-nouv');
      _mvAnnMarquer(id);
      _mvNouvVeille();
      _mvAnnFiche(id);
    }
  }, true);
}

let _whatsNewShown = false;
export function checkWhatsNew() {
  if (_whatsNewShown) return;
  if (_mvPrepOn()) return;   // PREP-1 (§134) : les nouveautés d'un domaine ne regardent pas GUERETTECH
  var seen = localStorage.getItem('mavigne_last_seen_version');
  // ANN-1 : la BASE se pose une fois par personne — sa dernière version vue, sinon la version
  //   installée (1re installation : aucun récapitulatif). Rien de paru avant elle ne se déclenche.
  var base = _mvAnnLire('base', null);
  if (base == null) { base = seen || APP_VERSION; _mvAnnEcrire('base', base); }
  if (!seen) { try{ localStorage.setItem('mavigne_last_seen_version', APP_VERSION); }catch(e){ if(window._mvAvale) window._mvAvale(e,'utils.js/checkWhatsNew'); } }
  var vus = _mvAnnVus(), auj = _mvAujIso();
  _mvAnnCarte(base, vus, auj);   // niveau 2 — la carte de l'Accueil
  _mvNouvVeille();               // niveau 1 — les pastilles
  // Niveau 3 — la grande fenêtre : au plus une fois tous les 30 jours, trois nouveautés au plus.
  var der = _mvAnnLire('fenetre', '');
  if (der && _mvAnnJours(der, auj) < _MV_ANN_MAJ_JOURS) return;
  var maj = _mvAnnAttente(3, base, vus, auj).slice(0, _MV_ANN_MAJ_MAX);
  if (!maj.length) return;
  _whatsNewShown = true;
  var autres = 0;
  _whatsNewSince(seen || APP_VERSION).forEach(function (b) { autres += b.items.length; });
  autres = Math.max(0, autres - maj.length);
  var badge = document.getElementById('wn-version-badge');
  if (badge) badge.textContent = 'v' + APP_VERSION;
  var titleEl = document.getElementById('wn-title');
  if (titleEl) titleEl.textContent = maj.length > 1 ? 'Les grandes nouveautés' : 'Une grande nouveauté';
  var container = document.getElementById('wn-items');
  if (container) {
    var html = '';
    maj.forEach(function (a, i) { html += _wnRow(a.it, i < maj.length - 1 ? 'border-bottom:1px solid rgba(0,0,0,0.06);' : ''); });
    if (autres) html += '<div class="mvn-wn-autres">Et ' + autres + (autres > 1 ? ' autres changements' : ' autre changement')
      + ' depuis votre dernière visite, à lire dans le Journal des nouveautés.</div>';
    container.innerHTML = html;
  }
  // Vues dès l'ouverture : la fenêtre ne revient pas pour les mêmes nouveautés.
  maj.forEach(function (a) { vus.push(a.id); });
  _mvAnnEcrire('vus', vus.slice(-300));
  _mvAnnEcrire('fenetre', auj);
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
  Ebourgeonnage:'Ébourg.', Ebourgeonnage1:'Ébourg. 1', Ebourgeonnage2:'Ébourg. 2',
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
/* ★ Vide : prenoms de salaries retires du code (cf. src/app.js).
   La couleur d'un membre vit sur sa fiche. */
export const COULEURS_MBR = {};

// ════ HELPERS TÂCHES ════
// NOMS-1 (03/10) : UN SEUL NOM AFFICHÉ PAR TRAVAIL, ÉCRIT EN ENTIER ET ACCENTUÉ.
//   Les clés internes (`Brulage`, `Reparation`, `Desherbage`) sont des identifiants, jamais un libellé :
//   les puces de Parcelles les montraient telles quelles pendant que le Pilotage écrivait « Répar. » et
//   le catalogue « Réparation » — trois noms pour un même travail. tNom rend désormais le nom ENTIER ;
//   la forme courte (TABREV) n'est plus affichée nulle part (KIT-1, §226). Une tâche créée par le
//   domaine garde le nom qu'il lui a donné.
export const TLIB = { Brulage:'Brûlage', Reparation:'Réparation', Ebourgeonnage:'Ébourgeonnage',
  Ebourgeonnage1:'Ébourgeonnage 1', Ebourgeonnage2:'Ébourgeonnage 2', Desherbage:'Désherbage' };
export function tLib(nom) { return TLIB[nom] || nom; }
export function tNom(nom) { return tLib(nom); }
// KIT-1 (§226) : tAbr est retiré — plus aucune forme courte affichée (Nico, 03/10 : « go » sur la maquette du kit).

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
  // ★ REVUE-6 (§406) : « Mode hors ligne » restait posé sur l'en-tête, par-dessus le titre et un bouton, tant que durait la
  //   coupure (fréquente dans les vignes). Il s'annonce puis s'efface ; l'état reste dit par le voyant de l'en-tête.
  if(isLoading) {
    badge.style.fontSize = '13px';
    badge.style.padding = '8px 18px';
  } else {
    badge.style.fontSize = isOffline ? '13px' : '';
    badge.style.padding = isOffline ? '8px 18px' : '';
    badge._t = setTimeout(function(){ badge.style.opacity='0'; }, isOffline ? 4000 : 2500);
  }
}

// ════ TOAST ════
var _toastTimer = null;
export function showToast(msg, color) {
  color = color || '#3D6B27';
  // Capture silencieuse des toasts d'erreur/alerte (accompagne un signalement)
  if (_mvSuppressToastCapture) { _mvSuppressToastCapture = false; }
  else { try { _mvCaptureToastErr(msg, color); } catch(e){ if(window._mvAvale) window._mvAvale(e,'utils.js/showToast'); } }
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
// ★ ANNULER-1 (§471) — « ANNULER PLUTÔT QUE CONFIRMER » (docs/maquettes/maquette-ux-v1.html, partie 4). Pour un geste qui se
//   répare, l'action est DÉJÀ écrite quand le toast paraît ; il reste six secondes, une barre qui s'épuise, « Annuler » à 40 px,
//   et Annuler écrit l'inverse. Un seul toast à la fois : un nouveau remplace l'ancien (l'annulation du précédent n'est plus
//   offerte, comme dans Gmail). Le toast est celui que Parcelles portait déjà pour Valider (#pv-toast, 4,5 s) : un seul
//   composant pour toute l'appli, mêmes identifiants (les tutos et le panneau côte à côte les lisent).
export const MV_ANNULER_MS = 6000;
var _mvAnnFn = null, _mvAnnTimer = null;
export function showToastAnnuler(msg, annuler) {
  var t = document.getElementById('pv-toast'), m = document.getElementById('pv-toast-msg'), u = document.getElementById('pv-toast-undo');
  if (!t || !m || !u) { showToast(msg, '#3D6B27'); return; }
  var fn = (typeof annuler === 'function') ? annuler : null;
  m.textContent = msg;
  _mvAnnFn = fn;
  u.style.display = fn ? '' : 'none';
  u.onclick = function () { var f = _mvAnnFn; _mvAnnFn = null; _mvAnnCacher(); if (f) { try { f(); } catch (e) { if (window._mvAvale) window._mvAvale(e, 'utils.js/showToastAnnuler'); } } };
  t.classList.remove('show', 'mv-ann'); void t.offsetWidth;   // la barre repart de plein à chaque toast
  t.classList.add('show'); if (fn) t.classList.add('mv-ann');
  if (navigator.vibrate) navigator.vibrate(40);
  clearTimeout(_mvAnnTimer); _mvAnnTimer = setTimeout(_mvAnnCacher, fn ? MV_ANNULER_MS : 2200);
}
function _mvAnnCacher() { var t = document.getElementById('pv-toast'); if (t) t.classList.remove('show', 'mv-ann'); _mvAnnFn = null; }

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
  try { localStorage.setItem('mavigne_theme', mode); } catch(e){ if(window._mvAvale) window._mvAvale(e,'utils.js/setThemeMode'); }
  applyTheme(mode);
}
export function initTheme() {
  var saved = 'auto';
  try { saved = localStorage.getItem('mavigne_theme') || 'auto'; } catch(e){ if(window._mvAvale) window._mvAvale(e,'utils.js/initTheme'); }
  applyTheme(saved);
  // Écouter les changements système en mode Auto
  if(window.matchMedia) {
    window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', function() {
      try {
        var m = localStorage.getItem('mavigne_theme') || 'auto';
        if(m === 'auto') applyTheme('auto');
      } catch(e){ if(window._mvAvale) window._mvAvale(e,'utils.js/initTheme#2'); }
    });
  }
}

// ════ AUTH HELPERS ════
// Utilisent window.currentUser (défini par app.js au login/logout)
export function isAdmin() {
  return !!(window.currentUser && window.currentUser.roles && window.currentUser.roles.includes('admin'));
}
// ★ PREP-1 (§134) — LE MODE PRÉPARATION GUERETTECH. GUERETTECH ouvre un domaine client
//   dans les écrans normaux, depuis sa session GT, pour le préparer avant la remise.
//   `_isPrep` n'est posé qu'à UN endroit (_mvPrepBoot, app.js), sur un utilisateur
//   synthétique ABSENT de MEMBRES. Cette fonction est la seule question que le reste du
//   code pose : ne pas relire `_isPrep` à la main ailleurs.
export function _mvPrepOn() {
  return !!(window.currentUser && window.currentUser._isPrep === true);
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
// ★★ DROITS-1 (27/09/2026, §185) — « lecture seule » AU SENS DU SERVEUR : copie exacte de deriveRo
//   (functions/claims.js), qui pose le claim `ro` que les règles Firestore lisent. Distinct de
//   canWrite(), qui règle l'AFFICHAGE (un tractoriste seul n'a pas canWrite mais écrit ses
//   sessions). Tenu égal à deriveRo par mv-harnais-droits sur les 32 combinaisons de rôles.
// ★ DROITS-2 (§186) : aucun rôle d'écriture = lecture seule, même sans saisonnier ni pilotage.
//   Sans session (avant la connexion), on ne bloque rien : aucun enregistrement n'a lieu alors.
export function _mvLectureSeule() {
  if (!window.currentUser) return false;
  if (window.currentUser._isGTAdmin) return false;   // GUERETTECH : les règles le laissent écrire (isGtAdmin), quels que soient ses rôles
  var r = Array.isArray(window.currentUser.roles) ? window.currentUser.roles : [];
  return r.indexOf('admin') < 0 && r.indexOf('ouvrier') < 0 && r.indexOf('tractoriste') < 0;
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
  } catch(e){ if(window._mvAvale) window._mvAvale(e,'utils.js/_mvCaptureToastErr'); }
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
// ★ NOTIF-2 (§310) — RIEN SANS LA PERMISSION, ET UN REFUS NE S'AFFICHE JAMAIS.
//   `reg.showNotification` REJETTE sa promesse quand l'appareil n'a pas autorisé les notifications. Rien ne
//   rattrapait ce rejet : le gestionnaire global l'affichait en orange (« Promesse rejetée : Failed to execute
//   'showNotification'… ») et l'envoyait au journal du domaine. Remonté du terrain : 19 fois du 20/09 au
//   10/10, toujours le jour d'une mise en ligne ou le lendemain matin — l'appel de NOTIF-1 (§158), le seul
//   sans garde (§158e ①). La garde vit ICI, pour tous les appelants présents et futurs : un appelant qui
//   oublie la sienne ne peut plus rien casser. Un refus qui arrive quand même (permission retirée entre la
//   garde et l'envoi, `new Notification` interdit sur Android) est avalé avec son nom, jamais affiché.
//   ⚠️ Le `return` dans le `.then` compte : sans lui, le rejet de showNotification échappe au `.catch`.
function _swNotify(title, opts) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready
      .then(function(reg){ return reg.showNotification(title, opts); })
      .catch(function(e){ if (window._mvAvale) window._mvAvale(e, 'utils.js/_swNotify'); });
  } else {
    try { new Notification(title, opts); } catch(e){ if (window._mvAvale) window._mvAvale(e, 'utils.js/_swNotify#new'); }
  }
}
window._swNotify = _swNotify;

function _errCurrentPage() {
  var a = document.querySelector('.page.active');
  return a ? (a.id || '').replace('page-', '') : '—';
}

/* ═══════════════════════════════════════════════════════════════════════════
   L'ERREUR AVALEE A MAINTENANT UN NOM — lot AVALE-1
   ═══════════════════════════════════════════════════════════════════════════
   223 `catch{}` vides dans src/, dont 152 dans app.js. Le preflight les compte
   depuis des mois (C14) : « c'est le motif qui a permis au bug
   `.window.currentUser` de survivre des mois et aux refus de lecture d'etre
   invisibles ». Le compteur descendait d'un cran de temps en temps. Il ne
   descendait pas.

   ⚠️ CES CATCH NE SE VALENT PAS. `try{localStorage.removeItem(...)}catch{}` est
   du meilleur effort legitime — navigation privee, quota. Mais
   `try{ renderParcelles() }catch{}` et `try{ _recalcSurfTotale() }catch{}`
   avalent un ECHEC DE RENDU et un CALCUL DE SURFACE FAUX. On ne peut pas les
   distinguer par relecture de 223 emplacements sans se tromper quelque part :
   on les rend tous TRACABLES, et le tri se fera sur des donnees.

   ★★★ NIVEAU 'info' A LA PREMIERE FOIS, ET C'EST DELIBERE. `_ERR_SEND_LVL` n'envoie
   a Firestore que critical / error / warning : une erreur avalee UNE fois ne remonte
   donc PAS dans le journal du domaine et n'inonde personne (la 10e, si — AVALE-2). Elle s'ecrit en local, ou l'ecran
   Admin la lit deja. Ce lot ouvre une fenetre, il ne declenche pas d'alarme.

   ⚠️⚠️ UNE FOIS PAR EMPLACEMENT ET PAR SESSION. `logError` relit et reecrit tout
   le journal localStorage a chaque appel : appele depuis une boucle de rendu,
   il couterait plus cher que le defaut qu'il signale. Le compteur reste, lui,
   et `window._mvAvalees` le rend lisible en console.

   ★★★ AVALE-2 (§212) — UNE PANNE REPETEE PARLE, UN HOQUET RESTE DISCRET.
   Le defaut d'avant : une erreur produite mille fois etait journalisee UNE fois,
   en 'info', donc UNIQUEMENT dans le telephone. Le compteur montait et personne
   ne le relisait jamais : du point de vue du journal du domaine, un bouton casse
   a chaque tap etait aussi invisible qu'avec un catch vide.
   On ecrit donc aux PALIERS 1, 10, 100, 1000 — jamais entre (le cout de logError
   reste borne a quatre ecritures par emplacement et par session) :
     - 1re fois  : 'info', local seulement. Inchange : un hoquet ne derange personne.
     - 10e fois et au-dela : 'warning' -> part dans le journal du domaine (Admin GT)
       et passe devant les 'info' dans « Signaler un probleme ». Dix fois dans la
       meme session, ce n'est plus un incident : c'est en panne.
   ⚠️⚠️ TOUJOURS `silencieux:true`. Un 'warning' ordinaire peint un toast jaune
   « ⚠️ erreur avalée dans app.js/… » — du jargon a l'ecran du vigneron. Le palier
   s'adresse a celui qui depanne, jamais au client. Le harnais tient les deux. */
var _MV_AVALEES = {};
var _MV_AVALE_PALIERS = { 1: 1, 10: 1, 100: 1, 1000: 1 };
export function _mvAvale(e, ou) {
  var k = ou ? String(ou) : '?';
  var n = _MV_AVALEES[k] = (_MV_AVALEES[k] || 0) + 1;
  if (!_MV_AVALE_PALIERS[n]) return;   /* hors palier : le compteur seul avance */
  if (typeof logError !== 'function') return;
  var d = '';
  if (e && (e.stack || e.message)) d = String(e.stack || e.message).slice(0, 300);
  else if (e !== undefined) d = String(e).slice(0, 300);
  logError({ level: n >= 10 ? 'warning' : 'info', silencieux: true, cat: 'avale',
    msg: 'erreur avalée dans ' + k + (n > 1 ? ' (×' + n + ' cette session)' : ''), detail: d });
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
  //    `silencieux` : journalise et envoie selon le niveau, mais ne peint RIEN a l'ecran.
  //    Pose par le helper des erreurs avalees (AVALE-2, §212) : une panne repetee doit remonter a l'Admin GT
  //    sans afficher au client un toast « erreur avalée dans app.js/… ».
  if(opts.silencieux) {
    /* rien a l'ecran */
  } else if(level === 'critical') {
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
  try { all = JSON.parse(localStorage.getItem(_ERR_KEY) || '[]'); } catch(e){ if(window._mvAvale) window._mvAvale(e,'utils.js/_mvPickReportErrors'); }
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
  try { if (window.closeOv) { window.closeOv(null, 'ovReport'); return; } } catch(e){ if(window._mvAvale) window._mvAvale(e,'utils.js/closeReport'); }
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
  var t = window._PIL_TABS;
  if (!t || !t.length) return null;
  var noms = t.map(function (x) { return x[2]; });
  return [_mvAideNb(noms.length) + ' onglets',
    // AIDE-1 (§365) : « Le dernier ouvert revient à la visite suivante » était faux depuis AUJ-5 (§307) — goHub (app.js)
    //   rouvre Aujourd'hui à chaque ouverture de l'appli ; renderPilotage relit ensuite l'onglet mémorisé.
    //   mv-harnais-aide exige que goHub le fasse toujours, tant que cette phrase le dit.
    ': ' + _mvAideEnum(noms) + '. À l’ouverture de l’appli, le Pilotage s’ouvre sur Aujourd’hui ; quand vous y revenez, il garde l’onglet où vous étiez.'];
}

// ★ AIDE-1 (§365) — LE TEXTE D'UNE FICHE : DU TEXTE, ET LE GRAS. Ce texte est ÉCRIT ici, jamais saisi : on y permet
//   <b>…</b>, et rien d'autre. Tout est échappé, puis seuls <b> et </b> redeviennent du gras — appariés, jamais
//   imbriqués, refermés en fin de ligne (un gras resté ouvert déborderait sur les lignes suivantes).
//   Jusqu'au 18/10, la suite était échappée en bloc : les 26 gras du Pilotage s'affichaient en code.
//   ⚠️ Une entité (&amp;) ou une autre balise (<sub>) s'afficherait telle quelle : écrire « & » et « SO2 ».
//   scripts/mv-harnais-aide.mjs rejoue openAide sur chaque fiche et refuse tout code visible.
function _mvAideTexte(s) {
  var out = '', gras = false;
  String(s == null ? '' : s).split(/(<\/?b>)/).forEach(function (m) {
    if (m === '<b>') { if (!gras) { out += '<b>'; gras = true; } }
    else if (m === '</b>') { if (gras) { out += '</b>'; gras = false; } }
    else if (m) out += _escHtml(m);
  });
  return gras ? out + '</b>' : out;
}

var MV_AIDE = {
  home: {
    ico: 'feuille', titre: 'Accueil', ancre: 'vigne',
    points: [
      ['Ma saison en images', " : dans « Ma trace », six cartes qui racontent votre saison ; « Enregistrer en PDF » en garde une copie."],
      ['La carte de votre saison', " : dans « Ma trace », vos parcelles en mosaïque, chacune à sa forme et à sa taille, avec ses rangs — de la plus parcourue à la moins parcourue, en or de plus en plus plein selon vos passages depuis le début de la saison (aucun, 1, 2 à 3, 4 et plus). Le chiffre compte les parcelles en vigne. Toucher une parcelle ouvre sa fiche. Elle s’affiche aussi sans réseau."],
      ['Les vins de votre travail', " : dans « Ma trace », pour chaque millésime, les cuvées nées des parcelles où vous avez travaillé, et ce que vous y avez fait."],
      ['Annoncer mes jalons', " : Réglages › Moi › Mon compte. Coupée, l’annonce « Nouveau jalon » se tait après une validation ; les jalons se comptent quand même (« Ma trace »)."],
      ['Vos premières fois', " : dans « Ma trace », la frise de votre parcours au domaine, avec les vraies dates ; celles qui viennent attendent en pointillé."],
      ['Ta présence est notée', " : quand l’admin vous coche parmi les intervenants d’une opération du Chai, l’Accueil vous le dit pendant trois jours, avec le pourquoi du geste. « Vu » range la carte."],
      ['Mes jalons', " : dans « Ma trace », ceux que vous avez gagnés et les trois prochains. Quand une validation vous en fait atteindre un, la feuille qui suit l’annonce. Vous seul les voyez."],
      ['Chez un ouvrier', " : la Vigne a deux onglets, Accueil et Parcelles. On valide depuis les Parcelles ; le Journal reste à l’administrateur et au pilotage. « Ma saison » mène à « Ma trace », l’historique de votre travail."],
      ['Sur ordinateur', " : les modules sont dans la <b>barre à gauche</b> (repliable), et <b>Ctrl K</b> ouvre une recherche — une parcelle, un écran, un onglet du Pilotage. Sur téléphone et tablette, rien ne change. Un petit compteur au bout d’une entrée signale ce qui attend : un tracteur en réparation, un contrat qui finit dans le mois, ce qui presse en cave, les points à anticiper du Pilotage. Barre repliée, c’est un point sur l’icône : survolez-la pour lire le nombre."],
      ['La priorité du moment', "reste épinglée en haut, dans une carte : la tâche du jour en grand, le message de l’administrateur, l’avancement en hectares, ce qui a avancé aujourd’hui et hier, votre équipe, la parcelle en cours et la fin prévue au rythme des 15 derniers jours. « Aller aux parcelles » ouvre la tâche, « Pourquoi ? » sa fiche. À côté, les parcelles dessinées à leur forme (leur contour, nord en haut) et à leur surface (fait, en cours, à faire) — un appui sur l’une ouvre sa fiche ; elles portent leurs rangs, en vert ce qui est fait, en ambre ce qui est commencé, en blanc ce qui reste. Une parcelle dont le contour n’est pas enregistré reste un rectangle, en pointillé. Une parcelle où la tâche est désactivée, ou pas choisie pour la campagne, reste en contour pâle, en dernier, et ne compte pas dans l’avancement. Un délai de rentrée en cours s’affiche en rouge en haut de la carte et sur les parcelles concernées. Sans priorité, la carte montre les chantiers du moment d’après le calendrier de la campagne. L’administrateur modifie la priorité (« Modifier ») et règle les équipes du jour depuis la carte."],
      ['Équipes du jour', "juste sous la priorité. L’administrateur la touche pour répartir les salariés sous contrat en équipes, quatre au plus : <b>elles restent en place les jours suivants</b>, jusqu’à ce qu’il les change. Chacun validera et démarrera avec son équipe, sans pouvoir la changer, et ne voit pas les autres. Tout le monde y arrive en Équipe 1 ; pour mettre quelqu’un seul, il lui donne une équipe à lui. Sous les noms, il peut aussi choisir la tournée de chaque équipe : par défaut, celle du travail. « Cave » met la personne en cave pour la journée : ses heures ne vont pas à la vigne et elle quitte les équipes — la même marque qu’au Planning, où se pose une demi-journée. Rien de posé, ou « Tout le monde en Équipe 1 » : tout le monde est ensemble, en Équipe 1 — sauf qui est coché dans une équipe de la priorité, qui garde celle-là ; les journées de cave, elles, restent. Un salarié voit ici son équipe."],
      ['Une ligne « À vérifier »', "peut s’afficher en haut de l’Accueil : un changement de l’application qui vous concerne — un chiffre qui bouge, un réglage à contrôler. Touchez-la pour le détail, « Vu » pour la ranger ; elle reste dans Réglages › Moi › Journal des nouveautés."],
      ['La mise en route', "n’apparaît que chez l’administrateur d’un domaine neuf : sept étapes qui se cochent en lisant ce qui est déjà enregistré, rien à pointer à la main. Le bloc s’efface tout seul quand tout est fait."],
      ['Ma saison', " : ce que l’appli vous rend — votre part de la saison en hectares, vos jours au domaine, vos kilomètres de rangs ; votre part du chantier du moment (la priorité de votre équipe ; sans priorité, la seule tâche dans ses dates de travaux ; si plusieurs se chevauchent, celle où vous avez le plus travaillé ces 15 derniers jours) ; votre semaine en hectares, jamais en heures ; vos deux jalons les plus proches et le dernier gagné. « Ma trace » ouvre le détail."],
      ['La saison', " : le pourcentage de la saison, puis chaque tâche — en cours avec ce qui reste (en hectares et en parcelles), à venir avec sa date de début, terminée. La carte range les tâches par date de début : ce qui reste à faire ou est en cours en haut, les tâches finies en bas. L’arrachage que l’équipe a fini partout : la tâche se range en tête des terminées, en vert (« fini pour l’équipe »). « Toutes les tâches » ouvre les Parcelles."],
      ['Personnaliser', " : le bouton du bandeau passe l’Accueil en réglage — l’œil masque une carte, l’œil barré la réaffiche. L’ordre suit la journée et ne bouge pas ; la carte du jour et « À savoir » restent toujours affichées. Chacun règle son Accueil ; l’administrateur peut proposer son choix à ceux qui n’en ont pas fait."],
      ['La pastille de saison', "change la vue. Revenir sur une période passée ne touche pas à la période active."],
      ['Actualiser', "force une resynchronisation quand un chiffre semble figé."],
      ['Le voyant en haut de l’écran', "dit où en est la synchro. Orange avec «\u00a0Pas de synchro\u00a0»\u00a0: le téléphone a du réseau mais ne joint plus le serveur, et ne reçoit plus ce que les autres saisissent — touchez-le, puis «\u00a0Relancer l’application\u00a0». Au retour de veille, l’application vérifie d’elle-même et relit ce qui a changé. Relancer ne fait rien perdre\u00a0: les saisies en attente restent sur le téléphone, s’affichent et partent dès que le serveur répond."],
      ['La roue crantée', "en haut à droite ouvre ce qui se règle une fois l’an pour la vigne — tâches et barème, écartements de plantation, secteurs météo — et les documents de la vigne. Administrateur seulement ; l’en-tête dit « Vigne » sur les trois onglets."],
      ['« Tu prends le tracteur aujourd’hui ? »', "se pose à la première ouverture du jour, à ceux qui sont à la fois ouvriers et tractoristes et seulement si une session tracteur est ouverte. La réponse tient la journée et se repose le lendemain. Elle range le menu du bas et choisit l’écran d’ouverture : elle ne change aucun de vos droits, et rien ne disparaît — le reste passe sous « Plus », où se trouve aussi le retour au terrain."],
      ['La météo 5 jours', "le jour en tête, puis cinq colonnes. La barre et le chiffre sous chaque jour disent le <b>risque</b> de pluie — une probabilité, pas des millimètres ; la note signale le premier jour où il dépasse 50\u00a0%. Quand le domaine a plusieurs communes, le bouton « Secteurs » montre dans la même carte la météo de chaque commune."],
      ['En direct', " : ce qui est commencé aujourd’hui et pas encore validé, avec l’heure du début, et les sessions du tracteur ouvertes ; puis le fil des validations, rangé par jour — « Vous et Jean avez validé » quand vous en êtes. La carte garde la hauteur d’une journée calme ; « Tout voir » la déplie."],
      ['À savoir', " : en tête de la colonne de droite (dessous la carte du jour au téléphone) — un délai de rentrée en cours, la pluie probable, le gel et le vent des prochains jours travaillés. Des faits, jamais une décision : c’est vous qui jugez. Elle reste toujours affichée."],
      ['Au tracteur', " : chez le tractoriste et l’administrateur — votre dernière session, le compteur du tracteur et sa révision quand elle approche, la cuve de GNR (administrateur) ou vos sessions de la saison ; « Démarrer une session » ouvre la feuille du Tracteur."],
      ['Deux colonnes sur ordinateur', " : la journée à gauche (la carte du jour, « La saison », « Ma saison », « Au tracteur ») ; « À savoir », la météo et « En direct » à droite. Cette colonne reste visible en descendant quand elle tient dans l’écran. Au téléphone, une seule colonne, dans l’ordre des questions du matin."],
      ['La météo a besoin du réseau.', "Hors ligne, elle affiche la dernière prévision reçue."]
    ]
  },
  parcelles: {
    ico: 'carte', titre: 'Mes Parcelles', ancre: 'vigne',
    points: [
      ['Filtres', " : sur votre priorité, le bouton à côté de la recherche range l’affichage (à faire, toutes, finies, en cours, arrachées) et l’ordre (proximité, normal, ou la tournée de l’admin) ; une pastille dit qu’un filtre est actif."],
      ['L’arrivée sur votre priorité', " : la priorité du moment n’est annoncée qu’une fois, dans la barre dorée ; dessous, le niveau et l’équipe tiennent sur une ligne (l’équipe à ses pastilles, « Changer » ouvre les noms ; quand l’administrateur l’a posée, « Fixée » : un appui la nomme). Les nombres « Finies » et « En cours » sont sur les filtres, et la prochaine parcelle à valider porte la marque « Prochaine »."],
      ['Pourquoi ?', " : la pastille <b>« Pourquoi ? »</b>, à côté de la tâche choisie (ou de la priorité du moment) et dans la feuille de validation, ouvre la fiche de la tâche : quand on la fait, pourquoi, ce que ça change pour le vin."],
      ['Les filtres du haut', "trient par état : finies, en cours, arrachées."],
      ['Sur chaque carte', "la surface au centiare près (0,0870 ha), le pourcentage, et le compte des tâches faites, qui suit la même règle : un arrachage à moitié fait compte pour une demie (« 1,5/2 tâches »)."],
      ['Les deux gestes', "« Début » signale qu’on attaque, « Valider » que c’est fini, sans ouvrir la parcelle : en bas de chaque carte au téléphone, au bout de chaque ligne sur ordinateur. Quand une tâche est choisie, la carte dit l’état de cette tâche à la place du pourcentage. Une tâche à passages affiche en plus le passage en cours (P1, P2, N1…). Les deux enregistrent l’équipe de la barre « Équipe sur … », « sans moi » compris : c’est elle que le Pilotage pose sur la parcelle en cours. Changer l’équipe d’une tâche la donne aussi aux parcelles en cours que vous avez commencées sans équipe notée. Chez un salarié, l’équipe posée par l’administrateur — Équipes du jour, ou l’équipe de la priorité où il est coché — s’impose : elle suit ses changements, la barre dit « Fixée » et un appui donne les noms. Les noms proposés pour l’équipe sont ceux des personnes sous contrat ce jour-là (à la validation, le jour choisi)."],
      ['Sur un ordinateur', "la liste passe à gauche, une ligne par parcelle avec ses deux gestes, et la fiche de la parcelle choisie s’ouvre à droite : sa forme, l’état de la tâche, les travaux de la campagne — une tâche désactivée sur la parcelle y est grisée, comme dans la fiche complète —, les derniers passages. Les flèches haut et bas passent d’une parcelle à l’autre, la touche V valide ; « Fiche complète » ouvre tout le reste."],
      ['Le numéro devant le nom', "est le rang de la parcelle dans la tournée que l’administrateur a choisie pour ce travail (roue crantée de la Vigne › Tournées). Il n’apparaît que si le travail suit une tournée et qu’il reste une parcelle à faire sur ce travail ; les parcelles se rangent alors dans cet ordre. L’équipe n’a rien à régler. Sur «\u00a0Toutes tâches\u00a0», l’encart «\u00a0Tournée définie pour\u00a0» ouvre d’un appui chaque travail qui en a une : seulement ceux de la campagne en cours où il reste une parcelle à faire."],
      ['Les tournées', "se règlent dans la roue crantée de la Vigne, par l’administrateur : un nom, l’ordre de toutes les parcelles du domaine, et les travaux qui la suivent — un travail n’en suit qu’une. On range en glissant la poignée, par le menu d’une parcelle (premier, monter, descendre, dernier, placer après), en touchant la carte dans l’ordre, ou d’un coup avec «\u00a0Ranger automatiquement\u00a0». Sur la barre de la tournée, «\u00a0Modifier\u00a0» ouvre celle du travail affiché. Une tournée enregistrée arrive chez l’équipe à sa prochaine ouverture de l’application. Une équipe du jour peut suivre sa propre tournée (Équipes du jour, sur l’Accueil). Quand le travail suit une tournée, le tri par proximité n’est proposé qu’à l’administrateur."],
      ['Onglet Carte', ": les contours viennent de votre export PAC ou d’un fichier KML."],
      ['L’anneau doré qui respire', "sur la carte marque la parcelle <b>commencée et pas finie</b> pour le travail affiché\u00a0: celle où «\u00a0Début\u00a0» a été touché sans validation. S’il n’y en a aucune, il se pose sur la <b>prochaine à faire</b>, le n°\u00a01 de la tournée enregistrée. Sur «\u00a0toutes\u00a0», c’est la priorité du moment. Plusieurs parcelles commencées ont chacune leur anneau, et rien ne s’affiche sur une période archivée."],
      ['La recherche', "accepte le nom du climat comme le lieu-dit."],
      ['Une parcelle arrachée', "sort des totaux mais reste dans l’historique. La déclarer arrachée valide aussi son <b>arrachage</b> (case cochée d’office), sauf si la date d’arrachage tombe avant la période en cours : elle passe alors « Arrachée » sans rien valider. Valider l’arrachage d’une vigne en place propose de la déclarer arrachée. Son avancement et sa fiche ne portent plus que l’<b>arrachage</b>, et plus rien du tout dans une période qui commence après son arrachage. Un passage d’un autre travail saisi après la date d’arrachage reste au journal mais ne compte plus, ni dans l’avancement ni dans le temps réel du Pilotage. Elle reste saisissable au journal pour son <b>arrachage</b>, en bas de la liste des parcelles, tant qu’elle est choisie pour la campagne."],
      ['L’arrachage en étapes', "quand l’administrateur l’a découpé (roue crantée, <b>Tâches</b>), la fiche de la parcelle montre une puce par étape : touchez-la pour la valider à sa date. Une étape <b>prestataire</b> se valide sans compter d’heures de l’équipe. L’avancement compte la part des étapes faites ; quand celles de l’équipe sont faites partout, <b>Ma part du chantier</b> passe au suivant. Au moment choisi, l’application propose de passer la parcelle en « Arrachée »."],
      ['Arrachage, désherbage manuel, effeuillage', "ne concernent que les parcelles <b>choisies pour la campagne</b>. L’administrateur les coche dans la roue crantée, <b>Tâches</b>, sur la ligne du travail, ou une par une dans la fiche de la parcelle. Une parcelle où le travail a déjà été saisi compte d’office. L’an prochain, la liste repart vide."],
      ['Une tâche qui ne se fait pas partout', "(une réparation, un pliage…) concerne toutes les parcelles, sauf celles où on la désactive <b>pour la période</b>. L’administrateur en désactive plusieurs d’un coup dans la roue crantée, <b>Tâches</b> : la ligne du travail ouvre la liste, tout y est coché, décochez celles qui ne la feront pas (« Tout décocher » quand il en reste peu à garder). Une seule se règle aussi depuis sa fiche, avec la croix. À la période suivante, toutes repartent concernées : l’hiver et le printemps peuvent avoir des parcelles différentes. Une parcelle où la tâche est commencée reste concernée. Désactiver la <b>Vendange</b> sur une parcelle veut dire qu’elle ne sera pas récoltée cette année : la Cave et le Revient le lisent aussi, et Le Cuvier ouvre la même liste depuis «\u00a0Encore sur pied\u00a0»."],
      ['Les pieds marqués', " : quand une tâche de repérage demande le compte (réglage de l’administrateur, le crayon de la tâche), « Valider » ouvre un pavé de gros chiffres : tapez le nombre de pieds marqués sur la parcelle, « Aucun pied à remplacer » se fait en un appui. "
        + "Ce compte devient les trous prévus de l’<b>entreplantation</b> : une parcelle comptée s’y valide d’un seul appui, une parcelle sans compte demande combien de pieds ont été plantés, une parcelle comptée à zéro n’a rien à planter. La fiche de la parcelle montre les chiffres : marqués, percés, plantés."],
      ['Valider pour l’équipe sans y être', "l’administrateur voit sa propre puce dans le groupe («\u00a0Moi\u00a0», «\u00a0Moi aussi dans les rangs\u00a0» sur la barre d’équipe)\u00a0: décochée, la validation reste signée de son nom mais ses heures ne vont pas à la parcelle. Le choix est retenu pour la tâche."],
      ['L’état du vignoble', "s’imprime depuis la roue crantée de la Vigne, bloc Documents : toutes vos parcelles sur une page, avec la surface, le cépage, la commune, l’avancement, le dernier travail, le dernier rendement — et la liste de ce qui reste à renseigner."],
      ['Le fichier Excel des parcelles', "se prend au même endroit : une ligne par parcelle, avec la surface, l’avancement, chaque tâche et le rendement du millésime choisi en hL/ha — mesuré ou estimé, c’est écrit à côté. Avant de le télécharger, vous choisissez l’ordre : par nom (A → Z ou Z → A) ou par rendement (le plus fort ou le plus faible d’abord). Une parcelle sans récolte part en fin de liste."],
      ['L’arrachage au prestataire', "dans la liste filtrée sur l’arrachage : dès que l’équipe a fait toutes ses étapes sur une parcelle, celle-ci quitte « À faire » — la suite est au prestataire. « Toutes » la montre, marquée « Au prestataire » ; l’étape du prestataire se valide depuis sa fiche. Elle ne compte plus comme commencée sur la carte de l’Accueil, l’anneau des cartes ni la tournée."]
    ]
  },
  journal: {
    ico: 'journal', titre: 'Journal', ancre: 'vigne',
    points: [
      ['Chaque tâche validée', "écrit une ligne ici, avec la parcelle, la personne et la durée."],
      ['Une équipe au travail', "tient en une seule entrée : tous les noms y figurent, et le travail se partage entre eux."],
      ['Corriger l’équipe', " (administrateur) : sur une validation, le bouton « Équipe » dit qui a vraiment travaillé — celui qui a validé peut rester décoché, il reste l’auteur de l’entrée. « Toute la journée » corrige d’un coup les validations de la même tâche, le même jour ; l’entrée garde la trace de la correction. La liste propose les personnes sous contrat le jour de l’entrée, plus celles déjà notées ; les cochées sont en vert."],
      ['Les filtres', "par parcelle et par tâche se cumulent ; la pastille rappelle ce qui est actif."],
      ['Une saisie faite hors réseau', "repart toute seule au retour du signal, et se fusionne avec ce que les autres ont saisi entre-temps : rien n’est écrasé."],
      ['Le journal en fichier', "se prend dans la roue crantée de la Vigne, bloc Documents."]
    ]
  },
  tracteur: {
    ico: 'tracteur', titre: 'Tracteur', ancre: 'tracteur',
    points: [
      ['La tarière préremplie', " : une activité qui alimente les trous de l’entreplantation propose, pour chaque parcelle cochée, le nombre de pieds marqués au repérage — confirmez, ou corrigez avant de valider."],
      ['À deux', " : pour la tarière, l’ensemencement et l’engrais, la nouvelle session propose un <b>coéquipier</b>, choisi avec l’activité ; il apparaît dans la fiche de la session. L’admin règle quelles activités se font à deux (réglages du tracteur, « Se fait à deux »)."],
      ['Pourquoi ?', " : dans la fiche d’une session, la pastille <b>« Pourquoi ? »</b> sous l’activité explique pourquoi on la fait : rognage, labour, tarière, engrais, ensemencement, traitements."],
      ['Sur un ordinateur', "la session en cours, les compteurs et la liste sont à gauche ; à droite, le parc (au garage, révision dépassée ou proche d’abord) et la cuve de GNR, avec les heures de travail du mois. Toucher une session ouvre sa feuille, comme au téléphone ; toucher un tracteur ouvre son entretien. Dans l’Entretien, les machines et la cuve de GNR passent à gauche, la révision et les derniers contrôles à droite."],
      ['Le compteur d’heures', "avance tout seul entre deux relevés : le dernier relevé, plus les heures notées par les sessions (chrono, sinon barème), corrigées par l’écart appris à chaque relevé — la route et le ralenti tournent au cadran sans être notés ; « env. » dit qu’il est estimé. Une fois par jour et par tracteur, en refermant la feuille après y avoir coché, ou en terminant, Ma Vigne demande le chiffre du cadran (« Pas devant le tracteur » repose la question au geste suivant) ; au plein — le bouton « Plein » comme la fiche « Plein fait » —, il est demandé à chaque fois pour un tracteur suivi ; « Relever », dans l’Entretien, le note quand on veut. Plus bas que le dernier relevé, ou impossible dans le temps écoulé : refusé ; beaucoup plus que prévu : à confirmer. Un compteur changé se corrige au crayon de « Prochaine révision ». Une révision dépassée s’écrit « dépassée de n h »."],
      ['La révision', "se règle une fois au crayon de « Prochaine révision » : toutes les N heures et/ou tous les N mois, au premier atteint. « Révision faite » demande le compteur et calcule la suivante — le compteur plus l’intervalle, la date plus les mois ; sans intervalle, la carte dit de le régler. Pour démarrer une session sur un tracteur dont la révision est à 50 h ou moins, à 14 jours ou dépassée — ou sans vrai relevé depuis 7 jours —, le compteur est demandé d’abord. Un tracteur sans compteur, sans révision ni intervalle n’est jamais interrogé."],
      ['Le compteur sur ordinateur', "dans l’Entretien, sous la révision : ce que Ma Vigne a appris (l’écart de la route et du ralenti, le rythme au compteur sur 4 semaines, et un repère de révision en jours ouvrés, du lundi au vendredi, jours fériés sautés), la courbe des relevés jusqu’à aujourd’hui, et les dix derniers relevés avec leur écart à l’estimé. L’administrateur écarte un chiffre faux : il reste écrit, barré, mais ne compte plus ; « Rétablir » le remet. « Corriger » le remplace par le bon, entre le relevé d’avant et celui d’après."],
      ['Les autres entretiens', "à côté de la révision — vidange de pont et boîte, filtres, graissage —, l’administrateur les ajoute dans l’Entretien : un nom, toutes les N heures et/ou tous les N mois, la dernière fois. Chacun dit son échéance au premier atteint : rouge à un dixième de l’intervalle ou à 14 jours, orange au quart ou à 30 jours. « Fait » demande le compteur et calcule le suivant ; « Révision faite » propose de cocher ceux faits en même temps. Le plus urgent remonte dans le parc, et compte pour le compteur demandé au démarrage."],
      ['Heures et GNR d’une session', "les heures viennent du chrono quand il a mesuré la parcelle, sinon du barème de l’activité (h/ha × surface) ; la fiche dit lesquelles. Le GNR est ces heures fois la consommation réglée dans Réglages, 6 L par heure tant qu’elle ne l’est pas — la même valeur que le Pilotage. La bande du haut fait le total de la saison."],
      ['Une session \u00ab Amendement \u00bb', "coche la t\u00e2che \u00ab Amendement \u00bb de chaque parcelle faite, marqu\u00e9e \u00ab faite au tracteur \u00bb dans le journal. Le temps compt\u00e9 est celui de la session, pas une journ\u00e9e d\u2019\u00e9quipe. L\u2019amendement lui-m\u00eame se pr\u00e9pare dans Phyto \u203a Fertilisation."],
      ['Onglet Sessions', ": le travail fait avec la machine. Onglet Entretien : révisions, réparations, appoints de cuve."],
      ['Le parc', "sur un ordinateur, dans la colonne de droite, rangé par urgence ; au téléphone, dans l’onglet Entretien, où l’on choisit la machine en haut."],
      ['Une session en cours', "reste signalée en haut tant qu’elle n’est pas fermée."],
      ['Toucher le nom d’un conducteur', "filtre ses sessions. Pour l’administrateur, le petit crayon juste à côté ouvre sa fiche : formé, en formation, suspendu."],
      ['Faire défiler la liste ne coche rien', ": seule compte une parcelle touchée doigt immobile. Toucher l’écran pour arrêter une liste qui défile ne coche rien non plus, et deux appuis coup sur coup n’en font qu’un — la liste vient de se réordonner, la parcelle sous le doigt n’est plus la même. Décocher une parcelle demande une confirmation, parce que cela efface le temps mesuré ou la valeur saisie dessus."],
      ['Reprendre la mesure', ": chrono allumé, toucher une parcelle déjà faite propose de la reprendre — le temps de cette fois s’ajoute à celui d’avant. Interrompre une parcelle garde le temps déjà passé, et rouvrir la session ou l’appli pendant une mesure ne l’arrête plus. Commencer une mesure dans une autre session ferme celle restée ouverte."],
      ['Historique des gestes', "en bas de la session, pour l’administrateur : chaque début, fin, reprise, pause et décoche, avec l’heure, gardés trois jours. « Rétablir » remet une parcelle décochée telle qu’elle était."],
      ['Toucher la parcelle où vous commencez', "démarre la mesure : il n’y a rien à appuyer avant. « J’ai fini » la ferme. Toucher directement la parcelle suivante enchaîne sans compter de déplacement, et un appui long ajoute une parcelle à celle en cours — leur temps se partage à la surface. Verrouiller son téléphone ne perd plus rien : la mesure est retrouvée à la réouverture, même des heures après."],
      ['Trois compteurs, pas un', ": le temps passé dans les parcelles, le temps hors parcelle — trajets, ravitaillement, réglage, qui sont du travail eux aussi — et la pause déjeuner, qui n’en est pas. Le bouton pause interrompt sans refermer la parcelle en cours."],
      ['Ce chrono ne fait pas votre journée de travail', ": il mesure le temps passé dans les parcelles, pour budgéter les travaux. Le lavage, les niveaux et le plein n’y sont pas."],
      ['Une mesure aberrante est écartée', ": très au-dessus ou très en dessous du barème, la parcelle est cochée au barème sans temps constaté, et l’écran dit pourquoi. C’est le TOTAL de la parcelle qui est jugé, toutes les fois additionnées ; une fois aberrante à elle seule — chrono oublié plus de 12 heures — ne compte pas et n’efface pas ce qui était déjà mesuré juste."],
      ['Les parcelles se rangent par distance', "à celle où vous êtes ; une tournée fixée par le chef passe devant. Les distances viennent des contours de vos parcelles, jamais d’un suivi de votre position."],
      ['Le chrono s’active par le domaine', ": la roue crantée du Tracteur, en tête des activités. Sans lui, le barème h/ha prend le relais et rien ne se mesure."],
      ['L’appoint de cuve GNR', "remonte le niveau et recalcule le prix du litre en moyenne pondérée."],
      ['Le carnet d’entretien', "s’imprime machine par machine depuis la roue crantée du Tracteur, bloc Documents."],
      ['La roue crantée', "en haut à droite réunit le parc, les activités et leur barème h/ha, le chrono, et le carnet d’entretien. Administrateur seulement."],
      ['Rôle Tractoriste requis', "pour écrire : sans lui, l’écran passe en consultation seule."]
    ]
  },
  phyto: {
    ico: 'eprouvette', titre: 'Phyto', ancre: 'phyto',
    points: [
      ['Sur un ordinateur', "toucher un traitement le choisit : sa fiche s’ouvre à droite avec les mentions du registre — produit, AMM, type, date, dose, parcelles, opérateur, délais de réentrée et avant récolte, ZNT. « Ouvrir le traitement » mène au détail habituel, pour le modifier. « Saisir un traitement » est un bouton au-dessus de la liste. Dans le Catalogue, toucher un produit ouvre de la même façon sa fiche E-Phy à droite : statut, délai de rentrée, substance, mentions, usages vigne."],
      ['Le catalogue produits', "vient d’E-Phy (ANSES) et se met à jour tout seul chaque semaine."],
      ['Un traitement', "= des produits, les parcelles cochées et un conducteur. La surface se calcule seule."],
      ['Le bouton rond en bas \u00e0 droite', "ouvre un nouveau traitement sur l\u2019onglet Registre, un nouvel amendement sur l\u2019onglet Fertilisation (administrateur)."],
      ['Le délai de rentrée', "se déduit des mentions de danger du produit : la parcelle traitée se ferme d’elle-même jusqu’à son heure de libération."],
      ['Le registre des traitements sort sous deux formes', "depuis la roue crantée en haut à droite : le PDF à présenter, et un fichier tableur avec une ligne par produit et par parcelle. Ce second format est celui qui sera attendu en contrôle à partir du 1er janvier 2027."],
      ['L\u2019onglet Fertilisation', "tient le registre des amendements et engrais. Le bouton rond (administrateur) ouvre un amendement en cinq \u00e9tapes conseill\u00e9es\u00a0: le produit et sa composition (la recherche trouve d\u2019abord vos produits d\u00e9j\u00e0 saisis, avec les teneurs de chaque campagne, puis E-Phy, qui dit ce que l\u2019autorisation permet\u00a0: Vigne, Toutes cultures, Culture non pr\u00e9cis\u00e9e ou Pas la vigne\u00a0; normes en un geste\u00a0; la formule \u00ab\u00a04-10-1\u00a0\u00bb remplit azote, phosphore et potasse\u00a0; \u00ab\u00a0Ce que c\u2019est\u00a0\u00bb pose le type nitrates), les parcelles (une r\u00e8gle coche celles dont le rendement de la vendange est sous un seuil, sauf des appellations), le passage tracteur, la semaine pr\u00e9vue, puis ce qui s\u2019ajoute. Les sacs de chaque parcelle, la commande, l\u2019azote par hectare et le temps tracteur se calculent seuls."],
      ['Le temps utile', "est la part du temps o\u00f9 le semoir s\u00e8me vraiment dans le rang. Le reste : demi-tours, recharges de sacs, traverses. 75 % = 3 heures de semis sur 4 heures dans la parcelle. Avec la vitesse et l\u2019\u00e9cartement, il donne le bar\u00e8me en heures par hectare."],
      ['La date d\u2019\u00e9pandage', "ne se saisit pas : c\u2019est le jour o\u00f9 la parcelle est valid\u00e9e, dans une session tracteur de l\u2019activit\u00e9 \u00ab Amendement \u00bb ou en validant la t\u00e2che. La session coche aussi la t\u00e2che, marqu\u00e9e \u00ab faite au tracteur \u00bb : le Pilotage ne recompte pas ces heures. Sans l\u2019un ni l\u2019autre, l\u2019administrateur la pose \u00e0 la main sur la ligne de la parcelle."],
      ['Ce qu\u2019un contr\u00f4le va demander', "en bas de l\u2019onglet : les parcelles en zone vuln\u00e9rable, leur \u00eelot PAC et leur sol (touchez le nom d\u2019une parcelle pour les poser), l\u2019analyse de sol au-del\u00e0 de 3 ha, le fractionnement de l\u2019azote min\u00e9ral. La fiche d\u2019une parcelle prend aussi son ann\u00e9e de plantation. Le cahier s\u2019imprime ou sort en fichier tableur au m\u00eame endroit."],
      ['Le budget cuivre', "cumule le cuivre métal sur sept ans glissants face au plafond. Il informe, il ne bloque rien. Sa synthèse s’imprime depuis la roue crantée."],
      ['Accès', ": rôle Admin ou Tractoriste."]
    ]
  },
  planning: {
    ico: 'calendrier', titre: 'Planning', ancre: 'planning',
    points: [
      ['Deux onglets', ": Le mois, la grille de toute l’équipe. Les gens, une ligne par salarié et sa fiche — sur ordinateur, la fiche s’ouvre à droite de la liste, sur la première personne ; toucher une autre ligne la change. Un salarié qui n’est pas administrateur a les deux siens : Mon mois, où il arrive comme avant, et L’équipe."],
      ['L’équipe, côté salarié', "montre qui est là, jour par jour, sur le mois en cours : présent ou absent, jamais le motif — même un congé s’affiche « Abs » —, ni les heures, l’écart ou les congés des autres. Une absence d’une partie de la journée compte « présent ». Sa propre ligne est en tête ; la ligne Présents compte qui est là parmi ceux attendus ce jour-là (les équipes collectives n’y entrent pas). Lecture seule."],
      ['La roue crantée', "en haut à droite ouvre le cadre de l’année — modèles de semaine, coupure, convention, règle des congés, sort des heures sup — et les relevés à imprimer. Administrateur seulement."],
      ['Changer d’année', "se fait par les onglets au-dessus de la grille. Tant qu’aucun modèle n’est enregistré pour une année, sa grille est un report du modèle intégré, replacé sur les bons jours de la semaine. Un bandeau le dit et compte les jours qui restent à poser : une année n’a pas les mêmes semaines qu’une autre, et rien n’est ajouté à votre place."],
      ['Toucher une case', "la coche. Toucher le numéro du jour, en haut, coche toute l’équipe ce jour-là ; toucher un nom coche sa ligne ; toucher « Salarié », dans le coin, coche tout ce qui est affiché. Un deuxième appui décoche."],
      ['La barre du bas', "dit qui est coché et à quelles dates, puis propose ce qui s’applique vraiment à cette sélection — heures, congé, absence, cave, récup, chaleur, effacer. Une case ou trente, c’est le même geste et la même fiche."],
      ['Une journée de cave', "se marque sur les cases de ceux qui étaient en cave : « Cave » dans la barre, puis la journée, le matin (de la prise à la coupure) ou l’après-midi (de la reprise à la fin). La case garde ses heures — paie, relevé et annualisation ne changent pas — et porte une bande au pied : toute la largeur pour la journée, la moitié gauche pour le matin, la droite pour l’après-midi. Le Pilotage ne verse plus ces heures aux parcelles validées, et la fin prévue des travaux en tient compte, même pour un jour à venir. Pour la semaine passée, « ‹ » en haut de la grille. « Retirer la cave » défait. Administrateur seulement."],
      ['Sur une période plus longue', "que la vue affichée, deux boutons au-dessus de la grille posent des congés ou des horaires chaleur du jour au jour, pour plusieurs salariés."],
      ['Une journée écourtée', "par le salarié (personnel, injustifiée, retard) se rattrape d’abord dans la semaine, par les heures en plus — avant les journées du domaine ; le reste se reprend sur la récup et les heures sup du mois, heure pour heure : 1 h manquée = 1 h de récup en moins, prise sur les heures à 50 % d’abord. Ce qu’elles ne couvrent pas est retenu sur le salaire. Écourtée ou décidée par le domaine, elle se reprend de la même façon, mais ce qui manque va au compteur des heures à rattraper, que les prochaines heures sup comblent : jamais de retenue. Une absence sans motif compte comme injustifiée. Un arrêt de travail, une formation, un événement familial, un congé sans solde ou une mise à pied disciplinaire ne retirent rien. Ces règles valent à partir de septembre 2026 ; les mois d’avant gardent la leur."],
      ['Une absence sur une partie de la journée', "se note dans Absence, « Une partie seulement » : de telle heure à telle heure, ou un raccourci — le matin, l’après-midi, arrivé en retard, parti plus tôt — puis le motif. L’écran calcule les heures manquées, coupure déduite, dessine la journée et dit avant d’enregistrer ce qu’elles retirent du compteur. Un horaire raccourci dans « Travaillé » demande aussi son motif, sauf les horaires chaleur et les jours d’échange."],
      ['Une mise à pied disciplinaire', "se note sur les jours de la sanction : cochez les cases, Absence, motif «\u00a0Mise à pied disciplinaire\u00a0» — toujours des journées entières. Le contrat est suspendu ces jours-là : ils ne sont ni payés ni rattrapés, et ne touchent ni à la récup ni aux heures sup du mois, qui restent dues ou vont en récup comme d’habitude ; le plafond annuel baisse d’autant. Dans Pour la compta, une ligne à son nom donne les heures du planning à retirer et les dates ; le salaire de base dit alors «\u00a0Aucune autre retenue\u00a0». Les collègues voient «\u00a0absent\u00a0», jamais le motif."],
      ['La fiche d’un salarié', "quatre onglets. Résumé : le cadre Pour la compta — une ligne par chose que la compta saisit : salaire de base (une retenue de tant d’heures, ou « Aucune retenue », et pourquoi), heures à payer en trois cases, une par taux — à 25 %, à 50 %, à 100 % —, chacune avec ce qui vient du mois et le mois d’origine des heures prises au compteur, et la majoration seule d’un dimanche ou d’un férié prévu à part dans sa case —, congés payés, arrêt de travail, acompte, et à part un congé sans solde ou une mise à pied à retirer ; « aucun » quand il n’y a rien —, puis ce qui reste au salarié (récup, heures à rattraper) et le mois en heures, qui s’additionne (tout le mois, les jours à venir aux heures du planning), la case « demande à être payé » et où vont les heures sup. Jours : semaine par semaine, prévu et fait côte à côte, ce que chaque absence devient, les heures sup du jour et les alertes de la semaine. Compteur : le temps de récup du solde d’avant au solde d’après, les heures à rattraper, et l’année. Congés et acomptes : le solde de congés et les avances en euros. Le mois se change sans fermer la fiche, et le bouton Relevé édite le PDF."],
      ['Les heures sup et la récup', "les heures sup se comptent à la semaine, du lundi au dimanche : ce qui est fait au-delà du planning de la semaine, une fois les heures manquées de la semaine rattrapées — celles du salarié d’abord, puis celles du domaine. Les huit premières sont à 25 %, les suivantes à 50 %, et donnent 1 h 15 ou 1 h 30 de récup par heure. Une heure en plus qui rattrape une heure manquée de la même semaine n’est pas une heure sup : elle compte heure pour heure, sans majoration — sauf un dimanche ou un férié non prévu, qui compte toujours en entier, à son taux (4 h de dimanche = 6 h de récup, ou 4 h payées à 50 %) ; l’absence se reprend alors sur la récup. Une semaine appartient au mois où elle finit. Un congé payé, une récup, une formation sont des absences payées : ils ne se lisent jamais comme des heures manquées. Les absences passent avant un paiement : on ne paie que ce qui reste une fois les absences couvertes, si bien qu’un relevé porte une retenue sur salaire ou des heures sup à payer, jamais les deux."],
      ['Payer des heures sup', "dans le Résumé de la fiche, cochez « demande à être payé » et indiquez le nombre d’heures. Elles se prennent d’abord sur celles au taux le plus fort — 50 %, dimanche, férié —, puis sur celles à 25 %, et sortent de la récup. On peut payer au-delà des heures du mois, jusqu’à tout ce que le compteur contient encore : les heures du mois d’abord, puis les plus anciennes du compteur. Les absences, la récup prise et les heures à rattraper passent d’abord : on ne paie que ce qui reste, et « Tout le mois » comme « Tout le compteur » s’arrêtent là. La case existe quel que soit le mode du domaine. Le nombre d’heures est un total : si les heures sup du mois baissent ensuite, le reste se prend au compteur, la demande ne fond pas. « Pour la compta » donne alors ses trois cases, toujours les mêmes — à 25 %, à 50 %, à 100 % —, chacune avec ce qui vient du mois et de quel mois viennent les heures du compteur, et un contrôle qui additionne jusqu’à la demande ; des heures sans taux connu (report d’avant Ma Vigne) restent sous « À vérifier » ; et l’onglet Compteur montre les heures sup restantes à payer, taux par taux, avec leur décompte et leur équivalent en récup."],
      ['Les heures sup d’avant septembre 2026', "jusqu’à fin août 2026, le compteur comptait les heures sup au mois, sans taux : 1 h sup = 1 h de récup. Celles qui étaient encore au compteur le 1er septembre — ni payées, ni prises — ont pris leur majoration ce jour-là, comme les heures faites depuis : 1 h 15 pour une heure à 25 %, 1 h 30 pour une heure à 50 %. Leur taux vient d’une relecture de chaque semaine avec la règle d’aujourd’hui ; la compta le confirme. Le gain apparaît une fois, en septembre, dans le compteur (« Majoration des heures sup d’avant septembre ») et dans le détail de l’année, où les mois d’avant portent un astérisque. Les paies déjà faites ne changent pas. En mode payé, un dimanche ou un férié encore au compteur prend aussi son taux ce jour-là : sa majoration voyage avec l’heure. En mode récup, sa majoration est entrée à part en repos, le mois même (un dimanche de 8 h ajoute 4 h), et un tableau les liste mois par mois. Le report d’avant Ma Vigne reste à 1 h pour 1 h : on n’en connaît pas les semaines."],
      ['Figer le mois', "à l’envoi de la feuille à la compta, le bouton Figer de la fiche (Résumé, carte Envoi à la compta) fige ce qui est payé et retenu. Ce qui change ensuite dans le mois — une absence, des heures en plus, un motif corrigé — passe sur le mois suivant : à retenir (repris d’abord sur la récup et les heures sup), à rendre, ou une majoration à payer. Le paiement d’un mois figé ne se modifie plus ; Défiger le rouvre."],
      ['Pour la compta', "en tête du Résumé de la fiche et du relevé : une ligne par chose que la compta saisit — salaire de base, heures sup à payer, congés payés, arrêt de travail, acompte, et à part un congé sans solde ou une mise à pied à retirer —, toujours dans le même ordre ; « aucun » veut dire qu’il n’y a rien. Les heures sup s’y écrivent en heures brutes, avec leur taux : pour 1 h sup à 25 %, on déclare 1 h à +25 %, jamais 1 h 15 — la compta majore elle-même. Le compteur, lui, compte toujours en temps de récup : des heures payées sortent du compteur et se déclarent en heures brutes. Une heure sup un dimanche ou un jour férié prend le taux le plus fort, une seule fois. Les heures y sont rangées en trois cases — à 25 %, à 50 %, à 100 % —, comme la compta les saisit ; la majoration seule d’un dimanche prévu y est à part, à préciser à l’envoi. Un mois figé montre ce qui est parti, pas un recalcul."],
      ['Présence, coupure, heures dues', "trois nombres qui se ressemblent et ne disent pas la même chose. La ‹‹ présence ›› va de l’arrivée au départ. La ‹‹ coupure ›› est le temps non travaillé au milieu : sa durée et son heure sont fixées par le domaine, dans la roue crantée du Planning, ce n’est pas un moment que chacun choisit. Les ‹‹ heures dues ›› sont ce qui part en paie et alimente le compteur des 1 607 h. Une journée de 09:00 à 16:00 avec une heure de coupure fait 7 h de présence et 6 h dues."],
      ['Le planning de l’année', "s’imprime depuis le même endroit : le rythme sur douze mois, avec les heures de prise et de fin de service et la coupure déjeuner. Une page par modèle de semaine — c’est le document qu’on remet à l’équipe pour l’année à venir. Pour l’année en cours, il ne nomme que les personnes sous contrat d’aujourd’hui au 31 décembre, fiches inactives exclues, et l’écrit dans son en-tête ; une année passée garde toute son équipe. Une variante nominative sort la même grille pour une seule personne, bornée à ses contrats, avec ses jours de formation et ses congés déjà posés."],
      ['Le relevé mensuel', "s’imprime depuis la roue crantée du Planning, bloc Documents. C’est un relevé d’heures, pas un bulletin de paie."],
      ['Le relevé d’un seul salarié', "s’imprime au même endroit, en choisissant la personne et le mois : son mois jour par jour, ses contrats avec leurs coupures, ses congés payés, son compteur d’heures et son annualisation, avec les signatures. Le bouton PDF de sa fiche sort exactement le même document. À partir de septembre 2026, il commence par le cadre Pour la compta, puis chaque jour en colonnes Prévu, Fait et Absence ; une case note la date d’envoi à la compta. Il compte tout le mois, les jours à venir aux heures du planning, pour partir à la compta la dernière semaine ; il porte une retenue sur salaire ou des heures sup à payer, jamais les deux. Les anciens salariés y figurent aussi, marqués comme tels : un relevé est un document d’histoire."],
      ['Un ancien salarié', "reste compté dans les mois où il était sous contrat. Reculez d’un mois dans Les gens : il reprend sa ligne dans la liste, avec ses heures, et il disparaît de la section Anciens salariés ce mois-là. Passer une fiche en Inactif ferme son accès à l’application, cela n’efface aucune heure déjà faite."],
      ['Dimanches et jours fériés travaillés', "se majorent tout seuls — 50 % le dimanche, 100 % un jour férié, taux modifiables dans la roue crantée du Planning. Seules les heures réellement faites comptent : un férié chômé reste payé sans majoration, un congé ou une récup ne majorent rien, et un férié qui tombe un dimanche prend le taux le plus fort, jamais les deux — de même qu’une heure sup faite un dimanche. Non prévus au planning, ils comptent toujours en entier, en heures sup à leur taux, même quand la semaine a une absence. Prévus au planning, seule leur majoration est due — sauf si le domaine a choisi « Toujours des heures sup » dans la roue crantée : alors toutes leurs heures sont des heures sup, avant septembre aussi. Majoration seule : elle part en paie si vos heures sup se paient, au compteur si elles se récupèrent. En paie, elle couvre d’abord les absences du mois, les heures à rattraper et la récup prise : seul ce qu’il en reste se paie, et une feuille ne porte jamais une retenue à côté d’une majoration à payer. Elle ne compte pas dans les 1 607 h."],
    ['Taux horaires, acomptes, heures sup et motifs d’absence', ": administrateurs seulement. Les taux ne sont jamais enregistrés sur un appareil ; le téléphone d’un salarié ne reçoit que ses propres jours, et l’équipe sans motif."]
    ]
  },
  cave: {
    ico: 'verre', titre: 'Cave', ancre: 'cave',
    points: [
      ['Qui était là', " : dans le relevé d’une cuve du Cuvier — ou dans « Qui ? » de la tournée — les personnes présentes au travail du chapeau (remontages, pigeages) le voient sur leur Accueil, avec le pourquoi du geste."],
      ['Les intervenants le voient', " : ceux que vous cochez dans <b>Nouvelle opération</b> voient sur leur Accueil que leur présence est notée, avec le pourquoi du geste."],
      ['Pourquoi ?', " : dans <b>Nouvelle opération</b>, la pastille <b>« Pourquoi ? »</b> sous les types explique le geste choisi : ouillage, soutirage, soufre, traitement, filtration, dégustation, analyse."],
      ['Le Chai sur un ordinateur', "toucher une cuvée la choisit : sa fiche s’ouvre à droite de la liste — ouillage, analyses, soutirage, opérations, et ses boutons. Après une opération, la fiche se met à jour sur place."],
      function () {
        return _mvAideSections('#cave-sec-tabs .mvu-tab', 'sections',
          "Aujourd’hui dit ce qui presse, Le Cuvier suit la vendange, Le Chai suit l’élevage, Le Millésime raconte le vin.");
      },
      ['Aujourd’hui', "est l’écran d’arrivée de la Cave. En tête, le verdict dit ce qui ne peut pas attendre — dans l’ordre : une fermentation qui ralentit ou une température haute, une malo bloquée, des cuves sans relevé depuis hier ou avant, du raisin à rentrer, des fûts à ouiller, une malo finie à soutirer, une dose de SO\u2082 programmée cette semaine, des fûts en fin de vie —, puis pourquoi, puis ce qui suit. Dessous, « À faire aujourd’hui » : une ligne par cuve ou cuvée et, à droite de son nom, un bouton par geste (Relever, Ouiller, Soutirer, Doser…) ; au téléphone, deux gestes passent sous les raisons. Une alerte de cuve (fermentation qui ralentit, température haute, sucres du labo qui stagnent) se contrôle par un relevé : son « Relever » ouvre la fenêtre du relevé, et une cuve qui a aussi un relevé en retard n’en a qu’un. « Déjà fait aujourd’hui » reprend les relevés et opérations du jour, « En cave aujourd’hui » qui est marqué au Planning, et « Faire la tournée » ouvre la tournée du Cuvier. « À surveiller » : une macération plus longue que prévu, une fin de fermentation proche, les fûts en fin de vie. En haut, le sommaire (Ce qui presse · À faire · Cuves · Fûts · À surveiller · Relevés du jour) reste sous l’en-tête quand on descend et mène à chaque partie. Sur ordinateur, trois colonnes : le sommaire, la page, et la fiche du contenant choisi dans « Ce qui presse » — ses raisons, sa densité ou ses fûts, ses gestes. Puis les quatre semaines en calendrier : touchez un jour pour son détail. Entre les deux, « Le Cuvier » (une ligne par cuve suivie : état, courbe de densité, dernier relevé et température, fin estimée) et « Le Chai » (une ligne par cuvée : fûts, jauge d’ouillage, malo, soutirage) — le Cuvier d’abord pendant les vendanges — et tout en bas « Derniers gestes », sur dix jours. Un ouillage qui tombe un samedi ou un dimanche est rappelé le vendredi, un jour férié la veille. Une cuve en macération à froid n’est pas une fermentation : sa densité stable ne déclenche aucune alerte."],
      ['Les quatre chiffres du haut', "sont ceux de la cave entière, les mêmes sur les quatre onglets : hL en cuve (une estimation d’après les kilos tant que rien n’est décuvé, marquée ≈), fûts en vin, gestes à faire cette semaine (une fin de fermentation estimée n’en est pas un), tonnes rentrées. La ligne sous la bande dit sur quel millésime ils sont calculés. Le filtre millésime du Chai agit sur ses quatre onglets — cuvées, bouteilles, labo, journal — mais pas sur la bande."],
      ['La roue crantée', "en haut à droite réunit, en quatre sections (Le Cuvier, Le Chai, Appellations, Documents — une à la fois, la navigation en haut au téléphone, à gauche sur ordinateur ; une ligne par réglage, « Modifier » ouvre sa fenêtre et l’enregistre seul), ce qu’on règle une fois l’an : les réglages du Cuvier (poids par caisse, rendement jus, base du rendement, correction d’un poids déjà saisi, fourchette de maturité des rouges et des blancs, clients vrac), ceux du Chai (alerte d’ouillage, contenance d’un fût, convertisseur SO\u2082, parc à cuves), les appellations (leurs plafonds, le rattachement des parcelles, et pour chacune son minimum de maturité des rouges et des blancs), et les documents de la cave. Aucun onglet du quotidien ne porte plus de réglage."],
      ['Les onglets du Cuvier', "suivent la vendange dans l’ordre où elle se fait : Maturités à la vigne, Récoltes, Cuves, puis Tournée — le geste quotidien, en bout de chaîne. « Cuves » est l’ancien onglet « Cuvier » ; « Maturités » est l’ancien « Analyses » — ce sont les contrôles de maturité à la vigne, à ne pas confondre avec les analyses labo du Chai. On arrive toujours sur « Cuves » : on n’atterrit pas dans un écran de saisie."],
      ['Les Maturités', "suivent le sucre à la vigne avant la vendange. En haut : la vendange choisie (une vendange passée se relit à la date de sa dernière mesure), « Noter des mesures » et, sur ordinateur, « Imprimer le contrôle ». Puis « Où en est la maturité » : la moyenne du domaine, des rouges et des blancs, pondérée par la surface, sur les mesures de la fenêtre choisie (7 jours, 14 jours ou toute la vendange) ; une tuile touchée filtre tout l’écran, et le « i » dit ce que le chiffre est et ce qu’il n’est pas. Puis l’ordre de maturité : une ligne par parcelle, de la plus avancée à la moins avancée, sur une même échelle, avec sa vitesse et l’âge de sa mesure ; la bande verte est la fourchette visée de sa couleur, le trait rouge le minimum de son appellation (Appellations & plafonds), le trait pointillé la moyenne. Les parcelles mesurées avant la fenêtre sont hors moyenne ; les jamais mesurées et les déjà rentrées sont repliées. Au téléphone, « Ordre » et « Courbes » alternent ; sur ordinateur, les courbes sont à droite. Toucher une parcelle ouvre sa fiche (à droite sur ordinateur) : dernière mesure, vitesse, rang, repères, courbe et mesures — la corbeille supprime une mesure. « Noter des mesures » ouvre une seule feuille : la date, l’unité du réfractomètre, toutes les parcelles sur pied ; on remplit celles qu’on a mesurées et on enregistre tout d’un coup. Une valeur hors des plages plausibles est signalée « à vérifier »."],
      ['Les Récoltes', "se lisent sur la même vendange que les Maturités. Quatre chiffres : les parcelles rentrées (sur celles à récolter), le rendement moyen pondéré par la surface (avec l’an passé sur les mêmes parcelles), le récolté et l’estimé en cuve. Puis le rendement de chaque parcelle, la plus proche de son maximum en tête : la barre est le rendement — une valeur quand le volume est mesuré (retour du client, volume logé), une fourchette quand il est estimé au ratio —, le trait rouge le maximum de l’appellation, le rond creux l’an passé, le pointillé la moyenne. Ce sont les chiffres du Millésime › Rendements. « Encore sur pied » suit, la plus mûre en tête. Le journal range les pesées par jour, avec leurs destinataires et leur état sanitaire. Toucher une parcelle ouvre sa fiche (à droite sur ordinateur) : rendement, récolté, en cuve, historique des vendanges, pesées — « Modifier » rouvre une pesée —, et « Voir sa maturité » pour une parcelle encore sur pied."],
      ['Lire un relevé sur la courbe', "un appui sur la courbe de fermentation ouvre une étiquette : la date, la densité à 20 °C, la température, les pigeages et remontages, l’opération et la note de ce jour-là. Toute la colonne au-dessus du point répond — inutile de viser. Un appui à côté la referme. La liste des relevés, sous le graphe, reste la source complète : c’est elle qu’un lecteur d’écran lit, l’étiquette est une commodité au doigt."],
      ['La tournée', "est l’écran de la main gauche, au milieu du cuvier : toutes les cuves en fermentation l’une sous l’autre, deux champs par cuve. La touche « Suivant » du clavier enchaîne température, densité, cuve suivante sans jamais refermer le clavier, et le champ visé remonte au centre de l’écran. La ligne passe au vert dès que les deux chiffres y sont ; la barre du haut dit combien de cuves restent. Filtrez sur « Reste à faire » pour ne plus voir que celles-là."],
      ['Ce que la tournée écrit', "un relevé par cuve et par jour, le même objet que « Saisir une mesure » — corrigible au crayon depuis la cuve, courbe comprise. Elle met à jour le relevé du jour au lieu d’en créer un second. Un champ laissé vide veut dire « je n’ai pas saisi », jamais « efface » : pour retirer une valeur, passez par « Saisir une mesure », qui reconstruit le relevé en entier."],
      ['Les compteurs P et R', "pigeage et remontage. Un appui ajoute un, un appui long en retire un. Ils se posent sur le relevé du jour, comme dans la fiche de mesure. Le nom de qui fait la tournée se choisit en haut à droite et part sur chaque relevé : c’est ce qui répond à « qui a pigé ? » trois semaines plus tard."],
      ['L’intervention groupée', "le bouton « Intervention groupée », en bas de la tournée à côté de « Terminer la tournée » : une opération, les cuves retenues (ou « Toutes »), une dose. Chaque cuve reçoit sa propre opération, calculée sur SON volume — jamais sur un volume commun. Chacune se corrige ensuite depuis sa cuve, comme si elle avait été saisie à la main."],
      ['La tournée s’enregistre toute seule', "une seule fois, une seconde après votre dernière frappe, pas à chaque chiffre tapé. Un « Enregistré » discret passe sous la barre. Si le réseau manque au fond du cuvier, l’écran le dit et garde votre saisie : elle repart dès que le téléphone accroche."],
      ['Déguster, traiter, filtrer', "Le bouton « Nouvelle opération » du Chai propose huit gestes. Dégustation : une cuvée à la fois — ou un fût précis, désigné par son lot et un repère (numéro à la craie, emplacement), si une anomalie s’y montre — avec comment il goûte, ce qu’on remarque et la suite à donner ; « Enregistrer et goûter la suivante » passe à la cuvée suivante du millésime. "
        + "Traitement : la nature (collage, stabilisation, acidité, tanins et gomme, ensemencement), le produit de La Réserve qui fixe l’unité de la dose, puis la dose ; le volume des cuvées choisies se remplit seul, la quantité se calcule et sort du stock comme les adjonctions du Cuvier. Filtration : le type, le seuil, la perte — notée, sans toucher au volume de la cuvée. "
        + "Les trois arrivent au journal et au Suivi d’élevage ; traitement et filtration entrent au registre des manipulations, la dégustation y est comptée en pied."],
      ['Un millésime à la fois', "une opération porte sur une seule année. Changer de millésime en haut du formulaire vide la sélection : on ne mélange pas deux vins dans un même geste."],
      ['Les rapports du labo', "Le Chai › onglet « Labo » : une fiche par envoi au labo. La date du prélèvement, les analyses demandées — reprises de la fiche précédente —, puis une ligne par rapport : n° de rapport, n° d’échantillon, la cuvée au Chai ou la cuve au Cuvier. La couleur et l’appellation se lisent sur ses parcelles ; « < 0,1 » s’écrit tel quel ; un PDF par rapport. Avant d’enregistrer, l’écran montre où va chaque chiffre : le glucose d’une cuve qui fermente sur sa courbe des sucres, le malique d’une cuvée sur sa malo, le reste dans son bloc « Au labo ». Au-delà des neuf analyses courantes, la fiche propose l’azote assimilable, les éthylphénols, l’acétate d’éthyle et l’éthanal : le Diagnostic s’en sert pour confirmer ou écarter une piste."],
      ['Le diagnostic', "Le Chai › onglet « Diagnostic » : rien à y saisir. Il croise les analyses du labo, les opérations, les fûts et les dégustations de chaque cuvée, et nomme une cause possible quand plusieurs signaux vont ensemble — Brett, piqûre acétique, oxydation, malo lente. Pour chaque cuvée : les indices relevés, ce qui permettrait de confirmer (au labo, au chai), les chiffres clés, la grille des risques et l’évolution des analyses. <b>Échéancier</b> liste ce qui est à traiter maintenant et les sulfitages des 60 prochains jours ; <b>Comparaison</b> met les cuvées côte à côte selon les fûts ou le millésime ; <b>Méthode</b> explique les statuts ; <b>Réglages</b> (administrateur) fixe l’unité de la volatile, l’objectif de SO2 actif et le seuil d’alerte. Seule action : <b>Demander une analyse</b> prépare la demande, à partager ou copier pour le labo. Le diagnostic est indicatif : il oriente les contrôles, il ne remplace ni l’analyse de confirmation ni l’avis de l’œnologue. Dans ses Réglages, la force de la solution de SO2 du Chai convertit les doses du soutirage en mg/L : rendement des sulfitages et dose estimée."],
      ['Aération et fleur', "dans <b>Nouvelle opération</b> : au soutirage, « À l’abri de l’air » ou « À l’air » dit si le vin a été aéré ; à la dégustation, le signal « Fleur en surface » se coche quand un voile apparaît. Rien de coché reste « non renseigné ». Le Diagnostic s’en sert : un soutirage à l’air ou de la fleur appuient une piqûre acétique ou une oxydation."],
      ['Température, mise, part des anges', "à la dégustation, « Température du chai » se note en °C (facultatif) ; à la mise en bouteille, l’oxygène dissous et les tests de stabilité tartrique et protéique (facultatifs). Le Diagnostic s’en sert : un chai sous 16 °C freine la malo ; plus de 1 mg/L d’oxygène à la mise ou un test instable s’affichent dans les risques de la bouteille. La part des anges se calcule seule, sur les volumes d’ouillage."],
      ['Rien ne s’efface', "la même date rouvre la fiche, et un n° de rapport déjà saisi est reconnu, même tapé à une autre date. Une case laissée vide ne retire rien ; deux valeurs différentes pour la même analyse, une autre date ou une autre cuvée pour le même rapport : c’est vous qui choisissez. Pour corriger, « Compléter » le rapport dans sa fiche et prendre la nouvelle valeur ; l’administrateur peut aussi le « Retirer »."],
      ['Au labo', "la fiche d’une cuvée porte la courbe de chaque analyse dès deux rapports, ceux de la cuve d’où elle vient compris ; une cuve du Cuvier a le même bloc, son glucose gardant sa courbe des sucres. Le degré probable d’un rapport devient la première source du repère « vin sec » de la cuve."],
      ['Le délai d’ouillage', "se règle pour tout le domaine, et se resserre millésime par millésime — un vin jeune se surveille de plus près."],
      ['Le parc à cuves', "se déclare une fois dans la roue crantée de la Cave, bloc Le Chai : un nom, une contenance en litres, une matière. La même cuve sert à vinifier au Cuvier puis à élever au Chai, et l’application sait laquelle est prise — dans les deux cas."],
      ['Au Cuvier', "une cuve de vinification peut être rattachée à une cuve du parc. C’est ce rattachement qui rend l’occupation juste : sans lui, le parc ne voit que Le Chai et annonce libre une cuve qui fermente. Facultatif — la saisie libre reste possible."],
      ['Au décuvage', "vous choisissez où part le vin : barriques, cuve, ou les deux. Le répartiteur met la cuve d’abord et convertit le reste en barriques. La cuve que vous videz reste choisissable — élever sur lies dans la cuve de fermentation est un usage courant, pas une erreur de saisie. Saisissez aussi le <b>volume décuvé</b>, mesuré, goutte et presse : les fûts se proposent dessus, et c’est lui qui fait le rendement des parcelles de la cuve. Laissé vide, on retient le volume des contenants remplis, comme avant. Les fûts que vous ajoutez à la main remplacent ceux que l’application avait proposés en trop ; changer le volume ne recompte que les fûts proposés."],
      ['Un fût qui n’a pas la contenance du domaine', "se règle dans son lot de La Réserve, champ « Contenance d’un fût » — ou, pour l’administrateur, en touchant sa contenance dans la feuille de décuvage. Elle part avec le fût au Chai et revient avec lui. Un demi-muid ou une feuillette (plus de 10 % d’écart avec le réglage du domaine) est « hors format » : jamais proposé d’office, il se choisit avec +, et les barriques se recalculent sur le reste."],
      ['Corriger un volume décuvé', "dépliez une cuve décuvée : le bloc « Volume décuvé » dit d’où vient le chiffre — mesuré, ou d’après les contenants remplis au décuvage. « Corriger le volume » le remplace par la mesure ; le rendement suit, Le Chai garde ses fûts. Un volume plus grand que la cuve est refusé : c’est le piège des litres tapés en hL."],
      ['Modifier une cuvée garde ses fûts', "la fiche garde le tonnelier, la référence, le lot et la contenance de chaque ligne de fûts. La colonne Contenance corrige un fût déjà en vin (vide = réglage du domaine). Une cuvée logée seulement en cuve s’enregistre sans fût, et « Embouteillée » posé depuis la fiche rend les fûts au parc, comme la mise en bouteille. Remise ensuite « En élevage », elle les reprend ; s’ils n’y sont plus tous (repartis dans une autre cuvée, vendus), elle refuse plutôt que de les compter deux fois. Enlever une ligne de fûts enlève aussi le vide qu’elle portait, et les fûts retournent dans La Réserve s’ils en venaient."],
      ['Une récolte peut avoir plusieurs destinataires', "sur la même parcelle et le même jour : le domaine, et un ou plusieurs acheteurs de raisin. Une ligne chacun, avec ses caisses, son poids par caisse et, si l’acheteur a pris une partie de la parcelle, sa surface. Laissée vide, la surface prend tout le reste."],
      ['Le poids d’une caisse est un poids du jour', "il est figé sur l’apport au moment où vous le saisissez. La fiche du client ne fait que le proposer : la corriger plus tard ne déplace aucun kilo déjà livré, ni sur un bon déjà signé."],
      ['Corriger un poids après coup', "quand la caisse elle-même pesait autre chose que ce qui était annoncé, la roue crantée de la Cave › Le Cuvier › « Corriger un poids déjà saisi » reprend tout un millésime d’un coup. L’écran liste les poids réellement en place, ce qu’ils pèsent, et montre le résultat destinataire par destinataire avant d’appliquer. Les rendements des parcelles suivent. Les litres rendus par un acheteur ne bougent pas : ce sont les siens."],
      ['Le poids réel se vide quand vous changez de ligne', "c’est voulu : un poids de remplacement ne veut rien dire hors du poids qu’il remplace. Le correcteur sélectionne d’office la caisse la plus lourde à l’ouverture — vérifiez toujours quelle ligne est retenue avant de saisir. Au-delà de 40 % d’écart, l’écran vous le signale."],
      ['Les hectolitres estimés viennent des kilos', "la jauge d’une cuve, les apports par parcelle et la proposition de fûts se calculent sur le poids réel de chaque apport, pas sur le nombre de caisses multiplié par le réglage. Avec plusieurs tailles de caisse, c’est la seule façon d’être juste. Le volume mesuré au décuvage, lui, prime toujours sur l’estimation."],
      ['Le bon de livraison', "s’ouvre depuis la ligne « kg vendus en raisin » de l’écran Récoltes. Une livraison, c’est un chargement : un client, une date, même s’il emporte deux parcelles. Le bon ne dit que des kilos — aucun prix."],
      ['Le retour du client', "les litres de jus et de lie qu’il a obtenus, saisis des semaines plus tard sur la livraison. Corriger les caisses ne touche pas aux litres, et l’inverse non plus : deux mesures, deux personnes, deux moments."],
      ['Un seul retour pour plusieurs livraisons', "quand l’acheteur envoie un total de jus et de lie pour plusieurs livraisons, même de jours différents : dans ses livraisons, « Un seul retour pour plusieurs livraisons », cochez celles qu’il couvre et saisissez le total une fois. Les litres sont répartis au prorata des kilos. Rouvrir, corriger ou effacer une de ces livraisons agit sur tout le groupe."],
      ['Le rendement va chercher le mesuré d’abord', "les litres rendus par l’acheteur, puis le volume décuvé — mesuré s’il a été saisi, sinon celui des contenants remplis —, et seulement à défaut une estimation d’après les kilos. Tant que la cuve n’est pas décuvée, il n’y a rien à mesurer : la parcelle affiche une fourchette et le pourcentage mesuré, et le chiffre net arrive avec le décuvage. Il manque des litres, pas des raisins."],
      ['La contenance d’une cuve n’est pas son contenu', "le volume inscrit sur une cuve de vinification est sa contenance — celle du parc à cuves, qui se pré-remplit toute seule. Elle sert à la jauge de remplissage, jamais au rendement : une cuve à moitié pleine ne donne pas son volume en vin. Le rendement, lui, attend le décuvage. Elle ne sert pas non plus aux doses, ni à la chaîne De la récolte à la bouteille : ce que la cuve <b>contient</b>, c’est ce que ses caisses donnent à la règle du Cuvier (kilos par hectolitre), saignées déduites, puis le volume décuvé."],
      ['Une cuve n’est pas un fût', "elle ne sort pas de La Réserve, elle n’a pas d’âge, et elle a sa contenance propre. Ajouter une cuve à une cuvée ne change aucun compte de fûts. Le volume que vous inscrivez est celui qui est réellement dedans, pas la contenance de la cuve."],
      ['L’ouillage suit le bois, pas le contenant', "inox et béton ne s’évaporent pas : une cuvée logée seulement là n’a pas de jauge de part des anges et ne déclenche aucune alerte. Un foudre bois, si. Une cuvée mixte garde sa jauge, cadrée sur sa seule part en fût. Les litres à prévoir comptent chaque fût à sa contenance : un demi-muid de 500 L pour 2,2 pièces."],
      ['La fin de fermentation et la fin de malo', "sont estimées à partir de vos propres relevés : la densité pour l’une, l’acide malique pour l’autre. Sans trois mesures, l’écran dit « démarrage » plutôt qu’une date inventée. En toute fin de fermentation, quand la densité ne bouge plus, ce sont les sucres au labo qui prennent le relais."],
      ['Le repère de densité, et ce qu’il ne fait pas', "chaque cuve porte un repère de vin sec (0,2 g/L de sucres, le seuil des labos) calculé sur le degré potentiel de son moût — lu sur le degré probable d’un rapport du labo s’il y en a un, sinon sur votre premier relevé s’il a été pris avant le départ, sinon sur vos contrôles de maturité ; une chaptalisation datée l’abaisse. Le détail de la cuve écrit où il est et d’où il vient. <b>Il ne déclenche rien</b> : ni « finie », ni une entrée dans la tournée. C’est un repère de lecture sur la courbe, et sa valeur reste à caler sur vos analyses."],
      ['Pressurer n’est pas décuver', "l’étape <b>Pressurage</b> du parcours — l’ancienne « Décuvage » — dit que le marc est pressé, pas que le vin est parti au Chai. Le jus peut finir sa fermentation dans une autre cuve : la cuve reste donc <b>suivie</b>, dans la tournée et dans les cuves à mesurer, et ses relevés continuent la même courbe. Si le jus a changé de cuve, « Modifier » la rattache à la nouvelle : c’est le repère que la tournée affiche. C’est « Décuver » qui l’envoie au Chai et la sort de la tournée."],
      ['Décuver, c’est constater que la fermentation est finie', "la feuille de décuvage pose la question une fois : <b>terminée en cuve</b> (coché d’avance, c’est le cas courant) ou <b>elle finira au chai</b>. C’est vous qui répondez, à la dégustation et à l’état de la cuve ; aucun chiffre ne le décide. Dans le second cas seulement, la cuve porte <b>Décuvée · FA</b>, reste dans la tournée, et la cuvée le signale au Chai : ni malo ni sulfitage tant qu’il reste du sucre. Les cuves décuvées avant cette mise à jour n’ont pas de réponse enregistrée : l’écran ne la devine pas. Dans tous les cas, « Saisir une mesure » reste ouvert : un relevé ne rouvre rien. Quand c’est fini, « Déclarer la FA finie », dans la fiche de la cuve, le dit : elle sort de la tournée et la cuvée perd son avertissement. La date proposée est celle de l’analyse qui la dit sèche."],
      ['« Fini », c’est la malo faite', "après « Décuver », la frise de la cuve reste sur <b>FML</b> : la malo se fait au Chai, en fût ou en cuve. La phrase sous la frise dit où elle en est — pas encore déclarée, en cours avec sa fin estimée, ou <b>bloquée</b> quand l’acide malique ne descend plus. <b>Fini</b> s’allume avec la date de fin de malo, déclarée au Chai : une analyse « Terminée », ou le bouton de la fiche de la cuvée. Un vin qui évite la malo exprès (blancs, rosés) se déclare <b>Pas de malo (voulu)</b> sur cette fiche. Une malo faite en cuve avant le décuvage se dit dans la feuille de décuvage : « Déjà finie en cuve ». « Terminé » ne se pose plus à la main sans passer par l’étape FML, et le jour du décuvage s’appelle « Décuvée » dans le parcours, sur la courbe et dans le cahier de cuverie."],
      ['La densité à la mise en fût', "même feuille, champ facultatif : la densité de la masse assemblée, <b>goutte et presse</b>, avec sa température. Le pressurage relargue du sucre et fait remonter la densité — c’est cette valeur-là qui compte pour la suite, pas le dernier relevé de cuve. Elle s’affiche sur la cuvée au Chai et ne rejoint jamais la courbe du Cuvier."],
      ['Trouver une cuve', "la liste du Cuvier est rangée dans l’ordre de votre cuverie — celui écrit sur les cuves, celui dans lequel vous marchez. Une cuve garde donc sa place d’un jour à l’autre, même après un relevé. Vous pouvez trier par urgence ou par avancement, filtrer, et chercher par nom ou par parcelle dès six cuves."],
      ['Une cuve s’ouvre en fiche', "la liste ne montre que l’essentiel : repère, nom, densité, température, avancement. Touchez une ligne : sa fiche s’ouvre à droite sur ordinateur, dans une fenêtre au téléphone — la frise, la courbe, ses chiffres, ses relevés, ses opérations et ses boutons, avec « Noter un relevé » quand elle est à relever. Une seule cuve est ouverte à la fois ; la croix la referme. En haut de l’onglet : la vendange choisie (une vendange passée renvoie au Chai), « Fusionner », « Nouvelle cuve », et quatre chiffres — en fermentation, à relever, en cuve sur la contenance de la cuverie, en attente d’encuvage. Sur ordinateur, tant qu’aucune cuve n’est ouverte, le plan de cuverie occupe la droite."],
      ['Ce que porte la courbe', "densité ramenée à 20 °C en trait plein, température en pointillé sur son propre axe, le seuil de vin sec <b>de cette cuve</b> en tireté, un repère rond par opération datée, et un trait vertical gris tireté à chaque changement d’état de la cuve. Une remontée ne s’explique que par une chaptalisation ; un palier, souvent par une macération préfermentaire. Une cuve dont les passages n’ont jamais été datés n’a aucun trait vertical. Sous elle, dès deux analyses, la courbe des sucres au labo."],
      ['Les sucres au labo', "en fin de fermentation, notez le résultat du labo — glucose + fructose, en g/L — dans « Saisir une mesure » (la densité y devient facultative) ou dans un rapport du labo, à la date du prélèvement. La fiche trace la courbe des sucres et dit où en est la cuve : en route vers le sec (une date estimée dès trois analyses), ça stagne (moins de 5 % de baisse par jour), ça remonte (un pressurage ou un assemblage ?) ou sèche au labo, à 0,2 g/L ou moins. C’est une mesure, pas une décision : la fin de fermentation reste à déclarer. Une cuve suivie au labo réclame une analyse tous les 4 jours, plus une densité par jour."],
      ['Le plan de cuverie', "le second bouton en haut à droite montre la cave en vignettes : chaque cuve avec son niveau et sa couleur. Une cuve qui n’a pas été mesurée depuis la veille passe au rouge. C’est la vue du matin."],
      ['Fusionner des cuves', "plusieurs cuves peuvent n’en faire plus qu’une. Les raisins, les kilos et les parcelles suivent vers la cuve d’arrivée — qui peut être une des cuves choisies ou une cuve libre du parc. Les cuves de départ quittent la liste, libèrent leur cuve, et gardent leurs relevés et leurs opérations sous leur nom d’origine : c’est sous ce nom que le SO₂ a été ajouté. L’assemblage part au registre des manipulations. Tant que rien n’est décuvé, le volume affiché est une estimation d’après les caisses, et l’écran le dit."],
      ['Changer l’étape d’une cuve garde la date', "une cuve qui passe de macération préfermentaire à fermentation alcoolique ne perd plus ce qui précède : chaque passage est daté. Dans la fiche de la cuve, dès que vous changez le statut, un champ « Depuis le » apparaît, réglé sur aujourd’hui — changez-le si vous notez le passage le lendemain. La frise des étapes porte les dates, et la cuve annonce depuis quand elle est dans l’étape où elle est."],
      ['Le parcours se corrige, étape par étape', "ouvrez la fiche de la cuve : sous la frise, « Parcours » liste tous ses passages avec leur durée, un crayon par ligne. Le bouton « Changer l’étape » fait la même chose depuis le détail. Une date antérieure à l’encuvage ou postérieure à aujourd’hui est refusée. Supprimer une étape efface une date, pas un fait : le statut de la cuve ne change pas."],
      ['Les cuves d’avant cette mise à jour n’ont pas de date de passage', "on ne connaît pas le jour où elles sont entrées dans leur étape actuelle, et la date d’encuvage ne le dit pas. La frise écrit un tiret plutôt qu’une date fausse : un tiret se corrige, une date fausse se croit. Posez-la à la main si vous la connaissez."],
      ['La fin de fermentation ne compte que les jours de FA', "cinq jours de macération à froid ne sont pas cinq jours de fermentation. Tant que la fermentation n’a pas trois jours, l’écran dit « démarrage » au lieu d’une date de fin. Le cahier de cuverie imprime la durée de macération réellement faite ; à défaut, la durée prévue, et il le dit."],
      ['Un relevé se corrige', "ouvrez la fiche de la cuve : la liste de ses relevés s’ouvre sous la courbe ; le crayon rouvre celui que vous désignez, date comprise. Les relevés se rangent par date, pas par ordre de saisie : un carnet rattrapé le lendemain se remet tout seul à sa place, et la fin de fermentation estimée suit. La liste reste ouverte sur une cuve pressurée ou déjà décuvée, et la saisie aussi."],
      ['Une opération se corrige aussi', "toutes sont listées, plus seulement la dernière. Une saignée retire son volume de ce que contient la cuve — l’estimation d’après les caisses —, plus de sa contenance. Une saignée d’avant la version 7.42 avait pris sur la contenance : la corriger ou la supprimer la lui rend d’abord, et le volume ne se retranche jamais deux fois."],
      ['Un refroidissement dit par quel moyen', "groupe de froid, échangeur, glace carbonique, azote liquide, CO₂ liquide, eau froide. Les trois qui se pèsent demandent une quantité en kilos, et la carboglace annonce l’abaissement approximatif — un ordre de grandeur, la cuve n’étant pas isolée. Le moyen et la quantité partent au registre des manipulations : c’est là qu’on les cherche."],
      ['Tanins, enzymes et bentonite', "se posent sur une cuve comme les autres opérations, mais le produit se choisit dans La Réserve : c’est ce qui permet de sortir la quantité du stock toute seule. L’unité de dose suit le produit — g/hL pour ce qui se pèse, mL/hL pour ce qui se verse. Sans produit choisi, l’opération s’enregistre quand même, hors bilan matière, et l’écran le dit."],
      ['La quantité se calcule sur un volume, et ce volume dit d’où il vient', "tant que la cuve n’est pas décuvée, c’est le volume <b>estimé d’après ses caisses</b>, à la règle du Cuvier, saignées déduites — jamais sa contenance : la saisie affiche « volume estimé », et le registre imprime « (estimé) ». Cela vaut pour la chaptalisation, le SO2, les tanins, enzymes et bentonite, dans la feuille comme dans l’intervention groupée. Sans caisse rattachée, rien n’est inventé : la case reste vide. Corriger le volume à la main reste possible, et se voit."],
      ['Un stock négatif n’empêche jamais d’enregistrer', "le tanin est déjà dans la cuve : refuser la saisie parce qu’une facture manque ferait mentir le suivi pour protéger la comptabilité. L’écart part dans La Réserve, qui le nomme et le garde jusqu’à régularisation."],
      ['Encore sur pied', "en haut de l\u2019écran Récoltes, les parcelles actives qui n\u2019ont aucune récolte saisie sur la campagne, la plus mûre en premier d\u2019après vos analyses. Une parcelle arrachée n\u2019y figure pas ; une parcelle sans surface renseignée, si. Toucher une ligne ouvre la nouvelle récolte avec la parcelle déjà choisie. Un nom de parcelle absent du parcellaire est signalé sous la carte : c\u2019est ce qui explique un compte qui semble faux. Une parcelle qu’on ne vendangera pas cette année (condamnée à l’arrachage, grêlée…) : l’administrateur touche «\u00a0Une parcelle ne sera pas récoltée ?\u00a0» en bas de la carte et la décoche. Elle quitte la carte, Le millésime et le Revient, mais reste dans le domaine ; une ligne «\u00a0Pas de récolte cette année\u00a0» la nomme, et «\u00a0Modifier\u00a0» la remet."],
      ['Le millésime', "une tête commune — l’année (les boutons à droite changent de millésime), son état et ses quatre chiffres — puis quatre vues. Ensemble : ce qu’il faut surveiller (un volume entonné à mesurer, une parcelle au-dessus du maximum, ce qui reste sur pied, les cuves en fermentation), le parcours du vin de la benne à la bouteille, les cuvées en un coup d’œil et les repères du millésime. Parcelles : en tête, ce qui se déclare — pour chaque appellation et chaque couleur, la surface récoltée, le volume et le hL/ha face au maximum de l’appellation, raisin vendu compris ; dessous, le rendement de chaque parcelle face à son maximum, du plus haut au plus bas, avec des filtres. Cuvées : la liste, puis la fiche de chaque cuvée — à droite sur ordinateur. Courbes : maturités, densités, températures et malo côte à côte sur ordinateur, une à la fois au téléphone ; le couloir des densités va de la cuve la plus lente à la plus rapide, sa médiane en pointillé, et par-dessus la ou les deux cuves que vous choisissez."],
      ['La chaîne De la récolte à la bouteille', "dans Le millésime, vue Cuvées : chaque cuvée du millésime choisi a sa ligne — son nom, sa cuve et ses parcelles —, les cuves pas encore décuvées, la récolte sans cuve et le raisin vendu compris ; touchez-en une, sa fiche s’ouvre (à droite sur ordinateur). La fiche montre quatre étapes : les kilos d’après les caisses, puis ces kilos à la règle du Cuvier (en cuve, estimés, saignées et vin versé à une autre cuve déduits), puis le volume <b>réellement entonné</b> — le volume décuvé que vous avez mesuré —, puis les bouteilles. Jamais la contenance de la cuve, jamais la taille des fûts. Sous chaque étape mesurée, son <b>kg/hL</b> : les kilos récoltés divisés par ses hectolitres — l’écart avec votre règle dit s’il faut la revoir. Juste dessous, son <b>hL/ha</b> : ses hectolitres sur la surface des parcelles qui ont rempli la cuve, part du domaine seulement ; une parcelle partagée entre deux cuves y compte au prorata de ses kilos. En rouge, ce que chaque étape a perdu. Le vin d’une autre cuve versé pour compléter un fût s’empile en pointillé et n’entre pas dans le calcul. Une étape pas encore faite est un trait pointillé ; tant que le volume entonné n’est pas saisi, « Saisir le volume entonné », dans la fiche, ouvre la saisie de la cuve décuvée. Puis d’où vient la cuvée (ses parcelles, la surface comptée pour chacune et leurs kilos), ses dates et ses contenants. Au Chai, onglet Bouteilles, chaque cuvée en bouteille garde sa chaîne."],
      ['Un fût entamé se complète', "quand le volume décuvé <b>mesuré</b> est plus petit que les fûts remplis, la carte de la cuvée le dit — « 1 fût entamé, il attend 30 L » — et Le Chai compte le vin réel. Touchez-le (sur la carte, ou dans la fiche, ligne des fûts) : choisissez d’où vient le vin — une cuve du Cuvier, même pas encore décuvée, ou une cuvée du Chai — et combien, jamais plus que ce qui manque. Le vin prélevé dans une cuve du Cuvier sort de ce qu’elle contient mais reste dans le rendement de ses parcelles. La fiche garde la composition ; une ligne « Assemblage » va au journal et au registre des manipulations. La supprimer défait tout. L’application ne tranche pas ce que la réglementation permet : elle écrit la part d’une autre appellation ou d’un autre millésime. Si les fûts sont en réalité pleins — des fûts comptés en trop, une mesure faite autrement —, « Mes fûts sont pleins — corriger ce qui manque » le dit : c’est une correction, rien ne part au registre."],
      ['Suivre une cuve dans le couloir', "touchez sa pastille au-dessus du graphe, ou sa ligne dans le tableau : elle passe en trait épais par-dessus le couloir. Deux cuves au maximum — au-delà on retombe sur le graphe illisible qu’on vient de remplacer ; en toucher une troisième relâche la première. La même sélection vaut pour les densités et pour les températures : le palier et la chaleur qui l’explique se lisent sur la même cuve, sans rien retoucher."],
      ['Lire un jour dans le couloir', "un appui sur le graphe ouvre une étiquette : la valeur de votre cuve, la médiane du cuvage, l’écart entre les deux en toutes lettres, et le nombre de cuves prises en compte. Un jour où une cuve n’a pas été relevée, sa valeur est estimée entre ses deux relevés voisins et porte le signe ~ — jamais avant le premier relevé ni après le dernier."],
      ['Le rendement maximum de l\u2019appellation', "se pose par parcelle ET par millésime, en touchant une parcelle dans « La ligne de vie » — ou depuis la même carte du Pilotage. Le rendement annuel autorisé est fixé par arrêté, campagne par campagne : une valeur posée pour 2026 ne dit rien de 2025. Valider à vide retire celui d\u2019une année. Réservé à l\u2019administrateur."],
      ['Une valeur « héritée »', "vient de l\u2019ancien réglage, qui ne portait pas d\u2019année. Elle continue de servir partout où rien n\u2019est posé, et l\u2019écran le dit : elle n\u2019a été vérifiée contre l\u2019arrêté d\u2019aucune campagne. Poser le plafond du millésime la remplace pour cette année-là, sans toucher aux autres."],
      ['L’appellation porte le plafond', "déclarez vos appellations dans la roue crantée de la Cave › Le Millésime › Appellations & plafonds, posez leur rendement maximum pour chaque millésime — et, avec « ··· », leur minimum de maturité des rouges et des blancs (la richesse minimale en sucre du cahier des charges, tracée en trait rouge dans les Maturités) —, et rattachez-y vos parcelles (« Rattachement des parcelles »). L’ordre est : le plafond de la parcelle s’il existe, sinon celui de son appellation, sinon l’ancien réglage sans année. Une saisie faite à la main n’est jamais défaite par un réglage général."],
      ['Poser un plafond, puis tous les autres', "après la première saisie, l\u2019application propose de porter la même valeur sur les parcelles du millésime qui n\u2019ont aucun plafond, en les nommant d\u2019abord. Celles qui en ont déjà un ne sont jamais touchées."],
      ['Votre rendement au pressoir', "se règle dans la roue crantée de la Cave, bloc Le Cuvier, en kilos de raisin par hectolitre. Tous les écrans qui transforment des raisins en volume s’en servent — la chaîne de la récolte à la bouteille comme le bilan de campagne."],
      ['Les analyses labo', "s’attachent en PDF à la cuvée. Les supprimer est réservé à l’administrateur."],
      ['Huit documents sortent de la Cave', "depuis la roue crantée de la Cave, bloc Documents — ou depuis Réglages, onglet Domaine, « Documents & impressions », qui les a tous : le contrôle de maturité avant vendange, les récoltes de la vendange, le fichier Excel des parcelles (rendement du millésime en hL/ha, trié par nom ou par rendement), le cahier de cuverie pendant la fermentation, le suivi d’élevage, le registre des manipulations, le bilan de campagne et l’inventaire des fûts. Ce sont des états internes : Ma Vigne prépare, vous déclarez. Le cahier de cuverie imprime aussi <b>la courbe</b> de chaque cuve — densité et température, avec les opérations datées — au-dessus de son tableau ; sous trois relevés de densité, il n’y a pas de courbe. Il s’ouvre sur un <b>comparatif</b> de toutes les cuves, alignées sur leur jour d’encuvage et non sur le calendrier, avec le sucre relevé à la vigne avant l’encuvage."],
      ['Cinq documents demandent leur ordre', "l’<b>état du vignoble</b>, l’<b>inventaire des intrants</b>, les <b>récoltes de la vendange</b>, le <b>contrôle de maturité</b> et le <b>cahier de cuverie</b> posent la question avant d’éditer, et écrivent l’ordre choisi dans leur en-tête. Une valeur manquante part toujours en fin de liste, dans les deux sens : une donnée absente n’est pas une petite valeur. Les deux exports CSV, eux, ne demandent rien mais sortent désormais toujours dans le même ordre."],
      ['Les récoltes se trient avant d’imprimer', "le document demande le <b>millésime</b>, puis par quoi trier : parcelle, surface, rendement, kilos ou date. Il sait aussi sortir <b>une ligne par parcelle</b> au lieu d’une ligne par benne. L’ordre choisi est écrit dans l’en-tête du document, et retenu pour la fois suivante. <b>Le rendement affiché est en hL/ha, celui de la parcelle entière</b> — le même chiffre que Le millésime ; « ~ » devant signale une estimation. Une benne n’a pas de rendement. Un état sanitaire non noté à la saisie s’affiche « — » et ne compte pas dans la moyenne."],
      ['Deux autres s’éditent au plus près de la livraison', "le bon de livraison d’un chargement et le récapitulatif de campagne d’un acheteur, depuis les ventes en vrac. Ils portent le nom du domaine, les kilos livrés, et les volumes rendus dès que le client a répondu."]
    ]
  },
  reserve: {
    ico: 'carton', titre: 'Réserve', ancre: 'reserve',
    points: [
      function () {
        return _mvAideSections('.mvr-tabs .mvu-tab', 'onglets',
          "C’est la comptabilité matière du domaine, pensée pour le contrôle bio.");
      },
      ['L’onglet Fûts porte le parc entier', "les fûts vides du magasin et ceux qui sont en vin au chai, additionnés. Ce ne sont pas deux comptabilités : ce sont deux états du même fût."],
      ['En tête de Fûts', "deux lectures venues de la Cave : la part des anges — ce que l’ouillage a réellement remis dans chaque cuvée sur douze mois, une ligne par millésime — et la pyramide des âges du parc, avec les barriques au-delà de la durée de vie fixée. Elles étaient dans le Pilotage ; le parc n’a plus qu’un chez-soi."],
      ['Entonner, embouteiller ou retirer', "ne change pas le nombre de fûts du domaine. Seuls acheter et se séparer le font."],
      ['La contenance d’un lot', "vide, le lot suit le réglage du domaine (roue crantée de la Cave, bloc Le Chai). Pour un demi-muid, une feuillette ou un fût de 300 L, écrivez sa contenance dans le lot : elle part avec les fûts au décuvage et revient avec eux à la mise en bouteille. Une étiquette la rappelle sur la carte du lot, et l’inventaire PDF l’imprime."],
      ['Le registre des mouvements', "en bas de l’onglet garde chaque entrée et chaque sortie, avec son motif."],
      ['La roue crantée', "en haut à droite imprime les deux inventaires, fûts et intrants. Administrateur seulement."],
      ['Le prix moyen d’un intrant', "n’est pas saisi ici : il se calcule sur vos factures, euros divisés par quantité, et s’affiche sur la fiche. Les lignes sans prix sont écartées du calcul plutôt que comptées à zéro — sinon la moyenne serait tirée vers le bas sans en avoir l’air."],
      ['Les prix se mettent ailleurs', "dans <b>Pilotage › Économie › Achats</b>, qui rassemble tout ce qui a été acquis — intrants, fûts, passages chez le réparateur. C’est voulu : le prix arrive avec la facture, des semaines après le geste, et on le saisit en une fois plutôt qu’écran par écran."],
      ['Le bilan se calcule seul', ": inventaire d’ouverture + achats − consommation. Aucun stock à tenir à la main."],
      ['L’inventaire d’ouverture', "est le point zéro. Sans lui, l’écart constaté ne veut rien dire."],
      ['Un stock négatif', "n’est pas un défaut d’affichage : il manque une facture d’achat, le consommé est surestimé, ou — pour un intrant œno — les adjonctions du Cuvier reposent sur un <b>volume estimé</b>. L’alerte compte ces dernières, pour éviter de chercher une facture qui n’existe pas."],
      ['Créer et modifier', "est réservé à l’administrateur du domaine ; tout le monde peut consulter."]
    ]
  },
  pilotage: {
    ico: 'graphique', titre: 'Pilotage', ancre: 'pilotage',
    points: [
      ['Choisir ce que vous regardez', " : la barre <b>« Vous regardez »</b>, en haut du Pilotage. <b>La campagne</b> : touchez son nom pour en choisir une sur la frise de l’année. <b>L’année vigne</b> ou <b>l’exercice</b> : les flèches remontent aux années passées. Les chiffres du haut et chaque onglet suivent ce choix ; au téléphone, l’étiquette et les dates s’effacent pour tenir dans la barre. <b>Aujourd’hui</b> fait exception : il lit toujours la campagne en cours, et la nomme sous sa date."],
      ['Aujourd’hui se lit d’un coup d’œil', ": en haut à droite du cadre, la bascule <b>Terrain · Cave · Économie</b> et la roue « Choisir les indicateurs ». Sous la date, la campagne que lisent les chiffres de la page, ses dates et le jour où vous en êtes (quand la barre « Vous regardez » montre déjà cette campagne, son nom seul). Puis une phrase, sur toute la ligne, résume la journée ; sous chaque chiffre, sa référence : la <b>fin prévue</b> et l’<b>objectif</b> sous l’avance ou le retard (en jours travaillés au planning), le <b>coût à la fin</b> et le <b>budget</b> sous l’écart au budget — le « i » dit comment c’est compté. Chaque morceau se touche : le retard mène à la fin prévue, le budget à la vue Économie, les points à anticiper à « À savoir », la cave à la vue Cave. Viennent les photos du domaine, la <b>fin prévue</b> avec sa frise et votre objectif, la <b>décision du jour</b> en quatre tuiles, le <b>domaine en direct</b> (chaque parcelle à sa forme et à l’échelle, colorée selon son état sur sa fiche pour la tâche choisie, en contour pâle quand cette tâche y est désactivée, rangée par appellation, l’équipe posée sur chaque parcelle en cours, sa pastille qui clignote les jours travaillés ; au survol, une loupe la montre en grand ; la toucher ouvre sa fiche), les chantiers (à faire ou en cours en haut, par date de début ; les terminés en bas) et la charge restante (une ligne relie la photo de chaque jour au point d’aujourd’hui). À droite sur ordinateur, le fil <b>En direct</b> puis <b>À savoir</b> restent visibles quand vous descendez dans la page, sous le bandeau et les onglets, qui restent en haut. Le fil <b>En direct</b> montre d’abord qui est où en ce moment — chaque parcelle en cours avec son équipe et depuis quand, le tracteur en marche ou en pause —, puis la journée : validations, débuts, parcelles finies au tracteur avec le temps mesuré, traitements ; l’équipe passe d’abord, et celui qui a saisi n’y figure que s’il était dans les rangs. Sur ordinateur, il garde la hauteur d’une journée calme : quand il y a plus, la fin s’efface et « Tout voir » le déplie ; « Replier » le remet à sa taille. <b>À savoir</b> réunit la météo des cinq jours, la pluie ou le vent par secteur, les absences, les fins de contrat, les retards et le matériel ; les <b>points à anticiper</b> y viennent en tête, surlignés et marqués « À anticiper » : une tâche dont les dates sont passées, un contrat qui finit dans les 30 jours, la pluie ou le vent sur une commune où une tâche est en cours. Tout ce qui parle des gens suit le <b>planning</b> : un jour sans travail, l’effectif et les présences montrent le prochain jour travaillé ; un absent revient le premier jour où le planning le prévoit, un arrêt maladie dit sa date de fin. La bascule <b>Terrain / Économie</b>, en haut, donne la photo économique du jour : l’atterrissage de la campagne, le coût à l’hectare, l’écart au barème (le total des tâches de la carte « par tâche », en heures réelles face au barème des parcelles validées ; un tiret tant que rien n’est à comparer), le dépensé face au fait, la cadence de l’équipe, le coût de l’inaction, les postes, les appellations et les tâches — les chiffres de l’onglet Économie ; l’atterrissage y est la fin projetée, et l’arrachage (comme les autres travaux sans barème) a sa ligne « Travaux à l’heure ». « Agrandir » ouvre la courbe en grand ; « Changer la priorité » ouvre le choix de la tâche prioritaire ; la date de l’objectif se règle en touchant son bouton. La tension par personne se détaille dans L’équipe & le matériel, la protection restante dans Conformité."],
      ['La vue Cave', ": la bascule, en haut à droite du cadre, passe à trois vues — <b>Terrain</b>, <b>Cave</b>, <b>Économie</b>. La vue Cave reprend le verdict de la Cave, mot pour mot, et dessine chaque cuve suivie (inox ou bois, son niveau d’après les caisses, des bulles quand elle fermente, un flocon en macération à froid) et, au Chai, un rond par fût là où les fûts demandent un geste : rouge une alerte, orange un geste attendu. Les cuvées qui suivent leur cours (fermentation, malo), puis celles qui sont à jour, tiennent chacune sur une ligne : leur nombre, leurs fûts et, pour les cuvées à jour, le prochain ouillage. « Tout voir », ou leur état dans la légende (gris en cours, vert à jour), les déplie avec tous leurs fûts. La légende filtre ; au survol, une bulle détaille. Dessous : la semaine de l’équipe en cave d’après le Planning (la journée, le matin ou l’après-midi) face aux gestes prévus, le millésime de la vigne à la bouteille, les derniers gestes et ce qu’il faut savoir en cave. Rien ne s’y fait : chaque ligne ouvre l’écran de la Cave. Quand la cave presse, un point s’allume sur « Cave », la phrase du haut le dit, et une ligne Cave s’ajoute dans « À savoir » de Terrain. Dans le coin d’un fût, le signe de sa dernière dégustation — fleur, piqué ou oxydé — : le fût est repéré par son tonnelier, son année et sa référence saisis à l’entonnage ; le signe part quand une dégustation plus récente du même fût ne le note plus. Un fût marqué garde son rond même quand sa cuvée est rangée sur une ligne, juste dessous, avec sa référence. « Choisir les indicateurs » peut masquer la vue ou ses points."],
      ['Presque tout se lit, quatre choses s’écrivent', ": les chiffres viennent du journal, du planning, des sessions tracteur et de la cave. Ce qui s’écrit ici est nommé : les prix des achats (Économie), le mois d’ouverture de l’exercice comptable et celui de l’année vigne (roue crantée, Économie › Exercice), et ce que porte la roue crantée."],
      ['Vos deux années se règlent au même endroit', ": la roue crantée porte l’ouverture de l’<b>exercice comptable</b> — celui de votre bilan, fixé par votre comptable — et, juste dessous, le <b>cadre de votre campagne</b>, l’axe des Archives et du bilan de campagne. Une campagne est un cycle de production : ce qui la borne, c’est la <b>vendange</b>, et le mois n’en est que la traduction. L’écran dit où tombe la vôtre dans le cadre choisi — elle l’ouvre, elle la clôt, ou la borne la coupe en deux — et propose le mois qui suit la fin de vos vendanges. Le changer recadre des chiffres déjà affichés, jamais vos saisies."],
      ['La roue crantée', "en haut à droite ouvre ce qui se règle : objectifs de fin, fenêtres des tâches, hypothèses de calcul, IFT de référence — et le bilan de campagne à imprimer. Administrateur seulement."],
      ['Les cartes arrivent repliées', ": chaque bloc montre son <b>chiffre</b> et la ligne qui dit sur quoi il a été calculé, même fermé — rien n’est caché. Touchez-en une pour voir son détail : elle s’ouvre en grand, et la précédente se referme, pour que les autres restent rangées côte à côte."],
      ['Le petit rond « i » dit d’où vient un chiffre', ": touchez-le, une bulle s’ouvre juste à côté et explique comment ce chiffre est calculé, sur quelle fenêtre, et ce qu’il ne dit pas. Une explication longue commence par l’essentiel : « Lire la suite » déplie le reste dans la même bulle. Touchez ailleurs pour la refermer. Ce qui <b>cadre</b> un chiffre — sa date, sa source, son périmètre — reste toujours affiché à côté de lui, en une ligne. C’est la méthode qui se range, jamais le cadre."],
      ['La protection restante', ": sa propre carte, sous la décision du jour : combien de parcelles sont à nu et, pour les 5 plus urgentes, les jours de protection qui restent, d’après le dernier traitement du registre, trois rémanences par mode d’action et la pluie tombée depuis (un contact est à nu dès 20 mm, réglable, Réglages › Pilotage › Conformité). Le bouton montre les autres parcelles. La pousse n’est pas comptée."],
      ['Le coût de l’inaction', ": sous la marge, ce que le retard ajoute en heures et en euros si personne n’est ajouté, d’après le simulateur de renfort. Un modèle, pas une mesure ; le bouton mène à Décider."],
      ['La tension de l’équipe', ": le travail effectif de chacun sur 14 jours, face à ce que le planning prévoyait — jamais face au contrat. Au seuil : plus de 10 % au-dessus du prévu, ou une semaine au-delà de la moyenne autorisée. La carte du jour donne le verdict et la personne la plus chargée ; la carte du dessous, une ligne par personne. Le bouton ouvre le Planning."],
      ['La tâche prioritaire', ": la priorité du moment fixée par l’administrateur ; sans elle, la seule tâche dans ses dates de travaux. Quand plusieurs tâches se chevauchent, la carte ne choisit pas. L’administrateur y trouve toujours un bouton pour fixer la priorité. Le nombre d’heures ne décide jamais."],
      ['Les petites courbes', ": à côté d’un chiffre du haut, elles montrent ses 14 derniers jours en écart à sa référence, le pointillé. La charge restante et le budget les tiennent d’une photo prise chaque jour à la première ouverture par un administrateur, une fois les données arrivées (60 jours gardés) ; un jour sans ouverture est un trou. La bande va de −30 % à +30 %, la même pour toutes : deux courbes côte à côte se comparent d’un coup d’œil. Le « i » dit ce que chaque point mesure."],
      ['Les alertes matériel se lisent sur les travaux en cours', ": chaque session tracteur lancée doit couvrir tout le domaine (l’amendement, ses parcelles choisies). Aujourd’hui montre ce qui reste à faire, en heures et en litres, place la prochaine <b>révision</b> dans ces travaux et dit ce qu’il restera dans la <b>cuve</b> une fois tout fini. Un travail terminé disparaît. La consommation de chaque tracteur, mesurée sur vos pleins, est dans L’équipe & le matériel."],
      ['« Agrandir »', "sur un graphique ouvre le même dessin en grand, à la largeur de l’écran. Les barres d’avancement ont un seul code de couleur : vert fini, doré en cours, orange quand la fenêtre du travail est passée sans qu’il soit fini."],
      ['Quand il manque quelque chose, un bouton vous y emmène', ": plus de chemin à retenir. « Cuve GNR à renseigner », « fiches à passer en Inactif » — le bouton ouvre l’écran concerné, sur le bon onglet, et fait clignoter l’endroit exact une seconde."],
      _mvAideOngletsPil,
      ['La barre du haut dit où vous regardez', ": l’exercice entier, ou une campagne. Touchez une campagne dans L’année et les trois chiffres du haut et les tableaux de la campagne suivent. La croix revient à l’année. <b>Trois écrans ont leur propre cadre</b> et ne se recadrent pas : Économie chiffre la période consultée (sauf ses sous-vues Exercice et Revient, qui ont chacune leur cadre), la Cave suit le millésime, la Conformité roule sur sept ans — chacun l’écrit au-dessus de ses chiffres."],
      ['Les trois chiffres du haut', "— les travaux, l’effectif, le budget — ne s’affichent que sur <b>Travaux</b>, le niveau de zoom. Ils changent avec ce que vous regardez, et chacun mène à l’écran qui le détaille. Ailleurs, ils ne servaient plus à choisir où aller : sur Économie et sur Conformité, ils répétaient l’écran juste en dessous."],
      ['Le budget de l’année et le renfort', " : le cadre (exercice comptable ou année vigne) se choisit dans la barre <b>« Vous regardez »</b>. Le <b>budget de l’année</b> s’ouvre en tête de la Synthèse d’<b>Économie</b>, avec les avis du cadre (vendange à cheval sur deux exercices, année vigne aux mêmes dates que l’exercice) ; <b>le renfort à prévoir</b> est dans <b>Équipe & matériel</b>, partie Personnel. L’onglet « L’année » n’existe plus : ceux qui l’avaient ouvert arrivent sur Économie."],
      ['Une seule date de fin', "pour tout le module : Aujourd’hui, sa frise et Échéances par tâche lisent la même simulation que Travaux, sans renfort — chaque travail dans sa fenêtre, l’équipe partagée entre les travaux ouverts en même temps, le tracteur déduit, aux heures normales du planning. Le « i » à côté de la marge dit les trois choses qui la distinguent du simulateur de renfort, et « vers le » signale une fin après la période, l’équipe de la dernière semaine reconduite."],
      ['La conformité n’est plus dans cette ligne', "et c’est une question d’échelle : le cuivre roule sur <b>sept ans glissants</b>, il ne bouge pas quand vous cliquez une campagne. Un chiffre qui ignore la portée n’a pas sa place dans une ligne qui se recadre. Il se lit en entier dans l’onglet Conformité, et le bouton « à compléter » remonte toujours ses alertes, sur tous les onglets."],
      ['Le bouton « à compléter »', "liste ce qui manque pour que vos chiffres soient justes, et vous emmène à l’endroit exact où le renseigner. Un rond rouge sur un chiffre veut dire qu’il ne se calcule pas ; un rond orange, qu’il sort mais faux. Les travaux au temps passé (arrachage, désherbage manuel, effeuillage, vendange) n’y figurent pas : ils n’ont pas de barème, par nature. L’entreplantation y figure tant qu’aucun pied n’est compté, et son bouton ouvre la feuille des comptes. Une période sans traitement n’a rien à compléter côté phyto : zéro est alors le vrai chiffre."],
      ['Les onglets vont du large au fin', ": l’année, puis la campagne, puis l’équipe et le matériel, puis la décision. Après le trait, ce sont des écrans de détail — on y arrive aussi en touchant un des trois chiffres."],
      ['La carte du domaine se lit de cinq façons', " : l’avancement, les jours depuis le dernier traitement, le cépage, les passages phyto face à votre référence, le coût engagé à l’hectare. La légende suit la vue ; une parcelle sans donnée reste grise."],
      ['Travaux', "(l’ancien « La campagne ») montre l’avancement — la jauge de saison en tête d’« Avancement par tâche », puis « La charge par tâche » —, mais aussi — sous « Où va le temps de l’équipe » — comment la présence se partage entre vigne, tracteur et le reste, avec la frise prévu/réel, la courbe par semaine et l’écart. Ces blocs parlent d’une campagne ; ce qui manquera en personnes d’ici la fin de l’année, lui, se lit dans « L’année »."],
      ['Une tâche sans barème à l’hectare', "— arrachage, désherbage manuel, entreplantation sans pieds comptés ni trous percés — ne prévoit pas d’heures : dans « Avancement par tâche », elle s’avance en <b>surface</b> faite sur surface concernée, la même part que sur la liste des parcelles. Quand l’équipe a fini ses étapes d’arrachage partout, la tâche se range en tête des terminées, en vert, avec « la suite au prestataire »."],
      ['Deux périodes qui se chevauchent', "ne comptent rien deux fois : les heures suivent les tâches, et une tâche n’appartient qu’à une seule période. Sur les jours communs, la frise hachure le fond en violet — il y a deux barres au même endroit, on lit la plus haute."],
      ['Une fenêtre de tâche s’arrête le jour écrit', " : fin au 25 avril, le 25 travaille. Et les heures se répartissent au prorata des jours <b>travaillables</b> : une semaine de ponts en reçoit moins, les semaines pleines récupèrent le reste."],
      ['Le marqueur « hors période »', "dans la roue crantée, fenêtres des tâches, veut dire qu’une fenêtre enregistrée ne tombe pas dans cette période. La fenêtre par défaut s’applique à la place, et l’écran le dit au lieu d’écraser tout le travail sur un seul jour."],
      ['Décider', "— trois cartes, trois simulations : rien ne s’y enregistre. <b>La tournée du jour</b> suit l’ordre de la tournée que l’administrateur a choisie pour le travail (roue crantée de la Vigne › Tournées) ; ses tris sont un essai à l’écran. <b>Qui fait quoi</b> répartit l’équipe entre les priorités, et <b>le renfort</b> dit combien de saisonniers, et quand — aux heures du planning, sans heures sup, avec « Et sans renfort ? » pour comparer."],
      ['La tournée part du planning', " : le travail en priorité, le prochain jour travaillé, l’équipe affectée à la priorité et présente ce jour-là (congés et récup retirés), ses heures et sa coupure. Les trajets se calculent entre chaque parcelle et la suivante. Chaque case dit d’où vient sa valeur ; en toucher une passe l’écran en simulation, « Valeurs réelles » revient au planning."],
      ['L’anneau doré qui respire', "marque la parcelle commencée et pas finie, sinon la prochaine à faire\u00a0: sur la carte du domaine pour la priorité du moment, sur celle de la tournée pour les travaux cochés — c’est son n°\u00a01. Le départ de la tournée, lui, reste la dernière parcelle validée, sauf si vous en choisissez un autre."],
      ['Le rendement de la tournée', ": sous le résultat, la part du temps de l’équipe passée sur les parcelles face aux trajets, le coût de l’équipe et le revient à l’hectare. La même tournée « au plus proche » est calculée à côté, pour comparer ; un bouton prend cet ordre."],
      ['Un contrat de groupe compte pour son effectif', " : une fiche « équipe de vendange » à 40 vaut 40 personnes, pas une ligne. Et quand la fenêtre du travail n’est pas encore ouverte, la tournée se calcule sur son premier jour : on compte ceux qui seront là ce jour-là, pas ceux d’aujourd’hui."],
      ['Le manque d’effectif se lit sur la semaine du pic', ", contre ce qui est prévu au planning <b>cette semaine-là</b> — pas contre la présence d’aujourd’hui. Un pic qui tombe dans onze mois ne se compare pas à qui est là ce matin."],
      ['Le total de l’Exercice n’est pas un compte de résultat', ": Ma Vigne connaît ce qui passe par elle — heures payées, carburant, achats d’intrants. Ni le fermage, ni les amortissements, ni les assurances, ni vos cotisations d’exploitant. Ce total sert à <b>piloter vos charges d’un bilan à l’autre</b>, pas à remplacer votre comptable."],
      ['La carte de fiabilité d’Économie', ": elle relit la liste du bandeau <b>« à compléter »</b> — mêmes lignes, mêmes mots, mêmes boutons — et n’en garde que ce qui met un <b>poste de ce budget à zéro</b> : un taux horaire, le prix du GNR, une dose. Ce n’est pas « un peu bas » : c’est zéro, et le budget affiché n’est qu’un plancher. La puce « N remarques » en dessous ouvre tout ce qui n’empêche pas un calcul mais change sa lecture."],
      ['Économie', "compare un budget de barème à ce qui est engagé — les heures réellement passées dans les rangs au planning, validées ou non —, sur la <b>période consultée</b> — le coût d’un bilan entier se lit dans sa sous-vue <b>Exercice</b>. Quand l’écart est grand, c’est le barème qu’on corrige dans Réglages, jamais le taux horaire. Dans <b>Postes & travaux</b>, le <b>temps réel</b> de chaque travail — les heures du planning versées aux parcelles validées, au prorata de la surface — se lit à côté du h/ha du barème."],
      ['Économie › Exercice', "coupe l’année <b>au jour</b> : l’<b>engagé</b> (ce qui est sorti) à gauche d’aujourd’hui, le <b>prévu</b> (les salaires que la grille du planning annonce, et les amendements chiffrés pas encore facturés) hachuré à droite, et le total à la clôture qui dit qu’il contient du prévu. Contre l’an dernier, la comparaison se fait <b>aux mêmes jours</b>, pas dix mois de grille contre douze mois payés."],
      ['Économie › Revient', "répond à trois questions pour le millésime : combien de vin, combien de bouteilles, combien coûte chacune à la vigne. Tout se lit sur le <b>cycle</b> du millésime, d’une vendange à la suivante. Tant qu’une parcelle n’est pas récoltée, son rendement est la moyenne de ses millésimes connus — jamais le plafond — et les chiffres sont marqués <b>probable</b>. Le tableau se lit par appellation ; touchez une ligne pour voir ses parcelles. Deux réglages dans la roue crantée : les pertes d’élevage, et vos autres charges de l’année pour un coût complet indicatif. Une parcelle déclarée sans récolte cette année (Le Cuvier, «\u00a0Encore sur pied\u00a0») ne compte ni rendement ni bouteilles, et son coût se répartit sur les autres vignes."],
      ['La carte de verdict d’Économie', ": elle dit en une phrase où vous en êtes, et pose les boutons pour agir — voir quel travail dérape, ouvrir le barème. Quand la cadence affichée vient de la campagne précédente, une ligne sous le texte le dit, avec le nom de cette campagne. Le <b>comment</b> du calcul est derrière son petit « i »."],
      ['L’écart de cadence cherche sa source dans un ordre', ", et dit toujours laquelle il a trouvée. D’abord <b>la période en cours</b>, dès 40 % de barème réalisé. Sinon <b>la même période de la campagne précédente</b>, si elle est archivée — la ligne porte alors un <b>↩</b> et nomme la campagne : cet écart-là <b>se lit, il ne s’applique pas</b> au budget ni à la date de fin. Même règle quand le facteur sort de [0,5 ; 3] : un trou de saisie n’est pas une cadence, l’écran le dit. Sinon rien, et l’écran l’écrit plutôt que d’afficher un chiffre inventé."],
      ['Conformité', "suit le cuivre sur sept ans, le nombre de passages, le <b>registre phyto</b> et les délais de rentrée en cours. Le registre était rangé dans « L’équipe & le matériel » alors qu’il lit exactement les mêmes traitements que « Passages phyto » : il est désormais juste en dessous, en détail de ce total."],
      ['« Traiter ? » porte les cinq jours', ": la fenêtre de traitement était affichée à <b>deux endroits</b> — sur Aujourd’hui et dans le matériel — pour une seule source. C’est une décision du jour : elle reste dans Aujourd’hui. Le verdict du moment est en grand, les cinq jours à venir se déplient sous « les 5 prochains jours ». Rien n’a été retiré du calcul."],
      ['Le budget de l’année, mois par mois', ": dans <b>L’année</b>, deux courbes cumulées — le prévu au barème en tireté, la dépense réelle en trait plein. ⚠️ <b>L’écart n’est pas un dépassement</b> : le prévu ne chiffre que la vigne, la dépense porte tout le domaine, cave et atelier compris. L’écran l’écrit sous le graphe, et le « i » en donne le détail."],
      ['Cave', "n’est plus un onglet : une carte dans Aujourd’hui dit combien de gestes pressent et ouvre la Cave. Le millésime, ses courbes et le parc à fûts vivent chez eux — Cave › Le millésime, La Réserve › Fûts."],
      ['Archives', "empile les campagnes sur un même axe, du 1er août au 31 juillet : le décalage d’une année sur l’autre se lit d’un coup d’œil."],
      ['Le « i » est partout', ": chaque onglet suit la même règle — le chiffre, une ligne qui dit sur quoi il porte, le détail du calcul derrière le « i ». Dans <b>Décider</b>, chaque étape a le sien : il remplace les pavés « comment lire » qui séparaient le titre du graphique. La <b>légende des couleurs</b>, elle, reste affichée : on ne la lit pas, on la consulte."],
      ['Il se lit aussi sur téléphone', ": les chiffres du haut se rangent en une ligne qui défile, et le titre de l’onglet ne prend plus de place — la barre d’onglets le dit déjà. Le grand écran reste plus confortable pour les tableaux et les graphiques, mais vous n’avez plus à faire défiler un écran entier avant d’atteindre un chiffre."]
    ]
  },
  reglages: {
    ico: 'curseurs', titre: 'Réglages', ancre: 'reglages',
    points: [
      ['Les pieds marqués', " : dans la roue crantée de la Vigne, sous l’entreplantation, « Saisir les comptes » ouvre toutes les parcelles, un nombre chacune. Le crayon d’une tâche de repérage porte « Demander le nombre de pieds marqués » : celui qui valide une parcelle donne alors son compte. Les trous prévus sont le plus grand des deux chiffres : pieds marqués, ou trous percés à la tarière."],
      function () {
        return _mvAideSections('#regl-tabs-row .mvu-tab', 'onglets',
          "Ce qui n’appartient à aucun module : le domaine, l’équipe, votre compte.");
      },
      ['La mise à jour', "se fait toute seule : quand vous quittez l’application ou que vous y revenez, si aucune fenêtre n’est ouverte et que rien n’est en cours de saisie. Sinon, une barre « Nouvelle version prête » s’affiche au-dessus du menu (sur ordinateur, en bas de la barre de gauche) : un appui, quelques secondes. Ici, Moi › Application › Mise à jour vérifie à la main."],
      ['Les réglages de la Vigne et du Tracteur', "ne sont plus ici : chaque module les règle chez lui, par la roue crantée de son en-tête — tâches, barème et plantations pour la Vigne, parc, activités et chrono pour le Tracteur. La Cave fait pareil depuis peu."],
      ['Vos écartements', "ramènent les heures conseillées à votre densité réelle. Sans eux, le barème suppose 10 000 pieds à l’hectare — vos heures à vous, elles, ne bougent jamais."],
      ['Le barème de référence', "se choisit par région dans l’écran du barème, ouvert depuis « + Nouvelle tâche » par le lien « Voir le barème de la convention et vos écartements » : la Bourgogne ou la Gironde pour l’instant, chacune avec son texte source et sa date. C’est une référence, pas une règle : en changer ne modifie aucune de vos valeurs."],
      ['Le taux horaire d’un salarié', "porte une date. Une augmentation s’enregistre « à partir du » jour choisi : les heures déjà travaillées gardent l’ancien taux, et le coût d’un exercice clos ne bouge plus. La fiche liste tout ce que ce taux a valu ; pour corriger une simple faute de frappe sans créer d’augmentation, videz la date. Ces montants sont visibles des seuls administrateurs."],
      ['Le mot de passe initial', "d’un nouveau membre s’affiche une seule fois — notez-le avant de fermer."],
      ['Passer un membre en inactif', "plutôt que le supprimer conserve son historique."],
      ['Documents & impressions', "dans l’onglet Domaine rassemble tout ce que Ma Vigne sait sortir : ce qui est obligatoire en contrôle, vos états internes, et vos données brutes."],
      ['Le Journal des nouveautés', "dans l’onglet Moi, garde tout ce qui a changé, mois par mois. Une fenêtre ne s’ouvre plus que pour une grande nouveauté, au plus une fois par mois ; un point à vérifier attend sur l’Accueil jusqu’à « Vu » ; une pastille « Nouveau » marque une nouveauté là où elle se trouve."],
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
        // ★ AIDE-1 (§365) : l'icône se DESSINE. `ico` porte un nom du jeu d'icônes ('graphique') : échappé comme du
        //   texte, le mot s'écrivait en toutes lettres, en gros, à la place de l'icône. Même tuile que la fiche
        //   « Nouveau » (.mvi-ic) : une seule charte pour les deux feuilles.
        + '<span class="mvi-ic" aria-hidden="true">' + _mvIcon(a.ico, 18) + '</span>'
        + '<div><div class="modal-title">' + _escHtml(a.titre) + '</div>'
        + '<div class="modal-sub">Ce qu’on peut faire sur cet écran</div></div></div>'
        + (window._mvTutoAideBloc ? window._mvTutoAideBloc() : '')   // ★★★ TUTO-1 (§358) : « Me montrer comment faire »
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
       + _escHtml(p[0]) + '</b> ' + _mvAideTexte(p[1] || '') + '</span></div>';   // AIDE-1 (§365) : le gras écrit s'affiche en gras
  }
  h += '</div><div class="mva-foot">'
     + '<button type="button" class="mva-fbtn" id="mva-guide">' + _mvIcon('livre',16) + ' Guide complet</button>'
     + '<button type="button" class="mva-fbtn mva-bug" id="mva-bug">' + _mvIcon('bogue',16) + ' Un problème</button>'
     + '</div>';
  el.innerHTML = h;
  if (window._mvTutoAideBrancher) window._mvTutoAideBrancher(el);   // TUTO-1 : les tutos s'ouvrent dans cette même fenêtre
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
  // ★ TETE-3C (§475) — la bande campagne/date est SOUS l'en-tête depuis TETE-3B (§474) : ce sélecteur ne cherchait que DANS
  //   l'en-tête, et « ? Aide » avait disparu des huit modules sans qu'aucun contrôle le voie. Les deux places sont lues.
  var rows = document.querySelectorAll('.mod-header .mod-meta-row, .mod-header + .mod-meta-row');
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].querySelector('.mv-help-btn')) continue;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'mv-help-btn';
    // TUTO-1 (§358) : celui de l'Accueil porte un id — la pastille « Nouveau » des tutos s'y pose (une cible = un #id, ANN-1).
    //   Posé en JS (pas de HTML construit ici) : la cible s'écrit id="home-aide-btn" pour que mv-whatsnew-check la trouve.
    if (rows[i].closest && rows[i].closest('#page-home')) b.id = 'home-aide-btn';
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

  'cave.auj': { t: 'Ce qui presse', p: [
    'Une <b>cuve en macération</b> à froid n’est pas une fermentation : sa densité stable ne déclenche aucune alerte. « À surveiller » prévient seulement quand la macération dure plus que les jours posés à la création de la cuve. Le chiffre « à faire cette semaine » compte des <b>gestes</b> : une fin de fermentation estimée est un renseignement, pas un geste. Un <b>ouillage</b> qui tombe un samedi ou un dimanche est rappelé le vendredi, un jour férié la veille (le jour ouvré d’avant) ; le suivant se compte à partir de ce jour-là.',
    'Le verdict est un <b>constat</b>, jamais un jugement. Il suit un ordre fixe : un signe fort au Diagnostic du Chai (plusieurs indices qui vont ensemble) ; une fermentation qui ralentit ou une température haute, une malo qui ne descend plus ; puis les cuves sans relevé depuis hier ou avant ; puis, en vendange, le raisin encore sur pied ; puis les fûts dont le seuil d\u2019ouillage est dépassé ; puis une malo finie qui n\u2019a pas été soutirée ; puis une dose de SO\u2082 programmée cette semaine ; enfin les fûts en fin de vie. <b>Un geste passe devant un rappel de date.</b>',
    'Les <b>quatre semaines</b> viennent de ce qui est déjà saisi : les relevés de densité (fin de fermentation projetée sur les trois derniers, ralentissement détecté sur les deux derniers), le dernier ouillage et le seuil de chaque millésime, les analyses d\u2019acide malique, les soutirages et les dates de SO\u2082 posées avec eux.',
    'Une dose de SO\u2082 est <b>rappelée</b>, pas vérifiée : l\u2019application connaît la date que vous avez posée au soutirage, pas le geste. Enregistrer l\u2019opération « soufre » est ce qui l\u2019acquitte.',
    'Les <b>fûts en fin de vie</b> n\u2019ont pas de date : ils sont listés à part plutôt que rangés dans une semaine choisie au hasard. Une échéance inventée se croirait.',
    'Une cuve de moins de trois jours ou de moins de trois relevés n\u2019est pas projetable : l\u2019écran dit « démarrage », pas une date.',
    'Un <b>ouillage</b> est dû quand le délai d\u2019alerte du millésime est dépassé — chaque millésime a le sien, réglable dans la roue crantée, bloc Le Chai. Le volume à compléter est déduit de vos ouillages passés — ceux de la cuvée, sinon ceux du domaine, sinon 7\u00a0L par pièce —, et chaque fût y compte à <b>sa</b> contenance : un demi-muid de 500\u00a0L pour 2,2 pièces.',
    'Un <b>soutirage</b> se déclenche à la fin de la malo, pas à une date : la projection vient des valeurs d\u2019acide malique mesurées. Deux pentes sont calculées, la moyenne sur trois analyses projette la fin, les deux dernières détectent un blocage.'
  ] },


  'pil.capacite': { t: 'Capacité au pic', p: [
    'Le pic est la <b>semaine la plus chargée</b>, jamais une moyenne. Une moyenne annuelle n\u2019existe aucun jour de l\u2019année ; c\u2019est le pic qui décide d\u2019un recrutement.',
    'Cette carte montre le <b>pic à venir</b> : la semaine la plus chargée parmi celles qui ne sont pas encore finies. Sur un exercice, le pic est presque toujours la <b>vendange</b> — consultée en septembre, elle est derrière, et on ne recrute pas pour une semaine faite. Le pic de l\u2019exercice reste écrit en bas de la carte, daté et marqué <b>déjà passé</b> ; « Le renfort à prévoir » (Équipe & matériel), lui, le montre toujours en grand, c\u2019est son rôle.',
    'Le <b>nécessaire</b> vient du barème h/ha du domaine appliqué à la <b>surface totale</b> concernée par la tâche — pas à ce qui reste à faire. Il ne baisse donc pas à mesure que le travail avance : c\u2019est un besoin de planification, pas un reste à faire.',
    'Le <b>disponible</b> n\u2019est pas un comptage de têtes, c\u2019est le nombre d\u2019<b>équivalents temps plein</b> que l\u2019équipe délivre réellement cette semaine-là : horaire propre à chacun, congés, absences et contrats compris. Un mi-temps pèse un demi, un congé pèse zéro, une <b>équipe collective</b> pèse son effectif — une fiche « équipe de vendange » à 40 vaut 40 personnes, pas une ligne. La ligne juste en dessous donne l\u2019autre lecture, celle des <b>corps dans les rangs au plus fort de la semaine</b> : c\u2019est elle qui sert à faire un ordre de passage.',
    'Les personnes comptées <b>aujourd\u2019hui</b> sont celles qui sont <b>au champ</b> : hors bureau, hors absents.',
    '<b>Deux autres chiffres de cet écran ne se comparent pas à celui-ci.</b> Les personnes présentes aujourd\u2019hui : c\u2019est une autre date, et le pic peut tomber dans onze mois. La moyenne sur la campagne : c\u2019est une autre fenêtre. Les soustraire donne un chiffre faux — c\u2019est le défaut corrigé en août 2026, où « 46,3 personnes au pic » moins « 2 présentes » affichait « il en manque 44,3 » sur un domaine de quatre.'
  ] },

  'pil.cadence': { t: 'L\u2019écart de cadence', p: [
    'Il compare le <b>temps réellement passé</b> — les heures du planning, congés, arrêts, absences et jours de formation retirés — au <b>barème h/ha</b> du travail déjà fait. Un écart positif veut dire que l\u2019équipe a mis plus de temps que le barème ne le prévoit.',
    'Avant de comparer, deux sortes d’heures sont retirées : la <b>conduite tracteur</b>, mesurée par les sessions, et les <b>travaux à l’heure</b> — arrachage, désherbage manuel, effeuillage, vendange. Ceux-là n’ont rien au barème en face (l’accord du 2 octobre 2023 sur le travail à la tâche les laisse hors de la tâche, payés à l’heure) : laissés dans la comparaison, ils faisaient paraître l’équipe lente alors qu’elle était au tracteur ou à l’arrachage.',
    'Il cherche sa source dans un ordre, et <b>dit toujours laquelle il a trouvée</b>. D\u2019abord la période en cours, dès <b>40 % du barème réalisé</b> — en dessous, le travail fait ne ressemble pas assez à celui qui reste. Sinon la <b>même période de la campagne précédente</b>, si elle est archivée : la ligne porte alors un <b>\u21a9</b> et nomme la campagne. Sinon rien, et l\u2019écran l\u2019écrit plutôt que d\u2019inventer un chiffre.',
    'La cadence ne s\u2019applique qu\u2019au <b>reste de main-d\u2019œuvre à engager</b> — ni au tracteur, au GNR et au phyto, déjà extrapolés à l\u2019avancement, ni à ce qui est déjà dépensé : à 100 % d\u2019avancement, la projection retombe exactement sur l\u2019engagé. Sans cette règle, l\u2019écran annonçait une fin à 37 k\u20ac alors que 79 k\u20ac étaient déjà payés — sur la même carte.',
    '<b>Un biais assumé.</b> Une entrée de planning porte des heures, jamais une activité : la cave, l\u2019atelier et le bureau restent donc dans la présence, alors que le barème ne compte que la vigne. La présence est <b>surévaluée</b>, et l\u2019indicateur penche vers « barème un peu serré ». Sur une période où la cave tourne, l\u2019écart parle surtout d\u2019elle.',
    'Quand l\u2019écart est grand, c\u2019est le <b>barème</b> qu\u2019on corrige dans Réglages \u203a Tâches, <b>jamais le taux horaire</b>.',
    '<b>Une borne de bon sens.</b> Si le facteur (1 + écart) sort de <b>[0,5\u00a0; 3]</b>, l\u2019écart ne mesure plus une cadence mais un trou de saisie : il reste <b>affiché</b>, mais n\u2019est appliqué <b>ni au budget projeté, ni à la date de fin</b> \u2014 le reste à engager est compté au barème, et chaque écran le dit. Même règle pour un écart lu sur la campagne précédente : il se lit, il ne multiplie rien.'
  ] },

  // ⚠️ FICHE VIVANTE : ses paragraphes sont remplaces a chaque rendu par
  //   _pecAlertes (pilotage.js). Ce qui suit est le repli — il s'affiche si le
  //   module n'a pas encore tourne, et il doit rester vrai dans ce cas-la.
  // ★ ENG-2 (24/09/2026) — posée à côté du chiffre, dans la Synthèse (_pecViewSynthese).
  'pil.eco.engage': { t: 'Engagé à ce jour', p: [
    'La <b>main-d\u2019\u0153uvre</b> engagée, ce sont les heures <b>réellement payées</b> : pour chaque salarié vigne, ses heures dans les rangs au planning depuis le début de la période jusqu\u2019à aujourd\u2019hui — congés, absences et formation à zéro, bureau exclu — au <b>taux chargé</b> de sa fiche, celui qui valait ce jour-là.',
    'Qu\u2019une parcelle soit validée ou non n\u2019y change rien : une semaine de dégrafage pas encore validée est déjà payée. C\u2019est ce qui permet de lire l\u2019avance ou le retard : <b>30 % du budget engagé pour 15 % du travail fait</b>, c\u2019est du retard, en euros.',
    'Deux choses en sont retirées. La <b>conduite du tracteur</b>, comptée à part dans son propre poste. Les <b>journées de cave</b> : celles marquées au Planning — la journée, le matin ou l\u2019après-midi, d\u2019après l\u2019horaire du jour —, et un jour où le salarié figure parmi les intervenants d\u2019une opération du Chai (soutirage, ouillage…) : sa journée entière sort de la vigne, l\u2019opération ne disant pas combien de temps elle a pris.',
    'Le tracteur, le carburant et le phyto sont comptés comme avant. Le <b>budget</b>, lui, reste le barème : surface \u00d7 heures par hectare \u00d7 taux.',
    'Un jour d\u2019atelier ou de bureau d\u2019un salarié vigne n\u2019est écrit nulle part : il reste compté dans la vigne. Un salarié sans taux sur sa fiche est compté au taux moyen du domaine.'
  ] },

  // ★ TV-1 (23/09/2026) — posée sur la carte « Temps réel contre barème » (_pecCarteTemps).
  'pil.eco.temps': { t: 'Temps réel contre barème', p: [
    'Pour chaque salarié, chaque jour : ses heures <b>dans les rangs</b> au planning — congés, récup, arrêts, absences et formation à zéro — moins ses heures de <b>conduite tracteur</b>, déjà mesurées par les sessions. Le bureau n\u2019entre pas. Les <b>journées de cave</b> marquées au Planning en sortent — la journée, ou le matin, ou l\u2019après-midi d\u2019après l\u2019horaire du jour — et un jour où il figure sur une <b>opération du Chai</b>, sa journée entière.',
    'Ces heures sont versées aux parcelles <b>validées ce jour-là</b>. Une validation vaut pour toutes les personnes nommées : trois personnes une heure sur un are, c\u2019est trois heures sur ce travail. Quelqu\u2019un qui n\u2019est nommé sur aucune validation du jour voit sa journée partagée entre <b>toutes</b> les parcelles validées ce jour-là : valider pour l\u2019équipe sans la cocher ne fait pas perdre ses heures. Deux équipes cochées sur des parcelles différentes gardent chacune les leurs. Une parcelle validée par une session tracteur (« faite au tracteur ») ne reçoit pas d\u2019heures de l\u2019équipe : son temps est celui de la session. Une étape d\u2019arrachage faite par un <b>prestataire</b> non plus : elle se valide, mais n\u2019absorbe aucune heure de l\u2019équipe.',
    'Plusieurs parcelles validées <b>le même jour</b> se partagent la journée <b>au prorata du barème</b> : pour un même travail, c\u2019est la surface. Trois personnes huit heures sur 1 ha, 0,5 ha et 0,5 ha de taille : 24 h pour 2 ha, soit <b>12 h/ha</b> — contre 15 au barème, le travail est allé plus vite que la convention. Une taille et un relevage validés le même jour se partagent la journée selon ce que chacun demande au barème.',
    'Un <b>travail à l’heure</b> (arrachage, désherbage manuel…) n’a pas de barème : le jour où il partage la liste avec des travaux au barème, la journée se partage d’abord <b>à la surface</b> entre les deux, puis au barème entre les travaux au barème. Avant, il ne prenait rien, et la réparation validée le même jour ramassait les heures d’arrachage.',
    'Un jour où des <b>équipes</b> sont posées (Accueil — elles restent en place d\u2019un jour à l\u2019autre, jusqu\u2019au prochain réglage), chaque équipe garde ses parcelles : quelqu\u2019un qui n\u2019est pas dans le groupe d\u2019une validation n\u2019y met pas ses heures, il les garde pour ses propres validations. Une validation faite sans groupe ce jour-là prend l\u2019équipe de son auteur. Rien de posé : tout le monde est en Équipe 1, et les validations portent toute l\u2019équipe — la journée de chacun se partage entre les parcelles validées ce jour-là.',
    'Une validation marque la <b>fin</b> d\u2019un travail. Les jours où <b>personne</b> ne valide vont donc aux parcelles validées <b>ensuite</b>. Ce qui n\u2019a pas encore trouvé de validation reste <b>en attente</b>, affiché sous le tableau — jamais perdu, jamais compté deux fois.',
    'Pour le relevage et les travaux à passages, seul le niveau ou le passage <b>nouvellement fait</b> compte, et le barème est celui de ce niveau. Une validation annulée ne compte plus. Une parcelle <b>validée deux fois</b> sans annulation ne compte son barème <b>qu\u2019une fois</b> : le travail n\u2019a pas été fait deux fois. Revalidée le même jour qu\u2019une autre parcelle, elle ne prend rien de la journée ; seule ce jour-là, elle la reçoit.',
    'Quand l\u2019administrateur a découpé l\u2019<b>arrachage en étapes</b>, chaque étape est son propre travail : ses heures s\u2019affichent sur une ligne à part, sous la ligne Arrachage, avec son h/ha réel. Annuler une étape ne retire qu\u2019elle. Il n\u2019y a pas de barème : la colonne reste vide.',
    '<b>Celui qui valide compte dans le groupe</b>, sauf s\u2019il s\u2019est décoché : un administrateur qui valide pour l\u2019équipe sans être dans les rangs retire sa puce « Moi », et ses heures du jour restent en attente — elles ne rejoignent pas non plus la journée des autres. Les validations d\u2019avant ce réglage comptent leur auteur.'
  ] },

  'pil.eco.remarques': { t: 'Les remarques du moment', p: [
    'Aucune remarque à afficher pour l\u2019instant. Ouvrez l\u2019onglet Économie pour que cette fiche se remplisse.'
  ] },

  'pil.eco.fiabilite': { t: 'Fiabilité des chiffres', p: [
    'Chaque donnée manquante ne rend pas un chiffre <b>approximatif</b> : elle met un poste entier à <b>zéro</b>. Un budget auquel il manque la main-d\u2019\u0153uvre n\u2019est pas « un peu bas », il est faux.',
    'Cette carte relit la liste du bandeau <b>« à compléter »</b> en tête du module — les mêmes lignes, les mêmes mots, les mêmes boutons — et n\u2019en garde que ce qui met un poste de <b>ce</b> budget à zéro. « 2 des 3 choses à compléter » : les autres touchent les heures ou la conformité, pas les euros.',
    '<b>Taux horaire</b> — il vit dans la fiche de chaque salarié, Réglages \u203a Équipe. C\u2019est le taux <b>chargé</b> : le coût employeur, cotisations patronales comprises. Sans lui, la main-d\u2019\u0153uvre — le premier poste du domaine — compte pour zéro partout sur cet écran.',
    '<b>Prix du GNR</b> — il se déduit tout seul des <b>appoints de cuve</b> saisis dans Tracteur \u203a Entretien, en moyenne pondérée arrêtée à la date de chaque plein. Aucun appoint saisi, aucun prix : le carburant reste à zéro.',
    '<b>Les litres</b> — ils viennent des <b>pleins</b> notés sur les fiches d\u2019entretien, pas d\u2019une consommation théorique. Un plein non noté est du carburant absent du coût.',
    '<b>Doses et prix des produits</b> — le coût phyto se calcule à partir d\u2019une dose chiffrée à la saisie du traitement, et d\u2019un prix unitaire dans La Réserve. Il manque l\u2019un des deux, le traitement compte pour zéro. Une période sans aucun traitement (l\u2019hiver) n\u2019a rien à compléter : zéro est alors le vrai chiffre.',
    'Tant qu\u2019un de ces postes manque, lisez le budget affiché comme un <b>plancher</b>, jamais comme un total.'
  ] },

  // ⚠️ FICHE VIVANTE : remplie par _pexEntete (pilotage.js) a chaque rendu.
  // ══ SIMULER ══
  'pil.tournee': { t: 'La tournée du jour', p: [
    '<b>Le travail</b> : la priorité du moment, diffusée dans Vigne. Sans priorité, la seule tâche dans ses dates de travaux ; plusieurs en même temps, toutes sont cochées — l\u2019application ne choisit pas ; aucune, la prochaine.',
    '<b>Le jour</b> : aujourd\u2019hui s\u2019il est travaillé au planning, sinon le prochain jour travaillé. Si la fenêtre du travail n\u2019est pas encore ouverte, son premier jour : on compte ceux qui seront là ce jour-là.',
    '<b>L\u2019équipe</b> : les personnes affectées à la priorité qui travaillent ce jour-là au planning. Congés, récup, arrêts, absences et jours de formation sont retirés — on ne compte que ceux qui seront dans les rangs ; une absence sur une partie de la journée ne retire que ses heures. Une équipe collective compte son effectif du jour. Sans équipe affectée : tout le monde au champ.',
    '<b>Le travail par jour</b> : les heures prévues au planning, jour par jour et personne par personne. La coupure ne se retire pas du travail : elle allonge la présence.',
    '<b>Les trajets</b> : calculés entre chaque parcelle et la suivante, à vol d\u2019oiseau — à pied jusqu\u2019à 300 m (4 km/h), au-delà en camion (5 min + 25 km/h), 5 min pour une parcelle sans position. La case Trajets règle ces cinq valeurs.',
    '<b>La fin</b> : la tournée se déroule jour après jour avec l\u2019équipe du planning, puis se compare à la fenêtre de chaque travail coché. « Il faudrait N personnes » sort de la même simulation, relancée avec N personnes de plus.'
  ] },

  'pil.quifait': { t: 'Qui fait quoi', p: [
    'Chaque travail en priorité part de <b>son équipe affectée</b>, au planning du jour, avec sa tournée (enregistrée, sinon au plus proche) et le même calcul que la tournée du jour.',
    '<b>+</b> ajoute une personne à ce travail : d\u2019abord quelqu\u2019un sans priorité ce jour-là, puis un renfort. <b>\u2212</b> en retire une. La date de fin suit.',
    'Sans priorité diffusée, l\u2019équipe du jour est répartie également entre les travaux ouverts.',
    'Rien n\u2019est enregistré ici : l\u2019affectation se diffuse dans Vigne \u203a Priorité du moment.'
  ] },

  'pil.sim.frise': { t: 'Le calendrier du renfort', p: [
    'Chaque ligne dit <b>combien de saisonniers</b>, <b>de quand à quand</b>, pour <b>quel travail</b>, et ce que ça coûte. Il se calcule <b>tout seul</b>, sur ce qu’il reste à faire depuis aujourd’hui : aucun effectif ni aucune fenêtre à choisir avant de voir la réponse.',
    'La règle : tant qu’un travail déborde de sa fenêtre, on pose sur <b>sa</b> fenêtre — de son ouverture, ou d’aujourd’hui, à sa limite — le <b>moins de monde possible</b> qui le fait tenir, en plus de ce qui est déjà posé. Les semaines de même effectif se regroupent en périodes ; une semaine où le domaine est fermé coupe la période.',
    'L’équipe <b>déjà sous contrat</b> est comptée, saisonniers et vendangeurs déjà embauchés compris : le calendrier ne réclame que ce qui manque en plus.'
  ] },


  'pil.sim.semaine': { t: 'Semaine par semaine', p: [
    'Une colonne par semaine : en <b>vert</b> ce que fait l’équipe, en <b>doré</b> ce que fait le renfort du calendrier. Le <b>tireté</b> est ce que l’équipe peut faire aux heures du planning : il suit l’annualisation, les congés et les fermetures. Le <b>hachuré</b> marque une semaine où le domaine est fermé.',
    'La bande du haut redit l’effectif de chaque période. Aucune colonne ne passe le tireté sans doré : il n’y a pas d’heures sup dans ce plan.'
  ] },

  'pil.sim.cout': { t: 'Et sans renfort ?', p: [
    'Trois lignes à comparer : le renfort proposé ; l’équipe seule qui monte jusqu’au plafond choisi, en heures sup ; l’équipe seule sans heures sup. Pour chacune, ce que ça coûte en plus, et le retard qui reste.',
    'Le plafond proposé d’office est la <b>semaine la plus longue de votre planning</b>, lue dans le modèle. 43 h est la dernière heure à 25 % ; 48 h, le maximum légal d’une semaine.',
    'Les heures sup se comptent <b>comme le relevé</b> : au-delà du planning de la semaine, 25 % jusqu’à la 43<sup>e</sup> heure, 50 % au-delà, au coût moyen de l’équipe. Le travail en retard s’allonge du pourcentage réglé par semaine.',
    'Ce que la fiche ne chiffre pas : le coût du retard lui-même — travaux décalés, récolte. Et une limite : sur plusieurs semaines, la moyenne légale autorisée est plus basse que 48 h : l’application ne la vérifie pas.'
  ] },

  'pil.sim.plan': { t: 'Choisir moi-même la période', p: [
    'Pour une autre organisation que celle du calendrier : vous dites de quand à quand le renfort sera là, l’application donne le <b>plus petit nombre constant</b> de saisonniers qui fait tout tenir sur cette période. Même calcul, mêmes heures du planning, aucune heure sup.',
    'Une période plus courte demande plus de monde ; une période qui commence après la limite d’un travail ne peut plus le sauver.'
  ] },

  'pil.sim.modele': { t: 'Ce que le calcul suppose', p: [
    'Un saisonnier en <b>TESA</b> suit l’horaire de l’équipe : les heures du modèle de la semaine. En <b>CDD</b>, 35 h chaque semaine ouverte, quel que soit cet horaire.',
    'Il fait la <b>cadence d’un renfort</b> (85 % par défaut) de ce que fait un permanent sur la même heure — réglage de la roue crantée, comme son taux horaire et ses frais d’embauche.',
    'L’équipe compte aux <b>heures du planning</b> : modèle de chacun, congés, récup et fermetures retirés, tracteur déduit. <b>Aucune heure sup</b> dans le plan : le renfort sert justement à ne pas en faire.',
    'Le travail <b>avance dès que l’équipe a de la marge</b>, dans la fenêtre de chaque tâche. <b>Sauf les travaux sans rattrapage</b> — la vendange : ce qui n’est pas fait dans sa fenêtre est perdu, et c’est compté.'
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
  'cave.anges': { t: 'La part des anges', p: [
    'Ce que vous remettez en <b>ouillage</b> est exactement ce qui s\u2019est <b>évaporé</b> : c\u2019est une <b>mesure</b>, pas une valeur théorique tirée d\u2019un abaque.',
    'Chaque millésime a sa ligne — <b>on n\u2019ouille pas les fûts d\u2019une année avec le vin d\u2019une autre</b>.',
    '\u26a0\ufe0f Un <b>soutirage</b> retire aussi du volume sans être une évaporation. Sur un mois où vous avez soutiré, le chiffre est donc surévalué.',
    'Le calcul demande le <b>volume total saisi à chaque ouillage</b>. Sans lui, cet écran reste vide plutôt que d\u2019inventer une moyenne.',
    'Un millésime en fût depuis <b>moins d\u2019un an</b> n\u2019a pas douze mois d\u2019ouillages : la ligne donne le pourcentage <b>de la période réelle</b> (depuis l\u2019entrée en fût) et, à côté, son <b>équivalent annuel</b> (environ, en ligne droite). Les premières semaines, le bois neuf boit davantage : cet équivalent est un ordre de grandeur, pas une promesse.'
  ] },

  'cave.rdt': { t: 'Rendement face au plafond', p: [
    'Un rendement s\u2019affiche en <b>fourchette</b> tant que le volume n\u2019a pas été mesuré, et il ne l\u2019est qu\u2019<b>au décuvage</b> : avant, la cuve contient du raisin, pas du vin. Le chiffre net ne vient qu\u2019ensuite.',
      'Le volume <b>décuvé</b> est celui que vous saisissez dans la feuille «\u00a0Décuver\u00a0» — ou corrigez ensuite dans le détail de la cuve. Laissé vide, c\u2019est celui des contenants remplis, chaque fût compté à <b>sa</b> contenance.',
    'Chaque parcelle vendangée a sa ligne, du rendement le plus fort au plus faible. Ce n\u2019est pas la moyenne du domaine : elle est en tête de l\u2019écran, dans les quatre chiffres.',
    'Le <b>trait vertical</b> est le plafond que vous avez renseigné, <b>par parcelle et par millésime</b>. Ce n\u2019est pas une valeur du logiciel : le rendement annuel autorisé est fixé par arrêté, campagne par campagne.',
    'Un administrateur le pose <b>ici même</b>, en touchant une parcelle : c\u2019est cet écran qui montre lesquelles en manquent.',
    'Un plafond marqué <b>hérité</b> vient de l\u2019ancien réglage, celui qui ne portait aucune année. Il sert de repli tant qu\u2019aucune valeur n\u2019est posée pour le millésime, mais il n\u2019a été vérifié contre l\u2019arrêté d\u2019<b>aucune</b> campagne.',
    'L\u2019échelle va jusqu\u2019à <b>115 % du plafond</b> : c\u2019est ce qui permet à un dépassement de se voir déborder, au lieu d\u2019être écrasé contre le bord.',
    'Les parcelles <b>sans plafond renseigné</b> n\u2019entrent pas dans la comparaison — elles sont listées à part plutôt que comptées comme conformes.'
  ] },

  'cave.cuvees': { t: 'Les cuv\u00e9es du mill\u00e9sime', p: [
    'Une ligne par <b>cuve de vinification</b> du mill\u00e9sime choisi, avec ses parcelles \u2014 les cuves pas encore d\u00e9cuv\u00e9es, la r\u00e9colte sans cuve et le raisin vendu compris. Toucher une cuv\u00e9e ouvre sa fiche.',
    'Les quatre points de chaque ligne\u00a0: une \u00e9tape faite est pleine, celle en cours est cercl\u00e9e, un volume \u00e0 mesurer est cercl\u00e9 d\u2019orange, une \u00e9tape \u00e0 venir est vide.',
    'La cha\u00eene <b>De la r\u00e9colte \u00e0 la bouteille</b>\u00a0: les kilos d\u2019apr\u00e8s les caisses, puis ces kilos \u00e0 la r\u00e8gle du Cuvier (en cuve, estim\u00e9s, saign\u00e9es et vin vers\u00e9 \u00e0 une autre cuve d\u00e9duits), puis le volume <b>r\u00e9ellement entonn\u00e9</b> \u2014 le volume d\u00e9cuv\u00e9 mesur\u00e9 \u2014, puis les bouteilles. <b>Jamais la contenance de la cuve, jamais la taille des f\u00fbts.</b> Sans mesure, l\u2019\u00e9tape Entonn\u00e9 reste en pointill\u00e9 et la fiche propose de la saisir. Sous chaque \u00e9tape mesur\u00e9e, son <b>kg/hL</b>\u00a0: les kilos r\u00e9colt\u00e9s divis\u00e9s par ses hectolitres \u2014 ce que le pressoir a vraiment donn\u00e9, face \u00e0 votre r\u00e8gle. En rouge, ce que chaque \u00e9tape a perdu. Le vin d\u2019une autre cuve vers\u00e9 pour compl\u00e9ter un f\u00fbt s\u2019empile en pointill\u00e9 et n\u2019entre pas dans ce calcul.',
    'Juste dessous, son <b>hL/ha</b>\u00a0: ses hectolitres divis\u00e9s par la surface des parcelles qui ont rempli la cuve \u2014 la <b>part du domaine</b> seulement, les surfaces achet\u00e9es par un client retir\u00e9es. Une parcelle partie dans plusieurs cuves y compte <b>au prorata de ses kilos</b>. Sous \u00ab\u00a0D\u2019o\u00f9 vient la cuv\u00e9e\u00a0\u00bb, la surface compt\u00e9e de chaque parcelle, puis leur total. Tant qu\u2019une de ces parcelles n\u2019a pas de surface connue, pas de chiffre\u00a0: il serait trop haut.'
  ] },
  'cave.aoc': { t: 'Le rendement par appellation', p: [
    'Ce qui se <b>d\u00e9clare</b> (d\u00e9claration de r\u00e9colte, assurances)\u00a0: pour chaque appellation et chaque couleur, la <b>surface r\u00e9colt\u00e9e</b> et le <b>volume</b>, puis le hL/ha qui s\u2019en d\u00e9duit.',
    'Tout le raisin des parcelles r\u00e9colt\u00e9es compte, <b>vendu compris</b>, sur toute la surface de chaque parcelle\u00a0: le hL/ha d\u2019une appellation est la somme des lignes de ses parcelles, juste dessous. Ce n\u2019est pas le rendement moyen du haut de l\u2019\u00e9cran, qui ne garde que la part du domaine.',
    'Tant que tout n\u2019est pas mesur\u00e9 (le d\u00e9cuvage, les litres rendus par le client), le hL/ha est une <b>fourchette</b> et le volume une estimation\u00a0: la colonne Volume le dit.',
    'Le trait vertical est le <b>maximum de l\u2019appellation</b> pour ce mill\u00e9sime, r\u00e9gl\u00e9 dans la roue crant\u00e9e de la Cave, Appellations\u00a0; \u00e0 d\u00e9faut, celui que portent toutes ses parcelles, et la ligne le dit. Le plafond en hL/ha se juge sur l\u2019appellation enti\u00e8re\u00a0: une parcelle au-dessus ne fait pas, \u00e0 elle seule, un d\u00e9passement.',
    'Une parcelle <b>encore sur pied</b> reste hors du calcul \u2014 elle se d\u00e9clare \u00e0 part, avec son motif \u2014, une parcelle sans surface aussi\u00a0; chacune est compt\u00e9e sur sa ligne.',
    'La couleur vient du c\u00e9page de chaque parcelle, ou du choix fait dans les Maturit\u00e9s. Si le maximum d\u2019une appellation n\u2019est pas le m\u00eame en rouge et en blanc, d\u00e9clarez-la deux fois dans Appellations (Bourgogne rouge, Bourgogne blanc).'
  ] },
  'cave.maturite': { t: 'La moyenne des maturités', p: [
    'La moyenne des parcelles <b>mesurées dans la fenêtre choisie</b> (7 jours, 14 jours ou toute la vendange), <b>pondérée par leur surface</b> : une petite parcelle pèse moins qu’une grande.',
    'Ce n’est pas la moyenne du domaine : une parcelle jamais mesurée, ou mesurée avant la fenêtre, n’y entre pas, et une parcelle déjà rentrée non plus.'
  ] },
  'cave.courbes': { t: 'Les courbes de la cave', p: [
    'Chaque bloc porte <b>son propre jour z\u00e9ro</b>, \u00e9crit \u00e0 c\u00f4t\u00e9 de son titre. La vigne compte sur le calendrier, la cuve depuis l\u2019<b>encuvage</b>, le f\u00fbt depuis l\u2019<b>entonnage</b>. Les empiler sur un seul axe donnerait une \u00e9chelle qui ressemble \u00e0 une mesure sans en \u00eatre une.',
    'Sur un calendrier, une cuve entr\u00e9e le 16 et une autre le 24 n\u2019ont <b>aucun point commun</b>. Align\u00e9es sur leur propre J0, leurs cin\u00e9tiques se superposent et se comparent.',
    'La zone dor\u00e9e va de la <b>cuve la plus lente \u00e0 la plus rapide</b>, jour par jour ; le pointill\u00e9 est la <b>m\u00e9diane</b> du cuvage. Quinze traits nomm\u00e9s tenaient sur le cahier imprim\u00e9, pas sur un t\u00e9l\u00e9phone : la gouttière qui portait les noms est rendue au trac\u00e9.',
    'Un jour o\u00f9 une cuve n\u2019a pas \u00e9t\u00e9 relev\u00e9e, sa valeur est <b>estim\u00e9e entre ses deux relev\u00e9s voisins</b>, et l\u2019\u00e9tiquette la marque d\u2019un ~. Jamais avant le premier relev\u00e9, jamais apr\u00e8s le dernier : ce serait inventer. Les deux comptes sont donn\u00e9s \u2014 cuves dans le couloir, et cuves r\u00e9ellement relev\u00e9es ce jour-l\u00e0.',
    'Le couloir <b>s\u2019arr\u00eate quand il reste moins de trois cuves</b> suivies. Au-del\u00e0, minimum, m\u00e9diane et maximum se confondent : un couloir plat ferait croire \u00e0 une convergence alors qu\u2019il ne reste qu\u2019une cuve.',
    'Le tableau est class\u00e9 sur le <b>jour o\u00f9 le vin sec a \u00e9t\u00e9 relev\u00e9</b>, jamais sur la vitesse : une pente mesur\u00e9e sur trois jours n\u2019est pas comparable \u00e0 une pente mesur\u00e9e sur dix, et le d\u00e9but d\u2019une fermentation en est la phase la plus rapide.',
    'Le jour du vin sec est le jour <b>observ\u00e9</b>. Quand la cuve n\u2019y est pas encore, la colonne rappelle son dernier point au lieu d\u2019inventer une projection.',
    'Une cuve <b>sans date d\u2019encuvage est \u00e9cart\u00e9e</b>, et l\u2019\u00e9cran dit combien il en \u00e9carte. Une date devin\u00e9e se croirait ; une cuve absente se corrige.',
    'Sur les temp\u00e9ratures, un <b>palier de densit\u00e9</b> trouve souvent son explication : douze degr\u00e9s cinq jours durant, c\u2019est une mac\u00e9ration pr\u00e9fermentaire, pas une fermentation qui tra\u00eene.',
    '<b>Aucune temp\u00e9rature n\u2019est enregistr\u00e9e en \u00e9levage.</b> Ni l\u2019ouillage, ni le soutirage, ni le sulfitage, ni l\u2019analyse n\u2019en portent. La courbe s\u2019arr\u00eate au d\u00e9cuvage.',
    'Sur la malo, le trait est <b>tiret\u00e9</b> : entre deux analyses, personne n\u2019a mesur\u00e9. Une ligne pleine laisserait croire \u00e0 un suivi continu.',
    'La colonne \u00ab Vigne \u00bb est la derni\u00e8re analyse d\u2019avant encuvage de chaque parcelle de la cuve, <b>pond\u00e9r\u00e9e par la surface</b>. La part r\u00e9elle de chaque parcelle entr\u00e9e dans la cuve n\u2019\u00e9tant pas connue, c\u2019est un <b>ordre de grandeur</b>.'
  ] },

  // ══ LA CAMPAGNE ══
  'pil.avc.temps': { t: 'Où va le temps de l\u2019équipe', p: [
    'La répartition compte la <b>présence au planning</b>, découpée entre vigne, tracteur et le reste. Elle ne vient pas du journal : le journal dit <b>qui</b> a travaillé, jamais combien d\u2019heures.',
    '<b>Une moyenne n\u2019est pas un pic.</b> Cet écran donne une moyenne sur la campagne ; la <b>frise des 52 semaines</b>, dans « L\u2019année », donne la semaine la plus chargée — et c\u2019est elle qui décide d\u2019un recrutement.',
    'Le poste « Autres » se vide à mesure que vous renseignez un <b>barème h/ha par activité</b> dans Réglages \u203a Tracteur : tant qu\u2019il est vide, le tracteur ne peut pas être détaché du reste.'
  ] },

  'pil.eco.revient': { t: 'Le revient d’un millésime', p: [
    '<b>Arrachage et prestations</b> (ARRACH-5) : une prestation sur une vigne en place va \u00e0 cette vigne ; ce qu\u2019une vigne <b>arrach\u00e9e</b> a co\u00fbt\u00e9 sur le cycle (tracteur, phyto, prestataire) se r\u00e9partit \u00e0 la surface sur les vignes en place \u2014 elle ne donne pas de vin, le domaine en porte la charge. Les heures de l\u2019\u00e9quipe pass\u00e9es \u00e0 arracher \u00e9taient d\u00e9j\u00e0 dans la main-d\u2019\u0153uvre.',
    '<b>Pas de récolte cette année</b> (SANSREC-1) : une parcelle en place sans récolte saisie, dont la Vendange est désactivée pour chaque période de l’année qui la porte (Le Cuvier, «\u00a0Encore sur pied\u00a0»), ne donne pas de vin. Elle sort du rendement et des bouteilles, ne bloque pas le «\u00a0constaté\u00a0», et ce qu’elle a coûté sur le cycle se répartit poste par poste, à la surface, sur les autres vignes en place.',
    'Ce sont les <b>coûts de culture</b> : ce qu’il a fallu pour amener le raisin jusqu’au bout du rang. <b>Ni vinification, ni fûts, ni mise, ni foncier, ni amortissement</b> — ces postes-là ne passent pas par Ma Vigne. Le chiffre est un <b>plancher</b>.',
    'Tout se lit sur le <b>cycle du millésime</b> : du lendemain de la dernière récolte de l’an passé à la fin de la vendange. Pas sur la période consultée — un coût de dix jours divisé par une récolte entière ne veut rien dire. Sans récolte saisie l’an passé, le cycle part <b>un an avant sa fin</b>, et l’écran le dit.',
    'Le coût reprend ce que la campagne appelle l’<b>engagé</b> : les heures payées dans les rangs au planning (bureau, tracteur et journées de cave retirés), la conduite du tracteur, le carburant et les produits phyto. Tant que la vendange est à venir, s’y ajoute la <b>main-d’œuvre prévue</b> au planning jusqu’à sa fin prévue — le chiffre est alors marqué <b>projeté</b>.',
    '<b>Probable</b> tant qu’une parcelle n’est pas récoltée, <b>constaté</b> quand tout est rentré. Les millésimes précédents qui ont une récolte se choisissent en tête : en janvier, c’est l’an passé qu’on veut lire.'
  ] },

  'pil.eco.revrdt': { t: 'Le rendement probable, parcelle par parcelle', p: [
    'Chaque parcelle prend le meilleur chiffre disponible, dans cet ordre : <b>d’abord, récolté cette année</b> (le volume de la Cave, mesuré ou estimé au kg/hL) · <b>sinon, la moyenne de ses millésimes connus</b> (jusqu’à trois) · <b>sinon, la moyenne constatée cette année dans son appellation</b> · sinon <b>aucune estimation</b>, et la parcelle est comptée à part.',
    'Le <b>plafond de l’appellation</b> n’est jamais pris comme prévision : c’est un maximum réglementaire, pas ce que la vigne donnera. Il sert de repère dans la jauge.',
    'Le hL/ha est rapporté à la <b>parcelle entière</b>, comme dans la Cave. Les bouteilles, elles, ne comptent que la <b>part du domaine</b> : le raisin vendu en sort, et la part du coût qu’il porte aussi, au prorata des kilos. Une parcelle pas encore récoltée est comptée entièrement pour le domaine.',
    'Une parcelle sans estimation sort des bouteilles <b>et</b> de leur coût : diviser son coût par les bouteilles des autres gonflerait leur prix.',
    'Une parcelle <b>sans récolte cette année</b> n’est pas une parcelle sans estimation : elle ne donnera rien. Elle reste dans son appellation, marquée «\u00a0pas de récolte\u00a0», hors du hL/ha et des bouteilles, et son coût est réparti sur les autres vignes plutôt que retiré.'
  ] },

  'pil.eco.revconv': { t: 'Du raisin à la bouteille', p: [
    '<b>Kilos → hectolitres</b> : le rapport kg/hL réglé au Cuvier (le milieu de la fourchette), pour tout ce qui n’a pas de volume mesuré. C’est la même règle que la Cave : les deux écrans comptent les mêmes bouteilles.',
    '<b>Pertes d’élevage</b> : la part des anges <b>mesurée</b> sur le dernier millésime entièrement mis en bouteille, s’il y en a un ; sinon le réglage (5 % par défaut, dans la roue crantée).',
    '<b>Hectolitres → bouteilles</b> : 1 hL donne 133 bouteilles de 75 cl.',
    'Avant, Économie utilisait sa propre hypothèse, 1,3 kg de raisin par bouteille : elle comptait environ 28 % de bouteilles de moins que la Cave. Il n’y a plus qu’une règle.'
  ] },

  'pil.eco.revcout': { t: 'Ce que coûte une bouteille à la vigne', p: [
    'Le coût de chaque parcelle est divisé par ses bouteilles, puis additionné par appellation : un Gevrey à 36 hL/ha et un Bourgogne à 49 hL/ha n’ont pas le même prix de revient, et une moyenne le cacherait.',
    'Les heures qui attendent encore une validation sont réparties entre parcelles comme celles déjà versées ; le carburant, aux heures machine ; la main-d’œuvre prévue, à la surface. La vigne entière a coûté ces heures : elles ne se perdent pas.',
    'Attention : la main-d’œuvre <b>prévue</b> ne connaît ni le tracteur ni la cave à venir : elle est plutôt haute.',
    'Les <b>autres charges de l’année</b>, si vous les saisissez dans la roue crantée (fermage, cave, amortissements, structure — un seul montant), donnent un <b>coût complet indicatif</b>. Ce n’est pas un calcul de comptable : c’est un ordre de grandeur, pour le comparer à un prix de vente.'
  ] },

  'pil.eco.postes': { t: 'Le coût de la campagne', p: [
    '<b>Prestations</b> (ARRACH-4) : ce qu\u2019un prestataire a factur\u00e9 pour une \u00e9tape d\u2019arrachage, \u00e0 la date de l\u2019\u00e9tape. Le poste n\u2019appara\u00eet que s\u2019il y en a. Pas de pr\u00e9vu : son budget est ce qu\u2019il a co\u00fbt\u00e9. Une \u00e9tape annul\u00e9e ne compte plus ; revalid\u00e9e, elle ne compte qu\u2019une fois. Un montant non saisi n\u2019est pas z\u00e9ro : il est dit \u00e0 part.',
    '<b>Travaux à l’heure</b> : arrachage, désherbage manuel, effeuillage, vendange — sans barème, payés à l’heure. Leurs heures, versées par le temps réel, sortent de la main-d’œuvre vigne et ont leur ligne ; pas de prévu : leur budget est ce qu’ils ont coûté, comme une prestation. Le poste n’apparaît que s’il y en a.',
    'Cet écran chiffre le <b>coût de culture</b> d\u2019une campagne : ce qu\u2019il faut de main-d\u2019œuvre, de tracteur, de carburant et de produits pour mener le raisin au bout du rang.',
    'Les <b>achats</b>, les <b>réparations</b> et les <b>fûts</b> n\u2019y sont pas, et ne peuvent pas y être : ils portent une <b>date</b>, ce budget n\u2019en porte aucune — c\u2019est un barème, pas un relevé. Ils se comptent dans <b>Exercice</b>, d\u2019un bilan à l\u2019autre, avec les salaires.',
    'Les quatre postes ne sont pas connus de la même façon, et c\u2019est ce qui explique leurs écarts de fiabilité.',
    'La <b>main-d\u2019\u0153uvre vigne</b> est budgétée au <b>barème complet</b> : surface \u00d7 heures par hectare \u00d7 taux de l\u2019équipe, sur toute la période — y compris le travail qui reste à faire. Son <b>engagé</b>, lui, vient des heures payées du planning (voir « Engagé à ce jour »).',
    'Le <b>tracteur</b> et le <b>phyto</b> ne sont connus qu\u2019en <b>réalisé</b> : ils n\u2019existent que là où une session ou un traitement a été saisi. Au-delà de <b>15 % d\u2019avancement</b>, ils sont extrapolés au rythme constaté ; en dessous, ils affichent le réalisé seul, parce qu\u2019extrapoler sur trois sessions ne veut rien dire.',
    'Le <b>GNR</b>, lui, est <b>mesuré</b> : c\u2019est la somme de vos pleins, au litre près. Ce qui reste approché, c\u2019est sa <b>répartition</b> entre parcelles — un plein est rattaché à une machine et à une date, jamais à une parcelle. Le total est juste, sa ventilation est proportionnelle aux heures machine.',
    'Tant qu\u2019<b>aucun plein n\u2019est relevé</b> sur la période, le carburant repasse à l\u2019ancien calcul — heures × consommation × prix — et la ligne affiche «\u202fL ESTIMÉS\u202f». Le mot est là pour être lu.',
    'Un poste extrapolé <b>montera mécaniquement</b> au fil de la période. Ce n\u2019est pas une dérive.'
  ] },

  'pil.eco.travaux': { t: 'Le coût par travail', p: [
    'Le total d\u2019une parcelle dépend surtout de sa <b>taille</b> : une grande parcelle coûte cher parce qu\u2019elle est grande. Le coût d\u2019un <b>travail</b>, lui, se décide — mécaniser, prendre un renfort, changer la conduite. C\u2019est là qu\u2019il y a des choix à faire.',
    'Le <b>budget</b> est un <b>barème</b> : surface \u00d7 heures par hectare \u00d7 taux moyen de l\u2019équipe qui l\u2019a faite.',
    'Le <b>réalisé</b>, lui, est ce que le travail a <b>coûté</b> : les heures du planning versées aux parcelles validées (la règle de « Temps réel contre barème »), chacune au <b>taux chargé</b> du salarié ce jour-là. Un travail pas encore validé n\u2019a pas encore de réalisé.',
    'L\u2019<b>écart</b> = réalisé \u2212 barème du travail <b>fait</b>. Les deux portent sur le même travail, celui qui est validé : <b>+</b> veut dire plus cher que prévu, <b>\u2212</b> moins cher. Sur le graphique, le trait vertical marque le barème du fait, et ce qui dépasse le budget est en rouge.',
    'Les heures payées qui <b>attendent une validation</b> sont dans l\u2019engagé, mais sur aucun travail encore : leur montant est écrit sous le tableau. Sans planning ouvert, le réalisé retombe au barème et l\u2019écart ne se lit pas.',
    '<b>Main-d\u2019\u0153uvre vigne uniquement.</b> Le tracteur, le GNR et le phyto ne sont pas répartis par travail : ils n\u2019en portent pas la trace.',
    'Quand un travail dépasse durablement son barème, c\u2019est le <b>barème</b> qu\u2019on corrige dans Réglages \u203a Tâches — jamais le taux horaire.'
  ] },

  'pil.eco.parcelles': { t: 'Le tableau des parcelles', p: [
    'Une parcelle <b>arrach\u00e9e</b> a sa ligne quand elle a co\u00fbt\u00e9 sur la p\u00e9riode (heures vers\u00e9es, tracteur, phyto, prestation). Elle n\u2019a pas de bar\u00e8me et sa surface n\u2019entre pas au total : le co\u00fbt \u00e0 l\u2019hectare du domaine reste celui des vignes en place. La colonne <b>Presta.</b> porte ce que les prestataires ont factur\u00e9.',
    '<b>Cliquez sur un en-tête</b> pour trier. Recliquer la même colonne inverse le sens.',
    '<b>MO</b> = main-d\u2019\u0153uvre <b>payée</b> pour la parcelle : les heures du planning versées à ses validations, au taux du jour. <b>Écart</b> = cette MO \u2212 le barème du travail fait (<b>+</b> = plus cher que prévu) ; les heures d’un <b>travail à l’heure</b> (arrachage…) restent dans la MO de la parcelle, jamais dans son écart. <b>Reste</b> = main-d\u2019\u0153uvre <b>encore à faire</b>, au barème. <b>Budget</b> = le barème de la période.',
    '<b>Tracteur et phyto</b> sont du <b>réalisé</b> : seulement ce qui a été saisi, sans projection. Le <b>GNR</b> est l\u2019enveloppe réelle de vos pleins, répartie entre les parcelles au prorata des heures machine — à défaut d\u2019heures saisies, au prorata de la <b>surface</b>.',
    'Le <b>coût à l\u2019hectare</b> neutralise la taille. Ce qui reste, c\u2019est ce qu\u2019une parcelle a de particulier : plants à remplacer, passages en plus, équipe plus chère, tri des tâches.',
    'La <b>MO</b> d\u2019une parcelle suit la règle du temps réel : la journée de ceux qui sont dans les rangs se partage entre les parcelles <b>validées ce jour-là</b>, au prorata du barème, et les jours sans aucune validation vont aux parcelles validées ensuite. Une parcelle chère ou bon marché dit donc ce que l\u2019équipe y a passé entre deux validations — d\u2019où l\u2019intérêt de valider chaque parcelle le jour où elle est finie. Une validation « faite au tracteur » n\u2019entre pas dans ce partage : le temps de la machine est compté par la session.'
  ] },

  'pil.exo.postes': { t: 'Les postes de l\u2019exercice', p: [
    '<b>Prestations</b> : ce qu\u2019un prestataire a factur\u00e9 pour une \u00e9tape d\u2019arrachage, \u00e0 la date de l\u2019\u00e9tape, rang\u00e9 \u00e0 l\u2019atelier vigne. Avec son num\u00e9ro, la facture ne peut pas \u00eatre saisie une seconde fois dans La R\u00e9serve, et l\u2019inverse.',
    '<b>Quatre postes toujours présents</b> : les salaires, le carburant, les achats d\u2019intrants et les réparations (les passages chez le réparateur, à leur date de retour). Deux s\u2019ajoutent quand ils existent : la <b>location de fûts</b>, au prorata des jours de contrat, et les <b>fûts achetés</b> si vous avez choisi de les compter.',
    'La <b>conduite</b> du tracteur est déjà dans les salaires — c\u2019est du temps de travail payé. La compter une seconde fois au poste tracteur reviendrait à <b>payer deux fois le tractoriste</b>. Seul son <b>carburant</b> s\u2019ajoute.',
    'Le graphique <b>mois par mois</b> montre ce qui est sorti, à la date où c\u2019est sorti. Un exercice viticole n\u2019est pas régulier : la taille en hiver, les vendanges à l\u2019automne, un creux en été. Ces bosses sont normales — c\u2019est justement ce qu\u2019on vient regarder.',
    'Sur un exercice <b>en cours</b>, l\u2019année est coupée <b>au jour</b> : à gauche d\u2019aujourd\u2019hui, l\u2019<b>engagé</b> — ce qui est sorti, à sa date ; à droite, le <b>prévu</b> — les salaires que la grille du planning annonce jusqu\u2019à la clôture, hachurés. Un mois entamé est coupé au jour, jamais compté d\u2019un seul côté. Le carburant et les réparations n\u2019ont pas de prévu : Ma Vigne ne connaît que ce qui est sorti. Un amendement enregistré avec un prix (Phyto \u203a Fertilisation) entre au prévu des achats, à sa semaine prévue, et en sort dès que sa facture est saisie dans La Réserve : jamais compté deux fois.',
    'Contre l\u2019an dernier, deux comparaisons : <b>à date comparable</b> — ce qui est sorti aux mêmes jours après l\u2019ouverture — et l\u2019<b>exercice complet</b>, qui contient du prévu et le dit.'
  ] },

  'pil.exo.ateliers': { t: 'Vigne, cave, tracteur — et ce que ça ne dit pas', p: [
    'Cette carte lit <b>les mêmes euros</b> que celle du dessus, autrement. Par <b>nature</b>, elle répond à « qu\u2019ai-je payé » ; par <b>atelier</b>, à « pour quoi ». Deux lectures, jamais deux totaux : la somme des ateliers est exactement celle des sources, et la ligne de contrôle l\u2019affiche sous le tableau.',
    '<b>L\u2019atelier ne se saisit pas</b>, il se déduit. Un produit phyto part sur la vigne, un produit œno dans la cave, le carburant au tracteur. Une intervention passe au tracteur d\u2019office, parce qu\u2019une machine chez le réparateur, c\u2019est le tracteur qui coûte.',
    '<b>Les salaires n\u2019y sont pas, et ce n\u2019est pas un oubli.</b> Une entrée de planning porte des heures, un type de congé, un motif d\u2019absence — jamais une activité. Rien ne dit si une journée est partie à la vigne ou à la cuverie. Seule la conduite du tracteur est mesurée, et elle <b>reste</b> dans la masse salariale : ici on ne compte que son carburant, sinon la même heure serait payée deux fois.',
    '<b>« Non affecté » est affiché exprès.</b> Sans ce seau, un achat qui ne rentre dans aucune case serait rangé de force ailleurs, et le total mentirait avec l\u2019autorité d\u2019un chiffre.',
    'Ce qui <b>n\u2019entre pas</b> : le matériel et les outils portés. Les fûts <b>achetés</b> n\u2019entrent que si vous l\u2019avez demandé — <em>Pilotage \u203a Économie \u203a Paramétrage</em>, « un fût acheté, comment le compter ». Une <b>location</b> de fûts, elle, entre toujours : c\u2019est un loyer, il revient tous les ans. Il est calculé au prorata des jours de contrat, sur les fûts que vous détenez.'
  ] },

  'pil.exo.salaires': { t: 'Heures payées, heures travaillées', p: [
    'Les <b>heures payées</b> incluent les congés payés, les récupérations et les absences rémunérées. Les <b>heures travaillées</b> ne comptent que le travail effectif.',
    'Le <b>bureau</b> y est, avec sa pastille : on chiffre une masse salariale, et un salaire est un salaire. Il reste <b>hors</b> de tout ce qui mesure la vigne \u2014 capacité, pic, cadence, renfort.',
    'L\u2019écart entre les deux, ce sont donc précisément <b>les congés et les absences rémunérées</b>. Il est normal ; c\u2019est son évolution qui parle.',
    'Une <b>ligne d\u2019équipe</b> compte son effectif réel, jour par jour : une équipe de quatre sur trois jours vaut douze journées-personne, pas trois.',
    '\u{1F512} Ce tableau nomme la rémunération de chaque personne : il est réservé aux administrateurs, comme partout ailleurs dans Ma Vigne.'
  ] },

  'pil.camp.mois': { t: 'Le mois o\u00f9 s\u2019ouvre votre ann\u00e9e vigne', p: [
    'Votre domaine a <b>deux ann\u00e9es</b>, et elles ne r\u00e9pondent pas \u00e0 la m\u00eame question. L\u2019<b>exercice comptable</b> est celui de votre bilan, fix\u00e9 par votre comptable. L\u2019<b>ann\u00e9e vigne</b> est un cycle de production : c\u2019est l\u2019axe des Archives et du bilan de campagne.',
    'Ce qui borne un cycle, c\u2019est la <b>vendange</b> : le mois d\u2019ouverture n\u2019en est que la traduction en calendrier. Par d\u00e9faut la campagne s\u2019ouvre le <b>1<sup>er</sup> ao\u00fbt</b> ; sur ce cadre, la vendange tombe dans les premiers jours : elle <b>ouvre</b> l\u2019ann\u00e9e au lieu de la clore, et la campagne associe une r\u00e9colte aux travaux qui feront la <b>suivante</b>.',
    'L\u2019\u00e9cran vous dit o\u00f9 tombe <b>votre</b> vendange dans le cadre choisi \u2014 elle l\u2019ouvre, elle la cl\u00f4t, ou elle est <b>coup\u00e9e en deux</b> par la borne. Le mois propos\u00e9 est celui qui suit la fin de vos vendanges, lu dans vos propres dates : ce n\u2019est pas un mois choisi d\u2019avance.',
    'Une vendange coup\u00e9e en deux campagnes n\u2019a, elle, aucune raison d\u2019exister : contrairement \u00e0 l\u2019exercice comptable, <b>rien d\u2019ext\u00e9rieur ne vous impose ce cadre</b>.',
    'Ce que ce r\u00e9glage change : les <b>Archives</b>, le <b>bilan de campagne</b>, les fen\u00eatres propos\u00e9es dans les documents dat\u00e9s, et le mill\u00e9sime consid\u00e9r\u00e9 comme «\u00a0en cours\u00a0» pr\u00e8s d\u2019une bascule.',
    'Ce qu\u2019il ne change <b>pas</b> : le mill\u00e9sime d\u2019un vin, qui reste l\u2019ann\u00e9e civile de sa vendange \u2014 une campagne en contient toujours deux ; vos <b>p\u00e9riodes de travail</b>, qui gardent leurs dates ; et votre exercice comptable, qui se r\u00e8gle juste au-dessus.',
    'Attention : le d\u00e9placer <b>recadre des chiffres d\u00e9j\u00e0 affich\u00e9s</b> : une m\u00eame journ\u00e9e de travail peut passer d\u2019une campagne \u00e0 l\u2019autre. Rien n\u2019est perdu, tout est recompt\u00e9.'
  ] },

  'doc.fenetres': { t: 'Sur quelle p\u00e9riode porte un document', p: [
    'Trois cadres vous sont propos\u00e9s, et ils portent chacun leur nom. La <b>campagne</b> est votre ann\u00e9e vigne, l\u2019axe des Archives. L\u2019<b>exercice comptable</b> est celui du bilan. La <b>p\u00e9riode de travail</b> est l\u2019une de vos saisons dat\u00e9es \u2014 un printemps, un hiver \u2014, jamais une ann\u00e9e enti\u00e8re.',
    'Quand deux cadres tombent aux <b>m\u00eames dates</b>, la liste le dit plut\u00f4t que de masquer une ligne : deux r\u00e9ponses identiques \u00e0 deux questions diff\u00e9rentes, c\u2019est une information.',
    'Le nombre annonc\u00e9 sous chaque choix est <b>compt\u00e9 pour de vrai</b>, avant d\u2019imprimer. C\u2019est ce qui \u00e9vite de sortir trente pages pour d\u00e9couvrir qu\u2019on avait pris la mauvaise fen\u00eatre.',
    'Une saisie <b>sans date</b> n\u2019appartient \u00e0 aucune fen\u00eatre : elle sort du document born\u00e9, et le document le dit au lieu de la taire.'
  ] },

  'doc.journal': { t: 'Le journal des interventions', p: [
    'La <b>liste</b> de ce qui a \u00e9t\u00e9 fait, jour par jour, sur la fen\u00eatre que vous choisissez. \u00c0 c\u00f4t\u00e9 : le <b>bilan de campagne</b> r\u00e9sume la m\u00eame mati\u00e8re t\u00e2che par t\u00e2che, et le <b>fichier Excel du journal</b> sort tout l\u2019historique sans bornes, pour le retrier vous-m\u00eame.',
    'Trois sections, <b>trois sources distinctes</b> : les travaux valid\u00e9s au journal, les sessions du module Tracteur, les traitements. Elles <b>ne s\u2019additionnent pas</b> \u2014 un rognage peut figurer \u00e0 la fois en session tracteur et en travail valid\u00e9. Le document donne trois compteurs nomm\u00e9s, jamais leur somme.',
    'La <b>surface cumul\u00e9e</b> additionne les passages : une parcelle relev\u00e9e trois fois compte trois fois sa surface. C\u2019est l\u2019effort r\u00e9el, pas un doublon \u2014 le nombre de <b>parcelles touch\u00e9es</b>, lui, ne les compte qu\u2019une fois.',
    'N\u2019y figurent pas : les travaux <b>non valid\u00e9s</b> (en cours, annul\u00e9s) et les relev\u00e9s m\u00e9t\u00e9o.',
    '\u00c9tat interne : il pr\u00e9sente ce que vous avez saisi et ne tient lieu d\u2019aucune d\u00e9claration. Pour un contr\u00f4le phyto, c\u2019est le <b>registre phytosanitaire</b> qui fait foi.'
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
    'Ma Vigne connaît <b>ce qui passe par elle</b> : les heures payées, le carburant, les achats d\u2019intrants, les réparations et les loyers de fûts. C\u2019est déjà l\u2019essentiel de vos charges d\u2019exploitation, et c\u2019est ce qui se pilote au fil de l\u2019année.',
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
    'Le compte est celui des personnes <b>au champ aujourd\u2019hui</b> : hors bureau, hors absents. Une équipe collective compte pour son effectif réel. Une personne que le planning ne prévoit pas ce jour-là (week-end, jour sans heures au modèle) n\u2019est comptée ni présente ni absente ; un jour où personne n\u2019est prévu, la carte le dit.',
    'La source est le <b>planning</b>, jamais le journal. Le journal dit qui a travaillé sur quoi ; il ne dit pas combien d\u2019heures ni qui était là.',
    '<b>Ce chiffre ne se compare ni au pic ni à la moyenne</b> affichés ailleurs sur cet écran : ce sont d\u2019autres fenêtres. Le pic peut tomber dans onze mois.'
  ] },

  'pil.tracteur': { t: 'Parc tracteur', p: [
    'Le compte inclut les machines de traitement, signalées « pulvé ».',
    'Les heures avant révision partent du <b>dernier relevé</b> du compteur, plus les heures notées par les sessions depuis (chrono, sinon barème), corrigées par l\u2019écart appris à chaque relevé — la route et le ralenti tournent au cadran sans être notés. Une session oubliée n\u2019avance pas l\u2019estimation : l\u2019échéance paraît plus loin qu\u2019elle n\u2019est, jusqu\u2019au prochain relevé, que Ma Vigne demande une fois par jour.',
    'Une machine <b>en réparation</b> reste dans le parc et dans le compte — elle existe toujours, elle n\u2019est simplement pas disponible. Le nombre en orange à côté du total dit combien.'
  ] },

  'pil.gnr': { t: 'Cuve GNR', p: [
    'Le niveau est <b>calculé, pas mesuré</b> : appoints de cuve saisis, moins les <b>pleins</b> faits dans les machines. Il n\u2019y a pas de jauge connectée à la cuve. Un plein oublié le fait dériver — pas une session non saisie, qui ne touche jamais le niveau.',
    'Le <b>seuil bas</b> est celui que vous avez réglé dans Tracteur \u203a Entretien, pas une valeur du logiciel.',
    'Le prix au litre est la <b>moyenne pondérée des appoints</b>, arrêtée <b>à la date de chaque plein</b> : un plein de mars ne se valorise pas au prix moyen incluant les livraisons de septembre. Sans aucun appoint, le carburant reste à <b>zéro</b> dans tous les coûts — pas «\u202fà peu près\u202f», à zéro.',
    'Ces mêmes pleins <b>sont</b> le coût carburant du Pilotage. Un plein non noté n\u2019est pas seulement un niveau de cuve faux : c\u2019est du carburant absent de vos coûts.'
  ] },



  'pil.dzrdt': { t: 'Rendement de la tournée', p: [
    'Tout se lit sur la <b>même simulation</b> que le résultat juste au-dessus : l’équipe du planning de chaque jour, les trajets entre chaque parcelle et la suivante, à pied ou en camion selon la règle des trajets.',
    'La barre partage le temps de l’équipe entre les parcelles (vert) et les trajets (à pied, en camion ; hachuré quand une parcelle n’a pas de GPS et que le trajet est estimé). Le trajet est du temps de toute l’équipe : tout le monde se déplace.',
    'Coût de l’équipe = heures de chacun × son taux horaire à cette date ; le <b>taux moyen</b> pour qui n’a pas de taux propre et pour les personnes ajoutées dans la simulation. La tournée ne paie que la part du jour qu’elle occupe : le dernier jour, l’équipe passe à autre chose.',
    'Revient à l’hectare = ce coût ÷ la surface de la tournée. C’est la main-d’œuvre du travail coché, ni le carburant ni les produits.',
    'La ligne « Au plus proche » refait la même tournée dans l’ordre du tri du même nom. En gras, le meilleur des deux.'
  ] },

  'pil.carte': { t: 'Carte du domaine', p: [
    'Le chiffre est l’avancement de la campagne. La carte, elle, se lit de cinq façons : choisissez la vue au-dessus, la légende suit.',
    '<b>Avancement</b> : la couleur habituelle des parcelles. <b>Dernier traitement</b> : les jours depuis la dernière intervention du registre phyto sur la parcelle, toutes campagnes confondues — vert le jour même, rouge à partir de 14 jours.',
    '<b>Cépage</b> : celui de la fiche parcelle. <b>Passages phyto</b> : les passages de la campagne, comptés comme dans Conformité, face à votre référence. Ce sont des passages, pas un IFT : le registre ne porte pas de dose de référence par produit.',
    '<b>Coût / ha</b> : ce que la parcelle a coûté jusqu’ici à l’hectare, comme dans Économie › Parcelles. L’échelle va de la parcelle la moins chère à la plus chère.',
    'Une parcelle sans donnée reste grise : un vide n’est pas un zéro. Zéro passage, lui, est une mesure et garde sa couleur.'
  ] },

  'pil.prot': { t: 'Protection restante', p: [
    'Pour chaque parcelle : le <b>dernier traitement du registre</b> qui la concerne, et sa rémanence. Ce qu’il reste = la rémanence moins les jours écoulés. À zéro ou moins, la parcelle est <b>à nu</b>.',
    'Trois rémanences, par <b>mode d’action</b>, réglées dans Réglages › Pilotage › Conformité : contact (cuivre, soufre, folpel…), pénétrant (cymoxanil, mandipropamid…), systémique (phosphonates, méfénoxam…). Par défaut 10, 12 et 14 jours, d’après les étiquettes, l’IFV et les Chambres d’agriculture.',
    'Le mode d’action est <b>déduit de la substance active</b> du produit, sinon de son nom. Substance inconnue : contact, la rémanence la plus courte, et un « ? » le dit. Un traitement protège aussi longtemps que son produit le plus rémanent.',
    'La <b>pluie</b> tombée après le jour du traitement, jusqu’aux heures déjà passées d’aujourd’hui, est lue chez Météo-France via Open-Meteo (15 derniers jours, rafraîchie chaque heure). Un <b>contact</b> est lessivé — à nu — dès le seuil réglé (20 mm par défaut ; la moitié part dans les 5 premiers mm). Un pénétrant ou un systémique ne se lessive pas. Pluie inconnue (pas de réseau, un jour manquant) : les jours seuls, et l’écran le dit.',
    'Ce que ce calcul <b>ne sait pas</b> encore : la pousse de la vigne (15 à 20 cm de pousse découvrent des feuilles neuves), et l’heure du traitement face à une pluie dans les deux heures qui suivent.'
  ] },


  'pil.trx': { t: 'Travaux tracteur en cours', p: [
    'Un travail lancé — une session « En cours » — doit couvrir <b>tout le domaine</b> : toutes les parcelles, sauf les arrachées et celles désactivées dans la session. Ce qui reste = ces parcelles moins celles déjà cochées. C’est la même règle que la barre d’avancement de la session.',
    '<b>L’amendement fait exception</b> : ses parcelles sont choisies dans l’apport (Phyto › Fertilisation). Ce qui reste = les parcelles de l’apport qui attendent encore. Il compte dès la création de l’apport, session lancée ou non.',
    'Heures = surface restante × <b>barème h/ha</b> de l’activité. Litres = ces heures × la <b>consommation mesurée</b> du tracteur de la session (sinon son tracteur par défaut) ; le réglage du Tracteur sert tant que la mesure manque. Un travail sans barème affiche un tiret : il n’est pas compté à zéro.',
    'Un travail terminé <b>disparaît</b> : session passée « Terminé », seule à la dernière parcelle ou à la main. Une session oubliée « En cours » compte quand même : elle est signalée quand aucune parcelle n’a été cochée depuis 21 jours.',
    'Il n’y a pas d’heures de tracteur au planning : le planning porte des heures par personne, jamais une machine. Un travail pas encore lancé n’est donc pas compté.'
  ] },

  'pil.trxrev': { t: 'L’entretien le plus pressant, dans les travaux en cours', p: [
    'La carte prend, pour chaque tracteur, l’entretien le plus pressant : la <b>révision</b> (ses heures, et la date de son intervalle) ou un <b>autre entretien</b> réglé dans le Tracteur (vidange, filtres, graissage…). D’abord ce qui est dépassé, aux heures ou à la date ; puis ce qui sera atteint pendant les travaux en cours, ou dû dans les 14 jours ; puis ce qui approche. Les autres en vue sont dits en dessous.',
    'Les heures avant la révision (révision moins le compteur estimé : le dernier relevé, plus les heures notées depuis), face aux heures des <b>travaux en cours</b> sur ce tracteur, mis bout à bout dans l’ordre où ils ont été lancés. Le trait rouge tombe dans le travail pendant lequel la révision sera atteinte.',
    'Le repère en jours vient du <b>rythme mesuré</b> du tracteur : ses heures notées sur les 4 dernières semaines, divisées par les jours ouvrés. Ce n’est pas une date promise.',
    'L’ordre réel des travaux peut différer. Entre deux relevés, le compteur n’avance qu’avec les sessions saisies : une session oubliée rend l’échéance plus lointaine qu’elle n’est, jusqu’au prochain relevé.'
  ] },

  'pil.trxgnr': { t: 'Gasoil après les travaux', p: [
    'Le niveau de la cuve, moins les litres qu’il faut pour <b>finir les travaux en cours</b>, travail par travail. La barre en bas est ce qu’il restera, face à votre seuil (le pointillé).',
    'L’échelle part de zéro et va un peu au-dessus du niveau du jour (ou du seuil s’il est plus haut), arrondie : la <b>même pour toutes les lignes</b>. La capacité de la cuve est écrite au-dessus, en clair.',
    'La consommation est celle du <b>tracteur</b>, pas celle du travail : un griffage et un rognage faits avec la même machine sont comptés au même litre par heure.',
    'La ligne <b>« conseillé »</b>, en pointillé, n’apparaît que si la protection restante compte des parcelles à nu (ou qui le seront d’ici deux jours) et qu’une fenêtre de traitement existe dans les cinq jours : le traitement de tout le domaine, à la <b>cadence mesurée</b> de l’activité de pulvérisation sur vos propres traitements chronométrés — elle porte votre façon de faire, 4, 6 ou 8 rangs par passage — ou, faute de chrono, à son barème h/ha ; à la consommation de son tracteur. Rien n’est lancé ni compté. Cette ligne est pour l’instant éteinte : elle sera allumée à la belle saison.'
  ] },

  'pil.conso': { t: 'Consommation mesurée', p: [
    'Pour chaque tracteur : <b>litres des pleins ÷ heures notées entre ces pleins</b>. Le plein n°2 rembourse ce qui a brûlé depuis le plein n°1 : ses litres se comptent face aux heures notées depuis le jour du plein précédent jusqu’au sien. Le premier plein de la campagne sert de départ.',
    'Les heures viennent des sessions, parcelle par parcelle : la durée <b>chronométrée</b> quand elle existe, sinon la surface × le barème. La part chronométrée est affichée : c’est la fiabilité du chiffre.',
    'La moyenne est <b>pondérée</b> : un plein après 24 heures de travail pèse plus qu’un plein après 4 heures. Chaque point est un intervalle, sa taille dit ses heures.',
    'Ce sont des litres par heure <b>notée</b>, route et manœuvres comprises. Des heures non saisies gonflent le chiffre. Un intervalle sans aucune heure notée est écarté et compté comme tel ; un plein sans litres aussi.',
    'Il faut au moins <b>2 intervalles et 10 heures</b> pour croire la mesure. En dessous, le réglage du Tracteur reste utilisé, et l’écran le dit.'
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

  'pil.cadres': { t: 'Ce que vous regardez : la campagne, l’année vigne ou l’exercice', p: [
    'La barre <b>« Vous regardez »</b>, en haut du Pilotage, règle tout le module d’un coup : <b>la campagne</b> (une période de travaux, choisie dans la liste qui s’ouvre sur son nom), <b>l’année vigne</b> ou <b>l’exercice</b>. À côté, ses dates et le jour où vous en êtes. Les chiffres du haut et chaque onglet lisent ce même choix.',
    '<b>Pourquoi les deux totaux diffèrent.</b> L’<b>exercice comptable</b> va d’un bilan à l’autre : il répond à « combien m’a coûté l’année fiscale ». Il est fixé par votre comptable — ce n’est pas un réglage d’affichage.',
    'L’<b>année vigne</b> suit le mois d’ouverture de votre campagne (roue crantée d’Économie › Exercice), le même cadre que les Archives : elle répond à « combien m’a coûté un cycle ». Choisissez le mois qui suit vos vendanges : la récolte clôt alors l’année qu’elle aboutit.',
    'Le calcul est <b>le même</b> dans les deux : salaires chargés, carburant, achats, réparations, datés au jour. Seules les dates changent — c’est pour cela que les deux totaux ne s’affichent jamais côte à côte.',
    'Sur l’année vigne et l’exercice, les flèches remontent aux années passées ; au rechargement, l’écran revient toujours à l’année en cours. La liste des campagnes montre celles de l’année regardée, sur leur frise.'
  ] },

  'pil.an.budget': { t: 'Le budget de l’année', p: [
    'Un seul moteur : celui d’<b>Économie › Exercice</b>, joué sur les dates du cadre. <b>Dépensé</b> = ce qui est daté jusqu’à aujourd’hui : salaires payés au planning, pleins de GNR, achats, réparations, fûts, prestations. <b>Reste prévu</b> = les salaires que le planning annonce jusqu’à la fin, et les amendements chiffrés pas encore facturés.',
    'Le prévu ne connaît que ce qui est saisi : une embauche ou un achat à venir n’y entre pas tant qu’il n’est pas dans l’appli. Le carburant n’a pas de prévu : il compte au plein.',
    'Le graphe règle son échelle sur les mois <b>à venir</b>. Un mois passé qui la dépasse — celui des vendanges, souvent — est coupé net, son montant écrit au-dessus.',
    'Le « prévu au barème » (heures/ha × surface) ne se compare plus ici à la dépense de tout le domaine : les deux ne comptent pas les mêmes choses.',
    'Fermage, amortissements, assurances et frais généraux n’y sont pas : <b>ce n’est pas un compte de résultat</b>.'
  ] },

  'pil.an.renfort': { t: 'Le renfort à prévoir', p: [
    'Une <b>photo du jour</b> : avec l’équipe prévue au planning — contrats, horaires de chacun, congés —, combien de personnes manqueront, et quand, pour que les travaux tiennent dans leur fenêtre au barème.',
    'Chaque semaine compare le <b>besoin</b> (les heures de barème de la semaine, ramenées à une personne) à <b>ce que l’équipe peut faire</b> la même semaine. Une semaine où il manque une demi-personne ou plus ouvre une ligne ; les semaines qui se suivent font une seule ligne, avec le manque le plus fort.',
    'L’échelle suit les semaines à venir. Les semaines passées restent en gris ; la vendange, si elle dépasse, est coupée net avec son chiffre.',
    '<b>Combien recruter, quand, et ce que coûte de ne rien faire</b> se chiffrent dans Décider › Le renfort. Lui laisse glisser le travail dans sa fenêtre : ses chiffres peuvent être plus bas que cette photo.',
    'Rien n’est compté au-delà de la dernière période datée : un trou n’est pas un zéro.'
  ] }

};


// La pastille. Posee A COTE du chiffre qu'elle explique, jamais en tete d'ecran :
// une notice generale ne repond a aucune question precise.
// ⚠️ `type="button"` : sans lui, un bouton dans un formulaire le soumet.
export function _mvInfoBtn(cle) {
  return '<button type="button" class="mv-i" data-mvi="' + _escAttr(cle)
       + '" aria-label="D\u2019o\u00f9 vient ce chiffre" aria-expanded="false"><span aria-hidden="true">i</span></button>';
}

// ═══════════════════════════════════════════════════════════════════════════
// POURQUOI ON LE FAIT — lot POURQUOI-1 (§336)
// ═══════════════════════════════════════════════════════════════════════════
// Une fiche par tâche de la vigne, activité du tracteur et opération du cuvier
// ou du chai : quand on la fait, pourquoi, ce que ça change pour le vin, et un
// « Le saviez-tu ? ». Elle s'ouvre dans la bulle des fiches « i » (même écouteur
// délégué sur [data-mvi], même bulle) depuis la pastille « Pourquoi ? », posée là
// où le geste a lieu : la priorité du moment, la feuille de validation, la fiche
// d'une session tracteur, le choix d'une opération de cave.
// Nico (15/10) : « les petites informations de pourquoi on fait telle tâche,
// c'est hyper important : ça aide tout le monde à ouvrir l'appli, à valider ce
// qu'ils sont en train de faire, à discuter entre eux ».
// ⚠️ Les textes sont du CODE, jamais une saisie : la bulle les rend en HTML (C19).
//   La réécriture par l'admin (POURQUOI-2) devra échapper ce qu'elle injecte.
// ⚠️ Un libellé sans fiche ne pose RIEN : pas de pastille morte.
// ⚠️ Les clés vivent dans MV_INFO sous `pqt.<slug>` (la forme qu'exige le harnais
//   des fiches « i ») ; elles y sont ajoutées au chargement, hors du littéral :
//   le contrôle propre à ce catalogue est scripts/mv-harnais-pourquoi.mjs.
// ⚠️ Écrits pour tous les domaines clients : rien de propre à une région ici.
// ── POURQUOI-1 : début du bloc exécutable (lu et joué tel quel par le harnais) ──
const MV_POURQUOI = {
  // ── La vigne ──
  taille:          { d: 'vigne', n: 'Taille', q: 'En hiver, quand la vigne est au repos.', p: 'On choisit les bois qui porteront les grappes (en Guyot, une baguette et un courson) et on règle la charge de chaque pied.', v: 'Le rendement se décide ici : moins de bourgeons, des raisins plus concentrés.' },
  tirage:          { d: 'vigne', n: 'Tirage', q: 'Juste après la taille.', p: 'On retire des fils les sarments coupés, pour libérer le palissage.', v: 'Un rang propre, une vigne qui repart sans être gênée.' },
  brulage:         { d: 'vigne', n: 'Brûlage', q: 'Pendant ou après le tirage.', p: 'On brûle ou on broie les sarments tirés : ils ne restent pas dans la parcelle avec les maladies qu’ils peuvent porter.', v: 'Une parcelle saine au départ de la saison.' },
  arrachage:       { d: 'vigne', n: 'Arrachage', q: 'Quand une vigne est trop vieille ou trop malade.', p: 'On retire les ceps et leurs racines, puis on laisse le sol se reposer avant de replanter.', v: 'On prépare les vignes des prochaines décennies.' },
  plantation:      { d: 'vigne', n: 'Plantation', q: 'De la fin de l’hiver au printemps.', p: 'On plante une parcelle neuve, avec un plant choisi pour le sol et l’appellation.', v: 'Une jeune vigne donne ses premières récoltes après environ trois ans.' },
  entreplantation: { d: 'vigne', n: 'Entreplantation', q: 'Au printemps, surtout.', p: 'On remplace un à un les pieds morts ou manquants d’une vigne en place, dans les trous percés à la tarière.', v: 'La parcelle reste complète et garde ses vieilles vignes autour des jeunes.' },
  reparation:      { d: 'vigne', n: 'Réparation', q: 'Avant que la vigne pousse.', p: 'On change les piquets cassés, on retend et on rattache les fils.', v: 'Un palissage solide tiendra le feuillage tout l’été.' },
  pliage:          { d: 'vigne', n: 'Pliage', q: 'Avant le débourrement.', p: 'On courbe la baguette taillée et on l’attache au fil porteur.', v: 'Des rameaux bien répartis, des grappes à bonne hauteur.' },
  ebourgeonnage:   { d: 'vigne', n: 'Ébourgeonnage', q: 'Quand les pousses sortent, en plusieurs passages.', p: 'On enlève les pousses en trop (les doubles, celles du tronc) pour ne garder que les bons rameaux.', v: 'Moins de grappes, mieux nourries, et un feuillage aéré.' },
  pioche:          { d: 'vigne', n: 'Pioche', q: 'Au printemps, en plusieurs passages.', p: 'On travaille la terre au pied des ceps, là où la machine ne passe pas : l’herbe part sans produit et le sol respire.', v: 'La vigne garde l’eau et la nourriture pour elle.' },
  relevage:        { d: 'vigne', n: 'Relevage', q: 'Quand les rameaux dépassent les fils.', p: 'On remonte les fils releveurs pour guider les rameaux vers le haut.', v: 'Le feuillage prend le soleil et l’air circule : moins de maladies.' },
  accolage:        { d: 'vigne', n: 'Accolage', q: 'Au fil de la pousse.', p: 'On range à la main les rameaux qui s’échappent, entre les fils.', v: 'Une haie bien droite, exposée au soleil.' },
  palissage:       { d: 'vigne', n: 'Palissage', q: 'De la fin du printemps à l’été.', p: 'On fixe la végétation dans les fils, avec des agrafes, pour qu’elle tienne debout jusqu’aux vendanges.', v: 'Des grappes aérées, moins de pourriture, et les machines passent.' },
  desherbage:      { d: 'vigne', n: 'Désherbage', q: 'Quand l’herbe repart.', p: 'On limite l’herbe sous le rang, qui prend à la vigne son eau et son azote.', v: 'Une vigne qui ne manque pas d’eau en été.' },
  effeuillage:     { d: 'vigne', n: 'Effeuillage', q: 'Avant la véraison.', p: 'On retire quelques feuilles autour des grappes, souvent côté soleil du matin : l’air passe, la lumière arrive.', v: 'Moins de pourriture, une maturité plus régulière.' },
  vendange:        { d: 'vigne', n: 'Vendange', q: 'Quand le raisin a trouvé son équilibre entre sucre et acidité.', p: 'On cueille et on trie, parcelle par parcelle.', v: 'Tout ce qui a été fait dans l’année se retrouve dans la caisse.' },
  degraffage:      { d: 'vigne', n: 'Dégraffage', q: 'Après les vendanges.', p: 'On retire les agrafes posées l’été pour libérer les fils avant la taille.', v: 'La taille d’hiver commence sur un rang dégagé.' },
  // ── Le tracteur ──
  rognage:         { d: 'vigne', n: 'Rognage', q: 'En été.', p: 'On coupe le haut des rameaux qui dépassent : l’air circule, la vigne garde sa force pour les grappes, le rang reste praticable.', v: 'Des raisins mieux nourris, une parcelle saine.' },
  traitements:     { d: 'vigne', n: 'Traitements', q: 'Selon la météo et les risques.', p: 'On protège la vigne du mildiou et de l’oïdium, au bon moment et à la bonne dose. Tout est noté au registre.', v: 'Une récolte protégée.' },
  labour:          { d: 'vigne', n: 'Labour', q: 'À l’automne et au printemps.', p: 'On travaille la terre entre les rangs : on butte les pieds à l’automne pour les protéger du froid, on les débutte au printemps.', v: 'Un sol vivant, aéré, qui boit mieux la pluie.' },
  tariere:         { d: 'vigne', n: 'Tarière', q: 'Avant une plantation ou une entreplantation.', p: 'On perce les trous où iront les jeunes plants.', v: 'Les vignes de demain, au bon endroit.' },
  ensemencement:   { d: 'vigne', n: 'Ensemencement', q: 'À l’automne ou au printemps, entre les rangs.', p: 'On sème un couvert, de céréales ou de légumineuses, qui protège le sol de l’érosion et nourrit sa vie ; les légumineuses apportent de l’azote.', v: 'Un sol vivant, une vigne mieux équilibrée.' },
  engrais:         { d: 'vigne', n: 'Engrais', q: 'À la fin de l’hiver ou au printemps, selon les analyses de sol.', p: 'On rend au sol ce que la vigne lui a pris, à la dose décidée d’après les analyses.', v: 'Une vigne nourrie sans excès : des raisins équilibrés.' },
  // ── Le cuvier ──
  remontage:       { d: 'cave', n: 'Remontage', q: 'Pendant la fermentation, une ou plusieurs fois par jour.', p: 'On pompe le jus du bas de la cuve et on l’arrose sur le chapeau de marc : il en tire la couleur et les tanins, aère les levures et égalise la température.', v: 'La couleur et la structure du vin.' },
  pigeage:         { d: 'cave', n: 'Pigeage', q: 'Pendant la fermentation.', p: 'On enfonce le chapeau de marc dans le jus, au pigeou ou à la main.', v: 'Une extraction douce, plus fine.' },
  delestage:       { d: 'cave', n: 'Délestage', q: 'Pendant la fermentation.', p: 'On vide le jus dans une autre cuve, puis on le reverse sur le marc : une extraction plus franche, et de l’air pour les levures.', v: 'Plus de couleur, des tanins plus souples.' },
  saignee:         { d: 'cave', n: 'Saignée', q: 'Au début de la cuvaison.', p: 'On tire une partie du jus pour concentrer le reste : plus de peaux pour moins de jus. Le jus tiré peut faire un rosé.', v: 'Un vin plus concentré.' },
  chaptalisation:  { d: 'cave', n: 'Chaptalisation', q: 'Pendant la fermentation, les années où le raisin manque de maturité.', p: 'On ajoute du sucre au moût, dans les limites de la réglementation, pour atteindre le degré visé.', v: 'L’équilibre en alcool, même une année fraîche.' },
  // ── Le chai ──
  soutirage:       { d: 'cave', n: 'Soutirage', q: 'Pendant l’élevage, quand le vin a déposé.', p: 'On transvase le vin pour le séparer de ses lies, le dépôt du fond, et on l’aère un peu au passage.', v: 'Un vin plus net, plus limpide.' },
  ouillage:        { d: 'cave', n: 'Ouillage', q: 'Régulièrement, pendant l’élevage.', p: 'Le vin s’évapore à travers le bois : c’est la « part des anges ». On remplit les fûts à ras, car un fût qui n’est pas plein laisse l’air abîmer le vin.', v: 'Un vin protégé de l’oxydation.' },
  soufre:          { d: 'cave', n: 'Soufre', q: 'Au fil de l’élevage, d’après les analyses.', p: 'Un peu de soufre protège le vin de l’oxydation et des bactéries. La dose est mesurée et notée.', v: 'Un vin stable, qui vieillit bien.' },
  collage:         { d: 'cave', n: 'Traitement du vin', q: 'Avant la mise, si le vin en a besoin.', p: 'On ajoute une colle, de l’albumine par exemple, ou un produit autorisé, pour clarifier ou stabiliser le vin.', v: 'Un vin limpide, plus souple.' },
  filtration:      { d: 'cave', n: 'Filtration', q: 'Juste avant la mise, si le domaine filtre.', p: 'On fait passer le vin à travers un filtre pour retirer les dernières particules.', v: 'Un vin limpide et stable en bouteille.' },
  assemblage:      { d: 'cave', n: 'Assemblage', q: 'Avant la mise.', p: 'On réunit des vins de plusieurs fûts ou cuves pour composer la cuvée.', v: 'L’équilibre et la signature de la cuvée.' },
  degustation:     { d: 'cave', n: 'Dégustation', q: 'Régulièrement, pendant l’élevage.', p: 'On goûte les vins pour suivre leur évolution et décider des soins : soutirer, ouiller, mettre en bouteille.', v: 'Chaque décision part du goût.' },
  analyse:         { d: 'cave', n: 'Analyses', q: 'Aux moments clés de la vinification et de l’élevage.', p: 'Le laboratoire mesure l’alcool, l’acidité, le soufre et l’avancée de la fermentation malolactique.', v: 'Des décisions prises sur des chiffres.' },
  miseenbouteille: { d: 'cave', n: 'Mise en bouteille', q: 'Quand l’élevage est fini.', p: 'On met le vin en bouteille au bon moment, à l’abri de l’air.', v: 'Le vin quitte le domaine tel qu’on l’a voulu.' },
};
const MV_SAVIEZ = {
  vigne: [
    'Au printemps, la vigne « pleure » : la sève coule aux plaies de taille, signe qu’elle se réveille.',
    'Le débourrement, c’est le moment où le bourgeon s’ouvre et laisse sortir les premières feuilles.',
    'La véraison, c’est quand le raisin change de couleur et commence à mûrir pour de bon.',
    'Entre la floraison et la vendange, on compte environ cent jours.',
    'Une vigne peut produire pendant plus de cinquante ans ; les vieilles vignes donnent moins de raisin, souvent plus concentré.',
    'Les racines d’une vieille vigne peuvent descendre à plusieurs mètres pour chercher l’eau.',
  ],
  cave: [
    'La « part des anges », c’est le vin qui s’évapore à travers le bois des fûts. L’ouillage la remplace.',
    'Une pièce bourguignonne contient 228 litres, soit environ 300 bouteilles ; une barrique bordelaise, 225 litres.',
    'Le fût laisse passer un tout petit peu d’oxygène : c’est ce qui fait mûrir le vin pendant l’élevage.',
    'La fermentation malolactique change l’acide malique, piquant, en acide lactique, plus doux : le vin s’assouplit.',
    'Autrefois, on pigeait avec les pieds. Quelques domaines le font encore.',
    'Les lies fines laissées sur un vin blanc lui donnent du gras ; on les remue au bâton : c’est le bâtonnage.',
  ],
};
// Un même mot peut dire deux gestes : « traitement » au tracteur protège la
// vigne, en cave il clarifie le vin. Le contexte tranche.
const MV_PQ_ALIAS = {
  vigne: {},
  trac: { traitement: 'traitements', semis: 'ensemencement', epandage: 'engrais', fertilisation: 'engrais' },
  cave: { traitement: 'collage', traitements: 'collage', sulfitage: 'soufre', analyses: 'analyse', mise: 'miseenbouteille', embouteillage: 'miseenbouteille' },
};
function _mvPqSlug(libelle) {
  return String(libelle == null ? '' : libelle).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
function _mvPqResout(libelle, ctx) {
  var s = _mvPqSlug(libelle);
  if (!s) return null;
  var al = MV_PQ_ALIAS[ctx] || {};
  if (al[s]) s = al[s];
  if (MV_POURQUOI[s]) return s;
  if (s.length > 3 && s.charAt(s.length - 1) === 's' && MV_POURQUOI[s.slice(0, -1)]) return s.slice(0, -1);
  return null;
}
// ── POURQUOI-1 : fin du bloc exécutable ──
export function _mvPqCle(libelle, ctx) {
  var s = _mvPqResout(libelle, ctx);
  return s ? 'pqt.' + s : null;
}
// ⚠️ L'attribut se construit en deux morceaux : le contrôle statique de
//   mv-harnais-info relève les `data-mvi` écrits en dur, et une clé calculée
//   y passerait pour une fiche manquante.
export function _mvPqBtn(libelle, ctx) {
  var s = _mvPqResout(libelle, ctx);
  if (!s) return '';
  var att = 'data-mvi=' + '"pqt.' + s + '"';
  return '<button type="button" class="mv-pq" ' + att + ' aria-label="Pourquoi on le fait : ' + _escAttr(MV_POURQUOI[s].n)
       + '" aria-expanded="false">Pourquoi\u00a0?</button>';
}
(function _mvPqDeclare() {
  var debut = new Date(new Date().getFullYear(), 0, 0);
  var jour = Math.floor((Date.now() - debut.getTime()) / 86400000);
  Object.keys(MV_POURQUOI).forEach(function (s, k) {
    var f = MV_POURQUOI[s], sv = MV_SAVIEZ[f.d] || MV_SAVIEZ.vigne;
    MV_INFO['pqt.' + s] = { t: f.n, p: [
      '<b>Quand</b> — ' + f.q,
      '<b>Pourquoi</b> — ' + f.p,
      '<b>Pour le vin</b> — ' + f.v,
      '<i>Le saviez-tu\u00a0?</i> ' + sv[(jour + k) % sv.length],
    ] };
  });
})();
// PRESENCE-1 (§344) : un champ d'une fiche, en texte brut (« p » = pourquoi, « q » = quand, « v » = pour le vin).
export function _mvPqTexte(libelle, ctx, champ) {
  var s = _mvPqResout(libelle, ctx);
  return s ? (MV_POURQUOI[s][champ || 'p'] || '') : '';
}
window._mvPqBtn = _mvPqBtn;
window._mvPqCle = _mvPqCle;
window._mvPqTexte = _mvPqTexte;

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

export function _mvInfoOpen(cle, ancre, clavier) {
  var f = MV_INFO_LIVE[cle] || MV_INFO[cle];
  if (!f) {
    // Une pastille morte est plus deroutante qu'une explication absente : on
    // ouvre quand meme, en le disant. Le harnais interdit ce cas en CI — s'il
    // arrive quand meme, il doit se voir, pas se taire.
    if (window.logError) window.logError({ level: 'info', cat: 'info', msg: 'MV_INFO : cle inconnue ' + cle });
    f = { t: 'Explication manquante', p: ['Cette explication n\u2019a pas encore \u00e9t\u00e9 \u00e9crite (' + _escHtml(String(cle)) + ').'] };
  }
  if (!ancre) {
    // ★ BULLE-1 : la bulle se pose a cote de ce qu'elle explique. Sans le « i », elle ne sait pas ou : on le trace.
    if (window.logError) window.logError({ level: 'info', cat: 'info', msg: 'MV_INFO : bulle sans ancre ' + cle });
    return;
  }
  var sig = /^[\w.-]+$/.test(String(cle)) ? '[data-mvi="' + cle + '"]' : null;
  _mvBulleOuvrir(ancre, f, { cle: cle, sig: sig, clavier: !!clavier });
}

// ═══════════════════════════════════════════════════════════════════════════
// LA BULLE — BULLE-1 (§314)
// ═══════════════════════════════════════════════════════════════════════════
// Nico (11/10) : « le i […] ca ouvre un vieux texte en bas […] ce serait mieux d'ouvrir une infobulle ».
// DEUX DEFAUTS SOUS LA MEME PHRASE :
//   · Pilotage › Aujourd'hui : ses « i » ouvraient la bulle de la maquette (#ck-pop), mais la feuille de la
//     maquette avait perdu ses regles au portage (REF-1, §266) — zero regle pour elle dans tout le depot. Le
//     texte tombait nu, a la fin de la page ;
//   · partout ailleurs (56 fiches du Pilotage, 4 de la Cave, 2 des Documents), le « i » ouvrait une feuille
//     (#ovInfo) : montee du bas sur un voile au telephone, fenetre au centre sur ordinateur.
// UNE SEULE BULLE, DESORMAIS, pour toute l'appli : collee au « i » (dessous, au-dessus faute de place), avec
// sa pointe. Une fiche longue montre son premier paragraphe ; « Lire la suite » la deplie sur place.
// ⚠️⚠️ OU ELLE VIT : sur <body>, SAUF quand le « i » est dans une fenetre (.overlay). A11Y-2 (app.js,
//   _mvInertOutside) rend INERTE tout ce qui n'est pas la fenetre du dessus : posee sur <body>, la bulle serait
//   visible mais intouchable, et le toucher tomberait sur le voile — qui ferme la fenetre. Elle se pose donc
//   DANS la fenetre (une .overlay couvre l'ecran : les coordonnees fixes restent justes).
// ⚠️ JAMAIS DANS UN PARENT TRANSFORME (tiroir, feuille animee, .page) : un `transform` fait du parent le repere
//   d'un `position:fixed`, et la bulle se poserait a cote. <body> ou la .overlay, rien d'autre. Au-dessus d'une
//   couche fixe (tiroir, feuille du Cuvier), elle prend le z-index de la couche + 1 : toujours sous les dialogues.
// ⚠️ UN TOUCHER A COTE FERME LA BULLE ET S'ARRETE LA : il n'ouvre pas en plus la carte qui etait dessous (une
//   carte du Pilotage se replie au toucher). Un toucher sur un autre declencheur ([data-mvi], ou [data-bulle] :
//   les « i » du cockpit, qui ouvrent la bulle eux-memes) ouvre le sien du premier coup.
// ⚠️ ECHAP ferme la bulle AVANT la fenetre : preventDefault, que _mvOvKey (app.js) respecte.
// ★ Le calcul de la position et le choix des paragraphes ne lisent pas le DOM : le harnais les EXECUTE
//   (scripts/mv-harnais-bulle1.mjs). Le reste est de la colle, regardee au navigateur.
var _MV_BULLE = { el: null, ancre: null, cle: null, sig: null, fiche: null, veille: 0, raf: 0, pos: null };
var _MV_BULLE_COURT = 480;   // texte nu : en dessous, la fiche s'affiche entiere — « Lire la suite » pour 150 caracteres agace

function _mvBulleNu(s) { return String(s == null ? '' : s).replace(/<[^>]+>/g, ''); }

// Les paragraphes montres. Un seul, ou une fiche courte : tout. Sinon le premier, et « Lire la suite ».
function _mvBulleParagraphes(p, tout) {
  var l = Array.isArray(p) ? p : [];
  var court = l.length < 2 || _mvBulleNu(l.join(' ')).length <= _MV_BULLE_COURT;
  return (tout || court) ? { vus: l, suite: false } : { vus: l.slice(0, 1), suite: true };
}

// La largeur : 360 px pour une fiche titree (Pilotage, Cave, Documents), 320 pour une phrase (le cockpit, comme
// la maquette) — jamais plus de 86 % de l'ecran.
function _mvBulleLargeur(vw, titre) { return Math.min(titre ? 360 : 320, Math.round(vw * 0.86)); }

// LA POSITION. a = le rectangle du « i » ({l,t,r,b}, coordonnees d'ecran), h = la hauteur du contenu, pw = la
//   largeur. Dessous s'il tient ; sinon au-dessus s'il y tient ; sinon du cote le plus grand, hauteur bornee (le
//   texte defile dans la bulle). `cote` impose un cote, `fige` garde la hauteur : on suit le « i » quand la page
//   defile, sans faire sauter la bulle d'un bord a l'autre ni la retailler a chaque pas.
function _mvBulleCalcul(a, vw, vh, pw, h, cote, fige) {
  var M = 12, G = 10, MIN = 120;
  var dessous = vh - a.b - G - M, dessus = a.t - G - M;
  if (cote !== 'bas' && cote !== 'haut') cote = (h <= dessous || dessous >= dessus) ? 'bas' : 'haut';
  var place = cote === 'bas' ? dessous : dessus;
  var maxH = (!fige && h > place) ? Math.max(MIN, Math.floor(place)) : 0;
  var hh = maxH ? Math.min(h, maxH) : h;
  var cx = (a.l + a.r) / 2;
  var x = Math.round(Math.max(M, Math.min(vw - pw - M, cx - pw / 2)));
  var y = Math.round(cote === 'bas' ? a.b + G : a.t - G - hh);
  var ox = Math.round(Math.max(16, Math.min(pw - 16, cx - x)));
  return { cote: cote, x: x, y: y, maxH: maxH, ox: ox };
}

function _mvBulleEl() {
  if (_MV_BULLE.el) return _MV_BULLE.el;
  var el = document.createElement('div');
  el.id = 'mv-bulle';
  el.className = 'mv-bulle';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('tabindex', '-1');
  // Au clavier, quitter la bulle par Tab la referme (le toucher a cote, lui, passe par l'ecouteur du document).
  el.addEventListener('focusout', function (e) {
    var n = e.relatedTarget;
    if (n && !el.contains(n) && n !== _MV_BULLE.ancre) _mvBulleFermer(false);
  });
  _MV_BULLE.el = el;
  return el;
}

// Le contenu. Le texte d'une fiche est ECRIT dans le code (MV_INFO, INFO du cockpit), jamais saisi : il porte
// ses propres <b> (C19 — la regle de l'ancienne feuille). Le titre, lui, est echappe.
function _mvBulleRemplir(tout) {
  var B = _MV_BULLE, el = B.el, f = B.fiche || {};
  var r = _mvBulleParagraphes(f.p, tout);
  var h = '<div class="mv-bulle-c">';
  if (f.t) h += '<p class="mv-bulle-t" id="mv-bulle-t">' + _escHtml(f.t) + '</p>';
  for (var i = 0; i < r.vus.length; i++) h += '<p>' + r.vus[i] + '</p>';
  h += '</div>';
  if (r.suite) h += '<button type="button" class="mv-bulle-suite" data-bulle-suite="1">Lire la suite</button>';
  el.innerHTML = h;
  if (f.t) { el.setAttribute('aria-labelledby', 'mv-bulle-t'); el.removeAttribute('aria-label'); }
  else {
    el.removeAttribute('aria-labelledby');
    el.setAttribute('aria-label', (B.ancre && B.ancre.getAttribute('aria-label')) || 'Explication');
  }
}

// La couche du « i » : dans un tiroir ou une feuille fixe, la bulle passe juste au-dessus (z-index + 1).
function _mvBulleCouche(ancre) {
  var z = 0, n = ancre.parentElement;
  while (n && n !== document.body && n !== document.documentElement) {
    var cs = window.getComputedStyle(n);
    if (cs.position === 'fixed') { var v = parseInt(cs.zIndex, 10); if (v > z) z = v; }
    n = n.parentElement;
  }
  return z;
}

// Pose la bulle sur le « i ». `garder` : on suit le « i » (meme cote, meme hauteur).
function _mvBullePlacer(garder) {
  var B = _MV_BULLE, el = B.el, a = B.ancre;
  if (!el || !a) return;
  var r = a.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
  var pw = _mvBulleLargeur(vw, !!(B.fiche && B.fiche.t));
  el.style.width = pw + 'px';
  if (!garder) el.style.maxHeight = '';
  var c = _mvBulleCalcul({ l: r.left, t: r.top, r: r.right, b: r.bottom }, vw, vh, pw, el.offsetHeight,
    garder ? el.getAttribute('data-cote') : null, !!garder);
  if (c.maxH) el.style.maxHeight = c.maxH + 'px';
  el.setAttribute('data-cote', c.cote);
  el.style.left = c.x + 'px';
  el.style.top = c.y + 'px';
  el.style.setProperty('--mv-bulle-x', c.ox + 'px');
  B.pos = { l: r.left, t: r.top };
}

export function _mvBulleOuvrir(ancre, fiche, o) {
  if (!ancre || !fiche || typeof document === 'undefined') return;
  o = o || {};
  var B = _MV_BULLE;
  if (B.ancre === ancre && B.el && !B.el.hidden) { _mvBulleFermer(false); return; }   // second toucher : referme
  _mvBulleFermer(false);
  var el = _mvBulleEl();
  var hote = (ancre.closest && ancre.closest('.overlay')) || document.body;
  if (el.parentNode !== hote) hote.appendChild(el);
  // A11Y-2 a pu la marquer inerte (data-mv-inert) le temps qu'une fenetre s'ouvre sur une bulle encore posee sur la
  //   page : la marque suivrait la bulle dans la fenetre, et « Lire la suite » ne repondrait plus. Elle s'efface ici.
  if (el.hasAttribute('data-mv-inert')) { el.removeAttribute('inert'); el.removeAttribute('data-mv-inert'); }
  var z = hote === document.body ? _mvBulleCouche(ancre) : 0;
  el.style.zIndex = z >= 800 ? String(z + 1) : '';
  B.ancre = ancre; B.cle = o.cle || null; B.sig = o.sig || null; B.fiche = fiche;
  ancre.setAttribute('aria-expanded', 'true');
  ancre.setAttribute('aria-controls', 'mv-bulle');
  _mvBulleRemplir(false);
  el.classList.remove('ouvert');
  el.hidden = false;
  _mvBullePlacer(false);
  // La position est posee AVANT l'apparition : la bulle s'ouvre sur place, elle ne glisse pas depuis un coin.
  requestAnimationFrame(function () { if (B.el === el && !el.hidden && B.ancre === ancre) el.classList.add('ouvert'); });
  if (o.clavier) {
    try { el.focus({ preventScroll: true }); }
    catch (e) { if (window._mvAvale) window._mvAvale(e, 'utils.js/_mvBulleOuvrir'); }
  }
  _mvBulleVeiller();
}

export function _mvBulleFermer(rendre) {
  var B = _MV_BULLE, el = B.el, a = B.ancre;
  if (B.veille) { clearInterval(B.veille); B.veille = 0; }
  if (B.raf) { cancelAnimationFrame(B.raf); B.raf = 0; }
  B.ancre = null; B.cle = null; B.sig = null; B.fiche = null; B.pos = null;
  if (a) { a.setAttribute('aria-expanded', 'false'); a.removeAttribute('aria-controls'); }
  if (!el || el.hidden) return;
  el.classList.remove('ouvert');
  el.hidden = true;
  el.innerHTML = '';
  // Fermee, elle quitte le document : elle ne dort ni sur <body> (A11Y-2 la marquerait), ni dans une fenetre.
  if (el.parentNode) el.parentNode.removeChild(el);
  if (rendre && a && a.isConnected) {
    try { a.focus({ preventScroll: true }); }
    catch (e) { if (window._mvAvale) window._mvAvale(e, 'utils.js/_mvBulleFermer'); }
  }
}

function _mvBulleSuite(clavier) {
  var B = _MV_BULLE;
  if (!B.el || B.el.hidden || !B.fiche) return;
  _mvBulleRemplir(true);
  _mvBullePlacer(false);
  if (clavier) {   // le bouton vient de disparaitre : le focus revient a la bulle, pas au document
    try { B.el.focus({ preventScroll: true }); }
    catch (e) { if (window._mvAvale) window._mvAvale(e, 'utils.js/_mvBulleSuite'); }
  }
}

// LA VEILLE, tant que la bulle est ouverte (deux fois par seconde, rien d'autre ne tourne).
//   · une fenetre s'ouvre par-dessus une bulle posee sur la page : elle la cacherait — on la ferme ;
//   · l'ecran se redessine (une validation arrive, la page se remonte) : le meme « i » est peut-etre revenu, on
//     s'y raccroche ; introuvable, ou en double : on ferme ;
//   · le « i » a bouge (un bloc s'est deplie au-dessus) : la bulle le suit.
function _mvBulleVeiller() {
  var B = _MV_BULLE;
  if (B.veille) clearInterval(B.veille);
  B.veille = setInterval(function () {
    var a = B.ancre;
    if (!a || !B.el || B.el.hidden) { clearInterval(B.veille); B.veille = 0; return; }
    if (B.el.parentNode === document.body && document.querySelector('.overlay.open')) { _mvBulleFermer(false); return; }
    if (!a.isConnected || !a.getClientRects().length) {
      var n = B.sig ? document.querySelectorAll(B.sig) : [], vu = null, k = 0;
      for (var i = 0; i < n.length; i++) if (n[i].getClientRects().length) { vu = n[i]; k++; }
      if (k !== 1) { _mvBulleFermer(false); return; }
      B.ancre = vu;
      vu.setAttribute('aria-expanded', 'true');
      vu.setAttribute('aria-controls', 'mv-bulle');
      _mvBullePlacer(true);
      return;
    }
    var r = a.getBoundingClientRect();
    if (B.pos && (Math.abs(r.left - B.pos.l) > 1 || Math.abs(r.top - B.pos.t) > 1)) _mvBullePlacer(true);
  }, 400);
}

// La page defile (ou l'ecran tourne) : la bulle suit son « i » ; s'il sort de l'ecran, elle se ferme. Un
// defilement DANS la bulle (une fiche longue) ne compte pas.
function _mvBulleDefile(e) {
  var B = _MV_BULLE;
  if (!B.ancre || !B.el || B.el.hidden) return;
  var t = e && e.target;
  if (t && t.nodeType === 1 && B.el.contains(t)) return;
  if (B.raf) return;
  B.raf = requestAnimationFrame(function () {
    B.raf = 0;
    var a = B.ancre;
    if (!a || !B.el || B.el.hidden) return;
    var r = a.getBoundingClientRect();
    if (!a.isConnected || !a.getClientRects().length || r.bottom < 0 || r.top > window.innerHeight) { _mvBulleFermer(false); return; }
    _mvBullePlacer(true);
  });
}

// UN SEUL ECOUTEUR, pose une fois sur le document. Chaque module qui pose une
// pastille n'a rien a brancher.
// ⚠️⚠️ `stopPropagation` est INDISPENSABLE : la pastille vit dans l'en-tete
//   d'une tuile, et cet en-tete replie la tuile au clic. Sans lui, ouvrir la
//   fiche fermerait l'ecran qu'on cherche a comprendre.
// ★ BULLE-1 : le meme ecouteur tient la bulle ouverte (voir plus haut : le toucher a cote, [data-bulle]).
if (typeof document !== 'undefined') {
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    var B = _MV_BULLE, ouverte = !!(B.el && !B.el.hidden);
    if (ouverte && B.el.contains(t)) {
      if (t.closest('[data-bulle-suite]')) { e.preventDefault(); _mvBulleSuite(e.detail === 0); }
      return;
    }
    var b = t.closest('[data-mvi]');
    if (b) {
      e.preventDefault();
      e.stopPropagation();
      _mvInfoOpen(b.getAttribute('data-mvi'), b, e.detail === 0);
      return;
    }
    if (!ouverte) return;
    if (B.ancre && B.ancre.contains(t)) { e.preventDefault(); e.stopPropagation(); _mvBulleFermer(false); return; }
    _mvBulleFermer(false);
    if (t.closest('[data-bulle]')) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);
  document.addEventListener('keydown', function (e) {
    var B = _MV_BULLE;
    if ((e.key !== 'Escape' && e.key !== 'Esc') || !B.el || B.el.hidden) return;
    e.preventDefault();
    var a = document.activeElement;
    _mvBulleFermer(!!(a && (B.el.contains(a) || a === B.ancre)));
  }, true);
  document.addEventListener('scroll', _mvBulleDefile, { capture: true, passive: true });
  window.addEventListener('resize', _mvBulleDefile, { passive: true });
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
window._mvBulleOuvrir     = _mvBulleOuvrir;   // BULLE-1 : le cockpit (cockpit-vue.js) ouvre ses « i » par elle
window._mvBulleFermer     = _mvBulleFermer;
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
window.showToastAnnuler   = showToastAnnuler;   // ★ ANNULER-1 (§471)
window.setThemeMode       = setThemeMode;
window.applyTheme         = applyTheme;
window.initTheme          = initTheme;
window.tNom               = tNom;
window.tLib               = tLib;
window.wmoDesc            = wmoDesc;
window.wmoIcone           = wmoIcone;
window.MV_METEO_IC        = MV_METEO_IC;
window.wmoEmoji           = wmoEmoji;
window.isAdmin            = isAdmin;
window._mvPrepOn          = _mvPrepOn;
window.isTractoriste      = isTractoriste;
window.canSeePhyto        = canSeePhyto;
window.isSaisonnier       = isSaisonnier;
window.canWrite           = canWrite;
window.getRoleLabel       = getRoleLabel;
window.isPilotage         = isPilotage;
window.canSeePilotage     = canSeePilotage;
window.logError           = logError;
window._mvAvale           = _mvAvale;
window._mvAvalees         = _MV_AVALEES;   /* lisible en console : ou ca avale, et combien */
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
/* ★ TETE-2 (§329) — LA DATE COURTE DES PASTILLES MÉTÉO (Accueil, Pilotage) : « mer. 14 oct. ». La date longue de la ligne
   du jour (« Mercredi 14 octobre ») reste écrite par app.js et recopiée par _mvMetaSync. Une seule écriture pour les deux
   pastilles : le Pilotage formait la sienne de son côté (« mercredi 14 oct. »). */
window._mvDateCourte = function (d) {
  d = d || new Date();
  return ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'][d.getDay()] + ' ' + d.getDate() + ' '
    + ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'][d.getMonth()];
};
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
  // PRES-1 (26/09) : sans date, la regle unique (_mvCompteSansDate) decide.
  if(!P.length || window._mvSansDateContrat(m)) return window._mvCompteSansDate(m, ds, ds);
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
// TOURNÉES (ordre de passage) — SOURCE UNIQUE — ★★ TRN-1 (§330)
// ──────────────────────────────────────────────────────────────────
// Nico (14/10) : c'est l'ADMINISTRATEUR qui fait les tournées, une fois (hiver, été, taille, tracteur…), et qui
// décide de celle que l'équipe suit ; l'équipe n'a qu'à valider. Une tournée = un nom, l'ordre COMPLET des
// parcelles du domaine, et les travaux qui la suivent. Un travail n'en suit qu'une. Réglée dans la roue crantée
// de la Vigne (tournees.js), plus dans Décider.
//   CONFIG.tournees = [ { id, nom, taches:[noms], ordre:[pid], date:'AAAA-MM-JJ', par:'nom' } ]
// ★ L'ordre est rangé par IDENTIFIANT (pid, IDS-1) : renommer une parcelle ne touche pas la tournée.
// ★ Lecture inchangée pour tous les écrans : _mvOrdreFor(tâche) rend toujours des NOMS (Parcelles, carte, anneau,
//   Tracteur, Décider). Une parcelle ajoutée après coup n'a pas de rang : elle passe après.
// ★ Compatibilité : l'enregistrement réécrit aussi CONFIG.ordre_passage_t (noms, par tâche), lu par Décider et par
//   les appareils pas encore à jour. Sans CONFIG.tournees, les tournées d'avant (une par tâche) se lisent comme des
//   tournées portant le nom de leur tâche : rien n'est perdu, rien n'est réécrit avant le premier enregistrement.
//   Dès que CONFIG.tournees existe (même vide), il fait seul foi : l'ancienne carte n'est plus jamais relue.
// ⚠️ `config` est lu au démarrage (FB_STATIC, pas de temps réel) : une tournée enregistrée arrive chez l'équipe à
//    sa PROCHAINE OUVERTURE de l'app.
// ══════════════════════════════════════════════════════════════════
window._mvOrdreMap = function(){
  var m = (window.CONFIG||{}).ordre_passage_t;
  return (m && typeof m === 'object' && !Array.isArray(m)) ? m : {};
};
// Les tournées telles que les écrans les lisent (ordre en pid). Celles d'avant TRN-1 portent `ancienne:true`.
window._mvTourneesLues = function(){
  var C = window.CONFIG || {};
  if (Array.isArray(C.tournees)) return C.tournees.filter(function(t){ return t && Array.isArray(t.ordre) && Array.isArray(t.taches); });
  var m = window._mvOrdreMap(), by = {}, out = [];
  (window.PARCELLES||[]).forEach(function(p){ if(p && p.nom && p.pid) by[p.nom] = p.pid; });
  Object.keys(m).forEach(function(t){
    var e = m[t]; if(!e || !Array.isArray(e.ordre) || !e.ordre.length) return;
    var nom = t; try{ if(typeof tNom === 'function') nom = tNom(t); }catch(err){ nom = t; }
    out.push({ id:'h-'+t, nom:nom, taches:[t], ordre:e.ordre.map(function(n){ return by[n] || ('n:'+n); }), date:e.date||'', par:e.par||'', ancienne:true });
  });
  return out;
};
// La tournée que suit une tâche, ou null.
window._mvTourneeDe = function(tache){
  if(!tache || typeof window._mvTourneesLues !== 'function') return null;
  var T = window._mvTourneesLues();
  for (var i = 0; i < T.length; i++) if (T[i].taches.indexOf(tache) >= 0) return T[i];
  return null;
};
// Tournée d'une tâche, en NOMS, ou null. Aucun repli sur l'ancien tableau global : celui-ci avait été rangé pour un
// jeu de tâches inconnu, l'appliquer à toutes serait afficher un parcours qu'on ne peut pas justifier.
// L'ordre d'une tournée, en NOMS de parcelles (pid ou « n:nom » résolus ; une parcelle disparue est sautée).
window._mvTourneeNoms = function(t){
  var by = {}, noms = [], vus = {};
  (window.PARCELLES||[]).forEach(function(p){ if(!p || !p.nom) return; if(p.pid) by[p.pid] = p; by['n:'+p.nom] = p; });
  (t && t.ordre || []).forEach(function(id){ var p = by[id]; if(p && !vus[p.nom]){ vus[p.nom] = 1; noms.push(p.nom); } });
  return noms;
};
window._mvOrdreFor = function(tache){
  if(!tache) return null;
  var t = (typeof window._mvTourneeDe === 'function') ? window._mvTourneeDe(tache) : null;
  if(t){
    var noms = window._mvTourneeNoms(t);
    return noms.length ? { tache:tache, ordre:noms, date:t.date||'', par:t.par||'', nom:t.nom||'', id:t.id||'' } : null;
  }
  if(Array.isArray((window.CONFIG||{}).tournees)) return null;
  var e = window._mvOrdreMap()[tache];
  if(e && Array.isArray(e.ordre) && e.ordre.length){
    return { tache:tache, ordre:e.ordre.slice(), date:e.date||'', par:e.par||'' };
  }
  return null;
};
// Tâches qui suivent une tournée, dans l'ordre du catalogue de saison.
window._mvOrdreTaches = function(){
  var ok = [];
  if(typeof window._mvTourneesLues === 'function'){
    window._mvTourneesLues().forEach(function(t){ if(t.ordre.length) t.taches.forEach(function(x){ if(x && ok.indexOf(x) < 0) ok.push(x); }); });
  } else {
    var m = window._mvOrdreMap();
    ok = Object.keys(m).filter(function(k){ var e=m[k]; return e && Array.isArray(e.ordre) && e.ordre.length; });
  }
  var ref = [];
  try{ ref = ((typeof window.getTachesSaison==='function') ? window.getTachesSaison() : (window.TACHES||[])).map(function(t){ return t.nom; }); }catch(e){ ref = []; }
  var rank = {}; ref.forEach(function(n,i){ rank[n]=i; });
  return ok.sort(function(a,b){ var ra=(rank[a]==null?9999:rank[a]), rb=(rank[b]==null?9999:rank[b]); return (ra-rb) || String(a).localeCompare(String(b),'fr'); });
};
// ★★ TRN-2 (§331) — UNE TOURNÉE PAR ÉQUIPE. Nico (14/10) : fermer « une tournée par équipe ». Les équipes vivent au
//   jour (ÉQUIPES-1, CONFIG.equipes_jour) : l'administrateur y choisit, pour chaque équipe, une tournée — sinon celle
//   du travail. { m:['Victor','Shana'], t:'<id de tournée>' }. Lu pour la PERSONNE CONNECTÉE sur ses écrans de
//   terrain (Parcelles : liste, numéros, barre, carte, anneau) ; Décider et le Tracteur gardent la tournée du travail.
window._mvTourneeEquipe = function(nom, iso){
  if(nom==null) return '';
  var P = _mvEqEnPlace(iso);   // ★ EQDEF-2 (§493) : l'équipe EN PLACE — du jour, ou gardée d'un enregistrement d'avant
  if(!P) return '';
  for (var i = 0; i < P.eq.length; i++){ if(P.eq[i].m.indexOf(String(nom)) >= 0) return P.eq[i].t || ''; }
  return '';
};
window._mvOrdreMoi = function(tache){
  if(!tache) return null;
  var moi = window.currentUser && window.currentUser.nom, iso;
  if(typeof window._mvToday === 'function') iso = window._mvToday();
  else { var d = new Date(); iso = d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  var id = moi ? window._mvTourneeEquipe(moi, iso) : '';
  if(id && typeof window._mvTourneesLues === 'function'){
    var t = window._mvTourneesLues().filter(function(x){ return x.id === id; })[0];
    if(t){
      var noms = window._mvTourneeNoms(t);
      if(noms.length) return { tache:tache, ordre:noms, date:t.date||'', par:t.par||'', nom:t.nom||'', id:t.id||'', equipe:true };
    }
  }
  return window._mvOrdreFor(tache);
};
// NUMÉROTATION VIVANTE : le rang est recalculé sur les parcelles réellement
// affichées → 1, 2, 3… sans trou quand une parcelle est terminée. C'est déjà ce
// que fait Pilotage (_opParcelles reprojette l'ordre sur ce qui reste à faire).
// Une parcelle absente de la tournée n'a pas de rang : elle passe après.
window._mvOrdreRangs = function(tache, noms, moi){   // moi : la tournée de l'équipe du jour d'abord (TRN-2)
  var out = { rang:{}, n:0, ok:false, hors:0 };
  var o = (moi && typeof window._mvOrdreMoi === 'function') ? window._mvOrdreMoi(tache) : window._mvOrdreFor(tache);
  if(!o) return out;
  out.ok = true;
  var vus = {}; (noms||[]).forEach(function(n){ if(n) vus[n]=1; });
  var k = 0;
  o.ordre.forEach(function(n){ if(vus[n] && out.rang[n]==null){ k++; out.rang[n]=k; } });
  out.n = k;
  out.hors = Math.max(0, (noms||[]).length - k);
  return out;
};

// ══ LA DERNIÈRE PARCELLE VALIDÉE — définition UNIQUE (CIBLE-1, §163) ═══════════
// D'où part la tournée du jour, et d'où part « Qui fait quoi » quand aucune
// tournée n'est enregistrée : une seule réponse à « où a-t-on validé en dernier ».
// (Ce n'est PAS ce que montrent les anneaux des cartes : voir `_mvCibleCarte`.)
// ⚠️ « Dernière » se lit sur la DATE DU TRAVAIL, puis sur l'HEURE DE SAISIE : on
//   valide plusieurs parcelles le même jour, et l'ordre du tableau ne dit rien de
//   l'heure (le journal est rangé du plus récent au plus ancien, une fusion entre
//   appareils peut le mêler). L'heure de saisie est l'`id` — Date.now() en
//   hexadécimal, suivi de « -qv » pour une validation depuis la carte. Avant
//   CIBLE-1, le départ « dernière faite » de la tournée était la PREMIÈRE du jour.
// ⚠️ Une validation ANNULÉE ensuite (même parcelle, même tâche, saisie plus tard)
//   ne compte plus : `annulerTache` ajoute une ligne « Annulé » au journal, il ne
//   retire pas la ligne « Validé ». Sans heure lisible d'un côté, le jour tranche.
// `taches` : noms de tâches, vide ou absent = toutes. `garde(p)` : filtre
// facultatif — la tournée ne part que d'une parcelle placée sur la carte.
// Renvoie { p, nom, date, tache } ou null. Parcelles arrachées écartées.
window._mvDerniereValidee = function(taches, garde){
  function heure(j){
    var m = /^([0-9a-f]{9,12})(?![0-9a-f])/i.exec(String((j && j.id) || ''));
    var t = m ? parseInt(m[1], 16) : 0;
    return (t > 1.5e12 && t < 4.1e12) ? t : 0;
  }
  var tset = null;
  if(Array.isArray(taches) && taches.length){ tset = {}; taches.forEach(function(t){ if(t) tset[t] = 1; }); }
  var parc = {};
  (window.PARCELLES || []).forEach(function(p){ if(p && p.nom && p.statut !== 'Arrachee') parc[p.nom] = p; });
  var ann = {}, val = [];
  (window.JOURNAL || []).forEach(function(j, i){
    if(!j || j.meteo || !j.parcelle || !j.date) return;
    if(tset && !tset[j.tache]) return;
    var e = { j: j, d: String(j.date), t: heure(j), i: i, k: String(j.parcelle) + '\u0001' + String(j.tache || '') };
    if(j.statut === 'Annulé') (ann[e.k] = ann[e.k] || []).push(e);
    else if(j.statut === 'Validé' && parc[j.parcelle]) val.push(e);
  });
  function annulee(v){
    return (ann[v.k] || []).some(function(c){ return (c.t && v.t) ? c.t > v.t : c.d >= v.d; });
  }
  val.sort(function(a, b){ return (a.d < b.d ? 1 : (a.d > b.d ? -1 : 0)) || (b.t - a.t) || (a.i - b.i); });
  for(var n = 0; n < val.length; n++){
    var v = val[n], p = parc[v.j.parcelle];
    if(annulee(v)) continue;
    if(typeof garde === 'function' && !garde(p)) continue;
    return { p: p, nom: p.nom, date: v.d, tache: String(v.j.tache || '') };
  }
  return null;
};
// ══ LA PARCELLE QUE LES CARTES MONTRENT — définition UNIQUE (CIBLE-1, §163) ═══
// Nico : « montrer soit celle commencée et non finie, soit la prochaine à faire,
// commandée par le module Décider ». Pour une tâche, dans cet ordre :
//   ① les parcelles COMMENCÉES et pas finies — « Début » touché, pas encore
//      validé. Il peut y en avoir plusieurs (deux équipes, un oubli de la
//      veille) : chacune a son anneau, aucune n'est cachée ;
//   ② sinon la PROCHAINE : la première de la tournée ENREGISTRÉE dans Décider
//      qui reste à faire — le même « 1 » que la liste des parcelles affiche.
//      Sans tournée enregistrée, rien : personne n'a dit par où commencer.
// ⚠️ « Commencée » et « finie » se lisent à l'ÉTAPE EN COURS pour une tâche à
//   passages ou à niveaux : une parcelle dont P1 est validé n'est pas finie pour
//   la saison, mais elle l'est pour le passage du moment. C'est la lecture de
//   l'écran Vigne (`_pvCurDone`, `_pvCurStarted`), qui passe par ici.
window._mvTacheEtat = function(p, T){
  if(!p || !T) return '';
  var f = function(n){ return (typeof window[n] === 'function') ? window[n] : null; };
  var type = f('_pvType') ? window._pvType(T) : 'simple';
  if(type === 'simple'){
    var s = f('getTacheStatut') ? window.getTacheStatut(p, T) : ((window._tachesFor ? window._tachesFor(p) : (p.taches || {}))[T] || '');
    return (s === 'Validé') ? 'finie' : ((s === 'En cours') ? 'commencee' : 'a-faire');
  }
  var i   = f('_pvEtapeCourante') ? window._pvEtapeCourante(T) : 1;
  var eff = f('_pvEffPlan') ? window._pvEffPlan(p, T) : i;
  if(i > eff) return 'finie';                       // étape non applicable sur cette parcelle
  var st = f('_pvStepState') ? window._pvStepState(p, T, i) : '';
  if(st === 'Validé' || st === 'Auto') return 'finie';
  return (st === 'Commencé') ? 'commencee' : 'a-faire';
};
// La priorité du moment : celle de l'équipe où l'on est, sinon la première.
// C'est la tâche sur laquelle ouvre l'écran Vigne, donc celle que montrent les
// cartes qui n'affichent pas de tâche (Carte du domaine, Parcelles sur « toutes »).
window._mvTachePrio = function(){
  try{ return (typeof window._prioDefaultTask === 'function') ? (window._prioDefaultTask() || '') : ''; }
  catch(e){ if(window._mvAvale) window._mvAvale(e, 'utils.js/_mvTachePrio'); return ''; }
};
// Renvoie { etat:'commencee'|'prochaine', ps:[parcelles], tache } ou null.
window._mvCibleCarte = function(T){
  if(!T || !window._mvVueActive()) return null;
  var act = (window.PARCELLES || []).filter(function(p){
    return p && p.nom && p.statut !== 'Arrachee' &&
      !((typeof window._mvTacheExclue === 'function') ? window._mvTacheExclue(p, T) : ((p.tachesExclues || []).indexOf(T) >= 0));   // SEL-1
  });
  var presta = function(p){ return typeof window._mvAuPrestataire === 'function' && window._mvAuPrestataire(p, T); };   // ARRACH-9 : faite pour l'équipe
  var comm = act.filter(function(p){ return window._mvTacheEtat(p, T) === 'commencee' && !presta(p); });
  if(comm.length) return { etat: 'commencee', ps: comm, tache: T };
  var o = (typeof window._mvOrdreMoi === 'function') ? window._mvOrdreMoi(T) : ((typeof window._mvOrdreFor === 'function') ? window._mvOrdreFor(T) : null);   // TRN-2 : la tournée de son équipe
  if(!o) return null;
  var par = {}; act.forEach(function(p){ par[p.nom] = p; });
  for(var i = 0; i < o.ordre.length; i++){
    var p = par[o.ordre[i]];
    if(p && window._mvTacheEtat(p, T) !== 'finie' && !presta(p)) return { etat: 'prochaine', ps: [p], tache: T };
  }
  return null;
};
// La vue montre-t-elle la période ACTIVE ? Consulter une archive remet dans
// `p.taches` l'avancement de l'archive (Lot 4, app.js) : un repère « d'aujourd'hui »
// y mentirait. Même question pour la tournée (`_pOrdPeriodeOK`) : une réponse.
window._mvVueActive = function(){
  try{
    var a = (typeof window.getSaisonActive === 'function') ? ((window.getSaisonActive() || {}).nom || '') : '';
    if(!a) return true;
    return (typeof window._visuSaison !== 'function') || window._visuSaison() === a;
  }catch(e){ if(window._mvAvale) window._mvAvale(e, 'utils.js/_mvVueActive'); return true; }
};
// L'anneau lui-même, sur une carte Leaflet : non cliquable (le toucher passe à la
// parcelle dessous), sous les autres repères, animé par la feuille (`.mv-cible-o`)
// — c'est elle qui le fige quand le téléphone demande moins de mouvement.
window._mvCibleAnneau = function(map, g){
  if(!map || !g || !window.L) return null;
  try{
    var ic = window.L.divIcon({ className: 'mv-cible', html: '<i class="mv-cible-o"></i>', iconSize: [40, 40], iconAnchor: [20, 20] });
    return window.L.marker([g.lat, g.lng], { icon: ic, interactive: false, keyboard: false, zIndexOffset: -1000 }).addTo(map);
  }catch(e){ if(window._mvAvale) window._mvAvale(e, 'utils.js/_mvCibleAnneau'); return null; }
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
// ── LE JOUR, EN HEURE LOCALE (FUS-2) ──────────────────────────────
// ⚠️⚠️⚠️ `_mvToday()` rend la date UTC, pas celle du
// vigneron. A Paris, entre minuit et 2 h (ete) ou 1 h (hiver), c'est LA VEILLE :
//     Paris 15/09/2026 00 h 30  ->  "2026-09-14"
// Une pesee de caisses a 00 h 30 pendant les vendanges, un ajout de SO2 en fin de
// nuit, une ligne de journal : dates de la veille, en silence. Deux de ces
// registres sont reglementaires, et la cave se travaille la nuit.
// Le bon patron existait deja dans le depot (`_gnrTodayISO`, tracteur.js) : il est
// promu ici, et il n'y a plus qu'une definition du mot  aujourd'hui .
//
// ⚠️⚠️ NE PAS s'en servir pour les allers-retours JOUR-EPOQUE : `_mvJourApres`
// ci-dessous, `_mvFutIso`, `_cmpISO`/`_cmpEchelle`/`_cmpSeuil` (reglages.js),
// `_arcISO`/`_pexIsoPlus` (pilotage.js) sont UTC de bout en bout, et le RESTER est
// precisement ce qui les rend justes sous tous les fuseaux (mv-harnais-fuseau).
// La regle n'est pas  local partout , c'est  une seule horloge par fonction .
export function _mvISO(d){
  var x = (d instanceof Date) ? d : new Date(d);
  if(!x || isNaN(x.getTime())) return '';
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0')
                         + '-' + String(x.getDate()).padStart(2, '0');
}
export function _mvToday(){ return _mvISO(new Date()); }
window._mvISO   = _mvISO;
window._mvToday = _mvToday;

window._mvJourApres = function(iso){
  if(!iso) return '';
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  if(!m) return iso;
  var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if(isNaN(d.getTime())) return iso;
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

// ★ 4e argument `avecBureau` (10/09/2026) : « qui travaille la vigne ? » exclut le
//   bureau, « qui coute ? » l'inclut. Les trois lecteurs de capacite passent sans
//   lui ; la masse salariale de l'exercice (_pexData) passe true — un salaire est
//   un salaire. Avant, son commentaire disait « le bureau N'EST PAS exclu » et
//   cette ligne faisait le contraire (defaut 0a-quater, mesure le 14/08).
// ★ PRES-1 (26/09/2026) — la fiche porte-t-elle AU MOINS une date de contrat ?
//   Une periode sans debut ni fin ne situe rien dans le temps : elle compte comme
//   « sans date », exactement comme une fiche sans periode du tout.
window._mvSansDateContrat = function(m){
  if(!m) return true;
  var P = (typeof window._mvContrats === 'function') ? (window._mvContrats(m) || []) : [];
  for(var i = 0; i < P.length; i++){ if(P[i].debut || P[i].fin) return false; }
  return true;
};
// ★ PRES-1 — une fiche SANS DATE compte-t-elle sur la periode [d0, d1] ?
//   Active : oui. Inactive : seulement sur les annees ou elle a des heures saisies
//   (window.PLANNING_ENTRIES[nom][annee]). yDef = annee de repli quand d0 est vide
//   (le Planning passe son annee de calcul, _pY()).
window._mvCompteSansDate = function(m, d0, d1, yDef){
  if(!m) return false;
  if(m.statut !== 'Inactif') return true;
  var y0 = parseInt(String(d0 || '').slice(0, 4), 10) || yDef || new Date().getFullYear();
  var y1 = parseInt(String(d1 || '').slice(0, 4), 10) || y0;
  var E = (window.PLANNING_ENTRIES || {})[m.nom];
  if(!E) return false;
  for(var y = y0; y <= y1; y++){ if(E[y]) return true; }
  return false;
};

window._mvEnContratSurPeriode = function(m, d0, d1, avecBureau){
  if(!m || (m.bureau && !avecBureau)) return false;
  var P = window._mvContrats(m);
  // ★★★ FICHE SANS AUCUNE DATE DE CONTRAT — regle de presence du 26/09/2026 (lot PRES-1),
  //   qui REMPLACE la convention du 09/07 (« CDI sans date = present, statut ignore »).
  //   Decision de Nico : tout salarie a des dates de contrat ; une fiche qui n'en a pas
  //   est une fiche a completer, et le diagnostic du Pilotage le signale (constat
  //   « fiche sans date de contrat », cible Reglages › Equipe).
  //     • Active sans date   -> presente (inchange).
  //     • Inactive sans date -> ABSENTE, sauf sur les annees ou elle porte des heures
  //       saisies au planning : ces heures ont ete faites et se paient, elles ne doivent
  //       disparaitre ni de la grille, ni des totaux, ni du releve envoye a la compta.
  //   ⚠️ UNE SEULE DEFINITION : _mvSansDateContrat + _mvCompteSansDate ci-dessous, lues
  //   aussi par le Planning (_planCouvre, _planJourCouvert, _inContractDay) et par
  //   _mvEnContratLe. Deux regles de « etait-il la ? » = deux ecrans qui se contredisent.
  if(window._mvSansDateContrat(m)) return window._mvCompteSansDate(m, d0, d1);
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
// ⚰️ _mvProj (effectif constant x journee reglee) a ete RETIRE au lot DZ-1 (§162) : son seul appelant etait
//   l'ancien verdict de l'ordre de passage. La tournee se deroule maintenant JOUR PAR JOUR avec l'equipe du
//   planning (_dzSimuler, pilotage.js) ; _mvFenetre reste la seule definition de la fenetre.

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

// ★★★ AXE-1 — LE MOIS D'OUVERTURE DE LA CAMPAGNE EST UN REGLAGE.
// Il valait 8 en dur (1er aout -> 31 juillet). C'est l'usage de reference, ce
// n'est pas l'usage de tout le monde : sur bien des domaines l'annee vigne va
// d'octobre a septembre, pour que la VENDANGE CLOTURE le cycle qu'elle
// aboutit, au lieu de l'ouvrir. Avec aout, la campagne 2025-2026 associe la
// vendange 2025 aux travaux qui produiront le millesime 2026 : le document le
// dit, mais le cadre reste faux pour qui compte autrement.
// ⚠️ DEFAUT 7 (aout) : aucun domaine existant ne bouge sans le demander.
// ⚠️⚠️ Ce reglage ne touche PAS le millesime (annee civile de vendange, §11c) :
//   une campagne contient deux millesimes quel que soit son mois d'ouverture.
var MV_CAMP_MOIS_DEF = 7;                     // aout — l'usage historique
function _mvCampagneMois(){
  var v=parseInt(((window.CONFIG&&window.CONFIG.eco)||{}).campagne_mois,10);
  return (isNaN(v)||v<0||v>11)?MV_CAMP_MOIS_DEF:v;
}
// Campagne CONTENANT une date. Le numero est celui de l'annee d'OUVERTURE :
// avec un mois d'ouverture en octobre, le 6 septembre 2026 est encore sur 2025.
function _mvCampagneDe(iso){
  var md=_mvCampagneMois()+1;                 // 1-12, pour comparer au mois ISO
  var p=String(iso||'').split('-');
  var an=parseInt(p[0],10), mo=parseInt(p[1],10);
  if(!an||!mo) { var d=new Date(); return ((d.getMonth()+1)>=md)?d.getFullYear():d.getFullYear()-1; }
  return (mo>=md)?an:(an-1);
}
// ★★ SOURCE UNIQUE DES BORNES. Elles etaient recopiees a quatre endroits en
//    dur ('-08-01' / '-07-31') : cave.js (bilan), pilotage.js (archives, frise).
//    new Date(an+1, md, 0) rend le dernier jour du mois precedent l'annee
//    suivante, y compris md=0 (campagne civile : 1er janv -> 31 dec).
function _mvCampagneBornes(c){
  c=parseInt(c,10); if(isNaN(c)) c=_mvCampagneDe(_mvAujIso());
  var md=_mvCampagneMois();
  var fin=new Date(c+1, md, 0);
  var mm=md+1, fm=fin.getMonth()+1, fj=fin.getDate();
  return {
    an:c, mois:md, civil:(md===0),
    d0:c+'-'+(mm<10?'0':'')+mm+'-01',
    d1:fin.getFullYear()+'-'+(fm<10?'0':'')+fm+'-'+(fj<10?'0':'')+fj,
    court:(md===0)?String(c):(c+'\u2013'+(c+1)),
    lbl:(md===0)
      ? ('Ann\u00e9e civile '+c)
      : ('1\u1D49\u02B3 '+MV_EX_MOIS_LBL[md]+' '+c+' \u2192 '+fj+' '+MV_EX_MOIS_LBL[fin.getMonth()]+' '+fin.getFullYear())
  };
}
window._mvCampagneDe      = _mvCampagneDe;
window._mvCampagneMois    = _mvCampagneMois;
window._mvCampagneBornes  = _mvCampagneBornes;

// ════════════════════════════════════════════════════════════════════════════
// ★★ SEL-1 — LES TÂCHES « À LA SÉLECTION » : ARRACHAGE, DÉSHERBAGE, EFFEUILLAGE
//
// Ces trois travaux ne concernent jamais tout le domaine, et pas les mêmes
// parcelles d'une année à l'autre (Nico, 02/10 : « l'année prochaine ce sera
// d'autres parcelles qui seront à arracher »). Le réglage « tâche désactivée sur
// la parcelle » (p.tachesExclues) marche À L'ENVERS de ce besoin — tout est
// concerné tant qu'on n'a pas exclu — et il est PERMANENT.
//
// Règle : une parcelle est concernée par une tâche à la sélection, pour une
// campagne C, si
//   ① elle a été cochée pour C   (p.selCamp[tache] === C), OU
//   ② la tâche y a été saisie au journal pendant C (« Validé » ou « En cours »).
// ② n'est pas un confort : une effeuilleuse validée sur une parcelle oubliée dans
// la sélection compte ses heures (le temps réel verse sur les validations, §172)
// — l'avancement doit la voir aussi. C'est aussi ce qui garde intactes les
// validations faites avant ce lot, sans migration.
//
// ⚠️ On stocke le NUMÉRO de campagne, pas un booléen : à la campagne suivante, la
//   sélection tombe d'elle-même, sans tâche planifiée ni remise à zéro.
// ⚠️ p.tachesExclues est IGNORÉ pour ces trois tâches. Les autres tâches gardent
//   l'ancienne règle, inchangée.
// ⚠️ La campagne de référence est celle de la période CONSULTÉE (archives), la
//   campagne du jour sur la période active (§11c, axe campagne).
// ════════════════════════════════════════════════════════════════════════════
var MV_TACHES_SEL = ['Arrachage', 'Desherbage', 'Effeuillage'];
function _mvTacheSel(nom){ return MV_TACHES_SEL.indexOf(String(nom == null ? '' : nom)) >= 0; }
function _mvCampRef(){
  try{
    var sa = (typeof window.getSaisonActive === 'function') ? (window.getSaisonActive() || {}) : {};
    var act = sa.nom || '';
    var vn = (typeof window._visuSaison === 'function') ? window._visuSaison() : act;
    if(vn && act && vn !== act){
      var s = _saisonObj(vn);
      if(s && s.debut) return _mvCampagneDe(s.debut);
    }
  }catch(e){ if(window._mvAvale) window._mvAvale(e, 'utils.js/_mvCampRef'); }
  return _mvCampagneDe(_mvAujIso());
}
function _mvCampNum(camp){
  var c = parseInt(camp, 10);
  return isNaN(c) ? _mvCampRef() : c;
}
// Couples parcelle × tâche saisis au journal pendant la campagne. Mémoire courte :
// la clé suit la longueur du journal et ses deux bouts (une saisie s'ajoute en
// tête, une annulation aussi).
// ★★ ARRACH-8 (§306) — UNE SAISIE ANNULÉE ENSUITE NE COMPTE PLUS : la définition commune.
//   « Annulé » (annulerTache) remet la tâche ENTIÈRE à zéro pour la période : il annule les saisies du couple
//   parcelle × tâche faites AVANT lui, pendant la MÊME période. « Annulé » d'une étape d'arrachage
//   (annulerArrEtape) n'annule que cette étape. « Avant » se lit sur l'heure de SAISIE (l'id = Date.now() en
//   hexadécimal) : une annulation vise ce qui était saisi avant elle, y compris un passage antidaté ; sans heure
//   lisible d'un côté, le jour tranche. La période est celle où la saisie a été FAITE : une annulation d'octobre
//   ne touche pas la taille de l'hiver d'avant.
//   C'est la règle de « la dernière parcelle validée » (CIBLE-1, _mvDerniereValidee), étendue aux étapes et
//   bornée à la période. Le temps réel du Pilotage (pilotage.js, _ecoTvEvents) garde la sienne : il retire la
//   DERNIÈRE clôture du couple (RÉAL-1). Les trois disent la même chose dans le cas courant (mv-harnais-arrach8).
//   Vécu : un arrachage annulé deux fois restait « Dernier passage » de la fiche, et gardait la parcelle dans la
//   sélection de l'arrachage (« 0/1 tâche » à faire).
function _mvJHeure(j){
  var m = /^([0-9a-f]{9,12})(?![0-9a-f])/i.exec(String((j && j.id) || ''));
  var t = m ? parseInt(m[1], 16) : 0;
  return (t > 1.5e12 && t < 4.1e12) ? t : 0;
}
// La période où une saisie a été FAITE : son heure de saisie, sinon son jour.
function _mvJPer(t, d){
  var f = (typeof _saisonForDate === 'function') ? _saisonForDate : window._saisonForDate;
  if(typeof f !== 'function') return '';
  if(t){ var x = new Date(t); d = x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2); }
  return f(d) || '';
}
var _MV_ANNUL = null;
function _mvAnnulIdx(){
  var J = window.JOURNAL || [];
  var k = J.length + '|' + ((J[0] && J[0].id) || '') + '|' + ((J[J.length - 1] && J[J.length - 1].id) || '');
  if(_MV_ANNUL && _MV_ANNUL.k === k) return _MV_ANNUL.a;
  var a = {};
  for(var i = 0; i < J.length; i++){
    var j = J[i];
    if(!j || j.meteo || !j.parcelle || !j.tache || String(j.statut || '') !== 'Annul\u00e9') continue;
    var t = _mvJHeure(j), d = String(j.date || '').slice(0, 10), c = String(j.parcelle) + '\u0000' + j.tache;
    (a[c] = a[c] || []).push({ t: t, d: d, e: j.etape ? String(j.etape) : '', per: _mvJPer(t, d) });
  }
  _MV_ANNUL = { k: k, a: a };
  return a;
}
function _mvAnnulee(j){
  if(!j || !j.parcelle || !j.tache) return false;
  var st = String(j.statut || '');
  if(st !== 'Valid\u00e9' && st !== 'En cours') return false;
  var L = _mvAnnulIdx()[String(j.parcelle) + '\u0000' + j.tache];
  if(!L) return false;
  var t = _mvJHeure(j), d = String(j.date || '').slice(0, 10), e = j.etape ? String(j.etape) : '', per = null;
  for(var i = 0; i < L.length; i++){
    var a = L[i];
    if(a.e && a.e !== e) continue;                        // une étape annulée ne vise qu'elle
    if(!((a.t && t) ? a.t > t : a.d >= d)) continue;      // saisie APRÈS l'annulation : elle compte
    if(per === null) per = _mvJPer(t, d);
    if(a.per === per) return true;                        // saisie pendant la même période
  }
  return false;
}
// ★★ ARRACH-8 (§306) — APRÈS SA DATE D'ARRACHAGE, UNE PARCELLE NE PORTE PLUS QUE L'ARRACHAGE.
//   Deux lectures de p.dateArrachage (posée par saveArrachage), qui jusqu'ici ne servait qu'à l'affichage :
//   · _mvApresArrachage(p, j) : une saisie de travail (Validé, En cours) d'une AUTRE tâche, datée après
//     l'arrachage, est une erreur — vécu : une parcelle arrachée avant l'appli, déclarée après coup, portait des
//     passages saisis entre-temps. Elle reste au journal (rien ne s'efface) mais ne compte plus : ni temps réel
//     (_ecoTvEvents), ni « dernier passage ». Une « Annulé » n'est jamais écartée : elle doit trouver ce qu'elle vise.
//   · _mvArrAvantPeriode(p) : arrachée AVANT le début de la période consultée → plus aucun travail dans cette
//     période, même l'arrachage — sauf un arrachage en étapes entamé et pas fini (app.js, _arrEntame).
//   Sans date d'arrachage (parcelle déclarée avant ARRACH-1), rien ne change.
function _mvArrDate(p){
  var d = String((p && p.dateArrachage) || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '';
}
window._mvApresArrachage = function(p, j){
  if(!p || !j || p.statut !== 'Arrachee' || j.tache === 'Arrachage') return false;
  var st = String(j.statut || '');
  if(st !== 'Valid\u00e9' && st !== 'En cours') return false;
  var a = _mvArrDate(p);
  return !!a && String(j.date || '').slice(0, 10) > a;
};
function _mvArrAvantPeriode(p, vn){
  if(!p || p.statut !== 'Arrachee') return false;
  var a = _mvArrDate(p); if(!a) return false;
  if(vn == null) vn = (typeof window._visuSaison === 'function') ? window._visuSaison()
    : (((typeof window.getSaisonActive === 'function') ? window.getSaisonActive() : null) || {}).nom;
  var s = _saisonObj(vn);
  if(!s || !s.debut || a >= String(s.debut).slice(0, 10)) return false;
  if(typeof window._arrEntame === 'function' && window._arrEntame(p)) return false;
  return true;
}
var _MV_SEL_TRAV = null;
function _mvSelTravaillees(camp){
  var c = _mvCampNum(camp);
  var J = window.JOURNAL || [];
  var k = c + '|' + J.length + '|' + ((J[0] && J[0].id) || '') + '|' + ((J[J.length - 1] && J[J.length - 1].id) || '');
  if(_MV_SEL_TRAV && _MV_SEL_TRAV.k === k) return _MV_SEL_TRAV.m;
  var b = _mvCampagneBornes(c), m = {};
  for(var i = 0; i < J.length; i++){
    var j = J[i];
    if(!j || j.meteo || !j.parcelle || !j.tache || !_mvTacheSel(j.tache)) continue;
    var d = String(j.date || '').slice(0, 10);
    if(!d || d < b.d0 || d > b.d1) continue;
    var st = String(j.statut || '');
    if(st !== 'Valid\u00e9' && st !== 'En cours') continue;
    if(_mvAnnulee(j)) continue;   // ★ ARRACH-8 : annulée ensuite, elle ne fait plus une parcelle « travaillée »
    m[String(j.parcelle) + '\u0000' + j.tache] = true;
  }
  _MV_SEL_TRAV = { k: k, m: m };
  return m;
}
function _mvSelChoisie(p, nom, camp){
  var s = p && p.selCamp;
  return !!(s && typeof s === 'object' && !Array.isArray(s) && Number(s[nom]) === _mvCampNum(camp));
}
// Une parcelle arrachée ne reçoit plus que l'arrachage — et plus rien du tout dans une période qui commence
// après son arrachage (★ ARRACH-8, _mvArrAvantPeriode).
function _mvSelEligible(p, nom){
  return !!(p && p.nom != null && (p.statut !== 'Arrachee' || nom === 'Arrachage') && !_mvArrAvantPeriode(p));
}
// ★ COMPTE-1 (§353) : une tâche pilotée par les trous ne concerne pas une parcelle comptée à zéro (rien à planter).
function _mvTacheConcerne(p, nom, camp){
  if(p && typeof window._cptHors === 'function' && window._cptHors(p, nom)) return false;
  if(!p) return false;
  if(!_mvTacheSel(nom)) return (p.tachesExclues || []).indexOf(nom) < 0 && !(p.horsPer && _mvHorsPer(p, nom));   // ★ RETRAIT-1 (§325) : ou désactivée pour la période consultée
  var c = _mvCampNum(camp);
  if(_mvSelChoisie(p, nom, c)) return true;
  return !!_mvSelTravaillees(c)[String(p.nom) + '\u0000' + nom];
}
function _mvTacheExclue(p, nom, camp){ return !_mvTacheConcerne(p, nom, camp); }
// Coche / décoche pour une campagne. N'écrit RIEN en base : l'appelant sauve.
function _mvSelPose(p, nom, on, camp){
  if(!p || !_mvTacheSel(nom)) return false;
  var c = _mvCampNum(camp);
  var s = (p.selCamp && typeof p.selCamp === 'object' && !Array.isArray(p.selCamp)) ? Object.assign({}, p.selCamp) : {};
  if(on) s[nom] = c;
  else if(Number(s[nom]) === c) delete s[nom];
  if(Object.keys(s).length) p.selCamp = s; else delete p.selCamp;
  return true;
}
// Résumé pour Réglages : parcelles concernées, hectares, dont « déjà travaillées ».
function _mvSelResume(nom, camp){
  var c = _mvCampNum(camp), n = 0, ha = 0, trav = 0;
  var T = _mvSelTravaillees(c);
  (window.PARCELLES || []).forEach(function(p){
    if(!_mvSelEligible(p, nom) || !_mvTacheConcerne(p, nom, c)) return;
    n++; ha += parseFloat(p.surface) || 0;
    if(T[String(p.nom) + '\u0000' + nom]) trav++;
  });
  return { n: n, ha: Math.round(ha * 100) / 100, trav: trav, camp: c, court: _mvCampagneBornes(c).court };
}
// ★★ ARRACH-5 — UNE FACTURE DE PRESTATAIRE NE SE NOTE QU'UNE FOIS, ET SUR L'ÉTAPE.
//   Nico (02/10) : « il faut que la facture prestataire ne puisse pas se noter ailleurs ». Les deux
//   endroits qui portent un montant de fournisseur avec son n° de facture sont l'étape d'arrachage
//   (journal : prestaNom, prestaFact) et les achats de La Réserve (four, fact). La garde est
//   CROISÉE : chacun refuse une facture (fournisseur + n°) déjà connue de l'autre. Et La Réserve
//   refuse un intrant dont le nom dit « prestation » / « main-d'œuvre » / « arrachage » : ce n'est
//   pas un intrant, c'est une prestation, qui se note sur l'étape.
//   ⚠️ Sans n° de facture, la garde croisée ne peut rien prouver : elle ne devine pas.
function _mvFactNorm(s){ return String(s == null ? '' : s).toLowerCase().replace(/[\s.\-_/]+/g, '').trim(); }
function _mvFactureOu(four, num, exclure){
  var f = _mvFactNorm(four), n = _mvFactNorm(num);
  if(!n) return '';
  var ex = exclure || '';
  if(ex !== 'achat'){
    var A = ((window.INTRANTS || {}).achats) || [];
    for(var i = 0; i < A.length; i++){
      var a = A[i]; if(!a) continue;
      if(_mvFactNorm(a.fact) === n && (!f || !_mvFactNorm(a.four) || _mvFactNorm(a.four) === f)) return 'achat';
    }
  }
  if(ex !== 'presta'){
    var J = window.JOURNAL || [];
    for(var k = 0; k < J.length; k++){
      var j = J[k]; if(!j || !j.presta || j.statut !== 'Valid\u00e9') continue;
      if(_mvFactNorm(j.prestaFact) === n && (!f || !_mvFactNorm(j.prestaNom) || _mvFactNorm(j.prestaNom) === f)) return 'presta';
    }
  }
  return '';
}
var MV_RE_PRESTA = /prestat|main[\s\-]*d.?\s*(?:\u0153|oe)uvre|arrachage/i;
function _mvNomPrestation(nom){ return MV_RE_PRESTA.test(String(nom == null ? '' : nom)); }
window._mvFactureOu       = _mvFactureOu;
window._mvNomPrestation   = _mvNomPrestation;
window.MV_TACHES_SEL      = MV_TACHES_SEL;
window._mvTacheSel        = _mvTacheSel;
window._mvCampRef         = _mvCampRef;
window._mvSelTravaillees  = _mvSelTravaillees;
window._mvSelChoisie      = _mvSelChoisie;
window._mvSelEligible     = _mvSelEligible;
window._mvTacheConcerne   = _mvTacheConcerne;
window._mvTacheExclue     = _mvTacheExclue;
window._mvSelPose         = _mvSelPose;
window._mvAnnulee         = _mvAnnulee;
window._mvArrAvantPeriode = _mvArrAvantPeriode;
window._mvSelResume       = _mvSelResume;

// ════════════════════════════════════════════════════════════════════════════
// ★★ RETRAIT-1 (§325) — UNE TÂCHE ORDINAIRE SE DÉSACTIVE SUR UNE PARCELLE POUR UNE PÉRIODE
//
// Nico (13/10, dicté) : « en hiver, je peux avoir certaines vignes à réparer ; au printemps, d'autres. Il faut que ce
// soit par période, telles qu'elles ont été définies, pas une campagne annuelle » — et en retirer plusieurs d'un coup,
// « faire parcelle par parcelle, c'est très long ».
//
// Règle : une tâche ordinaire (toutes sauf l'arrachage, le désherbage manuel et l'effeuillage, SEL-1) concerne toutes
// les parcelles, sauf
//   ① un retrait posé AVANT ce lot (p.tachesExclues) — il valait pour TOUTES les périodes, et il le garde ;
//   ② un retrait pour la période lue : p.horsPer[nom de la période] contient la tâche.
// À la période suivante, rien n'est retiré : chaque période a sa liste, sans remise à zéro ni tâche planifiée.
// ⚠️ _mvTacheConcerne lit la période CONSULTÉE (_visuSaison) : celle de la fiche (p.taches / _tachesFor) et de la roue
//   crantée. Une fonction qui reçoit une période en argument passe par _mvConcernePer (planning.js, _chargeSaisonData_).
//   Les deux disent la même chose sur la période consultée (mv-harnais-retrait1, A3).
// ⚠️ Remettre la tâche sur une parcelle retirée avant ce lot change ce retrait en retraits sur chacune des AUTRES
//   périodes du domaine (_mvPerRemet) : les périodes passées ne bougent pas. Sans geste, l'ancien retrait reste tel quel.
// ⚠️ Le nom de la période est une CLÉ, comme p.tachesAll : il suit un renommage (reglages.js, _renamePeriode) ; le nom
//   de la tâche suit le sien (reglages.js, _renameTache). Rien n'est écrit en base ici : l'appelant sauve.
// ════════════════════════════════════════════════════════════════════════════
function _mvPerRef(per){
  if(per != null && String(per) !== '') return String(per);
  var vn = '';
  try{
    vn = (typeof window._visuSaison === 'function') ? (window._visuSaison() || '') : '';
    if(!vn){ var sa = (typeof window.getSaisonActive === 'function') ? (window.getSaisonActive() || {}) : {}; vn = sa.nom || ''; }
  }catch(e){ if(window._mvAvale) window._mvAvale(e, 'utils.js/_mvPerRef'); }
  return String(vn || '');
}
function _mvHorsPer(p, nom, per){
  var h = p && p.horsPer;
  if(!h || typeof h !== 'object' || Array.isArray(h)) return false;
  var L = h[_mvPerRef(per)];
  return Array.isArray(L) && L.indexOf(nom) >= 0;
}
// La règle de _mvTacheConcerne, pour une période passée en argument.
function _mvConcernePer(p, nom, per){
  if(!p) return false;
  if(_mvTacheSel(nom)) return _mvTacheConcerne(p, nom);
  return (p.tachesExclues || []).indexOf(nom) < 0 && !_mvHorsPer(p, nom, per);
}
// Désactive (on) ou remet (!on) la tâche pour UNE période. Refuse une tâche à la sélection et une période vide.
function _mvHorsPose(p, nom, on, per){
  if(!p || !nom || _mvTacheSel(nom)) return false;
  var k = _mvPerRef(per); if(!k) return false;
  var h = (p.horsPer && typeof p.horsPer === 'object' && !Array.isArray(p.horsPer)) ? Object.assign({}, p.horsPer) : {};
  var L = Array.isArray(h[k]) ? h[k].filter(function(x){ return x !== nom; }) : [];
  if(on) L.push(nom);
  if(L.length) h[k] = L; else delete h[k];
  if(Object.keys(h).length) p.horsPer = h; else delete p.horsPer;
  return true;
}
// Remet la tâche sur la parcelle pour la période. Un retrait d'avant RETRAIT-1 (p.tachesExclues) valait pour toutes les
// périodes : il devient un retrait sur chacune des AUTRES périodes du domaine, puis disparaît — l'historique ne bouge pas.
function _mvPerRemet(p, nom, per){
  if(!p || !nom || _mvTacheSel(nom)) return false;
  var k = _mvPerRef(per); if(!k) return false;
  var ex = Array.isArray(p.tachesExclues) ? p.tachesExclues : [];
  if(ex.indexOf(nom) >= 0){
    (window.SAISONS || []).forEach(function(s){ if(s && s.nom && String(s.nom) !== k) _mvHorsPose(p, nom, true, s.nom); });
    p.tachesExclues = ex.filter(function(x){ return x !== nom; });
  }
  _mvHorsPose(p, nom, false, k);
  return true;
}
// Résumé pour la roue crantée : parcelles concernées sur les parcelles possibles (une arrachée ne l'est pas), hectares.
function _mvPerResume(nom, per){
  var k = _mvPerRef(per), n = 0, N = 0, ha = 0;
  (window.PARCELLES || []).forEach(function(p){
    if(!_mvSelEligible(p, nom)) return;
    N++;
    if(_mvConcernePer(p, nom, k)){ n++; ha += parseFloat(p.surface) || 0; }
  });
  return { n: n, N: N, ha: Math.round(ha * 100) / 100, per: k };
}
window._mvPerRef          = _mvPerRef;
window._mvHorsPer         = _mvHorsPer;
window._mvConcernePer     = _mvConcernePer;
window._mvHorsPose        = _mvHorsPose;
window._mvPerRemet        = _mvPerRemet;
window._mvPerResume       = _mvPerResume;

// ════════════════════════════════════════════════════════════════════════════
// ★★ SANSREC-1 (§332) — « PAS DE RÉCOLTE CETTE ANNÉE » : UNE PARCELLE EN PLACE QU'ON NE VENDANGE PAS.
// Nico (14/10) : une parcelle promise à l'arrachage, rendue impropre à la récolte avant les vendanges, restait « encore sur
// pied » dans la Cave et au Revient ; la seule porte de sortie était de la déclarer arrachée. Un seul fait, déjà stocké, lu
// partout : la Vendange désactivée sur la parcelle (RETRAIT-1 : p.horsPer, ou un retrait d'avant, p.tachesExclues) pour CHAQUE
// période de l'année qui porte la vendange. Aucun champ neuf : la Vigne (avancement, planning, L'année) le lisait déjà.
//   · _mvEstVendange(nom) : la tâche de vendange — le drapeau t.couperet d'abord, sinon le nom « Vendange(s) » à l'égalité
//     STRICTE, sur le nom normalisé par _mvNormTache (même règle que _rfEstCouperet, pilotage.js : « Vendanges vertes » est de
//     l'éclaircissage). Deux définitions de « la vendange » subsistent : à faire converger.
//   · _mvVendangePers(mil) : { nom, pers } — la tâche et les périodes qui la portent dans l'année civile mil (le millésime).
//   · _mvSansRecolte(p, mil, V) : vrai si la parcelle, en place, n'est concernée par la vendange dans AUCUNE de ces périodes.
//     Une récolte saisie l'emporte toujours : c'est au lecteur de le vérifier (_vendResteARentrer, _pecRevData).
//   Sans période qui porte la vendange cette année-là, rien n'est « sans récolte » : la question ne se pose pas.
function _mvEstVendange(nom){
  var t = (window.TACHES || []).find(function(x){ return x && x.nom === nom; });
  if(t && t.couperet === true) return true;
  var k = _mvNormTache(nom);
  return k === 'vendange' || k === 'vendanges';
}
function _mvVendangePers(mil){
  var a = String(mil), d0 = a + '-01-01', d1 = a + '-12-31', out = { nom: '', pers: [] };
  (window.SAISONS || []).forEach(function(s){
    if(!s || !s.nom || !s.debut || !s.fin) return;
    if(String(s.fin).slice(0, 10) < d0 || String(s.debut).slice(0, 10) > d1) return;
    var L = _saisonTaches(s.nom);
    if(!Array.isArray(L)) return;
    for(var i = 0; i < L.length; i++){
      if(!_mvEstVendange(L[i])) continue;
      if(!out.nom) out.nom = L[i];
      if(L[i] === out.nom) out.pers.push(s.nom);
      break;
    }
  });
  return out;
}
function _mvSansRecolte(p, mil, V){
  if(!p || p.nom == null || p.statut === 'Arrachee') return false;
  V = V || _mvVendangePers(mil);
  if(!V || !V.nom || !V.pers || !V.pers.length) return false;
  for(var i = 0; i < V.pers.length; i++){ if(_mvConcernePer(p, V.nom, V.pers[i])) return false; }
  return true;
}
window._mvEstVendange     = _mvEstVendange;
window._mvVendangePers    = _mvVendangePers;
window._mvSansRecolte     = _mvSansRecolte;

// ════════════════════════════════════════════════════════════════════════════
// ★★★ LES FENETRES D'UNE ANNEE — la liste unique que lisent les documents
//
// Un document date doit dire SUR QUOI il porte, et deux documents qui disent
// « la campagne » doivent parler de la meme chose. Avant ce lot, le mot servait
// a trois sens : l'axe 1er aout, l'« annee vigne » du Pilotage (d'apres une
// vendange a la fin de la suivante) et, dans l'export phyto, la PERIODE de
// travail consultee. Un vigneron qui sortait deux registres « de la campagne »
// obtenait deux perimetres.
//
// ⚠️ La periode de travail garde son nom : « periode », jamais « campagne ».
// ⚠️ La derniere entree n'a pas de bornes ('' / '') : c'est « tout », et un
//    lecteur doit tester d0 ET d1 avant de filtrer.
// ════════════════════════════════════════════════════════════════════════════
function _mvFenetresAnnee(opt){
  opt=opt||{};
  var out=[], nCamp=parseInt(opt.campagnes,10), nExo=parseInt(opt.exercices,10);
  if(isNaN(nCamp)) nCamp=3;
  if(isNaN(nExo))  nExo=2;
  var auj=(typeof _mvAujIso==='function')?_mvAujIso():new Date().toISOString().slice(0,10);

  // 1) Les campagnes, la plus recente d'abord. C'est l'annee de TRAVAIL.
  var cCur=_mvCampagneDe(auj);
  for(var i=0;i<nCamp;i++){
    var b=_mvCampagneBornes(cCur-i);
    out.push({k:'camp'+(cCur-i), axe:'campagne',
              lbl:'Campagne '+b.court+(i===0?' (en cours)':''),
              sub:b.lbl, d0:b.d0, d1:b.d1});
  }
  // 2) Les exercices comptables. Ils peuvent coincider avec la campagne — on le
  //    DIT plutot que de masquer la ligne : deux cadres qui tombent ensemble,
  //    c'est une information, pas un doublon a cacher.
  if(typeof _mvExerciceList==='function'){
    var L=[]; try{ L=_mvExerciceList(nExo)||[]; }catch(e){ L=[]; }
    L.forEach(function(x,j){
      if(!x||!x.d0||!x.d1) return;
      var meme=out.some(function(f){ return f.axe==='campagne' && f.d0===x.d0 && f.d1===x.d1; });
      out.push({k:'exo'+x.an, axe:'exercice',
                lbl:'Exercice comptable '+x.court+(j===0?' (en cours)':''),
                sub:x.lbl+(meme?' \u2014 m\u00eames dates que la campagne':''),
                d0:x.d0, d1:x.d1});
    });
  }
  // 3) La periode de travail consultee — nommee periode, jamais campagne.
  var nom=(typeof window._visuSaison==='function')?window._visuSaison():'';
  var s=(nom && typeof window._saisonObj==='function')?window._saisonObj(nom):null;
  if(s && s.debut && s.fin){
    out.push({k:'per', axe:'periode', lbl:'P\u00e9riode de travail \u2014 '+nom,
              sub:'du '+_mvFenFr(s.debut)+' au '+_mvFenFr(s.fin), d0:s.debut, d1:s.fin});
  }
  // 4) Tout. Sans bornes : c'est ce qui rend le filtre facultatif chez l'appelant.
  out.push({k:'tout', axe:'tout', lbl:'Tout l\u2019historique',
            sub:'depuis la mise en service', d0:'', d1:''});
  return out;
}
function _mvFenFr(iso){
  var p=String(iso||'').split('-');
  return (p.length===3)?(p[2]+'/'+p[1]+'/'+p[0]):String(iso||'');
}
window._mvFenetresAnnee   = _mvFenetresAnnee;
window._mvFenFr           = _mvFenFr;

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
/* ★★ FUT-CAP — LA CONTENANCE D'UN LOT, en litres. Absente = le reglage du
   domaine (CONFIG.cave.fut_l), que ce fichier ne lit PAS : la famille _mvFut*
   recoit ses donnees en argument (§20e). null plutot que 228 : un lot qui suit
   le domaine suit aussi un changement de ce reglage. */
function _mvFutL(o){
  var v = parseFloat(o && o.l);
  return (isFinite(v) && v > 0) ? Math.round(v * 10) / 10 : null;
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
  var e = {id:_mvFutRid(), date:_mvToday(), sens:m.sens, motif:motif,
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
            l:_mvFutL(f), nom:_mvFutRef(f) || 'Lot sans nom'};
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
// ════════════════════════════════════════════════════════════════════════════
// LE FUT LOUE — un lot est ACHETE ou LOUE (lot FUT-LOC, 10/09/2026)
// ────────────────────────────────────────────────────────────────────────────
// L'exercice comptable et la fiche d'aide promettaient la location depuis le
// premier jour : « une location de futs, elle, entre : c'est un loyer annuel ».
// Le modele ne portait AUCUN champ pour la dire. Promesse ecrite deux fois,
// tenue zero. `mode` la rend saisissable :
//   'achat' (defaut, retro-compatible) -> `prix` = total HT du lot, `dfact` = date
//                                          de facture, `fact` = numero
//   'loc'                              -> `loyer` = HT par fut ET PAR AN,
//                                          `debut` / `fin` = bornes du contrat
// ⚠️ `loyer` est PAR FUT et non par lot : rendre deux futs en cours de contrat
//   doit faire baisser le loyer sans qu'on retouche le contrat.
// ⚠️⚠️ L'ASSIETTE N'EST PAS `qte`. INTRANTS.futs[].qte ne compte que les futs
//   LIBRES — des qu'un fut part en cuvee il vit dans CAVE_ELEVAGE (_mvFutEnVin).
//   Facturer sur `qte` seul, ce serait ne payer que les futs vides. On apparie
//   donc le lot avec les futs en vin sur le triplet four/ref/annee, par
//   _mvFutMemeLot — la meme egalite que partout, jamais une seconde definition.
// ⚠️⚠️⚠️ SI DEUX LOTS PARTAGENT LE TRIPLET, on ne devine pas : l'assiette
//   retombe sur les futs libres et le lot ressort `ambigu:true`. Repartir les
//   futs en vin « au prorata » aurait donne un chiffre plausible et faux, avec
//   l'autorite d'une mesure.
function _mvFutModeDe(f){ return (f && f.mode === 'loc') ? 'loc' : 'achat'; }
function _mvFutEstLoc(f){ return _mvFutModeDe(f) === 'loc'; }
// Date qui DATE un lot achete : la facture d'abord, la saisie en repli. Les lots
// crees avant ce lot n'ont que `date` (= _today() du jour de saisie) : on ne
// fabrique pas une date de facture qu'on n'a pas, on utilise celle qui existe.
function _mvFutDateAchat(f){ return String((f && (f.dfact || f.date)) || '').slice(0,10); }

function _mvFutMs(iso){
  var p = String(iso || '').split('-');
  if(p.length < 3) return null;
  var t = Date.UTC(+p[0], (+p[1] || 1) - 1, (+p[2] || 1));
  return isFinite(t) ? t : null;
}
function _mvFutIso(ms){ return new Date(ms).toISOString().slice(0,10); }

// Assiette d'un lot loue : futs libres + futs en vin du MEME lot.
function _mvFutAssiette(INTRANTS, CAVE_ELEVAGE, f, curY){
  var libres = Math.max(0, parseInt(f && f.qte, 10) || 0);
  var jumeaux = ((INTRANTS && INTRANTS.futs) || []).filter(function(x){ return _mvFutMemeLot(x, f); });
  if(jumeaux.length > 1) return {q:libres, enVin:0, ambigu:true};
  var ev = _mvFutEnVin(CAVE_ELEVAGE, curY), enVin = 0;
  (ev.lignes || []).forEach(function(l){ if(_mvFutMemeLot(l, f)) enVin += (parseInt(l.nb,10) || 0); });
  return {q:libres + enVin, enVin:enVin, ambigu:false};
}

// Mouvements qui changent ce qu'on DETIENT. Entonner ou embouteiller deplace un
// fut, ne l'ajoute ni ne le retire : ces motifs-la n'entrent pas ici.
var MV_FUT_DETENTION = {achat:1, vente:-1, retour:-1, destruction:-1};

// Loyer d'UN lot sur une fenetre de dates, au prorata des JOURS et de la
// quantite REELLEMENT detenue chaque jour.
// ⚠️ La quantite est remontee en arriere depuis aujourd'hui : q(t) = detenu
//   aujourd'hui moins la somme signee des mouvements posterieurs a t. C'est la
//   seule facon d'avoir la quantite d'un jour passe sans stocker un historique
//   qui n'existe pas.
// ⚠️ `fut_mouv` date ses entrees AU JOUR DE LA SAISIE, pas au jour du fait
//   (_mvFutTracer). Un retour note trois jours plus tard decale le loyer de trois
//   jours — quelques euros. C'est ecrit ici pour ne pas etre redecouvert.
function _mvFutLoyerLot(INTRANTS, CAVE_ELEVAGE, f, d0, d1, curY){
  var vide = {eur:0, jours:0, qFin:0, ambigu:false, sansLoyer:false};
  if(!_mvFutEstLoc(f)) return vide;
  // ★ ABSENT ET ZERO SONT DEUX ETATS, ici comme pour les prix. `Number(null)`
  //   vaut 0 : ecrit tel quel, un contrat SANS loyer passait pour une location
  //   GRATUITE — 0 EUR facture, et rien dans la liste « a completer ». Un loyer de
  //   0 reste legitime (fut prete par la tonnellerie) : c'est bien trois etats.
  var loyer = (f.loyer != null && isFinite(Number(f.loyer))) ? Number(f.loyer) : null;
  var a0 = _mvFutMs(f.debut), a1 = _mvFutMs(f.fin);
  var w0 = _mvFutMs(d0), w1 = _mvFutMs(d1);
  if(w0 == null || w1 == null) return vide;
  if(a0 == null) a0 = w0;                       // contrat sans debut : la fenetre
  if(a1 == null) a1 = w1;                       // contrat sans fin   : la fenetre
  var s = Math.max(a0, w0), e = Math.min(a1, w1);
  var A = _mvFutAssiette(INTRANTS, CAVE_ELEVAGE, f, curY);
  if(e < s) return {eur:0, jours:0, qFin:A.q, ambigu:A.ambigu, sansLoyer:(loyer == null)};
  if(loyer == null || !(loyer >= 0))
    return {eur:0, jours:Math.round((e-s)/86400000)+1, qFin:A.q, ambigu:A.ambigu, sansLoyer:true};

  // Mouvements de detention du lot, dates, tries du plus recent au plus ancien.
  var mv = ((INTRANTS && INTRANTS.fut_mouv) || []).filter(function(m){
    return m && MV_FUT_DETENTION[m.motif] != null && _mvFutMemeLot(m, f) && _mvFutMs(m.date) != null;
  }).sort(function(x, y){ return _mvFutMs(y.date) - _mvFutMs(x.date); });

  var jours = 0, cumul = 0;
  for(var t = s; t <= e; t += 86400000){
    var q = A.q;
    for(var i = 0; i < mv.length; i++){
      var md = _mvFutMs(mv[i].date);
      if(md <= t) break;                        // trie : au premier passe, on sort
      q -= MV_FUT_DETENTION[mv[i].motif] * (parseInt(mv[i].nb, 10) || 0);
    }
    if(q > 0){ cumul += q; jours++; }
  }
  return {eur:cumul * loyer / 365, jours:jours, qFin:A.q, ambigu:A.ambigu, sansLoyer:false};
}

// Tous les lots loues sur une fenetre. Rend le total ET le detail : un ecran qui
// affiche un loyer doit pouvoir dire de quel contrat il vient.
function _mvFutLoyer(INTRANTS, CAVE_ELEVAGE, d0, d1, curY){
  var lignes = [], eur = 0, nSansLoyer = 0, nAmbigu = 0;
  ((INTRANTS && INTRANTS.futs) || []).forEach(function(f){
    if(!_mvFutEstLoc(f)) return;
    var r = _mvFutLoyerLot(INTRANTS, CAVE_ELEVAGE, f, d0, d1, curY);
    if(r.sansLoyer) nSansLoyer++;
    if(r.ambigu) nAmbigu++;
    if(r.jours <= 0 && !(r.eur > 0)) return;    // contrat entierement hors fenetre
    eur += r.eur;
    lignes.push({id:f.id, nom:_mvFutRef(f) || 'Lot sans nom', four:f.four || '', ref:f.ref || '',
                 annee:_mvFutAn(f.annee), loyer:Number(f.loyer) || 0, qte:r.qFin,
                 debut:f.debut || '', fin:f.fin || '', jours:r.jours, eur:r.eur,
                 ambigu:r.ambigu, sansLoyer:r.sansLoyer});
  });
  lignes.sort(function(a, b){ return b.eur - a.eur; });
  return {eur:eur, lignes:lignes, n:lignes.length, nSansLoyer:nSansLoyer, nAmbigu:nAmbigu};
}

// Jours restants avant la fin d'un contrat, a partir d'une date de reference.
function _mvFutJoursFin(f, isoRef){
  if(!_mvFutEstLoc(f)) return null;
  var a1 = _mvFutMs(f.fin), r = _mvFutMs(isoRef || _mvToday());
  if(a1 == null || r == null) return null;
  return Math.round((a1 - r) / 86400000);
}

function _mvFutParc(INTRANTS, CAVE_ELEVAGE, curY){
  curY = curY || new Date().getFullYear();
  var cfg = (window.CONFIG && window.CONFIG.cave) || {};
  var vie = parseInt(cfg.futs_vie, 10) || 5;
  var preavis = parseInt(cfg.futs_preavis, 10);
  if(!(preavis > 0)) preavis = 90;              // jours avant fin de contrat
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

  // ★★★ DEUX SIGNAUX, DEUX GESTES (lot FUT-LOC, 10/09/2026).
  //   Un fut ACHETE en fin de vie se REFORME. Un fut LOUE en fin de contrat se
  //   REND. Le meme compteur pour les deux donnait un ordre faux : on ne reforme
  //   pas le bien de quelqu'un d'autre, et un contrat qui se termine ne previent
  //   pas parce que le fut a fait cinq vins.
  // ⚠️ Le loue reste dans la PYRAMIDE et dans la part des anges : il travaille
  //   comme les autres. Il sort de la seule alerte de reforme.
  var refIso = _mvFutIso(Date.UTC(curY, new Date().getMonth(), new Date().getDate()));
  var loc = [], aRendre = 0, locQte = 0;
  ((INTRANTS && INTRANTS.futs) || []).forEach(function(f){
    if(!_mvFutEstLoc(f)) return;
    var A = _mvFutAssiette(INTRANTS, CAVE_ELEVAGE, f, curY);
    var j = _mvFutJoursFin(f, refIso);
    locQte += A.q;
    var due = (j != null && j <= preavis);
    if(due) aRendre += A.q;
    loc.push({id:f.id, nom:_mvFutRef(f) || 'Lot sans nom', four:f.four || '', ref:f.ref || '',
              annee:_mvFutAn(f.annee), qte:A.q, libres:Math.max(0, parseInt(f.qte,10) || 0),
              enVin:A.enVin, ambigu:A.ambigu, loyer:Number(f.loyer) || 0,
              debut:f.debut || '', fin:f.fin || '', jours:j, aRendre:due});
  });
  loc.sort(function(a, b){
    if(a.jours == null) return 1;
    if(b.jours == null) return -1;
    return a.jours - b.jours;
  });

  // Les futs loues sortent du compteur de reforme. `lignes[].reforme` reste un
  // drapeau d'AGE par annee — c'est ce que la pyramide colore, et le loue y garde
  // sa place ; seul le NOMBRE a reformer est net de location.
  var aRef = lignes.filter(function(l){ return l.reforme; })
                   .reduce(function(s, l){ return s + l.total; }, 0);
  var locRef = loc.filter(function(l){ return l.annee != null && (curY - l.annee) >= vie; })
                  .reduce(function(s, l){ return s + l.qte; }, 0);
  aRef = Math.max(0, aRef - locRef);

  return {curY:curY, vie:vie, preavis:preavis, stock:st, enVin:ev, libres:st.total, occupes:ev.total,
          parc:parc, sansRef:ev.sansRef, tracePct:ev.tracePct, lignes:lignes,
          aReformer:aRef,
          loc:loc, locQte:locQte, aRendre:aRendre, achQte:Math.max(0, parc - locQte),
          neufs:lignes.filter(function(l){ return l.vins === 0; })
                      .reduce(function(s,l){ return s+l.total; }, 0),
          mouv:_mvFutMouv(INTRANTS, curY)};
}

// ── ENTREE au parc : fusion sur un lot identique ───────────────────────────
function _mvFutEntrer(INTRANTS, lot, nb, motif, note){
  if(!INTRANTS) return 0;
  if(!INTRANTS.futs) INTRANTS.futs = [];
  nb = parseInt(nb, 10) || 0; if(nb <= 0) return 0;
  var cible = {four:(lot&&lot.four)||'', ref:(lot&&lot.ref)||'', annee:_mvFutAn(lot&&lot.annee),
               l:_mvFutL(lot)};
  /* ★ FUT-CAP — un fut qui revient retrouve un lot de SA contenance : un
     demi-muid ne se fond jamais dans un lot de pieces du meme tonnelier, sinon
     sa contenance disparaitrait sans bruit a la premiere mise en bouteille. */
  var ex = INTRANTS.futs.find(function(f){ return _mvFutMemeLot(f, cible) && _mvFutL(f) === cible.l; });
  if(ex) ex.qte = (parseInt(ex.qte,10)||0) + nb;
  else {
    var nv = {id:_mvFutRid(), four:cible.four, ref:cible.ref,
        annee:(cible.annee==null?'':String(cible.annee)), qte:nb,
        date:_mvToday()};
    if(cible.l) nv.l = cible.l;
    INTRANTS.futs.push(nv);
  }
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
// ── REMETTRE EN ELEVAGE : l'inverse de la mise en bouteille ────────────────
// ★ FUT-CAP-2 — une cuvee « Embouteillee » par erreur, remise en elevage depuis
//   sa fiche, reprend ses futs au parc : sinon ils compteraient DEUX fois — libres
//   au parc ET en vin dans la cuvee. Meme egalite que le retour : triplet ET
//   contenance. _mvFutDispo dit combien sont encore libres, en simulant la prise
//   (deux lignes sur un meme lot ne comptent pas deux fois ses futs) ; l'appelant
//   refuse s'il en manque — on ne reprend jamais un fut reparti ailleurs.
function _mvFutLotsDe(INTRANTS, t){
  return ((INTRANTS && INTRANTS.futs) || []).filter(function(f){
    return _mvFutMemeLot(f, t) && _mvFutL(f) === _mvFutL(t); });
}
function _mvFutDispo(cuvee, INTRANTS){
  var libre = {}, besoin = 0, dispo = 0;
  ((INTRANTS && INTRANTS.futs) || []).forEach(function(f){ libre[f.id] = Math.max(0, parseInt(f.qte,10)||0); });
  ((cuvee && cuvee.tonneaux) || []).forEach(function(t){
    var reste = parseInt(t && t.nb, 10) || 0; if(reste <= 0) return;
    besoin += reste;
    _mvFutLotsDe(INTRANTS, t).forEach(function(f){
      var n = Math.min(reste, libre[f.id] || 0);
      libre[f.id] -= n; reste -= n; dispo += n;
    });
  });
  return {besoin:besoin, dispo:dispo, manque:besoin - dispo};
}
function _mvFutReprendre(cuvee, INTRANTS, note){
  var pris = 0;
  ((cuvee && cuvee.tonneaux) || []).forEach(function(t){
    var reste = parseInt(t && t.nb, 10) || 0;
    _mvFutLotsDe(INTRANTS, t).forEach(function(f){
      if(reste <= 0) return;
      var n = Math.min(reste, Math.max(0, parseInt(f.qte,10)||0)); if(n <= 0) return;
      f.qte = (parseInt(f.qte,10)||0) - n; reste -= n; pris += n;
      _mvFutTracer(INTRANTS, 'entonnage', f, n, note);
    });
  });
  if(INTRANTS && INTRANTS.futs)
    INTRANTS.futs = INTRANTS.futs.filter(function(f){ return (parseInt(f.qte,10)||0) > 0; });
  return pris;
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
    var o = {annee:_mvFutAn(lot.annee), nb:pris, four:lot.four||'', ref:lot.ref||'', lot_id:lot.id};
    var _l = _mvFutL(lot);
    if(_l) o.l = _l;   // ★ FUT-CAP : la contenance part avec le fut
    out.push(o);
  });
  if(INTRANTS && INTRANTS.futs){
    INTRANTS.futs = INTRANTS.futs.filter(function(f){ return (parseInt(f.qte,10)||0) > 0; });
  }
  return out;
}
function _mvFutTotal(choix){
  return Object.keys(choix || {}).reduce(function(s,k){ return s + (parseInt(choix[k],10)||0); }, 0);
}

window.MV_FUT_MOTIFS   = MV_FUT_MOTIFS;
window.MV_FUT_SEP      = MV_FUT_SEP;
window._mvFutAn        = _mvFutAn;
window._mvFutVins      = _mvFutVins;
window._mvFutAge       = _mvFutAge;
window._mvFutRef       = _mvFutRef;
window._mvFutL         = _mvFutL;
window._mvFutDispo     = _mvFutDispo;
window._mvFutReprendre = _mvFutReprendre;
window._mvFutMemeLot   = _mvFutMemeLot;
window._mvFutTracer    = _mvFutTracer;
window._mvFutMouv      = _mvFutMouv;
window._mvFutStock     = _mvFutStock;
window._mvFutEnVin     = _mvFutEnVin;
window._mvFutParc      = _mvFutParc;
window._mvFutModeDe    = _mvFutModeDe;
window._mvFutEstLoc    = _mvFutEstLoc;
window._mvFutDateAchat = _mvFutDateAchat;
window._mvFutAssiette  = _mvFutAssiette;
window._mvFutLoyerLot  = _mvFutLoyerLot;
window._mvFutLoyer     = _mvFutLoyer;
window._mvFutJoursFin  = _mvFutJoursFin;
window.MV_FUT_DETENTION= MV_FUT_DETENTION;
window._mvFutEntrer    = _mvFutEntrer;
window._mvFutLiberer   = _mvFutLiberer;
window._mvFutRetirer   = _mvFutRetirer;
window._mvFutSeparer   = _mvFutSeparer;
window._mvFutEntonner  = _mvFutEntonner;
window._mvFutTotal     = _mvFutTotal;

window._saisonObj         = _saisonObj;
window._saisonForDate     = _saisonForDate;
window._saisonTaches      = _saisonTaches;

// Constantes sur window pour accès depuis modules non-ES (firebase compat, inline HTML)
window.TABREV             = TABREV;
window.TCLS               = TCLS;
window.TEMJ               = TEMJ;
window.COULEURS_MBR       = COULEURS_MBR;
/* ★ FORME-1 (§301) — LA FORME D'UNE PARCELLE, TIRÉE DE SON CONTOUR. Une seule lecture pour le plan du cockpit
   (« Le domaine en direct »), sa loupe et les deux fiches de parcelle. Le contour vient de kml_polygons
   (window.KML_POLYGONS_DYNAMIC, en [lat, lng]) : passé en mètres, nord en haut, ramené à l'origine.
   ⚠️ Le sens des rangs dessinés est un repère (la longueur du plus petit rectangle qui enferme la parcelle) : le contour
   ne dit pas le vrai sens de plantation. En Côte-d'Or, la longueur d'une lanière suit la pente, les rangs aussi, le plus souvent. */
var _MV_M_LAT = 110540, _MV_M_LNG = 111320, _MV_FORME_CACHE = {};
function _mvFormeNettoyer(r){
  var o = [];
  (r || []).forEach(function(q){
    if(!q || q.length < 2) return;
    var a = +q[0], b = +q[1]; if(!isFinite(a) || !isFinite(b)) return;
    var l = o[o.length - 1]; if(!l || Math.abs(l[0] - a) > 1e-10 || Math.abs(l[1] - b) > 1e-10) o.push([a, b]);
  });
  if(o.length > 2){ var f = o[0], z = o[o.length - 1]; if(Math.abs(f[0] - z[0]) < 1e-10 && Math.abs(f[1] - z[1]) < 1e-10) o.pop(); }
  return o.length >= 3 ? o : null;
}
function _mvFormeAire(r){ var a = 0; for(var i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2); }
function _mvFormeEnveloppe(pts){
  var P = pts.slice().sort(function(a, b){ return a[0] - b[0] || a[1] - b[1]; }); if(P.length < 3) return P;
  var cr = function(o, a, b){ return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }, lo = [], up = [], i;
  for(i = 0; i < P.length; i++){ while(lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], P[i]) <= 0) lo.pop(); lo.push(P[i]); }
  for(i = P.length - 1; i >= 0; i--){ while(up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], P[i]) <= 0) up.pop(); up.push(P[i]); }
  up.pop(); lo.pop(); return lo.concat(up);
}
// Le sens des rangs : la longueur du plus petit rectangle qui enferme la parcelle, en degrés (0 = vers l'est).
function _mvFormeAxe(pts){
  var H = _mvFormeEnveloppe(pts), best = null;
  for(var i = 0; i < H.length; i++){
    var a = H[i], b = H[(i + 1) % H.length], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), c = Math.cos(ang), s = Math.sin(ang);
    var u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for(var k = 0; k < H.length; k++){ var u = H[k][0] * c + H[k][1] * s, v = -H[k][0] * s + H[k][1] * c; if(u < u0) u0 = u; if(u > u1) u1 = u; if(v < v0) v0 = v; if(v > v1) v1 = v; }
    var L = u1 - u0, l = v1 - v0;
    if(!best || L * l < best.A) best = { A: L * l, ang: L >= l ? ang : ang + Math.PI / 2 };
  }
  if(!best) return 90;
  var d = best.ang * 180 / Math.PI; return ((d % 180) + 180) % 180;
}
function _mvFormeDedans(x, y, rings){
  var o = false;
  rings.forEach(function(r){ for(var i = 0, j = r.length - 1; i < r.length; j = i++){ var a = r[i], b = r[j]; if((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) o = !o; } });
  return o;
}
function _mvFormeDist(x, y, rings){
  var m = Infinity;
  rings.forEach(function(r){ for(var i = 0, j = r.length - 1; i < r.length; j = i++){
    var a = r[j], b = r[i], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
    var t = L2 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L2)) : 0, px = a[0] + t * dx - x, py = a[1] + t * dy - y, d = px * px + py * py;
    if(d < m) m = d;
  } });
  return Math.sqrt(m);
}
// Le point le plus loin des bords : l'équipe et l'onde s'y posent (une parcelle en équerre a son centre hors d'elle).
function _mvFormePole(rings, w, h){
  var best = { x: w / 2, y: h / 2, r: -1 }, x0 = 0, y0 = 0, cw = w, ch = h;
  for(var passe = 0; passe < 4; passe++){
    for(var i = 0; i <= 12; i++) for(var j = 0; j <= 12; j++){
      var x = x0 + cw * i / 12, y = y0 + ch * j / 12;
      if(!_mvFormeDedans(x, y, rings)) continue;
      var r = _mvFormeDist(x, y, rings); if(r > best.r) best = { x: x, y: y, r: r };
    }
    cw /= 3; ch /= 3; x0 = best.x - cw / 2; y0 = best.y - ch / 2;
  }
  if(best.r < 0){ var sx = 0, sy = 0, n = 0; rings.forEach(function(r){ r.forEach(function(q){ sx += q[0]; sy += q[1]; n++; }); }); best = { x: sx / n, y: sy / n, r: 0 }; }
  return best;
}
// Un ou plusieurs anneaux [lat, lng] → { rings (mètres, ramenés à l'origine), w, h, aire (m²), ang (sens des rangs), pole },
// ou null (pas de contour exploitable). Gardé en mémoire : le plan se recharge à chaque dessin du cockpit.
function _mvFormeDe(geo){
  var R = (geo || []).map(_mvFormeNettoyer).filter(Boolean); if(!R.length) return null;
  var cle = R.map(function(r){ return r.length + ':' + r[0].join(',') + ':' + r[r.length - 1].join(','); }).join(';');
  if(Object.prototype.hasOwnProperty.call(_MV_FORME_CACHE, cle)) return _MV_FORME_CACHE[cle];
  var la = 0, n = 0; R.forEach(function(r){ r.forEach(function(q){ la += q[0]; n++; }); });
  var kx = _MV_M_LNG * Math.cos(la / n * Math.PI / 180);
  var M = R.map(function(r){ return r.map(function(q){ return [q[1] * kx, -q[0] * _MV_M_LAT]; }); }).filter(function(r){ return _mvFormeAire(r) > 4; });
  var f = null;
  if(M.length){
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    M.forEach(function(r){ r.forEach(function(q){ if(q[0] < x0) x0 = q[0]; if(q[1] < y0) y0 = q[1]; if(q[0] > x1) x1 = q[0]; if(q[1] > y1) y1 = q[1]; }); });
    M = M.map(function(r){ return r.map(function(q){ return [q[0] - x0, q[1] - y0]; }); });
    var w = x1 - x0, h = y1 - y0, tous = [];
    M.forEach(function(r){ tous = tous.concat(r); });
    f = { rings: M, w: w, h: h, aire: M.reduce(function(t, r){ return t + _mvFormeAire(r); }, 0), ang: _mvFormeAxe(tous), pole: _mvFormePole(M, w, h) };
  }
  _MV_FORME_CACHE[cle] = f;
  return f;
}
// Les contours d'une parcelle, par son nom (la même règle que la carte : sans tenir compte de la casse).
function _mvParcContours(nom){
  var n = String(nom == null ? '' : nom).toLowerCase();
  return (window.KML_POLYGONS_DYNAMIC || []).filter(function(k){ return k && Array.isArray(k.pts) && String(k.name || '').toLowerCase() === n; }).map(function(k){ return k.pts; });
}
function _mvParcForme(nom){ var g = _mvParcContours(nom); return g.length ? _mvFormeDe(g) : null; }
// Les rangs dessinés : un motif par angle, au pas de 5° (90 = rangs verticaux). L'échelle : 1, 2, 5, 10, 20, 25, 50 m…
function _mvFormeAngle(a){ return ((Math.round((a - 90) / 5) * 5) % 180 + 180) % 180; }
var _MV_FORME_PAS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];
function _mvFormePas(k, mini, maxi){
  var d = _MV_FORME_PAS.length - 1;
  for(var i = 0; i < _MV_FORME_PAS.length; i++){ if(_MV_FORME_PAS[i] * k >= mini){ d = i; break; } }
  if(_MV_FORME_PAS[d] * k > maxi && d > 0) d--;
  return _MV_FORME_PAS[d];
}
function _mvFormeMetres(m){ return m >= 1000 ? (m / 1000) + '\u202fkm' : m + '\u202fm'; }
// La forme en grand dans une boîte W×H : ses rangs, son état (classe et-…), une échelle en mètres. o.etat : faite, cours,
// afaire, retard, arr ou neutre (défaut) ; o.id : préfixe des motifs, UNIQUE par endroit (deux fiches peuvent coexister).
function _mvFormeSvg(f, W, H, o){
  if(!f) return '';
  o = o || {};
  var m = 12, bas = 22, id = o.id || 'mvf', e = o.etat || 'neutre', arr = e === 'arr', r1 = function(v){ return (Math.round(v * 10) / 10).toString(); };
  var k = Math.min((W - 2 * m) / Math.max(1, f.w), (H - 2 * m - bas) / Math.max(1, f.h));
  var ox = (W - f.w * k) / 2, oy = (H - bas - f.h * k) / 2;
  var d = f.rings.map(function(r){ return 'M' + r.map(function(q){ return r1(ox + q[0] * k) + ' ' + r1(oy + q[1] * k); }).join('L') + 'Z'; }).join('');
  var dm = _mvFormePas(k, 36, 96), L = dm * k;
  return '<svg class="mv-fo-svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true" focusable="false"><defs>'
    + '<pattern id="' + id + '-r" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(' + _mvFormeAngle(f.ang) + ')"><path class="mv-fo-rg" d="M2 0V4"/></pattern>'
    + (arr ? '<pattern id="' + id + '-h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path class="mv-fo-h" d="M0 0V6"/></pattern>' : '') + '</defs>'
    + '<path class="mv-fo et-' + e + '" d="' + d + '"' + (arr ? ' style="fill:url(#' + id + '-h)"' : '') + '/>'
    + (arr ? '' : '<path class="mv-fo-r" d="' + d + '" fill="url(#' + id + '-r)"/>')
    + '<path class="mv-fo-e" d="M' + m + ' ' + (H - 13) + 'V' + (H - 8) + 'H' + r1(m + L) + 'V' + (H - 13) + '"/>'
    + '<text class="mv-fo-t" x="' + r1(m + L + 6) + '" y="' + (H - 8) + '">' + _mvFormeMetres(dm) + '</text></svg>';
}
// Le haut d'une fiche de parcelle : sa forme, ou rien quand elle n'a pas de contour.
function _mvParcFormeHtml(nom, W, H, id){ return _mvFormeSvg(_mvParcForme(nom), W || 520, H || 180, { id: id || 'mvf' }); }
window._mvFormeDe = _mvFormeDe;
window._mvParcContours = _mvParcContours;   // ⚠️ PAS _mvParcGeo : ce nom existe déjà (la POSITION d'une parcelle, plus haut)
window._mvParcForme = _mvParcForme;
window._mvFormeAngle = _mvFormeAngle;
window._mvFormePas = _mvFormePas;
window._mvFormeMetres = _mvFormeMetres;
window._mvFormeSvg = _mvFormeSvg;
window._mvParcFormeHtml = _mvParcFormeHtml;
/* ★ FIN FORME-1 */
window.APP_VERSION        = APP_VERSION;

// ★★ ÉQUIPES-1 (30/09/2026) — LES ÉQUIPES DU JOUR, POSÉES PAR L'ADMINISTRATEUR DEPUIS L'ACCUEIL.
//   CONFIG.equipes_jour = { 'AAAA-MM-JJ': [ {m:['Victor','Shana']}, {m:['Nico','Alicia']} ] }.
//   ⚠️ Des objets {m:[…]} et non des tableaux de tableaux : Firestore refuse les tableaux imbriqués
//      (_fsNoNestedArrays les convertirait en objets indexés, que ce lecteur ne relirait plus).
//   Rien pour une date = rien de réglé : l'app se comporte comme avant. Lu par la saisie (app.js :
//   le groupe est forcé) ET par le calcul du temps (pilotage.js : une validation hors réseau, sans
//   groupe, est rattachée à l'équipe de son auteur ce jour-là).
// ★★ EQDEF-2 (§493, 30/10/2026) — LES ÉQUIPES RESTENT EN PLACE ; RIEN DE POSÉ = TOUT LE MONDE EN ÉQUIPE 1.
//   Nico (30/10, dicté) : « la numérotation d'une équipe se fait au jour le jour… s'il n'y a pas de numérotation demandée, …
//   tout le monde ensemble dans l'équipe 1… tant que la tâche n'est pas terminée, on reste sur les deux équipes qui sont
//   sélectionnées. S'il y a une modification…, ça doit être pris en compte. Sinon, par défaut, on reste enregistré sur les
//   équipes qui ont été mises en place ». Décidé (« oui ») : un enregistrement reste en place les jours suivants, jusqu'au
//   prochain ; « Tout le monde en Équipe 1 » (l'ancien « Tout le monde ensemble ») écrit [] — la fin des équipes, gardée elle
//   aussi ; la fin d'une tâche ne les arrête pas toute seule (c'est l'administrateur qui le dit).
//   ⚠️ La règle part de MV_EQ_SUITE_DEPUIS : avant, un jour ne lit que SON enregistrement — l'histoire ne se réécrit pas (même
//   doctrine que _mvEnContratSurPeriode). Un jour GARDÉ (pas le jour même : là, l'enregistrement de l'administrateur fait foi)
//   est ajusté au jour : qui n'y compte plus (fin de contrat, bureau, cave toute la journée) sort de son équipe ; qui compte sans
//   être dans aucune arrive dans la première — l'Équipe 1.
//   ⚠️ _mvEqJour reste « les équipes POSÉES » (du jour ou gardées) — ce qui coupe la journée du domaine dans le temps réel du
//   Pilotage. L'Équipe 1 par défaut ne s'y lit pas : elle vit côté saisie (app.js, _mvEqDefautDe), où la priorité compte.
export const MV_EQ_SUITE_DEPUIS = '2026-10-30';
function _mvEqSource(iso){
  var E=(window.CONFIG||{}).equipes_jour; iso=String(iso||'').slice(0,10);
  if(!iso || !E || typeof E!=='object' || Array.isArray(E)) return null;
  if(Array.isArray(E[iso])) return { d:iso, L:E[iso] };
  var best='';   // seuls des jours >= MV_EQ_SUITE_DEPUIS se gardent : avant la règle, un jour ne lit que le sien
  Object.keys(E).forEach(function(k){ if(k>=MV_EQ_SUITE_DEPUIS && k<iso && k>best && Array.isArray(E[k])) best=k; });
  return best ? { d:best, L:E[best] } : null;
}
// Qui compte ce jour-là pour les équipes de la vigne : sous contrat, hors bureau, pas en cave toute la journée (JCAVE-1).
//   La même règle que la fenêtre (app.js, _mvEquipeProposee / _mvEqMembres), pour une date quelconque.
export function _mvEqPresents(iso){
  iso=String(iso||'').slice(0,10);
  var auj=(typeof window._mvToday==='function') ? window._mvToday() : '', out=[];
  (window.MEMBRES||[]).forEach(function(m){
    if(!m || !m.nom || m.bureau) return;
    if(m.statut==='Inactif' && (!auj || iso>=auj)) return;
    if(!((typeof window._mvEnContratLe==='function') ? window._mvEnContratLe(m, iso) : (m.statut!=='Inactif'))) return;
    if(typeof window._mvCaveJour==='function' && window._mvCaveJour(m.nom, iso)==='j') return;
    out.push(String(m.nom));
  });
  return out;
}
// Les équipes en place un jour donné, en objets {m, t} (t : la tournée de l'équipe, TRN-2) : { d: jour de l'enregistrement, eq }
//   — eq vide : « tout le monde en Équipe 1 » posé ; null : rien de posé (ni ce jour-là ni, depuis la règle, avant).
export function _mvEqEnPlace(iso){
  iso=String(iso||'').slice(0,10);
  var S=_mvEqSource(iso); if(!S) return null;
  var out=[];
  S.L.forEach(function(t){
    var m=(t && Array.isArray(t.m)) ? t.m.filter(function(n){ return n!=null && n!==''; }).map(String) : [];
    if(m.length) out.push({ m:m, t:(t && t.t) ? String(t.t) : '' });
  });
  if(out.length && S.d!==iso && iso>=MV_EQ_SUITE_DEPUIS){   // gardé d'un jour d'avant : ajusté au jour
    var P=_mvEqPresents(iso), vu={};
    out.forEach(function(o){ o.m=o.m.filter(function(n){ if(P.indexOf(n)<0 || vu[n]) return false; vu[n]=1; return true; }); });
    var reste=P.filter(function(n){ return !vu[n]; });
    if(reste.length) out[0].m=out[0].m.concat(reste);
    out=out.filter(function(o){ return o.m.length; });
  }
  return { d:S.d, eq:out };
}
// D'où viennent les équipes d'un jour, pour les écrans : 'jour' (enregistrées ce jour-là), 'suite' (gardées depuis d),
//   'defaut' (rien de posé, ou « tout le monde en Équipe 1 » depuis d), '' (avant la règle, rien de posé).
export function _mvEqOrigine(iso){
  iso=String(iso||'').slice(0,10);
  var P=_mvEqEnPlace(iso);
  if(P && P.eq.length) return { src:(P.d===iso) ? 'jour' : 'suite', d:P.d };
  return (iso>=MV_EQ_SUITE_DEPUIS) ? { src:'defaut', d:P ? P.d : '' } : { src:'', d:'' };
}
export function _mvEqJour(iso){
  var P=_mvEqEnPlace(iso);
  return (P && P.eq.length) ? P.eq.map(function(o){ return o.m.slice(); }) : null;
}
export function _mvEqDe(nom, iso){
  var L=_mvEqJour(iso); if(!L || nom==null) return null;
  for(var i=0;i<L.length;i++){ if(L[i].indexOf(String(nom))>=0) return L[i].slice(); }
  return null;
}
window._mvEqJour = _mvEqJour;
window._mvEqDe   = _mvEqDe;
window._mvEqEnPlace = _mvEqEnPlace;   // EQDEF-2 (§493)
window._mvEqOrigine = _mvEqOrigine;
window._mvEqPresents = _mvEqPresents;
window.MV_EQ_SUITE_DEPUIS = MV_EQ_SUITE_DEPUIS;

// ★★ JCAVE-1 (§428) — LES JOURNÉES DE CAVE. CONFIG.cave_jours = { 'AAAA-MM-JJ': { 'Nom': 'j' | 'm' | 'a' } } :
//   la journée, le matin ou l'après-midi en cave. Posée par l'administrateur au Planning (planning.js, planCaveApply) ou,
//   pour la journée, depuis les équipes du jour (app.js, saveEqJour) — une seule donnée, deux portes. Lue par le temps réel
//   du Pilotage (pilotage.js, _ecoCaveJours) et par la capacité de l'équipe (planning.js, _capDayReal). Les heures restent
//   payées : rien ici ne touche au planning, à la paie ni au relevé. Deux ans gardés, comme les équipes du jour.
window._mvCaveJour = function(nom, iso){
  var C=(window.CONFIG||{}).cave_jours;
  if(!C || typeof C!=='object' || Array.isArray(C) || nom==null) return '';
  var J=C[String(iso||'').slice(0,10)], v=(J && typeof J==='object') ? J[String(nom)] : '';
  return (v==='j' || v==='m' || v==='a') ? v : '';
};
// liste = [{iso, nom}] ; part = 'j' | 'm' | 'a' pour poser, null pour retirer. Rend le nombre de cases changées ; n'écrit
//   la configuration que si quelque chose a changé.
window._mvCaveEcrire = function(liste, part){
  var cfg=window.CONFIG||{}, C0=cfg.cave_jours;
  var C=(C0 && typeof C0==='object' && !Array.isArray(C0)) ? Object.assign({}, C0) : {};
  var pose=(part==='j' || part==='m' || part==='a'), n=0;
  (liste||[]).forEach(function(x){
    var iso=String((x&&x.iso)||'').slice(0,10), nom=x&&x.nom;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(iso) || nom==null || nom==='') return;
    var J=Object.assign({}, C[iso]||{});
    if(pose){ if(J[nom]!==part){ J[nom]=part; n++; } }
    else if(J[nom]){ delete J[nom]; n++; }
    if(Object.keys(J).length) C[iso]=J; else delete C[iso];
  });
  if(!n) return 0;
  var lim=new Date(); lim.setDate(lim.getDate()-730);
  var limIso=lim.getFullYear()+'-'+String(lim.getMonth()+1).padStart(2,'0')+'-'+String(lim.getDate()).padStart(2,'0');
  Object.keys(C).forEach(function(k){ if(k<limIso) delete C[k]; });
  cfg.cave_jours=C; window.CONFIG=cfg;
  if(typeof window.saveData==='function') window.saveData('config');
  return n;
};
window.MV_FORMAT          = MV_FORMAT;   // VER-1
window._mvLectureSeule    = _mvLectureSeule;   // DROITS-1
window.checkWhatsNew      = checkWhatsNew;
window.dismissWhatsNew    = dismissWhatsNew;
