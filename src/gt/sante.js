// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — src/gt/sante.js — L'ÉCRAN « SANTÉ DU SYSTÈME » DE LA CONSOLE GUERETTECH — GT-UI-6, §521
// ════════════════════════════════════════════════════════════════════════════
// La maquette v1 (docs/maquettes/maquette-console-gt-v1.html, MAQ-1) : cinq états (sauvegarde de la base, export de
// secours, catalogue E-Phy, file des e-mails, version en ligne) — écrits par les tâches planifiées elles-mêmes dans
// `_guerettech/sante` (functions/sante.js) —, les versions de tout le parc, et « Avant le déploiement général » : ce
// qu'il faut vérifier avant de pousser une version (aucun appareil bloqué, combien à jour, la sauvegarde de la nuit).
// Ce fichier ne lit la console que par `window._agtSanteDonnees()`.
// ⚠️ Chargé par src/gt.js, sur gt.html seulement.
// ════════════════════════════════════════════════════════════════════════════

export var TACHES = [
  ['sauvegarde', 'Sauvegarde de la base', 26],   // la nuit, chaque jour : en retard au-delà de 26 h
  ['export', 'Export de secours', 26],
  ['ephy', 'Catalogue E-Phy', 8 * 24 + 2],      // chaque mercredi
  ['mails', 'File des e-mails', 2]              // toutes les heures
];

// ── Les fonctions pures (le harnais gtui6 les joue) ──────────────────────────
// L'état d'une tâche : jamais passée (en attente), en échec, en retard sur son rythme, ou bonne.
export function etatTache(e, maxH, maintenant) {
  if (!e || !e.quand) return { cle: 'attente', label: 'en attente du premier passage' };
  var t = Date.parse(e.quand), h = t ? ((maintenant || Date.now()) - t) / 3600000 : Infinity;
  if (e.ok === false) return { cle: 'alerte', label: '\u00e9chec' };
  if (h > maxH) return { cle: 'attention', label: 'en retard' };
  return { cle: 'ok', label: 'fait' };
}
function cmpV(a, b) {
  var x = String(a || '0').split('.').map(Number), y = String(b || '0').split('.').map(Number);
  for (var i = 0; i < Math.max(x.length, y.length); i++) { var d = (x[i] || 0) - (y[i] || 0); if (d) return d; }
  return 0;
}
// Le parc : chaque appareil de chaque domaine — à jour (version en ligne ou plus), en retard, bloqué (format de
// données trop ancien : il ne peut plus écrire).
export function parc(domaines, cur, fmt) {
  var parV = {}, lignes = [], tot = { n: 0, aJour: 0, retard: 0, bloques: 0 };
  (domaines || []).forEach(function (dm) {
    var l = { nom: dm.nom, n: 0, aJour: 0, retard: 0, bloques: 0 };
    Object.keys(dm.appareils || {}).forEach(function (k) {
      var a = dm.appareils[k] || {}, v = String(a.v || '?'), bloque = (Number(a.f) || 0) < fmt;
      parV[v] = parV[v] || { v: v, n: 0, bloque: false };
      parV[v].n++; if (bloque) parV[v].bloque = true;
      l.n++;
      if (bloque) l.bloques++;
      else if (cmpV(v, cur) >= 0) l.aJour++;
      else l.retard++;
    });
    if (l.n) { lignes.push(l); tot.n += l.n; tot.aJour += l.aJour; tot.retard += l.retard; tot.bloques += l.bloques; }
  });
  var versions = Object.keys(parV).map(function (k) { return parV[k]; }).sort(function (a, b) { return cmpV(b.v, a.v); });
  return { versions: versions, lignes: lignes, tot: tot };
}

