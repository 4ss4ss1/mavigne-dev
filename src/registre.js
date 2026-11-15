// =============================================================================
// Ma Vigne — LE REGISTRE, VÉRIFIÉ AVANT L'EXPORT (src/registre.js) — REG27-1B (§573)
// -----------------------------------------------------------------------------
// « Le contrôle avant le contrôleur » (docs/maquettes/maquette-niveau-au-dessus-v1.html, partie 5). L'arrêté du 24 décembre
// 2025 veut un registre électronique complet au 1er janvier 2027. Ce fichier relit, LIGNE PAR LIGNE, ce que l'export écrira
// (window._phytoCsvRows, phyto.js : on vérifie ce qui sort, pas une copie du calcul) et dit ce qui manque :
//   · ce que le texte EXIGE sur chaque ligne — SIRET (14 chiffres), produit, numéro d'AMM (7 chiffres), date, dose et unité,
//     localisation, surface traitée ;
//   · ce qu'il exige SOUS CONDITION — les horaires « lorsque la réglementation ou l'AMM le prévoit » (ici : un insecticide,
//     ou un produit du catalogue marqué « horaires »), le stade quand l'emploi du produit y est limité (marqué « stade »),
//     la rentrée anticipée quand il y en a une : son délai doit se compter (heure de fin connue, moment après la fin et
//     avant la fin du délai), son motif et ses protections être dits ;
//   · ce qui est FACULTATIF — la cible, le mode d'application, le stade hors condition : compté, jamais reproché.
// Deux lecteurs : la carte « Le registre <année> » de Pilotage › Conformité (window._regCarte), et la fenêtre « avant
// l'export » (window._regOuvrir), que le bouton d'export ouvre de lui-même quand une ligne est à compléter. Une ligne
// touchée ouvre la fiche du traitement. Rien ne s'enregistre ici ; l'export reste toujours possible (« Exporter quand
// même ») : le registre reflète ce qui a été fait. phyto.js importe ce fichier en tête.
// © 2026 Nicolas GUÉRET / GUERETTECH
// =============================================================================
import { isAdmin, showToast, _escHtml, _escAttr, _mvIcon } from './utils.js';

// Les colonnes du fichier lues ici (MV_PHY_CSV_COLS, phyto.js) — mv-harnais-reg27b tient le rang de chacune.
var RG = { PRODUIT: 2, AMM: 3, DATE: 4, HD: 5, HF: 6, DELAI: 7, DOSE: 8, UNITE: 9, CIBLE: 10, MODE: 11, LAT: 12, LNG: 13, SURF: 14, BBCH: 16, PARC: 18, SURFP: 22 };
// Ce qui peut manquer sur une ligne : son nom à l'écran, et s'il tient à la parcelle (on la nomme) ou au traitement.
var RG_LBL = {
  date: ['date du traitement', 0], produit: ['nom du produit', 0], amm: ['numéro d’AMM à 7 chiffres', 0], dose: ['dose et unité', 0], horaires: ['horaires de début et de fin', 0],
  stade: ['stade', 0], cible: ['cible', 0], mode: ['mode d’application', 0],
  parcelle: ['parcelle', 0], gps: ['coordonnées', 1], surface: ['surface traitée', 1],
  rfin: ['rentrée anticipée : l’heure de fin du traitement', 0], ravant: ['rentrée notée avant la fin du traitement', 1],
  rapres: ['rentrée notée au-delà du délai', 1], rmotif: ['rentrée anticipée : motif ou protections', 1],
  rtexte: ['rentrée anticipée en texte libre : à redéclarer sur la fiche', 0]
};
function _regCat(t) { var C = window.CATALOGUE || []; for (var i = 0; i < C.length; i++) { if (C[i] && t && C[i].nom === t.produit) return C[i]; } return null; }
// ── ★ REG27-2 (§575) : LES PRODUITS QUE LE DOMAINE A MARQUÉS ──
// Le texte veut les horaires « lorsque la réglementation ou l'AMM le prévoit », le stade quand l'emploi du produit y est
// limité. E-Phy ne le dit pas ; l'étiquette, si. L'administrateur le coche sur la fiche du produit (Phyto › Catalogue), et la
// marque vit dans la configuration du domaine, par numéro d'AMM :
//   CONFIG.phyto_oblig = { '2000006': { h: 1, s: 1, nom: 'KARATE ZEON' } }     (h : horaires · s : stade)
// Trois lecteurs : l'assistant de traitement (_pMeta, phyto.js : « *requis »), les deux règles ci-dessous (la vérification
// avant l'export), et le bloc de la fiche du produit. Avant ce lot, la marque n'existait que sur la liste de départ écrite
// dans app.js, cherchée par NOM exact : un produit choisi dans E-Phy ne la portait jamais.
window._regOblig = function (amm) {
  var M = (window.CONFIG && window.CONFIG.phyto_oblig) || {}, o = M[String(amm == null ? '' : amm).trim()];
  return { h: !!(o && o.h), s: !!(o && o.s) };
};
function _regAmm(t) { var m = (typeof window._phResolve === 'function') ? window._phResolve(t) : (t || {}); return String((m && m.amm) || (t && t.amm) || '').trim(); }
// Les horaires sont dus pour un insecticide (la règle de l'assistant de traitement), un produit que le domaine a marqué, ou un
// produit de la liste de départ marqué « horaires ».
function _regHeureRequise(t) { var m = (typeof window._phResolve === 'function') ? window._phResolve(t) : { type: t && t.type }, c = _regCat(t); return String(m.type || '') === 'Insecticide' || !!(c && c.heureOblig) || window._regOblig(_regAmm(t)).h; }
function _regStadeRequis(t) { var c = _regCat(t); return !!(c && c.stadeOblig) || window._regOblig(_regAmm(t)).s; }
function _regObligLigne(amm, cle, on, fige, adm, txt, note) {
  var corps = '<span style="flex:1;min-width:0"><span style="display:block;font-size:var(--pt-txt,13px);font-weight:600;color:var(--texte)">' + _escHtml(txt) + '</span>'
    + '<span style="display:block;font-size:var(--pt-micro,12px);color:var(--texte-doux);line-height:1.4;margin-top:1px">' + _escHtml(note) + '</span></span>';
  if (!adm || fige) return '<div data-reg-oblig-ligne="' + _escAttr(cle) + '" style="display:flex;align-items:center;gap:10px;padding:8px 0">'
    + '<span style="flex-shrink:0;color:var(--vert);display:inline-flex">' + _mvIcon('check', 18) + '</span>' + corps + '</div>';
  return '<label data-reg-oblig-ligne="' + _escAttr(cle) + '" style="display:flex;align-items:center;gap:10px;min-height:44px;padding:4px 0;cursor:pointer">'
    + '<input type="checkbox"' + (on ? ' checked' : '') + ' onchange="window._regObligBasculer(\'' + _escAttr(amm) + '\',\'' + _escAttr(cle) + '\')" style="flex-shrink:0;width:20px;height:20px;accent-color:var(--vert,#3D6B27)">'
    + corps + '</label>';
}
// Le bloc de la fiche du produit. L'administrateur coche ; les autres ne lisent que ce qui est exigé (rien, s'il n'y a rien).
window._regObligHtml = function (p) {
  if (!p || !/^\d{7}$/.test(String(p.amm || ''))) return '';
  var o = window._regOblig(p.amm), ins = String(p.type || '') === 'Insecticide', adm = isAdmin(), h = '';
  if (ins) h += _regObligLigne(p.amm, 'h', true, true, adm, 'Horaires de début et de fin', 'Toujours exigés pour un insecticide.');
  else if (adm || o.h) h += _regObligLigne(p.amm, 'h', o.h, false, adm, 'Horaires de début et de fin', adm ? 'À cocher quand l’étiquette du produit impose des horaires.' : 'Exigés par le domaine pour ce produit.');
  if (adm || o.s) h += _regObligLigne(p.amm, 's', o.s, false, adm, 'Stade de la vigne', adm ? 'À cocher quand l’emploi du produit est limité à un stade.' : 'Exigé par le domaine pour ce produit.');
  if (!h) return '';
  return '<div class="mvencadre" data-reg-oblig="' + _escAttr(p.amm) + '" style="margin:0 0 12px"><div class="oed-l">Au registre, à chaque traitement</div>' + h
    + (adm ? '<div style="font-size:var(--pt-micro,12px);color:var(--texte-doux);line-height:1.5;margin-top:6px">Coché, l’assistant de traitement le demande et la vérification du registre signale une ligne où il manque — pour les traitements déjà saisis aussi.</div>' : '')
    + '</div>';
};
// Le geste : cocher ou décocher. La marque vide sort de la configuration ; chaque fiche ouverte de ce produit est repeinte.
window._regObligBasculer = function (amm, cle) {
  amm = String(amm == null ? '' : amm).trim();
  if (!isAdmin()) { showToast('Réservé aux administrateurs', '#C0392B'); return; }
  if (!/^\d{7}$/.test(amm) || (cle !== 'h' && cle !== 's')) return;
  var C = window.CONFIG = window.CONFIG || {}, M = Object.assign({}, C.phyto_oblig || {}), o = Object.assign({}, M[amm] || {});
  var p = null, E = window.EPHY || []; for (var i = 0; i < E.length; i++) { if (E[i] && E[i].amm === amm) { p = E[i]; break; } }
  if (o[cle]) delete o[cle]; else o[cle] = 1;
  if (o.h || o.s) { if (p && p.nom) o.nom = p.nom; M[amm] = o; } else delete M[amm];
  C.phyto_oblig = M;
  if (window.saveData) window.saveData('config', (o[cle] ? (cle === 'h' ? 'Horaires exigés' : 'Stade exigé') : (cle === 'h' ? 'Horaires non exigés' : 'Stade non exigé')) + (p && p.nom ? ' — ' + p.nom : ''));
  if (p && typeof document !== 'undefined' && document.querySelectorAll) {
    var B = document.querySelectorAll('[data-reg-oblig="' + amm + '"]');
    for (var k = 0; k < B.length; k++) B[k].outerHTML = window._regObligHtml(p);
  }
};
// Les rentrées anticipées d'UNE parcelle d'un traitement, et ce qui cloche dans chacune.
function _regRentrees(t, nom, delaiCellule, M) {
  var RT = (typeof window._phRentrees === 'function') ? window._phRentrees(t) : [];
  RT = RT.filter(function (r) { return !nom || !r.parcelles || !r.parcelles.length || r.parcelles.indexOf(nom) >= 0; });
  if (!RT.length) { if (String(delaiCellule || '').trim() && !/^\d{2,}:\d{2}$/.test(String(delaiCellule).trim())) M.push('rtexte'); return 0; }
  var dre = (typeof window._phDreSession === 'function') ? window._phDreSession(t) : 0;
  RT.forEach(function (r) {
    var min = (typeof window._phRentreeDelaiMin === 'function') ? window._phRentreeDelaiMin(t, r.quand) : null;
    if (min == null) M.push('rfin'); else if (min <= 0) M.push('ravant'); else if (dre > 0 && min >= dre * 60) M.push('rapres');
    if (!String(r.motif || '').trim() || !String(r.mesures || '').trim()) M.push('rmotif');
  });
  return RT.length;
}
function _regUniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

