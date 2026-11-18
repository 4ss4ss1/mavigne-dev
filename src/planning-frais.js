// ═════════════════════════════════════════════════════════════════════════════════════════════════════════
// MA VIGNE — LES FRAIS À REMBOURSER (planning-frais.js) — FRAIS-1 (§595)
// Nico (18/11/2026) : « une case frais personnels à rembourser : des tickets, des CB, pourquoi ça a été payé,
//   pour que le domaine rembourse, qu'on envoie ça en compta en même temps que la paye ; et les forfaits
//   kilométriques quand on se déplace avec son véhicule personnel ». Puis : « fais juste le nombre de
//   kilomètres parcourus pour un trajet professionnel, et le motif. C'est tout. » L'admin seul saisit et valide.
//   Maquette validée (« parfait, on suit les recommandations ») : docs/maquettes/maquette-frais-v2.html.
//
// ★ OÙ VIVENT LES DONNÉES — dans planning_hsup, déjà lu par l'admin seul (MOTIFS-1, §250) : PLANNING_HSUP[nom].frais
//   = { voiture:{modele,cv,energie,carte,carteGrise}, lignes:[…] }. Pas de collection neuve, donc ni règle Firestore ni
//   lecture de plus ; un renommage de salarié emporte ses frais avec le reste (_rmAppliquer : cle(PLANNING_HSUP)).
//   Une ligne : {id, n (ordre de saisie), t:'ticket'|'trajet', mois:'AAAA-MM' (la paie qui la rembourse), date, motif,
//   ticket → cat, montant, tva|null, paye:'cb'|'especes', photo ; trajet → km, cv, elec (la voiture du jour de saisie)}.
//   Les photos (ticket, carte grise) vont dans Storage, tenants/<domaine>/frais/ (storage.rules : l'admin seul).
//   ⚠️ Rien ne part de la clé « mois » au-delà de ces lignes : les mois d'heures sup se lisent par leur clé, jamais par
//   un parcours de PLANNING_HSUP[nom] (vérifié le 18/11 : planning.js, planning-modeles.js, reglages.js, firebase.js).
//
// ★ LE BARÈME — celui de l'administration fiscale, que l'URSSAF prend comme limite (Service-Public, 9 avril 2026 :
//   revenus 2025, inchangé depuis l'arrêté du 27 mars 2023). Le palier se lit sur les km de TOUTE l'année civile : chaque
//   trajet prend barème(km après) − barème(km avant), dans l'ordre de saisie. Au 31 décembre le total tombe exactement
//   sur le barème de l'année, sans régularisation ; un mois figé garde ses montants (fige.frais.mt).
//   Un taux du domaine (CONFIG.frais_km, €/km) remplace le barème quand il est posé (roue du Planning).
//
// ★ LE MOIS — un frais part avec la paie du mois affiché dans la fiche ; si ce mois est figé, avec le premier mois
//   suivant qui ne l'est pas (la règle des heures, FIGE-1 §147). Une ligne d'un mois figé ne se modifie plus.
//
// Chargé par app.js juste après planning-modeles.js. Rien ne s'exécute au chargement ; les gestes s'exposent en fin.
// ═════════════════════════════════════════════════════════════════════════════════════════════════════════
import { isAdmin, showToast, _escHtml, _escAttr, _mvIcon, _mvInfoBtn } from './utils.js';

// ── Le barème : [jusqu'à 5 000 km : d × a] [5 001 à 20 000 : d × b + c] [au-delà : d × e] ──
var FRAIS_BAREME = {
  publie: '9 avril 2026', revenus: 2025,
  v: { 3: [0.529, 0.316, 1065, 0.370], 4: [0.606, 0.340, 1330, 0.407], 5: [0.636, 0.357, 1395, 0.427], 6: [0.665, 0.374, 1457, 0.447], 7: [0.697, 0.394, 1515, 0.470] },
  e: { 3: [0.635, 0.379, 1278, 0.444], 4: [0.727, 0.408, 1596, 0.488], 5: [0.763, 0.428, 1674, 0.512], 6: [0.798, 0.449, 1748, 0.536], 7: [0.836, 0.473, 1818, 0.564] }
};
var FRAIS_CV = { 3: '3 CV et moins', 4: '4 CV', 5: '5 CV', 6: '6 CV', 7: '7 CV et plus' };
var FRAIS_EN = { essence: 'essence', diesel: 'diesel', hybride: 'hybride', electrique: '100 % électrique' };
var FRAIS_CATS = [['achat', 'Achat pour le domaine'], ['carburant', 'Carburant d’un engin'], ['peage', 'Péage, parking'], ['repas', 'Repas'], ['hebergement', 'Hébergement'], ['autre', 'Autre']];
var FRAIS_MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
var FRAIS_MC = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

// ── Petits outils ──
function _frR2(x) { return Math.round((Number(x) || 0) * 100) / 100; }
function _frNum(v) { var s = String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.'); var n = parseFloat(s); return isFinite(n) ? n : 0; }
function _frEur(x) { return _frR2(x).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
function _frKm(x) { return (Math.round((Number(x) || 0) * 10) / 10).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' km'; }
function _frCoef(x) { return Number(x).toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }); }
function _frJour(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? (parseInt(p[2], 10) + ' ' + FRAIS_MC[parseInt(p[1], 10) - 1]) : ''; }
function _frCle(y, m) { return y + '-' + String(m + 1).padStart(2, '0'); }
function _frCleSuiv(k) { var y = parseInt(k.slice(0, 4), 10), m = parseInt(k.slice(5, 7), 10); return m >= 12 ? _frCle(y + 1, 0) : _frCle(y, m); }
function _frMoisNom(k) { return FRAIS_MOIS[parseInt(String(k).slice(5, 7), 10) - 1] || ''; }
function _frIco(n, t) { return (typeof _mvIcon === 'function') ? _mvIcon(n, t || 18) : ''; }
function _frCv(cv) { var n = parseInt(cv, 10); if (!isFinite(n)) return 0; return n <= 3 ? 3 : (n >= 7 ? 7 : n); }
function _frAuj() { return (typeof window._mvAujIso === 'function') ? window._mvAujIso() : new Date().toISOString().slice(0, 10); }

