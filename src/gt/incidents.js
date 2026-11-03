// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — src/gt/incidents.js — L'ÉCRAN INCIDENTS DE LA CONSOLE GUERETTECH — GT-UI-2, §517
// ════════════════════════════════════════════════════════════════════════════
// La maquette v1 (docs/maquettes/maquette-console-gt-v1.html, MAQ-1) : les incidents en TABLEAU — des onglets par
// statut, une recherche, des filtres, le tri sur chaque colonne, la sélection pour agir sur plusieurs, et la fiche
// de l'incident à côté (sur ordinateur) ou au-dessus (au téléphone). Le suivi (GT-SUIVI-1, §515) y prend sa place :
// la priorité confirmée, sinon la suggérée en pointillé ; le statut ; « revenu après clôture ».
// Ce fichier ne lit la console que par `window._agtIncDonnees()` (en lecture) et n'agit que par ses gestes publics
// (agtSuiviPrio, agtSuiviStatut, agtSuiviLot, agtResolveGroup, agtErrCopy, agtPurgeErrors, agtRenderBody).
// ⚠️ Chargé par src/gt.js, sur gt.html seulement.
// ════════════════════════════════════════════════════════════════════════════

export var ONGLETS = [['ouverts', 'Ouverts'], ['alivrer', '\u00c0 livrer'], ['averifier', '\u00c0 v\u00e9rifier'], ['clos', 'Clos'], ['tous', 'Tous']];
var ORDRE_ST = ['nouveau', 'qualifie', 'en_cours', 'corrige', 'livre', 'clos', 'sans_suite'];
var E = { onglet: 'ouverts', q: '', prios: {}, client: '', source: '', periode: 0, tri: 'prio', sens: 1, sel: {}, ouvert: '' };

