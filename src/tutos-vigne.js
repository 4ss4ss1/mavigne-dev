/* ═══════════════════════════════════════════════════════════════════════════
   MA VIGNE — tutos-vigne.js — LES TUTOS DU MODULE « Vigne »
   ★ COULEUR-1 (§625) : sortis de src/tutos.js, qui ne garde que le moteur et le domaine d'entraînement.
   Écrire un tuto : la tête de src/tutos.js (« AJOUTER UN TUTO ») et sa partie « 3. LES TUTOS ».
   L'ordre de cette liste est celui du catalogue, dans le module ; l'ordre des modules se règle dans src/tutos.js.
   Les outils du moteur qu'elle lit (ci-dessous) lui sont POSÉS par _tuOutils, au chargement de src/tutos.js,
   avant le premier tuto : une liste ne les redéfinit pas. Un outil nouveau s'ajoute ici ET dans _TU_OUTILS
   (src/tutos.js) — scripts/mv-harnais-couleur1.mjs refuse un outil lu et pas posé.
   ═══════════════════════════════════════════════════════════════════════════ */
var _q = null, L = null, _vis = null, _ouvert = null, _rctT = null, _obsN = null, _phenoT = null, _jeqCorrigee = null;   // les outils du moteur (src/tutos.js), posés par _tuOutils
export function _tuOutils(o) { _q = o._q; L = o.L; _vis = o._vis; _ouvert = o._ouvert; _rctT = o._rctT; _obsN = o._obsN; _phenoT = o._phenoT; _jeqCorrigee = o._jeqCorrigee; }
// Propre à cette liste (« equipes ») : lu AU CHARGEMENT (`zone: _zoneEquipe`), il ne peut pas être un outil posé après.
// Dans la fenêtre « Équipes du jour », une personne = son nom + sa rangée de choix.
function _zoneEquipe(chip) {
  var pk = chip && chip.parentNode;
  if (!pk) return [];
  var nom = pk.previousElementSibling;
  return nom ? [nom, pk] : [pk];
}
export var TU_TUTOS_VIGNE = [
  // ★ YALLER-1 (§527) — retrouver une parcelle dans tout le domaine, et l’itinéraire dans le GPS du téléphone.
  { id: 'yaller', titre: 'Comment faire pour aller à une parcelle\u00a0?', fin: 'aller à une parcelle',
    module: 'Vigne', pages: ['parcelles'], pour: 'tous', duree: '1 min', depart: 'parcelles',
    couvre: ['_mvYAller'],
    retenir: ['Vigne › Parcelles : tapez une partie du nom dans la recherche, en bas — tout le domaine répond, les accents ne comptent pas.',
              '« Y aller » sur la parcelle trouvée, ou en tête de sa fiche : le GPS du téléphone s’ouvre sur l’itinéraire.',
              'L’appli GPS se choisit au premier appui ; « Changer » dans la fiche, ou Réglages › Moi, la modifie.'],
    etapes: [
      { type: 'taper', cible: '#pSearch', exemple: 'moulin',
        txt: function () { return 'Tapez une partie du nom dans la recherche, par exemple «\u00a0moulin\u00a0».'; }, txtReel: 'une partie du nom de la parcelle.',
        valide: function (x) { return String(x || '').trim().length >= 2; },
        ok: 'Tout le domaine répond, accents et majuscules ignorés.' },
      { type: 'toucher', cible: '[data-tuto="parc.yaller"][data-n="Clos du Moulin"]',
        txt: function () { return 'Le Clos du Moulin est trouvé. {T} «\u00a0Y aller\u00a0».'; },
        fait: function () { return _ouvert('ovYAller'); },
        ok: 'La première fois, l’appli demande avec quel GPS y aller.' },
      { type: 'regarder', cible: '#ya-apps',
        txt: function () { return 'Choisissez l’appli : elle s’ouvre sur l’itinéraire, guidage lancé, et le choix reste sur ce téléphone. Sur votre domaine, rien n’a bougé\u00a0: c’était un entraînement.'; } }
    ] },
  // ★ ACCV-4 (§419) : corriger l'équipe d'une validation, au Journal (administrateur).
  { id: 'jequipe', titre: 'Comment faire pour corriger l’équipe d’une validation\u00a0?', fin: 'corriger l’équipe d’une validation',
    module: 'Vigne', pages: ['journal'], pour: 'admin', duree: '1 min', depart: 'journal',
    couvre: ['openJEquipe', '_jEqBasc', 'saveJEquipe'],
    avant: function (m) { m.jeq0 = new Date().toISOString(); },   // ★ TUTO-9 (§423) : l'heure du départ, pour l'étape 3
    retenir: ['Journal › bouton « Équipe » sur une validation (administrateur).',
              'Cochez qui a vraiment travaillé ; celui qui a validé peut rester décoché : il reste l’auteur de l’entrée.',
              '« Toute la journée » corrige d’un coup les validations de la même tâche, le même jour.'],
    etapes: [
      { type: 'toucher', cible: '[data-tuto="journal.equipe"]',
        txt: function () { return 'Vous êtes dans le Journal. Chaque validation porte un bouton « Équipe ». {T} celui de la première.'; },
        fait: function () { return _ouvert('ovJEquipe'); },
        ok: 'La fenêtre « Qui a fait ce travail ? » s’est ouverte.' },
      { type: 'choisir', options: ['[data-jeq-n="Jean"]', '[data-jeq-n="Sophie"]'], zone: function () { var z = _q('#jeq-pick'); return z ? [z] : []; },   // TUTO-9 : une LISTE (le moteur la parcourt)
        txt: function () { return 'Cochez Jean et Sophie : ce sont eux qui ont fait le travail. Celui qui a validé peut rester décoché.'; },
        txtReel: 'cochez qui a vraiment travaillé' },
      { type: 'toucher', cible: '[data-tuto="journal.equipe.ok"]',
        txt: function () { return '{T} « Enregistrer ». L’entrée garde la trace de la correction.'; },
        // ★ TUTO-9 (§423) : « la fenêtre est fermée » était vrai AVANT même de l'ouvrir — côté domaine, le panneau voyait
        //   l'étape 3 faite dès l'étape 1 (saut d'étape, la règle de TUTO-7). Fait = fenêtre refermée ET une validation corrigée
        //   depuis le départ du tuto (la trace « Équipe corrigée par… » que pose saveJEquipe).
        fait: function (memo) { return !_ouvert('ovJEquipe') && _jeqCorrigee(memo); },
        ok: 'L’équipe est corrigée : la saison de chacun suit.' }
    ] },
  { id: 'equipes', titre: 'Comment faire pour indiquer les équipes du jour\u00a0?', fin: 'indiquer les équipes du jour',
    module: 'Vigne', pages: ['home'], pour: 'admin', duree: '1 min', depart: 'home',
    couvre: ['openEqJour', '_mvEqPick', 'saveEqJour'],
    retenir: ['Accueil › pastille « Équipes du jour ».',
              'Tout le monde arrive en Équipe 1. Pour mettre quelqu’un seul, donnez-lui une équipe à lui.',
              '« Enregistrer » : les équipes restent en place les jours suivants, jusqu’à ce que vous les changiez.'],
    etapes: [
      { type: 'toucher', cible: '[data-tuto="home.eqj"]',
        txt: function () { return 'Vous commencez sur l’Accueil. Les équipes du jour se règlent ici, sous la tâche prioritaire. {T} la pastille « ' + (L('[data-tuto="home.eqj"]').split(':')[0].trim() || 'Équipes du jour') + ' ».'; },
        fait: function () { return _ouvert('ovEqJour'); },
        reel: function (memo) { var o = _ouvert('ovEqJour'); if (o) { memo.eqjVu = true; memo.eqjAvant = L('#home-eqj-txt'); } return o; },
        ok: 'La fenêtre des équipes s’est ouverte.' },
      // ★ EQDEF-1 (§492) : plus de « Aucune » — tout le monde arrive en Équipe 1. Jean, Sophie et Marie y sont déjà : l'ancienne
      //   étape « Mettez Jean et Sophie dans Équipe 1 » se serait validée toute seule. Il reste le seul geste à apprendre : sortir
      //   quelqu'un de l'Équipe 1. TUTO-7 (§364) : pas de `reel` sur un choix — sur le vrai domaine, on ne sait pas qui le client
      //   déplace ; le panneau suit quand le client ENREGISTRE (étape suivante), et rejoue alors les choix d'un coup.
      { type: 'choisir', options: ['[data-eqj-n="Paul"][data-eqj-k="2"]'], zone: _zoneEquipe,
        txt: function () { return 'Tout le monde arrive dans « ' + L('[data-eqj-n="Jean"][data-eqj-k="1"]') + ' » : Jean, Sophie et Marie travailleront ensemble. Paul part seul au tracteur : mettez-le dans « ' + L('[data-eqj-n="Paul"][data-eqj-k="2"]') + ' », une équipe à lui.'; },
        txtReel: 'tout le monde arrive en Équipe 1 ; touchez l’équipe de ceux qui travaillent ailleurs — une équipe à lui pour quelqu’un de seul —, puis enregistrez.', cibleReel: '#eqj-rows',
        ok: 'Paul a son équipe à lui ; les autres restent ensemble.' },
      { type: 'toucher', cible: '[data-tuto="eqj.save"]',
        txt: function () { return '{T} « ' + L('[data-tuto="eqj.save"]') + ' ».'; },
        fait: function () { return !_ouvert('ovEqJour') && /Jean/.test(L('#home-eqj-txt')); },
        // TUTO-7 : la pastille « d'avant » est lue pendant que la fenêtre est ouverte chez le client (avant, elle pouvait être
        //   lue avant même d'être dessinée, et tout texte ensuite passait pour un enregistrement).
        reel: function (memo) {
          if (_ouvert('ovEqJour')) { memo.eqjVu = true; memo.eqjAvant = L('#home-eqj-txt'); return false; }
          return !!memo.eqjVu && L('#home-eqj-txt') !== memo.eqjAvant;
        },
        ok: 'C’est enregistré : le message vert le confirme.' },
      { type: 'regarder', cible: '[data-tuto="home.eqj"]',
        txt: function () { return 'La pastille dit maintenant « ' + L('#home-eqj-txt') + ' ». Chacun valide avec son équipe, sans pouvoir la changer. Demain, elles sont toujours là : elles restent en place jusqu’à ce que vous les changiez.'; } }
    ] },
  // ★ PHENO-1C (§508) : noter le stade d'une parcelle (administrateur) — le chemin de la fiche, qui marche en toute saison.
  { id: 'stade', titre: 'Comment faire pour noter le stade d’une parcelle\u00a0?', fin: 'noter le stade d’une parcelle',
    module: 'Vigne', pages: ['parcelles'], pour: 'admin', duree: '1 min', depart: 'parcelles',   // au téléphone, Parcelles n'est ni dans le dock ni dans « Plus » (un onglet de la Vigne) : le tuto y démarre, comme celui du Journal
    couvre: ['openDP', '_phenoNoter', '_phenoChoisir', '_phenoEnregistrer'],
    retenir: ['Depuis la fiche de la parcelle : « Noter le stade », le stade, « Enregistrer ».',
              'En saison (mars à septembre), l’onglet Stades de Parcelles est un relevé : un appui sur la ligne, un sur le stade.',
              'Un stade plus ancien que le dernier noté est grisé : la vigne ne revient pas en arrière.',
              '« Annuler » rattrape pendant six secondes.'],
    avant: function (memo) { memo.t0 = _phenoT(); },
    etapes: [
      { type: 'toucher', cible: '[data-tuto="parc.ligne"]',
        txt: function () { return '{T} une parcelle de la liste.'; },
        fait: function () { var b = _q('[data-tuto="dp.stade"]'); return !!(b && _vis(b)); },   // la fiche du téléphone (ovParcelle) ou la fiche à droite, sur ordinateur
        ok: 'Sa fiche s’ouvre ; la ligne « Stade » dit le dernier stade noté.' },
      { type: 'toucher', cible: '[data-tuto="dp.stade"]',
        txt: function () { return '{T} « ' + (L('[data-tuto="dp.stade"]') || 'Noter le stade') + ' ».'; },
        fait: function () { return _ouvert('ovPheno') && !!_q('[data-tuto="phn.stade"]'); },
        ok: 'Les stades de la vigne, avec leur code BBCH, du débourrement à la véraison.' },
      { type: 'toucher', cible: '[data-tuto="phn.stade"][data-b="57"]',
        txt: function () { return '{T} « Boutons séparés » (57).'; },
        fait: function () { var b = _q('[data-tuto="phn.stade"][data-b="57"]'); return !!(b && b.classList.contains('on')); },
        ok: 'Le stade est choisi ; la date est celle du jour.' },
      { type: 'toucher', cible: '[data-tuto="phn.ok"]',
        txt: function () { return '{T} « ' + (L('[data-tuto="phn.ok"]') || 'Enregistrer le stade') + ' ».'; },
        fait: function (memo) { return !_ouvert('ovPheno') && _phenoT() > (memo.t0 || ''); },
        ok: 'C’est noté : « Annuler » reste six secondes en bas de l’écran.' },
      { type: 'regarder', cible: '[data-tuto="dp.stade.v"]',
        txt: function () { return 'La fiche dit maintenant le stade noté. En saison, l’onglet Stades de Parcelles fait la même chose en deux appuis.'; } },
    ] },
  // ★ OBS-1B (§566) : signaler ce qu'on voit dans les rangs, depuis la fiche d'une parcelle (la photo et le GPS se sautent à l'entraînement).
  { id: 'signaler', titre: 'Comment faire pour signaler ce qu’on voit dans une parcelle\u00a0?', fin: 'signaler une observation',
    module: 'Vigne', pages: ['parcelles'], pour: 'tous', duree: '1 min', depart: 'parcelles',
    couvre: ['_obsSignaler', '_obsChoisir', '_obsEnregistrer'],
    retenir: ['Depuis la fiche de la parcelle : « Signaler », le type, l’intensité, une photo si besoin, « Enregistrer ».',
              'Le point GPS se prend tout seul ; sans réseau, le signalement part quand même.',
              'L’administrateur voit les signalements dans la fiche, sur la carte et dans « À savoir ».'],
    avant: function (memo) { memo.n0 = _obsN(); },
    etapes: [
      { type: 'toucher', cible: '[data-tuto="parc.ligne"]',
        txt: function () { return '{T} une parcelle de la liste.'; },
        fait: function () { var b = _q('[data-tuto="dp.obs"]'); return !!(b && _vis(b)); },
        ok: 'Sa fiche s’ouvre ; la ligne « Signalements » dit ceux de l’année.' },
      { type: 'toucher', cible: '[data-tuto="dp.obs"]',
        txt: function () { return '{T} « ' + (L('[data-tuto="dp.obs"]') || 'Signaler') + ' ».'; },
        fait: function () { return _ouvert('ovObs') && !!_q('[data-tuto="obs.type"]'); },
        ok: 'Le type, l’intensité, la photo, une note — et le point GPS, pris tout seul.' },
      { type: 'toucher', cible: '[data-tuto="obs.type"][data-k="oidium"]',
        txt: function () { return '{T} « Oïdium ».'; },
        fait: function () { var b = _q('[data-tuto="obs.type"][data-k="oidium"]'); return !!(b && b.classList.contains('on')); },
        ok: 'Le type est choisi ; l’intensité reste « Moyen » si on n’y touche pas.' },
      { type: 'toucher', cible: '[data-tuto="obs.ok"]',
        txt: function () { return '{T} « ' + (L('[data-tuto="obs.ok"]') || 'Enregistrer le signalement') + ' ».'; },
        fait: function (memo) { return !_ouvert('ovObs') && _obsN() > (memo.n0 || 0); },
        ok: 'C’est envoyé : l’administrateur le verra dans la fiche, sur la carte et dans « À savoir ».' },
      { type: 'regarder', cible: '[data-tuto="dp.obs.v"]',
        txt: function () { return 'La fiche compte maintenant ce signalement. Sur la carte du jour de l’Accueil, « Signaler » fait la même chose, la parcelle choisie d’abord.'; } },
    ] },
  // ★ RECOLTE-1B (§569) : compter les grappes d'une parcelle (administrateur), depuis sa fiche — toute l'année (décision de Nico, 13/11).
  { id: 'grappes', titre: 'Comment faire pour compter les grappes et prévoir la récolte\u00a0?', fin: 'compter les grappes d’une parcelle',
    module: 'Vigne', pages: ['parcelles'], pour: 'admin', duree: '1 min', depart: 'parcelles',
    couvre: ['_rctCompter', '_rctSaisie', '_rctEnregistrer'],
    retenir: ['Entre la fermeture de la grappe et la véraison, depuis la fiche : « Compter les grappes », dix pieds pris au hasard.',
              'L’appli calcule en direct les pieds présents, le poids et les hectolitres prévus.',
              'Cave › Le Cuvier › Récoltes › « Prévu » range la récolte prévue par cuvée.'],
    avant: function (memo) { memo.t0 = _rctT(); },
    etapes: [
      { type: 'toucher', cible: '[data-tuto="parc.ligne"]',
        txt: function () { return '{T} une parcelle de la liste.'; },
        fait: function () { var b = _q('[data-tuto="dp.rct"]'); return !!(b && _vis(b)); },
        ok: 'Sa fiche s’ouvre ; la ligne « Récolte prévue » dit le dernier comptage.' },
      { type: 'toucher', cible: '[data-tuto="dp.rct"]',
        txt: function () { return '{T} « ' + (L('[data-tuto="dp.rct"]') || 'Compter les grappes') + ' ».'; },
        fait: function () { return _ouvert('ovPheno') && !!_q('[data-tuto="rct.pied"]'); },
        ok: 'Dix champs, un par pied : on tape le nombre de grappes de chacun.' },
      { type: 'taper', cible: '[data-tuto="rct.pied"][data-i="0"]', exemple: '6',
        txt: function () { return 'Tapez le nombre de grappes du premier pied, par exemple «\u00a06\u00a0».'; }, txtReel: 'le nombre de grappes du premier pied.',
        valide: function (x) { return /^\d{1,2}$/.test(String(x || '').trim()); },
        ok: 'La moyenne et les hectolitres prévus se calculent en direct.' },
      { type: 'toucher', cible: '[data-tuto="rct.ok"]',
        txt: function () { return '{T} « ' + (L('[data-tuto="rct.ok"]') || 'Enregistrer le comptage') + ' ».'; },
        fait: function (memo) { return !_ouvert('ovPheno') && _rctT() > (memo.t0 || ''); },
        ok: 'C’est noté : la récolte prévue entre dans le volet « Prévu » des Récoltes.' },
      { type: 'regarder', cible: '[data-tuto="dp.rct.v"]',
        txt: function () { return 'La fiche dit maintenant la récolte prévue. Dans Cave › Le Cuvier › Récoltes, « Prévu » la range par cuvée, face au maximum de l’appellation.'; } },
    ] }
];