// Le barème pour d km dans l'année (0 si la puissance est inconnue).
function _fraisBareme(cv, elec, d) {
  var t = (elec ? FRAIS_BAREME.e : FRAIS_BAREME.v)[_frCv(cv)];
  if (!t || !(d > 0)) return 0;
  if (d <= 5000) return d * t[0];
  if (d <= 20000) return d * t[1] + t[2];
  return d * t[3];
}
function _fraisPalier(d) { return d <= 5000 ? 1 : (d <= 20000 ? 2 : 3); }
// Le prix du km suivant, au palier où l'on est (pour l'affichage).
function _fraisKmSuivant(cv, elec, d) { var t = (elec ? FRAIS_BAREME.e : FRAIS_BAREME.v)[_frCv(cv)]; if (!t) return 0; var p = _fraisPalier(d + 1); return p === 1 ? t[0] : (p === 2 ? t[1] : t[3]); }
// Le taux du domaine (€/km), s'il est posé ; 0 sinon (barème).
function _fraisTaux() { var c = window.CONFIG || {}, v = _frNum(c.frais_km); return (v > 0 && v < 5) ? v : 0; }

// ── Les données (tolérer un champ absent : RELEVE-3, §24 n°20) ──
function _fraisLire(nom) {
  var H = window.PLANNING_HSUP || {}, F = H[nom] && H[nom].frais;
  return {
    voiture: (F && F.voiture && typeof F.voiture === 'object') ? F.voiture : null,
    lignes: (F && Array.isArray(F.lignes)) ? F.lignes.filter(function (l) { return l && typeof l === 'object' && l.id; }) : []
  };
}
// Le conteneur à écrire (créé au besoin).
function _fraisConteneur(nom) {
  var H = window.PLANNING_HSUP = window.PLANNING_HSUP || {};
  if (!H[nom] || typeof H[nom] !== 'object') H[nom] = {};
  var F = H[nom].frais;
  if (!F || typeof F !== 'object') F = H[nom].frais = { voiture: null, lignes: [] };
  if (!Array.isArray(F.lignes)) F.lignes = [];
  return F;
}
function _fraisFige(nom, cle) { var r = ((window.PLANNING_HSUP || {})[nom] || {})[cle]; return (r && r.fige && typeof r.fige === 'object') ? r.fige : null; }
// Le mois de paie d'un frais saisi en regardant le mois `cle` : lui, ou le premier mois suivant qui n'est pas figé.
function _fraisMoisCible(nom, cle) { var k = cle, i = 0; while (_fraisFige(nom, k) && i < 24) { k = _frCleSuiv(k); i++; } return k; }

// ── Le calcul des km : l'année civile de la paie, dans l'ordre de saisie ──
function _fraisCalcAnnee(nom, an) {
  var F = _fraisLire(nom), taux = _fraisTaux(), c = 0, L = {};
  F.lignes.filter(function (l) { return l.t === 'trajet' && String(l.mois || '').slice(0, 4) === String(an); })
    .sort(function (a, b) { return (a.n || 0) - (b.n || 0); })
    .forEach(function (l) {
      var km = Math.max(0, _frNum(l.km)), fg = _fraisFige(nom, l.mois), mt;
      if (fg && fg.frais && fg.frais.mt && typeof fg.frais.mt[l.id] === 'number') mt = fg.frais.mt[l.id];
      else if (taux > 0) mt = _frR2(km * taux);
      else mt = _frR2(_fraisBareme(l.cv, !!l.elec, c + km) - _fraisBareme(l.cv, !!l.elec, c));
      L[l.id] = { km: km, mt: mt, avant: c, apres: c + km };
      c += km;
    });
  return { L: L, cumul: c, taux: taux };
}
// Le mois de paie `cle` d'une personne : ses lignes et ses totaux.
function _fraisMois(nom, cle) {
  var F = _fraisLire(nom), C = _fraisCalcAnnee(nom, cle.slice(0, 4)), fg = _fraisFige(nom, cle);
  var L = F.lignes.filter(function (l) { return l.mois === cle; })
    .sort(function (a, b) { return String(a.date) < String(b.date) ? -1 : (String(a.date) > String(b.date) ? 1 : (a.n || 0) - (b.n || 0)); });
  var t = { cle: cle, lignes: L, C: C, tk: 0, ntk: 0, manq: 0, ik: 0, km: 0, ntr: 0, tot: 0, fige: !!fg };
  L.forEach(function (l) {
    if (l.t === 'ticket') { t.tk += _frNum(l.montant); t.ntk++; if (!l.photo) t.manq++; }
    else if (l.t === 'trajet' && C.L[l.id]) { t.ik += C.L[l.id].mt; t.km += C.L[l.id].km; t.ntr++; }
  });
  t.tk = _frR2(t.tk); t.ik = _frR2(t.ik); t.tot = _frR2(t.tk + t.ik);
  return t;
}
// L'instantané posé par « Figer » (planning.js, _planFigeInstantane) : ce qui part avec la paie ne bouge plus.
function _fraisInstantane(nom, y, m) {
  var t = _fraisMois(nom, _frCle(y, m));
  if (!t.lignes.length) return null;
  var mt = {};
  t.lignes.forEach(function (l) { if (l.t === 'trajet' && t.C.L[l.id]) mt[l.id] = t.C.L[l.id].mt; });
  return { tk: t.tk, ik: t.ik, tot: t.tot, km: t.km, n: t.lignes.length, mt: mt };
}

