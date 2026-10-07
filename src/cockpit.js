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

var _CK = { vu: {}, fil: null, serie: [], m: null };

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

// ── La mise en page : à gauche ce qui décide, à droite ce qui arrive ──────────────────────────────
window._ckAuj = function(o){
  var d = o.d || {}, m = o.m || {}, mo = o.montrer || {}, auj = _ckIso();
  var fil = window._ckFilDonnees(o.journal, auj);
  var nVal = fil.filter(function(x){ return x.e.statut === 'Validé'; }).length;
  var vus = _CK.fil;                       // null au premier dessin : rien ne s'éclaire
  _CK.fil = new Set(fil.map(function(x){ return x.e.id; }));
  _CK.serie = window._ckChargeSerie(o.photos, d, auj);
  _CK.m = m;
  var info = function(k){ return (k && typeof window._mvInfoBtn === 'function') ? window._mvInfoBtn(k) : ''; };
  // Les panneaux prennent la carte commune de l'appli (.catpanel : fond, filet, rayon, ombre) — rien de redessiné.
  //   L'identifiant s'écrit en entier à l'appel (id="…") : la pastille « Nouveau » le cherche tel quel (ANN-1).
  var pan = function(attrId, titre, k, cadre, corps){
    return '<section class="catpanel ck-pan" ' + attrId + '><header class="ck-pan-hd"><h3 class="ck-pan-t">' + titre + info(k) + '</h3>'
      + (cadre ? '<p class="ck-cadre">' + cadre + '</p>' : '') + '</header>' + corps + '</section>';
  };
  var reste = Number(d.totalReste);
  var gauche = (o.hero ? '<div class="pil-cockpit-card ck-hero">' + o.hero + '</div>' : '')
    + (o.inaction ? '<div class="pil-cockpit-card">' + o.inaction + '</div>' : '')
    + (o.dec ? '<div class="pil-sec-h">La décision du jour</div><div class="pil-dec">' + o.dec + '</div>' : '')
    + (o.det ? '<div class="pil-dec2">' + o.det + '</div>' : '')
    + (o.chantiers ? pan('id="ck-chantiers"', 'Les chantiers en cours', null, 'Dans l’ordre des dates de la campagne', o.chantiers) : '')
    + (mo.charge ? pan('id="ck-charge-pan"', 'Charge restante', 'pil.charge',
        (isFinite(reste) && d.totalReste != null ? _ckNb(reste) + '\u202fh à faire, photographiées chaque jour' : 'Photographiée chaque jour'),
        '<div id="ck-charge" class="ck-graphe"></div>') : '');
  var droite = (mo.fil ? pan('id="ck-fil-pan"', '<span class="ck-vif" aria-hidden="true"></span>En direct', 'pil.fil',
        'Ce que l’équipe valide et commence aujourd’hui', window._ckFilHtml(fil, vus, Date.now())) : '')
    + (o.kpis ? '<div class="pil-cockpit-card ck-kpis"><div class="pil-cks">' + o.kpis + '</div></div>' : '')
    + (o.alertes || '');
  setTimeout(window._ckApres, 0);
  return '<div class="ck-auj">' + (mo.resume ? window._ckResumeHtml(m, d, nVal) : '')
    + '<div class="ck-cols"><div class="ck-main">' + gauche + '</div><div class="ck-side">' + droite + '</div></div></div>';
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
