/* ═══════════════════════════════════════════════════════════════════════════
   MA VIGNE — tutos-reserve.js — LES TUTOS DU MODULE « Réserve »
   ★ COULEUR-1 (§625) : sortis de src/tutos.js, qui ne garde que le moteur et le domaine d'entraînement.
   Écrire un tuto : la tête de src/tutos.js (« AJOUTER UN TUTO ») et sa partie « 3. LES TUTOS ».
   L'ordre de cette liste est celui du catalogue, dans le module ; l'ordre des modules se règle dans src/tutos.js.
   Les outils du moteur qu'elle lit (ci-dessous) lui sont POSÉS par _tuOutils, au chargement de src/tutos.js,
   avant le premier tuto : une liste ne les redéfinit pas. Un outil nouveau s'ajoute ici ET dans _TU_OUTILS
   (src/tutos.js) — scripts/mv-harnais-couleur1.mjs refuse un outil lu et pas posé.
   ═══════════════════════════════════════════════════════════════════════════ */
var _q = null, L = null, _tuPiquets = null, _ouvert = null;   // les outils du moteur (src/tutos.js), posés par _tuOutils
export function _tuOutils(o) { _q = o._q; L = o.L; _tuPiquets = o._tuPiquets; _ouvert = o._ouvert; }
export var TU_TUTOS_RESERVE = [
  // ★ INTRANT-1 (§553) — corriger une fiche d'intrant : des piquets saisis en kg, repassés en pièces (le cas remonté du terrain).
  //   Il couvre l'onglet Intrants, « Modifier », le choix de l'unité et « Enregistrer » ; « Retirer » un achat et
  //   « Supprimer » la fiche disent ce qu'ils font et se rattrapent par « Annuler » (exemptés motivés).
  { id: 'intrant', titre: 'Comment faire pour corriger une fiche d’intrant\u00a0?', fin: 'corriger une fiche d’intrant',
    module: 'Réserve', pages: ['reserve'], pour: 'admin', duree: '1 min', depart: 'home',
    couvre: ['_rsvTabTo', '_rsvOpenProd', '_rsvPfMaj', '_rsvSaveProd'],
    retenir: ['Réserve › onglet Intrants › « Modifier » sur la fiche.',
              'Changer l’unité corrige l’étiquette : le nombre déjà saisi ne bouge pas (500 kg deviennent 500 pièces).',
              'Dans la même fenêtre, « Retirer » enlève un achat mal saisi ; une fiche en trop se supprime tout en bas.'],
    etapes: [
      { type: 'aller', page: 'reserve', pourquoi: 'Les intrants se suivent dans le module Réserve.' },
      { type: 'toucher', chemin: true, cible: '[data-tuto="rsv.intrants"]',
        txt: function () { return '{T} l’onglet « ' + (L('[data-tuto="rsv.intrants"]') || 'Intrants') + ' ».'; },
        fait: function () { var b = _q('[data-tuto="rsv.intrants"]'); return !!(b && b.classList.contains('on')); },
        ok: 'Voici les intrants suivis, chacun avec son stock.' },
      { type: 'toucher', cible: '[data-tuto="rsv.modifier"][data-pid="tu-piq"]',
        txt: function () { return 'Les piquets ont été enregistrés en kg au lieu de pièces. {T} « ' + (L('[data-tuto="rsv.modifier"][data-pid="tu-piq"]') || 'Modifier') + ' » sur leur fiche.'; },
        fait: function () { return _ouvert('ovRsvProd') && !!_q('[data-tuto="rsv.unite"]'); },
        ok: 'La fiche s’ouvre : son nom, son type, son unité, et ses achats en dessous.' },
      { type: 'taper', cible: '[data-tuto="rsv.unite"]', exemple: 'pièce',
        txt: function () { return 'Dans « Unité », choisissez « pièce ».'; }, txtReel: 'l’unité qui convient.',
        valide: function (x) { return x === 'pièce'; },
        ok: function () { return L('#mvr-pf-unote') || 'Le nombre ne change pas : 500 kg deviennent 500 pièces.'; } },
      { type: 'toucher', cible: '[data-tuto="rsv.pf.save"]',
        txt: function () { return '{T} « ' + (L('[data-tuto="rsv.pf.save"]') || 'Enregistrer') + ' ».'; },
        fait: function () { var p = _tuPiquets(); return !_ouvert('ovRsvProd') && !!(p && p.unite === 'pièce'); },
        ok: 'La fiche est corrigée.' },
      { type: 'regarder', cible: '[data-tuto="rsv.stock"][data-pid="tu-piq"]',
        txt: function () { var b = '[data-tuto="rsv.stock"][data-pid="tu-piq"]'; return 'La fiche compte maintenant ses piquets en pièces\u00a0: ' + (L(b + ' .mvr-psv') + '\u00a0' + L(b + ' .mvr-psu')).trim() + ', le même nombre. Sur votre domaine, rien n’a bougé\u00a0: c’était un entraînement.'; } }
    ] },
];
