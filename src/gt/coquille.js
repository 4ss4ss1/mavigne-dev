// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — src/gt/coquille.js — LA COQUILLE DE LA CONSOLE GUERETTECH — GT-UI-1, §516
// ════════════════════════════════════════════════════════════════════════════
// La maquette v1 (docs/maquettes/maquette-console-gt-v1.html, MAQ-1) : une barre latérale sur ordinateur,
// un lien direct par écran et par fiche, une recherche partout (Ctrl K). Ce fichier porte ce qui ne touche
// PAS aux données : les routes et la palette. Il ne lit la console que par ce qu'elle expose en lecture
// (window._agtOngletCourant, _agtEstVerrouille, _agtPaletteDonnees) et n'agit que par ses gestes publics
// (agtSwitchTab, agtShowFiche, agtIncOuvrir, renderAdminGT, agtLockNow, agtBizLivre, agtBizCsv).
// ⚠️ Chargé par src/gt.js APRÈS admin-gt.js, sur gt.html seulement — l'appli des clients ne le voit pas.
// ════════════════════════════════════════════════════════════════════════════

// ── Les routes (GT-B31 : « pas de lien direct ») ──────────────────────────────
//   #radar · #incidents · #clients · #clients/<slug> (la fiche) · #facturation · #leads · #outils
//   L'onglet interne de la facturation s'appelle encore `business` (D7 : le libellé seul change).
var ROUTES = { radar: 'radar', incidents: 'incidents', clients: 'clients', facturation: 'business', leads: 'leads', outils: 'outils' };
export function lireRoute(hash) {
  var h = String(hash || '').replace(/^#/, '');
  try { h = decodeURIComponent(h); } catch (e) { h = ''; }
  var p = h.split('/');
  return { vue: p[0] || '', arg: p.slice(1).join('/') };
}
export function routeVersOnglet(vue) { return Object.prototype.hasOwnProperty.call(ROUTES, vue) ? ROUTES[vue] : ''; }
export function ongletVersRoute(onglet) { return onglet === 'business' ? 'facturation' : (routeVersOnglet(onglet) ? onglet : ''); }
// Un slug lu dans l'adresse ne part vers la console que s'il a la forme d'un slug (le lien vient d'ailleurs).
export function slugValide(s) { return /^[a-z0-9][a-z0-9-]{0,59}$/.test(String(s || '')); }

var _routeAppliquee = false;
function appliquerRoute() {
  if (!window.agtSwitchTab) return;
  if (window._agtEstVerrouille && window._agtEstVerrouille()) return;
  var r = lireRoute(location.hash), onglet = routeVersOnglet(r.vue);
  if (!onglet) return;
  if (!window._agtOngletCourant || window._agtOngletCourant() !== onglet) window.agtSwitchTab(onglet);
  if (onglet === 'clients' && r.arg && slugValide(r.arg) && window.agtShowFiche) window.agtShowFiche(r.arg);
}
// Appelée par la console : à son premier chargement complet (la route d'arrivée), puis à chaque onglet.
window._agtRouteAppliquer = function () { if (_routeAppliquee) return; _routeAppliquee = true; appliquerRoute(); };
window._agtRouteNoter = function (onglet, arg) {
  var v = ongletVersRoute(onglet); if (!v) return;
  var h = '#' + v + (arg && slugValide(arg) ? '/' + arg : '');
  if (location.hash !== h) { try { history.replaceState(null, '', h); } catch (e) { location.hash = h; } }
};
window.addEventListener('hashchange', appliquerRoute);

// ── La palette (Ctrl K) ───────────────────────────────────────────────────────
// Sans accents, sans casse ; un mot qui COMMENCE par la recherche passe devant un mot qui la contient.
export function plier(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
export function rang(texte, q) {
  var t = plier(texte), r = plier(q).trim();
  if (!r) return 1;
  if (t.indexOf(r) === 0) return 3;
  if ((' ' + t).indexOf(' ' + r) >= 0) return 2;
  return t.indexOf(r) >= 0 ? 1 : 0;
}
var COMMANDES = [
  { titre: 'Actualiser la console', type: 'Commande', faire: function () { if (window.renderAdminGT) window.renderAdminGT(); } },
  { titre: 'Verrouiller la session', type: 'Commande', faire: function () { if (window.agtLockNow) window.agtLockNow(); } },
  { titre: 'Livre des recettes (CSV)', type: 'Commande', faire: function () { if (window.agtSwitchTab) window.agtSwitchTab('business'); if (window.agtBizLivre) window.agtBizLivre(); } },
  { titre: 'Export comptable (CSV)', type: 'Commande', faire: function () { if (window.agtSwitchTab) window.agtSwitchTab('business'); if (window.agtBizCsv) window.agtBizCsv(); } }
].concat(Object.keys(ROUTES).map(function (v) {
  var noms = { radar: 'Radar', incidents: 'Incidents', clients: 'Clients', facturation: 'Facturation', leads: 'Leads', outils: 'Outils' };
  return { titre: 'Aller à : ' + noms[v], type: 'Écran', faire: function () { if (window.agtSwitchTab) window.agtSwitchTab(ROUTES[v]); } };
}));
// Les entrées de la palette pour une recherche — au plus `max`, les meilleures d'abord, l'ordre d'origine à rang égal.
export function entreesPalette(d, q, max) {
  d = d || {};
  var tout = COMMANDES.map(function (c) { return { titre: c.titre, sous: '', type: c.type, faire: c.faire }; });
  (d.clients || []).forEach(function (c) {
    tout.push({ titre: c.nom || c.slug, sous: c.slug, type: 'Client', faire: function () { if (window.agtSwitchTab) window.agtSwitchTab('clients'); if (window.agtShowFiche) window.agtShowFiche(c.slug); } });
  });
  (d.incidents || []).forEach(function (g) {
    tout.push({ titre: g.msg || '(sans message)', sous: g.n + ' fois' + (g.ouvert ? '' : ' \u00b7 trait\u00e9'), type: 'Incident', faire: function () { if (window.agtSwitchTab) window.agtSwitchTab('incidents'); if (window.agtIncOuvrir) window.agtIncOuvrir(g.id); } });   // GT-UI-2 : la fiche de l'incident
  });
  (d.factures || []).forEach(function (f) {
    tout.push({ titre: f.ref, sous: f.slug, type: 'Facture', faire: function () { if (window.agtSwitchTab) window.agtSwitchTab('business'); } });
  });
  (d.leads || []).forEach(function (l) {
    tout.push({ titre: l.nom || 'Demande', sous: '', type: 'Lead', faire: function () { if (window.agtSwitchTab) window.agtSwitchTab('leads'); } });
  });
  var vues = tout.map(function (e, i) { return { e: e, i: i, r: Math.max(rang(e.titre, q), rang(e.sous, q) ? 1 : 0) }; })
    .filter(function (x) { return x.r > 0; });
  vues.sort(function (a, b) { return (b.r - a.r) || (a.i - b.i); });
  return vues.slice(0, max || 12).map(function (x) { return x.e; });
}

var _pal = null, _palEntrees = [], _palSel = 0;
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function dessiner() {
  if (!_pal) return;
  var q = _pal.querySelector('input').value;
  _palEntrees = entreesPalette(window._agtPaletteDonnees ? window._agtPaletteDonnees() : {}, q, 12);
  if (_palSel >= _palEntrees.length) _palSel = Math.max(0, _palEntrees.length - 1);
  var ul = _pal.querySelector('.agt-pal-liste');
  ul.innerHTML = _palEntrees.length ? _palEntrees.map(function (e, i) {
    return '<li role="option" aria-selected="' + (i === _palSel) + '" data-i="' + i + '" class="agt-pal-it' + (i === _palSel ? ' on' : '') + '">'
      + '<span class="agt-pal-t">' + esc(e.titre) + (e.sous ? ' <span class="agt-pal-s">' + esc(e.sous) + '</span>' : '') + '</span>'
      + '<span class="agt-pal-k">' + esc(e.type) + '</span></li>';
  }).join('') : '<li class="agt-pal-vide">Rien ne correspond.</li>';
}
function fermer() { if (_pal) { _pal.remove(); _pal = null; } }
function lancer(i) { var e = _palEntrees[i]; fermer(); if (e && e.faire) e.faire(); }
window.agtPalette = function () {
  if (window._agtEstVerrouille && window._agtEstVerrouille()) return;   // jamais au-dessus du verrou
  if (!document.getElementById('page-admin-gt')) return;
  if (_pal) { fermer(); return; }
  _palSel = 0;
  _pal = document.createElement('div');
  _pal.className = 'agt-pal-fond';
  _pal.innerHTML = '<div class="agt-pal" role="dialog" aria-modal="true" aria-label="Rechercher dans la console">'
    + '<input type="search" class="agt-pal-q" placeholder="Un client, un incident, une facture, une commande\u2026" aria-label="Rechercher" autocomplete="off">'
    + '<ul class="agt-pal-liste" role="listbox"></ul>'
    + '<div class="agt-pal-pied">\u2191 \u2193 pour choisir \u00b7 Entr\u00e9e pour ouvrir \u00b7 \u00c9chap pour fermer</div></div>';
  _pal.addEventListener('mousedown', function (ev) { if (ev.target === _pal) fermer(); });
  _pal.addEventListener('click', function (ev) { var li = ev.target.closest('.agt-pal-it'); if (li) lancer(+li.dataset.i); });
  document.body.appendChild(_pal);
  var inp = _pal.querySelector('input');
  inp.addEventListener('input', function () { _palSel = 0; dessiner(); });
  inp.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); _palSel = Math.min(_palSel + 1, Math.max(0, _palEntrees.length - 1)); dessiner(); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); _palSel = Math.max(0, _palSel - 1); dessiner(); }
    else if (ev.key === 'Enter') { ev.preventDefault(); lancer(_palSel); }
    else if (ev.key === 'Escape') { ev.preventDefault(); fermer(); }
  });
  dessiner();
  inp.focus();
};
document.addEventListener('keydown', function (ev) {
  if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && (ev.key === 'k' || ev.key === 'K')) {
    var page = document.getElementById('page-admin-gt');
    if (!page || !page.classList.contains('active')) return;
    ev.preventDefault();
    window.agtPalette();
  }
});
