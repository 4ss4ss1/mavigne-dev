// =============================================================================
// Ma Vigne — LE COMPTEUR DES TRACTEURS (src/compteur.js) — COMPT-1 à COMPT-5 (§483–§487), sorti de tracteur.js par COMPT-6 (§488)
// -----------------------------------------------------------------------------
// Les relevés, l'estimation entre deux relevés, la feuille du relevé (pavé, contrôles, correction), le relevé au passage, la
// révision et ses intervalles, le compteur exigé au démarrage, la fiche du compteur sur ordinateur, les autres entretiens.
// tracteur.js l'importe en tête et l'appelle par des relais (mêmes noms, par window) ; ce fichier emprunte au Tracteur ses outils
// et sa sélection par window._trPont (§488). Les harnais compt1 à compt5 lisent tracteur.js + ce fichier, bout à bout.
// © 2026 Nicolas GUÉRET / GUERETTECH
// =============================================================================
import { isAdmin, isTractoriste, showToast, _escHtml, _escAttr, _mvIcon } from './utils.js';
function _P(){ return (typeof window!=='undefined'&&window._trPont)||{}; }
function _chrMes(x){ return _P().chrMes(x); }
function _chrNom(x){ return _P().chrNom(x); }
function _closeOv(e,id){ return _P().closeOv(e,id); }
function _fmtDate(d){ return _P().fmtDate(d); }
function _gnrField(i,l,v){ return _P().gnrField(i,l,v); }
function _gnrNum(n){ return _P().gnrNum(n); }
function _gnrTodayISO(){ return _P().gnrTodayISO(); }
function _openOv(id){ return _P().openOv(id); }
function _saveData(k){ return _P().saveData(k); }
function _trHeuresFr(h){ return _P().trHeuresFr(h); }
function getTracteurSel(){ return _P().getTracteurSel(); }
function renderEntretiens(){ return _P().renderEntretiens(); }
function renderTracteur(){ return _P().renderTracteur(); }
function _trSelTracteur(){ return _P().selId()?getTracteurSel():null; }