// ── Les fonctions pures (le harnais gtui2 les joue) ──────────────────────────
// Une valeur posée dans un gestionnaire inline passe par _escAttr (C24b) — celle de l'appli quand elle est chargée.
function _escAttr(v) { return (typeof window !== 'undefined' && window._escAttr) ? window._escAttr(v) : String(v == null ? '' : v).replace(/[\\'"<>&]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
export function statutDe(g, d) { var s = (d.suivi || {})[g.key] || {}; return s.statut || 'nouveau'; }
export function ongletDe(g, d) {
  var st = statutDe(g, d);
  if (st === 'corrige') return 'alivrer';
  if (st === 'livre') return 'averifier';
  if (g.nOpen > 0) return 'ouverts';           // un incident clos qui revient repasse dans les ouverts
  return 'clos';                               // tout traité : clos, sans suite, ou traité avant le suivi
}
export function prioDe(g, d) { var s = (d.suivi || {})[g.key] || {}; return { p: s.prio || d.prio(g).p, confirmee: !!s.prio }; }
export function revenu(g, d) { var s = (d.suivi || {})[g.key] || {}; return !!(s.closLe && d.fin[s.statut] && g.nOpen > 0); }
function plier(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
export function filtrer(groupes, d, e, maintenant) {
  var q = plier(e.q).trim(), prios = Object.keys(e.prios || {}).filter(function (k) { return e.prios[k]; });
  var lim = e.periode > 0 ? (maintenant || Date.now()) - e.periode * 86400000 : 0;
  return groupes.filter(function (g) {
    if (e.onglet && e.onglet !== 'tous' && ongletDe(g, d) !== e.onglet) return false;
    if (prios.length && prios.indexOf(prioDe(g, d).p) < 0) return false;
    if (e.client && !(g.tenants || {})[e.client]) return false;
    if (e.source === 'domaines' && !(g.fb > 0)) return false;
    if (e.source === 'poste' && !(g.loc > 0)) return false;
    if (lim && !(g.last && g.last.getTime() >= lim)) return false;
    if (q) {
      var foin = plier([g.msg, (d.cat || {})[g.cat] || g.cat].concat(Object.keys(g.tenants || {}), Object.keys(g.pages || {})).join(' '));
      if (foin.indexOf(q) < 0) return false;
    }
    return true;
  });
}
export function trier(liste, d, e) {
  var k = e.tri, s = e.sens || 1;
  var v = function (g) {
    if (k === 'prio') return [Number(prioDe(g, d).p.slice(1)), -g.nOpen, -(g.last ? g.last.getTime() : 0)];
    if (k === 'titre') return [plier(g.msg)];
    if (k === 'fois') return [-g.n];
    if (k === 'derniere') return [-(g.last ? g.last.getTime() : 0)];
    if (k === 'statut') return [ORDRE_ST.indexOf(statutDe(g, d))];
    return [0];
  };
  return liste.map(function (g, i) { return { g: g, v: v(g), i: i }; }).sort(function (a, b) {
    for (var j = 0; j < a.v.length; j++) { if (a.v[j] < b.v[j]) return -s; if (a.v[j] > b.v[j]) return s; }
    return a.i - b.i;
  }).map(function (x) { return x.g; });
}
// ★ GT-UI-4 (§519) — la fiche de la maquette : les quatorze derniers jours (une barre par jour, aujourd'hui à droite)…
export function histo14(g, maintenant) {
  var j0 = new Date(maintenant || Date.now()); j0.setHours(0, 0, 0, 0);
  var n = []; for (var i = 0; i < 14; i++) n.push(0);
  (g.items || []).forEach(function (e) {
    var t = Date.parse(e && e.ts); if (!t) return;
    var dj = new Date(t); dj.setHours(0, 0, 0, 0);
    var k = 13 - Math.round((j0 - dj) / 86400000);
    if (k >= 0 && k < 14) n[k]++;
  });
  return n;
}
// … et ce qui y est lié : les autres incidents OUVERTS d'un même domaine, les plus urgents d'abord (trois au plus).
export function lies(g, groupes, d) {
  var noms = Object.keys(g.tenants || {});
  var L = (groupes || []).filter(function (x) { return x.id !== g.id && x.nOpen > 0 && Object.keys(x.tenants || {}).some(function (t) { return noms.indexOf(t) >= 0; }); });
  return trier(L, d, { tri: 'prio', sens: 1 }).slice(0, 3);
}
var PRIO_COUL = { P1: 'mvpas-rouge', P2: 'mvpas-orange', P3: 'mvpas-gris', P4: 'mvpas-gris' };
var ST_COUL = { nouveau: 'mvpas-retard', qualifie: 'mvpas-afaire', en_cours: 'mvpas-surveiller', corrige: 'mvpas-encours', livre: 'mvpas-encours', clos: 'mvpas-fait', sans_suite: 'mvpas-fait' };
export function compteOnglets(groupes, d) {
  var n = { ouverts: 0, alivrer: 0, averifier: 0, clos: 0, tous: groupes.length };
  groupes.forEach(function (g) { n[ongletDe(g, d)]++; });
  return n;
}

// ── Le dessin ─────────────────────────────────────────────────────────────────
function th(d, col, lib) {
  var on = E.tri === col, aria = on ? (E.sens > 0 ? 'ascending' : 'descending') : 'none';
  return '<th aria-sort="' + aria + '"><button class="agt-tbl-tri' + (on ? ' on' : '') + '" onclick="agtIncTri(\'' + _escAttr(col) + '\')">' + lib + (on ? (E.sens > 0 ? ' \u2191' : ' \u2193') : '') + '</button></th>';
}
function fiche(g, d) {
  var esc = d.esc, s = (d.suivi || {})[g.key] || {};
  var noms = Object.keys(g.tenants || {}), pages = Object.keys(g.pages || {}), gens = Object.keys(g.users || {}), vers = Object.keys(g.versions || {}).sort();
  var h = '<aside class="agt-inc-fiche" aria-label="Fiche de l\u2019incident">';
  h += '<div class="agt-inc-fiche-tete"><div class="agt-inc-fiche-sur">' + esc((d.cat || {})[g.cat] || g.cat || 'Erreur') + ' \u00b7 ' + esc(g.level || 'error') + '</div>'
    + '<button class="agt-inc-x" onclick="agtIncOuvrir(\'\')" aria-label="Fermer la fiche">\u00d7</button></div>';
  h += '<h3 class="agt-inc-fiche-titre">' + esc(g.msg || '(sans message)') + '</h3>';
  h += '<div class="agt-inc-bloc">' + d.ligneSuivi(g) + '</div>';
  var hs = histo14(g), max = Math.max.apply(null, hs.concat([1]));
  h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Les 14 derniers jours</div><div class="agt-histo" aria-label="Occurrences des quatorze derniers jours">'
    + hs.map(function (v) { return '<span' + (v ? '' : ' class="zero"') + ' style="height:' + (v ? Math.max(8, Math.round(v / max * 100)) : 4) + '%" title="' + v + '"></span>'; }).join('')
    + '</div><div class="agt-histo-pied"><span>il y a 13 jours</span><span>aujourd\u2019hui</span></div></div>';
  var li = lies(g, d.groupes, d);
  if (li.length) h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Li\u00e9 \u00e0</div><ul class="agt-lies">' + li.map(function (x) {
    var px = prioDe(x, d);
    return '<li tabindex="0" onclick="agtIncOuvrir(\'' + _escAttr(x.id) + '\')"><span class="mvpas mvpas-type ' + PRIO_COUL[px.p] + (px.confirmee ? '' : ' agt-sugg') + '">' + px.p + '</span><span>' + esc(x.msg || '') + '</span><span class="mvpas mvpas-statut ' + ST_COUL[statutDe(x, d)] + '">' + esc(d.st[statutDe(x, d)] || '') + '</span></li>';
  }).join('') + '</ul></div>';
  h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Rep\u00e8res</div><dl class="agt-inc-dl">'
    + '<dt>Domaines</dt><dd>' + (noms.length ? noms.map(function (n) { return esc(n) + (g.tenants[n] > 1 ? ' \u00d7' + g.tenants[n] : ''); }).join(', ') : '\u2014') + '</dd>'
    + '<dt>Fois</dt><dd>' + g.n + (gens.length ? ' \u00b7 ' + gens.length + ' personne' + (gens.length > 1 ? 's' : '') : '') + (g.nOpen < g.n ? ' \u00b7 ' + g.nOpen + ' non trait\u00e9e' + (g.nOpen > 1 ? 's' : '') : '') + '</dd>'
    + '<dt>Premi\u00e8re fois</dt><dd>' + (g.first ? esc(d.dateFr(g.first)) : '\u2014') + '</dd>'
    + '<dt>Derni\u00e8re fois</dt><dd>' + (g.last ? 'il y a ' + esc(d.relTime(g.last.toISOString())) : '\u2014') + '</dd>'
    + '<dt>\u00c9crans</dt><dd>' + (pages.length ? esc(pages.slice(0, 4).join(', ')) : '\u2014') + '</dd>'
    + '<dt>Versions</dt><dd>' + (vers.length ? esc(vers.join(', ')) : 'non dite (avant 10.59)') + (s.livreEn ? ' \u00b7 livr\u00e9 en ' + esc(s.livreEn) : '') + '</dd></dl></div>';
  var occ = (g.items || []).slice().sort(function (a, b) { return String(b.ts || '') < String(a.ts || '') ? -1 : 1; }).slice(0, 8);
  h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Derni\u00e8res occurrences</div><ul class="agt-inc-occ">' + occ.map(function (e) {
    return '<li><span>' + esc(e.ts ? 'il y a ' + d.relTime(e.ts) : '\u2014') + ' \u00b7 ' + esc(e._tenantNom || e.tenant || '?') + (e.page ? ' \u00b7 ' + esc(e.page) : '') + (e.v ? ' \u00b7 ' + esc(e.v) : '') + (e.resolved ? ' \u00b7 trait\u00e9e' : '') + '</span>'
      + (e.detail ? '<code>' + esc(String(e.detail).slice(0, 280)) + '</code>' : '') + '</li>';
  }).join('') + '</ul></div>';
  h += '<div class="agt-inc-actions">' + (g.nOpen > 0 ? '<button class="agt-btn fill agt-inc-court" onclick="agtResolveGroup(\'' + _escAttr(g.id) + '\')">Clore l\u2019incident</button>' : '')
    + '<button class="agt-btn agt-inc-court" onclick="agtErrCopy(\'' + _escAttr(g.id) + '\')">Copier pour le d\u00e9veloppeur</button></div>';
  return h + '</aside>';
}
export function vue(d) {
  var esc = d.esc, tout = d.groupes || [];
  var n = compteOnglets(tout, d), liste = trier(filtrer(tout, d, E), d, E);
  var ouvert = E.ouvert ? tout.filter(function (g) { return g.id === E.ouvert; })[0] : null;
  var clients = {}; tout.forEach(function (g) { Object.keys(g.tenants || {}).forEach(function (t) { clients[t] = 1; }); });
  var sel = Object.keys(E.sel).filter(function (k) { return E.sel[k]; });
  var h = '<div class="agt-inc">' + (d.sante || '');
  h += '<div class="agt-inc-onglets" role="tablist">' + ONGLETS.map(function (o) {
    return '<button role="tab" aria-selected="' + (E.onglet === o[0]) + '" class="agt-inc-onglet' + (E.onglet === o[0] ? ' on' : '') + '" onclick="agtIncOnglet(\'' + _escAttr(o[0]) + '\')">' + o[1] + ' <span>' + n[o[0]] + '</span></button>';
  }).join('') + '</div>';
  h += '<div class="agt-inc-outils">'
    + '<input id="agt-inc-q" class="agt-inc-q" type="search" placeholder="Chercher un message, un client, un \u00e9cran" aria-label="Chercher un incident" value="' + esc(E.q) + '" oninput="agtIncCherche(this.value)">'
    + ['P1', 'P2', 'P3', 'P4'].map(function (p) { return '<button class="mvpas mvpas-filtre' + (E.prios[p] ? ' on' : '') + '" aria-pressed="' + !!E.prios[p] + '" onclick="agtIncPrioFiltre(\'' + _escAttr(p) + '\')">' + p + '</button>'; }).join('')
    + '<select class="agt-inc-sel" aria-label="Client" onchange="agtIncFiltre(\'client\',this.value)"><option value="">Tous les clients</option>' + Object.keys(clients).sort().map(function (c) { return '<option value="' + esc(c) + '"' + (E.client === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>'
    + '<select class="agt-inc-sel" aria-label="Source" onchange="agtIncFiltre(\'source\',this.value)"><option value="">Toutes les sources</option><option value="domaines"' + (E.source === 'domaines' ? ' selected' : '') + '>Domaines</option><option value="poste"' + (E.source === 'poste' ? ' selected' : '') + '>Ce poste</option></select>'
    + '<select class="agt-inc-sel" aria-label="P\u00e9riode" onchange="agtIncFiltre(\'periode\',this.value)">' + [[0, 'Depuis toujours'], [7, '7 jours'], [30, '30 jours'], [90, '90 jours']].map(function (p) { return '<option value="' + p[0] + '"' + (E.periode === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') + '</select>'
    + (tout.some(function (g) { return g.nOpen < g.n; }) ? '<button class="agt-btn agt-inc-court" onclick="agtPurgeErrors()">Purger les trait\u00e9es</button>' : '')
    + '</div>';
  if (sel.length) h += '<div class="agt-inc-lot" role="region" aria-label="S\u00e9lection"><b>' + sel.length + ' s\u00e9lectionn\u00e9' + (sel.length > 1 ? 's' : '') + '</b>'
    + '<button class="agt-btn fill agt-inc-court" onclick="agtIncLot(\'clos\')">Clore</button>'
    + ['P1', 'P2', 'P3', 'P4'].map(function (p) { return '<button class="agt-btn agt-inc-court" onclick="agtIncLot(\'' + _escAttr(p) + '\')">' + p + '</button>'; }).join('')
    + '<button class="agt-btn agt-inc-court" onclick="agtIncSelTout(false)">D\u00e9s\u00e9lectionner</button></div>';
  h += '<div class="agt-inc-corps' + (ouvert ? ' avec-fiche' : '') + '">';
  if (ouvert) h += fiche(ouvert, d);
  h += '<div class="agt-tbl-cadre">';
  if (!liste.length) h += '<div class="agt-inc-vide">Rien pour ces filtres.</div>';
  else {
    h += '<table class="agt-tbl"><thead><tr><th class="agt-tbl-case"><input type="checkbox" aria-label="Tout s\u00e9lectionner" onchange="agtIncSelTout(this.checked)"' + (sel.length && sel.length === liste.length ? ' checked' : '') + '></th>'
      + th(d, 'prio', 'Priorit\u00e9') + th(d, 'titre', 'Incident') + th(d, 'fois', 'Fois') + th(d, 'derniere', 'Derni\u00e8re') + th(d, 'statut', 'Statut') + '</tr></thead><tbody>';
    liste.slice(0, 300).forEach(function (g) {
      var p = prioDe(g, d), st = statutDe(g, d), noms = Object.keys(g.tenants || {});
      h += '<tr class="' + (g.id === E.ouvert ? 'on' : '') + (g.nOpen === 0 ? ' traite' : '') + '" tabindex="0" onclick="agtIncOuvrir(\'' + _escAttr(g.id) + '\')" onkeydown="if(event.key===\'Enter\')agtIncOuvrir(\'' + _escAttr(g.id) + '\')">'
        + '<td class="agt-tbl-case" onclick="event.stopPropagation()"><input type="checkbox" aria-label="S\u00e9lectionner" onchange="agtIncSel(\'' + _escAttr(g.id) + '\',this.checked)"' + (E.sel[g.id] ? ' checked' : '') + '></td>'
        + '<td><span class="mvpas mvpas-type ' + PRIO_COUL[p.p] + (p.confirmee ? '' : ' agt-sugg') + ' agt-prio ' + p.p.toLowerCase() + (p.confirmee ? '' : ' sugg') + '" title="' + (p.confirmee ? 'Priorit\u00e9 confirm\u00e9e' : 'Sugg\u00e9r\u00e9e : ' + esc(d.prio(g).pourquoi)) + '">' + p.p + '</span></td>'
        + '<td class="agt-tbl-titre"><span class="agt-tbl-msg">' + esc(g.msg || '(sans message)') + '</span><span class="agt-tbl-sous">' + esc((d.cat || {})[g.cat] || g.cat || '') + (noms.length ? ' \u00b7 ' + esc(noms.slice(0, 3).join(', ')) + (noms.length > 3 ? ' +' + (noms.length - 3) : '') : '') + '</span></td>'
        + '<td class="agt-tbl-n">' + g.n + '</td>'
        + '<td>' + (g.last ? esc(d.relTime(g.last.toISOString())) : '\u2014') + '</td>'
        + '<td><span class="mvpas mvpas-statut ' + ST_COUL[st] + '">' + esc(d.st[st] || st) + '</span>' + (revenu(g, d) ? ' <span class="agt-revenu">revenu</span>' : '') + '</td></tr>';
    });
    h += '</tbody></table>';
    if (liste.length > 300) h += '<div class="agt-inc-vide">300 premiers sur ' + liste.length + ' \u2014 affinez la recherche.</div>';
  }
  return h + '</div></div></div>';
}

// ── Les gestes de l'écran ─────────────────────────────────────────────────────
function rendre() { if (window.agtRenderBody) window.agtRenderBody(); }
window._agtIncidentsVue = vue;
window.agtIncOnglet = function (o) { E.onglet = o; E.sel = {}; rendre(); };
window.agtIncTri = function (col) { if (E.tri === col) E.sens = -E.sens; else { E.tri = col; E.sens = 1; } rendre(); };
window.agtIncOuvrir = function (gid) { E.ouvert = (gid && E.ouvert !== gid) ? String(gid) : ''; rendre(); };
window.agtIncSel = function (gid, on) { if (on) E.sel[gid] = true; else delete E.sel[gid]; rendre(); };
window.agtIncSelTout = function (on) {
  E.sel = {};
  if (on && window._agtIncDonnees) { var d = window._agtIncDonnees(); filtrer(d.groupes || [], d, E).forEach(function (g) { E.sel[g.id] = true; }); }
  rendre();
};
// Depuis la carte d'un client : ses incidents ouverts (le filtre client porte le NOM, comme les incidents).
window.agtIncVoirClient = function (slug) {
  var d = window._agtIncDonnees ? window._agtIncDonnees() : {};
  E.client = ((d.noms || {})[slug]) || ''; E.onglet = 'ouverts'; E.ouvert = ''; E.sel = {};
  if (window.agtSwitchTab) window.agtSwitchTab('incidents');
};
window.agtIncPrioFiltre = function (p) { if (E.prios[p]) delete E.prios[p]; else E.prios[p] = true; rendre(); };
window.agtIncFiltre = function (k, v) { if (k === 'periode') E.periode = Number(v) || 0; else if (k === 'client' || k === 'source') E[k] = String(v || ''); rendre(); };
window.agtIncCherche = function (v) {
  E.q = String(v || ''); rendre();
  var i = document.getElementById('agt-inc-q'); if (i) { i.focus(); try { i.setSelectionRange(E.q.length, E.q.length); } catch (e) { if (window.logError) window.logError({ level: 'info', cat: 'ui', msg: 'curseur de la recherche non pos\u00e9', detail: String((e && e.message) || e) }); } }
};
window.agtIncLot = async function (quoi) {
  var gids = Object.keys(E.sel).filter(function (k) { return E.sel[k]; });
  if (!gids.length || !window.agtSuiviLot) return;
  var patch = (quoi === 'clos') ? { statut: 'clos', closLe: new Date().toISOString() } : { prio: quoi };
  if (await window.agtSuiviLot(gids, patch)) { E.sel = {}; rendre(); }
};

// ── « Annuler » après un geste (la maquette : chaque geste se défait) ─────────
var _annTimer = null;
window._agtAnnulable = function (texte, defaire) {
  var b = document.getElementById('agt-annuler');
  if (!b) { b = document.createElement('div'); b.id = 'agt-annuler'; b.className = 'agt-annuler'; b.setAttribute('role', 'status'); document.body.appendChild(b); }
  b.innerHTML = '<span></span><button>Annuler</button>';
  b.firstChild.textContent = String(texte || '');
  b.lastChild.onclick = function () { b.remove(); if (_annTimer) clearTimeout(_annTimer); if (typeof defaire === 'function') defaire(); };
  if (_annTimer) clearTimeout(_annTimer);
  _annTimer = setTimeout(function () { var x = document.getElementById('agt-annuler'); if (x) x.remove(); }, 8000);
};
