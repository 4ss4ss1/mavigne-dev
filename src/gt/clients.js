// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — src/gt/clients.js — L'ÉCRAN CLIENTS DE LA CONSOLE GUERETTECH — GT-UI-3, §518
// ════════════════════════════════════════════════════════════════════════════
// La maquette v1 (docs/maquettes/maquette-console-gt-v1.html, MAQ-1) : les clients en TABLEAU trié par santé — à
// risque d'abord —, des filtres par statut, une recherche, et la fiche du client à côté, à onglets : Ensemble,
// Factures, Incidents, Appareils, Accès, Réglages. Les données du domaine restent en lecture (D1) : on les modifie
// dans la préparation. Le contact de facturation (D5) s'y saisit : il ADRESSE les brouillons de relance, il
// n'envoie rien (Nico, 02/11 : « les relances partent que si je décide de les faire partir »).
// Ce fichier ne lit la console que par `window._agtCliDonnees()` (en lecture) et n'agit que par ses gestes publics.
// ⚠️ Chargé par src/gt.js, sur gt.html seulement.
// ════════════════════════════════════════════════════════════════════════════

export var FILTRES = [['tous', 'Tous'], ['abonnes', 'Abonn\u00e9s'], ['essais', 'Essais'], ['ainstaller', '\u00c0 installer'], ['interne', 'Interne']];
export var ONGLETS_FICHE = [['ensemble', 'Ensemble'], ['factures', 'Factures'], ['incidents', 'Incidents'], ['appareils', 'Appareils'], ['acces', 'Acc\u00e8s'], ['reglages', 'R\u00e9glages']];
var E = { filtre: 'tous', q: '', tri: 'sante', sens: 1, ouvert: '', onglet: 'ensemble' };
// Une valeur posée dans un gestionnaire inline passe par _escAttr (C24b) — celle de l'appli quand elle est chargée.
function _escAttr(v) { return (typeof window !== 'undefined' && window._escAttr) ? window._escAttr(v) : String(v == null ? '' : v).replace(/[\\'"<>&]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
// ★ GT-UI-4 (§519) — les pastilles communes de la charte (.mvpas), comme la maquette.
var ST_COUL = { actif: 'mvpas-type mvpas-vert', essai: 'mvpas-type mvpas-orange', echu: 'mvpas-type mvpas-rouge', pending: 'mvpas-type mvpas-violet', aqualifier: 'mvpas-type mvpas-gris' };
var SANTE_COUL = { risque: 'mvpas-retard', surveiller: 'mvpas-surveiller', bonne: 'mvpas-fait', hors: 'mvpas-afaire' };
function plier(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

// ── Les fonctions pures (le harnais gtui3 les joue) ──────────────────────────
// La santé d'un client et ses raisons : à risque (critique, facture en retard, silence d'un abonné, lecture
// impossible), à surveiller (incident ouvert, plus de sept jours sans connexion, relance d'essai à faire), bonne.
// Interne et à installer : hors santé.
export function santeDe(c, maintenant, silenceJ) {
  if (c.interne) return { cle: 'hors', rang: 3, label: 'Interne', pourquoi: [] };
  if (c.statut === 'pending') return { cle: 'hors', rang: 3, label: '\u00c0 installer', pourquoi: [] };
  var now = maintenant || Date.now(), r = [], s = [];
  var jours = c.derniere ? Math.floor((now - Date.parse(c.derniere)) / 86400000) : null;
  if (c.crit > 0) r.push(c.crit + ' erreur' + (c.crit > 1 ? 's' : '') + ' critique' + (c.crit > 1 ? 's' : ''));
  if (c.retard > 0) r.push(c.retard + ' facture' + (c.retard > 1 ? 's' : '') + ' en retard');
  if (c.statut === 'actif' && jours !== null && jours >= (silenceJ || 14)) r.push('aucune connexion depuis ' + jours + ' j');
  if (c.echecs && c.echecs.length) r.push('lecture impossible');
  if (r.length) return { cle: 'risque', rang: 0, label: '\u00c0 risque', pourquoi: r };
  if (c.incidents > 0) s.push(c.incidents + ' incident' + (c.incidents > 1 ? 's' : '') + ' ouvert' + (c.incidents > 1 ? 's' : ''));
  if (jours !== null && jours >= 7) s.push('aucune connexion depuis ' + jours + ' j');
  if (c.relanceJours >= 0) s.push('relance d\u2019essai \u00e0 faire');
  if (s.length) return { cle: 'surveiller', rang: 1, label: '\u00c0 surveiller', pourquoi: s };
  return { cle: 'bonne', rang: 2, label: 'Bonne', pourquoi: [] };
}
export function filtrer(liste, e) {
  var q = plier(e.q).trim();
  return liste.filter(function (c) {
    if (e.filtre === 'abonnes' && !(c.statut === 'actif' && !c.interne)) return false;
    if (e.filtre === 'essais' && !(c.statut === 'essai' || c.statut === 'echu')) return false;
    if (e.filtre === 'ainstaller' && c.statut !== 'pending') return false;
    if (e.filtre === 'interne' && !c.interne) return false;
    if (q && plier([c.nom, c.slug, (c.contact || {}).nom, (c.contact || {}).email].join(' ')).indexOf(q) < 0) return false;
    return true;
  });
}
export function trier(liste, e, maintenant, silenceJ) {
  var s = e.sens || 1;
  var v = function (c) {
    if (e.tri === 'sante') { var h = santeDe(c, maintenant, silenceJ); return [h.rang, -h.pourquoi.length, -(c.du || 0), plier(c.nom)]; }
    if (e.tri === 'nom') return [plier(c.nom)];
    if (e.tri === 'du') return [-(c.du || 0)];
    if (e.tri === 'incidents') return [-(c.incidents || 0)];
    if (e.tri === 'derniere') return [c.derniere ? -Date.parse(c.derniere) : 0];
    return [0];
  };
  return liste.map(function (c, i) { return { c: c, v: v(c), i: i }; }).sort(function (a, b) {
    for (var j = 0; j < a.v.length; j++) { if (a.v[j] < b.v[j]) return -s; if (a.v[j] > b.v[j]) return s; }
    return a.i - b.i;
  }).map(function (x) { return x.c; });
}
export function compteFiltres(liste) {
  var n = {}; FILTRES.forEach(function (f) { n[f[0]] = filtrer(liste, { filtre: f[0], q: '' }).length; });
  return n;
}

// ── Le dessin ─────────────────────────────────────────────────────────────────
function th(col, lib) {
  var on = E.tri === col, aria = on ? (E.sens > 0 ? 'ascending' : 'descending') : 'none';
  return '<th aria-sort="' + aria + '"><button class="agt-tbl-tri' + (on ? ' on' : '') + '" onclick="agtCliTri(\'' + _escAttr(col) + '\')">' + lib + (on ? (E.sens > 0 ? ' \u2191' : ' \u2193') : '') + '</button></th>';
}
function fiche(c, d) {
  var esc = d.esc, h0 = santeDe(c, null, d.silenceJ), ct = c.contact || {};
  var h = '<aside class="agt-inc-fiche" aria-label="Fiche du client">';
  h += '<div class="agt-inc-fiche-tete"><div class="agt-inc-fiche-sur">' + esc(c.slug) + ' \u00b7 ' + esc(c.statutLabel) + '</div>'
    + '<button class="agt-inc-x" onclick="agtCliOuvrir(\'\')" aria-label="Fermer la fiche">\u00d7</button></div>';
  h += '<h3 class="agt-inc-fiche-titre">' + esc(c.nom) + '</h3>';
  h += '<div class="agt-inc-onglets" role="tablist">' + ONGLETS_FICHE.map(function (o) {
    return '<button role="tab" aria-selected="' + (E.onglet === o[0]) + '" class="agt-inc-onglet' + (E.onglet === o[0] ? ' on' : '') + '" onclick="agtCliOnglet(\'' + _escAttr(o[0]) + '\')">' + o[1] + '</button>';
  }).join('') + '</div>';
  if (E.onglet === 'ensemble') {
    h += '<div class="agt-inc-bloc"><div class="agt-cli-lecture"><span aria-hidden="true">\ud83d\udd12</span><div><b>Les donn\u00e9es du domaine sont en lecture.</b> Parcelles, \u00e9quipe, t\u00e2ches, tracteurs et saisons se modifient sur leurs vrais \u00e9crans, avec leurs r\u00e8gles (renommage, gardes anti-perte).'
      + '<div style="margin-top:8px"><button class="agt-btn fill agt-inc-court" onclick="agtPrepOuvrir(\'' + _escAttr(c.slug) + '\')">Pr\u00e9parer ce domaine</button></div></div></div></div>';
    h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Sant\u00e9</div><div><span class="mvpas mvpas-statut ' + SANTE_COUL[h0.cle] + ' agt-sante ' + h0.cle + '">' + esc(h0.label) + '</span>'
      + (h0.pourquoi.length ? ' \u2014 ' + esc(h0.pourquoi.join(' \u00b7 ')) : '') + '</div></div>';
    h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Rep\u00e8res</div><dl class="agt-inc-dl">'
      + '<dt>Abonnement</dt><dd>' + (c.prix ? esc(d.eur(c.prix)) + ' par mois' : '\u2014') + '</dd>'
      + '<dt>\u00c0 encaisser</dt><dd>' + esc(d.eur(c.du || 0)) + (c.retard ? ' \u00b7 ' + c.retard + ' en retard' : '') + '</dd>'
      + '<dt>Vignoble</dt><dd>' + (c.parcelles == null ? '\u2014' : c.parcelles) + ' parcelles \u00b7 ' + (c.membres == null ? '\u2014' : c.membres) + ' membres</dd>'
      + '<dt>Connexion</dt><dd>' + (c.derniere ? 'il y a ' + esc(d.relTime(c.derniere)) : 'jamais vue') + '</dd></dl></div>';
    h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Contact de facturation</div>'
      + '<p class="agt-cli-note">Il adresse les brouillons de relance. Rien ne part sans votre \u00ab Envoyer \u00bb.</p>'
      + '<div class="agt-cli-contact">'
      + '<input id="agt-cli-ct-nom" class="agt-inc-q" placeholder="Nom" aria-label="Nom du contact" value="' + esc(ct.nom || '') + '">'
      + '<input id="agt-cli-ct-email" class="agt-inc-q" type="email" placeholder="Adresse e-mail" aria-label="Adresse e-mail du contact" value="' + esc(ct.email || '') + '">'
      + '<input id="agt-cli-ct-tel" class="agt-inc-q" type="tel" placeholder="T\u00e9l\u00e9phone" aria-label="T\u00e9l\u00e9phone du contact" value="' + esc(ct.tel || '') + '">'
      + '<button class="agt-btn fill agt-inc-court" onclick="agtCliContact(\'' + _escAttr(c.slug) + '\')">Enregistrer le contact</button></div></div>';
    if (c.relanceJours >= 0) h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Relance d\u2019essai</div><p class="agt-cli-note">Essai \u00e9chu depuis ' + c.relanceJours + ' jours, jamais reconduit. Le brouillon s\u2019ouvre dans votre messagerie' + (ct.email ? ', adress\u00e9 \u00e0 ' + esc(ct.email) : '') + ' ; c\u2019est vous qui l\u2019envoyez.</p>'
      + '<button class="agt-btn fill agt-inc-court" onclick="agtRelanceEssai(\'' + _escAttr(c.slug) + '\')">Pr\u00e9parer la relance</button></div>';
    var chr = (d.chronologie ? d.chronologie(c.slug) : []) || [];
    if (chr.length) h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Chronologie</div><ul class="agt-chrono">' + chr.map(function (x) {
      return '<li class="' + esc(x.type) + '"><span><b>' + esc(x.titre) + '</b><time>' + esc(d.dateFr ? d.dateFr(x.quand) : x.quand) + '</time></span></li>';
    }).join('') + '</ul></div>';
    h += '<div class="agt-inc-actions"><button class="agt-btn fill agt-inc-court" onclick="agtPrepOuvrir(\'' + _escAttr(c.slug) + '\')">Pr\u00e9parer ce domaine</button>'
      + '<button class="agt-btn agt-inc-court" onclick="agtFicheOuvrir(\'' + _escAttr(c.slug) + '\')">Fiche compl\u00e8te</button>'   /* ★ FICHE-1 : la fiche complète en pleine page */
      + '<button class="agt-btn agt-inc-court" onclick="copyTenantLink(\'' + _escAttr(c.slug) + '\',this)">Copier le lien d\u2019invitation</button></div>';
  } else if (E.onglet === 'reglages') {
    h += '<div class="agt-inc-bloc"><p class="agt-cli-note">Les donn\u00e9es du domaine se lisent ici et se modifient dans la pr\u00e9paration (D1).</p><div class="agt-inc-actions">'
      + [['agtShowMembres', 'Membres'], ['agtShowParcelles', 'Parcelles'], ['agtShowJournal', 'Journal'], ['agtShowErreurs', 'Erreurs'], ['agtFicheOuvrir', 'Fiche compl\u00e8te'], ['agtShowFiche', 'Formule, essai et statut']].map(function (a) {
        return '<button class="agt-btn agt-inc-court" onclick="' + a[0] + '(\'' + _escAttr(c.slug) + '\')">' + a[1] + '</button>';
      }).join('') + '</div></div>'
      + '<div class="agt-inc-bloc"><button class="agt-btn agt-inc-court agt-cli-danger" onclick="agtDeleteTenant(\'' + _escAttr(c.slug) + '\')">Supprimer le domaine</button></div>';
  } else {
    h += '<div class="agt-inc-bloc">' + d.panneau(c.slug, E.onglet) + '</div>';   // ★ GT-UI-7 : ces blocs sont passés sur la charte
    if (E.onglet === 'incidents') h += '<button class="agt-btn agt-inc-court" onclick="agtIncVoirClient(\'' + _escAttr(c.slug) + '\')">Voir dans Incidents</button>';
  }
  return h + '</aside>';
}
export function vue(d) {
  var esc = d.esc, tout = d.clients || [];
  var n = compteFiltres(tout), liste = trier(filtrer(tout, E), E, null, d.silenceJ);
  var ouvert = E.ouvert ? tout.filter(function (c) { return c.slug === E.ouvert; })[0] : null;
  var h = '<div class="agt-inc">';
  // ★ GT-UI-4 : « Installer un domaine » et « Nouveau client » passent dans l'en-tête de l'écran (la maquette).
  h += '<div class="agt-inc-onglets" role="tablist">' + FILTRES.map(function (f) {
    return '<button role="tab" aria-selected="' + (E.filtre === f[0]) + '" class="agt-inc-onglet' + (E.filtre === f[0] ? ' on' : '') + '" onclick="agtCliFiltre(\'' + _escAttr(f[0]) + '\')">' + f[1] + ' <span>' + n[f[0]] + '</span></button>';
  }).join('') + '</div>';
  h += '<div class="agt-inc-outils"><input id="agt-cli-q" class="agt-inc-q" type="search" placeholder="Chercher un domaine, un slug, un contact" aria-label="Chercher un client" value="' + esc(E.q) + '" oninput="agtCliCherche(this.value)"></div>';
  h += '<div class="agt-inc-corps' + (ouvert ? ' avec-fiche' : '') + '">';
  if (ouvert) h += fiche(ouvert, d);
  h += '<div class="agt-tbl-cadre">';
  if (!liste.length) h += '<div class="agt-inc-vide">Aucun client pour ce filtre.</div>';
  else {
    h += '<table class="agt-tbl"><thead><tr>' + th('nom', 'Domaine') + '<th>Statut</th>' + th('du', '\u00c0 encaisser') + th('sante', 'Sant\u00e9') + th('incidents', 'Incidents') + th('derniere', 'Connexion') + '</tr></thead><tbody>';
    liste.forEach(function (c) {
      var s = santeDe(c, null, d.silenceJ);
      h += '<tr class="' + (c.slug === E.ouvert ? 'on' : '') + '" tabindex="0" onclick="agtCliOuvrir(\'' + _escAttr(c.slug) + '\')" onkeydown="if(event.key===\'Enter\')agtCliOuvrir(\'' + _escAttr(c.slug) + '\')">'
        + '<td class="agt-tbl-titre"><span class="agt-tbl-msg">' + esc(c.nom) + '</span><span class="agt-tbl-sous">' + esc(c.slug) + ((c.contact || {}).nom ? ' \u00b7 ' + esc(c.contact.nom) : '') + '</span></td>'
        + '<td><span class="mvpas ' + (c.interne ? 'mvpas-etiquette' : (ST_COUL[c.statut] || 'mvpas-etiquette')) + '">' + esc(c.statutLabel) + '</span></td>'
        + '<td class="agt-tbl-n">' + (c.du ? esc(d.eur(c.du)) : '\u2014') + '</td>'
        + '<td><span class="mvpas mvpas-statut ' + SANTE_COUL[s.cle] + ' agt-sante ' + s.cle + '">' + esc(s.label) + '</span>' + (s.pourquoi.length ? '<span class="agt-tbl-sous">' + esc(s.pourquoi.join(' \u00b7 ')) + '</span>' : '') + '</td>'
        + '<td class="agt-tbl-n">' + (c.incidents || '\u2014') + '</td>'
        + '<td>' + (c.derniere ? esc(d.relTime(c.derniere)) : 'jamais') + '</td></tr>';
    });
    h += '</tbody></table>';
  }
  return h + '</div></div></div>';
}

// ── Les gestes de l'écran ─────────────────────────────────────────────────────
function rendre() { if (window.agtRenderBody) window.agtRenderBody(); }
window._agtClientsVue = vue;
window.agtCliFiltre = function (f) { E.filtre = f; rendre(); };
window.agtCliTri = function (col) { if (E.tri === col) E.sens = -E.sens; else { E.tri = col; E.sens = 1; } rendre(); };
window.agtCliOnglet = function (o) { E.onglet = o; rendre(); };
// Ouvre (ou ferme) la fiche d'un client — depuis le tableau, le Radar (« Fiche ») ou un lien direct.
window.agtCliOuvrir = function (slug) {
  E.ouvert = (slug && E.ouvert !== slug) ? String(slug) : ''; E.onglet = 'ensemble';
  if (window._agtOngletCourant && window._agtOngletCourant() !== 'clients' && window.agtSwitchTab) window.agtSwitchTab('clients'); else rendre();
};
window.agtCliCherche = function (v) {
  E.q = String(v || ''); rendre();
  var i = document.getElementById('agt-cli-q'); if (i) { i.focus(); try { i.setSelectionRange(E.q.length, E.q.length); } catch (e) { if (window.logError) window.logError({ level: 'info', cat: 'ui', msg: 'curseur de la recherche non pos\u00e9', detail: String((e && e.message) || e) }); } }
};
window.agtCliContact = function (slug) {
  var v = function (id) { var x = document.getElementById(id); return x ? x.value : ''; };
  if (window.agtCliContactEnregistrer) window.agtCliContactEnregistrer(slug, { nom: v('agt-cli-ct-nom'), email: v('agt-cli-ct-email'), tel: v('agt-cli-ct-tel') });
};