// ═══ LE VOLET « FRAIS » DE LA FICHE ═══
function _frPas(cls, ico, txt) { return '<span class="frs-pas ' + cls + '">' + (ico ? _frIco(ico, 14) : '') + '<span>' + txt + '</span></span>'; }
function _frLigneHtml(nom, l, t) {
  var lock = t.fige, ps = [], ico, sous, mt;
  if (l.t === 'ticket') {
    var cat = FRAIS_CATS.filter(function (c) { return c[0] === l.cat; })[0];
    ico = 'recu'; mt = _frNum(l.montant);
    sous = _frJour(l.date) + ' · ' + (cat ? cat[1] : 'Autre') + ' · ' + (l.paye === 'especes' ? 'espèces' : 'sa carte');
    if (!l.photo) ps.push(_frPas('or', 'alerte', 'ticket manquant'));
  } else {
    var c = t.C.L[l.id] || { km: _frNum(l.km), mt: 0, avant: 0, apres: 0 };
    ico = 'route'; mt = c.mt;
    sous = _frJour(l.date) + ' · ' + _frKm(c.km) + ' avec sa voiture';
    if (!t.C.taux && _fraisPalier(c.avant + 0.001) !== _fraisPalier(c.apres)) ps.push(_frPas('gris', '', 'passe au palier ' + _fraisPalier(c.apres)));
  }
  if (lock) ps.push(_frPas('gris', 'cadenas', 'figé'));
  var corps = '<span class="frs-ic">' + _frIco(ico, 18) + '</span><span class="frs-q"><span class="frs-m">' + _escHtml(l.motif || '') + '</span><span class="frs-s">' + sous + '</span>'
    + (ps.length ? '<span class="frs-pass">' + ps.join('') + '</span>' : '') + '</span><span class="frs-mt">' + _frEur(mt) + '</span>';
  return '<li>' + (lock ? '<div class="frs-li">' + corps + '</div>'
    : '<button type="button" class="frs-li" data-t="' + (l.t === 'ticket' ? 'ticket' : 'trajet') + '" data-id="' + _escAttr(l.id) + '" onclick="openPlanFrais(this.dataset.t,this.dataset.id)">' + corps + '</button>') + '</li>';
}
function _frVoitureHtml(F) {
  var v = F.voiture;
  if (!v) return '<section class="pf-card frs-carte"><div class="frs-ct">' + _frIco('route', 16) + '<span>Sa voiture</span></div><p class="frs-sous">Pas de voiture déclarée.</p>'
    + '<button type="button" class="mvbtn mvbtn-secondaire mvbtn-compact" onclick="openPlanFrais(\'voiture\')">Déclarer sa voiture</button></section>';
  return '<section class="pf-card frs-carte"><div class="frs-ct">' + _frIco('route', 16) + '<span>Sa voiture</span>'
    + '<button type="button" class="mvbtn mvbtn-secondaire mvbtn-compact" onclick="openPlanFrais(\'voiture\')">Modifier</button></div>'
    + '<b class="frs-gros">' + (v.modele ? _escHtml(v.modele) + ' · ' : '') + (FRAIS_CV[_frCv(v.cv)] || '?') + ' · ' + (FRAIS_EN[v.energie] || '?') + '</b>'
    + '<span class="frs-pass">' + (v.carteGrise ? _frPas('ok', 'check', 'carte grise') : _frPas('or', 'alerte', 'carte grise à joindre'))
    + (v.energie === 'electrique' ? _frPas('gris', '', '+20 %') : '') + '</span></section>';
}
function _frAnneeHtml(nom, F, cle) {
  var C = _fraisCalcAnnee(nom, cle.slice(0, 4)), v = F.voiture, c = C.cumul, an = cle.slice(0, 4);
  var h = '<section class="pf-card frs-carte"><div class="frs-ct"><span>Km payés en ' + an + '</span>' + _mvInfoBtn('plan.frais.km') + '</div><b class="frs-gros">' + _frKm(c) + '</b>';
  if (C.taux) return h + '<p class="frs-sous">Taux du domaine : ' + _frCoef(C.taux) + ' € le km</p></section>';
  if (c <= 5000) h += '<div class="frs-barre" aria-hidden="true"><i style="width:' + Math.min(100, c / 50).toFixed(1) + '%"></i></div><div class="frs-barre-l"><span>0</span><span>5 000 km</span></div>';
  if (v) h += '<p class="frs-sous">Palier ' + _fraisPalier(c + 1) + ' · ' + _frCoef(_fraisKmSuivant(v.cv, v.energie === 'electrique', c)) + ' € le km suivant</p>';
  return h + '</section>';
}
// Le volet, pour le mois P.m de l'année affichée.
// ★ FRAIS-2 (§597) : `apres` — ce que la fiche pose sous la liste des frais (les acomptes du mois, planning.js).
function _pfFrais(mbr, P, apres) {
  var nom = mbr.nom, y = (typeof window._pY === 'function') ? window._pY() : new Date().getFullYear(), cle = _frCle(y, P.m);
  var F = _fraisLire(nom), t = _fraisMois(nom, cle), mois = _frMoisNom(cle), h = '<div class="frs">';
  if (t.fige) h += '<p class="frs-ph" data-tuto="plan.frais.phrase">' + _frIco('cadenas', 16) + ' <span>' + mois.charAt(0).toUpperCase() + mois.slice(1) + ' figé : <b>' + _frEur(t.tot) + '</b> partis avec la paie.</span></p>';
  else if (t.tot > 0) h += '<p class="frs-ph" data-tuto="plan.frais.phrase"><span><b>' + _frEur(t.tot) + '</b> à rembourser avec la paie de ' + mois + '.</span></p>';
  else h += '<p class="frs-ph" data-tuto="plan.frais.phrase"><span>Rien à rembourser en ' + mois + '.</span></p>';
  var bd = [];
  if (t.manq) bd.push(_frPas('or', 'alerte', t.manq + ' ticket' + (t.manq > 1 ? 's' : '') + ' manquant' + (t.manq > 1 ? 's' : '')));
  if (t.ntr && F.voiture && !F.voiture.carteGrise) bd.push(_frPas('or', 'alerte', 'carte grise à joindre'));
  if (bd.length) h += '<div class="frs-pass frs-bande">' + bd.join('') + '</div>';
  if (t.lignes.length) h += '<div class="frs-tu"><div class="frs-t"><span>Tickets</span><b>' + (t.ntk ? _frEur(t.tk) : '—') + '</b><small>' + (t.ntk ? t.ntk + ' ticket' + (t.ntk > 1 ? 's' : '') : 'aucun ticket') + '</small></div>'
    + '<div class="frs-t"><span>Km</span><b>' + (t.ntr ? _frEur(t.ik) : '—') + '</b><small>' + (t.ntr ? _frKm(t.km) : 'aucun trajet') + '</small></div></div>';
  var cible = _fraisMoisCible(nom, cle);
  h += '<div class="frs-act"><button type="button" class="mvbtn mvbtn-principal mvbtn-bureau" data-tuto="plan.frais.ticket" onclick="openPlanFrais(\'ticket\')">' + _frIco('ajout', 18) + '<span>Ticket</span></button>'
    + '<button type="button" class="mvbtn mvbtn-principal mvbtn-bureau" onclick="openPlanFrais(\'trajet\')">' + _frIco('ajout', 18) + '<span>Trajet</span></button></div>';
  if (cible !== cle) h += '<p class="frs-sous">Un frais saisi maintenant part avec la paie de ' + _frMoisNom(cible) + '.</p>';
  h += '<div class="frs-g"><div class="frs-liste"><h4 class="frs-grp">' + mois.charAt(0).toUpperCase() + mois.slice(1) + ' <span>' + t.lignes.length + '</span></h4>'
    + (t.lignes.length ? '<ul class="frs-l">' + t.lignes.map(function (l) { return _frLigneHtml(nom, l, t); }).join('') + '</ul>' : '<p class="frs-vide">Aucun frais ce mois-ci.</p>') + (apres || '') + '</div>'
    + '<div class="frs-cote">' + _frVoitureHtml(F) + _frAnneeHtml(nom, F, cle) + '</div></div>';
  return h + '</div>';
}

