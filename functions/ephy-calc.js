/**
 * ════════════════════════════════════════════════════════════════════════
 *  Ma Vigne — functions/ephy-calc.js · FERTI-4 (§461)
 *  Fonctions PURES de la synchro E-Phy (aucun réseau, aucun Firestore) :
 *  lues par functions/ephy.js et par scripts/mv-harnais-ephy-mfsc.mjs.
 *  ⚠️ Pas de require de ce fichier dans functions/index.js : il n'exporte
 *     aucune Cloud Function (comme planning-vues-calc.js).
 * ════════════════════════════════════════════════════════════════════════
 */
'use strict';

function norm(s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[\s_]+/g, ' ').trim();
}

// LE RAPPORT D'UNE MATIÈRE FERTILISANTE À LA VIGNE, lu dans ses lignes d'usage
// (fichier mfsc_et_mixte_usage : « type culture libelle » + « culture commentaire »).
//   'v'   : la vigne est nommée — y compris autrement (« raisin de cuve », « viticulture », « vignoble »)
//   'tc'  : « toutes cultures », ou le type « Traitements généraux » (il n'accompagne que « toutes cultures »)
//   'nc'  : aucune culture renseignée, ou aucune ligne d'usage
//   'non' : des cultures sont nommées, la vigne n'en est pas
// Mesuré sur l'export E-Phy du 24/02/2026 : 925 MFSC autorisées → v 372, tc 125, nc 41, non 387 ;
// le seul mot « vigne » en gardait 364.
const VIGNE_RE = /vigne|viticult|viticole|vignoble|raisin|vitis/;
function classeVigne(lignes) {
  if (!lignes || !lignes.length) return 'nc';
  let tc = false, type = false;
  for (const l of lignes) {
    const t = norm(l && l.type), x = t + ' ' + norm(l && l.com);
    if (VIGNE_RE.test(x)) return 'v';
    if (x.includes('toutes cultures') || x.includes('toute culture') || t === 'traitements generaux') tc = true;
    if (t) type = true;
  }
  return tc ? 'tc' : (type ? 'non' : 'nc');
}

// Les teneurs déclarées à l'AMM (« Azote (N) total (Min: 6.0 %, Max: 6.0 %) | … ») → {N, P, K, MO, C}, en %.
// Les lignes « dont … » et les formes « soluble dans l'eau » ne sont pas des totaux : ignorées.
function lireCompo(s) {
  const out = {};
  String(s == null ? '' : s).split('|').forEach(part => {
    const lab = norm(part.split('(Min')[0]);
    if (!lab || lab.startsWith('dont')) return;
    const m = part.match(/\(Min:\s*([\d.]+)/) || part.match(/Max:\s*([\d.]+)/);
    if (!m) return;
    const v = parseFloat(m[1]);
    if (!isFinite(v)) return;
    let k = null;
    if (/^(azote \(n\) total|azote total|n total|azote total \(n\))$/.test(lab)) k = 'N';
    else if (/^(anhydride phosphorique( \(p2o5\))?( total)?|p2o5 total|anhydride phosphorique \(p2o5\) total)$/.test(lab)) k = 'P';
    else if (/^(oxyde de potassium( \(k2o\))?( total)?|k2o total|oxyde de potassium \(k2o\) total|oxyde de potassium total \(k2o\))$/.test(lab)) k = 'K';
    else if (/^(matieres? organiques?( totale)?( \(mo\))?)$/.test(lab)) k = 'MO';
    else if (/^carbone organique( \(c\))?( total)?$/.test(lab)) k = 'C';
    if (k && out[k] == null) out[k] = v;
  });
  return Object.keys(out).length ? out : null;
}

// La taille d'une valeur telle que Firestore la compte (« Storage size calculations ») :
// chaîne = octets UTF-8 + 1 · nombre = 8 · booléen et null = 1 · tableau = somme · map = somme(nom + 1 + valeur).
// Le JSON comptait environ 17 % de trop (guillemets, deux-points, virgules).
function tailleFs(v) {
  if (v == null || typeof v === 'boolean') return 1;
  if (typeof v === 'number') return 8;
  if (typeof v === 'string') return Buffer.byteLength(v, 'utf8') + 1;
  if (Array.isArray(v)) return v.reduce((a, x) => a + tailleFs(x), 0);
  if (typeof v === 'object') return Object.keys(v).reduce((a, k) => a + Buffer.byteLength(k, 'utf8') + 1 + tailleFs(v[k]), 0);
  return 8;
}

module.exports = { norm, VIGNE_RE, classeVigne, lireCompo, tailleFs };
