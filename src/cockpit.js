// ═════════════════════════════════════════════════════════════════════════════════════════════════
// ★★★ AUJ-1 (§260) — LE COCKPIT D'AUJOURD'HUI, VUE TERRAIN
// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Nico (06/10) : un Pilotage « dynamique, professionnel et qui en jette » ; maquette du cockpit validée
// en v2 le 07/10 (« tout est ok »), avec une exigence : GARDER toutes les infos d'Aujourd'hui.
// Ce module RANGE les blocs que _pilTabAuj calcule déjà (fin prévue et marge, coût de l'inaction,
// décision du jour, indicateurs, alertes) et AJOUTE ce qui manquait pour lire la journée d'un coup
// d'œil : le résumé en une phrase, les chantiers en cours, la courbe de la charge restante (photo
// quotidienne PHOTO-1, puis projection jusqu'à la fin prévue) et le fil « En direct » des
// validations du jour.
//
// ⚠️⚠️ POURQUOI UN MODULE À PART : pilotage.js pèse 880 Ko, on découpe à 950. Ce module ne lit
//   RIEN de l'intérieur de pilotage.js : _pilTabAuj lui passe ses morceaux tout calculés (un seul
//   moteur par chiffre). Il ne fait que de la mise en page, et le mouvement passe par _mvAnim (MOUV-1).
// ⚠️ L'HEURE D'UNE VALIDATION : une entrée du journal n'a pas de champ d'heure, mais son identifiant
//   est Date.now() écrit en base 16 (app.js : id:Date.now().toString(16)). On le relit, et seulement
//   s'il a cette forme — sinon on n'invente pas d'heure.
// ⚠️ LE DIRECT : quand l'équipe valide, l'écran se redessine (_prioRedessine → renderPilotage). Le
//   cockpit retient ce qu'il montrait : les chiffres défilent depuis l'ancienne valeur, les nouvelles
//   lignes du fil s'éclairent une fois. Rien n'exige que les téléphones de l'équipe soient à jour.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

var _CK = { vu: {}, fil: null, serie: [], m: null, vue: 'terrain', d: null };