// ═══ « POUR LA COMPTA » : LE BLOC DES REMBOURSEMENTS (l'écran, sous les cases de la paie) ═══
// Rendu dans la carte .pf-paie de planning.js (_pfCadreCompta) ; rien si le mois n'a aucun frais.
function _fraisCompta(nom, y, m) {
  var t = _fraisMois(nom, _frCle(y, m));
  if (!t.lignes.length) return '';
  var cl = function (l, v, p, cls) { return '<div class="pf-cl frs-cl' + (cls ? ' ' + cls : '') + '"><span class="pf-cl-l">' + l + '</span><span class="pf-cl-v"><span>' + v + '</span></span>' + (p ? '<p class="pf-cl-p">' + p + '</p>' : '') + '</div>'; };
  var F = _fraisLire(nom), v = F.voiture;
  return '<div class="frs-sep">Remboursements, hors salaire</div>'
    + cl('Frais avancés', t.ntk ? _frEur(t.tk) : 'aucun', t.ntk ? t.ntk + ' ticket' + (t.ntk > 1 ? 's' : '') + ', joints au relevé' + (t.manq ? ' · ' + t.manq + ' manquant' + (t.manq > 1 ? 's' : '') : '') : '')
    + cl('Indemnités km', t.ntr ? _frEur(t.ik) : 'aucune', t.ntr ? _frKm(t.km) + (t.C.taux ? ' · taux du domaine' : (v ? ' · ' + (FRAIS_CV[_frCv(v.cv)] || '') + ' ' + (FRAIS_EN[v.energie] || '') + ' · barème fiscal' : '')) : '')
    + cl('À rembourser', _frEur(t.tot), '', 'frs-tot');
}
// La phrase de la carte « Envoi à la compta », quand le mois est figé.
function _fraisFigeTexte(nom, y, m) { var fg = _fraisFige(nom, _frCle(y, m)); return (fg && fg.frais && fg.frais.tot > 0) ? ', ' + _frEur(fg.frais.tot) + ' de frais' : ''; }

// ═══ LE RELEVÉ IMPRIMÉ : LE BLOC DU CADRE, ET LA PAGE DES FRAIS ═══
// Le cadre « Pour la compta » du papier (planning.js, _planReleveFiche_) : trois lignes, rien si aucun frais.
function _fraisReleveCadre(nom, y, m) {
  var t = _fraisMois(nom, _frCle(y, m));
  if (!t.lignes.length) return '';
  var r = function (l, v) { return '<div class="cl"><span class="cl-l">' + l + '</span><span class="cl-v">' + v + '</span></div>'; };
  return '<div class="frs-rb"><p class="frs-rbt">Remboursements, hors salaire</p>' + r('Frais avancés', t.ntk ? _frEur(t.tk) : 'aucun') + r('Indemnités km', t.ntr ? _frEur(t.ik) : 'aucune') + r('À rembourser', _frEur(t.tot)) + '</div>';
}
// La page des frais : rend {html, css} ; html vide si le mois n'a aucun frais.
function _fraisRelevePage(nom, y, m) {
  var cle = _frCle(y, m), t = _fraisMois(nom, cle), F = _fraisLire(nom), v = F.voiture;
  if (!t.lignes.length) return { html: '', css: '' };
  var tk = t.lignes.filter(function (l) { return l.t === 'ticket'; }), tr = t.lignes.filter(function (l) { return l.t === 'trajet'; }), h = '';
  h += '<h4 class="frs-h">Tickets et paiements</h4>';
  if (tk.length) {
    h += '<table class="frs-tab"><thead><tr><th>N°</th><th>Date</th><th>Pour quoi</th><th>Motif</th><th>Payé</th><th class="n">dont TVA</th><th class="n">Montant</th></tr></thead><tbody>';
    tk.forEach(function (l, i) {
      var cat = FRAIS_CATS.filter(function (c) { return c[0] === l.cat; })[0];
      h += '<tr><td>' + (i + 1) + '</td><td>' + _frJour(l.date) + '</td><td>' + (cat ? cat[1] : 'Autre') + '</td><td>' + _escHtml(l.motif || '') + (l.photo ? '' : ' <span class="frs-manque">(ticket manquant)</span>') + '</td><td>' + (l.paye === 'especes' ? 'espèces' : 'carte') + '</td>'
        + '<td class="n">' + (typeof l.tva === 'number' ? _frEur(l.tva) : '—') + '</td><td class="n">' + _frEur(l.montant) + '</td></tr>';
    });
    h += '</tbody><tfoot><tr><td colspan="6">Total des tickets</td><td class="n">' + _frEur(t.tk) + '</td></tr></tfoot></table>';
  } else h += '<p class="frs-nt">Aucun.</p>';
  h += '<h4 class="frs-h">Indemnités kilométriques</h4>';
  if (tr.length) {
    h += '<table class="frs-tab"><thead><tr><th>Date</th><th>Où et pourquoi</th><th class="n">Km</th><th class="n">Montant</th></tr></thead><tbody>';
    tr.forEach(function (l) { var c = t.C.L[l.id] || { km: 0, mt: 0 }; h += '<tr><td>' + _frJour(l.date) + '</td><td>' + _escHtml(l.motif || '') + '</td><td class="n">' + _frKm(c.km) + '</td><td class="n">' + _frEur(c.mt) + '</td></tr>'; });
    h += '</tbody><tfoot><tr><td colspan="2">Total des km</td><td class="n">' + _frKm(t.km) + '</td><td class="n">' + _frEur(t.ik) + '</td></tr></tfoot></table>';
    h += '<p class="frs-nt">' + (v ? 'Voiture : ' + (v.modele ? _escHtml(v.modele) + ', ' : '') + (FRAIS_CV[_frCv(v.cv)] || '') + ', ' + (FRAIS_EN[v.energie] || '') + ' ; carte grise au nom ' + (v.carte === 'foyer' ? 'de son foyer' : 'du salarié') + (v.carteGrise ? ' (jointe)' : ' (à joindre)') + '. ' : '')
      + (t.C.taux ? 'Taux du domaine : ' + _frCoef(t.C.taux) + ' € le km.' : 'Barème fiscal publié le ' + FRAIS_BAREME.publie + ' (revenus ' + FRAIS_BAREME.revenus + '), le palier lu sur les km de l’année : ' + _frKm(t.C.cumul) + ' payés en ' + cle.slice(0, 4) + '.') + '</p>';
  } else h += '<p class="frs-nt">Aucun trajet.</p>';
  h += '<div class="frs-total"><span>À rembourser avec la paie de ' + _frMoisNom(cle) + '</span><b>' + _frEur(t.tot) + '</b></div>';
  if (tk.length) {
    h += '<h4 class="frs-h">Justificatifs</h4><div class="frs-annexe">' + tk.map(function (l, i) {
      var p = l.photo, img = (p && p.url) ? '<img src="' + _escAttr(p.url) + '" alt="Ticket ' + (i + 1) + '">' : '<span class="frs-vign' + (p ? ' ok' : '') + '">' + (p ? 'photo jointe' : 'ticket manquant') + '</span>';
      return '<figure>' + img + '<figcaption>' + (i + 1) + ' · ' + _frEur(l.montant) + '</figcaption></figure>';
    }).join('') + '</div>';
  }
  var css = '.frs-h{font-size:var(--pt-micro,11px);font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#57534E;margin:10px 0 4px}'
    + '.frs-tab{width:100%;border-collapse:collapse}.frs-tab th,.frs-tab td{text-align:left;padding:3px 5px;border-bottom:1px solid #E7E5E4;vertical-align:top}'
    + '.frs-tab th{font-weight:700;color:#57534E;border-bottom:1.5px solid #1C1917}.frs-tab .n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}'
    + '.frs-tab tfoot td{font-weight:700;border-bottom:0;border-top:1.5px solid #1C1917}.frs-manque{color:#9C4E14;font-weight:700}.frs-nt{color:#57534E;margin-top:4px}'
    + '.frs-total{display:flex;justify-content:space-between;align-items:baseline;margin-top:10px;padding:6px 10px;border:1.5px solid #1C1917;border-radius:8px}.frs-total b{font-size:var(--pt-md,20px)}'
    + '.frs-annexe{display:flex;flex-wrap:wrap;gap:8px}.frs-annexe figure{width:44mm;margin:0;text-align:center;color:#57534E;break-inside:avoid;page-break-inside:avoid}'
    + '.frs-annexe img{width:44mm;height:58mm;object-fit:contain;border:1px solid #D6D3D1;border-radius:3px;background:#FAFAF9;display:block}'
    + '.frs-vign{width:44mm;height:58mm;display:flex;align-items:center;justify-content:center;border:1.5px dashed #D6D3D1;border-radius:3px;color:#9C4E14;font-weight:700}'
    + '.frs-vign.ok{color:#57534E;border-style:solid}'
    + '.frs-rb{border-top:1.5px solid #1C1917;margin-top:4px;padding-top:4px}.frs-rbt{font-weight:700;color:#57534E;margin-bottom:2px}';
  return { html: h, css: css };
}

