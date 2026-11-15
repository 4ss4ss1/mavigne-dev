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
// Les horaires sont dus pour un insecticide (la règle de l'assistant de traitement) ou un produit du catalogue marqué « horaires ».
function _regHeureRequise(t) { var m = (typeof window._phResolve === 'function') ? window._phResolve(t) : { type: t && t.type }, c = _regCat(t); return String(m.type || '') === 'Insecticide' || !!(c && c.heureOblig); }
function _regStadeRequis(t) { var c = _regCat(t); return !!(c && c.stadeOblig); }
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
    + '<div style="font-size:var(--pt-txt,13px);font-weight:600">' + _escHtml(quand) + ' · ' + _escHtml(t.produit || 'Traitement') + '</div>'
    + (m ? '<div style="font-size:var(--pt-micro,12px);color:var(--orange);font-weight:600;line-height:1.5;margin-top:2px">À compléter\u00a0: ' + _escHtml(m) + '</div>' : '')
    + (c ? '<div style="font-size:var(--pt-micro,12px);color:var(--texte-doux);line-height:1.5;margin-top:2px">Facultatif\u00a0: ' + _escHtml(c) + '</div>' : '')
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