function _ckEsc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function _ckNb(v){ return Math.round(Number(v) || 0).toLocaleString('fr-FR'); }
function _ckIso(dt){
  var x = dt || new Date();
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}
function _ckMaj1(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
// L'heure d'une entrée du journal : son identifiant base 16, s'il en a la forme ; sinon rien.
function _ckTs(e){
  var id = e && e.id;
  if(typeof id !== 'string' || !/^[0-9a-f]{10,12}$/.test(id)) return null;
  var t = parseInt(id, 16);
  return (t > 1500000000000 && t < Date.now() + 86400000) ? t : null;
}
// Qui : celui qui a validé, puis son équipe, sans doublon.
function _ckQui(e){
  var l = [e && e.qui].concat((e && Array.isArray(e.membresEquipe)) ? e.membresEquipe : []), r = [];
  for(var i = 0; i < l.length; i++){ var n = String(l[i] || '').trim(); if(n && r.indexOf(n) < 0) r.push(n); }
  return r;
}
function _ckQuand(ts, now){
  if(ts == null) return '';
  var min = Math.round(((now || Date.now()) - ts) / 60000);
  if(min < 1) return 'à l’instant';
  if(min < 90) return 'il y a ' + min + '\u00a0min';
  var d = new Date(ts);
  return 'à ' + d.getHours() + '\u00a0h\u00a0' + String(d.getMinutes()).padStart(2, '0');
}

// ── Le fil : les validations et les débuts de la journée, du plus récent au plus ancien ──────────
window._ckFilDonnees = function(journal, auj){
  var r = [];
  (journal || []).forEach(function(e){
    if(!e || e.date !== auj || e.meteo || !e.tache || !e.parcelle) return;
    if(e.statut !== 'Validé' && e.statut !== 'En cours') return;
    r.push({ e: e, ts: _ckTs(e) });
  });
  r.sort(function(a, b){ return (b.ts || 0) - (a.ts || 0); });
  return r;
};
window._ckFilHtml = function(items, vus, now){
  if(!items.length) return '<p class="ck-fil-vide">Aucune validation aujourd’hui pour l’instant. Elles arriveront ici dès que l’équipe validera.</p>';
  return '<ol class="ck-fil">' + items.slice(0, 12).map(function(it){
    var e = it.e, noms = _ckQui(e), pl = noms.length > 1;
    var verbe = e.statut === 'Validé' ? (pl ? 'ont validé' : 'a validé') : (pl ? 'ont commencé' : 'a commencé');
    var avs = noms.slice(0, 2).map(function(n){ return '<span class="ck-av">' + _ckEsc(n.charAt(0).toUpperCase()) + '</span>'; }).join('');
    var neuf = vus && !vus.has(e.id);
    return '<li class="ck-ev' + (neuf ? ' neuf' : '') + '"><span class="ck-avs" aria-hidden="true">' + avs + '</span>'
      + '<span class="ck-ev-tx"><span><b>' + _ckEsc(noms.join(' et ') || 'Quelqu’un') + '</b> ' + verbe + ' <b>' + _ckEsc(e.tache) + '</b></span>'
      + '<span class="ck-ev-s">' + _ckEsc(e.parcelle) + '</span></span>'
      + '<time>' + _ckQuand(it.ts, now) + '</time></li>';
  }).join('') + '</ol>';
};

// ── Le résumé : une phrase, rien que des chiffres déjà calculés ───────────────────────────────────
//   Source absente ⇒ la partie se tait (jamais un zéro inventé, jamais une marge devinée).
window._ckResumeHtml = function(m, d, nVal){
  var p = [];
  if(m && m.marge != null){
    var j = Math.abs(m.marge), s = j > 1 ? 's' : '';
    p.push(m.marge > 0 ? '<b>' + j + ' jour' + s + ' d’avance</b> sur l’objectif'
      : m.marge < 0 ? '<b>' + j + ' jour' + s + ' de retard</b> sur l’objectif' : '<b>pile à l’heure</b> sur l’objectif');
  }
  var reste = Number(d && d.totalReste);
  if(d && d.totalReste != null && isFinite(reste)) p.push('<b data-ck-cpt="reste" data-ck-fin="' + Math.round(reste) + '">' + _ckNb(reste) + '</b>\u202fh à faire');
  p.push('<b data-ck-cpt="valid" data-ck-fin="' + nVal + '">' + nVal + '</b> validation' + (nVal > 1 ? 's' : '') + ' aujourd’hui');
  return '<p class="ck-resume">' + _ckMaj1(p.join(', ')) + '.</p>';
};

// ── La charge restante : les photos du jour (PHOTO-1), aujourd'hui en direct, puis la projection ──
window._ckChargeSerie = function(photos, d, auj){
  var s = [];
  (photos || []).forEach(function(x){
    if(x && typeof x.d === 'string' && typeof x.reste === 'number' && x.d !== auj) s.push({ iso: x.d, v: x.reste });
  });
  var live = Number(d && d.totalReste);
  if(d && d.totalReste != null && isFinite(live)) s.push({ iso: auj, v: Math.round(live) });
  s.sort(function(a, b){ return a.iso < b.iso ? -1 : (a.iso > b.iso ? 1 : 0); });
  return s;
};
function _ckDate(iso){ var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function _ckJour(dt){ return dt.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }); }
window._ckChargeSvg = function(w, serie, m){
  if(!serie || serie.length < 2){
    return window._mvGraphVide ? window._mvGraphVide('La courbe de la charge restante',
      'Elle se remplit d’une photo par jour, prise quand un administrateur ouvre le Pilotage.') : '';
  }
  var c = window._mvGraphCadre(w, 220), col = c.col || {}, tr = c.trait || {};
  var t0 = _ckDate(serie[0].iso).getTime(), tA = _ckDate(serie[serie.length - 1].iso).getTime();
  var fin = (m && m.proj instanceof Date) ? m.proj.getTime() : null, obj = (m && m.obj instanceof Date) ? m.obj.getTime() : null;
  var t1 = Math.max(tA, fin || 0, obj || 0) + 3 * 86400000;
  var vmax = 0; serie.forEach(function(x){ if(x.v > vmax) vmax = x.v; });
  var pas = vmax > 2000 ? 1000 : vmax > 800 ? 500 : vmax > 200 ? 100 : 50, ymax = Math.max(pas, Math.ceil(vmax / pas) * pas);
  var X = function(t){ return c.padL + (t - t0) / (t1 - t0) * c.iw; }, Y = function(v){ return c.padT + c.ih * (1 - v / ymax); };
  var f = function(v){ return v.toFixed(1); }, g = '';
  for(var v = 0; v <= ymax; v += pas){
    g += '<line x1="' + c.padL + '" x2="' + f(c.w - c.padR) + '" y1="' + f(Y(v)) + '" y2="' + f(Y(v)) + '" stroke="' + col.grille + '" stroke-width="' + tr.grille + '"/>'
      + '<text x="' + (c.padL - 6) + '" y="' + f(Y(v) + 4) + '" text-anchor="end" font-size="11" fill="' + col.texte + '">' + _ckNb(v) + (v === ymax ? '\u202fh' : '') + '</text>';
  }
  var pts = serie.map(function(x){ return [X(_ckDate(x.iso).getTime()), Y(x.v)]; });
  var ligne = 'M' + pts.map(function(p){ return f(p[0]) + ' ' + f(p[1]); }).join('L');
  var y0 = Y(0), xa = pts[pts.length - 1][0], ya = pts[pts.length - 1][1];
  g += '<path d="' + ligne + 'L' + f(xa) + ' ' + f(y0) + 'L' + f(pts[0][0]) + ' ' + f(y0) + 'Z" fill="' + col.mesure + '" fill-opacity=".1" stroke="none"/>';
  if(obj){
    g += '<line x1="' + f(X(obj)) + '" x2="' + f(X(obj)) + '" y1="' + (c.padT - 6) + '" y2="' + f(y0) + '" stroke="' + col.texte + '" stroke-width="1" stroke-dasharray="2 3"/>'
      + '<text x="' + f(X(obj) - 5) + '" y="' + (c.padT + 12) + '" text-anchor="end" font-size="11" fill="' + col.texte + '">objectif</text>';
  }
  if(fin){
    g += '<path d="M' + f(xa) + ' ' + f(ya) + 'L' + f(X(fin)) + ' ' + f(y0) + '" fill="none" stroke="' + col.prevu + '" stroke-width="' + tr.prevu + '" stroke-dasharray="4 4"/>'
      + '<rect x="' + f(X(fin) - 4.5) + '" y="' + f(y0 - 4.5) + '" width="9" height="9" transform="rotate(45 ' + f(X(fin)) + ' ' + f(y0) + ')" fill="' + col.prevu + '"/>';
  }
  g += '<line x1="' + f(xa) + '" x2="' + f(xa) + '" y1="' + (c.padT - 6) + '" y2="' + f(y0) + '" stroke="' + col.alerte + '" stroke-width="1"/>'
    + '<path d="' + ligne + '" fill="none" stroke="' + col.mesure + '" stroke-width="' + tr.mesure + '" stroke-linejoin="round" stroke-linecap="round"/>'
    + '<circle cx="' + f(xa) + '" cy="' + f(ya) + '" r="3.5" fill="' + col.mesure + '"/>';
  // Trois repères sous l'axe — la première photo, aujourd'hui, la fin prévue — le détail jour par jour est à l'infobulle.
  var court = function(t){ return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); };
  g += '<text x="' + f(pts[0][0]) + '" y="' + f(y0 + 18) + '" font-size="11" fill="' + col.texte + '">' + _ckEsc(court(t0)) + '</text>'
    + '<text x="' + f(xa) + '" y="' + f(y0 + 18) + '" text-anchor="middle" font-size="11" fill="' + col.texte + '">aujourd’hui</text>';
  if(fin && X(fin) - xa > 70) g += '<text x="' + f(X(fin)) + '" y="' + f(y0 + 18) + '" text-anchor="middle" font-size="11" fill="' + col.texte + '">' + _ckEsc(court(fin)) + '</text>';
  // Une zone de touche par photo : l'infobulle suit la souris et le doigt (MOUV-1).
  pts.forEach(function(p, k){
    var xa2 = k ? (pts[k - 1][0] + p[0]) / 2 : c.padL, xb = k < pts.length - 1 ? (p[0] + pts[k + 1][0]) / 2 : p[0] + 8;
    var tt = '<div class="t">' + _ckEsc(_ckJour(_ckDate(serie[k].iso))) + '</div><div class="r"><i>Reste</i><b>' + _ckNb(serie[k].v) + '\u202fh</b></div>';
    g += window._mvGraphHit(c, p[0], p[1], xa2, xb, tt);
  });
  var aria = 'Charge restante : ' + _ckNb(serie[0].v) + ' h le ' + _ckJour(_ckDate(serie[0].iso)) + ', ' + _ckNb(serie[serie.length - 1].v)
    + ' h aujourd’hui' + (fin ? ', fin prévue le ' + _ckJour(new Date(fin)) : '');
  return window._mvGraphSvg(c, aria, g);
};