// LA VÉRIFICATION d'une fenêtre de dates ({ k, lbl, d0, d1 } ; sans bornes : tout le registre).
// → { fen, siretOk, sansDate, nLignes, nTrait, nManque (lignes à compléter), nTraitManque, m:{clé:lignes}, c:{clé:lignes},
//     nPartie, nHeureReq, nRentrees, lignes:[{ i (rang dans TRAITEMENTS), nom, M:[…], C:[…] }] }
window._regVerif = function (fen) {
  var R = (typeof window._phytoCsvRows === 'function') ? window._phytoCsvRows(fen) : { rows: [], src: [] };
  var T = window.TRAITEMENTS || [], rows = R.rows || [], src = R.src || [];
  var V = { fen: fen || null, siretOk: /^\d{14}$/.test(String(R.siret || '')), sansDate: R.sansDate || 0, nLignes: rows.length, nTrait: 0, nManque: 0, nTraitManque: 0,
    m: {}, c: {}, nPartie: 0, nHeureReq: 0, nRentrees: 0, lignes: [] };
  var vus = {}, aRevoir = {};
  rows.forEach(function (r, k) {
    var s = src[k] || {}, t = T[s.i] || {}, nom = String(r[RG.PARC] || '').trim(), M = [], C = [];
    if (!vus[s.i]) { vus[s.i] = 1; V.nTrait++; }
    if (!String(r[RG.PRODUIT] || '').trim()) M.push('produit');
    if (!/^\d{7}$/.test(String(r[RG.AMM] || '').trim())) M.push('amm');
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(String(r[RG.DATE] || ''))) M.push('date');
    if (r[RG.DOSE] === '' || !String(r[RG.UNITE] || '').trim()) M.push('dose');
    if (!nom) M.push('parcelle'); else if (r[RG.LAT] === '' || r[RG.LNG] === '') M.push('gps');
    if (r[RG.SURF] === '') M.push('surface'); else if (r[RG.SURFP] !== '' && r[RG.SURF] !== r[RG.SURFP]) V.nPartie++;
    if (_regHeureRequise(t)) { V.nHeureReq++; if (!r[RG.HD] || !r[RG.HF]) M.push('horaires'); }
    if (r[RG.BBCH] === '') { if (_regStadeRequis(t)) M.push('stade'); else C.push('stade'); }
    if (_regRentrees(t, nom, r[RG.DELAI], M)) V.nRentrees++;
    if (!String(r[RG.CIBLE] || '').trim()) C.push('cible');
    if (!String(r[RG.MODE] || '').trim()) C.push('mode');
    M = _regUniq(M);
    M.forEach(function (x) { V.m[x] = (V.m[x] || 0) + 1; });
    C.forEach(function (x) { V.c[x] = (V.c[x] || 0) + 1; });
    if (M.length) { V.nManque++; if (!aRevoir[s.i]) { aRevoir[s.i] = 1; V.nTraitManque++; } }
    if (M.length || C.length) V.lignes.push({ i: s.i, nom: nom, M: M, C: C });
  });
  return V;
};
function _regPl(n, un, des) { return n + '\u00a0' + (n > 1 ? des : un); }
// Le verdict, en une phrase : { ok, vide, txt }.
window._regVerdict = function (V) {
  if (!V || !V.nLignes) return { ok: false, vide: true, txt: 'Aucun traitement sur cette période' };
  if (!V.siretOk) return { ok: false, txt: 'Le SIRET du domaine manque : chaque ligne doit le porter' };
  if (!V.nManque && V.sansDate) return { ok: false, txt: _regPl(V.sansDate, 'traitement sans date', 'traitements sans date') + '\u00a0: hors du fichier' };
  if (!V.nManque) return { ok: true, txt: 'Prêt pour le contrôle' };
  return { ok: false, txt: 'Prêt pour le contrôle, à ' + _regPl(V.nManque, 'ligne', 'lignes') + ' près' };
};
// Les huit points de la carte (la maquette) : { t, s, n, niv } — niv : ok, manque (le texte l'exige), conseil (facultatif), rien.
function _regPoints(V) {
  var m = V.m, c = V.c, N = V.nLignes, P = [], n;
  var lg = function (x) { return _regPl(x, 'ligne', 'lignes'); };
  n = Math.max(m.amm || 0, m.produit || 0);
  P.push(!V.siretOk ? { t: 'SIRET, produit, numéro d’AMM à 7 chiffres', n: N, niv: 'manque', s: 'Le SIRET du domaine n’est pas renseigné (Réglages › Domaine)\u00a0: il manque sur chaque ligne.' + (n ? ' Et ' + lg(n) + ' sans numéro d’AMM à 7 chiffres.' : '') }
    : n ? { t: 'SIRET, produit, numéro d’AMM à 7 chiffres', n: n, niv: 'manque', s: lg(n) + ' sans numéro d’AMM à 7 chiffres\u00a0: un produit saisi hors du catalogue E-Phy.' }
      : { t: 'SIRET, produit, numéro d’AMM à 7 chiffres', n: 0, niv: 'ok', s: lg(N) + (N > 1 ? ' complètes' : ' complète') });
  n = Math.max(m.dose || 0, m.date || 0);
  P.push((n || V.sansDate) ? { t: 'Date, dose et unité, culture (VITVI), bio', n: n || V.sansDate, niv: 'manque', s: (n ? lg(n) + ' sans date, sans dose chiffrée ou sans unité.' : '') + (V.sansDate ? (n ? ' ' : '') + _regPl(V.sansDate, 'traitement', 'traitements') + ' sans date\u00a0: hors du fichier, à dater.' : '') }
    : { t: 'Date, dose et unité, culture (VITVI), bio', n: 0, niv: 'ok', s: lg(N) });
  n = (m.gps || 0) + (m.parcelle || 0);
  P.push(n ? { t: 'Localisation de chaque parcelle', n: n, niv: 'manque', s: lg(n) + ' sans coordonnées\u00a0: une parcelle sans contour (Vigne › Carte, importer le contour) ou un traitement sans parcelle.' }
    : { t: 'Localisation de chaque parcelle', n: 0, niv: 'ok', s: 'le point est lu dans le contour de la parcelle' });
  if (m.stade) P.push({ t: 'Stade BBCH', n: m.stade, niv: 'manque', s: lg(m.stade) + ' sans stade, pour un produit dont l’emploi est limité à un stade.' });
  else if (c.stade) P.push({ t: 'Stade BBCH', n: c.stade, niv: 'conseil', s: lg(c.stade) + ' sans stade. Le texte le demande quand l’emploi du produit est limité à un stade\u00a0; avec le relevé des stades, il se propose tout seul.' });
  else P.push({ t: 'Stade BBCH', n: 0, niv: 'ok', s: lg(N) });
  n = m.surface || 0;
  P.push(n ? { t: 'Surface traitée', n: n, niv: 'manque', s: lg(n) + ' sans surface\u00a0: la parcelle n’a pas de surface, ou n’existe plus.' }
    : { t: 'Surface traitée', n: 0, niv: 'ok', s: V.nPartie ? lg(N) + ', dont ' + V.nPartie + ' en partie' : 'la parcelle entière partout — une parcelle traitée en partie se corrige dans la fiche du traitement' });
  n = m.horaires || 0;
  P.push(!V.nHeureReq ? { t: 'Horaires de début et de fin', n: 0, niv: 'rien', s: 'aucun traitement ne les exige (insecticide, mention de l’étiquette)' }
    : n ? { t: 'Horaires de début et de fin', n: n, niv: 'manque', s: lg(n) + ' sans heure de début ou de fin, pour un produit qui les exige (insecticide, mention de l’étiquette).' }
      : { t: 'Horaires de début et de fin', n: 0, niv: 'ok', s: 'renseignés sur les ' + lg(V.nHeureReq) + ' qui les exigent' });
  n = Math.max(m.rfin || 0, m.ravant || 0, m.rapres || 0, m.rmotif || 0, m.rtexte || 0);
  P.push(n ? { t: 'Rentrée anticipée', n: n, niv: 'manque', s: lg(n) + ' à reprendre\u00a0: le délai ne se compte pas (heure de fin, moment), ou la rentrée est restée en texte libre.' }
    : V.nRentrees ? { t: 'Rentrée anticipée', n: 0, niv: 'ok', s: lg(V.nRentrees) + ' avec une rentrée déclarée\u00a0: délai, moment, motif et protections' }
      : { t: 'Rentrée anticipée', n: 0, niv: 'rien', s: 'aucune déclarée sur cette période' });
  n = Math.max(c.cible || 0, c.mode || 0);
  P.push({ t: 'Cible et mode d’application', n: n, niv: n ? 'conseil' : 'ok', s: 'facultatifs au texte' + (n ? ' · ' + lg(n) + ' sans cible ou sans mode' : ' · renseignés partout') });
  return P;
}
window._regPoints = _regPoints;
var RG_NIV = {
  ok: { fond: 'var(--vert-med)', encre: '#fff', etiq: 'mvpas mvpas-fait', mot: 'ok' },
  manque: { fond: 'var(--orange)', encre: '#fff', etiq: 'mvpas mvpas-type mvpas-orange', mot: 'à compléter' },
  conseil: { fond: 'var(--gris-clair)', encre: 'var(--texte-doux)', etiq: 'mvpas mvpas-etiquette', mot: 'facultatif' },
  rien: { fond: 'var(--gris-clair)', encre: 'var(--texte-doux)', etiq: 'mvpas mvpas-etiquette', mot: 'rien à dire' }
};
function _regPointHtml(p) {
  var v = RG_NIV[p.niv] || RG_NIV.rien;
  return '<div style="display:flex;align-items:flex-start;gap:12px;padding:8px 0;border-top:1px solid var(--gris-clair)">'
    + '<span style="flex:0 0 24px;height:24px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:var(--pt-nano,11px);font-weight:600;background:' + v.fond + ';color:' + v.encre + '">' + (p.niv === 'ok' ? _mvIcon('check', 14) : (p.n ? Number(p.n) : '—')) + '</span>'
    + '<div style="flex:1;min-width:0"><div style="font-size:var(--pt-txt,13px);font-weight:600;color:var(--texte)">' + _escHtml(p.t) + '</div>'
    + '<div style="font-size:var(--pt-micro,12px);color:var(--texte-doux);line-height:1.5;margin-top:2px">' + _escHtml(p.s) + '</div></div>'
    + '<span class="' + v.etiq + '" style="flex-shrink:0">' + v.mot + '</span></div>';
}
function _regVerdictHtml(V) {
  var vd = window._regVerdict(V);
  return '<div data-reg="verdict" style="font-size:var(--pt-sm,16px);font-weight:600;margin-bottom:8px;color:' + (vd.ok ? 'var(--vert-med)' : (vd.vide ? 'var(--texte-doux)' : 'var(--orange)')) + '">' + _escHtml(vd.txt) + '</div>';
}
function _regPointsHtml(V) { return _regPoints(V).map(function (p) { return _regPointHtml(p); }).join(''); }

