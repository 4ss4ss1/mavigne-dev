// ═════════════════════════════════════════════════════════════════════════════════════════════════
//  MA VIGNE — tournees.js — ★★ TRN-1 (§330) : L'ÉDITEUR DES TOURNÉES ET SA SECTION DE LA ROUE CRANTÉE
//  Module à part (et non un bloc de reglages.js) : 60 ko d'un seul écran, que le cliquet de poids des modules
//  (mv-harnais-typo, +5 % par lot) refusait à juste titre dans un fichier de 495 ko. Importé par reglages.js,
//  qui appelle _trnSectionRender() en rendant la roue crantée de la Vigne. Lecture du modèle : utils.js.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
import { isAdmin, showToast, tNom, _escHtml } from './utils.js';

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// ★★ TRN-1 (§330) — LES TOURNÉES, RÉGLÉES UNE FOIS DANS LA ROUE CRANTÉE DE LA VIGNE
// Nico (14/10, dicté) : « c'est l'administrateur qui fera les tournées et qui décidera de la tournée que l'équipe
// devra faire. L'équipe n'a vraiment qu'à se concentrer sur le tap de validation. » Plusieurs tournées (hiver, été,
// taille, tracteur…), réglées de temps en temps, puis on n'y touche plus. Maquette validée le 14/10 (« go »).
// • Une tournée = un nom, l'ORDRE COMPLET des parcelles (par pid, IDS-1), les travaux qui la suivent. Un travail
//   n'en suit qu'une. La lecture vit dans utils.js (_mvTourneesLues, _mvTourneeDe, _mvOrdreFor) ; ici, l'écran et
//   l'écriture (_trnEcrire, qui réécrit aussi CONFIG.ordre_passage_t pour les appareils pas encore à jour).
// • Ranger : glisser par la poignée (souris ou doigt, sans appui long) ; toucher une parcelle ouvre son menu
//   (premier, monter, descendre, dernier, placer après) — l'autre chemin, sans glisser (WCAG 2.5.7) ; toucher la
//   carte dans l'ordre ; ou « Ranger automatiquement ». Annuler / Rétablir partout (le tri automatique écrase les
//   retouches à la main : il doit pouvoir se défaire).
// • La carte dessine les contours KML (la source de la carte de Parcelles) ; une parcelle placée sans contour garde
//   son point ; une parcelle nulle part reste dans la liste, hors carte et hors distances.
// ⚠️ config est lu au démarrage : la tournée arrive chez l'équipe à sa PROCHAINE OUVERTURE — le message le dit.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
var _TRN = null;
var _trnVB0 = null, _trnVB = null, _trnM = null, _trnD = null, _trnApresGlisse = false, _trnPopAncre = null, _trnToastT = 0, _trnToastFn = null, _trnDernierFocus = null;
var _trnMQ = (typeof matchMedia === 'function') ? matchMedia('(min-width: 1024px)') : { matches: false };
function _trnPC(){ return !!_trnMQ.matches; }
function _trnIc(n, s){ return _mvIcon(n, s || 18); }
function _trnLog(msg){ if(window.logError) window.logError({ level: 'info', cat: 'tournee', msg: msg }); }
function _trnNomT(t){
  try{ return (typeof tNom === 'function') ? tNom(t) : String(t); }
  catch(e){ _trnLog('nom de tâche'); return String(t); }
}
function _trnIdP(p){ return (p && p.pid) ? String(p.pid) : ('n:' + (p ? p.nom : '')); }
function _trnParcs(){ return (window.PARCELLES || []).filter(function(p){ return p && p.nom && p.statut !== 'Arrachee'; }); }
function _trnIndex(){
  var by = {};
  (window.PARCELLES || []).forEach(function(p){ if(!p || !p.nom) return; if(p.pid) by[p.pid] = p; by['n:' + p.nom] = p; });
  return by;
}
function _trnHa(p){ var v = parseFloat(p && p.surface); return isFinite(v) ? v : 0; }
function _trnHaFr(v){ return v.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) + '\u202fha'; }
function _trnKm(m){ return m >= 950 ? (m / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + '\u202fkm' : (Math.round(m / 10) * 10) + '\u202fm'; }
function _trnCom(p){ return (p && p.commune && p.commune.nom) ? String(p.commune.nom) : ''; }
function _trnLues(){ return (typeof window._mvTourneesLues === 'function') ? window._mvTourneesLues() : []; }
function _trnJour(){ var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function _trnDateFr(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '')); return m ? (m[3] + '/' + m[2]) : ''; }
function _trnPlur(n, s, p){ return n + '\u00a0' + (n > 1 ? (p || s + 's') : s); }
function _trnNorm(s){ return String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase(); }   // \p{M} : les accents, sans écrire leurs codes (harnais des polices)

// ── L'écriture : la seule. CONFIG.tournees, et sa copie par tâche pour les appareils en retard. ──
// Object.assign : on repart de chaque tournée existante au lieu de la reconstruire (invariant du projet).
function _trnEcrire(liste){
  var C = window.CONFIG = window.CONFIG || {};
  var by = _trnIndex(), m = {};
  C.tournees = liste.map(function(t){
    var c = Object.assign({}, t, { taches: (t.taches || []).slice(), ordre: (t.ordre || []).slice() });
    delete c.ancienne;
    return c;
  });
  C.tournees.forEach(function(t){
    var noms = [];
    t.ordre.forEach(function(id){ var p = by[id]; if(p && noms.indexOf(p.nom) < 0) noms.push(p.nom); });
    t.taches.forEach(function(x){ m[x] = { ordre: noms.slice(), date: t.date || '', par: t.par || '' }; });
  });
  C.ordre_passage_t = m;
  if(typeof window.saveData === 'function') window.saveData('config');
  try{ window.dispatchEvent(new CustomEvent('mv-tournees')); }
  catch(e){ _trnLog('événement tournées'); }
}

// ── La section « Tournées » de la roue crantée de la Vigne ──
function _trnSectionRender(){
  var host = document.getElementById('tournees-config-list'); if(!host) return;
  var T = _trnLues(), saison = [];
  try{ saison = ((typeof window.getTachesSaison === 'function') ? window.getTachesSaison() : []).map(function(t){ return t && t.nom; }).filter(Boolean); }
  catch(e){ _trnLog('tâches de la saison'); }
  var sans = saison.filter(function(n){ return !T.some(function(t){ return t.taches.indexOf(n) >= 0; }); });
  var h = '<p class="trn-sec-aide">L’ordre dans lequel l’équipe fait les parcelles. Vous le réglez une fois ; chaque travail suit sa tournée, l’équipe n’a rien à toucher.</p><div class="trn-grp">';
  if(!T.length) h += '<p class="trn-grp-pied">Aucune tournée pour l’instant : l’équipe voit les parcelles dans l’ordre habituel.</p>';
  T.forEach(function(t){
    var pour = t.taches.length ? 'Pour ' + t.taches.map(_trnNomT).join(', ') : 'Aucun travail';
    var d = _trnDateFr(t.date);
    h += '<button type="button" class="trn-row" data-trn-id="' + _escHtml(t.id) + '"><span class="trn-row-ic">' + _trnIc('route', 18) + '</span>'
      + '<span class="trn-row-tx"><span class="trn-row-l">' + _escHtml(t.nom) + '</span><span class="trn-row-s">' + _escHtml(pour + (d ? ' · réglée le ' + d : '')) + '</span></span>'
      + '<span class="trn-row-ch">' + _trnIc('chevron', 16) + '</span></button>';
  });
  if(T.length && sans.length) h += '<p class="trn-grp-pied">Sans tournée : ' + _escHtml(sans.map(_trnNomT).join(', ')) + '. L’équipe les voit dans l’ordre habituel.</p>';
  h += '</div><button type="button" class="mbtn verte trn-nouvelle" data-trn-nouvelle="1">' + '+ Nouvelle tournée</button>';
  host.innerHTML = h;
  if(!host._trnLie){
    host._trnLie = 1;
    host.addEventListener('click', function(e){
      var b = e.target.closest('[data-trn-id],[data-trn-nouvelle]'); if(!b) return;
      if(b.getAttribute('data-trn-nouvelle')) _trnOuvrir('', 'reglages'); else _trnOuvrir(b.getAttribute('data-trn-id'), 'reglages');
    });
  }
}