// ── À SAVOIR (AUJ-2, §261) : ce qui peut changer la journée ou la semaine ───────────────────────
//   Règles validées par Nico le 07/10 :
//   • météo : les deux jours qui viennent, AU NIVEAU DU DOMAINE (prévisions heure par heure de l'Accueil,
//     METEO_HOURLY) ; pluie ≥ 2 mm sur un jour ou vent ≥ 40 km/h ; on dit si un brûlage en cours attendra.
//     Le détail par secteur viendra dans un lot suivant : le cache par commune ne porte que la journée.
//   • absences : les 7 jours qui viennent (aujourd'hui est déjà dans la tuile « Présences ») ; l'état du jour
//     est lu par _pilEtatEntree, le même que les présences. Le Pilotage est réservé à l'admin.
//   • contrats : les fins dans les 30 jours (fin_contrat). • retards : fenêtre passée et tâche pas finie.
//   • matériel et cave : les blocs d'avant, rangés DANS l'encart (aucun recalculé).
var _CK_SV = { jours: 7, contrat: 30, pluie: 2, vent: 40 };
function _ckJc(dt){ return dt.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }); }
function _ckPlusJ(t, k){ return new Date(t.getFullYear(), t.getMonth(), t.getDate() + k); }
window._ckSvMeteo = function(H, rows, now){
  if(!H || !Array.isArray(H.time) || !Array.isArray(H.precip)) return [];
  var t = now || new Date(), out = [];
  [1, 2].forEach(function(k){
    var dt = _ckPlusJ(t, k), iso = _ckIso(dt), mm = 0, vent = 0, h0 = null, h1 = null, vu = false;
    for(var i = 0; i < H.time.length; i++){
      var s = String(H.time[i]); if(s.slice(0, 10) !== iso) continue;
      vu = true;
      var p = Number(H.precip[i]) || 0, w = Number(H.wind && H.wind[i]) || 0, h = parseInt(s.slice(11, 13), 10);
      mm += p; if(w > vent) vent = w;
      if(p >= 0.2){ if(h0 === null) h0 = h; h1 = h + 1; }
    }
    mm = Math.round(mm * 10) / 10;
    if(!vu || (mm < _CK_SV.pluie && vent < _CK_SV.vent)) return;
    var brul = (rows || []).some(function(r){ return r && /br[uû]l/i.test(String(r.nom || '')) && (r.pct || 0) < 100; });
    var t1 = mm >= _CK_SV.pluie ? 'Pluie annoncée : ' + String(mm).replace('.', ',') + '\u202fmm' + (h0 !== null ? ', de ' + h0 + '\u00a0h à ' + h1 + '\u00a0h' : '') : '';
    if(vent >= _CK_SV.vent) t1 += (t1 ? ', vent à ' : 'Vent annoncé à ') + Math.round(vent) + '\u202fkm/h';
    out.push({ cat: 'meteo', prio: brul ? 1 : 2, quand: k === 1 ? 'Demain' : _ckMaj1(dt.toLocaleDateString('fr-FR', { weekday: 'long' })),
      titre: t1, sous: brul ? 'Le brûlage en cours attendra un temps sec.' : 'Aucun chantier en cours ne craint ce temps.' });
  });
  return out;
};
window._ckSvAbsences = function(membres, PE, etatDe, now){
  if(!PE || typeof etatDe !== 'function') return [];
  var t = now || new Date(), out = [];
  (membres || []).forEach(function(m){
    if(!m || m.statut === 'Inactif' || m.bureau || !m.nom) return;
    var pl = null;
    for(var k = 1; k <= _CK_SV.jours; k++){
      var dt = _ckPlusJ(t, k), by = PE[m.nom] && PE[m.nom][dt.getFullYear()];
      var e = by && by[dt.getMonth()] && by[dt.getMonth()][dt.getDate()];
      var et = e ? etatDe(e) : { etat: 'present', motif: '' };
      if(et.etat !== 'present'){
        if(!pl) pl = { etat: et.etat, motif: et.motif || '', debut: k, fin: k };
        else if(pl.etat === et.etat && pl.fin === k - 1) pl.fin = k;
        else break;
      } else if(pl) break;
    }
    if(!pl) return;
    var d0 = _ckPlusJ(t, pl.debut), d1 = _ckPlusJ(t, pl.fin);
    var lib = pl.etat === 'cp' ? 'en congé' : pl.etat === 'recup' ? 'en récupération' : pl.etat === 'maladie' ? 'en arrêt' : 'absent';
    out.push({ cat: 'equipe', prio: 2, titre: m.nom + ' ' + lib,
      quand: pl.debut === pl.fin ? (pl.debut === 1 ? 'Demain' : _ckJc(d0)) : 'Du ' + _ckJc(d0) + ' au ' + _ckJc(d1),
      sous: pl.motif || (pl.fin < _CK_SV.jours ? 'De retour le ' + _ckJc(_ckPlusJ(t, pl.fin + 1)) + '.' : 'Toute la semaine qui vient.'), action: 'planning' });
  });
  return out;
};
window._ckSvContrats = function(membres, now){
  var t = now || new Date(), auj = _ckIso(t), lim = _ckIso(_ckPlusJ(t, _CK_SV.contrat)), out = [];
  (membres || []).forEach(function(m){
    if(!m || m.statut === 'Inactif' || typeof m.fin_contrat !== 'string' || m.fin_contrat < auj || m.fin_contrat > lim) return;
    var p = m.fin_contrat.split('-');
    out.push({ cat: 'contrat', prio: 1, quand: _ckJc(new Date(+p[0], +p[1] - 1, +p[2])), titre: 'Fin du contrat de ' + m.nom,
      sous: 'Le planning en tient compte dès cette date. Pour prolonger ou remplacer, simulez un renfort.', action: 'renfort' });
  });
  return out;
};
window._ckSvRetards = function(rows, retards){
  var R = retards || {}, out = [];
  (rows || []).forEach(function(r){
    if(!r || !R[r.nom] || (r.pct || 0) >= 100) return;
    var nom = (typeof window.tNom === 'function') ? window.tNom(r.nom) : r.nom;
    out.push({ cat: 'retard', prio: 1, quand: 'Fenêtre passée', titre: nom + ' en retard',
      sous: 'Faite à ' + Math.round(r.pct || 0) + '\u00a0% : le travail restant sort de ses dates.', action: 'campagne' });
  });
  return out;
};
var _CK_SV_ACT = { planning: ['Ouvrir le planning', "goTo('planning')"], renfort: ['Simuler un renfort', "_pilSetTab('sim')"],
  campagne: ['Voir La campagne', "_pilSetTab('camp')"] };
