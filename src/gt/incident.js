// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — src/gt/incident.js — INCIDENT DE DONNÉES (console GUERETTECH) — INCIDENT-1, §531
// ════════════════════════════════════════════════════════════════════════════
// La maquette docs/maquettes/maquette-fiche-client-v1.html, écran 3 : l'horloge (elle part de l'heure où
// GUERETTECH a pris connaissance de l'incident ; échéance CNIL à 72 h si GUERETTECH est responsable), la procédure
// en 7 étapes, le message aux clients (un BROUILLON, D5), le registre des violations (tenu même sans notification,
// art. 33.5 RGPD), les contacts utiles, ce que disent les textes signés (CG 4.8, accord de traitement).
// Au repos, chaque étape se lit comme la maquette ; un clic l'ouvre pour noter ce qu'on sait.
// Ce fichier ne lit la console que par `window._agtIncidentDonnees()` et n'agit que par ses gestes publics.
// ⚠️ Chargé par src/gt.js, sur gt.html seulement.
// ════════════════════════════════════════════════════════════════════════════

var E = { vue: '', ouverte: 0 };
function _escAttr(v) { return (typeof window !== 'undefined' && window._escAttr) ? window._escAttr(v) : String(v == null ? '' : v).replace(/[\\'"<>&]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
function deux(n) { return String(n).padStart(2, '0'); }
function jourHeure(ms) { var d = new Date(ms); return deux(d.getDate()) + '/' + deux(d.getMonth() + 1) + '/' + d.getFullYear() + ' \u00e0 ' + deux(d.getHours()) + ':' + deux(d.getMinutes()); }

// ── Les fonctions pures (le harnais incident1 les joue) ──────────────────────
export function duree(ms) {
  var m = Math.max(0, Math.floor(ms / 60000)), h = Math.floor(m / 60), j = Math.floor(h / 24);
  if (j >= 1) return j + ' j ' + (h % 24) + ' h';
  if (h >= 1) return h + ' h ' + deux(m % 60);
  return m + ' min';
}
// L'horloge : écoulé depuis la prise de connaissance, échéance des 72 heures, heures restantes (négatif = dépassé).
export function horloge(ouvertLe, maintenant) {
  var t0 = Date.parse(ouvertLe || ''); if (!isFinite(t0)) return null;
  var now = maintenant || Date.now(), ech = t0 + 72 * 3600000;
  return { ecoule: duree(now - t0), echeance: ech, restantes: Math.floor((ech - now) / 3600000), depasse: now > ech };
}
// Le message aux clients touchés (CG 4.8, accord de traitement) : ce qu'on ignore reste entre crochets, à compléter.
export function message(inc, contact) {
  var t0 = Date.parse(inc.ouvertLe || ''), d = isFinite(t0) ? new Date(t0) : null;
  var c = function (v, def) { v = String(v == null ? '' : v).trim(); return v || def; };
  return 'Objet : Ma Vigne \u2014 incident de s\u00e9curit\u00e9 concernant vos donn\u00e9es\n\nBonjour,\n\n'
    + 'Le ' + (d ? deux(d.getDate()) + '/' + deux(d.getMonth() + 1) + '/' + d.getFullYear() + ' \u00e0 ' + deux(d.getHours()) + ':' + deux(d.getMinutes()) : '[date]') + ', nous avons constat\u00e9 ' + c(inc.nature, '[nature de l\u2019incident]') + '.\n'
    + 'Donn\u00e9es concern\u00e9es : ' + c(inc.categories, '[cat\u00e9gories]') + ' \u2014 environ ' + c(inc.volume, '[volume]') + ' enregistrements, pour ' + c(inc.personnes, '[nombre]') + ' personnes.\n'
    + 'Mesures prises : ' + c(inc.mesures, '[contenir, restaurer, corriger]') + '.\n'
    + 'Vous \u00eates responsable de traitement : il vous appartient d\u2019appr\u00e9cier la notification \u00e0 la CNIL (72 h) et l\u2019information de vos salari\u00e9s ; nous vous fournissons tout \u00e9l\u00e9ment utile.\n\n'
    + 'Contact : ' + contact;
}
export var ETAPES = [
  ['Constater et dater', 'L\u2019heure o\u00f9 GUERETTECH en a pris connaissance lance l\u2019horloge. Qui, quoi, comment on l\u2019a su.'],
  ['Contenir', 'Couper l\u2019acc\u00e8s en cause : verrouiller la console, r\u00e9voquer les sessions et jetons, d\u00e9sactiver le compte touch\u00e9, resserrer une r\u00e8gle. Garder les traces (journaux, horodatages).'],
  ['\u00c9valuer', 'Quels domaines, quelles cat\u00e9gories de donn\u00e9es (identification, planning, heures, phyto\u2026), combien de personnes \u00e0 peu pr\u00e8s, quel risque pour elles. GUERETTECH est-il <b>sous-traitant</b> (les donn\u00e9es des domaines) ou <b>responsable</b> (comptes, facturation, demandes du site) ?'],
  ['Pr\u00e9venir les clients touch\u00e9s \u2014 dans les meilleurs d\u00e9lais', 'Engagement des CG (4.8) et de l\u2019accord de traitement : la nature de la violation, les cat\u00e9gories et le volume approximatif de donn\u00e9es, les mesures prises, un contact. <b>Le client d\u00e9cide ensuite de la CNIL (72 h, art. 33) et de pr\u00e9venir ses salari\u00e9s.</b>'],
  ['Si GUERETTECH est responsable : la CNIL sous 72 heures', 'Sauf risque improbable pour les personnes : notification en ligne (notifications.cnil.fr), compl\u00e9t\u00e9e ensuite si besoin. Risque \u00e9lev\u00e9 : pr\u00e9venir aussi les personnes concern\u00e9es.'],
  ['Restaurer', 'Export natif quotidien (7 jours), export JSON par domaine (30 jours), restauration cibl\u00e9e d\u2019un domaine ; la preuve des signatures se restaure \u00e0 part.'],
  ['Inscrire au registre des violations', 'Toujours, m\u00eame sans notification (art. 33.5) : les faits, les effets, les mesures prises.']
];

// ── Le dessin ─────────────────────────────────────────────────────────────────
function carte(titre, corps, action) {
  return '<section class="mvcarte-fond agt-carte"><div class="agt-carte-tete"><h2 class="agt-carte-titre">' + titre + '</h2>' + (action || '') + '</div><div class="agt-carte-corps">' + corps + '</div></section>';
}
function bouton(lib, geste, plein) { return '<button class="agt-btn' + (plein ? ' fill' : '') + ' agt-inc-court" onclick="' + geste + '">' + lib + '</button>'; }
function editeur(n, inc, d) {
  var esc = d.esc, champ = function (k, lib, ph) {
    return '<label class="agt-ih-champ">' + lib + ' <input class="agt-inc-q" value="' + esc(inc[k] || '') + '" placeholder="' + esc(ph || '') + '" onchange="agtIncidentChamp(\'' + _escAttr(inc.id) + '\',\'' + _escAttr(k) + '\',this.value)"></label>';
  };
  if (n === 1) return champ('nature', 'Ce qui s\u2019est pass\u00e9', 'un export de sauvegarde lisible hors GUERETTECH');
  if (n === 2 || n === 6) return champ('mesures', 'Mesures prises', 'contenir, restaurer, corriger');
  if (n === 3) {
    return champ('categories', 'Cat\u00e9gories de donn\u00e9es', 'identification, planning') + champ('volume', 'Volume approximatif', '120') + champ('personnes', 'Personnes concern\u00e9es', '8')
      + '<div class="agt-ih-champ">R\u00f4le de GUERETTECH <span class="agt-inc-outils" style="margin:0">' + [['sous-traitant', 'Sous-traitant'], ['responsable', 'Responsable']].map(function (r) {
        return '<button class="agt-chip' + ((inc.role || 'sous-traitant') === r[0] ? ' on' : '') + '" onclick="agtIncidentChamp(\'' + _escAttr(inc.id) + '\',\'role\',\'' + _escAttr(r[0]) + '\')">' + r[1] + '</button>';
      }).join('') + '</span></div>'
      + '<div class="agt-ih-champ">Domaines touch\u00e9s <span class="agt-inc-outils" style="margin:0;flex-wrap:wrap">' + (d.domaines || []).map(function (x) {
        var on = (inc.domaines || []).indexOf(x.slug) >= 0;
        return '<button class="agt-chip' + (on ? ' on' : '') + '" onclick="agtIncidentDomaine(\'' + _escAttr(inc.id) + '\',\'' + _escAttr(x.slug) + '\',' + _escAttr(String(!on)) + ')">' + esc(x.nom) + '</button>';
      }).join('') + '</span></div>';
  }
  if (n === 5) return champ('cnil', 'CNIL', 'non (sous-traitant) \u00b7 oui, notifi\u00e9e le \u2026');
  return '';
}
function ce_quon_sait(n, inc, d) {
  var esc = d.esc, x = '';
  if (n === 1 && inc.ouvertLe) x = 'Pris connaissance le ' + jourHeure(Date.parse(inc.ouvertLe)) + (inc.nature ? ' \u2014 ' + esc(inc.nature) : '');
  if (n === 3 && ((inc.domaines || []).length || inc.categories)) x = [(inc.domaines || []).length + ' domaine' + ((inc.domaines || []).length > 1 ? 's' : ''), esc(inc.categories || ''), inc.volume ? '~' + esc(inc.volume) + ' enregistrements' : '', esc(inc.role || 'sous-traitant')].filter(Boolean).join(' \u00b7 ');
  if (n === 4 && inc.clientsPrevenusLe) x = 'Pr\u00e9venus le ' + jourHeure(Date.parse(inc.clientsPrevenusLe));
  if (n === 5 && inc.cnil) x = 'CNIL : ' + esc(inc.cnil);
  if ((n === 2 || n === 6) && inc.mesures) x = esc(inc.mesures);
  return x ? '<p class="agt-ih-su">' + x + '</p>' : '';
}
export function vue(d) {
  var esc = d.esc, L = d.entrees || [], inc = E.vue ? L.filter(function (x) { return x.id === E.vue; })[0] : d.encours;
  var h = '<div class="agt-inc">';
  // ── l'horloge ──
  if (inc && !inc.closLe) {
    var hz = horloge(inc.ouvertLe, d.maintenant);
    h += '<div class="agt-ih-horloge"><svg class="mv-ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#ic-alerte"></use></svg><div><b>Incident ouvert le ' + jourHeure(Date.parse(inc.ouvertLe)) + ' \u2014 il y a ' + hz.ecoule + '.</b> '
      + '\u00c9ch\u00e9ance CNIL si GUERETTECH est responsable : <b>' + jourHeure(hz.echeance) + '</b> (' + (hz.depasse ? 'd\u00e9pass\u00e9e' : hz.restantes + ' h restantes') + '). Clients touch\u00e9s \u00e0 pr\u00e9venir dans les meilleurs d\u00e9lais.</div>'
      + '<div class="agt-inc-outils" style="margin:0">' + bouton('Clore l\u2019incident', "agtIncidentClore('" + _escAttr(inc.id) + "')") + '</div></div>';
  } else if (inc) {
    h += '<div class="agt-ih-horloge agt-ih-calme"><svg class="mv-ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#ic-bouclier"></use></svg><div><b>Incident du ' + jourHeure(Date.parse(inc.ouvertLe)) + '</b> \u2014 clos le ' + (inc.closLe ? jourHeure(Date.parse(inc.closLe)) : '\u2014') + '.</div>'
      + '<div class="agt-inc-outils" style="margin:0">' + bouton(d.encours ? 'Revenir \u00e0 l\u2019incident en cours' : 'Fermer', "agtIncidentVoir('')") + '</div></div>';
  } else {
    h += '<div class="agt-ih-horloge agt-ih-calme"><svg class="mv-ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#ic-bouclier"></use></svg><div><b>Aucun incident en cours.</b> \u00c0 la moindre violation de donn\u00e9es, ouvrez-le ici : l\u2019horloge des 72 heures part de l\u2019heure o\u00f9 vous l\u2019avez su.</div>'
      + '<div class="agt-inc-outils" style="margin:0">' + bouton('Ouvrir un incident', 'agtIncidentOuvrir()', true) + '</div></div>';
  }
  h += '<div class="agt-fc-grille"><div class="agt-fc-col">';
  // ── la procédure ──
  var et = (inc && inc.etapes) || {};
  h += carte('La proc\u00e9dure', '<ol class="agt-ih-etapes">' + ETAPES.map(function (x, k) {
    var n = k + 1, fait = !!et[n], ouverte = inc && E.ouverte === n && !inc.closLe;
    return '<li class="agt-ih-etape' + (fait ? ' fait' : '') + '"><button class="agt-ih-n" ' + (inc && !inc.closLe ? 'onclick="agtIncidentEtape(\'' + _escAttr(inc.id) + '\',' + _escAttr(n) + ')" aria-label="\u00c9tape ' + n + (fait ? ', faite' : ', \u00e0 faire') + '"' : 'disabled') + '>' + (fait ? '\u2713' : n) + '</button><div>'
      + '<b class="agt-ih-titre"' + (inc && !inc.closLe ? ' tabindex="0" onclick="agtIncidentOuvrirEtape(' + _escAttr(n) + ')"' : '') + '>' + x[0] + '</b><p>' + x[1] + '</p>'
      + (ouverte ? '<div class="agt-ih-edit">' + ce_quon_sait(n, inc, d) + editeur(n, inc, d) + '</div>' : '')   // au repos, l'étape se lit comme la maquette ; ce qu'on sait s'affiche à l'ouverture
      + (n === 4 && inc && !inc.closLe ? '<div class="agt-inc-outils">' + bouton('Pr\u00e9parer le message aux clients (brouillon)', "agtIncidentMessages('" + _escAttr(inc.id) + "')") + '</div>' : '') + '</div></li>';
  }).join('') + '</ol>');
  // ── le message aux clients ──
  h += carte('Le message aux clients \u2014 mod\u00e8le', '<pre class="agt-fac-relance">' + esc(message(inc || {}, d.contact)) + '</pre><p class="agt-cli-note">Un brouillon dans votre messagerie, un par client touch\u00e9, adress\u00e9 \u00e0 son contact ; rien ne part seul.</p>',
    inc && !inc.closLe ? bouton('Pr\u00e9parer les brouillons', "agtIncidentMessages('" + _escAttr(inc.id) + "')") : '');
  h += '</div><div class="agt-fc-col">';
  // ── le registre des violations ──
  var reg = L.length ? '<table class="agt-tbl"><thead><tr><th style="padding:8px 12px">Date</th><th style="padding:8px 12px">Nature</th><th style="padding:8px 12px">Domaines</th><th style="padding:8px 12px">Clients pr\u00e9venus</th><th style="padding:8px 12px">CNIL</th><th style="padding:8px 12px">\u00c9tat</th></tr></thead><tbody>'
    + L.map(function (x) {
      var t0 = Date.parse(x.ouvertLe || ''), pv = Date.parse(x.clientsPrevenusLe || '');
      return '<tr class="' + (inc && x.id === inc.id ? 'on' : '') + '" tabindex="0" onclick="agtIncidentVoir(\'' + _escAttr(x.id) + '\')"><td>' + (isFinite(t0) ? jourHeure(t0).slice(0, 10) : '\u2014') + '</td>'
        + '<td class="agt-tbl-titre"><span class="agt-tbl-msg">' + esc(x.nature || 'Incident') + '</span><span class="agt-tbl-sous">' + esc([x.categories, x.volume ? '~' + x.volume + ' enregistrements' : ''].filter(Boolean).join(' \u00b7 ')) + '</span></td>'
        + '<td>' + (x.domaines || []).length + '</td><td>' + (isFinite(pv) ? jourHeure(pv).slice(0, 5) + ' \u00b7 ' + jourHeure(pv).slice(-5) : '\u2014') + '</td><td>' + esc(x.cnil || '\u2014') + '</td>'
        + '<td><span class="mvpas mvpas-statut ' + (x.closLe ? 'mvpas-fait">Clos' : 'mvpas-surveiller">En cours') + '</span></td></tr>';
    }).join('') + '</tbody></table>' : '<div class="agt-inc-vide">Aucune violation inscrite.</div>';
  h += carte('Registre des violations', '<div class="agt-tbl-cadre nu">' + reg + '</div><p class="agt-cli-note">Tenu m\u00eame sans notification (art. 33.5 RGPD). Gard\u00e9 dans la console, GUERETTECH seul.</p>', bouton('+ Inscrire', 'agtIncidentInscrire()'));
  var dl = function (P) { return '<dl class="agt-inc-dl">' + P.map(function (p) { return '<dt>' + p[0] + '</dt><dd>' + p[1] + '</dd>'; }).join('') + '</dl>'; };
  h += carte('Contacts utiles', dl([['CNIL', 'notifications.cnil.fr \u2014 notification en ligne, 72 h'], ['H\u00e9bergeur', 'Google Cloud (Firebase), europe-west1 \u2014 support et journaux'], ['E-mails', 'extension d\u2019envoi Firebase \u2014 file des e-mails'], ['GUERETTECH', esc(String(d.contact || '').replace(/ \u2014 /g, ' \u00b7 '))]]));
  h += carte('Ce que disent les textes sign\u00e9s', dl([['CG 4.8', 'le prestataire notifie le client dans les meilleurs d\u00e9lais : nature, cat\u00e9gories de donn\u00e9es, mesures prises'], ['Accord de traitement', '+ le volume approximatif ; assistance pour les articles 32 \u00e0 36'], ['Le client', 'appr\u00e9cie la notification \u00e0 la CNIL (72 h) et aux personnes']]));
  return h + '</div></div></div>';
}

// ── Les gestes ────────────────────────────────────────────────────────────────
function rendre() { if (window.agtRenderBody) window.agtRenderBody(); }
window._agtIncidentVue = vue;
window._agtIncidentMessage = message;
window.agtIncidentVoir = function (id) { E.vue = String(id || ''); E.ouverte = 0; rendre(); };
window.agtIncidentOuvrirEtape = function (n) { E.ouverte = (E.ouverte === n) ? 0 : n; rendre(); };