// ── Ouvrir / fermer ──
function _trnOuvrir(id, depuis, pre){
  if(!isAdmin()){ showToast('Réservé à l’administrateur', '#C0392B'); return; }
  var parcs = _trnParcs();
  if(!parcs.length){ showToast('Aucune parcelle pour l’instant', '#B85A1A'); return; }
  var by = _trnIndex(), t = null, vis = {}, ordre = [], caches = [], nouvelles = {};
  if(id) t = _trnLues().filter(function(x){ return x.id === id; })[0] || null;
  parcs.forEach(function(p){ vis[_trnIdP(p)] = 1; });
  if(t){
    t.ordre.forEach(function(raw){
      var p = by[raw], k = p ? _trnIdP(p) : null;
      if(k && vis[k]){ if(ordre.indexOf(k) < 0) ordre.push(k); }
      else if(caches.indexOf(raw) < 0) caches.push(raw);   // arrachée ou disparue : gardée telle quelle, jamais perdue
    });
  } else if(pre && pre.ordre) ordre = pre.ordre.filter(function(k){ return vis[k]; });
  parcs.forEach(function(p){ var k = _trnIdP(p); if(ordre.indexOf(k) < 0){ ordre.push(k); if(t) nouvelles[k] = 1; } });
  _TRN = {
    id: t ? t.id : ('t' + Date.now().toString(36)),
    nom: t ? t.nom : ((pre && pre.nom) || 'Nouvelle tournée'),
    taches: t ? t.taches.slice() : ((pre && pre.taches) || []).slice(),
    ordre: ordre, caches: caches, date: t ? (t.date || '') : '', neuve: !t, depuis: depuis || 'reglages',
    hist: [], fut: [], vue: 'liste', hover: null, sel: null, query: '', matchI: 0, trace: null, cible: null, flash: null,
    pop: null, sheet: null, nouvelles: nouvelles, P: {}
  };
  parcs.forEach(function(p){ _TRN.P[_trnIdP(p)] = p; });
  _TRN.base = _trnSnap();
  if(depuis === 'reglages' && typeof window.closeOv === 'function') window.closeOv(null, 'ovReglVigne');
  _trnGeo();
  _trnMonte();
  if(_TRN.neuve){
    var ni = document.getElementById('trn-nom');
    if(ni && _trnPC()){ ni.focus(); ni.select(); }
    _trnToast(pre && pre.copie ? 'Copie créée. Donnez-lui un nom et choisissez ses travaux.' : 'Nommez la tournée, rangez les parcelles, puis choisissez les travaux qui la suivront.');
  }
}
function _trnOuvrirPourTache(tache, depuis){
  var t = (typeof window._mvTourneeDe === 'function') ? window._mvTourneeDe(tache) : null;
  if(t) _trnOuvrir(t.id, depuis || 'parcelles');
  else _trnOuvrir('', depuis || 'parcelles', { nom: _trnNomT(tache), taches: tache ? [tache] : [] });
}
function _trnSnap(){ return { nom: _TRN.nom.trim(), taches: _TRN.taches.slice(), ordre: _TRN.ordre.slice() }; }
function _trnDirty(){
  if(!_TRN) return false;
  if(_TRN.neuve) return true;
  var b = _TRN.base;
  return _TRN.nom.trim() !== b.nom || _TRN.taches.join('|') !== b.taches.join('|') || _TRN.ordre.join('|') !== b.ordre.join('|');
}
function _trnFermer(){
  var ov = document.getElementById('trn-ov'); if(ov) ov.hidden = true;
  document.body.classList.remove('trn-ouvert');
  _trnFermerPop(true); _trnFermerFeuille(true);
  var depuis = _TRN ? _TRN.depuis : 'reglages';
  _TRN = null; _trnD = null; _trnM = null;
  if(depuis === 'reglages' && typeof window._mvReglOpen === 'function') setTimeout(function(){ window._mvReglOpen('vigne'); }, 40);
  else if(depuis === 'parcelles' && typeof window.renderParcelles === 'function') window.renderParcelles();
}
function _trnQuitter(){
  if(_TRN && _TRN.trace) _trnTraceAnnuler();
  if(_trnDirty()){ _trnFeuille('quitter'); return; }
  _trnFermer();
}