// ── Les lignes à reprendre, traitement par traitement : ce qui manque, puis le facultatif ──
function _regGroupes(V) {
  var G = {}, ordre = [];
  V.lignes.forEach(function (l) {
    var g = G[l.i]; if (!g) { g = G[l.i] = { i: l.i, M: {}, C: {} }; ordre.push(g); }
    l.M.forEach(function (x) { (g.M[x] = g.M[x] || []).push(l.nom); });
    l.C.forEach(function (x) { (g.C[x] = g.C[x] || []).push(l.nom); });
  });
  return ordre;
}
function _regMots(o) {
  return Object.keys(o).map(function (x) {
    var d = RG_LBL[x] || [x, 0], noms = _regUniq(o[x].filter(Boolean));
    return d[0] + ((d[1] && noms.length) ? ' (' + noms.join(', ') + ')' : '');
  }).join(' · ');
}
function _regGroupeHtml(g) {
  var t = (window.TRAITEMENTS || [])[g.i] || {}, m = _regMots(g.M), c = _regMots(g.C);
  var quand = (typeof window._mvFenFr === 'function') ? window._mvFenFr(String(t.date || '').slice(0, 10)) : String(t.date || '');
  return '<button type="button" data-reg="ligne" onclick="window._regAller(' + Number(g.i) + ')" style="display:block;width:100%;text-align:left;background:none;border:none;border-top:1px solid var(--gris-clair);padding:12px 0;cursor:pointer;font-family:inherit;color:inherit;min-height:44px">'
    + '<span style="display:block;font-size:var(--pt-txt,13px);font-weight:600">' + _escHtml(quand) + ' · ' + _escHtml(t.produit || 'Traitement') + '</span>'
    + (m ? '<span style="display:block;font-size:var(--pt-micro,12px);color:var(--orange);font-weight:600;line-height:1.5;margin-top:2px">À compléter\u00a0: ' + _escHtml(m) + '</span>' : '')
    + (c ? '<span style="display:block;font-size:var(--pt-micro,12px);color:var(--texte-doux);line-height:1.5;margin-top:2px">Facultatif\u00a0: ' + _escHtml(c) + '</span>' : '')
    + '</button>';
}
var RG_MAX = 40;   // au-delà, la fenêtre dit combien restent : une liste de 300 lignes ne se lit pas
function _regLignesHtml(V) {
  var G = _regGroupes(V), dus = G.filter(function (g) { return Object.keys(g.M).length > 0; }), fac = G.filter(function (g) { return !Object.keys(g.M).length; });
  var bloc = function (L) { return L.slice(0, RG_MAX).map(function (g) { return _regGroupeHtml(g); }).join('') + (L.length > RG_MAX ? '<div style="font-size:var(--pt-micro,12px);color:var(--texte-doux);padding:8px 0">… et ' + Number(L.length - RG_MAX) + ' autres traitements.</div>' : ''); };
  var h = '';
  if (dus.length) h += '<div style="font-size:var(--pt-nano,11px);font-weight:600;color:var(--texte-doux);margin-top:16px">' + _escHtml(_regPl(dus.length, 'traitement à reprendre', 'traitements à reprendre')) + ' — touchez-en un pour ouvrir sa fiche</div>' + bloc(dus);
  if (fac.length) h += '<details style="margin-top:12px"><summary style="cursor:pointer;font-size:var(--pt-micro,12px);color:var(--texte-doux)">' + _escHtml(_regPl(fac.length, 'traitement', 'traitements')) + ' où seul du facultatif manque</summary>' + bloc(fac) + '</details>';
  return h;
}