// ═══ LA FENÊTRE DE SAISIE (ovPlanFrais) : un ticket, un trajet, la voiture ═══
// ★ AJOUR-1 : une saisie (FORMULAIRE) — son enregistrement la ferme, la fiche dessous se repeint (_pl2Refresh).
var _pfr = null;   // le brouillon : {nom, type, id?, d:{…}, blob?, carteBlob?, envoi?}
function _frCtx() { return (typeof window._planFicheCtx === 'function') ? window._planFicheCtx() : null; }
function openPlanFrais(type, id) {
  if (!isAdmin()) return;
  var ctx = _frCtx(); if (!ctx || !ctx.nom) return;
  var F = _fraisLire(ctx.nom), cle = _frCle(ctx.y, ctx.m);
  if (type === 'trajet' && !F.voiture && !id) type = 'voiture-puis';   // la puissance fait le taux : la voiture d'abord
  var d;
  if (id) {
    var l = F.lignes.filter(function (x) { return x.id === id; })[0];
    if (!l || _fraisFige(ctx.nom, l.mois)) return;
    d = { date: l.date || _frAuj(), motif: l.motif || '' };
    if (l.t === 'ticket') { d.cat = l.cat || 'autre'; d.montant = String(_frNum(l.montant)).replace('.', ','); d.tva = (typeof l.tva === 'number') ? String(l.tva).replace('.', ',') : ''; d.paye = l.paye === 'especes' ? 'especes' : 'cb'; d.photo = l.photo || null; }
    else d.km = String(_frNum(l.km)).replace('.', ',');
    type = l.t;
  } else if (type === 'ticket') d = { date: _frAuj(), motif: '', cat: 'achat', montant: '', tva: '', paye: 'cb', photo: null };
  else if (type === 'trajet') d = { date: _frAuj(), motif: '', km: '' };
  else { var v = F.voiture || {}; d = { modele: v.modele || '', cv: _frCv(v.cv) || 5, energie: FRAIS_EN[v.energie] ? v.energie : 'essence', carte: v.carte === 'foyer' ? 'foyer' : 'personne', carteGrise: v.carteGrise || null }; }
  _pfr = { nom: ctx.nom, cle: cle, type: type, id: id || null, d: d, blob: null, carteBlob: null, envoi: false };
  _frPeindre();
  var ov = document.getElementById('ovPlanFrais'); if (ov) ov.classList.add('open');
}
function closePlanFrais() { _pfr = null; var ov = document.getElementById('ovPlanFrais'); if (ov) ov.classList.remove('open'); }
function _frChips(champ, liste, val) {
  return '<div class="mvbtn-choix frs-choix" role="group">' + liste.map(function (o) {
    var on = String(o[0]) === String(val);
    return '<button type="button" class="mvbtn mvbtn-option mvbtn-compact' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-c="' + _escAttr(champ) + '" data-v="' + _escAttr(o[0]) + '" onclick="planFraisChoix(this.dataset.c,this.dataset.v)">' + o[1] + '</button>';
  }).join('') + '</div>';
}
function _frValide() {
  var D = _pfr; if (!D || D.envoi) return false;
  var d = D.d;
  if (D.type === 'ticket') return _frNum(d.montant) > 0 && String(d.motif || '').trim().length > 0 && !!d.date;
  if (D.type === 'trajet') return _frNum(d.km) > 0 && String(d.motif || '').trim().length > 0 && !!d.date && !!_fraisLire(D.nom).voiture;
  return !!_frCv(d.cv) && !!FRAIS_EN[d.energie];
}
// L'aperçu du montant d'un trajet en cours de saisie : après les trajets déjà saisis de l'année (une modification garde sa place).
function _frApercu() {
  var D = _pfr, F = _fraisLire(D.nom), v = F.voiture, km = Math.max(0, _frNum(D.d.km));
  if (!v) return '<div class="frs-calc"><p class="frs-al">' + _frIco('alerte', 16) + '<span>Pas de voiture déclarée : la puissance fait le taux.</span></p></div>';
  if (!(km > 0)) return '<div class="frs-calc"><div class="frs-r"><span>Km</span><b>à saisir</b></div></div>';
  var mois = D.id ? (F.lignes.filter(function (x) { return x.id === D.id; })[0] || {}).mois : _fraisMoisCible(D.nom, D.cle);
  var C = _fraisCalcAnnee(D.nom, String(mois).slice(0, 4)), avant = (D.id && C.L[D.id]) ? C.L[D.id].avant : C.cumul, elec = v.energie === 'electrique', mt;
  if (C.taux) mt = _frR2(km * C.taux); else mt = _frR2(_fraisBareme(v.cv, elec, avant + km) - _fraisBareme(v.cv, elec, avant));
  var p1 = _fraisPalier(avant + 0.001), p2 = _fraisPalier(avant + km);
  return '<div class="frs-calc">' + (C.taux ? '<div class="frs-r"><span>Taux du domaine</span><b>' + _frCoef(C.taux) + ' € le km</b></div>'
    : '<div class="frs-r"><span>Km payés en ' + String(mois).slice(0, 4) + ' : ' + _frKm(avant) + ' → ' + _frKm(avant + km) + '</span><b>palier ' + (p1 === p2 ? p1 : p1 + ' puis ' + p2) + '</b></div>')
    + '<div class="frs-r frs-rt"><span>' + (FRAIS_CV[_frCv(v.cv)] || '') + ' ' + (FRAIS_EN[v.energie] || '') + (C.taux ? '' : ' · barème fiscal') + '</span><b>' + _frEur(mt) + '</b></div></div>';
}
function _frPeindre() {
  var D = _pfr; if (!D) return;
  var b = document.getElementById('pfr-body'), t = document.getElementById('pfr-t'), s = document.getElementById('pfr-s'), f = document.getElementById('pfr-foot');
  if (!b) return;
  var d = D.d, h = '', titre;
  if (D.type === 'ticket') {
    titre = D.id ? 'Le ticket' : 'Nouveau ticket';
    var ph = D.blob || d.photo;
    h += '<div class="frs-photo' + (ph ? ' prise' : '') + '">' + _frIco(ph ? 'check' : 'recu', 22) + '<span class="frs-q"><b>' + (ph ? 'Photo jointe' : 'La photo du ticket') + '</b><span class="frs-s">' + (ph ? 'Jointe au relevé imprimé.' : 'Elle part avec le relevé, pour la compta.') + '</span></span>'
      + '<label class="mvbtn mvbtn-secondaire mvbtn-compact">' + (ph ? 'Reprendre' : 'Photographier') + '<input type="file" class="frs-file" accept="image/*" capture="environment" onchange="planFraisPhoto(this,\'ticket\')"></label></div>';
    h += '<div class="frs-duo"><label class="frs-c"><span>Montant</span><input type="text" class="mvchamp frs-gros-in" inputmode="decimal" placeholder="0,00" data-k="montant" data-tuto="plan.frais.montant" oninput="planFraisChamp(this)"></label>'
      + '<label class="frs-c"><span>Date</span><input type="date" class="mvchamp" data-k="date" max="' + _frAuj() + '" oninput="planFraisChamp(this)"></label></div>';
    h += '<div class="frs-c"><span>Pour quoi</span>' + _frChips('cat', FRAIS_CATS, d.cat) + '<p class="frs-s">Le carburant de sa propre voiture passe par les km.</p></div>';
    h += '<label class="frs-c"><span>Motif</span><input type="text" class="mvchamp" maxlength="100" placeholder="Ex. attaches de palissage" data-k="motif" data-tuto="plan.frais.motif" oninput="planFraisChamp(this)"></label>';
    h += '<div class="frs-duo"><div class="frs-c"><span>Payé avec</span>' + _frChips('paye', [['cb', 'Sa carte'], ['especes', 'Espèces']], d.paye) + '</div>'
      + '<label class="frs-c"><span>dont TVA, si indiquée</span><input type="text" class="mvchamp" inputmode="decimal" placeholder="—" data-k="tva" oninput="planFraisChamp(this)"></label></div>';
  } else if (D.type === 'trajet') {
    titre = D.id ? 'Le trajet' : 'Nouveau trajet';
    h += '<div class="frs-duo"><label class="frs-c"><span>Km en plus</span><input type="text" class="mvchamp frs-gros-in" inputmode="decimal" placeholder="0" data-k="km" oninput="planFraisChamp(this)"></label>'
      + '<label class="frs-c"><span>Date</span><input type="date" class="mvchamp" data-k="date" max="' + _frAuj() + '" oninput="planFraisChamp(this)"></label></div>';
    h += '<p class="frs-s">Les km faits pour le travail avec sa voiture, en plus de son trajet habituel.</p>';
    h += '<label class="frs-c"><span>Où et pourquoi</span><input type="text" class="mvchamp" maxlength="100" placeholder="Ex. échantillons au labo de Beaune" data-k="motif" oninput="planFraisChamp(this)"></label>';
    h += '<div id="pfr-calc">' + _frApercu() + '</div>';
  } else {
    titre = 'Sa voiture';
    if (D.type === 'voiture-puis') h += '<p class="frs-s">D’abord sa voiture : la puissance fait le taux. Le trajet suit.</p>';
    h += '<label class="frs-c"><span>Modèle, facultatif</span><input type="text" class="mvchamp" maxlength="30" placeholder="Ex. Clio" data-k="modele" oninput="planFraisChamp(this)"></label>';
    h += '<div class="frs-c"><span>Puissance</span>' + _frChips('cv', [[3, '3 CV et moins'], [4, '4 CV'], [5, '5 CV'], [6, '6 CV'], [7, '7 CV et plus']], d.cv) + '<p class="frs-s">Case P.6 de la carte grise.</p></div>';
    h += '<div class="frs-c"><span>Énergie</span>' + _frChips('energie', [['essence', 'Essence'], ['diesel', 'Diesel'], ['hybride', 'Hybride'], ['electrique', '100 % électrique']], d.energie) + '<p class="frs-s">Électrique : +20 %. Hybride : le barème des voitures.</p></div>';
    h += '<div class="frs-c"><span>Carte grise au nom</span>' + _frChips('carte', [['personne', 'Du salarié'], ['foyer', 'De son foyer']], d.carte) + '</div>';
    var cg = D.carteBlob || d.carteGrise;
    h += '<div class="frs-photo' + (cg ? ' prise' : '') + '">' + _frIco(cg ? 'check' : 'document', 22) + '<span class="frs-q"><b>' + (cg ? 'Carte grise jointe' : 'La carte grise') + '</b><span class="frs-s">À garder en cas de contrôle.</span></span>'
      + '<label class="mvbtn mvbtn-secondaire mvbtn-compact">' + (cg ? 'Reprendre' : 'Photographier') + '<input type="file" class="frs-file" accept="image/*" capture="environment" onchange="planFraisPhoto(this,\'carte\')"></label></div>';
  }
  b.innerHTML = '<div class="frs-form">' + h + '</div>';
  // ★ §24 n°5 : les valeurs se posent en JS après innerHTML (iOS, et aucune saisie ne passe par un attribut).
  b.querySelectorAll('[data-k]').forEach(function (el) { var k = el.getAttribute('data-k'); el.value = (d[k] == null) ? '' : String(d[k]); });
  if (t) t.textContent = titre;
  if (s) s.textContent = D.nom + (D.type === 'voiture' || D.type === 'voiture-puis' ? '' : ' · part avec la paie de ' + _frMoisNom(D.id ? ((_fraisLire(D.nom).lignes.filter(function (x) { return x.id === D.id; })[0] || {}).mois || D.cle) : _fraisMoisCible(D.nom, D.cle)));
  if (f) f.innerHTML = (D.id ? '<button type="button" class="mvbtn mvbtn-discret mvbtn-bureau" onclick="planFraisSuppr()">Supprimer</button>' : '')
    + '<button type="button" class="mvbtn mvbtn-secondaire mvbtn-bureau" onclick="closePlanFrais()">Annuler</button>'
    + '<button type="button" class="mvbtn mvbtn-principal mvbtn-bureau" id="pfr-ok" data-tuto="plan.frais.ok" onclick="planFraisEnregistrer()"' + (_frValide() ? '' : ' disabled') + '>' + (D.envoi ? 'Envoi de la photo…' : (D.id || D.type !== 'ticket' && D.type !== 'trajet' ? 'Enregistrer' : 'Ajouter')) + '</button>';
}
function planFraisChamp(el) {
  if (!_pfr || !el) return;
  _pfr.d[el.getAttribute('data-k')] = String(el.value || '');
  if (_pfr.type === 'trajet') { var c = document.getElementById('pfr-calc'); if (c) c.innerHTML = _frApercu(); }
  var ok = document.getElementById('pfr-ok'); if (ok) ok.disabled = !_frValide();
}
function planFraisChoix(champ, v) {
  if (!_pfr) return;
  _pfr.d[champ] = (champ === 'cv') ? (parseInt(v, 10) || 5) : String(v);
  _frPeindre();
}
// La photo : réduite comme celle d'un signalement (window._mvPhotoReduire, app.js), envoyée à l'enregistrement.
function planFraisPhoto(inp, quoi) {
  var f = inp && inp.files && inp.files[0]; if (!f || !_pfr) return;
  var reduire = window._mvPhotoReduire;
  if (typeof reduire !== 'function') return;
  reduire(f, function (blob) {
    if (!_pfr) return;
    if (!blob) { showToast('Photo illisible ou trop lourde', '#B23B1E'); return; }
    if (quoi === 'carte') _pfr.carteBlob = blob; else _pfr.blob = blob;
    _frPeindre();
  });
}
function _frId() { return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
// Une photo à envoyer : rend une promesse de {url, path} ; {demo:1} là où rien ne s'envoie (démo, préparation) ; null si l'envoi échoue.
function _frEnvoyer(id, blob) {
  if (!blob) return Promise.resolve(undefined);
  if (typeof window.fbFraisPermis !== 'function' || !window.fbFraisPermis()) return Promise.resolve({ demo: 1 });
  return window.fbFraisPhoto(id, blob);
}
function _frFini(msg) {
  closePlanFrais();
  if (typeof window.fbSaveToast === 'function') window.fbSaveToast({ planning_hsup: window.PLANNING_HSUP }, msg, '#3D6B27');
  else if (typeof window.fbSave === 'function') window.fbSave('planning_hsup', window.PLANNING_HSUP);
  if (typeof window._pl2Refresh === 'function') window._pl2Refresh();
}
function planFraisEnregistrer() {
  if (!isAdmin() || !_frValide()) return;
  var D = _pfr, d = D.d;
  // ★ §24 n°23 : tout se construit et se contrôle À PART ; on écrit en mémoire ensemble, à la fin.
  if (D.type === 'voiture' || D.type === 'voiture-puis') {
    var v = { modele: String(d.modele || '').trim().slice(0, 30), cv: _frCv(d.cv), energie: d.energie, carte: d.carte === 'foyer' ? 'foyer' : 'personne', carteGrise: d.carteGrise || null };
    var puis = D.type === 'voiture-puis', idc = _frId();
    D.envoi = !!D.carteBlob; _frPeindre();
    _frEnvoyer('carte-' + idc, D.carteBlob).then(function (r) {
      if (!_pfr || _pfr !== D) return;
      if (r !== undefined) { if (r) v.carteGrise = r; else showToast('Carte grise non envoyée (réseau ?) : reprenez-la plus tard', '#B23B1E'); }
      _fraisConteneur(D.nom).voiture = v;
      if (puis) {
        if (typeof window.fbSave === 'function') window.fbSave('planning_hsup', window.PLANNING_HSUP);
        _pfr = { nom: D.nom, cle: D.cle, type: 'trajet', id: null, d: { date: _frAuj(), motif: '', km: '' }, blob: null, carteBlob: null, envoi: false };
        _frPeindre(); if (typeof window._pl2Refresh === 'function') window._pl2Refresh();
        return;
      }
      _frFini('Voiture de ' + D.nom + ' enregistrée');
    });
    return;
  }
  var F = _fraisLire(D.nom), old = D.id ? F.lignes.filter(function (x) { return x.id === D.id; })[0] : null;
  if (D.id && (!old || _fraisFige(D.nom, old.mois))) { closePlanFrais(); return; }
  var id = D.id || _frId(), mois = old ? old.mois : _fraisMoisCible(D.nom, D.cle);
  var l = { id: id, n: old ? old.n : (F.lignes.reduce(function (m, x) { return Math.max(m, x.n || 0); }, 0) + 1), t: D.type, mois: mois, date: String(d.date || _frAuj()).slice(0, 10), motif: String(d.motif || '').trim().slice(0, 100) };
  if (D.type === 'ticket') {
    var tva = String(d.tva || '').trim();
    l.cat = FRAIS_CATS.some(function (c) { return c[0] === d.cat; }) ? d.cat : 'autre';
    l.montant = _frR2(_frNum(d.montant)); l.tva = tva === '' ? null : _frR2(_frNum(tva)); l.paye = d.paye === 'especes' ? 'especes' : 'cb'; l.photo = d.photo || null;
  } else {
    var vv = F.voiture || {};
    l.km = Math.round(_frNum(d.km) * 10) / 10; l.cv = old && old.cv ? old.cv : _frCv(vv.cv); l.elec = old ? !!old.elec : vv.energie === 'electrique';
  }
  D.envoi = !!D.blob; _frPeindre();
  _frEnvoyer(id, D.blob).then(function (r) {
    if (!_pfr || _pfr !== D) return;
    if (r !== undefined) {
      if (r) { l.photo = r; if (old && old.photo && old.photo.path && old.photo.path !== r.path && typeof window.fbFraisPhotoSuppr === 'function') window.fbFraisPhotoSuppr(old.photo.path); }
      else showToast('Photo non envoyée (réseau ?) : reprenez-la depuis la ligne', '#B23B1E');
    }
    var C = _fraisConteneur(D.nom), i = C.lignes.findIndex(function (x) { return x.id === id; });
    if (i >= 0) C.lignes[i] = l; else C.lignes.push(l);
    _frFini((D.type === 'ticket' ? 'Ticket ' : 'Trajet ') + (old ? 'modifié' : 'ajouté') + ' · part avec la paie de ' + _frMoisNom(mois));
  });
}
// ★ ANNULER-1 (§471) : un frais supprimé se répare — le geste part tout de suite, « Annuler » le remet à sa place. Sa photo
//   ne s'efface du serveur qu'une fois le toast passé (six secondes, plus une marge), et seulement si la ligne n'est pas revenue.
function _frPlusTard(f) { setTimeout(f, 8000); }   // les 6 s du toast « Annuler » (MV_ANNULER_MS), plus une marge
function planFraisSuppr() {
  if (!isAdmin() || !_pfr || !_pfr.id) return;
  var D = _pfr, C = _fraisConteneur(D.nom), i = -1;
  C.lignes.forEach(function (x, k) { if (x.id === D.id) i = k; });
  var l = i >= 0 ? C.lignes[i] : null;
  if (!l || _fraisFige(D.nom, l.mois)) { closePlanFrais(); return; }
  C.lignes.splice(i, 1);
  var nom = D.nom, dit = (l.t === 'ticket' ? 'Ticket' : 'Trajet') + ' supprimé';
  var revenue = function () { return _fraisLire(nom).lignes.some(function (x) { return x.id === l.id; }); };
  if (l.photo && l.photo.path) _frPlusTard(function () { if (!revenue() && typeof window.fbFraisPhotoSuppr === 'function') window.fbFraisPhotoSuppr(l.photo.path); });
  if (typeof window.showToastAnnuler !== 'function') { _frFini(dit); return; }
  _frFini('');
  window.showToastAnnuler(dit, function () {
    var C2 = _fraisConteneur(nom);
    if (revenue() || _fraisFige(nom, l.mois)) return;
    C2.lignes.splice(Math.min(i, C2.lignes.length), 0, l);
    _frFini('');
  });
}

// ═══ LA ROUE DU PLANNING : LE TAUX DU DOMAINE (facultatif) ═══
var _frTauxEdit = false;   // « Taux du domaine » touché : le champ s'ouvre, rien n'est écrit avant un taux
function _fraisCadreHtml() {
  var t = _fraisTaux(), ouvert = !!t || _frTauxEdit;
  return '<div class="plan-sec-lbl">Indemnités kilométriques</div>'
    + '<div class="plan-card frs-cadre">'
    + '<div class="mvbtn-choix" role="group"><button type="button" class="mvbtn mvbtn-option mvbtn-compact' + (ouvert ? '' : ' on') + '" aria-pressed="' + !ouvert + '" onclick="planFraisTaux(\'bareme\')">Barème fiscal</button>'
    + '<button type="button" class="mvbtn mvbtn-option mvbtn-compact' + (ouvert ? ' on' : '') + '" aria-pressed="' + ouvert + '" onclick="planFraisTaux(\'domaine\')">Taux du domaine</button></div>'
    + (ouvert ? '<label class="frs-c"><span>€ par km</span><input type="text" class="mvchamp" id="frs-taux" inputmode="decimal" placeholder="Ex. 0,50" value="' + (t ? _escAttr(String(t).replace('.', ',')) : '') + '" onchange="planFraisTaux(\'taux\')"></label>'
      + (t > FRAIS_BAREME.v[3][0] ? '<p class="frs-s frs-or">Au-dessus du barème fiscal pour certaines voitures : l’excédent entre dans les cotisations.</p>' : '')
      : '<p class="frs-s">Publié le ' + FRAIS_BAREME.publie + ' (revenus ' + FRAIS_BAREME.revenus + ') : selon la puissance de la voiture et les km de l’année.</p>')
    + '</div>';
}
function planFraisTaux(mode) {
  if (!isAdmin()) return;
  var c = window.CONFIG = window.CONFIG || {}, msg;
  if (mode === 'domaine') { _frTauxEdit = true; if (typeof window._planRenderCadre === 'function') window._planRenderCadre(); return; }
  if (mode === 'bareme') { _frTauxEdit = false; if (!('frais_km' in c)) { if (typeof window._planRenderCadre === 'function') window._planRenderCadre(); return; } delete c.frais_km; msg = 'Indemnités km : barème fiscal'; }
  else {
    var el = document.getElementById('frs-taux'), v = el ? _frNum(el.value) : 0;
    if (!(v > 0 && v < 5)) { showToast('Un taux entre 0 et 5 € le km', '#B23B1E'); return; }
    c.frais_km = Math.round(v * 1000) / 1000; msg = 'Indemnités km : ' + _frCoef(c.frais_km) + ' € le km';
  }
  if (typeof window.saveData === 'function') window.saveData('config', msg, '#3D6B27');
  else if (typeof window.fbSaveToast === 'function') window.fbSaveToast({ config: c }, msg, '#3D6B27');
  if (typeof window._planRenderCadre === 'function') window._planRenderCadre();
  if (typeof window._pl2Refresh === 'function') window._pl2Refresh();
}

// ── Les gestes et les lecteurs, exposés (planning.js et les onclick les lisent par window) ──
window._fraisBareme      = _fraisBareme;
window._fraisCalcAnnee   = _fraisCalcAnnee;
window._fraisMois        = _fraisMois;
window._fraisInstantane  = _fraisInstantane;
window._pfFrais          = _pfFrais;
window._fraisCompta      = _fraisCompta;
window._fraisFigeTexte   = _fraisFigeTexte;
window._fraisReleveCadre = _fraisReleveCadre;
window._fraisRelevePage  = _fraisRelevePage;
window._fraisCadreHtml   = _fraisCadreHtml;
window.openPlanFrais     = openPlanFrais;
window.closePlanFrais    = closePlanFrais;
window.planFraisChamp    = planFraisChamp;
window.planFraisChoix    = planFraisChoix;
window.planFraisPhoto    = planFraisPhoto;
window.planFraisEnregistrer = planFraisEnregistrer;
window.planFraisSuppr    = planFraisSuppr;
window.planFraisTaux     = planFraisTaux;