var _CK_SV_IC = { meteo: '\u2614', equipe: '\u263A', contrat: '\u270E', retard: '\u29D7' };
window._ckSavoirHtml = function(items, extra){
  var tri = (items || []).slice().sort(function(a, b){ return (a.prio || 9) - (b.prio || 9); });
  var li = tri.map(function(x){
    var a = x.action && _CK_SV_ACT[x.action];
    return '<li class="ck-sv ck-sv-' + x.cat + (x.prio === 1 ? ' fort' : '') + '"><span class="ck-sv-ic" aria-hidden="true">' + (_CK_SV_IC[x.cat] || '\u2022') + '</span>'
      + '<div class="ck-sv-tx"><div class="ck-sv-h"><b>' + _ckEsc(x.titre) + '</b><span class="ck-sv-q">' + _ckEsc(x.quand) + '</span></div>'
      + '<p class="ck-sv-s">' + _ckEsc(x.sous) + '</p>'
      + (a ? '<button type="button" class="ck-sv-a" onclick="' + a[1] + '">' + a[0] + '</button>' : '') + '</div></li>';
  }).join('');
  return (li ? '<ul class="ck-sv-l">' + li + '</ul>' : '<p class="ck-fil-vide">Rien à signaler pour les jours qui viennent.</p>') + (extra || '');
};
function _ckMeteoCache(){
  try { var o = JSON.parse(localStorage.getItem('mavigne_meteohr_cache') || 'null'); return (o && Array.isArray(o.time)) ? o : (o && o.data && Array.isArray(o.data.time) ? o.data : null); }
  catch(e){ return null; }
}

