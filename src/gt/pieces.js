// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — src/gt/pieces.js — LES PIÈCES SIGNÉES (console GUERETTECH) — FICHE-1, §530
// ════════════════════════════════════════════════════════════════════════════
// La maquette docs/maquettes/maquette-fiche-client-v1.html, écran 2 : quatre chiffres, des onglets (toutes, à jour,
// à refaire signer, sans signature, pièces déposées), une recherche, « Demander la signature de la nouvelle
// version » (des BROUILLONS, D5), le registre, et la fiche d'une preuve (horodatage serveur, signataire, empreintes,
// trace, historique). Les preuves sont écrites par le serveur hors du domaine (_mv_signatures) : la console les LIT.
// Ce fichier ne lit la console que par `window._agtPiecesDonnees()` et n'agit que par ses gestes publics.
// ⚠️ Chargé par src/gt.js, sur gt.html seulement.
// ════════════════════════════════════════════════════════════════════════════

export var ONGLETS = [['toutes', 'Toutes'], ['ajour', '\u00c0 jour'], ['arefaire', '\u00c0 refaire signer'], ['sans', 'Sans signature'], ['deposees', 'Pi\u00e8ces d\u00e9pos\u00e9es']];
var E = { onglet: 'toutes', q: '', ouvert: '' };
function _escAttr(v) { return (typeof window !== 'undefined' && window._escAttr) ? window._escAttr(v) : String(v == null ? '' : v).replace(/[\\'"<>&]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
function plier(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, ''); }

// ── Les fonctions pures (le harnais fiche1 les joue) ─────────────────────────
// L'état d'une preuve face aux versions en vigueur : à jour, dépassée (laquelle), jamais signée.
export function etatPreuve(p, versions) {
  if (!p || !p.docs) return { cle: 'jamais', label: 'Jamais sign\u00e9' };
  var c = (p.docs.cgv || {}).version, d = (p.docs.dpa || {}).version;
  if (c === versions.cgv && d === versions.dpa) return { cle: 'ajour', label: '\u00c0 jour' };
  var q = [];
  if (c !== versions.cgv) q.push('CG ' + (c || '?') + ' \u2192 ' + versions.cgv);
  if (d !== versions.dpa) q.push('accord ' + (d || '?') + ' \u2192 ' + versions.dpa);
  return { cle: 'depassee', label: 'D\u00e9pass\u00e9e : ' + q.join(', ') };
}
export function filtrer(lignes, e) {
  var q = plier(e.q).trim();
  return (lignes || []).filter(function (l) {
    if (e.onglet === 'ajour' && l.etat !== 'ajour') return false;
    if (e.onglet === 'arefaire' && l.etat !== 'depassee') return false;
    if (e.onglet === 'sans' && l.etat !== 'jamais') return false;
    if (e.onglet === 'deposees' && !(l.deposees > 0)) return false;
    if (q && plier([l.nom, l.slug, l.signataire, l.ref].join(' ')).indexOf(q) < 0) return false;
    return true;
  });
}
export function compte(lignes, deposees) {
  var n = {}; ONGLETS.forEach(function (o) { n[o[0]] = filtrer(lignes, { onglet: o[0], q: '' }).length; });
  if (deposees) n.deposees = deposees.length;   // l'onglet compte les PIÈCES, pas les domaines
  return n;
}

// ── Le dessin ─────────────────────────────────────────────────────────────────
var PASTILLE = { ajour: 'mvpas mvpas-statut mvpas-fait', depassee: 'mvpas mvpas-statut mvpas-retard', jamais: 'mvpas mvpas-statut mvpas-surveiller', hors: 'mvpas mvpas-etiquette' };
function fichePreuve(l, d) {
  var esc = d.esc, p = l.preuve, s = l.detail || {};
  var h = '<aside class="agt-inc-fiche" aria-label="Preuve d\u2019acceptation"><div class="agt-inc-fiche-tete"><div class="agt-inc-fiche-sur">Preuve d\u2019acceptation' + (p && p.ref ? ' \u00b7 ' + esc(p.ref) : '') + '</div>'
    + '<button class="agt-inc-x" onclick="agtPiecesOuvrir(\'\')" aria-label="Fermer la fiche">\u00d7</button></div><h3 class="agt-inc-fiche-titre">' + esc(l.nom) + '</h3>';
  if (!p) return h + '<div class="agt-inc-bloc"><p class="agt-cli-note">Aucune preuve : le domaine accepte \u00e0 sa premi\u00e8re connexion d\u2019administrateur.</p></div></aside>';
  h += '<div class="agt-inc-bloc"><dl class="agt-inc-dl">'
    + [['Accept\u00e9 le', s.quand + ' (horodatage serveur)'], ['Par', s.parCompte || s.signataire], ['Au nom de', s.client], ['CG', 'version ' + s.cgv + ' \u00b7 SHA-256 ' + s.hcgv], ['Accord de traitement', 'version ' + s.dpa + ' \u00b7 SHA-256 ' + s.hdpa], ['Trace', s.traceCourte || s.trace], ['Re\u00e7u', s.recu]]
      .map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + esc(x[1] || '\u2014') + '</dd>'; }).join('') + '</dl></div>';
  h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Historique</div>' + (s.hist ? '<ul class="agt-chrono">' + s.hist.map(function (x) { return '<li class="' + (x.type === 'preuve' ? 'facture' : '') + '"><span><b>' + esc(x.titreCourt || x.titre) + '</b><time>' + esc(x.sousCourt || x.sous) + '</time></span></li>'; }).join('') + '</ul>' : '<p class="agt-cli-note">' + (s.histKo ? 'Lecture de l\u2019historique impossible.' : 'Chargement de l\u2019historique\u2026') + '</p>')
    + '<p class="agt-cli-note">La preuve est \u00e9crite par le serveur hors du domaine : ni le client ni la console ne peuvent la r\u00e9\u00e9crire. Rien ne s\u2019efface ; une nouvelle version s\u2019ajoute \u00e0 l\u2019historique.</p></div>';
  h += '<div class="agt-inc-actions"><a class="agt-btn agt-inc-court" href="/cgu.html" target="_blank" rel="noopener">Ouvrir le texte sign\u00e9 (CG ' + esc(s.cgv) + ')</a>'
    + '<button class="agt-btn agt-inc-court" onclick="agtPreuveTelecharger(\'' + _escAttr(l.slug) + '\')">T\u00e9l\u00e9charger la preuve</button>'
    + '<button class="agt-btn agt-inc-court" onclick="agtPreuveRecu(\'' + _escAttr(l.slug) + '\')">Renvoyer le re\u00e7u</button></div>';
  return h + '</aside>';
}
export function vue(d) {
  var esc = d.esc, L = d.lignes || [], n = compte(L, d.deposees || []), liste = filtrer(L, E), k = d.kpis || {};
  var ouvert = E.ouvert ? L.filter(function (l) { return l.slug === E.ouvert; })[0] : null;
  var kpi = function (l, v, s, alerte) { return '<div class="mvcarte-fond agt-kpi"><div class="agt-kpi-l">' + l + '</div><div class="agt-kpi-v">' + v + '</div><div class="agt-kpi-s' + (alerte ? ' alerte' : '') + '">' + s + '</div></div>'; };
  var h = '<div class="agt-inc"><div class="agt-kpis">'
    + kpi('Domaines sign\u00e9s', k.signes + ' sur ' + k.total, 'hors domaine interne', false)
    + kpi('\u00c0 refaire signer', String(k.arefaire), k.arefaire ? esc(k.arefaireLib) : 'personne', k.arefaire > 0)
    + kpi('Versions en vigueur', 'CG ' + esc(d.versions.cgv), 'accord de traitement ' + esc(d.versions.dpa), false)
    + kpi('Pi\u00e8ces d\u00e9pos\u00e9es', String(k.deposees), 'devis et contrats sign\u00e9s hors appli', false) + '</div>';
  h += '<div class="agt-inc-onglets" role="tablist">' + ONGLETS.map(function (o) {
    return '<button role="tab" aria-selected="' + (E.onglet === o[0]) + '" class="agt-inc-onglet' + (E.onglet === o[0] ? ' on' : '') + '" onclick="agtPiecesOnglet(\'' + _escAttr(o[0]) + '\')">' + o[1] + ' <span>' + n[o[0]] + '</span></button>';
  }).join('') + '</div>';
  h += '<div class="agt-inc-outils"><input id="agt-pcs-q" class="agt-inc-q" type="search" placeholder="Chercher un client, un signataire, une r\u00e9f\u00e9rence" aria-label="Chercher une pi\u00e8ce" value="' + esc(E.q) + '" oninput="agtPiecesCherche(this.value)">'
    + (k.arefaire ? '<button class="agt-btn agt-inc-court" onclick="agtPiecesDemander()">Demander la signature de la nouvelle version (' + k.arefaire + ')</button>' : '') + '</div>';
  h += '<div class="agt-inc-corps' + (ouvert ? ' avec-fiche' : '') + '">' + (ouvert ? fichePreuve(ouvert, d) : '') + '<div class="agt-tbl-cadre">';
  if (E.onglet === 'deposees') {
    var dep = d.deposees || [];
    h += dep.length ? '<table class="agt-tbl"><thead><tr><th style="padding:8px 12px">Client</th><th style="padding:8px 12px">Pi\u00e8ce</th><th style="padding:8px 12px">D\u00e9pos\u00e9e le</th><th style="padding:8px 12px">Fichier</th><th style="padding:8px 12px"></th></tr></thead><tbody>'
      + dep.map(function (x) { return '<tr><td class="agt-tbl-titre"><span class="agt-tbl-msg">' + esc(x.client) + '</span></td><td>' + esc(x.titre) + '</td><td>' + esc(x.le) + '</td><td>' + esc(x.fichier) + '</td><td><button class="agt-btn agt-inc-court" onclick="agtPieceOuvrir(\'' + _escAttr(x.id) + '\')">Ouvrir</button></td></tr>'; }).join('') + '</tbody></table>'
      : '<div class="agt-inc-vide">Aucune pi\u00e8ce d\u00e9pos\u00e9e. Depuis la fiche compl\u00e8te d\u2019un client : \u00ab + D\u00e9poser une pi\u00e8ce sign\u00e9e \u00bb.</div>';
  } else if (!liste.length) h += '<div class="agt-inc-vide">Rien pour ce filtre.</div>';
  else {
    h += '<table class="agt-tbl"><thead><tr><th style="padding:8px 12px">Client</th><th style="padding:8px 12px">Documents</th><th style="padding:8px 12px">Sign\u00e9 le</th><th style="padding:8px 12px">Signataire</th><th style="padding:8px 12px">R\u00e9f.</th><th style="padding:8px 12px">\u00c9tat</th></tr></thead><tbody>';
    liste.forEach(function (l) {
      h += '<tr class="' + (l.slug === E.ouvert ? 'on' : '') + '" tabindex="0" onclick="agtPiecesOuvrir(\'' + _escAttr(l.slug) + '\')" onkeydown="if(event.key===\'Enter\')agtPiecesOuvrir(\'' + _escAttr(l.slug) + '\')">'
        + '<td class="agt-tbl-titre"><span class="agt-tbl-msg">' + esc(l.nom) + '</span></td><td>' + esc(l.docs || '\u2014') + '</td><td>' + esc(l.signeLe || '\u2014') + '</td><td>' + esc(l.signataire || '\u2014') + '</td><td>' + esc(l.ref || '\u2014') + '</td>'
        + '<td><span class="' + PASTILLE[l.hors ? 'hors' : l.etat] + '">' + esc(l.etatLib) + '</span></td></tr>';
    });
    h += '</tbody></table>';
  }
  return h + '</div></div></div>';
}

// ── Les gestes ────────────────────────────────────────────────────────────────
function rendre() { if (window.agtRenderBody) window.agtRenderBody(); }
window._agtPiecesVue = vue;
window.agtPiecesOnglet = function (o) { E.onglet = o; rendre(); };
window.agtPiecesOuvrir = function (slug) {
  E.ouvert = (slug && E.ouvert !== slug) ? String(slug) : '';
  if (E.ouvert && window._agtFicheCharger) window._agtFicheCharger(E.ouvert);
  if (window._agtOngletCourant && window._agtOngletCourant() !== 'pieces' && window.agtSwitchTab) window.agtSwitchTab('pieces'); else rendre();
};
window.agtPiecesCherche = function (v) {
  E.q = String(v || ''); rendre();
  var i = document.getElementById('agt-pcs-q'); if (i) { i.focus(); try { i.setSelectionRange(E.q.length, E.q.length); } catch (e) { if (window.logError) window.logError({ level: 'info', cat: 'ui', msg: 'curseur de la recherche non pos\u00e9', detail: String((e && e.message) || e) }); } }
};