// ── La fenêtre « avant l'export » ──
function _regOv() {
  var ov = document.getElementById('ovRegVerif'); if (ov) return ov;
  ov = document.createElement('div'); ov.id = 'ovRegVerif'; ov.className = 'overlay';
  ov.setAttribute('onclick', "closeOv(event,'ovRegVerif')");
  ov.innerHTML = '<div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div>'
    + '<div class="modal-hd"><div class="modal-title" id="rgv-title">Le registre, avant l’export</div><div class="modal-sub" id="rgv-sub"></div></div>'
    + '<div class="modal-body"><div id="rgv-body"></div>'
    + '<button type="button" class="mbtn verte" id="rgv-exp" style="margin-top:18px"></button>'
    + '<button type="button" class="mbtn" style="width:100%;margin-top:8px;cursor:pointer" onclick="closeOv(null,\'ovRegVerif\')">Fermer</button>'
    + '</div></div>';
  document.body.appendChild(ov);
  return ov;
}
function _regFen(k) { var F = (typeof window._phytoFenetres === 'function') ? window._phytoFenetres() : []; for (var i = 0; i < F.length; i++) { if (F[i] && F[i].k === k) return F[i]; } return null; }
// L'année de la carte : l'année civile en cours dès qu'elle a un traitement, sinon la précédente tant qu'elle en a (la règle de l'IFT).
function _regAnnee() {
  var y = new Date().getFullYear(), a = {};
  (window.TRAITEMENTS || []).forEach(function (t) { var s = String((t && t.date) || '').slice(0, 4); if (/^\d{4}$/.test(s)) a[s] = 1; });
  return (a[y] || !a[y - 1]) ? y : y - 1;
}
function _regFenAn(an) {
  var d0 = an + '-01-01', d1 = an + '-12-31', F = (typeof window._phytoFenetres === 'function') ? window._phytoFenetres() : [];
  for (var i = 0; i < F.length; i++) { if (F[i] && F[i].d0 === d0 && F[i].d1 === d1) return F[i]; }
  return { k: 'civ' + an, axe: 'annee', lbl: 'Année ' + an, sub: '', d0: d0, d1: d1 };
}
// Faut-il s'arrêter avant de télécharger ? Oui dès qu'une ligne est à compléter, ou que le SIRET manque.
window._regBloque = function (fen) { var V = window._regVerif(fen); return !!(V.nLignes && (V.nManque || !V.siretOk || V.sansDate)); };
window._regOuvrir = function (k) {
  if (!isAdmin()) { showToast('Réservé aux administrateurs', '#C0392B'); return; }
  var fen = _regFen(k); if (!fen) return;
  var V = window._regVerif(fen), vd = window._regVerdict(V), ov = _regOv();
  var su = ov.querySelector('#rgv-sub'); if (su) su.textContent = fen.lbl + (V.nLignes ? ' · ' + _regPl(V.nTrait, 'traitement', 'traitements') + ' · ' + _regPl(V.nLignes, 'ligne', 'lignes') : '');
  var bd = ov.querySelector('#rgv-body'); if (bd) bd.innerHTML = _regVerdictHtml(V) + (V.nLignes ? _regPointsHtml(V) + _regLignesHtml(V) : '');
  var bx = ov.querySelector('#rgv-exp');
  if (bx) { bx.style.display = V.nLignes ? '' : 'none'; bx.innerHTML = _mvIcon('check', 16) + ' ' + (vd.ok ? 'Exporter le registre' : 'Exporter quand même'); bx.setAttribute('onclick', "_phytoExportCsv('" + _escAttr(fen.k) + "',1)"); }
  window.openOv('ovRegVerif');
};
// Une ligne touchée : la fenêtre se ferme, la fiche du traitement s'ouvre (on y corrige, ou on y déclare).
window._regAller = function (i) {
  window.closeOv(null, 'ovRegVerif');
  if (typeof window.openTraitDetail === 'function' && (window.TRAITEMENTS || [])[i]) window.openTraitDetail(i);
};
// La carte de Pilotage › Conformité : { an, k, V, verdict, corps } — pilotage.js l'habille (_pilPanelPhyto).
window._regCarte = function () {
  var an = _regAnnee(), fen = _regFenAn(an), V = window._regVerif(fen), vd = window._regVerdict(V);
  var corps = _regVerdictHtml(V) + (V.nLignes ? _regPointsHtml(V) : '')
    + ((V.nLignes && isAdmin()) ? '<button type="button" data-reg="ouvrir" class="mvbtn mvbtn-secondaire" style="margin-top:12px" onclick="window._regOuvrir(\'' + _escAttr(fen.k) + '\')"><span>' + (vd.ok ? 'Exporter le registre ' : 'Voir les lignes et exporter ') + Number(an) + '</span></button>' : '')
    + '<div style="font-size:var(--pt-micro,12px);color:var(--texte-doux);line-height:1.5;margin-top:12px">Le registre d’une année se met au format électronique avant le 31 janvier de l’année suivante (sous 30 jours dès 2030)\u00a0; un contrôleur peut le demander sous dix jours ouvrables.</div>';
  return { an: an, k: fen.k, V: V, verdict: vd, corps: corps };
};

