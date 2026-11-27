/* ═══════════════════════════════════════════════════════════════════════════
   MA VIGNE — tutos-tracteur.js — LES TUTOS DU MODULE « Tracteur »
   ★ COULEUR-1 (§625) : sortis de src/tutos.js, qui ne garde que le moteur et le domaine d'entraînement.
   Écrire un tuto : la tête de src/tutos.js (« AJOUTER UN TUTO ») et sa partie « 3. LES TUTOS ».
   L'ordre de cette liste est celui du catalogue, dans le module ; l'ordre des modules se règle dans src/tutos.js.
   Les outils du moteur qu'elle lit (ci-dessous) lui sont POSÉS par _tuOutils, au chargement de src/tutos.js,
   avant le premier tuto : une liste ne les redéfinit pas. Un outil nouveau s'ajoute ici ET dans _TU_OUTILS
   (src/tutos.js) — scripts/mv-harnais-couleur1.mjs refuse un outil lu et pas posé.
   ═══════════════════════════════════════════════════════════════════════════ */
var _q = null, L = null, _num = null, _nb = null, _tuSess = null, _tuEqOuverte = null, _ouvert = null, _gnr = null, _tuJour = null;   // les outils du moteur (src/tutos.js), posés par _tuOutils
export function _tuOutils(o) { _q = o._q; L = o.L; _num = o._num; _nb = o._nb; _tuSess = o._tuSess; _tuEqOuverte = o._tuEqOuverte; _ouvert = o._ouvert; _gnr = o._gnr; _tuJour = o._tuJour; }
export var TU_TUTOS_TRACTEUR = [
  // ★ COEQ-3 (§524) — le coéquipier du tracteur (COEQ-2, §523) : le changer en cours de session (le tractoriste), le corriger après coup (l'admin).
  { id: 'coeq-changer', titre: 'Comment faire pour changer de coéquipier\u00a0?', fin: 'changer de coéquipier',
    module: 'Tracteur', pages: ['tracteur'], pour: 'tractoriste', duree: '1 min', depart: 'home',
    couvre: ['openSdEqChanger', 'saveSdEqChanger'],
    retenir: ['Tracteur › la session en cours › « Enregistrer l’avancement ».',
              'Sous le tracteur, le cadre du coéquipier : « Changer », puis qui, puis « Maintenant » ou « Depuis ce matin ».',
              'Les parcelles déjà faites gardent leur coéquipier ; « Annuler » remet tout comme avant.'],
    etapes: [
      { type: 'aller', page: 'tracteur', pourquoi: 'Le coéquipier se change dans la session, au Tracteur.' },
      { type: 'toucher', cible: '[data-tuto="trac.encours.av"]',
        txt: function () { return 'L’ensemencement est en cours : Paul conduit, Jean l’accompagne. {T} « ' + (L('[data-tuto="trac.encours.av"]') || 'Enregistrer l’avancement') + ' ».'; },
        fait: function () { return _ouvert('ovSessionDetail'); },
        ok: 'La feuille de la session est ouverte.' },
      { type: 'toucher', cible: '[data-tuto="trac.eq.changer"]',
        txt: function () { return 'Sous le tracteur, le cadre du coéquipier dit « ' + L('#sd-eq-encart .sdeq-t') + ' ». {T} « Changer ».'; },
        fait: function () { return _tuEqOuverte('[data-tuto="trac.eq.q"]'); },
        ok: 'La feuille « Changer de coéquipier » s’ouvre.' },
      { type: 'choisir', options: ['[data-tuto="trac.eq.q"][data-n="Sophie"]'],
        txt: function () { return 'Jean part à la vigne, Sophie prend sa place : touchez Sophie. « Maintenant » est déjà choisi.'; },
        txtReel: 'touchez la personne qui prend la place.' },
      { type: 'toucher', cible: '[data-tuto="trac.eq.ok"]',
        txt: function () { return '{T} « ' + L('[data-tuto="trac.eq.ok"]') + ' ».'; },
        fait: function () { var s = _tuSess(); return !!(s && s.coequipier === 'Sophie'); },
        ok: 'C’est fait : la prochaine parcelle prendra Sophie.' },
      { type: 'regarder', cible: '#sd-eq-encart',
        txt: function () { return 'Le cadre dit maintenant « ' + L('#sd-eq-encart .sdeq-t') + ' ». Plus bas, les parcelles déjà faites gardent Jean. Sur votre domaine, rien n’a bougé\u00a0: c’était un entraînement.'; } }
    ] },
  { id: 'coeq-corriger', titre: 'Comment faire pour corriger le coéquipier d’une session\u00a0?', fin: 'corriger le coéquipier d’une session',
    module: 'Tracteur', pages: ['tracteur'], pour: 'admin', duree: '1 min', depart: 'home',
    couvre: ['openSdEqCorriger', 'saveSdEqCorriger'],
    retenir: ['Tracteur › la session › « Faites, jour par jour » : chaque jour dit qui était là.',
              '« Corriger » sur un jour : qui était là, puis les parcelles — celles du jour sont cochées d’office.',
              'La correction est signée. L’administrateur corrige tout, même une session terminée (sur ordinateur : la fiche de la session, « Corriger »).'],
    etapes: [
      { type: 'aller', page: 'tracteur', pourquoi: 'Le coéquipier se corrige dans la session, au Tracteur.' },
      { type: 'toucher', cible: '[data-tuto="trac.encours.av"]',
        txt: function () { return 'L’ensemencement a commencé hier. {T} « ' + (L('[data-tuto="trac.encours.av"]') || 'Enregistrer l’avancement') + ' ».'; },
        fait: function () { return _ouvert('ovSessionDetail'); },
        ok: 'La feuille de la session est ouverte.' },
      { type: 'toucher', get cible() { return '[data-tuto="trac.eq.corriger"][data-j="' + _tuJour(-1) + '"]'; },
        txt: function () { return 'Plus bas, « Faites, jour par jour ». Hier, c’est Sophie qui accompagnait Paul, pas Jean. {T} « Corriger » sur la journée d’hier.'; },
        fait: function () { return _tuEqOuverte('[data-tuto="trac.eq.cq"]'); },
        ok: 'La feuille « Corriger le coéquipier » s’ouvre, les parcelles d’hier déjà cochées.' },
      { type: 'choisir', options: ['[data-tuto="trac.eq.cq"][data-n="Sophie"]'],
        txt: function () { return 'Qui était là\u00a0? Touchez Sophie.'; },
        txtReel: 'touchez la personne qui était vraiment là.' },
      { type: 'toucher', cible: '[data-tuto="trac.eq.ok"]',
        txt: function () { return '{T} « ' + L('[data-tuto="trac.eq.ok"]') + ' ».'; },
        fait: function () { var s = _tuSess(), h = _tuJour(-1); return !!s && typeof window._trJourDe === 'function' && (s.parcellesFaites || []).filter(function (x) { return window._trJourDe(s, x) === h; }).every(function (x) { return x.co === 'Sophie'; }); },
        ok: 'La journée d’hier est corrigée, et la correction signée.' },
      { type: 'regarder', cible: '#sd-faites',
        txt: function () { return 'Hier dit maintenant « avec Sophie », et ses jalons suivent. Sur votre domaine, rien n’a bougé\u00a0: c’était un entraînement.'; } }
    ] },
  { id: 'gnr', titre: 'Comment faire pour noter un plein de GNR\u00a0?', fin: 'noter un plein de GNR',
    module: 'Tracteur', pages: ['tracteur'], pour: 'admin', duree: '1 min', depart: 'home',
    couvre: ['openGnrAppoint', 'saveGnrAppoint'],
    retenir: ['Tracteur › onglet Entretien.',
              '« Appoint de cuve » : les litres, et le prix s’il est sur la facture.',
              '« Enregistrer l’appoint » : la cuve remonte, le coût du GNR suit.'],
    avant: function (memo) { memo.gnr0 = _gnr().niveau; },
    etapes: [
      { type: 'aller', page: 'tracteur', pourquoi: 'Le plein de la cuve se note dans le module Tracteur.' },
      { type: 'toucher', chemin: true, cible: '[data-tuto="trac.entretien"]',
        txt: function () { return '{T} l’onglet « ' + L('[data-tuto="trac.entretien"]') + ' ».'; },
        fait: function () { var b = _q('[data-tuto="trac.entretien"]'); return !!(b && b.classList.contains('active')); },
        ok: 'Voici l’entretien : la cuve GNR y a sa carte.' },
      { type: 'toucher', cible: '[data-tuto="gnr.appoint"]',
        txt: function () { var g = _gnr(); return 'La cuve est à ' + _nb(g.niveau) + ' litres sur ' + _nb(g.capacite) + '. {T} « ' + L('[data-tuto="gnr.appoint"]') + ' ».'; },
        fait: function () { return !!_q('[data-tuto="gnr.litres"]'); },
        ok: 'Le formulaire d’appoint est ouvert.' },
      { type: 'taper', cible: '[data-tuto="gnr.litres"]', exemple: '800',
        txt: function () { return 'Tapez les litres livrés, par exemple 800.'; }, txtReel: 'les litres de votre bon de livraison.',
        valide: function (x) { var n = _num(x); return n > 0 && n <= 20000; },
        ok: function (x) { return _nb(_num(x)) + ' litres : c’est noté.'; } },
      { type: 'taper', facultatif: true, cible: '[data-tuto="gnr.prix"]', exemple: '1.24',
        txt: function () { return 'Le prix du litre est sur la facture : tapez-le, par exemple 1,24. Vous ne l’avez pas ? Passez.'; }, txtReel: 'le prix du litre de votre facture, si vous l’avez.',
        reel: function () { var l = _q('[data-tuto="gnr.litres"]'), p = _q('[data-tuto="gnr.prix"]'); return !!(l && p && _num(l.value) > 0 && _num(p.value) > 0 && _num(p.value) < 10); },
        valide: function (x) { var n = _num(x); return n > 0 && n < 10; },
        ok: function () { return 'Ce prix ira dans le coût du GNR, au Pilotage.'; } },
      { type: 'toucher', cible: '[data-tuto="gnr.save"]',
        txt: function () { return '{T} « ' + L('[data-tuto="gnr.save"]') + ' ».'; },
        fait: function (memo) { return !_q('[data-tuto="gnr.litres"]') && _gnr().niveau > (memo.gnr0 || 0); },
        ok: 'Le message vert confirme l’appoint.' },
      { type: 'regarder', cible: '[data-tuto="gnr.carte"]',
        txt: function () { var g = _gnr(); return 'La cuve remonte à ' + _nb(g.niveau) + ' litres sur ' + _nb(g.capacite) + '. Sur votre domaine, rien n’a bougé : c’était un entraînement.'; } }
    ] },
];