// ── LE DOMAINE EN DIRECT (AUJ-3, §262) : les parcelles rangées par appellation, puis par commune ─────────
//   Un SCHÉMA, pas une carte (la vraie reste dans Parcelles) : une bande par appellation, une bande par
//   parcelle dont la LARGEUR SUIT LA SURFACE, à la même échelle pour tout le domaine — le rapport des
//   surfaces se garde d'une appellation à l'autre. Chaque parcelle prend la couleur de son état pour la tâche
//   choisie ; toucher une parcelle ouvre sa fiche (openSelParc) : on valide là, par le chemin de toujours.
//   ⚠️ L'état vient du journal : faite = une validation depuis l'ouverture de la fenêtre de la tâche ;
//   en cours = un début sans validation après ; en retard = fenêtre passée et pas faite ; arrachée = statut.
//   Les tâches à passages ou à niveaux ne sont pas proposées : une validation n'y dit pas « fini ».
var _CK_PL = { W: 1000, m: 16, h: 64, gap: 3, gapC: 14 };
window._ckPlanEtats = function(parcs, journal, tache, debutIso, enRetard){
  var etat = {}, der = {};
  (parcs || []).forEach(function(p){ if(p && p.nom) etat[p.nom] = /arrach/i.test(String(p.statut || '')) ? 'arr' : 'afaire'; });
  (journal || []).slice().sort(function(a, b){ return String(a && a.date || '') < String(b && b.date || '') ? -1 : 1; }).forEach(function(e){
    if(!e || e.tache !== tache || !Object.prototype.hasOwnProperty.call(etat, e.parcelle) || etat[e.parcelle] === 'arr') return;
    if(debutIso && String(e.date || '') < debutIso) return;
    if(e.statut === 'Validé' || e.statut === 'Terminé') der[e.parcelle] = 'faite';
    else if(e.statut === 'En cours' && der[e.parcelle] !== 'faite') der[e.parcelle] = 'cours';
  });
  Object.keys(etat).forEach(function(n){ if(etat[n] !== 'arr') etat[n] = der[n] || (enRetard ? 'retard' : 'afaire'); });
  return etat;
};
window._ckPlanDispo = function(parcs){
  var apps = {}, ordre = [];
  (parcs || []).forEach(function(p){
    var s = Number(p && p.surface); if(!p || !p.nom || !(s > 0)) return;
    var a = String(p.appellation || '').trim() || 'Sans appellation', c = String(p.commune || '').trim();
    if(!apps[a]){ apps[a] = { ha: 0, communes: {}, ordre: [] }; ordre.push(a); }
    apps[a].ha += s;
    if(!apps[a].communes[c]){ apps[a].communes[c] = []; apps[a].ordre.push(c); }
    apps[a].communes[c].push(p);
  });
  var tot = ordre.reduce(function(t, a){ return t + apps[a].ha; }, 0);
  if(!(tot > 0)) return null;
  var L = _CK_PL.W - 2 * _CK_PL.m, k = L / Math.max(1.5, tot / 4), y = _CK_PL.m, bandes = [];
  ordre.sort(function(a, b){ return apps[b].ha - apps[a].ha; }).forEach(function(an){
    var A = apps[an], hdr = y + 22, x = _CK_PL.m, st = [];
    y += 52;
    A.ordre.forEach(function(cn){
      A.communes[cn].sort(function(p, q){ return String(p.nom).localeCompare(String(q.nom), 'fr'); }).forEach(function(p, i){
        var w = Math.max(10, Number(p.surface) * k);
        if(x + w > _CK_PL.m + L + 0.01 && x > _CK_PL.m){ x = _CK_PL.m; y += _CK_PL.h + 30; }
        st.push({ p: p, x: x, y: y, w: w, commune: i === 0 && cn ? cn : null });
        x += w + _CK_PL.gap;
      });
      x += _CK_PL.gapC - _CK_PL.gap;
    });
    y += _CK_PL.h + 18;
    bandes.push({ nom: an, ha: A.ha, hdr: hdr, strips: st });
  });
  return { W: _CK_PL.W, H: y, k: k, bandes: bandes };
};
var _CK_PL_LIB = { faite: 'faite', cours: 'en cours', afaire: 'à faire', retard: 'en retard', arr: 'arrachée' };
function _ckHa(v){ return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u202fha'; }
window._ckPlanSvg = function(dispo, etats, eqs, tacheLib){
  if(!dispo) return window._mvGraphVide ? window._mvGraphVide('Le domaine en direct', 'Il se dessine dès que les parcelles ont une surface.') : '';
  var f = function(v){ return (Math.round(v * 10) / 10).toString(); }, s = '';
  dispo.bandes.forEach(function(b){
    // Les hectares EN PRODUCTION : une parcelle arrachée se dessine (hachurée) mais ne compte ni dans la surface ni dans l'avancement.
    var hf = 0, hp = 0;
    b.strips.forEach(function(st){ var e = etats[st.p.nom]; if(e !== 'arr') hp += Number(st.p.surface); if(e === 'faite') hf += Number(st.p.surface); });
    s += '<text class="ck-pl-app" x="' + _CK_PL.m + '" y="' + b.hdr + '" font-size="20">' + _ckEsc(b.nom) + '<tspan class="ck-pl-ha" dx="10" font-size="17">' + _ckHa(hp) + '</tspan></text>'
      + '<text class="ck-pl-pc" x="' + (_CK_PL.W - _CK_PL.m) + '" y="' + b.hdr + '" text-anchor="end" font-size="17">' + _ckEsc(tacheLib) + ' : ' + Math.round(hp ? hf / hp * 100 : 0) + '\u202f%</text>';
    b.strips.forEach(function(st){
      var n = st.p.nom, e = etats[n] || 'afaire', lib = n + ', ' + _ckHa(st.p.surface) + ', ' + String(tacheLib).toLowerCase() + ' ' + _CK_PL_LIB[e];
      if(st.commune) s += '<text class="ck-pl-com" x="' + f(st.x) + '" y="' + (st.y - 8) + '" font-size="16">' + _ckEsc(st.commune) + '</text>';
      s += '<rect class="ck-pl-p et-' + e + '" x="' + f(st.x) + '" y="' + st.y + '" width="' + f(st.w) + '" height="' + _CK_PL.h + '" rx="3"'
        + ' data-p="' + _ckEsc(n) + '" tabindex="0" role="button" aria-label="' + _ckEsc(lib) + '" onclick="_ckPlanOuvrir(this)"><title>' + _ckEsc(lib) + '</title></rect>';
      if(eqs && eqs[n]) s += '<g class="ck-pl-eq" aria-hidden="true"><circle cx="' + f(st.x + st.w / 2) + '" cy="' + (st.y + _CK_PL.h / 2) + '" r="15"/>'
        + '<text x="' + f(st.x + st.w / 2) + '" y="' + (st.y + _CK_PL.h / 2 + 5) + '" text-anchor="middle" font-size="14">' + _ckEsc(eqs[n]) + '</text></g>';
    });
  });
  return '<svg class="ck-pl-svg" viewBox="0 0 ' + dispo.W + ' ' + f(dispo.H) + '" role="group" aria-label="Le domaine, parcelle par parcelle, rangé par appellation puis par commune">' + s + '</svg>';
};
// Les équipes sur le terrain : un début (En cours) aujourd'hui, pas encore validé. Initiales de l'équipe.
window._ckPlanEquipes = function(journal, auj){
  var r = {};
  (journal || []).forEach(function(e){
    if(!e || e.date !== auj || !e.parcelle) return;
    if(e.statut === 'Validé') { delete r[e.parcelle]; return; }
    if(e.statut === 'En cours') r[e.parcelle] = _ckQui(e).slice(0, 2).map(function(n){ return n.charAt(0).toUpperCase(); }).join('');
  });
  return r;
};
window._ckPlanTaches = function(rows){
  return (rows || []).filter(function(t){
    return t && t.nom && !(t.type === 'niveaux' || t.type === 'passages' || t.nom === 'Relevage' || t.nom === 'Ebourgeonnage' || t.nom === 'Pioche');
  });
};
function _ckPlanDebut(fen, nom){
  var w = (fen || []).filter(function(x){ return x && x.nom === nom && x.ws != null; })[0];
  if(!w) return null;
  var d = new Date(Date.UTC(2026, 0, 1) + w.ws * 86400000);
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
}
window._ckPlanCorps = function(){
  var P = _CK.plan; if(!P) return '';
  var taches = window._ckPlanTaches(P.rows);
  if(!taches.length) return '<p class="ck-fil-vide">Aucune tâche simple dans la campagne : le plan attend une tâche à suivre.</p>';
  var t = taches.filter(function(x){ return x.nom === _CK.tachePlan; })[0] || taches.filter(function(x){ return (x.pct || 0) < 100; })[0] || taches[0];
  _CK.tachePlan = t.nom;
  var lib = (typeof window.tNom === 'function') ? window.tNom(t.nom) : t.nom;
  var etats = window._ckPlanEtats(P.parcs, P.journal, t.nom, _ckPlanDebut(P.fen, t.nom), !!(P.retards || {})[t.nom]);
  var n = { faite: 0, cours: 0, afaire: 0, retard: 0, arr: 0 };
  Object.keys(etats).forEach(function(k){ n[etats[k]]++; });
  var choix = taches.map(function(x){
    var l = (typeof window.tNom === 'function') ? window.tNom(x.nom) : x.nom;
    return '<button type="button" class="ck-pl-t" data-t="' + _ckEsc(x.nom) + '" aria-pressed="' + (x.nom === t.nom) + '" onclick="_ckPlanTache(this)">' + _ckEsc(l) + '</button>';
  }).join('');
  var leg = ['faite', 'cours', 'afaire', 'retard', 'arr'].filter(function(k){ return n[k]; }).map(function(k){
    return '<span class="ck-pl-l"><i class="ck-pl-sw et-' + k + '"></i>' + _ckMaj1(_CK_PL_LIB[k]) + ' <b>' + n[k] + '</b></span>';
  }).join('');
  return '<div class="ck-pl-choix" role="group" aria-label="Tâche montrée sur le plan">' + choix + '</div>'
    + '<div class="ck-pl-boite">' + window._ckPlanSvg(window._ckPlanDispo(P.parcs), etats, window._ckPlanEquipes(P.journal, _ckIso()), lib) + '</div>'
    + '<div class="ck-pl-leg">' + leg + '</div>';
};
window._ckPlanTache = function(el){
  if(!el) return;
  _CK.tachePlan = el.getAttribute('data-t');
  var h = document.getElementById('ck-plan-corps');
  if(h) h.innerHTML = window._ckPlanCorps();
};
window._ckPlanOuvrir = function(el){
  var n = el && el.getAttribute('data-p');
  if(n && typeof window.openSelParc === 'function') window.openSelParc(n);
};

// ── La mise en page : à gauche ce qui décide, à droite ce qui arrive ──────────────────────────────
window._ckAuj = function(o){
  var d = o.d || {}, m = o.m || {}, mo = o.montrer || {}, auj = _ckIso();
  var fil = window._ckFilDonnees(o.journal, auj);
  var nVal = fil.filter(function(x){ return x.e.statut === 'Validé'; }).length;
  var vus = _CK.fil;                       // null au premier dessin : rien ne s'éclaire
  _CK.fil = new Set(fil.map(function(x){ return x.e.id; }));
  _CK.serie = window._ckChargeSerie(o.photos, d, auj);
  _CK.m = m;
  _CK.plan = { parcs: (o.parcs || window.PARCELLES || []), journal: o.journal, rows: d.data, fen: o.fenetres, retards: o.retards };
  var info = function(k){ return (k && typeof window._mvInfoBtn === 'function') ? window._mvInfoBtn(k) : ''; };
  // Les panneaux prennent la carte commune de l'appli (.catpanel : fond, filet, rayon, ombre) — rien de redessiné.
  //   L'identifiant s'écrit en entier à l'appel (id="…") : la pastille « Nouveau » le cherche tel quel (ANN-1).
  var pan = function(attrId, titre, k, cadre, corps){
    return '<section class="catpanel ck-pan" ' + attrId + '><header class="ck-pan-hd"><h3 class="ck-pan-t">' + titre + info(k) + '</h3>'
      + (cadre ? '<p class="ck-cadre">' + cadre + '</p>' : '') + '</header>' + corps + '</section>';
  };
  var reste = Number(d.totalReste), eco = !!o.eco;
  _CK.d = d;
  // La vue Économie prend le coût de l'inaction et la tuile Budget ; sans elle, ils restent sur le terrain.
  //   (les indicateurs reçus contiennent la tuile Budget : en vue Économie, on l'en retire.)
  var kpis = (eco && o.budget && o.kpis) ? String(o.kpis).replace(o.budget, '') : (o.kpis || '');
  var gauche = (o.hero ? '<div class="pil-cockpit-card ck-hero">' + o.hero + '</div>' : '')
    + (!eco && o.inaction ? '<div class="pil-cockpit-card">' + o.inaction + '</div>' : '')
    + (o.dec ? '<div class="pil-sec-h">La décision du jour</div><div class="pil-dec">' + o.dec + '</div>' : '')
    + (o.det ? '<div class="pil-dec2">' + o.det + '</div>' : '')
    + (mo.plan ? pan('id="ck-plan"', 'Le domaine en direct', 'pil.plan', 'Rangé par appellation puis par commune ; touchez une parcelle pour ouvrir sa fiche',
        '<div id="ck-plan-corps">' + window._ckPlanCorps() + '</div>') : '')
    + (o.chantiers ? pan('id="ck-chantiers"', 'Les chantiers en cours', null, 'Dans l’ordre des dates de la campagne', o.chantiers) : '')
    + (mo.charge ? pan('id="ck-charge-pan"', 'Charge restante', 'pil.charge',
        (isFinite(reste) && d.totalReste != null ? _ckNb(reste) + '\u202fh à faire, photographiées chaque jour' : 'Photographiée chaque jour'),
        '<div id="ck-charge" class="ck-graphe"></div>') : '');
  var sv = mo.savoir ? [].concat(window._ckSvMeteo(window.METEO_HOURLY || _ckMeteoCache(), d.data, new Date()),
      window._ckSvAbsences(window.MEMBRES, window.PLANNING_ENTRIES, window._pilEtatEntree, new Date()),
      window._ckSvContrats(window.MEMBRES, new Date()), window._ckSvRetards(d.data, o.retards)) : null;
  var cave = o.cave ? '<div class="pil-cks ck-sv-cave">' + o.cave + '</div>' : '';
  var droite = (sv ? pan('id="ck-savoir"', 'À savoir', 'pil.savoir', 'Ce qui peut changer la journée ou la semaine, visible de l’admin seulement',
        window._ckSavoirHtml(sv, (o.alertes || '') + cave)) : '')
    + (mo.fil ? pan('id="ck-fil-pan"', '<span class="ck-vif" aria-hidden="true"></span>En direct', 'pil.fil',
        'Ce que l’équipe valide et commence aujourd’hui', window._ckFilHtml(fil, vus, Date.now())) : '')
    + (kpis ? '<div class="pil-cockpit-card ck-kpis"><div class="pil-cks">' + kpis + '</div></div>' : '')
    + (sv ? '' : (o.alertes || '') + (cave ? '<div class="pil-cockpit-card">' + cave + '</div>' : ''));   // « À savoir » masqué : comme avant
  setTimeout(window._ckApres, 0);
  var cols = '<div class="ck-cols"><div class="ck-main">' + gauche + '</div><div class="ck-side">' + droite + '</div></div>';
  if(!eco) return '<div class="ck-auj">' + (mo.resume ? window._ckResumeHtml(m, d, nVal) : '') + cols + '</div>';
  var vueEco = _CK.vue === 'eco', corpsEco = '';
  if(vueEco && typeof window._pilTabEco === 'function'){ try { corpsEco = window._pilTabEco(d); } catch(e){ if(window._mvAvale) window._mvAvale(e, 'cockpit.js/_ckAuj#eco'); } }
  var ecoHtml = '<div class="ck-eco">' + (o.inaction ? '<div class="pil-cockpit-card">' + o.inaction + '</div>' : '')
    + (o.budget ? '<div class="pil-cockpit-card"><div class="pil-cks">' + o.budget + '</div></div>' : '')
    + '<div id="ck-eco-corps">' + corpsEco + '</div>'
    + '<button type="button" class="ck-sv-a" onclick="_pilSetTab(\'eco\')">Ouvrir l’onglet Économie</button></div>';
  return '<div class="ck-auj"><div class="ck-tete2">' + (mo.resume ? window._ckResumeHtml(m, d, nVal) : '<span></span>') + window._ckBasculeHtml(_CK.vue) + '</div>'
    + '<div class="ck-vue" data-vue="terrain"' + (vueEco ? ' hidden' : '') + '>' + cols + '</div>'
    + '<div class="ck-vue" data-vue="eco"' + (vueEco ? '' : ' hidden') + '>' + ecoHtml + '</div></div>';
};

// ── LA BASCULE TERRAIN / ÉCONOMIE (AUJ-4, §263) ─────────────────────────────────────────────────────
//   La vue Économie reprend l'onglet Économie TEL QUEL (_pilTabEco → _pecData) : aucun chiffre recalculé, et la
//   période est celle de ce moteur — jamais l'exercice comptable en euros d'un côté et l'année vigne en heures de
//   l'autre. Elle se dessine au premier passage (pas à chaque validation de l'équipe), puis à chaque dessin tant
//   qu'on y reste. Le choix tient le temps de la session.
window._ckVue = function(v){
  _CK.vue = v === 'eco' ? 'eco' : 'terrain';
  if(typeof document === 'undefined') return;
  var vues = document.querySelectorAll('.ck-vue');
  for(var i = 0; i < vues.length; i++) vues[i].hidden = vues[i].getAttribute('data-vue') !== _CK.vue;
  var bs = document.querySelectorAll('#ck-bascule button');
  for(var j = 0; j < bs.length; j++) bs[j].setAttribute('aria-selected', String(bs[j].getAttribute('data-vue') === _CK.vue));
  var h = document.getElementById('ck-eco-corps');
  if(_CK.vue === 'eco' && h && !h.firstChild && typeof window._pilTabEco === 'function'){
    try { h.innerHTML = window._pilTabEco(_CK.d); }
    catch(e){ if(window._mvAvale) window._mvAvale(e, 'cockpit.js/_ckVue'); }
  }
  if(typeof window._mvGraphRepeindre === 'function') window._mvGraphRepeindre();
};
window._ckBasculeHtml = function(vue){
  //   La vue se lit dans data-vue au clic (C24b : aucune valeur posée dans le gestionnaire).
  var b = function(v, l){ return '<button type="button" role="tab" data-vue="' + v + '" aria-selected="' + (vue === v) + '" onclick="_ckVue(this.getAttribute(\'data-vue\'))">' + l + '</button>'; };
  return '<div class="ck-bascule" id="ck-bascule" role="tablist" aria-label="Vue de la journée">' + b('terrain', 'Terrain') + b('eco', 'Économie') + '</div>';
};

// ── Après le dessin : la courbe s'inscrit au kit (tracé, infobulle), les chiffres défilent ────────
window._ckApres = function(){
  if(typeof document === 'undefined') return;
  if(document.getElementById('ck-charge') && typeof window._mvGraphSuivre === 'function'){
    window._mvGraphSuivre('#ck-charge', function(w){ return window._ckChargeSvg(w, _CK.serie, _CK.m); }, { max: 900 });
  }
  var els = document.querySelectorAll('[data-ck-cpt]');
  for(var i = 0; i < els.length; i++){
    var el = els[i], k = el.getAttribute('data-ck-cpt'), fin = Number(el.getAttribute('data-ck-fin'));
    if(!isFinite(fin)) continue;
    var avant = _CK.vu[k];
    _CK.vu[k] = fin;
    if(avant == null || avant === fin || !window._mvAnim) continue;
    el.setAttribute('data-v', String(avant));
    el.textContent = _ckNb(avant);
    window._mvAnim.compter(el, fin, _ckNb, 900);
  }
};
