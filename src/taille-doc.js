// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — LA TAILLE D'UN DOCUMENT FIRESTORE, EN OCTETS (TAILLE-2, §246)
// ════════════════════════════════════════════════════════════════════════════
// UNE seule règle, deux lecteurs :
//   - src/firebase.js, AVANT chaque envoi (fbSave, file hors ligne) : au-delà de 90 % de la limite, une alerte
//     silencieuse remonte à la console GUERETTECH ; au-delà de la limite, rien ne part (le serveur refuserait).
//   - scripts/mv-taille-docs.mjs (npm run taille), dont l'auto-contrôle `--test`, joué par check, rejoue l'exemple de la
//     documentation Firestore (147 octets) : si cette règle dérive, check rougit — pour le script ET pour l'appli.
// Module PUR : ni window, ni document, ni Buffer — Node l'importe tel quel.
//
// La règle publiée par Firestore (« Storage size calculations ») :
//   nom du document : chaque segment du chemin = octets UTF-8 + 1, plus 16
//   chaîne = octets UTF-8 + 1 · booléen, null = 1 · nombre = 8
//   tableau = somme des valeurs · objet = somme (octets de la clé + 1 + valeur)
//   document = nom + champs + 32
// Firestore REFUSE tout document au-delà de 1 Mio (1 048 576 octets).

export const MV_LIMITE_DOC = 1048576;

// Octets UTF-8 d'une chaîne, sans allouer de tampon (le journal entier est parcouru à chaque envoi). Une moitié de
// paire isolée compte 3 octets, comme le caractère de remplacement qu'écrit l'encodeur (et Buffer.byteLength).
export function mvOctetsTexte(s) {
  s = String(s);
  var n = 0;
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {
      var d = s.charCodeAt(i + 1);
      if (d >= 0xDC00 && d <= 0xDFFF) { n += 4; i++; } else n += 3;
    } else n += 3;
  }
  return n;
}

export function mvOctetsValeur(v) {
  if (v === null || v === undefined) return 1;
  if (typeof v === 'boolean') return 1;
  if (typeof v === 'number') return 8;
  if (typeof v === 'string') return mvOctetsTexte(v) + 1;
  if (Array.isArray(v)) { var s = 0; for (var i = 0; i < v.length; i++) s += mvOctetsValeur(v[i]); return s; }
  if (typeof v === 'object') {
    var t = 0, ks = Object.keys(v);
    for (var j = 0; j < ks.length; j++) t += mvOctetsTexte(ks[j]) + 1 + mvOctetsValeur(v[ks[j]]);
    return t;
  }
  return 8;
}

export function mvOctetsNom(segments) {
  var s = 16;
  for (var i = 0; i < segments.length; i++) s += mvOctetsTexte(segments[i]) + 1;
  return s;
}

export function mvOctetsDoc(segments, champs) {
  return mvOctetsNom(segments) + mvOctetsValeur(champs) + 32;
}
