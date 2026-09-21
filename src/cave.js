// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// MA VIGNE \u2014 src/cave.js
// Module Cave \u00C9levage (cuv\u00E9es, op\u00E9rations, analyses)
// Phase 2b \u2014 extrait depuis app.js
// Le Cuvier (vinification, tourn\u00E9e, maturit\u00E9, ventes en vrac) vit dans src/cuvier.js
// depuis le lot CUV-DEC (\u00A7164) : la fronti\u00E8re est en fin de fichier, des deux c\u00F4t\u00E9s.
// \u00A9 2026 Nicolas GUERET / GUERETTECH
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//
// D\u00E9pendances (via window.*) :
//   window.fbSave, window.fbDeleteAnalyse   \u2190 firebase.js
//   window.CAVE_ELEVAGE                     \u2190 expos\u00E9 sur window par ce module
//   window.currentUser                      \u2190 app.js globals
//   window.closeOv                          \u2190 app.js
//
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

import { isAdmin, isSaisonnier, canWrite, showToast, showSyncBadge, _escHtml, _escAttr,
         _mvIcon, _mvSetIcon, _mvIconInline } from './utils.js';

const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// \u2550\u2550\u2550\u2550 CAVE \u00C9LEVAGE \u2550\u2550\u2550\u2550
var CAVE_ELEVAGE = { cuvees:[], operations:[], analyses:[], config:{ ouillage_alerte_j:14 } };
var CAVE_VENDANGE = { config:{poids_caisse_kg:25,ratio_min:130,ratio_max:140,sucre_par_degre:16.83}, recoltes:[], cuves_vinif:[], clients:[], analyses:[], cuvees:[] };
var caveTab = 'cuv';   // onglet actif du Chai — DOIT etre l'un des 4 de switchCaveOng
var caveSection = 'aujourdhui'; // section active : 'aujourdhui' (l'arrivee) | 'elevage' (Le Chai) | 'vendange' (Le Cuvier) | 'millesime'. La Cave s'ouvre TOUJOURS sur Aujourd'hui : le verdict dit ce qui presse, chaque ligne mene au geste (lot CAVE-1).
var _caveFml = 'none';
var _caveOpType = 'ouillage';
var _copCuvSel = new Set();
var _copIntSel = []; // intervenants sélectionnés (multi) — v4.33
var _copAllCuv = false;
var _copOuillette = 10;
var _copSo2Mode = 'none';
var _copSo2Nb = 2;
var _copSo2Freq = 10;
var _cuvTonneaux = []; // [{annee:2025, nb:2}, ...] \u2014 \u00E9tat formulaire cuv\u00E9e
var _copSoufreG = 5;      // grammes pastille soufre: 2 ou 5
var _copPdfFile = null;   // PDF stag\u00E9 pour op analyse en cours (null|File|'__keep__url|nom|size|path')
var _copSoufreMode = 'fut'; // 'fut' | 'total'
var _jFilter = 'tous';    // filtre journal cave: tous|ouillage|soutirage|soufre|analyse|autre
var _caveAnaLinkedOpIds = [];  // IDs ops s\u00E9lectionn\u00E9es pour rattachement PDF (multi)
var _caveExpAllCuv = true;     // export: toutes cuv\u00E9es
var _caveExpCuvSel = new Set(); // export: cuv\u00E9es s\u00E9lectionn\u00E9es
var _caveExpTypes = new Set(['ouillage','soutirage','soufre','analyse','autre']); // export: types actifs
var _convMode = 'liq2past'; // convertisseur SO2
var _convDilution = 5;


function _copFmtSize(b){if(!b)return'';return b<1048576?Math.round(b/1024)+'\u00a0Ko':(b/1048576).toFixed(1)+'\u00a0Mo';}

function _copStagePdf(input) {
  var file=input&&input.files&&input.files[0];
  input.value='';
  if(!file)return;
  if(file.type!=='application/pdf'){showToast('Seuls les PDF sont accept\u00e9s','#E07060');return;}
  if(file.size>10*1024*1024){showToast('PDF trop lourd \u2014 max 10\u00a0Mo','#E07060');return;}
  _copPdfFile=file;
  var nm=document.getElementById('cop-pdf-name');if(nm)nm.textContent=file.name;
  var sz=document.getElementById('cop-pdf-size');if(sz)sz.textContent=_copFmtSize(file.size);
  var ep=document.getElementById('cop-pdf-empty');if(ep)ep.style.display='none';
  var sp=document.getElementById('cop-pdf-staged');if(sp)sp.style.display='flex';
}

function _copRemovePdf() {
  _copPdfFile=null;
  var ep=document.getElementById('cop-pdf-empty');if(ep)ep.style.display='';
  var sp=document.getElementById('cop-pdf-staged');if(sp)sp.style.display='none';
}

function _copResetPdfZone() {
  _copPdfFile=null;
  var ep=document.getElementById('cop-pdf-empty');if(ep)ep.style.display='';
  var sp=document.getElementById('cop-pdf-staged');if(sp)sp.style.display='none';
  var inp=document.getElementById('cop-pdf-input');if(inp)inp.value='';
}

async function _attachPdfToOp(input) {
  var opId=input&&input.dataset&&input.dataset.opId;
  input.value='';
  if(!opId)return;
  var file=input.files&&input.files[0];
  if(!file)return;
  if(file.type!=='application/pdf'){showToast('Seuls les PDF sont accept\u00e9s','#E07060');return;}
  if(file.size>10*1024*1024){showToast('PDF trop lourd \u2014 max 10\u00a0Mo','#E07060');return;}
  var op=(CAVE_ELEVAGE.operations||[]).find(function(o){return o.id===opId;});
  if(!op){showToast('Op\u00e9ration introuvable','#E07060');return;}
  showSyncBadge('Upload PDF\u2026','#B8913A');
  try {
    var res=await window.fbUploadAnalyse(file,function(){});
    if(!op.data)op.data={};
    op.data.pdf_url=res.url;op.data.pdf_path=res.storage_path;
    op.data.pdf_nom=file.name;op.data.pdf_taille=file.size;
    window.CAVE_ELEVAGE=CAVE_ELEVAGE;
    window.fbSaveToast({cave_elevage:CAVE_ELEVAGE},'PDF rattach\u00e9','#3D6B27');
    renderCave();
  } catch(e) {
    showToast('Erreur upload PDF','#E07060');
    showSyncBadge('Erreur upload','#B85A1A');
  }
}

// \u2550\u2550\u2550\u2550 CONTENANCE D'UN F\u00DBT \u2014 SOURCE UNIQUE \u2550\u2550\u2550\u2550
// La barrique bourguignonne fait 228 L, la bordelaise 225, un demi-muid 500 a
// 600. La contenance etait ecrite EN DUR a douze endroits de ce fichier : hors
// de Bourgogne, tous les volumes affiches etaient faux, en silence.
// Meme patron que la densite (CONFIG.vigne) et les baremes regionaux :
// CONFIG.cave.fut_l porte la valeur, le DEFAUT reste 228 -> sans reglage, rien
// ne bouge sur les domaines deja installes (228/100 est bit-a-bit identique a
// l'ancien litteral 2.28).
// \u26a0 Les volume_L deja enregistres ne sont JAMAIS recalcules : ce qui est
//   ecrit dans une operation est un fait date, pas une projection.
function _caveFutL(){
  var c=(window.CONFIG&&window.CONFIG.cave)?window.CONFIG.cave:null;
  var v=c?parseFloat(c.fut_l):NaN;
  return (isFinite(v)&&v>0)?v:228; // 228 L = barrique bourguignonne
}
function _caveFutHl(){ return _caveFutL()/100; }
/* ★★ FUT-CAP — LA CONTENANCE D'UN FUT EN VIN. Un lot de La Reserve peut porter
   la sienne (`l`, en litres : demi-muid, feuillette, 225 L dans un domaine a
   228). Le fut l'emporte a l'entonnage (cuvee.tonneaux[].l) et la rend au parc.
   Absente = le reglage du domaine : un fut entonne AVANT ce lot vaut, au litre
   pres, ce qu'il valait. */
function _caveTonL(t){ var v=parseFloat(t&&t.l); return (isFinite(v)&&v>0)?v:_caveFutL(); }
// Le volume des FUTS d'une cuvee, en litres — la seule porte. Pas les cuves :
// c'est « combien de bois » (part des anges), pas « combien de vin ».
function _caveFutsL(cuv){
  if(!cuv) return 0;
  if(cuv.tonneaux && cuv.tonneaux.length)
    return cuv.tonneaux.reduce(function(s,t){ return s+(t.nb||0)*_caveTonL(t); },0);
  return (cuv.nb_tonneaux||0)*_caveFutL();
}
// Hors format : plus de 10 % d'ecart avec le reglage du domaine. Un fut de
// 225 L dans un domaine a 228 reste une barrique ; un demi-muid, non.
function _caveHorsFormat(litres){ var d=_caveFutL(); return Math.abs((parseFloat(litres)||0)-d)>d*0.1; }
// Une contenance en litres, a la francaise : 228 · 114,5.
function _caveLTxt(l){ return String(Math.round((parseFloat(l)||0)*10)/10).replace('.',','); }
// Les futs d'une cuvee regroupes par contenance : « 4 futs de 228 L ». La
// repartition dit les annees, et la reference pour un fut hors format.
function _caveGroupesL(cuv){
  var list=(cuv&&cuv.tonneaux&&cuv.tonneaux.length)?cuv.tonneaux:[], g={}, ks=[];
  var curY=new Date().getFullYear();
  if(!list.length){
    var n0=(cuv&&cuv.nb_tonneaux)||0;
    return n0?[{l:_caveFutL(), nb:n0, rep:''}]:[];
  }
  list.forEach(function(t){
    if(!((t.nb||0)>0)) return;
    var L=_caveTonL(t), k=String(L);
    if(!g[k]){ g[k]={l:L, nb:0, parts:[]}; ks.push(k); }
    g[k].nb+=t.nb;
    g[k].parts.push(t.nb+'\u00d7 '+(t.annee>=curY?'Neuf':t.annee)
      +((_caveHorsFormat(L)&&t.ref)?(' \u00b7 '+_escHtml(t.ref)):''));
  });
  return ks.map(function(k){ return {l:g[k].l, nb:g[k].nb, rep:g[k].parts.join(' &middot; ')}; })
    .sort(function(a,b){ return a.l-b.l; });
}

// ══ LE PARC A CUVES ═══════════════════════════════════════════════════════
// ⚠️⚠️ UNE CUVE N'EST PAS UN FUT. Elle ne sort pas de La Reserve (ce n'est pas
//   un consommable), elle ne vieillit pas (« neuf / 3 vins » n'a aucun sens
//   pour de l'inox), et elle ne se compte pas a l'unite : elle a sa contenance
//   propre. Elle vit donc dans CONFIG.cave.cuves[], materiel durable, a cote
//   de fut_l — JAMAIS dans cuvee.tonneaux[], qui alimente le parc a futs.
//   Une cuve glissee dans tonneaux[] serait comptee comme un fut en vin par
//   _mvFutParc, recevrait un age dans la pyramide, et vaudrait 228 L.
//
// ⚠️⚠️ LA MATIERE DECIDE DE L'OUILLAGE, pas le type de contenant. Inox et
//   beton ne respirent pas ; un foudre bois si. C'est le seul role de ce champ,
//   et c'est pour ca qu'il existe.
var MV_CUVE_MAT = {
  inox : { lbl:'Inox',  ouille:false },
  beton: { lbl:'B\u00e9ton', ouille:false },
  bois : { lbl:'Bois',  ouille:true  }
};
var MV_CUVE_MATS = ['inox','beton','bois'];
function _caveMatKey(m){ return MV_CUVE_MAT[m] ? m : 'inox'; }
function _caveMat(m){ return MV_CUVE_MAT[_caveMatKey(m)]; }

// Le parc, TOUJOURS un tableau : CONFIG peut ne pas etre charge, et une entree
// sans id est un residu de saisie, pas une cuve.
function _caveParc(){
  var c=(window.CONFIG&&window.CONFIG.cave)?window.CONFIG.cave:null;
  var l=(c&&Array.isArray(c.cuves))?c.cuves:[];
  return l.filter(function(x){ return x&&x.id; });
}
function _caveCuve(id){
  if(!id) return null;
  var l=_caveParc();
  for(var i=0;i<l.length;i++){ if(l[i].id===id) return l[i]; }
  return null;
}
// Ecrit le parc en PRESERVANT le reste de CONFIG.cave — meme geste que fut_l.
function _caveParcSave(list){
  window.CONFIG=window.CONFIG||{};
  window.CONFIG.cave=Object.assign({},window.CONFIG.cave||{},{cuves:list});
  if(window.saveData) window.saveData('config');
}

// ⚠️⚠️ L'OCCUPATION SE LIT DANS LES DEUX MODULES. Une cuve prise par une cuve
//   de vinification en cours est occupee, meme si aucune cuvee du Chai ne la
//   porte : ne regarder que le Chai ferait annoncer « libre » une cuve qui
//   fermente. C'est ce que le champ cuves_vinif[].cuve_ref rend possible.
// `hors` : id d'une cuve de vinification a ignorer. Sert au decuvage — la cuve
// qu'on est en train de vider sera libre dans la seconde, et on eleve tres bien
// sur lies dans la cuve ou l'on a fermente. Sans ce parametre, l'ecran refuserait
// la seule cuve que le vigneron veut choisir.
function _caveCuveOcc(id, hors){
  if(!id) return null;
  var V=(window.CAVE_VENDANGE&&window.CAVE_VENDANGE.cuves_vinif)||[];
  for(var i=0;i<V.length;i++){
    var v=V[i];
    if(v&&v.cuve_ref===id&&v.statut!=='termine'&&!(hors&&v.id===hors))
      return {type:'vinif', nom:v.nom||'Cuve en vinification', hl:(parseFloat(v.volume_hl)||0)};
  }
  var E=(window.CAVE_ELEVAGE&&window.CAVE_ELEVAGE.cuvees)||[];
  for(var j=0;j<E.length;j++){
    var c=E[j]; if(!c||c.statut==='embouteille') continue;
    var a=(c.cuves||[]);
    for(var k=0;k<a.length;k++){
      if(a[k]&&a[k].ref===id)
        return {type:'elevage', nom:(c.nom||'Cuv\u00e9e')+(c.millesime?' '+c.millesime:''),
                hl:(parseFloat(a[k].litres)||0)/100};
    }
  }
  return null;
}

// Le volume LOGE dans les cuves d'une cuvee. ⚠️ C'est un FAIT DATE ecrit sur la
// cuvee, jamais recalcule depuis la contenance du parc : corriger une
// contenance ne doit pas reecrire un volume deja entonne — meme regle que
// volume_L sur une operation.
function _caveVolCuvesL(cuv){
  var a=(cuv&&Array.isArray(cuv.cuves))?cuv.cuves:[];
  return a.reduce(function(s,x){
    var v=parseFloat(x&&x.litres); return s+((isFinite(v)&&v>0)?v:0);
  },0);
}
// ★★★ LE VOLUME D'UNE CUVEE — futs + cuves. LA fonction a appeler partout ou la
//   question est « COMBIEN DE VIN ».
// ⚠️⚠️ PAS la ou la question est « COMBIEN DE BOIS » : la part des anges, la
//   pyramide des ages et le parc a futs se mesurent sur les FUTS SEULS. Ajouter
//   l'inox au denominateur de la part des anges la SOUS-ESTIMERAIT — ce calcul
//   est juste, on n'y touche pas.
// ★ ASM-1 — moins ce qui manque dans les futs (§153a).
function _caveVolL(cuv){ return _caveFutsL(cuv)+_caveVolCuvesL(cuv)-_caveManqueL(cuv); }
/* ★★★ ASM-1 — le fut entame : ecrit, suivi, rendu ; sinon deduit de la mesure (§153a). */
function _caveManqueL(cuv){
  if(!cuv) return 0;
  var F=_caveFutsL(cuv);
  if(!(F>0)) return 0;
  var m=parseFloat(cuv.manque_l);
  if(!isFinite(m)){
    if(_caveVolCuvesL(cuv)>0) return 0;
    var cv=_caveCuveSource(cuv);
    if(!cv||cv.vol_decuve_src!=='mesure') return 0;
    m=F-(parseFloat(cv.vol_decuve_hl)||0)*100;
  }
  return Math.max(0,Math.min(F,Math.round(m)));
}
function _caveVolHl(cuv){ return _caveVolL(cuv)/100; }

// ★★★ LA GARDE D'OUILLAGE. Une cuvee sans aucun contenant en bois n'a pas de
//   part des anges. Sans ce filet elle arriverait ROUGE « seuil depasse » au
//   bout de N jours, compterait dans le badge « a ouiller » et plomberait la
//   barre de sante du Chai : une alerte qui ment avec l'autorite d'une mesure.
//   Une cuvee MIXTE, elle, garde son ouillage — le bois s'evapore quand meme.
function _caveCuvesBois(cuv){
  var a=(cuv&&Array.isArray(cuv.cuves))?cuv.cuves:[];
  return a.filter(function(x){
    var p=_caveCuve(x&&x.ref); return !!(p&&_caveMat(p.matiere).ouille);
  });
}
function _caveOuille(cuv){
  if(!cuv) return false;
  return _caveNbTonneaux(cuv)>0 || _caveCuvesBois(cuv).length>0;
}
// Une cuvee est MIXTE quand elle porte du bois ET de la cuve : sa jauge ne
// couvre alors qu'une partie du volume, et elle doit le dire.
function _caveEstMixte(cuv){
  return _caveNbTonneaux(cuv)>0 && ((cuv&&cuv.cuves)||[]).length>0;
}
// Les contenants, en TEXTE BRUT : « 6 fûts » · « Cuve 2 » · « 3 fûts + Cuve 1 ».
// ⚠️ Brut, donc a echapper par l'appelant. Ne jamais pre-echapper ici : un nom
//   deja echappe repasse dans _escHtml sortirait double-encode.
function _caveContenantsStr(cuv){
  var out=[], n=_caveNbTonneaux(cuv);
  if(n) out.push(n+' f\u00fbt'+(n>1?'s':''));
  ((cuv&&cuv.cuves)||[]).forEach(function(x){
    var p=_caveCuve(x&&x.ref);
    if(p){ out.push(p.nom||'Cuve'); return; }
    // ⚠️ Cuve RETIREE DU PARC alors qu'une cuvee la portait encore (possible sur
    //   une cuvee embouteillee, que _caveCuveOcc ignore). Le volume, lui, est
    //   reste : on ne peut pas ecrire « aucun contenant » sur 36 hL. Un contenant
    //   sans nom se voit ; un volume orphelin sans ligne, jamais.
    if((parseFloat(x&&x.litres)||0)>0) out.push('1 cuve');
  });
  return out.join(' + ');
}
function _caveContenantsHtml(cuv){ return _escHtml(_caveContenantsStr(cuv)); }

function _caveNbTonneaux(cuv) {
  if(!cuv) return 0;
  if(cuv.tonneaux && cuv.tonneaux.length) return cuv.tonneaux.reduce(function(s,t){return s+(t.nb||0);},0);
  return cuv.nb_tonneaux || 0;
}

function _caveTonneauxStr(cuv) {
  if(!cuv) return '';
  var list = cuv.tonneaux && cuv.tonneaux.length ? cuv.tonneaux : [];
  if(!list.length) return cuv.nb_tonneaux ? cuv.nb_tonneaux+' tonneau'+(cuv.nb_tonneaux>1?'x':'') : '';
  var curY = new Date().getFullYear();
  return list.map(function(t){
    var l=parseFloat(t&&t.l);   // ★ FUT-CAP : un fut qui n'a pas la contenance du domaine le dit
    return t.nb+'\u00d7 '+(t.annee>=curY?'Neuf':t.annee)
      +((isFinite(l)&&l>0&&l!==_caveFutL())?(' ('+_caveLTxt(l)+'\u00a0L)'):'');
  }).join(' &middot; ');
}

function _renderCuvTonneaux() {
  var el = document.getElementById('cuv-tonneaux-body'); if(!el) return;
  var curY = new Date().getFullYear(), dom=_caveFutL();
  var html = '';
  _cuvTonneaux.forEach(function(t, i) {
    var lbl = t.annee >= curY ? 'Neuf' : (curY - t.annee)+' vin'+(curY-t.annee>1?'s':'');
    // ★ FUT-CAP — la ligne dit d'ou viennent ses futs, et elle le garde.
    var idt = (t.four||t.ref) ? ((t.four||'')+(t.four&&t.ref?' \u00b7 ':'')+(t.ref||'')) : '';
    var lv = parseFloat(t.l);
    html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:'+(idt?'4':'8')+'px;">'
          + '<input type="number" class="fi ac" style="flex:1;min-width:0;margin-bottom:0;" value="'+t.annee+'" min="2000" max="'+(curY+1)+'" placeholder="Ann\u00e9e" onchange="updateCuvTonneau('+i+',\'annee\',this.value)">'
          + '<span style="font-size:var(--pt-micro,11px);color:var(--texte-doux);white-space:nowrap;width:44px;flex-shrink:0;text-align:center;">'+lbl+'</span>'
          + '<input type="number" class="fi ac" style="width:54px;margin-bottom:0;text-align:center;padding-left:4px;padding-right:4px;" value="'+t.nb+'" min="1" max="30" placeholder="Nb" onchange="updateCuvTonneau('+i+',\'nb\',this.value)">'
          + '<input type="text" inputmode="decimal" class="fi ac" style="width:62px;margin-bottom:0;text-align:center;padding-left:4px;padding-right:4px;" value="'+((isFinite(lv)&&lv>0)?_caveLTxt(lv):'')+'" placeholder="'+_caveLTxt(dom)+'" aria-label="Contenance d\u2019un f\u00fbt, en litres" onchange="updateCuvTonneau('+i+',\'l\',this.value)">'
          + '<span style="font-size:var(--pt-micro,11px);color:var(--texte-doux);flex-shrink:0;">L</span>'
          + '<button onclick="removeCuvTonneau('+i+')" style="background:none;border:none;cursor:pointer;font-size:var(--pt-sm,17px);color:var(--texte-doux);min-height:44px;min-width:44px;padding:0;display:flex;align-items:center;justify-content:center;">\u00d7</button>'
          + '</div>'
          + (idt ? '<div style="font-size:var(--pt-lbl,10.5px);color:var(--texte-doux);font-style:italic;margin:0 0 8px 4px;">'+_escHtml(idt)+'</div>' : '');
  });
  var total = _cuvTonneaux.reduce(function(s,t){return s+(t.nb||0);},0);
  html += '<div style="font-size:var(--pt-txt,12.5px);color:var(--texte-doux);text-align:right;margin-bottom:4px;">Total\u00a0: <strong style="color:var(--texte);">'+total+'</strong> tonneau'+(total>1?'x':'')+'</div>';
  el.innerHTML = html;
}

function addCuvTonneau() {
  _cuvTonneaux.push({annee:new Date().getFullYear(), nb:1});
  _renderCuvTonneaux();
}

function removeCuvTonneau(i) {
  _cuvTonneaux.splice(i,1);
  _renderCuvTonneaux();
}

function updateCuvTonneau(i, field, val) {
  if(!_cuvTonneaux[i]) return;
  if(field==='l'){
    // ★ FUT-CAP — vide, ou egale au reglage du domaine : la ligne suit le domaine.
    var raw=String(val==null?'':val).trim();
    var n=parseFloat(raw.replace(/[\s\u00a0\u202f]/g,'').replace(',','.'));
    if(!raw || (isFinite(n) && Math.round(n*10)/10===_caveFutL())) delete _cuvTonneaux[i].l;
    else if(isFinite(n) && n>=50 && n<=5000) _cuvTonneaux[i].l=Math.round(n*10)/10;
    else showToast('Contenance attendue entre 50 et 5000 L','#B85A1A');
  } else _cuvTonneaux[i][field] = parseInt(val)||(field==='nb'?1:new Date().getFullYear());
  _renderCuvTonneaux();
}

// \u2500\u2500 Multi-intervenants (v4.33) \u2500\u2500
// R\u00e9tro-compatible : anciennes ops = operateur (texte), nouvelles = intervenants[].
function _caveIntLabel(arr){
  if(!arr||!arr.length)return '';
  if(arr.length===1)return arr[0];
  if(arr.length<=3)return arr.join(' + ');
  return '\u00c9quipe ('+arr.length+')';
}
function _caveWho(op){
  var arr=(op&&op.intervenants&&op.intervenants.length)?op.intervenants:((op&&op.operateur)?[op.operateur]:[]);
  return _caveIntLabel(arr);
}
function _caveWhoHtml(op){
  var arr=(op&&op.intervenants&&op.intervenants.length)?op.intervenants:((op&&op.operateur)?[op.operateur]:[]);
  if(!arr.length)return '';
  var avs=arr.slice(0,4).map(function(n){
    var col=(window.COULEURS_MBR||{})[n]||'#7A4F2E';
    return '<span class="cws-av" style="background:'+col+';">'+_escHtml(String(n||'?').charAt(0).toUpperCase())+'</span>';
  }).join('');
  return '<span class="cave-who-stack">'+avs+'</span>'+_escHtml(_caveIntLabel(arr));
}
function _copRenderIntChips(){
  var wrap=document.getElementById('cop-int-wrap');if(!wrap)return;
  var mbrs=(window.MEMBRES||[]).map(function(m){return m.nom;}).filter(Boolean);
  if(!mbrs.length&&window.currentUser&&window.currentUser.nom)mbrs=[window.currentUser.nom];
  wrap.innerHTML=mbrs.map(function(n){
    var sel=_copIntSel.indexOf(n)!==-1;
    var col=(window.COULEURS_MBR||{})[n]||'#7A4F2E';
    var nj=String(n).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return '<button class="cop-int-chip'+(sel?' sel':'')+'" onclick="toggleCopInt(\''+nj+'\')">'
      +'<span class="cic-av" style="background:'+col+';">'+_escHtml(String(n).charAt(0).toUpperCase())+'</span>'
      +'<span class="cic-nm">'+_escHtml(n)+(sel?' '+_mvIcon('check',16):'')+'</span></button>';
  }).join('');
}
function toggleCopInt(n){
  var i=_copIntSel.indexOf(n);
  if(i>=0){if(_copIntSel.length>1)_copIntSel.splice(i,1);}
  else _copIntSel.push(n);
  _copRenderIntChips();
}

// ── LE SEUIL D'OUILLAGE, PAR MILLESIME ───────────────────────────────
// ⚠ MODELE : un vin jeune s'ouille tous les 7 jours, un vin d'un an tous
// les 14. Le seuil ne peut donc pas etre unique pour la cave entiere.
// Stockage : CAVE_ELEVAGE.config.ouillage_par_mil = { '2026':7, '2025':14 }.
// ⚠ RETRO-COMPATIBLE : sans entree pour un millesime, on retombe sur
// ouillage_alerte_j, le reglage global qui existe deja. Un domaine qui n'y
// touche pas ne voit AUCUN changement.
// SOURCE UNIQUE : onze sites lisaient le seuil chacun de leur cote. Tous
// passent desormais ici, sinon la prochaine correction en oubliera un.
// Le filtre millesime du Chai existe depuis longtemps (_caveMillFilter).
// Ces deux helpers en font la SOURCE UNIQUE : la liste des cuvees, les KPIs
// et l'alerte s'y accrochent au lieu de refiltrer chacun de leur cote.
function _caveDansFiltre(c){
  if(!c) return false;
  if(_caveMillFilter==='tous') return true;
  return String(c.millesime)===String(_caveMillFilter);
}
function _caveCuvsFiltrees(){
  return (CAVE_ELEVAGE.cuvees||[]).filter(function(c){
    return c && c.statut!=='embouteille' && _caveDansFiltre(c);
  });
}
function _caveSeuilGlobal(){
  return (CAVE_ELEVAGE.config && CAVE_ELEVAGE.config.ouillage_alerte_j) || 14;
}
function _caveMilKey(m){ return (m==null||m==='')?'?':String(m); }
// Accepte une CUVEE ou un millesime. Sans argument : le seuil global.
function _caveSeuilOu(x){
  if(x==null) return _caveSeuilGlobal();
  var m=(typeof x==='object')?x.millesime:x;
  var par=(CAVE_ELEVAGE.config && CAVE_ELEVAGE.config.ouillage_par_mil) || {};
  var v=par[_caveMilKey(m)];
  v=parseInt(v,10);
  return (v>0)?v:_caveSeuilGlobal();
}
// Les millesimes presents en cave, du plus recent au plus ancien.
function _caveMilsEnCave(){
  var set={};
  (CAVE_ELEVAGE.cuvees||[]).forEach(function(c){
    if(!c||c.statut==='embouteille') return;
    set[_caveMilKey(c.millesime)]=1;
  });
  return Object.keys(set).sort(function(a,b){
    if(a==='?') return 1; if(b==='?') return -1; return Number(b)-Number(a);
  });
}
function _caveSetSeuilMil(m,n){
  if(typeof isAdmin==='function' && !isAdmin()){ if(window.showToast)window.showToast('Admin requis','#C0392B'); return; }
  var v=Math.max(3,Math.min(30,parseInt(n,10)||0));
  if(!CAVE_ELEVAGE.config) CAVE_ELEVAGE.config={};
  if(!CAVE_ELEVAGE.config.ouillage_par_mil) CAVE_ELEVAGE.config.ouillage_par_mil={};
  CAVE_ELEVAGE.config.ouillage_par_mil[_caveMilKey(m)]=v;
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  if(window.fbSave) window.fbSave('cave_elevage', CAVE_ELEVAGE);
  if(typeof renderCaveReglages==='function') renderCaveReglages();
  if(typeof renderCave==='function') renderCave();
}
function _caveSeuilMilReset(m){
  if(typeof isAdmin==='function' && !isAdmin()){ if(window.showToast)window.showToast('Admin requis','#C0392B'); return; }
  var par=(CAVE_ELEVAGE.config&&CAVE_ELEVAGE.config.ouillage_par_mil);
  if(par) delete par[_caveMilKey(m)];
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  if(window.fbSave) window.fbSave('cave_elevage', CAVE_ELEVAGE);
  if(typeof renderCaveReglages==='function') renderCaveReglages();
  if(typeof renderCave==='function') renderCave();
}
function _caveSeuilMilStep(m,delta){
  _caveSetSeuilMil(m, _caveSeuilOu(m)+delta);
}


function _caveAlerts() {
  var now = Date.now();
  return CAVE_ELEVAGE.cuvees.filter(function(cuv) {
    if(cuv.statut === 'embouteille') return false;
    // ★ Meme garde que _caveState : sans elle une cuvee 100 % inox entrerait
    //   dans le badge « a ouiller » et dans la barre de sante du Chai.
    if(!_caveOuille(cuv)) return false;
    // Le seuil suit le millesime de LA cuvee, pas un reglage de cave.
    var seuil = _caveSeuilOu(cuv);
    var lastMs = cuv.last_ouillage ? new Date(cuv.last_ouillage).getTime() : 0;
    return !lastMs || Math.floor((now - lastMs) / 86400000) >= seuil;
  }).map(function(cuv) {
    var lastMs = cuv.last_ouillage ? new Date(cuv.last_ouillage).getTime() : 0;
    return { cuv: cuv, daysSince: lastMs ? Math.floor((Date.now()-lastMs)/86400000) : 9999 };
  });
}

function _caveDateFr(iso) {
  if(!iso) return '\u2014';
  var d = new Date(iso); if(isNaN(d)) return iso;
  var m = ['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];
  return d.getDate()+' '+m[d.getMonth()]+' '+d.getFullYear();
}




function _caveFmlLabel(v) {
  return {none:'Non d\u00e9clench\u00e9e',cours:'En cours',ok:'Termin\u00e9e'}[v]||v;
}

function _caveTypeLabel(type) {
  return {ouillage:'Ouillage',soutirage:'Soutirage',soufre:'Soufre',analyse:'Analyse',assemblage:'Assemblage',autre:'Autre'}[type]||type;
}

// \u2500\u2500 helpers multi-cuv\u00E9es formulaire op\u00E9ration \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
var _COP_MOIS_C=['jan','f\u00e9v','mar','avr','mai','juin','juil','ao\u00fbt','sep','oct','nov','d\u00e9c'];
var _COP_MOIS_L=['janvier','f\u00e9vrier','mars','avril','mai','juin','juillet','ao\u00fbt','septembre','octobre','novembre','d\u00e9cembre'];
function _copAccent(){return {ouillage:'#C0845A',soutirage:'#5CB87A',soufre:'#4A9C50',analyse:'#4A9FC8',autre:'#A0A8B8'}[_caveOpType]||'#A0A8B8';}
function _caveCuvLabel(op){
  var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
  if(!ids.length)return '\u2014';
  if(ids.length===1){var c=CAVE_ELEVAGE.cuvees.find(function(x){return x.id===ids[0];})||{};return (c.nom||'?')+(c.millesime?' '+c.millesime:'');}
  var tot=CAVE_ELEVAGE.cuvees.filter(function(c){return c.statut!=='embouteille';}).length;
  if(ids.length>=tot)return 'Toutes les cuv\u00e9es';
  if(ids.length>3)return ids.length+' cuv\u00e9es';
  return ids.map(function(id){var c=CAVE_ELEVAGE.cuvees.find(function(x){return x.id===id;})||{};return c.nom||(c.id||'?');}).join(' \u00b7 ');
}
// Pills HTML pour affichage journal \u2014 toujours les vrais noms (jamais "N cuv\u00e9es" ni "Toutes les cuv\u00e9es" sans noms)
function _caveCuvPillsHtml(op){
  var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
  if(!ids.length)return '<span style="color:var(--texte-leger);">\u2014</span>';
  var cuvs=ids.map(function(id){return CAVE_ELEVAGE.cuvees.find(function(x){return x.id===id;});}).filter(Boolean);
  if(!cuvs.length)return '<span style="color:var(--texte-leger);">\u2014</span>';
  return '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px;">'
    +cuvs.map(function(c){
      return '<span style="font-size:var(--pt-micro,11px);font-weight:500;background:rgba(74,159,200,0.12);color:#4A9FC8;'
            +'border:1px solid rgba(74,159,200,0.22);border-radius:7px;padding:2px 8px;white-space:nowrap;">'
            +_mvIcon('verre',16)+'\u00a0'+_escHtml(c.nom)+(c.millesime?'\u00a0\u2019'+String(c.millesime).slice(2):'')+'</span>';
    }).join('')
    +'</div>';
}
function _copGetNbFuts(){
  // ⚠ « Toutes » ne veut plus dire toute la cave : seulement le millesime
  // courant. Sans ce filtre, cocher « Toutes » recreait une operation mixte.
  var actives=_copCuvsDuMil();
  if(_copAllCuv)return actives.reduce(function(s,c){return s+_caveNbTonneaux(c);},0);
  return Array.from(_copCuvSel).reduce(function(s,id){var c=actives.find(function(x){return x.id===id;});return s+(c?_caveNbTonneaux(c):0);},0);
}
// ★ FUT-CAP-2 — le meme compte en « pieces » : chaque fut a sa contenance divisee
//   par celle du domaine. Tous au format : exactement le nombre de futs.
function _copGetEqFuts(){
  var actives=_copCuvsDuMil();
  var sel=_copAllCuv?actives:actives.filter(function(c){ return _copCuvSel.has(c.id); });
  return sel.reduce(function(s,c){ return s+_caveFutsL(c)/_caveFutL(); },0);
}
function _copUpdateChips(){
  var actives=_copCuvsDuMil();
  var a=_copAccent();
  var ab=document.getElementById('cop-chip-all');
  if(ab){ab.style.background=_copAllCuv?a:'';ab.style.color=_copAllCuv?'#fff':'';ab.style.border=_copAllCuv?'none':'';}
  actives.forEach(function(c){
    var b=document.getElementById('cop-chip-'+c.id);if(!b)return;
    var on=_copAllCuv||_copCuvSel.has(c.id);
    b.style.background=on?a+'1e':'';b.style.color=on?a:'';b.style.border=on?'1px solid '+a+'88':'';
  });
}
function _copUpdateFutsSummary(){
  var n=_copGetNbFuts(),el=document.getElementById('cop-cuvees-summary');if(!el)return;
  if(!_copAllCuv&&_copCuvSel.size===0){el.textContent='S\u00e9lectionnez des cuv\u00e9es';el.style.color='var(--texte-leger)';}
  else{var _mm=(_copMil!=null&&_copMillesimes().length>1)?(' du '+(_copMil==='?'?'sans millésime':_copMil)):'';
    var lbl=_copAllCuv?('Toutes les cuv\u00e9es'+_mm):(_copCuvSel.size+' cuv\u00e9e'+(_copCuvSel.size>1?'s':'')+_mm);el.textContent=n+' f\u00fbt'+(n>1?'s':'')+' \u00b7 '+lbl;el.style.color='var(--texte)';}
  updateCopOuillageCalc();
}

// ── UN MILLESIME PAR OPERATION ───────────────────────────────────────
// ⚠ MODELE ARBITRE PAR NICO : chaque millesime est une entite a part, ils
// sont dans des caves separees. On n'ouille pas les futs de 2025 avec du
// vin de 2026. L'interdiction vaut pour TOUTES les operations, pas juste
// l'ouillage : le millesime se choisit AVANT les cuvees, et seules celles
// de ce millesime sont proposees.
// ⚠ Volontairement PAS de « Tous » ici : ce serait rouvrir exactement la
// porte qu'on ferme. Le tout-confondu vit en CONSULTATION (Chai, Pilotage),
// jamais en saisie.
var _copMil = null;

// Les millesimes reellement en cave, du plus recent au plus ancien.
function _copMillesimes(){
  var act=(CAVE_ELEVAGE.cuvees||[]).filter(function(c){return c&&c.statut!=='embouteille';});
  var set={};
  act.forEach(function(c){ var m=(c.millesime==null||c.millesime==='')?'?':String(c.millesime); set[m]=1; });
  return Object.keys(set).sort(function(a,b){
    if(a==='?') return 1; if(b==='?') return -1;
    return Number(b)-Number(a);
  });
}

// Les cuvees actives du millesime courant. C'est la SEULE porte d'entree
// vers les chips : tout ce qui construit ou compte passe par elle.
function _copCuvsDuMil(){
  var act=(CAVE_ELEVAGE.cuvees||[]).filter(function(c){return c&&c.statut!=='embouteille';});
  if(_copMil==null) return act;
  return act.filter(function(c){
    var m=(c.millesime==null||c.millesime==='')?'?':String(c.millesime);
    return m===_copMil;
  });
}

function _copRenderMils(){
  var wrap=document.getElementById('cop-mil-wrap'); if(!wrap) return;
  var mils=_copMillesimes(), a=_copAccent();
  if(mils.length<=1){
    // Un seul millesime en cave : le rang n'apporte rien, on le masque et on
    // le fixe. C'est le cas de tout domaine qui debute.
    _copMil=mils.length?mils[0]:null;
    wrap.innerHTML=''; wrap.style.display='none';
    var n0=document.getElementById('cop-mil-note'); if(n0) n0.style.display='none';
    return;
  }
  wrap.style.display='flex';
  wrap.innerHTML=mils.map(function(m){
    var nb=(CAVE_ELEVAGE.cuvees||[]).filter(function(c){
      if(!c||c.statut==='embouteille') return false;
      return ((c.millesime==null||c.millesime==='')?'?':String(c.millesime))===m;
    }).length;
    var on=(m===_copMil);
    return '<button class="cave-cuvee-chip" id="cop-mil-'+_escHtml(m)+'" onclick="selCopMil(\''+_escAttr(m)+'\')"'
      +(on?' style="background:'+a+';color:#fff;border:none;"':'')
      +'>'+(m==='?'?'Sans millésime':_escHtml(m))+' \u00b7 '+nb+'</button>';
  }).join('');
  var note=document.getElementById('cop-mil-note');
  if(note){
    note.style.display='block';
    note.textContent='Une opération porte sur un seul millésime : on ne mélange pas les vins.';
  }
}

// Changer de millesime VIDE la selection : garder des cuvees d'un autre
// millesime cochees serait precisement l'operation mixte qu'on interdit.
function selCopMil(m){
  if(_copMil===m) return;
  _copMil=m; _copAllCuv=false; _copCuvSel.clear();
  _copRenderMils(); _copRenderCuvChips(); _copUpdateChips(); _copUpdateFutsSummary();
}

// Construction des chips de cuvees — filtree par _copMil.
function _copRenderCuvChips(){
  var wrap=document.getElementById('cop-cuvees-wrap'); if(!wrap) return;
  var cuvs=_copCuvsDuMil();
  var totalFuts=cuvs.reduce(function(s,c){return s+_caveNbTonneaux(c);},0);
  var lblAll=(_copMillesimes().length>1&&_copMil!=null)
    ? ('Tout le '+(_copMil==='?'?'sans millésime':_copMil)+' \u00b7 '+totalFuts+' fûts')
    : ('Toutes \u00b7 '+totalFuts+' fûts');
  var ch='<button class="cave-cuvee-chip" id="cop-chip-all" onclick="toggleCopAllCuv()">'+_escHtml(lblAll)+'</button>';
  cuvs.forEach(function(c){
    var nbT=_caveNbTonneaux(c);
    ch+='<button class="cave-cuvee-chip" id="cop-chip-'+c.id+'" onclick="toggleCopCuvee(\''+c.id+'\')">'
       +_escHtml(c.nom)+(c.millesime?' '+_escHtml(c.millesime):'')+'\u00b7 '+nbT+'</button>';
  });
  wrap.innerHTML=ch;
}

function toggleCopAllCuv(){_copAllCuv=!_copAllCuv;if(_copAllCuv)_copCuvSel.clear();_copUpdateChips();_copUpdateFutsSummary();}
function toggleCopCuvee(id){if(_copAllCuv){_copAllCuv=false;_copCuvSel.clear();}if(_copCuvSel.has(id))_copCuvSel.delete(id);else _copCuvSel.add(id);_copUpdateChips();_copUpdateFutsSummary();}
function adjCopOuillette(d){_copOuillette=Math.max(1,_copOuillette+d);var el=document.getElementById('cop-ouillette-val');if(el)el.textContent=_copOuillette;updateCopOuillageCalc();}
function updateCopOuillageCalc(){
  var nb=parseInt((document.getElementById('cop-nb-ouillettes')||{}).value)||0;
  var n=_copGetNbFuts(),res=document.getElementById('cop-ouillage-result');
  if(nb>0&&n>0){
    var v=nb*_copOuillette;if(res)res.style.display='flex';
    var ve=document.getElementById('cop-res-vol');if(ve)ve.textContent=v+' L';
    var pe=document.getElementById('cop-res-parfut');if(pe)pe.textContent=(v/n).toFixed(1);
  } else {if(res)res.style.display='none';}
}
function setCopSo2Mode(mode){
  _copSo2Mode=mode;
  ['none','unique','recurrent'].forEach(function(m){var b=document.getElementById('cop-so2-'+m);if(b)b.classList.toggle('cave-so2-active',m===mode);});
  var u=document.getElementById('cop-so2-f-unique'),r=document.getElementById('cop-so2-f-recurrent');
  if(u)u.style.display=mode==='unique'?'block':'none';
  if(r)r.style.display=mode==='recurrent'?'block':'none';
  _copUpdateOpDate();
}
function setCopSo2Nb(n){
  _copSo2Nb=n;[2,3].forEach(function(v){var b=document.getElementById('cop-so2-nb-'+v);if(b)b.classList.toggle('cave-toggle-active',v===n);});
  _copUpdateSo2Cal();
}
function setCopSo2Freq(f){
  _copSo2Freq=f;[10,15].forEach(function(v){var b=document.getElementById('cop-so2-freq-'+v);if(b)b.classList.toggle('cave-toggle-active',v===f);});
  _copUpdateSo2Cal();
}
function _copUpdateSo2Cal(){
  var cal=document.getElementById('cop-so2-cal');if(!cal)return;
  var dv=(document.getElementById('cop-date')||{}).value;if(!dv){cal.style.display='none';return;}
  var base=new Date(dv);
  var html='<div class="cave-so2-cal-title">'+_mvIcon('calendrier',16)+' Calendrier SO\u2082 pr\u00e9vu</div>';
  for(var i=0;i<_copSo2Nb;i++){
    var d=new Date(base);d.setDate(d.getDate()+i*_copSo2Freq);
    var ds=d.getDate()+' '+_COP_MOIS_C[d.getMonth()]+' '+d.getFullYear();
    var jl=i===0?'J0 \u00b7 soutirage':'J+'+(i*_copSo2Freq);
    html+='<div class="cave-so2-cal-row"><span class="cave-so2-cal-j">'+jl+'</span><span class="cave-so2-cal-d">'+ds+'</span></div>';
  }
  cal.innerHTML=html;cal.style.display='block';
}
function _copUpdateOpDate(){
  var dv=(document.getElementById('cop-date')||{}).value;if(!dv)return;
  var d=new Date(dv);
  var el=document.getElementById('cop-so2-unique-date');
  if(el)el.textContent='Le '+d.getDate()+' '+_COP_MOIS_L[d.getMonth()]+' '+d.getFullYear();
  _copUpdateSo2Cal();
}


function _caveSaisBanner() {
  if(!isSaisonnier()) return '';
  return '<div style="margin:0 0 10px;padding:8px 12px;border-radius:10px;background:rgba(184,90,26,.08);border:1px solid rgba(184,90,26,.2);display:flex;align-items:center;gap:8px;font-size:var(--pt-micro,11px);color:#B85A1A">'
    +_mvIcon('cadenas',16)+' Lecture seule \u2014 votre r\u00f4le ne permet pas de modifier les donn\u00e9es.</div>';
}

// ══════ REFONTE ÉLEVAGE (mvc) ══════
function _mvcHide(){
  var host=document.getElementById('mvc-elevage'); if(host) host.style.display='none';
}
function _caveDSince(c){
  if(!c || !c.last_ouillage) return 9999;
  var ms=new Date(c.last_ouillage).getTime();
  if(!ms) return 9999;
  return Math.floor((Date.now()-ms)/86400000);
}
function _caveState(c){
  if(c.statut==='embouteille') return 'bottled';
  // ★★★ Zero bois ⇒ pas de part des anges. Un etat a part, pas un 'ok'
  //   deguise : 'ok' voudrait dire « ouillee a temps », ce qui est faux.
  if(!_caveOuille(c)) return 'inox';
  var seuil=_caveSeuilOu(c);
  var d=_caveDSince(c);
  if(d>=seuil) return 'due';
  if(d>=seuil*0.7) return 'watch';
  return 'ok';
}
function _mvcRenderHeader(){
  var el=document.getElementById('mvc-header');
  // Le bandeau suit le filtre millesime du Chai : afficher « 32 cuvees »
  // pendant qu'on ne regarde que le 2026 ne correspond a rien de concret.
  // _caveMillFilter='tous' redonne la cave entiere — c'est le defaut.
  var act=_caveCuvsFiltrees();
  var futs=act.reduce(function(s,c){return s+_caveNbTonneaux(c);},0);
  // ⚠️ Le KPI « Fûts » compte les FUTS (il alimente le parc a futs) ; le KPI
  //   « hL » compte le VIN, cuves comprises. Deux questions, deux sources.
  var volHl=act.reduce(function(s,c){return s+_caveVolHl(c);},0);
  var hl=volHl?volHl.toFixed(0):'0';
  // ⚠ _caveAlerts() renvoie des {cuv, daysSince}, pas des cuvees : le filtre
  // doit porter sur .cuv, sinon il ne matche jamais et le compteur tombe a 0.
  var due=_caveAlerts().filter(function(a){ return _caveDansFiltre(a.cuv); }).length;
  var okN=Math.max(0,act.length-due);
  var okPct=act.length?Math.round(okN/act.length*100):100;
  // ★ L'en-tete (titre, icone, badge) et la bande #cave-kpis sont ecrits par
  //   renderCave, pour la Cave entiere (lot CAVE-1). Ici ne reste que la barre
  //   d'etat du Chai, qui suit le filtre millesime.
  if(el) el.innerHTML=''
    +'<div class="mvc-health"><div class="mvc-health-track"><div class="mvc-health-ok" style="width:'+okPct+'%"></div><div class="mvc-health-due" style="width:'+(100-okPct)+'%"></div></div>'
    +'<div class="mvc-health-lbl"><span><b>'+okN+'</b> \u00e0 jour</span><span>'+(due?'<b>'+due+'</b> en retard':'Chai sous contr\u00f4le \u2713')+'</span></div></div>';
  if(typeof window._mvMetaSync==='function') window._mvMetaSync();
  var tabCuv=document.getElementById('mvc-tbtn-cuv');
  if(tabCuv) tabCuv.innerHTML='<span class="mvu-tab-em">'+_mvIcon('barrique',18)+'</span>Cuv\u00e9es'+(due>0?' <span class="mvc-tab-badge">'+due+'</span>':'');
}
function _caveGaugeHtml(c){
  var seuil=_caveSeuilOu(c);
  var d=_caveDSince(c), st=_caveState(c);
  var pct=Math.min(100,Math.round(d/seuil*100));
  var cls=st==='due'?'g-due':st==='watch'?'g-watch':'g-ok';
  var stateLbl,stateCol,sub;
  if(!c.last_ouillage){stateLbl='Jamais ouill\u00e9';stateCol='var(--rouge-soft,#E07060)';sub='\u00c0 ouiller sans attendre';pct=100;}
  else if(st==='due'){stateLbl='\u00c0 ouiller';stateCol='var(--rouge-soft,#E07060)';sub='Ouill\u00e9 il y a '+d+' j \u00b7 seuil d\u00e9pass\u00e9 (+'+(d-seuil)+' j)';}
  else if(st==='watch'){stateLbl='Bient\u00f4t';stateCol='#B8913A';sub='Ouill\u00e9 il y a '+d+' j \u00b7 reste '+(seuil-d)+' j';}
  else {stateLbl='\u00c0 jour';stateCol='var(--vert-med,#3D6B27)';sub='Ouill\u00e9 '+(d===0?'aujourd\u2019hui':'il y a '+d+' j')+' \u00b7 reste '+(seuil-d)+' j';}
  // ⚠️ Cuvee MIXTE : sans ce complement la jauge a l'air de porter sur tout le
  //   volume, alors qu'elle ne mesure que la part logee en bois.
  if(_caveEstMixte(c)) sub+=' \u00b7 sur les '+_mvF1(_caveFutsL(c)/100)+' hL en f\u00fbt';
  return '<div class="mvc-gauge"><div class="mvc-gauge-top"><span class="mvc-gauge-lbl">'+_mvIcon('sablier',16)+' Part des anges</span><span class="mvc-gauge-state" style="color:'+stateCol+'">'+stateLbl+'</span></div>'
    +'<div class="mvc-gauge-track"><div class="mvc-gauge-fill '+cls+'" style="width:'+pct+'%"></div></div>'
    +'<div class="mvc-gauge-sub">'+sub+'</div></div>';
}
function _caveNoOuHtml(c){
  var l=((c&&c.cuves)||[]).map(function(x){
    var p=_caveCuve(x&&x.ref); return p?_caveMat(p.matiere).lbl.toLowerCase():'';
  }).filter(Boolean);
  // ⚠️⚠️ TROISIEME CAS, trouve par la preuve du jour 0 : une cuvee sans AUCUN
  //   contenant (tous ses futs retires) tombe ici aussi. Ecrire « elevee en
  //   cuve inox » y serait un mensonge — et avant ce lot elle affichait un
  //   « a ouiller » rouge PERMANENT, qui n'etait pas plus vrai.
  if(!l.length && !((c&&c.cuves)||[]).length)
    return '<div class="mvc-noou">'+_mvIcon('alerte',18)
      +'<span class="mvc-noou-t"><b>Aucun contenant renseign\u00e9.</b><br>'
      +'Ajoutez des f\u00fbts ou une cuve pour suivre cette cuv\u00e9e.</span></div>';
  var m=l.length?l[0]:'inox';
  return '<div class="mvc-noou">'+_mvIcon('cuve',18)
    +'<span class="mvc-noou-t">\u00c9lev\u00e9e en cuve '+_escHtml(m)
    +' \u2014 <b>pas d\u2019ouillage \u00e0 suivre.</b><br>Aucune part des anges \u00e0 cette \u00e9tape.</span></div>';
}
function _caveAnaLineHtml(c){
  var la=_caveLastAna(c.id);
  // ★ L'etiquette FML passe par _caveFmlEtat : les DEUX portes de saisie
  //   comptent, et la plus recente gagne. Avant, la derniere analyse gagnait
  //   sans condition et « Terminee » coche dans la fiche ne changeait rien.
  // ⚠️ Elle ne depend plus non plus de l'existence d'une analyse : une cuvee
  //   declaree finie dans sa fiche, sans aucune analyse, le disait a
  //   Aujourd'hui et se taisait ici.
  var fml=_caveFmlEtat(c);
  var fmlTag='';
  if(fml==='ok') fmlTag='<span class="mvc-tag mvc-tag-fmlok">FML '+_mvIcon('check',16)+'</span>';
  else if(fml==='cours') fmlTag='<span class="mvc-tag mvc-tag-fmlc">FML en cours</span>';
  if(!la) return '<div class="mvc-cuv-ana">'+(fmlTag||'<span class="mvc-tag-none">Aucune analyse enregistr\u00e9e</span>')+'</div>';
  var so2=(la._src==='op'&&la.data)?la.data.so2_libre:null;
  var tags='';
  if(so2) tags+='<span class="mvc-tag mvc-tag-so2">SO\u2082 '+so2+' mg/L</span>';
  tags+=fmlTag;
  var pdf=(la.data&&la.data.pdf_url)?'<span class="mvc-tag-pdf">'+_mvIcon('document',16)+'</span>':'';
  if(!tags&&!pdf) tags='<span class="mvc-tag-none">Analyse le '+_caveDateFr(la.date_analyse)+'</span>';
  return '<div class="mvc-cuv-ana">'+tags+pdf+'<span class="mvc-ana-date">'+_caveDateFr(la.date_analyse)+'</span></div>';
}
// Ce que le Chai montrait du soutirage : rien. Ni les operations, ni le
// drapeau qu'on saisissait dans la fiche. Une cuvee est SOUTIREE, et elle
// peut l'etre plusieurs fois : on montre la derniere date et le compte.
function _caveSoutLineHtml(c){
  var d=_caveLastSout(c.id);
  if(!d) return '';
  var n=_caveSoutOps(c.id).length;
  return '<div class="mvc-cuv-sout"><span class="mvc-tag mvc-tag-sout">'+_mvIcon('hautbas',16)+' Soutir\u00e9e le '+_caveDateFr(d)+'</span>'
    +(n>1?'<span class="mvc-sout-note">'+n+' soutirages</span>':'')+'</div>';
}
/* ★★ CUV-9 — LA CUVEE QUI FERMENTE ENCORE LE DIT AU CHAI.
   Le vin decuve avant la fin de la FA est PHYSIQUEMENT au Chai, et c'est la
   qu'on decide de la suite. En rouge de garde on entonne SANS SO2 pour
   enchainer sur la malo en fut : la question n'est donc pas « sulfiter ou
   pas », c'est « la FA est-elle finie ». Lancer une malo sur du sucre, c'est
   le risque de piqure lactique ; sulfiter sur du sucre combine le SO2 et
   expose a un reveil tardif. Les deux gestes attendent la meme reponse.
   La cuvee n'a pas de densite a elle : elle lit celle de la cuve d'ou elle
   vient (`decuvage.cuvee_id`). Rien n'est recopie, rien ne peut diverger. */
function _caveCuveSource(cuvee){
  if(!cuvee||!cuvee.id||!window.CAVE_VENDANGE) return null;
  var L=(CAVE_VENDANGE.cuves_vinif||[]);
  for(var i=0;i<L.length;i++) if(L[i]&&L[i].decuvage&&L[i].decuvage.cuvee_id===cuvee.id) return L[i];
  return null;
}
/* ★ CUV-10 : deux lignes possibles, jamais les deux. L'alerte ne part QUE sur
   un fait note au decuvage — plus sur une densite comparee a un repere. */
function _caveFaLineHtml(c){
  var src=_caveCuveSource(c); if(!src) return '';
  /* ★★ CUV-11 — LA CUVEE LIT LA SUITE DE LA SERIE DE SA CUVE. §116 avait pose
     la regle (« rien n'est recopie, rien ne peut diverger ») mais la serie
     s'arretait au decuvage. Elle continue : le dernier releve s'affiche ICI,
     parce que c'est ici qu'on decide de lancer la malo ou de sulfiter, et
     qu'aucun des deux ne se fait sur du sucre. Toujours aucune densite propre
     a la cuvee. */
  var _lm=_vendLastD(src), _dk=(src.decuvage||{}).date||'';
  var _sv=(_lm&&_lm.date>_dk)
    ? (' \u00b7 dernier relev\u00e9 <b>'+Math.round(_vendMesD20(_lm))+'</b> le '+_vendFrDate(_lm.date))
    : '';
  if(_vendFaEnCours(src))
    return '<div class="mvc-fa-line">'+_mvIcon('alerte',16)+' <b>Fermentation \u00e0 finir</b> \u2014 '
      +_escHtml(src.nom||'la cuve')+' a \u00e9t\u00e9 d\u00e9cuv\u00e9e avant la fin de FA. '
      +'Attendez qu\u2019elle soit finie avant de lancer la malo ou de sulfiter.'+_sv+'</div>';
  var d=_vendDecD20(src); if(d==null&&!_sv) return '';
  return '<div class="mvc-fut-line">'+_mvIcon('eprouvette',16)
    +(d!=null?(' Mise en f\u00fbt \u00e0 <b>'+Math.round(d)+'</b> \u00e0 20\u00a0\u00b0C \u00b7 goutte et presse assembl\u00e9es')
            :' Suivi de densit\u00e9')
    +_sv+'</div>';
}
function _caveCuvCardHtml(c,w){
  var st=_caveState(c);
  var nbT=_caveNbTonneaux(c);
  var hl=_caveVolHl(c).toFixed(1);
  var isEmb=c.statut==='embouteille';
  var urgent=st==='due';
  var right=isEmb?'<span class="mvc-badge-bottled">Embouteill\u00e9e</span>':'<span class="mvc-mill">\u2019'+String(c.millesime||'').slice(-2)+'</span>';
  var tonStr=_caveTonneauxStr(c);
  var actions='';
  if(!isEmb && w){
    var _ou=_caveOuille(c);
    actions='<div class="mvc-cuv-actions">'
      +'<button'+(_ou
        ? ' class="mvc-act primary'+(urgent?' urgent':'')+'" onclick="_caveQuickOp(event,\'ouillage\',\''+c.id+'\')"'
        : ' class="mvc-act primary" disabled aria-disabled="true" title="Pas de contenant en bois \u00e0 ouiller"')
      +'>'+_mvIcon('seau',16)+' Ouiller</button>'
      +'<button class="mvc-act icon" onclick="_caveQuickOp(event,\'soutirage\',\''+c.id+'\')" aria-label="Soutirer">\u21d5</button>'
      +'<button class="mvc-act icon" onclick="_caveQuickOp(event,\'analyse\',\''+c.id+'\')" aria-label="Analyser">\ud83d\udd2c</button>'
    +'</div>';
  }
  return '<div class="mvc-cuv st-'+st+'" onclick="openCuveeDetail(\''+c.id+'\')">'
    +'<div class="mvc-cuv-head"><div class="mvc-cuv-lead"><div class="mvc-cuv-name">'+_escHtml(c.nom)+'</div>'
    +(tonStr?'<div class="mvc-cuv-ton">'+tonStr+'</div>':'')+'</div>'+right+'</div>'
    +'<div class="mvc-cuv-vol">'+_mvIcon(nbT?'barrique':'cuve',16)+' '+(_caveContenantsHtml(c)||'aucun contenant')+' <span class="mvc-dot"></span> '+hl+' hL</div>'
    +_asmCarteHtml(c,w)   // ASM-1
    +(isEmb?'':_caveFaLineHtml(c))
    +(isEmb?'':(_caveOuille(c)?_caveGaugeHtml(c):_caveNoOuHtml(c)))
    +_caveAnaLineHtml(c)
    +(isEmb?'':_caveSoutLineHtml(c))
    +actions
  +'</div>';
}
function _caveQuickOp(ev,type,cuvId){
  if(ev) ev.stopPropagation();
  if(isSaisonnier()){showToast('Acc\u00e8s lecture seule','#B85A1A');return;}
  openOvCaveOp();
  selCaveOpType(type);
  _copAllCuv=false;
  _copCuvSel=new Set([cuvId]);
  _copUpdateChips();
  if(typeof _copUpdateFutsSummary==='function') _copUpdateFutsSummary();
}
function _caveOuillerTous(){
  if(isSaisonnier()){showToast('Acc\u00e8s lecture seule','#B85A1A');return;}
  var due=_caveAlerts();
  if(!due.length) return;
  openOvCaveOp();
  selCaveOpType('ouillage');
  _copAllCuv=false;
  _copCuvSel=new Set(due.map(function(a){return a.cuv.id;}));
  _copUpdateChips();
  if(typeof _copUpdateFutsSummary==='function') _copUpdateFutsSummary();
  showToast(due.length+' cuv\u00e9e'+(due.length>1?'s':'')+' pr\u00e9s\u00e9lectionn\u00e9e'+(due.length>1?'s':'')+' \u2014 saisissez l\u2019ouillage','#C0845A');
}
function _caveJDet(op){
  var h='';
  if(op.type==='assemblage'&&op.data){   // ★ ASM-1
    h+='<div class="mvc-jdet">'+_escHtml(String(op.data.litres||0))+'\u00a0L de '+_escHtml(op.data.de_nom||'une autre cuve')
      +' \u2192 '+_escHtml(op.data.vers_nom||'')+'</div>';
  }
  if(op.type==='ouillage'&&op.data&&op.data.nb_ouillettes){
    h+='<div class="mvc-jdet">'+op.data.nb_ouillettes+' ouillettes \u00d7 '+op.data.vol_ouillette_L+' L = '+op.data.vol_total_L+' L'+(op.data.vol_par_fut_L?' \u00b7 '+op.data.vol_par_fut_L+' L/f\u00fbt':'')+'</div>';
  }
  if(op.type==='soutirage'&&op.data&&op.data.so2&&op.data.so2.mode&&op.data.so2.mode!=='none'){
    var s=op.data.so2, str='SO\u2082 ';
    if(s.dose) str+=s.dose+' '+(s.unite||'cL')+' ';
    str+=(s.mode==='unique')?'\u00b7 dose unique':'\u00d7 '+s.nb_doses+' / '+s.freq_j+' j';
    h+='<div class="mvc-jdet" style="color:#5CB87A">'+str+'</div>';
  }
  if(op.type==='soufre'&&op.data){
    h+='<div class="mvc-jdet"><span class="mvc-soufre-g">'+op.data.grammes_pastille+'g</span>'+op.data.nb_total+' pastille'+(op.data.nb_total>1?'s':'')+' <b style="color:#3A8C40">= '+op.data.so2_total_g+' g SO\u2082</b></div>';
  }
  if(op.type==='analyse'&&op._src==='op'&&op.data){
    var chips='';
    if(op.data.so2_libre) chips+='<span class="mvc-tag mvc-tag-so2">SO\u2082 libre '+op.data.so2_libre+'</span>';
    if(op.data.so2_total) chips+='<span class="mvc-tag mvc-tag-so2">SO\u2082 total '+op.data.so2_total+'</span>';
    if(op.data.av) chips+='<span class="mvc-tag mvc-tag-av">AV '+op.data.av+' g/L</span>';
    if(op.data.malique!=null) chips+='<span class="mvc-tag mvc-tag-av">Malique '+op.data.malique+' g/L</span>';
    if(op.data.fml){var fc=op.data.fml==='ok'?'mvc-tag-fmlok':op.data.fml==='cours'?'mvc-tag-fmlc':'mvc-tag-fmlno';chips+='<span class="mvc-tag '+fc+'">'+_caveFmlLabel(op.data.fml)+'</span>';}
    if(chips) h+='<div class="mvc-jtags">'+chips+'</div>';
    if(op.data.pdf_url){
      h+='<div class="mvc-jpdf">'+_mvIcon('document',16)+' <span class="mvc-jpdf-nm">'+_escHtml(op.data.pdf_nom||'analyse.pdf')+'</span><button onclick="window.open(\''+_escAttr(op.data.pdf_url)+'\',\'_blank\')" class="mvc-jpdf-btn">Ouvrir</button></div>';
    } else if(typeof isAdmin==='function'&&isAdmin()){
      h+='<div style="margin-top:6px"><label class="mvc-attach">'+_mvIcon('lien',16)+' Joindre un PDF<input type="file" accept="application/pdf" style="display:none" data-op-id="'+op.id+'" onchange="window._attachPdfToOp(this)"></label></div>';
    }
  }
  if(op.type==='analyse'&&op._src==='ana'&&op.data){
    if(op.data.fichier) h+='<div class="mvc-jdet">'+_mvIcon('document',16)+' '+_escHtml(op.data.fichier||'')+(op.data.taille?' \u00b7 '+_caveAnaFmtSize(op.data.taille):'')+'</div>';
    if(op.data.url) h+='<div class="mvc-jpdf"><button onclick="window.open(\''+_escAttr(op.data.url)+'\',\'_blank\')" class="mvc-jpdf-btn">Ouvrir</button></div>';
  }
  return h;
}
function renderCaveReglages(){
  var el=document.getElementById('mvc-body-reglages'); if(!el) return;
  // ⚠️ Le CSS du parc vit dans _caveV2InjectCss : sans cet appel, arriver aux
  //   reglages avant d'avoir ouvert les cuvees rendrait le parc SANS STYLE.
  _caveV2InjectCss();
  var adm=(typeof isAdmin==='function'&&isAdmin());
  var seuil=_caveSeuilGlobal();
  var _mils=_caveMilsEnCave();
  var html='';
  if(adm){
    // Un seuil par millesime : un vin jeune s'ouille plus souvent qu'un vin
    // d'un an. Le stepper global reste la reference des millesimes non regles.
    html+='<div class="mvc-set-card"><div class="mvc-set-t">'+_mvIcon('sablier',16)+' Alerte d\u2019ouillage</div>'
      +'<div class="mvc-set-d">Nombre de jours sans ouillage avant qu\u2019une cuv\u00e9e passe au rouge. La jauge \u00ab part des anges \u00bb se cale sur ce seuil.</div>'
      +'<div class="mvc-stepper"><button class="mvc-step-btn" onclick="_caveSeuilStep(-1)" aria-label="Diminuer">\u2212</button>'
      +'<div class="mvc-step-val"><div class="mvc-step-num" id="mvc-seuil-num">'+seuil+'</div><div class="mvc-step-unit">JOURS</div></div>'
      +'<button class="mvc-step-btn" onclick="_caveSeuilStep(1)" aria-label="Augmenter">+</button></div>';
    if(_mils.length){
      html+='<div class="mvc-set-sep"></div><div class="mvc-set-d" style="margin-bottom:8px">Par mill\u00e9sime \u2014 un vin jeune se rattrape plus souvent qu\u2019un vin d\u2019un an. Sans r\u00e9glage propre, le mill\u00e9sime suit le seuil ci-dessus.</div>';
      _mils.forEach(function(m){
        var par=(CAVE_ELEVAGE.config&&CAVE_ELEVAGE.config.ouillage_par_mil)||{};
        var propre=(parseInt(par[m],10)>0);
        html+='<div class="mvc-milrow"><span class="mvc-milrow-a">'+(m==='?'?'Sans mill\u00e9sime':_escHtml(m))+'</span>'
          +'<button class="mvc-step-btn sm" onclick="_caveSeuilMilStep(\''+_escAttr(m)+'\',-1)" aria-label="Diminuer">\u2212</button>'
          +'<span class="mvc-milrow-v'+(propre?' own':'')+'">'+_caveSeuilOu(m)+' j</span>'
          +'<button class="mvc-step-btn sm" onclick="_caveSeuilMilStep(\''+_escAttr(m)+'\',1)" aria-label="Augmenter">+</button>'
          +(propre?'<button class="mvc-milrow-x" onclick="_caveSeuilMilReset(\''+_escAttr(m)+'\')" title="Revenir au seuil g\u00e9n\u00e9ral">\u21a9</button>':'<span class="mvc-milrow-x" style="visibility:hidden">\u21a9</span>')
          +'</div>';
      });
    }
    html+='</div>';
    html+='<div class="mvc-set-card"><div class="mvc-set-t">'+_mvIcon('barrique',16)+' Contenance d\u2019un f\u00fbt</div>'
      +'<div class="mvc-set-d">Volume d\u2019une barrique. Sert \u00e0 convertir les f\u00fbts en hL partout dans Le Chai. 228 L en Bourgogne, 225 L \u00e0 Bordeaux, 500 \u00e0 600 L pour un demi-muid.</div>'
      +'<button class="mvc-set-btn" onclick="_caveFutPrompt()">'+_caveFutL()+' L \u00b7 Modifier</button></div>';
    html+=_caveParcCardHtml();
  }
  html+='<div class="mvc-set-card"><div class="mvc-set-t">'+_mvIcon('eprouvette',16)+' Convertisseur SO\u2082</div>'
    +'<div class="mvc-set-d">Dose, dilution, pastilles \u2014 pour pr\u00e9parer vos sulfitages.</div>'
    +'<button class="mvc-set-btn" onclick="openOvCaveConvert()">Ouvrir le convertisseur</button></div>';
  el.innerHTML=html;
}
// ══ L'ECRAN DU PARC ═══════════════════════════════════════════════════════
// Le formulaire vit DANS la carte, pas dans un overlay : ajouter une cuve ne
// justifie pas une entree dans index.html — et sans index.html, ce lot ne
// coute pas de cran de service worker.
// _cavePkForm : null = liste · '' = creation · id = edition.
var _cavePkForm=null, _cavePkMat='inox';

function _cavePkOccHtml(o){
  if(!o) return '<span class="mvc-pk-occ libre">Libre</span>';
  return o.type==='vinif'
    ? '<span class="mvc-pk-occ vinif">En vinification</span>'
    : '<span class="mvc-pk-occ pris">En \u00e9levage</span>';
}
function _cavePkRowHtml(p){
  var o=_caveCuveOcc(p.id), m=_caveMat(p.matiere), L=parseFloat(p.litres)||0;
  return '<button type="button" class="mvc-pk" onclick="_cavePkOpen(\'' + _escAttr(p.id) + '\')">'
    +'<span class="mvc-pk-ic '+_caveMatKey(p.matiere)+'">'+_mvIcon('cuve',18)+'</span>'
    +'<span class="mvc-pk-b"><span class="mvc-pk-n">'+_escHtml(p.nom||'Cuve')+'</span>'
    +'<span class="mvc-pk-m">'+_escHtml(m.lbl)+(m.ouille?' \u00b7 suit l\u2019ouillage':'')
    +(o?' \u00b7 '+_escHtml(o.nom):'')+'</span></span>'
    +'<span class="mvc-pk-r"><span class="mvc-pk-cap">'+_mvF1(L/100)+'<span class="u">hL</span></span>'
    +_cavePkOccHtml(o)+'</span></button>';
}
function _caveParcCardHtml(){
  var h='<div class="mvc-set-card"><div class="mvc-set-t">'+_mvIcon('cuve',18)+' Le parc \u00e0 cuves</div>'
    +'<div class="mvc-set-d">Vos cuves de cave, d\u00e9clar\u00e9es une fois. Une cuve sert \u00e0 vinifier au Cuvier, '
    +'puis \u00e0 \u00e9lever au Chai \u2014 c\u2019est le m\u00eame contenant, on ne le saisit qu\u2019une fois.</div>';
  if(_cavePkForm!==null) return h+_cavePkFormHtml()+'</div>';
  var parc=_caveParc();
  if(!parc.length){
    h+='<div class="mvc-pk-vide">Aucune cuve d\u00e9clar\u00e9e.<br>Ajoutez-en une pour pouvoir y \u00e9lever du vin.</div>';
  } else {
    var libres=0, capL=0;
    parc.forEach(function(p){ if(!_caveCuveOcc(p.id)) libres++; capL+=(parseFloat(p.litres)||0); });
    parc.forEach(function(p){ h+=_cavePkRowHtml(p); });
    h+='<div class="mvc-pk-tot">'+libres+' libre'+(libres>1?'s':'')+' sur '+parc.length
      +' \u00b7 '+_mvF1(capL/100)+' hL de capacit\u00e9 totale</div>';
  }
  return h+'<button class="mvc-set-btn" onclick="_cavePkOpen(\'\')">+ Ajouter une cuve</button></div>';
}
function _cavePkNoteHtml(m){
  return _caveMat(m).ouille
    ? '<div class="mvc-pk-note" id="mvc-pk-note">Le bois respire : cette cuve <b>entre dans le suivi d\u2019ouillage</b> '
      +'comme une barrique, et sa cuv\u00e9e garde sa jauge de part des anges.</div>'
    : '<div class="mvc-pk-note froid" id="mvc-pk-note">'+_escHtml(_caveMat(m).lbl)+' ne respire pas. Une cuv\u00e9e log\u00e9e '
      +'<b>uniquement</b> dans ce type de cuve n\u2019aura pas de jauge d\u2019ouillage, et ne comptera pas dans les alertes du Chai.</div>';
}
function _cavePkFormHtml(){
  var p=_cavePkForm?_caveCuve(_cavePkForm):null;
  var o=p?_caveCuveOcc(p.id):null;
  var h='<label class="mvc-pk-lbl" for="mvc-pk-nom">Nom</label>'
    +'<input id="mvc-pk-nom" class="mvc-pk-in" type="text" placeholder="ex. Cuve 4" value="'+_escHtml(p?(p.nom||''):'')+'">'
    +'<label class="mvc-pk-lbl" for="mvc-pk-l">Contenance <span class="mvc-pk-hint">(en litres)</span></label>'
    +'<input id="mvc-pk-l" class="mvc-pk-in" type="number" inputmode="numeric" placeholder="ex. 4000" '
    +'value="'+(p&&p.litres?String(parseFloat(p.litres)||''):'')+'" oninput="_cavePkPrev()">'
    +'<div class="mvc-pk-prev" id="mvc-pk-prev"></div>'
    +'<label class="mvc-pk-lbl">Mati\u00e8re</label>'
    +'<div class="mvc-pk-seg" id="mvc-pk-seg">';
  MV_CUVE_MATS.forEach(function(k){
    var m=MV_CUVE_MAT[k];
    h+='<button type="button" data-m="'+k+'"'+(k===_cavePkMat?' class="on"':'')+' onclick="_cavePkMatSet(\''+k+'\')">'
      +_escHtml(m.lbl)+'<span class="sm">'+(m.ouille?'ouillage suivi':'pas d\u2019ouillage')+'</span></button>';
  });
  h+='</div>'+_cavePkNoteHtml(_cavePkMat);
  if(o) h+='<div class="mvc-pk-note chaud">Cette cuve porte <b>'+_escHtml(o.nom)+'</b>. '
    +'On peut corriger son nom, pas la supprimer : il faudrait d\u2019abord la vider.</div>';
  h+='<button class="mvc-set-btn" onclick="_cavePkSave()">'+(p?'Enregistrer':'Ajouter la cuve')+'</button>';
  if(p&&!o) h+='<button class="mvc-set-btn" style="background:none;border:1px solid rgba(138,90,56,.22);color:var(--terre)" onclick="_cavePkDel()">Supprimer cette cuve</button>';
  h+='<button class="mvc-set-btn" style="background:none;border:1px solid rgba(138,90,56,.22);color:var(--terre)" onclick="_cavePkClose()">Annuler</button>';
  return h;
}
function _cavePkOpen(id){
  if(!(typeof isAdmin==='function'&&isAdmin())){ showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#C0392B'); return; }
  var p=id?_caveCuve(id):null;
  _cavePkForm = id||'';
  _cavePkMat  = p?_caveMatKey(p.matiere):'inox';
  renderCaveReglages();
  _cavePkPrev();
}
function _cavePkClose(){ _cavePkForm=null; renderCaveReglages(); }
// ⚠️ On MUTE le DOM au lieu de re-rendre : re-rendre la carte effacerait le nom
//   et la contenance deja saisis. Meme piege que _vendDecRender.
function _cavePkMatSet(m){
  _cavePkMat=_caveMatKey(m);
  var seg=document.getElementById('mvc-pk-seg');
  if(seg) Array.prototype.forEach.call(seg.querySelectorAll('button'),function(b){
    b.classList.toggle('on', b.getAttribute('data-m')===_cavePkMat);
  });
  var n=document.getElementById('mvc-pk-note');
  if(n) n.outerHTML=_cavePkNoteHtml(_cavePkMat);
}
function _cavePkPrev(){
  var e=document.getElementById('mvc-pk-prev'); if(!e) return;
  var v=parseFloat(((document.getElementById('mvc-pk-l')||{}).value||'').replace(',','.'))||0;
  e.textContent = v>0
    ? ('soit '+_mvF1(v/100)+' hL \u00b7 l\u2019\u00e9quivalent de '+Math.round(v/_caveFutL())+' barriques')
    : 'Affich\u00e9 en hL partout dans la Cave.';
}
function _cavePkSave(){
  if(!(typeof isAdmin==='function'&&isAdmin())){ showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#C0392B'); return; }
  var nom=((document.getElementById('mvc-pk-nom')||{}).value||'').trim();
  var L=parseFloat(((document.getElementById('mvc-pk-l')||{}).value||'').replace(',','.'));
  if(!nom){ showToast('Donnez un nom \u00e0 la cuve','#B85A1A'); return; }
  if(!isFinite(L)||L<100||L>100000){ showToast('Contenance attendue entre 100 et 100 000 L','#B85A1A'); return; }
  var parc=_caveParc().slice();
  if(_cavePkForm){
    var p=null;
    for(var i=0;i<parc.length;i++){ if(parc[i].id===_cavePkForm) p=parc[i]; }
    if(!p){ showToast('Cuve introuvable','#E07060'); _cavePkClose(); return; }
    p.nom=nom; p.litres=L; p.matiere=_cavePkMat;
  } else {
    parc.push({id:'cvi_'+Date.now(), nom:nom, litres:L, matiere:_cavePkMat});
  }
  _caveParcSave(parc);
  _cavePkForm=null;
  renderCaveReglages();
  if(typeof renderCaveCuvees==='function') renderCaveCuvees();
  showToast(nom+' \u00b7 '+_mvF1(L/100)+' hL enregistr\u00e9e','#3D6B27');
}
function _cavePkDel(){
  var id=_cavePkForm; if(!id) return;
  var p=_caveCuve(id); if(!p) return;
  // ⚠️ Double filet : le bouton n'apparait pas si la cuve est prise, et on
  //   reverifie ici — l'occupation peut avoir change depuis le rendu.
  if(_caveCuveOcc(id)){ showToast('Cuve occup\u00e9e \u2014 videz-la d\u2019abord','#B85A1A'); return; }
  var go=function(){
    _caveParcSave(_caveParc().filter(function(x){ return x.id!==id; }));
    _cavePkForm=null; renderCaveReglages();
    showToast('Cuve retir\u00e9e du parc','#B85A1A');
  };
  if(typeof window.openConfirmDel==='function') window.openConfirmDel('Retirer '+(p.nom||'cette cuve')+' du parc ?','',go);
  else go();
}

function _caveSeuilStep(delta){
  var cur=(CAVE_ELEVAGE.config&&CAVE_ELEVAGE.config.ouillage_alerte_j)||14;
  var v=Math.max(3,Math.min(30,cur+delta));
  if(!CAVE_ELEVAGE.config) CAVE_ELEVAGE.config={};
  CAVE_ELEVAGE.config.ouillage_alerte_j=v;
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  window.fbSaveToast({cave_elevage:CAVE_ELEVAGE},'Seuil r\u00e9gl\u00e9 \u00e0 '+v+' jours','#3D6B27');
  var n=document.getElementById('mvc-seuil-num'); if(n) n.textContent=v;
  _mvcRenderHeader();
  renderCaveCuvees();
}
// Reglage de la contenance d'un fut. openPrompt (jamais prompt() natif : il ne
// rend RIEN en PWA iOS). Ecrit CONFIG.cave.fut_l en PRESERVANT le reste de
// CONFIG.cave, puis re-rend l'affichage. Ne recalcule AUCUN volume deja stocke.
function _caveFutPrompt(){
  if(!(typeof isAdmin==='function'&&isAdmin())){ showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#C0392B'); return; }
  if(typeof window.openPrompt!=='function'){ showToast('Saisie indisponible','#C0392B'); return; }
  window.openPrompt({
    icone:'barrique',
    titre:'Contenance d\u2019un f\u00fbt',
    sub:'228 L en Bourgogne, 225 L \u00e0 Bordeaux, 500 \u00e0 600 L pour un demi-muid.',
    valeur:_caveFutL(),
    unite:'L',
    type:'nombre',
    btnLabel:'Enregistrer',
    cb:function(v){
      var n=parseFloat(String(v).replace(',','.'));
      if(!isFinite(n)||n<50||n>5000){ showToast('Contenance attendue entre 50 et 5000 L','#B85A1A'); return; }
      window.CONFIG=window.CONFIG||{};
      window.CONFIG.cave=Object.assign({},window.CONFIG.cave||{},{fut_l:n});
      if(window.saveData)window.saveData('config');
      _mvcRenderHeader();
      renderCaveCuvees();
      renderCaveReglages();
      showToast('F\u00fbt r\u00e9gl\u00e9 \u00e0 '+n+' L','#3D6B27');
    }
  });
}



function _caveSyncSecTabs(){
  ['aujourdhui','elevage','vendange','millesime'].forEach(function(s){
    var b=document.getElementById('cave-sec-'+s);
    if(b) b.classList.toggle('active', s===caveSection);
  });
  // La roue crantee n'est pas un onglet, mais elle dit quand on est chez elle.
  var g=document.getElementById('cave-hdr-gear');
  if(g) g.classList.toggle('active', caveSection==='reglages');
}

function renderCave() {
  // Filet de tolerance : une valeur hors des TROIS sections connues replie sur
  // l'Elevage. Sans lui, une valeur reposee par un autre module masque les trois
  // vues et la Cave s'ouvre VIDE, sans erreur et sans test qui le voie.
  if (['aujourdhui','elevage','vendange','millesime','reglages'].indexOf(caveSection)<0) caveSection = 'aujourdhui';
  // Les courbes du millesime s'enregistrent aupres de _mvGraphRepeindre :
  // des qu'on n'est plus sur elles, on oublie la famille, sinon chaque
  // redimensionnement les redessine dans un conteneur qui n'existe plus.
  if(!(caveSection==='millesime'&&_mlTab==='crb') && window._mvGraphOublier){ try{ window._mvGraphOublier('#pcrb-g-'); }catch(e){ if(window.logError) window.logError({level:'info',cat:'cave',msg:'oubli courbes',err:e}); } }
  _caveSyncSecTabs();
  // L'en-tete et la bande de chiffres sont ceux de la Cave ENTIERE, ecrits une
  // seule fois ici — plus par chaque section (lot CAVE-1).
  _caveHeaderRender();
  _caveKpisRender();
  var _aujHost=document.getElementById('cave-view-auj'); if(_aujHost) _aujHost.style.display='none';
  var _regHost=document.getElementById('cave-view-reg'); if(_regHost) _regHost.style.display='none';
  if (caveSection === 'reglages') { _mvcHide(); _mlHideAutres(); renderCaveReglagesCave(); return; }
  if (caveSection === 'aujourdhui') { _mvcHide(); _mlHideAutres(); renderCaveAujourdhui(); return; }
  if (caveSection === 'millesime') { _mvcHide(); _mlHideAutres(); renderCaveMillesime(); return; }
  var _mlHost=document.getElementById('cave-view-mil'); if(_mlHost) _mlHost.style.display='none';
  if (caveSection === 'vendange') { _mvcHide(); renderCaveVendange(); return; }
  // ── Élevage (refonte mvc) ──
  ['vend','auj','reg'].forEach(function(t){var v=document.getElementById('cave-view-'+t);if(v)v.style.display='none';});
  var mlv2=document.getElementById('cave-view-mil'); if(mlv2) mlv2.style.display='none';
  var host=document.getElementById('mvc-elevage'); if(host) host.style.display='block';
  _mvcRenderHeader();
  switchCaveOng(caveTab||'cuv');
}



/* ★ CUV-DEC (§164) — Le Cuvier vit dans cuvier.js : il lit la section active par ici,
   jamais la variable elle-même (un nom lu dans un autre module n'existe pas après le build). */
function _caveSectionAct(){ return caveSection; }
function selectCaveSection(id) {
  caveSection=id;
  caveTab='cuv';
  _vendOngletCuves();
  renderCave();
}

// Masque les vues du Chai et du Cuvier quand on ouvre Le millesime.
function _mlHideAutres(){
  ['vend','auj','reg'].forEach(function(t){
    var v=document.getElementById('cave-view-'+t); if(v) v.style.display='none';
  });
}


function switchCaveOng(tab) {
  // Les QUATRE onglets du Chai, definis UNE seule fois : le filet ci-dessous et la
  // boucle d'affichage doivent parler de la meme liste (deux definitions du meme
  // concept dans un module = incoherence garantie entre deux ecrans).
  var ONGLETS = ['cuv','journal','bouteille'];
  // Les reglages du Chai sont dans la roue crantee (lot CAVE-2) : les anciennes
  // cles y atterrissent.
  if(tab==='divers'||tab==='reglages'){ _caveOpenReglages(); return; }
  // Filet de tolerance, meme patron que switchPhytoTab qui replie tout inconnu sur 'reg'.
  // Sans lui, une valeur hors liste (l'ancien 'dash' du tableau de bord purge, ou une
  // valeur reposee par un autre module) masque les QUATRE vues et n'active aucun
  // bouton : Le Chai s'ouvre VIDE, sans erreur, sans trace, sans test qui le voie.
  if(ONGLETS.indexOf(tab)<0) tab='cuv';
  caveTab = tab;
  _caveEnsureBtlTab();
  _caveMilBarRender();
  ONGLETS.forEach(function(t) {
    var btn=document.getElementById('mvc-tbtn-'+t);
    var view=document.getElementById('mvc-view-'+t);
    if(btn) btn.classList.toggle('active',t===tab);
    if(view) view.style.display=t===tab?'block':'none';
  });
  if(tab==='cuv') renderCaveCuvees();
  else if(tab==='journal') renderCaveJournal();
  else if(tab==='bouteille') renderCaveBouteille();
}


function renderCaveCuvees() {
  var el=document.getElementById('mvc-body-cuv'); if(!el) return;
  if(!window._dataReady){ el.innerHTML=window._mvSk('chai'); return; }
  var cuvs=CAVE_ELEVAGE.cuvees||[];
  if(!cuvs.length) {
    el.innerHTML='<div class="cave-empty"><div class="cave-empty-ico">'+_mvIcon('seau',40)+'</div>'
      +'<div class="cave-empty-txt">Aucune cuv\u00e9e.</div>'
      +((typeof isAdmin==='function'&&isAdmin())?'<button class="cave-empty-btn" onclick="openOvCavee()">+ Nouvelle cuv\u00e9e</button>':'')
      +'</div>';
    return;
  }
  // ⚠️ 'inox' DOIT avoir un rang : sans lui order['inox'] vaut undefined,
  //   la soustraction donne NaN et le tri devient instable en silence.
  var order={due:0,watch:1,ok:2,inox:2,bottled:3};
  var sorted=cuvs.slice().sort(function(a,b){
    var da=order[_caveState(a)], db=order[_caveState(b)];
    if(da!==db) return da-db;
    return _caveDSince(b)-_caveDSince(a);
  });
  var due=_caveAlerts();
  var w=canWrite();
  _caveV2InjectCss();
  // ★ Lot CAVE-6 : les chips du millesime ont quitte cette liste pour
  //   #mvc-milbar — elles valent pour les trois onglets du Chai.
  var html='';
  due=due.filter(function(a){ return _caveDansFiltre(a.cuv); });
  if(due.length){
    html+='<div class="mvc-alert"><div class="mvc-alert-ico">'+_mvIcon('seau',24)+'</div><div class="mvc-alert-txt">'
      +'<div class="mvc-alert-t">'+due.length+' cuv\u00e9e'+(due.length>1?'s':'')+' \u00e0 ouiller</div>'
      +'<div class="mvc-alert-s">L\u2019\u00e9vaporation menace \u2014 remplissez les f\u00fbts pour \u00e9viter l\u2019oxydation.</div></div></div>';
    if(w) html+='<button class="mvc-batch" onclick="_caveOuillerTous()">'+_mvIcon('seau',16)+' Ouiller les '+due.length+' aujourd\u2019hui</button>';
  }
  sorted.filter(_caveDansFiltre).forEach(function(c){ html+=_caveCuvCardHtml(c,w); });
  if(typeof isAdmin==='function'&&isAdmin()){
    html+='<button class="mvc-add" onclick="openOvCavee()">+ Nouvelle cuv\u00e9e</button>';
  }
  el.innerHTML=html;
}


function openOvCaveOp(opId) {
  if(isSaisonnier()){showToast('Acc\u00E8s lecture seule','#B85A1A');return;}
  var actives=CAVE_ELEVAGE.cuvees.filter(function(c){return c.statut!=='embouteille';});
  if(!actives.length) {
    if(typeof isAdmin==='function'&&isAdmin()){showToast('Cr\u00e9ez d\'abord une cuv\u00e9e','#C0845A');openOvCavee();}
    else showToast('Aucune cuv\u00e9e active','#B85A1A');
    return;
  }
  // Reset \u00E9tat multi-cuv\u00E9es
  _copCuvSel=new Set();_copAllCuv=false;_copOuillette=10;_copSo2Mode='none';_copSo2Nb=2;_copSo2Freq=10;
  _copIntSel=(window.currentUser&&window.currentUser.nom)?[window.currentUser.nom]:[];
  var today=_mvToday();
  _caveOpType='ouillage';_caveFml='none';
  ['cop-so2l','cop-so2t','cop-av','cop-mal','cop-fml-date'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.value='';
  });
  _copResetPdfZone();
  selCaveOpType('ouillage');
  var dateEl=document.getElementById('cop-date');if(dateEl)dateEl.value=today;
  // Millesime par defaut : le plus recent en cave. Une seule porte de
  // construction des chips, pour qu'aucun chemin ne reconstruise a cote.
  var _mils=_copMillesimes();
  _copMil=_mils.length?_mils[0]:null;
  _copRenderMils();
  _copRenderCuvChips();
  var sumEl=document.getElementById('cop-cuvees-summary');
  if(sumEl){sumEl.textContent='S\u00e9lectionnez des cuv\u00e9es';sumEl.style.color='var(--texte-leger)';}
  _copRenderIntChips();
  // Reset champs ouillage
  var ouEl=document.getElementById('cop-ouillette-val');if(ouEl)ouEl.textContent='10';
  var nbEl=document.getElementById('cop-nb-ouillettes');if(nbEl)nbEl.value='';
  var resEl=document.getElementById('cop-ouillage-result');if(resEl)resEl.style.display='none';
  // Reset champs soutirage
  var snEl=document.getElementById('cop-sout-note');if(snEl)snEl.value='';
  setCopSo2Mode('none');setCopSo2Nb(2);setCopSo2Freq(10);
  // Reset champs soufre
  _copSoufreG=5;_copSoufreMode='fut';
  var sfEl=document.getElementById('cop-sf-nb');if(sfEl)sfEl.value='';
  var sfCalc=document.getElementById('cop-sf-result');if(sfCalc)sfCalc.style.display='none';
  _copSyncSoufreUI();
  var nEl=document.getElementById('cop-notes');if(nEl)nEl.value='';
  var idEl=document.getElementById('cop-op-id');if(idEl)idEl.value=opId||'';
  var titleEl=document.getElementById('ov-cave-title');
  if(titleEl)titleEl.textContent=opId?'Modifier op\u00e9ration':'Nouvelle op\u00e9ration';
  if(opId){
    var op=CAVE_ELEVAGE.operations.find(function(o){return o.id===opId;});
    if(op){
      if(dateEl)dateEl.value=op.date;
      selCaveOpType(op.type);
      var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
      // On se place sur le millesime de l'operation editee, sinon ses cuvees
      // ne seraient meme pas affichees. Une operation mixte heritee du passe
      // est signalee plutot que silencieusement amputee.
      var _om={};
      ids.forEach(function(id){
        var _c=actives.find(function(x){return x.id===id;});
        if(_c) _om[(_c.millesime==null||_c.millesime==='')?'?':String(_c.millesime)]=1;
      });
      var _ok=Object.keys(_om);
      if(_ok.length){ _copMil=_ok[0]; }
      _copRenderMils(); _copRenderCuvChips();
      if(_ok.length>1) showToast('Cette opération couvre '+_ok.join(' et ')+' \u2014 choisissez un millésime','#B85A1A');
      var _duMil=_copCuvsDuMil();
      if(_ok.length===1 && ids.length===_duMil.length){_copAllCuv=true;}
      else{ids.forEach(function(id){_copCuvSel.add(id);});}
      _copUpdateChips();_copUpdateFutsSummary();
      if(op.type==='ouillage'&&op.data){
        _copOuillette=op.data.vol_ouillette_L||10;
        var ov2=document.getElementById('cop-ouillette-val');if(ov2)ov2.textContent=_copOuillette;
        var nb2=document.getElementById('cop-nb-ouillettes');if(nb2)nb2.value=op.data.nb_ouillettes||'';
        updateCopOuillageCalc();
      }
      if(op.type==='soutirage'&&op.data){
        if(snEl)snEl.value=op.data.note||'';
        if(op.data.so2&&op.data.so2.mode){
          setCopSo2Mode(op.data.so2.mode);
          if(op.data.so2.nb_doses)setCopSo2Nb(op.data.so2.nb_doses);
          if(op.data.so2.freq_j)setCopSo2Freq(op.data.so2.freq_j);
          if(op.data.so2.mode==='unique'){
            var du=document.getElementById('cop-so2-dose-u');if(du)du.value=op.data.so2.dose||'';
            var uu=document.getElementById('cop-so2-unite-u');if(uu)uu.value=op.data.so2.unite||'cL';
          } else if(op.data.so2.mode==='recurrent'){
            var dr=document.getElementById('cop-so2-dose-r');if(dr)dr.value=op.data.so2.dose||'';
            var ur=document.getElementById('cop-so2-unite-r');if(ur)ur.value=op.data.so2.unite||'cL';
          }
        }
      }
      if(op.type==='soufre'&&op.data){
        _copSoufreG=op.data.grammes_pastille||5;
        _copSoufreMode=op.data.mode||'fut';
        _copSyncSoufreUI();
        var sfnEl=document.getElementById('cop-sf-nb');if(sfnEl)sfnEl.value=op.data.nb_input||'';
        _copUpdateSoufreCalc();
      }
      if(nEl)nEl.value=op.notes||'';
      _copIntSel=(op.intervenants&&op.intervenants.length)?op.intervenants.slice():(op.operateur?[op.operateur]:_copIntSel);
      _copRenderIntChips();
      if(op.type==='analyse'&&op.data){
        // ⚠ BUG PREEXISTANT corrige ici : opData est reconstruit EN ENTIER a
        // l'enregistrement. Sans ce pre-remplissage, editer une analyse pour
        // corriger sa date reecrivait so2_libre/so2_total/av avec ce qui
        // restait dans le DOM de la saisie precedente.
        // .value pose EN JS : un attribut HTML ne survit ni a iOS ni au
        // reaffichage du formulaire.
        var _fa=[['cop-so2l','so2_libre'],['cop-so2t','so2_total'],['cop-av','av'],['cop-mal','malique']];
        _fa.forEach(function(f){ var el=document.getElementById(f[0]);
          if(el) el.value=(op.data[f[1]]!=null?op.data[f[1]]:''); });
        if(op.data.fml){ selCaveFml(op.data.fml);
          if(op.data.fml==='ok'&&op.data.fml_date){ var _fd=document.getElementById('cop-fml-date'); if(_fd)_fd.value=op.data.fml_date; } }
      }
      if(op.type==='analyse'&&op.data&&op.data.pdf_url){
        var _en=document.getElementById('cop-pdf-name');if(_en)_en.textContent=op.data.pdf_nom||'rapport.pdf';
        var _es=document.getElementById('cop-pdf-size');if(_es)_es.textContent=op.data.pdf_taille?_copFmtSize(op.data.pdf_taille):'';
        var _ee=document.getElementById('cop-pdf-empty');if(_ee)_ee.style.display='none';
        var _est=document.getElementById('cop-pdf-staged');if(_est)_est.style.display='flex';
        _copPdfFile='__keep__'+op.data.pdf_url+'|'+(op.data.pdf_nom||'')+'|'+(op.data.pdf_taille||0)+'|'+(op.data.pdf_path||'');
      }
    }
  }
  _copUpdateOpDate();
  var _ovCo=document.getElementById('ovCaveOp');if(_ovCo)_ovCo.classList.add('open');
}

// remplac\u00E9 par syst\u00E8me chips multi-cuv\u00E9es

function selCaveOpType(type) {
  _caveOpType=type;
  ['ouillage','soutirage','soufre','analyse','autre'].forEach(function(t) {
    var btn=document.getElementById('cot-'+t);
    if(btn) btn.classList.toggle('sel',t===type);
    var fields=document.getElementById('cop-fields-'+t);
    if(fields) fields.style.display=t===type?'block':'none';
  });
  var nw=document.getElementById('cop-notes-wrap');
  if(nw)nw.style.display=type==='soutirage'?'none':'block';
  if(type==='soufre') _copUpdateSoufreCalc();
  _copUpdateChips();
}

function selCaveFml(v) {
  _caveFml=v;
  var classes={none:'fml-none',cours:'fml-cours',ok:'fml-ok'};
  ['none','cours','ok'].forEach(function(k){
    var btn=document.getElementById('cfml-'+k); if(!btn) return;
    btn.className='cave-fml-opt'+(k===v?' '+classes[k]:'');
  });
  var wrap=document.getElementById('cop-fml-date-wrap');
  if(wrap) wrap.style.display=v==='ok'?'block':'none';
}

// Un seul basculement subsiste : la FML. Le « sous tirage » a ete retire du
// formulaire — un oui/non ne peut pas decrire un geste qui a lieu PLUSIEURS
// FOIS, et il contredisait a l'ecran les soutirages enregistres au Chai.
// La signature garde son parametre : les onclick de index.html passent 'fml'.
function _cuvToggle(field, val) {
  if(field!=='fml') return;
  var hid=document.getElementById('cuv-fml-val'); if(!hid) return;
  hid.value=val;
  var actif={
    non:{bg:'rgba(180,140,50,0.15)',color:'#B8913A',bdr:'rgba(180,140,50,0.35)'},
    ok:{bg:'rgba(58,140,64,0.15)',color:'#3A8C40',bdr:'rgba(58,140,64,0.35)'}
  };
  var inact={bg:'var(--bg-card)',color:'var(--texte-doux)',bdr:'var(--gris)'};
  ['non','ok'].forEach(function(k){
    var btn=document.getElementById('cuv-fml-'+k); if(!btn) return;
    var s=k===val?actif[k]:inact;
    btn.style.background=s.bg;
    btn.style.color=s.color;
    btn.style.borderColor=s.bdr;
  });
}

async function saveCaveOp() {
  var actives=CAVE_ELEVAGE.cuvees.filter(function(c){return c.statut!=='embouteille';});
  var date=(document.getElementById('cop-date')||{}).value;
  var notes=((document.getElementById('cop-notes')||{}).value||'').trim();
  if(!date){showToast('Saisissez une date','#E07060');return;}
  if(!_copAllCuv&&_copCuvSel.size===0){showToast('S\u00e9lectionnez au moins une cuv\u00e9e','#E07060');return;}
  // « Toutes » = toutes les cuvees DU MILLESIME courant, jamais toute la cave.
  var cuvIds=_copAllCuv?_copCuvsDuMil().map(function(c){return c.id;}):Array.from(_copCuvSel);
  var cuvees=actives.filter(function(c){return cuvIds.indexOf(c.id)!==-1;});
  // ⚠ Derniere garde avant ecriture : une operation ne porte QUE sur un
  // millesime. L'interface l'empeche deja, mais un etat rejoue (edition d'une
  // vieille operation, retour arriere) pourrait passer entre les mailles.
  // On refuse plutot que d'ecrire une donnee qu'aucun calcul ne saura lire.
  var _mset={};
  cuvees.forEach(function(c){ _mset[(c.millesime==null||c.millesime==='')?'?':String(c.millesime)]=1; });
  var _mkeys=Object.keys(_mset);
  if(_mkeys.length>1){
    showToast('Un millésime à la fois \u2014 ici '+_mkeys.join(' et '),'#C0392B');
    return;
  }
  var opData={};
  if(_caveOpType==='ouillage'){
    var nbOuillettes=parseInt((document.getElementById('cop-nb-ouillettes')||{}).value)||0;
    if(!nbOuillettes){showToast('Saisissez le nombre d\u0027ouillettes','#E07060');return;}
    var volTotal=nbOuillettes*_copOuillette;
    var nbFuts=_copGetNbFuts(), _eq=_copGetEqFuts();
    // ★ FUT-CAP-2 — vol_par_eq_L : le meme ouillage rapporte a une piece au format
    //   du domaine. C'est lui que l'agenda relit ; vol_par_fut_L reste pour l'ecran.
    opData={nb_ouillettes:nbOuillettes,vol_ouillette_L:_copOuillette,vol_total_L:volTotal,
            vol_par_fut_L:nbFuts>0?Math.round(volTotal/nbFuts*10)/10:null,
            vol_par_eq_L:_eq>0?Math.round(volTotal/_eq*10)/10:null};
    cuvees.forEach(function(c){c.last_ouillage=date;});
  } else if(_caveOpType==='soutirage'){
    var sn=((document.getElementById('cop-sout-note')||{}).value||'').trim();
    opData={note:sn};
    if(_copSo2Mode!=='none'){
      var so2={mode:_copSo2Mode};
      if(_copSo2Mode==='unique'){
        so2.dose=parseFloat((document.getElementById('cop-so2-dose-u')||{}).value)||null;
        so2.unite=((document.getElementById('cop-so2-unite-u')||{}).value)||'cL';
        so2.dates=[date];
      } else {
        so2.dose=parseFloat((document.getElementById('cop-so2-dose-r')||{}).value)||null;
        so2.unite=((document.getElementById('cop-so2-unite-r')||{}).value)||'cL';
        so2.nb_doses=_copSo2Nb;so2.freq_j=_copSo2Freq;
        var base=new Date(date),dArr=[];
        for(var i=0;i<_copSo2Nb;i++){var dd=new Date(base);dd.setDate(dd.getDate()+i*_copSo2Freq);dArr.push(_mvISO(dd));}
        so2.dates=dArr;
      }
      opData.so2=so2;
    }
  } else if(_caveOpType==='analyse'){
    opData={
      so2_libre:parseFloat((document.getElementById('cop-so2l')||{}).value)||null,
      so2_total:parseFloat((document.getElementById('cop-so2t')||{}).value)||null,
      av:parseFloat((document.getElementById('cop-av')||{}).value)||null,
      malique:parseFloat((document.getElementById('cop-mal')||{}).value)||null,
      fml:_caveFml,
      fml_date:_caveFml==='ok'?((document.getElementById('cop-fml-date')||{}).value||date):null
    };
    if(_copPdfFile&&typeof _copPdfFile==='object'){
      var _sb=document.querySelector('#ovCaveOp .mbtn');
      if(_sb){_sb.disabled=true;_sb.textContent='Upload PDF\u2026';}
      showSyncBadge('Upload PDF\u2026','#B8913A');
      try{
        var _pr=await window.fbUploadAnalyse(_copPdfFile,function(p){if(_sb)_sb.textContent='Upload '+p+'%';});
        opData.pdf_url=_pr.url;opData.pdf_path=_pr.storage_path;
        opData.pdf_nom=_copPdfFile.name;opData.pdf_taille=_copPdfFile.size;
        if(_sb){_sb.disabled=false;_sb.textContent='Enregistrer';}
      }catch(e){
        showToast('Erreur upload PDF','#E07060');
        if(_sb){_sb.disabled=false;_sb.textContent='Enregistrer';}
        return;
      }
    } else if(_copPdfFile&&typeof _copPdfFile==='string'&&_copPdfFile.startsWith('__keep__')){
      var _kp=_copPdfFile.slice(8).split('|');
      opData.pdf_url=_kp[0];opData.pdf_nom=_kp[1];opData.pdf_taille=parseInt(_kp[2])||0;opData.pdf_path=_kp[3]||'';
    }
    cuvees.forEach(function(c){c.last_analyse=date;});
  } else if(_caveOpType==='soufre'){
    var sfG=_copSoufreG;
    var sfMode=_copSoufreMode;
    var sfNb=parseInt((document.getElementById('cop-sf-nb')||{}).value)||0;
    if(!sfNb){showToast('Saisissez le nombre de pastilles','#E07060');return;}
    var nbFutsTotal=_copGetNbFuts();
    var sfTotal=sfMode==='fut'?sfNb*nbFutsTotal:sfNb;
    opData={grammes_pastille:sfG,mode:sfMode,nb_input:sfNb,nb_total:sfTotal,so2_total_g:sfTotal*sfG};
  } else {
    opData={desc:((document.getElementById('cop-autre-desc')||{}).value||'').trim()};
  }
  var firstId=cuvIds[0]||null;
  var existId=(document.getElementById('cop-op-id')||{}).value;
  if(existId){
    var idx=CAVE_ELEVAGE.operations.findIndex(function(o){return o.id===existId;});
    if(idx!==-1) CAVE_ELEVAGE.operations[idx]=Object.assign(CAVE_ELEVAGE.operations[idx],
      {type:_caveOpType,date:date,cuvee_id:firstId,cuvees_ids:cuvIds,operateur:window.currentUser?.nom||'',intervenants:_copIntSel.slice(),notes:notes,data:opData});
  } else {
    CAVE_ELEVAGE.operations.push({id:'op_'+Date.now(),type:_caveOpType,date:date,
      cuvee_id:firstId,cuvees_ids:cuvIds,operateur:window.currentUser?.nom||'',intervenants:_copIntSel.slice(),notes:notes,data:opData});
  }
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  window.fbSaveToast({cave_elevage:CAVE_ELEVAGE},'Op\u00e9ration enregistr\u00e9e','#C0845A');
  window.closeOv(null,'ovCaveOp');
  _copResetPdfZone();
  renderCave();
}

/* ★★★ FUT-CAP — LA FICHE GARDE CE QU'ELLE NE MONTRE PAS. Elle recopiait
   {annee, nb} : reenregistrer une cuvee (un nom, la malo) effacait tonnelier,
   reference et lot des futs entonnes depuis le parc — revenus « lot sans nom »
   a la mise en bouteille, et un fut loue en vin ne comptait plus au loyer.
   Meme piege que saveVendCuve (§69d) : on copie la ligne ENTIERE.
   Une cuvee sans fut (cuve seule) s'ouvre VIDE : la fiche lui pre-remplissait
   six futs qui n'existaient pas, et refusait d'enregistrer sans eux. */
function _cuvTonneauxDe(cuv){
  var y=new Date().getFullYear();
  if(cuv && cuv.tonneaux && cuv.tonneaux.length) return cuv.tonneaux.map(function(t){ return Object.assign({},t); });
  if(cuv && cuv.nb_tonneaux) return [{annee:y, nb:cuv.nb_tonneaux}];
  if(cuv) return [];
  return [{annee:y,nb:2},{annee:y-2,nb:4}];
}
function openOvCavee(cuvId) {
  var cuv=cuvId?CAVE_ELEVAGE.cuvees.find(function(c){return c.id===cuvId;}):null;
  var titleEl=document.getElementById('ov-cuv-title');
  if(titleEl) titleEl.textContent=cuv?'Modifier la cuv\u00e9e':'Nouvelle cuv\u00e9e';
  var el;
  el=document.getElementById('cuv-nom'); if(el) el.value=cuv?cuv.nom:'';
  el=document.getElementById('cuv-millesime'); if(el) el.value=cuv?cuv.millesime:new Date().getFullYear();
  el=document.getElementById('cuv-statut'); if(el) el.value=cuv?(cuv.statut||'elevage'):'elevage';
  // Basculement FML
  // ★ Meme lecture que les cartes du Chai : une malo declaree finie par une
  //   ANALYSE ouvrait la fiche sur « Non terminee », qui contredisait
  //   l'etiquette « FML ✓ » de la carte juste derriere.
  var fmlInit=(cuv&&_caveFmlEtat(cuv)==='ok')?'ok':'non';
  var hFml=document.getElementById('cuv-fml-val');if(hFml)hFml.value=fmlInit;
  window._cuvToggle('fml',fmlInit);
  // Peupler la r\u00E9partition des tonneaux
  _cuvTonneaux=_cuvTonneauxDe(cuv);
  _renderCuvTonneaux();
  el=document.getElementById('cuv-id'); if(el) el.value=cuvId||'';
  el=document.getElementById('cuv-del-btn'); if(el) el.style.display=cuv?'block':'none';
  var _ovCm=document.getElementById('ovCuveeMgmt');if(_ovCm)_ovCm.classList.add('open');
}

function saveCuvee() {
  var nom=((document.getElementById('cuv-nom')||{}).value||'').trim();
  var millesime=parseInt((document.getElementById('cuv-millesime')||{}).value)||new Date().getFullYear();
  var statut=(document.getElementById('cuv-statut')||{}).value||'elevage';
  var fmlTerminee=(document.getElementById('cuv-fml-val')||{}).value==='ok';
  var existId=(document.getElementById('cuv-id')||{}).value;
  var tonneaux=_cuvTonneaux.filter(function(t){return t.nb>0;});
  var nbTotal=tonneaux.reduce(function(s,t){return s+(t.nb||0);},0);
  if(!nom){showToast('Saisissez un nom','#E07060');return;}
  // ★ FUT-CAP — une cuvee logee en cuve n'a pas de fut a declarer.
  var _exC=existId?CAVE_ELEVAGE.cuvees.find(function(c){return c.id===existId;}):null;
  if(!nbTotal && !(_exC && (_exC.cuves||[]).length)){showToast('Indiquez au moins un tonneau','#E07060');return;}
  // ★ La declaration de la fiche est DATEE : c'est ce qui permet a une analyse
  //   posterieure de la corriger sans qu'on ait a revenir decocher le bouton.
  var _fmlAuj=_mvToday();
  if(existId) {
    var idx=CAVE_ELEVAGE.cuvees.findIndex(function(c){return c.id===existId;});
    // sous_tire n'est plus ecrit : l'ancienne valeur reste en base, inerte,
    // et n'est plus lue nulle part. Le soutirage vit dans les operations.
    if(idx!==-1) {
      var _prevC=CAVE_ELEVAGE.cuvees[idx];
      /* ★ FUT-CAP — « Embouteillee » pose ICI rendait les futs a personne : ni en
         vin (une cuvee embouteillee est ignoree), ni libres. Meme geste que la
         mise en bouteille, AVANT de poser le statut. */
      /* ★ FUT-CAP-2 — et le chemin inverse. « Embouteillee » par erreur, remise en
         elevage : la cuvee reprend ses futs au parc, sinon ils compteraient deux
         fois. S'il en manque (repartis dans une autre cuvee, vendus, retires), on
         REFUSE, avant toute ecriture. Une mise en bouteille annulee n'a pas eu
         lieu : ses traces (bouteilles, date, bilan) partent avec elle. */
      if(statut!=='embouteille' && _prevC.statut==='embouteille'
         && typeof window._mvFutReprendre==='function' && window.INTRANTS){
        var _dsp=window._mvFutDispo({tonneaux:tonneaux}, window.INTRANTS);
        if(_dsp.manque>0){
          showToast(_dsp.manque+' f\u00fbt'+(_dsp.manque>1?'s':'')+' de cette cuv\u00e9e '+(_dsp.manque>1?'ne sont':'n\u2019est')
            +' plus libre'+(_dsp.manque>1?'s':'')+' au parc \u2014 la remettre en \u00e9levage '
            +(_dsp.manque>1?'les':'le')+' compterait deux fois','#B85A1A');
          return;
        }
        if(window._mvFutReprendre({nom:nom, millesime:millesime, tonneaux:tonneaux}, window.INTRANTS,
             'remise en \u00e9levage \u2014 '+nom+' '+millesime) && typeof window.saveIntrants==='function') window.saveIntrants();
        delete _prevC.nb_bouteilles; delete _prevC.date_embouteillage; delete _prevC.bilan_perte;
      }
      if(statut==='embouteille' && _prevC.statut!=='embouteille'
         && typeof window._mvFutLiberer==='function' && window.INTRANTS){
        if(window._mvFutLiberer({nom:nom, millesime:millesime, tonneaux:tonneaux}, window.INTRANTS)
           && typeof window.saveIntrants==='function') window.saveIntrants();
      }
      // ⚠️ On ne REDATE pas un drapeau deja pose et deja date : reenregistrer
      //    la fiche pour corriger un nom ferait passer la declaration devant
      //    une analyse plus recente.
      var _fmlD=_prevC.fml_terminee_date||null;
      if(fmlTerminee&&(!_prevC.fml_terminee||!_fmlD)) _fmlD=_fmlAuj;
      if(!fmlTerminee) _fmlD=null;
      Object.assign(_prevC,{nom:nom,millesime:millesime,tonneaux:tonneaux,statut:statut,fml_terminee:fmlTerminee,fml_terminee_date:_fmlD});
    }
  } else {
    CAVE_ELEVAGE.cuvees.push({id:'cuv_'+Date.now(),nom:nom,millesime:millesime,
      tonneaux:tonneaux,statut:'elevage',fml_terminee:fmlTerminee,fml_terminee_date:fmlTerminee?_fmlAuj:null,
      last_ouillage:null,last_analyse:null});
  }
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  window.fbSaveToast({cave_elevage:CAVE_ELEVAGE},existId?'Cuv\u00e9e mise \u00e0 jour':'Cuv\u00e9e cr\u00e9\u00e9e','#C0845A');
  window.closeOv(null,'ovCuveeMgmt');
  renderCave();
}

function deleteCuvee() {
  var existId=(document.getElementById('cuv-id')||{}).value;
  if(!existId) return;
  CAVE_ELEVAGE.cuvees=CAVE_ELEVAGE.cuvees.filter(function(c){return c.id!==existId;});
  CAVE_ELEVAGE.operations=CAVE_ELEVAGE.operations.filter(function(o){return o.cuvee_id!==existId;});
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  window.fbSaveToast({cave_elevage:CAVE_ELEVAGE},'Cuv\u00e9e supprim\u00e9e','#B85A1A');
  window.closeOv(null,'ovCuveeMgmt');
  renderCave();
}

// \u2500\u2500 Cave Analyses Labo \u2500\u2500


// ── Soutirages d'une cuvee ────────────────────────────────
// ⚠ MODELE : le soutirage n'est PAS un etat. Il a lieu PLUSIEURS FOIS
// pendant l'elevage, et toujours au Chai, une fois les futs entonnes.
// La verite est donc la suite des operations datees, jamais un drapeau
// oui/non. Le drapeau cuvee.sous_tire a ete retire du formulaire : les
// anciennes valeurs dorment en base et ne sont plus lues nulle part.
// SOURCE UNIQUE : le Pilotage la consomme au lieu de recompter de son cote.
function _caveSoutOps(cuvId){
  return (CAVE_ELEVAGE.operations||[]).filter(function(op){
    if(!op||op.type!=='soutirage'||!op.date) return false;
    var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
    return ids.indexOf(cuvId)!==-1;
  }).sort(function(a,b){ return a.date>b.date?-1:(a.date<b.date?1:0); });
}
function _caveLastSout(cuvId){
  var l=_caveSoutOps(cuvId);
  return l.length?l[0].date:null;
}

// ── FML : DEUX PORTES DE SAISIE, UNE SEULE LECTURE ──────────────────────
// La malo finie se declare a DEUX endroits : la fiche cuvee (bouton
// « Terminee » -> `cuvee.fml_terminee`) et l'operation d'analyse
// (`op.data.fml`). Le Chai ne lisait que la SECONDE, et sans condition :
//   var fml=(lao&&lao.data)?lao.data.fml:(c.fml_terminee?'ok':null);
// le drapeau n'etait consulte que s'il n'existait AUCUNE analyse. Cocher
// « Terminee » dans la fiche ne changeait donc rien a l'ecran des lors qu'une
// analyse anterieure disait « En cours ». Aujourd'hui (`_mlMalo`) lisait deja
// le drapeau : les deux ecrans se contredisaient sur la meme cuvee, le meme
// jour. Signale par Nico le 12/09 sur deux cuvees dont la malo etait finie.
// ★ REGLE : la declaration la PLUS RECENTE gagne, quelle que soit sa porte.
function _caveFmlDerniereOp(cuvId) {
  // Derniere analyse qui DIT quelque chose de la FML, pour cette cuvee.
  // ⚠️ On ne prend pas « la derniere analyse » tout court : le selecteur FML
  //    du formulaire retombe sur 'none' a chaque ouverture (_caveOpReset), donc
  //    une analyse de SO2 saisie sans y toucher effacait l'etiquette d'une malo
  //    en cours. Seul 'cours' / 'ok' / 'non' est une declaration ; 'none' et
  //    l'absence de champ n'en sont pas une.
  var best=null;
  (CAVE_ELEVAGE.operations||[]).forEach(function(op){
    if(!op||op.type!=='analyse'||!op.data)return;
    var f=op.data.fml;
    if(f!=='cours'&&f!=='ok'&&f!=='non')return;
    var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
    if(ids.indexOf(cuvId)===-1)return;
    // ⚠️ `>=`, pas `>`. A date egale c'est la saisie la plus recemment
    //    ENREGISTREE qui doit gagner : avec `>`, une analyse « Terminee » posee
    //    le meme jour qu'une « En cours » perdait contre elle, en silence.
    if(!best||(op.date||'')>=(best.date||''))best=op;
  });
  return best;
}
function _caveFmlEtat(c) {
  // Etat FML affichable d'une cuvee : 'ok' | 'cours' | 'non' | null.
  // Lecture unique, partagee par les cartes du Chai, la fiche cuvee et _mlMalo.
  if(!c)return null;
  var op=_caveFmlDerniereOp(c.id);
  var mes=op?op.data.fml:null;
  if(!c.fml_terminee)return mes;
  // ⚠️ Le drapeau de la fiche n'etait pas date avant ce lot. Sans date, il
  //    reste la verite du vigneron et gagne (§ lot MALO). Date, il se laisse
  //    corriger par une analyse POSTERIEURE — sinon un drapeau pose une fois
  //    epinglerait « FML ✓ » a vie, y compris contre la mesure du lendemain.
  var d=c.fml_terminee_date||null;
  if(mes&&d&&op&&(op.date||'')>d)return mes;
  return 'ok';
}

function _caveLastAna(cuvId) {
  // Operations type='analyse' pour cette cuvee
  var opAnas=(CAVE_ELEVAGE.operations||[]).filter(function(op){
    if(op.type!=='analyse')return false;
    var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
    return ids.indexOf(cuvId)!==-1;
  }).map(function(op){
    return{_src:'op',id:op.id,date:op.date,date_analyse:op.date,data:op.data||{},notes:op.notes||''};
  });
  // Analyses PDF standalone
  var pdfAnas=(CAVE_ELEVAGE.analyses||[]).filter(function(a){
    return Array.isArray(a.cuvee_ids)&&a.cuvee_ids.indexOf(cuvId)!==-1;
  }).map(function(a){
    return{_src:'ana',id:a.id,date:a.date_analyse||a.date||'',date_analyse:a.date_analyse||a.date||'',
      type:a.type,data:{pdf_url:a.url,pdf_nom:a.nom_fichier,pdf_taille:a.taille},notes:a.commentaire||''};
  });
  var all=opAnas.concat(pdfAnas);
  if(!all.length)return null;
  return all.reduce(function(best,a){return(!best||a.date_analyse>best.date_analyse)?a:best;},null);
}



function _caveAnaFmtSize(bytes) {
  if(!bytes) return '';
  if(bytes<1048576) return Math.round(bytes/1024)+'\u00a0Ko';
  return (bytes/1048576).toFixed(1)+'\u00a0Mo';
}



function _copSyncSoufreUI() {
  var g2=document.getElementById('cop-sf-g2'), g5=document.getElementById('cop-sf-g5');
  if(g2) g2.classList.toggle('sel', _copSoufreG===2);
  if(g5) g5.classList.toggle('sel', _copSoufreG===5);
  var mf=document.getElementById('cop-sf-mode-fut'), mt=document.getElementById('cop-sf-mode-tot');
  if(mf) mf.classList.toggle('sel', _copSoufreMode==='fut');
  if(mt) mt.classList.toggle('sel', _copSoufreMode==='total');
  var lbl=document.getElementById('cop-sf-nb-lbl');
  if(lbl) lbl.textContent=_copSoufreMode==='fut'?'Pastilles par f\u00fbt':'Nombre total de pastilles';
  var ph=document.getElementById('cop-sf-nb');
  if(ph) ph.placeholder=_copSoufreMode==='fut'?'ex. 1':'ex. 82';
}

function setCopSoufreG(g) {
  _copSoufreG=g;
  _copSyncSoufreUI();
  _copUpdateSoufreCalc();
}

function setCopSoufreMode(m) {
  _copSoufreMode=m;
  _copSyncSoufreUI();
  _copUpdateSoufreCalc();
}

function _copUpdateSoufreCalc() {
  var nbEl=document.getElementById('cop-sf-nb');
  var resEl=document.getElementById('cop-sf-result');
  if(!nbEl||!resEl) return;
  var nb=parseInt(nbEl.value);
  if(!nb){resEl.style.display='none';return;}
  var nbFuts=_copGetNbFuts()||82;
  var total=_copSoufreMode==='fut'?nb*nbFuts:nb;
  var so2=total*_copSoufreG;
  var pastEl=document.getElementById('cop-sf-res-past');
  var so2El=document.getElementById('cop-sf-res-so2');
  if(_copSoufreMode==='fut'){
    if(pastEl) pastEl.textContent=nb+'/f\u00fbt \u00d7 '+nbFuts+' = '+total;
  } else {
    if(pastEl) pastEl.textContent=total;
  }
  if(so2El) so2El.textContent=so2+' g SO\u2082';
  resEl.style.display='block';
}

// \u2500\u2500 Convertisseur SO\u2082 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function openOvCaveConvert() {
  _convMode='liq2past'; _convDilution=5;
  _syncConvUI();
  var ov=document.getElementById('ovCaveConvert'); if(ov) ov.classList.add('open');
}

function _syncConvUI() {
  ['liq2past','past2liq'].forEach(function(m){
    var b=document.getElementById('cbtn-'+m); if(b) b.classList.toggle('sel',m===_convMode);
    var p=document.getElementById('conv-panel-'+m); if(p) p.style.display=m===_convMode?'block':'none';
  });
  [3,5,6,8].forEach(function(d){
    var b=document.getElementById('cdil-'+d); if(b) b.classList.toggle('sel',d===_convDilution);
  });
  var dn=document.getElementById('conv-dil-note');
  if(dn) dn.innerHTML='1 cL \u00e0 '+_convDilution+'% = <strong>'+(Math.round(_convDilution/10*100)/100)+' g SO\u2082</strong>';
  var pl=document.getElementById('conv-pct-lbl'); if(pl) pl.textContent=_convDilution;
  _calcConvLiq(); _calcConvPast();
}

function setConvMode(m) { _convMode=m; _syncConvUI(); }

function setConvDil(d) {
  _convDilution=d;
  var inp=document.getElementById('conv-dil-inp'); if(inp) inp.value=d;
  _syncConvUI();
}

function onConvDilInput() {
  var v=parseFloat((document.getElementById('conv-dil-inp')||{}).value)||5;
  _convDilution=v;
  [3,5,6,8].forEach(function(d){
    var b=document.getElementById('cdil-'+d); if(b) b.classList.remove('sel');
  });
  var dn=document.getElementById('conv-dil-note');
  if(dn) dn.innerHTML='1 cL \u00e0 '+v+'% = <strong>'+(Math.round(v/10*100)/100)+' g SO\u2082</strong>';
  var pl=document.getElementById('conv-pct-lbl'); if(pl) pl.textContent=v;
  _calcConvLiq(); _calcConvPast();
}

function _fmtN(n,dec){
  if(!n&&n!==0)return '\u2014';
  var v=parseFloat(n.toFixed(dec));
  return v%1===0?v.toFixed(0):v.toFixed(dec);
}

function _calcConvLiq() {
  if(_convMode!=='liq2past') return;
  var cl=parseFloat((document.getElementById('conv-cl')||{}).value);
  var res=document.getElementById('conv-res-liq2past');
  if(!res) return;
  if(!cl){res.style.display='none';return;}
  var g=cl*_convDilution/10;
  var p2=g/2, p5=g/5;
  var gEl=document.getElementById('conv-res-g'); if(gEl) gEl.textContent=_fmtN(g,2)+' g';
  var p2El=document.getElementById('conv-res-p2'); if(p2El) p2El.textContent=_fmtN(p2,1)+' pastille'+(p2>1?'s':'');
  var p5El=document.getElementById('conv-res-p5'); if(p5El) p5El.textContent=_fmtN(p5,1)+' pastille'+(p5>1?'s':'');
  var hEl=document.getElementById('conv-res-hint');
  if(hEl){var h='';if(p2%1!==0||p5%1!==0)h='\u2248 '+Math.round(p2)+' pastille'+(Math.round(p2)>1?'s':'')+' 2g ou '+Math.round(p5)+' pastille'+(Math.round(p5)>1?'s':'')+' 5g';hEl.textContent=h;}
  res.style.display='block';
}

function _calcConvPast() {
  if(_convMode!=='past2liq') return;
  var p2=parseFloat((document.getElementById('conv-p2')||{}).value)||0;
  var p5=parseFloat((document.getElementById('conv-p5')||{}).value)||0;
  var res=document.getElementById('conv-res-past2liq');
  if(!res) return;
  if(!p2&&!p5){res.style.display='none';return;}
  var tg=p2*2+p5*5;
  var cl=tg*10/_convDilution;
  var tEl=document.getElementById('conv-res-total'); if(tEl) tEl.textContent=_fmtN(tg,1)+' g';
  var cEl=document.getElementById('conv-res-cl'); if(cEl) cEl.textContent=_fmtN(cl,2)+' cL';
  var mEl=document.getElementById('conv-res-ml'); if(mEl) mEl.textContent=_fmtN(cl*10,1)+' mL \u00b7 '+_fmtN(cl/10,2)+' dL';
  res.style.display='block';
}

function renderCaveJournal() {
  var el=document.getElementById('mvc-journal-timeline'); if(!el) return;
  var ops=(CAVE_ELEVAGE.operations||[]).map(function(o){return Object.assign({},o,{_src:'op'});});
  var anas=(CAVE_ELEVAGE.analyses||[]).map(function(a){return {_src:'ana',id:a.id,type:'analyse',
    date:a.date||a.date_analyse,date_analyse:a.date_analyse,cuvees_ids:a.cuvee_ids||[],
    operateur:a.uploaded_by||'',notes:a.commentaire||'',
    data:{label:a.type,fichier:a.nom_fichier,taille:a.taille,url:a.url}};});
  var all=ops.concat(anas).sort(function(a,b){return b.date>a.date?1:-1;});
  /* ★ Lot CAVE-6 — le journal suit le filtre millesime du Chai.
     ⚠️ Une operation qu'aucun millesime ne reclame (mixte, ou sur une cuvee
     effacee) SORT du filtre plutot que d'atterrir dans la mauvaise annee —
     meme arbitrage qu'au registre (§20h). Elle reste visible sur « Tous »,
     et l'ecran DIT combien il en ecarte : une ligne qui disparait sans un mot
     se lit comme une perte de donnee. */
  var _horsMil=0;
  if(_caveMillFilter!=='tous'){
    all=all.filter(function(o){
      var ids=o.cuvees_ids||(o.cuvee_id?[o.cuvee_id]:[]);
      var m=_rmMilCuvees(CAVE_ELEVAGE, ids);
      if(m===null){ _horsMil++; return false; }
      return String(m)===String(_caveMillFilter);
    });
  }
  var filtered=_jFilter==='tous'?all:all.filter(function(o){return o.type===_jFilter;});
  var _milNote=(_caveMillFilter!=='tous')
    ? '<div class="mvc-jmilnote">Millésime '+_escHtml(String(_caveMillFilter))+' seul'
      +(_horsMil?' · '+_horsMil+' opération'+(_horsMil>1?'s':'')+' non rattachée'+(_horsMil>1?'s':'')+' à un millésime, visible'+(_horsMil>1?'s':'')+' sur « Tous »':'')
      +'</div>' : '';
  if(!filtered.length){
    el.innerHTML=_milNote+'<div class="cave-empty"><div class="cave-empty-ico">'+(_jFilter==='analyse'?'\ud83d\udd2c':'\ud83d\udccb')+'</div><div class="cave-empty-txt">Aucune op\u00e9ration'+(_caveMillFilter!=='tous'?' sur ce mill\u00e9sime':'')+'.</div></div>';
    return;
  }
  var opMeta={ouillage:{ico:'seau',col:'#C0845A'},soutirage:{ico:'hautbas',col:'#5CB87A'},soufre:{ico:'eprouvette',col:'#4A9C50'},analyse:{ico:'microscope',col:'#4A9FC8'},assemblage:{ico:'fiole',col:'#8A5A38'},autre:{ico:'crayon',col:'#A0A8B8'}};
  var monthNames=['Janvier','F\u00e9vrier','Mars','Avril','Mai','Juin','Juillet','Ao\u00fbt','Septembre','Octobre','Novembre','D\u00e9cembre'];
  var byMonth={}, order=[];
  filtered.forEach(function(o){
    var dstr=(o.type==='analyse')?(o.date_analyse||o.date):o.date; if(!dstr) dstr='';
    var dd=new Date(dstr);
    var key=isNaN(dd)?'?':(dd.getFullYear()+'-'+('0'+(dd.getMonth()+1)).slice(-2));
    if(!byMonth[key]){byMonth[key]=[];order.push(key);}
    byMonth[key].push(o);
  });
  var keys=order.sort(function(a,b){return b>a?1:-1;});
  var html=_milNote;
  keys.forEach(function(k){
    var mLbl=(k==='?')?'':(function(){var pp=k.split('-');return monthNames[parseInt(pp[1],10)-1]+' '+pp[0];})();
    html+='<div class="mvc-jmonth">'+mLbl+'</div>';
    byMonth[k].sort(function(a,b){return b.date>a.date?1:-1;}).forEach(function(op){
      var m=opMeta[op.type]||opMeta.autre;
      html+='<div class="mvc-jitem"><div class="mvc-jdot" style="background:'+m.col+'"></div><div class="mvc-jcard">';
      html+='<div class="mvc-jhead"><span class="mvc-jico">'+_mvIcon(m.ico,18)+'</span><span class="mvc-jtype">'+_caveTypeLabel(op.type)+'</span>'+_caveWhoHtml(op)+'</div>';
      html+=_caveCuvPillsHtml(op);
      var det=_caveJDet(op); if(det) html+=det;
      if(op.notes&&op.type!=='analyse') html+='<div class="mvc-jnote">'+_escHtml(op.notes)+'</div>';
      html+='<div class="mvc-jdate">'+_caveDateFr((op.type==='analyse')?(op.date_analyse||op.date):op.date)+'</div>';
      if(op._src==='op'&&typeof isAdmin==='function'&&isAdmin()){
        // ★ ASM-1 — un assemblage ne se modifie pas : il se defait (la corbeille), puis se refait.
        html+='<div class="mvc-jact">'+(op.type!=='assemblage'?'<button onclick="window.openOvCaveOp(\''+op.id+'\')" class="mvc-jact-e">\u270f\ufe0f Modifier</button>':'')+'<button onclick="window.deleteCaveOp(\''+op.id+'\')" class="mvc-jact-d">\ud83d\uddd1</button></div>';
      }
      html+='</div></div>';
    });
  });
  el.innerHTML=html;
}

function setCaveJFilter(f) {
  _jFilter=f;
  document.querySelectorAll('.mvc-jf').forEach(function(b){b.classList.toggle('active',b.dataset.f===f);});
  var upEl=document.getElementById('mvc-journal-upload');
  if(upEl) upEl.style.display=(f==='analyse'||f==='tous')?'':'none';
  renderCaveJournal();
}

var _caveAnaPendingFile=null;
var _caveAnaSelIds=[];


// Handler de l'input #cave-ana-input (onchange dans index.html)
function _onCaveAnaFileChange(input) {
  var file = input && input.files && input.files[0];
  input.value = '';
  if (!file) return;
  if (file.type !== 'application/pdf') { showToast('Seuls les PDF sont accept\u00e9s', '#E07060'); return; }
  if (file.size > 10 * 1024 * 1024) { showToast('PDF trop lourd \u2014 max 10\u00a0Mo', '#E07060'); return; }
  openOvCaveAna(file);
}

function openOvCaveAna(file) {
  _caveAnaPendingFile=file||_caveAnaPendingFile;
  if(!_caveAnaPendingFile) return;
  _caveAnaSelIds=[];
  var el;
  el=document.getElementById('cana-filename'); if(el) el.textContent=_caveAnaPendingFile.name;
  el=document.getElementById('cana-filesize'); if(el) el.textContent=_caveAnaFmtSize(_caveAnaPendingFile.size);
  el=document.getElementById('cana-date'); if(el) el.value=_mvToday();
  el=document.getElementById('cana-type'); if(el) el.value='so2';
  el=document.getElementById('cana-commentaire'); if(el) el.value='';
  el=document.getElementById('cana-save-btn'); if(el){el.disabled=false;el.textContent='Enregistrer';}
  el=document.getElementById('cana-cuv-hint'); if(el) el.textContent='';
  _renderCaveAnaChips();
  setCanaMode('new');
  _populateCanaLinkOps();
  var ov=document.getElementById('ovCaveAna'); if(ov) ov.classList.add('open');
}

function selectCanaLinkOp(el,id) {
  var idx=_caveAnaLinkedOpIds.indexOf(id);
  if(idx===-1){_caveAnaLinkedOpIds.push(id);el.classList.add('sel');}
  else{_caveAnaLinkedOpIds.splice(idx,1);el.classList.remove('sel');}
  var hint=document.getElementById('cana-link-count');
  if(hint)hint.textContent=_caveAnaLinkedOpIds.length
    ?_caveAnaLinkedOpIds.length+' op\u00e9ration'+(_caveAnaLinkedOpIds.length>1?'s':'')+' s\u00e9lectionn\u00e9e'+(_caveAnaLinkedOpIds.length>1?'s':'') : '';
}

function setCanaMode(mode) {
  var isLink=mode==='link';
  var secNew=document.getElementById('cana-section-new');
  var secLink=document.getElementById('cana-section-link');
  if(secNew) secNew.style.display=isLink?'none':'';
  if(secLink) secLink.style.display=isLink?'':'none';
  var btnNew=document.getElementById('cana-mode-new');
  var btnLink=document.getElementById('cana-mode-link');
  if(btnNew) btnNew.classList.toggle('cana-mode-sel',!isLink);
  if(btnLink) btnLink.classList.toggle('cana-mode-sel',isLink);
  var inp=document.getElementById('cana-link-op-id'); if(inp) inp.value='';
  _caveAnaLinkedOpIds=[];
  document.querySelectorAll('.cana-link-op-item').forEach(function(x){x.classList.remove('sel');});
  var hint=document.getElementById('cana-link-count');if(hint)hint.textContent='';
}

function _populateCanaLinkOps() {
  var el=document.getElementById('cana-link-op-list'); if(!el) return;
  var ops=(CAVE_ELEVAGE.operations||[]).filter(function(o){
    return o.type==='analyse'&&!(o.data&&o.data.pdf_url);
  }).sort(function(a,b){return b.date>a.date?1:-1;});
  if(!ops.length){
    el.innerHTML='<div style="text-align:center;padding:20px 0;font-size:var(--pt-txt,12.5px);color:var(--texte-doux);">Aucune op\u00e9ration d\'analyse sans PDF.<br><span style="font-size:var(--pt-micro,11px);">Cr\u00e9ez d\'abord une op\u00e9ration de type Analyse.</span></div>';
    return;
  }
  el.innerHTML=ops.map(function(op){
    var cuvLabel=_caveCuvLabel(op);
    var notesHtml=op.notes?'<div style="font-size:var(--pt-micro,11px);font-style:italic;color:var(--texte-doux);margin-top:1px;">'+_escHtml(op.notes)+'</div>':'' ;
    var hasSO2=op.data&&(op.data.so2_libre||op.data.so2_total);
    return '<div class="cana-link-op-item" data-id="'+op.id+'" onclick="window.selectCanaLinkOp(this,\''+op.id+'\')">'  
      +'<div style="display:flex;align-items:flex-start;gap:8px;">'  
      +'<span style="font-size:var(--pt-base,14px);margin-top:1px;">\uFFFD\uFFFD</span>'  
      +'<div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--texte);">'+_caveDateFr(op.date)+'</span>'+(hasSO2?'<span style="font-size:var(--pt-lbl,10.5px);font-weight:600;color:#4A9FC8;background:rgba(74,159,200,0.1);border-radius:6px;padding:1px 6px;">SO\u2082 \u2713</span>':'')+'</div>'  
      +'<div style="font-size:var(--pt-txt,12.5px);font-weight:500;color:var(--terre,#C0845A);margin-bottom:2px;">\uD83C\uDF77 '+_escHtml(cuvLabel)+'</div>'  
      +notesHtml+'</div>'  
      +'</div>';
  }).join('');
}

function renderCaveVendange() {
  _vendInjectCss();
  /* ⚠ .mvv-histwrap / .mvv-hrow vivent dans _vendEnsureSheetCss, et le
     detail deplie s'en sert AVANT qu'aucune feuille n'ait ete ouverte :
     sans cet appel, l'historique sortait sans style au premier affichage. */
  _vendEnsureSheetCss();
  // ★ L'en-tete et la bande #cave-kpis sont ecrits par renderCave (lot CAVE-1).
  var mvcHost=document.getElementById('mvc-elevage'); if(mvcHost) mvcHost.style.display='none';
  ['auj','reg'].forEach(function(t){var v=document.getElementById('cave-view-'+t);if(v)v.style.display='none';});
  var mlv=document.getElementById('cave-view-mil'); if(mlv) mlv.style.display='none';
  var vv=document.getElementById('cave-view-vend'); if(vv) vv.style.display='block';
  var body=document.getElementById('cave-vend-body'); if(!body) return;
  body.style.padding='0';
  body.innerHTML='<div class="mvv-wrap">'+_vendCockpitHtml()+'<div class="mvv-body" id="mvv-body"></div></div>';
  _vendRenderTab();
}

function _mvgId(x){ return String(x==null?'':x).replace(/[^A-Za-z0-9_-]/g,''); }

function _cuvKey(s){
  return String(s==null?'':s).trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}
function _cuvLev(a,b){
  if(a===b) return 0;
  var m=a.length,n=b.length; if(!m) return n; if(!n) return m;
  var prev=[],cur=[],i,j;
  for(j=0;j<=n;j++) prev[j]=j;
  for(i=1;i<=m;i++){
    cur[0]=i;
    for(j=1;j<=n;j++) cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a.charAt(i-1)===b.charAt(j-1)?0:1));
    prev=cur.slice();
  }
  return prev[n];
}
window._cuvKey          = _cuvKey;





// \u2500\u2500 Cuv\u00E9e detail view \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function _caveOpenPdf(el){var u=el.dataset.url;if(u)window.open(u,'_blank');}

function _caveSparkSO2(cuvId,w){
  var ops=(CAVE_ELEVAGE.operations||[]).filter(function(op){
    if(op.type!=='analyse')return false;
    var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
    return ids.indexOf(cuvId)!==-1&&op.data&&op.data.so2_libre;
  }).sort(function(a,b){return a.date>b.date?1:-1;});
  // Aucune analyse : la section n'existe pas, l'appelant ne l'affiche meme pas.
  // UNE analyse : il y a de la matiere mais pas de courbe — on dit pourquoi.
  if(!ops.length) return null;
  if(ops.length<2) return window._mvGraphVide('Une seule analyse de SO\u2082 libre',
    'Une deuxi\u00e8me mesure suffit \u00e0 tracer l\u2019\u00e9volution.');
  var vals=ops.map(function(op){return parseFloat(op.data.so2_libre);});
  var dates=ops.map(function(op){return _caveDateFr(op.date);});
  var mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals),rng=mx-mn||10;
  var c=window._mvGraphCadre(w,82,{padL:10,padR:10,padT:20,padB:22});
  var W=c.w,H=c.h,pX=c.padL,pY=c.padT,iW=c.iw,iH=c.ih;
  var pts=vals.map(function(v,i){
    return{x:pX+(i/(vals.length-1))*iW,y:pY+(1-(v-mn)/rng)*iH,v:v,d:dates[i]};
  });
  var pl=pts.map(function(p){return p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' ');
  var ap='M'+pts[0].x.toFixed(1)+','+(H-c.padB)+' L'+pts.map(function(p){return p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' L')+' L'+pts[pts.length-1].x.toFixed(1)+','+(H-c.padB)+' Z';
  var COL='var(--ink-info)';
  var g='<path d="'+ap+'" fill="'+COL+'" fill-opacity="0.10"/>';
  g+='<polyline fill="none" stroke="'+COL+'" stroke-width="'+c.trait.prevu+'" stroke-linejoin="round" points="'+pl+'"/>';
  // Une etiquette sur deux au-dela de six mesures : on retire des reperes, on ne
  // reduit pas la police.
  var pas=vals.length>6?2:1;
  pts.forEach(function(p,i){
    g+='<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="3" fill="'+COL+'"/>';
    if(i%pas===0||i===pts.length-1)
      g+='<text x="'+p.x.toFixed(1)+'" y="'+Math.max(c.txt.mini+2,p.y-6).toFixed(1)+'" fill="'+COL+'" font-size="'+c.txt.mini+'" text-anchor="middle">'+p.v+'</text>';
    if(i===0||i===pts.length-1){
      // Les deux dates etaient ecrites en blanc a 25 % sur une carte claire :
      // invisibles depuis toujours.
      var tx=i===0?pX:W-pX;
      g+='<text x="'+tx+'" y="'+(H-6)+'" fill="'+c.col.texte+'" font-size="'+c.txt.mini+'" text-anchor="'+(i===0?'start':'end')+'">'+p.d+'</text>';
    }
  });
  return window._mvGraphSvg(c,'SO\u2082 libre : '+vals.length+' analyses, de '+mn+' \u00e0 '+mx+' milligrammes par litre.',g);
}

function openCuveeDetail(cuvId){
  var cuv=(CAVE_ELEVAGE.cuvees||[]).find(function(c){return c.id===cuvId;});
  if(!cuv)return;
  var bodyEl=document.getElementById('cuvd-body');
  if(!bodyEl){var ov2=document.getElementById('ovCuveeDetail');if(ov2)ov2.classList.add('open');return;}
  var nbT=_caveNbTonneaux(cuv);
  var tEl=document.getElementById('cuvd-title');var sEl=document.getElementById('cuvd-sub');
  if(tEl)tEl.textContent=cuv.nom+(cuv.millesime?' '+cuv.millesime:'');
  // ⚠️ Ecrivait « N tonneaux » en dur : faux des qu'une cuve est logee. Le
  //   libelle est DERIVE, donc juste dans les trois cas (futs / cuve / mixte).
  if(sEl)sEl.textContent=(_caveContenantsStr(cuv)||'aucun contenant')+' \u00B7 '+_caveVolHl(cuv).toFixed(1)+' hL'+(_caveTonneauxStr(cuv)?' \u00B7 '+_caveTonneauxStr(cuv):'');
  var seuil=_caveSeuilOu(cuv);
  var lMs=cuv.last_ouillage?new Date(cuv.last_ouillage).getTime():0;
  var dSince=lMs?Math.floor((Date.now()-lMs)/86400000):9999;
  var ouSuivi=_caveOuille(cuv);
  var ouOk=ouSuivi?(lMs&&dSince<seuil):true;
  var ouC=ouOk?'#3A8C40':'#E07060';
  var ouD=cuv.last_ouillage?_caveDateFr(cuv.last_ouillage):'Jamais';
  var ouS=lMs?(dSince===0?'aujourd\'hui':dSince+'\u00A0j'):'';
  var lAna=_caveLastAna(cuvId);
  var lSO2L=null,lSO2T=null,lFml=null,lAv=null,lPdfUrl=null,lPdfNom=null;
  if(lAna&&lAna._src==='op'&&lAna.data){
    lSO2L=lAna.data.so2_libre;lSO2T=lAna.data.so2_total;
    lAv=lAna.data.av;
    lPdfUrl=lAna.data.pdf_url;lPdfNom=lAna.data.pdf_nom;
  } else if(lAna&&lAna.data){lPdfUrl=lAna.data.pdf_url;lPdfNom=lAna.data.pdf_nom;}
  // ★ Meme lecture que les cartes du Chai. Avant ce lot la fiche ne lisait
  //   QUE la derniere analyse — et jamais `fml_terminee` : une cuvee declaree
  //   finie dans sa propre fiche n'y voyait aucune etiquette.
  lFml=_caveFmlEtat(cuv);
  var fmlH='';
  if(lFml==='ok')fmlH='<div style="font-size:var(--pt-lbl,10.5px);font-weight:600;color:#3A8C40;background:rgba(58,140,64,0.12);border-radius:6px;padding:2px 8px;display:inline-block;margin-top:4px;">FML \u2713</div>';
  else if(lFml==='cours')fmlH='<div style="font-size:var(--pt-lbl,10.5px);font-weight:600;color:#B8913A;background:rgba(184,145,58,0.12);border-radius:6px;padding:2px 8px;display:inline-block;margin-top:4px;">FML en cours</div>';
  else if(lFml==='non')fmlH='<div style="font-size:var(--pt-lbl,10.5px);font-weight:600;color:#E07060;background:rgba(224,112,96,0.1);border-radius:6px;padding:2px 8px;display:inline-block;margin-top:4px;">FML non faite</div>';
  var cOps=(CAVE_ELEVAGE.operations||[]).filter(function(op){
    var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
    // ★ ASM-1 — la cuvee ou l'on a puise le voit aussi (§153b).
    return ids.indexOf(cuvId)!==-1||(op.type==='assemblage'&&op.data&&op.data.de_type==='cuvee'&&op.data.de_id===cuvId);
  });
  var cAnas=(CAVE_ELEVAGE.analyses||[]).filter(function(a){
    return Array.isArray(a.cuvee_ids)&&a.cuvee_ids.indexOf(cuvId)!==-1;
  }).map(function(a){return{_src:'ana',type:'analyse',date:a.date_analyse||a.date||'',data:{pdf_url:a.url,pdf_nom:a.nom_fichier},notes:a.commentaire||''};});
  var allIt=cOps.map(function(op){return Object.assign({},op,{_src:'op'});}).concat(cAnas).sort(function(a,b){return a.date>b.date?-1:1;});
  var html='';
  // Stat cards
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">';
  html+='<div style="background:var(--bg-card);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:11px;">';
  html+='<div style="font-size:var(--pt-lbl,10.5px);color:var(--texte-doux);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Ouillage</div>';
  // ⚠️ Sans bois, « Jamais » en rouge serait une alerte inventee.
  if(!ouSuivi){
    html+='<div style="font-size:var(--pt-base,14px);font-weight:600;color:var(--texte-doux);">Sans objet</div>';
    html+='<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:2px;">aucun contenant en bois</div>';
  } else {
    html+='<div style="font-size:var(--pt-base,14px);font-weight:600;color:'+ouC+';">'+ouD+'</div>';
    if(ouS)html+='<div style="font-size:var(--pt-micro,11px);color:'+ouC+';margin-top:2px;">il y a '+ouS+(ouOk?'':' \u26A0')+'</div>';
  }
  html+='</div>';
  html+='<div style="background:var(--bg-card);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:11px;">';
  html+='<div style="font-size:var(--pt-lbl,10.5px);color:var(--texte-doux);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Derni\u00E8re analyse</div>';
  html+='<div style="font-size:var(--pt-base,14px);font-weight:600;color:var(--texte);">'+(lAna?_caveDateFr(lAna.date_analyse):'Aucune')+'</div>'+fmlH;
  if(lPdfUrl)html+='<div style="margin-top:5px;"><button class="cave-pdf-chip" data-url="'+_escHtml(lPdfUrl)+'" onclick="_caveOpenPdf(this)">\uD83D\uDCC4 '+(lPdfNom?_escHtml(lPdfNom):'PDF')+'</button></div>';
  html+='</div>';
  // Le soutirage a lieu plusieurs fois : on montre le DERNIER et le compte,
  // jamais un oui/non. Pleine largeur pour ne pas laisser un demi-trou.
  var soutD=_caveLastSout(cuvId), soutN=_caveSoutOps(cuvId).length;
  html+='<div style="grid-column:1/-1;background:var(--bg-card);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:11px;">';
  html+='<div style="font-size:var(--pt-lbl,10.5px);color:var(--texte-doux);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Dernier soutirage</div>';
  html+='<div style="font-size:var(--pt-base,14px);font-weight:600;color:'+(soutD?'var(--texte)':'var(--texte-doux)')+';">'
    +(soutD?_caveDateFr(soutD):'Aucun enregistr\u00E9')
    +(soutN>1?'<span style="font-size:var(--pt-micro,11px);font-weight:400;color:var(--texte-doux);"> \u00B7 '+soutN+' au total</span>':'')+'</div>';
  html+='</div>';
  html+='</div>';
  // SO2 + AV chips
  if(lSO2L||lSO2T||lAv){
    html+='<div style="display:flex;gap:7px;margin-bottom:12px;flex-wrap:wrap;">';
    if(lSO2L)html+='<div style="background:var(--bg-card);border:1px solid rgba(74,159,200,0.3);border-radius:10px;padding:8px 12px;flex:1;min-width:80px;"><div style="font-size:var(--pt-lbl,10.5px);color:var(--texte-doux);">SO\u2082 libre</div><div style="font-size:var(--pt-sm,17px);font-weight:700;color:var(--ink-info,#4A9FC8);">'+lSO2L+'<span style="font-size:var(--pt-micro,11px);font-weight:400;"> mg/L</span></div></div>';
    if(lSO2T)html+='<div style="background:var(--bg-card);border:1px solid rgba(74,159,200,0.2);border-radius:10px;padding:8px 12px;flex:1;min-width:80px;"><div style="font-size:var(--pt-lbl,10.5px);color:var(--texte-doux);">SO\u2082 total</div><div style="font-size:var(--pt-sm,17px);font-weight:700;color:var(--ink-info,#4A9FC8);">'+lSO2T+'<span style="font-size:var(--pt-micro,11px);font-weight:400;"> mg/L</span></div></div>';
    if(lAv)html+='<div style="background:var(--bg-card);border:1px solid rgba(224,112,96,0.25);border-radius:10px;padding:8px 12px;flex:1;min-width:80px;"><div style="font-size:var(--pt-lbl,10.5px);color:var(--texte-doux);">Ac. volatile</div><div style="font-size:var(--pt-sm,17px);font-weight:700;color:var(--rouge,#E07060);">'+lAv+'<span style="font-size:var(--pt-micro,11px);font-weight:400;"> g/L</span></div></div>';
    html+='</div>';
  }
  // SO2 sparkline
  window._mvGraphOublier('#mvg-so2-');
  var spark=_caveSparkSO2(cuvId, window._mvGraphW(null));
  if(spark) window._mvGraphSuivre('#mvg-so2-'+_mvgId(cuvId), function(lg){ return _caveSparkSO2(cuvId,lg); });
  if(spark) spark='<div id="mvg-so2-'+_mvgId(cuvId)+'"></div>';
  if(spark)html+='<div style="background:var(--bg-card);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:11px;margin-bottom:12px;"><div style="font-size:var(--pt-lbl,10.5px);color:var(--texte-doux);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">'+'\u00C9volution SO\u2082 libre (mg/L)</div>'+spark+'</div>';
  // Journal
  if(allIt.length){
    html+='<div style="font-size:var(--pt-lbl,10.5px);color:var(--texte-doux);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">Journal</div>';
    var tI={ouillage:'seau',soutirage:'rotation',soufre:'eprouvette',analyse:'microscope',retrait_fut:'\uD83D\uDEAA',assemblage:'fiole',autre:'crayon'};
    var tL={ouillage:'Ouillage',soutirage:'Soutirage',soufre:'Soufre',analyse:'Analyse',retrait_fut:'Retrait f\u00FBt',assemblage:'Assemblage',autre:'Autre'};
    allIt.forEach(function(op){
      var ico=_mvIcon(tI[op.type]||'crayon',16),lbl=tL[op.type]||op.type;
      html+='<div style="background:var(--bg-card);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:11px;margin-bottom:7px;">';
      html+='<div style="display:flex;align-items:flex-start;gap:8px;">';
      html+='<span style="font-size:var(--pt-sm,17px);margin-top:1px;">'+ico+'</span>';
      html+='<div style="flex:1;min-width:0;"><div style="font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--texte);">'+lbl+'</div>';
      html+='<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);">'+_caveDateFr(op.date)+(_caveWho(op)?' \u00B7 '+_escHtml(_caveWho(op)):'')+'</div></div>';
      if(op._src==='op'&&typeof isAdmin==='function'&&isAdmin()){
        if(op.type!=='assemblage') html+='<button onclick="window.openOvCaveOp&&window.openOvCaveOp(\''+op.id+'\')" style="background:none;border:none;font-size:var(--pt-txt,12.5px);cursor:pointer;color:var(--texte-doux);padding:2px;min-width:28px;">\u270F\uFE0F</button>';
        html+='<button onclick="window.deleteCaveOp&&window.deleteCaveOp(\''+op.id+'\')" style="background:none;border:none;font-size:var(--pt-txt,12.5px);cursor:pointer;color:#E07060;padding:2px;min-width:28px;">\uD83D\uDDD1</button>';
      }
      html+='</div>';
      var det=[];
      if(op.type==='ouillage'&&op.data&&op.data.nb_ouillettes)det.push(op.data.nb_ouillettes+' ouillettes \u00D7 '+op.data.vol_ouillette_L+'L = '+op.data.vol_total_L+' L');
      if(op.type==='assemblage'&&op.data)det.push((op.data.de_id===cuvId&&op.data.de_type==='cuvee')   // ★ ASM-1
        ? (op.data.litres+'\u00a0L vers\u00e9s dans '+_escHtml(op.data.vers_nom||'une autre cuv\u00e9e'))
        : (op.data.litres+'\u00a0L de '+_escHtml(op.data.de_nom||'une autre cuve')));
      if(op.type==='soufre'&&op.data&&op.data.grammes_pastille)det.push(op.data.grammes_pastille+'g \u00D7 '+op.data.nb_total+' = '+op.data.so2_total_g+' g SO\u2082');
      if(op.type==='soutirage'&&op.data&&op.data.so2&&op.data.so2.mode!=='none'){var ss=op.data.so2;det.push('SO\u2082 '+ss.dose+' '+(ss.unite||'cL')+(ss.mode==='unique'?' dose unique':' \u00D7 '+ss.nb_doses));}
      if(op.type==='analyse'&&op._src==='op'&&op.data){
        if(op.data.so2_libre)det.push('SO\u2082 libre: '+op.data.so2_libre+' mg/L');
        if(op.data.so2_total)det.push('SO\u2082 total: '+op.data.so2_total+' mg/L');
        if(op.data.av)det.push('Ac. volatile: '+op.data.av+' g/L');
        if(op.data.fml&&op.data.fml!=='none'){var ffl={cours:'FML en cours',ok:'FML termin\u00E9e',non:'Pas de FML'};if(ffl[op.data.fml])det.push(ffl[op.data.fml]);}
      }
      if(op.type==='retrait_fut'&&op.data){var _anFut=op.data.annee_fut?(op.data.annee_fut>=new Date().getFullYear()?'neuf':op.data.annee_fut)+' \u00B7 ':'';det.push(op.data.nb_futs+' f\u00FBt'+(op.data.nb_futs>1?'s':'')+' '+_anFut+'retir\u00E9'+(op.data.nb_futs>1?'s':'')+' \u2014 '+(op.data.raison_lbl||''));}
      if(det.length)html+='<div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:5px;line-height:1.5;">'+det.join(' \u00B7 ')+'</div>';
      if(op.notes)html+='<div style="font-size:var(--pt-micro,11px);font-style:italic;color:var(--texte-doux);margin-top:3px;">'+_escHtml(op.notes)+'</div>';
      if(op.type==='analyse'&&op.data&&op.data.pdf_url){
        html+='<div style="display:flex;align-items:center;gap:6px;margin-top:6px;padding:6px 8px;background:rgba(192,132,90,0.06);border-radius:8px;border:1px solid rgba(192,132,90,0.2);">\uD83D\uDCC4 <span style="font-size:var(--pt-micro,11px);color:var(--texte-doux);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_escHtml(op.data.pdf_nom||'rapport.pdf')+'</span>';
        html+='<button class="cave-pdf-chip" data-url="'+_escHtml(op.data.pdf_url)+'" onclick="_caveOpenPdf(this)">Ouvrir</button></div>';
      }
      html+='</div>';
    });
  } else {
    html+='<div style="font-size:var(--pt-txt,12.5px);color:var(--texte-doux);text-align:center;padding:24px 0;">Aucune op\u00E9ration pour cette cuv\u00E9e</div>';
  }
  html+='<div style="height:1px;background:rgba(255,255,255,0.07);margin:12px 0;"></div>';
  html+=_caveContenantsSectionHtml(cuv);
  html+='<button onclick="window.openOvRetraitFut&&window.openOvRetraitFut(\''+cuv.id+'\')" style="width:100%;padding:10px;border:1px solid rgba(139,32,32,0.3);border-radius:10px;background:rgba(139,32,32,0.06);font-size:var(--pt-txt,12.5px);font-weight:500;color:#8B2020;cursor:pointer;min-height:44px;font-family:Outfit,sans-serif;margin-bottom:6px;">\uD83D\uDEAA Retirer un f\u00FCt</button>';
  if(typeof isAdmin==='function'&&isAdmin()){
    html+='<div style="display:flex;gap:8px;">';
    html+='<button onclick="closeOv(null,\'ovCuveeDetail\');openOvCavee(\''+cuv.id+'\')" class="mbtn" style="flex:1;background:rgba(192,132,90,0.12);color:#C0845A;border-color:rgba(192,132,90,0.3);">\u270F\uFE0F Modifier</button>';
    html+='<button onclick="closeOv(null,\'ovCuveeDetail\');deleteCuveeById(\''+cuv.id+'\')" style="padding:10px 14px;border:1px solid rgba(224,112,96,0.3);border-radius:10px;background:rgba(224,112,96,0.08);font-size:var(--pt-txt,12.5px);color:#E07060;cursor:pointer;min-height:44px;">\uD83D\uDDD1</button>';
    html+='</div>';
  }
  bodyEl.innerHTML=html;
  if(window._mvGraphRepeindre) window._mvGraphRepeindre();
  var ov3=document.getElementById('ovCuveeDetail');if(ov3)ov3.classList.add('open');
}


function deleteCuveeById(cuvId) {
  window.openConfirmDel('Supprimer cette cuvée ?','Toutes ses opérations seront également supprimées.',function(){
    var existId=cuvId;
    CAVE_ELEVAGE.cuvees=CAVE_ELEVAGE.cuvees.filter(function(c){return c.id!==existId;});
    CAVE_ELEVAGE.operations=CAVE_ELEVAGE.operations.filter(function(o){return o.cuvee_id!==existId;});
    window.CAVE_ELEVAGE=CAVE_ELEVAGE;
    window.fbSaveToast({cave_elevage:CAVE_ELEVAGE},'Cuv\u00E9e supprim\u00E9e','#B85A1A');
    renderCave();
  });
}

// \u2500\u2500 Edit analyse metadata \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
var _editAnaId=null;
var _editAnaSelIds=[];


function _toggleEditAnaChip(cuvId) {
  var idx=_editAnaSelIds.indexOf(cuvId);
  if(idx===-1) _editAnaSelIds.push(cuvId);
  else _editAnaSelIds.splice(idx,1);
  // Re-render chips
  var wrap=document.getElementById('cana-edit-cuv-chips');
  if(wrap) {
    wrap.innerHTML=CAVE_ELEVAGE.cuvees.map(function(c){
      var sel=_editAnaSelIds.indexOf(c.id)!==-1;
      return '<button onclick="_toggleEditAnaChip(\''+c.id+'\')" style="padding:7px 11px;border-radius:10px;border:1px solid '+(sel?'rgba(192,132,90,0.5)':'rgba(255,255,255,0.1)')+';background:'+(sel?'rgba(192,132,90,0.14)':'rgba(255,255,255,0.04)')+';font-size:var(--pt-micro,11px);color:'+(sel?'#C0845A':'var(--texte-doux)')+';cursor:pointer;min-height:44px;font-weight:'+(sel?'500':'400')+';">'+_escHtml(c.nom+(c.millesime?' '+c.millesime:''))+'</button>';
    }).join('');
  }
  _updateEditAnaHint();
}

function _updateEditAnaHint() {
  var hint=document.getElementById('cana-edit-cuv-hint');
  if(hint) hint.textContent=_editAnaSelIds.length?_editAnaSelIds.length+' cuv\u00E9e'+(_editAnaSelIds.length>1?'s':'')+' s\u00E9lectionn\u00E9e'+(_editAnaSelIds.length>1?'s':''):'';
}

function saveCaveAnaEdit() {
  if(!_editAnaId) return;
  if(!_editAnaSelIds.length){showToast('S\u00E9lectionnez au moins une cuv\u00E9e','#E07060');return;}
  var idx=(CAVE_ELEVAGE.analyses||[]).findIndex(function(a){return a.id===_editAnaId;});
  if(idx===-1) return;
  var date=(document.getElementById('cana-edit-date')||{}).value||CAVE_ELEVAGE.analyses[idx].date_analyse;
  var type=(document.getElementById('cana-edit-type')||{}).value||CAVE_ELEVAGE.analyses[idx].type;
  var commentaire=((document.getElementById('cana-edit-commentaire')||{}).value||'').trim();
  Object.assign(CAVE_ELEVAGE.analyses[idx],{date_analyse:date,type:type,cuvee_ids:_editAnaSelIds.slice(),commentaire:commentaire});
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  window.fbSaveToast({cave_elevage:CAVE_ELEVAGE},'Analyse mise \u00E0 jour','#3D6B27');
  window.closeOv(null,'ovCaveAnaEdit');
  renderCave();
}

// \u2500\u2500 FIN CAVE \u00C9LEVAGE \u2500\u2500

// \u2550\u2550\u2550\u2550 EXPOSITION GLOBALE \u2550\u2550\u2550\u2550
window.CAVE_ELEVAGE         = CAVE_ELEVAGE;
window.toggleCopInt          = toggleCopInt;
window.renderCave           = renderCave;
window.selectCaveSection    = selectCaveSection;
window.switchCaveOng        = switchCaveOng;
window.openOvCaveOp         = openOvCaveOp;
window.saveCaveOp           = saveCaveOp;
window.selCaveOpType        = selCaveOpType;
window.selCaveFml           = selCaveFml;
window._cuvToggle           = _cuvToggle;
window.openOvCavee          = openOvCavee;
window.toggleCopAllCuv      = toggleCopAllCuv;
// Appelee depuis un onclick inline du rang de millesimes : sans cet export,
// le build IIFE la rend invisible et le bouton ne fait rien, en silence.
window.selCopMil           = selCopMil;
window.toggleCopCuvee       = toggleCopCuvee;
window.adjCopOuillette      = adjCopOuillette;
window.updateCopOuillageCalc= updateCopOuillageCalc;
window.setCopSo2Mode        = setCopSo2Mode;
window.setCopSo2Nb          = setCopSo2Nb;
window.setCopSo2Freq        = setCopSo2Freq;
window._copUpdateOpDate     = _copUpdateOpDate;
window.saveCuvee            = saveCuvee;
window.deleteCuvee          = deleteCuvee;

function deleteCaveOp(opId) {
  if(!isAdmin())return;
  // ★ ASM-1 — supprimer un assemblage le defait (§153b).
  var _op=(CAVE_ELEVAGE.operations||[]).find(function(o){ return o&&o.id===opId; });
  var _asm=!!(_op&&_op.type==='assemblage');
  window.openConfirmDel(_asm?'D\u00e9faire cet assemblage ?':'Supprimer cette opération ?',
    _asm?'Le f\u00fbt redevient entam\u00e9, et le vin retourne \u00e0 sa source.':'',function(){
    if(_asm) _asmDefaire(_op);
    CAVE_ELEVAGE.operations=CAVE_ELEVAGE.operations.filter(function(o){return o.id!==opId;});
    window.CAVE_ELEVAGE=CAVE_ELEVAGE;
    if(_asm){ window.CAVE_VENDANGE=CAVE_VENDANGE;
      window.fbSaveToast({cave_elevage:CAVE_ELEVAGE, cave_vendange:CAVE_VENDANGE},'Assemblage d\u00e9fait','#3D6B27'); }
    else window.fbSaveToast({cave_elevage:CAVE_ELEVAGE},'Op\u00E9ration supprim\u00E9e','#3D6B27');
    renderCave();
  },null,_asm?'D\u00e9faire':undefined);
}

window.openOvCaveExport = function() {
  if(!isAdmin())return;
  _caveExpAllCuv=true;
  _caveExpCuvSel=new Set();
  _caveExpTypes=new Set(['ouillage','soutirage','soufre','analyse','autre']);
  _renderCaveExpCuvChips();
  ['ouillage','soutirage','soufre','analyse','autre'].forEach(function(t){
    var el=document.getElementById('cexp-type-'+t);if(el)el.checked=true;
  });
  var d=document.getElementById('cexp-date-deb');if(d)d.value='';
  var f=document.getElementById('cexp-date-fin');if(f)f.value='';
  var g=document.getElementById('cexp-group-date');if(g)g.checked=true;
  var ov=document.getElementById('ovCaveExport');if(ov)ov.classList.add('open');
}

function _renderCaveExpCuvChips() {
  var el=document.getElementById('cexp-cuv-chips');if(!el)return;
  var cuvees=CAVE_ELEVAGE.cuvees||[];
  var h='<button class="cave-cuvee-chip'+(_caveExpAllCuv?' sel':'')+'" onclick="window._caveExpToggleCuv(null)">Toutes</button>';
  cuvees.forEach(function(c){
    var _eid='cexp-cuv-'+c.id;
    h+='<button id="'+_eid+'" class="cave-cuvee-chip'+(!_caveExpAllCuv&&_caveExpCuvSel.has(c.id)?' sel':'')+'" data-cuv-id="'+c.id+'" onclick="window._caveExpToggleCuvById(this)">'+c.nom+(c.millesime?' '+c.millesime:'')+'</button>';
  });
  el.innerHTML=h;
}

function _caveExpToggleCuvById(el) {
  var id=el.dataset.cuvId||null;
  _caveExpToggleCuv(id);
}

function _caveExpToggleCuv(id) {
  if(id===null){_caveExpAllCuv=true;_caveExpCuvSel=new Set();}
  else{
    _caveExpAllCuv=false;
    if(_caveExpCuvSel.has(id))_caveExpCuvSel.delete(id);
    else _caveExpCuvSel.add(id);
    if(_caveExpCuvSel.size===0)_caveExpAllCuv=true;
  }
  _renderCaveExpCuvChips();
}

function _caveExpToggleType(type) {
  if(_caveExpTypes.has(type))_caveExpTypes.delete(type);
  else _caveExpTypes.add(type);
}

function _caveExpCuvLabelTxt(op) {
  var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
  var cuv=CAVE_ELEVAGE.cuvees||[];
  if(!ids.length)return'Toutes cuv\u00E9es';
  if(ids.length===cuv.length)return'Toutes cuv\u00E9es';
  return ids.map(function(id){var c=cuv.find(function(x){return x.id===id;});return c?c.nom+(c.millesime?' '+c.millesime:''):id;}).join(', ');
}

function generateCaveExport() {
  if(!isAdmin())return;
  var ops=(CAVE_ELEVAGE.operations||[]).map(function(o){return Object.assign({},o,{_src:'op'});});
  var anas=(CAVE_ELEVAGE.analyses||[]).map(function(a){return{_src:'ana',id:a.id,type:'analyse',date:a.date||a.date_analyse,cuvees_ids:a.cuvee_ids||[],operateur:a.uploaded_by||'',notes:a.commentaire||'',data:{label:a.type,fichier:a.nom_fichier,url:a.url}};});
  var all=ops.concat(anas);
  if(!_caveExpAllCuv&&_caveExpCuvSel.size>0){
    all=all.filter(function(op){
      var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
      return ids.some(function(id){return _caveExpCuvSel.has(id);});
    });
  }
  all=all.filter(function(op){return _caveExpTypes.has(op.type);});
  var deb=(document.getElementById('cexp-date-deb')||{}).value||'';
  var fin=(document.getElementById('cexp-date-fin')||{}).value||'';
  if(deb)all=all.filter(function(op){return op.date>=deb;});
  if(fin)all=all.filter(function(op){return op.date<=fin;});
  if(!all.length){showToast('Aucune op\u00E9ration avec ces filtres','#B85A1A');return;}
  all.sort(function(a,b){return a.date>b.date?1:-1;});
  var groupByCuv=(document.getElementById('cexp-group-cuv')||{}).checked;
  var domNom=window.DOMAINE_NOM||'Ma Vigne';
  var now=new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});

  function _opDetail(op){
    var lines=[];
    if(op.type==='ouillage'&&op.data&&op.data.nb_ouillettes)
      lines.push(op.data.nb_ouillettes+' ouillettes \u00D7 '+op.data.vol_ouillette_L+'L = '+op.data.vol_total_L+' L'+(op.data.vol_par_fut_L?' \u00B7 '+op.data.vol_par_fut_L+' L/f\u00FBt':''));
    if(op.type==='soutirage'&&op.data&&op.data.so2&&op.data.so2.mode!=='none'){
      var s=op.data.so2,str='SO\u2082 ';
      if(s.dose)str+=s.dose+' '+(s.unite||'cL')+' ';
      if(s.mode==='unique')str+='\u00B7 dose unique';
      else if(s.mode==='recurrent')str+='\u00D7 '+s.nb_doses+' / '+s.freq_j+' j';
      lines.push(str);
    }
    if(op.type==='soufre'&&op.data)
      lines.push(op.data.grammes_pastille+'g \u00B7 '+op.data.nb_total+' pastilles = '+op.data.so2_total_g+' g SO\u2082');
    if(op.type==='analyse'&&op.data&&op._src==='op'){
      var parts=[];
      if(op.data.so2_libre)parts.push('SO\u2082 libre: '+op.data.so2_libre+' mg/L');
      if(op.data.so2_total)parts.push('SO\u2082 total: '+op.data.so2_total+' mg/L');
      if(op.data.av)parts.push('Ac. volatile: '+op.data.av+' g/L');
      if(op.data.fml&&op.data.fml!=='none'){var fl={cours:'FML en cours',ok:'FML termin\u00E9e',non:'Pas de FML'}[op.data.fml]||'';if(fl)parts.push(fl);}
      if(parts.length)lines.push(parts.join(' \u00B7 '));
      if(op.data.pdf_nom)lines.push(op.data.pdf_nom);
    }
    if(op.type==='analyse'&&op._src==='ana'&&op.data){
      if(op.data.label)lines.push(op.data.label);
      if(op.data.fichier)lines.push(op.data.fichier);
    }
    if(op.notes)lines.push('<em>'+_escHtml(op.notes)+'</em>');
    return lines.map(function(l){return _escHtml(l.replace(/<em>|<\/em>/g,''));}).join('<br>');
  }

  var typeColors={ouillage:'#7B4A1A',soutirage:'#1A5E36',soufre:'#1A5E1A',analyse:'#1D4E89',autre:'#444'};
  var typeIcos={ouillage:'seau',soutirage:'rotation',soufre:'eprouvette',analyse:'microscope',autre:'crayon'};
  var typeLabels={ouillage:'Ouillage',soutirage:'Soutirage',soufre:'Soufre',analyse:'Analyse',autre:'Autre'};

  function _opRow(op){
    var tc=typeColors[op.type]||'#444';
    var ti=typeIcos[op.type]||'';
    var tl=typeLabels[op.type]||op.type;
    return '<tr><td style="padding:7px 10px;white-space:nowrap;color:var(--texte-doux,#666);font-size:var(--pt-txt,12.5px);vertical-align:top;">'+_caveDateFr(op.date)+'</td>'
      +'<td style="padding:7px 10px;vertical-align:top;"><span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:var(--pt-micro,11px);font-weight:600;color:'+tc+';background:'+tc+'22;">'+ti+' '+tl+'</span></td>'
      +'<td style="padding:7px 10px;vertical-align:top;font-size:var(--pt-txt,12.5px);color:var(--texte,#333);">'+_escHtml(_caveExpCuvLabelTxt(op))+'</td>'
      +'<td style="padding:7px 10px;vertical-align:top;font-size:var(--pt-txt,12.5px);color:var(--texte-doux,#666);">'+_escHtml(_caveWho(op))+'</td>'
      +'<td style="padding:7px 10px;vertical-align:top;font-size:var(--pt-micro,11px);color:var(--texte-med,#555);line-height:1.5;">'+_opDetail(op)+'</td>'
      +'</tr>';
  }

  var rows='';
  if(groupByCuv){
    var grps={};
    all.forEach(function(op){
      var ids=op.cuvees_ids||(op.cuvee_id?[op.cuvee_id]:[]);
      if(!ids.length)ids=['_none'];
      ids.forEach(function(id){if(!grps[id])grps[id]=[];grps[id].push(op);});
    });
    var cuvs=CAVE_ELEVAGE.cuvees||[];
    var sortedIds=Object.keys(grps).sort(function(a,b){
      var ca=cuvs.find(function(c){return c.id===a;}),cb=cuvs.find(function(c){return c.id===b;});
      return (ca?ca.nom:'').localeCompare(cb?cb.nom:'','fr');
    });
    sortedIds.forEach(function(cid){
      var cuv=cuvs.find(function(c){return c.id===cid;});
      var cNom=cuv?cuv.nom+(cuv.millesime?' '+cuv.millesime:''):'Autres';
      rows+='<tr><td colspan="5" style="padding:10px 10px 5px;background:#f5f0e8;font-weight:700;font-size:var(--pt-txt,12.5px);color:#3A2A0E;border-top:2px solid #C8A060;">\uD83C\uDF77 '+_escHtml(cNom)+'</td></tr>';
      grps[cid].forEach(function(op){rows+=_opRow(op);});
    });
  } else {
    rows=all.map(_opRow).join('');
  }

  var typeLabelsAll={ouillage:'Ouillage',soutirage:'Soutirage',soufre:'Soufre',analyse:'Analyse',autre:'Autre'};
  var typeFiltLbl=_caveExpTypes.size===5?'Tous types':Array.from(_caveExpTypes).map(function(t){return typeLabelsAll[t]||t;}).join(', ');
  var cuvFiltLbl=_caveExpAllCuv?'Toutes cuv\u00E9es':Array.from(_caveExpCuvSel).map(function(id){var c=(CAVE_ELEVAGE.cuvees||[]).find(function(x){return x.id===id;});return c?c.nom+(c.millesime?' '+c.millesime:''):id;}).join(', ');
  var perFiltLbl=(deb||fin)?((deb?_caveDateFr(deb):'-')+' \u2192 '+(fin?_caveDateFr(fin):'-')):'Toutes dates';

  var css=(
    '*{box-sizing:border-box;margin:0;padding:0;}'
    +'h1{font-size:var(--pt-md,20px);font-weight:700;color:#1A0E05;margin-bottom:3px;}'
    +'.sub{font-size:var(--pt-txt,12.5px);color:#7B4A1A;font-weight:600;margin-bottom:12px;}'
    +'.meta{font-size:var(--pt-micro,11px);color:#999;margin-bottom:16px;}'
    +'.filters{display:flex;gap:24px;flex-wrap:wrap;background:#FAF5EE;border:1px solid #E8D5B0;border-radius:8px;padding:9px 14px;margin-bottom:18px;}'
    +'.fi strong{display:block;font-size:var(--pt-nano,9.5px);text-transform:uppercase;letter-spacing:.5px;color:#8B6020;margin-bottom:2px;}'
    +'.fi{font-size:var(--pt-micro,11px);color:#5A3A10;}'
    +'table{width:100%;border-collapse:collapse;font-size:var(--pt-txt,12.5px);}'
    +'th{text-align:left;padding:8px 10px;background:#2D1B09;color:#F5E6CC;font-size:var(--pt-lbl,10.5px);text-transform:uppercase;letter-spacing:.6px;}'
    +'td{border-bottom:1px solid #EEE;}'
    +'tr:nth-child(even) td{background:#FAFAFA;}'
    +'.footer{margin-top:16px;font-size:var(--pt-lbl,10.5px);color:#BBB;text-align:right;border-top:1px solid #EEE;padding-top:8px;}'
    +''
  );

  if(typeof window._mvDocOpen!=='function'){ showToast('Mise \u00e0 jour incompl\u00e8te \u2014 rechargez l\u2019application','#B85A1A'); return; }
  var corps='<div class="filters">'
    +'<div class="fi"><strong>Cuv\u00E9es</strong>'+_escHtml(cuvFiltLbl)+'</div>'
    +'<div class="fi"><strong>Types</strong>'+_escHtml(typeFiltLbl)+'</div>'
    +'<div class="fi"><strong>P\u00E9riode</strong>'+_escHtml(perFiltLbl)+'</div>'
    +'<div class="fi"><strong>Regroupement</strong>'+(groupByCuv?'Par cuv\u00E9e':'Chronologique')+'</div>'
    +'</div>'
    +'<table><thead><tr><th>Date</th><th>Type</th><th>Cuv\u00E9e(s)</th><th>Op\u00E9rateur</th><th>D\u00E9tails</th></tr></thead><tbody>'+rows+'</tbody></table>';
  window._mvDocOpen({
    titre:'Rapport d\u2019op\u00E9rations \u2014 cave', domaine:domNom, orient:'paysage', cat:'cave',
    metas:['\u00c9dit\u00e9 le '+now, all.length+' op\u00E9ration'+(all.length>1?'s':'')],
    corps:corps, css:css
  });
  window.closeOv(null,'ovCaveExport');
}

var _retraitFutCuvId=null,_retraitFutNb=1,_retraitFutRaison='vente',_retraitFutAnnee=null;
// ★ FUT-CAP — la LIGNE choisie, pas son annee : deux lignes peuvent partager une
//   annee (deux tonneliers, ou une piece et un demi-muid), et l'annee prenait la premiere.
var _retraitFutIdx=-1;
// Sort du CONTENANT apres retrait : true = le fut revient au parc a futs.
var _retraitFutGarder=true;

// ══ AFFECTER UNE CUVE A UNE CUVEE ═════════════════════════════════════════
// La feuille vit dans #cuvd-body, l'overlay de la fiche cuvee : ajouter une
// cuve ne merite pas un overlay de plus dans index.html.
var _caveAffCuv=null, _caveAffRef=null, _caveAffL=0;

// La liste des contenants d'une cuvee, dans sa fiche.
function _caveContenantsSectionHtml(cuv){
  var w=(typeof canWrite==='function')?canWrite():true;
  var n=_caveNbTonneaux(cuv);
  var h='<div class="mvc-aff-sec">Contenants</div>';
  // ★ FUT-CAP — une ligne par contenance : « 4 futs de 228 L », « 1 fut de 500 L ».
  // ★ ASM-1 — le dernier lot porte le fut entame (§20e, §153b).
  var _G=n?_caveGroupesL(cuv):[], _m=_caveManqueL(cuv);
  _G.forEach(function(g,gi){
    var cr=(_m>0&&gi===_G.length-1), un=cr&&_m<g.l, bt=cr&&w;
    h+=(bt?'<button type="button" class="mvc-pk mvc-pk-creux" onclick="_asmOuvrir(\''+_escAttr(cuv.id)+'\')">'
          :'<div class="mvc-pk'+(cr?' mvc-pk-creux':'')+'">')
      +'<span class="mvc-pk-ic bois">'+_mvIcon('barrique',18)+'</span>'
      +'<span class="mvc-pk-b"><span class="mvc-pk-n">'+g.nb+' f\u00fbt'+(g.nb>1?'s':'')+' de '+_caveLTxt(g.l)+'\u00a0L'
      +(_caveHorsFormat(g.l)?'<span class="mvc-dhf">hors format</span>':'')+'</span>'
      +'<span class="mvc-pk-m">'+(g.rep||'r\u00e9partition non pr\u00e9cis\u00e9e')
      +(cr?(' \u00b7 <b>'+(un?'entam\u00e9':'pas pleins')+'</b>'+(un?'\u00a0: '+_caveLTxt(g.l-_m)+'\u00a0L sur '+_caveLTxt(g.l):'')):'')+'</span>'
      +(un?'<span class="mvc-pk-fill"><i class="bois" style="width:'+Math.round((g.l-_m)*100/g.l)+'%"></i></span>':'')
      +'</span>'
      +'<span class="mvc-pk-r"><span class="mvc-pk-cap">'+_mvF1((g.nb*g.l-(cr?_m:0))/100)+'<span class="u">hL</span></span>'
      +(cr?'<span class="mvc-pk-att">attend '+_m+'\u00a0L</span>':'')+'</span>'
      +(bt?'</button>':'</div>');
  });
  ((cuv&&cuv.cuves)||[]).forEach(function(x){
    var p=_caveCuve(x&&x.ref), L=parseFloat(x&&x.litres)||0;
    var nom=p?(p.nom||'Cuve'):'Cuve retir\u00e9e du parc';
    var sub=p?(_caveMat(p.matiere).lbl+' \u00b7 contenance '+_mvF1((parseFloat(p.litres)||0)/100)+' hL')
            :'contenant inconnu \u2014 le volume, lui, est conserv\u00e9';
    var pct=(p&&parseFloat(p.litres)>0)?Math.min(100,Math.round(L*100/parseFloat(p.litres))):0;
    h+='<div class="mvc-pk"><span class="mvc-pk-ic '+(p?_caveMatKey(p.matiere):'inox')+'">'+_mvIcon('cuve',18)+'</span>'
      +'<span class="mvc-pk-b"><span class="mvc-pk-n">'+_escHtml(nom)+'</span>'
      +'<span class="mvc-pk-m">'+_escHtml(sub)+'</span>'
      +(p?'<span class="mvc-pk-fill"><i class="'+(_caveMatKey(p.matiere)==='bois'?'bois':'')+'" style="width:'+pct+'%"></i></span>':'')
      +'</span>'
      +'<span class="mvc-pk-r"><span class="mvc-pk-cap">'+_mvF1(L/100)+'<span class="u">hL</span></span>'
      +(w?'<button type="button" class="mvc-aff-x" onclick="_caveAffRetirer(\'' + _escAttr(cuv.id) + '\',\'' + _escAttr(String(x&&x.ref||'')) + '\')">Retirer</button>':'')
      +'</span></div>';
  });
  if(!n && !((cuv&&cuv.cuves)||[]).length)
    h+='<div class="mvc-pk-vide">Aucun contenant. Ajoutez des f\u00fbts ou une cuve.</div>';
  if(w) h+='<button type="button" class="mvc-aff-add" onclick="_caveAffOpen(\'' + _escAttr(cuv.id) + '\')">+ Ajouter une cuve</button>';
  return h;
}

/* ★★★ ASM-1 — COMPLETER UN FUT ENTAME. ⚠️ _asmValider ne relit pas le DOM (§153b). */
var _asmCuv=null, _asmSrc=null, _asmL=0, _ASM_GID=0;
function _asmCuvee(id){
  return ((CAVE_ELEVAGE&&CAVE_ELEVAGE.cuvees)||[]).find(function(x){ return x&&x.id===id; })||null;
}
// Les appellations d'une cuve du Cuvier : celles des parcelles de ses caisses.
function _asmAocsCuve(cv){
  var vus={}, out=[];
  ((CAVE_VENDANGE&&CAVE_VENDANGE.recoltes)||[]).forEach(function(r){
    if(!r||!cv||r.cuve_id!==cv.id) return;
    var p=_vendParcByName(r.parcelle), a=(p&&p.appellation)?String(p.appellation).trim():'';
    if(a&&!vus[a.toLowerCase()]){ vus[a.toLowerCase()]=1; out.push(a); }
  });
  return out;
}
function _asmAocsCuvee(cu){ var cv=_caveCuveSource(cu); return cv?_asmAocsCuve(cv):[]; }
// La cuve d'une cuvee du Chai ou l'on puise : celle qui a le plus de vin (-1 : aucune).
function _asmIdxCuve(cu){
  var k=-1, best=0;
  ((cu&&cu.cuves)||[]).forEach(function(x,i){ var l=parseFloat(x&&x.litres)||0; if(l>best){ best=l; k=i; } });
  return k;
}
// Sources : Cuvier (meme non decuvees), puis Chai en elevage.
function _asmSources(cu){
  var out=[];
  ((CAVE_VENDANGE&&CAVE_VENDANGE.cuves_vinif)||[]).forEach(function(c){
    if(!c||_vendDecuvee(c)||_vendEstFusionnee(c)||c.statut==='setup'||c.statut==='termine') return;
    var v=_vendVolContenu(c); if(!(v.hl>0)) return;
    var vin=c.cuvee_src?String(c.cuvee_src):'';
    out.push({k:'cuve:'+c.id, type:'cuve', grp:'cuvier', id:c.id,
      nom:(c.nom||'Cuve')+(vin?' \u00b7 '+vin:''), lbl:(c.nom||'Cuve')+(vin?' ('+vin+')':''),
      meta:_vendStatLbl(c.statut)+' \u00b7 environ '+_vendCuvF1(v.hl)+'\u00a0hL dedans',
      hl:v.hl, mil:_rmMilCuve(CAVE_VENDANGE,c.id), aocs:_asmAocsCuve(c), futs:false, cuveL:0});
  });
  ((CAVE_ELEVAGE&&CAVE_ELEVAGE.cuvees)||[]).forEach(function(x){
    if(!x||!cu||x.id===cu.id||x.statut==='embouteille') return;
    var hl=_caveVolHl(x); if(!(hl>0)) return;
    var k=_asmIdxCuve(x), nm=(x.nom||'Cuv\u00e9e')+(x.millesime?' '+x.millesime:'');
    out.push({k:'cuvee:'+x.id, type:'cuvee', grp:'chai', id:x.id, nom:nm, lbl:nm,
      meta:(_caveContenantsHtml(x)||'')+' \u00b7 '+_mvF1(hl)+'\u00a0hL',
      hl:(k>=0?(parseFloat(x.cuves[k].litres)||0)/100:hl), mil:(x.millesime!=null?x.millesime:null),
      aocs:_asmAocsCuvee(x), futs:(k<0), cuveL:(k>=0?(parseFloat(x.cuves[k].litres)||0):0)});
  });
  return out;
}
// Un fut dessine, rempli a pct % — un identifiant de decoupe par dessin (§153, le degrade).
function _asmFutSvg(pct){
  var p=Math.max(0,Math.min(100,pct||0)), id='mvfc'+(++_ASM_GID);
  return '<svg class="mvc-creux-f" width="26" height="30" viewBox="0 0 26 30" aria-hidden="true">'
    +'<defs><clipPath id="'+id+'"><path d="M4 3h18c2 4 2 20 0 24H4C2 23 2 7 4 3z"/></clipPath></defs>'
    +'<path d="M4 3h18c2 4 2 20 0 24H4C2 23 2 7 4 3z" fill="var(--bg-card)" stroke="var(--terre)" stroke-width="1.4"/>'
    +'<rect x="0" y="'+(3+24*(1-p/100)).toFixed(1)+'" width="26" height="30" fill="var(--terre)" opacity=".55" clip-path="url(#'+id+')"/>'
    +'<path d="M3 9h20M3 21h20" stroke="var(--terre)" stroke-width="1" opacity=".5"/></svg>';
}
// Sur la carte du Chai : le fut entame (touchable) et la composition.
function _asmCarteHtml(c,w){
  if(!c||c.statut==='embouteille') return '';
  var h='', m=_caveManqueL(c);
  if(m>0){
    var G=_caveGroupesL(c), g=G.length?G[G.length-1]:null, un=!!(g&&m<g.l);
    var t='<span class="mvc-creux-t"><b>'+(un?'1 f\u00fbt entam\u00e9':'F\u00fbts pas pleins')+'</b><span>'
      +(un?(_caveLTxt(g.l-m)+'\u00a0L sur '+_caveLTxt(g.l)+' \u00b7 il attend '):'ils attendent ')+m+'\u00a0L</span></span>';
    var f=_asmFutSvg(un?Math.round((g.l-m)*100/g.l):0);
    h+=w
      ? '<button type="button" class="mvc-creux" onclick="event.stopPropagation();_asmOuvrir(\''+_escAttr(c.id)+'\')">'+f+t
        +'<span class="mvc-creux-go">Compl\u00e9ter <span class="mvc-creux-ch">'+_mvIcon('chevron',16)+'</span></span></button>'
      : '<div class="mvc-creux">'+f+t+'</div>';
  }
  var ap=c.apports||[];
  if(ap.length){
    var L=ap.reduce(function(s,a){ return s+(parseFloat(a&&a.l)||0); },0), tot=_caveVolL(c);
    h+='<div class="mvc-compo">'+_mvIcon('fiole',16)+' dont <b>'+L+'\u00a0L '
      +(ap.length===1?('de '+_escHtml(ap[0].de||'une autre cuve')):'d\u2019apports')+'</b>'
      +(tot>0?' \u00b7 '+Math.round(L*100/tot)+'\u00a0%':'')+'</div>';
  }
  return h;
}
function _asmFutTxt(cu,m){
  var G=_caveGroupesL(cu), g=G.length?G[G.length-1]:null;
  if(g&&m<g.l) return 'le f\u00fbt de '+_caveLTxt(g.l)+'\u00a0L contient '+_caveLTxt(g.l-m)+'\u00a0L\u00a0: il attend <b>'+m+'\u00a0L</b>.';
  return 'ses f\u00fbts attendent <b>'+m+'\u00a0L</b>.';
}
function _asmOuvrir(cuvId){
  if(typeof canWrite==='function'&&!canWrite()){ showToast('Acc\u00e8s lecture seule','#B85A1A'); return; }
  var cu=_asmCuvee(cuvId); if(!cu) return;
  var m=_caveManqueL(cu);
  if(!(m>0)){ showToast('Les f\u00fbts de cette cuv\u00e9e sont pleins','#3D6B27'); return; }
  var S=_asmSources(cu);
  _asmCuv=cuvId; _asmL=m; _asmSrc=S.length?S[0].k:null;
  // ⚠️ Les styles du Cuvier : sans eux, le bouton sortait brut (§153e).
  _caveV2InjectCss(); _vendInjectCss();
  var ligne=function(s){
    var bois=(s.type==='cuvee'&&s.futs);
    return '<button type="button" class="mvc-pk mvc-aff-c'+(s.k===_asmSrc?' sel':'')+'" data-asm="'+_escHtml(s.k)+'" onclick="_asmChoisir(\''+_escAttr(s.k)+'\')">'
      +'<span class="mvc-aff-rad"></span><span class="mvc-pk-ic '+(bois?'bois':'inox')+'">'+_mvIcon(bois?'barrique':'cuve',18)+'</span>'
      +'<span class="mvc-pk-b"><span class="mvc-pk-n">'+_escHtml(s.nom)+'</span><span class="mvc-pk-m">'+s.meta+'</span>'
      +(s.aocs.length?'<span class="mvc-pk-m mvv-asm-aoc">'+_escHtml(s.aocs.join(', '))+'</span>':'')+'</span></button>';
  };
  var cv=S.filter(function(s){ return s.grp==='cuvier'; }), ch=S.filter(function(s){ return s.grp==='chai'; });
  _vendSheet('<div class="mvv-sheet-hd"><div class="mvv-sheet-t">Compl\u00e9ter le f\u00fbt</div>'
    +'<button class="mv-gh mvv-sheet-x" onclick="_vendSheetClose()" title="Fermer" aria-label="Fermer">'+_mvIcon('croix',18)+'</button></div>'
    +'<div class="mvv-sheet-sub">'+_escHtml((cu.nom||'')+(cu.millesime?' '+cu.millesime:''))+' \u2014 '+_asmFutTxt(cu,m)+'</div>'
    +'<label class="mvv-flbl">D\u2019o\u00f9 vient le vin</label>'
    +(cv.length?'<div class="mvv-asm-grp">Au Cuvier \u2014 m\u00eame pas encore d\u00e9cuv\u00e9e</div>'+cv.map(ligne).join(''):'')
    +(ch.length?'<div class="mvv-asm-grp">Au Chai</div>'+ch.map(ligne).join(''):'')
    +(S.length?'':'<div class="mvcs-empty">Aucune cuve du Cuvier ni cuv\u00e9e du Chai n\u2019a de vin \u00e0 verser.</div>')
    +'<label class="mvv-flbl">Litres vers\u00e9s <span class="mvv-fhint">(le f\u00fbt en attend '+m+')</span></label>'
    +'<div class="mvv-step2"><button type="button" class="mvv-step2-b" onclick="_asmPas(-5)" aria-label="5 litres de moins">\u2212</button>'
    +'<input id="asm-l" class="mvv-tin mvv-asm-l" type="number" inputmode="numeric" min="1" max="'+m+'" step="1" value="'+m+'" oninput="_asmSaisie()">'
    +'<button type="button" class="mvv-step2-b" onclick="_asmPas(5)" aria-label="5 litres de plus">+</button><span class="mvv-step2-u">litres</span></div>'
    +'<div id="asm-prev"></div>'
    +'<button class="mvv-save" id="asm-go" style="margin-top:16px" onclick="_asmValider()">Compl\u00e9ter le f\u00fbt</button>'
    +'<div class="mvv-fnote">L\u2019application ne tranche pas ce que la r\u00e9glementation permet (appellation, mill\u00e9sime)\u00a0: '
    +'elle \u00e9crit la composition, et le registre des manipulations la garde.</div>');
  _asmApercu();
}
function _asmChoisir(k){
  _asmSrc=k;
  document.querySelectorAll('#mvv-ov [data-asm]').forEach(function(b){ b.classList.toggle('sel', b.getAttribute('data-asm')===k); });
  _asmApercu();
}
function _asmPas(d){
  var cu=_asmCuvee(_asmCuv); if(!cu) return;
  _asmL=Math.max(1,Math.min(_caveManqueL(cu),Math.round((_asmL||0)+d)));
  var el=document.getElementById('asm-l'); if(el) el.value=_asmL;
  _asmApercu();
}
function _asmSaisie(){
  var v=Math.round(parseFloat((document.getElementById('asm-l')||{}).value));
  _asmL=isFinite(v)?v:0; _asmApercu();
}
// Ce qui empeche d'ecrire, en mots ('' : rien).
function _asmRefus(cu,s,L){
  var m=_caveManqueL(cu);
  if(!s) return 'Choisissez d\u2019o\u00f9 vient le vin.';
  if(!(L>0)) return 'Indiquez les litres.';
  if(L>m) return 'Le f\u00fbt n\u2019en attend que '+m+'\u00a0L.';
  if(L/100>s.hl+1e-9) return 'La source n\u2019a qu\u2019environ '+_mvF1(s.hl)+'\u00a0hL.';
  return '';
}
function _asmApercu(){
  var el=document.getElementById('asm-prev'), go=document.getElementById('asm-go');
  var cu=_asmCuvee(_asmCuv); if(!el||!cu) return;
  var L=_asmL, m=_caveManqueL(cu);
  var s=_asmSources(cu).find(function(x){ return x.k===_asmSrc; })||null;
  var err=_asmRefus(cu,s,L);
  if(go){ go.disabled=!!err; go.textContent=err?'Compl\u00e9ter le f\u00fbt':('Compl\u00e9ter le f\u00fbt \u2014 '+L+'\u00a0L'); }
  if(err){ el.innerHTML='<div class="mvv-asm-prev mvv-asm-err">'+err+'</div>'; return; }
  var avant=_caveVolL(cu), tot=avant+L, nomCu=(cu.nom||'')+(cu.millesime?' '+cu.millesime:'');
  var dA=_asmAocsCuvee(cu), deja=(cu.apports||[]).reduce(function(t,a){ return t+(parseFloat(a&&a.l)||0); },0);
  var part=Math.round(L*100/tot), dejaP=Math.round(deja*100/tot);
  var autreAoc=!!(s.aocs.length&&dA.length&&s.aocs.join('|').toLowerCase()!==dA.join('|').toLowerCase());
  var autreMil=(s.mil!=null&&cu.millesime!=null&&String(s.mil)!==String(cu.millesime));
  var h='<b>'+_escHtml(nomCu)+'\u00a0:</b> '+_caveLTxt(avant)+'\u00a0L + '+L+'\u00a0L = '+_caveLTxt(tot)+'\u00a0L'
    +(L>=m?' \u2014 le f\u00fbt est plein.':' \u2014 il attendra encore '+(m-L)+'\u00a0L.')
    +'<br><b>Composition\u00a0:</b> '+part+'\u00a0% de '+_escHtml(s.lbl)+(s.aocs.length?', '+_escHtml(s.aocs.join(', ')):'')
    +(dejaP?' \u00b7 '+dejaP+'\u00a0% d\u2019apports d\u00e9j\u00e0 re\u00e7us':'')+'.';
  if(autreAoc||autreMil) h+='<span class="mvv-asm-w">'+part+'\u00a0% d\u2019'+(autreAoc?'une autre appellation':'')
    +(autreAoc&&autreMil?' et d\u2019':'')+(autreMil?'un autre mill\u00e9sime':'')+'.</span>';
  var e=(s.type==='cuve')
    ? ('<b>'+_escHtml(s.lbl)+'\u00a0:</b> environ '+_mvF1(s.hl)+' \u2192 '+_mvF1(Math.max(0,s.hl-L/100))+'\u00a0hL dedans. Ces '+L+'\u00a0L restent dans le rendement de ses parcelles.')
    : (s.futs ? ('<b>'+_escHtml(s.lbl)+'\u00a0:</b> un de ses f\u00fbts attendra '+L+'\u00a0L.')
              : ('<b>'+_escHtml(s.lbl)+'\u00a0:</b> sa cuve passe de '+_mvF1(s.cuveL/100)+' \u00e0 '+_mvF1(Math.max(0,s.cuveL-L)/100)+'\u00a0hL.'));
  el.innerHTML='<div class="mvv-asm-prev">'+h+'<div class="mvv-asm-e">'+e+'</div></div>';
}
function _asmValider(){
  if(typeof canWrite==='function'&&!canWrite()){ showToast('Acc\u00e8s lecture seule','#B85A1A'); return; }
  var cu=_asmCuvee(_asmCuv); if(!cu) return;
  var L=Math.round(_asmL), m=_caveManqueL(cu);
  var s=_asmSources(cu).find(function(x){ return x.k===_asmSrc; })||null;
  var err=_asmRefus(cu,s,L);
  if(err){ showToast(err,'#B85A1A'); _asmApercu(); return; }
  var id='asm_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), date=_mvToday();
  var vers=(cu.nom||'Cuv\u00e9e')+(cu.millesime?' '+cu.millesime:'');
  var op={id:id, type:'assemblage', date:date, cuvee_id:cu.id, cuvees_ids:[cu.id],
    operateur:(window.currentUser&&window.currentUser.nom)||'', intervenants:[], notes:'',
    data:{litres:L, volume_hl:L/100, sources:[s.lbl], de_type:s.type, de_id:s.id, de_nom:s.lbl,
          de_mil:(s.mil!=null?s.mil:null), vers_id:cu.id, vers_nom:vers}};
  cu.manque_l=m-L;
  cu.apports=(cu.apports||[]).concat([{id:id, date:date, l:L, de:s.lbl, de_type:s.type, de_id:s.id,
    mil:(s.mil!=null?s.mil:null), aoc:s.aocs.join(', ')}]);
  var cles=['cave_elevage'];
  if(s.type==='cuve'){
    var cv=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){ return x&&x.id===s.id; });
    if(cv){
      if(!cv.operations) cv.operations=[];
      cv.operations.push({id:'vop_'+id, type:'prelevement', date:date, volume_hl:L/100,
        vers:{cuvee_id:cu.id, nom:vers}, asm_id:id});
      cles.push('cave_vendange');
    }
  } else {
    var sc=_asmCuvee(s.id);
    if(sc){
      var k=_asmIdxCuve(sc);
      if(k>=0){ sc.cuves[k].litres=Math.max(0,(parseFloat(sc.cuves[k].litres)||0)-L);
                op.data.de_cuve=sc.cuves[k].ref||null; op.data.de_cuve_i=k; }
      else { sc.manque_l=_caveManqueL(sc)+L; op.data.de_futs=true; }
    }
  }
  if(!CAVE_ELEVAGE.operations) CAVE_ELEVAGE.operations=[];
  CAVE_ELEVAGE.operations.push(op);
  window.CAVE_ELEVAGE=CAVE_ELEVAGE; window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendSheetClose();
  _vendFbSave('F\u00fbt compl\u00e9t\u00e9\u00a0: '+L+'\u00a0L de '+s.lbl,'#3D6B27',cles);
  if(typeof renderCave==='function') renderCave();
}
/* Defaire : tout revient ; appele AVANT le retrait de l'operation (§153b). */
function _asmDefaire(op){
  var d=(op&&op.data)||{}, L=parseFloat(d.litres)||0;
  if(!(L>0)) return;
  var cu=_asmCuvee(d.vers_id);
  if(cu){
    cu.manque_l=_caveManqueL(cu)+L;
    cu.apports=(cu.apports||[]).filter(function(a){ return a&&a.id!==op.id; });
    if(!cu.apports.length) delete cu.apports;
  }
  if(d.de_type==='cuve'){
    var cv=((CAVE_VENDANGE&&CAVE_VENDANGE.cuves_vinif)||[]).find(function(x){ return x&&x.id===d.de_id; });
    if(cv&&cv.operations) cv.operations=cv.operations.filter(function(o){ return !o||o.asm_id!==op.id; });
  } else if(d.de_type==='cuvee'){
    var sc=_asmCuvee(d.de_id);
    if(sc){
      if(d.de_futs) sc.manque_l=Math.max(0,_caveManqueL(sc)-L);
      else {
        var x=((sc.cuves||[]).find(function(y){ return y&&d.de_cuve&&y.ref===d.de_cuve; }))||((sc.cuves||[])[d.de_cuve_i]);
        if(x) x.litres=(parseFloat(x.litres)||0)+L;
      }
    }
  }
}
window._asmOuvrir=_asmOuvrir; window._asmChoisir=_asmChoisir; window._asmPas=_asmPas;
window._asmSaisie=_asmSaisie; window._asmValider=_asmValider;

function _caveAffOpen(cuvId){
  if(typeof canWrite==='function' && !canWrite()){ showToast('Acc\u00e8s lecture seule','#B85A1A'); return; }
  var cuv=(CAVE_ELEVAGE.cuvees||[]).find(function(c){return c.id===cuvId;});
  if(!cuv){ showToast('Cuv\u00e9e introuvable','#E07060'); return; }
  _caveAffCuv=cuvId; _caveAffRef=null; _caveAffL=0;
  _caveAffRender();
}
function _caveAffBack(){ var id=_caveAffCuv; _caveAffCuv=null; if(id) openCuveeDetail(id); }
function _caveAffSel(ref){
  var p=_caveCuve(ref); if(!p) return;
  _caveAffRef=ref;
  // 92 % : on ne remplit pas une cuve a ras, il faut le ciel. Arrondi a 10 L
  // pour ne pas proposer « 36,8 hL » la ou personne ne mesure si fin.
  _caveAffL=Math.round((parseFloat(p.litres)||0)*0.92/10)*10;
  _caveAffRender();
}
function _caveAffPrev(){
  var e=document.getElementById('mvc-aff-prev'); if(!e||!_caveAffRef) return;
  var p=_caveCuve(_caveAffRef); if(!p) return;
  var cap=parseFloat(p.litres)||0;
  var v=parseFloat(String((document.getElementById('mvc-aff-v')||{}).value||'').replace(',','.'))*100;
  if(!isFinite(v)) v=0;
  _caveAffL=Math.round(v);
  e.innerHTML = (_caveAffL>cap)
    ? '<span style="color:var(--orange,#B85A1A)">Au-del\u00e0 de la contenance de la cuve ('+_mvF1(cap/100)+' hL).</span>'
    : 'Remplie \u00e0 '+(cap?Math.round(_caveAffL*100/cap):0)+' % \u00b7 ciel de '+_mvF1((cap-_caveAffL)/100)+' hL';
}
function _caveAffRender(){
  var el=document.getElementById('cuvd-body'); if(!el) return;
  var cuv=(CAVE_ELEVAGE.cuvees||[]).find(function(c){return c.id===_caveAffCuv;}); if(!cuv) return;
  var libres=_caveParc().filter(function(p){ return !_caveCuveOcc(p.id); });
  var h='<button type="button" class="mvc-aff-back" onclick="_caveAffBack()">'+_mvIcon('retour',16)+' '+_escHtml(cuv.nom||'Cuv\u00e9e')+'</button>'
    +'<div class="mvc-aff-t">Ajouter une cuve</div>'
    +'<div class="mvc-aff-d">Seules les cuves libres apparaissent \u2014 une cuve ne peut pas porter deux vins \u00e0 la fois.</div>';
  if(!_caveParc().length){
    h+='<div class="mvc-pk-vide">Aucune cuve dans le parc.<br>D\u00e9clarez-en une dans la roue crant\u00e9e de la Cave, bloc Le Chai.</div>';
  } else if(!libres.length){
    h+='<div class="mvc-pk-vide">Toutes les cuves du parc sont occup\u00e9es.<br>Videz-en une, ou d\u00e9clarez-en une nouvelle.</div>';
  } else {
    libres.forEach(function(p){
      var sel=(_caveAffRef===p.id), m=_caveMat(p.matiere);
      h+='<button type="button" class="mvc-pk mvc-aff-c'+(sel?' sel':'')+'" onclick="_caveAffSel(\'' + _escAttr(p.id) + '\')">'
        +'<span class="mvc-aff-rad"></span>'
        +'<span class="mvc-pk-ic '+_caveMatKey(p.matiere)+'">'+_mvIcon('cuve',18)+'</span>'
        +'<span class="mvc-pk-b"><span class="mvc-pk-n">'+_escHtml(p.nom||'Cuve')+'</span>'
        +'<span class="mvc-pk-m">'+_escHtml(m.lbl)+(m.ouille?' \u00b7 suit l\u2019ouillage':'')+'</span></span>'
        +'<span class="mvc-pk-r"><span class="mvc-pk-cap">'+_mvF1((parseFloat(p.litres)||0)/100)+'<span class="u">hL</span></span></span></button>';
    });
    if(_caveAffRef){
      var p2=_caveCuve(_caveAffRef);
      h+='<label class="mvc-pk-lbl" for="mvc-aff-v">Volume log\u00e9 '
        +'<span class="mvc-pk-hint">(contenance '+_mvF1((parseFloat(p2.litres)||0)/100)+' hL \u2014 on remplit rarement \u00e0 ras)</span></label>'
        +'<input id="mvc-aff-v" class="mvc-pk-in" type="number" step="0.1" inputmode="decimal" '
        +'value="'+_mvF1(_caveAffL/100).replace(',','.')+'" oninput="_caveAffPrev()">'
        +'<div class="mvc-pk-prev" id="mvc-aff-prev"></div>';
      // ⚠️ On PREVIENT avant, pas apres : perdre sa jauge d'ouillage sans l'avoir
      //   vu venir ressemble a une panne d'affichage.
      if(_caveMat(p2.matiere).ouille)
        h+='<div class="mvc-pk-note">'+_escHtml(p2.nom||'Cette cuve')+' est en bois : la cuv\u00e9e <b>garde sa jauge d\u2019ouillage</b>.</div>';
      else if(!_caveNbTonneaux(cuv))
        h+='<div class="mvc-pk-note froid">Apr\u00e8s cet ajout, la cuv\u00e9e n\u2019aura <b>aucun contenant en bois</b> : sa jauge d\u2019ouillage dispara\u00eetra, et elle sortira des alertes du Chai.</div>';
      h+='<button class="mvc-set-btn" onclick="_caveAffSave()">Loger le vin dans '+_escHtml(p2.nom||'la cuve')+'</button>';
    }
  }
  el.innerHTML=h;
  _caveAffPrev();
}
function _caveAffSave(){
  if(typeof canWrite==='function' && !canWrite()){ showToast('Acc\u00e8s lecture seule','#B85A1A'); return; }
  var cuv=(CAVE_ELEVAGE.cuvees||[]).find(function(c){return c.id===_caveAffCuv;});
  var p=_caveCuve(_caveAffRef);
  if(!cuv||!p){ showToast('Cuve introuvable','#E07060'); return; }
  var cap=parseFloat(p.litres)||0;
  if(!(_caveAffL>0)){ showToast('Indiquez le volume log\u00e9','#B85A1A'); return; }
  if(_caveAffL>cap){ showToast('Volume sup\u00e9rieur \u00e0 la contenance','#B85A1A'); return; }
  // ⚠️ Dernier filet : l'occupation peut avoir change depuis le rendu de la
  //   liste (un autre poste travaille en meme temps sur le meme domaine).
  if(_caveCuveOcc(p.id)){ showToast(p.nom+' vient d\u2019\u00eatre prise','#B85A1A'); _caveAffRender(); return; }
  cuv.cuves=Array.isArray(cuv.cuves)?cuv.cuves:[];
  cuv.cuves.push({ref:p.id, litres:_caveAffL});
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  if(window.fbSave) window.fbSave('cave_elevage',CAVE_ELEVAGE);
  var id=_caveAffCuv; _caveAffCuv=null; _caveAffRef=null; _caveAffL=0;
  if(typeof _mvcRenderHeader==='function') _mvcRenderHeader();
  if(typeof renderCaveCuvees==='function') renderCaveCuvees();
  openCuveeDetail(id);
  showToast(_mvF1(cuv.cuves[cuv.cuves.length-1].litres/100)+' hL log\u00e9s dans '+p.nom,'#3D6B27');
}
function _caveAffRetirer(cuvId, ref){
  if(typeof canWrite==='function' && !canWrite()){ showToast('Acc\u00e8s lecture seule','#B85A1A'); return; }
  var cuv=(CAVE_ELEVAGE.cuvees||[]).find(function(c){return c.id===cuvId;}); if(!cuv) return;
  var p=_caveCuve(ref);
  var go=function(){
    cuv.cuves=((cuv.cuves)||[]).filter(function(x){ return !(x&&x.ref===ref); });
    window.CAVE_ELEVAGE=CAVE_ELEVAGE;
    window.fbSaveToast({cave_elevage:CAVE_ELEVAGE},'Cuve lib\u00e9r\u00e9e','#B85A1A');
    if(typeof _mvcRenderHeader==='function') _mvcRenderHeader();
    if(typeof renderCaveCuvees==='function') renderCaveCuvees();
    openCuveeDetail(cuvId);
  };
  if(typeof window.openConfirmDel==='function')
    window.openConfirmDel('Retirer '+((p&&p.nom)||'cette cuve')+' de la cuv\u00e9e ?',
      'Le volume qu\u2019elle portait sortira du total de la cuv\u00e9e.',go);
  else go();
}

function openOvRetraitFut(cuvId){
  var cuv=(CAVE_ELEVAGE.cuvees||[]).find(function(c){return c.id===cuvId;});
  if(!cuv){showToast('Cuv\u00E9e introuvable','#E07060');return;}
  _retraitFutCuvId=cuvId;_retraitFutNb=1;_retraitFutRaison='vente';_retraitFutAnnee=null;_retraitFutIdx=-1;
  _retraitFutGarder=true;
  var el=document.getElementById('rfut-cuv-nom');if(el)el.textContent=cuv.nom+(cuv.millesime?' '+cuv.millesime:'');
  var repart=(cuv.tonneaux||[]).filter(function(t){return (t.nb||0)>0;});
  el=document.getElementById('rfut-cuv-info');
  if(el)el.innerHTML=_caveNbTonneaux(cuv)+' tonneaux disponibles'+(repart.length?' \u00B7 '+_caveTonneauxStr(cuv):'');
  // Chips de s\u00E9lection du f\u00FBt dans la r\u00E9partition
  var lblEl=document.getElementById('rfut-annee-lbl'),zone=document.getElementById('rfut-annees');
  if(zone){
    if(repart.length){
      var curY=new Date().getFullYear();
      var _ents=(cuv.tonneaux||[]).map(function(t,i){ return {t:t,i:i}; }).filter(function(x){ return (x.t.nb||0)>0; });
      _retraitFutIdx=_ents[0].i; _retraitFutAnnee=_ents[0].t.annee;
      zone.innerHTML=_ents.map(function(x){
        var t=x.t, lbl=t.annee>=curY?'Neuf':t.annee, _l=parseFloat(t.l);
        var cap=(isFinite(_l)&&_l>0&&_l!==_caveFutL())?(' \u00b7 '+_caveLTxt(_l)+'\u00a0L'):'';
        return '<button class="rfut-reason-btn'+(x.i===_retraitFutIdx?' sel':'')+'" data-idx="'+x.i+'" onclick="window._retraitFutSetIdx('+x.i+',this)">'+lbl+cap+' <span style="opacity:.65">('+t.nb+'\u00D7)</span></button>';
      }).join('');
      zone.style.display='grid';if(lblEl)lblEl.style.display='';
    } else {
      zone.innerHTML='';zone.style.display='none';if(lblEl)lblEl.style.display='none';
    }
  }
  _retraitFutUpdate(cuv);
  document.querySelectorAll('.rfut-reason-btn[data-reason]').forEach(function(b){b.classList.toggle('sel',b.dataset.reason==='vente');});
  _rfutRenderGarder();
  el=document.getElementById('rfut-notes');if(el)el.value='';
  var ov=document.getElementById('ovRetraitFut');if(ov)ov.classList.add('open');
}

function _retraitFutUpdate(cuv){
  var c2=cuv||(CAVE_ELEVAGE.cuvees||[]).find(function(c){return c.id===_retraitFutCuvId;});
  if(!c2)return;
  var max=_retraitFutMax(c2);
  _retraitFutNb=Math.max(1,Math.min(_retraitFutNb,max));
  var el=document.getElementById('rfut-nb');if(el)el.textContent=_retraitFutNb;
  var rest=max-_retraitFutNb;
  el=document.getElementById('rfut-calcul');if(el)el.textContent='\u2192 '+rest+' restant'+(rest>1?'s':'')+' \u00B7 \u2212'+(_retraitFutNb*_retraitFutL(c2)/100).toFixed(1)+' hL';
}

function _retraitFutMax(cuv){
  if(cuv.tonneaux&&cuv.tonneaux.length&&_retraitFutIdx>=0){
    var e=cuv.tonneaux[_retraitFutIdx];
    return e?(e.nb||0):0;
  }
  return _caveNbTonneaux(cuv);
}
// La contenance de la ligne choisie (FUT-CAP) : un demi-muid retire rend 500 L.
function _retraitFutL(cuv){
  var e=(cuv&&cuv.tonneaux&&_retraitFutIdx>=0)?cuv.tonneaux[_retraitFutIdx]:null;
  return e?_caveTonL(e):_caveFutL();
}


function _retraitFutSetIdx(i,el){
  var c=(CAVE_ELEVAGE.cuvees||[]).find(function(x){return x.id===_retraitFutCuvId;});
  var t=c&&c.tonneaux&&c.tonneaux[i]; if(!t) return;
  _retraitFutIdx=i; _retraitFutAnnee=t.annee;
  document.querySelectorAll('#rfut-annees .rfut-reason-btn').forEach(function(b){b.classList.toggle('sel',b===el);});
  _retraitFutNb=1;_retraitFutUpdate(null);
}
window._retraitFutSetIdx=_retraitFutSetIdx;

function _retraitFutAdj(d){
  _retraitFutNb+=d;_retraitFutUpdate(null);
}

function _retraitFutSetRaison(raison,el){
  _retraitFutRaison=raison;
  document.querySelectorAll('.rfut-reason-btn[data-reason]').forEach(function(b){b.classList.toggle('sel',b===el);});
}

async function saveRetraitFut(){
  if(!_retraitFutCuvId)return;
  var cuv=(CAVE_ELEVAGE.cuvees||[]).find(function(c){return c.id===_retraitFutCuvId;});
  if(!cuv){showToast('Cuv\u00E9e introuvable','#E07060');return;}
  var max=_retraitFutMax(cuv);
  if(_retraitFutNb<1||_retraitFutNb>max){showToast('Nombre invalide','#E07060');return;}
  var notes=((document.getElementById('rfut-notes')||{}).value||'').trim();
  var lbl={vente:'Vente',remplissage:'Cuve de remplissage',pique:'Vin piqu\u00E9',acetique:'Acide ac\u00E9tique',autre:'Autre'}[_retraitFutRaison]||_retraitFutRaison;
  // ★ FUT-CAP — le volume retire se compte AVANT de toucher a la repartition.
  var _volRetL=_retraitFutNb*_retraitFutL(cuv);
  var op={id:'op_'+Date.now(),type:'retrait_fut',date:_mvToday(),
    cuvees_ids:[_retraitFutCuvId],operateur:(window.currentUser&&window.currentUser.prenom)||'',
    data:{nb_futs:_retraitFutNb,raison:_retraitFutRaison,raison_lbl:lbl,vol_retire_L:parseFloat(_volRetL.toFixed(0)),annee_fut:_retraitFutAnnee},notes:notes};
  if(cuv.tonneaux&&cuv.tonneaux.length&&_retraitFutIdx>=0){
    // Retrait dans la r\u00E9partition des tonneaux
    var entree=cuv.tonneaux[_retraitFutIdx];
    if(entree)entree.nb=Math.max(0,(entree.nb||0)-_retraitFutNb);
    // Le fut vide n'est pas perdu : il retourne au parc, sauf si le vigneron le
    // jette. Le motif du RETRAIT parle du VIN (vente, vin pique) ; le sort du
    // CONTENANT est une question distincte, posee dans l'overlay.
    if(typeof window._mvFutRetirer==='function' && window.INTRANTS){
      window._mvFutRetirer({nom:cuv.nom, tonneaux:[{annee:_retraitFutAnnee, nb:_retraitFutNb,
          four:(entree&&entree.four)||'', ref:(entree&&entree.ref)||'', l:(entree&&entree.l)||null}]},
        _retraitFutAnnee, _retraitFutNb, window.INTRANTS,
        _retraitFutGarder!==false, lbl+(notes?' · '+notes:''));
      if(typeof window.saveIntrants==='function') window.saveIntrants();
    }
    cuv.tonneaux=cuv.tonneaux.filter(function(t){return (t.nb||0)>0;});
    if(typeof cuv.nb_tonneaux==='number')cuv.nb_tonneaux=_caveNbTonneaux(cuv);
  } else {
    cuv.nb_tonneaux=(cuv.nb_tonneaux||0)-_retraitFutNb;
  }
  cuv.volume_L=(cuv.volume_L||0)-_volRetL;
  if(!CAVE_ELEVAGE.operations)CAVE_ELEVAGE.operations=[];
  CAVE_ELEVAGE.operations.push(op);
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  window.fbSaveToast({cave_elevage:CAVE_ELEVAGE},''+_retraitFutNb+' f\u00FBt'+(+_retraitFutNb>1?'s':'')+' retir\u00E9'+(+_retraitFutNb>1?'s':'')+' ('+lbl+')','#3D6B27');
  window.closeOv(null,'ovRetraitFut');
  renderCave();
}

window._caveOpenPdf         = _caveOpenPdf;
window._caveOpenPdf         = _caveOpenPdf;
window.deleteCaveOp         = deleteCaveOp;
window._caveExpToggleCuv    = _caveExpToggleCuv;
window._caveExpToggleCuvById = _caveExpToggleCuvById;
window._caveExpToggleType   = _caveExpToggleType;
window.generateCaveExport   = generateCaveExport;
window._copStagePdf         = _copStagePdf;
window._copRemovePdf        = _copRemovePdf;
window._attachPdfToOp      = _attachPdfToOp;

// \u2500\u2500 Fonctions manquantes reconstruites \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

async function saveCaveAna() {
  if(!_caveAnaPendingFile){showToast('Aucun fichier s\u00E9lectionn\u00E9','#E07060');return;}
  var secLink=document.getElementById('cana-section-link');
  var isLinkMode=secLink&&secLink.style.display!=='none';
  if(isLinkMode){
    if(!_caveAnaLinkedOpIds.length){showToast('S\u00E9lectionnez au moins une op\u00E9ration','#E07060');return;}
    var linkOps=_caveAnaLinkedOpIds.map(function(lid){return(CAVE_ELEVAGE.operations||[]).find(function(o){return o.id===lid;});}).filter(Boolean);
    if(!linkOps.length){showToast('Op\u00E9rations introuvables','#E07060');return;}
    var btn=document.getElementById('cana-save-btn');
    if(btn){btn.disabled=true;btn.textContent='Envoi\u2026';}
    showSyncBadge('Upload PDF\u2026','#B8913A');
    try{
      var res=await window.fbUploadAnalyse(_caveAnaPendingFile,function(p){if(btn)btn.textContent='Envoi\u2026 '+p+'%';});
      linkOps.forEach(function(op){
        if(!op.data)op.data={};
        op.data.pdf_url=res.url;op.data.pdf_path=res.storage_path;
        op.data.pdf_nom=_caveAnaPendingFile.name;op.data.pdf_taille=_caveAnaPendingFile.size;
      });
      window.CAVE_ELEVAGE=CAVE_ELEVAGE;
      var _mvEtat=window.fbSaveToast({cave_elevage:CAVE_ELEVAGE});
      window.closeOv(null,'ovCaveAna');
      _caveAnaPendingFile=null;_caveAnaSelIds=[];_caveAnaLinkedOpIds=[];
      var nb=linkOps.length;
      window.fbToastApres(_mvEtat,'PDF rattach\u00E9 \u00E0 '+nb+' op\u00E9ration'+(nb>1?'s':''),'#3D6B27');
      renderCave();
    }catch(e){
      showToast('Erreur upload PDF','#E07060');
      showSyncBadge('Erreur','#B85A1A');
      if(btn){btn.disabled=false;btn.textContent='Enregistrer';}
    }
    return;
  }
  // Mode "Nouvelle analyse" standalone
  if(!_caveAnaSelIds.length){showToast('S\u00E9lectionnez au moins une cuv\u00E9e','#E07060');return;}
  var date=(document.getElementById('cana-date')||{}).value||_mvToday();
  var type=(document.getElementById('cana-type')||{}).value||'autre';
  var commentaire=((document.getElementById('cana-commentaire')||{}).value||'').trim();
  var btn2=document.getElementById('cana-save-btn');
  if(btn2){btn2.disabled=true;btn2.textContent='Envoi\u2026';}
  showSyncBadge('Upload PDF\u2026','#B8913A');
  try{
    var res2=await window.fbUploadAnalyse(_caveAnaPendingFile,function(p){if(btn2)btn2.textContent='Envoi\u2026 '+p+'%';});
    var ana={
      id:'ana_'+Date.now(),date_analyse:date,date:date,type:type,
      cuvee_ids:_caveAnaSelIds.slice(),commentaire:commentaire,
      nom_fichier:_caveAnaPendingFile.name,taille:_caveAnaPendingFile.size,
      url:res2.url,storage_path:res2.storage_path,
      uploaded_by:(window.currentUser&&window.currentUser.prenom)||'',
      uploaded_at:new Date().toISOString()
    };
    if(!CAVE_ELEVAGE.analyses)CAVE_ELEVAGE.analyses=[];
    CAVE_ELEVAGE.analyses.push(ana);
    window.CAVE_ELEVAGE=CAVE_ELEVAGE;
    window.fbSaveToast({cave_elevage:CAVE_ELEVAGE},'Analyse enregistr\u00E9e','#3D6B27');
    window.closeOv(null,'ovCaveAna');
    _caveAnaPendingFile=null;_caveAnaSelIds=[];
    showSyncBadge('Synchronis\u00E9','#3D6B27');
    renderCave();
  }catch(e){
    showToast('Erreur upload PDF','#E07060');
    showSyncBadge('Erreur','#B85A1A');
    if(btn2){btn2.disabled=false;btn2.textContent='Enregistrer';}
  }
}

function _renderCaveAnaChips() {
  var wrap=document.getElementById('cana-cuv-chips');
  if(!wrap)return;
  var cuv=CAVE_ELEVAGE.cuvees||[];
  if(!cuv.length){wrap.innerHTML='<span style="font-size:var(--pt-txt,12.5px);color:var(--texte-doux);">Aucune cuv\u00e9e configur\u00e9e</span>';return;}
  wrap.innerHTML=cuv.map(function(cv){
    var sel=_caveAnaSelIds.indexOf(cv.id)!==-1;
    return '<button onclick="window._toggleCaveAnaChip(\''+cv.id+'\')" style="padding:5px 11px;border-radius:20px;font-size:var(--pt-txt,12.5px);font-weight:500;cursor:pointer;border:1.5px solid '+(sel?'#C0845A':'var(--gris)')+';background:'+(sel?'rgba(192,132,90,0.12)':'transparent')+';color:'+(sel?'#C0845A':'var(--texte-doux)')+';">'
      +cv.nom+(cv.millesime?' '+cv.millesime:'')+'</button>';
  }).join('');
  var hint=document.getElementById('cana-cuv-hint');
  if(hint)hint.textContent=_caveAnaSelIds.length?_caveAnaSelIds.length+' cuv\u00e9e'+(_caveAnaSelIds.length>1?'s':'')+' s\u00e9lectionn\u00e9e'+(_caveAnaSelIds.length>1?'s':''):'';
}

function _toggleCaveAnaChip(cuvId) {
  var idx=_caveAnaSelIds.indexOf(cuvId);
  if(idx===-1)_caveAnaSelIds.push(cuvId);
  else _caveAnaSelIds.splice(idx,1);
  _renderCaveAnaChips();
}


window.openOvCaveAna        = openOvCaveAna;
window.setCanaMode          = setCanaMode;
window.selectCanaLinkOp     = selectCanaLinkOp;
window.saveCaveAna          = saveCaveAna;
window._toggleCaveAnaChip   = _toggleCaveAnaChip;
window._renderCaveAnaChips  = _renderCaveAnaChips;
window._caveLastAna         = _caveLastAna;
window.addCuvTonneau        = addCuvTonneau;
window.removeCuvTonneau     = removeCuvTonneau;
window.updateCuvTonneau     = updateCuvTonneau;

window.CAVE_VENDANGE        = CAVE_VENDANGE;
window.renderCaveVendange   = renderCaveVendange;
window.setCopSoufreG        = setCopSoufreG;
window.setCopSoufreMode     = setCopSoufreMode;
window._copUpdateSoufreCalc = _copUpdateSoufreCalc;
window.openOvCaveConvert    = openOvCaveConvert;
window.setConvMode          = setConvMode;
window.setConvDil           = setConvDil;
window.onConvDilInput       = onConvDilInput;
window._calcConvLiq         = _calcConvLiq;
window._calcConvPast        = _calcConvPast;
window.setCaveJFilter       = setCaveJFilter;
window.renderCaveJournal    = renderCaveJournal;
window.openCuveeDetail      = openCuveeDetail;
window.deleteCuveeById      = deleteCuveeById;
window._toggleEditAnaChip   = _toggleEditAnaChip;
window.saveCaveAnaEdit      = saveCaveAnaEdit;
window._onCaveAnaFileChange = _onCaveAnaFileChange;
window.openOvRetraitFut     = openOvRetraitFut;
window.saveRetraitFut       = saveRetraitFut;
window._retraitFutAdj       = _retraitFutAdj;
window._retraitFutSetRaison = _retraitFutSetRaison;
var _caveMillFilter  = 'tous';    // filtre millésime Le Chai
var _caveBtlConfirm  = null;      // id cuvée en attente de confirmation d'embouteillage

function _mvBtl(hl){ return Math.round((hl||0)*100/0.75); }               // bouteilles 75 cl
function _mvF1(n){ return (Math.round((n||0)*10)/10).toString().replace('.',','); }
// Le coefficient sucre/degre est FIGE dans l'analyse au moment de la saisie.
// Sans cela, changer le reglage aujourd'hui redresserait retroactivement toutes
// les mesures saisies dans l'autre unite : le passe se reecrirait tout seul.
// Les analyses d'avant portent le reglage courant en repli — zero ecriture.
function _anaSpd(a, def){
  var f = parseFloat(a && a.spd);
  if(f > 0) return f;
  return def || (_vendCfg().sucre_par_degre) || 16.83;
}

function _caveV2InjectCss(){
  if(document.getElementById('mv-cave-v2-css')) return;
  var s=document.createElement('style'); s.id='mv-cave-v2-css';
  s.textContent=''
  /* — Le parc a cuves + la ligne qui remplace la jauge — */
  +'.mvc-cuv.st-inox::before{background:linear-gradient(180deg,#8FA9B6,#5E7A8A)}'
  +'.mvc-noou{margin-top:10px;display:flex;align-items:flex-start;gap:8px;background:rgba(94,122,138,.08);border:1px solid rgba(94,122,138,.22);border-radius:10px;padding:8px 11px}'
  +'.mvc-noou .mv-ic{color:#5E7A8A;margin-top:1px}'
  +'.mvc-noou-t{font-size:var(--pt-micro,11px);color:var(--texte-med);line-height:1.4}'
  +'.mvc-pk{display:flex;align-items:center;gap:11px;padding:11px 0;width:100%;text-align:left;background:none;border:0;font-family:inherit;cursor:pointer;min-height:44px}'
  +'.mvc-pk+.mvc-pk{border-top:1px solid rgba(138,90,56,.12)}'
  +'.mvc-pk-ic{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex:none}'
  +'.mvc-pk-ic.inox{background:rgba(94,122,138,.12);color:#5E7A8A}'
  +'.mvc-pk-ic.beton{background:rgba(110,106,98,.12);color:#6E6A62}'
  +'.mvc-pk-ic.bois{background:var(--terre-pale);color:var(--terre-tx,#8A5A38)}'
  +'.mvc-pk-b{flex:1;min-width:0}'
  +'.mvc-pk-n{display:block;font-size:var(--pt-base,14px);font-weight:600;color:var(--texte);line-height:1.15}'
  +'.mvc-pk-m{display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:2px}'
  +'.mvc-pk-r{flex:none;text-align:right}'
  +'.mvc-pk-cap{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:var(--pt-md,20px);font-weight:700;color:var(--terre);line-height:1;display:block}'
  +'.mvc-pk-cap .u{font-family:inherit;font-size:var(--pt-nano,9.5px);font-weight:500;color:var(--texte-doux);margin-left:2px}'
  +'.mvc-pk-occ{font-size:var(--pt-lbl,10.5px);font-weight:600;border-radius:7px;padding:3px 7px;display:inline-block;margin-top:5px;white-space:nowrap}'
  +'.mvc-pk-occ.libre{background:rgba(61,107,39,.10);border:1px solid rgba(61,107,39,.24);color:var(--vert-med,#3D6B27)}'
  +'.mvc-pk-occ.pris{background:rgba(194,161,77,.14);border:1px solid rgba(194,161,77,.32);color:#8A6A12}'
  +'.mvc-pk-occ.vinif{background:rgba(176,65,44,.09);border:1px solid rgba(176,65,44,.26);color:#B0412C}'
  +'.mvc-dhf{display:inline-block;margin-left:8px;font-size:var(--pt-nano,9.5px);font-weight:700;letter-spacing:.3px;text-transform:uppercase;color:var(--or-tx,#7A5E12);vertical-align:1px}'
  +'.mvc-pk-vide{text-align:center;padding:20px 12px;color:var(--texte-doux);font-size:var(--pt-txt,12.5px);line-height:1.6;font-style:italic}'
  +'.mvc-pk-tot{font-size:var(--pt-txt,12.5px);color:var(--texte-doux);margin-top:11px;padding-top:10px;border-top:1px dashed rgba(138,90,56,.22)}'
  +'.mvc-pk-in{width:100%;background:var(--bg-card);border:1px solid rgba(138,90,56,.28);border-radius:11px;padding:12px 13px;font-family:inherit;font-size:var(--pt-base,14px);color:var(--texte);min-height:46px;margin-top:6px}'
  +'.mvc-pk-in:focus{border-color:var(--terre);outline:none;box-shadow:0 0 0 3px rgba(138,90,56,.12)}'
  +'.mvc-pk-lbl{display:block;font-size:var(--pt-micro,11px);font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:var(--texte-doux);margin-top:14px}'
  +'.mvc-pk-hint{text-transform:none;letter-spacing:0;font-weight:400;opacity:.85}'
  +'.mvc-pk-seg{display:flex;gap:6px;background:var(--bg-app);border:1px solid rgba(138,90,56,.14);border-radius:13px;padding:4px;margin-top:6px}'
  +'.mvc-pk-seg button{flex:1;padding:9px 4px;border:0;border-radius:10px;background:transparent;font-family:inherit;font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--texte-doux);cursor:pointer;min-height:44px;display:flex;flex-direction:column;align-items:center;gap:3px;line-height:1.2}'
  +'.mvc-pk-seg button.on{background:var(--bg-card);color:var(--terre);box-shadow:0 1px 5px rgba(20,17,13,.05)}'
  +'.mvc-pk-seg button .sm{font-size:var(--pt-nano,9.5px);font-weight:500;opacity:.8}'
  +'.mvc-pk-note{font-size:var(--pt-txt,12.5px);line-height:1.5;margin-top:10px;padding:10px 12px;border-radius:11px;background:var(--or-pale);border:1px solid rgba(194,161,77,.3);color:var(--texte-med)}'
  +'.mvc-pk-note.froid{background:rgba(94,122,138,.08);border-color:rgba(94,122,138,.24)}'
  +'.mvc-pk-note.chaud{background:var(--orange-pale,#FBF0E6);border-color:rgba(184,90,26,.3)}'
  +'.mvc-pk-note b{color:var(--terre)}'
  +'.mvc-pk-prev{font-size:var(--pt-txt,12.5px);color:var(--texte-doux);margin-top:6px}'
  +'.mvc-pk-fill{display:block;height:5px;border-radius:4px;background:rgba(138,90,56,.11);overflow:hidden;margin-top:7px}'
  +'.mvc-pk-fill i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,#7FA3B4,#5E7A8A)}'
  +'.mvc-pk-fill i.bois{background:linear-gradient(90deg,#B58A5E,var(--terre))}'
  +'.mvc-aff-sec{font-size:var(--pt-lbl,10.5px);letter-spacing:1.4px;text-transform:uppercase;color:var(--texte-doux);margin:2px 0 2px}'
  +'.mvc-aff-x{font-size:var(--pt-lbl,10.5px);font-weight:600;border-radius:7px;padding:4px 9px;margin-top:5px;display:inline-block;cursor:pointer;font-family:inherit;background:rgba(224,112,96,.09);border:1px solid rgba(224,112,96,.3);color:#E07060;min-height:32px}'
  +'.mvc-aff-add{width:100%;padding:10px;margin:8px 0 6px;border:1px dashed rgba(138,90,56,.34);border-radius:10px;background:none;font-family:inherit;font-size:var(--pt-txt,12.5px);font-weight:500;color:var(--terre);cursor:pointer;min-height:44px}'
  +'.mvc-aff-back{display:inline-flex;align-items:center;gap:6px;background:none;border:0;font-family:inherit;font-size:var(--pt-txt,12.5px);font-weight:500;color:var(--texte-doux);cursor:pointer;padding:6px 0;min-height:40px}'
  +'.mvc-aff-t{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:var(--pt-md,20px);font-weight:600;color:var(--texte);margin-top:2px}'
  +'.mvc-aff-d{font-size:var(--pt-txt,12.5px);color:var(--texte-doux);line-height:1.5;margin:3px 0 10px}'
  +'.mvc-aff-c{border-radius:10px}'
  +'.mvc-aff-c.sel{background:var(--or-pale);box-shadow:inset 0 0 0 1.5px rgba(194,161,77,.5);padding-left:10px;padding-right:10px}'
  +'.mvc-aff-rad{width:20px;height:20px;border-radius:50%;border:2px solid rgba(138,90,56,.3);flex:none;display:flex;align-items:center;justify-content:center}'
  +'.mvc-aff-c.sel .mvc-aff-rad{border-color:var(--or);background:var(--or)}'
  +'.mvc-aff-c.sel .mvc-aff-rad::after{content:"";width:7px;height:7px;border-radius:50%;background:#fff}'
  /* — Seuil d'ouillage par millésime (Réglages du Chai) — */
  +'.mvc-set-sep{height:1px;background:var(--gris-clair);margin:14px 0 10px}'
  +'.mvc-milrow{display:flex;align-items:center;gap:9px;padding:7px 0;border-top:1px solid rgba(0,0,0,.05)}'
  +'.mvc-milrow:first-of-type{border-top:none}'
  +'.mvc-milrow-a{flex:1;font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--texte)}'
  +'.mvc-milrow-v{min-width:52px;text-align:center;font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--texte-doux)}'
  +'.mvc-milrow-v.own{color:var(--vert-med,#3D6B27)}'
  +'.mvc-step-btn.sm{width:34px;height:34px;min-width:34px;font-size:var(--pt-sm,17px);line-height:1}'
  +'.mvc-milrow-x{width:30px;height:30px;min-width:30px;border:none;background:transparent;color:var(--texte-doux);font-size:var(--pt-base,14px);cursor:pointer;border-radius:8px}'
  +'.mvc-milrow-x:hover{background:var(--gris-clair)}'
  /* — Soutirage sur la carte de cuvée — */
  +'.mvc-cuv-sout{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:5px}'
  +'.mvc-tag-sout{background:rgba(93,124,168,.12);color:#4A6E9C;border:1px solid rgba(93,124,168,.25)}'
  +'.mvc-sout-note{font-size:var(--pt-lbl,10.5px);color:var(--texte-doux)}'
  /* — Synthese de maturite a date (Cuvier > Analyses) — */
  +'.mvsy{background:var(--bg-card,#FBFAF6);border:1px solid var(--gris-clair,#ECE6DA);border-radius:14px;padding:15px;margin:2px 0 14px;box-shadow:0 1px 4px rgba(20,17,13,.06)}'
  +'.mvsy-hd{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:11px}'
  +'.mvsy-ttl{font-size:var(--pt-lbl,10.5px);letter-spacing:1.5px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);font-weight:600}'
  +'.mvsy-dt{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);font-variant-numeric:tabular-nums}'
  +'.mvsy-fen{display:flex;border:1px solid var(--gris-clair,#ECE6DA);border-radius:9px;overflow:hidden;margin-bottom:12px}'
  +'.mvsy-fen button{flex:1;background:var(--bg-card,#FBFAF6);border:0;padding:9px 4px;font-family:inherit;font-size:var(--pt-txt,12.5px);color:var(--texte-doux,#5F5F5F);cursor:pointer;border-left:1px solid var(--gris-clair,#ECE6DA);min-height:38px}'
  +'.mvsy-fen button:first-child{border-left:0}'
  +'.mvsy-fen button.on{background:var(--terre,#8A5A38);color:#fff;font-weight:600}'
  +'.mvsy-tiles{display:flex;gap:8px}'
  +'.mvsy-t{flex:1;min-width:0;position:relative;overflow:hidden;display:block;text-align:left;font-family:inherit;color:inherit;cursor:pointer;background:var(--blanc,#FBFAF6);border:1px solid var(--gris-clair,#ECE6DA);border-radius:12px;padding:10px 9px 9px}'
  +'.mvsy-t::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--gris,#DED7C9)}'
  +'.mvsy-t.dom::before{background:var(--terre,#8A5A38)}'
  +'.mvsy-t.rge::before{background:var(--rouge,#A0291E)}'
  +'.mvsy-t.bl::before{background:var(--or,#C2A14D)}'
  +'.mvsy-t.sel{border-color:var(--terre,#8A5A38);box-shadow:0 0 0 2px var(--terre-pale,#F3EADF)}'
  +'.mvsy-t .lb{display:block;font-size:var(--pt-nano,9.5px);letter-spacing:.09em;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);font-weight:600}'
  +'.mvsy-t .gl{display:block;font-size:var(--pt-lg,23px);font-weight:700;color:var(--texte,#2A241C);line-height:1.1;margin-top:3px;font-variant-numeric:tabular-nums}'
  +'.mvsy-t .gl em{font-style:normal;font-size:var(--pt-micro,11px);font-weight:500;color:var(--texte-doux,#5F5F5F);margin-left:2px}'
  +'.mvsy-t .al{display:block;font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--bordeaux,#7A1020);font-variant-numeric:tabular-nums}'
  +'.mvsy-t .cv{display:block;font-size:var(--pt-lbl,10.5px);color:var(--texte-doux,#5F5F5F);margin-top:5px;line-height:1.35}'
  +'.mvsy-t.vide .gl{color:var(--texte-doux,#5F5F5F);font-size:var(--pt-sm,17px);font-weight:600}'
  +'.mvsy-simple{font-size:var(--pt-lbl,10.5px);color:var(--texte-doux,#5F5F5F);margin-top:8px;text-align:center;font-variant-numeric:tabular-nums}'
  +'.mvcl{margin-top:14px;padding-top:12px;border-top:1px solid var(--gris-clair,#ECE6DA)}'
  +'.mvcl-hd{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:9px}'
  +'.mvcl-ttl{font-size:var(--pt-lbl,10.5px);letter-spacing:1.4px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);font-weight:600}'
  +'.mvcl-n{font-size:var(--pt-lbl,10.5px);color:var(--texte-doux,#5F5F5F)}'
  +'.mvcl-vide{font-size:var(--pt-txt,12.5px);color:var(--texte-doux,#5F5F5F);padding:6px 0}'
  +'.mvcl-grad{display:grid;grid-template-columns:96px 1fr 52px;align-items:center;height:14px;margin-bottom:2px}'
  +'.mvcl-grad .g{position:relative;height:100%}'
  +'.mvcl-grad .g span{position:absolute;top:0;transform:translateX(-50%);font-size:var(--pt-nano,9.5px);color:var(--texte-doux,#5F5F5F);font-variant-numeric:tabular-nums;white-space:nowrap}'
  +'.mvcl-zone{position:relative}'
  +'.mvcl-ov{position:absolute;left:96px;right:52px;top:0;bottom:0;pointer-events:none}'
  +'.mvcl-ov i{position:absolute;top:0;bottom:0;width:0;border-left:1.5px dashed var(--terre,#8A5A38);opacity:.55}'
  +'.mvcl-ov i.obj{border-left-style:solid;border-color:var(--vert-med,#3D6B27);opacity:.75}'
  +'.mvcl-ov b{position:absolute;top:-1px;transform:translateX(-50%);font-size:var(--pt-nano,9.5px);font-weight:700;padding:1px 4px;border-radius:5px;white-space:nowrap;letter-spacing:.04em}'
  +'.mvcl-ov b.moy{background:var(--terre,#8A5A38);color:#fff}'
  +'.mvcl-ov b.obj{background:var(--vert-med,#3D6B27);color:#fff}'
  +'.mvcl-r{display:grid;grid-template-columns:96px 1fr 52px;align-items:center;height:26px}'
  +'.mvcl-r .n{font-size:var(--pt-micro,11px);font-weight:600;color:var(--texte,#2A241C);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:7px}'
  +'.mvcl-r .pi{position:relative;height:100%}'
  +'.mvcl-r .pi::before{content:"";position:absolute;left:0;right:0;top:50%;height:1.5px;margin-top:-.75px;background:var(--gris-clair,#ECE6DA);border-radius:2px}'
  +'.mvcl-r .dot{position:absolute;top:50%;width:11px;height:11px;margin-top:-5.5px;margin-left:-5.5px;border-radius:50%;background:var(--gris,#DED7C9);box-shadow:0 0 0 2px var(--bg-card,#FBFAF6)}'
  +'.mvcl-r .dot.r{background:var(--rouge,#A0291E)}'
  +'.mvcl-r .dot.b{background:var(--or,#C2A14D)}'
  +'.mvcl-r .dot.q{background:var(--texte-doux,#5F5F5F)}'
  +'.mvcl-r .dot.old{background:var(--bg-card,#FBFAF6);border:2px solid var(--gris,#DED7C9)}'
  +'.mvcl-r .dot.old.r{border-color:var(--rouge,#A0291E)}'
  +'.mvcl-r .dot.old.b{border-color:var(--or,#C2A14D)}'
  +'.mvcl-r .v{text-align:right;font-size:var(--pt-txt,12.5px);font-weight:700;color:var(--texte,#2A241C);font-variant-numeric:tabular-nums;line-height:1.05}'
  +'.mvcl-r .v s{text-decoration:none;display:block;font-size:var(--pt-nano,9.5px);font-weight:500;color:var(--texte-doux,#5F5F5F)}'
  +'.mvcl-r .v.conv b{border-bottom:1px dotted var(--texte-doux,#5F5F5F)}'
  +'.mvcl-r.pale .n{font-weight:500;color:var(--texte-doux,#5F5F5F)}'
  +'.mvcl-r.pale .v{font-weight:600;color:var(--texte-doux,#5F5F5F)}'
  +'.mvcl-r.out .n{text-decoration:line-through;text-decoration-thickness:1px}'
  +'.mvcl-sep{font-size:var(--pt-nano,9.5px);letter-spacing:.09em;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);padding:9px 0 3px;border-top:1px solid var(--gris-clair,#ECE6DA);margin-top:5px}'
  +'.mvcl-plus{display:block;font-size:var(--pt-micro,11px);color:var(--terre,#8A5A38);background:none;border:0;font-family:inherit;padding:8px 0 2px;cursor:pointer;text-align:left;text-decoration:underline}'
  +'.mvcl-lg{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;font-size:var(--pt-lbl,10.5px);color:var(--texte-doux,#5F5F5F)}'
  +'.mvcl-lg span{display:inline-flex;align-items:center;gap:5px}'
  +'.mvcl-lg i{width:10px;height:10px;border-radius:50%;background:var(--gris,#DED7C9);flex:none}'
  +'.mvcl-lg i.pl{background:var(--terre,#8A5A38)}'
  +'.mvcl-lg i.cr{background:transparent;border:2px solid var(--gris,#DED7C9)}'
  +'.mvcl-lg i.tr{width:0;height:11px;border-radius:0;border-left:1.5px dashed var(--terre,#8A5A38);background:none}'
  +'.mvcl-lg i.cv{width:auto;height:auto;border-radius:0;background:none;font-style:normal;border-bottom:1px dotted var(--texte-doux,#5F5F5F);line-height:1}'
  +'.mvcl-pied{font-size:var(--pt-lbl,10.5px);color:var(--texte-doux,#5F5F5F);margin-top:8px;line-height:1.45}'
  +'.mvsy-ec{font-size:var(--pt-txt,12.5px);color:var(--texte-med,#4A4A3A);margin-top:11px;padding-top:10px;border-top:1px solid var(--gris-clair,#ECE6DA);line-height:1.5}'
  +'.mvsy-ec b{color:var(--terre,#8A5A38);font-weight:700}'
  +'.mvsy-warn{font-size:var(--pt-micro,11px);line-height:1.5;color:var(--texte-med,#4A4A3A);background:var(--orange-pale,#FBF0E6);border-radius:9px;padding:9px 10px;margin-top:10px}'
  +'.mvsy-warn b{color:var(--orange,#B85A1A)}'
  +'.mvsy-info{font-size:var(--pt-micro,11px);line-height:1.5;color:var(--texte-doux,#5F5F5F);margin-top:9px}'
  +'.mvsy-info b{color:var(--texte-med,#4A4A3A);font-weight:600}'
  +'.mvsy-cls{margin-top:11px;padding-top:10px;border-top:1px solid var(--gris-clair,#ECE6DA)}'
  +'.mvsy-cls .t{font-size:var(--pt-micro,11px);color:var(--texte-med,#4A4A3A);margin-bottom:7px;line-height:1.45}'
  +'.mvsy-clr{display:flex;align-items:center;gap:7px;padding:5px 0}'
  +'.mvsy-clr .n{font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--texte,#2A241C);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
  +'.mvsy-clr button{font-family:inherit;font-size:var(--pt-micro,11px);font-weight:600;padding:6px 12px;border-radius:8px;border:1px solid var(--gris,#DED7C9);background:var(--bg-card,#FBFAF6);color:var(--texte-doux,#5F5F5F);cursor:pointer;min-height:38px}'
  +'.mvsy-clr button.r.on{background:var(--rouge,#A0291E);border-color:var(--rouge,#A0291E);color:#fff}'
  +'.mvsy-clr button.b.on{background:var(--or,#C2A14D);border-color:var(--or,#C2A14D);color:#241B08}'
  +'@media(max-width:360px){.mvcl-grad,.mvcl-r{grid-template-columns:78px 1fr 46px}.mvcl-ov{left:78px;right:46px}}'
  /* — Analyses maturité — */
  +'.mva-form{background:linear-gradient(180deg,#fff,var(--terre-pale,#F3EADF));border:1px solid rgba(201,168,76,.35);border-radius:14px;padding:14px;margin:2px 0 14px}'
  +'.mva-frow{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end}'
  +'.mva-fld{flex:1;min-width:110px}'
  +'.mva-fld label{display:block;font-size:var(--pt-lbl,10.5px);letter-spacing:.06em;color:var(--texte-doux,#5F5F5F);margin-bottom:4px;text-transform:uppercase}'
  +'.mva-fld input,.mva-fld select{width:100%;font-family:inherit;font-size:var(--pt-base,14px);padding:9px 10px;border:1px solid rgba(138,90,56,.3);border-radius:9px;background:#fff;color:var(--texte,#2A241C)}'
  +'.mva-useg{display:flex;border:1px solid rgba(138,90,56,.3);border-radius:9px;overflow:hidden}'
  +'.mva-useg button{flex:1;background:#fff;border:0;padding:9px 6px;font-family:inherit;font-size:var(--pt-txt,12.5px);font-weight:500;color:var(--texte-doux,#5F5F5F);cursor:pointer}'
  +'.mva-useg button.on{background:var(--terre,#8A5A38);color:#fff}'
  +'.mva-add{background:linear-gradient(180deg,var(--or,#C9A84C),#B8952F);color:#241B08;border:0;font-weight:600;font-size:var(--pt-txt,12.5px);padding:10px 14px;border-radius:9px;cursor:pointer;white-space:nowrap;min-height:44px}'
  +'.mva-derived{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px dashed rgba(138,90,56,.25)}'
  +'.mva-derived div{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F)}'
  +'.mva-derived b{display:block;font-size:var(--pt-sm,17px);color:var(--terre,#8A5A38);font-weight:700}'
  +'.mvap-tot{display:flex;align-items:baseline;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid var(--gris-clair,#ECE6DA)}'
  +'.mvap-tot span{display:flex;flex-direction:column;align-items:center;font-size:var(--pt-lbl,10.5px);letter-spacing:1.2px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F)}'
  +'.mvap-tot span b{font-size:var(--pt-md,20px);font-weight:600;letter-spacing:0;text-transform:none;color:var(--texte,#2A241C);font-variant-numeric:tabular-nums}'
  +'.mvap-tot span.hl b{color:var(--terre,#8A5A38)}'
  +'.mvap-tot em{font-style:normal;font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);font-variant-numeric:tabular-nums}'
  +'.mvap-note{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:10px;line-height:1.5}'
  +'.mvfm-lg{display:flex;gap:14px;flex-wrap:wrap;font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:11px}'
  /* CUVGR-3 : le geste s'annonce, sinon personne ne devine qu'on peut toucher. */
  +'.mvfm-tap{color:var(--terre,#8A5A38);font-weight:600}'
  +'@media(hover:hover) and (pointer:fine){.mvfm-tap::before{content:""}}'
  +'.mvfm-lg span{display:inline-flex;align-items:center;gap:6px}'
  +'.mvfm-lg i.l{width:15px;height:3px;border-radius:2px}'
  +'.mvfm-lg i.d{width:15px;height:0;border-top:2px dashed}'
  +'.mvfm-ops{display:flex;flex-direction:column;gap:4px;margin-top:10px}'
  +'.mvfm-op{display:flex;align-items:baseline;gap:7px;font-size:var(--pt-txt,12.5px);color:var(--texte-med,#4A4A3A)}'
  +'.mvfm-op i{width:7px;height:7px;border-radius:50%;background:var(--or,#C2A14D);flex:none}'
  +'.mvfm-op b{font-weight:600;color:var(--texte,#2A241C);font-variant-numeric:tabular-nums}'
  +'.mvfm-ets{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:8px}'
  +'.mvfm-et{display:inline-flex;align-items:center;gap:6px;font-size:var(--pt-txt,12.5px);color:var(--texte-med,#4A4A3A)}'
  +'.mvfm-et i{width:12px;height:0;border-top:2px dashed var(--texte-doux,#5F5F5F);flex:none}'
  +'.mvfm-et b{font-weight:600;color:var(--texte,#2A241C);font-variant-numeric:tabular-nums}'
  +'.mvfm-note{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:10px;line-height:1.5}'
  +'.mvfm-fin{font-size:var(--pt-txt,12.5px);color:var(--texte-med,#4A4A3A);margin-top:10px;padding-top:10px;border-top:1px solid var(--gris-clair,#ECE6DA)}'
  +'.mvfm-fin b{color:var(--terre,#8A5A38)}'
  +'.mvcv-ord{font-size:var(--pt-txt,12.5px);color:var(--texte-med,#4A4A3A);margin-top:12px;padding-top:10px;border-top:1px solid var(--gris-clair,#ECE6DA)}'
  +'.mvcv-ord b{color:var(--terre,#8A5A38);font-weight:700}'
  +'.mvcv-note{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:8px;line-height:1.5}'
  +'.mvmat-lg{display:flex;flex-direction:column;gap:5px;margin-top:12px}'
  +'.mvmat-it{display:flex;align-items:baseline;gap:7px;font-size:var(--pt-txt,12.5px);line-height:1.35}'
  +'.mvmat-it i{width:11px;height:3px;border-radius:2px;flex:none;position:relative;top:-3px}'
  +'.mvmat-it b{font-weight:600;color:var(--texte,#2A241C)}'
  +'.mvmat-it em{font-style:normal;color:var(--texte-doux,#5F5F5F);font-variant-numeric:tabular-nums;margin-left:auto;text-align:right}'
  +'.mvmat-note{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:8px}'
  +'.mvmat-ord{font-size:var(--pt-txt,12.5px);color:var(--texte-med,#4A4A3A);margin-top:10px;padding-top:10px;border-top:1px solid var(--gris-clair,#ECE6DA)}'
  +'.mvmat-card{background:var(--bg-card,#FBFAF6);border-radius:14px;padding:15px;margin-bottom:14px;box-shadow:0 1px 4px rgba(20,17,13,.06);border:1px solid var(--gris-clair,#ECE6DA)}'
  +'.mvmat-ttl{font-size:var(--pt-lbl,10.5px);letter-spacing:1.5px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);font-weight:600;margin-bottom:10px}'
  +'.mva-card{background:var(--bg-card,#FBFAF6);border-radius:14px;padding:15px;margin-bottom:12px;box-shadow:0 1px 4px rgba(20,17,13,.06);border:1px solid rgba(138,90,56,.08)}'
  +'.mva-cname{font-size:var(--pt-sm,17px);font-weight:600;color:var(--texte,#2A241C)}'
  +'.mva-meta{font-size:var(--pt-txt,12.5px);color:var(--texte-doux,#5F5F5F);margin-top:2px}'
  +'.mva-line{display:flex;gap:16px;align-items:center;margin-top:8px;font-size:var(--pt-txt,12.5px);flex-wrap:wrap}'
  +'.mva-line .pot{color:var(--bordeaux,#7A1020);font-weight:700}'
  +'.mva-spark{width:100%;height:118px;display:block;margin-top:8px}'
  +'.mva-rows{margin-top:8px;border-top:1px solid rgba(138,90,56,.12);padding-top:6px}'
  +'.mva-row{display:flex;align-items:center;justify-content:space-between;font-size:var(--pt-txt,12.5px);color:var(--texte-doux,#5F5F5F);padding:3px 0}'
  +'.mva-x{background:none;border:0;color:var(--texte-doux,#5F5F5F);cursor:pointer;font-size:var(--pt-base,14px);min-width:40px;min-height:40px}'
  +'.mva-hint{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);font-style:italic;margin:2px 0 10px}'
  /* — Chips millésime — */
  /* ★ Lot CAVE-6 : la barre du millesime vit sous les onglets du Chai, donc
     hors du corps qui defile. Le padding lateral est celui de .mvc-body — sans
     lui les chips se collent au bord de l'ecran. Vide, le bloc ne prend AUCUNE
     place : un domaine a un seul millesime ne voit pas une bande vide. */
  +'#mvc-milbar:empty{display:none}'
  +'#mvc-milbar{padding:10px 14px 0}'
  +'.mvcm-chips{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin:2px 0 12px}'
  +'.mvcm-lab{font-size:var(--pt-lbl,10.5px);letter-spacing:.1em;color:var(--texte-doux,#5F5F5F);text-transform:uppercase;margin-right:2px}'
  +'.mvc-jmilnote{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);background:var(--or-pale,#FAF3E0);border:1px solid rgba(194,161,77,.28);border-radius:8px;padding:7px 10px;margin:0 0 12px;line-height:1.4}'
  +'.mvcm-chip{font-size:var(--pt-txt,12.5px);font-weight:500;padding:6px 13px;border-radius:99px;border:1px solid rgba(138,90,56,.25);background:var(--bg-card,#FBFAF6);color:var(--terre,#8A5A38);cursor:pointer}'
  +'.mvcm-chip.on{background:var(--cave,#14110D);color:var(--or,#C9A84C);border-color:var(--cave,#14110D)}'
  +'.mvcm-c{opacity:.6;font-size:var(--pt-lbl,10.5px);margin-left:4px}'
  /* — Mise en bouteille — */
  +'.mvb-sec{font-size:var(--pt-lbl,10.5px);letter-spacing:.13em;color:var(--terre,#8A5A38);text-transform:uppercase;margin:6px 0 8px;font-weight:600}'
  +'.mvb-sec.sep{border-top:1px solid rgba(138,90,56,.15);padding-top:14px;margin-top:16px}'
  +'.mvb-card{background:var(--bg-card,#FBFAF6);border-radius:14px;padding:15px;margin-bottom:12px;box-shadow:0 1px 4px rgba(20,17,13,.06);border:1px solid rgba(138,90,56,.08);position:relative}'
  +'.mvb-badge{position:absolute;top:14px;right:14px;font-size:var(--pt-txt,12.5px);font-weight:700;color:var(--terre-tx,#8A5A38);background:var(--terre-pale,#F3EADF);border-radius:8px;padding:3px 9px}'
  +'.mvb-name{font-size:var(--pt-sm,17px);font-weight:600;color:var(--texte,#2A241C)}'
  +'.mvb-meta{font-size:var(--pt-txt,12.5px);color:var(--texte-doux,#5F5F5F);margin-top:2px}'
  +'.mvb-line{font-size:var(--pt-base,14px);margin-top:9px}'
  +'.mvb-line b{font-weight:700;color:var(--terre,#8A5A38)}'
  +'.mvb-frow{display:flex;gap:8px;align-items:flex-end;margin-top:10px;flex-wrap:wrap}'
  +'.mvb-fld label{display:block;font-size:var(--pt-lbl,10.5px);letter-spacing:.06em;color:var(--texte-doux,#5F5F5F);margin-bottom:4px;text-transform:uppercase}'
  +'.mvb-fld input{width:150px;max-width:100%;font-family:inherit;font-size:var(--pt-base,14px);padding:9px 10px;border:1px solid rgba(138,90,56,.3);border-radius:9px;background:#fff;color:var(--texte,#2A241C)}'
  +'.mvb-btn{background:linear-gradient(180deg,#8A5A38,#6E4326);color:#fff;border:0;font-weight:600;font-size:var(--pt-base,14px);padding:12px 18px;border-radius:11px;cursor:pointer;min-height:44px}'
  +'.mvb-yes{background:linear-gradient(180deg,var(--vert-med,#3D6B27),#2E5220);color:#fff;border:0;font-weight:600;font-size:var(--pt-base,14px);padding:12px 16px;border-radius:11px;cursor:pointer;min-height:44px}'
  +'.mvb-no{background:#fff;border:1px solid rgba(138,90,56,.3);color:var(--texte-doux,#5F5F5F);font-weight:500;font-size:var(--pt-base,14px);padding:12px 16px;border-radius:11px;cursor:pointer;min-height:44px}'
  +'.mvb-ask{font-size:var(--pt-txt,12.5px);color:var(--bordeaux,#7A1020);margin:10px 0 6px;font-weight:500}'
  +'.mvb-grp{margin-bottom:14px}'
  +'.mvb-grphead{font-size:var(--pt-base,14px);font-weight:700;color:var(--terre,#8A5A38);border-bottom:2px solid rgba(201,168,76,.35);padding-bottom:5px;margin-bottom:8px}'
  +'.mvb-split{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:8px}'
  +'.mvb-tot{font-size:var(--pt-xxl,31px);font-weight:700;color:var(--bordeaux,#7A1020);line-height:1}'
  +'.mvb-tot small{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);display:block;letter-spacing:.08em;text-transform:uppercase;font-weight:400}'
  +'.mvb-hint{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);font-style:italic;margin:2px 0 10px}'
  +'.mvb-empty{text-align:center;color:var(--texte-doux,#5F5F5F);padding:34px 20px;font-size:var(--pt-txt,12.5px)}'
  // ★ ASM-1 — le fut entame (carte, fiche), la composition, la feuille « Completer le fut »
  +'.mvc-creux{display:flex;align-items:center;gap:10px;width:100%;margin:8px 0 4px;padding:9px 11px;border-radius:12px;border:1.5px dashed var(--terre);background:var(--terre-pale);font-family:inherit;text-align:left;cursor:pointer;color:var(--texte)}'
  +'div.mvc-creux{cursor:default}'
  +'.mvc-creux-f{flex-shrink:0}'
  +'.mvc-creux-t{display:flex;flex-direction:column;flex:1;min-width:0;font-size:var(--pt-txt,12.5px)}'
  +'.mvc-creux-t span{font-size:var(--pt-micro,11px);color:var(--texte-med,#4A4A3A)}'
  +'.mvc-creux-go{display:flex;align-items:center;gap:2px;font-size:var(--pt-micro,11px);font-weight:700;color:var(--terre-tx,var(--terre))}'
  +'.mvc-creux-ch{display:inline-flex;transform:rotate(-90deg)}'
  +'.mvc-compo{display:flex;align-items:center;gap:6px;font-size:var(--pt-micro,11px);color:var(--texte-med,#4A4A3A);background:var(--terre-pale);border-radius:9px;padding:5px 9px;margin:6px 0 2px}'
  +'.mvc-pk-creux{border:1.5px dashed var(--terre)!important;width:100%;text-align:left;font-family:inherit}'
  +'button.mvc-pk-creux{cursor:pointer}'
  +'.mvc-pk-att{display:block;font-size:var(--pt-micro,11px);font-weight:700;color:var(--terre-tx,var(--terre));margin-top:3px;text-align:right}'
  +'.mvv-asm-grp{font-size:var(--pt-nano,9.5px);letter-spacing:1.3px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);font-weight:700;margin:12px 2px 6px}'
  +'.mvv-asm-aoc{font-style:italic}'
  // deux classes : la feuille pose `.mvv-tin{width:100%}` APRES ce style, a la meme force
  +'.mvv-step2 .mvv-asm-l{width:96px;flex:0 0 96px;text-align:center;padding:6px 8px;font-family:\'Cormorant Garamond\',Georgia,serif;font-weight:700;font-size:var(--pt-xl,27px)}'
  +'.mvv-asm-prev{margin-top:12px;background:var(--or-pale);border:1px solid rgba(194,161,77,.4);border-radius:12px;padding:10px 12px;font-size:var(--pt-txt,12.5px);line-height:1.5;color:var(--texte-med,#4A4A3A)}'
  +'.mvv-asm-prev b{color:var(--texte)}'
  +'.mvv-asm-e{margin-top:7px}'
  +'.mvv-asm-w{display:block;margin-top:6px;color:var(--terre-tx,var(--terre));font-weight:600}'
  +'.mvv-asm-err{background:var(--bg-card);border-style:dashed}';
  document.head.appendChild(s);
}

function _apportsRangs(recs){
  var byP = {};
  recs.forEach(function(r){
    if(!r || !r.parcelle) return;
    var o = byP[r.parcelle] || (byP[r.parcelle] = { nom:r.parcelle, caisses:0, kg:0 });
    o.caisses += (r.nb_caisses || 0);
    o.kg += _recKg(r);
  });
  return Object.keys(byP).map(function(n){
    var o = byP[n], p = _vendParcByName(n);
    o.ha = p ? (parseFloat(p.surface) || 0) : 0;
    o.hl = _vendHlKg(o.kg);
    o.hlHa = o.ha > 0 ? o.hl / o.ha : null;
    return o;
  }).sort(function(a,b){ return b.caisses - a.caisses; });
}

// Le pied porte la conversion, en FOURCHETTE. Le rendement en jus n'est pas
// connu avant le pressoir : annoncer un seul chiffre serait plus faux que
// d'annoncer une plage, meme si l'app calcule ailleurs sur le milieu.
function _apportsPied(rs, caches){
  var cfg = _vendCfg();
  var caisses = rs.reduce(function(s,o){ return s + o.caisses; }, 0);
  var kg = rs.reduce(function(s,o){ return s + o.kg; }, 0);
  var rmin = parseFloat(cfg.ratio_min) || 130, rmax = parseFloat(cfg.ratio_max) || 140;
  var h = '<div class="mvap-tot">'
    + '<span><b>' + caisses.toLocaleString('fr-FR') + '</b>caisses pes\u00e9es</span>'
    + '<em>\u00d7 ' + (cfg.poids_caisse_kg || 25) + ' kg</em>'
    + '<span><b>' + Math.round(kg).toLocaleString('fr-FR') + '</b>kilos</span>'
    + '<em>\u00f7 ' + Math.round(rmin) + '\u2013' + Math.round(rmax) + '</em>'
    + '<span class="hl"><b>' + Math.round(kg/rmax) + '\u2013' + Math.round(kg/rmin) + '</b>hectolitres</span>'
    + '</div>'
    + '<div class="mvap-note">Au quai on compte des caisses, pas des hectolitres. La conversion donne une '
    + '<b>fourchette</b> plut\u00f4t qu\u2019un chiffre faux : le rendement en jus n\u2019est jamais connu avant le pressoir.</div>';
  if(caches > 0) h += '<div class="mvap-note">Les ' + rs.length + ' parcelles les plus apport\u00e9es. '
    + caches + ' autre' + (caches > 1 ? 's' : '') + ' plus bas.</div>';
  return h;
}

function _fermLegende(cu, ops, t0, mes, deuxAxes, ets){
  function jour(d){ return Math.round((Date.parse(d) - t0) / 86400000); }
  var h = '<div class="mvfm-lg">'
    + '<span><i class="l" style="background:var(--terre)"></i>densit\u00e9 ramen\u00e9e \u00e0 20 \u00b0C</span>'
    + '<span><i class="d" style="border-top-color:var(--orange)"></i>temp\u00e9rature de cuve'
    + (deuxAxes ? '' : ' (axe de droite masqu\u00e9 sur \u00e9cran \u00e9troit)') + '</span>'
    + ((ets && ets.length) ? '<span><i class="d" style="border-top-color:var(--texte-doux,#5F5F5F)"></i>changement d\u2019\u00e9tat de la cuve</span>' : '')
    + '<span class="mvfm-tap">Touchez la courbe pour lire un relev\u00e9</span>'
    + '</div>';
  if(ops.length){
    h += '<div class="mvfm-ops">';
    ops.forEach(function(o){
      var det = '';
      if(o.type === 'chaptalisation' && o.kg_sucre) det = ' \u00b7 ' + _mvF1(o.kg_sucre) + ' kg de sucre';
      else if(o.temp_c != null) det = ' \u00b7 cible ' + o.temp_c + ' \u00b0C';
      else if(o.dose != null) det = ' \u00b7 ' + o.dose + ' g/hL';
      else if(o.type === 'delestage') det = ' \u00b7 ' + (o.nb || 1) + '\u00d7';
      h += '<span class="mvfm-op"><i></i><b>J' + jour(o.date) + '</b> ' + _escHtml(_vendOpLbl(o.type)) + det + '</span>';
    });
    h += '</div>';
  }
  /* Les passages, dates en jours comme les operations. C'est ce qui rend le
     trait lisible quand deux d'entre eux sont trop proches pour porter leur
     nom sur le graphe : la legende, elle, les nomme TOUS. */
  if(ets && ets.length){
    h += '<div class="mvfm-ets">';
    ets.forEach(function(e){
      h += '<span class="mvfm-et"><i></i><b>J' + jour(e.date) + '</b> '
        + _escHtml(_vendStatLbl(e.statut)) + '</span>';
    });
    h += '</div>';
  }
  var chap = ops.filter(function(o){ return o.type === 'chaptalisation'; });
  if(chap.length) h += '<div class="mvfm-note">Une chaptalisation dat\u00e9e explique une remont\u00e9e de la courbe. '
    + 'Elle est ici dat\u00e9e au m\u00eame endroit que la mesure, on ne la cherche plus.</div>';
  /* ★★ CUV-11 — LA SECONDE EXPLICATION D'UNE REMONTEE. Tant qu'une courbe
     s'arretait au decuvage, une chaptalisation etait la seule cause possible,
     et l'ecran l'ecrivait. Un releve pris APRES le decuvage porte sur la masse
     assemblee, goutte et presse : le pressurage relargue du sucre, et la
     densite remonte sans qu'on ait ajoute un gramme. Le taire ferait chercher
     une chaptalisation qui n'existe pas. */
  /* ★ CUV-13 — LA MEME RAISON AU PRESSURAGE, et c'est la qu'elle se voit le
     plus : le jus de presse rejoint la goutte, et la cuve reste suivie. On lit
     la date du PASSAGE (PARC-1), jamais une date devinee. Le decuvage, s'il a
     eu lieu, garde la priorite : c'est un fait, pas une etape. */
  var _dPr = cu ? _vendStatDeb(cu,'decuvage') : null;
  if(!(cu && _vendDecuvee(cu)) && _dPr && mes.some(function(m){ return m.date > _dPr; }))
    h += '<div class="mvfm-note">Les relev\u00e9s pris <b>apr\u00e8s le pressurage</b> portent sur la masse '
      + 'assembl\u00e9e, goutte et presse\u00a0: la presse relargue du sucre, et la courbe peut '
      + 'remonter sans chaptalisation.</div>';
  if(cu && _vendDecuvee(cu) && mes.some(function(m){ return m.date > cu.decuvage.date; }))
    h += '<div class="mvfm-note">Les relev\u00e9s pris <b>apr\u00e8s le d\u00e9cuvage</b> portent sur la masse '
      + 'assembl\u00e9e, goutte et presse\u00a0: le pressurage relargue du sucre, et la courbe peut '
      + 'remonter sans chaptalisation.</div>';
  var der = _vendMesD20(mes[mes.length-1]);
  var _dsc = _vendDSec(cu);
  if(der <= _dsc) h += '<div class="mvfm-fin"><b>' + Math.round(der) + ' au jour '
    + jour(mes[mes.length-1].date) + '</b> : la cuve est pass\u00e9e sous son seuil de '
    + _mvF1(_dsc) + '. Ce n\u2019est pas un pressentiment, c\u2019est la derni\u00e8re mesure \u2014 '
    + 'seule une analyse de sucres r\u00e9ducteurs la d\u00e9clare s\u00e8che.</div>';
  else if(_vendFaEnCours(cu)) h += '<div class="mvfm-fin"><b>' + Math.round(der)
    + ' au d\u00e9cuvage</b> : la fermentation n\u2019\u00e9tait pas finie, elle se termine en phase '
    + 'liquide. Le seuil de cette cuve est ' + _mvF1(_dsc) + '.</div>';
  return h;
}

function _cuveCouches(cu, recs){
  var mine = (recs || []).filter(function(r){ return r && r.cuve_id === cu.id; });
  var byP = {};
  mine.forEach(function(r){
    var o = byP[r.parcelle] || (byP[r.parcelle] = { nom:r.parcelle, caisses:0, kg:0 });
    o.caisses += _recCsDom(r); o.kg += _recKgDom(r);
  });
  var cs = Object.keys(byP).map(function(n){
    var o = byP[n]; o.hl = _vendHlKg(o.kg); return o;
  }).sort(function(a,b){ return b.hl - a.hl; });
  var plein = cs.reduce(function(s,o){ return s + o.hl; }, 0);
  return { couches: cs, plein: plein, cap: parseFloat(cu.volume_hl) || 0 };
}

function _apTronc(s, n){ s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '\u2026' : s; }

/* Le pied dit l'ASSIETTE du chiffre (§7) : sur quoi porte le pourcentage, et
   ce qui n'y est pas. La ligne « N cuves de plus, visibles sur un ecran plus
   large » a disparu avec la coupe — elle decrivait un chemin qui n'existe
   plus (test du mode d'emploi, §27a). */
function _remplirPied(plein, cap, sansCap, total){
  var h = '';
  if(cap > 0){
    var pct = Math.round(plein / cap * 100);
    h += '<div class="mvcv-ord">La cuverie est remplie \u00e0 <b>' + pct + ' %</b> \u2014 '
      + _mvF1(plein) + ' hL sur ' + _mvF1(cap) + ' hL, ' + total + ' cuve' + (total > 1 ? 's' : '')
      + ' en cours. C\u2019est le chiffre qui dit si la journ\u00e9e de r\u00e9colte de demain peut \u00eatre lanc\u00e9e.</div>';
  }
  h += '<div class="mvcv-note">Chaque apport garde le nom de sa parcelle jusque dans la cuve. '
    + 'Le vide au-dessus, c\u2019est la marge qui reste.</div>';
  if(sansCap > 0) h += '<div class="mvcv-note">' + sansCap + ' cuve' + (sansCap > 1 ? 's' : '')
    + ' sans contenance renseign\u00e9e (trait tiret\u00e9) : ' + (sansCap > 1 ? 'elles ne comptent' : 'elle ne compte')
    + ' pas dans le taux de remplissage.</div>';
  h += '<div class="mvcv-note">Les cuves d\u00e9cuv\u00e9es n\u2019y sont pas : leur vin est parti en f\u00fbt.</div>';
  return h;
}

var _MV_CEP_COUL = {
  'pinot noir':'r','gamay':'r','cesar':'r','pinot meunier':'r','merlot':'r','syrah':'r',
  'cabernet sauvignon':'r','cabernet franc':'r','grenache':'r','malbec':'r','cot':'r',
  'mourvedre':'r','carignan':'r','cinsault':'r','tannat':'r','petit verdot':'r',
  'poulsard':'r','trousseau':'r','nebbiolo':'r','sangiovese':'r','tempranillo':'r',
  'chardonnay':'b','aligote':'b','pinot blanc':'b','pinot gris':'b','melon de bourgogne':'b',
  'sauvignon':'b','sauvignon blanc':'b','semillon':'b','muscadelle':'b','viognier':'b',
  'chenin':'b','riesling':'b','savagnin':'b','gewurztraminer':'b','marsanne':'b',
  'roussanne':'b','ugni blanc':'b','colombard':'b','muscat':'b','sylvaner':'b'
};
// Couleur d'une parcelle. Le cepage tranche ; un choix manuel prime.
// Deux cepages de couleurs differentes : on ne choisit PAS a la place du
// vigneron — la parcelle reste a classer.
function _parcCoul(nom){
  var ov = (_vendCfg().coul_parc || {})[nom];
  if(ov === 'r' || ov === 'b') return ov;
  var p = _vendParcByName(nom); if(!p) return '?';
  var arr = p.cepages || (p.cepage ? [p.cepage] : []);
  var vu = null;
  for(var i = 0; i < arr.length; i++){
    var c = _MV_CEP_COUL[_matNorm(arr[i])];
    if(!c) continue;                    // cepage inconnu : il ne tranche rien
    if(vu && vu !== c) return '?';      // complantation de deux couleurs
    vu = c;
  }
  return vu || '?';
}

// Nom de parcelle passe a un onclick : il vient de la saisie du domaine.
function _mvQ(s){
  var t = String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");   // 1. litteral JS
  t = t.replace(/&/g, '&amp;').replace(/"/g, '&quot;')             // 2. attribut HTML
       .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return "'" + t + "'";
}

// ─────────── MILLÉSIMES (Le Chai) ───────────
/* ★★★ Lot CAVE-6 — LE FILTRE PORTE SUR LE CHAI, PLUS SUR UNE SEULE LISTE.
   Il etait ecrit en tete de renderCaveCuvees : changer d'onglet le faisait
   disparaitre de l'ecran ALORS QU'IL RESTAIT POSE, et le Journal — l'endroit
   ou l'on cherche « qu'a-t-on fait sur le 2025 » — n'en avait aucun.
   Il vit desormais dans #mvc-milbar, sous la barre d'onglets, et les TROIS
   vues s'y accrochent par _caveDansFiltre (la source unique de §20h).
   ⚠️ Un millesime entierement embouteille RESTE proposé : ses bouteilles sont
   en stock et ses operations sont au journal. Mais il n'a plus de cuvee en
   elevage, donc pas de compteur — « 0 » se lirait comme une absence. */
function _caveMilsDuChai(){
  var ms=[];
  (CAVE_ELEVAGE.cuvees||[]).forEach(function(c){
    var m=c&&c.millesime; if(m&&ms.indexOf(m)===-1) ms.push(m);
  });
  ms.sort(function(a,b){return b-a;});
  return ms;
}
function _caveMillChipsHtml(){
  var cuvs=CAVE_ELEVAGE.cuvees||[];
  var act=cuvs.filter(function(c){return c.statut!=='embouteille';});
  var ms=_caveMilsDuChai();
  if(ms.length<2) return '';   // un seul millésime → pas de filtre utile
  var h='<div class="mvcm-chips"><span class="mvcm-lab">Millésime</span>';
  h+='<button class="mvcm-chip'+(_caveMillFilter==='tous'?' on':'')+'" onclick="_caveSetMill(\'tous\')">Tous<span class="mvcm-c">'+act.length+'</span></button>';
  ms.forEach(function(m){
    var n=act.filter(function(c){return String(c.millesime)===String(m);}).length;
    h+='<button class="mvcm-chip'+(String(_caveMillFilter)===String(m)?' on':'')+'" onclick="_caveSetMill(\''+m+'\')">'+m
      +(n?'<span class="mvcm-c">'+n+'</span>':'')+'</button>';
  });
  return h+'</div>';
}
/* L'hote du filtre — meme patron que _caveEnsureBtlTab : l'onglet Bouteilles
   est deja cree en JS a cote de #mvc-tabs-row, on ne touche donc pas au HTML
   de la page pour un bloc qui vit au meme endroit. */
function _caveEnsureMilBar(){
  var ref=document.getElementById('mvc-tabs-row');
  if(ref && !document.getElementById('mvc-milbar')){
    var d=document.createElement('div');
    d.id='mvc-milbar';
    if(ref.nextSibling) ref.parentNode.insertBefore(d,ref.nextSibling); else ref.parentNode.appendChild(d);
  }
}
function _caveMilBarRender(){
  _caveEnsureMilBar();
  var h=document.getElementById('mvc-milbar');
  if(h) h.innerHTML=_caveMillChipsHtml();
}
function _caveSetMill(m){
  _caveMillFilter=m;
  // Les TROIS vues suivent le filtre : repeindre celle qui est a l'ecran.
  if(caveTab==='journal') renderCaveJournal();
  else if(caveTab==='bouteille') renderCaveBouteille();
  else renderCaveCuvees();
  _caveMilBarRender();
  // Sans ce rappel, les chiffres du bandeau restaient sur la cave entiere
  // pendant que la liste, elle, etait filtree.
  if(typeof _mvcRenderHeader==='function') _mvcRenderHeader();
  if(typeof _caveSaisBanner==='function') _caveSaisBanner();
}

// ─────────── MISE EN BOUTEILLE (Le Chai) ───────────
function _caveEnsureBtlTab(){
  var ref=document.getElementById('mvc-tbtn-cuv');
  if(ref && !document.getElementById('mvc-tbtn-bouteille')){
    var b=document.createElement('button');
    b.id='mvc-tbtn-bouteille';
    b.className=ref.className; b.classList.remove('active');
    b.setAttribute('onclick',"switchCaveOng('bouteille')");
    b.innerHTML=_mvIcon('bouteille',16)+' Bouteilles';
    if(ref.nextSibling) ref.parentNode.insertBefore(b,ref.nextSibling); else ref.parentNode.appendChild(b);
  }
  var vref=document.getElementById('mvc-view-cuv');
  if(vref && !document.getElementById('mvc-view-bouteille')){
    var v=document.createElement('div');
    v.id='mvc-view-bouteille'; v.style.display='none';
    if(vref.nextSibling) vref.parentNode.insertBefore(v,vref.nextSibling); else vref.parentNode.appendChild(v);
  }
}
/* ★★★ VOL-1 — LA CHAINE DIT CE QUI EST PASSE, pas la taille des contenants (§152c). */
function _caveBilanChaine(c){
  var cv=_caveCuveSource(c), bp=(c&&c.bilan_perte)||null;
  var recolteKg=null, entHl=null, entSrc=null, sorties=0;
  if(cv){
    var rk=0;
    (CAVE_VENDANGE.recoltes||[]).forEach(function(r){ if(r&&r.cuve_id===cv.id) rk+=_recKgDom(r); });
    if(rk>0) recolteKg=rk;
    sorties=_vendSortiesHl(cv);
    var v=parseFloat(cv.vol_decuve_hl);
    if(cv.decuvage&&isFinite(v)&&v>0){ entHl=v; entSrc=(cv.vol_decuve_src==='mesure')?'mesure':'contenants'; }
  }
  if(recolteKg==null&&bp&&parseFloat(bp.recolteKg)>0) recolteKg=parseFloat(bp.recolteKg);
  var bpe=bp?parseFloat(bp.entonneHl):NaN;
  if(entSrc!=='mesure'&&bp&&bp.entonneSrc==='mesure'&&isFinite(bpe)&&bpe>0){ entHl=bpe; entSrc='mesure'; }
  return { recolteKg:recolteKg,
           // Pas d'arrondi : 474 cols face a 474, pas a 475 (§152c).
           estHl:(recolteKg!=null)?Math.max(0,_vendHlKg(recolteKg)-sorties):null,
           entonneHl:entHl, entonneSrc:entSrc, cuveId:(cv?cv.id:null),
           // ★ ASM-1 — l'apport, a part des kilos (§153d).
           apportHl:((c&&c.apports)||[]).reduce(function(s,a){ return s+(parseFloat(a&&a.l)||0); },0)/100,
           nbBtl:(c&&c.nb_bouteilles!=null)?c.nb_bouteilles:null };
}
/* ★ VOL-2 — un id de degrade par graphe (§153d). */
var _CAVE_BTL_GID=0;
function _caveBtlGraphSvg(ch,nbBtl,w){
  /* ★ VOL-2 — le kg/hL de chaque etape ; l'apport a part (§153d). */
  var steps=[], ent=(ch.entonneHl!=null&&ch.entonneSrc==='mesure'), kg=ch.recolteKg;
  var ap=(ent&&parseFloat(ch.apportHl)>0)?parseFloat(ch.apportHl):0;
  var kgHl=function(hl){ return (kg!=null&&hl>0)?Math.round(kg/hl):null; };
  if(kg!=null) steps.push({lab:'R\u00e9colte',sub:Math.round(kg)+' kg',v:_mvBtl(kg/_mlKgHl()),va:0,r:null});
  if(ch.estHl!=null) steps.push({lab:'En cuve',sub:_mvF1(ch.estHl)+' hL estim\u00e9s',v:_mvBtl(ch.estHl),va:0,r:kgHl(ch.estHl)});
  if(ent) steps.push({lab:'Entonn\u00e9',sub:_mvF1(ch.entonneHl)+(ap?(' + '+_mvF1(ap)):'')+' hL',
                      v:_mvBtl(ch.entonneHl),va:(ap?_mvBtl(ap):0),r:kgHl(ch.entonneHl)});
  else if(steps.length) steps.push({lab:'Entonn\u00e9',sub:'\u00e0 mesurer',v:null,va:0,r:null});
  if(nbBtl!=null){
    var part=(ent&&ap)?ch.entonneHl/(ch.entonneHl+ap):1;   // la part du vin de la cuvee dans les cols
    steps.push({lab:'Bouteilles',sub:nbBtl+' btl',v:nbBtl,va:0,r:kgHl(nbBtl*0.75/100*part)});
  }
  var pleins=steps.filter(function(s){ return s.v!=null; });
  if(pleins.length<2) return '';
  var c=window._mvGraphCadre(w,180,{padL:12,padR:12,padT:34,padB:46});
  var H=c.h,pad=c.padL;
  var bw=Math.min(96,Math.max(24,c.iw/steps.length-10));
  var gap=(c.iw-bw*steps.length)/(steps.length-1||1);
  var max=Math.max.apply(null,pleins.map(function(s){ return s.v+s.va; }))||1, base=H-c.padB, prec=null;
  var gid='mvbgd'+(++_CAVE_BTL_GID);
  var bars=steps.map(function(s,i){
    var x=pad+i*(bw+gap), cx=(x+bw/2).toFixed(1);
    var pied='<text x="'+cx+'" y="'+(base+14)+'" font-size="'+c.txt.mini+'" fill="var(--texte)" text-anchor="middle" font-weight="600">'+s.lab+'</text>'
      +'<text x="'+cx+'" y="'+(base+26)+'" font-size="'+c.txt.mini+'" fill="'+c.col.texte+'" text-anchor="middle">'+s.sub+'</text>'
      +(s.r!=null?('<text x="'+cx+'" y="'+(base+39)+'" font-size="'+c.txt.mini+'" fill="'+c.col.mesure
        +'" text-anchor="middle" font-weight="700">'+s.r+' kg/hL</text>'):'');
    if(s.v==null)
      return '<line x1="'+x.toFixed(1)+'" y1="'+(base-1)+'" x2="'+(x+bw).toFixed(1)+'" y2="'+(base-1)+'" stroke="'+c.col.texte
        +'" stroke-width="1.5" stroke-dasharray="4 3"/>'+pied;
    var h=Math.max(3,(s.v/max)*(base-c.padT)), y=base-h;
    var ha=s.va?Math.max(2,(s.va/max)*(base-c.padT)):0, ya=y-ha;
    // Ecart sur la derniere barre dessinee ; bouteilles face a tout l'entonne.
    var ref=prec?(prec.v+(s.lab==='Bouteilles'?prec.va:0)):0;
    var ec=prec?Math.round((1-s.v/(ref||1))*100):0;
    prec=s;
    return '<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="5" fill="url(#'+gid+')"/>'
      +(ha?('<rect x="'+x.toFixed(1)+'" y="'+ya.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+(ha+4).toFixed(1)+'" rx="5" fill="'
        +c.col.prevu+'" opacity=".38" stroke="'+c.col.prevu+'" stroke-dasharray="3 2"/>'):'')
      +'<text x="'+cx+'" y="'+((ha?ya:y)-14).toFixed(1)+'" font-size="'+c.txt.val+'" font-weight="700" fill="'+c.col.mesure+'" text-anchor="middle">'
        +s.v+(s.va?('<tspan font-size="'+c.txt.mini+'" font-weight="600"> +'+s.va+'</tspan>'):'')+'</text>'
      +(ec?('<text x="'+cx+'" y="'+((ha?ya:y)-2).toFixed(1)+'" font-size="'+c.txt.mini+'" fill="'+c.col.alerte+'" text-anchor="middle">'
        +(ec>0?('\u2212'+ec):('+'+(-ec)))+'%</text>'):'')
      +pied;
  }).join('');
  var g='<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1">'
    +'<stop offset="0" stop-color="'+c.col.prevu+'"/><stop offset="1" stop-color="'+c.col.mesure+'"/></linearGradient></defs>'+bars;
  var eR=steps.filter(function(s){ return s.lab==='Entonn\u00e9'&&s.r!=null; })[0];
  var aria='\u00c9volution du volume en \u00e9quivalent bouteilles, de '+pleins[0].lab.toLowerCase()
    +' \u00e0 '+pleins[pleins.length-1].lab.toLowerCase()+' : '+pleins[0].v+' puis '+pleins[pleins.length-1].v+' cols'
    +(ent?(eR?(', '+eR.r+' kg/hL \u00e0 l\u2019entonnage'):''):' \u2014 volume entonn\u00e9 pas encore mesur\u00e9')
    +(ap?(', dont '+_mvF1(ap)+' hL apport\u00e9s d\u2019une autre cuve'):'')+'.';
  return window._mvGraphSvg(c,aria,g);
}
function renderCaveBouteille(){
  _caveV2InjectCss();
  var el=document.getElementById('mvc-view-bouteille'); if(!el) return;
  // ★ Lot CAVE-6 : les deux listes suivent le filtre millesime du Chai.
  var cuvs=(CAVE_ELEVAGE.cuvees||[]).filter(_caveDansFiltre);
  var act=cuvs.filter(function(c){return c.statut!=='embouteille';});
  var emb=cuvs.filter(function(c){return c.statut==='embouteille';});
  var w=canWrite();
  var html='<div class="mvb-sec">Prêt à mettre en bouteille</div>';
  html+='<div class="mvb-hint">Bouteilles auto = volume élevé × 133,33 (75 cl). Ajustable. Mettre en bouteille sort la cuvée du chai et l\'archive par millésime.</div>';
  if(!act.length){
    html+='<div class="mvb-empty">Aucune cuvée en élevage.</div>';
  } else {
    act.forEach(function(c){
      var hl=_caveVolHl(c), auto=_mvBtl(hl);
      html+='<div class="mvb-card"><div class="mvb-badge">\u2019'+String(c.millesime||'').slice(-2)+'</div>'
        +'<div class="mvb-name">'+_escHtml(c.nom)+'</div>'
        +'<div class="mvb-meta">Millésime '+(c.millesime||'?')+' · '+_caveNbTonneaux(c)+' fûts · '+_mvF1(hl)+' hL élevés</div>'
        +'<div class="mvb-line">théorique <b>'+auto+'</b> bouteilles</div>';
      if(w){
        if(_caveBtlConfirm===c.id){
          html+='<div class="mvb-ask">Mettre « '+_escHtml(c.nom)+' » en bouteille ? Elle quittera le chai.</div>'
            +'<div class="mvb-frow"><div class="mvb-fld"><label>Bouteilles réelles</label><input id="mvb-reel-'+c.id+'" type="number" value="'+auto+'"></div>'
            +'<button class="mvb-yes" onclick="_caveBtlConfirmYes(\''+c.id+'\')">Confirmer</button>'
            +'<button class="mvb-no" onclick="_caveBtlConfirmNo()">Annuler</button></div>';
        } else {
          html+='<div class="mvb-frow"><button class="mvb-btn" onclick="_caveMettreEnBouteille(\''+c.id+'\')">Mettre en bouteille</button></div>';
        }
      }
      html+='</div>';
    });
  }
  html+='<div class="mvb-sec sep">En stock · archive par millésime</div>';
  if(!emb.length){
    html+='<div class="mvb-empty">Aucune cuvée embouteillée.</div>';
  } else {
    window._mvGraphOublier('#mvg-btl-');
    var byM={};
    emb.forEach(function(c){ var m=c.millesime||'?'; (byM[m]=byM[m]||[]).push(c); });
    var mills=Object.keys(byM).sort(function(a,b){return b-a;});
    mills.forEach(function(m){
      var list=byM[m];
      var totBtl=list.reduce(function(s,c){return s+(c.nb_bouteilles||0);},0);
      html+='<div class="mvb-grp"><div class="mvb-grphead">Millésime '+m+' · '+totBtl+' bouteilles</div>';
      list.forEach(function(c){
        // ★ VOL-1 — le vivant d'abord (une mesure saisie apres la mise se voit), le fige en repli.
        var ch=_caveBilanChaine(c);
        var perteTot=(ch.recolteKg!=null&&c.nb_bouteilles)?Math.round((1-c.nb_bouteilles/_mvBtl(ch.recolteKg/_mlKgHl()))*100):null;
        html+='<div class="mvb-card"><div class="mvb-name">'+_escHtml(c.nom)+'</div>'
          +'<div class="mvb-meta">Mis en bouteille'+(c.date_embouteillage?' · '+_caveDateFr(c.date_embouteillage):'')+'</div>'
          +'<div class="mvb-split"><div><div class="mvb-tot">'+(c.nb_bouteilles||0)+'<small>bouteilles en stock</small></div></div>'
          +(perteTot!=null?'<div style="margin-left:auto;text-align:right"><div class="mvb-tot" style="font-size:var(--pt-lg,23px)">\u2212'+perteTot+'%<small>perte récolte → bouteille</small></div></div>':'')
          +'</div>';
        var g=_caveBtlGraphSvg(ch,c.nb_bouteilles!=null?c.nb_bouteilles:null, window._mvGraphW(null));
        if(g){
          (function(ch2,nb,id){ window._mvGraphSuivre('#mvg-btl-'+_mvgId(id), function(lg){ return _caveBtlGraphSvg(ch2,nb,lg); }); })(ch,(c.nb_bouteilles!=null?c.nb_bouteilles:null),c.id);
          html+='<div class="mvb-sec" style="margin:14px 0 0;border:0">Évolution du volume (équiv. bouteilles)</div><div id="mvg-btl-'+_mvgId(c.id)+'"></div>';
        }
        else html+='<div class="mvb-hint" style="margin-top:8px">Chaîne de perte partielle — liez la cuvée à sa cuve de vinification pour l\'afficher.</div>';
        if(w) html+='<div class="mvb-frow"><div class="mvb-fld"><label>Corriger bouteilles</label><input type="number" value="'+(c.nb_bouteilles||0)+'" onchange="_caveBtlEditReel(\''+c.id+'\',this.value)"></div></div>';
        html+='</div>';
      });
      html+='</div>';
    });
  }
  el.innerHTML=html;
}
function _caveMettreEnBouteille(id){
  if(!canWrite()){ showToast('Accès lecture seule','#B85A1A'); return; }
  _caveBtlConfirm=id; renderCaveBouteille();
}
function _caveBtlConfirmNo(){ _caveBtlConfirm=null; renderCaveBouteille(); }
function _caveBtlConfirmYes(id){
  if(!canWrite()){ showToast('Accès lecture seule','#B85A1A'); return; }
  var c=(CAVE_ELEVAGE.cuvees||[]).find(function(x){return x.id===id;}); if(!c) return;
  var hl=_caveVolHl(c);
  var reel=parseInt((document.getElementById('mvb-reel-'+id)||{}).value)||_mvBtl(hl);
  var ch=_caveBilanChaine(c);
  // Les futs de la cuvee redeviennent disponibles : ils sont physiquement vides,
  // vieillis d'un vin. Sans ce retour, le parc fondait a chaque mise en bouteille.
  // ⚠️ AVANT de poser le statut : _mvFutLiberer ignore les cuvees embouteillees.
  var _rendus=0;
  if(typeof window._mvFutLiberer==='function' && window.INTRANTS){
    _rendus=window._mvFutLiberer(c, window.INTRANTS);
    if(_rendus && typeof window.saveIntrants==='function') window.saveIntrants();
  }
  c.statut='embouteille';
  c.nb_bouteilles=reel;
  c.date_embouteillage=_mvToday();
  // ★ VOL-1 — plus de `cuveHl` (la contenance) (§152b).
  c.bilan_perte={recolteKg:ch.recolteKg,estHl:ch.estHl,entonneHl:ch.entonneHl,entonneSrc:ch.entonneSrc,eleveHl:hl};
  _caveBtlConfirm=null;
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  if(window.fbSave) window.fbSave('cave_elevage',CAVE_ELEVAGE);
  // ⚠️ Les CUVES se liberent toutes seules : _caveCuveOcc ignore les cuvees
  //   embouteillees. Rien a ecrire — mais il faut le DIRE, sinon le domaine
  //   croit sa cuve encore prise et n'ose pas la reutiliser.
  var _nc=((c.cuves)||[]).filter(function(x){ return _caveCuve(x&&x.ref); }).length;
  var _rend=[];
  if(_rendus) _rend.push(_rendus+' fût'+(_rendus>1?'s':''));
  if(_nc) _rend.push(_nc+' cuve'+(_nc>1?'s':''));
  showToast('« '+c.nom+' » embouteillée'
    +(_rend.length?(' — '+_rend.join(' et ')+' de retour au parc'):' — retirée du chai'),'#C0845A');
  if(typeof _mvcRenderHeader==='function') _mvcRenderHeader();
  renderCaveBouteille();
}
function _caveBtlEditReel(id,val){
  if(!canWrite()){ showToast('Accès lecture seule','#B85A1A'); return; }
  var c=(CAVE_ELEVAGE.cuvees||[]).find(function(x){return x.id===id;}); if(!c) return;
  c.nb_bouteilles=parseInt(val)||0;
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  if(window.fbSave) window.fbSave('cave_elevage',CAVE_ELEVAGE);
  renderCaveBouteille();
}
window._caveSetMill         = _caveSetMill;
window._caveEnsureBtlTab    = _caveEnsureBtlTab;
window.renderCaveBouteille  = renderCaveBouteille;
window._caveMettreEnBouteille = _caveMettreEnBouteille;
window._caveBtlConfirmYes   = _caveBtlConfirmYes;
window._caveBtlConfirmNo    = _caveBtlConfirmNo;
window._caveBtlEditReel     = _caveBtlEditReel;


// ── expositions refonte élevage (mvc) ──
window.switchCaveOng     = switchCaveOng;
window.renderCaveCuvees  = renderCaveCuvees;
window.renderCaveJournal = renderCaveJournal;
window.renderCaveReglages= renderCaveReglages;
window.setCaveJFilter    = setCaveJFilter;
// Consommees par pilotage.js : une seule definition du « dernier soutirage ».
window._caveSoutOps      = _caveSoutOps;
window._caveLastSout     = _caveLastSout;
window._caveQuickOp      = _caveQuickOp;
window._caveOuillerTous  = _caveOuillerTous;
window._caveSeuilStep    = _caveSeuilStep;
// Appelees depuis les onclick inline des lignes « par millesime ».
// Sans export, le build IIFE les rend introuvables et le bouton est muet.
// Consommee par pilotage.js (onglet Cave) : le seuil affiche a cote de chaque
// millesime doit etre CELUI du Chai, pas une seconde regle qui divergerait.
window._caveSeuilOu      = _caveSeuilOu;
window._caveMilsEnCave   = _caveMilsEnCave;
window._caveSeuilMilStep = _caveSeuilMilStep;
window._caveSeuilMilReset= _caveSeuilMilReset;
window._caveFutL         = _caveFutL;
window._caveFutHl        = _caveFutHl;
window._caveFutPrompt    = _caveFutPrompt;
// ── Le parc a cuves ────────────────────────────────────────────────────────
// ⚠️ C15 : ces fonctions ne sont appelees que depuis des onclick, donc depuis
//   le HTML. Sans exposition elles seraient comptees MORTES — et surtout,
//   elles ne seraient pas appelables.
window.MV_CUVE_MAT       = MV_CUVE_MAT;
window.MV_CUVE_MATS      = MV_CUVE_MATS;
window._caveMat          = _caveMat;
window._caveMatKey       = _caveMatKey;
window._caveParc         = _caveParc;
window._caveCuve         = _caveCuve;
window._caveCuveOcc      = _caveCuveOcc;
window._caveVolCuvesL    = _caveVolCuvesL;
// ★ _caveVolL / _caveVolHl / _caveOuille sont lues par pilotage.js (charge
//   APRES cave.js dans l'ordre d'import), par window — comme _mvFutParc et
//   _mvFutLiberer, qui vivent aussi hors d'utils.js.
//   ⚠️ Un lot precedent notait « a deplacer dans utils.js au prochain bump ».
//   DECISION PRISE, on ne deplace pas : le passage par window est le motif
//   deja etabli pour le pont cave -> pilotage, et un deplacement sans besoin
//   n'apporte que du risque de regression sur un fichier de 470 ko.
window._caveVolL         = _caveVolL;
window._caveVolHl        = _caveVolHl;
window._caveFutsL        = _caveFutsL;
window._caveTonL         = _caveTonL;
window._caveHorsFormat   = _caveHorsFormat;
window._caveLTxt         = _caveLTxt;
window._caveOuille       = _caveOuille;
window._caveEstMixte     = _caveEstMixte;
window._caveCuvesBois    = _caveCuvesBois;
window._caveContenantsStr= _caveContenantsStr;
window._caveContenantsHtml=_caveContenantsHtml;
window._cavePkOpen       = _cavePkOpen;
window._cavePkClose      = _cavePkClose;
window._cavePkMatSet     = _cavePkMatSet;
window._cavePkPrev       = _cavePkPrev;
window._cavePkSave       = _cavePkSave;
window._cavePkDel        = _cavePkDel;
window._caveAffOpen      = _caveAffOpen;
window._caveAffBack      = _caveAffBack;
window._caveAffSel       = _caveAffSel;
window._caveAffPrev      = _caveAffPrev;
window._caveAffSave      = _caveAffSave;
window._caveAffRetirer   = _caveAffRetirer;
window._mvcRenderHeader  = _mvcRenderHeader;

// ════════════════════════════════════════════════════════════════════════════
// LE MILLESIME — la section de LECTURE de la Cave, a cote d'Aujourd'hui, du
// Chai et du Cuvier.
//
// Une vue : « La ligne de vie » -> le parcours du millesime, de la vigne a la
// bouteille. L'agenda des 4 semaines (_mlAgenda, ex-« Ce qui vient ») vit
// desormais dans l'onglet Aujourd'hui (lot CAVE-1), mais son moteur reste ici.
//
// AUCUNE SAISIE NOUVELLE. Tout se deduit de ce qui est deja enregistre :
// last_ouillage, mesures_fa, operations d'ouillage, recoltes, cuves, decuvages.
// Seule exception, signalee a l'ecran : p.rdt_max (rendement maximum de
// l'appellation), un reglage pose une fois par parcelle, admin only.
//
// PRINCIPE DE NON-DUPLICATION : ce bloc n'a AUCUNE copie privee. Il appelle
// _caveNbTonneaux / _caveFutHl / _caveAlerts / _recKg / _vendMesD20 /
// _vendParcByName / _vendSaveParcelles / _mvBtl / _mvF1 / _vendCfg, et pour la
// campagne, window._mvCampagneDe (utils.js), la meme que _arcCampagneDe du
// Pilotage. Deux definitions du meme concept = incoherence garantie.
// ════════════════════════════════════════════════════════════════════════════

var _mlTab = 'vie';         // 'vie' (La ligne de vie) | 'crb' (Les courbes, lot CAVE-3)          // 'vie' seul : « Ce qui vient » est devenu l'onglet Aujourd'hui de la Cave (lot CAVE-1)
var _mlMil = null;           // millesime consulte ; null = campagne en cours
var _ML_SEM = 4;             // horizon de l'agenda, en semaines
/* ★ CUV-8 : ce n'est plus LE seuil, c'est le REPLI. Une cuve dont on ne peut
   pas lire le degre potentiel du mout n'a pas de seuil a elle : elle prend
   celui-ci, et l'ecran ecrit « seuil general » a cote. Voir _vendDSec. */
var _ML_D20_SEC = 996;       // densite 20 C : repli quand le degre est inconnu

// ★★ AXE-1 — LE MOIS D'OUVERTURE DE LA CAMPAGNE, POUR LES REPLIS DE CE FICHIER.
// utils.js porte la source unique (_mvCampagneMois). Ici on ne redefinit pas
// l'axe : on lit le MEME reglage quand la source n'est pas encore chargee.
// ⚠️ Sans ca, un repli fige a 8 rendrait un millesime faux les mois qui
//    separent les deux mois d'ouverture — deux mois par an, sans rien afficher.
function _mvCampMoisRepli(){
  if(typeof window!=='undefined' && typeof window._mvCampagneMois==='function'){
    try{ return window._mvCampagneMois(); }catch(e){ if(window.logError) window.logError({level:'info',cat:'cave',msg:'axe campagne illisible \u2014 repli sur le defaut'}); }
  }
  var v=parseInt((((typeof window!=='undefined'&&window.CONFIG)||{}).eco||{}).campagne_mois,10);
  return (isNaN(v)||v<0||v>11)?7:v;
}

// ── dates ────────────────────────────────────────────────────────────────
function _mlD(iso){ var p=String(iso).split('-'); return new Date(+p[0],+p[1]-1,+p[2]); }
function _mlIso(d){
  var m=String(d.getMonth()+1), j=String(d.getDate());
  return d.getFullYear()+'-'+(m.length<2?'0'+m:m)+'-'+(j.length<2?'0'+j:j);
}
function _mlAuj(){ return _mlIso(new Date()); }
function _mlAddJ(iso,n){ var d=_mlD(iso); d.setDate(d.getDate()+n); return _mlIso(d); }
function _mlEcartJ(a,b){ return Math.round((_mlD(b)-_mlD(a))/86400000); }
function _mlLundi(iso){ var d=_mlD(iso); d.setDate(d.getDate()-((d.getDay()+6)%7)); return _mlIso(d); }
var _ML_MOIS=['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];
var _ML_JOURS=['dim','lun','mar','mer','jeu','ven','sam'];
function _mlFrJ(iso){ var d=_mlD(iso); return _ML_JOURS[d.getDay()]+' '+d.getDate(); }
function _mlFrC(iso){ var d=_mlD(iso); return d.getDate()+' '+_ML_MOIS[d.getMonth()]; }

// Millesime de la campagne en cours. Repli local si utils.js est anterieur a ce
// lot : un cave.js neuf avec un utils.js ancien ne doit pas planter.
function _mlCampagne(){
  if(typeof window._mvCampagneDe==='function') return window._mvCampagneDe(_mlAuj());
  /* ★ AXE-1 : le repli lit le meme reglage que la source unique. Un repli qui
     garde 8 en dur pendant que l'app est reglee sur octobre produit un
     millesime faux DEUX MOIS PAR AN, en silence. */
  var md=_mvCampMoisRepli()+1;
  var p=_mlAuj().split('-'); return (+p[1]>=md)?(+p[0]):(+p[0]-1);
}
function _mlMilActif(){ return _mlMil!=null?_mlMil:_mlCampagne(); }
// Le millesime affiche son propre seuil : _mlSeuil prend la cuvee quand on
// l'a, et retombe sur le global sinon (appels anciens sans argument).
function _mlSeuil(c){ return _caveSeuilOu(c!=null?c:null); }
// kg de raisin par hL de vin fini : la moyenne des bornes deja reglees au Cuvier.
function _mlKgHl(){ var c=_vendCfg(); return ((c.ratio_min||130)+(c.ratio_max||140))/2; }
function _mlHlCuvee(c){ return Math.round(_caveVolHl(c)*10)/10; }
// ⚠️ « En fût » etait ecrit en dur : faux des qu'une part du millesime dort en
//   cuve. Les deux libelles sont DERIVES de ce que le millesime porte vraiment.
//   Tant qu'aucune cuve n'est logee, ils rendent exactement le texte d'avant.
function _mlCuvesDuMil(ch){
  return ((ch&&ch.cuvees)||[]).filter(function(c){ return c&&c.statut!=='embouteille'; })
    .reduce(function(s,c){ return s+(((c.cuves)||[]).length); },0);
}
function _mlEleveLab(ch){ return _mlCuvesDuMil(ch) ? 'En \u00e9levage' : 'En f\u00fbt'; }
function _mlEleveSub(ch){
  var nc=_mlCuvesDuMil(ch), p=[];
  if(ch&&ch.futs) p.push(ch.futs+' f\u00fbts');
  if(nc) p.push(nc+' cuve'+(nc>1?'s':''));
  return p.length?p.join(' \u00b7 '):'\u2014';
}
function _mlNomCuvee(c){
  // Deux cuvees peuvent porter le MEME nom sur deux millesimes : seul l'id est
  // unique. Sans le millesime, l'agenda affiche deux lignes indiscernables.
  return (c.nom||'')+' \u2019'+String(c.millesime||'').slice(-2);
}

// ── CE QUI VIENT ─────────────────────────────────────────────────────────

// Volume d'ouillage par fut, deduit des ouillages deja saisis pour cette cuvee.
// Repli : moyenne du domaine, puis 7 L. Rien a renseigner.
function _mlVolParFut(cuvId){
  var v=[], all=[];
  (CAVE_ELEVAGE.operations||[]).forEach(function(o){
    if(!o||o.type!=='ouillage'||!o.data) return;
    // ★ FUT-CAP-2 — par PIECE au format du domaine quand l'ouillage le dit ; un
    //   ouillage d'avant ce lot n'a que vol_par_fut_L, juste pour une cuvee en pieces.
    var x=o.data.vol_par_eq_L||o.data.vol_par_fut_L;
    if(!x) return;
    all.push(x);
    // ⚠ BUG CORRIGE : le champ s'appelle cuvees_ids (cuvee_id au singulier
    // pour les operations anciennes). « o.cuvees » ne matchait JAMAIS, donc
    // la fonction retombait toujours sur la moyenne de TOUS les ouillages du
    // domaine — le volume propose pour un fut de 2026 etait calcule sur le
    // 2025. Un millesime ne s'ouille pas au rythme d'un autre.
    var _ids=o.cuvees_ids||(o.cuvee_id?[o.cuvee_id]:[]);
    if(_ids.indexOf(cuvId)>=0) v.push(x);
  });
  var arr=v.length?v:all;
  if(!arr.length) return 7;
  return Math.round(arr.reduce(function(s,x){return s+x;},0)/arr.length*10)/10;
}

// Echeances d'ouillage a venir. Jamais ouillee = due aujourd'hui.
function _mlOuillages(from,nSem){
  var fin=_mlAddJ(from,nSem*7-1), out=[];
  (CAVE_ELEVAGE.cuvees||[]).forEach(function(c){
    if(!c||c.statut==='embouteille') return;
    // ⚠️ Lisait `_caveNbTonneaux(c)` : correct pour l'inox par accident, faux
    //   pour un foudre bois, qui s'ouille et serait sorti de l'agenda.
    if(!_caveOuille(c)) return;
    // ⚠ Le seuil se calcule DANS la boucle : un 2026 revient tous les 7 jours
    // quand un 2025 revient tous les 14. Hors boucle, l'agenda des quatre
    // semaines cadençait toute la cave au meme rythme.
    var seuil=_mlSeuil(c);
    var d = c.last_ouillage ? _mlAddJ(c.last_ouillage,seuil) : from;
    var retard = c.last_ouillage ? Math.max(0,_mlEcartJ(d,from)) : 0;
    if(retard>0) d=from;
    // ⚠️⚠️ `futs` n'etait DECLARE NULLE PART : `_mlOuillages` levait un
    //   ReferenceError des la premiere cuvee ouillable, et emportait tout
    //   l'agenda du millesime avec lui. Le defaut est anterieur a CUV-1.
    var garde=0, futs=_caveNbTonneaux(c);
    while(d<=fin && garde++<12){
      out.push({cuvee:c, date:d, futs:futs,
                // ★ FUT-CAP-2 — chaque fut a sa contenance : un demi-muid compte pour 2,2 pieces.
                litres:Math.round(_caveFutsL(c)/_caveFutL()*_mlVolParFut(c.id)),
                retard:(d===from)?retard:0,
                jamais:(!c.last_ouillage && d===from)});
      d=_mlAddJ(d,seuil);
    }
  });
  return out.sort(function(a,b){ return a.date<b.date?-1:a.date>b.date?1:0; });
}

// Fin de fermentation estimee.
// DEUX pentes, volontairement distinctes :
//   penteMoy (3 derniers releves) -> PROJETTE la date
//   penteRec (2 derniers releves) -> DETECTE l'arret
// Une moyenne sur 3 points lisse le decrochage recent, c'est exactement ce qu'il
// ne faut pas lisser quand une fermentation s'arrete.
// Une cuve de moins de 3 jours ou de moins de 3 releves n'est pas projetable :
// la FA demarre lentement puis accelere, une pente de depart donnerait une date
// fausse avec l'autorite d'un calcul.
// ── Projection de fin de MALO sur les valeurs mesurees ───────────────
// ⚠ MODELE ARBITRE PAR NICO : chaque cuvee a SA malo. On ne projette pas
// sur la duree des FML passees du domaine — on projette sur la decroissance
// de l'acide malique REELLEMENT mesuree sur cette cuvee-la.
// Meme mecanique que _mlProjFA, pour la meme raison :
//   · penteMoy sur 3 releves  -> PROJETTE la date de fin
//   · penteRec sur 2 derniers -> DETECTE l'arret
// Une moyenne sur 3 points lisse le decrochage recent : c'est exactement ce
// qu'il ne faut pas lisser quand une malo se bloque.
// ⚠ Sous 3 mesures, AUCUNE projection : la malo demarre lentement puis
// accelere, une pente de depart donnerait une date fausse avec l'autorite
// d'un calcul. Meme garde que la FA.
var _ML_MAL_FIN = 0.10;   // g/L — seuil oenologique de malo achevee
var _ML_MAL_PRES = 0.30;  // g/L — en dessous, elle touche a sa fin

// Les mesures de malique d'une cuvee, dans l'ordre, depuis les analyses.
function _mlMesMalo(cuveeId){
  var ops=(CAVE_ELEVAGE&&CAVE_ELEVAGE.operations)||[], out=[];
  ops.forEach(function(o){
    if(!o||o.type!=='analyse'||!o.date||!o.data) return;
    var v=o.data.malique;
    if(v==null||isNaN(v)) return;
    var ids=(o.cuvees_ids&&o.cuvees_ids.length)?o.cuvees_ids:(o.cuvee_id?[o.cuvee_id]:[]);
    if(ids.indexOf(cuveeId)===-1) return;
    out.push({date:o.date, val:parseFloat(v)});
  });
  out.sort(function(a,b){ return a.date<b.date?-1:(a.date>b.date?1:0); });
  // Un meme jour reanalyse : on garde la derniere valeur saisie.
  var f=[];
  out.forEach(function(m){
    if(f.length&&f[f.length-1].date===m.date) f[f.length-1]=m; else f.push(m);
  });
  return f;
}

// ⚠ C15 : ses seuls appelants sont dans pilotage.js. Une declaration serait
// comptee MORTE par le preflight, qui raisonne fichier par fichier.
window._mlProjMalo = function(c,now){
  now=now||_mlAuj();
  if(!c||!c.id) return {etat:'attente'};
  var m=_mlMesMalo(c.id);
  if(!m.length) return {etat:'attente', n:0};
  var last=m[m.length-1], vl=last.val;
  if(vl<=_ML_MAL_FIN) return {etat:'finie', mal:vl, dernier:last.date, n:m.length};
  if(m.length<3) return {etat:'demarrage', mal:vl, dernier:last.date, n:m.length,
                         proche:vl<=_ML_MAL_PRES};
  var a=m[m.length-2], b=last;
  var jRec=_mlEcartJ(a.date,b.date)||1;
  var penteRec=(a.val-b.val)/jRec;                       // g/L par jour, positif si ca descend
  var p3=m.slice(-3);
  var jMoy=_mlEcartJ(p3[0].date,p3[2].date)||1;
  var penteMoy=(p3[0].val-p3[2].val)/jMoy;
  var r4=function(x){ return Math.round(x*1000)/1000; };
  // ⚠ Le malique qui REMONTE n'est pas une malo bloquee : il ne se recree
  // pas. C'est une erreur de saisie ou une confusion de cuvee. Annoncer un
  // blocage enverrait rechauffer une cuve alors que le probleme est dans la
  // donnee. Ce test passe donc AVANT celui du blocage. Le seuil de 0,05 g/L
  // laisse passer le bruit analytique, qui lui reste un blocage.
  if((b.val-a.val)>0.05 || penteMoy<0)
    return {etat:'irreguliere', mal:vl, dernier:last.date, n:m.length,
            monte:r4(b.val-a.val)};
  // Bloquee : la decroissance recente est quasi nulle alors qu'il reste du
  // malique. Seuil exprime en g/L/jour, calibre sur une malo lente (0,02).
  if(penteRec<0.005) return {etat:'bloquee', mal:vl, pente:r4(penteRec), penteMoy:r4(penteMoy),
                             dernier:last.date, stableJ:jRec, n:m.length};
  if(penteMoy<=0) return {etat:'irreguliere', mal:vl, dernier:last.date, n:m.length};
  var jours=(vl-_ML_MAL_FIN)/penteMoy;
  if(!(jours>=0)||jours>365) return {etat:'irreguliere', mal:vl, dernier:last.date, n:m.length};
  return {etat:'normal', mal:vl, pente:r4(penteMoy), penteRec:r4(penteRec),
          jours:Math.round(jours), date:_mlAddJ(last.date,Math.round(jours)),
          marge:Math.max(1,Math.round(jours*0.3)), dernier:last.date, n:m.length,
          mesures:m.slice(-8)};
};
window._mlMesMalo=_mlMesMalo;
window._ML_MAL_FIN=_ML_MAL_FIN;
function _mlProjFA(c,now){
  now=now||_mlAuj();
  // ⚠ CUV-7 : la cinétique se lit sur les densités. Un relevé de tournée sans
  //   densité (température seule, pigeage seul) n'est pas un point de courbe.
  var m=_vendTriMes(c).filter(function(x){ return x && x.densite!=null; });
  if(!m.length) return {etat:'attente'};
  var last=m[m.length-1], dl=_vendMesD20(last), dernier=last.date;
  if(dl==null) return {etat:'attente'};
  var _ds=_vendDSec(c);
  if(dl<=_ds) return {etat:'sec', d20:dl, dernier:dernier, dSec:_ds};
  var jCuve=c.date_entree?_mlEcartJ(c.date_entree,now):99;
  /* ★ PARC-1 — le garde « demarrage » comptait depuis l'ENCUVAGE : cinq jours
     de maceration a froid passaient pour cinq jours de fermentation, et la
     projection s'ouvrait sur une cuve qui n'avait pas commence. Il compte
     desormais depuis le debut de FA quand on le connait — a defaut,
     l'ancien comportement, a l'identique. `jCuve` garde son sens (temps en
     cuve), parce que l'agenda l'affiche sous ce nom. */
  var _faD=_vendStatDeb(c,'fa');
  var jFA=_faD?_mlEcartJ(_faD,now):jCuve;
  if(m.length<3 || jFA<3) return {etat:'demarrage', d20:dl, dernier:dernier, jCuve:jCuve, jFA:jFA};
  var a=m[m.length-2], b=last;
  var penteRec=(_vendMesD20(a)-_vendMesD20(b))/(_mlEcartJ(a.date,b.date)||1);
  var p3=m.slice(-3);
  var penteMoy=(_vendMesD20(p3[0])-_vendMesD20(p3[2]))/(_mlEcartJ(p3[0].date,p3[2].date)||1);
  if(penteRec<1.5) return {etat:'ralentit', d20:dl, pente:Math.round(penteRec*10)/10,
                           penteMoy:Math.round(penteMoy*10)/10, dernier:dernier,
                           stableJ:_mlEcartJ(a.date,b.date)};
  /* ★ CUV-8 : la fin se projette sur le seuil de CETTE cuve, plus sur 995 —
     un nombre qui n'etait meme pas celui du reste de l'ecran (996). */
  var jours=(dl-_ds)/penteMoy;
  return {etat:'normal', d20:dl, pente:Math.round(penteMoy*10)/10,
          jours:Math.max(0,Math.round(jours*10)/10),
          date:_mlAddJ(dernier,Math.max(0,Math.round(jours))),
          marge:Math.max(1,Math.round(jours*0.3)), dernier:dernier};
}

function _mlAMesurer(from){
  return (CAVE_VENDANGE.cuves_vinif||[]).filter(function(c){
    if(!c||!_vendSuivie(c)) return false;
    var l=_vendLastMes(c); if(!l) return true;
    return _mlEcartJ(l.date,from)>=1;
  }).map(function(c){
    var l=_vendLastMes(c);
    return {cuve:c, depuis:l?_mlEcartJ(l.date,from):999};
  });
}

// Agenda groupe par semaine calendaire.
function _mlAgenda(from,nSem){
  var sem=[], l0=_mlLundi(from), i;
  for(i=0;i<nSem;i++){ var lu=_mlAddJ(l0,i*7); sem.push({lundi:lu, dim:_mlAddJ(lu,6), items:[]}); }
  function pousse(d,item){
    for(var k=0;k<sem.length;k++){
      if(d>=sem[k].lundi && d<=sem[k].dim){ item.date=d; sem[k].items.push(item); return true; }
    }
    return false;
  }
  _mlOuillages(from,nSem).forEach(function(o){
    var note = o.jamais ? 'jamais ouill\u00e9e depuis l\u2019entonnage'
             : o.retard ? ('en retard de '+o.retard+' j') : '';
    pousse(o.date,{kind:'ouillage', titre:_mlNomCuvee(o.cuvee),
      detail:o.futs+' f\u00fbt'+(o.futs>1?'s':'')+' \u00b7 ~'+o.litres+' L',
      urgence:(o.retard||o.jamais)?'due':'', note:note, futs:o.futs, ref:o.cuvee.id});
  });
  (CAVE_VENDANGE.cuves_vinif||[]).forEach(function(c){
    if(!c||!_vendIsActive(c)) return;
    var p=_mlProjFA(c,from);
    if(p.etat==='normal'&&p.date) pousse(p.date,{kind:'fa', titre:c.nom,
      detail:'fin de fermentation estim\u00e9e \u00b7 \u00b1 '+p.marge+' j',
      note:'densit\u00e9 '+Math.round(p.d20)+' \u00b7 \u2212'+p.pente+' pts/j', ref:c.id});
    if(p.etat==='ralentit') pousse(from,{kind:'alerte', titre:c.nom,
      detail:'densit\u00e9 '+Math.round(p.d20)+', \u2212'+p.pente+' pt/j sur les '+p.stableJ+' derniers jours',
      note:'la fermentation ralentit \u2014 \u00e0 contr\u00f4ler', urgence:'due', ref:c.id});
    if(p.etat==='sec') pousse(from,{kind:'decuvage', titre:c.nom,
      detail:'vin sec (densit\u00e9 '+Math.round(p.d20)+') \u2014 d\u00e9cuvage possible', ref:c.id});
    if(p.etat==='demarrage') pousse(from,{kind:'demarrage', titre:c.nom,
      detail:'en cuve depuis '+p.jCuve+' j \u00b7 densit\u00e9 '+Math.round(p.d20),
      note:'trop t\u00f4t pour estimer la fin', ref:c.id});
    var lm=_vendLastMes(c);
    if(lm&&lm.temp_c>=29) pousse(from,{kind:'alerte', titre:c.nom,
      detail:lm.temp_c+' \u00b0C au dernier relev\u00e9', note:'temp\u00e9rature haute',
      urgence:'warn', ref:c.id});
  });
  _mlAMesurer(from).forEach(function(x){
    pousse(from,{kind:'mesure', titre:x.cuve.nom,
      detail:x.depuis>900?'aucun relev\u00e9':('dernier relev\u00e9 il y a '+x.depuis+' j'),
      urgence:x.depuis>=2?'due':'', ref:x.cuve.id});
  });
  // Ordre d'affichage. ATTENTION : ne jamais ecrire (ordre[k]||9) — 'alerte' vaut
  // 0 et 0||9 rend 9, ce qui envoie l'alerte en DERNIER, sous les ouillages.
  var ordre={alerte:0,mesure:1,fa:2,decuvage:3,demarrage:4,ouillage:5};
  sem.forEach(function(s){
    s.items.sort(function(a,b){
      if(a.date!==b.date) return a.date<b.date?-1:1;
      var oa=(ordre[a.kind]!=null?ordre[a.kind]:9), ob=(ordre[b.kind]!=null?ordre[b.kind]:9);
      return oa-ob;
    });
  });
  return sem;
}

function _mlResumeSem(s){
  var r={futs:0,litres:0,alertes:0,mesures:0,n:s.items.length};
  s.items.forEach(function(i){
    if(i.kind==='ouillage'){ r.futs+=i.futs||0; r.litres+=Math.round((i.futs||0)*7); }
    if(i.kind==='alerte') r.alertes++;
    if(i.kind==='mesure') r.mesures++;
  });
  // litres : on repasse par le detail deja calcule plutot que par une moyenne fixe
  r.litres=0;
  s.items.forEach(function(i){
    if(i.kind!=='ouillage') return;
    var m=String(i.detail).match(/~(\d+) L/); if(m) r.litres+=parseInt(m[1],10)||0;
  });
  return r;
}

// ── LA LIGNE DE VIE ──────────────────────────────────────────────────────

function _mlRecoltesDe(mil){
  return (CAVE_VENDANGE.recoltes||[]).filter(function(r){
    return r && String(r.date||'').slice(0,4)===String(mil);
  });
}

function _mlChaine(mil){
  var kgHl=_mlKgHl();
  var recs=_mlRecoltesDe(mil);
  var kgTot=0, kgVendu=0, haTot=0, vus={};
  recs.forEach(function(r){
    var kg=_recKg(r); kgTot+=kg; if(_recSold(r)) kgVendu+=kg;
    var p=_vendParcByName(r.parcelle);
    if(p&&!vus[p.nom]){ vus[p.nom]=1; haTot+=(parseFloat(p.surface)||0); }
  });
  var ids={}; recs.forEach(function(r){ if(r.cuve_id) ids[r.cuve_id]=1; });
  var cuves=(CAVE_VENDANGE.cuves_vinif||[]).filter(function(c){ return c&&ids[c.id]; });
  /* ★ RDT-1 — les deux etages du parcours annonçaient la CONTENANCE des cuves.
     En cuve : l'estimation d'apres les caisses du domaine, comme la jauge de
     remplissage. Decuve : le volume reellement loge. */
  var hlCuve=cuves.filter(function(c){ return c.statut!=='termine'; })
                  .reduce(function(s,c){ return s+_vendHlKg(_vendCuvKgDom(c.id)); },0);
  var hlDecuve=cuves.filter(function(c){ return c.statut==='termine'; })
                    .reduce(function(s,c){ return s+_vendVolLoge(c)+_vendPrelevHl(c); },0);   // ASM-1
  var cuvees=(CAVE_ELEVAGE.cuvees||[]).filter(function(c){ return String(c.millesime)===String(mil); });
  var enFut=cuvees.filter(function(c){ return c.statut!=='embouteille'; });
  var hlFut=enFut.reduce(function(s,c){ return s+_mlHlCuvee(c); },0);
  var nFuts=enFut.reduce(function(s,c){ return s+_caveNbTonneaux(c); },0);
  var nBtl=cuvees.reduce(function(s,c){ return s+(c.nb_bouteilles||0); },0);
  var retro=false;
  // Millesime anterieur au suivi du Cuvier : aucune recolte saisie, mais le bilan
  // a ete fige a la mise en bouteille. On le relit plutot que d'afficher zero.
  if(!recs.length && cuvees.length){
    var bp={kg:0,cuve:0,eleve:0,vu:false};
    cuvees.forEach(function(c){
      var b=c.bilan_perte; if(!b) return; bp.vu=true;
      /* ★ VOL-1 — `cuveHl` ne compte plus (§152b). */
      var _en=parseFloat(b.entonneHl);
      bp.kg+=(b.recolteKg||0); bp.cuve+=((isFinite(_en)&&_en>0)?_en:(b.eleveHl||0)); bp.eleve+=(b.eleveHl||0);
    });
    if(bp.vu){ kgTot=bp.kg; hlDecuve=Math.round(bp.cuve); hlFut=bp.eleve; retro=true; }
  }
  return {millesime:mil, retro:retro, parcelles:Object.keys(vus).length,
          ha:Math.round(haTot*100)/100, kg:kgTot, kgVendu:kgVendu, kgCuve:kgTot-kgVendu,
          kgHl:kgHl, cuves:cuves, hlCuve:Math.round(hlCuve), hlDecuve:Math.round(hlDecuve),
          cuvees:cuvees, futs:nFuts, hlFut:Math.round(hlFut*10)/10, btl:nBtl};
}

/* ═══════════════════════════════════════════════════════════════════════════
   ★★★ LE RENDEMENT MOYEN A ETE FAUX DE TROIS FACONS DIFFERENTES.

   1. Le Pilotage divisait `hlDecuve` par la surface. `hlDecuve` ne compte que
      les cuves au statut `termine` : tant que rien n'est decuve, il vaut 0. La
      carte affichait donc « 0 hL/ha » sous un bandeau annoncant « 162 hL en
      cuve » et au-dessus de parcelles a 44 hL/ha.
   2. Le bilan de campagne, lui, estimait d'apres les kilos : ~18 hL/ha sur les
      memes donnees. Une grandeur, deux verites, deux ecrans.
   3. ⚠️⚠️ ET LA PREMIERE CORRECTION (§91b) ETAIT FAUSSE AUSSI. Elle additionnait
      `hlDecuve + hlCuve` — soit le volume LOGE AU DOMAINE — et le divisait par
      la surface TOTALE recoltee. Or le raisin vendu ne passe jamais en cuve :
      9 370 kg sur 29 t, un tiers de la vendange, sortaient du numerateur en
      gardant leur surface au denominateur. Le chiffre tombait a 13,7 hL/ha
      pendant que les parcelles juste dessous annoncaient 24 a 48.
      *Nico l'a vu tout de suite : « rien de decuve, je ne comprends pas ».*

   4. ⚠️⚠️ ET LA DEUXIEME CORRECTION (§92) N'ALLAIT PAS AU BOUT. Elle divisait
      TOUT le raisin par TOUTE la surface : le rendement agronomique de la
      vigne, celui que l'arrete plafonne — c'est juste pour la LISTE par
      parcelle, mais ce n'est pas ce que le domaine rentre. Or la surface
      achetee par chaque acheteur EST SAISIE : `_vendSurfParc` en deduit deja
      la part du domaine (`src:'reste'`). L'information existait, personne ne
      la lisait ici.

   ★★★ DEUX GRANDEURS DISTINCTES, ET ELLES DOIVENT LE RESTER :
     \u2022 la LIGNE d'une parcelle = tout son raisin / toute sa surface. C'est ce
       que l'arrete plafonne, quel que soit l'acheteur.
     \u2022 la MOYENNE du domaine = ce que le domaine a rentre / la surface qu'il a
       reellement recoltee. C'est ce qui remplit sa cave.
   Elles coincident quand les parcelles vendues rendent comme les autres, et
   divergent sinon — ce qui est une information, pas une incoherence.

   ★★★ LE RENDEMENT D'UNE PARCELLE, C'EST CE QU'ELLE A PRODUIT — pas ce que le
   domaine en a garde. Vendre son raisin ne fait pas baisser le rendement, et
   c'est bien ce que dit le calcul PAR PARCELLE depuis VD-3. La moyenne doit
   donc etre l'agregat de ces memes parcelles, pas un second calcul parallele :
   somme des volumes, somme des surfaces. Par construction, elle tombe alors
   dans la fourchette de la liste affichee juste en dessous.

   ⚠️ Une parcelle SANS SURFACE est ecartee des DEUX cotes — sinon ses kilos
   gonfleraient un rapport dont ils ne paient pas le denominateur. Et on dit
   combien : §80, on n'ecarte pas en silence.
   ⚠️ Le statut ne vaut `mesure` que si TOUTES les parcelles retenues sont
   mesurees. Une seule estimation, et la moyenne est une estimation.
   ⚠️ Cout : `_mlRendements` est rejoue ici alors que la carte du Pilotage
   l'appelle deja. C'est assume — un cache aurait sa propre duree de vie, donc
   sa propre facon de mentir.
   ═══════════════════════════════════════════════════════════════════════════ */
function _mlRdtMoyen(ch){
  var vide={hlHa:null,statut:null,ha:0,hl:0,sansSurface:0,approx:0};
  if(!ch) return vide;
  /* Millesime anterieur au suivi du Cuvier : aucune recolte a agreger, le bilan
     fige a la mise en bouteille est tout ce qui existe. */
  if(ch.retro) return (ch.ha>0&&ch.hlDecuve>0)
    ? {hlHa:ch.hlDecuve/ch.ha,statut:'mesure',ha:ch.ha,hl:ch.hlDecuve,sansSurface:0,approx:0}
    : vide;
  var kgHl=_mlKgHl(), hl=0, ha=0, sansSurface=0, approx=0, tousMesures=true, vu=false;
  _mlRendements(ch.millesime).forEach(function(o){
    var d=o.rdt; if(!d||!d.surf) return;
    /* ★★★ LA PART DU DOMAINE, DES DEUX COTES DE LA DIVISION.
       `_vendSurfParc` connait deja la surface reellement recoltee par le
       domaine : c'est la surface de la parcelle MOINS les surfaces achetees
       saisies sur les portions vendues (`src:'reste'`). L'information existait,
       elle n'etait simplement pas lue ici. */
    var dp=null; (d.parts||[]).forEach(function(x){ if(x.dom) dp=x; });
    if(!dp||!(dp.kg>0)) return;                      // rien pour le domaine ici
    var dh=0, dsrc='aucune';
    (d.surf.lignes||[]).forEach(function(l){ if(l.dom){ dh=l.ha||0; dsrc=l.src; } });
    /* ⚠️ `reste-prorata` = PLUSIEURS destinations sans surface achetee saisie :
       le partage se fait alors au prorata des kilos, ce qui SUPPOSE un rendement
       identique partout. C'est une hypothese, pas une mesure — on compte le cas
       et l'ecran le dit, au lieu de rendre un chiffre qui aurait l'air juste. */
    if(dsrc==='reste-prorata') approx++;
    if(!(dh>0)){ sansSurface++; return; }            // rien a diviser : ecartee
    var connu=dp.connu||0;
    hl+=(dp.hl||0)+Math.max(0,dp.kg-connu)/kgHl; ha+=dh; vu=true;
    if(connu<dp.kg) tousMesures=false;
  });
  if(!vu||!(ha>0)) return {hlHa:null,statut:null,ha:0,hl:0,sansSurface:sansSurface,approx:approx};
  return {hlHa:hl/ha, statut:(tousMesures?'mesure':'estime'),
          ha:ha, hl:hl, sansSurface:sansSurface, approx:approx};
}

function _mlMillesimes(){
  var set={};
  (CAVE_VENDANGE.recoltes||[]).forEach(function(r){
    var a=String(r&&r.date||'').slice(0,4); if(a) set[a]=1;
  });
  (CAVE_ELEVAGE.cuvees||[]).forEach(function(c){ if(c&&c.millesime) set[c.millesime]=1; });
  set[_mlCampagne()]=1;
  return Object.keys(set).map(Number).sort(function(a,b){ return b-a; }).slice(0,6);
}


// ── Le détail sous chaque parcelle : d'où vient le volume, et sur quoi ──────
function _mlRdtDetail(r){
  var d=r.rdt; if(!d) return '';
  var h='<span class="mlx-rdsrc">';
  d.parts.forEach(function(o){
    var cls=(o.src==='client'||o.src==='cuve')?(o.prorata?'ded':'mes'):(o.src==='attente'?'att':'est');
    h+='<span class="mlx-src '+cls+'"><span class="d"></span><span class="t"><b>'
     +_escHtml(o.nom)+'</b> \u00b7 '+Math.round(o.kg)+' kg \u00b7 '+_vendSrcLbl(o.src)
     +(o.prorata?' <i>(prorata)</i>':'')
     +'<br>'+_vendHaTxt(o.ha||0)+' ha \u00b7 '+_vendSurfLbl(o.haSrc||'aucune')
     +(o.kgHa>0?(' \u00b7 '+Math.round(o.kgHa)+' kg/ha'):'')
     +(o.hlHa!=null?(' \u00b7 <b>'+_mvF1(o.hlHa)+' hL/ha</b> sur sa portion'):'')
     +'</span>'+(o.hl>0?('<span class="q">'+_mvF1(o.hl)+' hL</span>'):'')+'</span>';
  });
  if(d.vol.statut==='mesure'){
    h+='<span class="mlx-note ok">Volume complet : '+_mvF1(d.vol.hl)+' hL pour '+Math.round(d.vol.kg)
     +' kg, soit <b>'+Math.round(_vendRendKgHl(d.vol.kg,d.vol.hl*100))+' kg/hL</b>. Le rendement est une mesure.</span>';
  } else if(d.vol.kgKo>0){
    h+='<span class="mlx-note"><b>'+d.vol.pctOk+' % des kilos ont un volume connu.</b> Les '
     +Math.round(d.vol.kgKo)+' kg restants sont estim\u00e9s \u00e0 '+_mvF1(d.vol.kgKo/(_vendCfg().ratio_max||140))
     +'\u2013'+_mvF1(d.vol.kgKo/(_vendCfg().ratio_min||130))+' hL, d\u2019o\u00f9 la fourchette. '
     +(d.vol.lignes.some(function(l){ return l.src==='attente'; })
        ?'Le chiffre se figera au retour du client.':'Il se figera au d\u00e9cuvage.')+'</span>';
  }
  // Les trois écarts de surface. Aucun n'est absorbé en silence.
  if(d.surf.depasse>0)
    h+='<span class="mlx-note bad"><b>Les surfaces d\u00e9clar\u00e9es d\u00e9passent la parcelle de '
     +_vendHaTxt(d.surf.depasse)+' ha.</b> '+_vendHaTxt(d.surf.declaree)+' ha annonc\u00e9s pour une parcelle de '
     +_vendHaTxt(d.surface)+' ha : un des achats est trop grand, ou la fiche parcelle est \u00e0 corriger.</span>';
  if(d.surf.orphelin>0)
    h+='<span class="mlx-note"><b>'+_vendHaTxt(d.surf.orphelin)+' ha ne sont r\u00e9clam\u00e9s par personne.</b> '
     +'Le rendement reste rapport\u00e9 \u00e0 la parcelle enti\u00e8re, donc il descend. Juste si ce coin n\u2019a pas '
     +'\u00e9t\u00e9 vendang\u00e9 ; un apport manque sinon.</span>';
  if(d.surf.conflit.length)
    h+='<span class="mlx-note"><b>Deux surfaces pour un m\u00eame destinataire</b> \u2014 '
     +_escHtml(d.surf.conflit.join(' ; '))+'. La plus grande est retenue : deux passages sur la m\u00eame vigne, '
     +'ce n\u2019est pas deux fois la surface.</span>';
  if(_vendRdtBase()==='total'&&d.parts.some(function(o){ return o.src==='cuve'; }))
    h+='<span class="mlx-note">Base \u00ab jus + lies \u00bb : le volume du domaine est un volume <b>log\u00e9</b>, '
     +'ses lies ne sont compt\u00e9es nulle part. Compar\u00e9e au client, la part domaine est sous-\u00e9valu\u00e9e.</span>';
  return h+'</span>';
}
function _mlRdtCss(){
  if(document.getElementById('mvv-rdt-css')) return;
  var st=document.createElement('style'); st.id='mvv-rdt-css';
  st.textContent=''
  +'.mlx-rdsrc{display:block;margin-top:9px;padding-top:9px;border-top:1px solid rgba(138,90,56,.12);text-align:left}'
  +'.mlx-src{display:flex;align-items:flex-start;gap:8px;padding:4px 0;font-size:var(--pt-micro,11px);line-height:1.5;color:var(--texte-med,#4A4A3A)}'
  +'.mlx-src .d{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px}'
  +'.mlx-src.mes .d{background:var(--vert-med,#3D6B27)}'
  +'.mlx-src.ded .d{background:var(--or,#C2A14D)}'
  +'.mlx-src.est .d{background:var(--gris,#DED7C9)}'
  +'.mlx-src.att .d{background:var(--orange,#B85A1A)}'
  +'.mlx-src .t{flex:1;min-width:0}'
  +'.mlx-src .t i{font-style:normal;color:var(--orange,#B85A1A)}'
  +'.mlx-src .q{font-weight:600;color:var(--terre,#8A5A38);white-space:nowrap}'
  +'.mlx-note{display:block;margin-top:8px;font-size:var(--pt-lbl,10.5px);line-height:1.55;padding:8px 10px;border-radius:9px;'
    +'background:rgba(184,90,26,.07);border:1px solid rgba(184,90,26,.20);color:#8A4A14;text-align:left}'
  +'.mlx-note.ok{background:rgba(61,107,39,.06);border-color:rgba(61,107,39,.18);color:var(--vert,#1E3A12)}'
  +'.mlx-note.bad{background:rgba(160,41,30,.07);border-color:rgba(160,41,30,.25);color:#8A2318}'
  +'.mlx-tag.ok{background:rgba(61,107,39,.10);border:1px solid rgba(61,107,39,.24);color:var(--vert-med,#3D6B27)}';
  document.head.appendChild(st);
}

function _mlRendements(mil){
  var kgHl=_mlKgHl(), out={};
  _mlRecoltesDe(mil).forEach(function(r){
    var p=_vendParcByName(r.parcelle); if(!p) return;
    if(!out[p.nom]) out[p.nom]={parcelle:p, kg:0, caisses:0, vendu:false};
    out[p.nom].kg+=_recKg(r); out[p.nom].caisses+=_recCaisses(r);
    if(_recSold(r)) out[p.nom].vendu=true;
  });
  return Object.keys(out).map(function(k){
    var o=out[k], s=parseFloat(o.parcelle.surface)||0;
    /* ★★★ VD-3 — L'ESCALIER DES SOURCES. Le volume vient d'abord de ce qui a ete
       MESURE : les litres rendus par le client, le volume loge au domaine. Ce
       qui n'a pas de volume connu reste estime au ratio, et l'ecran le DIT. */
    var d=_vendRdtParc(o.parcelle.nom,mil);
    o.rdt=d; o.statut=d.vol.statut; o.pctOk=d.vol.pctOk;
    o.hlMin=s>0?Math.round(d.vol.hlMin/s*10)/10:null;
    o.hlMax=s>0?Math.round(d.vol.hlMax/s*10)/10:null;
    /* La meilleure valeur disponible : le volume connu, plus une estimation du
       reste. Sans aucun volume connu, elle vaut exactement le calcul d'avant. */
    o.hlHa = s>0?Math.round((d.vol.hl+d.vol.kgKo/kgHl)/s*10)/10:null;
    /* ★ Le plafond suit le MILLESIME demande, pas la parcelle en general.
       `maxSrc` dit d'ou il vient : 'mil' = pose pour cette annee, 'herite' =
       l'ancien reglage tous millesimes confondus. L'ecran doit pouvoir faire
       la difference — un chiffre herite n'a pas ete verifie contre l'arrete. */
    var mx=_vendRdtMax(o.parcelle,mil);
    o.max=mx.max; o.maxSrc=mx.src; o.maxAoc=mx.aoc;
    o.depasse = (o.max&&o.hlHa)?(o.hlHa>o.max):false;
    o.pct = (o.max&&o.hlHa)?Math.round(o.hlHa/o.max*100):null;
    return o;
  }).sort(function(a,b){
    if(a.pct==null&&b.pct==null) return (b.hlHa||0)-(a.hlHa||0);
    if(a.pct==null) return 1;
    if(b.pct==null) return -1;
    return b.pct-a.pct;
  });
}

/* ★ Les parcelles RECOLTEES sur ce millesime qui n'ont AUCUN plafond — ni pose
   pour l'annee, ni herite. C'est exactement la liste que la carte annonce
   « plafond non renseigne », et c'est la seule que la pose groupee propose de
   remplir : on ne remplace jamais en lot une valeur que quelqu'un a posee.
   ⚠️ Passe par `_mlRecoltesDe` et `_vendParcByName` — le filtre du millesime et
   l'appariement des noms n'ont qu'une definition dans ce fichier. */
function _mlRdtSansMax(mil){
  var out=[], vus={};
  _mlRecoltesDe(mil).forEach(function(r){
    var p=_vendParcByName(r.parcelle); if(!p||vus[p.nom]) return;
    vus[p.nom]=1;
    if(_vendRdtMax(p,mil).max==null) out.push(p);
  });
  return out;
}

/* ★ Source unique avec Le Cuvier (_vendResteARentrer). Cette fonction comparait
   les noms BRUTS, ne regardait pas le statut — une parcelle ARRACHÉE sortait
   donc en « encore sur pied » — et écartait sans un mot toute parcelle dont la
   surface n'est pas renseignée. */
function _mlResteARentrer(mil){
  if(String(mil)!==String(_mlCampagne())) return [];
  return _vendResteARentrer(mil).lignes.map(function(e){ return e.p; });
}

// D'ou vient ce vin : cuvee d'elevage -> cuve -> recoltes -> parcelles.
function _mlOrigine(cuvId){
  var cv=(CAVE_VENDANGE.cuves_vinif||[]).find(function(c){
    return c && c.decuvage && c.decuvage.cuvee_id===cuvId;
  });
  if(!cv) return null;
  var recs=(CAVE_VENDANGE.recoltes||[]).filter(function(r){ return r&&r.cuve_id===cv.id; });
  return {cuve:cv, recoltes:recs, parcelles:recs.map(function(r){
    var p=_vendParcByName(r.parcelle);
    return {nom:r.parcelle, kg:_recKg(r), ha:p?(parseFloat(p.surface)||0):null};
  })};
}

// ── CSS (injecte par le module, comme le reste de la Cave) ───────────────
function _mlInjectCss(){
  if(document.getElementById('mv-ml-css')) return;
  var s=document.createElement('style'); s.id='mv-ml-css';
  s.textContent=''
  +'.mlx-sec{font-size:var(--pt-lbl,10.5px);letter-spacing:.13em;text-transform:uppercase;color:var(--terre,#8A5A38);font-weight:600;margin:18px 0 9px}'
  +'.mlx-sec:first-child{margin-top:2px}'
  +'.mlx-hint{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);font-style:italic;margin:-4px 0 11px;line-height:1.5}'
  +'.mlx-wk{background:var(--bg-card,#FBFAF6);border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(20,17,13,.06);border:1px solid rgba(138,90,56,.09)}'
  +'.mlx-wk.now{border-color:rgba(194,161,77,.5)}'
  +'.mlx-wkh{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}'
  +'.mlx-wkt{font-size:var(--pt-sm,17px);font-weight:600;color:var(--texte,#2A241C)}'
  +'.mlx-wknow{font-size:var(--pt-nano,9.5px);letter-spacing:.1em;text-transform:uppercase;color:#241B08;font-weight:700;background:var(--or,#C2A14D);border-radius:5px;padding:2px 6px}'
  +'.mlx-wkd{margin-left:auto;font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F)}'
  +'.mlx-wks{font-size:var(--pt-txt,12.5px);color:var(--texte-med,#4A4A3A);margin:6px 0 8px;line-height:1.5}'
  +'.mlx-wks b{color:var(--terre,#8A5A38);font-weight:700}'
  +'.mlx-wks .al{color:var(--rouge,#A0291E);font-weight:600}'
  +'.mlx-wke{font-size:var(--pt-txt,12.5px);color:var(--texte-doux,#5F5F5F);padding:6px 0 2px}'
  +'.mlx-ev{display:flex;gap:10px;align-items:flex-start;padding:10px 8px;border-radius:11px;border:0;background:transparent;width:100%;text-align:left;font-family:inherit;min-height:44px;color:inherit;cursor:pointer}'
  +'.mlx-ev+.mlx-ev{border-top:1px solid rgba(138,90,56,.08)}'
  +'.mlx-p{width:8px;height:8px;border-radius:99px;margin-top:6px;flex-shrink:0;background:#A0A8B8}'
  +'.mlx-p.ouillage{background:#C0845A}.mlx-p.mesure{background:#4A9FC8}.mlx-p.fa{background:#7A4A8A}'
  +'.mlx-p.decuvage{background:var(--or,#C2A14D)}.mlx-p.alerte{background:var(--rouge,#A0291E)}'
  +'.mlx-b{flex:1;min-width:0}'
  +'.mlx-t{display:block;font-size:var(--pt-base,14px);font-weight:600;color:var(--texte,#2A241C);line-height:1.3}'
  +'.mlx-d{display:block;font-size:var(--pt-txt,12.5px);color:var(--texte-med,#4A4A3A);margin-top:2px;line-height:1.4}'
  +'.mlx-n{display:block;font-size:var(--pt-micro,11px);margin-top:3px;color:var(--texte-doux,#5F5F5F)}'
  +'.mlx-ev.due .mlx-n{color:var(--rouge,#A0291E);font-weight:600}'
  +'.mlx-ev.warn .mlx-n{color:var(--orange,#B85A1A);font-weight:600}'
  +'.mlx-j{display:block;font-size:var(--pt-lbl,10.5px);color:var(--texte-doux,#5F5F5F);white-space:nowrap;margin-top:2px;text-align:right;flex-shrink:0;min-width:50px}'
  +'.mlx-j b{display:block;font-size:var(--pt-base,14px);color:var(--terre,#8A5A38);font-weight:700}'
  +'.mlx-chips{display:flex;gap:7px;flex-wrap:wrap;margin:2px 0 14px}'
  +'.mlx-chip{font-size:var(--pt-txt,12.5px);font-weight:500;padding:9px 15px;border-radius:99px;border:1px solid rgba(138,90,56,.25);background:var(--bg-card,#FBFAF6);color:var(--terre,#8A5A38);cursor:pointer;font-family:inherit;min-height:44px}'
  +'.mlx-chip.on{background:var(--cave,#14110D);color:var(--or-clair,#D8BC72);border-color:var(--cave,#14110D)}'
  +'.mlx-chip small{opacity:.65;font-size:var(--pt-lbl,10.5px);margin-left:4px}'
  +'.mlx-flux{background:var(--bg-card,#FBFAF6);border-radius:16px;padding:16px 14px 10px;box-shadow:0 1px 4px rgba(20,17,13,.06);border:1px solid rgba(138,90,56,.09);margin-bottom:14px}'
  +'.mlx-fluxsvg{width:100%}'
  +'.mlx-flux svg{display:block;max-width:100%;height:auto;overflow:visible}'
  +'.mlx-foot{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);line-height:1.55;margin-top:10px;padding-top:10px;border-top:1px dashed rgba(138,90,56,.22)}'
  +'.mlx-foot b{color:var(--terre,#8A5A38)}'
  +'.mlx-rd{background:var(--bg-card,#FBFAF6);border-radius:13px;padding:12px 13px;margin-bottom:9px;box-shadow:0 1px 4px rgba(20,17,13,.06);border:1px solid rgba(138,90,56,.09);width:100%;text-align:left;font-family:inherit;cursor:pointer;min-height:44px}'
  +'.mlx-rd.over{border-color:rgba(160,41,30,.4);background:var(--rouge-pale,#FAEAE8)}'
  +'.mlx-rdh{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}'
  +'.mlx-rdn{font-size:var(--pt-base,14px);font-weight:600;color:var(--texte,#2A241C)}'
  +'.mlx-rdv{margin-left:auto;font-family:\'Cormorant Garamond\',Georgia,serif;font-size:var(--pt-md,20px);font-weight:700;color:var(--terre,#8A5A38)}'
  +'.mlx-rd.over .mlx-rdv{color:var(--rouge,#A0291E)}'
  +'.mlx-rdv small{font-size:var(--pt-lbl,10.5px);font-family:inherit;font-weight:400;color:var(--texte-doux,#5F5F5F);margin-left:3px}'
  +'.mlx-rda{display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:2px}'
  +'.mlx-tr{height:7px;border-radius:99px;background:var(--gris-clair,#ECE6DA);margin-top:9px;position:relative;overflow:hidden}'
  +'.mlx-fi{height:100%;border-radius:99px;background:linear-gradient(90deg,#6BA34A,#3D6B27)}'
  +'.mlx-rd.over .mlx-fi{background:linear-gradient(90deg,#D4721A,#A0291E)}'
  +'.mlx-mk{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--texte-med,#4A4A3A);opacity:.55}'
  +'.mlx-rdf{display:flex;justify-content:space-between;font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:5px}'
  +'.mlx-tag{font-size:var(--pt-lbl,10.5px);font-weight:600;padding:2px 7px;border-radius:6px;background:var(--rouge,#A0291E);color:#fff}'
  +'.mlx-tag.sold{background:var(--gris,#DED7C9);color:var(--texte-med,#4A4A3A)}'
  +'.mlx-org{background:var(--bg-card,#FBFAF6);border-radius:13px;padding:13px;margin-bottom:9px;box-shadow:0 1px 4px rgba(20,17,13,.06);border:1px solid rgba(138,90,56,.09)}'
  +'.mlx-orgt{font-size:var(--pt-base,14px);font-weight:600;color:var(--texte,#2A241C)}'
  +'.mlx-orgs{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:2px}'
  +'.mlx-orgc{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:10px;font-size:var(--pt-txt,12.5px)}'
  +'.mlx-st{background:var(--terre-pale,#F3EADF);color:var(--terre-tx,#8A5A38);border-radius:8px;padding:5px 9px;font-weight:500}'
  +'.mlx-ar{color:var(--texte-doux,#5F5F5F);font-size:var(--pt-txt,12.5px)}'
  +'.mlx-row{display:flex;justify-content:space-between;font-size:var(--pt-txt,12.5px);color:var(--texte-med,#4A4A3A);padding:5px 0}'
  +'.mlx-row+.mlx-row{border-top:1px solid rgba(138,90,56,.08)}'
  +'.mlx-row b{color:var(--texte,#2A241C);font-weight:600}'
  +'.mlx-reste{background:var(--or-pale,#FAF3E0);border:1px solid rgba(194,161,77,.35);border-radius:13px;padding:12px 13px;margin-bottom:12px;font-size:var(--pt-txt,12.5px);color:var(--texte-med,#4A4A3A);line-height:1.5}'
  +'.mlx-reste b{color:var(--terre,#8A5A38)}'
  +'.mlx-empty{text-align:center;color:var(--texte-doux,#5F5F5F);padding:34px 20px;font-size:var(--pt-txt,12.5px);line-height:1.6}';
  document.head.appendChild(s);
}

// ── RENDU ────────────────────────────────────────────────────────────────
var _ML_LBL={ouillage:'Ouiller', mesure:'Mesurer', fa:'Fin de fermentation',
  decuvage:'D\u00e9cuvage possible', alerte:'\u00c0 contr\u00f4ler',
  demarrage:'D\u00e9part en fermentation', soutirage:'Soutirer', malo:'Malo bloqu\u00e9e',
  so2:'Dose de SO\u2082', fut:'Parc \u00e0 f\u00fbts'};

// Une ligne de l'agenda = un bouton vers le geste. L'icone vient du sprite
// (cliquet des emojis), le verbe se lit a droite — jamais un chemin a retenir.
// ⚠️ Pas de <button> dans un <button> : le verbe est un <span> habille.
function _mlEvHtml(it){
  var ico=_AUJ_ICO[it.kind]||'chrono', verbe=_AUJ_VERBE[it.kind]||'Voir';
  var quand = (it.kind==='ouillage') ? (it.futs+' f\u00fbt'+(it.futs>1?'s':''))
            : (it.date ? _mlFrJ(it.date) : '');
  return '<button class="mlx-ev '+(it.urgence||'')+'" onclick="_mlGo(\''+_escAttr(it.kind)+'\',\''+_escAttr(it.ref)+'\')">'
    +'<span class="auj-ic">'+_mvIcon(ico,16)+'</span><span class="mlx-b">'
    +'<span class="mlx-t">'+_escHtml(it.titre)+'</span>'
    +'<span class="mlx-d">'+_ML_LBL[it.kind]+' \u00b7 '+_escHtml(it.detail)+(quand?' \u00b7 '+_escHtml(quand):'')+'</span>'
    +(it.note?'<span class="mlx-n">'+_escHtml(it.note)+'</span>':'')
    +'</span><span class="auj-act">'+_escHtml(verbe)+'</span></button>';
}

// Chaque ligne renvoie vers l'ecran qui existe deja : rien de neuf a apprendre.
function _mlGo(kind,ref){
  if(kind==='ouillage'){
    if(isSaisonnier()){ showToast('Acc\u00e8s lecture seule','#B85A1A'); return; }
    caveSection='elevage'; renderCave();
    _caveQuickOp(null,'ouillage',ref);
    return;
  }
  if(kind==='decuvage'){
    if(isSaisonnier()){ showToast('Acc\u00e8s lecture seule','#B85A1A'); return; }
    caveSection='vendange'; _vendOngletCuves(); renderCave();
    if(typeof openVendDecuvage==='function') openVendDecuvage(ref);
    return;
  }
  if(kind==='mesure'){
    if(isSaisonnier()){ showToast('Acc\u00e8s lecture seule','#B85A1A'); return; }
    caveSection='vendange'; _vendOngletCuves(); renderCave();
    openOvVendMesure(ref);
    return;
  }
  if(kind==='soutirage'){
    if(isSaisonnier()){ showToast('Acc\u00e8s lecture seule','#B85A1A'); return; }
    caveSection='elevage'; renderCave();
    _caveQuickOp(null,'soutirage',ref);
    return;
  }
  // Une dose de SO2 programmee : le geste est une operation « soufre » du Chai
  // sur la cuvee visee.
  if(kind==='so2'){
    if(isSaisonnier()){ showToast('Acc\u00e8s lecture seule','#B85A1A'); return; }
    caveSection='elevage'; renderCave();
    _caveQuickOp(null,'soufre',ref);
    return;
  }
  // Les futs en fin de vie vivent au parc, dans La Reserve : on y va.
  if(kind==='fut'){
    if(window.goTo) window.goTo('reserve');
    if(typeof window._rsvTabTo==='function') window._rsvTabTo('futs');
    return;
  }
  // ★ Le plafond de rendement se pose DANS la Cave, section « Le millesime »,
  //   onglet « La ligne de vie » — et le Pilotage a un onglet qui porte
  //   EXACTEMENT le meme nom. Un renvoi ecrit en toutes lettres se lit comme
  //   « c'est ici » quand on est deja sur un ecran qui s'appelle pareil : il
  //   faut y ATTERRIR, pas le decrire.
  if(kind==='rdtmax'){
    caveSection='millesime'; _mlTab='vie';
    var _rm=parseInt(ref,10);
    if(isFinite(_rm)&&_rm>0) _mlMil=_rm;
    renderCave();
    return;
  }
  // ⚠ Les kinds ci-dessous decrivent une CUVE : ils vivent au Cuvier.
  // Tout le reste est un geste du CHAI. Le repli partait autrefois au
  // Cuvier quel que soit le kind : « Soutirer » atterrissait donc sur
  // l'ecran des cuves, en silence. Un kind inconnu reste au Chai.
  if(kind==='fa'||kind==='alerte'||kind==='demarrage'){
    caveSection='vendange'; _vendOngletCuves(); renderCave();
    return;
  }
  caveSection='elevage'; renderCave();
}

// Le graphique est dessine a 1 unite SVG = 1 pixel. Sans cela, width:100% plus
// height:auto etirent AUSSI les hauteurs de barres et les tailles de texte : sur
// un ecran large tout partait a x5 (constate le 06/08/2026 en 1900 px de large).
// La largeur de dessin est donc MESUREE sur le conteneur, bornee, et le dessin
// est repeint au redimensionnement. Meme principe que .mvv-spark (height fixe)
// et que le donut du Pilotage (max-width) : jamais de SVG libre en hauteur.
var _ML_FLUX_MIN=300, _ML_FLUX_MAX=720, _ML_FLUX_DEF=352;
var _mlFluxCh=null, _mlFluxW0=0, _mlFluxHooked=false;

function _mlFluxW(el){
  var w=0;
  if(el&&el.clientWidth>0) w=el.clientWidth;
  else {
    var b=document.getElementById('ml-body');
    if(b&&b.clientWidth>0) w=b.clientWidth-30;   // padding + bordures de .mlx-flux
  }
  if(!(w>0)) return _ML_FLUX_DEF;
  return Math.round(Math.max(_ML_FLUX_MIN,Math.min(_ML_FLUX_MAX,w)));
}

// Repeint le seul graphique, sans reconstruire la page. Silencieux si la vue
// n'est pas a l'ecran ou si la largeur n'a pas bouge.
function _mlFluxPaint(){
  var box=document.querySelector('.mlx-fluxsvg');
  if(!box||!_mlFluxCh) return;
  var w=_mlFluxW(box);
  if(w===_mlFluxW0) return;
  _mlFluxW0=w;
  box.innerHTML=_mlFluxSvg(_mlFluxCh,w);
}

function _mlFluxHook(){
  if(_mlFluxHooked) return;
  _mlFluxHooked=true;
  var t=null;
  window.addEventListener('resize',function(){
    if(t) clearTimeout(t);
    t=setTimeout(_mlFluxPaint,200);
  });
}

// Flux vertical : la largeur d'un etage est proportionnelle au volume.
function _mlFluxSvg(ch,W){
  W=(W>0)?Math.round(W):_ML_FLUX_DEF;
  var PAD=8, ROW=46, GAP=34;
  var hlRentre=ch.kg/ch.kgHl, hlVendu=ch.kgVendu/ch.kgHl, hlCuve=hlRentre-hlVendu;
  var etages=[
    {lab:'Rentr\u00e9 de la vigne', v:hlRentre,
     sub:Math.round(ch.kg)+' kg \u00b7 '+ch.parcelles+' parcelle'+(ch.parcelles>1?'s':''), c:'#8A5A38'},
    {lab:'Encuv\u00e9', v:hlCuve,
     sub:ch.hlCuve?('dont '+ch.hlCuve+' hL encore en cuve'):'cuvaison termin\u00e9e', c:'#7A4A8A'},
    {lab:_mlEleveLab(ch), v:ch.hlFut, sub:_mlEleveSub(ch), c:'#C0845A'},
    {lab:'En bouteille', v:ch.btl?ch.btl*0.75/100:0,
     sub:ch.btl?(ch.btl+' cols en stock'):('projection '+_mvBtl(ch.hlFut)+' cols'),
     c:'#7A1020', proj:!ch.btl}
  ];
  // Les etages de TETE a zero sont retires : sans recolte saisie au Cuvier, un flux
  // qui part de 0 hL pour arriver aux futs dessine un ruban qui s'elargit, soit
  // l'inverse de ce qui se passe. On commence au premier etage renseigne.
  while(etages.length>1 && !(etages[0].v>0)) etages.shift();
  var max=Math.max(etages[0].v,1);
  var H=etages.length*ROW+(etages.length-1)*GAP+26;
  function larg(v){ return Math.max(6,(v/max)*(W-2*PAD)); }
  var s='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="Parcours du mill\u00e9sime, de la vigne \u00e0 la bouteille">'
    +'<defs><linearGradient id="mlxgr" x1="0" y1="0" x2="1" y2="0">'
    +'<stop offset="0" stop-color="#C2A14D"/><stop offset="1" stop-color="#8A5A38"/></linearGradient></defs>';
  etages.forEach(function(e,i){
    var y=i*(ROW+GAP), w=larg(e.v), x=PAD;
    if(i<etages.length-1){
      var n=etages[i+1], wn=larg(n.v), y2=y+ROW+GAP;
      s+='<path d="M'+x+' '+(y+ROW)+' L'+(x+w)+' '+(y+ROW)
        +' C'+(x+w)+' '+(y+ROW+GAP*0.6)+' '+(x+wn)+' '+(y2-GAP*0.6)+' '+(x+wn)+' '+y2
        +' L'+x+' '+y2+' Z" fill="url(#mlxgr)" opacity="'+(n.proj?0.16:0.3)+'"'
        +(n.proj?' stroke="#8A5A38" stroke-dasharray="3 3" stroke-opacity=".4"':'')+'/>';
      var perte=e.v>0?Math.round((1-n.v/e.v)*100):0;
      if(perte>0&&!n.proj) s+='<text x="'+(x+Math.min(w,wn)/2)+'" y="'+(y+ROW+GAP/2+4)
        +'" font-size="10.5" fill="#7A1020" text-anchor="middle" font-weight="600">\u2212'+perte+' %</text>';
    }
    s+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+ROW+'" rx="9" fill="'+e.c+'"'
      +(e.proj?' opacity=".28" stroke="'+e.c+'" stroke-dasharray="4 3"':'')+'/>'
      +'<text x="'+(x+11)+'" y="'+(y+20)+'" font-size="12.5" fill="#F5EFE2" font-weight="600">'+e.lab+'</text>'
      +'<text x="'+(x+11)+'" y="'+(y+35)+'" font-size="10.5" fill="#F5EFE2" opacity=".72">'+e.sub+'</text>'
      +'<text x="'+(W-2)+'" y="'+(y+27)+'" font-size="15" fill="#2A241C" text-anchor="end" font-weight="700">'
      +_mvF1(e.v)+'<tspan font-size="10" opacity=".6"> hL</tspan></text>';
    if(i===0&&hlVendu>0){
      s+='<path d="M'+(x+w)+' '+(y+8)+' q26 6 26 26 l0 10" stroke="#A0A8B8" stroke-width="2.5" fill="none" opacity=".6"/>'
        +'<text x="'+(x+w+18)+'" y="'+(y+ROW+18)+'" font-size="10" fill="#5F5F5F" text-anchor="middle">vendu</text>'
        +'<text x="'+(x+w+18)+'" y="'+(y+ROW+30)+'" font-size="10" fill="#5F5F5F" text-anchor="middle" font-weight="600">'
        +_mvF1(hlVendu)+' hL</text>';
    }
  });
  return s+'</svg>';
}

function _mlRenderVie(){
  var mil=_mlMilActif(), h='';
  h+='<div class="mlx-chips">';
  _mlMillesimes().forEach(function(m){
    var c=_mlChaine(m);
    var sub=c.btl?(c.btl+' cols'):(c.futs?(c.futs+' f\u00fbts'):(c.kg?(Math.round(c.kg/1000*10)/10+' t'):'\u2014'));
    h+='<button class="mlx-chip'+(String(m)===String(mil)?' on':'')+'" onclick="_mlSetMil('+m+')">'
      +m+'<small>'+sub+'</small></button>';
  });
  h+='</div>';

  var ch=_mlChaine(mil);
  if(!ch.kg && !ch.futs && !ch.btl){
    return h+'<div class="mlx-empty">Rien d\u2019enregistr\u00e9 sur ce mill\u00e9sime.<br>'
      +'Les r\u00e9coltes se saisissent au Cuvier, les cuv\u00e9es au Chai.</div>';
  }

  h+=_mlTuiles(ch);
  h+='<div class="mlx-sec">De la vigne \u00e0 la bouteille</div>';
  _mlFluxCh=ch; _mlFluxW0=_mlFluxW();
  h+='<div class="mlx-flux"><div class="mlx-fluxsvg">'+_mlFluxSvg(ch,_mlFluxW0)+'</div>';
  var cuve0=ch.kgCuve/ch.kgHl, foot='';
  if(ch.retro) foot+='Mill\u00e9sime ant\u00e9rieur au suivi du Cuvier : les volumes viennent du bilan '
    +'fig\u00e9 \u00e0 la mise en bouteille. ';
  else if(!ch.kg && (ch.futs||ch.btl)) foot+='Aucune r\u00e9colte saisie au Cuvier pour ce '
    +'mill\u00e9sime : le parcours commence au chai. Renseignez les r\u00e9coltes pour voir le volume '
    +'perdu depuis la vigne. ';
  // Une perte « de la benne au col » ne se calcule QUE si plus rien n'est en cuve.
  // Sinon on compare les futs au total encuve et on annonce une perte enorme la ou
  // le vin est simplement en train de fermenter.
  if(ch.hlCuve>0){
    foot+='Mill\u00e9sime en cours : <b>'+ch.hlCuve+' hL</b> fermentent encore, <b>'+_mvF1(ch.hlFut)
      +' hL</b> sont d\u00e9j\u00e0 descendus au chai. La perte totale se lira quand tout sera d\u00e9cuv\u00e9. ';
  } else if(ch.btl&&cuve0>0){
    foot+='De la benne au col, <b>'+Math.round((1-(ch.btl*0.75/100)/cuve0)*100)
      +' %</b> du volume s\u2019est perdu en marc, lies et soutirages. ';
  } else if(ch.hlFut&&cuve0>0){
    foot+='De la benne \u00e0 l\u2019\u00e9levage, <b>'+Math.round((1-ch.hlFut/cuve0)*100)
      +' %</b> du volume s\u2019est perdu. Le reste se jouera \u00e0 l\u2019\u00e9levage et \u00e0 la mise. ';
  }
  // ★ VOL-1 — le pied disait « rien n'est estime » : les deux premiers etages le sont.
  foot+='Les deux premiers \u00e9tages sont des kilos convertis \u00e0 la r\u00e8gle du Cuvier ('+_mvF1(ch.kgHl)
    +'\u00a0kg/hL)\u00a0; les suivants sont des volumes saisis ailleurs, sauf la projection en pointill\u00e9.';
  h+='<div class="mlx-foot">'+foot+'</div></div>';

  var reste=_mlResteARentrer(mil);
  if(reste.length&&reste.length<=12){
    var haR=reste.reduce(function(s,p){ return s+(parseFloat(p.surface)||0); },0);
    h+='<div class="mlx-reste">'+_mvIcon('raisin',16)+' Encore sur pied : <b>'
      +reste.map(function(p){ return _escHtml(p.nom); }).join(', ')+'</b> \u2014 '+_mvF1(haR)+' ha.</div>';
  }

  var rd=_mlRendements(mil);
  if(rd.length){
    var adm=(typeof isAdmin==='function'&&isAdmin());
    _mlRdtCss();
    h+='<div class="mlx-sec">Rendement par parcelle'+(typeof window._mvInfoBtn==='function'?window._mvInfoBtn('cave.rdt'):'')+'</div>';
    /* ★ Le plafond est desormais celui du MILLESIME ouvert : le dire ici, sinon
       poser 45 en 2026 aurait l'air de valoir pour 2025 — c'est exactement ce
       que faisait l'ancien scalaire, en silence. */
    h+='<div class="mlx-hint">'+(rd.some(function(r){return r.max;})
        ? 'Le trait vertical est le maximum de l\u2019appellation pour '+mil+'. Un d\u00e9passement ne bloque rien : il se voit.'
        : 'Aucun maximum d\u2019appellation renseign\u00e9 pour '+mil+'.'+(adm?' Touchez une parcelle pour le poser.':''))+'</div>';
    rd.forEach(function(r){
      var ech=(r.max||0)*1.15;
      var wFill=r.max?Math.min(100,Math.round((r.hlHa/ech)*100)):0;
      h+='<button class="mlx-rd'+(r.depasse?' over':'')+'" onclick="_mlSetRdtMax(\''+_escAttr(r.parcelle.nom)+'\','+_escAttr(mil)+')">'
        +'<span class="mlx-rdh"><span class="mlx-rdn">'+_escHtml(r.parcelle.nom)+'</span>'
        +(r.depasse?'<span class="mlx-tag">au-dessus</span>':'')
        +(r.vendu?'<span class="mlx-tag sold">vendu</span>':'')
        +'<span class="mlx-tag'+(r.statut==='mesure'?' ok':'')+'">'
          +(r.statut==='mesure'?'mesur\u00e9':(r.statut==='partiel'?(r.pctOk+' % mesur\u00e9'):'estim\u00e9'))+'</span>'
        /* ⚠️ Un chiffre net ne sort que s'il est mesure de bout en bout. Sinon
           c'est une fourchette : il manque des litres, pas des raisins. */
        +'<span class="mlx-rdv">'+(r.statut==='mesure'?_mvF1(r.hlHa)
            :(_mvF1(r.hlMin)+'\u2013'+_mvF1(r.hlMax)))+'<small>hL/ha</small></span></span>'
        +'<span class="mlx-rda">'+_mvF1(parseFloat(r.parcelle.surface)||0)+' ha \u00b7 '
        +Math.round(r.kg)+' kg \u00b7 '+r.caisses+' caisses \u00b7 sur la parcelle enti\u00e8re</span>'
        +_mlRdtDetail(r);
      if(r.max){
        h+='<span class="mlx-tr" style="display:block"><span class="mlx-fi" style="display:block;width:'+wFill+'%"></span>'
          +'<span class="mlx-mk" style="left:87%"></span></span>'
          /* ⚠️ « 104 % du maximum » sur une estimation ferait croire a un
             depassement d'appellation constate. Tant que le volume n'est pas
             mesure, le pourcentage est annonce comme approche. */
          +'<span class="mlx-rdf"><span>'+(r.statut==='mesure'?'':'\u2248 ')+r.pct+' % du maximum</span>'
          /* ⚠️ Un plafond HERITE de l'ancien reglage n'a ete verifie contre
             aucun arrete : il se lit, il ne se croit pas. L'ecran le dit. */
          +'<span>max '+_mvF1(r.max)+' hL/ha'
            +(r.maxSrc==='herite'?' \u00b7 h\u00e9rit\u00e9':(r.maxSrc==='aoc'&&r.maxAoc?(' \u00b7 '+_escHtml(r.maxAoc)):''))+'</span></span>';
      } else {
        h+='<span class="mlx-rdf"><span>'+(adm?('Toucher pour poser le maximum de l\u2019appellation '+mil)
          :('Maximum de l\u2019appellation non renseign\u00e9 pour '+mil))+'</span></span>';
      }
      h+='</button>';
    });
  }

  var orgs=ch.cuvees.map(function(c){ return {c:c, o:_mlOrigine(c.id)}; })
                    .filter(function(x){ return x.o; });
  if(orgs.length){
    h+='<div class="mlx-sec">D\u2019o\u00f9 vient chaque cuv\u00e9e</div>';
    orgs.forEach(function(x){
      var kg=x.o.parcelles.reduce(function(s,p){ return s+p.kg; },0);
      h+='<div class="mlx-org"><div class="mlx-orgt">'+_escHtml(_mlNomCuvee(x.c))+'</div>'
        +'<div class="mlx-orgs">'+(x.c.statut==='embouteille'
            ? ((x.c.nb_bouteilles||0)+' bouteilles \u00b7 mise en bouteille le '+_caveDateFr(x.c.date_embouteillage))
            : (_caveNbTonneaux(x.c)+' f\u00fbts \u00b7 '+_mvF1(_mlHlCuvee(x.c))+' hL en \u00e9levage'))+'</div>'
        +'<div class="mlx-orgc"><span class="mlx-st">'+x.o.parcelles.length+' parcelle'
        +(x.o.parcelles.length>1?'s':'')+'</span><span class="mlx-ar">\u2192</span>'
        +'<span class="mlx-st">'+_escHtml(String(x.o.cuve.nom||'Cuve').split('\u00b7')[0].trim())+'</span>'
        +'<span class="mlx-ar">\u2192</span><span class="mlx-st">'+_caveNbTonneaux(x.c)+' f\u00fbts</span></div>';
      x.o.parcelles.forEach(function(p){
        h+='<div class="mlx-row"><span>'+_escHtml(p.nom)+'</span><b>'+Math.round(p.kg)+' kg</b></div>';
      });
      h+='<div class="mlx-row" style="border-top:1px solid rgba(138,90,56,.2)"><span>Encuv\u00e9 le '
        +_caveDateFr(x.o.cuve.date_entree)+'</span><b>'+Math.round(kg)+' kg</b></div></div>';
    });
  }
  // Face au millesime precedent — ex-carte de Pilotage › Cave › Le millesime (lot CAVE-3).
  try{ h+=_pcavN1({mil:mil, milAff:mil}, mil)||''; }catch(e){ _pcavLog('n1',e); }
  return h;
}

// Maximum de l'appellation : seule donnee que l'ecran demande, posee par
// parcelle ET PAR MILLESIME, par un administrateur. Ecrite dans PARCELLES.
//
// ★★ UNE SEULE PORTE D'ECRITURE, APPELEE PAR DEUX ECRANS : la carte du
//   millesime (Cave) et la carte du Pilotage. `apres` est ce que l'appelant
//   veut redessiner — sans lui, la Cave se redessine, ce qui est faux quand on
//   pose depuis le Pilotage. Un geste partage doit rendre la main a celui qui
//   l'a declenche, pas a celui qui l'a ecrit.
function _mlSetRdtMax(nom,mil,apres){
  if(typeof isAdmin!=='function'||!isAdmin()){
    showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#B85A1A'); return;
  }
  var p=_vendParcByName(nom);
  if(!p){ showToast('Parcelle introuvable','#B85A1A'); return; }
  if(typeof window.openPrompt!=='function'){ showToast('Saisie indisponible','#B85A1A'); return; }
  var m=(mil!=null&&mil!=='')?mil:_mlMilActif();
  var cur=_vendRdtMax(p,m);
  var rendre=(typeof apres==='function')?apres:function(){ renderCaveMillesime(); };
  window.openPrompt({
    titre:'Rendement maximum '+m,
    sub:nom+' \u2014 le plafond de l\u2019appellation pour ce mill\u00e9sime, en hL/ha.'
      +(cur.src==='herite'?' Aujourd\u2019hui h\u00e9rit\u00e9 de l\u2019ancien r\u00e9glage, tous mill\u00e9simes confondus.':''),
    /* ⚠️ Le champ ne pre-remplit QUE la valeur de CE millesime. Un plafond
       herite s'affiche en repere gris (placeholder) : le pre-remplir ferait
       dater d'office une valeur dont on ignore la campagne d'origine. */
    valeur:(cur.src==='mil'?String(cur.max):''), unite:'hL/ha', icone:'raisin',
    type:'nombre', placeholder:(cur.max!=null?_mvF1(cur.max):'45'), btnLabel:'Enregistrer',
    cb:function(v){
      var s=String(v==null?'':v).trim();
      // Valider a vide RETIRE le plafond de ce millesime, lui seul. Effacer une
      // valeur fausse doit couter aussi peu que la poser.
      if(!s){
        if(_vendSetRdtMax(p,m,null)){
          _vendSaveParcelles();
          showToast(nom+' \u00b7 plafond '+m+' retir\u00e9','#B85A1A');
        }
        rendre(); return;
      }
      var n=parseFloat(s.replace(',','.'));
      if(!isFinite(n)||n<=0){ showToast('Valeur non comprise','#B85A1A'); return; }
      _vendSetRdtMax(p,m,n);
      _vendSaveParcelles();
      var q=_vendRdtMax(p,m).max;
      showToast(nom+' \u00b7 '+m+' \u00b7 max '+_mvF1(q)+' hL/ha','#3D6B27');
      rendre();
      _mlRdtProposeGroupe(q,m,rendre);
    }
  });
}

// ★★★ POSER QUARANTE-CINQ FOIS LE MEME CHIFFRE N'EST PAS UNE SAISIE, C'EST UNE
//   CORVEE — et une corvee ne se fait pas. Elle explique a elle seule qu'un
//   domaine de 45 parcelles n'ait jamais eu un seul plafond renseigne. Un
//   arrete fixe le meme rendement pour toute une appellation : apres la
//   premiere pose, on PROPOSE de porter la valeur sur les parcelles du
//   millesime qui n'ont AUCUN plafond.
// ⚠️⚠️ Jamais celles qui en ont un, pose OU herite : on ne remplace pas en lot
//   une valeur que quelqu'un a mise. Et la proposition NOMME ce qu'elle va
//   toucher — « les autres » ne se verifie pas avant de dire oui.
function _mlRdtProposeGroupe(val,mil,rendre){
  if(!(val>0)) return;
  if(typeof window.openConfirmDel!=='function') return;
  var l=_mlRdtSansMax(mil); if(!l.length) return;
  var noms=l.map(function(p){ return p.nom; });
  var n=noms.length, s=(n>1?'s':'');
  var apercu=noms.slice(0,6).join(', ')+(n>6?(' et '+(n-6)+' autre'+(n>7?'s':'')):'');
  // Le prompt vient de se fermer : laisser l'overlay finir sa sortie avant d'en
  // ouvrir un second. Deux overlays qui se croisent, c'est §85.
  setTimeout(function(){
    window.openConfirmDel(
      _mvF1(val)+' hL/ha sur '+n+' autre'+s+' parcelle'+s+' ?',
      'Mill\u00e9sime '+mil+' \u2014 '+apercu+'. Ces parcelles n\u2019ont aucun plafond. '
        +'Celles qui en ont un ne sont pas touch\u00e9es.',
      function(){
        // Une seule ecriture pour tout le lot : 45 parcelles ne font pas 45
        // transactions sur la collection la plus protegee de l'application.
        _vendParcLot(function(){
          l.forEach(function(p){ if(_vendSetRdtMax(p,mil,val)) _vendSaveParcelles(); });
        });
        showToast(n+' plafond'+s+' pos\u00e9'+s+' \u00b7 '+mil,'#3D6B27');
        rendre();
      },'raisin','Appliquer','#3D6B27');
  },260);
}

function _mlSetMil(m){ _mlMil=m; renderCaveMillesime(); }
// ═══════════════════════════════════════════════════════════
// AUJOURD'HUI — L'ECRAN D'ARRIVEE DE LA CAVE (lot CAVE-1)
//
// Deux ecrans repondaient a « qu'est-ce qui presse ? » : « Ce qui vient » ici,
// « Ce qui presse » au Pilotage — sur le MEME moteur (_mlAgenda), avec deux
// presentations. Un seul ecran desormais, et il est dans la Cave : c'est ici
// qu'on FAIT le geste. Le Pilotage consommera _mlVerdict / _mlAgendaComplet
// (lot ③) ; en attendant ses copies _pcavMalo / _pcavSoutirages restent en
// place, a l'identique de ce qui est porte ci-dessous.
//
// ⚠️ _mlAgenda ne bouge pas : son harnais (mv-harnais-agenda) l'extrait et
//    l'execute a l'identique. Ce que le Chai ajoute (soutirage, malo, SO2)
//    vient PAR-DESSUS, dans _mlAgendaComplet.
// ⚠️ Les fûts en fin de vie n'ont PAS de date : ils ne rentrent dans aucune
//    semaine. Les dater serait inventer une echeance (§20g).
// ═══════════════════════════════════════════════════════════

// Date a laquelle la malo a ete CONSTATEE finie, par cuvee. C'est la reference
// du geste de soutirage : un soutirage anterieur a cette date n'acquitte pas
// celui-ci — sans elle, un soutirage de mars valait quitus pour une malo
// finie en mai.
function _mlFinMalo(){
  var ops=(CAVE_ELEVAGE.operations||[]), d={};
  ops.forEach(function(o){
    if(!o||o.type!=='analyse'||!o.data||o.data.fml!=='ok') return;
    var dt=o.data.fml_date||o.date; if(!dt) return;
    var ids=(o.cuvees_ids&&o.cuvees_ids.length)?o.cuvees_ids:(o.cuvee_id?[o.cuvee_id]:[]);
    ids.forEach(function(id){ if(!d[id]||dt<d[id]) d[id]=dt; });
  });
  return d;
}

// Etat de chaque cuvee en elevage vis-a-vis du soutirage. Tout vient de
// _mlProjMalo, sauf le drapeau declaratif fml_terminee, qui reste une verite du
// vigneron : s'il declare la malo finie, elle est finie, meme sans mesure.
//   cas : 'a_soutirer' (malo finie, aucun soutirage posterieur) · 'fait' ·
//         'suivie' (des mesures, pas finie) · 'sans_mesure'
function _mlMalo(){
  var fm=_mlFinMalo(), out=[];
  (CAVE_ELEVAGE.cuvees||[]).forEach(function(x){
    if(!x||!x.id||x.statut==='embouteille') return;
    var p=null;
    try{ p=window._mlProjMalo(x); }
    catch(e){ if(window.logError) window.logError({level:'info',cat:'cave',msg:'aujourdhui/projMalo',err:e}); }
    var etat=p?p.etat:'attente';
    // ★ Meme lecture que le Chai (_caveFmlEtat) : le drapeau de la fiche ET
    //   l'analyse qui dit « Terminee » valent declaration. Avant ce lot seul le
    //   drapeau comptait ici, et seule l'analyse comptait la-bas : declarer par
    //   une porte laissait l'autre ecran dire le contraire.
    var finie=(etat==='finie')||(_caveFmlEtat(x)==='ok');
    var sout=_caveLastSout(x.id)||null;
    var ref=(p&&p.etat==='finie'&&p.dernier)?p.dernier:(fm[x.id]||null);
    var acquitte=!!sout&&(!ref||sout>=ref);
    out.push({id:x.id, nom:_mlNomCuvee(x), p:p, etat:etat, finie:finie, sout:sout, ref:ref,
              cas: finie ? (acquitte?'fait':'a_soutirer')
                         : (p&&p.n?'suivie':(sout?'fait':'sans_mesure'))});
  });
  return out;
}

// Doses de SO2 programmees au soutirage et tombant dans la fenetre
// [from, from + nSem*7 - 1]. La date est celle que le vigneron a posee
// lui-meme ; l'application la rappelle, elle ne sait pas si la dose a ete
// faite.
function _mlSo2Doses(from,nSem){
  var fin=_mlAddJ(from,(nSem||4)*7-1), doses=[], nom={};
  (CAVE_ELEVAGE.cuvees||[]).forEach(function(x){ if(x&&x.id) nom[x.id]=_mlNomCuvee(x); });
  (CAVE_ELEVAGE.operations||[]).forEach(function(o){
    if(!o||o.type!=='soutirage'||!o.date||!o.data) return;
    var so2=o.data.so2; if(!so2||!so2.dates||!so2.dates.length) return;
    var ids=(o.cuvees_ids&&o.cuvees_ids.length)?o.cuvees_ids:(o.cuvee_id?[o.cuvee_id]:[]);
    so2.dates.forEach(function(dt,i){
      if(!dt||dt<from||dt>fin) return;
      doses.push({date:dt, rang:i+1, sur:so2.dates.length, dose:so2.dose,
                  unite:so2.unite||'cL', ids:ids, ref:ids[0]||''});
    });
  });
  doses.sort(function(a,b){ return a.date<b.date?-1:(a.date>b.date?1:0); });
  return {doses:doses, nom:nom};
}

// Le parc a futs, par le moteur du parc. ⚠️ _mvFutParc PREND SES DONNEES EN
// ARGUMENT (utils.js est importe en premier) — meme appel que reserve.js.
function _mlParc(){
  if(typeof window._mvFutParc!=='function'||!window.INTRANTS) return null;
  try{ return window._mvFutParc(window.INTRANTS, CAVE_ELEVAGE, null); }
  catch(e){ if(window.logError) window.logError({level:'info',cat:'cave',msg:'aujourdhui/parc',err:e}); return null; }
}

// Phase du calendrier : elle decide de l'ORDRE et du verdict de vendange,
// jamais de la presence d'un bloc.
function _mlPhase(){
  var m=new Date().getMonth()+1;
  if(m>=8 && m<=10) return 'vendange';
  if(m>=4 && m<=7) return 'embouteillage';
  return 'elevage';
}

// L'agenda complet : celui du Cuvier et des ouillages (_mlAgenda), plus ce
// que le Chai sait — soutirage a faire, malo bloquee, doses de SO2.
function _mlAgendaComplet(from,nSem){
  nSem=nSem||_ML_SEM;
  var sem=_mlAgenda(from,nSem);
  function pousse(d,item){
    for(var k=0;k<sem.length;k++){
      if(d>=sem[k].lundi && d<=sem[k].dim){ item.date=d; sem[k].items.push(item); return true; }
    }
    return false;
  }
  _mlMalo().forEach(function(x){
    if(x.cas==='a_soutirer'){
      pousse(from,{kind:'soutirage', titre:x.nom,
        detail:'malo finie'+(x.ref?' le '+_mlFrC(x.ref):'')+', pas encore soutir\u00e9e', ref:x.id});
    } else if(x.p&&x.p.etat==='bloquee'){
      pousse(from,{kind:'malo', titre:x.nom,
        detail:'l\u2019acide malique ne descend plus \u00b7 '+_mvF1(x.p.mal)+' g/L',
        note:'malo bloqu\u00e9e \u2014 \u00e0 contr\u00f4ler', urgence:'due', ref:x.id});
    }
  });
  var so=_mlSo2Doses(from,nSem);
  so.doses.forEach(function(d){
    pousse(d.date,{kind:'so2', titre:so.nom[d.ref]||'Cuv\u00e9e',
      detail:'dose '+d.rang+'/'+d.sur+(d.dose?' \u00b7 '+d.dose+' '+d.unite:''),
      note:'programm\u00e9e au soutirage', ref:d.ref});
  });
  // Meme regle d'ordre que _mlAgenda : jamais (ordre[k]||9), 'alerte' vaut 0.
  var ordre={alerte:0,malo:0,mesure:1,soutirage:2,fa:3,decuvage:4,so2:5,demarrage:6,ouillage:7};
  sem.forEach(function(s){
    s.items.sort(function(a,b){
      if(a.date!==b.date) return a.date<b.date?-1:1;
      var oa=(ordre[a.kind]!=null?ordre[a.kind]:9), ob=(ordre[b.kind]!=null?ordre[b.kind]:9);
      return oa-ob;
    });
  });
  return sem;
}

// Ce qui n'a pas de date : on le liste a part, on ne l'invente pas.
function _mlSansDate(parc){
  var l=[];
  if(parc&&parc.aReformer>0){
    l.push({kind:'fut', titre:parc.aReformer+' f\u00fbt'+(parc.aReformer>1?'s':'')+' au-del\u00e0 de '+parc.vie+' vins',
      detail:'\u00e0 renouveler avant le prochain entonnage \u00b7 '+(parc.libres||0)+' libre'+(parc.libres>1?'s':'')+' au magasin', ref:''});
  }
  return l;
}

// LE VERDICT — un constat, jamais un jugement. Meme hierarchie que le
// Pilotage (§20g), plus « a mesurer » juste apres les alertes : c'est la
// question du matin en vendange, et la barre d'etat du Cuvier la compte deja.
// Un geste passe devant un rappel de date.
function _mlVerdict(sem, ctx){
  ctx=ctx||{};
  var items=[]; (sem||[]).forEach(function(s){ items=items.concat(s.items); });
  function n(k,u){ return items.filter(function(i){ return i.kind===k&&(u==null||i.urgence===u); }).length; }
  var cand=[];
  // Une cuve qui ralentit ET chauffe porte deux lignes d'alerte : on compte
  // les cuves, pas les lignes.
  var vuAl={}, nAl=0;
  items.forEach(function(i){ if((i.kind==='alerte'||i.kind==='malo')&&!vuAl[i.ref||i.titre]){ vuAl[i.ref||i.titre]=1; nAl++; } });
  if(nAl) cand.push({cls:'due', t:nAl+' cuve'+(nAl>1?'s demandent':' demande')+' un contr\u00f4le',
    why:'La fermentation ralentit, la temp\u00e9rature est haute ou la malo ne descend plus. C\u2019est le seul point qui ne peut pas attendre demain.'});
  // « A mesurer » = pas de releve depuis hier ou avant : la definition du
  // Cuvier (_vendStale >= 1), celle de sa barre d'etat et du resume de la
  // semaine. Ne compter que les « due » (>= 2 j) faisait dire 1 au verdict
  // quand la ligne du dessous disait 2.
  var nMe=n('mesure');
  if(nMe) cand.push({cls:'due', t:nMe+' cuve'+(nMe>1?'s':'')+' \u00e0 mesurer',
    why:'Pas de relev\u00e9 depuis hier ou avant.'});
  if(ctx.phase==='vendange'&&ctx.haReste>0) cand.push({cls:'warn', t:_mvF1(ctx.haReste)+' ha restent \u00e0 rentrer',
    why:'V\u00e9rifiez que la cuverie suit avant la prochaine journ\u00e9e de r\u00e9colte.'});
  var vu={}, nOu=0;
  items.forEach(function(i){ if(i.kind==='ouillage'&&i.urgence==='due'&&!vu[i.ref]){ vu[i.ref]=1; nOu++; } });
  if(nOu) cand.push({cls:'warn', t:nOu+' cuv\u00e9e'+(nOu>1?'s':'')+' \u00e0 ouiller',
    why:'Le seuil d\u2019ouillage est d\u00e9pass\u00e9.'});
  var nS=n('soutirage');
  if(nS) cand.push({cls:'warn', t:nS+' cuv\u00e9e'+(nS>1?'s ont':' a')+' fini sa malo',
    why:'C\u2019est le moment de soutirer.'});
  var nSo=(sem&&sem[0])?sem[0].items.filter(function(i){ return i.kind==='so2'; }).length:0;
  if(nSo) cand.push({cls:'warn', t:nSo+' dose'+(nSo>1?'s':'')+' de SO\u2082 cette semaine',
    why:'Vous les aviez programm\u00e9es en enregistrant le soutirage. L\u2019application rappelle la date, elle ne sait pas si la dose a \u00e9t\u00e9 faite.'});
  var parc=ctx.parc;
  if(parc&&parc.aReformer>0) cand.push({cls:'warn', t:parc.aReformer+' f\u00fbt'+(parc.aReformer>1?'s arrivent':' arrive')+' en fin de vie',
    why:'Apr\u00e8s ce mill\u00e9sime, ces barriques auront fait '+parc.vie+' vins.'});
  if(!cand.length) return {cls:'ok', t:'Rien ne presse aujourd\u2019hui',
    s:'Ouillage \u00e0 jour, aucune fermentation \u00e0 surveiller, parc \u00e0 f\u00fbts suffisant.'};
  var first=cand[0], s='';
  if(cand.length>1) s='Et '+cand[1].t+'. ';
  return {cls:first.cls, t:first.t, s:s+first.why};
}

var _AUJ_ICO={ouillage:'goutte', mesure:'thermometre', fa:'sablier', decuvage:'cuve', alerte:'alerte',
  demarrage:'flamme', soutirage:'barrique', malo:'eprouvette', so2:'fiole', fut:'barrique'};
// Le verbe du geste — c'est lui qu'on lit a droite de la ligne, pas un chemin.
var _AUJ_VERBE={ouillage:'Ouiller', mesure:'Relever', fa:'Voir', decuvage:'D\u00e9cuver', alerte:'Relever',
  demarrage:'Voir', soutirage:'Soutirer', malo:'Voir', so2:'Doser', fut:'Le parc'};

function _aujInjectCss(){
  if(document.getElementById('mv-auj-css')) return;
  var s=document.createElement('style'); s.id='mv-auj-css';
  s.textContent=''
  +'.auj-hero{background:var(--bg-card,#FBFAF6);border:1px solid var(--gris-clair,#ECE6DA);border-radius:16px;padding:16px;margin-bottom:12px;box-shadow:0 1px 4px rgba(20,17,13,.06)}'
  +'.auj-k{font-size:var(--pt-lbl,10.5px);letter-spacing:.4px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F)}'
  +'.auj-big{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:var(--pt-xxl,31px);font-weight:600;line-height:1.05;margin:4px 0 2px;color:var(--texte,#1A1A14)}'
  +'.auj-hero.due .auj-big{color:var(--rouge,#A0291E)}.auj-hero.warn .auj-big{color:var(--orange,#B85A1A)}.auj-hero.ok .auj-big{color:var(--vert-med,#3D6B27)}'
  +'.auj-sous{font-size:var(--pt-txt,12.5px);color:var(--texte-med,#4A4A3A);line-height:1.45}'
  +'.auj-cadre{display:flex;gap:8px;align-items:flex-start;font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:10px;line-height:1.4}'
  +'.auj-cadre i{flex:0 0 2px;height:14px;background:var(--or,#C2A14D);border-radius:2px;margin-top:2px}'
  +'.auj-cadre .mv-i{margin-left:4px;vertical-align:-3px}'
  +'.auj-ic{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;margin-top:2px;background:var(--gris-clair,#ECE6DA);color:var(--texte-med,#4A4A3A)}'
  +'.mlx-ev.due .auj-ic{background:var(--rouge-pale,#FAEAE8);color:var(--rouge-tx,#A0291E)}'
  +'.mlx-ev.warn .auj-ic{background:var(--orange-pale,#FBF0E6);color:var(--orange,#B85A1A)}'
  +'.auj-act{align-self:center;border:1px solid var(--terre,#8A5A38);color:var(--terre,#8A5A38);font-weight:600;font-size:var(--pt-txt,12.5px);padding:7px 11px;border-radius:9px;white-space:nowrap;flex-shrink:0}'
  +'.mlx-ev.due .auj-act{border-color:var(--rouge,#A0291E);color:var(--rouge,#A0291E)}'
  +'.auj-sd{margin-top:14px}'
  +'.cave-kpis-note{display:flex;gap:6px;align-items:center;font-size:var(--pt-lbl,10.5px);color:var(--texte-doux,#5F5F5F);padding:6px 16px 0}'
  +'.cave-kpis-note i{display:inline-block;width:2px;height:12px;background:var(--or,#C2A14D);border-radius:2px;flex-shrink:0}';
  document.head.appendChild(s);
}

// L'ecran : verdict, puis les quatre semaines en trois blocs, puis ce qui n'a
// pas de date. Chaque ligne est un bouton vers le geste (_mlGo).
function _aujRender(){
  var from=_mlAuj(), sem=_mlAgendaComplet(from,_ML_SEM);
  var mil=_mlCampagne(), haR=0;
  try{ (_mlResteARentrer(mil)||[]).forEach(function(p){ haR+=parseFloat(p.surface)||0; }); }
  catch(e){ if(window.logError) window.logError({level:'info',cat:'cave',msg:'aujourdhui/reste',err:e}); }
  var parc=_mlParc();
  var v=_mlVerdict(sem,{phase:_mlPhase(), haReste:haR, parc:parc});
  var nFA=(CAVE_VENDANGE.cuves_vinif||[]).filter(_vendIsActive).length;
  var nEl=(CAVE_ELEVAGE.cuvees||[]).filter(function(c){ return c&&c.statut!=='embouteille'; }).length;
  var h='<div class="auj-hero '+v.cls+'"><div class="auj-k">Ce qui presse</div>'
    +'<div class="auj-big">'+_escHtml(v.t)+'</div><div class="auj-sous">'+_escHtml(v.s)+'</div>'
    +'<div class="auj-cadre"><i></i><span>Calcul\u00e9 sur '+nFA+' cuve'+(nFA>1?'s':'')+' en fermentation et '
    +nEl+' cuv\u00e9e'+(nEl>1?'s':'')+' en \u00e9levage, avec le seuil d\u2019ouillage de chaque mill\u00e9sime.'
    +(typeof window._mvInfoBtn==='function'?window._mvInfoBtn('cave.auj'):'')+'</span></div></div>';
  // Trois blocs : cette semaine, la suivante, puis les deux dernieres ensemble.
  var blocs=[{t:'Cette semaine', s:[sem[0]], now:true},
             {t:'Semaine prochaine', s:[sem[1]]},
             {t:'Dans 2 \u00e0 4 semaines', s:sem.slice(2)}];
  var vide=sem.every(function(s){ return !s.items.length; });
  if(vide){
    h+='<div class="mlx-empty">Rien ne vient dans les quatre prochaines semaines.<br>'
      +'Ni f\u00fbt \u00e0 ouiller, ni cuve en fermentation, ni soutirage en attente.</div>';
  } else {
    blocs.forEach(function(b){
      var items=[], r={futs:0,litres:0,alertes:0,mesures:0};
      b.s.forEach(function(s){ if(!s) return; items=items.concat(s.items);
        var rr=_mlResumeSem(s); r.futs+=rr.futs; r.litres+=rr.litres; r.alertes+=rr.alertes; r.mesures+=rr.mesures; });
      var d0=b.s[0]?b.s[0].lundi:null, d1=b.s[b.s.length-1]?b.s[b.s.length-1].dim:null;
      var sum=[];
      if(r.futs) sum.push('<b>'+r.futs+' f\u00fbt'+(r.futs>1?'s':'')+'</b> \u00e0 ouiller (~'+r.litres+' L)');
      if(r.mesures) sum.push(r.mesures+' cuve'+(r.mesures>1?'s':'')+' \u00e0 mesurer');
      if(r.alertes) sum.push('<span class="al">'+r.alertes+' alerte'+(r.alertes>1?'s':'')+'</span>');
      h+='<div class="mlx-wk'+(b.now?' now':'')+'">'
        +'<div class="mlx-wkh"><span class="mlx-wkt">'+b.t+'</span>'
        +(b.now?'<span class="mlx-wknow">en cours</span>':'')
        +(d0&&d1?'<span class="mlx-wkd">'+_mlFrC(d0)+' \u2013 '+_mlFrC(d1)+'</span>':'')+'</div>'
        +(sum.length?'<div class="mlx-wks">'+sum.join(' \u00b7 ')+'</div>':'')
        +(items.length?items.map(_mlEvHtml).join(''):'<div class="mlx-wke">Rien de pr\u00e9vu.</div>')
        +'</div>';
    });
  }
  var sd=_mlSansDate(parc);
  if(sd.length){
    h+='<div class="mlx-wk auj-sd"><div class="mlx-wkh"><span class="mlx-wkt">Sans \u00e9ch\u00e9ance</span></div>'
      +sd.map(_mlEvHtml).join('')+'</div>';
  }
  h+='<div class="mlx-hint" style="margin-top:14px">Tout vient de ce qui est d\u00e9j\u00e0 saisi : relev\u00e9s de densit\u00e9, dernier ouillage, analyses de malo, soutirages. Rien de plus \u00e0 remplir.</div>';
  return h;
}

function renderCaveAujourdhui(){
  _mlInjectCss(); _aujInjectCss();
  // ⚠️ renderCave ne masque #cave-view-mil qu'APRES la branche aujourdhui :
  //   venir du millesime laissait sa vue visible sous celle-ci.
  var mlv=document.getElementById('cave-view-mil'); if(mlv) mlv.style.display='none';
  var host=document.getElementById('cave-view-auj'); if(!host) return;
  host.style.display='block';
  var body=document.getElementById('auj-body'); if(!body) return;
  if(!window._dataReady){ body.innerHTML=window._mvSk?window._mvSk('chai'):''; return; }
  body.innerHTML=_caveSaisBanner()+_aujRender();
}

// ── L'EN-TETE ET LA BANDE, UNE SEULE FOIS ────────────────────────────────
// Trois sections ecrivaient chacune le titre, l'icone, le badge ET les quatre
// chiffres de #cave-kpis — trois bandes differentes sous le meme en-tete, et
// « 162 hL en cuve » ici quand la bande d'a cote disait autre chose (§91).
// La bande est la photo de la Cave entiere, la meme sur les quatre onglets ;
// c'est la regle des quatre photos du Pilotage. Le filtre millesime du Chai
// n'agit que sur sa liste.

// Un millesime « a de la matiere » des qu'une seule etape est renseignee.
function _mlMatiere(ch){ if(!ch) return false;
  return (ch.kg>0)||(ch.hlDecuve>0)||(ch.hlCuve>0)||(ch.hlFut>0)||(ch.btl>0); }

// Le millesime en cuve : la campagne ouverte si elle a de la matiere, sinon
// le precedent — le 7 aout, la campagne vient de s'ouvrir et le vin en cave
// est celui de l'annee d'avant.
function _caveMilMatiere(){
  var mil=_mlCampagne(), ch=null, m=mil;
  for(var k=0;k<2;k++){
    var c=null;
    try{ c=_mlChaine(mil-k); }
    catch(e){ if(window.logError) window.logError({level:'info',cat:'cave',msg:'kpis/chaine',err:e}); }
    if(c&&_mlMatiere(c)){ ch=c; m=mil-k; break; }
  }
  return {mil:m, ch:ch};
}

function _caveHeaderRender(){
  var ico=document.getElementById('cave-hdr-ico'); _mvSetIcon(ico,'verre',20);
  var ttl=document.getElementById('cave-hdr-title'); if(ttl) ttl.textContent='Cave';
  var sub=document.getElementById('cave-hdr-sub'); if(sub) sub.textContent=(window.DOMAINE_NOM||'Mon domaine');
  var bdg=document.getElementById('cave-hdr-badge'); if(bdg) bdg.textContent='Campagne '+_mlCampagne();
  if(typeof window._mvMetaSync==='function') window._mvMetaSync();
}

function _caveKpisRender(){
  _aujInjectCss();
  var kp=document.getElementById('cave-kpis'); if(!kp) return;
  var note=document.getElementById('cave-kpis-note');
  if(!window._dataReady){ kp.innerHTML=''; kp.style.display='none'; if(note) note.style.display='none'; return; }
  var mm=_caveMilMatiere(), ch=mm.ch;
  // Les futs en vin se comptent comme Le Chai les compte (_caveNbTonneaux :
  // tonneaux[] ou l'ancien nb_tonneaux). ⚠️ Pas parc.occupes : _mvFutEnVin ne
  // lit que tonneaux[], une cuvee d'avant le parc n'y a aucun fut.
  var futsVin=(CAVE_ELEVAGE.cuvees||[]).filter(function(c){ return c&&c.statut!=='embouteille'; })
        .reduce(function(s,c){ return s+_caveNbTonneaux(c); },0);
  var sem=_mlAgendaComplet(_mlAuj(),1);
  var aFaire=sem[0].items.length;
  // Source absente ⇒ tiret, jamais zero. hlCuve est une estimation d'apres les
  // kilos tant que rien n'est decuve : elle porte son « ≈ ».
  var hl = ch ? ((ch.hlCuve>0?'\u2248 ':'')+ch.hlCuve) : '\u2014';
  var t  = ch ? (_mvF1((ch.kg||0)/1000)+' t') : '\u2014';
  var kpis=[[hl,'hL en cuve',false],[futsVin,'f\u00fbts en vin',false],[aFaire,'\u00e0 faire',aFaire>0],[t,'rentr\u00e9es',false]];
  kp.style.display='';
  kp.innerHTML=kpis.map(function(k){
    return '<div class="mvu-kpi'+(k[2]?' due':'')+'"><div class="mvu-kpi-v">'+k[0]+'</div><div class="mvu-kpi-l">'+k[1]+'</div></div>';
  }).join('');
  if(note){
    var mils=_caveMilsEnCave().filter(function(m){ return m!=='?' && String(m)!==String(mm.mil); });
    var txt = (ch&&ch.hlCuve>0) ? ('Mill\u00e9sime '+mm.mil+' en cuve') : 'Rien en cuve';
    if(mils.length) txt+=' \u00b7 '+mils.join(', ')+' au chai';
    else if(futsVin>0) txt+=' \u00b7 '+mm.mil+' au chai';
    note.style.display='';
    note.innerHTML='<i></i>'+_escHtml(txt);
  }
}

// _mlSetTab a disparu avec la barre de sous-onglets : « Ce qui vient » est
// l'onglet Aujourd'hui de la Cave, et La ligne de vie est seule ici. Le lot
// des courbes recreera un aiguillage quand il y aura deux vues.

// ═══════════════════════════════════════════════════════════
// REGLAGES & DOCUMENTS DE LA CAVE — la roue crantee de l'en-tete (lot CAVE-2)
//
// « Reglages » vivait DEUX fois dans la Cave : un onglet du Cuvier, un onglet
// du Chai — plus le module Reglages. Ce qu'on regle une fois l'an n'a rien a
// faire entre deux onglets du quotidien : il sort dans une vue unique, ouverte
// par la roue crantee de l'en-tete, qui reunit les reglages du Cuvier, ceux du
// Chai, le renvoi vers les appellations, et les documents de la cave.
//
// ⚠️ AUCUNE COPIE : renderVendParam et renderCaveReglages restent les deux
//    seuls ecrivains de leurs reglages, ils changent seulement d'hote. Les
//    documents viennent du catalogue MV_DOCS (reglages.js) par docsGo(i) —
//    Reglages › App › Documents & impressions reste l'endroit qui les a TOUS,
//    ceci est un raccourci, pas une seconde liste.
// ⚠️ 'reglages' est une section SANS onglet : la barre ne la montre pas, seule
//    la roue l'ouvre. Les anciennes cles ('param' du Cuvier, 'reglages' du
//    Chai) y atterrissent — un client qui les demande encore ne voit pas le vide.
// ═══════════════════════════════════════════════════════════

function _caveRegInjectCss(){
  if(document.getElementById('mv-creg-css')) return;
  var s=document.createElement('style'); s.id='mv-creg-css';
  s.textContent=''
  +'.creg-h{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:var(--pt-lg,23px);font-weight:600;color:var(--texte,#1A1A14);line-height:1.1}'
  +'.creg-s{font-size:var(--pt-txt,12.5px);color:var(--texte-doux,#5F5F5F);margin:2px 0 6px}'
  +'.creg-grp{font-size:var(--pt-lbl,10.5px);letter-spacing:.13em;text-transform:uppercase;color:var(--terre,#8A5A38);font-weight:600;margin:18px 2px 8px}'
  +'.creg-row{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;text-align:left;font-family:inherit;background:var(--bg-card,#FBFAF6);border:1px solid var(--gris-clair,#ECE6DA);border-radius:12px;padding:11px 12px;margin-bottom:6px;font-size:var(--pt-txt,12.5px);color:var(--texte,#1A1A14);cursor:pointer;min-height:44px}'
  +'.creg-row:disabled{opacity:.5;cursor:default}'
  +'.creg-row .l{display:flex;align-items:center;gap:10px;min-width:0}'
  +'.creg-row .ic{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;flex-shrink:0;background:var(--gris-clair,#ECE6DA);color:var(--texte-med,#4A4A3A)}'
  +'.creg-row .t{font-weight:500}'
  +'.creg-row .d{display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:1px}'
  +'.creg-row .r{font-size:var(--pt-txt,12.5px);color:var(--texte-doux,#5F5F5F);white-space:nowrap;flex-shrink:0}'
  +'#cave-hdr-gear.active{background:var(--or,#C2A14D);color:var(--cave,#14110D);border-color:var(--or,#C2A14D)}';
  document.head.appendChild(s);
}

// Ouvre la vue depuis la roue crantee, ou depuis une ancienne cle d'onglet.
function _caveOpenReglages(){
  caveSection='reglages';
  renderCave();
}

// Les appellations et leurs plafonds sont un reglage du DOMAINE, pas de la
// cave : on y va, on ne les recopie pas. Meme geste que _pilGo du Pilotage.
function _caveGoAoc(){
  if(window.goTo) window.goTo('reglages');
  setTimeout(function(){
    try{
      if(typeof window.switchReglTab==='function') window.switchReglTab('domaine');
      var el=document.getElementById('aoc-card'); if(!el) return;
      el.scrollIntoView({behavior:'smooth',block:'center'});
      el.style.transition='box-shadow .25s'; el.style.boxShadow='0 0 0 3px var(--or)';
      setTimeout(function(){ el.style.boxShadow=''; },1400);
    }catch(e){ if(window.logError) window.logError({level:'info',cat:'cave',msg:'reglages/aoc',err:e}); }
  },240);
}

// Les documents de la cave : ceux du catalogue MV_DOCS dont le module est la
// cave, plus le bilan de campagne et l'inventaire des futs, qui parlent d'elle.
var _CREG_DOC_ICO={cuverie:'journal', manip:'liste', bilan:'document', futs:'barrique',
  matur:'microscope', recoltes:'raisin', elevage:'barrique'};
function _caveRegDocs(){
  var cat=window.MV_DOCS; if(!Array.isArray(cat)) return [];
  var out=[];
  cat.forEach(function(d,i){
    if(!d) return;
    if(d.mod==='cave'||d.act==='bilan'||d.act==='futs') out.push({i:i, d:d});
  });
  return out;
}
function _caveRegDocsHtml(){
  var l=_caveRegDocs();
  if(!l.length) return '<div class="mlx-hint">Les documents s\u2019\u00e9ditent depuis R\u00e9glages \u203a App \u203a Documents &amp; impressions.</div>';
  var can=function(mod){ if(!mod) return true;
    try{ return (typeof window._canModule==='function')?!!window._canModule(mod):true; }catch(e){ return true; } };
  return l.map(function(x){
    var d=x.d, ok=can(d.mod);
    return '<button type="button" class="creg-row" onclick="docsGo('+x.i+')"'+(ok?'':' disabled')+'>'
      +'<span class="l"><span class="ic">'+_mvIcon(_CREG_DOC_ICO[d.act]||'document',16)+'</span>'
      +'<span><span class="t">'+_escHtml(d.t||'')+'</span>'
      +(d.ask?'<span class="d">'+_escHtml(d.ask)+'</span>':'')+'</span></span>'
      +'<span class="r">'+_escHtml(String(d.fm||'pdf').toUpperCase())+'</span></button>';
  }).join('')
  +'<div class="mlx-hint" style="margin-top:8px">Tous les documents de l\u2019application restent r\u00e9unis dans R\u00e9glages \u203a App \u203a Documents &amp; impressions.</div>';
}

function renderCaveReglagesCave(){
  _caveRegInjectCss(); _mlInjectCss();
  var mlv=document.getElementById('cave-view-mil'); if(mlv) mlv.style.display='none';
  var host=document.getElementById('cave-view-reg'); if(!host) return;
  host.style.display='block';
  // Le Cuvier et Le Chai ecrivent chacun dans leur hote, comme avant.
  renderVendParam();
  renderCaveReglages();
  var mil=document.getElementById('cave-reg-mil');
  if(mil) mil.innerHTML='<button type="button" class="creg-row" onclick="_caveGoAoc()">'
    +'<span class="l"><span class="ic">'+_mvIcon('etiquette',16)+'</span>'
    +'<span><span class="t">Appellations &amp; plafonds de rendement</span>'
    +'<span class="d">Un r\u00e9glage du domaine, campagne par campagne</span></span></span>'
    +'<span class="r">R\u00e9glages \u203a Domaine \u203a</span></button>';
  var docs=document.getElementById('cave-reg-docs');
  if(docs) docs.innerHTML=_caveRegDocsHtml();
}

// ═══════════════════════════════════════════════════════════
// LE MILLESIME — LES COURBES, LES TUILES, FACE A N-1, LE PARC (lot CAVE-3)
//
// Ce bloc VIENT DU PILOTAGE (ex-onglet Pilotage › Cave, §20g, §89) : il y
// avait ete construit comme une seconde cave, rangee par question, sur les
// moteurs de ce fichier. Le lot CAVE-3 le ramene chez lui. Les noms _pcav* /
// _pcrb* sont conserves tels quels : ils sont prives, les harnais les
// extraient par leur nom, et une renommee de 40 fonctions n'aurait rien dit
// de plus. Ce qui doublait Aujourd'hui (_pcavVuePresse, _pcavVerdict,
// _pcavMalo, _pcavSoutirages…) et La ligne de vie (_pcavFlux, _pcavRdt,
// _pcavBandeau…) n'a PAS ete ramene : supprime.
//   - _pcavCtx()      : le contexte (parc, futL, cuvees en elevage, agenda)
//   - _mlTuiles(ch)   : les quatre chiffres en tete de La ligne de vie
//   - _pcavN1(c,mil)  : face au millesime precedent
//   - _pcavVueParc(c) : le parc a futs → rendu dans La Reserve › Futs
//   - _pcavVueCourbes(c) + _pcrbPose() : Le millesime › Les courbes
// ═══════════════════════════════════════════════════════════
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
// Cliquet C14 : aucun catch(_e){} vide. Un repli qui echoue reste un repli,
// mais il laisse une trace en 'info' — c'est ainsi qu'on apprend qu'un
// moteur de la Cave a change de contrat.
function _pcavLog(ou,e){ if(window.logError) window.logError({level:'info',cat:'cave',msg:'millesime/'+ou,err:e}); }
// Un millesime « a de la matiere » des qu'une seule etape est renseignee.
// Sans ce test, un domaine vierge voit quatre tuiles a zero au lieu d'une
// phrase honnete — et un parcours qui grossit au lieu de retrecir.
function _pcavMatiere(ch){ if(!ch) return false;
  return (ch.kg>0)||(ch.hlDecuve>0)||(ch.hlCuve>0)||(ch.hlFut>0)||(ch.btl>0); }

// Millesime courant = celui de la campagne ouverte le 1er aout precedent.
// _mvCampagneDe est la source unique (utils.js) ; repli local si absent.
function _pcavCampagne(){
  var iso=_mvToday();
  if(_pcavHas('_mvCampagneDe')){ try{ return window._mvCampagneDe(iso); }catch(e){ _pcavLog('campagne',e); } }
  var y=parseInt(iso.slice(0,4),10), m=parseInt(iso.slice(5,7),10);
  return m>=_mvCampMoisRepli()+1?y:y-1;   /* ★ AXE-1 : meme reglage que la source */
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
function _pcavCtx(){
  var mil=_pcavCampagne(), c={mil:mil, phase:_pcavPhase()};
  c.alerte=_caveSeuilGlobal()||14;
  c.cuvees=(window.CAVE_ELEVAGE&&CAVE_ELEVAGE.cuvees)||[];
  c.enElevage=c.cuvees.filter(function(x){ return x&&x.statut!=='embouteille'; });
  try{ c.agenda=_pcavHas('_mlAgenda')?window._mlAgenda(_mvToday(),4):null; }
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
  var d1=_mvToday();
  var _d0=new Date(); _d0.setFullYear(_d0.getFullYear()-1);
  var d0=_mvISO(_d0);
  // Millesime de chaque cuvee, pour ventiler les ouillages.
  var milDe={}, futDe={}, litDe={};
  c.enElevage.forEach(function(x){
    if(!x||!x.id) return;
    milDe[x.id]=_pcavMilKey(x.millesime);
    futDe[x.id]=(x.tonneaux||[]).reduce(function(s,t){ return s+(parseInt(t.nb,10)||0); },0);
    litDe[x.id]=_caveFutsL(x);   // ★ FUT-CAP : chaque fut a SA contenance
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
    if(!par[k]) par[k]={mil:k, L:0, ops:0, futs:0, futL:0};
    par[k].L+=v; par[k].ops++;
  });
  // Volume loge par millesime = ses futs en vin, chacun a SA contenance (FUT-CAP).
  c.enElevage.forEach(function(x){
    if(!x||!x.id) return;
    var k=milDe[x.id]; if(!par[k]) return;
    par[k].futs+=futDe[x.id]||0;
    par[k].futL+=litDe[x.id]||0;
  });
  var lignes=Object.keys(par).map(function(k){
    var p=par[k], loge=p.futL/100;
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
// ★ 7e ARGUMENT OPTIONNEL, comme _pilTile : la cle de la fiche « i ». Les
//   appels existants restent valides tels quels et posent leur pastille au fur
//   et a mesure que leur fiche est ecrite. La pastille va dans l'EN-TETE, a
//   cote du titre — pas dans le pied, ou elle serait sous le graphe.
function _pcavCard(ico,dot,titre,stat,body,mini,infoCle){
  return '<div class="pcav-card"><div class="pcav-h"><span class="pcav-dot" style="background:'+dot+'"></span>'
    +'<span class="pcav-ico">'+ico+'</span><span class="pcav-t">'+_escHtml(titre)+'</span>'
    +(infoCle&&typeof window._mvInfoBtn==='function'?window._mvInfoBtn(infoCle):'')
    +(stat?'<span class="pcav-stat">'+stat+'</span>':'')+'</div>'
    +'<div class="pcav-b">'+body+'</div>'
    +(mini?'<div class="pcav-mini">'+mini+'</div>':'')+'</div>';
}
function _pcavK(lab,val,unit,sub,dark,col){
  return '<div class="pcav-k'+(dark?' dark':'')+'"><div class="pcav-kl">'+_escHtml(lab)+'</div>'
    +'<div class="pcav-kv"'+(col?' style="color:'+col+'"':'')+'>'+val+(unit?' <small>'+_escHtml(unit)+'</small>':'')+'</div>'
    +(sub?'<div class="pcav-ks">'+sub+'</div>':'')+'</div>';
}

// Depuis le Pilotage il faut d'abord ATTERRIR sur la Cave : _mlGo appelle
// renderCave() mais ne change pas de page. Expression window : appelee
// depuis un onclick, C15 la verrait morte sinon (cf. _arcOpen).
// ★ Poser un plafond depuis le Pilotage. L'ECRITURE n'est pas ici : c'est
//   `_mlSetRdtMax` (cave.js) qui verifie le droit, ecrit dans PARCELLES et
//   propose la pose groupee. On ne lui passe que deux choses — l'annee que CET
//   ecran affiche, et ce qu'il faut redessiner quand c'est fait.
// ⚠️ Sans la Cave chargee, on le DIT au lieu d'ouvrir une saisie qui ne partira
//   nulle part. Le silence, ici, ressemblerait exactement au defaut qu'on corrige.


// Les millesimes reellement en cave, pour savoir s'il faut grouper.
// ── Fermentations ────────────────────────────────────────────────────
// ── Cuverie face au reste a rentrer ─────────────────────────────────
// SEUL calcul neuf du lot : _mlResteARentrer renvoie des PARCELLES, pas des
// hectolitres. On applique le rendement moyen deja constate sur la campagne
// aux surfaces non recoltees. C'est un ordre de grandeur, l'ecran le dit.
// Statuts de cuve REELS : 'setup' | 'fa' | 'mpf' | 'termine'. Une cuve est
// active en 'fa'/'mpf' (meme critere que _vendIsActive), libre sinon.
// « Prete a decuver » n'est pas un drapeau : c'est _mlProjFA().etat==='sec'.
// ── Renouvellement du parc ───────────────────────────────────────────
// ── Elevage en cours ─────────────────────────────────────────────────
// L'app n'a AUCUN drapeau « prete a embouteiller » — ne pas en inventer un.
// On affiche un fait verifiable : la duree d'elevage depuis date_entree, et
// le nombre de futs qui reviendraient au parc a la mise.
// ── Soutirage & malo ─────────────────────────────────────────────────
// ⚠ MODELE : le soutirage se declenche a la fin de la malo, jamais a une
// date. Et la fin se projette sur les valeurs d'acide malique MESUREES sur
// CETTE cuvee — pas sur la duree des malos passees du domaine.
// Le Pilotage consomme _mlProjMalo (cave.js), il ne recalcule rien.
// Les doses de SO2 programmees a la saisie d'un soutirage. so2.dates[] est
// STOCKE, puis plus jamais rappele nulle part. On ne montre que les doses A
// VENIR : rien ne dit qu'une dose passee a ete faite, l'annoncer en retard
// serait une accusation sans preuve.
// Le dernier soutirage de chaque cuvee. cave.js en porte la definition
// (_caveLastSout) : on la consomme plutot que d'en garder une copie, sinon
// les deux ecrans divergent au premier changement. Repli local pour un
// cave.js anterieur chez un client pas encore a jour.
// Date a laquelle la malo a ete CONSTATEE finie. Elle sert de reference au
// geste : un soutirage anterieur a cette date n'acquitte pas celui-ci.
// Sans elle, un soutirage de mars valait quitus pour une malo finie en mai.
// Etat de chaque cuvee vis-a-vis du soutirage. Tout vient de _mlProjMalo,
// sauf le drapeau declaratif fml_terminee, qui reste une verite du vigneron :
// s'il declare la malo finie, elle est finie, meme sans mesure.
// La courbe : decroissance mesuree, en CSS pur. Un SVG a viewBox fixe
// s'etire a ×5 sur grand ecran — piege corrige en aout sur la pyramide.
// ── Verdict : le titre de l'onglet, un CONSTAT, jamais un jugement ───
// Cuvees dont la malo est finie et qui n'ont pas ete soutirees depuis.
// C'est un GESTE en attente, il passe devant un simple rappel de date.
// Malos qui stagnent : la pente recente est plate alors qu'il reste du
// malique. C'est le seul etat de cave qui ne peut pas attendre la semaine
// prochaine — une malo arretee redemarre d'autant plus mal qu'on tarde.
// Doses de SO2 tombant dans les 7 jours. Sert au verdict : une date que le
// vigneron a lui-meme programmee et que personne ne lui rappelle.
// ── Onglet 1 : ce qui presse ─────────────────────────────────────────
// L'ORDRE suit le calendrier ; la PRESENCE des blocs ne change jamais.
// ── Onglet 2 : le millesime ──────────────────────────────────────────
// ── Plusieurs millesimes coexistent en cave ──────────────────────────
// ⚠ MODELE CORRIGE PAR NICO : en octobre, le millesime precedent est encore
// en fut pendant que le nouveau entre en cuve. Un domaine qui eleve 24 mois
// en a trois de front. L'ecran ne doit donc jamais supposer l'exclusivite.
// _mlMillesimes() (cave.js) donne deja la liste ; _mlChaine(mil) sait lire
// n'importe lequel. On les consomme, on ne recalcule rien.
// Le bandeau : ce qui est en cave, tous millesimes, avant d'en ouvrir un.
var _PCAV_PHASES={cuve:['En cuve','#7B4DB8'], fut:['En fût','#8A5A38'],
                  bouteille:['En bouteille','#3D6B27'], rentre:['Rentré','#5B9B3A']};
// ── Rendement face au plafond de l'appellation ───────────────────────
// _mlRendements renvoie {parcelle, kg, hlHa, hlMin, hlMax, statut, max,
// depasse, pct, vendu}. max vient de p.rdt_max, saisi par parcelle : sans lui,
// pas de comparaison.
// ★★★ RDT-1 — CETTE CARTE AFFICHAIT UN CHIFFRE NET LA OU LE MILLESIME AFFICHE
// UNE FOURCHETTE. Meme donnee, deux ecrans, deux niveaux de certitude : celui
// qui montre le chiffre net gagne la confiance, et c'est le mauvais. Un volume
// n'est mesure qu'apres le decuvage ; avant, on annonce l'encadrement.
// ── Face a l'an dernier ──────────────────────────────────────────────
// Meme axe que les Archives : campagne du 1er aout au 31 juillet.
// Les quatre chiffres en tete de La ligne de vie — ex-tuiles de Pilotage › Cave ›
// Le millesime, rapportees au millesime que les puces de la Cave ont choisi.
function _mlTuiles(ch){
  if(!ch||!_pcavMatiere(ch)) return '';
  var rm=null; try{ rm=_mlRdtMoyen(ch); }catch(e){ rm={hlHa:null,statut:null,sansSurface:0,approx:0,ha:0}; }
  var sub;
  if(rm.hlHa==null){
    sub=(rm.sansSurface>0||rm.approx>0)?'surface r\u00e9colt\u00e9e non renseign\u00e9e':'mesur\u00e9 au d\u00e9cuvage';
  } else {
    var b=[];
    if(rm.approx>0) b.push(rm.approx+' surface'+(rm.approx>1?'s':'')+' vendue'+(rm.approx>1?'s':'')+' non renseign\u00e9e'+(rm.approx>1?'s':''));
    if(rm.sansSurface>0) b.push(rm.sansSurface+' parcelle'+(rm.sansSurface>1?'s':'')+' \u00e9cart\u00e9e'+(rm.sansSurface>1?'s':''));
    if(!b.length&&rm.statut!=='mesure') b.push('estim\u00e9 \u2014 tout n\u2019est pas d\u00e9cuv\u00e9');
    sub=b.length?b.join(' \u00b7 '):('sur '+_pcavF1(rm.ha)+' ha r\u00e9ellement r\u00e9colt\u00e9s');
  }
  return '<div class="pcav-card"><div class="pcav-kg">'
    +_pcavK('Surface r\u00e9colt\u00e9e',_pcavF1(ch.ha),'ha',(ch.parcelles||0)+' parcelles',1)
    +_pcavK('Raisin rentr\u00e9',_pcavF1((ch.kg||0)/1000),'t',ch.kgVendu?('dont '+_pcavInt(ch.kgVendu)+' kg vendus'):'')
    +_pcavK('Rendement moyen', rm.hlHa!=null?((rm.statut==='mesure'&&!rm.approx?'':'\u2248 ')+_pcavF1(rm.hlHa)):'\u2014','hL/ha',sub)
    +_pcavK('Au chai',_pcavF1(ch.hlFut),'hL',(ch.futs||0)+' barriques')
    +'</div></div>';
}

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
    rows+='<div class="pcav-cmp"><div><div class="pcav-cl">'+_escHtml(lab)+'</div>'
      +'<div class="pcav-cnow">'+_pcavF1(now)+' <small>'+_escHtml(unit)+'</small></div></div>'
      +'<div><span class="pcav-dl '+(bon?'ok':'wa')+'">'+(d>=0?'+':'')+pct+' %</span></div>'
      +'<div class="pcav-cold">l’an dernier<br><b>'+_pcavF1(old)+' '+_escHtml(unit)+'</b></div></div>';
  }
  var rNow=(cur.ha>0)?cur.hlDecuve/cur.ha:null;
  var rOld=(p.ha>0)?p.hlDecuve/p.ha:null;
  ligne('Rendement moyen',rNow,rOld,'hL/ha',true);
  var pNow=(cur.hlDecuve>0&&cur.hlFut>0)?(cur.hlDecuve-cur.hlFut)/cur.hlDecuve*100:null;
  var pOld=(p.hlDecuve>0&&p.hlFut>0)?(p.hlDecuve-p.hlFut)/p.hlDecuve*100:null;
  ligne('Perte benne → fût',pNow,pOld,'%',false);
  ligne('Raisin rentré',cur.kg/1000,p.kg/1000,'t',true);
  if(!rows) return '';
  return _pcavCard(_mvIcon('chrono',16),'#8A5A38','Face à l’an dernier',
    'campagne '+(_m-1)+'-'+_m, rows,
    'Comparaison par campagne — le même axe que les Archives, sur le mois d’ouverture réglé dans le Pilotage. Le rendement moyen ne porte que sur les parcelles réellement récoltées.');
}

// ── Onglet 2 : assemblage ────────────────────────────────────────────
// ── Onglet 3 : le parc & le cout ─────────────────────────────────────
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
  return _pcavCard(_mvIcon('graphique',16),'#B85A1A','Pyramide des âges','<b>'+p.parc+'</b> barriques',
    '<div class="pcav-pyr">'+rows+leg+'</div>',
    'L’âge se compte en année civile moins année d’achat : la vendange tombe en septembre, donc l’incrément du 1<sup>er</sup> janvier arrive après le millésime.');
}

// ── Part des anges : une mesure, avec sa reserve ecrite a l'ecran ────
function _pcavAngesCard(c){
  var a=c.anges;
  if(!a) return _pcavCard(_mvIcon('sablier',16),'#A0291E','Part des anges','\u2014',
    '<div class="pcav-vide">Aucun volume d\u2019ouillage saisi sur les douze derniers mois.<br>Renseignez le volume total \u00e0 chaque ouillage : cet \u00e9cran mesurera alors ce que l\u2019\u00e9levage vous co\u00fbte r\u00e9ellement.</div>','');
  var rows='';
  a.lignes.forEach(function(x){
    var lbl=(x.mil==='?')?'Sans mill\u00e9sime':x.mil;
    var pct=(x.pctAn==null)?'\u2014':(_pcavF1(x.pctAn)+' %/an');
    rows+='<div class="pcav-agr">'
      +'<div class="pcav-agm">'+_escHtml(lbl)+'<small>'+x.ops+' ouillage'+(x.ops>1?'s':'')+' \u00b7 '+x.futs+' f\u00fbts</small></div>'
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
  return _pcavCard(_mvIcon('sablier',16),'#A0291E','Part des anges', stat, '<div class="pcav-agt">'+rows+'</div>',
    'douze derniers mois \u00b7 une ligne par mill\u00e9sime', 'cave.anges');
}

function _pcavVueParc(c){
  // Rendu en tete de La Reserve › Futs (lot CAVE-3/4). La Reserve porte deja
  // l'etat du parc (total, en vin, libres, a reformer, mouvements de l'annee)
  // et le registre des mouvements : on n'apporte ici QUE ce qu'elle n'a pas —
  // la pyramide des ages et la part des anges.
  // ⚠ La part des anges se calcule sur les FUTS DES CUVEES, pas sur le parc :
  // elle reste disponible meme si l'inventaire de La Reserve est vide.
  var h='';
  try{ h+=_pcavAngesCard(c)||''; }catch(e){ _pcavLog('angescard',e); }
  if(c.parc){ try{ h+=_pcavPyramide(c)||''; }catch(e){ _pcavLog('pyramide',e); } }
  return h;
}

// ── CSS du module. Injecte ici, comme le fait deja le bloc `pec-` : ──
// styles.css n'est pas touche, donc AUCUN bump (pilotage.js seul).
function _pcavInjectCss(){
  if(document.getElementById('pcav-css')) return;
  var css=''
  +'.pcav-verdict{background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:15px;box-shadow:var(--shadow-sm);padding:22px 24px 20px;margin-bottom:16px}'
  +'.pcav-vk{display:flex;align-items:center;gap:10px;font-size:var(--pt-lbl,10.5px);font-weight:600;letter-spacing:2.2px;text-transform:uppercase;color:var(--texte-doux);flex-wrap:wrap}'
  +'.pcav-vbig{font-family:\'Cormorant Garamond\',Georgia,serif;font-weight:600;font-size:var(--pt-hero,40px);line-height:1.04;margin:6px 0 5px;color:var(--texte)}'
  +'.pcav-vsub{font-size:var(--pt-base,14px);color:var(--texte-med);line-height:1.55;max-width:620px}'
  +'.pcav-vsub b{color:var(--texte);font-weight:600}'
  +'.pcav-card{background:var(--bg-card);border:1px solid var(--gris-clair);border-radius:15px;box-shadow:var(--shadow-sm);overflow:hidden;margin-bottom:16px}'
  +'.pcav-h{display:flex;align-items:center;gap:10px;padding:13px 16px;min-height:44px;border-bottom:1px solid var(--gris-clair)}'
  +'.pcav-dot{width:7px;height:7px;border-radius:50%;flex:none}'
  +'.pcav-ico{width:28px;height:28px;border-radius:9px;background:var(--or-pale);display:flex;align-items:center;justify-content:center;flex:none;font-size:var(--pt-base,14px)}'
  +'.pcav-t{font-size:var(--pt-micro,11px);letter-spacing:1.4px;text-transform:uppercase;font-weight:600;color:var(--texte-doux);flex:1}'
  +'.pcav-stat{font-size:var(--pt-micro,11px);color:var(--texte-doux);font-weight:600;white-space:nowrap}'
  +'.pcav-stat b{color:var(--texte)}'
  +'.pcav-b{padding:2px 0}'
  +'.pcav-mini{font-size:var(--pt-micro,11px);color:var(--texte-doux);padding:2px 17px 14px;line-height:1.55}'
  +'.pcav-row{display:flex;align-items:center;gap:13px;padding:12px 17px;border-top:1px solid var(--gris-clair);font-size:var(--pt-txt,12.5px);color:var(--texte-med)}'
  +'.pcav-row:first-child{border-top:none}'
  +'.pcav-row b{color:var(--texte);font-weight:600}'
  +'.pcav-rm{flex:1;min-width:0}'
  +'.pcav-sub{font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:2px;line-height:1.45}'
  +'.pcav-pt{width:8px;height:8px;border-radius:50%;flex:none}'
  +'.pcav-pt.red{background:var(--rouge);box-shadow:0 0 0 3px var(--rouge-pale)}'
  +'.pcav-pt.amb{background:var(--orange);box-shadow:0 0 0 3px var(--orange-pale)}'
  +'.pcav-pt.ok{background:var(--vert-med);box-shadow:0 0 0 3px var(--vert-pale)}'
  +'.pcav-when{font-size:var(--pt-micro,11px);color:var(--texte-doux);white-space:nowrap}'
  +'.pcav-act{border:1px solid var(--gris);background:var(--bg-card);border-radius:9px;padding:7px 12px;font-family:inherit;font-size:var(--pt-micro,11px);font-weight:600;color:var(--terre);cursor:pointer;white-space:nowrap;min-height:38px}'
  +'.pcav-act:hover{background:var(--or-pale);border-color:var(--or)}'
  +'.pcav-kg{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;padding:16px}'
  +'.pcav-k{background:var(--or-pale);border:1px solid rgba(194,161,77,.28);border-radius:12px;padding:12px 14px}'
  +'.pcav-kl{font-size:var(--pt-lbl,10.5px);letter-spacing:1.3px;text-transform:uppercase;color:var(--texte-doux);font-weight:600}'
  +'.pcav-kv{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:var(--pt-xl,27px);font-weight:600;color:var(--texte);line-height:1.05;margin-top:3px}'
  +'.pcav-kv small{font-size:var(--pt-base,14px);color:var(--texte-doux);font-weight:500}'
  +'.pcav-ks{font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:2px;line-height:1.4}'
  +'.pcav-k.dark{background:var(--cave);border-color:var(--cave)}'
  +'.pcav-k.dark .pcav-kl,.pcav-k.dark .pcav-ks{color:rgba(240,226,200,.55)}'
  +'.pcav-k.dark .pcav-kv{color:#F0E2C8}'
  +'.pcav-k.dark .pcav-kv small{color:rgba(240,226,200,.55)}'
  +'.pcav-flux{padding:18px 20px}'
  +'.pcav-fs{display:grid;grid-template-columns:118px 1fr;gap:14px;align-items:center;margin-bottom:4px}'
  +'.pcav-fn{font-size:var(--pt-micro,11px);font-weight:600;color:var(--texte-med);text-align:right}'
  +'.pcav-fn small{display:block;font-size:var(--pt-lbl,10.5px);color:var(--texte-doux);font-weight:500}'
  +'.pcav-fw{height:38px;display:flex;align-items:center}'
  +'.pcav-fb{height:32px;border-radius:8px;background:linear-gradient(90deg,#7A1020,#B23A52);display:flex;align-items:center;padding-left:12px;color:#F0E2C8;font-size:var(--pt-txt,12.5px);font-weight:600;min-width:74px;box-sizing:border-box}'
  +'.pcav-fb.g{background:linear-gradient(90deg,#2D5016,#5B9B3A)}'
  +'.pcav-fb.o{background:linear-gradient(90deg,#8A5A38,#C2871E)}'
  +'.pcav-fl{display:grid;grid-template-columns:118px 1fr;gap:14px;margin:1px 0 5px}'
  +'.pcav-fl div:last-child{font-size:var(--pt-micro,11px);color:var(--orange);font-weight:600}'
  +'.pcav-pyr{padding:14px 18px 16px}'
  +'.pcav-pl{display:grid;grid-template-columns:82px 1fr 104px;gap:10px;align-items:center;margin-bottom:7px;font-size:var(--pt-txt,12.5px)}'
  +'.pcav-py{color:var(--texte-med);font-weight:600;line-height:1.2}'
  +'.pcav-py small{color:var(--texte-doux);font-weight:500;display:block;font-size:var(--pt-lbl,10.5px)}'
  +'.pcav-pt2{height:22px;background:var(--gris-clair);border-radius:6px;overflow:hidden;display:flex;position:relative}'
  +'.pcav-ps{height:100%}'
  +'.pcav-pmax{position:absolute;left:86.96%;top:0;bottom:0;width:2px;background:var(--texte);opacity:.5}'
  +'.pcav-pn{font-size:var(--pt-micro,11px);color:var(--texte-doux);text-align:right;font-weight:600}'
  /* ⚠️ Un <button> reste une GRILLE : `.pcav-pl` porte deja display:grid, on ne
     redit pas la mise en page ici, on ne fait que retirer l'habillage natif du
     bouton. Redefinir les colonnes creerait une seconde verite qui divergerait
     du palier mobile juste en dessous. */
  +'button.pcav-pl{width:100%;box-sizing:border-box;border:none;background:none;'
    +'font-family:inherit;font-size:var(--pt-txt,12.5px);color:inherit;text-align:left;'
    +'cursor:pointer;padding:5px 7px;border-radius:9px;min-height:44px}'
  +'button.pcav-pl:hover{background:rgba(138,90,56,.07)}'
  +'button.pcav-pl:focus-visible{outline:2px solid var(--terre);outline-offset:1px}'
  +'.pcav-leg{display:flex;gap:14px;flex-wrap:wrap;font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:12px;padding-top:12px;border-top:1px solid var(--gris-clair)}'
  +'.pcav-leg span{display:inline-flex;align-items:center;gap:6px}'
  +'.pcav-leg i{width:11px;height:11px;border-radius:3px;display:inline-block}'
  +'.pcav-cmp{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;padding:13px 17px;border-top:1px solid var(--gris-clair);font-size:var(--pt-txt,12.5px)}'
  +'.pcav-cmp:first-child{border-top:none}'
  +'.pcav-cl{font-size:var(--pt-lbl,10.5px);letter-spacing:1.4px;text-transform:uppercase;color:var(--texte-doux);font-weight:600}'
  +'.pcav-cnow{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:var(--pt-lg,23px);font-weight:600;color:var(--texte);line-height:1.1}'
  +'.pcav-cnow small{font-size:var(--pt-txt,12.5px);color:var(--texte-doux)}'
  +'.pcav-cold{color:var(--texte-doux);text-align:right;font-size:var(--pt-micro,11px);line-height:1.5}'
  +'.pcav-cold b{color:var(--texte-med)}'
  +'.pcav-dl{font-size:var(--pt-micro,11px);font-weight:700;padding:3px 9px;border-radius:20px;white-space:nowrap}'
  +'.pcav-dl.ok{background:var(--vert-pale);color:var(--vert-med)}'
  +'.pcav-dl.wa{background:var(--orange-pale);color:var(--orange)}'
  +'.pcav-note{background:var(--or-pale);border:1px solid rgba(194,161,77,.4);border-radius:12px;padding:12px 15px;font-size:var(--pt-txt,12.5px);color:var(--texte-med);display:flex;gap:10px;align-items:flex-start;line-height:1.5;margin-bottom:16px}'
  +'.pcav-note b{color:var(--texte)}'
  +'.pcav-vide{padding:26px 20px;text-align:center;font-size:var(--pt-txt,12.5px);color:var(--texte-doux);line-height:1.6}'
  +'.pcav-milg{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;padding:16px}'
  +'.pcav-mil{position:relative;text-align:left;border:1px solid var(--gris-clair);background:var(--bg-card);border-radius:12px;padding:12px 14px 12px 16px;cursor:pointer;font-family:inherit;min-height:44px;transition:.15s;display:block;width:100%}'
  +'.pcav-mil:hover{border-color:var(--or);background:var(--or-pale)}'
  +'.pcav-mil.on{background:var(--cave);border-color:var(--cave)}'
  +'.pcav-milp{position:absolute;left:0;top:10px;bottom:10px;width:4px;border-radius:0 3px 3px 0}'
  +'.pcav-mila{display:block;font-family:\'Cormorant Garamond\',Georgia,serif;font-size:var(--pt-xl,27px);font-weight:600;color:var(--texte);line-height:1.05}'
  +'.pcav-mil.on .pcav-mila{color:#F0E2C8}'
  +'.pcav-milf{display:block;font-size:var(--pt-lbl,10.5px);letter-spacing:1.3px;text-transform:uppercase;font-weight:600;color:var(--texte-doux);margin-top:2px}'
  +'.pcav-mil.on .pcav-milf{color:var(--or)}'
  +'.pcav-milv{display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:3px}'
  +'.pcav-mil.on .pcav-milv{color:rgba(240,226,200,.6)}'
  +'.pcav-agt{padding:4px 0}'
  +'.pcav-agr{display:grid;grid-template-columns:1fr auto 78px;gap:12px;align-items:center;padding:11px 17px;border-top:1px solid var(--gris-clair)}'
  +'.pcav-agr:first-child{border-top:none}'
  +'.pcav-agm{font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--texte);line-height:1.25}'
  +'.pcav-agm small{display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux);font-weight:500;margin-top:1px}'
  +'.pcav-agv{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:var(--pt-lg,23px);font-weight:600;color:var(--texte);white-space:nowrap}'
  +'.pcav-agv small{font-family:inherit;font-size:var(--pt-micro,11px);color:var(--texte-doux);font-weight:500}'
  +'.pcav-agp{font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--orange);text-align:right;white-space:nowrap}'
  +'.pcav-grp{display:flex;align-items:baseline;gap:9px;padding:10px 17px 5px;font-size:var(--pt-micro,11px);letter-spacing:1.4px;text-transform:uppercase;font-weight:600;color:var(--terre);border-top:1px solid var(--gris-clair)}'
  +'.pcav-grp:first-child{border-top:none}'
  +'.pcav-grp span{font-size:var(--pt-lbl,10.5px);letter-spacing:0;text-transform:none;color:var(--texte-doux);font-weight:500}'
  +'.pcav-mal{padding:14px 18px 16px;border-top:1px solid var(--gris-clair)}'
  +'.pcav-mrow{display:grid;grid-template-columns:126px 1fr 52px;gap:12px;align-items:end;margin-bottom:14px}'
  +'.pcav-mn{font-size:var(--pt-micro,11px);font-weight:600;color:var(--texte-med);line-height:1.25;padding-bottom:2px}'
  +'.pcav-mn small{display:block;font-size:var(--pt-lbl,10.5px);color:var(--texte-doux);font-weight:500}'
  +'.pcav-mg{position:relative;height:56px;border-bottom:1px solid var(--gris);background:linear-gradient(180deg,rgba(0,0,0,.012),transparent)}'
  +'.pcav-mbar{position:absolute;bottom:0;width:9px;margin-left:-4px;border-radius:3px 3px 0 0;min-height:3px}'
  +'.pcav-msl{position:absolute;left:0;right:0;height:1px;background:var(--vert-med);opacity:.65}'
  +'.pcav-mj{font-size:var(--pt-micro,11px);color:var(--texte-doux);text-align:right;font-weight:600;padding-bottom:2px}'
  +'.pcav-mleg{font-size:var(--pt-micro,11px);color:var(--texte-doux);line-height:1.5;padding-top:10px;border-top:1px solid var(--gris-clair)}'
  /* ── PILCRB-1 : les courbes ───────────────────────────────── */
  +'.pcrb-intro{font-size:var(--pt-txt,12.5px);color:var(--texte-med);line-height:1.65;padding:2px 2px 4px}'
  +'.pcrb-intro b{color:var(--texte)}'
  +'.pcrb-h{display:flex;align-items:flex-start;gap:11px;padding:14px 17px 12px;border-bottom:1px solid var(--gris-clair)}'
  +'.pcrb-ico{width:30px;height:30px;border-radius:9px;background:var(--terre-pale);flex:none;display:flex;align-items:center;justify-content:center;color:var(--terre-tx,#8A5A38)}'
  +'.pcrb-t{flex:1;min-width:0}'
  +'.pcrb-t b{display:block;font-size:var(--pt-base,14px);font-weight:600;color:var(--texte);line-height:1.3}'
  +'.pcrb-t span{display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:2px;line-height:1.45}'
  /* ⚠️⚠️ L'ENCRE DU BADGE EST `--texte-med`, ET C'EST MESURE, PAS CHOISI.
     `--or` sur `--or-pale` donne 6,08:1 en sombre mais 2,23:1 en CLAIR ;
     `--terre` fait l'inverse : 5,27 en clair, 2,64 en sombre. Chercher un
     defaut de contraste dans UN seul theme n'en trouve que la moitie (§67).
     `--texte-med` tient des deux cotes : 8,13 et 7,14. */
  +'.pcrb-j0{font-size:var(--pt-lbl,10.5px);letter-spacing:1.2px;text-transform:uppercase;font-weight:700;color:var(--texte-med);background:var(--or-pale);border:1px solid rgba(194,161,77,.55);border-radius:20px;padding:3px 10px;white-space:nowrap;flex:none;align-self:flex-start}'
  +'.pcrb-b{padding:14px 17px 16px}'
  /* Le graphe deborde plutot que de s'ecraser : sous 360 px, 148 px de
     gouttieres ne laissent pas de quoi lire une courbe. Il defile. */
  +'.pcrb-g{overflow-x:auto;margin:0 -17px;padding:0 17px}'
  +'.pcrb-g svg{display:block}'
  +'.pcrb-note{background:var(--or-pale);border:1px solid rgba(194,161,77,.4);border-radius:12px;padding:11px 14px;font-size:var(--pt-txt,12.5px);color:var(--texte-med);line-height:1.55;margin-top:13px}'
  +'.pcrb-note b{color:var(--texte)}'
  +'.pcrb-act{margin-top:12px}'
  +'.pcrb-tb{width:100%;border-collapse:collapse;font-size:var(--pt-micro,11px);margin-top:13px}'
  +'.pcrb-tb th{text-align:left;font-size:var(--pt-lbl,10.5px);letter-spacing:.9px;text-transform:uppercase;color:var(--texte-doux);font-weight:600;padding:0 0 7px;border-bottom:1px solid var(--gris-clair);white-space:nowrap}'
  +'.pcrb-tb td{padding:8px 0;border-bottom:1px solid var(--gris-clair);color:var(--texte-med);white-space:nowrap}'
  +'.pcrb-tb tr:last-child td{border-bottom:none}'
  +'.pcrb-tb .n{text-align:right}'
  +'.pcrb-tb i{font-style:normal;color:var(--texte-doux);font-weight:500}'
  +'.pcrb-tb small{color:var(--texte-doux)}'
  +'.pcrb-nm{display:flex;align-items:center;gap:7px;font-weight:600;color:var(--texte)}'
  +'.pcrb-dot{width:9px;height:9px;border-radius:3px;flex:none}'
  +'.pcrb-sec{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:var(--pt-sm,17px);font-weight:600;color:var(--texte)}'
  +'.pcrb-nsec{font-style:italic;color:var(--texte-doux)}'
  /* ── CRB-2 : le selecteur de cuves et le slot sans debord ────────── */
  /* ⚠ `.pcrb-g` deborde volontairement de ses gouttieres (les trois autres
     graphes en ont besoin). Le couloir, lui, tient dans la carte : il ne doit
     PAS declencher un defilement horizontal de 34 px a chaque ouverture. */
  +'.pcrb-g.crb-g{overflow-x:visible;margin:0;padding:0}'
  +'.crb-chps{margin:0 -17px 2px;padding:0 17px}'
  +'.crb-sc{display:flex;gap:7px;overflow-x:auto;padding:2px 0 9px;-webkit-overflow-scrolling:touch}'
  +'.crb-sc::-webkit-scrollbar{height:4px}'
  +'.crb-sc::-webkit-scrollbar-thumb{background:var(--gris);border-radius:4px}'
  /* 36 px de haut, 44 de cible avec le padding vertical du conteneur : on les
     touche avec des gants, entre deux cuves. */
  +'.crb-chp{flex:none;font:inherit;font-size:var(--pt-micro,11px);font-weight:600;cursor:pointer;'
    /* \u26a0 `--gris-clair`, pas `--gris` : le filet du projet a ete arbitre, et
       `--gris` est le PERDANT (mv-harnais-jetons tient son compte a la baisse).
       Un lot qui lui rend du terrain fait rougir le cliquet \u2014 il a rougi. */
    +'white-space:nowrap;border:1px solid var(--gris-clair);background:var(--blanc);color:var(--texte-med);'
    +'border-radius:20px;padding:7px 12px;min-height:36px;display:flex;align-items:center;gap:6px}'
  +'.crb-chp i{width:8px;height:8px;border-radius:3px;background:var(--gris);flex:none}'
  +'.crb-chp[data-on=\'A\']{border-color:var(--terre);color:var(--terre);border-width:1.5px}'
  +'.crb-chp[data-on=\'A\'] i{background:var(--terre)}'
  +'.crb-chp[data-on=\'B\']{border-color:var(--bleu);color:var(--bleu);border-width:1.5px}'
  +'.crb-chp[data-on=\'B\'] i{background:var(--bleu)}'
  +'.crb-aide{font-size:var(--pt-micro,11px);color:var(--texte-doux);line-height:1.5;padding:0 0 10px}'
  /* La pastille du tableau suit LE ROLE, pas le rang. Grise par defaut : elle
     ne peut pas designer une courbe que le couloir ne trace plus. */
  +'.pcrb-tb tr[data-crbn]{cursor:pointer}'
  +'.pcrb-tb tr[data-on=\'A\']{background:var(--terre-pale)}'
  +'.pcrb-tb tr[data-on=\'B\']{background:var(--bleu-pale)}'
  +'.pcrb-tb tr[data-on=\'A\'] .pcrb-dot{background:var(--terre)}'
  +'.pcrb-tb tr[data-on=\'B\'] .pcrb-dot{background:var(--bleu)}'
  +'@media(max-width:600px){'
  /* Les trois colonnes de contexte se replient, elles ne disparaissent pas :
     le cahier de cuverie les porte toutes les neuf. */
  +'.pcrb-tb .o{display:none}'
  +'.pcrb-h{padding:12px 14px 10px}'
  +'.pcrb-b{padding:12px 14px 14px}'
  +'.pcrb-g{margin:0 -14px;padding:0 14px}'
  +'.pcrb-g.crb-g{margin:0;padding:0}'
  +'.crb-chps{margin:0 -14px 2px;padding:0 14px}'
  +'.pcav-vbig{font-size:var(--pt-xxl,31px)}'
  +'.pcav-fs,.pcav-fl{grid-template-columns:80px 1fr;gap:10px}'
  +'.pcav-pl{grid-template-columns:64px 1fr 86px;gap:8px}'
  +'.pcav-act{padding:7px 9px;font-size:var(--pt-micro,11px)}'
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

/* ══════════════════════════════════════════════════════════════════════════
   PILCRB-1 — PILOTAGE › CAVE › LES COURBES
   Le parcours d'un vin, en quatre temps. ★★★ IL N'Y A PAS UN J0 UNIQUE : la
   vigne compte a rebours de la recolte, la cuve compte depuis l'encuvage, le
   fut depuis l'entonnage. Empiler ces trois origines sur un seul axe donnerait
   une echelle qui RESSEMBLE a une mesure sans en etre une. Chaque bloc porte
   donc son propre zero, ecrit en toutes lettres a cote de son titre.
   ⚠️⚠️ CE QUE CET ECRAN NE FAIT PAS : il ne redessine rien. La maturite est
   `_cuvMatSvg`, celle de l'ecran des analyses. Le comparatif de densites est
   `_cmpSvg`, celui du cahier de cuverie — §88e le reservait explicitement pour
   ce jour-la. La chaine des volumes est `_caveBtlGraphSvg`, celle du Chai.
   SEUL le trace des temperatures est neuf, parce qu'il n'existait nulle part.
   ══════════════════════════════════════════════════════════════════════════ */
function _pcavHasW(f){ return typeof window[f]==='function'; }

/* L'en-tete d'un bloc : le titre, ce qu'on y lit, et LE ZERO. Le badge n'est
   pas decoratif — c'est lui qui empeche de lire deux graphes sur la meme
   echelle mentale. */
function _pcrbTete(ico,titre,sous,zero,infoCle){
  return '<div class="pcrb-h"><span class="pcrb-ico">'+(_pcavHasW('_mvIcon')?window._mvIcon(ico,18):'')+'</span>'
    +'<span class="pcrb-t"><b>'+_escHtml(titre)+'</b><span>'+sous+'</span></span>'
    +(infoCle&&typeof window._mvInfoBtn==='function'?window._mvInfoBtn(infoCle):'')
    +'<span class="pcrb-j0">'+_escHtml(zero)+'</span></div>';
}
function _pcrbCard(ico,titre,sous,zero,corps,pied,infoCle){
  return '<div class="pcav-card">'+_pcrbTete(ico,titre,sous,zero,infoCle)
    +'<div class="pcrb-b">'+corps+(pied?('<div class="pcrb-note">'+pied+'</div>'):'')+'</div></div>';
}
/* Le graphe est TOUJOURS pose par le registre : c'est lui qui mesure la vraie
   largeur du conteneur et qui repeint au redimensionnement. Un SVG a viewBox
   fixe pose en dur s'etire a x5 sur grand ecran — piege deja paye. */
function _pcrbSlot(id,cls){ return '<div class="pcrb-g'+(cls?(' '+cls):'')+'" id="'+id+'"></div>'; }

/* ── 2 · LE COMPARATIF DES DENSITES ─────────────────────────────────────── */
/* Les series sont construites UNE fois par rendu et relues par les deux
   graphes : meme ordre, donc meme couleur pour la meme cuve d'un trace a
   l'autre. Les recalculer separement, ce serait accepter qu'une cuve change
   de couleur entre la densite et la temperature. */
var _PCRB_S=null, _PCRB_HORS=0, _PCRB_ELEV=null, _PCRB_CH=null;
function _pcrbSeries(){
  _PCRB_S=null; _PCRB_HORS=0;
  if(!_pcavHasW('_cuvCmpSeries')) return null;
  var cv=(window.CAVE_VENDANGE&&window.CAVE_VENDANGE.cuves_vinif)||[];
  try{
    var r=window._cuvCmpSeries(cv);
    _PCRB_S=r.S||[]; _PCRB_HORS=r.hors||0;
  }catch(e){ _pcavLog('cmpSeries',e); _PCRB_S=null; }
  /* ⚠ CRB-2 — LA SELECTION SE NETTOIE ICI. Elle survit au rendu : apres un
     changement de millesime, elle designerait des cuves qui ne sont plus a
     l'ecran, et le couloir aurait l'air de ne pas suivre. Meme piege que la
     portee fantome du Pilotage. */
  var noms={}; (_PCRB_S||[]).forEach(function(s){ noms[s.nom]=1; });
  _CRB_SEL=_CRB_SEL.filter(function(n){ return noms[n]; });
  /* Le defaut ne s'applique QUE tant que l'utilisateur n'a rien touche : une
     selection vide qu'il a faite lui-meme se respecte. */
  if(!_CRB_SEL.length && !_CRB_TOUCHE && _PCRB_S && _PCRB_S.length) _CRB_SEL=[_PCRB_S[0].nom];
  return _PCRB_S;
}
/* ── CRB-2 : LE SELECTEUR ───────────────────────────────────────
   DEUX barres identiques, UN seul etat. La barre est repetee sur les deux
   cartes parce que le graphe des temperatures est plus bas que l'ecran : y
   renvoyer l'utilisateur vers une barre qu'il ne voit plus, ce serait ecrire un
   mode d'emploi au lieu de dessiner (§27a). Elles refletent `_CRB_SEL`, jamais
   un etat a elles. */
function _crbChipsBtns(){
  var h = '';
  (_PCRB_S||[]).forEach(function(s){
    var k = _CRB_SEL.indexOf(s.nom), on = (k === 0) ? 'A' : ((k === 1) ? 'B' : '');
    h += '<button type="button" class="crb-chp" data-crbn="' + _escHtml(s.nom) + '"'
      + (on ? (' data-on="' + on + '"') : '') + ' aria-pressed="' + (on ? 'true' : 'false') + '"'
      + ' onclick="_crbTap(\'' + _escAttr(s.nom) + '\')"><i></i>' + _escHtml(s.nom) + '</button>';
  });
  return h;
}
function _crbAideTxt(){
  var l = 2 - _CRB_SEL.length;
  if(l === 2) return 'Touchez une cuve pour la suivre par-dessus le couloir. Deux au maximum \u2014 '
    + 'au-del\u00e0, on retombe sur le graphe qu\u2019on vient de remplacer.';
  if(l === 1) return 'Une cuve suivie. Vous pouvez en ajouter une seconde pour comparer.';
  return 'Deux cuves suivies. En toucher une troisi\u00e8me rel\u00e2che la premi\u00e8re.';
}
function _crbChips(k){
  if(!_PCRB_S || _PCRB_S.length < 2) return '';
  return '<div class="crb-chps"><div class="crb-sc" id="crb-sc-' + k + '" role="group"'
    + ' aria-label="Les cuves \u00e0 suivre">' + _crbChipsBtns() + '</div></div>'
    + '<div class="crb-aide" id="crb-aide-' + k + '">' + _escHtml(_crbAideTxt()) + '</div>';
}
/* ⚠ On met a jour des ATTRIBUTS, jamais l'innerHTML de la barre : reconstruire
   la bande remettrait son defilement a zero, et toucher la cuve 12 ferait sauter
   l'ecran au debut de la liste. */
function _crbSync(){
  var maj = function(el){
    var n = el.getAttribute('data-crbn'), k = _CRB_SEL.indexOf(n), on = (k === 0) ? 'A' : ((k === 1) ? 'B' : '');
    if(on) el.setAttribute('data-on', on); else el.removeAttribute('data-on');
    if(el.tagName === 'BUTTON') el.setAttribute('aria-pressed', on ? 'true' : 'false');
  };
  var q = document.querySelectorAll('[data-crbn]'), i;
  for(i = 0; i < q.length; i++) maj(q[i]);
  ['dens','temp'].forEach(function(k){
    var a = document.getElementById('crb-aide-' + k);
    if(a) a.textContent = _crbAideTxt();
  });
}
window._crbTap = function(nom){
  _CRB_TOUCHE = true;
  var k = _CRB_SEL.indexOf(nom);
  if(k >= 0) _CRB_SEL.splice(k, 1);
  else { _CRB_SEL.push(nom); if(_CRB_SEL.length > 2) _CRB_SEL.shift(); }
  _crbSync();
  _crbRepeint();
};
/* Repeindre les DEUX graphes du couloir, et eux seuls. Le registre saute un
   dessin quand rien n'a bouge (meme largeur, meme element, contenu present) :
   on l'oublie d'abord, sinon le trace garderait l'ancienne selection. */
function _crbRepeint(){
  if(!_pcavHasW('_mvGraphSuivre')) return;
  [['dens','d'],['temp','t']].forEach(function(x){
    if(!document.getElementById('pcrb-g-' + x[0])) return;
    window._mvGraphOublier && window._mvGraphOublier('#pcrb-g-' + x[0]);
    window._mvGraphSuivre('#pcrb-g-' + x[0], function(w){ return _crbEnvSvg(_PCRB_S, w, x[1]); });
  });
}

function _pcrbEcarte(){
  if(!_PCRB_HORS) return '';
  return ' <b>'+_PCRB_HORS+'</b> cuve'+(_PCRB_HORS>1?'s ne figurent':' ne figure')+' pas ici\u00a0: '
    +'sans date d\u2019encuvage il n\u2019y a pas de J0, et sans deux relev\u00e9s de densit\u00e9 il n\u2019y a pas de '
    +'cin\u00e9tique. <b>Rien n\u2019est d\u00e9duit</b> \u2014 une date d\u2019encuvage devin\u00e9e se croirait.';
}
function _pcrbDens(){
  var min=(window._cuvCmpMin||2);
  if(!_PCRB_S||_PCRB_S.length<min)
    return _pcrbCard('graphique','Les densit\u00e9s, ramen\u00e9es \u00e0 J0',
      'Toutes les cuves superpos\u00e9es sur leur propre jour d\u2019encuvage.','J0 = encuvage',
      (_pcavHasW('_mvGraphVide')
        ? window._mvGraphVide('Pas encore de quoi comparer','Il faut deux cuves encuv\u00e9es et suivies pour superposer des cin\u00e9tiques.')
        : '<div class="pcav-vide">Pas encore de quoi comparer.</div>'),
      _pcrbEcarte(),'cave.courbes');
  return _pcrbCard('graphique','Les densit\u00e9s, ramen\u00e9es \u00e0 J0',
    'Le couloir de tout le cuvage, et la cuve que vous suivez par-dessus.',
    'J0 = encuvage', _crbChips('dens')+_pcrbSlot('pcrb-g-dens','crb-g')+_crbLeg(true)+_pcrbTable(),
    '<b>La zone dor\u00e9e va de la cuve la plus lente \u00e0 la plus rapide</b>, jour par jour, et le '
    +'trait pointill\u00e9 est la m\u00e9diane du cuvage. Quinze traits nomm\u00e9s tenaient sur le papier, '
    +'pas sur un t\u00e9l\u00e9phone. <b>Appuyez sur le graphe</b> pour lire un jour : votre cuve, la '
    +'m\u00e9diane, et l\u2019\u00e9cart entre les deux.'+_crbNoteInterp()
    +' <b>Le classement du tableau ne se fait pas sur la vitesse.</b> Une pente moyenne sur trois '
    +'jours n\u2019est pas comparable \u00e0 une pente sur dix \u2014 le d\u00e9but d\u2019une fermentation en est la '
    +'phase la plus rapide. Le tri porte sur le <b>jour o\u00f9 la cuve a \u00e9t\u00e9 relev\u00e9e sous SON '
    +'seuil de vin sec</b>, jamais interpol\u00e9. <b>Ce seuil n\u2019est pas le m\u00eame pour toutes</b>\u00a0: '
    +'il suit le degr\u00e9 potentiel du mo\u00fbt \u2014 un mo\u00fbt \u00e0 12\u00b0 est sec vers 994, un mo\u00fbt \u00e0 14\u00b0 '
    +'vers 992.'+_pcrbEcarte(),'cave.courbes');
}
/* La legende du couloir, et la note qui dit ce qu'on a le droit de lire.
   ★ Ecrite une fois, lue par les deux cartes : deux legendes redigees separement
   divergent au premier changement, et l'ecran dirait deux choses du meme dessin. */
function _crbLeg(dens){
  return '<div class="crb-aide" style="padding-top:8px">'
    + '<b style="color:var(--texte-med)">La zone dor\u00e9e</b>\u00a0: du minimum au maximum du cuvage. '
    + '<b style="color:var(--texte-med)">Le pointill\u00e9</b>\u00a0: la m\u00e9diane. '
    + '<b style="color:var(--terre)">Trait plein</b> et <b style="color:var(--bleu)">trait tiret\u00e9</b>\u00a0: '
    + 'les cuves que vous suivez.' + (dens ? '' : ' La bande verte est la fen\u00eatre de travail.')
    + '</div>';
}
/* ⚠ CE QU'ON DIT DE L'INTERPOLATION, ET POURQUOI ON LE DIT. La mediane d'un
   jour ou personne n'a releve est une mediane d'estimations. Le taire, ce serait
   donner a un chiffre calcule l'aplomb d'un chiffre mesure. */
function _crbNoteInterp(){
  return ' Un jour o\u00f9 une cuve n\u2019a pas \u00e9t\u00e9 relev\u00e9e, sa valeur est <b>estim\u00e9e entre ses '
    + 'deux relev\u00e9s voisins</b> \u2014 jamais avant le premier ni apr\u00e8s le dernier. L\u2019\u00e9tiquette '
    + 'donne les deux comptes\u00a0: cuves dans le couloir, et cuves r\u00e9ellement relev\u00e9es ce jour-l\u00e0.';
}

/* Le tableau qui repond au « pourquoi ». Il ne recopie PAS celui du cahier :
   le papier a la place de neuf colonnes, un telephone n'en tient que trois.
   Les trois autres se replient sous 600 px, elles ne disparaissent pas. */
function _pcrbTable(){
  var h='<table class="pcrb-tb"><thead><tr><th>Cuve</th><th class="n">Fin de FA</th><th class="n">Pts/j</th>'
    +'<th class="n o">D\u00e9part</th><th class="n o">T\u00b0 moy \u00b7 max</th><th class="n o">Vigne</th></tr></thead><tbody>';
  _PCRB_S.forEach(function(s,i){
    var vg=null;
    if(_pcavHasW('_cuvCmpVigne')){ try{ vg=window._cuvCmpVigne(s.cuve); }catch(e){ _pcavLog('vigne',e); } }
    var vgTxt='\u2014';
    if(vg&&vg.suc!=null){
      vgTxt=Math.round(vg.suc)+' <small>g/L</small>';
      /* ⚠️ Une moyenne sur 2 parcelles de 3 n'est pas une moyenne de la cuve :
         on ecrit la fraction plutot que de laisser croire au compte plein. */
      if(vg.n<vg.nTot) vgTxt+=' <i>('+vg.n+'/'+vg.nTot+')</i>';
    }
    /* La ligne est une SECONDE PORTE vers le meme geste : le tableau classe les
       quinze cuves, la bande de chips les fait defiler. Toucher la ligne qu'on
       vient de lire vaut mieux que retrouver sa chip. */
    var kSel=_CRB_SEL.indexOf(s.nom), onSel=(kSel===0)?'A':((kSel===1)?'B':'');
    h+='<tr data-crb="'+i+'" data-crbn="'+_escHtml(s.nom)+'"'+(onSel?(' data-on="'+onSel+'"'):'')
      +' onclick="_crbTap(\''+_escAttr(s.nom)+'\')"><td><span class="pcrb-nm">'
      +'<i class="pcrb-dot" style="background:'+_PCRB_COL[0]+'"></i>'+_escHtml(s.nom)+'</span></td>'
      +'<td class="n">'+_pcrbFin(s)+'</td>'
      +'<td class="n">'+(s.vit!=null?(_pcavF1(s.vit)+' <i>J'+s.jDeb+'\u2013J'+s.jFin+'</i>'):'\u2014')+'</td>'
      +'<td class="n o">'+Math.round(s.dDeb)+'</td>'
      +'<td class="n o">'+(s.tMoy!=null?(_pcavF1(s.tMoy)+' \u00b7 '+_pcavF1(s.tMax)):'\u2014')+'</td>'
      +'<td class="n o">'+vgTxt+'</td></tr>';
  });
  return h+'</tbody></table>';
}
/* ★★★ CUV-10 — « PAS ENCORE » MENTAIT SUR LES CUVES DECUVEES.
   La colonne comparait une densite a un repere. Une cuve DECUVEE affichait donc
   « pas encore · J14 a 997 » alors qu'elle avait fini en cuve et que le marc
   etait sorti. Vu sur une capture du 12/09 : quatre cuves finies sur douze,
   toutes annoncees inachevees.
   ⚠ L'ordre de lecture est celui des FAITS, puis des reperes :
     1. decuvee                -> la date du decuvage, c'est un fait ;
     2. passee sous le repere  -> le jour, marque comme un repere ;
     3. ni l'un ni l'autre     -> « en cours », avec ou elle en est.
   ⚠ « en cours » remplace « pas encore » : une cuve qui fermente n'est pas en
     retard sur quelque chose. */
function _pcrbFin(s){
  var c=s&&s.cuve;
  if(c&&c.decuvage&&c.decuvage.date){
    var t='<b class="pcrb-sec">d\u00e9cuv\u00e9e '+_vendFrDate(c.decuvage.date)+'</b>';
    if(c.decuvage.fa_finie===false) t+=' <i class="pcrb-nsec">\u00b7 FA au chai</i>';
    return t;
  }
  if(s.jSec!=null) return '<b class="pcrb-sec">J'+s.jSec+'</b> <i class="pcrb-nsec">rep\u00e8re</i>';
  return '<i class="pcrb-nsec">en cours \u00b7 J'+s.jFin+' \u00e0 '+Math.round(s.dFin)+'</i>';
}

/* ⚠⚠ CE COMMENTAIRE DISAIT L'INVERSE, ET IL AVAIT RAISON — AVANT CRB-2.
   Il exigeait que la pastille reprenne la palette de `_cmpSvg`, « sinon elle ne
   designe pas la courbe qu'elle pretend designer ». Depuis le couloir, l'ecran
   ne trace plus quinze courbes de couleurs : une pastille coloree designerait
   une courbe qui n'existe plus. Elle est donc GRISE par defaut, et ne prend une
   couleur que pour les une ou deux cuves reellement tracees — par le CSS, sur
   `tr[data-on]`. ★ Le cahier de cuverie, lui, garde ses quinze couleurs :
   `_cmpSvg` n'a pas bouge. */
var _PCRB_COL=['var(--gris)'];

/* ── 3 · LES TEMPERATURES ────────────────────────────────────────────────── */
function _pcrbTemp(){
  var min=(window._cuvCmpMin||2), n=0;
  if(_PCRB_S) _PCRB_S.forEach(function(s){
    if(s.pts.filter(function(p){ return p.t!=null; }).length>=2) n++; });
  var corps = (n>=min) ? (_crbChips('temp')+_pcrbSlot('pcrb-g-temp','crb-g')+_crbLeg(false))
    : (_pcavHasW('_mvGraphVide')
        ? window._mvGraphVide('Pas assez de temp\u00e9ratures relev\u00e9es',
            'Deux relev\u00e9s portant une temp\u00e9rature, sur deux cuves, suffisent \u00e0 comparer.')
        : '<div class="pcav-vide">Pas assez de temp\u00e9ratures relev\u00e9es.</div>');
  var manque=(_PCRB_S?_PCRB_S.length:0)-n;
  return _pcrbCard('thermometre','Les temp\u00e9ratures, m\u00eame J0',
    'Un palier de densit\u00e9 s\u2019explique souvent ici\u00a0: douze degr\u00e9s cinq jours durant, '
    +'c\u2019est une mac\u00e9ration, pas une fermentation qui tra\u00eene.','J0 = encuvage',
    corps,
    'La bande verte est la <b>fen\u00eatre de travail</b>, de 18 \u00e0 30\u00a0\u00b0C \u2014 30\u00a0\u00b0C est le seuil '
    +'qui d\u00e9clenche d\u00e9j\u00e0 l\u2019alerte \u00ab\u00a0temp\u00e9rature haute\u00a0\u00bb dans <b>Ce qui presse</b>. '
    +'<b>La m\u00eame cuve reste s\u00e9lectionn\u00e9e</b> qu\u2019au-dessus\u00a0: le palier de densit\u00e9 et la '
    +'temp\u00e9rature qui l\u2019explique se lisent sur la m\u00eame cuve, sans rien retoucher. '
    +'Un relev\u00e9 sans temp\u00e9rature n\u2019est pas une temp\u00e9rature de z\u00e9ro\u00a0: '
    +'il est simplement absent du trac\u00e9.'+_crbNoteInterp()
    +(manque>0?(' <b>'+manque+'</b> cuve'+(manque>1?'s n\u2019ont':' n\u2019a')+' pas assez de relev\u00e9s '
      +'portant une temp\u00e9rature.'):''),'cave.courbes');
}

/* ── 1 · LA MATURITE, ET LE J0 QU'ON N'A PAS ─────────────────────────────── */
/* ★★★ CE BLOC RESTE SUR UN AXE DE DATES, ET C'EST UN CHOIX, PAS UN OUBLI.
   La maquette validee proposait un axe « jours AVANT recolte ». En l'ecrivant,
   deux obstacles : la date de recolte d'une parcelle n'est pas un champ, elle
   se deduit des apports ; et une parcelle NON ENCORE VENDANGEE n'a donc aucun
   J0. Le bloc serait vide pendant tout le mois d'aout et la premiere quinzaine
   de septembre — exactement la periode ou la question « laquelle vendanger
   d'abord » se pose. Un graphe qui se vide au moment ou il sert ne sert pas.
   ⚠️ Et le trace existe deja : `_cuvMatSvg` est celui de l'ecran des analyses.
   §86 interdit d'en ecrire un second pour la meme donnee. */
function _pcrbMat(){
  var n=((window.CAVE_VENDANGE&&window.CAVE_VENDANGE.analyses)||[]).length;
  var corps = n ? _pcrbSlot('pcrb-g-mat')
    : (_pcavHasW('_mvGraphVide')
        ? window._mvGraphVide('Aucune analyse de maturit\u00e9 enregistr\u00e9e',
            'Chaque mesure au r\u00e9fractom\u00e8tre, saisie au Cuvier, alimente cette courbe.')
        : '<div class="pcav-vide">Aucune analyse de maturit\u00e9.</div>');
  return _pcrbCard('raisin','Les maturit\u00e9s, avant r\u00e9colte',
    'Le sucre relev\u00e9 au r\u00e9fractom\u00e8tre, une courbe par parcelle.','calendrier',
    corps,
    'Ce bloc reste sur un <b>axe de dates</b>, et non en jours avant r\u00e9colte\u00a0: une parcelle pas '
    +'encore vendang\u00e9e n\u2019a pas de date de r\u00e9colte, donc pas de J0 \u2014 le graphe serait vide '
    +'pendant toute la p\u00e9riode o\u00f9 il sert. Ces courbes sont <b>par parcelle</b>, pas par cuve\u00a0: '
    +'la part r\u00e9elle de chaque parcelle entr\u00e9e dans une cuve n\u2019est pas enregistr\u00e9e, et le '
    +'rapprochement vigne\u00a0\u2192\u00a0cuve de la colonne \u00ab\u00a0Vigne\u00a0\u00bb reste un <b>ordre de grandeur</b>, '
    +'pond\u00e9r\u00e9 par la surface.','cave.courbes');
}

/* ── 4 · L'ELEVAGE : LA MALO, SUR UN VRAI AXE DE TEMPS ───────────────────── */
/* ⚠️⚠️ AUCUNE TEMPERATURE N'EST ENREGISTREE EN ELEVAGE. `temp_c` n'existe que
   sur les releves de fermentation, sur la cible de maceration et sur la
   temperature des raisins au quai. Un ouillage, un soutirage, un sulfitage,
   une analyse : aucun ne porte de temperature. La courbe de temperature
   S'ARRETE DONC AU DECUVAGE, et cet ecran le DIT plutot que de laisser
   chercher un graphe qui n'existe pas.
   ★★ Ce trace apporte ce que `_pcavMaloCourbe` (Ce qui presse) ne peut pas
   donner : un AXE DE TEMPS. Les barres de l'autre ecran sont espacees a
   intervalle egal, par rang — deux analyses a six semaines d'ecart et deux a
   trois jours d'ecart y dessinent la meme pente. Ici l'abscisse est le mois
   reel depuis l'entonnage. Ce n'est pas le meme graphe redessine, c'est
   l'information que l'autre ne porte pas. */
var MV_CRB_ELEV_MAX=6;
function _pcrbElevSeries(c){
  if(!_pcavHasW('_mlMesMalo')) return [];
  var out=[];
  (c.enElevage||[]).forEach(function(x){
    if(!x||!x.id) return;
    var m=[];
    try{ m=window._mlMesMalo(x.id)||[]; }catch(e){ _pcavLog('mesMalo',e); return; }
    if(m.length<2) return;
    /* ⚠️ J0 = la date d'ENTONNAGE. Sans elle, on ne cale rien sur le premier
       releve en repli : ce serait une seconde origine deguisee en premiere.
       La cuvee est ecartee, et le compte remonte. */
    var t0=Date.parse(x.date_entonnage||x.date_debut||'');
    if(isNaN(t0)) return;
    var pts=m.map(function(v){
      var t=Date.parse(v.date); if(isNaN(t)) return null;
      var mo=(t-t0)/86400000/30.44;
      return (mo<0)?null:{m:mo, v:v.val};
    }).filter(Boolean);
    if(pts.length<2) return;
    out.push({nom:((x.nom||'Cuv\u00e9e')+' '+(x.millesime||'')).trim(), pts:pts});
  });
  /* La plus avancee d'abord : c'est celle dont on parle en premier. */
  out.sort(function(a,b){ return a.pts[a.pts.length-1].v-b.pts[b.pts.length-1].v; });
  return out;
}
function _pcrbElevSvg(D,w){
  var c=window._mvGraphCadre(w,236,{padL:52,padR:96,padT:26,padB:34});
  var pL=c.padL,pT=c.padT,iw=c.iw,ih=c.ih;
  var fin=(window._ML_MAL_FIN||0.1);
  var mMax=1, hi=fin, lo=fin;
  D.forEach(function(s){ s.pts.forEach(function(p){
    if(p.m>mMax) mMax=p.m; if(p.v>hi) hi=p.v; if(p.v<lo) lo=p.v; }); });
  mMax=Math.max(1,Math.ceil(mMax));
  var vMin=Math.max(0,lo-0.2), vMax=hi+0.2, vSp=Math.max(0.1,vMax-vMin);
  var X=function(m){ return pL+(m/mMax)*iw; };
  var Y=function(v){ return pT+ih-((v-vMin)/vSp)*ih; };
  var g='';
  for(var i=0;i<=c.grad;i++){
    var v=vMin+(vSp*i/c.grad), y=Y(v);
    g+='<line x1="'+pL+'" y1="'+y.toFixed(1)+'" x2="'+(pL+iw)+'" y2="'+y.toFixed(1)
      +'" stroke="'+c.col.grille+'" stroke-width="1"/>'
      +'<text x="'+(pL-8)+'" y="'+(y+4).toFixed(1)+'" text-anchor="end" font-size="'+c.txt.axe
      +'" fill="'+c.col.texte+'">'+(Math.round(v*100)/100).toFixed(2).replace('.',',')+'</text>';
  }
  g+='<text x="'+(pL-8)+'" y="'+(pT-10)+'" text-anchor="end" font-size="'+c.txt.unite
    +'" fill="'+c.col.texte+'">g/L</text>';
  var pas=Math.max(1,Math.ceil(mMax/c.grad));
  for(var m=0;m<=mMax;m+=pas){
    g+='<text x="'+X(m).toFixed(1)+'" y="'+(c.h-11)+'" text-anchor="middle" font-size="'+c.txt.axe
      +'" fill="'+c.col.texte+'">M'+m+'</text>';
  }
  g+='<text x="'+(pL+iw)+'" y="'+(c.h-11)+'" text-anchor="end" font-size="'+c.txt.unite
    +'" fill="'+c.col.texte+'">mois depuis l\u2019entonnage</text>';
  var ys=Y(fin);
  g+='<line x1="'+pL+'" y1="'+ys.toFixed(1)+'" x2="'+(pL+iw)+'" y2="'+ys.toFixed(1)
    +'" stroke="'+c.col.fait+'" stroke-width="1.2" stroke-dasharray="5 4"/>'
    +'<text x="'+(pL+6)+'" y="'+(ys-6).toFixed(1)+'" font-size="'+c.txt.mini
    +'" font-weight="700" fill="'+c.col.fait+'">malo achev\u00e9e \u00b7 '+String(fin).replace('.',',')+'</text>';
  var lbl=[];
  D.slice(0,MV_CRB_ELEV_MAX).forEach(function(s,k){
    var col=_PCRB_COL[k%_PCRB_COL.length];
    var pol=s.pts.map(function(p){ return X(p.m).toFixed(1)+','+Y(p.v).toFixed(1); }).join(' ');
    /* ★ Le trait est TIRETE : entre deux analyses, personne n'a mesure. Une
       ligne pleine laisserait croire a un suivi continu. */
    g+='<polyline points="'+pol+'" fill="none" stroke="'+col+'" stroke-width="1.5"'
      +' stroke-dasharray="5 3" stroke-linejoin="round" opacity="0.75"/>';
    s.pts.forEach(function(p){
      g+='<circle cx="'+X(p.m).toFixed(1)+'" cy="'+Y(p.v).toFixed(1)+'" r="3.4" fill="'+col+'"/>'; });
    var der=s.pts[s.pts.length-1];
    lbl.push({y:Y(der.v),x:X(der.m),nom:s.nom,col:col});
  });
  /* Meme regle d'ecartement que les deux autres traces — celle de cave.js,
     pas une troisieme copie. Trois cuvees finissent toutes a 0,04 g/L en fin
     de malo : c'est le meme « cas banal » qu'en §88d, avec la meme cause. */
  if(typeof window._cuvCmpEcarte==='function') window._cuvCmpEcarte(lbl,11,pT+4,pT+ih+8);
  else { lbl.sort(function(a,b){ return a.y-b.y; });
         var prec=-1e9;
         lbl.forEach(function(L){ var y=Math.max(L.y,prec+11); L.yl=y; prec=y; }); }
  lbl.forEach(function(L){
    g+='<line x1="'+(L.x+2).toFixed(1)+'" y1="'+L.y.toFixed(1)+'" x2="'+(pL+iw+5)
      +'" y2="'+L.yl.toFixed(1)+'" stroke="'+L.col+'" stroke-width="0.8" opacity="0.55"/>'
      +'<text x="'+(pL+iw+8)+'" y="'+(L.yl+3.5).toFixed(1)+'" font-size="'+c.txt.mini
      +'" font-weight="600" fill="'+L.col+'">'+_escHtml(L.nom)+'</text>';
  });
  return window._mvGraphSvg(c,'Acide malique de '+lbl.length+' cuv\u00e9es en \u00e9levage, '
    +'par mois depuis l\u2019entonnage, sur '+mMax+' mois.',g);
}

function _pcrbElev(c){
  var D=_pcrbElevSeries(c), n=(c.enElevage||[]).length;
  _PCRB_ELEV=D;   /* la pose relit ce tableau : le calculer sans le garder
                     laisserait le graphe vide sans rien signaler */
  var corps = D.length ? _pcrbSlot('pcrb-g-elev')
    : (_pcavHasW('_mvGraphVide')
        ? window._mvGraphVide('Pas encore de suivi de malo \u00e0 comparer',
            'Deux analyses portant l\u2019acide malique, sur une cuv\u00e9e entonn\u00e9e \u00e0 date connue.')
        : '<div class="pcav-vide">Pas encore de suivi de malo.</div>');
  var caches=Math.max(0,D.length-MV_CRB_ELEV_MAX);
  var hors=n-D.length;
  return _pcrbCard('barrique','L\u2019\u00e9levage\u00a0: la malo, mois par mois',
    'Chaque point est une analyse de laboratoire.','J0 = entonnage',
    corps,
    '<b>Aucune temp\u00e9rature n\u2019est enregistr\u00e9e en \u00e9levage.</b> Un ouillage, un soutirage, un '
    +'sulfitage, une analyse\u00a0: aucun ne porte de temp\u00e9rature. La courbe de temp\u00e9rature '
    +'s\u2019arr\u00eate donc au d\u00e9cuvage, et rien ne la prolongera tant qu\u2019un champ n\u2019aura pas \u00e9t\u00e9 '
    +'ajout\u00e9 \u00e0 la saisie du Chai.<br>Le trait est <b>tiret\u00e9</b>\u00a0: entre deux analyses, personne '
    +'n\u2019a mesur\u00e9.'
    +(hors>0?(' <b>'+hors+'</b> cuv\u00e9e'+(hors>1?'s n\u2019apparaissent':' n\u2019appara\u00eet')+' pas\u00a0: '
      +'moins de deux analyses de malique, ou pas de date d\u2019entonnage \u2014 sans elle il n\u2019y a pas de '
      +'M0, et le premier relev\u00e9 n\u2019en tient pas lieu.'):'')
    +(caches>0?(' Les '+MV_CRB_ELEV_MAX+' plus avanc\u00e9es sont trac\u00e9es\u00a0; '+caches+' autre'
      +(caches>1?'s':'')+' plus bas dans le Chai.'):''),'cave.courbes');
}

/* ── 5 · LA CHAINE DES VOLUMES ───────────────────────────────────────────── */
/* Aucun trace neuf : `_caveBtlGraphSvg` est celui du Chai. On choisit la
   cuvee qui a la chaine la PLUS COMPLETE — celle qui a le plus d'etapes
   renseignees. Prendre la premiere de la liste montrerait souvent deux barres
   sur quatre, et l'ecran aurait l'air casse alors qu'il manque une saisie. */
function _pcrbChaine(c){
  if(!_pcavHasW('_caveBilanChaine')||!_pcavHasW('_caveBtlGraphSvg'))
    return '';
  var best=null, bestN=0;
  ((window.CAVE_ELEVAGE&&window.CAVE_ELEVAGE.cuvees)||[]).forEach(function(x){
    var ch=null;
    try{ ch=window._caveBilanChaine(x); }catch(e){ _pcavLog('bilanChaine',e); return; }
    if(!ch) return;
    /* ★ VOL-1 — les barres qui se dessinent ; plus d'« Apres elevage » (§152c). */
    var n=(ch.recolteKg!=null?2:0)+((ch.entonneHl!=null&&ch.entonneSrc==='mesure')?1:0)+(ch.nbBtl!=null?1:0);
    if(n>bestN){ bestN=n; best={cuv:x,ch:ch}; }
  });
  if(!best||bestN<2) return '';
  _PCRB_CH=best;
  var ch0=best.ch, ent=(ch0.entonneHl!=null&&ch0.entonneSrc==='mesure');
  // Le volume entonne se saisit la ou il vit — sur la cuve decuvee — mais d'ici.
  var act=(!ent&&ch0.cuveId&&typeof canWrite==='function'&&canWrite()&&_pcavHasW('_vendDvolCorriger'))
    ? ('<div class="pcrb-act"><button type="button" class="pcav-act" onclick="_vendDvolCorriger(\''
      +_escAttr(ch0.cuveId)+'\')">Saisir le volume entonn\u00e9</button></div>') : '';
  return _pcrbCard('bouteille','De la r\u00e9colte \u00e0 la bouteille',
    _escHtml(best.cuv.nom||'Cuv\u00e9e')+'\u00a0\u00b7 ce que chaque \u00e9tape a laiss\u00e9 passer.','cha\u00eene',
    _pcrbSlot('pcrb-g-chain')+act,
    '<b>R\u00e9colte</b>\u00a0: les kilos d\u2019apr\u00e8s les caisses. <b>En cuve</b>\u00a0: ces kilos \u00e0 la r\u00e8gle du '
    +'Cuvier ('+_mvF1(_mlKgHl())+'\u00a0kg/hL), saign\u00e9es d\u00e9duites \u2014 jamais la contenance de la cuve. '
    +'<b>Entonn\u00e9</b>\u00a0: le volume d\u00e9cuv\u00e9 <b>mesur\u00e9</b> \u2014 jamais la taille des f\u00fbts'
    +(ent?'.':'\u00a0; tant qu\u2019il n\u2019est pas saisi, l\u2019\u00e9tape reste en pointill\u00e9.')
    // ★ VOL-2 — le kg/hL, et a quoi il sert ; ★ ASM-1 — l'apport, s'il y en a un.
    +' <b>kg/hL</b>, sous chaque \u00e9tape\u00a0: les kilos r\u00e9colt\u00e9s divis\u00e9s par ses hectolitres \u2014 l\u2019\u00e9cart entre '
    +'la r\u00e8gle et l\u2019entonn\u00e9 dit s\u2019il faut revoir la r\u00e8gle.'
    +(ch0.apportHl>0?' L\u2019apport d\u2019une autre cuve s\u2019empile en pointill\u00e9\u00a0: il n\u2019entre ni dans le kg/hL, ni dans l\u2019\u00e9cart.':'')
    +'<br>La cuv\u00e9e montr\u00e9e est celle dont la cha\u00eene est la <b>plus compl\u00e8te</b>. Une \u00e9tape absente '
    +'n\u2019est pas un z\u00e9ro\u00a0: elle n\u2019est simplement pas dessin\u00e9e. Le d\u00e9tail de chaque cuv\u00e9e vit '
    +'dans <b>Le Chai\u00a0\u203a Bouteilles</b>.','cave.courbes');
}

/* ── LA VUE ──────────────────────────────────────────────────────────────── */
function _pcavVueCourbes(c){
  /* ⚠️ Remise a zero AVANT de reconstruire : ces trois variables survivent au
     rendu. Sans cela, un ecran qui n'a plus de chaine a montrer garderait
     celle du rendu precedent, et le graphe pretendrait parler d'une cuvee
     qui n'est plus a l'ecran. */
  _PCRB_ELEV=null; _PCRB_CH=null;
  _pcrbSeries();
  var h='<div class="pcrb-intro">Le parcours d\u2019un vin, <b>en quatre temps</b>. Chaque temps a son '
    +'propre jour z\u00e9ro\u00a0: la vigne compte sur le calendrier, la cuve compte depuis l\u2019encuvage, '
    +'le f\u00fbt depuis l\u2019entonnage. <b>Il n\u2019y a pas de J0 unique</b> \u2014 les superposer sur un seul '
    +'axe donnerait une \u00e9chelle qui ressemble \u00e0 une mesure sans en \u00eatre une.</div>';
  h+=_pcrbMat();
  h+=_pcrbDens();
  h+=_pcrbTemp();
  h+=_pcrbElev(c);
  h+=_pcrbChaine(c);
  return h;
}

/* ── LA POSE DES GRAPHES ─────────────────────────────────────────────────────
   ⚠️⚠️ Le registre `_mvGraphSuivre` mesure la VRAIE largeur du conteneur et
   repeint au redimensionnement. On OUBLIE la famille avant de la reposer :
   sans cela le registre grossit a chaque passage sur l'onglet, et chaque
   entree morte se redessine dans le vide a chaque resize.
   ⚠️ Cette fonction est appelee APRES l'insertion du HTML, jamais pendant :
   `_mvGraphSuivre` cherche son conteneur par selecteur. */
function _pcrbPose(){
  if(!_pcavHasW('_mvGraphSuivre')) return;
  window._mvGraphOublier&&window._mvGraphOublier('#pcrb-g-');
  if(document.getElementById('pcrb-g-mat')&&_pcavHasW('_cuvMatSvg'))
    window._mvGraphSuivre('#pcrb-g-mat',function(w){ return window._cuvMatSvg(w); });
  /* ★ CRB-2 : l'ecran passe par le COULOIR, plus par la superposition. Le
     cahier de cuverie, lui, continue d'appeler `_cmpSvg` / `_cmpTempSvg`
     directement — sur A4 les quinze noms tiennent. */
  if(_PCRB_S) _crbRepeint();
  var el=document.getElementById('pcrb-g-elev');
  if(el&&_PCRB_ELEV&&_PCRB_ELEV.length)
    window._mvGraphSuivre('#pcrb-g-elev',function(w){ return _pcrbElevSvg(_PCRB_ELEV,w); });
  if(document.getElementById('pcrb-g-chain')&&_PCRB_CH)
    window._mvGraphSuivre('#pcrb-g-chain',function(w){
      return window._caveBtlGraphSvg(_PCRB_CH.ch,_PCRB_CH.ch.nbBtl,w); });
}

// ── L'onglet ─────────────────────────────────────────────────────────
// Millesime ouvert dans l'onglet. null = celui que le contexte a retenu.
// ════════════════════════════════════
// Économie (coût/ha par parcelle) + Conformité (cuivre · passages/IFT · DRE)
// Lecture seule. Aucune écriture en base. Taux/prix/référence saisis dans
// Réglages › Domaine (CONFIG.eco / CONFIG.conformite).
// ════════════════════════════════════

// ── Économie : config (lecture) ──
function renderCaveMillesime(){
  _mlInjectCss(); _pcavInjectCss();
  // ★ L'en-tete et la bande #cave-kpis sont ecrits par renderCave (lot CAVE-1).
  var mvcHost=document.getElementById('mvc-elevage'); if(mvcHost) mvcHost.style.display='none';
  ['vend','auj','reg'].forEach(function(t){
    var v=document.getElementById('cave-view-'+t); if(v) v.style.display='none';
  });
  var host=document.getElementById('cave-view-mil'); if(!host) return;
  host.style.display='block';

  var body=document.getElementById('ml-body'); if(!body) return;
  if(!window._dataReady){
    body.innerHTML=window._mvSk?window._mvSk('chai'):'';
    return;
  }
  // Deux onglets depuis le lot CAVE-3 : La ligne de vie (la Cave) et Les courbes
  // (ex-Pilotage › Cave › Les courbes, ramenees ici).
  var tv=document.getElementById('ml-tab-vie'); if(tv) tv.classList.toggle('active',_mlTab!=='crb');
  var tc=document.getElementById('ml-tab-crb'); if(tc) tc.classList.toggle('active',_mlTab==='crb');
  if(_mlTab==='crb'){
    var c=null; try{ c=_pcavCtx(); }catch(e){ _pcavLog('ctx',e); }
    body.innerHTML=_caveSaisBanner()+(c?_pcavVueCourbes(c)
      :'<div class="pcav-vide">Cet \u00e9cran n\u2019a pas pu se construire.<br>L\u2019incident a \u00e9t\u00e9 enregistr\u00e9.</div>');
    try{ _pcrbPose(); }catch(e){ _pcavLog('poseCourbes',e); }
    return;
  }
  body.innerHTML=_caveSaisBanner()+_mlRenderVie();
  _mlFluxPaint();   // la largeur reelle n'est connue qu'une fois le HTML pose
  _mlFluxHook();
}
function _mlSetTab(t){
  // « Ce qui vient » vit dans Aujourd'hui depuis le lot CAVE-1.
  if(t==='venir'){ caveSection='aujourdhui'; renderCave(); return; }
  _mlTab=(t==='crb')?'crb':'vie';
  renderCaveMillesime();
}
// Le parc a futs, rendu par La Reserve › Futs (lot CAVE-3/4) : une seule
// definition, ici, sur le contexte de la cave.
function _caveParcHtml(){
  _pcavInjectCss();
  var c=null; try{ c=_pcavCtx(); }catch(e){ _pcavLog('ctx',e); return ''; }
  try{ return _pcavVueParc(c)||''; }catch(e){ _pcavLog('parc',e); return ''; }
}

window.renderCaveMillesime = renderCaveMillesime;
window._mlSetTab           = _mlSetTab;
window._caveParcHtml       = _caveParcHtml;
window.renderCaveAujourdhui= renderCaveAujourdhui;
window.renderCaveReglagesCave = renderCaveReglagesCave;
window._caveOpenReglages   = _caveOpenReglages;
window._caveGoAoc          = _caveGoAoc;
// ★ Lus par le Pilotage (carte Cave, lot ③) : le verdict et l'agenda complet
//   n'ont qu'UNE definition, et elle est ici.
window._mlAgendaComplet    = _mlAgendaComplet;
window._mlVerdict          = _mlVerdict;
window._mlMalo             = _mlMalo;
window._mlSo2Doses         = _mlSo2Doses;
window._caveKpisRender     = _caveKpisRender;
window._mlSetMil           = _mlSetMil;
window._mlSetRdtMax        = _mlSetRdtMax;
window._mlRdtSansMax       = _mlRdtSansMax;
window._mlRdtMoyen         = _mlRdtMoyen;
window._mlGo               = _mlGo;
window._mlAgenda           = _mlAgenda;
window._mlProjFA           = _mlProjFA;
window._mlChaine           = _mlChaine;
window._mlRendements       = _mlRendements;
window._mlOrigine          = _mlOrigine;
window._mlOuillages        = _mlOuillages;
window._mlResumeSem        = _mlResumeSem;
window._mlMillesimes       = _mlMillesimes;
window._mlResteARentrer    = _mlResteARentrer;

// ── Sort du contenant apres retrait ────────────────────────────────────────
// Le bloc est injecte au-dessus des notes de l'overlay existant : aucun id neuf
// dans index.html, meme patron que _caveEnsureBtlTab.
function _rfutRenderGarder(){
  var host=document.getElementById('rfut-garder');
  if(!host){
    var anc=document.getElementById('rfut-notes');
    if(!anc||!anc.parentNode) return;
    host=document.createElement('div');
    host.id='rfut-garder';
    host.style.margin='4px 0 12px';
    anc.parentNode.insertBefore(host, anc);
  }
  host.innerHTML='<div style="font-size:var(--pt-lbl,10.5px);letter-spacing:.06em;text-transform:uppercase;'
    +'color:var(--texte-doux);margin-bottom:6px">Et le f\u00fbt ?</div>'
    +'<div style="display:flex;gap:7px">'
    +'<button type="button" class="rfut-reason-btn'+(_retraitFutGarder?' sel':'')+'" style="flex:1"'
    +' onclick="window._rfutSetGarder(true)">'+_mvIcon('cadenas',16)+' Revient au parc</button>'
    +'<button type="button" class="rfut-reason-btn'+(!_retraitFutGarder?' sel':'')+'" style="flex:1"'
    +' onclick="window._rfutSetGarder(false)">'+_mvIcon('corbeille',16)+' Je le jette</button>'
    +'</div>';
}
function _rfutSetGarder(v){ _retraitFutGarder=!!v; _rfutRenderGarder(); }
window._rfutSetGarder = _rfutSetGarder;

/* ════════════════════════════════════════════════════════════════
   MA VIGNE — REGISTRE DES MANIPULATIONS OENOLOGIQUES
   Etape A du lot 5. On ne demande RIEN de nouveau : tout est deja
   saisi au Cuvier (operations de cuve) et au Chai (operations de
   cave). On met en forme.

   PERIMETRE : les MANIPULATIONS, c'est-a-dire ce qu'on ajoute au vin
   ou ce qu'on lui fait subir. Le suivi courant — ouillage, mesures de
   densite, analyses — n'en fait pas partie : l'inclure noierait le
   document sous des dizaines de lignes sans interet pour un controle.
   Il est resume en pied plutot qu'ignore.

   ⚠️ Ma Vigne PREPARE, l'exploitant DECLARE. Ce document est un etat
   interne, pas une declaration officielle.
   ════════════════════════════════════════════════════════════════ */

/* Familles de manipulations. L'ordre compte : l'enrichissement et le
   sulfitage sont les deux postes qu'un controle regarde en premier. */
var RM_FAMILLES = [
  {k:'enrichissement', lbl:'Enrichissement',      ico:'goutte'},
  {k:'sulfitage',      lbl:'Sulfitage',           ico:'eprouvette'},
  {k:'intrant',        lbl:'Adjonctions',         ico:'fiole'},
  {k:'pratique',       lbl:'Pratiques de cave',   ico:'rotation'}
];
/* Correspondance type saisi -> famille. Un type absent de cette table
   n'entre PAS au registre : c'est du suivi, pas une manipulation. */
var RM_TYPES = {
  // Cuvier
  chaptalisation:  {fam:'enrichissement', lbl:'Chaptalisation'},
  so2:             {fam:'sulfitage',      lbl:'Sulfitage'},
  levurage:        {fam:'intrant',        lbl:'Levurage'},
  nutriment:       {fam:'intrant',        lbl:'Nutriment'},
  tanins:          {fam:'intrant',        lbl:'Tanins'},
  enzymes:         {fam:'intrant',        lbl:'Enzymes'},
  bentonite:       {fam:'intrant',        lbl:'Bentonite'},
  saignee:         {fam:'pratique',       lbl:'Saign\u00e9e'},
  refroidissement: {fam:'pratique',       lbl:'Refroidissement'},
  rechauffement:   {fam:'pratique',       lbl:'R\u00e9chauffement'},
  delestage:       {fam:'pratique',       lbl:'D\u00e9lestage'},
  assemblage:      {fam:'pratique',       lbl:'Assemblage'},
  // Chai
  soufre:          {fam:'sulfitage',      lbl:'M\u00e8che / pastille de soufre'},
  soutirage:       {fam:'pratique',       lbl:'Soutirage'}
};
/* Volontairement HORS registre, et resumes en pied de document. */
var RM_HORS = {ouillage:'Ouillages', analyse:'Analyses', retrait_fut:'Retraits de f\u00fbts', autre:'Autres'};

function _rmNum(v){ var n = parseFloat(v); return isFinite(n) ? n : null; }
function _rmF(n, d){
  if(n == null) return '\u2014';
  var s = (Math.round(n * Math.pow(10, d==null?1:d)) / Math.pow(10, d==null?1:d));
  return String(s).replace('.', ',');
}
function _rmDate(iso){
  var p = String(iso||'').split('-');
  return (p.length === 3) ? (p[2] + '/' + p[1] + '/' + p[0]) : (iso || '');
}
/* Campagne d'une date : meme axe 1er aout -> 31 juillet que le reste de l'app. */
function _rmCampagne(iso){
  if(typeof window !== 'undefined' && typeof window._mvCampagneDe === 'function')
    return window._mvCampagneDe(iso);
  var md = _mvCampMoisRepli()+1;          /* ★ AXE-1 */
  var p = String(iso||'').split('-');
  var a = parseInt(p[0],10), m = parseInt(p[1],10);
  if(!a || !m){ var d = new Date(); return ((d.getMonth()+1) >= md) ? d.getFullYear() : d.getFullYear()-1; }
  return (m >= md) ? a : (a - 1);
}
/* Libelle de la fenetre d'une campagne, pour les en-tetes de documents. */
function _rmBornesLbl(c){
  if(typeof window !== 'undefined' && typeof window._mvCampagneBornes === 'function'){
    try{ var b = window._mvCampagneBornes(c); if(b && b.lbl) return b.lbl; }
    catch(e){ if(window.logError) window.logError({level:'info',cat:'cave',msg:'bornes de campagne illisibles \u2014 libelle de repli'}); }
  }
  return '1\u1D49\u02B3 ao\u00fbt ' + c + ' \u2192 31 juillet ' + (c+1);
}

/* ── Le detail lisible d'une manipulation ──────────────────────────
   Chaque ligne doit se comprendre SANS revenir a l'ecran de saisie. */
function _rmDetail(o){
  var d = [];
  switch(o.type){
    case 'chaptalisation':
      if(o.volume_hl != null) d.push(_rmF(o.volume_hl) + ' hL trait\u00e9s' + (o.vol_src === 'estime' ? ' (estim\u00e9)' : ''));
      if(o.degre != null)     d.push('+' + _rmF(o.degre) + '\u00b0 vis\u00e9');
      if(o.kg_sucre != null)  d.push(_rmF(o.kg_sucre) + ' kg de sucre');
      break;
    case 'so2':
      if(o.dose != null) d.push(_rmF(o.dose) + ' g/hL');
      if(o.dose != null && o.volume_hl) d.push('soit ' + _rmF(o.dose * o.volume_hl) + ' g sur ' + _rmF(o.volume_hl) + ' hL'
                                               + (o.vol_src === 'estime' ? ' (estim\u00e9)' : ''));
      break;
    case 'soufre':
      if(o.grammes_pastille) d.push(o.grammes_pastille + ' g/pastille');
      if(o.nb_total)         d.push(o.nb_total + ' pastille' + (o.nb_total>1?'s':''));
      if(o.so2_total_g)      d.push(_rmF(o.so2_total_g) + ' g de SO\u2082');
      break;
    case 'levurage':
      if(o.souche) d.push(o.souche);
      if(o.dose != null) d.push(_rmF(o.dose) + ' g/hL');
      break;
    case 'nutriment':
      if(o.ntype) d.push(o.ntype);
      if(o.dose != null) d.push(_rmF(o.dose) + ' g/hL');
      break;
    /* ★ Adjonctions de cuverie. Le controle bio attend le produit, la dose et
       la quantite reelle. Le volume ESTIME est DIT : un registre qui tait d'ou
       vient son volume laisse croire qu'il a ete mesure. */
    case 'tanins':
    case 'enzymes':
    case 'bentonite':
      if(o.produit)           d.push(o.produit);
      if(o.dose != null)      d.push(_rmF(o.dose) + ' ' + (o.dose_unit || 'g/hL'));
      if(o.volume_hl != null) d.push(_rmF(o.volume_hl) + ' hL trait\u00e9s'
                                     + (o.vol_src === 'estime' ? ' (estim\u00e9)' : ''));
      if(o.qte > 0)           d.push('soit ' + _rmF(o.qte, 3) + ' ' + (o.qte_unite || 'kg'));
      break;
    case 'saignee':
      if(o.volume_hl != null) d.push(_rmF(o.volume_hl) + ' hL saign\u00e9s');
      break;
    case 'refroidissement':
    case 'rechauffement':
      if(o.temp_c != null) d.push('cible ' + _rmF(o.temp_c) + ' \u00b0C');
      if(o.moyen)          d.push(_vendMoyLbl(o.type, o.moyen));
      if(o.qte_kg != null) d.push(_rmF(o.qte_kg) + ' kg');
      break;
    case 'delestage':
      if(o.nb) d.push(o.nb + ' d\u00e9lestage' + (o.nb>1?'s':''));
      break;
    case 'assemblage':
      if(o.sources && o.sources.length) d.push('depuis ' + o.sources.join(', '));
      if(o.volume_hl != null) d.push(_rmF(o.volume_hl) + ' hL r\u00e9unis');
      if(o.estime) d.push('volume estim\u00e9');
      break;
    case 'soutirage':
      if(o.so2_dose != null) d.push('SO\u2082 ' + _rmF(o.so2_dose) + ' ' + (o.so2_unite||'cL'));
      if(o.so2_mode === 'repete' && o.so2_nb) d.push(o.so2_nb + ' doses / ' + o.so2_freq + ' j');
      break;
  }
  return d.join(' \u00b7 ');
}

/* ★ VOL-1 — repli : caisses, sinon decuve, sinon rien — jamais la contenance (§152b). */
function _rmVolRepli(V, c){
  if(!c) return null;
  var kg = 0;
  ((V && V.recoltes) || []).forEach(function(r){ if(r && r.cuve_id === c.id) kg += _recKgDom(r); });
  if(kg > 0){
    var hl = Math.max(0, _vendHlKg(kg) - _vendSortiesHl(c));
    if(hl > 0) return {hl:Math.round(hl * 100) / 100, src:'estime'};
  }
  var m = _rmNum(c.vol_decuve_hl);
  return (c.decuvage && m > 0) ? {hl:m, src:'mesure'} : null;
}

/* ── Collecte : Cuvier puis Chai, une ligne par manipulation ──────── */
function _rmLignes(CAVE_VENDANGE, CAVE_ELEVAGE, campagne, millesime){
  var out = [], hors = {};
  var milOk = function(m){ return millesime == null || String(m) === String(millesime); };

  // ── Cuvier : operations de cuve ──
  ((CAVE_VENDANGE && CAVE_VENDANGE.cuves_vinif) || []).forEach(function(c){
    ((c.operations) || []).forEach(function(o){
      if(!o || !o.date) return;
      if(campagne != null && _rmCampagne(o.date) !== campagne) return;
      var T = RM_TYPES[o.type];
      if(!T){ hors[o.type] = (hors[o.type]||0) + 1; return; }
      // le volume de la cuve sert a convertir les doses en g/hL
      var e = {};
      for(var k in o) if(Object.prototype.hasOwnProperty.call(o,k)) e[k] = o[k];
      /* ★ VOL-1 — repli : le contenu, dit estime (§152b). */
      if(e.volume_hl == null){
        var _rv = _rmVolRepli(CAVE_VENDANGE, c);
        if(_rv){ e.volume_hl = _rv.hl; if(!e.vol_src) e.vol_src = _rv.src; }
      }
      var mc = _rmMilCuve(CAVE_VENDANGE, c.id);
      if(!milOk(mc)) return;
      out.push({date:o.date, fam:T.fam, type:o.type, lbl:T.lbl, source:'Cuvier', mil:mc,
                contenant:c.nom || 'Cuve', volume:(e.volume_hl != null ? e.volume_hl : null),
                detail:_rmDetail(e), note:o.note || '', operateur:'', brut:e});
    });
  });

  // ── Chai : operations de cave ──
  ((CAVE_ELEVAGE && CAVE_ELEVAGE.operations) || []).forEach(function(o){
    if(!o || !o.date) return;
    if(campagne != null && _rmCampagne(o.date) !== campagne) return;
    var T = RM_TYPES[o.type];
    if(!T){ hors[o.type] = (hors[o.type]||0) + 1; return; }
    // ⚠ BUG CORRIGE, deuxieme occurrence du meme : le champ s'appelle
    // cuvees_ids (cuvee_id au singulier pour les operations anciennes).
    // « o.cuvees » ne matchait jamais : la colonne « contenant » du registre
    // sortait VIDE pour toutes les operations du Chai.
    var _ids = o.cuvees_ids || (o.cuvee_id ? [o.cuvee_id] : []);
    var noms = _ids.map(function(id){
      var c = ((CAVE_ELEVAGE.cuvees)||[]).find(function(x){ return x.id === id; });
      return c ? (c.nom + (c.millesime ? ' \u2019' + String(c.millesime).slice(-2) : '')) : null;
    }).filter(Boolean);
    var mch = _rmMilCuvees(CAVE_ELEVAGE, _ids);
    if(!milOk(mch)) return;
    var e = {};
    if(o.data) for(var k in o.data) if(Object.prototype.hasOwnProperty.call(o.data,k)) e[k] = o.data[k];
    e.type = o.type;
    // le SO2 d'un soutirage est imbrique dans data.so2
    if(o.type === 'soutirage' && o.data && o.data.so2 && o.data.so2.mode && o.data.so2.mode !== 'none'){
      e.so2_dose = _rmNum(o.data.so2.dose);
      e.so2_unite = o.data.so2.unite;
      e.so2_mode = (o.data.so2.mode === 'unique') ? 'unique' : 'repete';
      e.so2_nb = o.data.so2.nb_doses; e.so2_freq = o.data.so2.freq_j;
    }
    var qui = o.operateur || '';
    if(!qui && o.intervenants && o.intervenants.length) qui = o.intervenants.join(', ');
    out.push({date:o.date, fam:T.fam, type:o.type, lbl:T.lbl, source:'Chai', mil:mch,
              contenant:noms.length ? noms.join(', ') : 'Toutes cuv\u00e9es',
              volume:null, detail:_rmDetail(e),
              note:(o.notes || (o.data && o.data.note) || ''), operateur:qui, brut:e});
  });

  out.sort(function(a,b){
    if(a.date !== b.date) return String(a.date).localeCompare(String(b.date));
    return a.fam.localeCompare(b.fam);
  });
  return {lignes:out, hors:hors};
}

/* ── Totaux : ce qu'un controle regarde en premier ────────────────── */
function _rmTotaux(lignes){
  var t = {sucre:0, volEnrichi:0, nbEnrich:0, so2g:0, nbSulf:0, saignee:0, parFam:{}, parType:{}};
  lignes.forEach(function(l){
    t.parFam[l.fam] = (t.parFam[l.fam]||0) + 1;
    t.parType[l.type] = (t.parType[l.type]||0) + 1;
    var b = l.brut || {};
    if(l.type === 'chaptalisation'){
      t.nbEnrich++;
      if(b.kg_sucre != null) t.sucre += b.kg_sucre;
      if(b.volume_hl != null) t.volEnrichi += b.volume_hl;
    }
    if(l.type === 'so2'){
      t.nbSulf++;
      if(b.dose != null && b.volume_hl) t.so2g += b.dose * b.volume_hl;
    }
    if(l.type === 'soufre'){
      t.nbSulf++;
      if(b.so2_total_g != null) t.so2g += b.so2_total_g;
    }
    if(l.type === 'soutirage' && b.so2_dose != null) t.nbSulf++;
    if(l.type === 'saignee' && b.volume_hl != null) t.saignee += b.volume_hl;
  });
  return t;
}

/* ── Campagnes disponibles, la plus recente d'abord ──────────────── */
/* ── Rattacher une operation a SON millesime ───────────────────────
   ⚠ MODELE ARBITRE PAR NICO : chaque millesime est une entite a part, dans
   sa propre cave. Le registre doit donc se lire millesime par millesime,
   pas campagne par campagne : une campagne contient le millesime qui rentre
   ET celui qui finit son elevage.
   Une CUVE se rattache par les recoltes qui l'alimentent ; une CUVEE porte
   son millesime en clair. */
function _rmMilCuve(CAVE_VENDANGE, cuveId){
  var recs = ((CAVE_VENDANGE && CAVE_VENDANGE.recoltes) || [])
    .filter(function(r){ return r && r.cuve_id === cuveId && r.date; });
  if(!recs.length) return null;
  // Une cuve remplie sur deux annees civiles n'existe pas en pratique ;
  // on prend la plus ancienne recolte, qui date la cuvaison.
  recs.sort(function(a,b){ return String(a.date).localeCompare(String(b.date)); });
  return String(recs[0].date).slice(0,4);
}
function _rmMilCuvees(CAVE_ELEVAGE, ids){
  var set = {};
  (ids||[]).forEach(function(id){
    var c = ((CAVE_ELEVAGE && CAVE_ELEVAGE.cuvees) || []).find(function(x){ return x.id === id; });
    if(c && c.millesime) set[String(c.millesime)] = 1;
  });
  var k = Object.keys(set);
  return k.length === 1 ? k[0] : null;   // mixte ou inconnu -> non rattachable
}
/* Les millesimes pour lesquels il y a des manipulations a raconter. */
function _rmMillesimes(CAVE_VENDANGE, CAVE_ELEVAGE){
  var set = {};
  _rmLignes(CAVE_VENDANGE, CAVE_ELEVAGE, null, null).lignes.forEach(function(l){
    if(l.mil) set[l.mil] = 1;
  });
  return Object.keys(set).sort(function(a,b){ return Number(b)-Number(a); });
}
function _rmCampagnes(CAVE_VENDANGE, CAVE_ELEVAGE){
  var set = {};
  ((CAVE_VENDANGE && CAVE_VENDANGE.cuves_vinif) || []).forEach(function(c){
    ((c.operations)||[]).forEach(function(o){ if(o && o.date && RM_TYPES[o.type]) set[_rmCampagne(o.date)] = 1; });
  });
  ((CAVE_ELEVAGE && CAVE_ELEVAGE.operations) || []).forEach(function(o){
    if(o && o.date && RM_TYPES[o.type]) set[_rmCampagne(o.date)] = 1;
  });
  return Object.keys(set).map(Number).sort(function(a,b){ return b-a; });
}

function _rmDoc(CAVE_VENDANGE, CAVE_ELEVAGE, DOM, campagne, millesime){
  var r = _rmLignes(CAVE_VENDANGE, CAVE_ELEVAGE, campagne, millesime);
  var T = _rmTotaux(r.lignes);
  var e = function(s){ return String(s==null?'':s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var auj = new Date();
  var jj = String(auj.getDate()).padStart(2,'0') + '/'
         + String(auj.getMonth()+1).padStart(2,'0') + '/' + auj.getFullYear();

  /* ── en-tête ── */
  var h = '<div class="rm-hero">'
    + '<div class="rm-hero-k">Registre des manipulations \u0153nologiques</div>'
    + '<div class="rm-hero-t">' + e(DOM.nom) + '</div>'
    + '<div class="rm-hero-s">' + e(DOM.commune || '')
    + (DOM.siret ? ' \u00b7 SIRET ' + e(DOM.siret) : '') + '</div>'
    + '<div class="rm-hero-c">'
    + (millesime != null
        ? ('<span>Mill\u00e9sime <b>' + millesime + '</b></span>'
           + '<span>toutes les manipulations de ce vin, de la cuve au f\u00fbt</span>')
        : ('<span>Campagne <b>' + campagne + '\u2013' + (campagne+1) + '</b></span>'
           + '<span>' + _rmEsc(_rmBornesLbl(campagne)) + '</span>'))
    + '<span>\u00e9dit\u00e9 le ' + jj + '</span></div></div>';

  /* ── les deux chiffres qu'un contrôle regarde en premier ── */
  h += '<div class="rm-tiles">'
    + '<div class="rm-tile"><div class="rm-tile-v">' + _rmF(T.sucre,1) + '<small>kg</small></div>'
    + '<div class="rm-tile-l">sucre d\u2019enrichissement</div>'
    + '<div class="rm-tile-s">' + T.nbEnrich + ' op\u00e9ration' + (T.nbEnrich>1?'s':'')
    + ' \u00b7 ' + _rmF(T.volEnrichi,0) + ' hL trait\u00e9s</div></div>'
    + '<div class="rm-tile"><div class="rm-tile-v">' + _rmF(T.so2g,0) + '<small>g</small></div>'
    + '<div class="rm-tile-l">SO\u2082 tra\u00e7able</div>'
    + '<div class="rm-tile-s">' + T.nbSulf + ' sulfitage' + (T.nbSulf>1?'s':'')
    + ' \u00b7 doses en cL non converties</div></div>'
    + '<div class="rm-tile"><div class="rm-tile-v">' + r.lignes.length + '</div>'
    + '<div class="rm-tile-l">manipulations</div>'
    + '<div class="rm-tile-s">' + RM_FAMILLES.filter(function(f){ return T.parFam[f.k]; })
        .map(function(f){ return T.parFam[f.k] + ' ' + f.lbl.toLowerCase(); }).join(' \u00b7 ') + '</div></div>'
    + '</div>';

  if(!r.lignes.length){
    h += '<div class="rm-vide">Aucune manipulation enregistr\u00e9e sur cette campagne.</div>';
    return h + _rmPied(r, DOM);
  }

  /* ── par famille : l'enrichissement d'abord ── */
  RM_FAMILLES.forEach(function(F){
    var L = r.lignes.filter(function(l){ return l.fam === F.k; });
    if(!L.length) return;
    h += '<div class="rm-sec"><span class="rm-sec-i">' + _mvIconInline(F.ico,16) + '</span>' + F.lbl
      + '<span class="rm-sec-n">' + L.length + '</span></div>';
    h += '<table class="rm-t"><thead><tr>'
      + '<th class="d">Date</th><th>Contenant</th><th>Nature</th>'
      + '<th class="w">D\u00e9tail</th><th>Intervenant</th></tr></thead><tbody>';
    L.forEach(function(l){
      h += '<tr><td class="d">' + _rmDate(l.date) + '</td>'
        + '<td class="c">' + e(l.contenant) + '<span class="src">' + l.source + '</span></td>'
        + '<td>' + e(l.lbl) + '</td>'
        + '<td class="w">' + e(l.detail || '\u2014')
        + (l.note ? '<span class="nt">' + e(l.note) + '</span>' : '') + '</td>'
        + '<td class="o">' + (l.operateur ? e(l.operateur) : '\u2014') + '</td></tr>';
    });
    h += '</tbody></table>';
    if(F.k === 'enrichissement' && T.nbEnrich){
      h += '<div class="rm-tot">Total campagne : <b>' + _rmF(T.sucre,1) + ' kg</b> de sucre '
        + 'sur <b>' + _rmF(T.volEnrichi,0) + ' hL</b>.</div>';
    }
    if(F.k === 'sulfitage' && T.so2g){
      h += '<div class="rm-tot">Total tra\u00e7able : <b>' + _rmF(T.so2g,0) + ' g</b> de SO\u2082. '
        + 'Les doses saisies en cL de solution ne sont pas converties \u2014 elles d\u00e9pendent '
        + 'du titre de votre solution.</div>';
    }
  });

  /* ── chronologie ── */
  h += '<div class="rm-sec rm-brk"><span class="rm-sec-i">' + _mvIconInline("calendrier",16) + '</span>Chronologie'
    + '<span class="rm-sec-n">' + r.lignes.length + '</span></div>';
  h += '<table class="rm-t rm-chr"><thead><tr><th class="d">Date</th><th>Nature</th>'
    + '<th>Contenant</th><th class="w">D\u00e9tail</th></tr></thead><tbody>';
  r.lignes.forEach(function(l){
    h += '<tr><td class="d">' + _rmDate(l.date) + '</td><td>' + e(l.lbl) + '</td>'
      + '<td class="c">' + e(l.contenant) + '</td>'
      + '<td class="w">' + e(l.detail || '\u2014') + '</td></tr>';
  });
  h += '</tbody></table>';
  return h + _rmPied(r, DOM);
}

function _rmPied(r, DOM){
  var hors = Object.keys(r.hors).filter(function(k){ return RM_HORS[k]; })
    .map(function(k){
      var n = r.hors[k], lbl = RM_HORS[k].toLowerCase();
      // « 1 analyses » : le libelle est au pluriel, on le repasse au singulier.
      if(n === 1) lbl = lbl.replace(/s$/, '').replace(/s de /, ' de ');
      return n + ' ' + lbl;
    });
  var h = '<div class="rm-pied">';
  if(hors.length){
    h += '<p><b>Hors registre.</b> Le suivi courant n\u2019est pas une manipulation et n\u2019entre '
      + 'pas dans ce document : ' + hors.join(', ') + ' sur la p\u00e9riode. '
      + 'Ils restent consultables dans le journal de cave.</p>';
  }
  h += '<p><b>Ce que ce document est.</b> Un \u00e9tat interne, produit \u00e0 partir des op\u00e9rations '
    + 'que vous avez saisies au Cuvier et au Chai. Il vous permet de retrouver et de pr\u00e9senter '
    + 'vos manipulations. <b>Ce n\u2019est pas une d\u00e9claration officielle</b> : Ma Vigne pr\u00e9pare, '
    + 'l\u2019exploitant d\u00e9clare et reste responsable de ses obligations.</p>'
    + '<p><b>Limite connue.</b> Les op\u00e9rations saisies au Cuvier n\u2019enregistrent pas '
    + 'd\u2019intervenant : la colonne reste vide pour celles-ci. Celles du Chai le portent.</p>'
    + '<div class="rm-sig">G\u00e9n\u00e9r\u00e9 par Ma Vigne \u00b7 ' + String(DOM.nom||'') + '</div>'
    + '</div>';
  return h;
}

var RM_CSS = ''
+ '@page{size:A4 portrait;margin:14mm 12mm}'
+ '.rm-doc{font-family:Outfit,system-ui,sans-serif;color:#2A241C;font-size:var(--pt-micro,11px);line-height:1.45;'
+ 'background:#fff;max-width:186mm;margin:0 auto;padding:0 0 20px}'
+ '.rm-hero{background:linear-gradient(160deg,#14110D,#1C1813);color:#F0E2C8;padding:20px 22px 17px;'
+ 'border-radius:12px;position:relative;overflow:hidden;margin-bottom:16px}'
+ '.rm-hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;'
+ 'background:linear-gradient(90deg,#8A5A38 0%,#C2871E 50%,#3D6B27 100%)}'
+ '.rm-hero-k{font-size:var(--pt-nano,9.5px);letter-spacing:.18em;text-transform:uppercase;color:#A99C82}'
+ '.rm-hero-t{font-family:"Cormorant Garamond",Georgia,serif;font-size:30px;font-weight:700;'
+ 'line-height:1.05;margin-top:5px}'
+ '.rm-hero-s{font-size:var(--pt-micro,11px);color:#9C9184;margin-top:3px}'
+ '.rm-hero-c{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;padding-top:11px;'
+ 'border-top:1px solid rgba(216,188,114,.2);font-size:var(--pt-lbl,10.5px);color:#C8BCA6}'
+ '.rm-hero-c b{color:#E7CE86}'
+ '.rm-tiles{display:flex;gap:10px;margin-bottom:18px}'
+ '.rm-tile{flex:1;border:1px solid #E4DAC8;border-radius:11px;padding:12px 13px;background:#FBFAF6}'
+ '.rm-tile-v{font-family:"Cormorant Garamond",Georgia,serif;font-size:29px;font-weight:700;'
+ 'color:#8A5A38;line-height:1}'
+ '.rm-tile-v small{font-size:13px;margin-left:3px;color:#8B8175;font-family:Outfit,sans-serif;font-weight:400}'
+ '.rm-tile-l{font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:#8B8175;margin-top:5px}'
+ '.rm-tile-s{font-size:10px;color:#8B8175;margin-top:5px;line-height:1.4}'
+ '.rm-sec{display:flex;align-items:center;gap:7px;font-size:13.5px;font-weight:600;color:#8A5A38;'
+ 'margin:18px 0 7px;padding-bottom:5px;border-bottom:2px solid rgba(194,161,77,.35)}'
+ '.rm-sec-i{font-size:var(--pt-base,14px)}'
+ '.rm-sec-n{margin-left:auto;font-size:var(--pt-micro,11px);font-weight:600;color:#8B8175;background:#F3EADF;'
+ 'border-radius:20px;padding:2px 9px}'
+ '.rm-brk{page-break-before:always}'
+ '.rm-t{width:100%;border-collapse:collapse;font-size:var(--pt-lbl,10.5px);margin-bottom:4px}'
+ '.rm-t th{text-align:left;font-size:9px;letter-spacing:.07em;text-transform:uppercase;'
+ 'color:#8B8175;font-weight:600;padding:5px 7px;border-bottom:1px solid #E4DAC8}'
+ '.rm-t td{padding:6px 7px;border-bottom:1px solid #F0EAE0;vertical-align:top}'
+ '.rm-t tr:last-child td{border-bottom:0}'
+ '.rm-t .d{white-space:nowrap;color:#5F5F5F;width:64px}'
+ '.rm-t .c{font-weight:600;color:#2A241C}'
+ '.rm-t .c .src{display:block;font-size:9px;font-weight:400;color:#A09684;margin-top:1px}'
+ '.rm-t .w{color:#4A4A3A}'
+ '.rm-t .w .nt{display:block;font-size:var(--pt-nano,9.5px);color:#8B8175;font-style:italic;margin-top:2px}'
+ '.rm-t .o{color:#5F5F5F;white-space:nowrap}'
+ '.rm-chr td{padding:4px 7px}'
+ '.rm-tot{font-size:var(--pt-micro,11px);color:#4A4A3A;background:#FAF3E0;border:1px solid rgba(194,161,77,.35);'
+ 'border-radius:9px;padding:9px 12px;margin:6px 0 4px;line-height:1.5}'
+ '.rm-tot b{color:#8A5A38}'
+ '.rm-vide{text-align:center;color:#8B8175;padding:40px 20px;font-size:12px}'
+ '.rm-pied{margin-top:22px;padding-top:13px;border-top:1px solid #E4DAC8;font-size:10px;'
+ 'color:#6F675C;line-height:1.55}'
+ '.rm-pied p{margin:0 0 7px}.rm-pied b{color:#4A4A3A}'
+ '.rm-sig{margin-top:10px;text-align:center;font-size:var(--pt-nano,9.5px);color:#A09684}'
+ '@media print{.rm-doc{max-width:none;padding:0}.rm-sec{page-break-after:avoid}'
+ '.rm-t{page-break-inside:auto}.rm-t tr{page-break-inside:avoid}.rm-tiles{page-break-inside:avoid}}';

/* ── L'export : Blob -> nouvel onglet -> impression ────────────────
   Meme mecanique que l'inventaire des futs et le bilan matiere. */
function _rmExport(campagne, millesime){
  var DOM = {
    nom: (window.DOMAINE_NOM || (window.CONFIG && window.CONFIG.domaine) || 'Mon domaine'),
    commune: (window.CONFIG && window.CONFIG.commune) || '',
    siret: (window.CONFIG && window.CONFIG.siret) || ''
  };
  // Un millesime donne prime sur la campagne : le document porte alors sur
  // TOUT le vin de cette annee, quelle que soit la campagne de l'operation.
  var an = (millesime != null) ? null
         : ((campagne != null) ? campagne : _rmCampagne(_mvToday()));
  var body, nb = 0;
  try{
    var r = _rmLignes(CAVE_VENDANGE, CAVE_ELEVAGE, an, millesime);
    nb = r.lignes.length;
    body = _rmDoc(CAVE_VENDANGE, CAVE_ELEVAGE, DOM, an, millesime);
  }catch(err){
    window.logError && window.logError({level:'error', cat:'cave', msg:'registre manipulations'});
    showToast('Registre impossible \u00e0 produire', '#C0392B'); return;
  }
  var html = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
    + '<title>Registre des manipulations' + (millesime!=null ? ' ' + millesime : '')
    + ' \u2014 ' + _rmEsc(DOM.nom) + '</title>'
    + '<link rel="stylesheet" href="/fonts/fonts.css">'
    + '<style>body{margin:0;background:#fff}' + RM_CSS + '</style></head>'
    + '<body><div class="rm-doc">' + body + '</div>'
    + '<scr'+'ipt>window.onload=function(){setTimeout(function(){window.print();},500);};</scr'+'ipt>'
    + '</body></html>';
  try{
    var blob = new Blob([html], {type:'text/html'});
    var url = URL.createObjectURL(blob);
    var w = window.open(url, '_blank');
    if(!w) showToast('Autorise les pop-ups pour imprimer', '#B85A1A');
    else showToast('Registre' + (millesime!=null?' '+millesime:'') + ' \u00b7 '
      + nb + ' manipulation' + (nb>1?'s':''), '#3D6B27');
  }catch(err){ showToast('Export impossible', '#C0392B'); }
}
function _rmEsc(s){ return String(s==null?'':s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* Choix de la campagne quand il y en a plusieurs, sinon export direct. */
/* ⚠ Le registre se lit par MILLESIME, pas par campagne : une campagne
   contient le millesime qui rentre ET celui qui finit son elevage.
   Repli sur le choix par campagne quand aucune ligne n'est rattachable
   (donnees anciennes, cuve sans recolte liee) : c'est le comportement
   d'avant ce lot, jamais un ecran vide. */
window._rmExportChoix = function(){
  var ms = _rmMillesimes(CAVE_VENDANGE, CAVE_ELEVAGE);
  if(ms.length === 1){ _rmExport(null, ms[0]); return; }
  if(ms.length > 1 && typeof window.openPrompt === 'function'){
    window.openPrompt({
      titre:'Quel mill\u00e9sime ?', unite:'', icone:'liste', type:'nombre',
      sub:'Chaque mill\u00e9sime a son registre \u2014 on ne m\u00e9lange pas les vins. '
         + 'Disponibles : ' + ms.join(', ') + '.',
      valeur:String(ms[0]), placeholder:String(ms[0]), btnLabel:'\u00c9diter le registre',
      cb:function(v){
        var n = String(parseInt(String(v).replace(/\D/g,''), 10));
        if(ms.indexOf(n) < 0){ showToast('Aucune manipulation sur ' + n, '#B85A1A'); return; }
        _rmExport(null, n);
      }
    });
    return;
  }
  if(ms.length > 1){ _rmExport(null, ms[0]); return; }
  var cs = _rmCampagnes(CAVE_VENDANGE, CAVE_ELEVAGE);
  if(!cs.length){ showToast('Aucune manipulation enregistr\u00e9e', '#B85A1A'); return; }
  if(cs.length === 1 || typeof window.openPrompt !== 'function'){ _rmExport(cs[0]); return; }
  window.openPrompt({
    titre:'Quelle campagne ?', unite:'', icone:'liste', type:'nombre',
    sub:'Campagnes disponibles : ' + cs.map(function(c){ return c + '\u2013' + (c+1); }).join(', ')
       + '. Indiquez l\u2019ann\u00e9e de d\u00e9but.',
    valeur:String(cs[0]), placeholder:String(cs[0]), btnLabel:'\u00c9diter le registre',
    cb:function(v){
      var n = parseInt(String(v).replace(/\D/g,''), 10);
      if(cs.indexOf(n) < 0){ showToast('Aucune manipulation sur ' + n, '#B85A1A'); return; }
      _rmExport(n);
    }
  });
}
window._rmExport       = _rmExport;
window._rmCampagnes    = _rmCampagnes;
window._rmLignes       = _rmLignes;
window._rmTotaux       = _rmTotaux;
window._rmDoc          = _rmDoc;

/* ════════════════════════════════════════════════════════════════
   MA VIGNE — BILAN DE CAMPAGNE
   Etape B, recadree par Nico : ce n'est PAS une declaration de
   recolte. C'est un etat INTERNE de fin d'annee, informatif.
   Aucun terrain declaratif, aucune obligation, aucun format impose.

   ⚠️ CE FICHIER N'INVENTE AUCUN CALCUL. Il agrege ce qui existe :
     _mlChaine   (Le millesime)  -> le flux benne -> bouteille
     _mvFutParc  (parc a futs)   -> l'etat et les mouvements du parc
     _rmLignes   (registre)      -> les manipulations
   Seules la VIGNE (journal) et la PROTECTION (traitements) sont
   calculees ici, faute de source existante a la maille campagne.
   ════════════════════════════════════════════════════════════════ */

function _bcNum(v){ var n = parseFloat(v); return isFinite(n) ? n : 0; }
function _bcF(n, d){
  if(n == null || !isFinite(n)) return '\u2014';
  var p = Math.pow(10, d==null?1:d);
  return String(Math.round(n*p)/p).replace('.', ',');
}
function _bcInt(n){
  if(n == null || !isFinite(n)) return '\u2014';
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
}
function _bcDate(iso){
  var p = String(iso||'').split('-');
  return (p.length === 3) ? (p[2] + '/' + p[1] + '/' + p[0]) : (iso||'');
}
var _BC_MOIS = ['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];
function _bcMois(iso){
  var p = String(iso||'').split('-');
  return (p.length >= 2) ? (_BC_MOIS[parseInt(p[1],10)-1] + ' ' + p[0]) : '';
}
function _bcCampagne(iso){
  if(typeof window !== 'undefined' && typeof window._mvCampagneDe === 'function')
    return window._mvCampagneDe(iso);
  var md = _mvCampMoisRepli()+1;          /* ★ AXE-1 */
  var p = String(iso||'').split('-');
  var a = parseInt(p[0],10), m = parseInt(p[1],10);
  if(!a || !m){ var d = new Date(); return ((d.getMonth()+1) >= md) ? d.getFullYear() : d.getFullYear()-1; }
  return (m >= md) ? a : (a-1);
}
/* Bornes d'une campagne : 1er aout -> 31 juillet, la meme partout. */
/* ★ AXE-1 : les bornes viennent de _mvCampagneBornes (utils.js), pas d'ici.
   Elles etaient ecrites en dur a quatre endroits ; le jour ou le mois
   d'ouverture est devenu un reglage, trois d'entre eux auraient menti.
   Repli en dur conserve : un cave.js neuf sur un utils.js ancien ne plante pas. */
function _bcBornes(c){
  if(typeof window!=='undefined' && typeof window._mvCampagneBornes==='function'){
    try{ var b=window._mvCampagneBornes(c); if(b&&b.d0&&b.d1) return {d0:b.d0, d1:b.d1, lbl:b.lbl, court:b.court}; }
    catch(e){ if(window.logError) window.logError({level:'info',cat:'cave',msg:'bornes de campagne illisibles \u2014 repli 1er aout'}); }
  }
  return {d0:c + '-08-01', d1:(c+1) + '-07-31',
          lbl:'1\u1D49\u02B3 ao\u00fbt '+c+' \u2192 31 juillet '+(c+1), court:c+'\u2013'+(c+1)};
}

/* ── LA VIGNE : ce qui a ete fait, depuis le journal ───────────────
   ⚠️ Le journal porte une entree par VALIDATION. Une parcelle relevee
   trois fois y figure trois fois : c'est voulu, c'est l'effort reel.
   On distingue donc deux mesures qui ne veulent pas dire la meme chose :
     surface travaillee = somme des passages  (l'effort)
     parcelles couvertes = distinctes         (l'etendue)
   Les melanger produirait un chiffre qui ne veut rien dire. */
function _bcVigne(JOURNAL, PARCELLES, c){
  var b = _bcBornes(c);
  var surf = {};
  (PARCELLES||[]).forEach(function(p){ if(p && p.nom) surf[p.nom] = _bcNum(p.surface); });
  var parT = {}, jours = {}, gens = {};
  (JOURNAL||[]).forEach(function(j){
    if(!j || j.meteo || !j.date || !j.tache) return;
    if(j.date < b.d0 || j.date > b.d1) return;
    if(j.statut !== 'Valid\u00e9') return;
    var t = parT[j.tache] || (parT[j.tache] = {tache:j.tache, n:0, surface:0, parcelles:{},
                                              d0:j.date, d1:j.date, gens:{}});
    t.n++;
    t.surface += (surf[j.parcelle] || 0);      // 'Domaine' n'a pas de surface : 0, volontairement
    if(j.parcelle && j.parcelle !== 'Domaine') t.parcelles[j.parcelle] = 1;
    if(j.date < t.d0) t.d0 = j.date;
    if(j.date > t.d1) t.d1 = j.date;
    if(j.qui){ t.gens[j.qui] = 1; gens[j.qui] = 1; }
    (j.membresEquipe||[]).forEach(function(n){ if(n){ t.gens[n] = 1; gens[n] = 1; } });
    jours[j.date] = 1;
  });
  var lignes = Object.keys(parT).map(function(k){
    var t = parT[k];
    return {tache:t.tache, n:t.n, surface:t.surface,
            parcelles:Object.keys(t.parcelles).length,
            gens:Object.keys(t.gens).length, d0:t.d0, d1:t.d1};
  }).sort(function(a,b2){ return b2.surface - a.surface; });
  return {lignes:lignes, jours:Object.keys(jours).length,
          gens:Object.keys(gens).length,
          surface:lignes.reduce(function(s,l){ return s+l.surface; }, 0),
          validations:lignes.reduce(function(s,l){ return s+l.n; }, 0)};
}

/* ── LA PROTECTION : traitements de la campagne ───────────────────── */
function _bcPhyto(TRAITEMENTS, c){
  var b = _bcBornes(c);
  var n = 0, parc = {}, prods = {}, dates = {};
  (TRAITEMENTS||[]).forEach(function(t){
    if(!t || !t.date) return;
    if(t.date < b.d0 || t.date > b.d1) return;
    n++;
    if(t.parcelle) parc[t.parcelle] = (parc[t.parcelle]||0) + 1;
    var p = t.produit || t.nom || '';
    if(p) prods[p] = (prods[p]||0) + 1;
    dates[t.date] = 1;
  });
  var passages = Object.keys(parc).map(function(k){ return parc[k]; });
  return {n:n, parcelles:Object.keys(parc).length, produits:Object.keys(prods).length,
          jours:Object.keys(dates).length,
          maxPassages: passages.length ? Math.max.apply(null, passages) : 0,
          topProduits: Object.keys(prods).sort(function(a,b2){ return prods[b2]-prods[a]; })
                             .slice(0,6).map(function(k){ return {nom:k, n:prods[k]}; })};
}

/* ── L'ASSEMBLAGE ────────────────────────────────────────────────── */
/* ⚠ La campagne et le millesime ne recouvrent PAS la meme chose. La vigne,
   la protection et le parc a futs sont des grandeurs de CAMPAGNE : ils
   decrivent une annee de travail, pas un vin. La chaine benne -> bouteille,
   le chai et les manipulations sont des grandeurs de MILLESIME.
   Le document le dit explicitement plutot que de laisser croire que tout
   porte sur la meme chose. Par defaut mil = c, l'usage le plus courant. */
function _bcData(ctx, c, mil){
  var W = (typeof window !== 'undefined') ? window : {};
  if(mil == null) mil = c;
  var d = {campagne:c, millesime:mil, memeAxe:(String(mil)===String(c)), bornes:_bcBornes(c)};

  d.vigne = _bcVigne(ctx.JOURNAL, ctx.PARCELLES, c);
  d.phyto = _bcPhyto(ctx.TRAITEMENTS, c);

  d.surfaceTotale = (ctx.PARCELLES||[]).reduce(function(s,p){
    return s + ((p && p.arrachee) ? 0 : _bcNum(p && p.surface));
  }, 0);
  d.nbParcelles = (ctx.PARCELLES||[]).filter(function(p){ return p && p.nom && !p.arrachee; }).length;

  /* Le flux benne -> bouteille vient du moteur du millesime : pas de copie. */
  d.chaine = (typeof W._mlChaine === 'function') ? W._mlChaine(mil) : null;
  /* L'etat du parc a futs vient du moteur du parc. */
  d.parc = (typeof W._mvFutParc === 'function')
    ? W._mvFutParc(ctx.INTRANTS, ctx.CAVE_ELEVAGE, c+1) : null;
  /* Les manipulations viennent du registre. */
  d.manip = (typeof W._rmLignes === 'function')
    ? W._rmLignes(ctx.CAVE_VENDANGE, ctx.CAVE_ELEVAGE, null, mil) : null;

  /* Rendement moyen du domaine : sur les seules parcelles RECOLTEES.
     Le rapporter a la surface totale ferait mentir le chiffre d'un domaine
     qui a vendu du raisin sur pied ou laisse une parcelle.
     ★ SOURCE UNIQUE avec la carte du Pilotage (_mlRdtMoyen). Ce document
     calculait sa propre estimation d'apres les kilos pendant que le Pilotage
     divisait le volume decuve : deux chiffres pour une seule grandeur. */
  var _rm = _mlRdtMoyen(d.chaine);
  d.rdtMoyen    = _rm.hlHa;
  d.rdtMoyenEst = (_rm.statut === 'estime');
  d.rdtMoyenSs  = _rm.sansSurface || 0;
  d.rdtMoyenAx  = _rm.approx || 0;
  d.rdtMoyenHa  = _rm.ha || 0;

  /* Cuvees en elevage au 31 juillet. Filtrees sur le millesime du document :
     chaque millesime est une entite a part, dans sa propre cave. Le total
     general reste affiche a cote, car c'est ce qui remplit le chai. */
  d.chaiTous = ((ctx.CAVE_ELEVAGE && ctx.CAVE_ELEVAGE.cuvees) || [])
    .filter(function(x){ return x && x.statut !== 'embouteille'; }).length;
  d.chai = ((ctx.CAVE_ELEVAGE && ctx.CAVE_ELEVAGE.cuvees) || [])
    .filter(function(x){ return x && x.statut !== 'embouteille'
                          && String(x.millesime) === String(mil); })
    .map(function(x){
      var f = (x.tonneaux||[]).reduce(function(s,t){ return s + (parseInt(t.nb,10)||0); }, 0);
      // ★ FUT-CAP — 2,28 etait ecrit EN DUR ici : faux hors Bourgogne, et les cuves oubliees.
      return {nom:x.nom, millesime:x.millesime, futs:f, hl:Math.round(_caveVolL(x)/10)/10};
    }).sort(function(a,b2){
      if(a.millesime !== b2.millesime) return b2.millesime - a.millesime;
      return b2.futs - a.futs;
    });
  d.chaiFuts = d.chai.reduce(function(s,x){ return s+x.futs; }, 0);
  d.chaiHl = Math.round(d.chai.reduce(function(s,x){ return s+x.hl; }, 0)*10)/10;

  /* Mises en bouteille de la campagne. */
  d.bouteilles = ((ctx.CAVE_ELEVAGE && ctx.CAVE_ELEVAGE.cuvees) || [])
    .filter(function(x){ return x && x.statut === 'embouteille' && x.date_embouteillage
                          && String(x.millesime) === String(mil); })
    .map(function(x){ return {nom:x.nom, millesime:x.millesime, nb:x.nb_bouteilles||0,
                              date:x.date_embouteillage}; })
    .sort(function(a,b2){ return String(a.date).localeCompare(String(b2.date)); });
  d.btlTotal = d.bouteilles.reduce(function(s,x){ return s+x.nb; }, 0);

  return d;
}

/* Campagnes pour lesquelles il y a quelque chose a raconter. */
function _bcCampagnes(ctx){
  var set = {};
  (ctx.JOURNAL||[]).forEach(function(j){ if(j && j.date && !j.meteo) set[_bcCampagne(j.date)] = 1; });
  ((ctx.CAVE_VENDANGE && ctx.CAVE_VENDANGE.recoltes)||[]).forEach(function(r){
    if(r && r.date) set[_bcCampagne(r.date)] = 1; });
  return Object.keys(set).map(Number).filter(function(x){ return isFinite(x); })
    .sort(function(a,b2){ return b2-a; });
}

function _bcDoc(ctx, DOM, c, mil){
  var d = _bcData(ctx, c, mil);
  var e = function(s){ return String(s==null?'':s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var a = new Date();
  var jj = String(a.getDate()).padStart(2,'0') + '/' + String(a.getMonth()+1).padStart(2,'0')
         + '/' + a.getFullYear();
  var ch = d.chaine;
  var kgHl = (ch && ch.kgHl) || 135;

  /* ── en-tête ── */
  var h = '<div class="bc-hero">'
    + '<div class="bc-hero-k">Bilan de campagne</div>'
    + '<div class="bc-hero-t">' + e(DOM.nom) + '</div>'
    + '<div class="bc-hero-y">' + c + '\u2013' + (c+1)
    + (d.memeAxe ? '' : ' \u00b7 mill\u00e9sime ' + d.millesime) + '</div>'
    + '<div class="bc-hero-c"><span>' + e(DOM.commune||'') + '</span>'
    + '<span>' + e(d.bornes.lbl || ('du 1er ao\u00fbt ' + c + ' au 31 juillet ' + (c+1))) + '</span>'
    + '<span>\u00e9dit\u00e9 le ' + jj + '</span></div></div>';

  /* ── les quatre chiffres de l'année ── */
  var tiles = [
    {v:_bcF(d.surfaceTotale,2), u:'ha', l:'exploit\u00e9s',
     s:d.nbParcelles + ' parcelle' + (d.nbParcelles>1?'s':'')},
    {v:ch ? _bcInt(ch.kg/1000) : '\u2014', u:'t', l:'de raisin rentr\u00e9',
     s:ch ? (ch.parcelles + ' parcelle' + (ch.parcelles>1?'s':'') + ' r\u00e9colt\u00e9e'
            + (ch.parcelles>1?'s':'')) : ''},
    /* ⚠️ Un document imprime se relit des annees plus tard, sans l'ecran a cote :
       il doit dire lui-meme si le chiffre est mesure ou estime. */
    {v:d.rdtMoyen!=null ? ((d.rdtMoyenEst?'\u2248 ':'')+_bcF(d.rdtMoyen,1)) : '\u2014', u:'hL/ha', l:'rendement moyen',
     /* ⚠️ Un document imprime se relit sans l'ecran a cote : il doit porter
        lui-meme la reserve, et nommer l'information qui manque. */
     s:d.rdtMoyen==null ? 'surface r\u00e9colt\u00e9e non renseign\u00e9e'
       : (d.rdtMoyenAx>0 ? (d.rdtMoyenAx+' surface'+(d.rdtMoyenAx>1?'s':'')+' vendue'+(d.rdtMoyenAx>1?'s':'')+' non renseign\u00e9e'+(d.rdtMoyenAx>1?'s':''))
       : (d.rdtMoyenSs>0 ? (d.rdtMoyenSs+' parcelle'+(d.rdtMoyenSs>1?'s':'')+' sans surface, \u00e9cart\u00e9e'+(d.rdtMoyenSs>1?'s':''))
       : (d.rdtMoyenEst ? 'estim\u00e9 \u2014 tout n\u2019est pas d\u00e9cuv\u00e9'
                        : 'sur '+_bcF(d.rdtMoyenHa,2)+' ha r\u00e9ellement r\u00e9colt\u00e9s')))},
    {v:_bcF(d.chaiHl,0), u:'hL', l:'au chai',
     s:d.chaiFuts + ' f\u00fbt' + (d.chaiFuts>1?'s':'') + ' en \u00e9levage'}
  ];
  h += '<div class="bc-axes">Deux axes cohabitent dans ce document, et c\u2019est voulu. '
    + '<b>La vigne, la protection et le parc \u00e0 f\u00fbts</b> portent sur la campagne '
    + c + '\u2013' + (c+1) + ' : ils d\u00e9crivent une ann\u00e9e de travail. '
    + '<b>La r\u00e9colte, le flux et le chai</b> portent sur le mill\u00e9sime <b>' + d.millesime
    + '</b> : ils d\u00e9crivent un vin. Les m\u00e9langer produirait des chiffres qui ne veulent rien dire.</div>';
  h += '<div class="bc-tiles">' + tiles.map(function(t){
    return '<div class="bc-tile"><div class="bc-tile-v">' + t.v + '<small>' + t.u + '</small></div>'
      + '<div class="bc-tile-l">' + t.l + '</div>'
      + (t.s ? '<div class="bc-tile-s">' + t.s + '</div>' : '') + '</div>';
  }).join('') + '</div>';

  /* ── la vigne ── */
  h += _bcSec('feuille', 'Les travaux de la vigne',
        d.vigne.lignes.length ? (d.vigne.validations + ' validations') : '');
  if(!d.vigne.lignes.length){
    h += '<div class="bc-vide">Aucun travail valid\u00e9 sur cette campagne.</div>';
  } else {
    h += '<div class="bc-intro">' + d.vigne.jours + ' journ\u00e9es de travail not\u00e9es, '
      + d.vigne.gens + ' personne' + (d.vigne.gens>1?'s':'') + ' au total. '
      + 'La <b>surface travaill\u00e9e</b> additionne les passages : une parcelle relev\u00e9e trois fois '
      + 'y compte trois fois. C\u2019est l\u2019effort, pas l\u2019\u00e9tendue.</div>';
    h += '<table class="bc-t"><thead><tr><th>Travail</th><th class="n">Parcelles</th>'
      + '<th class="n">Surface travaill\u00e9e</th><th class="n">\u00c9quipe</th>'
      + '<th>P\u00e9riode</th></tr></thead><tbody>';
    d.vigne.lignes.forEach(function(l){
      h += '<tr><td class="b">' + e(l.tache) + '</td>'
        + '<td class="n">' + l.parcelles + '</td>'
        + '<td class="n">' + _bcF(l.surface,2) + ' ha</td>'
        + '<td class="n">' + l.gens + '</td>'
        + '<td class="p">' + _bcMois(l.d0) + (_bcMois(l.d0)!==_bcMois(l.d1)
            ? ' \u2192 ' + _bcMois(l.d1) : '') + '</td></tr>';
    });
    h += '</tbody><tfoot><tr><td class="b">Total</td><td class="n">\u2014</td>'
      + '<td class="n">' + _bcF(d.vigne.surface,2) + ' ha</td>'
      + '<td class="n">' + d.vigne.gens + '</td><td></td></tr></tfoot></table>';
  }

  /* ── la récolte ── */
  h += _bcSec('raisin', 'La r\u00e9colte', ch && ch.kg ? _bcInt(ch.kg) + ' kg' : '');
  // _mlChaine donne des TOTAUX, pas le detail par parcelle : le bilan lit donc la
  // source, filtree sur le millesime. Projection differente de la meme donnee,
  // pas une copie du calcul.
  var recs = ((ctx.CAVE_VENDANGE && ctx.CAVE_VENDANGE.recoltes) || []).filter(function(r){
    return r && String(r.date||'').slice(0,4) === String(c);
  });
  if(!recs.length){
    h += '<div class="bc-vide">Aucune r\u00e9colte saisie au Cuvier sur cette campagne.</div>';
  } else {
    var parP = {};
    recs.forEach(function(r){
      var k = r.parcelle || '\u2014';
      if(!parP[k]) parP[k] = {nom:k, caisses:0, kg:0, vendu:false, d0:r.date, d1:r.date};
      // ⚠️ DÉFAUT CUV-5 : `window._recKg` n'a JAMAIS été exporté. Le garde
      //   `typeof … === 'function'` était donc toujours faux, et le bilan de
      //   campagne pesait toutes les caisses à 25 kg EN DUR — en ignorant
      //   `parts[]`, donc les caisses de 12 kg d'un négociant comme toute
      //   correction de poids. Un repli défensif qui ne se replie jamais ne
      //   protège rien : il cache. `_recKg` vit dans cuvier.js depuis CUV-DEC
      //   (§164) : il s'appelle directement, par la frontière.
      var kg = _recKg(r);
      parP[k].caisses += (r.nb_caisses||0);
      parP[k].kg += kg;
      if(r.client) parP[k].vendu = true;
      if(r.date < parP[k].d0) parP[k].d0 = r.date;
      if(r.date > parP[k].d1) parP[k].d1 = r.date;
    });
    var surf = {};
    (ctx.PARCELLES||[]).forEach(function(p){ if(p && p.nom) surf[p.nom] = _bcNum(p.surface); });
    var rows = Object.keys(parP).map(function(k){
      var o = parP[k], s = surf[k] || 0;
      o.ha = s; o.hlHa = s > 0 ? (o.kg / s / kgHl) : null;
      return o;
    }).sort(function(a2,b2){ return (b2.hlHa||0) - (a2.hlHa||0); });
    h += '<table class="bc-t"><thead><tr><th>Parcelle</th><th class="n">Surface</th>'
      + '<th class="n">Caisses</th><th class="n">Kilos</th><th class="n">hL/ha</th>'
      + '<th>Date</th></tr></thead><tbody>';
    rows.forEach(function(o){
      h += '<tr><td class="b">' + e(o.nom)
        + (o.vendu ? '<span class="bc-tag">vendu</span>' : '') + '</td>'
        + '<td class="n">' + (o.ha ? _bcF(o.ha,2) + ' ha' : '\u2014') + '</td>'
        + '<td class="n">' + _bcInt(o.caisses) + '</td>'
        + '<td class="n">' + _bcInt(o.kg) + '</td>'
        + '<td class="n s">' + (o.hlHa!=null ? _bcF(o.hlHa,1) : '\u2014') + '</td>'
        + '<td class="p">' + _bcDate(o.d0) + '</td></tr>';
    });
    h += '</tbody><tfoot><tr><td class="b">Total</td>'
      + '<td class="n">' + _bcF(ch.ha,2) + ' ha</td>'
      + '<td class="n">' + _bcInt(rows.reduce(function(s,o){ return s+o.caisses; },0)) + '</td>'
      + '<td class="n">' + _bcInt(ch.kg) + '</td>'
      + '<td class="n s">' + (d.rdtMoyen!=null ? (((d.rdtMoyenEst||d.rdtMoyenAx>0)?'\u2248 ':'')+_bcF(d.rdtMoyen,1)) : '\u2014') + '</td>'
      + '<td></td></tr></tfoot></table>';
    if(ch.kgVendu > 0){
      h += '<div class="bc-note">Dont <b>' + _bcInt(ch.kgVendu) + ' kg</b> de raisin vendu, '
        + 'sortis du circuit avant cuvaison.</div>';
    }
  }

  /* ── de la benne à la bouteille ── */
  h += '<div class="bc-brk"></div>';
  h += _bcSec('verre', 'De la benne \u00e0 la bouteille', '');
  if(!ch || !ch.kg){
    h += '<div class="bc-vide">Pas de suivi de cuverie sur cette campagne.</div>';
  } else {
    var et = [
      {l:'Rentr\u00e9 de la vigne', v:ch.kg/kgHl, s:_bcInt(ch.kg) + ' kg'},
      {l:'Encuv\u00e9', v:(ch.kg-ch.kgVendu)/kgHl,
       s:ch.kgVendu ? ('hors ' + _bcInt(ch.kgVendu) + ' kg vendus') : 'tout le raisin'},
      {l:_mlEleveLab(ch), v:ch.hlFut, s:_mlEleveSub(ch)},
      {l:'En bouteille', v:d.btlTotal ? d.btlTotal*0.75/100 : 0,
       s:d.btlTotal ? (_bcInt(d.btlTotal) + ' cols') : 'pas encore'}
    ].filter(function(x,i){ return i === 0 || x.v > 0; });
    var max = Math.max(et[0].v, 1);
    h += '<div class="bc-flux">';
    et.forEach(function(x,i){
      var w = Math.max(6, Math.round(x.v/max*100));
      var perte = (i > 0 && et[i-1].v > 0) ? Math.round((1 - x.v/et[i-1].v)*100) : null;
      if(perte != null && perte > 0){
        h += '<div class="bc-perte">\u2212' + perte + ' %</div>';
      }
      h += '<div class="bc-fl"><div class="bc-fl-bar" style="width:' + w + '%"></div>'
        + '<div class="bc-fl-txt"><b>' + x.l + '</b><span>' + x.s + '</span></div>'
        + '<div class="bc-fl-v">' + _bcF(x.v,1) + '<small>hL</small></div></div>';
    });
    h += '</div>';
    if(ch.hlCuve > 0){
      h += '<div class="bc-note">Au moment de l\u2019\u00e9dition, <b>' + _bcF(ch.hlCuve,0)
        + ' hL</b> fermentent encore : la perte totale se lira quand tout sera d\u00e9cuv\u00e9.</div>';
    }
  }

  /* ── le chai ── */
  h += _bcSec('barrique', 'Le chai \u2014 mill\u00e9sime ' + d.millesime,
        d.chaiFuts ? (d.chaiFuts + ' f\u00fbts') : '');
  if(d.chaiTous > d.chai.length){
    h += '<div class="bc-note">Ce tableau ne montre que le <b>' + d.millesime + '</b>. '
      + 'Le chai compte <b>' + d.chaiTous + '</b> cuv\u00e9es en \u00e9levage au total, tous mill\u00e9simes '
      + 'confondus \u2014 chacun a son propre bilan.</div>';
  }
  if(!d.chai.length){
    h += '<div class="bc-vide">Aucune cuv\u00e9e du ' + d.millesime + ' en \u00e9levage.</div>';
  } else {
    h += '<table class="bc-t"><thead><tr><th>Cuv\u00e9e</th><th class="n">Mill\u00e9sime</th>'
      + '<th class="n">F\u00fbts</th><th class="n">Volume</th></tr></thead><tbody>';
    d.chai.forEach(function(x){
      h += '<tr><td class="b">' + e(x.nom) + '</td><td class="n">' + (x.millesime||'\u2014') + '</td>'
        + '<td class="n">' + x.futs + '</td><td class="n s">' + _bcF(x.hl,1) + ' hL</td></tr>';
    });
    h += '</tbody><tfoot><tr><td class="b">Total</td><td class="n"></td>'
      + '<td class="n">' + d.chaiFuts + '</td>'
      + '<td class="n s">' + _bcF(d.chaiHl,1) + ' hL</td></tr></tfoot></table>';
  }
  if(d.bouteilles.length){
    h += '<div class="bc-sub">Mises en bouteille de la campagne</div><table class="bc-t"><tbody>';
    d.bouteilles.forEach(function(b){
      h += '<tr><td class="b">' + e(b.nom) + ' ' + (b.millesime||'') + '</td>'
        + '<td class="p">' + _bcDate(b.date) + '</td>'
        + '<td class="n s">' + _bcInt(b.nb) + ' cols</td></tr>';
    });
    h += '</tbody></table>';
  }

  /* ── le parc à fûts ── */
  if(d.parc){
    var mv = d.parc.mouv || {entrees:0, sorties:0};
    h += _bcSec('barrique', 'Le parc \u00e0 f\u00fbts', d.parc.parc + ' f\u00fbts');
    h += '<div class="bc-kv">'
      + '<span><b>' + d.parc.parc + '</b> f\u00fbts au domaine</span>'
      + '<span><b>' + d.parc.occupes + '</b> en vin</span>'
      + '<span><b>' + d.parc.libres + '</b> libres</span>'
      + (d.parc.aReformer ? '<span class="al"><b>' + d.parc.aReformer
          + '</b> au-del\u00e0 de ' + d.parc.vie + ' vins</span>' : '')
      + '</div>';
    if(mv.entrees || mv.sorties){
      h += '<div class="bc-note">Sur l\u2019ann\u00e9e civile : <b>+' + mv.entrees + '</b> entr\u00e9s, '
        + '<b>\u2212' + mv.sorties + '</b> sortis. Le d\u00e9tail est au registre du parc, dans La R\u00e9serve.</div>';
    }
  }

  /* ── la protection ── */
  h += _bcSec('eprouvette', 'La protection du vignoble',
        d.phyto.n ? (d.phyto.n + ' interventions') : '');
  if(!d.phyto.n){
    h += '<div class="bc-vide">Aucun traitement enregistr\u00e9 sur cette campagne.</div>';
  } else {
    h += '<div class="bc-kv">'
      + '<span><b>' + d.phyto.n + '</b> lignes de registre</span>'
      + '<span><b>' + d.phyto.jours + '</b> journ\u00e9es d\u2019application</span>'
      + '<span><b>' + d.phyto.parcelles + '</b> parcelles trait\u00e9es</span>'
      + '<span><b>' + d.phyto.maxPassages + '</b> passages au maximum sur une parcelle</span>'
      + '</div>';
    if(d.phyto.topProduits.length){
      h += '<div class="bc-note">Produits les plus employ\u00e9s : '
        + d.phyto.topProduits.map(function(p){ return e(p.nom) + ' (' + p.n + ')'; }).join(', ')
        + '. Le registre complet et l\u2019export r\u00e9glementaire sont dans le module Phyto.</div>';
    }
  }

  /* ── les manipulations ── */
  if(d.manip && d.manip.lignes.length){
    h += '<div class="bc-note bc-lien">' + _mvIconInline('liste',16) + ' <b>' + d.manip.lignes.length
      + ' manipulations \u0153nologiques</b> sur le mill\u00e9sime ' + d.millesime
      + '. Le registre d\u00e9taill\u00e9 s\u2019\u00e9dite depuis Le Cuvier \u203a R\u00e9glages.</div>';
  }

  /* ── pied ── */
  h += '<div class="bc-pied">'
    + '<p><b>Ce que ce document est.</b> Un bilan interne de fin de campagne, construit \u00e0 partir '
    + 'de ce que vous avez saisi tout au long de l\u2019ann\u00e9e. Il sert \u00e0 se souvenir, comparer et '
    + 'd\u00e9cider. <b>Ce n\u2019est pas une d\u00e9claration</b> et il n\u2019en tient lieu pour aucune '
    + 'administration.</p>'
    + '<p><b>Ce qu\u2019il ne contient pas.</b> Ni heures de travail, ni co\u00fbts : ils vivent dans '
    + 'Pilotage, o\u00f9 ils sont calcul\u00e9s avec les taux et les mod\u00e8les de chacun. '
    + 'Le rendement moyen se rapporte aux seules parcelles r\u00e9colt\u00e9es.</p>'
    + '<div class="bc-sig">G\u00e9n\u00e9r\u00e9 par Ma Vigne \u00b7 ' + e(DOM.nom) + '</div></div>';
  return h;
}

function _bcSec(ico, titre, droite){
  return '<div class="bc-sec"><span class="bc-sec-i">' + _mvIconInline(ico,16) + '</span>' + titre
    + (droite ? '<span class="bc-sec-n">' + droite + '</span>' : '') + '</div>';
}

var BC_CSS = ''
+ '@page{size:A4 portrait;margin:14mm 12mm}'
+ '.bc-doc{font-family:Outfit,system-ui,sans-serif;color:#2A241C;font-size:var(--pt-micro,11px);line-height:1.45;'
+ 'background:#fff;max-width:186mm;margin:0 auto;padding:0 0 20px}'
+ '.bc-hero{background:linear-gradient(160deg,#14110D,#1C1813);color:#F0E2C8;padding:22px 24px 18px;'
+ 'border-radius:12px;position:relative;overflow:hidden;margin-bottom:16px}'
+ '.bc-hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;'
+ 'background:linear-gradient(90deg,#8A5A38 0%,#C2871E 50%,#3D6B27 100%)}'
+ '.bc-hero-k{font-size:var(--pt-nano,9.5px);letter-spacing:.2em;text-transform:uppercase;color:#A99C82}'
+ '.bc-hero-t{font-family:"Cormorant Garamond",Georgia,serif;font-size:var(--pt-xxl,31px);font-weight:700;'
+ 'line-height:1.05;margin-top:5px}'
+ '.bc-hero-y{font-family:"Cormorant Garamond",Georgia,serif;font-size:19px;color:#C2A14D;'
+ 'font-weight:600;margin-top:1px;letter-spacing:.04em}'
+ '.bc-hero-c{display:flex;gap:16px;flex-wrap:wrap;margin-top:13px;padding-top:11px;'
+ 'border-top:1px solid rgba(216,188,114,.2);font-size:var(--pt-lbl,10.5px);color:#C8BCA6}'
+ '.bc-axes{font-size:10px;color:#6F675C;line-height:1.55;background:#F3EADF;'
+ 'border:1px solid rgba(138,90,56,.22);border-radius:9px;padding:9px 12px;margin-bottom:10px}'
+ '.bc-axes b{color:#8A5A38}'
+ '.bc-tiles{display:flex;gap:9px;margin-bottom:6px}'
+ '.bc-tile{flex:1;border:1px solid #E4DAC8;border-radius:11px;padding:12px 12px 11px;background:#FBFAF6}'
+ '.bc-tile-v{font-family:"Cormorant Garamond",Georgia,serif;font-size:var(--pt-xl,27px);font-weight:700;'
+ 'color:#8A5A38;line-height:1}'
+ '.bc-tile-v small{font-size:12px;margin-left:3px;color:#8B8175;font-family:Outfit,sans-serif;font-weight:400}'
+ '.bc-tile-l{font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:#8B8175;margin-top:5px}'
+ '.bc-tile-s{font-size:var(--pt-nano,9.5px);color:#A09684;margin-top:3px;line-height:1.35}'
+ '.bc-sec{display:flex;align-items:center;gap:7px;font-size:var(--pt-base,14px);font-weight:600;color:#8A5A38;'
+ 'margin:20px 0 8px;padding-bottom:5px;border-bottom:2px solid rgba(194,161,77,.35)}'
+ '.bc-sec-i{font-size:var(--pt-base,14px)}'
+ '.bc-sec-n{margin-left:auto;font-size:var(--pt-micro,11px);font-weight:600;color:#8B8175;background:#F3EADF;'
+ 'border-radius:20px;padding:2px 10px}'
+ '.bc-brk{page-break-before:always;height:0}'
+ '.bc-intro{font-size:var(--pt-lbl,10.5px);color:#6F675C;line-height:1.55;margin-bottom:8px}'
+ '.bc-intro b{color:#4A4A3A}'
+ '.bc-t{width:100%;border-collapse:collapse;font-size:var(--pt-lbl,10.5px);margin-bottom:4px}'
+ '.bc-t th{text-align:left;font-size:9px;letter-spacing:.07em;text-transform:uppercase;color:#8B8175;'
+ 'font-weight:600;padding:5px 7px;border-bottom:1px solid #E4DAC8}'
+ '.bc-t th.n{text-align:right}'
+ '.bc-t td{padding:6px 7px;border-bottom:1px solid #F0EAE0;vertical-align:top}'
+ '.bc-t td.n{text-align:right;white-space:nowrap}'
+ '.bc-t td.s{font-family:"Cormorant Garamond",Georgia,serif;font-size:var(--pt-base,14px);font-weight:700;color:#8A5A38}'
+ '.bc-t td.b{font-weight:600;color:#2A241C}'
+ '.bc-t td.p{color:#8B8175;white-space:nowrap}'
+ '.bc-t tfoot td{border-top:1.5px solid #C2A14D;border-bottom:0;font-weight:700;'
+ 'color:#8A5A38;padding-top:7px}'
+ '.bc-tag{font-size:8.5px;font-weight:600;background:#ECE6DA;color:#6F675C;border-radius:5px;'
+ 'padding:1px 6px;margin-left:6px;vertical-align:1px}'
+ '.bc-flux{margin:4px 0 6px}'
+ '.bc-fl{position:relative;height:38px;margin-bottom:2px;display:flex;align-items:center}'
+ '.bc-fl-bar{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#C2A14D,#8A5A38);'
+ 'border-radius:8px;opacity:.9}'
+ '.bc-fl-txt{position:relative;padding-left:12px;color:#FBF6EC;z-index:1;line-height:1.25}'
+ '.bc-fl-txt b{display:block;font-size:12px}'
+ '.bc-fl-txt span{font-size:var(--pt-nano,9.5px);opacity:.8}'
+ '.bc-fl-v{margin-left:auto;padding-left:12px;font-family:"Cormorant Garamond",Georgia,serif;'
+ 'font-size:var(--pt-sm,17px);font-weight:700;color:#2A241C;position:relative;z-index:1;white-space:nowrap}'
+ '.bc-fl-v small{font-size:var(--pt-nano,9.5px);font-family:Outfit,sans-serif;font-weight:400;color:#8B8175;margin-left:2px}'
+ '.bc-perte{font-size:var(--pt-nano,9.5px);color:#7A1020;font-weight:600;padding:2px 0 2px 14px}'
+ '.bc-kv{display:flex;gap:18px;flex-wrap:wrap;font-size:var(--pt-micro,11px);color:#4A4A3A;'
+ 'background:#FBFAF6;border:1px solid #E4DAC8;border-radius:11px;padding:11px 13px;margin-bottom:6px}'
+ '.bc-kv b{font-family:"Cormorant Garamond",Georgia,serif;font-size:var(--pt-sm,17px);color:#8A5A38;'
+ 'font-weight:700;margin-right:3px}'
+ '.bc-kv .al b{color:#A0291E}'
+ '.bc-note{font-size:var(--pt-lbl,10.5px);color:#6F675C;line-height:1.55;background:#FAF3E0;'
+ 'border:1px solid rgba(194,161,77,.3);border-radius:9px;padding:9px 12px;margin:6px 0 4px}'
+ '.bc-note b{color:#8A5A38}'
+ '.bc-lien{background:#F3EADF;border-color:rgba(138,90,56,.22)}'
+ '.bc-sub{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#8B8175;'
+ 'font-weight:600;margin:14px 0 5px}'
+ '.bc-vide{text-align:center;color:#8B8175;padding:20px;font-size:var(--pt-micro,11px);background:#FBFAF6;'
+ 'border:1px dashed #E4DAC8;border-radius:10px}'
+ '.bc-pied{margin-top:22px;padding-top:13px;border-top:1px solid #E4DAC8;font-size:10px;'
+ 'color:#6F675C;line-height:1.55}'
+ '.bc-pied p{margin:0 0 7px}.bc-pied b{color:#4A4A3A}'
+ '.bc-sig{margin-top:10px;text-align:center;font-size:var(--pt-nano,9.5px);color:#A09684}'
+ '@media print{.bc-doc{max-width:none;padding:0}.bc-sec{page-break-after:avoid}'
+ '.bc-t tr{page-break-inside:avoid}.bc-tiles,.bc-flux,.bc-kv{page-break-inside:avoid}}';

/* ── Le contexte : les globales lues avec repli ────────────────────
   TRAITEMENTS et JOURNAL vivent hors de cave.js. Un domaine sans registre
   phyto doit voir « aucun traitement », pas un ecran casse. */
function _bcCtx(){
  return {
    JOURNAL:      window.JOURNAL      || [],
    PARCELLES:    window.PARCELLES    || [],
    TRAITEMENTS:  window.TRAITEMENTS  || [],
    CAVE_VENDANGE: (typeof CAVE_VENDANGE !== 'undefined') ? CAVE_VENDANGE : {},
    CAVE_ELEVAGE:  (typeof CAVE_ELEVAGE  !== 'undefined') ? CAVE_ELEVAGE  : {},
    INTRANTS:     window.INTRANTS     || {}
  };
}

/* ── L'export : Blob -> nouvel onglet -> impression ──────────────── */
function _bcExport(c, mil){
  var ctx = _bcCtx();
  var DOM = {
    nom: (window.DOMAINE_NOM || (window.CONFIG && window.CONFIG.domaine) || 'Mon domaine'),
    commune: (window.CONFIG && window.CONFIG.commune) || ''
  };
  var an = (c != null) ? c : _bcCampagne(_mvToday());
  var body;
  try{ body = _bcDoc(ctx, DOM, an, (mil!=null?mil:an)); }
  catch(err){
    window.logError && window.logError({level:'error', cat:'cave', msg:'bilan de campagne'});
    showToast('Bilan impossible \u00e0 produire', '#C0392B'); return;
  }
  var html = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
    + '<title>Bilan de campagne ' + an + '\u2013' + (an+1)
    + ((mil!=null && String(mil)!==String(an)) ? ' \u00b7 mill\u00e9sime ' + mil : '')
    + ' \u2014 ' + _bcEsc(DOM.nom) + '</title>'
    + '<link rel="stylesheet" href="/fonts/fonts.css">'
    + '<style>body{margin:0;background:#fff}' + BC_CSS + '</style></head>'
    + '<body><div class="bc-doc">' + body + '</div>'
    + '<scr'+'ipt>window.onload=function(){setTimeout(function(){window.print();},500);};</scr'+'ipt>'
    + '</body></html>';
  try{
    var blob = new Blob([html], {type:'text/html'});
    var w = window.open(URL.createObjectURL(blob), '_blank');
    if(!w) showToast('Autorise les pop-ups pour imprimer', '#B85A1A');
    else showToast('Bilan ' + an + '\u2013' + (an+1), '#3D6B27');
  }catch(err){ showToast('Export impossible', '#C0392B'); }
}
function _bcEsc(s){ return String(s==null?'':s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* Choix de la campagne quand il y en a plusieurs, sinon export direct.
   Expression assignee a window et non fonction declaree : ses SEULS appelants vivent
   dans un autre fichier (onclick d'index.html, bouton de pilotage.js), et le cliquet
   C15 raisonne fichier par fichier. */
window._bcExportChoix = function(){
  var cs = _bcCampagnes(_bcCtx());
  if(!cs.length){ showToast('Aucune campagne \u00e0 r\u00e9sumer', '#B85A1A'); return; }
  if(cs.length === 1 || typeof window.openPrompt !== 'function'){ _bcChoixMil(cs[0]); return; }
  window.openPrompt({
    titre:'Quelle campagne ?', unite:'', icone:'livre', type:'nombre',
    sub:'Campagnes disponibles : ' + cs.map(function(x){ return x + '\u2013' + (x+1); }).join(', ')
       + '. Indiquez l\u2019ann\u00e9e de d\u00e9but.',
    valeur:String(cs[0]), placeholder:String(cs[0]), btnLabel:'\u00c9diter le bilan',
    cb:function(v){
      var n = parseInt(String(v).replace(/\D/g,''), 10);
      if(cs.indexOf(n) < 0){ showToast('Rien \u00e0 r\u00e9sumer sur ' + n, '#B85A1A'); return; }
      _bcChoixMil(n);
    }
  });
}
/* Second temps : quel millesime pour les sections cave ? On ne le demande
   que si plusieurs sont reellement en cave — ne jamais poser une question
   dont la reponse est unique. */
function _bcChoixMil(c){
  var ms = (typeof window._caveMilsEnCave === 'function')
    ? window._caveMilsEnCave().filter(function(m){ return m !== '?'; }) : [];
  if(ms.length < 2 || typeof window.openPrompt !== 'function'){ _bcExport(c, c); return; }
  window.openPrompt({
    titre:'Quel mill\u00e9sime ?', unite:'', icone:'verre', type:'nombre',
    sub:'La vigne, la protection et le parc porteront sur la campagne ' + c + '\u2013' + (c+1)
       + '. La r\u00e9colte, le flux et le chai porteront sur le mill\u00e9sime choisi. '
       + 'En cave : ' + ms.join(', ') + '.',
    valeur:String(c), placeholder:String(c), btnLabel:'\u00c9diter le bilan',
    cb:function(v){
      var m = parseInt(String(v).replace(/\D/g,''), 10);
      _bcExport(c, isFinite(m) ? m : c);
    }
  });
}
window._bcExport       = _bcExport;
window._bcCampagnes    = _bcCampagnes;
window._bcData         = _bcData;
window._bcDoc          = _bcDoc;

/* ══════════════════════════════════════════════════════════════════════════
   MA VIGNE — LES DEUX DOCUMENTS DU CUVIER
   ══════════════════════════════════════════════════════════════════════════
   Le Cuvier saisissait deux choses que rien ne savait imprimer :
     · le CONTROLE DE MATURITE  (CAVE_VENDANGE.analyses)        — avant la vendange
     · les MESURES DE FERMENTATION (cuves_vinif[].mesures_fa)   — pendant

   Ce n'est pas un oubli du registre des manipulations : il les ecarte
   VOLONTAIREMENT (voir son en-tete — « densite, analyses n'en font pas partie :
   l'inclure noierait le document sous des dizaines de lignes »). Un controle
   regarde l'enrichissement et le sulfitage ; le vigneron, lui, a besoin de ses
   courbes. Deux publics, deux documents.

   ⚠️ AUCUN CALCUL NEUF ICI. Tout vient des moteurs deja a l'ecran :
     _matSynth   moyennes ponderees par surface, fraicheur, parcelles rentrees
     _matClasse  derniere valeur + vitesse, dans l'ordre de maturite
     _matSuc / _anaSpd     conversion sucre <-> degre, coefficient FIGE a la saisie
     _vendD20 / _vendSucre / _vendFaPct   densite corrigee, sucre restant, avancement
     _rmDetail   le detail lisible d'une operation de cuve
   Deux definitions du meme chiffre finissent toujours par diverger : le
   document LIT l'ecran, il ne le refait pas.

   ⚠️ Ces documents ne touchent AUCUN etat d'ecran. En particulier ils ne
   changent pas `_matUn` (l'unite d'affichage du Cuvier) : ils calculent la
   leur, localement, et la laissent la.
   ══════════════════════════════════════════════════════════════════════════ */

var MV_CUVDOC_CSS = ''
  + '.cd-kpis{display:flex;gap:16px;flex-wrap:wrap;background:#FAF6EC;border:1px solid #E8DCC0;'
    + 'border-radius:7px;padding:9px 13px;margin-bottom:13px}'
  + '.cd-k{min-width:96px}'
  + '.cd-k b{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.6px;color:#8B6020;margin-bottom:2px}'
  + '.cd-k span{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:var(--pt-md,20px);font-weight:700;color:#2D1B09;line-height:1.05}'
  + '.cd-k span small{font-family:\'Outfit\',sans-serif;font-size:9px;font-weight:600;color:#7A6A4A}'
  + '.cd-k i{display:block;font-style:normal;font-size:8px;color:#7A7263;margin-top:2px;line-height:1.4}'
  + 'h2{font-size:var(--pt-micro,11px);color:#2D1B09;margin:15px 0 6px;text-transform:uppercase;letter-spacing:.9px}'
  + 'h3{font-size:var(--pt-txt,12.5px);color:#2D1B09;margin:0 0 3px;font-family:\'Cormorant Garamond\',Georgia,serif;font-weight:700}'
  + 'table{width:100%;border-collapse:collapse;font-size:var(--pt-nano,9.5px);margin-bottom:4px}'
  + 'th{text-align:left;padding:5px 6px;background:#2D1B09;color:#F3E7CE;font-size:8px;'
    + 'text-transform:uppercase;letter-spacing:.4px;font-weight:700}'
  + 'td{border-bottom:1px solid #EDE7DA;padding:4px 6px;vertical-align:top}'
  + 'td.n,th.n{text-align:right;white-space:nowrap}'
  + 'tr:nth-child(even) td{background:#FBFAF6}'
  + 'tr.tot td{background:#F4EEE2;font-weight:700;border-top:1.5px solid #C8A060;border-bottom:none}'
  + '.cd-conv{font-style:italic;color:#7A6A4A}'
  + '.cd-note{font-size:8.5px;color:#7A7263;margin:2px 0 11px;line-height:1.5}'
  + '.cd-vide{font-size:var(--pt-nano,9.5px);color:#7A7263;margin:0 0 11px}'
  + '.cd-cuve{margin-bottom:16px;padding-bottom:4px;border-top:1.5px solid #C8A060;padding-top:9px}'
  + '.cd-idr{display:flex;flex-wrap:wrap;gap:5px 14px;margin:0 0 7px}'
  + '.cd-idr em{font-style:normal;font-size:9px;color:#7A7263}'
  + '.cd-idr em b{font-weight:700;color:#2D1B09}'
  + '.cd-tag{display:inline-block;font-size:8px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;'
    + 'padding:1.5px 6px;border-radius:9px;background:#F0E6D2;color:#7B4A1A;margin-left:6px}'
  /* ── Le graphe de fermentation, sur le papier ─────────────────────────────
     Un document s'ouvre dans SA fenetre : il ne charge jamais styles.css, donc
     AUCUNE variable de theme ne l'atteint (§59). Or le trace de l'ecran peint
     en var(--terre), var(--orange), … — sans ces declarations, les courbes
     sortiraient TOUTES NOIRES, l'une sur l'autre, illisibles.
     ⚠️ Valeurs de MODE CLAIR, toujours : une page s'imprime sur du papier
     blanc, meme quand l'ecran est en sombre.
     ⚠️ Les SEPT roles de MV_GRAPH_COL sont poses, pas les six utilises
     aujourd'hui : le jour ou le trace de l'ecran en prend un de plus, le
     papier n'a pas a attendre un lot pour le peindre.
     ⚠️ Deux roles prennent l'encre du DOCUMENT et non celle de l'ecran : la
     grille (#E4DCCB, le filet du pied de page) et l'or (#C8A060, celui des
     filets du cahier). Un graphe pose sur cette feuille est de cette feuille.
     Contrastes sur blanc, calcules et non supposes : texte 4,80 · orange 4,65
     · vert 6,20 · terre 5,83 — les quatre qui ECRIVENT passent 4,5. L'or et
     la grille TRACENT, ils n'ecrivent jamais (charte MV_GRAPH). */
  + ':root{--terre:#8A5A38;--or:#C8A060;--vert-med:#3D6B27;--rouge:#A0291E;'
    + '--orange:#B85A1A;--gris-clair:#E4DCCB;--texte-doux:#7A7263}'
  /* Le comparatif : deux variables de plus, hors MV_GRAPH_COL — les six
     couleurs de courbe s'y puisent (§86b : ce que le document invoque, il le
     declare). */
  + ':root{--bleu:#1A4A7A;--phyto:#5B2D8E}'
  + '.cmp-gr{margin:2px 0 10px}'
  + '.cmp-gr svg{display:block;max-width:100%;height:auto}'
  + '.cmp-note{font-size:8.5px;color:#7A7263;line-height:1.5;margin-top:5px}'
  + '.cmp-note b{color:#2D1B09}'
  + '.cmp-tb{margin-bottom:12px}'
  + '.cmp-tb td i{font-style:normal;color:#8A8272}'
  + '.cd-gr{margin:1px 0 9px}'
  + '.cd-gr svg{display:block;max-width:100%;height:auto}'
  + '.mvfm-lg{display:flex;gap:6px 16px;flex-wrap:wrap;font-size:8.5px;color:#7A7263;margin-top:5px}'
  + '.mvfm-tap{display:none}'   /* CUVGR-3 : « touchez la courbe » ne se lit pas sur papier */
  + '.mvfm-lg span{display:inline-flex;align-items:center;gap:5px}'
  + '.mvfm-lg i.l{width:14px;height:3px;border-radius:2px}'
  + '.mvfm-lg i.d{width:14px;height:0;border-top:2px dashed}'
  /* La liste des reperes RESTE : c'est elle qui rend le trait lisible — une
     remontee de la courbe ne s'explique que par une chaptalisation datee. Mais
     elle passe en LIGNE et non en colonne : empilees, huit operations
     prendraient sur le papier la place d'un tableau. */
  + '.mvfm-ops{display:flex;flex-wrap:wrap;gap:3px 14px;margin-top:6px}'
  + '.mvfm-op{display:inline-flex;align-items:baseline;gap:5px;font-size:8.5px;color:#5A5244}'
  + '.mvfm-op i{width:5px;height:5px;border-radius:50%;background:#C8A060;flex:none}'
  + '.mvfm-op b{font-weight:700;color:#2D1B09}'
  + '.mvfm-ets{display:flex;flex-wrap:wrap;gap:3px 14px;margin-top:5px}'
  + '.mvfm-et{display:inline-flex;align-items:center;gap:5px;font-size:8.5px;color:#5A5244}'
  + '.mvfm-et i{width:11px;height:0;border-top:2px dashed #7A7263;flex:none}'
  + '.mvfm-et b{font-weight:700;color:#2D1B09}'
  + '.mvfm-note{font-size:8.5px;color:#7A7263;margin-top:5px;line-height:1.5}'
  + '.mvfm-fin{font-size:9px;color:#5A5244;margin-top:5px;padding-top:5px;border-top:1px solid #EDE7DA}'
  + '.mvfm-fin b{color:#8A5A38}';

/* ── Le cahier de cuverie ──────────────────────────────────────────────────
   Une page par cuve : ce qui y est entre, la cinetique jour par jour, les
   operations, et ou le vin est parti. C'est le cahier qu'on tenait au mur du
   cuvier, et qu'on recopiait le soir. */

/* L'annee d'une cuve. La date d'entree fait foi ; a defaut on prend le premier
   releve, puis le decuvage — une cuve sans aucune date ne se rattache a rien
   et ne doit pas atterrir dans l'annee courante par defaut. */
function _cuvAn(c){
  if(!c) return '';
  if(c.date_entree) return String(c.date_entree).slice(0, 4);
  var m = (c.mesures_fa || [])[0];
  if(m && m.date) return String(m.date).slice(0, 4);
  if(c.decuvage && c.decuvage.date) return String(c.decuvage.date).slice(0, 4);
  return '';
}
function _cuvAnnees(){
  var s = {};
  (CAVE_VENDANGE.cuves_vinif || []).forEach(function(c){ var a = _cuvAn(c); if(a) s[a] = 1; });
  return Object.keys(s).sort().reverse();
}
function _cuvErLbl(k){
  return k === 'total' ? 'Éraflage total' : k === 'partiel' ? 'Éraflage partiel' : 'Vendange entière';
}
function _cuvJours(a, b){
  if(!a || !b) return null;
  var d = Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
  return isFinite(d) ? d : null;
}

/* ═══════════ LE COMPARATIF DES CUVES — CUVDOC-3 ═══════════
   ⚠️⚠️ CE GRAPHE N'EST PAS CELUI DE L'ECRAN, ET C'EST VOULU. §86 interdit de
   REDESSINER une courbe qui existe deja ailleurs ; ici il n'y en a aucune a
   copier — l'ecran n'a pas de comparatif. Ce qui est partage, c'est le SOCLE :
   `_mvGraphCadre` / `_mvGraphSvg`, les memes gouttieres, les memes tailles de
   texte, les memes roles de couleur. Le jour ou ce comparatif monte sur un
   ecran, il appellera CETTE fonction, pas une seconde.
   ★★★ CE QUI CHANGE TOUT : l'axe des X compte des JOURS DEPUIS L'ENCUVAGE, pas
   des dates. Sur un calendrier, une cuve encuvee le 17 et une autre le 24
   n'ont aucun point commun ; alignees sur leur propre J0, leurs cinetiques se
   superposent et se comparent. C'est la seule facon de voir laquelle part vite.
   ⚠️ J0 = `date_entree`, jamais le premier releve. Deux origines differentes
   dans un meme graphe, ce sont deux echelles qui se ressemblent : une cuve
   mesuree trois jours apres l'encuvage aurait l'air d'avoir demarre plus bas.
   Une cuve sans date d'encuvage est donc ECARTEE, et le document le DIT.
   ⚠️ Un releve anterieur a l'encuvage (j < 0) est ecarte de meme : ce n'est pas
   une cinetique, c'est une saisie a corriger. */
/* ══ L'ECARTEMENT DES NOMS — UNE SEULE REGLE, TROIS TRACES ══════════════
   ★★★ DEFAUT TROUVE PAR LE HARNAIS, DANS LE CODE DE 6.86, ET LE HARNAIS
   AVAIT RAISON. L'ancien passage repoussait chaque nom de 11 px puis RABATTAIT
   sur le bord bas celui qui depassait :
       if(y > pT + ih + 8) y = pT + ih + 8;
   Le rabattement DEFAIT l'ecartement qu'on vient de faire. Mesure : trois
   cuves finissant toutes a 994 — le cas que §88d appelle lui-meme « le plus
   BANAL, puisqu'elles finissent toutes seches » — sortaient a 276,4 / 287,4 /
   294,0. Le dernier ecart tombait a 6,6 px pour un texte de 10 px : les
   lettres se chevauchaient. Le graphe mentait sur qui est qui, exactement ce
   que §88d disait avoir corrige.
   ⚠️ LA CAUSE EST GENERALE : la pile pousse vers le BAS, or les noms se
   tassent justement en bas quand toutes les cuves finissent seches. Un
   plafond bas est donc touche a tous les coups, precisement dans le cas
   nominal. La correction ne rabat plus : quand la pile deborde, elle REMONTE
   EN BLOC, ce qui preserve tous les ecarts.
   ⚠️ Et si meme la remontee ne suffit pas — plus de noms que de hauteur — on
   ne triche pas : les ecarts sont repartis egalement sur la hauteur
   disponible, et l'appelant voit un tassement REGULIER au lieu de deux noms
   superposes au hasard.
   ★ `hMin` est l'ecart minimal ; `yLo`/`yHi` les bornes du cadre. */
function _cmpEcarte(lbl, hMin, yLo, yHi){
  if(!lbl || !lbl.length) return lbl;
  hMin = hMin || 11;
  lbl.sort(function(a, b){ return a.y - b.y; });
  var n = lbl.length, dispo = yHi - yLo;
  /* Plus de noms que de place : tassement REGULIER, jamais deux au meme y. */
  if(dispo < (n - 1) * hMin){
    var pas = (n > 1) ? (dispo / (n - 1)) : 0;
    lbl.forEach(function(L, i){ L.yl = yLo + i * pas; });
    return lbl;
  }
  var prec = -1e9;
  lbl.forEach(function(L){
    var y = Math.max(L.y, prec + hMin, yLo);
    L.yl = y; prec = y;
  });
  /* ★ LA REMONTEE EN BLOC : ce qui depasse en bas est retire a TOUTE la pile.
     C'est ce qui remplace le rabattement, et c'est ce qui preserve les ecarts. */
  var trop = lbl[n - 1].yl - yHi;
  if(trop > 0){
    for(var i = n - 1; i >= 0; i--){
      lbl[i].yl -= trop;
      if(i > 0 && lbl[i].yl - lbl[i - 1].yl >= hMin) break;
      if(i === 0 && lbl[0].yl < yLo) lbl[0].yl = yLo;
    }
  }
  return lbl;
}

var MV_CMP_H   = 320;
var MV_CMP_MIN = 2;      /* sous deux cuves, il n'y a rien a comparer */
/* Six roles de la charte, tous lisibles sur blanc. Des `var()`, pas des hex :
   le document les declare dans son :root (§86b), et l'assertion du harnais
   verifie qu'aucun n'y manque. */
var MV_CMP_COL = ['var(--terre)', 'var(--vert-med)', 'var(--bleu)',
                  'var(--orange)', 'var(--phyto)', 'var(--rouge)'];

/* La serie d'une cuve, ramenee a son J0. null quand il n'y a pas de quoi
   tracer — jamais une serie vide, qui ferait une ligne plate a l'ecran. */
function _cmpSerie(c){
  var j0 = Date.parse(c && c.date_entree);
  if(isNaN(j0)) return null;
  var pts = (c.mesures_fa || []).map(function(m){
    var t = Date.parse(m && m.date), d = _vendMesD20(m);
    if(isNaN(t) || d == null) return null;
    var j = Math.round((t - j0) / 86400000);
    return (j < 0) ? null : { j:j, d:d, t:(m.temp_c != null ? m.temp_c : null) };
  }).filter(Boolean).sort(function(a, b){ return a.j - b.j; });
  if(pts.length < 2) return null;
  var prem = pts[0], der = pts[pts.length - 1], jSec = null;
  /* ★ CUV-8 : chaque cuve a SON seuil. Comparer quinze cuves a 996 revenait a
     donner la meme ligne d'arrivee a un mout a 11 deg et a un mout a 14. */
  var dSec = _vendDSec(c);
  for(var i = 0; i < pts.length; i++) if(pts[i].d <= dSec){ jSec = pts[i].j; break; }
  var tps = pts.filter(function(p){ return p.t != null; }).map(function(p){ return p.t; });
  var span = der.j - prem.j;
  return {
    nom: String(c.nom || 'Cuve'), cuve: c, pts: pts, dSec: dSec,
    dDeb: prem.d, dFin: der.d, jDeb: prem.j, jFin: der.j,
    /* ⚠️ Le jour OBSERVE sec, pas un jour interpole : le document ne date pas
       un evenement que personne n'a mesure. */
    jSec: jSec,
    tMoy: tps.length ? (tps.reduce(function(s, x){ return s + x; }, 0) / tps.length) : null,
    tMax: tps.length ? Math.max.apply(null, tps) : null,
    /* Points de densite par jour, sur l'intervalle REELLEMENT observe. */
    vit: (span > 0) ? ((prem.d - der.d) / span) : null
  };
}

/* Le sucre a la vigne, avant l'encuvage : la derniere analyse de chaque
   parcelle de la cuve, ponderee par la surface — une moyenne simple ferait
   peser 0,26 ha autant que 1,54 ha (meme regle qu'au controle de maturite).
   ⚠️ On ne connait PAS la part de chaque parcelle reellement entree dans la
   cuve : c'est un ordre de grandeur, et le document le dit.
   ⚠️ Bornes des deux cotes : rien apres l'encuvage (ce serait la vendange en
   cours, deja rentree), rien au-dela d'une campagne (ce serait l'an dernier). */
function _cmpVigne(c){
  var ref = c && c.date_entree; if(!ref) return null;
  var tj = Date.parse(ref); if(isNaN(tj)) return null;
  var noms = (c.parcelles || []).map(function(p){ return String(p || '').trim(); }).filter(Boolean);
  if(!noms.length) return null;
  var ha = {};
  (window.PARCELLES || []).forEach(function(p){
    if(p && p.nom) ha[String(p.nom).trim()] = parseFloat(p.surface) || 0;
  });
  var lus = [];
  noms.forEach(function(nom){
    var arr = (CAVE_VENDANGE.analyses || []).filter(function(a){
      return a && a.parcelle === nom && a.date && a.date <= ref && _matJours(a.date, tj) <= _MAT_CAMP_J;
    }).sort(function(a, b){ return String(a.date) < String(b.date) ? -1 : 1; });
    if(arr.length) lus.push({ suc: _matSuc(arr[arr.length - 1]), ha: ha[nom] || 0 });
  });
  if(!lus.length) return { suc:null, n:0, nTot:noms.length };
  var hs = lus.reduce(function(s, x){ return s + x.ha; }, 0);
  var suc = (hs > 0)
    ? lus.reduce(function(s, x){ return s + x.suc * x.ha; }, 0) / hs
    : lus.reduce(function(s, x){ return s + x.suc; }, 0) / lus.length;
  return { suc:suc, n:lus.length, nTot:noms.length, pond:(hs > 0) };
}

/* Le trace superpose. Pas de legende separee : chaque courbe porte SON NOM au
   bout, a hauteur de son dernier point. Une legende de douze cuves oblige a
   faire l'aller-retour entre une pastille de couleur et un trait ; un nom pose
   au bout de la ligne se lit d'un coup. Les noms qui se chevauchent sont
   ecartes verticalement — jamais superposes. */
function _cmpSvg(S, w){
  var c = window._mvGraphCadre(w, MV_CMP_H, { padL:52, padR:92, padT:26, padB:34 });
  var pL = c.padL, pT = c.padT, iw = c.iw, ih = c.ih;
  /* ★ CUV-8 : les seuils des cuves affichees. Un seul trait « vin sec » pour
     quinze cuves de degres differents dessinait une ligne d'arrivee commune
     qui n'existe pas. Des qu'ils different, c'est une BANDE. */
  var _sc = S.map(function(s){ return (s.dSec != null) ? s.dSec : _ML_D20_SEC; });
  var sLo = _sc.length ? Math.min.apply(null, _sc) : _ML_D20_SEC;
  var sHi = _sc.length ? Math.max.apply(null, _sc) : _ML_D20_SEC;
  var jMax = 1, lo = sLo, hi = sHi;
  S.forEach(function(s){ s.pts.forEach(function(p){
    if(p.j > jMax) jMax = p.j;
    if(p.d < lo) lo = p.d;
    if(p.d > hi) hi = p.d;
  }); });
  var dMin = Math.min(sLo - 6, lo - 4), dMax = hi + 6, dSp = Math.max(1, dMax - dMin);
  var X = function(j){ return pL + (j / jMax) * iw; };
  var Y = function(d){ return pT + ih - ((d - dMin) / dSp) * ih; };
  var g = '';

  // La grille et l'axe des densites.
  for(var i = 0; i <= c.grad; i++){
    var v = dMin + (dSp * i / c.grad), y = Y(v);
    g += '<line x1="' + pL + '" y1="' + y.toFixed(1) + '" x2="' + (pL + iw) + '" y2="' + y.toFixed(1)
      + '" stroke="' + c.col.grille + '" stroke-width="1"/>'
      + '<text x="' + (pL - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="'
      + c.txt.axe + '" fill="' + c.col.texte + '">' + Math.round(v) + '</text>';
  }
  g += '<text x="' + (pL - 8) + '" y="' + (pT - 10) + '" text-anchor="end" font-size="'
    + c.txt.unite + '" fill="' + c.col.texte + '">d20</text>';

  // L'axe des JOURS. Un pas entier : « J2,5 » ne veut rien dire.
  var pas = Math.max(1, Math.ceil(jMax / c.grad));
  for(var j = 0; j <= jMax; j += pas){
    var x = X(j);
    g += '<line x1="' + x.toFixed(1) + '" y1="' + (pT + ih) + '" x2="' + x.toFixed(1) + '" y2="'
      + (pT + ih + 4) + '" stroke="' + c.col.grille + '" stroke-width="1"/>'
      + '<text x="' + x.toFixed(1) + '" y="' + (c.h - 11) + '" text-anchor="middle" font-size="'
      + c.txt.axe + '" fill="' + c.col.texte + '">J' + j + '</text>';
  }
  g += '<text x="' + (pL + iw) + '" y="' + (c.h - 11) + '" text-anchor="end" font-size="'
    + c.txt.unite + '" fill="' + c.col.texte + '">jours depuis l’encuvage</text>';

  // Le seuil du vin sec, la meme reference que sur la courbe de chaque cuve.
  var ys = Y(sLo), yh = Y(sHi), bande = (sHi - sLo) >= 0.5;
  if(bande) g += '<rect x="' + pL + '" y="' + yh.toFixed(1) + '" width="' + iw.toFixed(1)
    + '" height="' + Math.max(1, ys - yh).toFixed(1) + '" fill="' + c.col.fait + '" fill-opacity="0.12"/>';
  g += '<line x1="' + pL + '" y1="' + ys.toFixed(1) + '" x2="' + (pL + iw) + '" y2="' + ys.toFixed(1)
    + '" stroke="' + c.col.fait + '" stroke-width="1.2" stroke-dasharray="5 4"/>'
    + '<text x="' + (pL + 6) + '" y="' + (yh - 6).toFixed(1) + '" font-size="' + c.txt.mini
    + '" font-weight="700" fill="' + c.col.fait + '">'
    + (bande ? ('vin sec · ' + _mvF1(sLo) + '–' + _mvF1(sHi) + ' selon la cuve')
             : (_mvF1(sLo) + ' · vin sec')) + '</text>';

  // Les courbes, et le point de DEPART marque : c'est lui que Nico compare.
  var lbl = [];
  S.forEach(function(s, k){
    var col = MV_CMP_COL[k % MV_CMP_COL.length];
    var pol = s.pts.map(function(p){ return X(p.j).toFixed(1) + ',' + Y(p.d).toFixed(1); }).join(' ');
    g += '<polyline points="' + pol + '" fill="none" stroke="' + col + '" stroke-width="1.8"'
      + ' stroke-linejoin="round" stroke-linecap="round"'
      + (k >= MV_CMP_COL.length ? ' stroke-dasharray="6 3"' : '') + '/>'
      + '<circle cx="' + X(s.jDeb).toFixed(1) + '" cy="' + Y(s.dDeb).toFixed(1)
      + '" r="3" fill="' + col + '"/>';
    lbl.push({ y:Y(s.dFin), x:X(s.jFin), nom:s.nom, col:col });
  });

  /* Ecartement des noms : trie par hauteur, puis chacun repousse le suivant.
     Sans ce passage, deux cuves qui finissent a la meme densite — le cas le
     plus BANAL, puisqu'elles finissent toutes seches — ecrivent leur nom l'un
     sur l'autre, et le graphe ment sur qui est qui. */
  _cmpEcarte(lbl, 11, pT + 4, pT + ih + 8);
  lbl.forEach(function(L){
    g += '<line x1="' + (L.x + 2).toFixed(1) + '" y1="' + L.y.toFixed(1) + '" x2="' + (pL + iw + 5)
      + '" y2="' + L.yl.toFixed(1) + '" stroke="' + L.col + '" stroke-width="0.8" opacity="0.55"/>'
      + '<text x="' + (pL + iw + 8) + '" y="' + (L.yl + 3.5).toFixed(1) + '" font-size="' + c.txt.mini
      + '" font-weight="600" fill="' + L.col + '">' + _escHtml(L.nom) + '</text>';
  });

  var aria = 'Comparatif de ' + S.length + ' cuves alignées sur leur jour d’encuvage : densité à 20 °C '
    + 'de ' + Math.round(dMax) + ' à ' + Math.round(dMin) + ' sur ' + jMax + ' jours.';
  return window._mvGraphSvg(c, aria, g);
}

/* ══ LES SERIES, CONSTRUITES ET CLASSEES — UNE SEULE FOIS, DEUX LECTEURS ══
   Le cahier de cuverie (`_cmpBloc`) et l'ecran du Pilotage passent tous les
   deux par ici. Deux tris ecrits separement, ce sont deux classements qui
   divergent au premier changement — et le document et l'ecran diraient alors
   deux verites sur les memes cuves.
   ⚠️⚠️ LE CLASSEMENT NE SE FAIT PAS SUR LA VITESSE, ET C'EST IMPORTANT.
   Une pente moyenne calculee sur trois jours n'est PAS comparable a une pente
   calculee sur dix : le debut d'une fermentation en est la phase la plus
   rapide, donc une cuve a peine relevee sortirait toujours en tete du
   « qui part le plus vite ». Le classement se fait sur le JOUR OU 996 A ETE
   RELEVE — une grandeur comparable, mesuree sur la meme chose. Les cuves qui
   n'y sont pas encore ferment la marche, la plus avancee d'abord.
   `hors` n'est pas un dechet : c'est le compte que les deux surfaces DOIVENT
   afficher. Une cuve ecartee en silence, c'est un graphe qui ment par omission. */
function _cmpSeries(cuves){
  var S = [], hors = 0;
  (cuves || []).forEach(function(c){
    var s = _cmpSerie(c);
    if(s) S.push(s); else hors++;
  });
  S.sort(function(a, b){
    if(a.jSec != null && b.jSec != null) return a.jSec - b.jSec;
    if(a.jSec != null) return -1;
    if(b.jSec != null) return 1;
    return a.dFin - b.dFin;
  });
  return { S:S, hors:hors };
}

/* ══ LES TEMPERATURES, SUR LE MEME RAIL DE JOURS ══
   ★★ CE TRACE EST NEUF, ET C'EST LEGITIME. §86 interdit de REDESSINER une
   courbe qui existe ailleurs : `_vendFermSvg` trace bien une temperature, mais
   d'UNE cuve, sur un axe de DATES. Superposer plusieurs cuves sur leur propre
   J0 n'existe nulle part — il n'y a rien a copier. Ce qui est partage, c'est
   le socle : meme cadre, meme palette, meme ecartement des noms que `_cmpSvg`.
   ⚠️ Les series sont CELLES DE `_cmpSerie` : meme filtre, meme J0, meme ordre,
   donc meme couleur pour la meme cuve d'un graphe a l'autre. Recalculer ici,
   ce serait risquer qu'une cuve change de couleur entre densite et temperature.
   ⚠️ Une cuve dont aucun releve ne porte de temperature n'est pas tracee — et
   le compte de celles qui manquent remonte a l'appelant. Un releve sans
   temperature n'est pas une temperature de zero. */
var MV_CMP_TH   = 240;
var MV_CMP_TMIN = 18;   /* fenetre de travail basse, en °C */
var MV_CMP_TMAX = 30;   /* au-dessus, le releve est signale : c'est le seuil
                           qui declenche deja l'alerte « temperature haute » */
function _cmpTempSvg(S, w){
  var c = window._mvGraphCadre(w, MV_CMP_TH, { padL:52, padR:92, padT:26, padB:34 });
  var pL = c.padL, pT = c.padT, iw = c.iw, ih = c.ih;
  var T = [];
  (S || []).forEach(function(s, k){
    var pts = s.pts.filter(function(p){ return p.t != null; });
    if(pts.length >= 2) T.push({ nom:s.nom, pts:pts, col:MV_CMP_COL[k % MV_CMP_COL.length], k:k });
  });
  if(T.length < MV_CMP_MIN) return '';
  var jMax = 1, lo = MV_CMP_TMIN, hi = MV_CMP_TMAX;
  T.forEach(function(s){ s.pts.forEach(function(p){
    if(p.j > jMax) jMax = p.j;
    if(p.t < lo) lo = p.t;
    if(p.t > hi) hi = p.t;
  }); });
  var tMin = Math.floor((lo - 2) / 2) * 2, tMax = Math.ceil((hi + 2) / 2) * 2;
  var tSp = Math.max(1, tMax - tMin);
  var X = function(j){ return pL + (j / jMax) * iw; };
  var Y = function(t){ return pT + ih - ((t - tMin) / tSp) * ih; };

  /* La fenetre de travail est une BANDE, pas un seuil : entre 18 et 30 °C il
     n'y a rien a decider. Un trait unique se lirait comme une limite. */
  var g = '<rect x="' + pL + '" y="' + Y(MV_CMP_TMAX).toFixed(1) + '" width="' + iw
    + '" height="' + (Y(MV_CMP_TMIN) - Y(MV_CMP_TMAX)).toFixed(1) + '" fill="' + c.col.fait
    + '" opacity="0.09"/>';

  for(var i = 0; i <= c.grad; i++){
    var v = tMin + (tSp * i / c.grad), y = Y(v);
    g += '<line x1="' + pL + '" y1="' + y.toFixed(1) + '" x2="' + (pL + iw) + '" y2="' + y.toFixed(1)
      + '" stroke="' + c.col.grille + '" stroke-width="1"/>'
      + '<text x="' + (pL - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="'
      + c.txt.axe + '" fill="' + c.col.texte + '">' + Math.round(v) + '</text>';
  }
  g += '<text x="' + (pL - 8) + '" y="' + (pT - 10) + '" text-anchor="end" font-size="'
    + c.txt.unite + '" fill="' + c.col.texte + '">\u00b0C</text>';

  var pas = Math.max(1, Math.ceil(jMax / c.grad));
  for(var j = 0; j <= jMax; j += pas){
    var x = X(j);
    g += '<line x1="' + x.toFixed(1) + '" y1="' + (pT + ih) + '" x2="' + x.toFixed(1) + '" y2="'
      + (pT + ih + 4) + '" stroke="' + c.col.grille + '" stroke-width="1"/>'
      + '<text x="' + x.toFixed(1) + '" y="' + (c.h - 11) + '" text-anchor="middle" font-size="'
      + c.txt.axe + '" fill="' + c.col.texte + '">J' + j + '</text>';
  }
  g += '<text x="' + (pL + iw) + '" y="' + (c.h - 11) + '" text-anchor="end" font-size="'
    + c.txt.unite + '" fill="' + c.col.texte + '">jours depuis l\u2019encuvage</text>';

  var lbl = [], chauds = 0;
  T.forEach(function(s){
    var pol = s.pts.map(function(p){ return X(p.j).toFixed(1) + ',' + Y(p.t).toFixed(1); }).join(' ');
    g += '<polyline points="' + pol + '" fill="none" stroke="' + s.col + '" stroke-width="1.8"'
      + ' stroke-linejoin="round" stroke-linecap="round"'
      + (s.k >= MV_CMP_COL.length ? ' stroke-dasharray="6 3"' : '') + '/>';
    /* ★ Seuls les releves CHAUDS portent un point. Un point partout ferait du
       bruit ; un point nulle part laisserait passer le releve qui compte. */
    s.pts.forEach(function(p){
      if(p.t < MV_CMP_TMAX) return;
      chauds++;
      g += '<circle cx="' + X(p.j).toFixed(1) + '" cy="' + Y(p.t).toFixed(1)
        + '" r="3.2" fill="' + c.col.alerte + '"/>';
    });
    var der = s.pts[s.pts.length - 1];
    lbl.push({ y:Y(der.t), x:X(der.j), nom:s.nom, col:s.col });
  });

  /* Meme ecartement qu'en §88d, et pour la meme raison : deux cuves finissent
     souvent a la meme temperature de fin de fermentation.
     ⚠️ J'avais d'abord RECOPIE le passage de `_cmpSvg` ici — defaut compris.
     C'est l'argument meme d'une regle partagee : une copie propage la faute
     avant qu'on l'ait trouvee. */
  _cmpEcarte(lbl, 11, pT + 4, pT + ih + 8);
  lbl.forEach(function(L){
    g += '<line x1="' + (L.x + 2).toFixed(1) + '" y1="' + L.y.toFixed(1) + '" x2="' + (pL + iw + 5)
      + '" y2="' + L.yl.toFixed(1) + '" stroke="' + L.col + '" stroke-width="0.8" opacity="0.55"/>'
      + '<text x="' + (pL + iw + 8) + '" y="' + (L.yl + 3.5).toFixed(1) + '" font-size="' + c.txt.mini
      + '" font-weight="600" fill="' + L.col + '">' + _escHtml(L.nom) + '</text>';
  });

  var aria = 'Temp\u00e9ratures de ' + T.length + ' cuves align\u00e9es sur leur jour d\u2019encuvage : de '
    + Math.round(tMin) + ' \u00e0 ' + Math.round(tMax) + ' degr\u00e9s sur ' + jMax + ' jours, '
    + (chauds ? (chauds + ' relev\u00e9s \u00e0 ' + MV_CMP_TMAX + ' degr\u00e9s ou plus.') : 'aucun relev\u00e9 au-dessus de ' + MV_CMP_TMAX + ' degr\u00e9s.');
  return window._mvGraphSvg(c, aria, g);
}

/* ═══════════════════════════════════════════════════════════════════════════
   CRB-2 — L'ENVELOPPE DE DISPERSION. POUR L'ECRAN SEULEMENT.
   ★★★ POURQUOI UN SECOND DESSIN DE LA MEME DONNEE, ALORS QUE §86 L'INTERDIT.
   La regle interdit de REDESSINER une courbe qui existe ailleurs. Ici ce n'est
   pas le meme dessin : `_cmpSvg` SUPERPOSE quinze traits nommes, l'enveloppe
   les RESUME en un couloir. Et les deux surfaces n'ont ni la meme place ni le
   meme geste. Sur A4, quinze noms tiennent dans 92 px de gouttiere et il n'y a
   pas de doigt : le cahier de cuverie garde `_cmpSvg`, inchange. Sur 336 px, la
   meme gouttiere mange le tiers du trace pour ecrire quinze noms qu'on ne lit
   pas — et c'est exactement ce que Nico a appele « illisible ».
   ⚠⚠ LE CAHIER DE CUVERIE NE DOIT PAS PASSER PAR ICI. `_cmpBloc` appelle
   `_cmpSvg` / `_cmpTempSvg` et rien d'autre. Un couloir sans selecteur de cuve
   sur du papier ne repondrait a aucune question.
   ═══════════════════════════════════════════════════════════════════════════ */
var MV_CRB_NMIN = 3;      /* sous trois cuves, une « dispersion » n'en est pas une */
var MV_CRB_DLO  = 990,  MV_CRB_DHI = 1100;   /* l'axe des densites, fixe */
var MV_CRB_TLO  = 10,   MV_CRB_THI = 35;     /* l'axe des temperatures, fixe */
var MV_CRB_H    = 276,  MV_CRB_TH2 = 244;
/* Deux ROLES, pas deux index. `MV_CMP_COL` attribue une couleur par rang parmi
   quinze ; ici il n'y a que « la cuve suivie » et « celle a laquelle on la
   compare ». Une couleur de rang designerait une courbe qui n'est plus tracee. */
var MV_CRB_COLA = 'var(--terre)', MV_CRB_COLB = 'var(--bleu)';

/* Les cuves mises en avant — DEUX au plus. Au-dela, on retombe sur le probleme
   qu'on vient de resoudre. `_CRB_TOUCHE` distingue « l'utilisateur n'a rien
   choisi » de « l'utilisateur a tout deselectionne » : le premier merite un
   defaut, le second merite qu'on le respecte. */
var _CRB_SEL = [], _CRB_TOUCHE = false;

/* ── LA VALEUR D'UNE CUVE AU JOUR J ─────────────────────────────────
   ★★★ LE SEUL ARBITRAGE DE MODELE DU LOT.
   Une enveloppe demande une valeur par cuve ET par jour. Or personne ne releve
   les quinze cuves tous les jours : sans rien, la mediane sauterait d'un jour a
   l'autre selon QUI a ete mesure, pas selon ce qui se passe en cuve.
   Le choix : INTERPOLATION LINEAIRE ENTRE DEUX RELEVES REELS DE LA MEME CUVE,
   et rien d'autre. Jamais avant le premier releve, jamais apres le dernier —
   ce serait extrapoler, c'est-a-dire inventer.
   Pourquoi c'est defendable : densite et temperature sont des grandeurs
   CONTINUES, et l'ecart entre deux releves est d'un a deux jours. Ce n'est pas
   du meme ordre qu'une date d'encuvage devinee (§88a).
   ⚠ Ce que ca coute, et qui s'ecrit a l'ecran : la mediane d'un jour non releve
   est une mediane d'estimations. L'infobulle donne les DEUX comptes — cuves
   prises en compte, et cuves reellement relevees ce jour-la. */
function _crbVal(pts, j, cle){
  var P = [], i;
  for(i = 0; i < (pts||[]).length; i++) if(pts[i][cle] != null) P.push(pts[i]);
  if(P.length < 2) return null;
  if(j < P[0].j || j > P[P.length - 1].j) return null;
  for(i = 0; i < P.length; i++){
    if(P[i].j === j) return { v:P[i][cle], reel:true };
    if(P[i].j > j){
      var a = P[i-1], b = P[i];
      return { v: a[cle] + (b[cle] - a[cle]) * ((j - a.j) / (b.j - a.j)), reel:false };
    }
  }
  return null;
}

function _crbMed(v){
  if(!v.length) return null;
  var a = v.slice().sort(function(x, y){ return x - y; }), n = a.length, m = n >> 1;
  return (n % 2) ? a[m] : (a[m-1] + a[m]) / 2;
}

/* ── L'ENVELOPPE ────────────────────────────────────────────────
   Par jour : le minimum, le maximum, la mediane, et DEUX comptes.
   ⚠ `jCoupe` est le dernier jour ou trois cuves sont encore suivies. Au-dela,
   min = max = mediane et le couloir devient un trait : un trait plat ferait
   croire a une convergence alors qu'il ne reste qu'une cuve. */
function _crbEnv(S, cle){
  var jMax = 0, sans = 0;
  (S||[]).forEach(function(s){
    var n = 0;
    s.pts.forEach(function(p){ if(p[cle] != null) n++; });
    if(n < 2){ sans++; return; }
    if(s.jFin > jMax) jMax = s.jFin;
  });
  var J = [], jc = -1;
  for(var j = 0; j <= jMax; j++){
    var vals = [], reels = 0;
    (S||[]).forEach(function(s){
      var r = _crbVal(s.pts, j, cle);
      if(r){ vals.push(r.v); if(r.reel) reels++; }
    });
    if(!vals.length) continue;
    J.push({ j:j, min:Math.min.apply(null, vals), max:Math.max.apply(null, vals),
             med:_crbMed(vals), n:vals.length, reels:reels });
    if(vals.length >= MV_CRB_NMIN) jc = j;
  }
  return { jours:J, jMax:jMax, jCoupe:jc, sans:sans };
}

/* Les jours CONTIGUS, en troncons : un trou dans le couloir ne se comble pas
   par un trait droit que personne n'a mesure. */
function _crbTroncons(jours, jMax){
  var T = [], cur = [];
  jours.forEach(function(d){
    if(d.j > jMax) return;
    if(cur.length && d.j !== cur[cur.length-1].j + 1){ T.push(cur); cur = []; }
    cur.push(d);
  });
  if(cur.length) T.push(cur);
  return T;
}

/* La serie d'une cuve par son nom. Le nom N'EST PAS unique dans l'absolu —
   `_mlNomCuvee` le rappelle — mais il l'est DANS un millesime, et l'ecran n'en
   affiche qu'un. Les gardes de `_pcrbSeries` (« un nom en double sort du
   selecteur ») ferment le reste. */
function _crbSerie(nom){
  var S = _PCRB_S || [];
  for(var i = 0; i < S.length; i++) if(S[i].nom === nom) return S[i];
  return null;
}

/* ── LE TRACE ───────────────────────────────────────────────────
   ⚠ LES BORNES SONT FIXES, ET ELARGIES SI LA DONNEE SORT. Un axe qui s'ajuste
   aux donnees fait paraitre enorme un ecart de deux points, et deux captures
   d'un millesime a l'autre ne se comparent plus. Un axe fixe qui COUPE une
   valeur serait pire : les bornes s'ecartent quand il le faut, jamais moins. */
function _crbEnvSvg(S, w, cle){
  var dens = (cle === 'd');
  var env = _crbEnv(S, cle);
  if(!env.jours.length) return '';
  var c = window._mvGraphCadre(w, dens ? MV_CRB_H : MV_CRB_TH2,
    { padL:42, padR:16, padT:24, padB:32 });
  var pL = c.padL, pT = c.padT, iw = c.iw, ih = c.ih;
  var jMax = Math.max(1, env.jMax), lo = null, hi = null;
  env.jours.forEach(function(d){
    if(lo == null || d.min < lo) lo = d.min;
    if(hi == null || d.max > hi) hi = d.max;
  });
  var pasV = dens ? 25 : 5, marge = dens ? 3 : 2;
  var aLo = dens ? MV_CRB_DLO : MV_CRB_TLO, aHi = dens ? MV_CRB_DHI : MV_CRB_THI;
  /* \u26a0 L'ELARGISSEMENT S'ARRONDIT AU PAS DE GRADUATION. Sans cela, une cuve a
     8 \u00b0C descendait le cadre a 6 mais laissait le premier trait chiffre a 10 :
     la courbe plongeait sous la derniere ligne, dans une zone sans repere. Un
     cadre elargi qui ne dit pas jusqu'ou il descend ne vaut pas mieux qu'un
     cadre qui coupe. */
  if(lo - marge < aLo) aLo = Math.floor((lo - marge) / pasV) * pasV;
  if(hi + marge > aHi) aHi = Math.ceil((hi + marge) / pasV) * pasV;
  var sp  = Math.max(1, aHi - aLo);
  var X = function(j){ return pL + (j / jMax) * iw; };
  var Y = function(v){ return pT + ih - ((v - aLo) / sp) * ih; };
  var g = '';

  /* La fenetre de travail des temperatures : une BANDE, pas un seuil. Entre 18
     et 30 °C il n'y a rien a decider ; un trait unique se lirait comme une
     limite. Meme constante que `_cmpTempSvg` — deux valeurs ecrites deux fois,
     ce sont deux verites au premier changement. */
  if(!dens) g += '<rect x="' + pL + '" y="' + Y(MV_CMP_TMAX).toFixed(1) + '" width="' + iw
    + '" height="' + (Y(MV_CMP_TMIN) - Y(MV_CMP_TMAX)).toFixed(1) + '" fill="' + c.col.fait
    + '" opacity="0.09"/>';

  for(var v = Math.ceil(aLo / pasV) * pasV; v <= aHi; v += pasV){
    var y = Y(v);
    g += '<line x1="' + pL + '" y1="' + y.toFixed(1) + '" x2="' + (pL + iw) + '" y2="' + y.toFixed(1)
      + '" stroke="' + c.col.grille + '" stroke-width="1"/>'
      + '<text x="' + (pL - 7) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="'
      + c.txt.axe + '" fill="' + c.col.texte + '">' + Math.round(v) + '</text>';
  }
  g += '<text x="' + (pL - 7) + '" y="' + (pT - 9) + '" text-anchor="end" font-size="'
    + c.txt.unite + '" fill="' + c.col.texte + '">' + (dens ? 'd20' : '\u00b0C') + '</text>';

  /* L'axe des JOURS. Un pas entier : « J2,5 » ne veut rien dire. */
  var pasJ = Math.max(1, Math.ceil(jMax / c.grad));
  for(var j = 0; j <= jMax; j += pasJ){
    var x = X(j);
    g += '<line x1="' + x.toFixed(1) + '" y1="' + (pT + ih) + '" x2="' + x.toFixed(1) + '" y2="'
      + (pT + ih + 4) + '" stroke="' + c.col.grille + '" stroke-width="1"/>'
      + '<text x="' + x.toFixed(1) + '" y="' + (c.h - 10) + '" text-anchor="middle" font-size="'
      + c.txt.axe + '" fill="' + c.col.texte + '">J' + j + '</text>';
  }
  g += '<text x="' + (pL + iw) + '" y="' + (c.h - 10) + '" text-anchor="end" font-size="'
    + c.txt.unite + '" fill="' + c.col.texte + '">jours depuis l\u2019encuvage</text>';

  /* LE COULOIR, puis LA MEDIANE. Trait fin pointille et NEUTRE : c'est un
     repere, pas une cuve. Lui donner une couleur de la palette, ce serait la
     faire passer pour une seizieme cuve. */
  if(env.jCoupe >= 1){
    _crbTroncons(env.jours, env.jCoupe).forEach(function(T){
      if(T.length < 2) return;
      var haut = T.map(function(d){ return X(d.j).toFixed(1) + ',' + Y(d.max).toFixed(1); });
      var bas  = T.slice().reverse().map(function(d){ return X(d.j).toFixed(1) + ',' + Y(d.min).toFixed(1); });
      g += '<polygon points="' + haut.concat(bas).join(' ') + '" fill="' + c.col.prevu
        + '" fill-opacity="0.20"/>'
        + '<polyline points="' + haut.join(' ') + '" fill="none" stroke="' + c.col.prevu
        + '" stroke-width="1" opacity="0.7"/>'
        + '<polyline points="' + bas.join(' ') + '" fill="none" stroke="' + c.col.prevu
        + '" stroke-width="1" opacity="0.7"/>'
        + '<polyline points="' + T.map(function(d){ return X(d.j).toFixed(1) + ',' + Y(d.med).toFixed(1); }).join(' ')
        + '" fill="none" stroke="' + c.col.texte + '" stroke-width="1.4" stroke-dasharray="5 4"'
        + ' stroke-linecap="round"/>';
    });
    /* La ou le couloir s'arrete, on le DIT. Un trait qui s'interrompt sans
       raison se lit comme une panne. */
    if(env.jCoupe < jMax)
      g += '<line x1="' + X(env.jCoupe).toFixed(1) + '" y1="' + pT + '" x2="' + X(env.jCoupe).toFixed(1)
        + '" y2="' + (pT + ih) + '" stroke="' + c.col.grille + '" stroke-width="1" stroke-dasharray="2 3"/>';
  }

  /* Le seuil du vin sec — la meme reference que sur la courbe de chaque cuve. */
  /* ★ CUV-8 : une BANDE des que les cuves affichees n'ont pas le meme seuil. */
  if(dens){
    var _sq = (S || []).map(function(s){ return (s && s.dSec != null) ? s.dSec : _ML_D20_SEC; });
    var qLo = _sq.length ? Math.min.apply(null, _sq) : _ML_D20_SEC;
    var qHi = _sq.length ? Math.max.apply(null, _sq) : _ML_D20_SEC;
    if(qLo >= aLo && qHi <= aHi){
      var ys = Y(qLo), yq = Y(qHi), bnd = (qHi - qLo) >= 0.5;
      if(bnd) g += '<rect x="' + pL + '" y="' + yq.toFixed(1) + '" width="' + iw.toFixed(1)
        + '" height="' + Math.max(1, ys - yq).toFixed(1) + '" fill="' + c.col.fait + '" fill-opacity="0.12"/>';
      g += '<line x1="' + pL + '" y1="' + ys.toFixed(1) + '" x2="' + (pL + iw) + '" y2="' + ys.toFixed(1)
        + '" stroke="' + c.col.fait + '" stroke-width="1.2" stroke-dasharray="5 4"/>'
        + '<text x="' + (pL + 5) + '" y="' + (yq - 5).toFixed(1) + '" font-size="' + c.txt.mini
        + '" font-weight="700" fill="' + c.col.fait + '">'
        + (bnd ? ('vin sec \u00b7 ' + _mvF1(qLo) + '\u2013' + _mvF1(qHi))
               : (_mvF1(qLo) + ' \u00b7 vin sec')) + '</text>';
    }
  }

  /* LES CUVES MISES EN AVANT, par-dessus le couloir. La seconde est pointillee :
     sur un ecran en plein soleil, deux traits pleins de couleurs voisines se
     confondent, un trait pointille ne se confond avec rien. */
  var vus = [];
  _CRB_SEL.forEach(function(nom, k){
    var s = _crbSerie(nom); if(!s) return;
    var col = k ? MV_CRB_COLB : MV_CRB_COLA;
    var Pt = s.pts.filter(function(p){ return p[cle] != null; });
    if(Pt.length < 2) return;
    vus.push(nom);
    g += '<polyline points="' + Pt.map(function(p){ return X(p.j).toFixed(1) + ',' + Y(p[cle]).toFixed(1); }).join(' ')
      + '" fill="none" stroke="' + col + '" stroke-width="2.6" stroke-linejoin="round"'
      + ' stroke-linecap="round"' + (k ? ' stroke-dasharray="7 3.5"' : '') + '/>';
    Pt.forEach(function(p){
      g += '<circle cx="' + X(p.j).toFixed(1) + '" cy="' + Y(p[cle]).toFixed(1) + '" r="2.4" fill="' + col + '"/>';
    });
  });

  /* LES ZONES DE TOUCHE (socle CUVGR-3) — une colonne par jour, bord a bord.
     ⚠ EMISES EN DERNIER : un <rect> pose avant le trace serait recouvert.
     ⚠ `tt` porte du HTML ; les NOMS DE CUVES y sont echappes ici, le socle
     echappe ensuite l'attribut. Sans le premier echappement, une cuve nommee
     avec un chevron injecterait une balise dans l'infobulle. */
  var demi = (iw / jMax) / 2;
  env.jours.forEach(function(d){
    var xm = X(d.j);
    var tt = '<div class="t">J' + d.j + '</div>';
    var anc = null;
    _CRB_SEL.forEach(function(nom, k){
      var s = _crbSerie(nom); if(!s) return;
      var r = _crbVal(s.pts, d.j, cle);
      tt += '<div class="r"><i>' + _escHtml(nom) + '</i><b>'
        + (r ? (_mvF1(r.v) + (dens ? '' : ' \u00b0C') + (r.reel ? '' : ' ~')) : '\u2014') + '</b></div>';
      if(r && anc == null) anc = Y(r.v);
      if(r && !k) anc = Y(r.v);
    });
    tt += '<div class="r"><i>m\u00e9diane</i><b>' + _mvF1(d.med) + (dens ? '' : ' \u00b0C') + '</b></div>';
    /* L'ECART, en toutes lettres. Un signe seul laisse le lecteur faire le
       calcul metier ; « en retard sur » le lui donne. */
    var prem = _CRB_SEL.length ? _crbSerie(_CRB_SEL[0]) : null;
    var rp = prem ? _crbVal(prem.pts, d.j, cle) : null;
    if(rp && d.n > 1){
      var e = rp.v - d.med, a = Math.abs(e);
      if(a < (dens ? 0.5 : 0.15)) tt += '<div class="o">sur la m\u00e9diane du cuvage</div>';
      else tt += '<div class="o">' + (e > 0 ? '+' : '\u2212') + _mvF1(a) + (dens ? ' pts ' : ' \u00b0C ')
        + (dens ? (e > 0 ? 'en retard sur' : 'en avance sur') : (e > 0 ? 'au-dessus de' : 'en dessous de'))
        + ' la m\u00e9diane</div>';
    }
    tt += '<div class="o">' + d.n + ' cuve' + (d.n > 1 ? 's' : '') + ' dans le couloir'
      + (d.reels < d.n ? (', dont ' + d.reels + ' relev\u00e9e' + (d.reels > 1 ? 's' : '') + ' ce jour-l\u00e0') : '')
      + '</div>';
    g += window._mvGraphHit(c, xm, (anc == null) ? Y(d.med) : anc,
      Math.max(pL, xm - demi), Math.min(pL + iw, xm + demi), tt);
  });

  var aria = (dens ? 'Densit\u00e9s' : 'Temp\u00e9ratures') + ' de ' + (S||[]).length
    + ' cuves align\u00e9es sur leur jour d\u2019encuvage : couloir du minimum au maximum et m\u00e9diane, '
    + 'de J0 \u00e0 J' + jMax + '. '
    + (vus.length ? ('Mis en avant : ' + vus.join(', ') + '.') : 'Aucune cuve mise en avant.');
  return window._mvGraphSvg(c, aria, g);
}

/* Le second trace du comparatif imprime : les temperatures, sur le meme rail de
   jours. ⚠ Le bloc entier disparait quand le trace est vide — un titre suivi
   d'un blanc sur du papier se lit comme une panne d'impression. */
function _cmpTempBlocDoc(S){
  var svg = _cmpTempSvg(S, MV_CUVDOC_GRW);
  if(!svg) return '';
  return '<div class="cmp-gr mvdoc-avoid">' + svg
    + '<div class="cmp-note"><b>Les temp\u00e9ratures, sur le m\u00eame rail de jours.</b> '
    + 'La bande verte est la fen\u00eatre de travail, de ' + MV_CMP_TMIN + ' \u00e0 ' + MV_CMP_TMAX
    + '\u00a0\u00b0C\u00a0; au-dessus de ' + MV_CMP_TMAX + '\u00a0\u00b0C, le relev\u00e9 porte un point rouge. '
    + 'Un <b>palier de densit\u00e9</b> trouve souvent son explication ici\u00a0: douze degr\u00e9s cinq jours '
    + 'durant, c\u2019est une mac\u00e9ration pr\u00e9fermentaire, pas une fermentation qui tra\u00eene. '
    + '<b>Une cuve dont aucun relev\u00e9 ne porte de temp\u00e9rature n\u2019est pas trac\u00e9e</b> \u2014 un relev\u00e9 '
    + 'sans temp\u00e9rature n\u2019est pas une temp\u00e9rature de z\u00e9ro.</div></div>';
}

/* Le comparatif complet : le trace, puis le tableau qui repond au « pourquoi ».
   ⚠️ Le tri vit dans `_cmpSeries`, PAS ici — et il porte sur le jour du vin sec,
   pas sur la vitesse (§88b). Le commentaire qui disait « trie par vitesse
   decroissante » datait du premier jet et contredisait son propre code. */
function _cmpBloc(cuves){
  var _r = _cmpSeries(cuves), S = _r.S, hors = _r.hors;
  if(S.length < MV_CMP_MIN) return '';
  var spd = (_vendCfg().sucre_par_degre) || 16.83;
  var lignes = S.map(function(s){
    var vg = _cmpVigne(s.cuve);
    var vgTxt = '—';
    if(vg && vg.suc != null){
      vgTxt = Math.round(vg.suc);
      if(vg.n < vg.nTot) vgTxt += ' <i>(' + vg.n + '/' + vg.nTot + ')</i>';
    }
    return '<tr><td>' + _escHtml(s.nom) + '</td>'
      + '<td>' + _vendFrDate(s.cuve.date_entree) + '</td>'
      + '<td class="n">' + Math.round(s.dDeb) + '</td>'
      + '<td class="n">' + Math.round(_vendSucre(s.dDeb)) + '</td>'
      + '<td class="n">' + _mvF1(_vendSucre(s.dDeb) / spd) + '</td>'
      + '<td class="n">' + vgTxt + '</td>'
      + '<td class="n">' + (s.tMoy != null ? (_mvF1(s.tMoy) + ' · ' + _mvF1(s.tMax)) : '—') + '</td>'
      + '<td class="n">' + (s.jSec != null ? ('J' + s.jSec) : ('<i>J' + s.jFin + ' · ' + Math.round(s.dFin) + '</i>')) + '</td>'
      + '<td class="n">' + (s.vit != null
          ? (_mvF1(s.vit) + ' <i>J' + s.jDeb + '–J' + s.jFin + '</i>') : '—') + '</td></tr>';
  }).join('');

  return '<h2>Comparatif des cuves</h2>'
    + '<div class="cmp-gr mvdoc-avoid">' + _cmpSvg(S, MV_CUVDOC_GRW)
    + '<div class="cmp-note">Chaque cuve est alignée sur <b>son propre jour d’encuvage</b> : J0 est '
    + 'sa date d’entrée, pas une date du calendrier. Le point plein marque la <b>densité de départ</b>. '
    + 'Le tableau est classé par <b>jour d’atteinte du vin sec</b>.'
    + (hors ? (' <b>' + hors + '</b> cuve' + (hors > 1 ? 's ne figurent' : ' ne figure') + ' pas ici : '
        + 'sans date d’encuvage ou avec moins de deux relevés de densité, il n’y a pas de cinétique à tracer.') : '')
    + '</div></div>'
    /* ★★ LES TEMPERATURES ARRIVENT SUR LE PAPIER (CRB-2, arbitrage de Nico).
       `_cmpTempSvg` n'avait plus aucun appelant depuis que l'ecran est passe au
       couloir : elle n'a jamais ete imprimee, seulement affichee. Deux issues
       possibles — la supprimer, ou la mettre la ou elle a de la place. C'est la
       seconde qui a ete retenue : sur A4 les quinze noms tiennent, et le cahier
       porte deja la colonne « T° moy · max » sans jamais montrer la COURBE qui
       l'explique. Un palier de densite se lit ici, plus dans un tableau.
       ⚠ Elle rend '' quand moins de deux cuves portent une temperature : on ne
       pose ni titre ni note sur un graphe absent. */
    + _cmpTempBlocDoc(S)
    + '<table class="cmp-tb mvdoc-avoid"><thead><tr><th>Cuve</th><th>Encuvée</th>'
    + '<th class="n">Départ d20</th><th class="n">Sucre g/L</th><th class="n">Degré pot.</th>'
    + '<th class="n">Vigne g/L</th><th class="n">T° moy · max</th><th class="n">Vin sec</th>'
    + '<th class="n">Pts/j</th></tr></thead><tbody>' + lignes + '</tbody></table>';
}

/* ── La courbe de fermentation, dans le cahier ─────────────────────────────
   ⚠️⚠️ AUCUN TRACE NEUF ICI. C'est `_vendFermSvg`, CELUI DE L'ECRAN, appele
   avec la largeur de la page. Redessiner la meme cinetique une seconde fois
   pour le papier, ce serait deux verites en puissance sur le meme releve —
   exactement ce que l'en-tete des documents du Cuvier refuse.
   ⚠️ On ne l'appelle QUE si la cuve a de quoi tracer. Sous trois densites,
   `_vendFermSvg` rend l'etat vide de l'ECRAN : un encadre a bord tirete qui
   propose un geste a faire. Un geste ne se propose pas sur du papier, et le
   tableau juste en dessous dit deja qu'il n'y a rien. Le document se tait.
   ⚠️ Le compte porte sur les relevés qui ont une DATE ET UNE DENSITE — le
   meme filtre que le trace. Compter `mesures_fa` tout court ferait passer
   trois releves de temperature seule pour une courbe. */
var MV_CUVDOC_GRW = 640;   /* A4 portrait, marges 12 mm, corps 18 px : 667 px
                              utiles. Au-dessus de 560, le trace garde ses DEUX
                              axes chiffres — densite a gauche, degres a droite.
                              Sous ce palier il en masque un : sur le papier,
                              la place ne manque pas, l'axe reste. */
function _cuvDocGraph(c){
  var n = ((c && c.mesures_fa) || []).filter(function(m){
    return m && m.date && m.densite != null; }).length;
  if(n < 3) return '';
  return '<div class="cd-gr mvdoc-avoid">' + _vendFermSvg(c, MV_CUVDOC_GRW, { sansTouche:true }) + '</div>';
}

/* ── TRI-3 — l'ordre du cahier de cuverie ──────────────────────────
   Une page par cuve. L'ordre par defaut est celui de l'ENCUVAGE : le cahier se
   lit comme la vendange s'est passee. Sur cette cle on rend la liste telle
   qu'elle sort du filtre, sans la retrier.
   ⚠️ Sur vingt cuves, chercher « Cuve 7 » dans un ordre chronologique demande
   de parcourir tout le document ; c'est la seule raison d'offrir un autre ordre. */
var MV_TRI_CUVERIE = [
  { v:'encuvage', lbl:'Encuvage', a:'la premi\u00e8re entr\u00e9e d\u2019abord', z:'la derni\u00e8re entr\u00e9e d\u2019abord' },
  { v:'nom',      lbl:'Cuve',     a:'A \u2192 Z', z:'Z \u2192 A' },
  { v:'volume',   lbl:'Contenance', a:'la plus petite d\u2019abord', z:'la plus grande d\u2019abord' },   // VOL-1
  { v:'duree',    lbl:'Cuvaison', a:'la plus courte d\u2019abord', z:'la plus longue d\u2019abord' }
];
function _cuvTrier(cuves, c){
  c = c || { cle:'encuvage', sens:'asc' };
  if(c.cle === 'encuvage')
    return (c.sens === 'desc') ? cuves.slice().reverse() : cuves;
  var sg = (c.sens === 'desc') ? -1 : 1;
  var val = function(x){
    if(c.cle === 'nom')    return String(x.nom || '');
    if(c.cle === 'volume') return (x.volume_hl > 0) ? x.volume_hl : null;
    if(c.cle === 'duree'){
      var mes = x.mesures_fa || [];
      var fin = (x.decuvage && x.decuvage.date) || (mes.length ? mes[mes.length - 1].date : null);
      var nj  = _cuvJours(x.date_entree, fin);
      return (nj == null) ? null : nj;      // une cuve encore en cuve n'a pas de duree
    }
    return null;
  };
  return cuves.slice().sort(function(a, b){
    var x = val(a), y = val(b);
    if(x == null || y == null){
      if(x == null && y == null) return String(a.nom || '').localeCompare(String(b.nom || ''), 'fr');
      return x == null ? 1 : -1;
    }
    var d = (typeof x === 'string') ? x.localeCompare(y, 'fr') : (x - y);
    return d ? sg * d : String(a.nom || '').localeCompare(String(b.nom || ''), 'fr');
  });
}
window._cuvTrier = _cuvTrier;

function _cuvDoc(an, ctri){
  var cuves = (CAVE_VENDANGE.cuves_vinif || []).filter(function(c){ return _cuvAn(c) === String(an); })
    .sort(function(a, b){ return String(a.date_entree || '') < String(b.date_entree || '') ? -1 : 1; });
  if(!cuves.length){ showToast('Aucune cuve sur ' + an, '#B85A1A'); return; }
  cuves = _cuvTrier(cuves, ctri);

  var totVol = 0, totMes = 0, totSuc = 0, totRem = 0, totPig = 0;
  var sections = cuves.map(function(c){
    var mes = (c.mesures_fa || []).slice().sort(function(a, b){ return String(a.date) < String(b.date) ? -1 : 1; });
    var ops = (c.operations || []).slice().sort(function(a, b){ return String(a.date) < String(b.date) ? -1 : 1; });
    totVol += _vendVolContenu(c).hl;   // VOL-1
    totMes += mes.length;
    ops.forEach(function(o){ if(o.type === 'chaptalisation' && o.kg_sucre) totSuc += o.kg_sucre; });

    var rem = 0, pig = 0;
    var rows = mes.map(function(m){
      rem += (m.remontages || 0); pig += (m.pigeages || 0);
      var d20 = _vendMesD20(m);
      return '<tr><td>' + _vendFrDate(m.date) + '</td>'
        + '<td class="n">' + (m.densite != null ? Math.round(m.densite) : '—') + '</td>'
        + '<td class="n">' + (d20 != null ? Math.round(d20) : '—') + '</td>'
        + '<td class="n">' + (m.temp_c != null ? _mvF1(m.temp_c) : '—') + '</td>'
        + '<td class="n">' + (d20 != null ? Math.round(_vendSucreRest(c,d20)) : '—') + '</td>'
        + '<td class="n">' + (d20 != null ? _vendFaPct(c,d20) + ' %' : '—') + '</td>'
        + '<td class="n">' + (m.remontages || 0) + '</td>'
        + '<td class="n">' + (m.pigeages || 0) + '</td>'
        + '<td>' + _escHtml(m.note || '') + '</td></tr>';
    }).join('');
    totRem += rem; totPig += pig;

    var fin  = (c.decuvage && c.decuvage.date) || (mes.length ? mes[mes.length - 1].date : null);
    var nj   = _cuvJours(c.date_entree, fin);
    var dDeb = mes.length ? _vendMesD20(mes[0]) : null;
    var dFin = mes.length ? _vendMesD20(mes[mes.length - 1]) : null;

    /* La courbe d'abord, le tableau ensuite : l'une montre ce qui s'est
       passe, l'autre le prouve jour par jour. */
    var grf = _cuvDocGraph(c);
    var tbl = mes.length
      ? ('<table><thead><tr><th>Date</th><th class="n">Densité</th><th class="n">à 20 °C</th>'
          + '<th class="n">T °C</th><th class="n">Sucre g/L</th><th class="n">Avanc.</th>'
          + '<th class="n">Rem.</th><th class="n">Pig.</th><th>Note</th></tr></thead><tbody>'
          + rows
          + '<tr class="tot"><td>' + mes.length + ' relevé' + (mes.length > 1 ? 's' : '') + '</td>'
          + '<td class="n">' + (dDeb != null ? Math.round(dDeb) : '—') + '</td>'
          + '<td class="n">' + (dFin != null ? Math.round(dFin) : '—') + '</td>'
          + '<td colspan="3"></td>'
          + '<td class="n">' + rem + '</td><td class="n">' + pig + '</td><td></td></tr>'
          + '</tbody></table>')
      : '<div class="cd-vide">Aucun relevé de fermentation sur cette cuve.</div>';

    var tops = ops.length
      ? ('<table><thead><tr><th>Date</th><th>Opération</th><th>Détail</th><th>Note</th></tr></thead><tbody>'
          + ops.map(function(o){
              return '<tr><td>' + _vendFrDate(o.date) + '</td>'
                + '<td>' + _escHtml(_vendOpLbl(o.type)) + '</td>'
                + '<td>' + _escHtml(_rmDetail(o) || '—') + '</td>'
                + '<td>' + _escHtml(o.note || '') + '</td></tr>';
            }).join('')
          + '</tbody></table>')
      : '';

    var parc = (c.parcelles || []);
    var haP  = parc.reduce(function(s, n){ return s + _vendParcSurf(n); }, 0);
    var id = [];
    if(c.date_entree) id.push('<em>Entrée le <b>' + _vendFrDate(c.date_entree) + '</b></em>');
    /* ★ VOL-1 — « Contenance » et contenu, chacun sous son nom (§152b). */
    if(c.volume_hl)   id.push('<em>Contenance <b>' + _mvF1(c.volume_hl) + ' hL</b></em>');
    var _vc = _vendVolContenu(c);
    if(_vc.hl > 0)    id.push('<em>' + (_vc.src === 'mesure' ? 'D\u00e9cuv\u00e9' : 'Volume estim\u00e9') + ' <b>'
                        + _mvF1(_vc.hl) + ' hL</b>' + (_vc.src === 'estime' ? ' (' + Math.round(_vc.kg) + ' kg)' : '') + '</em>');
    if(parc.length)   id.push('<em>' + parc.length + ' parcelle' + (parc.length > 1 ? 's' : '')
                        + ' <b>' + _escHtml(parc.join(', ')) + '</b>'
                        + (haP > 0 ? ' (' + _mvF1(haP) + ' ha)' : '') + '</em>');
    if(c.nb_caisses)  id.push('<em>Apport <b>' + c.nb_caisses + ' caisses</b></em>');
    id.push('<em><b>' + _cuvErLbl(c.erasflage) + '</b></em>');
    id.push('<em>Levures <b>' + (c.levures === 'selectionnees' ? 'sélectionnées' : 'indigènes') + '</b></em>');
    if(c.so2_g_hl)    id.push('<em>SO₂ à l’encuvage <b>' + _mvF1(c.so2_g_hl) + ' g/hL</b></em>');
    if(c.mpf && c.mpf.active){
      /* ★ PARC-1 — la duree REELLE quand le parcours la connait, la duree
         PREVUE sinon, et alors annoncee comme telle. Un document qui imprime
         une intention sans le dire la fait passer pour un fait. */
      var _nMpf = _vendStatDuree(c, 'mpf');
      id.push('<em>Macération préfermentaire <b>' + _mvF1(c.mpf.temp_c || 0) + ' °C · '
        + (_nMpf != null ? (_nMpf + ' j') : ((c.mpf.duree_j || 0) + ' j prévus')) + '</b></em>');
    }
    var _parc = _vendHist(c);
    if(_parc.length) id.push('<em>Parcours <b>' + _parc.map(function(e){
      return _vendStatLbl(e.statut) + ' ' + _vendFrDate(e.date); }).join(' → ') + '</b></em>');
    if(nj != null)    id.push('<em>Cuvaison <b>' + nj + ' jour' + (nj > 1 ? 's' : '') + '</b></em>');

    var pied = '';
    if(c.decuvage && c.decuvage.date){
      var cu = (CAVE_ELEVAGE.cuvees || []).filter(function(x){ return x.id === c.decuvage.cuvee_id; })[0];
      pied = '<div class="cd-note"><b>Décuvée le ' + _vendFrDate(c.decuvage.date) + '</b>'
        + (cu ? ' → passée au Chai sous le nom « ' + _escHtml(cu.nom) + ' » (millésime '
            + _escHtml(String(cu.millesime || an)) + ')' : '') + '.</div>';
    }

    return '<div class="cd-cuve mvdoc-avoid"><h3>' + _escHtml(c.nom || 'Cuve')
      + '<span class="cd-tag">' + _escHtml(_vendStatLbl(c.statut)) + '</span></h3>'
      + '<div class="cd-idr">' + id.join('') + '</div>'
      + grf + tbl + (tops ? ('<h2 style="margin-top:9px">Opérations</h2>' + tops) : '') + pied + '</div>';
  }).join('');

  var enCours = cuves.filter(function(c){ return c.statut !== 'termine'; }).length;
  var corps = '<div class="cd-kpis">'
    + '<div class="cd-k"><b>Cuves</b><span>' + cuves.length + '</span><i>' + enCours
      + ' encore en cuve</i></div>'
    + '<div class="cd-k"><b>Volume</b><span>' + _mvF1(totVol) + ' <small>hL</small></span>'
      + '<i>à l’encuvage, saignées déduites</i></div>'
    + '<div class="cd-k"><b>Relevés</b><span>' + totMes + '</span><i>' + totRem + ' remontages · '
      + totPig + ' pigeages</i></div>'
    + '<div class="cd-k"><b>Sucre ajouté</b><span>' + _mvF1(totSuc) + ' <small>kg</small></span>'
      + '<i>toutes cuves confondues</i></div>'
    + '</div>'
    + _cmpBloc(cuves)
    + sections
    + '<div class="mvdoc-lim"><b>Ce document présente vos propres relevés.</b> '
    + 'C’est un état interne : il ne tient lieu d’aucune déclaration, et il ne remplace pas le '
    + 'registre des manipulations, qui reste le document du contrôle. '
    + 'La <b>densité à 20 °C</b> est votre densité corrigée par la température saisie — sans '
    + 'température, la valeur brute est reprise telle quelle. Le <b>sucre restant</b> et '
    + 'l’<b>avancement</b> sont estimés à partir de cette densité : ce sont des ordres de '
    + 'grandeur, jamais une analyse de laboratoire. '
    + 'La <b>courbe</b> est celle de l’écran, à l’identique : densité corrigée en trait '
    + 'plein sur l’axe de gauche, température en pointillé sur celui de droite, un repère '
    + 'en haut par opération datée, et le seuil du vin sec en tireté. Une cuve qui a moins '
    + 'de trois relevés de densité n’a pas de courbe : son tableau suffit. '
    + 'Le <b>comparatif</b> de tête aligne les cuves sur leur propre jour d’encuvage, et non sur '
    + 'le calendrier : c’est ce qui rend deux cinétiques superposables. Le <b>sucre à la vigne</b> '
    + 'est la dernière analyse d’avant encuvage de chaque parcelle de la cuve, pondérée par la '
    + 'surface ; la part réelle de chaque parcelle entrée dans la cuve n’étant pas connue, c’est '
    + 'un ordre de grandeur. La colonne <b>vin sec</b> donne le jour où 996 a été <b>relevé</b>, '
    + 'jamais un jour interpolé ; en italique, la cuve n’y est pas encore et le dernier point est '
    + 'rappelé. La colonne <b>pts/j</b> porte l’intervalle sur lequel elle est calculée : '
    + 'une pente moyenne sur trois jours n’est <b>pas comparable</b> à une pente sur dix, le début '
    + 'd’une fermentation en étant la phase la plus rapide.</div>';

  if(typeof window._mvDocOpen !== 'function'){
    showToast('Mise à jour incomplète — rechargez l’application', '#B85A1A'); return;
  }
  window._mvDocOpen({
    titre: 'Cahier de cuverie ' + an,
    orient: 'portrait', cat: 'cave', css: MV_CUVDOC_CSS, corps: corps,
    metas: [cuves.length + ' cuve' + (cuves.length > 1 ? 's' : ''),
            totMes + ' relevé' + (totMes > 1 ? 's' : '') + ' de fermentation',
            (typeof window._mvTriPhrase === 'function' && ctri)
              ? ('Trié par ' + window._mvTriPhrase({ cles: MV_TRI_CUVERIE }, ctri)) : '',
            'Édité le ' + new Date().toLocaleDateString('fr-FR')]
  });
  showToast('Cahier de cuverie ' + an, '#3D6B27');
}

window._cuvExportChoix = function(){
  var ans = _cuvAnnees();
  if(!ans.length){ showToast('Aucune cuve de vinification enregistr\u00e9e', '#B85A1A'); return; }
  var opts = {
    titre:'Cahier de cuverie', icone:'seau', memo:'cuverie',
    sub:'Une cuve appartient \u00e0 l\u2019ann\u00e9e o\u00f9 elle est entr\u00e9e. Choisissez la vendange, puis l\u2019ordre des pages.',
    annees:ans, anLbl:'Vendange',
    cles:MV_TRI_CUVERIE, defaut:{ cle:'encuvage', sens:'asc' },
    btn:'\u00c9diter le cahier',
    note:function(c){
      if(c.cle === 'encuvage')
        return 'Le cahier se lit comme la vendange s\u2019est pass\u00e9e\u00a0: dans l\u2019ordre o\u00f9 les cuves ont '
             + '\u00e9t\u00e9 remplies.';
      if(c.cle === 'duree')
        return 'Une cuve <b>encore en cuve</b> n\u2019a pas de dur\u00e9e de cuvaison\u00a0: elle part en fin de '
             + 'liste, dans les deux sens.';
      return 'Une page par cuve, dans l\u2019ordre choisi. Le comparatif de t\u00eate, lui, garde son '
           + 'alignement sur le jour d\u2019encuvage.';
    },
    cb:function(c){ _cuvDoc(c.an, c); }
  };
  if(typeof window._mvTriOuvrir !== 'function' || !window._mvTriOuvrir(opts))
    _cuvDoc(ans[0], { cle:'encuvage', sens:'asc' });
};
window._cuvDoc     = _cuvDoc;
window._cuvAnnees  = _cuvAnnees;

/* ══ LE PONT VERS PILOTAGE › CAVE › LES COURBES (PILCRB-1) ═══════════════
   ★★★ LE NOM EXPOSE N'EST PAS LE NOM INTERNE, ET C'EST DELIBERE.
   `window._cmpVisibles`, `_cmpCouleur`, `_cmpEchelle`, `_cmpAnneeExercice` et
   `_cmpFenetre` appartiennent DEJA a reglages.js, ou `_cmp` veut dire
   « CAMPAGNE ». Exposer `window._cmpSvg` depuis la cave mettrait deux sujets
   sans rapport sous le meme prefixe global : le jour ou quelqu'un cherche
   « a quoi sert _cmp », il trouverait deux reponses.
   ⚠️ Ce n'est PAS une seconde fonction : §88e exige que le comparatif monte a
   l'ecran en appelant `_cmpSvg`, et c'est exactement `_cmpSvg` qui est derriere
   `_cuvCmpSvg`. Une seule implementation, un nom global desambiguïse. */
window._cuvCmpSeries  = _cmpSeries;
window._cuvCmpSvg     = _cmpSvg;
window._cuvCmpTempSvg = _cmpTempSvg;
window._cuvCmpVigne   = _cmpVigne;
window._cuvCmpMin     = MV_CMP_MIN;
window._cuvCmpEcarte  = _cmpEcarte;
/* Le seuil du vin sec : l'ecran des courbes l'ECRIT dans sa legende. Sans
   exposition il aurait fallu le recopier — et deux 996 dans deux fichiers,
   c'est un jour ou l'un des deux change seul. */
window._ML_D20_SEC    = _ML_D20_SEC;
/* Blocs 1 et 4 : l'ecran des courbes REUTILISE des traces qui existent. Il ne
   redessine ni la maturite ni la chaine des volumes (§86).
   ⚠️⚠️ `_vendMatSvg` N'EST PAS EXPOSEE DIRECTEMENT, et c'est le point important.
   Sa signature est `(byP, w, opt)` : un OBJET de regroupement, pas la
   collection. Exposer la fonction nue obligerait pilotage.js a refaire ce
   regroupement — et le jour ou la regle de regroupement change ici, l'autre
   fichier continuerait tranquillement avec l'ancienne. C'est la lecon
   « verifier les signatures d'entree, pas seulement les contrats de retour » :
   `_mvFutParc` appelee nue rendait un parc a ZERO, en silence.
   On expose donc un POINT D'ENTREE qui porte le regroupement ET l'objectif. */
window._cuvMatSvg = function(w){
  var byP = {};
  (CAVE_VENDANGE.analyses || []).forEach(function(a){
    if(!a || !a.parcelle) return;
    (byP[a.parcelle] = byP[a.parcelle] || []).push(a);
  });
  if(!Object.keys(byP).length) return '';
  /* L'objectif n'existe que si le domaine l'a pose : absent, la ligne ne
     s'affiche pas. Meme appel que l'ecran des analyses — pas un second. */
  return _vendMatSvg(byP, w, { objectif: parseFloat(_vendCfg().mat_objectif) || 0 });
};
window._caveBilanChaine  = _caveBilanChaine;
window._caveBtlGraphSvg  = _caveBtlGraphSvg;
window._mlMesMalo     = _mlMesMalo;

// ══ LA FRONTIÈRE — ce que Le Cuvier (cuvier.js) lit du Chai ═════════════════
// ★ CUV-DEC (§164) — chacun de ces noms est lu par cuvier.js, chargé juste après ce
//   fichier. Retirer une ligne : ReferenceError au premier geste qui passe par là
//   (mv-harnais-globaux et mv-harnais-cuvier le voient avant le build).
window._caveIntLabel = _caveIntLabel;
window._caveSaisBanner = _caveSaisBanner;
window._caveSectionAct = _caveSectionAct;
window._mvgId = _mvgId;
window._cuvLev = _cuvLev;
window._mvF1 = _mvF1;
window._anaSpd = _anaSpd;
window._caveV2InjectCss = _caveV2InjectCss;
window._apportsRangs = _apportsRangs;
window._apportsPied = _apportsPied;
window._fermLegende = _fermLegende;
window._cuveCouches = _cuveCouches;
window._apTronc = _apTronc;
window._remplirPied = _remplirPied;
window._parcCoul = _parcCoul;
window._mvQ = _mvQ;
window._mlAuj = _mlAuj;
window._mlEcartJ = _mlEcartJ;
window._mlCampagne = _mlCampagne;
window._mlKgHl = _mlKgHl;
window.MV_CUVDOC_CSS = MV_CUVDOC_CSS;
window._cmpVigne = _cmpVigne;