// ════ ★ REGDEC-1 (§576) : CE QUI SORT — le fichier du registre, ses périodes, son panneau ════
// Déplacé de phyto.js sans en réécrire une ligne (la preuve est dans le §576) : les cinq fonctions restées là-bas — la saisie,
// la fiche, la rentrée anticipée — sont lues par window, parce qu'un nom d'un autre module n'existe pas après le build (§24).
// ══════════════════════════════════════════════════════════════════════
// REGISTRE PHYTOSANITAIRE — EXPORT AU FORMAT ÉLECTRONIQUE (CSV, ouvrable dans Excel)
// ──────────────────────────────────────────────────────────────────────
// Base : règlement d'exécution (UE) 2023/564, arrêté du 24 décembre 2025 (annexe I
// pour le contenu, annexe II cas A pour le format d'un traitement de surfaces).
// Le PDF ne suffit pas : le texte exige un fichier STRUCTURÉ, dont un logiciel peut
// extraire chaque donnée. Un PDF imprimé n'en est pas un.
//
// ⚠️ UNE LIGNE PAR PRODUIT ET PAR PARCELLE : la localisation est demandée pour chaque
//    surface traitée, donc un traitement portant quatre parcelles produit quatre lignes.
// ⚠️ Localisation par COORDONNÉES GPS (option prévue par le texte pour une parcelle sans
//    référence au registre parcellaire graphique). L'app ne connaît pas les numéros d'îlot
//    RPG : plutôt que des colonnes vides, on fournit le point GPS, qui est exigible seul.
// ★ REG27-1A (§572) — « Cible » et « Mode d'application » (facultatifs au texte) sont SAISIS au traitement depuis ce lot :
//    la cible par produit (proposée : la dernière du produit, ou l'usage E-Phy unique — jamais choisie à la place du
//    vigneron), le mode pour la cuve. Un traitement d'avant les laisse vides : rien n'est inventé.
// ★ REG27-1A — « Surface traitée (ha) » : les hectares saisis quand une parcelle ne l'a été qu'en partie, sinon la parcelle
//    entière (window._mvSurfT). Avant ce lot, la colonne s'appelait « Surface de la parcelle (ha) » : l'app ne savait pas
//    la surface partielle, et écrire la parcelle entière sous l'étiquette « traitée » aurait été une sur-déclaration. La
//    surface de la parcelle reste en colonne supplémentaire : on voit d'un coup d'œil ce qui ne l'a été qu'en partie.
// ★ REG27-1A — « Délai de rentrée anticipée » (HH:MM) : le délai entre la fin du traitement et la rentrée DÉCLARÉE sur la
//    fiche (_phRentreeOuvrir), pour la parcelle de la ligne ; plusieurs rentrées : la plus précoce, les autres dans les
//    colonnes supplémentaires (moment, motif, mesures — ce que l'annexe I demande). Une ancienne saisie libre (« DRE
//    anticipé ») sort telle qu'elle a été tapée.
// ⚠️ FENÊTRE DE DATES : le bouton ouvre un choix (exercice en cours / campagne
//    consultée / tout le registre). Remettre l'historique entier pour un contrôle qui
//    porte sur un exercice, c'est remettre une pièce illisible. Le nom du fichier
//    porte la fenêtre, sinon deux exports différents se ressemblent sur le disque.
// ⚠️ Séparateur POINT-VIRGULE + BOM UTF-8 + décimale à la virgule : c'est ce qui fait
//    qu'Excel en français ouvre le fichier en colonnes, et non en une seule.
// ══════════════════════════════════════════════════════════════════════
// Code OEPP de la vigne (Vitis vinifera) — dénomination de culture exigée par l'annexe II.
var MV_OEPP_VIGNE = 'VITVI';

