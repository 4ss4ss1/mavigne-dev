// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — src/gt/fiche.js — LA FICHE COMPLÈTE D'UN CLIENT (console GUERETTECH) — FICHE-1, §530
// ════════════════════════════════════════════════════════════════════════════
// La maquette docs/maquettes/maquette-fiche-client-v1.html, écran 1 (Nico, 05/11 : « je veux que ça corresponde
// parfaitement à la maquette ») : en pleine page, depuis la fiche courte du tableau (« Fiche complète ») ou par
// #clients/<slug>/fiche. Identité (tirée de la preuve d'acceptation), contact, contrat, facturation ; à droite la
// signature (preuve et historique), les pièces (textes signés, reçu, pièces déposées) et la chronologie.
// Ce fichier ne lit la console que par `window._agtFicheDonnees(slug)` et n'agit que par ses gestes publics.
// ⚠️ Chargé par src/gt.js, sur gt.html seulement.
// ════════════════════════════════════════════════════════════════════════════

var E = { slug: '' };
function _escAttr(v) { return (typeof window !== 'undefined' && window._escAttr) ? window._escAttr(v) : String(v == null ? '' : v).replace(/[\\'"<>&]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

// ── Les fonctions pures (le harnais fiche1 les joue) ─────────────────────────
// Les lignes « terme / valeur » d'une carte : une valeur vide se dit « — », jamais une case blanche.
export function lignes(paires, esc) {
  return '<dl class="agt-inc-dl">' + paires.map(function (p) { return '<dt>' + esc(p[0]) + '</dt><dd>' + (p[2] ? p[1] : esc(p[1] == null || p[1] === '' ? '\u2014' : p[1])) + '</dd>'; }).join('') + '</dl>';
}
function carte(titre, corps, action) {
  return '<section class="mvcarte-fond agt-carte"><div class="agt-carte-tete"><h2 class="agt-carte-titre">' + titre + '</h2>' + (action || '') + '</div><div class="agt-carte-corps">' + corps + '</div></section>';
}
function bouton(lib, geste, plein) { return '<button class="agt-btn' + (plein ? ' fill' : '') + ' agt-inc-court" onclick="' + geste + '">' + lib + '</button>'; }

export function vue(f) {
  if (!f) return '<div class="agt-inc"><div class="agt-inc-vide">Ce domaine n\u2019existe plus dans la console.</div></div>';
  var esc = f.esc, s = f.signature || {}, p = s.preuve, slug = _escAttr(f.slug);
  var pills = '<span class="mvpas ' + f.statut.classe + '">' + esc(f.statut.label) + '</span>'
    + '<span class="mvpas mvpas-statut ' + (s.etat === 'ajour' ? 'mvpas-fait">Signature \u00e0 jour' : (s.etat === 'depassee' ? 'mvpas-retard">Signature \u00e0 refaire' : 'mvpas-surveiller">Jamais sign\u00e9')) + '</span>'
    + (f.facturation.nRetard ? '<span class="mvpas mvpas-statut mvpas-retard">' + f.facturation.nRetard + ' facture' + (f.facturation.nRetard > 1 ? 's' : '') + ' en retard</span>' : '');
  var h = '<div class="agt-inc agt-fc">';
  h += '<div class="agt-fc-bandeau"><div><div class="agt-inc-fiche-sur">' + esc(f.slug) + (f.debut ? ' \u00b7 client depuis le ' + esc(f.dateFr(f.debut)) : '') + '</div><h2 class="agt-fc-nom">' + esc(f.nom) + '</h2>'
    + '<div class="agt-cli-note" style="margin:0">' + esc([f.identite.raison_sociale, f.identite.siret ? 'SIRET ' + f.identite.siret : ''].filter(Boolean).join(' \u00b7 ') || 'raison sociale et SIRET : pas encore de preuve d\u2019acceptation') + '</div></div>'
    + '<div class="agt-inc-outils" style="margin:0">' + pills + bouton('Copier le lien', "copyTenantLink('" + slug + "',this)") + (f.facturation.nRetard ? bouton('Relancer', "agtFicheRelancer('" + slug + "')") : '') + bouton('Pr\u00e9parer ce domaine', "agtPrepOuvrir('" + slug + "')", true) + '</div></div>';
  h += '<div class="agt-fc-grille"><div class="agt-fc-col">';
  h += carte('Identit\u00e9', lignes([['Raison sociale', f.identite.raison_sociale], ['SIRET', f.identite.siret], ['Adresse', f.identite.adresse], ['Vignoble', f.identite.vignoble], ['Source', p ? 'la preuve d\u2019acceptation (saisie par le signataire)' : 'aucune preuve d\u2019acceptation pour l\u2019instant']], esc));
  var c = f.contact || {};
  h += carte('Contact de facturation', lignes([['Nom', c.nom], ['Adresse', c.email], ['T\u00e9l\u00e9phone', c.tel]], esc) + '<p class="agt-cli-note">Il adresse les brouillons de relance ; rien ne part sans votre \u00ab Envoyer \u00bb.</p>', bouton('Modifier', "agtCliOuvrir('" + slug + "')"));
  var k = f.contrat;
  h += carte('Contrat', lignes([['Formule', k.formule], ['Tarif', k.tarif], ['D\u00e9but du contrat', k.debut], ['Essai', k.essai], ['Prochain renouvellement', k.prochain ? '<b>' + esc(k.prochain) + '</b>' + (k.prochainMontant ? ' \u00b7 ' + esc(k.prochainMontant) : '') : '\u2014', true], ['R\u00e9siliation', k.resiliation]], esc), bouton('Tarif et p\u00e9riodicit\u00e9', 'agtBizAbo(' + f.i + ')'));
  var b = f.facturation;
  h += carte('Facturation', lignes([['\u00c0 encaisser', b.du], ['Encaiss\u00e9 en ' + b.an, b.encAn], ['Derni\u00e8re facture', b.derniere]], esc)
    + '<div class="agt-inc-outils" style="margin-top:8px">' + bouton('Voir les factures', "agtFacClient('" + slug + "');agtSwitchTab('business')") + bouton('Relev\u00e9 du client', 'agtBizReleve(' + f.i + ')') + '</div>');
  h += '</div><div class="agt-fc-col">';
  var sig;
  if (p) {
    sig = '<div class="agt-cli-lecture" style="margin-bottom:12px"><svg class="mv-ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#ic-bouclier"></use></svg><div><b>Conditions g\u00e9n\u00e9rales v' + esc(s.cgv) + ' et accord de traitement v' + esc(s.dpa) + ', accept\u00e9s</b> le ' + esc(s.quand) + ' (heure du serveur) par <b>' + esc(s.signataire) + '</b>. '
      + (s.etat === 'ajour' ? 'Ce sont les versions en vigueur.' : 'Versions d\u00e9pass\u00e9es : en vigueur, CG ' + esc(f.versions.cgv) + ' et accord ' + esc(f.versions.dpa) + '.') + '</div></div>'
      + lignes([['R\u00e9f\u00e9rence', p.ref], ['Empreinte des CG', 'SHA-256 ' + s.hcgv + ' \u00b7 recalcul\u00e9e par le serveur sur le texte servi'], ['Empreinte de l\u2019accord', 'SHA-256 ' + s.hdpa], ['Re\u00e7u', s.recu], ['Trace', s.trace]], esc)
      + '<div class="agt-inc-h4" style="margin-top:12px">Historique</div>' + (s.hist ? '<ul class="agt-chrono">' + s.hist.map(function (x) { return '<li class="' + (x.type === 'preuve' ? 'facture' : '') + '"><span><b>' + esc(x.titre) + '</b><time>' + esc(x.sous) + '</time></span></li>'; }).join('') + '</ul>'
        : '<p class="agt-cli-note">' + (s.histKo ? 'Lecture de l\u2019historique impossible.' : 'Chargement de l\u2019historique\u2026') + '</p>');
  } else {
    sig = '<p class="agt-cli-note">Aucune preuve d\u2019acceptation : le domaine accepte les conditions g\u00e9n\u00e9rales et l\u2019accord de traitement \u00e0 sa premi\u00e8re connexion d\u2019administrateur.</p>';
  }
  h += carte('Signature', sig, p ? bouton('Ouvrir la preuve', "agtPiecesOuvrir('" + slug + "')") : '');
  h += carte('Pi\u00e8ces', '<ul class="agt-fc-pieces">' + (f.pieces || []).map(function (x) {
    return '<li><svg class="mv-ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#ic-' + x.icone + '"></use></svg><span><b>' + esc(x.titre) + '</b>' + (x.sous ? ' ' + esc(x.sous) : '') + '</span>' + (x.geste ? bouton('Ouvrir', x.geste) : '') + '</li>';
  }).join('') + '</ul>' + (f.pieces && f.pieces.length ? '' : '<p class="agt-cli-note">Aucune pi\u00e8ce pour l\u2019instant.</p>')
    + '<div class="agt-inc-outils" style="margin-top:8px">' + bouton('+ D\u00e9poser une pi\u00e8ce sign\u00e9e', "agtPieceChoisir('" + slug + "')") + '</div>');
  var ch = f.chronologie || [];
  h += carte('Chronologie', ch.length ? '<ul class="agt-chrono">' + ch.map(function (x) { return '<li class="' + esc(x.type) + '"><span><b>' + esc(x.titre) + '</b><time>' + esc(f.dateFr(x.quand)) + '</time></span></li>'; }).join('') + '</ul>' : '<p class="agt-cli-note">Rien encore.</p>');
  return h + '</div></div></div>';
}

// ── Les gestes ────────────────────────────────────────────────────────────────
function rendre() { if (window.agtRenderBody) window.agtRenderBody(); }
window._agtFicheVue = vue;
window._agtFicheCourante = function () { return E.slug; };
window.agtFicheOuvrir = function (slug) {
  var s = String(slug || '');
  // D'abord l'onglet Clients (son changement referme une fiche ouverte), puis la fiche demandée.
  if (window._agtOngletCourant && window._agtOngletCourant() !== 'clients' && window.agtSwitchTab) window.agtSwitchTab('clients');
  E.slug = s;
  if (window._agtFicheCharger) window._agtFicheCharger(s);
  rendre();
  if (window._agtRouteNoter) window._agtRouteNoter('clients', s + '/fiche');
};
window._agtFicheReset = function () { E.slug = ''; };
window.agtFicheFermer = function () { E.slug = ''; rendre(); if (window._agtRouteNoter) window._agtRouteNoter('clients'); };