// ── Le squelette, posé une fois sur <body> (comme les autres feuilles posées en JS) ──
function _trnMonte(){
  var ov = document.getElementById('trn-ov');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'trn-ov'; ov.className = 'trn-ov'; ov.hidden = true;
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'trn-nom-lbl');
    document.body.appendChild(ov);
    ov.addEventListener('click', _trnClic);
    ov.addEventListener('keydown', _trnTouche);
    if(typeof window.addEventListener === 'function') window.addEventListener('resize', _trnRedim);
  }
  ov.innerHTML = '<header class="trn-hd">'
    + '<button type="button" class="trn-ghost" data-trn="retour" aria-label="Revenir">' + _trnIc('gauche', 18) + '<span class="trn-pconly">' + (_TRN.depuis === 'reglages' ? 'Réglages' : 'Retour') + '</span></button>'
    + '<div class="trn-titre"><label class="trn-sr" id="trn-nom-lbl" for="trn-nom">Nom de la tournée</label><input id="trn-nom" class="trn-nom" maxlength="40" autocomplete="off" spellcheck="false">'
    + '<p class="trn-aide trn-pconly">L’ordre complet du domaine. L’équipe ne voit que les parcelles qui lui restent à faire, numérotées dans cet ordre.</p></div>'
    + '<div class="trn-act"><span class="trn-etat" id="trn-etat"></span>'
    + '<button type="button" class="trn-ic" data-trn="menu" aria-label="Plus d’actions" aria-haspopup="menu">' + _trnIc('points', 18) + '</button>'
    + '<button type="button" class="trn-ok" id="trn-save" data-trn="save">Enregistrer</button></div></header>'
    + '<div class="trn-seg" role="tablist" aria-label="Affichage">'
    + '<button type="button" role="tab" id="trn-seg-l" data-trn="vue" data-v="liste">' + _trnIc('liste', 16) + 'Liste</button>'
    + '<button type="button" role="tab" id="trn-seg-c" data-trn="vue" data-v="carte">' + _trnIc('carte', 16) + 'Carte</button></div>'
    + '<div class="trn-body">'
    + '<section class="trn-pane trn-pane-l" aria-label="Ordre de passage"><div class="trn-taches" id="trn-taches"></div>'
    + '<div class="trn-tools"><button type="button" class="trn-soft" data-trn="presets" aria-haspopup="menu">' + _trnIc('etincelles', 16) + '<span>Ranger automatiquement</span></button><span class="trn-espace"></span>'
    + '<button type="button" class="trn-ic" data-trn="chercher" id="trn-b-q" aria-label="Trouver une parcelle" title="Trouver une parcelle">' + _trnIc('loupe', 18) + '</button>'
    + '<button type="button" class="trn-ic" data-trn="undo" id="trn-b-undo" aria-label="Annuler" title="Annuler (Ctrl Z)">' + _trnIc('retour', 18) + '</button>'
    + '<button type="button" class="trn-ic" data-trn="redo" id="trn-b-redo" aria-label="Rétablir" title="Rétablir (Ctrl Maj Z)">' + _trnIc('rotation', 18) + '</button></div>'
    + '<div class="trn-q" id="trn-qrow" hidden>' + _trnIc('loupe', 16) + '<input id="trn-q" type="search" placeholder="Trouver une parcelle" autocomplete="off" aria-label="Trouver une parcelle"><button type="button" class="trn-ic" data-trn="q-fermer" aria-label="Fermer la recherche">' + _trnIc('croix', 16) + '</button></div>'
    + '<div class="trn-scroll" id="trn-scroll"><ol class="trn-liste" id="trn-liste" aria-label="Parcelles dans l’ordre de passage"></ol></div>'
    + '<p class="trn-pied" id="trn-pied"></p></section>'
    + '<section class="trn-pane trn-pane-c" aria-label="Carte de la tournée"><div class="trn-bandeau" id="trn-trace" hidden></div>'
    + '<div class="trn-carte" id="trn-carte"><svg id="trn-map" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Carte des parcelles, numérotées dans l’ordre de passage">' + _trnCarteFixe() + '</svg>'
    + '<div class="trn-zoom" role="group" aria-label="Zoom"><button type="button" class="trn-ic" data-trn="zplus" aria-label="Zoomer"><span class="trn-plus-i" aria-hidden="true"></span></button><button type="button" class="trn-ic trn-moins" data-trn="zmoins" aria-label="Dézoomer"><span class="trn-moins-i" aria-hidden="true"></span></button><button type="button" class="trn-ic" data-trn="ztout" aria-label="Voir tout le domaine">' + _trnIc('carre', 18) + '</button></div>'
    + '<div class="trn-bas" id="trn-bas"><button type="button" class="trn-soft trn-tracer" id="trn-b-trace" data-trn="trace">' + _trnIc('doigt', 18) + '<span>Tracer sur la carte</span></button></div>'
    + '<div class="trn-sel" id="trn-sel" hidden></div><div class="trn-tip" id="trn-tip" hidden></div>'
    + '<p class="trn-vide" id="trn-vide" hidden>Pas de carte : aucun contour de parcelle n’est importé. La liste suffit pour ranger.</p></div>'
    + '<div class="trn-stats" id="trn-stats"></div></section></div>'
    + '<div class="trn-pop" id="trn-pop" hidden></div><div class="trn-layer" id="trn-layer" hidden></div>'
    + '<div class="trn-toast" id="trn-toast" role="status" aria-live="polite"></div><div class="trn-sr" id="trn-sr" aria-live="assertive"></div>';
  ov.hidden = false;
  document.body.classList.add('trn-ouvert');
  var ni = document.getElementById('trn-nom');
  ni.value = _TRN.nom;
  ni.addEventListener('input', function(){ _TRN.nom = ni.value; _trnHead(); });
  ni.addEventListener('keydown', function(e){ if(e.key === 'Enter') ni.blur(); });
  var q = document.getElementById('trn-q');
  q.addEventListener('input', function(){ _TRN.query = q.value; _TRN.matchI = 0; _trnListe(); _trnVoirResultat(); });
  q.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ e.preventDefault(); _TRN.matchI++; _trnVoirResultat(); }
    if(e.key === 'Escape'){ e.stopPropagation(); _trnFermerRecherche(); }
  });
  var ul = document.getElementById('trn-liste');
  ul.addEventListener('pointerdown', _trnGripDown);
  ul.addEventListener('pointermove', _trnGripMove);
  ul.addEventListener('pointerup', _trnGripUp);
  ul.addEventListener('pointercancel', _trnGripAnnule);
  ul.addEventListener('keydown', _trnListeTouche);
  ul.addEventListener('pointerover', function(e){ if(e.pointerType !== 'mouse' || _trnD || _TRN.pop) return; var r = e.target.closest('.trn-row2'); if(r) _trnSurvol(r.getAttribute('data-id')); });
  ul.addEventListener('pointerleave', function(e){ if(e.pointerType === 'mouse' && !_trnD && !_TRN.pop) _trnSurvol(null); });
  _trnLierCarte();
  _trnVB = Object.assign({}, _trnVB0 || { x: 0, y: 0, w: 1000, h: 1000 });
  _trnTout();
  _trnSetVB();
  _trnAppliquerVue();
  ov.focus && ov.setAttribute('tabindex', '-1');
}
function _trnTout(){ _trnHead(); _trnTaches(); _trnListe(); _trnCarte(); _trnStats(); _trnTraceBandeau(); _trnSelCarte(); _trnUndoEtat(); }
function _trnHead(){
  var d = _trnDirty(), et = document.getElementById('trn-etat'), b = document.getElementById('trn-save');
  if(et){ et.className = 'trn-etat' + (d ? ' mod' : ''); et.textContent = d ? (_TRN.neuve ? 'Pas encore enregistrée' : 'Modifiée') : ('Enregistrée' + (_trnDateFr(_TRN.date) ? ' le ' + _trnDateFr(_TRN.date) : '')); }
  if(b) b.disabled = !d;
}
function _trnTaches(){
  var el = document.getElementById('trn-taches'); if(!el) return;
  var trac = (window.ACTIVITES || []).map(function(a){ return a && a.nom; });
  var h = '<span class="trn-lbl" id="trn-lbl-t">L’équipe la suit pour</span><div class="trn-chips" role="list" aria-labelledby="trn-lbl-t">';
  if(!_TRN.taches.length) h += '<span class="trn-chip-vide" role="listitem">Aucun travail : l’équipe ne la verra pas.</span>';
  _TRN.taches.forEach(function(t){
    h += '<span class="trn-chip" role="listitem">' + (trac.indexOf(t) >= 0 ? '<span class="trn-chip-ic" title="Tracteur">' + _trnIc('tracteur', 14) + '</span>' : '') + _escHtml(_trnNomT(t))
      + '<button type="button" class="trn-chip-x" data-trn="tache" data-t="' + _escHtml(t) + '" aria-label="Retirer ' + _escHtml(_trnNomT(t)) + '">' + _trnIc('croix', 14) + '</button></span>';
  });
  el.innerHTML = h + '<button type="button" class="trn-chip-add" data-trn="taches" aria-haspopup="dialog">' + '<span class="trn-plus" aria-hidden="true">+</span>Ajouter un travail</button></div>';
}
function _trnOrdreAffiche(){
  if(!_TRN.trace) return _TRN.ordre;
  var s = {}; _TRN.trace.seq.forEach(function(k){ s[k] = 1; });
  return _TRN.trace.seq.concat(_TRN.trace.avant.filter(function(k){ return !s[k]; }));
}
function _trnSurligne(s, q){
  var i = _trnNorm(s).indexOf(q); if(i < 0) return _escHtml(s);
  return _escHtml(s.slice(0, i)) + '<mark>' + _escHtml(s.slice(i, i + q.length)) + '</mark>' + _escHtml(s.slice(i + q.length));
}
function _trnListe(){
  var ul = document.getElementById('trn-liste'); if(!ul) return;
  var o = _trnOrdreAffiche(), q = _trnNorm(_TRN.query.trim()), tr = null, h = '';
  if(_TRN.trace){ tr = {}; _TRN.trace.seq.forEach(function(k){ tr[k] = 1; }); }
  o.forEach(function(k, i){
    var p = _TRN.P[k]; if(!p) return;
    var m = q && _trnNorm(p.nom).indexOf(q) >= 0;
    var cls = 'trn-row2' + (_TRN.hover === k ? ' hl' : '') + (m ? ' match' : '') + (tr ? (tr[k] ? ' tr-on' : ' tr-off') : '') + (_TRN.flash === k ? ' flash' : '');
    var sub = [_trnCom(p), _trnHaFr(_trnHa(p))].filter(Boolean).join(' · ');
    h += '<li class="' + cls + '" data-id="' + _escHtml(k) + '">'
      + '<button type="button" class="trn-grip" data-trn="grip" aria-label="Déplacer ' + _escHtml(p.nom) + ', numéro ' + (i + 1) + '. Glisser, ou appuyer pour les choix." aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"' + (tr ? ' disabled' : '') + '>' + _trnIc('hautbas', 18) + '</button>'
      + '<span class="trn-num" aria-hidden="true">' + (tr && !tr[k] ? '' : (i + 1)) + '</span>'
      + '<button type="button" class="trn-main" data-trn="row"' + (tr ? ' disabled' : '') + '><span class="trn-nm">' + (m ? _trnSurligne(p.nom, q) : _escHtml(p.nom)) + (_TRN.nouvelles[k] ? '<span class="trn-neuve">à placer</span>' : '') + '</span><span class="trn-sub">' + _escHtml(sub) + '</span></button></li>';
  });
  ul.innerHTML = h;
  var tot = 0; o.forEach(function(k){ tot += _trnHa(_TRN.P[k]); });
  var pied = document.getElementById('trn-pied');
  if(pied) pied.innerHTML = '<span>' + _trnPlur(o.length, 'parcelle') + ' · ' + _escHtml(tot.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + '\u202fha</span><span class="trn-pied-aide">' + (_TRN.trace ? 'Touchez la carte dans l’ordre' : 'Glisser ou toucher pour déplacer') + '</span>';
  _TRN.flash = null;
}
function _trnUndoEtat(){
  var u = document.getElementById('trn-b-undo'), r = document.getElementById('trn-b-redo'); if(!u) return;
  u.disabled = !_TRN.hist.length || !!_TRN.trace;
  r.disabled = !_TRN.fut.length || !!_TRN.trace;
}
function _trnStats(){
  var el = document.getElementById('trn-stats'); if(!el) return;
  if(Object.keys(_TRN.ll || {}).length < 2){ el.innerHTML = ''; return; }
  var L = _trnLong(_TRN.ordre), N = _trnLong(_trnNN(_TRN.ordre));
  el.innerHTML = '<span class="trn-st-dep">Départ : la n°\u00a01</span><span>Trajets\u00a0: environ <b>' + _trnKm(L) + '</b></span>' + (N < L * 0.97 ? '<span class="trn-st-nn">Au plus proche : ' + _trnKm(N) + '</span>' : '');
}
function _trnTraceBandeau(){
  var el = document.getElementById('trn-trace'), b = document.getElementById('trn-b-trace'); if(!el) return;
  if(b) b.hidden = !!_TRN.trace || !_TRN.aCarte;
  if(!_TRN.trace){ el.hidden = true; el.innerHTML = ''; requestAnimationFrame(_trnPinEchelle); return; }
  var k = _TRN.trace.seq.length, n = _TRN.ordre.length;
  el.hidden = false;
  el.innerHTML = '<div class="trn-tb-tx"><b>Touchez les parcelles dans l’ordre de passage.</b><span>' + (k ? k + ' sur ' + n + ' placées. Les autres gardent leur ordre, après.' : 'La première touchée devient la n°\u00a01.') + '</span></div>'
    + '<div class="trn-tb-act"><button type="button" class="trn-ghost" data-trn="tr-retirer"' + (k ? '' : ' disabled') + '>' + _trnIc('retour', 16) + 'Retirer la dernière</button><button type="button" class="trn-ghost" data-trn="tr-annuler">Annuler</button><button type="button" class="trn-ok" data-trn="tr-fin">Terminer</button></div>';
  requestAnimationFrame(_trnPinEchelle);
}
function _trnSelCarte(){
  var el = document.getElementById('trn-sel'), cb = document.getElementById('trn-bas'); if(!el) return;
  if(!_TRN.sel || _trnPC() || _TRN.trace){ el.hidden = true; el.innerHTML = ''; if(cb) cb.hidden = false; return; }
  var p = _TRN.P[_TRN.sel], i = _TRN.ordre.indexOf(_TRN.sel);
  el.hidden = false; if(cb) cb.hidden = true;
  el.innerHTML = '<span class="trn-num">' + (i + 1) + '</span><div class="trn-sel-tx"><b>' + _escHtml(p.nom) + '</b><span>' + _escHtml([_trnCom(p), _trnHaFr(_trnHa(p))].filter(Boolean).join(' · ')) + '</span></div>'
    + '<button type="button" class="trn-soft" data-trn="sel-deplacer">' + _trnIc('hautbas', 16) + 'Déplacer</button><button type="button" class="trn-ic" data-trn="sel-fermer" aria-label="Fermer">' + _trnIc('croix', 16) + '</button>';
}
function _trnAppliquerVue(){
  var ov = document.getElementById('trn-ov'); if(!ov) return;
  ov.classList.toggle('vue-carte', _TRN.vue === 'carte');
  ov.classList.toggle('vue-liste', _TRN.vue !== 'carte');
  var a = document.getElementById('trn-seg-l'), b = document.getElementById('trn-seg-c');
  if(a){ a.setAttribute('aria-selected', String(_TRN.vue !== 'carte')); b.setAttribute('aria-selected', String(_TRN.vue === 'carte')); }
  _trnSelCarte();
  requestAnimationFrame(_trnPinEchelle);
}

// ── Historique ──
function _trnPushHist(){ _TRN.hist.push({ ordre: _TRN.ordre.slice(), taches: _TRN.taches.slice() }); if(_TRN.hist.length > 80) _TRN.hist.shift(); _TRN.fut = []; }
function _trnUndo(){
  if(!_TRN || !_TRN.hist.length || _TRN.trace) return;
  _TRN.fut.push({ ordre: _TRN.ordre.slice(), taches: _TRN.taches.slice() });
  var s = _TRN.hist.pop(); _TRN.ordre = s.ordre; _TRN.taches = s.taches; _trnTout(); _trnAnnonce('Annulé.');
}
function _trnRedo(){
  if(!_TRN || !_TRN.fut.length || _TRN.trace) return;
  _TRN.hist.push({ ordre: _TRN.ordre.slice(), taches: _TRN.taches.slice() });
  var s = _TRN.fut.pop(); _TRN.ordre = s.ordre; _TRN.taches = s.taches; _trnTout(); _trnAnnonce('Rétabli.');
}
function _trnSetOrdre(nv, voir){ _trnPushHist(); _TRN.ordre = nv; _TRN.flash = voir || null; if(voir) delete _TRN.nouvelles[voir]; _trnTout(); if(voir) _trnMontrer(voir); }
function _trnMontrer(k){ var r = document.querySelector('#trn-liste .trn-row2[data-id="' + k + '"]'); if(r) r.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
function _trnDeplacer(k, to){
  var o = _TRN.ordre.slice(), from = o.indexOf(k);
  if(from < 0 || from === to) return false;
  o.splice(from, 1); o.splice(to, 0, k);
  _trnSetOrdre(o, k);
  _trnAnnonce(_TRN.P[k].nom + ' placée en numéro ' + (to + 1) + '.');
  return true;
}

// ── Glisser-déposer : par la poignée, souris ou doigt, sans appui long ──
function _trnGripDown(e){
  var g = e.target.closest('.trn-grip'); if(!g || g.disabled || _TRN.trace) return;
  if(e.pointerType === 'mouse' && e.button !== 0) return;
  var li = g.closest('.trn-row2'), sc = document.getElementById('trn-scroll');
  var rows = Array.prototype.slice.call(document.querySelectorAll('#trn-liste .trn-row2'));
  _trnD = { id: li.getAttribute('data-id'), li: li, g: g, sc: sc, rows: rows, idx: rows.indexOf(li), over: rows.indexOf(li), y0: e.clientY, s0: sc.scrollTop, h: li.getBoundingClientRect().height, y: e.clientY, pid: e.pointerId, moved: false, auto: 0, raf: 0 };
  try{ g.setPointerCapture(e.pointerId); }
  catch(err){ _trnLog('capture du pointeur'); }
}
function _trnGripMove(e){
  var D = _trnD; if(!D || e.pointerId !== D.pid) return;
  D.y = e.clientY;
  if(!D.moved){
    if(Math.abs(e.clientY - D.y0) < 5) return;
    D.moved = true; _trnFermerPop(true);
    D.li.classList.add('drag'); document.getElementById('trn-liste').classList.add('dragging'); document.body.classList.add('trn-glisse');
    if(navigator.vibrate) navigator.vibrate(8);
  }
  e.preventDefault();
  _trnMajGlisse();
  var r = D.sc.getBoundingClientRect(), bord = 56;
  D.auto = e.clientY < r.top + bord ? -Math.min(1, (r.top + bord - e.clientY) / bord) : (e.clientY > r.bottom - bord ? Math.min(1, (e.clientY - (r.bottom - bord)) / bord) : 0);
  if(D.auto && !D.raf) D.raf = requestAnimationFrame(_trnDefil);
}
function _trnMajGlisse(){
  var D = _trnD, dy = (D.y - D.y0) + (D.sc.scrollTop - D.s0), n = D.rows.length;
  var over = Math.max(0, Math.min(n - 1, D.idx + Math.round(dy / D.h)));
  D.over = over;
  D.li.style.transform = 'translate3d(0,' + dy + 'px,0)';
  for(var i = 0; i < n; i++){
    if(i === D.idx) continue;
    var t = 0, ni = i;
    if(D.idx < over && i > D.idx && i <= over){ t = -D.h; ni = i - 1; }
    else if(D.idx > over && i >= over && i < D.idx){ t = D.h; ni = i + 1; }
    D.rows[i].style.transform = t ? 'translate3d(0,' + t + 'px,0)' : '';
    var nb = D.rows[i].querySelector('.trn-num'); if(nb) nb.textContent = String(ni + 1);
  }
  var n0 = D.li.querySelector('.trn-num'); if(n0) n0.textContent = String(over + 1);
}
function _trnDefil(){
  var D = _trnD; if(!D) return;
  D.raf = 0;
  if(!D.moved || !D.auto) return;
  D.sc.scrollTop += D.auto * 16;
  _trnMajGlisse();
  D.raf = requestAnimationFrame(_trnDefil);
}
function _trnGripUp(e){
  var D = _trnD; if(!D || e.pointerId !== D.pid) return;
  _trnD = null;
  if(D.raf) cancelAnimationFrame(D.raf);
  try{ D.g.releasePointerCapture(e.pointerId); }
  catch(err){ _trnLog('relâche du pointeur'); }
  document.body.classList.remove('trn-glisse');
  if(!D.moved) return;
  _trnApresGlisse = true; setTimeout(function(){ _trnApresGlisse = false; }, 60);
  document.getElementById('trn-liste').classList.remove('dragging');
  if(!_trnDeplacer(D.id, D.over)) _trnListe();
}
function _trnGripAnnule(){
  var D = _trnD; if(!D) return;
  _trnD = null;
  if(D.raf) cancelAnimationFrame(D.raf);
  document.body.classList.remove('trn-glisse');
  var ul = document.getElementById('trn-liste'); if(ul) ul.classList.remove('dragging');
  _trnListe();
}
function _trnListeTouche(e){
  var g = e.target.closest('.trn-grip');
  if(!g || !e.altKey || _TRN.trace || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
  e.preventDefault();
  var k = g.closest('.trn-row2').getAttribute('data-id'), i = _TRN.ordre.indexOf(k), to = e.key === 'ArrowUp' ? i - 1 : i + 1;
  if(to < 0 || to >= _TRN.ordre.length) return;
  _trnDeplacer(k, to); _trnFocusPoignee(k);
}
function _trnFocusPoignee(k){ var g = document.querySelector('#trn-liste .trn-row2[data-id="' + k + '"] .trn-grip'); if(g) g.focus({ preventScroll: true }); }

// ── Le menu d'une parcelle ──
function _trnOuvrirMove(k, ancre){
  _TRN.cible = k;
  if(_trnPC()){ _trnSurvol(k); _trnPop('move', ancre); }
  else _trnFeuille('move');
}
function _trnMoveHtml(){
  var k = _TRN.cible, p = _TRN.P[k], o = _TRN.ordre, i = o.indexOf(k), n = o.length;
  function it(a, ic, lab, dis, kbd, cls){ return '<button type="button" class="trn-mn' + (cls ? ' ' + cls : '') + '" role="menuitem" data-trn="mv" data-k="' + a + '"' + (dis ? ' disabled' : '') + '>' + _trnIc(ic, 16) + '<span>' + lab + '</span>' + (kbd && _trnPC() ? '<kbd>' + kbd + '</kbd>' : '') + '</button>'; }
  return '<div class="trn-mn-hd"><span class="trn-num">' + (i + 1) + '</span><div><b>' + _escHtml(p.nom) + '</b><span>n°\u00a0' + (i + 1) + ' sur ' + n + (_trnCom(p) ? ' · ' + _escHtml(_trnCom(p)) : '') + '</span></div></div>'
    + '<div class="trn-mn-g" role="menu" aria-label="Déplacer ' + _escHtml(p.nom) + '">'
    + it('top', 'drapeau', 'Mettre en premier', i === 0) + it('up', 'chevron', 'Monter d’une place', i === 0, '', 'trn-rot-haut') + it('down', 'chevron', 'Descendre d’une place', i === n - 1, '', 'trn-rot-bas') + it('bottom', 'cible', 'Mettre en dernier', i === n - 1)
    + '<div class="trn-mn-sep"></div><button type="button" class="trn-mn" role="menuitem" data-trn="placer">' + _trnIc('parcours', 16) + '<span>Placer après une parcelle…</span></button></div>';
}
function _trnMv(a){
  var k = _TRN.cible; if(!k) return;
  var i = _TRN.ordre.indexOf(k), n = _TRN.ordre.length;
  var to = a === 'top' ? 0 : (a === 'up' ? Math.max(0, i - 1) : (a === 'down' ? Math.min(n - 1, i + 1) : n - 1));
  _trnFermerPop(true); _trnFermerFeuille(true); _trnSurvol(null);
  _trnDeplacer(k, to);
  if(_trnPC()) _trnFocusPoignee(k);
}
function _trnPlacerItems(q){
  var nq = _trnNorm(String(q || '').trim()), k = _TRN.cible, o = _TRN.ordre;
  var h = nq ? '' : '<button type="button" class="trn-pl-it" data-trn="placer-apres" data-apres="__haut"><span class="trn-num trn-num-o">1</span><span>Tout en haut de la tournée</span></button>';
  o.forEach(function(x, i){
    if(x === k) return;
    var p = _TRN.P[x]; if(!p || (nq && _trnNorm(p.nom).indexOf(nq) < 0)) return;
    h += '<button type="button" class="trn-pl-it" data-trn="placer-apres" data-apres="' + _escHtml(x) + '"><span class="trn-num">' + (i + 1) + '</span><span>' + _escHtml(p.nom) + (_trnCom(p) ? '<small>' + _escHtml(_trnCom(p)) + '</small>' : '') + '</span></button>';
  });
  return h || '<p class="trn-vide2">Aucune parcelle ne porte ce nom.</p>';
}
function _trnPlacerApres(apres){
  var k = _TRN.cible, o = _TRN.ordre.filter(function(x){ return x !== k; });
  var i = apres === '__haut' ? 0 : o.indexOf(apres) + 1;
  o.splice(i, 0, k);
  _trnFermerFeuille(true);
  _trnSetOrdre(o, k);
  _trnToast(_TRN.P[k].nom + ' placée en n°\u00a0' + (i + 1) + '.');
}

// ── Ranger automatiquement ──
function _trnHav(a, b){
  var R = 6371000, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lng - a.lng) * r;
  var s = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
function _trnLong(o){ var d = 0, prev = null; o.forEach(function(k){ var g = _TRN.ll[k]; if(!g) return; if(prev) d += _trnHav(prev, g); prev = g; }); return d; }
// Au plus proche, en partant de `depuis` (un point) ou, sans point, de la première parcelle placée de la liste.
function _trnNNdepuis(ids, depuis){
  var avec = ids.filter(function(k){ return !!_TRN.ll[k]; }), sans = ids.filter(function(k){ return !_TRN.ll[k]; });
  if(!avec.length) return ids.slice();
  var out = [], rest = avec.slice(), cur = depuis;
  if(!cur){ out.push(rest.shift()); cur = _TRN.ll[out[0]]; }
  while(rest.length){
    var bi = 0, bd = Infinity;
    for(var i = 0; i < rest.length; i++){ var d = _trnHav(cur, _TRN.ll[rest[i]]); if(d < bd){ bd = d; bi = i; } }
    var k = rest.splice(bi, 1)[0]; out.push(k); cur = _TRN.ll[k];
  }
  return out.concat(sans);
}
function _trnNN(ids){ return _trnNNdepuis(ids, null); }
function _trnParCommune(o){
  var groupes = {}, coms = [], sansCom = [];
  o.forEach(function(k){ var c = _trnCom(_TRN.P[k]); if(!c){ sansCom.push(k); return; } if(!groupes[c]){ groupes[c] = []; coms.push(c); } groupes[c].push(k); });
  var out = [], cur = null;
  while(coms.length){
    var bi = 0;
    if(cur){
      var bd = Infinity;
      coms.forEach(function(c, i){ groupes[c].forEach(function(k){ var g = _TRN.ll[k]; if(g){ var d = _trnHav(cur, g); if(d < bd){ bd = d; bi = i; } } }); });
    }
    var seq = _trnNNdepuis(groupes[coms.splice(bi, 1)[0]], cur);
    out = out.concat(seq);
    for(var j = seq.length - 1; j >= 0; j--){ if(_TRN.ll[seq[j]]){ cur = _TRN.ll[seq[j]]; break; } }
  }
  return out.concat(_trnNNdepuis(sansCom, cur));
}
function _trnNbCommunes(){ var c = {}; _TRN.ordre.forEach(function(k){ var n = _trnCom(_TRN.P[k]); if(n) c[n] = 1; }); return Object.keys(c).length; }
function _trnPresetOrdre(k){
  var o = _TRN.ordre;
  if(k === 'nn') return _trnNN(o);
  if(k === 'com') return _trnParCommune(o);
  if(k === 'dom'){ var r = {}; _trnParcs().forEach(function(p, i){ r[_trnIdP(p)] = i; }); return o.slice().sort(function(a, b){ return (r[a] != null ? r[a] : 1e9) - (r[b] != null ? r[b] : 1e9); }); }
  if(k === 'surf') return o.slice().sort(function(a, b){ return _trnHa(_TRN.P[b]) - _trnHa(_TRN.P[a]); });
  return o.slice().reverse();
}
var _TRN_PRESETS = [
  { k: 'nn', ic: 'boussole', t: 'Au plus proche', d: 'Le trajet le plus court, en partant de la n°\u00a01.' },
  { k: 'com', ic: 'bureau', t: 'Par commune', d: 'Commune par commune, au plus proche dans chacune.' },
  { k: 'dom', ic: 'liste', t: 'Ordre du domaine', d: 'L’ordre de votre liste de parcelles.' },
  { k: 'surf', ic: 'nombre', t: 'Grandes d’abord', d: 'De la plus grande à la plus petite.' },
  { k: 'inv', ic: 'hautbas', t: 'Inverser', d: 'La même tournée, dans l’autre sens.' }
];
function _trnPresetsHtml(){
  var cur = _TRN.ordre.join('|'), geo = Object.keys(_TRN.ll || {}).length > 1;
  return '<div class="trn-mn-g" role="menu">' + _TRN_PRESETS.filter(function(pr){ return pr.k !== 'com' || _trnNbCommunes() > 1; }).map(function(pr){
    var o = pr.k === 'inv' ? null : _trnPresetOrdre(pr.k), on = o && o.join('|') === cur;
    return '<button type="button" class="trn-mn trn-mn2" role="menuitem" data-trn="preset" data-k="' + pr.k + '">' + _trnIc(pr.ic, 16) + '<span class="trn-mn-tx"><b>' + pr.t + (on ? '<em>actuel</em>' : '') + '</b><small>' + pr.d + '</small></span>' + (o && geo ? '<span class="trn-mn-km">' + _trnKm(_trnLong(o)) + '</span>' : '') + '</button>';
  }).join('') + '</div>';
}
function _trnPreset(k){
  _trnFermerPop(true); _trnFermerFeuille(true);
  var nv = _trnPresetOrdre(k);
  if(nv.join('|') === _TRN.ordre.join('|')){ _trnToast('La tournée est déjà dans cet ordre.'); return; }
  _trnSetOrdre(nv);
  var sc = document.getElementById('trn-scroll'); if(sc) sc.scrollTop = 0;
  _trnToast({ nn: 'Rangée au plus proche.', com: 'Rangée par commune.', dom: 'Rangée dans l’ordre du domaine.', surf: 'Rangée des plus grandes aux plus petites.', inv: 'Tournée inversée.' }[k], { label: 'Annuler', fn: _trnUndo });
}

// ── Les travaux qui suivent la tournée ──
function _trnCatalogue(){
  var vigne = [], trac = [], vus = {}, src = [];
  try{ src = (typeof window.getTachesSaison === 'function') ? window.getTachesSaison() : []; }
  catch(e){ _trnLog('catalogue des tâches'); }
  (src || []).concat(window.TACHES || []).forEach(function(t){ var n = t && t.nom; if(n && !vus[n]){ vus[n] = 1; vigne.push(n); } });
  (window.ACTIVITES || []).forEach(function(a){ var n = a && a.nom; if(n && !vus[n]){ vus[n] = 1; trac.push(n); } });
  return { vigne: vigne, trac: trac };
}
function _trnAutre(t){ var id = _TRN.id; return _trnLues().filter(function(x){ return x.id !== id && x.taches.indexOf(t) >= 0; })[0] || null; }
function _trnTachesHtml(){
  var c = _trnCatalogue();
  function it(t){
    var on = _TRN.taches.indexOf(t) >= 0, a = _trnAutre(t);
    var note = a ? (on ? 'passera de « ' + _escHtml(a.nom) + ' » à celle-ci' : 'suit « ' + _escHtml(a.nom) + ' »') : '';   // déjà échappée : ne pas la repasser
    return '<button type="button" class="trn-pk' + (on ? ' on' : '') + '" role="menuitemcheckbox" aria-checked="' + on + '" data-trn="tache" data-t="' + _escHtml(t) + '"><span class="trn-pk-box">' + (on ? _trnIc('check', 14) : '') + '</span><span class="trn-pk-t">' + _escHtml(_trnNomT(t)) + (note ? '<small>' + note + '</small>' : '') + '</span></button>';
  }
  return '<div class="trn-pk-g" role="group" aria-label="Vigne"><p class="trn-pk-lbl">Vigne</p>' + c.vigne.map(it).join('') + '</div>'
    + (c.trac.length ? '<div class="trn-pk-g" role="group" aria-label="Tracteur"><p class="trn-pk-lbl">Tracteur</p>' + c.trac.map(it).join('') + '</div>' : '');
}
function _trnBasculer(t){
  _trnPushHist();
  var i = _TRN.taches.indexOf(t);
  if(i >= 0) _TRN.taches.splice(i, 1); else _TRN.taches.push(t);
  var c = _trnCatalogue(), ref = c.vigne.concat(c.trac);
  _TRN.taches.sort(function(a, b){ return ref.indexOf(a) - ref.indexOf(b); });
  _trnTaches(); _trnHead(); _trnUndoEtat(); _trnRafraichirPop(); if(_TRN.sheet === 'taches') _trnRafraichirFeuille();
}

// ── Enregistrer, dupliquer, supprimer ──
function _trnEnregistrer(){
  var nom = _TRN.nom.trim();
  if(!nom){ _trnToast('Donnez un nom à la tournée.'); var ni = document.getElementById('trn-nom'); if(ni) ni.focus(); return false; }
  if(!isAdmin()){ showToast('Réservé à l’administrateur', '#C0392B'); return false; }
  var moiT = _TRN.taches, partis = [];
  var liste = _trnLues().map(function(t){ return Object.assign({}, t, { taches: t.taches.slice(), ordre: t.ordre.slice() }); });
  liste.forEach(function(t){
    if(t.id === _TRN.id) return;
    var garde = t.taches.filter(function(x){ return moiT.indexOf(x) < 0; });
    t.taches.forEach(function(x){ if(garde.indexOf(x) < 0) partis.push(_trnNomT(x) + ' passe de « ' + t.nom + ' » à « ' + nom + ' »'); });
    t.taches = garde;
  });
  var moi = { id: _TRN.id, nom: nom, taches: moiT.slice(), ordre: _TRN.ordre.concat(_TRN.caches), date: _trnJour(), par: (window.currentUser && window.currentUser.nom) || '' };
  var i = -1; liste.forEach(function(t, j){ if(t.id === _TRN.id) i = j; });
  if(i >= 0) liste[i] = Object.assign({}, liste[i], moi); else liste.push(moi);
  _trnEcrire(liste);
  _TRN.nom = nom; _TRN.date = moi.date; _TRN.neuve = false; _TRN.base = _trnSnap(); _TRN.nouvelles = {};
  var ni2 = document.getElementById('trn-nom'); if(ni2 && document.activeElement !== ni2) ni2.value = nom;
  _trnHead(); _trnListe();
  _trnToast('Tournée enregistrée. L’équipe la verra à sa prochaine ouverture de l’application.' + (partis.length ? ' ' + partis.join(', ') + '.' : ''));
  return true;
}
function _trnDupliquer(){
  _trnFermerPop(true); _trnFermerFeuille(true);
  if(_trnDirty()){ _trnToast('Enregistrez d’abord vos changements, puis dupliquez.'); return; }
  var ordre = _TRN.ordre.slice(), depuis = _TRN.depuis, nom = _TRN.nom.trim() + ' (copie)';
  _trnOuvrir('', depuis, { nom: nom, taches: [], ordre: ordre, copie: true });
}
function _trnSupprimer(){
  var id = _TRN.id, nom = _TRN.nom.trim() || 'Tournée';
  _trnFermerFeuille(true);
  if(!_TRN.neuve) _trnEcrire(_trnLues().filter(function(t){ return t.id !== id; }));
  _trnFermer();
  showToast('Tournée « ' + nom + ' » supprimée. Ses travaux reviennent à l’ordre habituel.', '#3D6B27');
}

// ── La carte : les contours KML, projetés une fois à l'ouverture ──
function _trnGeo(){
  var src = (window.KML_POLYGONS_DYNAMIC && window.KML_POLYGONS_DYNAMIC.length) ? window.KML_POLYGONS_DYNAMIC : (window.KML_DATA || []);
  var polys = {};
  (src || []).forEach(function(k){ if(k && k.name && k.pts && k.pts.length > 2) polys[String(k.name).toLowerCase()] = k.pts; });
  var brut = {}, la0 = Infinity, la1 = -Infinity, lo0 = Infinity, lo1 = -Infinity;
  function etend(la, lo){ if(la < la0) la0 = la; if(la > la1) la1 = la; if(lo < lo0) lo0 = lo; if(lo > lo1) lo1 = lo; }
  _TRN.ll = {}; _TRN.xy = {};
  Object.keys(_TRN.P).forEach(function(k){
    var p = _TRN.P[k], pl = polys[String(p.nom).toLowerCase()] || null;
    var g = (typeof window._mvParcGeo === 'function') ? window._mvParcGeo(p) : null;
    if(pl){ pl.forEach(function(pt){ etend(pt[0], pt[1]); }); if(!g){ var a = 0, b = 0; pl.forEach(function(pt){ a += pt[0]; b += pt[1]; }); g = { lat: a / pl.length, lng: b / pl.length }; } }
    if(g){ etend(g.lat, g.lng); _TRN.ll[k] = g; }
    if(pl || g) brut[k] = { pl: pl, g: g };
  });
  _TRN.aCarte = Object.keys(brut).length > 0;
  if(!_TRN.aCarte){ _trnVB0 = { x: 0, y: 0, w: 1000, h: 1000 }; return; }
  var kc = Math.cos((la0 + la1) / 2 * Math.PI / 180), w = Math.max((lo1 - lo0) * kc, 1e-6), h = Math.max(la1 - la0, 1e-6), S = 1000 / Math.max(w, h);
  function xy(la, lo){ return [(lo - lo0) * kc * S, (la1 - la) * S]; }
  Object.keys(brut).forEach(function(k){
    var b = brut[k], c = xy(b.g.lat, b.g.lng);
    _TRN.xy[k] = { pts: b.pl ? b.pl.map(function(pt){ return xy(pt[0], pt[1]); }) : null, cx: c[0], cy: c[1] };
  });
  var pad = 40;
  _trnVB0 = { x: -pad, y: -pad, w: w * S + 2 * pad, h: h * S + 2 * pad };
}
function _trnCarteFixe(){
  if(!_TRN.aCarte) return '';
  var parcs = '';
  Object.keys(_TRN.xy).forEach(function(k){
    var g = _TRN.xy[k];
    if(g.pts) parcs += '<path class="trn-p" data-id="' + _escHtml(k) + '" d="M' + g.pts.map(function(q){ return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L') + 'Z"></path>';
    else parcs += '<circle class="trn-p" data-id="' + _escHtml(k) + '" cx="' + g.cx.toFixed(1) + '" cy="' + g.cy.toFixed(1) + '" r="9"></circle>';
  });
  return '<rect class="trn-fond" x="-5000" y="-5000" width="11000" height="11000"></rect><g id="trn-parcs">' + parcs + '</g><polyline id="trn-route" class="trn-route" points=""></polyline><g id="trn-pins"></g>';
}
function _trnCarte(){
  var svg = document.getElementById('trn-map'), vide = document.getElementById('trn-vide');
  if(vide) vide.hidden = !!_TRN.aCarte;
  if(!svg || !_TRN.aCarte) return;
  var o = _trnOrdreAffiche(), tr = null;
  if(_TRN.trace){ tr = {}; _TRN.trace.seq.forEach(function(k){ tr[k] = 1; }); }
  var route = (_TRN.trace ? _TRN.trace.seq : o).filter(function(k){ return !!_TRN.xy[k]; });
  var r = document.getElementById('trn-route');
  r.setAttribute('points', route.map(function(k){ return _TRN.xy[k].cx.toFixed(1) + ',' + _TRN.xy[k].cy.toFixed(1); }).join(' '));
  r.classList.toggle('tracing', !!_TRN.trace);
  Array.prototype.forEach.call(document.querySelectorAll('#trn-parcs .trn-p'), function(el){
    var k = el.getAttribute('data-id');
    el.classList.toggle('hl', _TRN.hover === k || _TRN.sel === k);
    el.classList.toggle('tr-on', !!tr && !!tr[k]);
  });
  var h = '';
  o.forEach(function(k, i){
    var g = _TRN.xy[k]; if(!g) return;
    var off = tr && !tr[k];
    h += '<g class="trn-pin' + (off ? ' off' : '') + (!off && tr ? ' tr' : '') + (_TRN.hover === k || _TRN.sel === k ? ' hl' : '') + '" data-id="' + _escHtml(k) + '" data-x="' + g.cx.toFixed(1) + '" data-y="' + g.cy.toFixed(1) + '">'
      + (off ? '<circle r="4"></circle>' : '<circle r="10"></circle><text text-anchor="middle" dy="0.36em">' + (i + 1) + '</text>') + '</g>';
  });
  document.getElementById('trn-pins').innerHTML = h;
  var top = document.querySelector('#trn-pins .trn-pin.hl'); if(top) top.parentNode.appendChild(top);
  _trnPinEchelle();
}
function _trnPpu(){ var s = document.getElementById('trn-map'); if(!s || !_trnVB) return 0; var r = s.getBoundingClientRect(); if(!r.width || !r.height) return 0; return Math.min(r.width / _trnVB.w, r.height / _trnVB.h); }
function _trnPinEchelle(){
  if(!_TRN) return;
  var k = _trnPpu(); if(!k) return;
  var s = (1 / k).toFixed(4);
  Array.prototype.forEach.call(document.querySelectorAll('#trn-pins .trn-pin'), function(g){ g.setAttribute('transform', 'translate(' + g.getAttribute('data-x') + ' ' + g.getAttribute('data-y') + ') scale(' + s + ')'); });
}
function _trnSetVB(){ var s = document.getElementById('trn-map'); if(!s || !_trnVB) return; s.setAttribute('viewBox', _trnVB.x.toFixed(2) + ' ' + _trnVB.y.toFixed(2) + ' ' + _trnVB.w.toFixed(2) + ' ' + _trnVB.h.toFixed(2)); _trnPinEchelle(); }
function _trnBorner(){
  var V = _trnVB0, mx = V.w * 0.2, my = V.h * 0.2;
  _trnVB.x = Math.min(Math.max(_trnVB.x, V.x - mx), V.x + V.w + mx - _trnVB.w);
  _trnVB.y = Math.min(Math.max(_trnVB.y, V.y - my), V.y + V.h + my - _trnVB.h);
}
function _trnZoomA(f, cx, cy){
  var s = document.getElementById('trn-map'), r = s.getBoundingClientRect(), k = _trnPpu(); if(!k) return;
  var offX = (r.width - _trnVB.w * k) / 2, offY = (r.height - _trnVB.h * k) / 2;
  var ux = _trnVB.x + (cx - r.left - offX) / k, uy = _trnVB.y + (cy - r.top - offY) / k;
  var nw = Math.max(_trnVB0.w / 8, Math.min(_trnVB0.w, _trnVB.w / f)), nh = nw * _trnVB0.h / _trnVB0.w;
  _trnVB.x = ux - (ux - _trnVB.x) * nw / _trnVB.w; _trnVB.y = uy - (uy - _trnVB.y) * nh / _trnVB.h; _trnVB.w = nw; _trnVB.h = nh;
  _trnBorner(); _trnSetVB();
}
function _trnZoomBouton(f){ var r = document.getElementById('trn-map').getBoundingClientRect(); _trnZoomA(f, r.left + r.width / 2, r.top + r.height / 2); }
function _trnSurvol(k){
  if(!_TRN || _TRN.hover === k) return;
  var old = _TRN.hover; _TRN.hover = k;
  [old, k].forEach(function(x){
    if(!x) return;
    var on = x === k || x === _TRN.sel;
    var r = document.querySelector('#trn-liste .trn-row2[data-id="' + x + '"]'); if(r) r.classList.toggle('hl', x === k);
    var p = document.querySelector('#trn-parcs [data-id="' + x + '"]'); if(p) p.classList.toggle('hl', on);
    var g = document.querySelector('#trn-pins [data-id="' + x + '"]'); if(g){ g.classList.toggle('hl', on); if(x === k) g.parentNode.appendChild(g); }
  });
}
function _trnBulle(k, e){
  var tip = document.getElementById('trn-tip'), wrap = document.getElementById('trn-carte'); if(!tip) return;
  var p = _TRN.P[k], i = _trnOrdreAffiche().indexOf(k), off = _TRN.trace && _TRN.trace.seq.indexOf(k) < 0;
  tip.innerHTML = '<b>' + (off ? '·' : (i + 1)) + '</b>' + _escHtml(p.nom) + '<span>' + _escHtml(_trnHaFr(_trnHa(p))) + '</span>';
  tip.hidden = false;
  var r = wrap.getBoundingClientRect(), w = tip.offsetWidth, x = e.clientX - r.left + 14;
  if(x + w > r.width - 8) x = e.clientX - r.left - w - 14;
  tip.style.left = Math.round(x) + 'px'; tip.style.top = Math.round(e.clientY - r.top + 16) + 'px';
}
function _trnCacheBulle(){ var t = document.getElementById('trn-tip'); if(t) t.hidden = true; }
function _trnLierCarte(){
  var svg = document.getElementById('trn-map'); if(!svg) return;
  svg.addEventListener('pointerdown', function(e){
    if(e.pointerType === 'mouse' && e.button !== 0) return;
    var t = e.target.closest('[data-id]');
    _trnM = { x0: e.clientX, y0: e.clientY, vx: _trnVB.x, vy: _trnVB.y, id: t ? t.getAttribute('data-id') : null, pan: false, pid: e.pointerId };
    try{ svg.setPointerCapture(e.pointerId); }
    catch(err){ _trnLog('capture carte'); }
  });
  svg.addEventListener('pointermove', function(e){
    if(_trnM && e.pointerId === _trnM.pid){
      var dx = e.clientX - _trnM.x0, dy = e.clientY - _trnM.y0;
      if(!_trnM.pan && Math.sqrt(dx * dx + dy * dy) > 6){ _trnM.pan = true; svg.classList.add('panning'); _trnCacheBulle(); }
      if(_trnM.pan){ var k = _trnPpu(); _trnVB.x = _trnM.vx - dx / k; _trnVB.y = _trnM.vy - dy / k; _trnBorner(); _trnSetVB(); }
      return;
    }
    if(e.pointerType === 'mouse'){ var t = e.target.closest('[data-id]'); _trnSurvol(t ? t.getAttribute('data-id') : null); if(t) _trnBulle(t.getAttribute('data-id'), e); else _trnCacheBulle(); }
  });
  svg.addEventListener('pointerup', function(e){
    if(!_trnM || e.pointerId !== _trnM.pid) return;
    var m = _trnM; _trnM = null; svg.classList.remove('panning');
    if(m.pan) return;
    if(m.id) _trnToucheParcelle(m.id, e);
    else if(_TRN.sel){ _TRN.sel = null; _trnSelCarte(); _trnCarte(); }
  });
  svg.addEventListener('pointercancel', function(){ _trnM = null; svg.classList.remove('panning'); });
  svg.addEventListener('pointerleave', function(e){ if(e.pointerType === 'mouse' && !_trnM){ _trnSurvol(null); _trnCacheBulle(); } });
  svg.addEventListener('wheel', function(e){ e.preventDefault(); _trnZoomA(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX, e.clientY); }, { passive: false });
}
function _trnToucheParcelle(k, e){
  if(_TRN.trace){ _trnTraceTouche(k); return; }
  if(_trnPC()){ _trnMontrer(k); _trnOuvrirMove(k, { x: e.clientX, y: e.clientY }); }
  else { _TRN.sel = k; _trnSelCarte(); _trnCarte(); }
}

// ── Tracer sur la carte ──
function _trnTraceDebut(){
  _trnFermerPop(true);
  _TRN.trace = { seq: [], avant: _TRN.ordre.slice() }; _TRN.sel = null;
  if(!_trnPC()){ _TRN.vue = 'carte'; _trnAppliquerVue(); }
  _trnTout(); _trnAnnonce('Touchez les parcelles dans l’ordre de passage.');
}
function _trnTraceTouche(k){
  var s = _TRN.trace.seq, i = s.indexOf(k);
  if(i < 0){ s.push(k); _trnAnnonce(_TRN.P[k].nom + ', numéro ' + s.length + '.'); }
  else if(i === s.length - 1){ s.pop(); _trnAnnonce(_TRN.P[k].nom + ' retirée.'); }
  else { _trnToast(_TRN.P[k].nom + ' est déjà la n°\u00a0' + (i + 1) + '. Retirez les dernières pour la reprendre.'); return; }
  _trnListe(); _trnCarte(); _trnTraceBandeau();
}
function _trnTraceRetirer(){ if(!_TRN.trace || !_TRN.trace.seq.length) return; _TRN.trace.seq.pop(); _trnListe(); _trnCarte(); _trnTraceBandeau(); }
function _trnTraceAnnuler(){ if(!_TRN.trace) return; _TRN.trace = null; _trnTout(); }
function _trnTraceFin(){
  var t = _TRN.trace; if(!t) return;
  var nv = _trnOrdreAffiche(); _TRN.trace = null;
  if(t.seq.length && nv.join('|') !== _TRN.ordre.join('|')){
    _trnPushHist(); _TRN.ordre = nv; t.seq.forEach(function(k){ delete _TRN.nouvelles[k]; }); _trnTout();
    _trnToast(_trnPlur(t.seq.length, 'parcelle placée', 'parcelles placées') + ' en tête, dans l’ordre tracé.', { label: 'Annuler', fn: _trnUndo });
  } else _trnTout();
}

// ── Recherche ──
function _trnOuvrirRecherche(){ var row = document.getElementById('trn-qrow'); if(!row) return; row.hidden = false; document.getElementById('trn-q').focus(); }
function _trnFermerRecherche(){
  var row = document.getElementById('trn-qrow'), q = document.getElementById('trn-q'); if(!row) return;
  q.value = ''; _TRN.query = ''; row.hidden = true; _trnListe();
  var b = document.getElementById('trn-b-q'); if(b) b.focus({ preventScroll: true });
}
function _trnVoirResultat(){
  var m = document.querySelectorAll('#trn-liste .trn-row2.match'); if(!m.length) return;
  var r = m[_TRN.matchI % m.length];
  r.scrollIntoView({ block: 'center', behavior: 'smooth' });
  _trnSurvol(r.getAttribute('data-id'));
}

// ── Menus (ordinateur) et feuilles (téléphone) ──
function _trnPop(kind, ancre){
  if(!_trnPC()){ _trnFeuille(kind); return; }
  _trnFermerPop(true);
  _TRN.pop = kind; _trnPopAncre = (ancre && ancre.nodeType) ? ancre : null;
  var el = document.getElementById('trn-pop');
  el.innerHTML = _trnPopHtml(kind); el.hidden = false;
  var vw = window.innerWidth, vh = window.innerHeight, w = el.offsetWidth, h = el.offsetHeight, x, y;
  if(ancre && ancre.nodeType){
    var r = ancre.getBoundingClientRect();
    if(kind === 'move'){ x = r.right + 8; y = r.top - 6; if(x + w > vw - 8) x = r.right - w - 8; }
    else { x = r.left; y = r.bottom + 6; if(x + w > vw - 8) x = r.right - w; }
  } else if(ancre){ x = ancre.x + 12; y = ancre.y + 12; if(x + w > vw - 8) x = ancre.x - w - 12; }
  else { x = (vw - w) / 2; y = (vh - h) / 2; }
  if(y + h > vh - 8) y = Math.max(8, vh - h - 8);
  el.style.left = Math.max(8, Math.round(x)) + 'px'; el.style.top = Math.max(8, Math.round(y)) + 'px';
  var f = el.querySelector('button:not([disabled])'); if(f) f.focus({ preventScroll: true });
}
function _trnPopHtml(kind){
  if(kind === 'move') return _trnMoveHtml();
  if(kind === 'presets') return '<div class="trn-pop-hd"><b>Ranger automatiquement</b><span>Vous pourrez toujours ajuster à la main ensuite.</span></div>' + _trnPresetsHtml();
  if(kind === 'taches') return '<div class="trn-pop-hd"><b>L’équipe la suit pour…</b><span>Un travail ne suit qu’une seule tournée.</span></div><div class="trn-pk-scroll">' + _trnTachesHtml() + '</div><div class="trn-pop-pied"><button type="button" class="trn-ok trn-sm" data-trn="pop-fermer">Terminé</button></div>';
  if(kind === 'menu') return '<div class="trn-mn-g" role="menu"><button type="button" class="trn-mn" role="menuitem" data-trn="dupliquer">' + _trnIc('document', 16) + '<span>Dupliquer la tournée</span></button><button type="button" class="trn-mn danger" role="menuitem" data-trn="supprimer">' + _trnIc('corbeille', 16) + '<span>Supprimer la tournée</span></button></div>';
  return '';
}
function _trnFermerPop(silence){
  if(!_TRN || !_TRN.pop) return;
  var k = _TRN.pop; _TRN.pop = null;
  var el = document.getElementById('trn-pop'); if(el){ el.hidden = true; el.innerHTML = ''; }
  if(k === 'move' && !silence) _trnSurvol(null);
  if(!silence && _trnPopAncre && document.contains(_trnPopAncre)) _trnPopAncre.focus({ preventScroll: true });
  _trnPopAncre = null;
}
function _trnRafraichirPop(){ if(!_TRN || !_TRN.pop) return; var el = document.getElementById('trn-pop'), sc = el.querySelector('.trn-pk-scroll'), top = sc ? sc.scrollTop : 0; el.innerHTML = _trnPopHtml(_TRN.pop); var sc2 = el.querySelector('.trn-pk-scroll'); if(sc2) sc2.scrollTop = top; }
function _trnShHd(titre, sous){ return '<div class="trn-sh-hd"><div><h2 class="trn-sh-titre" id="trn-sh-t">' + titre + '</h2>' + (sous ? '<p class="trn-sh-sous">' + sous + '</p>' : '') + '</div><button type="button" class="trn-ic" data-trn="feuille-fermer" aria-label="Fermer">' + _trnIc('croix', 18) + '</button></div>'; }
function _trnFeuilleHtml(kind){
  var nom = _escHtml(_TRN.nom.trim() || 'cette tournée');
  if(kind === 'move') return _trnShHd('Déplacer la parcelle') + '<div class="trn-sh-body">' + _trnMoveHtml() + '</div>';
  if(kind === 'presets') return _trnShHd('Ranger automatiquement', 'Vous pourrez toujours ajuster à la main ensuite.') + '<div class="trn-sh-body">' + _trnPresetsHtml() + '</div>';
  if(kind === 'taches') return _trnShHd('L’équipe la suit pour…', 'Un travail ne suit qu’une seule tournée.') + '<div class="trn-sh-body"><div class="trn-grp trn-grp-pk">' + _trnTachesHtml() + '</div></div><div class="trn-sh-pied"><button type="button" class="trn-ok trn-large" data-trn="feuille-fermer">Terminé</button></div>';
  if(kind === 'menu') return _trnShHd(nom) + '<div class="trn-sh-body">' + _trnPopHtml('menu') + '</div>';
  if(kind === 'placer') return _trnShHd('Placer « ' + _escHtml(_TRN.P[_TRN.cible].nom) + ' » après…', 'Elle prendra la place juste après la parcelle choisie.')
    + '<div class="trn-sh-q">' + _trnIc('loupe', 16) + '<input id="trn-pl-q" type="search" placeholder="Chercher une parcelle" autocomplete="off" aria-label="Chercher une parcelle" data-focus="1"></div><div class="trn-sh-body trn-pl-list" id="trn-pl-list">' + _trnPlacerItems('') + '</div>';
  if(kind === 'quitter') return _trnShHd('Enregistrer les changements ?') + '<div class="trn-sh-body"><p class="trn-msg">Vos changements sur « ' + nom + ' » ne sont pas encore enregistrés.</p></div><div class="trn-sh-pied"><button type="button" class="trn-ok" data-trn="q-save">Enregistrer</button><button type="button" class="trn-ghost danger" data-trn="q-drop">Quitter sans enregistrer</button><button type="button" class="trn-ghost" data-trn="feuille-fermer">Continuer</button></div>';
  if(kind === 'supprimer'){ var tt = _TRN.taches.map(_trnNomT); return _trnShHd('Supprimer « ' + nom + ' » ?') + '<div class="trn-sh-body"><p class="trn-msg">' + (tt.length ? _escHtml(tt.join(', ')) + (tt.length > 1 ? ' reviendront' : ' reviendra') + ' à l’ordre habituel. ' : '') + 'Les autres tournées ne changent pas.</p></div><div class="trn-sh-pied"><button type="button" class="trn-danger" data-trn="sup-ok">Supprimer</button><button type="button" class="trn-ghost" data-trn="feuille-fermer">Annuler</button></div>'; }
  return '';
}
function _trnFeuille(kind){
  _trnFermerPop(true);
  _TRN.sheet = kind;
  var L = document.getElementById('trn-layer'); if(!L) return;
  _trnDernierFocus = document.activeElement;
  L.hidden = false;
  L.innerHTML = '<div class="trn-voile" data-trn="feuille-fermer"></div><div class="trn-sheet' + ((kind === 'quitter' || kind === 'supprimer') ? ' etroite' : '') + '" role="dialog" aria-modal="true" aria-labelledby="trn-sh-t" tabindex="-1">' + _trnFeuilleHtml(kind) + '</div>';
  document.getElementById('trn-ov').classList.add('trn-feuille');
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ L.classList.add('on'); }); });
  if(kind === 'placer'){ var q = document.getElementById('trn-pl-q'); q.addEventListener('input', function(){ document.getElementById('trn-pl-list').innerHTML = _trnPlacerItems(q.value); }); }
  var f = L.querySelector('[data-focus]') || L.querySelector('.trn-sheet');
  if(f) setTimeout(function(){ f.focus({ preventScroll: true }); }, 30);
}
function _trnFermerFeuille(sansFocus){
  if(!_TRN || !_TRN.sheet) return;
  _TRN.sheet = null;
  var L = document.getElementById('trn-layer'); if(!L) return;
  L.classList.remove('on');
  var ov = document.getElementById('trn-ov'); if(ov) ov.classList.remove('trn-feuille');
  setTimeout(function(){ if(!_TRN || !_TRN.sheet){ L.hidden = true; L.innerHTML = ''; } }, 260);
  if(!sansFocus && _trnDernierFocus && document.contains(_trnDernierFocus)) _trnDernierFocus.focus({ preventScroll: true });
}
function _trnRafraichirFeuille(){
  if(!_TRN || !_TRN.sheet) return;
  var sh = document.querySelector('#trn-layer .trn-sheet'); if(!sh) return;
  var b = sh.querySelector('.trn-sh-body'), top = b ? b.scrollTop : 0;
  sh.innerHTML = _trnFeuilleHtml(_TRN.sheet);
  var b2 = sh.querySelector('.trn-sh-body'); if(b2) b2.scrollTop = top;
}

// ── Annonces ──
function _trnToast(msg, action){
  var el = document.getElementById('trn-toast'); if(!el) return;
  _trnToastFn = action ? action.fn : null;
  el.innerHTML = '<span>' + _escHtml(msg) + '</span>' + (action ? '<button type="button" data-trn="toast-act">' + _escHtml(action.label) + '</button>' : '');
  el.classList.add('on');
  clearTimeout(_trnToastT); _trnToastT = setTimeout(_trnCacheToast, 5200);
}
function _trnCacheToast(){ var el = document.getElementById('trn-toast'); if(el) el.classList.remove('on'); _trnToastFn = null; }
function _trnAnnonce(t){ var el = document.getElementById('trn-sr'); if(!el) return; el.textContent = ''; setTimeout(function(){ el.textContent = t; }, 40); }

// ── Les gestes : un seul écouteur pour tout l'écran ──
function _trnClic(e){
  if(!_TRN) return;
  if(_TRN.pop){ var pop = document.getElementById('trn-pop'); if(!pop.contains(e.target) && !(_trnPopAncre && _trnPopAncre.contains(e.target))){ var garde = e.target.closest('[data-trn]'); _trnFermerPop(true); _trnSurvol(null); if(!garde) return; } }
  var el = e.target.closest('[data-trn]'); if(!el || el.disabled) return;
  var a = el.getAttribute('data-trn');
  if(a === 'grip'){ if(_trnApresGlisse) return; var r = el.closest('.trn-row2'); _trnOuvrirMove(r.getAttribute('data-id'), r); return; }
  if(a === 'row'){ var r2 = el.closest('.trn-row2'); _trnOuvrirMove(r2.getAttribute('data-id'), r2); return; }
  if(a === 'retour') _trnQuitter();
  else if(a === 'save') _trnEnregistrer();
  else if(a === 'menu') _trnPop('menu', el);
  else if(a === 'dupliquer') _trnDupliquer();
  else if(a === 'supprimer'){ _trnFermerPop(true); _trnFeuille('supprimer'); }
  else if(a === 'sup-ok') _trnSupprimer();
  else if(a === 'q-save'){ _trnFermerFeuille(true); if(_trnEnregistrer()) _trnFermer(); }
  else if(a === 'q-drop'){ _trnFermerFeuille(true); _trnFermer(); }
  else if(a === 'vue'){ _TRN.vue = el.getAttribute('data-v'); _trnAppliquerVue(); }
  else if(a === 'presets') _trnPop('presets', el);
  else if(a === 'preset') _trnPreset(el.getAttribute('data-k'));
  else if(a === 'taches') _trnPop('taches', el);
  else if(a === 'tache') _trnBasculer(el.getAttribute('data-t'));
  else if(a === 'pop-fermer') _trnFermerPop();
  else if(a === 'feuille-fermer') _trnFermerFeuille();
  else if(a === 'chercher'){ var row = document.getElementById('trn-qrow'); if(row && row.hidden) _trnOuvrirRecherche(); else _trnFermerRecherche(); }
  else if(a === 'q-fermer') _trnFermerRecherche();
  else if(a === 'undo') _trnUndo();
  else if(a === 'redo') _trnRedo();
  else if(a === 'mv') _trnMv(el.getAttribute('data-k'));
  else if(a === 'placer'){ _trnFermerPop(true); _trnFermerFeuille(true); setTimeout(function(){ _trnFeuille('placer'); }, 10); }
  else if(a === 'placer-apres') _trnPlacerApres(el.getAttribute('data-apres'));
  else if(a === 'trace') _trnTraceDebut();
  else if(a === 'tr-fin') _trnTraceFin();
  else if(a === 'tr-annuler') _trnTraceAnnuler();
  else if(a === 'tr-retirer') _trnTraceRetirer();
  else if(a === 'zplus') _trnZoomBouton(1.5);
  else if(a === 'zmoins') _trnZoomBouton(1 / 1.5);
  else if(a === 'ztout'){ _trnVB = Object.assign({}, _trnVB0); _trnSetVB(); }
  else if(a === 'sel-deplacer'){ if(_TRN.sel) _trnOuvrirMove(_TRN.sel, null); }
  else if(a === 'sel-fermer'){ _TRN.sel = null; _trnSelCarte(); _trnCarte(); }
  else if(a === 'toast-act'){ var f = _trnToastFn; _trnCacheToast(); if(f) f(); }
}
function _trnTouche(e){
  if(!_TRN) return;
  if(e.key === 'Escape'){
    e.stopPropagation();
    if(_trnD){ _trnGripAnnule(); return; }
    if(_TRN.pop){ _trnFermerPop(); return; }
    if(_TRN.sheet){ _trnFermerFeuille(); return; }
    if(_TRN.trace){ _trnTraceAnnuler(); return; }
    _trnQuitter(); return;
  }
  var mod = e.ctrlKey || e.metaKey; if(!mod || _TRN.sheet) return;
  var k = String(e.key || '').toLowerCase();
  if(k === 's'){ e.preventDefault(); if(_trnDirty()) _trnEnregistrer(); return; }
  if(/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '')) return;
  if(k === 'z'){ e.preventDefault(); if(e.shiftKey) _trnRedo(); else _trnUndo(); }
  else if(k === 'y'){ e.preventDefault(); _trnRedo(); }
}
var _trnRsT = 0, _trnEtaitPC = _trnPC();
function _trnRedim(){
  if(!_TRN) return;
  clearTimeout(_trnRsT);
  _trnRsT = setTimeout(function(){
    if(!_TRN) return;
    var pc = _trnPC();
    if(pc !== _trnEtaitPC){ _trnEtaitPC = pc; _trnFermerPop(true); _trnSelCarte(); _trnAppliquerVue(); }
    _trnPinEchelle();
  }, 120);
}

export { _trnSectionRender };
window._trnSectionRender   = _trnSectionRender;
window._trnOuvrir          = _trnOuvrir;
window._trnOuvrirPourTache = _trnOuvrirPourTache;
