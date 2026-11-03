// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — src/gt/facturation.js — L'ÉCRAN FACTURATION DE LA CONSOLE GUERETTECH — GT-UI-5, §520
// ════════════════════════════════════════════════════════════════════════════
// La maquette v1 (docs/maquettes/maquette-console-gt-v1.html, MAQ-1) : quatre chiffres, les encaissements de
// l'année en barres (à la date de paiement — celle qu'on déclare — ou à la date de facture), toutes les factures en
// tableau (filtres, client, recherche, tri), et la fiche d'une facture à côté : ses montants (l'avoir déduit), le
// paiement saisi sur place (date réelle et mode, GTFIX-3), la relance en aperçu — un BROUILLON, jamais envoyé seul
// (GT-UI-3). « Nouvelle facture » ouvre le formulaire dans la même fiche.
// L'argent ne se calcule PAS ici : tout vient de la console (`window._agtFacDonnees()`, le moteur de GTFIX-3), et les
// gestes sont les siens (_agtPaieValider, _agtPaieAnnuler, agtBizRelance, agtFactAdd, agtBizTy, agtFactDel…).
// ⚠️ Chargé par src/gt.js, sur gt.html seulement.
// ════════════════════════════════════════════════════════════════════════════

export var FILTRES = [['toutes', 'Toutes'], ['aencaisser', '\u00c0 encaisser'], ['retard', 'En retard'], ['payees', 'Pay\u00e9es'], ['avoirs', 'Avoirs']];
var MOIS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
var E = { filtre: 'toutes', client: '', q: '', tri: 'date', sens: 1, ouvert: '', mode: 'paiement', nouvelle: -2 };
// Une valeur posée dans un gestionnaire inline passe par _escAttr (C24b) — celle de l'appli quand elle est chargée.
function _escAttr(v) { return (typeof window !== 'undefined' && window._escAttr) ? window._escAttr(v) : String(v == null ? '' : v).replace(/[\\'"<>&]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
function plier(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

// ── Les fonctions pures (le harnais gtui5 les joue) ──────────────────────────
// La pastille d'une ligne : un avoir est « appliqué » ; une facture payée l'est ; soldée par un avoir ; en retard
// (avec ses jours) ; sinon à encaisser.
export function pastille(f) {
  if (f.type === 'geste') return { cle: 'avoir', label: 'Avoir appliqu\u00e9', classe: 'mvpas mvpas-etiquette' };
  if (f.statut === 'payee') return { cle: 'payee', label: 'Pay\u00e9e', classe: 'mvpas mvpas-statut mvpas-fait' };
  if (!(f.reste > 0)) return { cle: 'soldee', label: 'Sold\u00e9e', classe: 'mvpas mvpas-statut mvpas-fait' };
  if (f.retardJ > 0) return { cle: 'retard', label: 'En retard de ' + f.retardJ + ' j', classe: 'mvpas mvpas-statut mvpas-retard' };
  return { cle: 'aencaisser', label: '\u00c0 encaisser', classe: 'mvpas mvpas-statut mvpas-surveiller' };
}
export function filtrer(liste, e) {
  var q = plier(e.q).trim();
  return liste.filter(function (f) {
    var p = pastille(f).cle;
    if (e.filtre === 'aencaisser' && !(p === 'aencaisser' || p === 'retard')) return false;
    if (e.filtre === 'retard' && p !== 'retard') return false;
    if (e.filtre === 'payees' && p !== 'payee') return false;
    if (e.filtre === 'avoirs' && p !== 'avoir') return false;
    if (e.client && f.slug !== e.client) return false;
    if (q && plier([f.ref, f.client, f.libelle, f.typeLbl].join(' ')).indexOf(q) < 0) return false;
    return true;
  });
}
export function trier(liste, e) {
  var s = e.sens || 1;
  var v = function (f) {
    if (e.tri === 'date') return [-(Date.parse(f.date) || 0), String(f.ref)];
    if (e.tri === 'ref') return [String(f.ref)];
    if (e.tri === 'client') return [plier(f.client)];
    if (e.tri === 'montant') return [-(f.montant || 0)];
    if (e.tri === 'reste') return [-(f.type === 'geste' ? 0 : (f.reste || 0))];
    return [0];
  };
  return liste.map(function (f, i) { return { f: f, v: v(f), i: i }; }).sort(function (a, b) {
    for (var j = 0; j < a.v.length; j++) { if (a.v[j] < b.v[j]) return -s; if (a.v[j] > b.v[j]) return s; }
    return a.i - b.i;
  }).map(function (x) { return x.f; });
}
// La hauteur d'une barre, en pour cent du plus haut mois (un mois à zéro garde un trait).
export function hauteurs(valeurs) {
  var max = Math.max.apply(null, (valeurs || []).concat([0]));
  return (valeurs || []).map(function (v) { return v > 0 && max > 0 ? Math.max(4, Math.round(v / max * 100)) : 0; });
}

// ── Le dessin ─────────────────────────────────────────────────────────────────
function th(col, lib, num) {
  var on = E.tri === col, aria = on ? (E.sens > 0 ? 'ascending' : 'descending') : 'none';
  return '<th aria-sort="' + aria + '"' + (num ? ' style="text-align:right"' : '') + '><button class="agt-tbl-tri' + (on ? ' on' : '') + '"' + (num ? ' style="text-align:right"' : '') + ' onclick="agtFacTri(\'' + _escAttr(col) + '\')">' + lib + (on ? (E.sens > 0 ? ' \u25be' : ' \u25b4') : '') + '</button></th>';
}
function cle(f) { return f.i + ':' + f.k; }
function ficheFacture(f, d) {
  var esc = d.esc, eur = d.eur, p = pastille(f), avoirs = d.avoirsDe(f.slug, f.ref);
  var h = '<aside class="agt-inc-fiche" aria-label="Fiche de la facture">';
  h += '<div class="agt-inc-fiche-tete"><div class="agt-inc-fiche-sur">' + esc(f.typeLbl) + ' \u00b7 ' + esc(f.client) + '</div>'
    + '<button class="agt-inc-x" onclick="agtFacOuvrir(\'\')" aria-label="Fermer la fiche">\u00d7</button></div>';
  h += '<h3 class="agt-inc-fiche-titre">' + esc(f.ref) + '</h3>';
  h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Montants</div><dl class="agt-inc-dl">'
    + '<dt>Objet</dt><dd>' + esc(f.libelle || '\u2014') + '</dd>'
    + '<dt>' + (f.type === 'geste' ? 'Avoir' : 'Factur\u00e9') + '</dt><dd>' + esc(eur(f.montant)) + '</dd>';
  if (f.type !== 'geste') {
    if (avoirs) h += '<dt>Avoir</dt><dd>' + esc(eur(avoirs)) + '</dd>';
    h += '<dt>Net</dt><dd><b>' + esc(eur((f.montant || 0) + (avoirs || 0))) + '</b></dd>';
    h += '<dt>Reste d\u00fb</dt><dd>' + (f.reste > 0 ? '<b>' + esc(eur(f.reste)) + '</b>' : '\u2014') + '</dd>';
  }
  h += '<dt>Statut</dt><dd><span class="' + p.classe + '">' + esc(p.label) + '</span></dd>'
    + '<dt>\u00c9mise le</dt><dd>' + esc(d.dateFr(f.date)) + '</dd>'
    + (f.echeance ? '<dt>\u00c9ch\u00e9ance</dt><dd>' + esc(d.dateFr(f.echeance)) + '</dd>' : '')
    + (f.payeLe ? '<dt>Pay\u00e9e le</dt><dd>' + esc(d.dateFr(f.payeLe)) + (f.modeLbl ? ' \u00b7 ' + esc(f.modeLbl) : '') + '</dd>' : '')
    + '</dl></div>';
  if (f.type !== 'geste' && !f.supprime) {
    var paye = f.statut === 'payee';
    h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">' + (paye ? 'Le paiement' : 'Enregistrer le paiement') + '</div>'
      + '<div class="agt-fac-champs"><label>Re\u00e7u le <input id="agt-paie-date" class="agt-inc-sel" type="date" max="' + esc(d.aujourdhui) + '" value="' + esc(f.payeLe || d.aujourdhui) + '"></label>'
      + '<label>Mode <select id="agt-paie-mode" class="agt-inc-sel">' + Object.keys(d.modes).map(function (m) {
        return '<option value="' + esc(m) + '"' + ((f.mode || 'virement') === m ? ' selected' : '') + '>' + esc(d.modes[m]) + '</option>';
      }).join('') + '</select></label></div>'
      + '<div id="agt-paie-err" class="agt-cli-note" style="display:none"></div>'
      + '<div class="agt-inc-outils"><button class="agt-btn fill agt-inc-court" onclick="_agtPaieValider(' + f.i + ',' + f.k + ')">'
      + (paye ? 'Corriger le paiement' : 'Enregistrer le paiement de ' + esc(eur(f.reste))) + '</button>'
      + (paye ? '<button class="agt-btn agt-inc-court" onclick="_agtPaieAnnuler(' + f.i + ',' + f.k + ')">Annuler le paiement</button>' : '') + '</div></div>';
    if (f.reste > 0) {
      var r = d.relance(f.i, f.k) || {};
      h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Relance</div><pre class="agt-fac-relance">' + esc(r.txt || '') + '</pre>'
        + '<div class="agt-inc-outils"><button class="agt-btn agt-inc-court" onclick="agtBizRelance(' + f.i + ',' + f.k + ')">Pr\u00e9parer la relance</button></div>'
        + '<p class="agt-cli-note">Un brouillon s\u2019ouvre dans votre messagerie' + (r.dest ? ', adress\u00e9 \u00e0 ' + esc(r.dest) : ' (aucun contact de facturation : renseignez-le dans la fiche du client)') + ' ; rien ne part sans votre \u00ab Envoyer \u00bb. Le montant r\u00e9clam\u00e9 est le reste d\u00fb, avoir d\u00e9duit.</p></div>';
    }
  }
  if (f.type === 'geste' && !f.supprime) {
    var cs = (d.cibles ? d.cibles(f.slug) : []) || [];
    h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Rattacher cette remise</div>'
      + (cs.length ? '<select class="agt-inc-sel" aria-label="Rattacher \u00e0 une facture" onchange="agtBizRattache(' + f.i + ',' + f.k + ',this.value)"><option value="">\u2192 Rattacher \u00e0\u2026</option>'
        + cs.map(function (c) { return '<option value="' + esc(c.k) + '">' + esc(c.ref) + ' \u00b7 ' + esc(String(c.lib || '').slice(0, 38)) + ' \u00b7 ' + esc(c.montant) + ' \u20ac</option>'; }).join('') + '</select>'
        : '<p class="agt-cli-note">Aucune facture \u00e0 laquelle rattacher cette remise.</p>') + '</div>';
  }
  if (f.supprime) return h + '<p class="agt-cli-note">Domaine supprim\u00e9 : sa facture reste dans les totaux et le livre des recettes (GT-B10), sans geste possible ici.</p></aside>';
  h += '<div class="agt-inc-actions">'
    + (f.type === 'abo' ? '<button class="agt-btn agt-inc-court" onclick="agtBizPer(' + f.i + ',' + f.k + ')">' + (f.per === 'annuel' ? 'Passer en mensuel' : 'Passer en annuel') + '</button>' : '')
    + '<button class="agt-btn agt-inc-court" onclick="agtBizRecap(' + f.i + ',' + f.k + ')">R\u00e9capitulatif</button>'
    + '<button class="agt-btn agt-inc-court" onclick="agtBizReleve(' + f.i + ')">Relev\u00e9 du client</button>'
    + '<button class="agt-btn agt-inc-court" onclick="agtBizAbo(' + f.i + ')">Tarif mensuel du client</button>'
    + '<button class="agt-btn agt-inc-court" onclick="agtBizInterne(' + f.i + ')">' + (f.interne ? 'Compter dans les totaux' : 'Sortir des totaux (interne)') + '</button>'
    + '<button class="agt-btn agt-inc-court" onclick="agtCliOuvrir(\'' + _escAttr(f.slug) + '\')">Fiche du client</button>'
    + '<button class="agt-btn agt-inc-court agt-cli-danger" onclick="agtFactDel(' + f.i + ',' + f.k + ')">' + (d.arme === f.slug + ':' + f.k ? 'Confirmer la suppression' : 'Supprimer') + '</button></div>';
  return h + '</aside>';
}
function ficheNouvelle(d) {
  var esc = d.esc, i = E.nouvelle, c = (d.clients || []).filter(function (x) { return x.i === i; })[0];
  var h = '<aside class="agt-inc-fiche" aria-label="Nouvelle facture">';
  h += '<div class="agt-inc-fiche-tete"><div class="agt-inc-fiche-sur">Num\u00e9rotation continue \u00b7 prochaine ' + esc(d.prochaine) + '</div>'
    + '<button class="agt-inc-x" onclick="agtFacNouvelle(-2)" aria-label="Fermer">\u00d7</button></div>';
  h += '<h3 class="agt-inc-fiche-titre">Nouvelle facture</h3>';
  h += '<div class="agt-inc-bloc"><label class="agt-fac-lbl">Client <select class="agt-inc-sel" onchange="agtFacNouvelle(this.value)"><option value="-1">Choisir un client\u2026</option>'
    + (d.clients || []).map(function (x) { return '<option value="' + x.i + '"' + (x.i === i ? ' selected' : '') + '>' + esc(x.nom) + '</option>'; }).join('') + '</select></label></div>';
  if (c) {
    h += '<div class="agt-inc-bloc"><div id="agt-biz-sg' + i + '" class="agt-inc-outils">' + d.types.map(function (t) {
      return '<button data-t="' + esc(t[0]) + '" class="mvpas mvpas-filtre' + (c.ty === t[0] ? ' on' : '') + '" onclick="agtBizTy(' + i + ',\'' + _escAttr(t[0]) + '\')">' + esc(t[1]) + '</button>';
    }).join('') + '</div>'
      + '<div class="agt-fac-form">'
      + '<label id="agt-biz-rw' + i + '">R\u00e9f\u00e9rence <input id="agt-biz-ref' + i + '" class="agt-inc-q"></label>'
      + '<label>Date <input id="agt-biz-dat' + i + '" type="date" class="agt-inc-q"></label>'
      + '<label>\u00c9ch\u00e9ance <input id="agt-biz-ech' + i + '" type="date" class="agt-inc-q"></label>'
      + '<label>P\u00e9riodicit\u00e9 (abonnement) <select id="agt-biz-per' + i + '" class="agt-inc-sel"><option value="mensuel">Mensuel</option><option value="annuel">Annuel (12 mois)</option></select></label>'
      + '<label>Montant HT <input id="agt-biz-mnt' + i + '" type="number" step="0.01" class="agt-inc-q"></label>'
      + '<div id="agt-biz-cw' + i + '" style="display:none"><span class="agt-fac-lbl">S\u2019applique \u00e0</span>' + d.cible(i) + '</div>'
      + '<label class="agt-fac-large">Libell\u00e9 <input id="agt-biz-lib' + i + '" class="agt-inc-q"></label>'
      + '<div id="agt-biz-hint' + i + '" class="agt-cli-note agt-fac-large"></div></div>'
      + '<div class="agt-inc-outils"><button class="agt-btn fill agt-inc-court" onclick="agtFactAdd(' + i + ')">Enregistrer la facture</button></div></div>';
  }
  return h + '</aside>';
}
export function vue(d) {
  var esc = d.esc, eur = d.eur, tout = d.factures || [], k = d.kpis || {};
  var liste = trier(filtrer(tout, E), E);
  var ouvert = E.ouvert ? tout.filter(function (f) { return cle(f) === E.ouvert; })[0] : null;
  var mois = (E.mode === 'facture' ? d.moisFacture : d.moisPaiement) || [], hs = hauteurs(mois);
  var kpi = function (l, v, s, alerte) { return '<div class="mvcarte-fond agt-kpi"><div class="agt-kpi-l">' + l + '</div><div class="agt-kpi-v">' + v + '</div><div class="agt-kpi-s' + (alerte ? ' alerte' : '') + '">' + s + '</div></div>'; };
  var h = '<div class="agt-inc agt-fac"><div class="agt-kpis">'
    + kpi('Revenu mensuel', esc(eur(k.mrr || 0)), 'abonn\u00e9s, l\u2019annuel divis\u00e9 par douze', false)
    + kpi('Encaiss\u00e9 en ' + esc(d.an), esc(eur(mois.reduce(function (a, b) { return a + b; }, 0))), E.mode === 'facture' ? 'rang\u00e9 \u00e0 la date de facture' : 'rang\u00e9 \u00e0 la date de paiement', false)
    + kpi('\u00c0 encaisser', esc(eur(k.du || 0)), k.retard ? ('dont ' + esc(eur(k.retard)) + ' en retard, avoirs d\u00e9duits') : 'rien en retard', k.retard > 0)
    + kpi('\u00c9ch\u00e9ances \u00e0 30 jours', esc(eur(k.ech30 || 0)), 'hors retards', false) + '</div>';
  h += '<section class="mvcarte-fond agt-carte" style="margin-bottom:16px"><div class="agt-carte-tete"><h2 class="agt-carte-titre">Encaissements ' + esc(d.an) + '</h2><div class="agt-inc-outils" style="margin:0">'
    + (d.annees.length > 1 ? '<select class="agt-inc-sel" aria-label="Ann\u00e9e" onchange="agtBizSetAn(Number(this.value))">' + d.annees.map(function (a) { return '<option value="' + a + '"' + (a === d.an ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select>' : '')
    + [['paiement', 'Date de paiement'], ['facture', 'Date de facture']].map(function (m) {
      return '<button class="mvpas mvpas-filtre' + (E.mode === m[0] ? ' on' : '') + '" aria-pressed="' + (E.mode === m[0]) + '" onclick="agtFacMode(\'' + _escAttr(m[0]) + '\')">' + m[1] + '</button>';
    }).join('') + '</div></div><div class="agt-carte-corps"><div class="agt-fac-barres" role="img" aria-label="Encaissements par mois">'
    + mois.map(function (v, i) {
      return '<div class="agt-fac-mois"><span class="agt-fac-val">' + (v ? esc(d.nombre(v)) : '') + '</span><span class="agt-fac-barre' + (v ? '' : ' zero') + '" style="height:' + (hs[i] || 1) + '%"></span><span class="agt-fac-m">' + MOIS[i] + '</span></div>';
    }).join('') + '</div><p class="agt-cli-note" style="margin-top:8px">'
    + (E.mode === 'facture' ? 'L\u2019ancien rangement : un paiement tardif tombe au mois de la facture, pas au mois o\u00f9 l\u2019argent arrive.' : 'Le chiffre \u00e0 d\u00e9clarer : le livre des recettes suit la date o\u00f9 l\u2019argent arrive.')
    + '</p></div></section>';
  h += '<div class="agt-inc-outils"><input id="agt-fac-q" class="agt-inc-q" type="search" placeholder="Chercher un n\u00b0, un client, un libell\u00e9" aria-label="Chercher une facture" value="' + esc(E.q) + '" oninput="agtFacCherche(this.value)">'
    + FILTRES.map(function (f) { return '<button class="mvpas mvpas-filtre' + (E.filtre === f[0] ? ' on' : '') + '" aria-pressed="' + (E.filtre === f[0]) + '" onclick="agtFacFiltre(\'' + _escAttr(f[0]) + '\')">' + f[1] + '</button>'; }).join('')
    + '<select class="agt-inc-sel" aria-label="Client" onchange="agtFacClient(this.value)"><option value="">Tous les clients</option>'
    + (d.clients || []).map(function (c) { return '<option value="' + esc(c.slug) + '"' + (E.client === c.slug ? ' selected' : '') + '>' + esc(c.nom) + '</option>'; }).join('') + '</select>'
    + '<button class="agt-btn agt-inc-court" onclick="agtBizLivre()">Livre des recettes</button>'
    + '<button class="agt-btn agt-inc-court" onclick="agtBizCsv()">Export comptable</button></div>';
  var panneau = (E.nouvelle >= -1) ? ficheNouvelle(d) : (ouvert ? ficheFacture(ouvert, d) : '');
  h += '<div class="agt-inc-corps' + (panneau ? ' avec-fiche' : '') + '">' + panneau + '<div class="agt-tbl-cadre">';
  if (!liste.length) h += '<div class="agt-inc-vide">Aucune facture pour ces filtres.</div>';
  else {
    h += '<table class="agt-tbl"><thead><tr>' + th('ref', 'N\u00b0') + th('client', 'Client') + th('date', 'Date') + th('montant', 'Montant', true) + th('reste', 'Reste d\u00fb', true) + '<th>Statut</th></tr></thead><tbody>';
    liste.forEach(function (f) {
      var p = pastille(f), kk = cle(f);
      h += '<tr class="' + (kk === E.ouvert ? 'on' : '') + '" tabindex="0" onclick="agtFacOuvrir(\'' + _escAttr(kk) + '\')" onkeydown="if(event.key===\'Enter\')agtFacOuvrir(\'' + _escAttr(kk) + '\')">'
        + '<td>' + esc(f.ref) + '</td><td class="agt-tbl-titre"><span class="agt-tbl-msg">' + esc(f.client) + '</span>' + (f.interne ? '<span class="agt-tbl-sous">interne, hors totaux</span>' : '') + '</td>'
        + '<td>' + esc(d.dateFr(f.date)) + '</td><td class="agt-tbl-n">' + esc(eur(f.montant)) + '</td>'
        + '<td class="agt-tbl-n">' + (f.type !== 'geste' && f.reste > 0 ? '<b>' + esc(eur(f.reste)) + '</b>' : '\u2014') + '</td>'
        + '<td><span class="' + p.classe + '">' + esc(p.label) + '</span></td></tr>';
    });
    h += '</tbody></table>';
  }
  return h + '</div></div></div>';
}

// ── Les gestes de l'écran ─────────────────────────────────────────────────────
function rendre() { if (window.agtRenderBody) window.agtRenderBody(); }
window._agtFacturationVue = vue;
window.agtFacFiltre = function (f) { E.filtre = f; rendre(); };
window.agtFacClient = function (s) { E.client = String(s || ''); rendre(); };
window.agtFacMode = function (m) { E.mode = (m === 'facture') ? 'facture' : 'paiement'; rendre(); };
window.agtFacTri = function (col) { if (E.tri === col) E.sens = -E.sens; else { E.tri = col; E.sens = 1; } rendre(); };
window.agtFacOuvrir = function (k) { E.nouvelle = -2; E.ouvert = (k && E.ouvert !== k) ? String(k) : ''; rendre(); };
// « Nouvelle facture » (l'en-tête) : -1 ouvre le formulaire sans client, un rang choisit le client, -2 le ferme.
window.agtFacNouvelle = function (i) {
  var n = Number(i);
  E.nouvelle = isNaN(n) ? -1 : (n < -1 ? -2 : n); E.ouvert = '';
  if (window._agtOngletCourant && window._agtOngletCourant() !== 'business' && window.agtSwitchTab) window.agtSwitchTab('business'); else rendre();
};
window.agtFacCherche = function (v) {
  E.q = String(v || ''); rendre();
  var i = document.getElementById('agt-fac-q'); if (i) { i.focus(); try { i.setSelectionRange(E.q.length, E.q.length); } catch (e) { if (window.logError) window.logError({ level: 'info', cat: 'ui', msg: 'curseur de la recherche non pos\u00e9', detail: String((e && e.message) || e) }); } }
};