// ★ COMPT-1 (§483) — LE COMPTEUR AVANCE TOUT SEUL, ON LE RELÈVE AU PASSAGE (docs/maquettes/maquette-compteur-tracteur-v1.html ; « go » de Nico, 29/10)
//   Chaque tracteur garde ses relevés : t.releves = [{d, ts, h, par, src}] (src : jour, plein, manuel ; « pas devant le tracteur »
//   = {d, ts, par, src:'jour', manque:true}, sans h ; les 120 derniers). compteur_h reste le DERNIER VRAI RELEVÉ : ce qui le lit
//   encore reste juste. Entre deux relevés, le compteur S'ESTIME : dernier relevé + heures notées depuis (chrono, sinon barème —
//   la règle de _pilGmHeuresSession, pilotage.js) × l'écart appris (médiane « compteur ÷ heures notées » des cinq derniers
//   intervalles d'au moins 2 h notées ; 1 tant qu'il y en a moins de deux ; borné 0,8–2 : la route et le ralenti tournent au
//   cadran sans être notés). Jamais sous le relevé. Le relevé se demande AU PASSAGE : une fois par jour et par tracteur, quand on
//   referme la feuille après y avoir coché ou mesuré, ou qu'on termine ; au plein, il est exigé. Trois contrôles (Fleetio) :
//   plus bas que le dernier, refusé ; plus de 24 h par jour écoulé, refusé ; plus de 1,5 fois l'attendu et 10 h d'écart, à confirmer.
var _TR_REL_MAX=120, _trSdAvant=null, _rel={tid:null, src:'jour', buf:'', apres:null};
function _trIso(d){ var m=d.getMonth()+1, j=d.getDate(); return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(j<10?'0':'')+j; }
function _trJours(a,b){ var x=Date.UTC(+a.slice(0,4),+a.slice(5,7)-1,+a.slice(8,10)), y=Date.UTC(+b.slice(0,4),+b.slice(5,7)-1,+b.slice(8,10)); return Math.round((y-x)/86400000); }
function _trTidSession(s){
  var v=(s&&s.tracteurId)||'';
  if(!v){ var a=(window.ACTIVITES||[]).find(function(x){ return x&&s&&x.nom===s.activite; }); v=(a&&a.tracteurDefautId)||''; }
  var t=(TRACTEURS_LIST||[]).find(function(x){ return x.id===v||x.nom===v; });
  return t?t.id:v;
}
function _trHeuresNotees(tid){
  var acts=window.ACTIVITES||[], parcs=window.PARCELLES||[], out=[];
  (window.SESSIONS||[]).forEach(function(se){
    if(!se||_trTidSession(se)!==tid) return;
    var act=acts.find(function(a){ return a&&a.nom===se.activite; }), hha=act?(parseFloat(act.h_ha)||0):0;
    (Array.isArray(se.parcellesFaites)?se.parcellesFaites:[]).forEach(function(x){
      var nom=_chrNom(x); if(!nom) return;
      var m=_chrMes(x), h;
      if(m>0) h=m/60;
      else { if(hha<=0) return; var p=parcs.find(function(pp){ return pp&&pp.nom===nom; }); h=(p?(parseFloat(p.surface)||0):0)*hha; }
      if(!(h>0)) return;
      var ts=(x&&typeof x==='object'&&typeof x.t1==='number')?x.t1:null;
      var iso=ts?_trIso(new Date(ts)):String(se.date||'').slice(0,10);
      if(iso) out.push({ts:ts, iso:iso, h:h});
    });
  });
  return out;
}
function _trNoteesEntre(liste,a,b){
  return liste.reduce(function(acc,r){
    var apres=(r.ts&&a.ts)?(r.ts>a.ts):(r.iso>a.d), avant=!b?true:((r.ts&&b.ts)?(r.ts<=b.ts):(r.iso<=b.d));
    return acc+((apres&&avant)?r.h:0);
  },0);
}
function _trEcart(vrais,liste){
  var rap=[];
  for(var i=1;i<vrais.length;i++){ var dh=Number(vrais[i].h)-Number(vrais[i-1].h), n=_trNoteesEntre(liste,vrais[i-1],vrais[i]); if(n>=2&&dh>=0) rap.push(dh/n); }
  rap=rap.slice(-5); if(rap.length<2) return 1;
  rap.sort(function(x,y){ return x-y; });
  var k=rap.length, med=k%2?rap[(k-1)/2]:(rap[k/2-1]+rap[k/2])/2;
  return Math.min(2,Math.max(0.8,med));
}
function _trVrais(t){
  return ((t&&Array.isArray(t.releves))?t.releves:[]).filter(function(r){ return r&&!r.manque&&!r.ecarte&&r.d&&r.h!==''&&r.h!=null&&isFinite(Number(r.h)); })
    .slice().sort(function(a,b){ return String(a.d).localeCompare(String(b.d))||((a.ts||0)-(b.ts||0)); });
}
function _trCompteur(t){
  if(!t) return null;
  var vrais=_trVrais(t), base=vrais.length?vrais[vrais.length-1]:null, c=t.compteur_h;
  if(!base&&c!=null&&c!==''&&isFinite(Number(c))) base={h:Number(c), d:null, ts:null, par:'', src:'ancien'};
  if(!base) return null;
  var auj=_gnrTodayISO(), liste=base.d?_trHeuresNotees(t.id):[], coef=base.d?_trEcart(vrais,liste):1, notees=base.d?_trNoteesEntre(liste,base,null):0;
  return { h:Math.round((Number(base.h)+notees*coef)*10)/10, base:base, estime:notees>0, notees:notees, coef:coef, aujourdhui:base.d===auj, jours:base.d?_trJours(base.d,auj):null };
}
function _trHeuresTxt(k){ return k?((k.estime?'env.\u00a0':'')+_gnrNum(k.estime?Math.round(k.h):k.h)+'\u00a0h'):''; }
// ★ COMPT-2 (§484) — LA RÉVISION SE RECALCULE ; LE COMPTEUR EXIGÉ AU DÉMARRAGE QUAND ÇA COMPTE (maquette-compteur-tracteur-v1.html)
//   Un tracteur règle une fois son intervalle : t.rev_h (toutes les N heures) et/ou t.rev_mois (tous les N mois), au premier
//   atteint. « Révision faite » demande le compteur (la feuille du relevé, src 'revision'), note t.rev_fait_h / t.rev_fait_d et
//   calcule la suivante : revision_h = compteur + rev_h (tous les lecteurs le lisent déjà), t.rev_date = aujourd'hui + rev_mois.
//   Sans intervalle, la révision est notée et la carte dit de le régler. Au démarrage d'une session (saveSession), un tracteur
//   SUIVI dont la révision est à 50 h ou moins, à 14 jours ou dépassée — ou sans vrai relevé depuis 7 jours — exige son compteur :
//   la session part avec lui. Un tracteur NON SUIVI (ni révision, ni compteur, ni relevé, ni intervalle : un domaine qui ne tient
//   pas les heures) n'est jamais interrogé — au passage non plus.
function _trSuivi(t){ return !!t&&((t.revision_h!=null&&t.revision_h!=='')||(t.compteur_h!=null&&t.compteur_h!=='')||(Array.isArray(t.releves)&&t.releves.length>0)||Number(t.rev_h)>0||Number(t.rev_mois)>0); }
function _trAjoutMois(iso,n){ var y=+iso.slice(0,4), m=+iso.slice(5,7)-1+Number(n), d=+iso.slice(8,10); var dt=new Date(Date.UTC(y,m,1)), fin=new Date(Date.UTC(dt.getUTCFullYear(),dt.getUTCMonth()+1,0)).getUTCDate(); dt.setUTCDate(Math.min(d,fin)); return dt.toISOString().slice(0,10); }
function _trDateAn(iso){ try{ return new Date(String(iso)+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}); }catch(e){ return String(iso); } }   // une échéance d'un an dit son année
function _trRevDate(t){ var d=t&&t.rev_date; if(!d||!/^\d{4}-\d{2}-\d{2}$/.test(String(d))) return null; return {d:String(d), jours:_trJours(_gnrTodayISO(),String(d))}; }
function _trRevEtat(t){
  var k=_trCompteur(t), rev=t&&t.revision_h, aH=!!k&&rev!=null&&rev!=='', dt=_trRevDate(t);
  if(!aH&&!dt) return null;
  var reste=aH?Math.round(Number(rev)-k.h):null, j=dt?dt.jours:null;
  var dep=(reste!=null&&reste<0)||(j!=null&&j<0), rouge=dep||(reste!=null&&reste<=50)||(j!=null&&j<=14), orange=!rouge&&((reste!=null&&reste<=120)||(j!=null&&j<=30));
  return {k:k, reste:reste, jours:j, date:dt?dt.d:null, depasse:dep, rouge:rouge, orange:orange};
}
function _trReleveExige(t){
  if(!t||!_trSuivi(t)||(REPARATEUR&&REPARATEUR[t.id])) return '';
  var k=_trCompteur(t); if(k&&k.aujourdhui) return '';
  var e=_trRevEtat(t);
  if(e&&e.depasse) return 'depassee';
  if(e&&((e.reste!=null&&e.reste<=50)||(e.jours!=null&&e.jours<=14))) return 'proche';
  var _eu=(typeof _trEntPlusUrgent==='function')?_trEntPlusUrgent(t):null;   // ★ COMPT-5 (§487) : un autre entretien rouge compte aussi
  if(_eu&&_eu.depasse) return 'depassee'; if(_eu&&_eu.rouge) return 'proche';
  if(!k||!k.base.d||k.jours>=7) return 'vieux';
  return '';
}
// ★ COMPT-3 (§485) — LA FICHE DU COMPTEUR, SUR ORDINATEUR (maquette-compteur-tracteur-v1.html, « Tracteur › Entretien »)
//   Sous la carte Révision, à partir de 1 024 px : ce que Ma Vigne a appris (l'écart, le rythme AU COMPTEUR sur 4 semaines,
//   le repère de révision en jours ouvrés du lundi au vendredi), la courbe (les vrais relevés, l'estimé jusqu'à aujourd'hui, la
//   révision, le repère) et les dix derniers relevés, avec l'écart à l'estimé (le relevé d'avant + les heures notées entre les
//   deux × l'écart d'aujourd'hui). L'admin ÉCARTE un chiffre faux : il reste écrit, barré, mais ne compte plus (ni base, ni
//   écart, ni rythme) ; « Rétablir » le remet. Le « void » de Fleetio.
var _TR_SRC={jour:'fin de journ\u00e9e', plein:'plein', revision:'r\u00e9vision faite', demarrage:'d\u00e9marrage', manuel:'\u00e0 la main'};
function _trUtc(iso){ return Date.UTC(+iso.slice(0,4),+iso.slice(5,7)-1,+iso.slice(8,10)); }
function _trFerie(ms){ var F=(typeof window!=='undefined'&&typeof window._feriesY==='function')?window._feriesY(new Date(ms).getUTCFullYear()):null, dt=new Date(ms); return !!(F&&F[dt.getUTCMonth()]&&F[dt.getUTCMonth()][dt.getUTCDate()]); }   // ★ COMPT-4 (§486) : les fériés du planning (_feriesY)
function _trJoursOuvres(a,b){ var n=0, y=_trUtc(b); for(var d=_trUtc(a)+86400000; d<=y; d+=86400000){ var w=new Date(d).getUTCDay(); if(w>=1&&w<=5&&!_trFerie(d)) n++; } return n; }
function _trAjoutOuvres(iso,n){ var d=_trUtc(iso), k=0; while(k<n){ d+=86400000; var w=new Date(d).getUTCDay(); if(w>=1&&w<=5&&!_trFerie(d)) k++; } return new Date(d).toISOString().slice(0,10); }
function _trRythme(t){
  var auj=_gnrTodayISO(), lim=new Date(_trUtc(auj)-28*86400000).toISOString().slice(0,10);
  var v=_trVrais(t).filter(function(r){ return r.d>=lim; }); if(v.length<2) return null;
  var a=v[0], b=v[v.length-1], jo=_trJoursOuvres(a.d,b.d), dh=Number(b.h)-Number(a.h);
  if(jo<3||!(dh>0)) return null;
  return { h:dh/jo, n:v.length };
}
function _trRepere(t){ var e=_trRevEtat(t), r=_trRythme(t); if(!e||e.reste==null||e.reste<=0||!r) return null; var n=Math.ceil(e.reste/r.h); return { n:n, d:_trAjoutOuvres(_gnrTodayISO(),n) }; }
function _trLignesReleves(t){
  var tout=((t&&Array.isArray(t.releves))?t.releves:[]).filter(function(r){ return r&&r.d; }).slice().sort(function(a,b){ return String(a.d).localeCompare(String(b.d))||((a.ts||0)-(b.ts||0)); });
  var liste=_trHeuresNotees(t.id), coef=_trEcart(_trVrais(t),liste), prev=null, out=[];
  tout.forEach(function(r){
    var vrai=!r.manque&&!r.ecarte&&r.h!=null&&r.h!==''&&isFinite(Number(r.h)), ecart=null;
    if(vrai&&prev) ecart=Number(r.h)-(Number(prev.h)+_trNoteesEntre(liste,prev,r)*coef);
    out.push({ r:r, vrai:vrai, ecart:ecart });
    if(vrai) prev=r;
  });
  return out.reverse().slice(0,10);
}
function _trCourbeSvg(t){
  var v=_trVrais(t).slice(-12); if(!v.length) return '';
  var k=_trCompteur(t), rp=_trRepere(t), auj=_gnrTodayISO(), rev=(t.revision_h!=null&&t.revision_h!=='')?Number(t.revision_h):null;
  var d0=v[0].d, d1=(rp&&rp.d>auj)?rp.d:auj; if(d1<=d0) d1=_trAjoutOuvres(d0,1);
  var hs=v.map(function(r){ return Number(r.h); }).concat(k?[k.h]:[]), lo=Math.min.apply(null,hs), hi=Math.max.apply(null,hs);
  if(rev!=null&&rev>hi&&rev<=hi+Math.max(60,(hi-lo)*1.5)) hi=rev;
  var pad=Math.max(5,(hi-lo)*0.08); lo-=pad; hi+=pad;
  var W=560, H=180, L=46, Rd=12, T=12, B=26, t0=_trUtc(d0), t1=_trUtc(d1);
  var X=function(iso){ return L+(_trUtc(iso)-t0)/(t1-t0)*(W-L-Rd); }, Y=function(h){ return T+(1-(h-lo)/(hi-lo))*(H-T-B); }, f=function(n){ return n.toFixed(1); };
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Courbe du compteur\u00a0: les relev\u00e9s et l\u2019estim\u00e9 jusqu\u2019\u00e0 aujourd\u2019hui'+(rev!=null?', avec la r\u00e9vision':'')+'">';
  [lo+pad,(lo+hi)/2,hi-pad].forEach(function(h){ s+='<line x1="'+L+'" x2="'+(W-Rd)+'" y1="'+f(Y(h))+'" y2="'+f(Y(h))+'" style="stroke:var(--ligne,var(--gris-clair))"/><text x="'+(L-6)+'" y="'+f(Y(h)+4)+'" text-anchor="end" class="cpt-ax">'+_escHtml(_gnrNum(Math.round(h)))+'</text>'; });
  s+='<text x="'+L+'" y="'+(H-8)+'" class="cpt-ax">'+_escHtml(_fmtDate(d0))+'</text><text x="'+f(X(auj))+'" y="'+(H-8)+'" text-anchor="middle" class="cpt-ax">aujourd\u2019hui</text>';
  if(rev!=null&&rev>=lo&&rev<=hi) s+='<line x1="'+L+'" x2="'+(W-Rd)+'" y1="'+f(Y(rev))+'" y2="'+f(Y(rev))+'" style="stroke:var(--rouge)" stroke-dasharray="6 4"/><text x="'+(L+6)+'" y="'+f(Y(rev)-5)+'" class="cpt-ax cpt-rev">R\u00e9vision \u00e0 '+_escHtml(_gnrNum(rev))+'\u00a0h</text>';
  s+='<polyline fill="none" style="stroke:var(--texte-doux)" stroke-width="2" points="'+v.map(function(r){ return f(X(r.d))+','+f(Y(Number(r.h))); }).join(' ')+'"/>';
  var der=v[v.length-1];
  if(k&&k.estime&&auj>der.d) s+='<line x1="'+f(X(der.d))+'" y1="'+f(Y(Number(der.h)))+'" x2="'+f(X(auj))+'" y2="'+f(Y(k.h))+'" style="stroke:var(--texte-doux)" stroke-width="2" stroke-dasharray="4 3"/><circle cx="'+f(X(auj))+'" cy="'+f(Y(k.h))+'" r="4" style="fill:var(--bg-card);stroke:var(--texte-doux)" stroke-width="2"/>';
  if(rp&&rev!=null&&k&&rev<=hi) s+='<line x1="'+f(X(auj))+'" y1="'+f(Y(k.h))+'" x2="'+f(X(rp.d))+'" y2="'+f(Y(rev))+'" style="stroke:var(--orange)" stroke-width="2" stroke-dasharray="1 4" stroke-linecap="round"/><text x="'+f(X(rp.d))+'" y="'+f(Y(rev)+14)+'" text-anchor="end" class="cpt-ax cpt-rep">rep\u00e8re '+_escHtml(_trDateAn(rp.d))+'</text>';
  v.forEach(function(r){ var x=X(r.d), y=Y(Number(r.h)); s+=r.src==='plein'?'<rect x="'+f(x-4)+'" y="'+f(y-4)+'" width="8" height="8" rx="1" style="fill:var(--texte)"/>':'<circle cx="'+f(x)+'" cy="'+f(y)+'" r="4" style="fill:var(--texte)"/>'; });
  return s+'</svg>';
}
function _trFicheCptHtml(t){
  if(!t||!_trSuivi(t)) return '';
  var k=_trCompteur(t); if(!k&&!(t.releves||[]).length) return '';
  var adm=isAdmin(), vrais=_trVrais(t), liste=_trHeuresNotees(t.id), coef=_trEcart(vrais,liste), nInt=0, auj=_gnrTodayISO();
  for(var i=1;i<vrais.length;i++){ if(_trNoteesEntre(liste,vrais[i-1],vrais[i])>=2) nInt++; }
  var ry=_trRythme(t), rp=_trRepere(t), n30=vrais.filter(function(r){ return _trJours(r.d,auj)<=30; }).length, cf=String(Math.round(coef*10)/10).replace('.',',');
  var appris='<div><b>\u00d7\u00a0'+cf+'</b>\u00a0: '+(nInt>=2?'le cadran tourne '+cf+' fois les heures not\u00e9es (route, ralenti), appris sur '+Math.min(nInt,5)+' intervalles.':'pas encore appris\u00a0: il faut deux intervalles d\u2019au moins 2\u00a0h not\u00e9es.')+'</div>'
    +'<div>'+(ry?'<b>'+_trHeuresFr(ry.h)+'\u00a0h</b> par jour ouvr\u00e9 au compteur, sur 4 semaines'+(rp?'\u00a0; r\u00e9vision dans environ '+rp.n+' jour'+(rp.n>1?'s':'')+' ouvr\u00e9'+(rp.n>1?'s':'')+', vers le '+_escHtml(_trDateAn(rp.d))+'\u00a0: un rep\u00e8re, pas une date promise':'')+'.':'Rythme au compteur\u00a0: il faut deux relev\u00e9s sur 4 semaines.')+'</div>'
    +'<div><b>'+n30+'</b> relev\u00e9'+(n30>1?'s':'')+' en 30 jours.</div>';
  var rows='';
  if(k&&k.estime) rows+='<tr class="cpt-est"><td>'+_escHtml(_fmtDate(auj))+'</td><td class="r">'+_escHtml(_trHeuresTxt(k))+'</td><td>estim\u00e9, pas encore relev\u00e9</td><td>\u2014</td><td class="r">\u2014</td>'+(adm?'<td></td>':'')+'</tr>';
  _trLignesReleves(t).forEach(function(L){
    var r=L.r, src=r.manque?'\u00ab\u00a0pas devant le tracteur\u00a0\u00bb':(_TR_SRC[r.src]||'relev\u00e9');
    var ec=(L.ecart==null||r.ecarte)?'\u2014':((L.ecart>=0?'+':'\u2212')+_gnrNum(Math.abs(Math.round(L.ecart*10)/10))+'\u00a0h');
    var cls=r.manque?'cpt-manque':(r.ecarte?'cpt-ecarte':''), act='';
    if(adm) act=(!r.manque&&r.ts)?'<td class="r">'+(r.ecarte?'':'<button type="button" class="cpt-act" onclick="_trRelCorriger(\''+_escAttr(t.id)+'\','+Number(r.ts)+')">Corriger</button> ')+'<button type="button" class="cpt-act" onclick="_trRelEcarte(\''+_escAttr(t.id)+'\','+Number(r.ts)+')">'+(r.ecarte?'R\u00e9tablir':'\u00c9carter')+'</button></td>':'<td></td>';
    rows+='<tr'+(cls?' class="'+cls+'"':'')+'><td>'+_escHtml(_fmtDate(r.d))+'</td><td class="r">'+(r.manque?'\u2014':_escHtml(_gnrNum(r.h))+'\u00a0h')+'</td><td>'+src+(r.ecarte?' \u00b7 \u00e9cart\u00e9':'')+'</td><td>'+_escHtml(r.par||'\u2014')+'</td><td class="r">'+ec+'</td>'+act+'</tr>';
  });
  return '<section class="ent-resume-card cpt-fiche" aria-label="Le compteur du tracteur">'
    +'<div class="cpt-titre">Le compteur</div>'
    +'<div class="cpt-grille"><div class="cpt-appris">'+appris+'</div><div class="cpt-courbe">'+_trCourbeSvg(t)+'</div></div>'
    +(rows?'<div class="cpt-tab"><table class="cpt-releves"><thead><tr><th>Jour</th><th class="r">Compteur</th><th>D\u2019o\u00f9</th><th>Par</th><th class="r">\u00c9cart \u00e0 l\u2019estim\u00e9</th>'+(adm?'<th><span class="cpt-cache">Actions</span></th>':'')+'</tr></thead><tbody>'+rows+'</tbody></table></div>':'')
  +'</section>';
}
// ★ COMPT-4 (§486) — « CORRIGER » UN RELEVÉ (admin, la fiche du compteur) : la même feuille, bornée entre le vrai relevé
//   d'avant et celui d'après (le contrôle de séquence de Fleetio). Le chiffre d'avant reste dans r.corrige ; Annuler le remet.
function _relEtatCorr(v,b){
  if(v==null) return {k:'vide', t:'Tape le bon chiffre.'};
  if(v<b.min) return {k:'bas', t:'Plus bas que le relev\u00e9 d\u2019avant ('+_gnrNum(b.min)+'\u00a0h).'};
  if(v>b.max) return {k:'imp', t:'Plus haut que le relev\u00e9 d\u2019apr\u00e8s ('+_gnrNum(b.max)+'\u00a0h).'};
  return {k:'ok', t:'Entre le relev\u00e9 d\u2019avant et celui d\u2019apr\u00e8s\u00a0: coh\u00e9rent.'};
}
// ★ COMPT-5 (§487) — PLUSIEURS ENTRETIENS PAR TRACTEUR (maquette-compteur-tracteur-v1.html, « Entretiens programmés »)
//   t.entretiens_prog = [{id, nom, tous_h, tous_mois, fait_h, fait_d}] : ce qui se fait à côté de la révision (vidange de pont et
//   boîte, filtres, graissage…). Échéance au premier atteint : fait_h + tous_h (au compteur estimé), fait_d + tous_mois. Seuils à
//   la mesure de l'intervalle — rouge à un dixième (5 h au moins) ou 14 jours, orange au quart (10 h au moins) ou 30 jours —,
//   parce qu'un graissage toutes les 50 h serait sinon toujours rouge. « Fait » demande le compteur (la feuille, src 'entretien') ;
//   « Révision faite » propose de cocher ceux faits en même temps. L'admin ajoute, règle, retire. Le plus urgent remonte dans le
//   parc et compte pour le compteur exigé au démarrage. La révision elle-même reste sur revision_h (tous les lecteurs le lisent).
var _entProgEdit=null;
function _trEntEtat(t,e){
  var k=_trCompteur(t), th=Number(e&&e.tous_h)||0, tm=Number(e&&e.tous_mois)||0;
  var aH=th>0&&!!k&&e.fait_h!==''&&e.fait_h!=null&&isFinite(Number(e.fait_h)), aD=tm>0&&!!e.fait_d&&/^\d{4}-\d{2}-\d{2}$/.test(String(e.fait_d));
  var ph=aH?Math.round((Number(e.fait_h)+th)*10)/10:null, pd=aD?_trAjoutMois(String(e.fait_d),tm):null;
  var reste=aH?Math.round(ph-k.h):null, j=pd?_trJours(_gnrTodayISO(),pd):null;
  if(reste==null&&j==null) return {connu:false, ph:null, pd:null, reste:null, jours:null, depasse:false, rouge:false, orange:false};
  var sr=Math.max(5,th*0.1), so=Math.max(10,th*0.25);
  var dep=(reste!=null&&reste<0)||(j!=null&&j<0), rouge=dep||(reste!=null&&reste<=sr)||(j!=null&&j<=14), orange=!rouge&&((reste!=null&&reste<=so)||(j!=null&&j<=30));
  return {connu:true, ph:ph, pd:pd, reste:reste, jours:j, depasse:dep, rouge:rouge, orange:orange};
}
function _trEntTexte(e,s){
  if(!s.connu) return 'jamais not\u00e9';
  var p=[];
  if(s.reste!=null) p.push(s.reste<0?'d\u00e9pass\u00e9 de '+_gnrNum(-s.reste)+'\u00a0h':'dans '+_gnrNum(s.reste)+'\u00a0h');
  if(s.pd) p.push(s.jours<0?'date d\u00e9pass\u00e9e':'le '+_trDateAn(s.pd));
  return p.join(' ou ');
}
function _trEntIntervalle(e){ var th=Number(e.tous_h)||0, tm=Number(e.tous_mois)||0; return (th>0&&tm>0)?('toutes les '+_gnrNum(th)+'\u00a0h ou '+_gnrNum(tm)+' mois'):th>0?('toutes les '+_gnrNum(th)+'\u00a0h'):tm>0?('tous les '+_gnrNum(tm)+' mois'):''; }
function _trEntPlusUrgent(t){
  var best=null;
  ((t&&t.entretiens_prog)||[]).forEach(function(e){ var s=_trEntEtat(t,e); if(!s.connu) return; var rang=s.depasse?0:s.rouge?1:s.orange?2:3; if(!best||rang<best.rang) best={e:e, s:s, rang:rang, depasse:s.depasse, rouge:s.rouge}; });
  return best;
}
function _trEntUrgent(t){ var b=_trEntPlusUrgent(t); return (b&&b.rouge)?(' \u00b7 '+[b.e.nom,_trEntTexte(b.e,b.s)].join(' ')):''; }
function _trEntForm(e){
  var v=e||{};
  return '<div class="ep-form">'
    +'<div class="ep-l">Nom</div><input type="text" id="ep-nom" class="mvchamp" value="'+_escAttr(v.nom||'')+'" placeholder="ex. Vidange pont et bo\u00eete" style="width:100%">'
    +'<div class="ep-2">'+_gnrField('ep-tous-h','Toutes les (h)',v.tous_h)+_gnrField('ep-tous-mois','ou tous les (mois)',v.tous_mois)+'</div>'
    +'<div class="ep-2">'+_gnrField('ep-fait-h','Dernier \u00e0 (h)',v.fait_h)+'<div><div class="ep-l">le</div><input type="date" id="ep-fait-d" class="mvchamp" value="'+_escAttr(v.fait_d||'')+'" style="width:100%"></div></div>'
    +'<div class="ep-actions"><button type="button" class="mbtn acre" onclick="_trEntSave()">Enregistrer</button>'+(e?'<button type="button" class="mvbtn mvbtn-secondaire ep-btn ep-suppr" onclick="_trEntSuppr()">Retirer</button>':'')+'<button type="button" class="mvbtn mvbtn-secondaire ep-btn" onclick="_trEntAnnuler()">Annuler</button></div>'
  +'</div>';
}
function _trEntProgHtml(t){
  if(!t) return '';
  var canEdit=isAdmin()||isTractoriste(), adm=isAdmin(), L=Array.isArray(t.entretiens_prog)?t.entretiens_prog:[];
  if(!L.length&&!adm) return '';
  var h='<div class="ent-resume-card ent-prog"><div class="ep-tete"><span class="ep-titre">'+_mvIcon('outil',16)+' Autres entretiens</span>'+(adm&&_entProgEdit!=='nouveau'?'<button type="button" class="mvbtn mvbtn-secondaire ep-btn" onclick="_trEntEdit(\'nouveau\')">Ajouter</button>':'')+'</div>';
  if(_entProgEdit==='nouveau'&&adm) h+=_trEntForm(null);
  if(!L.length&&_entProgEdit!=='nouveau') h+='<div class="ep-vide">Vidange de pont et bo\u00eete, filtres, graissage\u00a0: ajoutez ce qui se fait \u00e0 c\u00f4t\u00e9 de la r\u00e9vision.</div>';
  L.forEach(function(e){
    if(_entProgEdit===e.id&&adm){ h+=_trEntForm(e); return; }
    var st=_trEntEtat(t,e), cls=st.rouge?' danger':st.orange?' att':'';
    h+='<div class="ep-ligne"><div class="ep-g"><div class="ep-n">'+_escHtml(e.nom)+'</div><div class="ep-s">'+_escHtml(_trEntIntervalle(e))+(e.fait_d?' \u00b7 dernier le '+_escHtml(_fmtDate(e.fait_d))+(e.fait_h!=null&&e.fait_h!==''?' \u00e0 '+_escHtml(_gnrNum(e.fait_h))+'\u00a0h':''):'')+'</div></div>'
      +'<span class="ep-etat'+cls+'">'+_escHtml(_trEntTexte(e,st))+'</span>'
      +(canEdit?'<button type="button" class="mvbtn mvbtn-secondaire ep-btn" onclick="_trEntFait(\''+_escAttr(e.id)+'\')">Fait</button>':'')
      +(adm?'<button type="button" class="mvbtn mvbtn-secondaire ep-btn ep-ic" aria-label="R\u00e9gler '+_escAttr(e.nom)+'" onclick="_trEntEdit(\''+_escAttr(e.id)+'\')">'+_mvIcon('crayon',16)+'</button>':'')
      +'</div>';
  });
  return h+'</div>';
}
function _trEntEdit(id){ if(!isAdmin()){ showToast('R\u00e9serv\u00e9 \u00e0 l\u2019admin','#C0392B'); return; } _entProgEdit=id; renderEntretiens(); var n=document.getElementById('ep-nom'); if(n&&n.focus) n.focus(); }
function _trEntAnnuler(){ _entProgEdit=null; renderEntretiens(); }
function _trEntSave(){
  if(!isAdmin()) return;
  var t=_trSelTracteur(); if(!t) return;
  var g=function(id){ var x=document.getElementById(id); return x?String(x.value||'').trim():''; };
  var nom=g('ep-nom'), th=parseFloat(g('ep-tous-h'))||0, tm=parseInt(g('ep-tous-mois'),10)||0, fh=g('ep-fait-h'), fd=g('ep-fait-d');
  if(!nom){ showToast('Donnez un nom \u00e0 l\u2019entretien','#C0392B'); return; }
  if(!(th>0)&&!(tm>0)){ showToast('R\u00e9glez un intervalle\u00a0: des heures, des mois, ou les deux','#C0392B'); return; }
  if(!Array.isArray(t.entretiens_prog)) t.entretiens_prog=[];
  var e=_entProgEdit==='nouveau'?null:t.entretiens_prog.find(function(x){ return x.id===_entProgEdit; });
  if(!e){ e={id:'ep'+Date.now().toString(36)}; t.entretiens_prog.push(e); }
  e.nom=nom; e.tous_h=th>0?th:''; e.tous_mois=tm>0?tm:''; e.fait_h=(fh!==''&&isFinite(parseFloat(fh)))?parseFloat(fh):''; e.fait_d=/^\d{4}-\d{2}-\d{2}$/.test(fd)?fd:'';
  _entProgEdit=null; window.TRACTEURS_LIST=TRACTEURS_LIST; _saveData('tracteurs_list'); renderEntretiens(); renderTracteur();
  showToast('Entretien enregistr\u00e9 \u00b7 '+nom,'#3D6B27');
}
function _trEntSuppr(){
  if(!isAdmin()) return;
  var t=_trSelTracteur(); if(!t||!Array.isArray(t.entretiens_prog)) return;
  var i=t.entretiens_prog.findIndex(function(x){ return x.id===_entProgEdit; }); if(i<0) return;
  var e=t.entretiens_prog.splice(i,1)[0];
  _entProgEdit=null; window.TRACTEURS_LIST=TRACTEURS_LIST; _saveData('tracteurs_list'); renderEntretiens(); renderTracteur();
  var annuler=function(){ t.entretiens_prog.splice(Math.min(i,t.entretiens_prog.length),0,e); window.TRACTEURS_LIST=TRACTEURS_LIST; _saveData('tracteurs_list'); renderEntretiens(); renderTracteur(); };
  if(typeof window.showToastAnnuler==='function') window.showToastAnnuler('Entretien retir\u00e9 \u00b7 '+e.nom, annuler); else showToast('Entretien retir\u00e9','#3D6B27');
}
function _trEntFait(id){
  if(!isAdmin()&&!isTractoriste()){ showToast('R\u00e9serv\u00e9 aux tractoristes et \u00e0 l\u2019admin','#C0392B'); return; }
  var t=_trSelTracteur(); if(!t) return;
  var e=(t.entretiens_prog||[]).find(function(x){ return x.id===id; }); if(!e) return;
  _relOuvrir(t.id,'entretien',function(h){
    var av={h:e.fait_h, d:e.fait_d}; e.fait_h=h; e.fait_d=_gnrTodayISO();
    window.TRACTEURS_LIST=TRACTEURS_LIST; _saveData('tracteurs_list');
    var revoir=function(){ renderTracteur(); if(typeof renderEntretiens==='function') renderEntretiens(); };
    revoir();
    var st=_trEntEtat(t,e), msg=e.nom+' not\u00e9 \u00b7 prochain '+[st.ph!=null?'\u00e0 '+_gnrNum(st.ph)+'\u00a0h':'', st.pd?'le '+_trDateAn(st.pd):''].filter(Boolean).join(' ou ');
    var annuler=function(){ if(av.h===undefined) delete e.fait_h; else e.fait_h=av.h; if(av.d===undefined) delete e.fait_d; else e.fait_d=av.d; window.TRACTEURS_LIST=TRACTEURS_LIST; _saveData('tracteurs_list'); revoir(); };
    if(typeof window.showToastAnnuler==='function') window.showToastAnnuler(msg, annuler); else showToast(msg,'#3D6B27');
  });
  var sub=document.getElementById('rel-sub'); if(sub) sub.textContent=[t.nom,e.nom].join(' \u00b7 ')+'\u00a0: le chiffre du cadran';
}
function _relFait(id,on){ if(!_rel.faits) _rel.faits=[]; var i=_rel.faits.indexOf(id); if(on&&i<0) _rel.faits.push(id); else if(!on&&i>=0) _rel.faits.splice(i,1); }
function _trRelCorriger(tid,ts){
  if(!isAdmin()){ showToast('R\u00e9serv\u00e9 \u00e0 l\u2019admin','#C0392B'); return; }
  var t=(TRACTEURS_LIST||[]).find(function(x){ return x.id===tid; }); if(!t) return;
  var r=(t.releves||[]).find(function(x){ return x&&x.ts===ts; }); if(!r||r.manque||r.ecarte) return;
  var avant=null, apres=null;
  _trVrais(t).forEach(function(x){ if(x===r) return; var c=String(x.d).localeCompare(String(r.d))||((x.ts||0)-(r.ts||0)); if(c<0) avant=x; else if(c>0&&!apres) apres=x; });
  _rel={tid:tid, src:'correction', buf:'', apres:null, borne:{ min:avant?Number(avant.h):0, max:apres?Number(apres.h):Infinity, ts:ts }};
  var el=function(id){ return document.getElementById(id); };
  if(el('rel-sub')) el('rel-sub').textContent=t.nom+' \u00b7 corriger le relev\u00e9 du '+_fmtDate(r.d);
  if(el('rel-ref')) el('rel-ref').innerHTML='<span>Not\u00e9\u00a0: <b>'+_escHtml(_gnrNum(r.h))+'\u00a0h</b>'+(r.par?', '+_escHtml(r.par):'')+'</span><span>entre <b>'+_escHtml(_gnrNum(_rel.borne.min))+'\u00a0h</b>'+(apres?' et <b>'+_escHtml(_gnrNum(_rel.borne.max))+'\u00a0h</b>':' et plus')+'</span>';
  if(el('rel-tard')) el('rel-tard').hidden=true;
  if(el('rel-ban')){ el('rel-ban').textContent=''; el('rel-ban').hidden=true; }
  if(el('rel-faits')) el('rel-faits').hidden=true;
  _relRendu(); _openOv('ovReleve');
}
function _relValiderCorr(){
  var t=(TRACTEURS_LIST||[]).find(function(x){ return x.id===_rel.tid; }), b=_rel.borne; if(!t||!b) return;
  var r=(t.releves||[]).find(function(x){ return x&&x.ts===b.ts; }), v=_relVal(), e=_relEtatCorr(v,b);
  if(!r||e.k!=='ok') return;
  var avant={ h:r.h, corrige:r.corrige, compteur_h:t.compteur_h };
  if(r.corrige===undefined) r.corrige=Number(r.h);
  r.h=v;
  var vr=_trVrais(t); if(vr.length) t.compteur_h=Number(vr[vr.length-1].h);
  window.TRACTEURS_LIST=TRACTEURS_LIST; _saveData('tracteurs_list');
  _closeOv(null,'ovReleve');
  var revoir=function(){ renderTracteur(); if(typeof renderEntretiens==='function') renderEntretiens(); };
  revoir();
  var annuler=function(){ r.h=avant.h; if(avant.corrige===undefined) delete r.corrige; else r.corrige=avant.corrige; t.compteur_h=avant.compteur_h; window.TRACTEURS_LIST=TRACTEURS_LIST; _saveData('tracteurs_list'); revoir(); };
  var msg='Relev\u00e9 corrig\u00e9 \u00b7 '+_gnrNum(v)+'\u00a0h (\u00e9tait '+_gnrNum(avant.h)+'\u00a0h)';
  if(typeof window.showToastAnnuler==='function') window.showToastAnnuler(msg, annuler); else showToast(msg,'#3D6B27');
}
function _trRelEcarte(tid,ts){
  if(!isAdmin()){ showToast('R\u00e9serv\u00e9 \u00e0 l\u2019admin','#C0392B'); return; }
  var t=(TRACTEURS_LIST||[]).find(function(x){ return x.id===tid; }); if(!t) return;
  var r=(t.releves||[]).find(function(x){ return x&&x.ts===ts; }); if(!r||r.manque) return;
  var avant={ ecarte:r.ecarte, compteur_h:t.compteur_h };
  if(r.ecarte) delete r.ecarte; else r.ecarte=true;
  var v=_trVrais(t); if(v.length) t.compteur_h=Number(v[v.length-1].h);
  window.TRACTEURS_LIST=TRACTEURS_LIST; _saveData('tracteurs_list');
  var revoir=function(){ renderTracteur(); if(typeof renderEntretiens==='function') renderEntretiens(); };
  revoir();
  var annuler=function(){ if(avant.ecarte) r.ecarte=true; else delete r.ecarte; t.compteur_h=avant.compteur_h; window.TRACTEURS_LIST=TRACTEURS_LIST; _saveData('tracteurs_list'); revoir(); };
  var msg=r.ecarte?('Relev\u00e9 \u00e9cart\u00e9 \u00b7 '+_gnrNum(r.h)+'\u00a0h ne compte plus'):('Relev\u00e9 r\u00e9tabli \u00b7 '+_gnrNum(r.h)+'\u00a0h');
  if(typeof window.showToastAnnuler==='function') window.showToastAnnuler(msg, annuler); else showToast(msg,'#3D6B27');
}
function _trRevFaite(){
  if(!isAdmin()&&!isTractoriste()){ showToast('R\u00e9serv\u00e9 aux tractoristes et \u00e0 l\u2019admin','#C0392B'); return; }
  var t=_trSelTracteur(); if(!t) return;
  _relOuvrir(t.id,'revision',function(h){
    var avant={ revision_h:t.revision_h, rev_fait_h:t.rev_fait_h, rev_fait_d:t.rev_fait_d, rev_date:t.rev_date };
    var auj=_gnrTodayISO(), hN=Number(t.rev_h)||0, mN=Number(t.rev_mois)||0;
    t.rev_fait_h=h; t.rev_fait_d=auj;
    if(hN>0) t.revision_h=Math.round((h+hN)*10)/10;
    t.rev_date=mN>0?_trAjoutMois(auj,mN):(t.rev_date||'');
    var _faits=(typeof _rel!=='undefined'&&_rel&&_rel.faits)||[], _avEp=[];   // ★ COMPT-5 (§487) : les entretiens faits en même temps
    (t.entretiens_prog||[]).forEach(function(e){ if(_faits.indexOf(e.id)<0) return; _avEp.push({e:e, h:e.fait_h, d:e.fait_d}); e.fait_h=h; e.fait_d=auj; });
    window.TRACTEURS_LIST=TRACTEURS_LIST; _saveData('tracteurs_list');
    var revoir=function(){ renderTracteur(); if(typeof renderEntretiens==='function') renderEntretiens(); };
    revoir();
    var msg=(hN>0||mN>0)?('R\u00e9vision not\u00e9e \u00b7 prochaine '+[hN>0?'\u00e0 '+_gnrNum(t.revision_h)+'\u00a0h':'', mN>0?'le '+_trDateAn(t.rev_date):''].filter(Boolean).join(' ou ')):'R\u00e9vision not\u00e9e \u00b7 r\u00e9glez l\u2019intervalle au crayon pour que la suivante se calcule';
    if(_avEp.length) msg+=' \u00b7 '+_avEp.map(function(x){ return x.e.nom; }).join(', ')+' aussi';
    var annuler=function(){ Object.keys(avant).forEach(function(c){ if(avant[c]===undefined) delete t[c]; else t[c]=avant[c]; }); _avEp.forEach(function(x){ if(x.h===undefined) delete x.e.fait_h; else x.e.fait_h=x.h; if(x.d===undefined) delete x.e.fait_d; else x.e.fait_d=x.d; }); window.TRACTEURS_LIST=TRACTEURS_LIST; _saveData('tracteurs_list'); revoir(); showToast('R\u00e9vision retir\u00e9e (le relev\u00e9 reste)','#3D6B27'); };
    if(typeof window.showToastAnnuler==='function') window.showToastAnnuler(msg, annuler); else showToast(msg,'#3D6B27');
  });
}
// ── La feuille du relevé (#ovReleve, index.html) ──
function _relVal(){ var s=_rel.buf; if(!s) return null; s=s.replace(',','.'); if(s.slice(-1)==='.') s=s.slice(0,-1); if(s==='') return null; var v=parseFloat(s); return isFinite(v)?v:null; }
function _relEtat(v,k){
  if(v==null) return {k:'vide', t:'Recopie le chiffre du cadran.'};
  if(!k) return {k:'ok', t:'Premier relev\u00e9 de ce tracteur.'};
  var b=Number(k.base.h), d=Math.round((v-b)*10)/10;
  if(v<b) return {k:'bas', t:'Plus bas que le dernier relev\u00e9 ('+_gnrNum(b)+'\u00a0h). V\u00e9rifie le chiffre.', s:'Compteur chang\u00e9\u202f? On le corrige au crayon de \u00ab\u00a0Prochaine r\u00e9vision\u00a0\u00bb.'};
  if(!k.base.d) return {k:'ok', t:'Le chiffre d\u2019avant n\u2019avait pas de date\u00a0: rien \u00e0 comparer.'};
  var j=Math.max(1,k.jours||0), att=Math.max(0,k.h-b);
  if(d>24*j) return {k:'imp', t:'+'+_gnrNum(d)+'\u00a0h en '+j+' jour'+(j>1?'s':'')+'\u00a0: impossible. Un chiffre en trop\u202f?'};
  if(d>att*1.5&&d-att>10) return {k:'beaucoup', t:'+'+_gnrNum(d)+'\u00a0h depuis le dernier relev\u00e9, on attendait environ +'+_gnrNum(Math.round(att))+'\u00a0h. C\u2019est bien le chiffre\u202f?'};
  return {k:'ok', t:'+'+_gnrNum(d)+'\u00a0h depuis le dernier relev\u00e9\u00a0: coh\u00e9rent.'};
}
function _relCadran(buf){
  var p=buf.split(','), ent=p[0], dec=p.length>1?p[1]:null, h='', i;
  if(!ent){ for(i=0;i<4;i++) h+='<span class="rel-c rel-vide'+(i?'':' rel-curseur')+'"></span>'; }
  else{
    for(i=0;i<ent.length;i++) h+='<span class="rel-c'+((i>0&&(ent.length-i)%3===0)?' rel-sep':'')+'">'+ent.charAt(i)+'</span>';
    if(dec!==null) h+='<span class="rel-virg">,</span>'+(dec?'<span class="rel-c rel-dix">'+dec+'</span>':'<span class="rel-c rel-vide rel-curseur"></span>');
  }
  return h+'<span class="rel-u">h</span>';
}
function _relRendu(){
  var t=(TRACTEURS_LIST||[]).find(function(x){ return x.id===_rel.tid; }); if(!t) return;
  var k=_trCompteur(t), v=_relVal(), e=(_rel.src==='correction'&&_rel.borne)?_relEtatCorr(v,_rel.borne):_relEtat(v,k), el=function(id){ return document.getElementById(id); };
  if(el('rel-cadran')) el('rel-cadran').innerHTML=_relCadran(_rel.buf);
  var m=el('rel-msg'); if(m){ m.className='rel-msg'+(e.k==='ok'&&v!=null?' rel-ok':e.k==='beaucoup'?' rel-att':(e.k==='bas'||e.k==='imp')?' rel-ko':''); m.innerHTML='<span>'+_escHtml(e.t)+(e.s?'<small>'+_escHtml(e.s)+'</small>':'')+'</span>'; }
  var b=el('rel-ok'), bon=(e.k==='ok'||e.k==='beaucoup')&&v!=null;
  if(b){ b.disabled=!bon; b.textContent=(_rel.src==='correction')?(bon?('Corriger\u00a0: '+_gnrNum(v)+'\u00a0h'):'Corriger'):!bon?(_rel.src==='plein'?'Valider le plein':_rel.src==='revision'?'Noter la r\u00e9vision':_rel.src==='demarrage'?'Valider et d\u00e9marrer':'Valider'):(e.k==='beaucoup'?('Oui, '+_gnrNum(v)+'\u00a0h est le bon chiffre'):(_rel.src==='plein'?('Valider le plein \u00e0 '+_gnrNum(v)+'\u00a0h'):_rel.src==='revision'?('Noter la r\u00e9vision \u00e0 '+_gnrNum(v)+'\u00a0h'):_rel.src==='demarrage'?('Valider '+_gnrNum(v)+'\u00a0h et d\u00e9marrer'):('Valider '+_gnrNum(v)+'\u00a0h'))); }
}
function _relOuvrir(tid,src,apres,raison){
  var t=(TRACTEURS_LIST||[]).find(function(x){ return x.id===tid; }); if(!t) return;
  _rel={tid:tid, src:src||'jour', buf:'', apres:apres||null};
  var k=_trCompteur(t), el=function(id){ return document.getElementById(id); };
  var _SUB={plein:' \u00b7 au plein, le chiffre est demand\u00e9', jour:' \u00b7 une fois aujourd\u2019hui, le chiffre du cadran', revision:' \u00b7 r\u00e9vision faite\u00a0: le chiffre du cadran', demarrage:' \u00b7 pour d\u00e9marrer, le chiffre du cadran', entretien:' \u00b7 entretien fait\u00a0: le chiffre du cadran'};
  if(el('rel-sub')) el('rel-sub').textContent=t.nom+(_SUB[_rel.src]||' \u00b7 le chiffre du cadran');
  var _BAN={depassee:'R\u00e9vision d\u00e9pass\u00e9e\u00a0: le compteur est demand\u00e9 pour d\u00e9marrer.', proche:'R\u00e9vision toute proche\u00a0: le compteur est demand\u00e9 pour d\u00e9marrer.', vieux:'Pas de vrai relev\u00e9 depuis plus de 7 jours\u00a0: le compteur est demand\u00e9 pour d\u00e9marrer.'};   // ★ COMPT-2 (§484)
  if(el('rel-ban')){ el('rel-ban').textContent=_BAN[raison]||''; el('rel-ban').hidden=!_BAN[raison]; }
  _rel.faits=[]; var _epf=(_rel.src==='revision'&&Array.isArray(t.entretiens_prog))?t.entretiens_prog:[];   // ★ COMPT-5 (§487) : « Fait aussi »
  if(el('rel-faits')){ el('rel-faits').innerHTML=_epf.length?('<span class="rel-faits-l">Fait aussi\u00a0:</span>'+_epf.map(function(e){ return '<label class="rel-fait"><input type="checkbox" data-ep="'+_escAttr(e.id)+'" onchange="_relFait(this.dataset.ep,this.checked)"> '+_escHtml(e.nom)+'</label>'; }).join('')):''; el('rel-faits').hidden=!_epf.length; }
  if(el('rel-ref')) el('rel-ref').innerHTML=!k?'<span>Aucun relev\u00e9\u00a0: ce sera le premier.</span>'
    :('<span>Dernier relev\u00e9\u00a0: <b>'+_escHtml(_gnrNum(k.base.h))+'\u00a0h</b>'+(k.base.d?' le '+_escHtml(_fmtDate(k.base.d))+(k.base.par?', '+_escHtml(k.base.par):''):' (sans date)')+'</span>'+(k.estime?'<span>attendu <b>env.\u00a0'+_escHtml(_gnrNum(Math.round(k.h)))+'\u00a0h</b></span>':''));
  if(el('rel-tard')) el('rel-tard').hidden=(_rel.src!=='jour');
  _relRendu(); _openOv('ovReleve');
}
function _relTouche(k){
  var b=_rel.buf;
  if(k==='del') b=b.slice(0,-1);
  else if(k===','){ if(b.indexOf(',')<0) b=(b||'0')+','; }
  else if(/^[0-9]$/.test(k)){ var p=b.split(','); if(p.length===2){ if(p[1].length>=1) return; b+=k; } else { if(p[0].length>=6) return; b=(b==='0')?k:b+k; } }
  else return;
  _rel.buf=b; _relRendu();
}
function _relValider(){
  if(_rel.src==='correction') return _relValiderCorr();   // ★ COMPT-4 (§486)
  var t=(TRACTEURS_LIST||[]).find(function(x){ return x.id===_rel.tid; }); if(!t) return;
  var k=_trCompteur(t), v=_relVal(), e=_relEtat(v,k);
  if(v==null||!(e.k==='ok'||e.k==='beaucoup')) return;
  var avant={ releves:(t.releves||[]).slice(), compteur_h:t.compteur_h }, apres=_rel.apres;
  t.releves=(t.releves||[]).concat([{ d:_gnrTodayISO(), ts:Date.now(), h:v, par:(currentUser&&currentUser.nom)||'', src:_rel.src }]).slice(-_TR_REL_MAX);
  t.compteur_h=v;
  window.TRACTEURS_LIST=TRACTEURS_LIST; _saveData('tracteurs_list');
  _closeOv(null,'ovReleve');
  if(apres){ apres(v); return; }
  var revoir=function(){ renderTracteur(); if(_P().onglet()==='entretiens'&&typeof renderEntretiens==='function') renderEntretiens(); };
  revoir();
  var annuler=function(){ t.releves=avant.releves; t.compteur_h=avant.compteur_h; window.TRACTEURS_LIST=TRACTEURS_LIST; _saveData('tracteurs_list'); revoir(); showToast('Relev\u00e9 retir\u00e9','#3D6B27'); };
  if(typeof window.showToastAnnuler==='function') window.showToastAnnuler('Compteur not\u00e9 \u00b7 '+_gnrNum(v)+'\u00a0h', annuler); else showToast('Compteur not\u00e9','#3D6B27');
}
function _relPlusTard(){
  var t=(TRACTEURS_LIST||[]).find(function(x){ return x.id===_rel.tid; }), auj=_gnrTodayISO(), par=(currentUser&&currentUser.nom)||'';
  if(t&&_rel.src==='jour'&&!(t.releves||[]).some(function(r){ return r&&r.manque&&r.d===auj&&r.par===par; })){
    t.releves=(t.releves||[]).concat([{ d:auj, ts:Date.now(), par:par, src:'jour', manque:true }]).slice(-_TR_REL_MAX);
    window.TRACTEURS_LIST=TRACTEURS_LIST; _saveData('tracteurs_list');
  }
  _closeOv(null,'ovReleve'); showToast('Redemand\u00e9 au prochain enregistrement','#55534E');
}
function _trRelever(){ if(!isAdmin()&&!isTractoriste()){ showToast('R\u00e9serv\u00e9 aux tractoristes et \u00e0 l\u2019admin','#C0392B'); return; } var t=_trSelTracteur(); if(t) _relOuvrir(t.id,'manuel'); }
function _trSdOuvert(id){ var s=(SESSIONS||[]).find(function(x){ return x.id===id; }); _trSdAvant=s?JSON.stringify(s.parcellesFaites||[]):null; }
function _trRelevePassage(sid,dou){
  try{
    if(window.__MV_TUTO) return;                                   // l'entraînement ne demande pas de compteur
    if(!((typeof isTractoriste==='function'&&isTractoriste())||(typeof isAdmin==='function'&&isAdmin()))) return;
    var s=(SESSIONS||[]).find(function(x){ return x.id===sid; }); if(!s) return;
    if(dou==='feuille'&&_trSdAvant===JSON.stringify(s.parcellesFaites||[])) return;   // regarder une feuille ne demande rien
    var tid=_trTidSession(s), t=(TRACTEURS_LIST||[]).find(function(x){ return x.id===tid; });
    if(!t||(REPARATEUR&&REPARATEUR[t.id])) return;
    if(typeof _trSuivi==='function'&&!_trSuivi(t)) return;   // ★ COMPT-2 (§484) : un tracteur non suivi n'est jamais interrogé
    var auj=_gnrTodayISO();
    if((t.releves||[]).some(function(r){ return r&&!r.manque&&r.d===auj; })) return;   // une fois par jour et par tracteur
    setTimeout(function(){ _relOuvrir(t.id,'jour'); },320);
  }catch(e){ if(window._mvAvale) window._mvAvale(e,'tracteur.js/_trRelevePassage'); }
}
window._trCompteur=_trCompteur; window._trHeuresTxt=_trHeuresTxt; window._trRevFaite=_trRevFaite; window._trRelEcarte=_trRelEcarte; window._trRelCorriger=_trRelCorriger; window._trEntEdit=_trEntEdit; window._trEntAnnuler=_trEntAnnuler; window._trEntSave=_trEntSave; window._trEntSuppr=_trEntSuppr; window._trEntFait=_trEntFait; window._relFait=_relFait; window._trDateAn=_trDateAn; window._trRevEtat=_trRevEtat; window._relTouche=_relTouche; window._relValider=_relValider; window._relPlusTard=_relPlusTard; window._trRelever=_trRelever;
if(typeof document!=='undefined'&&document.addEventListener) document.addEventListener('keydown',function(ev){
  var o=document.getElementById('ovReleve'); if(!o||!o.classList.contains('open')) return;
  var k=ev.key;
  if(/^[0-9]$/.test(k)){ _relTouche(k); ev.preventDefault(); }
  else if(k===','||k==='.'){ _relTouche(','); ev.preventDefault(); }
  else if(k==='Backspace'){ _relTouche('del'); ev.preventDefault(); }
  else if(k==='Enter'){ var b=document.getElementById('rel-ok'); if(b&&!b.disabled){ _relValider(); ev.preventDefault(); } }
});
window._trSuivi=_trSuivi; window._trAjoutMois=_trAjoutMois; window._trRevDate=_trRevDate; window._trReleveExige=_trReleveExige; window._trFicheCptHtml=_trFicheCptHtml; window._trEntUrgent=_trEntUrgent; window._trEntProgHtml=_trEntProgHtml; window._relOuvrir=_relOuvrir; window._trSdOuvert=_trSdOuvert; window._trRelevePassage=_trRelevePassage;
window._trEntEtat=_trEntEtat;   // ★ COMPT-7 (§489) : le Pilotage lit l'échéance de chaque entretien