// ── Le dessin ─────────────────────────────────────────────────────────────────
var POINT = { ok: 'ok', attention: 'attention', alerte: 'alerte', attente: 'attente' };
export function vue(d) {
  var esc = d.esc, s = d.sante || {}, maintenant = Date.now(), p = parc(d.domaines, d.version, d.format);
  var h = '<div class="agt-inc agt-sante-ecran"><div class="agt-sante-rangee">';
  TACHES.forEach(function (t) {
    var e = s[t[0]], et = etatTache(e, t[2], maintenant);
    var detail = e ? [e.quand ? d.relTime(e.quand) : '', t[0] === 'mails' && e.dernier ? ('dernier envoi ' + d.relTime(e.dernier)) : '', e.detail || ''].filter(Boolean).join(' \u00b7 ') : 'aucun passage not\u00e9 pour l\u2019instant';
    h += '<div class="mvcarte-fond agt-sante-bloc ' + POINT[et.cle] + '"><b>' + esc(t[1]) + '</b><span>' + esc(detail) + '</span>'
      + (et.cle !== 'ok' ? '<span class="agt-sante-etat">' + esc(et.label) + '</span>' : '') + '</div>';
  });
  h += '<div class="mvcarte-fond agt-sante-bloc neutre"><b>Version en ligne</b><span>APP ' + esc(d.version) + ' \u00b7 format ' + esc(d.format) + '</span></div></div>';
  h += '<div class="agt-sante-grille"><section class="mvcarte-fond agt-carte"><div class="agt-carte-tete"><h2 class="agt-carte-titre">Versions de tout le parc</h2><span class="agt-cli-note" style="margin:0">' + p.tot.n + ' appareil' + (p.tot.n > 1 ? 's' : '') + '</span></div><div class="agt-carte-corps">';
  if (!p.versions.length) h += '<p class="agt-cli-note">Aucun appareil enregistr\u00e9 (la liste se remplit \u00e0 la prochaine connexion de chacun).</p>';
  var max = Math.max.apply(null, p.versions.map(function (v) { return v.n; }).concat([1]));
  p.versions.forEach(function (v) {
    var cl = v.bloque ? 'bloque' : (cmpV(v.v, d.version) >= 0 ? 'enligne' : 'ancien');
    h += '<div class="agt-sante-v"><span>' + esc(v.v) + '</span><span class="agt-sante-piste"><span class="' + cl + '" style="width:' + Math.max(2, Math.round(v.n / max * 100)) + '%"></span></span><span>' + v.n + '</span></div>';
  });
  h += '<p class="agt-cli-note" style="margin-top:8px">En lie-de-vin, la version en ligne ; en orange, une version plus ancienne ; en rouge, un appareil bloqu\u00e9 en \u00e9criture.</p></div></section>';
  var nuit = etatTache(s.sauvegarde, 26, maintenant);
  h += '<section class="mvcarte-fond agt-carte"><div class="agt-carte-tete"><h2 class="agt-carte-titre">Avant le d\u00e9ploiement g\u00e9n\u00e9ral</h2></div><div class="agt-carte-corps"><ul class="agt-sante-liste">'
    + '<li class="' + (p.tot.bloques ? 'alerte' : '') + '">Aucun appareil bloqu\u00e9 en \u00e9criture<small>' + (p.tot.bloques ? ('non : ' + p.tot.bloques + ' appareil' + (p.tot.bloques > 1 ? 's' : '') + ' (' + esc(p.lignes.filter(function (l) { return l.bloques; }).map(function (l) { return l.nom; }).join(', ')) + ')') : 'oui') + '</small></li>'
    + '<li class="' + (p.tot.aJour < p.tot.n ? 'attention' : '') + '">Sur la version en ligne<small>' + p.tot.aJour + ' sur ' + p.tot.n + '</small></li>'
    + '<li class="' + (nuit.cle === 'ok' ? '' : (nuit.cle === 'alerte' ? 'alerte' : 'attention')) + '">Sauvegarde de la nuit faite<small>' + esc(nuit.cle === 'ok' ? d.relTime(s.sauvegarde.quand) : nuit.label) + '</small></li></ul>';
  if (p.lignes.length) {
    h += '<div class="agt-tbl-cadre" style="margin-top:12px"><table class="agt-tbl"><thead><tr><th style="padding:8px 12px">Domaine</th><th style="padding:8px 12px;text-align:right">Appareils</th><th style="padding:8px 12px;text-align:right">\u00c0 jour</th><th style="padding:8px 12px;text-align:right">En retard</th><th style="padding:8px 12px;text-align:right">Bloqu\u00e9s</th></tr></thead><tbody>'
      + p.lignes.map(function (l) {
        return '<tr><td>' + esc(l.nom) + '</td><td class="agt-tbl-n">' + l.n + '</td><td class="agt-tbl-n">' + l.aJour + '</td><td class="agt-tbl-n">' + (l.retard || '\u2014') + '</td><td class="agt-tbl-n">' + (l.bloques ? '<b class="agt-revenu">' + l.bloques + '</b>' : '\u2014') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  return h + '</div></section></div></div>';
}
window._agtSanteVue = vue;