function _phCsvCell(v){
  var s = (v==null) ? '' : String(v);
  return '"' + s.replace(/"/g,'""').replace(/\r?\n/g,' ') + '"';
}
function _phCsvNum(n, dec){
  // ⚠️ Number(null) vaut 0 : sans ce garde, une surface non renseignée sortirait
  // « 0,0000 ha » au registre, c'est-à-dire une déclaration fausse. Vide est honnête.
  if(n===null || n===undefined || n==='') return '';
  var x = Number(n);
  if(!isFinite(x)) return '';
  return x.toFixed(dec==null?2:dec).replace('.', ',');
}
// AAAA-MM-JJ -> JJ/MM/AAAA (format prescrit).
function _phCsvDate(iso){
  var a = String(iso||'').split('-');
  if(a.length!==3) return String(iso||'');
  return a[2]+'/'+a[1]+'/'+a[0];
}
// « 6h », « 6:30 », « 06h30 » -> HH:MM. Le texte libre est rendu tel quel s'il ne parle pas.
function _phCsvHeure(h){
  var s = String(h==null?'':h).trim();
  if(!s) return '';
  var m = /(\d{1,2})\s*[:hH]\s*(\d{2})/.exec(s);
  if(m) return (m[1].length<2?'0':'')+m[1]+':'+m[2];
  var m2 = /^(\d{1,2})\s*[hH]?$/.exec(s);
  if(m2) return (m2[1].length<2?'0':'')+m2[1]+':00';
  return s;
}
// Le stade est saisi « Floraison (BBCH 60–69) » : l'annexe demande les deux chiffres.
function _phCsvBbch(stade){
  var m = /BBCH\s*(\d{1,2})/.exec(String(stade||''));
  if(!m) return '';
  return (m[1].length<2?'0':'')+m[1];
}
// Dose : dose_val/dose_unit quand ils existent, sinon lecture du texte « 8 L/ha ».
function _phCsvDose(t){
  if(t && typeof t.dose_val === 'number' && isFinite(t.dose_val)) return { val:t.dose_val, unit:(t.dose_unit||'') };
  var txt = String((t&&t.dose)||'').trim();
  if(!txt) return { val:null, unit:'' };
  var m = /^(-?\d+(?:[.,]\d+)?)\s*(.*)$/.exec(txt);
  if(!m) return { val:null, unit:txt };
  return { val: parseFloat(m[1].replace(',','.')), unit: (m[2]||'').trim() };
}
// Colonnes, dans l'ordre de l'annexe II. Les quatre dernières sortent du texte : il les
// autorise expressément, « à condition de ne pas porter atteinte à la lisibilité ».
var MV_PHY_CSV_COLS = ['SIRET d\u00e9tenteur','SIRET b\u00e9n\u00e9ficiaire','Produit','Num\u00e9ro d\u2019autorisation (AMM)',
  'Date d\u2019utilisation','Horaire de d\u00e9but','Horaire de fin','D\u00e9lai de rentr\u00e9e anticip\u00e9e',
  'Dose de produit utilis\u00e9e','Unit\u00e9 de dose','Cible','Mode d\u2019application',
  'Latitude (WGS84)','Longitude (WGS84)','Surface trait\u00e9e (ha)',
  'D\u00e9nomination de la culture (OEPP)','Stade ph\u00e9nologique (BBCH)','Conduite biologique',
  'Parcelle','Substance active','Applicateur','Observations',
  'Surface de la parcelle (ha)','Rentr\u00e9e anticip\u00e9e \u2014 moment','Rentr\u00e9e anticip\u00e9e \u2014 motif','Rentr\u00e9e anticip\u00e9e \u2014 mesures de protection'];

// Jour d'un traitement, normalise en 'AAAA-MM-JJ' ou '' si la date ne parle pas.
// ⚠️ Une chaine vide comparee a des bornes ISO passerait pour une date anterieure a
//    tout : le registre perdrait des lignes en silence. On la traite a part.
function _phCsvJour(t){
  var s = String((t&&t.date)||'').slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

// ── Fenetres de dates proposees avant le telechargement ───────────────────
// Une fenetre = { k, lbl, sub, d0, d1 } ; d0/d1 absents = aucune borne.
// ⚠️ Une option n'est proposee QUE si sa source existe ET porte deux dates : une
//    periode sans debut/fin est invisible pour toute la chaine (bug d'onboarding
//    deja vecu), et un export vide sans explication est pire que pas d'option.
// ⚠️ Repli complet : si utils.js ne fournit pas _mvExercice, l'option disparait et
//    « tout le registre » reste toujours la — le bouton ne peut jamais rester muet.
// \u2605\u2605\u2605 AXE-1 \u2014 LES FENETRES VIENNENT DE utils.js, ELLES NE SONT PLUS DEFINIES ICI.
// Deux defauts corriges d'un coup :
//   \u2460 la ligne « Campagne consultee » nommait CAMPAGNE une PERIODE de travail.
//     Trois sens pour un mot, dans une app ou le bilan et les Archives en ont un
//     quatrieme. Un vigneron qui sortait « la campagne » ici et « la campagne »
//     la-bas obtenait deux perimetres, sans qu'aucun ecran ne le dise.
//   \u2461 la vraie campagne (l'axe des Archives) n'etait pas proposee du tout.
// \u26a0\ufe0f Repli local conserve, comportement de l'ancienne version, si utils.js est
//   anterieur a ce lot : un phyto.js neuf sur un utils.js ancien ne plante pas.
// ★ REG27-1B (§573) — L'ANNÉE CIVILE EN TÊTE DE LISTE : c'est l'année du registre (l'arrêté du 24 décembre 2025 compte « l'année
//   suivant celle de l'utilisation » pour la mise au format électronique), et celle de la carte « Le registre » de Conformité.
//   Deux : la courante et la précédente (en janvier, c'est l'année passée qu'on remet). Une fenêtre aux mêmes dates qu'une de
//   la liste — un exercice comptable du 1er janvier — n'est pas redite.
function _phytoFenAnnees(L){
  var y=new Date().getFullYear(), out=[];
  [y,y-1].forEach(function(a,i){
    var d0=a+'-01-01', d1=a+'-12-31';
    if(L.some(function(f){ return f&&f.d0===d0&&f.d1===d1; })) return;
    out.push({ k:'civ'+a, axe:'annee', lbl:'Ann\u00e9e '+a+(i===0?' (en cours)':''), sub:'du 01/01/'+a+' au 31/12/'+a+' \u2014 l\u2019ann\u00e9e du registre', d0:d0, d1:d1 });
  });
  return out.concat(L);
}
function _phytoFenetres(){
  if(typeof window._mvFenetresAnnee === 'function'){
    try{
      var L = window._mvFenetresAnnee({campagnes:3, exercices:2});
      if(L && L.length) return _phytoFenAnnees(L);
    }catch(e){ if(window.logError) window.logError({level:'info',cat:'phyto',msg:'liste des fenetres illisible \u2014 repli local'}); }
  }
  var out = [];
  if(typeof window._mvExercice === 'function'){
    var ex = null;
    try{ ex = window._mvExercice(); }catch(e2){ ex = null; }
    if(ex && ex.d0 && ex.d1){
      out.push({ k:'ex', axe:'exercice', lbl:'Exercice en cours',
                 sub:(ex.lbl || (_phCsvDate(ex.d0)+' \u2192 '+_phCsvDate(ex.d1))),
                 d0:ex.d0, d1:ex.d1 });
    }
  }
  var nom = (typeof window._visuSaison === 'function') ? window._visuSaison() : '';
  var s   = (nom && typeof window._saisonObj === 'function') ? window._saisonObj(nom) : null;
  if(s && s.debut && s.fin){
    out.push({ k:'per', axe:'periode', lbl:'P\u00e9riode de travail \u2014 '+nom,
               sub:'du '+_phCsvDate(s.debut)+' au '+_phCsvDate(s.fin),
               d0:s.debut, d1:s.fin });
  }
  out.push({ k:'tout', axe:'tout', lbl:'Tout le registre', sub:'depuis la mise en service', d0:'', d1:'' });
  return _phytoFenAnnees(out);
}
window._phytoFenetres = _phytoFenetres;
// Nombre de TRAITEMENTS dans une fenetre (pas de lignes : on ne construit rien ici).
// ⚠️ Volontairement leger — un comptage complet a chaque ouverture du panneau
//    ressemblerait a « le bouton ne marche pas ».
function _phytoFenCompte(f){
  var d0=(f&&f.d0)||'', d1=(f&&f.d1)||'', n=0;
  (window.TRAITEMENTS||[]).forEach(function(t){
    if(!d0 || !d1){ n++; return; }
    var j = _phCsvJour(t);
    if(j && j>=d0 && j<=d1) n++;
  });
  return n;
}
// Gardes communes aux DEUX portes d'entree (panneau de choix et telechargement).
// ⚠️ Une seule definition : deux copies divergeraient au premier correctif.
function _phytoExportGarde(){
  var adm=false;
  try{ adm=(typeof window.isAdmin==='function')&&window.isAdmin(); }catch(e){ adm=false; }
  if(!adm){ showToast('R\u00e9serv\u00e9 aux administrateurs','#C0392B'); return false; }
  if(!(window.TRAITEMENTS||[]).length){ showToast('Aucun traitement \u00e0 exporter','#B85A1A'); return false; }
  if(typeof window.dlFile!=='function'){ showToast('T\u00e9l\u00e9chargement indisponible sur cet appareil','#C0392B'); return false; }
  return true;
}

// Construction du tableau de lignes. Séparée du téléchargement pour être exécutable seule.
// ⚠️ `fen` est OPTIONNEL : sans argument, comportement strictement identique a
//    l'origine (tout le registre, aucun filtre). Zero regression sur l'existant.
window._phytoCsvRows = function(fen){
  var fd0=(fen&&fen.d0)||'', fd1=(fen&&fen.d1)||'', borne=!!(fd0&&fd1);
  var sansDate = 0;
  var T = (window.TRAITEMENTS||[]).slice().sort(function(a,b){ return String(a.date||'').localeCompare(String(b.date||'')); });
  if(borne){
    T = T.filter(function(t){
      var j = _phCsvJour(t);
      if(!j){ sansDate++; return false; }
      return (j>=fd0 && j<=fd1);
    });
  }
  var C = window.CONFIG || {};
  var siret = String(C.siret||'').replace(/[^0-9]/g,'');
  var bioDom = !!C.bio;
  // ★ REG27-1B (§573) : `src` dit, pour chaque ligne, de quel traitement elle vient (son rang dans TRAITEMENTS) et sa
  //   parcelle — la vérification avant l'export (registre.js) relit CES lignes et renvoie à la fiche du traitement.
  var out = [], src = [], sansGeo = 0, TOUS = window.TRAITEMENTS||[];
  T.forEach(function(t){
    var rang = TOUS.indexOf(t);
    var m = (typeof window._phResolve==='function') ? window._phResolve(t) : {};
    var d = _phCsvDose(t);
    var bbch = _phCsvBbch(t.stade);
    var bio = (bioDom || t.modeAb) ? 'oui' : 'non';
    var RT = window._phRentrees(t);
    window._phCsvParcs(t).forEach(function(nom){
      var p = null;
      if(nom){
        var L = window.PARCELLES||[];
        for(var i=0;i<L.length;i++){ if(L[i] && L[i].nom===nom){ p=L[i]; break; } }
      }
      var g = (p && typeof window._mvParcGeo==='function') ? window._mvParcGeo(p) : null;
      if(!g) sansGeo++;
      // La surface traitée : les hectares saisis, sinon la parcelle entière ; vide si rien ne la dit (jamais « 0 »).
      var sp = p ? window._phParcHa(nom) : 0;
      var st = (nom && typeof window._mvSurfT==='function') ? window._mvSurfT(t, nom, sp) : sp;
      // Les rentrées déclarées sur CETTE parcelle (sans liste : toutes), la plus précoce en tête.
      var rs = RT.filter(function(r){ return !nom || !r.parcelles || !r.parcelles.length || r.parcelles.indexOf(nom)>=0; });
      var jn = function(f){ return rs.map(f).join(' | '); };
      out.push([
        siret, '', (t.produit||''), (m.amm||t.amm||''),
        _phCsvDate(t.date), _phCsvHeure(t.heureDebut), _phCsvHeure(t.heureFin), (rs.length ? window._phRentreeDelai(t, rs[0]) : (t.dreAnticipe||'')),
        (d.val==null?'':_phCsvNum(d.val,3)), (d.unit||''), (t.cible||''), (t.mode||''),
        (g?_phCsvNum(g.lat,5):''), (g?_phCsvNum(g.lng,5):''), (st>0?_phCsvNum(st,4):''),
        MV_OEPP_VIGNE, bbch, bio,
        (nom||''), (m.sub||t.sub||''), (t.conducteur||t.operateur||''), (t.note||''),
        (sp>0?_phCsvNum(sp,4):''),
        jn(function(r){ return _phCsvDate(String(r.quand).slice(0,10))+' '+String(r.quand).slice(11,16); }),
        jn(function(r){ return r.motif||''; }), jn(function(r){ return r.mesures||''; })
      ]);
      src.push({ i: rang, nom: (nom||'') });
    });
  });
  return { rows: out, src: src, sansGeo: sansGeo, siret: siret, sansDate: sansDate, d0: fd0, d1: fd1 };
};

// Panneau de choix de la fenetre. Ouvert par le bouton d'export (appel sans argument),
// donc index.html n'a pas a etre touche. Porte aussi l'AIDE : ce que contient la
// colonne de surface, dit au seul moment ou la question se pose.
// \u2605 AXE-1 : `cible` vaut 'csv' (defaut, comportement d'origine) ou 'pdf'.
// Le PDF sortait SANS AUCUNE BORNE en se titrant « Campagne <nom de la periode
// active> » \u2014 un registre reglementaire de cinq ans presente comme une annee.
// Les deux documents passent desormais par la meme question et la meme liste.
function _phytoExportChoix(cible){
  if(!_phytoExportGarde()) return;
  var pdf = (cible === 'pdf');
  var ovId = 'ovPhytoExport';
  var ov = document.getElementById(ovId);
  if(!ov){
    ov = document.createElement('div'); ov.id = ovId; ov.className = 'overlay';
    ov.setAttribute('onclick', "closeOv(event,'"+ovId+"')");
    // ★ REG27-1B (§573) : la feuille prend la forme commune (.modal). Elle portait des classes sans aucun style (.ov-panel,
    //   .ov-hd…) : pas de fond, le titre posé en haut à gauche de l'écran, les périodes flottant sur la page.
    ov.innerHTML = '<div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div>'
      + '<div class="modal-hd"><div class="modal-title" id="phx-title">Exporter le registre</div></div>'
      + '<div class="modal-body"><div id="phx-body"></div>'
      + '<button type="button" class="mbtn" onclick="closeOv(null,\'ovPhytoExport\')" style="width:100%;margin-top:8px;cursor:pointer">Annuler</button>'
      + '</div></div>';
    document.body.appendChild(ov);
  }
  var F = _phytoFenetres();
  var h = '<div style="font-size:var(--pt-micro,12px);color:var(--texte-doux);line-height:1.5;margin-bottom:14px">Sur quelle p\u00e9riode ?</div>';
  F.forEach(function(f, i){
    var n = _phytoFenCompte(f);
    var acc = (i===0);
    var _k = (typeof _escAttr==='function') ? _escAttr(f.k) : String(f.k);
    var appel = pdf ? ("exportPDFPhyto('"+_k+"')") : ("_phytoExportCsv('"+_k+"')");
    h += `<button onclick="${appel}" style="width:100%;display:block;text-align:left;background:var(--bg-card);border:1.5px solid ${acc?'#5A2D8E':'var(--gris)'};border-radius:12px;padding:14px 16px;margin-bottom:10px;cursor:pointer;font-family:var(--font-ui,Outfit,sans-serif);min-height:44px">
      <span style="display:block;font-size:var(--pt-base,14px);font-weight:600;color:var(--texte)">${_escHtml(f.lbl)}</span>
      <span style="display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:3px;line-height:1.4">${_escHtml(f.sub)}</span>
      <span style="display:block;font-size:var(--pt-micro,11px);color:${n?'#5A2D8E':'var(--texte-doux)'};font-weight:600;margin-top:5px">${n} traitement${n>1?'s':''}</span>
    </button>`;
  });
  h += `<div class="mvencadre" style="margin-top:4px">
      <div style="font-size:9px;color:var(--texte-doux);font-weight:600;margin-bottom:6px">\u00c0 savoir</div>
      <div style="font-size:var(--pt-micro,11px);color:var(--texte-doux);line-height:1.5">La colonne \u00ab\u00a0Surface trait\u00e9e (ha)\u00a0\u00bb reprend les hectares saisis au traitement\u00a0: la parcelle enti\u00e8re, sauf si vous l\u2019avez corrig\u00e9e. Un traitement qui n\u2019a couvert qu\u2019une partie d\u2019une parcelle se corrige dans sa fiche (Modifier) avant l\u2019export. Les rentr\u00e9es anticip\u00e9es d\u00e9clar\u00e9es sur la fiche donnent le d\u00e9lai, le moment, le motif et les protections. Avant le t\u00e9l\u00e9chargement, chaque ligne est relue\u00a0: s\u2019il en manque, la liste s\u2019ouvre d\u2019abord.</div>
    </div>`;
  var body = ov.querySelector('#phx-body');
  if(body) body.innerHTML = h;
  /* \u26a0\ufe0f L'overlay est cree UNE fois puis reutilise : son titre doit etre reecrit
     a chaque ouverture, sinon le second document herite du libelle du premier. */
  var ttl = ov.querySelector('#phx-title');
  if(ttl) ttl.textContent = pdf ? 'Imprimer le registre' : 'Exporter le registre';
  openOv(ovId);
}
window._phytoExportChoix = _phytoExportChoix;

// Sans argument : ouvre le choix de fenetre (c'est le clic sur le bouton d'export).
// Avec une cle de fenetre : construit et telecharge.
// ★ REG27-1B (§573) : avant de télécharger, le registre se relit ligne par ligne (registre.js). Une ligne à compléter, le
//   SIRET ou une date qui manquent : la fenêtre « avant l'export » s'ouvre à la place du téléchargement, dit quoi et où, et
//   garde « Exporter quand même » (`sansVerif`) — le registre reflète ce qui a été fait. Complet : il part comme avant.
window._phytoExportCsv = function(mode, sansVerif){
  if(!_phytoExportGarde()) return;

  var F = _phytoFenetres(), fen = null;
  for(var i=0;i<F.length;i++){ if(F[i].k===mode){ fen = F[i]; break; } }
  if(!fen){ _phytoExportChoix(); return; }
  closeOv(null, 'ovPhytoExport');
  if(!sansVerif && typeof window._regBloque==='function' && typeof window._regOuvrir==='function' && window._regBloque(fen)){ window._regOuvrir(fen.k); return; }
  closeOv(null, 'ovRegVerif');

  var R = window._phytoCsvRows(fen);
  if(!R.rows.length){ showToast('Aucun traitement sur cette p\u00e9riode','#B85A1A'); return; }

  var lines = [MV_PHY_CSV_COLS.map(_phCsvCell).join(';')];
  R.rows.forEach(function(r){ lines.push(r.map(_phCsvCell).join(';')); });
  var csv = '\uFEFF' + lines.join('\r\n') + '\r\n';

  var slug = String(window.DOMAINE_NOM||'domaine').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  var jour = _mvToday();
  // ⚠️ La fenetre est DANS le nom : deux exports du meme registre sur deux periodes
  //    differentes ne doivent pas se ressembler une fois poses sur un bureau.
  var fenNom = (R.d0 && R.d1) ? ('du-'+R.d0+'_au-'+R.d1) : 'complet';
  window.dlFile(csv, 'registre-phyto_'+(slug||'domaine')+'_'+fenNom+'_'+jour+'.csv', 'text/csv;charset=utf-8');

  // Un seul toast, du plus grave au plus anodin. Une ligne ABSENTE du fichier
  // (traitement sans date) passe avant une colonne vide (parcelle hors KML).
  if(!R.siret) showToast('Registre export\u00e9 \u2014 SIRET du domaine manquant (R\u00e9glages \u203a Domaine)','#B85A1A');
  else if(R.sansDate) showToast('Registre export\u00e9 \u2014 '+R.sansDate+' traitement(s) sans date, non inclus','#B85A1A');
  else if(R.sansGeo) showToast('Registre export\u00e9 \u2014 '+R.sansGeo+' ligne(s) sans coordonn\u00e9es (parcelle absente du KML)','#B85A1A');
  else showToast(R.rows.length+' ligne(s) export\u00e9es \u2014 '+String(fen.lbl).toLowerCase(),'#3D6B27');
};
