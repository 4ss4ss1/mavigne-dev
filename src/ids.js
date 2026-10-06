// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — LES IDENTIFIANTS PERMANENTS DES PARCELLES (IDS-1, lot 1 — §252)
// ════════════════════════════════════════════════════════════════════════════
// Aujourd'hui tout se relie par les NOMS (une entrée du journal porte `parcelle: 'Les Grandes Vignes'`) : renommer une
// parcelle détacherait son historique. IDS-1 donne à chaque parcelle un identifiant qui ne change jamais (`pid`) ;
// le nom devient une étiquette. Lot 1 : les parcelles et les entrées du journal REÇOIVENT leur `pid` — personne ne le
// lit encore (lot 2 : les écrans lisent par pid, et par le nom à défaut ; lot 3 : les anciennes entrées ; lot 4 :
// renommer).
// L'identifiant est DÉDUIT DU NOM au moment où il est posé (empreinte FNV-1a sur deux graines, ≈ 52 bits) : deux
// téléphones qui le posent en même temps posent LE MÊME — aucune course, aucune fusion à arbitrer. Une fois posé, il
// ne bouge plus, même si le nom change. Module PUR (ni window, ni document) : Node l'importe tel quel.

function _fnv(s, h) {
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
// 'p' + 32 bits en base 36 + 4 caractères d'une seconde empreinte (≈ 20,7 bits) : au plus 12 caractères.
export function mvPidDe(nom) {
  var s = String(nom == null ? '' : nom).normalize('NFC').trim();
  if (!s) return '';
  var a = _fnv(s, 2166136261), b = _fnv(s, 2538058380) % 1679616;
  return 'p' + a.toString(36) + ('000' + b.toString(36)).slice(-4);
}
// Chaque parcelle sans identifiant en reçoit un ; celles qui en ont un le GARDENT (même si leur nom a changé depuis).
// IDS-1 lot 2 (§253) — filet : deux parcelles qui partagent un identifiant (une fiche recopiée, par exemple) ne doivent
// pas se confondre. Celle dont le NOM donne cet identifiant le garde (sinon la première, dans l'ordre du document — le même
// sur tous les téléphones) ; les autres reçoivent celui de leur propre nom. Déterministe, donc sans course.
export function mvIdsParcelles(parcelles) {
  var n = 0, L = Array.isArray(parcelles) ? parcelles : [];
  L.forEach(function (p) {
    if (p && typeof p === 'object' && !p.pid && p.nom) { p.pid = mvPidDe(p.nom); n++; }
  });
  var par = Object.create(null);
  L.forEach(function (p) { if (p && p.pid) (par[p.pid] = par[p.pid] || []).push(p); });
  Object.keys(par).forEach(function (pid) {
    var g = par[pid]; if (g.length < 2) return;
    var garde = g.filter(function (p) { return mvPidDe(p.nom) === pid; })[0] || g[0];
    g.forEach(function (p) {
      if (p === garde) return;
      var neuf = mvPidDe(p.nom);
      if (neuf && neuf !== pid && !par[neuf]) { p.pid = neuf; par[neuf] = [p]; n++; }
    });
  });
  return n;
}
// Nom → identifiant, d'après les parcelles connues (l'identifiant posé, ou celui que le nom donnerait).
export function mvCarteParcelles(parcelles) {
  var c = Object.create(null);
  (Array.isArray(parcelles) ? parcelles : []).forEach(function (p) {
    if (p && typeof p === 'object' && p.nom) c[p.nom] = p.pid || mvPidDe(p.nom);
  });
  return c;
}
// Chaque entrée du journal rattachée à une parcelle CONNUE reçoit son identifiant ; une entrée qui en a un le garde ;
// un nom inconnu (parcelle disparue, « domaine entier »…) n'en reçoit pas — le lot 3 s'en chargera.
export function mvIdsJournal(journal, carte) {
  var n = 0;
  (Array.isArray(journal) ? journal : []).forEach(function (e) {
    if (e && typeof e === 'object' && !e.pid && typeof e.parcelle === 'string' && carte && carte[e.parcelle]) { e.pid = carte[e.parcelle]; n++; }
  });
  return n;
}

// ★★ IDS-1, lot 2 (§253) — LE NOM SUIT L'IDENTIFIANT. Les écrans relient tout par les noms (325 comparaisons) ; plutôt que
//   de les reprendre une à une, le nom porté par une entrée est tenu À JOUR d'après son identifiant : l'identifiant fait
//   foi, le nom n'est plus qu'une étiquette recopiée. Aujourd'hui sans effet (l'identifiant vient du même nom) ; le jour où
//   une parcelle est renommée (lot 4), toutes ses entrées — y compris celles écrites plus tard par un téléphone resté hors
//   ligne — prennent le nouveau nom, et chaque écran retrouve son historique sans avoir été touché.
// Identifiant → nom actuel. Un identifiant porté par PLUSIEURS parcelles est écarté : jamais un nom deviné.
export function mvNomsParPid(parcelles) {
  var c = Object.create(null), vu = Object.create(null);
  (Array.isArray(parcelles) ? parcelles : []).forEach(function (p) {
    if (!p || typeof p !== 'object' || !p.pid || !p.nom) return;
    vu[p.pid] = (vu[p.pid] || 0) + 1; c[p.pid] = p.nom;
  });
  Object.keys(vu).forEach(function (k) { if (vu[k] > 1) delete c[k]; });
  return c;
}
// Chaque entrée dont l'identifiant est connu prend le nom ACTUEL de sa parcelle. Sans identifiant, ou identifiant inconnu
// (parcelle disparue) : l'entrée garde son nom.
export function mvNomsJournal(journal, nomsParPid) {
  var n = 0;
  (Array.isArray(journal) ? journal : []).forEach(function (e) {
    if (e && typeof e === 'object' && e.pid && nomsParPid && nomsParPid[e.pid] && e.parcelle !== nomsParPid[e.pid]) { e.parcelle = nomsParPid[e.pid]; n++; }
  });
  return n;
}
